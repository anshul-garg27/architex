# 06 — API + Data Layer Codemap

> Module scope: every REST route under `src/app/api/**`, the Drizzle ORM
> schema (24+ files under `src/db/schema/**`), the connection layer
> (`src/db/index.ts`), the SQL migration history (`drizzle/migrations/*.sql`),
> Drizzle Kit configuration (`drizzle.config.ts`), the IndexedDB persistence
> layer (`src/lib/persistence/`), and the cross-cutting middleware that
> applies CSP, CORS, and rate limiting to every API route.

---

## 1. Purpose

The `architex` Next.js 15 App Router project exposes a single backend over
~50 Route Handlers that fall into eight functional groups:

| Group | Examples | Visibility |
|---|---|---|
| Auth lifecycle webhooks | `webhooks/clerk` | Public, signed |
| Catalog content (read-only) | `content`, `content/[slug]`, `quiz`, `templates`, `challenges`, `learning-path`, `search` | Public, ISR-cached |
| User-owned diagrams + simulations | `diagrams`, `diagrams/[id]`, `simulations` | Auth required |
| Progress / activity / review (FSRS) | `progress`, `progress/sync`, `review`, `activity` | Auth required |
| LLD module (Learn / Build / Drill) | `lld/lessons/[slug]`, `lld/learn-progress`, `lld/bookmarks`, `lld/concept-reads`, `lld/designs/...`, `lld/drill-attempts/...`, `lld/drill-interviewer/[id]/stream`, `lld/templates-library`, `lld/explain-inline`, `lld/ai/suggest-nodes` | Mostly auth required |
| AI heuristics (with optional Anthropic call-out) | `hint`, `evaluate`, `ai/explain` | Public; rate-limited per user |
| User preferences | `user-preferences`, `user-preferences/lld` | Auth required |
| Cross-cutting / SEO / static surfaces | `health`, `csp-report`, `og`, `og/database`, `oembed`, `email-preview` | Public |

The **data layer** is intentionally split between two stores:

* **PostgreSQL** (Neon Serverless in production, local `pg` driver in
  development) — single source of truth for every cross-device fact:
  user accounts (synced from Clerk), diagrams, FSRS-aware progress rows,
  LLD designs and snapshots, drill attempts with interviewer turns,
  catalog content, achievements, AI usage records, and activity events.
  Accessed exclusively through Drizzle ORM.

* **IndexedDB** (browser, via the project's own thin wrapper at
  `src/lib/persistence/idb-store.ts`) — local-first scratchpad: per-page
  project state, AI response cache (`AIResponseCache` keyed by request
  hash), and recovery payloads dropped on `beforeunload`. There is no
  Dexie dependency in source code (`dexie` appears only in
  `node_modules/`); the codebase rolls its own zero-dependency wrapper.

The two stores are **not bidirectionally synced**. Server state is the
authority for anything multi-device; IndexedDB is treated as an
ephemeral acceleration layer (caches + drafts + crash recovery).

---

## 2. Connection layer

### 2.1 Runtime driver auto-detection

`src/db/index.ts:30-55` picks one of two Drizzle dialects at first call:

```
isNeonUrl(url) === true   → drizzle-orm/neon-http  (HTTP, edge-safe)
otherwise                 → drizzle-orm/node-postgres (pg.Pool, Node only)
```

The detection rule (`src/db/index.ts:30-32`) is a substring check:
URL contains `neon.tech` **or** `vercel-storage` ⇒ Neon driver.
Anything else (e.g. `postgresql://localhost/architex_dev`) falls back
to a node `pg.Pool` instance.

Both drivers are unified behind a single nominal type
`NeonHttpDatabase<Schema>` (`src/db/index.ts:21-28`). The pg-driven
instance is cast at the boundary because Drizzle's discriminated
return types over the two drivers widens `.returning({...})`
inference in a way that breaks call sites; narrowing here keeps every
route handler typed identically regardless of where it runs.

### 2.2 Singleton per serverless invocation

`getDb()` at `src/db/index.ts:60-65` caches a module-scoped
`_db: DbInstance | null`. Inside a single Vercel function instance the
pool/HTTP client is reused across requests; on cold start it is
re-created lazily. There is **no explicit pool sizing** in the source —
the project relies on `pg.Pool` defaults locally and on Neon's
serverless connection model in production.

### 2.3 Environment variables

| Var | Used by | Notes |
|---|---|---|
| `DATABASE_URL` | runtime (`src/db/index.ts:35`) | Required. Empty string ⇒ explicit error with example URLs (`src/db/index.ts:36-42`). |
| `DATABASE_URL_UNPOOLED` | drizzle-kit only (`drizzle.config.ts:18`) | Falls back to `DATABASE_URL` when unset. Used during `db:generate`/`db:migrate`/`db:push`/`db:studio`. |
| `ANTHROPIC_API_KEY` | `lld/explain-inline`, `lld/ai/suggest-nodes`, `ai/explain`, `hint`, `evaluate`, drill stream/postmortem | When absent, every AI route returns a heuristic fallback rather than 5xx. |
| `CLERK_WEBHOOK_SECRET` | `webhooks/clerk` only (`src/app/api/webhooks/clerk/route.ts:13`) | Webhook returns 503 if unset, 401 if signature fails. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | gates auth in middleware + dev mode in `lld/explain-inline` and `ai/explain` (`src/app/api/lld/explain-inline/route.ts:87`, `src/app/api/ai/explain/route.ts:361`) | When unset, those routes skip the `requireAuth()` call. |
| `NEXT_PUBLIC_SYSDESIGN_USE_API` | `templates` route (`src/app/api/templates/route.ts:21`) | Toggles between DB-backed templates (`module_content` rows where `contentType="template"`) and the in-memory `SYSTEM_DESIGN_TEMPLATES` array. |
| `NODE_ENV` | `email-preview` (`src/app/api/email-preview/route.ts:19`), `auth.ts` (`src/lib/auth.ts:17-21`), `middleware.ts` (`src/middleware.ts:164`) | Email preview and synthetic dev user gated to `development`; CSP report-only header limited to `production`. |

### 2.4 Drizzle Kit configuration

`drizzle.config.ts:24-36` mirrors the runtime detection:

* `schema: "./src/db/schema/*"` — includes every file in the schema dir
* `out: "./drizzle/migrations"` — six SQL files + a `meta/` journal
* `dialect: "postgresql"` — fixed
* `driver: "neon-http"` is added **only** for Neon URLs; with a local
  Postgres URL drizzle-kit defaults to its native pg driver
* `verbose: true, strict: true`

---

## 3. Migrations — applied in order

Source: `drizzle/migrations/*.sql`, journaled in
`drizzle/migrations/meta/_journal.json:4-46` (six entries, drizzle-kit
version 7, all with `breakpoints: true`).

| # | Tag | Timestamp (`when`) | One-line summary |
|---|---|---|---|
| 0000 | `skinny_callisto` | 1776697537752 | Initial schema: 13 tables (`users`, `diagrams`, `simulation_runs`, `progress`, `templates`, `gallery_submissions`, `gallery_upvotes`, `ai_usage`, `module_content`, `achievements`, `user_achievements`, `activity_events`, `quiz_questions`, `diagram_templates`, `lld_drill_attempts`) + every primary index + the partial-unique `one_active_drill_per_user` index. |
| 0001 | `nostalgic_rattler` | 1776698456172 | Adds `user_preferences` (PK = `user_id`, JSONB `preferences`, FK cascade to `users`). |
| 0002 | `thin_karnak` | 1776724766666 | LLD reading layer: `lld_bookmarks`, `lld_concept_reads`, `lld_learn_progress` plus their FKs and `(user_id, pattern_slug)` unique. |
| 0003 | `deep_pretty_boy` | 1776755446272 | LLD design layer: `lld_designs`, `lld_design_snapshots`, `lld_design_annotations`, `lld_templates_library` + indexes on `(user_id, slug)`, `(design_id, created_at)`, etc. |
| 0004 | `handy_deadpool` | 1776758593038 | Phase 4 drill upgrade — adds 7 columns to `lld_drill_attempts` (`variant`, `current_stage`, `started_stage_at`, `stages`, `hint_log`, `rubric_breakdown`, `postmortem`) and the `drill_stage_idx` index. |
| 0005 | `productive_sally_floyd` | 1776758661702 | Adds `lld_drill_interviewer_turns` table + `(attempt_id, seq)` index, completing the Phase-4 chat persistence. |

