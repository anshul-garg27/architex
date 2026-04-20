/**
 * Typed lesson payload — compiled from MDX at build time, stored as JSONB
 * on module_content rows, consumed at render time by the 8 section
 * components.
 *
 * The 8 sections match Phase 2 scope (spec §6 Learn mode, extended):
 *   1. Itch         — concrete problem scenario that makes the pattern
 *                     feel necessary
 *   2. Definition   — one-paragraph precise definition + canonical UML
 *   3. Mechanism    — step-by-step how it works (sequence of events)
 *   4. Anatomy      — class-by-class breakdown with role + responsibility
 *   5. Numbers      — performance, memory, latency figures (Big-O + real-
 *                     world numbers from production systems)
 *   6. Uses         — 3-5 real-world case studies
 *   7. Failure Modes— anti-patterns and ways this goes wrong
 *   8. Checkpoints  — 4 checkpoints (recall/apply/compare/create)
 */

/** Section identifier used across DB rows, URLs, and UI state. */
export type LessonSectionId =
  | "itch"
  | "definition"
  | "mechanism"
  | "anatomy"
  | "numbers"
  | "uses"
  | "failure_modes"
  | "checkpoints";

/** Anchor inside a section — stable across content edits. */
export interface LessonAnchor {
  id: string; // stable slug
  label: string; // heading text
  depth: 2 | 3; // h2 or h3 within the section
}

/** Serialized MDX: the pre-compiled JSX string + imports list. */
export interface CompiledMDX {
  /** JSX function body, no imports — loaded client-side via useMDXComponent. */
  code: string;
  /** Raw markdown snippet for AI explain-inline context. */
  raw: string;
  /** Headings extracted at compile time. */
  anchors: LessonAnchor[];
  /** Concept ids referenced in this section (for cross-link dimming). */
  conceptIds: string[];
  /** Class ids referenced (drives scroll-sync canvas highlight). */
  classIds: string[];
}

export interface ItchSectionPayload extends CompiledMDX {
  /** One-line "problem statement" shown in the section header card. */
  scenario?: string;
  /** Keywords for search / cross-linking. */
  keywords?: string[];
}

export interface DefinitionSectionPayload extends CompiledMDX {
  /** ≤200-char precise definition. */
  oneLiner?: string;
  /** GoF or modern canonical citation (book, paper, post). */
  canonicalSource?: string;
}

export interface MechanismSectionPayload extends CompiledMDX {
  /** Ordered list of mechanism steps — used by the step-by-step viewer. */
  steps?: Array<{ index: number; title: string; markdown: string }>;
}

export interface AnatomySectionPayload extends CompiledMDX {
  /** Per-class role + responsibility breakdown. */
  classes?: Array<{
    classId: string; // matches pattern.classes[].id
    role: string; // e.g. "Creator"
    responsibility: string; // one-line
    keyMethod?: string; // flagship method name
  }>;
}

export interface NumbersSectionPayload extends CompiledMDX {
  /** Flagship numbers shown as a banner. */
  headline?: Array<{ label: string; value: string; unit?: string }>;
}

export interface UsesSectionPayload extends CompiledMDX {
  /** Case studies — renders as cards. */
  cases?: Array<{
    company: string;
    system: string;
    whyThisPattern: string;
    sourceUrl?: string;
  }>;
}

export interface FailureModesSectionPayload extends CompiledMDX {
  /** Anti-patterns and war stories. */
  modes?: Array<{
    title: string;
    whatGoesWrong: string;
    howToAvoid: string;
    severity: "low" | "medium" | "high";
  }>;
}

export type CheckpointKind = "recall" | "apply" | "compare" | "create";

export interface RecallCheckpoint {
  kind: "recall";
  id: string;
  prompt: string;
  options: Array<{
    id: string;
    label: string;
    isCorrect: boolean;
    whyWrong?: string; // shown on first wrong attempt (Q3 progressive reveal)
  }>;
  explanation: string; // shown when revealed or correct
}

