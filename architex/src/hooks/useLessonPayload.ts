"use client";

/**
 * useLessonPayload — fetches the compiled LessonPayload for a pattern
 * slug from /api/lld/lessons/[slug]. Caches results in-memory across
 * re-renders using a module-level Map keyed by slug.
 */

import { useEffect, useState } from "react";
import type { LessonPayload } from "@/lib/lld/lesson-types";

const cache = new Map<string, LessonPayload>();

interface UseLessonPayloadResult {
  payload: LessonPayload | null;
  isLoading: boolean;
  error: string | null;
}

export function useLessonPayload(slug: string | null): UseLessonPayloadResult {
  const [payload, setPayload] = useState<LessonPayload | null>(
    slug ? cache.get(slug) ?? null : null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    slug ? !cache.has(slug) : false,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      queueMicrotask(() => {
        if (cancelled) return;
        setPayload(null);
        setIsLoading(false);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }
    if (cache.has(slug)) {
      queueMicrotask(() => {
        if (cancelled) return;
        setPayload(cache.get(slug) ?? null);
        setIsLoading(false);
        setError(null);
      });
      return () => {
        cancelled = true;
      };
    }
    queueMicrotask(() => {
      if (cancelled) return;
      setIsLoading(true);
      setError(null);
    });
    fetch(`/api/lld/lessons/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { payload: LessonPayload | null };
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.payload) {
          cache.set(slug, data.payload);
          setPayload(data.payload);
        } else {
          setPayload(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { payload, isLoading, error };
}
