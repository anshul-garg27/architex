"use client";

import { memo } from "react";

export const LearnModeLayout = memo(function LearnModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">📖</div>
        <h2 className="text-xl font-semibold text-foreground">Learn Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          Guided pattern lessons are coming in Phase 2. Until then, flip
          back to Build mode and use the existing Explain tab in the bottom
          panel.
        </p>
      </div>
    </div>
  );
});
