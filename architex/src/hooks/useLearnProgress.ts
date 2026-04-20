"use client";

/**
 * useLearnProgress — read + debounced PATCH the lld_learn_progress row
 * for the current (user, patternSlug).
 *
 * The hook buffers updates in a local ref and flushes every DEBOUNCE_MS
 * so rapid scroll events don't spam the server. Flush-on-unmount ensures
 * the last scroll position is saved when the user navigates away.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LearnSectionId,
  SectionProgressMap,
  SectionState,
} from "@/db/schema/lld-learn-progress";

const DEBOUNCE_MS = 1_000;

export interface LearnProgressRow {
  patternSlug: string;
  sectionProgress: SectionProgressMap;
  activeSectionId: LearnSectionId | null;
  lastScrollY: number;
  completedSectionCount: number;
  checkpointStats: Record<string, { attempts: number; correct: number }>;
  completedAt: Date | string | null;
  visitCount: number;
  updatedAt?: Date | string;
}

export interface PatchPayload {
  sectionProgress?: Partial<SectionProgressMap>;
  activeSectionId?: LearnSectionId | null;
  lastScrollY?: number;
  checkpointStats?: Record<string, { attempts: number; correct: number }>;
  bumpVisit?: boolean;
}

function mergeSectionProgress(
  existing: Partial<SectionProgressMap>,
  incoming: Partial<SectionProgressMap>,
): Partial<SectionProgressMap> {
  const out: Partial<SectionProgressMap> = { ...existing };
  for (const [id, v] of Object.entries(incoming) as [
    LearnSectionId,
    SectionState,
  ][]) {
    if (!v) continue;
    const prev = out[id] ?? {
      scrollDepth: 0,
      firstSeenAt: null,
      completedAt: null,
    };
    out[id] = {
      scrollDepth: Math.max(prev.scrollDepth, v.scrollDepth ?? 0),
      firstSeenAt: prev.firstSeenAt ?? v.firstSeenAt ?? null,
      completedAt: prev.completedAt ?? v.completedAt ?? null,
    };
  }
  return out;
}

export function useLearnProgress(patternSlug: string | null) {
  const [row, setRow] = useState<LearnProgressRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef<PatchPayload>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    if (!patternSlug) {
      setRow(null);
      return;
    }
    setIsLoading(true);
    fetch(`/api/lld/learn-progress/${encodeURIComponent(patternSlug)}`)
      .then((r) => (r.ok ? r.json() : { progress: null }))
      .then((data) => {
        if (cancelled) return;
        if (data?.progress) {
          setRow(data.progress as LearnProgressRow);
        } else {
          setRow(null);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRow(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [patternSlug]);

  const flush = useCallback(async () => {
    if (!patternSlug) return;
    const payload = pendingRef.current;
    if (Object.keys(payload).length === 0) return;
    pendingRef.current = {};
    try {
      const res = await fetch(
        `/api/lld/learn-progress/${encodeURIComponent(patternSlug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.progress) {
          setRow(data.progress as LearnProgressRow);
        }
      }
    } catch (err) {
      console.warn("[useLearnProgress] flush failed:", err);
    }
  }, [patternSlug]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush();
    }, DEBOUNCE_MS);
  }, [flush]);

  const patch = useCallback(
    (update: PatchPayload) => {
      // Merge into pending buffer
      const pending = pendingRef.current;
      if (update.sectionProgress) {
        pending.sectionProgress = mergeSectionProgress(
          pending.sectionProgress ?? {},
          update.sectionProgress,
        );
      }
      if (update.activeSectionId !== undefined) {
        pending.activeSectionId = update.activeSectionId;
      }
      if (update.lastScrollY !== undefined) {
        pending.lastScrollY = update.lastScrollY;
      }
      if (update.checkpointStats !== undefined) {
        pending.checkpointStats = {
          ...(pending.checkpointStats ?? {}),
          ...update.checkpointStats,
        };
      }
      if (update.bumpVisit) {
        pending.bumpVisit = true;
      }
      scheduleFlush();
    },
    [scheduleFlush],
  );

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Fire-and-forget; unmount means navigation away.
      flush().catch(() => {});
    };
  }, [flush]);

  return { row, isLoading, patch, flush };
}
