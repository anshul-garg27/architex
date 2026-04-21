# Blueprint SP1 · Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Blueprint module scaffolding — DB schema, Zustand store, URL router, shell, route tree, API endpoints, analytics taxonomy, navigation entry — so all later sub-projects have a stable foundation to build on.

**Architecture:** New Architex module at `/modules/blueprint`. Desktop-only. Dedicated route tree (not home-page module switcher). Single Zustand store for UI state; server-sync hooks for persistence. URL is single source of truth for `currentSurface`. Shares underlying data (patterns, problems, FSRS) with old LLD; adds its own `blueprint_*` tables for journey state and progress. Shell is single component tree with three surfaces: Journey (default), Toolkit, Progress. No mode switcher — ever.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Zustand 5 + persist middleware, TanStack Query 5, Drizzle ORM, PostgreSQL, Clerk auth + anonymous-fingerprint fallback, Vitest, Testing Library, Playwright.

**Parent spec:** `docs/superpowers/specs/2026-04-21-blueprint-sp1-foundation.md`
**Vision:** `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md`

---

## Pre-flight checklist

Run before Task 1. Verifies environment and prior-art.

- [ ] **Verify you are in the Blueprint worktree**

```bash
pwd
```
Expected: `.../architex/.claude/worktrees/blueprint-module`

- [ ] **Verify branch is `feat/blueprint-module`**

```bash
git branch --show-current
```
Expected: `feat/blueprint-module`

- [ ] **Install dependencies in the worktree**

```bash
cd architex && pnpm install
```
Expected: success. If pnpm store is shared with main worktree, it's fast (links from global store).

- [ ] **Verify baseline green**

```bash
cd architex && pnpm typecheck && pnpm lint && pnpm test:run
```
Expected: all pass. If `test:run` has pre-existing failures (e.g. React.act issue documented in session memory), note them and proceed — they're not introduced by this plan.

- [ ] **Read `architex/CLAUDE.md` and `architex/AGENTS.md`**

Confirm: "This is NOT the Next.js you know" — when writing `page.tsx` / `layout.tsx` / API routes, consult `node_modules/next/dist/docs/` before guessing.

- [ ] **Read existing patterns (one representative of each)**

```bash
# One schema file
cat src/db/schema/lld-learn-progress.ts
# One Zustand store
cat src/stores/interview-store.ts | head -80
# One API route
cat src/app/api/lld/learn-progress/route.ts 2>/dev/null | head -60
# Existing module route pattern
ls src/app/modules
```

---

## File Structure (recap from spec §8)

```
architex/
├── drizzle/NNNN_add_blueprint_core.sql
├── content/blueprint/{units,shared/concepts,shared/problems}/
├── scripts/blueprint/seed-units.ts
├── src/
│   ├── db/schema/{blueprint-courses,blueprint-units,blueprint-user-progress,blueprint-journey-state,blueprint-events}.ts
│   ├── db/schema/{index,relations}.ts  (modified)
│   ├── stores/blueprint-store.ts + __tests__
│   ├── stores/ui-store.ts  (modified — add "blueprint" to ModuleType)
│   ├── hooks/blueprint/{useBlueprintRoute,useJourneyStateSync,useUnitProgressSync,useBlueprintAnalytics}.ts + __tests__
│   ├── lib/analytics/blueprint-events.ts
│   ├── components/modules/blueprint/BlueprintShell.tsx + shell/*
│   ├── components/modules/blueprint/BlueprintComingSoon.tsx
│   ├── components/shared/workspace-layout.tsx  (modified — nav entry)
│   └── app/
│       ├── modules/page.tsx  (modified — MODULES array)
│       ├── modules/blueprint/{layout,page,loading,error}.tsx
│       ├── modules/blueprint/welcome/page.tsx
│       ├── modules/blueprint/unit/[unitSlug]/{page,complete/page}.tsx
│       ├── modules/blueprint/toolkit/{layout,page}.tsx
│       ├── modules/blueprint/toolkit/{patterns,problems,review}/page.tsx
│       ├── modules/blueprint/toolkit/patterns/[patternSlug]/{page,compare/page}.tsx
│       ├── modules/blueprint/toolkit/problems/[problemSlug]/{page,drill/page}.tsx
│       ├── modules/blueprint/progress/{layout,page}.tsx
│       ├── modules/blueprint/progress/{patterns,problems,streak}/page.tsx
│       └── api/blueprint/{journey-state,units,units/[slug],units/[slug]/progress,events,progress/summary}/route.ts
├── e2e/blueprint-smoke.spec.ts
├── package.json  (modified — +blueprint:seed-units)
└── docs/superpowers/blueprint/README.md
```

**Design rationale for splits (from spec §8):**
- One schema file per table — matches existing convention, keeps each schema focused.
- Shell sub-components split by concern — makes each < 150 lines, easier to test.
- Hooks split per responsibility (URL, journey sync, progress sync, analytics) — each has its own test surface.
- API routes follow App Router convention.

---

## Task 1: Schema · `blueprint_courses` table

**Files:**
- Create: `architex/src/db/schema/blueprint-courses.ts`
- Modify: `architex/src/db/schema/index.ts` (re-export)

- [ ] **Step 1: Write the schema**

Create `architex/src/db/schema/blueprint-courses.ts`:

```typescript
import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const blueprintCourses = pgTable(
  "blueprint_courses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull(),
    title: text("title").notNull(),
    description: text("description"),
    version: varchar("version", { length: 20 }).notNull().default("v1.0.0"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("blueprint_courses_slug_idx").on(t.slug)],
);

export type BlueprintCourse = typeof blueprintCourses.$inferSelect;
export type NewBlueprintCourse = typeof blueprintCourses.$inferInsert;
```

- [ ] **Step 2: Re-export from schema index**

Edit `architex/src/db/schema/index.ts` — add:

```typescript
export {
  blueprintCourses,
  type BlueprintCourse,
  type NewBlueprintCourse,
} from "./blueprint-courses";
```

- [ ] **Step 3: Verify typecheck**

```bash
cd architex && pnpm typecheck
```
Expected: PASS. Any failure means the schema has a type error — fix before proceeding.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/blueprint-courses.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add blueprint_courses table"
```

---

## Task 2: Schema · `blueprint_units` table

**Files:**
- Create: `architex/src/db/schema/blueprint-units.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Write the schema**

```typescript
import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { blueprintCourses } from "./blueprint-courses";

export type BlueprintDifficulty = "foundation" | "intermediate" | "advanced";

export interface BlueprintEntityRefs {
  patterns: string[];
  problems: string[];
}

export interface BlueprintSectionRecipe {
  id: string; // stable section slug within unit, e.g. "meet-builder"
  type: "read" | "interact" | "apply" | "practice" | "retain" | "reflect" | "checkpoint";
  title: string;
  params?: Record<string, unknown>;
}

export interface BlueprintUnitRecipe {
  version: number; // recipe-schema version, start at 1
  sections: BlueprintSectionRecipe[];
}

export const blueprintUnits = pgTable(
  "blueprint_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => blueprintCourses.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 100 }).notNull(),
    ordinal: integer("ordinal").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    difficulty: varchar("difficulty", { length: 20 })
      .$type<BlueprintDifficulty>()
      .notNull()
      .default("foundation"),
    prereqUnitSlugs: text("prereq_unit_slugs")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    entityRefs: jsonb("entity_refs")
      .$type<BlueprintEntityRefs>()
      .notNull()
      .default(sql`'{"patterns": [], "problems": []}'::jsonb`),
    recipeJson: jsonb("recipe_json")
      .$type<BlueprintUnitRecipe>()
      .notNull()
      .default(sql`'{"version": 1, "sections": []}'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("blueprint_units_course_slug_idx").on(t.courseId, t.slug),
    index("blueprint_units_course_ordinal_idx").on(t.courseId, t.ordinal),
  ],
);

export type BlueprintUnit = typeof blueprintUnits.$inferSelect;
export type NewBlueprintUnit = typeof blueprintUnits.$inferInsert;
```

- [ ] **Step 2: Re-export**

Edit `architex/src/db/schema/index.ts` — add:

```typescript
export {
  blueprintUnits,
  type BlueprintUnit,
  type NewBlueprintUnit,
  type BlueprintDifficulty,
  type BlueprintEntityRefs,
  type BlueprintSectionRecipe,
  type BlueprintUnitRecipe,
} from "./blueprint-units";
```

- [ ] **Step 3: Typecheck**

```bash
cd architex && pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/blueprint-units.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add blueprint_units table with recipe JSONB"
```

---

## Task 3: Schema · `blueprint_user_progress` table

**Files:**
- Create: `architex/src/db/schema/blueprint-user-progress.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Write the schema**

```typescript
import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { blueprintUnits } from "./blueprint-units";

export type BlueprintUnitState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export interface BlueprintSectionCompletion {
  startedAt: number | null;  // epoch ms
  completedAt: number | null;
  attempts: number;
  score: number | null;  // 0..100; null if section type has no score
}

export type BlueprintSectionStatesMap = Record<
  string,
  BlueprintSectionCompletion
>;

export const blueprintUserProgress = pgTable(
  "blueprint_user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => blueprintUnits.id, { onDelete: "cascade" }),
    state: varchar("state", { length: 20 })
      .$type<BlueprintUnitState>()
      .notNull()
      .default("available"),
    sectionStates: jsonb("section_states")
      .$type<BlueprintSectionStatesMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastPosition: varchar("last_position", { length: 100 }),
    totalTimeMs: integer("total_time_ms").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    masteredAt: timestamp("mastered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("blueprint_user_progress_user_unit_idx").on(t.userId, t.unitId),
    index("blueprint_user_progress_user_idx").on(t.userId),
  ],
);

export type BlueprintUserProgress =
  typeof blueprintUserProgress.$inferSelect;
export type NewBlueprintUserProgress =
  typeof blueprintUserProgress.$inferInsert;
```

- [ ] **Step 2: Re-export**

Edit `architex/src/db/schema/index.ts`:

```typescript
export {
  blueprintUserProgress,
  type BlueprintUserProgress,
  type NewBlueprintUserProgress,
  type BlueprintUnitState,
  type BlueprintSectionCompletion,
  type BlueprintSectionStatesMap,
} from "./blueprint-user-progress";
```

- [ ] **Step 3: Typecheck**

- [ ] **Step 4: Commit**

```bash
git add src/db/schema/blueprint-user-progress.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add blueprint_user_progress per (user, unit)"
```

---

## Task 4: Schema · `blueprint_journey_state` table

**Files:**
- Create: `architex/src/db/schema/blueprint-journey-state.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Write the schema**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export type BlueprintPreferredLang = "ts" | "py" | "java";
export type BlueprintPinnedTool = "patterns" | "problems" | "review";

export const blueprintJourneyState = pgTable("blueprint_journey_state", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentUnitSlug: varchar("current_unit_slug", { length: 100 }),
  currentSectionId: varchar("current_section_id", { length: 100 }),
  welcomeDismissedAt: timestamp("welcome_dismissed_at", { withTimezone: true }),
  streakDays: integer("streak_days").notNull().default(0),
  streakLastActiveAt: timestamp("streak_last_active_at", {
    withTimezone: true,
  }),
  dailyReviewTarget: integer("daily_review_target").notNull().default(10),
  preferredLang: varchar("preferred_lang", { length: 10 })
    .$type<BlueprintPreferredLang>()
    .notNull()
    .default("ts"),
  pinnedTool: varchar("pinned_tool", { length: 20 })
    .$type<BlueprintPinnedTool>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BlueprintJourneyState =
  typeof blueprintJourneyState.$inferSelect;
export type NewBlueprintJourneyState =
  typeof blueprintJourneyState.$inferInsert;
```

