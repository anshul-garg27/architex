"use client";

import {
  AXIS_WEIGHTS,
  RUBRIC_AXES,
  axisLabel,
  type RubricBreakdown,
} from "@/lib/lld/drill-rubric";
import { cn } from "@/lib/utils";

export function DrillRubricBreakdown({
  rubric,
}: {
  rubric: RubricBreakdown;
}) {
  return (
    <div className="space-y-3">
      {RUBRIC_AXES.map((axis) => {
        const r = rubric[axis];
        const bandColor =
          r.score >= 80
            ? "bg-emerald-400"
            : r.score >= 60
              ? "bg-sky-400"
              : r.score >= 40
                ? "bg-amber-400"
                : "bg-rose-400";
        return (
          <div
            key={axis}
            className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-zinc-100">
                {axisLabel(axis)}
                <span className="ml-2 text-xs text-zinc-500">
                  {Math.round(AXIS_WEIGHTS[axis] * 100)}%
                </span>
              </span>
              <span className="font-mono text-zinc-300">{r.score}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded bg-zinc-900">
              <div
                className={cn("h-full", bandColor)}
                style={{ width: `${r.score}%` }}
              />
            </div>
            {(r.missing.length > 0 || r.wrong.length > 0) && (
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {r.missing.map((m, i) => (
                  <li key={`m${i}`}>
                    <span className="text-amber-400">missing:</span> {m}
                  </li>
                ))}
                {r.wrong.map((w, i) => (
                  <li key={`w${i}`}>
                    <span className="text-rose-400">wrong:</span> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
