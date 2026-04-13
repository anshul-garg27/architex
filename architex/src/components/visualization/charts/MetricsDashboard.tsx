'use client';

// ─────────────────────────────────────────────────────────────
// MetricsDashboard — Integrated Real-Time Metrics Panel
// ─────────────────────────────────────────────────────────────
//
// Replaces the simple text-based MetricsTab in BottomPanel.
// Displays all chart types in a compact layout suitable for
// the bottom panel (200-300px tall).
//
// Layout:
//   [Throughput Chart (full width, 120px)]
//   [Latency Percentile | Error Rate | Gauges row]
//   [Queue Depth Bars (if any queues)]
//
// All charts render via Canvas 2D for 60fps performance.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { ThroughputChart } from './ThroughputChart';
import { LatencyPercentileChart } from './LatencyPercentileChart';
import { ErrorRateChart } from './ErrorRateChart';
import { QueueDepthBars } from './QueueDepthBars';
import { UtilizationGauge } from '../gauges/UtilizationGauge';
import { CacheHitGauge } from '../gauges/CacheHitGauge';
import { useSimulationStore } from '@/stores/simulation-store';
import type { SimulationMetrics } from '@/stores/simulation-store';

// ── Types ───────────────────────────────────────────────────

export interface MetricsDashboardProps {
  className?: string;
}

// ── Component ───────────────────────────────────────────────

export const MetricsDashboard = memo(function MetricsDashboard({
  className,
}: MetricsDashboardProps) {
  const status = useSimulationStore((s) => s.status);
  const metrics = useSimulationStore((s) => s.metrics);
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);

  if (status === 'idle') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-foreground-muted">
        Start a simulation to see live metrics
      </div>
    );
  }

  // Build time series from metrics history (last 60 snapshots)
  const last60 = metricsHistory.slice(-60);

  const throughputSeries = [
    {
      id: 'global',
      label: 'Total',
      color: '#648FFF',
      data: last60.map((m) => m.throughputRps),
    },
  ];

  const latencyData = {
    p50: last60.map((m) => m.p50LatencyMs),
    p90: last60.map((m) => m.p90LatencyMs),
    p95: last60.map((m) => m.p95LatencyMs),
    p99: last60.map((m) => m.p99LatencyMs),
  };

  const errorData = last60.map((m) => m.errorRate);

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 p-2">
        {/* Row 1: Throughput */}
        <div>
          <div className="mb-0.5 text-[9px] font-mono font-semibold uppercase text-foreground-muted">
            Throughput (req/s)
          </div>
          <ThroughputChart series={throughputSeries} height={100} />
        </div>

        {/* Row 2: Latency + Error Rate + Gauges */}
        <div className="flex gap-2">
          <div className="flex-1">
            <div className="mb-0.5 text-[9px] font-mono font-semibold uppercase text-foreground-muted">
              Latency Percentiles
            </div>
            <LatencyPercentileChart data={latencyData} height={90} />
          </div>

          <div className="w-[180px] flex-shrink-0">
            <div className="mb-0.5 text-[9px] font-mono font-semibold uppercase text-foreground-muted">
              Error Rate
            </div>
            <ErrorRateChart data={errorData} height={90} />
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            <UtilizationGauge
              label="CPU"
              value={metrics.throughputRps > 0 ? Math.min(metrics.throughputRps / 10000, 1) : 0}
              size={70}
            />
            <CacheHitGauge
              hitRate={metrics.successfulRequests > 0
                ? metrics.successfulRequests / Math.max(metrics.totalRequests, 1)
                : 0}
              size={70}
            />
          </div>
        </div>

        {/* Row 3: Numeric summary */}
        <div className="flex flex-wrap gap-3 border-t border-border pt-1.5">
          <MetricBadge label="Total Req" value={metrics.totalRequests.toLocaleString()} />
          <MetricBadge label="Avg Latency" value={`${metrics.avgLatencyMs.toFixed(1)}ms`} />
          <MetricBadge label="P99" value={`${metrics.p99LatencyMs.toFixed(1)}ms`} />
          <MetricBadge label="Error" value={`${(metrics.errorRate * 100).toFixed(2)}%`} variant={metrics.errorRate > 0.01 ? 'error' : 'default'} />
          <MetricBadge label="Throughput" value={`${metrics.throughputRps.toFixed(0)} rps`} />
        </div>
      </div>
    </div>
  );
});

MetricsDashboard.displayName = 'MetricsDashboard';

// ── MetricBadge ─────────────────────────────────────────────

function MetricBadge({
  label,
  value,
  variant = 'default',
}: {
  label: string;
  value: string;
  variant?: 'default' | 'error';
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] text-foreground-muted">{label}:</span>
      <span
        className={`text-[10px] font-mono font-semibold ${
          variant === 'error' ? 'text-[var(--viz-error-fill)]' : 'text-foreground'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