- [ ] **Step 2: Re-export**

- [ ] **Step 3: Typecheck + commit**

```bash
git add src/db/schema/blueprint-journey-state.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add blueprint_journey_state per-user row"
```

---

## Task 5: Schema · `blueprint_events` append-only log

**Files:**
- Create: `architex/src/db/schema/blueprint-events.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Write the schema**

```typescript
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const blueprintEvents = pgTable(
  "blueprint_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionId: varchar("session_id", { length: 64 }),
    eventName: varchar("event_name", { length: 80 }).notNull(),
    eventPayload: jsonb("event_payload").default({}).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("blueprint_events_user_occurred_idx").on(t.userId, t.occurredAt),
    index("blueprint_events_name_occurred_idx").on(t.eventName, t.occurredAt),
  ],
);

export type BlueprintEvent = typeof blueprintEvents.$inferSelect;
export type NewBlueprintEvent = typeof blueprintEvents.$inferInsert;
```

- [ ] **Step 2: Re-export**

- [ ] **Step 3: Typecheck + commit**

```bash
git add src/db/schema/blueprint-events.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add blueprint_events append-only log"
```

---

## Task 6: Relations file + index re-exports

**Files:**
- Modify: `architex/src/db/schema/relations.ts`
- Modify: `architex/src/db/schema/index.ts`

- [ ] **Step 1: Add relations**

Edit `architex/src/db/schema/relations.ts`:

```typescript
import { relations } from "drizzle-orm";
import { blueprintCourses } from "./blueprint-courses";
import { blueprintUnits } from "./blueprint-units";
import { blueprintUserProgress } from "./blueprint-user-progress";
import { blueprintJourneyState } from "./blueprint-journey-state";
import { blueprintEvents } from "./blueprint-events";
import { users } from "./users";

export const blueprintCoursesRelations = relations(blueprintCourses, ({ many }) => ({
  units: many(blueprintUnits),
}));

export const blueprintUnitsRelations = relations(blueprintUnits, ({ one, many }) => ({
  course: one(blueprintCourses, {
    fields: [blueprintUnits.courseId],
    references: [blueprintCourses.id],
  }),
  userProgress: many(blueprintUserProgress),
}));

export const blueprintUserProgressRelations = relations(
  blueprintUserProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [blueprintUserProgress.userId],
      references: [users.id],
    }),
    unit: one(blueprintUnits, {
      fields: [blueprintUserProgress.unitId],
      references: [blueprintUnits.id],
    }),
  }),
);

export const blueprintJourneyStateRelations = relations(
  blueprintJourneyState,
  ({ one }) => ({
    user: one(users, {
      fields: [blueprintJourneyState.userId],
      references: [users.id],
    }),
  }),
);

export const blueprintEventsRelations = relations(blueprintEvents, ({ one }) => ({
  user: one(users, {
    fields: [blueprintEvents.userId],
    references: [users.id],
  }),
}));
```

Add these exports to the existing relations exports list (search for the last `export const ... Relations = relations(...)` block and add after).

- [ ] **Step 2: Re-export from schema index**

Edit `architex/src/db/schema/index.ts` — in the "Relations" block, add:

```typescript
export {
  // ... existing
  blueprintCoursesRelations,
  blueprintUnitsRelations,
  blueprintUserProgressRelations,
  blueprintJourneyStateRelations,
  blueprintEventsRelations,
} from "./relations";
```

- [ ] **Step 3: Typecheck + commit**

```bash
git add src/db/schema/relations.ts src/db/schema/index.ts
git commit -m "schema(blueprint): add relations for all blueprint_* tables"
```

---

## Task 7: Generate and apply migration

**Files:**
- Create: `drizzle/NNNN_add_blueprint_core.sql` (auto-generated)

- [ ] **Step 1: Generate migration**

```bash
cd architex && pnpm db:generate
```
This runs `drizzle-kit generate` which inspects the schema diff and produces a migration SQL.

Expected: a new file in `drizzle/` named something like `0042_add_blueprint_core.sql` (number depends on existing migrations).

- [ ] **Step 2: Inspect the generated SQL**

```bash
cat drizzle/0042_*.sql  # adjust filename
```

Must contain:
- `CREATE TABLE "blueprint_courses"` with `slug` unique
- `CREATE TABLE "blueprint_units"` with FK to `blueprint_courses`, unique `(course_id, slug)`, index `(course_id, ordinal)`
- `CREATE TABLE "blueprint_user_progress"` with FKs, unique `(user_id, unit_id)`
- `CREATE TABLE "blueprint_journey_state"` with pk = `user_id`
- `CREATE TABLE "blueprint_events"` with two indexes

If anything is missing or wrong, edit the SQL by hand OR fix the schema and regenerate.

- [ ] **Step 3: Apply the migration locally**

```bash
cd architex && pnpm db:migrate
```
Expected: no errors, tables created.

Verify:

```bash
# Use whatever DB client is configured — psql, drizzle studio, etc.
# Example:
psql $DATABASE_URL -c "\\dt blueprint_*"
```
Expected: all 5 tables listed.

- [ ] **Step 4: Commit**

```bash
git add drizzle/
git commit -m "migration(blueprint): generate + apply blueprint_* tables"
```

---

## Task 8: Seed the course + 12 placeholder units

**Files:**
- Create: `architex/scripts/blueprint/seed-units.ts`
- Modify: `architex/package.json`

- [ ] **Step 1: Write the seed script**

Create `architex/scripts/blueprint/seed-units.ts`:

```typescript
/**
 * Idempotent seed for the Blueprint course + 12 placeholder units.
 * Uses raw pg client (not drizzle client) to avoid ESM+tsx toolchain
 * issues we hit last session; matches pattern in seed-lld-lessons-from-json.mjs.
 */

import { Client } from "pg";

interface UnitSeed {
  slug: string;
  ordinal: number;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: "foundation" | "intermediate" | "advanced";
  prereqUnitSlugs: string[];
  tags: string[];
  entityRefs: { patterns: string[]; problems: string[] };
}

const COURSE_SLUG = "blueprint-core";
const COURSE_TITLE = "The Blueprint Course";
const COURSE_DESCRIPTION =
  "Design patterns, one unit at a time. Twelve units covering foundations, patterns, and applied problems.";

