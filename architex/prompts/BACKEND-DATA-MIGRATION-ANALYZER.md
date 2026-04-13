# BACKEND & DATA MIGRATION ANALYZER

> Run this for ANY module. It deeply analyzes what's currently hardcoded in frontend,
> what SHOULD move to a database, what should be an API, and gives you the complete
> migration plan.
>
> Replace {{MODULE_NAME}} and {{MODULE_SLUG}}
>
> This is an ANALYSIS prompt — it doesn't change code. It produces a detailed report
> with exact recommendations.

---

## CONTEXT: THE CURRENT ARCHITECTURE

Architex has everything in the frontend:
- **7.8 MB** of TypeScript in `src/lib/` — algorithms, data structures, templates, configs
- **All content is hardcoded** — algorithm descriptions, complexity info, pseudocode, configs
- **Zustand stores with `persist`** save to localStorage — no server persistence
- **Drizzle + Neon** is configured but migrations never ran — DB schema exists but isn't used
- **API routes exist** but most return static data from `src/lib/`

Current stack:
```
Frontend:  Next.js 16, React 19, TypeScript, Tailwind, Zustand, React Flow
DB Setup:  Drizzle ORM + Neon (PostgreSQL) — configured but UNUSED
API Routes: src/app/api/ — exist but minimal
Schemas:   src/db/schema/ — users, diagrams, templates, progress, simulations, ai-usage, gallery
Storage:   localStorage via Zustand persist — canvas state, UI state, progress
```

---

## YOUR TASK

For {{MODULE_NAME}} (`src/lib/{{MODULE_SLUG}}/` + `src/components/modules/{{MODULE_SLUG}}/`):

Do a DEEP analysis of:
1. What data exists and how it's stored
2. What SHOULD stay in frontend vs what SHOULD move to backend/DB
3. What APIs need to be created
4. What the migration plan looks like
5. What benefits this brings (performance, features, user experience)

---

## PHASE 1: INVENTORY ALL DATA IN THE MODULE

Read EVERY file in:
```
src/lib/{{MODULE_SLUG}}/         — all implementation + data files
src/components/modules/{{MODULE_SLUG}}/  — all component files
src/stores/                      — any stores this module uses
```

For each file, categorize the data:

### 1.1 Static Content (descriptions, explanations, metadata)

```
| File | Data | Lines | Type | Example |
|------|------|-------|------|---------|
| bubble-sort.ts | CONFIG object | 35 lines | Algorithm metadata | name, description, complexity, pseudocode |
| ... | ... | ... | ... | ... |
```

Questions to answer:
- How many items have descriptions/explanations? (count)
- How much is the total text content? (KB)
- Does this content ever change at runtime? (yes/no)
- Could a non-developer (content writer) update this? (yes/no)
- Is this content duplicated anywhere? (yes/no)

### 1.2 Configuration Data (parameters, defaults, options)

```
| File | Data | Type | Example |
|------|------|------|---------|
| types.ts | ComponentConfig defaults | Config object | { instances: 1, throughput: 1000 } |
```

Questions:
- Are these user-configurable at runtime?
- Should users be able to save custom configs?
- Are there "presets" that could be community-shared?

### 1.3 Implementation Logic (algorithms, simulation engines, computations)

```
| File | Logic | Lines | Pure Function? | Needs Server? |
|------|-------|-------|----------------|---------------|
| bubble-sort.ts | sort + step recording | 80 lines | YES | NO |
```

Questions:
- Is this pure computation (input → output, no side effects)?
- Does it need >100ms to run? (would benefit from server/worker)
- Could this run in a Web Worker instead of main thread?
- Does this need data that only the server has?

### 1.4 User-Generated Data (canvas state, progress, saved designs)

```
| Store | Data | Persisted? | Where? | Shared? |
|-------|------|------------|--------|---------|
| canvas-store | nodes + edges | Yes | localStorage | No |
| progress-store | completed items | Yes | localStorage | No |
```

Questions:
- Should this persist across devices? (needs server)
- Should this be shareable? (needs server)
- Is localStorage enough or do we need real persistence?
- How much data? (KB/MB)

---

## PHASE 2: WHAT SHOULD MOVE TO BACKEND

For each data category, recommend:

### 2.1 MOVE TO DATABASE (Neon PostgreSQL via Drizzle)

