"use client";

import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  DollarSign,
  Info,
  Lightbulb,
  Shield,
  Terminal,
  Timer,
  Trash2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import { useSimulationStore } from "@/stores/simulation-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { MetricsDashboard } from "@/components/visualization/charts/MetricsDashboard";
import {
  CHAOS_EVENTS,
  type ChaosCategory,
  type ChaosSeverity,
  type ChaosEventType,
} from "@/lib/simulation/chaos-engine";
import {
  estimateCapacity,
  type CapacityInput,
  type CapacityEstimate,
} from "@/lib/simulation/capacity-planner";
import {
  calculateInfrastructureCost,
  aggregateCostByCategory,
  generateOptimizationTips,
  type CostCategory,
} from "@/lib/cost/cost-engine";
import { SLADashboard } from "@/components/canvas/overlays/SLADashboard";
import { LatencyBudgetPanel } from "@/components/canvas/overlays/LatencyBudgetPanel";
import { PostSimulationReport } from "@/components/canvas/panels/tabs/PostSimulationReport";

const MetricsTab = memo(function MetricsTab() {
  return <MetricsDashboard />;
});

const TimelineTab = memo(function TimelineTab() {
  const status = useSimulationStore((s) => s.status);
  const currentTick = useSimulationStore((s) => s.currentTick);
  const totalTicks = useSimulationStore((s) => s.totalTicks);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const stop = useSimulationStore((s) => s.stop);
  const stepForward = useSimulationStore((s) => s.stepForward);
  const stepBackward = useSimulationStore((s) => s.stepBackward);
  const setTick = useSimulationStore((s) => s.setTick);
  const setPlaybackSpeed = useSimulationStore((s) => s.setPlaybackSpeed);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);

  const speeds = [0.25, 0.5, 1, 2, 4];

  // Build sparkline data and incident markers from tick history
  const tickHistory = useMemo(
    () => orchestratorRef?.getTickHistory() ?? [],
    // Re-derive when currentTick changes (cheap — just a ref read)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orchestratorRef, currentTick],
  );

  const incidentTicks = useMemo(
    () => tickHistory.filter((t) => t.nodeEvents.length > 0).map((t) => t.tick),
    [tickHistory],
  );

  // Jump to next incident
  const jumpToNextIncident = useCallback(() => {
    const next = incidentTicks.find((t) => t > currentTick);
    if (next != null && orchestratorRef) {
      orchestratorRef.seekTo(next);
    }
  }, [incidentTicks, currentTick, orchestratorRef]);

  // Sparkline SVG
  const sparklineWidth = 400;
  const sparklineHeight = 40;
  const sparklineSvg = useMemo(() => {
    if (tickHistory.length < 2) return null;

    const maxRps = Math.max(...tickHistory.map((t) => t.rpsAtTick), 1);
    const maxErr = Math.max(...tickHistory.map((t) => t.globalErrorRate), 0.01);
    const maxLat = Math.max(...tickHistory.map((t) => t.avgLatencyMs), 1);
    const len = tickHistory.length;

    function toPoints(values: number[], maxVal: number): string {
      return values
        .map((v, i) => {
          const x = (i / (len - 1)) * sparklineWidth;
          const y = sparklineHeight - (v / maxVal) * sparklineHeight;
          return `${x},${y}`;
        })
        .join(' ');
    }

    return {
      rps: toPoints(tickHistory.map((t) => t.rpsAtTick), maxRps),
      error: toPoints(tickHistory.map((t) => t.globalErrorRate), maxErr),
      latency: toPoints(tickHistory.map((t) => t.avgLatencyMs), maxLat),
    };
  }, [tickHistory]);

  return (
    <div className="flex h-full flex-col gap-3 p-3">
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={stepBackward}
          aria-label="Step backward"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
          title="Step backward"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </button>

        {status === "running" ? (
          <button
            onClick={pause}
            aria-label="Pause"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
            title="Pause"
          >
            <Pause className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={play}
            aria-label="Play"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
            title="Play"
          >
            <Play className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={stop}
          aria-label="Stop"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
          title="Stop"
        >
          <Square className="h-3.5 w-3.5" />
        </button>

        <button
          onClick={stepForward}
          aria-label="Step forward"
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
          title="Step forward"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>

        <div className="mx-2 h-4 w-px bg-border" />

        {/* Speed selector */}
        <div className="flex items-center gap-1">
          {speeds.map((speed) => (
            <button
              key={speed}
              onClick={() => setPlaybackSpeed(speed)}
              className={cn(
                "h-6 rounded px-1.5 text-xs font-mono transition-colors",
                playbackSpeed === speed
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground-muted hover:bg-elevated",
              )}
            >
              {speed}x
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs font-mono text-foreground-muted">
          Step {currentTick} / {totalTicks || "∞"}
        </div>
      </div>

      {/* Timeline scrubber with incident markers */}
      <div className="relative flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={totalTicks || 100}
          value={currentTick}
          aria-label="Timeline scrubber"
          onChange={(e) => setTick(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
        {/* Incident markers (red diamonds on top of the range track) */}
        {totalTicks > 0 &&
          incidentTicks.map((tick) => {
            const pct = (tick / totalTicks) * 100;
            return (
              <button
                key={tick}
                onClick={() => orchestratorRef?.seekTo(tick)}
                className="absolute h-2.5 w-2.5 rotate-45 bg-severity-critical"
                style={{ left: `${pct}%`, top: '-2px', transform: `translateX(-50%) rotate(45deg)` }}
                aria-label={`Incident at tick ${tick}`}
                title={`Incident at tick ${tick}`}
              />
            );
          })}
      </div>

      {/* Jump to next incident button */}
      {incidentTicks.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={jumpToNextIncident}
            className="flex items-center gap-1 rounded-md bg-severity-critical/10 px-2 py-1 text-[10px] font-medium text-severity-critical transition-colors hover:bg-severity-critical/20"
          >
            <AlertTriangle className="h-3 w-3" />
            Jump to Next Incident ({incidentTicks.length} total)
          </button>
        </div>
      )}

      {/* Sparkline chart */}
      {sparklineSvg && (
        <div className="overflow-x-auto rounded-lg border border-border bg-elevated p-2">
          <div className="mb-1 flex items-center gap-3 text-[9px] text-foreground-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-node-compute" />
              RPS
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-severity-critical" />
              Error Rate
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-3 rounded-full bg-node-networking" />
              Latency
            </span>
          </div>
          <svg
            viewBox={`0 0 ${sparklineWidth} ${sparklineHeight}`}
            className="h-10 w-full"
            preserveAspectRatio="none"
          >
            <polyline
              points={sparklineSvg.rps}
              fill="none"
              stroke="var(--node-compute)"
              strokeWidth="1.5"
            />
            <polyline
              points={sparklineSvg.error}
              fill="none"
              stroke="var(--severity-critical)"
              strokeWidth="1.5"
            />
            <polyline
              points={sparklineSvg.latency}
              fill="none"
              stroke="var(--node-networking)"
              strokeWidth="1.5"
            />
            {/* Current tick position indicator */}
            {totalTicks > 0 && (
              <line
                x1={(currentTick / totalTicks) * sparklineWidth}
                y1={0}
                x2={(currentTick / totalTicks) * sparklineWidth}
                y2={sparklineHeight}
                stroke="var(--foreground)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity={0.5}
              />
            )}
          </svg>
        </div>
      )}
    </div>
  );
});

function CodeTab() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
      Code editor will load here (Monaco)
    </div>
  );
}

const ConsoleTab = memo(function ConsoleTab() {
  const consoleMessages = useSimulationStore((s) => s.consoleMessages);
  const clearConsoleMessages = useSimulationStore(
    (s) => s.clearConsoleMessages,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleMessages.length]);

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    const s = d.getSeconds().toString().padStart(2, "0");
    const ms = d.getMilliseconds().toString().padStart(3, "0");
    return `${h}:${m}:${s}.${ms}`;
  };

  const levelIcon = (level: "info" | "warn" | "error") => {
    switch (level) {
      case "info":
        return <Info className="h-3 w-3 shrink-0 text-severity-info" />;
      case "warn":
        return <AlertTriangle className="h-3 w-3 shrink-0 text-amber-400" />;
      case "error":
        return <X className="h-3 w-3 shrink-0 text-severity-critical" />;
    }
  };

  if (consoleMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Simulation logs will appear here
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-end border-b border-border px-3 py-1">
        <button
          onClick={clearConsoleMessages}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs"
      >
        {consoleMessages.map((msg, i) => (
          <div key={i} className="flex items-start gap-2 py-0.5">
            <span className="shrink-0 text-foreground-muted">
              {formatTimestamp(msg.timestamp)}
            </span>
            {levelIcon(msg.level)}
            <span
              className={cn(
                msg.level === "error" && "text-severity-critical",
                msg.level === "warn" && "text-amber-400",
                msg.level === "info" && "text-foreground",
              )}
            >
              {msg.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Chaos Tab
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<ChaosSeverity, string> = {
  low: "bg-severity-low/20 text-severity-low",
  medium: "bg-severity-medium/20 text-severity-medium",
  high: "bg-severity-high/20 text-severity-high",
  critical: "bg-severity-critical/20 text-severity-critical",
};

const CATEGORY_LABELS: Record<ChaosCategory, string> = {
  infrastructure: "Infrastructure",
  network: "Network",
  data: "Data",
  traffic: "Traffic",
  dependency: "Dependency",
  application: "Application",
  cache: "Cache",
  security: "Security",
  resource: "Resource",
  external: "External",
};

const CATEGORY_ORDER: ChaosCategory[] = [
  "infrastructure",
  "network",
  "application",
  "data",
  "cache",
  "traffic",
  "dependency",
  "security",
  "resource",
  "external",
];

function groupByCategory(): Record<ChaosCategory, ChaosEventType[]> {
  const groups: Record<ChaosCategory, ChaosEventType[]> = {
    infrastructure: [],
    network: [],
    data: [],
    traffic: [],
    dependency: [],
    application: [],
    cache: [],
    security: [],
    resource: [],
    external: [],
  };
  for (const event of CHAOS_EVENTS) {
    groups[event.category].push(event);
  }
  return groups;
}

const ChaosTab = memo(function ChaosTab() {
  const status = useSimulationStore((s) => s.status);
  const activeChaosEvents = useSimulationStore((s) => s.activeChaosEvents);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);
  const selectedNodeIds = useCanvasStore((s) => s.selectedNodeIds);

  const [collapsedCategories, setCollapsedCategories] = useState<
    Set<ChaosCategory>
  >(new Set());

  const grouped = groupByCategory();

  const canInject = status === "running" && selectedNodeIds.length > 0;

  const toggleCategory = (cat: ChaosCategory) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleInject = useCallback(
    (eventId: string) => {
      if (!orchestratorRef || selectedNodeIds.length === 0) return;
      orchestratorRef.injectChaos(eventId, selectedNodeIds);
    },
    [orchestratorRef, selectedNodeIds],
  );

  const handleRemove = useCallback(
    (instanceId: string) => {
      if (!orchestratorRef) return;
      orchestratorRef.removeChaos(instanceId);
    },
    [orchestratorRef],
  );

  // Resolve active chaos event instance IDs to their details
  const activeDetails = activeChaosEvents.map((instanceId) => {
    const chaosEngine = orchestratorRef?.getChaosEngine();
    const activeEvents = chaosEngine?.getActiveEvents() ?? [];
    const active = activeEvents.find((e) => e.instanceId === instanceId);
    const eventType = active
      ? chaosEngine?.getEventType(active.eventTypeId)
      : undefined;
    return { instanceId, active, eventType };
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3">
      {/* Active chaos events */}
      {activeDetails.length > 0 && (
        <div className="mb-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            <Zap className="h-3 w-3 text-severity-critical" />
            Active Events ({activeDetails.length})
          </div>
          <div className="space-y-1">
            {activeDetails.map(({ instanceId, active, eventType }) => (
              <div
                key={instanceId}
                className="flex items-center gap-2 rounded-md bg-severity-critical/10 px-2 py-1.5"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-severity-critical" />
                <span className="flex-1 truncate text-xs text-foreground">
                  {eventType?.name ?? instanceId}
                </span>
                {active && (
                  <span className="text-xs text-foreground-muted">
                    {active.targetNodeIds.length} node
                    {active.targetNodeIds.length !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(instanceId)}
                  className="rounded px-1.5 py-0.5 text-xs text-severity-critical transition-colors hover:bg-severity-critical/20"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event catalog grouped by category */}
      {CATEGORY_ORDER.map((category) => {
        const events = grouped[category];
        const isCollapsed = collapsedCategories.has(category);

        return (
          <div key={category} className="mb-2">
            <button
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs font-semibold uppercase tracking-wider text-foreground-muted transition-colors hover:bg-elevated"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {CATEGORY_LABELS[category]} ({events.length})
            </button>

            {!isCollapsed && (
              <div className="mt-1 space-y-1 pl-1">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-elevated"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground">
                          {event.name}
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            SEVERITY_COLORS[event.defaultSeverity],
                          )}
                        >
                          {event.defaultSeverity}
                        </span>
                      </div>
                      <span className="truncate text-[11px] text-foreground-muted">
                        {event.description}
                      </span>
                    </div>
                    <button
                      onClick={() => handleInject(event.id)}
                      disabled={!canInject}
                      className={cn(
                        "shrink-0 rounded px-2 py-1 text-xs font-medium transition-colors",
                        canInject
                          ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                          : "cursor-not-allowed bg-muted text-foreground-muted opacity-50",
                      )}
                    >
                      Inject
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Capacity Tab
// ---------------------------------------------------------------------------

const DEFAULT_CAPACITY_INPUT: CapacityInput = {
  dailyActiveUsers: 1_000_000,
  avgRequestsPerUserPerDay: 50,
  peakToAvgRatio: 3,
  readWriteRatio: 10,
  avgRequestSizeKB: 2,
  avgResponseSizeKB: 5,
  dataRetentionYears: 3,
};

interface CapacityField {
  key: keyof CapacityInput;
  label: string;
}

const CAPACITY_FIELDS: CapacityField[] = [
  { key: "dailyActiveUsers", label: "Daily Active Users" },
  { key: "avgRequestsPerUserPerDay", label: "Avg Requests/User/Day" },
  { key: "peakToAvgRatio", label: "Peak-to-Avg Ratio" },
  { key: "readWriteRatio", label: "Read:Write Ratio" },
  { key: "avgRequestSizeKB", label: "Avg Request Size KB" },
  { key: "avgResponseSizeKB", label: "Avg Response Size KB" },
  { key: "dataRetentionYears", label: "Data Retention Years" },
];

function formatMetricValue(value: number, suffix?: string): string {
  const abs = Math.abs(value);
  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = (value / 1_000_000).toFixed(2) + "M";
  } else if (abs >= 1_000) {
    formatted = (value / 1_000).toFixed(2) + "K";
  } else {
    formatted = value.toFixed(2);
  }
  return suffix ? `${formatted} ${suffix}` : formatted;
}

const CapacityTab = memo(function CapacityTab() {
  const [input, setInput] = useState<CapacityInput>({
    ...DEFAULT_CAPACITY_INPUT,
  });
  const [estimate, setEstimate] = useState<CapacityEstimate | null>(null);

  const handleChange = (key: keyof CapacityInput, value: string) => {
    const num = Number(value);
    if (!isNaN(num) && num >= 0) {
      setInput((prev) => ({ ...prev, [key]: num }));
    }
  };

  const handleEstimate = () => {
    const result = estimateCapacity(input);
    setEstimate(result);
  };

  return (
    <div className="flex h-full gap-4 overflow-y-auto p-3">
      {/* Input form */}
      <div className="flex w-64 shrink-0 flex-col gap-2">
        {CAPACITY_FIELDS.map((field) => {
          const fieldId = `capacity-${field.key}`;
          return (
            <div key={field.key} className="flex flex-col gap-0.5">
              <label htmlFor={fieldId} className="text-[11px] text-foreground-muted">
                {field.label}
              </label>
              <input
                id={fieldId}
                type="number"
                value={input[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="rounded-md border border-border bg-elevated px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          );
        })}
        <button
          onClick={handleEstimate}
          className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Estimate
        </button>
      </div>

      {/* Results grid */}
      {estimate && (
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-3">
          {/* Traffic */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Traffic
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Avg RPS</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.avgRps)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Peak RPS</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.peakRps)}
                </span>
              </div>
            </div>
          </div>

          {/* Bandwidth */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Bandwidth
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">In</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.bandwidthInMBps, "MB/s")}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Out</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.bandwidthOutMBps, "MB/s")}
                </span>
              </div>
            </div>
          </div>

          {/* Storage */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Storage
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Per Year</span>
                <span className="font-mono text-foreground">
                  {estimate.storagePerYearTB.toFixed(4)} TB
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Total</span>
                <span className="font-mono text-foreground">
                  {estimate.totalStorageTB.toFixed(4)} TB
                </span>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Database
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Writes/sec</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.dbWritesPerSec)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Reads/sec</span>
                <span className="font-mono text-foreground">
                  {formatMetricValue(estimate.dbReadsPerSec)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Cache Hit Rate</span>
                <span className="font-mono text-foreground">
                  {(estimate.estimatedCacheHitRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div className="rounded-lg border border-border bg-elevated p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Infrastructure
            </h4>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Est. Servers</span>
                <span className="font-mono text-foreground">
                  {estimate.estimatedServers}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-foreground-muted">Monthly Cost</span>
                <span className="font-mono text-foreground">
                  ${estimate.estimatedMonthlyCostUSD.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Cost Tab
// ---------------------------------------------------------------------------

const CATEGORY_BAR_COLORS: Record<CostCategory, string> = {
  compute: "bg-node-compute",
  storage: "bg-node-storage",
  networking: "bg-node-networking",
  messaging: "bg-node-messaging",
  other: "bg-gray-9",
};

const CATEGORY_DISPLAY_LABELS: Record<CostCategory, string> = {
  compute: "Compute",
  storage: "Storage",
  networking: "Networking",
  messaging: "Messaging",
  other: "Other",
};

const CostTab = memo(function CostTab() {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const estimate = useMemo(
    () => calculateInfrastructureCost(nodes, edges),
    [nodes, edges],
  );

  const categories = useMemo(
    () => aggregateCostByCategory(estimate),
    [estimate],
  );

  const tips = useMemo(
    () => generateOptimizationTips(estimate),
    [estimate],
  );

  const sorted = useMemo(
    () => [...estimate.components].sort((a, b) => b.monthlyCost - a.monthlyCost),
    [estimate.components],
  );

  const maxCategoryCost = Math.max(...Object.values(categories), 1);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Add components to the canvas to see cost estimates
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4 overflow-y-auto p-3">
      {/* Component cost table */}
      <div className="flex min-w-[280px] flex-1 flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">
            Component Costs
          </h4>
          <span className="text-xs font-mono font-bold text-foreground">
            Total: ${Math.round(estimate.totalMonthlyCost).toLocaleString()}/mo
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-foreground-muted">
                <th className="pb-1 font-medium">Component</th>
                <th className="pb-1 text-right font-medium">Type</th>
                <th className="pb-1 text-right font-medium">Cost/mo</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.nodeId} className="border-b border-border/50">
                  <td className="py-1.5 text-foreground">{c.label}</td>
                  <td className="py-1.5 text-right font-mono text-foreground-muted">
                    {c.nodeType}
                  </td>
                  <td className="py-1.5 text-right font-mono text-foreground">
                    ${Math.round(c.monthlyCost).toLocaleString()}
                  </td>
                </tr>
              ))}
              {estimate.dataTransferCost > 0 && (
                <tr className="border-b border-border/50">
                  <td className="py-1.5 text-foreground">Data Transfer</td>
                  <td className="py-1.5 text-right font-mono text-foreground-muted">
                    network
                  </td>
                  <td className="py-1.5 text-right font-mono text-foreground">
                    ${Math.round(estimate.dataTransferCost).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category bar chart */}
      <div className="w-48 shrink-0">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          By Category
        </h4>
        <div className="space-y-2">
          {(Object.keys(categories) as CostCategory[])
            .filter((key) => categories[key] > 0)
            .sort((a, b) => categories[b] - categories[a])
            .map((key) => {
              const pct = (categories[key] / maxCategoryCost) * 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground-muted">
                      {CATEGORY_DISPLAY_LABELS[key]}
                    </span>
                    <span className="font-mono text-foreground">
                      ${Math.round(categories[key]).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-0.5 h-2 w-full rounded-full bg-muted">
                    <div
                      className={cn("h-2 rounded-full", CATEGORY_BAR_COLORS[key])}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Optimization tips */}
      <div className="w-56 shrink-0">
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          <Lightbulb className="h-3 w-3 text-amber-400" />
          Optimization Tips
        </h4>
        <div className="space-y-2">
          {tips.map((tip, i) => (
            <div
              key={i}
              className="rounded-lg border border-border bg-elevated p-2"
            >
              <div className="text-xs font-medium text-foreground">
                {tip.title}
              </div>
              <div className="mt-0.5 text-[11px] text-foreground-muted">
                {tip.description}
              </div>
              <div className="mt-1 text-[11px] font-medium text-state-success">
                {tip.estimatedSavings}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Tab Groups
// ---------------------------------------------------------------------------

interface TabDef {
  id: "metrics" | "timeline" | "code" | "console" | "chaos" | "capacity" | "cost" | "sla" | "latency" | "report";
  label: string;
  icon: typeof BarChart3;
}

interface TabGroup {
  label: string;
  tabs: TabDef[];
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: "Metrics",
    tabs: [
      { id: "metrics", label: "Metrics", icon: BarChart3 },
      { id: "timeline", label: "Timeline", icon: Clock },
      { id: "sla", label: "SLA", icon: Shield },
      { id: "latency", label: "Latency", icon: Timer },
    ],
  },
  {
    label: "Dev",
    tabs: [
      { id: "code", label: "Code", icon: Code2 },
      { id: "console", label: "Console", icon: Terminal },
    ],
  },
  {
    label: "Testing",
    tabs: [
      { id: "chaos", label: "Chaos", icon: AlertTriangle },
      { id: "capacity", label: "Capacity", icon: Calculator },
      { id: "cost", label: "Cost", icon: DollarSign },
      { id: "report", label: "Report", icon: BarChart3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Scroll-fade wrapper for the tab bar
// ---------------------------------------------------------------------------

function ScrollableTabBar({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  return (
    <div className="relative border-b border-border">
      {/* Left fade indicator */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute left-0 top-0 z-10 h-full w-6 bg-gradient-to-r from-background to-transparent transition-opacity duration-150",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Right fade indicator */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-0 top-0 z-10 h-full w-6 bg-gradient-to-l from-background to-transparent transition-opacity duration-150",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={scrollRef}
        role="tablist"
        aria-label="Bottom panel tabs"
        className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {children}
      </div>
    </div>
  );
}

export const BottomPanel = memo(function BottomPanel() {
  const activeTab = useUIStore((s) => s.bottomPanelTab);
  const setTab = useUIStore((s) => s.setBottomPanelTab);

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar with horizontal scroll + grouped tabs */}
      <ScrollableTabBar>
        {TAB_GROUPS.map((group, groupIdx) => (
          <div key={group.label} className="flex shrink-0 items-center">
            {/* Group divider (skip first) */}
            {groupIdx > 0 && (
              <div className="mx-1 flex h-6 items-center" aria-hidden>
                <div className="h-3.5 w-px bg-border" />
              </div>
            )}
            {/* Group label */}
            <span className="mr-1 select-none whitespace-nowrap pl-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted/60">
              {group.label}
            </span>
            {/* Tabs in group */}
            {group.tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setTab(tab.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-foreground-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        ))}
      </ScrollableTabBar>

      {/* Tab content */}
      <div role="tabpanel" aria-label={`${activeTab} tab content`} className="flex-1 overflow-hidden">
        {activeTab === "metrics" && <MetricsTab />}
        {activeTab === "timeline" && <TimelineTab />}
        {activeTab === "code" && <CodeTab />}
        {activeTab === "console" && <ConsoleTab />}
        {activeTab === "chaos" && <ChaosTab />}
        {activeTab === "capacity" && <CapacityTab />}
        {activeTab === "cost" && <CostTab />}
        {activeTab === "sla" && <SLADashboard />}
        {activeTab === "latency" && <LatencyBudgetPanel />}
        {activeTab === "report" && <PostSimulationReport />}
      </div>
    </div>
  );
});
