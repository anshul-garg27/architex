"use client";

import type { LessonSectionId, LessonPayload } from "@/lib/lld/lesson-types";
import {
  LESSON_SECTION_LABELS,
  LESSON_SECTION_ORDER,
} from "@/lib/lld/lesson-types";

interface LessonTableOfContentsProps {
  payload: LessonPayload;
  activeSectionId: LessonSectionId | null;
  completedSectionIds: ReadonlySet<LessonSectionId>;
  onJump: (sectionId: LessonSectionId, anchorId?: string) => void;
}

export function LessonTableOfContents({
  payload,
  activeSectionId,
  completedSectionIds,
  onJump,
}: LessonTableOfContentsProps) {
  return (
    <nav
      aria-label="Lesson table of contents"
      className="rounded-md border border-neutral-200 bg-white p-3 text-sm dark:border-neutral-800 dark:bg-neutral-950"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
        Contents
      </p>
      <ol className="space-y-2">
        {LESSON_SECTION_ORDER.map((id, i) => {
          const isActive = id === activeSectionId;
          const isDone = completedSectionIds.has(id);
          const section = payload.sections[id];
          const anchors = section.anchors ?? [];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onJump(id)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs ${
                  isActive
                    ? "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                    : isDone
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-500"
                }`}
              >
                <span className="w-4 tabular-nums">
                  {isDone ? "✓" : i + 1}
                </span>
                <span className="flex-1 font-medium">
                  {LESSON_SECTION_LABELS[id]}
                </span>
              </button>
              {isActive && anchors.length > 0 ? (
                <ul className="ml-6 mt-1 space-y-1 border-l border-neutral-200 pl-2 dark:border-neutral-800">
                  {anchors
                    .filter((a) => a.depth === 2 || a.depth === 3)
                    .map((a) => (
                      <li key={a.id}>
                        <button
                          type="button"
                          onClick={() => onJump(id, a.id)}
                          className="text-left text-[11px] text-neutral-500 hover:text-amber-700 dark:hover:text-amber-300"
                        >
                          {a.label}
                        </button>
                      </li>
                    ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
