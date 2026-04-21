import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * blueprint_courses — top-level course metadata.
 *
 * For V1, a single row: "The Blueprint Course" (slug=blueprint-core, v1.0.0).
 * The table exists so we can support multiple courses in the future (e.g. a
 * "Functional Design Patterns" course) without schema changes.
 */
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
