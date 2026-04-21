"use client";

import { useCallback, useMemo } from "react";
import {
  useUnitProgressData,
  type UnitProgressPayload,
} from "./useUnit";
import { useUnitProgressSync } from "./useUnitProgressSync";
import type { BlueprintUnitState } from "@/db/schema";

export interface SectionCompletionPatch {
  startedAt?: number;
  completedAt?: number | null;
  attempts?: number;
  score?: number | null;
}

/**
 * Thin orchestrator on top of useUnitProgressData + useUnitProgressSync.
 *
 * Exposes:
 *   - server-hydrated `progress` (section states, totalTime, etc.)
 *   - `patchSection(id, patch)` → merges a section-state patch and
 *     queues a debounced PATCH to the server
 *   - `markSectionCompleted(id, { score? })` → sets completedAt to now,
 *     increments attempts, fires server patch
 *   - `markUnitCompleted()` → sets state to "completed", stamps completedAt
 */
export function useUnitProgress(slug: string | null) {
  const dataQuery = useUnitProgressData(slug);
  const { patchProgress } = useUnitProgressSync(slug);

  const progress: UnitProgressPayload | null = dataQuery.data ?? null;

  const patchSection = useCallback(
    (sectionId: string, patch: SectionCompletionPatch) => {
      if (!slug) return;
      const existing = progress?.sectionStates?.[sectionId];
      const mergedSectionState = {
        startedAt: patch.startedAt ?? existing?.startedAt ?? Date.now(),
        completedAt:
          patch.completedAt !== undefined
            ? patch.completedAt
            : (existing?.completedAt ?? null),
        attempts:
          patch.attempts !== undefined
            ? patch.attempts
            : (existing?.attempts ?? 0),
        score:
          patch.score !== undefined ? patch.score : (existing?.score ?? null),
      };

      const nextSectionStates = {
        ...(progress?.sectionStates ?? {}),
        [sectionId]: mergedSectionState,
      };

      patchProgress({
        sectionStates: nextSectionStates,
        state:
          progress?.state === "available" || !progress
            ? ("in_progress" as BlueprintUnitState)
            : progress.state,
        lastPosition: sectionId,
      });
    },
    [slug, progress, patchProgress],
  );

  const markSectionCompleted = useCallback(
    (sectionId: string, opts?: { score?: number }) => {
      patchSection(sectionId, {
        completedAt: Date.now(),
        attempts: (progress?.sectionStates?.[sectionId]?.attempts ?? 0) + 1,
        score: opts?.score ?? null,
      });
    },
    [progress, patchSection],
  );

  const markUnitCompleted = useCallback(() => {
    if (!slug) return;
    patchProgress({
      state: "completed" as BlueprintUnitState,
      sectionStates: progress?.sectionStates ?? {},
      lastPosition: progress?.lastPosition ?? null,
    });
  }, [slug, progress, patchProgress]);

  const completedSectionIds = useMemo(() => {
    const out = new Set<string>();
    const states = progress?.sectionStates ?? {};
    for (const [id, state] of Object.entries(states)) {
      if (state?.completedAt != null) out.add(id);
    }
    return out;
  }, [progress]);

  return {
    progress,
    isLoading: dataQuery.isLoading,
    error: dataQuery.error,
    completedSectionIds,
    patchSection,
    markSectionCompleted,
    markUnitCompleted,
  };
}
