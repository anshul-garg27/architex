/**
 * Drizzle ORM relations — defined in a single file to avoid circular imports.
 *
 * All table definitions are imported here; relation callbacks reference
 * sibling tables freely without risk of import cycles.
 */

import { relations } from "drizzle-orm";
import { users } from "./users";
import { diagrams } from "./diagrams";
import { simulationRuns } from "./simulations";
import { progress } from "./progress";
import { templates } from "./templates";
import { gallerySubmissions, galleryUpvotes } from "./gallery";
import { aiUsage } from "./ai-usage";
import { lldConceptReads } from "./lld-concept-reads";
import { lldDrillAttempts } from "./lld-drill-attempts";
import { lldLearnProgress } from "./lld-learn-progress";
import { userPreferences } from "./user-preferences";

// ── Users ──────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
  diagrams: many(diagrams),
  simulationRuns: many(simulationRuns),
  progress: many(progress),
  templates: many(templates),
  gallerySubmissions: many(gallerySubmissions),
  aiUsage: many(aiUsage),
  lldConceptReads: many(lldConceptReads),
  lldDrillAttempts: many(lldDrillAttempts),
  lldLearnProgress: many(lldLearnProgress),
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
}));

// ── Diagrams ───────────────────────────────────────────────────

export const diagramsRelations = relations(diagrams, ({ one, many }) => ({
  user: one(users, {
    fields: [diagrams.userId],
    references: [users.id],
  }),
  simulationRuns: many(simulationRuns),
  gallerySubmission: one(gallerySubmissions, {
    fields: [diagrams.id],
    references: [gallerySubmissions.diagramId],
  }),
}));

// ── Simulation Runs ────────────────────────────────────────────

export const simulationRunsRelations = relations(simulationRuns, ({ one }) => ({
  diagram: one(diagrams, {
    fields: [simulationRuns.diagramId],
    references: [diagrams.id],
  }),
  user: one(users, {
    fields: [simulationRuns.userId],
    references: [users.id],
  }),
}));

// ── Progress ───────────────────────────────────────────────────

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
}));

// ── Templates ──────────────────────────────────────────────────

export const templatesRelations = relations(templates, ({ one }) => ({
  author: one(users, {
    fields: [templates.authorId],
    references: [users.id],
  }),
}));

// ── Gallery ────────────────────────────────────────────────────

export const gallerySubmissionsRelations = relations(
  gallerySubmissions,
  ({ one, many }) => ({
    diagram: one(diagrams, {
      fields: [gallerySubmissions.diagramId],
      references: [diagrams.id],
    }),
    author: one(users, {
      fields: [gallerySubmissions.authorId],
      references: [users.id],
    }),
    upvoteRecords: many(galleryUpvotes),
  }),
);

export const galleryUpvotesRelations = relations(galleryUpvotes, ({ one }) => ({
  submission: one(gallerySubmissions, {
    fields: [galleryUpvotes.submissionId],
    references: [gallerySubmissions.id],
  }),
  user: one(users, {
    fields: [galleryUpvotes.userId],
    references: [users.id],
  }),
}));

// ── AI Usage ───────────────────────────────────────────────────

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

// ── LLD Drill Attempts ─────────────────────────────────────────

export const lldDrillAttemptsRelations = relations(
  lldDrillAttempts,
  ({ one }) => ({
    user: one(users, {
      fields: [lldDrillAttempts.userId],
      references: [users.id],
    }),
  }),
);

// ── User Preferences ──────────────────────────────────────────

export const userPreferencesRelations = relations(
  userPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [userPreferences.userId],
      references: [users.id],
    }),
  }),
);

// ── LLD Learn Progress ────────────────────────────────────────

export const lldLearnProgressRelations = relations(
  lldLearnProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [lldLearnProgress.userId],
      references: [users.id],
    }),
  }),
);

// ── LLD Concept Reads ─────────────────────────────────────────

export const lldConceptReadsRelations = relations(
  lldConceptReads,
  ({ one }) => ({
    user: one(users, {
      fields: [lldConceptReads.userId],
      references: [users.id],
    }),
  }),
);