export interface ApplyCheckpoint {
  kind: "apply";
  id: string;
  /** Scenario the learner must apply the pattern to. */
  scenario: string;
  /** Correct class ids the user must select. */
  correctClassIds: string[];
  /** Distractors (classes present on canvas but not part of the pattern here). */
  distractorClassIds: string[];
  explanation: string;
}

export interface CompareCheckpoint {
  kind: "compare";
  id: string;
  prompt: string;
  /** Two patterns being compared. */
  left: { patternSlug: string; label: string };
  right: { patternSlug: string; label: string };
  /** Statements user must categorize as "left" / "right" / "both". */
  statements: Array<{
    id: string;
    text: string;
    correct: "left" | "right" | "both";
  }>;
  explanation: string;
}

export interface CreateCheckpoint {
  kind: "create";
  id: string;
  prompt: string;
  /** Skeleton the user fills in. */
  starterCanvas: {
    classes: Array<{ id: string; name: string; methods: string[] }>;
  };
  /** Grading rubric — pass criteria. */
  rubric: Array<{ criterion: string; points: number }>;
  /** Reference solution (reveal after submit). */
  referenceSolution: { classes: Array<{ id: string; name: string }> };
  explanation: string;
}

export type Checkpoint =
  | RecallCheckpoint
  | ApplyCheckpoint
  | CompareCheckpoint
  | CreateCheckpoint;

export interface CheckpointsSectionPayload extends CompiledMDX {
  /** Exactly 4 checkpoints — one per kind, order fixed. */
  checkpoints: [
    RecallCheckpoint,
    ApplyCheckpoint,
    CompareCheckpoint,
    CreateCheckpoint,
  ];
}

/** The full lesson payload stored in module_content.content JSONB. */
export interface LessonPayload {
  schemaVersion: 1;
  /** Pattern slug — must match patterns.ts id. */
  patternSlug: string;
  /** Short lesson subtitle shown in sidebar. */
  subtitle: string;
  /** Estimated reading time (minutes). */
  estimatedMinutes: number;
  /** Concepts introduced by this lesson (top-level, in order). */
  conceptIds: string[];
  /** Sections — all 8 required. */
  sections: {
    itch: ItchSectionPayload;
    definition: DefinitionSectionPayload;
    mechanism: MechanismSectionPayload;
    anatomy: AnatomySectionPayload;
    numbers: NumbersSectionPayload;
    uses: UsesSectionPayload;
    failure_modes: FailureModesSectionPayload;
    checkpoints: CheckpointsSectionPayload;
  };
}

/** Authors' YAML schema for cross-linking. */
export interface ConceptYAML {
  pattern: string; // pattern slug
  concepts: Array<{
    id: string; // concept slug (kebab-case)
    label: string; // display name
    summary: string; // one-sentence elevator pitch
    relatedConcepts?: string[]; // other concept ids
    relatedPatterns?: string[]; // other pattern slugs
    /** Optional: which section(s) introduce this concept. */
    introducedIn?: LessonSectionId[];
  }>;
  /** Explicit "often confused with" targets for the Confused-With panel. */
  confusedWith?: Array<{ patternSlug: string; reason: string }>;
}

/** Canonical section order. */
export const LESSON_SECTION_ORDER: readonly LessonSectionId[] = [
  "itch",
  "definition",
  "mechanism",
  "anatomy",
  "numbers",
  "uses",
  "failure_modes",
  "checkpoints",
] as const;

/** Display labels for sections (user-facing). */
export const LESSON_SECTION_LABELS: Record<LessonSectionId, string> = {
  itch: "The Itch",
  definition: "Definition",
  mechanism: "Mechanism",
  anatomy: "Anatomy",
  numbers: "Numbers",
  uses: "Uses",
  failure_modes: "Failure Modes",
  checkpoints: "Checkpoints",
};
