"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clock,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulationStore } from "@/stores/simulation-store";
import { useCanvasStore } from "@/stores/canvas-store";
import type { SimulationMetrics } from "@/stores/simulation-store";
import type { SimulationFrame } from "@/lib/simulation/time-travel";
import type { TimeTravel } from "@/lib/simulation/time-travel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatMs(ms: number): string {
  if (ms < 1) return "<1ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Breakpoint Marker
// ---------------------------------------------------------------------------

interface BreakpointMarkerProps {
  position: number; // 0..1 fraction along the timeline
  tick: number;
  onRemove: (tick: number) => void;
}

function BreakpointMarker({ position, tick, onRemove }: BreakpointMarkerProps) {
  return (
    <button
      type="button"
      className="group absolute top-0 z-20 -translate-x-1/2 cursor-pointer"
      style={{ left: `${position * 100}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onRemove(tick);
      }}
      aria-label={`Breakpoint at tick ${tick} (click to remove)`}
    >
      {/* Red diamond marker */}
      <div className="h-3 w-3 rotate-45 rounded-[1px] border border-red-400 bg-red-500 shadow-sm shadow-red-500/40 transition-transform group-hover:scale-125" />
      {/* Vertical dashed line */}
      <div className="absolute left-1/2 top-3 h-[22px] w-px -translate-x-1/2 border-l border-dashed border-red-400/60" />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Chaos Event Marker
// ---------------------------------------------------------------------------

interface ChaosMarkerProps {
  position: number;
  label: string;
}

function ChaosMarker({ position, label }: ChaosMarkerProps) {
  return (
    <div
      className="absolute bottom-0 z-10 -translate-x-1/2"
      style={{ left: `${position * 100}%` }}
      aria-label={label}
    >
      <div className="h-2 w-2 rounded-full border border-amber-400 bg-amber-500 shadow-sm shadow-amber-500/40" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics Summary
// ---------------------------------------------------------------------------

interface MetricsSummaryProps {
  metrics: SimulationMetrics;
  tick: number;
}

function MetricsSummary({ metrics, tick }: MetricsSummaryProps) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
      <span className="font-semibold text-foreground">Tick {tick}</span>
      <span>
        RPS{" "}
        <span className="text-foreground">
          {Math.round(metrics.throughputRps)}
        </span>
      </span>
      <span>
        Avg{" "}
        <span className="text-foreground">
          {formatMs(metrics.avgLatencyMs)}
        </span>
      </span>
      <span>
        P99{" "}
        <span className="text-foreground">
          {formatMs(metrics.p99LatencyMs)}
        </span>
      </span>
      <span>
        Err{" "}
        <span
          className={cn(
            "text-foreground",
            metrics.errorRate > 0.05 && "text-red-400",
            metrics.errorRate > 0 && metrics.errorRate <= 0.05 && "text-amber-400"
          )}
        >
          {formatPercent(metrics.errorRate)}
        </span>
      </span>
      <span>
        Reqs{" "}
        <span className="text-foreground">{metrics.totalRequests}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimeTravelScrubber
// ---------------------------------------------------------------------------

export interface TimeTravelScrubberProps {
  timeTravel: TimeTravel;
  onClose?: () => void;
}

export const TimeTravelScrubber = memo(function TimeTravelScrubber({
  timeTravel,
  onClose,
}: TimeTravelScrubberProps) {
  const status = useSimulationStore((s) => s.status);
  const currentTick = useSimulationStore((s) => s.currentTick);
  const totalTicks = useSimulationStore((s) => s.totalTicks);
  const metrics = useSimulationStore((s) => s.metrics);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const setTick = useSimulationStore((s) => s.setTick);
  const updateMetrics = useSimulationStore((s) => s.updateMetrics);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  // Local state
  const [scrubTick, setScrubTick] = useState<number | null>(null);
  const [breakpoints, setBreakpoints] = useState<Set<number>>(
    () => new Set()
  );
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // The effective tick to display (scrubbed tick takes priority)
  const displayTick = scrubTick ?? currentTick;

  // Frame count from time-travel
  const frameCount = timeTravel.getFrameCount();

  // Effective total (use totalTicks from store but fall back to frameCount)
  const effectiveTotal = Math.max(totalTicks, frameCount, 1);

  // Current frame for the display tick
  const currentFrame = useMemo(
    () => timeTravel.getFrame(displayTick),
    [timeTravel, displayTick]
  );

  // Get the metrics to display - from the frame if available, otherwise from store
  const displayMetrics = currentFrame?.globalMetrics ?? metrics;

  // Chaos event markers — collect ticks where chaos events first appear
  const chaosMarkers = useMemo(() => {
    const frames = timeTravel.getFrames();
    const markers: { tick: number; label: string }[] = [];
    const seenChaos = new Set<string>();

    for (const frame of frames) {
      for (const chaosId of frame.activeChaos) {
        if (!seenChaos.has(chaosId)) {
          seenChaos.add(chaosId);
          markers.push({ tick: frame.tick, label: chaosId });
        }
      }
    }
    return markers;
  }, [timeTravel, frameCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Apply frame state to canvas ──────────────────────────────

  const applyFrame = useCallback(
    (frame: SimulationFrame) => {
      // Update each node's visual state + metrics from the frame
      for (const [nodeId, nodeState] of frame.nodeStates) {
        updateNodeData(nodeId, {
          state: nodeState.state,
          metrics: {
            utilization: nodeState.utilization,
            latency: nodeState.latency,
            errorRate: nodeState.errorRate,
          },
        });
      }
      // Update global metrics
      updateMetrics(frame.globalMetrics);
      setTick(frame.tick);
    },
    [updateNodeData, updateMetrics, setTick]
  );

  // ── Breakpoint auto-pause ───────────────────────────────────

  useEffect(() => {
    if (
      status === "running" &&
      breakpoints.has(currentTick) &&
      scrubTick === null
    ) {
      pause();
    }
  }, [currentTick, status, breakpoints, pause, scrubTick]);

  // ── Mouse / pointer handlers for scrubbing ──────────────────

  const tickFromPointerEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const fraction = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      return Math.round(fraction * (effectiveTotal - 1));
    },
    [effectiveTotal]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (status !== "paused" && status !== "completed") return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDragging(true);
      const tick = tickFromPointerEvent(e.clientX);
      setScrubTick(tick);
      const frame = timeTravel.getFrame(tick);
      if (frame) applyFrame(frame);
    },
    [status, tickFromPointerEvent, timeTravel, applyFrame]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const tick = tickFromPointerEvent(e.clientX);
      setScrubTick(tick);
      const frame = timeTravel.getFrame(tick);
      if (frame) applyFrame(frame);
    },
    [isDragging, tickFromPointerEvent, timeTravel, applyFrame]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      // Keep scrubTick set so user sees the scrubbed state
    },
    [isDragging]
  );

  // ── Timeline click to add breakpoint ────────────────────────

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      // Only add breakpoints when not currently scrubbing via drag
      const tick = tickFromPointerEvent(e.clientX);
      setBreakpoints((prev) => {
        const next = new Set(prev);
        if (next.has(tick)) {
          next.delete(tick);
        } else {
          next.add(tick);
        }
        return next;
      });
    },
    [isDragging, tickFromPointerEvent]
  );

  const removeBreakpoint = useCallback((tick: number) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      next.delete(tick);
      return next;
    });
  }, []);

  const clearBreakpoints = useCallback(() => {
    setBreakpoints(new Set());
  }, []);

  // ── Step controls ───────────────────────────────────────────

  const stepTo = useCallback(
    (tick: number) => {
      const clampedTick = Math.max(0, Math.min(tick, effectiveTotal - 1));
      setScrubTick(clampedTick);
      const frame = timeTravel.getFrame(clampedTick);
      if (frame) applyFrame(frame);
    },
    [effectiveTotal, timeTravel, applyFrame]
  );

  const stepBackward = useCallback(() => {
    stepTo((scrubTick ?? currentTick) - 1);
  }, [stepTo, scrubTick, currentTick]);

  const stepForward = useCallback(() => {
    stepTo((scrubTick ?? currentTick) + 1);
  }, [stepTo, scrubTick, currentTick]);

  // ── Progress bar fill ───────────────────────────────────────

  const progressFraction =
    effectiveTotal > 1 ? displayTick / (effectiveTotal - 1) : 0;

  // ── Scrubbing indicator color (green=healthy, yellow=warning, red=bad) ──

  const progressColor = useMemo(() => {
    if (!currentFrame) return "bg-blue-500";
    const avgUtil =
      currentFrame.nodeStates.size > 0
        ? Array.from(currentFrame.nodeStates.values()).reduce(
            (sum, ns) => sum + ns.utilization,
            0
          ) / currentFrame.nodeStates.size
        : 0;
    if (avgUtil >= 0.85) return "bg-red-500";
    if (avgUtil >= 0.6) return "bg-amber-500";
    return "bg-emerald-500";
  }, [currentFrame]);

  // Don't render if we have no frames
  if (frameCount === 0 && status !== "running") return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 z-50 -translate-x-1/2">
      <div className="flex w-full max-w-[600px] flex-col gap-1.5 rounded-xl border border-border bg-surface/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-semibold tracking-wide text-foreground">
              Time-Travel Debugger
            </span>
            {scrubTick !== null && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-medium text-blue-400">
                SCRUBBING
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {breakpoints.size > 0 && (
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={clearBreakpoints}
                aria-label="Clear all breakpoints"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            {onClose && (
              <button
                type="button"
                className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={onClose}
                aria-label="Close scrubber"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Timeline track */}
        <div className="relative flex items-center gap-2">
          {/* Step backward */}
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            onClick={stepBackward}
            disabled={displayTick <= 0 || status === "running"}
            aria-label="Step backward"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            onClick={() => {
              if (status === "running") {
                pause();
              } else {
                setScrubTick(null);
                play();
              }
            }}
            disabled={status === "completed" && scrubTick === null}
            aria-label={status === "running" ? "Pause" : "Play"}
          >
            {status === "running" ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Step forward */}
          <button
            type="button"
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            onClick={stepForward}
            disabled={
              displayTick >= effectiveTotal - 1 || status === "running"
            }
            aria-label="Step forward"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          {/* Track */}
          <div
            ref={trackRef}
            role="slider"
            aria-valuenow={displayTick}
            aria-valuemin={0}
            aria-valuemax={effectiveTotal > 0 ? effectiveTotal - 1 : 0}
            aria-label="Timeline scrubber"
            className={cn(
              "relative h-7 flex-1 cursor-pointer rounded-md bg-muted/50",
              (status === "paused" || status === "completed") &&
                "cursor-grab active:cursor-grabbing"
            )}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleTrackClick}
          >
            {/* Progress fill */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-l-md opacity-30 transition-[width] duration-75",
                progressColor
              )}
              style={{ width: `${progressFraction * 100}%` }}
            />

            {/* Playhead */}
            <div
              className={cn(
                "absolute top-1/2 z-30 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-lg transition-[left] duration-75",
                progressColor
              )}
              style={{ left: `${progressFraction * 100}%` }}
            />

            {/* Chaos event markers */}
            {chaosMarkers.map((marker, i) => (
              <ChaosMarker
                key={`chaos-${marker.tick}-${i}`}
                position={
                  effectiveTotal > 1 ? marker.tick / (effectiveTotal - 1) : 0
                }
                label={marker.label}
              />
            ))}

            {/* Breakpoint markers */}
            {Array.from(breakpoints).map((tick) => (
              <BreakpointMarker
                key={`bp-${tick}`}
                position={
                  effectiveTotal > 1 ? tick / (effectiveTotal - 1) : 0
                }
                tick={tick}
                onRemove={removeBreakpoint}
              />
            ))}
          </div>

          {/* Tick counter */}
          <span className="min-w-[72px] text-right font-mono text-[10px] text-muted-foreground">
            {displayTick}/{effectiveTotal > 0 ? effectiveTotal - 1 : 0}
          </span>
        </div>

        {/* Metrics summary */}
        <MetricsSummary metrics={displayMetrics} tick={displayTick} />
      </div>
    </div>
  );
});

TimeTravelScrubber.displayName = "TimeTravelScrubber";
