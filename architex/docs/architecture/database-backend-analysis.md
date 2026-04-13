# Database Design Module — Backend & Data Migration Analysis

> **Module:** Database Design
> **Slug:** `database`
> **Date:** 2026-04-13
> **Status:** Analysis only — no code changes

---

## Executive Summary

The Database Design module contains **~28,000 lines** across `src/lib/database/` (7,750 lines) and `src/components/modules/database/` (19,900 lines). Approximately **40% is educational content** (descriptions, quiz questions, tips, examples) hardcoded in TSX/TS files, and **60% is computation logic** (algorithm visualizations, simulation engines).

**Key finding:** ~4,500 lines of pure content data should move to the database. The algorithm engines (BTreeViz, LSMTreeViz, MVCCViz, etc.) should **stay in the frontend** — they're real-time, interactive, and latency-sensitive.

**Migration impact:**
- Bundle size reduction: ~120KB less JavaScript shipped to client
- Enables: CMS-style content editing, cross-device progress sync, community sharing, full-text search, analytics
- Effort: ~2-3 weeks (M effort, phased)

---

## Phase 1: Data Inventory

### 1.1 Static Content (Descriptions, Explanations, Metadata)

| File | Data | Lines | Size (est.) | Changes at Runtime? | Editable by Non-Dev? |
|------|------|-------|-------------|--------------------|--------------------|
| `daily-challenges.ts` | 100 quiz questions with options, answers, explanations | 850 | ~35KB | No | Yes |
| `sample-er-diagrams.ts` | 3 ER diagram templates (E-commerce, Social Media, Library) | 391 | ~15KB | No | Yes |
| `DatabaseSidebar.tsx` (MODES array, lines 73-193) | 20 mode definitions: id, name, difficulty, description, interviewTag | 120 | ~5KB | No | Yes |
| `DatabaseProperties.tsx` (How It Works sections) | ~5 explanatory sections (Normalization, Hash, Query Plans, MVCC, B-Tree) | ~200 | ~8KB | No | Yes |
| `DatabaseProperties.tsx` (Real-World panels) | ~6 real-world examples (Instagram, PostgreSQL, DynamoDB, etc.) | ~80 | ~3KB | No | Yes |
| `DatabaseProperties.tsx` (Interview Tips) | ~3 interview tip panels | ~40 | ~1.5KB | No | Yes |
| `DatabaseProperties.tsx` (Common Mistakes) | ~3 common mistake panels | ~40 | ~1.5KB | No | Yes |
| `DatabaseProperties.tsx` (Used in Production) | ~3 production usage panels (~10 systems) | ~50 | ~2KB | No | Yes |
| `DatabaseProperties.tsx` (Pseudocode blocks, lines 89-215) | 6 algorithm pseudocodes (B-Tree insert/search, Hash insert/search, LSM write/read) | 126 | ~4KB | No | Yes |
| `DatabaseProperties.tsx` (When to Denormalize, lines 798-850) | Denormalization rules + examples | 52 | ~2KB | No | Yes |
| `DatabaseTour.tsx` (TOUR_STEPS, lines 17-52) | 5 onboarding steps with titles and descriptions | 35 | ~1.5KB | No | Yes |
| `ACIDCanvas.tsx` (step defs, lines 32-185) | 4 ACID property demos, ~20 steps total with descriptions | 153 | ~6KB | No | Yes |
| `CAPTheoremCanvas.tsx` (CAP_DATABASES, lines 42-73) | 4 DB classifications (PostgreSQL, Cassandra, MongoDB, DynamoDB) | 31 | ~1.5KB | No | Yes |
| `CAPTheoremCanvas.tsx` (partition steps, lines 77-171) | CP + AP partition scenarios, 14 steps total | 94 | ~4KB | No | Yes |
| `IndexAntiPatternsCanvas.tsx` (5 patterns, lines 45-154) | 5 anti-patterns: bad query, fix query, rule, cost comparisons | 109 | ~5KB | No | Yes |
| `CachingPatternsCanvas.tsx` (3 patterns + invalidation) | Cache-aside (12 steps), write-through (6), write-behind (8) + 3 invalidation strategies | ~330 | ~12KB | No | Yes |
| `ConnectionPoolingCanvas.tsx` (step defs, lines 45-170) | No-pooling (8 steps) + with-pooling (8 steps) with latency data | 125 | ~5KB | No | Yes |
| `StarSnowflakeCanvas.tsx` (step defs) | Star schema (8 steps) + snowflake (7 steps) with SQL examples | ~140 | ~5KB | No | Yes |
| `transaction-sim.ts` (step arrays) | Hardcoded transaction traces for 6 isolation scenarios | ~250 | ~10KB | No | Yes |
| `HashIndexCanvas.tsx` (labels/descriptions) | Collision and resize step descriptions | ~40 | ~1.5KB | No | Yes |

**Totals:**
- **~2,806 lines** of pure content data across 20 locations
- **~131KB** estimated text content
- **0 items** change at runtime
- **All items** could be edited by a content writer with a CMS
- **Duplication:** Mode descriptions appear in MODES array AND in JSON-LD metadata (`src/lib/seo/database-meta.ts`)

### 1.2 Configuration Data (Parameters, Defaults, Options)

