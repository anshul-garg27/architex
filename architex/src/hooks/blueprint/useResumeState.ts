"use client";

import { useMemo } from "react";
import { useUnitList } from "./useUnitList";
import { useUnitProgressMap } from "./useUnitProgressMap";
import { useProgressSummary } from "./useProgressSummary";

export interface BlueprintResumeTarget {
  unitSlug: string;
  sectionId: string | null;
  unitTitle: string;
  unitOrdinal: number;
  completedSections: number;
  totalSections: number;
}

/**
 * Derives the "resume" target from progress data. Returns null if the
 * user has never touched any unit — the caller renders a "Start here"
 * card instead.
 *
 * Priority order:
 *   1. `currentUnitSlug` from the journey-state summary (if set and unit is "in_progress")
 *   2. Otherwise, the most recently updated in_progress unit
 *   3. Otherwise, null (fresh user)
 */
export function useResumeState(): {
  target: BlueprintResumeTarget | null;
  isLoading: boolean;
} {
  const units = useUnitList();
  const progress = useUnitProgressMap();
  const summary = useProgressSummary();

  const isLoading =
    units.isLoading || progress.isLoading || summary.isLoading;

  const target = useMemo<BlueprintResumeTarget | null>(() => {
    if (!units.data || !progress.data) return null;

    const unitsBySlug = new Map(units.data.map((u) => [u.slug, u]));

    // Priority 1: explicit currentUnitSlug from summary
    const currentSlug = summary.data?.currentUnitSlug ?? null;
    if (currentSlug) {
      const unit = unitsBySlug.get(currentSlug);
      const p = progress.data[currentSlug];
      if (unit && p && p.state === "in_progress") {
        return {
          unitSlug: unit.slug,
          sectionId: summary.data?.currentSectionId ?? null,
          unitTitle: unit.title,
          unitOrdinal: unit.ordinal,
          completedSections: p.completedSectionCount,
          totalSections: p.totalSections,
        };
      }
    }

    // Priority 2: most-recent in_progress
    const inProgress = Object.values(progress.data)
      .filter((p) => p.state === "in_progress" && p.lastSeenAt)
      .sort(
        (a, b) =>
          new Date(b.lastSeenAt ?? 0).getTime() -
          new Date(a.lastSeenAt ?? 0).getTime(),
      );

    if (inProgress[0]) {
      const unit = unitsBySlug.get(inProgress[0].unitSlug);
      if (unit) {
        return {
          unitSlug: unit.slug,
          sectionId: null,
          unitTitle: unit.title,
          unitOrdinal: unit.ordinal,
          completedSections: inProgress[0].completedSectionCount,
          totalSections: inProgress[0].totalSections,
        };
      }
    }

    return null;
  }, [units.data, progress.data, summary.data]);

  return { target, isLoading };
}
