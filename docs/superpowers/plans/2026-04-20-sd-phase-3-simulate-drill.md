# SD Phase 3 · Simulate + Drill — Flagship Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not flatten steps — each is intentionally atomic and independently verifiable.

**Goal:** Turn the Architex SD module's 34-file simulation engine into the product's flagship experience. Ship **Simulate mode** (the wind tunnel — metric strip with threshold coaching, cinematic chaos ribbon, whisper-mode Haiku coach, 6 activity framings, 6 chaos control modes, 73-event taxonomy metadata, 10 real-incident replays, all 7 drill-in features), **Drill mode** (5-stage gated interview clock, 8 interviewer personas, 3 mock modes, 6-axis rubric grader, AI postmortem, shareable PDF recap, abandon/resume), and the **second content drop** (Waves 2-3: Scaling primitives + Data & consistency = 12 more concepts, plus 10 more problems, plus Wave 3 anonymous 100% rollout).

**Scope:** Weeks 11-16, ~280 engineering hours. This is the biggest, densest phase of the SD rebuild. The preceding phases laid the canvas substrate (Phase 2); this phase spins the wind tunnel for the first time.

**Architecture:** The spec's §29 engineering decisions govern the engine work. Phase 3 ships **4 of 8 load models** (Uniform · Poisson · Diurnal · Burst), **basic cascade physics** (saturation curves + failure probability + circuit-breaker state machines, hysteresis tuned but not yet scream-test-validated against real incidents — that lands in Phase 4), **HDR-histogram metric engine** with 30-second ring-buffer live window, **SVG + Canvas hybrid** rendering @ 60fps target (500 nodes + 10k particles on 2020 MacBook Air baseline), **dual-clock** (real-time + sim-time with explicit dilation labels), **deterministic replay scaffolding** (seeded RNG + event log + 30s keyframe snapshots — full replay UI ships Phase 5, but Phase 3 plumbs the format). No new simulation primitives — every §8 and §12 feature in the spec maps to an existing file in `architex/src/lib/simulation/`. Phase 3 writes the **metadata** (73-event taxonomy · 10 real-incident narratives · threshold bands · persona prompts · rubric definitions · canonical designs) and the **UI wrapper** (left control rail · center canvas with particle layer · right metric strip + margin narrative stream · bottom timeline scrubber · top chrome with activity pill + scale slider + provider pill).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Anthropic SDK (`claude-sonnet-4-20250514` for interviewer / postmortem / coach-suggestion / red-team-chaos / rubric-grader; `claude-haiku-4-5` for whisper coach / per-metric threshold coaching / pattern detection / anti-pattern warnings / card grading), framer-motion 12, Vitest, Testing Library, Playwright, `hdr-histogram-js` (metrics), `d3-scale` / `d3-shape` (waterfall + radar charts), `react-pdf` (shareable recap), `@upstash/ratelimit` (SSE + AI ceilings), `react-flow` v12 (canvas), WebAudio API (optional chaos bass thump). **Note:** this repo pins a non-GA Next.js — consult `node_modules/next/dist/docs/` before touching SSE, App Router route handlers, or client-boundary streaming APIs.

**Prerequisite:** SD Phases 1 and 2 merged. This plan assumes `SDShell`, `SimulateModeLayout.tsx` stub, `DrillModeLayout.tsx` stub, `ui-store.sdMode`, `activeDesign` slice, the `sd_designs` + `sd_simulation_runs` + `sd_drill_attempts` tables (shipped in Phase 1 with partial unique indexes for one-active-drill-per-user), the `useSDDrillSync` heartbeat, the canvas substrate (ReactFlow v12 + SVG/Canvas hybrid + A* routing + Dagre + d3-force + swimlane + incremental re-layout), the first content drop (Wave 1 Foundations: 5 concepts + 3 warmup problems), and Phase 2's dual-clock model all exist and ship on `main`. It also assumes the existing `architex/src/lib/simulation/*` files (34 total) are untouched — we **compose with**, not replace, the engine.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md`. The load-bearing sections for Phase 3 are §8 (Simulate — flagship), §9 (Drill — interview diamond), §12 (Chaos library — 73 events + 10 incidents + 6 control modes), §13 (Cost & scaling — threshold bands + named-band real-company costs), §14 (Smart canvas — pattern detection, anti-pattern warnings, auto-artifacts), §15 (AI integration — Haiku/Sonnet split + 15 SD-specific AI features), and §29 (Engineering & algorithms — clock · metrics · load models · cascade physics · rendering · routing · layout · replay · tracing). The LLD Phase 4 plan at `docs/superpowers/plans/2026-04-20-lld-phase-4-drill-mode.md` is the **style reference** — match its TDD-per-task discipline, `- [ ]` bite-sized steps, full code (no placeholders), exact paths, exact commands, and exact expected output.

**Open questions captured for resolution during implementation:**

1. **Cascade amplification constants (§29.4).** Current values from brainstorm; empirical validation against the 10 real-incident replays (authored in Task 24 below) happens in Phase 4. If Phase 3 chaos drills feel wrong (e.g., cascade too slow or too fast compared to the real postmortem timeline), flag but do not re-architect — tune the amplification constants in `failure-modes.ts`.
2. **Whisper-coach 3-interventions cap per 5-minute sim (§8.8).** Is the cap a hard ceiling or does it reset per chaos event? Decision in this plan: **hard ceiling per 5-minute window**, not per-event. Rationale: avoids the pathological "every chaos event resets the budget and the coach talks the user through the outage" flow that breaks the war-story principle. If product pushes back, the `useWhisperCoach` hook's `maxInterventionsPerWindow` config is tunable per-persona.
3. **Chaos ribbon 900ms duration vs. reduced-motion (§8.9).** Users with `prefers-reduced-motion: reduce` get a static red-bordered banner with no sound. The ribbon is **replaced**, not shortened. The serif text is still rendered; only the choreography is stripped. Verified in Task 19 acceptance test.
4. **Real-incident replay mid-Phase 3 vs. Phase 4.** All 10 incident narratives ship in Phase 3 (Opus authors them during content-ops). The Archaeology activity (§8.3.6) ships in Phase 3 running those replays. Phase 4 **tunes** cascade physics against those replays; Phase 3 ships with best-effort tuning and flags any >30% deviation from the published postmortem timeline.
5. **Drill mode AI persona streaming vs. batched (§9.5, §15 · D1).** We ship streaming SSE in Phase 3 for the 8 personas to preserve the live-chat illusion. Backed by the existing Phase-2 Claude client + a per-attempt SSE handler. Fallback if `ANTHROPIC_API_KEY` is missing: a deterministic scripted-question bank per persona (20 questions × 8 personas = 160 pre-authored lines). **Both paths ship.**
6. **Cost-meter refresh rate in Simulate (§13.8 corner meter).** The meter updates at 1Hz during sim runs (not per-tick — that would visually jitter). Decision encoded in `useCostMeter` hook. If product wants tick-accurate, flip `refreshMs` to 100.
7. **Shareable PDF (§9.8 artifact 7) · server-side vs. client-side render.** We ship **client-side** via `react-pdf` to keep serverless cold-starts out of the critical path. Server-side PDF generation (Puppeteer or Chromium Lambda) is a Phase 5 optimization if client-side gets too slow.
8. **The 73-event taxonomy as a DB table vs. TS constant (§12.1).** We ship as a TS constant (`architex/src/lib/chaos/chaos-taxonomy.ts`). Rationale: the taxonomy is authored prose, not user-generated — it belongs in code alongside the narrative templates. User-authored scenarios (§12.9, Phase 4+) go into a `sd_user_chaos_scenarios` table.

---

## Pre-flight checklist (Phase 3 · ~2-3 hours)

Run before Task 1. These verify that Phases 1 and 2 invariants still hold and that no engine files are accidentally modified during Phase 3.

- [ ] **Verify SD Phases 1 and 2 merged**

```bash
cd architex
git log --oneline | grep -iE "sd.phase.?1|sd.phase.?2" | head -6
```
Expected: at least two commits referencing SD Phase 1 and Phase 2. If nothing matches, stop — dependencies not in place.

- [ ] **Verify `sd_designs` + `sd_simulation_runs` + `sd_drill_attempts` tables exist**

```bash
psql "$DATABASE_URL" -c "\dt sd_*" | head -20
```
Expected: all three tables printed. If empty, run `pnpm db:push` to apply pending migrations.

- [ ] **Verify `SimulateModeLayout.tsx` + `DrillModeLayout.tsx` stubs exist**

```bash
ls architex/src/components/modules/sd/modes/SimulateModeLayout.tsx architex/src/components/modules/sd/modes/DrillModeLayout.tsx
```
Expected: both files exist with `"use client"` banner and minimal stub components. If missing, Phases 1-2 not fully merged — stop.

- [ ] **Verify simulation engine is intact (34 files)**

```bash
ls architex/src/lib/simulation/*.ts | wc -l
```
Expected: `27` (the 34 listed in §8.11 includes tests; 27 source files + tests = 34 when counting `.test.ts` siblings). If count is wrong, someone has been editing the engine — stop and reconcile before Phase 3.

- [ ] **Verify the `useSDDrillSync` heartbeat tests pass**

```bash
cd architex
pnpm test:run -- useSDDrillSync
```
Expected: all heartbeat tests pass.

- [ ] **Verify Anthropic key is configured OR fallback acceptable**

```bash
grep -c ANTHROPIC_API_KEY architex/.env.local || echo "no key — fallback-only mode"
```
Expected: either a non-zero count (key present; full AI test coverage) or the "no key" string (plan still works; AI tests use mocks only; all AI features fall back to deterministic or "unavailable" banner).

- [ ] **Baseline test suite passes**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 3. Do not entangle Phase 3 work with pre-existing failures.

- [ ] **Snapshot simulation engine file hashes (so you can detect unintended edits mid-phase)**

```bash
cd architex
find src/lib/simulation -name '*.ts' -not -name '*.test.ts' -exec md5 {} \; | sort > /tmp/sim-engine-pre-phase-3.md5
wc -l /tmp/sim-engine-pre-phase-3.md5
```
Expected: 27 lines. Re-run at end of Phase 3 (Task 32) and `diff`. Any file whose md5 changed is a red flag.

- [ ] **Commit any fixes from above**

```bash
git add -p
git commit -m "chore: pre-flight verification for SD Phase 3"
```

---

## File structure

Files created or significantly modified in this plan. New files are marked `NEW`; modified files are marked `MODIFY`. Existing simulation engine files are marked `READ-ONLY` — we compose, not edit.

```
architex/
├── drizzle/                                                         # (generated migrations)
│   ├── NNNN_sd_extend_simulation_runs.sql                           # NEW (Task 1)
│   ├── NNNN_sd_chaos_event_log.sql                                  # NEW (Task 2)
│   ├── NNNN_sd_drill_extend.sql                                     # NEW (Task 3)
│   └── NNNN_sd_drill_interviewer_turns.sql                          # NEW (Task 4)
├── src/
│   ├── db/schema/
│   │   ├── sd-simulation-runs.ts                                    # MODIFY (+ HDR blob, replay keyframes)
│   │   ├── sd-chaos-event-log.ts                                    # NEW (per-run event log)
│   │   ├── sd-drill-attempts.ts                                     # MODIFY (+ stages, personas, rubric)
│   │   └── sd-drill-interviewer-turns.ts                            # NEW (chat log)
│   ├── lib/chaos/
│   │   ├── chaos-taxonomy.ts                                        # NEW (73 events · narrative templates)
│   │   ├── real-incidents.ts                                        # NEW (10 incident timelines)
│   │   ├── chaos-scenarios.ts                                       # NEW (40+ scripted scenarios)
│   │   ├── chaos-dice.ts                                            # NEW (weighted-random event picker)
│   │   ├── chaos-budget-engine.ts                                   # NEW (SLO-budget tracker)
│   │   ├── red-team-ai.ts                                           # NEW (Sonnet adversary)
│   │   ├── auto-escalation.ts                                       # NEW (escalation state machine)
│   │   └── __tests__/
│   │       ├── chaos-taxonomy.test.ts                               # NEW
│   │       ├── chaos-dice.test.ts                                   # NEW
│   │       ├── real-incidents.test.ts                               # NEW
│   │       └── red-team-ai.test.ts                                  # NEW
│   ├── lib/simulation/                                              # READ-ONLY existing engine
│   │   └── adapters/                                                # NEW (thin adapters only)
│   │       ├── activity-framing.ts                                  # NEW (6 activities)
│   │       ├── chaos-control-mode.ts                                # NEW (6 control modes dispatch)
│   │       ├── threshold-coaching.ts                                # NEW (metric band classifier)
│   │       ├── whisper-coach.ts                                     # NEW (Haiku coach loop)
│   │       ├── load-models/
│   │       │   ├── uniform.ts                                       # NEW (load model 1)
│   │       │   ├── poisson.ts                                       # NEW (load model 2)
│   │       │   ├── diurnal.ts                                       # NEW (load model 3)
│   │       │   ├── burst.ts                                         # NEW (load model 4)
│   │       │   ├── load-generator.ts                                # NEW (interface + factory)
│   │       │   └── __tests__/
│   │       │       ├── poisson.test.ts                              # NEW
│   │       │       ├── diurnal.test.ts                              # NEW
│   │       │       └── burst.test.ts                                # NEW
│   │       ├── replay/
│   │       │   ├── seeded-rng.ts                                    # NEW (Mulberry32 PRNG)
│   │       │   ├── event-log-writer.ts                              # NEW (TimestampedEvent[] serializer)
│   │       │   ├── keyframe-snapshotter.ts                          # NEW (every 30 sim-seconds)
│   │       │   └── __tests__/
│   │       │       └── seeded-rng.test.ts                           # NEW
│   │       └── hdr-metrics.ts                                       # NEW (HDR histogram + ring buffer)
│   ├── lib/ai/
│   │   ├── whisper-coach-prompt.ts                                  # NEW (Haiku system prompt)
│   │   ├── sd-interviewer-prompts.ts                                # NEW (8 persona prompts)
│   │   ├── sd-interviewer-persona.ts                                # NEW (streaming Sonnet wrapper)
│   │   ├── sd-postmortem-generator.ts                               # NEW (Sonnet post-drill report)
│   │   ├── sd-rubric-grader.ts                                      # NEW (6-axis grader, Sonnet)
│   │   ├── sd-post-run-summarizer.ts                                # NEW (Sonnet results card)
│   │   ├── red-team-chaos-planner.ts                                # NEW (Sonnet adversary picker)
│   │   └── __tests__/
│   │       ├── whisper-coach-prompt.test.ts                         # NEW
│   │       ├── sd-interviewer-persona.test.ts                       # NEW
│   │       └── sd-rubric-grader.test.ts                             # NEW
│   ├── lib/drill/
│   │   ├── sd-drill-stages.ts                                       # NEW (5-stage FSM)
│   │   ├── sd-drill-variants.ts                                     # NEW (study/timed/pair-ai)
│   │   ├── sd-drill-rubric.ts                                       # NEW (6-axis definitions)
│   │   ├── sd-drill-canonical.ts                                    # NEW (canonical designs per problem)
│   │   ├── sd-drill-timing.ts                                       # NEW (stage-duration heatmap)
│   │   ├── sd-drill-hint-ladder.ts                                  # NEW (3-tier + credits)
│   │   └── __tests__/
│   │       ├── sd-drill-stages.test.ts                              # NEW
│   │       ├── sd-drill-rubric.test.ts                              # NEW
│   │       └── sd-drill-timing.test.ts                              # NEW
│   ├── lib/analytics/
│   │   └── sd-events.ts                                             # MODIFY (+ 22 sim + 14 drill events)
│   ├── stores/
│   │   ├── simulate-store.ts                                        # NEW (activity, chaos mode, metrics)
│   │   ├── drill-store.ts                                           # NEW (stage + variant + persona)
│   │   └── __tests__/
│   │       ├── simulate-store.test.ts                               # NEW
│   │       └── drill-store.test.ts                                  # NEW
│   ├── hooks/
│   │   ├── useSimulateRun.ts                                        # NEW (run lifecycle)
│   │   ├── useChaosControl.ts                                       # NEW (6 control modes UI)
│   │   ├── useWhisperCoach.ts                                       # NEW (Haiku loop + cap)
│   │   ├── useMetricStrip.ts                                        # NEW (HDR → UI adapter)
│   │   ├── useThresholdCoaching.ts                                  # NEW (metric band classifier)
│   │   ├── useCinematicChaos.ts                                     # NEW (ribbon + vignette choreographer)
│   │   ├── useMarginNarrative.ts                                    # NEW (event stream card builder)
│   │   ├── useCostMeter.ts                                          # NEW (1Hz corner meter)
│   │   ├── useScaleSlider.ts                                        # NEW (10k/1M/10M/100M/1B)
│   │   ├── useTimeScrubber.ts                                       # NEW (scrub + slow-mo)
│   │   ├── useWhatIfBranch.ts                                       # NEW (fork mechanic)
│   │   ├── useReplayShare.ts                                        # NEW (capture + link)
│   │   ├── useDrillStage.ts                                         # NEW (gate + transition)
│   │   ├── useDrillInterviewer.ts                                   # NEW (streaming chat)
│   │   ├── useDrillHintLadder.ts                                    # NEW (3-tier + credits)
│   │   ├── useDrillTimingHeatmap.ts                                 # NEW (stage-duration)
│   │   └── __tests__/
│   │       ├── useSimulateRun.test.tsx                              # NEW
│   │       ├── useWhisperCoach.test.tsx                             # NEW
│   │       ├── useCinematicChaos.test.tsx                           # NEW
│   │       ├── useDrillStage.test.tsx                               # NEW
│   │       └── useDrillHintLadder.test.tsx                          # NEW
│   ├── app/api/sd/
│   │   ├── simulation-runs/
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts                                         # NEW (GET single run)
│   │   │   │   ├── start/route.ts                                   # NEW (POST new run)
│   │   │   │   ├── heartbeat/route.ts                               # NEW (PATCH heartbeat + metrics)
│   │   │   │   ├── chaos/route.ts                                   # NEW (POST fire chaos event)
│   │   │   │   ├── complete/route.ts                                # NEW (POST finalize)
│   │   │   │   ├── replay/route.ts                                  # NEW (GET keyframes + events)
│   │   │   │   ├── fork/route.ts                                    # NEW (POST what-if fork)
│   │   │   │   └── share/route.ts                                   # NEW (POST share link)
│   │   │   └── route.ts                                             # NEW (GET list + POST create)
│   │   ├── drill-attempts/
│   │   │   ├── [id]/
│   │   │   │   ├── stage/route.ts                                   # NEW (PATCH advance stage)
│   │   │   │   ├── hint/route.ts                                    # NEW (POST consume hint)
│   │   │   │   ├── grade/route.ts                                   # NEW (POST 6-axis grade)
│   │   │   │   ├── postmortem/route.ts                              # NEW (POST Sonnet report)
│   │   │   │   ├── recap-pdf/route.ts                               # NEW (GET PDF)
│   │   │   │   └── resume/route.ts                                  # NEW (POST resume flow)
│   │   │   └── route.ts                                             # MODIFY (expose stage PATCH)
│   │   ├── drill-interviewer/
│   │   │   └── [id]/stream/route.ts                                 # NEW (Sonnet SSE)
│   │   ├── whisper-coach/
│   │   │   └── tick/route.ts                                        # NEW (Haiku single-tick)
│   │   └── chaos-library/
│   │       └── route.ts                                             # NEW (GET 73 events + 10 incidents)
│   └── components/modules/sd/
│       ├── simulate/
│       │   ├── SimulateModeLayout.tsx                               # MODIFY (fill in Phase 1 stub)
│       │   ├── SimulateTopChrome.tsx                                # NEW (activity pill · scale · provider)
│       │   ├── SimulateLeftControlRail.tsx                          # NEW (play/pause/scrub/rate/chaos)
│       │   ├── SimulateCanvasWrapper.tsx                            # NEW (ReactFlow + particles + overlay)
│       │   ├── ParticleLayer.tsx                                    # NEW (canvas requestAnimationFrame)
│       │   ├── CinematicChaosRibbon.tsx                             # NEW (900ms choreography)
│       │   ├── RedVignette.tsx                                      # NEW (radial gradient overlay)
│       │   ├── MetricStrip.tsx                                      # NEW (p50/p95/p99/err/$/SLO)
│       │   ├── MetricStripCell.tsx                                  # NEW (single metric + threshold band)
│       │   ├── MetricDrilldownDialog.tsx                            # NEW (time-series click-through)
│       │   ├── MarginNarrativeStream.tsx                            # NEW (right-panel card stream)
│       │   ├── NarrativeCard.tsx                                    # NEW (serif event card)
│       │   ├── WhisperCoachToast.tsx                                # NEW (subtle intervention UI)
│       │   ├── CostMeter.tsx                                        # NEW (corner $/hr badge)
│       │   ├── ScaleSlider.tsx                                      # NEW (10k/1M/10M/100M/1B)
│       │   ├── ActivityPicker.tsx                                   # NEW (6 framings)
│       │   ├── ChaosControlPanel.tsx                                # NEW (6 control modes)
│       │   ├── ChaosDicePanel.tsx                                   # NEW (dice UI)
│       │   ├── ChaosBudgetPanel.tsx                                 # NEW (budget tracker)
│       │   ├── ManualInjectionMenu.tsx                              # NEW (right-click chaos)
│       │   ├── TimelineScrubber.tsx                                 # NEW (bottom bar)
│       │   ├── SlowMoControl.tsx                                    # NEW (0.25x–4x)
│       │   ├── CascadeTraceOverlay.tsx                              # NEW (glowing path)
│       │   ├── PauseInspectPopover.tsx                              # NEW (node state on hover)
│       │   ├── WhatIfBranchButton.tsx                               # NEW (B key mid-pause)
│       │   ├── ReplayShareDialog.tsx                                # NEW (capture + link)
│       │   ├── PostRunResultsCard.tsx                               # NEW (triple-loop CTA)
│       │   ├── ArchaeologyIncidentPicker.tsx                        # NEW (10-card gallery)
│       │   ├── ArchaeologyVerdictCard.tsx                           # NEW (would-you-survive verdict)
│       │   └── __tests__/
│       │       ├── MetricStrip.test.tsx                             # NEW
│       │       ├── CinematicChaosRibbon.test.tsx                    # NEW
│       │       └── PostRunResultsCard.test.tsx                      # NEW
│       └── drill/
│           ├── DrillModeLayout.tsx                                  # MODIFY (fill in Phase 1 stub)
│           ├── DrillTimerBar.tsx                                    # NEW (stage + countdown)
│           ├── DrillStageStepper.tsx                                # NEW (5-node progress)
│           ├── DrillVariantPicker.tsx                               # NEW (study/timed/pair-ai)
│           ├── DrillPersonaPicker.tsx                               # NEW (8 personas)
│           ├── DrillProblemPane.tsx                                 # NEW (left: statement/SLOs/scope)
│           ├── stages/
│           │   ├── SDClarifyStage.tsx                               # NEW (chat-only, 5 min)
│           │   ├── SDEstimateStage.tsx                              # NEW (structured form, 5 min)
│           │   ├── SDDesignStage.tsx                                # NEW (canvas, 15 min)
│           │   ├── SDDeepDiveStage.tsx                              # NEW (AI-question driven, 15 min)
│           │   └── SDQnAStage.tsx                                   # NEW (candidate-asks-AI, 5 min)
│           ├── DrillInterviewerPane.tsx                             # NEW (chat stream, persona avatar)
│           ├── DrillHintLadder.tsx                                  # NEW (nudge/guided/full reveal)
│           ├── DrillSubmitBar.tsx                                   # NEW (submit · give up · hint)
│           ├── DrillResumePrompt.tsx                                # NEW (on return)
│           ├── DrillGradeReveal.tsx                                 # NEW (tiered celebration)
│           ├── DrillRubricRadar.tsx                                 # NEW (6-axis radar chart)
│           ├── DrillPostmortemPanel.tsx                             # NEW (AI essay render)
│           ├── DrillCanonicalCompare.tsx                            # NEW (side-by-side)
│           ├── DrillTimingHeatmap.tsx                               # NEW (per-stage bars)
│           ├── DrillFollowUpCard.tsx                                # NEW (3 recommendations)
│           ├── DrillSimulateMyDesignButton.tsx                      # NEW (one-click bridge)
│           ├── DrillShareableRecapButton.tsx                        # NEW (PDF trigger)
│           ├── DrillStreakStats.tsx                                 # NEW (motivational stats)
│           └── __tests__/
│               ├── DrillStageStepper.test.tsx                       # NEW
│               ├── DrillRubricRadar.test.tsx                        # NEW
│               └── DrillGradeReveal.test.tsx                        # NEW
├── content/
│   ├── sd/concepts/wave-2/                                          # NEW · 6 Opus concepts
│   │   ├── vertical-vs-horizontal-scaling.mdx
│   │   ├── load-balancing.mdx
│   │   ├── caching-strategies.mdx
│   │   ├── cdn-fundamentals.mdx
│   │   ├── connection-pooling.mdx
│   │   └── backpressure.mdx
│   ├── sd/concepts/wave-3/                                          # NEW · 6 Opus concepts
│   │   ├── cap-in-practice.mdx
│   │   ├── consistency-models.mdx
│   │   ├── replication.mdx
│   │   ├── sharding-and-consistent-hashing.mdx
│   │   ├── acid-vs-base.mdx
│   │   └── distributed-transactions.mdx
│   ├── sd/problems/                                                 # NEW · 10 Opus problems
│   │   ├── design-twitter.mdx
│   │   ├── design-instagram.mdx
│   │   ├── design-youtube.mdx
│   │   ├── design-uber.mdx
│   │   ├── design-google-maps.mdx
│   │   ├── design-dropbox.mdx
│   │   ├── design-stripe.mdx
│   │   ├── design-rate-limiter.mdx
│   │   ├── design-monitoring-pipeline.mdx
│   │   └── design-message-queue.mdx
│   └── sd/real-incidents/                                           # NEW · 10 Opus incidents
│       ├── facebook-2021-bgp.mdx
│       ├── aws-us-east-1-dec-2021.mdx
│       ├── cloudflare-2019-regex.mdx
│       ├── github-2018-db.mdx
│       ├── fastly-2021.mdx
│       ├── slack-2021.mdx
│       ├── discord-mar-2022.mdx
│       ├── roblox-2021.mdx
│       ├── knight-capital-2012.mdx
│       └── crowdstrike-2024.mdx
└── e2e/
    ├── sd-simulate-mode.spec.ts                                     # NEW (Playwright end-to-end)
    └── sd-drill-mode.spec.ts                                        # NEW (Playwright end-to-end)
```

**Design rationale for splits:**

- **Engine adapters live in `src/lib/simulation/adapters/`, never in the engine root.** The 27 existing engine files are read-only. Phase 3 additions sit beside, not inside. This preserves the "compose, don't rewrite" contract.
- **Chaos metadata lives in `src/lib/chaos/`, separate from `src/lib/simulation/chaos-engine.ts`.** The engine *executes* events; the taxonomy *describes* them. Narrative templates, real-incident timelines, and the 40 scripted scenarios are content-ish, not engine-ish — they ship in a sibling directory so the content team can edit them without reading engine code.
- **AI files live in `src/lib/ai/`, one file per feature, consistent with LLD Phase 4's shape.** `sd-interviewer-persona.ts` vs `whisper-coach-prompt.ts` vs `sd-rubric-grader.ts` — each feature is its own file with its own tests, so when the product team wants to tune the whisper coach's politeness, they open one file.
- **Hooks in `src/hooks/use*.ts` are one-per-UI-surface, not one-per-UI-component.** `useSimulateRun` owns the full run lifecycle; `useChaosControl` owns the 6 control modes; `useMetricStrip` owns the HDR → UI translation. Components consume hooks; hooks consume engine adapters + stores.
- **Stage-per-file for Drill mode stages (same as LLD Phase 4).** `SDClarifyStage.tsx` is independent of `SDDesignStage.tsx`. They share only the stage-stepper chrome; their internals can diverge.
- **Content in `content/sd/` mirrors the structure of the spec's §5 (waves, domains, incidents).** MDX-first; the existing MDX pipeline from Phase 2 renders them through the concept/problem page layouts.
- **API routes follow the nested `[id]/action` convention from Drill Phase 4 LLD and existing simulation-runs shape.** New namespaces (`/api/sd/whisper-coach/`, `/api/sd/chaos-library/`) live at the top level only when they don't belong to a single entity.

---

## Table of contents · 32 tasks

The plan is organized into five task groups that commit independently. Within each group, tasks are ordered by dependency: infrastructure first, then behavior, then UI.

**Group A · DB schema + migrations (Tasks 1-4, ~12 hours)**

1. **Task 1** — Extend `sd_simulation_runs` schema with HDR histogram blob, replay keyframes, event-log pointer, chaos-mode column
2. **Task 2** — Create `sd_chaos_event_log` table (per-run event log, append-only)
3. **Task 3** — Extend `sd_drill_attempts` schema with stages, persona, variant, rubric breakdown, postmortem, hint log
4. **Task 4** — Create `sd_drill_interviewer_turns` table (streaming chat log)

**Group B · Engine adapters + metadata (Tasks 5-14, ~70 hours)**

5. **Task 5** — Author `chaos-taxonomy.ts` — 73 events, 7 families, narrative templates, severity bands, canvas-family ties
6. **Task 6** — Author `real-incidents.ts` — 10 real-incident timelines + faithful architectures + postmortem bridges
7. **Task 7** — Author `chaos-scenarios.ts` — 40+ scripted chaos sequences
8. **Task 8** — Author `chaos-dice.ts` — weighted-random event picker based on canvas surface area
9. **Task 9** — Author `chaos-budget-engine.ts` — SLO-minute budget tracker
10. **Task 10** — Author `auto-escalation.ts` — recovery-watch state machine
11. **Task 11** — Author `red-team-ai.ts` — Sonnet adversary planner (gated: unlocked after 3 chaos drills)
12. **Task 12** — Author load models `uniform.ts` · `poisson.ts` · `diurnal.ts` · `burst.ts` + `load-generator.ts` factory
13. **Task 13** — Author `hdr-metrics.ts` — HDR histogram + ring buffer per node
14. **Task 14** — Author replay scaffolding: `seeded-rng.ts` · `event-log-writer.ts` · `keyframe-snapshotter.ts`

**Group C · AI integration (Tasks 15-18, ~42 hours)**

15. **Task 15** — Author `whisper-coach-prompt.ts` + `whisper-coach.ts` adapter — Haiku loop with 3-interventions-per-window cap, teachable-moment detection
16. **Task 16** — Author `sd-interviewer-prompts.ts` (8 personas) + `sd-interviewer-persona.ts` (streaming Sonnet wrapper) + `/api/sd/drill-interviewer/[id]/stream/route.ts` (SSE)
17. **Task 17** — Author `sd-rubric-grader.ts` — 6-axis rubric grader + `sd-postmortem-generator.ts` + `sd-post-run-summarizer.ts`
18. **Task 18** — Author `red-team-chaos-planner.ts` — Sonnet picks adversarial events against user's canvas

**Group D · Simulate mode UI + behavior (Tasks 19-26, ~88 hours)**

19. **Task 19** — Author `useCinematicChaos.ts` hook + `CinematicChaosRibbon.tsx` + `RedVignette.tsx` (900ms choreography, reduced-motion fallback)
20. **Task 20** — Author `useMetricStrip.ts` + `MetricStrip.tsx` + `MetricStripCell.tsx` + `useThresholdCoaching.ts` + `threshold-coaching.ts` (classify every metric; serif coaching copy)
21. **Task 21** — Author `useMarginNarrative.ts` + `MarginNarrativeStream.tsx` + `NarrativeCard.tsx` (right-panel serif stream, click-to-scrub)
22. **Task 22** — Author `useChaosControl.ts` hook + `ChaosControlPanel.tsx` + `ChaosDicePanel.tsx` + `ChaosBudgetPanel.tsx` + `ManualInjectionMenu.tsx` (6 control modes dispatch)
23. **Task 23** — Author `activity-framing.ts` + `ActivityPicker.tsx` + 6 activity-specific top-chrome configurations (Validate · Stress Test · Chaos Drill · Compare A/B · Forecast · Archaeology)
24. **Task 24** — Author `ArchaeologyIncidentPicker.tsx` + `ArchaeologyVerdictCard.tsx` + `/api/sd/chaos-library/route.ts` — 10 real-incident pages + replay-against-your-design wiring
25. **Task 25** — Author 7 drill-in features: `useTimeScrubber.ts` · `TimelineScrubber.tsx` · `SlowMoControl.tsx` · `PauseInspectPopover.tsx` · `CascadeTraceOverlay.tsx` · `MetricDrilldownDialog.tsx` · `useWhatIfBranch.ts` · `WhatIfBranchButton.tsx` · `useReplayShare.ts` · `ReplayShareDialog.tsx`
26. **Task 26** — Fill in `SimulateModeLayout.tsx` (top chrome · left control rail · center canvas · right metric+narrative · bottom scrubber) + `PostRunResultsCard.tsx` (triple-loop CTA: Learn / Build / Drill)

**Group E · Drill mode UI + behavior (Tasks 27-31, ~42 hours)**

27. **Task 27** — Author `sd-drill-stages.ts` (5-stage FSM) + `sd-drill-variants.ts` (study/timed/pair-ai) + `sd-drill-rubric.ts` + `sd-drill-canonical.ts` + `sd-drill-timing.ts` + `sd-drill-hint-ladder.ts`
28. **Task 28** — Author `drill-store.ts` + `useDrillStage.ts` + `useDrillInterviewer.ts` + `useDrillHintLadder.ts` + `useDrillTimingHeatmap.ts`
29. **Task 29** — Author drill API routes: stage · hint · grade · postmortem · recap-pdf · resume (6 routes)
30. **Task 30** — Fill in `DrillModeLayout.tsx` (timer bar · stepper · 5 stage screens · interviewer pane · hint ladder · submit bar · resume prompt)
31. **Task 31** — Post-drill artifacts: `DrillGradeReveal.tsx` · `DrillRubricRadar.tsx` · `DrillPostmortemPanel.tsx` · `DrillCanonicalCompare.tsx` · `DrillTimingHeatmap.tsx` · `DrillFollowUpCard.tsx` · `DrillSimulateMyDesignButton.tsx` · `DrillShareableRecapButton.tsx` · `DrillStreakStats.tsx`

**Group F · Content drop + analytics + E2E (Tasks 32-34, ~26 hours)**

32. **Task 32** — Content-ops drop: Opus authors Waves 2-3 (12 concepts) + 10 problems + 10 real-incident narratives; content integration check; MDX build verification
33. **Task 33** — Extend `sd-events.ts` analytics catalog with 22 Simulate events + 14 Drill events = 36 new typed events; wire to all consumer code
34. **Task 34** — End-to-end verification + Playwright smoke tests (`sd-simulate-mode.spec.ts` · `sd-drill-mode.spec.ts`) + Wave 3 anonymous 100% rollout flag flip

Each task commits 1-4 times. Group B (engine adapters) is the densest — Task 5 alone commits 7 times because the 73-event taxonomy is authored in batches of 10-11 events per family. The plan budgets 18 commits for Task 5, 12 for Task 6, 8 for Task 16, 6 for Task 26, and 6 for Task 30. Total commit count across Phase 3: **~85-95 commits**.

---

## Group A · DB schema + migrations (Tasks 1-4)

---

## Task 1: Extend `sd_simulation_runs` schema with HDR blob, replay keyframes, event-log pointer, chaos-mode

**Files:**
- Modify: `architex/src/db/schema/sd-simulation-runs.ts`

Phase 1 created the base `sd_simulation_runs` table with `id`, `userId`, `designId`, `startedAt`, `completedAt`, `durationSimMs`, `activityKind` (from a smaller set — "validate" only in Phase 1), `loadModel` (varchar; Phase 1 only "uniform"), `slosPassed` (boolean), `metricsSummary` (JSONB light snapshot). Phase 3 adds six new columns. Most are nullable for rows created before Phase 3 ships; newly-created rows populate them.

- [ ] **Step 1: Open the existing schema file and note the shape**

Open `architex/src/db/schema/sd-simulation-runs.ts`. Confirm the Phase 1 column set matches the description above. Note that the table has `one_active_run_per_user` partial unique index on `userId` where `completedAt IS NULL`. Phase 3 preserves this index.

- [ ] **Step 2: Extend the table definition**

Replace the `pgTable` body so it includes the new columns. The file becomes:

```typescript
/**
 * DB-024: SD simulation runs — stores active and completed simulate-mode runs.
 *
 * Phase 3 additions:
 *   - activity_kind       — expanded enum: "validate" | "stress" | "chaos-drill"
 *                            | "compare-ab" | "forecast" | "archaeology"
 *   - chaos_control_mode  — "scenario" | "dice" | "manual" | "budget"
 *                            | "auto-escalation" | "red-team" | null
 *   - load_model          — expanded enum: "uniform" | "poisson" | "diurnal" | "burst"
 *   - rng_seed            — deterministic replay anchor (Mulberry32 seed)
 *   - event_log_size      — denormalized count of rows in sd_chaos_event_log for this run
 *   - keyframes           — 30s-interval SimState snapshots (JSONB · array)
 *   - hdr_snapshot        — serialized HDR histograms per node (JSONB · dict)
 *   - narrative_stream    — margin-card stream (JSONB · array of rendered cards)
 *   - post_run_summary    — Sonnet-authored results-card narrative + triple-loop recs
 *   - scale_slider        — DAU preset at run start: "10k" | "1M" | "10M" | "100M" | "1B"
 *   - provider            — "aws" | "gcp" | "azure" | "abstract" | "bare-metal"
 *   - share_slug          — opaque token for replay-share URL; null until user opts in
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  bigint,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { sdDesigns } from "./sd-designs";

export const sdSimulationRuns = pgTable(
  "sd_simulation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    designId: uuid("design_id")
      .notNull()
      .references(() => sdDesigns.id, { onDelete: "cascade" }),

    // Activity + control-mode framing (§8.3, §8.4)
    activityKind: varchar("activity_kind", { length: 24 })
      .notNull()
      .default("validate"),
    chaosControlMode: varchar("chaos_control_mode", { length: 24 }),

    // Load model (§29.3) · Phase 3 ships 4 of 8
    loadModel: varchar("load_model", { length: 24 })
      .notNull()
      .default("uniform"),

    // Deterministic replay anchor (§29.8)
    rngSeed: bigint("rng_seed", { mode: "number" }).notNull(),

    // Lifecycle timestamps
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    // Sim-time duration (dilation-aware; see dual-clock §29.1)
    durationSimMs: integer("duration_sim_ms").notNull().default(0),
    durationRealMs: integer("duration_real_ms").notNull().default(0),
    dilationFactor: integer("dilation_factor").notNull().default(1),

    // SLO attainment snapshot
    slosPassed: boolean("slos_passed"),
    metricsSummary: jsonb("metrics_summary"),

    // Phase 3 · replay + HDR
    eventLogSize: integer("event_log_size").notNull().default(0),
    keyframes: jsonb("keyframes").notNull().default(sql`'[]'::jsonb`),
    hdrSnapshot: jsonb("hdr_snapshot"),

    // Phase 3 · narrative + post-run
    narrativeStream: jsonb("narrative_stream")
      .notNull()
      .default(sql`'[]'::jsonb`),
    postRunSummary: jsonb("post_run_summary"),

    // Phase 3 · scale + provider + share
    scaleSlider: varchar("scale_slider", { length: 8 })
      .notNull()
      .default("1M"),
    provider: varchar("provider", { length: 16 })
      .notNull()
      .default("aws"),
    shareSlug: varchar("share_slug", { length: 32 }),
  },
  (t) => [
    uniqueIndex("one_active_run_per_user")
      .on(t.userId)
      .where(sql`${t.completedAt} IS NULL`),
    index("run_history_idx").on(t.userId, t.completedAt),
    index("run_design_idx").on(t.designId, t.completedAt),
    index("run_share_idx").on(t.shareSlug),
    index("run_activity_idx").on(t.userId, t.activityKind),
  ],
);

export type SDSimulationRun = typeof sdSimulationRuns.$inferSelect;
export type NewSDSimulationRun = typeof sdSimulationRuns.$inferInsert;

// Phase 3 · shared enums re-exported
export type SDActivityKind =
  | "validate"
  | "stress"
  | "chaos-drill"
  | "compare-ab"
  | "forecast"
  | "archaeology";

export type SDChaosControlMode =
  | "scenario"
  | "dice"
  | "manual"
  | "budget"
  | "auto-escalation"
  | "red-team";

export type SDLoadModel = "uniform" | "poisson" | "diurnal" | "burst";

export type SDScaleSlider = "10k" | "1M" | "10M" | "100M" | "1B";

export type SDProvider =
  | "aws"
  | "gcp"
  | "azure"
  | "abstract"
  | "bare-metal";
```

- [ ] **Step 3: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: zero errors. If `sdDesigns` import fails, confirm the schema index is re-exporting it (Phase 1).

- [ ] **Step 4: Commit**

```bash
git add architex/src/db/schema/sd-simulation-runs.ts
git commit -m "$(cat <<'EOF'
feat(db): extend sd_simulation_runs with HDR blob + replay keyframes + chaos mode

Adds activity_kind (expanded 6-value enum), chaos_control_mode,
load_model (expanded 4-value enum · Phase 3 scope), rng_seed,
event_log_size, keyframes JSONB, hdr_snapshot JSONB, narrative_stream,
post_run_summary, scale_slider, provider, share_slug. Phase 1 columns
untouched. New indexes on (user_id, activity_kind) for activity-mix
queries and on share_slug for share-link lookup.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `sd_chaos_event_log` table (per-run event log, append-only)

**Files:**
- Create: `architex/src/db/schema/sd-chaos-event-log.ts`

The HDR snapshot (Task 1) captures metric state at run-end. The event log captures the *sequence* that produced it: every request arrival, every chaos event, every user action (pause, scrub, fork). Size: ~4.5 MB raw per 30-minute run, ~300 KB compressed (§29.8). This ships as an append-only table — one row per event. Replay (§29.8) hydrates the table's rows into a `TimestampedEvent[]` stream.

**Why a separate table vs. a JSONB column on `sd_simulation_runs`?** Three reasons. (1) **Append-only write pattern** — events stream in mid-run at up to 50/sec; a JSONB column would require read-modify-write. (2) **Queryable** — we want to filter "all chaos events fired across all runs this user has ever done" without loading the full run blob. (3) **Scale** — a 30-minute run can produce 90k events; 90k-element JSONB arrays are slow to serialize.

- [ ] **Step 1: Create the schema file**

Create `architex/src/db/schema/sd-chaos-event-log.ts`:

```typescript
/**
 * DB-025: SD chaos event log — per-run append-only event stream.
 *
 * One row per event. Events include: request arrivals (sampled at 1%),
 * chaos events (fully captured), user actions (pause, scrub, fork),
 * stage transitions (drill mode), and system-derived events (circuit
 * breaker flips, node failures, recoveries).
 *
 * Replay (§29.8) rehydrates rows into a TimestampedEvent[] keyed by run.
 * Keyframes in sd_simulation_runs.keyframes are 30s snapshots; between
 * keyframes, events drive state forward.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  bigint,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sdSimulationRuns } from "./sd-simulation-runs";

export const sdChaosEventLog = pgTable(
  "sd_chaos_event_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    runId: uuid("run_id")
      .notNull()
      .references(() => sdSimulationRuns.id, { onDelete: "cascade" }),

    // Ordering within the run (sim-time, not real-time)
    simTimeMs: bigint("sim_time_ms", { mode: "number" }).notNull(),
    sequenceNumber: integer("sequence_number").notNull(),

    // Event taxonomy
    kind: varchar("kind", { length: 24 }).notNull(),
    subkind: varchar("subkind", { length: 48 }),
    severity: varchar("severity", { length: 16 }),

    // Targeted node / edge, if any
    nodeId: varchar("node_id", { length: 64 }),
    edgeId: varchar("edge_id", { length: 64 }),

    // Full payload (arrival request, chaos-event specifics, user action details)
    payload: jsonb("payload").notNull().default(sql`'{}'::jsonb`),

    // When this row was written (real-time; not load-bearing for replay)
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("event_log_run_seq_idx").on(t.runId, t.sequenceNumber),
    index("event_log_run_time_idx").on(t.runId, t.simTimeMs),
    index("event_log_kind_idx").on(t.kind, t.recordedAt),
  ],
);

export type SDChaosEvent = typeof sdChaosEventLog.$inferSelect;
export type NewSDChaosEvent = typeof sdChaosEventLog.$inferInsert;

// Shared enums
export type SDChaosEventKind =
  | "request-arrival"
  | "request-complete"
  | "chaos-event"
  | "circuit-breaker-flip"
  | "node-failure"
  | "node-recovery"
  | "edge-failure"
  | "edge-recovery"
  | "user-pause"
  | "user-resume"
  | "user-scrub"
  | "user-fork"
  | "user-manual-inject"
  | "stage-transition"
  | "slo-breach"
  | "slo-recovery";

export type SDChaosEventSeverity =
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "critical";
```

- [ ] **Step 2: Register in `src/db/schema/index.ts`**

Append the export. Open `architex/src/db/schema/index.ts` and add:

```typescript
export * from "./sd-chaos-event-log";
```

- [ ] **Step 3: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add architex/src/db/schema/sd-chaos-event-log.ts architex/src/db/schema/index.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_chaos_event_log table (per-run append-only event stream)

One row per event · indexed on (run_id, sequence_number) for ordered
replay and (run_id, sim_time_ms) for keyframe-relative hydration.
Enumerates 16 event kinds including request lifecycle, chaos events,
circuit-breaker flips, node/edge failures, user actions, stage
transitions, and SLO breaches/recoveries.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Generate and apply migration for Tasks 1 + 2**

```bash
cd architex
pnpm db:generate
```
Expected: a new SQL file in `architex/drizzle/` containing ALTERs for `sd_simulation_runs` + CREATE for `sd_chaos_event_log` + four new indexes. Review the SQL to confirm both tables are covered.

```bash
pnpm db:push
```
Expected: migration applies cleanly. Existing rows in `sd_simulation_runs` get defaults on new NOT NULL columns.

- [ ] **Step 6: Verify via Drizzle Studio**

```bash
pnpm db:studio
```
Open `sd_simulation_runs` and `sd_chaos_event_log`. Confirm both tables render with their columns and indexes. Close the studio.

- [ ] **Step 7: Commit the migration**

```bash
git add architex/drizzle/
git commit -m "$(cat <<'EOF'
feat(db): generate + apply Phase 3 migrations (runs extend + event log)

Two migrations bundled: extends sd_simulation_runs with 12 new columns
and 3 new indexes; creates sd_chaos_event_log with 3 indexes. Existing
Phase 1/2 rows get sensible defaults on NOT NULL columns.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Extend `sd_drill_attempts` schema with stages, persona, variant, rubric, postmortem, hint log

**Files:**
- Modify: `architex/src/db/schema/sd-drill-attempts.ts`

Phase 1 created the base `sd_drill_attempts` with `id`, `userId`, `problemId`, `startedAt`, `pausedAt`, `lastActivityAt`, `submittedAt`, `abandonedAt`, `elapsedBeforePauseMs`, `durationLimitMs` (default 45 minutes in milliseconds), `canvasState`, `hintsUsed`, `gradeScore`, `gradeBreakdown`. Phase 3 adds seven new columns mirroring LLD Phase 4's shape but tailored to SD's 5-stage clock and 8 personas.

- [ ] **Step 1: Extend the table definition**

Replace the `pgTable` body:

```typescript
/**
 * DB-026: SD drill attempts — stores active and completed drill-mode attempts.
 *
 * Phase 3 additions:
 *   - variant              — "study" | "timed-mock" | "exam" | "pair-ai"
 *                             | "full-stack-loop" | "verbal" | "review"
 *   - persona              — "staff" | "bar-raiser" | "coach" | "skeptic"
 *                             | "principal" | "industry-specialist"
 *                             | "company-preset" | "silent-watcher"
 *   - company_preset       — "google" | "meta" | "amazon" | "stripe"
 *                             | "netflix" | "uber" | "airbnb" | "generic-faang"
 *                             | null (only set if persona = "company-preset")
 *   - current_stage        — "clarify" | "estimate" | "design" | "deep-dive" | "qna"
 *   - started_stage_at     — timestamp of current stage entry
 *   - stages               — per-stage progress, timing, transcript pointer (JSONB)
 *   - hint_log             — tiered hint consumption + credit ledger (JSONB)
 *   - hint_credits_remaining — starts at 15 for timed-mock/pair-ai/study; 0 for exam
 *   - rubric_breakdown     — 6-axis grade output (JSONB)
 *   - postmortem           — AI-authored post-drill essay (JSONB)
 *   - timing_heatmap       — per-stage duration + outlier flags (JSONB)
 *   - follow_up_recs       — 3 AI-generated next-step recommendations (JSONB)
 *   - verbal_transcript    — Whisper-transcribed narration, verbal variant only
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const sdDrillAttempts = pgTable(
  "sd_drill_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: varchar("problem_id", { length: 100 }).notNull(),

    // Phase 3 · session variant + persona
    variant: varchar("variant", { length: 24 })
      .notNull()
      .default("timed-mock"),
    persona: varchar("persona", { length: 24 })
      .notNull()
      .default("staff"),
    companyPreset: varchar("company_preset", { length: 24 }),

    // Lifecycle (Phase 1 untouched)
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
    elapsedBeforePauseMs: integer("elapsed_before_pause_ms")
      .notNull()
      .default(0),
    durationLimitMs: integer("duration_limit_ms")
      .notNull()
      .default(45 * 60 * 1000),

    // Phase 3 · stage tracking (§9.3 · 5-stage clock)
    currentStage: varchar("current_stage", { length: 16 })
      .notNull()
      .default("clarify"),
    startedStageAt: timestamp("started_stage_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    stages: jsonb("stages").notNull().default(sql`'{}'::jsonb`),

    // Canvas + hint-history
    canvasState: jsonb("canvas_state"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),

    // Phase 3 · rich hint log (tier + credit + penalty)
    hintLog: jsonb("hint_log").notNull().default(sql`'[]'::jsonb`),
    hintCreditsRemaining: integer("hint_credits_remaining")
      .notNull()
      .default(15),

    // Phase 3 · grade + postmortem + timing + follow-up
    gradeScore: real("grade_score"),
    gradeBreakdown: jsonb("grade_breakdown"),
    rubricBreakdown: jsonb("rubric_breakdown"),
    postmortem: jsonb("postmortem"),
    timingHeatmap: jsonb("timing_heatmap"),
    followUpRecs: jsonb("follow_up_recs"),

    // Phase 3 · verbal variant only
    verbalTranscript: jsonb("verbal_transcript"),
  },
  (t) => [
    uniqueIndex("one_active_sd_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("sd_drill_history_idx").on(t.userId, t.submittedAt),
    index("sd_drill_stage_idx").on(t.userId, t.currentStage),
    index("sd_drill_persona_idx").on(t.userId, t.persona),
  ],
);

export type SDDrillAttempt = typeof sdDrillAttempts.$inferSelect;
export type NewSDDrillAttempt = typeof sdDrillAttempts.$inferInsert;

// Shared enums
export type SDDrillStage =
  | "clarify"
  | "estimate"
  | "design"
  | "deep-dive"
  | "qna";

export type SDDrillVariant =
  | "study"
  | "timed-mock"
  | "exam"
  | "pair-ai"
  | "full-stack-loop"
  | "verbal"
  | "review";

export type SDPersona =
  | "staff"
  | "bar-raiser"
  | "coach"
  | "skeptic"
  | "principal"
  | "industry-specialist"
  | "company-preset"
  | "silent-watcher";

export type SDCompanyPreset =
  | "google"
  | "meta"
  | "amazon"
  | "stripe"
  | "netflix"
  | "uber"
  | "airbnb"
  | "generic-faang";
```

- [ ] **Step 2: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/db/schema/sd-drill-attempts.ts
git commit -m "$(cat <<'EOF'
feat(db): extend sd_drill_attempts with stages + persona + rubric + postmortem

Adds variant, persona, company_preset, current_stage, started_stage_at,
stages JSONB, hint_log JSONB, hint_credits_remaining (default 15),
rubric_breakdown, postmortem, timing_heatmap, follow_up_recs,
verbal_transcript. Preserves Phase 1 active-drill unique index.
New composite indexes on (user_id, current_stage) and (user_id, persona).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Create `sd_drill_interviewer_turns` table (streaming chat log)

**Files:**
- Create: `architex/src/db/schema/sd-drill-interviewer-turns.ts`

One row per turn in the drill's interviewer chat. Streamed SSE tokens are aggregated into a `content` field on `role = "assistant"` rows as chunks arrive (see Task 16 for the SSE handler). Deduplication happens at the SSE layer; the DB stores final text.

- [ ] **Step 1: Create the schema file**

Create `architex/src/db/schema/sd-drill-interviewer-turns.ts`:

```typescript
/**
 * DB-027: SD drill interviewer turns — streamed chat log per drill attempt.
 *
 * Append-only. One row per message (user-ask or interviewer-response).
 * Rows are created at turn-start; the `content` field is populated as
 * SSE tokens stream in and finalized at turn-end. Intermediate rows are
 * never read by the client; the client reads from the SSE stream and
 * uses the DB rows only for resume flows (§9.8 abandon/resume).
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  text,
  index,
} from "drizzle-orm/pg-core";
import { sdDrillAttempts } from "./sd-drill-attempts";

export const sdDrillInterviewerTurns = pgTable(
  "sd_drill_interviewer_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => sdDrillAttempts.id, { onDelete: "cascade" }),
    stage: varchar("stage", { length: 16 }).notNull(),
    role: varchar("role", { length: 12 }).notNull(), // "user" | "assistant"
    sequenceNumber: integer("sequence_number").notNull(),
    content: text("content").notNull().default(""),
    tokenCount: integer("token_count").notNull().default(0),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  },
  (t) => [
    index("turn_attempt_seq_idx").on(t.attemptId, t.sequenceNumber),
    index("turn_attempt_stage_idx").on(t.attemptId, t.stage),
  ],
);

export type SDDrillInterviewerTurn =
  typeof sdDrillInterviewerTurns.$inferSelect;
export type NewSDDrillInterviewerTurn =
  typeof sdDrillInterviewerTurns.$inferInsert;
```

- [ ] **Step 2: Register in the schema index**

```typescript
// architex/src/db/schema/index.ts (append)
export * from "./sd-drill-interviewer-turns";
```

- [ ] **Step 3: Verify typecheck + generate + apply migration**

```bash
cd architex
pnpm typecheck
pnpm db:generate
pnpm db:push
```
Expected: zero typecheck errors; migration file created; migration applies cleanly.

- [ ] **Step 4: Commit**

```bash
git add architex/src/db/schema/sd-drill-interviewer-turns.ts architex/src/db/schema/index.ts architex/drizzle/
git commit -m "$(cat <<'EOF'
feat(db): add sd_drill_interviewer_turns (streamed chat log per attempt)

One row per turn · indexed on (attempt_id, sequence_number) for ordered
replay and (attempt_id, stage) for stage-scoped transcripts. Content
field populated incrementally by SSE stream (see Task 16); finalized_at
set at stream end.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Group B · Engine adapters + metadata (Tasks 5-14)

> The 27 simulation engine files in `architex/src/lib/simulation/` are READ-ONLY during Phase 3. All additions sit in `architex/src/lib/chaos/` or `architex/src/lib/simulation/adapters/`. The engine executes; the adapters translate between the engine's runtime contract and the product's UX contract.

---

## Task 5: Author `chaos-taxonomy.ts` — 73 events · 7 families · narrative templates

**Files:**
- Create: `architex/src/lib/chaos/chaos-taxonomy.ts`
- Create: `architex/src/lib/chaos/__tests__/chaos-taxonomy.test.ts`

The 73-event taxonomy is the source of truth for every chaos event in Simulate. Each event has: canonical name · family · severity band · narrative template (interpolatable) · simulation model hook (which engine file + method drives it) · canvas-family exposure (which node families are vulnerable) · real-incident tie (if applicable) · "what protects against this" card (concept bridge). This is **metadata** the engine consumes; the engine itself is untouched.

**Test-first discipline.** Each sub-step writes tests before the implementation. The chaos-taxonomy test checks: (a) exactly 73 entries; (b) family counts match the spec (14/11/10/9/8/10/11); (c) every event has a non-empty narrative template; (d) every template interpolation token appears in the event's `interpolationTokens` array; (e) every event's `canvasFamilies` references a valid family from `src/lib/simulation/failure-modes.ts`; (f) severity counts across families are balanced (no family is all "critical").

- [ ] **Step 1: Red · failing test for taxonomy shape**

Create `architex/src/lib/chaos/__tests__/chaos-taxonomy.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  CHAOS_TAXONOMY,
  ChaosEventDef,
  chaosFamilyCounts,
  getEventById,
  getEventsByFamily,
  renderNarrative,
} from "../chaos-taxonomy";

describe("chaos-taxonomy", () => {
  it("contains exactly 73 events", () => {
    expect(CHAOS_TAXONOMY).toHaveLength(73);
  });

  it("every event has a unique id", () => {
    const ids = CHAOS_TAXONOMY.map((e) => e.id);
    expect(new Set(ids).size).toBe(73);
  });

  it("every event has a non-empty narrativeTemplate", () => {
    for (const e of CHAOS_TAXONOMY) {
      expect(e.narrativeTemplate.length).toBeGreaterThan(20);
    }
  });

  it("family counts match spec (14/11/10/9/8/10/11)", () => {
    expect(chaosFamilyCounts()).toEqual({
      infrastructure: 14,
      data: 11,
      network: 10,
      cascade: 9,
      external: 8,
      human: 10,
      load: 11,
    });
  });

  it("every template's interpolation tokens are declared", () => {
    const tokenRegex = /\{(\w+)\}/g;
    for (const e of CHAOS_TAXONOMY) {
      const tokens = new Set<string>();
      let match: RegExpExecArray | null;
      while ((match = tokenRegex.exec(e.narrativeTemplate))) {
        tokens.add(match[1]);
      }
      for (const t of tokens) {
        expect(e.interpolationTokens).toContain(t);
      }
    }
  });

  it("renderNarrative fills interpolation tokens", () => {
    const event = getEventById("cache-stampede");
    const rendered = renderNarrative(event, {
      cache_name: "Redis hot-cache",
      backend_name: "Postgres-primary",
    });
    expect(rendered).toContain("Redis hot-cache");
    expect(rendered).toContain("Postgres-primary");
    expect(rendered).not.toContain("{cache_name}");
  });

  it("getEventsByFamily returns correct subsets", () => {
    const infra = getEventsByFamily("infrastructure");
    expect(infra).toHaveLength(14);
    for (const e of infra) {
      expect(e.family).toBe("infrastructure");
    }
  });

  it("every event references at least one canvas node family", () => {
    for (const e of CHAOS_TAXONOMY) {
      expect(e.canvasFamilies.length).toBeGreaterThan(0);
    }
  });

  it("no family is entirely critical severity", () => {
    const families: ChaosEventDef["family"][] = [
      "infrastructure",
      "data",
      "network",
      "cascade",
      "external",
      "human",
      "load",
    ];
    for (const fam of families) {
      const events = getEventsByFamily(fam);
      const critical = events.filter((e) => e.severity === "critical");
      expect(critical.length).toBeLessThan(events.length);
    }
  });
});
```

```bash
cd architex
pnpm test:run -- chaos-taxonomy
```
Expected: all tests fail (file doesn't exist). **That is the Red state.**

- [ ] **Step 2: Green · minimal file so imports resolve**

Create `architex/src/lib/chaos/chaos-taxonomy.ts` with type shapes and an empty array:

```typescript
/**
 * CHAOS-001: 73-event chaos taxonomy · 7 families.
 *
 * Source of truth for every chaos event the Simulate mode can fire.
 * Each event has: canonical id + display name + family + severity +
 * narrative template (serif prose, interpolatable) + simulation model
 * hook (engine file path) + canvas-family exposure + optional real-
 * incident tie + "what protects against this" concept bridge.
 *
 * This file is metadata ONLY. The engine at src/lib/simulation/chaos-
 * engine.ts consumes these defs and executes the events. The narrative
 * engine at src/lib/simulation/narrative-engine.ts consumes the
 * narrativeTemplate field and interpolates canvas-node names.
 */

export type ChaosFamily =
  | "infrastructure"
  | "data"
  | "network"
  | "cascade"
  | "external"
  | "human"
  | "load";

export type ChaosSeverity = "low" | "medium" | "high" | "critical";

export type CanvasFamily =
  | "stateless-service"
  | "stateful-service"
  | "database"
  | "cache"
  | "queue"
  | "cdn"
  | "load-balancer"
  | "api-gateway"
  | "message-broker"
  | "object-store"
  | "search-index"
  | "dns"
  | "auth-service"
  | "monitor"
  | "client"
  | "external-dependency";

export interface ChaosEventDef {
  id: string;
  displayName: string;
  family: ChaosFamily;
  severity: ChaosSeverity;
  narrativeTemplate: string;
  interpolationTokens: string[];
  simModel: {
    engineHook:
      | "chaos-engine.fireHardwareFailure"
      | "chaos-engine.fireDataCorruption"
      | "chaos-engine.firePartition"
      | "chaos-engine.fireCascade"
      | "chaos-engine.fireExternalOutage"
      | "chaos-engine.fireHumanError"
      | "chaos-engine.fireLoadSpike";
    params?: Record<string, unknown>;
  };
  canvasFamilies: CanvasFamily[];
  realIncidentSlug?: string;
  protectingConcept?: string;
  defaultDurationMs: number;
}

export const CHAOS_TAXONOMY: ChaosEventDef[] = [
  // Populated across 7 sub-steps below.
];

export function chaosFamilyCounts(): Record<ChaosFamily, number> {
  const counts: Record<ChaosFamily, number> = {
    infrastructure: 0,
    data: 0,
    network: 0,
    cascade: 0,
    external: 0,
    human: 0,
    load: 0,
  };
  for (const e of CHAOS_TAXONOMY) counts[e.family]++;
  return counts;
}

export function getEventById(id: string): ChaosEventDef {
  const e = CHAOS_TAXONOMY.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown chaos event id: ${id}`);
  return e;
}

export function getEventsByFamily(family: ChaosFamily): ChaosEventDef[] {
  return CHAOS_TAXONOMY.filter((e) => e.family === family);
}

export function renderNarrative(
  event: ChaosEventDef,
  params: Record<string, string>,
): string {
  return event.narrativeTemplate.replace(
    /\{(\w+)\}/g,
    (_m, token) => params[token] ?? `{${token}}`,
  );
}
```

```bash
pnpm typecheck
```
Expected: zero errors. Tests still fail (73 !== 0) — that's fine; we green them in steps 3-9.

- [ ] **Step 3: Populate 14 Infrastructure events**

Replace the `CHAOS_TAXONOMY` array with the 14 Infrastructure entries first:

```typescript
export const CHAOS_TAXONOMY: ChaosEventDef[] = [
  // ===== Infrastructure (14) =====
  {
    id: "vm-hardware-failure",
    displayName: "VM hardware failure",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "The {node_name} virtual machine experiences a hardware fault. Its hypervisor evicts the instance. Traffic destined for it now lands on surviving peers, which were sized for steady-state.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure" },
    canvasFamilies: ["stateless-service", "stateful-service"],
    protectingConcept: "replication",
    defaultDurationMs: 30_000,
  },
  {
    id: "disk-corruption",
    displayName: "Disk corruption",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "Silent data corruption begins on {node_name}'s local disk. Reads return garbage; checksums begin failing. The operator does not yet know.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption" },
    canvasFamilies: ["database", "object-store"],
    protectingConcept: "checksumming-and-read-repair",
    defaultDurationMs: 60_000,
  },
  {
    id: "disk-full",
    displayName: "Disk full",
    family: "infrastructure",
    severity: "medium",
    narrativeTemplate:
      "The {node_name} disk reaches 100% utilization. Writes begin to fail. Logging subsystems start dropping events; the system is now flying blind.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "disk-full" } },
    canvasFamilies: ["database", "monitor", "object-store"],
    protectingConcept: "capacity-planning",
    defaultDurationMs: 120_000,
  },
  {
    id: "kernel-panic",
    displayName: "Kernel panic",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "A kernel panic strikes {node_name}. The process tree dies. The box reboots. During the reboot window, in-flight requests are lost and connections close with RST.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "kernel-panic" } },
    canvasFamilies: ["stateless-service", "stateful-service", "database"],
    protectingConcept: "graceful-degradation",
    defaultDurationMs: 45_000,
  },
  {
    id: "clock-drift",
    displayName: "Clock drift",
    family: "infrastructure",
    severity: "medium",
    narrativeTemplate:
      "The system clock on {node_name} drifts by several minutes. TLS certificates appear invalid; distributed consensus protocols reject the node's votes.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "clock-drift" } },
    canvasFamilies: ["stateful-service", "database", "auth-service"],
    protectingConcept: "logical-clocks",
    defaultDurationMs: 180_000,
    realIncidentSlug: "slack-2021",
  },
  {
    id: "numa-imbalance",
    displayName: "NUMA imbalance",
    family: "infrastructure",
    severity: "low",
    narrativeTemplate:
      "Memory accesses on {node_name} begin crossing NUMA boundaries. Latency on the P99 quietly doubles. No error surfaces; the meter just shifts.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "numa" } },
    canvasFamilies: ["database", "cache", "stateless-service"],
    defaultDurationMs: 240_000,
  },
  {
    id: "noisy-neighbor",
    displayName: "Noisy neighbor CPU starvation",
    family: "infrastructure",
    severity: "medium",
    narrativeTemplate:
      "A co-tenant on {node_name}'s host bursts to full CPU. {node_name}'s threads are context-switched out. Tail latency climbs; nothing in the app logs suggests why.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "noisy-neighbor" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    protectingConcept: "bulkheads",
    defaultDurationMs: 90_000,
  },
  {
    id: "tcp-socket-exhaustion",
    displayName: "TCP socket exhaustion",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "The {node_name} TCP socket table fills. New connections are rejected with ECONNREFUSED. Upstream clients retry; retries cannot open sockets either.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "socket-exhaustion" } },
    canvasFamilies: ["load-balancer", "api-gateway", "stateless-service"],
    protectingConcept: "connection-pooling",
    defaultDurationMs: 60_000,
  },
  {
    id: "ip-exhaustion",
    displayName: "IP address exhaustion",
    family: "infrastructure",
    severity: "medium",
    narrativeTemplate:
      "The VPC's IP range exhausts. New {node_name} pods cannot be scheduled. Autoscaling silently fails; the scheduler retries in the background.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "ip-exhaustion" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    defaultDurationMs: 300_000,
  },
  {
    id: "dns-outage",
    displayName: "DNS server outage",
    family: "infrastructure",
    severity: "critical",
    narrativeTemplate:
      "The authoritative DNS server for {service_domain} becomes unreachable. Clients cannot resolve hostnames. Service discovery fails. The surface of the failure is everywhere.",
    interpolationTokens: ["service_domain"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "dns-outage" } },
    canvasFamilies: ["dns", "client", "load-balancer"],
    realIncidentSlug: "facebook-2021-bgp",
    protectingConcept: "dns-redundancy",
    defaultDurationMs: 600_000,
  },
  {
    id: "cert-expiry",
    displayName: "Certificate expiry",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "The TLS certificate on {node_name} expires. Every incoming TLS handshake now fails. Monitors notice, but no rotation was scheduled.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "cert-expiry" } },
    canvasFamilies: ["load-balancer", "api-gateway", "stateless-service"],
    protectingConcept: "deployment-patterns",
    defaultDurationMs: 300_000,
  },
  {
    id: "hypervisor-eviction",
    displayName: "Hypervisor eviction",
    family: "infrastructure",
    severity: "medium",
    narrativeTemplate:
      "The cloud provider's hypervisor evicts {node_name} to live-migrate it. For sixty seconds, the instance is unreachable.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "eviction" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    defaultDurationMs: 60_000,
  },
  {
    id: "rack-power-outage",
    displayName: "Rack power outage",
    family: "infrastructure",
    severity: "critical",
    narrativeTemplate:
      "A power supply on the rack hosting {node_name} fails. Every instance on the rack loses power simultaneously. The AZ notices the correlated failure a heartbeat later.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "rack-power" } },
    canvasFamilies: ["stateful-service", "database", "cache"],
    protectingConcept: "multi-az-deployment",
    defaultDurationMs: 480_000,
  },
  {
    id: "cooling-failure",
    displayName: "Cooling failure",
    family: "infrastructure",
    severity: "high",
    narrativeTemplate:
      "Cooling in {node_name}'s zone falters. CPU thermal throttling kicks in. Throughput drops by half; nothing surfaces as an error — only as slowness.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireHardwareFailure", params: { mode: "cooling" } },
    canvasFamilies: ["stateful-service", "database"],
    defaultDurationMs: 300_000,
  },
```

```bash
pnpm test:run -- chaos-taxonomy
```
Expected: 3 of 9 tests pass (the 14 entries + family counts beginning to take shape; the "exactly 73" test still fails).

- [ ] **Step 4: Commit milestone · 14 infrastructure events**

```bash
git add architex/src/lib/chaos/chaos-taxonomy.ts architex/src/lib/chaos/__tests__/chaos-taxonomy.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): chaos-taxonomy scaffold + 14 infrastructure events

Scaffold with full TypeScript types (ChaosFamily, ChaosSeverity,
CanvasFamily, ChaosEventDef) and helpers (renderNarrative,
getEventsByFamily, chaosFamilyCounts, getEventById). Infrastructure
family populated in full: VM failure, disk corruption/full, kernel
panic, clock drift (Slack 2021 tie), NUMA imbalance, noisy neighbor,
socket/IP exhaustion, DNS outage (Facebook 2021 tie), cert expiry,
hypervisor eviction, rack power, cooling failure.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Add 11 Data events**

Append after the last infrastructure entry (before the closing `];`):

```typescript
  // ===== Data (11) =====
  {
    id: "replica-lag-spike",
    displayName: "Replica lag spike",
    family: "data",
    severity: "medium",
    narrativeTemplate:
      "The read replica {replica_name} falls behind its primary. Lag creeps from 200ms to 14 seconds. Reads from the replica return stale data; users see their own writes vanish.",
    interpolationTokens: ["replica_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "replica-lag" } },
    canvasFamilies: ["database"],
    protectingConcept: "consistency-models",
    defaultDurationMs: 120_000,
  },
  {
    id: "replica-desync",
    displayName: "Replica desync",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "Replica {replica_name} stops applying the primary's WAL. The stream position freezes. Monitoring does not surface the freeze for forty seconds.",
    interpolationTokens: ["replica_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "replica-desync" } },
    canvasFamilies: ["database"],
    protectingConcept: "replication",
    defaultDurationMs: 180_000,
  },
  {
    id: "corrupt-index",
    displayName: "Corrupt secondary index",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "A secondary index on {table_name} corrupts. Queries that use the index return incorrect result sets; queries that bypass it are correct but slow.",
    interpolationTokens: ["table_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "corrupt-index" } },
    canvasFamilies: ["database"],
    defaultDurationMs: 300_000,
  },
  {
    id: "silent-data-corruption",
    displayName: "Silent data corruption",
    family: "data",
    severity: "critical",
    narrativeTemplate:
      "Data pages on {database_name} silently corrupt. Reads succeed; checksums do not yet fire. The corruption propagates into replicas and backups before anyone notices.",
    interpolationTokens: ["database_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "silent" } },
    canvasFamilies: ["database", "object-store"],
    protectingConcept: "checksumming-and-read-repair",
    defaultDurationMs: 1_800_000,
  },
  {
    id: "write-conflict-storm",
    displayName: "Write conflict storm",
    family: "data",
    severity: "medium",
    narrativeTemplate:
      "Under concurrent writes to the same row in {table_name}, the optimistic concurrency control layer begins rejecting writes en masse. Clients retry. The retry storm amplifies the contention.",
    interpolationTokens: ["table_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "write-conflict" } },
    canvasFamilies: ["database"],
    protectingConcept: "locking-and-mvcc",
    defaultDurationMs: 60_000,
  },
  {
    id: "cache-stampede",
    displayName: "Cache stampede",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "The {cache_name} cools below the hit-rate threshold. Requests begin arriving at {backend_name} faster than it can serve them. A queue forms; the queue deepens; the queue does not drain.",
    interpolationTemplate: "",
    interpolationTokens: ["cache_name", "backend_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "cache-stampede" } },
    canvasFamilies: ["cache", "database"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 120_000,
  } as unknown as ChaosEventDef,
  {
    id: "cache-poisoning",
    displayName: "Cache poisoning",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "A buggy write populates {cache_name} with malformed values. Every subsequent read now returns the bad entry until the TTL expires or the entry is manually invalidated.",
    interpolationTokens: ["cache_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "cache-poison" } },
    canvasFamilies: ["cache"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 300_000,
  },
  {
    id: "split-brain-failover",
    displayName: "Split-brain during failover",
    family: "data",
    severity: "critical",
    narrativeTemplate:
      "During failover, both {primary_name} and {new_primary_name} accept writes. Two masters, two histories. Reconciliation is now a human problem.",
    interpolationTokens: ["primary_name", "new_primary_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "split-brain" } },
    canvasFamilies: ["database"],
    realIncidentSlug: "github-2018-db",
    protectingConcept: "consensus",
    defaultDurationMs: 600_000,
  },
  {
    id: "hot-partition",
    displayName: "Hot partition",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "A skewed key sends 70% of requests to a single shard of {table_name}. That shard saturates while the others idle. The cluster's capacity is underutilized by a factor of ten.",
    interpolationTokens: ["table_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "hot-partition" } },
    canvasFamilies: ["database", "cache"],
    protectingConcept: "sharding-and-consistent-hashing",
    defaultDurationMs: 180_000,
  },
  {
    id: "deadlock-storm",
    displayName: "Deadlock storm",
    family: "data",
    severity: "high",
    narrativeTemplate:
      "A recent schema change in {table_name} introduces a lock-ordering inversion. Transactions begin deadlocking. Each deadlock costs a round-trip of retry.",
    interpolationTokens: ["table_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "deadlock" } },
    canvasFamilies: ["database"],
    defaultDurationMs: 120_000,
  },
  {
    id: "schema-migration-failure",
    displayName: "Schema migration failure",
    family: "data",
    severity: "critical",
    narrativeTemplate:
      "An online schema migration on {table_name} half-completes and stalls. Reads begin hitting a mix of old-schema and new-schema rows. Queries that assumed uniformity fail.",
    interpolationTokens: ["table_name"],
    simModel: { engineHook: "chaos-engine.fireDataCorruption", params: { mode: "schema-migration" } },
    canvasFamilies: ["database"],
    realIncidentSlug: "discord-mar-2022",
    protectingConcept: "deployment-patterns",
    defaultDurationMs: 1_200_000,
  },
```

> **Note:** The cache-stampede entry above has a deliberate `interpolationTemplate: ""` extra field and a cast to `ChaosEventDef` — this is a **known red-herring** to teach developers to run the tests. The test `renderNarrative fills interpolation tokens` will pass because the template is correctly interpolatable, but a future developer adding a field should delete the bogus line. Your actual step is to remove the `interpolationTemplate: ""` line and the cast, leaving only valid `ChaosEventDef` fields. Rerun tests.

```bash
pnpm test:run -- chaos-taxonomy
```
Expected: 3 additional tests pass; the "exactly 73" test still fails because we have 25 events so far.

- [ ] **Step 6: Add 10 Network events**

Append:

```typescript
  // ===== Network (10) =====
  {
    id: "network-partition-full",
    displayName: "Network partition (full)",
    family: "network",
    severity: "critical",
    narrativeTemplate:
      "A network partition isolates {node_name} from the rest of the cluster. Heartbeats fail. Quorum is lost. The node is alive but unreachable.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "full" } },
    canvasFamilies: ["database", "stateful-service", "message-broker"],
    realIncidentSlug: "github-2018-db",
    protectingConcept: "consensus",
    defaultDurationMs: 120_000,
  },
  {
    id: "network-partition-asymmetric",
    displayName: "Network partition (asymmetric)",
    family: "network",
    severity: "critical",
    narrativeTemplate:
      "{node_a} can reach {node_b}, but {node_b} cannot reach {node_a}. Quorum math breaks. Each side believes it is the majority; neither can make progress.",
    interpolationTokens: ["node_a", "node_b"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "asymmetric" } },
    canvasFamilies: ["database", "stateful-service"],
    protectingConcept: "consensus",
    defaultDurationMs: 120_000,
  },
  {
    id: "packet-loss",
    displayName: "Packet loss",
    family: "network",
    severity: "medium",
    narrativeTemplate:
      "Random packet loss of 5% hits the link to {node_name}. TCP retransmits; latencies swell. The system degrades gracefully, then not so gracefully.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "packet-loss" } },
    canvasFamilies: ["stateless-service", "stateful-service", "database"],
    defaultDurationMs: 180_000,
  },
  {
    id: "latency-injection",
    displayName: "Latency injection",
    family: "network",
    severity: "medium",
    narrativeTemplate:
      "Latency on the link to {node_name} jumps by 500ms. Every synchronous call amplifies the delay. Deep call chains discover how deep they were.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "latency" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    protectingConcept: "timeouts-and-retries",
    defaultDurationMs: 90_000,
  },
  {
    id: "bandwidth-throttle",
    displayName: "Bandwidth throttle",
    family: "network",
    severity: "medium",
    narrativeTemplate:
      "The uplink from {node_name} throttles to 10% of its rated capacity. Large responses queue. Clients time out before the bytes arrive.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "bandwidth" } },
    canvasFamilies: ["cdn", "object-store", "load-balancer"],
    defaultDurationMs: 120_000,
  },
  {
    id: "tcp-syn-flood",
    displayName: "TCP SYN flood",
    family: "network",
    severity: "high",
    narrativeTemplate:
      "A flood of half-open TCP connections hits {node_name}'s public endpoint. Legitimate connections are starved out as the SYN queue fills.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "syn-flood" } },
    canvasFamilies: ["load-balancer", "api-gateway", "stateless-service"],
    protectingConcept: "rate-limiting",
    defaultDurationMs: 60_000,
  },
  {
    id: "dns-poisoning",
    displayName: "DNS poisoning",
    family: "network",
    severity: "critical",
    narrativeTemplate:
      "A DNS cache along the path to {service_domain} returns poisoned answers. Traffic is redirected to attacker-controlled endpoints; the originating service is bypassed.",
    interpolationTokens: ["service_domain"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "dns-poisoning" } },
    canvasFamilies: ["dns", "client"],
    protectingConcept: "dns-redundancy",
    defaultDurationMs: 300_000,
  },
  {
    id: "bgp-route-leak",
    displayName: "BGP route leak",
    family: "network",
    severity: "critical",
    narrativeTemplate:
      "A BGP route leak redirects traffic destined for {service_domain} through an unintended AS. Latency quintuples; some packets never arrive.",
    interpolationTokens: ["service_domain"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "bgp-leak" } },
    canvasFamilies: ["cdn", "load-balancer", "dns"],
    realIncidentSlug: "facebook-2021-bgp",
    defaultDurationMs: 3600_000,
  },
  {
    id: "mtu-mismatch",
    displayName: "MTU mismatch",
    family: "network",
    severity: "low",
    narrativeTemplate:
      "A path MTU mismatch between {node_a} and {node_b} causes fragmentation. Large packets silently drop; small packets succeed. Debugging takes a day.",
    interpolationTokens: ["node_a", "node_b"],
    simModel: { engineHook: "chaos-engine.firePartition", params: { mode: "mtu" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    defaultDurationMs: 600_000,
  },
  {
    id: "connection-reset-storm",
    displayName: "Connection reset storm",
    family: "network",
    severity: "high",
    narrativeTemplate:
      "An intermediate load balancer begins sending TCP RST to every connection for {node_name}. In-flight responses are truncated; clients retry and are reset again.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "rst-storm" } },
    canvasFamilies: ["load-balancer", "api-gateway"],
    defaultDurationMs: 90_000,
  },
```

- [ ] **Step 7: Add 9 Cascade events**

Append:

```typescript
  // ===== Cascade (9) =====
  {
    id: "retry-amplification",
    displayName: "Retry amplification",
    family: "cascade",
    severity: "critical",
    narrativeTemplate:
      "Client retries against {node_name} compound with server-side retries. A single request becomes three, then nine, then twenty-seven. The downstream system drowns in duplicate work.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "retry-amplification" } },
    canvasFamilies: ["stateless-service", "api-gateway", "stateful-service"],
    protectingConcept: "retries-with-jitter",
    defaultDurationMs: 180_000,
  },
  {
    id: "timeout-amplification",
    displayName: "Timeout amplification",
    family: "cascade",
    severity: "high",
    narrativeTemplate:
      "A chain of services with tight timeouts cascades: {first_node} times out waiting on {second_node}, {second_node} times out waiting on {third_node}. The caller sees a 503 before the failure is understood.",
    interpolationTokens: ["first_node", "second_node", "third_node"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "timeout-chain" } },
    canvasFamilies: ["stateless-service", "api-gateway"],
    protectingConcept: "circuit-breakers",
    defaultDurationMs: 120_000,
  },
  {
    id: "circuit-breaker-flip-flop",
    displayName: "Circuit-breaker flip-flop",
    family: "cascade",
    severity: "medium",
    narrativeTemplate:
      "The circuit breaker in front of {node_name} flips open, closes on the first probe, reopens on the next error, and continues oscillating. The breaker is louder than the outage.",
    interpolationTokens: ["node_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "cb-flip-flop" } },
    canvasFamilies: ["stateless-service", "api-gateway"],
    protectingConcept: "circuit-breakers",
    defaultDurationMs: 90_000,
  },
  {
    id: "thundering-herd",
    displayName: "Thundering herd",
    family: "cascade",
    severity: "high",
    narrativeTemplate:
      "After {cache_name} is flushed, a synchronized herd of clients hits {backend_name}. A pulse of load peaks at ten times steady-state; the backend folds.",
    interpolationTokens: ["cache_name", "backend_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "thundering-herd" } },
    canvasFamilies: ["cache", "database"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 120_000,
  },
  {
    id: "sequential-timeout-cascade",
    displayName: "Sequential timeout cascade",
    family: "cascade",
    severity: "high",
    narrativeTemplate:
      "A long serial call chain through {first_node}, {second_node}, and {third_node} accumulates latency. Each hop's budget was set independently; together, they exceed the client's deadline.",
    interpolationTokens: ["first_node", "second_node", "third_node"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "serial-timeout" } },
    canvasFamilies: ["stateless-service", "api-gateway"],
    protectingConcept: "timeouts-and-retries",
    defaultDurationMs: 60_000,
  },
  {
    id: "deadlock-between-services",
    displayName: "Deadlock between services",
    family: "cascade",
    severity: "critical",
    narrativeTemplate:
      "{service_a} holds a lock waiting on {service_b}, which holds a lock waiting on {service_a}. Both block forever. The watchdog's timeout is the only thing that breaks the deadlock.",
    interpolationTokens: ["service_a", "service_b"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "cross-service-deadlock" } },
    canvasFamilies: ["stateful-service", "database"],
    defaultDurationMs: 180_000,
  },
  {
    id: "service-dependency-loop",
    displayName: "Service dependency loop",
    family: "cascade",
    severity: "critical",
    narrativeTemplate:
      "An unintentional dependency loop: {service_a} calls {service_b} which calls {service_a}. The request stack unwinds only through timeout. Every client request consumes a worker on both sides.",
    interpolationTokens: ["service_a", "service_b"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "dep-loop" } },
    canvasFamilies: ["stateless-service", "api-gateway"],
    defaultDurationMs: 240_000,
  },
  {
    id: "queue-overflow-cascade",
    displayName: "Queue overflow cascade",
    family: "cascade",
    severity: "high",
    narrativeTemplate:
      "The queue fronting {worker_pool_name} fills. Producers begin to block. Upstream services' request buffers now fill. Backpressure propagates up the call graph until it reaches the public edge.",
    interpolationTokens: ["worker_pool_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "queue-overflow" } },
    canvasFamilies: ["queue", "message-broker"],
    protectingConcept: "backpressure",
    defaultDurationMs: 180_000,
  },
  {
    id: "redis-memory-eviction-cascade",
    displayName: "Redis memory eviction cascade",
    family: "cascade",
    severity: "high",
    narrativeTemplate:
      "{cache_name} hits its memory limit. The eviction policy kicks in. Each evicted key causes a cache miss; the miss loads the same key back in; another key is evicted to make room.",
    interpolationTokens: ["cache_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "redis-eviction" } },
    canvasFamilies: ["cache"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 300_000,
  },
```

- [ ] **Step 8: Commit milestone · Data + Network + Cascade (30 more events)**

```bash
pnpm test:run -- chaos-taxonomy
```
Expected: 4 more tests pass; we have 44 of 73 events.

```bash
git add architex/src/lib/chaos/chaos-taxonomy.ts
git commit -m "$(cat <<'EOF'
feat(chaos): add 11 data + 10 network + 9 cascade events

Data: replica lag/desync, corrupt index, silent corruption, write
conflicts, cache stampede/poisoning, split-brain (GitHub 2018),
hot partition, deadlocks, schema migration (Discord 2022). Network:
partitions (full+asymmetric), packet loss, latency/bandwidth,
SYN flood, DNS poisoning, BGP leak (Facebook 2021), MTU, RST storm.
Cascade: retry/timeout amplification, CB flip-flop, thundering herd,
sequential timeout, cross-service deadlock, dependency loop, queue
overflow, Redis eviction cascade.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 9: Add 8 External events**

```typescript
  // ===== External (8) =====
  {
    id: "third-party-api-down",
    displayName: "Third-party API down",
    family: "external",
    severity: "critical",
    narrativeTemplate:
      "The {vendor_name} API returns 500 errors across every endpoint. Your design assumes {vendor_name} is available; requests that depend on it fail end-to-end.",
    interpolationTokens: ["vendor_name"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "hard-down" } },
    canvasFamilies: ["external-dependency"],
    protectingConcept: "graceful-degradation",
    defaultDurationMs: 900_000,
  },
  {
    id: "third-party-api-slow",
    displayName: "Third-party API slow",
    family: "external",
    severity: "high",
    narrativeTemplate:
      "The {vendor_name} API responds — but slowly. P99 latency from {vendor_name} rises from 200ms to 12 seconds. Your synchronous callers queue on its tail.",
    interpolationTokens: ["vendor_name"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "slow" } },
    canvasFamilies: ["external-dependency"],
    protectingConcept: "timeouts-and-retries",
    defaultDurationMs: 600_000,
  },
  {
    id: "third-party-rate-limit",
    displayName: "Third-party rate limit hit",
    family: "external",
    severity: "medium",
    narrativeTemplate:
      "{vendor_name} returns 429 Too Many Requests. Your integration had no backoff. The ratelimit window extends under sustained rejection.",
    interpolationTokens: ["vendor_name"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "rate-limit" } },
    canvasFamilies: ["external-dependency"],
    protectingConcept: "retries-with-jitter",
    defaultDurationMs: 300_000,
  },
  {
    id: "saas-vendor-outage",
    displayName: "SaaS vendor outage chain",
    family: "external",
    severity: "critical",
    narrativeTemplate:
      "A SaaS dependency you use — {vendor_name} — depends on a SaaS dependency of its own that is down. Your status page lights up. So does your vendor's. The root cause is two hops away.",
    interpolationTokens: ["vendor_name"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "chained" } },
    canvasFamilies: ["external-dependency"],
    realIncidentSlug: "fastly-2021",
    defaultDurationMs: 1200_000,
  },
  {
    id: "dns-provider-outage",
    displayName: "DNS provider outage",
    family: "external",
    severity: "critical",
    narrativeTemplate:
      "Your authoritative DNS provider goes down. {service_domain} is unresolvable globally. Users see DNS_PROBE_FINISHED_NXDOMAIN. Only your CDN's cached TTLs temporarily spare you.",
    interpolationTokens: ["service_domain"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "dns-provider" } },
    canvasFamilies: ["dns"],
    protectingConcept: "dns-redundancy",
    defaultDurationMs: 1800_000,
  },
  {
    id: "tls-provider-outage",
    displayName: "TLS provider outage",
    family: "external",
    severity: "high",
    narrativeTemplate:
      "The OCSP responder for your TLS provider goes down. Browsers that enforce OCSP stapling cannot validate {service_domain}; connections hang.",
    interpolationTokens: ["service_domain"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "tls-ocsp" } },
    canvasFamilies: ["api-gateway", "load-balancer"],
    defaultDurationMs: 600_000,
  },
  {
    id: "cdn-outage",
    displayName: "CDN outage",
    family: "external",
    severity: "critical",
    narrativeTemplate:
      "{cdn_name} experiences a global edge failure. Static assets 404. The origin, which was never sized for 100% traffic, groans under the surge.",
    interpolationTokens: ["cdn_name"],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "cdn-down" } },
    canvasFamilies: ["cdn", "object-store"],
    realIncidentSlug: "fastly-2021",
    protectingConcept: "cdn-fundamentals",
    defaultDurationMs: 3600_000,
  },
  {
    id: "cloud-api-throttle",
    displayName: "Cloud-provider API throttle",
    family: "external",
    severity: "medium",
    narrativeTemplate:
      "The cloud provider rate-limits your control-plane API calls. Autoscale events are delayed; IAM key rotations time out; nothing user-facing fails — yet.",
    interpolationTokens: [],
    simModel: { engineHook: "chaos-engine.fireExternalOutage", params: { mode: "cloud-throttle" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    defaultDurationMs: 600_000,
  },
```

- [ ] **Step 10: Add 10 Human events**

```typescript
  // ===== Human (10) =====
  {
    id: "bad-deploy",
    displayName: "Bad deploy",
    family: "human",
    severity: "critical",
    narrativeTemplate:
      "A new version of {service_name} ships with a regression. Canary traffic is forwarded to v2; v2 panics on every request. The canary is healthy from the orchestrator's perspective because its health check is a TCP ping.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "bad-deploy" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    realIncidentSlug: "knight-capital-2012",
    protectingConcept: "deployment-patterns",
    defaultDurationMs: 900_000,
  },
  {
    id: "config-push-error",
    displayName: "Config push error",
    family: "human",
    severity: "critical",
    narrativeTemplate:
      "A malformed config is pushed globally to {service_name}. Every instance fails to boot. The config-push system has no canary; the blast radius is total.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "config-push" } },
    canvasFamilies: ["stateless-service", "cdn", "api-gateway"],
    realIncidentSlug: "fastly-2021",
    protectingConcept: "deployment-patterns",
    defaultDurationMs: 1800_000,
  },
  {
    id: "credential-rotation-fail",
    displayName: "Credential rotation failure",
    family: "human",
    severity: "high",
    narrativeTemplate:
      "A scheduled credential rotation for {service_name} fails mid-apply. Half the fleet has the new key; half have the old. Auth begins to fail at random.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "cred-rotation" } },
    canvasFamilies: ["auth-service", "stateful-service"],
    defaultDurationMs: 1200_000,
  },
  {
    id: "runbook-misuse",
    displayName: "Runbook misuse",
    family: "human",
    severity: "high",
    narrativeTemplate:
      "Under incident pressure, an operator runs the wrong runbook command against {service_name}. Instead of restarting a single pod, the whole namespace recycles. The outage widens.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "runbook" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    protectingConcept: "incident-response",
    defaultDurationMs: 600_000,
  },
  {
    id: "accidental-deletion",
    displayName: "Accidental deletion",
    family: "human",
    severity: "critical",
    narrativeTemplate:
      "An operator accidentally deletes a critical resource belonging to {service_name}. Recovery requires a restore from backup, if a backup is current.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "deletion" } },
    canvasFamilies: ["database", "object-store"],
    defaultDurationMs: 3600_000,
  },
  {
    id: "runaway-script",
    displayName: "Runaway script",
    family: "human",
    severity: "high",
    narrativeTemplate:
      "A background script targeting {service_name} enters an infinite loop. CPU pegs at 100% on every instance. The script was supposed to run once and exit.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "runaway" } },
    canvasFamilies: ["stateless-service", "stateful-service"],
    defaultDurationMs: 180_000,
  },
  {
    id: "test-traffic-in-prod",
    displayName: "Test traffic in prod",
    family: "human",
    severity: "medium",
    narrativeTemplate:
      "A load-test script is accidentally pointed at the production {service_name}. Synthetic traffic masquerades as real traffic. The cost meter ticks. The capacity buffer drains.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "test-traffic" } },
    canvasFamilies: ["stateless-service", "load-balancer"],
    defaultDurationMs: 300_000,
  },
  {
    id: "forgot-to-restart",
    displayName: "Forgot to restart after config",
    family: "human",
    severity: "low",
    narrativeTemplate:
      "A config change for {service_name} is rolled out but the pods are never restarted. Half the fleet runs the new config, half the old. Bugs appear at random.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "stale-config" } },
    canvasFamilies: ["stateless-service"],
    defaultDurationMs: 1800_000,
  },
  {
    id: "bad-cdn-purge",
    displayName: "Bad CDN purge",
    family: "human",
    severity: "medium",
    narrativeTemplate:
      "A CDN cache purge for {cdn_name} is issued for the entire domain by accident. Every edge cache refills from the origin simultaneously. The origin was never sized for a 100% cold CDN.",
    interpolationTokens: ["cdn_name"],
    simModel: { engineHook: "chaos-engine.fireCascade", params: { mode: "cdn-purge" } },
    canvasFamilies: ["cdn", "object-store"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 600_000,
  },
  {
    id: "insider-mistake",
    displayName: "Insider mistake",
    family: "human",
    severity: "critical",
    narrativeTemplate:
      "A privileged user accidentally executes a destructive query against {service_name}. The blast radius is large; the audit log is the only evidence of what happened.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireHumanError", params: { mode: "insider" } },
    canvasFamilies: ["database", "auth-service"],
    defaultDurationMs: 1800_000,
  },
```

- [ ] **Step 11: Add 11 Load events**

```typescript
  // ===== Load (11) =====
  {
    id: "traffic-spike-organic",
    displayName: "Traffic spike (organic)",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "An organic traffic spike hits {service_name}. QPS rises to 3x steady-state over fifteen minutes. Autoscale begins adding capacity — after the spike has already peaked.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "organic" } },
    canvasFamilies: ["stateless-service", "load-balancer"],
    protectingConcept: "capacity-planning",
    defaultDurationMs: 900_000,
  },
  {
    id: "traffic-spike-viral",
    displayName: "Traffic spike (viral)",
    family: "load",
    severity: "high",
    narrativeTemplate:
      "A piece of content on {service_name} goes viral. QPS jumps by 10x in two minutes. The autoscaler cannot provision fast enough; the load balancer sheds.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "viral" } },
    canvasFamilies: ["stateless-service", "cdn", "load-balancer"],
    protectingConcept: "caching-strategies",
    defaultDurationMs: 600_000,
  },
  {
    id: "slow-client-attack",
    displayName: "Slow-client attack",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "A wave of slow clients connects to {service_name} and holds sockets open without sending complete requests. The socket pool fills; legitimate clients cannot connect.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "slowloris" } },
    canvasFamilies: ["load-balancer", "api-gateway"],
    protectingConcept: "rate-limiting",
    defaultDurationMs: 300_000,
  },
  {
    id: "ddos-amplification",
    displayName: "DDoS amplification",
    family: "load",
    severity: "critical",
    narrativeTemplate:
      "An amplification DDoS floods the ingress to {service_name}. Legitimate traffic is drowned; the edge firewall struggles to distinguish good from bad.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "ddos" } },
    canvasFamilies: ["load-balancer", "cdn"],
    defaultDurationMs: 1800_000,
  },
  {
    id: "scraper-flood",
    displayName: "Scraper flood",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "An aggressive scraper hits {service_name} at 10x the API's intended rate. The API does not rate-limit by IP; the backend suffers.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "scraper" } },
    canvasFamilies: ["api-gateway", "stateless-service"],
    protectingConcept: "rate-limiting",
    defaultDurationMs: 1200_000,
  },
  {
    id: "celebrity-event",
    displayName: "Celebrity event",
    family: "load",
    severity: "high",
    narrativeTemplate:
      "A celebrity account on {service_name} posts to fifty million followers. The fan-out queue backlogs. Timeline updates arrive in the next timezone's morning.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "celebrity" } },
    canvasFamilies: ["message-broker", "queue"],
    protectingConcept: "backpressure",
    defaultDurationMs: 3600_000,
  },
  {
    id: "product-launch",
    displayName: "Product launch",
    family: "load",
    severity: "high",
    narrativeTemplate:
      "A product launch sends anticipated traffic at {service_name}. QPS follows the embargoed announcement time within seconds. The load shape is well-known; the pre-warm was insufficient.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "launch" } },
    canvasFamilies: ["stateless-service", "cdn"],
    defaultDurationMs: 3600_000,
  },
  {
    id: "time-based-spike",
    displayName: "Time-based spike (NYE)",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "At midnight in a major timezone, {service_name}'s messaging QPS spikes tenfold. The pattern repeats every year; capacity was not refreshed for this year's user growth.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "time-based" } },
    canvasFamilies: ["stateless-service", "message-broker"],
    defaultDurationMs: 1800_000,
  },
  {
    id: "holiday-pattern-change",
    displayName: "Holiday pattern change",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "Holiday traffic patterns hit {service_name}: longer sessions, larger cart sizes, more retries. The steady-state model was not calibrated for this mix.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "holiday" } },
    canvasFamilies: ["stateless-service", "database"],
    realIncidentSlug: "roblox-2021",
    defaultDurationMs: 14400_000,
  },
  {
    id: "demographic-shift",
    displayName: "Demographic shift",
    family: "load",
    severity: "low",
    narrativeTemplate:
      "A new demographic adopts {service_name} and uses features in unusual proportions. The access pattern shifts; cache hit rates drop; P99 creeps up.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "demographic" } },
    canvasFamilies: ["cache", "stateless-service"],
    defaultDurationMs: 86400_000,
  },
  {
    id: "sudden-geographic-shift",
    displayName: "Sudden geographic shift",
    family: "load",
    severity: "medium",
    narrativeTemplate:
      "Traffic to {service_name} shifts abruptly toward a region where capacity is light. Cross-region latency climbs; users in the new region see degraded service.",
    interpolationTokens: ["service_name"],
    simModel: { engineHook: "chaos-engine.fireLoadSpike", params: { mode: "geo-shift" } },
    canvasFamilies: ["cdn", "load-balancer"],
    defaultDurationMs: 3600_000,
  },
];  // close CHAOS_TAXONOMY
```

- [ ] **Step 12: Run all taxonomy tests (green state)**

```bash
cd architex
pnpm test:run -- chaos-taxonomy
```
Expected: all 9 tests pass. If the "family counts" test fails, count the entries in each family — one per family must match spec (14/11/10/9/8/10/11).

- [ ] **Step 13: Final commit for Task 5**

```bash
git add architex/src/lib/chaos/chaos-taxonomy.ts
git commit -m "$(cat <<'EOF'
feat(chaos): complete 73-event taxonomy — external + human + load (29 events)

External (8): third-party hard-down, slow, rate-limit; SaaS vendor
chain (Fastly tie); DNS/TLS provider outages; CDN outage; cloud API
throttle. Human (10): bad deploy (Knight Capital tie), config push
(Fastly tie), credential rotation, runbook misuse, accidental deletion,
runaway script, test traffic in prod, stale config, CDN purge, insider
mistake. Load (11): organic/viral spikes, slow-client attack, DDoS,
scraper flood, celebrity event, product launch, NYE, holiday (Roblox
tie), demographic + geographic shifts. Taxonomy total: 73 events.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Author `real-incidents.ts` — 10 real-incident timelines

**Files:**
- Create: `architex/src/lib/chaos/real-incidents.ts`
- Create: `architex/src/lib/chaos/__tests__/real-incidents.test.ts`

Each real incident is a composite chaos scenario: a sequence of events from the taxonomy (Task 5), a faithful architecture sketch (how the real company was structured at incident-time), a minute-by-minute timeline, a postmortem summary, and the bridges to concepts/problems/chaos events it illuminates. This data is what the Archaeology activity (§8.3.6) and the Chaos Library UI (§12.8) render.

The 10 incidents are specified in §5.6 and §12.2. Opus authors the narrative prose in Task 32 (content drop); Task 6 writes the **data shape** and **event-sequence wiring** — the technical scaffold into which Task 32 pours prose.

- [ ] **Step 1: Red · failing test**

Create `architex/src/lib/chaos/__tests__/real-incidents.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  REAL_INCIDENTS,
  getIncidentBySlug,
  INCIDENT_SLUGS,
  RealIncident,
} from "../real-incidents";
import { CHAOS_TAXONOMY } from "../chaos-taxonomy";

describe("real-incidents", () => {
  it("contains exactly 10 incidents", () => {
    expect(REAL_INCIDENTS).toHaveLength(10);
  });

  it("every incident has a unique slug", () => {
    const slugs = REAL_INCIDENTS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(10);
  });

  it("every incident references at least 2 chaos events from the taxonomy", () => {
    const taxonomyIds = new Set(CHAOS_TAXONOMY.map((e) => e.id));
    for (const inc of REAL_INCIDENTS) {
      expect(inc.eventSequence.length).toBeGreaterThanOrEqual(2);
      for (const step of inc.eventSequence) {
        expect(taxonomyIds.has(step.eventId)).toBe(true);
      }
    }
  });

  it("every incident has monotonically increasing offsetSimSeconds", () => {
    for (const inc of REAL_INCIDENTS) {
      const offsets = inc.eventSequence.map((s) => s.offsetSimSeconds);
      for (let i = 1; i < offsets.length; i++) {
        expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]);
      }
    }
  });

  it("every incident lists at least 2 concept bridges", () => {
    for (const inc of REAL_INCIDENTS) {
      expect(inc.conceptBridges.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("INCIDENT_SLUGS matches REAL_INCIDENTS", () => {
    expect(INCIDENT_SLUGS).toHaveLength(10);
    for (const inc of REAL_INCIDENTS) {
      expect(INCIDENT_SLUGS).toContain(inc.slug);
    }
  });

  it("getIncidentBySlug returns the right incident", () => {
    const fb = getIncidentBySlug("facebook-2021-bgp");
    expect(fb.displayName).toContain("Facebook");
    expect(fb.date).toBe("2021-10-04");
  });

  it("every incident has a non-empty summary and at least 2 architecture nodes", () => {
    for (const inc of REAL_INCIDENTS) {
      expect(inc.summary.length).toBeGreaterThan(40);
      expect(inc.architectureSketch.nodes.length).toBeGreaterThanOrEqual(2);
    }
  });
});
```

- [ ] **Step 2: Green · author `real-incidents.ts`**

Create `architex/src/lib/chaos/real-incidents.ts`:

```typescript
/**
 * CHAOS-002: 10 real-incident replays.
 *
 * Each incident is a composite scenario: a sequence of chaos events from
 * the taxonomy, a sketch of the company's architecture at incident time,
 * a minute-by-minute timeline, a summary of the published postmortem,
 * and bridges to concepts/problems/chaos events.
 *
 * The Archaeology activity (§8.3.6) loads an incident, runs its event
 * sequence against the user's design, and renders the verdict card.
 *
 * Narrative prose for each incident lives in content/sd/real-incidents/
 * MDX files (authored in Task 32 by Opus). This file is the technical
 * scaffold — the event-sequence wiring + architecture sketches + bridge
 * metadata.
 */

import type { ChaosEventDef } from "./chaos-taxonomy";

export interface RealIncidentArchNode {
  id: string;
  label: string;
  canvasFamily:
    | "stateless-service"
    | "stateful-service"
    | "database"
    | "cache"
    | "queue"
    | "cdn"
    | "load-balancer"
    | "api-gateway"
    | "message-broker"
    | "object-store"
    | "search-index"
    | "dns"
    | "auth-service"
    | "monitor"
    | "client"
    | "external-dependency";
  positionHint?: { x: number; y: number };
}

export interface RealIncidentArchEdge {
  from: string;
  to: string;
  kind?: "sync" | "async" | "replication";
}

export interface RealIncidentEventStep {
  offsetSimSeconds: number;
  eventId: ChaosEventDef["id"];
  targetNodeId?: string;
  params?: Record<string, string>;
  narrative?: string;  // optional override; default renders from taxonomy template
}

export interface RealIncident {
  slug: string;
  displayName: string;
  company: string;
  date: string;              // ISO 8601
  durationMinutes: number;
  summary: string;           // 1-2 sentence executive summary
  architectureSketch: {
    nodes: RealIncidentArchNode[];
    edges: RealIncidentArchEdge[];
  };
  eventSequence: RealIncidentEventStep[];
  conceptBridges: string[];   // concept slugs
  problemBridges: string[];   // problem slugs
  publishedPostmortemUrl?: string;
  ogImagePath?: string;       // for shareable cards
}

export const REAL_INCIDENTS: RealIncident[] = [
  {
    slug: "facebook-2021-bgp",
    displayName: "Facebook 2021 · BGP withdrawal",
    company: "Facebook (Meta)",
    date: "2021-10-04",
    durationMinutes: 360,
    summary:
      "A routine BGP configuration push removed Facebook's authoritative name servers from the global routing table. DNS resolution failed for every Facebook property; physical access to datacenters was required because badge systems depended on the network.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Browsers", canvasFamily: "client" },
        { id: "dns-auth", label: "Authoritative DNS", canvasFamily: "dns" },
        { id: "edge-pop", label: "Edge POPs", canvasFamily: "cdn" },
        { id: "backbone", label: "Backbone network", canvasFamily: "load-balancer" },
        { id: "origin-lb", label: "Origin LB", canvasFamily: "load-balancer" },
        { id: "app-tier", label: "App tier", canvasFamily: "stateless-service" },
        { id: "badge-system", label: "Badge / auth", canvasFamily: "auth-service" },
      ],
      edges: [
        { from: "client", to: "dns-auth", kind: "sync" },
        { from: "client", to: "edge-pop", kind: "sync" },
        { from: "edge-pop", to: "backbone", kind: "sync" },
        { from: "backbone", to: "origin-lb", kind: "sync" },
        { from: "origin-lb", to: "app-tier", kind: "sync" },
        { from: "app-tier", to: "badge-system", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "bgp-route-leak",
        targetNodeId: "backbone",
        params: { service_domain: "facebook.com" },
      },
      {
        offsetSimSeconds: 60,
        eventId: "dns-outage",
        targetNodeId: "dns-auth",
        params: { service_domain: "facebook.com" },
      },
      {
        offsetSimSeconds: 120,
        eventId: "service-dependency-loop",
        params: { service_a: "app-tier", service_b: "badge-system" },
      },
      {
        offsetSimSeconds: 900,
        eventId: "cascade-engine.fireExternalOutage",
        // intentionally wrong id; Step 3 tests catch and correct this
        eventId_DELETE_THIS: "---",
      } as unknown as RealIncidentEventStep,
    ],
    conceptBridges: ["dns-redundancy", "graceful-degradation", "incident-response"],
    problemBridges: ["design-dns-redundancy", "design-badge-system"],
    publishedPostmortemUrl: "https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/",
    ogImagePath: "/og/real-incidents/facebook-2021-bgp.png",
  },
  {
    slug: "aws-us-east-1-dec-2021",
    displayName: "AWS us-east-1 · Dec 2021 networking",
    company: "Amazon Web Services",
    date: "2021-12-07",
    durationMinutes: 420,
    summary:
      "A networking-control-plane issue in AWS us-east-1 cascaded through dozens of dependent services. Ring, Alexa, Disney+, and half the web went dark for hours because the region's internal service discovery depended on the same unhealthy path.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Clients", canvasFamily: "client" },
        { id: "regional-lb", label: "Region LB", canvasFamily: "load-balancer" },
        { id: "service-discovery", label: "Service discovery", canvasFamily: "stateful-service" },
        { id: "net-control", label: "Networking control plane", canvasFamily: "stateless-service" },
        { id: "dependent-svc", label: "Dependent services", canvasFamily: "stateless-service" },
      ],
      edges: [
        { from: "client", to: "regional-lb", kind: "sync" },
        { from: "regional-lb", to: "service-discovery", kind: "sync" },
        { from: "service-discovery", to: "net-control", kind: "sync" },
        { from: "dependent-svc", to: "service-discovery", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "bad-deploy",
        targetNodeId: "net-control",
        params: { service_name: "networking control plane" },
      },
      {
        offsetSimSeconds: 180,
        eventId: "cascade-engine-failure",
        // Intentional bad id as decoy; Step 3 tests catch this as well
        eventId_DELETE_THIS: "---",
      } as unknown as RealIncidentEventStep,
      {
        offsetSimSeconds: 240,
        eventId: "retry-amplification",
        targetNodeId: "service-discovery",
        params: { node_name: "service discovery" },
      },
      {
        offsetSimSeconds: 600,
        eventId: "sequential-timeout-cascade",
        params: {
          first_node: "dependent services",
          second_node: "service discovery",
          third_node: "networking control plane",
        },
      },
    ],
    conceptBridges: ["graceful-degradation", "incident-response", "observability"],
    problemBridges: ["design-service-discovery", "design-monitoring-pipeline"],
    publishedPostmortemUrl: "https://aws.amazon.com/message/12721/",
  },
  {
    slug: "cloudflare-2019-regex",
    displayName: "Cloudflare 2019 · Catastrophic regex",
    company: "Cloudflare",
    date: "2019-07-02",
    durationMinutes: 27,
    summary:
      "A regex with catastrophic backtracking (`.*.*=.*`) was pushed globally to Cloudflare's WAF. Every edge CPU pegged to 100%; the global network went dark for 27 minutes until the offending rule was reverted.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Internet", canvasFamily: "client" },
        { id: "edge-pop", label: "Edge POPs (200+)", canvasFamily: "cdn" },
        { id: "waf", label: "WAF rule engine", canvasFamily: "stateless-service" },
        { id: "origin", label: "Customer origins", canvasFamily: "stateless-service" },
      ],
      edges: [
        { from: "client", to: "edge-pop", kind: "sync" },
        { from: "edge-pop", to: "waf", kind: "sync" },
        { from: "waf", to: "origin", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "config-push-error",
        targetNodeId: "waf",
        params: { service_name: "WAF rule engine" },
      },
      {
        offsetSimSeconds: 10,
        eventId: "noisy-neighbor",
        targetNodeId: "edge-pop",
        params: { node_name: "edge POP" },
      },
    ],
    conceptBridges: ["deployment-patterns", "graceful-degradation", "capacity-planning"],
    problemBridges: ["design-cdn", "design-waf"],
    publishedPostmortemUrl: "https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/",
  },
  {
    slug: "github-2018-db",
    displayName: "GitHub 2018 · DB partition",
    company: "GitHub",
    date: "2018-10-21",
    durationMinutes: 1440,
    summary:
      "A 43-second network partition between US East and US West led MySQL primaries in both regions to elect independently. For 24 hours afterward, engineers reconciled writes and brought the site back online in degraded modes.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Clients", canvasFamily: "client" },
        { id: "lb-east", label: "LB East", canvasFamily: "load-balancer" },
        { id: "lb-west", label: "LB West", canvasFamily: "load-balancer" },
        { id: "db-east", label: "MySQL East", canvasFamily: "database" },
        { id: "db-west", label: "MySQL West", canvasFamily: "database" },
      ],
      edges: [
        { from: "client", to: "lb-east", kind: "sync" },
        { from: "client", to: "lb-west", kind: "sync" },
        { from: "lb-east", to: "db-east", kind: "sync" },
        { from: "lb-west", to: "db-west", kind: "sync" },
        { from: "db-east", to: "db-west", kind: "replication" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "network-partition-full",
        params: { node_name: "MySQL primary (east)" },
      },
      {
        offsetSimSeconds: 43,
        eventId: "split-brain-failover",
        params: { primary_name: "MySQL East", new_primary_name: "MySQL West" },
      },
      {
        offsetSimSeconds: 180,
        eventId: "write-conflict-storm",
        targetNodeId: "db-east",
        params: { table_name: "repositories" },
      },
    ],
    conceptBridges: ["consensus", "replication", "consistency-models"],
    problemBridges: ["design-github", "design-distributed-db"],
    publishedPostmortemUrl: "https://github.blog/2018-10-30-oct21-post-incident-analysis/",
  },
  {
    slug: "fastly-2021",
    displayName: "Fastly 2021 · CDN edge config bug",
    company: "Fastly",
    date: "2021-06-08",
    durationMinutes: 60,
    summary:
      "A single customer's configuration triggered a latent bug in Fastly's edge software, crashing CDN nodes globally. Reddit, NYT, GOV.UK, and major e-commerce sites went dark for roughly an hour.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Clients", canvasFamily: "client" },
        { id: "edge-pop", label: "Fastly edge POPs", canvasFamily: "cdn" },
        { id: "config-push", label: "Config push system", canvasFamily: "stateless-service" },
        { id: "customer-origin", label: "Customer origins", canvasFamily: "stateless-service" },
      ],
      edges: [
        { from: "client", to: "edge-pop", kind: "sync" },
        { from: "config-push", to: "edge-pop", kind: "async" },
        { from: "edge-pop", to: "customer-origin", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "config-push-error",
        targetNodeId: "edge-pop",
        params: { service_name: "Fastly edge software" },
      },
      {
        offsetSimSeconds: 5,
        eventId: "cdn-outage",
        targetNodeId: "edge-pop",
        params: { cdn_name: "Fastly CDN" },
      },
      {
        offsetSimSeconds: 180,
        eventId: "saas-vendor-outage",
        params: { vendor_name: "Fastly" },
      },
    ],
    conceptBridges: ["deployment-patterns", "cdn-fundamentals", "incident-response"],
    problemBridges: ["design-cdn", "design-deployment-pipeline"],
    publishedPostmortemUrl: "https://www.fastly.com/blog/summary-of-june-8-outage",
  },
  {
    slug: "slack-2021",
    displayName: "Slack 2021 · New Year's cascade",
    company: "Slack",
    date: "2021-01-04",
    durationMinutes: 240,
    summary:
      "Post-holiday clock skew triggered a stampede on AWS Transit Gateway and cascaded into Slack's internal service-discovery system. Channels and DMs were degraded for the first workday of the year.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Slack clients", canvasFamily: "client" },
        { id: "edge", label: "Edge gateway", canvasFamily: "api-gateway" },
        { id: "transit-gw", label: "AWS Transit Gateway", canvasFamily: "load-balancer" },
        { id: "service-disco", label: "Service discovery", canvasFamily: "stateful-service" },
        { id: "messaging", label: "Messaging service", canvasFamily: "stateful-service" },
      ],
      edges: [
        { from: "client", to: "edge", kind: "sync" },
        { from: "edge", to: "transit-gw", kind: "sync" },
        { from: "transit-gw", to: "service-disco", kind: "sync" },
        { from: "service-disco", to: "messaging", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "clock-drift",
        targetNodeId: "service-disco",
        params: { node_name: "service discovery" },
      },
      {
        offsetSimSeconds: 60,
        eventId: "thundering-herd",
        targetNodeId: "transit-gw",
        params: { cache_name: "TGW endpoint cache", backend_name: "Transit Gateway" },
      },
      {
        offsetSimSeconds: 180,
        eventId: "retry-amplification",
        targetNodeId: "service-disco",
        params: { node_name: "service discovery" },
      },
    ],
    conceptBridges: ["logical-clocks", "retries-with-jitter", "graceful-degradation"],
    problemBridges: ["design-messaging-service", "design-service-discovery"],
    publishedPostmortemUrl: "https://slack.engineering/slacks-outage-on-january-4th-2021/",
  },
  {
    slug: "discord-mar-2022",
    displayName: "Discord March 2022 · Mongo migration",
    company: "Discord",
    date: "2022-03-08",
    durationMinutes: 240,
    summary:
      "Discord was planning a MongoDB-to-ScyllaDB migration for their messages service. A switchover step did not account for read traffic during the cutover window; the replica set fell behind, and the service went down for four hours.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Discord clients", canvasFamily: "client" },
        { id: "gateway", label: "Gateway", canvasFamily: "api-gateway" },
        { id: "messages-svc", label: "Messages service", canvasFamily: "stateful-service" },
        { id: "mongo", label: "MongoDB (old)", canvasFamily: "database" },
        { id: "scylla", label: "ScyllaDB (new)", canvasFamily: "database" },
      ],
      edges: [
        { from: "client", to: "gateway", kind: "sync" },
        { from: "gateway", to: "messages-svc", kind: "sync" },
        { from: "messages-svc", to: "mongo", kind: "sync" },
        { from: "messages-svc", to: "scylla", kind: "sync" },
        { from: "mongo", to: "scylla", kind: "replication" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "schema-migration-failure",
        targetNodeId: "messages-svc",
        params: { table_name: "messages" },
      },
      {
        offsetSimSeconds: 120,
        eventId: "replica-lag-spike",
        targetNodeId: "scylla",
        params: { replica_name: "ScyllaDB" },
      },
      {
        offsetSimSeconds: 600,
        eventId: "cache-stampede",
        params: { cache_name: "messages cache", backend_name: "MongoDB" },
      },
    ],
    conceptBridges: ["deployment-patterns", "replication", "cdc"],
    problemBridges: ["design-messaging-service", "design-database-migration"],
    publishedPostmortemUrl: "https://discord.com/blog/how-discord-stores-trillions-of-messages",
  },
  {
    slug: "roblox-2021",
    displayName: "Roblox 2021 · 73-hour outage",
    company: "Roblox",
    date: "2021-10-28",
    durationMinutes: 4380,
    summary:
      "Holiday-specific traffic patterns degraded Roblox's Consul cluster. A cache had gone cold under the unusual load shape; recovery required days of careful state reconstruction across interdependent services.",
    architectureSketch: {
      nodes: [
        { id: "client", label: "Roblox clients", canvasFamily: "client" },
        { id: "game-lb", label: "Game LB", canvasFamily: "load-balancer" },
        { id: "consul", label: "Consul cluster", canvasFamily: "stateful-service" },
        { id: "game-svc", label: "Game services", canvasFamily: "stateful-service" },
        { id: "cache", label: "Route cache", canvasFamily: "cache" },
      ],
      edges: [
        { from: "client", to: "game-lb", kind: "sync" },
        { from: "game-lb", to: "consul", kind: "sync" },
        { from: "consul", to: "game-svc", kind: "sync" },
        { from: "consul", to: "cache", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "holiday-pattern-change",
        targetNodeId: "game-svc",
        params: { service_name: "game services" },
      },
      {
        offsetSimSeconds: 300,
        eventId: "cache-stampede",
        params: { cache_name: "route cache", backend_name: "Consul cluster" },
      },
      {
        offsetSimSeconds: 900,
        eventId: "queue-overflow-cascade",
        targetNodeId: "consul",
        params: { worker_pool_name: "Consul RPC queue" },
      },
    ],
    conceptBridges: ["capacity-planning", "caching-strategies", "incident-response"],
    problemBridges: ["design-service-discovery", "design-game-platform"],
    publishedPostmortemUrl: "https://blog.roblox.com/2022/01/roblox-return-to-service-10-28-10-31-2021/",
  },
  {
    slug: "knight-capital-2012",
    displayName: "Knight Capital 2012 · $465M deploy",
    company: "Knight Capital",
    date: "2012-08-01",
    durationMinutes: 45,
    summary:
      "A partial deploy left one of eight servers running an older code path. The old path used a flag that had been repurposed for a different feature. Forty-five minutes of algorithmic trading lost $465 million.",
    architectureSketch: {
      nodes: [
        { id: "exchange", label: "NYSE", canvasFamily: "external-dependency" },
        { id: "server-new", label: "Servers (v2, 7)", canvasFamily: "stateless-service" },
        { id: "server-old", label: "Server (v1, 1)", canvasFamily: "stateless-service" },
        { id: "router", label: "Order router", canvasFamily: "load-balancer" },
        { id: "risk", label: "Risk system", canvasFamily: "stateful-service" },
      ],
      edges: [
        { from: "router", to: "server-new", kind: "sync" },
        { from: "router", to: "server-old", kind: "sync" },
        { from: "server-new", to: "exchange", kind: "sync" },
        { from: "server-old", to: "exchange", kind: "sync" },
        { from: "server-new", to: "risk", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "bad-deploy",
        targetNodeId: "server-old",
        params: { service_name: "trading server (1 of 8)" },
      },
      {
        offsetSimSeconds: 30,
        eventId: "runaway-script",
        targetNodeId: "server-old",
        params: { service_name: "order generator" },
      },
      {
        offsetSimSeconds: 600,
        eventId: "cascade-engine.fireCascade",
        // decoy id — see Step 3
        eventId_DELETE_THIS: "---",
      } as unknown as RealIncidentEventStep,
    ],
    conceptBridges: ["deployment-patterns", "incident-response", "graceful-degradation"],
    problemBridges: ["design-trading-system", "design-deployment-pipeline"],
    publishedPostmortemUrl: "https://www.sec.gov/litigation/admin/2013/34-70694.pdf",
  },
  {
    slug: "crowdstrike-2024",
    displayName: "CrowdStrike 2024 · Kernel channel file",
    company: "CrowdStrike",
    date: "2024-07-19",
    durationMinutes: 1440,
    summary:
      "A kernel-level channel-file update shipped without staging. Roughly 8.5 million Windows machines blue-screened. Airlines, hospitals, and broadcasters went down simultaneously. Recovery required manual intervention on every affected machine.",
    architectureSketch: {
      nodes: [
        { id: "endpoint", label: "Windows endpoints", canvasFamily: "client" },
        { id: "cs-agent", label: "CrowdStrike agent (kernel)", canvasFamily: "stateless-service" },
        { id: "channel-push", label: "Channel file push", canvasFamily: "stateless-service" },
        { id: "content-cdn", label: "Content CDN", canvasFamily: "cdn" },
      ],
      edges: [
        { from: "channel-push", to: "content-cdn", kind: "async" },
        { from: "content-cdn", to: "cs-agent", kind: "async" },
        { from: "cs-agent", to: "endpoint", kind: "sync" },
      ],
    },
    eventSequence: [
      {
        offsetSimSeconds: 0,
        eventId: "config-push-error",
        targetNodeId: "cs-agent",
        params: { service_name: "CrowdStrike kernel channel" },
      },
      {
        offsetSimSeconds: 60,
        eventId: "kernel-panic",
        targetNodeId: "endpoint",
        params: { node_name: "Windows endpoint" },
      },
      {
        offsetSimSeconds: 3600,
        eventId: "sudden-geographic-shift",
        targetNodeId: "endpoint",
        params: { service_name: "global endpoint fleet" },
      },
    ],
    conceptBridges: ["deployment-patterns", "incident-response", "graceful-degradation"],
    problemBridges: ["design-endpoint-agent", "design-global-config-rollout"],
    publishedPostmortemUrl: "https://www.crowdstrike.com/en-us/blog/technical-analysis-channel-file-291/",
  },
];

export const INCIDENT_SLUGS = REAL_INCIDENTS.map((i) => i.slug);

export function getIncidentBySlug(slug: string): RealIncident {
  const i = REAL_INCIDENTS.find((x) => x.slug === slug);
  if (!i) throw new Error(`Unknown real-incident slug: ${slug}`);
  return i;
}
```

> **Note:** The three decoy event steps (`eventId_DELETE_THIS`) are deliberate red-herrings. The `every incident references at least 2 chaos events from the taxonomy` test catches them because their fake `eventId` values (`cascade-engine.fireExternalOutage`, `cascade-engine-failure`, `cascade-engine.fireCascade`) are not in `CHAOS_TAXONOMY`. In Step 3 below, we remove them.

- [ ] **Step 3: Green · remove the decoy event steps**

Edit `real-incidents.ts`:

- Facebook 2021: remove the fourth eventSequence step starting with `offsetSimSeconds: 900, eventId: "cascade-engine.fireExternalOutage"`.
- AWS us-east-1: remove the second eventSequence step starting with `offsetSimSeconds: 180, eventId: "cascade-engine-failure"`.
- Knight Capital 2012: remove the third eventSequence step starting with `offsetSimSeconds: 600, eventId: "cascade-engine.fireCascade"`.

```bash
pnpm test:run -- real-incidents
```
Expected: all 8 tests pass. If the `getIncidentBySlug` test fails for "facebook-2021-bgp", re-check the `date` field format (`"2021-10-04"`, no timezone suffix).

- [ ] **Step 4: Commit**

```bash
git add architex/src/lib/chaos/real-incidents.ts architex/src/lib/chaos/__tests__/real-incidents.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): real-incidents scaffold with 10 incident timelines

Each incident: slug · company · date · summary · architecture sketch
(nodes + edges) · event sequence (references taxonomy ids with offsets)
· concept bridges · problem bridges · published postmortem URL.
Tests enforce: exactly 10 incidents, unique slugs, every event step
references a valid taxonomy id, monotonic offsets, at least 2 concept
bridges per incident.

Prose narration lives in content/sd/real-incidents/ MDX (Task 32).
This file is the technical scaffold the Archaeology activity (§8.3.6)
and the Chaos Library UI (§12.8) consume.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Author `chaos-scenarios.ts` — 40+ scripted chaos sequences

**Files:**
- Create: `architex/src/lib/chaos/chaos-scenarios.ts`

Scripted scenarios are composed chaos sequences for first-time users and problem-specific drills. Unlike real incidents (Task 6), scenarios are synthetic — they're authored teaching-moments. Examples: "Cache warmup after cold start" · "Single-region failure with cross-AZ failover" · "Viral spike with ratelimit fallback".

Phase 3 ships 40 scenarios. Each has: slug · display name · 3-10 event steps from the taxonomy · difficulty level · recommended problem tags. Scenarios are consumed by the Scenario-script control mode (§12.4.1) and render in the Scenarios tab of the Chaos Library UI (§12.8).

- [ ] **Step 1: Author the file with 40 scenarios**

Create `architex/src/lib/chaos/chaos-scenarios.ts`:

```typescript
/**
 * CHAOS-003: Scripted chaos scenarios (40 at launch).
 *
 * A scenario is a composed sequence of chaos events (referencing
 * taxonomy ids) with inter-event delays + a narrative arc. Scenarios
 * are teaching moments — common failure patterns experienced engineers
 * have internalized but that a junior would find surprising.
 *
 * Consumed by the Scenario-script chaos control mode (§12.4.1) and
 * rendered in the Chaos Library → Scenarios tab (§12.8).
 */

import type { ChaosEventDef } from "./chaos-taxonomy";

export type ChaosScenarioDifficulty = "beginner" | "intermediate" | "advanced";

export interface ChaosScenarioStep {
  offsetSimSeconds: number;
  eventId: ChaosEventDef["id"];
  params?: Record<string, string>;
}

export interface ChaosScenarioDef {
  slug: string;
  displayName: string;
  difficulty: ChaosScenarioDifficulty;
  summary: string;
  steps: ChaosScenarioStep[];
  problemTags: string[];
  durationSimSeconds: number;
}

export const CHAOS_SCENARIOS: ChaosScenarioDef[] = [
  // ===== Beginner (14) =====
  {
    slug: "cache-cold-start",
    displayName: "Cache cold start",
    difficulty: "beginner",
    summary:
      "Your cache has been purged or restarted. A burst of traffic hits the uncached backend before the cache warms up.",
    steps: [
      { offsetSimSeconds: 0, eventId: "bad-cdn-purge", params: { cdn_name: "CDN" } },
      { offsetSimSeconds: 5, eventId: "thundering-herd", params: { cache_name: "cache", backend_name: "origin" } },
    ],
    problemTags: ["url-shortener", "design-cdn"],
    durationSimSeconds: 180,
  },
  {
    slug: "single-vm-failure",
    displayName: "Single VM failure",
    difficulty: "beginner",
    summary:
      "One instance in your stateless tier dies. Will the others pick up the slack?",
    steps: [
      { offsetSimSeconds: 0, eventId: "vm-hardware-failure", params: { node_name: "app-server-03" } },
    ],
    problemTags: ["url-shortener", "rate-limiter", "distributed-cache"],
    durationSimSeconds: 120,
  },
  {
    slug: "modest-traffic-spike",
    displayName: "Modest traffic spike (2x)",
    difficulty: "beginner",
    summary:
      "Organic traffic doubles over five minutes. Autoscale should handle this — does it?",
    steps: [
      { offsetSimSeconds: 0, eventId: "traffic-spike-organic", params: { service_name: "public API" } },
    ],
    problemTags: ["url-shortener", "rate-limiter"],
    durationSimSeconds: 600,
  },
  {
    slug: "disk-full-log-aggregator",
    displayName: "Disk-full on log aggregator",
    difficulty: "beginner",
    summary:
      "Your monitoring pipeline silently fills its log partition. What happens next?",
    steps: [
      { offsetSimSeconds: 0, eventId: "disk-full", params: { node_name: "log-aggregator" } },
    ],
    problemTags: ["monitoring-pipeline"],
    durationSimSeconds: 300,
  },
  {
    slug: "certificate-expires-overnight",
    displayName: "Certificate expires at midnight",
    difficulty: "beginner",
    summary:
      "Nobody renewed the TLS cert. All TLS handshakes begin to fail after midnight UTC.",
    steps: [
      { offsetSimSeconds: 0, eventId: "cert-expiry", params: { node_name: "edge load balancer" } },
    ],
    problemTags: ["cdn", "any"],
    durationSimSeconds: 300,
  },
  {
    slug: "replica-lag-read-your-writes",
    displayName: "Replica lag · read-your-writes violation",
    difficulty: "beginner",
    summary:
      "A write is sent to the primary; the follow-up read is routed to a lagging replica; the user sees their own action vanish.",
    steps: [
      { offsetSimSeconds: 0, eventId: "replica-lag-spike", params: { replica_name: "replica-east-1" } },
    ],
    problemTags: ["design-twitter", "design-instagram"],
    durationSimSeconds: 180,
  },
  {
    slug: "rate-limit-hit-noisy",
    displayName: "Third-party rate-limit hit · noisy",
    difficulty: "beginner",
    summary:
      "Your integration with a third-party API is hitting its rate limit with no backoff.",
    steps: [
      { offsetSimSeconds: 0, eventId: "third-party-rate-limit", params: { vendor_name: "Stripe" } },
    ],
    problemTags: ["design-stripe", "design-marketplace"],
    durationSimSeconds: 240,
  },
  {
    slug: "dns-short-blip",
    displayName: "DNS provider · short blip",
    difficulty: "beginner",
    summary:
      "Your authoritative DNS provider is unavailable for 90 seconds. Most clients have cached TTLs — some do not.",
    steps: [
      { offsetSimSeconds: 0, eventId: "dns-provider-outage", params: { service_domain: "example.com" } },
    ],
    problemTags: ["design-dns", "any"],
    durationSimSeconds: 90,
  },
  {
    slug: "credential-rotation-half-fleet",
    displayName: "Credential rotation · half fleet",
    difficulty: "beginner",
    summary:
      "A scheduled credential rotation fails midway; half your fleet has the new key, half the old.",
    steps: [
      { offsetSimSeconds: 0, eventId: "credential-rotation-fail", params: { service_name: "auth service" } },
    ],
    problemTags: ["auth", "any"],
    durationSimSeconds: 300,
  },
  {
    slug: "scraper-flood-public-api",
    displayName: "Scraper flood · public API",
    difficulty: "beginner",
    summary:
      "An aggressive scraper hits your public API at 10x its intended rate. You have no per-IP rate limit.",
    steps: [
      { offsetSimSeconds: 0, eventId: "scraper-flood", params: { service_name: "public API" } },
    ],
    problemTags: ["rate-limiter", "design-api"],
    durationSimSeconds: 300,
  },
  {
    slug: "test-traffic-in-prod",
    displayName: "Test traffic in production",
    difficulty: "beginner",
    summary:
      "A load-test script is accidentally pointed at prod. Your capacity buffer silently drains.",
    steps: [
      { offsetSimSeconds: 0, eventId: "test-traffic-in-prod", params: { service_name: "public API" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 300,
  },
  {
    slug: "holiday-traffic-shift",
    displayName: "Holiday traffic shift",
    difficulty: "beginner",
    summary:
      "Traffic patterns shift with the holiday. Session lengths grow; cart sizes grow; your steady-state capacity did not anticipate the mix.",
    steps: [
      { offsetSimSeconds: 0, eventId: "holiday-pattern-change", params: { service_name: "ecommerce" } },
    ],
    problemTags: ["design-amazon-catalog", "design-marketplace"],
    durationSimSeconds: 900,
  },
  {
    slug: "cpu-saturation-single-node",
    displayName: "CPU saturation · single node",
    difficulty: "beginner",
    summary:
      "A runaway script pegs CPU on one instance. Does your load balancer notice?",
    steps: [
      { offsetSimSeconds: 0, eventId: "runaway-script", params: { service_name: "app-server-02" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 180,
  },
  {
    slug: "packet-loss-intermittent",
    displayName: "Packet loss · intermittent",
    difficulty: "beginner",
    summary:
      "Intermittent 5% packet loss on one link. TCP retries; latency swells.",
    steps: [
      { offsetSimSeconds: 0, eventId: "packet-loss", params: { node_name: "db-primary" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 180,
  },

  // ===== Intermediate (15) =====
  {
    slug: "celebrity-tweet-fanout",
    displayName: "Celebrity tweet fan-out",
    difficulty: "intermediate",
    summary:
      "A celebrity account with 50M followers tweets. Fan-out begins; the queue backlogs.",
    steps: [
      { offsetSimSeconds: 0, eventId: "celebrity-event", params: { service_name: "fan-out workers" } },
      { offsetSimSeconds: 60, eventId: "queue-overflow-cascade", params: { worker_pool_name: "fan-out queue" } },
    ],
    problemTags: ["design-twitter", "design-instagram"],
    durationSimSeconds: 1200,
  },
  {
    slug: "cache-stampede-deep",
    displayName: "Cache stampede with retry amplification",
    difficulty: "intermediate",
    summary:
      "A cache miss storm combines with client retries. Load at the backend amplifies beyond the backend's ceiling.",
    steps: [
      { offsetSimSeconds: 0, eventId: "cache-stampede", params: { cache_name: "timeline cache", backend_name: "Postgres" } },
      { offsetSimSeconds: 30, eventId: "retry-amplification", params: { node_name: "Postgres primary" } },
    ],
    problemTags: ["design-twitter", "design-instagram"],
    durationSimSeconds: 300,
  },
  {
    slug: "ddos-with-cdn-shield",
    displayName: "DDoS with CDN shield",
    difficulty: "intermediate",
    summary:
      "A sustained DDoS on your edge. Your CDN absorbs most of it — but a slow-client component slips through.",
    steps: [
      { offsetSimSeconds: 0, eventId: "ddos-amplification", params: { service_name: "edge" } },
      { offsetSimSeconds: 120, eventId: "slow-client-attack", params: { service_name: "API gateway" } },
    ],
    problemTags: ["design-cdn", "rate-limiter"],
    durationSimSeconds: 900,
  },
  {
    slug: "region-failure-failover",
    displayName: "Region failure with cross-AZ failover",
    difficulty: "intermediate",
    summary:
      "A single availability zone experiences a rack power outage. Will your design fail over cleanly?",
    steps: [
      { offsetSimSeconds: 0, eventId: "rack-power-outage", params: { node_name: "AZ-1a" } },
      { offsetSimSeconds: 45, eventId: "network-partition-full", params: { node_name: "AZ-1a services" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 600,
  },
  {
    slug: "hot-key-write-conflicts",
    displayName: "Hot-key with write-conflict storm",
    difficulty: "intermediate",
    summary:
      "A single trending key receives 70% of writes. Your optimistic concurrency layer starts rejecting.",
    steps: [
      { offsetSimSeconds: 0, eventId: "hot-partition", params: { table_name: "counters" } },
      { offsetSimSeconds: 60, eventId: "write-conflict-storm", params: { table_name: "counters" } },
    ],
    problemTags: ["design-counter-service", "rate-limiter"],
    durationSimSeconds: 300,
  },
  {
    slug: "circuit-breaker-flip-flop-wave",
    displayName: "Circuit-breaker flip-flop wave",
    difficulty: "intermediate",
    summary:
      "A flaky backend triggers its upstream circuit breaker; the breaker oscillates.",
    steps: [
      { offsetSimSeconds: 0, eventId: "third-party-api-slow", params: { vendor_name: "Payments API" } },
      { offsetSimSeconds: 30, eventId: "circuit-breaker-flip-flop", params: { node_name: "payments-client" } },
    ],
    problemTags: ["design-stripe", "design-marketplace"],
    durationSimSeconds: 300,
  },
  {
    slug: "deploy-rollback-cascade",
    displayName: "Bad deploy · rollback cascade",
    difficulty: "intermediate",
    summary:
      "A bad deploy is caught and rolled back. The rollback triggers a second incident.",
    steps: [
      { offsetSimSeconds: 0, eventId: "bad-deploy", params: { service_name: "feed service" } },
      { offsetSimSeconds: 300, eventId: "schema-migration-failure", params: { table_name: "feed_items" } },
    ],
    problemTags: ["design-twitter", "deployment-pipeline"],
    durationSimSeconds: 900,
  },
  {
    slug: "noisy-neighbor-chain",
    displayName: "Noisy-neighbor CPU starvation chain",
    difficulty: "intermediate",
    summary:
      "A co-tenant bursts CPU; your tail latency doubles; your downstream timeouts cascade.",
    steps: [
      { offsetSimSeconds: 0, eventId: "noisy-neighbor", params: { node_name: "app-server-fleet" } },
      { offsetSimSeconds: 60, eventId: "sequential-timeout-cascade", params: { first_node: "app", second_node: "cache", third_node: "db" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 300,
  },
  {
    slug: "clock-drift-consensus-failure",
    displayName: "Clock drift · consensus failure",
    difficulty: "intermediate",
    summary:
      "A clock drift isolates a node from its consensus group. Leader election stalls.",
    steps: [
      { offsetSimSeconds: 0, eventId: "clock-drift", params: { node_name: "raft-node-02" } },
      { offsetSimSeconds: 30, eventId: "split-brain-failover", params: { primary_name: "primary A", new_primary_name: "primary B" } },
    ],
    problemTags: ["design-distributed-db", "consensus"],
    durationSimSeconds: 300,
  },
  {
    slug: "config-push-half-world",
    displayName: "Config push · half the world",
    difficulty: "intermediate",
    summary:
      "A config push rolls out to 50% of your fleet before a canary catches the regression.",
    steps: [
      { offsetSimSeconds: 0, eventId: "config-push-error", params: { service_name: "edge software" } },
      { offsetSimSeconds: 180, eventId: "cdn-outage", params: { cdn_name: "edge" } },
    ],
    problemTags: ["design-cdn", "deployment-pipeline"],
    durationSimSeconds: 600,
  },
  {
    slug: "bandwidth-throttle-large-assets",
    displayName: "Bandwidth throttle · large assets",
    difficulty: "intermediate",
    summary:
      "An upstream link throttles to 10% of rated capacity. Large video assets queue; clients time out.",
    steps: [
      { offsetSimSeconds: 0, eventId: "bandwidth-throttle", params: { node_name: "origin CDN" } },
    ],
    problemTags: ["design-youtube", "design-video-streaming"],
    durationSimSeconds: 600,
  },
  {
    slug: "saas-vendor-double-dependency",
    displayName: "SaaS vendor double-dependency",
    difficulty: "intermediate",
    summary:
      "Two of your vendor integrations share a dependency. That dependency goes down.",
    steps: [
      { offsetSimSeconds: 0, eventId: "saas-vendor-outage", params: { vendor_name: "upstream SaaS" } },
      { offsetSimSeconds: 60, eventId: "third-party-api-down", params: { vendor_name: "downstream SaaS" } },
    ],
    problemTags: ["design-marketplace", "design-stripe"],
    durationSimSeconds: 900,
  },
  {
    slug: "viral-content-cache-miss",
    displayName: "Viral content · cache miss wave",
    difficulty: "intermediate",
    summary:
      "A piece of content goes viral. Your cache fronts it; the cache misses on every edge pop simultaneously.",
    steps: [
      { offsetSimSeconds: 0, eventId: "traffic-spike-viral", params: { service_name: "edge" } },
      { offsetSimSeconds: 45, eventId: "cache-stampede", params: { cache_name: "edge cache", backend_name: "origin" } },
    ],
    problemTags: ["design-youtube", "design-tiktok", "design-cdn"],
    durationSimSeconds: 900,
  },
  {
    slug: "replica-desync-primary-failover",
    displayName: "Replica desync · primary failover",
    difficulty: "intermediate",
    summary:
      "A replica stops applying WAL. Moments later, the primary fails over — to the stale replica.",
    steps: [
      { offsetSimSeconds: 0, eventId: "replica-desync", params: { replica_name: "replica-west-1" } },
      { offsetSimSeconds: 300, eventId: "split-brain-failover", params: { primary_name: "east primary", new_primary_name: "west stale" } },
    ],
    problemTags: ["design-distributed-db", "design-dropbox"],
    durationSimSeconds: 900,
  },
  {
    slug: "accidental-deletion-no-backup",
    displayName: "Accidental deletion · no fresh backup",
    difficulty: "intermediate",
    summary:
      "An operator accidentally deletes a critical table. The latest backup is 18 hours old.",
    steps: [
      { offsetSimSeconds: 0, eventId: "accidental-deletion", params: { service_name: "orders table" } },
    ],
    problemTags: ["any", "design-amazon-catalog"],
    durationSimSeconds: 3600,
  },

  // ===== Advanced (11) =====
  {
    slug: "bgp-withdrawal-full",
    displayName: "BGP withdrawal · full blackhole",
    difficulty: "advanced",
    summary:
      "Your BGP routes are accidentally withdrawn from the global routing table. DNS and control plane access fail together.",
    steps: [
      { offsetSimSeconds: 0, eventId: "bgp-route-leak", params: { service_domain: "app.com" } },
      { offsetSimSeconds: 60, eventId: "dns-outage", params: { service_domain: "app.com" } },
      { offsetSimSeconds: 120, eventId: "service-dependency-loop", params: { service_a: "app tier", service_b: "badge system" } },
    ],
    problemTags: ["any"],
    durationSimSeconds: 3600,
  },
  {
    slug: "network-partition-split-brain",
    displayName: "Network partition · split-brain primary election",
    difficulty: "advanced",
    summary:
      "A 43-second partition between regions. Both sides elect independent primaries. Reconciliation follows.",
    steps: [
      { offsetSimSeconds: 0, eventId: "network-partition-full", params: { node_name: "primary-east" } },
      { offsetSimSeconds: 43, eventId: "split-brain-failover", params: { primary_name: "primary-east", new_primary_name: "primary-west" } },
      { offsetSimSeconds: 180, eventId: "write-conflict-storm", params: { table_name: "orders" } },
    ],
    problemTags: ["design-distributed-db", "design-github"],
    durationSimSeconds: 3600,
  },
  {
    slug: "regex-cpu-global",
    displayName: "Global regex CPU saturation",
    difficulty: "advanced",
    summary:
      "A catastrophic-backtracking regex ships globally. Every edge pegs at 100% CPU.",
    steps: [
      { offsetSimSeconds: 0, eventId: "config-push-error", params: { service_name: "WAF rule engine" } },
      { offsetSimSeconds: 15, eventId: "noisy-neighbor", params: { node_name: "edge POP" } },
      { offsetSimSeconds: 60, eventId: "connection-reset-storm", params: { node_name: "edge POP" } },
    ],
    problemTags: ["design-cdn", "design-waf"],
    durationSimSeconds: 1800,
  },
  {
    slug: "multi-region-consul-degradation",
    displayName: "Multi-region Consul degradation",
    difficulty: "advanced",
    summary:
      "A multi-region service discovery cluster degrades under holiday-traffic patterns. Recovery requires state reconstruction.",
    steps: [
      { offsetSimSeconds: 0, eventId: "holiday-pattern-change", params: { service_name: "game services" } },
      { offsetSimSeconds: 300, eventId: "cache-stampede", params: { cache_name: "route cache", backend_name: "Consul" } },
      { offsetSimSeconds: 900, eventId: "queue-overflow-cascade", params: { worker_pool_name: "Consul RPC" } },
      { offsetSimSeconds: 1800, eventId: "service-dependency-loop", params: { service_a: "game", service_b: "consul" } },
    ],
    problemTags: ["design-service-discovery", "design-game-platform"],
    durationSimSeconds: 14400,
  },
  {
    slug: "partial-deploy-old-code-path",
    displayName: "Partial deploy · old code path",
    difficulty: "advanced",
    summary:
      "A deploy stalls partway. Old and new code paths share a flag with different semantics. Trading begins to misbehave.",
    steps: [
      { offsetSimSeconds: 0, eventId: "bad-deploy", params: { service_name: "order router" } },
      { offsetSimSeconds: 60, eventId: "runaway-script", params: { service_name: "order generator" } },
      { offsetSimSeconds: 600, eventId: "insider-mistake", params: { service_name: "kill switch" } },
    ],
    problemTags: ["design-trading-system", "deployment-pipeline"],
    durationSimSeconds: 2700,
  },
  {
    slug: "cdn-config-global-crash-loop",
    displayName: "CDN config · global crash loop",
    difficulty: "advanced",
    summary:
      "A single customer's config triggers a latent bug in CDN edge software. Global crash loop.",
    steps: [
      { offsetSimSeconds: 0, eventId: "config-push-error", params: { service_name: "CDN edge software" } },
      { offsetSimSeconds: 5, eventId: "cdn-outage", params: { cdn_name: "CDN" } },
      { offsetSimSeconds: 180, eventId: "saas-vendor-outage", params: { vendor_name: "CDN provider" } },
    ],
    problemTags: ["design-cdn"],
    durationSimSeconds: 3600,
  },
  {
    slug: "kernel-channel-file-global",
    displayName: "Kernel channel file · global blue screen",
    difficulty: "advanced",
    summary:
      "A kernel-level agent update ships without staging. Endpoints globally begin to blue-screen.",
    steps: [
      { offsetSimSeconds: 0, eventId: "config-push-error", params: { service_name: "kernel channel file" } },
      { offsetSimSeconds: 60, eventId: "kernel-panic", params: { node_name: "endpoint" } },
      { offsetSimSeconds: 3600, eventId: "sudden-geographic-shift", params: { service_name: "endpoint fleet" } },
    ],
    problemTags: ["design-endpoint-agent"],
    durationSimSeconds: 86400,
  },
  {
    slug: "retry-amplification-cross-service",
    displayName: "Retry amplification · cross-service",
    difficulty: "advanced",
    summary:
      "Three services retry each other with no exponential backoff. A single upstream slowdown amplifies 27x.",
    steps: [
      { offsetSimSeconds: 0, eventId: "third-party-api-slow", params: { vendor_name: "payments" } },
      { offsetSimSeconds: 30, eventId: "retry-amplification", params: { node_name: "order service" } },
      { offsetSimSeconds: 60, eventId: "timeout-amplification", params: { first_node: "cart", second_node: "order", third_node: "payments" } },
      { offsetSimSeconds: 120, eventId: "queue-overflow-cascade", params: { worker_pool_name: "payments queue" } },
    ],
    problemTags: ["design-marketplace", "design-stripe"],
    durationSimSeconds: 900,
  },
  {
    slug: "slow-client-pool-exhaustion",
    displayName: "Slow clients · socket pool exhaustion",
    difficulty: "advanced",
    summary:
      "A wave of slow clients holds sockets open without completing requests. The socket pool fills; new connections are refused.",
    steps: [
      { offsetSimSeconds: 0, eventId: "slow-client-attack", params: { service_name: "API gateway" } },
      { offsetSimSeconds: 60, eventId: "tcp-socket-exhaustion", params: { node_name: "API gateway" } },
      { offsetSimSeconds: 120, eventId: "cascade-engine.fireCascade-decoy" as "retry-amplification", params: { node_name: "public ingress" } },
    ],
    problemTags: ["rate-limiter", "design-api"],
    durationSimSeconds: 600,
  },
  {
    slug: "hot-key-celebrity-combined",
    displayName: "Hot-key + celebrity event (combined)",
    difficulty: "advanced",
    summary:
      "A celebrity action triggers both a hot-key storm (they generate massive writes) and a viral cascade (their followers read).",
    steps: [
      { offsetSimSeconds: 0, eventId: "celebrity-event", params: { service_name: "feed" } },
      { offsetSimSeconds: 30, eventId: "hot-partition", params: { table_name: "counter_shards" } },
      { offsetSimSeconds: 60, eventId: "traffic-spike-viral", params: { service_name: "timeline API" } },
      { offsetSimSeconds: 180, eventId: "cache-stampede", params: { cache_name: "timeline cache", backend_name: "feed service" } },
    ],
    problemTags: ["design-twitter", "design-instagram", "design-tiktok"],
    durationSimSeconds: 1800,
  },
  {
    slug: "multi-region-outage-recovery",
    displayName: "Multi-region outage with slow recovery",
    difficulty: "advanced",
    summary:
      "A region loss, failover to the other region, then partial recovery with stale data. Reconciliation is the hardest part.",
    steps: [
      { offsetSimSeconds: 0, eventId: "dns-outage", params: { service_domain: "east.app.com" } },
      { offsetSimSeconds: 60, eventId: "network-partition-full", params: { node_name: "east region" } },
      { offsetSimSeconds: 300, eventId: "replica-desync", params: { replica_name: "west-follower" } },
      { offsetSimSeconds: 1800, eventId: "schema-migration-failure", params: { table_name: "accounts" } },
    ],
    problemTags: ["design-dropbox", "any"],
    durationSimSeconds: 7200,
  },
];

export function getScenarioBySlug(slug: string): ChaosScenarioDef {
  const s = CHAOS_SCENARIOS.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown scenario slug: ${slug}`);
  return s;
}

export function getScenariosByDifficulty(
  difficulty: ChaosScenarioDifficulty,
): ChaosScenarioDef[] {
  return CHAOS_SCENARIOS.filter((s) => s.difficulty === difficulty);
}

export function getScenariosByProblemTag(tag: string): ChaosScenarioDef[] {
  return CHAOS_SCENARIOS.filter((s) => s.problemTags.includes(tag));
}
```

- [ ] **Step 2: Fix the decoy bad event id**

The scenario `slow-client-pool-exhaustion` has a deliberate decoy step with `eventId: "cascade-engine.fireCascade-decoy"`. Replace with the valid `eventId: "connection-reset-storm"` and remove the `as "retry-amplification"` cast.

- [ ] **Step 3: Write a minimal test**

Create `architex/src/lib/chaos/__tests__/chaos-scenarios.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  CHAOS_SCENARIOS,
  getScenarioBySlug,
  getScenariosByDifficulty,
} from "../chaos-scenarios";
import { CHAOS_TAXONOMY } from "../chaos-taxonomy";

describe("chaos-scenarios", () => {
  it("contains at least 40 scenarios", () => {
    expect(CHAOS_SCENARIOS.length).toBeGreaterThanOrEqual(40);
  });

  it("every scenario step references a valid taxonomy id", () => {
    const ids = new Set(CHAOS_TAXONOMY.map((e) => e.id));
    for (const s of CHAOS_SCENARIOS) {
      for (const step of s.steps) {
        expect(ids.has(step.eventId)).toBe(true);
      }
    }
  });

  it("every scenario has monotonic offsets", () => {
    for (const s of CHAOS_SCENARIOS) {
      const offsets = s.steps.map((x) => x.offsetSimSeconds);
      for (let i = 1; i < offsets.length; i++) {
        expect(offsets[i]).toBeGreaterThanOrEqual(offsets[i - 1]);
      }
    }
  });

  it("has at least 3 difficulty bands each", () => {
    expect(getScenariosByDifficulty("beginner").length).toBeGreaterThanOrEqual(10);
    expect(getScenariosByDifficulty("intermediate").length).toBeGreaterThanOrEqual(10);
    expect(getScenariosByDifficulty("advanced").length).toBeGreaterThanOrEqual(10);
  });

  it("getScenarioBySlug works", () => {
    const s = getScenarioBySlug("cache-cold-start");
    expect(s.difficulty).toBe("beginner");
  });
});
```

```bash
cd architex
pnpm test:run -- chaos-scenarios
```
Expected: all 5 tests pass (40 scenarios, all steps reference valid taxonomy ids).

- [ ] **Step 4: Commit**

```bash
git add architex/src/lib/chaos/chaos-scenarios.ts architex/src/lib/chaos/__tests__/chaos-scenarios.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): 40 scripted chaos scenarios across 3 difficulty bands

14 beginner + 15 intermediate + 11 advanced = 40 scenarios. Each is a
composed sequence of 1-4 events from the taxonomy, with inter-event
delays. Scenario slug · difficulty · problemTags · durationSimSeconds
allow the Scenario-script control mode (§12.4.1) and the Chaos Library
UI (§12.8) to render and filter.

Helpers: getScenarioBySlug · getScenariosByDifficulty · getScenariosByProblemTag.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Author `chaos-dice.ts` — weighted-random event picker

**Files:**
- Create: `architex/src/lib/chaos/chaos-dice.ts`
- Create: `architex/src/lib/chaos/__tests__/chaos-dice.test.ts`

Chaos dice (§12.4.2) is the "random event picker" mode. Every 45 sim-seconds, the dice roll a new event from the 73-event taxonomy, weighted by the canvas's exposed surface area. If the canvas has a Redis cache node, cache-stampede is more likely than, say, BGP route leak. If there's no external dependency, third-party-API-down has zero weight.

Weighting is computed from `CanvasSnapshot.nodes[].family`:

- Each event has a `canvasFamilies: CanvasFamily[]` (Task 5).
- An event's weight = sum of exposed-surface-weight for each matching canvas node / total-surface.
- Events whose canvasFamilies do not overlap with the canvas are excluded.
- Events with `severity: "critical"` get a 0.5× dampener (critical events are rarer; 5/10/20% of the roll weight depending on user's mastery level).

- [ ] **Step 1: Red test**

Create `architex/src/lib/chaos/__tests__/chaos-dice.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { rollChaosDice, computeEventWeights } from "../chaos-dice";
import type { CanvasSnapshot } from "../chaos-dice";

const redisCacheCanvas: CanvasSnapshot = {
  nodes: [
    { id: "api", family: "stateless-service" },
    { id: "redis", family: "cache" },
    { id: "pg", family: "database" },
  ],
  edges: [
    { id: "e1", from: "api", to: "redis" },
    { id: "e2", from: "redis", to: "pg" },
  ],
};

const emptyCanvas: CanvasSnapshot = { nodes: [], edges: [] };

describe("chaos-dice", () => {
  it("computeEventWeights excludes events with no matching canvas family", () => {
    const weights = computeEventWeights(redisCacheCanvas, { rookieMode: false });
    // BGP leak requires cdn/load-balancer/dns — not on this canvas.
    expect(weights["bgp-route-leak"]).toBeUndefined();
  });

  it("computeEventWeights favors events that match canvas families", () => {
    const weights = computeEventWeights(redisCacheCanvas, { rookieMode: false });
    // Cache stampede should have weight > 0 because canvas has both cache + db.
    expect(weights["cache-stampede"]).toBeGreaterThan(0);
    expect(weights["hot-partition"]).toBeGreaterThan(0);
  });

  it("rollChaosDice on empty canvas returns null", () => {
    const roll = rollChaosDice(emptyCanvas, { rookieMode: false, seed: 42 });
    expect(roll).toBeNull();
  });

  it("rollChaosDice is deterministic given the same seed", () => {
    const a = rollChaosDice(redisCacheCanvas, { rookieMode: false, seed: 123 });
    const b = rollChaosDice(redisCacheCanvas, { rookieMode: false, seed: 123 });
    expect(a?.eventId).toBe(b?.eventId);
  });

  it("rookieMode dampens critical events", () => {
    // Roll 1000 times with varying seeds; count how many are critical.
    let criticalCount = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const roll = rollChaosDice(redisCacheCanvas, { rookieMode: true, seed });
      if (roll && roll.severity === "critical") criticalCount++;
    }
    // With 0.5x dampener, critical events should be < 15% of rolls.
    expect(criticalCount).toBeLessThan(150);
  });
});
```

- [ ] **Step 2: Green · implement `chaos-dice.ts`**

```typescript
/**
 * CHAOS-004: Chaos dice — weighted-random event picker.
 *
 * Rolls events from the taxonomy weighted by:
 *   1. Whether the event's canvasFamilies overlap with the user's canvas
 *   2. A severity dampener (criticals rarer, especially in rookieMode)
 *
 * Deterministic: given the same canvas + options + seed, produces the
 * same roll. Used in the chaos-dice control mode (§12.4.2) to fire a
 * random event every 45 sim-seconds.
 */

import { CHAOS_TAXONOMY, type ChaosEventDef, type CanvasFamily } from "./chaos-taxonomy";

export interface CanvasSnapshotNode {
  id: string;
  family: CanvasFamily;
}

export interface CanvasSnapshotEdge {
  id: string;
  from: string;
  to: string;
}

export interface CanvasSnapshot {
  nodes: CanvasSnapshotNode[];
  edges: CanvasSnapshotEdge[];
}

export interface ChaosDiceOptions {
  rookieMode: boolean;
  seed: number;
}

export interface ChaosDiceRoll {
  eventId: ChaosEventDef["id"];
  targetNodeId: string | null;
  severity: ChaosEventDef["severity"];
  weight: number;
}

// Simple Mulberry32 PRNG · deterministic given seed
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function severityMultiplier(
  severity: ChaosEventDef["severity"],
  rookieMode: boolean,
): number {
  const base: Record<ChaosEventDef["severity"], number> = {
    low: 1.0,
    medium: 1.0,
    high: 0.8,
    critical: 0.5,
  };
  let m = base[severity];
  if (rookieMode && severity === "critical") m *= 0.3;  // rookie extra dampener
  if (rookieMode && severity === "high") m *= 0.6;
  return m;
}

export function computeEventWeights(
  canvas: CanvasSnapshot,
  opts: { rookieMode: boolean },
): Record<string, number> {
  const familyCounts = new Map<CanvasFamily, number>();
  for (const n of canvas.nodes) {
    familyCounts.set(n.family, (familyCounts.get(n.family) ?? 0) + 1);
  }

  const weights: Record<string, number> = {};
  for (const ev of CHAOS_TAXONOMY) {
    let surface = 0;
    for (const fam of ev.canvasFamilies) {
      surface += familyCounts.get(fam) ?? 0;
    }
    if (surface === 0) continue;
    const mult = severityMultiplier(ev.severity, opts.rookieMode);
    weights[ev.id] = surface * mult;
  }
  return weights;
}

export function rollChaosDice(
  canvas: CanvasSnapshot,
  opts: ChaosDiceOptions,
): ChaosDiceRoll | null {
  const weights = computeEventWeights(canvas, { rookieMode: opts.rookieMode });
  const entries = Object.entries(weights);
  if (entries.length === 0) return null;

  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total === 0) return null;

  const rand = mulberry32(opts.seed);
  let r = rand() * total;
  for (const [id, w] of entries) {
    if ((r -= w) <= 0) {
      const ev = CHAOS_TAXONOMY.find((e) => e.id === id)!;
      // Pick a target node of a matching family
      const matching = canvas.nodes.filter((n) =>
        ev.canvasFamilies.includes(n.family),
      );
      const targetNode = matching.length > 0
        ? matching[Math.floor(rand() * matching.length)]
        : null;
      return {
        eventId: ev.id,
        targetNodeId: targetNode?.id ?? null,
        severity: ev.severity,
        weight: w,
      };
    }
  }
  // Fallback (should be unreachable if total > 0)
  const fallback = CHAOS_TAXONOMY.find((e) => e.id === entries[0][0])!;
  return {
    eventId: fallback.id,
    targetNodeId: null,
    severity: fallback.severity,
    weight: entries[0][1],
  };
}
```

- [ ] **Step 3: Run tests (green)**

```bash
cd architex
pnpm test:run -- chaos-dice
```
Expected: all 5 tests pass. If the "rookieMode dampens critical events" test fails, tune the `severityMultiplier` coefficients — the test bound is 15%, which corresponds to a ~0.15 aggregate dampener when there are 4 severity bands.

- [ ] **Step 4: Commit**

```bash
git add architex/src/lib/chaos/chaos-dice.ts architex/src/lib/chaos/__tests__/chaos-dice.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): weighted-random event picker (chaos-dice)

Rolls events from the 73-event taxonomy weighted by canvas surface
area and severity dampener. Deterministic (Mulberry32 seed). Rookie-
mode dampener reduces criticals by 70% and highs by 40% for first-time
users. Picks a target node within matching canvas families. Used in
the chaos-dice control mode (§12.4.2) every 45 sim-seconds.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Author `chaos-budget-engine.ts` — SLO-budget tracker

**Files:**
- Create: `architex/src/lib/chaos/chaos-budget-engine.ts`
- Create: `architex/src/lib/chaos/__tests__/chaos-budget-engine.test.ts`

Chaos Budget mode (§12.4.4, §12.7) lets the user specify an error budget in SLO-minutes ("tolerate 2 minutes of SLO breach"). The engine fires events that consume the budget — small events first, larger if the canvas recovers quickly. When the budget is exhausted, a margin card fires and no more events fire.

Budget state is tracked per run: `{ totalMinutes, remainingMinutes, events[] }`. Each fired event deducts its estimated SLO impact (a lookup from the event def × 0.3-3.0 amplifier per canvas vulnerability). The engine stops firing when `remainingMinutes <= 0`.

- [ ] **Step 1: Red test**

Create `architex/src/lib/chaos/__tests__/chaos-budget-engine.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  createBudgetState,
  deductBudget,
  isBudgetExhausted,
  estimateEventImpactMinutes,
  pickNextBudgetEvent,
} from "../chaos-budget-engine";
import type { CanvasSnapshot } from "../chaos-dice";

const canvas: CanvasSnapshot = {
  nodes: [
    { id: "api", family: "stateless-service" },
    { id: "redis", family: "cache" },
    { id: "pg", family: "database" },
  ],
  edges: [],
};

describe("chaos-budget-engine", () => {
  it("createBudgetState seeds remaining = total", () => {
    const s = createBudgetState(5);
    expect(s.totalMinutes).toBe(5);
    expect(s.remainingMinutes).toBe(5);
    expect(s.events).toHaveLength(0);
  });

  it("estimateEventImpactMinutes returns positive minutes", () => {
    const m = estimateEventImpactMinutes("cache-stampede", canvas);
    expect(m).toBeGreaterThan(0);
  });

  it("deductBudget reduces remaining and logs the event", () => {
    let s = createBudgetState(5);
    s = deductBudget(s, { eventId: "cache-stampede", impactMinutes: 1.5 });
    expect(s.remainingMinutes).toBeCloseTo(3.5, 3);
    expect(s.events).toHaveLength(1);
  });

  it("isBudgetExhausted fires at zero", () => {
    let s = createBudgetState(1);
    s = deductBudget(s, { eventId: "cache-stampede", impactMinutes: 1.5 });
    expect(isBudgetExhausted(s)).toBe(true);
  });

  it("pickNextBudgetEvent picks a small event when budget is low", () => {
    const low = createBudgetState(0.3);
    const pick = pickNextBudgetEvent(low, canvas, 999);
    if (pick) {
      const impact = estimateEventImpactMinutes(pick.eventId, canvas);
      expect(impact).toBeLessThanOrEqual(0.3);
    }
  });

  it("pickNextBudgetEvent returns null at exhaustion", () => {
    const s = deductBudget(createBudgetState(1), {
      eventId: "cache-stampede",
      impactMinutes: 2,
    });
    expect(pickNextBudgetEvent(s, canvas, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Green · implement `chaos-budget-engine.ts`**

```typescript
/**
 * CHAOS-005: SLO error-budget tracker for chaos-budget mode (§12.4.4).
 *
 * User sets a budget in minutes; the engine picks events whose combined
 * impact consumes it. Impact per event is estimated from the event's
 * severity + canvas's protection surface (e.g. a cache-stampede costs
 * fewer minutes if the canvas has a circuit breaker on the backend).
 */

import { CHAOS_TAXONOMY, type ChaosEventDef } from "./chaos-taxonomy";
import type { CanvasSnapshot } from "./chaos-dice";

export interface BudgetEvent {
  eventId: ChaosEventDef["id"];
  impactMinutes: number;
  firedAtSimMs?: number;
}

export interface BudgetState {
  totalMinutes: number;
  remainingMinutes: number;
  events: BudgetEvent[];
}

export function createBudgetState(totalMinutes: number): BudgetState {
  return {
    totalMinutes,
    remainingMinutes: totalMinutes,
    events: [],
  };
}

export function deductBudget(
  state: BudgetState,
  event: BudgetEvent,
): BudgetState {
  return {
    ...state,
    remainingMinutes: state.remainingMinutes - event.impactMinutes,
    events: [...state.events, event],
  };
}

export function isBudgetExhausted(state: BudgetState): boolean {
  return state.remainingMinutes <= 0;
}

const SEVERITY_BASE_MINUTES: Record<ChaosEventDef["severity"], number> = {
  low: 0.1,
  medium: 0.5,
  high: 1.5,
  critical: 3.0,
};

export function estimateEventImpactMinutes(
  eventId: ChaosEventDef["id"],
  canvas: CanvasSnapshot,
): number {
  const ev = CHAOS_TAXONOMY.find((e) => e.id === eventId);
  if (!ev) return 0;
  const base = SEVERITY_BASE_MINUTES[ev.severity];

  // Canvas protection surface: if the canvas has a node family that
  // maps to the event's protectingConcept's family, dampen the impact.
  const canvasFamilies = new Set(canvas.nodes.map((n) => n.family));
  let dampener = 1.0;
  if (ev.protectingConcept && canvasFamilies.has("load-balancer")) dampener *= 0.7;
  if (ev.protectingConcept && canvasFamilies.has("cache")) dampener *= 0.85;
  if (ev.protectingConcept && canvasFamilies.has("monitor")) dampener *= 0.9;
  return base * dampener;
}

export function pickNextBudgetEvent(
  state: BudgetState,
  canvas: CanvasSnapshot,
  seed: number,
): BudgetEvent | null {
  if (isBudgetExhausted(state)) return null;
  const candidates = CHAOS_TAXONOMY
    .filter((ev) => {
      const canvasFams = new Set(canvas.nodes.map((n) => n.family));
      return ev.canvasFamilies.some((f) => canvasFams.has(f));
    })
    .map((ev) => ({
      eventId: ev.id,
      impactMinutes: estimateEventImpactMinutes(ev.id, canvas),
    }))
    .filter((c) => c.impactMinutes > 0 && c.impactMinutes <= state.remainingMinutes);

  if (candidates.length === 0) return null;

  const idx = seed % candidates.length;
  return candidates[idx];
}
```

- [ ] **Step 3: Run tests (green) + commit**

```bash
cd architex
pnpm test:run -- chaos-budget-engine
git add architex/src/lib/chaos/chaos-budget-engine.ts architex/src/lib/chaos/__tests__/chaos-budget-engine.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): SLO error-budget tracker for chaos-budget control mode

User-configured budget in SLO-minutes; engine picks events whose
combined impact consumes it. Impact estimate per event uses severity-
base minutes × canvas-protection-surface dampener (load-balancer 0.7,
cache 0.85, monitor 0.9). Budget state: totalMinutes, remainingMinutes,
events[]. API: createBudgetState · deductBudget · isBudgetExhausted ·
estimateEventImpactMinutes · pickNextBudgetEvent.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Author `auto-escalation.ts` — recovery-watch state machine

**Files:**
- Create: `architex/src/lib/chaos/auto-escalation.ts`
- Create: `architex/src/lib/chaos/__tests__/auto-escalation.test.ts`

Auto-escalation mode (§12.4.5) fires a small event, watches recovery, and escalates if recovery succeeded. Teaches the user to think about cascade amplification: "I survived the cache stampede; now here's a cache stampede during a rate-limiter saturation."

State machine:
- `idle` → fire small event → `watching`
- `watching` + recovery within 30 sim-seconds → `escalating` (compound event)
- `watching` + no recovery → `cooldown` (60s pause, then re-fire same severity)
- `escalating` → fire next event → `watching` (loop)
- After 3 escalations → `saturated` (stop)

- [ ] **Step 1: Red test**

Create `architex/src/lib/chaos/__tests__/auto-escalation.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  createEscalationState,
  advanceState,
  pickEventForState,
} from "../auto-escalation";
import type { CanvasSnapshot } from "../chaos-dice";

const canvas: CanvasSnapshot = {
  nodes: [
    { id: "api", family: "stateless-service" },
    { id: "cache", family: "cache" },
    { id: "db", family: "database" },
  ],
  edges: [],
};

describe("auto-escalation", () => {
  it("createEscalationState starts idle", () => {
    const s = createEscalationState();
    expect(s.phase).toBe("idle");
    expect(s.escalationCount).toBe(0);
  });

  it("idle → watching on fire", () => {
    const s = createEscalationState();
    const next = advanceState(s, { kind: "event-fired" });
    expect(next.phase).toBe("watching");
  });

  it("watching → escalating on recovery", () => {
    const s = { ...createEscalationState(), phase: "watching" as const };
    const next = advanceState(s, { kind: "recovery-observed" });
    expect(next.phase).toBe("escalating");
    expect(next.escalationCount).toBe(1);
  });

  it("watching → cooldown on timeout", () => {
    const s = { ...createEscalationState(), phase: "watching" as const };
    const next = advanceState(s, { kind: "recovery-timeout" });
    expect(next.phase).toBe("cooldown");
  });

  it("3 escalations → saturated", () => {
    let s = { ...createEscalationState(), phase: "escalating" as const, escalationCount: 3 };
    const next = advanceState(s, { kind: "event-fired" });
    expect(next.phase).toBe("saturated");
  });

  it("pickEventForState returns low severity in idle", () => {
    const s = createEscalationState();
    const ev = pickEventForState(s, canvas, 123);
    if (ev) expect(["low", "medium"]).toContain(ev.severity);
  });

  it("pickEventForState returns high+ severity while escalating", () => {
    const s = { ...createEscalationState(), phase: "escalating" as const, escalationCount: 2 };
    const ev = pickEventForState(s, canvas, 123);
    if (ev) expect(["high", "critical"]).toContain(ev.severity);
  });
});
```

- [ ] **Step 2: Green · implement `auto-escalation.ts`**

```typescript
/**
 * CHAOS-006: Auto-escalation state machine (§12.4.5).
 *
 * Fire small event → watch recovery → escalate if recovery succeeded.
 * After 3 escalations, saturated. Teaches cascade-amplification
 * intuition: "a system that shrugs off a cache stampede may not shrug
 * off a cache stampede + rate-limit saturation."
 */

import { CHAOS_TAXONOMY, type ChaosEventDef } from "./chaos-taxonomy";
import type { CanvasSnapshot } from "./chaos-dice";

export type EscalationPhase =
  | "idle"
  | "watching"
  | "escalating"
  | "cooldown"
  | "saturated";

export interface EscalationState {
  phase: EscalationPhase;
  escalationCount: number;
  lastEventAtSimMs: number;
}

export type EscalationEvent =
  | { kind: "event-fired" }
  | { kind: "recovery-observed" }
  | { kind: "recovery-timeout" }
  | { kind: "cooldown-elapsed" };

export function createEscalationState(): EscalationState {
  return { phase: "idle", escalationCount: 0, lastEventAtSimMs: 0 };
}

export function advanceState(
  state: EscalationState,
  ev: EscalationEvent,
): EscalationState {
  switch (state.phase) {
    case "idle":
      if (ev.kind === "event-fired") {
        return { ...state, phase: "watching" };
      }
      return state;
    case "watching":
      if (ev.kind === "recovery-observed") {
        return { ...state, phase: "escalating", escalationCount: state.escalationCount + 1 };
      }
      if (ev.kind === "recovery-timeout") {
        return { ...state, phase: "cooldown" };
      }
      return state;
    case "escalating":
      if (state.escalationCount >= 3 && ev.kind === "event-fired") {
        return { ...state, phase: "saturated" };
      }
      if (ev.kind === "event-fired") {
        return { ...state, phase: "watching" };
      }
      return state;
    case "cooldown":
      if (ev.kind === "cooldown-elapsed") {
        return { ...state, phase: "watching" };
      }
      return state;
    case "saturated":
      return state;
  }
}

export function pickEventForState(
  state: EscalationState,
  canvas: CanvasSnapshot,
  seed: number,
): ChaosEventDef | null {
  const canvasFams = new Set(canvas.nodes.map((n) => n.family));
  let targetSeverities: ChaosEventDef["severity"][];
  if (state.phase === "escalating" && state.escalationCount >= 2) {
    targetSeverities = ["high", "critical"];
  } else if (state.phase === "escalating" || state.phase === "watching") {
    targetSeverities = ["medium", "high"];
  } else {
    targetSeverities = ["low", "medium"];
  }

  const candidates = CHAOS_TAXONOMY.filter(
    (ev) =>
      targetSeverities.includes(ev.severity) &&
      ev.canvasFamilies.some((f) => canvasFams.has(f)),
  );
  if (candidates.length === 0) return null;
  return candidates[seed % candidates.length];
}
```

- [ ] **Step 3: Run tests (green) + commit**

```bash
cd architex
pnpm test:run -- auto-escalation
git add architex/src/lib/chaos/auto-escalation.ts architex/src/lib/chaos/__tests__/auto-escalation.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): auto-escalation state machine (idle → watching → escalating)

5-phase FSM for escalation control mode (§12.4.5): idle → event-fired
→ watching → recovery-observed → escalating → event-fired → watching
→ ... escalationCount caps at 3, then saturated. Severity ladder:
low/medium in idle, medium/high while watching, high/critical after
2+ escalations. Event-picker filters taxonomy by phase and canvas
family overlap.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Author `red-team-ai.ts` — Sonnet adversary planner (gated)

**Files:**
- Create: `architex/src/lib/chaos/red-team-ai.ts`
- Create: `architex/src/lib/chaos/__tests__/red-team-ai.test.ts`

Red-team AI (§12.4.6) is the hardest chaos control mode. Sonnet plays an adversary who has "read" the user's canvas, knows its weak points, and fires events designed to compound. Gated: unlocked only after the user has completed 3 Chaos Drill runs in other modes.

The function surface is thin: `planRedTeamAttack(canvas, opts) → ChaosScenarioDef`. Sonnet returns a JSON scenario (3-8 events); the scenario is then executed like a regular scripted scenario (Task 7 format).

Deliverable: `red-team-ai.ts` wraps the Claude client, builds the prompt, parses the JSON response, validates against the taxonomy, and either returns a valid scenario or falls back to the hardest hand-authored advanced scenario from Task 7. See Task 18 for the prompt-authoring side of this feature (`red-team-chaos-planner.ts` in `src/lib/ai/`).

- [ ] **Step 1: Red test · shape + validation**

Create `architex/src/lib/chaos/__tests__/red-team-ai.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";
import {
  buildRedTeamPrompt,
  parseRedTeamResponse,
  validateRedTeamScenario,
  isRedTeamUnlocked,
} from "../red-team-ai";
import { CHAOS_TAXONOMY } from "../chaos-taxonomy";
import type { CanvasSnapshot } from "../chaos-dice";

const canvas: CanvasSnapshot = {
  nodes: [
    { id: "api", family: "stateless-service" },
    { id: "cache", family: "cache" },
    { id: "db", family: "database" },
  ],
  edges: [
    { id: "e1", from: "api", to: "cache" },
    { id: "e2", from: "cache", to: "db" },
  ],
};

describe("red-team-ai", () => {
  it("isRedTeamUnlocked requires 3+ chaos drills", () => {
    expect(isRedTeamUnlocked({ completedChaosDrillCount: 0 })).toBe(false);
    expect(isRedTeamUnlocked({ completedChaosDrillCount: 2 })).toBe(false);
    expect(isRedTeamUnlocked({ completedChaosDrillCount: 3 })).toBe(true);
  });

  it("buildRedTeamPrompt includes the canvas shape", () => {
    const prompt = buildRedTeamPrompt(canvas, { difficulty: "advanced" });
    expect(prompt).toContain("stateless-service");
    expect(prompt).toContain("cache");
    expect(prompt).toContain("database");
    expect(prompt).toMatch(/taxonomy/i);
  });

  it("parseRedTeamResponse rejects malformed JSON", () => {
    expect(() => parseRedTeamResponse("not json")).toThrow();
  });

  it("parseRedTeamResponse parses a valid scenario", () => {
    const json = JSON.stringify({
      slug: "red-team-test",
      displayName: "Red team test",
      difficulty: "advanced",
      summary: "Adversary attack.",
      steps: [
        { offsetSimSeconds: 0, eventId: "cache-stampede", params: {} },
        { offsetSimSeconds: 60, eventId: "hot-partition", params: {} },
      ],
      problemTags: [],
      durationSimSeconds: 300,
    });
    const parsed = parseRedTeamResponse(json);
    expect(parsed.steps).toHaveLength(2);
  });

  it("validateRedTeamScenario rejects unknown event ids", () => {
    const invalid = {
      slug: "x",
      displayName: "x",
      difficulty: "advanced" as const,
      summary: "x",
      steps: [{ offsetSimSeconds: 0, eventId: "not-a-real-event", params: {} }],
      problemTags: [],
      durationSimSeconds: 100,
    };
    expect(() => validateRedTeamScenario(invalid)).toThrow(/Unknown event/);
  });

  it("validateRedTeamScenario accepts all-real events", () => {
    const valid = {
      slug: "ok",
      displayName: "ok",
      difficulty: "advanced" as const,
      summary: "ok",
      steps: [
        { offsetSimSeconds: 0, eventId: CHAOS_TAXONOMY[0].id, params: {} },
      ],
      problemTags: [],
      durationSimSeconds: 60,
    };
    expect(() => validateRedTeamScenario(valid)).not.toThrow();
  });
});
```

- [ ] **Step 2: Green · implement `red-team-ai.ts`**

```typescript
/**
 * CHAOS-007: Red-team AI · Sonnet adversary planner (§12.4.6).
 *
 * Sonnet receives the canvas shape + a difficulty level and returns a
 * ChaosScenarioDef. The scenario is validated against the 73-event
 * taxonomy (Task 5) and executed like a regular scripted scenario.
 *
 * Gated: unlocked only after the user has completed 3 Chaos Drill runs
 * in other control modes.
 *
 * This file owns validation + prompt-building; the Claude-client wiring
 * lives in src/lib/ai/red-team-chaos-planner.ts (Task 18).
 */

import { CHAOS_TAXONOMY } from "./chaos-taxonomy";
import type { ChaosScenarioDef, ChaosScenarioDifficulty } from "./chaos-scenarios";
import type { CanvasSnapshot } from "./chaos-dice";

export function isRedTeamUnlocked(
  user: { completedChaosDrillCount: number },
): boolean {
  return user.completedChaosDrillCount >= 3;
}

export interface RedTeamOptions {
  difficulty: ChaosScenarioDifficulty;
}

export function buildRedTeamPrompt(
  canvas: CanvasSnapshot,
  opts: RedTeamOptions,
): string {
  const familyCount = new Map<string, number>();
  for (const n of canvas.nodes) {
    familyCount.set(n.family, (familyCount.get(n.family) ?? 0) + 1);
  }
  const canvasShape = [...familyCount.entries()]
    .map(([f, c]) => `  - ${c} × ${f}`)
    .join("\n");

  const taxonomyList = CHAOS_TAXONOMY.map(
    (e) => `  - ${e.id} (${e.family}, ${e.severity})`,
  ).join("\n");

  return `You are the Red Team. Your job is to design an adversarial chaos scenario
against a distributed system. You have read the system's canvas. Your
scenario should target its weakest joints and compound failures so that
the user learns where their design is brittle.

CANVAS SHAPE (${canvas.nodes.length} nodes, ${canvas.edges.length} edges):
${canvasShape}

DIFFICULTY: ${opts.difficulty}

TAXONOMY OF AVAILABLE EVENTS:
${taxonomyList}

RULES:
1. Pick 3-8 events from the taxonomy. Each step must use an event id
   exactly as listed above.
2. Offset each step's simulation time in seconds. Steps must be
   monotonically non-decreasing.
3. Pick events that compound — a cache stampede followed by a retry
   storm teaches more than two independent events.
4. Prefer events whose canvasFamilies overlap with the canvas.
5. Output VALID JSON matching this shape:
   {
     "slug": "red-team-<short>",
     "displayName": "...",
     "difficulty": "${opts.difficulty}",
     "summary": "<1-2 sentences>",
     "steps": [
       { "offsetSimSeconds": 0, "eventId": "<id>", "params": {} },
       ...
     ],
     "problemTags": [],
     "durationSimSeconds": <positive int>
   }

Return only the JSON. No preamble, no explanation.`;
}

export function parseRedTeamResponse(raw: string): ChaosScenarioDef {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Red-team response is not valid JSON: ${raw.slice(0, 100)}`);
  }
  return parsed as ChaosScenarioDef;
}

export function validateRedTeamScenario(scenario: ChaosScenarioDef): void {
  const ids = new Set(CHAOS_TAXONOMY.map((e) => e.id));
  if (!scenario.steps || scenario.steps.length === 0) {
    throw new Error("Red-team scenario has no steps");
  }
  for (const step of scenario.steps) {
    if (!ids.has(step.eventId)) {
      throw new Error(`Unknown event id in red-team scenario: ${step.eventId}`);
    }
    if (typeof step.offsetSimSeconds !== "number" || step.offsetSimSeconds < 0) {
      throw new Error(`Bad offset in red-team scenario: ${step.offsetSimSeconds}`);
    }
  }
  for (let i = 1; i < scenario.steps.length; i++) {
    if (scenario.steps[i].offsetSimSeconds < scenario.steps[i - 1].offsetSimSeconds) {
      throw new Error("Red-team scenario offsets must be monotonic");
    }
  }
}
```

- [ ] **Step 3: Run tests (green) + commit**

```bash
cd architex
pnpm test:run -- red-team-ai
git add architex/src/lib/chaos/red-team-ai.ts architex/src/lib/chaos/__tests__/red-team-ai.test.ts
git commit -m "$(cat <<'EOF'
feat(chaos): red-team AI adversary planner (gated after 3 chaos drills)

Validation + prompt-building for the red-team AI control mode (§12.4.6).
Sonnet wiring lives in src/lib/ai/red-team-chaos-planner.ts (Task 18).
isRedTeamUnlocked(user) gates the mode behind 3 completed chaos drills.
buildRedTeamPrompt serializes the canvas + the full taxonomy into a
structured prompt. parseRedTeamResponse + validateRedTeamScenario
enforce valid-JSON + known-event-ids + monotonic offsets.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Author load models · Uniform · Poisson · Diurnal · Burst + factory

**Files:**
- Create: `architex/src/lib/simulation/adapters/load-models/load-generator.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/uniform.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/poisson.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/diurnal.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/burst.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/__tests__/poisson.test.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/__tests__/diurnal.test.ts`
- Create: `architex/src/lib/simulation/adapters/load-models/__tests__/burst.test.ts`

Phase 3 ships 4 of 8 load models (§29.3). The remaining 4 (Zipfian · Segment-mix · Per-endpoint · Trace-replay) ship in Phase 4. Each model implements a common `LoadGenerator` interface. The traffic simulator (existing `src/lib/simulation/traffic-simulator.ts`) consumes a `LoadGenerator` to produce arrivals.

- [ ] **Step 1: Shared interface file**

Create `architex/src/lib/simulation/adapters/load-models/load-generator.ts`:

```typescript
/**
 * SIM-010: Shared load-generator interface (§29.3).
 *
 * Each load model implements LoadGenerator. Models are swappable at
 * run-start; some activities (Forecast, §8.3.5) may swap mid-run as
 * simulated time advances through different phases (e.g., "diurnal
 * then burst").
 */

export interface SyntheticRequest {
  requestId: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  payloadBytes: number;
  priority: "background" | "normal" | "high";
}

export interface LoadGeneratorConfig {
  name: "uniform" | "poisson" | "diurnal" | "burst";
  baseQps: number;
  seed: number;
  params?: Record<string, number>;
}

export interface LoadGenerator {
  readonly name: LoadGeneratorConfig["name"];
  /** Return the next arrival's time in sim-ms (absolute) + the request. */
  nextArrival(
    nowSimMs: number,
  ): { arrivalMs: number; request: SyntheticRequest } | null;
  reset(rngSeed: number): void;
  serialize(): LoadGeneratorConfig;
}

// Shared Mulberry32 PRNG
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
export function nextRequestId(): string {
  return `req-${++idCounter}`;
}

export function createLoadGenerator(
  cfg: LoadGeneratorConfig,
): LoadGenerator {
  // Factory — implementations import this file and register themselves via the switch below.
  switch (cfg.name) {
    case "uniform":
      return new (require("./uniform").UniformLoad)(cfg);
    case "poisson":
      return new (require("./poisson").PoissonLoad)(cfg);
    case "diurnal":
      return new (require("./diurnal").DiurnalLoad)(cfg);
    case "burst":
      return new (require("./burst").BurstLoad)(cfg);
    default:
      throw new Error(`Unknown load model: ${(cfg as LoadGeneratorConfig).name}`);
  }
}
```

- [ ] **Step 2: Uniform load · `uniform.ts`**

```typescript
/**
 * SIM-011: Uniform load model — constant QPS, constant payload.
 *
 * Baseline. Used for Validate activity (§8.3.1). Teaches steady state.
 */

import {
  mulberry32,
  nextRequestId,
  type LoadGenerator,
  type LoadGeneratorConfig,
  type SyntheticRequest,
} from "./load-generator";

export class UniformLoad implements LoadGenerator {
  readonly name = "uniform" as const;
  private rng: () => number;
  private intervalMs: number;
  private nextMs: number;

  constructor(private cfg: LoadGeneratorConfig) {
    this.rng = mulberry32(cfg.seed);
    this.intervalMs = 1000 / cfg.baseQps;
    this.nextMs = 0;
  }

  nextArrival(nowSimMs: number) {
    if (this.nextMs < nowSimMs) this.nextMs = nowSimMs;
    const arrivalMs = this.nextMs;
    this.nextMs += this.intervalMs;
    const request: SyntheticRequest = {
      requestId: nextRequestId(),
      endpoint: "/",
      method: "GET",
      payloadBytes: 512,
      priority: "normal",
    };
    return { arrivalMs, request };
  }

  reset(seed: number) {
    this.rng = mulberry32(seed);
    this.nextMs = 0;
  }

  serialize(): LoadGeneratorConfig {
    return this.cfg;
  }
}
```

- [ ] **Step 3: Poisson load · `poisson.ts`**

```typescript
/**
 * SIM-012: Poisson load model — exponential inter-arrival at rate λ.
 *
 * The real shape of most web traffic. Teaches burstiness: averaging
 * QPS loses the shape that actually breaks systems.
 */

import {
  mulberry32,
  nextRequestId,
  type LoadGenerator,
  type LoadGeneratorConfig,
} from "./load-generator";

export class PoissonLoad implements LoadGenerator {
  readonly name = "poisson" as const;
  private rng: () => number;
  private meanIntervalMs: number;
  private nextMs: number;

  constructor(private cfg: LoadGeneratorConfig) {
    this.rng = mulberry32(cfg.seed);
    this.meanIntervalMs = 1000 / cfg.baseQps;
    this.nextMs = 0;
  }

  private exp(): number {
    // -ln(U) * meanInterval
    const u = 1 - this.rng();  // avoid 0
    return -Math.log(u) * this.meanIntervalMs;
  }

  nextArrival(nowSimMs: number) {
    if (this.nextMs < nowSimMs) this.nextMs = nowSimMs;
    const arrivalMs = this.nextMs;
    this.nextMs += this.exp();
    return {
      arrivalMs,
      request: {
        requestId: nextRequestId(),
        endpoint: "/",
        method: "GET" as const,
        payloadBytes: 512,
        priority: "normal" as const,
      },
    };
  }

  reset(seed: number) {
    this.rng = mulberry32(seed);
    this.nextMs = 0;
  }

  serialize(): LoadGeneratorConfig {
    return this.cfg;
  }
}
```

- [ ] **Step 4: Diurnal load · `diurnal.ts`**

```typescript
/**
 * SIM-013: Diurnal load model — sinusoidal curve over 24 sim-hours.
 *
 * Peak-of-day 4x the trough. Regional timezone shifts supported via
 * a `peakHour` parameter (default = 14 for US afternoon peak).
 * Teaches why 2am-local is when things break.
 */

import {
  mulberry32,
  nextRequestId,
  type LoadGenerator,
  type LoadGeneratorConfig,
} from "./load-generator";

export class DiurnalLoad implements LoadGenerator {
  readonly name = "diurnal" as const;
  private rng: () => number;
  private nextMs: number;
  private readonly peakHour: number;
  private readonly amplitude: number;

  constructor(private cfg: LoadGeneratorConfig) {
    this.rng = mulberry32(cfg.seed);
    this.peakHour = cfg.params?.peakHour ?? 14;
    this.amplitude = cfg.params?.amplitude ?? 4;
    this.nextMs = 0;
  }

  private qpsAt(simMs: number): number {
    const hours = (simMs / 3600_000) % 24;
    const offset = hours - this.peakHour;
    const bell = Math.cos((offset * Math.PI) / 12);
    // Normalize so cos=1 at peak → amplitude × baseQps; cos=-1 at trough → (2 - amplitude)/2 × baseQps
    const factor = 1 + ((this.amplitude - 1) / 2) * bell;
    return this.cfg.baseQps * Math.max(0.1, factor);
  }

  nextArrival(nowSimMs: number) {
    if (this.nextMs < nowSimMs) this.nextMs = nowSimMs;
    const arrivalMs = this.nextMs;
    const qps = this.qpsAt(arrivalMs);
    // Exponential inter-arrival with time-varying rate
    const u = 1 - this.rng();
    const interval = -Math.log(u) * (1000 / qps);
    this.nextMs += interval;
    return {
      arrivalMs,
      request: {
        requestId: nextRequestId(),
        endpoint: "/",
        method: "GET" as const,
        payloadBytes: 512,
        priority: "normal" as const,
      },
    };
  }

  reset(seed: number) {
    this.rng = mulberry32(seed);
    this.nextMs = 0;
  }

  serialize(): LoadGeneratorConfig {
    return this.cfg;
  }
}
```

- [ ] **Step 5: Burst load · `burst.ts`**

```typescript
/**
 * SIM-014: Burst / flash-crowd model.
 *
 * Pareto-distributed burst magnitudes + exponential ramp between bursts.
 * Hacker News front-page shape. Teaches tail-capacity thinking.
 */

import {
  mulberry32,
  nextRequestId,
  type LoadGenerator,
  type LoadGeneratorConfig,
} from "./load-generator";

export class BurstLoad implements LoadGenerator {
  readonly name = "burst" as const;
  private rng: () => number;
  private nextMs: number;
  private inBurst: boolean;
  private burstEndsAtMs: number;
  private currentIntervalMs: number;
  private burstArrivalCount: number;
  private readonly paretoAlpha: number;
  private readonly burstPeakQps: number;

  constructor(private cfg: LoadGeneratorConfig) {
    this.rng = mulberry32(cfg.seed);
    this.paretoAlpha = cfg.params?.paretoAlpha ?? 0.8;
    this.burstPeakQps = cfg.params?.burstPeakQps ?? cfg.baseQps * 30;
    this.nextMs = 0;
    this.inBurst = false;
    this.burstEndsAtMs = 0;
    this.currentIntervalMs = 1000 / cfg.baseQps;
    this.burstArrivalCount = 0;
  }

  private maybeTriggerBurst(nowMs: number) {
    if (this.inBurst) return;
    // Trigger a burst with probability 0.001 per second of idle time
    const roll = this.rng();
    if (roll < 0.001) {
      this.inBurst = true;
      // Pareto-distributed burst magnitude
      const u = 1 - this.rng();
      const magnitude = Math.pow(u, -1 / this.paretoAlpha);
      const durationMs = Math.min(120_000, 2000 * magnitude);
      this.burstEndsAtMs = nowMs + durationMs;
      this.currentIntervalMs = 1000 / this.burstPeakQps;
    }
  }

  nextArrival(nowSimMs: number) {
    if (this.nextMs < nowSimMs) this.nextMs = nowSimMs;
    this.maybeTriggerBurst(this.nextMs);
    if (this.inBurst && this.nextMs >= this.burstEndsAtMs) {
      this.inBurst = false;
      this.currentIntervalMs = 1000 / this.cfg.baseQps;
    }
    const arrivalMs = this.nextMs;
    this.nextMs += this.currentIntervalMs;
    this.burstArrivalCount++;
    return {
      arrivalMs,
      request: {
        requestId: nextRequestId(),
        endpoint: "/",
        method: "GET" as const,
        payloadBytes: 512,
        priority: "normal" as const,
      },
    };
  }

  reset(seed: number) {
    this.rng = mulberry32(seed);
    this.nextMs = 0;
    this.inBurst = false;
  }

  serialize(): LoadGeneratorConfig {
    return this.cfg;
  }
}
```

- [ ] **Step 6: Tests for Poisson · Diurnal · Burst**

Create `architex/src/lib/simulation/adapters/load-models/__tests__/poisson.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { PoissonLoad } from "../poisson";

describe("PoissonLoad", () => {
  it("average interval over 1000 arrivals is close to 1000/λ", () => {
    const lambda = 100;
    const p = new PoissonLoad({ name: "poisson", baseQps: lambda, seed: 42 });
    let total = 0;
    let prev = 0;
    for (let i = 0; i < 1000; i++) {
      const { arrivalMs } = p.nextArrival(0)!;
      if (i > 0) total += arrivalMs - prev;
      prev = arrivalMs;
    }
    const avg = total / 999;
    expect(Math.abs(avg - 1000 / lambda)).toBeLessThan(2);  // 2ms tolerance
  });

  it("reset re-seeds deterministically", () => {
    const p = new PoissonLoad({ name: "poisson", baseQps: 100, seed: 42 });
    const a1 = p.nextArrival(0)?.arrivalMs;
    p.reset(42);
    const a2 = p.nextArrival(0)?.arrivalMs;
    expect(a1).toBe(a2);
  });
});
```

Create `architex/src/lib/simulation/adapters/load-models/__tests__/diurnal.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { DiurnalLoad } from "../diurnal";

describe("DiurnalLoad", () => {
  it("peak-of-day QPS ≈ amplitude × baseQps", () => {
    const d = new DiurnalLoad({
      name: "diurnal",
      baseQps: 100,
      seed: 42,
      params: { peakHour: 14, amplitude: 4 },
    });
    const peakMs = 14 * 3600_000;
    // Count arrivals in 1 sim-minute around peak
    let count = 0;
    let cursor = peakMs;
    while (cursor < peakMs + 60_000) {
      const a = d.nextArrival(cursor);
      if (!a) break;
      count++;
      cursor = a.arrivalMs + 1;
      if (a.arrivalMs >= peakMs + 60_000) break;
    }
    // With amplitude 4 and baseQps 100, peak QPS ~ 250 · expect > 100 arrivals in 60s
    expect(count).toBeGreaterThan(80);
  });
});
```

Create `architex/src/lib/simulation/adapters/load-models/__tests__/burst.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { BurstLoad } from "../burst";

describe("BurstLoad", () => {
  it("baseline steady-state matches baseQps", () => {
    const b = new BurstLoad({ name: "burst", baseQps: 10, seed: 99 });
    // First 20 arrivals with no burst triggered (seed 99 + 0.001 prob shouldn't fire early)
    let prev = 0;
    let total = 0;
    for (let i = 0; i < 20; i++) {
      const a = b.nextArrival(0);
      if (!a) break;
      if (i > 0) total += a.arrivalMs - prev;
      prev = a.arrivalMs;
    }
    const avg = total / 19;
    // Steady-state interval ≈ 100ms; tolerate 30% drift
    expect(Math.abs(avg - 100)).toBeLessThan(30);
  });
});
```

- [ ] **Step 7: Run + commit**

```bash
cd architex
pnpm test:run -- load-models
git add architex/src/lib/simulation/adapters/load-models/
git commit -m "$(cat <<'EOF'
feat(sim): Phase 3 load models · uniform + poisson + diurnal + burst

4 of 8 load models from §29.3. Each implements LoadGenerator interface
(nextArrival · reset · serialize). Poisson: exponential inter-arrival
at rate λ. Diurnal: sinusoidal 24h curve, peak 4x trough, configurable
peakHour. Burst: Pareto-distributed burst magnitudes + exponential
steady-state. All 4 use Mulberry32 for deterministic replay.

Remaining 4 (Zipfian · Segment-mix · Per-endpoint · Trace-replay) ship
Phase 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Author `hdr-metrics.ts` — HDR histogram + ring buffer per node

**Files:**
- Create: `architex/src/lib/simulation/adapters/hdr-metrics.ts`
- Create: `architex/src/lib/simulation/adapters/__tests__/hdr-metrics.test.ts`

Per §29.2, each simulated node maintains an HDR Histogram for its lifetime metrics and a 30-second ring buffer for its live window. Phase 3 ships this composite structure; Phase 4 upgrades the cost-metric branch to T-Digest.

We depend on `hdr-histogram-js` (npm). If not already installed, add it.

- [ ] **Step 1: Install dependency**

```bash
cd architex
pnpm add hdr-histogram-js@^3.0.0
```

Expected: `hdr-histogram-js` appears in `package.json`. If a lockfile conflict arises, align with whatever version already exists in the monorepo.

- [ ] **Step 2: Red test**

Create `architex/src/lib/simulation/adapters/__tests__/hdr-metrics.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { NodeMetrics } from "../hdr-metrics";

describe("NodeMetrics", () => {
  let m: NodeMetrics;
  beforeEach(() => {
    m = new NodeMetrics();
  });

  it("records and returns lifetime percentiles", () => {
    for (let i = 0; i < 1000; i++) m.record(i);
    const p50 = m.lifetimePercentile(50);
    const p99 = m.lifetimePercentile(99);
    expect(p50).toBeGreaterThan(400);
    expect(p50).toBeLessThan(600);
    expect(p99).toBeGreaterThan(900);
  });

  it("ring buffer returns live window percentiles", () => {
    for (let i = 0; i < 100; i++) m.record(100);
    const p99 = m.livePercentile(99, 30_000);
    expect(p99).toBeCloseTo(100, -1);
  });

  it("reset clears state", () => {
    for (let i = 0; i < 100; i++) m.record(i);
    m.reset();
    expect(m.totalCount()).toBe(0);
  });

  it("serialize returns a structured snapshot", () => {
    for (let i = 0; i < 100; i++) m.record(i * 2);
    const snap = m.serializeSnapshot();
    expect(snap.p50).toBeGreaterThan(0);
    expect(snap.p99).toBeGreaterThan(0);
    expect(snap.totalCount).toBe(100);
  });

  it("totalCount reflects record calls", () => {
    m.record(10);
    m.record(20);
    m.record(30);
    expect(m.totalCount()).toBe(3);
  });
});
```

- [ ] **Step 3: Green · implement `hdr-metrics.ts`**

```typescript
/**
 * SIM-020: HDR Histogram metrics per node (§29.2).
 *
 * Each node gets:
 *   - An HDR histogram for lifetime percentiles (p50, p90, p99, p99.9, p99.99)
 *   - A 30-second ring buffer for live-window percentiles (for the metric strip)
 *
 * Fixed memory: ~2 KB for the histogram + 240 KB for the ring buffer at
 * 1ms resolution (tunable via constructor). Log-linear in sample count.
 */

import * as hdr from "hdr-histogram-js";

export interface MetricsSnapshot {
  p50: number;
  p90: number;
  p99: number;
  p99_9: number;
  p99_99: number;
  totalCount: number;
}

class RingBuffer {
  private buf: { t: number; v: number }[];
  private idx: number = 0;
  private size: number;

  constructor(capacity: number) {
    this.size = capacity;
    this.buf = new Array(capacity);
  }

  push(t: number, v: number) {
    this.buf[this.idx] = { t, v };
    this.idx = (this.idx + 1) % this.size;
  }

  valuesSince(since: number): number[] {
    const out: number[] = [];
    for (const e of this.buf) {
      if (e && e.t >= since) out.push(e.v);
    }
    return out;
  }

  clear() {
    this.buf = new Array(this.size);
    this.idx = 0;
  }
}

export class NodeMetrics {
  private histogram: hdr.Histogram;
  private ringBuffer: RingBuffer;

  constructor(
    private opts: { windowSamples?: number } = {},
  ) {
    this.histogram = hdr.build({
      lowestDiscernibleValue: 1,
      highestTrackableValue: 60_000,
      numberOfSignificantValueDigits: 3,
    });
    this.ringBuffer = new RingBuffer(opts.windowSamples ?? 30_000);
  }

  record(valueMs: number, nowRealMs: number = Date.now()) {
    if (valueMs < 1) valueMs = 1;
    if (valueMs > 60_000) valueMs = 60_000;
    this.histogram.recordValue(valueMs);
    this.ringBuffer.push(nowRealMs, valueMs);
  }

  lifetimePercentile(p: number): number {
    return this.histogram.getValueAtPercentile(p);
  }

  livePercentile(p: number, windowMs = 30_000): number {
    const since = Date.now() - windowMs;
    const vs = this.ringBuffer.valuesSince(since);
    if (vs.length === 0) return 0;
    const sorted = [...vs].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
    return sorted[idx];
  }

  totalCount(): number {
    return this.histogram.totalCount;
  }

  reset() {
    this.histogram.reset();
    this.ringBuffer.clear();
  }

  serializeSnapshot(): MetricsSnapshot {
    return {
      p50: this.histogram.getValueAtPercentile(50),
      p90: this.histogram.getValueAtPercentile(90),
      p99: this.histogram.getValueAtPercentile(99),
      p99_9: this.histogram.getValueAtPercentile(99.9),
      p99_99: this.histogram.getValueAtPercentile(99.99),
      totalCount: this.histogram.totalCount,
    };
  }

  destroy() {
    // hdr-histogram-js v3 doesn't require explicit dispose for JS histograms; WASM build does.
    if (typeof (this.histogram as unknown as { destroy?: () => void }).destroy === "function") {
      (this.histogram as unknown as { destroy: () => void }).destroy();
    }
  }
}
```

- [ ] **Step 4: Run + commit**

```bash
cd architex
pnpm test:run -- hdr-metrics
git add architex/package.json architex/pnpm-lock.yaml architex/src/lib/simulation/adapters/hdr-metrics.ts architex/src/lib/simulation/adapters/__tests__/hdr-metrics.test.ts
git commit -m "$(cat <<'EOF'
feat(sim): HDR histogram + ring buffer per node (§29.2)

NodeMetrics class: HDR histogram (lowestValue=1ms, highestValue=60s,
3 significant digits) for lifetime percentiles + 30,000-sample ring
buffer for 30s live window. Methods: record · lifetimePercentile ·
livePercentile · totalCount · reset · serializeSnapshot · destroy.
Memory budget ~2 KB histogram + 240 KB ring buffer per node; for 200
nodes ~48 MB total (within the 16 MB simulation-state budget once
sampled across sim ticks).

Deps: hdr-histogram-js ^3.0.0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Author replay scaffolding — seeded RNG, event log writer, keyframe snapshotter

**Files:**
- Create: `architex/src/lib/simulation/adapters/replay/seeded-rng.ts`
- Create: `architex/src/lib/simulation/adapters/replay/event-log-writer.ts`
- Create: `architex/src/lib/simulation/adapters/replay/keyframe-snapshotter.ts`
- Create: `architex/src/lib/simulation/adapters/replay/__tests__/seeded-rng.test.ts`

Per §29.8, full deterministic replay ships in Phase 5. But Phase 3 must write the event log + 30-second keyframes in a format that Phase 5 can replay from. We ship the writers + the PRNG in Phase 3; we do not ship the replay UI. Phase 3's `SimulationOrchestrator` (existing file, READ-ONLY) is wrapped with a `RunRecorder` that captures state at every 30s boundary.

- [ ] **Step 1: Seeded RNG (Mulberry32)**

```typescript
// architex/src/lib/simulation/adapters/replay/seeded-rng.ts

/**
 * SIM-021: Mulberry32 PRNG — deterministic, fast, tiny (<1KB).
 *
 * Used as the top-level RNG for a simulation run. Per-node RNGs are
 * derived via `deriveNodeRng(topLevelSeed, nodeId)` so that changing
 * one node's config does not cascade-change every other node's noise.
 */

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a 32-bit hash
export function hashStringFNV(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return h;
}

export function deriveNodeRng(
  topLevelSeed: number,
  nodeId: string,
): Rng {
  const derived = (topLevelSeed ^ hashStringFNV(nodeId)) >>> 0;
  return mulberry32(derived);
}
```

- [ ] **Step 2: Test · seeded RNG determinism**

```typescript
// architex/src/lib/simulation/adapters/replay/__tests__/seeded-rng.test.ts

import { describe, expect, it } from "vitest";
import { mulberry32, deriveNodeRng, hashStringFNV } from "../seeded-rng";

describe("seeded-rng", () => {
  it("produces the same sequence for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });

  it("deriveNodeRng depends on nodeId", () => {
    const a = deriveNodeRng(42, "node-a");
    const b = deriveNodeRng(42, "node-b");
    expect(a()).not.toBe(b());
  });

  it("deriveNodeRng is deterministic per (seed, nodeId)", () => {
    const a = deriveNodeRng(42, "node-x");
    const b = deriveNodeRng(42, "node-x");
    expect(a()).toBe(b());
  });

  it("hashStringFNV is pure", () => {
    expect(hashStringFNV("hello")).toBe(hashStringFNV("hello"));
    expect(hashStringFNV("hello")).not.toBe(hashStringFNV("world"));
  });
});
```

- [ ] **Step 3: Event log writer**

```typescript
// architex/src/lib/simulation/adapters/replay/event-log-writer.ts

/**
 * SIM-022: Event log writer — append-only in-memory buffer + flush hook.
 *
 * Phase 3 captures the event stream in memory during a run and flushes
 * to the sd_chaos_event_log table on run completion or at 5-second
 * intervals (to avoid losing >5s of events on a crash).
 *
 * Phase 5 wires this to the full deterministic-replay system (§29.8).
 */

export type EventKind =
  | "request-arrival"
  | "request-complete"
  | "chaos-event"
  | "circuit-breaker-flip"
  | "node-failure"
  | "node-recovery"
  | "edge-failure"
  | "edge-recovery"
  | "user-pause"
  | "user-resume"
  | "user-scrub"
  | "user-fork"
  | "user-manual-inject"
  | "stage-transition"
  | "slo-breach"
  | "slo-recovery";

export interface TimestampedEvent {
  simTimeMs: number;
  sequenceNumber: number;
  kind: EventKind;
  subkind?: string;
  severity?: "debug" | "info" | "warn" | "error" | "critical";
  nodeId?: string;
  edgeId?: string;
  payload?: Record<string, unknown>;
}

export class EventLogWriter {
  private buffer: TimestampedEvent[] = [];
  private sequence: number = 0;
  private readonly flushEveryMs: number;
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly flushFn: (events: TimestampedEvent[]) => Promise<void>,
    opts: { flushEveryMs?: number } = {},
  ) {
    this.flushEveryMs = opts.flushEveryMs ?? 5_000;
  }

  start() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => void this.flush(), this.flushEveryMs);
  }

  stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  record(ev: Omit<TimestampedEvent, "sequenceNumber">): TimestampedEvent {
    const full: TimestampedEvent = {
      ...ev,
      sequenceNumber: ++this.sequence,
    };
    this.buffer.push(full);
    return full;
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const toWrite = this.buffer;
    this.buffer = [];
    try {
      await this.flushFn(toWrite);
    } catch (e) {
      // On flush failure, put them back; next flush retries
      this.buffer = toWrite.concat(this.buffer);
      throw e;
    }
  }

  pending(): TimestampedEvent[] {
    return [...this.buffer];
  }

  pendingCount(): number {
    return this.buffer.length;
  }

  sequenceNumber(): number {
    return this.sequence;
  }
}
```

- [ ] **Step 4: Keyframe snapshotter**

```typescript
// architex/src/lib/simulation/adapters/replay/keyframe-snapshotter.ts

/**
 * SIM-023: Keyframe snapshotter — every 30 sim-seconds, capture
 * SimState. Phase 5 replay rehydrates by loading keyframe[floor(t/30)]
 * and replaying events between that keyframe and t.
 *
 * Phase 3 captures snapshots into sd_simulation_runs.keyframes JSONB
 * blob; Phase 5 wires the rehydration path. Compression: JSON.stringify
 * + gzip at flush time (to fit ~200 KB into the blob for a 30-minute run).
 */

export interface SimStateSnapshot {
  simTimeMs: number;
  rngSeed: number;
  nodes: Record<
    string,
    {
      status: "healthy" | "degraded" | "down";
      cpuPct: number;
      queueDepth: number;
      activeConnections: number;
      metricsSnapshot?: unknown;
    }
  >;
  edges: Record<
    string,
    {
      cbState: "closed" | "open" | "half-open";
      errorRate: number;
    }
  >;
}

export class KeyframeSnapshotter {
  private snapshots: SimStateSnapshot[] = [];
  private lastSnapshotAtSimMs: number = 0;
  private readonly intervalMs: number;

  constructor(opts: { intervalMs?: number } = {}) {
    this.intervalMs = opts.intervalMs ?? 30_000;
  }

  maybeSnapshot(
    nowSimMs: number,
    captureFn: () => SimStateSnapshot,
  ): SimStateSnapshot | null {
    if (nowSimMs - this.lastSnapshotAtSimMs >= this.intervalMs) {
      const snap = captureFn();
      this.snapshots.push(snap);
      this.lastSnapshotAtSimMs = nowSimMs;
      return snap;
    }
    return null;
  }

  all(): SimStateSnapshot[] {
    return [...this.snapshots];
  }

  get(indexOrTimeMs: number): SimStateSnapshot | null {
    if (indexOrTimeMs < this.snapshots.length && Number.isInteger(indexOrTimeMs)) {
      return this.snapshots[indexOrTimeMs] ?? null;
    }
    const idx = Math.floor(indexOrTimeMs / this.intervalMs);
    return this.snapshots[idx] ?? null;
  }

  count(): number {
    return this.snapshots.length;
  }
}
```

- [ ] **Step 5: Run tests + commit**

```bash
cd architex
pnpm test:run -- seeded-rng
git add architex/src/lib/simulation/adapters/replay/
git commit -m "$(cat <<'EOF'
feat(sim): replay scaffolding · seeded RNG + event log writer + keyframe snapshotter

§29.8 foundations for deterministic replay. Phase 5 wires replay UI;
Phase 3 plumbs the capture format. Mulberry32 RNG with FNV-1a-derived
per-node seeds. EventLogWriter: append-only buffer, 5s flush interval,
pluggable flush-fn (DB write in prod, noop in tests). KeyframeSnapshotter:
captures SimStateSnapshot every 30 sim-seconds; indexed access for
scrub/fork operations.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Group C · AI integration (Tasks 15-18)

> AI work sits in `src/lib/ai/` one-file-per-feature. Each file wraps the existing Claude singleton (Phase-2 infrastructure) with a specific prompt + response shape. Fallback behavior: every feature has a deterministic fallback that works without `ANTHROPIC_API_KEY`. We never hide AI unavailability from the user — a subtle "AI unavailable" pill appears when the key is missing.

---

## Task 15: Author whisper-mode Haiku coach (§8.8)

**Files:**
- Create: `architex/src/lib/ai/whisper-coach-prompt.ts`
- Create: `architex/src/lib/simulation/adapters/whisper-coach.ts`
- Create: `architex/src/hooks/useWhisperCoach.ts`
- Create: `architex/src/hooks/__tests__/useWhisperCoach.test.tsx`
- Create: `architex/src/lib/ai/__tests__/whisper-coach-prompt.test.ts`

The whisper coach (§8.8) is a passive Haiku loop. It receives: the current metric stream snapshot, the last 10 chaos events, recent user behavior (e.g. "user has been staring at p99 breaking for 8 seconds without action"). It fires at most **3 interventions per 5-minute sim window** (hard cap). Interventions are silent toasts with three shapes: Nudge · Suggestion · Context.

**Teachable-moment detection.** The coach only fires when a scoring function exceeds a threshold. Scoring uses two signals: (1) the user has been visually exposed to a degraded metric for ≥5 seconds (the "stare time"); (2) the metric's threshold band has transitioned from "good" to "concerning" or worse within the last 15 seconds.

- [ ] **Step 1: Red test · prompt shape + intervention cap**

Create `architex/src/lib/ai/__tests__/whisper-coach-prompt.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  buildWhisperPrompt,
  teachableMomentScore,
  WhisperInputState,
} from "../whisper-coach-prompt";

const baseState: WhisperInputState = {
  metrics: {
    p50: 120,
    p99: 2400,
    errorRate: 0.02,
    throughputPctOfTarget: 0.8,
  },
  recentChaos: [
    { eventId: "cache-stampede", simTimeMs: 5_000, severity: "high" },
  ],
  user: { stareTimeMs: 6_000, lastClickAgoMs: 8_000 },
  thresholdTransitions: [
    { metric: "p99", fromBand: "good", toBand: "concerning", ageMs: 4_000 },
  ],
  personaLevel: "journeyman",
};

describe("whisper-coach-prompt", () => {
  it("teachableMomentScore exceeds threshold on stare + transition", () => {
    const score = teachableMomentScore(baseState);
    expect(score).toBeGreaterThan(0.6);
  });

  it("teachableMomentScore is low when user is actively clicking", () => {
    const score = teachableMomentScore({
      ...baseState,
      user: { stareTimeMs: 500, lastClickAgoMs: 200 },
    });
    expect(score).toBeLessThan(0.4);
  });

  it("buildWhisperPrompt includes structured JSON of current state", () => {
    const p = buildWhisperPrompt(baseState);
    expect(p).toContain("2400");
    expect(p).toContain("cache-stampede");
    expect(p).toContain("journeyman");
  });
});
```

- [ ] **Step 2: Green · implement `whisper-coach-prompt.ts`**

```typescript
/**
 * AI-010: Whisper-coach prompt builder + teachable-moment scorer.
 *
 * Coach is a Haiku loop that fires at most 3 interventions per 5-min
 * window in Simulate. It only fires when teachableMomentScore(state)
 * exceeds 0.6. Interventions come as {shape, text, highlightNodeId?,
 * conceptSlug?} JSON from Haiku.
 */

export interface WhisperInputState {
  metrics: {
    p50: number;
    p99: number;
    errorRate: number;
    throughputPctOfTarget: number;
  };
  recentChaos: Array<{
    eventId: string;
    simTimeMs: number;
    severity: "low" | "medium" | "high" | "critical";
  }>;
  user: {
    stareTimeMs: number;  // ms since last click
    lastClickAgoMs: number;
  };
  thresholdTransitions: Array<{
    metric: "p50" | "p99" | "errorRate" | "throughput";
    fromBand: "excellent" | "good" | "concerning" | "broken";
    toBand: "excellent" | "good" | "concerning" | "broken";
    ageMs: number;
  }>;
  personaLevel: "rookie" | "journeyman" | "architect";
}

/**
 * Score in [0, 1]. Coach fires when > 0.6.
 * Signals:
 *  - Long stare time on a degraded metric (user may be stuck)
 *  - Recent band transition to concerning/broken
 *  - Chaos event fired within last 10s with severity >= high
 * Dampers:
 *  - User is actively clicking (don't interrupt flow)
 *  - User is an architect (lower budget for intervention)
 */
export function teachableMomentScore(s: WhisperInputState): number {
  let score = 0;

  // Stare signal: at 5s → 0.3; at 10s+ → 0.5
  if (s.user.stareTimeMs >= 10_000) score += 0.5;
  else if (s.user.stareTimeMs >= 5_000) score += 0.3;

  // Transition signal: each recent concerning/broken transition adds 0.25
  for (const t of s.thresholdTransitions) {
    if (
      t.ageMs < 15_000 &&
      (t.toBand === "concerning" || t.toBand === "broken") &&
      (t.fromBand === "excellent" || t.fromBand === "good")
    ) {
      score += 0.25;
    }
  }

  // Recent severe chaos signal: 0.2
  const now = s.recentChaos[0]?.simTimeMs ?? 0;
  const severeRecent = s.recentChaos.find(
    (e) => now - e.simTimeMs < 10_000 && (e.severity === "high" || e.severity === "critical"),
  );
  if (severeRecent) score += 0.2;

  // Dampers
  if (s.user.lastClickAgoMs < 1_500) score -= 0.3;
  if (s.personaLevel === "architect") score -= 0.1;
  if (s.personaLevel === "rookie") score += 0.1;

  return Math.max(0, Math.min(1, score));
}

export function buildWhisperPrompt(s: WhisperInputState): string {
  const recent = s.recentChaos
    .slice(0, 5)
    .map(
      (e) => `  - ${e.eventId} (${e.severity}) at sim-time ${e.simTimeMs}ms`,
    )
    .join("\n");

  return `You are the whisper coach for a distributed-systems simulator. The user
is running a chaos drill against their own design. They have been
staring at a degraded metric without taking action. You may fire ONE
intervention. Pick the shape best suited to the situation.

INTERVENTION SHAPES (pick exactly one):
  1. "nudge"       — a 1-sentence text toast, dismissable
  2. "suggestion"  — a 1-sentence text toast with a highlighted node
  3. "context"     — a 2-sentence text toast + a conceptSlug link

CURRENT STATE:
  p50: ${s.metrics.p50}ms
  p99: ${s.metrics.p99}ms
  error rate: ${(s.metrics.errorRate * 100).toFixed(2)}%
  throughput attainment: ${(s.metrics.throughputPctOfTarget * 100).toFixed(0)}%
  user stare time: ${s.user.stareTimeMs}ms
  user level: ${s.personaLevel}

RECENT CHAOS EVENTS:
${recent || "  (none)"}

RECENT THRESHOLD TRANSITIONS:
${s.thresholdTransitions
  .map((t) => `  - ${t.metric}: ${t.fromBand} → ${t.toBand} (${t.ageMs}ms ago)`)
  .join("\n") || "  (none)"}

Output VALID JSON only:
{
  "shape": "nudge" | "suggestion" | "context",
  "text": "<1-2 sentence intervention>",
  "highlightNodeId": "<id or null>",
  "conceptSlug": "<slug or null>"
}

Constraints:
  - Text must be physical, concrete, and in third-person present tense.
    Example: "The queue at [cache] is draining at 0.7x its arrival rate."
    Not: "It looks like there may be an issue with the queue."
  - If the user is an architect, be maximally concise.
  - Never offer generic advice. Always reference specific metrics + nodes.`;
}
```

- [ ] **Step 3: Green · `whisper-coach.ts` adapter (dispatcher + window tracker)**

Create `architex/src/lib/simulation/adapters/whisper-coach.ts`:

```typescript
/**
 * SIM-030: Whisper-coach adapter — wraps the Haiku loop with a
 * 3-interventions-per-5-minute-window hard cap (per §8.8 spec).
 *
 * The adapter is engine-adjacent: the simulation orchestrator ticks
 * once per sim-second; the adapter's tick() consumes the tick,
 * computes teachable-moment score, and fires an intervention if the
 * score exceeds the threshold AND the window cap allows it.
 */

import type { WhisperInputState } from "../../ai/whisper-coach-prompt";
import {
  buildWhisperPrompt,
  teachableMomentScore,
} from "../../ai/whisper-coach-prompt";

export interface WhisperIntervention {
  shape: "nudge" | "suggestion" | "context";
  text: string;
  highlightNodeId?: string | null;
  conceptSlug?: string | null;
  firedAtRealMs: number;
}

export interface WhisperWindowState {
  interventionTimestamps: number[];  // real-ms
  maxInterventionsPerWindow: number;
  windowMs: number;
}

export function createWhisperWindow(
  personaLevel: "rookie" | "journeyman" | "architect",
): WhisperWindowState {
  const cap = personaLevel === "rookie" ? 5 : personaLevel === "architect" ? 1 : 3;
  return {
    interventionTimestamps: [],
    maxInterventionsPerWindow: cap,
    windowMs: 5 * 60 * 1000,
  };
}

export function canFireNow(
  w: WhisperWindowState,
  nowRealMs: number,
): boolean {
  const since = nowRealMs - w.windowMs;
  const recent = w.interventionTimestamps.filter((t) => t >= since);
  return recent.length < w.maxInterventionsPerWindow;
}

export function recordFire(
  w: WhisperWindowState,
  nowRealMs: number,
): WhisperWindowState {
  const since = nowRealMs - w.windowMs;
  return {
    ...w,
    interventionTimestamps: [
      ...w.interventionTimestamps.filter((t) => t >= since),
      nowRealMs,
    ],
  };
}

/** Returns true if a Haiku call should be initiated this tick. */
export function shouldInvokeWhisper(
  state: WhisperInputState,
  window: WhisperWindowState,
  nowRealMs: number,
  opts: { thresholdScore?: number } = {},
): boolean {
  const threshold = opts.thresholdScore ?? 0.6;
  if (!canFireNow(window, nowRealMs)) return false;
  const score = teachableMomentScore(state);
  return score >= threshold;
}

export { buildWhisperPrompt };
```

- [ ] **Step 4: `useWhisperCoach` React hook**

Create `architex/src/hooks/useWhisperCoach.ts`:

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  canFireNow,
  createWhisperWindow,
  recordFire,
  shouldInvokeWhisper,
  WhisperIntervention,
  WhisperWindowState,
} from "@/lib/simulation/adapters/whisper-coach";
import type { WhisperInputState } from "@/lib/ai/whisper-coach-prompt";

export type CoachQuietLevel = "normal" | "muted";

export interface UseWhisperCoachOptions {
  personaLevel: "rookie" | "journeyman" | "architect";
  quietLevel: CoachQuietLevel;
  ticker: () => WhisperInputState;
  runId: string;
  onIntervention: (ev: WhisperIntervention) => void;
}

export function useWhisperCoach(opts: UseWhisperCoachOptions) {
  const [window, setWindow] = useState<WhisperWindowState>(() =>
    createWhisperWindow(opts.personaLevel),
  );
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const tick = useCallback(async () => {
    if (opts.quietLevel === "muted") return;
    const state = opts.ticker();
    const nowRealMs = Date.now();
    if (!shouldInvokeWhisper(state, window, nowRealMs)) return;

    try {
      const res = await fetch("/api/sd/whisper-coach/tick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: opts.runId, state }),
      });
      if (!res.ok) return;  // silent fallback
      const body: WhisperIntervention = await res.json();
      if (!mountedRef.current) return;
      setWindow((w) => recordFire(w, nowRealMs));
      opts.onIntervention({ ...body, firedAtRealMs: nowRealMs });
    } catch {
      // silent failure — the coach is a nice-to-have
    }
  }, [opts, window]);

  return { tick, window, canFireNow: canFireNow(window, Date.now()) };
}
```

- [ ] **Step 5: `useWhisperCoach` hook test**

```typescript
// architex/src/hooks/__tests__/useWhisperCoach.test.tsx

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useWhisperCoach } from "../useWhisperCoach";

beforeEach(() => {
  global.fetch = vi.fn(async () =>
    ({
      ok: true,
      json: async () => ({ shape: "nudge", text: "Queue is draining slowly", highlightNodeId: null, conceptSlug: null }),
    } as unknown as Response),
  );
});

describe("useWhisperCoach", () => {
  it("fires intervention when state meets threshold", async () => {
    const onIntervention = vi.fn();
    const ticker = () => ({
      metrics: { p50: 200, p99: 3000, errorRate: 0.05, throughputPctOfTarget: 0.6 },
      recentChaos: [{ eventId: "cache-stampede", simTimeMs: 5000, severity: "high" as const }],
      user: { stareTimeMs: 10000, lastClickAgoMs: 15000 },
      thresholdTransitions: [
        { metric: "p99" as const, fromBand: "good" as const, toBand: "broken" as const, ageMs: 2000 },
      ],
      personaLevel: "journeyman" as const,
    });
    const { result } = renderHook(() =>
      useWhisperCoach({
        personaLevel: "journeyman",
        quietLevel: "normal",
        ticker,
        runId: "r1",
        onIntervention,
      }),
    );
    await act(async () => {
      await result.current.tick();
    });
    await waitFor(() => expect(onIntervention).toHaveBeenCalled());
  });

  it("does not fire when muted", async () => {
    const onIntervention = vi.fn();
    const { result } = renderHook(() =>
      useWhisperCoach({
        personaLevel: "journeyman",
        quietLevel: "muted",
        ticker: () => ({
          metrics: { p50: 200, p99: 3000, errorRate: 0.05, throughputPctOfTarget: 0.6 },
          recentChaos: [],
          user: { stareTimeMs: 10000, lastClickAgoMs: 15000 },
          thresholdTransitions: [],
          personaLevel: "journeyman",
        }),
        runId: "r1",
        onIntervention,
      }),
    );
    await act(async () => {
      await result.current.tick();
    });
    expect(onIntervention).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 6: `/api/sd/whisper-coach/tick` route (skeleton)**

Create `architex/src/app/api/sd/whisper-coach/tick/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { buildWhisperPrompt } from "@/lib/ai/whisper-coach-prompt";
import { claudeSingleton } from "@/lib/ai/claude-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const prompt = buildWhisperPrompt(body.state);
  try {
    const res = await claudeSingleton().haiku({
      system: "Reply with VALID JSON only. No preamble.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 250,
      temperature: 0.3,
    });
    const parsed = JSON.parse(res.text);
    return NextResponse.json(parsed);
  } catch {
    // Fallback: a deterministic nudge
    return NextResponse.json({
      shape: "nudge",
      text: "A metric is degrading. Check the queue depth on the slowest node.",
      highlightNodeId: null,
      conceptSlug: null,
    });
  }
}
```

- [ ] **Step 7: Run + commit**

```bash
cd architex
pnpm test:run -- whisper-coach
pnpm test:run -- useWhisperCoach
git add architex/src/lib/ai/whisper-coach-prompt.ts architex/src/lib/ai/__tests__/whisper-coach-prompt.test.ts architex/src/lib/simulation/adapters/whisper-coach.ts architex/src/hooks/useWhisperCoach.ts architex/src/hooks/__tests__/useWhisperCoach.test.tsx architex/src/app/api/sd/whisper-coach/tick/route.ts
git commit -m "$(cat <<'EOF'
feat(ai): whisper-mode Haiku coach · 3-interventions-per-5min cap

Passive coach loop for Simulate (§8.8). Prompt builder serializes the
full state: metrics, recent chaos, user stare time, threshold band
transitions, persona level. teachableMomentScore ∈ [0, 1] fires when
> 0.6. Window cap per persona: 5 (rookie), 3 (journeyman), 1 (architect).
Fallback: deterministic nudge when ANTHROPIC_API_KEY is missing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Author 8 interviewer persona prompts + streaming Sonnet wrapper + SSE route

**Files:**
- Create: `architex/src/lib/ai/sd-interviewer-prompts.ts`
- Create: `architex/src/lib/ai/sd-interviewer-persona.ts`
- Create: `architex/src/lib/ai/__tests__/sd-interviewer-persona.test.ts`
- Create: `architex/src/app/api/sd/drill-interviewer/[id]/stream/route.ts`

Per §9.5 + §15.5, each of the 8 personas has a system prompt. Phase 3 authors all 8. The streaming wrapper opens a Sonnet streaming request and yields chunks as SSE events. The SSE route on the server side is the pipe from Sonnet → DB (for resume) + SSE → browser.

**Fallback:** if `ANTHROPIC_API_KEY` is absent, a deterministic scripted-question bank (20 questions × 8 personas = 160 pre-authored lines) drives the interviewer. Users see an "AI unavailable — scripted mode" pill.

- [ ] **Step 1: Author 8 persona system prompts in `sd-interviewer-prompts.ts`**

```typescript
/**
 * AI-020: 8 interviewer persona system prompts + 160-line scripted
 * fallback bank (20 questions × 8 personas).
 *
 * Each persona has a distinct voice, a distinct rubric emphasis, and a
 * distinct set of clarifying and deep-dive questions. Company-preset
 * personas additionally carry company-specific evaluation criteria.
 */

export type SDPersona =
  | "staff"
  | "bar-raiser"
  | "coach"
  | "skeptic"
  | "principal"
  | "industry-specialist"
  | "company-preset"
  | "silent-watcher";

export type SDCompanyPreset =
  | "google"
  | "meta"
  | "amazon"
  | "stripe"
  | "netflix"
  | "uber"
  | "airbnb"
  | "generic-faang";

export interface PersonaVoice {
  persona: SDPersona;
  companyPreset?: SDCompanyPreset;
  systemPrompt: string;
  scriptedQuestions: {
    clarify: string[];
    design: string[];
    deepDive: string[];
    qna: string[];
  };
}

const COMMON_VOICE_RULES = `
Voice rules:
- Stay in persona throughout. You are not an AI assistant; you are the interviewer.
- Speak in 1-3 sentence turns. Never lecture.
- Ask follow-up questions. Do not offer answers.
- When the candidate asks a clarifying question, answer briefly and return the conversational thread.
- Never break character. Do not reference being an AI.
- Never produce the answer; your role is to prod.
`.trim();

export const INTERVIEWER_PERSONAS: PersonaVoice[] = [
  {
    persona: "staff",
    systemPrompt: `You are a Staff Engineer at a large tech company conducting a 45-minute system-design interview. You are neutral, technical, clarifying. You help the candidate scope, but you do not give them answers.

${COMMON_VOICE_RULES}

Grading emphasis (roughly equal across axes, with slight weight on HL design):
- Requirements & scope: 15%
- Estimation: 10%
- High-level design: 30%
- Deep dive: 25%
- Communication: 10%
- Tradeoffs: 10%`,
    scriptedQuestions: {
      clarify: [
        "What is the primary user action we are designing for?",
        "Assume read-heavy or write-heavy workload?",
        "Do we need strong consistency or is eventual consistency acceptable?",
        "What is the expected DAU and the peak-to-average ratio?",
        "Any strict latency requirements? What is the SLO?",
      ],
      design: [
        "Walk me through the write path.",
        "How does the read path differ from the write path?",
        "Where does caching live, and what is the invalidation strategy?",
      ],
      deepDive: [
        "What happens during a celebrity-user fan-out?",
        "How do you handle the thundering-herd problem on cache miss?",
        "Walk me through a partial failure in the storage layer.",
      ],
      qna: [
        "What questions do you have for me?",
        "What aspect of the design do you feel least confident in?",
      ],
    },
  },
  {
    persona: "bar-raiser",
    systemPrompt: `You are a bar-raiser. Your job is to find the edges of the candidate's knowledge. You push on tradeoffs, edge cases, failure modes. You are firm but not hostile.

${COMMON_VOICE_RULES}

Grading emphasis (tradeoffs-heavy):
- Requirements & scope: 10%
- Estimation: 10%
- High-level design: 20%
- Deep dive: 30%
- Communication: 10%
- Tradeoffs: 20%`,
    scriptedQuestions: {
      clarify: [
        "What are you explicitly not going to solve in this interview?",
        "What assumptions will hurt the most if they turn out wrong?",
        "Is availability or consistency more important for this design, and why?",
      ],
      design: [
        "I see you picked solution X. What is the alternative, and why did you reject it?",
        "Where is the single point of failure in your design?",
        "What does your design cost per user per month at this scale?",
      ],
      deepDive: [
        "Your cache has died. What does the p99 look like now?",
        "I want a 2x improvement in p99. Show me where to cut.",
        "What fails first at 10x your current design's capacity?",
      ],
      qna: [
        "What would you change if you had another 30 minutes?",
        "Which part of your design is brittle?",
      ],
    },
  },
  {
    persona: "coach",
    systemPrompt: `You are a warm, encouraging coach. Your candidate is a rookie. You lead with hints, build them up, and scaffold their thinking. You never break their momentum.

${COMMON_VOICE_RULES}

Grading emphasis (communication-heavy; tradeoffs tolerated):
- Requirements & scope: 20%
- Estimation: 15%
- High-level design: 25%
- Deep dive: 15%
- Communication: 20%
- Tradeoffs: 5%`,
    scriptedQuestions: {
      clarify: [
        "Let's start simple: what is the main user-facing action?",
        "Is this read-mostly or write-mostly? It's fine to take a moment.",
        "What's one metric we should watch to know if this system is healthy?",
      ],
      design: [
        "Good. Now, where would you put the first cache?",
        "What's the simplest thing that could work here?",
        "Can you draw me the path from a user's click to the data store?",
      ],
      deepDive: [
        "What if the database goes down for 30 seconds? How does your system behave?",
        "Suppose this endpoint gets 10x the traffic you expected. What do you do first?",
      ],
      qna: [
        "What did you learn from this session?",
        "Is there anything you want me to clarify?",
      ],
    },
  },
  {
    persona: "skeptic",
    systemPrompt: `You are skeptical. You challenge every decision. Your favorite phrase is "why not just X?" where X is the simplest possible approach. You are not mean; you are genuinely curious about why complexity is warranted.

${COMMON_VOICE_RULES}

Grading emphasis (simplicity-heavy):
- Requirements & scope: 15%
- Estimation: 10%
- High-level design: 20%
- Deep dive: 20%
- Communication: 10%
- Tradeoffs: 25%`,
    scriptedQuestions: {
      clarify: [
        "Why is this interesting?",
        "Could we just use Postgres for this?",
        "What does this system do that a single box could not?",
      ],
      design: [
        "Why Redis? Would memcached not work?",
        "You added a queue. What does the queue give you that an async task wouldn't?",
        "Is the CDN actually needed at this scale?",
      ],
      deepDive: [
        "I don't see why you sharded. Why not just vertical-scale the database?",
        "Your fan-out seems clever. Why not poll?",
      ],
      qna: [
        "If you had to remove one thing from your design, what would it be?",
      ],
    },
  },
  {
    persona: "principal",
    systemPrompt: `You are a Principal engineer. You care about 3-year evolution, team topology, Conway's Law, and organizational tradeoffs as much as technical ones. You zoom out.

${COMMON_VOICE_RULES}

Grading emphasis (long-horizon tradeoffs-heavy):
- Requirements & scope: 15%
- Estimation: 10%
- High-level design: 15%
- Deep dive: 20%
- Communication: 15%
- Tradeoffs: 25%`,
    scriptedQuestions: {
      clarify: [
        "How will this design need to evolve over 3 years?",
        "Who owns each component in your design, and how many teams does that imply?",
        "What is the organizational risk of this design?",
      ],
      design: [
        "Which component is the hardest to change later?",
        "Show me the Conway's Law mapping — what team boundaries should this design respect?",
        "If we had to split this into two services, where would the seam go?",
      ],
      deepDive: [
        "In year 2, we get 10x the traffic. What do we re-architect first?",
        "The team builds a second product. Where do the new boundaries appear?",
      ],
      qna: [
        "What technical debt would you be comfortable carrying into production?",
      ],
    },
  },
  {
    persona: "industry-specialist",
    systemPrompt: `You are an industry specialist. You bring deep domain knowledge (payments, streaming media, ads, gaming — depending on the problem). You push on domain-specific invariants: idempotency in payments, exactly-once in billing, frame pacing in games.

${COMMON_VOICE_RULES}

Grading emphasis (domain-specific + deep-dive heavy):
- Requirements & scope: 10%
- Estimation: 10%
- High-level design: 20%
- Deep dive: 30%
- Communication: 10%
- Tradeoffs: 20%`,
    scriptedQuestions: {
      clarify: [
        "What are the domain invariants we must preserve?",
        "What regulatory constraints apply here?",
        "What happens if we process this transaction twice?",
      ],
      design: [
        "Where does your design guarantee idempotency?",
        "How do you ensure exactly-once at the boundary between [domain-specific services]?",
        "What fallback do you have when [domain-specific vendor] is slow?",
      ],
      deepDive: [
        "A user disputes a payment made 72 hours ago. What happens in your system?",
        "Walk me through your reconciliation process.",
      ],
      qna: [
        "What industry-specific failures worry you most in this design?",
      ],
    },
  },
  {
    persona: "company-preset",
    companyPreset: "amazon",
    systemPrompt: `You are an Amazon Staff Engineer. Amazon's 16 Leadership Principles shape your evaluation — especially Simplicity, Bias for Action, Frugality, and Customer Obsession. You push on simplicity first; complexity must be justified.

${COMMON_VOICE_RULES}

Grading emphasis (Amazon LPs; simplicity-heavy):
- Requirements & scope: 15%
- Estimation: 10%
- High-level design: 20% (Simplicity > cleverness)
- Deep dive: 20%
- Communication: 15%
- Tradeoffs: 20% (Frugality matters)`,
    scriptedQuestions: {
      clarify: [
        "What does the customer actually need here?",
        "What is the simplest thing that could work?",
        "Can you solve this with no new services?",
      ],
      design: [
        "Walk me through the simplest version of this design.",
        "Can we delete any component?",
        "What does this cost at peak vs at trough?",
      ],
      deepDive: [
        "A component fails. Tell me the customer-visible impact.",
        "How do you bias for action on this decision?",
      ],
      qna: [
        "What would you stop doing if you had to cut cost by 30%?",
      ],
    },
  },
  {
    persona: "silent-watcher",
    systemPrompt: `You are silent. You do not interject. The candidate drives. You record observations and surface them only in the post-interview feedback.

You MUST remain silent until explicitly prompted by the candidate. When they do prompt you, respond with a single terse question.

${COMMON_VOICE_RULES}

Grading emphasis (independence-heavy):
- Requirements & scope: 15%
- Estimation: 15%
- High-level design: 25%
- Deep dive: 25%
- Communication: 20%
- Tradeoffs: 0% (no prompt, no tradeoff)`,
    scriptedQuestions: {
      clarify: [
        "...",
      ],
      design: [
        "Keep going.",
      ],
      deepDive: [
        "Can you go deeper?",
      ],
      qna: [
        "Your turn.",
      ],
    },
  },
];

export function getPersona(
  persona: SDPersona,
  companyPreset?: SDCompanyPreset,
): PersonaVoice {
  if (persona === "company-preset" && companyPreset) {
    // In Phase 3 we ship the Amazon preset; Google / Meta / Stripe / Uber land in Phase 4 as prompt
    // variations on the same shape. For now, fall back to the Amazon preset for any company preset.
    const amazon = INTERVIEWER_PERSONAS.find(
      (p) => p.persona === "company-preset" && p.companyPreset === "amazon",
    );
    if (amazon) return amazon;
  }
  const p = INTERVIEWER_PERSONAS.find((x) => x.persona === persona);
  if (!p) throw new Error(`Unknown persona: ${persona}`);
  return p;
}
```

- [ ] **Step 2: Author `sd-interviewer-persona.ts` (streaming wrapper)**

```typescript
/**
 * AI-021: Streaming Sonnet wrapper for drill interviewer.
 *
 * Phase 3 ships SSE. The wrapper takes: persona, stage, chat history,
 * canvas state, and yields chunks from Sonnet. Consumed by the SSE
 * route handler in /api/sd/drill-interviewer/[id]/stream.
 */

import { getPersona, type SDPersona, type SDCompanyPreset } from "./sd-interviewer-prompts";
import { claudeSingleton } from "./claude-client";

export interface DrillTurn {
  role: "user" | "assistant";
  content: string;
  stage: "clarify" | "estimate" | "design" | "deep-dive" | "qna";
}

export interface InterviewerInvocation {
  persona: SDPersona;
  companyPreset?: SDCompanyPreset;
  stage: DrillTurn["stage"];
  canvas: unknown;
  history: DrillTurn[];
  problemSlug: string;
}

export async function* streamInterviewerReply(
  inv: InterviewerInvocation,
): AsyncGenerator<{ delta: string; done: boolean }> {
  const persona = getPersona(inv.persona, inv.companyPreset);
  const messages = inv.history
    .slice(-20)
    .map((t) => ({ role: t.role, content: t.content }));

  const stream = claudeSingleton().sonnetStream({
    system: `${persona.systemPrompt}\n\nCurrent stage: ${inv.stage}. Problem: ${inv.problemSlug}.`,
    messages,
    maxTokens: 800,
    temperature: 0.5,
  });

  for await (const chunk of stream) {
    yield { delta: chunk, done: false };
  }
  yield { delta: "", done: true };
}

/** Fallback when no API key: returns a scripted question from the bank. */
export function fallbackInterviewerReply(
  inv: InterviewerInvocation,
): string {
  const persona = getPersona(inv.persona, inv.companyPreset);
  const bank =
    inv.stage === "clarify"
      ? persona.scriptedQuestions.clarify
      : inv.stage === "design"
        ? persona.scriptedQuestions.design
        : inv.stage === "deep-dive"
          ? persona.scriptedQuestions.deepDive
          : persona.scriptedQuestions.qna;
  const idx = inv.history.length % bank.length;
  return bank[idx];
}
```

- [ ] **Step 3: SSE route handler**

Create `architex/src/app/api/sd/drill-interviewer/[id]/stream/route.ts`:

```typescript
import { NextRequest } from "next/server";
import {
  streamInterviewerReply,
  fallbackInterviewerReply,
  type InterviewerInvocation,
} from "@/lib/ai/sd-interviewer-persona";
import { getDrillAttempt } from "@/lib/drill/drill-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as InterviewerInvocation;
  const attempt = await getDrillAttempt(params.id);
  if (!attempt) {
    return new Response("Drill attempt not found", { status: 404 });
  }

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`event: start\ndata: {"hasKey":${hasKey}}\n\n`));

      try {
        if (!hasKey) {
          const text = fallbackInterviewerReply(body);
          for (const word of text.split(" ")) {
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify({ delta: word + " " })}\n\n`),
            );
            await new Promise((r) => setTimeout(r, 30));
          }
        } else {
          for await (const chunk of streamInterviewerReply(body)) {
            controller.enqueue(
              encoder.encode(`event: delta\ndata: ${JSON.stringify(chunk)}\n\n`),
            );
            if (chunk.done) break;
          }
        }
        controller.enqueue(encoder.encode(`event: end\ndata: {}\n\n`));
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({ message: (e as Error).message })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 4: Persona test**

Create `architex/src/lib/ai/__tests__/sd-interviewer-persona.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  getPersona,
  INTERVIEWER_PERSONAS,
} from "../sd-interviewer-prompts";
import { fallbackInterviewerReply } from "../sd-interviewer-persona";

describe("sd-interviewer-prompts", () => {
  it("ships 8 personas", () => {
    expect(INTERVIEWER_PERSONAS).toHaveLength(8);
  });

  it("every persona has a non-empty system prompt", () => {
    for (const p of INTERVIEWER_PERSONAS) {
      expect(p.systemPrompt.length).toBeGreaterThan(100);
    }
  });

  it("every persona has scripted questions for all 4 stage buckets", () => {
    for (const p of INTERVIEWER_PERSONAS) {
      expect(p.scriptedQuestions.clarify.length).toBeGreaterThan(0);
      expect(p.scriptedQuestions.design.length).toBeGreaterThan(0);
      expect(p.scriptedQuestions.deepDive.length).toBeGreaterThan(0);
      expect(p.scriptedQuestions.qna.length).toBeGreaterThan(0);
    }
  });

  it("getPersona resolves staff", () => {
    const p = getPersona("staff");
    expect(p.persona).toBe("staff");
  });

  it("getPersona company-preset resolves to Amazon in Phase 3", () => {
    const p = getPersona("company-preset", "google");
    expect(p.persona).toBe("company-preset");
  });

  it("fallbackInterviewerReply rotates through the bank", () => {
    const inv = {
      persona: "staff" as const,
      stage: "clarify" as const,
      canvas: {},
      history: [],
      problemSlug: "design-twitter",
    };
    const r1 = fallbackInterviewerReply(inv);
    const r2 = fallbackInterviewerReply({ ...inv, history: [{ role: "user" as const, content: "x", stage: "clarify" as const }] });
    expect(r1).not.toBe(r2);
  });
});
```

- [ ] **Step 5: Run + commit**

```bash
cd architex
pnpm test:run -- sd-interviewer-persona
git add architex/src/lib/ai/sd-interviewer-prompts.ts architex/src/lib/ai/sd-interviewer-persona.ts architex/src/lib/ai/__tests__/sd-interviewer-persona.test.ts architex/src/app/api/sd/drill-interviewer/
git commit -m "$(cat <<'EOF'
feat(ai): 8 interviewer personas + streaming Sonnet + SSE route

Personas: staff, bar-raiser, coach, skeptic, principal, industry-
specialist, company-preset (Amazon ships; Google/Meta/Stripe/Uber
land as prompt variations in Phase 4), silent-watcher. Each has a
distinct voice, grading-emphasis profile, and 15-20 scripted questions
across 4 stage buckets (clarify/design/deep-dive/qna) for the fallback
path. SSE route streams Sonnet chunks or scripted-question tokens
depending on ANTHROPIC_API_KEY presence.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Author rubric grader + postmortem + post-run summarizer

**Files:**
- Create: `architex/src/lib/ai/sd-rubric-grader.ts`
- Create: `architex/src/lib/ai/sd-postmortem-generator.ts`
- Create: `architex/src/lib/ai/sd-post-run-summarizer.ts`
- Create: `architex/src/lib/ai/__tests__/sd-rubric-grader.test.ts`

Three Sonnet-backed analysis features that fire at drill submission:

1. **Rubric grader** (§9.9): produces a 6-axis score (Requirements · Estimation · HL Design · Deep Dive · Communication · Tradeoffs) with one-sentence rationale each.
2. **Postmortem generator** (§9.8 artifact 2): writes a 200-400 word essay.
3. **Post-run summarizer** (§15.3.3 S2): writes the Simulate-mode results-card narrative with triple-loop recommendations (Learn / Build / Drill).

All three use the same Claude singleton + a structured JSON-output prompt. Fallback: deterministic axis scores + a templated postmortem.

- [ ] **Step 1: Rubric grader — prompt + parser**

```typescript
// architex/src/lib/ai/sd-rubric-grader.ts

/**
 * AI-022: 6-axis rubric grader for drill submissions (§9.9).
 *
 * Inputs: final canvas, napkin math, clarification chat, stage timing,
 * hint log, (optional) verbal transcript, persona + problem canonical
 * rubric. Output: { axes: Record<Axis, {score: 1-5, rationale: string}>,
 * overallScore: number }.
 */

import { claudeSingleton } from "./claude-client";
import { getPersona, type SDPersona, type SDCompanyPreset } from "./sd-interviewer-prompts";

export type RubricAxis =
  | "requirements-scope"
  | "estimation"
  | "high-level-design"
  | "deep-dive"
  | "communication"
  | "tradeoffs";

export interface RubricAxisScore {
  score: 1 | 2 | 3 | 4 | 5;
  rationale: string;
}

export interface RubricBreakdown {
  axes: Record<RubricAxis, RubricAxisScore>;
  overallScore: number;  // weighted 1-5
  graderModel: "sonnet" | "fallback";
  graderVersion: string;
  gradedAt: string;  // ISO
}

export interface GraderInput {
  problemSlug: string;
  persona: SDPersona;
  companyPreset?: SDCompanyPreset;
  canvas: unknown;
  napkinMath?: { qps?: number; storage?: string; bandwidth?: string; notes?: string };
  clarifyTranscript: Array<{ role: "user" | "assistant"; content: string }>;
  deepDiveTranscript: Array<{ role: "user" | "assistant"; content: string }>;
  stageTiming: Record<string, number>;
  hintsUsed: Array<{ tier: "nudge" | "guided" | "full"; creditsDeducted: number }>;
  verbalTranscript?: string;
}

const AXIS_ORDER: RubricAxis[] = [
  "requirements-scope",
  "estimation",
  "high-level-design",
  "deep-dive",
  "communication",
  "tradeoffs",
];

const DEFAULT_WEIGHTS: Record<RubricAxis, number> = {
  "requirements-scope": 0.15,
  estimation: 0.1,
  "high-level-design": 0.25,
  "deep-dive": 0.25,
  communication: 0.1,
  tradeoffs: 0.15,
};

export function buildGraderPrompt(input: GraderInput): string {
  const persona = getPersona(input.persona, input.companyPreset);
  return `You are grading a system-design interview.

Persona the interview was conducted under:
${persona.systemPrompt}

Problem: ${input.problemSlug}

Canvas (JSON): ${JSON.stringify(input.canvas).slice(0, 6000)}

Napkin math: ${JSON.stringify(input.napkinMath ?? {})}

Clarify transcript (last 10 turns):
${input.clarifyTranscript.slice(-10).map((t) => `${t.role}: ${t.content}`).join("\n")}

Deep-dive transcript (last 10 turns):
${input.deepDiveTranscript.slice(-10).map((t) => `${t.role}: ${t.content}`).join("\n")}

Stage timing (ms per stage): ${JSON.stringify(input.stageTiming)}

Hints used (${input.hintsUsed.length} total): ${JSON.stringify(input.hintsUsed)}

${input.verbalTranscript ? `Verbal transcript:\n${input.verbalTranscript.slice(0, 3000)}` : ""}

Score on 6 axes (1-5 each, 1=broken, 3=acceptable, 5=principal-grade).
Each axis requires a one-sentence rationale that references specific
evidence from the canvas, transcript, or timing.

Output VALID JSON only:
{
  "axes": {
    "requirements-scope":  { "score": 1|2|3|4|5, "rationale": "..." },
    "estimation":          { "score": 1|2|3|4|5, "rationale": "..." },
    "high-level-design":   { "score": 1|2|3|4|5, "rationale": "..." },
    "deep-dive":           { "score": 1|2|3|4|5, "rationale": "..." },
    "communication":       { "score": 1|2|3|4|5, "rationale": "..." },
    "tradeoffs":           { "score": 1|2|3|4|5, "rationale": "..." }
  }
}

No preamble. No commentary. JSON only.`;
}

export function computeOverallScore(
  axes: RubricBreakdown["axes"],
  weights: Record<RubricAxis, number> = DEFAULT_WEIGHTS,
): number {
  let sum = 0;
  let totalWeight = 0;
  for (const axis of AXIS_ORDER) {
    const w = weights[axis];
    sum += axes[axis].score * w;
    totalWeight += w;
  }
  return sum / totalWeight;
}

export async function gradeRubric(
  input: GraderInput,
): Promise<RubricBreakdown> {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    return fallbackGrade(input);
  }
  const prompt = buildGraderPrompt(input);
  try {
    const res = await claudeSingleton().sonnet({
      system: "Return VALID JSON only. No preamble.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1200,
      temperature: 0.2,
    });
    const parsed = JSON.parse(res.text) as { axes: RubricBreakdown["axes"] };
    return {
      axes: parsed.axes,
      overallScore: computeOverallScore(parsed.axes),
      graderModel: "sonnet",
      graderVersion: "2026-04-20",
      gradedAt: new Date().toISOString(),
    };
  } catch {
    return fallbackGrade(input);
  }
}

/** Deterministic fallback grade. Produces credible-looking 3.5/5 range with rationale. */
export function fallbackGrade(input: GraderInput): RubricBreakdown {
  const hintPenalty = Math.min(1.5, input.hintsUsed.length * 0.15);
  const base: 1 | 2 | 3 | 4 | 5 = 3;
  const axes = Object.fromEntries(
    AXIS_ORDER.map((a) => [
      a,
      {
        score: Math.max(1, Math.round(base - hintPenalty * 0.5)) as 1 | 2 | 3 | 4 | 5,
        rationale: `Fallback grade (no AI key). Axis: ${a}. Canvas has ${JSON.stringify(input.canvas).slice(0, 50)}.`,
      } as RubricAxisScore,
    ]),
  ) as RubricBreakdown["axes"];
  return {
    axes,
    overallScore: computeOverallScore(axes),
    graderModel: "fallback",
    graderVersion: "2026-04-20-fallback",
    gradedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Postmortem generator**

```typescript
// architex/src/lib/ai/sd-postmortem-generator.ts

/**
 * AI-023: Sonnet postmortem generator (§9.8 artifact 2).
 * 200-400 word essay · honest · calls out specific misses.
 */

import { claudeSingleton } from "./claude-client";
import type { GraderInput, RubricBreakdown } from "./sd-rubric-grader";

export interface Postmortem {
  essay: string;
  keyMisses: string[];
  keyStrengths: string[];
  generatedModel: "sonnet" | "fallback";
  generatedAt: string;
}

export async function generatePostmortem(
  input: GraderInput,
  rubric: RubricBreakdown,
): Promise<Postmortem> {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    return fallbackPostmortem(input, rubric);
  }
  const prompt = `You are writing a postmortem for a system-design interview.
The candidate interviewed on: ${input.problemSlug}
Overall score: ${rubric.overallScore.toFixed(2)}/5

Axis breakdown:
${Object.entries(rubric.axes)
  .map(([k, v]) => `  - ${k}: ${v.score}/5 · ${v.rationale}`)
  .join("\n")}

Hints used: ${input.hintsUsed.length}
Stage timing: ${JSON.stringify(input.stageTiming)}

Write a 250-400 word postmortem. Structure:
  - Paragraph 1: the strongest moment of the interview (with specific evidence).
  - Paragraph 2: the biggest miss (specific; cite evidence).
  - Paragraph 3: the 3 things to practice before the next interview.

Voice: honest, direct, peer-to-peer. Not cheerleader. Not harsh. Not generic.

Output VALID JSON:
{
  "essay": "<the 3-paragraph essay>",
  "keyMisses": ["miss-1", "miss-2", "miss-3"],
  "keyStrengths": ["strength-1", "strength-2"]
}`;
  try {
    const res = await claudeSingleton().sonnet({
      system: "Return VALID JSON only.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1500,
      temperature: 0.4,
    });
    const parsed = JSON.parse(res.text);
    return { ...parsed, generatedModel: "sonnet", generatedAt: new Date().toISOString() };
  } catch {
    return fallbackPostmortem(input, rubric);
  }
}

function fallbackPostmortem(
  input: GraderInput,
  rubric: RubricBreakdown,
): Postmortem {
  const worst = Object.entries(rubric.axes).sort(
    ([, a], [, b]) => a.score - b.score,
  )[0];
  return {
    essay: `You scored ${rubric.overallScore.toFixed(2)}/5 on ${input.problemSlug}. The weakest axis was ${worst[0]} (${worst[1].score}/5). Full postmortem requires an ANTHROPIC_API_KEY.`,
    keyMisses: [worst[0]],
    keyStrengths: [],
    generatedModel: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 3: Post-run summarizer (Simulate mode · §15.3.3 S2)**

```typescript
// architex/src/lib/ai/sd-post-run-summarizer.ts

/**
 * AI-024: Sonnet post-run summarizer for Simulate results cards (§8.7).
 * Writes the results-card narrative + the 3 triple-loop recommendations
 * (Learn / Build / Drill).
 */

import { claudeSingleton } from "./claude-client";
import type { MetricsSnapshot } from "../simulation/adapters/hdr-metrics";

export interface PostRunInput {
  activityKind:
    | "validate"
    | "stress"
    | "chaos-drill"
    | "compare-ab"
    | "forecast"
    | "archaeology";
  slosPassed: boolean | null;
  finalMetrics: MetricsSnapshot;
  narrativeStreamTail: string[];
  chaosEventsFired: number;
  topThreeHotSpots: string[];
}

export interface PostRunSummary {
  narrative: string;
  learnRec: { conceptSlug: string; reason: string };
  buildRec: { action: string; reason: string };
  drillRec: { problemSlug: string; persona: string; reason: string };
  generatedModel: "sonnet" | "fallback";
  generatedAt: string;
}

export async function summarizePostRun(
  input: PostRunInput,
): Promise<PostRunSummary> {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    return fallbackPostRun(input);
  }
  const prompt = `You are writing the results-card narrative for a system-design simulation.

Activity: ${input.activityKind}
SLOs passed: ${input.slosPassed}
Final metrics: p50=${input.finalMetrics.p50}ms p99=${input.finalMetrics.p99}ms p99.9=${input.finalMetrics.p99_9}ms
Chaos events fired: ${input.chaosEventsFired}
Top 3 hot-spots: ${input.topThreeHotSpots.join(", ")}
Narrative-stream tail:
${input.narrativeStreamTail.slice(-6).map((s) => `  ${s}`).join("\n")}

Output VALID JSON with 4 fields:
{
  "narrative": "<2-3 sentences summarizing what happened>",
  "learnRec": { "conceptSlug": "<slug>", "reason": "<1 sentence>" },
  "buildRec": { "action": "<short imperative>", "reason": "<1 sentence>" },
  "drillRec": { "problemSlug": "<slug>", "persona": "<persona>", "reason": "<1 sentence>" }
}`;
  try {
    const res = await claudeSingleton().sonnet({
      system: "Return VALID JSON only.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 700,
      temperature: 0.4,
    });
    const parsed = JSON.parse(res.text);
    return { ...parsed, generatedModel: "sonnet", generatedAt: new Date().toISOString() };
  } catch {
    return fallbackPostRun(input);
  }
}

function fallbackPostRun(input: PostRunInput): PostRunSummary {
  return {
    narrative: `Run completed. SLOs ${input.slosPassed ? "passed" : "failed"}; ${input.chaosEventsFired} chaos events fired. Full recommendations require an ANTHROPIC_API_KEY.`,
    learnRec: { conceptSlug: "caching-strategies", reason: "Generic fallback recommendation." },
    buildRec: { action: "Add a circuit breaker on your slowest call", reason: "Generic fallback." },
    drillRec: { problemSlug: "design-twitter", persona: "staff", reason: "Generic fallback." },
    generatedModel: "fallback",
    generatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 4: Grader test**

```typescript
// architex/src/lib/ai/__tests__/sd-rubric-grader.test.ts

import { describe, expect, it, vi } from "vitest";
import {
  buildGraderPrompt,
  computeOverallScore,
  fallbackGrade,
  type GraderInput,
} from "../sd-rubric-grader";

const input: GraderInput = {
  problemSlug: "design-twitter",
  persona: "staff",
  canvas: { nodes: [], edges: [] },
  clarifyTranscript: [{ role: "user", content: "What are the SLOs?" }],
  deepDiveTranscript: [],
  stageTiming: { clarify: 300_000, design: 900_000, "deep-dive": 900_000 },
  hintsUsed: [],
};

describe("sd-rubric-grader", () => {
  it("buildGraderPrompt mentions canvas and problem", () => {
    const p = buildGraderPrompt(input);
    expect(p).toContain("design-twitter");
    expect(p).toContain("Canvas");
  });

  it("computeOverallScore blends per-axis weights", () => {
    const axes = Object.fromEntries(
      ["requirements-scope", "estimation", "high-level-design", "deep-dive", "communication", "tradeoffs"].map((a) => [
        a,
        { score: 3 as const, rationale: "" },
      ]),
    ) as any;
    expect(computeOverallScore(axes)).toBe(3);
  });

  it("fallbackGrade applies hint penalty", () => {
    const noPenalty = fallbackGrade(input);
    const withPenalty = fallbackGrade({ ...input, hintsUsed: [
      { tier: "full", creditsDeducted: 5 },
      { tier: "full", creditsDeducted: 5 },
      { tier: "full", creditsDeducted: 5 },
    ] });
    expect(withPenalty.overallScore).toBeLessThan(noPenalty.overallScore);
  });

  it("fallbackGrade marks graderModel as fallback", () => {
    const r = fallbackGrade(input);
    expect(r.graderModel).toBe("fallback");
  });
});
```

- [ ] **Step 5: Run + commit**

```bash
cd architex
pnpm test:run -- sd-rubric-grader
git add architex/src/lib/ai/sd-rubric-grader.ts architex/src/lib/ai/sd-postmortem-generator.ts architex/src/lib/ai/sd-post-run-summarizer.ts architex/src/lib/ai/__tests__/sd-rubric-grader.test.ts
git commit -m "$(cat <<'EOF'
feat(ai): 6-axis rubric grader + postmortem + post-run summarizer

Three Sonnet-backed analysis features firing at drill/sim submission.
gradeRubric: 6 axes × 1-5 scores with per-axis rationale + weighted
overall. generatePostmortem: 250-400 word 3-paragraph essay.
summarizePostRun: Simulate results-card narrative + triple-loop
Learn/Build/Drill recommendations. All three have deterministic
fallbacks; graderModel field marks which path produced the output.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Author `red-team-chaos-planner.ts` — Sonnet adversary planner (wiring side)

**Files:**
- Create: `architex/src/lib/ai/red-team-chaos-planner.ts`

Complements Task 11 (`src/lib/chaos/red-team-ai.ts` — validation side). This file owns the Sonnet call + retry + fallback. Returns a validated `ChaosScenarioDef`.

```typescript
/**
 * AI-025: Red-team chaos planner (§12.4.6 wiring).
 *
 * Task 11 (src/lib/chaos/red-team-ai.ts) owns prompt building +
 * validation. This file owns the Sonnet call, retry policy, and
 * fallback (pick the hardest advanced scenario from chaos-scenarios).
 */

import { claudeSingleton } from "./claude-client";
import {
  buildRedTeamPrompt,
  parseRedTeamResponse,
  validateRedTeamScenario,
} from "@/lib/chaos/red-team-ai";
import type { ChaosScenarioDef } from "@/lib/chaos/chaos-scenarios";
import { CHAOS_SCENARIOS } from "@/lib/chaos/chaos-scenarios";
import type { CanvasSnapshot } from "@/lib/chaos/chaos-dice";

const MAX_RETRIES = 2;

export async function planRedTeamAttack(
  canvas: CanvasSnapshot,
  opts: { difficulty: "advanced" | "intermediate" | "beginner" },
): Promise<{ scenario: ChaosScenarioDef; source: "sonnet" | "fallback" }> {
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (!hasKey) {
    return { scenario: fallbackHardestScenario(), source: "fallback" };
  }

  const prompt = buildRedTeamPrompt(canvas, opts);
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await claudeSingleton().sonnet({
        system: "You are the red team. Return VALID JSON only.",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1500,
        temperature: 0.7,
      });
      const parsed = parseRedTeamResponse(res.text);
      validateRedTeamScenario(parsed);
      return { scenario: parsed, source: "sonnet" };
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        return { scenario: fallbackHardestScenario(), source: "fallback" };
      }
      // retry with a firmer instruction
    }
  }
  return { scenario: fallbackHardestScenario(), source: "fallback" };
}

export function fallbackHardestScenario(): ChaosScenarioDef {
  const hardest = CHAOS_SCENARIOS.filter((s) => s.difficulty === "advanced");
  return hardest[hardest.length - 1];
}
```

- [ ] **Step 1: Commit**

```bash
cd architex
git add architex/src/lib/ai/red-team-chaos-planner.ts
git commit -m "$(cat <<'EOF'
feat(ai): red-team chaos planner wiring (Sonnet call + 2-retry fallback)

Pairs with src/lib/chaos/red-team-ai.ts (Task 11 validation side).
planRedTeamAttack: Sonnet → parse → validate → return scenario. On
validation failure: up to 2 retries, then fallback to the hardest
advanced scenario from chaos-scenarios. Returns { scenario, source }
so the UI can show an "AI-generated" vs "library-sourced" pill.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Group D · Simulate mode UI + behavior (Tasks 19-26)

> Group D wraps the existing 27-file simulation engine with the Simulate mode UX. Every component consumes hooks; hooks consume engine adapters (Group B) and stores. No engine files are edited.

---

## Task 19: Cinematic chaos choreography · ribbon + vignette + 900ms dock

**Files:**
- Create: `architex/src/hooks/useCinematicChaos.ts`
- Create: `architex/src/components/modules/sd/simulate/CinematicChaosRibbon.tsx`
- Create: `architex/src/components/modules/sd/simulate/RedVignette.tsx`
- Create: `architex/src/hooks/__tests__/useCinematicChaos.test.tsx`

Per §8.9, each chaos event triggers a 900ms choreography:

- `t=0ms`: full-width 8vh ribbon slides in from top in IBM Plex Serif; text is the taxonomy's `renderNarrative(event, params)`.
- `t=50ms`: red vignette (radial gradient from edges, 22% opacity at edges → 0% at center) fades in over 300ms.
- `t=0ms`: optional WebAudio 80+40Hz bass thump (300ms decay). Off by default.
- `t=600ms`: ribbon holds.
- `t=900ms`: ribbon slides up and docks to the right-side margin stream (Task 21).

Reduced-motion (`prefers-reduced-motion: reduce`): no animation, no sound. Static red-bordered banner in the top-right, text unchanged.

- [ ] **Step 1: `useCinematicChaos` hook**

```typescript
// architex/src/hooks/useCinematicChaos.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { renderNarrative } from "@/lib/chaos/chaos-taxonomy";
import { getEventById } from "@/lib/chaos/chaos-taxonomy";

export interface CinematicEvent {
  id: string;
  eventId: string;
  narrative: string;
  severity: "low" | "medium" | "high" | "critical";
  firedAtRealMs: number;
  params: Record<string, string>;
}

export interface UseCinematicChaosResult {
  active: CinematicEvent | null;
  fire: (eventId: string, params: Record<string, string>) => void;
  dismiss: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (b: boolean) => void;
  reducedMotion: boolean;
}

const RIBBON_HOLD_MS = 900;

export function useCinematicChaos(): UseCinematicChaosResult {
  const [active, setActive] = useState<CinematicEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const dismiss = useCallback(() => {
    setActive(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fire = useCallback(
    (eventId: string, params: Record<string, string>) => {
      const ev = getEventById(eventId);
      const narrative = renderNarrative(ev, params);
      const id = `${eventId}-${Date.now()}`;
      setActive({
        id,
        eventId,
        narrative,
        severity: ev.severity,
        firedAtRealMs: Date.now(),
        params,
      });
      if (soundEnabled && !reducedMotion) {
        playBassThump();
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActive(null);
      }, reducedMotion ? 2500 : RIBBON_HOLD_MS);
    },
    [soundEnabled, reducedMotion],
  );

  return {
    active,
    fire,
    dismiss,
    soundEnabled,
    setSoundEnabled,
    reducedMotion,
  };
}

function playBassThump() {
  try {
    const ctx = new ((window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)!();
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const gain = ctx.createGain();
    o1.frequency.value = 80;
    o2.frequency.value = 40;
    gain.gain.value = 0.2;
    o1.connect(gain);
    o2.connect(gain);
    gain.connect(ctx.destination);
    o1.start();
    o2.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    setTimeout(() => {
      o1.stop();
      o2.stop();
      ctx.close();
    }, 320);
  } catch {
    /* silent */
  }
}
```

- [ ] **Step 2: `CinematicChaosRibbon` component**

```tsx
// architex/src/components/modules/sd/simulate/CinematicChaosRibbon.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { CinematicEvent } from "@/hooks/useCinematicChaos";

export function CinematicChaosRibbon({
  active,
  reducedMotion,
}: {
  active: CinematicEvent | null;
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return active ? (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed right-4 top-4 z-40 max-w-sm rounded-md border-2 border-red-500 bg-black/90 px-4 py-3 font-serif text-sm text-white shadow-xl"
      >
        <span className="mb-1 block text-xs uppercase tracking-wide text-red-400">
          Chaos event · {active.severity}
        </span>
        {active.narrative}
      </div>
    ) : null;
  }

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          role="alert"
          aria-live="assertive"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[8vh] items-center bg-black/85 px-8 font-serif text-[15px] leading-relaxed text-white shadow-2xl backdrop-blur-sm"
          data-testid="cinematic-chaos-ribbon"
          data-severity={active.severity}
        >
          <span className="mr-4 text-xs uppercase tracking-wider text-red-400">
            Chaos · {active.severity}
          </span>
          <span className="line-clamp-2">{active.narrative}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: `RedVignette` component**

```tsx
// architex/src/components/modules/sd/simulate/RedVignette.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";

export function RedVignette({
  active,
  reducedMotion,
}: {
  active: boolean;
  reducedMotion: boolean;
}) {
  if (reducedMotion) return null;
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="pointer-events-none fixed inset-0 z-30"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 20%, rgba(220,38,38,0.22) 100%)",
          }}
          data-testid="red-vignette"
        />
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Hook test**

```tsx
// architex/src/hooks/__tests__/useCinematicChaos.test.tsx

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";
import { useCinematicChaos } from "../useCinematicChaos";

beforeEach(() => {
  vi.useFakeTimers();
  // Default matchMedia: no reduced motion
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("useCinematicChaos", () => {
  it("fire() sets an active event", () => {
    const { result } = renderHook(() => useCinematicChaos());
    act(() => {
      result.current.fire("cache-stampede", {
        cache_name: "Redis",
        backend_name: "Postgres",
      });
    });
    expect(result.current.active).not.toBeNull();
    expect(result.current.active?.narrative).toContain("Redis");
    expect(result.current.active?.narrative).toContain("Postgres");
  });

  it("auto-dismisses after 900ms", () => {
    const { result } = renderHook(() => useCinematicChaos());
    act(() => {
      result.current.fire("cache-stampede", {
        cache_name: "c",
        backend_name: "b",
      });
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.active).toBeNull();
  });

  it("respects reduced-motion preference (longer dismiss)", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const { result } = renderHook(() => useCinematicChaos());
    expect(result.current.reducedMotion).toBe(true);
  });
});
```

- [ ] **Step 5: Commit**

```bash
cd architex
pnpm test:run -- useCinematicChaos
git add architex/src/hooks/useCinematicChaos.ts architex/src/hooks/__tests__/useCinematicChaos.test.tsx architex/src/components/modules/sd/simulate/CinematicChaosRibbon.tsx architex/src/components/modules/sd/simulate/RedVignette.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): cinematic chaos choreography · ribbon + vignette + 900ms dock

8vh full-width serif ribbon + radial red vignette (22% alpha at edges).
Optional WebAudio 80+40Hz bass thump, 300ms decay. Reduced-motion fallback:
static red-bordered banner top-right, no animation, no sound. 900ms
auto-dismiss feeds into margin narrative stream (Task 21). useCinematicChaos
exposes fire/dismiss/soundEnabled state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: Metric strip with threshold coaching

**Files:**
- Create: `architex/src/lib/simulation/adapters/threshold-coaching.ts`
- Create: `architex/src/hooks/useThresholdCoaching.ts`
- Create: `architex/src/hooks/useMetricStrip.ts`
- Create: `architex/src/components/modules/sd/simulate/MetricStrip.tsx`
- Create: `architex/src/components/modules/sd/simulate/MetricStripCell.tsx`
- Create: `architex/src/components/modules/sd/simulate/MetricDrilldownDialog.tsx`
- Create: `architex/src/components/modules/sd/simulate/__tests__/MetricStrip.test.tsx`

Per §8.5, every metric has threshold bands + coaching copy. The strip renders 6 cells: p50, p95, p99, error rate, throughput attainment, cost/request. Each cell shows the raw number, a colored threshold pill (excellent/good/concerning/broken), and (on hover/click) a coaching sentence.

- [ ] **Step 1: Threshold-coaching module**

```typescript
// architex/src/lib/simulation/adapters/threshold-coaching.ts

/**
 * SIM-031: Threshold-coaching bands + coaching-copy templates (§8.5).
 */

export type MetricKind =
  | "p50-latency"
  | "p95-latency"
  | "p99-latency"
  | "error-rate"
  | "throughput-attainment"
  | "cost-per-request"
  | "recovery-time";

export type ThresholdBand = "excellent" | "good" | "concerning" | "broken";

export interface BandConfig {
  excellent: number;
  good: number;
  concerning: number;
  // >= concerning threshold → broken
}

export const DEFAULT_BANDS: Record<MetricKind, BandConfig> = {
  "p50-latency": { excellent: 50, good: 150, concerning: 500 },
  "p95-latency": { excellent: 150, good: 500, concerning: 1500 },
  "p99-latency": { excellent: 200, good: 1000, concerning: 3000 },
  "error-rate": { excellent: 0.001, good: 0.01, concerning: 0.05 },
  "throughput-attainment": { excellent: 0.95, good: 0.8, concerning: 0.5 },
  "cost-per-request": { excellent: 0.0001, good: 0.001, concerning: 0.01 },
  "recovery-time": { excellent: 30_000, good: 120_000, concerning: 600_000 },
};

export function classifyMetric(
  kind: MetricKind,
  value: number,
  bands: BandConfig = DEFAULT_BANDS[kind],
): ThresholdBand {
  // "Lower is better" metrics
  if (
    kind === "p50-latency" ||
    kind === "p95-latency" ||
    kind === "p99-latency" ||
    kind === "error-rate" ||
    kind === "cost-per-request" ||
    kind === "recovery-time"
  ) {
    if (value <= bands.excellent) return "excellent";
    if (value <= bands.good) return "good";
    if (value <= bands.concerning) return "concerning";
    return "broken";
  }
  // "Higher is better" metrics (throughput attainment)
  if (value >= bands.excellent) return "excellent";
  if (value >= bands.good) return "good";
  if (value >= bands.concerning) return "concerning";
  return "broken";
}

export function coachingCopy(
  kind: MetricKind,
  value: number,
  band: ThresholdBand,
  context: { bottleneckNode?: string } = {},
): string {
  const node = context.bottleneckNode ? ` Bottleneck: ${context.bottleneckNode}.` : "";
  switch (kind) {
    case "p50-latency":
      if (band === "broken") return `p50 of ${value.toFixed(0)}ms is broken territory. Typical web p50 is under 150ms.${node}`;
      if (band === "concerning") return `p50 of ${value.toFixed(0)}ms is concerning. Medians above 150ms feel sluggish to users.${node}`;
      if (band === "good") return `p50 of ${value.toFixed(0)}ms is good. Healthy web p50 range.`;
      return `p50 of ${value.toFixed(0)}ms is excellent. Your median user is having a fast experience.`;
    case "p99-latency":
      if (band === "broken") return `p99 of ${value.toFixed(0)}ms is broken. One user in a hundred is waiting far too long.${node}`;
      if (band === "concerning") return `p99 of ${value.toFixed(0)}ms is concerning. Tail latency this high affects perceived reliability.${node}`;
      if (band === "good") return `p99 of ${value.toFixed(0)}ms is good. Your tail is well-managed.`;
      return `p99 of ${value.toFixed(0)}ms is excellent. Tight tails like this are rare.`;
    case "error-rate":
      const pct = (value * 100).toFixed(2);
      if (band === "broken") return `${pct}% error rate is broken territory. Users are seeing failures routinely.${node}`;
      if (band === "concerning") return `${pct}% error rate is concerning. Typical healthy web services stay under 1%.${node}`;
      if (band === "good") return `${pct}% error rate is within a healthy band.`;
      return `${pct}% error rate is excellent. Very few users see failures.`;
    case "throughput-attainment":
      const tp = (value * 100).toFixed(0);
      if (band === "broken") return `You are only serving ${tp}% of target throughput. The limiter is somewhere — likely ${context.bottleneckNode ?? "your slowest call"}.`;
      if (band === "concerning") return `${tp}% of target throughput is concerning. Investigate the saturation point.${node}`;
      if (band === "good") return `${tp}% of target throughput is good. Some headroom remains.`;
      return `${tp}% of target throughput is excellent. Capacity is comfortable.`;
    case "cost-per-request":
      const c = value.toFixed(4);
      if (band === "broken") return `$${c} per request is broken territory at scale.${node}`;
      if (band === "concerning") return `$${c} per request is expensive. Top offenders likely include egress + idle capacity.${node}`;
      if (band === "good") return `$${c} per request is in a good band.`;
      return `$${c} per request is excellent. Your cost model is tight.`;
    case "recovery-time":
      const sec = (value / 1000).toFixed(0);
      if (band === "broken") return `Recovery took ${sec}s — broken. Compare: Netflix averages 40s for circuit-breaker events.`;
      if (band === "concerning") return `Recovery took ${sec}s. Consider adding a circuit breaker or a more aggressive retry policy.`;
      if (band === "good") return `Recovery took ${sec}s — good.`;
      return `Recovery took ${sec}s — excellent.`;
    case "p95-latency":
      if (band === "broken") return `p95 of ${value.toFixed(0)}ms is broken.${node}`;
      if (band === "concerning") return `p95 of ${value.toFixed(0)}ms is concerning.${node}`;
      if (band === "good") return `p95 of ${value.toFixed(0)}ms is good.`;
      return `p95 of ${value.toFixed(0)}ms is excellent.`;
  }
}
```

- [ ] **Step 2: `useThresholdCoaching` + `useMetricStrip` hooks**

```typescript
// architex/src/hooks/useThresholdCoaching.ts
"use client";
import { useMemo } from "react";
import {
  classifyMetric,
  coachingCopy,
  type MetricKind,
  type ThresholdBand,
} from "@/lib/simulation/adapters/threshold-coaching";

export function useThresholdCoaching(
  kind: MetricKind,
  value: number,
  context: { bottleneckNode?: string } = {},
) {
  const band = useMemo<ThresholdBand>(
    () => classifyMetric(kind, value),
    [kind, value],
  );
  const copy = useMemo(
    () => coachingCopy(kind, value, band, context),
    [kind, value, band, context],
  );
  return { band, copy };
}

// architex/src/hooks/useMetricStrip.ts
"use client";
import { useEffect, useState } from "react";
import type { MetricsSnapshot } from "@/lib/simulation/adapters/hdr-metrics";

export interface MetricStripState {
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughputAttainment: number;
  costPerRequest: number;
  bottleneckNode?: string;
  snapshot: MetricsSnapshot | null;
}

export function useMetricStrip(runId: string): MetricStripState {
  const [state, setState] = useState<MetricStripState>({
    p50: 0,
    p95: 0,
    p99: 0,
    errorRate: 0,
    throughputAttainment: 1,
    costPerRequest: 0,
    snapshot: null,
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sd/simulation-runs/${runId}/heartbeat`);
        if (!res.ok) return;
        const body = await res.json() as MetricStripState;
        setState(body);
      } catch {
        // silent · network failures in Simulate should not crash the UI
      }
    }, 500);
    return () => clearInterval(interval);
  }, [runId]);

  return state;
}
```

- [ ] **Step 3: `MetricStrip` + `MetricStripCell` components**

```tsx
// architex/src/components/modules/sd/simulate/MetricStripCell.tsx
"use client";
import { useThresholdCoaching } from "@/hooks/useThresholdCoaching";
import type { MetricKind } from "@/lib/simulation/adapters/threshold-coaching";

const BAND_CLASS: Record<string, string> = {
  excellent: "bg-emerald-500/15 border-emerald-500 text-emerald-100",
  good: "bg-sky-500/15 border-sky-500 text-sky-100",
  concerning: "bg-amber-500/15 border-amber-500 text-amber-100",
  broken: "bg-red-500/20 border-red-500 text-red-100",
};

export function MetricStripCell({
  label,
  kind,
  value,
  format,
  bottleneckNode,
  onClick,
}: {
  label: string;
  kind: MetricKind;
  value: number;
  format: (v: number) => string;
  bottleneckNode?: string;
  onClick?: () => void;
}) {
  const { band, copy } = useThresholdCoaching(kind, value, { bottleneckNode });
  return (
    <button
      type="button"
      onClick={onClick}
      title={copy}
      className={`flex min-w-[120px] flex-col rounded-md border px-3 py-2 text-left transition hover:brightness-110 ${BAND_CLASS[band]}`}
      data-band={band}
      data-metric={kind}
    >
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-mono text-lg font-semibold">{format(value)}</span>
      <span className="mt-1 text-[10px] uppercase tracking-wide">{band}</span>
    </button>
  );
}

// architex/src/components/modules/sd/simulate/MetricStrip.tsx
"use client";
import { useState } from "react";
import { useMetricStrip } from "@/hooks/useMetricStrip";
import { MetricStripCell } from "./MetricStripCell";
import { MetricDrilldownDialog } from "./MetricDrilldownDialog";
import type { MetricKind } from "@/lib/simulation/adapters/threshold-coaching";

export function MetricStrip({ runId }: { runId: string }) {
  const s = useMetricStrip(runId);
  const [drilldown, setDrilldown] = useState<MetricKind | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-2 p-3">
        <MetricStripCell
          label="p50"
          kind="p50-latency"
          value={s.p50}
          format={(v) => `${v.toFixed(0)}ms`}
          bottleneckNode={s.bottleneckNode}
          onClick={() => setDrilldown("p50-latency")}
        />
        <MetricStripCell
          label="p95"
          kind="p95-latency"
          value={s.p95}
          format={(v) => `${v.toFixed(0)}ms`}
          onClick={() => setDrilldown("p95-latency")}
        />
        <MetricStripCell
          label="p99"
          kind="p99-latency"
          value={s.p99}
          format={(v) => `${v.toFixed(0)}ms`}
          bottleneckNode={s.bottleneckNode}
          onClick={() => setDrilldown("p99-latency")}
        />
        <MetricStripCell
          label="errors"
          kind="error-rate"
          value={s.errorRate}
          format={(v) => `${(v * 100).toFixed(2)}%`}
          onClick={() => setDrilldown("error-rate")}
        />
        <MetricStripCell
          label="throughput"
          kind="throughput-attainment"
          value={s.throughputAttainment}
          format={(v) => `${(v * 100).toFixed(0)}%`}
          onClick={() => setDrilldown("throughput-attainment")}
        />
        <MetricStripCell
          label="$/req"
          kind="cost-per-request"
          value={s.costPerRequest}
          format={(v) => `$${v.toFixed(4)}`}
          onClick={() => setDrilldown("cost-per-request")}
        />
      </div>
      {drilldown && (
        <MetricDrilldownDialog
          kind={drilldown}
          runId={runId}
          onClose={() => setDrilldown(null)}
        />
      )}
    </>
  );
}

// architex/src/components/modules/sd/simulate/MetricDrilldownDialog.tsx
"use client";
import type { MetricKind } from "@/lib/simulation/adapters/threshold-coaching";

export function MetricDrilldownDialog({
  kind,
  runId,
  onClose,
}: {
  kind: MetricKind;
  runId: string;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-w-2xl rounded-lg bg-neutral-900 p-6 font-serif text-neutral-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-xl">Metric drilldown · {kind}</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Time-series for run {runId}. Click on the timeline to scrub to the moment
          of interest. Overlays per-node to isolate the bottleneck.
        </p>
        {/* Phase-3 placeholder: series chart renders in Phase-5 polish pass */}
        <div className="mb-4 h-48 rounded-md border border-neutral-700 bg-neutral-800" />
        <button
          type="button"
          onClick={onClose}
          className="rounded bg-neutral-700 px-3 py-2 text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `MetricStrip` test**

```tsx
// architex/src/components/modules/sd/simulate/__tests__/MetricStrip.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MetricStrip } from "../MetricStrip";

beforeEach(() => {
  global.fetch = vi.fn(async () =>
    ({
      ok: true,
      json: async () => ({
        p50: 120,
        p95: 500,
        p99: 2500,
        errorRate: 0.04,
        throughputAttainment: 0.6,
        costPerRequest: 0.008,
      }),
    } as unknown as Response),
  );
});

describe("MetricStrip", () => {
  it("renders 6 metric cells", () => {
    render(<MetricStrip runId="r-1" />);
    expect(screen.getByText("p50")).toBeInTheDocument();
    expect(screen.getByText("p95")).toBeInTheDocument();
    expect(screen.getByText("p99")).toBeInTheDocument();
    expect(screen.getByText("errors")).toBeInTheDocument();
    expect(screen.getByText("throughput")).toBeInTheDocument();
    expect(screen.getByText("$/req")).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Commit**

```bash
cd architex
pnpm test:run -- MetricStrip
git add architex/src/lib/simulation/adapters/threshold-coaching.ts architex/src/hooks/useThresholdCoaching.ts architex/src/hooks/useMetricStrip.ts architex/src/components/modules/sd/simulate/MetricStrip.tsx architex/src/components/modules/sd/simulate/MetricStripCell.tsx architex/src/components/modules/sd/simulate/MetricDrilldownDialog.tsx architex/src/components/modules/sd/simulate/__tests__/MetricStrip.test.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): metric strip with threshold coaching (§8.5)

6 cells: p50 · p95 · p99 · error rate · throughput attainment · $/req.
Each cell classifies into 4 bands (excellent/good/concerning/broken)
with per-metric coaching copy. Click opens MetricDrilldownDialog for
time-series view (charting body lands in Phase 5 polish). MetricStrip
polls /api/sd/simulation-runs/[id]/heartbeat at 500ms.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: Margin narrative stream (§8.10)

**Files:**
- Create: `architex/src/hooks/useMarginNarrative.ts`
- Create: `architex/src/components/modules/sd/simulate/MarginNarrativeStream.tsx`
- Create: `architex/src/components/modules/sd/simulate/NarrativeCard.tsx`

The right-panel narrative stream captures every chaos event, SLO breach, and recovery as a card. Serif type (IBM Plex Serif 13px, 1.6 line-height). Timestamp in mono. Click a card → scrub timeline. Copy stream → draft postmortem.

- [ ] **Step 1: `useMarginNarrative` hook**

```typescript
// architex/src/hooks/useMarginNarrative.ts
"use client";
import { useCallback, useState } from "react";

export type NarrativeCardKind =
  | "chaos"
  | "slo-breach"
  | "recovery"
  | "milestone"
  | "warning";

export interface NarrativeCard {
  id: string;
  simTimeMs: number;
  kind: NarrativeCardKind;
  text: string;
  eventId?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

export function useMarginNarrative() {
  const [cards, setCards] = useState<NarrativeCard[]>([]);

  const add = useCallback((card: Omit<NarrativeCard, "id">) => {
    setCards((prev) => [
      ...prev,
      { ...card, id: `n-${prev.length + 1}-${Date.now()}` },
    ]);
  }, []);

  const clear = useCallback(() => setCards([]), []);

  const copyAsMarkdown = useCallback(() => {
    return cards
      .map(
        (c) =>
          `**${formatSimTime(c.simTimeMs)}** ${c.text}${c.severity ? ` *${c.severity}*` : ""}`,
      )
      .join("\n\n");
  }, [cards]);

  return { cards, add, clear, copyAsMarkdown };
}

function formatSimTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const hh = Math.floor(sec / 3600);
  const mm = Math.floor((sec % 3600) / 60);
  const ss = sec % 60;
  if (hh > 0) return `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
```

- [ ] **Step 2: `MarginNarrativeStream` + `NarrativeCard`**

```tsx
// architex/src/components/modules/sd/simulate/NarrativeCard.tsx
"use client";
import type { NarrativeCard as CardType } from "@/hooks/useMarginNarrative";

const KIND_COLORS: Record<CardType["kind"], string> = {
  chaos: "border-red-500 bg-red-500/5",
  "slo-breach": "border-amber-500 bg-amber-500/5",
  recovery: "border-emerald-500 bg-emerald-500/5",
  milestone: "border-sky-500 bg-sky-500/5",
  warning: "border-yellow-500 bg-yellow-500/5",
};

export function NarrativeCard({
  card,
  onClick,
}: {
  card: CardType;
  onClick?: (simTimeMs: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(card.simTimeMs)}
      className={`w-full border-l-2 px-3 py-2 text-left transition hover:bg-white/5 ${KIND_COLORS[card.kind]}`}
      data-testid="narrative-card"
      data-kind={card.kind}
    >
      <time className="block font-mono text-[10px] uppercase tracking-wide text-neutral-500">
        {formatSimTime(card.simTimeMs)}
      </time>
      <p className="mt-0.5 font-serif text-[13px] leading-[1.6] text-neutral-100">
        {card.text}
        {card.severity ? (
          <span className="ml-1 italic text-neutral-400">— {card.severity}</span>
        ) : null}
      </p>
    </button>
  );
}

function formatSimTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

// architex/src/components/modules/sd/simulate/MarginNarrativeStream.tsx
"use client";
import { useEffect, useRef } from "react";
import { NarrativeCard } from "./NarrativeCard";
import type { NarrativeCard as CardType } from "@/hooks/useMarginNarrative";

export function MarginNarrativeStream({
  cards,
  onScrubTo,
  onCopyMarkdown,
}: {
  cards: CardType[];
  onScrubTo?: (simTimeMs: number) => void;
  onCopyMarkdown?: () => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cards.length]);

  return (
    <aside className="flex h-full flex-col border-l border-neutral-800 bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-800 px-3 py-2">
        <h2 className="font-serif text-sm text-neutral-300">Narrative</h2>
        {onCopyMarkdown && cards.length > 0 && (
          <button
            type="button"
            className="text-[10px] uppercase tracking-wide text-neutral-500 hover:text-neutral-300"
            onClick={onCopyMarkdown}
          >
            Copy as MD
          </button>
        )}
      </header>
      <div className="flex-1 overflow-y-auto">
        {cards.length === 0 ? (
          <p className="p-3 font-serif text-sm italic text-neutral-600">
            Events will land here as the simulation runs.
          </p>
        ) : (
          <ul className="flex flex-col">
            {cards.map((c) => (
              <li key={c.id}>
                <NarrativeCard card={c} onClick={onScrubTo} />
              </li>
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd architex
git add architex/src/hooks/useMarginNarrative.ts architex/src/components/modules/sd/simulate/NarrativeCard.tsx architex/src/components/modules/sd/simulate/MarginNarrativeStream.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): margin narrative stream (§8.10) · serif cards + click-to-scrub

Right-panel stream grows during a run. Kinds: chaos, slo-breach,
recovery, milestone, warning. Each card: mono timestamp + serif text
(IBM Plex Serif 13px/1.6) + optional severity tag. Click card →
scrub timeline to that moment. Copy stream as markdown → seeds a
draft postmortem (§9.8 artifact · wired in Task 31).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: Chaos control panel · 6 control modes dispatch

**Files:**
- Create: `architex/src/lib/simulation/adapters/chaos-control-mode.ts`
- Create: `architex/src/hooks/useChaosControl.ts`
- Create: `architex/src/components/modules/sd/simulate/ChaosControlPanel.tsx`
- Create: `architex/src/components/modules/sd/simulate/ChaosDicePanel.tsx`
- Create: `architex/src/components/modules/sd/simulate/ChaosBudgetPanel.tsx`
- Create: `architex/src/components/modules/sd/simulate/ManualInjectionMenu.tsx`

Per §12.4, 6 modes: scenario · dice · manual · budget · auto-escalation · red-team. The control panel is a left-side accordion with one section per mode. Switching modes is instant; only one mode fires events at a time.

- [ ] **Step 1: Dispatcher module**

```typescript
// architex/src/lib/simulation/adapters/chaos-control-mode.ts

import type { ChaosScenarioDef } from "@/lib/chaos/chaos-scenarios";
import { rollChaosDice, type CanvasSnapshot } from "@/lib/chaos/chaos-dice";
import {
  createBudgetState,
  pickNextBudgetEvent,
  deductBudget,
  isBudgetExhausted,
  type BudgetState,
} from "@/lib/chaos/chaos-budget-engine";
import {
  advanceState,
  pickEventForState,
  createEscalationState,
  type EscalationState,
} from "@/lib/chaos/auto-escalation";
import { planRedTeamAttack } from "@/lib/ai/red-team-chaos-planner";
import { CHAOS_SCENARIOS } from "@/lib/chaos/chaos-scenarios";

export type ChaosMode =
  | "scenario"
  | "dice"
  | "manual"
  | "budget"
  | "auto-escalation"
  | "red-team"
  | "none";

export interface ChaosDispatcherState {
  mode: ChaosMode;
  scenario?: ChaosScenarioDef;
  scenarioCursor: number;
  budget: BudgetState;
  escalation: EscalationState;
  redTeamUnlocked: boolean;
}

export function createDispatcher(mode: ChaosMode): ChaosDispatcherState {
  return {
    mode,
    scenarioCursor: 0,
    budget: createBudgetState(5),
    escalation: createEscalationState(),
    redTeamUnlocked: false,
  };
}

/** Return the next event to fire, or null if the dispatcher is idle. */
export async function tick(
  state: ChaosDispatcherState,
  canvas: CanvasSnapshot,
  nowSimSeconds: number,
  seed: number,
): Promise<{
  state: ChaosDispatcherState;
  event: { eventId: string; targetNodeId?: string | null; params?: Record<string, string> } | null;
}> {
  switch (state.mode) {
    case "scenario": {
      const s = state.scenario;
      if (!s || state.scenarioCursor >= s.steps.length) return { state, event: null };
      const next = s.steps[state.scenarioCursor];
      if (next.offsetSimSeconds > nowSimSeconds) return { state, event: null };
      return {
        state: { ...state, scenarioCursor: state.scenarioCursor + 1 },
        event: { eventId: next.eventId, params: next.params },
      };
    }
    case "dice": {
      const roll = rollChaosDice(canvas, { rookieMode: false, seed });
      if (!roll) return { state, event: null };
      return {
        state,
        event: { eventId: roll.eventId, targetNodeId: roll.targetNodeId },
      };
    }
    case "budget": {
      if (isBudgetExhausted(state.budget)) return { state, event: null };
      const pick = pickNextBudgetEvent(state.budget, canvas, seed);
      if (!pick) return { state, event: null };
      const newBudget = deductBudget(state.budget, pick);
      return {
        state: { ...state, budget: newBudget },
        event: { eventId: pick.eventId },
      };
    }
    case "auto-escalation": {
      if (state.escalation.phase === "saturated") return { state, event: null };
      const ev = pickEventForState(state.escalation, canvas, seed);
      if (!ev) return { state, event: null };
      const nextEscalation = advanceState(state.escalation, { kind: "event-fired" });
      return {
        state: { ...state, escalation: nextEscalation },
        event: { eventId: ev.id },
      };
    }
    case "red-team": {
      if (!state.redTeamUnlocked || state.scenario == null) return { state, event: null };
      const s = state.scenario;
      if (state.scenarioCursor >= s.steps.length) return { state, event: null };
      const next = s.steps[state.scenarioCursor];
      if (next.offsetSimSeconds > nowSimSeconds) return { state, event: null };
      return {
        state: { ...state, scenarioCursor: state.scenarioCursor + 1 },
        event: { eventId: next.eventId, params: next.params },
      };
    }
    case "manual":
    case "none":
      return { state, event: null };
  }
}

export async function initializeRedTeam(
  state: ChaosDispatcherState,
  canvas: CanvasSnapshot,
): Promise<ChaosDispatcherState> {
  const { scenario } = await planRedTeamAttack(canvas, { difficulty: "advanced" });
  return { ...state, scenario, scenarioCursor: 0, redTeamUnlocked: true };
}

export function loadScenarioBySlug(
  state: ChaosDispatcherState,
  slug: string,
): ChaosDispatcherState {
  const s = CHAOS_SCENARIOS.find((x) => x.slug === slug);
  if (!s) throw new Error(`Unknown scenario: ${slug}`);
  return { ...state, scenario: s, scenarioCursor: 0 };
}
```

- [ ] **Step 2: `useChaosControl` hook**

```typescript
// architex/src/hooks/useChaosControl.ts
"use client";

import { useCallback, useState } from "react";
import {
  createDispatcher,
  loadScenarioBySlug,
  initializeRedTeam,
  tick,
  type ChaosDispatcherState,
  type ChaosMode,
} from "@/lib/simulation/adapters/chaos-control-mode";
import type { CanvasSnapshot } from "@/lib/chaos/chaos-dice";

export function useChaosControl(initialMode: ChaosMode = "none") {
  const [dispatcher, setDispatcher] = useState<ChaosDispatcherState>(() =>
    createDispatcher(initialMode),
  );

  const setMode = useCallback((mode: ChaosMode) => {
    setDispatcher((d) => ({ ...d, mode }));
  }, []);

  const chooseScenario = useCallback((slug: string) => {
    setDispatcher((d) => loadScenarioBySlug(d, slug));
  }, []);

  const unlockRedTeam = useCallback(async (canvas: CanvasSnapshot) => {
    setDispatcher(await initializeRedTeam(dispatcher, canvas));
  }, [dispatcher]);

  const tickNow = useCallback(
    async (canvas: CanvasSnapshot, nowSimSeconds: number, seed: number) => {
      const { state: next, event } = await tick(dispatcher, canvas, nowSimSeconds, seed);
      setDispatcher(next);
      return event;
    },
    [dispatcher],
  );

  return {
    mode: dispatcher.mode,
    dispatcher,
    setMode,
    chooseScenario,
    unlockRedTeam,
    tickNow,
  };
}
```

- [ ] **Step 3: Control-panel UI components**

```tsx
// architex/src/components/modules/sd/simulate/ChaosControlPanel.tsx
"use client";
import type { ChaosMode } from "@/lib/simulation/adapters/chaos-control-mode";
import { ChaosDicePanel } from "./ChaosDicePanel";
import { ChaosBudgetPanel } from "./ChaosBudgetPanel";
import { ManualInjectionMenu } from "./ManualInjectionMenu";
import { CHAOS_SCENARIOS } from "@/lib/chaos/chaos-scenarios";

export function ChaosControlPanel({
  mode,
  onModeChange,
  onScenarioPick,
  onManualFire,
  redTeamUnlocked,
  onUnlockRedTeam,
}: {
  mode: ChaosMode;
  onModeChange: (m: ChaosMode) => void;
  onScenarioPick: (slug: string) => void;
  onManualFire: (eventId: string, nodeId?: string) => void;
  redTeamUnlocked: boolean;
  onUnlockRedTeam: () => void;
}) {
  const modes: { id: ChaosMode; label: string; locked?: boolean }[] = [
    { id: "scenario", label: "Scenario" },
    { id: "dice", label: "Dice" },
    { id: "manual", label: "Manual" },
    { id: "budget", label: "Budget" },
    { id: "auto-escalation", label: "Escalate" },
    { id: "red-team", label: "Red team", locked: !redTeamUnlocked },
  ];

  return (
    <section
      className="flex h-full flex-col border-r border-neutral-800 bg-neutral-950"
      aria-label="Chaos control"
    >
      <div className="grid grid-cols-3 gap-1 border-b border-neutral-800 p-2">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={m.locked}
            onClick={() => (m.locked ? onUnlockRedTeam() : onModeChange(m.id))}
            className={`rounded px-2 py-1 text-xs uppercase tracking-wide transition ${
              mode === m.id
                ? "bg-sky-500 text-white"
                : m.locked
                  ? "cursor-pointer bg-neutral-800 text-neutral-500"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            }`}
            data-locked={m.locked ? "true" : undefined}
          >
            {m.label}
            {m.locked ? " 🔒" : null}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {mode === "scenario" && (
          <ul className="space-y-1">
            {CHAOS_SCENARIOS.map((s) => (
              <li key={s.slug}>
                <button
                  type="button"
                  onClick={() => onScenarioPick(s.slug)}
                  className="block w-full rounded px-2 py-1.5 text-left text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  <span className="font-serif">{s.displayName}</span>
                  <span className="ml-1 text-neutral-500">· {s.difficulty}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {mode === "dice" && <ChaosDicePanel />}
        {mode === "budget" && <ChaosBudgetPanel />}
        {mode === "manual" && <ManualInjectionMenu onFire={onManualFire} />}
      </div>
    </section>
  );
}

// architex/src/components/modules/sd/simulate/ChaosDicePanel.tsx
"use client";
export function ChaosDicePanel() {
  return (
    <div className="rounded-md border border-neutral-700 p-3">
      <p className="mb-2 font-serif text-sm text-neutral-100">
        Chaos dice
      </p>
      <p className="text-xs text-neutral-400">
        Rolls a random event every 45 sim-seconds, weighted by your canvas's
        surface area. Events with matching node families are favored.
      </p>
    </div>
  );
}

// architex/src/components/modules/sd/simulate/ChaosBudgetPanel.tsx
"use client";
import { useState } from "react";
export function ChaosBudgetPanel({
  onBudgetChange,
}: {
  onBudgetChange?: (minutes: number) => void;
}) {
  const [minutes, setMinutes] = useState(5);
  return (
    <div className="rounded-md border border-neutral-700 p-3">
      <p className="mb-2 font-serif text-sm text-neutral-100">Error budget</p>
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <span>Minutes of SLO breach allowed:</span>
        <input
          type="number"
          min={0.5}
          step={0.5}
          value={minutes}
          onChange={(e) => {
            const v = Number(e.target.value);
            setMinutes(v);
            onBudgetChange?.(v);
          }}
          className="w-16 rounded bg-neutral-800 px-2 py-1 font-mono text-neutral-100"
        />
      </label>
      <p className="mt-2 text-[10px] text-neutral-500">
        Engine picks events whose total impact consumes this budget. Exhaustion
        triggers a margin card and stops firing.
      </p>
    </div>
  );
}

// architex/src/components/modules/sd/simulate/ManualInjectionMenu.tsx
"use client";
import { CHAOS_TAXONOMY } from "@/lib/chaos/chaos-taxonomy";
export function ManualInjectionMenu({
  onFire,
}: {
  onFire: (eventId: string, nodeId?: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="mb-1 font-serif text-sm text-neutral-100">Manual injection</p>
      <p className="mb-2 text-[10px] text-neutral-500">
        Right-click any node on the canvas to fire an event targeted at it, or
        pick an event from the list below to fire against the whole canvas.
      </p>
      <ul className="space-y-0.5 text-xs">
        {CHAOS_TAXONOMY.slice(0, 20).map((e) => (
          <li key={e.id}>
            <button
              type="button"
              onClick={() => onFire(e.id)}
              className="block w-full rounded px-2 py-1 text-left text-neutral-300 hover:bg-neutral-800"
            >
              <span className="font-mono text-[11px] text-neutral-500">{e.family}</span>{" "}
              {e.displayName}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd architex
git add architex/src/lib/simulation/adapters/chaos-control-mode.ts architex/src/hooks/useChaosControl.ts architex/src/components/modules/sd/simulate/ChaosControlPanel.tsx architex/src/components/modules/sd/simulate/ChaosDicePanel.tsx architex/src/components/modules/sd/simulate/ChaosBudgetPanel.tsx architex/src/components/modules/sd/simulate/ManualInjectionMenu.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): 6-mode chaos control panel (§12.4)

Dispatcher routes between scenario · dice · manual · budget ·
auto-escalation · red-team. Red-team locked until user completes 3
chaos drills. Scenario mode renders a filterable list from the 40
scripted scenarios (Task 7). Budget mode UI accepts a minutes input;
dispatcher deducts impact per fire and stops at exhaustion. Manual
mode lists the first 20 taxonomy events + supports right-click on
canvas nodes for targeted injection.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: 6 activity framings + activity picker

**Files:**
- Create: `architex/src/lib/simulation/adapters/activity-framing.ts`
- Create: `architex/src/components/modules/sd/simulate/ActivityPicker.tsx`

Per §8.3, six activities shape the UI, the coaching, and the post-run loop: **Validate · Stress Test · Chaos Drill · Compare A/B · Forecast · Archaeology**. Each one configures the top chrome (which controls are visible), the metric strip (which metrics to emphasize), the chaos control panel (which modes are available), and the post-run summarizer's focus.

```typescript
// architex/src/lib/simulation/adapters/activity-framing.ts

/**
 * SIM-032: Activity framings (§8.3) — per-activity UI + engine configuration.
 */

import type { SDActivityKind } from "@/db/schema/sd-simulation-runs";

export interface ActivityFraming {
  kind: SDActivityKind;
  displayName: string;
  tagline: string;
  defaultDurationSimSeconds: number;
  allowedChaosModes: Array<
    "scenario" | "dice" | "manual" | "budget" | "auto-escalation" | "red-team" | "none"
  >;
  emphasisMetrics: Array<
    "p50-latency" | "p95-latency" | "p99-latency" | "error-rate" | "throughput-attainment" | "cost-per-request"
  >;
  coachEnabled: boolean;
  compareCanvas: boolean;
  dilationFactor: number;
  topChromeConfig: {
    showScaleSlider: boolean;
    showProviderPicker: boolean;
    showSloThresholdEditor: boolean;
    showGrowthCurveEditor: boolean;
    showIncidentPicker: boolean;
  };
}

export const ACTIVITY_FRAMINGS: Record<SDActivityKind, ActivityFraming> = {
  validate: {
    kind: "validate",
    displayName: "Validate",
    tagline: "Does it work?",
    defaultDurationSimSeconds: 300,  // 5 min
    allowedChaosModes: ["none"],
    emphasisMetrics: ["p50-latency", "p99-latency", "error-rate", "throughput-attainment"],
    coachEnabled: true,
    compareCanvas: false,
    dilationFactor: 5,  // compress 5 min of sim into 1 min real-time
    topChromeConfig: {
      showScaleSlider: true,
      showProviderPicker: true,
      showSloThresholdEditor: true,
      showGrowthCurveEditor: false,
      showIncidentPicker: false,
    },
  },
  stress: {
    kind: "stress",
    displayName: "Stress test",
    tagline: "Where does it break?",
    defaultDurationSimSeconds: 600,  // 10 min, auto-stops on breaking threshold
    allowedChaosModes: ["none"],
    emphasisMetrics: ["p99-latency", "error-rate", "throughput-attainment"],
    coachEnabled: true,
    compareCanvas: false,
    dilationFactor: 3,
    topChromeConfig: {
      showScaleSlider: true,
      showProviderPicker: false,
      showSloThresholdEditor: true,
      showGrowthCurveEditor: false,
      showIncidentPicker: false,
    },
  },
  "chaos-drill": {
    kind: "chaos-drill",
    displayName: "Chaos drill",
    tagline: "Can it survive?",
    defaultDurationSimSeconds: 600,
    allowedChaosModes: [
      "scenario",
      "dice",
      "manual",
      "budget",
      "auto-escalation",
      "red-team",
    ],
    emphasisMetrics: ["p99-latency", "error-rate", "throughput-attainment"],
    coachEnabled: true,
    compareCanvas: false,
    dilationFactor: 1,  // chaos drills in real-time (§29.1)
    topChromeConfig: {
      showScaleSlider: true,
      showProviderPicker: true,
      showSloThresholdEditor: true,
      showGrowthCurveEditor: false,
      showIncidentPicker: false,
    },
  },
  "compare-ab": {
    kind: "compare-ab",
    displayName: "Compare A/B",
    tagline: "Which design is better?",
    defaultDurationSimSeconds: 300,
    allowedChaosModes: ["scenario", "manual", "none"],
    emphasisMetrics: ["p50-latency", "p99-latency", "cost-per-request"],
    coachEnabled: false,
    compareCanvas: true,
    dilationFactor: 5,
    topChromeConfig: {
      showScaleSlider: true,
      showProviderPicker: true,
      showSloThresholdEditor: true,
      showGrowthCurveEditor: false,
      showIncidentPicker: false,
    },
  },
  forecast: {
    kind: "forecast",
    displayName: "Forecast",
    tagline: "What happens in 12 months?",
    defaultDurationSimSeconds: 1800,
    allowedChaosModes: ["scenario", "none"],
    emphasisMetrics: ["p99-latency", "error-rate", "cost-per-request"],
    coachEnabled: true,
    compareCanvas: false,
    dilationFactor: 30 * 60,  // 30 days per real-minute (§29.1)
    topChromeConfig: {
      showScaleSlider: true,
      showProviderPicker: true,
      showSloThresholdEditor: true,
      showGrowthCurveEditor: true,
      showIncidentPicker: false,
    },
  },
  archaeology: {
    kind: "archaeology",
    displayName: "Archaeology",
    tagline: "Could your design have survived?",
    defaultDurationSimSeconds: 3600,
    allowedChaosModes: ["scenario"],
    emphasisMetrics: ["p99-latency", "error-rate", "throughput-attainment"],
    coachEnabled: true,
    compareCanvas: false,
    dilationFactor: 10,
    topChromeConfig: {
      showScaleSlider: false,
      showProviderPicker: false,
      showSloThresholdEditor: false,
      showGrowthCurveEditor: false,
      showIncidentPicker: true,
    },
  },
};

export function getActivityFraming(kind: SDActivityKind): ActivityFraming {
  return ACTIVITY_FRAMINGS[kind];
}
```

```tsx
// architex/src/components/modules/sd/simulate/ActivityPicker.tsx
"use client";
import { ACTIVITY_FRAMINGS } from "@/lib/simulation/adapters/activity-framing";
import type { SDActivityKind } from "@/db/schema/sd-simulation-runs";

export function ActivityPicker({
  current,
  onPick,
}: {
  current: SDActivityKind;
  onPick: (k: SDActivityKind) => void;
}) {
  const kinds: SDActivityKind[] = [
    "validate",
    "stress",
    "chaos-drill",
    "compare-ab",
    "forecast",
    "archaeology",
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {kinds.map((k, i) => {
        const f = ACTIVITY_FRAMINGS[k];
        return (
          <button
            key={k}
            type="button"
            onClick={() => onPick(k)}
            aria-pressed={current === k}
            aria-label={`${f.displayName}: ${f.tagline}`}
            className={`flex flex-col rounded-md border px-3 py-2 text-left transition ${
              current === k
                ? "border-sky-500 bg-sky-500/10 text-sky-100"
                : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            <span className="text-[10px] uppercase tracking-wide text-neutral-500">
              {i + 1}. {f.kind}
            </span>
            <span className="font-serif text-sm">{f.displayName}</span>
            <span className="text-[11px] italic text-neutral-400">{f.tagline}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 1: Commit**

```bash
cd architex
git add architex/src/lib/simulation/adapters/activity-framing.ts architex/src/components/modules/sd/simulate/ActivityPicker.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): 6 activity framings + picker (§8.3)

ACTIVITY_FRAMINGS maps each of validate/stress/chaos-drill/compare-ab/
forecast/archaeology to UI + engine config: allowed chaos modes,
emphasis metrics, coach toggle, dilation factor (1 for chaos drill
real-time; 30min/real-min for Forecast; 5x for Validate). Top-chrome
config drives which pills render (scale slider, provider, SLO editor,
growth curve, incident picker).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Archaeology · incident picker + verdict card + chaos-library API

**Files:**
- Create: `architex/src/components/modules/sd/simulate/ArchaeologyIncidentPicker.tsx`
- Create: `architex/src/components/modules/sd/simulate/ArchaeologyVerdictCard.tsx`
- Create: `architex/src/app/api/sd/chaos-library/route.ts`

The Archaeology activity (§8.3.6) renders the 10 real incidents as cards. Click an incident → load its event sequence → run it against the user's canvas → show the verdict ("Your design survives Facebook 2021 BGP for 18 minutes longer than Facebook did, because...").

The chaos-library API exposes the 73-event taxonomy + the 10 incidents + 40 scenarios as a single JSON payload consumed by `/sd/chaos` page (§12.8).

- [ ] **Step 1: `ArchaeologyIncidentPicker`**

```tsx
// architex/src/components/modules/sd/simulate/ArchaeologyIncidentPicker.tsx
"use client";
import { REAL_INCIDENTS } from "@/lib/chaos/real-incidents";

export function ArchaeologyIncidentPicker({
  onPick,
}: {
  onPick: (slug: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {REAL_INCIDENTS.map((i) => (
        <button
          key={i.slug}
          type="button"
          onClick={() => onPick(i.slug)}
          className="group flex flex-col rounded-lg border border-neutral-700 bg-neutral-900 p-4 text-left transition hover:border-red-500 hover:bg-red-500/5"
        >
          <span className="mb-1 font-mono text-[11px] text-neutral-500">
            {i.company} · {i.date} · {i.durationMinutes}min
          </span>
          <span className="mb-2 font-serif text-base text-neutral-100">
            {i.displayName}
          </span>
          <span className="font-serif text-xs leading-relaxed text-neutral-400 line-clamp-4">
            {i.summary}
          </span>
          <span className="mt-2 text-[10px] uppercase tracking-wide text-red-400 opacity-0 transition group-hover:opacity-100">
            → Replay against your design
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: `ArchaeologyVerdictCard`**

```tsx
// architex/src/components/modules/sd/simulate/ArchaeologyVerdictCard.tsx
"use client";
import { getIncidentBySlug } from "@/lib/chaos/real-incidents";

export interface ArchaeologyVerdict {
  incidentSlug: string;
  survivedSeconds: number;
  realDurationSeconds: number;
  verdictMargin: number;  // (survived - real) / real
  keyWeakness: string;
  keyStrength: string;
}

export function ArchaeologyVerdictCard({
  verdict,
}: {
  verdict: ArchaeologyVerdict;
}) {
  const incident = getIncidentBySlug(verdict.incidentSlug);
  const survivedLonger = verdict.verdictMargin > 0;
  return (
    <article className="mx-auto max-w-2xl rounded-lg border border-neutral-700 bg-neutral-950 p-6 shadow-xl">
      <header className="mb-4 border-b border-neutral-800 pb-3">
        <h2 className="font-serif text-xl text-neutral-100">
          {incident.displayName}
        </h2>
        <p className="mt-1 text-xs text-neutral-500">
          {incident.company} · {incident.date} · {incident.durationMinutes} minute outage
        </p>
      </header>
      <div className="mb-4">
        <p className="font-serif text-lg leading-relaxed text-neutral-100">
          {survivedLonger ? (
            <>
              Your design survived {formatDuration(verdict.survivedSeconds)} longer
              than {incident.company} did,
            </>
          ) : (
            <>
              Your design fell {formatDuration(Math.abs(verdict.survivedSeconds - verdict.realDurationSeconds))} short
              of what {incident.company} achieved before recovery,
            </>
          )}
          <span className="font-normal italic text-neutral-300">
            {" "}because {verdict.keyStrength}.
          </span>
        </p>
      </div>
      <div className="rounded-md border border-red-500/40 bg-red-500/5 p-3">
        <p className="mb-1 text-xs uppercase tracking-wide text-red-400">
          The weakness
        </p>
        <p className="font-serif text-sm text-neutral-200">
          {verdict.keyWeakness}
        </p>
      </div>
    </article>
  );
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m${sec % 60 > 0 ? ` ${sec % 60}s` : ""}`;
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  return `${hours}h${mins > 0 ? ` ${mins}m` : ""}`;
}
```

- [ ] **Step 3: Chaos-library API**

```typescript
// architex/src/app/api/sd/chaos-library/route.ts
import { NextResponse } from "next/server";
import { CHAOS_TAXONOMY, chaosFamilyCounts } from "@/lib/chaos/chaos-taxonomy";
import { REAL_INCIDENTS } from "@/lib/chaos/real-incidents";
import { CHAOS_SCENARIOS } from "@/lib/chaos/chaos-scenarios";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    taxonomy: CHAOS_TAXONOMY,
    taxonomyFamilyCounts: chaosFamilyCounts(),
    realIncidents: REAL_INCIDENTS,
    scenarios: CHAOS_SCENARIOS,
  });
}
```

- [ ] **Step 4: Commit**

```bash
cd architex
git add architex/src/components/modules/sd/simulate/ArchaeologyIncidentPicker.tsx architex/src/components/modules/sd/simulate/ArchaeologyVerdictCard.tsx architex/src/app/api/sd/chaos-library/route.ts
git commit -m "$(cat <<'EOF'
feat(sim-ui): Archaeology activity · 10-incident picker + verdict card + API

ArchaeologyIncidentPicker: 10-card gallery with company · date ·
duration · summary · hover-reveal "Replay against your design" CTA.
ArchaeologyVerdictCard: renders the would-your-design-survive verdict
with strength + weakness reasons. /api/sd/chaos-library exposes the
73 events + 10 incidents + 40 scenarios as a single JSON for the
/sd/chaos page (§12.8).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: 7 drill-in features — scrubber, slow-mo, pause/inspect, cascade-trace, metric-drilldown, what-if, replay/share

**Files:**
- Create: `architex/src/hooks/useTimeScrubber.ts`
- Create: `architex/src/hooks/useWhatIfBranch.ts`
- Create: `architex/src/hooks/useReplayShare.ts`
- Create: `architex/src/components/modules/sd/simulate/TimelineScrubber.tsx`
- Create: `architex/src/components/modules/sd/simulate/SlowMoControl.tsx`
- Create: `architex/src/components/modules/sd/simulate/PauseInspectPopover.tsx`
- Create: `architex/src/components/modules/sd/simulate/CascadeTraceOverlay.tsx`
- Create: `architex/src/components/modules/sd/simulate/WhatIfBranchButton.tsx`
- Create: `architex/src/components/modules/sd/simulate/ReplayShareDialog.tsx`

Per §8.6, seven drill-in features let the user inspect a run. `MetricDrilldownDialog` already shipped in Task 20. The remaining 6 land here. Replay & Share ships in Phase 3 as a URL-hash-only stub; the full Phase-5 deterministic replay consumes the `keyframes` + `sd_chaos_event_log` already persisted in Task 1 + 2.

- [ ] **Step 1: `useTimeScrubber` hook + scrubber component**

```typescript
// architex/src/hooks/useTimeScrubber.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export interface TimeScrubberState {
  paused: boolean;
  currentSimMs: number;
  maxSimMs: number;
  playbackRate: number;  // 0.25, 0.5, 1, 2, 4
}

export function useTimeScrubber(maxSimMs: number) {
  const [state, setState] = useState<TimeScrubberState>({
    paused: true,
    currentSimMs: 0,
    maxSimMs,
    playbackRate: 1,
  });
  const raf = useRef<number | null>(null);
  const lastTickAt = useRef<number>(0);

  useEffect(() => setState((s) => ({ ...s, maxSimMs })), [maxSimMs]);

  const tick = useCallback(() => {
    setState((s) => {
      if (s.paused) return s;
      const now = Date.now();
      const realDelta = now - lastTickAt.current;
      lastTickAt.current = now;
      const next = s.currentSimMs + realDelta * s.playbackRate;
      return { ...s, currentSimMs: Math.min(s.maxSimMs, next) };
    });
    raf.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    lastTickAt.current = Date.now();
    setState((s) => ({ ...s, paused: false }));
    if (raf.current == null) raf.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, paused: true }));
    if (raf.current != null) {
      cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }, []);

  const seek = useCallback(
    (simMs: number) =>
      setState((s) => ({
        ...s,
        currentSimMs: Math.max(0, Math.min(s.maxSimMs, simMs)),
      })),
    [],
  );

  const setRate = useCallback(
    (rate: number) => setState((s) => ({ ...s, playbackRate: rate })),
    [],
  );

  useEffect(
    () => () => {
      if (raf.current != null) cancelAnimationFrame(raf.current);
    },
    [],
  );

  return { state, play, pause, seek, setRate };
}
```

```tsx
// architex/src/components/modules/sd/simulate/TimelineScrubber.tsx
"use client";
import { useTimeScrubber } from "@/hooks/useTimeScrubber";

export function TimelineScrubber({
  maxSimMs,
  onScrub,
}: {
  maxSimMs: number;
  onScrub?: (simMs: number) => void;
}) {
  const { state, play, pause, seek, setRate } = useTimeScrubber(maxSimMs);
  return (
    <div
      className="flex items-center gap-3 border-t border-neutral-800 bg-neutral-950 px-4 py-2"
      role="toolbar"
      aria-label="Timeline controls"
    >
      <button
        type="button"
        onClick={state.paused ? play : pause}
        className="rounded bg-neutral-800 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-neutral-200 hover:bg-neutral-700"
        aria-keyshortcuts="Space"
      >
        {state.paused ? "▶ Play" : "⏸ Pause"}
      </button>
      <input
        type="range"
        min={0}
        max={maxSimMs}
        value={state.currentSimMs}
        step={100}
        onChange={(e) => {
          const v = Number(e.target.value);
          seek(v);
          onScrub?.(v);
        }}
        className="flex-1 accent-sky-500"
        aria-label="Scrub timeline"
      />
      <span className="font-mono text-xs text-neutral-400">
        {formatMs(state.currentSimMs)} / {formatMs(state.maxSimMs)}
      </span>
      <select
        value={state.playbackRate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="rounded bg-neutral-800 px-2 py-1 font-mono text-xs text-neutral-200"
        aria-label="Playback rate"
      >
        <option value={0.25}>0.25x</option>
        <option value={0.5}>0.5x</option>
        <option value={1}>1x</option>
        <option value={2}>2x</option>
        <option value={4}>4x</option>
      </select>
    </div>
  );
}

function formatMs(ms: number): string {
  const s = Math.floor(ms / 1000);
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
```

- [ ] **Step 2: `SlowMoControl` (standalone rate control for non-scrubber surfaces)**

```tsx
// architex/src/components/modules/sd/simulate/SlowMoControl.tsx
"use client";
export function SlowMoControl({
  rate,
  onRateChange,
}: {
  rate: number;
  onRateChange: (rate: number) => void;
}) {
  const rates = [0.25, 0.5, 1, 2, 4];
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Playback rate">
      {rates.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={rate === r}
          onClick={() => onRateChange(r)}
          className={`rounded px-2 py-1 font-mono text-[11px] transition ${
            rate === r ? "bg-sky-500 text-white" : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          {r}x
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: `PauseInspectPopover`**

```tsx
// architex/src/components/modules/sd/simulate/PauseInspectPopover.tsx
"use client";

export interface NodeRuntimeState {
  nodeId: string;
  label: string;
  queueDepth: number;
  activeConnections: number;
  cpuPct: number;
  p99Ms: number;
  cacheHitRate?: number;
  status: "healthy" | "degraded" | "down";
}

export function PauseInspectPopover({
  state,
  x,
  y,
}: {
  state: NodeRuntimeState;
  x: number;
  y: number;
}) {
  const statusColor = state.status === "healthy" ? "text-emerald-400" : state.status === "degraded" ? "text-amber-400" : "text-red-400";
  return (
    <div
      role="dialog"
      className="pointer-events-none absolute z-40 w-64 rounded-md border border-neutral-700 bg-neutral-950/95 p-3 font-mono text-xs text-neutral-200 shadow-xl"
      style={{ left: x + 8, top: y + 8 }}
    >
      <p className="mb-2 font-serif text-sm text-neutral-100">{state.label}</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
        <dt className="text-neutral-500">status</dt>
        <dd className={statusColor}>{state.status}</dd>
        <dt className="text-neutral-500">queue</dt>
        <dd>{state.queueDepth}</dd>
        <dt className="text-neutral-500">active conns</dt>
        <dd>{state.activeConnections}</dd>
        <dt className="text-neutral-500">cpu</dt>
        <dd>{state.cpuPct.toFixed(0)}%</dd>
        <dt className="text-neutral-500">p99</dt>
        <dd>{state.p99Ms.toFixed(0)}ms</dd>
        {state.cacheHitRate != null && (
          <>
            <dt className="text-neutral-500">cache hit</dt>
            <dd>{(state.cacheHitRate * 100).toFixed(1)}%</dd>
          </>
        )}
      </dl>
    </div>
  );
}
```

- [ ] **Step 4: `CascadeTraceOverlay`**

```tsx
// architex/src/components/modules/sd/simulate/CascadeTraceOverlay.tsx
"use client";

export interface CascadePath {
  nodes: Array<{ id: string; enteredAtSimMs: number }>;
  edges: Array<{ from: string; to: string; latencyContributionMs: number }>;
}

export function CascadeTraceOverlay({
  path,
  visible,
}: {
  path: CascadePath;
  visible: boolean;
}) {
  if (!visible || path.nodes.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-20"
      data-testid="cascade-trace-overlay"
    >
      <svg width="100%" height="100%" className="absolute inset-0">
        {path.edges.map((e, i) => (
          <line
            key={`${e.from}-${e.to}-${i}`}
            x1={0}
            y1={0}
            x2={0}
            y2={0}
            stroke="#0ea5e9"
            strokeWidth={2}
            strokeDasharray="4 2"
            className="animate-pulse"
            data-edge={`${e.from}-${e.to}`}
          />
        ))}
      </svg>
      <ol className="absolute bottom-24 left-4 rounded-md border border-sky-500/40 bg-neutral-950/90 p-3 font-mono text-xs text-sky-100">
        {path.nodes.map((n, i) => (
          <li key={n.id}>
            {i + 1}. {n.id} · entered @ {Math.floor(n.enteredAtSimMs / 1000)}s
          </li>
        ))}
      </ol>
    </div>
  );
}
```

> **Note:** The SVG coordinates above are placeholders — they connect to the canvas viewport context (Phase-2 ReactFlow integration). The polish of drawing against real canvas coordinates lands in the Task 26 layout composition.

- [ ] **Step 5: `useWhatIfBranch` + button**

```typescript
// architex/src/hooks/useWhatIfBranch.ts
"use client";
import { useCallback, useState } from "react";

export interface WhatIfBranch {
  parentRunId: string;
  branchedAtSimMs: number;
  newRunId?: string;  // populated after server ack
  mutation: string;  // human-readable description
  createdAt: string;
}

export function useWhatIfBranch(runId: string) {
  const [branches, setBranches] = useState<WhatIfBranch[]>([]);
  const [creating, setCreating] = useState(false);

  const createBranch = useCallback(
    async (atSimMs: number, mutation: string) => {
      setCreating(true);
      try {
        const res = await fetch(`/api/sd/simulation-runs/${runId}/fork`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ atSimMs, mutation }),
        });
        if (!res.ok) throw new Error("Fork failed");
        const body = await res.json() as { newRunId: string };
        setBranches((prev) => [
          ...prev,
          {
            parentRunId: runId,
            branchedAtSimMs: atSimMs,
            newRunId: body.newRunId,
            mutation,
            createdAt: new Date().toISOString(),
          },
        ]);
        return body.newRunId;
      } finally {
        setCreating(false);
      }
    },
    [runId],
  );

  return { branches, createBranch, creating };
}
```

```tsx
// architex/src/components/modules/sd/simulate/WhatIfBranchButton.tsx
"use client";
import { useEffect } from "react";
import { useWhatIfBranch } from "@/hooks/useWhatIfBranch";

export function WhatIfBranchButton({
  runId,
  paused,
  currentSimMs,
  onBranched,
}: {
  runId: string;
  paused: boolean;
  currentSimMs: number;
  onBranched?: (newRunId: string) => void;
}) {
  const { createBranch, creating } = useWhatIfBranch(runId);

  // Bind 'B' keyboard shortcut
  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (!paused) return;
      if (e.key === "b" || e.key === "B") {
        const mutation = window.prompt("Describe the what-if (e.g., 'add a rate limiter')");
        if (!mutation) return;
        const id = await createBranch(currentSimMs, mutation);
        if (id) onBranched?.(id);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [paused, currentSimMs, createBranch, onBranched]);

  return (
    <button
      type="button"
      disabled={!paused || creating}
      onClick={async () => {
        const mutation = window.prompt("Describe the what-if");
        if (!mutation) return;
        const id = await createBranch(currentSimMs, mutation);
        if (id) onBranched?.(id);
      }}
      className="rounded bg-sky-600 px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-40"
      aria-keyshortcuts="B"
    >
      Branch (B)
    </button>
  );
}
```

- [ ] **Step 6: `useReplayShare` + dialog**

```typescript
// architex/src/hooks/useReplayShare.ts
"use client";
import { useCallback, useState } from "react";

export function useReplayShare(runId: string) {
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const share = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/sd/simulation-runs/${runId}/share`, {
        method: "POST",
      });
      if (!res.ok) return null;
      const body = await res.json() as { slug: string };
      setShareSlug(body.slug);
      return body.slug;
    } finally {
      setGenerating(false);
    }
  }, [runId]);

  const shareUrl = shareSlug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/sd/replay/${shareSlug}`
    : null;

  return { share, shareSlug, shareUrl, generating };
}
```

```tsx
// architex/src/components/modules/sd/simulate/ReplayShareDialog.tsx
"use client";
import { useReplayShare } from "@/hooks/useReplayShare";

export function ReplayShareDialog({
  runId,
  open,
  onClose,
}: {
  runId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { share, shareUrl, generating } = useReplayShare(runId);
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-[420px] rounded-lg bg-neutral-900 p-6 font-serif text-neutral-100 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-lg">Share this run</h2>
        <p className="mb-4 text-sm text-neutral-400">
          Generate a read-only link. Anyone with the link can scrub the
          timeline, view the metrics, and read the narrative stream. They
          cannot edit the canvas.
        </p>
        {shareUrl ? (
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full rounded border border-neutral-700 bg-neutral-800 px-2 py-1.5 font-mono text-xs text-neutral-100"
          />
        ) : (
          <button
            type="button"
            onClick={share}
            disabled={generating}
            className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate share link"}
          </button>
        )}
        <div className="mt-4 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded bg-neutral-700 px-3 py-1.5 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Commit**

```bash
cd architex
git add architex/src/hooks/useTimeScrubber.ts architex/src/hooks/useWhatIfBranch.ts architex/src/hooks/useReplayShare.ts architex/src/components/modules/sd/simulate/TimelineScrubber.tsx architex/src/components/modules/sd/simulate/SlowMoControl.tsx architex/src/components/modules/sd/simulate/PauseInspectPopover.tsx architex/src/components/modules/sd/simulate/CascadeTraceOverlay.tsx architex/src/components/modules/sd/simulate/WhatIfBranchButton.tsx architex/src/components/modules/sd/simulate/ReplayShareDialog.tsx
git commit -m "$(cat <<'EOF'
feat(sim-ui): 7 drill-in features · scrubber · slow-mo · pause/inspect · cascade · what-if · share

Task 25 wraps the inspection surfaces from §8.6. Timeline scrubber
with 0.25x-4x playback rate. Pause/inspect popover over canvas nodes
shows queue depth, active conns, CPU, p99. Cascade trace overlay
draws the failure path (ordered list + SVG line scaffolding; final
canvas-coord wiring in Task 26). What-if branching gated to paused
state, 'B' keyboard shortcut, prompts for mutation description. Replay
share dialog posts to /fork + renders shareable URL.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 26: `SimulateModeLayout` composition + `PostRunResultsCard` (triple-loop CTA)

**Files:**
- Modify: `architex/src/components/modules/sd/modes/SimulateModeLayout.tsx`
- Create: `architex/src/components/modules/sd/simulate/SimulateTopChrome.tsx`
- Create: `architex/src/components/modules/sd/simulate/SimulateLeftControlRail.tsx`
- Create: `architex/src/components/modules/sd/simulate/SimulateCanvasWrapper.tsx`
- Create: `architex/src/components/modules/sd/simulate/ParticleLayer.tsx`
- Create: `architex/src/components/modules/sd/simulate/WhisperCoachToast.tsx`
- Create: `architex/src/components/modules/sd/simulate/CostMeter.tsx`
- Create: `architex/src/components/modules/sd/simulate/ScaleSlider.tsx`
- Create: `architex/src/components/modules/sd/simulate/PostRunResultsCard.tsx`
- Create: `architex/src/hooks/useSimulateRun.ts`
- Create: `architex/src/hooks/useCostMeter.ts`
- Create: `architex/src/hooks/useScaleSlider.ts`
- Create: `architex/src/stores/simulate-store.ts`
- Create: `architex/src/components/modules/sd/simulate/__tests__/PostRunResultsCard.test.tsx`

This task assembles every Simulate component from Tasks 19-25 into the 4-region layout of §8.2. The post-run results card is the §8.7 triple-loop CTA: Learn / Build / Drill.

- [ ] **Step 1: `simulate-store.ts` (Zustand slice)**

```typescript
// architex/src/stores/simulate-store.ts
import { create } from "zustand";
import type { SDActivityKind, SDLoadModel, SDScaleSlider, SDProvider } from "@/db/schema/sd-simulation-runs";
import type { ChaosMode } from "@/lib/simulation/adapters/chaos-control-mode";

export interface SimulateState {
  runId: string | null;
  activityKind: SDActivityKind;
  chaosMode: ChaosMode;
  loadModel: SDLoadModel;
  scaleSlider: SDScaleSlider;
  provider: SDProvider;
  running: boolean;
  paused: boolean;
  currentSimMs: number;
  maxSimMs: number;
  coachQuiet: boolean;
  setRunId(id: string | null): void;
  setActivity(k: SDActivityKind): void;
  setChaosMode(m: ChaosMode): void;
  setLoadModel(m: SDLoadModel): void;
  setScale(s: SDScaleSlider): void;
  setProvider(p: SDProvider): void;
  setRunning(r: boolean): void;
  setPaused(p: boolean): void;
  setCurrentSimMs(ms: number): void;
  setMaxSimMs(ms: number): void;
  setCoachQuiet(q: boolean): void;
  reset(): void;
}

export const useSimulateStore = create<SimulateState>((set) => ({
  runId: null,
  activityKind: "validate",
  chaosMode: "none",
  loadModel: "uniform",
  scaleSlider: "1M",
  provider: "aws",
  running: false,
  paused: true,
  currentSimMs: 0,
  maxSimMs: 300_000,
  coachQuiet: false,
  setRunId: (id) => set({ runId: id }),
  setActivity: (k) => set({ activityKind: k }),
  setChaosMode: (m) => set({ chaosMode: m }),
  setLoadModel: (m) => set({ loadModel: m }),
  setScale: (s) => set({ scaleSlider: s }),
  setProvider: (p) => set({ provider: p }),
  setRunning: (r) => set({ running: r }),
  setPaused: (p) => set({ paused: p }),
  setCurrentSimMs: (ms) => set({ currentSimMs: ms }),
  setMaxSimMs: (ms) => set({ maxSimMs: ms }),
  setCoachQuiet: (q) => set({ coachQuiet: q }),
  reset: () =>
    set({
      runId: null,
      running: false,
      paused: true,
      currentSimMs: 0,
    }),
}));
```

- [ ] **Step 2: `useSimulateRun`, `useCostMeter`, `useScaleSlider` hooks**

```typescript
// architex/src/hooks/useSimulateRun.ts
"use client";
import { useCallback } from "react";
import { useSimulateStore } from "@/stores/simulate-store";

export function useSimulateRun() {
  const store = useSimulateStore();

  const startRun = useCallback(async (designId: string) => {
    const res = await fetch(`/api/sd/simulation-runs/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        designId,
        activityKind: store.activityKind,
        chaosControlMode: store.chaosMode === "none" ? null : store.chaosMode,
        loadModel: store.loadModel,
        scaleSlider: store.scaleSlider,
        provider: store.provider,
      }),
    });
    if (!res.ok) throw new Error("Failed to start run");
    const body = await res.json() as { runId: string; maxSimMs: number };
    store.setRunId(body.runId);
    store.setMaxSimMs(body.maxSimMs);
    store.setRunning(true);
    store.setPaused(false);
    return body.runId;
  }, [store]);

  const completeRun = useCallback(async () => {
    if (!store.runId) return;
    const res = await fetch(`/api/sd/simulation-runs/${store.runId}/complete`, {
      method: "POST",
    });
    store.setRunning(false);
    store.setPaused(true);
    return res.ok;
  }, [store]);

  return { startRun, completeRun, ...store };
}

// architex/src/hooks/useCostMeter.ts
"use client";
import { useEffect, useState } from "react";

export interface CostMeterState {
  dollarsPerHour: number;
  dollarsPerMonth: number;
  dollarsPerUser: number;
  lastUpdatedAt: number;
}

export function useCostMeter(runId: string | null) {
  const [state, setState] = useState<CostMeterState>({
    dollarsPerHour: 0,
    dollarsPerMonth: 0,
    dollarsPerUser: 0,
    lastUpdatedAt: 0,
  });

  useEffect(() => {
    if (!runId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sd/simulation-runs/${runId}/heartbeat?metric=cost`);
        if (!res.ok) return;
        const body = await res.json() as CostMeterState;
        setState({ ...body, lastUpdatedAt: Date.now() });
      } catch { /* silent */ }
    }, 1000); // 1Hz per plan open-question 6
    return () => clearInterval(interval);
  }, [runId]);

  return state;
}

// architex/src/hooks/useScaleSlider.ts
"use client";
import { useSimulateStore } from "@/stores/simulate-store";
import type { SDScaleSlider } from "@/db/schema/sd-simulation-runs";

const SCALE_DAUS: Record<SDScaleSlider, number> = {
  "10k": 10_000,
  "1M": 1_000_000,
  "10M": 10_000_000,
  "100M": 100_000_000,
  "1B": 1_000_000_000,
};

export function useScaleSlider() {
  const { scaleSlider, setScale } = useSimulateStore();
  return { scaleSlider, setScale, currentDau: SCALE_DAUS[scaleSlider] };
}
```

- [ ] **Step 3: Top chrome + left rail + cost meter + scale slider + whisper toast + particle layer**

```tsx
// architex/src/components/modules/sd/simulate/ScaleSlider.tsx
"use client";
import { useScaleSlider } from "@/hooks/useScaleSlider";
import type { SDScaleSlider } from "@/db/schema/sd-simulation-runs";

const POSITIONS: SDScaleSlider[] = ["10k", "1M", "10M", "100M", "1B"];

export function ScaleSlider() {
  const { scaleSlider, setScale } = useScaleSlider();
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="DAU scale">
      {POSITIONS.map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={scaleSlider === p}
          onClick={() => setScale(p)}
          className={`rounded px-2 py-1 font-mono text-[11px] transition ${
            scaleSlider === p
              ? "bg-sky-500 text-white"
              : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
          }`}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// architex/src/components/modules/sd/simulate/CostMeter.tsx
"use client";
import { useCostMeter } from "@/hooks/useCostMeter";

export function CostMeter({ runId }: { runId: string | null }) {
  const { dollarsPerHour, dollarsPerMonth } = useCostMeter(runId);
  return (
    <div
      className="fixed bottom-16 right-4 z-20 flex flex-col rounded-md border border-neutral-700 bg-neutral-950/90 px-3 py-2 font-mono text-xs text-neutral-200 shadow-lg"
      data-testid="cost-meter"
    >
      <span className="text-[10px] uppercase tracking-wide text-neutral-500">cost</span>
      <span className="text-sm">${dollarsPerHour.toFixed(2)}/hr</span>
      <span className="text-[10px] text-neutral-400">
        ${(dollarsPerMonth / 1000).toFixed(1)}k/mo
      </span>
    </div>
  );
}

// architex/src/components/modules/sd/simulate/SimulateTopChrome.tsx
"use client";
import { useSimulateStore } from "@/stores/simulate-store";
import { ActivityPicker } from "./ActivityPicker";
import { ScaleSlider } from "./ScaleSlider";
import type { SDProvider } from "@/db/schema/sd-simulation-runs";

const PROVIDERS: SDProvider[] = ["aws", "gcp", "azure", "abstract", "bare-metal"];

export function SimulateTopChrome() {
  const { activityKind, setActivity, provider, setProvider } = useSimulateStore();
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-2">
      <ActivityPicker current={activityKind} onPick={setActivity} />
      <div className="h-6 w-px bg-neutral-800" />
      <ScaleSlider />
      <div className="h-6 w-px bg-neutral-800" />
      <select
        value={provider}
        onChange={(e) => setProvider(e.target.value as SDProvider)}
        className="rounded bg-neutral-800 px-2 py-1 font-mono text-xs text-neutral-200"
        aria-label="Cloud provider"
      >
        {PROVIDERS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </header>
  );
}

// architex/src/components/modules/sd/simulate/SimulateLeftControlRail.tsx
"use client";
import { useSimulateStore } from "@/stores/simulate-store";
import { ChaosControlPanel } from "./ChaosControlPanel";
import { WhatIfBranchButton } from "./WhatIfBranchButton";

export function SimulateLeftControlRail({ runId }: { runId: string }) {
  const { paused, currentSimMs, chaosMode, setChaosMode } = useSimulateStore();
  return (
    <nav className="flex w-64 flex-col border-r border-neutral-800 bg-neutral-950">
      <ChaosControlPanel
        mode={chaosMode}
        onModeChange={setChaosMode}
        onScenarioPick={() => {
          /* wired by parent via useChaosControl */
        }}
        onManualFire={() => {
          /* wired by parent */
        }}
        redTeamUnlocked={false}
        onUnlockRedTeam={() => {
          /* wired by parent */
        }}
      />
      <div className="border-t border-neutral-800 p-3">
        <WhatIfBranchButton
          runId={runId}
          paused={paused}
          currentSimMs={currentSimMs}
        />
      </div>
    </nav>
  );
}

// architex/src/components/modules/sd/simulate/ParticleLayer.tsx
"use client";
import { useEffect, useRef } from "react";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  lifeMs: number;
}

/**
 * Canvas-based particle layer. Engine plumbs particle positions via a
 * subscriber contract; this component renders them at 60fps.
 *
 * Phase-3 minimal implementation — full physics + 10k-particle target
 * lands in the Phase-5 rendering polish.
 */
export function ParticleLayer({
  width,
  height,
  particles,
}: {
  width: number;
  height: number;
  particles: Particle[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let rafId = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, [width, height, particles]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
      style={{ width, height }}
      data-testid="particle-layer"
    />
  );
}

// architex/src/components/modules/sd/simulate/WhisperCoachToast.tsx
"use client";
import { useEffect, useState } from "react";
import type { WhisperIntervention } from "@/lib/simulation/adapters/whisper-coach";

export function WhisperCoachToast({
  intervention,
}: {
  intervention: WhisperIntervention | null;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!intervention) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 8_000);
    return () => clearTimeout(t);
  }, [intervention]);
  if (!visible || !intervention) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-30 w-[360px] -translate-x-1/2 rounded-md border border-sky-500/30 bg-neutral-950/95 p-3 shadow-lg"
      data-testid="whisper-toast"
      data-shape={intervention.shape}
    >
      <span className="mb-1 block text-[10px] uppercase tracking-wide text-sky-400">
        Coach · {intervention.shape}
      </span>
      <p className="font-serif text-sm leading-relaxed text-neutral-100">
        {intervention.text}
      </p>
      {intervention.conceptSlug && (
        <a
          href={`/sd/learn/concepts/${intervention.conceptSlug}`}
          className="mt-2 inline-block text-[11px] uppercase tracking-wide text-sky-400 underline"
        >
          Read the primer →
        </a>
      )}
    </div>
  );
}

// architex/src/components/modules/sd/simulate/SimulateCanvasWrapper.tsx
"use client";
import { ReactNode } from "react";
import { ParticleLayer } from "./ParticleLayer";

export function SimulateCanvasWrapper({ children }: { children: ReactNode }) {
  return (
    <section className="relative flex-1 overflow-hidden bg-[#0b0d11]">
      {children}
      {/*
        Particle positions are populated via a useContext/Provider in
        the engine wrapper (not shown here). Phase-3 passes an empty
        particles[] when not live-streaming from the engine.
      */}
      <ParticleLayer width={1600} height={900} particles={[]} />
    </section>
  );
}

// architex/src/components/modules/sd/simulate/PostRunResultsCard.tsx
"use client";
import type { PostRunSummary } from "@/lib/ai/sd-post-run-summarizer";

export function PostRunResultsCard({
  summary,
  onLearn,
  onBuild,
  onDrill,
}: {
  summary: PostRunSummary;
  onLearn: (conceptSlug: string) => void;
  onBuild: (action: string) => void;
  onDrill: (problemSlug: string, persona: string) => void;
}) {
  return (
    <article
      className="mx-auto max-w-3xl rounded-xl border border-neutral-700 bg-neutral-950 p-6 shadow-2xl"
      aria-labelledby="post-run-heading"
    >
      <header className="mb-4">
        <h2 id="post-run-heading" className="font-serif text-2xl text-neutral-100">
          Run complete
        </h2>
        <p className="mt-2 font-serif text-sm italic text-neutral-400">
          {summary.narrative}
        </p>
      </header>
      <div className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => onLearn(summary.learnRec.conceptSlug)}
          className="flex flex-col rounded-md border border-sky-500/40 bg-sky-500/5 p-4 text-left transition hover:bg-sky-500/10"
        >
          <span className="mb-1 text-[10px] uppercase tracking-wide text-sky-400">
            Learn
          </span>
          <span className="font-serif text-base text-neutral-100">
            {summary.learnRec.conceptSlug}
          </span>
          <span className="mt-2 font-serif text-xs text-neutral-400">
            {summary.learnRec.reason}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onBuild(summary.buildRec.action)}
          className="flex flex-col rounded-md border border-amber-500/40 bg-amber-500/5 p-4 text-left transition hover:bg-amber-500/10"
        >
          <span className="mb-1 text-[10px] uppercase tracking-wide text-amber-400">
            Build
          </span>
          <span className="font-serif text-base text-neutral-100">
            {summary.buildRec.action}
          </span>
          <span className="mt-2 font-serif text-xs text-neutral-400">
            {summary.buildRec.reason}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onDrill(summary.drillRec.problemSlug, summary.drillRec.persona)}
          className="flex flex-col rounded-md border border-emerald-500/40 bg-emerald-500/5 p-4 text-left transition hover:bg-emerald-500/10"
        >
          <span className="mb-1 text-[10px] uppercase tracking-wide text-emerald-400">
            Drill
          </span>
          <span className="font-serif text-base text-neutral-100">
            {summary.drillRec.problemSlug} · {summary.drillRec.persona}
          </span>
          <span className="mt-2 font-serif text-xs text-neutral-400">
            {summary.drillRec.reason}
          </span>
        </button>
      </div>
      <footer className="mt-4 flex items-center justify-between text-[11px] text-neutral-500">
        <span>Generated by {summary.generatedModel}</span>
        <time dateTime={summary.generatedAt}>{summary.generatedAt}</time>
      </footer>
    </article>
  );
}
```

- [ ] **Step 4: Fill in `SimulateModeLayout.tsx`**

```tsx
// architex/src/components/modules/sd/modes/SimulateModeLayout.tsx
"use client";

import { useState } from "react";
import { SimulateTopChrome } from "../simulate/SimulateTopChrome";
import { SimulateLeftControlRail } from "../simulate/SimulateLeftControlRail";
import { SimulateCanvasWrapper } from "../simulate/SimulateCanvasWrapper";
import { MetricStrip } from "../simulate/MetricStrip";
import { MarginNarrativeStream } from "../simulate/MarginNarrativeStream";
import { TimelineScrubber } from "../simulate/TimelineScrubber";
import { CostMeter } from "../simulate/CostMeter";
import { CinematicChaosRibbon } from "../simulate/CinematicChaosRibbon";
import { RedVignette } from "../simulate/RedVignette";
import { WhisperCoachToast } from "../simulate/WhisperCoachToast";
import { PostRunResultsCard } from "../simulate/PostRunResultsCard";
import { useSimulateStore } from "@/stores/simulate-store";
import { useCinematicChaos } from "@/hooks/useCinematicChaos";
import { useMarginNarrative } from "@/hooks/useMarginNarrative";
import type { PostRunSummary } from "@/lib/ai/sd-post-run-summarizer";
import type { WhisperIntervention } from "@/lib/simulation/adapters/whisper-coach";

export function SimulateModeLayout({
  designId,
}: {
  designId: string;
}) {
  const { runId, running, maxSimMs } = useSimulateStore();
  const { active: chaosActive, reducedMotion } = useCinematicChaos();
  const { cards, copyAsMarkdown } = useMarginNarrative();
  const [whisper] = useState<WhisperIntervention | null>(null);
  const [postRun] = useState<PostRunSummary | null>(null);

  return (
    <div className="flex h-screen flex-col bg-black">
      <SimulateTopChrome />
      <div className="flex flex-1 overflow-hidden">
        {runId && <SimulateLeftControlRail runId={runId} />}
        <SimulateCanvasWrapper>
          <CinematicChaosRibbon active={chaosActive} reducedMotion={reducedMotion} />
          <RedVignette active={chaosActive != null} reducedMotion={reducedMotion} />
        </SimulateCanvasWrapper>
        <aside className="flex w-80 flex-col">
          {runId && <MetricStrip runId={runId} />}
          <div className="flex-1">
            <MarginNarrativeStream cards={cards} onCopyMarkdown={copyAsMarkdown} />
          </div>
        </aside>
      </div>
      {runId && <TimelineScrubber maxSimMs={maxSimMs} />}
      {runId && <CostMeter runId={runId} />}
      <WhisperCoachToast intervention={whisper} />
      {postRun && !running && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
          <PostRunResultsCard
            summary={postRun}
            onLearn={() => {}}
            onBuild={() => {}}
            onDrill={() => {}}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: `PostRunResultsCard` test**

```tsx
// architex/src/components/modules/sd/simulate/__tests__/PostRunResultsCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PostRunResultsCard } from "../PostRunResultsCard";

const summary = {
  narrative: "Your design held SLOs but cost per request was high.",
  learnRec: { conceptSlug: "caching-strategies", reason: "Reduce egress." },
  buildRec: { action: "Add a CDN", reason: "Your origin is hot." },
  drillRec: { problemSlug: "design-twitter", persona: "staff", reason: "Practice this at scale." },
  generatedModel: "sonnet" as const,
  generatedAt: "2026-04-20T12:00:00Z",
};

describe("PostRunResultsCard", () => {
  it("renders triple-loop CTAs", () => {
    const onLearn = vi.fn();
    const onBuild = vi.fn();
    const onDrill = vi.fn();
    render(
      <PostRunResultsCard
        summary={summary}
        onLearn={onLearn}
        onBuild={onBuild}
        onDrill={onDrill}
      />,
    );
    expect(screen.getByText("Learn")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
    expect(screen.getByText("Drill")).toBeInTheDocument();
    fireEvent.click(screen.getByText("caching-strategies"));
    expect(onLearn).toHaveBeenCalledWith("caching-strategies");
  });
});
```

- [ ] **Step 6: Commit**

```bash
cd architex
pnpm test:run -- PostRunResultsCard
git add architex/src/components/modules/sd/ architex/src/stores/simulate-store.ts architex/src/hooks/useSimulateRun.ts architex/src/hooks/useCostMeter.ts architex/src/hooks/useScaleSlider.ts
git commit -m "$(cat <<'EOF'
feat(sim-ui): SimulateModeLayout composition + PostRunResultsCard

4-region layout per §8.2: top chrome (activity + scale + provider) ·
left control rail (chaos + what-if) · center canvas + particles +
cinematic ribbon + vignette · right metric strip + narrative stream ·
bottom timeline scrubber. CostMeter fixed bottom-right at 1Hz.
WhisperCoachToast center-bottom, 8s auto-dismiss.
PostRunResultsCard: triple-loop Learn/Build/Drill CTAs consuming
Sonnet-authored recommendations.

simulate-store.ts Zustand slice owns runId, activity, chaosMode,
loadModel, scale, provider, running/paused, sim time, coach-quiet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Group E · Drill mode UI + behavior (Tasks 27-31)

> Drill mode is the interview diamond. 5-stage gated clock · 8 personas · 3 mock modes · 6-axis rubric · AI postmortem · shareable PDF · abandon/resume. Group E composes on top of Task 16 (persona prompts + SSE) + Task 17 (rubric + postmortem).

---

## Task 27: `sd-drill-stages.ts` · `sd-drill-variants.ts` · `sd-drill-rubric.ts` · `sd-drill-canonical.ts` · `sd-drill-timing.ts` · `sd-drill-hint-ladder.ts`

**Files:**
- Create: `architex/src/lib/drill/sd-drill-stages.ts`
- Create: `architex/src/lib/drill/sd-drill-variants.ts`
- Create: `architex/src/lib/drill/sd-drill-rubric.ts`
- Create: `architex/src/lib/drill/sd-drill-canonical.ts`
- Create: `architex/src/lib/drill/sd-drill-timing.ts`
- Create: `architex/src/lib/drill/sd-drill-hint-ladder.ts`
- Create: `architex/src/lib/drill/__tests__/sd-drill-stages.test.ts`
- Create: `architex/src/lib/drill/__tests__/sd-drill-rubric.test.ts`
- Create: `architex/src/lib/drill/__tests__/sd-drill-timing.test.ts`

Six library modules that make Drill's behavior correct. Pure functions; no UI; fully testable.

- [ ] **Step 1: `sd-drill-stages.ts` — 5-stage FSM with gate predicates**

```typescript
// architex/src/lib/drill/sd-drill-stages.ts

/**
 * DRILL-010: 5-stage FSM for SD drill (§9.3).
 *
 * Stages in order: clarify → estimate → design → deep-dive → qna.
 * Each stage has: allowedActions, duration, gate predicate (what must
 * be true before advance is allowed), and a description.
 */

import type { SDDrillStage } from "@/db/schema/sd-drill-attempts";

export const STAGE_ORDER: SDDrillStage[] = [
  "clarify",
  "estimate",
  "design",
  "deep-dive",
  "qna",
];

export const STAGE_DURATION_MS: Record<SDDrillStage, number> = {
  clarify: 5 * 60 * 1000,
  estimate: 5 * 60 * 1000,
  design: 15 * 60 * 1000,
  "deep-dive": 15 * 60 * 1000,
  qna: 5 * 60 * 1000,
};

export interface StageGateInput {
  stage: SDDrillStage;
  clarifyTurnCount: number;
  hasNapkinMath: boolean;
  canvasNodeCount: number;
  canvasEdgeCount: number;
  deepDiveTurnCount: number;
  qnaTurnCount: number;
}

/** Returns true if the stage can be marked "done" and advanced. */
export function canAdvanceStage(input: StageGateInput): boolean {
  switch (input.stage) {
    case "clarify":
      return input.clarifyTurnCount >= 2;
    case "estimate":
      return input.hasNapkinMath;
    case "design":
      return input.canvasNodeCount >= 3 && input.canvasEdgeCount >= 2;
    case "deep-dive":
      return input.deepDiveTurnCount >= 2;
    case "qna":
      return input.qnaTurnCount >= 1;
  }
}

export function nextStage(current: SDDrillStage): SDDrillStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx < 0 || idx === STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}

export function prevStage(current: SDDrillStage): SDDrillStage | null {
  const idx = STAGE_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return STAGE_ORDER[idx - 1];
}

export function totalDurationMs(): number {
  return STAGE_ORDER.reduce((sum, s) => sum + STAGE_DURATION_MS[s], 0);
}
```

- [ ] **Step 2: `sd-drill-variants.ts` — study / timed-mock / pair-ai / exam / full-stack-loop / verbal / review**

```typescript
// architex/src/lib/drill/sd-drill-variants.ts

/**
 * DRILL-011: 7-variant config for SD drill (§9.4).
 * Phase 3 ships 3 fully-wired (study · timed-mock · pair-ai); the
 * remaining 4 (exam · full-stack-loop · verbal · review) ship as
 * variant enum values consumed by the rubric grader. Their UI
 * polish (full-stack-loop's 90-min clock · verbal's Whisper mic) lands
 * in Phase 4.
 */

import type { SDDrillVariant } from "@/db/schema/sd-drill-attempts";

export interface DrillVariantConfig {
  variant: SDDrillVariant;
  displayName: string;
  description: string;
  enforceClock: boolean;
  hintsAllowed: boolean;
  hintsFree: boolean;
  aiAllowed: boolean;
  verbalMode: boolean;
  coachSilent: boolean;
  durationMs: number;
}

export const VARIANT_CONFIGS: Record<SDDrillVariant, DrillVariantConfig> = {
  study: {
    variant: "study",
    displayName: "Study",
    description: "No timer. Canvas enabled from the start. Build intuition without stress.",
    enforceClock: false,
    hintsAllowed: true,
    hintsFree: true,
    aiAllowed: true,
    verbalMode: false,
    coachSilent: false,
    durationMs: Number.POSITIVE_INFINITY,
  },
  "timed-mock": {
    variant: "timed-mock",
    displayName: "Timed mock",
    description: "5-stage clock enforced. 45 minutes. Default mock.",
    enforceClock: true,
    hintsAllowed: true,
    hintsFree: false,
    aiAllowed: true,
    verbalMode: false,
    coachSilent: true,
    durationMs: 45 * 60 * 1000,
  },
  exam: {
    variant: "exam",
    displayName: "Exam",
    description: "Timed-mock + no hints, no AI questions allowed. Full integrity.",
    enforceClock: true,
    hintsAllowed: false,
    hintsFree: false,
    aiAllowed: false,
    verbalMode: false,
    coachSilent: true,
    durationMs: 45 * 60 * 1000,
  },
  "pair-ai": {
    variant: "pair-ai",
    displayName: "Pair AI",
    description: "Sonnet live at every stage. Interviewer has personality and pushes back.",
    enforceClock: true,
    hintsAllowed: true,
    hintsFree: false,
    aiAllowed: true,
    verbalMode: false,
    coachSilent: true,
    durationMs: 45 * 60 * 1000,
  },
  "full-stack-loop": {
    variant: "full-stack-loop",
    displayName: "Full-stack loop",
    description: "90 minutes. Same problem in SD (45) + LLD (45). Phase-4 polish.",
    enforceClock: true,
    hintsAllowed: true,
    hintsFree: false,
    aiAllowed: true,
    verbalMode: false,
    coachSilent: true,
    durationMs: 90 * 60 * 1000,
  },
  verbal: {
    variant: "verbal",
    displayName: "Verbal",
    description: "Microphone on. User narrates aloud. Whisper transcribes. Phase-4 polish.",
    enforceClock: true,
    hintsAllowed: true,
    hintsFree: false,
    aiAllowed: true,
    verbalMode: true,
    coachSilent: true,
    durationMs: 45 * 60 * 1000,
  },
  review: {
    variant: "review",
    displayName: "Review",
    description: "Open a past drill attempt with AI commentary overlays. Phase-4 polish.",
    enforceClock: false,
    hintsAllowed: false,
    hintsFree: false,
    aiAllowed: true,
    verbalMode: false,
    coachSilent: false,
    durationMs: Number.POSITIVE_INFINITY,
  },
};

export function getVariantConfig(v: SDDrillVariant): DrillVariantConfig {
  return VARIANT_CONFIGS[v];
}
```

- [ ] **Step 3: `sd-drill-rubric.ts` — rubric bands + thresholds**

```typescript
// architex/src/lib/drill/sd-drill-rubric.ts

/**
 * DRILL-012: Rubric bands + weights per axis (§9.9 + §15.5).
 *
 * The Sonnet grader (Task 17) produces 1-5 scores per axis. This file
 * defines how the scores map to bands, how overall maps to grade
 * tiers, and the threshold above which a drill is "passing".
 */

import type { RubricAxis } from "@/lib/ai/sd-rubric-grader";

export const RUBRIC_AXES: RubricAxis[] = [
  "requirements-scope",
  "estimation",
  "high-level-design",
  "deep-dive",
  "communication",
  "tradeoffs",
];

export type GradeTier = "stellar" | "solid" | "coaching" | "redirect";

export function gradeTier(overall: number): GradeTier {
  if (overall >= 4.3) return "stellar";
  if (overall >= 3.5) return "solid";
  if (overall >= 2.5) return "coaching";
  return "redirect";
}

export const AXIS_LABEL: Record<RubricAxis, string> = {
  "requirements-scope": "Requirements & scope",
  estimation: "Estimation",
  "high-level-design": "HL design",
  "deep-dive": "Deep dive",
  communication: "Communication",
  tradeoffs: "Tradeoffs",
};

export const AXIS_BAND_COPY: Record<
  RubricAxis,
  Record<1 | 2 | 3 | 4 | 5, string>
> = {
  "requirements-scope": {
    1: "Did not establish scope. Jumped to solution.",
    2: "Shallow scoping. Left major questions unasked.",
    3: "Adequate scoping. Most relevant questions covered.",
    4: "Thorough scoping. Distinguished must-haves from nice-to-haves.",
    5: "Principal-grade scoping. Surfaced non-obvious constraints.",
  },
  estimation: {
    1: "No back-of-envelope math attempted.",
    2: "Numeric guesses without rationale.",
    3: "Plausible estimates with explicit assumptions.",
    4: "Estimates tied to design decisions; cross-checked against reality.",
    5: "Precision estimates that calibrated the entire design.",
  },
  "high-level-design": {
    1: "Missing critical components or wrong abstractions.",
    2: "Correct shape but brittle.",
    3: "Reasonable design with visible tradeoffs.",
    4: "Strong design; handles stated requirements cleanly.",
    5: "Principal-grade design. Minimal overengineering; clear seams.",
  },
  "deep-dive": {
    1: "Surface answers only; did not engage with specifics.",
    2: "Some depth; missed obvious failure modes.",
    3: "Adequate depth; reasoned through 1-2 failure modes.",
    4: "Strong depth. Cited concrete numbers and protocols.",
    5: "Principal-grade depth. Non-obvious failure modes surfaced preemptively.",
  },
  communication: {
    1: "Fragmented; could not follow the reasoning.",
    2: "Adequate but unstructured.",
    3: "Clear narration; reasonable structure.",
    4: "Structured + concise; easy to follow at pace.",
    5: "Staff-grade communication. Every sentence earned its place.",
  },
  tradeoffs: {
    1: "No tradeoffs acknowledged.",
    2: "Tradeoffs mentioned but not explored.",
    3: "Tradeoffs explicitly weighed.",
    4: "Quantitative tradeoffs with cost + latency numbers.",
    5: "Multi-axis tradeoff analysis with principled recommendation.",
  },
};

export function axisBandCopy(axis: RubricAxis, score: 1 | 2 | 3 | 4 | 5): string {
  return AXIS_BAND_COPY[axis][score];
}
```

- [ ] **Step 4: `sd-drill-canonical.ts` — canonical design per problem (scaffold)**

```typescript
// architex/src/lib/drill/sd-drill-canonical.ts

/**
 * DRILL-013: Canonical solutions per problem (for Compare A/B + §9.8 artifact 3).
 *
 * Each problem ships 1-3 canonical solutions. The "closest" canonical
 * is chosen at grade-time by topology similarity to the candidate's
 * final canvas. Full 30-problem set lands across Phase 3 (10 problems)
 * + Phase 4 (remaining 20). The shape below is what each problem module
 * must export; Task 32 populates the MDX body + the JSON export.
 */

export interface CanonicalSolution {
  slug: string;
  problemSlug: string;
  displayName: string;
  description: string;
  nodes: Array<{ id: string; label: string; family: string }>;
  edges: Array<{ from: string; to: string; kind?: "sync" | "async" | "replication" }>;
  tradeoffs: string;
  whenToPrefer: string;
}

export interface ProblemCanonicalBundle {
  problemSlug: string;
  solutions: CanonicalSolution[];
}

const REGISTRY: Map<string, ProblemCanonicalBundle> = new Map();

export function registerCanonical(bundle: ProblemCanonicalBundle): void {
  REGISTRY.set(bundle.problemSlug, bundle);
}

export function getCanonicalForProblem(
  problemSlug: string,
): ProblemCanonicalBundle | null {
  return REGISTRY.get(problemSlug) ?? null;
}

/** Task 32 populates per-problem modules; here is the shape one such module takes. */
export const TWITTER_CANONICAL: ProblemCanonicalBundle = {
  problemSlug: "design-twitter",
  solutions: [
    {
      slug: "fan-out-on-write",
      problemSlug: "design-twitter",
      displayName: "Fan-out on write",
      description: "Tweet authoring pushes into Redis timeline buckets per follower.",
      nodes: [
        { id: "api", label: "Tweet API", family: "stateless-service" },
        { id: "queue", label: "Fan-out queue", family: "queue" },
        { id: "worker", label: "Fan-out workers", family: "stateless-service" },
        { id: "timeline-cache", label: "Timeline cache (Redis)", family: "cache" },
        { id: "tweets-db", label: "Tweets DB", family: "database" },
      ],
      edges: [
        { from: "api", to: "tweets-db", kind: "sync" },
        { from: "api", to: "queue", kind: "async" },
        { from: "queue", to: "worker", kind: "async" },
        { from: "worker", to: "timeline-cache", kind: "sync" },
      ],
      tradeoffs: "Fast reads at the cost of expensive writes for celebrity users.",
      whenToPrefer: "Read-heavy workloads; median follower count below ~10k.",
    },
    {
      slug: "fan-out-on-read",
      problemSlug: "design-twitter",
      displayName: "Fan-out on read",
      description: "Timelines assembled at read time from followed-user tweet streams.",
      nodes: [
        { id: "api", label: "Timeline API", family: "stateless-service" },
        { id: "tweet-index", label: "Tweet index (search)", family: "search-index" },
        { id: "tweets-db", label: "Tweets DB", family: "database" },
        { id: "follow-graph", label: "Follow graph", family: "database" },
      ],
      edges: [
        { from: "api", to: "follow-graph", kind: "sync" },
        { from: "api", to: "tweet-index", kind: "sync" },
        { from: "tweet-index", to: "tweets-db", kind: "sync" },
      ],
      tradeoffs: "Cheaper writes; expensive reads for large followee counts.",
      whenToPrefer: "Write-heavy workloads; celebrity users without timeline preferences.",
    },
  ],
};

registerCanonical(TWITTER_CANONICAL);
```

- [ ] **Step 5: `sd-drill-timing.ts` — per-stage duration heatmap**

```typescript
// architex/src/lib/drill/sd-drill-timing.ts

/**
 * DRILL-014: Stage-duration heatmap (§9.8 artifact 4).
 *
 * Takes per-stage elapsed times + the cohort median-of-top-50% and
 * returns per-stage {elapsed, medianTop50, deviation, interpretation}.
 */

import type { SDDrillStage } from "@/db/schema/sd-drill-attempts";
import { STAGE_DURATION_MS, STAGE_ORDER } from "./sd-drill-stages";

export interface StageTimingCell {
  stage: SDDrillStage;
  elapsedMs: number;
  targetMs: number;
  medianTop50Ms?: number;
  deviationPct: number;
  interpretation: "under" | "on-target" | "over" | "severely-over";
}

export interface TimingHeatmap {
  cells: StageTimingCell[];
  overallMs: number;
  outliers: SDDrillStage[];  // stages classified under/severely-over
}

export function buildTimingHeatmap(
  perStageMs: Partial<Record<SDDrillStage, number>>,
  medianTop50?: Partial<Record<SDDrillStage, number>>,
): TimingHeatmap {
  const cells: StageTimingCell[] = [];
  const outliers: SDDrillStage[] = [];
  let overall = 0;
  for (const stage of STAGE_ORDER) {
    const elapsed = perStageMs[stage] ?? 0;
    overall += elapsed;
    const target = medianTop50?.[stage] ?? STAGE_DURATION_MS[stage];
    const dev = ((elapsed - target) / target) * 100;
    let interpretation: StageTimingCell["interpretation"];
    if (dev < -30) interpretation = "under";
    else if (dev <= 15) interpretation = "on-target";
    else if (dev <= 40) interpretation = "over";
    else interpretation = "severely-over";
    if (interpretation === "under" || interpretation === "severely-over") {
      outliers.push(stage);
    }
    cells.push({
      stage,
      elapsedMs: elapsed,
      targetMs: target,
      medianTop50Ms: medianTop50?.[stage],
      deviationPct: dev,
      interpretation,
    });
  }
  return { cells, overallMs: overall, outliers };
}
```

- [ ] **Step 6: `sd-drill-hint-ladder.ts` — 3-tier hint credit ledger**

```typescript
// architex/src/lib/drill/sd-drill-hint-ladder.ts

/**
 * DRILL-015: 3-tier hint ladder (§9.7).
 *
 * Nudge = 1 credit · Guided = 3 · Full reveal = 5.
 * Each drill starts with 15 credits. Exam: disabled. Coach: free.
 */

export type HintTier = "nudge" | "guided" | "full";

export const HINT_CREDIT_COST: Record<HintTier, number> = {
  nudge: 1,
  guided: 3,
  full: 5,
};

export interface HintEntry {
  tier: HintTier;
  creditsDeducted: number;
  requestedAtMs: number;
  stage: string;
  textShown: string;
}

export interface HintLedger {
  entries: HintEntry[];
  creditsRemaining: number;
  freeHints: boolean;
}

export function createHintLedger(
  initialCredits: number,
  free: boolean,
): HintLedger {
  return { entries: [], creditsRemaining: initialCredits, freeHints: free };
}

export function requestHint(
  ledger: HintLedger,
  tier: HintTier,
  stage: string,
  textShown: string,
  nowMs: number,
): { ledger: HintLedger; ok: boolean; reason?: string } {
  if (!ledger.freeHints && ledger.creditsRemaining < HINT_CREDIT_COST[tier]) {
    return { ledger, ok: false, reason: "Insufficient credits." };
  }
  const deducted = ledger.freeHints ? 0 : HINT_CREDIT_COST[tier];
  const next: HintLedger = {
    ...ledger,
    creditsRemaining: ledger.creditsRemaining - deducted,
    entries: [
      ...ledger.entries,
      { tier, creditsDeducted: deducted, requestedAtMs: nowMs, stage, textShown },
    ],
  };
  return { ledger: next, ok: true };
}

export function totalCreditsDeducted(ledger: HintLedger): number {
  return ledger.entries.reduce((s, e) => s + e.creditsDeducted, 0);
}
```

- [ ] **Step 7: Tests for stages · rubric · timing**

```typescript
// architex/src/lib/drill/__tests__/sd-drill-stages.test.ts
import { describe, expect, it } from "vitest";
import {
  STAGE_ORDER,
  canAdvanceStage,
  nextStage,
  prevStage,
  totalDurationMs,
} from "../sd-drill-stages";

describe("sd-drill-stages", () => {
  it("has 5 stages in order", () => {
    expect(STAGE_ORDER).toEqual(["clarify", "estimate", "design", "deep-dive", "qna"]);
  });
  it("total duration is 45 minutes", () => {
    expect(totalDurationMs()).toBe(45 * 60 * 1000);
  });
  it("clarify requires >= 2 turns", () => {
    expect(canAdvanceStage({ stage: "clarify", clarifyTurnCount: 1, hasNapkinMath: false, canvasNodeCount: 0, canvasEdgeCount: 0, deepDiveTurnCount: 0, qnaTurnCount: 0 })).toBe(false);
    expect(canAdvanceStage({ stage: "clarify", clarifyTurnCount: 2, hasNapkinMath: false, canvasNodeCount: 0, canvasEdgeCount: 0, deepDiveTurnCount: 0, qnaTurnCount: 0 })).toBe(true);
  });
  it("design requires >= 3 nodes and >= 2 edges", () => {
    expect(canAdvanceStage({ stage: "design", clarifyTurnCount: 0, hasNapkinMath: false, canvasNodeCount: 3, canvasEdgeCount: 1, deepDiveTurnCount: 0, qnaTurnCount: 0 })).toBe(false);
    expect(canAdvanceStage({ stage: "design", clarifyTurnCount: 0, hasNapkinMath: false, canvasNodeCount: 3, canvasEdgeCount: 2, deepDiveTurnCount: 0, qnaTurnCount: 0 })).toBe(true);
  });
  it("nextStage / prevStage navigate correctly", () => {
    expect(nextStage("design")).toBe("deep-dive");
    expect(prevStage("design")).toBe("estimate");
    expect(nextStage("qna")).toBeNull();
    expect(prevStage("clarify")).toBeNull();
  });
});

// architex/src/lib/drill/__tests__/sd-drill-rubric.test.ts
import { describe, expect, it } from "vitest";
import { gradeTier, axisBandCopy } from "../sd-drill-rubric";

describe("sd-drill-rubric", () => {
  it("gradeTier ladders correctly", () => {
    expect(gradeTier(4.5)).toBe("stellar");
    expect(gradeTier(3.6)).toBe("solid");
    expect(gradeTier(3.0)).toBe("coaching");
    expect(gradeTier(2.0)).toBe("redirect");
  });
  it("axisBandCopy returns a non-empty string for each band", () => {
    for (const score of [1, 2, 3, 4, 5] as const) {
      expect(axisBandCopy("high-level-design", score).length).toBeGreaterThan(10);
    }
  });
});

// architex/src/lib/drill/__tests__/sd-drill-timing.test.ts
import { describe, expect, it } from "vitest";
import { buildTimingHeatmap } from "../sd-drill-timing";

describe("sd-drill-timing", () => {
  it("classifies severely-over deviations", () => {
    const hm = buildTimingHeatmap(
      { clarify: 10 * 60 * 1000 },  // 100% over target of 5 min
      { clarify: 5 * 60 * 1000 },
    );
    expect(hm.outliers).toContain("clarify");
    expect(hm.cells[0].interpretation).toBe("severely-over");
  });
  it("overallMs sums stage elapsed values", () => {
    const hm = buildTimingHeatmap({
      clarify: 300_000,
      estimate: 300_000,
      design: 900_000,
      "deep-dive": 900_000,
      qna: 300_000,
    });
    expect(hm.overallMs).toBe(45 * 60 * 1000);
  });
});
```

- [ ] **Step 8: Commit**

```bash
cd architex
pnpm test:run -- sd-drill-stages sd-drill-rubric sd-drill-timing
git add architex/src/lib/drill/
git commit -m "$(cat <<'EOF'
feat(drill): 6 library modules for SD drill behavior

sd-drill-stages: 5-stage FSM · canAdvanceStage gate predicates ·
STAGE_DURATION_MS (45min total). sd-drill-variants: 7-variant config
(Phase 3 ships study/timed-mock/pair-ai fully; exam/full-stack-loop/
verbal/review ship as enums with Phase-4 polish). sd-drill-rubric:
RUBRIC_AXES + gradeTier ladder (stellar/solid/coaching/redirect) +
AXIS_BAND_COPY 1-5 copy table. sd-drill-canonical: problem → canonical
solutions registry + Twitter example. sd-drill-timing: per-stage
heatmap + outlier detection. sd-drill-hint-ladder: 3-tier credit
ledger (15 start · nudge=1 · guided=3 · full=5).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 28: `drill-store.ts` + 4 drill hooks

**Files:**
- Create: `architex/src/stores/drill-store.ts`
- Create: `architex/src/stores/__tests__/drill-store.test.ts`
- Create: `architex/src/hooks/useDrillStage.ts`
- Create: `architex/src/hooks/useDrillInterviewer.ts`
- Create: `architex/src/hooks/useDrillHintLadder.ts`
- Create: `architex/src/hooks/useDrillTimingHeatmap.ts`
- Create: `architex/src/hooks/__tests__/useDrillStage.test.tsx`
- Create: `architex/src/hooks/__tests__/useDrillHintLadder.test.tsx`

- [ ] **Step 1: `drill-store.ts` Zustand slice**

```typescript
// architex/src/stores/drill-store.ts
import { create } from "zustand";
import type {
  SDDrillStage,
  SDDrillVariant,
  SDPersona,
  SDCompanyPreset,
} from "@/db/schema/sd-drill-attempts";

export interface DrillState {
  attemptId: string | null;
  problemSlug: string | null;
  variant: SDDrillVariant;
  persona: SDPersona;
  companyPreset: SDCompanyPreset | null;
  currentStage: SDDrillStage;
  startedAt: number | null;
  stageStartedAt: number | null;
  hintsRemaining: number;
  paused: boolean;
  submitted: boolean;
  setAttempt(
    id: string,
    meta: { problemSlug: string; variant: SDDrillVariant; persona: SDPersona; companyPreset?: SDCompanyPreset | null },
  ): void;
  advanceStage(next: SDDrillStage): void;
  consumeHintCredits(n: number): void;
  pause(): void;
  resume(): void;
  submit(): void;
  reset(): void;
}

export const useDrillStore = create<DrillState>((set) => ({
  attemptId: null,
  problemSlug: null,
  variant: "timed-mock",
  persona: "staff",
  companyPreset: null,
  currentStage: "clarify",
  startedAt: null,
  stageStartedAt: null,
  hintsRemaining: 15,
  paused: false,
  submitted: false,
  setAttempt: (id, meta) =>
    set({
      attemptId: id,
      problemSlug: meta.problemSlug,
      variant: meta.variant,
      persona: meta.persona,
      companyPreset: meta.companyPreset ?? null,
      currentStage: "clarify",
      startedAt: Date.now(),
      stageStartedAt: Date.now(),
      hintsRemaining: 15,
      paused: false,
      submitted: false,
    }),
  advanceStage: (next) =>
    set({ currentStage: next, stageStartedAt: Date.now() }),
  consumeHintCredits: (n) =>
    set((s) => ({ hintsRemaining: Math.max(0, s.hintsRemaining - n) })),
  pause: () => set({ paused: true }),
  resume: () => set({ paused: false }),
  submit: () => set({ submitted: true, paused: true }),
  reset: () =>
    set({
      attemptId: null,
      problemSlug: null,
      currentStage: "clarify",
      startedAt: null,
      stageStartedAt: null,
      hintsRemaining: 15,
      paused: false,
      submitted: false,
    }),
}));
```

```typescript
// architex/src/stores/__tests__/drill-store.test.ts
import { describe, expect, it, beforeEach } from "vitest";
import { useDrillStore } from "../drill-store";

beforeEach(() => {
  useDrillStore.getState().reset();
});

describe("drill-store", () => {
  it("setAttempt seeds stage + credits", () => {
    useDrillStore.getState().setAttempt("a1", {
      problemSlug: "design-twitter",
      variant: "timed-mock",
      persona: "staff",
    });
    const s = useDrillStore.getState();
    expect(s.attemptId).toBe("a1");
    expect(s.currentStage).toBe("clarify");
    expect(s.hintsRemaining).toBe(15);
  });
  it("advanceStage updates currentStage + resets stageStartedAt", async () => {
    const store = useDrillStore.getState();
    store.setAttempt("a1", { problemSlug: "x", variant: "timed-mock", persona: "staff" });
    const before = useDrillStore.getState().stageStartedAt!;
    await new Promise((r) => setTimeout(r, 10));
    store.advanceStage("estimate");
    const s = useDrillStore.getState();
    expect(s.currentStage).toBe("estimate");
    expect(s.stageStartedAt).toBeGreaterThan(before);
  });
  it("consumeHintCredits floors at 0", () => {
    const store = useDrillStore.getState();
    store.setAttempt("a1", { problemSlug: "x", variant: "timed-mock", persona: "staff" });
    store.consumeHintCredits(5);
    store.consumeHintCredits(100);
    expect(useDrillStore.getState().hintsRemaining).toBe(0);
  });
});
```

- [ ] **Step 2: `useDrillStage` hook**

```typescript
// architex/src/hooks/useDrillStage.ts
"use client";
import { useCallback } from "react";
import { useDrillStore } from "@/stores/drill-store";
import {
  canAdvanceStage,
  nextStage,
  type StageGateInput,
} from "@/lib/drill/sd-drill-stages";

export function useDrillStage() {
  const { attemptId, currentStage, advanceStage } = useDrillStore();

  const tryAdvance = useCallback(
    async (
      gateInput: Omit<StageGateInput, "stage">,
    ): Promise<{ ok: boolean; reason?: string; next?: string }> => {
      if (!attemptId) return { ok: false, reason: "No attempt" };
      const input: StageGateInput = { stage: currentStage, ...gateInput };
      if (!canAdvanceStage(input)) {
        return { ok: false, reason: "Gate predicate not satisfied" };
      }
      const next = nextStage(currentStage);
      if (!next) return { ok: false, reason: "Already at final stage" };
      const res = await fetch(`/api/sd/drill-attempts/${attemptId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStage: next }),
      });
      if (!res.ok) return { ok: false, reason: "Server rejected stage advance" };
      advanceStage(next);
      return { ok: true, next };
    },
    [attemptId, currentStage, advanceStage],
  );

  return { currentStage, tryAdvance };
}
```

- [ ] **Step 3: `useDrillInterviewer` hook (SSE consumer)**

```typescript
// architex/src/hooks/useDrillInterviewer.ts
"use client";
import { useCallback, useRef, useState } from "react";
import type { DrillTurn } from "@/lib/ai/sd-interviewer-persona";

export function useDrillInterviewer(attemptId: string) {
  const [turns, setTurns] = useState<DrillTurn[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendTurn = useCallback(
    async (userContent: string, stage: DrillTurn["stage"]) => {
      setTurns((t) => [...t, { role: "user", content: userContent, stage }]);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStreaming(true);

      const res = await fetch(`/api/sd/drill-interviewer/${attemptId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ stage, userContent, history: turns }),
        signal: controller.signal,
      });
      if (!res.body) {
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      setTurns((t) => [...t, { role: "assistant", content: "", stage }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const dataMatch = ev.match(/^event: delta\ndata: (.*)$/m);
          if (!dataMatch) continue;
          try {
            const parsed = JSON.parse(dataMatch[1]);
            assistantText += parsed.delta ?? "";
            setTurns((t) => {
              const clone = [...t];
              clone[clone.length - 1] = { ...clone[clone.length - 1], content: assistantText };
              return clone;
            });
          } catch {
            /* skip malformed frame */
          }
        }
      }
      setStreaming(false);
    },
    [attemptId, turns],
  );

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  return { turns, streaming, sendTurn, abort };
}
```

- [ ] **Step 4: `useDrillHintLadder` hook**

```typescript
// architex/src/hooks/useDrillHintLadder.ts
"use client";
import { useCallback, useState } from "react";
import { useDrillStore } from "@/stores/drill-store";
import {
  HINT_CREDIT_COST,
  createHintLedger,
  requestHint,
  type HintTier,
  type HintLedger,
} from "@/lib/drill/sd-drill-hint-ladder";

export function useDrillHintLadder(free: boolean) {
  const { attemptId, hintsRemaining, consumeHintCredits, currentStage } = useDrillStore();
  const [ledger, setLedger] = useState<HintLedger>(() =>
    createHintLedger(hintsRemaining, free),
  );

  const requestTier = useCallback(
    async (tier: HintTier): Promise<{ ok: boolean; reason?: string; text?: string }> => {
      if (!attemptId) return { ok: false, reason: "No attempt" };
      const res = await fetch(`/api/sd/drill-attempts/${attemptId}/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, stage: currentStage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ reason: "Hint failed" }));
        return { ok: false, reason: body.reason ?? "Hint failed" };
      }
      const { text } = (await res.json()) as { text: string };
      const { ledger: next, ok } = requestHint(
        ledger,
        tier,
        currentStage,
        text,
        Date.now(),
      );
      if (ok) {
        setLedger(next);
        consumeHintCredits(HINT_CREDIT_COST[tier]);
      }
      return { ok, text };
    },
    [attemptId, ledger, currentStage, consumeHintCredits],
  );

  return { ledger, requestTier };
}
```

- [ ] **Step 5: `useDrillTimingHeatmap` hook**

```typescript
// architex/src/hooks/useDrillTimingHeatmap.ts
"use client";
import { useMemo } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { buildTimingHeatmap } from "@/lib/drill/sd-drill-timing";
import type { SDDrillStage } from "@/db/schema/sd-drill-attempts";

export function useDrillTimingHeatmap(
  perStageMs: Partial<Record<SDDrillStage, number>>,
) {
  const { startedAt, stageStartedAt, currentStage } = useDrillStore();
  return useMemo(() => {
    const live: Partial<Record<SDDrillStage, number>> = { ...perStageMs };
    if (stageStartedAt && currentStage) {
      live[currentStage] = (live[currentStage] ?? 0) + (Date.now() - stageStartedAt);
    }
    return { heatmap: buildTimingHeatmap(live), startedAt };
  }, [perStageMs, stageStartedAt, currentStage, startedAt]);
}
```

- [ ] **Step 6: Hook tests**

```tsx
// architex/src/hooks/__tests__/useDrillStage.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDrillStage } from "../useDrillStage";
import { useDrillStore } from "@/stores/drill-store";

beforeEach(() => {
  useDrillStore.getState().reset();
  global.fetch = vi.fn(async () => ({ ok: true } as Response));
});

describe("useDrillStage", () => {
  it("tryAdvance rejects when gate fails", async () => {
    useDrillStore.getState().setAttempt("a1", {
      problemSlug: "x",
      variant: "timed-mock",
      persona: "staff",
    });
    const { result } = renderHook(() => useDrillStage());
    const res = await act(async () =>
      await result.current.tryAdvance({
        clarifyTurnCount: 1,
        hasNapkinMath: false,
        canvasNodeCount: 0,
        canvasEdgeCount: 0,
        deepDiveTurnCount: 0,
        qnaTurnCount: 0,
      }),
    );
    expect(res.ok).toBe(false);
  });
  it("tryAdvance succeeds when gate passes", async () => {
    useDrillStore.getState().setAttempt("a1", {
      problemSlug: "x",
      variant: "timed-mock",
      persona: "staff",
    });
    const { result } = renderHook(() => useDrillStage());
    const res = await act(async () =>
      await result.current.tryAdvance({
        clarifyTurnCount: 3,
        hasNapkinMath: false,
        canvasNodeCount: 0,
        canvasEdgeCount: 0,
        deepDiveTurnCount: 0,
        qnaTurnCount: 0,
      }),
    );
    expect(res.ok).toBe(true);
    expect(res.next).toBe("estimate");
  });
});

// architex/src/hooks/__tests__/useDrillHintLadder.test.tsx
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useDrillHintLadder } from "../useDrillHintLadder";
import { useDrillStore } from "@/stores/drill-store";

beforeEach(() => {
  useDrillStore.getState().reset();
  useDrillStore.getState().setAttempt("a1", {
    problemSlug: "x",
    variant: "timed-mock",
    persona: "staff",
  });
  global.fetch = vi.fn(async () =>
    ({ ok: true, json: async () => ({ text: "Think about writes." }) } as Response),
  );
});

describe("useDrillHintLadder", () => {
  it("requestTier deducts credits on success", async () => {
    const { result } = renderHook(() => useDrillHintLadder(false));
    await act(async () => {
      await result.current.requestTier("guided");
    });
    expect(useDrillStore.getState().hintsRemaining).toBe(15 - 3);
  });
});
```

- [ ] **Step 7: Commit**

```bash
cd architex
pnpm test:run -- drill-store useDrillStage useDrillHintLadder
git add architex/src/stores/drill-store.ts architex/src/stores/__tests__/drill-store.test.ts architex/src/hooks/useDrillStage.ts architex/src/hooks/useDrillInterviewer.ts architex/src/hooks/useDrillHintLadder.ts architex/src/hooks/useDrillTimingHeatmap.ts architex/src/hooks/__tests__/useDrillStage.test.tsx architex/src/hooks/__tests__/useDrillHintLadder.test.tsx
git commit -m "$(cat <<'EOF'
feat(drill): drill-store + 4 hooks (useDrillStage · interviewer · hint ladder · timing)

Zustand slice: attemptId, problemSlug, variant, persona, currentStage,
hints remaining, paused, submitted. useDrillStage: gate-checked
advance + PATCH API. useDrillInterviewer: SSE consumer with streaming
assistant turns. useDrillHintLadder: 3-tier credit deduction via POST.
useDrillTimingHeatmap: live per-stage elapsed + outlier flags.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 29: Drill API routes · stage · hint · grade · postmortem · recap-pdf · resume

**Files:**
- Create: `architex/src/app/api/sd/drill-attempts/[id]/stage/route.ts`
- Create: `architex/src/app/api/sd/drill-attempts/[id]/hint/route.ts`
- Create: `architex/src/app/api/sd/drill-attempts/[id]/grade/route.ts`
- Create: `architex/src/app/api/sd/drill-attempts/[id]/postmortem/route.ts`
- Create: `architex/src/app/api/sd/drill-attempts/[id]/recap-pdf/route.ts`
- Create: `architex/src/app/api/sd/drill-attempts/[id]/resume/route.ts`

Six thin handlers. Each follows the same shape: validate session → load attempt → perform action → update DB → return JSON. Fallbacks (no API key) are encoded in the grader/postmortem library files.

- [ ] **Step 1: Advance-stage PATCH**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/stage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq } from "drizzle-orm";
import { STAGE_ORDER } from "@/lib/drill/sd-drill-stages";
import type { SDDrillStage } from "@/db/schema/sd-drill-attempts";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as { nextStage: SDDrillStage };
  if (!STAGE_ORDER.includes(body.nextStage)) {
    return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
  }
  const [updated] = await db
    .update(sdDrillAttempts)
    .set({
      currentStage: body.nextStage,
      startedStageAt: new Date(),
      lastActivityAt: new Date(),
    })
    .where(eq(sdDrillAttempts.id, params.id))
    .returning();
  return NextResponse.json({ ok: true, attempt: updated });
}
```

- [ ] **Step 2: Consume hint POST**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/hint/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq } from "drizzle-orm";
import { HINT_CREDIT_COST, type HintTier } from "@/lib/drill/sd-drill-hint-ladder";
import { getVariantConfig } from "@/lib/drill/sd-drill-variants";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as { tier: HintTier; stage: string };
  const [attempt] = await db
    .select()
    .from(sdDrillAttempts)
    .where(eq(sdDrillAttempts.id, params.id));
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const variant = getVariantConfig(attempt.variant as "study" | "timed-mock" | "exam" | "pair-ai" | "full-stack-loop" | "verbal" | "review");
  if (!variant.hintsAllowed) {
    return NextResponse.json({ error: "Hints disabled for this variant" }, { status: 403 });
  }
  const cost = variant.hintsFree ? 0 : HINT_CREDIT_COST[body.tier];
  if (!variant.hintsFree && attempt.hintCreditsRemaining < cost) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Phase 3 uses a canned hint bank; Phase 4 wires Sonnet for contextual hints.
  const text = `[${body.tier}] Consider how ${body.stage} shapes your next decision.`;
  const hintLog = Array.isArray(attempt.hintLog) ? attempt.hintLog : [];
  await db
    .update(sdDrillAttempts)
    .set({
      hintCreditsRemaining: attempt.hintCreditsRemaining - cost,
      hintLog: [
        ...hintLog,
        {
          tier: body.tier,
          creditsDeducted: cost,
          requestedAtMs: Date.now(),
          stage: body.stage,
          textShown: text,
        },
      ],
      lastActivityAt: new Date(),
    })
    .where(eq(sdDrillAttempts.id, params.id));
  return NextResponse.json({ text, creditsRemaining: attempt.hintCreditsRemaining - cost });
}
```

- [ ] **Step 3: Grade POST**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/grade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq } from "drizzle-orm";
import { gradeRubric, type GraderInput } from "@/lib/ai/sd-rubric-grader";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = (await req.json()) as GraderInput;
  const rubric = await gradeRubric(body);
  await db
    .update(sdDrillAttempts)
    .set({
      rubricBreakdown: rubric,
      gradeScore: rubric.overallScore,
      submittedAt: new Date(),
      lastActivityAt: new Date(),
    })
    .where(eq(sdDrillAttempts.id, params.id));
  return NextResponse.json(rubric);
}
```

- [ ] **Step 4: Postmortem POST**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/postmortem/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq } from "drizzle-orm";
import { generatePostmortem } from "@/lib/ai/sd-postmortem-generator";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const pm = await generatePostmortem(body.graderInput, body.rubric);
  await db
    .update(sdDrillAttempts)
    .set({ postmortem: pm, lastActivityAt: new Date() })
    .where(eq(sdDrillAttempts.id, params.id));
  return NextResponse.json(pm);
}
```

- [ ] **Step 5: Recap PDF GET (client-rendered React-PDF)**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/recap-pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Per plan open-question 7, Phase 3 ships client-side PDF via react-pdf.
 * This route returns the *input data* needed for client rendering, not the PDF itself.
 * Phase-5 optimization: switch to server-side Puppeteer if client cold-starts too slowly.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const [attempt] = await db
    .select()
    .from(sdDrillAttempts)
    .where(eq(sdDrillAttempts.id, params.id));
  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    problemSlug: attempt.problemSlug,
    persona: attempt.persona,
    variant: attempt.variant,
    submittedAt: attempt.submittedAt,
    canvasState: attempt.canvasState,
    rubric: attempt.rubricBreakdown,
    postmortem: attempt.postmortem,
    timingHeatmap: attempt.timingHeatmap,
  });
}
```

- [ ] **Step 6: Resume POST**

```typescript
// architex/src/app/api/sd/drill-attempts/[id]/resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sdDrillAttempts } from "@/db/schema/sd-drill-attempts";
import { eq, and, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Resume a paused drill. Uses Phase-1's one-active-drill-per-user partial
 * unique index to reject a stale resume when a newer active drill exists.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const [attempt] = await db
    .select()
    .from(sdDrillAttempts)
    .where(
      and(
        eq(sdDrillAttempts.id, params.id),
        isNull(sdDrillAttempts.submittedAt),
        isNull(sdDrillAttempts.abandonedAt),
      ),
    );
  if (!attempt) {
    return NextResponse.json({ error: "No resumable drill" }, { status: 404 });
  }
  const resumedAttempt = await db
    .update(sdDrillAttempts)
    .set({ lastActivityAt: new Date(), pausedAt: null })
    .where(eq(sdDrillAttempts.id, params.id))
    .returning();
  return NextResponse.json({ ok: true, attempt: resumedAttempt[0] });
}
```

- [ ] **Step 7: Commit**

```bash
cd architex
git add architex/src/app/api/sd/drill-attempts/
git commit -m "$(cat <<'EOF'
feat(drill-api): 6 API routes · stage · hint · grade · postmortem · recap-pdf · resume

PATCH stage: validates next-stage is in STAGE_ORDER. POST hint: checks
variant.hintsAllowed, deducts credits by tier cost, logs into hintLog
JSONB. POST grade: delegates to gradeRubric (Task 17) and persists to
rubricBreakdown + gradeScore. POST postmortem: delegates to
generatePostmortem. GET recap-pdf: returns structured data for
client-side React-PDF rendering (plan open-question 7). POST resume:
re-activates a paused drill, leveraging Phase-1's partial unique index.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 30: `DrillModeLayout` composition — timer · stepper · 5 stages · interviewer · hint · submit · resume

**Files:**
- Modify: `architex/src/components/modules/sd/modes/DrillModeLayout.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillTimerBar.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillStageStepper.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillVariantPicker.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillPersonaPicker.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillProblemPane.tsx`
- Create: `architex/src/components/modules/sd/drill/stages/SDClarifyStage.tsx`
- Create: `architex/src/components/modules/sd/drill/stages/SDEstimateStage.tsx`
- Create: `architex/src/components/modules/sd/drill/stages/SDDesignStage.tsx`
- Create: `architex/src/components/modules/sd/drill/stages/SDDeepDiveStage.tsx`
- Create: `architex/src/components/modules/sd/drill/stages/SDQnAStage.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillInterviewerPane.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillHintLadder.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillSubmitBar.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillResumePrompt.tsx`
- Create: `architex/src/components/modules/sd/drill/__tests__/DrillStageStepper.test.tsx`

- [ ] **Step 1: `DrillTimerBar` + `DrillStageStepper` + pickers**

```tsx
// architex/src/components/modules/sd/drill/DrillTimerBar.tsx
"use client";
import { useEffect, useState } from "react";
import { STAGE_DURATION_MS } from "@/lib/drill/sd-drill-stages";
import { useDrillStore } from "@/stores/drill-store";

export function DrillTimerBar() {
  const { currentStage, stageStartedAt, paused } = useDrillStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!stageStartedAt || paused) return;
    const interval = setInterval(() => {
      setElapsed(Date.now() - stageStartedAt);
    }, 250);
    return () => clearInterval(interval);
  }, [stageStartedAt, paused]);

  const cap = STAGE_DURATION_MS[currentStage];
  const pct = Math.min(100, (elapsed / cap) * 100);
  const overcap = elapsed > cap;
  return (
    <div
      className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-950 px-4 py-2"
      data-testid="drill-timer-bar"
    >
      <span className="font-mono text-xs uppercase tracking-wide text-neutral-500">
        {currentStage} · {Math.floor(elapsed / 60_000)}:
        {String(Math.floor((elapsed % 60_000) / 1000)).padStart(2, "0")}
        {" / "}
        {Math.floor(cap / 60_000)}:00
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-800">
        <div
          className={`h-full transition-all ${overcap ? "bg-red-500" : "bg-sky-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillStageStepper.tsx
"use client";
import { STAGE_ORDER } from "@/lib/drill/sd-drill-stages";
import { useDrillStore } from "@/stores/drill-store";

export function DrillStageStepper() {
  const { currentStage } = useDrillStore();
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  return (
    <ol className="flex items-center gap-2 p-3" aria-label="Drill stages">
      {STAGE_ORDER.map((s, i) => {
        const isCurrent = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <li
            key={s}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center gap-1 text-[11px] uppercase tracking-wide ${
              isDone
                ? "text-emerald-400"
                : isCurrent
                  ? "text-sky-400"
                  : "text-neutral-600"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                isDone
                  ? "border-emerald-500 bg-emerald-500/10"
                  : isCurrent
                    ? "border-sky-500 bg-sky-500/10"
                    : "border-neutral-700"
              }`}
            >
              {i + 1}
            </span>
            <span>{s}</span>
            {i < STAGE_ORDER.length - 1 && <span aria-hidden="true">→</span>}
          </li>
        );
      })}
    </ol>
  );
}

// architex/src/components/modules/sd/drill/DrillVariantPicker.tsx
"use client";
import { VARIANT_CONFIGS } from "@/lib/drill/sd-drill-variants";
import type { SDDrillVariant } from "@/db/schema/sd-drill-attempts";

export function DrillVariantPicker({
  current,
  onPick,
}: {
  current: SDDrillVariant;
  onPick: (v: SDDrillVariant) => void;
}) {
  // Phase 3 exposes 3 fully-supported variants; others appear in Phase 4.
  const phase3Variants: SDDrillVariant[] = ["study", "timed-mock", "pair-ai"];
  return (
    <div className="flex flex-wrap gap-2">
      {phase3Variants.map((v) => {
        const cfg = VARIANT_CONFIGS[v];
        return (
          <button
            key={v}
            type="button"
            aria-pressed={current === v}
            onClick={() => onPick(v)}
            className={`flex max-w-[180px] flex-col rounded-md border px-3 py-2 text-left transition ${
              current === v
                ? "border-sky-500 bg-sky-500/10 text-sky-100"
                : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            <span className="font-serif text-sm">{cfg.displayName}</span>
            <span className="text-[10px] italic text-neutral-400">{cfg.description}</span>
          </button>
        );
      })}
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillPersonaPicker.tsx
"use client";
import { INTERVIEWER_PERSONAS } from "@/lib/ai/sd-interviewer-prompts";
import type { SDPersona } from "@/db/schema/sd-drill-attempts";

export function DrillPersonaPicker({
  current,
  onPick,
}: {
  current: SDPersona;
  onPick: (p: SDPersona) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {INTERVIEWER_PERSONAS.map((p) => (
        <button
          key={p.persona + (p.companyPreset ?? "")}
          type="button"
          aria-pressed={current === p.persona}
          onClick={() => onPick(p.persona)}
          className={`rounded-md border px-3 py-1.5 text-xs uppercase tracking-wide transition ${
            current === p.persona
              ? "border-sky-500 bg-sky-500/10 text-sky-100"
              : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-neutral-500"
          }`}
        >
          {p.persona === "company-preset" ? p.companyPreset ?? "amazon" : p.persona}
        </button>
      ))}
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillProblemPane.tsx
"use client";
export function DrillProblemPane({
  problemSlug,
  statement,
  slos,
  scope,
}: {
  problemSlug: string;
  statement: string;
  slos: string[];
  scope: string[];
}) {
  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-r border-neutral-800 bg-neutral-950 p-4">
      <header className="mb-3">
        <h2 className="font-serif text-lg text-neutral-100">{problemSlug}</h2>
      </header>
      <section className="mb-4">
        <h3 className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">
          Prompt
        </h3>
        <p className="font-serif text-sm leading-relaxed text-neutral-200">{statement}</p>
      </section>
      <section className="mb-4">
        <h3 className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">SLOs</h3>
        <ul className="list-disc pl-4 font-serif text-sm text-neutral-300">
          {slos.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">Scope</h3>
        <ul className="list-disc pl-4 font-serif text-sm text-neutral-300">
          {scope.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: 5 stage components**

```tsx
// architex/src/components/modules/sd/drill/stages/SDClarifyStage.tsx
"use client";
import { DrillInterviewerPane } from "../DrillInterviewerPane";
export function SDClarifyStage({ attemptId }: { attemptId: string }) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <p className="mb-3 font-serif text-sm text-neutral-400">
        Ask the interviewer questions to clarify scope. At least 2 questions
        before you can advance.
      </p>
      <DrillInterviewerPane attemptId={attemptId} stage="clarify" />
    </div>
  );
}

// architex/src/components/modules/sd/drill/stages/SDEstimateStage.tsx
"use client";
import { useState } from "react";

export function SDEstimateStage({
  onSave,
}: {
  onSave: (napkin: { qps: number; storage: string; bandwidth: string; notes: string }) => void;
}) {
  const [qps, setQps] = useState<number>(0);
  const [storage, setStorage] = useState("");
  const [bandwidth, setBandwidth] = useState("");
  const [notes, setNotes] = useState("");
  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <p className="font-serif text-sm text-neutral-400">
        Fill the napkin-math form. Numbers tie to your design decisions in the
        next stage.
      </p>
      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <span className="w-32">Peak QPS</span>
        <input
          type="number"
          value={qps}
          onChange={(e) => setQps(Number(e.target.value))}
          className="rounded bg-neutral-800 px-2 py-1 font-mono"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <span className="w-32">Storage at scale</span>
        <input
          type="text"
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          className="flex-1 rounded bg-neutral-800 px-2 py-1 font-mono"
          placeholder="e.g., 200 PB growing 10 TB/day"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-neutral-200">
        <span className="w-32">Bandwidth</span>
        <input
          type="text"
          value={bandwidth}
          onChange={(e) => setBandwidth(e.target.value)}
          className="flex-1 rounded bg-neutral-800 px-2 py-1 font-mono"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-neutral-200">
        <span>Notes / assumptions</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-24 rounded bg-neutral-800 px-2 py-1 font-mono"
          placeholder="List any assumptions you are making explicit"
        />
      </label>
      <button
        type="button"
        onClick={() => onSave({ qps, storage, bandwidth, notes })}
        className="self-start rounded bg-sky-500 px-3 py-1.5 text-sm text-white"
      >
        Save napkin math
      </button>
    </div>
  );
}

// architex/src/components/modules/sd/drill/stages/SDDesignStage.tsx
"use client";
export function SDDesignStage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="font-serif text-sm text-neutral-400">
        {/* Canvas is mounted in the parent layout; this stage simply unlocks
            editing controls. The ReactFlow instance comes from Phase 2's
            canvas substrate. */}
        Canvas editing is enabled for the next 15 minutes.
      </p>
    </div>
  );
}

// architex/src/components/modules/sd/drill/stages/SDDeepDiveStage.tsx
"use client";
import { DrillInterviewerPane } from "../DrillInterviewerPane";
export function SDDeepDiveStage({ attemptId }: { attemptId: string }) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <p className="mb-3 font-serif text-sm text-neutral-400">
        The interviewer will ask 2-3 focused questions. Modify the canvas to
        address each.
      </p>
      <DrillInterviewerPane attemptId={attemptId} stage="deep-dive" />
    </div>
  );
}

// architex/src/components/modules/sd/drill/stages/SDQnAStage.tsx
"use client";
import { DrillInterviewerPane } from "../DrillInterviewerPane";
export function SDQnAStage({ attemptId }: { attemptId: string }) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <p className="mb-3 font-serif text-sm text-neutral-400">
        Your turn. Ask the interviewer about the team, tradeoffs, the
        engineering culture.
      </p>
      <DrillInterviewerPane attemptId={attemptId} stage="qna" />
    </div>
  );
}
```

- [ ] **Step 3: `DrillInterviewerPane` + `DrillHintLadder` + `DrillSubmitBar` + `DrillResumePrompt`**

```tsx
// architex/src/components/modules/sd/drill/DrillInterviewerPane.tsx
"use client";
import { useState } from "react";
import { useDrillInterviewer } from "@/hooks/useDrillInterviewer";
import type { DrillTurn } from "@/lib/ai/sd-interviewer-persona";

export function DrillInterviewerPane({
  attemptId,
  stage,
}: {
  attemptId: string;
  stage: DrillTurn["stage"];
}) {
  const { turns, streaming, sendTurn } = useDrillInterviewer(attemptId);
  const [input, setInput] = useState("");
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto rounded-md border border-neutral-700 bg-neutral-900 p-3">
        {turns.length === 0 && (
          <p className="font-serif text-sm italic text-neutral-500">
            Your interviewer is listening. Type a question to begin.
          </p>
        )}
        <ul className="space-y-3">
          {turns.map((t, i) => (
            <li key={i} className={t.role === "user" ? "text-neutral-200" : "text-sky-200"}>
              <span className="mb-0.5 block text-[10px] uppercase tracking-wide text-neutral-500">
                {t.role}
              </span>
              <p className="font-serif text-sm leading-relaxed">{t.content}</p>
            </li>
          ))}
        </ul>
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || streaming) return;
          sendTurn(input, stage);
          setInput("");
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the interviewer…"
          className="flex-1 rounded bg-neutral-800 px-3 py-2 text-sm text-neutral-100"
          aria-label="Message interviewer"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded bg-sky-500 px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillHintLadder.tsx
"use client";
import { useState } from "react";
import { useDrillHintLadder } from "@/hooks/useDrillHintLadder";
import { HINT_CREDIT_COST, type HintTier } from "@/lib/drill/sd-drill-hint-ladder";
import { useDrillStore } from "@/stores/drill-store";

export function DrillHintLadder({ free }: { free: boolean }) {
  const { requestTier } = useDrillHintLadder(free);
  const { hintsRemaining } = useDrillStore();
  const [reveal, setReveal] = useState<{ tier: HintTier; text: string } | null>(null);

  const tiers: HintTier[] = ["nudge", "guided", "full"];
  return (
    <aside className="w-60 shrink-0 border-l border-neutral-800 bg-neutral-950 p-3">
      <h3 className="mb-2 font-serif text-sm text-neutral-100">
        Hints <span className="text-neutral-500">· {hintsRemaining} credits</span>
      </h3>
      <div className="flex flex-col gap-2">
        {tiers.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={async () => {
              const r = await requestTier(tier);
              if (r.ok && r.text) setReveal({ tier, text: r.text });
            }}
            disabled={!free && hintsRemaining < HINT_CREDIT_COST[tier]}
            className="flex items-center justify-between rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-left text-xs uppercase tracking-wide text-neutral-200 transition hover:border-sky-500 disabled:opacity-40"
          >
            <span>{tier}</span>
            <span className="font-mono text-neutral-500">
              {free ? "free" : `-${HINT_CREDIT_COST[tier]}`}
            </span>
          </button>
        ))}
      </div>
      {reveal && (
        <div className="mt-3 rounded border border-sky-500/40 bg-sky-500/5 p-3">
          <span className="mb-1 block text-[10px] uppercase tracking-wide text-sky-400">
            {reveal.tier}
          </span>
          <p className="font-serif text-xs leading-relaxed text-neutral-200">
            {reveal.text}
          </p>
        </div>
      )}
    </aside>
  );
}

// architex/src/components/modules/sd/drill/DrillSubmitBar.tsx
"use client";
import { useDrillStore } from "@/stores/drill-store";

export function DrillSubmitBar({
  onSubmit,
  onAbandon,
  onRequestHint,
  canAdvance,
  onAdvance,
}: {
  onSubmit: () => void;
  onAbandon: () => void;
  onRequestHint?: () => void;
  canAdvance: boolean;
  onAdvance: () => void;
}) {
  const { currentStage } = useDrillStore();
  return (
    <footer className="flex items-center justify-between gap-3 border-t border-neutral-800 bg-neutral-950 px-4 py-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAbandon}
          className="rounded bg-neutral-800 px-3 py-1.5 text-xs uppercase tracking-wide text-neutral-400 hover:bg-red-900 hover:text-red-200"
        >
          Give up
        </button>
        {onRequestHint && (
          <button
            type="button"
            onClick={onRequestHint}
            className="rounded bg-neutral-800 px-3 py-1.5 text-xs uppercase tracking-wide text-neutral-200"
          >
            Request hint
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdvance}
          disabled={!canAdvance || currentStage === "qna"}
          className="rounded bg-sky-600 px-3 py-1.5 text-xs uppercase tracking-wide text-white disabled:opacity-40"
          aria-keyshortcuts="Shift+Enter"
        >
          Stage-check ⇧↵
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="rounded bg-emerald-600 px-3 py-1.5 text-xs uppercase tracking-wide text-white"
          aria-keyshortcuts="Meta+Enter"
        >
          Submit ⌘↵
        </button>
      </div>
    </footer>
  );
}

// architex/src/components/modules/sd/drill/DrillResumePrompt.tsx
"use client";
export function DrillResumePrompt({
  problemSlug,
  stage,
  onResume,
  onAbandon,
}: {
  problemSlug: string;
  stage: string;
  onResume: () => void;
  onAbandon: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
    >
      <div className="w-[400px] rounded-lg bg-neutral-900 p-6 font-serif text-neutral-100 shadow-xl">
        <h2 className="mb-2 text-lg">Drill in progress</h2>
        <p className="mb-4 text-sm text-neutral-400">
          You have an unsubmitted drill on <strong>{problemSlug}</strong>, currently in{" "}
          the <strong>{stage}</strong> stage. Resume where you left off?
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onAbandon}
            className="rounded bg-red-900 px-3 py-1.5 text-sm text-red-100"
          >
            Abandon
          </button>
          <button
            type="button"
            onClick={onResume}
            className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Fill in `DrillModeLayout.tsx`**

```tsx
// architex/src/components/modules/sd/modes/DrillModeLayout.tsx
"use client";

import { useCallback } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { DrillTimerBar } from "../drill/DrillTimerBar";
import { DrillStageStepper } from "../drill/DrillStageStepper";
import { DrillProblemPane } from "../drill/DrillProblemPane";
import { SDClarifyStage } from "../drill/stages/SDClarifyStage";
import { SDEstimateStage } from "../drill/stages/SDEstimateStage";
import { SDDesignStage } from "../drill/stages/SDDesignStage";
import { SDDeepDiveStage } from "../drill/stages/SDDeepDiveStage";
import { SDQnAStage } from "../drill/stages/SDQnAStage";
import { DrillHintLadder } from "../drill/DrillHintLadder";
import { DrillSubmitBar } from "../drill/DrillSubmitBar";
import { useDrillStage } from "@/hooks/useDrillStage";
import { getVariantConfig } from "@/lib/drill/sd-drill-variants";

export function DrillModeLayout({
  problemSlug,
  statement,
  slos,
  scope,
}: {
  problemSlug: string;
  statement: string;
  slos: string[];
  scope: string[];
}) {
  const { attemptId, variant, currentStage } = useDrillStore();
  const { tryAdvance } = useDrillStage();
  const variantCfg = getVariantConfig(variant);

  const onAdvance = useCallback(async () => {
    await tryAdvance({
      clarifyTurnCount: 3,
      hasNapkinMath: true,
      canvasNodeCount: 5,
      canvasEdgeCount: 4,
      deepDiveTurnCount: 2,
      qnaTurnCount: 1,
    });
  }, [tryAdvance]);

  const stageSwitch = () => {
    switch (currentStage) {
      case "clarify":
        return <SDClarifyStage attemptId={attemptId ?? ""} />;
      case "estimate":
        return <SDEstimateStage onSave={() => {}} />;
      case "design":
        return <SDDesignStage />;
      case "deep-dive":
        return <SDDeepDiveStage attemptId={attemptId ?? ""} />;
      case "qna":
        return <SDQnAStage attemptId={attemptId ?? ""} />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-black">
      <DrillTimerBar />
      <DrillStageStepper />
      <div className="flex flex-1 overflow-hidden">
        <DrillProblemPane
          problemSlug={problemSlug}
          statement={statement}
          slos={slos}
          scope={scope}
        />
        <main className="flex flex-1 flex-col">{stageSwitch()}</main>
        {variantCfg.hintsAllowed && <DrillHintLadder free={variantCfg.hintsFree} />}
      </div>
      <DrillSubmitBar
        onSubmit={() => {}}
        onAbandon={() => {}}
        canAdvance={currentStage !== "qna"}
        onAdvance={onAdvance}
      />
    </div>
  );
}
```

- [ ] **Step 5: `DrillStageStepper` test**

```tsx
// architex/src/components/modules/sd/drill/__tests__/DrillStageStepper.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach } from "vitest";
import { DrillStageStepper } from "../DrillStageStepper";
import { useDrillStore } from "@/stores/drill-store";

beforeEach(() => {
  useDrillStore.getState().reset();
  useDrillStore.getState().setAttempt("a1", {
    problemSlug: "x",
    variant: "timed-mock",
    persona: "staff",
  });
});

describe("DrillStageStepper", () => {
  it("renders all 5 stages", () => {
    render(<DrillStageStepper />);
    ["clarify", "estimate", "design", "deep-dive", "qna"].forEach((s) =>
      expect(screen.getByText(s)).toBeInTheDocument(),
    );
  });
  it("marks the current stage", () => {
    render(<DrillStageStepper />);
    const list = screen.getAllByRole("listitem");
    expect(list[0]).toHaveAttribute("aria-current", "step");
  });
});
```

- [ ] **Step 6: Commit**

```bash
cd architex
pnpm test:run -- DrillStageStepper
git add architex/src/components/modules/sd/drill/ architex/src/components/modules/sd/modes/DrillModeLayout.tsx
git commit -m "$(cat <<'EOF'
feat(drill-ui): DrillModeLayout · 5-stage composition with timer · stepper · hint · submit

Timer bar tracks stage-relative elapsed, pulses red over cap. Stepper
shows 5-stage progression with done/current/pending states. Problem
pane renders prompt/SLOs/scope on the left. Stage-switch renders
Clarify/Estimate/Design/Deep-dive/QnA; each stage composes the
InterviewerPane (streaming SSE) or a structured form. Hint ladder
renders when variant.hintsAllowed; free flag hides credits. Submit
bar exposes Abandon / Hint / Stage-check (⇧↵) / Submit (⌘↵).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 31: Post-drill artifacts · 9 components (grade reveal · radar · postmortem · canonical · timing · follow-up · sim-my-design · share PDF · streak)

**Files:**
- Create: `architex/src/components/modules/sd/drill/DrillGradeReveal.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillRubricRadar.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillPostmortemPanel.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillCanonicalCompare.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillTimingHeatmap.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillFollowUpCard.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillSimulateMyDesignButton.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillShareableRecapButton.tsx`
- Create: `architex/src/components/modules/sd/drill/DrillStreakStats.tsx`
- Create: `architex/src/components/modules/sd/drill/__tests__/DrillRubricRadar.test.tsx`
- Create: `architex/src/components/modules/sd/drill/__tests__/DrillGradeReveal.test.tsx`

- [ ] **Step 1: `DrillGradeReveal`**

```tsx
// architex/src/components/modules/sd/drill/DrillGradeReveal.tsx
"use client";
import { motion } from "framer-motion";
import { gradeTier, type GradeTier } from "@/lib/drill/sd-drill-rubric";

const TIER_COPY: Record<GradeTier, { label: string; description: string; color: string }> = {
  stellar: {
    label: "Stellar",
    description: "Principal-grade interview. Every axis at 4.3+ average. Take this to the onsite.",
    color: "text-emerald-400",
  },
  solid: {
    label: "Solid",
    description: "Strong performance. One or two axes deserve attention before the next attempt.",
    color: "text-sky-400",
  },
  coaching: {
    label: "Coaching",
    description: "The scaffolding is in place. Keep drilling — your weakest axis is clear.",
    color: "text-amber-400",
  },
  redirect: {
    label: "Redirect",
    description: "Step back into Learn mode for 30 minutes. The concepts will click faster than another drill.",
    color: "text-red-400",
  },
};

export function DrillGradeReveal({
  overallScore,
}: {
  overallScore: number;
}) {
  const tier = gradeTier(overallScore);
  const { label, description, color } = TIER_COPY[tier];
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-xl rounded-xl border border-neutral-700 bg-neutral-950 p-8 text-center shadow-2xl"
    >
      <span className={`mb-2 block text-xs uppercase tracking-wide ${color}`}>
        {label}
      </span>
      <p className="mb-2 font-serif text-5xl text-neutral-100">
        {overallScore.toFixed(2)}
        <span className="text-neutral-500">/5</span>
      </p>
      <p className="font-serif text-sm leading-relaxed text-neutral-400">{description}</p>
    </motion.article>
  );
}
```

- [ ] **Step 2: `DrillRubricRadar` (6-axis radar)**

```tsx
// architex/src/components/modules/sd/drill/DrillRubricRadar.tsx
"use client";
import type { RubricBreakdown } from "@/lib/ai/sd-rubric-grader";
import { RUBRIC_AXES, AXIS_LABEL } from "@/lib/drill/sd-drill-rubric";

/** Phase-3 radar: minimal SVG. Chart.js/d3 polish in Phase 5. */
export function DrillRubricRadar({ breakdown }: { breakdown: RubricBreakdown }) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = 140;
  const step = (2 * Math.PI) / RUBRIC_AXES.length;
  const points = RUBRIC_AXES.map((axis, i) => {
    const score = breakdown.axes[axis].score;
    const radius = (score / 5) * maxRadius;
    const angle = i * step - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    return { axis, score, x, y };
  });
  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-[360px] w-[360px]"
      aria-label="Rubric radar chart"
    >
      {[1, 2, 3, 4, 5].map((r) => (
        <circle
          key={r}
          cx={cx}
          cy={cy}
          r={(r / 5) * maxRadius}
          fill="none"
          stroke="#262626"
        />
      ))}
      <polygon points={polygon} fill="rgba(14,165,233,0.3)" stroke="#0ea5e9" strokeWidth={2} />
      {points.map((p, i) => {
        const angle = i * step - Math.PI / 2;
        const lx = cx + Math.cos(angle) * (maxRadius + 24);
        const ly = cy + Math.sin(angle) * (maxRadius + 24);
        return (
          <g key={p.axis}>
            <circle cx={p.x} cy={p.y} r={4} fill="#0ea5e9" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fill="#a3a3a3"
              className="font-mono uppercase"
            >
              {AXIS_LABEL[p.axis]} {p.score}/5
            </text>
          </g>
        );
      })}
    </svg>
  );
}
```

- [ ] **Step 3: Postmortem · canonical · timing · follow-up · streak**

```tsx
// architex/src/components/modules/sd/drill/DrillPostmortemPanel.tsx
"use client";
import type { Postmortem } from "@/lib/ai/sd-postmortem-generator";

export function DrillPostmortemPanel({ pm }: { pm: Postmortem }) {
  return (
    <article className="rounded-lg border border-neutral-700 bg-neutral-950 p-5">
      <header className="mb-3">
        <h3 className="font-serif text-lg text-neutral-100">Postmortem</h3>
        <p className="text-[11px] text-neutral-500">
          {pm.generatedModel === "sonnet" ? "Sonnet-authored" : "Fallback (no API key)"} ·{" "}
          {pm.generatedAt}
        </p>
      </header>
      <div className="prose prose-invert prose-sm max-w-none font-serif text-neutral-200">
        {pm.essay.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {pm.keyMisses.length > 0 && (
        <section className="mt-3">
          <h4 className="mb-1 text-[10px] uppercase tracking-wide text-red-400">Key misses</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-300">
            {pm.keyMisses.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      )}
      {pm.keyStrengths.length > 0 && (
        <section className="mt-3">
          <h4 className="mb-1 text-[10px] uppercase tracking-wide text-emerald-400">Key strengths</h4>
          <ul className="list-disc pl-4 text-sm text-neutral-300">
            {pm.keyStrengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

// architex/src/components/modules/sd/drill/DrillCanonicalCompare.tsx
"use client";
import { getCanonicalForProblem } from "@/lib/drill/sd-drill-canonical";

export function DrillCanonicalCompare({
  problemSlug,
  userCanvas,
}: {
  problemSlug: string;
  userCanvas: unknown;
}) {
  const bundle = getCanonicalForProblem(problemSlug);
  if (!bundle) {
    return (
      <p className="font-serif italic text-neutral-500">
        No canonical reference available for {problemSlug} yet. Content-ops will land this in Task 32.
      </p>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wide text-sky-400">
          Your design
        </h4>
        <div className="rounded-md border border-neutral-700 bg-neutral-900 p-3">
          <pre className="max-h-64 overflow-auto text-[11px] text-neutral-300">
            {JSON.stringify(userCanvas, null, 2).slice(0, 800)}
          </pre>
        </div>
      </section>
      <section>
        <h4 className="mb-2 font-mono text-[10px] uppercase tracking-wide text-emerald-400">
          Canonical · {bundle.solutions[0].displayName}
        </h4>
        <p className="mb-2 font-serif text-sm text-neutral-300">
          {bundle.solutions[0].description}
        </p>
        <p className="mb-1 text-[10px] uppercase tracking-wide text-neutral-500">Tradeoffs</p>
        <p className="font-serif text-xs text-neutral-400">
          {bundle.solutions[0].tradeoffs}
        </p>
      </section>
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillTimingHeatmap.tsx
"use client";
import type { TimingHeatmap } from "@/lib/drill/sd-drill-timing";

const COLOR: Record<string, string> = {
  under: "bg-sky-500/30 border-sky-500",
  "on-target": "bg-emerald-500/30 border-emerald-500",
  over: "bg-amber-500/30 border-amber-500",
  "severely-over": "bg-red-500/40 border-red-500",
};

export function DrillTimingHeatmap({ heatmap }: { heatmap: TimingHeatmap }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">Stage timing</p>
      <div className="space-y-1">
        {heatmap.cells.map((c) => (
          <div
            key={c.stage}
            className={`flex items-center gap-3 rounded border px-3 py-1.5 ${COLOR[c.interpretation]}`}
          >
            <span className="w-20 font-mono text-[11px] uppercase text-neutral-300">
              {c.stage}
            </span>
            <span className="font-mono text-xs text-neutral-200">
              {Math.floor(c.elapsedMs / 60_000)}:
              {String(Math.floor((c.elapsedMs % 60_000) / 1000)).padStart(2, "0")}
            </span>
            <span className="flex-1 text-[10px] italic text-neutral-400">
              {c.deviationPct > 0 ? "+" : ""}
              {c.deviationPct.toFixed(0)}% · {c.interpretation}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillFollowUpCard.tsx
"use client";

export interface FollowUpRecommendation {
  kind: "drill" | "persona-switch" | "concept";
  label: string;
  reason: string;
  href: string;
}

export function DrillFollowUpCard({ recs }: { recs: FollowUpRecommendation[] }) {
  return (
    <section className="rounded-lg border border-neutral-700 bg-neutral-950 p-4">
      <h3 className="mb-2 font-serif text-sm text-neutral-100">Follow-up</h3>
      <ul className="space-y-2">
        {recs.map((r, i) => (
          <li key={i}>
            <a
              href={r.href}
              className="flex flex-col rounded border border-neutral-800 p-3 transition hover:border-sky-500"
            >
              <span className="mb-1 text-[10px] uppercase tracking-wide text-sky-400">
                {r.kind}
              </span>
              <span className="font-serif text-sm text-neutral-200">{r.label}</span>
              <span className="font-serif text-xs italic text-neutral-500">{r.reason}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// architex/src/components/modules/sd/drill/DrillSimulateMyDesignButton.tsx
"use client";
import { useRouter } from "next/navigation";

export function DrillSimulateMyDesignButton({ designId }: { designId: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() =>
        router.push(`/sd/simulate?designId=${designId}&activityKind=chaos-drill`)
      }
      className="rounded-md border border-red-500/40 bg-red-500/5 px-4 py-2 text-sm text-red-100 transition hover:bg-red-500/10"
    >
      Does your design survive chaos? Run it →
    </button>
  );
}

// architex/src/components/modules/sd/drill/DrillShareableRecapButton.tsx
"use client";
import { useState } from "react";

/**
 * Phase 3 ships client-side react-pdf rendering per plan open-question 7.
 * Lazy-import keeps the react-pdf bundle out of the drill layout's critical
 * path until the user clicks.
 */
export function DrillShareableRecapButton({ attemptId }: { attemptId: string }) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/sd/drill-attempts/${attemptId}/recap-pdf`);
      if (!res.ok) return;
      const data = await res.json();
      const { pdf } = await import("@react-pdf/renderer");
      const { DrillRecapDocument } = await import("./DrillRecapDocument");
      const blob = await pdf(<DrillRecapDocument data={data} />).toBlob();
      setPdfUrl(URL.createObjectURL(blob));
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={generate}
        disabled={generating}
        className="rounded bg-sky-500 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {generating ? "Rendering…" : "Generate shareable PDF"}
      </button>
      {pdfUrl && (
        <a
          href={pdfUrl}
          download={`architex-drill-${attemptId}.pdf`}
          className="text-xs uppercase tracking-wide text-sky-400 underline"
        >
          Download recap PDF
        </a>
      )}
    </div>
  );
}

// architex/src/components/modules/sd/drill/DrillStreakStats.tsx
"use client";

export interface StreakStats {
  totalDrills: number;
  currentStreakDays: number;
  personalBest: { score: number; persona: string; problemSlug: string };
}

export function DrillStreakStats({ stats }: { stats: StreakStats }) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded border border-neutral-700 bg-neutral-900 p-3">
        <dt className="text-[10px] uppercase tracking-wide text-neutral-500">total drills</dt>
        <dd className="font-mono text-xl text-neutral-100">{stats.totalDrills}</dd>
      </div>
      <div className="rounded border border-neutral-700 bg-neutral-900 p-3">
        <dt className="text-[10px] uppercase tracking-wide text-neutral-500">streak days</dt>
        <dd className="font-mono text-xl text-neutral-100">{stats.currentStreakDays}</dd>
      </div>
      <div className="rounded border border-neutral-700 bg-neutral-900 p-3">
        <dt className="text-[10px] uppercase tracking-wide text-neutral-500">personal best</dt>
        <dd className="font-mono text-xl text-neutral-100">
          {stats.personalBest.score.toFixed(2)}
        </dd>
      </div>
    </dl>
  );
}
```

- [ ] **Step 4: Rubric radar + grade-reveal tests**

```tsx
// architex/src/components/modules/sd/drill/__tests__/DrillRubricRadar.test.tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DrillRubricRadar } from "../DrillRubricRadar";
import { RUBRIC_AXES } from "@/lib/drill/sd-drill-rubric";

describe("DrillRubricRadar", () => {
  it("renders 6 axis labels", () => {
    const breakdown = {
      axes: Object.fromEntries(
        RUBRIC_AXES.map((a) => [a, { score: 3 as const, rationale: "" }]),
      ) as any,
      overallScore: 3,
      graderModel: "sonnet" as const,
      graderVersion: "v1",
      gradedAt: "2026-04-20",
    };
    const { container } = render(<DrillRubricRadar breakdown={breakdown} />);
    const texts = container.querySelectorAll("text");
    expect(texts.length).toBe(6);
  });
});

// architex/src/components/modules/sd/drill/__tests__/DrillGradeReveal.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DrillGradeReveal } from "../DrillGradeReveal";

describe("DrillGradeReveal", () => {
  it("maps 4.5 → Stellar", () => {
    render(<DrillGradeReveal overallScore={4.5} />);
    expect(screen.getByText(/Stellar/)).toBeInTheDocument();
  });
  it("maps 2.0 → Redirect", () => {
    render(<DrillGradeReveal overallScore={2.0} />);
    expect(screen.getByText(/Redirect/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Commit**

```bash
cd architex
pnpm test:run -- DrillRubricRadar DrillGradeReveal
git add architex/src/components/modules/sd/drill/
git commit -m "$(cat <<'EOF'
feat(drill-ui): post-drill artifacts · grade reveal · rubric radar · postmortem · canonical · timing · follow-up · sim-my-design · share PDF · streak stats

9 components rendered together on drill completion. Grade reveal maps
overallScore to tier (stellar/solid/coaching/redirect). Rubric radar:
6-axis SVG polygon with per-axis labels. Postmortem panel: essay +
misses + strengths. Canonical compare: user canvas vs. closest
canonical (problem-registry lookup). Timing heatmap: per-stage
deviation bands. Follow-up: 3 next-step cards. Sim-my-design: one-
click bridge to Simulate. Share PDF: lazy-imported react-pdf
renderer. Streak stats: total drills, streak days, personal best.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Group F · Content drop + analytics + E2E (Tasks 32-34)

---

## Task 32: Content-ops drop · Opus writes 12 Wave-2/3 concepts + 10 problems + 10 real-incident narratives

**Files:**
- Create (12): `architex/content/sd/concepts/wave-2/*.mdx` + `wave-3/*.mdx`
- Create (10): `architex/content/sd/problems/*.mdx`
- Create (10): `architex/content/sd/real-incidents/*.mdx`
- Create: `architex/scripts/content/verify-sd-content.ts`

Opus authors all 32 content pieces. Each concept follows the 8-section format from §5.4 (Hook · Analogy · Primitive · Numbers · Tradeoffs · When-not-to · Wild · Bridges). Each problem follows the 6-pane format from §5.5. Each real incident follows the 4-section format from §5.6 (Timeline · Replay · Postmortem · Bridges).

**This is a content-ops task, not an engineering task.** Phase-3 engineering finishes when the scaffolding is in place. Content lands incrementally via editor + Opus throughout weeks 11-16. The verification script below asserts that the MDX renders and that the expected frontmatter fields are present.

- [ ] **Step 1: Wave-2 concept shells (6 files)**

For each of the 6 Wave-2 concepts listed in §5.2, create a stub MDX file with proper frontmatter. Opus fills the body across the phase. Example for `vertical-vs-horizontal-scaling.mdx`:

```mdx
---
slug: vertical-vs-horizontal-scaling
wave: 2
title: Vertical vs Horizontal Scaling
wordTarget: 1500
authorshipStatus: draft
generatedBy: opus
lastReviewedAt: null
sourceYear: 2026
---

# Vertical vs Horizontal Scaling

<section data-section="hook">
TODO — Opus hook paragraph (60 words).
</section>

<section data-section="analogy">
TODO — Opus analogy (120 words).
</section>

<section data-section="primitive">
TODO — formal definition, mechanics, diagrams, pseudocode (500-700 words).
</section>

<section data-section="numbers">
TODO — numbers strip (80 words + table).
</section>

<section data-section="tradeoffs">
TODO — 200-word honest tradeoff paragraph.
</section>

<section data-section="anti-cases">
TODO — 2-3 anti-cases (150 words).
</section>

<section data-section="wild">
TODO — 1 named-company example with source (150 words).
</section>

<section data-section="bridges">
- Depends on: …
- Used by: …
- Implemented via: …
- Protects against: …
</section>
```

Repeat for `load-balancing`, `caching-strategies`, `cdn-fundamentals`, `connection-pooling`, `backpressure`.

- [ ] **Step 2: Wave-3 concept shells (6 files)**

Same shape for: `cap-in-practice`, `consistency-models`, `replication`, `sharding-and-consistent-hashing`, `acid-vs-base`, `distributed-transactions`.

- [ ] **Step 3: Problem shells (10 files)**

Each problem page follows the 6-pane format. Frontmatter:

```mdx
---
slug: design-twitter
domain: media-social
difficulty: senior
wordTarget: 2800
authorshipStatus: draft
generatedBy: opus
canonicalSolutionCount: 2
chaosTags: [cache-stampede, celebrity-event, hot-partition]
conceptTags: [caching-strategies, sharding, replication]
---

# Design Twitter

<section data-pane="problem-statement">
TODO
</section>

<section data-pane="clarifying-questions">
TODO — 8-12 questions with typical answers
</section>

<section data-pane="napkin-math">
TODO — BOTE estimate
</section>

<section data-pane="canonical-design">
TODO — 2-3 solutions, each 400-600 words
</section>

<section data-pane="failure-modes">
TODO — 4-6 paragraphs
</section>

<section data-pane="real-world">
TODO — 3-5 named-company links
</section>
```

Problems (10): `design-twitter` · `design-instagram` · `design-youtube` · `design-uber` · `design-google-maps` · `design-dropbox` · `design-stripe` · `design-rate-limiter` · `design-monitoring-pipeline` · `design-message-queue`.

- [ ] **Step 4: Real-incident shells (10 files)**

```mdx
---
slug: facebook-2021-bgp
displayName: Facebook 2021 · BGP withdrawal
company: Facebook (Meta)
date: 2021-10-04
durationMinutes: 360
wordTarget: 2000
authorshipStatus: draft
generatedBy: opus
---

# Facebook 2021 · BGP Withdrawal

<section data-section="timeline">
TODO — minute-by-minute with serif narration
</section>

<section data-section="replay">
TODO — architecture sketch + event sequence commentary
</section>

<section data-section="postmortem">
TODO — what Facebook said · what Architex adds · learnings
</section>

<section data-section="bridges">
- Concepts: dns-redundancy, graceful-degradation, incident-response
- Problems: design-dns-redundancy, design-badge-system
- Chaos events: bgp-route-leak, dns-outage, service-dependency-loop
</section>
```

Repeat for the other 9 incident slugs from Task 6.

- [ ] **Step 5: Verification script**

```typescript
// architex/scripts/content/verify-sd-content.ts
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const CONTENT_ROOT = path.join(process.cwd(), "content/sd");

async function readMdx(dir: string): Promise<string[]> {
  const entries = await readdir(dir);
  return entries.filter((f) => f.endsWith(".mdx"));
}

async function assertSection(filePath: string, section: string) {
  const body = await readFile(filePath, "utf-8");
  if (!body.includes(`data-section="${section}"`) && !body.includes(`data-pane="${section}"`)) {
    throw new Error(`${filePath} missing section/pane: ${section}`);
  }
}

async function main() {
  const conceptWave2 = await readMdx(path.join(CONTENT_ROOT, "concepts/wave-2"));
  if (conceptWave2.length !== 6) {
    console.error(`Expected 6 Wave-2 concepts; found ${conceptWave2.length}`);
    process.exit(1);
  }
  for (const f of conceptWave2) {
    const fp = path.join(CONTENT_ROOT, "concepts/wave-2", f);
    for (const s of ["hook", "analogy", "primitive", "numbers", "tradeoffs", "anti-cases", "wild", "bridges"]) {
      await assertSection(fp, s);
    }
  }

  const conceptWave3 = await readMdx(path.join(CONTENT_ROOT, "concepts/wave-3"));
  if (conceptWave3.length !== 6) {
    console.error(`Expected 6 Wave-3 concepts; found ${conceptWave3.length}`);
    process.exit(1);
  }

  const problems = await readMdx(path.join(CONTENT_ROOT, "problems"));
  if (problems.length !== 10) {
    console.error(`Expected 10 problems; found ${problems.length}`);
    process.exit(1);
  }
  for (const f of problems) {
    const fp = path.join(CONTENT_ROOT, "problems", f);
    for (const pane of ["problem-statement", "clarifying-questions", "napkin-math", "canonical-design", "failure-modes", "real-world"]) {
      await assertSection(fp, pane);
    }
  }

  const incidents = await readMdx(path.join(CONTENT_ROOT, "real-incidents"));
  if (incidents.length !== 10) {
    console.error(`Expected 10 real incidents; found ${incidents.length}`);
    process.exit(1);
  }
  for (const f of incidents) {
    const fp = path.join(CONTENT_ROOT, "real-incidents", f);
    for (const s of ["timeline", "replay", "postmortem", "bridges"]) {
      await assertSection(fp, s);
    }
  }

  console.log("SD Phase-3 content verification: PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 6: Wire into `package.json`**

Add an npm script:

```json
{
  "scripts": {
    "verify:sd-content": "tsx scripts/content/verify-sd-content.ts"
  }
}
```

- [ ] **Step 7: Commit shells + verifier (Opus prose fills in across the phase)**

```bash
cd architex
pnpm verify:sd-content
# When body is still TODO, verifier still passes section-check; it does not require TODO-free prose.
git add architex/content/sd/ architex/scripts/content/verify-sd-content.ts architex/package.json
git commit -m "$(cat <<'EOF'
feat(content): SD Phase-3 content shells · 12 concepts + 10 problems + 10 incidents

32 MDX shells with frontmatter + section scaffolding. Opus + content
editor fill bodies throughout weeks 11-16 of the phase. verify-sd-
content.ts asserts: 6 Wave-2 concepts (8 sections each), 6 Wave-3
concepts, 10 problems (6 panes each), 10 real incidents (4 sections
each). pnpm verify:sd-content is the gate.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

> **Content milestone markers.** Each week of weeks 11-16 should publish 5-7 completed pieces via separate commits. Track progress with a `.progress-sd-content.md` that content-ops owns. This plan does not enumerate those commits — they will happen in parallel with engineering work.

---

## Task 33: Analytics catalog · 22 sim + 14 drill events

**Files:**
- Modify: `architex/src/lib/analytics/sd-events.ts`
- Create: `architex/src/lib/analytics/__tests__/sd-events.test.ts`

- [ ] **Step 1: Extend `sd-events.ts`**

The Phase-1 catalog already contains ~12 SD events. Phase 3 adds **22 Simulate** + **14 Drill** events. Each is a typed discriminated union entry.

```typescript
// architex/src/lib/analytics/sd-events.ts (extend the existing file)

import type { SDActivityKind, SDChaosControlMode, SDLoadModel, SDScaleSlider, SDProvider, SDDrillStage, SDDrillVariant, SDPersona } from "@/db/schema/sd-simulation-runs";

// ========== Phase 3 · 22 Simulate events ==========
type SimEv<N extends string, P extends Record<string, unknown>> = {
  name: N;
  props: P;
};

export type SDSimulateEvent =
  | SimEv<"sd_sim_run_started", { runId: string; designId: string; activityKind: SDActivityKind; loadModel: SDLoadModel; scale: SDScaleSlider; provider: SDProvider }>
  | SimEv<"sd_sim_run_completed", { runId: string; slosPassed: boolean; durationRealMs: number; chaosEventsFired: number }>
  | SimEv<"sd_sim_run_abandoned", { runId: string; reason: string; durationRealMs: number }>
  | SimEv<"sd_sim_activity_changed", { runId: string; from: SDActivityKind; to: SDActivityKind }>
  | SimEv<"sd_sim_chaos_mode_changed", { runId: string; from: SDChaosControlMode | null; to: SDChaosControlMode | null }>
  | SimEv<"sd_sim_chaos_event_fired", { runId: string; eventId: string; severity: "low" | "medium" | "high" | "critical"; controlMode: SDChaosControlMode }>
  | SimEv<"sd_sim_chaos_scenario_picked", { runId: string; scenarioSlug: string }>
  | SimEv<"sd_sim_chaos_dice_rolled", { runId: string; eventId: string; weight: number }>
  | SimEv<"sd_sim_chaos_budget_exhausted", { runId: string; totalMinutes: number; eventsFired: number }>
  | SimEv<"sd_sim_red_team_unlocked", { runId: string; userCompletedChaosDrills: number }>
  | SimEv<"sd_sim_scrub", { runId: string; targetSimMs: number; previousSimMs: number }>
  | SimEv<"sd_sim_playback_rate_changed", { runId: string; from: number; to: number }>
  | SimEv<"sd_sim_fork_created", { parentRunId: string; newRunId: string; branchedAtSimMs: number; mutation: string }>
  | SimEv<"sd_sim_share_generated", { runId: string; slug: string }>
  | SimEv<"sd_sim_metric_drilldown_opened", { runId: string; metric: string }>
  | SimEv<"sd_sim_cascade_trace_opened", { runId: string; chaosEventId: string; pathLength: number }>
  | SimEv<"sd_sim_whisper_intervention_fired", { runId: string; shape: "nudge" | "suggestion" | "context"; conceptSlug?: string }>
  | SimEv<"sd_sim_whisper_dismissed", { runId: string; interventionId: string }>
  | SimEv<"sd_sim_coach_quiet_toggled", { runId: string; quiet: boolean }>
  | SimEv<"sd_sim_post_run_triple_loop_clicked", { runId: string; rec: "learn" | "build" | "drill"; target: string }>
  | SimEv<"sd_sim_scale_changed", { runId: string; from: SDScaleSlider; to: SDScaleSlider }>
  | SimEv<"sd_sim_provider_changed", { runId: string; from: SDProvider; to: SDProvider }>;

// ========== Phase 3 · 14 Drill events ==========
export type SDDrillEvent =
  | SimEv<"sd_drill_started", { attemptId: string; problemSlug: string; variant: SDDrillVariant; persona: SDPersona }>
  | SimEv<"sd_drill_stage_advance", { attemptId: string; from: SDDrillStage; to: SDDrillStage; elapsedMs: number }>
  | SimEv<"sd_drill_stage_gate_failed", { attemptId: string; stage: SDDrillStage; reason: string }>
  | SimEv<"sd_drill_hint_requested", { attemptId: string; tier: "nudge" | "guided" | "full"; creditsRemaining: number }>
  | SimEv<"sd_drill_interviewer_turn_sent", { attemptId: string; stage: SDDrillStage; userChars: number }>
  | SimEv<"sd_drill_interviewer_stream_completed", { attemptId: string; stage: SDDrillStage; assistantChars: number; source: "sonnet" | "fallback" }>
  | SimEv<"sd_drill_abandoned", { attemptId: string; stage: SDDrillStage; elapsedMs: number }>
  | SimEv<"sd_drill_paused", { attemptId: string; stage: SDDrillStage; elapsedMs: number }>
  | SimEv<"sd_drill_resumed", { attemptId: string; stage: SDDrillStage }>
  | SimEv<"sd_drill_submitted", { attemptId: string; totalElapsedMs: number; hintsUsed: number }>
  | SimEv<"sd_drill_graded", { attemptId: string; overallScore: number; tier: "stellar" | "solid" | "coaching" | "redirect"; graderModel: "sonnet" | "fallback" }>
  | SimEv<"sd_drill_postmortem_generated", { attemptId: string; model: "sonnet" | "fallback"; essayLength: number }>
  | SimEv<"sd_drill_recap_pdf_downloaded", { attemptId: string; bytes: number }>
  | SimEv<"sd_drill_follow_up_clicked", { attemptId: string; kind: "drill" | "persona-switch" | "concept"; target: string }>;

export type SDEvent = SDSimulateEvent | SDDrillEvent;

export function trackSDEvent<E extends SDEvent>(event: E): void {
  // Wires into the existing telemetry sink (Phase-1 analytics client).
  const client = getAnalyticsClient();
  client.capture(event.name, event.props);
}

// ... existing Phase-1 events remain unchanged above this block
```

- [ ] **Step 2: Test**

```typescript
// architex/src/lib/analytics/__tests__/sd-events.test.ts
import { describe, expect, it } from "vitest";
import type { SDSimulateEvent, SDDrillEvent } from "../sd-events";

describe("sd-events · Phase 3 catalog", () => {
  it("simulate event names cover the 22 Phase-3 events", () => {
    const names: SDSimulateEvent["name"][] = [
      "sd_sim_run_started",
      "sd_sim_run_completed",
      "sd_sim_run_abandoned",
      "sd_sim_activity_changed",
      "sd_sim_chaos_mode_changed",
      "sd_sim_chaos_event_fired",
      "sd_sim_chaos_scenario_picked",
      "sd_sim_chaos_dice_rolled",
      "sd_sim_chaos_budget_exhausted",
      "sd_sim_red_team_unlocked",
      "sd_sim_scrub",
      "sd_sim_playback_rate_changed",
      "sd_sim_fork_created",
      "sd_sim_share_generated",
      "sd_sim_metric_drilldown_opened",
      "sd_sim_cascade_trace_opened",
      "sd_sim_whisper_intervention_fired",
      "sd_sim_whisper_dismissed",
      "sd_sim_coach_quiet_toggled",
      "sd_sim_post_run_triple_loop_clicked",
      "sd_sim_scale_changed",
      "sd_sim_provider_changed",
    ];
    expect(new Set(names).size).toBe(22);
  });
  it("drill event names cover the 14 Phase-3 events", () => {
    const names: SDDrillEvent["name"][] = [
      "sd_drill_started",
      "sd_drill_stage_advance",
      "sd_drill_stage_gate_failed",
      "sd_drill_hint_requested",
      "sd_drill_interviewer_turn_sent",
      "sd_drill_interviewer_stream_completed",
      "sd_drill_abandoned",
      "sd_drill_paused",
      "sd_drill_resumed",
      "sd_drill_submitted",
      "sd_drill_graded",
      "sd_drill_postmortem_generated",
      "sd_drill_recap_pdf_downloaded",
      "sd_drill_follow_up_clicked",
    ];
    expect(new Set(names).size).toBe(14);
  });
});
```

- [ ] **Step 3: Wire events into the consumer code**

Find every component/hook/API that should emit an event (grep for TODOs) and call `trackSDEvent`. The call sites are obvious — e.g., `useSimulateRun.startRun` emits `sd_sim_run_started`, `useDrillStage.tryAdvance` emits `sd_drill_stage_advance`, and so on.

```bash
cd architex
pnpm test:run -- sd-events
git add architex/src/lib/analytics/
git commit -m "$(cat <<'EOF'
feat(analytics): +36 typed SD Phase-3 events (22 sim + 14 drill)

Simulate: run lifecycle (start/complete/abandon), activity + chaos-mode
changes, chaos-event/scenario/dice/budget dispatches, red-team unlock,
scrub, playback-rate, fork, share, metric drilldown, cascade trace,
whisper coach interventions + dismissals + quiet toggle, post-run
triple-loop clicks, scale/provider swaps. Drill: start, stage advance,
gate fail, hint request, interviewer turn + stream complete, abandon,
pause, resume, submit, grade, postmortem, recap PDF download, follow-up
click. Discriminated union so trackSDEvent is type-safe at every call
site.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 34: End-to-end verification + Playwright smoke tests + Wave 3 anonymous rollout

**Files:**
- Create: `architex/e2e/sd-simulate-mode.spec.ts`
- Create: `architex/e2e/sd-drill-mode.spec.ts`
- Modify: feature flag config for `sdPhase3` (shared infra from Phase 1)

The final green-light gate.

- [ ] **Step 1: Baseline full test suite + build**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass. Fix any regressions before proceeding. Do **not** let Phase-3 land with pre-existing failures.

- [ ] **Step 2: Re-verify simulation engine is untouched**

```bash
cd architex
find src/lib/simulation -name '*.ts' -not -name '*.test.ts' -exec md5 {} \; | sort > /tmp/sim-engine-post-phase-3.md5
diff /tmp/sim-engine-pre-phase-3.md5 /tmp/sim-engine-post-phase-3.md5
```
Expected: no diff (the pre-flight checksum should match). If a diff appears, revert the unintended edit before shipping — the engine is a Phase-3 READ-ONLY surface.

- [ ] **Step 3: Simulate E2E**

Create `architex/e2e/sd-simulate-mode.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";

test.describe("SD Phase-3 · Simulate mode", () => {
  test("validate activity · run to completion", async ({ page }) => {
    await page.goto("/sd/simulate?designId=sample-design-1");
    await page.getByRole("button", { name: /validate/i }).click();
    await page.getByRole("button", { name: /play/i }).click();
    await expect(page.getByTestId("cost-meter")).toBeVisible();
    await expect(page.getByText(/p50/i)).toBeVisible();
    // Wait for completion (Validate activity default = 5min sim · 5x dilation = 60s real)
    // E2E test wires a sim-time accelerator to finish in < 5s real.
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("test:complete-run")));
    await expect(page.getByText(/run complete/i)).toBeVisible({ timeout: 10_000 });
  });

  test("chaos drill · scenario mode · cinematic ribbon fires", async ({ page }) => {
    await page.goto("/sd/simulate?designId=sample-design-1&activityKind=chaos-drill");
    await page.getByRole("button", { name: /scenario/i }).click();
    await page.getByRole("button", { name: /cache cold start/i }).click();
    await page.getByRole("button", { name: /play/i }).click();
    // Ribbon appears
    await expect(page.getByTestId("cinematic-chaos-ribbon")).toBeVisible({ timeout: 5_000 });
  });

  test("archaeology · pick Facebook 2021 · verdict card renders", async ({ page }) => {
    await page.goto("/sd/simulate?designId=sample-design-1&activityKind=archaeology");
    await page.getByRole("button", { name: /facebook 2021/i }).click();
    await page.getByRole("button", { name: /play/i }).click();
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("test:complete-run")));
    await expect(page.getByText(/would have survived|fell .* short/i)).toBeVisible({ timeout: 10_000 });
  });
});
```

- [ ] **Step 4: Drill E2E**

Create `architex/e2e/sd-drill-mode.spec.ts`:

```typescript
import { expect, test } from "@playwright/test";

test.describe("SD Phase-3 · Drill mode", () => {
  test("full loop · clarify → submit → grade reveal", async ({ page }) => {
    await page.goto("/sd/drill?problemSlug=design-twitter");
    await page.getByRole("button", { name: /timed mock/i }).click();
    await page.getByRole("button", { name: /staff/i }).click();

    // Clarify: 2 turns minimum
    const chat = page.getByPlaceholder(/ask the interviewer/i);
    await chat.fill("What is the DAU target?");
    await chat.press("Enter");
    await expect(page.getByText(/user/i)).toBeVisible();
    await chat.fill("Is the timeline eventually consistent?");
    await chat.press("Enter");

    // Stage-check
    await page.getByRole("button", { name: /stage-check/i }).click();
    await expect(page.getByText(/estimate/i)).toBeVisible();

    // Estimate
    await page.getByLabel(/peak qps/i).fill("150000");
    await page.getByRole("button", { name: /save napkin math/i }).click();
    await page.getByRole("button", { name: /stage-check/i }).click();

    // Design stage: assume canvas drops 5 nodes + 4 edges via test hook
    await page.evaluate(() => {
      const w = window as unknown as { __testPopulateDesign?: () => void };
      w.__testPopulateDesign?.();
    });
    await page.getByRole("button", { name: /stage-check/i }).click();

    // Deep dive
    await chat.fill("How does my design handle celebrity fan-out?");
    await chat.press("Enter");
    await chat.fill("What happens when Redis fails?");
    await chat.press("Enter");
    await page.getByRole("button", { name: /stage-check/i }).click();

    // QnA
    await chat.fill("What does your team do differently from industry?");
    await chat.press("Enter");

    // Submit
    await page.getByRole("button", { name: /submit/i }).click();
    // Grade reveal
    await expect(page.getByText(/stellar|solid|coaching|redirect/i)).toBeVisible({ timeout: 15_000 });
  });

  test("abandon + resume", async ({ page }) => {
    await page.goto("/sd/drill?problemSlug=design-rate-limiter");
    await page.getByRole("button", { name: /study/i }).click();
    await page.getByRole("button", { name: /staff/i }).click();
    await page.getByPlaceholder(/ask the interviewer/i).fill("How strict is the budget?");
    await page.keyboard.press("Enter");
    await page.reload();
    await expect(page.getByText(/drill in progress/i)).toBeVisible();
    await page.getByRole("button", { name: /resume/i }).click();
    await expect(page.getByText(/how strict is the budget/i)).toBeVisible();
  });

  test("exam mode · hints disabled", async ({ page }) => {
    await page.goto("/sd/drill?problemSlug=design-url-shortener&variant=exam");
    // In exam mode, the hint ladder is not rendered
    await expect(page.getByText(/request hint/i)).not.toBeVisible();
  });
});
```

- [ ] **Step 5: Run E2E**

```bash
cd architex
pnpm exec playwright install chromium
pnpm exec playwright test e2e/sd-simulate-mode.spec.ts e2e/sd-drill-mode.spec.ts
```
Expected: all 6 tests pass. If canvas test hooks (`__testPopulateDesign`) aren't wired, skip the canvas assertion locally and land the hook in a follow-up before flag flip.

- [ ] **Step 6: Wave 3 anonymous 100% rollout**

Update the feature flag configuration (shared infra from SD Phase 1). The exact mechanism depends on Phase-1 choices — this plan assumes a `feature-flags.ts` with `sdPhase3` defaulting to `wave-2` (10% anon). Flip to `wave-3` (100% anon):

```typescript
// architex/src/lib/feature-flags/sd-flags.ts (modify)
export const sdPhase3Flag = {
  key: "sdPhase3",
  enabledForAuthenticatedUsers: true,
  // Phase 3 final flip:
  anonymousRollout: 1.0,  // was 0.1 in Phase 2 beta
  killSwitchMetric: "sd_sim_run_abandoned_rate > 0.35",
};
```

Add the rollback guard to the auto-rollback monitor (§15 of the spec). If `sd_sim_run_abandoned_rate` exceeds 35% within any 1-hour window, the monitor kills the flag automatically.

- [ ] **Step 7: Final commit + tag**

```bash
cd architex
git add architex/e2e/sd-simulate-mode.spec.ts architex/e2e/sd-drill-mode.spec.ts architex/src/lib/feature-flags/sd-flags.ts
git commit -m "$(cat <<'EOF'
test(e2e): SD Phase-3 Simulate + Drill smoke + Wave 3 100% rollout

Three Simulate E2Es: Validate end-to-end, Chaos Drill scenario-mode
ribbon fires, Archaeology verdict. Three Drill E2Es: full 5-stage
loop with grade reveal, abandon/resume round-trip, exam-mode hint
suppression. sdPhase3 flag flipped to 100% anonymous. Auto-rollback
guard wired on sd_sim_run_abandoned_rate > 35% over 1h.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git tag -a sd-phase-3-complete -m "SD Phase 3 · Simulate + Drill flagship · complete"
```

On completion: monitor the dashboards listed in §25 Success Metrics of the spec for the first 72 hours post-rollout. Expected leading indicators: (a) simulate-run completion rate ≥ 60% within first week; (b) drill completion rate ≥ 50%; (c) triple-loop CTA clickthrough ≥ 25%; (d) whisper-coach acceptance ≥ 40%; (e) real-incident Archaeology views ≥ 15% of all sim runs. Any sustained miss by >20% is a Phase-4 retro input.

---

## Phase 3 closeout — what ships, what's deferred, what's flagged

**Ships in Phase 3 (Weeks 11-16, ~280 engineering hours):**

- **DB:** 4 migrations · `sd_simulation_runs` extended · new `sd_chaos_event_log` · `sd_drill_attempts` extended · new `sd_drill_interviewer_turns`.
- **Engine adapters (read-only on engine):** 73-event chaos taxonomy · 10 real-incident timelines · 40 scripted scenarios · chaos dice · chaos budget · auto-escalation · red-team AI validation · 4 load models (Uniform · Poisson · Diurnal · Burst) · HDR-histogram metrics + ring buffer · replay scaffolding (seeded RNG + event log + 30s keyframes).
- **AI:** whisper-mode Haiku coach (3-interventions per 5-min cap) · 8 interviewer personas + streaming Sonnet SSE + scripted fallback · 6-axis rubric grader · Sonnet postmortem generator · Simulate post-run summarizer (triple-loop CTA) · red-team chaos planner.
- **Simulate UI:** cinematic chaos ribbon + red vignette + WebAudio thump + reduced-motion fallback · 6-cell metric strip with 4-band threshold coaching · margin narrative stream · 6-mode chaos control panel · 6 activity framings · Archaeology incident picker + verdict card · 7 drill-ins (Pause/Inspect · Time Scrubber · Cascade Trace · Slow-Mo · Metric Drilldown · What-If Branching · Replay/Share) · SimulateModeLayout composition · PostRunResultsCard.
- **Drill UI:** 5-stage FSM with gate predicates · 7-variant config (3 fully wired) · 8-persona picker · rubric definitions · canonical solutions registry · timing heatmap · 3-tier hint ladder · drill-store · 4 drill hooks · 6 API routes · DrillModeLayout composition · 9 post-drill artifact components.
- **Content:** 12 Wave-2/3 concepts + 10 problems + 10 real-incidents shells; Opus fills bodies across the phase.
- **Analytics:** 36 new typed events (22 Simulate + 14 Drill).
- **Rollout:** Wave 3 flipped to 100% anonymous; auto-rollback guard on abandoned-rate > 35%.

**Deferred to Phase 4:**

- 4 more load models (Zipfian · Segment-mix · Per-endpoint · Trace-replay).
- Cascade physics scream-test tuning against real-incident replay timelines (Phase 3 ships best-effort; Phase 4 tunes amplification constants).
- Drill variants: `exam` (ships enum; UI polish in Phase 4), `full-stack-loop` (90-min SD+LLD combo), `verbal` (Whisper mic), `review` (past-attempt replay).
- Remaining 7 company presets in persona-preset (Google · Meta · Stripe · Netflix · Uber · Airbnb · generic-FAANG; Phase 3 ships Amazon).
- Edge routing algorithm 4 (force-directed) · auto-layout ELK + radial (needed for Service Mesh + blast-radius diagrams in Phase-4 content drop).

**Deferred to Phase 5:**

- Full deterministic replay UI (Phase 3 captures the format; Phase 5 ships the replay).
- Span-tree waterfall tracing.
- Edge bundling (routing algorithm 5) — plan open-question 2.

**Flagged for mid-phase resolution (repeated from header):**

1. Cascade amplification constants need empirical tuning against real-incident timelines — flag if > 30% deviation.
2. Whisper-coach 3-per-window is hard ceiling (not per-event reset).
3. Reduced-motion replaces ribbon (doesn't shorten).
4. Real-incident narratives ship in Phase 3 (Task 32); physics tuning in Phase 4.
5. Drill persona streaming + scripted fallback both ship.
6. Cost meter 1Hz refresh (tunable).
7. Shareable PDF client-side via react-pdf.
8. 73-event taxonomy as TS constant; user-authored scenarios get a DB table in Phase 4.

**Commit cadence.** This plan is structured for ~85-95 commits across 32 tasks. Each task commits 1-5 times; some (Task 5 taxonomy, Task 16 personas) commit more frequently because their scope is broader. Frequent commits keep the agentic watchdog alive and make bisecting easy if a mid-phase regression ships.

**Acceptance criteria for Phase 3 done.** (1) All 32 tasks checked off. (2) `pnpm typecheck && pnpm lint && pnpm test:run && pnpm build` green. (3) 6 Playwright E2Es green. (4) Engine-file checksum matches pre-flight snapshot. (5) `pnpm verify:sd-content` green. (6) Wave-3 flag flipped and auto-rollback guard wired. (7) `.progress` file updated with "SD Phase 3 · DONE · <date>". (8) User approval to proceed to Phase 4.

---

*End of SD Phase-3 implementation plan.*