| File | Data | Type | User-Configurable? | Saveable? |
|------|------|------|-------------------|-----------|
| `DatabaseSidebar.tsx` (DIFFICULTY_STYLES) | 3 difficulty level colors | UI config | No | No |
| `useDatabaseModule.ts` | Speed presets (slow/normal/fast) | Animation config | Yes (at runtime) | Via localStorage |
| `btree-viz.ts` | B-Tree order (default 3) | Algorithm param | Yes (user picks) | No |
| `hash-index-viz.ts` | Bucket capacity (3), bucket count (4), load factor (0.75) | Algorithm params | No (hardcoded) | No |
| `lsm-viz.ts` | Memtable capacity (4), level ratio (4), max L0 SSTables (4) | Algorithm params | No (hardcoded) | No |
| `schema-converter.ts` | SQL_TYPE_MAP (23 entries), MONGO_TYPE_MAP (23 entries) | Type mappings | No | No |
| `DatabaseProperties.tsx` (Hash vs B-Tree comparison) | Comparison data for hash vs B-Tree decision | Decision data | No | No |
| `DatabaseProperties.tsx` (MVCC vs Locking comparison) | Comparison data for MVCC vs locking | Decision data | No | No |

**Assessment:**
- Algorithm params are small and tightly coupled to visualization logic — keep in frontend
- Type maps are static lookups — keep in frontend (only 46 entries total)
- Comparisons could move to DB if we want CMS editing, but low priority

### 1.3 Implementation Logic (Algorithms, Simulation Engines)

| File | Logic | Lines | Pure Function? | Computation Time | Needs Server? |
|------|-------|-------|----------------|-----------------|---------------|
| `btree-viz.ts` | B-Tree insert/search with step recording | 346 | Yes (class, stateful) | <1ms per op | No |
| `hash-index-viz.ts` | Hash table with chaining, resize | 403 | Yes (class, stateful) | <1ms per op | No |
| `lsm-viz.ts` | LSM-Tree: write→WAL→flush→compact | 583 | Yes (class, stateful) | <1ms per op | No |
| `mvcc-viz.ts` | MVCC snapshot isolation, visibility | 422 | Yes (class, stateful) | <1ms per op | No |
| `join-viz.ts` | 3 join algorithms (NL, SM, HJ) | 755 | Yes (class, stateful) | <5ms per op | No |
| `aries-viz.ts` | ARIES recovery (Analysis/Redo/Undo) | 733 | Yes (class, stateful) | <1ms per op | No |
| `normalization.ts` | Closure, candidate keys, NF detection, decomposition | 517 | Yes (pure functions) | <10ms (exponential worst-case, capped at 15 attrs) | No |
| `query-plan.ts` | SQL→execution plan tree (heuristic) | 217 | Yes (pure function) | <1ms | No |
| `schema-converter.ts` | ER→SQL, ER→MongoDB conversion | 372 | Yes (pure functions) | <1ms | No |
| `er-to-sql.ts` | Thin wrapper for schema-converter | 18 | Yes | <1ms | No |

**Assessment:**
- **All computation is <10ms** — no need for server or Web Worker
- All classes are stateful but pure (deterministic given same inputs)
- The normalization engine has a safety valve (>15 attributes falls back to greedy) — stays client-side
- **Zero items need server computation**

### 1.4 User-Generated Data (Canvas State, Progress, Saved Designs)

| Store | Data | Persisted? | Where? | Cross-Device? | Size |
|-------|------|-----------|--------|--------------|------|
| `progress-store` | XP, streak, challenge attempts | Yes | localStorage | **No** (should be) | ~5-50KB |
| `cross-module-store` | Module mastery scores (13 modules) | Yes | localStorage | **No** (should be) | ~2KB |
| `ui-store` | Active module, panel states, theme, animation speed | Yes | localStorage | Nice-to-have | ~1KB |
| `canvas-store` | ReactFlow nodes/edges (system design canvas) | Yes | localStorage | **No** (should be) | 10-500KB |
| `snapshot-store` | Architecture snapshots (version history) | Yes | localStorage | Nice-to-have | 50-500KB |
| `notification-store` | Up to 100 notifications | Yes | localStorage | No (device-specific) | ~5KB |
| `ai-store` | API key (obfuscated), usage tracking | Yes | localStorage | No (security) | ~1KB |
| `interview-store` | Active challenge state (4h TTL) | Yes | IndexedDB | No (ephemeral) | ~2KB |
| In-component state | ER diagram entities/relationships | No | React state only | No | ~5-20KB |
| In-component state | B-Tree/Hash/LSM visualization state | No | React state only | No | <1KB each |

**Assessment:**
- **progress-store** and **cross-module-store** are the highest-value migration targets — users lose all progress if they clear localStorage or switch devices
- **canvas-store** already has a matching `diagrams` table in the DB schema (just unused)
- ER diagram state (in useDatabaseModule) is ephemeral — only needs DB if user wants to save/share

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE (Neon PostgreSQL via Drizzle)

#### Candidate 1: Daily Challenge Questions

```
CURRENTLY: Hardcoded in src/lib/database/daily-challenges.ts (850 lines, 100 questions)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs to be searchable/filterable (by category, difficulty)
  [x] Needs versioning/history (track question quality)
  [x] Performance: 35KB bundled even if user never opens challenges
  [ ] Needs access control
BENEFITS: Community-submitted questions, A/B test explanations, analytics (which questions users get wrong most)
DB TABLE: NEW — database_challenges
SCHEMA:
```

