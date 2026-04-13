"use client";

/**
 * LLD data source hook — bridges between static imports and API-backed data.
 *
 * When NEXT_PUBLIC_LLD_USE_API=true:
 *   - List view: fetches metadata from /api/content (slug, name, category)
 *   - Detail view: fetches full JSONB from /api/content/:slug (code, classes, etc.)
 *
 * When flag is off:
 *   - Returns static imports directly (zero overhead, full objects)
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import { useCatalog, useContentDetail } from "@/hooks/use-content";

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
 * In API mode, list items have metadata only — use useLLDFullPattern()
 * to fetch the full content when a user selects an item.
 */
export function useLLDData(): LLDDataResult {
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

    const isLoading =
      patternsQuery.isLoading ||
      problemsQuery.isLoading ||
      solidQuery.isLoading ||
      sequenceQuery.isLoading ||
      stateMachineQuery.isLoading;

    // Map API items: slug → id (API uses slug, DesignPattern uses id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapItem = (item: any) => ({ ...item, id: item.slug ?? item.id });

    return {
      patterns: (patternsQuery.data?.items ?? []).map(mapItem) as DesignPattern[],
      solidDemos: (solidQuery.data?.items ?? []).map(mapItem) as SOLIDDemo[],
      problems: (problemsQuery.data?.items ?? []).map(mapItem) as LLDProblem[],
      sequenceExamples: (sequenceQuery.data?.items ?? []).map(mapItem) as typeof SEQUENCE_EXAMPLES,
      stateMachineExamples: (stateMachineQuery.data?.items ?? []).map(mapItem) as typeof STATE_MACHINE_EXAMPLES,
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
 * Fetch the full pattern content when a user selects one from the sidebar.
 *
 * In static mode: returns the pattern as-is (already has full content).
 * In API mode: fetches /api/content/:slug?module=lld&type=pattern to get
 * the full JSONB payload (code, classes, relationships, etc.)
 */
export function useLLDFullPattern(selectedSlug: string | null) {
  const detailQuery = useContentDetail("lld", "pattern", USE_API ? selectedSlug : null);
  const [fullPattern, setFullPattern] = useState<DesignPattern | null>(null);

  useEffect(() => {
    if (!selectedSlug) {
      setFullPattern(null);
      return;
    }

    if (!USE_API) {
      // Static mode: find from in-memory array (has full content)
      const found = DESIGN_PATTERNS.find((p) => p.id === selectedSlug) ?? null;
      setFullPattern(found);
      return;
    }

    // API mode: use the detail query result
    if (detailQuery.data?.item) {
      const content = detailQuery.data.item.content as Record<string, unknown>;
      // The JSONB content IS the full DesignPattern — it was seeded from the same object
      setFullPattern(content as unknown as DesignPattern);
    }
  }, [selectedSlug, detailQuery.data]);

  return {
    fullPattern,
    isLoading: USE_API ? detailQuery.isLoading : false,
  };
}
