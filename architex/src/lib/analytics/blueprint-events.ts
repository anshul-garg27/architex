/**
 * Typed event builders for the Blueprint module.
 *
 * Every Blueprint event captured by PostHog or written to
 * `blueprint_events` flows through one of these builders. Adding
 * a new event is a deliberate act: bump the taxonomy here, update
 * the test, update the vision-spec §15 if user-facing.
 *
 * Taxonomy locked in: docs/superpowers/specs/2026-04-21-blueprint-module-vision.md §15.1
 */

export type BlueprintSurface = "journey" | "toolkit" | "progress";
export type BlueprintToolkitTool = "patterns" | "problems" | "review";
export type BlueprintUnitEntry =
  | "map"
  | "resume"
  | "deeplink"
  | "next"
  | "search";
export type BlueprintSectionType =
  | "read"
  | "interact"
  | "apply"
  | "practice"
  | "retain"
  | "reflect"
  | "checkpoint";
export type BlueprintAttention =
  | "calm"
  | "mild"
  | "frustrated"
  | "very_frustrated";
export type BlueprintGrade = "excellent" | "good" | "coaching" | "redirect";
export type BlueprintSubMode = "interview" | "guided" | "speed";
export type BlueprintFsrsRating = "again" | "hard" | "good" | "easy";
export type BlueprintAiSurface =
  | "checkpoint_failure"
  | "section_end"
  | "confused_with";

export interface BlueprintEvent<TPayload> {
  name: string;
  payload: TPayload;
}

// ── Journey events ──────────────────────────────────────

export const blueprintModuleOpened = (p: {
  entrySurface: BlueprintSurface;
  from?: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.module_opened",
  payload: p,
});

export const blueprintWelcomeShown = (): BlueprintEvent<
  Record<string, never>
> => ({
  name: "blueprint.welcome_shown",
  payload: {},
});

export const blueprintWelcomeDismissed = (p: {
  action: "start_course" | "drill_problem" | "browse_patterns" | "close";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.welcome_dismissed",
  payload: p,
});

export const blueprintResumeClicked = (p: {
  unitSlug: string;
  sectionId: string | null;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.resume_clicked",
  payload: p,
});

export const blueprintUnitOpened = (p: {
  unitSlug: string;
  entry: BlueprintUnitEntry;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_opened",
  payload: p,
});

export const blueprintUnitCompleted = (p: {
  unitSlug: string;
  totalTimeMs: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_completed",
  payload: p,
});

export const blueprintUnitMastered = (p: {
  unitSlug: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.unit_mastered",
  payload: p,
});

export const blueprintSectionOpened = (p: {
  unitSlug: string;
  sectionId: string;
  sectionType: BlueprintSectionType;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.section_opened",
  payload: p,
});

export const blueprintSectionCompleted = (p: {
  unitSlug: string;
  sectionId: string;
  sectionType: BlueprintSectionType;
  timeMs: number;
  score?: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.section_completed",
  payload: p,
});

export const blueprintCheckpointStarted = (p: {
  unitSlug: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.checkpoint_started",
  payload: p,
});

export const blueprintCheckpointPassed = (p: {
  unitSlug: string;
  score: number;
  attempts: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.checkpoint_passed",
  payload: p,
});

// ── Toolkit events ──────────────────────────────────────

export const blueprintToolkitOpened = (p: {
  from: BlueprintSurface;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.toolkit_opened",
  payload: p,
});

export const blueprintToolPinned = (p: {
  tool: BlueprintToolkitTool | null;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.tool_pinned",
  payload: p,
});

export const blueprintPatternViewed = (p: {
  patternSlug: string;
  source: "library" | "unit" | "compare" | "review";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.pattern_viewed",
  payload: p,
});

export const blueprintProblemDrillStarted = (p: {
  problemSlug: string;
  subMode: BlueprintSubMode;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.problem_drill_started",
  payload: p,
});

export const blueprintProblemDrillSubmitted = (p: {
  problemSlug: string;
  subMode: BlueprintSubMode;
  score: number;
  grade: BlueprintGrade;
  timeMs: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.problem_drill_submitted",
  payload: p,
});

export const blueprintReviewSessionStarted = (p: {
  dueCount: number;
  target: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.review_session_started",
  payload: p,
});

export const blueprintReviewSessionCompleted = (p: {
  cardsReviewed: number;
  streakDays: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.review_session_completed",
  payload: p,
});

export const blueprintFlashcardRated = (p: {
  cardId: string;
  rating: BlueprintFsrsRating;
  entitySlug: string;
  entityType: "pattern" | "problem";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.flashcard_rated",
  payload: p,
});

// ── Cross-cutting events ────────────────────────────────

export const blueprintSearchPerformed = (p: {
  surface: BlueprintSurface;
  query: string;
  resultsCount: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.search_performed",
  payload: p,
});

export const blueprintAiSurfaceTriggered = (p: {
  surface: BlueprintAiSurface;
  entitySlug?: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.ai_surface_triggered",
  payload: p,
});

export const blueprintAiRequestSent = (p: {
  surface: BlueprintAiSurface;
  promptLength: number;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.ai_request_sent",
  payload: p,
});

export const blueprintFrustrationDetected = (p: {
  level: BlueprintAttention;
  unitSlug: string;
  sectionId: string;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.frustration_detected",
  payload: p,
});

export const blueprintErrorShown = (p: {
  code: string;
  surface: BlueprintSurface;
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.error_shown",
  payload: p,
});

export const blueprintStreakUpdated = (p: {
  streakDays: number;
  source: "review_session" | "daily_bonus";
}): BlueprintEvent<typeof p> => ({
  name: "blueprint.streak_updated",
  payload: p,
});
