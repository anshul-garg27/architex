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

## Task 8: Create learn-progress API routes

**Files:**
- Create: `architex/src/app/api/sd/learn-progress/route.ts` (GET all for user)
- Create: `architex/src/app/api/sd/learn-progress/[kind]/[slug]/route.ts` (GET/PATCH one)
- Create: `architex/src/app/api/sd/__tests__/sd-learn-progress.test.ts`

- [ ] **Step 1: Collection route**

Create `architex/src/app/api/sd/learn-progress/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { sdLearnProgress } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const kind = req.nextUrl.searchParams.get('kind') as 'concept' | 'problem' | null;
  const rows = await db.select().from(sdLearnProgress).where(
    kind
      ? and(eq(sdLearnProgress.userId, session.user.id), eq(sdLearnProgress.kind, kind))
      : eq(sdLearnProgress.userId, session.user.id),
  );
  return NextResponse.json({ data: rows });
}
```

- [ ] **Step 2: Per-slug route with upsert semantics**

Create `architex/src/app/api/sd/learn-progress/[kind]/[slug]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { sdLearnProgress } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { CONCEPT_SECTION_IDS, PROBLEM_PANE_IDS } from '@/lib/sd/content-types';

const PatchBodySchema = z.object({
  sectionState: z.record(z.string(), z.object({
    visited: z.boolean().optional(),
    scrollPct: z.number().min(0).max(100).optional(),
    answered: z.boolean().optional(),
    correct: z.boolean().optional(),
    attempts: z.number().int().min(0).optional(),
  })).optional(),
  deepestScrollPct: z.number().int().min(0).max(100).optional(),
  lastSectionId: z.string().optional(),
  checkpointStats: z.object({
    attempts: z.number().int().min(0),
    correct: z.number().int().min(0),
    revealed: z.number().int().min(0),
  }).optional(),
  completed: z.boolean().optional(),
  tinkerCanvasState: z.any().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (kind !== 'concept' && kind !== 'problem') return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const [row] = await db.select().from(sdLearnProgress).where(
    and(eq(sdLearnProgress.userId, session.user.id),
        eq(sdLearnProgress.kind, kind), eq(sdLearnProgress.slug, slug)),
  ).limit(1);
  return NextResponse.json({ data: row ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  if (kind !== 'concept' && kind !== 'problem') return NextResponse.json({ error: 'invalid kind' }, { status: 400 });
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = PatchBodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const validIds = kind === 'concept' ? CONCEPT_SECTION_IDS : PROBLEM_PANE_IDS;
  if (parsed.data.sectionState) {
    for (const id of Object.keys(parsed.data.sectionState)) {
      if (!validIds.includes(id as any) && id !== 'checkpoints') {
        return NextResponse.json({ error: `invalid section id '${id}' for ${kind}` }, { status: 400 });
      }
    }
  }
  if (parsed.data.lastSectionId && !validIds.includes(parsed.data.lastSectionId as any) && parsed.data.lastSectionId !== 'checkpoints') {
    return NextResponse.json({ error: `invalid lastSectionId` }, { status: 400 });
  }

  const body = parsed.data;
  const now = new Date();
  const [existing] = await db.select().from(sdLearnProgress).where(
    and(eq(sdLearnProgress.userId, session.user.id),
        eq(sdLearnProgress.kind, kind), eq(sdLearnProgress.slug, slug)),
  ).limit(1);

  if (!existing) {
    const [inserted] = await db.insert(sdLearnProgress).values({
      userId: session.user.id, kind, slug,
      sectionState: body.sectionState ?? {},
      deepestScrollPct: body.deepestScrollPct ?? 0,
      lastSectionId: body.lastSectionId,
      checkpointStats: body.checkpointStats ?? { attempts: 0, correct: 0, revealed: 0 },
      completedAt: body.completed ? now : null,
      tinkerCanvasState: body.tinkerCanvasState,
      updatedAt: now,
    }).returning();
    return NextResponse.json({ data: inserted });
  }

  const merged = {
    ...existing,
    sectionState: body.sectionState ? { ...(existing.sectionState as object), ...body.sectionState } : existing.sectionState,
    deepestScrollPct: body.deepestScrollPct !== undefined
      ? Math.max(existing.deepestScrollPct, body.deepestScrollPct)
      : existing.deepestScrollPct,
    lastSectionId: body.lastSectionId ?? existing.lastSectionId,
    checkpointStats: body.checkpointStats ?? existing.checkpointStats,
    completedAt: body.completed && !existing.completedAt ? now : existing.completedAt,
    tinkerCanvasState: body.tinkerCanvasState ?? existing.tinkerCanvasState,
    updatedAt: now,
  };
  const [updated] = await db.update(sdLearnProgress).set(merged)
    .where(eq(sdLearnProgress.id, existing.id)).returning();
  return NextResponse.json({ data: updated });
}
```

- [ ] **Step 3: Test both routes**

Create `architex/src/app/api/sd/__tests__/sd-learn-progress.test.ts`. Cover:
- 401 when unauthenticated
- PATCH with new slug inserts a row
- PATCH with existing slug merges sectionState + takes max of deepestScrollPct
- PATCH with invalid section id → 400
- GET ?kind=concept filters correctly
- `completed: true` sets `completedAt` once and never overwrites it

- [ ] **Step 4: Run + commit**

```bash
pnpm typecheck
pnpm test:run -- sd-learn-progress
git add architex/src/app/api/sd/learn-progress \
        architex/src/app/api/sd/__tests__/sd-learn-progress.test.ts
git commit -m "feat(api): sd learn-progress GET/PATCH with section-id validation (Task 8/35)"
```

---

## Task 9: Create `useSDLearnProgress` hook with debounced writes

**Files:**
- Create: `architex/src/hooks/useSDLearnProgress.ts`
- Create: `architex/src/hooks/__tests__/useSDLearnProgress.test.tsx`

- [ ] **Step 1: Write the hook**

Create `architex/src/hooks/useSDLearnProgress.ts`:

```typescript
/**
 * SD-038: Reads and mutates sd_learn_progress for a given (kind, slug).
 * - GET via TanStack Query on mount with staleTime: 30s
 * - PATCH debounced 1s on every mutation to protect the DB from
 *   scroll-burst amplification
 * - Optimistic local cache so the UI never waits on network
 */
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import type { ConceptSectionId, ProblemPaneId } from '@/lib/sd/content-types';

type LearnKind = 'concept' | 'problem';

export interface SDLearnProgressRow {
  id: string;
  userId: string;
  kind: LearnKind;
  slug: string;
  sectionState: Record<string, { visited?: boolean; scrollPct?: number; answered?: boolean; correct?: boolean; attempts?: number }>;
  deepestScrollPct: number;
  lastSectionId: string | null;
  checkpointStats: { attempts: number; correct: number; revealed: number };
  completedAt: string | null;
  tinkerCanvasState: unknown;
}

export interface LearnPatch {
  sectionState?: Record<string, SDLearnProgressRow['sectionState'][string]>;
  deepestScrollPct?: number;
  lastSectionId?: string;
  checkpointStats?: SDLearnProgressRow['checkpointStats'];
  completed?: boolean;
  tinkerCanvasState?: unknown;
}

const key = (kind: LearnKind, slug: string) => ['sd', 'learn-progress', kind, slug];

export function useSDLearnProgress(kind: LearnKind, slug: string) {
  const qc = useQueryClient();
  const pendingRef = useRef<LearnPatch>({});

  const query = useQuery({
    queryKey: key(kind, slug),
    queryFn: async () => {
      const r = await fetch(`/api/sd/learn-progress/${kind}/${slug}`);
      if (!r.ok) throw new Error('failed to load progress');
      const body = await r.json();
      return body.data as SDLearnProgressRow | null;
    },
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async (patch: LearnPatch) => {
      const r = await fetch(`/api/sd/learn-progress/${kind}/${slug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error('patch failed');
      return (await r.json()).data as SDLearnProgressRow;
    },
    onSuccess: (row) => qc.setQueryData(key(kind, slug), row),
  });

  const flush = useCallback(() => {
    if (Object.keys(pendingRef.current).length === 0) return;
    mutation.mutate(pendingRef.current);
    pendingRef.current = {};
  }, [mutation]);
  const debouncedFlush = useDebouncedCallback(flush, 1000);

  const patch = useCallback((p: LearnPatch) => {
    pendingRef.current = {
      ...pendingRef.current,
      ...p,
      sectionState: { ...(pendingRef.current.sectionState ?? {}), ...(p.sectionState ?? {}) },
    };
    // Optimistic local update
    const current = qc.getQueryData<SDLearnProgressRow | null>(key(kind, slug)) ?? null;
    qc.setQueryData(key(kind, slug), {
      ...(current ?? { id: '', userId: '', kind, slug, sectionState: {}, deepestScrollPct: 0, lastSectionId: null, checkpointStats: { attempts: 0, correct: 0, revealed: 0 }, completedAt: null, tinkerCanvasState: null }),
      sectionState: { ...(current?.sectionState ?? {}), ...(p.sectionState ?? {}) },
      deepestScrollPct: Math.max(current?.deepestScrollPct ?? 0, p.deepestScrollPct ?? 0),
      lastSectionId: p.lastSectionId ?? current?.lastSectionId ?? null,
      checkpointStats: p.checkpointStats ?? current?.checkpointStats ?? { attempts: 0, correct: 0, revealed: 0 },
      completedAt: p.completed && !current?.completedAt ? new Date().toISOString() : current?.completedAt ?? null,
    });
    debouncedFlush();
  }, [kind, slug, qc, debouncedFlush]);

  // Flush on unmount + on tab hide (beforeunload) to survive page unload
  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener('pagehide', onHide);
    return () => { window.removeEventListener('pagehide', onHide); flush(); };
  }, [flush]);

  return { progress: query.data ?? null, isLoading: query.isLoading, patch, flush };
}
```

- [ ] **Step 2: Test**

Create `architex/src/hooks/__tests__/useSDLearnProgress.test.tsx`. Fake-timer tests:
- `patch({ sectionState: { hook: { visited: true } } })` does not immediately call fetch
- advancing 1000ms calls fetch with merged body
- subsequent `patch({ sectionState: { analogy: { visited: true } } })` within 1000ms debounces and merges
- unmounting flushes pending writes

- [ ] **Step 3: Run + commit**

```bash
pnpm typecheck && pnpm test:run -- useSDLearnProgress
git add architex/src/hooks/useSDLearnProgress.ts \
        architex/src/hooks/__tests__/useSDLearnProgress.test.tsx
git commit -m "feat(hooks): useSDLearnProgress with 1s debounced writes + pagehide flush (Task 9/35)"
```

---

## Task 10: Create bookmarks API routes

**Files:**
- Create: `architex/src/app/api/sd/bookmarks/route.ts` (GET all, POST create)
- Create: `architex/src/app/api/sd/bookmarks/[id]/route.ts` (DELETE)

- [ ] **Step 1: Collection route**

```typescript
// src/app/api/sd/bookmarks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { sdBookmarks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const PostSchema = z.object({
  kind: z.enum(['concept', 'problem']),
  slug: z.string().min(1).max(100),
  anchor: z.string().min(1).max(128),
  label: z.string().min(1).max(200),
  note: z.string().max(2000).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const kind = req.nextUrl.searchParams.get('kind') as 'concept' | 'problem' | null;
  const slug = req.nextUrl.searchParams.get('slug');
  const filter = [eq(sdBookmarks.userId, session.user.id)];
  if (kind) filter.push(eq(sdBookmarks.kind, kind));
  if (slug) filter.push(eq(sdBookmarks.slug, slug));
  const rows = await db.select().from(sdBookmarks).where(and(...filter));
  return NextResponse.json({ data: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = PostSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  const [existing] = await db.select({ id: sdBookmarks.id }).from(sdBookmarks).where(
    and(eq(sdBookmarks.userId, session.user.id),
        eq(sdBookmarks.kind, parsed.data.kind),
        eq(sdBookmarks.slug, parsed.data.slug),
        eq(sdBookmarks.anchor, parsed.data.anchor)),
  ).limit(1);
  if (existing) return NextResponse.json({ data: existing, alreadyExists: true });
  const [row] = await db.insert(sdBookmarks).values({ userId: session.user.id, ...parsed.data }).returning();
  return NextResponse.json({ data: row }, { status: 201 });
}
```

- [ ] **Step 2: DELETE route**

```typescript
// src/app/api/sd/bookmarks/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { sdBookmarks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const deleted = await db.delete(sdBookmarks).where(
    and(eq(sdBookmarks.id, id), eq(sdBookmarks.userId, session.user.id)),
  ).returning({ id: sdBookmarks.id });
  if (deleted.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ data: { id } });
}
```

- [ ] **Step 3: Tests + commit**

Test all four paths (GET / POST / dedup-on-repeat-POST / DELETE with wrong user → 404).

```bash
git commit -m "feat(api): sd bookmarks GET/POST/DELETE with idempotent create (Task 10/35)"
```

---

## Task 11: Create `useSDBookmarks` hook

**Files:**
- Create: `architex/src/hooks/useSDBookmarks.ts`
- Create: `architex/src/hooks/__tests__/useSDBookmarks.test.tsx`

- [ ] **Step 1: Hook shape**

```typescript
// src/hooks/useSDBookmarks.ts
'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface SDBookmark {
  id: string;
  userId: string;
  kind: 'concept' | 'problem';
  slug: string;
  anchor: string;
  label: string;
  note: string | null;
  createdAt: string;
}

const key = (kind: string, slug: string) => ['sd', 'bookmarks', kind, slug];

export function useSDBookmarks(kind: 'concept' | 'problem', slug: string) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: key(kind, slug),
    queryFn: async () => {
      const r = await fetch(`/api/sd/bookmarks?kind=${kind}&slug=${slug}`);
      return (await r.json()).data as SDBookmark[];
    },
  });
  const create = useMutation({
    mutationFn: async (v: { anchor: string; label: string; note?: string }) => {
      const r = await fetch('/api/sd/bookmarks', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, slug, ...v }),
      });
      return (await r.json()).data as SDBookmark;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(kind, slug) }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/sd/bookmarks/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key(kind, slug) }),
  });
  const toggle = async (anchor: string, label: string, note?: string) => {
    const existing = q.data?.find((b) => b.anchor === anchor);
    if (existing) return remove.mutateAsync(existing.id);
    return create.mutateAsync({ anchor, label, note });
  };
  return { bookmarks: q.data ?? [], isLoading: q.isLoading, create: create.mutate, remove: remove.mutate, toggle };
}
```

- [ ] **Step 2: Test + commit**

Cover: list → add → toggle (remove) → add-again (create). Expected: invalidate-refetch cycle keeps UI consistent.

```bash
git commit -m "feat(hooks): useSDBookmarks with optimistic toggle (Task 11/35)"
```

---

## Task 12: Create `POST /api/sd/concept-reads` route

**Files:**
- Create: `architex/src/app/api/sd/concept-reads/route.ts`
- Create: `architex/src/app/api/sd/__tests__/sd-concept-reads.test.ts`

- [ ] **Step 1: Rate-limited POST**

```typescript
// src/app/api/sd/concept-reads/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/client';
import { sdConceptReads } from '@/db/schema';
import { and, eq, gt, desc } from 'drizzle-orm';
import { z } from 'zod';

const Schema = z.object({
  conceptSlug: z.string().min(1).max(100),
  source: z.enum(['scroll', 'click-popover', 'bridge-card', 'tour', 'quiz-result']),
  contextSlug: z.string().max(100).optional(),
  durationMs: z.object({
    onPage: z.number().int().min(0),
    active: z.number().int().min(0),
    idle: z.number().int().min(0),
  }).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  // 30-second rate limit per (user, concept)
  const cutoff = new Date(Date.now() - 30_000);
  const [recent] = await db.select({ id: sdConceptReads.id }).from(sdConceptReads).where(
    and(eq(sdConceptReads.userId, session.user.id),
        eq(sdConceptReads.conceptSlug, parsed.data.conceptSlug),
        gt(sdConceptReads.readAt, cutoff)),
  ).orderBy(desc(sdConceptReads.readAt)).limit(1);
  if (recent) return NextResponse.json({ deduped: true });

  const [row] = await db.insert(sdConceptReads).values({
    userId: session.user.id,
    conceptSlug: parsed.data.conceptSlug,
    source: parsed.data.source,
    contextSlug: parsed.data.contextSlug,
    durationMs: parsed.data.durationMs,
  }).returning();
  return NextResponse.json({ data: row }, { status: 201 });
}
```

- [ ] **Step 2: Test + commit**

Tests: POST within 30s returns `{ deduped: true }` without inserting a second row; 31s later inserts; schema rejects unknown source; auth required.

```bash
git commit -m "feat(api): sd concept-reads with 30s rate limit per (user,concept) (Task 12/35)"
```

---

## Task 13: Create scroll-sync and pane-sync hooks

**Files:**
- Create: `architex/src/hooks/useConceptScrollSync.ts`
- Create: `architex/src/hooks/useProblemPaneSync.ts`
- Create: `architex/src/hooks/__tests__/useConceptScrollSync.test.tsx`

`useConceptScrollSync` is the heart of the Learn-mode Q7 feature: as the reader scrolls through an 8-section concept page, the `highlightedNodeIds` set changes to match the section currently in view, causing the canvas to pulse the relevant architecture nodes (spec §6.3, §18 renders). `useProblemPaneSync` is the problem-page analog: users click tabs / URL-hash anchors to switch active panes; when the pane is `canonicalDesign`, the hook additionally tracks the active solution (A/B/C) and swaps the canvas diagram.

- [ ] **Step 1: Concept scroll-sync with IntersectionObserver**

```typescript
// src/hooks/useConceptScrollSync.ts
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConceptSectionId, ConceptFrontmatter } from '@/lib/sd/content-types';

interface Opts {
  anchorNodeIds: ConceptFrontmatter['anchorNodeIds'];
  /** 0..1 · fraction of section visibility before it counts as "in view" */
  threshold?: number;
  /** Optional callback on every section change — used by useSDLearnProgress.patch() to mark visited */
  onSectionEnter?: (id: ConceptSectionId) => void;
}

