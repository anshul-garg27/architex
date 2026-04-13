# LLD Module — Backend & Data Migration Analysis

> **Module:** Low-Level Design Studio (LLD)
> **Date:** 2026-04-13
> **Status:** Analysis only — no code changes
> **Scope:** `src/lib/lld/` + `src/components/modules/lld/` + relevant stores + `src/db/schema/`

---

## Executive Summary

The LLD module contains **1.25 MB of TypeScript across 31,102 lines** in 38 files. **84% of that (686 KB / 16,716 lines) is static content** — pattern descriptions, code samples, problem definitions, quiz questions — that never changes at runtime. Every user downloads all of it on first load, even to view a single pattern.

Moving content to the database and serving it through APIs would:
- **Cut initial bundle by ~686 KB** (only load what the user views)
- **Enable cross-device progress sync** (currently localStorage-only)
- **Allow content updates without code deploys**
- **Enable full-text search via PostgreSQL** (currently imports ALL content for substring matching)
- **Unlock analytics, A/B testing, and community features**

The DB infrastructure is already configured (Drizzle + Neon PostgreSQL) with 7 table schemas — but migrations have never been run and no code uses the database.

---

## Phase 1: Data Inventory

### 1.1 Static Content (Descriptions, Metadata, Code Samples)

Total: **6 files, 16,716 lines, 686 KB** — all exportable to DB.

| File | Lines | KB | Items | Content Type | Str KB | Non-Dev Editable? |
|------|------:|---:|------:|--------------|-------:|:-:|
| `src/lib/lld/patterns.ts` | 10,364 | 392 | 36 patterns + 50 finder entries + 12 comparisons + 25 prerequisites | Pattern catalog with 15+ fields each (description, analogy, UML, code TS+Python, tips, mistakes, relations) | ~291 | YES |
| `src/lib/lld/problems.ts` | 3,628 | 168 | 33 problems | Problem catalog with UML starters, hints, SEO data, requirements | ~79 | YES |
| `src/lib/lld/solid-demos.ts` | 1,565 | 60 | 5 demos + 25 quiz questions | SOLID principles with before/after UML + code (TS+Python) | ~39 | YES |
| `src/lib/lld/oop-demos.ts` | 672 | 25 | 2 demos | Composition vs Inheritance, Polymorphism with code samples | ~15 | YES |
| `src/lib/lld/sequence-diagram.ts` | 287 | 30 | 10 examples | Sequence diagrams with participants, messages, narrations | ~21 | YES |
| `src/lib/lld/state-machine.ts` | 200 | 11 | 6 examples | State machines with states, transitions, guards, actions | ~5 | YES |

**Key observations:**
- `patterns.ts` alone is **392 KB** — larger than many entire applications
- Code samples (TS + Python for each pattern) account for ~200 KB of string content
- None of this data changes at runtime
- A content writer with a form-based CMS could maintain all of it
- Content is NOT duplicated — single source of truth, consumed by many components

### 1.2 Hardcoded Content in Components

Total: **~692 lines of educational content embedded in UI components**.

| Component File | Lines | Hardcoded Content | Content Lines | Should Move? |
|---------------|------:|-------------------|-------------:|:--:|
| `panels/ScenarioChallenge.tsx` | 452 | 12 quiz scenarios with 4 options each, explanations, whyWrong | ~180 | YES |
| `PatternBehavioralSimulator.tsx` | 504 | 4 resilience pattern configs with 12 scenarios, params | ~113 | YES |
| `panels/PatternComparison.tsx` | 452 | 3 comparison scenarios + 8-row differences table + mnemonic | ~115 | YES |
| `panels/StudyPlan.tsx` | 507 | 5 SOLID topics + 10 problem topics (curriculum data) | ~80 | YES |
| `SequenceDiagramLatencyOverlay.tsx` | 423 | 2 latency scenarios with participants and messages | ~63 | YES |
| `panels/BidirectionalSyncPanel.tsx` | 545 | 2 seed code samples (TS + Python Observer) | ~52 | PARTIAL |
| `panels/SocialProof.tsx` | 139 | 25 popularity weights (should become real analytics) | ~38 | YES (replace) |
| `sidebar/LLDSidebar.tsx` | 766 | 2 sample code snippets (TS + Python) | ~51 | PARTIAL |
| `panels/DailyChallenge.tsx` | 371 | Hint generation logic (derives from pattern data) | ~5 | NO (logic) |
| `panels/PatternQuiz.tsx` | 429 | Quiz hint categories (3 lines), rest derives from patterns | ~7 | NO |
| `panels/SOLIDQuiz.tsx` | 327 | No hardcoded content (imports SOLID_QUIZ_QUESTIONS) | 0 | NO |
| `panels/Flashcards.tsx` | 473 | Category color map (8 entries), rest derives from patterns | ~10 | NO |
| `constants.ts` | 409 | Color maps, labels, dimension constants, GLASS tokens | ~180 | NO (config) |

### 1.3 Implementation Logic (Keep in Frontend)

Total: **8 files, 3,020 lines, 92 KB** — pure computation, stays in code.

| File | Lines | KB | Logic Type | Pure Function? | Needs Server? |
|------|------:|---:|------------|:-:|:-:|
| `codegen/code-to-diagram.ts` | 707 | 21 | TS/Python parser → UML | YES | NO |
| `class-diagram-model.ts` | 493 | 15 | Immutable CRUD for class diagrams | YES | NO |
| `codegen/diagram-to-typescript.ts` | 449 | 13 | UML → TypeScript codegen | YES | NO |
| `codegen/diagram-to-python.ts` | 408 | 13 | UML → Python codegen | YES | NO |
| `bidirectional-sync.ts` | 343 | 10 | Code↔diagram sync engine | YES | NO |
| `search.ts` | 179 | 5 | Cross-content substring search | YES | MOVE TO DB |
| `persistence.ts` | 166 | 5 | localStorage save/load | YES | REPLACE |
| `codegen/diagram-to-mermaid.ts` | 161 | 5 | UML → Mermaid codegen | YES | NO |