const UNITS: UnitSeed[] = [
  {
    slug: "what-is-a-pattern",
    ordinal: 1,
    title: "What is a design pattern?",
    summary:
      "What GoF patterns are and aren't. When to reach for one. An early look at Strategy.",
    durationMinutes: 45,
    difficulty: "foundation",
    prereqUnitSlugs: [],
    tags: ["foundation"],
    entityRefs: { patterns: ["strategy"], problems: [] },
  },
  {
    slug: "coupling-cohesion",
    ordinal: 2,
    title: "Coupling, cohesion, and the cost of a class",
    summary:
      "High cohesion, low coupling, SRP. Why classes exist. What an interface buys you.",
    durationMinutes: 60,
    difficulty: "foundation",
    prereqUnitSlugs: ["what-is-a-pattern"],
    tags: ["foundation"],
    entityRefs: { patterns: [], problems: [] },
  },
  {
    slug: "open-closed-principle",
    ordinal: 3,
    title: "The open-closed principle and its discontents",
    summary:
      "SOLID with emphasis on OCP. A preview of how patterns deliver extensibility without modification.",
    durationMinutes: 50,
    difficulty: "foundation",
    prereqUnitSlugs: ["coupling-cohesion"],
    tags: ["foundation"],
    entityRefs: { patterns: ["observer"], problems: [] },
  },
  {
    slug: "making-objects",
    ordinal: 4,
    title: "Making objects, but flexibly",
    summary:
      "Factory Method, Abstract Factory, Singleton — three approaches to 'do not new directly'.",
    durationMinutes: 75,
    difficulty: "intermediate",
    prereqUnitSlugs: ["open-closed-principle"],
    tags: ["creational"],
    entityRefs: {
      patterns: ["factory-method", "abstract-factory", "singleton"],
      problems: [],
    },
  },
  {
    slug: "constructors-that-dont-explode",
    ordinal: 5,
    title: "Constructors that don't explode",
    summary: "Builder, Prototype — when constructors get out of hand.",
    durationMinutes: 45,
    difficulty: "intermediate",
    prereqUnitSlugs: ["making-objects"],
    tags: ["creational"],
    entityRefs: { patterns: ["builder", "prototype"], problems: [] },
  },
  {
    slug: "reshaping-interfaces",
    ordinal: 6,
    title: "Reshaping interfaces",
    summary: "Adapter, Facade — make one thing look like another.",
    durationMinutes: 60,
    difficulty: "intermediate",
    prereqUnitSlugs: ["constructors-that-dont-explode"],
    tags: ["structural"],
    entityRefs: { patterns: ["adapter", "facade"], problems: [] },
  },
  {
    slug: "adding-responsibility",
    ordinal: 7,
    title: "Adding responsibility without inheritance",
    summary: "Decorator, Proxy — wrapping behavior.",
    durationMinutes: 55,
    difficulty: "intermediate",
    prereqUnitSlugs: ["reshaping-interfaces"],
    tags: ["structural"],
    entityRefs: { patterns: ["decorator", "proxy"], problems: [] },
  },
  {
    slug: "trees-and-abstractions",
    ordinal: 8,
    title: "Trees, graphs, and the cost of abstraction",
    summary: "Composite, Bridge, Flyweight — patterns for structure, not behavior.",
    durationMinutes: 65,
    difficulty: "advanced",
    prereqUnitSlugs: ["adding-responsibility"],
    tags: ["structural"],
    entityRefs: { patterns: ["composite", "bridge", "flyweight"], problems: [] },
  },
  {
    slug: "communicating-without-coupling",
    ordinal: 9,
    title: "Communicating without coupling",
    summary: "Observer, Mediator, Chain of Responsibility — how objects talk.",
    durationMinutes: 75,
    difficulty: "advanced",
    prereqUnitSlugs: ["trees-and-abstractions"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["observer", "mediator", "chain-of-responsibility"],
      problems: [],
    },
  },
  {
    slug: "algorithms-as-objects",
    ordinal: 10,
    title: "Algorithms as objects",
    summary: "Strategy (deepened), Template Method, Command — encapsulating a verb.",
    durationMinutes: 60,
    difficulty: "advanced",
    prereqUnitSlugs: ["communicating-without-coupling"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["strategy", "template-method", "command"],
      problems: [],
    },
  },
  {
    slug: "state-memory-traversal",
    ordinal: 11,
    title: "State, memory, and traversal",
    summary: "State, Memento, Iterator, Visitor — first-class internal structure.",
    durationMinutes: 70,
    difficulty: "advanced",
    prereqUnitSlugs: ["algorithms-as-objects"],
    tags: ["behavioral"],
    entityRefs: {
      patterns: ["state", "memento", "iterator", "visitor"],
      problems: [],
    },
  },
  {
    slug: "systems-using-patterns",
    ordinal: 12,
    title: "Systems that use patterns together",
    summary:
      "Four applied problems walked end-to-end: Parking Lot, Library Management, LRU Cache, Chess.",
    durationMinutes: 120,
    difficulty: "advanced",
    prereqUnitSlugs: ["state-memory-traversal"],
    tags: ["applied"],
    entityRefs: {
      patterns: [],
      problems: [
        "prob-parking-lot",
        "prob-library",
        "prob-lru-cache",
        "prob-chess",
      ],
    },
  },
];

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) throw new Error("DATABASE_URL not set");
  const client = new Client({ connectionString: conn });
  await client.connect();

  try {
    // Upsert the course.
    const courseResult = await client.query(
      `INSERT INTO blueprint_courses (slug, title, description, version, published_at)
       VALUES ($1, $2, $3, 'v1.0.0', now())
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         updated_at = now()
       RETURNING id`,
      [COURSE_SLUG, COURSE_TITLE, COURSE_DESCRIPTION],
    );
    const courseId: string = courseResult.rows[0].id;

    for (const u of UNITS) {
      await client.query(
        `INSERT INTO blueprint_units (
          course_id, slug, ordinal, title, summary,
          duration_minutes, difficulty, prereq_unit_slugs, tags,
          entity_refs, recipe_json, published_at
         ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8::text[], $9::text[],
          $10::jsonb, $11::jsonb, now()
         )
         ON CONFLICT (course_id, slug) DO UPDATE SET
          ordinal = EXCLUDED.ordinal,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          duration_minutes = EXCLUDED.duration_minutes,
          difficulty = EXCLUDED.difficulty,
          prereq_unit_slugs = EXCLUDED.prereq_unit_slugs,
          tags = EXCLUDED.tags,
          entity_refs = EXCLUDED.entity_refs,
          updated_at = now()`,
        [
          courseId,
          u.slug,
          u.ordinal,
          u.title,
          u.summary,
          u.durationMinutes,
          u.difficulty,
          u.prereqUnitSlugs,
          u.tags,
          JSON.stringify(u.entityRefs),
          JSON.stringify({ version: 1, sections: [] }),
        ],
      );
    }

    console.log(`[blueprint-seed] upserted ${UNITS.length} units`);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add pnpm script**

Edit `architex/package.json` — in `"scripts"`:

```json
"blueprint:seed-units": "tsx scripts/blueprint/seed-units.ts"
```

(Use whatever TS runner the other seeds use — probably `tsx` or `node --import=tsx/esm`.)

- [ ] **Step 3: Run the seed**

```bash
cd architex && pnpm blueprint:seed-units
```
Expected: `[blueprint-seed] upserted 12 units`.

- [ ] **Step 4: Verify**

```bash
psql $DATABASE_URL -c "SELECT slug, ordinal, title FROM blueprint_units ORDER BY ordinal;"
```
Expected: 12 rows, ordered 1..12.

- [ ] **Step 5: Commit**

```bash
git add scripts/blueprint/seed-units.ts package.json
git commit -m "seed(blueprint): 12 curriculum placeholder units"
```

---

## Task 9: Blueprint analytics event taxonomy

**Files:**
- Create: `architex/src/lib/analytics/blueprint-events.ts`
- Create: `architex/src/lib/analytics/__tests__/blueprint-events.test.ts`

- [ ] **Step 1: Write failing test first**

Create `architex/src/lib/analytics/__tests__/blueprint-events.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import * as events from "../blueprint-events";

describe("blueprint-events typed builders", () => {
  it("exports all 25 event builders from the vision spec taxonomy", () => {
    const expectedNames = [
      "blueprintModuleOpened",
      "blueprintWelcomeShown",
      "blueprintWelcomeDismissed",
      "blueprintResumeClicked",
      "blueprintUnitOpened",
      "blueprintUnitCompleted",
      "blueprintUnitMastered",
      "blueprintSectionOpened",
      "blueprintSectionCompleted",
      "blueprintCheckpointStarted",
      "blueprintCheckpointPassed",
      "blueprintToolkitOpened",
      "blueprintToolPinned",
      "blueprintPatternViewed",
      "blueprintProblemDrillStarted",
      "blueprintProblemDrillSubmitted",
      "blueprintReviewSessionStarted",
      "blueprintReviewSessionCompleted",
      "blueprintFlashcardRated",
      "blueprintSearchPerformed",
      "blueprintAiSurfaceTriggered",
      "blueprintAiRequestSent",
      "blueprintFrustrationDetected",
      "blueprintErrorShown",
      "blueprintStreakUpdated",
    ] as const;

    for (const name of expectedNames) {
      expect(events, `missing export: ${name}`).toHaveProperty(name);
      expect(typeof (events as Record<string, unknown>)[name]).toBe("function");
    }
  });

  it("moduleOpened returns typed payload", () => {
    const e = events.blueprintModuleOpened({ entrySurface: "journey" });
    expect(e.name).toBe("blueprint.module_opened");
    expect(e.payload).toMatchObject({ entrySurface: "journey" });
  });
});
```

- [ ] **Step 2: Run test — should fail**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/blueprint-events.test.ts
```
Expected: FAIL (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `architex/src/lib/analytics/blueprint-events.ts`:

```typescript
/**
 * Typed event builders for the Blueprint module.
 *
 * Every event PostHog sees must flow through one of these builders.
 * The builder returns `{ name, payload }`. The consumer (useBlueprintAnalytics)
 * passes the pair to posthog.capture(name, payload).
 *
 * Why typed builders: prevents payload drift. Adding a new event here is
 * a conscious act with a PR discussion.
 *
 * Taxonomy locked in vision spec §15.1.
 */

export type BlueprintSurface = "journey" | "toolkit" | "progress";
export type BlueprintToolkitTool = "patterns" | "problems" | "review";
export type BlueprintUnitEntry = "map" | "resume" | "deeplink" | "next" | "search";
export type BlueprintSectionType =
  | "read"
  | "interact"
  | "apply"
  | "practice"
  | "retain"
  | "reflect"
  | "checkpoint";
export type BlueprintAttention = "calm" | "mild" | "frustrated" | "very_frustrated";

export interface BlueprintEvent<TPayload> {
  name: string;
  payload: TPayload;
}

// ── Journey events ──────────────────────────────────────

export const blueprintModuleOpened = (p: {
  entrySurface: BlueprintSurface;
  from?: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.module_opened",
  payload: p,
});

export const blueprintWelcomeShown = (): BlueprintEvent<Record<string, never>> => ({
  name: "blueprint.welcome_shown",
  payload: {},
});

export const blueprintWelcomeDismissed = (p: {
  action: "start_course" | "drill_problem" | "browse_patterns" | "close";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.welcome_dismissed",
  payload: p,
});

export const blueprintResumeClicked = (p: {
  unitSlug: string;
  sectionId: string | null;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.resume_clicked",
  payload: p,
});

export const blueprintUnitOpened = (p: {
  unitSlug: string;
  entry: BlueprintUnitEntry;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_opened",
  payload: p,
});

export const blueprintUnitCompleted = (p: {
  unitSlug: string;
  totalTimeMs: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_completed",
  payload: p,
});

export const blueprintUnitMastered = (p: {
  unitSlug: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_mastered",
  payload: p,
});

export const blueprintSectionOpened = (p: {
  unitSlug: string;
  sectionId: string;
  sectionType: BlueprintSectionType;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.section_opened",
  payload: p,
});

export const blueprintSectionCompleted = (p: {
  unitSlug: string;
  sectionId: string;
  sectionType: BlueprintSectionType;
  timeMs: number;
  score?: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.section_completed",
  payload: p,
});

export const blueprintCheckpointStarted = (p: {
  unitSlug: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.checkpoint_started",
  payload: p,
});

export const blueprintCheckpointPassed = (p: {
  unitSlug: string;
  score: number;
  attempts: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.checkpoint_passed",
  payload: p,
});

// ── Toolkit events ──────────────────────────────────────

export const blueprintToolkitOpened = (p: {
  from: BlueprintSurface;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.toolkit_opened",
  payload: p,
});

export const blueprintToolPinned = (p: {
  tool: BlueprintToolkitTool | null;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.tool_pinned",
  payload: p,
});

export const blueprintPatternViewed = (p: {
  patternSlug: string;
  source: "library" | "unit" | "compare" | "review";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.pattern_viewed",
  payload: p,
});

export const blueprintProblemDrillStarted = (p: {
  problemSlug: string;
  subMode: "interview" | "guided" | "speed";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.problem_drill_started",
  payload: p,
});

export const blueprintProblemDrillSubmitted = (p: {
  problemSlug: string;
  subMode: "interview" | "guided" | "speed";
  score: number;
  grade: "excellent" | "good" | "coaching" | "redirect";
  timeMs: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.problem_drill_submitted",
  payload: p,
});

export const blueprintReviewSessionStarted = (p: {
  dueCount: number;
  target: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.review_session_started",
  payload: p,
});

export const blueprintReviewSessionCompleted = (p: {
  cardsReviewed: number;
  streakDays: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.review_session_completed",
  payload: p,
});

export const blueprintFlashcardRated = (p: {
  cardId: string;
  rating: "again" | "hard" | "good" | "easy";
  entitySlug: string;
  entityType: "pattern" | "problem";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.flashcard_rated",
  payload: p,
});

// ── Cross-cutting events ────────────────────────────────

export const blueprintSearchPerformed = (p: {
  surface: BlueprintSurface;
  query: string;
  resultsCount: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.search_performed",
  payload: p,
});

export const blueprintAiSurfaceTriggered = (p: {
  surface: "checkpoint_failure" | "section_end" | "confused_with";
  entitySlug?: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.ai_surface_triggered",
  payload: p,
});

export const blueprintAiRequestSent = (p: {
  surface: "checkpoint_failure" | "section_end" | "confused_with";
  promptLength: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.ai_request_sent",
  payload: p,
});

export const blueprintFrustrationDetected = (p: {
  level: BlueprintAttention;
  unitSlug: string;
  sectionId: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.frustration_detected",
  payload: p,
});

export const blueprintErrorShown = (p: {
  code: string;
  surface: BlueprintSurface;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.error_shown",
  payload: p,
});

export const blueprintStreakUpdated = (p: {
  streakDays: number;
  source: "review_session" | "daily_bonus";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.streak_updated",
  payload: p,
});
```

- [ ] **Step 4: Run test — should pass**

```bash
cd architex && pnpm test:run src/lib/analytics/__tests__/blueprint-events.test.ts
```
Expected: PASS (25/25 events found, moduleOpened payload types correctly).

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/blueprint-events.ts src/lib/analytics/__tests__/blueprint-events.test.ts
git commit -m "analytics(blueprint): 25 typed event builders per vision §15.1"
```

---

## Task 10: Zustand store · `blueprint-store`

**Files:**
- Create: `architex/src/stores/blueprint-store.ts`
- Create: `architex/src/stores/__tests__/blueprint-store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `architex/src/stores/__tests__/blueprint-store.test.ts`:

```typescript
import { describe, expect, it, beforeEach } from "vitest";
import { useBlueprintStore } from "../blueprint-store";

describe("blueprint-store", () => {
  beforeEach(() => {
    useBlueprintStore.getState().reset();
  });

  it("has correct defaults", () => {
    const s = useBlueprintStore.getState();
    expect(s.currentSurface).toBe("journey");
    expect(s.currentUnitSlug).toBeNull();
    expect(s.currentSectionId).toBeNull();
    expect(s.welcomeDismissed).toBe(false);
    expect(s.activeTool).toBeNull();
    expect(s.preferredLang).toBe("ts");
    expect(s.dailyReviewTarget).toBe(10);
  });

  it("setSurface updates currentSurface", () => {
    useBlueprintStore.getState().setSurface("toolkit");
    expect(useBlueprintStore.getState().currentSurface).toBe("toolkit");
  });

  it("setCurrentUnit updates slug and optionally section", () => {
    useBlueprintStore.getState().setCurrentUnit("meet-builder", "itch");
    const s = useBlueprintStore.getState();
    expect(s.currentUnitSlug).toBe("meet-builder");
    expect(s.currentSectionId).toBe("itch");
  });

  it("dismissWelcome is idempotent", () => {
    useBlueprintStore.getState().dismissWelcome();
    useBlueprintStore.getState().dismissWelcome();
    expect(useBlueprintStore.getState().welcomeDismissed).toBe(true);
  });

  it("openTool sets the triplet", () => {
    useBlueprintStore
      .getState()
      .openTool("problems", "prob-parking-lot", "interview");
    const s = useBlueprintStore.getState();
    expect(s.activeTool).toBe("problems");
    expect(s.activeEntityId).toBe("prob-parking-lot");
    expect(s.toolkitSubMode).toBe("interview");
  });

  it("closeTool clears the triplet", () => {
    useBlueprintStore
      .getState()
      .openTool("patterns", "builder");
    useBlueprintStore.getState().closeTool();
    const s = useBlueprintStore.getState();
    expect(s.activeTool).toBeNull();
    expect(s.activeEntityId).toBeNull();
  });

  it("updateUnitProgress writes into cache", () => {
    useBlueprintStore.getState().updateUnitProgress("meet-builder", {
      unitSlug: "meet-builder",
      state: "in_progress",
      sectionStates: {},
      lastSeenAt: 12345,
    });
    expect(
      useBlueprintStore.getState().unitProgress["meet-builder"].state,
    ).toBe("in_progress");
  });

  it("hydrate applies a partial server snapshot", () => {
    useBlueprintStore.getState().hydrate({
      preferredLang: "py",
      welcomeDismissed: true,
      pinnedTool: "problems",
    });
    const s = useBlueprintStore.getState();
    expect(s.preferredLang).toBe("py");
    expect(s.welcomeDismissed).toBe(true);
    expect(s.pinnedTool).toBe("problems");
  });
});
```

- [ ] **Step 2: Run test — should fail**

```bash
cd architex && pnpm test:run src/stores/__tests__/blueprint-store.test.ts
```
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation**

Create `architex/src/stores/blueprint-store.ts`:

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BlueprintSurface = "journey" | "toolkit" | "progress";
export type BlueprintToolkitTool = "patterns" | "problems" | "review";
export type BlueprintPreferredLang = "ts" | "py" | "java";

export type BlueprintUnitState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export interface SectionCompletion {
  completed: boolean;
  attempts: number;
  score?: number;
}

export interface UnitProgressCache {
  unitSlug: string;
  state: BlueprintUnitState;
  sectionStates: Record<string, SectionCompletion>;
  lastSeenAt: number; // epoch ms
}

export interface BlueprintStoreState {
  // ── Surface (URL-derived; store is a cache) ────────────
  currentSurface: BlueprintSurface;

  // ── Journey ────────────────────────────────────────────
  currentUnitSlug: string | null;
  currentSectionId: string | null;
  unitProgress: Record<string, UnitProgressCache>;
  welcomeDismissed: boolean;

  // ── Toolkit ────────────────────────────────────────────
  activeTool: BlueprintToolkitTool | null;
  activeEntityId: string | null;
  toolkitSubMode: string | null;
  pinnedTool: BlueprintToolkitTool | null;

  // ── Preferences ────────────────────────────────────────
  preferredLang: BlueprintPreferredLang;
  dailyReviewTarget: number;

  // ── Actions ────────────────────────────────────────────
  setSurface: (s: BlueprintSurface) => void;
  setCurrentUnit: (slug: string | null, sectionId?: string | null) => void;
  setCurrentSection: (sectionId: string | null) => void;
  dismissWelcome: () => void;
  openTool: (
    tool: BlueprintToolkitTool,
    entityId?: string,
    subMode?: string,
  ) => void;
  closeTool: () => void;
  pinTool: (tool: BlueprintToolkitTool | null) => void;
  setPreferredLang: (lang: BlueprintPreferredLang) => void;
  setDailyReviewTarget: (n: number) => void;
  updateUnitProgress: (slug: string, cache: UnitProgressCache) => void;
  hydrate: (partial: Partial<BlueprintStoreState>) => void;
  reset: () => void;
}

const DEFAULTS: Omit<
  BlueprintStoreState,
  | "setSurface"
  | "setCurrentUnit"
  | "setCurrentSection"
  | "dismissWelcome"
  | "openTool"
  | "closeTool"
  | "pinTool"
  | "setPreferredLang"
  | "setDailyReviewTarget"
  | "updateUnitProgress"
  | "hydrate"
  | "reset"
> = {
  currentSurface: "journey",
  currentUnitSlug: null,
  currentSectionId: null,
  unitProgress: {},
  welcomeDismissed: false,
  activeTool: null,
  activeEntityId: null,
  toolkitSubMode: null,
  pinnedTool: null,
  preferredLang: "ts",
  dailyReviewTarget: 10,
};

export const useBlueprintStore = create<BlueprintStoreState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setSurface: (s) => set({ currentSurface: s }),

      setCurrentUnit: (slug, sectionId = null) =>
        set({ currentUnitSlug: slug, currentSectionId: sectionId }),

      setCurrentSection: (sectionId) => set({ currentSectionId: sectionId }),

      dismissWelcome: () => set({ welcomeDismissed: true }),

      openTool: (tool, entityId = null, subMode = null) =>
        set({
          activeTool: tool,
          activeEntityId: entityId,
          toolkitSubMode: subMode,
        }),

      closeTool: () =>
        set({
          activeTool: null,
          activeEntityId: null,
          toolkitSubMode: null,
        }),

      pinTool: (tool) => set({ pinnedTool: tool }),

      setPreferredLang: (lang) => set({ preferredLang: lang }),

      setDailyReviewTarget: (n) => set({ dailyReviewTarget: Math.max(1, n) }),

      updateUnitProgress: (slug, cache) =>
        set((s) => ({
          unitProgress: { ...s.unitProgress, [slug]: cache },
        })),

      hydrate: (partial) => set((s) => ({ ...s, ...partial })),

      reset: () => set(DEFAULTS),
    }),
    {
      name: "blueprint-store",
      storage: createJSONStorage(() => localStorage),
      // Persist only non-ephemeral fields
      partialize: (s) => ({
        welcomeDismissed: s.welcomeDismissed,
        pinnedTool: s.pinnedTool,
        preferredLang: s.preferredLang,
        dailyReviewTarget: s.dailyReviewTarget,
        unitProgress: s.unitProgress,
      }),
    },
  ),
);
```

- [ ] **Step 4: Run tests — should pass**

```bash
cd architex && pnpm test:run src/stores/__tests__/blueprint-store.test.ts
```
Expected: all 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/blueprint-store.ts src/stores/__tests__/blueprint-store.test.ts
git commit -m "store(blueprint): add zustand store with persist middleware"
```

---

## Task 11: Add "blueprint" to ModuleType union

**Files:**
- Modify: `architex/src/stores/ui-store.ts`

- [ ] **Step 1: Edit ModuleType**

In `architex/src/stores/ui-store.ts`, find the `ModuleType` union and add `"blueprint"`:

```typescript
export type ModuleType =
  | "system-design"
  | "algorithms"
  | "data-structures"
  | "lld"
  | "blueprint"
  | "database"
  | "distributed"
  | "networking"
  | "os"
  | "concurrency"
  | "security"
  | "ml-design"
  | "interview"
  | "knowledge-graph";
```

- [ ] **Step 2: Typecheck to find affected consumers**

```bash
cd architex && pnpm typecheck
```

Any exhaustive `switch(moduleType)` that now errors needs a `case "blueprint"` arm. Typical fix: route Blueprint to `/modules/blueprint` via `Link`; for places that render module content, add a no-op case or route to `/modules/blueprint`.

- [ ] **Step 3: Fix each consumer**

Iterate: run typecheck, fix one, repeat, until green. Expected consumers (from grep for `"lld"` and `ModuleType`):
- `src/app/modules/page.tsx` — MODULES array needs Blueprint entry (do in Task 19)
- Any switch statement with `.exhaustive()` or explicit no-default pattern

For consumers where Blueprint doesn't map meaningfully (e.g. old LLD-specific logic), treat `"blueprint"` like `"lld"` default — or add an explicit `// blueprint handled by its own route tree` comment and return-null.

- [ ] **Step 4: Commit**

```bash
git add src/stores/ui-store.ts <any-other-modified>
git commit -m "types(blueprint): add 'blueprint' to ModuleType union"
```

---

## Task 12: `useBlueprintRoute` hook — URL ↔ store

**Files:**
- Create: `architex/src/hooks/blueprint/useBlueprintRoute.ts`
- Create: `architex/src/hooks/blueprint/__tests__/useBlueprintRoute.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `architex/src/hooks/blueprint/__tests__/useBlueprintRoute.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBlueprintRoute } from "../useBlueprintRoute";
import { useBlueprintStore } from "@/stores/blueprint-store";

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
}));

