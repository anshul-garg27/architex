# Architex Concurrency Module — Backend & Data Migration Analysis

**Date**: 2026-04-13
**Scope**: Concurrency module data architecture, backend migration feasibility, and roadmap
**Status**: Analysis only — no code changes

---

## Phase 1: Data Inventory

### 1.1 Static Content (Descriptions, Explanations, Metadata)

The Concurrency module's educational content is embedded directly in JSX within `ConcurrencyModule.tsx`:

| Data | Location | Size | Lines | Type |
|------|----------|------|-------|------|
| **DEMOS catalog** (11 entries) | ConcurrencyModule.tsx:81-148 | 1.8 KB | 67 | Demo ID + name + description |
| **Properties panel content** (per-demo explanations) | ConcurrencyModule.tsx:2700-3090 | 18.2 KB | 390 | JSX with educational text |
| **Event Loop demo definitions** (3 demos) | event-loop.ts:48-80 | 1.2 KB | 32 | Code snippets + expected output |
| **Goroutine demo definitions** (5 demos) | goroutines.ts:58-97 | 1.0 KB | 39 | Go code snippets |
| **Async Pattern demo definitions** (6 demos) | async-patterns.ts:45-101 | 1.8 KB | 56 | JS code snippets |
| **Thread lifecycle data** (7 states, 10 transitions, 3 threads) | thread-lifecycle.ts:46-154 | 3.8 KB | 108 | State machine constants |
| **Color/label maps** (17 maps) | ConcurrencyModule.tsx (scattered) | ~2.5 KB | ~80 | Record<string, string> objects |
| **Bottom panel step log** (per-demo) | ConcurrencyModule.tsx:3100-3183 | 3.2 KB | 83 | JSX switch cases |
| **TOTAL STATIC CONTENT** | | **~33.5 KB** | **~855** | |

**Content characteristics:**
- 11 demo descriptions (1-2 sentences each)
- 11 concept explanations (3-8 paragraphs each in properties panel)
- 14 code snippets (JS and Go)
- 17 color/label constant maps
- Content NEVER changes at runtime
- Content is NOT user-configurable
- A non-developer COULD NOT update this without editing TSX

### 1.2 Configuration Data (Parameters, Defaults, Options)

All simulation parameters are hardcoded — no user input:

| Parameter | Location | Value | User-Configurable? |
|-----------|----------|-------|-------------------|
| Race Condition threads | ConcurrencyModule.tsx:2374 | 3 | No |
| Race Condition increments | ConcurrencyModule.tsx:2374 | 3 | No |
| Producer-Consumer producers | ConcurrencyModule.tsx:2377 | 2 | No |
| Producer-Consumer consumers | ConcurrencyModule.tsx:2377 | 2 | No |
| Producer-Consumer buffer | ConcurrencyModule.tsx:2377 | 4 | No |
| Producer-Consumer items | ConcurrencyModule.tsx:2377 | 8 | No |
| Dining Philosophers count | ConcurrencyModule.tsx:2380 | 5 | No |
| Dining Philosophers ticks | ConcurrencyModule.tsx:2380 | 10 | No |
| Readers-Writers readers | ConcurrencyModule.tsx:2397 | 3 | No |
| Readers-Writers writers | ConcurrencyModule.tsx:2397 | 2 | No |
| Readers-Writers rounds | ConcurrencyModule.tsx:2397 | 4 | No |
| Sleeping Barber chairs | ConcurrencyModule.tsx:2409 | 3 | No |
| Sleeping Barber customers | ConcurrencyModule.tsx:2409 | 10 | No |
| Lock Comparison threads | ConcurrencyModule.tsx:2418 | 4 | No |
| Lock Comparison CS time | ConcurrencyModule.tsx:2419 | 3 | No |
| Thread Pool pool size | ThreadPoolSaturationVisualizer.tsx:157 | 4 | No |
| Thread Pool queue size | ThreadPoolSaturationVisualizer.tsx:158 | 3 | No |
| Thread Pool task burst | ThreadPoolSaturationVisualizer.tsx:126-139 | 12 tasks | No |
| Playback speed | ConcurrencyModule.tsx:2489 | 400ms | No |