**Notes:**
- `search.ts` currently imports ALL content just for substring matching. With a DB, this becomes `SELECT * WHERE name ILIKE '%query%' OR description ILIKE '%query%'` — far more efficient.
- `persistence.ts` saves to localStorage only. Should be augmented with server-sync for cross-device persistence.
- All codegen and model functions are pure (input → output) and run <10ms — no benefit from server or Web Worker.

### 1.4 User-Generated Data

| Store/File | Data | Persisted? | Where? | Size | Should Move to Server? |
|-----------|------|:--:|--------|------|:--:|
| `stores/progress-store.ts` | ChallengeAttempt[], totalXP, streakDays, lastActiveDate | YES | localStorage (`architex-progress`) | ~5-50 KB | **YES** — cross-device sync |
| `lib/lld/persistence.ts` | sidebarMode, active*Ids, classes[], relationships[], solidView | YES | localStorage (`architex-lld-state`) | ~2-20 KB | **YES** — cross-device sync |
| `stores/ui-store.ts` | recentModules, animationSpeed, recentlyStudied | YES | localStorage (`architex-ui`) | ~1 KB | NO — device-specific prefs |
| `panels/DailyChallenge.tsx` | dateKey, hintsRevealed, guesses[], completed | YES | localStorage (`architex-daily-challenge`) | ~0.5 KB | **YES** — streak integrity |
| Component local state | Quiz scores, current question, flashcard index | NO | React state (in-memory) | ~0.1 KB | NO — ephemeral |

**Total localStorage usage:** ~10-70 KB per user. Not a storage concern, but the lack of server persistence means:
- Progress lost on browser data clear
- No cross-device continuity
- No analytics on user behavior
- No leaderboards or social features possible

### 1.5 Ephemeral User Data (Lost on Component Unmount)

These user interactions are NOT persisted anywhere — lost when the component unmounts or page refreshes:

| Component | Lost Data | Impact |
|-----------|-----------|--------|
| `PatternQuiz.tsx` | Quiz scores, per-question answers | User can't track improvement over time |
| `SOLIDQuiz.tsx` | Score, streak, best streak | No SOLID mastery tracking |
| `ScenarioChallenge.tsx` | Scenario quiz results | No pattern recognition tracking |
| `PatternComparison.tsx` | Comparison quiz score | No confusion-resolution tracking |
| `InterviewPractice.tsx` | Practice time, hints checked, score | No practice history |
| `StudyPlan.tsx` | Generated study plan | Must regenerate every session |
| `Flashcards.tsx` | Cards reviewed, order, progress | No spaced repetition possible |
| `PatternBehavioralSimulator.tsx` | Parameter tweaks, metrics, event log | No experiment history |
| `SequenceDiagramLatencyOverlay.tsx` | Latency overrides, what-if results | No comparison history |
| `useLLDModuleImpl.tsx` | Undo/redo stack (50-deep), practice state, sequence playback | Complex work lost |

### 1.6 Type Definitions & Infrastructure

| File | Lines | Nature |
|------|------:|--------|
| `types.ts` | 114 | Type-only — UML types, DesignPattern interface, SequenceMessage |
| `index.ts` | 144 | Barrel re-export — no data, no logic |
| `__tests__/*.test.ts` | 2,720 | 6 test files with 300+ tests — stays in repo |

---

## Phase 2: What Should Move to Backend

### 2.1 MOVE TO DATABASE (Neon PostgreSQL via Drizzle)

#### Candidate 1: Design Pattern Catalog

```
CANDIDATE:     36 design patterns with all metadata
CURRENTLY:     src/lib/lld/patterns.ts (10,364 lines, 392 KB)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs to be searchable/filterable
  [x] Performance: too large for bundle (392 KB)
  [x] Needs versioning/history (content evolves)
  [ ] Users can save/share custom versions (future)
DB TABLE:      NEW — lld_patterns
MIGRATION EFFORT: L (largest single data file)
```

#### Candidate 2: LLD Problem Catalog

```
CANDIDATE:     33 LLD interview problems
CURRENTLY:     src/lib/lld/problems.ts (3,628 lines, 168 KB)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Needs to be searchable/filterable
  [x] Performance: too large for bundle (168 KB)
  [x] SEO data already suggests per-problem pages
DB TABLE:      NEW — lld_problems
MIGRATION EFFORT: M
```

#### Candidate 3: SOLID Demos + Quiz Questions

```
CANDIDATE:     5 SOLID demos + 25 quiz questions
CURRENTLY:     src/lib/lld/solid-demos.ts (1,565 lines, 60 KB)
WHY MOVE:
  [x] Content writers can update without code deploy
  [x] Quiz questions should be expandable without deploys
  [x] Performance: 60 KB of content data
DB TABLE:      NEW — lld_demos + lld_quiz_questions
MIGRATION EFFORT: S
```

#### Candidate 4: OOP Demos

```
CANDIDATE:     2 OOP demos (Composition vs Inheritance, Polymorphism)
CURRENTLY:     src/lib/lld/oop-demos.ts (672 lines, 25 KB)
WHY MOVE:
  [x] Same structure as SOLID demos — use same table
DB TABLE:      lld_demos (shared with SOLID)
MIGRATION EFFORT: S
```

#### Candidate 5: Sequence Diagram Examples

```
CANDIDATE:     10 sequence diagram examples with narrations
CURRENTLY:     src/lib/lld/sequence-diagram.ts (287 lines, 30 KB)
WHY MOVE:
  [x] Content with narrations (pedagogical text)
  [x] Could add community-contributed examples
DB TABLE:      NEW — lld_sequence_examples
MIGRATION EFFORT: S
```

#### Candidate 6: State Machine Examples

```
CANDIDATE:     6 state machine examples
CURRENTLY:     src/lib/lld/state-machine.ts (200 lines, 11 KB)
WHY MOVE:
  [x] Content data, same rationale as sequence diagrams
DB TABLE:      NEW — lld_state_machine_examples
MIGRATION EFFORT: S
```

#### Candidate 7: Scenario Challenge Data

