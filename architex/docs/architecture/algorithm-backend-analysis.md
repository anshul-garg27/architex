# Architex Algorithm Visualizer -- Backend & Data Migration Analysis

**Date**: 2026-04-13
**Scope**: Algorithm module data architecture, backend migration feasibility, and roadmap
**Status**: Analysis only -- no code changes

---

## Phase 1: Data Inventory

### 1.1 Algorithm Configuration Data (Static Content)

Every algorithm ships an `AlgorithmConfig` object (`src/lib/algorithms/types.ts:171-209`) containing:
- `id`, `name`, `category`, `difficulty`
- `timeComplexity` (best/average/worst), `spaceComplexity`
- `stable`, `inPlace` (sorting-specific booleans)
- `description` (50-200 word educational prose)
- `pseudocode` (8-18 line string array)
- `complexityIntuition`, `realWorldApps`, `interviewTips`, `whenToUse`
- `comparisonGuide`, `productionNote`, `summary`, `commonMistakes`
- `prerequisites` (algorithm ID references)

**Inventory by category:**

| Category       | Algorithms | Config lines | Disk size | Files |
|----------------|-----------|-------------|-----------|-------|
| sorting        | 18        | 329 (index) | 196 KB    | 19    |
| graph          | 18        | 609 (index) | 244 KB    | 21    |
| tree           | 11        | 358 (index) | 148 KB    | 15    |
| dp             | 11        | 335 (index) | 132 KB    | 13    |
| string         | 4         | 122 (index) | 44 KB     | --    |
| backtracking   | 4         | 108 (index) | 48 KB     | --    |
| geometry       | 3+        | 102 (index) | 52 KB     | --    |
| patterns       | 5         | 25 (index)  | 52 KB     | --    |
| probabilistic  | 3         | 19 (index)  | 40 KB     | --    |
| vector-search  | 2         | 16 (index)  | 32 KB     | --    |
| design         | 1         | 15 (index)  | 16 KB     | --    |
| greedy         | 2         | 27 (index)  | 20 KB     | --    |
| search         | 1         | 36 (index)  | 12 KB     | --    |
| **TOTAL**      | **83+**   | **27,470**  | **1.1 MB**| **~120** |

Each AlgorithmConfig averages ~1.5 KB of JSON text (description, pseudocode, tips, etc.).
**Total static content: ~83 configs x 1.5 KB = ~125 KB of pure educational text.**

### 1.2 Sample Data / Test Fixtures

Hardcoded sample inputs live alongside engines:

| File                                     | Lines | Purpose                              |
|------------------------------------------|-------|--------------------------------------|
| `graph/sample-graphs.ts`                 | 469   | 12 sample graphs (adjacency lists)   |
| `tree/sample-trees.ts`                   | 80    | 3 sample trees (BALANCED_BST, etc.)  |
| `dp/knapsack.ts` (DEFAULT_KNAPSACK_ITEMS)| inline| Default knapsack item set            |
| `dp/subset-sum.ts` (DEFAULT_SUBSET_SUM_*)| inline| Default nums + target                |
| `backtracking/*` (SAMPLE_SUDOKU, etc.)   | inline| Puzzle starting states               |
| `geometry/*` (SAMPLE_POINTS/SEGMENTS)    | inline| 2D point sets                        |
| `greedy/*` (DEFAULT_ACTIVITIES, etc.)    | inline| Activity/item defaults               |
| `design/*` (LRU_CACHE_DEFAULT_OPS)       | inline| Default operation sequences           |
| `learning-paths.ts`                      | 91    | 6 curated learning paths             |

**Total sample data: ~40 KB across all files.**

### 1.3 Algorithm Engine Functions (Implementation Logic)

Pure functions that accept input data and return `AlgorithmResult` (config + steps + finalState):

- `bubbleSort(arr)` -> `AlgorithmResult` (`sorting/bubble-sort.ts:49-217`)
- Pattern: each engine file exports a `CONFIG` constant and a runner function
- Total engine code: ~27,470 lines across 120 files (1.1 MB)
- Engines produce `AnimationStep[]` with `VisualMutation[]` for the visualizer

Engine functions are CPU-bound, pure, and deterministic. They produce step arrays that can contain 10-500+ entries per run.

### 1.4 Playback & Animation Infrastructure

| File                          | Lines | Category              |
|-------------------------------|-------|-----------------------|
| `playback-controller.ts`     | 173   | Animation timing      |
| `types.ts` (AnimationStep)   | 226   | Step/mutation types    |

The `PlaybackController` class (`playback-controller.ts:9-172`) manages play/pause/step timing with pedagogical pacing (lines 145-149: first 3 steps 1.5x slower, milestones 2x slower).

### 1.5 User-Generated Data (Currently localStorage)

Three separate localStorage stores handle user progress:

**1. Progress Store** (`src/stores/progress-store.ts:1-113`)
- `ChallengeAttempt[]`: challengeId, score, timeSpent, hintsUsed, per-dimension scores
- `totalXP`: number
- `streakDays`: number
- `lastActiveDate`: ISO string
- Zustand with `persist` middleware, key: `"architex-progress"`

