"use client";

import { useMemo } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { useInterviewStore } from "@/stores/interview-store";
import { STAGE_ORDER, type DrillStage } from "@/lib/lld/drill-stages";
import { buildTimingHeatmap, type TimingHeatmap } from "@/lib/lld/drill-timing";

export function useDrillTimingHeatmap(): TimingHeatmap | null {
  const stageDurationsMs = useDrillStore((s) => s.stageDurationsMs);
  const activeDrill = useInterviewStore((s) => s.activeDrill);
  const totalBudgetMs = activeDrill?.durationLimitMs ?? 0;

  return useMemo(() => {
    if (totalBudgetMs === 0) return null;
    const actual = STAGE_ORDER.reduce(
      (acc, stage) => {
        acc[stage] = stageDurationsMs[stage] ?? 0;
        return acc;
      },
      {} as Record<DrillStage, number>,
    );
    return buildTimingHeatmap(actual, totalBudgetMs);
  }, [stageDurationsMs, totalBudgetMs]);
}
