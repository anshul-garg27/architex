"use client";

import { cn } from "@/lib/utils";
import { STAGE_ORDER, type DrillStage } from "@/lib/lld/drill-stages";

const LABELS: Record<DrillStage, string> = {
  clarify: "Clarify",
  rubric: "Scope",
  canvas: "Design",
  walkthrough: "Narrate",
  reflection: "Reflect",
};

export function DrillStageStepper({
  currentStage,
}: {
  currentStage: DrillStage;
}) {
  const currentIdx = STAGE_ORDER.indexOf(currentStage);
  return (
    <ol className="flex items-center gap-2 px-4 py-2 text-sm">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-2",
              active && "font-semibold text-violet-300",
              done && "text-emerald-300",
              !active && !done && "text-zinc-500",
            )}
          >
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs",
                active && "border-violet-400 bg-violet-500/20",
                done && "border-emerald-400 bg-emerald-500/20",
                !active && !done && "border-zinc-700",
              )}
            >
              {done ? "done" : i + 1}
            </span>
            <span>{LABELS[stage]}</span>
            {i < STAGE_ORDER.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px w-10",
                  done ? "bg-emerald-400/60" : "bg-zinc-700",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
