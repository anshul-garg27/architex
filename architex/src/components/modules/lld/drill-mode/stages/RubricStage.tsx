"use client";

import { Button } from "@/components/ui/button";
import { useDrillStore } from "@/stores/drill-store";
import { RUBRIC_AXES, axisLabel, AXIS_WEIGHTS } from "@/lib/lld/drill-rubric";

export function RubricStage() {
  const merge = useDrillStore((s) => s.mergeStageProgress);
  const locked = useDrillStore(
    (s) =>
      (s.stageProgress.rubric as { rubricLocked?: boolean })?.rubricLocked ??
      false,
  );

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Stage 2 · Lock scope
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          Confirm the rubric you&apos;ll be graded against. Each axis has a
          pre-weighted share; you can renegotiate by returning to Stage 1.
        </p>
      </header>
      <ul className="grid grid-cols-2 gap-2">
        {RUBRIC_AXES.map((axis) => (
          <li
            key={axis}
            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm"
          >
            <span className="text-zinc-200">{axisLabel(axis)}</span>
            <span className="text-xs text-zinc-500">
              {Math.round(AXIS_WEIGHTS[axis] * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <Button
        className="mt-2 w-fit"
        disabled={locked}
        onClick={() => merge({ rubricLocked: true })}
      >
        {locked ? "Scope locked" : "I understand — lock scope"}
      </Button>
    </div>
  );
}