```
CANDIDATE:     12 quiz scenarios (embedded in component)
CURRENTLY:     src/components/modules/lld/panels/ScenarioChallenge.tsx lines 33-200
WHY MOVE:
  [x] Quiz content should be expandable without deploys
  [x] Content mixed with UI code — bad separation
DB TABLE:      lld_quiz_questions (shared, with type discriminator)
MIGRATION EFFORT: S
```

#### Candidate 8: User Progress & Streaks

```
CANDIDATE:     Challenge attempts, XP, streaks, daily challenge state
CURRENTLY:     stores/progress-store.ts (localStorage) + DailyChallenge localStorage
WHY MOVE:
  [x] Needs to persist across devices
  [x] Needs to be shareable (leaderboards)
  [x] Needs access control (user-specific)
  [x] Streak integrity (localStorage easily manipulated)
DB TABLE:      EXISTING — progress (needs additional columns)
MIGRATION EFFORT: M
```

#### Candidate 9: Pattern Finder & Comparison Data

```
CANDIDATE:     50 finder entries, 12 comparisons, 25 prerequisites
CURRENTLY:     src/lib/lld/patterns.ts (bottom ~500 lines)
WHY MOVE:
  [x] Relationship data ideal for DB (joins, graph queries)
  [x] Community could contribute new scenarios
DB TABLE:      NEW — lld_pattern_relations
MIGRATION EFFORT: S
```

### 2.2 MOVE TO API ROUTE (Lazy Load via API)

```
ENDPOINT:      GET /api/lld/patterns
PURPOSE:       Fetch pattern catalog for sidebar/selector (lightweight)
AUTH:          None (public)
CACHE:         ISR 1 hour
RESPONSE:      { patterns: [{ id, name, category, difficulty, analogy }] }  (~3 KB)
MIGRATION FROM: import { DESIGN_PATTERNS } from "@/lib/lld" → fetch catalog

ENDPOINT:      GET /api/lld/patterns/[id]
PURPOSE:       Fetch full pattern detail (on selection)
AUTH:          None (public)
CACHE:         ISR 24 hours (content rarely changes)
RESPONSE:      Full DesignPattern object (~10 KB per pattern)
MIGRATION FROM: Direct array access → API fetch on demand

ENDPOINT:      GET /api/lld/problems
PURPOSE:       Fetch problem catalog for sidebar
AUTH:          None (public)
CACHE:         ISR 1 hour
RESPONSE:      { problems: [{ id, name, difficulty, category, slug }] }  (~2 KB)

ENDPOINT:      GET /api/lld/problems/[id]
PURPOSE:       Fetch full problem detail (on selection)
AUTH:          None (public)
CACHE:         ISR 24 hours
RESPONSE:      Full LLDProblem object (~5 KB per problem)

ENDPOINT:      GET /api/lld/demos
PURPOSE:       Fetch SOLID + OOP demos catalog
AUTH:          None (public)
CACHE:         ISR 1 hour
RESPONSE:      { demos: [{ id, name, principle, type }] }

ENDPOINT:      GET /api/lld/demos/[id]
PURPOSE:       Fetch full demo detail
AUTH:          None (public)
CACHE:         ISR 24 hours

ENDPOINT:      GET /api/lld/sequences
PURPOSE:       Fetch sequence diagram catalog
AUTH:          None (public)
CACHE:         ISR 1 hour

ENDPOINT:      GET /api/lld/sequences/[id]
PURPOSE:       Fetch full sequence diagram
AUTH:          None (public)
CACHE:         ISR 24 hours

ENDPOINT:      GET /api/lld/state-machines
PURPOSE:       Fetch state machine catalog
AUTH:          None (public)
CACHE:         ISR 1 hour

ENDPOINT:      GET /api/lld/state-machines/[id]
PURPOSE:       Fetch full state machine
AUTH:          None (public)
CACHE:         ISR 24 hours

ENDPOINT:      GET /api/lld/quiz/scenario
PURPOSE:       Fetch N random scenario quiz questions
AUTH:          None (public)
CACHE:         No cache (randomized)
RESPONSE:      { questions: Scenario[] }

ENDPOINT:      GET /api/lld/quiz/solid
PURPOSE:       Fetch N random SOLID quiz questions
AUTH:          None (public)
CACHE:         No cache (randomized)

ENDPOINT:      GET /api/lld/search?q=factory
PURPOSE:       Full-text search across all LLD content
AUTH:          None (public)
CACHE:         stale-while-revalidate 5 min
RESPONSE:      { results: [{ id, type, name, matchSnippet }] }
MIGRATION FROM: searchLLDContent() (currently imports ALL data)

ENDPOINT:      GET /api/lld/progress
PURPOSE:       Fetch user's LLD progress (patterns viewed, quiz scores, streak)
AUTH:          Required (Clerk)
CACHE:         No cache (user-specific)

ENDPOINT:      POST /api/lld/progress
PURPOSE:       Save progress update (pattern viewed, quiz completed, streak)
AUTH:          Required (Clerk)
BODY:          { conceptId: "singleton", type: "pattern-view" | "quiz-complete" | "problem-complete", score?: number }

ENDPOINT:      GET /api/lld/daily-challenge
PURPOSE:       Get today's daily challenge pattern
AUTH:          None (public, deterministic by date)
CACHE:         ISR 24 hours (same for all users per day)
```

**Total: 16 API endpoints** (10 public catalog + 2 quiz + 1 search + 2 progress + 1 daily)

### 2.3 KEEP IN FRONTEND (No Change Needed)

