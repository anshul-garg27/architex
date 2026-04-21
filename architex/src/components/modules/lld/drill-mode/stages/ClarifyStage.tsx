"use client";

import { useEffect } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { DrillInterviewerPanel } from "../DrillInterviewerPanel";

export function ClarifyStage({ attemptId }: { attemptId: string }) {
  const turns = useDrillStore((s) => s.interviewerTurns);
  const merge = useDrillStore((s) => s.mergeStageProgress);

  // Count user turns in this stage as "questions asked" for the gate.
  useEffect(() => {
    const questionsAsked = turns.filter(
      (t) => t.role === "user" && t.stage === "clarify",
    ).length;
    merge({ questionsAsked });
  }, [turns, merge]);

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Stage 1 · Clarify
        </h2>
        <p className="mt-1 text-sm text-zinc-300">
          Ask the interviewer about scope, constraints, and expected load
          before you start sketching.
        </p>
      </header>
      <div className="flex-1 overflow-hidden">
        <DrillInterviewerPanel attemptId={attemptId} />
      </div>
    </div>
  );
}
