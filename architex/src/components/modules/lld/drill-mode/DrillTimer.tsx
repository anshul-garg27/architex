"use client";

import { useEffect, useState } from "react";
import { useInterviewStore } from "@/stores/interview-store";
import { cn } from "@/lib/utils";

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const ss = (total % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export function DrillTimer() {
  const activeDrill = useInterviewStore((s) => s.activeDrill);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeDrill || activeDrill.pausedAt !== null) return;
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, [activeDrill]);

  if (!activeDrill) return null;
  const elapsed =
    activeDrill.elapsedBeforePauseMs +
    (activeDrill.pausedAt === null ? now - activeDrill.startedAt : 0);
  const remaining = activeDrill.durationLimitMs - elapsed;
  const urgent = remaining < 60_000;
  const warn = remaining < 5 * 60_000;

  return (
    <div
      className={cn(
        "font-mono text-xl tabular-nums tracking-wider",
        urgent && "animate-pulse text-rose-400",
        !urgent && warn && "text-amber-300",
        !warn && "text-zinc-200",
      )}
      aria-live={urgent ? "assertive" : "polite"}
    >
      {format(remaining)}
    </div>
  );
}
