"use client";

import { useQuery } from "@tanstack/react-query";
import type { BlueprintUnitState } from "@/db/schema";

export interface UnitProgressView {
  unitSlug: string;
  ordinal: number;
  state: BlueprintUnitState;
  completedSectionCount: number;
  totalSections: number;
  completedAt: string | null;
  masteredAt: string | null;
  lastSeenAt: string | null;
}

/**
 * Map of unitSlug → per-unit progress view. Drives the curriculum map's
 * card states and the progress dashboard's counts. 30-second cache.
 *
 * Returns an empty map for anonymous users (no error).
 */
export function useUnitProgressMap() {
  return useQuery({
    queryKey: ["blueprint", "progress", "units"],
    queryFn: async (): Promise<Record<string, UnitProgressView>> => {
      const res = await fetch("/api/blueprint/progress/units");
      if (res.status === 401) return {};
      if (!res.ok) {
        throw new Error(
          `/api/blueprint/progress/units failed: ${res.status}`,
        );
      }
      const data = (await res.json()) as { rows: UnitProgressView[] };
      const map: Record<string, UnitProgressView> = {};
      for (const row of data.rows) {
        map[row.unitSlug] = row;
      }
      return map;
    },
    staleTime: 30 * 1000,
  });
}
