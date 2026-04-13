# Architex OS Concepts -- Backend & Data Migration Analysis

**Date**: 2026-04-14
**Scope**: OS Concepts module data architecture, backend migration feasibility, and roadmap
**Status**: Analysis only -- no code changes

---

## Phase 1: Data Inventory

### 1.1 Static Content (Concept Metadata)

The OS module stores concept/algorithm metadata as inline TypeScript constants in `OSModule.tsx`:

| Constant | File:Line | Items | Fields | Size Est. |
|----------|-----------|:-----:|--------|-----------|
| `CONCEPTS` | OSModule.tsx:69 | 6 | id, name, description | ~0.5 KB |
| `SCHEDULING_ALGOS` | OSModule.tsx:105 | 6 | id, name | ~0.3 KB |
| `PAGE_ALGOS` | OSModule.tsx:114 | 4 | id, name | ~0.2 KB |
| `SYNC_PRIMITIVES` | OSModule.tsx:123 | 3 | id, name | ~0.1 KB |
| `ALLOC_ALGOS` | OSModule.tsx:131 | 3 | id, name | ~0.1 KB |
| `COMMON_SYSCALLS` | system-calls.ts:69 | 12 | name, description, kernelHandlerCycles, category | ~1.5 KB |
| `GC_ALGORITHMS` | GCPauseLatencyVisualizer.tsx:49 | 3 | name, description, pause configs | ~1.0 KB |
| `OS_CONCEPTS` (SEO) | seo/os-concepts-data.ts | 6 | slug, name, description, difficulty, keywords, algorithms, explanation, interviewQuestions | ~8 KB |

**Total static content: ~12 KB across 43 items.**

Unlike the Algorithm module (~125 KB across 83 configs), the OS module's static content is very small. The concepts are few (6) and metadata is minimal (no pseudocode, no complexity notation, no comparison guides stored as data -- these are inline in engine step descriptions).

**Key observation:** The OS module's "content" is primarily embedded in engine step descriptions (the `description` template literals inside event objects), NOT in separate config/metadata objects. This is fundamentally different from the Algorithm module where each algorithm has a rich `AlgorithmConfig` object.

### 1.2 Engine Step Description Content

The bulk of educational content lives INSIDE engine functions as template literal descriptions:

| Engine File | Lines | Step Descriptions | Educational Text Est. |
|-------------|:-----:|:-----------------:|:---------------------:|
| scheduling.ts | 893 | ~40 descriptions | ~4 KB |
| mlfq-scheduler.ts | 461 | ~25 descriptions | ~3 KB |
| page-replacement.ts | 389 | ~15 descriptions | ~2 KB |
| deadlock.ts | 416 | ~20 descriptions | ~2.5 KB |
| bankers-algorithm.ts | 335 | ~15 descriptions | ~2 KB |
| memory.ts | 304 | ~10 descriptions | ~1.5 KB |
| memory-alloc.ts | 266 | ~10 descriptions | ~1.5 KB |
| thread-sync.ts | 770 | ~30 descriptions | ~4 KB |
| context-switch.ts | 340 | ~15 descriptions | ~2 KB |
| system-calls.ts | 327 | ~12 descriptions | ~1.5 KB |
| race-condition.ts | 318 | ~12 descriptions | ~1.5 KB |
| thrashing.ts | 304 | ~10 descriptions | ~1.5 KB |
| priority-inversion.ts | 641 | ~20 descriptions | ~3 KB |
| cow-fork.ts | 285 | ~10 descriptions | ~1.5 KB |
| buffer-overflow.ts | 449 | ~15 descriptions | ~2 KB |
| **TOTAL** | **6,498** | **~259** | **~34 KB** |

**Total educational text in engine descriptions: ~34 KB** — generated dynamically by pure functions, not stored as static data.

### 1.3 Implementation Logic (Pure Computation)

All 15 engine files contain pure functions (input → output, no side effects):

