/**
 * DB-011: Activity events — append-only analytics log.
 *
 * Tracks learning interactions for analytics dashboards,
 * achievement condition checking, and streak computation.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Event type: 'visualization_run', 'challenge_completed', 'module_visited', etc. */
    event: varchar("event", { length: 100 }).notNull(),
    /** Which module: 'algorithms', 'lld', 'database', etc. */
    moduleId: varchar("module_id", { length: 50 }),
    /** Optional concept within module. */
    conceptId: varchar("concept_id", { length: 100 }),
    /** Event-specific payload (scores, duration, config, etc.) */
    metadata: jsonb("metadata"),
    /** When the event occurred (client timestamp, may differ from createdAt). */
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activity_events_user_idx").on(table.userId),
    index("activity_events_event_idx").on(table.event),
    index("activity_events_user_module_idx").on(table.userId, table.moduleId),
    index("activity_events_occurred_at_idx").on(table.occurredAt),
  ],
);

export type ActivityEvent = InferSelectModel<typeof activityEvents>;
export type NewActivityEvent = InferInsertModel<typeof activityEvents>;
