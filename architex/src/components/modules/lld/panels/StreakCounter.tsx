"use client";

/**
 * StreakCounter — Displays the user's consecutive-day learning streak (LLD-137).
 *
 * Shows a compact badge with flame icon and day count. Designed to sit in the
 * sidebar header. Reads streak data from module-progress getOverallProgress().
 *
 * Integration:
 *   import { StreakCounter } from "../panels/StreakCounter";
 *   // Render in sidebar header: <StreakCounter />
 */

import { memo, useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { getOverallProgress } from "@/lib/progress/module-progress";

export const StreakCounter = memo(function StreakCounter() {
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    // Read streak on mount and refresh every 60 seconds
    const refresh = () => {
      const progress = getOverallProgress();
      setStreakDays(progress.streakDays);
    };

    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (streakDays <= 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 backdrop-blur-sm px-2.5 py-0.5 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
      title={`${streakDays}-day learning streak`}
      role="status"
      aria-label={`${streakDays} day learning streak`}
    >
      <Flame className="h-3 w-3 text-amber-400" />
      <span className="text-[10px] font-bold text-amber-400">
        {streakDays}d
      </span>
    </div>
  );
});
