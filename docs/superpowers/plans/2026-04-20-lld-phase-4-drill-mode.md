# LLD Phase 4 · Drill Mode — Interview Diamond Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Drill mode into the polished centerpiece of Architex — a realistic, high-fidelity interview simulation that mirrors a real whiteboard round. Ship a 5-stage gated pipeline (Clarify → Rubric → Canvas → Walkthrough → Reflection), a streaming Sonnet-backed interviewer persona system (Amazon / Google / Meta / Stripe / Uber voices), a 3-tier hint ladder (nudge → hint → reveal) with per-tier score penalties, a 6-axis grading engine (Clarification / Classes / Relationships / Pattern Fit / Tradeoffs / Communication) that unifies deterministic structure checks with AI qualitative judging, full post-drill artifacts (rubric breakdown, AI postmortem, canonical compare, timing heatmap, follow-up suggestions), abandon/resume using Phase 1's partial-unique index, three drill-session variants (Exam · Timed Mock · Study), and the complete telemetry surface with one event per stage transition.

**Architecture:** The existing `lld_drill_attempts` table (shipped in Phase 1) is extended with six new JSONB columns — `stages` (progress + timing per stage), `interviewer_turns` (chat log), `hint_log` (tiered hint history + penalties), `rubric_breakdown` (6-axis grade), `postmortem` (AI-authored follow-up), and `variant` (exam/timed-mock/study). A new `src/lib/lld/drill-stages.ts` module owns the gate logic (a stage cannot be "completed" until its gate predicate returns true). A new `src/lib/ai/interviewer-persona.ts` module wraps the Claude client with streaming Sonnet requests and five persona system prompts. A new `src/lib/lld/grading-engine-v2.ts` composes the existing `grading-engine.ts` with Claude qualitative scoring across 6 axes. React-Flow canvas, existing hint-system.ts, and Phase 1's heartbeat + auto-abandon are all reused; we do not reimplement them. The Drill layout stub from Phase 1 becomes a 5-stage stepper shell with the canvas filling Stage 3.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Anthropic SDK (`claude-sonnet-4-20250514` for interviewer + postmortem, `claude-haiku-4-5` for grading), framer-motion 12, Vitest, Testing Library, Playwright. **Note:** this repo pins a non-GA Next.js — consult `node_modules/next/dist/docs/` before touching routing/streaming APIs.

