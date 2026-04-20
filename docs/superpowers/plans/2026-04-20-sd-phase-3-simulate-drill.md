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

*Task details follow, starting with Task 1 in the next commit.*
