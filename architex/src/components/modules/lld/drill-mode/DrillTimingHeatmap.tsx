"use client";

import { useDrillTimingHeatmap } from "@/hooks/useDrillTimingHeatmap";
import { cn } from "@/lib/utils";

const STAGE_LABEL: Record<string, string> = {
  clarify: "Clarify",
  rubric: "Scope",
  canvas: "Design",
  walkthrough: "Narrate",
  reflection: "Reflect",
};

function fmt(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

export function DrillTimingHeatmap() {
  const heatmap = useDrillTimingHeatmap();
  if (!heatmap) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
      <header className="mb-3 flex items-center justify-between text-xs text-zinc-500">
        <span>Time by stage</span>
        <span className="font-mono">{heatmap.overall}</span>
      </header>
      <ul className="space-y-2">
        {heatmap.stages.map((s) => {
          const pct = Math.min(
            100,
            (s.actualMs / heatmap.totalBudgetMs) * 100,
          );
          const color =
            s.classification === "over"
              ? "bg-rose-400"
              : s.classification === "under"
                ? "bg-amber-400"
                : "bg-emerald-400";
          return (
            <li key={s.stage} className="text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-300">{STAGE_LABEL[s.stage]}</span>
                <span className="font-mono text-zinc-400">
                  {fmt(s.actualMs)} / {fmt(s.idealMs)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-zinc-900">
                <div
                  className={cn("h-full", color)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
