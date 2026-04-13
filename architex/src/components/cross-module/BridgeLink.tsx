"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Bridge Link Component (CROSS-005)
// Clickable link that navigates to another module with context.
// ─────────────────────────────────────────────────────────────

import { memo, useCallback } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCrossModuleStore } from "@/stores/cross-module-store";
import { useUIStore } from "@/stores/ui-store";
import type { ModuleType } from "@/stores/ui-store";
import type { BridgeLink as BridgeLinkType } from "@/lib/cross-module/bridge-types";
import { MODULE_LABELS, MODULE_COLORS } from "@/lib/cross-module/bridge-types";

interface BridgeLinkProps {
  bridge: BridgeLinkType;
  className?: string;
  showDescription?: boolean;
}

export const BridgeLink = memo(function BridgeLink({
  bridge,
  className,
  showDescription = false,
}: BridgeLinkProps) {
  const setBridge = useCrossModuleStore((s) => s.setBridge);
  const setActiveModule = useUIStore((s) => s.setActiveModule);

  const handleClick = useCallback(() => {
    const payload = bridge.payloadFactory();
    setBridge(payload, bridge.sourceModule, bridge.targetModule);
    setActiveModule(bridge.targetModule);
  }, [setBridge, setActiveModule, bridge]);

  const targetColor = MODULE_COLORS[bridge.targetModule];
  const targetLabel = MODULE_LABELS[bridge.targetModule];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-left",
        "hover:bg-[var(--bg-secondary)]",
        "transition-colors",
        className,
      )}
    >
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: targetColor }}
      />
      <div className="min-w-0 flex-1">
        <span className="font-medium text-[var(--text-primary)]">
          {bridge.label}
        </span>
        {showDescription && (
          <p className="mt-0.5 text-[var(--text-tertiary)] leading-tight">
            {bridge.description}
          </p>
        )}
      </div>
      <ArrowUpRight className="h-3 w-3 shrink-0 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
});
