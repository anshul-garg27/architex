"use client";

import { Bookmark } from "lucide-react";
import type { Bookmark as BookmarkRecord } from "@/hooks/useBookmarks";

interface BookmarkStripProps {
  bookmarks: BookmarkRecord[];
  onNavigate: (anchorId: string, sectionId: string) => void;
  onRemove?: (id: string) => void;
}

export function BookmarkStrip({
  bookmarks,
  onNavigate,
  onRemove,
}: BookmarkStripProps) {
  if (bookmarks.length === 0) return null;
  return (
    <nav
      aria-label="Bookmarks for this lesson"
      className="flex items-center gap-2 overflow-x-auto border-b border-neutral-200 bg-neutral-50/60 px-4 py-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/40"
    >
      <Bookmark size={12} className="text-neutral-500" aria-hidden />
      <ul className="flex flex-1 items-center gap-1.5 overflow-x-auto">
        {bookmarks.map((b) => (
          <li key={b.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onNavigate(b.anchorId, b.sectionId)}
              title={b.note ?? b.anchorLabel}
              className="rounded border border-neutral-200 bg-white px-2 py-1 text-neutral-700 hover:border-amber-400 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-amber-600"
            >
              {b.anchorLabel}
            </button>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(b.id)}
                aria-label={`Remove bookmark: ${b.anchorLabel}`}
                className="ml-1 rounded p-0.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  );
}
