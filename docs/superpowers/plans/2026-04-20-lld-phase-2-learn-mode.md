# LLD Phase 2 · Learn Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Learn mode end-to-end — the 8-section lesson renderer (Itch · Definition · Mechanism · Anatomy · Numbers · Uses · Failure Modes · Checkpoints), a reusable MDX content pipeline, cross-linking between concepts and patterns, AI explain-inline on highlighted paragraphs, reading aids (sidebar nav + progress bar + TOC + bookmarks), and 4 checkpoint types (recall / apply / compare / create) — with 6 fully authored foundation patterns seeded. Pipeline permits the remaining 30 patterns to be authored by content-only PRs with zero engineering work.

**Architecture:** Lesson content lives in `.mdx` files under `content/lld/lessons/<pattern-slug>.mdx` plus per-pattern `concepts.yaml` (cross-link graph). A build-time ingestion script compiles MDX into `module_content` rows (JSONB payload per lesson section). At render time, Learn mode reads the compiled payload from DB via TanStack Query and composes the 8 section components. A `lld_learn_progress` table tracks per-section completion + scroll depth, `lld_concept_reads` logs concept-page views for FSRS seeding, and `lld_bookmarks` stores user bookmarks. Cross-linking is powered by a static graph (`src/lib/lld/concept-graph.ts`) generated at build time from `concepts.yaml`. AI explain-inline sends highlighted text + section context to Claude Haiku via the existing singleton client. Reading aids are pure client components reading from the lesson payload and `ui-store`.

**Tech Stack:** Next.js 16 App Router · React 19 · TypeScript 5 strict · MDX 3 (@next/mdx + @mdx-js/react) · Drizzle ORM · PostgreSQL (Neon) · Zustand 5 · TanStack Query 5 · @xyflow/react · motion/react 12 · Anthropic Claude SDK (Haiku) · Vitest · Testing Library · Playwright.

**Prerequisite:** Phase 1 complete — `LLDShell`, `ModeSwitcher`, `WelcomeBanner`, `useLLDModeSync`, `useLLDPreferencesSync`, `useLLDDrillSync`, `lld_drill_attempts` table, and 6 API routes from Phase 1 are all merged. The `.progress-phase-1.md` tracker shows Phase 1 complete. If any Phase 1 task is still open, finish it before Task 1 below.

**Reference:** Design spec at `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` sections §6 (Learn mode), §7 (persistence), §8 (content strategy), §9 (cognitive science · CS3 elaborative interrogation, CS7 teach-back), §12 (AI contextual surfaces Q9), §14 (component plan), §15 (Phase 2 goals).

---

## Pre-flight checklist (Phase 1.5 · ~1-2 hours)

Run before Task 1. These verify Phase 1 artifacts and upstream dependencies are in a known-good state.

- [ ] **Verify Phase 1 tag exists and points at a clean working tree**

```bash
cd architex
git tag -l phase-1-complete
git diff phase-1-complete HEAD -- src/stores src/hooks src/app/api src/components/modules/lld
```
Expected: `phase-1-complete` tag present. Diff should be empty if nothing has been merged since Phase 1 landed. If new work has been merged, scan the diff for conflicts with the files this plan will touch (listed in "File Structure" below).

- [ ] **Verify Learn mode stub still renders**

```bash
pnpm dev
```
Open <http://localhost:3000>, click LLD in the left rail, press `⌘1` (or click the Learn pill). Expected: the Phase 1 `LearnModeLayout` stub shows the "📖 Learn Mode · Guided pattern lessons are coming in Phase 2" placeholder. If a blank screen or error appears, the Phase 1 wire-up regressed — fix before starting.

- [ ] **Verify MDX is not already installed (fresh dep add)**

```bash
grep -E '"@next/mdx"|"@mdx-js/react"' architex/package.json
```
Expected: no matches. This plan installs them in Task 5. If already present, skip the `pnpm add` line in Task 5 Step 1.

- [ ] **Verify the 6 target pattern slugs exist in `patterns.ts`**

The 6 patterns this phase ships content for are Wave 1 Foundations + one communication pattern to prove cross-category linking works. Spec §8 Wave 1 lists 5 (singleton, factory-method, builder, abstract-factory, prototype). We add `observer` as the 6th to exercise cross-category concept linking.

```bash
grep -E "id: \"(singleton|factory-method|builder|abstract-factory|prototype|observer)\"" architex/src/lib/lld/patterns.ts
```
Expected: 6 matches, one per slug. If any is missing or slug-differs, update the list used in Tasks 24-29 accordingly and flag to the user.

- [ ] **Verify Anthropic client has a Haiku path**

```bash
grep -n "claude-.*haiku" architex/src/lib/ai/claude-client.ts
```
Expected: at least one match. This plan uses Haiku for explain-inline (cheap, <1s). If only Sonnet is wired, add a `generateWithHaiku()` helper in Task 20 Step 1 before wiring `ContextualExplainPopover`.

- [ ] **Verify `module_content` table exists and has JSONB `content` column**

