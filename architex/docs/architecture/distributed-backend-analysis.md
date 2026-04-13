# Distributed Systems Module — Backend & Data Migration Analysis

> Analysis date: 2026-04-13
> Module: `src/lib/distributed/` + `src/components/modules/DistributedModule.tsx`
> Status: **Analysis only — no code changes**

---

## PHASE 1: DATA INVENTORY

### 1.1 Static Content (descriptions, explanations, metadata)

| File | Data | Size | Type | Changes at Runtime? |
|------|------|------|------|:-------------------:|
| DistributedModule.tsx:79-135 | SIMULATIONS array (11 entries) | ~2 KB | Catalog: id, name, description per sim | No |
| DistributedModule.tsx:2973-3600 | DistributedProperties content | ~25 KB | Key Concepts, Guarantees, Protocol Phases, Used By, Interview Qs, Intuition, Misconceptions, Why Two Phases per sim | No |
| concepts-data.ts (6 entries) | SEO concept pages | ~15 KB | slug, title, description, difficulty, interviewQuestions, explanation per concept | No |
| knowledge-graph/concepts.ts (9 nodes) | Knowledge graph nodes | ~3 KB | id, name, domain, description, relatedConcepts, difficulty, tags | No |
| streak-protector.ts (10 questions) | Distributed micro-challenges | ~4 KB | question, options, correctAnswer, explanation per question | No |
| achievements.ts (10 entries) | Distributed achievements | ~3 KB | id, name, description, icon, category, condition, xpReward, rarity | No |

**Total static content: ~52 KB across 6 files.**
**Could a non-developer update this?** No — all content is embedded in TypeScript files requiring code deploy.
**Is content duplicated?** Partially — descriptions exist in SIMULATIONS array AND in SEO concepts-data.ts AND in knowledge-graph concepts.ts (3 sources of truth for the same concepts).

### 1.2 Configuration Data

| File | Data | Type | User-configurable? |
|------|------|------|:------------------:|
| DistributedModule.tsx:3513-3607 | Engine initialization params (Raft: 5 nodes, Gossip: 8 nodes fanout 2, ConsistentHash: 50 vnodes) | Hardcoded defaults | No (but could be sliders — DIS-108 proposes this) |
| distributed-config.ts | Color palette, animation timing, spring configs | Config constants | No |
| module-progress.ts:82-93 | Feature list for progress tracking (11 concepts) | String array | No |
| skill-tree.ts | Distributed systems skill track nodes | DAG config | No |

### 1.3 Implementation Logic (Engines)

| File | Logic | Size | Pure Function? | Needs Server? |
|------|-------|------|:--------------:|:-------------:|
| raft.ts | Raft consensus state machine (election, replication, crash, partition) | 29 KB | YES (class, deterministic with seeded RNG) | NO |
| consistent-hash.ts | Hash ring with FNV-1a, vnodes, key assignment | 10 KB | YES (class) | NO |
| vector-clock.ts | Vector clock simulation with causality | 7 KB | YES (class) | NO |
| gossip.ts | Anti-entropy gossip with push/pull/push-pull modes | 12 KB | YES (class, seeded RNG) | NO |
| crdt.ts | 4 CRDT types + simulation wrapper | 19 KB | YES (classes) | NO |
| cap-theorem.ts | CAP explorer with PACELC extension | 23 KB | YES (class) | NO |
| two-phase-commit.ts | 2PC protocol simulation | 5 KB | YES (pure function) | NO |
| saga.ts | Saga choreography + orchestration | 9 KB | YES (pure functions) | NO |
| map-reduce.ts | MapReduce word-count pipeline | 6 KB | YES (pure function) | NO |
| lamport-timestamps.ts | Lamport scalar timestamps | 6 KB | YES (class) | NO |
| paxos.ts | Paxos + Multi-Paxos simulation | 11 KB | YES (pure functions) | NO |

**Total engine logic: ~137 KB. ALL pure computation. NONE needs server.**

### 1.4 User-Generated Data

