"use client";

import { memo, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useUIStore, type ModuleType } from "@/stores/ui-store";
import { getModuleProgress } from "@/lib/progress/module-progress";
import { getBridgesFromModule } from "@/lib/cross-module/bridge-registry";
import { MODULE_LABELS } from "@/lib/cross-module/bridge-types";

/**
 * "Next Up" nudge card shown in the sidebar footer when the user has explored
 * 80%+ of the current module. Suggests a related module based on bridge
 * connections from the current module.
 */
export const NextModuleNudge = memo(function NextModuleNudge({
  className = "",
}: {
  className?: string;
}) {
  const activeModule = useUIStore((s) => s.activeModule);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const suggestion = useMemo(() => {
    // Check if user has explored >= 80% of current module
    const progress = getModuleProgress(activeModule);
    if (progress.percentage < 80) return null;

    // Find bridge-connected target modules
    const bridges = getBridgesFromModule(activeModule);
    if (bridges.length === 0) return null;

    // Collect unique target modules and pick the one with the least progress
    const targetModules = new Set<ModuleType>();
    for (const bridge of bridges) {
      targetModules.add(bridge.targetModule);
    }

    let bestTarget: ModuleType | null = null;
    let lowestProgress = Infinity;

    for (const target of targetModules) {
      const targetProgress = getModuleProgress(target);
      if (targetProgress.percentage < lowestProgress) {
        lowestProgress = targetProgress.percentage;
        bestTarget = target;
      }
    }

    if (!bestTarget) return null;

    return {
      moduleId: bestTarget,
      label: MODULE_LABELS[bestTarget] ?? bestTarget,
      currentProgress: progress.percentage,
    };
  }, [activeModule]);

  if (!suggestion) return null;

  return (
    <div
      className={`mx-2 rounded-lg border border-primary/20 bg-primary/5 p-3 ${className}`}
    >
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
        Next Up
      </p>
      <p className="text-xs text-foreground-muted">
        You have explored {suggestion.currentProgress}% of{" "}
        {MODULE_LABELS[activeModule] ?? activeModule}. Continue with:
      </p>
      <button
        onClick={() => setActiveModule(suggestion.moduleId)}
        className="mt-2 flex w-full items-center justify-between gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      >
        {suggestion.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
