"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Bridge Button Component (CROSS-004)
// ─────────────────────────────────────────────────────────────

import React, { memo, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import { useUIStore } from "@/stores/ui-store";
import type { ModuleType } from "@/stores/ui-store";
import type { BridgePayload } from "@/lib/cross-module/bridge-types";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/cross-module/bridge-types";

interface BridgeButtonProps {
  payload: BridgePayload;
  label: string;
  sourceModule: ModuleType;
  targetModule: ModuleType;
  icon?: React.ReactNode;
  variant?: "default" | "compact" | "card";
  className?: string;
}

export const BridgeButton = memo(function BridgeButton({
  payload,
  label,
  sourceModule,
  targetModule,
  icon,
  variant = "default",
  className,
}: BridgeButtonProps) {
  const setBridge = useCrossModuleStore((s) => s.setBridge);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const handleClick = useCallback(() => {
    setBridge(payload, sourceModule, targetModule);
    setActiveModule(targetModule);
  }, [setBridge, setActiveModule, payload, sourceModule, targetModule]);

  const accentColor = MODULE_COLORS[targetModule];
  const targetLabel = MODULE_LABELS[targetModule];

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium",
          "bg-[var(--bg-secondary)] text-[var(--text-secondary)]",
          "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
          "transition-colors",
          className,
        )}
        title={`Bridge to ${targetLabel}`}
      >
        {icon}
        <span>{label}</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-start gap-3 rounded-lg border p-3 text-left",
          "border-[var(--border-primary)] bg-[var(--bg-secondary)]",
          "hover:border-[var(--border-accent)] hover:bg-[var(--bg-tertiary)]",
          "transition-colors",
          className,
        )}
      >
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
        >
          {icon ?? <ArrowRight className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {label}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            Opens in {targetLabel}
          </p>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--text-tertiary)]" />
      </button>
    );
  }

  // Default variant
  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
        "border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
        "hover:border-[var(--border-accent)] hover:bg-[var(--bg-tertiary)]",
        "transition-colors",
        className,
      )}
    >
      {icon}
      <span>{label}</span>
      <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)]" />
    </button>
  );
});
