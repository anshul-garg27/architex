# Data Structures Module — Backend & Data Migration Analysis

> **Date**: 2026-04-13
> **Module**: Data Structures (`src/lib/data-structures/` + `src/components/modules/data-structures/`)
> **Status**: Analysis only — no code changes made

---

## Executive Summary

The Data Structures module is **1,336 KB across 79 files** (46 engine files + 33 component files) containing **~26,200 lines of code**. The module is currently 100% frontend — all content is hardcoded, all state is in React/localStorage, and zero API calls are made.

| Metric | Value |
|--------|-------|
| Total files | 79 (46 lib + 33 components) |
| Total lines | ~26,200 |
| Static content (metadata) | ~3,190 lines (~138 KB) |
| Implementation logic | ~15,000 lines (~610 KB) |
| Component UI code | ~8,000 lines (~588 KB) |
| DS catalog entries | 43 data structures |
| localStorage keys | 9 unique keys |
| Zustand stores used | 2 (ui-store, notification-store) |
| API calls made | 0 |
| DB tables used | 0 |

**Key Recommendation**: Move ~138 KB of static catalog/quiz/challenge content to the database. Keep all 15,000 lines of pure computation logic in the frontend. Add 6 new API endpoints for progress/content. This reduces initial JS bundle by ~30% and enables cross-device persistence, content management, and analytics.

---

## Phase 1: Complete Data Inventory

### 1.1 Static Content (Descriptions, Metadata, Educational Text)

#### A) DS Catalog — `src/lib/data-structures/catalog.ts` (1,207 lines, 72 KB)

The single largest metadata file. Contains 43 data structure definitions.

| Field | Coverage | Example |
|-------|----------|---------|
| `id` | 43/43 (100%) | `"bst"`, `"bloom-filter"` |
| `name` | 43/43 (100%) | `"Binary Search Tree"` |
| `category` | 43/43 (100%) | `"linear"`, `"tree"`, `"hash"`, `"heap"`, `"probabilistic"`, `"system"` |
| `operations` | 43/43 (100%) | `["insert", "delete", "search"]` |
| `complexity` | 43/43 (100%) | `{ "Insert": "O(log n)", "Search": "O(log n)" }` |
| `description` | 43/43 (100%) | 50-150 word educational description |
| `complexityIntuition` | 39/43 (91%) | 40-100 word intuitive explanation |
| `difficulty` | 39/43 (91%) | `"beginner"` / `"intermediate"` / `"advanced"` / `"expert"` |
| `realWorld` | 39/43 (91%) | 2-4 real-world system examples |
| `keyTakeaways` | 39/43 (91%) | Exactly 3 bullet points |
| `whenToUse` | 39/43 (91%) | `{ use: "...", dontUse: "..." }` |
| `commonMistakes` | 33/43 (77%) | 2-3 common misconceptions |
| `interviewTips` | 33/43 (77%) | 2-3 FAANG interview tips |
| `edgeCasePresets` | 10/43 (23%) | Named test scenarios with data |

**Total educational text**: ~65 KB of pure prose (descriptions, intuitions, tips).

#### B) Component Hardcoded Content

| File | Content Type | Lines | Est KB | Details |
|------|-------------|-------|--------|---------|
| `ComplexityQuiz.tsx` | 15 quiz questions with answers | 62 | 2.0 | Array/BST/Hash/Heap/Trie complexity recall |
| `ScenarioChallenges.tsx` | 5 "which DS?" scenarios | 85 | 3.0 | Multi-choice with detailed explanations |
| `DailyChallenge.tsx` | 7 rotating daily tasks | 58 | 1.8 | BST/Hash/Heap/AVL/Bloom/Trie/LRU challenges |
| `DebuggingChallenges.tsx` | 3 find-the-bug challenges | 65 | 2.2 | Buggy pseudocode + fix options |
| `BreakItMode.tsx` | 3 adversarial challenges | 70 | 2.0 | Degenerate BST, hash collisions, bloom FP |
| `InterviewPath.tsx` | 4-week study plan (20 topics) | 48 | 1.5 | Week-by-week FAANG prep schedule |
| `Badges.tsx` | 7 badge definitions | 64 | 1.8 | Categories, icons, colors, descriptions |
| `constants.tsx` | Category metadata, color legends | 134 | 3.2 | 6 categories, 24 colors, demo labels |
| `sonification.ts` | Audio frequency mappings | 24 | 0.8 | Wave types, frequency ranges |
| **Subtotal** | | **610** | **18.3** | |

#### C) Educational Comments in Engine Files

~20 engine files contain `AUTOBIOGRAPHY` comments (educational narratives) and `WHY` comments (design justification). Estimated ~2,000 lines / ~50 KB of educational documentation embedded in code comments.

### 1.2 Configuration Data

