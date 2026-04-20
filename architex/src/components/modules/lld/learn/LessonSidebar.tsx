"use client";

/**
 * LessonSidebar — left rail for Learn mode listing all available lesson
 * slugs with per-lesson completion state from the learn-progress rows.
 */

import type { ReactNode } from "react";

export interface SidebarEntry {
  slug: string;
  title: string;
  category?: string;
  completedSectionCount?: number;
  completedAt?: Date | string | null;
}

interface LessonSidebarProps {
  entries: SidebarEntry[];
  activeSlug: string | null;
  onSelect: (slug: string) => void;
  header?: ReactNode;
}

export function LessonSidebar({
  entries,
  activeSlug,
  onSelect,
  header,
}: LessonSidebarProps) {
  // Group by category (fallback to "Patterns")
  const groups = new Map<string, SidebarEntry[]>();
  for (const e of entries) {
    const cat = e.category ?? "Patterns";
    const arr = groups.get(cat) ?? [];
    arr.push(e);
    groups.set(cat, arr);
  }

  return (
    <aside
      aria-label="Lesson navigation"
      className="flex h-full flex-col overflow-y-auto border-r border-neutral-200 bg-neutral-50 text-sm dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      {header ? (
        <div className="sticky top-0 z-10 border-b border-neutral-200 bg-inherit px-4 py-3 dark:border-neutral-800">
          {header}
        </div>
      ) : null}
      <div className="flex-1 px-2 py-3">
        {Array.from(groups.entries()).map(([cat, items]) => (
          <div key={cat} className="mb-4">
            <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
              {cat}
            </p>
            <ul className="mt-1 space-y-0.5">
              {items.map((e) => {
                const isActive = e.slug === activeSlug;
                const isDone = e.completedAt != null;
                return (
                  <li key={e.slug}>
                    <button
                      type="button"
                      onClick={() => onSelect(e.slug)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                        isActive
                          ? "bg-amber-50 font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isDone
                            ? "bg-emerald-500"
                            : e.completedSectionCount &&
                                e.completedSectionCount > 0
                              ? "bg-amber-500"
                              : "bg-neutral-300 dark:bg-neutral-700"
                        }`}
                      />
                      <span className="truncate">{e.title}</span>
                      {e.completedSectionCount &&
                      e.completedSectionCount > 0 &&
                      !isDone ? (
                        <span className="ml-auto text-[10px] tabular-nums text-neutral-500">
                          {e.completedSectionCount}/8
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
