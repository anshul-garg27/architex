"use client";

/**
 * Search hook with built-in debounce via React 19 useDeferredValue.
 *
 * useSearch(module?) -> { query, setQuery, results, isSearching }
 *
 * Uses TanStack Query with 5-min staleTime. Skips requests when
 * the deferred query is under 2 characters.
 */

import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  moduleId: string;
  contentType: string;
  slug: string;
  name: string;
  category: string | null;
  summary: string | null;
  tags: string[] | null;
  difficulty: string | null;
  rank: number;
  snippet: string | null;
}

interface SearchResponse {
  items: SearchResult[];
  count: number;
  query: string;
}

// ── Query key factory ────────────────────────────────────────

export const searchKeys = {
  all: ["search"] as const,
  query: (q: string, module?: string) =>
    [...searchKeys.all, q, module ?? "all"] as const,
};

// ── Fetch helper ─────────────────────────────────────────────

async function fetchSearch(
  q: string,
  module?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q });
  if (module) params.set("module", module);
  const res = await fetch(`/api/search?${params}`);
  if (!res.ok) {
    throw new Error(`Search failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Full-text search hook with automatic debounce.
 *
 * @example
 * const { query, setQuery, results, isSearching } = useSearch("lld");
 */
export function useSearch(module?: string) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  const { data, isFetching } = useQuery({
    queryKey: searchKeys.query(deferredQuery, module),
    queryFn: () => fetchSearch(deferredQuery, module),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: deferredQuery.length >= 2,
  });

  return {
    query,
    setQuery,
    results: data?.items ?? [],
    isSearching: isFetching || isStale,
  };
}
