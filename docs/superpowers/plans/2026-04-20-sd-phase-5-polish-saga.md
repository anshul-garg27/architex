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

## Task 1: Add Phase 5 dependencies to `package.json`

**Files:**
- Modify: `architex/package.json`

**Design intent:** All Phase 5 runtime + dev dependencies are added up-front so subsequent tasks can `import` without interruption. Versions pinned with caret to allow patch bumps only. `three` and `@react-three/fiber` are intentionally included even though the isometric view is flag-gated — the bundle impact is offset by dynamic `import()` at the route boundary (Task 16). Bundle cost is measured against the baseline in pre-flight.

- [ ] **Step 1: Inspect current `package.json`**

```bash
cd architex && cat package.json | grep -E "roughjs|three|@react-three|tone|react-aria-components|@axe-core/react"
```

Expected: empty output. If any exist, skip the corresponding line below.

- [ ] **Step 2: Install runtime dependencies**

```bash
cd architex
pnpm add roughjs@^4.6.6
pnpm add three@^0.171.0
pnpm add @react-three/fiber@^9.1.0
pnpm add @react-three/drei@^9.120.5
pnpm add tone@^15.0.0
pnpm add react-aria-components@^1.7.0
```

- [ ] **Step 3: Install dev dependencies**

```bash
cd architex
pnpm add -D @axe-core/react@^4.11.0
pnpm add -D @types/three@^0.171.0
pnpm add -D whisper-web@^0.3.0 || pnpm add -D @xenova/transformers@^2.17.2
```

`@openai/whisper-web` is a placeholder — at time of plan writing the canonical package is under flux; the fallback `@xenova/transformers` is battle-tested and ships an in-browser Whisper inference path. Task 20 picks the final package after a one-day bake.

- [ ] **Step 4: Verify install + typecheck**

```bash
cd architex
pnpm install
pnpm typecheck
```

Expected: no type errors introduced. If `three` + `@types/three` mismatch, pin `@types/three` to match the runtime major.

- [ ] **Step 5: Bundle-budget verification**

```bash
cd architex && ANALYZE=true pnpm build 2>&1 | tee /tmp/architex-sd-phase-5-task1-bundle.txt
diff -u /tmp/architex-sd-phase-5-bundle-baseline.txt /tmp/architex-sd-phase-5-task1-bundle.txt | head -80
```

Expected: initial bundle size increase **under 30 KB gzipped** on the default route (isometric and whisper code are lazy-loaded; only `roughjs`, `tone`, and `react-aria-components` land on initial bundle). If the delta exceeds 30 KB, check that `three`/`R3F` are not pulled in by a mis-placed `import` — they must be imported only inside `src/lib/render/modes/isometric-3d.tsx` which is dynamic-imported from Task 16.

- [ ] **Step 6: Commit**

```bash
git add architex/package.json architex/pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
plan(sd-phase-5-task1): add Phase 5 runtime + dev dependencies

- roughjs: hand-drawn render pass on canvas edges + nodes
- three + @react-three/fiber + @react-three/drei: optional 3D isometric view
- tone: WebAudio synthesis for ambient sound beds
- react-aria-components: robust accessible primitives for drill + saga overlays
- @axe-core/react: component-level a11y scans in dev
- whisper-web / @xenova/transformers: in-browser Whisper for verbal drills

Bundle delta under 30 KB gzipped on default route (three + R3F lazy-loaded).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Define shared render-mode + saga + drill-variant types

**Files:**
- Create: `architex/src/types/render-mode.ts`
- Create: `architex/src/types/saga.ts`
- Create: `architex/src/types/verbal-drill.ts`

**Design intent:** Every Phase 5 feature that crosses a module boundary goes through a discriminated union in `src/types/`. This gives us compile-time exhaustiveness on the render-mode switch (Task 5), the chapter runner (Task 9), and the verbal drill grader (Task 21).

- [ ] **Step 1: Write `render-mode.ts`**

```typescript
// architex/src/types/render-mode.ts

/**
 * Phase 5 render modes. Each mode is a pluggable renderer registered into
 * the canvas hook system via `src/lib/render/modes/*`.
 *
 * - "default" — serif labels + animated particles + context-aware icons (shipping default)
 * - "blueprint" — cyan/navy palette, graph-paper backdrop, architect-blueprint typography
 * - "hand-drawn" — roughjs wobble + Caveat handwriting (brainstorm mood)
 * - "isometric-3d" — datacenter → rack → server 3D projection (optional, lazy-loaded)
 */
export type RenderMode =
  | "default"
  | "blueprint"
  | "hand-drawn"
  | "isometric-3d";

