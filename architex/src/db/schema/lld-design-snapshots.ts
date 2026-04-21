/**
 * DB-021: LLD design snapshots — immutable history entries.
 *
 * Every explicit save (name, Cmd+S, auto-save tick) and every named
 * snapshot ("Before big refactor") writes a new row. Snapshots are
 * append-only; undo/redo mid-session uses the in-memory UndoManager,
 * while the user-visible "Snapshots" drawer reads from this table.
 *
 * `kind` distinguishes auto-save (silent) from user-named milestones.
 * Content lives in `canvasState` as the full React Flow node/edge JSON.
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { lldDesigns } from "./lld-designs";
import { users } from "./users";

export const lldDesignSnapshots = pgTable(
  "lld_design_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    designId: uuid("design_id")
      .notNull()
      .references(() => lldDesigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // "auto" = silent periodic save, "named" = user labelled this point.
    kind: varchar("kind", { length: 20 }).notNull().default("auto"),
    label: varchar("label", { length: 200 }),
    note: text("note"),

    canvasState: jsonb("canvas_state").notNull(),
    nodeCount: integer("node_count").notNull().default(0),
    edgeCount: integer("edge_count").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("lld_design_snapshots_design_idx").on(t.designId, t.createdAt),
    index("lld_design_snapshots_user_kind_idx").on(t.userId, t.kind),
  ],
);

export type LLDDesignSnapshot = typeof lldDesignSnapshots.$inferSelect;
export type NewLLDDesignSnapshot = typeof lldDesignSnapshots.$inferInsert;
