/**
 * =============================================================================
 * DIAGRAMS & VERSIONS
 * =============================================================================
 *
 * Design decisions:
 * - Diagram content is stored as PostgreSQL JSONB, not in object storage.
 *   Rationale: average diagram is 5-50 KB (even a 100-node diagram with edges
 *   and metadata is ~80-120 KB). JSONB gives us atomic reads/writes with
 *   metadata, transactional versioning, and the ability to query inside the
 *   JSON (e.g. "find all diagrams containing a load-balancer node").
 *   PostgreSQL's JSONB limit is 1 GB -- we will never approach it.
 *
 * - Denormalized counters (upvote_count, comment_count, fork_count, view_count)
 *   avoid COUNT(*) aggregations on the gallery hot path. These are updated by
 *   Inngest background jobs, not inline with mutations, so they may lag by a
 *   few seconds. Acceptable for social counters.
 *
 * - diagram_versions stores explicit save points (not every keystroke). The
 *   client-side undo/redo stack lives in IndexedDB via Zustand + zundo.
 *   Server-side versions are created on explicit "Save" actions and before
 *   destructive operations (fork, template apply).
 *
 * - tags use a TEXT[] (PostgreSQL array) with a GIN index. This is simpler than
 *   a join table for a modest tag vocabulary (<1000 unique tags) and supports
 *   efficient @> (contains) and && (overlaps) queries.
 *
 * Size estimates for content JSONB:
 *   10-node diagram:  ~5-10 KB
 *   30-node diagram:  ~15-30 KB
 *   50-node diagram:  ~30-60 KB
 *   100-node diagram: ~80-120 KB
 *   200-node diagram: ~150-250 KB (practical upper bound for usability)
 *
 * Expected scale:
 * - Year 1: ~500K diagram rows, ~2M version rows.
 * - Growth: ~50K new diagrams/month at steady state.
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
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./users";
import { templates } from "./templates";
import { challenges } from "./challenges";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const diagramVisibilityEnum = pgEnum("diagram_visibility", [
  "private", // only the owner
  "unlisted", // anyone with the link
  "public", // listed in gallery, searchable
]);

export const diagramTypeEnum = pgEnum("diagram_type", [
  "system-design",
  "class-diagram",
  "sequence-diagram",
  "er-diagram",
  "flowchart",
  "network-topology",
  "data-flow",
  "algorithm-viz",
  "custom",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * React Flow serialized state from toObject().
 * Stored as JSONB for atomic reads with metadata.
 */
export type DiagramContent = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    type?: string;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }>;
  viewport: { x: number; y: number; zoom: number };
};

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

export const diagrams = pgTable(
  "diagrams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Metadata
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    visibility: diagramVisibilityEnum("visibility")
      .notNull()
      .default("private"),
    diagramType: diagramTypeEnum("diagram_type").default("system-design"),

    // Diagram content: React Flow serialized state (JSONB)
    content: jsonb("content").$type<DiagramContent>().notNull(),

    // Lightweight thumbnail for gallery/list views (Cloudflare R2 URL)
    thumbnailUrl: text("thumbnail_url"),

    // Tags for filtering and search
    tags: text("tags").array(),

    // Provenance tracking
    templateId: uuid("template_id").references(() => templates.id, {
      onDelete: "set null",
    }),
    challengeId: uuid("challenge_id").references(() => challenges.id, {
      onDelete: "set null",
    }),
    forkedFromId: uuid("forked_from_id"), // self-reference added via raw SQL

    // Denormalized social counters (updated by Inngest, not inline)
    viewCount: integer("view_count").notNull().default(0),
    upvoteCount: integer("upvote_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    forkCount: integer("fork_count").notNull().default(0),

    // Current version number (incremented on each explicit save)
    currentVersion: integer("current_version").notNull().default(1),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Dashboard: "my diagrams" sorted by recent
    userUpdatedIdx: index("diagrams_user_updated_idx").on(
      table.userId,
      table.updatedAt
    ),
    // Gallery: public diagrams sorted by popularity or recency
    visibilityCreatedIdx: index("diagrams_visibility_created_idx").on(
      table.visibility,
      table.createdAt
    ),
    // Gallery: public diagrams by upvotes (popular tab)
    visibilityUpvoteIdx: index("diagrams_visibility_upvote_idx").on(
      table.visibility,
      table.upvoteCount
    ),
    // Challenge submissions lookup
    challengeIdx: index("diagrams_challenge_id_idx").on(table.challengeId),
    // Template usage tracking
    templateIdx: index("diagrams_template_id_idx").on(table.templateId),
    // Tag-based filtering (GIN index for array contains/overlaps)
    tagsIdx: index("diagrams_tags_idx").using("gin", table.tags),
    // JSONB content search (find diagrams with specific node types)
    // e.g. WHERE content @> '{"nodes": [{"type": "load-balancer"}]}'
    contentGinIdx: index("diagrams_content_gin_idx").using(
      "gin",
      sql`content jsonb_path_ops`
    ),
  })
);

/**
 * Explicit save-point versions. NOT every keystroke -- client undo/redo
 * is handled by Zustand + zundo in IndexedDB. Server versions are created:
 * 1. On explicit "Save" / Cmd+S
 * 2. Before destructive operations (fork, template overlay)
 * 3. On collaboration session end (merge point)
 * 4. Auto-save every 5 minutes of active editing
 */
export const diagramVersions = pgTable(
  "diagram_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    content: jsonb("content").$type<DiagramContent>().notNull(),
    // Human-readable label: "Added load balancer", "Before fork", etc.
    message: varchar("message", { length: 200 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    diagramVersionUnique: uniqueIndex("diagram_version_unique_idx").on(
      table.diagramId,
      table.versionNumber
    ),
  })
);