Every FK uses `ON DELETE cascade` except `templates.author_id` which
uses `set null` (`drizzle/migrations/0000_skinny_callisto.sql:209`).
There are no down-migrations and no destructive changes after 0001 —
all later migrations are additive (new tables, new columns with
defaults, new indexes).

---

## 4. Schema map

Each row below is one `pgTable(...)` declaration. `Reads / writes`
columns name the *route(s)* most directly responsible.

### 4.1 `users` — `src/db/schema/users.ts:16-36`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | `defaultRandom()` | Internal user UUID — every other FK targets this. |
| `clerk_id` | varchar(255) | — | UNIQUE; the Clerk user ID. |
| `email` | varchar(320) | — | NOT NULL. |
| `name` | varchar(255) | NULL | Optional. |
| `tier` | varchar(20) | `'free'` | Subscription tier (free/pro/...). |
| `created_at` | timestamptz | `now()` | |
| `updated_at` | timestamptz | `now()` | `$onUpdate(() => new Date())`. |

Indexes: `users_clerk_id_idx`, `users_email_idx`. UNIQUE on `clerk_id`
(see migration 0000:193).
Reads/writes: `webhooks/clerk` (insert/update/delete), `auth.ts:resolveUserId`
(insert + select), every authenticated route via the resolver.

### 4.2 `diagrams` — `src/db/schema/diagrams.ts:21-54`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `user_id` | uuid | — | FK → `users.id`, cascade. |
| `title` | varchar(255) | — | |
| `slug` | varchar(255) | NULL | |
| `description` | text | NULL | |
| `data` | jsonb | `{}` | React Flow nodes/edges payload. |
| `template_id` | uuid | NULL | Soft pointer (no FK) to a template. |
| `is_public` | boolean | false | |
| `fork_count` | integer | 0 | |
| `upvote_count` | integer | 0 | |
| `forked_from_id` | uuid | NULL | Self-soft-pointer. |
| `created_at`/`updated_at` | timestamptz | `now()` | `$onUpdate` on update. |

Indexes: `user_id`, `template_id`, `is_public`, `slug`.
Reads/writes: `api/diagrams` (list+create), `api/diagrams/[id]` (get+update+delete), embed/SSR pages.

### 4.3 `simulation_runs` — `src/db/schema/simulations.ts:19-45`

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `diagram_id` | uuid | — (cascade FK) |
| `user_id` | uuid | — (cascade FK) |
| `config` | jsonb | `{}` |
| `results` | jsonb | NULL |
| `tick_count` | integer | NULL |
| `duration` | integer (ms) | NULL |
| `created_at` | timestamptz | `now()` |

Indexes: `simulation_runs_diagram_id_idx`, `simulation_runs_user_id_idx`.
Reads/writes: `api/simulations` (GET list with optional `diagramId` filter, POST insert).

### 4.4 `progress` — `src/db/schema/progress.ts:20-68`

FSRS-aware mastery row. **Composite uniqueness**: `(user_id, module_id, concept_id)`.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `user_id` | uuid | — | cascade FK |
| `module_id` | varchar(100) | — | e.g. `lld`, `algorithms` |
| `concept_id` | varchar(100) | NULL | |
| `score` | real | 0 | 0..1 mastery |
| `completed_at` | timestamptz | NULL | |
| `stability` | real | NULL | FSRS days-until-90% |
| `difficulty` | real | NULL | FSRS hardness 0..1 |
| `elapsed_days` | integer | NULL | |
| `scheduled_days` | integer | NULL | |
| `reps` | integer | 0 | |
| `lapses` | integer | 0 | |
| `fsrs_state` | integer | 0 | 0=new, 1=learning, 2=review, 3=relearning |
| `next_review_at` | timestamptz | NULL | |
| `created_at`/`updated_at` | timestamptz | `now()` | `$onUpdate`. |

Indexes: `progress_user_module_idx`, UNIQUE `progress_user_module_concept_idx`.
Reads/writes: `api/progress` (GET/POST upsert), `api/progress/sync` (bulk upsert from localStorage), `api/review` (FSRS update on each review), `api/learning-path` (read for mastery annotation).

### 4.5 `templates` — `src/db/schema/templates.ts:20-46`

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `name` | varchar(255) | — |
| `category` | varchar(100) | — |
| `description` | text | NULL |
| `data` | jsonb | `{}` |
| `is_public` | boolean | false |
| `author_id` | uuid | NULL (FK `users.id`, **set null**) |
| `created_at`/`updated_at` | timestamptz | `now()` |

Indexes: `category`, `is_public`, `author_id`.
Reads/writes: not currently surfaced via dedicated route; `api/templates`
prefers `module_content` rows (when `NEXT_PUBLIC_SYSDESIGN_USE_API=true`)
or the static array; this table exists for future user-authored templates.

### 4.6 `gallery_submissions` + `gallery_upvotes` — `src/db/schema/gallery.ts:22-69`

`gallery_submissions`:

| Column | Type |
|---|---|
| `id` | uuid PK |
| `diagram_id` | uuid (cascade FK; UNIQUE — one submission per diagram) |
| `title` | varchar(255) |
| `description` | text |
| `upvotes` | integer (denormalized counter, default 0) |
| `author_id` | uuid (cascade FK) |
| `created_at` | timestamptz |

Indexes: `gallery_author_id_idx`, `gallery_upvotes_idx`,
UNIQUE `gallery_diagram_id_idx`.

`gallery_upvotes`:

| Column | Type |
|---|---|
| `id` | uuid PK |
| `submission_id` | uuid (cascade FK) |
| `user_id` | uuid (cascade FK) |
| `created_at` | timestamptz |

Indexes: UNIQUE `gallery_upvotes_user_submission_idx` enforces
one-vote-per-user-per-submission.
Reads/writes: no current route in `src/app/api/**`; tables exist for the gallery feature.

### 4.7 `ai_usage` — `src/db/schema/ai-usage.ts:20-46`

Append-only audit row per AI call.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `user_id` | uuid | cascade FK |
| `model` | varchar(100) | — |
| `tokens` | integer | — |
| `cost` | real (USD cents) | 0 |
| `purpose` | varchar(100) | NULL |
| `metadata` | text | NULL |
| `created_at` | timestamptz | `now()` |

Indexes: `user_id`, `created_at`, `(user_id, purpose)`.
Reads/writes: `api/ai/explain` (insert + count for rate-limit window), `api/lld/explain-inline` (same pattern with `purpose='lld-explain-inline'`). Other AI routes do not yet log usage.

### 4.8 `module_content` — `src/db/schema/module-content.ts:23-69`

Unified catalog row across all 13 learning modules. The shape is module-agnostic; each row's `content` JSONB carries the module-specific schema.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `module_id` | varchar(50) | — | `algorithms`, `lld`, `database`, ... |
| `content_type` | varchar(50) | — | `pattern`, `problem`, `algorithm`, `template`, `lesson`, ... |
| `slug` | varchar(200) | — | unique within `(module_id, content_type)` |
| `name` | varchar(300) | — | |
| `category` | varchar(100) | NULL | e.g. `creational`, `sorting` |
| `difficulty` | varchar(20) | NULL | `beginner` / `intermediate` / `advanced` / `expert` |
| `sort_order` | integer | 0 | |
| `content` | jsonb | `{}` | full payload |
| `summary` | text | NULL | list-view excerpt |
| `tags` | text[] | NULL | array of strings |
| `is_published` | boolean | true | unpublished rows hidden from public APIs |
| `created_at`/`updated_at` | timestamptz | `now()` | `$onUpdate` |

Indexes: UNIQUE `(module_id, content_type, slug)`,
`(module_id, content_type, sort_order)`.
Reads: `api/content`, `api/content/[slug]`, `api/search`, `api/templates` (DB path), `api/lld/lessons/[slug]` indirectly via `loadLesson`.
Writes: seed scripts only (`src/db/seeds/*`).

