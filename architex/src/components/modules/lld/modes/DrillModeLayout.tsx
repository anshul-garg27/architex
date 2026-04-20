"use client";

import { memo } from "react";

export const DrillModeLayout = memo(function DrillModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">⏱</div>
        <h2 className="text-xl font-semibold text-foreground">Drill Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          Timed drill sessions arrive in Phase 3. You&apos;ll pick from 33
          interview problems with 3 sub-modes (Interview / Guided / Speed).
        </p>
      </div>
    </div>
  );
});