**TOTAL: 19 hardcoded parameters across 12 demos. Zero user-configurable.**

### 1.3 Implementation Logic (Pure Computation)

| Engine | File | Size | Lines | Pure? | Execution Time |
|--------|------|------|-------|-------|----------------|
| unsafeIncrement | race-condition.ts | 8.2 KB | 245 | YES | <1ms |
| safeIncrement | race-condition.ts | (same) | (same) | YES | <1ms |
| unsafeIncrementRandom | race-condition.ts | (same) | (same) | YES | <1ms per call |
| simulateProducerConsumer | producer-consumer.ts | 5.1 KB | 166 | YES | <1ms |
| simulateNaive | dining-philosophers.ts | 14.0 KB | 432 | YES | <1ms |
| simulateOrdered | dining-philosophers.ts | (same) | (same) | YES | <1ms |
| simulateEventLoop | event-loop.ts | 16.1 KB | 591 | YES | <1ms |
| simulateGoroutines | goroutines.ts | 20.1 KB | 779 | YES | <1ms |
| simulateReadersWriters | readers-writers.ts | 5.8 KB | 198 | YES | <1ms |
| simulateSleepingBarber | sleeping-barber.ts | 5.7 KB | 195 | YES | <1ms |
| simulateAsyncPattern | async-patterns.ts | 13.5 KB | 380 | YES | <1ms |
| simulateDeadlock | deadlock-demo.ts | 6.2 KB | 175 | YES | <1ms |
| simulateDeadlockPrevention | deadlock-demo.ts | (same) | (same) | YES | <1ms |
| simulateSpinLock | mutex-comparison.ts | 12.5 KB | 420 | YES | <1ms |
| simulateMutex | mutex-comparison.ts | (same) | (same) | YES | <1ms |
| simulateTTAS | mutex-comparison.ts | (same) | (same) | YES | <1ms |
| computeMetrics | mutex-comparison.ts | (same) | (same) | YES | <1ms |
| simulateThreadPool | ThreadPoolSaturationVisualizer.tsx | 10.1 KB | 306 | YES | <1ms |
| **TOTAL ENGINE CODE** | | **112 KB** | **3,887** | ALL PURE | ALL <1ms |

**Key insight:** ALL engine functions are pure (input→output, no side effects), execute in <1ms, and produce deterministic step arrays. There is ZERO reason to move computation to the server.

### 1.4 User-Generated Data

| Data | Store | Persisted? | Where? | Size | Cross-Device? |
|------|-------|------------|--------|------|---------------|
| Active demo selection | useState (hook) | No | RAM only | <1 byte | No |
| Step index | useState (hook) | No | RAM only | 4 bytes | No |
| Playing state | useState (hook) | No | RAM only | 1 byte | No |
| Sub-demo selections | useState (hook) | No | RAM only | ~20 bytes | No |
| Histogram results | useState (hook) | No | RAM only | ~400 bytes | No |
| Module progress* | lib/progress/module-progress.ts | Yes | localStorage | ~200 bytes | No |

*Module progress is managed by the platform's progress tracker, not the concurrency module itself.

**The Concurrency module uses ZERO Zustand stores, ZERO localStorage directly, and ZERO server persistence.**

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE: Educational Content (descriptions, explanations)

```
CANDIDATE: Demo descriptions + properties panel educational text
CURRENTLY: Hardcoded JSX in ConcurrencyModule.tsx:81-148 (DEMOS) and :2700-3090 (properties)
SIZE: ~33.5 KB of educational text across 11 demos
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs to be searchable/filterable (SEO concept pages)
  [x] Needs versioning/history (track content improvements)
  [x] Enables localization (same schema, different language)
  [x] Enables A/B testing descriptions
  [ ] Users can save/share custom versions — NO
  [ ] Performance: too large for bundle — NO (33.5 KB is fine)
DB TABLE: Use existing `progress` table pattern but need NEW table
SCHEMA:
```

