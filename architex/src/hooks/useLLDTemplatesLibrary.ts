"use client";

import { useQuery } from "@tanstack/react-query";
import type { LLDTemplatesLibraryEntry } from "@/db/schema";

export interface TemplatesFilter {
  category?: string;
  difficulty?: string;
  q?: string;
}

async function fetchTemplates(
  filter: TemplatesFilter,
): Promise<LLDTemplatesLibraryEntry[]> {
  const params = new URLSearchParams();
  if (filter.category) params.set("category", filter.category);
  if (filter.difficulty) params.set("difficulty", filter.difficulty);
  if (filter.q) params.set("q", filter.q);
  const qs = params.toString();
  const res = await fetch(`/api/lld/templates-library${qs ? `?${qs}` : ""}`);
  if (!res.ok) throw new Error(`Templates fetch failed: ${res.status}`);
  const json = (await res.json()) as {
    templates: LLDTemplatesLibraryEntry[];
  };
  return json.templates;
}

export function useLLDTemplatesLibrary(filter: TemplatesFilter = {}) {
  return useQuery({
    queryKey: ["lld-templates-library", filter],
    queryFn: () => fetchTemplates(filter),
    staleTime: 5 * 60 * 1000,
  });
}
