"use client";

import { useEffect, useRef } from "react";
import { useBlueprintStore } from "@/stores/blueprint-store";

const ENDPOINT = "/api/blueprint/journey-state";
const DEBOUNCE_MS = 1000;

interface ServerJourneyState {
  preferredLang?: "ts" | "py" | "java";
  welcomeDismissedAt?: string | null;
  pinnedTool?: "patterns" | "problems" | "review" | null;
  dailyReviewTarget?: number;
  currentUnitSlug?: string | null;
  currentSectionId?: string | null;
  streakDays?: number;
}

/**
 * Hydrates Blueprint store from the server on mount, then pushes a
 * debounced PATCH on every mutation of persistable fields.
 *
 * Safe to call from multiple places — each instance adds its own
 * subscription. The shell mounts this once; other callers rarely need it.
 */
export function useJourneyStateSync(): void {
  const hydratedRef = useRef(false);
  const lastPatchedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      try {
        const res = await fetch(ENDPOINT, { method: "GET" });
        if (!res.ok) return;
        const data: ServerJourneyState = await res.json();
        useBlueprintStore.getState().hydrate({
          preferredLang: data.preferredLang,
          welcomeDismissed: Boolean(data.welcomeDismissedAt),
          pinnedTool: data.pinnedTool ?? null,
          dailyReviewTarget: data.dailyReviewTarget,
        });
      } catch {
        // Swallow — hydration failure falls back to defaults.
      }
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = useBlueprintStore.subscribe((state) => {
      const snapshot = JSON.stringify({
        preferredLang: state.preferredLang,
        welcomeDismissed: state.welcomeDismissed,
        pinnedTool: state.pinnedTool,
        dailyReviewTarget: state.dailyReviewTarget,
        currentUnitSlug: state.currentUnitSlug,
        currentSectionId: state.currentSectionId,
      });
      if (snapshot === lastPatchedRef.current) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        lastPatchedRef.current = snapshot;
        const parsed = JSON.parse(snapshot);
        try {
          await fetch(ENDPOINT, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              preferredLang: parsed.preferredLang,
              welcomeDismissedAt: parsed.welcomeDismissed
                ? new Date().toISOString()
                : null,
              pinnedTool: parsed.pinnedTool,
              dailyReviewTarget: parsed.dailyReviewTarget,
              currentUnitSlug: parsed.currentUnitSlug,
              currentSectionId: parsed.currentSectionId,
            }),
          });
        } catch {
          // Swallow; next mutation will retry.
        }
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
