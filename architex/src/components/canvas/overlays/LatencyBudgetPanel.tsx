"use client";

import { memo, useMemo, useState, useCallback } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  calculateLatencyBudget,
  type LatencyBudget,
  type LatencyHop,
} from "@/lib/simulation/latency-budget";
import { NODE_CATEGORY_COLORS_IBM } from "@/lib/visualization/colors";
import type { NodeCategory } from "@/lib/types";

// ---------------------------------------------------------------------------
// Category-to-color mapping for the bar segments
// ---------------------------------------------------------------------------

const CATEGORY_BAR_COLORS: Record<string, string> = {
  compute: NODE_CATEGORY_COLORS_IBM.compute,
  "load-balancing": NODE_CATEGORY_COLORS_IBM["load-balancing"],
  storage: NODE_CATEGORY_COLORS_IBM.storage,
  messaging: NODE_CATEGORY_COLORS_IBM.messaging,
  networking: NODE_CATEGORY_COLORS_IBM.networking,
  processing: NODE_CATEGORY_COLORS_IBM.processing,
  client: NODE_CATEGORY_COLORS_IBM.client,
  observability: NODE_CATEGORY_COLORS_IBM.observability,
  security: NODE_CATEGORY_COLORS_IBM.security,
};

function getCategoryColor(category: string): string {
  return CATEGORY_BAR_COLORS[category] ?? "#9E9E9E";
}

// ---------------------------------------------------------------------------
// Stacked horizontal bar chart
// ---------------------------------------------------------------------------

function LatencyBar({
  hops,
  budget,
  bottleneckId,
}: {
  hops: LatencyHop[];
  budget: LatencyBudget;
  bottleneckId: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Scale: bar represents max(actualTotal, budgetMs)
  const scaleMax = Math.max(budget.actualTotalMs, budget.totalBudgetMs) * 1.1;

  // Budget line position as percentage
  const budgetPct = (budget.totalBudgetMs / scaleMax) * 100;

  return (
    <div className="relative">
      {/* Scale labels */}
      <div className="mb-1 flex justify-between text-[10px] font-mono text-foreground-muted">
        <span>0ms</span>
        <span>{scaleMax.toFixed(0)}ms</span>
      </div>

      {/* Bar container */}
      <div className="relative h-10 w-full overflow-hidden rounded-md bg-muted">
        {/* Segments */}
        <div className="absolute inset-0 flex">
          {hops.map((hop, i) => {
            const widthPct = (hop.latencyMs / scaleMax) * 100;
            const isBottleneck = hop.nodeId === bottleneckId;
            const isHovered = hoveredIndex === i;

            return (
              <div
                key={hop.nodeId}
                className={cn(
                  "relative flex items-center justify-center overflow-hidden transition-opacity",
                  isHovered ? "opacity-100" : "opacity-85",
                  isBottleneck && "ring-2 ring-red-500 ring-inset",
                )}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: getCategoryColor(hop.category),
                  minWidth: widthPct > 0 ? "2px" : "0",
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {widthPct > 8 && (
                  <span className="truncate px-1 text-[10px] font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                    {hop.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Budget line */}
        <div
          className="absolute top-0 bottom-0 z-10 w-0.5"
          style={{ left: `${budgetPct}%` }}
        >
          <div className="h-full w-full border-l-2 border-dashed border-red-500" />
          <div className="absolute -top-4 left-1 whitespace-nowrap text-[10px] font-semibold text-red-400">
            {budget.totalBudgetMs}ms budget
          </div>
        </div>
      </div>

      {/* Tooltip for hovered segment */}
      {hoveredIndex !== null && hops[hoveredIndex] && (
        <div className="mt-1 rounded-md bg-elevated px-2 py-1 text-xs">
          <span className="font-medium text-foreground">
            {hops[hoveredIndex].label}
          </span>
          <span className="mx-1 text-foreground-muted">
            ({hops[hoveredIndex].componentType})
          </span>
          <span className="font-mono text-foreground">
            {hops[hoveredIndex].latencyMs.toFixed(1)}ms
          </span>
          <span className="ml-1 text-foreground-muted">
            ({hops[hoveredIndex].percentage.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-hop detail rows
// ---------------------------------------------------------------------------

function HopRow({
  hop,
  isBottleneck,
}: {
  hop: LatencyHop;
  isBottleneck: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1 text-xs",
        isBottleneck && "bg-red-500/10",
      )}
    >
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-sm"
        style={{ backgroundColor: getCategoryColor(hop.category) }}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isBottleneck ? "font-semibold text-red-400" : "text-foreground",
        )}
      >
        {hop.label}
      </span>
      <span className="shrink-0 font-mono text-foreground-muted">
        {hop.latencyMs.toFixed(1)}ms
      </span>
      <span className="shrink-0 w-12 text-right font-mono text-foreground-muted">
        {hop.percentage.toFixed(0)}%
      </span>
      {isBottleneck && (
        <span className="shrink-0 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-medium uppercase text-red-400">
          bottleneck
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export const LatencyBudgetPanel = memo(function LatencyBudgetPanel() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const [budgetMs, setBudgetMs] = useState(200);

  const budget: LatencyBudget = useMemo(
    () => calculateLatencyBudget(nodes, edges, budgetMs),
    [nodes, edges, budgetMs],
  );

  const handleBudgetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setBudgetMs(Number(e.target.value));
    },
    [],
  );

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Add nodes to the canvas to analyze latency budget
      </div>
    );
  }

  if (budget.hops.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        No request path found — connect nodes with edges
      </div>
    );
  }

  const deltaMs = Math.abs(budget.actualTotalMs - budget.totalBudgetMs);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-3">
      {/* Header row: badge + budget slider */}
      <div className="flex items-center gap-3">
        {/* Over/Under budget badge */}
        {budget.overBudget ? (
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            Over budget by {deltaMs.toFixed(1)}ms
          </div>
        ) : (
          <div className="flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Under budget by {deltaMs.toFixed(1)}ms
          </div>
        )}

        {/* Total latency */}
        <div className="flex items-center gap-1 text-xs text-foreground-muted">
          <Timer className="h-3.5 w-3.5" />
          <span className="font-mono">{budget.actualTotalMs.toFixed(1)}ms</span>
          <span>total</span>
        </div>

        {/* Budget slider */}
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="latency-budget-slider" className="text-[11px] text-foreground-muted">
            Budget (p99):
          </label>
          <input
            id="latency-budget-slider"
            type="range"
            min={50}
            max={1000}
            step={10}
            value={budgetMs}
            onChange={handleBudgetChange}
            className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
          />
          <span className="w-14 text-right font-mono text-xs text-foreground">
            {budgetMs}ms
          </span>
        </div>
      </div>

      {/* Stacked bar chart */}
      <LatencyBar
        hops={budget.hops}
        budget={budget}
        bottleneckId={budget.bottleneck.nodeId}
      />

      {/* Two-column layout: hops list + recommendations */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Hop breakdown */}
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            Critical Path ({budget.hops.length} hops)
          </div>
          {budget.hops.map((hop) => (
            <HopRow
              key={hop.nodeId}
              hop={hop}
              isBottleneck={hop.nodeId === budget.bottleneck.nodeId}
            />
          ))}
        </div>

        {/* Recommendations */}
        {budget.recommendations.length > 0 && (
          <div className="flex w-72 shrink-0 flex-col gap-1 overflow-y-auto">
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              <Lightbulb className="h-3 w-3" />
              Recommendations
            </div>
            {budget.recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-md bg-elevated px-2 py-1.5 text-[11px] leading-relaxed text-foreground-muted"
              >
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
