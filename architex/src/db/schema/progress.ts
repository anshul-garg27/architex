/**
 * DB-004: User progress table
 *
 * Tracks per-module, per-concept learning progress for each user.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  real,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const progress = pgTable(
  "progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Learning module identifier (e.g. 'system-design', 'algorithms'). */
    moduleId: varchar("module_id", { length: 100 }).notNull(),
    /** Specific concept within the module (e.g. 'load-balancing'). */
    conceptId: varchar("concept_id", { length: 100 }),
    /** Mastery score from 0.0 to 1.0. */
    score: real("score").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    // ── FSRS spaced repetition fields ──────────────────────
    /** Memory stability — days until 90% recall probability drops. */
    stability: real("stability"),
    /** Item difficulty — inherent hardness (0.0 to 1.0). */
    difficulty: real("difficulty"),
    /** Days elapsed since last review. */
    elapsedDays: integer("elapsed_days"),
    /** Days scheduled until next review. */
    scheduledDays: integer("scheduled_days"),
    /** Total successful review count. */
    reps: integer("reps").default(0),
    /** Total lapse (forgotten) count. */
    lapses: integer("lapses").default(0),
    /** FSRS state: 0=new, 1=learning, 2=review, 3=relearning. */
    fsrsState: integer("fsrs_state").default(0),
    /** Next scheduled review date. */
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    // ── End FSRS fields ────────────────────────────────────
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("progress_user_module_idx").on(table.userId, table.moduleId),
    uniqueIndex("progress_user_module_concept_idx").on(
      table.userId,
      table.moduleId,
      table.conceptId,
    ),
  ],
);

export type Progress = InferSelectModel<typeof progress>;
export type NewProgress = InferInsertModel<typeof progress>;