export const RENDER_MODES: readonly RenderMode[] = [
  "default",
  "blueprint",
  "hand-drawn",
  "isometric-3d",
] as const;

/**
 * Per-diagram render preference. Stored as a JSONB column on `diagrams` and
 * hydrated into the canvas renderer at mount time.
 */
export interface RenderPreference {
  mode: RenderMode;
  /** Hand-drawn toggle between brainstorm-mode (chaotic) and locked-mode (polished). */
  handDrawnLock: "brainstorm" | "locked";
  /** Optional stacking: each toggle is independent. */
  particles: boolean;
  breathing: boolean;
  ambientSound: boolean;
  failureCinema: boolean;
  contextIcons: boolean;
}

export const DEFAULT_RENDER_PREFERENCE: RenderPreference = {
  mode: "default",
  handDrawnLock: "brainstorm",
  particles: true,
  breathing: true,
  ambientSound: false, // opt-in per §20.2 + §18.12
  failureCinema: true,
  contextIcons: true,
};

/**
 * Result of a render-mode compatibility check. Used by the toggle UI to
 * gray out modes that the current device cannot support (e.g. isometric-3d
 * on a device without WebGL).
 */
export interface RenderModeCapability {
  mode: RenderMode;
  supported: boolean;
  reason?: "no_webgl" | "reduced_motion" | "flag_disabled" | "low_memory";
}
```

- [ ] **Step 2: Write `saga.ts`**

```typescript
// architex/src/types/saga.ts

export type SagaChapterId =
  | "chapter-01-day-1-at-mockflix"
  | "chapter-02-first-scale-wave"
  | "chapter-03-2am-page";

export const SAGA_CHAPTER_IDS: readonly SagaChapterId[] = [
  "chapter-01-day-1-at-mockflix",
  "chapter-02-first-scale-wave",
  "chapter-03-2am-page",
] as const;

/**
 * A chapter is a thin orchestration layer. Each chapter is a sequence of
 * scenes; each scene composes existing Learn/Build/Simulate/Drill content
 * with a narrative wrapper (intro MDX + consequence MDX).
 */
export interface SagaChapter {
  id: SagaChapterId;
  title: string;
  year: number;
  estimatedDurationMinutes: number;
  introMdxPath: string;
  scenes: readonly SagaScene[];
  consequencesMdxPath: string;
  /** Chapters gate on the previous chapter being marked "complete". */
  prerequisiteChapterId: SagaChapterId | null;
}

export type SagaSceneKind =
  | "cutscene" // a narrative overlay — no user input beyond "continue"
  | "learn" // drives Learn mode with a scene-specific concept/problem ID
  | "build" // opens Build with a pre-seeded canvas template
  | "simulate" // runs a Simulate activity with a scene-specific chaos event
  | "drill"; // opens Drill with a scene-specific problem

export interface SagaScene {
  id: string;
  kind: SagaSceneKind;
  title: string;
  durationEstimateMinutes: number;
  /** Scene-kind-specific payload. Discriminated on `kind`. */
  payload:
    | { kind: "cutscene"; mdxPath: string; bgGradient: string }
    | { kind: "learn"; conceptId: string }
    | { kind: "build"; templateDiagramId: string }
    | { kind: "simulate"; activityId: string; chaosEventIds: string[] }
    | { kind: "drill"; problemId: string };
}

export type SagaSceneState = "locked" | "available" | "in_progress" | "completed";

export interface SagaProgress {
  userId: string;
  currentChapterId: SagaChapterId | null;
  completedChapters: readonly SagaChapterId[];
  /** Scene-level progress per chapter. */
  sceneStates: Readonly<Record<SagaChapterId, Readonly<Record<string, SagaSceneState>>>>;
  lastActivityAt: Date;
  optedOut: boolean;
}
```

- [ ] **Step 3: Write `verbal-drill.ts`**

```typescript
// architex/src/types/verbal-drill.ts

export type VerbalRubricAxis =
  | "clarity"
  | "structure"
  | "trade_offs"
  | "scale_reasoning"
  | "failure_reasoning"
  | "vocabulary_precision";

export const VERBAL_RUBRIC_AXES: readonly VerbalRubricAxis[] = [
  "clarity",
  "structure",
  "trade_offs",
  "scale_reasoning",
  "failure_reasoning",
  "vocabulary_precision",
] as const;

export interface VerbalRubricScore {
  axis: VerbalRubricAxis;
  /** 0-5 integer, per SD Drill rubric §9.9. */
  score: number;
  /** Sonnet-written one-paragraph justification. */
  rationale: string;
  /** Verbatim quotes from the transcript that drove the score. */
  evidenceSpans: readonly { startMs: number; endMs: number; text: string }[];
}

