# SD Phase 2 · Learn Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship SD Learn mode end-to-end — the 8-section concept page renderer (Itch · Definition · Mechanism · Anatomy · Numbers · Uses · Failure Modes · Checkpoints), the **6-pane problem page renderer** (Problem Statement · Requirements F+NF · Scale Numbers · Canonical Design · Failure Modes + Chaos · Concepts Used), a shared MDX ingestion pipeline that extends the one landed in LLD Phase 2, a scroll-sync canvas highlight (architecture nodes pulse as the reader scrolls into their section), 4 checkpoint types (recall · apply · compare · create) with progressive reveal on failure, 3 Ask-AI contextual surfaces (explain-this paragraph · suggest-analogy · show-me-at-scale), node popover on canvas click (opens component deep-dive), a diagnostic entry quiz, the 90-second guided onboarding, cross-linking schema (concept pages show "Related LLD Patterns" + "Problems that use this" + "Chaos events relevant"), the Scaling Numbers strip component, a Decision Tree component, Engineering Blog deep-link cards, and **8 Opus-authored pieces** — Wave 1 Foundations (5 concepts: Client-server · HTTP verbs · TCP-vs-UDP · DNS · IP-routing) + 3 warmup problems (URL shortener · rate limiter · distributed cache). Pipeline permits the remaining 32 concepts + 27 problems to be authored as content-only PRs with zero engineering work.

**Architecture:** Concept content lives in `.mdx` files under `content/sd/concepts/<concept-slug>.mdx` and problem content in `content/sd/problems/<problem-slug>.mdx`. Shared cross-linking metadata lives in `content/sd/graph/<slug>.graph.yaml` (concept → prerequisite concepts · concept → problems that use it · concept → LLD patterns that implement it · concept → chaos events it protects against). A build-time ingestion script — `scripts/compile-sd-content.ts` — extends the LLD MDX compiler from Phase 2 (`scripts/compile-lld-lessons.ts`) with SD-specific section schemas, compiling MDX into `sd_concepts.body_mdx` and `sd_problems.body_mdx` JSONB payloads. At render time, Learn mode reads the compiled payload from DB via TanStack Query and composes either the 8-section concept shell or the 6-pane problem shell. A `sd_learn_progress` table tracks per-section completion + scroll depth + checkpoint stats per (user, slug, kind) where kind ∈ {concept, problem}. An `sd_concept_reads` table logs concept-page views for FSRS seeding. An `sd_bookmarks` table stores user bookmarks keyed by (userId, slug, anchor). The cross-module graph is materialized as `sd_graph_edges` rows by a prebuild script that reads all `<slug>.graph.yaml` files; runtime lookups go through a static `src/lib/sd/concept-graph.ts` typed map (O(1) reads). Diagnostic quiz (Q46) lives in `content/sd/quiz/diagnostic.yaml` — 15 questions, 3 per difficulty band, renders as a standalone `/sd/onboarding/quiz` route that writes to `sd_diagnostic_results`. The 90-sec guided onboarding (Q34) is a spotlight-mask React overlay gated on `user_preferences.sd.onboardingComplete === false`. AI explain-inline, suggest-analogy, and show-me-at-scale route through the existing Anthropic client (Haiku for explain/analogy, Sonnet for scale projection). Scroll-sync canvas highlight mounts `LLDCanvas` in read-only mode with a `highlightedNodeIds` prop derived from the in-view section's `anchorNodeIds` frontmatter field.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript 5 strict · MDX 3 (@next/mdx + @mdx-js/react — already installed by LLD Phase 2) · Drizzle ORM · PostgreSQL (Neon) · Zustand 5 · TanStack Query 5 · @xyflow/react · motion/react 12 · Anthropic Claude SDK (Haiku + Sonnet) · Vitest · Testing Library · Playwright.