```typescript
// src/db/schema/database-challenges.ts
export const databaseChallenges = pgTable("database_challenges", {
  id: varchar("id", { length: 50 }).primaryKey(),        // "norm-01"
  question: text("question").notNull(),
  options: jsonb("options").notNull().$type<string[]>(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // "normalization"
  difficulty: varchar("difficulty", { length: 20 }),         // "beginner"
  moduleId: varchar("module_id", { length: 50 }).notNull().default("database"),
  timesAnswered: integer("times_answered").default(0),
  timesCorrect: integer("times_correct").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

```
MIGRATION EFFORT: S
```

#### Candidate 2: Mode Catalog (Descriptions, Difficulty, Interview Tags)

```
CURRENTLY: Hardcoded MODES array in DatabaseSidebar.tsx (lines 73-193, 20 entries)
           + duplicated in src/lib/seo/database-meta.ts (SEO metadata)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Duplicated across sidebar + SEO metadata (single source of truth)
  [x] Needs to be searchable/filterable
  [x] Enables analytics (which modes are most/least popular)
  [ ] Needs access control
DB TABLE: NEW — database_modes
SCHEMA:
```

```typescript
// src/db/schema/database-modes.ts
export const databaseModes = pgTable("database_modes", {
  id: varchar("id", { length: 50 }).primaryKey(),           // "btree-index"
  name: varchar("name", { length: 100 }).notNull(),          // "B-Tree Index"
  description: text("description").notNull(),                 // Full problem-statement description
  difficulty: varchar("difficulty", { length: 20 }).notNull(),// "Intermediate"
  interviewTag: varchar("interview_tag", { length: 100 }),    // "Asked at Google"
  moduleId: varchar("module_id", { length: 50 }).notNull().default("database"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  viewCount: integer("view_count").default(0),
  avgTimeSpentSec: integer("avg_time_spent_sec"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});
```

```
MIGRATION EFFORT: S
```

#### Candidate 3: Educational Content (How It Works, Tips, Mistakes, Production Examples)

```
CURRENTLY: Hardcoded JSX in DatabaseProperties.tsx (3,109 lines total, ~600 lines of pure text content)
           Scattered across: How It Works (5 sections), Real-World (6), Interview Tips (3),
           Common Mistakes (3), Used in Production (3), When to Denormalize (1), Pseudocode (6)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Largest single source of educational text (~25KB)
  [x] Enables A/B testing different explanations
  [x] Enables localization (i18n)
  [x] Needs versioning (track which explanations work best)
DB TABLE: NEW — database_mode_content
SCHEMA:
```

```typescript
// src/db/schema/database-mode-content.ts
export const databaseModeContent = pgTable("database_mode_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  modeId: varchar("mode_id", { length: 50 }).notNull(),       // FK to database_modes.id
  section: varchar("section", { length: 50 }).notNull(),       // "how-it-works", "real-world", "interview-tip", etc.
  title: varchar("title", { length: 200 }),                     // Section title if different from default
  content: jsonb("content").notNull(),                          // Structured content (paragraphs, bullet points, code blocks)
  sortOrder: integer("sort_order").notNull().default(0),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index("mode_content_mode_section_idx").on(table.modeId, table.section),
  uniqueIndex("mode_content_unique_idx").on(table.modeId, table.section, table.sortOrder, table.locale),
]);
```

```
MIGRATION EFFORT: L (lots of content extraction + JSX→structured JSON transformation)
```

#### Candidate 4: User Progress (XP, Streaks, Challenge Attempts)

```
CURRENTLY: Zustand progress-store → localStorage ('architex-progress')
           Shape: { attempts: ChallengeAttempt[], totalXP: number, streakDays: number, lastActiveDate: string }
WHY MOVE:
  [x] Needs to persist across devices (users lose everything on browser clear)
  [x] Needs to be shared (leaderboards)
  [x] Needs analytics (which concepts are hardest)
  [ ] Performance: small data, no bundle impact
DB TABLE: EXISTING — progress (partially matches, needs extension)
EXTENSION NEEDED:
```

```typescript
// Extend existing progress table or create new:
export const databaseProgress = pgTable("database_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  totalXP: integer("total_xp").notNull().default(0),
  streakDays: integer("streak_days").notNull().default(0),
  lastActiveDate: varchar("last_active_date", { length: 10 }),  // "2026-04-13"
  challengeAttempts: jsonb("challenge_attempts").$type<ChallengeAttempt[]>().default([]),
  moduleMastery: jsonb("module_mastery").$type<Record<string, number>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("db_progress_user_idx").on(table.userId),
]);
```

```
MIGRATION EFFORT: M (need sync logic: localStorage → API → DB, with offline fallback)
```

#### Candidate 5: Sample ER Diagrams (Templates)

```
CURRENTLY: Hardcoded in src/lib/database/sample-er-diagrams.ts (391 lines, 3 diagrams)
WHY MOVE:
  [x] Content writers can add new samples without code deploy
  [x] Users can save/share custom ER diagrams
  [x] Community templates (public gallery)
  [x] Searchable/filterable by domain (e-commerce, social, etc.)
