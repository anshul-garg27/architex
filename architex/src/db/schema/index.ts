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
  lldBookmarks,
  type LLDBookmark,
  type NewLLDBookmark,
} from "./lld-bookmarks";
export {
  lldConceptReads,
  type LLDConceptRead,
  type NewLLDConceptRead,
} from "./lld-concept-reads";
export {
  lldDesigns,
  type LLDDesign,
  type NewLLDDesign,
} from "./lld-designs";
export {
  lldDesignSnapshots,
  type LLDDesignSnapshot,
  type NewLLDDesignSnapshot,
} from "./lld-design-snapshots";
export {
  lldTemplatesLibrary,
  type LLDTemplatesLibraryEntry,
  type NewLLDTemplatesLibraryEntry,
} from "./lld-templates-library";
export {
  lldDesignAnnotations,
  type LLDDesignAnnotation,
  type NewLLDDesignAnnotation,
} from "./lld-design-annotations";
export {
  lldDrillAttempts,
  type LLDDrillAttempt,
  type NewLLDDrillAttempt,
} from "./lld-drill-attempts";
export {
  lldLearnProgress,
  type LLDLearnProgress,
  type NewLLDLearnProgress,
  type LearnSectionId,
  type SectionState,
  type SectionProgressMap,
} from "./lld-learn-progress";
export {
  userPreferences,
  type UserPreferences,
  type NewUserPreferences,
} from "./user-preferences";

// Blueprint module tables
export {
  blueprintCourses,
  type BlueprintCourse,
  type NewBlueprintCourse,
} from "./blueprint-courses";
export {
  blueprintUnits,
  type BlueprintUnit,
  type NewBlueprintUnit,
  type BlueprintDifficulty,
  type BlueprintEntityRefs,
  type BlueprintSectionType,
  type BlueprintSectionRecipe,
  type BlueprintUnitRecipe,
} from "./blueprint-units";
export {
  blueprintUserProgress,
  type BlueprintUserProgress,
  type NewBlueprintUserProgress,
  type BlueprintUnitState,
  type BlueprintSectionCompletion,
  type BlueprintSectionStatesMap,
} from "./blueprint-user-progress";
export {
  blueprintJourneyState,
  type BlueprintJourneyState,
  type NewBlueprintJourneyState,
  type BlueprintPreferredLang,
  type BlueprintPinnedTool,
} from "./blueprint-journey-state";
export {
  blueprintEvents,
  type BlueprintEvent,
  type NewBlueprintEvent,
} from "./blueprint-events";

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
  lldBookmarksRelations,
  lldConceptReadsRelations,
  lldDesignsRelations,
  lldDesignSnapshotsRelations,
  lldDesignAnnotationsRelations,
  lldDrillAttemptsRelations,
  lldLearnProgressRelations,
  userPreferencesRelations,
  blueprintCoursesRelations,
  blueprintUnitsRelations,
  blueprintUserProgressRelations,
  blueprintJourneyStateRelations,
  blueprintEventsRelations,
} from "./relations";