**2. Algorithm Scoring** (`src/lib/algorithms/practice/scoring.ts:1-97`)
- `AlgoScore` per algorithm: runs, flashcardsCorrect/Total, scenariosCorrect/Total, debugSolved
- Raw `localStorage.getItem/setItem` with key: `"architex-algo-scores"`
- Mastery level calculation (0-5 tiers, line 89-97)

**3. Spaced Repetition** (`src/lib/algorithms/practice/spaced-repetition.ts:1-83`)
- `ReviewCard[]`: algorithmId, nextReviewDate, interval, ease factor, reviews count
- SM-2 variant algorithm (correct: interval * ease, incorrect: reset to 1 day)
- Raw `localStorage.getItem/setItem` with key: `"architex-srs-cards"`

**4. UI Store** (`src/stores/ui-store.ts:1-207`)
- Panel visibility, theme, animation speed, recently studied topics
- Zustand with `persist`, key: `"architex-ui"`, partialized (lines 192-204)

**Estimated localStorage footprint per user:**
- Progress: 5-50 KB (grows with attempts)
- Algo scores: 5-20 KB (one entry per algorithm touched)
- SRS cards: 2-10 KB (one card per algorithm in deck)
- UI state: <1 KB
- **Total: 12-81 KB per user, all lost on browser/device change**

### 1.6 Existing Database Schema (Unused)

Schema defined at `src/db/schema/` with Drizzle ORM + Neon PostgreSQL:

| Table                | File              | Columns | Status     |
|----------------------|-------------------|---------|------------|
| `users`              | `users.ts`        | 6       | Defined, unused |
| `diagrams`           | `diagrams.ts`     | 12      | Defined, unused |
| `simulation_runs`    | `simulations.ts`  | 7       | Defined, unused |
| `progress`           | `progress.ts`     | 7       | Defined, unused |
| `templates`          | `templates.ts`    | 8       | Defined, unused |
| `gallery_submissions`| `gallery.ts`      | 6       | Defined, unused |
| `gallery_upvotes`    | `gallery.ts`      | 4       | Defined, unused |
| `ai_usage`           | `ai-usage.ts`     | 7       | Defined, unused |

Relations defined in `relations.ts` (108 lines). DB connection via Neon serverless driver in `src/db/index.ts`. Config at `drizzle.config.ts` points to `DATABASE_URL_UNPOOLED`.

**Migrations have never been run** (`drizzle/migrations` directory referenced but no evidence of executed migrations).

### 1.7 Existing API Routes

Routes at `src/app/api/`:

| Route              | Method | Purpose                        | Uses DB? |
|--------------------|--------|--------------------------------|----------|
| `/api/challenges`  | GET    | Returns interview challenges   | No (imports from lib) |
| `/api/csp-report`  | POST   | CSP violation reporting        | No       |
| `/api/diagrams`    | CRUD   | Diagram persistence            | Likely intended |
| `/api/email-preview`| GET   | Email template preview         | No       |
| `/api/evaluate`    | POST   | AI evaluation                  | No       |
| `/api/health`      | GET    | Health check                   | No       |
| `/api/hint`        | POST   | AI hints                       | No       |
| `/api/oembed`      | GET    | oEmbed metadata                | No       |
| `/api/og`          | GET    | OpenGraph image generation     | No       |
| `/api/simulations` | CRUD   | Simulation persistence         | Likely intended |
| `/api/templates`   | CRUD   | Template persistence           | Likely intended |
| `/api/webhooks/clerk`| POST | Clerk webhook handler          | Likely intended |

**No algorithm-specific API routes exist.**

---

## Phase 2: Migration Recommendations

### 2.1 MOVE TO DATABASE

#### A. Algorithm Configurations (83+ records)

**Recommendation: MOVE TO DATABASE**

All `AlgorithmConfig` objects from the 13 `*_ALGORITHMS` arrays should migrate to a database table. This is the highest-impact change.

**Why:**
- 125 KB of educational text ships in every page load (descriptions, pseudocode, tips)
- Content updates require a full deployment
- No way to search, filter, or sort algorithms server-side
- No way for admins to edit content without code changes
- Community contributions (user-submitted algorithms) are impossible
- SEO: server-rendered algorithm pages need data from the server

**What stays client-side:** The runtime engine functions (bubbleSort, bfs, etc.) MUST remain client-side. Only the metadata/content moves.

#### B. User Progress Data

**Recommendation: MOVE TO DATABASE**

The three localStorage stores (progress-store, algo-scores, SRS cards) should consolidate into DB tables.

**Why:**
- Data is lost on browser clear, device switch, or incognito mode
- No cross-device sync (start on laptop, continue on phone)
- No leaderboards or social features possible
- No analytics on user learning patterns
- Existing `progress` table in schema is a perfect fit

#### C. Learning Paths

**Recommendation: MOVE TO DATABASE**

The 6 hardcoded paths in `learning-paths.ts` should be database rows.

**Why:**
- Enables user-created custom learning paths
- Admin can add/reorder paths without deployment
- Paths can reference algorithm IDs via junction table
- Enables "recommended next" based on user progress

#### D. Sample Data / Test Fixtures

**Recommendation: MOVE TO DATABASE (seed data)**

Sample graphs, trees, and default inputs should be seeded into the database.

**Why:**
- Enables user-created sample inputs (share a custom graph)
- Community graph/tree templates
- Currently 40 KB of static data in the bundle

### 2.2 MOVE TO API ROUTE