| Engine | Functions | Pure? | Runtime | Needs Server? |
|--------|:---------:|:-----:|:-------:|:-------------:|
| scheduling.ts | fcfs, sjf, roundRobin, priorityScheduling, mlfq, compareAlgorithms | Yes | <50ms | No |
| mlfq-scheduler.ts | mlfqScheduler | Yes | <50ms | No |
| page-replacement.ts | fifo, lru, optimal, clock, generate, compare | Yes | <10ms | No |
| deadlock.ts | detectDeadlock, bankersAlgorithm | Yes | <10ms | No |
| bankers-algorithm.ts | isSafe, requestResources, clone | Yes | <10ms | No |
| memory.ts | translateAddress, simulateVirtualMemory | Yes | <10ms | No |
| memory-alloc.ts | firstFit, bestFit, worstFit, compare | Yes | <10ms | No |
| thread-sync.ts | mutex, semaphore, rwLock, conditionVariable | Yes | <20ms | No |
| context-switch.ts | simulateContextSwitch, compareProcessVsThread | Yes | <5ms | No |
| system-calls.ts | simulateSystemCall, simulateSequence | Yes | <5ms | No |
| race-condition.ts | simulateRace, simulateWithMutex, countInterleavings | Yes | <5ms | No |
| thrashing.ts | simulateThrashing, findOptimal | Yes | <10ms | No |
| priority-inversion.ts | simulate, simulateWithInheritance | Yes | <10ms | No |
| cow-fork.ts | simulateCOWFork | Yes | <5ms | No |
| buffer-overflow.ts | simulate, withCanary, withASLR | Yes | <5ms | No |

**All engines run in <50ms.** None approach the threshold where Web Workers or server computation would provide benefit. The OS module's simulations are algorithmically simple (tick-by-tick state machines), unlike the Algorithm module's potentially heavy sorting of 10K+ elements.

### 1.4 User-Generated Data

| Store | Data | Persisted? | Where? | Shared? |
|-------|------|:----------:|--------|:-------:|
| `useOSModule()` hook | 40+ useState variables: processes, ref strings, matrix values, results, step indices | **No** | RAM only (lost on refresh) | No |
| `progress-store` | XP, streaks, challenge attempts | Yes | localStorage `architex-progress` | No |
| `cross-module-store` | Module mastery, concept progress, bridge payloads | Yes | localStorage `architex-cross-module` | No |
| `ui-store` | Active module, theme, panel visibility | Yes | localStorage `architex-ui` | No |
| `module-progress.ts` | Features explored, activity log | Yes | localStorage `architex-module-progress` | No |

**Critical gap:** Simulation inputs (processes, reference strings, deadlock matrices, allocation requests) are in useState and lost on page refresh. Users cannot save, share, or revisit their configurations.

### 1.5 SEO Content

| File | Data | Lines | Server-Rendered? |
|------|------|:-----:|:----------------:|
| seo/os-concepts-data.ts | 6 concept definitions with descriptions, keywords, explanations | ~200 | Yes (via page.tsx) |
| app/os/[concept]/page.tsx | Server-rendered concept pages with JSON-LD | ~150 | Yes |
| app/os/page.tsx | OS module index page | ~80 | Yes |
| app/sitemap.ts | 6 OS concept URLs added | +10 lines | Yes |

This layer was just created and is correctly server-rendered.

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE ✅

```
CANDIDATE: User simulation configurations (saved process sets, reference strings, deadlock scenarios)
CURRENTLY: useState in useOSModule() — lost on refresh
WHY MOVE:
  ✅ Users can save/share custom configurations
  ✅ Needs to persist across devices
  ✅ Enables "share this scenario" feature (OSC-218)
  ✅ Enables "classroom mode" (professor shares scenario with students)
DB TABLE: New table needed — `os_configurations`
SCHEMA:
  os_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    concept VARCHAR(50) NOT NULL,           -- 'cpu-scheduling', 'page-replacement', etc.
    name VARCHAR(200),                       -- user-given name
    config JSONB NOT NULL,                   -- { processes: [...], algorithm: 'fcfs', quantum: 2 }
    is_public BOOLEAN DEFAULT false,         -- shareable?
    share_slug VARCHAR(20) UNIQUE,           -- short URL slug
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )
MIGRATION EFFORT: M
```

