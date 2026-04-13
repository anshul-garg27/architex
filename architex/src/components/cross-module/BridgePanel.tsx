"use client";

// ─────────────────────────────────────────────────────────────
// Architex — Bridge Panel (CROSS-004 / CROSS-010)
// Panel showing available cross-module connections from context.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { getBridgesFromModule } from "@/lib/cross-module/bridge-registry";
import { BridgeLink } from "./BridgeLink";

interface BridgePanelProps {
  className?: string;
}

export const BridgePanel = memo(function BridgePanel({
  className,
}: BridgePanelProps) {
  const activeModule = useUIStore((s) => s.activeModule);

  const bridges = useMemo(
    () => getBridgesFromModule(activeModule),
    [activeModule],
  );

  if (bridges.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border-primary)] px-3 py-2">
        <Link2 className="h-3.5 w-3.5 text-[var(--text-accent)]" />
        <h4 className="text-xs font-semibold text-[var(--text-primary)]">
          Cross-Module Bridges
        </h4>
        <span className="rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--text-tertiary)]">
          {bridges.length}
        </span>
      </div>

      <div className="p-1">
        {bridges.map((bridge) => (
          <BridgeLink
            key={bridge.id}
            bridge={bridge}
            showDescription
          />
        ))}
      </div>
    </div>
  );
});
