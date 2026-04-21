"use client";

import { useDrillStore } from "@/stores/drill-store";
import { cn } from "@/lib/utils";

const GRADES: Array<{ v: number; label: string }> = [
  { v: 1, label: "Needs rework" },
  { v: 2, label: "Shaky" },
  { v: 3, label: "OK" },
  { v: 4, label: "Solid" },
  { v: 5, label: "Nailed it" },
];

export function ReflectionStage() {
  const merge = useDrillStore((s) => s.mergeStageProgress);
  const selfGrade = useDrillStore(
    (s) =>
      (s.stageProgress.reflection as { selfGrade?: number | null })
        ?.selfGrade ?? null,
  );

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Stage 5 · Reflect
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          Before we grade, rate yourself. Calibration matters as much as
          correctness.
        </p>
      </header>
      <div className="flex flex-wrap gap-2">
        {GRADES.map((g) => (
          <button
            key={g.v}
            onClick={() => merge({ selfGrade: g.v })}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm",
              selfGrade === g.v
                ? "border-violet-400 bg-violet-500/20 text-violet-100"
                : "border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700",
            )}
          >
            {g.v}. {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