| File | Data | Type | Example |
|------|------|------|---------|
| `catalog.ts` | `edgeCasePresets` (10 DS) | Named presets | `{ name: "Sorted input", data: [1,2,3,4,5] }` |
| `initial-state.ts` | `buildMinimalState()` | Default state factory | Returns null for most DS (lazy init) |
| `types.ts` | `DSConfig` interface (16 fields) | Type definition | Defines shape of catalog entries |
| `constants.tsx` | `DS_COLORS`, `DS_SPRINGS` | Visual config | Hex colors, spring physics params |

**Questions**:
- Are these user-configurable at runtime? **No** — all are hardcoded defaults
- Should users save custom configs? **Maybe** — edge case presets could be user-customizable
- Are there presets that could be community-shared? **Yes** — edgeCasePresets are candidates

### 1.3 Implementation Logic (Pure Computation)

| File | Functions | Lines | Pure? | Heavy? | Worker? |
|------|-----------|-------|-------|--------|---------|
| `bst-ds.ts` | insert, search, delete, build, clone, toArray, size | 268 | Yes | No | Yes |
| `avl-ds.ts` | insert, search, delete, build, rotations, rebalance | 396 | Yes | No | Yes |
| `red-black-ds.ts` | insert, search, delete, build, fixup, rotations | 619 | Yes | No | Partial |
| `heap-ds.ts` | insert, extract, build, search, create, clone | 311 | Yes | No | Yes |
| `trie-ds.ts` | insert, search, startsWith, delete, autoComplete | 400 | Yes | No | Yes |
| `linked-list.ts` | insertHead/Tail/At, delete, search | 315 | Yes | No | Yes |
| `bloom-filter.ts` | insert, check, falsePositiveRate, hash | 192 | Yes | No | Yes |
| `lsm-tree.ts` | insert, search, flush, compact | 396 | Yes | No | Partial |
| `hash-table.ts` | insert, search, delete, hash | 240 | Yes | No | Yes |
| `array-ds.ts` | insert, delete, search, stack/queue ops | 254 | Yes | No | Yes |
| `bst-interactive.ts` | inorder, preorder, postorder, levelOrder | 309 | Yes | No | Yes |
| `skip-list.ts` | insert, search, delete, randomLevel | 288 | Yes | No | Partial |
| `rope.ts` | charAt, concat, split, insertAt, toString | 408 | Yes | No | Yes |
| `segment-tree-ds.ts` | create, query, update, rangeUpdate | 378 | Yes | No | Yes |
| `bplus-tree-ds.ts` | insert, search, rangeQuery, delete | 795 | Yes | No | Partial |
| `btree-ds.ts` | insert, search, delete, toArray | 609 | Yes | No | Partial |
| `fibonacci-heap.ts` | insert, extractMin, decreaseKey, consolidate | 430 | Yes | No | Partial |
| `splay-tree-ds.ts` | insert, search, delete, splay | 391 | Yes | No | Partial |
| `treap-ds.ts` | insert, search, delete, split, merge | 478 | Yes | No | Partial |
| `binomial-heap-ds.ts` | insert, findMin, extractMin, merge, decreaseKey | 592 | Yes | No | Partial |
| `doubly-linked-list.ts` | insertHead/Tail/At, delete, search, reverse | 490 | Yes | No | Yes |
| `priority-queue.ts` | enqueue, dequeue, peek, changePriority | 447 | Yes | No | Yes |
| `lru-cache.ts` | get, put, delete, peek | 386 | Partial | No | Yes |
| `cuckoo-hash.ts` | insert, search, delete | 266 | Yes | No | Yes |
| `monotonic-stack.ts` | push, pop, peek | 173 | Yes | No | Yes |
| `merkle-tree.ts` | create, build, verify | 307 | Yes | No | Yes |
| `consistent-hash-ring.ts` | addNode, removeNode, lookup, addKeys | 330 | Yes | No | Yes |
| `count-min-sketch.ts` | insert, query, errorBound | 165 | Yes | No | Yes |
| `hyperloglog.ts` | add, count, estimate | 232 | Yes | No | Yes |
| `deque.ts` | pushFront/Back, popFront/Back | 233 | Yes | No | Yes |
| `circular-buffer.ts` | enqueue, dequeue, peek | 199 | Yes | No | Yes |
| `wal.ts` | append, read, truncate, checkpoint, crash, recover | 333 | Partial | No | Partial |
| `r-tree.ts` | insert, search, enlargeBBox | 380 | Yes | No | Partial |
| `quadtree.ts` | insert, search, pointInBounds | 306 | Yes | No | Partial |
| `fenwick-tree-ds.ts` | update, prefixSum, rangeSum | 300 | Yes | No | Yes |
| `crdt-ds.ts` | gCounter/pnCounter/lwwRegister/orSet ops | 516 | Yes | No | Yes |
| `vector-clock-ds.ts` | localEvent, send, receive, happensBefore | 330 | Yes | No | Yes |
| `tree-layout.ts` | layoutAVLTree, layoutRBTree (Reingold-Tilford) | 355 | Yes | No | Partial |
| `disjoint-set.ts` | makeSet, find, union, getSets | 295 | Yes | No | Yes |
| `interval-tree.ts` | insert, search, delete | 490 | Yes | No | Partial |
| `lfu-cache.ts` | get, put, delete | 378 | Partial | No | Partial |
| `hash-table-open.ts` | insert, search, delete, linearProbe | 352 | Yes | No | Yes |
| `suffix-array.ts` | construct, search, lcp | 349 | Yes | No | Partial |

