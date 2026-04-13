'use client';

import { memo, useCallback, useState } from 'react';
import {
  X,
  Trash2,
  Zap,
  Database,
  Server,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  Loader2,
  Lightbulb,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/stores/canvas-store';
import { useSimulationStore } from '@/stores/simulation-store';
import {
  runWhatIfScenario,
  type WhatIfScenario,
  type WhatIfResult,
} from '@/lib/simulation/what-if-engine';

// ── Types ────────────────────────────────────────────────────

interface WhatIfPanelProps {
  onClose: () => void;
}

// ── Metric card ──────────────────────────────────────────────

interface MetricCompareProps {
  label: string;
  original: number;
  modified: number;
  delta: string;
  unit: string;
  /** Whether lower is better (e.g. latency, errorRate). */
  lowerIsBetter?: boolean;
}

function MetricCompare({
  label,
  original,
  modified,
  delta,
  unit,
  lowerIsBetter = false,
}: MetricCompareProps) {
  const isImproved = lowerIsBetter
    ? modified < original
    : modified > original;
  const isWorsened = lowerIsBetter
    ? modified > original
    : modified < original;

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border bg-surface/60 px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs text-muted-foreground">
            {formatValue(original, unit)}
          </span>
          <span className="text-muted-foreground">{'→'}</span>
          <span className="text-sm font-semibold text-foreground">
            {formatValue(modified, unit)}
          </span>
        </div>
        <span
          className={cn(
            'text-xs font-medium',
            isImproved && 'text-emerald-400',
            isWorsened && 'text-red-400',
            !isImproved && !isWorsened && 'text-muted-foreground',
          )}
        >
          {delta}
        </span>
      </div>
    </div>
  );
}

function formatValue(value: number, unit: string): string {
  if (unit === '%') return `${(value * 100).toFixed(1)}%`;
  if (unit === 'ms') return `${value.toFixed(1)}ms`;
  if (unit === 'req/s') return `${value.toFixed(0)} req/s`;
  if (unit === '$') return `$${value.toFixed(0)}/mo`;
  return `${value.toFixed(1)}`;
}

// ── Scenario button ──────────────────────────────────────────

interface ScenarioButtonProps {
  label: string;
  description: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}

function ScenarioButton({
  label,
  description,
  icon,
  disabled = false,
  onClick,
}: ScenarioButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-left transition-colors',
        'hover:border-primary/40 hover:bg-surface/80',
        'disabled:pointer-events-none disabled:opacity-40',
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="truncate text-[11px] text-muted-foreground">
          {description}
        </div>
      </div>
    </button>
  );
}

// ── Main panel ───────────────────────────────────────────────

