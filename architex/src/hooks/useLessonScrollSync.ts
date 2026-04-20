"use client";

/**
 * useLessonScrollSync — IntersectionObserver-based scroll tracker for
 * the 8 lesson sections.
 *
 * Emits:
 * - activeSectionId: the id of the section currently closest to the top
 * - scrollDepth: per-section max scroll depth reached (0..1)
 * - completedSectionIds: set of section ids that crossed the 95% threshold
 *
 * The hook expects the 8 section DOM elements to have
 *   data-lesson-section="<id>"
 * where <id> is a LessonSectionId.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonSectionId } from "@/lib/lld/lesson-types";
import { LESSON_SECTION_ORDER } from "@/lib/lld/lesson-types";

export interface ScrollSyncState {
  activeSectionId: LessonSectionId | null;
  sectionDepths: Partial<Record<LessonSectionId, number>>;
  completedSectionIds: Set<LessonSectionId>;
}

const COMPLETE_THRESHOLD = 0.95;

function isLessonSectionId(v: string | null): v is LessonSectionId {
  if (!v) return false;
  return (LESSON_SECTION_ORDER as readonly string[]).includes(v);
}

export function useLessonScrollSync(
  containerRef: React.RefObject<HTMLElement | null>,
  onUpdate?: (patch: {
    activeSectionId: LessonSectionId;
    sectionProgress: Partial<
      Record<LessonSectionId, { scrollDepth: number; firstSeenAt: number | null; completedAt: number | null }>
    >;
  }) => void,
): ScrollSyncState {
  const [state, setState] = useState<ScrollSyncState>({
    activeSectionId: null,
    sectionDepths: {},
    completedSectionIds: new Set(),
  });

  const firstSeenRef = useRef<Map<LessonSectionId, number>>(new Map());
  const completedAtRef = useRef<Map<LessonSectionId, number>>(new Map());
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const handleEntries = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      let maxRatio = -1;
      let nextActive: LessonSectionId | null = null;

      setState((prev) => {
        const nextDepths = { ...prev.sectionDepths };
        const nextCompleted = new Set(prev.completedSectionIds);
        const patch: Partial<
          Record<
            LessonSectionId,
            { scrollDepth: number; firstSeenAt: number | null; completedAt: number | null }
          >
        > = {};

        for (const entry of entries) {
          const raw = (entry.target as HTMLElement).dataset.lessonSection;
          if (!isLessonSectionId(raw ?? null)) continue;
          const id = raw as LessonSectionId;

          const ratio = Math.max(0, Math.min(1, entry.intersectionRatio));
          const prevDepth = nextDepths[id] ?? 0;
          const depth = Math.max(prevDepth, ratio);
          if (depth > prevDepth) {
            nextDepths[id] = depth;
          }

          if (entry.isIntersecting) {
            if (!firstSeenRef.current.has(id)) {
              firstSeenRef.current.set(id, Date.now());
            }
            if (ratio > maxRatio) {
              maxRatio = ratio;
              nextActive = id;
            }
          }

          if (ratio >= COMPLETE_THRESHOLD && !completedAtRef.current.has(id)) {
            completedAtRef.current.set(id, Date.now());
            nextCompleted.add(id);
          }

          patch[id] = {
            scrollDepth: depth,
            firstSeenAt: firstSeenRef.current.get(id) ?? null,
            completedAt: completedAtRef.current.get(id) ?? null,
          };
        }

        // Don't force-change activeSectionId if no section is intersecting
        const activeSectionId = nextActive ?? prev.activeSectionId;

        if (
          activeSectionId &&
          onUpdateRef.current &&
          Object.keys(patch).length > 0
        ) {
          onUpdateRef.current({
            activeSectionId,
            sectionProgress: patch,
          });
        }

        return {
          activeSectionId,
          sectionDepths: nextDepths,
          completedSectionIds: nextCompleted,
        };
      });
    },
    [],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(handleEntries, {
      root: null,
      threshold: [0, 0.25, 0.5, 0.75, 0.95, 1],
    });

    const targets = el.querySelectorAll<HTMLElement>("[data-lesson-section]");
    targets.forEach((t) => observer.observe(t));

    return () => {
      observer.disconnect();
    };
  }, [containerRef, handleEntries]);

  return state;
}
