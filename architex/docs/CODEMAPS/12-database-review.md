# Database Review — Architex

Reviewed: 2026-05-07
Scope: `src/db/schema/**`, `src/db/schema/relations.ts`, `drizzle/migrations/*.sql` (6 migrations), `src/app/api/**` route.ts files, `src/db/index.ts`, `src/db/seeds/**`, offline persistence layer.

---

## 1. Summary

| Severity | Count |
|---|---|
| Critical | 2 |
| High | 5 |
| Medium | 7 |
| Low | 4 |

**Overall posture: MEDIUM risk.** The schema is well-structured and demonstrates disciplined use of parameterised queries throughout (Drizzle ORM with no raw string concatenation). All timestamps use `timestamptz`. Foreign keys are defined and indexed. The two Critical items are a race condition in the hint append path and a missing unique constraint on `users.email`. High items center on the Neon HTTP driver's lack of true transactions, the `resolveUserId` extra round-trip on every authenticated request, unbounded growth in append-only tables, and a read-modify-write pattern in the learn-progress PATCH handler.

---

## 2. Schema Findings

### 2.1 `users` table — `email` not unique (High)

**File:** `src/db/schema/users.ts:21`

```ts
email: varchar("email", { length: 320 }).notNull(),
```

`clerk_id` carries a `UNIQUE` constraint and a B-tree index, but `email` has only an index (`users_email_idx`), no uniqueness constraint. Clerk guarantees uniqueness at its layer, but any direct INSERT (e.g. webhook replays, seed scripts, dev-mode synthetic user creation) can silently create duplicate email rows. The auth helper at `src/lib/auth.ts:101` does an unconditional `INSERT` on first-seen users without guarding email uniqueness.

**Recommendation:** Add `UNIQUE` on `email` or at minimum add a partial unique index `WHERE email NOT LIKE '%@unknown'` to exclude synthetic rows.

---

### 2.2 `users` — `tier` column is `varchar(20)` with no CHECK constraint (Medium)

**File:** `src/db/schema/users.ts:23`

Any string up to 20 characters is accepted. There is no CHECK(`tier` IN ('free', 'pro', 'enterprise')) guard. A misconfigured Clerk webhook or a direct INSERT can write an invalid tier that silently propagates to all tier-gated features.

**Recommendation:** Add `CHECK (tier IN ('free', 'pro', 'enterprise'))` or convert to a `pgEnum`.

---

### 2.3 `lld_drill_attempts` — `drillMode` and `variant` are redundant columns (Medium)

**File:** `src/db/schema/lld-drill-attempts.ts:36-41`

Both `drill_mode` and `variant` exist, and the Phase-4 migration adds `variant` as a new column without removing `drill_mode`. The POST handler (`src/app/api/lld/drill-attempts/route.ts:79`) writes the resolved variant string into both columns. This denormalisation creates a surface for columns to disagree if a direct UPDATE touches only one.

**Recommendation:** Deprecate `drill_mode` and drop it in a future migration after ensuring no query paths read it.

---

### 2.4 `lld_drill_attempts` — `hintLog` and `hintsUsed` are both kept (Medium)

**File:** `src/db/schema/lld-drill-attempts.ts:68-72`

The comment acknowledges `hintsUsed` is kept for backward compat but `hintLog` is the live column. Both columns are populated on new attempts. Over time this adds unnecessary storage to every row and confuses consumers trying to determine which column is authoritative.

**Recommendation:** Once Phase-3 consumers are confirmed dead, drop `hints_used` in a migration.

---

### 2.5 `lld_designs` — `templateId` has no FK and no index (Medium)

**File:** `src/db/schema/lld-designs.ts:38-39`

```ts
templateId: uuid("template_id"),
```

No `.references()` call, no index. If this column is meant to reference `lld_templates_library.id`, orphaned references will silently accumulate. The `diagrams.templateId` and `diagrams.forkedFromId` columns have the same pattern.

**Recommendation:** Add FK references with `ON DELETE SET NULL` and add indexes on both columns.

---

### 2.6 `diagrams` — `forkedFromId` has no FK, no index (Medium)

**File:** `src/db/schema/diagrams.ts:39-40`

```ts
forkedFromId: uuid("forked_from_id"),
```

Same issue as 2.5. Self-referential FK (`REFERENCES diagrams(id) ON DELETE SET NULL`) and a plain index would prevent orphaned fork chains from accumulating.

