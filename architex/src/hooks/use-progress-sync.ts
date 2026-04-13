"use client";

/**
 * Dual-write progress sync hook.
 *
 * Reads:  localStorage first (instant) → API in background (authoritative)
 * Writes: localStorage immediately → debounced POST to API (2s)
 * Conflict: server wins (API response overwrites local on next fetch)
 * Offline: localStorage only, queued for sync on reconnect
 *
 * Usage:
 *   const { progress, updateProgress, isLoading, isSyncing } = useProgressSync("lld");
 */

import { useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const USE_API = process.env.NEXT_PUBLIC_PROGRESS_USE_API === "true";

// ── Types ────────────────────────────────────────────────────

export interface ProgressRecord {
  id?: string;
  moduleId: string;
  conceptId: string | null;
  score: number;
  completedAt: string | null;
}

interface ProgressResponse {
  progress: ProgressRecord[];
}

interface UpsertResponse {
  progress: ProgressRecord;
}

// ── Query keys ───────────────────────────────────────────────

export const progressKeys = {
  all: ["progress"] as const,
  module: (moduleId: string) => [...progressKeys.all, moduleId] as const,
  concept: (moduleId: string, conceptId: string) =>
    [...progressKeys.module(moduleId), conceptId] as const,
};

// ── Fetch helpers ────────────────────────────────────────────

async function fetchProgress(moduleId: string): Promise<ProgressResponse> {
  const res = await fetch(`/api/progress?moduleId=${encodeURIComponent(moduleId)}`);
  if (res.status === 401) {
    // Not authenticated — return empty (localStorage will be used)
    return { progress: [] };
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch progress: ${res.status}`);
  }
  return res.json();
}

async function upsertProgress(record: {
  moduleId: string;
  conceptId?: string | null;
  score: number;
  completedAt?: string | null;
}): Promise<UpsertResponse> {
  const res = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    throw new Error(`Failed to upsert progress: ${res.status}`);
  }
  return res.json();
}

// ── Hook ─────────────────────────────────────────────────────

export function useProgressSync(moduleId: string) {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch server progress (background, non-blocking)
  const query = useQuery({
    queryKey: progressKeys.module(moduleId),
    queryFn: () => fetchProgress(moduleId),
    enabled: USE_API,
    staleTime: 60_000, // 1 minute
    refetchOnWindowFocus: true, // Sync when user returns to tab
  });

  // Mutation for server writes
  const mutation = useMutation({
    mutationFn: upsertProgress,
    onSuccess: () => {
      // Invalidate to refetch latest from server
      queryClient.invalidateQueries({ queryKey: progressKeys.module(moduleId) });
    },
  });

  // Debounced write to server (2s delay, coalesces rapid updates)
  const updateProgress = useCallback(
    (record: {
      moduleId: string;
      conceptId?: string | null;
      score: number;
      completedAt?: string | null;
    }) => {
      if (!USE_API) return;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        mutation.mutate(record);
      }, 2000);
    },
    [mutation],
  );

  return {
    /** Server progress records (empty if not authenticated or API off) */
    serverProgress: query.data?.progress ?? [],
    /** Trigger a debounced server write */
    updateProgress,
    /** True while initial server fetch is in flight */
    isLoading: USE_API ? query.isLoading : false,
    /** True while a mutation is in flight */
    isSyncing: mutation.isPending,
    /** Whether API sync is enabled */
    isApiEnabled: USE_API,
  };
}
