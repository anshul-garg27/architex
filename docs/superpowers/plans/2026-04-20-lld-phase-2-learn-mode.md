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

## Task 1: Create `lld_learn_progress` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-learn-progress.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-learn-progress.ts`:

```typescript
/**
 * DB-015: LLD learn progress — per (user, pattern) lesson reading state.
 *
 * Stores which of the 8 lesson sections the user has scrolled through,
 * their deepest scroll offset per section, and whether each section's
 * checkpoint has been answered. A unique (userId, patternSlug) constraint
 * ensures one row per user+pattern.
 *
 * FSRS seed data — the `completedAt` of this row is what the Review mode
 * (Phase 3) uses to schedule the first spaced-repetition card.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  boolean,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export type LearnSectionId =
  | "itch"
  | "definition"
  | "mechanism"
  | "anatomy"
  | "numbers"
  | "uses"
  | "failure_modes"
  | "checkpoints";

export interface SectionState {
  /** Deepest scroll offset reached, 0..1 clamped. */
  scrollDepth: number;
  /** When this section first entered viewport (epoch ms, null = never). */
  firstSeenAt: number | null;
  /** When the user's scroll reached ≥95% of the section (epoch ms, null = not yet). */
  completedAt: number | null;
}

export type SectionProgressMap = Record<LearnSectionId, SectionState>;

export const lldLearnProgress = pgTable(
  "lld_learn_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),

    /** Map of section → {scrollDepth, firstSeenAt, completedAt}. */
    sectionProgress: jsonb("section_progress")
      .$type<SectionProgressMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    /** Last scroll position (px) so we can restore viewport on return. */
    lastScrollY: integer("last_scroll_y").notNull().default(0),
    /** Which section is currently in view (server-side mirror). */
    activeSectionId: varchar("active_section_id", { length: 30 }),

    /** Number of distinct sections scrolled ≥95% (denormalized for list views). */
    completedSectionCount: integer("completed_section_count")
      .notNull()
      .default(0),

    /** Checkpoint attempts per section: {[sectionId]: {attempts, correct}}. */
    checkpointStats: jsonb("checkpoint_stats")
      .notNull()
      .default(sql`'{}'::jsonb`),

    /** Whole-lesson completion: all 8 sections + final checkpoints done. */
    completedAt: timestamp("completed_at", { withTimezone: true }),

    /** Monotonic read count — increments each time the lesson is re-opened. */
    visitCount: integer("visit_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("lld_learn_progress_user_pattern_idx").on(
      t.userId,
      t.patternSlug,
    ),
    index("lld_learn_progress_user_idx").on(t.userId),
  ],
);

export type LLDLearnProgress = typeof lldLearnProgress.$inferSelect;
export type NewLLDLearnProgress = typeof lldLearnProgress.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and add (alphabetical):

```typescript
export * from "./lld-learn-progress";
```

- [ ] **Step 3: Add relation**

Open `architex/src/db/schema/relations.ts`. Import the new table at the top:

```typescript
import { lldLearnProgress } from "./lld-learn-progress";
```

Inside the existing `usersRelations` `many` block, add:

```typescript
lldLearnProgress: many(lldLearnProgress),
```

At the bottom of the file, add:

```typescript
export const lldLearnProgressRelations = relations(
  lldLearnProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [lldLearnProgress.userId],
      references: [users.id],
    }),
  }),
);
```

- [ ] **Step 4: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: no errors. If you see "cannot find `users` table", verify the import order in `relations.ts`.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-learn-progress.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_learn_progress schema

Tracks per (user, pattern) reading state: which of 8 sections scrolled,
deepest offset per section, checkpoint attempts, and lesson completion
time. Unique (userId, patternSlug) ensures one row per pair.
completedAt seeds the FSRS review schedule in Phase 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `lld_concept_reads` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-concept-reads.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-concept-reads.ts`:

```typescript
/**
 * DB-016: LLD concept reads — thin log of "user viewed concept X on
 * pattern Y, at time T". Used by the cross-linking engine to dim already-
 * read concepts in the sidebar, and by FSRS to boost stability for
 * concepts the user has seen across multiple patterns.
 *
 * Append-only — we do not update existing rows. Keep rows small, index
 * only the two query shapes we support (read all for user, read recent
 * per user+concept).
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldConceptReads = pgTable(
  "lld_concept_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Concept identifier — slug from concept-graph (e.g. "lazy-init"). */
    conceptId: varchar("concept_id", { length: 100 }).notNull(),
    /** Pattern slug where the concept was surfaced (e.g. "singleton"). */
    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),
    /** Section within the pattern (itch|definition|...|checkpoints). */
    sectionId: varchar("section_id", { length: 30 }).notNull(),

    readAt: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_concept_reads_user_concept_idx").on(
      t.userId,
      t.conceptId,
      t.readAt,
    ),
    index("lld_concept_reads_user_recent_idx").on(t.userId, t.readAt),
  ],
);

export type LLDConceptRead = typeof lldConceptReads.$inferSelect;
export type NewLLDConceptRead = typeof lldConceptReads.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and add (alphabetical, above `lld-learn-progress`):

```typescript
export * from "./lld-concept-reads";
```

- [ ] **Step 3: Add relation**

Open `architex/src/db/schema/relations.ts`. Import at top:

```typescript
import { lldConceptReads } from "./lld-concept-reads";
```

Add inside `usersRelations` `many` block:

```typescript
lldConceptReads: many(lldConceptReads),
```

At the bottom of the file, add:

```typescript
export const lldConceptReadsRelations = relations(
  lldConceptReads,
  ({ one }) => ({
    user: one(users, {
      fields: [lldConceptReads.userId],
      references: [users.id],
    }),
  }),
);
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-concept-reads.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_concept_reads schema

Append-only log of concept views: (user, concept, pattern, section, readAt).
Indexed for two query shapes: recent-by-user and recent-by-user-and-concept.
Drives cross-link dimming and concept-level FSRS boosting.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Create `lld_bookmarks` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-bookmarks.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-bookmarks.ts`:

```typescript
/**
 * DB-017: LLD bookmarks — user-authored anchors into lesson content.
 *
 * Scope: bookmark-per-heading (not arbitrary paragraph) to keep anchors
 * stable across content edits. Each bookmark stores the pattern, the
 * sectionId, a stable anchor id (from MDX frontmatter or the sluggified
 * heading), and the user's optional note.
 *
 * Deletion is hard-delete (no soft-delete) — bookmarks are lightweight
 * and users expect delete = gone.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldBookmarks = pgTable(
  "lld_bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),
    sectionId: varchar("section_id", { length: 30 }).notNull(),
    /** Stable anchor id (e.g. "why-singleton-is-a-smell"). */
    anchorId: varchar("anchor_id", { length: 200 }).notNull(),
    /** Cached heading text for list display — refreshed on content edits. */
    anchorLabel: varchar("anchor_label", { length: 500 }).notNull(),

    /** Optional user note (max ~10k chars). */
    note: text("note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // One bookmark per (user, pattern, anchor) — toggling a bookmark
    // on an already-bookmarked anchor is a delete, not a duplicate.
    uniqueIndex("lld_bookmarks_user_anchor_idx").on(
      t.userId,
      t.patternSlug,
      t.anchorId,
    ),
    index("lld_bookmarks_user_recent_idx").on(t.userId, t.createdAt),
  ],
);

export type LLDBookmark = typeof lldBookmarks.$inferSelect;
export type NewLLDBookmark = typeof lldBookmarks.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and add (alphabetical, above `lld-concept-reads`):

```typescript
export * from "./lld-bookmarks";
```

- [ ] **Step 3: Add relation**

Open `architex/src/db/schema/relations.ts`. Import at top:

```typescript
import { lldBookmarks } from "./lld-bookmarks";
```

Add inside `usersRelations` `many` block:

```typescript
lldBookmarks: many(lldBookmarks),
```

At the bottom of the file, add:

```typescript
export const lldBookmarksRelations = relations(lldBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [lldBookmarks.userId],
    references: [users.id],
  }),
}));
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-bookmarks.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_bookmarks schema

Per (user, pattern, anchor) bookmark row. Unique constraint means
toggling an already-bookmarked anchor is a DELETE not an INSERT. Optional
free-text note on each. Two indices: by anchor (for toggle lookups) and
by recent (for the bookmark strip UI).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Generate and apply 3 migrations

**Files:**
- Generated: `architex/drizzle/NNNN_add_lld_learn_progress.sql`
- Generated: `architex/drizzle/NNNN_add_lld_concept_reads.sql`
- Generated: `architex/drizzle/NNNN_add_lld_bookmarks.sql`

Drizzle will batch these into one or more generated files depending on version. The steps below handle either case.

- [ ] **Step 1: Generate migration**

```bash
cd architex
pnpm db:generate
```
Expected: one or more new SQL files in `architex/drizzle/` containing `CREATE TABLE` statements for all three new tables plus their indices.

- [ ] **Step 2: Review the generated SQL**

Open each generated file and confirm:

1. `CREATE TABLE "lld_learn_progress"` with columns: `id uuid`, `user_id uuid`, `pattern_slug varchar(100)`, `section_progress jsonb`, `last_scroll_y integer`, `active_section_id varchar(30)`, `completed_section_count integer`, `checkpoint_stats jsonb`, `completed_at timestamptz`, `visit_count integer`, `created_at timestamptz`, `updated_at timestamptz`.
2. `CREATE UNIQUE INDEX "lld_learn_progress_user_pattern_idx" ON "lld_learn_progress" ("user_id","pattern_slug")`.
3. `CREATE TABLE "lld_concept_reads"` with columns: `id uuid`, `user_id uuid`, `concept_id varchar(100)`, `pattern_slug varchar(100)`, `section_id varchar(30)`, `read_at timestamptz`.
4. `CREATE INDEX "lld_concept_reads_user_concept_idx"` and `CREATE INDEX "lld_concept_reads_user_recent_idx"`.
5. `CREATE TABLE "lld_bookmarks"` with columns: `id uuid`, `user_id uuid`, `pattern_slug varchar(100)`, `section_id varchar(30)`, `anchor_id varchar(200)`, `anchor_label varchar(500)`, `note text`, `created_at timestamptz`, `updated_at timestamptz`.
6. `CREATE UNIQUE INDEX "lld_bookmarks_user_anchor_idx"` and `CREATE INDEX "lld_bookmarks_user_recent_idx"`.
7. Three `FOREIGN KEY ... REFERENCES "users"("id") ON DELETE CASCADE` constraints.

If any column or index is missing, delete the generated file and re-run `pnpm db:generate`. If schema still wrong, inspect the Drizzle schema files and re-verify column definitions before regenerating.

- [ ] **Step 3: Apply to dev DB**

```bash
pnpm db:push
```
Expected: migration applies cleanly. If `error: table already exists`, a previous attempt partially applied — drop the tables via `pnpm db:studio` and retry.

- [ ] **Step 4: Verify all 3 tables via Drizzle Studio**

```bash
pnpm db:studio
```
Opens at <https://local.drizzle.studio>. Confirm all three tables appear in the sidebar with 0 rows. Click each, check columns match the schema files.

- [ ] **Step 5: Smoke-test the foreign keys**

In a separate terminal, connect to the dev DB and insert a bogus row to confirm the cascade works:

```bash
pnpm db:psql <<'SQL'
-- Expect this to succeed
INSERT INTO users (id, clerk_user_id, email, display_name)
  VALUES ('00000000-0000-0000-0000-000000000001', 'clerk_test', 't@test.com', 'Test')
  ON CONFLICT DO NOTHING;

INSERT INTO lld_learn_progress (user_id, pattern_slug)
  VALUES ('00000000-0000-0000-0000-000000000001', 'singleton');

INSERT INTO lld_concept_reads (user_id, concept_id, pattern_slug, section_id)
  VALUES ('00000000-0000-0000-0000-000000000001', 'lazy-init', 'singleton', 'mechanism');

INSERT INTO lld_bookmarks (user_id, pattern_slug, section_id, anchor_id, anchor_label)
  VALUES ('00000000-0000-0000-0000-000000000001', 'singleton', 'definition', 'the-itch', 'The Itch');

-- Cascade delete should take all three rows with it
DELETE FROM users WHERE id = '00000000-0000-0000-0000-000000000001';

-- These should all return 0
SELECT count(*) AS learn FROM lld_learn_progress WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT count(*) AS reads FROM lld_concept_reads WHERE user_id = '00000000-0000-0000-0000-000000000001';
SELECT count(*) AS bookmarks FROM lld_bookmarks WHERE user_id = '00000000-0000-0000-0000-000000000001';
SQL
```

If `pnpm db:psql` isn't defined, copy the SQL into Drizzle Studio's SQL editor and run it there.

Expected: all three `count(*)` results are `0`.

- [ ] **Step 6: Commit**

```bash
git add architex/drizzle/
git commit -m "$(cat <<'EOF'
feat(db): generate + apply lld learn-progress, concept-reads, bookmarks migrations

Applies 3 new tables with their indices and FK cascades to users.
Cascade delete verified via direct SQL smoke test.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Define lesson payload types + install MDX deps

**Files:**
- Create: `architex/src/lib/lld/lesson-types.ts`
- Modify: `architex/package.json`

- [ ] **Step 1: Install MDX + gray-matter**

