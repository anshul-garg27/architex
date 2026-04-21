"use client";

import { bandForScore } from "@/lib/lld/drill-rubric";
import { cn } from "@/lib/utils";

export function DrillGradeReveal({
  score,
  feedback,
}: {
  score: number;
  feedback?: string | null;
}) {
  const band = bandForScore(score);
  return (
    <div
      className="flex animate-in fade-in zoom-in-95 flex-col items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 text-center duration-300"
    >
      <div className={cn("text-6xl font-bold", band.accent)}>{score}</div>
      <div className="text-sm uppercase tracking-wide text-zinc-400">
        {band.label}
      </div>
      <p className="max-w-md text-sm text-zinc-300">
        {feedback ?? band.placeholder}
      </p>
    </div>
  );
}
