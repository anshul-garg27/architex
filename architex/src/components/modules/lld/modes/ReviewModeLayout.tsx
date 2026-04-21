"use client";

import { memo } from "react";

export const ReviewModeLayout = memo(function ReviewModeLayout() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🔁</div>
        <h2 className="text-xl font-semibold text-foreground">Review Mode</h2>
        <p className="text-sm text-foreground-muted mt-2 leading-relaxed">
          FSRS-5 spaced repetition review arrives in Phase 5. Once you&apos;ve
          completed patterns in Learn mode, they&apos;ll surface here on
          optimal review schedules.
        </p>
      </div>
    </div>
  );
});