DB TABLE: EXISTING — templates (matches perfectly)
MIGRATION EFFORT: S
```

#### Candidate 6: Canvas-Specific Step Definitions (ACID, CAP, Caching, etc.)

```
CURRENTLY: Hardcoded in 8 canvas files (~900 lines total across ACIDCanvas, CAPTheoremCanvas,
           CachingPatternsCanvas, ConnectionPoolingCanvas, IndexAntiPatternsCanvas,
           StarSnowflakeCanvas, transaction-sim.ts)
WHY MOVE:
  [x] Content writers can update step descriptions
  [x] Enables versioning
  [ ] Not user-generated
  [ ] Tightly coupled to visualization rendering
ASSESSMENT: LOWER PRIORITY — these steps are tightly coupled to their canvas animations.
            Moving them to DB adds latency to visualization rendering. Recommend Phase 2.
DB TABLE: NEW (if moved) — database_visualization_steps
MIGRATION EFFORT: L (tight coupling to component rendering logic)
```

### 2.2 MOVE TO API ROUTE (Lazy Load via API)

#### Endpoint 1: Challenge Questions

```
CANDIDATE: Daily challenge questions (100 items, ~35KB)
CURRENTLY: Bundled in client JS — loaded even if user never opens challenge
WHY API:
  [x] Too large to bundle (35KB of pure data)
  [x] Needs rate limiting (prevent scraping all answers)
  [x] Enables dynamic question pool (add questions without deploy)
API ROUTE: GET /api/database/challenges/daily
METHOD: GET
REQUEST: ?date=2026-04-13 (optional, defaults to today)
RESPONSE: { challenge: { id, question, options, category }, streakInfo: { current, best } }
CACHING: ISR 24 hours (same question all day)
NOTE: correctIndex and explanation returned ONLY after submission (POST /api/database/challenges/submit)
```

#### Endpoint 2: Mode Catalog

```
CANDIDATE: Mode definitions (20 items, ~5KB)
CURRENTLY: Imported as MODES array in DatabaseSidebar
WHY API:
  [x] Enables dynamic mode activation/deactivation
  [x] Single source of truth (sidebar + SEO + dynamic routes)
  [ ] Small enough to bundle (5KB) — API is optional
API ROUTE: GET /api/database/modes
METHOD: GET
REQUEST: none
RESPONSE: { modes: [{ id, name, description, difficulty, interviewTag, sortOrder }] }
CACHING: ISR 1 hour (modes rarely change)
MIGRATION FROM: import { MODES } from "./DatabaseSidebar" → useSWR("/api/database/modes")
```

#### Endpoint 3: Mode Educational Content

```
CANDIDATE: Properties panel content (How It Works, Tips, Mistakes, etc.)
CURRENTLY: Hardcoded JSX in DatabaseProperties.tsx
WHY API:
  [x] Lazy-loads only when user opens properties panel
  [x] Enables CMS editing
  [x] Reduces initial bundle by ~25KB
API ROUTE: GET /api/database/modes/[modeId]/content
METHOD: GET
REQUEST: /api/database/modes/btree-index/content
RESPONSE: {
  sections: [
    { type: "how-it-works", title: "How It Works", content: [...paragraphs] },
    { type: "real-world", title: "Real-World", content: [...] },
    { type: "interview-tip", title: "Interview Tip", content: [...] },
    { type: "pseudocode", title: "Pseudocode", lines: [...] },
  ]
}
CACHING: ISR 24 hours
```

#### Endpoint 4: User Progress Sync

```
CANDIDATE: XP, streaks, challenge attempts, module mastery
CURRENTLY: localStorage via Zustand persist
WHY API:
  [x] Cross-device sync
  [x] Needs authentication
  [x] Analytics (learning patterns)
API ROUTES:
  GET  /api/database/progress         — fetch user's progress
  POST /api/database/progress/sync    — sync localStorage → server (merge strategy)
  POST /api/database/challenges/submit — submit challenge answer, get explanation
METHOD: GET/POST
AUTH: Required (Clerk)
RESPONSE (GET): { totalXP, streakDays, lastActiveDate, attempts: [...], mastery: {...} }
CACHING: No cache (user-specific, mutable)
```

#### Endpoint 5: Sample ER Diagrams / Templates

```
CANDIDATE: 3 sample ER diagrams + user-created templates
CURRENTLY: Hardcoded in sample-er-diagrams.ts
WHY API:
  [x] Community templates (save/share)
  [x] Growing library without deploys
