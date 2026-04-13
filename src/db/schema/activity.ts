/**
 * =============================================================================
 * ACTIVITY EVENTS (Analytics & Activity Feed)
 * =============================================================================
 *
 * Design decisions:
 * - This is the internal analytics event log. Separate from PostHog (which
 *   handles product analytics). This table powers:
 *   1. The user's activity feed on their dashboard
 *   2. The public activity feed ("Alice scored 92 on URL Shortener")
 *   3. Streak calculation (any qualifying event = activity for the day)
 *   4. Achievement condition checking (count events of a given type)
 *
 * - Polymorphic references: each event references the relevant entity via
 *   nullable foreign keys. Only one of (diagram_id, challenge_id, concept_id,
 *   achievement_id) is populated per event.
 *
 * - metadata JSONB stores event-specific details (score, old/new mastery, etc.)
 *   without schema changes for each event type.
 *
 * - is_public controls whether the event appears in the community feed.
 *   A partial index on (is_public = true, created_at) makes the public
 *   feed query efficient.
 *
 * Expected scale:
 * - Year 1: ~10M rows. Year 3: ~100M rows.
 * - This is a high-write, append-only table. Consider partitioning by
 *   created_at (monthly) after Year 2.
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { diagrams } from "./diagrams";
import { challenges } from "./challenges";
import { concepts } from "./progress";
import { achievements } from "./achievements";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const activityTypeEnum = pgEnum("activity_type", [
  // Learning events
  "challenge_started",
  "challenge_submitted",
  "challenge_scored",
  "concept_reviewed",
  "mastery_level_up",

  // Diagram events
  "diagram_created",
  "diagram_published",
  "diagram_forked",

  // Social events
  "comment_added",
  "upvote_given",
  "upvote_received",

  // Achievement events
  "achievement_unlocked",
  "streak_milestone",

  // Collaboration events
  "collab_session_started",
  "collab_session_ended",

  // Template events
  "template_used",
]);

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: activityTypeEnum("type").notNull(),

    // Polymorphic references (only one populated per event)
    diagramId: uuid("diagram_id").references(() => diagrams.id, {
      onDelete: "set null",
    }),
    challengeId: uuid("challenge_id").references(() => challenges.id, {
      onDelete: "set null",
    }),
    conceptId: uuid("concept_id").references(() => concepts.id, {
      onDelete: "set null",
    }),
    achievementId: uuid("achievement_id").references(() => achievements.id, {
      onDelete: "set null",
    }),

    // Event-specific structured data
    // e.g. { "score": 87, "oldMastery": "beginner", "newMastery": "intermediate" }
    metadata: jsonb("metadata"),

    // Visibility: only show public events in the community feed
    isPublic: boolean("is_public").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Dashboard: user's recent activity
    userTimeIdx: index("activity_events_user_time_idx").on(
      table.userId,
      table.createdAt
    ),
    // Streak calculation: check if user has any activity today
    // Query: WHERE user_id = $1 AND created_at >= $today
    userDateIdx: index("activity_events_user_date_idx").on(
      table.userId,
      table.createdAt
    ),
    // Public activity feed: recent public events
    // Partial index: only public events (much smaller than full table)
    publicTimeIdx: index("activity_events_public_time_idx")
      .on(table.createdAt)
      .where(sql`is_public = true`),
    // Achievement checking: count events of a given type for a user
    userTypeIdx: index("activity_events_user_type_idx").on(
      table.userId,
      table.type
    ),
  })
);
