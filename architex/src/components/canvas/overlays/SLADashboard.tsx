"use client";

import { memo, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/stores/canvas-store";
import {
  calculateSLA,
  availabilityToNines,
  formatDowntime,
  type SLAResult,
} from "@/lib/simulation/sla-calculator";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Big hero number showing overall availability. */
function AvailabilityHero({ result }: { result: SLAResult }) {
  const pct = result.overallAvailability * 100;
  const isGood = result.overallAvailability >= 0.999;
  const isOk = result.overallAvailability >= 0.99;

  const colorClass = isGood
    ? "text-green-400"
    : isOk
      ? "text-amber-400"
      : "text-red-400";

  const badgeClass = isGood
    ? "bg-green-500/20 text-green-400"
    : isOk
      ? "bg-amber-500/20 text-amber-400"
      : "bg-red-500/20 text-red-400";

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className={cn("text-2xl font-bold tabular-nums", colorClass)}>
          {pct.toFixed(
            Math.max(2, Math.ceil(-Math.log10(1 - result.overallAvailability))),
          )}
          %
        </span>
        <span className="text-[11px] text-foreground-muted">
          Overall Availability
        </span>
      </div>
      <div className="flex flex-col items-start gap-1">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-xs font-semibold",
            badgeClass,
          )}
        >
          {result.nines}
        </span>
        <span className="text-xs text-foreground-muted">
          {formatDowntime(result.annualDowntimeMinutes)} downtime
        </span>
      </div>
    </div>
  );
}

/** Per-component availability table. */
function ComponentTable({
  result,
}: {
  result: SLAResult;
}) {
  const weakestSet = useMemo(
    () => new Set(result.weakestPath),
    [result.weakestPath],
  );

  if (result.perComponentAvailability.length === 0) return null;

  return (
    <div className="flex flex-col overflow-hidden rounded-md border border-border">
      {/* Header */}
      <div className="flex items-center bg-elevated px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        <span className="flex-1">Component</span>
        <span className="w-24 text-right">Availability</span>
        <span className="w-16 text-center">Status</span>
      </div>
      {/* Rows */}
      <div className="max-h-40 overflow-y-auto">
        {result.perComponentAvailability.map((comp) => {
          const isOnWeakest = weakestSet.has(comp.nodeId);
          return (
            <div
              key={comp.nodeId}
              className={cn(
                "flex items-center border-t border-border px-3 py-1.5 text-xs",
                isOnWeakest && "bg-amber-500/5",
              )}
            >
              <span
                className={cn(
                  "flex-1 truncate",
                  isOnWeakest ? "text-foreground" : "text-foreground-muted",
                )}
              >
                {comp.label}
                {isOnWeakest && (
                  <TrendingDown className="ml-1 inline-block h-3 w-3 text-amber-400" />
                )}
              </span>
              <span className="w-24 text-right font-mono text-foreground">
                {(comp.availability * 100).toFixed(3)}%
              </span>
              <span className="flex w-16 justify-center">
                {comp.isSPOF ? (
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-400">
                    SPOF
                  </span>
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Recommendations list. */
function RecommendationsList({
  recommendations,
}: {
  recommendations: string[];
}) {
  if (recommendations.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
        <ShieldAlert className="h-3 w-3" />
        Recommendations
      </div>
      <div className="space-y-1">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md bg-elevated px-3 py-2 text-xs text-foreground"
          >
            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
            <span>{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SLA Dashboard (rendered inside BottomPanel "SLA" tab)
// ---------------------------------------------------------------------------

export const SLADashboard = memo(function SLADashboard() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const result = useMemo(() => calculateSLA(nodes, edges), [nodes, edges]);

  // Empty state
  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        <div className="flex flex-col items-center gap-2">
          <Shield className="h-8 w-8 text-foreground-muted/50" />
          <span>Add components to calculate SLA</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 overflow-y-auto p-3">
      {/* Left column: hero + recommendations */}
      <div className="flex w-72 shrink-0 flex-col gap-4">
        <AvailabilityHero result={result} />

        {/* Weakest path summary */}
        {result.weakestPath.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
              Weakest Path ({result.weakestPath.length} hops)
            </span>
            <div className="flex flex-wrap gap-1">
              {result.weakestPath.map((nodeId, idx) => {
                const comp = result.perComponentAvailability.find(
                  (c) => c.nodeId === nodeId,
                );
                return (
                  <span key={nodeId} className="flex items-center gap-1">
                    <span
                      className={cn(
                        "rounded bg-elevated px-1.5 py-0.5 text-[11px] font-mono",
                        comp?.isSPOF
                          ? "border border-red-500/30 text-red-400"
                          : "text-foreground-muted",
                      )}
                    >
                      {comp?.label ?? nodeId}
                    </span>
                    {idx < result.weakestPath.length - 1 && (
                      <span className="text-[10px] text-foreground-muted">
                        {"\u2192"}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <RecommendationsList recommendations={result.recommendations} />
      </div>

      {/* Right column: component table */}
      <div className="flex-1">
        <ComponentTable result={result} />
      </div>
    </div>
  );
});