| Store | Data | Persisted? | Where? | Cross-device? |
|-------|------|:----------:|--------|:-------------:|
| ui-store | activeModule, sidebarOpen, theme, onboarding flags | Yes | localStorage | No |
| progress-store | XP, streaks, challenge attempts | Yes | localStorage | No |
| cross-module-store | Per-module mastery (theory/practice), concept completion | Yes | localStorage | No |
| module-progress.ts | Features explored per module, visit counts, activity log | Yes | localStorage | No |
| (none — inline useState) | 45+ state variables for simulation state | No (session only) | React state | No |
| localStorage flags | architex_onboarding_completed, architex_distributed_demo_seen, architex_distributed_tour_completed | Yes | localStorage | No |

**Total user data in localStorage: ~5-20 KB per user.** Lost on browser clear. Not available across devices.

---

## PHASE 2: WHAT SHOULD MOVE TO BACKEND

### 2.1 MOVE TO DATABASE: User Progress & Learning State

```
CANDIDATE: User progress (XP, streaks, mastery, concept completion, challenge attempts)
CURRENTLY: Zustand stores with localStorage persist (progress-store.ts, cross-module-store.ts)
WHY MOVE:
  [x] Needs to persist across devices (user logs in on phone, sees same progress)
  [x] Needs to be shareable (profile page shows learning stats)
  [x] Needs analytics (which concepts are most completed?)
  [x] Needs leaderboard data (compare with other users)
  [x] Lost on browser clear (user loses all progress)
DB TABLE: `progress` table ALREADY EXISTS in schema (src/db/schema/progress.ts)
  - Has userId, moduleId, conceptId, score, completedAt
  - Perfect fit for distributed concept tracking
SCHEMA: No new table needed — existing `progress` table works.
MIGRATION EFFORT: M
  - Wire useDistributedModule store emissions to API calls
  - Create API route POST /api/progress
  - Dual-write: localStorage (instant) + API (async)
```

### 2.2 MOVE TO DATABASE: Catalog Content (descriptions, metadata)

```
CANDIDATE: SIMULATIONS array + Properties panel content + SEO concept data
CURRENTLY: Hardcoded in 3 separate files (triple source of truth)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Eliminates triple-source-of-truth problem
  [x] Enables localization (same schema, different language)
  [x] Enables A/B testing content (different descriptions for study)
  [x] Enables search across all content (PostgreSQL full-text search)
  [x] Needs versioning (track content changes)
DB TABLE: NEW — `concept_catalog` (see schema below)
MIGRATION EFFORT: L
  - Extract all content into structured JSON
  - Create seed script
  - Create API routes
  - Update components to fetch instead of import
```

### 2.3 MOVE TO API: Concept Catalog

```
CANDIDATE: Simulation metadata + Properties content + Interview questions
CURRENTLY: Hardcoded in DistributedModule.tsx (195 KB file)
WHY API:
  [x] Too large to bundle (195 KB for one module)
  [x] Lazy loadable (only fetch the sim the user selects)
  [x] Cacheable (content rarely changes — ISR 1 hour)
  [x] Enables content management UI (admin can edit)
API ROUTES:
  GET /api/distributed/catalog         → list of 11 sims (id, name, description, difficulty)
  GET /api/distributed/[id]            → full details for one sim (properties, interview Qs, etc.)
  GET /api/distributed/[id]/questions  → interview questions for one sim
CACHING: ISR 1 hour (stale-while-revalidate)
```

### 2.4 KEEP IN FRONTEND (no change)

```
✅ ALL 11 engine files (raft.ts, gossip.ts, crdt.ts, etc.)
   WHY: Pure computation, runs in browser, real-time interactive, no server data needed.
   These are the CORE of the module. Moving them to server would add latency
   and break the real-time interactive experience.

✅ Canvas rendering code (all *Canvas components)
   WHY: Real-time rendering, too latency-sensitive for API.

✅ Animation choreography (distributed-config.ts, motion constants)
   WHY: Needs instant response, runs at 60fps.

✅ UI state (sidebar open, active sim, playing/paused)
   WHY: Ephemeral, no need to persist.

✅ Simulation state (cluster state, gossip nodes, CRDT replicas)
   WHY: Session-only, recreated on each visit, deterministic from seed.
```

### 2.5 MOVE TO WEB WORKER (keep in frontend, off main thread)

