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
} from "./relations";
