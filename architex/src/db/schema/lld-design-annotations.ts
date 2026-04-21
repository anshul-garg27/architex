/**
 * DB-023: LLD design annotations — floating notes attached to a design.
 *
 * Annotations are NOT nodes: they live on a separate visual layer above
 * the canvas, anchored either to a node (nodeId set) or to free-floating
 * (x,y) canvas coordinates. This lets users mark up a design with
 * commentary without polluting the structural graph.
 *
 * `kind` discriminates rendering: sticky-note | arrow | circle | text.
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  real,
  index,
} from "drizzle-orm/pg-core";
import { lldDesigns } from "./lld-designs";
import { users } from "./users";

export const lldDesignAnnotations = pgTable(
  "lld_design_annotations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => lldDesigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    kind: varchar("kind", { length: 30 }).notNull().default("sticky-note"),
    nodeId: varchar("node_id", { length: 100 }), // null = floating
    x: real("x").notNull().default(0),
    y: real("y").notNull().default(0),

    body: text("body").notNull().default(""),
    color: varchar("color", { length: 20 }).notNull().default("amber"),
    meta: jsonb("meta").notNull().default(sql`'{}'::jsonb`), // shape/size options

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_design_annotations_design_idx").on(t.designId),
    index("lld_design_annotations_node_idx").on(t.designId, t.nodeId),
  ],
);

export type LLDDesignAnnotation = typeof lldDesignAnnotations.$inferSelect;
export type NewLLDDesignAnnotation =
  typeof lldDesignAnnotations.$inferInsert;
