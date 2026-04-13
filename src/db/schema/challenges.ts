/**
 * =============================================================================
 * CHALLENGES, RUBRICS, & ATTEMPTS
 * =============================================================================
 *
 * Design decisions:
 * - Challenges are admin-curated problems (~200+ rows). Each has:
 *   - A problem statement (Markdown)
 *   - Constraints (JSONB: scale, latency, availability requirements)
 *   - A starter diagram (partially filled, optional)
 *   - A reference solution (hidden, used by AI grader)
 *   - Rubric dimensions with weights (used by Claude for scoring)
 *
 * - challenge_rubrics is a separate table (not JSONB on the challenge) because
 *   rubric dimensions are individually weighted and scored. The AI grader
 *   iterates over them, and we store per-dimension scores in attempt results.
 *
 * - challenge_attempts stores every submission. The submitted_content is the
 *   user's diagram JSONB at the moment of submission (snapshot, not a reference
 *   to the diagram table). This ensures the grading record is immutable even
 *   if the user later edits the diagram.
 *
 * - ai_feedback is JSONB containing structured grading output from Claude:
 *   per-dimension scores, written feedback, suggestions.
 *
 * Expected scale:
 * - challenges: ~200 rows Year 1, ~500 Year 3.
 * - challenge_rubrics: ~1000 rows (5 dimensions per challenge avg).
 * - challenge_attempts: ~500K Year 1, ~5M Year 3. This is the high-growth table.
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
  primaryKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { DiagramContent } from "./diagrams";
import { users } from "./users";
import { concepts } from "./progress";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const challengeDifficultyEnum = pgEnum("challenge_difficulty", [
  "easy",
  "medium",
  "hard",
  "expert",
]);

export const challengeStatusEnum = pgEnum("challenge_status", [
  "draft",
  "published",
  "archived",
]);

export const attemptStatusEnum = pgEnum("attempt_status", [
  "in_progress", // timer running, not yet submitted
  "submitted", // submitted, awaiting AI grading
  "grading", // AI grading in progress (Inngest job)
  "graded", // grading complete, score available
  "error", // grading failed (retryable)
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChallengeConstraints = {
  userScale?: string; // e.g. "100M DAU"
  storageScale?: string; // e.g. "1 PB"
  latencyRequirement?: string; // e.g. "p99 < 200ms"
  availabilityTarget?: string; // e.g. "99.99%"
  readWriteRatio?: string; // e.g. "100:1 read-heavy"
  specialConstraints?: string[]; // e.g. ["geo-distributed", "real-time"]
};

export type AttemptFeedback = {
  totalScore: number; // 0-100
  dimensionScores: Array<{
    dimension: string;
    score: number;
    maxPoints: number;
    feedback: string;
  }>;
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  suggestedConcepts: string[]; // concept slugs to review
};

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const challenges = pgTable(
  "challenges",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // URL-safe slug: "url-shortener", "chat-system", "rate-limiter"
    slug: varchar("slug", { length: 100 }).notNull().unique(),

    // Display metadata
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(), // Markdown problem statement
    difficulty: challengeDifficultyEnum("difficulty").notNull(),
    status: challengeStatusEnum("status").notNull().default("draft"),
    category: varchar("category", { length: 100 }),

    // Problem configuration
    constraints: jsonb("constraints").$type<ChallengeConstraints>(),
    starterContent: jsonb("starter_content").$type<DiagramContent>(),
    referenceSolution: jsonb("reference_solution").$type<DiagramContent>(),

    // Time limit in minutes (null = unlimited)
    timeLimitMinutes: integer("time_limit_minutes"),

    // Hints (progressive reveal)
    hints: jsonb("hints").$type<string[]>().default([]),

    // Tags for filtering
    tags: text("tags").array(),

    // Engagement counters (denormalized)
    submissionCount: integer("submission_count").notNull().default(0),
    avgScore: integer("avg_score"), // 0-100, null if no submissions

    // Ordering
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("challenges_slug_idx").on(table.slug),
    // Challenge list: filter by difficulty + status, sort by sortOrder
    difficultyStatusIdx: index("challenges_difficulty_status_idx").on(
      table.difficulty,
      table.status,
      table.sortOrder
    ),
    // Category filter
    categoryIdx: index("challenges_category_idx").on(table.category),
    // Tag-based search
    tagsIdx: index("challenges_tags_idx").using("gin", table.tags),
  })
);

/**
 * Rubric dimensions for AI grading. Each challenge has 3-7 dimensions
 * (e.g. "Scalability", "Reliability", "Data Model", "API Design").
 */
export const challengeRubrics = pgTable(
  "challenge_rubrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),

    // e.g. "scalability", "reliability", "completeness"
    dimension: varchar("dimension", { length: 100 }).notNull(),
    description: text("description").notNull(),

    // Scoring
    weight: integer("weight").notNull().default(1), // relative weight
    maxPoints: integer("max_points").notNull().default(10),

    // Criteria for AI: what constitutes full marks (Markdown)
    criteria: text("criteria").notNull(),

    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => ({
    challengeRubricIdx: index("rubrics_challenge_id_idx").on(
      table.challengeId,
      table.sortOrder
    ),
  })
);

/**
 * Many-to-many: which concepts a challenge tests.
 * Used to update concept mastery after a challenge is graded.
 */
export const challengeConcepts = pgTable(
  "challenge_concepts",
  {
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    conceptId: uuid("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.challengeId, table.conceptId] }),
  })
);

/**
 * Every challenge submission. High-growth table.
 *
 * submitted_content is a SNAPSHOT of the diagram at submission time,
 * not a foreign key reference. This ensures grading records are immutable.
 */
export const challengeAttempts = pgTable(
  "challenge_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    challengeId: uuid("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),

    // Status tracks the grading pipeline
    status: attemptStatusEnum("status").notNull().default("in_progress"),

    // Snapshot of diagram at submission (immutable grading record)
    submittedContent: jsonb("submitted_content").$type<DiagramContent>(),

    // Timing
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    timeSpentSeconds: integer("time_spent_seconds"),

    // Hints used (0 = no hints, each hint reduces max score)
    hintsUsed: integer("hints_used").notNull().default(0),

    // AI grading results (populated by Inngest after Claude grades)
    score: integer("score"), // 0-100, null until graded
    aiFeedback: jsonb("ai_feedback").$type<AttemptFeedback>(),
    gradedAt: timestamp("graded_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // User's attempts for a specific challenge (history view)
    userChallengeIdx: index("attempts_user_challenge_idx").on(
      table.userId,
      table.challengeId,
      table.createdAt
    ),
    // User's recent attempts across all challenges (dashboard)
    userRecentIdx: index("attempts_user_recent_idx").on(
      table.userId,
      table.createdAt
    ),
    // Grading pipeline: find submitted-but-ungraded attempts
    statusIdx: index("attempts_status_idx").on(table.status),
    // Challenge analytics: all attempts for a challenge
    challengeIdx: index("attempts_challenge_idx").on(table.challengeId),
  })
);
