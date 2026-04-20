# LLD Phase 3 · Build Mode Canvas Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate today's Build mode canvas into a diamond-grade authoring surface. Ship eight capability upgrades that make free-form design exploration fast, discoverable, and portable: searchable pattern-library dock, curated template loader (~60 blueprints), AI "what's missing" suggestions via Haiku, Dagre-backed auto-layout presets, five export formats, named canvas snapshots with extended undo/redo, keyboard-first authoring, and per-node notes + annotations. Zero behaviour regression in the existing 4-panel layout — every enhancement is additive.

**Architecture:** Build mode continues to render inside `BuildModeLayout.tsx` (Phase 1). A new left-side dock `PatternLibraryDock` slides in beside the existing sidebar; a new right-side `BuildActionsRail` hosts auto-layout, export, and snapshot buttons; AI node suggestions surface as an in-canvas floating card driven by the existing Claude Haiku client; notes + annotations live on `ArchitexNode.data.notes` (existing field, newly surfaced) and a new `lld_design_annotations` edge-less layer. Design persistence extends the canvas store with named `lldDesigns` CRUD backed by a new `lld_designs` DB table plus `lld_design_snapshots` (undo/redo history) and `lld_templates_library` (curated blueprint catalog). Auto-layout uses the existing `src/lib/lld/dagre-layout.ts` engine. Exports reuse `src/lib/export/*` — PNG/SVG/Mermaid/PlantUML/JSON — behind a single `BuildExportMenu`. All keyboard shortcuts route through a new `src/hooks/useBuildKeyboardShortcuts.ts`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5 + Zundo-style `UndoManager`, TanStack Query 5, Drizzle ORM, PostgreSQL (Neon), Clerk v7 (optional), @xyflow/react 12, @dagrejs/dagre 3, motion/react 12, Anthropic SDK (Haiku), Vitest, Testing Library.

**Prerequisite:** Phase 1 (mode scaffolding) and Phase 2 (Learn mode Wave 1) must be complete. Verify `git tag phase-1-complete` exists and `pnpm test:run` is green on `main` before starting Task 1. Phase 3 assumes `BuildModeLayout.tsx`, `LLDShell`, `useLLDModeSync`, and the `ui-store.lldMode` slice from Phase 1 are live.

**Reference:** Design spec `docs/superpowers/specs/2026-04-20-lld-architect-studio-rebuild.md` §6 (Build mode additions), §7 (persistence), §12 (Haiku AI suggestions), §14 (keyboard grammar). Phase 1 style reference: `docs/superpowers/plans/2026-04-20-lld-phase-1-mode-scaffolding.md`. Canvas playbook: `architex/LLD_CANVAS_PLAYBOOK.md`.

---

## Pre-flight checklist (Phase 3.0 · ~1 hour)

Run before Task 1. These verify Phase 1 + 2 outputs are in place and no regressions exist.

- [ ] **Verify Phase 1 shell is wired**

Run:
```bash
grep -n "LLDShell" architex/src/components/modules/lld/hooks/useLLDModuleImpl.tsx
```
Expected: exactly one match that wraps the canvas slot in `<LLDShell buildContent={…}>`. If absent, Phase 1 did not ship — stop and fix.

- [ ] **Verify existing Dagre engine compiles**

Run:
```bash
cd architex
pnpm typecheck -- --noEmit src/lib/lld/dagre-layout.ts
```
Expected: no errors. This is the layout engine we'll wire into the auto-layout preset UI in Task 12.

- [ ] **Verify existing export helpers are present**

Run:
```bash
ls architex/src/lib/export/ | grep -E "to-(png|svg|mermaid|plantuml|json)"
```
Expected: 5 matching files. If any missing, extend the plan's Task 13 accordingly — do not silently skip.

- [ ] **Verify canvas-store UndoManager is healthy**

```bash
grep -n "canvasUndoManager" architex/src/stores/canvas-store.ts
```
Expected: an exported singleton with `maxEntries: 100`. Phase 3 extends this (Task 14) to wire named snapshots without breaking rapid-action undo semantics.

- [ ] **Verify @dagrejs/dagre is installed**

```bash
cd architex && pnpm list @dagrejs/dagre
```
Expected: `@dagrejs/dagre ^3.x.x` present. If missing, install with `pnpm add @dagrejs/dagre@^3.0.0`.