```
CANDIDATE: User learning progress (per-concept mastery, prediction accuracy, practice scores)
CURRENTLY: localStorage via progress-store + cross-module-store
WHY MOVE:
  ✅ Needs to persist across devices
  ✅ Enables "continue where you left off" on any device
  ✅ Enables leaderboards and social features
  ✅ Enables analytics on learning patterns
DB TABLE: Existing `progress` table — perfect fit
  Already has: userId, moduleId, conceptId, score, completedAt
  Needs: prediction_accuracy REAL, steps_completed INT, simulations_run INT
MIGRATION EFFORT: S (table exists, just need to populate)
```

```
CANDIDATE: OS concept catalog metadata (if content grows beyond current 6 concepts)
CURRENTLY: CONCEPTS array in OSModule.tsx:69 (6 items, ~0.5 KB)
WHY MOVE: ❌ NOT YET — too small to justify
  - Only 6 items, ~0.5 KB
  - Rarely changes
  - No user customization needed
  - Would add API latency for no benefit
RECOMMENDATION: KEEP in frontend until concept count exceeds 20
```

### 2.2 MOVE TO API ROUTE ✅

```
CANDIDATE: Simulation results sharing
CURRENTLY: Results exist only in useState — no way to share
WHY API:
  ✅ Enables shareable URLs with server-stored state
  ✅ Enables embed functionality
API ROUTE: POST /api/os/share
METHOD: POST
REQUEST: { concept, algorithm, config, results, step? }
RESPONSE: { shareId: "abc123", url: "https://architex.dev/os/share/abc123" }
CACHING: None (unique per share)
DB TABLE: os_configurations (with is_public=true + share_slug)
MIGRATION EFFORT: S

CANDIDATE: GET /api/os/share/[slug]
PURPOSE: Retrieve a shared simulation state
RESPONSE: { concept, algorithm, config, results }
CACHING: CDN cache forever (immutable once created)
```

```
CANDIDATE: Learning analytics aggregates
CURRENTLY: No analytics at all
WHY API:
  ✅ "50,000 students explored CPU Scheduling" (social proof)
  ✅ "LRU is the most popular algorithm in this module"
  ✅ Enables data-driven content improvement
API ROUTE: GET /api/os/analytics/popular
METHOD: GET
RESPONSE: { concepts: [{ id, viewCount, avgScore, completionRate }] }
CACHING: ISR 1 hour
DEPENDS ON: PostHog or custom analytics collection
MIGRATION EFFORT: M
```

### 2.3 KEEP IN FRONTEND ✅

```
KEEP: All 15 engine files (pure simulation logic)
WHY:
  ✅ Pure computation (input → output, no side effects)
  ✅ All run in <50ms (no server benefit)
  ✅ Real-time/interactive (too latency-sensitive for API round-trip)
  ✅ Privacy (user simulation data shouldn't leave device by default)
  ✅ Offline-first (PWA works without network)
  Total: 6,498 lines, ~150 KB minified — acceptable for lazy-loaded chunk

KEEP: Visualization components (GanttChart, PageFrameGrid, RAG SVG, ThreadSync SVG, etc.)
WHY:
  ✅ Client-side rendering only
  ✅ Tightly coupled to React state and animation

KEEP: UI state (panel visibility, active concept, step indices)
WHY:
  ✅ Ephemeral — no persistence needed
  ✅ Too high-frequency for server round-trips

KEEP: Color arrays (PROCESS_COLORS, THREAD_COLORS, ALLOC_COLORS)
WHY:
  ✅ Tiny (<1 KB)
  ✅ Used in rendering hot path
  ✅ Should be CSS variables eventually (design system task, not backend task)

KEEP: COMMON_SYSCALLS, GC_ALGORITHMS (static reference data)
WHY:
  ✅ Tiny (<3 KB total)
  ✅ Never changes
  ✅ No user customization
```

