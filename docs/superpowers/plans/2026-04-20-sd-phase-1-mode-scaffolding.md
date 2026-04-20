# SD Phase 1 · Mode Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 5-mode System Design (SD) shell (Learn / Build / Simulate / Drill / Review) as an empty scaffolding layer. All 13 new SD tables land, all 10+ API shells return 501 when not yet implemented, all 5 mode layouts are functional stubs, the SDShell renders with a cobalt accent, the welcome banner guides first-visit users, and URL-reflectable `?mode=` switching is wired. Zero regression to the existing LLD module. All backend plumbing (DB tables, API shells, stores, hooks, analytics) in place ready for Phase 2 content work.

**Architecture:** Single URL (`/modules/system-design` resolved via existing app shell, eventually `/sd/*`). New top-level `SDShell` component reads `sdMode` from Zustand ui-store and renders one of five layout components. Build mode wraps today's SD (React Flow) canvas unchanged. Learn / Simulate / Drill / Review are stubs in this phase. URL-reflectable via `?mode=` query param. New `sd-store` holds sd-specific transient state (activeSDDrill, activeSDSim, sidebar widths). 13 new DB tables gated by a single atomic migration `0002_add_sd_module.sql`. Partial unique index enforces "one active SD drill per user" and "one active SD sim per user" at the DB level. Cobalt accent (`#2563EB`) swaps in globally when `sdMode` is non-null; LLD amber (`#F59E0B`) persists when user is in LLD module. DB-first persistence with localStorage as offline cache — `user_preferences.preferences.sd` JSONB subtree.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Clerk v7 (optional), Vitest, Testing Library. Note: the installed Next.js is a non-canonical fork — always consult `node_modules/next/dist/docs/` before writing route code, per `architex/AGENTS.md`.

