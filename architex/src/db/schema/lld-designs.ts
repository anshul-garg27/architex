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
