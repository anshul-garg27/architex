/**
 * DB-016: LLD concept reads — thin log of "user viewed concept X on
 * pattern Y, at time T". Used by the cross-linking engine to dim already-
 * read concepts in the sidebar, and by FSRS to boost stability for
 * concepts the user has seen across multiple patterns.
 *
 * Append-only — we do not update existing rows. Keep rows small, index
 * only the two query shapes we support (read all for user, read recent
 * per user+concept).
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const lldConceptReads = pgTable(
  "lld_concept_reads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Concept identifier — slug from concept-graph (e.g. "lazy-init"). */
    conceptId: varchar("concept_id", { length: 100 }).notNull(),
    /** Pattern slug where the concept was surfaced (e.g. "singleton"). */
    patternSlug: varchar("pattern_slug", { length: 100 }).notNull(),
    /** Section within the pattern (itch|definition|...|checkpoints). */
    sectionId: varchar("section_id", { length: 30 }).notNull(),

    readAt: timestamp("read_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_concept_reads_user_concept_idx").on(
      t.userId,
      t.conceptId,
      t.readAt,
    ),
    index("lld_concept_reads_user_recent_idx").on(t.userId, t.readAt),
  ],
);

export type LLDConceptRead = typeof lldConceptReads.$inferSelect;
export type NewLLDConceptRead = typeof lldConceptReads.$inferInsert;