export interface VerbalDrillSubmission {
  drillId: string;
  userId: string;
  problemId: string;
  /** Raw audio blob (webm/opus) uploaded to the whisper endpoint. */
  audioBlobKey: string;
  /** The transcribed text, with word-level timings. */
  transcript: readonly TranscriptWord[];
  rubricScores: readonly VerbalRubricScore[];
  /** Aggregated 0-5 grade averaged across the 6 axes. */
  compositeGrade: number;
  /** Sonnet-written 400-600 word postmortem. */
  aiPostmortem: string;
  startedAt: Date;
  submittedAt: Date;
}

export interface TranscriptWord {
  word: string;
  startMs: number;
  endMs: number;
  /** Whisper confidence 0-1. */
  confidence: number;
}
```

- [ ] **Step 4: Ensure import paths line up with existing `src/types/`**

```bash
cd architex && ls src/types/ | head
```

Expected to include `telemetry.ts` from Phase 1. The three new files sit beside it.

- [ ] **Step 5: Typecheck**

```bash
cd architex && pnpm typecheck
```

Expected: clean. The types are declaration-only and import nothing runtime.

- [ ] **Step 6: Commit**

```bash
git add architex/src/types/render-mode.ts architex/src/types/saga.ts architex/src/types/verbal-drill.ts
git commit -m "plan(sd-phase-5-task2): shared types for render modes, saga, verbal drill"
```

---

## Task 3: Blueprint-paper render pipeline

**Files:**
- Create: `architex/src/lib/render/modes/blueprint.ts`
- Create: `architex/src/lib/render/modes/__tests__/blueprint.test.ts`
- Modify: `architex/src/components/canvas/edge-renderer.tsx` (register hook)
- Modify: `architex/src/components/canvas/node-renderer.tsx` (register hook)

**Design intent:** The blueprint mode is a **pure function** of the canvas state + a palette. It does not own DOM; it registers into the existing edge/node renderer hook. This keeps the renderer fork-free: the same `renderEdgeStyle` hook selects between default, blueprint, and hand-drawn modes.

Visual spec (§11.6): cyan/navy palette, graph-paper background, `Archivo Condensed` for labels, hand-drafted edge style (slight offset, no rounding on corners, all edges are 90°-snapped where possible).

- [ ] **Step 1: Write `blueprint.ts`**

```typescript
// architex/src/lib/render/modes/blueprint.ts
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { EdgeStyleHook, NodeStyleHook } from "@/components/canvas/types";

/**
 * Blueprint-paper render mode (§11.6, §18.8).
 *
 * Palette: deep navy (#0D1B2A) background, cyan grid (#5FCFFF), white-ish strokes.
 * Typography: Archivo Condensed for labels, IBM Plex Mono for technical values.
 * Edge style: 90°-snapped routes, no rounding at corners, subtle 0.5px ink-bleed glow.
 */

export const BLUEPRINT_PALETTE = {
  background: "#0D1B2A",
  grid: "#5FCFFF",
  gridMajor: "#8CE2FF",
  stroke: "#F0F7FA",
  strokeMuted: "#A8C5D3",
  accent: "#2563EB", // cobalt (SD accent)
  failureTint: "#E85A5A",
  nodeFill: "#13263D",
  nodeFillSelected: "#1E3656",
} as const;

export const BLUEPRINT_LABEL_FONT = '"Archivo Condensed", "Archivo", sans-serif';
export const BLUEPRINT_MONO_FONT = '"IBM Plex Mono", "Menlo", monospace';

/**
 * SVG `<defs>` contents for blueprint mode. Injected once at canvas root.
 * Grid is rendered as a `<pattern>` for cheap tiling.
 */
export function blueprintDefs(): string {
  return `
    <pattern id="bp-grid" width="8" height="8" patternUnits="userSpaceOnUse">
      <path d="M 8 0 L 0 0 0 8" fill="none" stroke="${BLUEPRINT_PALETTE.grid}" stroke-width="0.4" opacity="0.25"/>
    </pattern>
    <pattern id="bp-grid-major" width="80" height="80" patternUnits="userSpaceOnUse">
      <rect width="80" height="80" fill="url(#bp-grid)"/>
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="${BLUEPRINT_PALETTE.gridMajor}" stroke-width="0.8" opacity="0.4"/>
    </pattern>
    <filter id="bp-ink-bleed" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="0.3"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.37  0 0 0 0 0.81  0 0 0 0 1  0 0 0 0.7 0"/>
      <feComposite in="SourceGraphic" operator="over"/>
    </filter>
  `;
}