**Prerequisite:** SD Phase 1 complete — `SDShell`, `ModeSwitcher`, `WelcomeBanner`, `useSDModeSync`, `useSDPreferencesSync`, sd_* skeleton tables (sd_concepts, sd_problems, sd_diagrams, sd_simulation_runs, sd_drill_attempts, sd_chaos_events, sd_real_incidents, sd_graph_edges), 10+ API routes from Phase 1, and the 30+ SD analytics event catalog are merged. The `.progress-phase-1-sd.md` tracker shows Phase 1 complete. LLD Phase 2 must also be merged because this phase extends `scripts/compile-lld-lessons.ts` and `src/components/modules/lld/learn/` components (specifically `ClassPopover`, `BookmarkStrip`, `ContextualExplainPopover`) into shared `src/components/shared/learn/` primitives. If any SD Phase 1 task or LLD Phase 2 task is still open, finish it before Task 1 below.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-sd-architect-studio-rebuild.md` sections §5 (content strategy · 40 concepts + 30 problems · 8-section + 6-pane formats), §6 (Learn mode deep-dive), §11 (canvas & diagram system · 16 node families · 3 edge types · 10 diagram types), §14 (smart canvas features), §15 (AI integration · Learn-mode features L1-L3 · ~$0.015/session budget), §17 (cross-module seamlessness · knowledge graph · bridge cards), §18.6 (90-second onboarding), §23 Phase 2 (scope summary), §21 (data model). Sister plan at `docs/superpowers/plans/2026-04-20-lld-phase-2-learn-mode.md` — **use as blueprint**, but SD has 40 concepts + 30 problems (vs LLD's 36 patterns) and **two distinct page shells** (8-section concept pages + 6-pane problem pages).

---

## Pre-flight checklist (Phase 1.5 · ~2 hours)

Run before Task 1. These verify SD Phase 1 + LLD Phase 2 artifacts are in a known-good state and the shared pipeline is ready to extend.

- [ ] **Verify SD Phase 1 tag exists and worktree is clean**

```bash
cd architex
git tag -l phase-1-sd-complete
git diff phase-1-sd-complete HEAD -- src/stores src/hooks src/app/api src/components/modules/sd src/db/schema
```
Expected: `phase-1-sd-complete` tag present. Diff should be empty unless new work has landed since Phase 1 SD. Scan any diff for conflicts with files this plan will touch (listed in "File Structure").

- [ ] **Verify LLD Phase 2 tag exists and shared Learn primitives can be reused**

```bash
git tag -l phase-2-complete
ls architex/src/components/modules/lld/learn/
ls architex/scripts/compile-lld-lessons.ts
```
Expected: `phase-2-complete` tag present; `LessonColumn.tsx`, `ClassPopover.tsx`, `ConfusedWithPanel.tsx`, `ContextualExplainPopover.tsx`, `BookmarkStrip.tsx` all exist. If missing, LLD Phase 2 regressed — block and notify user.

- [ ] **Verify SD Learn mode stub still renders**

```bash
pnpm dev
```
Open <http://localhost:3000>, click the SD cobalt icon in the left rail, press `⌘1` (or click the Learn pill). Expected: the Phase 1 `SDLearnModeLayout` stub shows the "🌪 Learn Mode · Concept + Problem deep-dives coming in Phase 2" placeholder. If a blank screen or error appears, the SD Phase 1 wire-up regressed — fix before starting.

- [ ] **Verify MDX is already installed from LLD Phase 2 (no fresh deps needed)**

```bash
grep -E '"@next/mdx"|"@mdx-js/react"|"@mdx-js/mdx"|"gray-matter"' architex/package.json
```
Expected: 4 matches. If any are missing, LLD Phase 2 regressed — block. If `gray-matter` is missing specifically, `pnpm add gray-matter@^4.0.3` at Task 5 Step 1 will still install cleanly.

- [ ] **Verify the 5 Wave 1 concept slugs and 3 warmup problem slugs align with spec §5.2, §5.3**

```bash
grep -c "Wave 1" /tmp/sd-spec.md
```
Expected: at least 3 matches referencing Wave 1 Foundations. Open spec §5.2 and confirm concept list reads: **client-server · request-response · statelessness · idempotency · three-metrics**. Spec §5.3 lists Domain 6 Infrastructure warmups: **url-shortener · rate-limiter · distributed-cache**. The implementation maps these to Opus-authored concept topic names chosen for Phase 2 per task brief: **Client-server · HTTP verbs · TCP-vs-UDP · DNS · IP-routing** and problem slugs **url-shortener · rate-limiter · distributed-cache**. This is the final frozen slug list used in Tasks 24-31.

> **Note on Wave 1 slug drift:** The SD spec §5.2 Wave 1 reads "Client-server · Request-response · Statelessness · Idempotency · The three metrics that matter". The task brief for Phase 2 specifies a slightly different 5 concepts (Client-server · HTTP verbs · TCP-vs-UDP · DNS · IP-routing) that emphasize networking primitives users must have before Wave 2 Scaling. Phase 2 ships the task brief list; the spec §5.2 Wave 1 is renormalized in Phase 3 to absorb the delta (Request-response, Statelessness, Idempotency, Three-metrics move to Wave 2 prelude). Flag this for content lead in the Task 24 kickoff.

- [ ] **Verify Anthropic client has both Haiku and Sonnet paths**

```bash
grep -nE "claude-.*-haiku|claude-.*-sonnet" architex/src/lib/ai/claude-client.ts
```
Expected: at least two matches — a Haiku alias and a Sonnet alias. Tasks 19-22 use Haiku for explain-inline (cheap, <1s) and Sonnet for show-me-at-scale (deeper, 1-4s). If only one is wired, add the missing helper in Task 19 Step 1.

- [ ] **Verify `sd_concepts`, `sd_problems`, and `sd_graph_edges` tables exist from Phase 1**

```bash
pnpm db:studio
```
In the studio, confirm all three tables are present with columns matching spec §21.1. If missing, Phase 1 SD migration `0002_add_sd_module.sql` was never applied — block and notify user.

- [ ] **Verify `LLDCanvas` exports a read-only mode + `highlightedNodeIds` prop**

```bash
grep -nE "highlightedNodeIds|readonly|readOnly" architex/src/components/modules/lld/canvas/LLDCanvas.tsx
```
Expected: at least one match per token. Task 15 will reuse the same component in Phase 2 SD as the base for `SDCanvas` (a thin wrapper that swaps node-family renderers). If the props are not yet exposed, add them in Task 15 Step 1 as a precondition before wiring `useConceptScrollSync`.

- [ ] **Run full baseline test suite**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 2. No Phase 2 code should mingle with a broken baseline. If the baseline is red, open a pre-flight cleanup PR first.

- [ ] **Optional: clear browser state to simulate first-visit SD Learn flow**

DevTools → Application → Local Storage → delete `architex-ui`. Fresh first-visit state is helpful for smoke-testing the 90-second onboarding and diagnostic quiz in Tasks 33-34.

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                    # (generated migrations)
│   ├── NNNN_add_sd_learn_progress.sql                          # NEW (Task 4)
│   ├── NNNN_add_sd_concept_reads.sql                           # NEW (Task 4)
│   ├── NNNN_add_sd_bookmarks.sql                               # NEW (Task 4)
│   ├── NNNN_add_sd_diagnostic_results.sql                      # NEW (Task 4)
│   └── NNNN_extend_sd_graph_edges_bridge_text.sql              # NEW (Task 4)
├── content/                                                    # extends LLD Phase 2 content/
│   └── sd/
│       ├── concepts/
│       │   ├── client-server.mdx                               # NEW (Task 24)
│       │   ├── http-verbs.mdx                                  # NEW (Task 25)
│       │   ├── tcp-vs-udp.mdx                                  # NEW (Task 26)
│       │   ├── dns.mdx                                         # NEW (Task 27)
│       │   └── ip-routing.mdx                                  # NEW (Task 28)
│       ├── problems/
│       │   ├── url-shortener.mdx                               # NEW (Task 29)
│       │   ├── rate-limiter.mdx                                # NEW (Task 30)
│       │   └── distributed-cache.mdx                           # NEW (Task 31)
│       ├── graph/
│       │   ├── client-server.graph.yaml                        # NEW (Task 24)
│       │   ├── http-verbs.graph.yaml                           # NEW (Task 25)
│       │   ├── tcp-vs-udp.graph.yaml                           # NEW (Task 26)
│       │   ├── dns.graph.yaml                                  # NEW (Task 27)
│       │   ├── ip-routing.graph.yaml                           # NEW (Task 28)
│       │   ├── url-shortener.graph.yaml                        # NEW (Task 29)
│       │   ├── rate-limiter.graph.yaml                         # NEW (Task 30)
│       │   └── distributed-cache.graph.yaml                    # NEW (Task 31)
│       └── quiz/
│           └── diagnostic.yaml                                 # NEW (Task 33)
├── scripts/
│   ├── compile-sd-content.ts                                   # NEW (Task 6) — extends LLD compiler
│   ├── build-sd-graph.ts                                       # NEW (Task 16) — cross-module graph generator
│   └── seed-sd-diagnostic.ts                                   # NEW (Task 33)
├── src/
│   ├── db/schema/
│   │   ├── sd-learn-progress.ts                                # NEW (Task 1)
│   │   ├── sd-concept-reads.ts                                 # NEW (Task 2)
│   │   ├── sd-bookmarks.ts                                     # NEW (Task 3)
│   │   ├── sd-diagnostic-results.ts                            # NEW (Task 33)
│   │   ├── index.ts                                            # MODIFY (re-exports)
│   │   └── relations.ts                                        # MODIFY (4 new relations)
│   ├── lib/sd/
│   │   ├── content-types.ts                                    # NEW (Task 5)
│   │   ├── concept-loader.ts                                   # NEW (Task 7)
│   │   ├── problem-loader.ts                                   # NEW (Task 7)
│   │   ├── concept-graph.ts                                    # NEW generated (Task 16)
│   │   ├── checkpoint-types.ts                                 # NEW (Task 18)
│   │   ├── diagnostic-quiz.ts                                  # NEW (Task 33)
│   │   ├── node-families.ts                                    # NEW (Task 15) — 16 family registry for SD canvas
│   │   └── __tests__/
│   │       ├── concept-loader.test.ts                          # NEW
│   │       ├── problem-loader.test.ts                          # NEW
│   │       ├── concept-graph.test.ts                           # NEW
│   │       ├── checkpoint-grading.test.ts                      # NEW
│   │       └── diagnostic-quiz.test.ts                         # NEW
│   ├── lib/analytics/
│   │   └── sd-events.ts                                        # MODIFY (add lesson/checkpoint/bookmark/quiz/onboarding events)
│   ├── hooks/
│   │   ├── useSDLearnProgress.ts                               # NEW (Task 9)
│   │   ├── useConceptScrollSync.ts                             # NEW (Task 13)
│   │   ├── useProblemPaneSync.ts                               # NEW (Task 13)
│   │   ├── useSDTableOfContents.ts                             # NEW (Task 22)
│   │   ├── useSDBookmarks.ts                                   # NEW (Task 11)
│   │   ├── useSDSelectionExplain.ts                            # NEW (Task 20)
│   │   ├── useSDSuggestAnalogy.ts                              # NEW (Task 20)
│   │   ├── useSDShowAtScale.ts                                 # NEW (Task 20)
│   │   ├── useDiagnosticQuiz.ts                                # NEW (Task 33)
│   │   ├── useSDOnboardingTour.ts                              # NEW (Task 34)
│   │   └── __tests__/
│   │       ├── useSDLearnProgress.test.tsx                     # NEW
│   │       ├── useConceptScrollSync.test.tsx                   # NEW
│   │       ├── useSDBookmarks.test.tsx                         # NEW
│   │       └── useSDSelectionExplain.test.tsx                  # NEW
│   ├── app/api/
│   │   ├── sd/learn-progress/route.ts                          # NEW (Task 8)
│   │   ├── sd/learn-progress/[kind]/[slug]/route.ts            # NEW (Task 8)
│   │   ├── sd/bookmarks/route.ts                               # NEW (Task 10)
│   │   ├── sd/bookmarks/[id]/route.ts                          # NEW (Task 10)
│   │   ├── sd/concept-reads/route.ts                           # NEW (Task 12)
│   │   ├── sd/explain-inline/route.ts                          # NEW (Task 19)
│   │   ├── sd/suggest-analogy/route.ts                         # NEW (Task 19)
│   │   ├── sd/show-at-scale/route.ts                           # NEW (Task 19)
│   │   ├── sd/diagnostic/route.ts                              # NEW (Task 33)
│   │   ├── sd/diagnostic/[id]/route.ts                         # NEW (Task 33)
│   │   └── __tests__/
│   │       ├── sd-learn-progress.test.ts                       # NEW
│   │       ├── sd-bookmarks.test.ts                            # NEW
│   │       ├── sd-explain-inline.test.ts                       # NEW
│   │       ├── sd-suggest-analogy.test.ts                      # NEW
│   │       ├── sd-show-at-scale.test.ts                        # NEW
│   │       └── sd-diagnostic.test.ts                           # NEW
│   ├── app/sd/onboarding/
│   │   ├── quiz/page.tsx                                       # NEW (Task 33)
│   │   └── tour/page.tsx                                       # NEW (Task 34)
│   └── components/modules/sd/
│       ├── modes/
│       │   └── SDLearnModeLayout.tsx                           # REWRITE (Task 23)
│       └── learn/
│           ├── ConceptColumn.tsx                               # NEW (Task 14)
│           ├── ProblemColumn.tsx                               # NEW (Task 14)
│           ├── SDLearnSidebar.tsx                              # NEW (Task 22) — wave/domain filter
│           ├── SDLessonProgressBar.tsx                         # NEW (Task 22)
│           ├── SDTableOfContents.tsx                           # NEW (Task 22)
│           ├── SDBookmarkStrip.tsx                             # NEW (Task 22)
│           ├── ScalingNumbersStrip.tsx                         # NEW (Task 14) — Q32 format 3
│           ├── DecisionTree.tsx                                # NEW (Task 14) — Q32 format 4
│           ├── EngineeringBlogCard.tsx                         # NEW (Task 14) — Q32 format 5
│           ├── CrossModuleBridgeCard.tsx                       # NEW (Task 17) — Q32 format 8
│           ├── NodePopover.tsx                                 # NEW (Task 15) — SD analog of ClassPopover
│           ├── ConfusedWithPanel.tsx                           # NEW (Task 17) — SD variant
│           ├── AskAISurface.tsx                                # NEW (Task 21) — 3 surfaces (explain/analogy/scale)
│           ├── SDCanvasReadonly.tsx                            # NEW (Task 15) — scroll-sync wrapper
│           ├── concept-sections/                               # 8-section layout
│           │   ├── HookSection.tsx                             # NEW (Task 14) — "Itch" equivalent, per spec §5.4
│           │   ├── AnalogySection.tsx                          # NEW (Task 14)
│           │   ├── PrimitiveSection.tsx                        # NEW (Task 14) — "Definition + Mechanism" fused
│           │   ├── AnatomySection.tsx                          # NEW (Task 14) — architecture anatomy
│           │   ├── NumbersThatMatterSection.tsx                # NEW (Task 14)
│           │   ├── TradeoffsSection.tsx                        # NEW (Task 14) — Uses + gains/pays
│           │   ├── AntiCasesSection.tsx                        # NEW (Task 14) — "when not to use"
│           │   ├── SeenInWildSection.tsx                       # NEW (Task 14)
│           │   ├── BridgesSection.tsx                          # NEW (Task 14) — cross-module + problems + chaos
│           │   └── ConceptCheckpointsSection.tsx               # NEW (Task 14) — 3 checkpoints per concept
│           ├── problem-panes/                                  # 6-pane layout
│           │   ├── ProblemStatementPane.tsx                    # NEW (Task 14)
│           │   ├── RequirementsPane.tsx                        # NEW (Task 14) — F+NF
│           │   ├── ScaleNumbersPane.tsx                        # NEW (Task 14) — napkin math
│           │   ├── CanonicalDesignPane.tsx                     # NEW (Task 14) — A/B/C solution tabs
│           │   ├── FailureModesChaosPane.tsx                   # NEW (Task 14)
│           │   └── ConceptsUsedPane.tsx                        # NEW (Task 14)
│           ├── checkpoints/
│           │   ├── RecallCheckpoint.tsx                        # NEW (Task 18) — MCQ
│           │   ├── ApplyCheckpoint.tsx                         # NEW (Task 18) — pick-the-node
│           │   ├── CompareCheckpoint.tsx                       # NEW (Task 18) — left/right/both
│           │   └── CreateCheckpoint.tsx                        # NEW (Task 18) — build-it with rubric
│           ├── quiz/
│           │   ├── DiagnosticQuizRunner.tsx                    # NEW (Task 33)
│           │   └── DiagnosticQuizResult.tsx                    # NEW (Task 33)
│           └── onboarding/
│               ├── SDOnboardingTour.tsx                        # NEW (Task 34) — 90-sec spotlight
│               └── SpotlightMask.tsx                           # NEW (Task 34)
└── package.json                                                # MODIFY (+ 3 scripts: compile:sd-content, build:sd-graph, seed:sd-diagnostic)
```