### 4.9 `achievements` + `user_achievements` — `src/db/schema/achievements.ts:23-80`

`achievements` (definition catalog):

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `slug` | varchar(100) UNIQUE | — |
| `name` | varchar(200) | — |
| `description` | text | — |
| `category` | varchar(50) | — |
| `icon` | varchar(50) | NULL |
| `color` | varchar(7) | NULL |
| `xp_reward` | integer | 0 |
| `sort_order` | integer | 0 |
| `is_active` | boolean | true |
| `created_at` | timestamptz | `now()` |

`user_achievements` (per-user unlock log):

| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid (cascade FK) |
| `achievement_id` | uuid (cascade FK) |
| `unlocked_at` | timestamptz |

Indexes: `achievements_category_idx`, UNIQUE
`user_achievements_unique_idx (user_id, achievement_id)`,
`user_achievements_user_idx`.
Reads/writes: no current route in `src/app/api/**` — seeded only.

### 4.10 `activity_events` — `src/db/schema/activity.ts:19-48`

Append-only event log used by streaks and analytics.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `user_id` | uuid | cascade FK |
| `event` | varchar(100) | — |
| `module_id` | varchar(50) | NULL |
| `concept_id` | varchar(100) | NULL |
| `metadata` | jsonb | NULL |
| `occurred_at` | timestamptz | `now()` (client clock) |
| `created_at` | timestamptz | `now()` (server clock) |

Indexes: `user_idx`, `event_idx`, `(user_id, module_id)`, `occurred_at_idx`.
Reads/writes: `api/activity` (POST insert, GET filtered query).

### 4.11 `quiz_questions` — `src/db/schema/quiz-questions.ts:22-63`

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `module_id` | varchar(50) | — | |
| `quiz_type` | varchar(50) | — | `scenario`, `solid`, `pattern-comparison`, `daily`, ... |
| `slug` | varchar(200) | — | unique within `(module_id, quiz_type)` |
| `question` | text | — | |
| `context` | text | NULL | |
| `options` | jsonb (`[]`) | `[]` | `[{label, description?, whyWrong?}]` |
| `correct_index` | integer | — | 0-based |
| `explanation` | text | — | |
| `pattern_id` | varchar(100) | NULL | |
| `difficulty` | varchar(20) | NULL | |
| `sort_order` | integer | 0 | |
| `created_at` | timestamptz | `now()` | |

Indexes: UNIQUE `(module_id, quiz_type, slug)`,
`(module_id, quiz_type)`.
Reads: `api/quiz` only.

### 4.12 `diagram_templates` — `src/db/schema/diagram-templates.ts:22-61`

UML diagrams stored as both Mermaid source code and parsed JSON (classes/relationships).

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `module_id` | varchar(50) | — |
| `parent_type` | varchar(50) | — (`pattern` / `problem` / `solid-demo`) |
| `parent_slug` | varchar(200) | — |
| `mermaid_code` | text | — |
| `classes` | jsonb (`[]`) | `[]` |
| `relationships` | jsonb (`[]`) | `[]` |
| `is_curated` | boolean | false |
| `layout_algo` | varchar(20) | `'grid'` |
| `created_at`/`updated_at` | timestamptz | `now()` |

Indexes: UNIQUE `(module_id, parent_type, parent_slug)`,
`(module_id, parent_type)`.
Reads: not exposed via REST; consumed inside other modules; seeded.

### 4.13 `lld_bookmarks` — `src/db/schema/lld-bookmarks.ts:24-60`

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `user_id` | uuid | cascade FK |
| `pattern_slug` | varchar(100) | — |
| `section_id` | varchar(30) | — |
| `anchor_id` | varchar(200) | — |
| `anchor_label` | varchar(500) | — |
| `note` | text | NULL |
| `created_at`/`updated_at` | timestamptz | `now()` (on update) |

Indexes: UNIQUE `(user_id, pattern_slug, anchor_id)` (toggling re-creates), `(user_id, created_at)`.
Reads/writes: `api/lld/bookmarks` (GET list, POST toggle), `api/lld/bookmarks/[id]` (PATCH note, DELETE).

### 4.14 `lld_concept_reads` — `src/db/schema/lld-concept-reads.ts:21-47`

Append-only "user X read concept Y on pattern Z" log.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `user_id` | uuid | cascade FK |
| `concept_id` | varchar(100) | — |
| `pattern_slug` | varchar(100) | — |
| `section_id` | varchar(30) | — |
| `read_at` | timestamptz | `now()` |

Indexes: `(user_id, concept_id, read_at)`, `(user_id, read_at)`.
Reads/writes: `api/lld/concept-reads` (POST only — append-only). The cross-link engine and FSRS read this table directly via internal helpers (no GET route).

### 4.15 `lld_designs` — `src/db/schema/lld-designs.ts:25-59`

User-named, savable canvas containers.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `user_id` | uuid | — | cascade FK |
| `name` | varchar(160) | — | |
| `slug` | varchar(160) | — | unique with user |
| `description` | text | NULL | |
| `template_id` | uuid | NULL | optional fork pointer |
| `status` | varchar(20) | `'active'` | `draft` / `active` / `archived` |
| `is_pinned` | boolean | false | |
| `created_at`/`updated_at` | timestamptz | `now()` | |
| `last_opened_at` | timestamptz | `now()` | bumped on GET-by-id |

Indexes: UNIQUE `(user_id, slug)`, `(user_id, updated_at)`, `(user_id, status)`.
Reads/writes: `api/lld/designs` (POST/GET), `api/lld/designs/[id]` (GET/PATCH/DELETE).

### 4.16 `lld_design_snapshots` — `src/db/schema/lld-design-snapshots.ts:26-54`

Immutable history rows for a design.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `design_id` | uuid | cascade FK |
| `user_id` | uuid | cascade FK |
| `kind` | varchar(20) | `'auto'` (or `named`) |
| `label` | varchar(200) | NULL |
| `note` | text | NULL |
| `canvas_state` | jsonb | — (full RF graph) |
| `node_count` | integer | 0 |
| `edge_count` | integer | 0 |
| `created_at` | timestamptz | `now()` |

Indexes: `(design_id, created_at)`, `(user_id, kind)`.
Reads/writes: `api/lld/designs/[id]/snapshots` (POST append, GET list).

### 4.17 `lld_design_annotations` — `src/db/schema/lld-design-annotations.ts:26-57`

Floating notes / shapes layered on top of a design canvas.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `design_id` | uuid | cascade FK |
| `user_id` | uuid | cascade FK |
| `kind` | varchar(30) | `'sticky-note'` (or `arrow`/`circle`/`text`) |
| `node_id` | varchar(100) | NULL (floating if null) |
| `x` / `y` | real | 0 / 0 |
| `body` | text | `''` |
| `color` | varchar(20) | `'amber'` |
| `meta` | jsonb | `{}` |
| `created_at`/`updated_at` | timestamptz | `now()` |

Indexes: `(design_id)`, `(design_id, node_id)`.
Reads/writes: `api/lld/designs/[id]/annotations` (GET/POST).

### 4.18 `lld_drill_attempts` — `src/db/schema/lld-drill-attempts.ts:28-89`

The flagship LLD interview-rehearsal table. Phase-1 and Phase-4 columns coexist.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `user_id` | uuid | — | cascade FK |
| `problem_id` | varchar(100) | — | catalog slug |
| `drill_mode` | varchar(20) | `'interview'` | Phase-1 alias |
| `variant` | varchar(20) | `'timed-mock'` | `exam` / `timed-mock` / `study` |
| `started_at` | timestamptz | `now()` | |
| `paused_at` | timestamptz | NULL | |
| `last_activity_at` | timestamptz | `now()` | bumped on every PATCH |
| `submitted_at` | timestamptz | NULL | terminal |
| `abandoned_at` | timestamptz | NULL | terminal |
| `current_stage` | varchar(20) | `'clarify'` | `clarify`/`rubric`/`canvas`/`walkthrough`/`reflection` |
| `started_stage_at` | timestamptz | `now()` | for stage timing heatmap |
| `stages` | jsonb | `'{}'::jsonb` | per-stage {durationMs, progress} |
| `elapsed_before_pause_ms` | integer | 0 | |
| `duration_limit_ms` | integer | — | drill clock |
| `canvas_state` | jsonb | NULL | latest RF graph |
| `hints_used` | jsonb | `'[]'::jsonb` | Phase-3 backward compat |
| `hint_log` | jsonb | `'[]'::jsonb` | Phase-4 rich log |
| `grade_score` | real | NULL | final score after penalties |
| `grade_breakdown` | jsonb | NULL | persona + hintPenalty + axes |
| `rubric_breakdown` | jsonb | NULL | 6-axis grade (Phase 4) |
| `postmortem` | jsonb | NULL | AI-authored summary |

