/**
 * DB-017: LLD bookmarks — user-authored anchors into lesson content.
 *
 * Scope: bookmark-per-heading (not arbitrary paragraph) to keep anchors
 * stable across content edits. Each bookmark stores the pattern, the
 * sectionId, a stable anchor id (from MDX frontmatter or the sluggified
 * heading), and the user's optional note.
 *
 * Deletion is hard-delete (no soft-delete) — bookmarks are lightweight
 * and users expect delete = gone.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldBookmarks = pgTable(
  "lld_bookmarks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),
    sectionId: varchar("section_id", { length: 30 }).notNull(),
    /** Stable anchor id (e.g. "why-singleton-is-a-smell"). */
    anchorId: varchar("anchor_id", { length: 200 }).notNull(),
    /** Cached heading text for list display — refreshed on content edits. */
    anchorLabel: varchar("anchor_label", { length: 500 }).notNull(),

    /** Optional user note (max ~10k chars). */
    note: text("note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    // One bookmark per (user, pattern, anchor) — toggling a bookmark
    // on an already-bookmarked anchor is a delete, not a duplicate.
    uniqueIndex("lld_bookmarks_user_anchor_idx").on(
      t.userId,
      t.patternSlug,
      t.anchorId,
    ),
    index("lld_bookmarks_user_recent_idx").on(t.userId, t.createdAt),
  ],
);

export type LLDBookmark = typeof lldBookmarks.$inferSelect;
export type NewLLDBookmark = typeof lldBookmarks.$inferInsert;