#### A. Algorithm Catalog Endpoint

**Recommendation: NEW API ROUTE**

Replace direct imports of `SORTING_ALGORITHMS`, `GRAPH_ALGORITHMS`, etc. with an API call.

**Why:**
- `AlgorithmPanel.tsx` imports ALL algorithm configs + ALL engine functions (line 22-100)
- `AlgorithmModule.tsx` imports 7 algorithm arrays + sample data (line 46-66)
- These imports prevent tree-shaking and force the entire 1.1 MB into the bundle
- API route enables pagination, search, and filtering

#### B. Algorithm Detail Endpoint

**Recommendation: NEW API ROUTE**

Individual algorithm detail (full description, pseudocode, tips) loaded on demand.

**Why:**
- User only views 1 algorithm at a time
- Loading all 83 configs upfront is wasteful
- Enables deep linking with server-rendered content

#### C. Progress Sync Endpoint

**Recommendation: NEW API ROUTE**

Replace localStorage reads/writes with API calls.

**Why:**
- Enables cross-device progress
- Auth-gated (only your data)
- Can batch sync (offline-first with periodic flush)

### 2.3 KEEP IN FRONTEND

| What                          | File(s)                          | Reason                                    |
|-------------------------------|----------------------------------|-------------------------------------------|
| Engine functions              | `sorting/bubble-sort.ts:49-217`  | CPU-bound, needs instant response, pure   |
| PlaybackController            | `playback-controller.ts`         | Real-time animation timing, uses setTimeout |
| VisualMutation/AnimationStep  | `types.ts`                       | Runtime animation data structures         |
| UI Store (panel state)        | `ui-store.ts`                    | Ephemeral UI state, no server need        |
| Canvas state                  | `canvas-store.ts`                | Real-time interaction state               |
| Visualization rendering       | Component layer                  | React rendering, canvas operations        |
| Animation choreography        | AlgorithmCanvas component        | Frame-by-frame visual updates             |

### 2.4 MOVE TO WEB WORKER (Future)

| What                          | Reason                                              |
|-------------------------------|-----------------------------------------------------|
| Engine functions for large N  | bubbleSort on 10K elements blocks main thread        |
| Step generation for complex algos | Floyd-Warshall O(V^3) step generation can freeze UI |
| Batch scoring computation     | Mastery recalculation across all algorithms          |

This is orthogonal to the backend migration and can be done independently.

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schema Assessment

The existing tables in `src/db/schema/` are well-designed but algorithm-unaware:
- `users` -- ready to use, has Clerk integration
- `progress` -- generic (moduleId + conceptId), needs algorithm-specific fields
- `diagrams` -- for system design diagrams, not algorithms
- No algorithm-specific tables exist

### 3.2 New Tables Required