API ROUTE: GET /api/database/templates
METHOD: GET
REQUEST: ?category=er-diagram
RESPONSE: { templates: [{ id, name, description, entities, relationships }] }
CACHING: ISR 1 hour
```

### 2.3 KEEP IN FRONTEND (No Change Needed)

| Data | Why Keep |
|------|----------|
| `BTreeViz` class (346 lines) | Pure computation, <1ms per op, real-time interactive |
| `HashIndexViz` class (403 lines) | Pure computation, <1ms per op, real-time interactive |
| `LSMTreeViz` class (583 lines) | Pure computation, <1ms per op, real-time interactive |
| `MVCCViz` class (422 lines) | Pure computation, <1ms per op, real-time interactive |
| `JoinViz` class (755 lines) | Pure computation, <5ms per op, real-time interactive |
| `ARIESViz` class (733 lines) | Pure computation, <1ms per op, real-time interactive |
| `normalization.ts` (517 lines) | Pure functions, <10ms, interactive with live FD editing |
| `query-plan.ts` (217 lines) | Pure function, <1ms, responds to live SQL input |
| `schema-converter.ts` (372 lines) | Pure functions, <1ms, real-time ER→SQL/NoSQL |
| `er-to-sql.ts` (18 lines) | Thin wrapper, trivial |
| `types.ts` (87 lines) | TypeScript types — compile-time only |
| All canvas rendering (9,585 lines SVG/JSX) | Real-time visualization, latency-sensitive |
| `useDatabaseModule.ts` (3,570 lines) | Orchestration hook — drives all interactivity |
| Animation configs (motion/spring) | Real-time, ~16ms frame budget |
| UI state (panel open/closed, theme) | Device-specific, ephemeral |
| Canvas viewport (x, y, zoom) | Ephemeral, 60fps updates |
| Notification store | Device-specific (100 max) |
| AI store (API key) | Security — must not leave device |

### 2.4 MOVE TO WEB WORKER (Off Main Thread)

```
CANDIDATE: None required for this module
REASON: All computation is <10ms. The normalization engine has the highest theoretical
        complexity (exponential) but has a 15-attribute cap with greedy fallback.
        No operation blocks the UI.
NOTE: If a future "SQL Sandbox" mode (DBL-086) adds real SQL parsing/execution,
      THAT would need a Web Worker or WASM-based SQLite.
