"use client";

import { memo, type ReactNode } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useLLDModeSync } from "@/hooks/useLLDModeSync";
import { useLLDPreferencesSync } from "@/hooks/useLLDPreferencesSync";
import { ModeSwitcher } from "./modes/ModeSwitcher";
import { WelcomeBanner } from "./modes/WelcomeBanner";
import { LearnModeLayout } from "./modes/LearnModeLayout";
import { BuildModeLayout } from "./modes/BuildModeLayout";
import { DrillModeLayout } from "./modes/DrillModeLayout";
import { ReviewModeLayout } from "./modes/ReviewModeLayout";

interface LLDShellProps {
  /** The existing Build-mode content (sidebar + canvas + props + bottom). */
  buildContent: ReactNode;
}

/**
 * Top-level shell for the LLD module. Reads `lldMode` from ui-store and
 * renders one of four mode layouts. Build mode receives today's unchanged
 * 4-panel UI as `buildContent`.
 *
 * Null mode = first visit → default to "build" for existing users so
 * nothing changes for them. New users see the welcome banner which routes
 * them into their chosen mode.
 */
export const LLDShell = memo(function LLDShell({
  buildContent,
}: LLDShellProps) {
  const mode = useUIStore((s) => s.lldMode);

  useLLDModeSync();
  useLLDPreferencesSync();

  // First-visit default = build (non-breaking for existing users)
  const effectiveMode = mode ?? "build";

  return (
    <div className="flex h-full flex-col">
      {/* Top chrome */}
      <div className="flex items-center justify-end border-b border-border/20 px-3 py-2">
        <ModeSwitcher />
      </div>

      {/* Welcome banner (first visit only) */}
      <WelcomeBanner />

      {/* Mode content */}
      <div className="flex-1 min-h-0">
        {effectiveMode === "learn" && <LearnModeLayout />}
        {effectiveMode === "build" && (
          <BuildModeLayout>{buildContent}</BuildModeLayout>
        )}
        {effectiveMode === "drill" && <DrillModeLayout />}
        {effectiveMode === "review" && <ReviewModeLayout />}
      </div>
    </div>
  );
});