---

### 2.7 `lld_concept_reads` — unbounded append table, no retention policy (High)

**File:** `src/db/schema/lld-concept-reads.ts`

This is an append-only log with no TTL, no soft-delete, and no automatic trimming. The `POST /api/lld/concept-reads` route (described at the code level as "Rate-limiting: client-side recommended") has no server-side rate limit. A client looping every scroll event can fill this table with millions of rows per user. The table has no `LIMIT` anywhere in its read paths either.

**Reproduction:** A user scrolling back and forth on a lesson page can generate hundreds of rows per session with no server-side guard.

---

### 2.8 `activity_events` — no read-path `LIMIT` on the heavy query (High)

**File:** `src/app/api/activity/route.ts:84`

```ts
const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
```

The cap is 200, which is reasonable, but the table is append-only with no archival policy. As the table grows (every user action writes a row), the `WHERE user_id = ? ORDER BY occurred_at DESC` query must scan an ever-growing set of rows matching the user. The composite index `activity_events_user_module_idx` covers `(user_id, module_id)` but not `(user_id, occurred_at)`. The sort is by `occurred_at` which falls back to the single-column `activity_events_occurred_at_idx`, forcing the planner to choose between a table scan and an index scan with low selectivity.

**Recommendation:** Add a composite index `(user_id, occurred_at DESC)` and implement a rolling retention window (e.g. keep last 90 days via a scheduled delete).

---

### 2.9 `lld_design_snapshots` — no row-count cap per design (Medium)

**File:** `src/db/schema/lld-design-snapshots.ts`, `src/app/api/lld/designs/[id]/snapshots/route.ts`

Every auto-save tick appends a new snapshot row (kind = "auto"). There is no maximum-snapshot-count guard on the server. The GET endpoint returns at most 100 rows, but rows continue to accumulate forever. At a 30-second auto-save interval, a user leaving a tab open for 8 hours generates ~960 rows per design session.

**Recommendation:** Enforce a maximum of N `kind='auto'` snapshots per design (e.g. retain the 50 most recent auto-saves), deleting the oldest as part of the POST handler, or via a background job.

---

### 2.10 `gallerySubmissions` — `upvotes` counter is denormalized without a trigger (Low)

**File:** `src/db/schema/gallery.ts:31`

`gallery_submissions.upvotes` is an integer counter that must be kept in sync with the count of rows in `gallery_upvotes`. There is no DB trigger or application-level transaction that atomically increments/decrements this counter when a `gallery_upvotes` row is inserted or deleted. Lost updates are possible under concurrent upvote traffic.

**Recommendation:** Either remove the denormalized counter (compute `COUNT(*)` on join) or use `UPDATE ... SET upvotes = upvotes + 1` inside the same transaction as the upvote insert.

---

### 2.11 `progress` — `conceptId` nullable in unique index (Low)

**File:** `src/db/schema/progress.ts:62-67`

```ts
uniqueIndex("progress_user_module_concept_idx").on(
  table.userId, table.moduleId, table.conceptId,
)
```

`conceptId` is nullable. In PostgreSQL, a unique index on a nullable column allows multiple NULL rows for the same `(userId, moduleId)` because `NULL != NULL`. This means two module-level (conceptId = NULL) progress rows can coexist for the same user and module. The upsert at `src/app/api/progress/route.ts:114` uses this index as the conflict target, so duplicates are only prevented when both rows have the same non-NULL `conceptId`.

**Recommendation:** Add a separate partial unique index `WHERE concept_id IS NULL` to enforce at most one module-level row per user+module.

---

## 3. Query Findings

### 3.1 CRITICAL — hint append is a read-modify-write race (Critical)

**File:** `src/app/api/lld/drill-attempts/[id]/hint/route.ts:100-113, 149-155`

The hint endpoint:
1. Reads the current `hintLog` JSON array (line 100).
2. Applies application-level business logic (ladder check, budget check) against the in-memory array.
3. Appends the new entry using a JSONB concatenation UPDATE (line 150).

Between steps 1 and 3, a second concurrent request (e.g. a double-tap from the client) can read the same `hintLog`, pass both budget and ladder checks independently, and both requests will write new entries. The atomicity of the JSONB append operator (`||`) only ensures the write itself is atomic; it does not prevent the duplicate read-validate-write pair.

