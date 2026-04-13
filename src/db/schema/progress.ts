/**
 * =============================================================================
 * CONCEPTS, PROGRESS & SPACED REPETITION (FSRS)
 * =============================================================================
 *
 * Design decisions:
 *
 * FSRS vs SM-2:
 * - The existing research doc uses SM-2, but the gamification research
 *   explicitly states "FSRS > SM-2". FSRS (Free Spaced Repetition Scheduler)
 *   is the algorithm used by Anki and produces better retention curves.
 * - FSRS requires these parameters per card: stability, difficulty,
 *   elapsed_days, scheduled_days, reps, lapses, and state.
 * - We store all FSRS parameters on the progress row so the scheduler can
 *   compute the next interval without additional queries.
 *
 * Key query: "concepts due for review for user X"
 *   SELECT * FROM progress
 *   WHERE user_id = $1 AND next_review_at <= NOW()
 *   ORDER BY next_review_at ASC
 *   LIMIT 20;
 * This query is served by the composite index (user_id, next_review_at).
 *
 * review_events stores every individual review interaction for:
 * 1. FSRS parameter recalculation (if algorithm is updated)
 * 2. Analytics (review frequency, time-of-day patterns)
 * 3. Debugging mastery score disagreements
 *
 * Expected scale:
 * - concepts: ~100-200 rows (curated catalog of system design building blocks)
 * - progress: ~100K users * ~100 concepts = ~10M rows Year 1
 * - review_events: ~50M rows Year 1 (each review generates one event)
 *   This is the highest-volume table. Consider partitioning by created_at
 *   after Year 2.
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  jsonb,
  integer,
  real,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const masteryLevelEnum = pgEnum("mastery_level", [
  "novice", //  0-20%  first exposure
  "beginner", // 20-40%  can recognize
  "intermediate", // 40-60%  can apply with help
  "proficient", // 60-80%  can apply independently
  "expert", //  80-100% can teach others
]);

/**
 * FSRS card states (matches the FSRS algorithm specification):
 * - new:        never reviewed
 * - learning:   in the initial learning phase (short intervals)
 * - review:     graduated to longer intervals
 * - relearning: lapsed from review back to short intervals
 */
export const fsrsStateEnum = pgEnum("fsrs_state", [
  "new",
  "learning",
  "review",
  "relearning",
]);

/**
 * FSRS rating given by user after a review:
 * - again: complete blackout, reset to learning
 * - hard:  recalled with significant difficulty
 * - good:  recalled with some effort (default)
 * - easy:  recalled effortlessly
 */
export const fsrsRatingEnum = pgEnum("fsrs_rating", [
  "again",
  "hard",
  "good",
  "easy",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Concept catalog: system design building blocks.
 * Curated by the Architex team. ~100-200 rows.
 * Examples: "caching", "load-balancing", "database-sharding",
 * "consistent-hashing", "rate-limiting", "message-queues"
 */
export const concepts = pgTable(
  "concepts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 200 }).notNull(),

    // Category for grouping in the UI
    category: varchar("category", { length: 100 }).notNull(),
    // e.g. "caching", "databases", "networking", "distributed-systems"

    description: text("description"),

    // Prerequisites: concept slugs that should be learned first
    // Stored as array for simplicity (small dataset)
    prerequisites: text("prerequisites").array(),

    // Icon identifier for the UI (Lucide icon name)
    icon: varchar("icon", { length: 50 }),

    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("concepts_slug_idx").on(table.slug),
    categoryIdx: index("concepts_category_idx").on(
      table.category,
      table.sortOrder
    ),
  })
);

/**
 * User x Concept: mastery tracking + FSRS scheduling.
 *
 * This is the core SRS table. Each row represents one user's relationship
 * with one concept. The FSRS parameters determine when the concept is
 * next scheduled for review.
 *
 * HOT QUERY: SRS review queue
 *   SELECT p.*, c.name, c.slug, c.category
 *   FROM progress p
 *   JOIN concepts c ON c.id = p.concept_id
 *   WHERE p.user_id = $1
 *     AND p.next_review_at <= NOW()
 *   ORDER BY p.next_review_at ASC
 *   LIMIT 20;
 *
 * Served by index: (user_id, next_review_at)
 */