```
CANDIDATE:     Codegen logic (diagram→TS, diagram→Python, diagram→Mermaid)
WHY KEEP:
  [x] Pure computation (runs <10ms in browser)
  [x] Real-time/interactive (user edits diagram, sees code update instantly)
  [x] Privacy (user's diagram data shouldn't leave device by default)
FILES:         codegen/diagram-to-typescript.ts, diagram-to-python.ts, diagram-to-mermaid.ts

CANDIDATE:     Code-to-Diagram parser
WHY KEEP:
  [x] Pure computation (regex parsing, <50ms)
  [x] Real-time feedback needed (paste code, see diagram)
FILE:          codegen/code-to-diagram.ts

CANDIDATE:     Class Diagram CRUD model
WHY KEEP:
  [x] Pure immutable transforms
  [x] Real-time editing (instant feedback on add/remove)
FILE:          class-diagram-model.ts

CANDIDATE:     Bidirectional sync engine
WHY KEEP:
  [x] Stateful computation tracking diffs
  [x] Real-time (tracks code↔diagram changes)
FILE:          bidirectional-sync.ts

CANDIDATE:     Canvas rendering (SVG, zoom/pan)
WHY KEEP:
  [x] Real-time UI rendering
  [x] Too latency-sensitive for API
FILES:         canvas/LLDCanvas.tsx, SequenceDiagramCanvas.tsx, StateMachineCanvas.tsx

CANDIDATE:     UI state (panel open/closed, selected tab, animation speed)
WHY KEEP:
  [x] Device-specific preferences
  [x] Only used locally
STORE:         stores/ui-store.ts

CANDIDATE:     Quiz generation logic (shuffling, question selection)
WHY KEEP:
  [x] Small logic (<30 lines), randomization runs locally
  [x] No benefit from server-side shuffling
FILES:         panels/PatternQuiz.tsx, panels/SOLIDQuiz.tsx

CANDIDATE:     Flashcard generation (derived from pattern data)
WHY KEEP:
  [x] Pure transform of pattern data → flashcard format
  [x] Small logic, runs locally
FILE:          panels/Flashcards.tsx

CANDIDATE:     Study plan generation algorithm
WHY KEEP:
  [x] Pure computation based on interview date
  [x] Uses pattern data (which will be fetched from API)
FILE:          panels/StudyPlan.tsx
```

### 2.4 MOVE TO WEB WORKER (Off Main Thread)

None currently needed. All LLD computation runs <50ms. If the following features are added in the future, consider Web Workers:

- Pattern X-Ray (paste large codebase, detect patterns) — if input >100KB
- Video export via MediaRecorder — encoding is CPU-intensive
- Animated pattern construction walkthrough — if step computation is heavy

---

## Phase 3: Database Schema Recommendations

### 3.1 Existing Schema Tables

| Table | File | Columns | Migrated? | Used by Code? | LLD Relevance |
|-------|------|---------|:-:|:-:|---|
| `users` | users.ts | id, clerkId, email, name, tier | NO | NO | Auth for progress |
| `diagrams` | diagrams.ts | id, userId, title, slug, data(JSONB), isPublic, forkCount, upvoteCount | NO | NO | Could store user UML diagrams |
| `progress` | progress.ts | id, userId, moduleId, conceptId, score | NO | NO | **Directly usable** for LLD progress |
| `templates` | templates.ts | id, name, category, data(JSONB), isPublic, authorId | NO | NO | Could store pattern templates |
| `simulationRuns` | simulations.ts | id, diagramId, userId, config, results | NO | NO | Not LLD-relevant |
| `gallerySubmissions` | gallery.ts | id, diagramId, title, upvotes, authorId | NO | NO | Could host shared UML designs |
| `galleryUpvotes` | gallery.ts | id, submissionId, userId | NO | NO | Social features |
| `aiUsage` | ai-usage.ts | id, userId, model, tokens, cost, purpose | NO | NO | AI hint tracking |

**Tables actually used by code (3 of 8):** `users` (via auth.ts), `diagrams` (via /api/diagrams), `simulation_runs` (via /api/simulations).
**Tables defined but completely unused (5 of 8):** `progress`, `templates`, `gallery_submissions`, `gallery_upvotes`, `ai_usage`.

**Migration SQL (0001_custom_constraints.sql) references tables/columns that don't exist yet:**
- `comments`, `challenge_attempts`, `challenges`, `collab_sessions` — tables not in schema
- `mastery_score`, `stability`, `difficulty` — columns not on `progress` table
- `xp`, `streak_current`, `streak_longest` — columns not on `users` table
- `view_count`, `comment_count`, `visibility` — columns not on `diagrams` table
- `is_published`, `sort_order` — columns not on `templates` table

This indicates the DB schema was designed with a grander vision. The migration SQL needs to be reconciled with the actual Drizzle schema before running.

### 3.2 New Tables Needed

