/**
 * =============================================================================
 * COMMUNITY: COMMENTS, UPVOTES, REPORTS
 * =============================================================================
 *
 * Design decisions:
 * - Comments support threading via parent_id (self-referencing FK). We limit
 *   nesting to 2 levels in the UI (comment -> reply) but the schema supports
 *   arbitrary depth for future flexibility.
 *
 * - Upvotes use a composite PK (user_id, diagram_id) to prevent duplicate
 *   upvotes at the database level. The upvote_count on diagrams is a
 *   denormalized counter updated by an Inngest background job.
 *
 * - Reports are stored separately for moderation. A report does not immediately
 *   affect visibility; it queues for admin review.
 *
 * Expected scale:
 * - comments: ~200K Year 1, ~2M Year 3.
 * - upvotes: ~500K Year 1, ~5M Year 3.
 * - reports: ~1K Year 1 (hopefully).
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { diagrams } from "./diagrams";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "reviewed",
  "actioned",
  "dismissed",
]);

export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "inappropriate",
  "plagiarism",
  "harassment",
  "other",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Threaded comments on public diagrams.
 * Content is Markdown (rendered client-side).
 */
export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Threading: null = top-level comment, non-null = reply
    parentId: uuid("parent_id"),
    // Self-reference FK added via raw SQL migration (Drizzle limitation)

    content: text("content").notNull(), // Markdown
    isEdited: boolean("is_edited").notNull().default(false),
    isDeleted: boolean("is_deleted").notNull().default(false),
    // Soft delete: content replaced with "[deleted]" in the API layer.
    // Row kept to preserve thread structure.

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Load comments for a diagram (ordered by created_at)
    diagramIdx: index("comments_diagram_idx").on(
      table.diagramId,
      table.createdAt
    ),
    // User's comment history
    userIdx: index("comments_user_idx").on(table.userId),
    // Thread lookup: find replies to a comment
    parentIdx: index("comments_parent_idx").on(table.parentId),
  })
);

/**
 * Upvotes on public diagrams.
 * Composite PK prevents duplicate upvotes at the DB level.
 */
export const upvotes = pgTable(
  "upvotes",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.diagramId] }),
    // "How many upvotes does this diagram have?" (used to sync denormalized counter)
    diagramIdx: index("upvotes_diagram_idx").on(table.diagramId),
  })
);

/**
 * Content reports for moderation.
 * Low-volume table; no aggressive indexing needed.
 */
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // What is being reported (polymorphic: diagram or comment)
    diagramId: uuid("diagram_id").references(() => diagrams.id, {
      onDelete: "set null",
    }),
    commentId: uuid("comment_id").references(() => comments.id, {
      onDelete: "set null",
    }),

    reason: reportReasonEnum("reason").notNull(),
    description: text("description"),
    status: reportStatusEnum("status").notNull().default("pending"),

    // Admin who reviewed (null until reviewed)
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewNote: text("review_note"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    statusIdx: index("reports_status_idx").on(table.status),
  })
);
