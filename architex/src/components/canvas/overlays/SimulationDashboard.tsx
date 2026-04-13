'use client';

/**
 * SimulationDashboard (UI-001)
 *
 * Top-bar overlay showing key aggregate metrics during an active simulation.
 * Displays: total RPS, error rate, P99 latency, cost/hr, active chaos events.
 * Also provides speed controls, a traffic slider, step-forward, and
 * jump-to-incident buttons.
 *
 * Visible only when simulation status is 'running' or 'paused'.
 */

import { memo, useCallback, useMemo } from 'react';
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  DollarSign,
  Gauge,
  Pause,
  Play,
  SkipForward,
  Timer,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSimulationStore } from '@/stores/simulation-store';
import type { SimulationStatus } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// MetricPill
// ---------------------------------------------------------------------------

interface MetricPillProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  alert?: boolean;
}

const MetricPill = memo(function MetricPill({
  icon: Icon,
  label,
  value,
  color,
  alert,
}: MetricPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs',
        alert
          ? 'border-severity-critical/40 bg-severity-critical/10'
          : 'border-border bg-elevated',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" style={color ? { color } : undefined} />
      <span className="text-foreground-muted">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SimulationDashboard
// ---------------------------------------------------------------------------

const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;

export const SimulationDashboard = memo(function SimulationDashboard() {
  const status = useSimulationStore((s) => s.status);
  const metrics = useSimulationStore((s) => s.metrics);
  const activeChaosEvents = useSimulationStore((s) => s.activeChaosEvents);
  const playbackSpeed = useSimulationStore((s) => s.playbackSpeed);
  const trafficConfig = useSimulationStore((s) => s.trafficConfig);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const stepForward = useSimulationStore((s) => s.stepForward);
  const setPlaybackSpeed = useSimulationStore((s) => s.setPlaybackSpeed);
  const setTrafficConfig = useSimulationStore((s) => s.setTrafficConfig);
  const orchestratorRef = useSimulationStore((s) => s.orchestratorRef);

  const isActive = status === 'running' || status === 'paused';
  if (!isActive) return null;

  const costState = orchestratorRef?.getCostState();

  const handleJumpToIncident = useCallback(() => {
    if (!orchestratorRef) return;
    const history = orchestratorRef.getTickHistory();
    const currentTick = useSimulationStore.getState().currentTick;
    // Find the next tick with incidents after current position
    const next = history.find(
      (t) => t.tick > currentTick && t.nodeEvents.length > 0,
    );
    if (next) {
      orchestratorRef.seekTo(next.tick);
    }
  }, [orchestratorRef]);

  const handleTrafficChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTrafficConfig({ requestsPerSecond: Number(e.target.value) });
    },
    [setTrafficConfig],
  );

  return (
    <div className="pointer-events-auto absolute left-4 right-4 top-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/90 px-4 py-2 shadow-lg backdrop-blur-sm">
      {/* Metric pills */}
      <MetricPill
        icon={Activity}
        label="RPS"
        value={metrics.throughputRps.toFixed(0)}
        color="var(--node-compute)"
      />
      <MetricPill
        icon={AlertTriangle}
        label="Errors"
        value={`${(metrics.errorRate * 100).toFixed(1)}%`}
        alert={metrics.errorRate > 0.05}
        color={metrics.errorRate > 0.05 ? undefined : 'var(--state-success)'}
      />
      <MetricPill
        icon={Timer}
        label="P99"
        value={`${metrics.p99LatencyMs.toFixed(0)}ms`}
        color="var(--node-processing)"
      />
      <MetricPill
        icon={Gauge}
        label="Avg"
        value={`${metrics.avgLatencyMs.toFixed(0)}ms`}
        color="var(--node-networking)"
      />
      {costState && (
        <MetricPill
          icon={DollarSign}
          label="Cost/hr"
          value={`$${costState.currentHourlyRate.toFixed(2)}`}
          color="var(--node-messaging)"
        />
      )}
      {activeChaosEvents.length > 0 && (
        <MetricPill
          icon={Zap}
          label="Chaos"
          value={String(activeChaosEvents.length)}
          alert
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Traffic slider */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wider text-foreground-muted">
          RPS
        </span>
        <input
          type="range"
          min={10}
          max={10000}
          step={10}
          value={trafficConfig.requestsPerSecond}
          onChange={handleTrafficChange}
          aria-label="Traffic RPS"
          className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-muted [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
        />
        <span className="w-12 text-right font-mono text-[10px] tabular-nums text-foreground-muted">
          {trafficConfig.requestsPerSecond}
        </span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Speed controls */}
      <div className="flex items-center gap-1">
        {SPEEDS.map((speed) => (
          <button
            key={speed}
            onClick={() => setPlaybackSpeed(speed)}
            className={cn(
              'h-6 rounded px-1.5 text-[10px] font-mono transition-colors',
              playbackSpeed === speed
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground-muted hover:bg-elevated',
            )}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Playback controls */}
      <div className="flex items-center gap-1">
        {status === 'running' ? (
          <button
            onClick={pause}
            aria-label="Pause simulation"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={play}
            aria-label="Resume simulation"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={stepForward}
          aria-label="Step forward"
          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
          title="Step forward one tick"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleJumpToIncident}
          aria-label="Jump to next incident"
          className="flex h-7 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-foreground-muted transition-colors hover:bg-elevated hover:text-foreground"
          title="Jump to next incident"
        >
          <ChevronRight className="h-3 w-3" />
          Incident
        </button>
      </div>
    </div>
  );
});
