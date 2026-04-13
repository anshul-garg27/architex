/**
 * DB-010: Achievements system
 *
 * Tracks achievement definitions and per-user unlock state.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  text,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

// ── Achievement definitions ─────────────────────────────────

export const achievements = pgTable(
  "achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Unique machine-readable key. */
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    /** Display name shown in the UI. */
    name: varchar("name", { length: 200 }).notNull(),
    /** Short description of how to earn it. */
    description: text("description").notNull(),
    /** Category for grouping: learning, streak, social, mastery, challenge. */
    category: varchar("category", { length: 50 }).notNull(),
    /** Icon identifier (Lucide icon name). */
    icon: varchar("icon", { length: 50 }),
    /** Hex color for the badge. */
    color: varchar("color", { length: 7 }),
    /** XP reward for unlocking. */
    xpReward: integer("xp_reward").notNull().default(0),
    /** Display order within category. */
    sortOrder: integer("sort_order").notNull().default(0),
    /** Whether this achievement is active. */
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("achievements_category_idx").on(table.category),
  ],
);

export type Achievement = InferSelectModel<typeof achievements>;
export type NewAchievement = InferInsertModel<typeof achievements>;

// ── Per-user unlock tracking ────────────────────────────────

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),
    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("user_achievements_unique_idx").on(
      table.userId,
      table.achievementId,
    ),
    index("user_achievements_user_idx").on(table.userId),
  ],
);

export type UserAchievement = InferSelectModel<typeof userAchievements>;
export type NewUserAchievement = InferInsertModel<typeof userAchievements>;
