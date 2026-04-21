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