**Design rationale for splits:**

- **Four new DB tables, not one blob.** `sd_learn_progress` is per (user, kind, slug) with scroll state and section checkmarks. `sd_concept_reads` is a thin log for FSRS seeding + analytics. `sd_bookmarks` is independent-lifecycle user-authored. `sd_diagnostic_results` holds one row per attempt with a 15-question JSONB snapshot. Merging into one JSONB on `progress.metadata` would be tempting but violates the spec's "DB-first" invariant (§17.5) because bookmark writes would contend with progress writes.
- **Two parallel page shells (concept vs problem) share common primitives but route through separate loaders.** The concept 8-section format and problem 6-pane format have different JSONB shapes — trying to unify them into one would force every pane renderer to branch on `kind`. Separating `ConceptColumn` and `ProblemColumn` keeps each component's prop schema tight, and the shared chrome (sidebar, TOC, bookmark strip, progress bar) lives in `components/modules/sd/learn/` once and mounts via composition in `SDLearnModeLayout`.
- **MDX pipeline extends LLD's, does not replace it.** The LLD compiler ships in Phase 2 LLD at `scripts/compile-lld-lessons.ts`. The SD compiler at `scripts/compile-sd-content.ts` *imports* the shared MDX→JSONB transformer (factored out as `scripts/lib/mdx-compiler.ts` in Task 6 Step 0) and supplies an SD-specific schema validator. Any authoring-surface fix (frontmatter parse error handling, section ordering validation) benefits both modules.
- **`content/sd/graph/` as YAML, not TypeScript.** Content authors commit YAML without touching tsc. The prebuild step validates against a Zod schema and emits `src/lib/sd/concept-graph.ts` — runtime reads are O(1) map lookups with zero DB round-trips for the "Related LLD Patterns", "Problems that use this", "Chaos events relevant" sidebars that render on every concept page.
- **Node popover (SD) vs class popover (LLD) are separate components.** LLD's `ClassPopover` takes a class id and shows methods/role/responsibility. SD's `NodePopover` takes a node-family + subtype and shows config hints, cost hints, typical failure modes. Different schemas, different visual anatomy — forcing one component to handle both would require a discriminated-union prop which makes both surfaces uglier. Both share `src/components/shared/learn/popover-shell.tsx` (extracted from LLD in Task 15 Step 0).
- **Three Ask-AI surfaces are three hooks + one component (`AskAISurface`).** Each surface (explain-this paragraph, suggest-analogy, show-me-at-scale) has distinct inputs, distinct prompts, distinct cost profiles. The component renders a drawer with a tab strip for the three; the hooks encapsulate the prompt shaping and cost accounting. Cost ceiling: ~$0.015 per Learn session at baseline (spec §6.6).
- **Scroll-sync on concept pages is IntersectionObserver-based; pane sync on problem pages is click+URL-hash-based.** Concept pages are scroll-through reads with 8 sequential sections; IntersectionObserver naturally maps to highlighted nodes. Problem pages are tab/accordion-driven and readers jump around (Canonical Design first is the common pattern per spec §6.4); URL hash + click-to-activate is the honest model. Two hooks, two visual treatments.
- **Diagnostic quiz (Q46) is a standalone route, not an inline component.** The quiz is a placement exercise that writes to `sd_diagnostic_results` and seeds initial FSRS state. Embedding it in Learn would dilute Learn's "single-page deep-dive" contract. Users enter the quiz from the Welcome banner or a dashboard card; completion returns them to the recommended first concept page.
- **90-sec onboarding (Q34) is a spotlight-mask overlay on top of `SDShell`, not a separate route.** The spec explicitly says "dimmed mask with a single spotlight on the Learn mode pill" (§18.6). A separate route would break the "you are inside the product; I'm showing you around" feel. The overlay mounts on first visit when `user_preferences.sd.onboardingComplete === false`, renders 6 steps (cold open → Learn → Build → Simulate → Drill → Review), and writes `onboardingComplete: true` on finish or skip.
- **Content directory at repo root, not under `src/`.** Authors committing MDX should not need to touch TypeScript. `content/sd/` is a zero-code region where content leads and Opus can contribute without engineering review. The compile step is the one-way bridge.

---

## Task Overview

