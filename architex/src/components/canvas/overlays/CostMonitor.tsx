'use client';

/**
 * CostMonitor (UI-004)
 *
 * Live cost panel showing per-node and total infrastructure cost during
 * active simulation. Reads from cost-model.ts LiveCostState via the
 * orchestrator.
 *
 * Shows $/hr, cumulative cost, monthly projection, and a budget gauge.
 * Collapsible by the user. Visible only when simulation is active.
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import type { LiveCostState } from '@/lib/simulation/cost-model';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default monthly budget threshold (USD). */
const DEFAULT_BUDGET = 10_000;

// ---------------------------------------------------------------------------
// Budget gauge color
// ---------------------------------------------------------------------------

function getBudgetColor(ratio: number): string {
  if (ratio >= 0.9) return 'var(--severity-critical)';
  if (ratio >= 0.7) return 'var(--severity-high)';
  if (ratio >= 0.5) return 'var(--severity-medium)';
  return 'var(--state-success)';
}

// ---------------------------------------------------------------------------
// CostMonitor
// ---------------------------------------------------------------------------

export const CostMonitor = memo(function CostMonitor() {
  const status = useSimulationStore((s) => s.status);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const nodes = useCanvasStore((s) => s.nodes);

  const [collapsed, setCollapsed] = useState(false);
  const [costState, setCostState] = useState<LiveCostState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef<number>(0);

  const isActive = status === 'running' || status === 'paused';

  // Poll cost state via rAF (not every tick)
  useEffect(() => {
    if (!isActive || !orchestratorRef) {
      setCostState(null);
      return;
    }

    let cancelled = false;

    function tick() {
      if (cancelled) return;
      const state = orchestratorRef!.getCostState();
      setCostState({ ...state, costByNode: new Map(state.costByNode) });
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, orchestratorRef]);

  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), []);
  const toggleExpanded = useCallback(() => setExpanded((v) => !v), []);

  if (!isActive) return null;

  const hourly = costState?.currentHourlyRate ?? 0;
  const accumulated = costState?.accumulatedCost ?? 0;
  const monthly = costState?.projectedMonthlyCost ?? 0;
  const budgetRatio = monthly / DEFAULT_BUDGET;
  const budgetColor = getBudgetColor(budgetRatio);

  // Build per-node cost list
  const nodeCosts: { id: string; label: string; cost: number }[] = [];
  if (costState?.costByNode) {
    for (const [nodeId, cost] of costState.costByNode) {
      const node = nodes.find((n) => n.id === nodeId);
      const label =
        (node?.data as Record<string, unknown> | undefined)?.label as string ??
        nodeId;
      nodeCosts.push({ id: nodeId, label, cost });
    }
    nodeCosts.sort((a, b) => b.cost - a.cost);
  }

  return (
    <div className="pointer-events-auto absolute right-4 top-20 z-20 w-56">
      <div className="rounded-xl border border-border bg-background/90 shadow-lg backdrop-blur-sm">
        {/* Header */}
        <button
          onClick={toggleCollapsed}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-elevated"
        >
          <DollarSign className="h-3.5 w-3.5 text-node-messaging" />
          <span>Cost Monitor</span>
          <span className="ml-auto font-mono tabular-nums text-foreground-muted">
            ${hourly.toFixed(2)}/hr
          </span>
          {collapsed ? (
            <ChevronDown className="h-3 w-3 text-foreground-muted" />
          ) : (
            <ChevronUp className="h-3 w-3 text-foreground-muted" />
          )}
        </button>

        {!collapsed && (
          <div className="border-t border-border px-3 pb-3 pt-2">
            {/* Summary metrics */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Hourly Rate</span>
                <span className="font-mono tabular-nums text-foreground">
                  ${hourly.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Accumulated</span>
                <span className="font-mono tabular-nums text-foreground">
                  ${accumulated.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Monthly Proj.</span>
                <span className="font-mono tabular-nums text-foreground">
                  ${monthly.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Budget gauge */}
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-foreground-muted">Budget</span>
                <span className="font-mono tabular-nums" style={{ color: budgetColor }}>
                  {(budgetRatio * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(budgetRatio * 100, 100)}%`,
                    backgroundColor: budgetColor,
                  }}
                />
              </div>
            </div>

            {/* Per-component breakdown (expandable) */}
            {nodeCosts.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={toggleExpanded}
                  className="flex w-full items-center gap-1 text-[10px] font-medium text-foreground-muted transition-colors hover:text-foreground"
                >
                  {expanded ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  Per-Component ({nodeCosts.length})
                </button>

                {expanded && (
                  <div className="mt-1.5 max-h-40 space-y-1 overflow-y-auto">
                    {nodeCosts.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-[10px]"
                      >
                        <span className="max-w-[120px] truncate text-foreground-muted">
                          {item.label}
                        </span>
                        <span className="font-mono tabular-nums text-foreground">
                          ${item.cost.toFixed(4)}/hr
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
