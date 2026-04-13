/**
 * DB-006: Gallery submissions table
 *
 * Tracks public diagram submissions to the community gallery,
 * along with upvotes tracked per-user.
 */

import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { diagrams } from "./diagrams";
import { users } from "./users";

export const gallerySubmissions = pgTable(
  "gallery_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    upvotes: integer("upvotes").notNull().default(0),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("gallery_author_id_idx").on(table.authorId),
    index("gallery_upvotes_idx").on(table.upvotes),
    uniqueIndex("gallery_diagram_id_idx").on(table.diagramId),
  ],
);

/**
 * Per-user upvote records to enforce one-upvote-per-user-per-submission.
 */
export const galleryUpvotes = pgTable(
  "gallery_upvotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => gallerySubmissions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("gallery_upvotes_user_submission_idx").on(
      table.userId,
      table.submissionId,
    ),
  ],
);

export type GallerySubmission = InferSelectModel<typeof gallerySubmissions>;
export type NewGallerySubmission = InferInsertModel<typeof gallerySubmissions>;
export type GalleryUpvote = InferSelectModel<typeof galleryUpvotes>;
export type NewGalleryUpvote = InferInsertModel<typeof galleryUpvotes>;