```typescript
// src/db/schema/concepts.ts (NEW)
export const concepts = pgTable("concepts", {
  id: varchar("id", { length: 100 }).primaryKey(),      // "race-condition"
  moduleId: varchar("module_id", { length: 100 }).notNull(), // "concurrency"
  name: varchar("name", { length: 255 }).notNull(),      // "Race Condition"
  description: text("description"),                       // sidebar description
  difficulty: varchar("difficulty", { length: 20 }),      // "beginner"
  category: varchar("category", { length: 100 }),         // "synchronization"
  content: jsonb("content").notNull().default({}),        // {
                                                          //   hook: "...",
                                                          //   intuition: "...",
                                                          //   explanation: "...",
                                                          //   realWorld: ["..."],
                                                          //   commonMistakes: ["..."],
                                                          //   interviewTips: ["..."],
                                                          //   summary: ["..."]
                                                          // }
  pseudocode: jsonb("pseudocode"),                        // [{lang: "generic", lines: [...]}]
  codeSnippets: jsonb("code_snippets"),                   // [{lang: "go", code: "...", expected: "..."}]
  tags: text("tags").array(),
  prerequisites: text("prerequisites").array(),           // ["mutex", "thread-lifecycle"]
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

```
MIGRATION EFFORT: M
  - Extract 11 demo definitions from ConcurrencyModule.tsx
  - Extract ~390 lines of properties panel JSX → JSON content
  - Create seed script
  - Update components to fetch from API
```

### 2.2 MOVE TO DATABASE: User Progress (when auth is ready)

```
CANDIDATE: Per-concept mastery, prediction accuracy, completion state
CURRENTLY: localStorage via lib/progress/module-progress.ts (platform-level)
SIZE: ~200 bytes per user
WHY MOVE:
  [x] Needs to persist across devices (login → see your history)
  [x] Needs to be shared (leaderboard, social proof counters)
  [x] Needs analytics (which concepts are most/least mastered)
DB TABLE: EXISTING `progress` table — already has userId, moduleId, conceptId, score
SCHEMA: Already defined in src/db/schema/progress.ts — PERFECT fit
  - userId → user's Clerk ID
  - moduleId → "concurrency"
  - conceptId → "race-condition", "deadlock-demo", etc.
  - score → 0.0 to 1.0 mastery
  - completedAt → when first completed
MIGRATION EFFORT: S (schema exists, just need API routes + Clerk auth)
```

### 2.3 MOVE TO API ROUTE: Simulation Parameter Presets

```
CANDIDATE: Simulation configurations (thread count, buffer size, etc.)
CURRENTLY: 19 hardcoded values in ConcurrencyModule.tsx
WHY API:
  [x] Users should be able to save custom configurations
  [x] Community can share interesting scenarios ("Try 8 threads with buffer 2!")
  [ ] Too large to bundle — NO (tiny data)
