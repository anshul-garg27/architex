/**
 * DB-002: Diagrams table
 *
 * Stores user-created system design diagrams with JSON node/edge data.
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  jsonb,
  boolean,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { users } from "./users";

export const diagrams = pgTable(
  "diagrams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }),
    description: text("description"),
    /** React Flow nodes array stored as JSONB. */
    data: jsonb("data").notNull().default({}),
    /** Template this diagram was created from (nullable). */
    templateId: uuid("template_id"),
    isPublic: boolean("is_public").notNull().default(false),
    forkCount: integer("fork_count").notNull().default(0),
    upvoteCount: integer("upvote_count").notNull().default(0),
    /** ID of the original diagram if this is a fork. */
    forkedFromId: uuid("forked_from_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("diagrams_user_id_idx").on(table.userId),
    index("diagrams_template_id_idx").on(table.templateId),
    index("diagrams_is_public_idx").on(table.isPublic),
    index("diagrams_slug_idx").on(table.slug),
  ],
);

export type Diagram = InferSelectModel<typeof diagrams>;
export type NewDiagram = InferInsertModel<typeof diagrams>;
