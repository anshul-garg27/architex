# Session Handoff — Architex

> Last updated: 2026-04-11
> Use this file to start a new Claude Code session. Copy the content below as your first message.

---

## Quick Start Prompt (copy this to new session)

```
We are building ARCHITEX — an interactive engineering visualization & simulation platform at /Users/anshullkgarg/Desktop/system_design/architex/

## Current State
- **1,157 tasks** across 37 epics in docs/tasks/tasks.json
- **856 done (74%)**, 301 remaining
- **0 TypeScript errors**, 3,232 tests passing (169 files)
- **Tech**: Next.js 16, TypeScript strict, Tailwind v4, React Flow v12, Zustand v5, Vitest
- **13 interactive modules**: System Design, Algorithms, Data Structures, LLD, Database, Distributed, Networking, OS, Concurrency, Security, ML Design, Interview, Knowledge Graph

## Task Board Epics (remaining work)

### AUD — Audit Fixes (70 remaining of 145)
- 75 critical+high bugs already fixed (capacity planner math, code splitting, Zustand selectors, dialog a11y, timer leaks, etc.)
- 70 remaining are medium+low: AVL rotation edge case, DP description bugs, CORS issues, more key={i} fixes

### V2 — Architex v2 Roadmap (102 tasks, 0 done)
12 phases:
1. **SIM-001→011**: Simulation Engine (topology signatures, 35 pressure counters, 52 issue taxonomy, 80 rule profiles, report generator, cost model, metrics bus, narrative engine)
2. **COMP-001→010**: Component Expansion (41 new types, unified 45-property config, 23 SimulatesAs profiles)
3. **UI-001→008**: Simulation UI (dashboard overlay, node metrics, chaos bar, cost monitor, report panel)
4. **PERF-001→006**: Performance (SimMetricsBus kills 500 renders/sec, CSS badges, particle cache, LOD context)
5. **CHAOS-001→003**: Chaos (73 types, pressure counter tracker)
6. **CROSS-001→010**: Cross-Module Integration (bridge system connecting all 13 modules)
7. **AI-001→008**: AI Integration (Claude client, topology rules, design review, architecture generator)
8. **TPL-001→005**: Templates (v2 schema, 15 solution blueprints)
9. **IO-001→006**: Import/Export (Terraform, C4, Excalidraw, K8s YAML)
10. **DB-001→010**: Backend (10 Drizzle tables, Clerk auth, API routes, SyncBridge)
11. **BIZ-001→005**: Monetization (feature gates, student tier, analytics)
12. **LEARN-001→020**: Learning Module Enhancements (replication sim, sharding sim, "Simulate Your Answer")

### POLISH — Launch Polish (18 tasks, 0 done)
- 404 page, loading states, settings page, Storybook, README, E2E tests

### UIUX — UI/UX Improvements (60 tasks, 0 done)
- P0: Font loading, pricing fix, CTA wiring, ReducedMotion, light mode colors, toolbar overflow, node shapes, state indicators
- P1: Edge RPS labels, typography rem, token unification, hero rewrite, gallery fixes, animation tokens
- P2: LOD transitions, handle differentiation, blog layout

## Key Technical Decisions
- Zustand: NEVER use `(s) => ({x: s.x})` — creates new object = infinite re-render
- React Flow adds own light/dark class — CSS selectors scoped to `html.light`
- SimulationOrchestrator accesses stores via `.getState()` (not hooks)
- Module routing: `useXxxModule()` hooks called unconditionally (Rules of Hooks)
- Use `motion` not `framer-motion` for imports

## Research
- PaperDraw competitive analysis at docs/PAPERDRAW_VS_ARCHITEX_ANALYSIS.md
- 13 architecture blueprints produced (simulation engine, components, config, learning modules, chaos, UI, import/export, cross-module, AI, templates, monetization, performance, data model)
- Deep UI/UX audit: 6 agents found ~117 issues (node shapes, color system, animations, typography, landing page)

## Priority Order for Next Session
1. **UIUX P0** (12 tasks) — Font, pricing fix, CTAs, ReducedMotion, node colors, toolbar, onboarding, node shapes
2. **AUD remaining** (70 tasks) — Medium/low bug fixes
3. **V2 Phase 1** (SIM-001→011) — Simulation engine core
4. **V2 Phase 4** (PERF-001→006) — Kill 500 renders/sec bug
5. **POLISH P0** (6 tasks) — 404 page, loading states, settings

## How to Run
```bash
cd /Users/anshullkgarg/Desktop/system_design/architex
pnpm dev          # App at localhost:3000
pnpm test:run     # 3,232 tests
pnpm typecheck    # 0 errors
```

## Task Board
```bash
npx serve docs/tasks/ -p 8080
# → http://localhost:8080/board-index.html
```

Use parallel agents (8-10 at a time) for maximum throughput. Mark tasks done in tasks.json as agents complete.
```

---

## Memory References
- `project_architex.md` — Full session log
- `project_audit_results.md` — 13 critical, 65+ high issues with file:line refs  
- `project_paperdraw_analysis.md` — Competitor analysis summary