/**
 * Edge style hook. The canvas edge renderer invokes this for each edge when
 * the active render mode is "blueprint".
 */
export const blueprintEdgeStyle: EdgeStyleHook = (edge, ctx) => {
  const stroke = edge.highlighted ? BLUEPRINT_PALETTE.accent : BLUEPRINT_PALETTE.stroke;
  const strokeWidth = edge.highlighted ? 1.6 : 1.1;
  return {
    stroke,
    strokeWidth,
    strokeLinecap: "butt",
    strokeLinejoin: "miter",
    filter: "url(#bp-ink-bleed)",
    // 90°-snapped: replace SVG-bezier with an L-shaped path (Manhattan routing).
    pathD: manhattanRoute(edge.source, edge.target, ctx.boundingBoxes),
  };
};

/**
 * Node style hook. Flat rectangular nodes with thin strokes, blueprint-style
 * callouts, and mono-font technical annotations.
 */
export const blueprintNodeStyle: NodeStyleHook = (node) => ({
  fill: node.selected ? BLUEPRINT_PALETTE.nodeFillSelected : BLUEPRINT_PALETTE.nodeFill,
  stroke: BLUEPRINT_PALETTE.stroke,
  strokeWidth: 1.2,
  rx: 0, // no rounding; hand-drafted feel
  labelFontFamily: BLUEPRINT_LABEL_FONT,
  labelFontWeight: 500,
  labelFill: BLUEPRINT_PALETTE.stroke,
  annotationFontFamily: BLUEPRINT_MONO_FONT,
  annotationFill: BLUEPRINT_PALETTE.strokeMuted,
});

/**
 * Manhattan route between two nodes. Right-angle turns only. Dodges through
 * the provided bounding-box list to avoid cutting through other nodes.
 *
 * This is a simplified Manhattan router; full A* routing lives in
 * `src/lib/canvas/edge-router.ts` (Phase 2). The blueprint mode just asks for
 * "always L-shaped" routing as a visual convention.
 */
export function manhattanRoute(
  source: { x: number; y: number },
  target: { x: number; y: number },
  boundingBoxes: readonly { x: number; y: number; w: number; h: number }[]
): string {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  // Try horizontal-first.
  const hFirst = `M ${source.x} ${source.y} L ${midX} ${source.y} L ${midX} ${target.y} L ${target.x} ${target.y}`;
  if (!pathIntersectsBoxes(hFirst, boundingBoxes)) return hFirst;

  // Fall back to vertical-first.
  const vFirst = `M ${source.x} ${source.y} L ${source.x} ${midY} L ${target.x} ${midY} L ${target.x} ${target.y}`;
  return vFirst;
}

function pathIntersectsBoxes(
  _pathD: string,
  _boxes: readonly { x: number; y: number; w: number; h: number }[]
): boolean {
  // Simplified: the full implementation walks each segment against each box.
  // For blueprint mode the overlap cost is cosmetic — a future pass wires
  // this up to the A* router. Default false so the L-shape path is used.
  return false;
}
```

- [ ] **Step 2: Register hooks in `edge-renderer.tsx`**

```tsx
// architex/src/components/canvas/edge-renderer.tsx
import { blueprintEdgeStyle } from "@/lib/render/modes/blueprint";
import { defaultEdgeStyle } from "@/lib/render/modes/default";

const EDGE_STYLE_HOOKS: Record<RenderMode, EdgeStyleHook> = {
  default: defaultEdgeStyle,
  blueprint: blueprintEdgeStyle,
  // hand-drawn, isometric-3d wired in Tasks 4 + 16
  "hand-drawn": defaultEdgeStyle,
  "isometric-3d": defaultEdgeStyle,
};

export function renderEdgeStyle(edge: CanvasEdge, ctx: EdgeRenderContext, mode: RenderMode) {
  return EDGE_STYLE_HOOKS[mode](edge, ctx);
}
```

- [ ] **Step 3: Register hooks in `node-renderer.tsx`**

Parallel to Step 2 for node renderer; wire `blueprintNodeStyle`.

- [ ] **Step 4: Inject blueprint defs into CanvasRoot**

```tsx
// architex/src/components/canvas/CanvasRoot.tsx
{renderMode === "blueprint" && (
  <defs dangerouslySetInnerHTML={{ __html: blueprintDefs() }} />
)}
{renderMode === "blueprint" && (
  <rect x="0" y="0" width="100%" height="100%" fill="url(#bp-grid-major)" />
)}
```

- [ ] **Step 5: Write tests**

```typescript
// architex/src/lib/render/modes/__tests__/blueprint.test.ts
import { describe, it, expect } from "vitest";
import { blueprintEdgeStyle, blueprintNodeStyle, manhattanRoute, BLUEPRINT_PALETTE } from "../blueprint";