```typescript
// src/db/schema/algorithms.ts

import {
  pgTable, pgEnum,
  uuid, varchar, text, boolean, integer, real, jsonb, timestamp,
  index, uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

// ── Enums ──────────────────────────────────────────────────────

export const algorithmCategoryEnum = pgEnum("algorithm_category", [
  "sorting", "graph", "tree", "dp", "string",
  "backtracking", "geometry", "search", "greedy",
  "patterns", "probabilistic", "vector-search", "design",
]);

export const difficultyEnum = pgEnum("difficulty_level", [
  "beginner", "intermediate", "advanced", "expert",
]);

// ── Table 1: algorithms ────────────────────────────────────────
// Replaces: SORTING_ALGORITHMS, GRAPH_ALGORITHMS, etc.
// Source: 13 *_ALGORITHMS arrays across src/lib/algorithms/*/index.ts

export const algorithms = pgTable(
  "algorithms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    // ^^ Maps to current AlgorithmConfig.id ("bubble-sort", "bfs", etc.)
    name: varchar("name", { length: 255 }).notNull(),
    category: algorithmCategoryEnum("category").notNull(),
    difficulty: difficultyEnum("difficulty"),
    // Complexity
    timeBest: varchar("time_best", { length: 50 }).notNull(),
    timeAverage: varchar("time_average", { length: 50 }).notNull(),
    timeWorst: varchar("time_worst", { length: 50 }).notNull(),
    spaceComplexity: varchar("space_complexity", { length: 50 }).notNull(),
    // Sorting-specific flags
    stable: boolean("stable"),
    inPlace: boolean("in_place"),
    // Educational content (the big payload)
    description: text("description").notNull(),
    pseudocode: jsonb("pseudocode").notNull().default([]),
    // ^^ string[] -- preserves line-by-line structure
    complexityIntuition: text("complexity_intuition"),
    realWorldApps: jsonb("real_world_apps").default([]),
    interviewTips: text("interview_tips"),
    whenToUse: text("when_to_use"),
    comparisonGuide: text("comparison_guide"),
    productionNote: text("production_note"),
    summary: jsonb("summary").default([]),
    commonMistakes: jsonb("common_mistakes").default([]),
    // Ordering
    sortOrder: integer("sort_order").notNull().default(0),
    // Metadata
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("algorithms_category_idx").on(table.category),
    index("algorithms_difficulty_idx").on(table.difficulty),
    index("algorithms_slug_idx").on(table.slug),
  ],
);

export type Algorithm = InferSelectModel<typeof algorithms>;
export type NewAlgorithm = InferInsertModel<typeof algorithms>;

// ── Table 2: algorithm_prerequisites ───────────────────────────
// Replaces: AlgorithmConfig.prerequisites string[]
// Enables DAG-based learning path generation

export const algorithmPrerequisites = pgTable(
  "algorithm_prerequisites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    algorithmId: uuid("algorithm_id").notNull()
      .references(() => algorithms.id, { onDelete: "cascade" }),
    prerequisiteId: uuid("prerequisite_id").notNull()
      .references(() => algorithms.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("algo_prereq_unique_idx").on(
      table.algorithmId, table.prerequisiteId,
    ),
  ],
);

// ── Table 3: algorithm_scores ──────────────────────────────────
// Replaces: localStorage "architex-algo-scores" (scoring.ts)
// Maps 1:1 with the current AlgoScore interface

export const algorithmScores = pgTable(
  "algorithm_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    algorithmSlug: varchar("algorithm_slug", { length: 100 }).notNull(),
    // ^^ References algorithms.slug via app logic (not FK for perf)
    runs: integer("runs").notNull().default(0),
    flashcardsCorrect: integer("flashcards_correct").notNull().default(0),
    flashcardsTotal: integer("flashcards_total").notNull().default(0),
    scenariosCorrect: integer("scenarios_correct").notNull().default(0),
    scenariosTotal: integer("scenarios_total").notNull().default(0),
    debugSolved: integer("debug_solved").notNull().default(0),
    lastActivity: timestamp("last_activity", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("algo_scores_user_algo_idx").on(
      table.userId, table.algorithmSlug,
    ),
    index("algo_scores_user_idx").on(table.userId),
  ],
);

export type AlgorithmScore = InferSelectModel<typeof algorithmScores>;
export type NewAlgorithmScore = InferInsertModel<typeof algorithmScores>;

// ── Table 4: review_cards ──────────────────────────────────────
// Replaces: localStorage "architex-srs-cards" (spaced-repetition.ts)

export const reviewCards = pgTable(
  "review_cards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    algorithmSlug: varchar("algorithm_slug", { length: 100 }).notNull(),
    nextReviewDate: timestamp("next_review_date", { mode: "date" }).notNull(),
    interval: integer("interval_days").notNull().default(1),
    ease: real("ease_factor").notNull().default(2.5),
    reviews: integer("reviews").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("review_cards_user_algo_idx").on(
      table.userId, table.algorithmSlug,
    ),
    index("review_cards_due_idx").on(table.userId, table.nextReviewDate),
  ],
);

export type ReviewCard = InferSelectModel<typeof reviewCards>;
export type NewReviewCard = InferInsertModel<typeof reviewCards>;

// ── Table 5: learning_paths ────────────────────────────────────
// Replaces: LEARNING_PATHS constant in learning-paths.ts

export const learningPaths = pgTable(
  "learning_paths",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    weeks: integer("weeks").notNull().default(0),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    index("learning_paths_slug_idx").on(table.slug),
  ],
);

// ── Table 6: learning_path_algorithms (junction) ───────────────

export const learningPathAlgorithms = pgTable(
  "learning_path_algorithms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    pathId: uuid("path_id").notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    algorithmSlug: varchar("algorithm_slug", { length: 100 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("lpa_path_algo_idx").on(table.pathId, table.algorithmSlug),
    index("lpa_path_idx").on(table.pathId),
  ],
);

// ── Table 7: sample_inputs ─────────────────────────────────────
// Replaces: sample-graphs.ts, sample-trees.ts, inline defaults

export const sampleInputs = pgTable(
  "sample_inputs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    category: algorithmCategoryEnum("category").notNull(),
    /** JSON structure depends on category: Graph, number[], TreeNode, etc. */
    data: jsonb("data").notNull(),
    isBuiltIn: boolean("is_built_in").notNull().default(false),
    authorId: uuid("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (table) => [
    index("sample_inputs_category_idx").on(table.category),
  ],
);
```

### 3.3 Data Seeding Strategy

A seed script should populate the `algorithms` table from the existing TypeScript constants:

```typescript
// drizzle/seed-algorithms.ts (outline)

import { getDb } from "@/db";
import { algorithms, algorithmPrerequisites } from "@/db/schema/algorithms";
import { SORTING_ALGORITHMS } from "@/lib/algorithms/sorting";
import { GRAPH_ALGORITHMS } from "@/lib/algorithms/graph";
// ... all 13 category arrays

const ALL_CONFIGS = [
  ...SORTING_ALGORITHMS,
  ...GRAPH_ALGORITHMS,
  ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS,
  ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
  ...SEARCH_ALGORITHMS,
  ...GREEDY_ALGORITHMS,
  ...PATTERN_ALGORITHMS,
  ...PROBABILISTIC_ALGORITHMS,
  ...VECTOR_SEARCH_ALGORITHMS,
  ...DESIGN_ALGORITHMS,
];

async function seed() {
  const db = getDb();
  // 1. Upsert all algorithm configs
  for (const config of ALL_CONFIGS) {
    await db.insert(algorithms).values({
      slug: config.id,
      name: config.name,
      category: config.category,
      difficulty: config.difficulty ?? null,
      timeBest: config.timeComplexity.best,
      timeAverage: config.timeComplexity.average,
      timeWorst: config.timeComplexity.worst,
      spaceComplexity: config.spaceComplexity,
      stable: config.stable ?? null,
      inPlace: config.inPlace ?? null,
      description: config.description,
      pseudocode: config.pseudocode,
      complexityIntuition: config.complexityIntuition ?? null,
      realWorldApps: config.realWorldApps ?? [],
      interviewTips: config.interviewTips ?? null,
      whenToUse: config.whenToUse ?? null,
      comparisonGuide: config.comparisonGuide ?? null,
      productionNote: config.productionNote ?? null,
      summary: config.summary ?? [],
      commonMistakes: config.commonMistakes ?? [],
    }).onConflictDoUpdate({
      target: algorithms.slug,
      set: { /* all fields except id, slug, createdAt */ },
    });
  }
  // 2. Insert prerequisites (after all slugs exist)
  // 3. Seed learning paths from LEARNING_PATHS
  // 4. Seed sample inputs from sample-graphs.ts, sample-trees.ts
}
```

