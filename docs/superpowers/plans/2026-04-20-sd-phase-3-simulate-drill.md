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