```

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schemas (Status Check)

| Table | File | Status | Relevant to Database Module? |
|-------|------|--------|---------------------------|
| `users` | users.ts | Schema exists, **not migrated** | Yes — needed for auth |
| `diagrams` | diagrams.ts | Schema exists, **not migrated** | Yes — ER diagram saving |
| `progress` | progress.ts | Schema exists, **not migrated** | Yes — but needs extension for XP/streaks |
| `templates` | templates.ts | Schema exists, **not migrated** | Yes — sample ER diagrams |
| `simulations` | simulations.ts | Schema exists, **not migrated** | No (system design module) |
| `gallery` | gallery.ts | Schema exists, **not migrated** | Future — share ER diagrams |
| `ai-usage` | ai-usage.ts | Schema exists, **not migrated** | Future — AI hint tracking |

### 3.2 New Tables Needed

```sql
-- 1. Database challenge questions (replaces daily-challenges.ts)
CREATE TABLE database_challenges (
  id VARCHAR(50) PRIMARY KEY,             -- "norm-01"
  question TEXT NOT NULL,
  options JSONB NOT NULL,                  -- ["1NF", "2NF", "3NF", "BCNF"]
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,           -- "normalization"
  difficulty VARCHAR(20),                  -- "beginner"
  module_id VARCHAR(50) NOT NULL DEFAULT 'database',
  times_answered INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX challenges_category_idx ON database_challenges(category);
CREATE INDEX challenges_module_idx ON database_challenges(module_id);

-- 2. Mode catalog (replaces MODES array in DatabaseSidebar.tsx)
CREATE TABLE database_modes (
  id VARCHAR(50) PRIMARY KEY,             -- "btree-index"
  name VARCHAR(100) NOT NULL,             -- "B-Tree Index"
  description TEXT NOT NULL,               -- Full description
  difficulty VARCHAR(20) NOT NULL,         -- "Intermediate"
  interview_tag VARCHAR(100),              -- "Asked at Google"
  module_id VARCHAR(50) NOT NULL DEFAULT 'database',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  avg_time_spent_sec INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX modes_module_idx ON database_modes(module_id);

-- 3. Educational content blocks (replaces hardcoded JSX in DatabaseProperties.tsx)
CREATE TABLE database_mode_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_id VARCHAR(50) NOT NULL REFERENCES database_modes(id),
  section VARCHAR(50) NOT NULL,            -- "how-it-works", "real-world", "interview-tip", etc.
  title VARCHAR(200),
  content JSONB NOT NULL,                  -- Structured: [{type: "paragraph", text: "..."}, {type: "code", lang: "sql", code: "..."}]
  sort_order INTEGER NOT NULL DEFAULT 0,
  locale VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX mode_content_mode_idx ON database_mode_content(mode_id, section);
CREATE UNIQUE INDEX mode_content_unique_idx ON database_mode_content(mode_id, section, sort_order, locale);

-- 4. Extended progress for database module (extends existing progress table)
CREATE TABLE database_user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date VARCHAR(10),            -- "2026-04-13"
  best_streak INTEGER NOT NULL DEFAULT 0,
  challenge_attempts JSONB DEFAULT '[]',   -- [{challengeId, completedAt, correct, timeMs}]
  mode_mastery JSONB DEFAULT '{}',         -- {"btree-index": 0.85, "normalization": 0.92}
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX db_progress_user_idx ON database_user_progress(user_id);
```

### 3.3 Data Seeding Strategy

```
Step 1: Create extraction scripts
  - src/db/seeds/extract-challenges.ts     → reads daily-challenges.ts, outputs JSON
  - src/db/seeds/extract-modes.ts          → reads MODES from DatabaseSidebar, outputs JSON
  - src/db/seeds/extract-content.ts        → parses DatabaseProperties.tsx JSX, outputs structured JSON
  - src/db/seeds/extract-er-templates.ts   → reads sample-er-diagrams.ts, outputs JSON

Step 2: Create seed runner
  - src/db/seeds/database-seed.ts          → reads JSON, inserts into DB via Drizzle

Step 3: Run migration + seed
  - pnpm drizzle-kit generate
  - pnpm drizzle-kit migrate
  - pnpm tsx src/db/seeds/database-seed.ts

Step 4: Verify data integrity
  - Compare DB content with original TypeScript source
  - Run existing tests against API-fetched data
```

---

## Phase 4: API Design

### API 1: Mode Catalog

```
ENDPOINT:   GET /api/database/modes
PURPOSE:    Fetch all modes for sidebar
AUTH:       None (public)
CACHE:      ISR 1 hour
RESPONSE:
{
  modes: [
    {
      id: "btree-index",
      name: "B-Tree Index",
      description: "Your database has 10 million rows...",
      difficulty: "Intermediate",
      interviewTag: "Asked at Google",
      sortOrder: 3
    },
    ...
  ]
}
MIGRATION FROM:
  // Before: static import
  const MODES = [ { id: "btree-index", ... }, ... ] satisfies ModeDef[];
  // After: fetch + SWR
  const { data } = useSWR("/api/database/modes", fetcher);
```

### API 2: Mode Content

```
ENDPOINT:   GET /api/database/modes/[modeId]/content
PURPOSE:    Fetch educational content for properties panel
AUTH:       None (public)
CACHE:      ISR 24 hours
RESPONSE:
{
  modeId: "normalization",
  sections: [
    {
      section: "how-it-works",
      title: "How It Works",
      content: [
        { type: "definition", term: "Attribute Closure", text: "Starting from a set of attributes..." },
        { type: "definition", term: "Candidate Keys", text: "The minimal set..." },
        { type: "definition", term: "Normal Forms", text: "1NF = atomic values..." }
      ]
    },
    {
      section: "real-world",
      title: "Real-World",
      content: [{ type: "paragraph", text: "Instagram's user table stores name once..." }]
    },
    {
      section: "interview-tip",
      title: "Interview Tip",
      content: [{ type: "paragraph", text: "When asked to design a schema, normalize to 3NF first..." }]
    },
    {
      section: "pseudocode",
      title: "Algorithm",
      content: [{ type: "code", lang: "pseudocode", code: "BTREE-INSERT(T, key):\n  ..." }]
    }
  ]
}
```

### API 3: Daily Challenge

```
ENDPOINT:   GET /api/database/challenges/daily
PURPOSE:    Get today's challenge question (without answer)
AUTH:       None (question is public)
CACHE:      ISR 24 hours (same question all day)
RESPONSE:
{
  challenge: {
    id: "norm-01",
    question: "What normal form allows partial dependencies?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    category: "normalization"
  },
  date: "2026-04-13"
}
NOTE: correctIndex and explanation are NOT returned — prevents cheating

ENDPOINT:   POST /api/database/challenges/submit
PURPOSE:    Submit answer, get correctness + explanation
AUTH:       Optional (anonymous can play, auth users get XP)
BODY:       { challengeId: "norm-01", selectedIndex: 0, timeMs: 4500 }
RESPONSE:
{
  correct: true,
  correctIndex: 0,
  explanation: "1NF only requires atomic values...",
  xpEarned: 10,
  streak: { current: 5, best: 12 }
}
```

### API 4: Progress Sync

```
ENDPOINT:   GET /api/database/progress
PURPOSE:    Fetch authenticated user's database module progress
AUTH:       Required (Clerk)
CACHE:      No cache (user-specific, mutable)
RESPONSE:
{
  totalXP: 450,
  streakDays: 5,
  bestStreak: 12,
  lastActiveDate: "2026-04-13",
  modeMastery: {
    "btree-index": 0.85,
    "normalization": 0.92,
    "hash-index": 0.60
  },
  recentAttempts: [
    { challengeId: "norm-01", correct: true, completedAt: "2026-04-13T10:30:00Z" }
  ]
}

ENDPOINT:   POST /api/database/progress/sync
PURPOSE:    Merge localStorage progress with server (offline-first strategy)
AUTH:       Required (Clerk)
BODY:
{
  totalXP: 450,
  streakDays: 5,
  lastActiveDate: "2026-04-13",
  attempts: [ ... ],
  modeMastery: { ... }
}
MERGE STRATEGY: Server wins on XP/streak (prevents manipulation), client attempts are appended
```

### API 5: ER Templates

```
ENDPOINT:   GET /api/database/templates
PURPOSE:    Fetch sample ER diagrams + community templates
AUTH:       None for public templates; auth for user's own
CACHE:      ISR 1 hour
QUERY:      ?category=er-diagram&authorId=me
RESPONSE:
{
  templates: [
    {
      id: "ecommerce-sample",
      name: "E-Commerce",
      description: "Users, Products, Orders, OrderItems, Reviews",
      entities: [...],
      relationships: [...],
      author: null,    // null = built-in
      isPublic: true
    },
    ...
  ]
}
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
METRIC              CURRENT                         AFTER MIGRATION
─────────────────────────────────────────────────────────────────────
Initial JS bundle   Includes 131KB of content data  Content lazy-loaded via API
                    (challenges, modes, content)     → ~131KB smaller bundle

Time to Interactive All content parsed on load       Only UI shell loads
                    (even modes user never visits)   → ~200ms faster TTI

Mode switching      All 20 modes' content in memory  Only active mode's content fetched
                    (~6.5KB per mode × 20 = 130KB)   → ~6.5KB per mode switch

Daily challenge     100 questions bundled (35KB)      1 question fetched (0.5KB)
                    All answers visible in source     Answer hidden until submission
```

### Feature Benefits (Enabled by Database)

```
FEATURE                          CURRENT STATE           AFTER MIGRATION
──────────────────────────────────────────────────────────────────────────
Cross-device progress            IMPOSSIBLE              Sync via API on login
Leaderboards                     IMPOSSIBLE              Query database_user_progress
Content editing without deploy   IMPOSSIBLE              Update DB rows, ISR rebuilds
Community ER templates           IMPOSSIBLE              Save/share via templates table
Challenge analytics              IMPOSSIBLE              Track times_answered/times_correct
A/B test explanations            IMPOSSIBLE              Serve different content per user
Full-text search                 IMPOSSIBLE              PostgreSQL tsvector on content
Anti-cheat for challenges        Answers in JS source    Answers server-side only
Content localization (i18n)      IMPOSSIBLE              locale column per content row
Mode usage analytics             IMPOSSIBLE              view_count + avg_time_spent_sec
```

### User Experience Benefits

```
- Progress never lost (survives browser clear, device switch)
- Daily challenge can't be cheated (answer not in source)
- Faster first load (smaller bundle)
- Personalized content possible (beginner vs advanced explanations)
- Share ER diagrams with a link
- See "most popular" modes (social proof)
```

---

## Phase 6: Migration Roadmap

### Step 1: Run Drizzle Migrations (Create Tables)

```
Effort: S (1-2 hours)
─────────────────────
1. Add new schema files:
   - src/db/schema/database-challenges.ts
   - src/db/schema/database-modes.ts
   - src/db/schema/database-mode-content.ts
   - src/db/schema/database-user-progress.ts

2. Update src/db/schema/index.ts barrel exports

3. Generate + run migrations:
   pnpm drizzle-kit generate
   pnpm drizzle-kit migrate

Prerequisite: DATABASE_URL must be set to a live Neon instance
```

### Step 2: Create Seed Scripts

```
Effort: M (1-2 days)
─────────────────────
1. src/db/seeds/database-challenges-seed.ts
   - Read DAILY_CHALLENGES from daily-challenges.ts
   - Transform to DB format
   - Insert 100 rows

2. src/db/seeds/database-modes-seed.ts
   - Read MODES array from DatabaseSidebar.tsx (parse or maintain a JSON version)
   - Insert 20 rows

3. src/db/seeds/database-content-seed.ts
   - THE HARD ONE: Parse JSX from DatabaseProperties.tsx into structured JSON
   - Approach: Manually create JSON representations of each section
   - ~20 mode × ~4 sections = ~80 content blocks to transform
   - Estimated: 4-6 hours of content structuring

4. src/db/seeds/database-er-templates-seed.ts
   - Read SAMPLE_ER_DIAGRAMS
   - Insert into existing templates table
   - 3 rows
```

### Step 3: Create API Routes

```
Effort: S per endpoint (2-3 days for all 5)
───────────────────────────────────────────
1. src/app/api/database/modes/route.ts                    (GET)
2. src/app/api/database/modes/[modeId]/content/route.ts   (GET)
3. src/app/api/database/challenges/daily/route.ts          (GET)
4. src/app/api/database/challenges/submit/route.ts         (POST)
5. src/app/api/database/progress/route.ts                  (GET)
6. src/app/api/database/progress/sync/route.ts             (POST)
7. src/app/api/database/templates/route.ts                 (GET)

Each route: ~50-100 lines with Drizzle query, auth check, ISR caching
```

### Step 4: Update Components to Use API

```
Effort: M (3-5 days)
────────────────────
1. DatabaseSidebar.tsx
   - Replace static MODES array with useSWR("/api/database/modes")
   - Add loading skeleton for mode list
   - Fallback to static MODES if offline (progressive enhancement)

2. DatabaseProperties.tsx
   - Replace hardcoded JSX with useSWR(`/api/database/modes/${mode}/content`)
   - Render from structured JSON instead of hardcoded JSX
   - Add loading state for content sections
   - Keep JSX rendering logic, just swap data source

3. Daily Challenge (in DatabaseSidebar.tsx)
   - Replace DAILY_CHALLENGES import with API fetch
   - Hide answer until server confirms submission
   - POST to submit endpoint, display explanation from response

4. Progress Sync (in useDatabaseModule.ts or new hook)
   - On auth, fetch server progress
   - Merge with localStorage (server wins on conflicts)
   - On progress change, debounced POST to sync endpoint
   - Offline: continue using localStorage, sync on reconnect

5. Sample ER Diagrams (in useDatabaseModule.ts)
   - Replace static import with API fetch
   - Add loading state to sample selector
```

### Step 5: Remove Hardcoded Data from lib/

```
Effort: S (1 day)
─────────────────
After API integration is verified:
1. Delete daily-challenges.ts (850 lines) — data now in DB
2. Delete sample-er-diagrams.ts (391 lines) — data now in templates table
3. Remove MODES array from DatabaseSidebar.tsx (120 lines) — data from API
4. Remove educational text from DatabaseProperties.tsx (~600 lines) — data from API
   (keep the rendering components, just remove inline content)
5. Remove SEO duplicate descriptions from database-meta.ts — fetch from modes API

Bundle reduction: ~131KB removed from client JS
```

### Timeline Summary

```
PHASE               EFFORT    TIMELINE     DEPENDENCIES
────────────────────────────────────────────────────────
1. DB Migrations     S         Day 1        DATABASE_URL configured
2. Seed Scripts      M         Days 2-3     Phase 1
3. API Routes        S×7       Days 4-6     Phase 1 + 2
4. Component Update  M         Days 7-11    Phase 3
5. Cleanup           S         Day 12       Phase 4 verified
────────────────────────────────────────────────────────
TOTAL                          ~2-3 weeks   (can be phased: challenges first)
```

---

## Phase 7: What NOT to Move

### KEEP IN FRONTEND (Explicit List)

```
KEEP — Algorithm Engines (4,946 lines):
  ✓ BTreeViz          (346 lines) — real-time B-Tree operations
  ✓ HashIndexViz      (403 lines) — real-time hash table operations
  ✓ LSMTreeViz        (583 lines) — real-time LSM-Tree pipeline
  ✓ MVCCViz           (422 lines) — real-time MVCC simulation
  ✓ JoinViz           (755 lines) — real-time join algorithm demos
  ✓ ARIESViz          (733 lines) — real-time ARIES recovery
  ✓ normalization.ts  (517 lines) — real-time FD computation
  ✓ query-plan.ts     (217 lines) — real-time SQL→plan
  ✓ schema-converter  (372 lines) — real-time ER→SQL/NoSQL
  ✓ er-to-sql.ts      (18 lines)  — thin wrapper
  WHY: All <10ms, pure computation, interactive, latency-sensitive

KEEP — Canvas Rendering (9,585 lines):
  ✓ All 18 canvas components (SVG rendering, animations, drag handlers)
  WHY: Real-time visualization, 60fps, tightly coupled to browser DOM

KEEP — State Management:
  ✓ useDatabaseModule.ts (3,570 lines) — orchestration hook
  ✓ UI store (panel states, theme, animation speed)
  ✓ Canvas store (undo/redo, viewport — too frequent for API)
  ✓ AI store (API key — security-sensitive, must not leave device)
  ✓ Notification store (device-specific)
  WHY: Real-time state, ephemeral, security-sensitive, or too frequent for network

KEEP — Types:
  ✓ types.ts (87 lines) — compile-time only, zero runtime cost
  ✓ All interfaces/types across files
  WHY: TypeScript types are erased at build time

KEEP — Test Files:
  ✓ All 8 test files (1,345 lines)
  WHY: Tests run in CI, not bundled in client
```

### MOVE TO BACKEND (Explicit List)

```
MOVE — Content Data (~4,500 lines → 0 in bundle):
  → daily-challenges.ts      (850 lines, 100 questions → database_challenges)
  → sample-er-diagrams.ts    (391 lines, 3 templates → templates table)
  → MODES array              (120 lines, 20 modes → database_modes)
  → Properties content        (~600 lines, educational text → database_mode_content)
  → SEO metadata duplicates   (~200 lines → derive from database_modes)
  WHY: Pure content, never changes at runtime, editable by non-devs

MOVE — User Data:
  → progress-store data       (XP, streaks, attempts → database_user_progress)
  → cross-module mastery      (13 module scores → progress table)
  WHY: Must persist across devices, enables leaderboards/analytics
```

### DO NOT MOVE (Common Mistakes to Avoid)

```
✗ Algorithm constants (bucket_count=4, memtable_capacity=4)
  — Tightly coupled to algorithm logic, not content
  
✗ Type maps (SQL_TYPE_MAP, MONGO_TYPE_MAP — 46 entries)
  — Small, static, used in hot path of schema conversion
  
✗ CSS classes / styling config (DIFFICULTY_STYLES)
  — UI concern, not data
  
✗ Animation configs (spring physics, motion presets)
  — Real-time rendering, cannot tolerate network latency
  
✗ Canvas step generation functions (getAtomicitySteps, getCPPartitionSteps, etc.)
  — These GENERATE steps from code logic, not just return static data
  — The data + rendering logic are interleaved — extracting data alone breaks the pattern
  — EXCEPTION: If we later add "edit step descriptions without deploy", move the text strings only
```

---

## Appendix: Quick Wins (Can Do Today)

If you want immediate impact before the full migration:

1. **Hide challenge answers** — Move `correctIndex` and `explanation` to a server action / API route. Even without a database, a simple API route that imports from the same file prevents client-side cheating. (Effort: S, 1 hour)

2. **Lazy-load daily-challenges.ts** — Use `React.lazy` + dynamic import so the 35KB isn't in the main bundle. (Effort: S, 30 minutes)

3. **Deduplicate mode descriptions** — The MODES array and SEO metadata have the same descriptions. Extract to a single source file that both import from. (Effort: S, 1 hour)
