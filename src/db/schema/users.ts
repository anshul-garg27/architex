/**
 * =============================================================================
 * USERS & PREFERENCES
 * =============================================================================
 *
 * Design decisions:
 * - Clerk manages authentication; we store clerk_id as the link.
 * - Preferences are JSONB instead of a separate table. These are always fetched
 *   with the user row (no joins), rarely queried independently, and the schema
 *   is flexible (new prefs added without migrations).
 * - Gamification counters (xp, streak) are denormalized on the user row to
 *   avoid joins on the dashboard hot path. Updated via Inngest background jobs.
 * - streak_last_activity_date uses DATE (not TIMESTAMP) to simplify timezone-
 *   aware "did the user do something today?" checks.
 *
 * Expected scale:
 * - Year 1: ~100K rows. Year 3: ~500K rows.
 * - Growth: ~5K new users/month at steady state.
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  date,
  boolean,
  jsonb,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "team",
  "enterprise",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserPreferences = {
  // Appearance
  theme?: "light" | "dark" | "system";
  editorLayout?: "horizontal" | "vertical";
  showMinimap?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
  reducedMotion?: boolean;
  colorblindMode?: "none" | "deuteranopia" | "protanopia" | "tritanopia";

  // Editor
  keybindings?: "default" | "vim";
  autoSaveIntervalMs?: number;
  showGridDots?: boolean;
  snapToGrid?: boolean;

  // Notifications (per-channel, per-category)
  notifications?: {
    learning?: { inApp?: boolean; email?: boolean; push?: boolean };
    achievements?: { inApp?: boolean; email?: boolean; push?: boolean };
    social?: { inApp?: boolean; email?: boolean; push?: boolean };
    weeklyDigest?: { email?: boolean };
    reEngagement?: { email?: boolean; push?: boolean };
  };

  // Locale
  locale?: string; // e.g. "en-US"
  timezone?: string; // e.g. "America/New_York"
};

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // Clerk manages auth; this is the Clerk user ID (e.g. "user_2abc...")
    clerkId: varchar("clerk_id", { length: 255 }).notNull().unique(),

    // Profile
    username: varchar("username", { length: 50 }).notNull().unique(),
    displayName: varchar("display_name", { length: 100 }),
    email: varchar("email", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),

    // Preferences (JSONB -- see UserPreferences type above)
    preferences: jsonb("preferences").$type<UserPreferences>().default({}),

    // Gamification (denormalized for dashboard hot path)
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    streakCurrent: integer("streak_current").notNull().default(0),
    streakLongest: integer("streak_longest").notNull().default(0),
    streakLastActivityDate: date("streak_last_activity_date"),

    // Subscription
    tier: subscriptionTierEnum("tier").notNull().default("free"),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    tierExpiresAt: timestamp("tier_expires_at", { withTimezone: true }),

    // Onboarding
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),

    // Timestamps
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastActiveAt: timestamp("last_active_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Clerk webhook lookups
    clerkIdx: uniqueIndex("users_clerk_id_idx").on(table.clerkId),
    // Public profile URL lookups
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    // Leaderboard query: ORDER BY xp DESC LIMIT N
    xpIdx: index("users_xp_idx").on(table.xp),
    // Re-engagement query: users inactive > 7 days
    lastActiveIdx: index("users_last_active_idx").on(table.lastActiveAt),
  })
);
