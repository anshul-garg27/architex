"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  useBlueprintStore,
  type UnitProgressCache,
} from "@/stores/blueprint-store";

const DEBOUNCE_MS = 1000;

/**
 * Per-unit progress syncer. The Unit Renderer (SP3) calls
 * `patchProgress(partial)` on every meaningful user action (section
 * completed, timer tick, checkpoint attempt). The hook updates the
 * local store optimistically and debounces a PATCH to the API.
 *
 * Returns early if unitSlug is null — safe to use inside a renderer
 * that can be mounted without a resolved unit yet.
 */
export function useUnitProgressSync(unitSlug: string | null): {
  patchProgress: (patch: Partial<UnitProgressCache>) => void;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<Partial<UnitProgressCache>>({});

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const patchProgress = useCallback(
    (patch: Partial<UnitProgressCache>) => {
      if (!unitSlug) return;

      pendingRef.current = { ...pendingRef.current, ...patch };

      const store = useBlueprintStore.getState();
      const existing = store.unitProgress[unitSlug];
      store.updateUnitProgress(unitSlug, {
        ...(existing ?? {
          unitSlug,
          state: "available",
          sectionStates: {},
          lastSeenAt: Date.now(),
        }),
        ...pendingRef.current,
        unitSlug,
        lastSeenAt: Date.now(),
      });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const body = pendingRef.current;
        pendingRef.current = {};
        try {
          await fetch(`/api/blueprint/units/${unitSlug}/progress`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
        } catch {
          // Optimistic cache is preserved; retry on next mutation.
        }
      }, DEBOUNCE_MS);
    },
    [unitSlug],
  );

  return { patchProgress };
}