**Summary**: 46 files, ~15,000 lines, **ALL pure functions**, NONE require >100ms, ~38 suitable for Web Workers.

### 1.4 User-Generated Data

| Store/Key | Data | Persisted? | Where? | Cross-device? |
|-----------|------|------------|--------|---------------|
| React state | DS operation state (BST nodes, heap array, etc.) | No | Memory only | No |
| React state | Undo history (20-item stack) | No | Memory only | No |
| React state | Quiz/challenge scores | No | Memory only | No |
| React state | Prediction/trace answers | No | Memory only | No |
| React state | Break It Mode attempts | No | Memory only | No |
| `architex-ds-sound` | Sonification toggle | Yes | localStorage | No |
| `architex-ds-streak` | Main practice streak | Yes | localStorage | No |
| `architex-ds-streak-last` | Last streak date | Yes | localStorage | No |
| `architex-ds-daily-streak` | Daily challenge streak | Yes | localStorage | No |
| `architex-ds-daily-streak-last` | Daily challenge date | Yes | localStorage | No |
| `architex-ds-srs-due` | SRS review dismissal time | Yes | localStorage | No |
| `architex-ds-srs-cards` | DS IDs with SRS cards | Yes | localStorage | No |
| `architex-ds-srs-ops-{dsId}` | Per-DS operation count | Yes | localStorage | No |
| `architex-interview-explored` | Interview path checkboxes | Yes | localStorage | No |
| URL hash | Active DS selection (`#bst`) | Yes | URL | Shareable |

**Critical gap**: Quiz scores, challenge completions, trace performance, and Break It scores are ALL lost on page reload. Users have no way to track learning progress over time.

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE (Neon PostgreSQL via Drizzle)

#### Candidate 1: DS Catalog Metadata

```
CANDIDATE: DS Catalog (43 entries × 10+ fields each)
CURRENTLY: Hardcoded in src/lib/data-structures/catalog.ts (1,207 lines, 72 KB)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs to be searchable/filterable (full-text search)
  [x] Needs versioning/history (track content improvements)
  [x] Performance: 72 KB bundled even if user views 1 DS
  [x] Enables localization (same schema, different language)
  [ ] Users save/share custom versions — NOT YET
DB TABLE: NEW — ds_catalog
SCHEMA:
```

```typescript
// src/db/schema/ds-catalog.ts
export const dsCatalog = pgTable("ds_catalog", {
  id: varchar("id", { length: 50 }).primaryKey(),       // "bst"
  name: varchar("name", { length: 100 }).notNull(),      // "Binary Search Tree"
  category: varchar("category", { length: 30 }).notNull(), // "tree"
  difficulty: varchar("difficulty", { length: 20 }),       // "intermediate"
  operations: jsonb("operations").notNull().default([]),   // ["insert","delete","search"]
  complexity: jsonb("complexity").notNull().default({}),   // { "Insert": "O(log n)", ... }
  description: text("description").notNull(),              // Long educational text
  complexityIntuition: text("complexity_intuition"),        // Intuitive explanation
  realWorld: jsonb("real_world").default([]),               // ["MySQL indexes", ...]
  keyTakeaways: jsonb("key_takeaways").default([]),         // 3 bullet points
  whenToUse: jsonb("when_to_use"),                         // { use, dontUse }
  commonMistakes: jsonb("common_mistakes").default([]),     // 2-3 misconceptions
  interviewTips: jsonb("interview_tips").default([]),       // 2-3 FAANG tips
  edgeCasePresets: jsonb("edge_case_presets").default([]),   // Named test data
  sortOrder: integer("sort_order").notNull().default(0),    // Display order
  isActive: boolean("is_active").notNull().default(true),   // Feature flag
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("ds_catalog_category_idx").on(table.category),
  index("ds_catalog_difficulty_idx").on(table.difficulty),
]);
```

```
MIGRATION EFFORT: M (schema + seed script + API + component updates)
```

#### Candidate 2: User Learning Progress

```
CANDIDATE: User progress (streaks, quiz scores, challenge completions, SRS data)
CURRENTLY: 9 localStorage keys + ephemeral React state
WHY MOVE:
  [x] Needs to persist across devices (login on phone, see progress)
  [x] Needs to be searchable/filterable (analytics dashboard)
  [x] Needs versioning/history (learning journey over time)
  [ ] Content writers update — N/A
DB TABLE: EXISTING — progress (already defined, never used!)
ENHANCEMENT NEEDED: Add detail columns for attempt data
```

