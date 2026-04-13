"use client";

import React, { memo, useMemo } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateLevel } from "@/lib/interview/achievements";

// ── Level names (1-10) ────────────────────────────────────────────

const LEVEL_NAMES: Record<number, string> = {
  1: "Apprentice",
  2: "Junior Engineer",
  3: "Engineer",
  4: "Senior Engineer",
  5: "Staff Engineer",
  6: "Principal Engineer",
  7: "Distinguished",
  8: "Fellow",
  9: "Architect",
  10: "Grand Architect",
};

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(Math.max(level, 1), 10)] ?? "Apprentice";
}

// ── XPDisplay ─────────────────────────────────────────────────────

export interface XPDisplayProps {
  totalXp: number;
  className?: string;
}

const XPDisplay = memo(function XPDisplay({ totalXp, className }: XPDisplayProps) {
  const { level, xpInLevel, xpForNextLevel } = useMemo(
    () => calculateLevel(totalXp),
    [totalXp],
  );

  const percentage = xpForNextLevel > 0
    ? Math.min((xpInLevel / xpForNextLevel) * 100, 100)
    : 100;

  const formattedCurrent = xpInLevel.toLocaleString();
  const formattedTarget = xpForNextLevel.toLocaleString();

  return (
    <div className={cn("rounded-xl border border-zinc-800 bg-zinc-900/70 p-4", className)}>
      {/* Level heading */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-sm font-bold text-blue-400">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">{getLevelName(level)}</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Level {level}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          {totalXp.toLocaleString()} XP
        </div>
      </div>

      {/* XP progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400",
            "transition-[width] duration-700 ease-out",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* XP text */}
      <p className="mt-1.5 text-right text-xs text-zinc-400">
        {formattedCurrent} / {formattedTarget} XP
      </p>
    </div>
  );
});

XPDisplay.displayName = "XPDisplay";

export default XPDisplay;
