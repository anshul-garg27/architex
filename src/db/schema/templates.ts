/**
 * =============================================================================
 * TEMPLATES (Curated System Design Templates)
 * =============================================================================
 *
 * Design decisions:
 * - Templates are admin-curated content, not user-generated. The table is
 *   small (~55-100 rows) and rarely changes, so it is aggressively cached
 *   via ISR (60s revalidation) and Upstash Redis (1h TTL).
 *
 * - content is the same JSONB format as diagrams (React Flow toObject()).
 *   This means "Use Template" simply copies the content into a new diagram.
 *
 * - concepts is a TEXT[] array linking to concept slugs. This avoids a join
 *   table for a small, curated dataset. The template gallery filters by
 *   category and difficulty, not by individual concepts.
 *
 * - use_count is a denormalized counter incremented when a user creates a
 *   diagram from this template. Used for "Most Popular" sorting.
 *
 * Expected scale:
 * - Year 1: ~55 rows. Year 3: ~150 rows. Essentially static.
 * - use_count is the only frequently-updated column.
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { DiagramContent } from "./diagrams";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const templateDifficultyEnum = pgEnum("template_difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const templateCategoryEnum = pgEnum("template_category", [
  "system-design",
  "microservices",
  "databases",
  "caching",
  "messaging",
  "networking",
  "security",
  "data-pipeline",
  "ml-systems",
  "real-time",
  "storage",
  "observability",
]);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // URL-safe slug: "url-shortener", "chat-system", "news-feed"
    slug: varchar("slug", { length: 100 }).notNull().unique(),

    // Display metadata
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    category: templateCategoryEnum("category").notNull(),
    difficulty: templateDifficultyEnum("difficulty").notNull(),

    // The actual template diagram content (React Flow format)
    content: jsonb("content").$type<DiagramContent>().notNull(),

    // Preview image URL (Cloudflare R2)
    thumbnailUrl: text("thumbnail_url"),

    // Learning metadata
    concepts: text("concepts").array(), // ["caching", "cdn", "load-balancing"]
    estimatedMinutes: integer("estimated_minutes"),

    // Ordering and visibility
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(false),
    isFeatured: boolean("is_featured").notNull().default(false),

    // Denormalized usage counter
    useCount: integer("use_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("templates_slug_idx").on(table.slug),
    // Gallery: filter by category, then sort by sort_order
    categoryOrderIdx: index("templates_category_order_idx").on(
      table.category,
      table.sortOrder
    ),
    // Gallery: "Most Popular" tab
    useCountIdx: index("templates_use_count_idx").on(table.useCount),
    // Only show published templates
    publishedIdx: index("templates_published_idx").on(table.isPublished),
  })
);
