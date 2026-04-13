# MASTER PLAN — Read All Analysis Docs, Create Prioritized Execution Plan

> You are a **Staff Engineer / CTO** who has just received 24 analysis documents
> from your team. Your job is to read ALL of them, find the common patterns,
> eliminate duplicates, prioritize by impact, and create a SINGLE master execution
> plan that transforms Architex from a frontend-only app to a full-stack platform
> with world-class UI.
>
> You do NOT implement anything. You create THE PLAN that all future sessions follow.

---

## PHASE 1: READ EVERYTHING

Read ALL these documents completely. Don't skim. Extract the key recommendations from each.

### Backend Migration Analysis (10 modules)
```
docs/architecture/algorithm-backend-analysis.md      (1000 lines)
docs/architecture/concurrency-backend-analysis.md    (630 lines)
docs/architecture/data-structures-backend-analysis.md (849 lines)
docs/architecture/database-backend-analysis.md       (971 lines)
docs/architecture/distributed-backend-analysis.md    (465 lines)
docs/architecture/lld-backend-analysis.md            (1056 lines)
docs/architecture/ml-design-backend-analysis.md      (551 lines)
docs/architecture/networking-backend-analysis.md     (1034 lines)
docs/architecture/os-concepts-backend-analysis.md    (562 lines)
docs/architecture/security-backend-analysis.md       (567 lines)
```

### UI/Design Analysis
```
docs/design/ALGORITHM-REVAMP-FINAL.md          (494 lines)
docs/design/algorithm-stitch-polish.md         (796 lines)
docs/design/algorithm-stitch-reimagine.md      (1441 lines)
docs/design/algorithm-ui-spec.md               (796 lines)
docs/design/algorithm-stitch-prompts.md        (308 lines)
docs/design/database-visual-language.md        (278 lines)
docs/design/PLAYWRIGHT-AUDIT-RESULTS.md        (102 lines)
```

### Architecture & General
```
docs/architecture/database-module.md           (379 lines)
docs/UI_DESIGN_SYSTEM_SPEC.md                  (1304 lines)
docs/VISUAL_DESIGN_SPEC.md                     (2312 lines)
docs/PAPERDRAW_VS_ARCHITEX_ANALYSIS.md         (264 lines)
docs/content-style-guide.md                    (139 lines)
docs/OS_CONTENT_GUIDE.md                       (262 lines)
DS-MODULE-ANALYSIS.md                          (234 lines)
```

---

## PHASE 2: EXTRACT COMMON PATTERNS

After reading all 24 documents, answer these questions:

### 2.1 Backend Migration — What's Common Across ALL Modules?

```
PATTERN: [What every backend analysis recommends]
SHARED INFRASTRUCTURE NEEDED:
  - [ ] What DB tables are needed by ALL modules?
  - [ ] What API patterns repeat across all modules?
  - [ ] What's the common data shape (catalog + content + progress)?
  - [ ] Can we build ONE generic system instead of 10 module-specific ones?
```

Example findings:
```
EVERY module has:
  → A CATALOG (list of items with id, name, category, difficulty)
  → CONTENT per item (description, explanation, complexity)
  → USER PROGRESS (completed, score, last-viewed)
  → IMPLEMENTATION (pure functions — keep in frontend)

SO: Build ONE generic catalog system, not 10 separate ones.
```

### 2.2 UI Design — What's Common Across Designs?

```
PATTERN: [What all UI analyses recommend]
  - Same panel structure improvements?
  - Same animation system?
  - Same color/typography fixes?
  - Same empty state / loading state patterns?
```

### 2.3 Critical Bugs / Blockers

```
What MUST be fixed before anything else?
  - DS module browser freeze (DS-MODULE-ANALYSIS.md)
  - Any other blockers found in audit results?
```

---

## PHASE 3: ELIMINATE DUPLICATES

Many documents will recommend the same things. Merge them:

```
DUPLICATE: "Move catalog to DB" 
  Found in: algorithm-backend-analysis.md, data-structures-backend-analysis.md, 
            networking-backend-analysis.md (+ 7 more)
  MERGE INTO: ONE task — "Create generic catalog API for all modules"

DUPLICATE: "Add loading skeletons"
  Found in: algorithm-ui-spec.md, VISUAL_DESIGN_SPEC.md, PLAYWRIGHT-AUDIT-RESULTS.md
  MERGE INTO: ONE task — "Add skeleton loading component to design system"
```

---

## PHASE 4: PRIORITIZE BY IMPACT

Rank every recommendation by:

**IMPACT** (1-5): How much does this improve the user experience?
**EFFORT** (1-5): How much work? (1=easy, 5=massive)
**URGENCY** (1-5): Does something depend on this? Is it blocking other work?
**SCORE** = (IMPACT × 2 + URGENCY) / EFFORT — higher = do first

```
| # | Recommendation | Impact | Effort | Urgency | Score | Phase |
|---|---------------|--------|--------|---------|-------|-------|
| 1 | Fix DS module freeze | 5 | 3 | 5 | 5.0 | NOW |
| 2 | Run Drizzle migrations | 4 | 1 | 5 | 13.0 | NOW |
| 3 | Generic catalog API | 5 | 3 | 4 | 4.7 | Week 1 |
| ... | ... | ... | ... | ... | ... | ... |
```

---

## PHASE 5: CREATE THE MASTER PLAN

### Layer 0: CRITICAL FIXES (do NOW — before anything else)
```
Things that are BROKEN and blocking development.
  → DS module freeze
  → Any compile errors
  → Any broken modules
```

