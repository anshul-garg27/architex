"use client";

/**
 * LearnModeLayout — the Phase 2 Learn mode composer.
 *
 * Layout:
 *   [ LessonSidebar | BookmarkStrip + Lesson column + TOC/ConfusedWith ]
 *
 * Data flow:
 *   - Fetches the lesson payload from /api/lld/lessons/<slug>
 *   - Wires useLearnProgress for server sync of scroll + checkpoints
 *   - Wires useBookmarks for the strip + toggle buttons
 *   - useLessonScrollSync drives activeSectionId + completion ticks
 *   - useSelectionExplain + ContextualExplainPopover handle AI highlights
 */

import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useLearnProgress } from "@/hooks/useLearnProgress";
import { useLessonScrollSync } from "@/hooks/useLessonScrollSync";
import type { SectionProgressMap } from "@/db/schema/lld-learn-progress";
import { useSelectionExplain } from "@/hooks/useSelectionExplain";
import { useLessonPayload } from "@/hooks/useLessonPayload";
import { DESIGN_PATTERNS } from "@/lib/lld/patterns";
import { LESSON_SECTION_ORDER } from "@/lib/lld/lesson-types";
import type { LessonSectionId } from "@/lib/lld/lesson-types";
import { LessonSidebar, type SidebarEntry } from "../learn/LessonSidebar";
import { LessonColumn } from "../learn/LessonColumn";
import { LessonProgressBar } from "../learn/LessonProgressBar";
import { LessonTableOfContents } from "../learn/LessonTableOfContents";
import { BookmarkStrip } from "../learn/BookmarkStrip";
import { ConfusedWithPanel } from "../learn/ConfusedWithPanel";
import { ContextualExplainPopover } from "../learn/ContextualExplainPopover";

const DEFAULT_SLUG = "singleton";