Indexes:
* **Partial-unique** `one_active_drill_per_user`
  WHERE `submitted_at IS NULL AND abandoned_at IS NULL` —
  enforces the "one active drill per user" invariant.
* `drill_history_idx (user_id, submitted_at)`.
* `drill_stage_idx (user_id, current_stage)` (added in 0004).

Reads/writes: `api/lld/drill-attempts` (POST/GET), `api/lld/drill-attempts/active` (GET + auto-abandon idle), `api/lld/drill-attempts/[id]` (PATCH heartbeat/pause/resume/submit/abandon), `api/lld/drill-attempts/[id]/hint`, `.../[id]/postmortem`, `.../[id]/resume`, `.../[id]/turn`, `.../[id]/grade`, `.../[id]/stage`, plus the SSE stream.

### 4.19 `lld_drill_interviewer_turns` — `src/db/schema/lld-drill-interviewer-turns.ts:20-52`

Chat log between user and the Claude-backed interviewer persona.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `attempt_id` | uuid | cascade FK |
| `role` | varchar(20) | — (`user`/`interviewer`/`system`) |
| `stage` | varchar(20) | — |
| `persona` | varchar(20) | `'generic'` (or `amazon`/`google`/`meta`/`stripe`/`uber`) |
| `seq` | integer | — (sequential within attempt) |
| `content` | text | — |
| `metadata` | jsonb | NULL |
| `created_at` | timestamptz | `now()` |

Indexes: `(attempt_id, seq)`.
Reads/writes: `api/lld/drill-interviewer/[id]/stream` (POST persists user turn, GET streams interviewer reply and persists it on `done`), `api/lld/drill-attempts/[id]/turn` (alias to the stream POST), `.../[id]/grade` (read for qualitative axes), `.../[id]/resume` (read on rehydrate).

### 4.20 `lld_learn_progress` — `src/db/schema/lld-learn-progress.ts:47-98`

One row per (user, pattern); UPSERT on PATCH.

| Column | Type | Default | Notes |
|---|---|---|---|
| `id` | uuid PK | random | |
| `user_id` | uuid | — | cascade FK |
| `pattern_slug` | varchar(100) | — | |
| `section_progress` | jsonb (`SectionProgressMap`) | `'{}'::jsonb` | 8 sections × `{scrollDepth, firstSeenAt, completedAt}` |
| `last_scroll_y` | integer | 0 | |
| `active_section_id` | varchar(30) | NULL | |
| `completed_section_count` | integer | 0 | denormalized |
| `checkpoint_stats` | jsonb | `'{}'::jsonb` | `{[sectionId]: {attempts, correct}}` |
| `completed_at` | timestamptz | NULL | stamped only when all 8 sections done |
| `visit_count` | integer | 0 | |
| `created_at`/`updated_at` | timestamptz | `now()` (`$onUpdate`) | |

Indexes: UNIQUE `(user_id, pattern_slug)`, `(user_id)`.
Reads/writes: `api/lld/learn-progress` (GET sidebar list), `api/lld/learn-progress/[patternSlug]` (GET single, PATCH merge with all-sections-done detection).

The eight `LearnSectionId` values are exported as a literal type
union (`src/db/schema/lld-learn-progress.ts:26-34`):
`itch | definition | mechanism | anatomy | numbers | uses | failure_modes | checkpoints`.

### 4.21 `lld_templates_library` — `src/db/schema/lld-templates-library.ts:27-60`

Curated blueprint catalog seeded from `src/db/seeds/lld-templates-library.ts`.

| Column | Type | Default |
|---|---|---|
| `id` | uuid PK | random |
| `slug` | varchar(100) | — (UNIQUE) |
| `name` | varchar(160) | — |
| `description` | text | — |
| `category` | varchar(40) | — (`creational`/`structural`/`behavioral`/`architecture`/`microservices`/`data`/`ai`) |
| `difficulty` | varchar(20) | `'intermediate'` |
| `tags` | jsonb | `'[]'::jsonb` (string[]) |
| `pattern_ids` | jsonb | `'[]'::jsonb` (string[]) |
| `canvas_state` | jsonb | — (full RF graph) |
| `thumbnail_svg` | text | NULL |
| `is_curated` | boolean | true |
| `sort_order` | integer | 0 |
| `created_at`/`updated_at` | timestamptz | `now()` |

Indexes: UNIQUE `(slug)`, `(category, sort_order)`.
Reads: `api/lld/templates-library` only (public, cacheable).

### 4.22 `user_preferences` — `src/db/schema/user-preferences.ts:29-42`

Single-row-per-user JSONB blob keyed by feature area.

| Column | Type |
|---|---|
| `user_id` (PK) | uuid (cascade FK to `users.id`) |
| `preferences` | jsonb (default `{}`) |
| `created_at`/`updated_at` | timestamptz (`$onUpdate`) |

Documented JSONB shape (`src/db/schema/user-preferences.ts:9-17`):

```jsonc
{
  "lld": {
    "mode": "learn" | "build" | "drill" | "review",
    "welcomeBannerDismissed": boolean,
    "scratchCanvas": { /* Phase 3+ */ }
  }
}
```

Reads/writes: `api/user-preferences` (GET full blob), `api/user-preferences/lld` (PATCH merges into the `lld` subtree using `jsonb_set` + concatenation).

---

## 5. Schema relations graph

`src/db/schema/relations.ts` declares every `relations()` block. The
graph below shows logical ownership; every arrow represents a foreign
key with `ON DELETE cascade` unless marked `(SET NULL)`.

```
users ──┬─── many → diagrams ──┬── many → simulation_runs
        │                      └── one  → gallery_submission ── many → gallery_upvotes
        ├─── many → simulation_runs                                       ↑
        ├─── many → progress                                              │
        ├─── many → templates  ─(SET NULL on author)                      │
        ├─── many → gallery_submissions ──────────────────────────────────┘
        ├─── many → ai_usage
        ├─── many → lld_bookmarks
        ├─── many → lld_concept_reads
        ├─── many → lld_designs ─┬── many → lld_design_snapshots
        │                        └── many → lld_design_annotations
        ├─── many → lld_drill_attempts ── many → lld_drill_interviewer_turns
        ├─── many → lld_learn_progress
        └─── one  → user_preferences  (1:1, PK = user_id)
```

Tables with **no relation declared** (catalog / public data, typically
read by everyone): `module_content`, `quiz_questions`, `diagram_templates`,
`achievements`, `user_achievements`, `lld_templates_library`,
`activity_events`. Most of these are still queryable with FKs (e.g.
`activity_events.user_id`) — the absence of a `relations()` block just
means there is no Drizzle `with: { ... }` join surface in code today.

---

## 6. Offline / IndexedDB layer

There is **no Dexie dependency in source code**. `dexie` and
`dexie-react-hooks` appear in `node_modules/.pnpm/...` but are never
imported anywhere under `src/`. The codebase uses its own zero-dep
IndexedDB wrapper.

### 6.1 The wrapper — `src/lib/persistence/idb-store.ts`

* `openDB(name, version, schema)` — promisified `indexedDB.open` with
  `onupgradeneeded` that creates any object store listed in
  `schema.stores` but never drops existing ones (`idb-store.ts:44-68`).
* `put / get / del / getAll` — thin transaction-wrapped helpers
  (lines 74-118).