**Seeding approach:**
1. Run once via `pnpm drizzle-kit migrate` then `pnpm seed`
2. Use `onConflictDoUpdate` on slug for idempotent re-seeding
3. Keep TypeScript constants as the source of truth during migration period
4. After migration is stable, remove the constant arrays and read from DB only

---

## Phase 4: API Design

### 4.1 Algorithm Catalog

```
GET /api/algorithms
```

**Auth:** None (public)
**Caching:** `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200`

**Query params:**
- `?category=sorting` -- filter by category
- `?difficulty=beginner` -- filter by difficulty
- `?search=dijkstra` -- full-text search on name + description
- `?limit=20&offset=0` -- pagination

**Response:**
```json
{
  "algorithms": [
    {
      "slug": "bubble-sort",
      "name": "Bubble Sort",
      "category": "sorting",
      "difficulty": "beginner",
      "timeComplexity": { "best": "O(n)", "average": "O(n^2)", "worst": "O(n^2)" },
      "spaceComplexity": "O(1)",
      "stable": true,
      "inPlace": true
    }
  ],
  "total": 83,
  "limit": 20,
  "offset": 0
}
```

**Replaces:** Direct imports of `SORTING_ALGORITHMS`, `GRAPH_ALGORITHMS`, `TREE_ALGORITHMS`, `DP_ALGORITHMS`, `STRING_ALGORITHMS`, `BACKTRACKING_ALGORITHMS`, `GEOMETRY_ALGORITHMS`, `SEARCH_ALGORITHMS`, `GREEDY_ALGORITHMS`, `PATTERN_ALGORITHMS`, `PROBABILISTIC_ALGORITHMS`, `VECTOR_SEARCH_ALGORITHMS`, `DESIGN_ALGORITHMS` in:
- `src/components/canvas/panels/AlgorithmPanel.tsx:22-27`
- `src/components/modules/AlgorithmModule.tsx:46-51`

**Note:** The catalog response intentionally omits heavy fields (description, pseudocode, tips) to keep the list payload small (~3 KB for 83 items vs ~125 KB with full content).

### 4.2 Algorithm Detail

```
GET /api/algorithms/:slug
```

**Auth:** None (public)
**Caching:** `Cache-Control: public, max-age=3600, s-maxage=86400`

**Response:**
```json
{
  "slug": "bubble-sort",
  "name": "Bubble Sort",
  "category": "sorting",
  "difficulty": "beginner",
  "timeComplexity": { "best": "O(n)", "average": "O(n^2)", "worst": "O(n^2)" },
  "spaceComplexity": "O(1)",
  "stable": true,
  "inPlace": true,
  "description": "What if you could only compare...",
  "pseudocode": ["procedure bubbleSort(A: list)", "  n = length(A)", "..."],
  "complexityIntuition": "O(n^2): two nested loops...",
  "realWorldApps": ["CS education worldwide", "..."],
  "interviewTips": "...",
  "whenToUse": "...",
  "comparisonGuide": "...",
  "productionNote": "...",
  "summary": ["..."],
  "commonMistakes": ["..."],
  "prerequisites": ["insertion-sort"]
}
```

**Replaces:** Individual CONFIG imports (e.g., `BUBBLE_SORT_CONFIG` from `sorting/bubble-sort.ts:12-36`).

### 4.3 Progress Sync

```
GET  /api/progress/algorithms          -- Get all algorithm scores for authenticated user
PUT  /api/progress/algorithms/:slug    -- Upsert score for one algorithm
POST /api/progress/algorithms/batch    -- Batch sync (offline-first flush)
```

**Auth:** Required (Clerk JWT)
**Caching:** Private, no-cache

**PUT Request:**
```json
{
  "runs": 5,
  "flashcardsCorrect": 3,
  "flashcardsTotal": 5,
  "scenariosCorrect": 1,
  "scenariosTotal": 2,
  "debugSolved": 0
}
```

**Replaces:** `getAlgoScores()`, `recordRun()`, `recordFlashcard()`, `recordScenario()`, `recordDebugSolved()` from `src/lib/algorithms/practice/scoring.ts:31-78`.

### 4.4 Spaced Repetition

```
GET  /api/srs/due                      -- Cards due for review today
POST /api/srs/review                   -- Record a review result
POST /api/srs/add                      -- Add algorithm to review deck
```