```
CANDIDATE: [data name]
CURRENTLY: [where it is now — e.g., "hardcoded in bubble-sort.ts line 12-40"]
WHY MOVE: [specific reason]
  - [ ] Content writers can update without code deploy
  - [ ] Users can save/share custom versions
  - [ ] Needs to persist across devices
  - [ ] Needs to be searchable/filterable
  - [ ] Performance: too large for bundle (>50KB)
  - [ ] Needs versioning/history
  - [ ] Needs access control (public vs private)
DB TABLE: [which existing schema table, or new table needed]
SCHEMA:
  [Draft Drizzle schema for this data]
MIGRATION EFFORT: [S/M/L]
```

### 2.2 MOVE TO API ROUTE (but keep data in files/DB)

```
CANDIDATE: [data name]
CURRENTLY: [where it is now]
WHY API: [reason]
  - [ ] Too large to bundle (lazy load via API)
  - [ ] Needs server-side computation
  - [ ] Needs authentication
  - [ ] Needs rate limiting
  - [ ] External service integration
API ROUTE: [/api/path]
METHOD: [GET/POST/PUT/DELETE]
REQUEST: [params/body]
RESPONSE: [shape]
CACHING: [strategy — ISR, stale-while-revalidate, static]
```

### 2.3 KEEP IN FRONTEND (no change needed)

```
CANDIDATE: [data name]
WHY KEEP: [reason]
  - [ ] Pure computation (runs in browser, no server needed)
  - [ ] Small data (<10KB)
  - [ ] Only used locally (no sharing/persistence needed)
  - [ ] Real-time/interactive (too latency-sensitive for API)
  - [ ] Privacy (user data shouldn't leave device)
```

### 2.4 MOVE TO WEB WORKER (keep in frontend, off main thread)

```
CANDIDATE: [data name]
CURRENTLY: [runs on main thread, blocks UI]
WHY WORKER: [reason]
  - [ ] Heavy computation (>100ms)
  - [ ] Blocks UI interactions
  - [ ] Can run in background
WORKER FILE: [src/lib/workers/{{name}}-worker.ts]
COMMUNICATION: [postMessage pattern]
```

---

## PHASE 3: DATABASE SCHEMA RECOMMENDATIONS

### 3.1 Check Existing Schemas

Read `src/db/schema/` — what tables already exist?

```
| Table | File | Status | Used By |
|-------|------|--------|---------|
| users | users.ts | Schema exists, not migrated | Nothing yet |
| diagrams | diagrams.ts | Schema exists, not migrated | Nothing yet |
| templates | templates.ts | Schema exists, not migrated | Nothing yet |
| progress | progress.ts | Schema exists, not migrated | Nothing yet |
| simulations | simulations.ts | Schema exists, not migrated | Nothing yet |
| ai-usage | ai-usage.ts | Schema exists, not migrated | Nothing yet |
| gallery | gallery.ts | Schema exists, not migrated | Nothing yet |
```

### 3.2 New Tables Needed

For data that should move to DB but has no existing table:

```sql
-- Example: Algorithm catalog table
CREATE TABLE algorithm_catalog (
  id TEXT PRIMARY KEY,           -- "bubble-sort"
  name TEXT NOT NULL,            -- "Bubble Sort"
  category TEXT NOT NULL,        -- "sorting"
  difficulty TEXT,               -- "beginner"
  description TEXT,              -- long description
  pseudocode JSONB,             -- ["line1", "line2", ...]
  complexity JSONB,              -- { best: "O(n)", avg: "O(n^2)", ... }
  is_stable BOOLEAN,
  is_in_place BOOLEAN,
  comparison_guide TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Data Seeding Strategy

How to populate the DB from existing hardcoded data:

```
Step 1: Extract all hardcoded content from src/lib/{{MODULE_SLUG}}/
Step 2: Transform into DB-ready JSON/SQL
Step 3: Create seed script: src/db/seeds/{{MODULE_SLUG}}.ts
Step 4: Run migration + seed
Step 5: Update components to fetch from API instead of importing from lib/
```

---

## PHASE 4: API DESIGN

For each API endpoint needed:

```
ENDPOINT: GET /api/{{MODULE_SLUG}}/catalog
PURPOSE: Fetch all items for the sidebar/selector
AUTH: None (public)
CACHE: ISR 1 hour (content rarely changes)
RESPONSE:
  {
    items: [
      { id: "bubble-sort", name: "Bubble Sort", category: "sorting", difficulty: "beginner" },
      ...
    ]
  }
