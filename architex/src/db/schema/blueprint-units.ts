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

export type BlueprintSectionType =
  | "read"
  | "interact"
  | "apply"
  | "practice"
  | "retain"
  | "reflect"
  | "checkpoint";

export interface BlueprintSectionRecipe {
  /** Stable section slug within the unit (e.g. "meet-builder"). */
  id: string;
  type: BlueprintSectionType;
  title: string;
  /** Type-specific payload; interpretation is up to the section renderer. */
  params?: Record<string, unknown>;
}

export interface BlueprintUnitRecipe {
  /** Recipe-schema version. Bump when the renderer expectations change. */
  version: number;
  sections: BlueprintSectionRecipe[];
}

/**
 * blueprint_units — the ordered curriculum units.
 *
 * For V1, 12 rows seeded per the vision-spec curriculum. The `recipeJson`
 * column holds the ordered section list that the Unit Renderer (SP3) walks.
 * `prereqUnitSlugs` gates visibility in the journey map; prerequisites are a
 * soft gate (we show upcoming units grayed out, not hidden).
 */
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