describe("useBlueprintRoute", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockPathname.mockReset();
    useBlueprintStore.getState().reset();
  });

  it("parses /modules/blueprint as journey home", () => {
    mockPathname.mockReturnValue("/modules/blueprint");
    const { result } = renderHook(() => useBlueprintRoute());
    expect(result.current.surface).toBe("journey");
    expect(result.current.unitSlug).toBeNull();
  });

  it("parses /modules/blueprint/unit/<slug> as journey with unit", () => {
    mockPathname.mockReturnValue("/modules/blueprint/unit/meet-builder");
    const { result } = renderHook(() => useBlueprintRoute());
    expect(result.current.surface).toBe("journey");
    expect(result.current.unitSlug).toBe("meet-builder");
  });

  it("parses /modules/blueprint/toolkit/patterns as toolkit", () => {
    mockPathname.mockReturnValue("/modules/blueprint/toolkit/patterns");
    const { result } = renderHook(() => useBlueprintRoute());
    expect(result.current.surface).toBe("toolkit");
    expect(result.current.tool).toBe("patterns");
  });

  it("parses /modules/blueprint/toolkit/patterns/builder as toolkit with entity", () => {
    mockPathname.mockReturnValue("/modules/blueprint/toolkit/patterns/builder");
    const { result } = renderHook(() => useBlueprintRoute());
    expect(result.current.surface).toBe("toolkit");
    expect(result.current.tool).toBe("patterns");
    expect(result.current.entityId).toBe("builder");
  });

  it("parses /modules/blueprint/progress as progress", () => {
    mockPathname.mockReturnValue("/modules/blueprint/progress");
    const { result } = renderHook(() => useBlueprintRoute());
    expect(result.current.surface).toBe("progress");
  });

  it("navigate pushes the URL and updates store", () => {
    mockPathname.mockReturnValue("/modules/blueprint");
    const { result } = renderHook(() => useBlueprintRoute());
    act(() => {
      result.current.navigate({ surface: "toolkit", tool: "review" });
    });
    expect(mockPush).toHaveBeenCalledWith("/modules/blueprint/toolkit/review");
    expect(useBlueprintStore.getState().currentSurface).toBe("toolkit");
    expect(useBlueprintStore.getState().activeTool).toBe("review");
  });

  it("navigate to unit produces correct URL", () => {
    mockPathname.mockReturnValue("/modules/blueprint");
    const { result } = renderHook(() => useBlueprintRoute());
    act(() => {
      result.current.navigate({
        surface: "journey",
        unitSlug: "meet-builder",
      });
    });
    expect(mockPush).toHaveBeenCalledWith(
      "/modules/blueprint/unit/meet-builder",
    );
  });
});
```

- [ ] **Step 2: Run test — should fail**

- [ ] **Step 3: Write the hook**

Create `architex/src/hooks/blueprint/useBlueprintRoute.ts`:

```typescript
"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useBlueprintStore,
  type BlueprintSurface,
  type BlueprintToolkitTool,
} from "@/stores/blueprint-store";