MIGRATION FROM: import { ALGO_CATALOG } from "@/lib/algorithms" → fetch("/api/algorithms/catalog")

ENDPOINT: GET /api/{{MODULE_SLUG}}/[id]
PURPOSE: Fetch full details for a specific item
AUTH: None (public)
CACHE: ISR 24 hours
RESPONSE:
  {
    id: "bubble-sort",
    name: "Bubble Sort",
    description: "...",
    pseudocode: ["..."],
    complexity: { best: "O(n)", ... },
    // ... everything currently in the CONFIG object
  }

ENDPOINT: POST /api/{{MODULE_SLUG}}/progress
PURPOSE: Save user progress (completed items, scores)
AUTH: Required (Clerk)
BODY: { itemId: "bubble-sort", status: "completed", score: 85 }
DB TABLE: progress
```

---

## PHASE 5: BENEFITS ANALYSIS

### Performance Benefits
```
CURRENT: Browser downloads 7.8MB of lib/ on first load
AFTER:   Browser downloads ~500KB (UI only) + lazy-loads content from API

CURRENT: DataStructuresModule loads 600KB+ of JS → browser freeze
AFTER:   Loads 50KB UI + fetches catalog (2KB JSON) → instant load

CURRENT: All 62 algorithms bundled even if user only views Bubble Sort
AFTER:   Only Bubble Sort data fetched when selected
```

### Feature Benefits
```
ENABLED BY DB:
  - User progress saved across devices (login → see your history)
  - Community sharing (share your custom algorithm config)
  - Admin panel for content updates (no code deploy needed)
  - Search across all content (full-text search via PostgreSQL)
  - Analytics (which algorithms are most viewed/completed)
  - A/B testing content (different descriptions for different users)
  - Versioning (track content changes over time)
  - Localization (same schema, different language content)
```

### User Experience Benefits
```
- Faster first load (smaller JS bundle)
- Faster module switching (no giant imports)
- Progress persists across devices
- Can share links to specific items
- Search works across everything
```

---

## PHASE 6: MIGRATION ROADMAP

```
STEP 1: Run Drizzle migrations (create tables)
  - pnpm drizzle-kit generate
  - pnpm drizzle-kit migrate
  Effort: S (schema already exists)

STEP 2: Create seed scripts (extract hardcoded data → DB)
  - One script per module
  - Read from src/lib/, write to DB
  Effort: M per module

STEP 3: Create API routes
  - GET /api/{{MODULE_SLUG}}/catalog
  - GET /api/{{MODULE_SLUG}}/[id]
  - POST /api/{{MODULE_SLUG}}/progress
  Effort: S per endpoint

STEP 4: Update components to use API
  - Replace static imports with fetch/SWR/React Query
  - Add loading states
  - Add error handling
  Effort: M per module

STEP 5: Remove hardcoded data from lib/
  - Keep ONLY computation logic (pure functions)
  - Remove catalog/config/description data
  - Bundle size drops significantly
  Effort: M per module
```

---

## PHASE 7: WHAT NOT TO MOVE

Be explicit about what should STAY in frontend:

```
KEEP IN FRONTEND:
  ✓ Algorithm execution logic (pure functions — bubbleSort(), quickSort())
  ✓ Visualization rendering (SVG, Canvas drawing code)
  ✓ Animation choreography (motion configs)
  ✓ Step recording (generates animation steps)
  ✓ Canvas state (nodes, edges — real-time, too frequent for API)
  ✓ UI state (panel open/closed, selected tab)
  
MOVE TO BACKEND:
  → Catalog data (names, descriptions, complexity, pseudocode)
  → User progress (completed items, scores, streaks)
  → Saved designs/configurations
  → Template library
  → Community shared content
  → Analytics/telemetry
```

---

## OUTPUT FORMAT

Save the complete analysis to:
`docs/architecture/{{MODULE_SLUG}}-backend-analysis.md`

Include:
1. Data inventory table (every piece of data, where it is, size)
2. Recommendation per data item (keep/move/worker)
3. New DB tables needed (Drizzle schema)
4. API endpoints needed (route, method, request, response)
5. Benefits analysis (performance, features, UX)
6. Migration roadmap (steps with effort estimates)
7. What NOT to move (explicit list)

---

## IMPORTANT: THIS IS ANALYSIS ONLY

Do NOT change any code. Do NOT create any files in src/.
Only create the analysis document in docs/architecture/.
The actual migration is a SEPARATE task executed with EXECUTE-TASKS.md.