### 2.4 MOVE TO WEB WORKER

```
CANDIDATE: None
REASON: All OS simulations run in <50ms. No computation in this module benefits from off-main-thread execution. The Algorithm module's sort-100K-elements scenario doesn't exist here — OS simulations are bounded by MAX_TICKS=200 with O(n) per tick where n ≤ 20 processes.

The `src/workers/` directory exists (with Comlink configured) and could be used if future simulations become heavier (e.g., simulating 1000-process systems), but current workloads don't warrant it.
```

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schemas — Status

| Table | File | Status | Relevant to OS? |
|-------|------|--------|:----------------:|
| `users` | users.ts | Schema exists, **not migrated** | Yes — user identity |
| `progress` | progress.ts | Schema exists, **not migrated** | **YES** — per-concept scores |
| `diagrams` | diagrams.ts | Schema exists, **not migrated** | No (system design only) |
| `templates` | templates.ts | Schema exists, **not migrated** | Possible — saved configs |
| `simulations` | simulations.ts | Schema exists, **not migrated** | Possible — simulation logs |
| `ai-usage` | ai-usage.ts | Schema exists, **not migrated** | No |
| `gallery` | gallery.ts | Schema exists, **not migrated** | No |

### 3.2 New Table Needed

```typescript
// src/db/schema/os-configurations.ts

import { pgTable, timestamp, uuid, varchar, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const osConfigurations = pgTable(
  "os_configurations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    /** OS concept: 'cpu-scheduling', 'page-replacement', etc. */
    concept: varchar("concept", { length: 50 }).notNull(),
    /** Algorithm within the concept: 'fcfs', 'lru', 'mutex', etc. */
    algorithm: varchar("algorithm", { length: 50 }),
    /** User-given name for this configuration */
    name: varchar("name", { length: 200 }),
    /** Full configuration state as JSON */
    config: jsonb("config").notNull(),
    // config shape varies by concept:
    // cpu-scheduling: { processes: [...], quantum: 2 }
    // page-replacement: { referenceString: [...], frameCount: 3 }
    // deadlock: { processes: [...], resources: [...] }
    // memory: { addresses: [...], pageSize: 16, physFrames: 4, tlbSize: 2 }
    // mem-alloc: { totalMemory: 256, requests: [...] }
    // thread-sync: { primitive: 'mutex', threadCount: 4, ... }

    /** Simulation results (optional, for sharing) */
    results: jsonb("results"),
    /** Whether this config is publicly shareable */
    isPublic: boolean("is_public").default(false),
    /** Short URL slug for sharing */
    shareSlug: varchar("share_slug", { length: 20 }).unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("os_config_user_idx").on(table.userId),
    index("os_config_concept_idx").on(table.concept),
    index("os_config_share_idx").on(table.shareSlug),
  ]
);
```

### 3.3 Extending Existing `progress` Table

The existing `progress` table already has the right shape for OS learning progress:

```sql
-- Existing schema (perfect for OS use):
progress (
  id UUID PK,
  user_id UUID FK → users,
  module_id VARCHAR(100),     -- 'os'
  concept_id VARCHAR(100),    -- 'cpu-scheduling', 'page-replacement', etc.
  score REAL DEFAULT 0,       -- mastery score 0.0-1.0
  completed_at TIMESTAMPTZ,
  created_at, updated_at
)

-- Usage for OS:
INSERT INTO progress (user_id, module_id, concept_id, score)
VALUES ($userId, 'os', 'cpu-scheduling', 0.75);
```

No schema changes needed — just need to run the migration and start using it.

---

## Phase 4: API Design

### 4.1 Save Configuration