* `getDefaultDB()` (`idb-store.ts:135-149`) — caches a singleton handle
  to the canonical Architex database `architex-db` (version 1) with two
  stores: `projects` (keyPath `projectId`) and `settings`
  (keyPath `settingName`).

Barrel-exported via `src/lib/persistence/index.ts` alongside
auto-save, hydration, and migration helpers.

### 6.2 Stores using IndexedDB

| Consumer | Path | Purpose |
|---|---|---|
| Project autosave / hydration | `src/lib/persistence/index.ts:20-49` | Persist serialized project per `projectId` and reload on app boot. |
| AI response cache | `src/lib/ai/indexeddb-cache.ts:34-170` | Separate DB `architex-ai-cache`, store `responses`. Per-entry TTL + LRU eviction at `maxEntries=500`. |
| AI client wrapper | `src/lib/ai/claude-client.ts` | Wraps `AIResponseCache` to dedupe identical Claude calls (used by interviewer stream + postmortem with `cacheKey`/`cacheTtlMs`). |
| Topology rules cache | `src/lib/ai/topology-rules.ts` | Same cache surface for topology heuristics. |
| Stores | `src/stores/ai-store.ts`, `src/stores/interview-store.ts`, `src/stores/STATE_ARCHITECTURE.ts` | Hydrate selected slices from the project store. |
| Version history | `src/lib/version-history/history-manager.ts` | Local snapshot stack (separate from server `lld_design_snapshots`). |
| Interview challenges | `src/lib/interview/challenges.ts` | Imports the wrapper but currently as a precaution; the route still serves from the in-memory array. |
| Migration chain | `src/lib/persistence/migration.ts` | Pure `v1→v2→v3` migrations of the serialized project payload (`migration.ts:33-84`); registered chain ends at `LATEST_VERSION = 3`. |

### 6.3 Sync strategy with Postgres

There is no real-time sync. The two stores are reconciled at three
moments:

1. **First-load migration** — `api/progress/sync` (POST) accepts up to
   500 records (batched in 50s) drained from localStorage; uses
   `onConflictDoUpdate` keyed on `(user_id, module_id, concept_id)` and
   intentionally keeps the larger of existing vs incoming score
   (`src/app/api/progress/sync/route.ts:78-87`). Called once when a
   user first authenticates.
2. **Background autosave** — for LLD designs, the client `POST`s to
   `lld/designs/[id]/snapshots` whenever the local autosave manager
   ticks. Server is authoritative; the in-memory undo stack sits in
   `version-history/history-manager.ts` and never round-trips.
3. **`beforeunload` recovery** — `installBeforeUnloadSave` (exported
   via `lib/persistence/index.ts:43-49`) writes to a localStorage
   `RecoveryData` slot the first time the user closes a tab with
   unsaved changes; `checkForRecoveryData` reads it on next boot.

There is no documented conflict-resolution algorithm beyond
"server-wins on UPSERT, last-write-wins on JSONB merges (lld
preferences), max-of-existing-or-incoming on score sync". The drill
attempt is the only table that uses an explicit Postgres invariant
(partial unique index) to prevent duplicate active rows.

---

## 7. Full API route inventory

