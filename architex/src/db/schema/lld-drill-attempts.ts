/**
 * DB-014: LLD drill attempts — stores active and completed drill attempts.
 *
 * A drill is "active" when submitted_at IS NULL AND abandoned_at IS NULL.
 * A partial unique index enforces "only one active drill per user" at the
 * DB level, preventing race conditions on concurrent POST.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldDrillAttempts = pgTable(
  "lld_drill_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    problemId: varchar("problem_id", { length: 100 }).notNull(),
    drillMode: varchar("drill_mode", { length: 20 })
      .notNull()
      .default("interview"), // "interview" | "guided" | "speed"

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),

    elapsedBeforePauseMs: integer("elapsed_before_pause_ms")
      .notNull()
      .default(0),
    durationLimitMs: integer("duration_limit_ms").notNull(),

    canvasState: jsonb("canvas_state"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),

    gradeScore: real("grade_score"),
    gradeBreakdown: jsonb("grade_breakdown"),
  },
  (t) => [
    // One active drill per user
    uniqueIndex("one_active_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("drill_history_idx").on(t.userId, t.submittedAt),
  ],
);

export type LLDDrillAttempt = typeof lldDrillAttempts.$inferSelect;
export type NewLLDDrillAttempt = typeof lldDrillAttempts.$inferInsert;