**Prerequisite:** Phases 1–3 merged. This plan assumes `LLDShell`, `DrillModeLayout.tsx` stub, `ui-store.lldMode`, `interview-store.activeDrill`, the `lld_drill_attempts` table, `useLLDDrillSync` heartbeat, and the 6 Phase-1 API routes (`/api/lld/drill-attempts/*`) all exist and ship on `main`. It also assumes the existing `src/lib/lld/grading-engine.ts` (fuzzy-match auto-grader) and `src/lib/ai/hint-system.ts` (3-tier hint engine) are untouched — both are composed with, not replaced.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` sections §6 (Drill mode), §7 (persistence), §12 (AI · A3 Socratic, A7 company-style), §13 (W8 hostile interviewer). Implementation handoff at `docs/superpowers/specs/2026-04-20-lld-implementation-handoff.md` (Phase 3 + 4 checklists, "never intervene mid-drill" rule).

**Open question:** The spec offers three drill-session **variants** (Exam / Timed Mock / Study) that differ in timer behavior, hint availability, and FSRS impact. Phase 4 implements all three as a single `variant` discriminator; UI exposes them in the sub-mode picker. If product pushes back on naming, rename in a later polish pass — the DB column `variant` + enum values stay.

---

## Pre-flight checklist (Phase 4 · ~1-2 hours)

Run before Task 1. These verify upstream phases' invariants still hold.

- [ ] **Verify Phase 1 mode scaffolding merged**

```bash
cd architex
git log --oneline | grep -iE "phase-?1|mode.scaffold" | head -3
```
Expected: at least one commit referencing Phase 1 or `lld_drill_attempts`. If nothing, stop — Phase 1 is not merged and this plan cannot start.

- [ ] **Verify `lld_drill_attempts` table exists**

```bash
cd architex
pnpm drizzle-kit introspect:pg 2>&1 | grep lld_drill_attempts || psql "$DATABASE_URL" -c "\d lld_drill_attempts" | head -5
```
Expected: table definition printed with columns including `canvas_state`, `hints_used`, `grade_breakdown`. If empty, run `pnpm db:push` to apply Phase 1 migration.

- [ ] **Verify `DrillModeLayout.tsx` stub exists**

```bash
ls architex/src/components/modules/lld/modes/DrillModeLayout.tsx
```
Expected: file exists with `"use client"` banner and a minimal stub component exporting `DrillModeLayout`. If missing, Phase 1 not merged — stop.

- [ ] **Verify `useLLDDrillSync` hook exists and tests pass**

```bash
cd architex
pnpm test:run -- useLLDDrillSync
```
Expected: all heartbeat tests pass (3 assertions from Phase 1 Task 7).

- [ ] **Verify existing grading engine untouched**

```bash
grep -c "export function gradeSubmission" architex/src/lib/lld/grading-engine.ts
```
Expected: `1`. If zero, someone renamed the public API — stop and investigate before composing on top of it.

- [ ] **Verify Anthropic key is configured OR fallback acceptable**

```bash
grep -c ANTHROPIC_API_KEY architex/.env.local || echo "no key — fallback-only mode"
```
Expected: either a non-zero count (key present; full AI test coverage) or the "no key" string (plan still works; AI tests use mocks only; server-side grading falls back to deterministic-only).

- [ ] **Baseline test suite passes**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 4. Do not entangle Phase 4 work with pre-existing failures.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "fix: pre-flight verification for Phase 4"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                      # (generated migrations)
│   ├── NNNN_extend_lld_drill_attempts.sql                        # NEW (Task 1)
│   └── NNNN_lld_drill_interviewer_turns.sql                      # NEW (Task 3)
├── src/
│   ├── db/schema/
│   │   ├── lld-drill-attempts.ts                                 # MODIFY (+ 6 columns)
│   │   └── lld-drill-interviewer-turns.ts                        # NEW (chat log table)
│   ├── lib/lld/
│   │   ├── drill-stages.ts                                       # NEW (5-stage FSM)
│   │   ├── drill-variants.ts                                     # NEW (exam/mock/study)
│   │   ├── grading-engine-v2.ts                                  # NEW (6-axis composer)
│   │   ├── drill-rubric.ts                                       # NEW (rubric definitions)
│   │   ├── drill-canonical.ts                                    # NEW (reference solutions)
│   │   ├── drill-timing.ts                                       # NEW (heatmap analysis)
│   │   └── __tests__/
│   │       ├── drill-stages.test.ts                              # NEW
│   │       ├── grading-engine-v2.test.ts                         # NEW
│   │       └── drill-timing.test.ts                              # NEW
│   ├── lib/ai/
│   │   ├── interviewer-persona.ts                                # NEW (5 personas + streaming)
│   │   ├── interviewer-prompts.ts                                # NEW (system-prompt bank)
│   │   ├── postmortem-generator.ts                               # NEW (post-drill Sonnet report)
│   │   └── __tests__/
│   │       ├── interviewer-persona.test.ts                       # NEW
│   │       └── postmortem-generator.test.ts                      # NEW
│   ├── lib/analytics/
│   │   └── lld-events.ts                                         # MODIFY (+ 12 drill events)
│   ├── stores/
│   │   ├── drill-store.ts                                        # NEW (stage + variant slice)
│   │   └── __tests__/
│   │       └── drill-store.test.ts                               # NEW
│   ├── hooks/
│   │   ├── useDrillStage.ts                                      # NEW (gate + transition)
│   │   ├── useDrillInterviewer.ts                                # NEW (streaming chat)
│   │   ├── useDrillHintLadder.ts                                 # NEW (nudge/hint/reveal)
│   │   ├── useDrillTimingHeatmap.ts                              # NEW (stage-duration analysis)
│   │   └── __tests__/
│   │       ├── useDrillStage.test.tsx                            # NEW
│   │       └── useDrillHintLadder.test.tsx                       # NEW
│   ├── app/api/lld/
│   │   ├── drill-attempts/
│   │   │   ├── [id]/
│   │   │   │   ├── stage/route.ts                                # NEW (PATCH advance stage)
│   │   │   │   ├── hint/route.ts                                 # NEW (POST consume hint)
│   │   │   │   ├── grade/route.ts                                # NEW (POST 6-axis grade)
│   │   │   │   ├── postmortem/route.ts                           # NEW (POST Sonnet report)
│   │   │   │   └── resume/route.ts                               # NEW (POST resume flow)
│   │   │   └── [id]/route.ts                                     # MODIFY (support stage PATCH)
│   │   └── drill-interviewer/
│   │       └── [id]/stream/route.ts                              # NEW (Sonnet SSE endpoint)
│   └── components/modules/lld/drill/
│       ├── DrillModeLayout.tsx                                   # MODIFY (fill in Phase 1 stub)
│       ├── DrillStageStepper.tsx                                 # NEW (5-node progress indicator)
│       ├── stages/
│       │   ├── ClarifyStage.tsx                                  # NEW (Stage 1 · questions)
│       │   ├── RubricStage.tsx                                   # NEW (Stage 2 · scope lock)
│       │   ├── CanvasStage.tsx                                   # NEW (Stage 3 · UML build)
│       │   ├── WalkthroughStage.tsx                              # NEW (Stage 4 · narration)
│       │   └── ReflectionStage.tsx                               # NEW (Stage 5 · self-grade)
│       ├── DrillVariantPicker.tsx                                # NEW (exam/mock/study)
│       ├── DrillInterviewerPanel.tsx                             # NEW (chat UI, streaming)
│       ├── DrillHintLadder.tsx                                   # NEW (3-tier penalty UI)
│       ├── DrillTimer.tsx                                        # NEW (countdown + heartbeat pulse)
│       ├── DrillSubmitBar.tsx                                    # NEW (submit/abandon/pause)
│       ├── DrillResumePrompt.tsx                                 # NEW (on return)
│       ├── DrillGradeReveal.tsx                                  # NEW (tiered celebration)
│       ├── DrillRubricBreakdown.tsx                              # NEW (6-axis radar + deltas)
│       ├── DrillPostmortem.tsx                                   # NEW (AI report render)
│       ├── DrillCanonicalCompare.tsx                             # NEW (side-by-side diff)
│       ├── DrillTimingHeatmap.tsx                                # NEW (stage-duration bars)
│       └── DrillFollowUpCard.tsx                                 # NEW (suggested next actions)
```

