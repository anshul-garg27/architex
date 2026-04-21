/**
 * LLD-022: Drill timing heatmap
 *
 * Given per-stage actual durations + total budget, classifies each stage
 * vs an ideal envelope (+/-30% of the recommended share).
 */

import { STAGE_ORDER, type DrillStage } from "@/lib/lld/drill-stages";

export type StageClassification = "under" | "ok" | "over";

/**
 * Recommended share of the total budget per stage. Rough guidance based
 * on how senior engineers actually spend a 30-min whiteboard loop:
 *
 *   clarify       ~12%  —  ~4 min of a 30-min session
 *   rubric         ~6%  —  1.5 min to lock scope
 *   canvas        ~55%  —  the bulk of the time
 *   walkthrough   ~20%  —  6 min explaining
 *   reflection     ~7%  —  2 min self-grade
 */
const IDEAL_SHARES: Record<DrillStage, number> = {
  clarify: 0.12,
  rubric: 0.06,
  canvas: 0.55,
  walkthrough: 0.2,
  reflection: 0.07,
};

export interface StageTiming {
  stage: DrillStage;
  actualMs: number;
  idealMs: number;
  deltaMs: number;
  /** (actual - ideal) / ideal — positive = over, negative = under */
  deltaRatio: number;
  classification: StageClassification;
}

export interface TimingHeatmap {
  totalBudgetMs: number;
  actualTotalMs: number;
  stages: StageTiming[];
  overall: "on-pace" | "slow-start" | "sketch-heavy" | "rushed-end";
}

export function idealStageDurations(
  totalBudgetMs: number,
): Record<DrillStage, number> {
  // Distribute using shares; round to ms; fix any rounding drift so the
  // sum equals totalBudgetMs exactly.
  const raw = {
    clarify: Math.round(totalBudgetMs * IDEAL_SHARES.clarify),
    rubric: Math.round(totalBudgetMs * IDEAL_SHARES.rubric),
    canvas: Math.round(totalBudgetMs * IDEAL_SHARES.canvas),
    walkthrough: Math.round(totalBudgetMs * IDEAL_SHARES.walkthrough),
    reflection: Math.round(totalBudgetMs * IDEAL_SHARES.reflection),
  };
  const sum =
    raw.clarify + raw.rubric + raw.canvas + raw.walkthrough + raw.reflection;
  // Drop the rounding drift into canvas (largest bucket).
  raw.canvas += totalBudgetMs - sum;
  return raw;
}

const OVER_THRESHOLD = 0.3; // +30%
const UNDER_THRESHOLD = -0.5; // -50% (people under-clarify more than over)

function classify(deltaRatio: number): StageClassification {
  if (deltaRatio > OVER_THRESHOLD) return "over";
  if (deltaRatio < UNDER_THRESHOLD) return "under";
  return "ok";
}

export function buildTimingHeatmap(
  actual: Record<DrillStage, number>,
  totalBudgetMs: number,
): TimingHeatmap {
  const ideal = idealStageDurations(totalBudgetMs);
  const stages: StageTiming[] = STAGE_ORDER.map((stage) => {
    const actualMs = actual[stage];
    const idealMs = ideal[stage];
    const deltaMs = actualMs - idealMs;
    const deltaRatio = idealMs > 0 ? deltaMs / idealMs : 0;
    return {
      stage,
      actualMs,
      idealMs,
      deltaMs,
      deltaRatio,
      classification: classify(deltaRatio),
    };
  });

  const actualTotalMs = stages.reduce((acc, s) => acc + s.actualMs, 0);

  // Overall classification — pick the dominant signal.
  const canvas = stages.find((s) => s.stage === "canvas")!;
  const clarify = stages.find((s) => s.stage === "clarify")!;
  const reflection = stages.find((s) => s.stage === "reflection")!;

  let overall: TimingHeatmap["overall"] = "on-pace";
  if (canvas.classification === "over" && reflection.classification === "under") {
    overall = "sketch-heavy";
  } else if (clarify.classification === "under" && canvas.actualMs > canvas.idealMs) {
    overall = "slow-start";
  } else if (
    reflection.classification === "under" &&
    actualTotalMs > 0.95 * totalBudgetMs
  ) {
    overall = "rushed-end";
  }

  return { totalBudgetMs, actualTotalMs, stages, overall };
}