The compile script (Task 6) uses `@mdx-js/mdx` to parse MDX into JSX, `gray-matter` to extract frontmatter, `remark-gfm` for GitHub-flavored markdown, and `js-yaml` for the concepts files.

```bash
cd architex
pnpm add @mdx-js/mdx@^3 @mdx-js/react@^3 gray-matter@^4 remark-gfm@^4 js-yaml@^4
pnpm add -D @types/js-yaml@^4
```
Expected: `package.json` `dependencies` includes `@mdx-js/mdx`, `@mdx-js/react`, `gray-matter`, `remark-gfm`, `js-yaml`; `devDependencies` includes `@types/js-yaml`.

- [ ] **Step 2: Create the lesson-types file**

Create `architex/src/lib/lld/lesson-types.ts`:

```typescript
/**
 * Typed lesson payload — compiled from MDX at build time, stored as JSONB
 * on module_content rows, consumed at render time by the 8 section
 * components.
 *
 * The 8 sections match Phase 2 scope (spec §6 Learn mode, extended):
 *   1. Itch         — concrete problem scenario that makes the pattern
 *                     feel necessary
 *   2. Definition   — one-paragraph precise definition + canonical UML
 *   3. Mechanism    — step-by-step how it works (sequence of events)
 *   4. Anatomy      — class-by-class breakdown with role + responsibility
 *   5. Numbers      — performance, memory, latency figures (Big-O + real-
 *                     world numbers from production systems)
 *   6. Uses         — 3-5 real-world case studies
 *   7. Failure Modes— anti-patterns and ways this goes wrong
 *   8. Checkpoints  — 4 checkpoints (recall/apply/compare/create)
 */

/** Section identifier used across DB rows, URLs, and UI state. */
export type LessonSectionId =
  | "itch"
  | "definition"
  | "mechanism"
  | "anatomy"
  | "numbers"
  | "uses"
  | "failure_modes"
  | "checkpoints";

/** Anchor inside a section — stable across content edits. */
export interface LessonAnchor {
  id: string; // stable slug
  label: string; // heading text
  depth: 2 | 3; // h2 or h3 within the section
}

/** Serialized MDX: the pre-compiled JSX string + imports list. */
export interface CompiledMDX {
  /** JSX function body, no imports — loaded client-side via useMDXComponent. */
  code: string;
  /** Raw markdown snippet for AI explain-inline context. */
  raw: string;
  /** Headings extracted at compile time. */
  anchors: LessonAnchor[];
  /** Concept ids referenced in this section (for cross-link dimming). */
  conceptIds: string[];
  /** Class ids referenced (drives scroll-sync canvas highlight). */
  classIds: string[];
}

export interface ItchSectionPayload extends CompiledMDX {
  /** One-line "problem statement" shown in the section header card. */
  scenario: string;
  /** Keywords for search / cross-linking. */
  keywords: string[];
}

export interface DefinitionSectionPayload extends CompiledMDX {
  /** ≤200-char precise definition. */
  oneLiner: string;
  /** GoF or modern canonical citation (book, paper, post). */
  canonicalSource: string;
}

export interface MechanismSectionPayload extends CompiledMDX {
  /** Ordered list of mechanism steps — used by the step-by-step viewer. */
  steps: Array<{ index: number; title: string; markdown: string }>;
}

export interface AnatomySectionPayload extends CompiledMDX {
  /** Per-class role + responsibility breakdown. */
  classes: Array<{
    classId: string; // matches pattern.classes[].id
    role: string; // e.g. "Creator"
    responsibility: string; // one-line
    keyMethod?: string; // flagship method name
  }>;
}

export interface NumbersSectionPayload extends CompiledMDX {
  /** Flagship numbers shown as a banner. */
  headline: Array<{ label: string; value: string; unit?: string }>;
}

export interface UsesSectionPayload extends CompiledMDX {
  /** Case studies — renders as cards. */
  cases: Array<{
    company: string;
    system: string;
    whyThisPattern: string;
    sourceUrl?: string;
  }>;
}

export interface FailureModesSectionPayload extends CompiledMDX {
  /** Anti-patterns and war stories. */
  modes: Array<{
    title: string;
    whatGoesWrong: string;
    howToAvoid: string;
    severity: "low" | "medium" | "high";
  }>;
}

export type CheckpointKind = "recall" | "apply" | "compare" | "create";

export interface RecallCheckpoint {
  kind: "recall";
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
    whyWrong?: string; // shown on first wrong attempt (Q3 progressive reveal)
  }>;
  explanation: string; // shown when revealed or correct
}

export interface ApplyCheckpoint {
  kind: "apply";
  id: string;
  /** Scenario the learner must apply the pattern to. */
  scenario: string;
  /** Correct class ids the user must select. */
  correctClassIds: string[];
  /** Distractors (classes present on canvas but not part of the pattern here). */
  distractorClassIds: string[];
  explanation: string;
}

export interface CompareCheckpoint {
  kind: "compare";
  id: string;
  prompt: string;
  /** Two patterns being compared. */
  left: { patternSlug: string; label: string };
  right: { patternSlug: string; label: string };
  /** Statements user must categorize as "left" / "right" / "both". */
  statements: Array<{
    id: string;
    text: string;
    correct: "left" | "right" | "both";
  }>;
  explanation: string;
}

export interface CreateCheckpoint {
  kind: "create";
  id: string;
  prompt: string;
  /** Skeleton the user fills in. */
  starterCanvas: {
    classes: Array<{ id: string; name: string; methods: string[] }>;
  };
  /** Grading rubric — pass criteria. */
  rubric: Array<{ criterion: string; points: number }>;
  /** Reference solution (reveal after submit). */
  referenceSolution: { classes: Array<{ id: string; name: string }> };
  explanation: string;
}

export type Checkpoint =
  | RecallCheckpoint
  | ApplyCheckpoint
  | CompareCheckpoint
  | CreateCheckpoint;

export interface CheckpointsSectionPayload extends CompiledMDX {
  /** Exactly 4 checkpoints — one per kind, order fixed. */
  checkpoints: [
    RecallCheckpoint,
    ApplyCheckpoint,
    CompareCheckpoint,
    CreateCheckpoint,
  ];
}

/** The full lesson payload stored in module_content.content JSONB. */
export interface LessonPayload {
  schemaVersion: 1;
  /** Pattern slug — must match patterns.ts id. */
  patternSlug: string;
  /** Short lesson subtitle shown in sidebar. */
  subtitle: string;
  /** Estimated reading time (minutes). */
  estimatedMinutes: number;
  /** Concepts introduced by this lesson (top-level, in order). */
  conceptIds: string[];
  /** Sections — all 8 required. */
  sections: {
    itch: ItchSectionPayload;
    definition: DefinitionSectionPayload;
    mechanism: MechanismSectionPayload;
    anatomy: AnatomySectionPayload;
    numbers: NumbersSectionPayload;
    uses: UsesSectionPayload;
    failure_modes: FailureModesSectionPayload;
    checkpoints: CheckpointsSectionPayload;
  };
}

/** Authors' YAML schema for cross-linking. */
export interface ConceptYAML {
  pattern: string; // pattern slug
  concepts: Array<{
    id: string; // concept slug (kebab-case)
    label: string; // display name
    summary: string; // one-sentence elevator pitch
    relatedConcepts?: string[]; // other concept ids
    relatedPatterns?: string[]; // other pattern slugs
    /** Optional: which section(s) introduce this concept. */
    introducedIn?: LessonSectionId[];
  }>;
  /** Explicit "often confused with" targets for the Confused-With panel. */
  confusedWith?: Array<{ patternSlug: string; reason: string }>;
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors. `@types/js-yaml` should be resolvable now.

- [ ] **Step 4: Commit**

```bash
git add architex/package.json architex/pnpm-lock.yaml architex/src/lib/lld/lesson-types.ts
git commit -m "$(cat <<'EOF'
feat(lld): add lesson payload types + install MDX deps

Adds @mdx-js/mdx, @mdx-js/react, gray-matter, remark-gfm, js-yaml.
Defines typed LessonPayload with 8 sections and 4 checkpoint kinds
(recall/apply/compare/create). Every section extends CompiledMDX which
carries the compiled JSX, raw markdown (for AI context), extracted
anchors, referenced concept ids, and referenced class ids.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Write the MDX compile script

**Files:**
- Create: `architex/scripts/compile-lld-lessons.ts`
- Modify: `architex/package.json` (add script entry)

- [ ] **Step 1: Write the compile script**

Create `architex/scripts/compile-lld-lessons.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Compile LLD MDX lessons into JSONB payloads seeded into module_content.
 *
 * Usage:
 *   pnpm compile:lld-lessons                 # compile all lessons
 *   pnpm compile:lld-lessons --slug=singleton  # single pattern
 *
 * Pipeline per lesson:
 *   1. Read content/lld/lessons/<slug>.mdx
 *   2. Parse frontmatter with gray-matter
 *   3. Split the body by `<!-- Section: <id> -->` delimiters (8 sections)
 *   4. Compile each section's MDX body with @mdx-js/mdx
 *   5. Extract anchors + conceptIds + classIds from raw body
 *   6. Upsert module_content row { moduleId: "lld", contentType:
 *      "lesson", slug, content: LessonPayload }
 *
 * Errors are collected and printed at the end — one bad lesson does not
 * abort others (useful when multiple authors push concurrently).
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, basename } from "node:path";
import { compile } from "@mdx-js/mdx";
import matter from "gray-matter";
import remarkGfm from "remark-gfm";
import yaml from "js-yaml";
import { getDb, moduleContent } from "../src/db";
import type {
  LessonPayload,
  LessonSectionId,
  CompiledMDX,
  ConceptYAML,
  CheckpointsSectionPayload,
} from "../src/lib/lld/lesson-types";

const LESSON_DIR = "content/lld/lessons";
const CONCEPT_DIR = "content/lld/concepts";

const SECTION_ORDER: LessonSectionId[] = [
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
];

interface CompileResult {
  slug: string;
  payload: LessonPayload;
}

interface CompileError {
  slug: string;
  message: string;
}

async function compileSection(
  sectionBody: string,
  _sectionId: LessonSectionId,
): Promise<CompiledMDX> {
  const compiled = await compile(sectionBody, {
    outputFormat: "function-body",
    remarkPlugins: [remarkGfm],
    development: false,
  });

  // Extract anchors: all `## Heading` and `### Heading` lines
  const anchors: CompiledMDX["anchors"] = [];
  for (const match of sectionBody.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const depth = match[1].length as 2 | 3;
    const label = match[2].trim();
    const id = slugify(label);
    anchors.push({ id, label, depth });
  }

  // Extract <Concept id="..."> and <Class id="..."> JSX references
  const conceptIds = Array.from(
    sectionBody.matchAll(/<Concept\s+id="([^"]+)"/g),
  ).map((m) => m[1]);
  const classIds = Array.from(
    sectionBody.matchAll(/<Class\s+id="([^"]+)"/g),
  ).map((m) => m[1]);

  return {
    code: String(compiled),
    raw: sectionBody,
    anchors,
    conceptIds: Array.from(new Set(conceptIds)),
    classIds: Array.from(new Set(classIds)),
  };
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Split MDX body by `<!-- Section: <id> -->` delimiters.
 * Returns map of sectionId → body.
 */
function splitIntoSections(
  body: string,
): Partial<Record<LessonSectionId, string>> {
  const sections: Partial<Record<LessonSectionId, string>> = {};
  const regex = /<!--\s*Section:\s*([a-z_]+)\s*-->/g;
  const matches = Array.from(body.matchAll(regex));

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const id = m[1] as LessonSectionId;
    if (!SECTION_ORDER.includes(id)) continue;
    const start = m.index! + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    sections[id] = body.slice(start, end).trim();
  }
  return sections;
}

async function compileLesson(slug: string): Promise<CompileResult> {
  const mdxPath = join(LESSON_DIR, `${slug}.mdx`);
  const rawFile = await readFile(mdxPath, "utf8");
  const { data: frontmatter, content: body } = matter(rawFile);

  const sectionBodies = splitIntoSections(body);

  // Validate all 8 sections present
  for (const id of SECTION_ORDER) {
    if (!sectionBodies[id]) {
      throw new Error(
        `Missing section "${id}" in ${mdxPath}. Add <!-- Section: ${id} --> delimiter.`,
      );
    }
  }

  const compiled = {} as LessonPayload["sections"];
  for (const id of SECTION_ORDER) {
    const base = await compileSection(sectionBodies[id]!, id);
    const fmSection = (frontmatter.sections ?? {})[id] ?? {};
    compiled[id] = { ...base, ...fmSection } as never;
  }

  // Checkpoints are a special case — they come from frontmatter, not MDX body
  if (!frontmatter.checkpoints || !Array.isArray(frontmatter.checkpoints)) {
    throw new Error(
      `${mdxPath}: frontmatter must include a \`checkpoints\` array with exactly 4 entries (recall, apply, compare, create).`,
    );
  }
  const kinds = frontmatter.checkpoints.map((c: { kind: string }) => c.kind);
  const required = ["recall", "apply", "compare", "create"];
  for (const k of required) {
    if (!kinds.includes(k)) {
      throw new Error(
        `${mdxPath}: checkpoints missing "${k}" kind. Found: ${kinds.join(", ")}`,
      );
    }
  }
  (compiled.checkpoints as CheckpointsSectionPayload).checkpoints =
    frontmatter.checkpoints as CheckpointsSectionPayload["checkpoints"];

  const payload: LessonPayload = {
    schemaVersion: 1,
    patternSlug: slug,
    subtitle: frontmatter.subtitle ?? "",
    estimatedMinutes: frontmatter.estimatedMinutes ?? 10,
    conceptIds: frontmatter.conceptIds ?? [],
    sections: compiled,
  };

  return { slug, payload };
}

