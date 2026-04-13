/**
 * =============================================================================
 * NOTIFICATIONS
 * =============================================================================
 *
 * Design decisions:
 * - In-app notifications are stored in PostgreSQL. Push and email notifications
 *   are fire-and-forget via Inngest + Resend / web-push (no DB storage).
 *
 * - The notification_type enum allows the frontend to render appropriate icons,
 *   colors, and actions without parsing the body.
 *
 * - action_url is the deep link when the user clicks the notification.
 *   e.g. "/challenges/url-shortener", "/diagrams/abc123"
 *
 * - Grouped notifications (e.g. "3 people upvoted your diagram") are handled
 *   at the API layer, not the DB layer. The DB stores individual events.
 *   The API groups by (type, action_url, date) and returns counts.
 *
 * HOT QUERY: notification list (unread first, paginated)
 *   SELECT * FROM notifications
 *   WHERE user_id = $1
 *   ORDER BY is_read ASC, created_at DESC
 *   LIMIT 20 OFFSET $2;
 *
 * Served by index: (user_id, is_read, created_at DESC)
 *
 * Cleanup: notifications older than 90 days are pruned by an Inngest cron job.
 *
 * Expected scale:
 * - ~20 notifications/user/week average.
 * - Year 1: ~100K users * 20/week * 52 weeks = ~100M rows (before pruning).
 * - With 90-day pruning: ~25M rows in steady state.
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
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const notificationTypeEnum = pgEnum("notification_type", [
  // Learning
  "challenge_graded", //    "Your URL Shortener challenge scored 87/100"
  "review_due", //          "3 concepts are due for review"
  "mastery_level_up", //    "You reached Proficient in Caching!"
  "streak_milestone", //    "7-day streak! Keep it up!"
  "streak_at_risk", //      "Don't break your 5-day streak!"

  // Achievements
  "achievement_unlocked", // "You earned: Database Master"

  // Social
  "comment_received", //    "Alice commented on your diagram"
  "upvote_received", //     "Bob upvoted your diagram"
  "diagram_forked", //      "Carol forked your URL Shortener design"
  "mention", //             "Dave mentioned you in a comment"

  // Collaboration
  "collab_invite", //       "Eve invited you to collaborate"
  "collab_ended", //        "Collaboration session ended"

  // System
  "system_announcement", // "New feature: ML System Design module"
  "welcome", //             "Welcome to Architex!"
]);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: notificationTypeEnum("type").notNull(),

    // Display content
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body"), // Optional longer description
    iconUrl: text("icon_url"), // Avatar or badge image URL

    // Deep link when clicked
    actionUrl: text("action_url"),

    // Read state
    isRead: boolean("is_read").notNull().default(false),
    readAt: timestamp("read_at", { withTimezone: true }),

    // Source user (for social notifications)
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // HOT: notification list (unread first, then by recency)
    // Covers: WHERE user_id = $1 ORDER BY is_read, created_at DESC LIMIT 20
    userReadTimeIdx: index("notifications_user_read_time_idx").on(
      table.userId,
      table.isRead,
      table.createdAt
    ),
    // Unread count badge: SELECT COUNT(*) WHERE user_id = $1 AND is_read = false
    // Partial index: only indexes unread notifications (much smaller)
    userUnreadIdx: index("notifications_user_unread_idx")
      .on(table.userId)
      .where(sql`is_read = false`),
    // Cleanup job: DELETE WHERE created_at < NOW() - INTERVAL '90 days'
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  })
);