**Auth:** Required (Clerk JWT)
**Caching:** Private, no-cache

**POST /api/srs/review Request:**
```json
{
  "algorithmSlug": "bubble-sort",
  "correct": true
}
```

**Replaces:** `getCardsForReview()`, `scheduleReview()`, `addToReviewDeck()` from `src/lib/algorithms/practice/spaced-repetition.ts:28-82`.

### 4.5 Learning Paths

```
GET  /api/learning-paths               -- List all paths (built-in + user-created)
GET  /api/learning-paths/:slug         -- Path detail with algorithm list
POST /api/learning-paths               -- Create custom path (auth required)
```

**Auth:** GET = public, POST = required
**Caching:** Public endpoints: `max-age=3600, s-maxage=86400`

**Replaces:** `LEARNING_PATHS` constant from `src/lib/algorithms/learning-paths.ts:13-90`.

### 4.6 Sample Inputs

```
GET  /api/sample-inputs?category=graph  -- Sample data for a category
POST /api/sample-inputs                 -- User-submitted sample input (auth required)
```

**Auth:** GET = public, POST = required
**Caching:** `max-age=3600`

**Replaces:** `SAMPLE_GRAPH_FOR_ALGORITHM`, `BALANCED_BST`, `DEFAULT_KNAPSACK_ITEMS`, etc.

---

## Phase 5: Benefits Analysis

### 5.1 Bundle Size Reduction

| What moves out                   | Current bundle cost | Reduction |
|----------------------------------|---------------------|-----------|
| 13 *_ALGORITHMS arrays (configs) | ~125 KB (text)      | -125 KB   |
| Sample graphs/trees/defaults     | ~40 KB              | -40 KB    |
| Learning paths                   | ~5 KB               | -5 KB     |
| Practice scoring (localStorage)  | ~4 KB               | -4 KB     |
| Spaced repetition                | ~3 KB               | -3 KB     |
| **Subtotal: content + data**     |                     | **~177 KB raw** |

After gzip, the raw savings of ~177 KB translate to approximately **40-60 KB fewer transferred** per initial page load. The remaining ~920 KB in `src/lib/algorithms/` is engine code that stays client-side.

**Important caveat:** Engine functions (bubbleSort, bfs, etc.) import their own CONFIG objects. If we remove configs from the bundle but keep engines, the engines still work -- they return `config` as part of `AlgorithmResult`, but the catalog/detail views use the API instead.

### 5.2 Features Enabled by Database

| Feature                        | Blocked by localStorage | Enabled by DB |
|--------------------------------|------------------------|---------------|
| Cross-device progress sync     | Yes                    | Yes           |
| Leaderboards / social learning | Yes                    | Yes           |
| Admin content editing          | Yes                    | Yes           |
| Full-text algorithm search     | Client-only            | PostgreSQL FTS |
| User-created learning paths    | Yes                    | Yes           |
| Shared sample inputs           | Yes                    | Yes           |
| Analytics on learning patterns | Yes                    | Yes           |
| SRS scheduling across devices  | Yes                    | Yes           |
| Algorithm recommendations      | Client-only heuristic  | ML-ready data |
| SEO (server-rendered content)  | Missing                | Yes           |
| Public algorithm profile pages | No data source         | Yes           |
| Offline-first with sync        | No sync target         | Yes           |

### 5.3 Performance Improvements

| Metric                 | Current              | After migration            |
|------------------------|----------------------|----------------------------|
| Initial JS bundle      | Includes all configs | Configs loaded on demand   |
| Time to Interactive    | Blocked by parsing   | Faster (less JS to parse)  |
| Algorithm list render  | Synchronous import   | Streamed from API + cache  |
| Search                 | Client filter of 83  | PostgreSQL full-text       |
| Content updates        | Full redeploy        | DB update, cache invalidation |

---

## Phase 6: Migration Roadmap

### Step 1: Run database migrations (Effort: 0.5 day)

**Risk: Low | Impact: Foundation for everything**