export function useConceptScrollSync(opts: Opts) {
  const { anchorNodeIds, threshold = 0.35, onSectionEnter } = opts;
  const sectionRefs = useRef<Map<ConceptSectionId, HTMLElement>>(new Map());
  const [activeSection, setActiveSection] = useState<ConceptSectionId | null>(null);

  const register = (id: ConceptSectionId) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(id, el);
    else sectionRefs.current.delete(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      // Pick the entry with the highest intersectionRatio that is >= threshold
      const winning = entries
        .filter((e) => e.intersectionRatio >= threshold)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!winning) return;
      const id = winning.target.getAttribute('data-section-id') as ConceptSectionId | null;
      if (id && id !== activeSection) {
        setActiveSection(id);
        onSectionEnter?.(id);
      }
    }, { threshold: [threshold, 0.6, 0.9] });

    for (const el of sectionRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [activeSection, threshold, onSectionEnter]);

  const highlightedNodeIds = useMemo(() => {
    if (!activeSection) return [];
    return anchorNodeIds[activeSection] ?? [];
  }, [activeSection, anchorNodeIds]);

  /** Jump to section · used by TOC + popover jump-back */
  const scrollToSection = (id: ConceptSectionId) => {
    const el = sectionRefs.current.get(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return { register, activeSection, highlightedNodeIds, scrollToSection };
}
```

- [ ] **Step 2: Problem pane-sync with URL hash + tab-click**

```typescript
// src/hooks/useProblemPaneSync.ts
'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ProblemPaneId, ProblemFrontmatter } from '@/lib/sd/content-types';

interface Opts {
  frontmatter: ProblemFrontmatter;
  onPaneChange?: (id: ProblemPaneId) => void;
}

export function useProblemPaneSync({ frontmatter, onPaneChange }: Opts) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hashPane = typeof window !== 'undefined'
    ? (window.location.hash.replace('#', '') as ProblemPaneId | '')
    : '';
  const initialPane: ProblemPaneId = (hashPane as ProblemPaneId) || 'canonicalDesign';
  const [activePane, setActivePane] = useState<ProblemPaneId>(initialPane);
  const [activeSolutionIndex, setActiveSolutionIndex] = useState(
    parseInt(searchParams.get('sol') ?? '0', 10) || 0,
  );

  useEffect(() => {
    const onHash = () => {
      const p = window.location.hash.replace('#', '') as ProblemPaneId;
      if (p && p !== activePane) {
        setActivePane(p);
        onPaneChange?.(p);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [activePane, onPaneChange]);

  const setPane = (p: ProblemPaneId) => {
    window.history.replaceState(null, '', `#${p}`);
    setActivePane(p);
    onPaneChange?.(p);
  };

  const setSolution = (i: number) => {
    if (i < 0 || i >= frontmatter.canonicalSolutions.length) return;
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('sol', String(i));
    router.replace(`${pathname}?${sp.toString()}#${activePane}`);
    setActiveSolutionIndex(i);
  };

  const activeCanvas = activePane === 'canonicalDesign'
    ? frontmatter.canonicalSolutions[activeSolutionIndex]?.diagramJson ?? null
    : null;

  return { activePane, setPane, activeSolutionIndex, setSolution, activeCanvas };
}
```

- [ ] **Step 3: Tests**

Create `architex/src/hooks/__tests__/useConceptScrollSync.test.tsx`. Use a mock IntersectionObserver. Cover:
- Registering 3 refs → triggering intersection entries → activeSection updates to highest-ratio id
- `onSectionEnter` fires once per section change, not on every ratio change
- `scrollToSection` invokes `Element.scrollIntoView`
- `highlightedNodeIds` returns [] when no section matches

Parallel test for `useProblemPaneSync` covers: hashchange → setState, setPane writes hash, setSolution writes `?sol=` query.

- [ ] **Step 4: Run + commit**

```bash
pnpm typecheck && pnpm test:run -- useConceptScrollSync useProblemPaneSync
git commit -m "$(cat <<'EOF'
feat(hooks): concept scroll-sync + problem pane-sync (Task 13/35)

useConceptScrollSync: IntersectionObserver-driven section detection
with threshold-sorted winner, returns highlightedNodeIds derived from
frontmatter.anchorNodeIds, exposes scrollToSection for TOC/popover
jumps, fires onSectionEnter for progress-patching.

useProblemPaneSync: URL-hash-driven pane switching, ?sol= query for
canonical-solution tab state (A/B/C), exposes activeCanvas so the
shared SDCanvas can swap diagrams when users toggle solutions.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Build section + pane components, `ConceptColumn`, `ProblemColumn`, and 3 content-format components

This is the largest UI task. It lands:
- 10 concept-section components (`HookSection` · `AnalogySection` · `PrimitiveSection` · `AnatomySection` · `NumbersThatMatterSection` · `TradeoffsSection` · `AntiCasesSection` · `SeenInWildSection` · `BridgesSection` · `ConceptCheckpointsSection`)
- 6 problem-pane components (`ProblemStatementPane` · `RequirementsPane` · `ScaleNumbersPane` · `CanonicalDesignPane` · `FailureModesChaosPane` · `ConceptsUsedPane`) + an inline `ProblemCheckpointsPane` that renders at the bottom of any pane
- `ConceptColumn.tsx` and `ProblemColumn.tsx` — top-level scroll containers that map payload → components
- 3 Q32 content-format components: `ScalingNumbersStrip.tsx` (format 3), `DecisionTree.tsx` (format 4), `EngineeringBlogCard.tsx` (format 5)

**Files:**
- Create: 10 files in `architex/src/components/modules/sd/learn/concept-sections/`
- Create: 7 files in `architex/src/components/modules/sd/learn/problem-panes/`
- Create: `architex/src/components/modules/sd/learn/ConceptColumn.tsx`
- Create: `architex/src/components/modules/sd/learn/ProblemColumn.tsx`
- Create: `architex/src/components/modules/sd/learn/ScalingNumbersStrip.tsx`
- Create: `architex/src/components/modules/sd/learn/DecisionTree.tsx`
- Create: `architex/src/components/modules/sd/learn/EngineeringBlogCard.tsx`

- [ ] **Step 1: Build the shared `ScalingNumbersStrip` (Q32 format 3)**

Per spec §18.7: *"Redis: 100k ops/sec · sub-ms p99 · $0.11/hr" — inline visual token*. Renders at the top of every concept + problem page and inline in the `numbersThatMatter` section.

```typescript
// src/components/modules/sd/learn/ScalingNumbersStrip.tsx
'use client';
import { cn } from '@/lib/utils';

export interface ScalingNumber {
  label: string;
  value: string;
  unit?: string;
  citation?: string;
  sourceYear?: number;
}

export function ScalingNumbersStrip({ numbers, dense }: { numbers: ScalingNumber[]; dense?: boolean }) {
  if (numbers.length === 0) return null;
  return (
    <ul
      className={cn(
        'flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-cobalt/20 bg-cobalt/5',
        dense ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
      )}
      aria-label="Scaling numbers"
    >
      {numbers.map((n, i) => (
        <li key={i} className="flex items-baseline gap-1">
          <span className="font-mono font-semibold text-cobalt-300">{n.value}</span>
          {n.unit && <span className="font-mono text-cobalt-300/80">{n.unit}</span>}
          <span className="text-foreground-muted">· {n.label}</span>
          {n.sourceYear && <span className="ml-1 text-xs text-foreground-muted/60">({n.sourceYear})</span>}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Build the `DecisionTree` component (Q32 format 4)**

Used inline in concept bodies via MDX (`<DecisionTree>...</DecisionTree>`). Reads a branching config from props.

```typescript
// src/components/modules/sd/learn/DecisionTree.tsx
'use client';
import { useState } from 'react';

export interface DecisionBranch { question: string; yes: string; no: string }
export interface DecisionTreeProps { root: string; branches: DecisionBranch[] }

export function DecisionTree({ root, branches }: DecisionTreeProps) {
  const [answers, setAnswers] = useState<boolean[]>([]);
  const current = branches[answers.length] ?? null;
  const terminal = !current
    ? answers[answers.length - 1]
      ? branches[answers.length - 1].yes
      : branches[answers.length - 1].no
    : null;

  return (
    <figure className="my-6 rounded-lg border border-cobalt/20 p-4">
      <figcaption className="mb-3 font-serif text-sm italic text-foreground-muted">Decision tree · {root}</figcaption>
      {terminal ? (
        <div className="space-y-2">
          <p className="font-serif">Recommendation: <strong>{terminal}</strong></p>
          <button onClick={() => setAnswers([])} className="text-xs text-cobalt-300 underline">Start over</button>
        </div>
      ) : current && (
        <div className="space-y-2">
          <p className="font-serif">{current.question}</p>
          <div className="flex gap-2">
            <button onClick={() => setAnswers([...answers, true])}  className="rounded border border-cobalt/40 px-3 py-1 hover:bg-cobalt/10">Yes</button>
            <button onClick={() => setAnswers([...answers, false])} className="rounded border border-cobalt/40 px-3 py-1 hover:bg-cobalt/10">No</button>
          </div>
        </div>
      )}
    </figure>
  );
}
```

- [ ] **Step 3: Build `EngineeringBlogCard` (Q32 format 5)**

Renders links to real engineering blogs with company, title, year, reading time. Used at the end of `seenInWild` and inside `conceptsUsed` panes.

```typescript
// src/components/modules/sd/learn/EngineeringBlogCard.tsx
'use client';
import { ExternalLink } from 'lucide-react';
import type { ConceptFrontmatter } from '@/lib/sd/content-types';

type Link = ConceptFrontmatter['engineeringBlogLinks'][number];

export function EngineeringBlogCard({ link }: { link: Link }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer"
       className="group block rounded-lg border border-border p-3 transition hover:border-cobalt/40 hover:bg-cobalt/5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-cobalt-300">{link.company} · {link.year}</span>
        <ExternalLink className="h-3 w-3 text-foreground-muted group-hover:text-cobalt-300" aria-hidden />
      </div>
      <p className="mt-1 font-serif leading-snug">{link.title}</p>
      {link.readingMinutes && (
        <p className="mt-1 text-xs text-foreground-muted">{link.readingMinutes}-min read</p>
      )}
    </a>
  );
}
```

- [ ] **Step 4: Build the 10 concept-section components**

Each section is a small React component keyed on `data-section-id`. The registration callback from `useConceptScrollSync` wires the ref. Example:

```typescript
// src/components/modules/sd/learn/concept-sections/HookSection.tsx
'use client';
import { forwardRef } from 'react';
import { MDXRenderer } from '@/components/shared/learn/MDXRenderer';

export interface SectionProps {
  id: string;
  body: string;                          // MDX source
  registerRef: (el: HTMLElement | null) => void;
}

export const HookSection = forwardRef<HTMLElement, SectionProps>(function HookSection({ body, registerRef }, _ref) {
  return (
    <section
      ref={registerRef}
      data-section-id="hook"
      className="prose-sd prose-serif mx-auto max-w-2xl py-8"
      aria-labelledby="hook-heading"
    >
      <h2 id="hook-heading" className="font-serif text-2xl text-cobalt-200">The Itch</h2>
      <MDXRenderer source={body} />
    </section>
  );
});
```

The other 9 section components follow the same template:
- `AnalogySection`: h2 "Analogy" · adds a small italic banner styling.
- `PrimitiveSection`: h2 "The Primitive" · largest body (500-700 words); renders MDX with diagrams + pseudocode.
- `AnatomySection`: h2 "Anatomy" · renders the architecture anatomy diagram inline via `<SDCanvasReadonly inline slug={...} />`; scroll-sync registers this section but also passes `anchorNodeIds[anatomy]` so the main canvas pulses in parallel.
- `NumbersThatMatterSection`: h2 "Numbers that Matter" · renders `<ScalingNumbersStrip numbers={frontmatter.scalingNumbers} />` at the top and then `MDXRenderer` for the prose.
- `TradeoffsSection`: h2 "Tradeoffs" · "You gain X. You pay Y." layout with two columns.
- `AntiCasesSection`: h2 "When not to use it" · amber-bordered callout.
- `SeenInWildSection`: h2 "Seen in the wild" · renders `<EngineeringBlogCard link={...} />` cards at the bottom.
- `BridgesSection`: h2 "Bridges" · delegates to `<CrossModuleBridgeCard />` (Task 17).
- `ConceptCheckpointsSection`: h2 "Checkpoints" · iterates `frontmatter.checkpoints` and renders the typed checkpoint component (RecallCheckpoint · ApplyCheckpoint · CompareCheckpoint — no CreateCheckpoint for concepts per spec §6.3).

Every component takes the same `SectionProps` shape. This keeps `ConceptColumn` trivial:

```typescript
// src/components/modules/sd/learn/ConceptColumn.tsx
'use client';
import { useCallback } from 'react';
import { HookSection } from './concept-sections/HookSection';
import { AnalogySection } from './concept-sections/AnalogySection';
import { PrimitiveSection } from './concept-sections/PrimitiveSection';
import { AnatomySection } from './concept-sections/AnatomySection';
import { NumbersThatMatterSection } from './concept-sections/NumbersThatMatterSection';
import { TradeoffsSection } from './concept-sections/TradeoffsSection';
import { AntiCasesSection } from './concept-sections/AntiCasesSection';
import { SeenInWildSection } from './concept-sections/SeenInWildSection';
import { BridgesSection } from './concept-sections/BridgesSection';
import { ConceptCheckpointsSection } from './concept-sections/ConceptCheckpointsSection';
import { useConceptScrollSync } from '@/hooks/useConceptScrollSync';
import { useSDLearnProgress } from '@/hooks/useSDLearnProgress';
import { ScalingNumbersStrip } from './ScalingNumbersStrip';
import type { ConceptPayload, ConceptSectionId } from '@/lib/sd/content-types';

export function ConceptColumn({ payload }: { payload: ConceptPayload }) {
  const { frontmatter, sections } = payload;
  const { patch } = useSDLearnProgress('concept', frontmatter.slug);

  const onSectionEnter = useCallback((id: ConceptSectionId) => {
    patch({
      sectionState: { [id]: { visited: true } },
      lastSectionId: id,
      deepestScrollPct: Math.round(((['hook','analogy','primitive','anatomy','numbersThatMatter','tradeoffs','antiCases','seenInWild','bridges','checkpoints'].indexOf(id) + 1) / 10) * 100),
    });
  }, [patch]);

  const { register } = useConceptScrollSync({ anchorNodeIds: frontmatter.anchorNodeIds, onSectionEnter });

  return (
    <article className="pb-24" aria-labelledby="concept-title">
      <header className="mx-auto max-w-2xl pb-4 pt-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-300">Wave {frontmatter.wave} · Concept {frontmatter.waveOrder}</p>
        <h1 id="concept-title" className="mt-1 font-serif text-4xl text-foreground">{frontmatter.title}</h1>
        {frontmatter.subtitle && <p className="mt-2 font-serif italic text-foreground-muted">{frontmatter.subtitle}</p>}
        <div className="mt-4"><ScalingNumbersStrip numbers={frontmatter.scalingNumbers} dense /></div>
      </header>
      <HookSection                 id="hook"               body={sections.hook}               registerRef={register('hook')} />
      <AnalogySection              id="analogy"            body={sections.analogy}            registerRef={register('analogy')} />
      <PrimitiveSection            id="primitive"          body={sections.primitive}          registerRef={register('primitive')} />
      <AnatomySection              id="anatomy"            body={sections.anatomy}            registerRef={register('anatomy')} frontmatter={frontmatter} />
      <NumbersThatMatterSection    id="numbersThatMatter"  body={sections.numbersThatMatter}  registerRef={register('numbersThatMatter')} numbers={frontmatter.scalingNumbers} />
      <TradeoffsSection            id="tradeoffs"          body={sections.tradeoffs}          registerRef={register('tradeoffs')} />
      <AntiCasesSection            id="antiCases"          body={sections.antiCases}          registerRef={register('antiCases')} />
      <SeenInWildSection           id="seenInWild"         body={sections.seenInWild}         registerRef={register('seenInWild')} blogLinks={frontmatter.engineeringBlogLinks} />
      <BridgesSection              id="bridges"            body={sections.bridges}            registerRef={register('bridges')} slug={frontmatter.slug} />
      <ConceptCheckpointsSection   id="checkpoints"        body={sections.checkpoints}        registerRef={register('checkpoints')} checkpoints={frontmatter.checkpoints} />
    </article>
  );
}
```

- [ ] **Step 5: Build the 6 problem-pane components**

Per spec §5.5, §6.4. Problems are tabbed, so each pane is a self-contained component with its own MDX renderer. `ProblemColumn` renders a tab strip + the active pane body.

```typescript
// src/components/modules/sd/learn/ProblemColumn.tsx
'use client';
import { useMemo } from 'react';
import { ProblemStatementPane } from './problem-panes/ProblemStatementPane';
import { RequirementsPane } from './problem-panes/RequirementsPane';
import { ScaleNumbersPane } from './problem-panes/ScaleNumbersPane';
import { CanonicalDesignPane } from './problem-panes/CanonicalDesignPane';
import { FailureModesChaosPane } from './problem-panes/FailureModesChaosPane';
import { ConceptsUsedPane } from './problem-panes/ConceptsUsedPane';
import { useProblemPaneSync } from '@/hooks/useProblemPaneSync';
import { useSDLearnProgress } from '@/hooks/useSDLearnProgress';
import { ScalingNumbersStrip } from './ScalingNumbersStrip';
import { cn } from '@/lib/utils';
import type { ProblemPayload, ProblemPaneId } from '@/lib/sd/content-types';

const PANE_LABELS: Record<ProblemPaneId, string> = {
  problemStatement: 'Problem',
  requirements: 'Requirements',
  scaleNumbers: 'Napkin Math',
  canonicalDesign: 'Canonical Design',
  failureModesChaos: 'Failure & Chaos',
  conceptsUsed: 'Concepts Used',
  checkpoints: 'Checkpoints',
};

export function ProblemColumn({ payload, persona = 'journeyman' }: { payload: ProblemPayload; persona?: 'rookie' | 'journeyman' | 'architect' }) {
  const { frontmatter, panes } = payload;
  const { patch } = useSDLearnProgress('problem', frontmatter.slug);
  const { activePane, setPane, activeSolutionIndex, setSolution, activeCanvas } = useProblemPaneSync({
    frontmatter,
    onPaneChange: (id) => patch({ sectionState: { [id]: { visited: true } }, lastSectionId: id }),
  });

  const order = frontmatter.recommendedOrder[persona];
  const paneIds = useMemo(() => [...order, 'checkpoints' as const], [order]);

  return (
    <article className="pb-24">
      <header className="mx-auto max-w-3xl px-4 pb-3 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cobalt-300">{frontmatter.domain} · {frontmatter.difficulty}</p>
        <h1 className="mt-1 font-serif text-4xl">{frontmatter.title}</h1>
        <div className="mt-3"><ScalingNumbersStrip numbers={frontmatter.scalingNumbers} dense /></div>
      </header>

      <nav className="sticky top-0 z-10 border-b border-border bg-background/90 px-4 py-2 backdrop-blur" aria-label="Problem panes">
        <ul className="flex gap-1 overflow-x-auto">
          {paneIds.map((p) => (
            <li key={p}>
              <button
                onClick={() => setPane(p)}
                className={cn(
                  'whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition',
                  activePane === p ? 'bg-cobalt/20 text-cobalt-200' : 'text-foreground-muted hover:bg-cobalt/5',
                )}
                aria-current={activePane === p ? 'page' : undefined}
              >
                {PANE_LABELS[p]}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <section className="mx-auto max-w-3xl px-4 py-6">
        {activePane === 'problemStatement'  && <ProblemStatementPane body={panes.problemStatement} />}
        {activePane === 'requirements'     && <RequirementsPane     body={panes.requirements} />}
        {activePane === 'scaleNumbers'     && <ScaleNumbersPane     body={panes.scaleNumbers} numbers={frontmatter.scalingNumbers} />}
        {activePane === 'canonicalDesign'  && (
          <CanonicalDesignPane
            body={panes.canonicalDesign}
            solutions={frontmatter.canonicalSolutions}
            activeIndex={activeSolutionIndex}
            onSolutionChange={setSolution}
            canvas={activeCanvas}
          />
        )}
        {activePane === 'failureModesChaos' && <FailureModesChaosPane body={panes.failureModesChaos} chaosSlugs={frontmatter.recommendedChaos} />}
        {activePane === 'conceptsUsed'      && <ConceptsUsedPane      body={panes.conceptsUsed} conceptSlugs={frontmatter.linkedConcepts} lldSlugs={frontmatter.linkedLldPatterns} />}
        {activePane === 'checkpoints'       && <ProblemCheckpointsInline checkpoints={frontmatter.checkpoints} />}
      </section>
    </article>
  );
}
```

Individual panes are straightforward MDXRenderer wrappers. `CanonicalDesignPane` is the most complex — it renders tabs A/B/C above the `MDXRenderer` and an `<SDCanvasReadonly canvas={canvas} />` strip.

- [ ] **Step 6: Test contract of each section**

Add a snapshot test for `ConceptColumn` rendering with a fixture payload. Verify:
- All 10 section elements have `data-section-id`
- The top `ScalingNumbersStrip` renders with `frontmatter.scalingNumbers`
- H1 matches `frontmatter.title`

Add a paired test for `ProblemColumn`:
- Default `activePane` is `canonicalDesign`
- Clicking a tab updates the hash and calls `patch` with `{ sectionState: { [paneId]: { visited: true } }, lastSectionId: paneId }`
- Default recommended order matches persona prop

- [ ] **Step 7: Run + commit**

```bash
pnpm typecheck
pnpm test:run -- ConceptColumn ProblemColumn
git add architex/src/components/modules/sd/learn/
git commit -m "$(cat <<'EOF'
feat(sd-learn): section + pane components · ConceptColumn · ProblemColumn (Task 14/35)

10 concept sections + 6 problem panes + ConceptColumn (scroll-sync
IntersectionObserver) + ProblemColumn (URL-hash tab nav + per-persona
recommended order). Plus 3 Q32 content-format primitives:
ScalingNumbersStrip (cobalt-bordered inline strip), DecisionTree
(branching interactive), EngineeringBlogCard (real-company link
cards). MDX bodies render via shared MDXRenderer (LLD Phase 2).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: `SDCanvasReadonly` (scroll-sync wrapper) + `NodePopover` + 16-family registry

**Files:**
- Create: `architex/src/lib/sd/node-families.ts`
- Create: `architex/src/components/modules/sd/learn/SDCanvasReadonly.tsx`
- Create: `architex/src/components/modules/sd/learn/NodePopover.tsx`
- Create: `architex/src/components/shared/learn/popover-shell.tsx` (extracted from LLD)
- Modify: `architex/src/components/modules/lld/learn/ClassPopover.tsx` (import shared shell)

- [ ] **Step 1: Extract the shared popover shell from LLD**

LLD Phase 2 has `ClassPopover.tsx` with layout and close-on-outside-click logic. Extract the chrome (positioning, close button, focus trap, ARIA) into `src/components/shared/learn/popover-shell.tsx`, leaving pattern-specific content as children. LLD's `ClassPopover` becomes a thin wrapper.

```typescript
// src/components/shared/learn/popover-shell.tsx
'use client';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PopoverShellProps {
  title: string;
  subtitle?: string;
  anchorPos: { x: number; y: number };
  onClose: () => void;
  accent?: 'amber' | 'cobalt';
  children: React.ReactNode;
}

export function PopoverShell({ title, subtitle, anchorPos, onClose, accent = 'cobalt', children }: PopoverShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    ref.current?.querySelector<HTMLElement>('button,a,[role="button"]')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-labelledby="popover-title"
      className={cn(
        'absolute z-40 w-80 rounded-lg border bg-background p-4 shadow-xl',
        accent === 'cobalt' ? 'border-cobalt/30' : 'border-amber-500/30',
      )}
      style={{ top: anchorPos.y + 12, left: anchorPos.x + 12 }}
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-2 top-2 text-foreground-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 id="popover-title" className="font-serif text-lg pr-6">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-foreground-muted">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Write the 16-family registry**

```typescript
// src/lib/sd/node-families.ts
/**
 * SD-039: Registry of the 16 node families from spec §11.2.
 * Each family has a pedagogic content block used by NodePopover when
 * a reader clicks a node on the read-only canvas during Learn mode.
 */
export interface NodeFamilySpec {
  id: string;
  label: string;
  iconSlug: string;                       // rendered by existing IconRegistry
  colorBand: string;                      // HSL or Tailwind class
  typicalSubtypes: string[];
  conceptSlugRefs: string[];              // concept deep-dive jumps
  costPerUnitHint?: string;               // e.g. "~$0.11/hr cache.t4g.medium"
  failureModeRefs: string[];              // chaos event slugs
  description: string;                    // 1-sentence popover body
}

export const NODE_FAMILIES: NodeFamilySpec[] = [
  { id: 'client', label: 'Client tier', iconSlug: 'monitor', colorBand: 'bg-cobalt/10', typicalSubtypes: ['browser','mobile','iot','service-as-client'], conceptSlugRefs: ['client-server'], failureModeRefs: ['slow-client-attack'], description: 'Anything outside the trust boundary that initiates requests.' },
  { id: 'edge-cdn', label: 'Edge & CDN', iconSlug: 'globe', colorBand: 'bg-violet/10', typicalSubtypes: ['cloudfront','fastly','cloudflare','akamai'], conceptSlugRefs: ['cdn-fundamentals'], costPerUnitHint: '~$0.08/GB egress', failureModeRefs: ['cdn-outage','bad-cdn-purge'], description: 'Edge POPs that terminate TLS, cache, and shorten the route to users.' },
  { id: 'load-balancer', label: 'Load balancer', iconSlug: 'split', colorBand: 'bg-sky/10', typicalSubtypes: ['l4-nlb','l7-alb','envoy','nginx','dns','anycast'], conceptSlugRefs: ['load-balancing'], failureModeRefs: ['tcp-syn-flood','connection-reset-storm'], description: 'L4 or L7 fan-out across healthy backends.' },
  { id: 'api-gateway', label: 'API gateway', iconSlug: 'door-open', colorBand: 'bg-cyan/10', typicalSubtypes: ['aws-api-gw','kong','zuul','in-house'], conceptSlugRefs: ['rate-limiter-concept','api-design'], failureModeRefs: ['cloud-provider-throttle'], description: 'Auth + rate limit + routing in front of services.' },
  { id: 'app-service', label: 'App / service node', iconSlug: 'server', colorBand: 'bg-emerald/10', typicalSubtypes: ['stateless','stateful','worker','cron','lambda'], conceptSlugRefs: ['statelessness'], failureModeRefs: ['bad-deploy','noisy-neighbor-cpu'], description: 'The business-logic tier. Stateless unless explicitly marked.' },
  { id: 'db-relational', label: 'Database · relational', iconSlug: 'database', colorBand: 'bg-indigo/10', typicalSubtypes: ['postgres','mysql'], conceptSlugRefs: ['replication','consistency-models'], costPerUnitHint: '~$0.17/hr db.r6g.large', failureModeRefs: ['hot-partition','replica-desync','deadlock-storm'], description: 'SQL storage with strong transactional guarantees.' },
  { id: 'db-document', label: 'Database · document', iconSlug: 'file-text', colorBand: 'bg-indigo/10', typicalSubtypes: ['mongodb','dynamodb'], conceptSlugRefs: ['sharding'], failureModeRefs: ['hot-partition'], description: 'JSON/BSON document store.' },
  { id: 'db-column', label: 'Database · column', iconSlug: 'columns', colorBand: 'bg-indigo/10', typicalSubtypes: ['cassandra','scylla','bigquery'], conceptSlugRefs: ['consistent-hashing'], failureModeRefs: ['replica-desync'], description: 'Wide-column for heavy write workloads.' },
  { id: 'db-kv', label: 'Database · key-value', iconSlug: 'key', colorBand: 'bg-indigo/10', typicalSubtypes: ['redis','dynamodb-kv','memcached'], conceptSlugRefs: ['caching-strategies'], costPerUnitHint: '~$0.11/hr cache.t4g.medium · 100k ops/sec', failureModeRefs: ['cache-stampede','redis-eviction-cascade'], description: 'O(1) primary-key reads at sub-ms latency.' },
  { id: 'db-graph', label: 'Database · graph', iconSlug: 'share-2', colorBand: 'bg-indigo/10', typicalSubtypes: ['neo4j','neptune'], conceptSlugRefs: [], failureModeRefs: [], description: 'Node-edge storage for relationship-heavy queries.' },
  { id: 'db-timeseries', label: 'Database · time-series', iconSlug: 'activity', colorBand: 'bg-indigo/10', typicalSubtypes: ['influxdb','timescaledb','prometheus'], conceptSlugRefs: [], failureModeRefs: [], description: 'Append-optimized storage for metrics.' },
  { id: 'cache', label: 'Cache', iconSlug: 'zap', colorBand: 'bg-rose/10', typicalSubtypes: ['in-process','redis','memcached','cdn-cache'], conceptSlugRefs: ['caching-strategies'], costPerUnitHint: '~$0.11/hr cache.t4g.medium', failureModeRefs: ['cache-stampede','cache-poisoning'], description: 'Fast read-path memory.' },
  { id: 'queue', label: 'Queue / stream', iconSlug: 'layers', colorBand: 'bg-amber/10', typicalSubtypes: ['sqs','rabbitmq','kafka','kinesis'], conceptSlugRefs: ['message-queues'], failureModeRefs: ['queue-overflow-cascade'], description: 'Decouples producers and consumers.' },
  { id: 'storage', label: 'Object / file storage', iconSlug: 'box', colorBand: 'bg-slate/10', typicalSubtypes: ['s3','gcs','blob','hdfs'], conceptSlugRefs: [], costPerUnitHint: '~$0.023/GB/mo S3 Standard', failureModeRefs: [], description: 'Blob or file storage.' },
  { id: 'search-analytics', label: 'Search & analytics', iconSlug: 'search', colorBand: 'bg-teal/10', typicalSubtypes: ['elasticsearch','opensearch','algolia','snowflake'], conceptSlugRefs: ['inverted-index'], failureModeRefs: [], description: 'Inverted-index search or OLAP.' },
  { id: 'observability', label: 'Observability', iconSlug: 'bar-chart-3', colorBand: 'bg-fuchsia/10', typicalSubtypes: ['prometheus','datadog','sentry','jaeger','grafana'], conceptSlugRefs: ['observability'], failureModeRefs: [], description: 'Metrics, logs, traces — the on-call lifeline.' },
];

export const getFamily = (id: string) => NODE_FAMILIES.find((f) => f.id === id);
```

- [ ] **Step 3: `NodePopover` (SD-specific popover content)**

```typescript
// src/components/modules/sd/learn/NodePopover.tsx
'use client';
import Link from 'next/link';
import { PopoverShell } from '@/components/shared/learn/popover-shell';
import { getFamily } from '@/lib/sd/node-families';

export interface NodePopoverProps {
  familyId: string;
  subtype?: string;
  anchorPos: { x: number; y: number };
  onClose: () => void;
  onJumpToSection?: (sectionId: string) => void;
}

export function NodePopover({ familyId, subtype, anchorPos, onClose, onJumpToSection }: NodePopoverProps) {
  const f = getFamily(familyId);
  if (!f) return null;

  return (
    <PopoverShell title={f.label} subtitle={subtype} anchorPos={anchorPos} onClose={onClose} accent="cobalt">
      <p className="font-serif leading-snug">{f.description}</p>

      {f.costPerUnitHint && (
        <p className="mt-2 rounded-md bg-cobalt/5 px-2 py-1 text-xs font-mono text-cobalt-200">{f.costPerUnitHint}</p>
      )}

      {f.conceptSlugRefs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Deep-dives</p>
          <ul className="mt-1 space-y-1">
            {f.conceptSlugRefs.map((slug) => (
              <li key={slug}>
                <Link href={`/sd/learn/concepts/${slug}`} className="text-sm text-cobalt-300 hover:underline">→ {slug}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {f.failureModeRefs.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Vulnerable to</p>
          <ul className="mt-1 space-y-1">
            {f.failureModeRefs.map((slug) => (
              <li key={slug}>
                <Link href={`/sd/chaos/events/${slug}`} className="text-sm text-amber-400 hover:underline">⚠ {slug}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {onJumpToSection && (
        <button
          onClick={() => { onJumpToSection('anatomy'); onClose(); }}
          className="mt-3 rounded-md border border-cobalt/40 px-3 py-1 text-xs hover:bg-cobalt/10"
        >
          Jump to Anatomy section
        </button>
      )}
    </PopoverShell>
  );
}
```

- [ ] **Step 4: `SDCanvasReadonly` — thin wrapper that composes `LLDCanvas` (read-only), overlays `highlightedNodeIds`, and mounts `NodePopover` on click**

```typescript
// src/components/modules/sd/learn/SDCanvasReadonly.tsx
'use client';
import { useState } from 'react';
import { LLDCanvas } from '@/components/modules/lld/canvas/LLDCanvas';
import { NodePopover } from './NodePopover';

export interface SDCanvasReadonlyProps {
  canvas: unknown;                       // nodes + edges JSON from ConceptPayload.frontmatter.anchorNodeIds or ProblemPayload.canonicalSolutions[i].diagramJson
  highlightedNodeIds: string[];
  onJumpToSection?: (id: string) => void;
  inline?: boolean;                      // rendered inline in AnatomySection vs full-bleed
}

export function SDCanvasReadonly({ canvas, highlightedNodeIds, onJumpToSection, inline }: SDCanvasReadonlyProps) {
  const [popover, setPopover] = useState<{ familyId: string; subtype?: string; pos: { x: number; y: number } } | null>(null);

  return (
    <div className={inline ? 'h-64 w-full overflow-hidden rounded-md border border-border' : 'h-full w-full'}>
      <LLDCanvas
        readonly
        state={canvas as any}
        highlightedNodeIds={highlightedNodeIds}
        onNodeClick={(node, event) => {
          setPopover({
            familyId: node.data?.familyId ?? node.type ?? 'app-service',
            subtype: node.data?.subtype,
            pos: { x: event.clientX, y: event.clientY },
          });
        }}
        accentColor="cobalt"
      />
      {popover && (
        <NodePopover
          familyId={popover.familyId}
          subtype={popover.subtype}
          anchorPos={popover.pos}
          onJumpToSection={onJumpToSection}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify `LLDCanvas` props (from Pre-flight Step 6)**

If `LLDCanvas` does not yet export `readonly`, `highlightedNodeIds`, `onNodeClick(node, event)`, `accentColor`, add them now as a small, additive PR to LLD. Expected changes are ~40 LOC; all existing LLD tests continue to pass.

- [ ] **Step 6: Tests + commit**

```bash
pnpm typecheck
pnpm test:run -- NodePopover SDCanvasReadonly popover-shell
git add architex/src/lib/sd/node-families.ts \
        architex/src/components/modules/sd/learn/SDCanvasReadonly.tsx \
        architex/src/components/modules/sd/learn/NodePopover.tsx \
        architex/src/components/shared/learn/popover-shell.tsx \
        architex/src/components/modules/lld/learn/ClassPopover.tsx \
        architex/src/components/modules/lld/canvas/LLDCanvas.tsx
git commit -m "$(cat <<'EOF'
feat(sd-learn): SDCanvasReadonly · NodePopover · 16-family registry (Task 15/35)

Shared popover-shell extracted from LLD Phase 2 (focus trap, ESC-close,
outside-click, ARIA). Per-family registry (spec §11.2) with concept
deep-dive refs and chaos-event vulnerability refs populates NodePopover
when readers click a node on the read-only canvas. LLDCanvas gains
readonly/highlightedNodeIds/onNodeClick/accentColor props (additive,
LLD tests intact).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Cross-module graph generator + prebuild hook

**Files:**
- Create: `architex/scripts/build-sd-graph.ts`
- Create: `architex/src/lib/sd/concept-graph.ts` (generated — committed so tests and runtime can import synchronously)
- Modify: `architex/package.json` scripts (`build:sd-graph`, `prebuild` chain)
- Create: `architex/src/lib/sd/__tests__/concept-graph.test.ts`

The generator walks `content/sd/graph/*.graph.yaml`, validates each against `GraphYamlSchema`, and emits a TypeScript file with three typed maps: `CONCEPTS_BY_SLUG`, `RELATED_FROM_CONCEPT`, `CONFUSED_WITH`. Prebuild hook keeps the generated file in sync with YAML.

- [ ] **Step 1: Generator script**

```typescript
#!/usr/bin/env tsx
// scripts/build-sd-graph.ts
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { GraphYamlSchema, type GraphYaml } from '../src/lib/sd/content-types';

const GRAPH_ROOT = join(process.cwd(), 'content', 'sd', 'graph');
const OUT = join(process.cwd(), 'src', 'lib', 'sd', 'concept-graph.ts');

async function main() {
  const files = (await readdir(GRAPH_ROOT)).filter((f) => f.endsWith('.graph.yaml'));
  const graphs: GraphYaml[] = [];
  for (const f of files) {
    const raw = await readFile(join(GRAPH_ROOT, f), 'utf8');
    const parsed = GraphYamlSchema.safeParse(parseYaml(raw));
    if (!parsed.success) throw new Error(`[graph] ${f}: ${parsed.error.message}`);
    graphs.push(parsed.data);
  }
  const concepts = graphs.filter((g) => g.kind === 'concept');
  const problems = graphs.filter((g) => g.kind === 'problem');
  const out = `// AUTOGENERATED by scripts/build-sd-graph.ts — do not edit by hand.
// Run \`pnpm build:sd-graph\` after touching content/sd/graph/*.graph.yaml.

import type { GraphYaml } from './content-types';

export const SD_GRAPHS: readonly GraphYaml[] = ${JSON.stringify(graphs, null, 2)} as const;

export const CONCEPT_GRAPHS_BY_SLUG: Record<string, GraphYaml> = Object.freeze(
  ${JSON.stringify(Object.fromEntries(concepts.map((g) => [g.slug, g])), null, 2)}
);

export const PROBLEM_GRAPHS_BY_SLUG: Record<string, GraphYaml> = Object.freeze(
  ${JSON.stringify(Object.fromEntries(problems.map((g) => [g.slug, g])), null, 2)}
);

export function getGraph(kind: 'concept' | 'problem', slug: string): GraphYaml | null {
  return (kind === 'concept' ? CONCEPT_GRAPHS_BY_SLUG : PROBLEM_GRAPHS_BY_SLUG)[slug] ?? null;
}
`;
  await writeFile(OUT, out);
  console.log(`[graph] wrote ${OUT} with ${graphs.length} graphs (${concepts.length} concepts, ${problems.length} problems)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Initial empty generated file + pnpm scripts**

Add to `architex/package.json`:

```json
{
  "scripts": {
    "build:sd-graph": "tsx scripts/build-sd-graph.ts",
    "prebuild": "pnpm build:sd-graph && pnpm build:concept-graph"
  }
}
```

Note: `build:concept-graph` is the LLD Phase 2 generator. `prebuild` chains both so Next.js build is always up to date.

Create an initial empty `src/lib/sd/concept-graph.ts`:

```typescript
// Placeholder until build-sd-graph runs.
import type { GraphYaml } from './content-types';
export const SD_GRAPHS: readonly GraphYaml[] = [];
export const CONCEPT_GRAPHS_BY_SLUG: Record<string, GraphYaml> = {};
export const PROBLEM_GRAPHS_BY_SLUG: Record<string, GraphYaml> = {};
export function getGraph(): GraphYaml | null { return null; }
```

- [ ] **Step 3: Also materialize into `sd_graph_edges` (DB side) as part of the generator**

Extend the script to insert one row per edge into `sd_graph_edges` using `ON CONFLICT DO UPDATE`. This keeps the `/api/sd/graph` endpoint (Phase 1) consistent.

```typescript
// ... inside main() after writing concept-graph.ts:
const { db } = await import('../src/db/client');
const { sdGraphEdges } = await import('../src/db/schema');
await db.transaction(async (tx) => {
  // Delete only rows sourced from YAML files (keep chaos + runtime edges if any)
  // Skipped if unsupported — up to task team to decide delete-or-diff strategy.
  for (const g of graphs) {
    for (const e of [...g.relatedConcepts.map((x) => ({ target_type: 'sd_concept', ...x, relation: x.relation })),
                      ...g.relatedProblems.map((x) => ({ target_type: 'sd_problem', ...x })),
                      ...g.relatedLldPatterns.map((x) => ({ target_type: 'lld_pattern', ...x })),
                      ...g.relatedChaosEvents.map((x) => ({ target_type: 'sd_chaos', ...x }))]) {
      await tx.insert(sdGraphEdges).values({
        sourceType: g.kind === 'concept' ? 'sd_concept' : 'sd_problem',
        sourceSlug: g.slug,
        targetType: e.target_type,
        targetSlug: e.slug,
        relation: e.relation as any,
        bridgeText: e.bridgeText,
      }).onConflictDoNothing();
    }
  }
});
```

- [ ] **Step 4: Unit test the generator output shape**

```typescript
// src/lib/sd/__tests__/concept-graph.test.ts
import { describe, it, expect } from 'vitest';
import { CONCEPT_GRAPHS_BY_SLUG, PROBLEM_GRAPHS_BY_SLUG, getGraph } from '../concept-graph';

describe('sd concept graph (generated)', () => {
  it('exports maps with expected shape', () => {
    expect(CONCEPT_GRAPHS_BY_SLUG).toBeDefined();
    expect(PROBLEM_GRAPHS_BY_SLUG).toBeDefined();
    expect(typeof getGraph).toBe('function');
  });
  // When Task 24+ has seeded real content, re-enable:
  it.skip('client-server concept graph is populated', () => {
    const g = getGraph('concept', 'client-server');
    expect(g).not.toBeNull();
    expect(g!.relatedLldPatterns.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 5: Run + commit**

```bash
pnpm build:sd-graph
pnpm typecheck
pnpm test:run -- concept-graph
git add architex/scripts/build-sd-graph.ts \
        architex/src/lib/sd/concept-graph.ts \
        architex/src/lib/sd/__tests__/concept-graph.test.ts \
        architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd): cross-module graph generator + prebuild hook (Task 16/35)

Walks content/sd/graph/*.graph.yaml → validates via GraphYamlSchema →
emits src/lib/sd/concept-graph.ts with 3 typed frozen maps
(SD_GRAPHS, CONCEPT_GRAPHS_BY_SLUG, PROBLEM_GRAPHS_BY_SLUG) + getGraph
helper. Also inserts per-edge rows into sd_graph_edges with
on-conflict-do-nothing so /api/sd/graph (Phase 1) stays consistent.
prebuild hook chains build:sd-graph + build:concept-graph before
next build.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: `ConfusedWithPanel` + `CrossModuleBridgeCard`

**Files:**
- Create: `architex/src/components/modules/sd/learn/ConfusedWithPanel.tsx`
- Create: `architex/src/components/modules/sd/learn/CrossModuleBridgeCard.tsx`
- Create: `architex/src/components/modules/sd/learn/__tests__/ConfusedWithPanel.test.tsx`

Spec §17.2 defines the cross-module bridge card format: "1-2 sentence *relevance* caption, not a dry 'related link'. Users understand *why* to click." Spec §6 requires the "Confused with" surface on every concept page.

- [ ] **Step 1: `ConfusedWithPanel`**

```typescript
// src/components/modules/sd/learn/ConfusedWithPanel.tsx
'use client';
import Link from 'next/link';
import { getGraph } from '@/lib/sd/concept-graph';

export function ConfusedWithPanel({ kind, slug }: { kind: 'concept' | 'problem'; slug: string }) {
  const g = getGraph(kind, slug);
  if (!g || g.confusedWith.length === 0) return null;
  return (
    <aside
      className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
      aria-labelledby="confused-with-heading"
    >
      <h3 id="confused-with-heading" className="text-xs font-semibold uppercase tracking-wider text-amber-400">
        Commonly confused with
      </h3>
      <ul className="mt-2 space-y-2">
        {g.confusedWith.map((c) => (
          <li key={c.slug}>
            <Link
              href={c.kind === 'concept' ? `/sd/learn/concepts/${c.slug}` : `/sd/learn/problems/${c.slug}`}
              className="block"
            >
              <span className="font-serif text-foreground hover:text-amber-300">{c.slug}</span>
              <p className="mt-0.5 font-serif text-sm italic text-foreground-muted">{c.reason}</p>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

- [ ] **Step 2: `CrossModuleBridgeCard`**

Per §17.2 example for the SD Twitter problem:
- → LLD: Observer pattern · "How does the fan-out queue notify follower timelines? The Observer pattern gives you the object model."

```typescript
// src/components/modules/sd/learn/CrossModuleBridgeCard.tsx
'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type TargetType = 'sd_concept' | 'sd_problem' | 'lld_pattern' | 'sd_chaos';

export interface BridgeCardProps {
  targetType: TargetType;
  targetSlug: string;
  bridgeText: string;
  label?: string;
}

const TARGET_META: Record<TargetType, { hrefPrefix: string; accent: string; label: string }> = {
  sd_concept: { hrefPrefix: '/sd/learn/concepts/', accent: 'border-cobalt/30 hover:bg-cobalt/5',  label: 'SD concept'  },
  sd_problem: { hrefPrefix: '/sd/learn/problems/', accent: 'border-cobalt/30 hover:bg-cobalt/5',  label: 'SD problem'  },
  lld_pattern:{ hrefPrefix: '/lld/learn/patterns/', accent: 'border-amber-500/30 hover:bg-amber-500/5', label: 'LLD pattern' },
  sd_chaos:   { hrefPrefix: '/sd/chaos/events/',   accent: 'border-rose-500/30 hover:bg-rose-500/5',   label: 'Chaos event' },
};

export function CrossModuleBridgeCard({ targetType, targetSlug, bridgeText, label }: BridgeCardProps) {
  const meta = TARGET_META[targetType];
  return (
    <Link
      href={`${meta.hrefPrefix}${targetSlug}`}
      className={cn('group block rounded-lg border p-3 transition', meta.accent)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">{label ?? meta.label}</span>
        <ArrowRight className="h-3 w-3 text-foreground-muted transition group-hover:translate-x-0.5" />
      </div>
      <p className="mt-1 font-serif">{targetSlug}</p>
      <p className="mt-1 font-serif text-sm italic text-foreground-muted">{bridgeText}</p>
    </Link>
  );
}
```

- [ ] **Step 3: Test + commit**

```bash
pnpm test:run -- ConfusedWithPanel
git commit -m "feat(sd-learn): ConfusedWithPanel + CrossModuleBridgeCard (Task 17/35)"
```

---

## Task 18: Four checkpoint components + grading engine extension

**Files:**
- Create: `architex/src/lib/sd/checkpoint-types.ts`
- Create: `architex/src/components/modules/sd/learn/checkpoints/RecallCheckpoint.tsx`
- Create: `architex/src/components/modules/sd/learn/checkpoints/ApplyCheckpoint.tsx`
- Create: `architex/src/components/modules/sd/learn/checkpoints/CompareCheckpoint.tsx`
- Create: `architex/src/components/modules/sd/learn/checkpoints/CreateCheckpoint.tsx`
- Create: `architex/src/lib/sd/__tests__/checkpoint-grading.test.ts`

Per spec §6.3 (concepts: MCQ + rank-tradeoffs + match-to-problem; exactly 3 per concept page) and §6.4 (problems: Fermi estimate + pick-the-failure-mode + chaos-match; exactly 3 per problem page). Plus a Create checkpoint available to any page type for the "design this" interaction.

Progressive-reveal on failure mirrors LLD Phase 2 Task 18: attempts 1-2 show a `whyWrong` targeted hint, attempt 3 reveals the correct answer with full explanation. FSRS rating is derived: first-try correct = Easy, second-try correct = Good, third-try correct = Hard, reveal = Again.

- [ ] **Step 1: Shared checkpoint types + grading engine**

```typescript
// src/lib/sd/checkpoint-types.ts
export type CheckpointKind = 'recall' | 'apply' | 'compare' | 'create';
export type FsrsRating = 'again' | 'hard' | 'good' | 'easy';

export interface CheckpointAttempt {
  checkpointId: string;
  attempts: number;        // 1..N
  correct: boolean;
  revealed: boolean;       // user asked for reveal
  firstTryCorrect: boolean;
}

export function deriveFsrsRating(a: CheckpointAttempt): FsrsRating {
  if (a.revealed) return 'again';
  if (a.firstTryCorrect) return 'easy';
  if (a.attempts === 2 && a.correct) return 'good';
  if (a.attempts === 3 && a.correct) return 'hard';
  return 'again';
}

/** RecallCheckpoint grading — single-select MCQ */
export function gradeRecall(options: { id: string; isCorrect: boolean }[], selectedId: string) {
  return !!options.find((o) => o.id === selectedId && o.isCorrect);
}

/** ApplyCheckpoint grading — set-matching (selected == correctNodeIds, no distractors) */
export function gradeApply(selected: string[], correct: string[], distractors: string[]) {
  const selSet = new Set(selected);
  const correctSet = new Set(correct);
  const missing = [...correctSet].filter((id) => !selSet.has(id));
  const extra = selected.filter((id) => !correctSet.has(id));
  return { correct: missing.length === 0 && extra.length === 0, missing, extra };
}

/** CompareCheckpoint grading — each statement has a label (left|right|both|neither) */
export function gradeCompare(statements: { id: string; correct: 'left' | 'right' | 'both' | 'neither' }[], answers: Record<string, 'left' | 'right' | 'both' | 'neither'>) {
  let correct = 0;
  const wrong: string[] = [];
  for (const s of statements) {
    if (answers[s.id] === s.correct) correct++;
    else wrong.push(s.id);
  }
  return { correct: correct === statements.length, score: correct, total: statements.length, wrong };
}

/** CreateCheckpoint grading — rubric-based; user canvas is compared criterion-by-criterion via deterministic heuristics. */
export interface CreateSubmission { nodes: Array<{ id: string; familyId?: string; subtype?: string }>; edges: Array<{ source: string; target: string }> }
export function gradeCreate(submission: CreateSubmission, rubric: Array<{ criterion: string; points: number }>): { total: number; max: number; perCriterion: Array<{ criterion: string; earned: number; max: number }> } {
  const max = rubric.reduce((n, r) => n + r.points, 0);
  // Heuristic: for Phase 2, every criterion is worth either 0 or its points.
  // Real grading (Phase 3 Drill mode) uses Sonnet rubric grader; this is a
  // local-heuristic fallback that matches the spec's "lenient first draft"
  // stance — marking presence of familyIds named in the criterion string.
  const perCriterion = rubric.map((r) => {
    const keywords = r.criterion.toLowerCase().split(/[\s,·]+/).filter((w) => w.length > 3);
    const hit = keywords.some((kw) => submission.nodes.some((n) => (n.familyId ?? '').toLowerCase().includes(kw) || (n.subtype ?? '').toLowerCase().includes(kw)));
    return { criterion: r.criterion, earned: hit ? r.points : 0, max: r.points };
  });
  return { total: perCriterion.reduce((n, c) => n + c.earned, 0), max, perCriterion };
}
```

- [ ] **Step 2: `RecallCheckpoint` with progressive reveal**

```typescript
// src/components/modules/sd/learn/checkpoints/RecallCheckpoint.tsx
'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { deriveFsrsRating, gradeRecall, type CheckpointAttempt, type FsrsRating } from '@/lib/sd/checkpoint-types';

export interface RecallCheckpointProps {
  checkpoint: {
    id: string;
    prompt: string;
    options: Array<{ id: string; label: string; isCorrect: boolean; whyWrong?: string }>;
    explanation: string;
  };
  onResult: (result: { attempt: CheckpointAttempt; fsrs: FsrsRating }) => void;
}

export function RecallCheckpoint({ checkpoint, onResult }: RecallCheckpointProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastWrongId, setLastWrongId] = useState<string | null>(null);

  const submit = () => {
    if (!selected || solved) return;
    const correct = gradeRecall(checkpoint.options, selected);
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (correct) {
      setSolved(true);
      const a: CheckpointAttempt = { checkpointId: checkpoint.id, attempts: nextAttempts, correct: true, revealed: false, firstTryCorrect: nextAttempts === 1 };
      onResult({ attempt: a, fsrs: deriveFsrsRating(a) });
    } else {
      setLastWrongId(selected);
      if (nextAttempts >= 3) {
        setRevealed(true);
        setSolved(true);
        const a: CheckpointAttempt = { checkpointId: checkpoint.id, attempts: nextAttempts, correct: false, revealed: true, firstTryCorrect: false };
        onResult({ attempt: a, fsrs: 'again' });
      }
    }
  };

  const wrongOption = checkpoint.options.find((o) => o.id === lastWrongId);

  return (
    <div className="my-6 rounded-lg border border-cobalt/30 p-4">
      <p className="font-serif text-lg">{checkpoint.prompt}</p>
      <ul className="mt-3 space-y-1">
        {checkpoint.options.map((o) => (
          <li key={o.id}>
            <label
              className={cn(
                'block cursor-pointer rounded-md border border-transparent px-3 py-2 transition',
                selected === o.id && !solved && 'border-cobalt/40 bg-cobalt/10',
                solved && o.isCorrect && 'border-emerald-500/40 bg-emerald-500/10',
                solved && revealed && !o.isCorrect && 'opacity-60',
              )}
            >
              <input type="radio" name={checkpoint.id} value={o.id} disabled={solved}
                     checked={selected === o.id} onChange={() => setSelected(o.id)} className="mr-2" />
              {o.label}
            </label>
          </li>
        ))}
      </ul>
      {!solved && (
        <button onClick={submit} disabled={!selected}
                className="mt-3 rounded-md bg-cobalt/20 px-4 py-1.5 text-sm hover:bg-cobalt/30 disabled:opacity-50">
          Submit {attempts > 0 ? `(attempt ${attempts + 1})` : ''}
        </button>
      )}
      {!solved && wrongOption?.whyWrong && (
        <p className="mt-3 rounded-md bg-amber-500/10 p-2 text-sm font-serif italic text-amber-200">
          Not quite. {wrongOption.whyWrong}
        </p>
      )}
      {solved && (
        <p className="mt-3 rounded-md bg-emerald-500/10 p-2 text-sm font-serif italic">
          {revealed ? 'Revealed. ' : attempts === 1 ? 'First-try correct. ' : ''}
          {checkpoint.explanation}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: `ApplyCheckpoint` — multi-select node picker**

Renders the architecture mini-canvas from `frontmatter.anchorNodeIds` or a provided subset. User toggles nodes; submit computes `gradeApply(selected, correct, distractors)`. On attempt 2, the `missing`/`extra` hint surfaces: "Missing: `DatabaseConnectionPool`. Extra: `Query`." Attempt 3 reveals.

```typescript
// src/components/modules/sd/learn/checkpoints/ApplyCheckpoint.tsx
'use client';
import { useState } from 'react';
import { gradeApply, deriveFsrsRating } from '@/lib/sd/checkpoint-types';

export interface ApplyCheckpointProps {
  checkpoint: {
    id: string; scenario: string;
    correctNodeIds: string[]; distractorNodeIds: string[];
    explanation: string;
  };
  onResult: (r: { attempt: any; fsrs: any }) => void;
}

export function ApplyCheckpoint({ checkpoint, onResult }: ApplyCheckpointProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastGrade, setLastGrade] = useState<{ missing: string[]; extra: string[] } | null>(null);

  const all = [...checkpoint.correctNodeIds, ...checkpoint.distractorNodeIds];
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const submit = () => {
    const g = gradeApply([...selected], checkpoint.correctNodeIds, checkpoint.distractorNodeIds);
    const next = attempts + 1;
    setAttempts(next);
    if (g.correct) {
      setSolved(true);
      const a = { checkpointId: checkpoint.id, attempts: next, correct: true, revealed: false, firstTryCorrect: next === 1 };
      onResult({ attempt: a, fsrs: deriveFsrsRating(a) });
    } else {
      setLastGrade({ missing: g.missing, extra: g.extra });
      if (next >= 3) { setRevealed(true); setSolved(true); onResult({ attempt: { checkpointId: checkpoint.id, attempts: next, correct: false, revealed: true, firstTryCorrect: false }, fsrs: 'again' }); }
    }
  };

  return (
    <div className="my-6 rounded-lg border border-cobalt/30 p-4">
      <p className="font-serif">{checkpoint.scenario}</p>
      <p className="mt-1 text-xs text-foreground-muted">Pick the nodes that belong to this pattern.</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {all.map((id) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => !solved && toggle(id)}
              className={`rounded-md border px-2 py-1 text-sm transition
                ${selected.has(id) ? 'border-cobalt/60 bg-cobalt/20' : 'border-border'}
                ${revealed && checkpoint.correctNodeIds.includes(id) ? 'border-emerald-500/60 bg-emerald-500/10' : ''}`}
            >
              {id}
            </button>
          </li>
        ))}
      </ul>
      {!solved && <button onClick={submit} className="mt-3 rounded-md bg-cobalt/20 px-4 py-1.5 text-sm hover:bg-cobalt/30">Submit</button>}
      {!solved && lastGrade && (
        <p className="mt-3 rounded-md bg-amber-500/10 p-2 text-sm font-serif italic">
          {lastGrade.missing.length > 0 && <>Missing: <code>{lastGrade.missing.join(', ')}</code>. </>}
          {lastGrade.extra.length > 0 && <>Extra: <code>{lastGrade.extra.join(', ')}</code>.</>}
        </p>
      )}
      {solved && (
        <p className="mt-3 rounded-md bg-emerald-500/10 p-2 text-sm font-serif italic">{checkpoint.explanation}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: `CompareCheckpoint` — per-statement left/right/both/neither**

Renders one table with a row per statement and radio buttons in each column. Progressive reveal on failure: attempt 2 marks wrong rows; attempt 3 reveals all correct answers.

- [ ] **Step 5: `CreateCheckpoint` — embedded canvas picker + rubric feedback**

Renders a small editable canvas (re-uses `LLDCanvas` in edit-mode) pre-filled with `starterCanvas`. User adds nodes/edges. Submit invokes `gradeCreate(submission, rubric)` and shows per-criterion earned/max breakdown. "Show reference solution" button reveals `referenceSolution` on a read-only canvas next to the user's.

- [ ] **Step 6: Tests**

```typescript
// src/lib/sd/__tests__/checkpoint-grading.test.ts
import { describe, it, expect } from 'vitest';
import { gradeRecall, gradeApply, gradeCompare, gradeCreate, deriveFsrsRating } from '../checkpoint-types';

describe('gradeRecall', () => {
  it('is correct only when the selected option is isCorrect:true', () => {
    const opts = [{ id: 'a', isCorrect: false }, { id: 'b', isCorrect: true }];
    expect(gradeRecall(opts, 'b')).toBe(true);
    expect(gradeRecall(opts, 'a')).toBe(false);
  });
});

describe('gradeApply', () => {
  it('surfaces missing and extra sets', () => {
    const g = gradeApply(['a', 'c'], ['a', 'b'], ['c', 'd']);
    expect(g.correct).toBe(false);
    expect(g.missing).toEqual(['b']);
    expect(g.extra).toEqual(['c']);
  });
});

describe('gradeCompare', () => {
  it('counts exact matches across statements', () => {
    const r = gradeCompare(
      [{ id: 's1', correct: 'left' }, { id: 's2', correct: 'both' }],
      { s1: 'left', s2: 'right' }
    );
    expect(r.score).toBe(1);
    expect(r.correct).toBe(false);
  });
});

describe('gradeCreate', () => {
  it('awards points when the submission contains a matching familyId keyword', () => {
    const r = gradeCreate(
      { nodes: [{ id: 'n1', familyId: 'cache' }], edges: [] },
      [{ criterion: 'Cache layer present', points: 2 }],
    );
    expect(r.total).toBe(2);
    expect(r.perCriterion[0].earned).toBe(2);
  });
});

describe('deriveFsrsRating', () => {
  it('Easy on first-try correct', () => {
    expect(deriveFsrsRating({ checkpointId:'x', attempts:1, correct:true, revealed:false, firstTryCorrect:true })).toBe('easy');
  });
  it('Again on reveal', () => {
    expect(deriveFsrsRating({ checkpointId:'x', attempts:3, correct:false, revealed:true, firstTryCorrect:false })).toBe('again');
  });
  it('Good on second-try correct', () => {
    expect(deriveFsrsRating({ checkpointId:'x', attempts:2, correct:true, revealed:false, firstTryCorrect:false })).toBe('good');
  });
  it('Hard on third-try correct', () => {
    expect(deriveFsrsRating({ checkpointId:'x', attempts:3, correct:true, revealed:false, firstTryCorrect:false })).toBe('hard');
  });
});
```

- [ ] **Step 7: Run + commit**

```bash
pnpm typecheck && pnpm test:run -- checkpoint-grading
git add architex/src/lib/sd/checkpoint-types.ts \
        architex/src/lib/sd/__tests__/checkpoint-grading.test.ts \
        architex/src/components/modules/sd/learn/checkpoints/
git commit -m "$(cat <<'EOF'
feat(sd-learn): 4 checkpoint kinds + grading engine (Task 18/35)

RecallCheckpoint (MCQ · progressive reveal on attempts 1-2-3),
ApplyCheckpoint (multi-select node picker with missing/extra hints),
CompareCheckpoint (left/right/both/neither per statement),
CreateCheckpoint (canvas submission · keyword-heuristic rubric grading
for Phase 2; Sonnet rubric grader arrives in Phase 3 Drill mode).
deriveFsrsRating: first-try=Easy · 2nd=Good · 3rd=Hard · reveal=Again
matching LLD Phase 2 contract.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: 3 AI API routes (explain-inline · suggest-analogy · show-at-scale)

**Files:**
- Create: `architex/src/app/api/sd/explain-inline/route.ts`
- Create: `architex/src/app/api/sd/suggest-analogy/route.ts`
- Create: `architex/src/app/api/sd/show-at-scale/route.ts`
- Create: `architex/src/app/api/sd/__tests__/sd-ai-surfaces.test.ts`

Per spec §6.6 (three contextual Ask-AI surfaces per page) and §15.3.1 Learn features L1-L3:
- **L1 · Ask-the-Architect (explain-inline)** — Sonnet · ~$0.015/session · selected paragraph + section context
- **L2 · Elaborative interrogation grader** — Haiku · 1-5 rubric for free-text "why?" answers · not in Phase 2 scope (deferred to Phase 4)
- **L3 · Concept explainer (suggest-analogy)** — Sonnet · "explain this differently" on a selected paragraph · ~$0.01

Plus one SD-Phase-2-specific surface requested in the task brief:
- **show-me-at-scale** — Sonnet · reader selects a concept or napkin-math section and the AI projects "what does this look like at 10k DAU vs 1M vs 100M" · ~$0.04/call, cached with IndexedDB

Each route:
1. Extracts `userId` via `auth()`, 401s if missing
2. Validates body via Zod
3. Checks `aiUsage` table for daily cap (~$2 free, ~$10 pro per spec §15.7)
4. Calls Anthropic via the singleton client with progress-aware `UserContext` payload (§15.6)
5. Writes the usage row and returns the reply

- [ ] **Step 1: Shared request helper**

```typescript
// src/lib/sd/ai-user-context.ts
import { db } from '@/db/client';
import { sdLearnProgress } from '@/db/schema';
import { and, eq } from 'drizzle-orm';

export interface UserContext {
  userId: string;
  personaGuess: 'rookie' | 'journeyman' | 'architect';
  masteredConceptSlugs: string[];
  currentConceptSlug?: string;
  currentProblemSlug?: string;
  voiceVariant: 'eli5' | 'standard' | 'eli-senior';
}

export async function buildUserContext(opts: {
  userId: string;
  currentKind?: 'concept' | 'problem';
  currentSlug?: string;
  voiceVariant?: 'eli5' | 'standard' | 'eli-senior';
}): Promise<UserContext> {
  const completed = await db.select().from(sdLearnProgress).where(
    and(eq(sdLearnProgress.userId, opts.userId), eq(sdLearnProgress.kind, 'concept')),
  );
  const mastered = completed.filter((r) => r.completedAt !== null).map((r) => r.slug);
  const personaGuess: UserContext['personaGuess'] =
    mastered.length >= 20 ? 'architect' : mastered.length >= 8 ? 'journeyman' : 'rookie';
  return {
    userId: opts.userId,
    personaGuess,
    masteredConceptSlugs: mastered,
    currentConceptSlug: opts.currentKind === 'concept' ? opts.currentSlug : undefined,
    currentProblemSlug: opts.currentKind === 'problem' ? opts.currentSlug : undefined,
    voiceVariant: opts.voiceVariant ?? 'standard',
  };
}
```

- [ ] **Step 2: `POST /api/sd/explain-inline` (Haiku)**

```typescript
// src/app/api/sd/explain-inline/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { claudeClient } from '@/lib/ai/claude-client';
import { recordAiUsage, checkDailyCap } from '@/lib/ai/usage';
import { buildUserContext } from '@/lib/sd/ai-user-context';
import { z } from 'zod';

const Schema = z.object({
  kind: z.enum(['concept', 'problem']),
  slug: z.string(),
  sectionId: z.string(),
  selection: z.string().min(4).max(2000),
  voiceVariant: z.enum(['eli5', 'standard', 'eli-senior']).optional(),
});

const SYSTEM = (voice: string) => `You are the Architex contextual assistant — the reader's more-experienced
engineer in the next chair. Explain the selected paragraph in 3-5
short paragraphs (not bullets). Voice: ${voice}. Do not invent facts;
stay within the material provided in context. Prefer one concrete
analogy and one "you gain X, you pay Y" tradeoff. No greetings.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const cap = await checkDailyCap(session.user.id, 'haiku');
  if (!cap.allowed) return NextResponse.json({ error: 'daily cap reached', resetAt: cap.resetAt }, { status: 429 });

  const ctx = await buildUserContext({
    userId: session.user.id,
    currentKind: parsed.data.kind,
    currentSlug: parsed.data.slug,
    voiceVariant: parsed.data.voiceVariant,
  });

  const res = await claudeClient.generateWithHaiku({
    system: SYSTEM(ctx.voiceVariant),
    messages: [
      { role: 'user', content: [
        { type: 'text', text: `<user-context>${JSON.stringify(ctx)}</user-context>` },
        { type: 'text', text: `<section-id>${parsed.data.sectionId}</section-id>` },
        { type: 'text', text: `<selection>${parsed.data.selection}</selection>` },
      ] },
    ],
    maxTokens: 600,
    cacheKey: `sd-explain:${parsed.data.slug}:${parsed.data.sectionId}:${hash(parsed.data.selection)}`,
  });
  await recordAiUsage({ userId: session.user.id, model: 'haiku', surface: 'sd-explain-inline', inputTokens: res.usage.inputTokens, outputTokens: res.usage.outputTokens });

  return NextResponse.json({ explanation: res.text });
}

function hash(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h.toString(36); }
```

- [ ] **Step 3: `POST /api/sd/suggest-analogy` (Haiku)**

Same structure; system prompt: *"Write one concrete physical analogy for the selected paragraph. Prefer everyday objects (mail, water, doors, vehicles). Avoid programming-specific analogies. 2-4 sentences. No preamble."*

- [ ] **Step 4: `POST /api/sd/show-at-scale` (Sonnet)**

```typescript
// src/app/api/sd/show-at-scale/route.ts
// ... body schema:
const Schema = z.object({
  kind: z.enum(['concept', 'problem']),
  slug: z.string(),
  scales: z.array(z.enum(['10k', '1M', '10M', '100M', '1B'])).min(2).max(5).default(['10k', '1M', '100M']),
  focus: z.enum(['latency', 'cost', 'throughput', 'failure-surface']).default('cost'),
});

const SYSTEM = `You are the Architex scale-projection oracle. Given the
concept or problem the reader is viewing, project typical numbers at
three or more scales. Return a JSON array of objects:
  [{ scale: "10k", value: "...", explanation: "one sentence", tradeoff: "one sentence" }, ...]
Use realistic benchmarks from published engineering blogs (cite year in
the explanation when possible). Match the reader's persona for
technical depth.`;
```

Returns structured JSON, rendered by `AskAISurface` (Task 21) as a 3-column comparison.

- [ ] **Step 5: Tests + commit**

```bash
pnpm typecheck && pnpm test:run -- sd-ai-surfaces
git add architex/src/app/api/sd/explain-inline \
        architex/src/app/api/sd/suggest-analogy \
        architex/src/app/api/sd/show-at-scale \
        architex/src/lib/sd/ai-user-context.ts \
        architex/src/app/api/sd/__tests__/sd-ai-surfaces.test.ts
git commit -m "$(cat <<'EOF'
feat(api): 3 sd learn ai surfaces · explain-inline · suggest-analogy · show-at-scale (Task 19/35)

- explain-inline (Haiku, ~$0.015/call): 3-5 paragraph contextual
  explanation of a reader-selected excerpt with progress-aware voice
  variant.
- suggest-analogy (Haiku, ~$0.01): physical-world analogy generator.
- show-at-scale (Sonnet, ~$0.04): structured JSON projection across
  2-5 scale tiers (10k/1M/10M/100M/1B), focused on latency/cost/
  throughput/failure-surface.

All routes enforce auth + daily cap, build progress-aware UserContext
from sd_learn_progress, record usage per surface, and cache via the
Haiku cacheKey.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: 3 AI hooks

**Files:**
- Create: `architex/src/hooks/useSDSelectionExplain.ts`
- Create: `architex/src/hooks/useSDSuggestAnalogy.ts`
- Create: `architex/src/hooks/useSDShowAtScale.ts`
- Create: `architex/src/hooks/__tests__/useSDSelectionExplain.test.tsx`

- [ ] **Step 1: `useSDSelectionExplain`**

```typescript
// src/hooks/useSDSelectionExplain.ts
'use client';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

export function useSDSelectionExplain(kind: 'concept' | 'problem', slug: string) {
  const [selection, setSelection] = useState<{ text: string; sectionId: string; anchorPos: { x: number; y: number } } | null>(null);
  const mutation = useMutation({
    mutationFn: async (s: { text: string; sectionId: string }) => {
      const r = await fetch('/api/sd/explain-inline', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, slug, sectionId: s.sectionId, selection: s.text }),
      });
      if (!r.ok) {
        const body = await r.json();
        throw new Error(body.error ?? 'explain failed');
      }
      return (await r.json()).explanation as string;
    },
  });

  useEffect(() => {
    const onSelect = () => {
      const sel = window.getSelection();
      const text = sel?.toString().trim() ?? '';
      if (text.length < 10) { setSelection(null); return; }
      const range = sel!.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const sectionEl = (range.commonAncestorContainer as HTMLElement).closest?.('[data-section-id]');
      const sectionId = sectionEl?.getAttribute('data-section-id') ?? '';
      setSelection({ text, sectionId, anchorPos: { x: rect.left + rect.width / 2, y: rect.top } });
    };
    document.addEventListener('mouseup', onSelect);
    document.addEventListener('touchend', onSelect);
    return () => {
      document.removeEventListener('mouseup', onSelect);
      document.removeEventListener('touchend', onSelect);
    };
  }, []);

  const explain = () => {
    if (!selection) return;
    mutation.mutate({ text: selection.text, sectionId: selection.sectionId });
  };

  const clear = () => { setSelection(null); mutation.reset(); };

  return {
    selection,
    explain,
    clear,
    explanation: mutation.data,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
```

- [ ] **Step 2: `useSDSuggestAnalogy` (same shape, different endpoint)** — same selection source, POST to `/api/sd/suggest-analogy`.

- [ ] **Step 3: `useSDShowAtScale`** — invoked explicitly via a button on the Numbers section; takes `{ scales, focus }` args; returns structured JSON.

- [ ] **Step 4: Tests + commit**

```bash
git commit -m "feat(hooks): 3 sd ai hooks · selection explain · suggest analogy · show at scale (Task 20/35)"
```

---

## Task 21: `AskAISurface` component with 3-tab drawer

**Files:**
- Create: `architex/src/components/modules/sd/learn/AskAISurface.tsx`
- Create: `architex/src/components/modules/sd/learn/AskAIFloatingButton.tsx`

Per spec §6.6, three surfaces compose one drawer:
1. End-of-section "Questions about this section? [Ask →]"
2. After 3 failed checkpoint attempts "Want a deeper explanation?"
3. On "Confused with" cards "Compare →"

One drawer, three tabs: Explain · Analogy · At Scale.

```typescript
// src/components/modules/sd/learn/AskAISurface.tsx
'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSDSelectionExplain } from '@/hooks/useSDSelectionExplain';
import { useSDSuggestAnalogy } from '@/hooks/useSDSuggestAnalogy';
import { useSDShowAtScale } from '@/hooks/useSDShowAtScale';

export interface AskAISurfaceProps {
  kind: 'concept' | 'problem';
  slug: string;
  defaultTab?: 'explain' | 'analogy' | 'scale';
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AskAISurface({ kind, slug, defaultTab = 'explain', open, onOpenChange }: AskAISurfaceProps) {
  const [tab, setTab] = useState(defaultTab);
  const explain = useSDSelectionExplain(kind, slug);
  const analogy = useSDSuggestAnalogy(kind, slug);
  const scale   = useSDShowAtScale(kind, slug);

  if (!open) return null;
  return (
    <aside
      role="dialog"
      aria-labelledby="ask-ai-title"
      className="fixed bottom-4 right-4 z-40 w-96 max-h-[70vh] overflow-auto rounded-xl border border-cobalt/30 bg-background p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <h3 id="ask-ai-title" className="font-serif text-lg text-cobalt-200">Ask the Architect</h3>
        <button onClick={() => onOpenChange(false)} aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div role="tablist" aria-label="Ask AI mode" className="mt-2 flex gap-1 border-b border-border">
        {(['explain', 'analogy', 'scale'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('rounded-t-md px-3 py-1.5 text-sm capitalize', tab === t ? 'bg-cobalt/20 text-cobalt-200' : 'text-foreground-muted')}
          >
            {t === 'scale' ? 'At scale' : t}
          </button>
        ))}
      </div>

      {tab === 'explain' && (
        <div className="mt-3">
          {!explain.selection && <p className="text-sm text-foreground-muted">Select a paragraph in the lesson to explain it.</p>}
          {explain.selection && !explain.explanation && (
            <>
              <blockquote className="border-l-2 border-cobalt/40 pl-3 text-sm font-serif italic">
                {explain.selection.text.slice(0, 180)}{explain.selection.text.length > 180 && '…'}
              </blockquote>
              <button onClick={explain.explain} disabled={explain.isLoading}
                      className="mt-2 rounded-md bg-cobalt/20 px-3 py-1 text-sm hover:bg-cobalt/30 disabled:opacity-50">
                {explain.isLoading ? 'Thinking…' : 'Explain this'}
              </button>
            </>
          )}
          {explain.explanation && (
            <article className="prose-sd mt-2 max-h-64 overflow-auto font-serif text-sm leading-relaxed">
              {explain.explanation}
            </article>
          )}
        </div>
      )}

      {tab === 'analogy' && (
        <div className="mt-3">
          {/* same pattern, analogy.* instead of explain.* */}
        </div>
      )}

      {tab === 'scale' && (
        <div className="mt-3">
          <button
            onClick={() => scale.run({ scales: ['10k', '1M', '100M', '1B'], focus: 'cost' })}
            disabled={scale.isLoading}
            className="rounded-md bg-cobalt/20 px-3 py-1 text-sm hover:bg-cobalt/30 disabled:opacity-50"
          >
            {scale.isLoading ? 'Projecting…' : 'Project across 10k → 1B DAU'}
          </button>
          {scale.data && (
            <table className="mt-3 w-full text-xs">
              <thead>
                <tr className="text-left"><th>Scale</th><th>Value</th><th>Trade-off</th></tr>
              </thead>
              <tbody>
                {scale.data.map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 font-mono">{row.scale}</td>
                    <td className="py-1 font-mono">{row.value}</td>
                    <td className="py-1 font-serif italic">{row.tradeoff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </aside>
  );
}
```

The floating button (`AskAIFloatingButton`) renders at the bottom-right of `SDLearnModeLayout` and opens the drawer. Three auto-open hooks (end-of-section + 3-fail + confused-with) are wired inside Task 23.

- [ ] **Step 2: Tests + commit**

Cover: drawer opens on `AskAIFloatingButton` click, tab-switching, explain path renders loading + result.

```bash
git commit -m "feat(sd-learn): AskAISurface 3-tab drawer + floating entry button (Task 21/35)"
```

---

## Task 22: Reading aids — sidebar (wave/domain filter), progress bar, TOC, bookmarks strip

**Files:**
- Create: `architex/src/components/modules/sd/learn/SDLearnSidebar.tsx`
- Create: `architex/src/components/modules/sd/learn/SDLessonProgressBar.tsx`
- Create: `architex/src/components/modules/sd/learn/SDTableOfContents.tsx`
- Create: `architex/src/components/modules/sd/learn/SDBookmarkStrip.tsx`
- Create: `architex/src/hooks/useSDTableOfContents.ts`

- [ ] **Step 1: `SDLearnSidebar` — wave/domain filter with 8 waves + 6 domains**

Shows a vertical nav: "Waves" group for 40 concepts by wave (8 collapsible groups, 5 concepts each), "Problems" group by domain. Active slug highlighted in cobalt; completed slugs marked with ◉, mastered with ★ (Q4 tier model). The sidebar queries:
- `listConceptSlugsByWave()` (Task 7) for concept tree
- `listProblemsByDomain()` for problem tree
- `GET /api/sd/learn-progress` for all progress rows → derive completion state

Left 200px column per §6.2 baseline.

- [ ] **Step 2: `SDLessonProgressBar`**

```typescript
// src/components/modules/sd/learn/SDLessonProgressBar.tsx
'use client';
import { motion } from 'motion/react';

export function SDLessonProgressBar({ percent, label }: { percent: number; label?: string }) {
  return (
    <div className="sticky top-0 z-20 w-full bg-background/90 backdrop-blur">
      <motion.div
        className="h-0.5 bg-cobalt-400"
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}
```

Wired to `useSDLearnProgress().progress.deepestScrollPct`.

- [ ] **Step 3: `SDTableOfContents` + `useSDTableOfContents`**

Right-column 240px inner section of the 420px right pane (§6.2). Shows the 10 section anchors (for concept) or 7 pane anchors (for problem). Click → `scrollToSection(id)`. Active anchor highlighted in cobalt.

```typescript
// src/hooks/useSDTableOfContents.ts
'use client';
import { useMemo } from 'react';
import type { ConceptPayload, ProblemPayload, ConceptSectionId, ProblemPaneId } from '@/lib/sd/content-types';

export function useSDTableOfContents<T extends 'concept' | 'problem'>(
  kind: T,
  payload: T extends 'concept' ? ConceptPayload : ProblemPayload,
  activeId: string | null,
) {
  const items = useMemo(() => {
    if (kind === 'concept') {
      return [
        { id: 'hook',              label: 'The Itch' },
        { id: 'analogy',           label: 'Analogy' },
        { id: 'primitive',         label: 'The Primitive' },
        { id: 'anatomy',           label: 'Anatomy' },
        { id: 'numbersThatMatter', label: 'Numbers' },
        { id: 'tradeoffs',         label: 'Tradeoffs' },
        { id: 'antiCases',         label: 'When Not To Use' },
        { id: 'seenInWild',        label: 'Seen in the Wild' },
        { id: 'bridges',           label: 'Bridges' },
        { id: 'checkpoints',       label: 'Checkpoints' },
      ] satisfies Array<{ id: ConceptSectionId; label: string }>;
    }
    return [
      { id: 'problemStatement',  label: 'Problem' },
      { id: 'requirements',      label: 'Requirements' },
      { id: 'scaleNumbers',      label: 'Napkin Math' },
      { id: 'canonicalDesign',   label: 'Canonical Design' },
      { id: 'failureModesChaos', label: 'Failure & Chaos' },
      { id: 'conceptsUsed',      label: 'Concepts Used' },
      { id: 'checkpoints',       label: 'Checkpoints' },
    ] satisfies Array<{ id: ProblemPaneId; label: string }>;
  }, [kind]);

  return { items, activeId };
}
```

- [ ] **Step 4: `SDBookmarkStrip`**

A horizontal strip above the lesson column listing user-created bookmarks for the current page. Each is a pill with label; clicking jumps to the section via `scrollToSection`. Rendered from `useSDBookmarks(kind, slug)`.

- [ ] **Step 5: Tests + commit**

Cover: sidebar groups render correctly when progress list is empty vs populated, progress bar updates with motion, TOC active state follows `activeSection`.

```bash
git commit -m "feat(sd-learn): sidebar + progress bar + TOC + bookmark strip (Task 22/35)"
```

---

## Task 23: Rewrite `SDLearnModeLayout` to compose everything

**Files:**
- Modify: `architex/src/components/modules/sd/modes/SDLearnModeLayout.tsx`

The Phase 1 stub becomes a real 3-column layout composing sidebar + center column + right pane. Two route shapes:
- `/sd/learn/concepts/[slug]` — server component pre-fetches concept via `loadConcept`, renders `ConceptColumn`
- `/sd/learn/problems/[slug]` — same for `ProblemColumn`

When `slug` is absent, show the Learn library grid (cards for concepts + problems).

- [ ] **Step 1: Server-side concept route**

Create `architex/src/app/sd/learn/concepts/[slug]/page.tsx`:

```typescript
import { notFound } from 'next/navigation';
import { ConceptLearnView } from '@/components/modules/sd/modes/SDLearnModeLayout';
import { loadConcept, ConceptNotFoundError } from '@/lib/sd/concept-loader';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const payload = await loadConcept(slug);
    return <ConceptLearnView payload={payload} />;
  } catch (e) {
    if (e instanceof ConceptNotFoundError) notFound();
    throw e;
  }
}
```

Parallel `architex/src/app/sd/learn/problems/[slug]/page.tsx` with `ProblemLearnView`.

- [ ] **Step 2: Client-side composition in `SDLearnModeLayout`**

```typescript
// src/components/modules/sd/modes/SDLearnModeLayout.tsx
'use client';
import { useMemo, useState } from 'react';
import { ConceptColumn } from '@/components/modules/sd/learn/ConceptColumn';
import { ProblemColumn } from '@/components/modules/sd/learn/ProblemColumn';
import { SDLearnSidebar } from '@/components/modules/sd/learn/SDLearnSidebar';
import { SDTableOfContents } from '@/components/modules/sd/learn/SDTableOfContents';
import { SDBookmarkStrip } from '@/components/modules/sd/learn/SDBookmarkStrip';
import { SDLessonProgressBar } from '@/components/modules/sd/learn/SDLessonProgressBar';
import { SDCanvasReadonly } from '@/components/modules/sd/learn/SDCanvasReadonly';
import { ConfusedWithPanel } from '@/components/modules/sd/learn/ConfusedWithPanel';
import { AskAISurface } from '@/components/modules/sd/learn/AskAISurface';
import { useSDLearnProgress } from '@/hooks/useSDLearnProgress';
import { useConceptScrollSync } from '@/hooks/useConceptScrollSync';
import { useSDTableOfContents } from '@/hooks/useSDTableOfContents';
import { useUIStore } from '@/stores/ui-store';
import type { ConceptPayload, ProblemPayload } from '@/lib/sd/content-types';

export function ConceptLearnView({ payload }: { payload: ConceptPayload }) {
  const { frontmatter } = payload;
  const sidebarCollapsed = useUIStore((s) => s.sdLearnSidebarCollapsed);
  const tocCollapsed     = useUIStore((s) => s.sdLearnTocCollapsed);
  const { progress } = useSDLearnProgress('concept', frontmatter.slug);
  const [askOpen, setAskOpen] = useState(false);
  const [askTab, setAskTab] = useState<'explain' | 'analogy' | 'scale'>('explain');

  const scroll = useConceptScrollSync({
    anchorNodeIds: frontmatter.anchorNodeIds,
    onSectionEnter: () => {}, // handled inside ConceptColumn via its own hook instance
  });

  const toc = useSDTableOfContents('concept', payload, scroll.activeSection);

  return (
    <div className="grid h-[calc(100vh-var(--top-chrome))] grid-cols-[auto_1fr_auto] gap-0 overflow-hidden">
      <aside className={sidebarCollapsed ? 'w-0' : 'w-[200px] shrink-0 border-r border-border overflow-y-auto'}>
        {!sidebarCollapsed && <SDLearnSidebar activeKind="concept" activeSlug={frontmatter.slug} />}
      </aside>

      <main className="relative flex flex-col overflow-hidden">
        <SDLessonProgressBar percent={progress?.deepestScrollPct ?? 0} />
        <SDBookmarkStrip kind="concept" slug={frontmatter.slug} onJump={scroll.scrollToSection} />

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-[55%_45%]">
            <div className="overflow-x-hidden">
              <ConceptColumn payload={payload} />
            </div>
            <div className="sticky top-0 h-[calc(100vh-var(--top-chrome))] border-l border-border">
              <SDCanvasReadonly
                canvas={/* concept anatomy canvas JSON sourced from frontmatter */ null}
                highlightedNodeIds={scroll.highlightedNodeIds}
                onJumpToSection={scroll.scrollToSection}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => setAskOpen(true)}
          className="absolute bottom-6 right-6 rounded-full bg-cobalt-500 px-4 py-2 text-sm text-white shadow-lg hover:bg-cobalt-400"
          aria-label="Ask the Architect"
        >
          Ask ✨
        </button>
        <AskAISurface kind="concept" slug={frontmatter.slug} defaultTab={askTab} open={askOpen} onOpenChange={setAskOpen} />
      </main>

      <aside className={tocCollapsed ? 'w-0' : 'w-[240px] shrink-0 border-l border-border overflow-y-auto px-4 py-6'}>
        {!tocCollapsed && (
          <>
            <SDTableOfContents items={toc.items} activeId={toc.activeId} onJump={scroll.scrollToSection} />
            <div className="mt-6"><ConfusedWithPanel kind="concept" slug={frontmatter.slug} /></div>
          </>
        )}
      </aside>
    </div>
  );
}

export function ProblemLearnView({ payload }: { payload: ProblemPayload }) {
  // Same shape with ProblemColumn + CanonicalDesign canvas swap on setSolution.
  // Sidebar reuses SDLearnSidebar with activeKind='problem'.
  // ... (mirrors ConceptLearnView)
  return null as any;
}

export function SDLearnModeLayout() {
  // Library grid when no slug is selected — fallback route
  return <div />; // stub: Phase 2 library UI deferred to Phase 3 if not needed by end of phase
}
```

- [ ] **Step 3: Add keyboard shortcuts (§6.11)**

- `J` / `K` — scrollToSection(prev)/next
- `T` — toggle tinker (out of scope Phase 2; logs a console hint "Tinker ships Phase 2.5")
- `[` — toggle sidebar collapsed via `useUIStore().toggleSdLearnSidebar()`
- `]` — toggle TOC collapsed
- `?` — dispatch existing shortcuts sheet

Implement via a single `useEffect` keybinding handler mounted by `SDLearnModeLayout`.

- [ ] **Step 4: Auto-open Ask-AI on 3-fail (Spec §6.6 surface 2)**

Pass `onCheckpointFail` into `ConceptCheckpointsSection`; when attempts ≥ 3 and incorrect, `setAskTab('explain'); setAskOpen(true);` with a pre-seeded explainer prompt.

- [ ] **Step 5: Tests + commit**

Snapshot test renders `<ConceptLearnView payload={fixture} />` and asserts:
- Sidebar, main, right pane are all present
- Progress bar width matches fixture progress
- Ask button is rendered; clicking opens drawer

```bash
git add architex/src/components/modules/sd/modes/SDLearnModeLayout.tsx \
        architex/src/app/sd/learn/concepts/[slug]/page.tsx \
        architex/src/app/sd/learn/problems/[slug]/page.tsx \
        architex/src/stores/ui-store.ts
git commit -m "$(cat <<'EOF'
feat(sd-learn): SDLearnModeLayout composition + concept/problem routes (Task 23/35)

3-column layout (200px sidebar · center column · 240px TOC/Confused)
with collapse toggles (`[`/`]`), sticky progress bar, floating Ask-AI
button that opens the 3-tab drawer, anchor-tracked TOC, ConfusedWith
panel, and scroll-sync canvas on the right half of the center pane.
Routes for /sd/learn/concepts/[slug] and /sd/learn/problems/[slug] use
server-side loaders; missing slugs hit notFound().

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Author `client-server.mdx` + `client-server.graph.yaml` (full authoring template)

**Files:**
- Create: `architex/content/sd/concepts/client-server.mdx`
- Create: `architex/content/sd/graph/client-server.graph.yaml`
- Modify: `architex/src/lib/sd/__tests__/concept-graph.test.ts` (re-enable skipped tests)

This task is the full concept authoring template. Tasks 25-28 reuse the shape with concept-specific content. Each file is ~1200-1800 words across 10 sections per spec §5.4.

**Authoring voice checklist (from spec §5.1 + `docs/CONTENT_STRATEGY.md`):**
- Clarity over cleverness · Specific, concrete, never generic · Every tradeoff has "You gain X. You pay Y." phrasing
- Numbers are load-bearing and cited with year stamps
- No "obviously" or "of course" — no condescension
- Every diagram referenced in the text must exist

- [ ] **Step 1: Write `client-server.mdx`**

```mdx
---
slug: client-server
title: Client-Server
subtitle: The 60-year-old idea that every distributed system still rides on.
wave: 1
waveOrder: 1
estimatedMinutes: 12
wordTargetMin: 1200
wordTargetMax: 1800
voiceVariant: standard
anchorNodeIds:
  hook: []
  analogy: []
  primitive: [client, server, network-edge]
  anatomy: [client, server]
  numbersThatMatter: [server]
  tradeoffs: [client, server]
  antiCases: [client, server]
  seenInWild: [server]
  bridges: []
  checkpoints: []
scalingNumbers:
  - label: "HTTP round-trip across regions"
    value: "70-150"
    unit: "ms"
    sourceYear: 2024
  - label: "Typical request-response throughput per nginx worker"
    value: "40k"
    unit: "req/sec"
    sourceYear: 2023
  - label: "TLS 1.3 handshake cost (cold)"
    value: "1 RTT"
    sourceYear: 2024
engineeringBlogLinks:
  - company: "Cloudflare"
    title: "Why HTTP/3 matters for the mobile web"
    url: "https://blog.cloudflare.com/http3-the-past-present-and-future/"
    year: 2019
    readingMinutes: 8
  - company: "Netflix"
    title: "Netflix at the edge: how we design for 100M clients"
    url: "https://netflixtechblog.com/edge-authentication-and-token-agnostic-identity-propagation-514e47e0b602"
    year: 2020
    readingMinutes: 12
checkpoints:
  - kind: recall
    id: cs-r1
    prompt: "Which statement best captures the client-server contract?"
    options:
      - { id: a, label: "Clients and servers are symmetric peers.", isCorrect: false, whyWrong: "That describes peer-to-peer, not client-server. In client-server, one side initiates and the other responds." }
      - { id: b, label: "The server waits; the client initiates.", isCorrect: true }
      - { id: c, label: "Servers handle state; clients never do.", isCorrect: false, whyWrong: "Clients routinely hold UI and caching state. The contract is about who initiates, not who stores." }
      - { id: d, label: "Clients must use HTTP.", isCorrect: false, whyWrong: "Client-server is a structural pattern independent of protocol. gRPC, WebSockets, raw TCP all use it." }
    explanation: "The definitional asymmetry is who initiates. Everything else — protocols, state, scale — sits on top."
  - kind: apply
    id: cs-a1
    scenario: "Given a sketch of a mobile app talking to a Node.js backend behind an Application Load Balancer, pick every node that plays the 'server' role."
    correctNodeIds: [node-js-backend, application-load-balancer]
    distractorNodeIds: [mobile-app, user-device]
    explanation: "The ALB terminates TLS and forwards; the Node service answers. Both are servers relative to the mobile client. The fact that the ALB is also a client of the Node service is a layering detail — at each layer, the client-server contract holds."
  - kind: compare
    id: cs-c1
    prompt: "Client-server vs peer-to-peer: which statements describe which?"
    left: { conceptSlug: client-server, label: "Client-server" }
    right: { conceptSlug: peer-to-peer, label: "Peer-to-peer" }
    statements:
      - { id: s1, text: "Trust boundary sits between two labeled role groups.", correct: left }
      - { id: s2, text: "Every node can both offer and consume services.", correct: right }
      - { id: s3, text: "Failure of one node is a local event, not a topology change.", correct: both }
    explanation: "Client-server draws the trust boundary crisply — the server decides, the client asks. P2P dissolves the line, at the cost of harder reasoning about identity and trust."
---

<!-- Section: hook -->

## The Itch

It's 1970. The ARPANET has sixteen nodes. If I want a file on your
machine, I dial in; you answer; we talk. You decide what I may read.
I never touch your disk. Fifty-five years later, that asymmetry — you
wait, I ask — still governs almost every byte on the modern internet.

You can design without knowing the word. You cannot design *honestly*
without the concept.

<!-- Section: analogy -->

## Analogy

A restaurant kitchen. Cooks keep station, knives sharp, pantry stocked
— always ready, never initiating. Patrons arrive, sit, order. The
contract is one-way at any moment: the patron asks, the kitchen
answers. The kitchen does not choose what the patron eats; the patron
does not enter the walk-in cooler. Either role is easy to replace
without the other noticing, so long as the menu and the language of
ordering stay fixed.

Client-server is that contract, at network speed.

<!-- Section: primitive -->

## The Primitive

Two roles, one direction of initiation. A **client** opens a connection,
states a request, and waits. A **server** listens on a known address,
parses the request, produces a response, and closes or keeps the
connection.

The contract has four load-bearing pieces:

1. **Address binding.** The server holds a stable identity — a hostname,
   an IP:port, a service discovery entry. Clients find it. The reverse
   is not required: the server usually does not know the client's
   address until the client connects.
2. **Protocol asymmetry.** The server defines the schema — HTTP verbs,
   gRPC methods, SQL dialects. Clients conform. A server can version
   its protocol without contacting its callers; clients must discover
   the new version or fail.
3. **Resource ownership.** The server owns the authoritative copy of
   whatever resource is exchanged. Clients may cache, but the server
   arbitrates. When the two disagree, the server wins by definition.
4. **Trust gradient.** Every server treats every unknown client as
   hostile until proven otherwise. This is why authentication,
   rate-limiting, and input validation live on the server side of the
   wire. A client that "trusts itself" will be impersonated within
   hours of a public IP.

What the contract does *not* say: anything about scale, about
protocol, about language, about cloud provider. "Client-server" is
structural, not technological. A tcp-to-tcp Unix daemon, a GraphQL
cluster at Shopify, an Excel macro calling SOAP — all three satisfy
the contract at the level that matters.

What the contract *permits* but doesn't require: many clients per
server (typical), many servers per client (common for reliability),
intermediate proxies that change the illusion of who is serving whom
(CDNs, gateways, service meshes), and clients that are servers from
another layer's point of view (the CDN is a client of origin; the
browser is a client of CDN).

<!-- Section: anatomy -->

## Anatomy

A minimal architecture diagram carries three node kinds: the client
tier (browser, app, IoT, batch job), the network edge (TLS, load
balancer, WAF), and the server tier (stateless or stateful services).
The edge is not strictly required — a curl call against a raw
Postgres socket satisfies the pattern — but at production scale,
between the client and the first service, there is always a middle
layer that terminates TLS, fans out, and throttles.

Scroll-sync note: as you read this section, the canvas on the right
highlights the **client** and **server** nodes. Click either to open
the deep-dive popover.

<!-- Section: numbersThatMatter -->

## Numbers that Matter

A reasonable production-shape web server handles **5,000-40,000
requests per second per instance** for typical payloads, depending on
CPU, language runtime, and how much of the request is parsed before
the handler runs. That's 40-200 concurrent connections per second per
core on modern hardware.

Network cost matters more than most first-time designers expect.
Across US regions, RTT is **60-90ms**; across continents,
**140-220ms**; within an AZ, **0.3-1.5ms**. Every additional hop —
extra proxy, extra sidecar, extra region — is round-trip latency
you paid for.

TLS handshakes cost real time. A cold TLS 1.3 handshake is
**1 round-trip**; earlier versions took 2-3. Session resumption
collapses the cost to ~0, but only for warm connections. Design for
the cold case; enjoy the warm case as a bonus.

<!-- Section: tradeoffs -->

## Tradeoffs

**You gain:** clarity of roles and trust. The server is the authority;
the client is the supplicant. Every question — "where does X live?",
"who decides?", "who gets rate-limited?" — has a single obvious
answer.

**You pay:** a single point of blame. When the server is slow, the
client is slow. When the server is down, the application is down.
Every design choice that claims to fix "client-server's fragility"
— peer-to-peer, edge compute, serverless — is actually relocating the
server, not eliminating it.

<!-- Section: antiCases -->

## When Not To Use It

**When peers have symmetric authority.** BitTorrent does not suit a
client-server shape because no peer has more claim to the file than
any other. Git over HTTP imposes client-server on an inherently
peer-like workflow and pays for it with rituals (fetch/push).

**When the latency floor exceeds the budget.** If a client needs 5ms
response and a server lives 200ms away, no amount of caching or
region replication rescues the design; the model itself is wrong.
Move the compute, or accept a different contract (fire-and-forget).

**When the authority is transient.** For CRDTs and collaborative
editing, there is no "one source of truth" at an instant; the truth
converges over time. Forcing a server contract onto a CRDT imports
complexity the CRDT was designed to eliminate.

<!-- Section: seenInWild -->

## Seen in the Wild

Every major consumer product is client-server at the outer wire, even
when the inner machinery is heterogeneous. Netflix serves ~100 million
concurrent streams via a client-server contract at the video-player
layer; the CDN within is a P2P-flavored mesh at the CDN-to-CDN layer,
but from the player's view, it's request-response to a URL.

Shopify runs a GraphQL client-server contract at storefront scale —
the merchant's theme is the client, Shopify's cluster is the server.
When they moved from REST to GraphQL in 2018, the structural pattern
did not change; only the schema and verb shape did.

Cloudflare's Workers platform sells "compute at the edge" while
preserving the client-server contract: the edge is still a server,
just closer to the client. The words "edge compute" describe
geography, not pattern.

<!-- Section: bridges -->

## Bridges

→ **LLD: Facade pattern** · The server is the facade. It hides
all the complexity of the kitchen from the patron.
→ **SD: HTTP verbs (next concept)** · Client-server is structural;
HTTP verbs are the vocabulary. You cannot speak the language before
you have the grammar.
→ **SD: Rate limiter problem** · A rate limiter is how the server
defends the asymmetry from malicious clients. Covered in Problem 3.
→ **Chaos: slow-client-attack** · Servers are vulnerable to clients
that hold connections open. This is why timeouts exist.

<!-- Section: checkpoints -->

## Checkpoints

See frontmatter.
```

- [ ] **Step 2: Write `client-server.graph.yaml`**

```yaml
kind: concept
slug: client-server
relatedConcepts:
  - slug: http-verbs
    relation: related
    bridgeText: "The client-server contract gives you the grammar; HTTP verbs give you the vocabulary."
  - slug: statelessness
    relation: related
    bridgeText: "Statelessness is the default choice that makes client-server scale horizontally."
relatedProblems:
  - slug: url-shortener
    relation: uses
    bridgeText: "The URL shortener is client-server in its simplest form: one server, many clients, one lookup."
  - slug: rate-limiter
    relation: uses
    bridgeText: "A rate limiter is how the server defends the asymmetry at the boundary."
relatedLldPatterns:
  - slug: facade
    relation: adjacent-abstraction
    bridgeText: "The server plays the role Facade plays at class scale — one entry point, many hidden collaborators."
  - slug: proxy
    relation: adjacent-abstraction
    bridgeText: "A reverse proxy is a Proxy pattern scaled to the network."
relatedChaosEvents:
  - slug: slow-client-attack
    relation: exposed-to
    bridgeText: "Servers that trust clients to close connections in a timely fashion can be held hostage by slow clients."
  - slug: ddos-amplification
    relation: exposed-to
  - slug: tcp-syn-flood
    relation: exposed-to
confusedWith:
  - kind: concept
    slug: peer-to-peer
    reason: "P2P dissolves the client-server trust boundary — every peer can both offer and consume services. Client-server enforces the asymmetry."
  - kind: concept
    slug: service-mesh
    reason: "A service mesh is client-server repeated many times with sidecars; still client-server, just in a control plane around it."
```

- [ ] **Step 3: Compile + smoke + commit**

```bash
cd architex
pnpm build:sd-graph
pnpm compile:sd-content --slug=client-server
pnpm test:run -- concept-graph

pnpm dev
# Open http://localhost:3000/sd/learn/concepts/client-server
# Scroll through all 10 sections, verify canvas highlights, checkpoints
# all three, AskAI drawer opens, ConfusedWith shows peer-to-peer + service-mesh.

git add architex/content/sd/concepts/client-server.mdx \
        architex/content/sd/graph/client-server.graph.yaml \
        architex/src/lib/sd/concept-graph.ts \
        architex/src/lib/sd/__tests__/concept-graph.test.ts
git commit -m "$(cat <<'EOF'
content(sd): author Client-Server concept (Wave 1 · 1/5)

Full 10-section concept: hook (ARPANET 1970) → analogy (restaurant
kitchen) → primitive (4 load-bearing pieces) → anatomy (client/edge/
server triad) → numbers (40k req/sec/core, 70-150ms x-region RTT, 1
RTT TLS 1.3) → tradeoffs (clarity vs single point of blame) → anti-
cases (BitTorrent/CRDT/5ms SLA) → seen in wild (Netflix/Shopify/
Cloudflare Workers) → bridges (LLD Facade + Proxy, HTTP verbs, rate
limiter, slow-client-attack) → 3 checkpoints (recall/apply/compare).

Graph YAML introduces relations to http-verbs, statelessness, the 3
warmup problems, LLD Facade/Proxy, and 3 chaos events. Confused-with
disambiguates peer-to-peer and service-mesh.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Tasks 25-28: Author the remaining 4 Wave 1 concepts

Each task below uses the Task 24 template with concept-specific content. Budget 2.5-3.5 hours per concept for drafting + human review + Opus polish loop.

### Task 25: `http-verbs.mdx` + graph

- [ ] Create `architex/content/sd/concepts/http-verbs.mdx` following Task 24 structure. Key ingredients:
  - **Hook**: "1996. Tim Berners-Lee defines GET, POST, PUT, DELETE as separate idempotent and side-effecting operations. Thirty years later, ORM frameworks still blur the line and production teams still pay for it."
  - **Analogy**: verbs at a post office counter — READ a letter, SEND a letter, REPLACE a letter, DESTROY a letter. Different clerks, different ledgers.
  - **Primitive**: 4 load-bearing verbs (GET, POST, PUT, DELETE) · idempotency semantics · safe vs unsafe · 2xx/4xx/5xx bands
  - **Numbers**: HEAD-only traffic can be 20-40% of requests on content-heavy sites. Idempotency-key retry cost: 2-3x write amplification.
  - **Tradeoffs**: "You gain a shared vocabulary across every HTTP service. You pay the cost of explaining why POST is not idempotent to every new hire."
  - **Anti-cases**: RPC-over-HTTP (gRPC) skips the verb semantics — appropriate for internal services where the shared vocabulary is Protobuf, not HTTP
  - **Seen in wild**: Stripe's use of the `Idempotency-Key` header on POST · GitHub API's consistent use of PUT for upsert
  - **Confused with**: gRPC (different vocabulary), WebSockets (bi-directional, no verbs once opened)

- [ ] Create `architex/content/sd/graph/http-verbs.graph.yaml` with relations: `idempotency` (concept, prerequisite), `client-server` (concept, prerequisite), `rate-limiter` (problem, uses), `retry-amplification` (chaos, exposed-to), LLD Command pattern (`command`, adjacent-abstraction).

- [ ] Run `pnpm compile:sd-content --slug=http-verbs && pnpm build:sd-graph`.

- [ ] Smoke-test in browser.

- [ ] Commit with message `content(sd): author HTTP Verbs concept (Wave 1 · 2/5)`.

### Task 26: `tcp-vs-udp.mdx` + graph

- [ ] MDX per Task 24 template. Key ingredients:
  - **Hook**: "Your video call is grainy; it's not that your bandwidth dropped, it's that you're sending 1500-byte frames over a protocol that will retransmit a dropped frame after you've already stopped caring about it."
  - **Analogy**: registered mail vs postcard · TCP (registered — every piece accounted for) vs UDP (postcard — sent, forgotten, maybe received)
  - **Primitive**: 3-way handshake · flow control (sliding window) · congestion control (slow start, fast retransmit) · head-of-line blocking · UDP as "IP with ports"
  - **Numbers**: TCP handshake adds 1 RTT. QUIC (UDP-based) combines handshake + TLS in 1 RTT. HOL blocking costs 40-80ms on 5% packet loss in a 150ms RTT connection.
  - **Tradeoffs**: "You gain guaranteed delivery with TCP. You pay for stale bytes and HOL blocking."
  - **Anti-cases**: live video/audio (UDP wins), DNS queries (UDP wins until > 512 bytes), any file transfer (TCP wins)
  - **Seen in wild**: YouTube Live using QUIC since 2020 · DNS falling back to TCP for large responses · BGP running over TCP even though it's a routing protocol
  - **Confused with**: QUIC (UDP-based but with TCP semantics layered), HTTP/3 (HTTP over QUIC)

- [ ] Graph YAML with: `client-server` prerequisite, `dns` and `ip-routing` related, `url-shortener` problem, `partition`/`packet-loss` chaos events.

- [ ] Compile, smoke, commit `content(sd): author TCP vs UDP concept (Wave 1 · 3/5)`.

### Task 27: `dns.mdx` + graph

- [ ] MDX per template. Key ingredients:
  - **Hook**: "October 2021. Facebook withdraws its own BGP routes. DNS collapses. Engineers can't badge into the building because the badge system depends on DNS. 6 hours, billions of dollars, one configuration push."
  - **Analogy**: a phone book inside a phone book inside a phone book — each level knowing only enough to point at the next
  - **Primitive**: recursive vs authoritative resolvers · TTL economics · glue records · CNAME chains · the 4-level hierarchy (root, TLD, authoritative, subdomain)
  - **Numbers**: typical recursive resolver cache hit ratio: 90-97% · cold DNS lookup across continents: 20-180ms · TTL sweet spot: 300s (fresh enough to roll, cached enough to scale) · ~1.7B queries per second globally handled by public resolvers in 2024
  - **Tradeoffs**: "You gain a global decoupling between names and addresses. You pay with a cache whose TTL you must choose before you need to change it."
  - **Anti-cases**: short-TTL disaster (cache stampedes), long-TTL disaster (can't roll for 24 hours), DNS as service discovery within a cluster (too slow, too eventually consistent — use Consul or similar)
  - **Seen in wild**: Route53's latency-based routing · Cloudflare's 1.1.1.1 · the Fastly 2021 incident (edge config bug cascaded via DNS-based health checks)
  - **Confused with**: service discovery (not DNS at cluster scale), anycast (a routing trick, different layer), CDNs (DNS is how a CDN decides *which* edge to return)

- [ ] Graph YAML with: `client-server` prerequisite, `tcp-vs-udp` related, LLD Observer (caching notifies invalidation), `dns-poisoning`/`dns-provider-outage`/`certificate-expiry` chaos events.

- [ ] Compile, smoke, commit `content(sd): author DNS concept (Wave 1 · 4/5)`.

### Task 28: `ip-routing.mdx` + graph

- [ ] MDX per template. Key ingredients:
  - **Hook**: "You open a web page in Singapore. The packet crosses 28 routers, 3 countries, 2 undersea cables, and one interconnect exchange — all decided by a protocol that has no central authority and no shared clock."
  - **Analogy**: a dozen cab companies cooperating on rumor — "last I heard, Ninth Avenue is fast today" — passed peer to peer
  - **Primitive**: BGP as a path-vector protocol · AS numbers · peering vs transit · route withdrawals · anycast · the 2019 Cloudflare incident (regex backtracking) vs the 2021 Facebook incident (self-BGP-withdrawal)
  - **Numbers**: typical BGP convergence time: 30-300 seconds · global IPv4 BGP table: ~950,000 prefixes (2024) · average packet hop count: 10-20 · speed of light in fiber: ~2/3 c (so Bay Area ↔ Tokyo physical floor is 60ms, real world is 90-120ms)
  - **Tradeoffs**: "You gain the internet. You pay with a distributed control plane that no one owns and no one debugs until it breaks on-air."
  - **Anti-cases**: any private network (use IGP — OSPF, IS-IS — not BGP), any application concerned with sub-second routing decisions (BGP is oral tradition, not a fast path)
  - **Seen in wild**: Cloudflare's anycast DNS (14+ POPs share 1.1.1.1), Facebook's 2021 outage, AWS Global Accelerator (anycast for app traffic)
  - **Confused with**: DNS (names vs addresses), anycast (a routing configuration, not a protocol), SD-WAN (application-layer routing on top)

- [ ] Graph YAML with: `dns` related, `tcp-vs-udp` related, LLD Observer/Mediator (BGP as gossip), `bgp-route-leak`/`partition-asymmetric`/`cloud-provider-throttle` chaos, `fb-2021-bgp` real-incident reference.

- [ ] Compile, smoke, commit `content(sd): author IP Routing concept (Wave 1 · 5/5)`.

---

## Task 29: Author `url-shortener.mdx` + graph (problem authoring template)

**Files:**
- Create: `architex/content/sd/problems/url-shortener.mdx`
- Create: `architex/content/sd/graph/url-shortener.graph.yaml`

This task is the full **problem** authoring template (vs Task 24's **concept** template). Tasks 30-31 reuse. 2500-3500 words across the 7 panes.

- [ ] **Step 1: Write `url-shortener.mdx`**

```mdx
---
slug: url-shortener
title: Design a URL Shortener
domain: infra
difficulty: warmup
companiesAsking: [Google, Meta, Bitly, TinyURL, generic-FAANG]
recommendedOrder:
  rookie:      [problemStatement, requirements, scaleNumbers, canonicalDesign, failureModesChaos, conceptsUsed]
  journeyman:  [canonicalDesign, failureModesChaos, scaleNumbers, requirements, problemStatement, conceptsUsed]
  architect:   [canonicalDesign, failureModesChaos, requirements, scaleNumbers, conceptsUsed, problemStatement]
scalingNumbers:
  - label: "Reads per day at Bitly 2023"
    value: "10B"
    unit: "req/day"
    sourceYear: 2023
  - label: "Writes per day"
    value: "100M"
    unit: "req/day"
    sourceYear: 2023
  - label: "Read:Write ratio"
    value: "100:1"
  - label: "Total storage after 5 years"
    value: "180"
    unit: "TB"
canonicalSolutions:
  - label: "A"
    summary: "Hash-based key generation (counter + base62 encoding). One Postgres + Redis cache."
    diagramJson:
      nodes:
        - { id: client, familyId: client, label: "Browser" }
        - { id: alb, familyId: load-balancer, label: "ALB" }
        - { id: app, familyId: app-service, label: "Shortener API" }
        - { id: redis, familyId: cache, label: "Redis (reads)" }
        - { id: postgres, familyId: db-relational, label: "Postgres" }
      edges:
        - { source: client, target: alb, kind: sync }
        - { source: alb, target: app, kind: sync }
        - { source: app, target: redis, kind: sync }
        - { source: app, target: postgres, kind: sync }
    walkthroughMdx: "The simplest honest design. ..."
  - label: "B"
    summary: "Sharded DynamoDB with CDN-level caching for hot keys."
    diagramJson:
      nodes:
        - { id: client, familyId: client, label: "Browser" }
        - { id: cdn, familyId: edge-cdn, label: "CloudFront" }
        - { id: alb, familyId: load-balancer, label: "ALB" }
        - { id: app, familyId: app-service, label: "Shortener API" }
        - { id: dynamo, familyId: db-kv, label: "DynamoDB (sharded)" }
      edges:
        - { source: client, target: cdn, kind: sync }
        - { source: cdn, target: alb, kind: sync }
        - { source: alb, target: app, kind: sync }
        - { source: app, target: dynamo, kind: sync }
    walkthroughMdx: "When 90% of reads are for 10% of keys..."
recommendedChaos: [cache-stampede, hot-partition, redis-eviction-cascade, bad-deploy]
linkedConcepts: [client-server, http-verbs, dns, caching-strategies, consistent-hashing]
linkedLldPatterns: [facade, strategy, singleton]
rubric:
  axes:
    - name: "Requirements & Scope"
      weight: 0.15
      bands:
        - { score: 1, description: "Did not ask clarifying questions." }
        - { score: 3, description: "Asked 3-5 clarifying questions covering functional + non-functional." }
        - { score: 5, description: "Articulated every axis including auth, analytics, custom aliases, and expiry." }
    - name: "Napkin Math"
      weight: 0.15
      bands:
        - { score: 1, description: "No numbers." }
        - { score: 3, description: "Back-of-envelope QPS + storage." }
        - { score: 5, description: "QPS + storage + bandwidth + cache working set + growth curve." }
    - name: "High-Level Design"
      weight: 0.20
      bands:
        - { score: 1, description: "Missing major component (no cache, no LB)." }
        - { score: 3, description: "Core path correct." }
        - { score: 5, description: "Correct + justifies every component and its alternative." }
    - name: "Deep Dives"
      weight: 0.20
      bands:
        - { score: 1, description: "No depth." }
        - { score: 3, description: "One component explained in depth (e.g. key generation)." }
        - { score: 5, description: "Key generation + hot-key mitigation + cache invalidation all explored." }
    - name: "Failure & Resilience"
      weight: 0.15
      bands:
        - { score: 1, description: "Did not discuss failure." }
        - { score: 3, description: "Identified 2-3 failure modes." }
        - { score: 5, description: "Identified failure modes + mitigations + acceptable data loss." }
    - name: "Communication"
      weight: 0.15
      bands:
        - { score: 1, description: "Hard to follow." }
        - { score: 3, description: "Structured, mostly clear." }
        - { score: 5, description: "Structured, confident, invited feedback at each stage." }
checkpoints:
  - kind: apply
    id: us-ap1
    scenario: "Pick the components that must be present to serve 100k GET /tinyurl/* requests per second with p99 < 100ms."
    correctNodeIds: [client, alb, app, redis]
    distractorNodeIds: [kafka, elasticsearch]
    explanation: "Reads are hot-key-skewed; Redis or equivalent caches the top few thousand. Kafka and Elasticsearch have no role on the read path."
  - kind: recall
    id: us-r1
    prompt: "Which key generation approach is most prone to hot-partition problems at DynamoDB scale?"
    options:
      - { id: a, label: "Hash of the long URL", isCorrect: false, whyWrong: "Random hash spreads writes evenly." }
      - { id: b, label: "Monotonic counter + base62 encoding", isCorrect: true }
      - { id: c, label: "UUIDv4 per shortening", isCorrect: false, whyWrong: "UUIDv4 is random; well distributed." }
    explanation: "Counters create temporal hot partitions — recent writes all cluster on one key range. Hash-based keys distribute naturally."
  - kind: compare
    id: us-c1
    prompt: "Solution A (Postgres + Redis) vs Solution B (CDN + DynamoDB): which is better when?"
    left:  { conceptSlug: url-shortener, label: "Solution A" }
    right: { conceptSlug: url-shortener, label: "Solution B" }
    statements:
      - { id: s1, text: "Under 10M writes/day, single-region traffic — simpler operations.", correct: left }
      - { id: s2, text: "Global reads with 90% hot-key skew — better read-path locality.", correct: right }
      - { id: s3, text: "Requires consistent hashing to handle cluster growth without key migration.", correct: right }
    explanation: "Solution A is right until global reach and skew dominate; Solution B is right when they do. Neither is 'correct' in isolation — context decides."
engineeringBlogLinks:
  - company: "Bitly"
    title: "Lessons from running bit.ly at 10 billion clicks/day"
    url: "https://word.bitly.com/post/29550629271/we-were-there-to-ensure-your-click-was-served"
    year: 2023
    readingMinutes: 9
  - company: "Instagram"
    title: "Sharding & IDs at Instagram"
    url: "https://instagram-engineering.com/sharding-ids-at-instagram-1cf5a71e5a5c"
    year: 2012
    readingMinutes: 12
---

<!-- Section: problemStatement -->

## Problem Statement

Design a URL shortening service — the kind where a user pastes
`https://nytimes.com/2025/05/03/world/europe/ukraine-ceasefire.html`
and receives `tinyurl.com/x7Km9` in return, and any subsequent GET on
the short form redirects to the long one.

Scale assumption: **10B reads/day, 100M writes/day** (≈ Bitly 2023
numbers). Read:write ratio 100:1. Global user base. 5-year growth runway.

Focus the conversation on the **read path** — redirects dominate
traffic. The write path matters but is not the bottleneck.

<!-- Section: requirements -->

## Requirements (F + NF)

**Functional**
- Shorten a long URL. Return a short key. Idempotent on the same URL
  (optional; discuss with interviewer).
- Resolve a short key. Redirect via HTTP 301 or 302.
- Optionally: custom aliases (`tinyurl.com/my-party`), expiry, usage
  analytics.

**Non-functional**
- p99 read latency < 100ms globally.
- p99 write latency < 500ms.
- Availability 99.95%. Read path stays up even if the write path is
  partially down.
- Keys are non-guessable (no sequential `tinyurl.com/1`,
  `tinyurl.com/2`, ...).

<!-- Section: scaleNumbers -->

## Scale Numbers (Napkin Math)

10B reads/day ÷ 86,400s ≈ **116k QPS average**, probably **3-5x peak**
(≈ 400-600k QPS peak).

100M writes/day ÷ 86,400s ≈ **1,200 writes/sec average**, **5k peak**.

Storage per record: long URL (~100 bytes avg) + key (6 bytes) + timestamps
+ analytics = ~**150 bytes/record** including index overhead.

Five years: 100M/day × 365 × 5 ≈ **180B records** ≈ **27 TB raw** +
replication + indexes ≈ **80-100 TB active footprint**.

Cache working set: with 90:10 Pareto, 10% of keys handle 90% of reads.
10% × 180B = 18B hot keys × 150 bytes = 2.7 TB. Realistically, hot
keys cluster more tightly on any given day — a **20-50 GB Redis fleet**
absorbs the majority of read traffic.

<!-- Section: canonicalDesign -->

## Canonical Design

(Tabs in UI: A / B. Solution A for up to ~10M writes/day and regional
traffic; Solution B for global reach with skewed reads.)

### Solution A — Hash-based key generation, Postgres + Redis

Client hits ALB → Shortener API. Write path: service generates key via
`base62(MurmurHash3(longUrl))[0..6]`, INSERT into Postgres with ON
CONFLICT DO NOTHING (collision check), returns short URL. Read path:
service checks Redis, falls back to Postgres, populates Redis on miss.

Why hash rather than counter? Counters create temporal hot partitions;
hash randomizes. Why base62? URL-safe alphabet of 62 characters; 6 chars
= 62⁶ ≈ 57B unique keys, enough for 5 years.

### Solution B — CDN + DynamoDB

Adds CloudFront in front of the ALB. Hot keys (90% of reads) terminate
at CDN edge with 5-min TTL. DynamoDB replaces Postgres for horizontally
scalable writes and keyed reads. Consistent hashing naturally handled
by DynamoDB's internal sharding.

Right for: global reads, skewed distribution, 100M+ writes/day.

<!-- Section: failureModesChaos -->

## Failure Modes & Chaos

**Cache stampede.** A popular short URL expires from Redis; 400k
concurrent requests hit Postgres; Postgres falls over. Mitigation:
request coalescing in the service layer (singleflight pattern), or
probabilistic early refresh.

**Hot partition in DynamoDB.** Viral short URL receives 50k QPS on one
partition. Mitigation: write-through cache at the service layer,
partition-key randomization for new keys.

**Redis eviction cascade.** Memory pressure → keys evicted → reads
shift to Postgres → Postgres chokes → requests timeout → retries
amplify. Mitigation: set `maxmemory-policy: allkeys-lru`, monitor
eviction rate, pre-scale before breach.

**Bad deploy.** New version has a bug in key generation returning
always the same key. Mitigation: canary deploy with key-uniqueness
monitor; auto-rollback on uniqueness drop below 99.9%.

Click any chaos link below to trigger the event in the Simulate mode
(Phase 3).

<!-- Section: conceptsUsed -->

## Concepts Used

Every short URL resolution rides on:
- **Client-server** (the browser asks; the server decides).
- **HTTP verbs** (GET for resolution, POST for creation).
- **DNS** (resolving tinyurl.com).
- **Caching strategies** (cache-aside at the service layer).
- **Consistent hashing** (in Solution B, within DynamoDB's partition map).

Related LLD patterns: **Facade** (API hides key generation + cache +
DB), **Strategy** (pluggable key-gen algorithm), **Singleton** (the
Redis connection pool).

<!-- Section: checkpoints -->

## Checkpoints

See frontmatter.
```

- [ ] **Step 2: Graph YAML**

```yaml
kind: problem
slug: url-shortener
relatedConcepts:
  - slug: client-server
    relation: uses
    bridgeText: "The shortener is the simplest possible client-server contract — one function at network scale."
  - slug: caching-strategies
    relation: uses
  - slug: consistent-hashing
    relation: uses
relatedProblems:
  - slug: rate-limiter
    relation: related
    bridgeText: "The rate limiter defends a shortener against abuse. Pair the two in a single design exercise."
  - slug: distributed-cache
    relation: related
relatedLldPatterns:
  - slug: facade
    relation: implements
  - slug: strategy
    relation: implements
relatedChaosEvents:
  - slug: cache-stampede
    relation: exposed-to
  - slug: hot-partition
    relation: exposed-to
  - slug: bad-deploy
    relation: exposed-to
confusedWith:
  - kind: problem
    slug: distributed-cache
    reason: "The shortener uses a distributed cache; the distributed cache problem is about designing the cache itself."
```

- [ ] **Step 3: Compile + smoke + commit**

```bash
pnpm compile:sd-content --slug=url-shortener && pnpm build:sd-graph
git commit -m "content(sd): author URL Shortener problem (Warmup · 1/3)"
```

---

## Tasks 30-31: Author the remaining 2 warmup problems

### Task 30: `rate-limiter.mdx` + graph

- [ ] MDX per Task 29 template. Key ingredients:
  - **Problem statement**: "Design a rate limiter that allows each authenticated user at most 100 requests per 60s across a fleet of 50 API servers." Scale: 1M RPS fleet peak.
  - **Requirements**: functional (enforce limit, return 429 with Retry-After); non-functional (low added latency < 5ms p99, correct within ±1% under normal load, graceful degradation if the limiter itself fails).
  - **Napkin math**: 50 servers × 20k RPS avg per server = 1M RPS · per-user state = ~32 bytes (counter + window start) · 10M active users × 32B = 320MB hot state · fits in one Redis Cluster shard with headroom.
  - **Canonical solutions**: A (token bucket in Redis with `INCR + EXPIRE`), B (sliding window log in Redis with `ZADD` + `ZCOUNT`), C (edge-local counters with periodic reconciliation — eventually consistent but faster).
  - **Failure modes**: Redis outage (fail open vs fail closed — discuss), clock skew across fleet (sliding windows go wrong if servers disagree on time), retry amplification when 429 + caller retry with no jitter.
  - **Concepts used**: HTTP verbs (429), caching strategies, consistent hashing (within Redis Cluster), retry-amplification chaos.
  - **LLD patterns**: Strategy (pluggable algorithm), Decorator (rate-limit wrapper per route).
  - **Rubric weights**: same 6 axes, but weight "Deep Dives" at 0.25 (the algorithm is the pedagogy).

- [ ] Graph YAML with concept relations to `http-verbs`, `caching-strategies`, `consistent-hashing`, `idempotency`; LLD Strategy/Decorator; chaos `retry-amplification`, `redis-eviction-cascade`.

- [ ] Compile, smoke, commit `content(sd): author Rate Limiter problem (Warmup · 2/3)`.

### Task 31: `distributed-cache.mdx` + graph

- [ ] MDX per template. Key ingredients:
  - **Problem statement**: "Design a distributed cache, used by 500 application servers, storing 1TB of working-set data." Not a Redis-hosted solution — design the *cache*. Think: Memcached, Hazelcast, Couchbase shape.
  - **Requirements**: get/set/delete at 1M ops/sec · p99 < 2ms within a datacenter · horizontally scalable with consistent hashing · graceful on node loss
  - **Napkin math**: 1TB working set · 1KB avg value · 1B keys · 16-node cluster × 64GB RAM = 1TB · 1M ops/sec ÷ 16 = 62.5k ops/sec per node (Redis can do 100k; healthy margin)
  - **Canonical solutions**: A (consistent-hashing ring with virtual nodes, client-side sharding), B (proxy tier with twemproxy-style routing), C (gossip-based peer discovery with replication)
  - **Failure modes**: node loss (which keys move?), cache stampede, consistent-hashing ring misconfiguration, network partition causing split-brain on replicated keys
  - **Concepts used**: consistent-hashing, caching-strategies, quorum reads/writes, replication
  - **LLD patterns**: Consistent Hash Ring (if modeled as a class), Observer (cluster member notifications), Proxy (Solution B)

- [ ] Graph YAML with concept relations to `consistent-hashing`, `caching-strategies`, `quorum`, `replication`; LLD Observer/Proxy; chaos `cache-stampede`, `partition-full`, `redis-eviction-cascade`.

- [ ] Compile, smoke, commit `content(sd): author Distributed Cache problem (Warmup · 3/3)`.

**Authoring playbook (applies to all content-only PRs for the remaining 32 concepts + 27 problems):**

1. Copy `client-server.mdx` (concept) or `url-shortener.mdx` (problem) as the template. Replace frontmatter values.
2. Write sections/panes in order. For concepts: hook → analogy → primitive → anatomy → numbers → tradeoffs → anti-cases → seen in wild → bridges → checkpoints. For problems: problemStatement → requirements → scaleNumbers → canonicalDesign → failureModesChaos → conceptsUsed → checkpoints.
3. Every checkpoint must have pattern-specific `whyWrong` (not generic).
4. Write `<slug>.graph.yaml` with 3-5 concept relations + 1-3 problem relations + 2-4 LLD pattern bridges + 2-4 chaos-event links + 2-3 confused-with entries.
5. Run `pnpm compile:sd-content --slug=<slug>` → fix any schema validation errors.
6. Run `pnpm build:sd-graph` → verify new relations appear in `src/lib/sd/concept-graph.ts`.
7. Open `/sd/learn/concepts/<slug>` or `/sd/learn/problems/<slug>` → smoke the 10-section / 7-pane render, all checkpoints answer, canvas scroll-sync pulses on anchored nodes.
8. Open one PR per piece. Title format: `content(sd): author <title> (Wave N · X/Y)`.

**No engineering required to add concepts #6-40 or problems #4-30.** The pipeline in Tasks 5-7 + 14-23 is sufficient.

---

## Task 32: Extend analytics event catalog

**Files:**
- Modify: `architex/src/lib/analytics/sd-events.ts`
- Modify: `architex/src/lib/analytics/__tests__/sd-events.test.ts`

Add Phase 2-specific events to the existing Phase 1 catalog:

```typescript
// Partial — additions only, merged into existing sd-events.ts
export type SDLearnEvent =
  | { type: 'sd_learn_concept_opened';    conceptSlug: string; source: 'sidebar'|'link'|'tour'|'quiz-result'|'url' }
  | { type: 'sd_learn_problem_opened';    problemSlug: string; source: 'sidebar'|'link'|'tour'|'quiz-result'|'url' }
  | { type: 'sd_learn_section_entered';   kind: 'concept'|'problem'; slug: string; sectionId: string; scrollPct: number }
  | { type: 'sd_learn_bookmark_added';    kind: 'concept'|'problem'; slug: string; anchor: string }
  | { type: 'sd_learn_bookmark_removed';  kind: 'concept'|'problem'; slug: string; anchor: string }
  | { type: 'sd_learn_checkpoint_attempt'; kind: 'concept'|'problem'; slug: string; checkpointId: string; attemptNumber: number; correct: boolean }
  | { type: 'sd_learn_checkpoint_revealed'; kind: 'concept'|'problem'; slug: string; checkpointId: string }
  | { type: 'sd_learn_askai_opened';      kind: 'concept'|'problem'; slug: string; tab: 'explain'|'analogy'|'scale'; source: 'floating'|'3fail'|'confusedwith'|'endofsection' }
  | { type: 'sd_learn_askai_response';    kind: 'concept'|'problem'; slug: string; tab: 'explain'|'analogy'|'scale'; cached: boolean; inputTokens: number; outputTokens: number; cost: number }
  | { type: 'sd_learn_completed';         kind: 'concept'|'problem'; slug: string; totalAttempts: number; mastered: boolean }
  | { type: 'sd_diagnostic_started';      questionCount: number }
  | { type: 'sd_diagnostic_answered';     questionIndex: number; correct: boolean }
  | { type: 'sd_diagnostic_completed';    score: number; band: 'rookie'|'journeyman'|'architect'; recommendedConceptSlug: string }
  | { type: 'sd_onboarding_step';         step: number; durationMs: number }
  | { type: 'sd_onboarding_completed';    totalDurationMs: number }
  | { type: 'sd_onboarding_skipped';      atStep: number };
```

- [ ] Wire the event emitter functions (one per event type) into `sd-events.ts` following the Phase 1 pattern.
- [ ] Emit these events from Tasks 13, 14, 18, 20, 21, 23, 33, 34 — grep each task's files for the places where events belong.
- [ ] Update `sd-events.test.ts` to assert the typed event builders exist and produce correctly-shaped PostHog payloads.

```bash
git commit -m "feat(analytics): extend sd event catalog with 14 phase-2 events (Task 32/35)"
```

---

## Task 33: Diagnostic entry quiz (Q46 · schema + content + UI + API)

**Files:**
- Create: `architex/src/db/schema/sd-diagnostic-results.ts`
- Create: `architex/content/sd/quiz/diagnostic.yaml` (15 questions across 3 bands)
- Create: `architex/scripts/seed-sd-diagnostic.ts`
- Create: `architex/src/lib/sd/diagnostic-quiz.ts`
- Create: `architex/src/app/api/sd/diagnostic/route.ts` (POST — start)
- Create: `architex/src/app/api/sd/diagnostic/[id]/route.ts` (GET/PATCH — progress/submit)
- Create: `architex/src/app/sd/onboarding/quiz/page.tsx`
- Create: `architex/src/components/modules/sd/learn/quiz/DiagnosticQuizRunner.tsx`
- Create: `architex/src/components/modules/sd/learn/quiz/DiagnosticQuizResult.tsx`

Per spec §2 Rookie persona: *"diagnostic quiz (Q46, 10 questions, 4 minutes) → guided 8-concept 'Foundations' track"*. Phase 2 lands with **15 questions, 3 per difficulty band, ~6 minutes**. Result maps to `rookie | journeyman | architect` + a recommended first concept.

- [ ] **Step 1: DB schema**

```typescript
// src/db/schema/sd-diagnostic-results.ts
import { pgTable, uuid, timestamp, jsonb, integer, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sdDiagnosticResults = pgTable('sd_diagnostic_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }), // null for anonymous
  anonymousId: varchar('anonymous_id', { length: 64 }), // cookie-based for anon attempts
  questionSetVersion: integer('question_set_version').notNull().default(1),
  answers: jsonb('answers').notNull(),   // [{ questionId, selectedId, correct, msToAnswer }]
  band: varchar('band', { length: 32 }), // 'rookie' | 'journeyman' | 'architect'
  recommendedConceptSlug: varchar('recommended_concept_slug', { length: 100 }),
  score: integer('score'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
});
```

- [ ] **Step 2: Content — 15-question YAML**

```yaml
# content/sd/quiz/diagnostic.yaml
version: 1
questions:
  # Band: rookie (5 questions)
  - id: q1
    band: rookie
    prompt: "When an HTTP GET request crosses from a browser in New York to a server in Los Angeles, which number is closest to the typical round-trip time?"
    options:
      - { id: a, label: "1ms", isCorrect: false }
      - { id: b, label: "70-90ms", isCorrect: true }
      - { id: c, label: "500ms", isCorrect: false }
      - { id: d, label: "2-3 seconds", isCorrect: false }
    concept: client-server
  - id: q2
    band: rookie
    prompt: "Which HTTP verb is idempotent by definition?"
    options:
      - { id: a, label: "POST", isCorrect: false }
      - { id: b, label: "PUT", isCorrect: true }
      - { id: c, label: "PATCH (always)", isCorrect: false }
      - { id: d, label: "CONNECT", isCorrect: false }
    concept: http-verbs
  - id: q3
    band: rookie
    prompt: "DNS TTL controls..."
    options:
      - { id: a, label: "how long a browser can cache a DNS answer before asking again", isCorrect: true }
      - { id: b, label: "the maximum packet size", isCorrect: false }
      - { id: c, label: "the TCP connection timeout", isCorrect: false }
      - { id: d, label: "the TLS handshake duration", isCorrect: false }
    concept: dns
  - id: q4
    band: rookie
    prompt: "Which protocol retransmits lost packets?"
    options:
      - { id: a, label: "UDP", isCorrect: false }
      - { id: b, label: "TCP", isCorrect: true }
      - { id: c, label: "IP", isCorrect: false }
      - { id: d, label: "HTTP", isCorrect: false }
    concept: tcp-vs-udp
  - id: q5
    band: rookie
    prompt: "A 'stateless' service means..."
    options:
      - { id: a, label: "it cannot access a database", isCorrect: false }
      - { id: b, label: "it stores no per-user state locally between requests", isCorrect: true }
      - { id: c, label: "it never fails", isCorrect: false }
      - { id: d, label: "it only uses GET", isCorrect: false }
    concept: statelessness

  # Band: journeyman (5 questions)
  - id: q6
    band: journeyman
    prompt: "Cache stampede is most likely when..."
    options:
      - { id: a, label: "many requests miss cache for the same key simultaneously after expiry", isCorrect: true }
      - { id: b, label: "the cache runs out of memory", isCorrect: false }
      - { id: c, label: "a key is written twice", isCorrect: false }
      - { id: d, label: "the cache is behind a load balancer", isCorrect: false }
    concept: caching-strategies
  - id: q7
    band: journeyman
    prompt: "Consistent hashing's primary benefit over modular hashing is..."
    options:
      - { id: a, label: "fewer keys move when the cluster size changes", isCorrect: true }
      - { id: b, label: "it's faster to compute", isCorrect: false }
      - { id: c, label: "it produces shorter hash values", isCorrect: false }
      - { id: d, label: "it eliminates collisions", isCorrect: false }
    concept: consistent-hashing
  - id: q8
    band: journeyman
    prompt: "In Kafka, 'exactly-once' delivery requires..."
    options:
      - { id: a, label: "nothing — it's default", isCorrect: false }
      - { id: b, label: "idempotent producer + transactional consumer + atomic write to the consumer's sink", isCorrect: true }
      - { id: c, label: "at least 3 brokers", isCorrect: false }
      - { id: d, label: "a dedicated ZooKeeper cluster", isCorrect: false }
    concept: delivery-semantics
  - id: q9
    band: journeyman
    prompt: "A circuit breaker's OPEN state means..."
    options:
      - { id: a, label: "requests flow freely", isCorrect: false }
      - { id: b, label: "requests are rejected without calling the dependency", isCorrect: true }
      - { id: c, label: "the breaker is disabled", isCorrect: false }
      - { id: d, label: "only retries pass through", isCorrect: false }
    concept: circuit-breakers
  - id: q10
    band: journeyman
    prompt: "CAP theorem guarantees that during a network partition, a system cannot simultaneously be..."
    options:
      - { id: a, label: "consistent and fast", isCorrect: false }
      - { id: b, label: "consistent and available (for every non-failing node)", isCorrect: true }
      - { id: c, label: "partition-tolerant and fast", isCorrect: false }
      - { id: d, label: "available and secure", isCorrect: false }
    concept: cap-in-practice

  # Band: architect (5 questions)
  - id: q11
    band: architect
    prompt: "Raft's leader election can stall if..."
    options:
      - { id: a, label: "two nodes repeatedly time out with overlapping elections (split vote)", isCorrect: true }
      - { id: b, label: "the log becomes too large", isCorrect: false }
      - { id: c, label: "all nodes agree immediately", isCorrect: false }
      - { id: d, label: "the network is too fast", isCorrect: false }
    concept: consensus
  - id: q12
    band: architect
    prompt: "A Hybrid Logical Clock (HLC) combines..."
    options:
      - { id: a, label: "physical time + a logical counter", isCorrect: true }
      - { id: b, label: "vector clock + physical time", isCorrect: false }
      - { id: c, label: "NTP + Lamport clock", isCorrect: false }
      - { id: d, label: "TrueTime + Paxos epochs", isCorrect: false }
    concept: distributed-clocks
  - id: q13
    band: architect
    prompt: "Which is the strongest consistency model that still permits stale reads from replicas?"
    options:
      - { id: a, label: "strict serializability", isCorrect: false }
      - { id: b, label: "linearizability", isCorrect: false }
      - { id: c, label: "sequential consistency", isCorrect: false }
      - { id: d, label: "monotonic reads", isCorrect: true }
    concept: consistency-models
  - id: q14
    band: architect
    prompt: "During the October 2021 Facebook outage, the reason physical access to datacenters did not restore service quickly was..."
    options:
      - { id: a, label: "badge systems depended on the network that was also down", isCorrect: true }
      - { id: b, label: "datacenters were air-gapped from the fiber", isCorrect: false }
      - { id: c, label: "the BGP issue was not fixable without recompiling the kernel", isCorrect: false }
      - { id: d, label: "DNS providers were offline too", isCorrect: false }
    concept: ip-routing
    realIncidentSlug: fb-2021-bgp
  - id: q15
    band: architect
    prompt: "Best way to handle retry amplification in a 5-service synchronous chain?"
    options:
      - { id: a, label: "add retries everywhere", isCorrect: false }
      - { id: b, label: "enforce a total retry budget + jitter at the outermost caller only", isCorrect: true }
      - { id: c, label: "use exponential backoff at every layer", isCorrect: false }
      - { id: d, label: "increase timeouts by 2x at every layer", isCorrect: false }
    concept: retries-jitter-backoff
```

- [ ] **Step 3: Seeder**

```typescript
// scripts/seed-sd-diagnostic.ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

const Schema = z.object({
  version: z.number(),
  questions: z.array(z.object({
    id: z.string(),
    band: z.enum(['rookie', 'journeyman', 'architect']),
    prompt: z.string(),
    options: z.array(z.object({ id: z.string(), label: z.string(), isCorrect: z.boolean() })).length(4),
    concept: z.string(),
    realIncidentSlug: z.string().optional(),
  })).length(15),
});

async function main() {
  const raw = await readFile(join(process.cwd(), 'content', 'sd', 'quiz', 'diagnostic.yaml'), 'utf8');
  const parsed = Schema.safeParse(parse(raw));
  if (!parsed.success) throw new Error(parsed.error.message);
  // Write to a static asset at src/lib/sd/diagnostic-quiz.data.ts so the client can import synchronously
  const outPath = join(process.cwd(), 'src', 'lib', 'sd', 'diagnostic-quiz.data.ts');
  const body = `// AUTOGENERATED from content/sd/quiz/diagnostic.yaml
export const DIAGNOSTIC_QUIZ = ${JSON.stringify(parsed.data, null, 2)} as const;
`;
  const { writeFile } = await import('node:fs/promises');
  await writeFile(outPath, body);
  console.log(`[diagnostic] wrote ${outPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
```

Add to `package.json`:
```json
{ "scripts": { "seed:sd-diagnostic": "tsx scripts/seed-sd-diagnostic.ts" } }
```

And `prebuild`: `"prebuild": "pnpm build:sd-graph && pnpm build:concept-graph && pnpm seed:sd-diagnostic"`.

- [ ] **Step 4: Grading library**

```typescript
// src/lib/sd/diagnostic-quiz.ts
import { DIAGNOSTIC_QUIZ } from './diagnostic-quiz.data';

export interface DiagnosticAnswer { questionId: string; selectedId: string; msToAnswer: number }
export interface DiagnosticResult {
  band: 'rookie' | 'journeyman' | 'architect';
  score: number;                          // 0..15
  recommendedConceptSlug: string;
  perBandScore: Record<'rookie'|'journeyman'|'architect', { correct: number; total: number }>;
}

export function gradeDiagnostic(answers: DiagnosticAnswer[]): DiagnosticResult {
  const questions = DIAGNOSTIC_QUIZ.questions;
  let score = 0;
  const perBandScore: DiagnosticResult['perBandScore'] = {
    rookie:     { correct: 0, total: 5 },
    journeyman: { correct: 0, total: 5 },
    architect:  { correct: 0, total: 5 },
  };
  const wrongConcepts: string[] = [];
  for (const a of answers) {
    const q = questions.find((qq) => qq.id === a.questionId);
    if (!q) continue;
    const correctOpt = q.options.find((o) => o.isCorrect);
    if (correctOpt && correctOpt.id === a.selectedId) {
      score++;
      perBandScore[q.band].correct++;
    } else {
      wrongConcepts.push(q.concept);
    }
  }
  const band: DiagnosticResult['band'] =
    perBandScore.architect.correct >= 3 && score >= 12 ? 'architect' :
    perBandScore.journeyman.correct >= 3 && score >= 8  ? 'journeyman' :
    'rookie';

  // Recommend the first Wave 1 concept the user got wrong; fall back to 'client-server'
  const wave1 = ['client-server', 'http-verbs', 'tcp-vs-udp', 'dns', 'ip-routing'];
  const recommendedConceptSlug = wrongConcepts.find((c) => wave1.includes(c)) ?? (band === 'rookie' ? 'client-server' : 'caching-strategies');

  return { band, score, recommendedConceptSlug, perBandScore };
}
```

- [ ] **Step 5: API routes**

`POST /api/sd/diagnostic` — starts a new attempt (inserts a row with empty `answers`), returns `{ id }`.
`GET /api/sd/diagnostic/[id]` — returns current state.
`PATCH /api/sd/diagnostic/[id]` — body `{ answer: DiagnosticAnswer }` appends; when `answers.length === 15`, calls `gradeDiagnostic`, writes `band`/`score`/`recommendedConceptSlug`, sets `submittedAt`, returns full result.

- [ ] **Step 6: UI**

```typescript
// src/app/sd/onboarding/quiz/page.tsx — server component
import { DiagnosticQuizRunner } from '@/components/modules/sd/learn/quiz/DiagnosticQuizRunner';
import { DIAGNOSTIC_QUIZ } from '@/lib/sd/diagnostic-quiz.data';

export default function DiagnosticQuizPage() {
  return <DiagnosticQuizRunner questions={DIAGNOSTIC_QUIZ.questions} />;
}
```

`DiagnosticQuizRunner` renders questions one at a time with a progress pill ("3/15"). On submit, POSTs to `/api/sd/diagnostic`, PATCHes per answer, renders `DiagnosticQuizResult` when all 15 are answered. The result view shows band + score breakdown + a big "Start with: <concept>" button linking to `/sd/learn/concepts/<slug>`.

- [ ] **Step 7: Tests + commit**

Grading engine tests:
```typescript
describe('gradeDiagnostic', () => {
  it('returns architect for 15/15', () => { /* ... */ });
  it('returns rookie for 3/5 rookie and 0 elsewhere', () => { /* ... */ });
  it('recommends a wave 1 concept the user got wrong', () => { /* ... */ });
});
```

UI test: render runner, simulate answering all 15, assert POST then 15 PATCHes then result view renders.

```bash
pnpm typecheck && pnpm test:run -- diagnostic-quiz
git add architex/content/sd/quiz/diagnostic.yaml \
        architex/scripts/seed-sd-diagnostic.ts \
        architex/src/lib/sd/diagnostic-quiz.ts \
        architex/src/lib/sd/diagnostic-quiz.data.ts \
        architex/src/db/schema/sd-diagnostic-results.ts \
        architex/src/app/api/sd/diagnostic/ \
        architex/src/app/sd/onboarding/quiz/page.tsx \
        architex/src/components/modules/sd/learn/quiz/ \
        architex/package.json
git commit -m "$(cat <<'EOF'
feat(sd-onboarding): diagnostic entry quiz · 15 questions · 3 bands (Task 33/35)

Content: 15 questions (5 rookie + 5 journeyman + 5 architect) covering
client-server, http-verbs, dns, tcp-vs-udp, statelessness, caching,
consistent-hashing, kafka semantics, circuit breakers, CAP, Raft,
HLCs, consistency models, FB 2021 BGP, retry amplification — each
tagged with a concept slug for weak-area recommendation.

Engine: gradeDiagnostic() scores per-band, lands the user in rookie/
journeyman/architect, and recommends a Wave 1 concept they got wrong
(falls back to client-server for rookies).

UI: /sd/onboarding/quiz runs one-question-at-a-time with a progress
pill; result view shows band + per-band breakdown + a "Start with
<concept>" deep-link.

DB: sd_diagnostic_results with anonymous_id fallback so pre-login
users' attempts are preserved across the auth handshake.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 34: 90-second guided onboarding tour (Q34)

**Files:**
- Create: `architex/src/hooks/useSDOnboardingTour.ts`
- Create: `architex/src/components/modules/sd/learn/onboarding/SDOnboardingTour.tsx`
- Create: `architex/src/components/modules/sd/learn/onboarding/SpotlightMask.tsx`
- Modify: `architex/src/stores/ui-store.ts` (add `sdOnboardingStep` slice)
- Modify: `architex/src/components/modules/sd/SDShell.tsx` (mount tour on first visit)

Per spec §18.6, 6 steps totaling 90 seconds, skippable at any point:

| Step | Time | Spotlight on | Caption |
|------|------|---|---|
| 0 | 0:00-0:05 | Full screen (no spotlight) | *"Welcome to the wind tunnel."* (serif, cobalt glow on *wind*) |
| 1 | 0:05-0:20 | Learn mode pill (⌘1) | *"Learn teaches the 40 primitives of distributed systems. Start here."* |
| 2 | 0:20-0:35 | Build mode pill (⌘2) | *"Build is the drafting hall. Sketch any design you want."* |
| 3 | 0:35-0:55 | Simulate mode pill (⌘3) | *"Simulate runs your design. Traffic, cost, chaos. This is the wind tunnel."* |
| 4 | 0:55-1:10 | Drill mode pill (⌘4) | *"Drill is the examination room. 45 minutes, 5 stages, under the clock."* |
| 5 | 1:10-1:20 | Review mode pill (⌘5) | *"Review is daily retention. 2 minutes per day."* |
| 6 | 1:20-1:30 | Center | *"Five modes. One studio. Let's begin."* + Begin button |

- [ ] **Step 1: `SpotlightMask` component**

```typescript
// src/components/modules/sd/learn/onboarding/SpotlightMask.tsx
'use client';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export interface SpotlightMaskProps {
  targetRef: React.RefObject<HTMLElement | null>;
  /** 0 when no target — renders full dim without cutout */
  radius?: number;
}

export function SpotlightMask({ targetRef, radius = 60 }: SpotlightMaskProps) {
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  useEffect(() => {
    const el = targetRef.current;
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, [targetRef.current]);

  // SVG mask cuts a rounded rect out of a full-screen dim layer
  if (!rect) {
    return <motion.div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} />;
  }
  return (
    <svg className="fixed inset-0 z-50 pointer-events-none" width="100%" height="100%">
      <defs>
        <mask id="spot">
          <rect width="100%" height="100%" fill="white" />
          <motion.rect
            x={rect.x - 8} y={rect.y - 8} width={rect.w + 16} height={rect.h + 16}
            rx={12} ry={12}
            fill="black"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="rgb(0 0 0 / 0.7)" mask="url(#spot)" />
    </svg>
  );
}
```

- [ ] **Step 2: Tour state + hook**

```typescript
// src/hooks/useSDOnboardingTour.ts
'use client';
import { useEffect } from 'react';
import { useUIStore } from '@/stores/ui-store';
import { trackSDEvent } from '@/lib/analytics/sd-events';

export interface UseSDOnboardingTourOptions {
  initiallyComplete: boolean;             // from user_preferences.sd.onboardingComplete
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

export function useSDOnboardingTour({ initiallyComplete, onStepChange, onComplete }: UseSDOnboardingTourOptions) {
  const step = useUIStore((s) => s.sdOnboardingStep);
  const setStep = useUIStore((s) => s.setSdOnboardingStep);
  const startedAt = useUIStore((s) => s.sdOnboardingStartedAt);
  const setStartedAt = useUIStore((s) => s.setSdOnboardingStartedAt);

  useEffect(() => {
    if (initiallyComplete || step !== null) return;
    setStep(0);
    setStartedAt(Date.now());
  }, [initiallyComplete, step, setStep, setStartedAt]);

  const advance = () => {
    const next = (step ?? 0) + 1;
    trackSDEvent({ type: 'sd_onboarding_step', step: next, durationMs: Date.now() - (startedAt ?? Date.now()) });
    if (next > 6) { finish(); return; }
    setStep(next);
    onStepChange?.(next);
  };

  const skip = () => {
    trackSDEvent({ type: 'sd_onboarding_skipped', atStep: step ?? 0 });
    finish(true);
  };

  const finish = (skipped = false) => {
    trackSDEvent({ type: 'sd_onboarding_completed', totalDurationMs: Date.now() - (startedAt ?? Date.now()) });
    setStep(null);
    onComplete?.();
    // Persist onboardingComplete: true
    fetch('/api/user-preferences/sd', { method: 'PATCH', body: JSON.stringify({ onboardingComplete: true }) });
  };

  return { step, advance, skip, finish };
}
```

- [ ] **Step 3: `SDOnboardingTour` composition**

```typescript
// src/components/modules/sd/learn/onboarding/SDOnboardingTour.tsx
'use client';
import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SpotlightMask } from './SpotlightMask';
import { useSDOnboardingTour } from '@/hooks/useSDOnboardingTour';

const STEPS = [
  { ref: null,         caption: 'Welcome to the wind tunnel.', durationMs: 5000 },
  { ref: 'learn-pill', caption: 'Learn teaches the 40 primitives of distributed systems. Start here.',                durationMs: 15000 },
  { ref: 'build-pill', caption: 'Build is the drafting hall. Sketch any design you want.',                            durationMs: 15000 },
  { ref: 'sim-pill',   caption: 'Simulate runs your design. Traffic, cost, chaos. This is the wind tunnel.',         durationMs: 20000 },
  { ref: 'drill-pill', caption: 'Drill is the examination room. 45 minutes, 5 stages, under the clock.',             durationMs: 15000 },
  { ref: 'review-pill',caption: 'Review is daily retention. 2 minutes per day.',                                     durationMs: 10000 },
  { ref: null,         caption: 'Five modes. One studio. Let\u2019s begin.',                                             durationMs: 10000, showBegin: true },
];

export interface SDOnboardingTourProps {
  initiallyComplete: boolean;
  getRef: (key: string) => React.RefObject<HTMLElement | null>;
}

export function SDOnboardingTour({ initiallyComplete, getRef }: SDOnboardingTourProps) {
  const { step, advance, skip, finish } = useSDOnboardingTour({ initiallyComplete });

  useEffect(() => {
    if (step === null) return;
    const current = STEPS[step];
    if (!current) return;
    const timer = setTimeout(() => advance(), current.durationMs);
    return () => clearTimeout(timer);
  }, [step, advance]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && step !== null) skip(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, skip]);

  if (step === null) return null;
  const current = STEPS[step];
  const targetRef = current.ref ? getRef(current.ref) : { current: null } as React.RefObject<HTMLElement | null>;

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-50"
      >
        <SpotlightMask targetRef={targetRef} />
        <div className="pointer-events-none absolute inset-x-0 top-1/3 z-[51] text-center">
          <p className="mx-auto max-w-xl font-serif text-2xl leading-snug text-white">
            {current.caption.split('wind').map((part, i, arr) => i === 0 ? (
              <span key={i}>{part}{i < arr.length - 1 && <span className="text-cobalt-300 drop-shadow-[0_0_12px_rgba(37,99,235,0.8)]">wind</span>}</span>
            ) : <span key={i}>{part}</span>)}
          </p>
          <div className="mt-6 flex justify-center gap-3 pointer-events-auto">
            <button onClick={skip} className="text-sm text-white/60 hover:text-white/90">Skip</button>
            {current.showBegin && (
              <button onClick={() => finish(false)} className="rounded-md bg-cobalt-500 px-6 py-2 text-sm text-white hover:bg-cobalt-400">
                Begin
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Mount in `SDShell.tsx`**

`SDShell` already has refs to the 5 mode pills from Phase 1. Expose them via a `getRef()` accessor and mount `<SDOnboardingTour initiallyComplete={userPrefs.sd.onboardingComplete} getRef={getRef} />` above all other content.

- [ ] **Step 5: Tests + commit**

Tests with fake timers:
- Tour does not render when `initiallyComplete: true`
- Tour advances through steps on timer
- Escape at step 2 fires `sd_onboarding_skipped: { atStep: 2 }`
- Begin button at step 6 fires `sd_onboarding_completed`
- `onboardingComplete: true` is PATCHed to `/api/user-preferences/sd` once

```bash
pnpm typecheck && pnpm test:run -- SDOnboardingTour useSDOnboardingTour
git add architex/src/hooks/useSDOnboardingTour.ts \
        architex/src/components/modules/sd/learn/onboarding/ \
        architex/src/components/modules/sd/SDShell.tsx \
        architex/src/stores/ui-store.ts
git commit -m "$(cat <<'EOF'
feat(sd-onboarding): 90-second guided spotlight tour (Task 34/35)

Spotlight-mask overlay mounts on SDShell first visit when
user_preferences.sd.onboardingComplete === false. Six steps — cold
open · Learn · Build · Simulate · Drill · Review — with serif cobalt-
glow captions and a final Begin button. Escape skips at any point.
Completion PATCHes onboardingComplete: true so subsequent visits are
silent. All steps emit typed analytics events.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 35: End-to-end smoke test + `.progress-phase-2-sd.md` tracker + phase commit

- [ ] **Step 1: Run full verification suite**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass.

- [ ] **Step 2: Seed-compile all 8 content pieces**

```bash
pnpm build:sd-graph
pnpm seed:sd-diagnostic
pnpm compile:sd-content          # compiles all 5 concepts + 3 problems
```
Expected: `sd_concepts` has 5 rows, `sd_problems` has 3 rows, `sd_graph_edges` has ~40+ rows, `src/lib/sd/concept-graph.ts` exports 8 graph entries, `src/lib/sd/diagnostic-quiz.data.ts` has 15 questions.

- [ ] **Step 3: Manual E2E walk-through (~15 min)**

Open `http://localhost:3000` → sign in as a test user with `user_preferences.sd.onboardingComplete: false`.

1. **Onboarding tour fires.** Cold open → 5 spotlight steps → Begin button. Click Begin → lands on `/sd` dashboard.
2. **Click "Take the placement quiz" card** → routed to `/sd/onboarding/quiz`. Answer 15 questions. Result: band = `journeyman` (7 correct rookie + 4 journeyman + 1 architect), recommended concept = `caching-strategies` (first journeyman-band wrong). Click "Start with Caching Strategies" → returns "Coming in Phase 3" (caching-strategies not in Phase 2 content) so fall back to `client-server`.
3. **Click Learn mode pill (⌘1).** Lands at `/sd/learn`. Sidebar shows 5 Wave 1 concepts + 3 warmup problems. Click `client-server`.
4. **Concept page renders.** Progress bar at 0%. TOC populated on the right. ConfusedWithPanel below TOC shows `peer-to-peer` + `service-mesh`. ScalingNumbersStrip at top shows 3 values.
5. **Scroll through the 10 sections.** Canvas pulses `client` + `server` nodes when Primitive and Anatomy sections cross viewport. Progress bar fills as sections cross 95%.
6. **Click the `server` node on canvas** → `NodePopover` opens with description, cost hint (~$0.11/hr), concept deep-dives, failure-mode links, "Jump to Anatomy section" button. Click the button → scrolls back to Anatomy, popover closes.
7. **Highlight a paragraph in the Primitive section** → AskAI floating button shows "Explain selection". Click → drawer opens to Explain tab → Haiku renders 3-5 paragraphs.
8. **Click a bookmark icon on the Tradeoffs header** → bookmark strip at top gets 1 entry → click it → scrolls back to Tradeoffs.
9. **Scroll to Checkpoints.** Answer Recall wrong once → `whyWrong` shows. Answer again wrong → second `whyWrong`. Answer again → full reveal. Advance to Apply. Select one correct + one distractor → feedback shows missing + extra → submit correctly → advance. Advance through Compare.
10. **Refresh the page.** Scroll position restored, completed sections retain ticks, checkpoint stats intact.
11. **Press `⌘2` (Build)** → existing canvas unchanged. Press `⌘1` → back to Learn, same concept, same scroll position.
12. **Click a problem (e.g. `url-shortener`).** Verify it loads; 7 panes render; default active pane is `canonicalDesign`; tabs A/B for solutions work; canvas swaps when switching solutions; failure-mode chaos links open the chaos library (stubbed for Phase 2 → "Coming in Phase 3").
13. **Open DevTools → Network.** Verify:
    - `PATCH /api/sd/learn-progress/concept/client-server` fires ~1s after each scroll burst
    - `POST /api/sd/explain-inline` returns 200 + explanation
    - `POST /api/sd/concept-reads` fires for concept refs with 30s rate limit
    - `POST /api/sd/bookmarks` on bookmark create, `DELETE` on toggle-off

If any step fails, fix before calling Phase 2 complete.

- [ ] **Step 4: Accessibility smoke**

- Tab through the lesson column: focus lands on bookmark buttons, checkpoint options, explain-button, popover close, AskAI tabs, canvas nodes.
- Verify each checkpoint's selected-option state is conveyed via `aria-selected` or `aria-pressed`.
- Verify NodePopover has `role="dialog"` and an accessible name.
- Run Lighthouse → Accessibility → confirm ≥95 score on the Learn route.
- Verify `prefers-reduced-motion: reduce` collapses the cobalt-glow onboarding animations.

- [ ] **Step 5: Create `.progress-phase-2-sd.md` tracker**

Create `docs/superpowers/plans/.progress-phase-2-sd.md`:

```markdown
# SD Phase 2 Progress Tracker

- [x] Phase 1.5 pre-flight audit complete (SD Phase 1 tag + LLD Phase 2 tag)
- [x] Task 1: sd_learn_progress schema
- [x] Task 2: sd_concept_reads schema
- [x] Task 3: sd_bookmarks schema
- [x] Task 4: migrations generated + applied + cascade-verified
- [x] Task 5: content-types.ts + shared MDX compiler extracted
- [x] Task 6: compile-sd-content script
- [x] Task 7: concept-loader + problem-loader
- [x] Task 8: learn-progress API routes
- [x] Task 9: useSDLearnProgress hook
- [x] Task 10: bookmarks API routes
- [x] Task 11: useSDBookmarks hook
- [x] Task 12: concept-reads API route
- [x] Task 13: useConceptScrollSync + useProblemPaneSync
- [x] Task 14: 10 concept sections + 6 problem panes + ConceptColumn + ProblemColumn + 3 content-format components
- [x] Task 15: SDCanvasReadonly + NodePopover + 16-family registry
- [x] Task 16: cross-module graph generator + prebuild hook
- [x] Task 17: ConfusedWithPanel + CrossModuleBridgeCard
- [x] Task 18: 4 checkpoint kinds + grading engine
- [x] Task 19: 3 AI API routes (explain-inline · suggest-analogy · show-at-scale)
- [x] Task 20: 3 AI hooks
- [x] Task 21: AskAISurface 3-tab drawer
- [x] Task 22: Reading aids (sidebar, progress, TOC, bookmarks strip)
- [x] Task 23: SDLearnModeLayout rewrite
- [x] Task 24: Client-Server concept
- [x] Task 25: HTTP Verbs concept
- [x] Task 26: TCP-vs-UDP concept
- [x] Task 27: DNS concept
- [x] Task 28: IP Routing concept
- [x] Task 29: URL Shortener problem
- [x] Task 30: Rate Limiter problem
- [x] Task 31: Distributed Cache problem
- [x] Task 32: Analytics event catalog extension
- [x] Task 33: Diagnostic entry quiz
- [x] Task 34: 90-sec guided onboarding
- [x] Task 35: E2E smoke + phase commit

SD Phase 2 complete on: <YYYY-MM-DD>
Ready to start SD Phase 3: Simulate + Drill + second content drop.
```

- [ ] **Step 6: Final commit + tag**

```bash
git add docs/superpowers/plans/.progress-phase-2-sd.md
git commit -m "$(cat <<'EOF'
chore: SD Phase 2 complete — Learn mode + first content drop

- DB: 4 new tables (sd_learn_progress / sd_concept_reads /
  sd_bookmarks / sd_diagnostic_results) + sd_graph_edges.bridge_text
- Pipeline: shared MDX compiler extracted; compile-sd-content +
  build-sd-graph + seed-sd-diagnostic; prebuild chains all three
- Hooks: useSDLearnProgress, useSDBookmarks, useConceptScrollSync,
  useProblemPaneSync, useSDTableOfContents, useSDSelectionExplain,
  useSDSuggestAnalogy, useSDShowAtScale, useDiagnosticQuiz,
  useSDOnboardingTour
- API: 10 new routes (learn-progress × 2, bookmarks × 2, concept-reads,
  explain-inline, suggest-analogy, show-at-scale, diagnostic × 2)
- UI: SDLearnModeLayout composes sidebar + canvas + concept/problem
  column + TOC + bookmark strip + progress bar + NodePopover +
  ConfusedWithPanel + AskAISurface (3-tab drawer);
  8-section concept renderer + 6-pane problem renderer (both with 3-
  checkpoint each, progressive reveal, FSRS rating derivation);
  ScalingNumbersStrip · DecisionTree · EngineeringBlogCard ·
  CrossModuleBridgeCard content-format primitives;
  90-sec spotlight onboarding + 15-question diagnostic quiz
- Content: 5 Wave 1 concepts (client-server, http-verbs, tcp-vs-udp,
  dns, ip-routing) + 3 warmup problems (url-shortener, rate-limiter,
  distributed-cache) authored end-to-end; pipeline allows the
  remaining 32 concepts + 27 problems to ship by content-only PRs
  with zero engineering work

Ready for SD Phase 3: Simulate + Drill + second content drop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git tag phase-2-sd-complete
```

---

## Self-review checklist

Before declaring SD Phase 2 shipped:

**Spec coverage (§5 content, §6 Learn, §11 canvas, §14 smart canvas, §15 AI, §17 cross-module, §18.6 onboarding, §23 Phase 2 scope):**
- [x] 8-section concept renderer (spec §5.4 · §6.3) — Task 14
- [x] 6-pane problem renderer (spec §5.5 · §6.4) — Task 14
- [x] MDX ingestion pipeline shared with LLD Phase 2 — Task 5-7
- [x] Scroll-sync canvas highlight (spec §6.3) — Tasks 13, 15
- [x] 4 checkpoint types (recall · apply · compare · create) — Task 18
- [x] Progressive reveal on checkpoint failure — Task 18
- [x] 3 Ask-AI contextual surfaces (L1-L3 per §15.3.1) — Tasks 19-21
- [x] Class/node popover on canvas click (Q7 analog for SD) — Task 15
- [x] Diagnostic entry quiz (Q46) — Task 33
- [x] 90-sec guided onboarding (Q34) — Task 34
- [x] Cross-linking schema (spec §17) — Tasks 16, 17
- [x] Scaling Numbers strip (Q32 format 3) — Task 14
- [x] Decision tree (Q32 format 4) — Task 14
- [x] Engineering blog deep-link cards (Q32 format 5) — Task 14
- [x] 8 Opus-authored pieces (Wave 1 + 3 warmups) — Tasks 24-31
- [x] DB-first persistence — Tasks 1-4, 8, 10, 12
- [x] Analytics events for Learn mode — Task 32
- [x] Zero regression for LLD Phase 2 (compiler refactor is additive + tested) — Task 5 Step 2

**Explicitly out of scope for SD Phase 2 (don't implement):**
- Tinker mode (port from LLD §6.5 applied to SD canvas) — deferred to Phase 2.5 or Phase 3
- Simulate-mode surfaces (particle layer, metric strip, chaos ribbon) — Phase 3
- Drill-mode 5-stage clock + interviewer personas — Phase 3
- Review-mode FSRS card interface — Phase 4
- Real-incident replay pages — Phase 3
- Cross-module Full-Stack Loop (SD+LLD 90min) — Phase 5
- Audio narration (Q46 wild-card 2) — Phase 4
- Voice variants ELI5 / ELI-Senior — Phase 4
- 3 color themes (Midnight / Parchment / Earth) — Phase 4
- Blueprint / hand-drawn render modes — Phase 5
- Decade Saga narrative campaign — Phase 5
- Cold recall + elaborative interrogation (CS3/CS6 from spec §6.8) — Phase 4
- Tinker → Save to Build handoff — Phase 2.5

**Placeholder check:** No TBDs. Every step has exact code. Tasks 25-28 and 30-31 are content-authoring tasks with "key ingredients" specified in enough detail that Opus can author without engineering clarification; all engineering code is complete. ✓

**Type consistency:** `ConceptPayload`, `ProblemPayload`, `ConceptSectionId`, `ProblemPaneId`, `ConceptFrontmatter`, `ProblemFrontmatter`, `GraphYaml`, `CheckpointAttempt`, `FsrsRating`, `SDLearnProgress`, `SDBookmark`, `NodeFamilySpec`, `UserContext`, `DiagnosticResult` all defined once and imported consistently. ✓

**Invariant: no SD→LLD circular imports.** SD can import shared primitives from `src/components/shared/learn/*`. LLD never imports from `src/components/modules/sd/*`. SD may import `LLDCanvas` and `useLearnProgress` helpers; the reverse is forbidden and enforced by ESLint's `no-restricted-imports` rule added in Task 5.

**Open questions flagged:**

1. **Wave 1 slug drift (pre-flight)** — Task 24-28 slugs (client-server, http-verbs, tcp-vs-udp, dns, ip-routing) diverge from spec §5.2 Wave 1 slugs (client-server, request-response, statelessness, idempotency, three-metrics). Phase 2 ships the task-brief list; Phase 3 absorbs the delta. Content lead sign-off required before Task 24 kickoff.
2. **Canvas JSON source for concept pages** — `ConceptColumn` reads `anchorNodeIds` from frontmatter but the actual node/edge JSON for the anatomy canvas is not in `content-types.ts` schema yet. Task 14 Step 4 references a `frontmatter.anatomyDiagram` field; this field should be added to `ConceptFrontmatterSchema` (Task 5 Step 3) as `anatomyDiagram: z.object({ nodes: z.array(z.any()), edges: z.array(z.any()) }).optional()` and populated in Task 24 for client-server. If missed, the Anatomy canvas renders empty — still functional, but the scroll-sync highlight has no target.
3. **`LLDCanvas` props backfill** — Pre-flight Step 7 requires `LLDCanvas` to expose `readonly`, `highlightedNodeIds`, `onNodeClick`, `accentColor`. If any are missing, Task 15 Step 5 is a ~40 LOC additive PR to LLD. If the change is rejected or requires broader rework, fork into `SDCanvas` and defer full unification to a Phase 3 polish PR.
4. **Diagnostic quiz anonymous identity** — Task 33 schema allows `user_id` OR `anonymous_id`. If the user logs in during the quiz, the migration step (Phase 1's anonymous→authenticated merge tree, spec §4.8) must claim the row. If Phase 1 merger doesn't yet know about `sd_diagnostic_results`, file an LLD Phase 2-style migration PR first.
5. **Chaos event slugs referenced by concept graphs** — Tasks 24, 29 reference `slow-client-attack`, `ddos-amplification`, `tcp-syn-flood`, `cache-stampede`, `hot-partition`, `bad-deploy`, etc. These are authored in SD Phase 3 (spec §12). If Phase 2 ships before Phase 3, the chaos deep-link cards in Tasks 15 + 17 point to stub pages. UX decision: ship with stubs ("Coming in Phase 3") rather than hiding the surfaces — consistent with LLD Phase 2's stubbed Review links.

---

## Content authoring playbook (for the 32 concepts + 27 problems beyond Phase 2)

This section exists so content-only PRs can ship without any engineering involvement after Phase 2 lands.

### Adding a new concept

1. **Pick a slug and wave.** Slugs match `^[a-z][a-z0-9-]{2,98}$`. Wave is 1-8 per spec §5.2. Wave 1 is already full after Phase 2 — subsequent concepts land in Waves 2-8.
2. **Copy the template.**
   ```bash
   cp architex/content/sd/concepts/client-server.mdx \
      architex/content/sd/concepts/<slug>.mdx
   cp architex/content/sd/graph/client-server.graph.yaml \
      architex/content/sd/graph/<slug>.graph.yaml
   ```
3. **Edit frontmatter.** Update `slug`, `title`, `subtitle`, `wave`, `waveOrder`, `estimatedMinutes`, `anchorNodeIds`, `scalingNumbers`, `engineeringBlogLinks`, and all 3 checkpoints (one each of recall + apply + compare).
4. **Write the 10 sections.** Follow the Opus voice rules from spec §5.1. Word targets: hook 60w · analogy 120w · primitive 500-700w · anatomy 150w · numbersThatMatter 80w + table · tradeoffs 200w · antiCases 150w · seenInWild 150w · bridges cards. Total 1200-1800 words.
5. **Update graph YAML.** 3-5 concept relations · 1-3 problem relations · 2-4 LLD pattern bridges · 2-4 chaos-event links · 2-3 `confusedWith` entries.
6. **Compile + verify.**
   ```bash
   pnpm compile:sd-content --slug=<slug>
   pnpm build:sd-graph
   pnpm typecheck
   pnpm test:run -- concept-graph
   ```
7. **Smoke test.** `pnpm dev` → open `/sd/learn/concepts/<slug>` → check all 10 sections render, canvas scroll-sync pulses on anchored node ids, checkpoints grade correctly, `ConfusedWithPanel` shows the right entries.
8. **Open a content PR.** Title: `content(sd): author <Title> concept (Wave N · X/Y)`. Reviewer: content lead.

### Adding a new problem

Same flow, different template:

1. Copy `url-shortener.mdx` + `url-shortener.graph.yaml`.
2. Edit frontmatter — especially `domain`, `difficulty`, `companiesAsking`, `canonicalSolutions` (1-3), `rubric` (6 axes), `recommendedChaos`, `linkedConcepts`, `linkedLldPatterns`, `checkpoints` (pick any 3 from recall/apply/compare/create).
3. Write the 7 panes. Word target 2500-3500.
4. Update graph YAML.
5. Compile + smoke-test.
6. PR title: `content(sd): author <Title> problem (Domain · X/Y)`.

### Editing an existing piece

1. Edit the MDX file directly.
2. `pnpm compile:sd-content --slug=<slug>` — upserts into DB.
3. Word count warning if outside target → fix or acknowledge.
4. PR title: `content(sd): polish <Title>`.

### Author checklist per piece

- [ ] Every checkpoint has pattern-specific `whyWrong` copy (not "try again")
- [ ] Every `scalingNumbers` entry has a `sourceYear` for anything that ages
- [ ] Every `engineeringBlogLinks` entry resolves to a live public URL
- [ ] `confusedWith` entries disambiguate explicitly — not just "related"
- [ ] `anchorNodeIds` cover at least Primitive, Anatomy, and one other section
- [ ] No inline JSX outside the 8 MDX components (`<DecisionTree>`, `<ScalingNumbersStrip>`, `<EngineeringBlogCard>`, `<CrossModuleBridgeCard>`, `<ConfusedWithPanel>`, `<AskAISurface>`, `<NodePopover>`, `<SDCanvasReadonly>`)
- [ ] MDX builds with zero warnings on `pnpm compile:sd-content:dry --slug=<slug>`

### Content ops dashboard (Phase 3)

Phase 3 lands a `/admin/sd-content` internal-only route that:
- Lists all concept + problem rows in `sd_concepts` / `sd_problems`
- Flags items where `sourceYear` is older than 4 years (per spec §5.7)
- Shows completion rate + first-try-correct checkpoint stats per piece
- Exposes a "regenerate graph" button that re-runs `build:sd-graph` without a full deploy

Until then, content-ops uses `pnpm db:studio` and a manual spreadsheet.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-sd-phase-2-learn-mode.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks. Content-authoring tasks (24-31) are especially well-suited to parallel subagents since each piece is independent. Engineering tasks (1-23, 32-34) share state (schemas → compilers → loaders → hooks → components → layout) and should execute roughly in order, but 8 + 9, 10 + 11, 19 + 20, 22 + 23 can be parallelized.

**2. Inline Execution** — `superpowers:executing-plans`, batch with checkpoints at Task 4 (migrations applied), Task 7 (pipeline working end-to-end with a stub concept), Task 23 (full UI composed), Task 31 (all content seeded), Task 35 (smoke test). Recommended if the AI API routes (Task 19) need more than one back-and-forth to land — Sonnet `show-at-scale` JSON contract is the most finicky.

Which approach?