```
CANDIDATE: Raft cluster simulation during auto-play
CURRENTLY: Runs on main thread at 100ms intervals (step() called in setInterval)
WHY WORKER:
  [ ] Raft step() is fast (<1ms) — not blocking UI
  [ ] BUT at high speed or with 7 nodes, could accumulate
  [x] Future: if we add 50+ node simulations, worker becomes necessary
VERDICT: NOT needed now. Monitor if performance degrades with larger clusters.
```

---

## PHASE 3: DATABASE SCHEMA RECOMMENDATIONS

### 3.1 Existing Schemas (already in src/db/schema/)

| Table | File | Status | Fits Distributed Module? |
|-------|------|--------|:------------------------:|
| users | users.ts | Schema exists, migration exists | YES — needed for progress |
| progress | progress.ts | Schema exists | YES — perfect for concept completion |
| simulation_runs | simulations.ts | Schema exists | PARTIAL — designed for system design canvas, not distributed sims |
| diagrams | diagrams.ts | Schema exists | NO — for system design canvas |
| templates | templates.ts | Schema exists | NO |
| gallery | gallery.ts | Schema exists | POSSIBLE — for shared sim configs |
| ai_usage | ai-usage.ts | Schema exists | NO |

**The `progress` table is ALREADY designed for exactly this use case:** `userId + moduleId + conceptId + score`. No new table needed for progress tracking.

### 3.2 New Table: concept_catalog

```typescript
// src/db/schema/concept-catalog.ts
import {
  pgTable, timestamp, varchar, text, jsonb, boolean, index, real
} from "drizzle-orm/pg-core";

export const conceptCatalog = pgTable(
  "concept_catalog",
  {
    id: varchar("id", { length: 100 }).primaryKey(),     // "raft"
    moduleId: varchar("module_id", { length: 100 }).notNull(), // "distributed"
    name: varchar("name", { length: 255 }).notNull(),    // "Raft Consensus"
    description: text("description").notNull(),           // Problem-first description
    difficulty: varchar("difficulty", { length: 20 }),    // "beginner" | "intermediate" | "advanced"
    category: varchar("category", { length: 100 }),       // "consensus" | "data-distribution" | etc.

    // Properties panel content (JSONB for flexibility)
    intuition: text("intuition"),                         // Analogy text
    keyConcepts: jsonb("key_concepts"),                   // ["concept1", "concept2"]
    guarantees: jsonb("guarantees"),                       // ["guarantee1", "guarantee2"]
    protocolPhases: jsonb("protocol_phases"),              // [{name, description, color}]
    usedBy: jsonb("used_by"),                             // [{system, description}]
    commonMistakes: jsonb("common_mistakes"),              // [{myth, reality}]
    interviewQuestions: jsonb("interview_questions"),      // ["question1", "question2"]
    memorableSummary: jsonb("memorable_summary"),          // ["bullet1", "bullet2", "bullet3"]
    
    // Complexity
    complexity: jsonb("complexity"),                       // {messages: "O(n)", convergence: "O(log N)"}
    
    // Relationships
    prerequisites: jsonb("prerequisites"),                 // ["lamport-timestamps"]
    relatedConcepts: jsonb("related_concepts"),           // ["paxos", "cap-theorem"]
    
    // SEO
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    
    // Metadata
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: real("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("concept_catalog_module_idx").on(table.moduleId),
    index("concept_catalog_difficulty_idx").on(table.difficulty),
  ],
);
```

### 3.3 Data Seeding Strategy

```
Step 1: Extract SIMULATIONS array (11 entries) → JSON
Step 2: Extract DistributedProperties content (per-sim sections) → JSON per concept
Step 3: Extract concepts-data.ts entries → merge with above
Step 4: Create seed script: src/db/seeds/distributed.ts
Step 5: Run: pnpm drizzle-kit generate && pnpm drizzle-kit migrate
Step 6: Run seed: npx tsx src/db/seeds/distributed.ts
```

---

## PHASE 4: API DESIGN

### API 1: Catalog listing

