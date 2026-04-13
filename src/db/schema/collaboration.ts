/**
 * =============================================================================
 * COLLABORATION SESSIONS
 * =============================================================================
 *
 * Design decisions:
 * - Real-time collaboration is handled by PartyKit (Cloudflare Durable Objects)
 *   + Yjs (CRDT). This table records the metadata, not the real-time state.
 *
 * - room_id maps to a PartyKit room. The Yjs document lives in the Durable
 *   Object's storage during the session and is flushed to the diagrams table
 *   (content JSONB) on session end.
 *
 * - collab_participants tracks who joined/left for analytics and display.
 *   cursor_color is assigned on join for the awareness protocol (live cursors).
 *
 * - Sessions are short-lived (minutes to hours). We do not archive old sessions;
 *   rows with status="ended" can be pruned after 90 days.
 *
 * Expected scale:
 * - collab_sessions: ~10K Year 1 (collaboration is a Pro/Team feature).
 * - collab_participants: ~30K Year 1 (avg 3 participants per session).
 */

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { diagrams } from "./diagrams";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const collabSessionStatusEnum = pgEnum("collab_session_status", [
  "active",
  "ended",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const collabSessions = pgTable(
  "collab_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // PartyKit room identifier (maps to a Cloudflare Durable Object)
    roomId: varchar("room_id", { length: 255 }).notNull().unique(),

    status: collabSessionStatusEnum("status").notNull().default("active"),
    maxParticipants: integer("max_participants").notNull().default(10),

    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (table) => ({
    // Find active session for a diagram
    diagramStatusIdx: index("collab_sessions_diagram_status_idx").on(
      table.diagramId,
      table.status
    ),
    // Room lookup by PartyKit room ID
    roomIdx: index("collab_sessions_room_idx").on(table.roomId),
  })
);

export const collabParticipants = pgTable(
  "collab_participants",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => collabSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),

    // Cursor color for the Yjs awareness protocol (e.g. "#FF6B6B")
    cursorColor: varchar("cursor_color", { length: 7 }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.sessionId, table.userId] }),
  })
);
