/**
 * DB-003: Simulation runs table
 *
 * Persists simulation execution results tied to diagrams.
 */

import {
  pgTable,
  timestamp,
  uuid,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { diagrams } from "./diagrams";
import { users } from "./users";

export const simulationRuns = pgTable(
  "simulation_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    diagramId: uuid("diagram_id")
      .notNull()
      .references(() => diagrams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Simulation configuration (traffic pattern, chaos settings, etc.). */
    config: jsonb("config").notNull().default({}),
    /** Final simulation report / aggregated metrics. */
    results: jsonb("results"),
    /** Number of ticks executed. */
    tickCount: integer("tick_count"),
    /** Wall-clock duration in milliseconds. */
    duration: integer("duration"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("simulation_runs_diagram_id_idx").on(table.diagramId),
    index("simulation_runs_user_id_idx").on(table.userId),
  ],
);

export type SimulationRun = InferSelectModel<typeof simulationRuns>;
export type NewSimulationRun = InferInsertModel<typeof simulationRuns>;