| METHOD path | Auth | Input | Output | DB tables touched | External services |
|---|---|---|---|---|---|
| `GET /api/health` | none | — | `{status, version, timestamp, uptime}` | none | none |
| `POST /api/csp-report` | none | CSP report (JSON or `application/csp-report`) | 204 always | none | `console.warn` only |
| `GET /api/oembed` | none | `?url&format=json&maxwidth&maxheight` | oEmbed rich JSON, 24h cache | none | none |
| `GET /api/og` | none (edge) | `?title&type&difficulty&category&complexity&avatar` (avatar passed through `validateURL` SSRF check) | PNG 1200×630, 24h cache | none | `next/og` |
| `GET /api/og/database` | none (edge) | `?mode=...` | PNG 1200×630 | none | `next/og` |
| `GET /api/email-preview` | dev only | `?template=welcome|digest|streak|achievement` | rendered HTML | none | none |
| `POST /api/webhooks/clerk` | Svix-signed | Clerk event payload | `{received, type}` | `users` (insert/update/delete) | Clerk → Svix |
| `GET /api/content` | none | `?module&type&category&difficulty&full` | `{items[], count}` | `module_content` | — |
| `GET /api/content/:slug` | none | `?module&type` | `{item}` | `module_content` | — |
| `GET /api/quiz` | none | `?module&type` | `{questions[], count}` | `quiz_questions` | — |
| `GET /api/templates` | none | `?category&difficulty` | `{templates[], count}` | `module_content` (DB path) | — |
| `GET /api/challenges` | none | `?difficulty&category&company` | `{challenges[], count}` | none (in-memory `CHALLENGES`) | — |
| `GET /api/learning-path` | optional | `?module&category` | `{path[], count, module}` (annotates with mastery if signed in) | `progress` | `@clerk/nextjs/server` |
| `GET /api/search` | none | `?q&module` | `{items[], count, query}` | `module_content` (ILIKE rank) | — |
| `GET /api/diagrams` | required | — | `{diagrams[]}` | `diagrams` | Clerk |
| `POST /api/diagrams` | required | `{title, data?, templateId?}` | `{diagram}` 201 | `diagrams` | Clerk |
| `GET /api/diagrams/:id` | optional* | path id | `{diagram}` | `diagrams` | Clerk (only if `is_public=false`) |
| `PUT /api/diagrams/:id` | required | `{title?, data?, description?, isPublic?}` | `{diagram}` | `diagrams` | Clerk |
| `DELETE /api/diagrams/:id` | required | path id | `{deleted, id}` | `diagrams` | Clerk |
| `GET /api/simulations` | required | `?diagramId` | `{simulations[]}` (limit 50) | `simulation_runs` | Clerk |
| `POST /api/simulations` | required | `{diagramId, config?, results?, tickCount?, duration?}` | `{simulation}` 201 | `simulation_runs` | Clerk |
| `GET /api/progress` | required | `?moduleId&conceptId` | `{progress[]}` | `progress` | Clerk |
| `POST /api/progress` | required | `{moduleId, conceptId?, score?, completedAt?}` | `{progress}` (UPSERT) | `progress` | Clerk |
| `POST /api/progress/sync` | required | `{records: SyncRecord[]}` (≤500, 50/batch) | `{synced, total}` | `progress` | Clerk |
| `GET /api/review` | required | `?moduleId` | `{items[], count}` (due now) | `progress` | Clerk |
| `POST /api/review` | required | `{moduleId, conceptId, rating}` | `{progress}` (FSRS update) | `progress` | Clerk; FSRS pure |
| `POST /api/activity` | required | `{event, moduleId?, conceptId?, metadata?, occurredAt?}` | `{event}` 201 | `activity_events` | Clerk |
| `GET /api/activity` | required | `?moduleId&limit` (≤200) | `{events[], count}` | `activity_events` | Clerk |
| `GET /api/user-preferences` | required | — | `{preferences}` | `user_preferences` | Clerk |
| `PATCH /api/user-preferences/lld` | required | `{mode?, welcomeBannerDismissed?, scratchCanvas?}` | `{ok}` | `user_preferences` (jsonb_set merge) | Clerk |
| `POST /api/hint` | none | `{nodes, edges, challenge}` | `{hint, isAI:false}` (heuristic) | none | Sanitizes prompt; Anthropic call commented |
| `POST /api/evaluate` | none | `{nodes, edges, challenge}` | AIEvaluation JSON | none | Anthropic stub |
| `POST /api/ai/explain` | required* | `{classes, relationships}` (≤30 classes) | `{patterns[], correctness[], suggestions[], summary, isAI}` | `ai_usage` (count for rate limit + insert) | Anthropic (claude-sonnet-4-6) when key set |
| `GET /api/lld/lessons/:slug` | none | path slug | `{payload}` or `{payload:null}` | `module_content` (via `loadLesson`) | — |
| `GET /api/lld/templates-library` | none | `?category&difficulty&q` | `{templates[]}` (≤200) | `lld_templates_library` | — |
| `POST /api/lld/explain-inline` | required if Clerk configured | `{selection, patternSlug, sectionId, sectionRaw}` | `{explanation, isAI, cacheKey?}` | `ai_usage` (rate limit 30/h + insert) | Anthropic (claude-haiku-4-5) |
| `POST /api/lld/ai/suggest-nodes` | required | `{nodes, edges, intent?}` | `{suggestions[]}` | none | `suggestNodes()` lib; rate-limited 20/3min via token bucket |
| `GET /api/lld/learn-progress` | required | — | `{rows[]}` (≤500) | `lld_learn_progress` | Clerk |
| `GET /api/lld/learn-progress/:patternSlug` | required | path | `{progress\|null}` | `lld_learn_progress` | Clerk |
| `PATCH /api/lld/learn-progress/:patternSlug` | required | `{sectionProgress?, activeSectionId?, lastScrollY?, checkpointStats?, bumpVisit?}` | `{progress}` (UPSERT, all-done detection) | `lld_learn_progress` | Clerk |
| `GET /api/lld/bookmarks` | required | `?patternSlug` | `{bookmarks[]}` (≤500) | `lld_bookmarks` | Clerk |
| `POST /api/lld/bookmarks` | required | `{patternSlug, sectionId, anchorId, anchorLabel, note?}` | `{toggled:'on'\|'off', bookmark}` | `lld_bookmarks` (toggle by unique index) | Clerk |
| `PATCH /api/lld/bookmarks/:id` | required | `{note?}` | `{bookmark}` | `lld_bookmarks` | Clerk |
| `DELETE /api/lld/bookmarks/:id` | required | path id | `{deleted}` | `lld_bookmarks` | Clerk |
| `POST /api/lld/concept-reads` | required | `{conceptId, patternSlug, sectionId}` | `{read}` 201 | `lld_concept_reads` | Clerk |
| `POST /api/lld/designs` | required | `{name, description?, templateId?}` | `{design}` 201 | `lld_designs` (slug = slugified-name + 6-char suffix) | Clerk |
| `GET /api/lld/designs` | required | `?status=active\|archived` | `{designs[]}` (≤100) | `lld_designs` | Clerk |
| `GET /api/lld/designs/:id` | required | path | `{design}` (bumps `last_opened_at`) | `lld_designs` | Clerk |
| `PATCH /api/lld/designs/:id` | required | `{name?, description?, status?, isPinned?}` | `{design}` | `lld_designs` | Clerk |
| `DELETE /api/lld/designs/:id` | required | path | `{ok}` (cascade snapshots+annotations) | `lld_designs` | Clerk |
| `POST /api/lld/designs/:id/snapshots` | required | `{canvasState, kind?, label?, note?, nodeCount?, edgeCount?}` | `{snapshot}` 201 | `lld_design_snapshots` (+ touches `lld_designs.updated_at`) | Clerk |
| `GET /api/lld/designs/:id/snapshots` | required | path | `{snapshots[]}` (≤100, newest first) | `lld_design_snapshots` | Clerk |
| `GET /api/lld/designs/:id/annotations` | required | path | `{annotations[]}` (≤500) | `lld_design_annotations` | Clerk |
| `POST /api/lld/designs/:id/annotations` | required | `{kind?, nodeId?, x?, y?, body?, color?, meta?}` | `{annotation}` 201 | `lld_design_annotations`, ownership check on `lld_designs` | Clerk |
| `POST /api/lld/drill-attempts` | required | `{problemId, drillMode\|variant, durationLimitMs}` | `{attempt}` 201 or 409 if active | `lld_drill_attempts` | Clerk |
| `GET /api/lld/drill-attempts` | required | `?status=completed\|abandoned` | `{attempts[]}` (≤100) | `lld_drill_attempts` | Clerk |
| `GET /api/lld/drill-attempts/active` | required | — | `{active\|null}` (auto-abandons idle >30 min) | `lld_drill_attempts` (UPDATE+SELECT) | Clerk |
| `PATCH /api/lld/drill-attempts/:id` | required | `{action: heartbeat\|pause\|resume\|submit\|abandon, canvasState?, gradeScore?, gradeBreakdown?, elapsedBeforePauseMs?}` | `{attempt}` | `lld_drill_attempts` | Clerk |
| `POST /api/lld/drill-attempts/:id/hint` | required | `{tier, stage}` | `{content, followUp, tier, penalty, creditCost}` | `lld_drill_attempts.hintLog` (jsonb concat) | Clerk; hint engine `hint-system` |
| `POST /api/lld/drill-attempts/:id/postmortem` | required | path | `{postmortem, cached?}` (idempotent) | `lld_drill_attempts.postmortem` | Anthropic via `ClaudeClient.getInstance()` |
| `POST /api/lld/drill-attempts/:id/resume` | required | path | `{attempt, turns[], resumedAt}` | `lld_drill_attempts`, `lld_drill_interviewer_turns` | Clerk |
| `POST /api/lld/drill-attempts/:id/turn` | required | `{content, stage}` | delegates to stream POST | proxied | Clerk |
| `POST /api/lld/drill-attempts/:id/grade` | required | `{walkthroughText?, selfGrade?}` | `{rubric, finalScore, hintPenalty, band}` | `lld_drill_attempts`, `lld_drill_interviewer_turns` | `gradeDrillAttempt` (AI-preferred) |
| `PATCH /api/lld/drill-attempts/:id/stage` | required | `{targetStage, progress?}` | `{ok, currentStage, stages}` | `lld_drill_attempts` | Clerk; gate predicates in `drill-stages` |
| `POST /api/lld/drill-interviewer/:id/stream` | required | `{content, stage}` | `{ok, seq}` 201 | `lld_drill_interviewer_turns` (insert), `lld_drill_attempts.lastActivityAt` | Clerk |
| `GET /api/lld/drill-interviewer/:id/stream` | required | path | `text/event-stream` (`delta`, `done`, `error`) | `lld_drill_interviewer_turns` (insert on done) | Anthropic via `ClaudeClient` |

\* `requireAuth()` falls back to a synthetic dev user (`dev-user-local`)
when `NODE_ENV === "development"` and no Clerk session is present
(`src/lib/auth.ts:17-34`). In production this throws `Unauthorized`.

---

## 8. Cross-cutting concerns

### 8.1 Middleware (`src/middleware.ts`)

Single Clerk-wrapped middleware that runs for every request matched by
`config.matcher = ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"]`
(`src/middleware.ts:179-181`). For each request it:

1. **CORS preflight** — short-circuits `OPTIONS` requests on `/api/*`
   with `applyCorsHeaders` against `ALLOWED_ORIGINS`
   (`src/middleware.ts:58-67`).
2. **API rate limiting** — pulls a singleton `getApiRateLimiter()` and
   checks the client IP (resolved from `x-vercel-forwarded-for`,
   `x-forwarded-for`, `x-real-ip`, or literal `"unknown"`).
   Limit advertised: 100 tokens. On rejection returns 429 with
   `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining: 0`,
   `X-RateLimit-Reset` (`src/middleware.ts:69-100`).
3. **Auth** — when `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set and the
   route is not in `isPublicRoute(...)`, calls `auth.protect()`.
   Public matchers include: `/`, all module pages, `/api/webhooks(.*)`,
   `/api/health`, `/api/templates`, `/api/challenges`, `/api/content(.*)`,
   `/api/csp-report`, `/api/oembed(.*)`, `/api/og(.*)`
   (`src/middleware.ts:10-35`).
4. **Per-response security headers** — `Content-Security-Policy` with a
   freshly generated nonce (`generateNonce()` from `lib/security/csp`),
   `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin`,
   `Permissions-Policy: camera=(), microphone=(), geolocation=()`,
   `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
   `X-XSS-Protection: 1; mode=block` (`src/middleware.ts:111-128`).
5. **Static API caching** — paths in
   `[/api/templates, /api/challenges, /api/health, /api/content]` get
   `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200`
   (`src/middleware.ts:144-161`).
6. **CSP report-only** — in production, an additional
   `Content-Security-Policy-Report-Only` header is appended pointing at
   `/api/csp-report` (`src/middleware.ts:164-168`).