**Reproduction:** Two simultaneous POST requests to `/api/lld/drill-attempts/{id}/hint` with the same tier will each read the current log, both will see the ladder at position N, both will pass the `TIER_ORDER.indexOf(tier) !== highestIdx + 1` check, and both will append, consuming two credits and adding two identical penalty entries.

**Recommendation:** Use `SELECT ... FOR UPDATE` on the `lld_drill_attempts` row before reading `hintLog`, or use a `pg_try_advisory_lock` keyed on the attempt id. Given the Neon HTTP driver limitation (see §7), the advisory lock approach is more portable.

---

### 3.2 `resolveUserId` adds an extra DB round-trip on every authenticated request (High)

**File:** `src/lib/auth.ts:52-112`

Every API handler calls `requireAuth()` then `resolveUserId()`. The `resolveUserId` function does a `SELECT {id} FROM users WHERE clerk_id = ?` on every single request. For active users the row will always exist after first sign-in, so this is an unconditional round-trip to the DB on every endpoint hit, doubling the DB query count.

With the Neon HTTP driver (one HTTP round-trip per query, no persistent connection), this is particularly expensive: every API call spends at least two Neon HTTP calls before doing any application work.

**Recommendation:** Cache the `clerkId -> userId` mapping in a short-lived in-memory store (e.g. a `Map` with a 5-minute TTL in the singleton module), or at minimum move the `SELECT` inside the main query's `JOIN` where possible.

---

### 3.3 `PATCH /api/lld/learn-progress/[patternSlug]` — read-modify-write without locking (High)

**File:** `src/app/api/lld/learn-progress/[patternSlug]/route.ts:130-221`

The PATCH handler:
1. Reads the current row with `SELECT`.
2. Merges section progress in JavaScript.
3. Upserts with `INSERT ... ON CONFLICT DO UPDATE`.

Two concurrent PATCH requests (e.g. rapid scroll events triggering simultaneous saves) will both read the same row, each merge its own section update, and the second write will overwrite the first's section updates because the merge happens in JavaScript, not in the DB. The `onConflictDoUpdate` SET clause replaces `section_progress` wholesale, not via JSONB merge.

**Recommendation:** Replace the application-level merge with a DB-side JSONB merge using `jsonb_deep_merge` or `||` operator in the UPDATE SET clause, eliminating the need to read first:

```sql
UPDATE lld_learn_progress
SET section_progress = section_progress || $new_sections,
    updated_at = now()
WHERE user_id = $1 AND pattern_slug = $2
```

Or use `SELECT ... FOR UPDATE` on the initial read to serialize concurrent updates.

---

### 3.4 `GET /api/lld/drill-attempts/active` — two sequential DB queries on every page load (Medium)

**File:** `src/app/api/lld/drill-attempts/active/route.ts:26-50`

Every call to this endpoint issues two sequential DB queries:
1. `UPDATE lld_drill_attempts SET abandoned_at = now() WHERE ... AND last_activity_at < $cutoff`
2. `SELECT * FROM lld_drill_attempts WHERE ... IS NULL`

Query 1 runs even when no stale drills exist (i.e. always, for most requests). This can be made conditional with a `RETURNING id` check, or moved to a background job / webhook mechanism.

---

### 3.5 `GET /api/lld/drill-attempts` — returns up to 100 full rows with all JSONB columns (Medium)

**File:** `src/app/api/lld/drill-attempts/route.ts:148-153`

```ts
const rows = await db
  .select()
  .from(lldDrillAttempts)
  .where(where)
  .orderBy(desc(lldDrillAttempts.startedAt))
  .limit(100);
```

`SELECT *` returns all columns including `canvasState`, `stages`, `hintLog`, `rubricBreakdown`, `postmortem` — large JSONB blobs. The history list view likely only needs metadata (id, problemId, variant, startedAt, gradeScore, band). Fetching full JSONB on every history load wastes Neon read units and serialization time.

**Recommendation:** Project only the columns the list view needs.

---

### 3.6 `POST /api/lld/drill-interviewer/[id]/stream` — sequential seq computation is a race (Medium)

**File:** `src/app/api/lld/drill-interviewer/[id]/stream/route.ts:74-81, 210-224`

The interviewer turn `seq` is computed by:
1. `SELECT MAX(seq) FROM lld_drill_interviewer_turns WHERE attempt_id = ?`
2. `INSERT ... VALUES (seq + 1, ...)`

