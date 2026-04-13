"use client";

/**
 * Generic module data source hook.
 *
 * Works for any module that follows the standard content pattern:
 * a single content type stored in module_content table.
 *
 * Each module checks its own feature flag:
 *   NEXT_PUBLIC_{MODULE_UPPER}_USE_API=true
 *
 * Usage:
 *   const { items, isLoading } = useModuleData("database", "daily-challenge");
 *   const { items, isLoading } = useModuleData("networking", "srs-card");
 *   const { items, isLoading } = useModuleData("security", "topic");
 *
 * For modules with dedicated hooks (LLD, algorithms, system-design),
 * prefer those module-specific hooks instead.
 */

import { useMemo } from "react";
import { useCatalog, useContentDetail } from "@/hooks/use-content";
import type { CatalogFilters } from "@/hooks/use-content";

// Feature flag map: module ID → env var name
const FLAG_MAP: Record<string, string> = {
  database: "NEXT_PUBLIC_DATABASE_USE_API",
  networking: "NEXT_PUBLIC_NETWORKING_USE_API",
  security: "NEXT_PUBLIC_SECURITY_USE_API",
  distributed: "NEXT_PUBLIC_DISTRIBUTED_USE_API",
  os: "NEXT_PUBLIC_OS_USE_API",
  "ml-design": "NEXT_PUBLIC_MLDESIGN_USE_API",
  concurrency: "NEXT_PUBLIC_CONCURRENCY_USE_API",
};

function isApiEnabled(moduleId: string): boolean {
  const envVar = FLAG_MAP[moduleId];
  if (!envVar) return false;
  return process.env[envVar] === "true";
}

interface ModuleDataResult<T = Record<string, unknown>> {
  items: T[];
  isLoading: boolean;
  isApiEnabled: boolean;
}

/**
 * Fetch content items for a module + content type.
 * Returns empty array when API flag is off (consumers use static data).
 */
export function useModuleData<T = Record<string, unknown>>(
  moduleId: string,
  contentType: string,
  filters?: CatalogFilters,
): ModuleDataResult<T> {
  const enabled = isApiEnabled(moduleId);
  const query = useCatalog(moduleId, contentType, filters);

  return useMemo(() => {
    if (!enabled) {
      return { items: [], isLoading: false, isApiEnabled: false };
    }

    return {
      items: (query.data?.items ?? []) as unknown as T[],
      isLoading: query.isLoading,
      isApiEnabled: true,
    };
  }, [enabled, query.data, query.isLoading]);
}

/**
 * Fetch full content detail for a single item.
 */
export function useModuleDetail<T = Record<string, unknown>>(
  moduleId: string,
  contentType: string,
  slug: string | null,
) {
  const enabled = isApiEnabled(moduleId);
  const query = useContentDetail(moduleId, contentType, slug);

  if (!enabled || !slug) {
    return { data: null, isLoading: false };
  }

  return {
    data: query.data?.item ? (query.data.item as unknown as T) : null,
    isLoading: query.isLoading,
  };
}