1. Set `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in `.env.local`
2. Add the new algorithm tables to `src/db/schema/algorithms.ts`
3. Run `pnpm drizzle-kit generate` to create migration SQL
4. Run `pnpm drizzle-kit migrate` to apply to Neon
5. Verify with `pnpm drizzle-kit studio`

This also applies the 8 existing unused tables (users, diagrams, etc.).

### Step 2: Seed algorithm data (Effort: 1 day)

**Risk: Low | Impact: Database populated**

1. Write `drizzle/seed-algorithms.ts` that reads from existing TS constants
2. Insert all 83+ algorithms, prerequisites, learning paths, sample inputs
3. Add `"seed": "tsx drizzle/seed-algorithms.ts"` to package.json
4. Run and verify data integrity

### Step 3: Algorithm catalog API (Effort: 1 day)

**Risk: Low | Impact: High (enables all downstream work)**

1. Create `src/app/api/algorithms/route.ts` (GET with filtering/pagination)
2. Create `src/app/api/algorithms/[slug]/route.ts` (GET detail)
3. Add caching headers
4. Write integration tests

### Step 4: Refactor AlgorithmPanel to use API (Effort: 2 days)

**Risk: Medium | Impact: High (bundle size reduction)**

1. Replace `SORTING_ALGORITHMS` etc. imports with `useSWR('/api/algorithms')`
2. Load algorithm detail on selection instead of having all configs in memory
3. Keep engine function imports (they must stay client-side)
4. The critical file: `src/components/canvas/panels/AlgorithmPanel.tsx` (currently imports ~100 functions at lines 22-100)

**Migration strategy for AlgorithmPanel.tsx:**
- Phase A: Fetch catalog from API, keep engine imports for running
- Phase B: Dynamic import engines only when user selects an algorithm
- Phase C: Remove static *_ALGORITHMS array imports entirely

### Step 5: Progress sync API (Effort: 2 days)

**Risk: Medium | Impact: High (cross-device sync)**

1. Create progress API routes (GET/PUT/batch)
2. Create SRS API routes (due/review/add)
3. Write a Zustand middleware that syncs to API on mutation
4. Offline-first: write to localStorage first, sync to server on connectivity
5. Migration: on first authenticated load, push localStorage data to server

**localStorage migration path:**
```
User logs in for the first time with existing localStorage data
-> Client reads localStorage("architex-algo-scores")
-> Client POSTs to /api/progress/algorithms/batch
-> Server merges (take higher values for runs, correct counts)
-> Client switches to API-first, localStorage becomes cache
```

### Step 6: Learning paths API (Effort: 0.5 day)

**Risk: Low | Impact: Medium**

1. Create learning paths API routes
2. Replace `LEARNING_PATHS` import with API call
3. Add UI for custom learning path creation

### Step 7: Sample inputs API (Effort: 0.5 day)

**Risk: Low | Impact: Low-Medium**

1. Create sample inputs API routes
2. Replace `SAMPLE_GRAPH_FOR_ALGORITHM`, `BALANCED_BST`, etc. with API calls
3. Add UI for user-submitted sample inputs

### Step 8: Dynamic engine imports (Effort: 2 days)

**Risk: Medium-High | Impact: High (major bundle reduction)**

The biggest remaining win: instead of importing ALL 83+ engine functions in AlgorithmPanel.tsx, use `next/dynamic` or `import()` to load engines on demand.

```typescript
// Before: all engines in bundle
import { bubbleSort, mergeSort, quickSort, /* ... 80 more */ } from '@/lib/algorithms';

