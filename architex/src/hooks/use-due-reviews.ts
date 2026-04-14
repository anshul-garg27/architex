"use client";

/**
 * TanStack Query hooks for FSRS spaced-repetition reviews.
 *
 * useDueReviews(moduleId)    — fetch items due for review
 * useReviewSession(moduleId) — queue-based review session manager
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type { Rating } from "@/lib/fsrs";

// ── Types ────────────────────────────────────────────────────

interface ProgressRow {
  id: string;
  moduleId: string;
  conceptId: string | null;
  score: number;
  stability: number | null;
  difficulty: number | null;
  reps: number | null;
  lapses: number | null;
  fsrsState: number | null;
  nextReviewAt: string | null;
}

interface DueReviewsResponse {
  items: ProgressRow[];
  count: number;
}

interface ReviewResponse {
  progress: ProgressRow;
}

// ── Query key factory ────────────────────────────────────────

export const reviewKeys = {
  all: ["reviews"] as const,
  due: (moduleId: string) => [...reviewKeys.all, "due", moduleId] as const,
};

// ── Fetch helpers ────────────────────────────────────────────

async function fetchDueReviews(moduleId: string): Promise<DueReviewsResponse> {
  const params = new URLSearchParams({ moduleId });
  const res = await fetch(`/api/review?${params}`);
  if (res.status === 401) {
    // Not authenticated — return empty instead of throwing
    return { items: [], count: 0 };
  }
  if (!res.ok) {
    throw new Error(`Failed to fetch due reviews: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function submitReviewRequest(body: {
  moduleId: string;
  conceptId: string;
  rating: Rating;
}): Promise<ReviewResponse> {
  const res = await fetch("/api/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit review: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────

/**
 * Fetch items due for review in a module.
 *
 * @example
 * const { data, isLoading } = useDueReviews("lld");
 * console.log(data?.items, data?.count);
 */
export function useDueReviews(moduleId: string) {
  return useQuery({
    queryKey: reviewKeys.due(moduleId),
    queryFn: () => fetchDueReviews(moduleId),
    staleTime: 60_000, // 1 minute — due items change after each review
    enabled: !!moduleId,
    retry: false, // Don't retry on 401 — user is simply not authenticated
  });
}

/**
 * Queue-based review session manager.
 *
 * Loads all due items, presents them one at a time, and advances the queue
 * after each review submission.
 *
 * @example
 * const { currentItem, remaining, isComplete, submitReview, isLoading } =
 *   useReviewSession("lld");
 *
 * if (currentItem) {
 *   submitReview(currentItem.conceptId!, Rating.Good);
 * }
 */
export function useReviewSession(moduleId: string) {
  const queryClient = useQueryClient();
  const { data, isLoading: isFetching } = useDueReviews(moduleId);

  // Track which items have been reviewed this session (by index)
  const [reviewedCount, setReviewedCount] = useState(0);

  const queue = useMemo(() => data?.items ?? [], [data]);
  const currentItem = queue[reviewedCount] ?? null;
  const remaining = Math.max(0, queue.length - reviewedCount);
  const isComplete = !isFetching && queue.length > 0 && remaining === 0;
  const total = queue.length;

  const mutation = useMutation({
    mutationFn: submitReviewRequest,
    onSuccess: () => {
      setReviewedCount((c) => c + 1);
      // Invalidate so next session fetch gets fresh data
      queryClient.invalidateQueries({ queryKey: reviewKeys.due(moduleId) });
    },
  });

  const submitReview = useCallback(
    (conceptId: string, rating: Rating) => {
      mutation.mutate({ moduleId, conceptId, rating });
    },
    [moduleId, mutation],
  );

  return {
    currentItem,
    remaining,
    total,
    isComplete,
    isLoading: isFetching,
    isSubmitting: mutation.isPending,
    submitReview,
  };
}
