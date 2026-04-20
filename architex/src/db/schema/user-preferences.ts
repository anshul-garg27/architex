/**
 * DB-015: User preferences — per-user settings blob (JSONB).
 *
 * Stores arbitrary preference trees keyed by feature area. Phase 1 adds
 * the `lld` subtree documented below; later phases add more.
 *
 * ## JSONB shape
 *
 * ```jsonc
 * {
 *   "lld": {
 *     "mode": "learn" | "build" | "drill" | "review",
 *     "welcomeBannerDismissed": boolean,
 *     "scratchCanvas": { ... }        // Phase 3+
 *   }
 * }
 * ```
 */

import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** Feature-keyed settings (see JSONB shape in file header). */
  preferences: jsonb("preferences").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserPreferences = InferSelectModel<typeof userPreferences>;
export type NewUserPreferences = InferInsertModel<typeof userPreferences>;
