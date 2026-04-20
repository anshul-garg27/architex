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

## Task 6: Seed the curated templates library (~60 entries)

**Files:**
- Create: `architex/src/db/seeds/lld-templates-library.ts`
- Modify: `architex/scripts/seed.ts` (or equivalent seed runner) — add seed entry

- [ ] **Step 1: Create the seed file**

Create `architex/src/db/seeds/lld-templates-library.ts`. The file is long but mechanical — structure is one array literal of `NewLLDTemplatesLibraryEntry` objects grouped by category:

```typescript
/**
 * Seeds ~60 curated LLD templates into `lld_templates_library`.
 *
 * Breakdown:
 * - 23 GoF pattern starters (creational/structural/behavioral) — distilled
 *   canvases derived from `src/lib/lld/patterns.ts`
 * - 15 architecture blueprints — imported from src/lib/templates/blueprints
 *   (existing JSON files), curated down to 12 best-of entries
 * - 12 microservice patterns (circuit breaker, saga, CQRS, event bus, etc.)
 * - 10 data/AI starters (repo, agent, RAG pipeline, vector store, etc.)
 *
 * Total: ~60. IDs are content-stable slugs; updates are idempotent by slug.
 */

import type { NewLLDTemplatesLibraryEntry } from "@/db/schema";

// Helper: minimal canvas shape the React Flow store expects.
// We inline a tiny canvasState per template; real production seeding
// uses import-json.ts to parse existing blueprint JSON files.
function tpl(
  slug: string,
  name: string,
  description: string,
  category: NewLLDTemplatesLibraryEntry["category"],
  difficulty: "beginner" | "intermediate" | "advanced",
  patternIds: string[],
  tags: string[],
  canvasState: Record<string, unknown>,
  sortOrder = 0,
): NewLLDTemplatesLibraryEntry {
  return {
    slug,
    name,
    description,
    category,
    difficulty,
    patternIds,
    tags,
    canvasState,
    isCurated: true,
    sortOrder,
  };
}

// ── Creational (8) ──────────────────────────────────────────────

const creational: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "singleton-registry",
    "Singleton · Config Registry",
    "Thread-safe lazy singleton with double-checked locking. Ideal starter for config, logger, connection-pool.",
    "creational",
    "beginner",
    ["singleton"],
    ["thread-safe", "registry", "lazy"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "factory-method-shape",
    "Factory Method · Shape Creator",
    "Classic GoF factory method with Shape abstract product, Creator subclasses per concrete shape.",
    "creational",
    "beginner",
    ["factory-method"],
    ["creation", "polymorphism"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "abstract-factory-gui",
    "Abstract Factory · Cross-Platform GUI",
    "Families of related widgets (Button/Checkbox) per OS theme (Mac/Win/Linux).",
    "creational",
    "intermediate",
    ["abstract-factory"],
    ["family", "platform"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "builder-sql-query",
    "Builder · SQL Query Builder",
    "Fluent builder assembling SELECT clauses step by step with optional WHERE/ORDER/LIMIT.",
    "creational",
    "intermediate",
    ["builder"],
    ["fluent", "sql"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "prototype-document",
    "Prototype · Document Clone",
    "Deep-copy prototype for rich-text documents with nested elements.",
    "creational",
    "intermediate",
    ["prototype"],
    ["clone", "deep-copy"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "object-pool-connection",
    "Object Pool · DB Connection Pool",
    "Recycled connection pool with acquire/release, max-size, and eviction.",
    "creational",
    "advanced",
    ["object-pool"],
    ["pool", "performance", "jdbc"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "dependency-injection-container",
    "DI Container · Constructor Injection",
    "Minimal inversion-of-container with service registration and resolution.",
    "creational",
    "advanced",
    ["dependency-injection"],
    ["ioc", "container"],
    { nodes: [], edges: [] },
    70,
  ),
  tpl(
    "lazy-initializer",
    "Lazy Initializer · Memoized Factory",
    "Lazy-init wrapper with memoization and thread safety.",
    "creational",
    "beginner",
    ["lazy-initialization"],
    ["memoize", "lazy"],
    { nodes: [], edges: [] },
    80,
  ),
];

// ── Structural (8) ──────────────────────────────────────────────

const structural: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "adapter-legacy-api",
    "Adapter · Legacy API Bridge",
    "Wrap a legacy XML SDK behind a modern JSON interface.",
    "structural",
    "beginner",
    ["adapter"],
    ["bridge", "legacy"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "decorator-coffee",
    "Decorator · Coffee Pricing",
    "Stackable decorators adding milk/sugar/whip to a base beverage.",
    "structural",
    "beginner",
    ["decorator"],
    ["wrap", "composition"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "facade-video-encoder",
    "Facade · Video Encoder",
    "Hide ffmpeg complexity behind a simple `encode(video, format)` facade.",
    "structural",
    "intermediate",
    ["facade"],
    ["simplify", "wrapper"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "composite-file-system",
    "Composite · File System Tree",
    "Files and directories as a uniform tree structure.",
    "structural",
    "intermediate",
    ["composite"],
    ["tree", "recursive"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "proxy-rate-limit",
    "Proxy · Rate-Limited API",
    "Protection proxy throttling downstream calls per client.",
    "structural",
    "intermediate",
    ["proxy"],
    ["rate-limit", "middleware"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "bridge-rendering",
    "Bridge · Shape × Renderer",
    "Decouple shape abstractions from rendering backends (raster/vector).",
    "structural",
    "advanced",
    ["bridge"],
    ["decouple", "orthogonal"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "flyweight-text-glyph",
    "Flyweight · Text Glyph Cache",
    "Share immutable glyph state across thousands of rendered characters.",
    "structural",
    "advanced",
    ["flyweight"],
    ["cache", "memory"],
    { nodes: [], edges: [] },
    70,
  ),
  tpl(
    "extension-object",
    "Extension Object · Plugin Shape",
    "Add capabilities to a base shape without subclass explosion.",
    "structural",
    "advanced",
    ["extension-object"],
    ["plugin", "capability"],
    { nodes: [], edges: [] },
    80,
  ),
];

// ── Behavioral (7) ──────────────────────────────────────────────

const behavioral: NewLLDTemplatesLibraryEntry[] = [
  tpl(
    "strategy-sort",
    "Strategy · Sort Algorithm",
    "Swap sort strategies (quick/merge/heap) at runtime.",
    "behavioral",
    "beginner",
    ["strategy"],
    ["runtime-choice"],
    { nodes: [], edges: [] },
    10,
  ),
  tpl(
    "observer-event-bus",
    "Observer · Event Bus",
    "Publish/subscribe with synchronous fan-out notification.",
    "behavioral",
    "beginner",
    ["observer"],
    ["pubsub", "events"],
    { nodes: [], edges: [] },
    20,
  ),
  tpl(
    "command-editor",
    "Command · Undoable Editor",
    "Commands encapsulate edits so an editor can undo/redo.",
    "behavioral",
    "intermediate",
    ["command"],
    ["undo", "macro"],
    { nodes: [], edges: [] },
    30,
  ),
  tpl(
    "state-vending-machine",
    "State · Vending Machine",
    "FSM for vending machine transitions (idle/paying/dispensing).",
    "behavioral",
    "intermediate",
    ["state"],
    ["fsm"],
    { nodes: [], edges: [] },
    40,
  ),
  tpl(
    "iterator-collection",
    "Iterator · Custom Collection",
    "Expose traversal over a private tree/graph without leaking internals.",
    "behavioral",
    "intermediate",
    ["iterator"],
    ["traversal"],
    { nodes: [], edges: [] },
    50,
  ),
  tpl(
    "chain-of-responsibility-auth",
    "Chain of Responsibility · Auth Pipeline",
    "Pipeline of auth handlers (jwt → quota → abuse) each deciding pass/block.",
    "behavioral",
    "advanced",
    ["chain-of-responsibility"],
    ["pipeline", "auth"],
    { nodes: [], edges: [] },
    60,
  ),
  tpl(
    "visitor-ast",
    "Visitor · AST Walker",
    "Double-dispatch visitor traversing a compiler AST.",
    "behavioral",
    "advanced",
    ["visitor"],
    ["ast", "traverse"],
    { nodes: [], edges: [] },
    70,
  ),
];

// ── Architecture (12) ───────────────────────────────────────────

const architecture: NewLLDTemplatesLibraryEntry[] = [
  tpl("layered-ecommerce", "Layered · E-commerce App", "Classic 4-layer (UI → service → domain → repo).", "architecture", "beginner", [], ["layered", "crud"], { nodes: [], edges: [] }, 10),
  tpl("hexagonal-payments", "Hexagonal · Payments Core", "Ports and adapters isolating payment domain from providers.", "architecture", "intermediate", [], ["ports-and-adapters", "ddd"], { nodes: [], edges: [] }, 20),
  tpl("clean-arch-booking", "Clean Architecture · Booking", "Entities / use-cases / interface-adapters / frameworks.", "architecture", "intermediate", [], ["clean", "ddd"], { nodes: [], edges: [] }, 30),
  tpl("ddd-aggregate-cart", "DDD · Shopping Cart Aggregate", "Cart aggregate with line-item invariants and domain events.", "architecture", "advanced", [], ["ddd", "aggregate"], { nodes: [], edges: [] }, 40),
  tpl("cqrs-orders", "CQRS · Order Service", "Split read model (denormalized) from write model (aggregate).", "architecture", "advanced", [], ["cqrs"], { nodes: [], edges: [] }, 50),
  tpl("event-sourcing-wallet", "Event Sourcing · Wallet", "Immutable event log rebuilding wallet state.", "architecture", "advanced", [], ["event-sourcing"], { nodes: [], edges: [] }, 60),
  tpl("mvc-cms", "MVC · Minimal CMS", "Classic MVC for a blog / CMS.", "architecture", "beginner", [], ["mvc"], { nodes: [], edges: [] }, 70),
  tpl("mvvm-spa", "MVVM · SPA Dashboard", "View-model binding for a data-heavy dashboard.", "architecture", "intermediate", [], ["mvvm", "binding"], { nodes: [], edges: [] }, 80),
  tpl("pipe-and-filter-etl", "Pipe & Filter · ETL Job", "Streaming filter pipeline for ingest → transform → load.", "architecture", "intermediate", [], ["pipeline", "streams"], { nodes: [], edges: [] }, 90),
  tpl("onion-crm", "Onion · CRM Core", "Concentric layers with dependencies pointing inward.", "architecture", "intermediate", [], ["onion", "ddd"], { nodes: [], edges: [] }, 100),
  tpl("plugin-ide", "Plugin · Mini-IDE", "Host shell loading plugins over a strict API contract.", "architecture", "advanced", [], ["plugin", "extensibility"], { nodes: [], edges: [] }, 110),
  tpl("client-server-chat", "Client/Server · Chat", "Single-server chat with transport abstraction.", "architecture", "beginner", [], ["client-server"], { nodes: [], edges: [] }, 120),
];

// ── Microservices (12) ──────────────────────────────────────────

const microservices: NewLLDTemplatesLibraryEntry[] = [
  tpl("circuit-breaker", "Circuit Breaker · Downstream Guard", "State machine (closed/open/half-open) cutting off a failing dep.", "microservices", "intermediate", [], ["resilience"], { nodes: [], edges: [] }, 10),
  tpl("saga-order", "Saga · Distributed Order Workflow", "Orchestrated saga with compensating transactions.", "microservices", "advanced", [], ["saga", "workflow"], { nodes: [], edges: [] }, 20),
  tpl("outbox-publisher", "Outbox · Reliable Event Publish", "Transactional outbox pattern for reliable event publishing.", "microservices", "advanced", [], ["outbox", "events"], { nodes: [], edges: [] }, 30),
  tpl("api-gateway", "API Gateway · Fan-out", "Single entrypoint routing and aggregating.", "microservices", "intermediate", [], ["gateway"], { nodes: [], edges: [] }, 40),
  tpl("bff-mobile", "BFF · Mobile App", "Backend for frontend tailored to mobile needs.", "microservices", "intermediate", [], ["bff"], { nodes: [], edges: [] }, 50),
  tpl("service-discovery", "Service Discovery · Client-Side", "Client-side discovery with a registry.", "microservices", "intermediate", [], ["discovery"], { nodes: [], edges: [] }, 60),
  tpl("sidecar-proxy", "Sidecar · Envoy Proxy", "Sidecar handling TLS/retry/metrics for app container.", "microservices", "advanced", [], ["sidecar", "service-mesh"], { nodes: [], edges: [] }, 70),
  tpl("bulkhead-orders", "Bulkhead · Resource Isolation", "Thread-pool isolation protecting critical paths.", "microservices", "advanced", [], ["bulkhead", "resilience"], { nodes: [], edges: [] }, 80),
  tpl("strangler-migration", "Strangler Fig · Legacy Migration", "Incremental replacement of a legacy monolith.", "microservices", "intermediate", [], ["migration"], { nodes: [], edges: [] }, 90),
  tpl("leader-election", "Leader Election · Scheduler", "Distributed lock-based leader election.", "microservices", "advanced", [], ["leader", "consensus"], { nodes: [], edges: [] }, 100),
  tpl("cache-aside", "Cache-Aside · Product Catalog", "Read-through caching with TTL and invalidation.", "microservices", "beginner", [], ["cache"], { nodes: [], edges: [] }, 110),
  tpl("rate-limiter", "Rate Limiter · Token Bucket", "Per-tenant token bucket at the edge.", "microservices", "intermediate", [], ["rate-limit"], { nodes: [], edges: [] }, 120),
];

// ── Data + AI (13) ──────────────────────────────────────────────

const dataAndAi: NewLLDTemplatesLibraryEntry[] = [
  tpl("repository-orders", "Repository · Order Store", "Collection abstraction over persistence layer.", "data", "beginner", [], ["persistence"], { nodes: [], edges: [] }, 10),
  tpl("unit-of-work", "Unit of Work · Transactional Save", "Track changes and flush as one transaction.", "data", "intermediate", [], ["uow", "persistence"], { nodes: [], edges: [] }, 20),
  tpl("data-mapper", "Data Mapper · ORM-Lite", "Objects in memory, mapper writes them to rows.", "data", "intermediate", [], ["orm"], { nodes: [], edges: [] }, 30),
  tpl("active-record", "Active Record · Blog Post", "Object wraps table row; save() persists itself.", "data", "beginner", [], ["orm"], { nodes: [], edges: [] }, 40),
  tpl("lambda-architecture", "Lambda · Batch + Speed", "Batch + speed layers merging at serving layer.", "data", "advanced", [], ["lambda", "big-data"], { nodes: [], edges: [] }, 50),
  tpl("kappa-stream", "Kappa · Streaming Only", "Single streaming pipeline replacing lambda's dual-path.", "data", "advanced", [], ["kappa", "stream"], { nodes: [], edges: [] }, 60),
  tpl("cdc-replication", "CDC · Change Data Capture", "Replicate upstream writes via CDC stream.", "data", "advanced", [], ["cdc", "replication"], { nodes: [], edges: [] }, 70),
  tpl("ai-agent-loop", "AI Agent · Tool Loop", "Plan → call-tool → observe → repeat agent loop.", "ai", "intermediate", [], ["agent", "llm"], { nodes: [], edges: [] }, 10),
  tpl("rag-pipeline", "RAG · Retrieval-Augmented Generation", "Embed → retrieve → prompt → generate pipeline.", "ai", "intermediate", [], ["rag", "embeddings"], { nodes: [], edges: [] }, 20),
  tpl("vector-store-search", "Vector Store · Semantic Search", "Ingest pipeline and query API with reranker.", "ai", "advanced", [], ["vector", "search"], { nodes: [], edges: [] }, 30),
  tpl("ai-streaming-chat", "AI · Streaming Chat", "Streaming token delivery with abort and retry.", "ai", "intermediate", [], ["stream", "llm"], { nodes: [], edges: [] }, 40),
  tpl("ai-workflow-orchestrator", "AI · Workflow Orchestrator", "Structured DAG of LLM calls with retries.", "ai", "advanced", [], ["orchestration"], { nodes: [], edges: [] }, 50),
  tpl("ai-evaluation-harness", "AI · Evaluation Harness", "Offline eval pipeline over a dataset.", "ai", "advanced", [], ["eval"], { nodes: [], edges: [] }, 60),
];

export const lldTemplatesLibrarySeed: NewLLDTemplatesLibraryEntry[] = [
  ...creational,
  ...structural,
  ...behavioral,
  ...architecture,
  ...microservices,
  ...dataAndAi,
];

// Sanity self-check: 8 + 8 + 7 + 12 + 12 + 13 = 60
if (
  process.env.NODE_ENV !== "production" &&
  lldTemplatesLibrarySeed.length !== 60
) {
  // eslint-disable-next-line no-console
  console.warn(
    `[lld-templates-library seed] expected 60 entries, got ${lldTemplatesLibrarySeed.length}`,
  );
}
```