7. **CORS on response** — `applyCorsHeaders(response, origin)` for any
   `/api/*` path (`src/middleware.ts:171-174`).

### 8.2 Per-route rate limits

Beyond the global IP limiter, three routes apply user-scoped limits:

* `api/lld/ai/suggest-nodes` — token bucket
  `maxTokens=20, refillRate=1, refillInterval=180_000` (~20/h per user)
  via `createRateLimiter` (`src/app/api/lld/ai/suggest-nodes/route.ts:13-25`).
* `api/lld/explain-inline` — DB-backed window: count of `ai_usage` rows
  with `purpose='lld-explain-inline'` in the last 60 min, ceiling 30
  (`src/app/api/lld/explain-inline/route.ts:34-67`).
* `api/ai/explain` — DB-backed window of 10/h with
  `purpose='explain'` (`src/app/api/ai/explain/route.ts:316-335`).

### 8.3 Error envelopes

Every authenticated route uses the same shape:

```
on Unauthorized (thrown by requireAuth):  { error: "Unauthorized" }   401
on missing user UUID:                     { error: "User not found" } 404
on JSON parse failure:                    { error: "Invalid JSON in request body." } 400
on validation:                            { error: "<descriptive>" } 400
on conflict (drill active, stage gate):   { error, code? } 409
on rate limit:                            { error, retryAfter? } 429
on uncaught:                              { error: "Internal server error" } 500
```

Successful payloads are not wrapped in a single envelope — each route
returns its domain key directly (`{ diagram }`, `{ items }`, `{ ok: true }`).
There is no shared `ApiResponse<T>` interface in source.

### 8.4 Validation strategy

There is **no Zod / Yup / Valibot** in the API routes. Every handler
hand-rolls validation: explicit `typeof`, `Array.isArray`, allow-list
sets (`VALID_ACTIONS`, `VALID_KINDS`, `STAGE_SET`, `TIER_SET`),
length caps, and numeric bounds. Examples:

* `lld/drill-attempts` POST: requires `durationLimitMs >= 60_000` and
  variant ∈ `{exam, timed-mock, study}` (legacy `interview/guided/speed`
  remapped) (`src/app/api/lld/drill-attempts/route.ts:14-69`).
* `lld/drill-attempts/[id]/stage` PATCH: only allows
  `target == nextStage(current) || target == previousStage(current)`,
  and on advance applies `canAdvance(current, progress)` gate
  (`src/app/api/lld/drill-attempts/[id]/stage/route.ts:82-104`).
* `progress` POST: clamps `score ∈ [0, 1]`
  (`src/app/api/progress/route.ts:98-103`).
* `hint`/`evaluate`/`ai/explain`: payload caps (`nodes ≤ 200`, `edges ≤ 400`,
  `classes ≤ 30`).

### 8.5 Prompt safety

Every route that forwards user-supplied strings into an LLM prompt
imports `sanitizeUserInput` from
`@/lib/ai/prompt-safety` and applies it before the system prompt is
built (`hint`, `evaluate`, `ai/explain`, `lld/explain-inline`).

### 8.6 Request IDs / tracing

There is no explicit `X-Request-ID` issuance. The drill-abandon PATCH
adds an ad-hoc trace log (`[DRILL-ABANDON-TRACE] id=... userAgent=... referer=...`)
to diagnose unexpected auto-abandons
(`src/app/api/lld/drill-attempts/[id]/route.ts:54-61`); other routes
log only on error.

---

## 9. OG image / oEmbed / email-preview

### 9.1 `/api/og` — main social card

`src/app/api/og/route.tsx` exports `runtime = "edge"` (line 11). It
constructs a 1200×630 image via `next/og`'s `ImageResponse` with:

* Dark gradient background (`#1e1033 → #0f1729 → #0c1220`) plus a 40px
  grid overlay and two radial-gradient glow accents.
* Type badge derived from `?type` (one of `concept`, `problem`,
  `pattern`, `blog`, `landing`, `pricing`, `interview`, `data-structure`).
* Optional difficulty pill, optional category pill (DS only), optional
  4-column complexity table when `?complexity="Access:O(1),...".`.
* Optional avatar — passed through `validateURL` (SSRF protection from
  `lib/security/ssrf`); unsafe URLs are silently dropped
  (`src/app/api/og/route.tsx:65-72`).
* Title clamped to 80 chars; font-size adjusts on title length.

Returns `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400`.

### 9.2 `/api/og/database` — module-specific card

`src/app/api/og/database/route.tsx` (also `runtime = "edge"`). Pulls
heading/description for the `?mode` slug from `lib/seo/database-meta`
and renders a similar card with a Twemoji-rendered icon plus
mode-specific accent color. Same caching headers.

### 9.3 `/api/oembed` — link unfurling

`src/app/api/oembed/route.ts` (Node runtime). Validates `?url`'s
hostname is `architex.app|www.architex.app|localhost`, builds an
`<iframe>` HTML with `sandbox="allow-scripts allow-same-origin"`,
points the embed at `/embed?d=<encoded>`, and returns
`type: "rich"` JSON with a `thumbnail_url` pointing back at `/api/og`.
Cache: `public, max-age=86400, s-maxage=604800` plus
`Access-Control-Allow-Origin: *`.

### 9.4 `/api/email-preview` — dev-only renderer

`src/app/api/email-preview/route.ts` returns 403 outside development
(`route.ts:19-23`). When called with `?template=<name>`, it renders
the matching template from `lib/email/templates` (`welcome`, `digest`,
`streak`, `achievement`) as `text/html`. With no query, it serves an
index page listing the templates.

---

## 10. Health check

`GET /api/health` is the lightest route in the codebase
(`src/app/api/health/route.ts:3-10`):

