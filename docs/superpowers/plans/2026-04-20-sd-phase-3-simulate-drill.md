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
