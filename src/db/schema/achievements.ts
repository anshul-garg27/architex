/**
 * =============================================================================
 * ACHIEVEMENTS & BADGES
 * =============================================================================
 *
 * Design decisions:
 * - achievements is a curated catalog (~50-100 rows). Static after seeding.
 * - achievements_users is the join table with composite PK (no duplicates).
 * - The `condition` JSONB stores the programmatic unlock criteria, evaluated
 *   by the achievement engine (Inngest background job). Examples:
 *     { "type": "streak", "threshold": 7 }
 *     { "type": "mastery", "concept": "caching", "level": "expert" }
 *     { "type": "challenges_completed", "count": 10 }
 *     { "type": "upvotes_received", "count": 100 }
 *
 * - Secret achievements (is_hidden = true) are not shown until unlocked.
 *   The UI shows "???" placeholders for hidden achievements.
 *
 * - xp_reward on the achievement is added to the user's XP when unlocked.
 *   The Inngest job that checks achievements also updates users.xp.
 *
 * Expected scale:
 * - achievements: ~50-100 rows (curated).
 * - achievements_users: ~100K users * ~10 avg achievements = ~1M rows Year 1.
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const achievementTypeEnum = pgEnum("achievement_type", [
  "streak", //    "7-day streak", "30-day streak"
  "mastery", //   "Caching Expert", "Database Master"
  "challenge", // "First Challenge", "100 Challenges"
  "community", // "First Comment", "100 Upvotes Received"
  "exploration", // "Tried All Modules", "First Simulation"
  "special", //   "Beta Tester", "Founding Member"
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AchievementCondition =
  | { type: "streak"; threshold: number }
  | { type: "mastery"; concept?: string; level: string; count?: number }
  | { type: "challenges_completed"; count: number; difficulty?: string }
  | { type: "challenges_scored"; minScore: number; count: number }
  | { type: "upvotes_received"; count: number }
  | { type: "comments_written"; count: number }
  | { type: "diagrams_published"; count: number }
  | { type: "reviews_completed"; count: number }
  | { type: "concepts_mastered"; count: number; level: string }
  | { type: "special"; tag: string }; // manual/event-triggered

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  type: achievementTypeEnum("type").notNull(),

  // Icon: either a Lucide icon name or a URL to a custom badge image
  icon: varchar("icon", { length: 255 }),

  // XP reward granted when unlocked
  xpReward: integer("xp_reward").notNull().default(0),

  // Condition for programmatic unlock checking (see AchievementCondition type)
  condition: jsonb("condition").$type<AchievementCondition>().notNull(),

  // Secret achievements: shown as "???" until unlocked
  isHidden: boolean("is_hidden").notNull().default(false),

  // Display ordering in the achievements gallery
  sortOrder: integer("sort_order").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Join table: which users have unlocked which achievements.
 * Composite PK prevents duplicate unlocks.
 */
export const achievementsUsers = pgTable(
  "achievements_users",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: uuid("achievement_id")
      .notNull()
      .references(() => achievements.id, { onDelete: "cascade" }),

    unlockedAt: timestamp("unlocked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Context of unlock: which challenge, which concept, etc.
    // e.g. { "challengeSlug": "url-shortener", "score": 95 }
    context: jsonb("context"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.achievementId] }),
    // User profile: "show all my achievements"
    userIdx: index("achievements_users_user_idx").on(table.userId),
    // Analytics: "how many users have this achievement?"
    achievementIdx: index("achievements_users_achievement_idx").on(
      table.achievementId
    ),
  })
);