### Layer 1: FOUNDATION (Week 1 — shared infrastructure)
```
Things that ALL other work depends on. Do these once, use everywhere.
  → Run Drizzle migrations (create DB tables)
  → Generic catalog API (serves all 10 modules)
  → Generic progress API (tracks user completion)
  → Auth setup (Clerk install — needed for user progress)
  → Design system tokens (shared colors, spacing, typography)
  → Skeleton loading component
  → Error boundary improvements
```

### Layer 2: BACKEND MIGRATION (Week 2-3 — per module)
```
Move content from frontend to DB. Can be parallelized across modules.
  → Seed scripts for each module's catalog data
  → Update components to fetch from API
  → Remove hardcoded data from lib/
  → Verify bundle size reduction
```

### Layer 3: UI REVAMP (Week 3-4 — per module)
```
Implement the UI improvements from design docs.
  → Algorithm Visualizer revamp (most detailed design exists)
  → System Design Simulator polish
  → Apply design system improvements to all modules
```

### Layer 4: FEATURES (Week 4+ — new functionality)
```
New capabilities enabled by backend.
  → User progress across devices
  → Community sharing
  → Search across all content
  → Admin content editor
```

---

## PHASE 6: SESSION PLAN

Break the master plan into specific sessions:

```
SESSION 1: "Foundation — DB + Auth + API Framework"
  PROMPT: EXECUTE-TASKS.md
  EPIC: INF (Infrastructure)
  TASKS:
    → Install Clerk, uncomment auth
    → Run Drizzle migrations
    → Create generic catalog API route
    → Create generic progress API route
    → Test DB connection
  AGENT COUNT: 3-4

SESSION 2: "Backend Migration — Algorithms + Data Structures"
  PROMPT: EXECUTE-TASKS.md
  TASKS:
    → Create algorithm seed script
    → Create DS seed script
    → Update AlgorithmModule to fetch from API
    → Update DataStructuresModule to fetch from API
    → Fix DS module freeze (lazy loading from API)
  AGENT COUNT: 4-5

SESSION 3: "Backend Migration — Remaining Modules"
  PROMPT: EXECUTE-TASKS.md
  TASKS:
    → Seed scripts for LLD, Database, Distributed, Networking, OS, Concurrency, Security, ML
    → Update all modules to fetch from API
  AGENT COUNT: 6-8

SESSION 4: "UI Revamp — Algorithm Visualizer"
  PROMPT: FRONTEND-REVAMP.md
  INPUT: docs/design/ALGORITHM-REVAMP-FINAL.md + algorithm-ui-spec.md
  TASKS: Layout → Components → Animation → Polish

SESSION 5: "UI Revamp — Remaining Modules"
  PROMPT: FRONTEND-REVAMP.md for each module
  Use STITCH-MODE1-POLISH.md to generate designs first

SESSION 6: "Features — Progress, Sharing, Search"
  New features enabled by backend
```

---

## PHASE 7: GENERATE TASK BATCHES

For each session, generate actual tasks in the batch JSON format:

```json
[
  {
    "id": "INF-100",
    "epic": "INF",
    "title": "Run Drizzle migrations to create DB tables",
    "description": "...",
    "acceptanceCriteria": ["All tables from src/db/schema/ exist in Neon DB", "drizzle-kit studio shows all tables"],
    "priority": "P0",
    "effort": "S",
    "status": "ready",
    "phase": 1,
    "module": "infrastructure",
    "category": "backend",
    "files": ["drizzle.config.ts", "src/db/schema/"],
    "dependencies": [],
    "blockedBy": [],
    "tags": ["database", "infrastructure", "foundation"]
  }
]
```

Save to: `docs/tasks/batch-master-plan.json`

---

## PHASE 8: OUTPUT

### 8.1 Master Plan Document
Save to: `docs/MASTER-EXECUTION-PLAN.md`

Include:
- Executive summary (1 paragraph)
- All 24 documents summarized (1-2 lines each)
- Common patterns found
- Duplicates eliminated
- Prioritized recommendation table
- Layered execution plan (0→1→2→3→4)
- Session breakdown
- Dependency graph (what blocks what)

### 8.2 Task Batch
Save to: `docs/tasks/batch-master-plan.json`
Tasks generated from the plan.

### 8.3 Quick Reference Card
At the TOP of the master plan, include:

```
═══════════════════════════════════════════════════
  ARCHITEX MASTER PLAN — QUICK REFERENCE
═══════════════════════════════════════════════════

DOCUMENTS ANALYZED: 24
TOTAL RECOMMENDATIONS: ~N
AFTER DEDUP: ~N unique actions
ESTIMATED SESSIONS: 6-8
ESTIMATED TIME: 3-4 weeks

TOP 5 PRIORITIES:
  1. [Most impactful action]
  2. [Second most impactful]
  3. [Third]
  4. [Fourth]
  5. [Fifth]

START WITH: Session 1 — [description]
═══════════════════════════════════════════════════
```

---

## RULES

- Read ALL 24 documents. Don't skip any.
- Cross-reference: if doc A says "move X to DB" and doc B says "move X to API", resolve the conflict.
- Be opinionated: don't say "you could do X or Y" — say "do X because [reason]".
- Be specific: don't say "improve the UI" — say "change sidebar width from 260px to 280px and add 8px section gaps".
- Every recommendation must have: what to do, which files, effort estimate, what it unblocks.
