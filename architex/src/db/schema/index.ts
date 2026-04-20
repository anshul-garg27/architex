/**
 * Barrel export for all database schema tables and relations.
 */

export { users, type User, type NewUser } from "./users";
export { diagrams, type Diagram, type NewDiagram } from "./diagrams";
export {
  simulationRuns,
  type SimulationRun,
  type NewSimulationRun,
} from "./simulations";
export { progress, type Progress, type NewProgress } from "./progress";
export { templates, type Template, type NewTemplate } from "./templates";
export {
  gallerySubmissions,
  galleryUpvotes,
  type GallerySubmission,
  type NewGallerySubmission,
  type GalleryUpvote,
  type NewGalleryUpvote,
} from "./gallery";
export { aiUsage, type AiUsage, type NewAiUsage } from "./ai-usage";
export {
  moduleContent,
  type ModuleContent,
  type NewModuleContent,
} from "./module-content";
export {
  achievements,
  userAchievements,
  type Achievement,
  type NewAchievement,
  type UserAchievement,
  type NewUserAchievement,
} from "./achievements";
export {
  activityEvents,
  type ActivityEvent,
  type NewActivityEvent,
} from "./activity";
export {
  quizQuestions,
  type QuizQuestion,
  type NewQuizQuestion,
} from "./quiz-questions";
export {
  diagramTemplates,
  type DiagramTemplate,
  type NewDiagramTemplate,
} from "./diagram-templates";
export {
  lldDrillAttempts,
  type LLDDrillAttempt,
  type NewLLDDrillAttempt,
} from "./lld-drill-attempts";
export {
  userPreferences,
  type UserPreferences,
  type NewUserPreferences,
} from "./user-preferences";

// Relations (defined in a single file to avoid circular imports)
export {
  usersRelations,
  diagramsRelations,
  simulationRunsRelations,
  progressRelations,
  templatesRelations,
  gallerySubmissionsRelations,
  galleryUpvotesRelations,
  aiUsageRelations,
  lldDrillAttemptsRelations,
  userPreferencesRelations,
} from "./relations";