- [ ] **Run full test suite baseline**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass before starting Phase 3. If anything fails, fix before proceeding — do not entangle Phase 3 with pre-existing failures.

- [ ] **Commit any pre-flight fixes**

```bash
git add -p
git commit -m "fix: pre-flight verification for Phase 3 Build-mode work"
```

---

## File Structure

Files created or significantly modified in this plan:

```
architex/
├── drizzle/                                                    # (generated migrations)
│   ├── NNNN_add_lld_designs.sql                                # NEW
│   ├── NNNN_add_lld_design_snapshots.sql                       # NEW
│   ├── NNNN_add_lld_templates_library.sql                      # NEW
│   └── NNNN_add_lld_design_annotations.sql                     # NEW
├── src/
│   ├── db/schema/
│   │   ├── lld-designs.ts                                      # NEW
│   │   ├── lld-design-snapshots.ts                             # NEW
│   │   ├── lld-templates-library.ts                            # NEW
│   │   ├── lld-design-annotations.ts                           # NEW
│   │   ├── index.ts                                            # MODIFY (re-export)
│   │   └── relations.ts                                        # MODIFY (add relations)
│   ├── db/seeds/
│   │   └── lld-templates-library.ts                            # NEW (60 curated blueprints)
│   ├── stores/
│   │   ├── canvas-store.ts                                     # MODIFY (+ named snapshots, + notes, + annotations)
│   │   └── __tests__/
│   │       ├── canvas-store.snapshots.test.ts                  # NEW
│   │       └── canvas-store.annotations.test.ts                # NEW
│   ├── hooks/
│   │   ├── useBuildKeyboardShortcuts.ts                        # NEW
│   │   ├── useAutoLayout.ts                                    # NEW
│   │   ├── useAISuggestions.ts                                 # NEW
│   │   ├── useLLDTemplatesLibrary.ts                           # NEW
│   │   ├── useLLDDesigns.ts                                    # NEW
│   │   └── __tests__/
│   │       ├── useBuildKeyboardShortcuts.test.tsx              # NEW
│   │       ├── useAutoLayout.test.ts                           # NEW
│   │       └── useAISuggestions.test.tsx                       # NEW
│   ├── lib/
│   │   ├── lld/
│   │   │   ├── auto-layout-presets.ts                          # NEW
│   │   │   ├── ai-node-suggestions.ts                          # NEW
│   │   │   └── __tests__/
│   │   │       └── auto-layout-presets.test.ts                 # NEW
│   │   └── export/
│   │       └── build-export-menu-items.ts                      # NEW (menu registry)
│   ├── app/api/
│   │   ├── lld/designs/route.ts                                # NEW
│   │   ├── lld/designs/[id]/route.ts                           # NEW
│   │   ├── lld/designs/[id]/snapshots/route.ts                 # NEW
│   │   ├── lld/designs/[id]/annotations/route.ts               # NEW
│   │   ├── lld/templates-library/route.ts                      # NEW
│   │   └── lld/ai/suggest-nodes/route.ts                       # NEW
│   └── components/modules/lld/
│       ├── build/
│       │   ├── PatternLibraryDock.tsx                          # NEW
│       │   ├── PatternLibraryItem.tsx                          # NEW
│       │   ├── TemplateLoaderDialog.tsx                        # NEW
│       │   ├── AISuggestionsCard.tsx                           # NEW
│       │   ├── AutoLayoutMenu.tsx                              # NEW
│       │   ├── BuildExportMenu.tsx                             # NEW
│       │   ├── BuildActionsRail.tsx                            # NEW
│       │   ├── NamedSnapshotsDrawer.tsx                        # NEW
│       │   ├── NodeNotesPopover.tsx                            # NEW
│       │   ├── AnnotationLayer.tsx                             # NEW
│       │   └── AnnotationToolbar.tsx                           # NEW
│       └── modes/
│           └── BuildModeLayout.tsx                             # MODIFY (slot dock + rail)
```

