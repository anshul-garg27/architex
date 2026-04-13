"use client";

import React, { memo, useMemo } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStreakStatus } from "@/lib/interview/achievements";

// ── StreakBadge ────────────────────────────────────────────────────

export interface StreakBadgeProps {
  streakDays: number;
  lastActiveDate: Date;
  className?: string;
}

const StreakBadge = memo(function StreakBadge({
  streakDays,
  lastActiveDate,
  className,
}: StreakBadgeProps) {
  const status = useMemo(() => getStreakStatus(lastActiveDate), [lastActiveDate]);

  const isActive = streakDays > 0 && !status.atRisk;
  const isAtRisk = status.atRisk;
  const isBroken = streakDays === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        isAtRisk
          ? "border-red-800/60 bg-red-950/30"
          : isBroken
            ? "border-zinc-800 bg-zinc-900/70"
            : "border-zinc-800 bg-zinc-900/70",
        className,
      )}
    >
      {/* Flame icon */}
      <div
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          isAtRisk
            ? "bg-red-500/15"
            : isActive
              ? "bg-orange-500/15"
              : "bg-zinc-800",
        )}
      >
        <Flame
          className={cn(
            "h-5 w-5",
            isAtRisk
              ? "text-red-400"
              : isActive
                ? "text-orange-400 animate-pulse"
                : "text-zinc-600",
          )}
        />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-semibold",
            isAtRisk
              ? "text-red-400"
              : isActive
                ? "text-zinc-100"
                : "text-zinc-400",
          )}
        >
          {streakDays > 0 ? `${streakDays} day streak` : "No active streak"}
        </p>
        <p className="text-xs text-zinc-500">
          {isAtRisk
            ? "Practice today to keep your streak!"
            : isActive
              ? "Keep it going!"
              : "Start practicing to build a streak."}
        </p>
      </div>

      {/* Day count badge */}
      {streakDays > 0 && (
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
            isAtRisk
              ? "bg-red-500/20 text-red-400"
              : "bg-orange-500/15 text-orange-400",
          )}
        >
          {streakDays}
        </div>
      )}
    </div>
  );
});

StreakBadge.displayName = "StreakBadge";

export default StreakBadge;
