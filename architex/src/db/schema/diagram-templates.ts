/**
 * DB-013: Diagram templates — Mermaid DSL + parsed UML JSON.
 *
 * Stores UML diagrams as both Mermaid source code (AI-editable, human-readable)
 * and parsed JSON (classes[], relationships[] for canvas rendering).
 * Each template is linked to a parent content item (pattern, problem, SOLID demo).
 */

import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  text,
  boolean,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

export const diagramTemplates = pgTable(
  "diagram_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Module: 'lld', etc. */
    moduleId: varchar("module_id", { length: 50 }).notNull(),
    /** Parent content type: 'pattern', 'problem', 'solid-demo'. */
    parentType: varchar("parent_type", { length: 50 }).notNull(),
    /** Parent content slug: 'builder', 'parking-lot', 'solid-srp'. */
    parentSlug: varchar("parent_slug", { length: 200 }).notNull(),
    /** Mermaid classDiagram source code — the DSL representation. */
    mermaidCode: text("mermaid_code").notNull(),
    /** Parsed UML classes with positions — ready for canvas rendering. */
    classes: jsonb("classes").notNull().default([]),
    /** Parsed UML relationships — ready for canvas rendering. */
    relationships: jsonb("relationships").notNull().default([]),
    /** Whether this diagram has been human-reviewed for quality. */
    isCurated: boolean("is_curated").notNull().default(false),
    /** Layout algorithm used: 'grid', 'dagre', 'manual'. */
    layoutAlgo: varchar("layout_algo", { length: 20 }).default("grid"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("diagram_templates_unique_idx").on(
      table.moduleId,
      table.parentType,
      table.parentSlug,
    ),
    index("diagram_templates_parent_idx").on(
      table.moduleId,
      table.parentType,
    ),
  ],
);

export type DiagramTemplate = InferSelectModel<typeof diagramTemplates>;
export type NewDiagramTemplate = InferInsertModel<typeof diagramTemplates>;
