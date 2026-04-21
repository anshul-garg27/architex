import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export type BlueprintPreferredLang = "ts" | "py" | "java";
export type BlueprintPinnedTool = "patterns" | "problems" | "review";

/**
 * blueprint_journey_state — one row per user, holds cross-unit journey state.
 *
 * This is a per-user singleton. `userId` is the primary key — simpler than
 * adding a synthetic id when only one row per user ever exists.
 *
 * Written by /api/blueprint/journey-state (GET hydrates store; PATCH on
 * debounced store mutations).
 */
export const blueprintJourneyState = pgTable("blueprint_journey_state", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  currentUnitSlug: varchar("current_unit_slug", { length: 100 }),
  currentSectionId: varchar("current_section_id", { length: 100 }),
  welcomeDismissedAt: timestamp("welcome_dismissed_at", {
    withTimezone: true,
  }),
  streakDays: integer("streak_days").notNull().default(0),
  streakLastActiveAt: timestamp("streak_last_active_at", {
    withTimezone: true,
  }),
  dailyReviewTarget: integer("daily_review_target").notNull().default(10),
  preferredLang: varchar("preferred_lang", { length: 10 })
    .$type<BlueprintPreferredLang>()
    .notNull()
    .default("ts"),
  pinnedTool: varchar("pinned_tool", {
    length: 20,
  }).$type<BlueprintPinnedTool>(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type BlueprintJourneyState = typeof blueprintJourneyState.$inferSelect;
export type NewBlueprintJourneyState =
  typeof blueprintJourneyState.$inferInsert;