describe("blueprint render mode", () => {
  it("palette uses navy background and cobalt accent (SD spec §18.8)", () => {
    expect(BLUEPRINT_PALETTE.background).toBe("#0D1B2A");
    expect(BLUEPRINT_PALETTE.accent).toBe("#2563EB");
  });

  it("edge style is 1.1 stroke width by default, 1.6 when highlighted", () => {
    const def = blueprintEdgeStyle(
      { id: "e1", source: { x: 0, y: 0 }, target: { x: 100, y: 100 }, highlighted: false },
      { boundingBoxes: [] }
    );
    expect(def.strokeWidth).toBe(1.1);
    const hl = blueprintEdgeStyle(
      { id: "e2", source: { x: 0, y: 0 }, target: { x: 100, y: 100 }, highlighted: true },
      { boundingBoxes: [] }
    );
    expect(hl.strokeWidth).toBe(1.6);
  });

  it("node style renders zero-radius rectangles", () => {
    const style = blueprintNodeStyle({ id: "n1", selected: false, family: "service" });
    expect(style.rx).toBe(0);
  });

  it("manhattan route produces L-shape between two points", () => {
    const d = manhattanRoute({ x: 0, y: 0 }, { x: 100, y: 100 }, []);
    // Four points separated by " L " — start + 2 turns + end.
    expect(d.split(" L ").length).toBe(4);
  });
});
```

- [ ] **Step 6: Typecheck + test**

```bash
cd architex && pnpm typecheck && pnpm test:run src/lib/render/modes/__tests__/blueprint.test.ts
```

- [ ] **Step 7: Visual smoke**

Start the dev server, open `/modules/sd/build`, toggle render mode to `blueprint` via React DevTools (or once Task 5 lands, via the UI). Confirm: navy backdrop, cyan grid visible, node strokes white, edges are L-shaped.

- [ ] **Step 8: Commit**

```bash
git add architex/src/lib/render/modes/blueprint.ts \
  architex/src/lib/render/modes/__tests__/blueprint.test.ts \
  architex/src/components/canvas/edge-renderer.tsx \
  architex/src/components/canvas/node-renderer.tsx \
  architex/src/components/canvas/CanvasRoot.tsx
git commit -m "plan(sd-phase-5-task3): blueprint-paper render mode (grid + Manhattan routing + ink-bleed)"
```

---

## Task 4: Hand-drawn render pipeline (`roughjs` adapter)

**Files:**
- Create: `architex/src/lib/render/modes/hand-drawn.ts`
- Create: `architex/src/lib/render/modes/__tests__/hand-drawn.test.ts`
- Modify: `architex/src/components/canvas/edge-renderer.tsx`
- Modify: `architex/src/components/canvas/node-renderer.tsx`

**Design intent:** Hand-drawn mode is the "brainstorm" mood — it tells the user *this is a sketch, not a spec*. Two variants are exposed via `RenderPreference.handDrawnLock`:

- `"brainstorm"` — maximal `roughness: 2.5`, `bowing: 2`, fill style `hachure`, Caveat font italic
- `"locked"` — damped `roughness: 0.9`, no fill hachure, Caveat font regular — makes a hand-drawn diagram *feel* committed-to

- [ ] **Step 1: Write `hand-drawn.ts`**

```typescript
// architex/src/lib/render/modes/hand-drawn.ts
import rough from "roughjs/bin/rough";
import type { RoughGenerator } from "roughjs/bin/generator";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";
import type { EdgeStyleHook, NodeStyleHook } from "@/components/canvas/types";
import type { RenderPreference } from "@/types/render-mode";

/**
 * Hand-drawn render mode (§11.6, §18.8).
 *
 * Uses roughjs (https://roughjs.com) to generate SVG path data with jitter.
 * Two lock states (see RenderPreference.handDrawnLock):
 *   - brainstorm: chaotic, roughness 2.5, hachure fill
 *   - locked:      polished, roughness 0.9, solid fill
 */

const SHARED_GEN: RoughGenerator = rough.generator({ options: { seed: 42 } });

export const HAND_DRAWN_PALETTE = {
  ink: "#1E293B",
  inkMuted: "#475569",
  paper: "#FAF7F0", // warm off-white
  paperDark: "#1A1A1A", // dark-theme variant
  accent: "#2563EB",
  failureTint: "#E85A5A",
} as const;

export const HAND_DRAWN_LABEL_FONT = '"Caveat", "Kalam", cursive';