```bash
pnpm db:studio
```
In the studio, confirm `module_content` is present with columns `id, module_id, content_type, slug, content jsonb, …`. If missing, Phase 0 migrations were never applied — block and notify user.

- [ ] **Run full baseline test suite**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 2. No Phase 2 code should mingle with a broken baseline.

- [ ] **Optional: clear browser state to simulate first-visit learn flow**

DevTools → Application → Local Storage → delete `architex-ui`. Fresh first-visit state is helpful for smoke-testing reading-aid persistence in Task 23.

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                    # (generated migrations)
│   ├── NNNN_add_lld_learn_progress.sql                         # NEW
│   ├── NNNN_add_lld_concept_reads.sql                          # NEW
│   └── NNNN_add_lld_bookmarks.sql                              # NEW
├── content/                                                    # NEW top-level
│   └── lld/
│       ├── lessons/
│       │   ├── singleton.mdx                                   # NEW (Task 24)
│       │   ├── factory-method.mdx                              # NEW (Task 25)
│       │   ├── builder.mdx                                     # NEW (Task 26)
│       │   ├── abstract-factory.mdx                            # NEW (Task 27)
│       │   ├── prototype.mdx                                   # NEW (Task 28)
│       │   └── observer.mdx                                    # NEW (Task 29)
│       └── concepts/
│           ├── singleton.concepts.yaml                         # NEW (Task 24)
│           ├── factory-method.concepts.yaml                    # NEW (Task 25)
│           ├── builder.concepts.yaml                           # NEW (Task 26)
│           ├── abstract-factory.concepts.yaml                  # NEW (Task 27)
│           ├── prototype.concepts.yaml                         # NEW (Task 28)
│           └── observer.concepts.yaml                          # NEW (Task 29)
├── scripts/
│   ├── compile-lld-lessons.ts                                  # NEW (Task 6)
│   └── build-concept-graph.ts                                  # NEW (Task 16)
├── src/
│   ├── db/schema/
│   │   ├── lld-learn-progress.ts                               # NEW (Task 1)
│   │   ├── lld-concept-reads.ts                                # NEW (Task 2)
│   │   ├── lld-bookmarks.ts                                    # NEW (Task 3)
│   │   ├── index.ts                                            # MODIFY (re-exports)
│   │   └── relations.ts                                        # MODIFY (3 new relations)
│   ├── lib/lld/
│   │   ├── lesson-types.ts                                     # NEW (Task 5)
│   │   ├── lesson-loader.ts                                    # NEW (Task 7)
│   │   ├── concept-graph.ts                                    # NEW generated (Task 16)
│   │   ├── checkpoint-types.ts                                 # NEW (Task 18)
│   │   └── __tests__/
│   │       ├── lesson-loader.test.ts                           # NEW
│   │       ├── concept-graph.test.ts                           # NEW
│   │       └── checkpoint-grading.test.ts                      # NEW
│   ├── lib/analytics/
│   │   └── lld-events.ts                                       # MODIFY (add lesson/checkpoint/bookmark events)
│   ├── hooks/
│   │   ├── useLearnProgress.ts                                 # NEW (Task 9)
│   │   ├── useLessonScrollSync.ts                              # NEW (Task 13)
│   │   ├── useTableOfContents.ts                               # NEW (Task 22)
│   │   ├── useBookmarks.ts                                     # NEW (Task 11)
│   │   ├── useSelectionExplain.ts                              # NEW (Task 20)
│   │   └── __tests__/
│   │       ├── useLearnProgress.test.tsx                       # NEW
│   │       ├── useLessonScrollSync.test.tsx                    # NEW
│   │       ├── useBookmarks.test.tsx                           # NEW
│   │       └── useSelectionExplain.test.tsx                    # NEW
│   ├── app/api/
│   │   ├── lld/learn-progress/route.ts                         # NEW (Task 8)
│   │   ├── lld/learn-progress/[patternSlug]/route.ts           # NEW (Task 8)
│   │   ├── lld/bookmarks/route.ts                              # NEW (Task 10)
│   │   ├── lld/bookmarks/[id]/route.ts                         # NEW (Task 10)
│   │   ├── lld/concept-reads/route.ts                          # NEW (Task 12)
│   │   ├── lld/explain-inline/route.ts                         # NEW (Task 19)
│   │   └── __tests__/
│   │       ├── lld-learn-progress.test.ts                      # NEW
│   │       ├── lld-bookmarks.test.ts                           # NEW
│   │       └── lld-explain-inline.test.ts                      # NEW
│   └── components/modules/lld/
│       ├── modes/
│       │   └── LearnModeLayout.tsx                             # REWRITE (Task 23)
│       └── learn/
│           ├── LessonColumn.tsx                                # NEW (Task 14)
│           ├── LessonSidebar.tsx                               # NEW (Task 22)
│           ├── LessonProgressBar.tsx                           # NEW (Task 22)
│           ├── LessonTableOfContents.tsx                       # NEW (Task 22)
│           ├── BookmarkStrip.tsx                               # NEW (Task 22)
│           ├── ClassPopover.tsx                                # NEW (Task 15)
│           ├── ConfusedWithPanel.tsx                           # NEW (Task 17)
│           ├── ContextualExplainPopover.tsx                    # NEW (Task 21)
│           ├── sections/
│           │   ├── ItchSection.tsx                             # NEW (Task 14)
│           │   ├── DefinitionSection.tsx                       # NEW (Task 14)
│           │   ├── MechanismSection.tsx                        # NEW (Task 14)
│           │   ├── AnatomySection.tsx                          # NEW (Task 14)
│           │   ├── NumbersSection.tsx                          # NEW (Task 14)
│           │   ├── UsesSection.tsx                             # NEW (Task 14)
│           │   ├── FailureModesSection.tsx                     # NEW (Task 14)
│           │   └── CheckpointSection.tsx                       # NEW (Task 14)
│           └── checkpoints/
│               ├── RecallCheckpoint.tsx                        # NEW (Task 18)
│               ├── ApplyCheckpoint.tsx                         # NEW (Task 18)
│               ├── CompareCheckpoint.tsx                       # NEW (Task 18)
│               └── CreateCheckpoint.tsx                        # NEW (Task 18)
└── package.json                                                # MODIFY (+ MDX deps + 2 scripts)
```

**Design rationale for splits:**

- **Three new DB tables, not one.** `lld_learn_progress` is per (user, pattern) with scroll state and section checkmarks. `lld_concept_reads` is per (user, concept) — a thin log for cross-pattern FSRS seeding. `lld_bookmarks` is per (user, anchor) — user-authored, independent lifecycle. Merging them into one JSONB blob on `progress.metadata` would be tempting but violates the spec's "DB-first" invariant (§7) because bookmark writes would contend with progress writes.
- **MDX over raw JSON for lesson authoring.** Content authors need embedded JSX for diagrams, code blocks, callouts. Raw JSON would force every author to escape newlines and backticks. MDX solves this, and the compile step flattens it into JSONB for fast DB reads.
- **Eight sections are separate files.** Per Phase 1 convention (one component per file). Each section has distinct props and rendering logic — mixing them would hurt diffs and review.
- **Four checkpoint types are separate files.** Same reason, and so later phases (Phase 3 drill grading) can reuse `RecallCheckpoint` and `ApplyCheckpoint` without dragging in lesson-specific chrome.
- **Static concept graph, not on-the-fly.** The graph (concept → patterns · pattern → concepts · concept → related concepts) is derived from `concepts.yaml` at build time and committed as a generated TypeScript file. Runtime lookups are O(1) map reads — no DB round trips for a UI surface that renders on every section hover.
- **Content directory at repo root, not under `src/`.** Authors committing MDX should not need to touch TypeScript. `content/lld/` is a zero-code region where non-engineers can contribute. The compile step is the one-way bridge to the app.

---

## Task Overview

| # | Task | Est. time |
|---|---|---|
| 1 | `lld_learn_progress` schema | 20 min |
| 2 | `lld_concept_reads` schema | 15 min |
| 3 | `lld_bookmarks` schema | 15 min |
| 4 | Generate and apply 3 migrations | 15 min |
| 5 | Define lesson payload types + install MDX | 30 min |
| 6 | Write MDX compile script | 45 min |
| 7 | Write lesson-loader (DB → typed payload) | 25 min |
| 8 | `GET/PATCH /api/lld/learn-progress` routes | 35 min |
| 9 | `useLearnProgress` hook with debounced writes | 35 min |
| 10 | `GET/POST/DELETE /api/lld/bookmarks` routes | 35 min |
| 11 | `useBookmarks` hook | 25 min |
| 12 | `POST /api/lld/concept-reads` route | 20 min |
| 13 | `useLessonScrollSync` hook | 40 min |
| 14 | Build 8 section components + `LessonColumn` | 90 min |
| 15 | `ClassPopover` (Q7) | 35 min |
| 16 | Concept graph generator + build integration | 30 min |
| 17 | `ConfusedWithPanel` | 30 min |
| 18 | 4 checkpoint components + grading engine extension | 80 min |
| 19 | `POST /api/lld/explain-inline` route (Haiku) | 30 min |
| 20 | `useSelectionExplain` hook | 30 min |
| 21 | `ContextualExplainPopover` component | 40 min |
| 22 | Reading aids (sidebar, progress, TOC, bookmarks strip) | 70 min |
| 23 | Rewrite `LearnModeLayout` to compose everything | 40 min |
| 24-29 | Author 6 pattern MDX lessons (one task per pattern) | 3-4 hrs each |
| 30 | E2E smoke test + `.progress` tracker + phase commit | 45 min |

**Total engineering time (excluding content authoring):** ~14 hours across Tasks 1-23 + 30.
**Content authoring:** ~20-25 hours for Tasks 24-29 (shared between Opus drafts and human editorial review).

---
