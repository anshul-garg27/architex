# SD Phase 5 · The Architect's Studio Final Polish & Decade Saga Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the Architex System Design module from feature-complete (Phases 1-4) to **studio-grade**. Phase 5 is the polish pass that turns the wind tunnel into a world: blueprint-paper rendering, hand-drawn sketch mode, ambient sound, an optional narrative campaign (the Decade Saga), verbal drill mode with Whisper transcription, red-team chaos AI, constraint-solver + reverse-engineer smart canvas, 3D isometric view, a 90-minute Full-Stack Loop, chaos-budget game, reference component library expansion (20 → 50), the F1-F12 humane-design pass, and a WCAG AA accessibility audit. Every feature ships behind a flag; every code path ships with tests; nothing in Phases 1-4 needs to change.

**Architecture:** Five discrete polish pillars, all additive on top of the existing SD surface:

1. **Visual render pillar** — two new render modes (blueprint-paper, hand-drawn via `roughjs`) and an optional 3D isometric projection view. All three are opt-in per-diagram settings persisted in `diagrams.render_mode`. Fall back to the default serif+particles render if a mode is disabled by flag, by reduced-motion, or by device capability.
2. **Immersion pillar** — ambient sound system (WebAudio, opt-in, per-mode sound beds) + the Decade Saga narrative engine (chapter framework, cutscene renderer, progress save, chapter-gated unlocks) with Chapters 1-3 content authored by Opus: *Day 1 at MockFlix · The First Scale Wave · The 2AM Page*. Saga is entirely toggleable; users who stick to discrete drills never see it.
3. **Smart canvas pillar** — constraint solver (`p99 ≤ 50ms · cost ≤ $X · survives single-region failure` → AI returns ghost-diff + rationale), reverse-engineer-from-text (free-form description → AI drafts starter diagram), and the 30 new curated reference components (Netflix CDN, Uber dispatch, Stripe idempotency, Twitter timeline fan-out, Discord voice edge, Slack presence, Dropbox block storage, Kafka exactly-once, and 22 more). All three live in the Build/Simulate canvas chrome; all three are Sonnet calls with aggressive caching.
4. **Drill pillar** — verbal drill mode (mic → Whisper transcription → verbal-explanation grading rubric), Full-Stack Loop (90min paired SD+LLD drill over one canonical problem), red-team AI chaos mode (Sonnet picks the chaos event that hits your specific design's weakest link), chaos-budget control mode ("3 chaos tokens in 5 minutes — plan wisely"). All four are new drill variants that compose with the existing Drill infrastructure.
5. **Quality pillar** — F1-F12 humane-design pass ported from LLD's humane-design principles applied to SD surfaces, and a WCAG AA accessibility audit covering contrast, keyboard navigation, screen reader ARIA, and a canvas-specific ARIA strategy (each node gets an `aria-label` derived from family + name + config; edges exposed as a labeled graph; chaos overlay exposed as a live region with rate-limiting).

**Tech stack additions:** `roughjs@^4.6.6` (hand-drawn render pass), `three@^0.171.0` + `@react-three/fiber@^9.1.0` + `@react-three/drei@^9.120.5` (isometric datacenter view), `@openai/whisper-web@^0.3.0` or **local fallback** via the browser `MediaRecorder` + server-side whisper endpoint, `tone@^15.0.0` (WebAudio synthesis for ambient sound beds — all generated, no assets), `react-aria-components@^1.7.0` (robust accessible primitives for drill + saga overlays), `@axe-core/react@^4.11.0` (component-level a11y scans in dev). All additions are additive; nothing in Phases 1-4 needs to change.

**Prerequisite:** Phases 1-4 shipped end-to-end. `sd_mode_switched` event fires in production. All five mode layouts (Learn/Build/Simulate/Drill/Review) render. The 34-file simulation engine under `architex/src/lib/simulation/` runs deterministic scenarios. The 73-event chaos taxonomy is populated. 20 reference components already exist. If any of those are not true, return to that phase.

**Reference:** Design spec `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md` §23 Phase 5 scope, §18 UI & visual language, §20 Immersion & narrative, §14 Smart canvas, §29 Engineering (§29.8 replay, §29.9 tracing, §29.6 edge bundling — all Phase-5 deferrals flagged in the spec). Style reference: `docs/superpowers/plans/2026-04-20-lld-phase-6-polish-rollout.md` (task breakdown granularity + verification pattern + commit-per-task cadence).

---

## Table of Contents

- [Pre-flight checklist (Phase 5 kickoff · ~3-4 hours)](#pre-flight-checklist-phase-5-kickoff--3-4-hours)
- [File structure](#file-structure)
- [Commit strategy](#commit-strategy)
- Task 1 — Add Phase 5 dependencies to `package.json`
- Task 2 — Define shared render-mode + saga + drill-variant types
- Task 3 — Blueprint-paper render pipeline: SVG defs, grid backdrop, edge-style hook
- Task 4 — Hand-drawn render pipeline: `roughjs` adapter + wobble filter + Caveat labels
- Task 5 — Render-mode toggle UI + persistence + feature-flag gates
- Task 6 — Ambient sound system: WebAudio graph, per-mode bed, chaos bass thump
- Task 7 — Sound preference store + settings panel + reduced-motion / prefers-silence fallback
- Task 8 — Decade Saga schema (`sd_saga_progress`, `sd_saga_chapter_state`) + relations
- Task 9 — Saga chapter framework: runner, progress save, gated unlocks, cutscene renderer
- Task 10 — Saga narrative engine: MDX loader + typewriter stream + cobalt glow cutscenes
- Task 11 — Chapter 1 content scaffolding — *Day 1 at MockFlix*
- Task 12 — Chapter 2 content scaffolding — *The First Scale Wave*
- Task 13 — Chapter 3 content scaffolding — *The 2AM Page*
- Task 14 — Saga dashboard card + settings toggle + opt-out flow
- Task 15 — Reference components library expansion (30 new · curated JSON + drag-drop)
- Task 16 — 3D isometric rendering: `react-three-fiber` canvas + datacenter → rack → server LOD
- Task 17 — Isometric camera controls + keyboard shortcuts + reduced-motion fallback
- Task 18 — Smart canvas constraint solver: Sonnet prompt + ghost-diff renderer + accept/reject flow
- Task 19 — Smart canvas reverse-engineer: free-text input → candidate canvas + ghost-preview
- Task 20 — Verbal drill mode: mic capture + Whisper server endpoint + streaming transcription
- Task 21 — Verbal-explanation rubric grader: 6-axis score + AI postmortem + replay UI
- Task 22 — Full-Stack Loop harness: 90min SD+LLD paired drill runner + shared problem map
- Task 23 — Red-team AI chaos mode: Sonnet picks worst chaos given current design's weakest link
- Task 24 — Chaos-budget control mode: token counter + plan-ahead UI + scoring
- Task 25 — Humane-design pass (F1-F12) applied to SD surfaces
- Task 26 — Accessibility audit: WCAG AA scans, canvas ARIA strategy, keyboard audit, screen reader pass
- Task 27 — Phase 5 feature-flag registry extension + kill switches
- Task 28 — Analytics event extension (~30 new events for Phase 5 surfaces)
- Task 29 — End-to-end smoke tests + Playwright a11y suite
- Task 30 — Final verification + progress tracker + phase-5-complete tag
- [Self-review checklist](#self-review-checklist)
- [Execution Handoff](#execution-handoff)

---

## Pre-flight checklist (Phase 5 kickoff · ~3-4 hours)

Before starting Task 1, verify the outputs of Phases 1-4 are in place and green. These are non-destructive assertions.

- [ ] **Verify Phase 1 SD shell + mode switcher exist**

```bash
test -f architex/src/components/modules/sd/SDShell.tsx && echo OK || echo MISSING
grep -q 'sd_mode_switched' architex/src/lib/analytics/sd-events.ts && echo OK || echo MISSING
```
Both must print `OK`. If `MISSING`, return to Phase 1. Phase 5 attaches to `SDShell`; without it the render-mode toggle and saga dashboard card have nowhere to live.

- [ ] **Verify Phase 2 Learn pipeline + content exists**

```bash
test -d architex/content/sd/concepts/wave-1 && echo OK || echo MISSING
test -d architex/content/sd/problems && echo OK || echo MISSING
```
Both must print `OK`. Saga chapters compose existing Learn/Simulate/Drill content — if the content drops are missing, chapters cannot render.

- [ ] **Verify Phase 3 Simulate engine + chaos taxonomy are live**

```bash
test -f architex/src/lib/simulation/chaos-engine.ts && echo OK || echo MISSING
test -f architex/src/lib/simulation/failure-modes.ts && echo OK || echo MISSING
```
Both must print `OK`. Red-team chaos mode (Task 23) and chaos-budget mode (Task 24) both plug into `chaos-engine.ts`; if it is stub-only, return to Phase 3.

- [ ] **Verify Phase 4 Drill + Review are shipping**

```bash
grep -q 'sd_drill_submitted' architex/src/lib/analytics/sd-events.ts && echo OK || echo MISSING
test -f architex/src/db/schema/sd-review-cards.ts && echo OK || echo MISSING
```
Both must print `OK`. The verbal drill (Task 20) and Full-Stack Loop (Task 22) sit on top of the Drill submission pipeline.

- [ ] **Verify the 20 reference components from Phase 3 are present**

```bash
test -f architex/src/lib/sd/reference-components/registry.ts && echo OK || echo MISSING
node -e "const {REFERENCE_COMPONENTS} = require('./architex/src/lib/sd/reference-components/registry.ts'); process.exit(Object.keys(REFERENCE_COMPONENTS).length >= 20 ? 0 : 1)" && echo OK || echo LESS_THAN_20
```
Must print `OK`. Task 15 expands this from 20 to 50 — if the Phase 3 baseline is not present the extension contract is ambiguous.

- [ ] **Verify canvas renderer exposes a pluggable edge-style hook**

```bash
grep -q 'renderEdgeStyle' architex/src/components/canvas/edge-renderer.tsx && echo OK || echo MISSING
```
Expected `OK`. Tasks 3 + 4 (blueprint + hand-drawn) both register new edge-style functions through this hook; without it we would have to fork the edge renderer for each mode.

- [ ] **Verify existing accessibility primitives**

```bash
test -f architex/src/lib/a11y/announce.ts && echo OK || echo MISSING
grep -q 'aria-live' architex/src/components/canvas/CanvasRoot.tsx && echo OK || echo MISSING
```
Both must print `OK`. Task 26 extends these; it does not rewrite them.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass. If any fail, fix before starting Phase 5 — we do not want Phase 5 failures entangled with pre-existing regressions.

- [ ] **Capture bundle-size baseline**

```bash
cd architex && ANALYZE=true pnpm build 2>&1 | tee /tmp/architex-sd-phase-5-bundle-baseline.txt
```
Save the output. Phase 5 adds `roughjs`, `three`, `@react-three/fiber`, `tone`, and `react-aria-components` — expected delta ~180 KB gzipped, budgeted to **stay under 110% of the Phase 4 baseline** because `three` + `fiber` are lazy-loaded behind the isometric-view flag (Task 16). The Lighthouse CI budget from Phase 4 should still pass.

- [ ] **Snapshot Phase 4 rollout state**

```bash
git log --oneline | head -30 > /tmp/sd-phase-4-log.txt
git tag --list | tail -10 > /tmp/sd-phase-tags.txt
```
Reference material. Useful if a later task needs to verify a specific Phase 4 commit.

- [ ] **Commit any pre-flight fixes**

```bash
git add -p
git commit -m "chore(sd-phase-5): pre-flight verification — Phases 1-4 outputs confirmed"
```

---

## File structure

Files created or significantly modified in this plan. Paths are absolute within the repo.

```
architex/
├── package.json                                                   # MODIFY (add deps)
├── content/sd/saga/
│   ├── chapter-01-day-1-at-mockflix/
│   │   ├── intro.mdx                                              # NEW (Opus, ~900w)
│   │   ├── scenes/                                                # NEW (4 scene .mdx)
│   │   └── consequences.mdx                                       # NEW
│   ├── chapter-02-first-scale-wave/                               # NEW (same shape)
│   └── chapter-03-2am-page/                                       # NEW (same shape)
└── src/
    ├── lib/
    │   ├── render/
    │   │   ├── modes/
    │   │   │   ├── blueprint.ts                                   # NEW
    │   │   │   ├── hand-drawn.ts                                  # NEW (roughjs adapter)
    │   │   │   ├── isometric-3d.tsx                               # NEW (lazy — R3F)
    │   │   │   └── default.ts                                     # MODIFY (extract defaults)
    │   │   └── __tests__/
    │   │       ├── blueprint.test.ts
    │   │       ├── hand-drawn.test.ts
    │   │       └── isometric-3d.test.tsx
    │   ├── audio/
    │   │   ├── ambient-engine.ts                                  # NEW (WebAudio graph)
    │   │   ├── mode-bed.ts                                        # NEW (per-mode sound bed)
    │   │   ├── chaos-thump.ts                                     # NEW (bass pulse on chaos)
    │   │   └── __tests__/
    │   │       ├── ambient-engine.test.ts
    │   │       └── mode-bed.test.ts
    │   ├── saga/
    │   │   ├── chapter-runner.ts                                  # NEW
    │   │   ├── cutscene-renderer.tsx                              # NEW
    │   │   ├── progress.ts                                        # NEW
    │   │   ├── unlocks.ts                                         # NEW
    │   │   └── __tests__/
    │   │       ├── chapter-runner.test.ts
    │   │       ├── progress.test.ts
    │   │       └── unlocks.test.ts
    │   ├── sd/reference-components/
    │   │   ├── registry.ts                                        # MODIFY (20 → 50)
    │   │   ├── netflix-cdn.ts                                     # NEW
    │   │   ├── uber-dispatch.ts                                   # NEW
    │   │   ├── stripe-idempotency.ts                              # NEW
    │   │   ├── twitter-timeline.ts                                # NEW
    │   │   └── … (26 more — see Task 15)
    │   ├── smart-canvas/
    │   │   ├── constraint-solver.ts                               # NEW (Sonnet)
    │   │   ├── reverse-engineer.ts                                # NEW (Sonnet)
    │   │   ├── ghost-diff-renderer.tsx                            # NEW
    │   │   └── __tests__/
    │   │       ├── constraint-solver.test.ts
    │   │       └── reverse-engineer.test.ts
    │   ├── drill/
    │   │   ├── verbal-drill.ts                                    # NEW (mic → whisper)
    │   │   ├── verbal-rubric.ts                                   # NEW (6-axis grader)
    │   │   ├── full-stack-loop.ts                                 # NEW (SD+LLD paired)
    │   │   ├── redteam-chaos.ts                                   # NEW
    │   │   ├── chaos-budget.ts                                    # NEW
    │   │   └── __tests__/
    │   │       ├── verbal-drill.test.ts
    │   │       ├── verbal-rubric.test.ts
    │   │       ├── full-stack-loop.test.ts
    │   │       ├── redteam-chaos.test.ts
    │   │       └── chaos-budget.test.ts
    │   ├── a11y/
    │   │   ├── canvas-aria.ts                                     # NEW (graph semantics)
    │   │   ├── humane-design.ts                                   # NEW (F1-F12 gates)
    │   │   └── __tests__/
    │   │       ├── canvas-aria.test.ts
    │   │       └── humane-design.test.ts
    │   └── analytics/
    │       └── sd-events.ts                                       # MODIFY (+30 events)
    ├── db/
    │   └── schema/
    │       ├── sd-saga-progress.ts                                # NEW
    │       ├── sd-saga-chapter-state.ts                           # NEW
    │       ├── sd-verbal-drills.ts                                # NEW
    │       ├── index.ts                                           # MODIFY
    │       └── relations.ts                                       # MODIFY
    ├── app/
    │   ├── api/
    │   │   ├── sd/saga/route.ts                                   # NEW (GET + POST progress)
    │   │   ├── sd/whisper/route.ts                                # NEW (transcribe endpoint)
    │   │   ├── sd/constraint/route.ts                             # NEW (Sonnet call)
    │   │   ├── sd/reverse-engineer/route.ts                       # NEW (Sonnet call)
    │   │   ├── sd/redteam-chaos/route.ts                          # NEW (Sonnet call)
    │   │   └── __tests__/
    │   │       ├── saga.test.ts
    │   │       ├── whisper.test.ts
    │   │       ├── constraint.test.ts
    │   │       ├── reverse-engineer.test.ts
    │   │       └── redteam-chaos.test.ts
    │   └── (dashboard)/
    │       └── sd/
    │           ├── saga/page.tsx                                  # NEW
    │           ├── saga/[chapter]/page.tsx                        # NEW
    │           ├── drill/verbal/page.tsx                          # NEW
    │           ├── drill/full-stack-loop/page.tsx                 # NEW
    │           └── settings/polish/page.tsx                       # NEW
    ├── components/
    │   ├── canvas/
    │   │   ├── edge-renderer.tsx                                  # MODIFY (register hook)
    │   │   └── node-renderer.tsx                                  # MODIFY (register hook)
    │   ├── sd/
    │   │   ├── RenderModeToggle.tsx                               # NEW
    │   │   ├── SoundToggle.tsx                                    # NEW
    │   │   ├── SagaDashboardCard.tsx                              # NEW
    │   │   ├── CutscenePlayer.tsx                                 # NEW
    │   │   ├── VerbalDrillOverlay.tsx                             # NEW
    │   │   ├── RedTeamChaosBadge.tsx                              # NEW
    │   │   ├── ChaosBudgetMeter.tsx                               # NEW
    │   │   └── __tests__/                                         # NEW for each
    │   └── shared/
    │       └── isometric-view/
    │           ├── IsometricScene.tsx                             # NEW
    │           ├── RackMesh.tsx                                   # NEW
    │           └── ServerMesh.tsx                                 # NEW
    ├── features/flags/
    │   └── registry.ts                                            # MODIFY (+Phase 5 keys)
    └── types/
        ├── render-mode.ts                                         # NEW
        ├── saga.ts                                                # NEW
        └── verbal-drill.ts                                        # NEW
```

**Design rationale for splits:**
- **`src/lib/render/modes/`** is a new subdirectory under `src/lib/render/`. Each render mode is a small module that registers into the existing canvas renderer hooks — we avoid forking the renderer per mode.
- **`src/lib/audio/`** is sibling to `src/lib/render/`. Audio is a WebAudio graph that observes mode transitions and chaos events; decoupling it from the canvas renderer means a headless (no-canvas) test can still assert that "mode switch fires the correct sound bed".
- **`src/lib/saga/`** is new. Saga is narrative infrastructure that drives existing modes with a chapter-specific context frame; it does not own any simulation or drill logic.
- **`src/lib/smart-canvas/`** is new. Constraint-solver + reverse-engineer live here because they share prompt engineering, Sonnet transport, and ghost-diff rendering — three concerns that would bloat a single file.
- **`src/lib/drill/`** extends the existing Drill module with **four new variants** (verbal, full-stack-loop, red-team-chaos, chaos-budget). Each variant is a pure driver that reuses the existing submission + grading pipeline.
- **`src/lib/a11y/`** holds the Phase 5 additions (`canvas-aria.ts`, `humane-design.ts`). `announce.ts` from earlier phases stays in place.
- **`content/sd/saga/`** is a separate root because chapter content is MDX + scene JSON + a small manifest. It is authored content, not code, and should be reviewable as prose.
- **`src/app/(dashboard)/sd/saga/`** uses a dynamic `[chapter]` route so chapters 4-10 can be added post-Phase-5 without a schema change.

---

## Commit strategy

One commit per Task where possible. Commit messages follow the form `plan(sd-phase-5-taskNN): …` so `git log --grep plan(sd-phase-5-` yields a clean task-by-task view during review. The **final** commit for the incremental-write protocol (this plan document itself) is `plan(sd-phase-5): implementation plan` — one commit per incremental append-pass.

---