export interface BlueprintRouteView {
  surface: BlueprintSurface;
  unitSlug: string | null;
  sectionId: string | null;
  tool: BlueprintToolkitTool | null;
  entityId: string | null;
  subMode: string | null;
  pageSegment: string | null; // for /compare, /drill, /complete sub-routes
}

export interface NavigateTarget {
  surface: BlueprintSurface;
  unitSlug?: string | null;
  sectionId?: string | null;
  tool?: BlueprintToolkitTool | null;
  entityId?: string | null;
  subMode?: string | null;
  pageSegment?: string | null;
}

const BASE = "/modules/blueprint";

function parsePath(pathname: string): BlueprintRouteView {
  if (!pathname.startsWith(BASE)) {
    return emptyView();
  }
  const rest = pathname.slice(BASE.length).replace(/^\//, "");
  const segments = rest.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { ...emptyView(), surface: "journey" };
  }

  // /welcome
  if (segments[0] === "welcome") {
    return { ...emptyView(), surface: "journey", pageSegment: "welcome" };
  }

  // /unit/<slug>[/complete]
  if (segments[0] === "unit" && segments[1]) {
    return {
      surface: "journey",
      unitSlug: segments[1],
      sectionId: null,
      tool: null,
      entityId: null,
      subMode: null,
      pageSegment: segments[2] ?? null, // "complete" or null
    };
  }

  // /toolkit[/<tool>[/<entity>[/<page>]]]
  if (segments[0] === "toolkit") {
    const tool = (segments[1] ?? null) as BlueprintToolkitTool | null;
    const validTools: BlueprintToolkitTool[] = [
      "patterns",
      "problems",
      "review",
    ];
    const t = validTools.includes(tool as BlueprintToolkitTool) ? tool : null;
    return {
      surface: "toolkit",
      unitSlug: null,
      sectionId: null,
      tool: t,
      entityId: segments[2] ?? null,
      subMode: null,
      pageSegment: segments[3] ?? null, // "compare", "drill"
    };
  }

  // /progress[/<subpage>]
  if (segments[0] === "progress") {
    return {
      ...emptyView(),
      surface: "progress",
      pageSegment: segments[1] ?? null,
    };
  }

  return emptyView();
}

function buildPath(t: NavigateTarget): string {
  if (t.surface === "journey") {
    if (t.unitSlug) {
      const path = `${BASE}/unit/${t.unitSlug}`;
      if (t.pageSegment === "complete") return `${path}/complete`;
      return t.sectionId ? `${path}#section-${t.sectionId}` : path;
    }
    if (t.pageSegment === "welcome") return `${BASE}/welcome`;
    return BASE;
  }

  if (t.surface === "toolkit") {
    let path = `${BASE}/toolkit`;
    if (t.tool) path += `/${t.tool}`;
    if (t.entityId) path += `/${t.entityId}`;
    if (t.pageSegment) path += `/${t.pageSegment}`;
    return path;
  }

  if (t.surface === "progress") {
    return t.pageSegment ? `${BASE}/progress/${t.pageSegment}` : `${BASE}/progress`;
  }

  return BASE;
}

function emptyView(): BlueprintRouteView {
  return {
    surface: "journey",
    unitSlug: null,
    sectionId: null,
    tool: null,
    entityId: null,
    subMode: null,
    pageSegment: null,
  };
}

export function useBlueprintRoute(): BlueprintRouteView & {
  navigate: (target: NavigateTarget) => void;
} {
  const pathname = usePathname() ?? BASE;
  const router = useRouter();
  const searchParams = useSearchParams();

  const view = useMemo(() => parsePath(pathname), [pathname]);

  const setSurface = useBlueprintStore((s) => s.setSurface);
  const setCurrentUnit = useBlueprintStore((s) => s.setCurrentUnit);
  const openTool = useBlueprintStore((s) => s.openTool);
  const closeTool = useBlueprintStore((s) => s.closeTool);

  // Sync URL → store on pathname change.
  useEffect(() => {
    setSurface(view.surface);
    if (view.surface === "journey") {
      setCurrentUnit(view.unitSlug, view.sectionId);
      closeTool();
    } else if (view.surface === "toolkit") {
      if (view.tool) {
        openTool(view.tool, view.entityId ?? undefined);
      } else {
        closeTool();
      }
    } else {
      closeTool();
    }
  }, [
    view.surface,
    view.unitSlug,
    view.sectionId,
    view.tool,
    view.entityId,
    setSurface,
    setCurrentUnit,
    openTool,
    closeTool,
  ]);

  const navigate = useCallback(
    (target: NavigateTarget) => {
      const url = buildPath(target);
      router.push(url);
      // Also update store immediately so the UI doesn't flicker.
      if (target.surface) setSurface(target.surface);
      if (target.surface === "journey") {
        setCurrentUnit(target.unitSlug ?? null, target.sectionId ?? null);
      }
      if (target.surface === "toolkit") {
        if (target.tool) {
          openTool(target.tool, target.entityId ?? undefined, target.subMode ?? undefined);
        } else {
          closeTool();
        }
      }
    },
    [router, setSurface, setCurrentUnit, openTool, closeTool],
  );

  return { ...view, navigate };
}
```

- [ ] **Step 4: Run test — should pass**

- [ ] **Step 5: Commit**

```bash
git add src/hooks/blueprint/useBlueprintRoute.ts src/hooks/blueprint/__tests__/useBlueprintRoute.test.tsx
git commit -m "hook(blueprint): useBlueprintRoute — URL↔store sync"
```

---

## Task 13: `useJourneyStateSync` hook — server sync

**Files:**
- Create: `architex/src/hooks/blueprint/useJourneyStateSync.ts`
- Create: `architex/src/hooks/blueprint/__tests__/useJourneyStateSync.test.tsx`

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useJourneyStateSync } from "../useJourneyStateSync";
import { useBlueprintStore } from "@/stores/blueprint-store";

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

describe("useJourneyStateSync", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    useBlueprintStore.getState().reset();
  });

  it("hydrates from server on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        preferredLang: "py",
        welcomeDismissedAt: "2026-04-20T00:00:00Z",
        pinnedTool: "problems",
      }),
    });
    renderHook(() => useJourneyStateSync());
    await waitFor(() => {
      const s = useBlueprintStore.getState();
      expect(s.preferredLang).toBe("py");
      expect(s.welcomeDismissed).toBe(true);
      expect(s.pinnedTool).toBe("problems");
    });
  });

  it("patches server on local change (debounced)", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    renderHook(() => useJourneyStateSync());
    await act(async () => {
      useBlueprintStore.getState().setPreferredLang("py");
    });
    // Before debounce
    expect(
      mockFetch.mock.calls.filter((c) => c[1]?.method === "PATCH").length,
    ).toBe(0);
    await act(async () => {
      vi.advanceTimersByTime(1100);
    });
    // After debounce
    expect(
      mockFetch.mock.calls.filter((c) => c[1]?.method === "PATCH").length,
    ).toBe(1);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Fail, write impl, pass**

Create `architex/src/hooks/blueprint/useJourneyStateSync.ts`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { useBlueprintStore } from "@/stores/blueprint-store";

const ENDPOINT = "/api/blueprint/journey-state";
const DEBOUNCE_MS = 1000;

export function useJourneyStateSync(): void {
  const hydratedRef = useRef(false);
  const lastPatchedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      try {
        const res = await fetch(ENDPOINT, { method: "GET" });
        if (!res.ok) return;
        const data = await res.json();
        useBlueprintStore.getState().hydrate({
          preferredLang: data.preferredLang ?? undefined,
          welcomeDismissed: Boolean(data.welcomeDismissedAt),
          pinnedTool: data.pinnedTool ?? null,
          dailyReviewTarget: data.dailyReviewTarget ?? undefined,
        });
      } catch {
        // silent — hydration failure falls back to defaults
      }
    })();
  }, []);

  // Debounced PATCH on mutation of persisted fields
  useEffect(() => {
    const unsubscribe = useBlueprintStore.subscribe((state) => {
      const snapshot = JSON.stringify({
        preferredLang: state.preferredLang,
        welcomeDismissed: state.welcomeDismissed,
        pinnedTool: state.pinnedTool,
        dailyReviewTarget: state.dailyReviewTarget,
        currentUnitSlug: state.currentUnitSlug,
        currentSectionId: state.currentSectionId,
      });
      if (snapshot === lastPatchedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        lastPatchedRef.current = snapshot;
        const parsed = JSON.parse(snapshot);
        try {
          await fetch(ENDPOINT, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              preferredLang: parsed.preferredLang,
              welcomeDismissedAt: parsed.welcomeDismissed
                ? new Date().toISOString()
                : null,
              pinnedTool: parsed.pinnedTool,
              dailyReviewTarget: parsed.dailyReviewTarget,
              currentUnitSlug: parsed.currentUnitSlug,
              currentSectionId: parsed.currentSectionId,
            }),
          });
        } catch {
          // queued for next subscription tick
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
```

- [ ] **Step 3: Run tests + commit**

```bash
git add src/hooks/blueprint/useJourneyStateSync.ts src/hooks/blueprint/__tests__/useJourneyStateSync.test.tsx
git commit -m "hook(blueprint): useJourneyStateSync — debounced PATCH + hydrate"
```

---

## Task 14: `useUnitProgressSync` hook

**Files:**
- Create: `architex/src/hooks/blueprint/useUnitProgressSync.ts`

- [ ] **Step 1: Write the implementation**

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import { useBlueprintStore, type UnitProgressCache } from "@/stores/blueprint-store";

const DEBOUNCE_MS = 1000;

/**
 * Syncs per-unit progress cache to /api/blueprint/units/<slug>/progress.
 * Called by Unit Renderer (SP3); no-op if unitSlug is null.
 */