export const WhatIfPanel = memo(function WhatIfPanel({
  onClose,
}: WhatIfPanelProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);
  const trafficConfig = useSimulationStore((s) => s.trafficConfig);

  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const selectedNodeId = selectedNodeIds.length === 1 ? selectedNodeIds[0] : null;
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null;
  const selectedLabel = selectedNode
    ? ((selectedNode.data as Record<string, unknown>).label as string) ?? 'Selected Node'
    : null;

  const hasNodes = nodes.length > 0;

  const runScenario = useCallback(
    (scenario: WhatIfScenario) => {
      setIsRunning(true);
      // Use a microtask to let the UI update with the loading state
      queueMicrotask(() => {
        const r = runWhatIfScenario(nodes, edges, trafficConfig, scenario);
        setResult(r);
        setIsRunning(false);
      });
    },
    [nodes, edges, trafficConfig],
  );

  const handleRemoveSelected = useCallback(() => {
    if (!selectedNodeId) return;
    runScenario({
      id: `remove-${selectedNodeId}`,
      name: `Remove ${selectedLabel}`,
      type: 'remove-node',
      targetNodeId: selectedNodeId,
    });
  }, [selectedNodeId, selectedLabel, runScenario]);

  const handleDoubleTraffic = useCallback(() => {
    runScenario({
      id: 'double-traffic',
      name: '2x Traffic',
      type: 'double-traffic',
      multiplier: 2,
    });
  }, [runScenario]);

  const handleAddCache = useCallback(() => {
    if (!selectedNodeId) return;
    runScenario({
      id: `add-cache-${selectedNodeId}`,
      name: `Add Cache before ${selectedLabel}`,
      type: 'add-cache',
      targetNodeId: selectedNodeId,
    });
  }, [selectedNodeId, selectedLabel, runScenario]);

  const handleScaleUp = useCallback(() => {
    if (!selectedNodeId) return;
    runScenario({
      id: `scale-up-${selectedNodeId}`,
      name: `Scale ${selectedLabel} to 3 replicas`,
      type: 'scale-up',
      targetNodeId: selectedNodeId,
      multiplier: 3,
    });
  }, [selectedNodeId, selectedLabel, runScenario]);

  const handleScaleDown = useCallback(() => {
    if (!selectedNodeId) return;
    runScenario({
      id: `scale-down-${selectedNodeId}`,
      name: `Scale down ${selectedLabel}`,
      type: 'scale-down',
      targetNodeId: selectedNodeId,
    });
  }, [selectedNodeId, selectedLabel, runScenario]);

  const handleInjectFailure = useCallback(() => {
    if (!selectedNodeId) return;
    runScenario({
      id: `failure-${selectedNodeId}`,
      name: `Inject failure on ${selectedLabel}`,
      type: 'inject-failure',
      targetNodeId: selectedNodeId,
    });
  }, [selectedNodeId, selectedLabel, runScenario]);

  const handleRemoveCache = useCallback(() => {
    runScenario({
      id: 'remove-cache',
      name: 'Remove all caches',
      type: 'remove-cache',
    });
  }, [runScenario]);

  return (
    <div
      className={cn(
        'pointer-events-auto',
        'absolute right-4 top-4 z-50',
        'flex w-full max-w-[340px] flex-col',
        'rounded-xl border border-border bg-surface/95 shadow-2xl backdrop-blur-lg',
        'max-h-[calc(100vh-120px)] overflow-hidden',
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-foreground">
            What If?
          </h3>
        </div>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* ── Selection hint ── */}
        {selectedLabel ? (
          <p className="mb-3 text-xs text-muted-foreground">
            Target: <span className="font-medium text-foreground">{selectedLabel}</span>
          </p>
        ) : (
          <p className="mb-3 text-xs text-muted-foreground">
            Select a node on the canvas for node-specific scenarios.
          </p>
        )}

        {/* ── Scenario buttons ── */}
        <div className="flex flex-col gap-2">
          <ScenarioButton
            label="Remove Selected"
            description={selectedLabel ? `Remove "${selectedLabel}" and see impact` : 'Select a node first'}
            icon={<Trash2 className="h-4 w-4" />}
            disabled={!selectedNodeId || !hasNodes}
            onClick={handleRemoveSelected}
          />
          <ScenarioButton
            label="2x Traffic"
            description="Double request rate across the system"
            icon={<TrendingUp className="h-4 w-4" />}
            disabled={!hasNodes}
            onClick={handleDoubleTraffic}
          />
          <ScenarioButton
            label="Add Cache"
            description={selectedLabel ? `Add a cache before "${selectedLabel}"` : 'Select a node first'}
            icon={<Database className="h-4 w-4" />}
            disabled={!selectedNodeId || !hasNodes}
            onClick={handleAddCache}
          />
          <ScenarioButton
            label="Scale Up (3x)"
            description={selectedLabel ? `Scale "${selectedLabel}" to 3 replicas` : 'Select a node first'}
            icon={<Server className="h-4 w-4" />}
            disabled={!selectedNodeId || !hasNodes}
            onClick={handleScaleUp}
          />
          <ScenarioButton
            label="Scale Down"
            description={selectedLabel ? `Halve "${selectedLabel}" replicas` : 'Select a node first'}
            icon={<ArrowDownCircle className="h-4 w-4" />}
            disabled={!selectedNodeId || !hasNodes}
            onClick={handleScaleDown}
          />
          <ScenarioButton
            label="Inject Failure"
            description={selectedLabel ? `Crash "${selectedLabel}" and observe` : 'Select a node first'}
            icon={<AlertTriangle className="h-4 w-4" />}
            disabled={!selectedNodeId || !hasNodes}
            onClick={handleInjectFailure}
          />
          <ScenarioButton
            label="Remove All Caches"
            description="Remove every cache node from the architecture"
            icon={<TrendingDown className="h-4 w-4" />}
            disabled={!hasNodes}
            onClick={handleRemoveCache}
          />
        </div>

        {/* ── Loading state ── */}
        {isRunning && (
          <div className="mt-4 flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Running simulation...
          </div>
        )}

        {/* ── Results ── */}
        {result && !isRunning && (
          <div className="mt-4 flex flex-col gap-3">
            {/* Scenario name */}
            <div className="rounded-lg bg-primary/5 px-3 py-2">
              <span className="text-xs font-medium text-primary">
                {result.scenario.name}
              </span>
            </div>

            {/* Metric comparisons */}
            <MetricCompare
              label="Avg Latency"
              original={result.originalMetrics.avgLatency}
              modified={result.modifiedMetrics.avgLatency}
              delta={result.delta.latencyChange}
              unit="ms"
              lowerIsBetter
            />
            <MetricCompare
              label="Throughput"
              original={result.originalMetrics.throughput}
              modified={result.modifiedMetrics.throughput}
              delta={result.delta.throughputChange}
              unit="req/s"
            />
            <MetricCompare
              label="Error Rate"
              original={result.originalMetrics.errorRate}
              modified={result.modifiedMetrics.errorRate}
              delta={result.delta.errorRateChange}
              unit="%"
              lowerIsBetter
            />
            <MetricCompare
              label="Est. Cost"
              original={result.originalMetrics.cost}
              modified={result.modifiedMetrics.cost}
              delta={result.delta.costChange}
              unit="$"
              lowerIsBetter
            />

            {/* Insights */}
            {result.insights.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface/40 px-3 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Insights
                  </span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {result.insights.map((insight, i) => (
                    <li
                      key={i}
                      className="text-xs leading-relaxed text-muted-foreground"
                    >
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