async function readConceptYaml(slug: string): Promise<ConceptYAML | null> {
  const path = join(CONCEPT_DIR, `${slug}.concepts.yaml`);
  if (!existsSync(path)) return null;
  const raw = await readFile(path, "utf8");
  return yaml.load(raw) as ConceptYAML;
}

async function upsertLesson(result: CompileResult): Promise<void> {
  const db = getDb();
  await db
    .insert(moduleContent)
    .values({
      moduleId: "lld",
      contentType: "lesson",
      slug: result.slug,
      name: result.slug,
      content: result.payload,
      summary: result.payload.subtitle,
      isPublished: true,
    })
    .onConflictDoUpdate({
      target: [moduleContent.moduleId, moduleContent.contentType, moduleContent.slug],
      set: {
        content: result.payload,
        summary: result.payload.subtitle,
        updatedAt: new Date(),
      },
    });
}

async function main() {
  const slugArg = process.argv
    .find((a) => a.startsWith("--slug="))
    ?.split("=")[1];

  let slugs: string[];
  if (slugArg) {
    slugs = [slugArg];
  } else {
    const files = await readdir(LESSON_DIR);
    slugs = files
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => basename(f, ".mdx"));
  }

  const errors: CompileError[] = [];
  let successCount = 0;

  for (const slug of slugs) {
    try {
      const result = await compileLesson(slug);
      await upsertLesson(result);
      // Also validate concept yaml is loadable (not used yet; Task 16 builds graph)
      await readConceptYaml(slug);
      successCount++;
      console.log(`[compile-lld-lessons] ✓ ${slug}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ slug, message: msg });
      console.error(`[compile-lld-lessons] ✗ ${slug}: ${msg}`);
    }
  }

  console.log(
    `\n[compile-lld-lessons] done: ${successCount} ok, ${errors.length} failed`,
  );
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[compile-lld-lessons] fatal:", err);
  process.exit(2);
});
```

- [ ] **Step 2: Register the npm script**

Open `architex/package.json`. Inside the `scripts` block, add:

```json
"compile:lld-lessons": "tsx scripts/compile-lld-lessons.ts",
```

Also ensure `tsx` is already in `devDependencies`. If missing:

```bash
pnpm add -D tsx
```

- [ ] **Step 3: Smoke-test the script (expected: fail gracefully, no MDX files yet)**

```bash
cd architex
mkdir -p content/lld/lessons content/lld/concepts
pnpm compile:lld-lessons
```
Expected: logs `done: 0 ok, 0 failed` (no MDX files in the folder yet). No crash.

- [ ] **Step 4: Smoke-test with a minimal lesson**

Create a throwaway `content/lld/lessons/_sanity.mdx`:

```mdx
---
subtitle: Sanity check
estimatedMinutes: 1
conceptIds: []
checkpoints:
  - kind: recall
    id: r1
    prompt: Pick one.
    options:
      - { id: a, label: "A", isCorrect: true }
      - { id: b, label: "B", isCorrect: false, whyWrong: "not right" }
    explanation: trivial
  - kind: apply
    id: ap1
    scenario: pick the class
    correctClassIds: []
    distractorClassIds: []
    explanation: trivial
  - kind: compare
    id: c1
    prompt: compare
    left: { patternSlug: a, label: A }
    right: { patternSlug: b, label: B }
    statements: []
    explanation: trivial
  - kind: create
    id: cr1
    prompt: design something
    starterCanvas: { classes: [] }
    rubric: []
    referenceSolution: { classes: [] }
    explanation: trivial
---

<!-- Section: itch -->
## The Itch
You have a problem.

<!-- Section: definition -->
## Definition
It is a thing.

<!-- Section: mechanism -->
## Mechanism
Do this first. Then that.

<!-- Section: anatomy -->
## Anatomy
One class.

<!-- Section: numbers -->
## Numbers
Fast.

<!-- Section: uses -->
## Uses
Everywhere.

<!-- Section: failure_modes -->
## Failure Modes
Things break.

<!-- Section: checkpoints -->
## Checkpoints
See frontmatter.
```

Run:
```bash
pnpm compile:lld-lessons --slug=_sanity
```
Expected: `✓ _sanity` and a row in `module_content` with `slug = "_sanity"`, `module_id = "lld"`, `content_type = "lesson"`.

Verify:
```bash
pnpm db:studio
```
Navigate to `module_content`, filter slug = `_sanity`, inspect `content` JSONB — confirm `sections.itch.anchors` includes `{id: "the-itch", label: "The Itch", depth: 2}`.

- [ ] **Step 5: Delete the sanity lesson**

```bash
rm content/lld/lessons/_sanity.mdx
```

Drop the DB row via Drizzle Studio or:
```bash
pnpm db:psql -c "DELETE FROM module_content WHERE module_id = 'lld' AND slug = '_sanity'"
```

- [ ] **Step 6: Commit**

```bash
git add architex/scripts/compile-lld-lessons.ts architex/package.json architex/pnpm-lock.yaml
git commit -m "$(cat <<'EOF'
feat(lld): add MDX lesson compile script

Reads content/lld/lessons/<slug>.mdx, splits body by
<!-- Section: <id> --> delimiters, compiles each section's MDX with
@mdx-js/mdx, extracts anchors/conceptIds/classIds from the raw body,
merges with frontmatter metadata, and upserts into module_content.
Checkpoints (frontmatter-only) are validated for all 4 kinds.

Errors are collected per-lesson so one bad lesson doesn't abort others.
Invoked via `pnpm compile:lld-lessons [--slug=foo]`.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Write the lesson-loader (DB → typed payload)

**Files:**
- Create: `architex/src/lib/lld/lesson-loader.ts`
- Test: `architex/src/lib/lld/__tests__/lesson-loader.test.ts`

- [ ] **Step 1: Write the failing test**

Create `architex/src/lib/lld/__tests__/lesson-loader.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { LessonPayload } from "@/lib/lld/lesson-types";

const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    select: vi.fn(),
  },
}));

vi.mock("@/db", () => ({
  getDb: () => mockDb,
  moduleContent: {
    moduleId: "moduleId",
    contentType: "contentType",
    slug: "slug",
    isPublished: "isPublished",
  },
}));

import { loadLesson, loadLessonSlugs } from "@/lib/lld/lesson-loader";

const samplePayload = (slug: string): LessonPayload => ({
  schemaVersion: 1,
  patternSlug: slug,
  subtitle: "x",
  estimatedMinutes: 1,
  conceptIds: [],
  sections: {} as LessonPayload["sections"],
});

