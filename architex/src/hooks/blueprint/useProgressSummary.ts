"use client";

import { useQuery } from "@tanstack/react-query";

export interface BlueprintProgressSummary {
  streakDays: number;
  currentUnitSlug: string | null;
  currentSectionId: string | null;
  unitsCompleted: number;
  unitsMastered: number;
  unitsInProgress: number;
  totalTimeMs: number;
}

const DEFAULTS: BlueprintProgressSummary = {
  streakDays: 0,
  currentUnitSlug: null,
  currentSectionId: null,
  unitsCompleted: 0,
  unitsMastered: 0,
  unitsInProgress: 0,
  totalTimeMs: 0,
};

/**
 * Per-user aggregate progress. 30-second staleTime — streak and counts
 * can shift often as the user completes sections.
 *
 * Authenticated users only; anonymous users get the defaults (no error).
 */
export function useProgressSummary() {
  return useQuery({
    queryKey: ["blueprint", "progress", "summary"],
    queryFn: async (): Promise<BlueprintProgressSummary> => {
      const res = await fetch("/api/blueprint/progress/summary");
      if (res.status === 401) {
        return DEFAULTS;
      }
      if (!res.ok) {
        throw new Error(
          `/api/blueprint/progress/summary failed: ${res.status}`,
        );
      }
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}