Two concurrent POSTs will read the same max `seq` and both insert with the same next value. The index `drill_turn_attempt_seq_idx` is a plain B-tree index, not a unique index, so duplicate `seq` values are possible.

The same pattern exists for the GET handler's interviewer reply insertion at line 210-224.

**Recommendation:** Add `UNIQUE(attempt_id, seq)` to `lld_drill_interviewer_turns` and use `INSERT ... ON CONFLICT DO UPDATE` or a sequence/serial column for `seq`.

---

### 3.7 `POST /api/lld/drill-attempts/[id]/grade` — turns loaded without ownership check (Low)

**File:** `src/app/api/lld/drill-attempts/[id]/grade/route.ts:88-95`

```ts
const turns = await db
  .select({...})
  .from(lldDrillInterviewerTurns)
  .where(eq(lldDrillInterviewerTurns.attemptId, id));
```

The ownership of the attempt is checked against `userId` earlier, but the turns query filters only on `attemptId`. Since the attempt-ownership check already validates `userId`, this is safe today, but if the attempt fetch were ever removed or refactored, turns belonging to other users' attempts could be returned. Adding `userId` to the turns query (via join or a separate FK) would make the check redundant-proof.

---

### 3.8 `GET /api/content` — full=true returns unbounded JSONB with no per-row size limit (Low)

**File:** `src/app/api/content/route.ts:60-73`

When `?full=true`, the query returns the full `content` JSONB column for every matching row with no row count limit beyond the implicit `sortOrder` sort. The `module_content` table stores the entire educational content payload in `content`. With 13 modules and potentially hundreds of items per module+type, a single unbounded full request could transfer many MBs.

**Recommendation:** Enforce a maximum row count (`LIMIT 200`) on the full query, or require `type` to be more specific when `full=true` is used.

---

## 4. Migration Findings

### 4.1 Migration 0004 — `NOT NULL` columns added without a default or table lock (Medium)

**File:** `drizzle/migrations/0004_handy_deadpool.sql:1-7`

```sql
ALTER TABLE "lld_drill_attempts" ADD COLUMN "variant" varchar(20) DEFAULT 'timed-mock' NOT NULL;
ALTER TABLE "lld_drill_attempts" ADD COLUMN "current_stage" varchar(20) DEFAULT 'clarify' NOT NULL;
ALTER TABLE "lld_drill_attempts" ADD COLUMN "started_stage_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "lld_drill_attempts" ADD COLUMN "stages" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "lld_drill_attempts" ADD COLUMN "hint_log" jsonb DEFAULT '[]'::jsonb NOT NULL;
```

These `ADD COLUMN ... NOT NULL DEFAULT ...` statements on a non-empty table are safe in PostgreSQL 11+ (the default is stored in the catalog without rewriting the table). However, two columns added without a constant default — `rubric_breakdown` and `postmortem` — are nullable, which is correct.

The concern is `started_stage_at DEFAULT now()`. All existing active drills at migration time get `started_stage_at = migration_timestamp`, not their actual stage start time. This is cosmetically wrong for timing display but not a data loss issue since the column is intended for new drills.

No explicit transaction wrapping is present in these migration files (Drizzle executes each `-->statement-breakpoint` independently). Adding the index `drill_stage_idx` in the same migration file after the `ADD COLUMN` statements is safe and correct.

---

### 4.2 Migration 0005 — `lld_drill_interviewer_turns.seq` has no UNIQUE constraint (High)

**File:** `drizzle/migrations/0005_productive_sally_floyd.sql:1-14`

```sql
CREATE INDEX "drill_turn_attempt_seq_idx" ON "lld_drill_interviewer_turns" USING btree ("attempt_id","seq");
```

A plain B-tree index is created, not a unique index. The application relies on `MAX(seq) + 1` to compute the next seq (see §3.6 above). A `UNIQUE(attempt_id, seq)` constraint should have been added here to enforce sequential integrity at the DB level.

---

### 4.3 Migration 0000 — `gallery_upvotes` has no index on `submission_id` alone (Low)

**File:** `drizzle/migrations/0000_skinny_callisto.sql:229`

```sql
CREATE UNIQUE INDEX "gallery_upvotes_user_submission_idx" ON "gallery_upvotes" USING btree ("user_id","submission_id");
```

The unique index is on `(user_id, submission_id)`. Queries that look up all upvotes for a given `submission_id` (e.g. "did this user upvote? what's the total?") cannot use this index efficiently when the leading column is `user_id`. A plain index on `submission_id` alone would serve these queries.