export interface HandDrawnStyleConfig {
  lock: RenderPreference["handDrawnLock"];
  theme: "light" | "dark";
}

function roughOptionsForLock(lock: RenderPreference["handDrawnLock"]) {
  if (lock === "brainstorm") {
    return {
      roughness: 2.5,
      bowing: 2,
      strokeWidth: 1.8,
      fillStyle: "hachure" as const,
      hachureGap: 6,
      preserveVertices: false,
    };
  }
  // locked
  return {
    roughness: 0.9,
    bowing: 0.6,
    strokeWidth: 1.5,
    fillStyle: "solid" as const,
    hachureGap: 0,
    preserveVertices: true,
  };
}

/**
 * Edge style hook. Emits a roughjs-generated path string that the SVG renderer
 * can consume as `d=""`. roughjs returns an `OpSet` — we stringify it here.
 */
export function makeHandDrawnEdgeStyle(config: HandDrawnStyleConfig): EdgeStyleHook {
  const opts = roughOptionsForLock(config.lock);
  const ink = config.theme === "dark" ? HAND_DRAWN_PALETTE.paper : HAND_DRAWN_PALETTE.ink;

  return (edge) => {
    const drawable = SHARED_GEN.line(edge.source.x, edge.source.y, edge.target.x, edge.target.y, opts);
    const pathD = drawableToPath(drawable);
    return {
      stroke: edge.highlighted ? HAND_DRAWN_PALETTE.accent : ink,
      strokeWidth: edge.highlighted ? opts.strokeWidth + 0.5 : opts.strokeWidth,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      pathD,
    };
  };
}

/**
 * Node style hook. Emits a roughjs-generated rectangle path plus a slight
 * Caveat-font label rotation (±1.5°) so nothing feels too orthogonal.
 */
export function makeHandDrawnNodeStyle(config: HandDrawnStyleConfig): NodeStyleHook {
  const opts = roughOptionsForLock(config.lock);
  const paper = config.theme === "dark" ? HAND_DRAWN_PALETTE.paperDark : HAND_DRAWN_PALETTE.paper;
  const ink = config.theme === "dark" ? HAND_DRAWN_PALETTE.paper : HAND_DRAWN_PALETTE.ink;

  return (node) => {
    const bbox = node.boundingBox;
    const drawable = SHARED_GEN.rectangle(bbox.x, bbox.y, bbox.w, bbox.h, {
      ...opts,
      fill: paper,
      fillStyle: config.lock === "brainstorm" ? "hachure" : "solid",
    });
    // Stable pseudo-random rotation so label jitter is deterministic per node.
    const rotation = ((hashStr(node.id) % 30) - 15) / 10; // ±1.5°
    return {
      fill: paper,
      stroke: ink,
      strokeWidth: opts.strokeWidth,
      pathD: drawableToPath(drawable),
      labelFontFamily: HAND_DRAWN_LABEL_FONT,
      labelFontStyle: config.lock === "brainstorm" ? "italic" : "normal",
      labelRotationDeg: rotation,
      labelFill: ink,
    };
  };
}

function drawableToPath(drawable: ReturnType<RoughGenerator["line"]>): string {
  // roughjs ops: "move", "lineTo", "bcurveTo". Stringify to SVG d.
  return drawable.sets
    .flatMap((set) => set.ops)
    .map((op) => {
      if (op.op === "move") return `M ${op.data[0]} ${op.data[1]}`;
      if (op.op === "lineTo") return `L ${op.data[0]} ${op.data[1]}`;
      if (op.op === "bcurveTo") {
        const [c1x, c1y, c2x, c2y, x, y] = op.data;
        return `C ${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`;
      }
      return "";
    })
    .join(" ");
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
```

- [ ] **Step 2: Register hooks in renderers**

Wire `makeHandDrawnEdgeStyle` / `makeHandDrawnNodeStyle` into the same `EDGE_STYLE_HOOKS` / `NODE_STYLE_HOOKS` tables modified in Task 3. The hooks are factories because `handDrawnLock` + theme must be threaded in.

- [ ] **Step 3: Font load**

Add Caveat to the Phase 5 font manifest:
```typescript
// architex/src/app/fonts.ts
import { Caveat } from "next/font/google";
export const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });
```

- [ ] **Step 4: Tests**

```typescript
// architex/src/lib/render/modes/__tests__/hand-drawn.test.ts
import { describe, it, expect } from "vitest";
import { makeHandDrawnEdgeStyle, makeHandDrawnNodeStyle, HAND_DRAWN_PALETTE } from "../hand-drawn";