**Design rationale for splits:**
- Stage files split 1:1 per stage so each can evolve independently; gate logic centralized in `drill-stages.ts`.
- The interviewer is its own module (not a prop on some existing chat component) because streaming + persona + telemetry all need to be colocated. Persona prompts live in `interviewer-prompts.ts` so they can be tuned without touching the streaming infra.
- `grading-engine-v2.ts` composes (does not replace) the existing `grading-engine.ts`. Existing fuzzy-match remains the single source of truth for deterministic structure checks; v2 adds the 3 qualitative axes via Haiku.
- Post-drill artifacts each get their own component so Phase 5 (Architect's Studio) can restyle them in isolation.
- API routes follow the nested `[id]/action` convention from the existing drill-attempts shape rather than inventing a new top-level namespace.

---

## Table of contents · 28 tasks

1. **Task 1** — Extend `lld_drill_attempts` schema with six new columns (stages, hint_log, rubric_breakdown, postmortem, variant, started_stage_at)
2. **Task 2** — Generate and apply the migration
3. **Task 3** — Create `lld_drill_interviewer_turns` table for the chat log
4. **Task 4** — Generate and apply interviewer-turns migration
5. **Task 5** — Author `drill-stages.ts` — 5-stage FSM with gate predicates
6. **Task 6** — Author `drill-variants.ts` — exam / timed-mock / study config
7. **Task 7** — Author `drill-rubric.ts` — 6-axis rubric definitions + weight math
8. **Task 8** — Author `drill-canonical.ts` — reference solutions per problem
9. **Task 9** — Author `drill-timing.ts` — stage-duration heatmap + outlier detection
10. **Task 10** — Author `interviewer-prompts.ts` — 5 persona system prompts
11. **Task 11** — Author `interviewer-persona.ts` — streaming Sonnet wrapper
12. **Task 12** — Author `postmortem-generator.ts` — Sonnet report writer
13. **Task 13** — Author `grading-engine-v2.ts` — deterministic + Haiku composer
14. **Task 14** — Add 12 new events to `lld-events.ts` analytics catalog
15. **Task 15** — Create `drill-store.ts` Zustand slice
16. **Task 16** — Create `useDrillStage` hook — gate + transition
17. **Task 17** — Create `useDrillInterviewer` hook — streaming chat consumer
18. **Task 18** — Create `useDrillHintLadder` hook — 3-tier penalty tracker
19. **Task 19** — Create `useDrillTimingHeatmap` hook — per-stage duration
20. **Task 20** — API: `PATCH /api/lld/drill-attempts/[id]/stage`
21. **Task 21** — API: `POST /api/lld/drill-attempts/[id]/hint`
22. **Task 22** — API: `POST /api/lld/drill-attempts/[id]/grade`
23. **Task 23** — API: `POST /api/lld/drill-attempts/[id]/postmortem`
24. **Task 24** — API: `POST /api/lld/drill-attempts/[id]/resume`
25. **Task 25** — API: `GET /api/lld/drill-interviewer/[id]/stream` (SSE)
26. **Task 26** — Fill in `DrillModeLayout.tsx` with stage stepper + 5 stage screens
27. **Task 27** — Post-drill artifacts components (grade reveal, rubric, postmortem, canonical compare, timing heatmap, follow-up card)
28. **Task 28** — End-to-end verification + Playwright smoke test

Each task commits 1-3 times. Tasks 5-13 are pure library code (fast, testable). Tasks 15-19 are hooks. Tasks 20-25 are API routes. Tasks 26-27 are the UI surface. Task 28 is the green-light gate before Wave 3 rollout.

---

*(Tasks begin in subsequent commits — the scaffold above is intentionally minimal to let each task land as its own verifiable commit.)*
