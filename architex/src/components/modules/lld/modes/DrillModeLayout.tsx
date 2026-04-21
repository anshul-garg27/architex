"use client";

import { memo, useMemo } from "react";
import { useDrillStore } from "@/stores/drill-store";
import { DrillStageStepper } from "@/components/modules/lld/drill-mode/DrillStageStepper";
import { DrillTimer } from "@/components/modules/lld/drill-mode/DrillTimer";
import { DrillSubmitBar } from "@/components/modules/lld/drill-mode/DrillSubmitBar";
import { DrillHintLadder } from "@/components/modules/lld/drill-mode/DrillHintLadder";
import { ClarifyStage } from "@/components/modules/lld/drill-mode/stages/ClarifyStage";
import { RubricStage } from "@/components/modules/lld/drill-mode/stages/RubricStage";
import { CanvasStage } from "@/components/modules/lld/drill-mode/stages/CanvasStage";
import { WalkthroughStage } from "@/components/modules/lld/drill-mode/stages/WalkthroughStage";
import { ReflectionStage } from "@/components/modules/lld/drill-mode/stages/ReflectionStage";

export const DrillModeLayout = memo(function DrillModeLayout() {
  const currentStage = useDrillStore((s) => s.currentStage);
  const attemptId = useDrillStore((s) => s.attemptId);

  const stageScreen = useMemo(() => {
    switch (currentStage) {
      case "clarify":
        return attemptId ? <ClarifyStage attemptId={attemptId} /> : null;
      case "rubric":
        return <RubricStage />;
      case "canvas":
        return <CanvasStage />;
      case "walkthrough":
        return <WalkthroughStage />;
      case "reflection":
        return <ReflectionStage />;
    }
  }, [currentStage, attemptId]);

  if (!attemptId) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-foreground">Drill Mode</h2>
          <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
            No active drill. Pick a problem + variant to begin a timed
            session. 5 stages · 6-axis rubric · streaming interviewer persona.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/40">
        <DrillStageStepper currentStage={currentStage} />
        <div className="px-4">
          <DrillTimer />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <main className="min-w-0 flex-1">{stageScreen}</main>
        <aside className="w-64 border-l border-zinc-800 bg-zinc-950/30 p-3">
          <DrillHintLadder attemptId={attemptId} />
        </aside>
      </div>
      <DrillSubmitBar
        onSubmit={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}/grade`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selfGrade: 3 }),
          });
        }}
        onPause={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "pause" }),
          });
        }}
        onAbandon={() => {
          void fetch(`/api/lld/drill-attempts/${attemptId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "abandon" }),
          });
        }}
      />
    </div>
  );
});