export function useUnitProgressSync(unitSlug: string | null): {
  patchProgress: (patch: Partial<UnitProgressCache>) => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<UnitProgressCache>>({});

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const patchProgress = useCallback(
    (patch: Partial<UnitProgressCache>) => {
      if (!unitSlug) return;

      // Merge into pending + update local cache immediately (optimistic)
      pendingRef.current = { ...pendingRef.current, ...patch };
      const store = useBlueprintStore.getState();
      const existing = store.unitProgress[unitSlug];
      store.updateUnitProgress(unitSlug, {
        ...(existing ?? {
          unitSlug,
          state: "available",
          sectionStates: {},
          lastSeenAt: Date.now(),
        }),
        ...pendingRef.current,
        unitSlug,
        lastSeenAt: Date.now(),
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const body = pendingRef.current;
        pendingRef.current = {};
        try {
          await fetch(`/api/blueprint/units/${unitSlug}/progress`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          // retry on next tick — we kept the optimistic cache
        }
      }, DEBOUNCE_MS);
    },
    [unitSlug],
  );

  return { patchProgress };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/blueprint/useUnitProgressSync.ts
git commit -m "hook(blueprint): useUnitProgressSync — per-unit optimistic PATCH"
```

---

## Task 15: `useBlueprintAnalytics` hook

**Files:**
- Create: `architex/src/hooks/blueprint/useBlueprintAnalytics.ts`

- [ ] **Step 1: Write the implementation**

```typescript
"use client";

import { useCallback, useEffect, useRef } from "react";
import type { BlueprintEvent } from "@/lib/analytics/blueprint-events";

interface PostHogLike {
  capture: (name: string, payload?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    posthog?: PostHogLike;
  }
}

const FLUSH_MS = 500;
const MAX_QUEUE = 64;

/**
 * Batches Blueprint events; flushes every 500ms or at MAX_QUEUE.
 * Also POSTs to /api/blueprint/events as a reliable audit log
 * (server-side aggregation + debugging).
 */
export function useBlueprintAnalytics(): {
  track: <T>(event: BlueprintEvent<T>) => void;
} {
  const queueRef = useRef<BlueprintEvent<unknown>[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;
    const batch = queueRef.current.splice(0, queueRef.current.length);

    // PostHog client-side fire
    if (typeof window !== "undefined" && window.posthog) {
      for (const e of batch) {
        window.posthog.capture(e.name, e.payload as Record<string, unknown>);
      }
    } else if (process.env.NODE_ENV === "development") {
      for (const e of batch) {
        // eslint-disable-next-line no-console
        console.log("[blueprint-event]", e.name, e.payload);
      }
    }

    // Server log
    try {
      await fetch("/api/blueprint/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ events: batch }),
        keepalive: true,
      });
    } catch {
      // swallow; events are best-effort
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush]);

  const track = useCallback(
    <T,>(event: BlueprintEvent<T>) => {
      queueRef.current.push(event as BlueprintEvent<unknown>);
      if (queueRef.current.length >= MAX_QUEUE) {
        flush();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, FLUSH_MS);
    },
    [flush],
  );

  return { track };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/blueprint/useBlueprintAnalytics.ts
git commit -m "hook(blueprint): useBlueprintAnalytics — batched tracking"
```

---

## Task 16: Blueprint shell components

**Files:**
- Create: `architex/src/components/modules/blueprint/BlueprintShell.tsx`
- Create: `architex/src/components/modules/blueprint/BlueprintComingSoon.tsx`
- Create: `architex/src/components/modules/blueprint/shell/TopChrome.tsx`
- Create: `architex/src/components/modules/blueprint/shell/Breadcrumb.tsx`
- Create: `architex/src/components/modules/blueprint/shell/StatusBar.tsx`
- Create: `architex/src/components/modules/blueprint/shell/SurfaceTabs.tsx`
- Create: `architex/src/components/modules/blueprint/shell/SearchInput.tsx`

- [ ] **Step 1: Create `BlueprintComingSoon.tsx`**

```tsx
"use client";

import { cn } from "@/lib/utils";

export function BlueprintComingSoon({
  subprojectId,
  hint,
}: {
  subprojectId: string;
  hint?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-12 text-center",
      )}
    >
      <div className="rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
        {subprojectId}
      </div>
      <h2 className="font-[var(--font-serif,_Fraunces)] text-2xl italic text-foreground">
        Coming soon.
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-foreground-muted">
        {hint ??
          "This surface is scheduled for a later sub-project. The scaffolding is in place; the content is next."}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create `SurfaceTabs.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Compass, Wrench, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";

interface Tab {
  id: "journey" | "toolkit" | "progress";
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: Tab[] = [
  { id: "journey", label: "Journey", href: "/modules/blueprint", icon: Compass },
  { id: "toolkit", label: "Toolkit", href: "/modules/blueprint/toolkit", icon: Wrench },
  { id: "progress", label: "Progress", href: "/modules/blueprint/progress", icon: LineChart },
];

export function SurfaceTabs() {
  const { surface } = useBlueprintRoute();
  return (
    <nav className="flex items-center gap-1" aria-label="Blueprint surfaces">
      {TABS.map((t) => {
        const active = t.id === surface;
        const Icon = t.icon;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-indigo-500/15 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300"
                : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-3.5 w-3.5" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Create `Breadcrumb.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";

function humanize(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function Breadcrumb() {
  const view = useBlueprintRoute();

  const crumbs: Array<{ label: string; href?: string }> = [
    { label: "Blueprint", href: "/modules/blueprint" },
  ];

  if (view.surface === "journey" && view.unitSlug) {
    crumbs.push({
      label: `Unit · ${humanize(view.unitSlug)}`,
      href: `/modules/blueprint/unit/${view.unitSlug}`,
    });
    if (view.pageSegment === "complete") {
      crumbs.push({ label: "Complete" });
    }
  } else if (view.surface === "toolkit") {
    crumbs.push({ label: "Toolkit", href: "/modules/blueprint/toolkit" });
    if (view.tool) {
      crumbs.push({
        label: humanize(view.tool),
        href: `/modules/blueprint/toolkit/${view.tool}`,
      });
      if (view.entityId) {
        crumbs.push({ label: humanize(view.entityId) });
      }
    }
  } else if (view.surface === "progress") {
    crumbs.push({ label: "Progress", href: "/modules/blueprint/progress" });
    if (view.pageSegment) crumbs.push({ label: humanize(view.pageSegment) });
  }

  return (
    <nav className="flex items-center gap-1 text-xs text-foreground-muted" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
          {c.href ? (
            <Link
              href={c.href}
              className="hover:text-foreground hover:underline underline-offset-2"
            >
              {c.label}
            </Link>
          ) : (
            <span className="text-foreground">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Create `StatusBar.tsx`**

```tsx
"use client";

import { useBlueprintStore } from "@/stores/blueprint-store";

export function StatusBar() {
  const streakDays = useBlueprintStore((s) => {
    // placeholder — real streak comes from server, store hydrates it in later SP
    return 0;
  });
  const preferredLang = useBlueprintStore((s) => s.preferredLang);

  return (
    <div className="flex h-7 items-center justify-end gap-3 border-t border-border/30 bg-background/60 px-3 text-[10px] text-foreground-muted">
      <span>Lang: {preferredLang.toUpperCase()}</span>
      <span>·</span>
      <span>Streak: {streakDays}d</span>
    </div>
  );
}
```

- [ ] **Step 5: Create `SearchInput.tsx` (stub)**

```tsx
"use client";

import { Search } from "lucide-react";

export function SearchInput() {
  return (
    <div className="relative w-64">
      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-subtle" />
      <input
        type="search"
        placeholder="Search (coming in SP10)"
        aria-label="Search Blueprint"
        disabled
        className="w-full rounded-full border border-border/30 bg-background py-1.5 pl-8 pr-3 text-xs text-foreground-muted placeholder:text-foreground-subtle disabled:cursor-not-allowed"
      />
    </div>
  );
}
```

- [ ] **Step 6: Create `TopChrome.tsx`**

```tsx
"use client";

import Link from "next/link";
import { SurfaceTabs } from "./SurfaceTabs";
import { SearchInput } from "./SearchInput";

export function TopChrome() {
  return (
    <header className="flex h-12 shrink-0 items-center gap-4 border-b border-border/30 bg-background/60 px-4 backdrop-blur-sm">
      <Link href="/modules/blueprint" className="flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-sky-400 text-[10px] font-bold text-white"
        >
          B
        </span>
        <span className="text-sm font-semibold text-foreground">Blueprint</span>
      </Link>
      <SurfaceTabs />
      <div className="ml-auto flex items-center gap-3">
        <SearchInput />
      </div>
    </header>
  );
}
```

- [ ] **Step 7: Create `BlueprintShell.tsx`**

```tsx
"use client";

import { memo, type ReactNode } from "react";
import { TopChrome } from "./shell/TopChrome";
import { Breadcrumb } from "./shell/Breadcrumb";
import { StatusBar } from "./shell/StatusBar";
import { useJourneyStateSync } from "@/hooks/blueprint/useJourneyStateSync";
import { useBlueprintAnalytics } from "@/hooks/blueprint/useBlueprintAnalytics";
import { blueprintModuleOpened } from "@/lib/analytics/blueprint-events";
import { useEffect, useRef } from "react";
import { useBlueprintRoute } from "@/hooks/blueprint/useBlueprintRoute";

export const BlueprintShell = memo(function BlueprintShell({
  children,
}: {
  children: ReactNode;
}) {
  useJourneyStateSync();
  const { track } = useBlueprintAnalytics();
  const { surface } = useBlueprintRoute();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    track(blueprintModuleOpened({ entrySurface: surface }));
  }, [surface, track]);

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TopChrome />
      <div className="flex h-10 shrink-0 items-center border-b border-border/20 bg-background/40 px-4">
        <Breadcrumb />
      </div>
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      <StatusBar />
    </div>
  );
});
```

- [ ] **Step 8: Typecheck + commit**

```bash
cd architex && pnpm typecheck
git add src/components/modules/blueprint/
git commit -m "component(blueprint): shell + sub-components + ComingSoon placeholder"
```

---

## Task 17: Route tree — layouts + placeholder pages

**Files:**
- Create: all `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` under `architex/src/app/modules/blueprint/`

- [ ] **Step 1: Root layout**

Create `architex/src/app/modules/blueprint/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { BlueprintShell } from "@/components/modules/blueprint/BlueprintShell";

export const metadata: Metadata = {
  title: "Blueprint · Architex",
  description: "Design patterns, one unit at a time.",
  openGraph: {
    title: "Blueprint · Architex",
    description: "Design patterns, one unit at a time.",
  },
};

export default function BlueprintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlueprintShell>{children}</BlueprintShell>;
}
```

- [ ] **Step 2: Loading skeleton**

Create `architex/src/app/modules/blueprint/loading.tsx`:

```tsx
export default function BlueprintLoading() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-500" />
        Loading Blueprint...
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Error boundary**

Create `architex/src/app/modules/blueprint/error.tsx`:

```tsx
"use client";

import { useEffect } from "react";

export default function BlueprintError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[blueprint error]", error);
  }, [error]);
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center gap-4 p-12 text-center">
      <h2 className="text-xl font-semibold text-red-500">Something went wrong.</h2>
      <p className="max-w-md text-sm text-foreground-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
      >
        Try again
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Journey home page (placeholder)**

Create `architex/src/app/modules/blueprint/page.tsx`:

```tsx
import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default function BlueprintHomePage() {
  return (
    <BlueprintComingSoon
      subprojectId="SP2"
      hint="The journey home — curriculum map, resume card, streak — is scheduled for sub-project 2."
    />
  );
}
```

- [ ] **Step 5: Welcome page**

Create `architex/src/app/modules/blueprint/welcome/page.tsx`:

```tsx
import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default function BlueprintWelcomePage() {
  return (
    <BlueprintComingSoon
      subprojectId="SP2"
      hint="The welcome screen ships with the journey home."
    />
  );
}
```

- [ ] **Step 6: Unit detail pages**

Create `architex/src/app/modules/blueprint/unit/[unitSlug]/page.tsx`:

```tsx
import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default async function BlueprintUnitPage({
  params,
}: {
  params: Promise<{ unitSlug: string }>;
}) {
  const { unitSlug } = await params;
  return (
    <BlueprintComingSoon
      subprojectId="SP3"
      hint={`The unit renderer for "${unitSlug}" ships in sub-project 3.`}
    />
  );
}
```

Create `architex/src/app/modules/blueprint/unit/[unitSlug]/complete/page.tsx`:

```tsx
import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default function BlueprintUnitCompletePage() {
  return <BlueprintComingSoon subprojectId="SP3" hint="Unit completion screen ships with the unit renderer." />;
}
```

- [ ] **Step 7: Toolkit layout + pages**

Create `architex/src/app/modules/blueprint/toolkit/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function ToolkitLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
```

Create `architex/src/app/modules/blueprint/toolkit/page.tsx`:

```tsx
import { BlueprintComingSoon } from "@/components/modules/blueprint/BlueprintComingSoon";

export default function ToolkitHomePage() {
  return (
    <BlueprintComingSoon
      subprojectId="SP4–6"
      hint="The toolkit — Patterns Library, Problems Workspace, Review Inbox — ships in sub-projects 4 through 6."
    />
  );
}
```

Create placeholder pages for all toolkit routes:
- `toolkit/patterns/page.tsx` — `subprojectId="SP4"`
- `toolkit/patterns/[patternSlug]/page.tsx` — `subprojectId="SP4"`, reads `params.patternSlug`
- `toolkit/patterns/[patternSlug]/compare/page.tsx` — `subprojectId="SP4"`
- `toolkit/problems/page.tsx` — `subprojectId="SP5"`
- `toolkit/problems/[problemSlug]/page.tsx` — `subprojectId="SP5"`
- `toolkit/problems/[problemSlug]/drill/page.tsx` — `subprojectId="SP5"`
- `toolkit/review/page.tsx` — `subprojectId="SP6"`

Each is a minimal 3–5 line component rendering `<BlueprintComingSoon subprojectId="..." hint="..." />`.

- [ ] **Step 8: Progress layout + pages**

Create `architex/src/app/modules/blueprint/progress/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function ProgressLayout({ children }: { children: ReactNode }) {
  return <div className="h-full">{children}</div>;
}
```

Create progress pages all pointing to SP2 (progress dashboard ships with journey home):
- `progress/page.tsx`
- `progress/patterns/page.tsx`
- `progress/problems/page.tsx`
- `progress/streak/page.tsx`

- [ ] **Step 9: Typecheck + build**

```bash
cd architex && pnpm typecheck
pnpm build
```

Fix any TS errors. The build pass ensures App Router conventions are correct.

- [ ] **Step 10: Commit**

```bash
git add src/app/modules/blueprint/
git commit -m "route(blueprint): shell layout + placeholder pages for all surfaces"
```

---

## Task 18: API routes

**Files:**
- Create: `architex/src/app/api/blueprint/journey-state/route.ts`
- Create: `architex/src/app/api/blueprint/units/route.ts`
- Create: `architex/src/app/api/blueprint/units/[slug]/route.ts`
- Create: `architex/src/app/api/blueprint/units/[slug]/progress/route.ts`
- Create: `architex/src/app/api/blueprint/events/route.ts`
- Create: `architex/src/app/api/blueprint/progress/summary/route.ts`

- [ ] **Step 1: `journey-state` route**

Create `architex/src/app/api/blueprint/journey-state/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blueprintJourneyState } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getOrCreateUserFromRequest(req);
  if (!user) return NextResponse.json({}, { status: 401 });

  const rows = await db
    .select()
    .from(blueprintJourneyState)
    .where(eq(blueprintJourneyState.userId, user.id))
    .limit(1);

  if (rows.length === 0) {
    // Lazy-create
    await db
      .insert(blueprintJourneyState)
      .values({ userId: user.id })
      .onConflictDoNothing();
    return NextResponse.json({
      preferredLang: "ts",
      dailyReviewTarget: 10,
      streakDays: 0,
      pinnedTool: null,
      welcomeDismissedAt: null,
      currentUnitSlug: null,
      currentSectionId: null,
    });
  }

  return NextResponse.json(rows[0]);
}

export async function PATCH(req: Request) {
  const user = await getOrCreateUserFromRequest(req);
  if (!user) return NextResponse.json({}, { status: 401 });

  const body = await req.json();
  const allowed = {
    preferredLang: body.preferredLang,
    dailyReviewTarget: body.dailyReviewTarget,
    pinnedTool: body.pinnedTool,
    welcomeDismissedAt: body.welcomeDismissedAt
      ? new Date(body.welcomeDismissedAt)
      : null,
    currentUnitSlug: body.currentUnitSlug,
    currentSectionId: body.currentSectionId,
  };

  // Remove undefined keys
  const clean = Object.fromEntries(
    Object.entries(allowed).filter(([_, v]) => v !== undefined),
  );

  await db
    .insert(blueprintJourneyState)
    .values({ userId: user.id, ...clean })
    .onConflictDoUpdate({
      target: blueprintJourneyState.userId,
      set: clean,
    });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: `units` list route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blueprintUnits, blueprintCourses } from "@/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";

export async function GET() {
  // For V1, a single course.
  const course = await db
    .select()
    .from(blueprintCourses)
    .where(eq(blueprintCourses.slug, "blueprint-core"))
    .limit(1);
  if (course.length === 0) {
    return NextResponse.json({ units: [] });
  }

  const rows = await db
    .select({
      id: blueprintUnits.id,
      slug: blueprintUnits.slug,
      ordinal: blueprintUnits.ordinal,
      title: blueprintUnits.title,
      summary: blueprintUnits.summary,
      durationMinutes: blueprintUnits.durationMinutes,
      difficulty: blueprintUnits.difficulty,
      prereqUnitSlugs: blueprintUnits.prereqUnitSlugs,
      tags: blueprintUnits.tags,
      entityRefs: blueprintUnits.entityRefs,
    })
    .from(blueprintUnits)
    .where(
      and(
        eq(blueprintUnits.courseId, course[0].id),
        isNotNull(blueprintUnits.publishedAt),
      ),
    )
    .orderBy(blueprintUnits.ordinal);

  return NextResponse.json({ units: rows });
}
```

- [ ] **Step 3: `units/[slug]` detail route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blueprintUnits, blueprintCourses } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const course = await db
    .select()
    .from(blueprintCourses)
    .where(eq(blueprintCourses.slug, "blueprint-core"))
    .limit(1);
  if (course.length === 0) {
    return NextResponse.json({ error: "course not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(blueprintUnits)
    .where(
      and(
        eq(blueprintUnits.courseId, course[0].id),
        eq(blueprintUnits.slug, slug),
      ),
    )
    .limit(1);
  if (rows.length === 0) {
    return NextResponse.json({ error: "unit not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}
```

- [ ] **Step 4: `units/[slug]/progress` route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
  blueprintUnits,
  blueprintUserProgress,
  blueprintCourses,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getOrCreateUserFromRequest } from "@/lib/auth";

async function findUnitId(slug: string): Promise<string | null> {
  const course = await db
    .select()
    .from(blueprintCourses)
    .where(eq(blueprintCourses.slug, "blueprint-core"))
    .limit(1);
  if (course.length === 0) return null;
  const rows = await db
    .select({ id: blueprintUnits.id })
    .from(blueprintUnits)
    .where(
      and(
        eq(blueprintUnits.courseId, course[0].id),
        eq(blueprintUnits.slug, slug),
      ),
    )
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getOrCreateUserFromRequest(req);
  if (!user) return NextResponse.json({}, { status: 401 });
  const { slug } = await params;
  const unitId = await findUnitId(slug);
  if (!unitId) return NextResponse.json({ error: "unit not found" }, { status: 404 });

  const rows = await db
    .select()
    .from(blueprintUserProgress)
    .where(
      and(
        eq(blueprintUserProgress.userId, user.id),
        eq(blueprintUserProgress.unitId, unitId),
      ),
    )
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({
      unitSlug: slug,
      state: "available",
      sectionStates: {},
      totalTimeMs: 0,
      lastPosition: null,
    });
  }

  return NextResponse.json({ ...rows[0], unitSlug: slug });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getOrCreateUserFromRequest(req);
  if (!user) return NextResponse.json({}, { status: 401 });
  const { slug } = await params;
  const unitId = await findUnitId(slug);
  if (!unitId) return NextResponse.json({ error: "unit not found" }, { status: 404 });

  const body = await req.json();
  const allowed = {
    state: body.state,
    sectionStates: body.sectionStates,
    lastPosition: body.lastPosition,
    totalTimeMs: body.totalTimeMs,
    completedAt: body.completedAt ? new Date(body.completedAt) : undefined,
    masteredAt: body.masteredAt ? new Date(body.masteredAt) : undefined,
  };
  const clean = Object.fromEntries(
    Object.entries(allowed).filter(([_, v]) => v !== undefined),
  );

  await db
    .insert(blueprintUserProgress)
    .values({ userId: user.id, unitId, ...clean })
    .onConflictDoUpdate({
      target: [blueprintUserProgress.userId, blueprintUserProgress.unitId],
      set: clean,
    });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: `events` batch-POST route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blueprintEvents } from "@/db/schema";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  const userId = await getUserIdFromRequest(req); // returns null if anonymous — that's fine
  const body = await req.json();
  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0) return NextResponse.json({ ok: true });

  // Cap at 100 events per request.
  const capped = events.slice(0, 100);

  await db.insert(blueprintEvents).values(
    capped.map((e: { name: string; payload?: Record<string, unknown> }) => ({
      userId,
      eventName: e.name,
      eventPayload: e.payload ?? {},
    })),
  );

  return NextResponse.json({ ok: true, count: capped.length });
}
```

- [ ] **Step 6: `progress/summary` route**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/db";
import { blueprintUserProgress, blueprintJourneyState } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getOrCreateUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getOrCreateUserFromRequest(req);
  if (!user) return NextResponse.json({}, { status: 401 });

  const [stateRow] = await db
    .select()
    .from(blueprintJourneyState)
    .where(eq(blueprintJourneyState.userId, user.id))
    .limit(1);

  const [counts] = await db
    .select({
      completed: sql<number>`count(*) filter (where ${blueprintUserProgress.state} in ('completed','mastered'))::int`,
      mastered: sql<number>`count(*) filter (where ${blueprintUserProgress.state} = 'mastered')::int`,
      inProgress: sql<number>`count(*) filter (where ${blueprintUserProgress.state} = 'in_progress')::int`,
      totalTimeMs: sql<number>`coalesce(sum(${blueprintUserProgress.totalTimeMs}), 0)::bigint::int`,
    })
    .from(blueprintUserProgress)
    .where(eq(blueprintUserProgress.userId, user.id));

  return NextResponse.json({
    streakDays: stateRow?.streakDays ?? 0,
    currentUnitSlug: stateRow?.currentUnitSlug ?? null,
    unitsCompleted: counts?.completed ?? 0,
    unitsMastered: counts?.mastered ?? 0,
    unitsInProgress: counts?.inProgress ?? 0,
    totalTimeMs: counts?.totalTimeMs ?? 0,
  });
}
```

- [ ] **Step 7: Typecheck + commit**

```bash
cd architex && pnpm typecheck
git add src/app/api/blueprint/
git commit -m "api(blueprint): journey-state + units + progress + events + summary"
```

---

## Task 19: Integrate into modules page + left-rail nav

**Files:**
- Modify: `architex/src/app/modules/page.tsx`
- Modify: `architex/src/components/shared/workspace-layout.tsx` (or wherever nav is)

- [ ] **Step 1: Add Blueprint to `/modules` index**

In `architex/src/app/modules/page.tsx`, find the `MODULES` array and add:

```typescript
{
  id: "blueprint",
  label: "Blueprint",
  description: "A structured course in object-oriented design. 12 units, hand-authored.",
  icon: Compass,  // import from lucide-react
  color: "text-indigo-400",
  bgGradient: "from-indigo-500/10 to-sky-500/5",
  category: "Learning",
},
```

Add `Compass` to the `lucide-react` import line.

Important: update the href/link logic so Blueprint's click goes to `/modules/blueprint` (direct link), not the `/?module=blueprint` pattern other modules use. Check how the grid renders cards — if it uses `<Link>`, ensure Blueprint's entry includes an `href` field, or special-case Blueprint.

- [ ] **Step 2: Add to left rail**

Find where the icon-rail nav is rendered (`src/components/shared/workspace-layout.tsx` is a strong candidate, or search for the existing LLD icon). Add a new entry:

```tsx
{
  id: "blueprint",
  label: "Blueprint",
  href: "/modules/blueprint",
  icon: Compass,
},
```

If the rail uses `ModuleType` directly as the id, the `"blueprint"` value is already in the union (Task 11). Otherwise, map Blueprint's href explicitly.

- [ ] **Step 3: Typecheck + run dev server + click-test**

```bash
cd architex && pnpm typecheck
pnpm dev &
# In browser: visit /, confirm Blueprint icon in left rail
# Click Blueprint → routes to /modules/blueprint
# Confirm shell renders
```

- [ ] **Step 4: Commit**

```bash
git add src/app/modules/page.tsx src/components/shared/workspace-layout.tsx
git commit -m "nav(blueprint): add to modules index + left rail"
```

---

## Task 20: Developer README

**Files:**
- Create: `docs/superpowers/blueprint/README.md`

- [ ] **Step 1: Write the README**

```markdown
# Blueprint Module · Developer Guide

## What is this?

Blueprint is Architex's structured curriculum for object-oriented design. It sits beside `/modules/lld` — both modules coexist, share data layers, but have their own shells.

## Running locally

```bash
cd architex
pnpm install
pnpm db:migrate          # applies latest migrations including blueprint tables
pnpm blueprint:seed-units  # seeds 12 placeholder units
pnpm dev
# visit http://localhost:3000/modules/blueprint
```

## Architecture overview

- Route tree: `src/app/modules/blueprint/*`
- Shell: `src/components/modules/blueprint/BlueprintShell.tsx`
- Store: `src/stores/blueprint-store.ts`
- Hooks: `src/hooks/blueprint/*`
- API: `src/app/api/blueprint/*`
- Schema: `src/db/schema/blueprint-*.ts`
- Analytics: `src/lib/analytics/blueprint-events.ts`

## Adding a new API route

1. Create `src/app/api/blueprint/<path>/route.ts`
2. Import `db` from `@/db` and relevant schema tables
3. Auth via `getOrCreateUserFromRequest(req)` (user data) or `getUserIdFromRequest(req)` (optional auth)
4. Return `NextResponse.json(...)`
5. Add integration test in `src/app/api/blueprint/__tests__/<name>.test.ts`

## Adding an analytics event

1. Add the typed builder to `src/lib/analytics/blueprint-events.ts` (follow existing pattern)
2. Bump the taxonomy comment count if applicable
3. Update the test `src/lib/analytics/__tests__/blueprint-events.test.ts`
4. Use it via `useBlueprintAnalytics()`:
   ```typescript
   const { track } = useBlueprintAnalytics();
   track(blueprintUnitOpened({ unitSlug: "meet-builder", entry: "map" }));
   ```

## Running tests

```bash
pnpm test:run src/stores/__tests__/blueprint-store.test.ts
pnpm test:run src/hooks/blueprint
pnpm test:run src/app/api/blueprint
pnpm test:e2e e2e/blueprint-smoke.spec.ts
```

## Current sub-project status

See `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md` §11 for the 10 sub-projects. Status tracked in each SP's plan `.md` file.

## Invariants

From SP1 spec §4:
- I1: URL is single source of truth for surface. Tests enforce.
- I2: Writes flow UI → store → server. Never skip store. Never read mid-interaction.
- I3: Every route renders through `BlueprintShell`.
- I4: Analytics events are typed via builders only.
- I5: `currentSurface` is never simultaneously two values.
- I6: No imports from old LLD's `useLLDModule` / `useLLDModuleImpl`.
- I7: Server reads are paginated/bounded.
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/blueprint/
git commit -m "docs(blueprint): developer README for contributors"
```

---

## Task 21: Content directory scaffold

**Files:**
- Create: `architex/content/blueprint/units/.gitkeep`
- Create: `architex/content/blueprint/shared/concepts/.gitkeep`
- Create: `architex/content/blueprint/shared/problems/.gitkeep`

- [ ] **Step 1: Create dirs + gitkeep**

```bash
mkdir -p architex/content/blueprint/units
mkdir -p architex/content/blueprint/shared/concepts
mkdir -p architex/content/blueprint/shared/problems
touch architex/content/blueprint/units/.gitkeep
touch architex/content/blueprint/shared/concepts/.gitkeep
touch architex/content/blueprint/shared/problems/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add architex/content/blueprint/
git commit -m "content(blueprint): scaffold content directory"
```

---

## Task 22: E2E smoke test

**Files:**
- Create: `architex/e2e/blueprint-smoke.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
import { test, expect } from "@playwright/test";

test.describe("Blueprint smoke", () => {
  test("home renders with shell", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await expect(page.getByRole("link", { name: /Blueprint/ }).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: /Blueprint surfaces/ })).toBeVisible();
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("surface tabs route correctly", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await page.getByRole("link", { name: "Toolkit" }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint\/toolkit$/);
    await page.getByRole("link", { name: "Progress" }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint\/progress$/);
    await page.getByRole("link", { name: "Journey" }).click();
    await expect(page).toHaveURL(/\/modules\/blueprint$/);
  });

  test("unit URL resolves with breadcrumb", async ({ page }) => {
    await page.goto("/modules/blueprint/unit/meet-builder");
    await expect(page.getByText(/Unit · Meet Builder/)).toBeVisible();
    await expect(page.getByText(/SP3/)).toBeVisible();
  });

  test("toolkit pattern URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/toolkit/patterns/builder");
    await expect(page.getByText(/SP4/)).toBeVisible();
  });

  test("progress URL resolves", async ({ page }) => {
    await page.goto("/modules/blueprint/progress");
    await expect(page.getByText(/SP2/)).toBeVisible();
  });

  test("browser back returns through surfaces", async ({ page }) => {
    await page.goto("/modules/blueprint");
    await page.getByRole("link", { name: "Toolkit" }).click();
    await page.getByRole("link", { name: "Progress" }).click();
    await page.goBack();
    await expect(page).toHaveURL(/\/modules\/blueprint\/toolkit$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/modules\/blueprint$/);
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd architex && pnpm test:e2e e2e/blueprint-smoke.spec.ts
```

Fix any failures. Typical issues: timing (add `waitForLoadState`); accessor mismatches (update `getByRole` queries to actual DOM).

- [ ] **Step 3: Commit**

```bash
git add architex/e2e/blueprint-smoke.spec.ts
git commit -m "test(blueprint): e2e smoke suite for shell + all route surfaces"
```

---

## Task 23: Final verification

- [ ] **Step 1: Run full verification**

```bash
cd architex
pnpm typecheck
pnpm lint
pnpm test:run
pnpm build
pnpm test:e2e e2e/blueprint-smoke.spec.ts
```

All must pass.

- [ ] **Step 2: Manual walkthrough (spec §6.1)**

Walk through the 9 steps in spec §6.1. Everything works as described.

- [ ] **Step 3: Data verification (spec §6.3)**

```sql
SELECT COUNT(*) FROM blueprint_units;       -- 12
SELECT COUNT(*) FROM blueprint_courses;     -- 1
SELECT event_name FROM blueprint_events     -- at least 1 module_opened
  WHERE event_name = 'blueprint.module_opened' LIMIT 1;
```

- [ ] **Step 4: Final commit tag**

```bash
git log --oneline origin/main..HEAD | head -30
# Verify all tasks have commits. If any have no commit, something didn't ship.
```

- [ ] **Step 5: Push branch**

```bash
git push -u origin feat/blueprint-module
```

- [ ] **Step 6: PR**

```bash
gh pr create --title "Blueprint SP1 · Foundation" --body "$(cat <<'EOF'
## Summary

Implements Sub-project 1 of the Blueprint module per:
- Vision: `docs/superpowers/specs/2026-04-21-blueprint-module-vision.md`
- SP1 spec: `docs/superpowers/specs/2026-04-21-blueprint-sp1-foundation.md`
- SP1 plan: `docs/superpowers/plans/2026-04-21-blueprint-sp1-foundation.md`

Blueprint is a new Architex module that absorbs the learn/build/drill/review scope of old `/modules/lld` into a single journey-first UX. This PR lands the foundation: schema, shell, route tree, store, hooks, API, nav entry. No user-facing features yet — every interior is a "Coming soon" placeholder that points to its future sub-project.

Old `/modules/lld` is untouched; Blueprint is additive.

## What's in this PR

- 5 new DB tables (`blueprint_courses/units/user_progress/journey_state/events`)
- Drizzle migration + 12-unit seed
- Zustand `blueprint-store` with persist
- `useBlueprintRoute` / `useJourneyStateSync` / `useUnitProgressSync` / `useBlueprintAnalytics` hooks
- 6 API routes (`journey-state`, `units`, `units/[slug]`, `units/[slug]/progress`, `events`, `progress/summary`)
- Blueprint shell + sub-components (TopChrome, Breadcrumb, StatusBar, SurfaceTabs)
- Full route tree under `/modules/blueprint/*` (shell + placeholder pages)
- 25 typed analytics event builders
- Nav entry (modules index + left rail)
- E2E smoke suite
- Unit + hook tests
- Developer README

## Test plan

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test:run` green
- [ ] `pnpm build` green
- [ ] `pnpm test:e2e e2e/blueprint-smoke.spec.ts` green
- [ ] `/modules/blueprint` renders shell and placeholder
- [ ] Surface tabs route between Journey / Toolkit / Progress
- [ ] Unit / pattern / problem URLs resolve with correct breadcrumb
- [ ] Browser back/forward navigates through surfaces
- [ ] `pnpm blueprint:seed-units` is idempotent
- [ ] `SELECT COUNT(*) FROM blueprint_units;` returns 12
EOF
)"
```

---

## Summary of Task Count

23 tasks, ~50 sub-steps, ~40 commits expected.

Estimated solo execution time: 12–18 hours of focused work. With subagent parallelization of independent tasks (e.g., multiple schema files): 6–10 hours.

---

*End of SP1 plan.*
