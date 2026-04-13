"use client";

/**
 * Data Structures data source hook.
 *
 * When NEXT_PUBLIC_DS_USE_API=true, fetches catalog from /api/content.
 * Otherwise, returns static DS_CATALOG import.
 *
 * Engine files (46 implementations) always stay as static imports.
 */

import { useMemo } from "react";
import { useCatalog } from "@/hooks/use-content";

const USE_API = process.env.NEXT_PUBLIC_DS_USE_API === "true";

interface DSDataResult {
  catalog: Record<string, unknown>[];
  isLoading: boolean;
}

export function useDSData(): DSDataResult {
  const query = useCatalog("data-structures", "data-structure");

  const staticData = useMemo(() => {
    if (USE_API) return null;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/data-structures/catalog");
    return (mod.DS_CATALOG ?? []) as Record<string, unknown>[];
  }, []);

  return useMemo(() => {
    if (!USE_API && staticData) {
      return { catalog: staticData, isLoading: false };
    }

    return {
      catalog: (query.data?.items ?? []) as unknown as Record<string, unknown>[],
      isLoading: query.isLoading,
    };
  }, [staticData, query.data, query.isLoading]);
}