describe("lesson-loader", () => {
  beforeEach(() => {
    mockDb.select.mockReset();
  });

  it("loadLesson returns typed payload for existing slug", async () => {
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ content: samplePayload("singleton") }],
        }),
      }),
    }));
    const payload = await loadLesson("singleton");
    expect(payload).not.toBeNull();
    expect(payload?.patternSlug).toBe("singleton");
    expect(payload?.schemaVersion).toBe(1);
  });

  it("loadLesson returns null for unknown slug", async () => {
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [],
        }),
      }),
    }));
    const payload = await loadLesson("does-not-exist");
    expect(payload).toBeNull();
  });

  it("loadLesson rejects non-LessonPayload content shape", async () => {
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: async () => [{ content: { schemaVersion: 99, bogus: true } }],
        }),
      }),
    }));
    await expect(loadLesson("malformed")).rejects.toThrow(/schemaVersion/);
  });

  it("loadLessonSlugs returns all published lesson slugs", async () => {
    mockDb.select.mockImplementation(() => ({
      from: () => ({
        where: async () => [
          { slug: "singleton" },
          { slug: "factory-method" },
          { slug: "observer" },
        ],
      }),
    }));
    const slugs = await loadLessonSlugs();
    expect(slugs).toEqual(["singleton", "factory-method", "observer"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd architex
pnpm test:run -- lesson-loader
```
Expected: FAIL with `Cannot find module '@/lib/lld/lesson-loader'`.

- [ ] **Step 3: Create the loader**

Create `architex/src/lib/lld/lesson-loader.ts`:

```typescript
/**
 * Read a compiled lesson payload from module_content, type-guard it,
 * and return typed `LessonPayload` (or null for unknown slugs).
 *
 * Callers: TanStack Query + RSC data loaders inside Learn mode.
 */

import { and, eq } from "drizzle-orm";
import { getDb, moduleContent } from "@/db";
import type { LessonPayload } from "./lesson-types";

function isLessonPayload(value: unknown): value is LessonPayload {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.schemaVersion === 1 && typeof v.patternSlug === "string";
}

/**
 * Fetch a single lesson by pattern slug. Returns null if not found.
 * Throws if the stored row does not match LessonPayload v1.
 */
export async function loadLesson(
  patternSlug: string,
): Promise<LessonPayload | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(moduleContent)
    .where(
      and(
        eq(moduleContent.moduleId, "lld"),
        eq(moduleContent.contentType, "lesson"),
        eq(moduleContent.slug, patternSlug),
        eq(moduleContent.isPublished, true),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (!isLessonPayload(row.content)) {
    throw new Error(
      `Lesson content for "${patternSlug}" does not match schemaVersion 1. Re-run \`pnpm compile:lld-lessons --slug=${patternSlug}\`.`,
    );
  }
  return row.content;
}

/** List all published lesson slugs, in catalog order. */
export async function loadLessonSlugs(): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ slug: moduleContent.slug })
    .from(moduleContent)
    .where(
      and(
        eq(moduleContent.moduleId, "lld"),
        eq(moduleContent.contentType, "lesson"),
        eq(moduleContent.isPublished, true),
      ),
    );
  return rows.map((r) => r.slug);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- lesson-loader
```
Expected: PASS · all 4 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/lib/lld/lesson-loader.ts architex/src/lib/lld/__tests__/lesson-loader.test.ts
git commit -m "$(cat <<'EOF'
feat(lld): add lesson-loader for DB → typed LessonPayload

Reads module_content rows and runtime-validates schemaVersion. Throws a
specific error naming the compile command when malformed, so authors see
exactly how to recover.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Create learn-progress API routes

**Files:**
- Create: `architex/src/app/api/lld/learn-progress/route.ts`
- Create: `architex/src/app/api/lld/learn-progress/[patternSlug]/route.ts`

- [ ] **Step 1: Create list route**

Create `architex/src/app/api/lld/learn-progress/route.ts`:

```typescript
/**
 * GET /api/lld/learn-progress
 *
 * Returns an array of the user's LLD learn-progress rows (all patterns
 * with any progress). Used by the Learn sidebar to show per-pattern
 * completion badges without N+1 fetches.
 */

import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getDb, lldLearnProgress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function GET() {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select({
        patternSlug: lldLearnProgress.patternSlug,
        completedSectionCount: lldLearnProgress.completedSectionCount,
        completedAt: lldLearnProgress.completedAt,
        visitCount: lldLearnProgress.visitCount,
        updatedAt: lldLearnProgress.updatedAt,
      })
      .from(lldLearnProgress)
      .where(eq(lldLearnProgress.userId, userId))
      .orderBy(desc(lldLearnProgress.updatedAt))
      .limit(100);

    return NextResponse.json({ progress: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create per-pattern GET+PATCH route**

Create `architex/src/app/api/lld/learn-progress/[patternSlug]/route.ts`:

```typescript
/**
 * GET   /api/lld/learn-progress/[patternSlug]
 * PATCH /api/lld/learn-progress/[patternSlug]
 *
 * GET: return the full progress row for the given pattern (or a default
 * zero-state row if none exists — no 404, fewer error paths in the UI).
 *
 * PATCH body shape:
 *   {
 *     sectionProgress?: Partial<SectionProgressMap>,   // merge, not replace
 *     lastScrollY?: number,
 *     activeSectionId?: LessonSectionId | null,
 *     checkpointStats?: Partial<Record<LessonSectionId, { attempts: number, correct: boolean }>>,
 *     markCompleted?: boolean,   // sets completedAt = now() if true
 *     incrementVisit?: boolean,  // increments visit_count (client calls on mount)
 *   }
 *
 * Always upserts — first PATCH creates the row. All fields optional; only
 * provided fields are merged. Returns the updated row.
 */

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, lldLearnProgress } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_SECTION_IDS = new Set([
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ patternSlug: string }> },
) {
  try {
    const { patternSlug } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(lldLearnProgress)
      .where(
        and(
          eq(lldLearnProgress.userId, userId),
          eq(lldLearnProgress.patternSlug, patternSlug),
        ),
      )
      .limit(1);

    if (row) {
      return NextResponse.json({ progress: row });
    }

    // Zero-state default so UI avoids a null-check branch.
    return NextResponse.json({
      progress: {
        patternSlug,
        sectionProgress: {},
        lastScrollY: 0,
        activeSectionId: null,
        completedSectionCount: 0,
        checkpointStats: {},
        completedAt: null,
        visitCount: 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress/:slug] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

function sanitizeSectionProgress(
  input: unknown,
): Record<string, unknown> | null {
  if (!input || typeof input !== "object") return null;
  const entries = Object.entries(input as Record<string, unknown>);
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of entries) {
    if (!VALID_SECTION_IDS.has(k)) continue;
    if (!v || typeof v !== "object") continue;
    cleaned[k] = v;
  }
  return cleaned;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patternSlug: string }> },
) {
  try {
    const { patternSlug } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      sectionProgress?: unknown;
      lastScrollY?: number;
      activeSectionId?: string | null;
      checkpointStats?: unknown;
      markCompleted?: boolean;
      incrementVisit?: boolean;
    };

    const db = getDb();

    // Load existing row (if any) to compute completedSectionCount.
    const [existing] = await db
      .select()
      .from(lldLearnProgress)
      .where(
        and(
          eq(lldLearnProgress.userId, userId),
          eq(lldLearnProgress.patternSlug, patternSlug),
        ),
      )
      .limit(1);

    // Merge section progress
    const existingSP = (existing?.sectionProgress ?? {}) as Record<
      string,
      { scrollDepth: number; firstSeenAt: number | null; completedAt: number | null }
    >;
    const patchSP = sanitizeSectionProgress(body.sectionProgress) ?? {};
    const mergedSP = { ...existingSP, ...patchSP };
    const completedCount = Object.values(mergedSP).filter(
      (v) => v && typeof v === "object" && "completedAt" in v && v.completedAt !== null,
    ).length;

    const existingStats = (existing?.checkpointStats ?? {}) as Record<
      string,
      unknown
    >;
    const patchStats =
      body.checkpointStats && typeof body.checkpointStats === "object"
        ? (body.checkpointStats as Record<string, unknown>)
        : {};
    const mergedStats = { ...existingStats, ...patchStats };

    const now = new Date();
    const values = {
      userId,
      patternSlug,
      sectionProgress: mergedSP,
      lastScrollY:
        typeof body.lastScrollY === "number"
          ? body.lastScrollY
          : existing?.lastScrollY ?? 0,
      activeSectionId:
        body.activeSectionId === undefined
          ? existing?.activeSectionId ?? null
          : body.activeSectionId,
      completedSectionCount: completedCount,
      checkpointStats: mergedStats,
      completedAt:
        body.markCompleted && !existing?.completedAt
          ? now
          : existing?.completedAt ?? null,
      visitCount:
        (existing?.visitCount ?? 0) + (body.incrementVisit ? 1 : 0),
      updatedAt: now,
    };

    const [updated] = await db
      .insert(lldLearnProgress)
      .values(values)
      .onConflictDoUpdate({
        target: [lldLearnProgress.userId, lldLearnProgress.patternSlug],
        set: {
          sectionProgress: values.sectionProgress,
          lastScrollY: values.lastScrollY,
          activeSectionId: values.activeSectionId,
          completedSectionCount: values.completedSectionCount,
          checkpointStats: values.checkpointStats,
          completedAt: values.completedAt,
          visitCount: sql`${lldLearnProgress.visitCount} + ${body.incrementVisit ? 1 : 0}`,
          updatedAt: values.updatedAt,
        },
      })
      .returning();

    return NextResponse.json({ progress: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/learn-progress/:slug] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd architex
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Smoke-test manually**

With dev server running and signed in:
```bash
curl -X PATCH -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"lastScrollY": 420, "incrementVisit": true}' \
  http://localhost:3000/api/lld/learn-progress/singleton
```
Expected: 200 with `{progress: {...lastScrollY: 420, visitCount: 1...}}`. Second invocation: `visitCount: 2`.

- [ ] **Step 5: Commit**

```bash
git add architex/src/app/api/lld/learn-progress/
git commit -m "$(cat <<'EOF'
feat(api): add LLD learn-progress routes

GET  /api/lld/learn-progress                   — list all user's progress rows
GET  /api/lld/learn-progress/[patternSlug]     — single pattern (zero-state if empty)
PATCH /api/lld/learn-progress/[patternSlug]    — merge-patch with upsert

PATCH merges sectionProgress and checkpointStats maps (not replace),
increments visit_count atomically, sets completed_at on markCompleted.
Zero-state GET avoids 404 branch in the UI.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Create `useLearnProgress` hook

**Files:**
- Create: `architex/src/hooks/useLearnProgress.ts`
- Test: `architex/src/hooks/__tests__/useLearnProgress.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useLearnProgress.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useLearnProgress } from "@/hooks/useLearnProgress";

const wrapper = (qc: QueryClient) =>
  function Wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

describe("useLearnProgress", () => {
  let qc: QueryClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        progress: {
          patternSlug: "singleton",
          sectionProgress: {},
          lastScrollY: 0,
          activeSectionId: null,
          completedSectionCount: 0,
          checkpointStats: {},
          completedAt: null,
          visitCount: 1,
        },
      }),
    });
    global.fetch = fetchSpy as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("fetches progress on mount", async () => {
    const { result } = renderHook(() => useLearnProgress("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.progress).not.toBeNull());
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/lld/learn-progress/singleton",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("patchSectionProgress debounces 1s before POST", async () => {
    const { result } = renderHook(() => useLearnProgress("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.progress).not.toBeNull());
    fetchSpy.mockClear();

    act(() => {
      result.current.patchSectionProgress("itch", { scrollDepth: 0.5 });
    });
    vi.advanceTimersByTime(500);
    expect(fetchSpy).not.toHaveBeenCalled(); // still within debounce

    act(() => {
      result.current.patchSectionProgress("itch", { scrollDepth: 0.8 });
    });
    vi.advanceTimersByTime(1100);
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/lld/learn-progress/singleton",
      expect.objectContaining({ method: "PATCH" }),
    );
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.sectionProgress.itch.scrollDepth).toBe(0.8);
  });

  it("markCompleted fires immediately (no debounce)", async () => {
    const { result } = renderHook(() => useLearnProgress("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.progress).not.toBeNull());
    fetchSpy.mockClear();

    act(() => {
      result.current.markCompleted();
    });
    await Promise.resolve();
    await Promise.resolve();

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/lld/learn-progress/singleton",
      expect.objectContaining({ method: "PATCH" }),
    );
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.markCompleted).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useLearnProgress
```
Expected: FAIL with `Cannot find module '@/hooks/useLearnProgress'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useLearnProgress.ts`:

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LessonSectionId, SectionState } from "@/db";

interface LearnProgressRow {
  patternSlug: string;
  sectionProgress: Partial<Record<LessonSectionId, SectionState>>;
  lastScrollY: number;
  activeSectionId: LessonSectionId | null;
  completedSectionCount: number;
  checkpointStats: Partial<
    Record<LessonSectionId, { attempts: number; correct: boolean }>
  >;
  completedAt: string | null;
  visitCount: number;
}

interface ProgressPatch {
  sectionProgress?: Partial<Record<LessonSectionId, Partial<SectionState>>>;
  lastScrollY?: number;
  activeSectionId?: LessonSectionId | null;
  checkpointStats?: Partial<
    Record<LessonSectionId, { attempts: number; correct: boolean }>
  >;
  markCompleted?: boolean;
  incrementVisit?: boolean;
}

const DEBOUNCE_MS = 1000;

/**
 * Hook that owns the DB round-trip for a single pattern's learn progress.
 *
 * GET: fetched on mount via useQuery (5min stale).
 * PATCH: section/scroll updates debounced 1s; markCompleted fires immediately.
 * Optimistic updates via queryClient.setQueryData so UI reacts without waiting.
 */
export function useLearnProgress(patternSlug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["lld-learn-progress", patternSlug] as const;

  const query = useQuery<{ progress: LearnProgressRow }>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/lld/learn-progress/${patternSlug}`, {
        method: "GET",
      });
      if (!res.ok) {
        throw new Error(`Failed to load progress: ${res.status}`);
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: async (patch: ProgressPatch) => {
      const res = await fetch(`/api/lld/learn-progress/${patternSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        throw new Error(`Failed to patch progress: ${res.status}`);
      }
      return (await res.json()) as { progress: LearnProgressRow };
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
    },
  });

  const pendingPatchRef = useRef<ProgressPatch | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPending = useCallback(() => {
    const pending = pendingPatchRef.current;
    pendingPatchRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pending) mutation.mutate(pending);
  }, [mutation]);

  const scheduleFlush = useCallback(
    (patch: ProgressPatch) => {
      // Merge into pending
      const pending = pendingPatchRef.current ?? {};
      pendingPatchRef.current = {
        ...pending,
        ...patch,
        sectionProgress: {
          ...(pending.sectionProgress ?? {}),
          ...(patch.sectionProgress ?? {}),
        },
        checkpointStats: {
          ...(pending.checkpointStats ?? {}),
          ...(patch.checkpointStats ?? {}),
        },
      };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flushPending, DEBOUNCE_MS);
    },
    [flushPending],
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (pendingPatchRef.current) flushPending();
    };
  }, [flushPending]);

  const patchSectionProgress = useCallback(
    (sectionId: LessonSectionId, state: Partial<SectionState>) => {
      scheduleFlush({ sectionProgress: { [sectionId]: state } });
    },
    [scheduleFlush],
  );

  const patchActiveSection = useCallback(
    (sectionId: LessonSectionId | null) => {
      scheduleFlush({ activeSectionId: sectionId });
    },
    [scheduleFlush],
  );

  const patchScrollY = useCallback(
    (scrollY: number) => {
      scheduleFlush({ lastScrollY: scrollY });
    },
    [scheduleFlush],
  );

  const recordCheckpointAttempt = useCallback(
    (sectionId: LessonSectionId, attempts: number, correct: boolean) => {
      // Checkpoint results are important — flush immediately, bypass debounce.
      if (pendingPatchRef.current) flushPending();
      mutation.mutate({
        checkpointStats: { [sectionId]: { attempts, correct } },
      });
    },
    [flushPending, mutation],
  );

  const markCompleted = useCallback(() => {
    if (pendingPatchRef.current) flushPending();
    mutation.mutate({ markCompleted: true });
  }, [flushPending, mutation]);

  const incrementVisit = useCallback(() => {
    mutation.mutate({ incrementVisit: true });
  }, [mutation]);

  return {
    progress: query.data?.progress ?? null,
    isLoading: query.isLoading,
    patchSectionProgress,
    patchActiveSection,
    patchScrollY,
    recordCheckpointAttempt,
    markCompleted,
    incrementVisit,
    /** For tests + emergency shutdowns. */
    _flushPending: flushPending,
  };
}
```

Note: `LessonSectionId` and `SectionState` are exported from `@/db` via `@/db/schema/lld-learn-progress.ts` → `schema/index.ts` → `@/db` barrel. Confirm your `src/db/index.ts` re-exports these. If not, add:

```typescript
// In src/db/index.ts or src/db/schema/index.ts
export type { LessonSectionId, SectionState } from "./schema/lld-learn-progress";
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- useLearnProgress
```
Expected: PASS · all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useLearnProgress.ts architex/src/hooks/__tests__/useLearnProgress.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add useLearnProgress with debounced writes

Reads progress row via TanStack Query (5min stale). Section/scroll
patches debounced 1s and merged into pending state before flushing.
Checkpoint attempts and markCompleted bypass debounce — they are
important events that shouldn't be lost to a page navigation race.
Flushes any pending patch on unmount.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Create bookmarks API routes

**Files:**
- Create: `architex/src/app/api/lld/bookmarks/route.ts`
- Create: `architex/src/app/api/lld/bookmarks/[id]/route.ts`

- [ ] **Step 1: Create list + create route**

Create `architex/src/app/api/lld/bookmarks/route.ts`:

```typescript
/**
 * GET  /api/lld/bookmarks?patternSlug=...       — list (all or filtered)
 * POST /api/lld/bookmarks                       — create (409 if anchor already bookmarked)
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldBookmarks } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_SECTION_IDS = new Set([
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
]);

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const patternSlug = url.searchParams.get("patternSlug");

    const db = getDb();
    const where = patternSlug
      ? and(
          eq(lldBookmarks.userId, userId),
          eq(lldBookmarks.patternSlug, patternSlug),
        )
      : eq(lldBookmarks.userId, userId);

    const rows = await db
      .select()
      .from(lldBookmarks)
      .where(where)
      .orderBy(desc(lldBookmarks.createdAt))
      .limit(200);

    return NextResponse.json({ bookmarks: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      patternSlug?: string;
      sectionId?: string;
      anchorId?: string;
      anchorLabel?: string;
      note?: string;
    };

    const { patternSlug, sectionId, anchorId, anchorLabel } = body;

    if (!patternSlug || typeof patternSlug !== "string") {
      return NextResponse.json(
        { error: "patternSlug required" },
        { status: 400 },
      );
    }
    if (!sectionId || !VALID_SECTION_IDS.has(sectionId)) {
      return NextResponse.json(
        {
          error: `sectionId must be one of: ${Array.from(VALID_SECTION_IDS).join(", ")}`,
        },
        { status: 400 },
      );
    }
    if (!anchorId || typeof anchorId !== "string") {
      return NextResponse.json(
        { error: "anchorId required" },
        { status: 400 },
      );
    }
    if (!anchorLabel || typeof anchorLabel !== "string") {
      return NextResponse.json(
        { error: "anchorLabel required" },
        { status: 400 },
      );
    }
    if (body.note !== undefined && typeof body.note !== "string") {
      return NextResponse.json(
        { error: "note must be a string if provided" },
        { status: 400 },
      );
    }
    if (body.note && body.note.length > 10_000) {
      return NextResponse.json(
        { error: "note max length is 10000 chars" },
        { status: 400 },
      );
    }

    const db = getDb();
    try {
      const [created] = await db
        .insert(lldBookmarks)
        .values({
          userId,
          patternSlug,
          sectionId,
          anchorId,
          anchorLabel,
          note: body.note ?? null,
        })
        .returning();
      return NextResponse.json({ bookmark: created }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("lld_bookmarks_user_anchor_idx")
      ) {
        return NextResponse.json(
          {
            error: "Bookmark already exists for this anchor.",
            code: "BOOKMARK_EXISTS",
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create PATCH+DELETE route**

Create `architex/src/app/api/lld/bookmarks/[id]/route.ts`:

```typescript
/**
 * PATCH  /api/lld/bookmarks/[id]    — update note only
 * DELETE /api/lld/bookmarks/[id]    — hard delete
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldBookmarks } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { note?: string };
    if (body.note !== undefined && typeof body.note !== "string") {
      return NextResponse.json(
        { error: "note must be a string" },
        { status: 400 },
      );
    }
    if (body.note && body.note.length > 10_000) {
      return NextResponse.json(
        { error: "note max length is 10000 chars" },
        { status: 400 },
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(lldBookmarks)
      .set({ note: body.note ?? null, updatedAt: new Date() })
      .where(
        and(eq(lldBookmarks.id, id), eq(lldBookmarks.userId, userId)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    return NextResponse.json({ bookmark: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const [deleted] = await db
      .delete(lldBookmarks)
      .where(
        and(eq(lldBookmarks.id, id), eq(lldBookmarks.userId, userId)),
      )
      .returning({ id: lldBookmarks.id });

    if (!deleted) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/bookmarks/:id] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add architex/src/app/api/lld/bookmarks/
git commit -m "$(cat <<'EOF'
feat(api): add LLD bookmarks routes

GET    /api/lld/bookmarks?patternSlug=...   — list (optional filter)
POST   /api/lld/bookmarks                   — create (409 on duplicate anchor)
PATCH  /api/lld/bookmarks/:id               — update note
DELETE /api/lld/bookmarks/:id               — hard delete

Scoped to authenticated user on every route. Max note length 10_000.
Duplicate anchor returns code: "BOOKMARK_EXISTS" for UI toggle path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Create `useBookmarks` hook

**Files:**
- Create: `architex/src/hooks/useBookmarks.ts`
- Test: `architex/src/hooks/__tests__/useBookmarks.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useBookmarks.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";

const wrapper = (qc: QueryClient) =>
  function Wrap({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

describe("useBookmarks", () => {
  let qc: QueryClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("fetches bookmarks scoped to patternSlug", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bookmarks: [
          {
            id: "b1",
            patternSlug: "singleton",
            sectionId: "itch",
            anchorId: "the-itch",
            anchorLabel: "The Itch",
            note: null,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
    const { result } = renderHook(() => useBookmarks("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.bookmarks).toHaveLength(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lld/bookmarks?patternSlug=singleton",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("toggle creates when not bookmarked", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ bookmarks: [] }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bookmark: {
          id: "b2",
          patternSlug: "singleton",
          sectionId: "definition",
          anchorId: "precise-def",
          anchorLabel: "Precise Definition",
        },
      }),
    });

    const { result } = renderHook(() => useBookmarks("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.bookmarks).toHaveLength(0));

    await act(async () => {
      await result.current.toggle({
        sectionId: "definition",
        anchorId: "precise-def",
        anchorLabel: "Precise Definition",
      });
    });

    expect(fetchMock.mock.calls[1][0]).toBe("/api/lld/bookmarks");
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(init.method).toBe("POST");
  });

  it("toggle deletes when already bookmarked", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        bookmarks: [
          {
            id: "b3",
            patternSlug: "singleton",
            sectionId: "itch",
            anchorId: "the-itch",
            anchorLabel: "The Itch",
            note: null,
            createdAt: new Date().toISOString(),
          },
        ],
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, id: "b3" }),
    });

    const { result } = renderHook(() => useBookmarks("singleton"), {
      wrapper: wrapper(qc),
    });
    await waitFor(() => expect(result.current.bookmarks).toHaveLength(1));

    await act(async () => {
      await result.current.toggle({
        sectionId: "itch",
        anchorId: "the-itch",
        anchorLabel: "The Itch",
      });
    });

    expect(fetchMock.mock.calls[1][0]).toBe("/api/lld/bookmarks/b3");
    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(init.method).toBe("DELETE");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useBookmarks
```
Expected: FAIL with `Cannot find module '@/hooks/useBookmarks'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useBookmarks.ts`:

```typescript
"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface Bookmark {
  id: string;
  patternSlug: string;
  sectionId: string;
  anchorId: string;
  anchorLabel: string;
  note: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface ToggleArgs {
  sectionId: string;
  anchorId: string;
  anchorLabel: string;
}

/**
 * Read + mutate bookmarks for a given pattern. Exposes a `toggle` helper
 * that creates-or-deletes based on whether an anchor is already bookmarked.
 *
 * `null` patternSlug = global (all bookmarks) — used by the Dashboard
 * later. For Learn mode always pass the current pattern slug.
 */
