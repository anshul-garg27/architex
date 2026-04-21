"use client";

import { cn } from "@/lib/utils";

interface Props {
  completed: number;
  total: number;
  activeIdx: number;
  estimatedSecondsLeft?: number;
}

export function UnitProgressBar({
  completed,
  total,
  activeIdx,
  estimatedSecondsLeft,
}: Props) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const mins =
    estimatedSecondsLeft != null
      ? Math.max(1, Math.round(estimatedSecondsLeft / 60))
      : null;

  return (
    <div className="flex items-center gap-3 border-b border-border/30 bg-background/60 px-4 py-2 text-xs">
      <span className="shrink-0 font-mono text-[10px] tabular-nums text-foreground-muted">
        {Math.max(1, activeIdx + 1)} / {total}
      </span>
      <div className="flex h-1 flex-1 overflow-hidden rounded-full bg-foreground/5">
        <div
          className={cn(
            "h-full rounded-full bg-indigo-500 transition-all duration-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 tabular-nums text-foreground-muted">
        {pct}%
      </span>
      {mins != null && (
        <span className="shrink-0 text-[10px] text-foreground-subtle">
          ~{mins} min left
        </span>
      )}
    </div>
  );
}
