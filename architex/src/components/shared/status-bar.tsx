"use client";

import { memo, useMemo } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useViewportStore } from "@/stores/viewport-store";
import {
  Circle,
  DollarSign,
  Play,
  Pause,
  Square,
  ZoomIn,
} from "lucide-react";
import { SaveIndicator } from "@/components/shared/SaveIndicator";
import {
  calculateInfrastructureCost,
  type CostEstimate,
} from "@/lib/cost/cost-engine";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MODULE_LABELS: Record<string, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  lld: "Low-Level Design",
  database: "Database",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "OS Concepts",
  concurrency: "Concurrency",
  security: "Security",
  "ml-design": "ML Design",
  interview: "Interview",
};

function formatCostDisplay(cost: number): string {
  if (cost < 1) return "~$0/mo";
  if (cost >= 1000) {
    return `~$${(cost / 1000).toFixed(1)}K/mo`;
  }
  return `~$${Math.round(cost).toLocaleString()}/mo`;
}

function getCostColor(cost: number): string {
  if (cost < 1000) return "text-state-success";
  if (cost < 5000) return "text-state-warning";
  return "text-state-error";
}

function CostPopoverContent({ estimate }: { estimate: CostEstimate }) {
  const sorted = [...estimate.components].sort(
    (a, b) => b.monthlyCost - a.monthlyCost,
  );

  return (
    <div className="w-64">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Cost Breakdown
        </span>
        <span className="text-xs font-mono font-bold text-foreground">
          ${Math.round(estimate.totalMonthlyCost).toLocaleString()}/mo
        </span>
      </div>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {sorted.map((c) => (
          <div key={c.nodeId} className="flex items-center justify-between text-[11px]">
            <span className="truncate text-foreground-muted">{c.label}</span>
            <span className="ml-2 shrink-0 font-mono text-foreground">
              ${Math.round(c.monthlyCost).toLocaleString()}
            </span>
          </div>
        ))}
        {estimate.dataTransferCost > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="truncate text-foreground-muted">Data Transfer</span>
            <span className="ml-2 shrink-0 font-mono text-foreground">
              ${Math.round(estimate.dataTransferCost).toLocaleString()}
            </span>
          </div>
        )}
      </div>
      {sorted.length === 0 && (
        <div className="py-2 text-center text-[11px] text-foreground-muted">
          Add components to see costs
        </div>
      )}
    </div>
  );
}

export const StatusBar = memo(function StatusBar() {
  const activeModule = useUIStore((s) => s.activeModule);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const simStatus = useSimulationStore((s) => s.status);
  const zoom = useViewportStore((s) => s.zoom);

  const costEstimate = useMemo(
    () => calculateInfrastructureCost(nodes, edges),
    [nodes, edges],
  );

  const statusIcon = {
    idle: <Circle className="h-3 w-3 text-state-idle" />,
    running: <Play className="h-3 w-3 fill-state-success text-state-success" />,
    paused: <Pause className="h-3 w-3 text-state-warning" />,
    completed: <Square className="h-3 w-3 text-state-active" />,
    error: <Circle className="h-3 w-3 fill-state-error text-state-error" />,
  }[simStatus];

  return (
    <div role="status" data-onboarding="status-bar" className="flex h-6 items-center justify-between border-t border-border bg-statusbar px-3 text-xs text-statusbar-foreground">
      <div className="flex items-center gap-4">
        <span className="font-medium text-primary">
          {MODULE_LABELS[activeModule]}
        </span>
        <span>
          {nodes.length} nodes / {edges.length} edges
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          {statusIcon}
          <span className="capitalize">{simStatus}</span>
        </div>

        {/* Save Status */}
        <SaveIndicator />

        {/* Live Cost Indicator */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1 rounded px-1.5 py-0.5 font-mono transition-colors hover:bg-elevated",
                getCostColor(costEstimate.totalMonthlyCost),
              )}
            >
              <DollarSign className="h-3 w-3" />
              <span>{formatCostDisplay(costEstimate.totalMonthlyCost)}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-72 p-3">
            <CostPopoverContent estimate={costEstimate} />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1">
          <ZoomIn className="h-3 w-3" />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
        <span className="hidden text-foreground-subtle sm:inline">
          ⌘K for commands
        </span>
      </div>
    </div>
  );
});