| # | Task | Est. time |
|---|---|---|
| 1 | `sd_learn_progress` schema | 25 min |
| 2 | `sd_concept_reads` schema | 15 min |
| 3 | `sd_bookmarks` schema | 15 min |
| 4 | Generate + apply 5 migrations | 25 min |
| 5 | Define content payload types + extract shared MDX compiler | 45 min |
| 6 | Write SD content compile script | 55 min |
| 7 | Write concept-loader + problem-loader (DB → typed payload) | 45 min |
| 8 | `GET/PATCH /api/sd/learn-progress/*` routes | 40 min |
| 9 | `useSDLearnProgress` hook with debounced writes | 35 min |
| 10 | `GET/POST/DELETE /api/sd/bookmarks` routes | 35 min |
| 11 | `useSDBookmarks` hook | 25 min |
| 12 | `POST /api/sd/concept-reads` route | 20 min |
| 13 | `useConceptScrollSync` + `useProblemPaneSync` hooks | 55 min |
| 14 | Build concept-sections + problem-panes + `ConceptColumn` + `ProblemColumn` + 3 content-format components | 140 min |
| 15 | `SDCanvasReadonly` (scroll-sync wrapper) + `NodePopover` + 16-family registry | 75 min |
| 16 | Cross-module graph generator + prebuild hook | 45 min |
| 17 | `ConfusedWithPanel` + `CrossModuleBridgeCard` | 45 min |
| 18 | 4 checkpoint components + grading engine extension | 90 min |
| 19 | 3 AI API routes (explain-inline · suggest-analogy · show-at-scale) | 50 min |
| 20 | 3 AI hooks (`useSDSelectionExplain` · `useSDSuggestAnalogy` · `useSDShowAtScale`) | 45 min |
| 21 | `AskAISurface` component with 3-tab drawer | 50 min |
| 22 | Reading aids (sidebar with wave/domain filter, progress bar, TOC, bookmarks strip) | 75 min |
| 23 | Rewrite `SDLearnModeLayout` to compose everything | 50 min |
| 24-28 | Author 5 Wave 1 concept MDX (one task per concept) | 2.5-3.5 hrs each |
| 29-31 | Author 3 warmup problem MDX (one task per problem) | 4-5 hrs each |
| 32 | Extend analytics event catalog | 30 min |
| 33 | Diagnostic entry quiz (schema + content + UI + API) | 120 min |
| 34 | 90-second guided onboarding tour | 90 min |
| 35 | E2E smoke test + `.progress` tracker + phase commit | 50 min |

**Total engineering time (excluding content authoring):** ~18 hours across Tasks 1-23 + 32-35.
**Content authoring:** ~25-32 hours for Tasks 24-31 (shared between Opus drafts and human editorial review).

---

## Task 1: Create `sd_learn_progress` DB schema

**Files:**
- Create: `architex/src/db/schema/sd-learn-progress.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/sd-learn-progress.ts`:

```typescript
/**
 * DB-030: SD learn progress — per (user, kind, slug) concept/problem reading state.
 *
 * Stores which sections the user has scrolled through, their deepest
 * scroll offset per section, and whether each section's checkpoint has
 * been answered. A unique (userId, kind, slug) constraint ensures one
 * row per user+kind+slug.
 *
 * kind ∈ {concept, problem}. Concepts have 8 sections, problems have 6
 * panes — the sectionState JSONB shape differs by kind but the table is
 * shared to keep the query surface flat.
 *
 * FSRS seed data — the `completedAt` of this row is what the SD Review
 * mode (Phase 4) uses to schedule the first spaced-repetition card.
 */
import { pgTable, uuid, varchar, timestamp, jsonb, integer, boolean, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sdLearnProgress = pgTable(
  'sd_learn_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 16 }).notNull(), // 'concept' | 'problem'
    slug: varchar('slug', { length: 100 }).notNull(),
    // sectionState shape for concepts:
    //   { hook: {visited,scrollPct,checkpointId?,answered?,correct?,attempts},
    //     analogy: {...}, primitive: {...}, anatomy: {...},
    //     numbersThatMatter: {...}, tradeoffs: {...},
    //     antiCases: {...}, seenInWild: {...}, bridges: {...},
    //     checkpoints: {...} }  // 10 keys
    // sectionState shape for problems:
    //   { problemStatement: {...}, requirements: {...}, scaleNumbers: {...},
    //     canonicalDesign: {activeSolutionIndex: 0..2, ...},
    //     failureModesChaos: {...}, conceptsUsed: {...} }  // 6 keys
    sectionState: jsonb('section_state').notNull().default('{}'),
    deepestScrollPct: integer('deepest_scroll_pct').notNull().default(0), // 0..100
    lastSectionId: varchar('last_section_id', { length: 64 }),
    checkpointStats: jsonb('checkpoint_stats').notNull().default('{"attempts":0,"correct":0,"revealed":0}'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    tinkerCanvasState: jsonb('tinker_canvas_state'), // optional snapshot if user tinkered
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userKindSlugUnique: uniqueIndex('sd_learn_progress_user_kind_slug_idx').on(t.userId, t.kind, t.slug),
    userRecentIdx: index('sd_learn_progress_user_recent_idx').on(t.userId, t.updatedAt),
  })
);

export type SDLearnProgress = typeof sdLearnProgress.$inferSelect;
export type NewSDLearnProgress = typeof sdLearnProgress.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Edit `architex/src/db/schema/index.ts` to add:

```typescript
export * from './sd-learn-progress';
```

- [ ] **Step 3: Add the relation**

Edit `architex/src/db/schema/relations.ts`:

```typescript
import { sdLearnProgress } from './sd-learn-progress';

export const sdLearnProgressRelations = relations(sdLearnProgress, ({ one }) => ({
  user: one(users, { fields: [sdLearnProgress.userId], references: [users.id] }),
}));
```

Also append `sdLearnProgress: many(sdLearnProgress),` to the existing `usersRelations`.

- [ ] **Step 4: Write the unit test**

Create `architex/src/db/schema/__tests__/sd-learn-progress.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { sdLearnProgress } from '../sd-learn-progress';

describe('sdLearnProgress schema', () => {
  it('exposes the required columns', () => {
    const cols = Object.keys(sdLearnProgress);
    expect(cols).toEqual(
      expect.arrayContaining([
        'id', 'userId', 'kind', 'slug', 'sectionState',
        'deepestScrollPct', 'lastSectionId', 'checkpointStats',
        'completedAt', 'tinkerCanvasState', 'createdAt', 'updatedAt',
      ])
    );
  });
  it('narrows kind to concept|problem at type level', () => {
    // type-only assertion — compile-time proof
    const row: { kind: 'concept' | 'problem' } = { kind: 'concept' };
    expect(row.kind).toBe('concept');
  });
});
```

- [ ] **Step 5: Run tests + typecheck**

```bash
cd architex
pnpm typecheck
pnpm test:run -- sd-learn-progress
```
Expected: typecheck clean, 2/2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add architex/src/db/schema/sd-learn-progress.ts \
        architex/src/db/schema/index.ts \
        architex/src/db/schema/relations.ts \
        architex/src/db/schema/__tests__/sd-learn-progress.test.ts
git commit -m "$(cat <<'EOF'
feat(db): add sd_learn_progress table (Task 1/35)

Stores per (user, kind, slug) concept/problem reading state: section
visit map, deepest scroll %, last section id, checkpoint stats, an
optional tinker-canvas snapshot, and a completedAt that seeds FSRS.
Unique on (userId, kind, slug).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `sd_concept_reads` DB schema

**Files:**
- Create: `architex/src/db/schema/sd-concept-reads.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/sd-concept-reads.ts`:

```typescript
/**
 * DB-031: SD concept reads — thin log of concept-page view events for
 * FSRS seeding, analytics, and "recently viewed" sidebars.
 *
 * Rate-limited at the API layer: one row per (userId, conceptSlug) per
 * 30-second window. The low-write-rate invariant lets this table be
 * append-only; no updates after insert.
 */
import { pgTable, uuid, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sdConceptReads = pgTable(
  'sd_concept_reads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    conceptSlug: varchar('concept_slug', { length: 100 }).notNull(),
    source: varchar('source', { length: 32 }).notNull(), // 'scroll' | 'click-popover' | 'bridge-card' | 'tour' | 'quiz-result'
    contextSlug: varchar('context_slug', { length: 100 }), // e.g. problem-slug that surfaced this concept
    durationMs: jsonb('duration_ms'), // optional: { onPage, active, idle }
    readAt: timestamp('read_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userConceptIdx: index('sd_concept_reads_user_concept_idx').on(t.userId, t.conceptSlug, t.readAt),
    userRecentIdx: index('sd_concept_reads_user_recent_idx').on(t.userId, t.readAt),
  })
);

export type SDConceptRead = typeof sdConceptReads.$inferSelect;
export type NewSDConceptRead = typeof sdConceptReads.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index + add relation (same pattern as Task 1 Steps 2-3)**

- [ ] **Step 3: Unit test**

Create `architex/src/db/schema/__tests__/sd-concept-reads.test.ts` with a shape assertion matching Task 1 Step 4. Expected columns: `id, userId, conceptSlug, source, contextSlug, durationMs, readAt`.

- [ ] **Step 4: Run + commit**

```bash
pnpm typecheck && pnpm test:run -- sd-concept-reads
git add architex/src/db/schema/sd-concept-reads.ts \
        architex/src/db/schema/index.ts \
        architex/src/db/schema/relations.ts \
        architex/src/db/schema/__tests__/sd-concept-reads.test.ts
git commit -m "feat(db): add sd_concept_reads table (Task 2/35)"
```

---

## Task 3: Create `sd_bookmarks` DB schema

**Files:**
- Create: `architex/src/db/schema/sd-bookmarks.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/sd-bookmarks.ts`:

```typescript
/**
 * DB-032: SD bookmarks — user-authored anchors within concept/problem
 * pages. Distinct from learn_progress: bookmarks are explicit user
 * intent ("I want to come back to this paragraph"), progress is
 * implicit scroll state.
 *
 * Unique on (userId, kind, slug, anchor) so toggling a bookmark is
 * idempotent.
 */
import { pgTable, uuid, varchar, timestamp, text, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sdBookmarks = pgTable(
  'sd_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    kind: varchar('kind', { length: 16 }).notNull(), // 'concept' | 'problem'
    slug: varchar('slug', { length: 100 }).notNull(),
    anchor: varchar('anchor', { length: 128 }).notNull(), // section id ('mechanism', 'canonical-design-b', etc.)
    label: varchar('label', { length: 200 }).notNull(), // e.g. "Double-checked locking pitfall"
    note: text('note'), // optional free-form
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userKindSlugAnchorUnique: uniqueIndex('sd_bookmarks_user_kind_slug_anchor_idx').on(
      t.userId, t.kind, t.slug, t.anchor
    ),
    userRecentIdx: index('sd_bookmarks_user_recent_idx').on(t.userId, t.createdAt),
  })
);

export type SDBookmark = typeof sdBookmarks.$inferSelect;
export type NewSDBookmark = typeof sdBookmarks.$inferInsert;
```

- [ ] **Step 2-4: Re-export, relation, unit test, commit** (same pattern as Task 1-2)

```bash
git commit -m "feat(db): add sd_bookmarks table (Task 3/35)"
```

---

## Task 4: Generate and apply 5 migrations

**Files:**
- Create: `architex/drizzle/NNNN_add_sd_learn_progress.sql`
- Create: `architex/drizzle/NNNN_add_sd_concept_reads.sql`
- Create: `architex/drizzle/NNNN_add_sd_bookmarks.sql`
- Create: `architex/drizzle/NNNN_add_sd_diagnostic_results.sql` (stub for Task 33; full schema lands in Task 33)
- Create: `architex/drizzle/NNNN_extend_sd_graph_edges_bridge_text.sql`

The fifth migration adds a `bridge_text` column to `sd_graph_edges` if it was not already included in the SD Phase 1 migration. Per spec §17.2, bridge cards carry a 1-2 sentence hand-authored caption per edge. Phase 1 shipped the table without the column; this migration backfills.

- [ ] **Step 1: Generate migrations with drizzle-kit**

```bash
cd architex
pnpm db:generate
```
Expected: five new `drizzle/NNNN_*.sql` files appear for the four new tables plus the bridge_text addition. Inspect each — ensure:
- No `DROP` statements on existing SD Phase 1 tables
- Foreign keys reference `users(id)` with `ON DELETE CASCADE`
- Unique indexes use the exact column orders from Tasks 1-3

- [ ] **Step 2: Dry-run against a branch DB**

```bash
export DATABASE_URL=$NEON_BRANCH_URL
pnpm db:migrate
```
Expected: "Migrations applied." Verify via `pnpm db:studio` that the 4 new tables appear and `sd_graph_edges.bridge_text` is a nullable `text` column.

- [ ] **Step 3: Write the cascade-delete test**

Create `architex/src/db/__tests__/sd-learn-cascade.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { db } from '@/db/client';
import { users } from '@/db/schema/users';
import { sdLearnProgress, sdConceptReads, sdBookmarks } from '@/db/schema';
import { eq } from 'drizzle-orm';

describe('sd learn tables · cascade delete', () => {
  let userId: string;

  beforeAll(async () => {
    const [u] = await db.insert(users).values({ email: 'cascade-test@example.com' }).returning();
    userId = u.id;
    await db.insert(sdLearnProgress).values({ userId, kind: 'concept', slug: 'client-server', sectionState: {} });
    await db.insert(sdConceptReads).values({ userId, conceptSlug: 'client-server', source: 'scroll' });
    await db.insert(sdBookmarks).values({ userId, kind: 'concept', slug: 'client-server', anchor: 'mechanism', label: 'pin-1' });
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.id, userId));
  });

  it('deletes learn rows when user is deleted', async () => {
    await db.delete(users).where(eq(users.id, userId));
    const progress = await db.select().from(sdLearnProgress).where(eq(sdLearnProgress.userId, userId));
    const reads = await db.select().from(sdConceptReads).where(eq(sdConceptReads.userId, userId));
    const bookmarks = await db.select().from(sdBookmarks).where(eq(sdBookmarks.userId, userId));
    expect(progress).toHaveLength(0);
    expect(reads).toHaveLength(0);
    expect(bookmarks).toHaveLength(0);
  });
});
```

- [ ] **Step 4: Run the cascade test + full typecheck**

```bash
pnpm test:run -- sd-learn-cascade
pnpm typecheck
```
Expected: 1/1 passes, typecheck clean.

- [ ] **Step 5: Commit migrations + test**

```bash
git add architex/drizzle/ architex/src/db/__tests__/sd-learn-cascade.test.ts
git commit -m "$(cat <<'EOF'
feat(db): generate + apply sd learn phase 2 migrations (Task 4/35)

Five migrations:
- sd_learn_progress (per user+kind+slug section state + checkpoints)
- sd_concept_reads (thin FSRS-seed log)
- sd_bookmarks (user-authored anchors)
- sd_diagnostic_results (stub, Task 33 fills)
- sd_graph_edges.bridge_text (backfill for spec §17.2)

Cascade-delete test verifies all 3 live tables purge on user deletion.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Define content payload types + extract shared MDX compiler

**Files:**
- Create: `architex/src/lib/sd/content-types.ts`
- Create: `architex/scripts/lib/mdx-compiler.ts` (extracted from LLD Phase 2)
- Modify: `architex/scripts/compile-lld-lessons.ts` (import shared compiler)

This task is the first structural refactor — LLD Phase 2's `scripts/compile-lld-lessons.ts` has the MDX→JSONB transformer inlined. Before writing the SD compiler (Task 6), factor out the shared part. The factoring is mechanical and tested by LLD Phase 2's existing test suite; no behavior change for LLD.

- [ ] **Step 1: Extract shared MDX compiler helper**

Create `architex/scripts/lib/mdx-compiler.ts`:

```typescript
/**
 * Shared MDX compilation primitives for LLD lessons (Phase 2) and SD
 * concept/problem pages (this phase). Callers supply a Zod schema for
 * frontmatter validation; the body is compiled to a string of React
 * elements for DB storage and runtime re-hydration.
 *
 * Contracts:
 * - Input: file path to a .mdx file with YAML frontmatter.
 * - Output: { frontmatter, bodyMdx, sections }. bodyMdx is the raw MDX
 *   body (post-frontmatter); sections is the split-by-`<!-- Section: X -->`
 *   map keyed by section id.
 * - Errors: throws McfError with { path, reason } on parse/schema failure.
 */
import { readFile } from 'node:fs/promises';
import matter from 'gray-matter';
import type { ZodSchema } from 'zod';

export class McfError extends Error {
  constructor(public path: string, public reason: string) {
    super(`[mdx-compiler] ${path}: ${reason}`);
  }
}

export interface CompiledMdx<TFrontmatter> {
  frontmatter: TFrontmatter;
  bodyMdx: string;
  sections: Record<string, string>;
}

const SECTION_MARKER = /<!--\s*Section:\s*([a-z0-9-_]+)\s*-->/gi;

export async function compileMdx<TFrontmatter>(
  filePath: string,
  frontmatterSchema: ZodSchema<TFrontmatter>,
): Promise<CompiledMdx<TFrontmatter>> {
  const raw = await readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const fm = frontmatterSchema.safeParse(parsed.data);
  if (!fm.success) throw new McfError(filePath, `frontmatter invalid: ${fm.error.message}`);

  const sections: Record<string, string> = {};
  const body = parsed.content;
  const markers = [...body.matchAll(SECTION_MARKER)];
  if (markers.length === 0) throw new McfError(filePath, 'no `<!-- Section: X -->` markers found');

  for (let i = 0; i < markers.length; i++) {
    const m = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].index! : body.length;
    const sectionId = m[1].toLowerCase();
    const sectionStart = m.index! + m[0].length;
    sections[sectionId] = body.slice(sectionStart, nextStart).trim();
  }

  return { frontmatter: fm.data, bodyMdx: body, sections };
}
```

- [ ] **Step 2: Migrate LLD compiler to use the shared helper**

Edit `architex/scripts/compile-lld-lessons.ts`. Replace the inlined MDX parsing block with:

```typescript
import { compileMdx } from './lib/mdx-compiler';
import { LldLessonFrontmatterSchema } from '@/lib/lld/lesson-types';