```sql
-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_patterns — Design pattern catalog
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_patterns (
  id TEXT PRIMARY KEY,                    -- "singleton", "observer", etc.
  name TEXT NOT NULL,                     -- "Singleton"
  category TEXT NOT NULL,                 -- "creational" | "structural" | "behavioral" | ...
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  description TEXT NOT NULL,              -- Hook + explanation
  analogy TEXT NOT NULL,                  -- Real-world analogy
  tradeoffs TEXT NOT NULL,                -- "You gain: X. You pay: Y."
  summary JSONB NOT NULL,                 -- ["bullet1", "bullet2", "bullet3"]
  you_already_use_this JSONB NOT NULL,    -- ["React Context", "Node.js require()"]
  prediction_prompts JSONB,              -- [{ question, answer }]
  classes JSONB NOT NULL,                 -- UMLClass[] with positions
  relationships JSONB NOT NULL,           -- UMLRelationship[]
  code_typescript TEXT NOT NULL,           -- Full TS implementation
  code_python TEXT NOT NULL,              -- Full Python implementation
  real_world_examples JSONB NOT NULL,     -- string[]
  when_to_use JSONB NOT NULL,             -- string[]
  when_not_to_use JSONB NOT NULL,         -- string[]
  interview_tips JSONB,                   -- string[]
  common_mistakes JSONB,                  -- string[]
  confused_with JSONB,                    -- [{ patternId, difference }]
  related_patterns JSONB,                 -- [{ patternId, relationship }]
  code_variants JSONB,                    -- { variantName: { typescript, python } }
  sort_order SMALLINT DEFAULT 0,          -- Manual ordering within category
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lld_patterns_category_idx ON lld_patterns(category);
CREATE INDEX lld_patterns_difficulty_idx ON lld_patterns(difficulty);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_problems — LLD interview problems
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_problems (
  id TEXT PRIMARY KEY,                    -- "parking-lot"
  name TEXT NOT NULL,                     -- "Design a Parking Lot"
  slug TEXT NOT NULL UNIQUE,              -- "parking-lot" (for SEO URLs)
  difficulty TEXT NOT NULL,               -- "easy" | "medium" | "hard"
  seo_difficulty TEXT NOT NULL,           -- "Beginner" | "Intermediate" | "Advanced"
  category TEXT NOT NULL,                 -- "object-modeling" | "state-management" | ...
  description TEXT NOT NULL,              -- Real-world hook + explanation
  requirements JSONB NOT NULL,            -- string[]
  starter_classes JSONB NOT NULL,         -- UMLClass[] with positions
  starter_relationships JSONB NOT NULL,   -- UMLRelationship[]
  hints JSONB NOT NULL,                   -- string[] (progressive hints)
  key_patterns JSONB NOT NULL,            -- string[] (pattern IDs)
  interview_frequency TEXT NOT NULL,      -- "very-high" | "high" | "medium" | "low"
  class_count SMALLINT NOT NULL,
  related_problems JSONB,                 -- string[] (problem IDs)
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lld_problems_difficulty_idx ON lld_problems(difficulty);
CREATE INDEX lld_problems_category_idx ON lld_problems(category);
CREATE UNIQUE INDEX lld_problems_slug_idx ON lld_problems(slug);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_demos — SOLID + OOP principle demos
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_demos (
  id TEXT PRIMARY KEY,                    -- "srp", "composition-vs-inheritance"
  name TEXT NOT NULL,                     -- "Single Responsibility Principle"
  type TEXT NOT NULL,                     -- "solid" | "oop"
  principle TEXT NOT NULL,                -- "SRP" | "OCP" | "composition" | ...
  description TEXT NOT NULL,
  analogy TEXT NOT NULL,
  summary TEXT,
  before_classes JSONB NOT NULL,          -- UMLClass[]
  before_relationships JSONB NOT NULL,    -- UMLRelationship[]
  after_classes JSONB NOT NULL,           -- UMLClass[]
  after_relationships JSONB NOT NULL,     -- UMLRelationship[]
  before_code_typescript TEXT NOT NULL,
  before_code_python TEXT NOT NULL,
  after_code_typescript TEXT NOT NULL,
  after_code_python TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lld_demos_type_idx ON lld_demos(type);
CREATE INDEX lld_demos_principle_idx ON lld_demos(principle);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_quiz_questions — All quiz types in one table
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_quiz_questions (
  id TEXT PRIMARY KEY,                    -- "s-payments", "solid-srp-1"
  type TEXT NOT NULL,                     -- "scenario" | "solid-violation" | "pattern-finder"
  question TEXT NOT NULL,                 -- Question text or code snippet
  context TEXT,                           -- Additional context
  language TEXT,                          -- "typescript" | "python" (for code snippets)
  options JSONB NOT NULL,                 -- [{ label, whyWrong }] or string[]
  correct_answer TEXT NOT NULL,           -- Correct option identifier
  explanation TEXT NOT NULL,
  hint TEXT,
  difficulty SMALLINT DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  tags JSONB,                             -- ["strategy", "behavioral"]
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lld_quiz_questions_type_idx ON lld_quiz_questions(type);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_sequence_examples — Sequence diagram content
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_sequence_examples (
  id TEXT PRIMARY KEY,                    -- "http-request-lifecycle"
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  participants JSONB NOT NULL,            -- SequenceParticipant[]
  messages JSONB NOT NULL,                -- SequenceMessage[] (with narrations)
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_state_machine_examples — State machine content
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_state_machine_examples (
  id TEXT PRIMARY KEY,                    -- "order-lifecycle"
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  states JSONB NOT NULL,                  -- StateNode[]
  transitions JSONB NOT NULL,             -- StateTransition[]
  initial_state TEXT NOT NULL,
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════
-- TABLE: lld_pattern_relations — Finder, comparisons, prerequisites
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE lld_pattern_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                     -- "finder" | "comparison" | "prerequisite"
  source_pattern_id TEXT REFERENCES lld_patterns(id),
  target_pattern_id TEXT REFERENCES lld_patterns(id),
  data JSONB NOT NULL,                    -- Type-specific payload
  sort_order SMALLINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX lld_pattern_relations_type_idx ON lld_pattern_relations(type);
CREATE INDEX lld_pattern_relations_source_idx ON lld_pattern_relations(source_pattern_id);

-- ═══════════════════════════════════════════════════════════════
-- Full-text search index for all LLD content
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX lld_patterns_search_idx ON lld_patterns
  USING GIN (to_tsvector('english', name || ' ' || description || ' ' || analogy));

CREATE INDEX lld_problems_search_idx ON lld_problems
  USING GIN (to_tsvector('english', name || ' ' || description));
```

### 3.3 Data Seeding Strategy

```
Step 1: Reconcile migration SQL (0001_custom_constraints.sql) with actual Drizzle schema
        - Add missing columns to users, diagrams, templates, progress schemas
        - OR remove references to non-existent tables from migration SQL
        Effort: M

Step 2: Add new LLD table schemas to src/db/schema/
        - lld-patterns.ts, lld-problems.ts, lld-demos.ts,
          lld-quiz-questions.ts, lld-sequences.ts, lld-state-machines.ts,
          lld-pattern-relations.ts
        - Add to schema/index.ts barrel + relations.ts
        Effort: M

Step 3: Generate and run migrations
        - pnpm drizzle-kit generate
        - pnpm drizzle-kit migrate (against Neon)
        Effort: S

Step 4: Create seed scripts
        - src/db/seeds/lld-patterns.ts  (extract from patterns.ts → DB inserts)
        - src/db/seeds/lld-problems.ts  (extract from problems.ts → DB inserts)
        - src/db/seeds/lld-demos.ts     (extract from solid-demos.ts + oop-demos.ts)
        - src/db/seeds/lld-quiz.ts      (extract from solid-demos.ts quiz + ScenarioChallenge)
        - src/db/seeds/lld-sequences.ts (extract from sequence-diagram.ts)
        - src/db/seeds/lld-state-machines.ts (extract from state-machine.ts)
        - src/db/seeds/lld-relations.ts (extract finder/comparison/prereq from patterns.ts)
        Effort: M (mostly mechanical transformation)

Step 5: Run seed scripts
        - pnpm tsx src/db/seeds/lld-patterns.ts (etc.)
        Effort: S
```

