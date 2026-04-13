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
