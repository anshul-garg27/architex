"use client";

import { memo } from "react";

export const DrillModeLayout = memo(function DrillModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">⏱</div>
        <h2 className="text-xl font-semibold text-foreground">Drill Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          Timed drill sessions arrive in Phase 4. 5-stage gated flow (Clarify →
          Estimate → Design → Deep-Dive → Q&amp;A), 8 AI interviewer personas,
          tiered hints, and a 6-axis rubric grader.
        </p>
      </div>
    </div>
  );
});
