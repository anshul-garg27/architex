/**
 * DB-015: LLD learn progress — per (user, pattern) lesson reading state.
 *
 * Stores which of the 8 lesson sections the user has scrolled through,
 * their deepest scroll offset per section, and whether each section's
 * checkpoint has been answered. A unique (userId, patternSlug) constraint
 * ensures one row per user+pattern.
 *
 * FSRS seed data — the `completedAt` of this row is what the Review mode
 * (Phase 3) uses to schedule the first spaced-repetition card.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export type LearnSectionId =
  | "itch"
  | "definition"
  | "mechanism"
  | "anatomy"
  | "numbers"
  | "uses"
  | "failure_modes"
  | "checkpoints";

export interface SectionState {
  /** Deepest scroll offset reached, 0..1 clamped. */
  scrollDepth: number;
  /** When this section first entered viewport (epoch ms, null = never). */
  firstSeenAt: number | null;
  /** When the user's scroll reached ≥95% of the section (epoch ms, null = not yet). */
  completedAt: number | null;
}

export type SectionProgressMap = Record<LearnSectionId, SectionState>;

export const lldLearnProgress = pgTable(
  "lld_learn_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),

    /** Map of section → {scrollDepth, firstSeenAt, completedAt}. */
    sectionProgress: jsonb("section_progress")
      .$type<SectionProgressMap>()
      .notNull()
      .default(sql`'{}'::jsonb`),

    /** Last scroll position (px) so we can restore viewport on return. */
    lastScrollY: integer("last_scroll_y").notNull().default(0),
    /** Which section is currently in view (server-side mirror). */
    activeSectionId: varchar("active_section_id", { length: 30 }),

    /** Number of distinct sections scrolled ≥95% (denormalized for list views). */
    completedSectionCount: integer("completed_section_count")
      .notNull()
      .default(0),

    /** Checkpoint attempts per section: {[sectionId]: {attempts, correct}}. */
    checkpointStats: jsonb("checkpoint_stats")
      .notNull()
      .default(sql`'{}'::jsonb`),

    /** Whole-lesson completion: all 8 sections + final checkpoints done. */
    completedAt: timestamp("completed_at", { withTimezone: true }),

    /** Monotonic read count — increments each time the lesson is re-opened. */
    visitCount: integer("visit_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("lld_learn_progress_user_pattern_idx").on(
      t.userId,
      t.patternSlug,
    ),
    index("lld_learn_progress_user_idx").on(t.userId),
  ],
);

export type LLDLearnProgress = typeof lldLearnProgress.$inferSelect;
export type NewLLDLearnProgress = typeof lldLearnProgress.$inferInsert;