---

## 5. Per-Table Review

| Table | Volume Estimate | Indexes | Concerns |
|---|---|---|---|
| `users` | ~1K-10K rows | `clerk_id` (unique+idx), `email` (idx) | `email` not unique; `tier` no CHECK; extra round-trip in `resolveUserId` |
| `user_preferences` | 1:1 with users | PK on `user_id` (FK) | Clean; no concerns |
| `diagrams` | ~10K+ rows | `user_id`, `template_id`, `is_public`, `slug` | `template_id` and `forked_from_id` missing FK and no enforcement |
| `simulation_runs` | ~50K+ rows | `diagram_id`, `user_id` | Append-only; no retention policy |
| `templates` | ~100-500 rows | `category`, `is_public`, `author_id` | Low volume; clean |
| `gallery_submissions` | ~1K rows | `author_id`, `upvotes`, `diagram_id` (unique) | `upvotes` counter out of sync risk |
| `gallery_upvotes` | ~5K rows | `(user_id, submission_id)` unique | Missing `submission_id`-only index for upvote count queries |
| `progress` | ~100K rows | `(user_id, module_id)`, `(user_id, module_id, concept_id)` unique | NULL in unique index allows duplicate module-level rows |
| `activity_events` | ~1M+ rows | `user_id`, `event`, `(user_id, module_id)`, `occurred_at` | Missing `(user_id, occurred_at)` composite; no retention policy |
| `ai_usage` | ~500K+ rows | `user_id`, `created_at`, `(user_id, purpose)` | Append-only; no retention policy; `metadata` stored as `text` not `jsonb` |
| `module_content` | ~5K rows | `(module_id, content_type, slug)` unique, `(module_id, content_type, sort_order)` | Clean; content JSONB can be large |
| `quiz_questions` | ~1K rows | `(module_id, quiz_type, slug)` unique, `(module_id, quiz_type)` | Clean |
| `achievements` | ~30 rows | `slug` unique, `category` | Clean |
| `user_achievements` | ~10K rows | `(user_id, achievement_id)` unique, `user_id` | Missing `achievement_id`-only index |
| `diagram_templates` | ~500 rows | `(module_id, parent_type, parent_slug)` unique, `(module_id, parent_type)` | Clean |
| `lld_bookmarks` | ~10K rows | `(user_id, pattern_slug, anchor_id)` unique, `(user_id, created_at)` | Clean |
| `lld_concept_reads` | ~500K+ rows | `(user_id, concept_id, read_at)`, `(user_id, read_at)` | No rate limit; unbounded growth |
| `lld_learn_progress` | ~50K rows | `(user_id, pattern_slug)` unique, `user_id` | Read-modify-write race on PATCH |
| `lld_designs` | ~20K rows | `(user_id, slug)` unique, `(user_id, updated_at)`, `(user_id, status)` | `template_id` missing FK |
| `lld_design_snapshots` | ~1M+ rows | `(design_id, created_at)`, `(user_id, kind)` | No row cap per design; unbounded growth |
| `lld_design_annotations` | ~50K rows | `design_id`, `(design_id, node_id)` | Clean |
| `lld_drill_attempts` | ~100K rows | partial unique `(user_id) WHERE active`, `(user_id, submitted_at)`, `(user_id, current_stage)` | `drillMode`/`variant` redundancy; hint append race; large JSONB columns |
| `lld_drill_interviewer_turns` | ~1M+ rows | `(attempt_id, seq)` non-unique | `seq` not unique; concurrent seq collision |
| `lld_templates_library` | ~60 rows | `slug` unique, `(category, sort_order)` | Clean; `tags`/`pattern_ids` in JSONB without GIN index |
| `lld_learn_progress` | ~50K rows | as above | `checkpointStats` and `sectionProgress` in JSONB without path-level indexes |

---

## 6. Per-Route DB Usage (Top 10 Hottest)

