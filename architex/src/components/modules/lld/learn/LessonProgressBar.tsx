"use client";

import type { LessonSectionId } from "@/lib/lld/lesson-types";
import { LESSON_SECTION_LABELS, LESSON_SECTION_ORDER } from "@/lib/lld/lesson-types";

interface LessonProgressBarProps {
  completedSectionIds: ReadonlySet<LessonSectionId>;
  activeSectionId: LessonSectionId | null;
}

export function LessonProgressBar({
  completedSectionIds,
  activeSectionId,
}: LessonProgressBarProps) {
  const total = LESSON_SECTION_ORDER.length;
  const completed = completedSectionIds.size;
  const pct = Math.round((completed / total) * 100);

  return (
    <div
      aria-label="Lesson progress"
      className="flex items-center gap-3 border-b border-neutral-200 bg-white/70 px-4 py-2 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70"
    >
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Lesson completion"
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800"
      >
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-neutral-600 dark:text-neutral-400">
        {completed}/{total} · {pct}%
      </span>
      {activeSectionId ? (
        <span className="hidden text-xs italic text-neutral-500 sm:inline">
          Reading: {LESSON_SECTION_LABELS[activeSectionId]}
        </span>
      ) : null}
    </div>
  );
}
