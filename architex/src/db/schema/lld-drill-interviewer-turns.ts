/**
 * DB-015: LLD drill interviewer turns — the chat log between the user
 * and the Claude-backed interviewer persona.
 *
 * Cascade-deletes when the parent drill attempt is deleted.
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { lldDrillAttempts } from "./lld-drill-attempts";

export const lldDrillInterviewerTurns = pgTable(
  "lld_drill_interviewer_turns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => lldDrillAttempts.id, { onDelete: "cascade" }),

    // "user" | "interviewer" | "system"
    role: varchar("role", { length: 20 }).notNull(),

    // "clarify" | "rubric" | "canvas" | "walkthrough" | "reflection"
    stage: varchar("stage", { length: 20 }).notNull(),

    // "generic" | "amazon" | "google" | "meta" | "stripe" | "uber"
    persona: varchar("persona", { length: 20 }).notNull().default("generic"),

    // Sequential index within the attempt — starts at 0.
    seq: integer("seq").notNull(),

    content: text("content").notNull(),

    // Optional metadata — token counts, model, latency, cost
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("drill_turn_attempt_seq_idx").on(t.attemptId, t.seq),
  ],
);

export type LLDDrillInterviewerTurn =
  typeof lldDrillInterviewerTurns.$inferSelect;
export type NewLLDDrillInterviewerTurn =
  typeof lldDrillInterviewerTurns.$inferInsert;