export const LearnModeLayout = memo(function LearnModeLayout() {
  const [activeSlug, setActiveSlug] = useState<string>(DEFAULT_SLUG);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sidebar entries from static catalog
  const sidebarEntries: SidebarEntry[] = useMemo(
    () =>
      DESIGN_PATTERNS.map((p) => ({
        slug: p.id,
        title: p.name,
        category: p.category,
      })),
    [],
  );

  // Fetch lesson payload (SWR-style — see hook below)
  const { payload, isLoading, error } = useLessonPayload(activeSlug);

  // Learn progress — debounced PATCH
  const { row: progressRow, patch } = useLearnProgress(activeSlug);

  // Bookmarks — CRUD + optimistic
  const {
    bookmarks,
    toggle: toggleBookmark,
    remove: removeBookmark,
    isBookmarked,
  } = useBookmarks(activeSlug);
  // isBookmarked is exposed for future per-anchor UI but not used in
  // the current composition. Silence the "unused" lint hint.
  void isBookmarked;

  // Scroll-sync over the lesson column
  const { activeSectionId, completedSectionIds } = useLessonScrollSync(
    containerRef,
    useCallback(
      (update: {
        activeSectionId: LessonSectionId;
        sectionProgress: Partial<SectionProgressMap>;
      }) => {
        patch({
          activeSectionId: update.activeSectionId,
          sectionProgress: update.sectionProgress,
        });
      },
      [patch],
    ),
  );

  // Selection-explain (AI)
  const selectionExplain = useSelectionExplain(containerRef);
  const currentSection = activeSectionId ?? "itch";

  const scrollTo = useCallback(
    (sectionId: LessonSectionId, anchorId?: string) => {
      const container = containerRef.current;
      if (!container) return;
      const selector = `[data-lesson-section="${sectionId}"]${
        anchorId ? ` [id="${anchorId}"]` : ""
      }`;
      const target =
        container.querySelector<HTMLElement>(selector) ??
        container.querySelector<HTMLElement>(`[data-lesson-section="${sectionId}"]`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  const onBookmarkNavigate = useCallback(
    (anchorId: string, sectionId: string) => {
      if (!(LESSON_SECTION_ORDER as readonly string[]).includes(sectionId)) {
        return;
      }
      scrollTo(sectionId as LessonSectionId, anchorId);
    },
    [scrollTo],
  );

  const onCheckpointResult = useCallback(
    (r: { id: string; correct: boolean; attempts: number }) => {
      patch({
        checkpointStats: {
          [r.id]: { attempts: r.attempts, correct: r.correct ? 1 : 0 },
        },
      });
    },
    [patch],
  );

  // Selection-explain request
  const currentSectionRaw = payload?.sections?.[currentSection]?.raw ?? "";
  const onExplainRequest = useCallback(() => {
    if (!activeSlug) return;
    selectionExplain.requestExplanation({
      patternSlug: activeSlug,
      sectionId: currentSection,
      sectionRaw: currentSectionRaw,
    });
  }, [activeSlug, currentSection, currentSectionRaw, selectionExplain]);

  // Merge in per-pattern progress for sidebar display
  const sidebarWithProgress = useMemo(() => {
    if (!progressRow) return sidebarEntries;
    return sidebarEntries.map((e) =>
      e.slug === activeSlug
        ? {
            ...e,
            completedSectionCount: progressRow.completedSectionCount,
            completedAt: progressRow.completedAt ?? null,
          }
        : e,
    );
  }, [sidebarEntries, activeSlug, progressRow]);

  return (
    <div className="relative flex h-full w-full">
      <div className="hidden w-64 shrink-0 md:block">
        <LessonSidebar
          entries={sidebarWithProgress}
          activeSlug={activeSlug}
          onSelect={(slug) => setActiveSlug(slug)}
          header={
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Learn
              </p>
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                Foundation patterns
              </p>
            </div>
          }
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <LessonProgressBar
          completedSectionIds={completedSectionIds}
          activeSectionId={activeSectionId}
        />
        <BookmarkStrip
          bookmarks={bookmarks}
          onNavigate={onBookmarkNavigate}
          onRemove={removeBookmark}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
            data-learn-scroll-container
          >
            {isLoading ? (
              <div className="p-12 text-center text-sm text-neutral-500">
                Loading lesson…
              </div>
            ) : error ? (
              <div className="p-12 text-center text-sm text-red-600">
                Failed to load lesson: {error}
              </div>
            ) : payload ? (
              <LessonColumn
                payload={payload}
                onCheckpointResult={onCheckpointResult}
              />
            ) : (
              <div className="p-12 text-center text-sm text-neutral-500">
                <p>
                  No lesson content for <code>{activeSlug}</code> yet.
                </p>
                <p className="mt-2">
                  Run <code>pnpm compile:lld-lessons</code> after authoring the MDX.
                </p>
              </div>
            )}
          </div>
          <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-neutral-200 bg-neutral-50/40 p-3 xl:block dark:border-neutral-800 dark:bg-neutral-900/30">
            <div className="space-y-3">
              {payload ? (
                <LessonTableOfContents
                  payload={payload}
                  activeSectionId={activeSectionId}
                  completedSectionIds={completedSectionIds}
                  onJump={(sectionId, anchor) => scrollTo(sectionId, anchor)}
                />
              ) : null}
              <ConfusedWithPanel
                patternSlug={activeSlug}
                onNavigate={(slug) => setActiveSlug(slug)}
              />
              {payload && bookmarks.length > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    toggleBookmark({
                      patternSlug: activeSlug,
                      sectionId: currentSection,
                      anchorId: `bookmark-${Date.now()}`,
                      anchorLabel: `${activeSlug} · ${currentSection}`,
                    })
                  }
                  className="w-full rounded border border-neutral-200 px-2 py-1 text-xs text-neutral-600 hover:border-amber-400 dark:border-neutral-800 dark:text-neutral-400"
                >
                  + Bookmark current section
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
      <ContextualExplainPopover
        state={selectionExplain}
        patternSlug={activeSlug}
        sectionId={activeSectionId}
        sectionRaw={currentSectionRaw}
        onRequest={onExplainRequest}
        onClose={selectionExplain.clear}
      />
    </div>
  );
});