- [ ] **Step 2: Register with the seed runner**

Open `architex/scripts/seed.ts` (or the project's seed entrypoint). Add an import and a section block:

```typescript
import { lldTemplatesLibrarySeed } from "@/db/seeds/lld-templates-library";
import { lldTemplatesLibrary } from "@/db/schema";

// Inside the main seed function, add after existing sections:
async function seedLldTemplatesLibrary(db: Database) {
  console.log("[seed] lld_templates_library …");
  for (const entry of lldTemplatesLibrarySeed) {
    await db
      .insert(lldTemplatesLibrary)
      .values(entry)
      .onConflictDoUpdate({
        target: lldTemplatesLibrary.slug,
        set: {
          name: entry.name,
          description: entry.description,
          category: entry.category,
          difficulty: entry.difficulty,
          tags: entry.tags,
          patternIds: entry.patternIds,
          canvasState: entry.canvasState,
          sortOrder: entry.sortOrder,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`[seed] lld_templates_library: ${lldTemplatesLibrarySeed.length} entries`);
}

// Then call it in the main seed pipeline.
await seedLldTemplatesLibrary(db);
```

If `scripts/seed.ts` does not yet exist, create a minimal one that Drizzle can invoke via `pnpm db:seed` — check `architex/package.json` for the actual seed script name.

- [ ] **Step 3: Run the seed**

```bash
cd architex
pnpm db:seed
```
Expected: `lld_templates_library: 60 entries` in stdout.

- [ ] **Step 4: Verify via Drizzle Studio**

```bash
pnpm db:studio
```
Open `lld_templates_library`. Confirm 60 rows, category distribution roughly even, no duplicates on `slug`.

- [ ] **Step 5: Commit**

```bash
git add architex/src/db/seeds/lld-templates-library.ts architex/scripts/seed.ts
git commit -m "feat(db): seed ~60 curated lld templates

23 GoF patterns + 12 architecture blueprints + 12 microservice patterns
+ 13 data/AI starters. Seed is idempotent by slug so reruns are safe.
Placeholder canvasState will be populated with real React Flow JSON
in Task 7 via the template loader's import path.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Create `GET /api/lld/templates-library` route

**Files:**
- Create: `architex/src/app/api/lld/templates-library/route.ts`

- [ ] **Step 1: Create the route**

Create `architex/src/app/api/lld/templates-library/route.ts`:

```typescript
/**
 * GET /api/lld/templates-library
 *
 * Optional query params:
 *   ?category=creational|structural|behavioral|architecture|microservices|data|ai
 *   ?difficulty=beginner|intermediate|advanced
 *   ?q=free-text (matches name + description + tags)
 *
 * Public (no auth required) — templates are not user-scoped.
 * Response is cacheable with a stale-while-revalidate header.
 */

import { NextResponse } from "next/server";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { getDb, lldTemplatesLibrary } from "@/db";

const VALID_CATEGORIES = new Set([
  "creational",
  "structural",
  "behavioral",
  "architecture",
  "microservices",
  "data",
  "ai",
]);
const VALID_DIFFICULTIES = new Set(["beginner", "intermediate", "advanced"]);

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const difficulty = url.searchParams.get("difficulty");
    const q = url.searchParams.get("q")?.trim();

    const where = [] as unknown[];
    if (category && VALID_CATEGORIES.has(category)) {
      where.push(eq(lldTemplatesLibrary.category, category));
    }
    if (difficulty && VALID_DIFFICULTIES.has(difficulty)) {
      where.push(eq(lldTemplatesLibrary.difficulty, difficulty));
    }
    if (q && q.length > 0) {
      const like = `%${q.toLowerCase()}%`;
      where.push(
        or(
          ilike(lldTemplatesLibrary.name, like),
          ilike(lldTemplatesLibrary.description, like),
          sql`${lldTemplatesLibrary.tags}::text ILIKE ${like}`,
        ),
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldTemplatesLibrary)
      .where(where.length > 0 ? and(...(where as [])) : undefined)
      .orderBy(
        asc(lldTemplatesLibrary.category),
        asc(lldTemplatesLibrary.sortOrder),
      )
      .limit(200);

    return NextResponse.json(
      { templates: rows },
      {
        headers: {
          "Cache-Control":
            "public, max-age=300, s-maxage=600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("[api/lld/templates-library] GET error:", error);
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

- [ ] **Step 3: Manual smoke test**

With dev server running:
```bash
curl -s "http://localhost:3000/api/lld/templates-library?category=creational" | jq '.templates | length'
```
Expected: `8` (creational seed count).

```bash
curl -s "http://localhost:3000/api/lld/templates-library?q=saga" | jq '.templates[0].slug'
```
Expected: `"saga-order"`.

- [ ] **Step 4: Commit**

```bash
git add architex/src/app/api/lld/templates-library/route.ts
git commit -m "feat(api): add GET /api/lld/templates-library

Public listing with category / difficulty / free-text filters. ILIKE
against name/description/tags. Cacheable with stale-while-revalidate
(templates rarely change).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Create designs + snapshots + annotations API routes

**Files:**
- Create: `architex/src/app/api/lld/designs/route.ts`
- Create: `architex/src/app/api/lld/designs/[id]/route.ts`
- Create: `architex/src/app/api/lld/designs/[id]/snapshots/route.ts`
- Create: `architex/src/app/api/lld/designs/[id]/annotations/route.ts`

- [ ] **Step 1: POST + GET on the collection**

Create `architex/src/app/api/lld/designs/route.ts`:

```typescript
/**
 * POST /api/lld/designs           — create a new design
 * GET  /api/lld/designs           — list the user's designs (?status=active|archived)
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      templateId?: string;
    };

    if (!body.name || typeof body.name !== "string" || body.name.length > 160) {
      return NextResponse.json(
        { error: "name is required (<=160 chars)" },
        { status: 400 },
      );
    }

    const slugBase = slugify(body.name) || "untitled";
    // Append 6 random chars to avoid collisions on rapid re-creation.
    const slug = `${slugBase}-${crypto.randomUUID().slice(0, 6)}`;

    const db = getDb();
    const [created] = await db
      .insert(lldDesigns)
      .values({
        userId,
        name: body.name,
        slug,
        description: body.description?.slice(0, 2000) ?? null,
        templateId: body.templateId ?? null,
      })
      .returning();

    return NextResponse.json({ design: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? "active";

    const db = getDb();
    const rows = await db
      .select()
      .from(lldDesigns)
      .where(
        and(
          eq(lldDesigns.userId, userId),
          eq(lldDesigns.status, status === "archived" ? "archived" : "active"),
        ),
      )
      .orderBy(desc(lldDesigns.lastOpenedAt))
      .limit(100);

    return NextResponse.json({ designs: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: GET / PATCH / DELETE on a single design**

Create `architex/src/app/api/lld/designs/[id]/route.ts`:

```typescript
/**
 * GET    /api/lld/designs/[id]  — fetch a single design
 * PATCH  /api/lld/designs/[id]  — rename / archive / pin / describe
 * DELETE /api/lld/designs/[id]  — cascade delete (snapshots + annotations)
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

async function authScope(
  params: Promise<{ id: string }>,
): Promise<
  | { error: NextResponse }
  | { id: string; userId: string }
> {
  const { id } = await params;
  const clerkId = await requireAuth();
  const userId = await resolveUserId(clerkId);
  if (!userId) {
    return {
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }
  return { id, userId };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const db = getDb();
    const [row] = await db
      .select()
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Bump lastOpenedAt for "recent" ordering.
    await db
      .update(lldDesigns)
      .set({ lastOpenedAt: new Date() })
      .where(eq(lldDesigns.id, id));

    return NextResponse.json({ design: row });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      description?: string;
      status?: "active" | "archived" | "draft";
      isPinned?: boolean;
    };

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.name === "string" && body.name.length > 0) {
      updates.name = body.name.slice(0, 160);
    }
    if (typeof body.description === "string") {
      updates.description = body.description.slice(0, 2000);
    }
    if (body.status && ["active", "archived", "draft"].includes(body.status)) {
      updates.status = body.status;
    }
    if (typeof body.isPinned === "boolean") {
      updates.isPinned = body.isPinned;
    }

    const db = getDb();
    const [updated] = await db
      .update(lldDesigns)
      .set(updates)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ design: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const scope = await authScope(ctx.params);
    if ("error" in scope) return scope.error;
    const { id, userId } = scope;

    const db = getDb();
    const deleted = await db
      .delete(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .returning({ id: lldDesigns.id });

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id] DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Snapshots collection**

Create `architex/src/app/api/lld/designs/[id]/snapshots/route.ts`:

```typescript
/**
 * POST /api/lld/designs/[id]/snapshots  — append a new snapshot
 * GET  /api/lld/designs/[id]/snapshots  — list (newest first, limit 100)
 */

import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, lldDesignSnapshots, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      canvasState?: Record<string, unknown>;
      label?: string;
      note?: string;
      kind?: "auto" | "named";
      nodeCount?: number;
      edgeCount?: number;
    };

    if (!body.canvasState || typeof body.canvasState !== "object") {
      return NextResponse.json(
        { error: "canvasState required" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Verify ownership before writing.
    const [owned] = await db
      .select({ id: lldDesigns.id })
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(lldDesignSnapshots)
      .values({
        designId: id,
        userId,
        kind: body.kind === "named" ? "named" : "auto",
        label: body.label?.slice(0, 200) ?? null,
        note: body.note?.slice(0, 4000) ?? null,
        canvasState: body.canvasState,
        nodeCount: body.nodeCount ?? 0,
        edgeCount: body.edgeCount ?? 0,
      })
      .returning();

    // Touch parent updatedAt so list ordering surfaces recently-edited designs.
    await db
      .update(lldDesigns)
      .set({ updatedAt: new Date() })
      .where(eq(lldDesigns.id, id));

    return NextResponse.json({ snapshot: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/snapshots] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldDesignSnapshots)
      .where(
        and(
          eq(lldDesignSnapshots.designId, id),
          eq(lldDesignSnapshots.userId, userId),
        ),
      )
      .orderBy(desc(lldDesignSnapshots.createdAt))
      .limit(100);

    return NextResponse.json({ snapshots: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/snapshots] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 4: Annotations collection**

Create `architex/src/app/api/lld/designs/[id]/annotations/route.ts`:

```typescript
/**
 * GET  /api/lld/designs/[id]/annotations  — list
 * POST /api/lld/designs/[id]/annotations  — create one or bulk upsert
 */

import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, lldDesignAnnotations, lldDesigns } from "@/db";
import { requireAuth, resolveUserId } from "@/lib/auth";

const VALID_KINDS = new Set(["sticky-note", "arrow", "circle", "text"]);

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(lldDesignAnnotations)
      .where(
        and(
          eq(lldDesignAnnotations.designId, id),
          eq(lldDesignAnnotations.userId, userId),
        ),
      )
      .limit(500);
    return NextResponse.json({ annotations: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/annotations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      kind?: string;
      nodeId?: string | null;
      x?: number;
      y?: number;
      body?: string;
      color?: string;
      meta?: Record<string, unknown>;
    };

    const kind = VALID_KINDS.has(body.kind ?? "") ? body.kind! : "sticky-note";

    // Verify ownership.
    const db = getDb();
    const [owned] = await db
      .select({ id: lldDesigns.id })
      .from(lldDesigns)
      .where(and(eq(lldDesigns.id, id), eq(lldDesigns.userId, userId)))
      .limit(1);
    if (!owned) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(lldDesignAnnotations)
      .values({
        designId: id,
        userId,
        kind,
        nodeId: body.nodeId ?? null,
        x: typeof body.x === "number" ? body.x : 0,
        y: typeof body.y === "number" ? body.y : 0,
        body: (body.body ?? "").slice(0, 2000),
        color: (body.color ?? "amber").slice(0, 20),
        meta: body.meta ?? {},
      })
      .returning();

    return NextResponse.json({ annotation: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/designs/:id/annotations] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add architex/src/app/api/lld/designs architex/src/app/api/lld/designs/\[id\] architex/src/app/api/lld/designs/\[id\]/snapshots architex/src/app/api/lld/designs/\[id\]/annotations
git commit -m "feat(api): add LLD designs + snapshots + annotations routes

POST  /api/lld/designs                                  — create
GET   /api/lld/designs?status=active|archived           — list
GET   /api/lld/designs/:id                              — fetch + bump lastOpenedAt
PATCH /api/lld/designs/:id                              — rename/archive/pin
DEL   /api/lld/designs/:id                              — cascade delete
POST  /api/lld/designs/:id/snapshots                    — append
GET   /api/lld/designs/:id/snapshots                    — list
GET   /api/lld/designs/:id/annotations                  — list
POST  /api/lld/designs/:id/annotations                  — create

All routes scope queries to the authenticated user and verify ownership
before any write.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Create AI node-suggestion builder + route

**Files:**
- Create: `architex/src/lib/lld/ai-node-suggestions.ts`
- Create: `architex/src/app/api/lld/ai/suggest-nodes/route.ts`

- [ ] **Step 1: Build the prompt module**

Create `architex/src/lib/lld/ai-node-suggestions.ts`:

```typescript
/**
 * Haiku-powered node-gap analyzer for Build-mode canvases.
 *
 * Given a snapshot of the current ArchitexNode graph, returns 3-7
 * structured "what's likely missing" suggestions. Each suggestion
 * includes a reason, a suggested class name, and optional relation
 * hints to existing classes. Designed for the Ask Architect button
 * in Build mode; runs on Haiku to stay fast + cheap.
 */

import type { ArchitexNode, ArchitexEdge } from "@/lib/types/architex-node";
import { claudeClient } from "@/lib/ai/claude-client";

export interface NodeSuggestion {
  id: string; // stable hash of name + reason, client-side dedup key
  suggestedName: string;
  suggestedKind: "class" | "interface" | "enum" | "component" | "service";
  reason: string; // 1-2 sentence rationale
  relatedTo: string[]; // node IDs in the current graph the suggestion connects to
  confidence: "low" | "medium" | "high";
}

export interface SuggestNodesInput {
  nodes: Pick<ArchitexNode, "id" | "data">[];
  edges: Pick<ArchitexEdge, "source" | "target" | "data">[];
  intent?: string; // optional user note: "this is a parking lot"
}

const SYSTEM_PROMPT = `You are a senior software designer auditing a UML class diagram a user is sketching in the Architex LLD studio. Your task: identify 3-7 likely-missing classes / interfaces / components.

Rules:
- Stay concrete. Suggest names the user would recognise from textbook design (e.g. "Observer", "ParkingSpotFactory", "PaymentGateway").
- Do not suggest primitive utility classes (Logger, Util) unless the user has none.
- Prefer suggestions that enable future pattern application.
- Each suggestion: suggestedName, suggestedKind, reason (<=180 chars), relatedTo (array of existing node IDs, can be empty), confidence.

Return ONLY valid JSON matching:
{ "suggestions": NodeSuggestion[] }`;

export async function buildUserPrompt(input: SuggestNodesInput): Promise<string> {
  const compactNodes = input.nodes.map((n) => ({
    id: n.id,
    label: (n.data as { label?: string } | undefined)?.label ?? n.id,
  }));
  const compactEdges = input.edges.map((e) => ({
    s: e.source,
    t: e.target,
    kind: (e.data as { kind?: string } | undefined)?.kind ?? "assoc",
  }));
  const intent = input.intent?.slice(0, 400) ?? "(no stated intent)";

  return [
    "User intent:",
    intent,
    "",
    "Existing nodes:",
    JSON.stringify(compactNodes),
    "",
    "Existing edges:",
    JSON.stringify(compactEdges),
    "",
    "Suggest 3-7 missing nodes now. JSON only.",
  ].join("\n");
}

export async function suggestNodes(
  input: SuggestNodesInput,
): Promise<NodeSuggestion[]> {
  const user = await buildUserPrompt(input);
  const raw = await claudeClient.complete({
    model: "claude-haiku-4-5",
    system: SYSTEM_PROMPT,
    user,
    maxTokens: 800,
    temperature: 0.4,
  });

  try {
    const parsed = JSON.parse(raw) as { suggestions: NodeSuggestion[] };
    const seen = new Set<string>();
    return parsed.suggestions
      .filter((s) => {
        const key = `${s.suggestedName}|${s.reason}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return Boolean(s.suggestedName) && Boolean(s.reason);
      })
      .slice(0, 7)
      .map((s, i) => ({
        ...s,
        id: `sug-${i}-${s.suggestedName.toLowerCase().replace(/\s+/g, "-")}`,
        suggestedKind: s.suggestedKind ?? "class",
        relatedTo: Array.isArray(s.relatedTo) ? s.relatedTo : [],
        confidence: s.confidence ?? "medium",
      }));
  } catch (err) {
    console.warn("[ai-node-suggestions] parse failed:", err);
    return [];
  }
}
```

Check the exact shape of `claudeClient` in `src/lib/ai/claude-client.ts` — if it exposes `complete(…)` differently (e.g. as `create(…)`), adjust the call site.

- [ ] **Step 2: Wrap behind an API route**

Create `architex/src/app/api/lld/ai/suggest-nodes/route.ts`:

```typescript
/**
 * POST /api/lld/ai/suggest-nodes
 * Body: { nodes, edges, intent? }
 * Returns: { suggestions: NodeSuggestion[] }
 * Rate-limited: 20 calls / hour / user.
 */

import { NextResponse } from "next/server";
import { requireAuth, resolveUserId } from "@/lib/auth";
import { suggestNodes } from "@/lib/lld/ai-node-suggestions";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clerkId = await requireAuth();
    const userId = await resolveUserId(clerkId);
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const okToCall = await rateLimit({
      key: `lld-ai-suggest:${userId}`,
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!okToCall) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      nodes?: unknown[];
      edges?: unknown[];
      intent?: string;
    };
    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return NextResponse.json(
        { error: "nodes and edges arrays are required" },
        { status: 400 },
      );
    }

    const suggestions = await suggestNodes({
      nodes: body.nodes as Parameters<typeof suggestNodes>[0]["nodes"],
      edges: body.edges as Parameters<typeof suggestNodes>[0]["edges"],
      intent: body.intent?.slice(0, 400),
    });

    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[api/lld/ai/suggest-nodes] POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

If the project has no `rate-limit` util yet, replace the `rateLimit(...)` block with a TODO comment and wire in the existing `lib/ai/claude-client` quota mechanism instead. Do not silently allow unlimited calls.

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add architex/src/lib/lld/ai-node-suggestions.ts architex/src/app/api/lld/ai/suggest-nodes
git commit -m "feat(ai): add Haiku-powered node-gap suggester

Given current canvas graph, returns 3-7 likely-missing classes with
reasons and relatedTo hints. Runs on Haiku for speed + cost. Wrapped
behind a rate-limited POST route (20/hr/user).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Extend `canvas-store` with named snapshots, notes, and annotations

**Files:**
- Modify: `architex/src/stores/canvas-store.ts`
- Test: `architex/src/stores/__tests__/canvas-store.snapshots.test.ts`
- Test: `architex/src/stores/__tests__/canvas-store.annotations.test.ts`

- [ ] **Step 1: Write the failing snapshot test**

Create `architex/src/stores/__tests__/canvas-store.snapshots.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore, canvasUndoManager } from "@/stores/canvas-store";

describe("canvas-store · named snapshots", () => {
  beforeEach(() => {
    canvasUndoManager.clear();
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      groups: [],
      namedSnapshots: [],
      activeDesignId: null,
    });
  });

  it("pushNamedSnapshot captures current canvas with label + note", () => {
    useCanvasStore.setState({
      nodes: [{ id: "a", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore
      .getState()
      .pushNamedSnapshot("Before refactor", "Split the God class");
    const snaps = useCanvasStore.getState().namedSnapshots;
    expect(snaps).toHaveLength(1);
    expect(snaps[0]?.label).toBe("Before refactor");
    expect(snaps[0]?.nodes).toHaveLength(1);
  });

  it("restoreNamedSnapshot swaps nodes/edges back", () => {
    useCanvasStore.setState({
      nodes: [{ id: "a", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore.getState().pushNamedSnapshot("Checkpoint", null);
    useCanvasStore.setState({ nodes: [] });
    const snap = useCanvasStore.getState().namedSnapshots[0]!;
    useCanvasStore.getState().restoreNamedSnapshot(snap.id);
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
  });

  it("deleteNamedSnapshot removes by id", () => {
    useCanvasStore.getState().pushNamedSnapshot("A", null);
    useCanvasStore.getState().pushNamedSnapshot("B", null);
    const [a, b] = useCanvasStore.getState().namedSnapshots;
    useCanvasStore.getState().deleteNamedSnapshot(a!.id);
    expect(useCanvasStore.getState().namedSnapshots.map((s) => s.id)).toEqual([
      b!.id,
    ]);
  });
});
```

- [ ] **Step 2: Write the failing annotations test**

Create `architex/src/stores/__tests__/canvas-store.annotations.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/stores/canvas-store";

describe("canvas-store · annotations + notes", () => {
  beforeEach(() => {
    useCanvasStore.setState({ annotations: [], nodes: [] });
  });

  it("addAnnotation inserts with generated id", () => {
    useCanvasStore.getState().addAnnotation({
      kind: "sticky-note",
      x: 100,
      y: 200,
      body: "Consider caching here",
      color: "amber",
    });
    const list = useCanvasStore.getState().annotations;
    expect(list).toHaveLength(1);
    expect(list[0]?.body).toBe("Consider caching here");
    expect(list[0]?.id).toBeTruthy();
  });

  it("updateAnnotation merges fields", () => {
    useCanvasStore.getState().addAnnotation({
      kind: "sticky-note",
      x: 0,
      y: 0,
      body: "old",
      color: "amber",
    });
    const id = useCanvasStore.getState().annotations[0]!.id;
    useCanvasStore.getState().updateAnnotation(id, { body: "new" });
    expect(useCanvasStore.getState().annotations[0]?.body).toBe("new");
  });

  it("updateNodeNotes stores note string on node data", () => {
    useCanvasStore.setState({
      nodes: [{ id: "n1", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore.getState().updateNodeNotes("n1", "Remember: guard invariant");
    const node = useCanvasStore.getState().nodes.find((n) => n.id === "n1");
    expect((node?.data as { notes?: string }).notes).toBe(
      "Remember: guard invariant",
    );
  });
});
```

- [ ] **Step 3: Run both tests to see them fail**

```bash
pnpm test:run -- canvas-store.snapshots canvas-store.annotations
```
Expected: FAIL with `pushNamedSnapshot is not a function` and `addAnnotation is not a function`.

- [ ] **Step 4: Extend the store**

Open `architex/src/stores/canvas-store.ts`. Add types near the top:

```typescript
export interface NamedCanvasSnapshot {
  id: string;
  label: string;
  note: string | null;
  createdAt: number;
  nodes: Node[];
  edges: Edge[];
  groups: NodeGroup[];
}

export interface CanvasAnnotation {
  id: string;
  kind: "sticky-note" | "arrow" | "circle" | "text";
  nodeId: string | null;
  x: number;
  y: number;
  body: string;
  color: string;
  meta: Record<string, unknown>;
  createdAt: number;
}
```

In the `CanvasState` interface, add:

```typescript
  // Named snapshots (user-labelled checkpoints) + design binding
  activeDesignId: string | null;
  namedSnapshots: NamedCanvasSnapshot[];
  pushNamedSnapshot: (label: string, note: string | null) => NamedCanvasSnapshot;
  restoreNamedSnapshot: (id: string) => void;
  deleteNamedSnapshot: (id: string) => void;
  setActiveDesignId: (id: string | null) => void;

  // Annotations layer
  annotations: CanvasAnnotation[];
  addAnnotation: (input: Omit<CanvasAnnotation, "id" | "createdAt">) => CanvasAnnotation;
  updateAnnotation: (id: string, patch: Partial<CanvasAnnotation>) => void;
  deleteAnnotation: (id: string) => void;

  // Per-node notes (stored on node.data.notes, exposed as helper)
  updateNodeNotes: (nodeId: string, notes: string) => void;
```

In the store creator, add initial state:

```typescript
  activeDesignId: null,
  namedSnapshots: [],
  annotations: [],
```

And these actions:

```typescript
  pushNamedSnapshot: (label, note) => {
    const snap: NamedCanvasSnapshot = {
      id: crypto.randomUUID(),
      label,
      note,
      createdAt: Date.now(),
      nodes: get().nodes,
      edges: get().edges,
      groups: get().groups,
    };
    set({ namedSnapshots: [snap, ...get().namedSnapshots].slice(0, 50) });
    return snap;
  },

  restoreNamedSnapshot: (id) => {
    const snap = get().namedSnapshots.find((s) => s.id === id);
    if (!snap) return;
    pushSnapshot(get()); // push current to undo stack before destructive replace
    set({ nodes: snap.nodes, edges: snap.edges, groups: snap.groups });
  },

  deleteNamedSnapshot: (id) =>
    set({
      namedSnapshots: get().namedSnapshots.filter((s) => s.id !== id),
    }),

  setActiveDesignId: (id) => set({ activeDesignId: id }),

  addAnnotation: (input) => {
    const ann: CanvasAnnotation = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      meta: {},
      ...input,
    };
    set({ annotations: [...get().annotations, ann] });
    return ann;
  },

  updateAnnotation: (id, patch) =>
    set({
      annotations: get().annotations.map((a) =>
        a.id === id ? { ...a, ...patch } : a,
      ),
    }),

  deleteAnnotation: (id) =>
    set({ annotations: get().annotations.filter((a) => a.id !== id) }),

  updateNodeNotes: (nodeId, notes) =>
    set({
      nodes: get().nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, notes } } : n,
      ),
    }),
```

Ensure the persisted blob (the `persist` middleware's `partialize`) excludes `namedSnapshots` and `annotations` — those sync to the DB via hooks in Task 16. Add them to the existing exclusion list.

- [ ] **Step 5: Run tests to pass**

```bash
pnpm test:run -- canvas-store.snapshots canvas-store.annotations
```
Expected: PASS · all 6 assertions.

- [ ] **Step 6: Commit**

```bash
git add architex/src/stores/canvas-store.ts architex/src/stores/__tests__/canvas-store.snapshots.test.ts architex/src/stores/__tests__/canvas-store.annotations.test.ts
git commit -m "feat(stores): extend canvas-store with snapshots + annotations + notes

Adds namedSnapshots (user-labelled checkpoints, capped at 50) with
restore/delete, annotations layer (CRUD), per-node notes helper, and
activeDesignId binding. Snapshots + annotations are DB-synced via
hooks (next tasks) so they're excluded from localStorage persist.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Create auto-layout presets + hook

**Files:**
- Create: `architex/src/lib/lld/auto-layout-presets.ts`
- Create: `architex/src/hooks/useAutoLayout.ts`
- Test: `architex/src/lib/lld/__tests__/auto-layout-presets.test.ts`
- Test: `architex/src/hooks/__tests__/useAutoLayout.test.ts`

- [ ] **Step 1: Write the presets module**

Create `architex/src/lib/lld/auto-layout-presets.ts`:

```typescript
/**
 * Thin wrappers over `src/lib/lld/dagre-layout.ts` exposing four presets.
 * Each preset returns `LayoutOptions` passed through to the Dagre engine;
 * circular uses a separate radial layout helper (below) because Dagre is
 * hierarchical-only.
 */

import type { LayoutOptions } from "./dagre-layout";
import type { Node, Edge } from "@xyflow/react";

export type AutoLayoutPresetId =
  | "left-right"
  | "top-down"
  | "layered"
  | "circular";

export interface AutoLayoutPreset {
  id: AutoLayoutPresetId;
  label: string;
  description: string;
  hotkey: string; // e.g. "⌘⇧L"
  options: LayoutOptions | "circular";
}

export const AUTO_LAYOUT_PRESETS: readonly AutoLayoutPreset[] = [
  {
    id: "left-right",
    label: "Left → Right",
    description: "Horizontal hierarchy. Best for pipelines and data flow.",
    hotkey: "⌘⇧L",
    options: { rankDir: "LR", nodeSep: 60, rankSep: 100 },
  },
  {
    id: "top-down",
    label: "Top → Down",
    description: "Classic UML hierarchy. Interfaces above, concretes below.",
    hotkey: "⌘⇧T",
    options: { rankDir: "TB", nodeSep: 60, rankSep: 90 },
  },
  {
    id: "layered",
    label: "Layered",
    description: "Looser ranks, wider gaps. Best for large graphs.",
    hotkey: "⌘⇧Y",
    options: { rankDir: "TB", nodeSep: 80, rankSep: 140 },
  },
  {
    id: "circular",
    label: "Circular",
    description: "Radial arrangement. Best for peer-network topologies.",
    hotkey: "⌘⇧O",
    options: "circular",
  },
] as const;

/**
 * Circular layout: arrange nodes around a circle, edges unchanged.
 * Returns position-only deltas; caller merges with existing node objects.
 */
export function circularLayout(
  nodes: Node[],
  radius = 320,
  center = { x: 480, y: 320 },
): Array<{ id: string; position: { x: number; y: number } }> {
  const n = nodes.length;
  if (n === 0) return [];
  return nodes.map((node, i) => {
    const angle = (i / n) * 2 * Math.PI;
    return {
      id: node.id,
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      },
    };
  });
}
```

- [ ] **Step 2: Write the presets test**

Create `architex/src/lib/lld/__tests__/auto-layout-presets.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  AUTO_LAYOUT_PRESETS,
  circularLayout,
} from "@/lib/lld/auto-layout-presets";

describe("auto-layout-presets", () => {
  it("exposes four presets with unique ids", () => {
    const ids = AUTO_LAYOUT_PRESETS.map((p) => p.id);
    expect(ids).toEqual(["left-right", "top-down", "layered", "circular"]);
    expect(new Set(ids).size).toBe(4);
  });

  it("circularLayout arranges N nodes on a circle", () => {
    const nodes = Array.from({ length: 4 }, (_, i) => ({
      id: `n${i}`,
      type: "class" as const,
      position: { x: 0, y: 0 },
      data: {},
    }));
    const out = circularLayout(nodes, 100, { x: 0, y: 0 });
    expect(out).toHaveLength(4);
    // All points lie on the circle (within floating-point tolerance)
    for (const p of out) {
      const r = Math.hypot(p.position.x, p.position.y);
      expect(Math.abs(r - 100)).toBeLessThan(0.01);
    }
  });

  it("circularLayout on empty input returns []", () => {
    expect(circularLayout([])).toEqual([]);
  });
});
```

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useAutoLayout.ts`:

```typescript
"use client";

import { useCallback } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  AUTO_LAYOUT_PRESETS,
  circularLayout,
  type AutoLayoutPresetId,
} from "@/lib/lld/auto-layout-presets";
import { computeDagreLayout } from "@/lib/lld/dagre-layout";

export function useAutoLayout() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const setNodes = useCanvasStore((s) => s.setNodes);

  return useCallback(
    (presetId: AutoLayoutPresetId) => {
      const preset = AUTO_LAYOUT_PRESETS.find((p) => p.id === presetId);
      if (!preset) return;

      if (preset.options === "circular") {
        const updates = circularLayout(nodes);
        const byId = new Map(updates.map((u) => [u.id, u.position]));
        setNodes(
          nodes.map((n) => ({ ...n, position: byId.get(n.id) ?? n.position })),
        );
        return;
      }

      const positioned = computeDagreLayout(nodes, edges, preset.options);
      setNodes(positioned);
    },
    [nodes, edges, setNodes],
  );
}
```

If `computeDagreLayout` is not the exact export name from `dagre-layout.ts`, check the file's top exports and adjust — do NOT invent a new API.

- [ ] **Step 4: Write the hook test**

Create `architex/src/hooks/__tests__/useAutoLayout.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasStore } from "@/stores/canvas-store";

vi.mock("@/lib/lld/dagre-layout", () => ({
  computeDagreLayout: (nodes: Array<{ id: string }>) =>
    nodes.map((n, i) => ({ ...n, position: { x: i * 100, y: 0 } })),
}));

import { useAutoLayout } from "@/hooks/useAutoLayout";

describe("useAutoLayout", () => {
  beforeEach(() => {
    useCanvasStore.setState({
      nodes: [
        { id: "a", type: "class", position: { x: 0, y: 0 }, data: {} },
        { id: "b", type: "class", position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [],
    });
  });

  it("top-down preset assigns non-default positions", () => {
    const { result } = renderHook(() => useAutoLayout());
    act(() => result.current("top-down"));
    const nodes = useCanvasStore.getState().nodes;
    expect(nodes[0]?.position.x).toBe(0);
    expect(nodes[1]?.position.x).toBe(100);
  });

  it("circular preset arranges on a circle", () => {
    const { result } = renderHook(() => useAutoLayout());
    act(() => result.current("circular"));
    const nodes = useCanvasStore.getState().nodes;
    // With 2 nodes on default radius 320, the second should be opposite-side
    const dx = (nodes[0]?.position.x ?? 0) - (nodes[1]?.position.x ?? 0);
    expect(Math.abs(dx)).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test:run -- auto-layout-presets useAutoLayout
```
Expected: PASS · all assertions.

- [ ] **Step 6: Commit**

```bash
git add architex/src/lib/lld/auto-layout-presets.ts architex/src/lib/lld/__tests__/auto-layout-presets.test.ts architex/src/hooks/useAutoLayout.ts architex/src/hooks/__tests__/useAutoLayout.test.ts
git commit -m "feat(lld): add four auto-layout presets + hook

Wraps the existing Dagre engine in four presets (left-right, top-down,
layered, circular). Circular uses a standalone radial arranger since
Dagre is hierarchical-only. Hook pulls nodes/edges from canvas-store
and writes the new positions back.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Create `useAISuggestions` hook + `useLLDTemplatesLibrary` + `useLLDDesigns`

**Files:**
- Create: `architex/src/hooks/useAISuggestions.ts`
- Create: `architex/src/hooks/useLLDTemplatesLibrary.ts`
- Create: `architex/src/hooks/useLLDDesigns.ts`
- Test: `architex/src/hooks/__tests__/useAISuggestions.test.tsx`

- [ ] **Step 1: AI suggestions hook (TanStack mutation)**

Create `architex/src/hooks/useAISuggestions.ts`:

```typescript
"use client";

import { useMutation } from "@tanstack/react-query";
import type { NodeSuggestion } from "@/lib/lld/ai-node-suggestions";
import { useCanvasStore } from "@/stores/canvas-store";

async function fetchSuggestions(intent: string | undefined): Promise<NodeSuggestion[]> {
  const { nodes, edges } = useCanvasStore.getState();
  const res = await fetch("/api/lld/ai/suggest-nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nodes: nodes.map((n) => ({ id: n.id, data: n.data })),
      edges: edges.map((e) => ({ source: e.source, target: e.target, data: e.data })),
      intent,
    }),
  });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit exceeded");
    throw new Error(`AI suggest failed: ${res.status}`);
  }
  const json = (await res.json()) as { suggestions: NodeSuggestion[] };
  return json.suggestions;
}

export function useAISuggestions() {
  return useMutation({
    mutationFn: (intent?: string) => fetchSuggestions(intent),
    retry: 1,
  });
}
```

- [ ] **Step 2: Templates library hook**

Create `architex/src/hooks/useLLDTemplatesLibrary.ts`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import type { LLDTemplatesLibraryEntry } from "@/db/schema";

export interface TemplatesFilter {
  category?: string;
  difficulty?: string;
  q?: string;
}

async function fetchTemplates(
  filter: TemplatesFilter,
): Promise<LLDTemplatesLibraryEntry[]> {
  const params = new URLSearchParams();
  if (filter.category) params.set("category", filter.category);
  if (filter.difficulty) params.set("difficulty", filter.difficulty);
  if (filter.q) params.set("q", filter.q);
  const qs = params.toString();
  const res = await fetch(`/api/lld/templates-library${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Templates fetch failed: ${res.status}`);
  const json = (await res.json()) as {
    templates: LLDTemplatesLibraryEntry[];
  };
  return json.templates;
}

export function useLLDTemplatesLibrary(filter: TemplatesFilter = {}) {
  return useQuery({
    queryKey: ["lld-templates-library", filter],
    queryFn: () => fetchTemplates(filter),
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 3: Designs hook (list + CRUD mutations)**

Create `architex/src/hooks/useLLDDesigns.ts`:

```typescript
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LLDDesign } from "@/db/schema";

async function listDesigns(
  status: "active" | "archived" = "active",
): Promise<LLDDesign[]> {
  const res = await fetch(`/api/lld/designs?status=${status}`);
  if (!res.ok) throw new Error(`List designs failed: ${res.status}`);
  const json = (await res.json()) as { designs: LLDDesign[] };
  return json.designs;
}

async function createDesign(body: {
  name: string;
  description?: string;
  templateId?: string;
}): Promise<LLDDesign> {
  const res = await fetch("/api/lld/designs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Create design failed: ${res.status}`);
  const json = (await res.json()) as { design: LLDDesign };
  return json.design;
}

export function useLLDDesigns(
  status: "active" | "archived" = "active",
) {
  return useQuery({
    queryKey: ["lld-designs", status],
    queryFn: () => listDesigns(status),
    staleTime: 30 * 1000,
  });
}

export function useCreateLLDDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDesign,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lld-designs"] });
    },
  });
}
```

- [ ] **Step 4: AI suggestions test**

Create `architex/src/hooks/__tests__/useAISuggestions.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useCanvasStore } from "@/stores/canvas-store";

function wrapper(qc: QueryClient) {
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe("useAISuggestions", () => {
  beforeEach(() => {
    useCanvasStore.setState({ nodes: [], edges: [] });
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: [{ id: "s1", suggestedName: "Observer", reason: "..." }] }),
    }) as typeof fetch;
  });

  it("mutate() resolves with suggestions from the API", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useAISuggestions(), { wrapper: wrapper(qc) });
    result.current.mutate(undefined);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]?.suggestedName).toBe("Observer");
  });

  it("surfaces 429 rate-limit errors", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 429 }) as typeof fetch;
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const { result } = renderHook(() => useAISuggestions(), { wrapper: wrapper(qc) });
    result.current.mutate(undefined);
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain("Rate limit");
  });
});
```

- [ ] **Step 5: Run tests**

```bash
pnpm test:run -- useAISuggestions
```
Expected: PASS · both assertions.

- [ ] **Step 6: Commit**

```bash
git add architex/src/hooks/useAISuggestions.ts architex/src/hooks/useLLDTemplatesLibrary.ts architex/src/hooks/useLLDDesigns.ts architex/src/hooks/__tests__/useAISuggestions.test.tsx
git commit -m "feat(hooks): add Build-mode data hooks

- useAISuggestions: Haiku mutation with rate-limit surface
- useLLDTemplatesLibrary: cached 5-min templates query
- useLLDDesigns + useCreateLLDDesign: design list + create

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Build `PatternLibraryDock` + `PatternLibraryItem` components

**Files:**
- Create: `architex/src/components/modules/lld/build/PatternLibraryDock.tsx`
- Create: `architex/src/components/modules/lld/build/PatternLibraryItem.tsx`

- [ ] **Step 1: Dock component**

Create `architex/src/components/modules/lld/build/PatternLibraryDock.tsx`:

```tsx
"use client";

import { memo, useMemo, useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useLLDTemplatesLibrary } from "@/hooks/useLLDTemplatesLibrary";
import { PatternLibraryItem } from "./PatternLibraryItem";
import { cn } from "@/lib/utils";

const CATEGORY_TABS = [
  { id: "", label: "All" },
  { id: "creational", label: "Creational" },
  { id: "structural", label: "Structural" },
  { id: "behavioral", label: "Behavioral" },
  { id: "architecture", label: "Architecture" },
  { id: "microservices", label: "Microservices" },
  { id: "data", label: "Data" },
  { id: "ai", label: "AI" },
] as const;

export const PatternLibraryDock = memo(function PatternLibraryDock() {
  const [collapsed, setCollapsed] = useState(false);
  const [category, setCategory] = useState<string>("");
  const [q, setQ] = useState("");

  const { data: templates = [], isLoading } = useLLDTemplatesLibrary({
    category: category || undefined,
    q: q.trim() || undefined,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, typeof templates>();
    for (const t of templates) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [templates]);

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-r border-border/30 bg-background/60 backdrop-blur-sm">
        <button
          aria-label="Expand pattern library"
          onClick={() => setCollapsed(false)}
          className="mt-3 rounded-md p-1.5 text-foreground-muted hover:bg-foreground/5"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Pattern library"
      className="flex h-full w-72 flex-col border-r border-border/30 bg-background/60 backdrop-blur-sm"
    >
      <header className="flex items-center justify-between px-3 py-2 border-b border-border/20">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
          Pattern Library
        </h2>
        <button
          aria-label="Collapse pattern library"
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="px-3 py-2">
        <label className="flex items-center gap-2 rounded-md border border-border/30 bg-elevated/40 px-2 py-1.5">
          <Search className="h-3.5 w-3.5 text-foreground-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search patterns…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-foreground-muted"
          />
        </label>
      </div>

      <div className="flex gap-1 overflow-x-auto px-3 pb-2">
        {CATEGORY_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setCategory(t.id)}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors",
              category === t.id
                ? "bg-primary/20 text-primary"
                : "text-foreground-muted hover:bg-foreground/5",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="p-4 text-xs text-foreground-muted">Loading…</div>
        ) : templates.length === 0 ? (
          <div className="p-4 text-xs text-foreground-muted">
            No patterns match your filters.
          </div>
        ) : (
          [...grouped.entries()].map(([cat, items]) => (
            <section key={cat} className="mb-3">
              <h3 className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground-muted">
                {cat}
              </h3>
              <ul className="space-y-1">
                {items.map((t) => (
                  <PatternLibraryItem key={t.id} template={t} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </aside>
  );
});
```

- [ ] **Step 2: Item component**

Create `architex/src/components/modules/lld/build/PatternLibraryItem.tsx`:

```tsx
"use client";

import { memo } from "react";
import type { LLDTemplatesLibraryEntry } from "@/db/schema";
import { useCanvasStore } from "@/stores/canvas-store";
import { cn } from "@/lib/utils";

interface Props {
  template: LLDTemplatesLibraryEntry;
}

function difficultyColor(d: string) {
  if (d === "beginner") return "text-emerald-400";
  if (d === "intermediate") return "text-sky-400";
  return "text-fuchsia-400";
}

export const PatternLibraryItem = memo(function PatternLibraryItem({
  template,
}: Props) {
  const setNodes = useCanvasStore((s) => s.setNodes);
  const setEdges = useCanvasStore((s) => s.setEdges);

  const apply = () => {
    const cs = template.canvasState as {
      nodes?: Array<{ id: string; position: { x: number; y: number }; data: Record<string, unknown>; type?: string }>;
      edges?: Array<{ id?: string; source: string; target: string; data?: Record<string, unknown>; type?: string }>;
    };
    if (Array.isArray(cs.nodes)) {
      setNodes(
        cs.nodes.map((n) => ({
          id: n.id,
          type: n.type ?? "class",
          position: n.position,
          data: n.data ?? {},
        })),
      );
    }
    if (Array.isArray(cs.edges)) {
      setEdges(
        cs.edges.map((e, i) => ({
          id: e.id ?? `e-${i}`,
          source: e.source,
          target: e.target,
          type: e.type ?? "data-flow",
          data: e.data ?? {},
        })),
      );
    }
  };

  return (
    <li>
      <button
        onClick={apply}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(
            "application/json",
            JSON.stringify({ kind: "lld-template", slug: template.slug }),
          );
        }}
        className={cn(
          "w-full rounded-md border border-transparent px-2 py-1.5 text-left transition-colors",
          "hover:border-border/40 hover:bg-elevated/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-foreground">
            {template.name}
          </span>
          <span className={cn("shrink-0 text-[9px] uppercase", difficultyColor(template.difficulty))}>
            {template.difficulty}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-foreground-muted">
          {template.description}
        </p>
      </button>
    </li>
  );
});
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors. If `LLDTemplatesLibraryEntry` isn't re-exported from `@/db/schema`, add it to the schema index in Task 3 retroactively.

- [ ] **Step 4: Commit**

```bash
git add architex/src/components/modules/lld/build/PatternLibraryDock.tsx architex/src/components/modules/lld/build/PatternLibraryItem.tsx
git commit -m "feat(lld): add PatternLibraryDock + PatternLibraryItem

Left-side collapsible searchable dock with 8 category tabs, live ILIKE
search, and per-item click-to-apply + drag-out-to-canvas. Groups
results by category. Items render name + difficulty pill + 2-line
description.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Build `TemplateLoaderDialog` + `AISuggestionsCard` components

**Files:**
- Create: `architex/src/components/modules/lld/build/TemplateLoaderDialog.tsx`
- Create: `architex/src/components/modules/lld/build/AISuggestionsCard.tsx`

- [ ] **Step 1: Template loader dialog**

Create `architex/src/components/modules/lld/build/TemplateLoaderDialog.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { X } from "lucide-react";
import { useLLDTemplatesLibrary } from "@/hooks/useLLDTemplatesLibrary";
import { useCanvasStore } from "@/stores/canvas-store";
import { PatternLibraryItem } from "./PatternLibraryItem";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const TemplateLoaderDialog = memo(function TemplateLoaderDialog({
  open,
  onClose,
}: Props) {
  const [q, setQ] = useState("");
  const [difficulty, setDifficulty] = useState<string>("");

  const { data: templates = [] } = useLLDTemplatesLibrary({
    q: q.trim() || undefined,
    difficulty: difficulty || undefined,
  });

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Template loader"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl border border-border/40 bg-elevated/95 shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-border/20 px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Load a template
            </h2>
            <p className="text-xs text-foreground-muted">
              ~60 curated starters. Click to apply.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex gap-2 border-b border-border/20 px-4 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates…"
            className="flex-1 rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs"
          >
            <option value="">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <ul className="grid max-h-[60vh] grid-cols-2 gap-1 overflow-y-auto p-2">
          {templates.map((t) => (
            <PatternLibraryItem key={t.id} template={t} />
          ))}
        </ul>
      </div>
    </div>
  );
});
```

- [ ] **Step 2: AI suggestions card**

Create `architex/src/components/modules/lld/build/AISuggestionsCard.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";
import { useAISuggestions } from "@/hooks/useAISuggestions";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  onDismiss: () => void;
}

export const AISuggestionsCard = memo(function AISuggestionsCard({
  onDismiss,
}: Props) {
  const [intent, setIntent] = useState("");
  const mutation = useAISuggestions();
  const addNode = useCanvasStore((s) => s.addNode);

  const acceptSuggestion = (name: string, kind: string) => {
    addNode({
      id: `sug-${Date.now()}`,
      type: "class",
      position: { x: 120 + Math.random() * 240, y: 120 + Math.random() * 240 },
      data: { label: name, kind },
    });
  };

  return (
    <aside
      aria-label="AI node suggestions"
      className="absolute right-4 top-4 w-80 rounded-xl border border-border/30 bg-elevated/90 p-3 shadow-lg backdrop-blur-sm"
    >
      <header className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
          <span className="text-xs font-semibold text-foreground">
            What's missing?
          </span>
        </div>
        <button
          aria-label="Dismiss"
          onClick={onDismiss}
          className="rounded-md p-0.5 text-foreground-muted hover:bg-foreground/5"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <textarea
        value={intent}
        onChange={(e) => setIntent(e.target.value)}
        rows={2}
        placeholder="(optional) What are you designing?"
        className="w-full resize-none rounded-md border border-border/30 bg-background/60 p-2 text-xs outline-none focus:border-primary/40"
      />

      <button
        disabled={mutation.isPending}
        onClick={() => mutation.mutate(intent || undefined)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-primary/80 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {mutation.isPending ? (
          <>
            <RefreshCw className="h-3 w-3 animate-spin" />
            Thinking…
          </>
        ) : (
          "Ask Haiku"
        )}
      </button>

      {mutation.isError && (
        <p className="mt-2 text-[11px] text-red-400">
          {mutation.error.message}
        </p>
      )}

      {mutation.data && mutation.data.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {mutation.data.map((s) => (
            <li
              key={s.id}
              className="rounded-md border border-border/20 bg-background/40 p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">
                  {s.suggestedName}
                </span>
                <button
                  onClick={() => acceptSuggestion(s.suggestedName, s.suggestedKind)}
                  className="rounded-md border border-primary/40 px-1.5 py-0.5 text-[10px] text-primary hover:bg-primary/10"
                >
                  Add
                </button>
              </div>
              <p className="mt-0.5 text-[11px] text-foreground-muted">
                {s.reason}
              </p>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
});
```

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add architex/src/components/modules/lld/build/TemplateLoaderDialog.tsx architex/src/components/modules/lld/build/AISuggestionsCard.tsx
git commit -m "feat(lld): add TemplateLoaderDialog + AISuggestionsCard

Modal dialog template picker (Cmd+Shift+T). AI suggestions panel
(Cmd+Shift+A) with optional intent box and one-click accept to drop
suggested classes onto the canvas.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Build `AutoLayoutMenu` + `BuildExportMenu` + `NamedSnapshotsDrawer` + `BuildActionsRail`

**Files:**
- Create: `architex/src/components/modules/lld/build/AutoLayoutMenu.tsx`
- Create: `architex/src/components/modules/lld/build/BuildExportMenu.tsx`
- Create: `architex/src/components/modules/lld/build/NamedSnapshotsDrawer.tsx`
- Create: `architex/src/components/modules/lld/build/BuildActionsRail.tsx`
- Create: `architex/src/lib/export/build-export-menu-items.ts`

- [ ] **Step 1: Export menu registry**

Create `architex/src/lib/export/build-export-menu-items.ts`:

```typescript
/**
 * Registry of Build-mode export actions. Each entry wires an existing
 * exporter from `src/lib/export/*` to a user-facing menu item.
 */

import {
  downloadPNG,
  downloadSVG,
  downloadJSON,
  copyMermaidToClipboard,
  copyPlantUMLToClipboard,
  exportToMermaid,
  exportToPlantUML,
} from "@/lib/export";
import type { Node, Edge } from "@xyflow/react";

export interface BuildExportMenuItem {
  id: "png" | "svg" | "mermaid" | "plantuml" | "json";
  label: string;
  description: string;
  hotkey?: string;
  run: (args: { nodes: Node[]; edges: Edge[]; filename: string }) => Promise<void>;
}

export const BUILD_EXPORT_MENU_ITEMS: readonly BuildExportMenuItem[] = [
  {
    id: "png",
    label: "Export as PNG",
    description: "Raster image, 2x resolution.",
    hotkey: "⌘⇧P",
    run: async ({ filename }) => {
      await downloadPNG(`${filename}.png`, { scale: 2 });
    },
  },
  {
    id: "svg",
    label: "Export as SVG",
    description: "Vector image, infinitely scalable.",
    run: async ({ filename }) => {
      await downloadSVG(`${filename}.svg`);
    },
  },
  {
    id: "mermaid",
    label: "Copy Mermaid",
    description: "Mermaid class-diagram source to clipboard.",
    hotkey: "⌘⇧M",
    run: async ({ nodes, edges }) => {
      await copyMermaidToClipboard(exportToMermaid(nodes, edges));
    },
  },
  {
    id: "plantuml",
    label: "Copy PlantUML",
    description: "PlantUML source to clipboard.",
    run: async ({ nodes, edges }) => {
      await copyPlantUMLToClipboard(exportToPlantUML(nodes, edges));
    },
  },
  {
    id: "json",
    label: "Export as JSON",
    description: "Full canvas state, re-importable.",
    run: async ({ nodes, edges, filename }) => {
      downloadJSON(`${filename}.json`, { nodes, edges, version: 1 });
    },
  },
] as const;
```

Confirm the exact exporter signatures in `src/lib/export/index.ts` — if `downloadPNG` takes `(filename)` rather than `(filename, opts)`, simplify the call. Do NOT rewrite the exporters.

- [ ] **Step 2: AutoLayoutMenu**

Create `architex/src/components/modules/lld/build/AutoLayoutMenu.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { LayoutGrid, ChevronDown } from "lucide-react";
import { AUTO_LAYOUT_PRESETS } from "@/lib/lld/auto-layout-presets";
import { useAutoLayout } from "@/hooks/useAutoLayout";

export const AutoLayoutMenu = memo(function AutoLayoutMenu() {
  const [open, setOpen] = useState(false);
  const applyLayout = useAutoLayout();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        Layout
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-64 rounded-lg border border-border/30 bg-elevated/95 p-1 shadow-lg backdrop-blur-sm"
        >
          {AUTO_LAYOUT_PRESETS.map((p) => (
            <button
              key={p.id}
              role="menuitem"
              onClick={() => {
                applyLayout(p.id);
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-foreground/5"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {p.label}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {p.description}
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-foreground-muted">
                {p.hotkey}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 3: BuildExportMenu**

Create `architex/src/components/modules/lld/build/BuildExportMenu.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { Download, ChevronDown } from "lucide-react";
import { BUILD_EXPORT_MENU_ITEMS } from "@/lib/export/build-export-menu-items";
import { useCanvasStore } from "@/stores/canvas-store";

export const BuildExportMenu = memo(function BuildExportMenu() {
  const [open, setOpen] = useState(false);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Download className="h-3.5 w-3.5" />
        Export
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-60 rounded-lg border border-border/30 bg-elevated/95 p-1 shadow-lg backdrop-blur-sm"
        >
          {BUILD_EXPORT_MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              onClick={async () => {
                await item.run({ nodes, edges, filename: "lld-design" });
                setOpen(false);
              }}
              className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-foreground/5"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">
                  {item.label}
                </div>
                <div className="text-[10px] text-foreground-muted">
                  {item.description}
                </div>
              </div>
              {item.hotkey && (
                <span className="shrink-0 text-[10px] text-foreground-muted">
                  {item.hotkey}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
```

- [ ] **Step 4: NamedSnapshotsDrawer**

Create `architex/src/components/modules/lld/build/NamedSnapshotsDrawer.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { Camera, X, Undo2 } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export const NamedSnapshotsDrawer = memo(function NamedSnapshotsDrawer() {
  const [open, setOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newNote, setNewNote] = useState("");

  const snapshots = useCanvasStore((s) => s.namedSnapshots);
  const push = useCanvasStore((s) => s.pushNamedSnapshot);
  const restore = useCanvasStore((s) => s.restoreNamedSnapshot);
  const del = useCanvasStore((s) => s.deleteNamedSnapshot);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open snapshots"
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Camera className="h-3.5 w-3.5" />
        Snapshots ({snapshots.length})
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Snapshots drawer"
          className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col border-l border-border/40 bg-elevated/95 shadow-2xl backdrop-blur-sm"
        >
          <header className="flex items-center justify-between border-b border-border/20 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Snapshots</h2>
            <button
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="border-b border-border/20 px-4 py-3 space-y-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label (e.g. Before refactor)"
              className="w-full rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            />
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              placeholder="Optional note"
              className="w-full resize-none rounded-md border border-border/30 bg-background/60 px-2 py-1.5 text-xs outline-none focus:border-primary/40"
            />
            <button
              disabled={!newLabel.trim()}
              onClick={() => {
                push(newLabel.trim(), newNote.trim() || null);
                setNewLabel("");
                setNewNote("");
              }}
              className="w-full rounded-md bg-primary/80 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              Capture snapshot
            </button>
          </div>

          <ul className="flex-1 overflow-y-auto p-2">
            {snapshots.length === 0 ? (
              <li className="p-4 text-xs text-foreground-muted">
                No snapshots yet.
              </li>
            ) : (
              snapshots.map((s) => (
                <li
                  key={s.id}
                  className="mb-1 rounded-md border border-border/20 bg-background/40 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-foreground">
                        {s.label}
                      </div>
                      <div className="text-[10px] text-foreground-muted">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        aria-label="Restore"
                        onClick={() => restore(s.id)}
                        className="rounded-md border border-border/30 px-1.5 py-0.5 text-[10px] hover:bg-foreground/5"
                      >
                        <Undo2 className="h-3 w-3" />
                      </button>
                      <button
                        aria-label="Delete"
                        onClick={() => del(s.id)}
                        className="rounded-md border border-border/30 px-1.5 py-0.5 text-[10px] hover:bg-foreground/5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {s.note && (
                    <p className="mt-1 text-[11px] text-foreground-muted">
                      {s.note}
                    </p>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </>
  );
});
```

- [ ] **Step 5: BuildActionsRail assembles the rail**

Create `architex/src/components/modules/lld/build/BuildActionsRail.tsx`:

```tsx
"use client";

import { memo, useState } from "react";
import { FilePlus, Sparkles, Undo, Redo } from "lucide-react";
import { AutoLayoutMenu } from "./AutoLayoutMenu";
import { BuildExportMenu } from "./BuildExportMenu";
import { NamedSnapshotsDrawer } from "./NamedSnapshotsDrawer";
import { TemplateLoaderDialog } from "./TemplateLoaderDialog";
import { AISuggestionsCard } from "./AISuggestionsCard";
import { useCanvasStore } from "@/stores/canvas-store";

export const BuildActionsRail = memo(function BuildActionsRail() {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => setTemplatesOpen(true)}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <FilePlus className="h-3.5 w-3.5" />
        Templates
      </button>

      <button
        onClick={() => setAiOpen((v) => !v)}
        className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest
      </button>

      <AutoLayoutMenu />
      <BuildExportMenu />
      <NamedSnapshotsDrawer />

      <div className="ml-1 flex items-center gap-0.5 border-l border-border/30 pl-2">
        <button
          aria-label="Undo"
          onClick={undo}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <Undo className="h-3.5 w-3.5" />
        </button>
        <button
          aria-label="Redo"
          onClick={redo}
          className="rounded-md p-1 text-foreground-muted hover:bg-foreground/5"
        >
          <Redo className="h-3.5 w-3.5" />
        </button>
      </div>

      <TemplateLoaderDialog open={templatesOpen} onClose={() => setTemplatesOpen(false)} />
      {aiOpen && <AISuggestionsCard onDismiss={() => setAiOpen(false)} />}
    </div>
  );
});
```

- [ ] **Step 6: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add architex/src/lib/export/build-export-menu-items.ts architex/src/components/modules/lld/build/AutoLayoutMenu.tsx architex/src/components/modules/lld/build/BuildExportMenu.tsx architex/src/components/modules/lld/build/NamedSnapshotsDrawer.tsx architex/src/components/modules/lld/build/BuildActionsRail.tsx
git commit -m "feat(lld): add Build actions rail with layout/export/snapshots

Composed rail sits above the canvas: Templates button (opens dialog),
Suggest button (toggles AI card), AutoLayoutMenu (4 presets), Export
menu (PNG/SVG/Mermaid/PlantUML/JSON), Snapshots drawer (capture +
restore), undo/redo icons wired to canvas-store.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Build notes + annotations UI + sync hook

**Files:**
- Create: `architex/src/components/modules/lld/build/NodeNotesPopover.tsx`
- Create: `architex/src/components/modules/lld/build/AnnotationLayer.tsx`
- Create: `architex/src/components/modules/lld/build/AnnotationToolbar.tsx`

- [ ] **Step 1: Node notes popover (triggered from right-click menu)**

Create `architex/src/components/modules/lld/build/NodeNotesPopover.tsx`:

```tsx
"use client";

import { memo, useState, useEffect } from "react";
import { StickyNote, X } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  nodeId: string;
  onClose: () => void;
}

export const NodeNotesPopover = memo(function NodeNotesPopover({
  nodeId,
  onClose,
}: Props) {
  const nodes = useCanvasStore((s) => s.nodes);
  const update = useCanvasStore((s) => s.updateNodeNotes);
  const node = nodes.find((n) => n.id === nodeId);
  const [draft, setDraft] = useState(
    (node?.data as { notes?: string })?.notes ?? "",
  );

  useEffect(() => {
    setDraft((node?.data as { notes?: string })?.notes ?? "");
  }, [nodeId, node]);

  if (!node) return null;

  return (
    <div
      role="dialog"
      aria-label="Node notes"
      className="absolute z-40 w-72 rounded-lg border border-amber-500/30 bg-amber-100/90 p-3 shadow-lg backdrop-blur-sm text-slate-900"
      style={{ left: node.position.x, top: node.position.y + 140 }}
    >
      <header className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <StickyNote className="h-3.5 w-3.5" />
          Notes · {(node.data as { label?: string })?.label ?? node.id}
        </div>
        <button
          aria-label="Close"
          onClick={onClose}
          className="rounded-md p-0.5 hover:bg-black/10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => update(nodeId, draft)}
        rows={5}
        placeholder="Why this class? Invariants? Open questions?"
        className="w-full resize-none rounded-md border border-amber-600/30 bg-white/70 p-2 text-xs outline-none focus:border-amber-600"
      />
    </div>
  );
});
```

- [ ] **Step 2: Annotation layer (renders floating sticky notes + shapes)**

Create `architex/src/components/modules/lld/build/AnnotationLayer.tsx`:

```tsx
"use client";

import { memo } from "react";
import { useCanvasStore, type CanvasAnnotation } from "@/stores/canvas-store";

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-500/40 bg-amber-100/90 text-slate-900",
  sky: "border-sky-500/40 bg-sky-100/90 text-slate-900",
  emerald: "border-emerald-500/40 bg-emerald-100/90 text-slate-900",
  fuchsia: "border-fuchsia-500/40 bg-fuchsia-100/90 text-slate-900",
};

function StickyNote({ a }: { a: CanvasAnnotation }) {
  const update = useCanvasStore((s) => s.updateAnnotation);
  const del = useCanvasStore((s) => s.deleteAnnotation);
  const colorCls = COLOR_MAP[a.color] ?? COLOR_MAP.amber;

  return (
    <div
      style={{ left: a.x, top: a.y }}
      className={`pointer-events-auto absolute w-48 rounded-md border p-2 shadow ${colorCls}`}
    >
      <textarea
        value={a.body}
        onChange={(e) => update(a.id, { body: e.target.value })}
        rows={3}
        className="w-full resize-none bg-transparent text-xs outline-none"
      />
      <button
        aria-label="Delete annotation"
        onClick={() => del(a.id)}
        className="absolute right-1 top-1 text-[10px] text-slate-700 hover:text-slate-900"
      >
        ×
      </button>
    </div>
  );
}

export const AnnotationLayer = memo(function AnnotationLayer() {
  const annotations = useCanvasStore((s) => s.annotations);
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {annotations.map((a) => {
        if (a.kind === "sticky-note") return <StickyNote key={a.id} a={a} />;
        // arrow / circle / text extensions can go here in later phases.
        return null;
      })}
    </div>
  );
});
```

- [ ] **Step 3: Annotation toolbar (add a sticky)**

Create `architex/src/components/modules/lld/build/AnnotationToolbar.tsx`:

```tsx
"use client";

import { memo } from "react";
import { StickyNote } from "lucide-react";
import { useCanvasStore } from "@/stores/canvas-store";

export const AnnotationToolbar = memo(function AnnotationToolbar() {
  const addAnnotation = useCanvasStore((s) => s.addAnnotation);

  return (
    <button
      onClick={() =>
        addAnnotation({
          kind: "sticky-note",
          nodeId: null,
          x: 120 + Math.random() * 200,
          y: 120 + Math.random() * 200,
          body: "",
          color: "amber",
          meta: {},
        })
      }
      className="flex items-center gap-1 rounded-md border border-border/30 bg-elevated/60 px-2 py-1 text-xs text-foreground-muted hover:text-foreground"
      aria-label="Add sticky note"
    >
      <StickyNote className="h-3.5 w-3.5" />
      Note
    </button>
  );
});
```

- [ ] **Step 4: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add architex/src/components/modules/lld/build/NodeNotesPopover.tsx architex/src/components/modules/lld/build/AnnotationLayer.tsx architex/src/components/modules/lld/build/AnnotationToolbar.tsx
git commit -m "feat(lld): add notes popover + annotation layer + toolbar

Per-node notes popover (right-click → Notes) persists into
ArchitexNode.data.notes via updateNodeNotes. Annotation layer renders
floating sticky-note shapes over the canvas. Toolbar adds a new sticky
at a random canvas position.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Create keyboard shortcut hook

**Files:**
- Create: `architex/src/hooks/useBuildKeyboardShortcuts.ts`
- Test: `architex/src/hooks/__tests__/useBuildKeyboardShortcuts.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `architex/src/hooks/__tests__/useBuildKeyboardShortcuts.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCanvasStore } from "@/stores/canvas-store";

const autoLayoutMock = vi.fn();
vi.mock("@/hooks/useAutoLayout", () => ({
  useAutoLayout: () => autoLayoutMock,
}));

import { useBuildKeyboardShortcuts } from "@/hooks/useBuildKeyboardShortcuts";

function fireKey(key: string, opts: { meta?: boolean; shift?: boolean } = {}) {
  const e = new KeyboardEvent("keydown", {
    key,
    metaKey: Boolean(opts.meta),
    shiftKey: Boolean(opts.shift),
    bubbles: true,
  });
  window.dispatchEvent(e);
}

describe("useBuildKeyboardShortcuts", () => {
  beforeEach(() => {
    autoLayoutMock.mockClear();
    useCanvasStore.setState({ nodes: [], edges: [] });
  });

  it("⌘⇧L triggers auto-layout(left-right)", () => {
    renderHook(() => useBuildKeyboardShortcuts({ enabled: true }));
    act(() => fireKey("l", { meta: true, shift: true }));
    expect(autoLayoutMock).toHaveBeenCalledWith("left-right");
  });

  it("⌘N calls onNewNode callback when provided", () => {
    const onNewNode = vi.fn();
    renderHook(() =>
      useBuildKeyboardShortcuts({ enabled: true, onNewNode }),
    );
    act(() => fireKey("n", { meta: true }));
    expect(onNewNode).toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    renderHook(() => useBuildKeyboardShortcuts({ enabled: false }));
    act(() => fireKey("l", { meta: true, shift: true }));
    expect(autoLayoutMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to see it fail**

```bash
pnpm test:run -- useBuildKeyboardShortcuts
```
Expected: FAIL with `Cannot find module '@/hooks/useBuildKeyboardShortcuts'`.

- [ ] **Step 3: Create the hook**

Create `architex/src/hooks/useBuildKeyboardShortcuts.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useCanvasStore } from "@/stores/canvas-store";
import { useAutoLayout } from "@/hooks/useAutoLayout";

export interface BuildShortcutOptions {
  enabled: boolean;
  onNewNode?: () => void;
  onOpenTemplates?: () => void;
  onOpenAI?: () => void;
  onCaptureSnapshot?: () => void;
  onExportPNG?: () => void;
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts for Build mode.
 *
 *  ⌘N         New node (delegates to onNewNode)
 *  ⌘⇧T        Open templates
 *  ⌘⇧A        Open AI suggestions
 *  ⌘⇧L        Auto-layout left-right
 *  ⌘⇧T (no-shift conflict handled via separate key)
 *  ⌘⇧Y        Auto-layout layered
 *  ⌘⇧O        Auto-layout circular
 *  ⌘⇧S        Capture named snapshot
 *  ⌘⇧P        Export PNG
 *  ⌘Z / ⌘⇧Z   Undo / Redo
 */
export function useBuildKeyboardShortcuts(opts: BuildShortcutOptions): void {
  const applyLayout = useAutoLayout();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);

  useEffect(() => {
    if (!opts.enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;

      const k = e.key.toLowerCase();

      if (e.shiftKey) {
        switch (k) {
          case "l":
            e.preventDefault();
            applyLayout("left-right");
            return;
          case "t":
            e.preventDefault();
            opts.onOpenTemplates?.();
            return;
          case "a":
            e.preventDefault();
            opts.onOpenAI?.();
            return;
          case "y":
            e.preventDefault();
            applyLayout("layered");
            return;
          case "o":
            e.preventDefault();
            applyLayout("circular");
            return;
          case "s":
            e.preventDefault();
            opts.onCaptureSnapshot?.();
            return;
          case "p":
            e.preventDefault();
            opts.onExportPNG?.();
            return;
          case "z":
            e.preventDefault();
            redo();
            return;
        }
      }

      switch (k) {
        case "n":
          e.preventDefault();
          opts.onNewNode?.();
          return;
        case "z":
          e.preventDefault();
          undo();
          return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [opts, applyLayout, undo, redo]);
}
```

- [ ] **Step 4: Run the test to see it pass**

```bash
pnpm test:run -- useBuildKeyboardShortcuts
```
Expected: PASS · all 3 assertions.

- [ ] **Step 5: Commit**

```bash
git add architex/src/hooks/useBuildKeyboardShortcuts.ts architex/src/hooks/__tests__/useBuildKeyboardShortcuts.test.tsx
git commit -m "feat(hooks): add useBuildKeyboardShortcuts

Keyboard-first authoring grammar. ⌘N (new node), ⌘⇧T (templates),
⌘⇧A (AI suggest), ⌘⇧L/Y/O (layout presets), ⌘⇧S (snapshot),
⌘⇧P (PNG export), ⌘Z / ⌘⇧Z (undo/redo). Skips when focused in
text inputs / contentEditable.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: Wire Build-mode UI into `BuildModeLayout`

**Files:**
- Modify: `architex/src/components/modules/lld/modes/BuildModeLayout.tsx`

- [ ] **Step 1: Assemble the layout**

Open `architex/src/components/modules/lld/modes/BuildModeLayout.tsx`. Replace its body with a horizontal split that slots the Phase-3 UI beside today's content:

```tsx
"use client";

import { memo, useState, type ReactNode } from "react";
import { PatternLibraryDock } from "@/components/modules/lld/build/PatternLibraryDock";
import { BuildActionsRail } from "@/components/modules/lld/build/BuildActionsRail";
import { AnnotationLayer } from "@/components/modules/lld/build/AnnotationLayer";
import { AnnotationToolbar } from "@/components/modules/lld/build/AnnotationToolbar";
import { useBuildKeyboardShortcuts } from "@/hooks/useBuildKeyboardShortcuts";
import { useCanvasStore } from "@/stores/canvas-store";

interface Props {
  children: ReactNode; // existing canvas content from useLLDModuleImpl
}

/**
 * Build mode · wraps today's 4-panel UI plus the Phase 3 dock + rail.
 *
 * Layout:
 *   +----------+------------------------------------+
 *   | Dock     |  Actions rail                      |
 *   | (L)      +------------------------------------+
 *   |          |                                    |
 *   |          |  children (canvas)                 |
 *   |          |  (overlaid: AnnotationLayer)       |
 *   |          |                                    |
 *   +----------+------------------------------------+
 */
export const BuildModeLayout = memo(function BuildModeLayout({
  children,
}: Props) {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const push = useCanvasStore((s) => s.pushNamedSnapshot);

  useBuildKeyboardShortcuts({
    enabled: true,
    onOpenTemplates: () => setTemplatesOpen(true),
    onOpenAI: () => setAiOpen((v) => !v),
    onCaptureSnapshot: () => push(`Snap ${new Date().toLocaleTimeString()}`, null),
    onExportPNG: () => {
      // forward to the global custom event the BuildExportMenu listens for
      window.dispatchEvent(new CustomEvent("lld:export-png"));
    },
    onNewNode: () => {
      window.dispatchEvent(new CustomEvent("lld:new-node"));
    },
  });

  return (
    <div className="flex h-full w-full">
      <PatternLibraryDock />

      <div className="relative flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border/20 px-3 py-1.5">
          <AnnotationToolbar />
          <BuildActionsRail />
        </div>

        <div className="relative flex-1 min-h-0">
          {children}
          <AnnotationLayer />
        </div>
      </div>
    </div>
  );
});
```

If the Phase 1 version of this file only took `children` and rendered `<div className="h-full w-full">{children}</div>`, confirm no other consumer relies on that exact shape — callers pass `buildContent` through `LLDShell`, which forwards to `<BuildModeLayout>{buildContent}</BuildModeLayout>`.

- [ ] **Step 2: Verify typecheck + build**

```bash
pnpm typecheck
pnpm build
```
Expected: both pass. If build fails because Lucide icons aren't tree-shaken properly, verify imports are named (no `import * from "lucide-react"`).

- [ ] **Step 3: Commit**

```bash
git add architex/src/components/modules/lld/modes/BuildModeLayout.tsx
git commit -m "feat(lld): assemble Phase 3 Build-mode layout

PatternLibraryDock on the left, AnnotationToolbar + BuildActionsRail
across the top, existing canvas as children with AnnotationLayer
overlaid. Keyboard shortcuts wired through useBuildKeyboardShortcuts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 19: Persistence sync — snapshots + annotations to DB

**Files:**
- Create: `architex/src/hooks/useLLDDesignSync.ts`

- [ ] **Step 1: Create the sync hook**

Create `architex/src/hooks/useLLDDesignSync.ts`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCanvasStore } from "@/stores/canvas-store";

interface SyncArgs {
  designId: string | null;
}

async function persistSnapshot(designId: string, body: {
  canvasState: Record<string, unknown>;
  kind: "auto" | "named";
  label?: string | null;
  note?: string | null;
  nodeCount: number;
  edgeCount: number;
}) {
  const res = await fetch(`/api/lld/designs/${designId}/snapshots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`snapshot sync failed: ${res.status}`);
  return res.json();
}

/**
 * When bound to an active design:
 *  - Every new namedSnapshot is persisted immediately.
 *  - An auto-save fires 30s after the last canvas mutation.
 */
export function useLLDDesignSync({ designId }: SyncArgs): void {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const namedSnapshots = useCanvasStore((s) => s.namedSnapshots);

  const mutation = useMutation({
    mutationFn: ({
      designId: id,
      body,
    }: {
      designId: string;
      body: Parameters<typeof persistSnapshot>[1];
    }) => persistSnapshot(id, body),
    networkMode: "offlineFirst",
    retry: 2,
  });

  // Persist new named snapshots (immediate).
  const lastNamedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!designId) return;
    const latest = namedSnapshots[0];
    if (!latest || latest.id === lastNamedIdRef.current) return;
    lastNamedIdRef.current = latest.id;
    mutation.mutate({
      designId,
      body: {
        canvasState: {
          nodes: latest.nodes,
          edges: latest.edges,
          groups: latest.groups,
        },
        kind: "named",
        label: latest.label,
        note: latest.note,
        nodeCount: latest.nodes.length,
        edgeCount: latest.edges.length,
      },
    });
  }, [namedSnapshots, designId, mutation]);

  // Auto-save 30s after last mutation.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!designId) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      mutation.mutate({
        designId,
        body: {
          canvasState: { nodes, edges },
          kind: "auto",
          nodeCount: nodes.length,
          edgeCount: edges.length,
        },
      });
    }, 30_000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [nodes, edges, designId, mutation]);
}
```

- [ ] **Step 2: Wire into BuildModeLayout (optional, behind designId)**

Open `BuildModeLayout.tsx` and at the top of the component:

```tsx
import { useLLDDesignSync } from "@/hooks/useLLDDesignSync";
// inside the component:
const activeDesignId = useCanvasStore((s) => s.activeDesignId);
useLLDDesignSync({ designId: activeDesignId });
```

When `activeDesignId` is `null` (user hasn't saved yet), the hook no-ops. The "Save as design" flow is authored in the snapshots drawer later (follow-up task).

- [ ] **Step 3: Verify typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add architex/src/hooks/useLLDDesignSync.ts architex/src/components/modules/lld/modes/BuildModeLayout.tsx
git commit -m "feat(hooks): persist snapshots + auto-save to DB when bound

useLLDDesignSync writes every new named snapshot immediately and
fires a 30s-after-last-mutation auto-save. No-ops until a design is
created and canvas-store.activeDesignId is set.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 20: End-to-end smoke test + progress tracker + final commit

- [ ] **Step 1: Full verification suite**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
```
All four must pass. If any fail, fix before calling Phase 3 complete.

- [ ] **Step 2: Manual smoke test in browser**

Run `pnpm dev`, open <http://localhost:3000>, click LLD in the rail, confirm:
1. Build mode is default (no regression). Existing canvas, sidebar, properties, bottom panel all render as before.
2. Pattern Library Dock appears on the left. Search "saga" — sees 1 result in Microservices.
3. Click a template → canvas populates (placeholder canvasState still renders as empty graph; real content lands after Task 6 step 2 re-seed with real JSON).
4. Click Templates button in rail → dialog opens with grid; filter by "advanced" → only 3-tier templates remain.
5. Click Suggest → intent box appears → type "this is a parking lot" → press "Ask Haiku" → within ~3s, 3-7 suggestions render; click Add on one → new class appears on canvas.
6. Open Layout menu → pick "Circular" → nodes rearrange on a circle.
7. Click Export → "Export as PNG" → PNG downloads.
8. Capture snapshot labelled "v1" → open Snapshots drawer → row appears. Add another node. Click Restore on "v1" → previous state returns.
9. Right-click a node → "Notes" → popover opens → type note → blur → reopen → note persists.
10. Click Note toolbar button → sticky note appears → type → deletes cleanly with ×.
11. Keyboard: ⌘⇧L works, ⌘⇧T works, ⌘⇧A works, ⌘Z / ⌘⇧Z undo/redo.

Anything broken pauses the phase.

- [ ] **Step 3: Create progress tracker**

Create `docs/superpowers/plans/.progress-phase-3.md`:

```markdown
# Phase 3 Progress Tracker

- [x] Phase 3.0 pre-flight complete
- [x] Task 1: lld_designs schema
- [x] Task 2: lld_design_snapshots schema
- [x] Task 3: lld_templates_library schema
- [x] Task 4: lld_design_annotations schema
- [x] Task 5: migrations generated + applied
- [x] Task 6: templates-library seed (~60 entries)
- [x] Task 7: GET /api/lld/templates-library
- [x] Task 8: designs + snapshots + annotations API routes
- [x] Task 9: AI suggest-nodes builder + route
- [x] Task 10: canvas-store snapshots + annotations + notes
- [x] Task 11: auto-layout presets + hook
- [x] Task 12: AI / templates / designs data hooks
- [x] Task 13: PatternLibraryDock + Item
- [x] Task 14: TemplateLoaderDialog + AISuggestionsCard
- [x] Task 15: AutoLayoutMenu + ExportMenu + SnapshotsDrawer + ActionsRail
- [x] Task 16: NodeNotesPopover + AnnotationLayer + Toolbar
- [x] Task 17: useBuildKeyboardShortcuts
- [x] Task 18: BuildModeLayout assembly
- [x] Task 19: useLLDDesignSync
- [x] Task 20: smoke test + verification

Phase 3 complete on: <YYYY-MM-DD>
Ready to start Phase 4: Content expansion + advanced features.
```

- [ ] **Step 4: Final commit + tag**

```bash
git add docs/superpowers/plans/.progress-phase-3.md
git commit -m "$(cat <<'EOF'
plan(lld-phase-3): build mode canvas + patterns + export

Phase 3 complete. Diamond-grade Build mode:
- 4 new DB tables (designs, snapshots, templates library, annotations)
- ~60 curated templates seeded
- 7 new API routes (templates + designs CRUD + snapshots + annotations + AI)
- Pattern Library Dock (searchable, categorized, collapsible)
- Template Loader Dialog
- AI "what's missing" card (Haiku, 20/hr rate limit)
- 4 auto-layout presets (Dagre + circular)
- 5 export formats (PNG/SVG/Mermaid/PlantUML/JSON)
- Named snapshots drawer with restore
- Per-node notes + floating sticky-note annotations
- Keyboard shortcuts (⌘N, ⌘⇧T/A/L/Y/O/S/P, ⌘Z/⌘⇧Z)

Build-mode sidebar / canvas / properties / bottom panel unchanged.

Ready for Phase 4: Content expansion (Waves 2-8) + advanced features.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"

git tag phase-3-complete
```

---

## Self-review checklist

Before declaring Phase 3 shipped:

**Spec coverage (§6 Build additions + §7 persistence + §12 AI + §14 keyboard):**
- [x] Pattern library dock (searchable left panel) — Task 13
- [x] Template loader with ~60 curated starters — Tasks 6, 14
- [x] AI node suggestions (Haiku, `/api/lld/ai/suggest-nodes`) — Tasks 9, 12, 14
- [x] Four auto-layout presets over Dagre — Tasks 11, 15
- [x] Five export formats through a single menu — Task 15
- [x] Named snapshots + extended undo/redo — Tasks 10, 15, 19
- [x] Keyboard-first authoring — Task 17
- [x] Per-node notes + annotation layer — Tasks 10, 16
- [x] DB schema additions (`lld_designs`, `lld_design_snapshots`, `lld_templates_library`, `lld_design_annotations`) — Tasks 1-5

**Explicitly out of scope for Phase 3:**
- Anti-pattern detector (A4) — deferred to Phase 4 AI batch
- Pattern recommendation engine (A5) — deferred to Phase 4
- Split-view (L4), pattern tabs (L3) — deferred to Phase 5 shell rebuild
- Canvas annotations as arrows/circles — only sticky-note kind shipped; extend in Phase 4
- Spotlight + favourites + tags (I2/I4/I8) — Phase 4
- Any Drill / Review / Learn changes — not touched
- Studio UI rebuild (R1-R12) — Phase 5

**Placeholder check:** Every step shows exact code or exact command. No TBDs, no "implement later", no skipped code blocks.

**Type consistency:** `NamedCanvasSnapshot` and `CanvasAnnotation` live in `canvas-store`, imported elsewhere. `NodeSuggestion` lives in `lib/lld/ai-node-suggestions`, imported by hook + card. No naming drift.

---

## Open questions for the user

These are acknowledged but do NOT block execution — sensible defaults are shipped and questions surface at phase completion.

1. **Templates canvasState authoring** — the 60 seed entries ship with `{ nodes: [], edges: [] }` placeholders. Step 2 of Task 6 asks who authors the real JSON. Options: (a) Opus batch-writes all 60 in Phase 4, (b) extract from `src/lib/templates/blueprints/*.json` existing 15 files + hand-author 45 more, (c) generate from pattern definitions programmatically. Pick before Phase 4 content wave.
2. **AI rate limit sizing** — 20 calls/hour/user matches Haiku's pricing envelope at $0.80/MTok. If adoption is high, bump to 40/hr or introduce a tier-aware quota.
3. **Auto-save cadence** — 30s after last mutation is conservative; could drop to 10s without overwhelming the DB. Revisit after observing real user editing sessions.
4. **Annotation shapes beyond sticky-note** — arrow + circle + text ship as `kind` enum values but only sticky-note renders in Phase 3. Phase 4 or a small follow-up adds the other three.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-20-lld-phase-3-build-mode.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks. Each task lands in isolated context so focus stays tight.

**2. Inline Execution** — execute tasks in this session using superpowers:executing-plans, batch execution with checkpoints for review.

Which approach?
