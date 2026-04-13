/**
 * DB-009: Module content table
 *
 * Unified content storage for all 13 learning modules. Stores catalog
 * metadata, educational text, quiz questions, and templates as JSONB.
 * Module-specific fields live inside the `content` column.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  boolean,
  text,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const moduleContent = pgTable(
  "module_content",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Learning module: 'algorithms', 'lld', 'database', etc. */
    moduleId: varchar("module_id", { length: 50 }).notNull(),
    /** Content discriminator: 'pattern', 'problem', 'algorithm', 'template', etc. */
    contentType: varchar("content_type", { length: 50 }).notNull(),
    /** URL-safe identifier, unique per module+type. */
    slug: varchar("slug", { length: 200 }).notNull(),
    /** Human-readable name shown in UI. */
    name: varchar("name", { length: 300 }).notNull(),
    /** Optional category within the content type (e.g. 'creational', 'sorting'). */
    category: varchar("category", { length: 100 }),
    /** Difficulty level: 'beginner', 'intermediate', 'advanced', 'expert'. */
    difficulty: varchar("difficulty", { length: 20 }),
    /** Display ordering within module+type. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Full content payload — module-specific fields live here. */
    content: jsonb("content").notNull().default({}),
    /** Short text summary for list views (avoids sending full JSONB). */
    summary: text("summary"),
    /** Searchable tags for filtering and full-text discovery. */
    tags: text("tags").array(),
    /** Soft-publish flag — unpublished content hidden from public API. */
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("module_content_unique_idx").on(
      table.moduleId,
      table.contentType,
      table.slug,
    ),
    index("module_content_module_type_idx").on(
      table.moduleId,
      table.contentType,
      table.sortOrder,
    ),
  ],
);

export type ModuleContent = InferSelectModel<typeof moduleContent>;
export type NewModuleContent = InferInsertModel<typeof moduleContent>;
