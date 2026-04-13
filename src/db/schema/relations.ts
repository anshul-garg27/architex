/**
 * =============================================================================
 * DRIZZLE RELATIONS (for relational query builder)
 * =============================================================================
 *
 * Drizzle's relational query builder (db.query.users.findMany({ with: {...} }))
 * requires explicit relation definitions. These do NOT create foreign keys --
 * the FKs are defined in the table schemas. These purely enable the type-safe
 * relational query API.
 */

import { relations } from "drizzle-orm";
import { users } from "./users";
import { diagrams, diagramVersions } from "./diagrams";
import { templates } from "./templates";
import {
  challenges,
  challengeRubrics,
  challengeConcepts,
  challengeAttempts,
} from "./challenges";
import { concepts, progress, reviewEvents } from "./progress";
import { achievements, achievementsUsers } from "./achievements";
import { comments, upvotes } from "./community";
import { collabSessions, collabParticipants } from "./collaboration";
import { notifications } from "./notifications";
import { activityEvents } from "./activity";

// ---------------------------------------------------------------------------
// User relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  diagrams: many(diagrams),
  progress: many(progress),
  achievementsUsers: many(achievementsUsers),
  challengeAttempts: many(challengeAttempts),
  comments: many(comments),
  upvotes: many(upvotes),
  notifications: many(notifications),
  activityEvents: many(activityEvents),
  reviewEvents: many(reviewEvents),
  hostedSessions: many(collabSessions),
}));

// ---------------------------------------------------------------------------
// Diagram relations
// ---------------------------------------------------------------------------
export const diagramsRelations = relations(diagrams, ({ one, many }) => ({
  user: one(users, {
    fields: [diagrams.userId],
    references: [users.id],
  }),
  template: one(templates, {
    fields: [diagrams.templateId],
    references: [templates.id],
  }),
  challenge: one(challenges, {
    fields: [diagrams.challengeId],
    references: [challenges.id],
  }),
  forkedFrom: one(diagrams, {
    fields: [diagrams.forkedFromId],
    references: [diagrams.id],
    relationName: "forks",
  }),
  forks: many(diagrams, { relationName: "forks" }),
  versions: many(diagramVersions),
  comments: many(comments),
  upvotes: many(upvotes),
  collabSessions: many(collabSessions),
}));

export const diagramVersionsRelations = relations(
  diagramVersions,
  ({ one }) => ({
    diagram: one(diagrams, {
      fields: [diagramVersions.diagramId],
      references: [diagrams.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Template relations
// ---------------------------------------------------------------------------
export const templatesRelations = relations(templates, ({ many }) => ({
  diagrams: many(diagrams),
}));

// ---------------------------------------------------------------------------
// Challenge relations
// ---------------------------------------------------------------------------
export const challengesRelations = relations(challenges, ({ many }) => ({
  rubrics: many(challengeRubrics),
  challengeConcepts: many(challengeConcepts),
  attempts: many(challengeAttempts),
  diagrams: many(diagrams),
}));

export const challengeRubricsRelations = relations(
  challengeRubrics,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeRubrics.challengeId],
      references: [challenges.id],
    }),
  })
);

export const challengeConceptsRelations = relations(
  challengeConcepts,
  ({ one }) => ({
    challenge: one(challenges, {
      fields: [challengeConcepts.challengeId],
      references: [challenges.id],
    }),
    concept: one(concepts, {
      fields: [challengeConcepts.conceptId],
      references: [concepts.id],
    }),
  })
);

export const challengeAttemptsRelations = relations(
  challengeAttempts,
  ({ one }) => ({
    user: one(users, {
      fields: [challengeAttempts.userId],
      references: [users.id],
    }),
    challenge: one(challenges, {
      fields: [challengeAttempts.challengeId],
      references: [challenges.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Concept & Progress relations
// ---------------------------------------------------------------------------
export const conceptsRelations = relations(concepts, ({ many }) => ({
  progress: many(progress),
  challengeConcepts: many(challengeConcepts),
  reviewEvents: many(reviewEvents),
}));

export const progressRelations = relations(progress, ({ one }) => ({
  user: one(users, {
    fields: [progress.userId],
    references: [users.id],
  }),
  concept: one(concepts, {
    fields: [progress.conceptId],
    references: [concepts.id],
  }),
}));

export const reviewEventsRelations = relations(reviewEvents, ({ one }) => ({
  user: one(users, {
    fields: [reviewEvents.userId],
    references: [users.id],
  }),
  concept: one(concepts, {
    fields: [reviewEvents.conceptId],
    references: [concepts.id],
  }),
}));

// ---------------------------------------------------------------------------
// Achievement relations
// ---------------------------------------------------------------------------
export const achievementsRelations = relations(achievements, ({ many }) => ({
  achievementsUsers: many(achievementsUsers),
}));

export const achievementsUsersRelations = relations(
  achievementsUsers,
  ({ one }) => ({
    user: one(users, {
      fields: [achievementsUsers.userId],
      references: [users.id],
    }),
    achievement: one(achievements, {
      fields: [achievementsUsers.achievementId],
      references: [achievements.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Community relations
// ---------------------------------------------------------------------------
export const commentsRelations = relations(comments, ({ one, many }) => ({
  diagram: one(diagrams, {
    fields: [comments.diagramId],
    references: [diagrams.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "thread",
  }),
  replies: many(comments, { relationName: "thread" }),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  user: one(users, {
    fields: [upvotes.userId],
    references: [users.id],
  }),
  diagram: one(diagrams, {
    fields: [upvotes.diagramId],
    references: [diagrams.id],
  }),
}));

// ---------------------------------------------------------------------------
// Collaboration relations
// ---------------------------------------------------------------------------
export const collabSessionsRelations = relations(
  collabSessions,
  ({ one, many }) => ({
    diagram: one(diagrams, {
      fields: [collabSessions.diagramId],
      references: [diagrams.id],
    }),
    host: one(users, {
      fields: [collabSessions.hostUserId],
      references: [users.id],
    }),
    participants: many(collabParticipants),
  })
);

export const collabParticipantsRelations = relations(
  collabParticipants,
  ({ one }) => ({
    session: one(collabSessions, {
      fields: [collabParticipants.sessionId],
      references: [collabSessions.id],
    }),
    user: one(users, {
      fields: [collabParticipants.userId],
      references: [users.id],
    }),
  })
);

// ---------------------------------------------------------------------------
// Notification relations
// ---------------------------------------------------------------------------
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorUserId],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Activity event relations
// ---------------------------------------------------------------------------
export const activityEventsRelations = relations(
  activityEvents,
  ({ one }) => ({
    user: one(users, {
      fields: [activityEvents.userId],
      references: [users.id],
    }),
    diagram: one(diagrams, {
      fields: [activityEvents.diagramId],
      references: [diagrams.id],
    }),
    challenge: one(challenges, {
      fields: [activityEvents.challengeId],
      references: [challenges.id],
    }),
    concept: one(concepts, {
      fields: [activityEvents.conceptId],
      references: [concepts.id],
    }),
    achievement: one(achievements, {
      fields: [activityEvents.achievementId],
      references: [achievements.id],
    }),
  })
);
