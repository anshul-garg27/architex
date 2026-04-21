"use client";

import { Flame } from "lucide-react";
import { useProgressSummary } from "@/hooks/blueprint/useProgressSummary";
import { cn } from "@/lib/utils";

/**
 * Compact pill showing the current daily streak + number of reviews
 * due today. Renders nothing while loading (silent placeholder).
 * Gold tint at 7+ days; indigo 1–6; gray at 0.
 */
export function StreakPill({ dueCount = 0 }: { dueCount?: number }) {
  const { data, isLoading } = useProgressSummary();

  if (isLoading) return null;

  const days = data?.streakDays ?? 0;

  const tone =
    days >= 7
      ? "border-amber-400/50 bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
      : days >= 1
        ? "border-indigo-400/50 bg-indigo-50 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200"
        : "border-border bg-background/60 text-foreground-muted";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        tone,
      )}
      aria-label={`Streak: ${days} days, ${dueCount} reviews due`}
    >
      <Flame className="h-3.5 w-3.5" aria-hidden />
      <span>
        <span className="tabular-nums">{days}</span>d streak
      </span>
      <span className="opacity-50">·</span>
      <span>
        <span className="tabular-nums">{dueCount}</span> due
      </span>
    </div>
  );
}