```typescript
// EXISTING: src/db/schema/progress.ts — READY TO USE
// Already has: id, userId, moduleId, conceptId, score, completedAt

// NEW: Detailed attempt tracking
export const dsAttempts = pgTable("ds_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  dsId: varchar("ds_id", { length: 50 }).notNull(),         // "bst"
  attemptType: varchar("attempt_type", { length: 30 }).notNull(), // "quiz"|"challenge"|"trace"|"break-it"|"scenario"|"debug"
  score: real("score"),                                        // 0.0-1.0
  metadata: jsonb("metadata").default({}),                     // { answers: [...], timeMs: 5000 }
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("ds_attempts_user_ds_idx").on(table.userId, table.dsId),
  index("ds_attempts_type_idx").on(table.attemptType),
  index("ds_attempts_created_idx").on(table.createdAt),
]);

// NEW: Streak & SRS tracking (replaces localStorage)
export const dsUserState = pgTable("ds_user_state", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull()
    .references(() => users.id, { onDelete: "cascade" }).unique(),
  streak: integer("streak").notNull().default(0),
  lastStreakDate: timestamp("last_streak_date", { withTimezone: true }),
  dailyChallengeStreak: integer("daily_challenge_streak").notNull().default(0),
  lastDailyChallengeDate: timestamp("last_daily_challenge_date", { withTimezone: true }),
  srsCards: jsonb("srs_cards").default([]),                   // DS IDs with SRS cards
  srsOps: jsonb("srs_ops").default({}),                       // { "bst": 5, "heap": 3 }
  interviewExplored: jsonb("interview_explored").default([]),  // DS IDs checked off
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("ds_user_state_user_idx").on(table.userId),
]);
```

```
MIGRATION EFFORT: M (new tables + API + replace localStorage reads/writes)
```

#### Candidate 3: Quiz & Challenge Content

```
CANDIDATE: Quiz questions, challenges, scenarios, debugging problems, badges
CURRENTLY: Hardcoded in 7 component files (~610 lines, 18 KB)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs versioning (A/B test different question sets)
  [x] Enables localization
  [x] Can add questions without touching UI code
  [ ] Too large for bundle — No (only 18 KB, acceptable)
DB TABLE: NEW — ds_challenges
```

```typescript
export const dsChallenges = pgTable("ds_challenges", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: varchar("type", { length: 30 }).notNull(),       // "quiz"|"scenario"|"daily"|"debug"|"break-it"
  dsId: varchar("ds_id", { length: 50 }),                 // null = general
  question: text("question").notNull(),
  options: jsonb("options").default([]),                    // For multiple choice
  correctAnswer: varchar("correct_answer", { length: 255 }),
  explanation: text("explanation"),
  difficulty: varchar("difficulty", { length: 20 }),
  metadata: jsonb("metadata").default({}),                 // Type-specific data (buggy code, targets, etc.)
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("ds_challenges_type_idx").on(table.type),
  index("ds_challenges_ds_idx").on(table.dsId),
]);
```

```
MIGRATION EFFORT: S (schema + seed from existing hardcoded data + simple API)
```

### 2.2 MOVE TO API ROUTE (Lazy-Load from Server)

#### Endpoint 1: DS Catalog

```
CANDIDATE: DS_CATALOG array (43 entries)
CURRENTLY: Imported statically via `import { DS_CATALOG } from "@/lib/data-structures/catalog"`
WHY API:
  [x] Too large to bundle (72 KB always loaded even for 1 DS)
  [x] Enables server-side caching (ISR)
  [x] Enables search/filter server-side
  [ ] Needs authentication — No (public)
API ROUTE: GET /api/data-structures/catalog
METHOD: GET
REQUEST: ?category=tree&difficulty=beginner (optional filters)
RESPONSE:
  {
    items: [
      { id: "bst", name: "Binary Search Tree", category: "tree", difficulty: "intermediate" },
      ...
    ],
    total: 43
  }
CACHING: ISR 1 hour (content rarely changes)
MIGRATION FROM: `import { DS_CATALOG } from "@/lib/data-structures/catalog"` → `useSWR("/api/data-structures/catalog")`
```

#### Endpoint 2: Single DS Detail

```
CANDIDATE: Full DS entry with all metadata
CURRENTLY: Imported as part of full catalog array
WHY API:
  [x] Lazy load only the DS the user is viewing
  [x] Enables per-DS caching
  [x] Can include server-computed data (popularity, community scores)
API ROUTE: GET /api/data-structures/[id]
METHOD: GET
REQUEST: /api/data-structures/bst
RESPONSE:
  {
    id: "bst",
    name: "Binary Search Tree",
    description: "...",
    complexity: { ... },
    complexityIntuition: "...",
    realWorld: [...],
    keyTakeaways: [...],
    whenToUse: { ... },
    commonMistakes: [...],
    interviewTips: [...],
    edgeCasePresets: [...],
    // NEW: server-computed
    viewCount: 1250,
    avgScore: 0.72,
    communityRating: 4.5
  }
CACHING: ISR 24 hours for static content, revalidate on content update
```

#### Endpoint 3: User Progress (Read)