export const progress = pgTable(
  "progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),

    // -----------------------------------------------------------------------
    // Mastery tracking (human-readable level + fine-grained score)
    // -----------------------------------------------------------------------
    masteryLevel: masteryLevelEnum("mastery_level").notNull().default("novice"),
    masteryScore: integer("mastery_score").notNull().default(0), // 0-100

    // -----------------------------------------------------------------------
    // FSRS algorithm parameters
    // See: https://github.com/open-spaced-repetition/ts-fsrs
    // -----------------------------------------------------------------------

    /** Current card state in the FSRS state machine */
    fsrsState: fsrsStateEnum("fsrs_state").notNull().default("new"),

    /**
     * Stability (S): the number of days for which R (retrievability) remains
     * above 90%. Higher = memory is more stable. Stored as float (days).
     * Initial value depends on first rating (FSRS default parameters).
     */
    stability: real("stability").notNull().default(0),

    /**
     * Difficulty (D): inherent difficulty of the concept for this user.
     * Range: 1-10. Higher = harder to remember. Adjusted after each review.
     * Initial: 0 (set on first review).
     */
    difficulty: real("difficulty").notNull().default(0),

    /**
     * Days elapsed since the last review. Updated when a review occurs.
     * Used by FSRS to calculate retrievability.
     */
    elapsedDays: integer("elapsed_days").notNull().default(0),

    /**
     * Days scheduled between last review and next review.
     * This is the interval that was planned (not necessarily what elapsed).
     */
    scheduledDays: integer("scheduled_days").notNull().default(0),

    /**
     * Number of successful reviews (reps) and failed reviews (lapses).
     * "Successful" = rated "good" or "easy".
     * "Lapse" = rated "again" while in "review" state (forgot it).
     */
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),

    // -----------------------------------------------------------------------
    // Scheduling timestamps
    // -----------------------------------------------------------------------

    /** When this concept is next due for review. Core SRS query column. */
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),

    /** When the user last reviewed this concept. */
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),

    // -----------------------------------------------------------------------
    // Aggregate stats (for profile/dashboard display)
    // -----------------------------------------------------------------------
    totalReviews: integer("total_reviews").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Uniqueness: one progress row per user per concept
    userConceptUnique: uniqueIndex("progress_user_concept_idx").on(
      table.userId,
      table.conceptId
    ),
    // HOT: SRS review queue -- "concepts due for user X"
    // Query: WHERE user_id = $1 AND next_review_at <= NOW()
    nextReviewIdx: index("progress_next_review_idx").on(
      table.userId,
      table.nextReviewAt
    ),
    // Dashboard: user's mastery overview (all concepts for a user)
    userMasteryIdx: index("progress_user_mastery_idx").on(
      table.userId,
      table.masteryLevel
    ),
  })
);

/**
 * Individual review events. Immutable log of every SRS interaction.
 *
 * Used for:
 * 1. FSRS parameter recalculation (if the algorithm version changes)
 * 2. Review analytics (study heatmap, time-of-day effectiveness)
 * 3. Audit trail for mastery score changes
 *
 * HIGH-VOLUME TABLE: ~50M rows/year.
 * Partition by created_at (monthly) after Year 2.
 */
export const reviewEvents = pgTable(
  "review_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),

    // Which challenge triggered this review (null if standalone review)
    challengeId: uuid("challenge_id"),

    // FSRS rating given by user
    rating: fsrsRatingEnum("rating").notNull(),

    // Time spent on this review (seconds)
    timeSpentSeconds: integer("time_spent_seconds"),

    // Snapshot of FSRS state AFTER this review (for replay/recalculation)
    newStability: real("new_stability").notNull(),
    newDifficulty: real("new_difficulty").notNull(),
    newState: fsrsStateEnum("new_state").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    newMasteryScore: integer("new_mastery_score").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // User review history (for analytics heatmap, study calendar)
    userDateIdx: index("review_events_user_date_idx").on(
      table.userId,
      table.createdAt
    ),
    // Concept review history (for algorithm debugging)
    userConceptIdx: index("review_events_user_concept_idx").on(
      table.userId,
      table.conceptId,
      table.createdAt
    ),
  })
);