// After: load engine only when selected
const engine = await import(`@/lib/algorithms/${category}/${slug}`);
const result = engine.default(input);
```

This cuts the remaining ~920 KB of engine code from the initial bundle, loading only the ~15 KB engine the user actually selects.

### Timeline Summary

| Step | What                       | Effort  | Dependencies | Bundle savings |
|------|----------------------------|---------|-------------|----------------|
| 1    | Run migrations             | 0.5 day | None        | 0              |
| 2    | Seed data                  | 1 day   | Step 1      | 0              |
| 3    | Algorithm catalog API      | 1 day   | Step 2      | 0              |
| 4    | Refactor panel to use API  | 2 days  | Step 3      | ~125 KB raw    |
| 5    | Progress sync API          | 2 days  | Step 1      | ~7 KB raw      |
| 6    | Learning paths API         | 0.5 day | Step 3      | ~5 KB raw      |
| 7    | Sample inputs API          | 0.5 day | Step 2      | ~40 KB raw     |
| 8    | Dynamic engine imports     | 2 days  | Step 4      | ~920 KB raw    |
| **Total**                        | **~10 days** |       | **~1.1 MB raw** |

Steps 1-3 are the foundation. Steps 4-5 deliver the most user-visible value. Step 8 delivers the biggest performance win but has the highest risk.

---

## Phase 7: What NOT to Move

These MUST remain client-side. Moving them to the server would add latency, break real-time interaction, or serve no purpose:

### Algorithm Execution Logic
- Every engine function (`bubbleSort`, `bfs`, `dijkstra`, etc.)
- These are pure, CPU-bound functions that must run synchronously
- They produce `AnimationStep[]` arrays that drive the visualizer
- Server-side execution would add network round-trip for every step
- Located in: `src/lib/algorithms/*/` (the non-index, non-types files)

### Visualization Rendering
- `AlgorithmCanvas` component and its sub-components
- Array bar rendering, graph node/edge SVG, tree layout
- These use React state, refs, and DOM manipulation
- Located in: `src/components/modules/algorithm/AlgorithmCanvas.tsx`

### Animation Choreography
- `PlaybackController` class (`src/lib/algorithms/playback-controller.ts`)
- setTimeout-based step scheduling with pedagogical timing
- Real-time play/pause/step-forward/step-backward controls
- Must be in the same thread as the renderer

### Real-Time Canvas State
- `canvas-store.ts` -- zoom, pan, selection, node positions
- `viewport-store.ts` -- viewport coordinates
- `editor-store.ts` -- code editor state
- These update at 60fps during interaction; server sync would be meaningless

### UI Ephemeral State
- `ui-store.ts` panel visibility, theme, animation speed
- These are per-session preferences (theme already persists via Zustand)
- Server storage adds complexity with no user benefit

### Mastery Level Computation
- `getMasteryLevel(score)` in `scoring.ts:89-97`
- This is a pure function on score data -- compute on either side
- Keep client-side for instant display; server can also compute for leaderboards

---

## Appendix A: File Reference Index

All file paths are relative to project root `/Users/anshullkgarg/Desktop/system_design/architex/`.

| File | Role | Lines |
|------|------|-------|
| `src/lib/algorithms/types.ts` | Core type definitions | 226 |
| `src/lib/algorithms/index.ts` | Main barrel export | 341 |
| `src/lib/algorithms/sorting/index.ts` | Sorting catalog (18 algos) | 329 |
| `src/lib/algorithms/sorting/bubble-sort.ts` | Example engine + config | 217 |
| `src/lib/algorithms/graph/index.ts` | Graph catalog (18 algos) | 609 |
| `src/lib/algorithms/graph/sample-graphs.ts` | 12 sample graphs | 469 |
| `src/lib/algorithms/tree/index.ts` | Tree catalog (11 algos) | 358 |
| `src/lib/algorithms/tree/sample-trees.ts` | 3 sample trees | 80 |
| `src/lib/algorithms/dp/index.ts` | DP catalog (11 algos) | 335 |
| `src/lib/algorithms/string/index.ts` | String catalog (4 algos) | 122 |
| `src/lib/algorithms/backtracking/index.ts` | Backtracking catalog | 108 |
| `src/lib/algorithms/geometry/index.ts` | Geometry catalog | 102 |
| `src/lib/algorithms/patterns/index.ts` | Patterns catalog | 25 |
| `src/lib/algorithms/probabilistic/index.ts` | Probabilistic catalog | 19 |
| `src/lib/algorithms/vector-search/index.ts` | Vector search catalog | 16 |
| `src/lib/algorithms/design/index.ts` | Design patterns catalog | 15 |
| `src/lib/algorithms/greedy/index.ts` | Greedy catalog | 27 |
| `src/lib/algorithms/search/index.ts` | Search catalog | 36 |
| `src/lib/algorithms/learning-paths.ts` | 6 learning paths | 91 |
| `src/lib/algorithms/playback-controller.ts` | Animation controller | 173 |
| `src/lib/algorithms/practice/scoring.ts` | XP/mastery (localStorage) | 97 |
| `src/lib/algorithms/practice/spaced-repetition.ts` | SRS (localStorage) | 83 |
| `src/stores/progress-store.ts` | Challenge progress (Zustand) | 113 |
| `src/stores/ui-store.ts` | UI state (Zustand) | 207 |
| `src/db/schema/users.ts` | Users table | 39 |
| `src/db/schema/diagrams.ts` | Diagrams table | 57 |
| `src/db/schema/progress.ts` | Progress table | 52 |
| `src/db/schema/simulations.ts` | Simulations table | 48 |
| `src/db/schema/templates.ts` | Templates table | 49 |
| `src/db/schema/gallery.ts` | Gallery tables | 74 |
| `src/db/schema/ai-usage.ts` | AI usage table | 49 |
| `src/db/schema/relations.ts` | All relations | 108 |
| `src/db/schema/index.ts` | Schema barrel export | 34 |
| `src/db/index.ts` | DB connection (Neon) | 38 |
| `drizzle.config.ts` | Drizzle Kit config | 22 |
| `src/components/canvas/panels/AlgorithmPanel.tsx` | Main algorithm UI | 100+ imports |
| `src/components/modules/AlgorithmModule.tsx` | Module wrapper | 70+ imports |
| `src/app/api/challenges/route.ts` | Challenge API | 66 |
| `src/app/api/health/route.ts` | Health check | 10 |

## Appendix B: Algorithm Count by Category

| Category       | Count | IDs (from types.ts) |
|----------------|-------|---------------------|
| Sorting        | 18    | bubble-sort, insertion-sort, selection-sort, merge-sort, merge-sort-bottom-up, quick-sort, heap-sort, shell-sort, counting-sort, radix-sort, bucket-sort, tim-sort, cocktail-shaker-sort, comb-sort, pancake-sort, bogo-sort, radix-sort-msd, quick-sort-hoare |
| Graph          | 18    | bfs, dfs, dfs-iterative, dijkstra, kruskal, topological-sort, topological-sort-kahn, bellman-ford, a-star, tarjan-scc, prims, floyd-warshall, bipartite, cycle-detection, euler-path, ford-fulkerson, articulation-points, bridges |
| Tree           | 11    | bst-operations, avl-tree, red-black-tree, b-tree, huffman-tree, tree-traversals, heap-operations, trie-operations, union-find, segment-tree, fenwick-tree |
| DP             | 11    | fibonacci-dp, lcs, edit-distance, knapsack, coin-change, lis, matrix-chain, rod-cutting, subset-sum, longest-palindrome, catalan |
| String         | 4     | kmp, rabin-karp, boyer-moore, z-algorithm |
| Backtracking   | 4     | n-queens, sudoku, knights-tour, subset-generation |
| Geometry       | 3     | convex-hull, closest-pair, line-intersection |
| Search         | 1     | binary-search |
| Greedy         | 2     | activity-selection, fractional-knapsack |
| Patterns       | 5     | monotonic-stack, floyd-cycle, two-pointers, sliding-window, interval-merge |
| Probabilistic  | 3     | bloom-filter, skip-list, count-min-sketch |
| Vector Search  | 2     | cosine-similarity, hnsw |
| Design         | 1     | lru-cache |
| **Total**      | **83**|                     |