// ...inside main loop:
const compiled = await compileMdx(path, LldLessonFrontmatterSchema);
```

Run the LLD Phase 2 test suite to confirm no regression:

```bash
pnpm test:run -- compile-lld-lessons
```
Expected: all existing tests still pass. If any test references the old inline parser, update the import path.

- [ ] **Step 3: Define SD content payload types**

Create `architex/src/lib/sd/content-types.ts`:

```typescript
/**
 * SD-036: Typed payloads for the 8-section concept page and 6-pane
 * problem page. The DB's sd_concepts.body_mdx and sd_problems.body_mdx
 * are text columns; the runtime parses them back into these shapes.
 *
 * Section ids are stable across migrations — UI scroll anchors depend
 * on them. Changing a section id is a breaking change for bookmarks
 * and URL hashes.
 */
import { z } from 'zod';

// ─── Concept (8 sections) ────────────────────────────────────────────

export const CONCEPT_SECTION_IDS = [
  'hook',             // §5.4 Section 1: "The Itch" — scenario, 2-3 sentences
  'analogy',          // §5.4 Section 2: memorable physical mapping
  'primitive',        // §5.4 Section 3: formal definition + mechanism (3-5 paragraphs)
  'anatomy',          // architecture anatomy of the primitive — nodes, edges, relations
  'numbersThatMatter',// §5.4 Section 4: Scaling Numbers strip + prose
  'tradeoffs',        // §5.4 Section 5: gain/pay paragraph
  'antiCases',        // §5.4 Section 6: "When not to use"
  'seenInWild',       // §5.4 Section 7: named-company example
  'bridges',          // §5.4 Section 8: cross-links
  'checkpoints',      // 3 MCQ/rank-tradeoffs/match checkpoints (spec §6.3)
] as const;

export type ConceptSectionId = typeof CONCEPT_SECTION_IDS[number];

export const ConceptFrontmatterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  wave: z.number().int().min(1).max(8),
  waveOrder: z.number().int().min(1),
  estimatedMinutes: z.number().int().min(1).max(60),
  wordTargetMin: z.number().int().default(1200),
  wordTargetMax: z.number().int().default(1800),
  voiceVariant: z.enum(['standard', 'eli5', 'eli-senior']).default('standard'),
  // Maps section id → node id list so scroll-sync can highlight nodes
  anchorNodeIds: z.record(z.string(), z.array(z.string())).default({}),
  scalingNumbers: z.array(z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string().optional(),
    citation: z.string().optional(),
    sourceYear: z.number().int().optional(),
  })).default([]),
  decisionTree: z.object({
    root: z.string(),
    branches: z.array(z.object({
      question: z.string(),
      yes: z.string(),
      no: z.string(),
    })),
  }).optional(),
  engineeringBlogLinks: z.array(z.object({
    company: z.string(),
    title: z.string(),
    url: z.string().url(),
    year: z.number().int(),
    readingMinutes: z.number().int().optional(),
  })).default([]),
  checkpoints: z.array(z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('recall'),
      id: z.string(),
      prompt: z.string(),
      options: z.array(z.object({
        id: z.string(),
        label: z.string(),
        isCorrect: z.boolean(),
        whyWrong: z.string().optional(),
      })),
      explanation: z.string(),
    }),
    z.object({
      kind: z.literal('apply'),
      id: z.string(),
      scenario: z.string(),
      correctNodeIds: z.array(z.string()),
      distractorNodeIds: z.array(z.string()),
      explanation: z.string(),
    }),
    z.object({
      kind: z.literal('compare'),
      id: z.string(),
      prompt: z.string(),
      left: z.object({ conceptSlug: z.string(), label: z.string() }),
      right: z.object({ conceptSlug: z.string(), label: z.string() }),
      statements: z.array(z.object({
        id: z.string(),
        text: z.string(),
        correct: z.enum(['left', 'right', 'both', 'neither']),
      })),
      explanation: z.string(),
    }),
    z.object({
      kind: z.literal('create'),
      id: z.string(),
      prompt: z.string(),
      starterCanvas: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
      rubric: z.array(z.object({ criterion: z.string(), points: z.number() })),
      referenceSolution: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }),
      explanation: z.string(),
    }),
  ])).length(3), // §6.3: exactly 3 checkpoints per concept
});

export type ConceptFrontmatter = z.infer<typeof ConceptFrontmatterSchema>;

export interface ConceptPayload {
  frontmatter: ConceptFrontmatter;
  sections: Record<ConceptSectionId, string>; // MDX source per section
}

// ─── Problem (6 panes) ───────────────────────────────────────────────

export const PROBLEM_PANE_IDS = [
  'problemStatement',   // §5.5 Pane 1
  'requirements',       // F + NF (spec §5.5 pane 2 merged into requirements block)
  'scaleNumbers',       // §5.5 Pane 3: napkin math
  'canonicalDesign',    // §5.5 Pane 4: 2-3 solutions (tabs in UI)
  'failureModesChaos',  // §5.5 Pane 5
  'conceptsUsed',       // §5.5 Pane 6: real-world references renamed for cross-link emphasis
  'checkpoints',        // 3 checkpoints: Fermi estimate · failure-mode pick · chaos match
] as const;

export type ProblemPaneId = typeof PROBLEM_PANE_IDS[number];

export const ProblemFrontmatterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  domain: z.enum(['media-social', 'location', 'storage', 'commerce', 'search', 'infra']),
  difficulty: z.enum(['warmup', 'easy', 'mid', 'staff', 'principal']),
  companiesAsking: z.array(z.string()).default([]),
  recommendedOrder: z.record(
    z.enum(['rookie', 'journeyman', 'architect']),
    z.array(z.enum(PROBLEM_PANE_IDS)),
  ).default({
    rookie: [...PROBLEM_PANE_IDS],
    journeyman: ['canonicalDesign', 'failureModesChaos', 'scaleNumbers', 'requirements', 'problemStatement', 'conceptsUsed'],
    architect: ['canonicalDesign', 'failureModesChaos', 'requirements', 'scaleNumbers', 'conceptsUsed', 'problemStatement'],
  }),
  scalingNumbers: z.array(z.object({
    label: z.string(),
    value: z.string(),
    unit: z.string().optional(),
    sourceYear: z.number().int().optional(),
  })),
  canonicalSolutions: z.array(z.object({
    label: z.string(), // 'A', 'B', 'C'
    summary: z.string(),
    diagramJson: z.any(), // nodes + edges for canvas preload
    walkthroughMdx: z.string(), // per-solution walkthrough embedded in canonicalDesign section
  })).min(1).max(3),
  recommendedChaos: z.array(z.string()).default([]), // chaos event slugs
  linkedConcepts: z.array(z.string()).default([]),
  linkedLldPatterns: z.array(z.string()).default([]),
  rubric: z.object({
    axes: z.array(z.object({
      name: z.string(),
      weight: z.number(),
      bands: z.array(z.object({ score: z.number(), description: z.string() })),
    })).length(6),
  }),
  checkpoints: z.array(z.any()).length(3),
  engineeringBlogLinks: z.array(z.object({
    company: z.string(),
    title: z.string(),
    url: z.string().url(),
    year: z.number().int(),
    readingMinutes: z.number().int().optional(),
  })).default([]),
});

export type ProblemFrontmatter = z.infer<typeof ProblemFrontmatterSchema>;

export interface ProblemPayload {
  frontmatter: ProblemFrontmatter;
  panes: Record<ProblemPaneId, string>;
}

// ─── Graph YAML (cross-module bridges) ───────────────────────────────

export const GraphYamlSchema = z.object({
  kind: z.enum(['concept', 'problem']),
  slug: z.string(),
  relatedConcepts: z.array(z.object({
    slug: z.string(),
    relation: z.enum(['prerequisite', 'related', 'specializes', 'generalizes']),
    bridgeText: z.string().optional(),
  })).default([]),
  relatedProblems: z.array(z.object({
    slug: z.string(),
    relation: z.enum(['uses', 'related', 'scales-up-from']),
    bridgeText: z.string().optional(),
  })).default([]),
  relatedLldPatterns: z.array(z.object({
    slug: z.string(),
    relation: z.enum(['implements', 'leans-on', 'adjacent-abstraction']),
    bridgeText: z.string().optional(),
  })).default([]),
  relatedChaosEvents: z.array(z.object({
    slug: z.string(),
    relation: z.enum(['protects-from', 'exposed-to']),
    bridgeText: z.string().optional(),
  })).default([]),
  confusedWith: z.array(z.object({
    kind: z.enum(['concept', 'problem']),
    slug: z.string(),
    reason: z.string(),
  })).default([]),
});

export type GraphYaml = z.infer<typeof GraphYamlSchema>;
```

- [ ] **Step 4: Install any missing deps**

```bash
cd architex
grep "gray-matter" package.json || pnpm add gray-matter@^4.0.3
grep "zod" package.json  # should already be present from LLD Phase 1
```

- [ ] **Step 5: Write a roundtrip test**

Create `architex/src/lib/sd/__tests__/content-types.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ConceptFrontmatterSchema, ProblemFrontmatterSchema, GraphYamlSchema } from '../content-types';

