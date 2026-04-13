"use client";

/**
 * RecentlyStudied — Quick-access list of the last 10 visited topics.
 * Reads from the persisted Zustand UI store and navigates on click.
 * PLT-022
 */

import React, { memo, useCallback } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { useUIStore, type ModuleType } from "@/stores/ui-store";
import { MODULE_LABELS } from "@/lib/cross-module/bridge-types";

// ── Relative time helper ────────────────────────────────

function relativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// ── Component ───────────────────────────────────────────

export const RecentlyStudied = memo(function RecentlyStudied() {
  const recentlyStudied = useUIStore((s) => s.recentlyStudied);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const handleClick = useCallback(
    (module: ModuleType) => {
      setActiveModule(module);
    },
    [setActiveModule],
  );

  if (recentlyStudied.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 px-2 py-1">
        <Clock className="h-3.5 w-3.5 text-foreground-subtle" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
          Recently Studied
        </span>
      </div>
      <ul className="flex flex-col gap-0.5" role="list">
        {recentlyStudied.map((entry, i) => (
          <li key={`${entry.module}-${entry.topic}-${i}`}>
            <button
              onClick={() => handleClick(entry.module)}
              className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground group-hover:text-foreground">
                  {entry.topic}
                </p>
                <p className="text-[10px] text-foreground-subtle">
                  {MODULE_LABELS[entry.module] ?? entry.module}
                </p>
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-foreground-subtle">
                {relativeTime(entry.timestamp)}
              </span>
              <ChevronRight className="h-3 w-3 shrink-0 text-foreground-subtle opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