API ROUTE: GET /api/concurrency/presets, POST /api/concurrency/presets
METHOD: GET (list presets), POST (save custom preset)
REQUEST: POST { demoId: "race-condition", params: { threads: 5, increments: 10 }, name: "High contention" }
RESPONSE: { presets: [{ id, demoId, params, name, author, isDefault }] }
CACHING: ISR 1 hour for defaults, no cache for user-created
MIGRATION EFFORT: M
```

### 2.4 KEEP IN FRONTEND: All Simulation Engines

```
CANDIDATE: All 18 simulate* functions + computeMetrics
WHY KEEP:
  [x] Pure computation (input → output, no side effects)
  [x] Small data (<1KB output per simulation)
  [x] ALL execute in <1ms (no performance benefit from server)
  [x] Real-time/interactive (too latency-sensitive for API round-trip)
  [x] Privacy (user experiments shouldn't leave device)
  [x] Offline capability (simulations work without internet)
TOTAL: 112 KB of engine code — stays in bundle
```

### 2.5 KEEP IN FRONTEND: Visualization Components

```
CANDIDATE: All 12 visualization components + color maps + label maps
WHY KEEP:
  [x] Real-time rendering (60fps animation, <16ms budget)
  [x] Tightly coupled to browser APIs (SVG, DOM, CSS)
  [x] Color maps are tiny (<2.5 KB total) and used at render time
  [x] No server-side rendering benefit (all interactive)
TOTAL: 116 KB of component code — stays in bundle
```

### 2.6 KEEP IN FRONTEND: Playback State

```
CANDIDATE: stepIndex, playing, timerRef, active demo selection
WHY KEEP:
  [x] Purely local UI state (no sharing needed)
  [x] Changes 2.5x per second during playback (too frequent for API)
  [x] Privacy (user's exploration path is personal)
```

### 2.7 MOVE TO WEB WORKER: Monte Carlo Histogram (future)

```
CANDIDATE: unsafeIncrementRandom() × 100 iterations (histogram feature)
CURRENTLY: Runs synchronously on main thread (ConcurrencyModule.tsx:2431-2438)
WHY WORKER:
  [x] Blocks UI during 100-iteration loop (CON-013 already identified)
  [x] Could run 1000+ iterations for better distribution
  [x] Worker bridge already exists (src/lib/workers/worker-bridge.ts)
WORKER FILE: src/lib/workers/concurrency-histogram-worker.ts
COMMUNICATION: postMessage({ threadCount: 3, increments: 3, iterations: 1000 }) → { results: number[] }
EFFORT: S (worker bridge pattern established, just add new worker)
```

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schemas — Status

| Table | File | Status | Usable for Concurrency? |
|-------|------|--------|------------------------|
| `users` | users.ts | Schema exists, not migrated | YES — Clerk sync for auth |
| `progress` | progress.ts | Schema exists, not migrated | **YES — PERFECT FIT** for mastery tracking |
| `diagrams` | diagrams.ts | Schema exists, not migrated | No — system design specific |
| `templates` | templates.ts | Schema exists, not migrated | No — system design specific |
| `simulation_runs` | simulations.ts | Schema exists, not migrated | PARTIAL — could store simulation configs |
| `gallery_submissions` | gallery.ts | Schema exists, not migrated | POSSIBLE — shared presets |
| `ai_usage` | ai-usage.ts | Schema exists, not migrated | No — AI specific |

### 3.2 New Table: `concepts` (educational content)

```typescript
// src/db/schema/concepts.ts
import { pgTable, timestamp, uuid, varchar, text, integer, jsonb, index } from "drizzle-orm/pg-core";

export const concepts = pgTable("concepts", {
  id: varchar("id", { length: 100 }).primaryKey(),
  moduleId: varchar("module_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  difficulty: varchar("difficulty", { length: 20 }),
  category: varchar("category", { length: 100 }),
  content: jsonb("content").notNull().default({}),
  pseudocode: jsonb("pseudocode"),
  codeSnippets: jsonb("code_snippets"),
  tags: text("tags").array(),
  prerequisites: text("prerequisites").array(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("concepts_module_id_idx").on(table.moduleId),
  index("concepts_category_idx").on(table.category),
]);
```

This table is **module-agnostic** — it works for ALL modules (algorithms, data structures, concurrency, etc.), replacing hardcoded content across the platform.

### 3.3 New Table: `simulation_presets` (user-configurable scenarios)

```typescript
// src/db/schema/simulation-presets.ts
export const simulationPresets = pgTable("simulation_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  moduleId: varchar("module_id", { length: 100 }).notNull(),
  conceptId: varchar("concept_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  params: jsonb("params").notNull(),       // { threads: 5, increments: 10, bufferSize: 4 }
  isDefault: boolean("is_default").default(false),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("presets_module_concept_idx").on(table.moduleId, table.conceptId),
]);
```

### 3.4 Data Seeding Strategy

```
Step 1: Create src/db/seeds/concurrency-concepts.ts
  - Extract DEMOS array → 11 concept rows
  - Extract properties panel text → content JSON per row
  - Extract EVENT_LOOP_DEMOS, GOROUTINE_DEMOS, ASYNC_PATTERN_DEMOS → codeSnippets JSON

Step 2: Create src/db/seeds/concurrency-presets.ts
  - Extract 19 hardcoded parameters → default preset rows
  - Mark as isDefault: true

Step 3: Run migration + seed
  - pnpm drizzle-kit generate
  - pnpm drizzle-kit migrate
  - pnpm db:seed (custom script)
```

---

## Phase 4: API Design

### 4.1 Concept Catalog API

```
ENDPOINT: GET /api/concurrency/concepts
PURPOSE: Fetch catalog for sidebar (names, descriptions, difficulty)
AUTH: None (public)
CACHE: ISR 1 hour (content rarely changes)
RESPONSE:
  {
    concepts: [
      {
        id: "race-condition",
        name: "Race Condition",
        description: "Unsafe vs safe concurrent counter increments.",
        difficulty: "beginner",
        category: "synchronization",
        sortOrder: 1,
        tags: ["mutex", "lost-update", "critical-section"]
      },
      ...
    ]
  }
MIGRATION FROM: import DEMOS from ConcurrencyModule.tsx → fetch("/api/concurrency/concepts")
```

### 4.2 Concept Detail API

```
ENDPOINT: GET /api/concurrency/concepts/[id]
PURPOSE: Fetch full educational content for a specific concept
AUTH: None (public)
CACHE: ISR 24 hours
RESPONSE:
  {
    id: "race-condition",
    name: "Race Condition",
    content: {
      hook: "Two ATMs. One bank account. $100 balance...",
      intuition: "The problem is the gap between READ and WRITE...",
      explanation: "<full educational text>",
      realWorld: ["Kafka producer acknowledgement", "Database lost updates"],
      commonMistakes: ["Forgetting to lock the READ", "Thinking volatile prevents races"],
      interviewTips: ["Asked at Google, Meta, Amazon..."],
      summary: ["Race = two threads, shared data, no sync", ...]
    },
    pseudocode: [{ lang: "generic", lines: ["lock(mutex)", "read(counter)", ...] }],
    codeSnippets: [],
    prerequisites: ["thread-lifecycle"]
  }
MIGRATION FROM: hardcoded JSX in properties panel → fetched JSON rendered by component
```

### 4.3 User Progress API

```
ENDPOINT: GET /api/concurrency/progress
PURPOSE: Fetch user's progress across all concurrency concepts
AUTH: Required (Clerk)
CACHE: No cache (user-specific)
RESPONSE:
  {
    concepts: [
      { id: "race-condition", score: 0.85, completedAt: "2026-04-10T..." },
      { id: "deadlock-demo", score: 0.60, completedAt: null },
      ...
    ],
    streakDays: 7,
    totalCompleted: 8,
    totalConcepts: 12
  }
DB TABLE: progress (existing schema)

ENDPOINT: POST /api/concurrency/progress
PURPOSE: Update progress for a specific concept
AUTH: Required (Clerk)
BODY: { conceptId: "race-condition", score: 0.90 }
DB TABLE: progress (upsert on userId+moduleId+conceptId)
```

### 4.4 Simulation Presets API

```
ENDPOINT: GET /api/concurrency/presets?conceptId=race-condition
PURPOSE: Fetch default + user presets for a concept
AUTH: Optional (public for defaults, auth for user presets)
RESPONSE:
  {
    defaults: [
      { id: "default-race", name: "Standard (3 threads, 3 increments)", params: { threads: 3, increments: 3 } }
    ],
    userPresets: [
      { id: "xxx", name: "High contention", params: { threads: 8, increments: 10 } }
    ]
  }

ENDPOINT: POST /api/concurrency/presets
PURPOSE: Save custom preset
AUTH: Required (Clerk)
BODY: { conceptId: "race-condition", name: "High contention", params: { threads: 8, increments: 10 } }
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
CURRENT STATE:
  - ConcurrencyModule.tsx: 117 KB bundled (all 12 viz components + all text)
  - Engine files: 112 KB bundled (all 11 engines)
  - Total concurrency JS: ~229 KB
  - ALL loaded on first visit regardless of which demo is viewed

AFTER MIGRATION:
  - UI shell: ~50 KB (layout, sidebar, playback controls)
  - Active viz component: ~10 KB (lazy-loaded per demo)
  - Engine for active demo: ~10 KB (lazy-loaded per demo)
  - Content: 2 KB API response (fetched on demand)
  - Total initial load: ~72 KB (vs 229 KB = 68% reduction)

NOTE: The concurrency module is NOT a performance bottleneck.
229 KB is small compared to the Algorithm module (1.1 MB configs alone).
The split in CON-014 (per-viz component files) delivers most of the
bundle benefit WITHOUT needing a database. The DB migration's value
for concurrency is FEATURES, not performance.
```

### Feature Benefits

```
ENABLED BY CONCEPTS TABLE:
  ✓ Content writers can update descriptions without code deploy
  ✓ SEO pages can fetch concept data server-side (ISR/SSG)
  ✓ Full-text search across all concepts via PostgreSQL
  ✓ A/B test different educational descriptions
  ✓ Track which descriptions have highest mastery scores
  ✓ Localization: add lang column for multi-language content
  ✓ Versioning: updatedAt tracks changes, can add version column

ENABLED BY PROGRESS TABLE (existing):
  ✓ Progress persists across devices (login → see history)
  ✓ Leaderboards (rank users by mastery score)
  ✓ Social proof counters ("12,847 students learned this")
  ✓ Personalized recommendations (suggest weakest concepts)
  ✓ FSRS scheduling synced to server (not just localStorage)

ENABLED BY PRESETS TABLE:
  ✓ Users save custom simulation scenarios
  ✓ Community shares interesting configurations
  ✓ Professors create class-specific presets
  ✓ "Popular presets" recommendation
```

### User Experience Benefits

```
  ✓ Faster first load (lazy content fetch vs monolithic bundle)
  ✓ Progress persists across devices (login once, see everywhere)
  ✓ Deep-linkable concept pages with SEO (/concepts/race-condition)
  ✓ Share custom scenarios with friends (preset URLs)
  ✓ Search works across all concurrency concepts
```

---

## Phase 6: Migration Roadmap

```
PHASE A: PREREQUISITE — Split Monolith (CON-014)
  - Split ConcurrencyModule.tsx into per-viz files
  - This is REQUIRED before any backend migration
  - Effort: L (already tasked)
  - Timeline: Week 1

PHASE B: Database Setup
  Step 1: Run existing migrations (tables already defined)
    - pnpm drizzle-kit generate && pnpm drizzle-kit migrate
    - Creates: users, progress, diagrams, templates, simulation_runs, gallery, ai_usage
    - Effort: S (schema exists, just needs migration execution)

  Step 2: Create new concept + preset tables
    - Add concepts.ts and simulation-presets.ts to src/db/schema/
    - Run migration again
    - Effort: S

  Step 3: Seed concurrency concepts
    - Write src/db/seeds/concurrency-concepts.ts
    - Extract DEMOS array + properties panel text → concept rows
    - Effort: M
    - Timeline: Week 2

PHASE C: API Routes
  Step 4: Create concept API routes
    - GET /api/concurrency/concepts (catalog)
    - GET /api/concurrency/concepts/[id] (detail)
    - Effort: S per route
    - Timeline: Week 2

  Step 5: Create progress API routes
    - GET /api/concurrency/progress (requires Clerk auth)
    - POST /api/concurrency/progress
    - Effort: S per route
    - Timeline: Week 3 (after Clerk integration)

  Step 6: Create presets API routes
    - GET /api/concurrency/presets
    - POST /api/concurrency/presets
    - Effort: S per route
    - Timeline: Week 3

PHASE D: Component Migration
  Step 7: Update sidebar to fetch catalog from API
    - Replace DEMOS import with useSWR/React Query fetch
    - Add loading skeleton, error state
    - Effort: M

  Step 8: Update properties panel to fetch content from API
    - Replace hardcoded JSX with dynamic content rendering
    - Add loading state for content fetch
    - Effort: M

  Step 9: Update progress tracking to use API
    - Replace localStorage with API calls
    - Add optimistic updates for fast UI feedback
    - Effort: M
    - Timeline: Week 4

PHASE E: Cleanup
  Step 10: Remove migrated data from frontend
    - Keep engine files (pure computation)
    - Remove DEMOS array, properties text, hardcoded params
    - Effort: S
    - Timeline: Week 5
```

---

## Phase 7: What NOT to Move

### ✅ KEEP IN FRONTEND — DO NOT MOVE

| Data | Why Keep |
|------|----------|
| **All simulate*() functions** | Pure computation, <1ms, no server benefit |
| **All visualization components** | Real-time rendering, browser-only APIs |
| **Color/label maps** | Tiny (<2.5KB), used at render time, changes per-theme not per-user |
| **Playback state** (stepIndex, playing) | Local UI, changes 2.5x/sec during playback |
| **Animation choreography** | Tightly coupled to browser animation APIs |
| **Step recording logic** | Part of engine (pure function output) |
| **Active demo selection** | Local UI preference, no sharing needed |
| **Timer/interval management** | Browser-only, real-time |

### → MOVE TO BACKEND

| Data | Destination | Why Move |
|------|-------------|----------|
| **Demo catalog** (names, descriptions) | `concepts` table | CMS, search, SEO, localization |
| **Educational content** (explanations, tips) | `concepts` table | CMS, A/B testing, versioning |
| **Code snippets** (Go, JS examples) | `concepts` table | Multi-language expansion |
| **User progress** (mastery, completion) | `progress` table | Cross-device, leaderboards |
| **Simulation presets** (custom params) | `simulation_presets` table | Sharing, community |

### ⚡ MOVE TO WEB WORKER

| Data | Why Worker |
|------|-----------|
| **Histogram computation** (100× unsafeIncrementRandom) | Blocks main thread, already identified in CON-013 |
| **Real parallel threads** (SharedArrayBuffer races) | CON-077 — actual Web Workers for real non-determinism |

---

## Summary

### Migration Priority

| Phase | What | Effort | Impact | Priority |
|-------|------|--------|--------|----------|
| **A** | Split monolith (CON-014) | L | Enables everything else | **P0** |
| **B** | Run DB migrations | S | Unlocks all DB features | **P1** |
| **C** | Concept + progress APIs | M | SEO, cross-device progress | **P1** |
| **D** | Component migration | M | Dynamic content, CMS | **P2** |
| **E** | Presets API | M | Community sharing | **P3** |

### Key Decision: Is Backend Migration Worth It for Concurrency?

**For content CMS + SEO: YES.** The `concepts` table benefits ALL modules, not just Concurrency. Building it once enables content writers to update descriptions for 200+ concepts across 13 modules without code deploys.

**For user progress: YES, but only after Clerk auth.** The `progress` table already exists. Once auth is wired, progress sync is trivial.

**For simulation engines: NO.** All computation stays frontend. Zero benefit from server-side execution.

**For presets: NICE-TO-HAVE.** Low priority. User-configurable params (CON-018) work purely frontend first. Presets API only matters when sharing/community features are built.

**Recommended approach:** Build the `concepts` table and API as a PLATFORM feature (not concurrency-specific). Seed it from ALL modules simultaneously. The schema is module-agnostic by design. This amortizes the migration cost across the entire platform.