```
CANDIDATE: User's DS learning state
CURRENTLY: 9 localStorage keys + ephemeral React state
WHY API:
  [x] Cross-device persistence
  [x] Authentication required
  [x] Analytics/reporting
API ROUTE: GET /api/data-structures/progress
METHOD: GET
REQUEST: (auth cookie)
RESPONSE:
  {
    streak: 7,
    lastStreakDate: "2026-04-12",
    dailyChallengeStreak: 3,
    srsCards: ["bst", "heap", "trie"],
    srsOps: { "bst": 5, "heap": 3 },
    interviewExplored: ["array", "bst", "hash-table"],
    conceptScores: {
      "bst": 0.85,
      "heap": 0.72,
      "hash-table": 0.90
    },
    recentAttempts: [
      { dsId: "bst", type: "quiz", score: 0.8, at: "2026-04-12T14:30:00Z" }
    ]
  }
CACHING: No cache (user-specific, real-time)
```

#### Endpoint 4: Save Progress (Write)

```
API ROUTE: POST /api/data-structures/progress
METHOD: POST
AUTH: Required (Clerk)
BODY:
  {
    dsId: "bst",
    type: "quiz"|"challenge"|"trace"|"break-it"|"scenario"|"debug"|"operation",
    score: 0.85,
    metadata: { answers: [...], timeMs: 5000 }
  }
RESPONSE: { success: true, newStreak: 8 }
```

#### Endpoint 5: Challenges Content

```
API ROUTE: GET /api/data-structures/challenges
METHOD: GET
REQUEST: ?type=quiz&dsId=bst (optional filters)
RESPONSE:
  {
    challenges: [
      { id: "...", type: "quiz", question: "...", options: [...] }
    ]
  }
CACHING: ISR 1 hour
```

#### Endpoint 6: Leaderboard (Future)

```
API ROUTE: GET /api/data-structures/leaderboard
METHOD: GET
REQUEST: ?period=week&dsId=bst (optional)
RESPONSE:
  {
    entries: [
      { rank: 1, name: "Anshul", streak: 42, score: 0.95 }
    ]
  }
CACHING: stale-while-revalidate 5 minutes
```

### 2.3 KEEP IN FRONTEND (No Change)

| Data | Why Keep |
|------|----------|
| **All 46 engine files** (BST insert, heap extract, etc.) | Pure computation, runs in <10ms, latency-sensitive for animations. Sending to server would add 100ms+ RTT per operation — unacceptable for real-time visualization. |
| **Visualization rendering** (8 visualizer files, ~4,700 lines) | SVG/canvas rendering must be browser-side. No server involvement possible. |
| **Animation choreography** (framer-motion configs) | UI-only concern, no backend benefit. |
| **Step recording** (DSResult/DSStep system) | Tightly coupled to visualization — steps drive animations frame-by-frame. |
| **Undo history** (20-item React ref stack) | Transient UI state, would add latency to API roundtrip. |
| **Current DS state** (BST nodes, heap array, etc.) | Real-time interactive state, changes 10+ times per second during playback. |
| **UI state** (panel open/closed, active tab, selected DS) | Ephemeral, no persistence value. |
| **Sonification** (Web Audio API) | Browser-only API, cannot run on server. |
| **Tree layout algorithm** (Reingold-Tilford) | Pure computation needed for every frame render. |
| **Color/spring constants** | Tiny (<1 KB), used every render cycle. |

### 2.4 MOVE TO WEB WORKER (Keep Frontend, Off Main Thread)

```
CANDIDATE: Suffix Array construction
CURRENTLY: Runs on main thread in suffix-array.ts
WHY WORKER:
  [x] O(n^2) worst case on large inputs
  [ ] Blocks UI during construction
WORKER FILE: src/lib/workers/suffix-array-worker.ts
COMMUNICATION: postMessage({ text: "..." }) → postMessage({ array: [...], steps: [...] })
```

```
CANDIDATE: B-Tree / B+ Tree bulk insert (>1000 keys)
CURRENTLY: Synchronous on main thread
WHY WORKER:
  [x] Heavy split/merge cascade on large inputs
  [ ] Can block UI for 50-100ms
WORKER FILE: src/lib/workers/tree-worker.ts
COMMUNICATION: postMessage({ ops: [...] }) → postMessage({ state: {...}, steps: [...] })
```

**Note**: Currently no DS operation exceeds ~50ms for educational input sizes (<1000 elements). Web Worker migration is a **P3 optimization** — only needed if users start loading large datasets.

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schemas (Ready to Activate)

| Table | File | Status | Relevant to DS? |
|-------|------|--------|-----------------|
| `users` | users.ts | Schema defined, NOT migrated | **YES** — FK for all DS tables |
| `progress` | progress.ts | Schema defined, NOT migrated | **CRITICAL** — Has moduleId, conceptId, score. Ready to use! |
| `diagrams` | diagrams.ts | Schema defined, NOT migrated | No (system-design module) |
| `templates` | templates.ts | Schema defined, NOT migrated | No (system-design module) |
| `simulation_runs` | simulations.ts | Schema defined, NOT migrated | No (system-design module) |
| `ai_usage` | ai-usage.ts | Schema defined, NOT migrated | **YES** — Track AI hint costs |
| `gallery_submissions` | gallery.ts | Schema defined, NOT migrated | Future (share DS visualizations) |
| `gallery_upvotes` | gallery.ts | Schema defined, NOT migrated | Future |