**Prerequisite:** LLD Phase 1 (`2026-04-20-lld-phase-1-mode-scaffolding.md`) must be **complete and shipped** before starting SD Phase 1. This plan reuses patterns from LLD Phase 1 (partial unique index for active drills, DB-first preferences, URL ↔ store sync). It extends but does not modify LLD structures.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md`:
- §3 — The 5 modes (Learn · Build · Simulate · Drill · Review) with ⌘1-5 shortcuts
- §4 — Information architecture, URL shape (`/sd`, `/sd/learn/*`, `/sd/build`, `/sd/simulate/*`, `/sd/drill/*`, `/sd/review`)
- §18 — UI & visual language (cobalt `#2563EB` accent, 3-column layouts per mode, 90-sec onboarding spec)
- §21 — Data model sketch (13 new SD tables, extended `user_preferences.preferences.sd` subtree)
- §23 — Implementation Phases, esp. Phase 1 scope (Weeks 3-6, ~140h)

---

## Pre-flight checklist (Phase 0 · ~4-6 hours)

Run before Task 1. These verify SD-specific "known bugs" listed in the spec are actually resolved in current code and that LLD Phase 1 is shipped.

- [ ] **Verify LLD Phase 1 is shipped**

Check: `docs/superpowers/plans/.progress-phase-1.md` exists and is fully checked off. The `lld_drill_attempts` table exists in the DB (run `pnpm db:studio` and confirm). The `LLDShell` component exists at `architex/src/components/modules/lld/LLDShell.tsx`. The `useLLDModeSync` hook exists. If LLD Phase 1 is NOT shipped, STOP — finish it first. This SD plan re-uses the exact architecture patterns from LLD Phase 1; reversing the order wastes time.

Run:
```bash
ls architex/src/components/modules/lld/LLDShell.tsx
ls architex/src/hooks/useLLDModeSync.ts
grep -q "lldDrillAttempts" architex/src/db/schema/index.ts && echo ok
```

Expected: all three succeed (exit code 0).

- [ ] **Verify authorization guards on all `/api/sd/*` placeholder routes**

If any `/api/sd/*` routes exist today (pre-Phase-1 experiments), confirm they call `requireAuth()` at the top. If they don't, either delete them or add auth guards before we rely on them.

Run:
```bash
find architex/src/app/api/sd -name route.ts 2>/dev/null | xargs grep -L requireAuth 2>/dev/null
```

Expected: no files listed (every route uses requireAuth).

- [ ] **Verify existing simulation engine performance baseline**

The SD module's Phase 3 Simulate mode will wrap the existing 34-file engine at `architex/src/engines/simulation/*`. Phase 1 should not touch that engine, but we record a baseline so later phases can detect regressions.

Run:
```bash
cd architex
pnpm test:run -- simulation
```

Record the total test duration in `docs/superpowers/plans/.sim-baseline.txt` with the commit SHA. Keep this file .gitignored locally; commit only the SHA reference.

- [ ] **Verify Sentry PII scrubbing config**

Same as LLD Phase 0 — verify `sentry.*.config.ts` scrubs headers, env values, and Clerk session cookies. If missing, stub in a TODO; don't block Phase 1 on full Sentry wiring.

- [ ] **Verify WebSocket auth primitives are ready**

SD Phase 3 (Simulate) will require auth'd WebSockets for the chaos-engine stream. Phase 1 does not ship WS, but we verify the auth helper exists:

```bash
grep -q "verifyClerkSessionFromWs" architex/src/lib/auth.ts 2>/dev/null
```

If no helper, add a TODO in a new issue; don't block Phase 1 on this.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```

All four must pass before starting SD Phase 1. Snapshot the output hash into `docs/superpowers/plans/.sd-phase-1-baseline.txt` for later diff.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "fix(sd): pre-flight security + stability verification for SD Phase 1"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/
│   └── 0002_add_sd_module.sql                                 # NEW (13 tables, 1 migration)
├── src/
│   ├── db/schema/
│   │   ├── sd-concepts.ts                                      # NEW
│   │   ├── sd-problems.ts                                      # NEW
│   │   ├── sd-concept-reads.ts                                 # NEW
│   │   ├── sd-concept-bookmarks.ts                             # NEW
│   │   ├── sd-designs.ts                                       # NEW
│   │   ├── sd-design-snapshots.ts                              # NEW
│   │   ├── sd-design-annotations.ts                            # NEW
│   │   ├── sd-simulations.ts                                   # NEW
│   │   ├── sd-simulation-events.ts                             # NEW
│   │   ├── sd-drill-attempts.ts                                # NEW
│   │   ├── sd-drill-interviewer-turns.ts                       # NEW
│   │   ├── sd-shares.ts                                        # NEW
│   │   ├── sd-fsrs-cards.ts                                    # NEW
│   │   ├── index.ts                                            # MODIFY (re-export 13)
│   │   ├── relations.ts                                        # MODIFY (add 13 relation blocks)
│   │   └── user-preferences.ts                                 # MODIFY (document sd subtree)
│   ├── stores/
│   │   ├── ui-store.ts                                         # MODIFY (+ sdMode slice)
│   │   ├── sd-store.ts                                         # NEW
│   │   └── __tests__/
│   │       ├── ui-store.sd.test.ts                             # NEW
│   │       └── sd-store.test.ts                                # NEW
│   ├── hooks/
│   │   ├── useSDModeSync.ts                                    # NEW
│   │   ├── useSDPreferencesSync.ts                             # NEW
│   │   ├── useSDDrillSync.ts                                   # NEW
│   │   ├── useSDSimulationSync.ts                              # NEW
│   │   └── __tests__/
│   │       ├── useSDModeSync.test.tsx                          # NEW
│   │       └── useSDDrillSync.test.tsx                         # NEW
│   ├── lib/analytics/
│   │   └── sd-events.ts                                        # NEW (30+ events)
│   ├── app/api/sd/
│   │   ├── concepts/route.ts                                   # NEW
│   │   ├── concepts/[id]/route.ts                              # NEW
│   │   ├── problems/route.ts                                   # NEW
│   │   ├── problems/[id]/route.ts                              # NEW
│   │   ├── designs/route.ts                                    # NEW
│   │   ├── designs/[id]/route.ts                               # NEW
│   │   ├── designs/[id]/snapshot/route.ts                      # NEW
│   │   ├── simulations/route.ts                                # NEW
│   │   ├── simulations/[id]/route.ts                           # NEW
│   │   ├── drill-attempts/route.ts                             # NEW
│   │   ├── drill-attempts/active/route.ts                      # NEW
│   │   ├── cards/due/route.ts                                  # NEW
│   │   ├── review/submit/route.ts                              # NEW
│   │   └── __tests__/                                          # NEW
│   │       ├── sd-concepts.test.ts
│   │       ├── sd-designs.test.ts
│   │       └── sd-drill-attempts.test.ts
│   └── components/modules/sd/
│       ├── SDShell.tsx                                         # NEW
│       ├── modes/
│       │   ├── SDModeSwitcher.tsx                              # NEW (5 pills, cobalt)
│       │   ├── SDWelcomeBanner.tsx                             # NEW (90-sec onboarding spec §18.6)
│       │   ├── LearnLayout.tsx                                 # NEW
│       │   ├── BuildLayout.tsx                                 # NEW (wraps existing SD canvas)
│       │   ├── SimulateLayout.tsx                              # NEW (stub)
│       │   ├── DrillLayout.tsx                                 # NEW (stub)
│       │   └── ReviewLayout.tsx                                # NEW (stub)
│       └── hooks/
│           └── useSDModuleImpl.tsx                             # MODIFY (delegate to SDShell)
```

**Design rationale for splits:**
- 13 tables × 1 file each so each team member / later phase can evolve independently.
- Mode layouts split per mode — different teams own Learn vs Simulate vs Drill later.
- Hooks split by concern: mode URL sync, preferences sync, drill heartbeat, sim heartbeat (Phase 3 uses sim hook; shell only ships drill + prefs + mode).
- API routes follow Next.js App Router convention — one `route.ts` per HTTP resource.
- Test colocation follows repo convention (`__tests__/` adjacent).

---

## Table of Contents

- Pre-flight checklist (Phase 0 · above)
- File Structure (above)
- Task 1 · `sd_concepts` DB schema (+ relations wiring)
- Task 2 · `sd_problems` DB schema
- Task 3 · `sd_concept_reads` + `sd_concept_bookmarks` schemas
- Task 4 · `sd_designs` + `sd_design_snapshots` + `sd_design_annotations` schemas
- Task 5 · `sd_simulations` + `sd_simulation_events` schemas
- Task 6 · `sd_drill_attempts` + `sd_drill_interviewer_turns` schemas
- Task 7 · `sd_shares` + `sd_fsrs_cards` schemas
- Task 8 · Generate and apply migration `0002_add_sd_module.sql`
- Task 9 · Extend `ui-store` with `sdMode` + welcome banner slice
- Task 10 · Create new `sd-store` (Zustand) with `activeSDDrill` + `activeSDSim` slices
- Task 11 · Create `useSDModeSync` hook (URL ↔ store)
- Task 12 · Create `useSDPreferencesSync` hook (debounced DB write-through)
- Task 13 · Create `useSDDrillSync` hook (heartbeat every 10s)
- Task 14 · Create API shells for concepts/problems (4 routes, return 501 for POST/PATCH)
- Task 15 · Create API shells for designs (3 routes) + snapshot
- Task 16 · Create API shells for simulations (2 routes)
- Task 17 · Create API shells for drill-attempts (2 routes) + active
- Task 18 · Create API shells for review (cards/due, review/submit)
- Task 19 · Create SD analytics event catalog (`sd-events.ts`, 30+ events)
- Task 20 · Create `SDModeSwitcher` component with cobalt accent + ⌘1-5 shortcuts
- Task 21 · Create `SDWelcomeBanner` (first-visit 90-sec spotlight carousel spec §18.6)
- Task 22 · Create 5 mode layout stubs (Learn / Build wrapper / Simulate / Drill / Review)
- Task 23 · Create `SDShell` top-level mode dispatcher
- Task 24 · Wire existing SD canvas into `BuildLayout` via `useSDModuleImpl`
- Task 25 · End-to-end smoke test + verification pass
- Self-review checklist
- Execution Handoff

---
