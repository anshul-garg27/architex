/**
 * DB-007: AI usage tracking table
 *
 * Records every AI API call for billing, analytics, and rate-limiting.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  real,
  text,
  index,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** AI model identifier (e.g. 'claude-sonnet-4-20250514', 'gpt-4o'). */
    model: varchar("model", { length: 100 }).notNull(),
    /** Total tokens consumed (prompt + completion). */
    tokens: integer("tokens").notNull(),
    /** Estimated cost in USD cents. */
    cost: real("cost").notNull().default(0),
    /** What the AI call was for (e.g. 'topology-rules', 'hint', 'evaluate'). */
    purpose: varchar("purpose", { length: 100 }),
    /** Optional request/response metadata for debugging. */
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("ai_usage_user_id_idx").on(table.userId),
    index("ai_usage_created_at_idx").on(table.createdAt),
    index("ai_usage_user_purpose_idx").on(table.userId, table.purpose),
  ],
);

export type AiUsage = InferSelectModel<typeof aiUsage>;
export type NewAiUsage = InferInsertModel<typeof aiUsage>;