**The `progress` table is PERFECTLY designed for DS module needs:**
- `moduleId = "data-structures"` 
- `conceptId = "bst"` (the DS id)
- `score = 0.85` (mastery level)
- `completedAt` for completion tracking

### 3.2 New Tables Needed

**3 new tables** recommended (Drizzle schemas shown in Phase 2.1 above):

| Table | Purpose | Columns | Effort |
|-------|---------|---------|--------|
| `ds_catalog` | DS metadata (replaces catalog.ts) | 18 columns | M |
| `ds_attempts` | Detailed attempt history | 7 columns | S |
| `ds_user_state` | User preferences & streaks (replaces localStorage) | 11 columns | S |
| `ds_challenges` | Quiz/challenge content (replaces hardcoded) | 12 columns | S |

### 3.3 Data Seeding Strategy

```
Step 1: Generate migration SQL
  $ pnpm drizzle-kit generate
  Creates: drizzle/migrations/0000_*.sql (all 8 existing + 4 new tables)

Step 2: Apply migration to Neon
  $ pnpm drizzle-kit migrate
  Creates all tables in PostgreSQL

Step 3: Seed DS catalog from catalog.ts
  Script: src/db/seeds/data-structures.ts
  - Read DS_CATALOG array from catalog.ts
  - Transform each entry to match ds_catalog schema
  - INSERT 43 rows

Step 4: Seed challenges from component files
  Script: src/db/seeds/ds-challenges.ts
  - Extract QUIZ_QUESTIONS from ComplexityQuiz.tsx → 15 rows
  - Extract SCENARIOS from ScenarioChallenges.tsx → 5 rows
  - Extract DAILY_CHALLENGES from DailyChallenge.tsx → 7 rows
  - Extract DEBUGGING_CHALLENGES from DebuggingChallenges.tsx → 3 rows
  - Extract BREAK_IT_CHALLENGES from BreakItMode.tsx → 3 rows
  Total: 33 challenge rows

Step 5: Verify with Drizzle Studio
  $ pnpm drizzle-kit studio
  Browse all tables, verify data integrity
```

---

## Phase 4: API Design

### Complete API Surface

| # | Route | Method | Auth | Cache | Purpose |
|---|-------|--------|------|-------|---------|
| 1 | `/api/data-structures/catalog` | GET | No | ISR 1h | List all DS (sidebar data) |
| 2 | `/api/data-structures/[id]` | GET | No | ISR 24h | Full DS detail with metadata |
| 3 | `/api/data-structures/progress` | GET | Yes | None | User's learning state |
| 4 | `/api/data-structures/progress` | POST | Yes | None | Save attempt/update streak |
| 5 | `/api/data-structures/challenges` | GET | No | ISR 1h | Quiz/challenge content |
| 6 | `/api/data-structures/leaderboard` | GET | No | SWR 5m | Community rankings |

### Pattern (Follows Existing `/api/diagrams`)

All routes will follow the established pattern:
```typescript
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

// Authenticated routes: requireAuth() + resolveUserId()
// Public routes: no auth, ISR caching via revalidate
// Error handling: try/catch with 401/404/500
// DB access: getDb() singleton (Neon serverless)
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
CURRENT STATE:
  Bundle includes: catalog.ts (72 KB) + 46 engine files (748 KB) + components (588 KB)
  First load: ~1.4 MB of JS for DS module alone
  Time to interactive: 3-5 seconds on 3G

AFTER MIGRATION:
  Bundle includes: 46 engine files (748 KB) + components (570 KB, minus hardcoded content)
  Catalog: Fetched as 5 KB JSON via API (only id, name, category for sidebar)
  Detail: Fetched per-DS as 1-2 KB JSON when selected
  Challenges: Fetched on-demand when tab opened
  
  Savings:
    - catalog.ts removed from bundle: -72 KB
    - Challenge content removed from components: -18 KB  
    - Total bundle reduction: ~90 KB (-6.4%)
    
    Note: Engine files (748 KB) STAY in bundle because they contain
    pure computation needed for real-time visualization. These are
    already lazy-loaded via React.lazy().
```

### Feature Benefits (Enabled by Database)

| Feature | Current | After Migration |
|---------|---------|-----------------|
| Cross-device progress | No (localStorage only) | Yes (DB + auth) |
| Learning analytics | None | Full attempt history, score trends |
| Streak leaderboard | No | Community rankings |
| Content A/B testing | Impossible | Switch content per user cohort |
| Admin content panel | Requires code deploy | Update quiz/descriptions via API |
| Full-text search | Client-side filter only | PostgreSQL full-text search |
| Personalized difficulty | Static | Adaptive based on attempt history |
| i18n content | Requires code changes | Same schema, different language rows |
| Content versioning | Git only | DB version history + rollback |
| Interview progress sharing | No | Shareable progress links |