```
ENDPOINT: POST /api/os/configurations
PURPOSE: Save a simulation configuration for later retrieval
AUTH: Required (Clerk)
BODY: {
  concept: "cpu-scheduling",
  algorithm: "fcfs",
  name: "My FCFS Example",
  config: { processes: [...], quantum: 2 },
  results: { ... } // optional
}
RESPONSE: { id: "uuid", shareSlug: null }
```

### 4.2 Share Configuration

```
ENDPOINT: POST /api/os/configurations/[id]/share
PURPOSE: Make a configuration publicly shareable
AUTH: Required (owner only)
RESPONSE: { shareSlug: "abc123", url: "https://architex.dev/os/share/abc123" }
```

### 4.3 Get Shared Configuration

```
ENDPOINT: GET /api/os/share/[slug]
PURPOSE: Retrieve a shared configuration (no auth required)
AUTH: None (public)
CACHE: CDN cache forever (immutable)
RESPONSE: {
  concept: "cpu-scheduling",
  algorithm: "fcfs",
  config: { processes: [...] },
  results: { ... },
  createdBy: { username: "anshul" } // optional
}
```

### 4.4 Save Progress

```
ENDPOINT: POST /api/os/progress
PURPOSE: Save learning progress to DB (replaces localStorage)
AUTH: Required (Clerk)
BODY: {
  conceptId: "cpu-scheduling",
  score: 0.85,
  simulationsRun: 12,
  predictionsCorrect: 7,
  predictionsTotal: 10
}
RESPONSE: { ok: true }
```

### 4.5 Get Progress

```
ENDPOINT: GET /api/os/progress
PURPOSE: Retrieve learning progress across all concepts
AUTH: Required (Clerk)
CACHE: No cache (personalized)
RESPONSE: {
  concepts: [
    { id: "cpu-scheduling", score: 0.85, simulationsRun: 12, lastVisited: "2026-04-14" },
    ...
  ],
  totalXP: 450,
  streakDays: 7
}
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
CURRENT STATE:
  - OS engine files: ~150 KB minified (15 files)
  - OSModule.tsx: ~100 KB minified
  - Total OS chunk: ~250 KB (lazy-loaded, acceptable)

AFTER MIGRATION:
  - No change to bundle size (all engines stay in frontend)
  - OS module is already lazy-loaded via dynamic(() => import(...), { ssr: false })
  - The 250 KB chunk loads only when user opens OS module
  - No performance problem to solve

VERDICT: No bundle size improvement from backend migration.
The OS module is 4x smaller than the Algorithm module (250 KB vs 1.1 MB).
```

### Feature Benefits

```
ENABLED BY DATABASE:
  ✅ Save simulation configurations (persist processes, ref strings, matrices)
  ✅ Share configurations via URL ("look at this deadlock I found")
  ✅ Progress persists across devices (login → see your mastery)
  ✅ Leaderboards (who predicted the most scheduling decisions correctly?)
  ✅ Classroom mode (professor shares a scenario, students all work on it)
  ✅ Analytics (which concepts are hardest? where do students get stuck?)

NOT ENABLED (and not needed):
  ✗ Content in DB (too little content to justify — 6 concepts, 12 KB total)
  ✗ Server-side computation (all simulations <50ms in browser)
  ✗ Web Workers (no heavy computation)
```

### User Experience Benefits

```
WITH CURRENT (localStorage only):
  - Progress lost when clearing browser data
  - Can't continue on another device
  - Can't share a specific simulation state
  - Can't save configurations for later
  - No social features (leaderboards, sharing)

WITH DB + API:
  - Progress syncs across devices
  - "Share this scenario" with one click
  - "Save this configuration" for homework
  - Leaderboards create competitive motivation
  - Professor can push scenarios to students
```

---

## Phase 6: Migration Roadmap

