import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { blueprintUnits } from "./blueprint-units";

export type BlueprintUnitState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "mastered";

export interface BlueprintSectionCompletion {
  /** Epoch ms when the user first entered this section. */
  startedAt: number | null;
  /** Epoch ms when the section's completion criteria were met. */
  completedAt: number | null;
  /** Attempts made on this section (interact/practice/checkpoint only). */
  attempts: number;
  /** 0..100 for scored sections; null if the section type has no score. */
  score: number | null;
}

export type BlueprintSectionStatesMap = Record<
  string,
  BlueprintSectionCompletion
>;

/**
 * blueprint_user_progress — per (user, unit) progress record.
 *
 * Stores the per-section completion map + aggregate fields (state, last
 * position, time). Unique on (userId, unitId). State decays from mastered
 * back to completed when FSRS cards drop below the mastery threshold
 * (handled by the retention reconciliation job, scheduled in SP6).
 */
export const blueprintUserProgress = pgTable(
  "blueprint_user_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    unitId: uuid("unit_id")
      .notNull()
      .references(() => blueprintUnits.id, { onDelete: "cascade" }),
    state: varchar("state", { length: 20 })
      .$type<BlueprintUnitState>()
      .notNull()
      .default("available"),
    sectionStates: jsonb("section_states")
      .$type<BlueprintSectionStatesMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    lastPosition: varchar("last_position", { length: 100 }),
    totalTimeMs: integer("total_time_ms").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    masteredAt: timestamp("mastered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("blueprint_user_progress_user_unit_idx").on(
      t.userId,
      t.unitId,
    ),
    index("blueprint_user_progress_user_idx").on(t.userId),
  ],
);

export type BlueprintUserProgress =
  typeof blueprintUserProgress.$inferSelect;
export type NewBlueprintUserProgress =
  typeof blueprintUserProgress.$inferInsert;
