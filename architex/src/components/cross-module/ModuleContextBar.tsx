"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Module Context Bar (CROSS-006)
// Shows "You came from [Module A] -> [Module B]" with back nav.
// ─────────────────────────────────────────────────────────────

import { memo, useCallback } from "react";
import { ArrowLeft, ArrowRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import { useUIStore } from "@/stores/ui-store";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/cross-module/bridge-types";

interface ModuleContextBarProps {
  className?: string;
}

export const ModuleContextBar = memo(function ModuleContextBar({
  className,
}: ModuleContextBarProps) {
  const activeContext = useCrossModuleStore((s) => s.activeContext);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const handleGoBack = useCallback(() => {
    if (!activeContext) return;
    setActiveModule(activeContext.sourceModule);
  }, [activeContext, setActiveModule]);

  // Only render if there is active bridge context
  if (!activeContext) return null;

  const sourceColor = MODULE_COLORS[activeContext.sourceModule];
  const targetColor = MODULE_COLORS[activeContext.targetModule];
  const sourceLabel = MODULE_LABELS[activeContext.sourceModule];
  const targetLabel = MODULE_LABELS[activeContext.targetModule];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-3 py-1.5",
        className,
      )}
    >
      <Zap className="h-3.5 w-3.5 text-amber-400" />

      <span className="text-xs text-[var(--text-tertiary)]">
        You came from
      </span>

      <span
        className="rounded-md px-1.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${sourceColor}20`, color: sourceColor }}
      >
        {sourceLabel}
      </span>

      <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />

      <span
        className="rounded-md px-1.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: `${targetColor}20`, color: targetColor }}
      >
        {targetLabel}
      </span>

      <div className="flex-1" />

      <button
        type="button"
        onClick={handleGoBack}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
          "text-[var(--text-secondary)]",
          "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
          "transition-colors",
        )}
      >
        <ArrowLeft className="h-3 w-3" />
        Back to {sourceLabel}
      </button>
    </div>
  );
});