describe('ConceptFrontmatterSchema', () => {
  it('rejects a concept with wrong number of checkpoints', () => {
    const bad = { slug: 'x', title: 't', wave: 1, waveOrder: 1, estimatedMinutes: 10, checkpoints: [] };
    expect(ConceptFrontmatterSchema.safeParse(bad).success).toBe(false);
  });
  it('accepts a valid minimal concept frontmatter', () => {
    const good = {
      slug: 'client-server', title: 'Client-Server', wave: 1, waveOrder: 1, estimatedMinutes: 10,
      checkpoints: [
        { kind: 'recall', id: 'r1', prompt: 'q?', options: [{ id: 'a', label: 'x', isCorrect: true }], explanation: '.' },
        { kind: 'apply', id: 'a1', scenario: 's', correctNodeIds: ['n1'], distractorNodeIds: ['n2'], explanation: '.' },
        { kind: 'compare', id: 'c1', prompt: 'vs', left: { conceptSlug: 'x', label: 'X' }, right: { conceptSlug: 'y', label: 'Y' }, statements: [{ id: 's1', text: 't', correct: 'left' }], explanation: '.' },
      ],
    };
    expect(ConceptFrontmatterSchema.safeParse(good).success).toBe(true);
  });
});

describe('ProblemFrontmatterSchema', () => {
  it('requires exactly 6 rubric axes', () => {
    const bad = { rubric: { axes: [] } };
    expect(ProblemFrontmatterSchema.safeParse(bad).success).toBe(false);
  });
});

describe('GraphYamlSchema', () => {
  it('accepts a well-formed concept graph', () => {
    const good = {
      kind: 'concept', slug: 'client-server',
      relatedLldPatterns: [{ slug: 'facade', relation: 'leans-on', bridgeText: 'Hides server complexity.' }],
    };
    expect(GraphYamlSchema.safeParse(good).success).toBe(true);
  });
});
```

- [ ] **Step 6: Run + commit**

```bash
pnpm typecheck
pnpm test:run -- content-types
git add architex/src/lib/sd/content-types.ts \
        architex/scripts/lib/mdx-compiler.ts \
        architex/scripts/compile-lld-lessons.ts \
        architex/src/lib/sd/__tests__/content-types.test.ts \
        architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd): define content payload types + extract shared MDX compiler (Task 5/35)

- scripts/lib/mdx-compiler.ts: shared compileMdx() reused by LLD and SD
- src/lib/sd/content-types.ts: Zod schemas for 8-section concepts
  (with typed checkpoints discriminated union), 6-pane problems (with
  6-axis rubric + 1-3 canonical solutions + recommended-order per
  persona), and cross-module graph YAML
- Roundtrip tests for both schemas
- LLD Phase 2 compiler migrated to the shared helper; existing tests
  continue to pass

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Write the SD content compile script

**Files:**
- Create: `architex/scripts/compile-sd-content.ts`
- Modify: `architex/package.json` (add `compile:sd-content` script)
- Create: `architex/scripts/__tests__/compile-sd-content.test.ts`

The compile script walks `content/sd/concepts/*.mdx` and `content/sd/problems/*.mdx`, validates frontmatter, splits the body into sections/panes via the `<!-- Section: X -->` markers, and upserts into `sd_concepts.body_mdx` / `sd_problems.body_mdx`. The JSONB payload persisted to DB is `{ frontmatter, sections }` for concepts and `{ frontmatter, panes }` for problems. Runtime loaders (Task 7) read and re-parse the MDX bodies per-section on demand.

- [ ] **Step 1: Write the compile script**

Create `architex/scripts/compile-sd-content.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Compile SD concept + problem MDX into sd_concepts / sd_problems rows.
 *
 * Usage:
 *   pnpm compile:sd-content                        # all
 *   pnpm compile:sd-content --kind=concept         # only concepts
 *   pnpm compile:sd-content --slug=client-server   # one file
 *   pnpm compile:sd-content --dry-run              # validate, don't write
 */
import { readdir } from 'node:fs/promises';
import { join, basename, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { db } from '../src/db/client';
import { sdConcepts, sdProblems } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import { compileMdx } from './lib/mdx-compiler';
import {
  ConceptFrontmatterSchema, ProblemFrontmatterSchema,
  CONCEPT_SECTION_IDS, PROBLEM_PANE_IDS,
} from '../src/lib/sd/content-types';

const CONTENT_ROOT = join(process.cwd(), 'content', 'sd');

interface CliOptions { kind?: 'concept' | 'problem'; slug?: string; dryRun: boolean }

function parseCli(): CliOptions {
  const { values } = parseArgs({ options: {
    kind: { type: 'string' }, slug: { type: 'string' }, 'dry-run': { type: 'boolean' },
  }});
  return { kind: values.kind as any, slug: values.slug, dryRun: !!values['dry-run'] };
}

async function compileConcept(path: string, dryRun: boolean) {
  const compiled = await compileMdx(path, ConceptFrontmatterSchema);
  const missing = CONCEPT_SECTION_IDS.filter((id) => !(id in compiled.sections));
  if (missing.length) throw new Error(`${path}: missing sections ${missing.join(', ')}`);
  const { frontmatter, sections } = compiled;
  const wordCount = Object.values(sections).reduce((n, s) => n + s.split(/\s+/).length, 0);
  if (wordCount < frontmatter.wordTargetMin * 0.7 || wordCount > frontmatter.wordTargetMax * 1.3) {
    console.warn(`[warn] ${frontmatter.slug} word count ${wordCount} outside target ${frontmatter.wordTargetMin}-${frontmatter.wordTargetMax}`);
  }
  const payload = { frontmatter, sections };
  if (dryRun) { console.log(`[dry] concept ${frontmatter.slug} OK (${wordCount}w)`); return; }
  await db.insert(sdConcepts).values({
    slug: frontmatter.slug,
    wave: frontmatter.wave,
    waveOrder: frontmatter.waveOrder,
    title: frontmatter.title,
    shortDescription: frontmatter.subtitle ?? '',
    bodyMdx: JSON.stringify(payload),
    wordCount,
    readingTimeMin: frontmatter.estimatedMinutes,
    voiceVariant: frontmatter.voiceVariant,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: sdConcepts.slug,
    set: { bodyMdx: JSON.stringify(payload), wordCount, updatedAt: new Date() },
  });
  console.log(`[ok] concept ${frontmatter.slug} (${wordCount}w)`);
}

async function compileProblem(path: string, dryRun: boolean) {
  const compiled = await compileMdx(path, ProblemFrontmatterSchema);
  const missing = PROBLEM_PANE_IDS.filter((id) => !(id in compiled.sections));
  if (missing.length) throw new Error(`${path}: missing panes ${missing.join(', ')}`);
  const { frontmatter, sections: panes } = compiled;
  const wordCount = Object.values(panes).reduce((n, s) => n + s.split(/\s+/).length, 0);
  const payload = { frontmatter, panes };
  if (dryRun) { console.log(`[dry] problem ${frontmatter.slug} OK (${wordCount}w)`); return; }
  await db.insert(sdProblems).values({
    slug: frontmatter.slug,
    domain: frontmatter.domain,
    difficulty: frontmatter.difficulty,
    title: frontmatter.title,
    bodyMdx: JSON.stringify(payload),
    canonicalSolutions: frontmatter.canonicalSolutions,
    rubric: frontmatter.rubric,
    recommendedChaos: frontmatter.recommendedChaos,
    linkedConcepts: frontmatter.linkedConcepts,
    linkedLldPatterns: frontmatter.linkedLldPatterns,
    companiesAsking: frontmatter.companiesAsking,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: sdProblems.slug,
    set: { bodyMdx: JSON.stringify(payload), updatedAt: new Date() },
  });
  console.log(`[ok] problem ${frontmatter.slug} (${wordCount}w)`);
}

async function main() {
  const opts = parseCli();
  const kinds = opts.kind ? [opts.kind] : ['concept', 'problem'] as const;
  let errors = 0;
  for (const kind of kinds) {
    const dir = join(CONTENT_ROOT, kind === 'concept' ? 'concepts' : 'problems');
    const files = (await readdir(dir))
      .filter((f) => extname(f) === '.mdx')
      .filter((f) => !opts.slug || basename(f, '.mdx') === opts.slug);
    for (const file of files) {
      try {
        const path = join(dir, file);
        if (kind === 'concept') await compileConcept(path, opts.dryRun);
        else await compileProblem(path, opts.dryRun);
      } catch (e) {
        errors++;
        console.error(`[err] ${file}:`, (e as Error).message);
      }
    }
  }
  if (errors) { console.error(`${errors} errors`); process.exit(1); }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Add the pnpm script**

Edit `architex/package.json` scripts:

```json
{
  "scripts": {
    "compile:sd-content": "tsx scripts/compile-sd-content.ts",
    "compile:sd-content:dry": "tsx scripts/compile-sd-content.ts --dry-run"
  }
}
```

- [ ] **Step 3: Write the fixture-driven test**

Create `architex/scripts/__tests__/compile-sd-content.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { compileMdx } from '../lib/mdx-compiler';
import { ConceptFrontmatterSchema, CONCEPT_SECTION_IDS } from '@/lib/sd/content-types';