**Design rationale for splits:**
- Build-specific UI lives in `components/modules/lld/build/` so Phase 5's studio rebuild can replace this folder wholesale without disturbing mode scaffolding.
- Presets module (`auto-layout-presets.ts`) separates data (preset list) from behaviour (hook) — testable in isolation.
- Three new DB tables instead of one JSONB blob on `diagrams`: designs have structured lifecycle (named, snapshotted, shared) that benefits from relational integrity; blob-shaped data would prevent later features (shared palette, snapshot diff).
- Annotations get their own table because they attach to designs, not nodes — a single design can accumulate hundreds of annotations that would bloat a `diagrams.content` JSONB beyond efficient load.
- Test colocation follows repo convention (`__tests__/` next to the thing being tested).

---

## Task 1: Create `lld_designs` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-designs.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-designs.ts`:

```typescript
/**
 * DB-020: LLD designs — named, savable canvas states authored in Build mode.
 *
 * A design is the top-level container: metadata (name, description,
 * template source) plus a pointer to its latest snapshot. Snapshots
 * (separate table) hold the actual node/edge JSON so history doesn't
 * bloat the hot-path row.
 *
 * `slug` is user-scoped unique, used for shareable URLs.
 * `status` tracks lifecycle: draft → active → archived.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldDesigns = pgTable(
  "lld_designs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),

    // Optional source tracking — which template the design was forked from.
    templateId: uuid("template_id"),

    // Lifecycle
    status: varchar("status", { length: 20 }).notNull().default("active"), // draft | active | archived
    isPinned: boolean("is_pinned").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastOpenedAt: timestamp("last_opened_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("lld_designs_user_slug_idx").on(t.userId, t.slug),
    index("lld_designs_user_updated_idx").on(t.userId, t.updatedAt),
    index("lld_designs_user_status_idx").on(t.userId, t.status),
  ],
);

export type LLDDesign = typeof lldDesigns.$inferSelect;
export type NewLLDDesign = typeof lldDesigns.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts`. Add, in alphabetical position among the other `export *` lines:

```typescript
export * from "./lld-designs";
```

- [ ] **Step 3: Add relation definition**

Open `architex/src/db/schema/relations.ts`. Add import at the top next to the other schema imports:

```typescript
import { lldDesigns } from "./lld-designs";
```

In the `usersRelations` `many` block, append:

```typescript
  lldDesigns: many(lldDesigns),
```

At the bottom of the file append:

```typescript
export const lldDesignsRelations = relations(lldDesigns, ({ one }) => ({
  user: one(users, {
    fields: [lldDesigns.userId],
    references: [users.id],
  }),
}));
```

- [ ] **Step 4: Verify schema compiles**

```bash
cd architex
pnpm typecheck
```
Expected: no errors. If errors, fix import paths.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-designs.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "$(cat <<'EOF'
feat(db): add lld_designs schema

Top-level container for user-authored Build-mode canvases. Tracks name,
slug (user-scoped unique for shareable URLs), description, template
source, lifecycle status, and pin/last-opened metadata. Snapshots live
in a sibling table (next task) so history doesn't bloat the hot path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Create `lld_design_snapshots` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-design-snapshots.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-design-snapshots.ts`:

```typescript
/**
 * DB-021: LLD design snapshots — immutable history entries.
 *
 * Every explicit save (name, ⌘S, auto-save tick) and every named
 * snapshot ("Before big refactor") writes a new row. Snapshots are
 * append-only; undo/redo mid-session uses the in-memory UndoManager,
 * while the user-visible "Snapshots" drawer reads from this table.
 *
 * `kind` distinguishes auto-save (silent) from user-named milestones.
 * Content lives in `canvasState` as the full React Flow node/edge JSON.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { lldDesigns } from "./lld-designs";
import { users } from "./users";

export const lldDesignSnapshots = pgTable(
  "lld_design_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => lldDesigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // "auto" = silent periodic save, "named" = user labelled this point.
    kind: varchar("kind", { length: 20 }).notNull().default("auto"),
    label: varchar("label", { length: 200 }),
    note: text("note"),

    canvasState: jsonb("canvas_state").notNull(),
    nodeCount: integer("node_count").notNull().default(0),
    edgeCount: integer("edge_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_design_snapshots_design_idx").on(t.designId, t.createdAt),
    index("lld_design_snapshots_user_kind_idx").on(t.userId, t.kind),
  ],
);

export type LLDDesignSnapshot = typeof lldDesignSnapshots.$inferSelect;
export type NewLLDDesignSnapshot = typeof lldDesignSnapshots.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Open `architex/src/db/schema/index.ts` and add:

```typescript
export * from "./lld-design-snapshots";
```

- [ ] **Step 3: Add relation definition**

Open `architex/src/db/schema/relations.ts`. Import:

```typescript
import { lldDesignSnapshots } from "./lld-design-snapshots";
```

Extend the existing `lldDesignsRelations` block to include snapshots:

```typescript
export const lldDesignsRelations = relations(lldDesigns, ({ one, many }) => ({
  user: one(users, {
    fields: [lldDesigns.userId],
    references: [users.id],
  }),
  snapshots: many(lldDesignSnapshots),
}));
```

At the bottom of the file add:

```typescript
export const lldDesignSnapshotsRelations = relations(
  lldDesignSnapshots,
  ({ one }) => ({
    design: one(lldDesigns, {
      fields: [lldDesignSnapshots.designId],
      references: [lldDesigns.id],
    }),
    user: one(users, {
      fields: [lldDesignSnapshots.userId],
      references: [users.id],
    }),
  }),
);
```

- [ ] **Step 4: Verify schema compiles**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-design-snapshots.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "feat(db): add lld_design_snapshots schema

Append-only snapshot history per design. Distinguishes 'auto' periodic
saves from 'named' user milestones. canvasState holds full React Flow
JSON; nodeCount/edgeCount enable cheap list rendering without parsing
every blob.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create `lld_templates_library` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-templates-library.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-templates-library.ts`:

```typescript
/**
 * DB-022: LLD templates library — curated blueprint catalog.
 *
 * This is the authoritative "Template Loader" source: ~60 curated
 * blueprints seeded from the existing file-based blueprints plus new
 * pattern-derived templates. Content is editable via admin tools later;
 * for now it's seeded from `src/db/seeds/lld-templates-library.ts`.
 *
 * `category` keys the dock tabs: "creational" | "structural" | "behavioral"
 * | "architecture" | "microservices" | "data" | "ai".
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lldTemplatesLibrary = pgTable(
  "lld_templates_library",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 40 }).notNull(),
    difficulty: varchar("difficulty", { length: 20 })
      .notNull()
      .default("intermediate"), // beginner | intermediate | advanced

    tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`), // string[]
    patternIds: jsonb("pattern_ids").notNull().default(sql`'[]'::jsonb`), // string[]

    canvasState: jsonb("canvas_state").notNull(),
    thumbnailSvg: text("thumbnail_svg"),

    isCurated: boolean("is_curated").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("lld_templates_library_slug_idx").on(t.slug),
    index("lld_templates_library_category_idx").on(t.category, t.sortOrder),
  ],
);

export type LLDTemplatesLibraryEntry = typeof lldTemplatesLibrary.$inferSelect;
export type NewLLDTemplatesLibraryEntry =
  typeof lldTemplatesLibrary.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

In `architex/src/db/schema/index.ts` add:

```typescript
export * from "./lld-templates-library";
```

- [ ] **Step 3: Skip relations**

Templates are user-agnostic — no relation needed. Do not add an entry to `relations.ts`.

- [ ] **Step 4: Verify schema compiles**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-templates-library.ts architex/src/db/schema/index.ts
git commit -m "feat(db): add lld_templates_library schema

User-agnostic curated blueprint catalog. Category/difficulty/tags drive
the Template Loader filter UI. canvasState is the full React Flow JSON
that gets dropped onto the canvas when a user picks a template.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create `lld_design_annotations` DB schema

**Files:**
- Create: `architex/src/db/schema/lld-design-annotations.ts`
- Modify: `architex/src/db/schema/index.ts`
- Modify: `architex/src/db/schema/relations.ts`

- [ ] **Step 1: Write the schema file**

Create `architex/src/db/schema/lld-design-annotations.ts`:

```typescript
/**
 * DB-023: LLD design annotations — floating notes attached to a design.
 *
 * Annotations are NOT nodes: they live on a separate visual layer above
 * the canvas, anchored either to a node (nodeId set) or to free-floating
 * (x,y) canvas coordinates. This lets users mark up a design with
 * commentary without polluting the structural graph.
 *
 * `kind` discriminates rendering: sticky-note | arrow | circle | text.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  real,
  index,
} from "drizzle-orm/pg-core";
import { lldDesigns } from "./lld-designs";
import { users } from "./users";

export const lldDesignAnnotations = pgTable(
  "lld_design_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => lldDesigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    kind: varchar("kind", { length: 30 }).notNull().default("sticky-note"),
    nodeId: varchar("node_id", { length: 100 }), // null = floating
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),

    body: text("body").notNull().default(""),
    color: varchar("color", { length: 20 }).notNull().default("amber"),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`), // shape/size options

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_design_annotations_design_idx").on(t.designId),
    index("lld_design_annotations_node_idx").on(t.designId, t.nodeId),
  ],
);

export type LLDDesignAnnotation = typeof lldDesignAnnotations.$inferSelect;
export type NewLLDDesignAnnotation =
  typeof lldDesignAnnotations.$inferInsert;
```

- [ ] **Step 2: Re-export**

In `architex/src/db/schema/index.ts` add:

```typescript
export * from "./lld-design-annotations";
```

- [ ] **Step 3: Add relation**

In `architex/src/db/schema/relations.ts` import:

```typescript
import { lldDesignAnnotations } from "./lld-design-annotations";
```

Extend `lldDesignsRelations` to include annotations:

```typescript
export const lldDesignsRelations = relations(lldDesigns, ({ one, many }) => ({
  user: one(users, {
    fields: [lldDesigns.userId],
    references: [users.id],
  }),
  snapshots: many(lldDesignSnapshots),
  annotations: many(lldDesignAnnotations),
}));
```

At bottom of file:

```typescript
export const lldDesignAnnotationsRelations = relations(
  lldDesignAnnotations,
  ({ one }) => ({
    design: one(lldDesigns, {
      fields: [lldDesignAnnotations.designId],
      references: [lldDesigns.id],
    }),
    user: one(users, {
      fields: [lldDesignAnnotations.userId],
      references: [users.id],
    }),
  }),
);
```

- [ ] **Step 4: Verify**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/schema/lld-design-annotations.ts architex/src/db/schema/index.ts architex/src/db/schema/relations.ts
git commit -m "feat(db): add lld_design_annotations schema

Floating note/arrow/circle annotations attached to a design. Separate
layer from the structural graph so commentary doesn't pollute node/edge
topology. nodeId optional (anchored vs floating); (x,y) always set.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Generate and apply all four migrations

**Files:**
- Generated: `architex/drizzle/NNNN_add_lld_designs.sql`
- Generated: `architex/drizzle/NNNN_add_lld_design_snapshots.sql`
- Generated: `architex/drizzle/NNNN_add_lld_templates_library.sql`
- Generated: `architex/drizzle/NNNN_add_lld_design_annotations.sql`

- [ ] **Step 1: Generate migrations**

Run:
```bash
cd architex
pnpm db:generate
```
Expected: 4 new SQL files appear in `architex/drizzle/`, one per table. Drizzle picks up all pending schema changes in a single run.

- [ ] **Step 2: Review the SQL**

Open each file in order and confirm:
- `CREATE TABLE "lld_designs"` with `user_slug_idx` UNIQUE
- `CREATE TABLE "lld_design_snapshots"` with `design_idx` on `(design_id, created_at)`
- `CREATE TABLE "lld_templates_library"` with `slug_idx` UNIQUE
- `CREATE TABLE "lld_design_annotations"` with `design_idx` and `node_idx`
- All foreign keys present with `ON DELETE CASCADE`

If anything is missing, delete the generated files and re-run `pnpm db:generate` after fixing the schema files.

- [ ] **Step 3: Apply migrations to dev DB**

```bash
pnpm db:push
```
Expected: migrations apply cleanly. If `users` or existing tables collide, verify Phase 1 migrations ran first.

- [ ] **Step 4: Verify tables via Drizzle Studio**

```bash
pnpm db:studio
```
Open <https://local.drizzle.studio>. Confirm 4 new tables exist in sidebar with correct columns and 0 rows.

- [ ] **Step 5: Commit**

```bash
git add architex/drizzle/
git commit -m "feat(db): generate and apply Phase 3 migrations

Adds lld_designs, lld_design_snapshots, lld_templates_library,
lld_design_annotations. All foreign keys cascade on user/design delete.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---
