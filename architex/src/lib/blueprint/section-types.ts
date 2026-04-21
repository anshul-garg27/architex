/**
 * Section type payload shapes carried in
 * `blueprint_units.recipe_json.sections[].params`.
 *
 * Author sources (YAML + MDX) compile into these shapes via
 * scripts/blueprint/compile-unit.ts.
 *
 * The section router (src/components/modules/blueprint/unit/SectionRouter.tsx)
 * narrows on `section.type` and passes the typed params to the
 * matching Section component.
 */

// ── Read ─────────────────────────────────────────────────────

export interface CompiledMDX {
  /** `@mdx-js/mdx` function-body output. */
  code: string;
  /** Original MDX source, for screen readers + AI selection. */
  raw: string;
}

export interface ReadSectionParams {
  compiled: CompiledMDX;
  estimatedSeconds: number;
}

// ── Interact widgets ─────────────────────────────────────────

export interface McqOption {
  id: string;
  label: string;
  /** Shown after an incorrect pick as progressive reveal. */
  whyWrong?: string;
}

export interface McqSingleWidget {
  kind: "mcq-single";
  prompt: string;
  options: McqOption[];
  correctId: string;
}

export interface McqMultiWidget {
  kind: "mcq-multi";
  prompt: string;
  options: McqOption[];
  correctIds: string[];
}

export interface FillBlank {
  id: string;
  /** Canonical answer. Comparison is case-insensitive, trimmed. */
  answer: string;
  /** Alternate accepted spellings. */
  alternatives?: string[];
}

export interface FillBlankWidget {
  kind: "fill-blank";
  /** Prompt with `{{id}}` markers substituted by input fields at render time. */
  prompt: string;
  blanks: FillBlank[];
}

export interface ClickTarget {
  id: string;
  label: string;
  correct: boolean;
  /** Anchor coordinates on a normalized 0..100 canvas. */
  x: number;
  y: number;
  /** Hit radius in normalized units. */
  r: number;
}

export interface ClickTargetWidget {
  kind: "click-target";
  prompt: string;
  /** Optional background image URL. If absent, the widget draws
   *  abstract shapes at the target coords. */
  imageSrc?: string;
  targets: ClickTarget[];
}

export type InteractWidget =
  | McqSingleWidget
  | McqMultiWidget
  | FillBlankWidget
  | ClickTargetWidget;

export interface InteractSectionParams {
  widget: InteractWidget;
}

// ── Retain ───────────────────────────────────────────────────

export interface RetainCard {
  id: string;
  front: string;
  back: string;
  entitySlug: string;
  entityType: "pattern" | "concept" | "problem";
}

export interface RetainSectionParams {
  /** Optional 2–3 sentence recap rendered above the cards (plain text). */
  recap?: string;
  cards: RetainCard[];
}

// ── Reflect ──────────────────────────────────────────────────

export interface ReflectSectionParams {
  prompt: string;
  placeholder?: string;
  minWords?: number;
}

// ── Apply (V1 minimal; SP4 integrates canvas) ────────────────

export type ApplyExercise =
  | "draw-classes"
  | "connect-classes"
  | "identify-pattern";

export interface ApplySectionParams {
  exercise: ApplyExercise;
  patternSlug?: string;
  starterClassesCount?: number;
  instructions: string;
}

// ── Practice (V1 minimal; SP5 integrates Problems Workspace) ─

export interface PracticeSectionParams {
  problemSlug: string;
  timerMinutes: number;
  reducedScope?: string;
}

// ── Checkpoint ───────────────────────────────────────────────

export interface CheckpointSectionParams {
  exercises: InteractWidget[];
  passThreshold: number;
}

// ── Union ────────────────────────────────────────────────────

export type SectionTypedParams =
  | { type: "read"; params: ReadSectionParams }
  | { type: "interact"; params: InteractSectionParams }
  | { type: "retain"; params: RetainSectionParams }
  | { type: "reflect"; params: ReflectSectionParams }
  | { type: "apply"; params: ApplySectionParams }
  | { type: "practice"; params: PracticeSectionParams }
  | { type: "checkpoint"; params: CheckpointSectionParams };
