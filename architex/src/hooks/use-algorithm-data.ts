"use client";

/**
 * Algorithm data source hook.
 *
 * When NEXT_PUBLIC_ALGORITHMS_USE_API=true, fetches catalog from /api/content.
 * Otherwise, returns static imports directly.
 *
 * NOTE: Engine functions (bubbleSort, dijkstra, etc.) always stay as
 * static imports — only the AlgorithmConfig metadata is API-backed.
 */

import { useMemo } from "react";
import { useCatalog } from "@/hooks/use-content";
import type { AlgorithmConfig } from "@/lib/algorithms/types";

const USE_API = process.env.NEXT_PUBLIC_ALGORITHMS_USE_API === "true";

interface AlgorithmDataResult {
  algorithms: AlgorithmConfig[];
  isLoading: boolean;
}

export function useAlgorithmData(): AlgorithmDataResult {
  const query = useCatalog("algorithms", "algorithm");

  // Static imports — only loaded when flag is off
  const staticData = useMemo(() => {
    if (USE_API) return null;
    // Lazy require to avoid bundling when using API
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/algorithms");
    return [
      ...mod.SORTING_ALGORITHMS,
      ...mod.GRAPH_ALGORITHMS,
      ...mod.TREE_ALGORITHMS,
      ...mod.DP_ALGORITHMS,
      ...mod.STRING_ALGORITHMS,
      ...mod.BACKTRACKING_ALGORITHMS,
      ...mod.GEOMETRY_ALGORITHMS,
    ] as AlgorithmConfig[];
  }, []);

  return useMemo(() => {
    if (!USE_API && staticData) {
      return { algorithms: staticData, isLoading: false };
    }

    return {
      algorithms: (query.data?.items ?? []) as unknown as AlgorithmConfig[],
      isLoading: query.isLoading,
    };
  }, [staticData, query.data, query.isLoading]);
}
