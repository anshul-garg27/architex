"use client";

/**
 * System Design template data source hook.
 *
 * When NEXT_PUBLIC_SYSDESIGN_USE_API=true, fetches from /api/content.
 * Otherwise, returns static imports directly (zero overhead).
 */

import { useMemo } from "react";
import { useCatalog, useContentDetail } from "@/hooks/use-content";
import {
  SYSTEM_DESIGN_TEMPLATES,
  getSolutionBlueprints,
} from "@/lib/templates";
import type { DiagramTemplate } from "@/lib/templates";

const USE_API = process.env.NEXT_PUBLIC_SYSDESIGN_USE_API === "true";

interface TemplateDataResult {
  templates: DiagramTemplate[];
  blueprints: DiagramTemplate[];
  isLoading: boolean;
}

/**
 * Returns system design templates, either from API or static imports.
 */
export function useTemplateData(): TemplateDataResult {
  const templatesQuery = useCatalog("system-design", "template");
  const blueprintsQuery = useCatalog("system-design", "blueprint");

  return useMemo(() => {
    if (!USE_API) {
      return {
        templates: SYSTEM_DESIGN_TEMPLATES,
        blueprints: getSolutionBlueprints?.() ?? [],
        isLoading: false,
      };
    }

    return {
      templates: (templatesQuery.data?.items ?? []) as unknown as DiagramTemplate[],
      blueprints: (blueprintsQuery.data?.items ?? []) as unknown as DiagramTemplate[],
      isLoading: templatesQuery.isLoading || blueprintsQuery.isLoading,
    };
  }, [
    templatesQuery.data,
    templatesQuery.isLoading,
    blueprintsQuery.data,
    blueprintsQuery.isLoading,
  ]);
}

/**
 * Fetch full template detail by slug (loads complete nodes/edges/config).
 */
export function useTemplateDetail(slug: string | null) {
  const query = useContentDetail("system-design", "template", slug);

  if (!USE_API || !slug) {
    // Static: find from in-memory array
    const template = slug
      ? SYSTEM_DESIGN_TEMPLATES.find((t) => t.id === slug)
      : null;
    return { data: template ?? null, isLoading: false };
  }

  return {
    data: query.data?.item ? (query.data.item as unknown as DiagramTemplate) : null,
    isLoading: query.isLoading,
  };
}
