"use client";

/**
 * LLD data source hook — bridges between static imports and API-backed data.
 *
 * When NEXT_PUBLIC_LLD_USE_API=true, fetches from /api/content.
 * Otherwise, returns the static imports directly (zero overhead).
 *
 * This hook provides the same data shape as the static imports,
 * so consuming components don't need to change.
 */

import { useMemo } from "react";
import { useCatalog, useContentDetail } from "@/hooks/use-content";
import type { ContentListItem } from "@/hooks/use-content";

// Static imports (used when feature flag is off)
import {
  DESIGN_PATTERNS,
  SOLID_DEMOS,
  LLD_PROBLEMS,
  SEQUENCE_EXAMPLES,
  STATE_MACHINE_EXAMPLES,
} from "@/lib/lld";
import type {
  DesignPattern,
  SOLIDDemo,
  LLDProblem,
} from "@/lib/lld";

const USE_API = process.env.NEXT_PUBLIC_LLD_USE_API === "true";

interface LLDDataResult {
  patterns: DesignPattern[];
  solidDemos: SOLIDDemo[];
  problems: LLDProblem[];
  sequenceExamples: typeof SEQUENCE_EXAMPLES;
  stateMachineExamples: typeof STATE_MACHINE_EXAMPLES;
  isLoading: boolean;
}

/**
 * Returns the full LLD catalog data, either from API or static imports.
 */
export function useLLDData(): LLDDataResult {
  // API path
  const patternsQuery = useCatalog("lld", "pattern");
  const problemsQuery = useCatalog("lld", "problem");
  const solidQuery = useCatalog("lld", "solid-demo");
  const sequenceQuery = useCatalog("lld", "sequence-example");
  const stateMachineQuery = useCatalog("lld", "state-machine");

  return useMemo(() => {
    if (!USE_API) {
      return {
        patterns: DESIGN_PATTERNS,
        solidDemos: SOLID_DEMOS,
        problems: LLD_PROBLEMS,
        sequenceExamples: SEQUENCE_EXAMPLES,
        stateMachineExamples: STATE_MACHINE_EXAMPLES,
        isLoading: false,
      };
    }

    // API mode: map list items back to the expected shapes.
    // Full content is loaded on-demand via useContentDetail when user selects an item.
    // For list views, the metadata from the catalog is sufficient.
    const isLoading =
      patternsQuery.isLoading ||
      problemsQuery.isLoading ||
      solidQuery.isLoading ||
      sequenceQuery.isLoading ||
      stateMachineQuery.isLoading;

    return {
      patterns: (patternsQuery.data?.items ?? []) as unknown as DesignPattern[],
      solidDemos: (solidQuery.data?.items ?? []) as unknown as SOLIDDemo[],
      problems: (problemsQuery.data?.items ?? []) as unknown as LLDProblem[],
      sequenceExamples: (sequenceQuery.data?.items ?? []) as unknown as typeof SEQUENCE_EXAMPLES,
      stateMachineExamples: (stateMachineQuery.data?.items ?? []) as unknown as typeof STATE_MACHINE_EXAMPLES,
      isLoading,
    };
  }, [
    patternsQuery.data,
    patternsQuery.isLoading,
    problemsQuery.data,
    problemsQuery.isLoading,
    solidQuery.data,
    solidQuery.isLoading,
    sequenceQuery.data,
    sequenceQuery.isLoading,
    stateMachineQuery.data,
    stateMachineQuery.isLoading,
  ]);
}

/**
 * Fetch the full content detail for a selected item.
 * Used when user clicks on a pattern/problem to load the complete JSONB payload.
 */
export function useLLDDetail(
  type: string,
  slug: string | null,
) {
  const query = useContentDetail("lld", type, slug);

  if (!USE_API || !slug) {
    return { data: null, isLoading: false };
  }

  return {
    data: query.data?.item?.content ?? null,
    isLoading: query.isLoading,
  };
}