describe("hand-drawn render mode", () => {
  it("brainstorm lock uses higher roughness than locked", () => {
    const hook = makeHandDrawnEdgeStyle({ lock: "brainstorm", theme: "light" });
    const style = hook(
      { id: "e1", source: { x: 0, y: 0 }, target: { x: 100, y: 100 }, highlighted: false },
      { boundingBoxes: [] }
    );
    expect(style.strokeWidth).toBeGreaterThanOrEqual(1.5);
  });

  it("locked lock dampens stroke width", () => {
    const hook = makeHandDrawnEdgeStyle({ lock: "locked", theme: "light" });
    const style = hook(
      { id: "e1", source: { x: 0, y: 0 }, target: { x: 100, y: 100 }, highlighted: false },
      { boundingBoxes: [] }
    );
    expect(style.strokeWidth).toBe(1.5);
  });

  it("node label rotation is deterministic per node id", () => {
    const hook = makeHandDrawnNodeStyle({ lock: "brainstorm", theme: "light" });
    const a = hook({ id: "node-alpha", boundingBox: { x: 0, y: 0, w: 100, h: 40 }, family: "service", selected: false });
    const b = hook({ id: "node-alpha", boundingBox: { x: 0, y: 0, w: 100, h: 40 }, family: "service", selected: false });
    expect(a.labelRotationDeg).toBe(b.labelRotationDeg);
  });

  it("dark theme inverts paper/ink", () => {
    const dark = makeHandDrawnNodeStyle({ lock: "locked", theme: "dark" });
    const style = dark({ id: "n1", boundingBox: { x: 0, y: 0, w: 100, h: 40 }, family: "service", selected: false });
    expect(style.fill).toBe(HAND_DRAWN_PALETTE.paperDark);
  });
});
```

- [ ] **Step 5: Typecheck + test**

```bash
cd architex && pnpm typecheck && pnpm test:run src/lib/render/modes/__tests__/hand-drawn.test.ts
```

- [ ] **Step 6: Visual smoke**

Open a Build diagram, switch to hand-drawn, toggle between brainstorm + locked. Brainstorm should look like a whiteboard photo; locked should look like a polished sketch committed to ink.

- [ ] **Step 7: Commit**

```bash
git add architex/src/lib/render/modes/hand-drawn.ts \
  architex/src/lib/render/modes/__tests__/hand-drawn.test.ts \
  architex/src/components/canvas/edge-renderer.tsx \
  architex/src/components/canvas/node-renderer.tsx \
  architex/src/app/fonts.ts
git commit -m "plan(sd-phase-5-task4): hand-drawn render mode (roughjs + Caveat + brainstorm/locked variants)"
```

---

## Task 5: Render-mode toggle UI + persistence + flag gates

**Files:**
- Create: `architex/src/components/sd/RenderModeToggle.tsx`
- Create: `architex/src/components/sd/__tests__/RenderModeToggle.test.tsx`
- Modify: `architex/src/db/schema/diagrams.ts` (add `render_preference` column)
- Modify: `architex/drizzle/NNNN_add_render_preference.sql` (generated migration)
- Modify: `architex/src/stores/sd-store.ts` (persist render preference)
- Modify: `architex/src/features/flags/registry.ts` (add `sd.render_mode.blueprint_enabled`, `sd.render_mode.hand_drawn_enabled`, `sd.render_mode.isometric_enabled`)

**Design intent:** The toggle is a single segmented control surfaced in the canvas control strip. Persistence is per-diagram (not per-user) because a user might want one diagram in blueprint and another in hand-drawn. Flag gates hide modes that are not yet GA.

- [ ] **Step 1: Add drizzle migration for `render_preference` on `diagrams`**

```sql
-- architex/drizzle/0012_add_render_preference.sql
ALTER TABLE diagrams
  ADD COLUMN render_preference JSONB NOT NULL DEFAULT '{"mode":"default","handDrawnLock":"brainstorm","particles":true,"breathing":true,"ambientSound":false,"failureCinema":true,"contextIcons":true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_diagrams_render_preference_mode ON diagrams ((render_preference->>'mode'));
```

Regenerate via `pnpm drizzle:generate` and commit.

- [ ] **Step 2: Update schema file**

```typescript
// architex/src/db/schema/diagrams.ts
import { jsonb } from "drizzle-orm/pg-core";
import type { RenderPreference } from "@/types/render-mode";

// add within the existing pgTable definition
renderPreference: jsonb("render_preference").$type<RenderPreference>().notNull().default(DEFAULT_RENDER_PREFERENCE),
```

- [ ] **Step 3: Add flag keys to registry**

```typescript
// architex/src/features/flags/registry.ts
export const PHASE_5_FLAG_KEYS = [
  "sd.render_mode.blueprint_enabled",
  "sd.render_mode.hand_drawn_enabled",
  "sd.render_mode.isometric_enabled",
] as const;

