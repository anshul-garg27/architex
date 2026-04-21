/**
 * DB-014: LLD drill attempts — stores active and completed drill attempts.
 *
 * Phase 4 additions:
 *   - variant           — "exam" | "timed-mock" | "study"
 *   - stages            — per-stage progress + timing (JSONB)
 *   - current_stage     — "clarify" | "rubric" | "canvas" | "walkthrough" | "reflection"
 *   - started_stage_at  — timestamp of current stage entry (for timing heatmap)
 *   - hint_log          — hint consumption log with tier + penalty (JSONB)
 *   - rubric_breakdown  — 6-axis grade output (JSONB)
 *   - postmortem        — AI-authored post-drill report (JSONB)
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

    // Phase 4 · session variant
    variant: varchar("variant", { length: 20 }).notNull().default("timed-mock"),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),

    // Phase 4 · stage tracking
    currentStage: varchar("current_stage", { length: 20 })
      .notNull()
      .default("clarify"),
    startedStageAt: timestamp("started_stage_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    stages: jsonb("stages").notNull().default(sql`'{}'::jsonb`),

    elapsedBeforePauseMs: integer("elapsed_before_pause_ms")
      .notNull()
      .default(0),
    durationLimitMs: integer("duration_limit_ms").notNull(),

    canvasState: jsonb("canvas_state"),
    hintsUsed: jsonb("hints_used").notNull().default(sql`'[]'::jsonb`),

    // Phase 4 · rich hint log (supersedes hintsUsed for drill mode;
    // we keep hintsUsed for backward compat with Phase 3 drill attempts)
    hintLog: jsonb("hint_log").notNull().default(sql`'[]'::jsonb`),

    gradeScore: real("grade_score"),
    gradeBreakdown: jsonb("grade_breakdown"),

    // Phase 4 · 6-axis grade + AI postmortem
    rubricBreakdown: jsonb("rubric_breakdown"),
    postmortem: jsonb("postmortem"),
  },
  (t) => [
    // One active drill per user
    uniqueIndex("one_active_drill_per_user")
      .on(t.userId)
      .where(sql`${t.submittedAt} IS NULL AND ${t.abandonedAt} IS NULL`),
    index("drill_history_idx").on(t.userId, t.submittedAt),
    index("drill_stage_idx").on(t.userId, t.currentStage),
  ],
);

export type LLDDrillAttempt = typeof lldDrillAttempts.$inferSelect;
export type NewLLDDrillAttempt = typeof lldDrillAttempts.$inferInsert;

// Phase 4 · shared stage/variant types re-exported for consumers
export type DrillStage =
  | "clarify"
  | "rubric"
  | "canvas"
  | "walkthrough"
  | "reflection";

export type DrillVariant = "exam" | "timed-mock" | "study";