```
ENDPOINT: GET /api/distributed/catalog
PURPOSE: Fetch all 11 sims for sidebar listing
AUTH: None (public)
CACHE: ISR 1 hour
RESPONSE:
  {
    items: [
      { id: "raft", name: "Raft Consensus", description: "...", difficulty: "advanced", sortOrder: 9 },
      { id: "cap-theorem", name: "CAP Theorem", description: "...", difficulty: "intermediate", sortOrder: 1 },
      ...
    ]
  }
MIGRATION FROM: const SIMULATIONS: SimDef[] = [...] → fetch("/api/distributed/catalog")
```

### API 2: Full concept details

```
ENDPOINT: GET /api/distributed/[id]
PURPOSE: Fetch full properties for one simulation
AUTH: None (public)
CACHE: ISR 24 hours
RESPONSE:
  {
    id: "raft",
    name: "Raft Consensus",
    description: "Five servers must agree...",
    intuition: "Think of Raft like a classroom...",
    keyConcepts: [...],
    guarantees: [...],
    usedBy: [...],
    interviewQuestions: [...],
    memorableSummary: [...],
    prerequisites: ["cap-theorem", "vector-clocks"],
    complexity: { messages: "O(n) per election" }
  }
MIGRATION FROM: Hardcoded JSX in DistributedProperties → data-driven rendering
```

### API 3: Save user progress

```
ENDPOINT: POST /api/progress
PURPOSE: Persist concept completion + scores to DB
AUTH: Required (Clerk JWT)
BODY: {
  moduleId: "distributed",
  conceptId: "raft",
  score: 0.8,
  completedAt: "2026-04-13T..."
}
DB TABLE: progress (already exists)
MIGRATION FROM: useProgressStore (localStorage) → API + localStorage (dual-write)
```

### API 4: Get user progress

```
ENDPOINT: GET /api/progress?moduleId=distributed
PURPOSE: Load progress on login (hydrate Zustand from server)
AUTH: Required (Clerk JWT)
RESPONSE:
  {
    concepts: [
      { conceptId: "raft", score: 0.8, completedAt: "..." },
      { conceptId: "gossip", score: 0.6, completedAt: "..." },
    ],
    totalXP: 450,
    streakDays: 7
  }
```

---

## PHASE 5: BENEFITS ANALYSIS

### Performance Benefits

```
CURRENT STATE:
  DistributedModule.tsx = 195 KB (single file, loaded on module switch)
  Engine files = 137 KB (loaded via dynamic import, good)
  Total distributed bundle contribution: ~332 KB

AFTER MIGRATION:
  DistributedModule.tsx = ~80 KB (UI only, content fetched from API)
  Engine files = 137 KB (unchanged — stays in frontend)
  API data = ~5 KB per concept (fetched on demand)
  Total initial load: ~80 KB (60% reduction)
  Per-concept load: +5 KB on demand via API (cached)
```

### Feature Benefits Enabled by DB

```
ENABLED:
  ✅ User progress persists across devices (login → see history)
  ✅ Leaderboard has real server-side data (not just localStorage)
  ✅ Content admin panel (edit descriptions without code deploy)
  ✅ Full-text search across all concepts (PostgreSQL tsvector)
  ✅ Analytics (which concepts most viewed/completed)
  ✅ A/B testing content (serve different descriptions to different cohorts)
  ✅ Localization (same schema, add language column)
  ✅ Content versioning (track who changed what, when)
  ✅ Eliminates triple source of truth (SIMULATIONS + concepts-data + knowledge-graph → one DB)
```

### User Experience Benefits

```
  ✅ Faster first load (smaller JS bundle)
  ✅ Progress survives browser clear / incognito
  ✅ Login on phone → see desktop progress
  ✅ Share profile with learning stats
  ✅ Content updates appear instantly (no redeploy wait)
```

---

## PHASE 6: MIGRATION ROADMAP

