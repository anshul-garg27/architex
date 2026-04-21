"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  BlueprintDifficulty,
  BlueprintEntityRefs,
} from "@/db/schema";

export interface BlueprintUnitListEntry {
  id: string;
  slug: string;
  ordinal: number;
  title: string;
  summary: string | null;
  durationMinutes: number;
  difficulty: BlueprintDifficulty;
  prereqUnitSlugs: string[];
  tags: string[];
  entityRefs: BlueprintEntityRefs;
}

/**
 * Fetches the full published unit list from the API. Cached for an
 * hour — the curriculum is effectively static.
 */
export function useUnitList() {
  return useQuery({
    queryKey: ["blueprint", "units"],
    queryFn: async (): Promise<BlueprintUnitListEntry[]> => {
      const res = await fetch("/api/blueprint/units");
      if (!res.ok) {
        throw new Error(`/api/blueprint/units failed: ${res.status}`);
      }
      const data = (await res.json()) as { units: BlueprintUnitListEntry[] };
      return data.units;
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
}