---

## Phase 4: API Design

### Content Catalog APIs (Public, Cached)

| # | Endpoint | Method | Auth | Cache | Response Size | Replaces |
|---|----------|--------|------|-------|--------------|---------|
| 1 | `/api/lld/patterns` | GET | None | ISR 1h | ~3 KB (36 items, lightweight) | `DESIGN_PATTERNS.map(p => ({id, name, category, difficulty}))` |
| 2 | `/api/lld/patterns/[id]` | GET | None | ISR 24h | ~10 KB (full pattern) | `getPatternById(id)` |
| 3 | `/api/lld/problems` | GET | None | ISR 1h | ~2 KB (33 items, lightweight) | `LLD_PROBLEMS.map(...)` |
| 4 | `/api/lld/problems/[id]` | GET | None | ISR 24h | ~5 KB (full problem) | `getProblemById(id)` |
| 5 | `/api/lld/demos` | GET | None | ISR 1h | ~1 KB (7 items) | `SOLID_DEMOS + OOP_DEMOS` |
| 6 | `/api/lld/demos/[id]` | GET | None | ISR 24h | ~8 KB (full demo) | `getSOLIDDemoById(id)` |
| 7 | `/api/lld/sequences` | GET | None | ISR 1h | ~0.5 KB (10 items) | `SEQUENCE_EXAMPLES.map(...)` |
| 8 | `/api/lld/sequences/[id]` | GET | None | ISR 24h | ~3 KB (full sequence) | `getSequenceExampleById(id)` |
| 9 | `/api/lld/state-machines` | GET | None | ISR 1h | ~0.3 KB (6 items) | `STATE_MACHINE_EXAMPLES.map(...)` |
| 10 | `/api/lld/state-machines/[id]` | GET | None | ISR 24h | ~2 KB (full state machine) | `getStateMachineExampleById(id)` |

### Quiz & Search APIs (Public)

| # | Endpoint | Method | Auth | Cache | Notes |
|---|----------|--------|------|-------|-------|
| 11 | `/api/lld/quiz?type=scenario&count=12` | GET | None | None (random) | Returns N random quiz questions by type |
| 12 | `/api/lld/quiz?type=solid&count=15` | GET | None | None (random) | |
| 13 | `/api/lld/search?q=factory` | GET | None | SWR 5m | PostgreSQL full-text search replaces in-memory search |
| 14 | `/api/lld/daily-challenge` | GET | None | ISR 24h | Deterministic daily pattern (same for all users) |

### User Progress APIs (Authenticated)

| # | Endpoint | Method | Auth | Body/Query | Notes |
|---|----------|--------|------|------------|-------|
| 15 | `/api/lld/progress` | GET | Clerk | `?moduleId=lld` | Fetch user's progress, streak, XP |
| 16 | `/api/lld/progress` | POST | Clerk | `{ conceptId, type, score? }` | Save progress event |

### Response Shapes

```typescript
// GET /api/lld/patterns — Catalog (lightweight)
interface PatternCatalogResponse {
  patterns: {
    id: string;
    name: string;
    category: PatternCategory;
    difficulty: 1 | 2 | 3 | 4 | 5;
    analogy: string;  // First sentence only, for preview
  }[];
}

// GET /api/lld/patterns/[id] — Full detail
interface PatternDetailResponse {
  pattern: DesignPattern;  // Full existing type
}

// GET /api/lld/search?q=factory
interface SearchResponse {
  results: {
    id: string;
    type: "pattern" | "problem" | "solid" | "sequence" | "state-machine";
    name: string;
    matchSnippet: string;
    relevanceScore: number;
  }[];
}

// POST /api/lld/progress
interface ProgressUpdateRequest {
  conceptId: string;        // "singleton", "parking-lot", "srp"
  type: "pattern-view" | "quiz-complete" | "problem-attempt" | "daily-challenge";
  score?: number;           // 0-100
  timeSpentSeconds?: number;
  metadata?: Record<string, unknown>;
}
```

---

## Phase 5: Benefits Analysis

### Performance Benefits

```
METRIC              CURRENT (all frontend)           AFTER (API + lazy load)
─────────────────── ──────────────────────────────── ──────────────────────────────
Initial JS bundle   ~1.25 MB for LLD module          ~150 KB (UI only)
                    (ALL content downloaded)          Content loaded on demand

First paint         Blocked on 392 KB patterns.ts    Loads instantly — 3 KB catalog
                    + 168 KB problems.ts parsing      fetched async, rest on demand

Pattern view        Already in memory (no latency)   ~10 KB fetch per pattern (~50ms)
                    BUT: 686 KB wasted if user        Only loads what user clicks
                    only views 1 pattern

Search              Imports ALL 5 content arrays      PostgreSQL full-text search
                    (~686 KB in memory at search       ~20ms DB query, no client memory
                    time) for substring matching

Memory usage        ~15 MB heap for all parsed        ~2 MB (UI + one pattern at a time)
                    pattern/problem objects

Mobile perf         392 KB parse blocks main thread   Near-zero parse time — JSON fetch
                    for 200-400ms on mid-range        is 10x faster to parse than JS
```

### Feature Benefits

```
ENABLED BY DATABASE:
  ✓ Cross-device progress      — Login on phone, continue on laptop
  ✓ Leaderboards/social        — Compare scores, streaks with friends
  ✓ Content CMS                — Non-dev content writers can update patterns
  ✓ Full-text search           — PostgreSQL GIN index, ranking, stemming
  ✓ Analytics                  — Which patterns are most viewed/completed?
  ✓ A/B testing content        — Test different descriptions for engagement
  ✓ Versioning                 — Track content changes over time (updated_at)
  ✓ Localization               — Same schema, different language rows
  ✓ Community content          — Users submit patterns/problems for review
  ✓ Difficulty adjustment      — Personalize quiz difficulty based on user's history
  ✓ Admin panel                — CRUD patterns/problems without code deploys
  ✓ SEO                        — Server-render pattern pages with DB content + ISR

ENABLED BY API LAYER:
  ✓ Rate limiting              — Protect content endpoints
  ✓ Edge caching               — CDN caches pattern pages at edge (Vercel ISR)
  ✓ Monitoring                 — Track API response times, error rates
  ✓ Mobile API client          — Future React Native app uses same APIs
  ✓ Embed API                  — Third-party sites embed patterns via API
```