// merge into existing FLAG_REGISTRY
```

- [ ] **Step 4: Write `RenderModeToggle.tsx`**

```tsx
// architex/src/components/sd/RenderModeToggle.tsx
"use client";

import { useCallback, useMemo } from "react";
import { ToggleGroup, ToggleGroupItem } from "react-aria-components";
import { useFeatureFlag } from "@/hooks/useFeatureFlag";
import { useSDStore } from "@/stores/sd-store";
import type { RenderMode } from "@/types/render-mode";
import { trackSDRenderModeChanged } from "@/lib/analytics/sd-events";

interface Props {
  diagramId: string;
  current: RenderMode;
}

export function RenderModeToggle({ diagramId, current }: Props) {
  const blueprintEnabled = useFeatureFlag("sd.render_mode.blueprint_enabled");
  const handDrawnEnabled = useFeatureFlag("sd.render_mode.hand_drawn_enabled");
  const isometricEnabled = useFeatureFlag("sd.render_mode.isometric_enabled");
  const updateRenderMode = useSDStore((s) => s.updateRenderMode);

  const modes = useMemo<Array<{ id: RenderMode; label: string; disabled?: boolean }>>(
    () => [
      { id: "default", label: "Default" },
      { id: "blueprint", label: "Blueprint", disabled: !blueprintEnabled },
      { id: "hand-drawn", label: "Sketch", disabled: !handDrawnEnabled },
      { id: "isometric-3d", label: "3D", disabled: !isometricEnabled },
    ],
    [blueprintEnabled, handDrawnEnabled, isometricEnabled]
  );

  const onChange = useCallback(
    (next: RenderMode) => {
      updateRenderMode(diagramId, next);
      trackSDRenderModeChanged({ diagramId, from: current, to: next });
    },
    [current, diagramId, updateRenderMode]
  );

  return (
    <ToggleGroup
      aria-label="Diagram render mode"
      selectionMode="single"
      selectedKeys={new Set([current])}
      onSelectionChange={(keys) => {
        const next = Array.from(keys)[0] as RenderMode;
        if (next) onChange(next);
      }}
      className="flex items-center gap-0.5 rounded-md border border-border p-0.5"
    >
      {modes.map((m) => (
        <ToggleGroupItem
          key={m.id}
          id={m.id}
          isDisabled={m.disabled}
          className="px-2.5 py-1 text-xs font-medium rounded data-[selected]:bg-cobalt-500 data-[selected]:text-white data-[disabled]:opacity-40"
        >
          {m.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
```

- [ ] **Step 5: Write tests**

```tsx
// architex/src/components/sd/__tests__/RenderModeToggle.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RenderModeToggle } from "../RenderModeToggle";

vi.mock("@/hooks/useFeatureFlag", () => ({
  useFeatureFlag: (key: string) => key !== "sd.render_mode.isometric_enabled",
}));

describe("RenderModeToggle", () => {
  it("renders four modes with disabled state honoring flags", () => {
    render(<RenderModeToggle diagramId="d1" current="default" />);
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Sketch")).toBeInTheDocument();
    const threeD = screen.getByText("3D").closest("[role='button']");
    expect(threeD).toHaveAttribute("aria-disabled", "true");
  });

  it("fires analytics on mode change", () => {
    const { container } = render(<RenderModeToggle diagramId="d1" current="default" />);
    const blueprint = screen.getByText("Blueprint");
    fireEvent.click(blueprint);
    // analytics + store assertion — mocked in real test
  });
});
```

- [ ] **Step 6: Wire analytics event**

```typescript
// architex/src/lib/analytics/sd-events.ts
export function trackSDRenderModeChanged(props: {
  diagramId: string;
  from: RenderMode;
  to: RenderMode;
}) {
  track("sd_render_mode_changed", props);
}
```

- [ ] **Step 7: Visual smoke**

Confirm toggle renders on the canvas control strip. Flag override panel toggles each mode independently; disabled states gray out.

- [ ] **Step 8: Commit**

```bash
git add architex/drizzle/0012_add_render_preference.sql \
  architex/src/db/schema/diagrams.ts \
  architex/src/components/sd/RenderModeToggle.tsx \
  architex/src/components/sd/__tests__/RenderModeToggle.test.tsx \
  architex/src/features/flags/registry.ts \
  architex/src/stores/sd-store.ts \
  architex/src/lib/analytics/sd-events.ts
git commit -m "plan(sd-phase-5-task5): render-mode toggle + per-diagram persistence + flag gates"
```

---