```
STEP 0: Run Drizzle migrations (prerequisite for everything)
  - pnpm drizzle-kit generate
  - pnpm drizzle-kit migrate
  Effort: S (schemas already exist)
  Unblocks: Everything below

STEP 1: Create os_configurations schema + migration
  - New file: src/db/schema/os-configurations.ts
  - Add to schema index
  - Run migration
  Effort: S

STEP 2: Create API routes for save/share
  - POST /api/os/configurations
  - POST /api/os/configurations/[id]/share
  - GET /api/os/share/[slug]
  Effort: M

STEP 3: Wire save/load into OSModule.tsx
  - "Save" button in each concept's toolbar
  - "Load saved" in concept's empty state
  - "Share" button generating shareable URL
  Effort: M

STEP 4: Wire progress to DB (replace localStorage)
  - On login: sync localStorage progress → DB
  - On each simulation run: POST /api/os/progress
  - On load: GET /api/os/progress → hydrate stores
  - Keep localStorage as offline fallback
  Effort: M

STEP 5: Add social features (leaderboards, classroom mode)
  - GET /api/os/leaderboard?concept=cpu-scheduling
  - POST /api/os/classroom/create
  - These depend on Steps 2-4
  Effort: L
```

---

## Phase 7: What NOT to Move

```
KEEP IN FRONTEND (explicit decisions):

  ✅ All 15 engine files (6,498 lines of pure simulation logic)
     REASON: Pure computation, <50ms, latency-sensitive, offline-capable

  ✅ All visualization components (GanttChart, PageFrameGrid, RAG SVG, etc.)
     REASON: Client-side rendering, tightly coupled to React state

  ✅ CONCEPTS, SCHEDULING_ALGOS, PAGE_ALGOS arrays (~2 KB)
     REASON: Tiny, never changes, no user customization

  ✅ COMMON_SYSCALLS, GC_ALGORITHMS (~2.5 KB)
     REASON: Static reference data, tiny, never changes

  ✅ Color arrays (PROCESS_COLORS, THREAD_COLORS)
     REASON: Rendering hot path, should become CSS variables (design task)

  ✅ Step descriptions (embedded in engine functions)
     REASON: Generated dynamically by pure functions, not separable from logic

  ✅ UI state (panel visibility, active concept, step indices)
     REASON: Ephemeral, high-frequency, no persistence needed

DO NOT MOVE TO SERVER:

  ✗ Engine computation — <50ms, no benefit from server round-trip
  ✗ Content catalog — only 6 concepts, 12 KB (not worth API latency)
  ✗ Visualization rendering — must be client-side
  ✗ Animation timing — latency-sensitive, must be local

MOVE TO SERVER:

  → User simulation configurations (save/share/classroom)
  → Learning progress (cross-device persistence)
  → Analytics aggregates (social proof, content insights)
```

---

## Summary Decision Matrix

| Data Category | Items | Size | Move? | Where? | Priority |
|--------------|:-----:|:----:|:-----:|--------|:--------:|
| Concept metadata | 6 | 0.5 KB | **No** | Keep in frontend | — |
| Algorithm configs | 15 arrays | 2 KB | **No** | Keep in frontend | — |
| Engine logic | 15 files | 150 KB | **No** | Keep in frontend | — |
| Visualization components | 10 | 100 KB | **No** | Keep in frontend | — |
| Step descriptions | 259 | 34 KB | **No** | Keep in engine functions | — |
| Color arrays | 3 | 0.5 KB | **No** | Keep (→ CSS vars later) | — |
| SEO content | 6 pages | 8 KB | **Done** | Server-rendered (os/[concept]) | ✅ |
| **User simulation configs** | per-user | varies | **Yes** | New DB table + API | P1 |
| **Learning progress** | per-user | varies | **Yes** | Existing progress table + API | P1 |
| **Analytics aggregates** | module-wide | varies | **Yes** | PostHog + API | P2 |

**Bottom line:** The OS module's content is too small (~50 KB total static data) to benefit from database migration. The win is in **user data persistence** — saving configurations, syncing progress across devices, and enabling sharing. This requires Steps 0-4 of the migration roadmap (~2-3 weeks of engineering) and unblocks sharing, classroom mode, and cross-device progress.