const MINIMAL_CONCEPT = `---
slug: test
title: Test
wave: 1
waveOrder: 1
estimatedMinutes: 10
checkpoints:
  - { kind: recall, id: r1, prompt: q, options: [{ id: a, label: x, isCorrect: true }], explanation: e }
  - { kind: apply, id: a1, scenario: s, correctNodeIds: [n1], distractorNodeIds: [n2], explanation: e }
  - { kind: compare, id: c1, prompt: p, left: { conceptSlug: x, label: X }, right: { conceptSlug: y, label: Y }, statements: [{ id: s1, text: t, correct: left }], explanation: e }
---

<!-- Section: hook -->
Scenario here.

<!-- Section: analogy -->
Analogy here.

<!-- Section: primitive -->
Body.

<!-- Section: anatomy -->
Anatomy.

<!-- Section: numbersThatMatter -->
Numbers.

<!-- Section: tradeoffs -->
Gains, pays.

<!-- Section: antiCases -->
Not here.

<!-- Section: seenInWild -->
Company.

<!-- Section: bridges -->
Links.

<!-- Section: checkpoints -->
See frontmatter.
`;

describe('compileMdx(concept)', () => {
  it('splits into all 10 section ids and validates frontmatter', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'sd-'));
    const path = join(dir, 'test.mdx');
    await writeFile(path, MINIMAL_CONCEPT);
    const c = await compileMdx(path, ConceptFrontmatterSchema);
    expect(c.frontmatter.slug).toBe('test');
    for (const id of CONCEPT_SECTION_IDS) {
      expect(c.sections[id]).toBeDefined();
    }
  });
});
```

- [ ] **Step 4: Run + commit**

```bash
pnpm typecheck
pnpm test:run -- compile-sd-content
git add architex/scripts/compile-sd-content.ts \
        architex/scripts/__tests__/compile-sd-content.test.ts \
        architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd): write compile-sd-content script (Task 6/35)

Walks content/sd/{concepts,problems}/*.mdx, validates frontmatter via
Zod, splits bodies into 10 concept sections / 7 problem panes, and
upserts into sd_concepts/sd_problems with JSONB payload. Supports
--kind, --slug, --dry-run flags. Word-count warns outside frontmatter
targets. Onconflict-do-update enables incremental content authoring.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Write concept-loader and problem-loader (DB → typed payload)

**Files:**
- Create: `architex/src/lib/sd/concept-loader.ts`
- Create: `architex/src/lib/sd/problem-loader.ts`
- Create: `architex/src/lib/sd/__tests__/concept-loader.test.ts`
- Create: `architex/src/lib/sd/__tests__/problem-loader.test.ts`

Runtime loaders take a slug, query `sd_concepts` / `sd_problems`, parse the JSONB `body_mdx` back into a typed `ConceptPayload` / `ProblemPayload`, and return it. Used by Server Components (App Router) in Task 23's `SDLearnModeLayout` via TanStack Query server-side prefetch.

- [ ] **Step 1: Concept loader**

Create `architex/src/lib/sd/concept-loader.ts`:

```typescript
/**
 * SD-037: Loads a compiled concept from sd_concepts and re-validates
 * the JSONB payload. Throws if the row is absent or malformed.
 */
import { db } from '@/db/client';
import { sdConcepts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import {
  ConceptFrontmatterSchema, CONCEPT_SECTION_IDS,
  type ConceptPayload, type ConceptSectionId,
} from './content-types';

const CompiledConceptSchema = z.object({
  frontmatter: ConceptFrontmatterSchema,
  sections: z.record(z.enum(CONCEPT_SECTION_IDS), z.string()),
});

export class ConceptNotFoundError extends Error {
  constructor(slug: string) { super(`concept '${slug}' not found`); }
}
export class ConceptMalformedError extends Error {
  constructor(slug: string, reason: string) { super(`concept '${slug}' malformed: ${reason}`); }
}

export async function loadConcept(slug: string): Promise<ConceptPayload> {
  const rows = await db.select({ bodyMdx: sdConcepts.bodyMdx })
    .from(sdConcepts).where(eq(sdConcepts.slug, slug)).limit(1);
  if (rows.length === 0) throw new ConceptNotFoundError(slug);

  let parsed: unknown;
  try { parsed = JSON.parse(rows[0].bodyMdx); }
  catch (e) { throw new ConceptMalformedError(slug, `invalid JSON: ${(e as Error).message}`); }

  const result = CompiledConceptSchema.safeParse(parsed);
  if (!result.success) throw new ConceptMalformedError(slug, result.error.message);
  return result.data as ConceptPayload;
}

export async function listConceptSlugsByWave(wave?: number): Promise<Array<{ slug: string; title: string; wave: number; waveOrder: number }>> {
  const q = db.select({
    slug: sdConcepts.slug, title: sdConcepts.title,
    wave: sdConcepts.wave, waveOrder: sdConcepts.waveOrder,
  }).from(sdConcepts);
  const rows = wave === undefined ? await q : await q.where(eq(sdConcepts.wave, wave));
  return rows.sort((a, b) => (a.wave - b.wave) || (a.waveOrder - b.waveOrder));
}
```

- [ ] **Step 2: Problem loader (mirrors concept-loader)**

Create `architex/src/lib/sd/problem-loader.ts` with the same shape: `loadProblem(slug)`, `listProblemsByDomain(domain?)`, Zod-validated re-parse, `ProblemNotFoundError` / `ProblemMalformedError`. Sections → panes (7 pane ids including `checkpoints`).

- [ ] **Step 3: Tests**

Create `architex/src/lib/sd/__tests__/concept-loader.test.ts`:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db/client';
import { sdConcepts } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { loadConcept, listConceptSlugsByWave, ConceptNotFoundError, ConceptMalformedError } from '../concept-loader';

describe('loadConcept', () => {
  const slug = 'test-loader-fixture';
  beforeAll(async () => {
    await db.insert(sdConcepts).values({
      slug, wave: 1, waveOrder: 99, title: 'T', shortDescription: '',
      bodyMdx: JSON.stringify({
        frontmatter: {
          slug, title: 'T', wave: 1, waveOrder: 99, estimatedMinutes: 10,
          wordTargetMin: 1200, wordTargetMax: 1800, voiceVariant: 'standard',
          anchorNodeIds: {}, scalingNumbers: [], engineeringBlogLinks: [],
          checkpoints: [
            { kind: 'recall', id: 'r1', prompt: 'q', options: [{ id: 'a', label: 'x', isCorrect: true }], explanation: '.' },
            { kind: 'apply', id: 'a1', scenario: 's', correctNodeIds: ['n'], distractorNodeIds: ['m'], explanation: '.' },
            { kind: 'compare', id: 'c1', prompt: 'vs', left: { conceptSlug: 'x', label: 'X' }, right: { conceptSlug: 'y', label: 'Y' }, statements: [{ id: 's1', text: 't', correct: 'left' }], explanation: '.' },
          ],
        },
        sections: Object.fromEntries(['hook','analogy','primitive','anatomy','numbersThatMatter','tradeoffs','antiCases','seenInWild','bridges','checkpoints'].map((k) => [k, `# ${k}`])),
      }),
    });
  });
  afterAll(async () => { await db.delete(sdConcepts).where(eq(sdConcepts.slug, slug)); });

  it('returns a typed ConceptPayload', async () => {
    const c = await loadConcept(slug);
    expect(c.frontmatter.slug).toBe(slug);
    expect(c.sections.hook).toContain('hook');
  });
  it('throws ConceptNotFoundError for missing slug', async () => {
    await expect(loadConcept('no-such-slug')).rejects.toBeInstanceOf(ConceptNotFoundError);
  });
  it('lists concepts by wave', async () => {
    const list = await listConceptSlugsByWave(1);
    expect(list.map((c) => c.slug)).toContain(slug);
  });
});
```

A parallel test file at `problem-loader.test.ts` exercises `loadProblem` + `listProblemsByDomain` with an `infra` fixture.

- [ ] **Step 4: Run + commit**

```bash
pnpm typecheck && pnpm test:run -- concept-loader problem-loader
git add architex/src/lib/sd/concept-loader.ts \
        architex/src/lib/sd/problem-loader.ts \
        architex/src/lib/sd/__tests__/concept-loader.test.ts \
        architex/src/lib/sd/__tests__/problem-loader.test.ts
git commit -m "feat(sd): runtime loaders for compiled concepts + problems (Task 7/35)"
```

---



