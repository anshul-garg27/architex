"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  BlueprintUnitState,
  BlueprintEntityRefs,
  BlueprintDifficulty,
} from "@/db/schema";
import type { SectionTypedParams } from "@/lib/blueprint/section-types";

export interface BlueprintUnitSectionPayload {
  id: string;
  type: SectionTypedParams["type"];
  title: string;
  params: SectionTypedParams["params"];
}

export interface BlueprintUnitPayload {
  id: string;
  slug: string;
  ordinal: number;
  title: string;
  summary: string | null;
  durationMinutes: number;
  difficulty: BlueprintDifficulty;
  tags: string[];
  entityRefs: BlueprintEntityRefs;
  recipeJson: {
    version: number;
    sections: BlueprintUnitSectionPayload[];
  };
}

export interface UnitProgressPayload {
  unitSlug: string;
  state: BlueprintUnitState;
  sectionStates: Record<
    string,
    {
      startedAt: number | null;
      completedAt: number | null;
      attempts: number;
      score: number | null;
    }
  >;
  lastPosition: string | null;
  totalTimeMs: number;
  completedAt: string | null;
  masteredAt: string | null;
}

/**
 * Load a full unit record from /api/blueprint/units/[slug]. The
 * recipeJson typing is trusted — the compile pipeline guarantees the
 * shape.
 */
export function useUnit(slug: string | null) {
  return useQuery({
    queryKey: ["blueprint", "unit", slug],
    queryFn: async (): Promise<BlueprintUnitPayload | null> => {
      if (!slug) return null;
      const res = await fetch(`/api/blueprint/units/${slug}`);
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(`/api/blueprint/units/${slug} failed: ${res.status}`);
      }
      return res.json();
    },
    enabled: Boolean(slug),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Load the current user's progress for a unit.
 * Returns defaults for anonymous users (401 maps to {}).
 */
export function useUnitProgressData(slug: string | null) {
  return useQuery({
    queryKey: ["blueprint", "unit", slug, "progress"],
    queryFn: async (): Promise<UnitProgressPayload | null> => {
      if (!slug) return null;
      const res = await fetch(`/api/blueprint/units/${slug}/progress`);
      if (res.status === 401) return null;
      if (res.status === 404) return null;
      if (!res.ok) {
        throw new Error(
          `/api/blueprint/units/${slug}/progress failed: ${res.status}`,
        );
      }
      return res.json();
    },
    enabled: Boolean(slug),
    staleTime: 10 * 1000,
  });
}