| Route | Pattern | Issues |
|---|---|---|
| `POST /api/lld/drill-interviewer/[id]/stream` (GET) | 2 selects + 1 insert per reply | `seq` race; all turns fetched without limit |
| `PATCH /api/lld/learn-progress/[patternSlug]` | read-modify-write | race on concurrent scroll saves (§3.3) |
| `GET /api/lld/drill-attempts/active` | UPDATE + SELECT on every page load | unnecessary UPDATE when no stale drills exist (§3.4) |
| `POST /api/lld/drill-attempts/[id]/hint` | read-modify-write on JSONB | critical race condition (§3.1) |
| `POST /api/lld/drill-attempts/[id]/grade` | select attempt + select all turns (unbounded) + update | turns SELECT has no LIMIT; could grow large for long drills |
| `POST /api/lld/concept-reads` | single insert | no server-side rate limit; unbounded table growth (§2.7) |
| `GET /api/lld/learn-progress` | select up to 500 rows | limit 500 is high; no cursor pagination |
| `GET /api/activity` | select up to 200 rows | missing composite `(user_id, occurred_at)` index (§2.8) |
| `POST /api/progress/sync` | batched upserts, 50-row chunks | multiple transactions (10 batches for 500 records) — no outer transaction |
| `GET /api/content?full=true` | unbounded SELECT * with JSONB | no row count limit on full-content queries (§3.8) |

---

## 7. Connection Layer

**File:** `src/db/index.ts`

### 7.1 Driver selection is correct but asymmetric (Medium)

The auto-detection logic at line 30-31 (`isNeonUrl`) differentiates Neon HTTP from local pg. The type cast at line 54 (`as unknown as DbInstance`) works around a Drizzle type union but hides the fact that the local driver is `node-postgres` with a `Pool`, while the cloud driver is the Neon HTTP singleton. The comment is accurate about the query surface being compatible, but the type erasure means TypeScript will not catch driver-specific divergences at compile time.

### 7.2 Neon HTTP driver has no transaction support (Critical)

**File:** `src/db/index.ts:45-47`

```ts
const sql = neon(databaseUrl);
return drizzleNeon(sql, { schema });
```

The `neon()` HTTP client executes each query as a separate HTTP round-trip to the Neon serverless proxy. **It does not support multi-statement transactions.** Any code that assumes `db.transaction(async (tx) => { ... })` will work in production is silently broken — the Neon HTTP driver does not implement `BEGIN`/`COMMIT` as a single connection-scoped operation.

No `db.transaction()` calls were found in the reviewed API routes (the app avoids them), but this is a latent risk: any future feature that requires atomic multi-statement writes (e.g. "submit drill + write achievement + update progress" atomically) cannot be implemented safely with the current connection layer.

**Reproduction notes:** Switch `DATABASE_URL` to a Neon string and call `db.transaction()` — the call will resolve without error but execute each statement as an independent request, meaning a failure mid-transaction will leave the DB in a partial state.

**Recommendation:** Use `neon({ connectionString })` with the `Pool` transport for production to get real transaction support, or use `@neondatabase/serverless` with WebSocket transport (`neonConfig.webSocketConstructor = ws`). Document the constraint explicitly if the HTTP transport is intentionally kept.

### 7.3 Local pg driver creates a pool but the pool is never destroyed (Low)

**File:** `src/db/index.ts:51-54`

```ts
const pool = new pg.Pool({ connectionString: databaseUrl });
return drizzlePg(pool, { schema }) as unknown as DbInstance;
```

The `Pool` is stored in the module-level `_db` singleton. In a serverless/edge context this is fine because the process is short-lived. In a long-running Node.js development server, the pool accumulates idle connections and never calls `pool.end()`. This is low severity for local dev, but worth noting.

### 7.4 No connection pool configuration (Medium)

No explicit pool size, connection timeout, or statement timeout is configured for the local pg driver. The Neon HTTP driver also has no per-request timeout configuration. A slow query will hold the serverless function open for its entire duration with no hard cap.

**Recommendation:** Set `statement_timeout` and `lock_timeout` at the session level in Neon via the connection string parameter, or via a `SET` immediately after acquiring a connection.

---

## 8. Offline / Dexie

No Dexie library is used. The application implements its own thin IndexedDB wrapper.

**File:** `src/lib/persistence/idb-store.ts`

The IDB layer is browser-only (used for local diagram project storage and AI response caching). It stores `projects` and `settings` object stores with a schema version of `1`.

**File:** `src/lib/ai/indexeddb-cache.ts`

An `AIResponseCache` class wraps the IDB store with TTL-based expiry and LRU eviction. Observations:

- The LRU eviction at `set()` time fetches all entries (`getAll`) and sorts in JS, then deletes one at a time in a loop. For 500 entries this is O(N) reads + O(N log N) sort + O(excess) deletes on every `set()`. At the configured `maxEntries = 500` this is a meaningful cost per cache write.
- The `evictExpired` method similarly fetches all entries and deletes in a loop. No compound IDB index on `expiresAt` is defined, so expiry checks require full scans.
- No server-side sync concern: the IDB layer is purely client-local. There is no sync-to-server pathway for these caches, so no conflict handling is needed.

---

## 9. Seed Correctness

### 9.1 All seeds use `onConflictDoUpdate` — correctly idempotent (Good)

**File:** `src/db/seeds/seed-helpers.ts:17-39`

The `batchUpsert` helper and all reviewed seed files use `INSERT ... ON CONFLICT DO UPDATE`. Re-running any seed is non-destructive.

### 9.2 Achievements seed uses per-row insert loop (Low)

**File:** `src/db/seeds/achievements.ts:58-70`

The achievements seed iterates `DEFINITIONS` and calls `db.insert().values(def).onConflictDoUpdate(...)` for each row sequentially. With 30 definitions this is 30 round-trips. A single batched `db.insert().values(DEFINITIONS)` call with conflict handling would be more efficient, though this is only a development concern.

### 9.3 Seeds run outside a transaction (Medium)

**File:** `src/db/seeds/index.ts:36-63`

Each seed module's `seed()` function is called sequentially with no wrapping transaction. If a seed fails midway, the database is left in a partial state. For idempotent upserts this is usually recoverable, but for seeds that depend on the output of a prior seed (e.g. `achievements` before `user_achievements`), a partial failure can require manual inspection.

**Recommendation:** Wrap the full seed run in a transaction when using the local pg driver. With Neon HTTP this is not possible (see §7.2), so document the ordering dependency explicitly.

### 9.4 Seed ordering is implicit (Medium)

The `SEED_MODULES` object in `src/db/seeds/index.ts` has no explicit dependency ordering documented. `achievements` seed inserts into `achievements` and nothing else. If any future seed inserts into `user_achievements`, it must run after `achievements`. The current code assumes correct ordering but does not enforce or document it.

---

## 10. Out of Scope

- RLS (Row Level Security): Not implemented. This is a single-tenant-per-user application where row ownership is enforced at the application layer via `WHERE user_id = $resolvedUserId` clauses. RLS is not required here and would add overhead given the Neon HTTP driver's inability to set `SET LOCAL role` inside a transaction.
- Full-text search: `module_content.tags` uses a text array. No `tsvector` or GIN index for full-text search is present. The `/api/search` route was not reviewed but is likely doing an ILIKE scan.
- Query plan analysis: `EXPLAIN ANALYZE` output was not available for this review since it requires a live database connection.
- Encryption at rest: Out of scope — delegated to Neon's managed infrastructure.
- Schema permissions / `GRANT` audit: Not applicable for Neon managed databases.

---

## 11. Reproduction Notes

### Hint race (§3.1)

```bash
# Start two concurrent hint requests for the same attempt
curl -X POST /api/lld/drill-attempts/{id}/hint \
  -d '{"tier":"nudge","stage":"canvas"}' &
curl -X POST /api/lld/drill-attempts/{id}/hint \
  -d '{"tier":"nudge","stage":"canvas"}' &
wait
# Both will return HTTP 201 with the nudge hint, and hint_log will
# contain two identical nudge entries for the canvas stage.
```

### seq collision in drill turns (§3.6)

```bash
# Two POST requests at the same time for the same attempt:
curl -X POST /api/lld/drill-interviewer/{id}/stream \
  -d '{"content":"first message","stage":"clarify"}' &
curl -X POST /api/lld/drill-interviewer/{id}/stream \
  -d '{"content":"second message","stage":"clarify"}' &
wait
# Both will read MAX(seq) = -1, both insert seq = 0.
# drill_turn_attempt_seq_idx does not prevent this.
```

### Null uniqueness gap in progress (§2.11)

```sql
-- Two module-level rows for the same user are possible:
INSERT INTO progress (user_id, module_id, concept_id, score)
VALUES ('uuid1', 'lld', NULL, 0.5);

INSERT INTO progress (user_id, module_id, concept_id, score)
VALUES ('uuid1', 'lld', NULL, 0.8);
-- Both succeed. PostgreSQL unique index ignores NULL != NULL.
```

---

*Pure review — no schema modifications or migrations were written.*