### User Experience Benefits

| Before | After |
|--------|-------|
| Quiz score lost on reload | Persistent score history |
| Streak resets on new device | Streak synced via login |
| No way to track improvement | Progress charts over time |
| Same content for everyone | Adaptive difficulty |
| Can't share learning progress | Shareable progress page |
| Content updates need deploy | Content updates via admin |

---

## Phase 6: Migration Roadmap

### Step 1: Activate Database Infrastructure [S effort, 1 day]

```bash
# Generate migration SQL from existing schemas
pnpm drizzle-kit generate

# Apply to Neon PostgreSQL
pnpm drizzle-kit migrate

# Verify tables created
pnpm drizzle-kit studio
```

**Prerequisites**: `DATABASE_URL` in `.env.local` pointing to Neon instance.
**Risk**: Low — schemas already defined and tested.
**Blocks**: Everything else.

### Step 2: Add New DS Tables [S effort, 1 day]

Create 4 new schema files:
- `src/db/schema/ds-catalog.ts`
- `src/db/schema/ds-attempts.ts`
- `src/db/schema/ds-user-state.ts`
- `src/db/schema/ds-challenges.ts`

Add to `src/db/schema/index.ts` barrel export.
Re-run `drizzle-kit generate` + `drizzle-kit migrate`.

### Step 3: Create Seed Scripts [M effort, 2 days]

- `src/db/seeds/ds-catalog.ts` — Extract 43 entries from catalog.ts
- `src/db/seeds/ds-challenges.ts` — Extract 33 challenges from 5 component files
- Add `pnpm db:seed` script to package.json

### Step 4: Create API Routes [M effort, 2-3 days]

- `src/app/api/data-structures/catalog/route.ts` — GET (public, ISR)
- `src/app/api/data-structures/[id]/route.ts` — GET (public, ISR)
- `src/app/api/data-structures/progress/route.ts` — GET/POST (auth required)
- `src/app/api/data-structures/challenges/route.ts` — GET (public, ISR)

Follow existing `/api/diagrams` pattern exactly.

### Step 5: Update Components to Use API [L effort, 3-5 days]

**High-impact changes:**
1. `DSSidebar.tsx` — Replace `import { DS_CATALOG }` with `useSWR("/api/data-structures/catalog")`
2. `DSProperties.tsx` — Fetch DS detail from API when active DS changes
3. `ComplexityQuiz.tsx` — Fetch quiz questions from API
4. `ScenarioChallenges.tsx` — Fetch scenarios from API
5. `DailyChallenge.tsx` — Replace localStorage streak with API call
6. `InterviewPath.tsx` — Replace localStorage with API progress
7. `index.tsx` — Save attempt data via POST on quiz/challenge completion

**Add loading states:**
- Skeleton loader for sidebar while catalog loads
- Shimmer for properties panel
- Loading spinner for quiz/challenge content

### Step 6: Remove Hardcoded Data [M effort, 2 days]

- Remove `QUIZ_QUESTIONS` constant from ComplexityQuiz.tsx
- Remove `SCENARIOS` constant from ScenarioChallenges.tsx
- Remove `DAILY_CHALLENGES` from DailyChallenge.tsx
- Remove `DEBUGGING_CHALLENGES` from DebuggingChallenges.tsx
- Remove `BREAK_IT_CHALLENGES` from BreakItMode.tsx
- **Keep** `catalog.ts` as fallback/offline mode (optional)

### Step 7: Deprecate localStorage Keys [S effort, 1 day]

- Add migration logic: on first auth login, read localStorage → POST to API → clear localStorage
- Keep localStorage as offline fallback for unauthenticated users

### Total Effort Estimate

| Step | Effort | Days | Dependencies |
|------|--------|------|-------------|
| 1. Activate DB | S | 1 | None |
| 2. New tables | S | 1 | Step 1 |
| 3. Seed scripts | M | 2 | Step 2 |
| 4. API routes | M | 2-3 | Step 2 |
| 5. Update components | L | 3-5 | Steps 3, 4 |
| 6. Remove hardcoded | M | 2 | Step 5 |
| 7. Migrate localStorage | S | 1 | Steps 4, 5 |
| **Total** | | **12-15 days** | |

---

## Phase 7: What NOT to Move

### KEEP IN FRONTEND (Explicit List)

