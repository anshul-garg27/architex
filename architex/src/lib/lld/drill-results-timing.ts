/**
 * Pure timing adapter for the post-drill results screen.
 *
 * `useDrillTimingHeatmap` sources its time budget from
 * `interview-store.activeDrill`, but drill mode never writes that store
 * (dead wiring), so the hook returns null forever. This adapter bypasses
 * it: actual durations come from drill-store's `stageDurationsMs`, the
 * budget from the variant config.
 */

import { STAGE_ORDER, type DrillStage } from "@/lib/lld/drill-stages";
import {
  buildTimingHeatmap,
  type TimingHeatmap,
} from "@/lib/lld/drill-timing";
import { VARIANT_CONFIG, type DrillVariant } from "@/lib/lld/drill-variants";

export function buildResultsHeatmap(
  stageDurationsMs: Partial<Record<DrillStage, number>>,
  variant: DrillVariant,
  totalBudgetMs?: number,
): TimingHeatmap | null {
  const budget = totalBudgetMs ?? VARIANT_CONFIG[variant].defaultDurationMs;
  if (budget <= 0) return null;

  const actual = STAGE_ORDER.reduce(
    (acc, stage) => {
      acc[stage] = stageDurationsMs[stage] ?? 0;
      return acc;
    },
    {} as Record<DrillStage, number>,
  );
  return buildTimingHeatmap(actual, budget);
}
