/**
 * LLD-020: Drill rubric — 6-axis scoring definitions + weighted total
 *
 * Axes & weights (sum = 1.0):
 *   clarification  10%
 *   classes        25%
 *   relationships  20%
 *   patternFit     20%
 *   tradeoffs      15%
 *   communication  10%
 */

export type RubricAxis =
  | "clarification"
  | "classes"
  | "relationships"
  | "patternFit"
  | "tradeoffs"
  | "communication";

export const RUBRIC_AXES: readonly RubricAxis[] = [
  "clarification",
  "classes",
  "relationships",
  "patternFit",
  "tradeoffs",
  "communication",
] as const;

export const AXIS_WEIGHTS: Record<RubricAxis, number> = {
  clarification: 0.1,
  classes: 0.25,
  relationships: 0.2,
  patternFit: 0.2,
  tradeoffs: 0.15,
  communication: 0.1,
};

const AXIS_LABELS: Record<RubricAxis, string> = {
  clarification: "Clarification",
  classes: "Classes",
  relationships: "Relationships",
  patternFit: "Pattern Fit",
  tradeoffs: "Tradeoffs",
  communication: "Communication",
};

export function axisLabel(axis: RubricAxis): string {
  return AXIS_LABELS[axis];
}

export interface RubricAxisResult {
  /** 0-100 inclusive. */
  score: number;
  /** Bullets the user did well on this axis. */
  good: string[];
  /** Bullets the user was expected to cover but didn't. */
  missing: string[];
  /** Bullets the user got wrong. */
  wrong: string[];
}

export type RubricBreakdown = Record<RubricAxis, RubricAxisResult>;

export function computeWeightedScore(breakdown: RubricBreakdown): number {
  const raw = RUBRIC_AXES.reduce(
    (acc, axis) => acc + breakdown[axis].score * AXIS_WEIGHTS[axis],
    0,
  );
  return Math.round(raw);
}

// ── Celebration bands (Q10 tiered reveal) ────────────────────────────

export interface RubricBand {
  key: "stellar" | "solid" | "coaching" | "redirect";
  label: string;
  min: number; // inclusive lower bound
  accent: string; // Tailwind color token
  /** Default copy for the grade reveal. Overridden by Claude feedback. */
  placeholder: string;
}

export const RUBRIC_BANDS: RubricBand[] = [
  {
    key: "stellar",
    label: "Stellar",
    min: 90,
    accent: "text-emerald-300",
    placeholder: "That was cleanly executed. Senior-level articulation.",
  },
  {
    key: "solid",
    label: "Solid",
    min: 70,
    accent: "text-sky-300",
    placeholder:
      "Strong design, a few tune-ups and you're interview-ready for this problem.",
  },
  {
    key: "coaching",
    label: "Coaching moment",
    min: 50,
    accent: "text-amber-300",
    placeholder:
      "The core idea is there. Let's walk through what to strengthen next.",
  },
  {
    key: "redirect",
    label: "Strategic redirect",
    min: 0,
    accent: "text-rose-300",
    placeholder:
      "This one's still cooking. We'll send you back to Learn for this pattern.",
  },
];

export function bandForScore(score: number): RubricBand {
  for (const band of RUBRIC_BANDS) {
    if (score >= band.min) return band;
  }
  return RUBRIC_BANDS[RUBRIC_BANDS.length - 1]!;
}
