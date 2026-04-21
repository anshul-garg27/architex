import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * blueprint_events — append-only event log for analytics + audit.
 *
 * Mirrors the PostHog event stream on our side. Write-only from the app;
 * read by analytics + debugging tools. Anonymous events have null userId.
 *
 * Indexes:
 *   - (userId, occurredAt desc) → "what did this user do today"
 *   - (eventName, occurredAt desc) → "how many flashcard_rated events this hour"
 *
 * Growth policy: a future rollup job aggregates old rows into summary
 * tables and truncates the raw log. Not in SP1 scope.
 */
export const blueprintEvents = pgTable(
  "blueprint_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sessionId: varchar("session_id", { length: 64 }),
    eventName: varchar("event_name", { length: 80 }).notNull(),
    eventPayload: jsonb("event_payload")
      .notNull()
      .default(sql`'{}'::jsonb`),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("blueprint_events_user_occurred_idx").on(t.userId, t.occurredAt),
    index("blueprint_events_name_occurred_idx").on(t.eventName, t.occurredAt),
  ],
);

export type BlueprintEvent = typeof blueprintEvents.$inferSelect;
export type NewBlueprintEvent = typeof blueprintEvents.$inferInsert;
