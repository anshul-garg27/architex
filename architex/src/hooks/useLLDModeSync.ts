"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUIStore, type LLDMode } from "@/stores/ui-store";

const VALID_MODES: readonly LLDMode[] = [
  "learn",
  "build",
  "drill",
  "review",
] as const;

function isValidMode(value: unknown): value is LLDMode {
  return (
    typeof value === "string" &&
    (VALID_MODES as readonly string[]).includes(value)
  );
}

/**
 * Bidirectional sync between the `?mode=` URL query param and
 * `ui-store.lldMode`. Uses `router.replace` (not push) so mode switching
 * doesn't pollute browser history.
 */
export function useLLDModeSync(): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = useUIStore((s) => s.lldMode);
  const setLLDMode = useUIStore((s) => s.setLLDMode);

  // URL → store
  useEffect(() => {
    const urlMode = searchParams.get("mode");
    if (isValidMode(urlMode) && urlMode !== mode) {
      setLLDMode(urlMode);
    }
    // Intentionally no `mode` dep: first-mount URL wins, then store becomes authoritative.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, setLLDMode]);

  // store → URL
  useEffect(() => {
    if (!mode) return;
    if (searchParams.get("mode") === mode) return;
    const params = new URLSearchParams(searchParams);
    params.set("mode", mode);
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [mode, router, searchParams]);
}
