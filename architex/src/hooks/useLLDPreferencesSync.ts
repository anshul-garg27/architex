"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";

interface LLDPreferencesPatch {
  mode?: string;
  welcomeBannerDismissed?: boolean;
}

async function patchLLDPreferences(patch: LLDPreferencesPatch) {
  const res = await fetch("/api/user-preferences/lld", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Failed to patch LLD preferences: ${res.status}`);
  }
  return res.json();
}

/**
 * Write-through sync of LLD preferences to the DB. Local store is the
 * optimistic truth; this hook fires a debounced PATCH to persist.
 * Debounce: 1000ms after last change. Anonymous users (no auth) no-op
 * silently — migration on sign-in captures local state.
 */
export function useLLDPreferencesSync(): void {
  const mode = useUIStore((s) => s.lldMode);
  const dismissed = useUIStore((s) => s.lldWelcomeBannerDismissed);

  const mutation = useMutation({
    mutationFn: patchLLDPreferences,
    networkMode: "offlineFirst",
    retry: 2,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSync = useRef<{ mode: string | null; dismissed: boolean }>({
    mode: null,
    dismissed: false,
  });

  useEffect(() => {
    // Skip if nothing changed since last sync.
    if (
      mode === lastSync.current.mode &&
      dismissed === lastSync.current.dismissed
    ) {
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const patch: LLDPreferencesPatch = {};
      if (mode !== lastSync.current.mode && mode !== null) {
        patch.mode = mode;
      }
      if (dismissed !== lastSync.current.dismissed) {
        patch.welcomeBannerDismissed = dismissed;
      }
      if (Object.keys(patch).length > 0) {
        mutation.mutate(patch);
        lastSync.current = { mode, dismissed };
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mode, dismissed, mutation]);
}
