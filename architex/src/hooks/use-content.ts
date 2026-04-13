"use client";

/**
 * TanStack Query hooks for the generic content API.
 *
 * useCatalog()       — fetch metadata list for a module+type
 * useContentDetail() — fetch full content for a single item
 *
 * Both support offline-first via networkMode: 'offlineFirst' (set globally)
 * and use staleTime: Infinity since catalog data only changes on re-seed.
 */

import { useQuery } from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────

/** Metadata returned by the list endpoint (no full JSONB content). */
export interface ContentListItem {
  id: string;
  moduleId: string;
  contentType: string;
  slug: string;
  name: string;
  category: string | null;
  difficulty: string | null;
  sortOrder: number;
  summary: string | null;
  tags: string[] | null;
}

/** Full content item returned by the detail endpoint. */
export interface ContentDetailItem extends ContentListItem {
  content: Record<string, unknown>;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse {
  items: ContentListItem[];
  count: number;
}

export interface ContentDetailResponse {
  item: ContentDetailItem;
}

export interface CatalogFilters {
  category?: string;
  difficulty?: string;
  /** When true, includes full JSONB content (not just metadata). */
  full?: boolean;
}

// ── Query key factories ──────────────────────────────────────

export const contentKeys = {
  all: ["content"] as const,
  lists: () => [...contentKeys.all, "list"] as const,
  list: (moduleId: string, type: string, filters?: CatalogFilters) =>
    [...contentKeys.lists(), moduleId, type, filters ?? {}] as const,
  details: () => [...contentKeys.all, "detail"] as const,
  detail: (moduleId: string, type: string, slug: string) =>
    [...contentKeys.details(), moduleId, type, slug] as const,
};

// ── Fetch helpers ────────────────────────────────────────────

async function fetchCatalog(
  moduleId: string,
  type: string,
  filters?: CatalogFilters,
): Promise<ContentListResponse> {
  const params = new URLSearchParams({ module: moduleId, type });
  if (filters?.category) params.set("category", filters.category);
  if (filters?.difficulty) params.set("difficulty", filters.difficulty);
  if (filters?.full) params.set("full", "true");

  const res = await fetch(`/api/content?${params}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch catalog: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchContentDetail(
  moduleId: string,
  type: string,
  slug: string,
): Promise<ContentDetailResponse> {
  const params = new URLSearchParams({ module: moduleId, type });
  const res = await fetch(`/api/content/${slug}?${params}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Content not found: ${moduleId}/${type}/${slug}`);
    }
    throw new Error(
      `Failed to fetch content: ${res.status} ${res.statusText}`,
    );
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────

/**
 * Fetch the catalog list for a module + content type.
 * Returns metadata only (no full JSONB) for lightweight list views.
 *
 * @example
 * const { data, isLoading } = useCatalog("lld", "pattern");
 * const { data } = useCatalog("lld", "pattern", { category: "creational" });
 */
export function useCatalog(
  moduleId: string,
  type: string,
  filters?: CatalogFilters,
) {
  return useQuery({
    queryKey: contentKeys.list(moduleId, type, filters),
    queryFn: () => fetchCatalog(moduleId, type, filters),
    staleTime: Infinity, // catalog data changes only on re-seed
    enabled: !!moduleId && !!type,
  });
}

/**
 * Fetch the full content detail for a single item by slug.
 * Loaded on-demand when the user selects an item from the catalog.
 *
 * @example
 * const { data, isLoading } = useContentDetail("lld", "pattern", "singleton");
 */
export function useContentDetail(
  moduleId: string,
  type: string,
  slug: string | null,
) {
  return useQuery({
    queryKey: contentKeys.detail(moduleId, type, slug ?? ""),
    queryFn: () => fetchContentDetail(moduleId, type, slug!),
    staleTime: Infinity,
    enabled: !!moduleId && !!type && !!slug,
  });
}