export function useBookmarks(patternSlug: string | null) {
  const queryClient = useQueryClient();
  const queryKey = patternSlug
    ? (["lld-bookmarks", patternSlug] as const)
    : (["lld-bookmarks", "all"] as const);

  const query = useQuery<{ bookmarks: Bookmark[] }>({
    queryKey,
    queryFn: async () => {
      const url = patternSlug
        ? `/api/lld/bookmarks?patternSlug=${encodeURIComponent(patternSlug)}`
        : "/api/lld/bookmarks";
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load bookmarks: ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: async (args: ToggleArgs) => {
      if (!patternSlug) throw new Error("Cannot create bookmark without patternSlug");
      const res = await fetch("/api/lld/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patternSlug, ...args }),
      });
      if (!res.ok) throw new Error(`Failed to create bookmark: ${res.status}`);
      return (await res.json()) as { bookmark: Bookmark };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/lld/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete bookmark: ${res.status}`);
      return (await res.json()) as { ok: true; id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await fetch(`/api/lld/bookmarks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error(`Failed to update bookmark: ${res.status}`);
      return (await res.json()) as { bookmark: Bookmark };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const toggle = useCallback(
    async (args: ToggleArgs) => {
      const bookmarks = query.data?.bookmarks ?? [];
      const existing = bookmarks.find(
        (b) =>
          b.patternSlug === patternSlug &&
          b.sectionId === args.sectionId &&
          b.anchorId === args.anchorId,
      );
      if (existing) {
        await deleteMutation.mutateAsync(existing.id);
        return { action: "deleted" as const, id: existing.id };
      }
      const result = await createMutation.mutateAsync(args);
      return { action: "created" as const, id: result.bookmark.id };
    },
    [query.data, patternSlug, createMutation, deleteMutation],
  );

  const isBookmarked = useCallback(
    (sectionId: string, anchorId: string): boolean => {
      const bookmarks = query.data?.bookmarks ?? [];
      return bookmarks.some(
        (b) =>
          b.patternSlug === patternSlug &&
          b.sectionId === sectionId &&
          b.anchorId === anchorId,
      );
    },
    [query.data, patternSlug],
  );

  return {
    bookmarks: query.data?.bookmarks ?? [],
    isLoading: query.isLoading,
    toggle,
    isBookmarked,
    updateNote: (id: string, note: string) =>
      updateNoteMutation.mutateAsync({ id, note }),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- useBookmarks
```
Expected: PASS · all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useBookmarks.ts architex/src/hooks/__tests__/useBookmarks.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add useBookmarks with toggle + isBookmarked

toggle() inspects current bookmarks to decide create-vs-delete —
consumers get one binary action per anchor. isBookmarked() is a
pure lookup for rendering the filled/empty bookmark icon.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Create `POST /api/lld/concept-reads` route

**Files:**
- Create: `architex/src/app/api/lld/concept-reads/route.ts`

- [ ] **Step 1: Create the route**

Create `architex/src/app/api/lld/concept-reads/route.ts`:

```typescript
/**
 * POST /api/lld/concept-reads
 *
 * Logs a concept view — append-only. Client calls this when a section
 * containing a concept reference enters the viewport for ≥2s.
 *
 * Body: { conceptId, patternSlug, sectionId }
 *
 * Rate limit: max 1 POST per (user, concept, pattern, section) per 30s
 * to avoid double-counting on fast scroll. Enforced in memory via a
 * simple in-process Map — acceptable because single-region dev + small
 * write volume. Production swap to Redis if needed.
 *
 * GET is not exposed — consumers read via FSRS progress boosting or
 * server-side queries.
 */

import { NextResponse } from "next/server";
import { getDb, lldConceptReads } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const RECENT_WINDOW_MS = 30 * 1000;
const recentWrites = new Map<string, number>();

function keyFor(
  userId: string,
  conceptId: string,
  patternSlug: string,
  sectionId: string,
): string {
  return `${userId}:${conceptId}:${patternSlug}:${sectionId}`;
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      conceptId?: string;
      patternSlug?: string;
      sectionId?: string;
    };

    const { conceptId, patternSlug, sectionId } = body;
    if (!conceptId || typeof conceptId !== "string") {
      return NextResponse.json(
        { error: "conceptId required" },
        { status: 400 },
      );
    }
    if (!patternSlug || typeof patternSlug !== "string") {
      return NextResponse.json(
        { error: "patternSlug required" },
        { status: 400 },
      );
    }
    if (!sectionId || typeof sectionId !== "string") {
      return NextResponse.json(
        { error: "sectionId required" },
        { status: 400 },
      );
    }

    // Rate limit in-process
    const k = keyFor(userId, conceptId, patternSlug, sectionId);
    const last = recentWrites.get(k);
    if (last && Date.now() - last < RECENT_WINDOW_MS) {
      return NextResponse.json({ ok: true, rateLimited: true });
    }
    recentWrites.set(k, Date.now());

    // Cheap GC — keep the map bounded
    if (recentWrites.size > 10_000) {
      const cutoff = Date.now() - RECENT_WINDOW_MS;
      for (const [key, t] of recentWrites) {
        if (t < cutoff) recentWrites.delete(key);
      }
    }

    const db = getDb();
    await db.insert(lldConceptReads).values({
      userId,
      conceptId,
      patternSlug,
      sectionId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/concept-reads] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/app/api/lld/concept-reads/
git commit -m "$(cat <<'EOF'
feat(api): add POST /api/lld/concept-reads

Append-only concept-view log with 30s in-memory rate limit per
(user, concept, pattern, section). Returns rateLimited:true (not a
4xx) so clients don't need to distinguish noisy vs actionable failures.
In-process Map is OK for single-region dev; production can swap to
Redis if write volume warrants.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Create `useLessonScrollSync` hook

**Files:**
- Create: `architex/src/hooks/useLessonScrollSync.ts`
- Test: `architex/src/hooks/__tests__/useLessonScrollSync.test.tsx`

Scroll-sync observes the lesson column, computes which section is in view, which classes are referenced by that section, and emits callbacks so `LearnModeLayout` can (a) highlight those classes on the canvas, (b) call `patchActiveSection` + `patchSectionProgress` on the progress hook, (c) fire `lldLessonSectionViewed` analytics.

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useLessonScrollSync.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useRef } from "react";
import { useLessonScrollSync } from "@/hooks/useLessonScrollSync";
import type { LessonPayload } from "@/lib/lld/lesson-types";

function fakePayload(): LessonPayload {
  const emptyMDX = { code: "", raw: "", anchors: [], conceptIds: [], classIds: [] };
  const classIds = (...ids: string[]) => ({ ...emptyMDX, classIds: ids });
  return {
    schemaVersion: 1,
    patternSlug: "singleton",
    subtitle: "x",
    estimatedMinutes: 5,
    conceptIds: [],
    sections: {
      itch: { ...emptyMDX, scenario: "s", keywords: [] },
      definition: { ...emptyMDX, oneLiner: "o", canonicalSource: "c" },
      mechanism: { ...classIds("SingletonClass"), steps: [] },
      anatomy: { ...classIds("SingletonClass"), classes: [] },
      numbers: { ...emptyMDX, headline: [] },
      uses: { ...emptyMDX, cases: [] },
      failure_modes: { ...emptyMDX, modes: [] },
      checkpoints: { ...emptyMDX, checkpoints: [] as never },
    },
  };
}

const observeCallbacks: Array<(entries: IntersectionObserverEntry[]) => void> = [];
class FakeIO {
  constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
    observeCallbacks.push(cb);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}

function Harness({
  onActive,
  onHighlight,
}: {
  onActive: (id: string | null) => void;
  onHighlight: (ids: string[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useLessonScrollSync({
    containerRef,
    payload: fakePayload(),
    onActiveSectionChange: onActive,
    onHighlightedClassesChange: onHighlight,
  });
  return (
    <div ref={containerRef}>
      <section data-section-id="itch">itch</section>
      <section data-section-id="mechanism">mechanism</section>
      <section data-section-id="anatomy">anatomy</section>
    </div>
  );
}

describe("useLessonScrollSync", () => {
  beforeEach(() => {
    observeCallbacks.length = 0;
    globalThis.IntersectionObserver = FakeIO as unknown as typeof IntersectionObserver;
  });

  it("calls onActiveSectionChange with the most visible section", () => {
    const onActive = vi.fn();
    const onHighlight = vi.fn();
    render(<Harness onActive={onActive} onHighlight={onHighlight} />);

    const mechanism = screen.getByText("mechanism");
    const entry = {
      target: mechanism,
      isIntersecting: true,
      intersectionRatio: 0.9,
    } as unknown as IntersectionObserverEntry;

    act(() => {
      observeCallbacks[0]([entry]);
    });
    expect(onActive).toHaveBeenCalledWith("mechanism");
    expect(onHighlight).toHaveBeenCalledWith(["SingletonClass"]);
  });

  it("emits empty highlight when no classIds in active section", () => {
    const onActive = vi.fn();
    const onHighlight = vi.fn();
    render(<Harness onActive={onActive} onHighlight={onHighlight} />);
    const itch = screen.getByText("itch");
    const entry = {
      target: itch,
      isIntersecting: true,
      intersectionRatio: 0.8,
    } as unknown as IntersectionObserverEntry;
    act(() => {
      observeCallbacks[0]([entry]);
    });
    expect(onActive).toHaveBeenCalledWith("itch");
    expect(onHighlight).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- useLessonScrollSync
```
Expected: FAIL — module missing.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useLessonScrollSync.ts`:

```typescript
"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { LessonPayload, LessonSectionId } from "@/lib/lld/lesson-types";

const SECTION_IDS: LessonSectionId[] = [
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
];

interface Options {
  /** Ref to the scrollable lesson container. */
  containerRef: RefObject<HTMLElement | null>;
  /** Compiled lesson payload. */
  payload: LessonPayload | null;
  /** Fires when the most-visible section changes. */
  onActiveSectionChange?: (id: LessonSectionId | null) => void;
  /** Fires with the set of class ids the active section references. */
  onHighlightedClassesChange?: (classIds: string[]) => void;
  /** Fires with per-section scroll depth (0..1) on every update. */
  onSectionProgress?: (
    id: LessonSectionId,
    state: { scrollDepth: number; firstSeenAt: number; completedAt: number | null },
  ) => void;
}

/**
 * Observes the 8 lesson sections and emits (a) which is currently active
 * (biggest intersection ratio), (b) which classes that section references
 * (for canvas highlighting), and (c) per-section scroll depth.
 *
 * Each `<section data-section-id="itch|…|checkpoints">` inside the
 * container is observed. Thresholds of 0, 0.25, 0.5, 0.75, 0.95 give us
 * enough granularity for scroll-depth without paying for 100 thresholds.
 */
export function useLessonScrollSync({
  containerRef,
  payload,
  onActiveSectionChange,
  onHighlightedClassesChange,
  onSectionProgress,
}: Options): void {
  const activeRef = useRef<LessonSectionId | null>(null);
  const highlightRef = useRef<string>("");
  const seenRef = useRef<Set<LessonSectionId>>(new Set());
  const depthRef = useRef<Record<LessonSectionId, number>>(
    Object.fromEntries(SECTION_IDS.map((id) => [id, 0])) as Record<
      LessonSectionId,
      number
    >,
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !payload) return;

    const sections = Array.from(
      container.querySelectorAll<HTMLElement>("[data-section-id]"),
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Update per-section depth based on this batch
        for (const entry of entries) {
          const id = entry.target.getAttribute(
            "data-section-id",
          ) as LessonSectionId | null;
          if (!id || !SECTION_IDS.includes(id)) continue;

          const ratio = entry.intersectionRatio;
          if (ratio > depthRef.current[id]) {
            depthRef.current[id] = ratio;
            const now = Date.now();
            if (!seenRef.current.has(id)) {
              seenRef.current.add(id);
            }
            onSectionProgress?.(id, {
              scrollDepth: ratio,
              firstSeenAt: now,
              completedAt: ratio >= 0.95 ? now : null,
            });
          }
        }

        // Pick the most visible section among intersecting
        let best: { id: LessonSectionId | null; ratio: number } = {
          id: null,
          ratio: 0,
        };
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = entry.target.getAttribute(
            "data-section-id",
          ) as LessonSectionId | null;
          if (!id || !SECTION_IDS.includes(id)) continue;
          if (entry.intersectionRatio > best.ratio) {
            best = { id, ratio: entry.intersectionRatio };
          }
        }

        if (best.id && best.id !== activeRef.current) {
          activeRef.current = best.id;
          onActiveSectionChange?.(best.id);

          const classIds = payload.sections[best.id].classIds;
          const key = classIds.join("|");
          if (key !== highlightRef.current) {
            highlightRef.current = key;
            onHighlightedClassesChange?.(classIds);
          }
        }
      },
      {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 0.95],
      },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [
    containerRef,
    payload,
    onActiveSectionChange,
    onHighlightedClassesChange,
    onSectionProgress,
  ]);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test:run -- useLessonScrollSync
```
Expected: PASS · 2 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useLessonScrollSync.ts architex/src/hooks/__tests__/useLessonScrollSync.test.tsx
git commit -m "$(cat <<'EOF'
feat(hooks): add useLessonScrollSync for section visibility + class highlight

Observes [data-section-id] nodes with 5 thresholds, tracks monotonic
deepest-scroll per section, emits (active section id, highlighted class
ids, per-section progress) via callbacks. Callers compose: canvas prop,
progress hook, analytics.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Build 8 section components + `LessonColumn`

**Files:**
- Create: `architex/src/components/modules/lld/learn/sections/ItchSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/DefinitionSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/MechanismSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/AnatomySection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/NumbersSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/UsesSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/FailureModesSection.tsx`
- Create: `architex/src/components/modules/lld/learn/sections/CheckpointSection.tsx`
- Create: `architex/src/components/modules/lld/learn/LessonColumn.tsx`

Every section component receives `{ payload, patternSlug, onBookmarkToggle, isBookmarked }` and renders in the same `<section data-section-id="...">` shape (required for scroll-sync). MDX `code` is rendered via the shared `useMDXComponent` client helper.

- [ ] **Step 1: Create a shared MDX renderer helper**

Create `architex/src/components/modules/lld/learn/MDXRenderer.tsx`:

```tsx
"use client";

import { useMemo } from "react";
import * as runtime from "react/jsx-runtime";
import { run } from "@mdx-js/mdx";
import { MDXProvider } from "@mdx-js/react";

/**
 * Renders MDX compiled to function-body (see compile-lld-lessons.ts).
 * The `code` string is executed once and cached via useMemo.
 *
 * `components` prop lets callers override built-in tags — used here to
 * inject <Class>, <Concept>, and <Callout> components for cross-linking.
 */
export function MDXRenderer({
  code,
  components,
}: {
  code: string;
  components?: Record<string, React.ComponentType<Record<string, unknown>>>;
}) {
  const MDX = useMemo(() => {
    // `run` is async; we execute synchronously by wrapping.
    // For production use, move to build-time pre-evaluation.
    try {
      // @ts-expect-error - runtime import shape
      const mod = run(code, runtime);
      return mod.default as React.ComponentType;
    } catch (err) {
      console.error("[MDXRenderer] compile failed:", err);
      return () => <div>Content failed to render.</div>;
    }
  }, [code]);
  return (
    <MDXProvider components={components ?? {}}>
      <MDX />
    </MDXProvider>
  );
}
```

Note: `@mdx-js/mdx.run` is documented as async in some versions. If your installed version returns a Promise, wrap via `React.use(promise)` (React 19). Check the build output — if `MDX` is `undefined`, switch to the async path below:

```tsx
import { use } from "react";
const MDX = use(useMemo(() => run(code, runtime).then((m) => m.default as React.ComponentType), [code]));
```

- [ ] **Step 2: Create `ItchSection`**

Create `architex/src/components/modules/lld/learn/sections/ItchSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { ItchSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon } from "lucide-react";

interface Props {
  payload: ItchSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const ItchSection = memo(function ItchSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  const rootAnchor = "the-itch";
  return (
    <section
      data-section-id="itch"
      id="section-itch"
      aria-labelledby={`${rootAnchor}-heading`}
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-foreground-muted">
            1 · The Itch
          </span>
        </div>
        <button
          onClick={() => onBookmarkToggle(rootAnchor, "The Itch")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked(rootAnchor)}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked(rootAnchor) ? "currentColor" : "none"}
          />
        </button>
      </div>

      <h2
        id={`${rootAnchor}-heading`}
        className="text-editorial-display font-serif text-foreground"
      >
        {payload.scenario}
      </h2>

      <div className="prose prose-invert prose-sm max-w-none mt-4 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 3: Create `DefinitionSection`**

Create `architex/src/components/modules/lld/learn/sections/DefinitionSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { DefinitionSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon } from "lucide-react";

interface Props {
  payload: DefinitionSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const DefinitionSection = memo(function DefinitionSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  const rootAnchor = "definition";
  return (
    <section
      data-section-id="definition"
      id="section-definition"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          2 · Definition
        </span>
        <button
          onClick={() => onBookmarkToggle(rootAnchor, "Definition")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked(rootAnchor)}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked(rootAnchor) ? "currentColor" : "none"}
          />
        </button>
      </div>

      <blockquote className="border-l-4 border-primary/60 pl-4 italic font-serif text-lg leading-relaxed text-foreground">
        {payload.oneLiner}
      </blockquote>
      <p className="text-xs text-foreground-muted mt-2 font-mono">
        — {payload.canonicalSource}
      </p>

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 4: Create `MechanismSection`**

Create `architex/src/components/modules/lld/learn/sections/MechanismSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { MechanismSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon } from "lucide-react";

interface Props {
  payload: MechanismSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const MechanismSection = memo(function MechanismSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  return (
    <section
      data-section-id="mechanism"
      id="section-mechanism"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          3 · Mechanism
        </span>
        <button
          onClick={() => onBookmarkToggle("mechanism", "Mechanism")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked("mechanism")}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked("mechanism") ? "currentColor" : "none"}
          />
        </button>
      </div>

      {payload.steps.length > 0 && (
        <ol className="space-y-3 mt-4">
          {payload.steps.map((step) => (
            <li
              key={step.index}
              className="flex items-start gap-3 rounded-lg border border-border/20 bg-elevated/30 p-3"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-mono font-medium text-primary">
                {step.index}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">
                  {step.title}
                </div>
                <p className="text-xs text-foreground-muted mt-1 font-serif leading-relaxed">
                  {step.markdown}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 5: Create `AnatomySection`**

Create `architex/src/components/modules/lld/learn/sections/AnatomySection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { AnatomySectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon } from "lucide-react";

interface Props {
  payload: AnatomySectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const AnatomySection = memo(function AnatomySection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  return (
    <section
      data-section-id="anatomy"
      id="section-anatomy"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          4 · Anatomy
        </span>
        <button
          onClick={() => onBookmarkToggle("anatomy", "Anatomy")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked("anatomy")}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked("anatomy") ? "currentColor" : "none"}
          />
        </button>
      </div>

      {payload.classes.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mt-4">
          {payload.classes.map((c) => (
            <div
              key={c.classId}
              className="rounded-lg border border-border/20 bg-elevated/30 p-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm font-semibold text-foreground">
                  {c.classId}
                </div>
                <div className="text-xs uppercase tracking-wide text-primary">
                  {c.role}
                </div>
              </div>
              <p className="text-xs text-foreground-muted mt-1.5 font-serif">
                {c.responsibility}
              </p>
              {c.keyMethod && (
                <code className="text-[11px] text-foreground-muted mt-1 block font-mono">
                  key method · {c.keyMethod}
                </code>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 6: Create `NumbersSection`**

Create `architex/src/components/modules/lld/learn/sections/NumbersSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { NumbersSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon } from "lucide-react";

interface Props {
  payload: NumbersSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const NumbersSection = memo(function NumbersSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  return (
    <section
      data-section-id="numbers"
      id="section-numbers"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          5 · Numbers
        </span>
        <button
          onClick={() => onBookmarkToggle("numbers", "Numbers")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked("numbers")}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked("numbers") ? "currentColor" : "none"}
          />
        </button>
      </div>

      {payload.headline.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4">
          {payload.headline.map((h) => (
            <div
              key={h.label}
              className="rounded-lg border border-border/20 bg-gradient-to-br from-primary/5 to-transparent p-3"
            >
              <div className="text-xs text-foreground-muted uppercase tracking-wider">
                {h.label}
              </div>
              <div className="text-2xl font-mono font-semibold text-foreground mt-1">
                {h.value}
                {h.unit && (
                  <span className="text-xs text-foreground-muted ml-1">
                    {h.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 7: Create `UsesSection`**

Create `architex/src/components/modules/lld/learn/sections/UsesSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { UsesSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { BookmarkIcon, ExternalLink } from "lucide-react";

interface Props {
  payload: UsesSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

export const UsesSection = memo(function UsesSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  return (
    <section
      data-section-id="uses"
      id="section-uses"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          6 · Uses
        </span>
        <button
          onClick={() => onBookmarkToggle("uses", "Uses")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked("uses")}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked("uses") ? "currentColor" : "none"}
          />
        </button>
      </div>

      {payload.cases.length > 0 && (
        <div className="space-y-2 mt-4">
          {payload.cases.map((c) => (
            <div
              key={`${c.company}-${c.system}`}
              className="rounded-lg border border-border/20 bg-elevated/30 p-3"
            >
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span>{c.company}</span>
                <span className="text-foreground-muted">·</span>
                <span className="font-mono text-xs text-foreground-muted">
                  {c.system}
                </span>
                {c.sourceUrl && (
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-foreground-muted hover:text-primary"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-xs text-foreground-muted mt-1 font-serif leading-relaxed">
                {c.whyThisPattern}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 8: Create `FailureModesSection`**

Create `architex/src/components/modules/lld/learn/sections/FailureModesSection.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { FailureModesSectionPayload } from "@/lib/lld/lesson-types";
import { MDXRenderer } from "../MDXRenderer";
import { AlertTriangle, BookmarkIcon } from "lucide-react";

interface Props {
  payload: FailureModesSectionPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (anchorId: string, anchorLabel: string) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

const severityColor = {
  low: "border-yellow-500/30 bg-yellow-500/5 text-yellow-200",
  medium: "border-orange-500/30 bg-orange-500/5 text-orange-200",
  high: "border-red-500/30 bg-red-500/5 text-red-200",
} as const;

export const FailureModesSection = memo(function FailureModesSection({
  payload,
  isBookmarked,
  onBookmarkToggle,
  mdxComponents,
}: Props) {
  return (
    <section
      data-section-id="failure_modes"
      id="section-failure_modes"
      className="px-6 py-10 border-b border-border/20"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          7 · Failure Modes
        </span>
        <button
          onClick={() => onBookmarkToggle("failure_modes", "Failure Modes")}
          aria-label="Toggle bookmark"
          aria-pressed={isBookmarked("failure_modes")}
          className="text-foreground-muted hover:text-foreground transition-colors"
        >
          <BookmarkIcon
            className="h-4 w-4"
            fill={isBookmarked("failure_modes") ? "currentColor" : "none"}
          />
        </button>
      </div>

      {payload.modes.length > 0 && (
        <div className="space-y-2 mt-4">
          {payload.modes.map((m) => (
            <div
              key={m.title}
              className={`rounded-lg border p-3 ${severityColor[m.severity]}`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{m.title}</span>
              </div>
              <p className="text-xs mt-1 font-serif leading-relaxed opacity-90">
                <strong>What goes wrong:</strong> {m.whatGoesWrong}
              </p>
              <p className="text-xs mt-1 font-serif leading-relaxed opacity-90">
                <strong>How to avoid:</strong> {m.howToAvoid}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="prose prose-invert prose-sm max-w-none mt-6 font-serif leading-relaxed">
        <MDXRenderer code={payload.code} components={mdxComponents} />
      </div>
    </section>
  );
});
```

- [ ] **Step 9: Create `CheckpointSection` (container for 4 checkpoint components — implemented in Task 18)**

Create `architex/src/components/modules/lld/learn/sections/CheckpointSection.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import type { CheckpointsSectionPayload } from "@/lib/lld/lesson-types";
import { RecallCheckpoint } from "../checkpoints/RecallCheckpoint";
import { ApplyCheckpoint } from "../checkpoints/ApplyCheckpoint";
import { CompareCheckpoint } from "../checkpoints/CompareCheckpoint";
import { CreateCheckpoint } from "../checkpoints/CreateCheckpoint";

interface Props {
  payload: CheckpointsSectionPayload;
  patternSlug: string;
  onCheckpointResult: (
    kind: "recall" | "apply" | "compare" | "create",
    attempts: number,
    correct: boolean,
  ) => void;
}

export const CheckpointSection = memo(function CheckpointSection({
  payload,
  patternSlug,
  onCheckpointResult,
}: Props) {
  const [step, setStep] = useState(0);
  const checkpoints = payload.checkpoints;

  const next = () => setStep((s) => Math.min(s + 1, checkpoints.length - 1));

  const current = checkpoints[step];

  return (
    <section
      data-section-id="checkpoints"
      id="section-checkpoints"
      className="px-6 py-10"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-foreground-muted">
          8 · Checkpoints · {step + 1} / {checkpoints.length}
        </span>
        <div className="flex gap-1">
          {checkpoints.map((cp, i) => (
            <span
              key={cp.id}
              className={`h-1 w-6 rounded-full ${
                i <= step ? "bg-primary" : "bg-border/40"
              }`}
            />
          ))}
        </div>
      </div>

      {current.kind === "recall" && (
        <RecallCheckpoint
          checkpoint={current}
          onResult={(attempts, correct) => {
            onCheckpointResult("recall", attempts, correct);
            next();
          }}
        />
      )}
      {current.kind === "apply" && (
        <ApplyCheckpoint
          checkpoint={current}
          patternSlug={patternSlug}
          onResult={(attempts, correct) => {
            onCheckpointResult("apply", attempts, correct);
            next();
          }}
        />
      )}
      {current.kind === "compare" && (
        <CompareCheckpoint
          checkpoint={current}
          onResult={(attempts, correct) => {
            onCheckpointResult("compare", attempts, correct);
            next();
          }}
        />
      )}
      {current.kind === "create" && (
        <CreateCheckpoint
          checkpoint={current}
          patternSlug={patternSlug}
          onResult={(attempts, correct) => {
            onCheckpointResult("create", attempts, correct);
          }}
        />
      )}
    </section>
  );
});
```

- [ ] **Step 10: Create `LessonColumn` — composes the 8 sections**

Create `architex/src/components/modules/lld/learn/LessonColumn.tsx`:

```tsx
"use client";

import { forwardRef, type ForwardedRef } from "react";
import type { LessonPayload } from "@/lib/lld/lesson-types";
import { ItchSection } from "./sections/ItchSection";
import { DefinitionSection } from "./sections/DefinitionSection";
import { MechanismSection } from "./sections/MechanismSection";
import { AnatomySection } from "./sections/AnatomySection";
import { NumbersSection } from "./sections/NumbersSection";
import { UsesSection } from "./sections/UsesSection";
import { FailureModesSection } from "./sections/FailureModesSection";
import { CheckpointSection } from "./sections/CheckpointSection";

interface Props {
  payload: LessonPayload;
  isBookmarked: (anchorId: string) => boolean;
  onBookmarkToggle: (
    sectionId: string,
    anchorId: string,
    anchorLabel: string,
  ) => void;
  onCheckpointResult: (
    kind: "recall" | "apply" | "compare" | "create",
    attempts: number,
    correct: boolean,
  ) => void;
  mdxComponents?: Record<string, React.ComponentType<Record<string, unknown>>>;
}

function LessonColumnImpl(
  {
    payload,
    isBookmarked,
    onBookmarkToggle,
    onCheckpointResult,
    mdxComponents,
  }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const bk = (section: string) => (anchorId: string, anchorLabel: string) =>
    onBookmarkToggle(section, anchorId, anchorLabel);

  return (
    <div
      ref={ref}
      className="h-full overflow-y-auto scroll-smooth"
      data-lesson-column
    >
      <ItchSection
        payload={payload.sections.itch}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("itch")}
        mdxComponents={mdxComponents}
      />
      <DefinitionSection
        payload={payload.sections.definition}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("definition")}
        mdxComponents={mdxComponents}
      />
      <MechanismSection
        payload={payload.sections.mechanism}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("mechanism")}
        mdxComponents={mdxComponents}
      />
      <AnatomySection
        payload={payload.sections.anatomy}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("anatomy")}
        mdxComponents={mdxComponents}
      />
      <NumbersSection
        payload={payload.sections.numbers}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("numbers")}
        mdxComponents={mdxComponents}
      />
      <UsesSection
        payload={payload.sections.uses}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("uses")}
        mdxComponents={mdxComponents}
      />
      <FailureModesSection
        payload={payload.sections.failure_modes}
        isBookmarked={isBookmarked}
        onBookmarkToggle={bk("failure_modes")}
        mdxComponents={mdxComponents}
      />
      <CheckpointSection
        payload={payload.sections.checkpoints}
        patternSlug={payload.patternSlug}
        onCheckpointResult={onCheckpointResult}
      />
    </div>
  );
}

export const LessonColumn = forwardRef<HTMLDivElement, Props>(LessonColumnImpl);
```

- [ ] **Step 11: Verify typecheck (expected: 4 errors for missing checkpoint components)**

```bash
pnpm typecheck
```
Expected: errors for `RecallCheckpoint`, `ApplyCheckpoint`, `CompareCheckpoint`, `CreateCheckpoint` not found. These are created in Task 18. To unblock typecheck meanwhile, create empty placeholder files:

```bash
mkdir -p architex/src/components/modules/lld/learn/checkpoints
for kind in Recall Apply Compare Create; do
cat > "architex/src/components/modules/lld/learn/checkpoints/${kind}Checkpoint.tsx" <<EOF
"use client";
import { memo } from "react";

export const ${kind}Checkpoint = memo(function ${kind}Checkpoint(_: {
  checkpoint: unknown;
  patternSlug?: string;
  onResult: (attempts: number, correct: boolean) => void;
}) {
  return <div>${kind}Checkpoint · TODO</div>;
});
EOF
done
```

Run typecheck again. Expected: passes now, with placeholders in place for Task 18 to replace.

- [ ] **Step 12: Commit**

```bash
git add architex/src/components/modules/lld/learn/
git commit -m "$(cat <<'EOF'
feat(lld): add 8 lesson section components + LessonColumn + MDXRenderer

Each section renders in a <section data-section-id="…"> shape required
by useLessonScrollSync. Headlines are editorial serif, numbers are mono
chrome, failure modes are severity-colored. Bookmark toggle icon per
section. CheckpointSection dispatches to the 4 checkpoint kinds (stubbed
in this task, implemented in Task 18).

MDXRenderer executes compiled function-body MDX once and memoizes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Create `ClassPopover` (Q7 canvas click)

**Files:**
- Create: `architex/src/components/modules/lld/learn/ClassPopover.tsx`

Per spec §6 Q7: clicking a class on the canvas while in Learn mode opens a popover summarizing the class + listing the lesson sections that mention it, with jump links.

- [ ] **Step 1: Create the popover**

Create `architex/src/components/modules/lld/learn/ClassPopover.tsx`:

```tsx
"use client";

import { memo, useMemo } from "react";
import type { LessonPayload, LessonSectionId } from "@/lib/lld/lesson-types";
import { X } from "lucide-react";

interface Props {
  classId: string;
  className: string;
  payload: LessonPayload;
  /** Screen coordinates (centered on the clicked class node). */
  position: { x: number; y: number };
  onDismiss: () => void;
  onJumpToSection: (section: LessonSectionId) => void;
}

const SECTION_LABELS: Record<LessonSectionId, string> = {
  itch: "The Itch",
  definition: "Definition",
  mechanism: "Mechanism",
  anatomy: "Anatomy",
  numbers: "Numbers",
  uses: "Uses",
  failure_modes: "Failure Modes",
  checkpoints: "Checkpoints",
};

export const ClassPopover = memo(function ClassPopover({
  classId,
  className,
  payload,
  position,
  onDismiss,
  onJumpToSection,
}: Props) {
  // Find which sections mention this classId
  const mentionedIn = useMemo(() => {
    const out: LessonSectionId[] = [];
    for (const [sid, section] of Object.entries(payload.sections) as Array<
      [LessonSectionId, { classIds: string[] }]
    >) {
      if (section.classIds.includes(classId)) out.push(sid);
    }
    return out;
  }, [classId, payload]);

  // Find the anatomy entry for this class (authoritative summary)
  const anatomyEntry = useMemo(
    () => payload.sections.anatomy.classes.find((c) => c.classId === classId),
    [classId, payload],
  );

  return (
    <div
      role="dialog"
      aria-label={`${className} details`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
      className="z-50 w-80 rounded-xl border border-border/40 bg-background/95 backdrop-blur-md shadow-xl p-4"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-mono text-sm font-semibold text-foreground">
          {className}
        </div>
        <button
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-foreground-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {anatomyEntry ? (
        <>
          <div className="text-xs uppercase tracking-wide text-primary mb-1">
            {anatomyEntry.role}
          </div>
          <p className="text-xs text-foreground-muted font-serif leading-relaxed">
            {anatomyEntry.responsibility}
          </p>
          {anatomyEntry.keyMethod && (
            <code className="text-[11px] text-foreground-muted mt-2 block font-mono">
              key method · {anatomyEntry.keyMethod}
            </code>
          )}
        </>
      ) : (
        <p className="text-xs text-foreground-muted italic">
          No anatomy entry for this class — check the Anatomy section.
        </p>
      )}

      {mentionedIn.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1.5">
            Mentioned in
          </div>
          <div className="flex flex-wrap gap-1">
            {mentionedIn.map((sid) => (
              <button
                key={sid}
                onClick={() => {
                  onJumpToSection(sid);
                  onDismiss();
                }}
                className="text-[11px] rounded-full border border-border/30 bg-elevated/50 px-2 py-0.5 text-foreground hover:bg-primary/20 transition-colors"
              >
                {SECTION_LABELS[sid]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/learn/ClassPopover.tsx
git commit -m "$(cat <<'EOF'
feat(lld): add ClassPopover for Learn-mode canvas click (Q7)

Absolute-positioned popover anchored above the clicked class node.
Derives mentioned-in sections from payload.classIds arrays (no extra
DB query). Pulls role + responsibility from the Anatomy section entry.
Jump link dismisses popover + emits onJumpToSection.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Build concept-graph generator + build integration

**Files:**
- Create: `architex/scripts/build-concept-graph.ts`
- Create (generated): `architex/src/lib/lld/concept-graph.ts`
- Modify: `architex/package.json` (add `build:concept-graph` script + `prebuild` hook)
- Test: `architex/src/lib/lld/__tests__/concept-graph.test.ts`

Authors describe cross-links in `content/lld/concepts/<slug>.concepts.yaml`. The build-time generator merges all YAMLs into a typed TypeScript module consumed at runtime for O(1) lookups.

- [ ] **Step 1: Write the failing test**

Create `architex/src/lib/lld/__tests__/concept-graph.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  CONCEPT_GRAPH,
  lookupConcept,
  conceptsForPattern,
  patternsForConcept,
  relatedPatterns,
  confusedWithFor,
} from "@/lib/lld/concept-graph";

describe("concept-graph", () => {
  it("exports a non-empty graph", () => {
    expect(Object.keys(CONCEPT_GRAPH.concepts).length).toBeGreaterThan(0);
    expect(Object.keys(CONCEPT_GRAPH.patterns).length).toBeGreaterThan(0);
  });

  it("lookupConcept resolves concept by id", () => {
    const anyId = Object.keys(CONCEPT_GRAPH.concepts)[0];
    const c = lookupConcept(anyId);
    expect(c).not.toBeNull();
    expect(c?.id).toBe(anyId);
  });

  it("lookupConcept returns null for unknown id", () => {
    expect(lookupConcept("__no_such_concept__")).toBeNull();
  });

  it("patternsForConcept returns pattern slugs the concept lives in", () => {
    const anyId = Object.keys(CONCEPT_GRAPH.concepts)[0];
    const patterns = patternsForConcept(anyId);
    expect(patterns.length).toBeGreaterThan(0);
  });

  it("conceptsForPattern returns stable ordering", () => {
    const anySlug = Object.keys(CONCEPT_GRAPH.patterns)[0];
    const a = conceptsForPattern(anySlug);
    const b = conceptsForPattern(anySlug);
    expect(a).toEqual(b);
  });

  it("relatedPatterns returns deduped slug array", () => {
    const anySlug = Object.keys(CONCEPT_GRAPH.patterns)[0];
    const related = relatedPatterns(anySlug);
    expect(new Set(related).size).toBe(related.length);
    expect(related).not.toContain(anySlug);
  });

  it("confusedWithFor returns typed entries", () => {
    const anySlug = Object.keys(CONCEPT_GRAPH.patterns)[0];
    const confused = confusedWithFor(anySlug);
    for (const c of confused) {
      expect(typeof c.patternSlug).toBe("string");
      expect(typeof c.reason).toBe("string");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test:run -- concept-graph
```
Expected: FAIL with missing module. Also the graph hasn't been generated yet.

- [ ] **Step 3: Write the generator**

Create `architex/scripts/build-concept-graph.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Merge every content/lld/concepts/<slug>.concepts.yaml into a single
 * typed TS module at src/lib/lld/concept-graph.ts. Consumed by the UI
 * at runtime for O(1) cross-link lookups.
 *
 * Run automatically via `prebuild` + explicitly via:
 *   pnpm build:concept-graph
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";
import type { ConceptYAML } from "../src/lib/lld/lesson-types";

const CONCEPT_DIR = "content/lld/concepts";
const OUT_PATH = "src/lib/lld/concept-graph.ts";

interface ConceptNode {
  id: string;
  label: string;
  summary: string;
  patternSlugs: string[];
  relatedConcepts: string[];
  relatedPatterns: string[];
}

interface PatternNode {
  slug: string;
  conceptIds: string[];
  relatedPatterns: string[];
  confusedWith: Array<{ patternSlug: string; reason: string }>;
}

async function main() {
  if (!existsSync(CONCEPT_DIR)) {
    // First run before any concept files exist — write empty graph.
    await writeGraph({ concepts: {}, patterns: {} });
    console.log(`[build-concept-graph] no ${CONCEPT_DIR} yet — wrote empty graph`);
    return;
  }

  const files = (await readdir(CONCEPT_DIR)).filter((f) =>
    f.endsWith(".concepts.yaml"),
  );

  const concepts: Record<string, ConceptNode> = {};
  const patterns: Record<string, PatternNode> = {};

  for (const file of files) {
    const raw = await readFile(join(CONCEPT_DIR, file), "utf8");
    const doc = yaml.load(raw) as ConceptYAML;
    if (!doc?.pattern || !Array.isArray(doc.concepts)) {
      console.warn(`[build-concept-graph] skipping invalid file: ${file}`);
      continue;
    }
    const slug = doc.pattern;

    const patternNode: PatternNode = patterns[slug] ?? {
      slug,
      conceptIds: [],
      relatedPatterns: [],
      confusedWith: [],
    };

    for (const c of doc.concepts) {
      if (!c.id || !c.label) continue;
      if (!concepts[c.id]) {
        concepts[c.id] = {
          id: c.id,
          label: c.label,
          summary: c.summary ?? "",
          patternSlugs: [],
          relatedConcepts: [],
          relatedPatterns: [],
        };
      }
      const cn = concepts[c.id];
      if (!cn.patternSlugs.includes(slug)) cn.patternSlugs.push(slug);
      for (const rc of c.relatedConcepts ?? []) {
        if (!cn.relatedConcepts.includes(rc)) cn.relatedConcepts.push(rc);
      }
      for (const rp of c.relatedPatterns ?? []) {
        if (!cn.relatedPatterns.includes(rp)) cn.relatedPatterns.push(rp);
        if (rp !== slug && !patternNode.relatedPatterns.includes(rp)) {
          patternNode.relatedPatterns.push(rp);
        }
      }
      if (!patternNode.conceptIds.includes(c.id)) {
        patternNode.conceptIds.push(c.id);
      }
    }

    for (const cw of doc.confusedWith ?? []) {
      if (cw.patternSlug && cw.reason) {
        patternNode.confusedWith.push({
          patternSlug: cw.patternSlug,
          reason: cw.reason,
        });
      }
    }

    patterns[slug] = patternNode;
  }

  await writeGraph({ concepts, patterns });
  console.log(
    `[build-concept-graph] wrote ${OUT_PATH} · ${Object.keys(concepts).length} concepts, ${Object.keys(patterns).length} patterns`,
  );
}

async function writeGraph(graph: {
  concepts: Record<string, ConceptNode>;
  patterns: Record<string, PatternNode>;
}) {
  const json = JSON.stringify(graph, null, 2);
  const out = `/**
 * GENERATED FILE — DO NOT EDIT.
 * Run \`pnpm build:concept-graph\` to regenerate.
 * Source: content/lld/concepts/*.concepts.yaml
 */

export interface ConceptNode {
  id: string;
  label: string;
  summary: string;
  patternSlugs: string[];
  relatedConcepts: string[];
  relatedPatterns: string[];
}

export interface PatternNode {
  slug: string;
  conceptIds: string[];
  relatedPatterns: string[];
  confusedWith: Array<{ patternSlug: string; reason: string }>;
}

export interface ConceptGraph {
  concepts: Record<string, ConceptNode>;
  patterns: Record<string, PatternNode>;
}

export const CONCEPT_GRAPH: ConceptGraph = ${json};

export function lookupConcept(id: string): ConceptNode | null {
  return CONCEPT_GRAPH.concepts[id] ?? null;
}

export function conceptsForPattern(slug: string): string[] {
  return CONCEPT_GRAPH.patterns[slug]?.conceptIds ?? [];
}

export function patternsForConcept(id: string): string[] {
  return CONCEPT_GRAPH.concepts[id]?.patternSlugs ?? [];
}

export function relatedPatterns(slug: string): string[] {
  return CONCEPT_GRAPH.patterns[slug]?.relatedPatterns ?? [];
}

export function confusedWithFor(
  slug: string,
): Array<{ patternSlug: string; reason: string }> {
  return CONCEPT_GRAPH.patterns[slug]?.confusedWith ?? [];
}
`;
  await writeFile(OUT_PATH, out, "utf8");
}

main().catch((err) => {
  console.error("[build-concept-graph] fatal:", err);
  process.exit(1);
});
```

- [ ] **Step 4: Register npm scripts**

Open `architex/package.json`. In `scripts`, add:

```json
"build:concept-graph": "tsx scripts/build-concept-graph.ts",
"prebuild": "tsx scripts/build-concept-graph.ts"
```

If a `prebuild` entry already exists, chain with `&&`. The `prebuild` hook runs automatically before `next build`, so production bundles always include the latest graph.

- [ ] **Step 5: Run the generator to bootstrap the file**

```bash
pnpm build:concept-graph
```
Expected: writes `src/lib/lld/concept-graph.ts` with empty objects (no YAMLs yet). File looks like the generated template with empty maps.

- [ ] **Step 6: Run the test**

The test expects at least one concept + one pattern. To make it pass in CI before content lands, add a fixture YAML in Step 7 of Task 24. For now, the test will fail with "expected > 0, got 0" — mark it `it.skip` temporarily and re-enable in Task 24.

Edit `architex/src/lib/lld/__tests__/concept-graph.test.ts` and change:

```typescript
it("exports a non-empty graph", () => {
```

to:

```typescript
it.skip("exports a non-empty graph (enabled in Task 24)", () => {
```

and similarly skip the other tests that access `Object.keys(...)[0]`. Alternatively keep them unskipped if you plan to author `singleton.concepts.yaml` in this same commit — pick whichever keeps CI green.

- [ ] **Step 7: Commit**

```bash
git add architex/scripts/build-concept-graph.ts architex/src/lib/lld/concept-graph.ts architex/src/lib/lld/__tests__/concept-graph.test.ts architex/package.json
git commit -m "$(cat <<'EOF'
feat(lld): concept-graph generator + prebuild hook

Reads content/lld/concepts/*.concepts.yaml, merges into a typed TS
module at src/lib/lld/concept-graph.ts. Runtime lookups are O(1) map
reads. The prebuild hook guarantees `next build` always bundles the
latest graph without manual intervention.

Tests are skipped until first YAML lands in Task 24.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: Create `ConfusedWithPanel`

**Files:**
- Create: `architex/src/components/modules/lld/learn/ConfusedWithPanel.tsx`

Per spec §6 Q9 surface 3: "Confused-With panel · Ask me about their difference in your codebase". This panel displays the `confusedWith` entries from the concept graph for the current pattern, each with a one-line "why they're confused" reason and an "Ask the Architect" button (AI is wired in Task 21).

- [ ] **Step 1: Create the component**

Create `architex/src/components/modules/lld/learn/ConfusedWithPanel.tsx`:

```tsx
"use client";

import { memo } from "react";
import { Lightbulb, MessageCircle } from "lucide-react";
import { confusedWithFor } from "@/lib/lld/concept-graph";

interface Props {
  patternSlug: string;
  /** Pretty label lookup for the referenced pattern slugs. */
  resolvePatternLabel: (slug: string) => string;
  onAskArchitect?: (args: {
    patternSlug: string;
    confusedWithSlug: string;
    reason: string;
  }) => void;
}

export const ConfusedWithPanel = memo(function ConfusedWithPanel({
  patternSlug,
  resolvePatternLabel,
  onAskArchitect,
}: Props) {
  const entries = confusedWithFor(patternSlug);
  if (entries.length === 0) return null;

  return (
    <aside
      aria-label="Often confused with"
      className="rounded-xl border border-border/30 bg-gradient-to-br from-amber-500/5 to-transparent p-4 m-3"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-200/80 mb-2">
        <Lightbulb className="h-3.5 w-3.5" />
        Often confused with
      </div>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.patternSlug}
            className="rounded-lg border border-border/20 bg-elevated/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {resolvePatternLabel(e.patternSlug)}
                </div>
                <p className="text-xs text-foreground-muted font-serif leading-relaxed mt-1">
                  {e.reason}
                </p>
              </div>
              {onAskArchitect && (
                <button
                  onClick={() =>
                    onAskArchitect({
                      patternSlug,
                      confusedWithSlug: e.patternSlug,
                      reason: e.reason,
                    })
                  }
                  className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/20 text-primary text-[10px] uppercase tracking-wider px-2 py-1 hover:bg-primary/30 transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  Ask
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
});
```

- [ ] **Step 2: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/learn/ConfusedWithPanel.tsx
git commit -m "$(cat <<'EOF'
feat(lld): add ConfusedWithPanel (Q9 surface 3)

Reads confusedWith entries from the static concept graph. Renders each
as a card with reason copy and an "Ask" button that delegates to the
parent (wired to Haiku in Task 21). Returns null when no entries,
keeping the panel invisible until content authors populate YAML.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---
