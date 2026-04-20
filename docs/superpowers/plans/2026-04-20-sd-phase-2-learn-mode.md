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

<!-- TASKS 1-35 follow in subsequent appends per incremental-write protocol -->