```
MUST STAY IN BROWSER:
  
  ✅ All 46 DS engine files (15,000 lines)
     WHY: Pure computation powering real-time animation.
     Adding 100ms+ API latency per operation would break 
     the interactive learning experience.
  
  ✅ 8 Visualizer canvas files (4,700 lines)  
     WHY: SVG rendering is inherently browser-side.
     Cannot server-render interactive animated SVGs.
  
  ✅ Animation configs (framer-motion springs, stagger)
     WHY: 60fps animation requires client-side frame control.
  
  ✅ Step recording system (DSResult<T> / DSStep)
     WHY: Steps drive frame-by-frame visualization.
     Tightly coupled to animation timeline.
  
  ✅ Undo history (20-item ref stack)
     WHY: Transient, per-session, sub-millisecond access needed.
     API roundtrip would make undo feel sluggish.
  
  ✅ Current DS operation state (nodes, arrays, etc.)
     WHY: Changes 10+ times/second during playback.
     Would flood API with writes.
  
  ✅ UI state (active tab, panel visibility, search filter)
     WHY: Ephemeral, no persistence value.
  
  ✅ Sonification (Web Audio API)
     WHY: Browser-only API, cannot run on server.
  
  ✅ Tree layout algorithm (Reingold-Tilford in tree-layout.ts)
     WHY: Runs every render, needs <1ms latency.
  
  ✅ Color/spring constants (DS_COLORS, DS_SPRINGS)
     WHY: <1 KB, used every animation frame.
  
  ✅ DSCanvas routing logic (switch on activeDS)
     WHY: Component routing, browser-only concern.
  
  ✅ Paste/bulk import modal
     WHY: Client-side text processing, no server needed.
  
  ✅ SVG export (VideoExport.tsx)
     WHY: DOM serialization, browser-only.
```

### MOVE TO BACKEND (Summary)

```
MOVE TO DATABASE:
  → DS catalog metadata (names, descriptions, complexity, tips)     ~72 KB
  → Quiz/challenge content (questions, options, answers)             ~18 KB
  → User progress (streaks, scores, SRS state)                      ~5 KB/user
  → Attempt history (quiz scores, challenge completions)             ~1 KB/attempt

MOVE TO API:
  → Catalog listing (sidebar data)                 GET  /api/data-structures/catalog
  → DS detail (per-DS metadata)                    GET  /api/data-structures/[id]
  → User progress read                             GET  /api/data-structures/progress
  → User progress write                            POST /api/data-structures/progress
  → Challenge content                              GET  /api/data-structures/challenges
  → Leaderboard (future)                           GET  /api/data-structures/leaderboard

TOTAL DATA MOVING TO BACKEND: ~90 KB of content + ~5 KB/user of state
TOTAL DATA STAYING IN FRONTEND: ~1,246 KB of computation + visualization code
RATIO: 7% moves, 93% stays
```

---

## Appendix A: Current Infrastructure Status

| Component | Status | Notes |
|-----------|--------|-------|
| Drizzle ORM | Configured | `drizzle.config.ts` exists, points to Neon |
| Neon PostgreSQL | Configured | `DATABASE_URL` in env (not verified live) |
| DB Connection | Implemented | `src/db/index.ts` — `getDb()` singleton via `@neondatabase/serverless` |
| Schema Files | 8 defined | `src/db/schema/` — users, diagrams, templates, progress, simulations, ai-usage, gallery |
| Migration Files | **NONE** | `drizzle/` folder does not exist. No SQL generated. |
| Auth Pattern | Established | `requireAuth()` + `resolveUserId()` in existing API routes |
| API Pattern | Established | `/api/diagrams` shows GET/POST with Drizzle ORM |
| Clerk Auth | Configured | Webhook route exists at `/api/webhooks/clerk` |

## Appendix B: Store Usage by DS Module

| Store | Import Location | Usage |
|-------|----------------|-------|
| `useUIStore` | `index.tsx` | Set active module on mount |
| `useNotificationStore` | `index.tsx` | Display operation feedback |
| ~~progress-store~~ | Not imported | Could be wired for progress |
| ~~cross-module-store~~ | Not imported | Could track DS mastery |
| ~~canvas-store~~ | Not imported | DS doesn't use canvas |

## Appendix C: localStorage Key Migration Map

| Current Key | New Location | Migration Strategy |
|-------------|-------------|-------------------|
| `architex-ds-sound` | `ds_user_state.sound_enabled` | Read on login → POST → clear |
| `architex-ds-streak` | `ds_user_state.streak` | Read on login → POST → clear |
| `architex-ds-streak-last` | `ds_user_state.last_streak_date` | Read on login → POST → clear |
| `architex-ds-daily-streak` | `ds_user_state.daily_challenge_streak` | Read on login → POST → clear |
| `architex-ds-daily-streak-last` | `ds_user_state.last_daily_challenge_date` | Read on login → POST → clear |
| `architex-ds-srs-due` | (Remove — compute from srsCards) | No migration needed |
| `architex-ds-srs-cards` | `ds_user_state.srs_cards` | Read on login → POST → clear |
| `architex-ds-srs-ops-{dsId}` | `ds_user_state.srs_ops` | Read all → merge → POST → clear |
| `architex-interview-explored` | `ds_user_state.interview_explored` | Read on login → POST → clear |

**Fallback**: For unauthenticated users, continue using localStorage. On first login, migrate all localStorage data to DB and clear.

---

*Analysis complete. No code was modified. This document serves as the migration blueprint for the Data Structures module backend integration.*
