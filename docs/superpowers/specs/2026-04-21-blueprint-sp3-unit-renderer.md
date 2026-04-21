# Blueprint SP3 · Unit Renderer Spec

> **Parent:** `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md`
> **Predecessors:** SP1 (Foundation), SP2 (Journey Home)
> **Status:** Approved, ready for implementation
> **Date:** 2026-04-21
> **Scope:** The heart of Blueprint — the scrollable unit page that orchestrates read / interact / apply / practice / retain / reflect / checkpoint sections

---

## 1. Purpose

By the end of SP3 a user can click a unit card in the Journey home and land on a fully functional unit page. They scroll through sections, answer inline exercises, draw on an embedded canvas, schedule FSRS cards — and every action writes progress. When they complete the final section, a celebration screen routes them to the next unit.

SP3 ships:
1. The **renderer infrastructure** — UnitPage, SectionRouter, stage orchestration, scroll sync, progress writes.
2. **All 7 section-type components** — fully implemented for `read`, `interact`, `retain`, `reflect`; thoughtfully stubbed for `apply`, `practice`, `checkpoint` (they render working UI for V1, with SP4/SP5 integration deferred).
3. **MDX compile pipeline** for read-section content (adapted from old LLD's `compile:lld-lessons`).
4. **4 interaction widgets** for the `interact` section type (MCQ single, MCQ multi, fill-blank, click-target).
5. **Unit 1 authored** end-to-end as proof — "What is a design pattern?" with 6 real sections that exercise `read`, `interact`, and `retain` section types.
6. **TOC side rail**, **unit progress bar**, **unit completion screen**, **bookmark wiring**.
7. **Analytics events** fire for every section open/complete, checkpoint start/pass.

## 2. What ships

### 2.1 Content model + MDX compile pipeline

**File:** `architex/content/blueprint/units/<slug>/unit.yaml`
- Metadata + recipe authoring source

**File:** `architex/content/blueprint/units/<slug>/sections/<nn>-<slug>.mdx`
- One MDX file per `read` section (other types have inline params in YAML)

**File:** `architex/scripts/blueprint/compile-unit.ts`
- Reads a single unit directory
- Compiles each `.mdx` to MDX function-body JS via `@mdx-js/mdx`
- Parses `unit.yaml` for recipe + section metadata
- Writes output to `content/blueprint/compiled/<slug>.json` (analogous to the LLD compiled artifacts)

**File:** `architex/scripts/blueprint/compile-all-units.ts`
- Loops `content/blueprint/units/*/` and runs `compile-unit` on each

**File:** `architex/scripts/blueprint/seed-unit-content.ts`
- Reads `content/blueprint/compiled/<slug>.json`
- Updates the `blueprint_units` row with `recipeJson` + sets `publishedAt`
- Idempotent raw-pg writer

**File:** `architex/package.json` — new scripts:
- `blueprint:compile-units` → compile all
- `blueprint:seed-unit-content` → upsert compiled recipes

### 2.2 Recipe JSON extension

The `BlueprintSectionRecipe.params` JSONB field in `blueprint_units.recipe_json.sections[].params` will carry per-type payload. Concrete shapes (TypeScript):

```ts
// Read section params
interface ReadSectionParams {
  compiled: {
    code: string;    // function-body MDX
    raw: string;     // original MDX source (for screen readers + AI)
  };
  estimatedSeconds: number;
}

// Interact section params
interface InteractSectionParams {
  widget:
    | { kind: "mcq-single"; prompt: string; options: { id: string; label: string; whyWrong?: string }[]; correctId: string; }
    | { kind: "mcq-multi"; prompt: string; options: { id: string; label: string; whyWrong?: string }[]; correctIds: string[]; }
    | { kind: "fill-blank"; prompt: string; blanks: { id: string; answer: string; alternatives?: string[] }[]; }
    | { kind: "click-target"; prompt: string; imageSrc?: string; targets: { id: string; label: string; correct: boolean; x: number; y: number; r: number }[]; };
}

// Retain section params
interface RetainSectionParams {
  cards: Array<{
    id: string;
    entitySlug: string;
    entityType: "pattern" | "concept";
    front: string;
    back: string;
  }>;
  recap?: string; // optional 2-3 sentence recap MDX to show before cards
}

// Reflect section params
interface ReflectSectionParams {
  prompt: string;
  placeholder?: string;
  minWords?: number;
}

// Apply section params (SP3 minimal; SP4 enriches)
interface ApplySectionParams {
  exercise: "draw-classes" | "connect-classes" | "identify-pattern";
  patternSlug?: string;
  starterClasses?: number; // count only; real graphs ship with SP4 canvas integration
  instructions: string;
}

// Practice section params (SP3 minimal; SP5 enriches)
interface PracticeSectionParams {
  problemSlug: string;
  timerMinutes: number;
  reducedScope?: string; // 1-line note describing what's reduced vs the full problem
}

// Checkpoint section params
interface CheckpointSectionParams {
  exercises: InteractSectionParams["widget"][]; // reuse widget union
  passThreshold: number; // 0..1 fraction correct required to pass
}
```

These types live in `src/lib/blueprint/section-types.ts` alongside the shared types and are re-exported from the schema barrel.

### 2.3 Section components

All under `src/components/modules/blueprint/unit/sections/`:

- **`ReadSection.tsx`** — renders the MDX function-body via a runtime eval pattern (carried over from `MDXRenderer.tsx` in old LLD; writes a streamlined Blueprint-specific version that uses the automatic JSX runtime + injected `{ Class, Concept }` MDX components).
- **`InteractSection.tsx`** — dispatches on `widget.kind` to a widget component.
- **`RetainSection.tsx`** — renders recap (optional) + flashcard preview cards; "Schedule" button records the retain-section completion and logs an intent-to-add-FSRS-cards event (actual FSRS writes are SP6).
- **`ReflectSection.tsx`** — textarea with minimum-word validation and "Save reflection" CTA.
- **`ApplySection.tsx`** — V1: instruction panel + placeholder canvas frame that reads "Canvas integration lands with the Patterns Library in SP4"; fires section_completed when the user clicks "Mark as done" (honor-system in V1). Future SP4 replaces the placeholder with a real `LLDCanvas`.
- **`PracticeSection.tsx`** — V1: problem name + requirements summary + timer preview + "Open in drill mode" CTA that routes to `/modules/blueprint/toolkit/problems/<slug>/drill`. Honor-system `Mark as done` pattern mirrors Apply.
- **`CheckpointSection.tsx`** — wraps 3–5 interact widgets (from `exercises`) in sequence; scores on submit; fires `blueprintCheckpointStarted` on open and `blueprintCheckpointPassed` when ≥ `passThreshold` fraction correct.

### 2.4 Widgets

All under `src/components/modules/blueprint/unit/widgets/`:

- **`McqSingleWidget.tsx`** — radio list + submit + feedback + `whyWrong` reveal on incorrect.
- **`McqMultiWidget.tsx`** — checkbox list + submit + per-option feedback.
- **`FillBlankWidget.tsx`** — inline text inputs inside the prompt string (split by `{{id}}` markers); case-insensitive comparison with alternatives.
- **`ClickTargetWidget.tsx`** — absolute-positioned clickable zones on a background; shows a check or × on click; correct-zone reveal after all clicks.

### 2.5 Hooks

**File:** `src/hooks/blueprint/useUnit.ts`
- TanStack Query for `GET /api/blueprint/units/[slug]`
- Returns typed unit payload + `isLoading`/`error`
- 10-minute stale time

**File:** `src/hooks/blueprint/useUnitProgress.ts`
- TanStack Query + optimistic writer
- Hydrates `GET /api/blueprint/units/[slug]/progress`
- Wraps `useUnitProgressSync` patch helper
- Exposes `patchSectionState`, `markSectionCompleted`, `markUnitCompleted`

**File:** `src/hooks/blueprint/useUnitScrollSync.ts`
- IntersectionObserver on section boundaries within the scrollable container
- On a section entering viewport, updates URL hash `#section-<id>` (history.replaceState, not push, so back button doesn't get flooded)
- Writes `activeSectionId` into the store (for the TOC)
- Auto-marks `read` sections as completed when scroll depth ≥ 0.9 in-viewport

### 2.6 Shell augmentations

**File:** `src/components/modules/blueprint/unit/UnitPage.tsx`
- Top-level unit orchestrator rendered by `src/app/modules/blueprint/unit/[unitSlug]/page.tsx`
- Two-column layout on wide: reading column (max 720px) + TOC side rail (240px)
- Breaks to single column < 1024
- Sticky unit header with title + ordinal + progress bar

**File:** `src/components/modules/blueprint/unit/SectionRouter.tsx`
- Switch on `section.type`, renders the correct Section component
- Wraps each in a `<section data-blueprint-section="<id>" data-section-type="<type>">` for the scroll-sync observer
- Emits `blueprintSectionOpened` once per section when scrolled into view (IntersectionObserver)

**File:** `src/components/modules/blueprint/unit/UnitTOC.tsx`
- Vertical list of sections with titles
- Active section gets an indigo bar + full color text; completed sections get a checkmark
- Clicking a section scrolls to it

**File:** `src/components/modules/blueprint/unit/UnitProgressBar.tsx`
- Thin bar under the header showing `completedSections / totalSections` + reading time estimate

**File:** `src/components/modules/blueprint/unit/UnitCompletion.tsx`
- Renders at `/modules/blueprint/unit/<slug>/complete`
- Celebration headline + per-section summary (scores) + "Next unit →" CTA
- Fires `blueprintUnitCompleted`
- Shown automatically when all sections complete + user scrolls past the last section (or clicks "Finish →")

**File:** `src/components/modules/blueprint/unit/UnitErrorState.tsx`
- Shown when the unit exists but has no `recipeJson.sections[]` yet
- Copy: "This unit is still being authored — check back soon. [Browse the curriculum map →]"

### 2.7 Page changes

- `src/app/modules/blueprint/unit/[unitSlug]/page.tsx` → renders `<UnitPage unitSlug={...} />`
- `src/app/modules/blueprint/unit/[unitSlug]/complete/page.tsx` → renders `<UnitCompletion unitSlug={...} />`

### 2.8 Unit 1 content

**File:** `architex/content/blueprint/units/01-what-is-a-pattern/unit.yaml`

```yaml
slug: what-is-a-pattern
recipeVersion: 1
sections:
  - id: itch
    type: read
    title: The itch
    mdx: 01-itch.mdx
    estimatedSeconds: 90
  - id: what-patterns-are
    type: read
    title: What a pattern really is
    mdx: 02-what-patterns-are.mdx
    estimatedSeconds: 120
  - id: trait-mcq
    type: interact
    title: Which one is a pattern?
    widget:
      kind: mcq-single
      prompt: "Which of these is a design pattern, not just a technique?"
      options: [...]
      correctId: ...
  - id: strategy-preview
    type: read
    title: Meet Strategy
    mdx: 03-strategy.mdx
    estimatedSeconds: 120
  - id: strategy-check
    type: interact
    title: Pattern check
    widget:
      kind: mcq-multi
      ...
  - id: not-every-hammer
    type: read
    title: Not every hammer
    mdx: 04-not-every-hammer.mdx
    estimatedSeconds: 90
  - id: retain-strategy
    type: retain
    title: See you in a few days
    cards:
      - { front: "You have an algorithm family with one-of-many selection …", back: "Strategy", entitySlug: "strategy", entityType: "pattern" }
      - { front: "What is the primary cost of Strategy?", back: "Two extra classes per algorithm family", entitySlug: "strategy", entityType: "concept" }
```

**Files:** `01-itch.mdx`, `02-what-patterns-are.mdx`, `03-strategy.mdx`, `04-not-every-hammer.mdx` — hand-authored read content per §9.3 voice rules.

### 2.9 Updates to existing files

- `src/db/schema/index.ts` — re-export `section-types.ts` types (actually those don't go in schema; they go in `src/lib/blueprint/section-types.ts`)
- `src/hooks/blueprint/useBookmarks.ts` (NEW) — per-user section bookmarks scoped to `blueprint_`; reuses LLD bookmarks table with `module='blueprint'` column if already present, or adds a new table (not in SP3 — deferred; bookmark UI stubbed)
- `src/components/modules/blueprint/shell/StatusBar.tsx` (MODIFY, minor) — add reading-progress indicator when on a unit page (derivable from URL)
- `src/hooks/blueprint/useUnitProgressSync.ts` (from SP1) — tighten the unit progress state update to include section-state merges

## 3. Out of scope in SP3

- Full `apply` with real canvas (SP4 integrates `LLDCanvas`)
- Full `practice` with real drill UI (SP5 integrates Problems Workspace)
- Actual FSRS card writes — SP3 logs the intent; SP6 wires it up
- Drag-reorder widget, spot-mistake widget, match-pairs widget (SP10 polish)
- Contextual AI surfaces (deferred to SP10)
- Bookmarks UI (surface only; back-end in later SP)
- Animated transitions between sections (SP10)
- Mobile layout (V1 desktop-only)

## 4. Invariants (additions to vision §Appendix B)

- **I8 — Section ordering is authoritative.** `recipeJson.sections[]` order determines render order; the SectionRouter never reorders.
- **I9 — No section can write to another section's state.** Each section is self-contained.
- **I10 — `read` auto-completes via scroll depth; other sections require explicit user action.**
- **I11 — Checkpoint pass gates unit completion but not other sections.** You can skip a checkpoint and still open the next unit (soft gate, matches vision §9.5).

## 5. Verification

After SP3:

- `pnpm blueprint:compile-units` compiles Unit 1's 4 MDX files into `content/blueprint/compiled/what-is-a-pattern.json`
- `pnpm blueprint:seed-unit-content` upserts the compiled recipe into `blueprint_units.recipe_json`
- Visit `/modules/blueprint/unit/what-is-a-pattern` → Unit 1 renders with 7 sections
- Scroll through all sections → each `read` auto-completes on scroll; each `interact` requires answer; `retain` requires Schedule click
- URL hash updates as you scroll (`#section-<id>`)
- TOC shows checkmarks as sections complete
- Click TOC entry → smooth scroll to section
- Complete all sections → `#section-retain-strategy` reached → UnitCompletion renders inline or user clicks "Finish →" → route to `/unit/what-is-a-pattern/complete`
- Completion page shows celebration + next-unit card
- Visit any other unit (empty recipe) → "This unit is still being authored" empty state
- `SELECT * FROM blueprint_user_progress WHERE unit_id = (select id from blueprint_units where slug = 'what-is-a-pattern')` shows section_states map populated
- `SELECT event_name FROM blueprint_events WHERE event_name LIKE 'blueprint.section_%' LIMIT 10` returns section_opened + section_completed rows
- `pnpm typecheck && pnpm build` green

## 6. Design decisions (resolved here)

- **MDX runtime:** use `@mdx-js/mdx`'s `outputFormat: "function-body"` — same decision as old LLD. Renderer reconstructs the module via `new Function(code)({ Fragment, jsx, jsxs })` — the exact pattern we debugged in the last session.
- **Section boundaries in DOM:** every section is a top-level `<section>` inside the scroll container. No nesting. IntersectionObserver watches each section individually.
- **Auto-completion of `read` sections:** when scroll depth reaches 90% of the section's height, it's marked completed. No "Next" button needed for reads.
- **Mandatory sections:** all `interact`, `retain`, `reflect` sections are mandatory. They must be submitted/scheduled/saved to mark as complete. Users can skip but the section stays `started` not `completed`.
- **Checkpoint pass threshold:** default 0.7 (70% correct). Authors can override per-unit.
- **Rendering order of Unit 1 sections:** read → read → interact → read → interact → read → retain. Mix of narrative and retrieval without being drilly.
- **Reading column width:** `max-w-[720px]` with 2rem side padding. Editorial feel.
- **TOC position:** sticky at `top: 60px` (below top chrome + breadcrumb).
- **Unit completion screen entry:** soft — auto-shows an inline block at end of last section; user clicks "Finish →" to navigate to `/complete` which writes `blueprint_user_progress.completedAt` and fires `blueprintUnitCompleted`.

---

*End of SP3 spec.*