```
STEP 1: Run existing Drizzle migrations (create tables)         [S — 1 hour]
  - Neon DB already configured in drizzle.config.ts
  - Schema files exist for users, progress, simulation_runs
  - pnpm drizzle-kit generate && pnpm drizzle-kit migrate
  - Add concept_catalog table schema

STEP 2: Create concept_catalog seed script                      [M — 4 hours]
  - Extract SIMULATIONS array + Properties content + concepts-data
  - Transform into concept_catalog records
  - Script: src/db/seeds/distributed.ts
  - Run seed

STEP 3: Create API routes                                       [M — 4 hours]
  - GET /api/distributed/catalog (ISR, public)
  - GET /api/distributed/[id] (ISR, public)
  - POST /api/progress (authenticated)
  - GET /api/progress?moduleId=distributed (authenticated)

STEP 4: Update DistributedModule to fetch from API              [L — 8 hours]
  - Replace SIMULATIONS hardcoded array with useSWR/fetch
  - Replace Properties hardcoded content with data-driven rendering
  - Add loading states (skeleton) during fetch
  - Keep engine files as-is (no change to simulation logic)
  - Dual-write progress: localStorage (instant) + API (async)

STEP 5: Set up Clerk auth (prerequisite for progress API)       [M — 4 hours]
  - Uncomment ClerkProvider in layout.tsx (line 9, 65)
  - Configure Clerk webhook for user sync
  - Add auth middleware for /api/progress routes

STEP 6: Remove hardcoded content from bundle                    [M — 4 hours]
  - Delete SIMULATIONS array (replaced by API)
  - Delete hardcoded Properties JSX (replaced by data-driven rendering)
  - Keep engine files, canvas components, animation config
  - Bundle size drops from 195 KB → ~80 KB for DistributedModule

TOTAL ESTIMATED EFFORT: ~25 hours (1.5 developer-weeks)
```

---

## PHASE 7: WHAT NOT TO MOVE

```
KEEP IN FRONTEND — DO NOT MOVE TO BACKEND:

  ✅ Engine files (raft.ts, gossip.ts, crdt.ts, etc.)
     Reason: Pure computation, real-time interactive, <1ms per step.
     Moving to server would add 50-200ms latency per step = unusable.

  ✅ Canvas rendering (RaftCanvas, GossipCanvas, CRDTCanvas, etc.)
     Reason: 60fps SVG rendering, too latency-sensitive.

  ✅ Animation config (distributed-config.ts, motion constants)
     Reason: Sub-frame timing, must be in-browser.

  ✅ Zustand UI state (activeModule, sidebarOpen, playing/paused)
     Reason: Ephemeral, no value in persisting to server.

  ✅ Simulation session state (45 useState vars in hook)
     Reason: Session-only, deterministic, recreated from seed.

  ✅ Micro-challenge questions (streak-protector.ts)
     Reason: Only 10 questions (~4 KB), no benefit to API fetch.

  ✅ Achievement definitions (achievements.ts)
     Reason: Only 10 entries (~3 KB), static.

MOVE TO BACKEND — HIGH VALUE:

  → Concept catalog content (descriptions, properties, interview Qs)
     Reason: 52 KB of content that 3 files duplicate. DB = single source of truth.

  → User progress (XP, streaks, mastery, completion)
     Reason: Currently localStorage-only. Cross-device persistence is table stakes.

  → Leaderboard data
     Reason: Needs server-side aggregation across all users.
```

---

## SUMMARY

| Category | Current Location | Recommendation | Effort | Priority |
|----------|-----------------|----------------|:------:|:--------:|
| Engine logic (137 KB) | Frontend (src/lib/distributed/) | **KEEP** — pure computation | — | — |
| Canvas rendering (195 KB) | Frontend (DistributedModule.tsx) | **KEEP** UI, **MOVE** content | L | P2 |
| Catalog content (52 KB) | Hardcoded in 3 files | **MOVE** to concept_catalog DB table | L | P2 |
| User progress (~5 KB/user) | localStorage (Zustand persist) | **MOVE** to progress DB table | M | P1 |
| UI state | React state + localStorage | **KEEP** — ephemeral | — | — |
| Micro-challenges (4 KB) | streak-protector.ts | **KEEP** — too small to API | — | — |
| Achievements (3 KB) | achievements.ts | **KEEP** — too small to API | — | — |

**The highest-value migration is user progress (P1)** — it enables cross-device persistence, which is a user-facing feature. The content migration (P2) is a developer experience improvement that eliminates the triple-source-of-truth problem and enables non-developer content editing, but users won't notice the difference.