### User Experience Benefits

```
  ✓ Faster first load          — 686 KB less JS to download and parse
  ✓ Faster module switching    — No giant import tree to resolve
  ✓ Progress persists          — Never lose your streak or scores
  ✓ Works offline (with SW)    — Service Worker caches frequently used patterns
  ✓ Shareable deep links       — /patterns/observer loads from DB, not client-side routing
  ✓ Search actually works      — Full-text with relevance ranking, not substring
  ✓ Always up-to-date content  — Server returns latest, no deploy needed
```

---

## Phase 6: Migration Roadmap

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Reconcile DB Schema + Run Migrations           [S-M]  │
│                                                                 │
│  - Fix 0001_custom_constraints.sql vs actual Drizzle schema    │
│  - Add LLD-specific tables (7 new tables)                      │
│  - Run drizzle-kit generate + migrate against Neon             │
│  - Verify tables exist in Neon dashboard                       │
│                                                                 │
│  Files: src/db/schema/lld-*.ts, drizzle.config.ts              │
│  Effort: M (reconciliation is the hard part)                   │
│  Risk: LOW (additive, no existing data to lose)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Create Seed Scripts                             [M]   │
│                                                                 │
│  - One script per content type (7 scripts)                     │
│  - Read from src/lib/lld/*.ts, transform to DB rows            │
│  - Insert with upsert (idempotent — safe to re-run)           │
│  - Verify row counts match expected (36 patterns, 33 probs...) │
│                                                                 │
│  Files: src/db/seeds/lld-*.ts                                  │
│  Effort: M (mechanical but must preserve all 15+ fields)       │
│  Risk: LOW (can verify with content-validation tests)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Create API Routes                               [M]   │
│                                                                 │
│  - 16 endpoints total (see Phase 4)                            │
│  - Start with read-only catalog endpoints (no auth needed)     │
│  - Add search endpoint with PostgreSQL full-text               │
│  - Add progress endpoints with Clerk auth                      │
│  - Cache headers for ISR/SWR                                   │
│                                                                 │
│  Files: src/app/api/lld/[...routes]                            │
│  Effort: M (straightforward Drizzle queries)                   │
│  Risk: LOW (read-only initially)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Update Components to Use API                    [L]   │
│                                                                 │
│  - Replace static imports with API fetch (SWR or React Query)  │
│  - Add loading states (skeleton screens)                       │
│  - Add error states (retry buttons)                            │
│  - Keep types.ts in frontend (type definitions only)           │
│  - Update search.ts to call /api/lld/search                   │
│  - Update persistence.ts to sync with /api/lld/progress       │
│                                                                 │
│  Affected files: ~15 components + 2 utility files              │
│  Effort: L (most impactful step — touches UI components)       │
│  Risk: MEDIUM (must not break existing functionality)          │
│                                                                 │
│  Strategy: Feature flag — keep both paths, switch per-feature  │
│  Rollback: Revert to static imports if API fails               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: Remove Hardcoded Data from Frontend             [M]   │
│                                                                 │
│  - Delete content from patterns.ts (keep type exports)         │
│  - Delete content from problems.ts (keep type exports)         │
│  - Delete content from solid-demos.ts, oop-demos.ts            │
│  - Delete content from sequence-diagram.ts, state-machine.ts   │
│  - Extract ScenarioChallenge inline data                       │
│  - Update index.ts barrel exports                              │
│                                                                 │
│  Lines removed: ~16,700                                        │
│  Bundle reduction: ~686 KB                                     │
│  Effort: M (must verify all consumers migrated first)          │
│  Risk: MEDIUM (must not break any remaining static imports)    │
│                                                                 │
│  DO NOT DO THIS UNTIL STEP 4 IS FULLY VERIFIED                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6 (OPTIONAL): Progress Server Sync                 [L]   │
│                                                                 │
│  - Dual-write: save to both localStorage + server              │
│  - On login: merge server state with local state               │
│  - Conflict resolution: server wins for scores, local wins for │
│    UI preferences                                              │
│  - Requires Clerk auth integration                             │
│                                                                 │
│  Effort: L (auth + conflict resolution is complex)             │
│  Risk: MEDIUM (merge conflicts, offline handling)              │
└─────────────────────────────────────────────────────────────────┘
```

### Effort Summary

| Step | Effort | New Files | Modified Files | Risk |
|------|--------|-----------|---------------|------|
| 1. Schema + Migrations | M | 7 schema files | migration SQL | LOW |
| 2. Seed Scripts | M | 7 seed scripts | none | LOW |
| 3. API Routes | M | 16 route files | none | LOW |
| 4. Component Migration | L | 0 | ~15 components | MEDIUM |
| 5. Remove Hardcoded Data | M | 0 | 6 data files | MEDIUM |
| 6. Progress Sync | L | 2 | ~5 components | MEDIUM |
| **Total** | **XL** | **~32 new files** | **~26 modified files** | |

**Estimated total: XL task (multiple sessions)**

---

## Phase 7: What NOT to Move

### KEEP IN FRONTEND

```
✅ Algorithm execution logic
   - class-diagram-model.ts (CRUD operations — immutable, pure, <1ms)
   - codegen/*.ts (TS/Python/Mermaid generation — pure, <10ms)
   - code-to-diagram.ts (parser — pure, regex-based, <50ms)
   - bidirectional-sync.ts (SyncManager — stateful but client-local)

✅ Visualization rendering
   - canvas/LLDCanvas.tsx (SVG class boxes, edges, zoom/pan)
   - canvas/SequenceDiagramCanvas.tsx (SVG lifelines, messages, playback)
   - canvas/StateMachineCanvas.tsx (SVG states, transitions, simulation)
   - All SVG glow filters, animations, hover effects

✅ UI state
   - stores/ui-store.ts (panel layout, animation speed, theme — device-specific)
   - Component local state (current quiz question, flashcard index — ephemeral)

✅ Type definitions
   - types.ts (UMLClass, DesignPattern, etc. — used by both frontend and API)

✅ Constants & config
   - constants.ts (GLASS_* tokens, color maps, dimension constants — UI-specific)

✅ Test files
   - __tests__/*.test.ts (development tooling, not shipped to users)
```

### MOVE TO BACKEND

```
→ Pattern catalog (36 patterns, 392 KB) → lld_patterns table
→ Problem catalog (33 problems, 168 KB) → lld_problems table
→ SOLID demos (5 demos, 60 KB) → lld_demos table
→ OOP demos (2 demos, 25 KB) → lld_demos table
→ Sequence examples (10 examples, 30 KB) → lld_sequence_examples table
→ State machine examples (6 examples, 11 KB) → lld_state_machine_examples table
→ Quiz questions (25 SOLID + 12 scenario + 50 finder) → lld_quiz_questions table
→ Pattern relations (12 comparisons + 25 prerequisites) → lld_pattern_relations table
→ User progress (attempts, XP, streaks) → progress table (existing)
→ Search function → PostgreSQL full-text search via API
```

---

## Appendix A: Component Import Dependency Map

Which components import which content — showing what breaks when data moves to API:

```
DESIGN_PATTERNS (patterns.ts) imported by:
  ├── sidebar/LLDSidebar.tsx      → Pattern browser list
  ├── panels/PatternQuiz.tsx      → Quiz question generation
  ├── panels/Flashcards.tsx       → Card generation
  ├── panels/StudyPlan.tsx        → Plan topic assignment
  ├── panels/DailyChallenge.tsx   → Daily pattern selection
  ├── panels/LLDBottomPanels.tsx  → Code generation
  ├── hooks/useLLDModuleImpl.tsx  → Pattern loading/selection
  └── search.ts                   → Cross-content search

LLD_PROBLEMS (problems.ts) imported by:
  ├── sidebar/LLDSidebar.tsx      → Problem browser list
  ├── hooks/useLLDModuleImpl.tsx  → Problem loading/selection
  └── search.ts                   → Cross-content search

SOLID_DEMOS + SOLID_QUIZ_QUESTIONS (solid-demos.ts) imported by:
  ├── sidebar/LLDSidebar.tsx      → SOLID demo browser
  ├── panels/SOLIDQuiz.tsx        → Quiz questions
  ├── panels/Flashcards.tsx       → Card generation
  ├── hooks/useLLDModuleImpl.tsx  → Demo loading/selection
  └── search.ts                   → Cross-content search

SEQUENCE_EXAMPLES (sequence-diagram.ts) imported by:
  ├── sidebar/LLDSidebar.tsx      → Sequence browser
  ├── hooks/useLLDModuleImpl.tsx  → Example loading/selection
  └── search.ts                   → Cross-content search

STATE_MACHINE_EXAMPLES (state-machine.ts) imported by:
  ├── sidebar/LLDSidebar.tsx      → State machine browser
  ├── hooks/useLLDModuleImpl.tsx  → Example loading/selection
  └── search.ts                   → Cross-content search
```

**Critical insight:** `useLLDModuleImpl.tsx` and `LLDSidebar.tsx` are the two main consumers of ALL content. Migrating these two files to API fetch covers 80% of the work.

---

## Appendix B: Drizzle Schema (TypeScript)

```typescript
// src/db/schema/lld-patterns.ts
import { pgTable, text, smallint, jsonb, timestamp, index } from "drizzle-orm/pg-core";

export const lldPatterns = pgTable("lld_patterns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  difficulty: smallint("difficulty").notNull(),
  description: text("description").notNull(),
  analogy: text("analogy").notNull(),
  tradeoffs: text("tradeoffs").notNull(),
  summary: jsonb("summary").notNull(),
  youAlreadyUseThis: jsonb("you_already_use_this").notNull(),
  predictionPrompts: jsonb("prediction_prompts"),
  classes: jsonb("classes").notNull(),
  relationships: jsonb("relationships").notNull(),
  codeTypescript: text("code_typescript").notNull(),
  codePython: text("code_python").notNull(),
  realWorldExamples: jsonb("real_world_examples").notNull(),
  whenToUse: jsonb("when_to_use").notNull(),
  whenNotToUse: jsonb("when_not_to_use").notNull(),
  interviewTips: jsonb("interview_tips"),
  commonMistakes: jsonb("common_mistakes"),
  confusedWith: jsonb("confused_with"),
  relatedPatterns: jsonb("related_patterns"),
  codeVariants: jsonb("code_variants"),
  sortOrder: smallint("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("lld_patterns_category_idx").on(table.category),
  index("lld_patterns_difficulty_idx").on(table.difficulty),
]);
```

> Full Drizzle schemas for all 7 tables would be generated during Step 1 of the migration.

---

## Appendix C: Bundle Impact Estimate

```
CURRENT LLD MODULE JS BUNDLE:
  src/lib/lld/          802 KB (TypeScript source)
  src/components/lld/   447 KB (TypeScript source)
  ──────────────────── ───────
  Total source:        1,249 KB
  Estimated gzipped:    ~180 KB (TS compiles + minifies + gzip at ~7:1 ratio)

AFTER MIGRATION:
  src/lib/lld/           ~95 KB (logic only: codegen, model, sync, types)
  src/components/lld/   ~420 KB (UI mostly unchanged, minus inline quiz data)
  ──────────────────── ────────
  Total source:          ~515 KB
  Estimated gzipped:      ~75 KB

  SAVINGS: ~105 KB gzipped / ~734 KB source

  PLUS: Each pattern loaded on-demand = ~10 KB per API call (gzipped: ~1.5 KB)
  User viewing 5 patterns loads: 75 KB (UI) + 7.5 KB (5 patterns) = 82.5 KB
  vs CURRENT: 180 KB (everything, always)
```