```json
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

It does **not** verify database reachability, run a `SELECT 1`, ping
Anthropic, or test IndexedDB. It is a process-liveness probe only —
its successful response means the Next.js handler ran, nothing more.
The middleware caches it for 1h public / 24h CDN, so consumers should
not poll it for connectivity diagnostics.

---

## 11. Search

`GET /api/search?q=<term>&module=<id>` (`src/app/api/search/route.ts`).

Backing index: **PostgreSQL ILIKE with weighted CASE ranking** —
no tsvector / GIN, no FTS columns, no client-side index.
Implementation:

* Requires `q.length >= 2` (`route.ts:33-38`).
* Builds `pattern = "%" + q + "%"`.
* Weighted score expression:
  `name match = 4, category = 3, tags = 2, summary = 1`
  evaluated via a `CASE` expression in both the SELECT (as `rank`)
  and the ORDER BY (`route.ts:61-86`).
* `WHERE` filter ORs across `name`, `summary`, `category`, and
  `array_to_string(tags, ' ')` — so the same expression that
  ranks rows also gates them.
* `LIMIT 20`.
* Adds a 120-char `snippet` per result via `generateSnippet()`
  (`route.ts:107-118`).
* Cache: `public, max-age=300, s-maxage=3600, stale-while-revalidate=1800`.

The route comments explicitly note the upgrade path: when a tsvector
migration is applied, the implementation can switch to `ts_rank` and
`ts_headline`. As of the current six migrations, no such column exists.

---

## 12. Quirks

* **Dual-driver query types.** `getDb()` always returns
  `NeonHttpDatabase<Schema>` even when running on `pg.Pool`, by an
  `as unknown as DbInstance` cast (`src/db/index.ts:50-54`). This is
  load-bearing: Drizzle's discriminated return types over the two
  drivers widen `.returning({...})` inference in ways that break
  every route that destructures `[created] = ...returning()`.

* **One active drill per user enforced at the index level.**
  `lld_drill_attempts.one_active_drill_per_user` is a partial-unique
  index (`WHERE submitted_at IS NULL AND abandoned_at IS NULL`).
  The POST handler catches the resulting unique violation
  *robustly* — it does not match on the index name in the error
  message because Drizzle/pg sometimes wraps the error and loses the
  literal name. Instead it inspects `error.code === "23505"`,
  `error.constraint`, `error.cause?.code`, `error.cause?.constraint`,
  and falls back to a substring check of `"duplicate key value"` in
  the message (`src/app/api/lld/drill-attempts/route.ts:85-114`). On
  match it returns 409 with `code: "ACTIVE_DRILL_EXISTS"` so the UI
  can offer "Abandon & start new" inline (matches recent commits
  `59ce60b` and `3e6100d`).

* **Drill auto-abandon by GET /active.** Each call to
  `GET /api/lld/drill-attempts/active` runs an `UPDATE ... SET abandoned_at=now()`
  on any active drill where `last_activity_at` is older than 30 min
  (`src/app/api/lld/drill-attempts/active/route.ts:25-37`). This means
  loading the active-drill view *can* abandon the drill in flight —
  the recent `904f751` commit added a trace log on PATCH abandon to
  diagnose unexpected occurrences.

* **Phase-1 / Phase-4 variant aliasing.** `lld/drill-attempts` POST
  accepts both `drillMode` (Phase-1: `interview|guided|speed`) and
  `variant` (Phase-4: `exam|timed-mock|study`) and remaps via
  `PHASE1_TO_PHASE4` (`src/app/api/lld/drill-attempts/route.ts:14-21`).
  This keeps old clients working while the schema retains both columns.

* **Hint tier ladder enforcement.** `lld/drill-attempts/[id]/hint`
  refuses to issue a hint unless the requested tier is exactly one
  step above the highest tier already consumed in the current stage
  (`route.ts:99-114`). A "skip ahead" attempt returns 409 with
  `code: "TIER_LADDER"`. Penalties also draft against
  `variantConfig.maxHintPenalty` and return 409
  `code: "BUDGET_EXHAUSTED"` if exceeded.

* **JSONB merges via raw SQL.** Two routes fall through to raw `sql`
  fragments because Drizzle has no helper for partial JSONB updates:
  `user-preferences/lld` PATCH does
  `jsonb_set(coalesce(prefs,'{}'), '{lld}', coalesce(prefs->'lld','{}') || $newPatch::jsonb)`
  (`src/app/api/user-preferences/lld/route.ts:64-78`), and
  `lld/drill-attempts/[id]/hint` appends with
  `coalesce(hint_log,'[]') || $newEntry::jsonb`
  (`src/app/api/lld/drill-attempts/[id]/hint/route.ts:147-156`).

* **Single-route dev-mode auth bypass.** `src/lib/auth.ts:17-34`
  defines `DEV_CLERK_ID = "dev-user-local"`. When `NODE_ENV === "development"`
  and there is no Clerk session, every authenticated route silently
  uses this synthetic ID and `resolveUserId` upserts a matching
  `users` row (`auth.ts:71-82`). This is invisible to the route
  handlers and disables any production assumption that
  `requireAuth()` ⇒ real human.

* **`turn` is an alias.** `api/lld/drill-attempts/[id]/turn` is a
  one-line file that re-exports the `POST` from
  `api/lld/drill-interviewer/[id]/stream/route.ts`. Both endpoints
  persist a user turn; `useDrillInterviewer` hits `turn` first to
  store the message, then opens an SSE connection on `stream` to
  receive the interviewer reply (`route.ts:1-17`).

* **CSP report endpoint never errors.** `csp-report` always returns
  `204 No Content` — even on parse failure or unexpected exception
  (`src/app/api/csp-report/route.ts:73-77`). This is intentional:
  any 4xx/5xx would cause the browser to retry-storm.

* **Email preview is dev-gated by env, not by middleware.** Even
  though the middleware does not list `/api/email-preview` in
  `isPublicRoute(...)`, the route itself returns 403 outside
  development. In production with Clerk configured, an unauth'd
  user gets 401 from middleware before reaching the handler; in
  production without Clerk configured (auth bypass), they would get
  403 from the handler.

* **`oembed` whitelists localhost.** Useful in dev, slightly
  surprising in code review — production-deployed apps treating
  `localhost` as a trusted origin can be a vector if requests are
  ever proxied (`src/app/api/oembed/route.ts:76-86`).

* **OG avatar SSRF protection.** `src/app/api/og/route.tsx:64-72`
  only fetches `?avatar=` URLs that pass `validateURL` from
  `lib/security/ssrf`. Failures are dropped silently — the resulting
  card simply omits the avatar. No 4xx is returned to the caller.

* **`templates` route has a static fallback.** When
  `NEXT_PUBLIC_SYSDESIGN_USE_API=true`, the route reads from
  `module_content` rows where `module_id="system-design"` and
  `content_type="template"`. On any DB error (including transient
  Neon hiccups), it logs and falls through to the in-memory
  `SYSTEM_DESIGN_TEMPLATES` array
  (`src/app/api/templates/route.ts:71-141`). That array is the source
  of truth when the env var is unset.

* **Quiz `correctIndex` is shipped to the client.** The quiz route
  performs a plain `SELECT *` on `quiz_questions` with no projection,
  so `correct_index` and `explanation` are sent down the wire in
  the same response that renders the question. The client is
  expected to defer revealing them; there is no server-side quiz
  validation endpoint.

* **Health route ignores DB.** As noted in §10, `/api/health` does
  no liveness check against Postgres. A green `/api/health` does not
  imply that any other route will succeed.

---

## 13. Open questions

1. **Why is `pg.Pool` cast to `NeonHttpDatabase`?** The cast is
   load-bearing for `.returning({...})` inference but means a runtime
   API mismatch (e.g. a pg-only function call) would not be caught at
   compile time. Worth a comment-level audit when Drizzle releases a
   driver-agnostic DB type.

2. **Are there pool size / SSL knobs we are missing?** `src/db/index.ts`
   passes only `connectionString` to `pg.Pool`. Production load on the
   local-pg path (e.g. tests) inherits node-postgres defaults
   (max 10). For Neon, the HTTP driver does not pool — every query is
   a fetch. No explicit retry/backoff is configured for either path.

3. **Why is `templates` table dormant?** It exists with FK + indexes
   but no route reads it. The `templates` API route uses
   `module_content` instead. If user-authored templates ever ship,
   this divergence will need to be reconciled.

4. **Achievements + user_achievements have no API surface.** Both
   tables are seeded but not exposed via any GET route in
   `src/app/api/**`. Either there is an unsurfaced internal reader,
   or the achievements UI is not yet wired up.

5. **Gallery has tables but no route.** `gallery_submissions` and
   `gallery_upvotes` are fully indexed but no `/api/gallery/*` route
   exists. The middleware lists `/gallery(.*)` as public, suggesting
   a frontend page exists, but the data path is unclear.

6. **No structured request logging.** Apart from `console.error` on
   uncaught exceptions and the ad-hoc `[DRILL-ABANDON-TRACE]` log,
   the API has no JSON-structured request logger. CSP violations are
   `console.warn`'d. No request-ID is propagated across handlers.

7. **Search will not survive accent / typo / multilingual queries.**
   ILIKE on `%q%` is case-insensitive but byte-exact. The route's
   own comments anticipate moving to `tsvector + ts_rank`; no
   migration has been generated yet.

8. **No down-migrations.** Drizzle Kit does not generate them by
   default and the repository keeps to that. Reverting the Phase-4
   drill columns (0004) would require a hand-written DDL.

9. **`activity_events.metadata` is unstructured.** No discriminated
   union or schema guard — any client can write any JSON. If
   downstream consumers (achievements, streaks) start to rely on
   keys inside `metadata`, a documented or enforced shape will be
   needed.

10. **IndexedDB cache TTL choices are scattered.** Each consumer
    picks its own `ttlMs` (e.g. postmortem: 24h in
    `lld/drill-attempts/[id]/postmortem`). There is no global
    invalidation hook — clearing the cache means clearing the
    whole database (`AIResponseCache.clear()`), which also nukes
    ongoing project state.

11. **`/api/oembed` whitelisting localhost.** This may need a
    production-only branch, or removal, before broader rollout.

12. **`/api/og` cache vs avatar.** OG image cache is keyed on full
    query string; if a malicious caller can guess avatar URLs that
    pass `validateURL` but render unwanted content, the cached image
    will be served from CDN for a week. Worth confirming `validateURL`
    rejects everything outside an explicit allow-list.
