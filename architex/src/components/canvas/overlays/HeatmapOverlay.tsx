'use client';

import { memo, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useViewportStore } from '@/stores/viewport-store';
import { useShallow } from 'zustand/react/shallow';
import type { HeatmapMetric } from '@/stores/simulation-store';
import type { SystemDesignNodeData } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────

export type { HeatmapMetric };

interface HeatmapOverlayProps {
  metric: HeatmapMetric;
}

// ── Color scale helpers ────────────────────────────────────

/**
 * Linearly interpolate between two hex colors.
 * `t` ranges from 0 (colorA) to 1 (colorB).
 */
function lerpColor(colorA: string, colorB: string, t: number): string {
  const clamp = Math.max(0, Math.min(1, t));
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };
  const [r1, g1, b1] = parse(colorA);
  const [r2, g2, b2] = parse(colorB);
  const r = Math.round(r1 + (r2 - r1) * clamp);
  const g = Math.round(g1 + (g2 - g1) * clamp);
  const b = Math.round(b1 + (b2 - b1) * clamp);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Three-stop gradient: green -> yellow -> red */
function threeStopColor(value: number, lowThresh: number, highThresh: number): string {
  const GREEN = '#22C55E';
  const YELLOW = '#EAB308';
  const RED = '#EF4444';

  if (value <= lowThresh) return GREEN;
  if (value >= highThresh) return RED;

  const midpoint = (lowThresh + highThresh) / 2;
  if (value <= midpoint) {
    const t = (value - lowThresh) / (midpoint - lowThresh);
    return lerpColor(GREEN, YELLOW, t);
  }
  const t = (value - midpoint) / (highThresh - midpoint);
  return lerpColor(YELLOW, RED, t);
}

/**
 * Map a metric value to a heatmap color.
 */
function getHeatmapColor(metric: HeatmapMetric, value: number | undefined): string {
  if (value == null) return 'rgba(128, 128, 128, 0.3)';

  switch (metric) {
    case 'utilization':
      // 0-1 scale: green <0.5, yellow 0.5-0.8, red >0.8
      return threeStopColor(value, 0.5, 0.8);
    case 'latency':
      // ms scale: green <50ms, yellow 50-200ms, red >200ms
      return threeStopColor(value, 50, 200);
    case 'errorRate':
      // 0-1 scale: green 0, red >0.05
      return threeStopColor(value, 0, 0.05);
    default:
      return 'rgba(128, 128, 128, 0.3)';
  }
}

function getMetricValue(
  data: SystemDesignNodeData | undefined,
  metric: HeatmapMetric,
): number | undefined {
  if (!data?.metrics) return undefined;
  switch (metric) {
    case 'utilization':
      return data.metrics.utilization;
    case 'latency':
      return data.metrics.latency;
    case 'errorRate':
      return data.metrics.errorRate;
    default:
      return undefined;
  }
}

function formatMetricValue(metric: HeatmapMetric, value: number | undefined): string {
  if (value == null) return 'N/A';
  switch (metric) {
    case 'utilization':
      return `${Math.round(value * 100)}%`;
    case 'latency':
      return `${Math.round(value)}ms`;
    case 'errorRate':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return String(value);
  }
}

// ── Legend ──────────────────────────────────────────────────

interface LegendProps {
  metric: HeatmapMetric;
}

const LEGEND_LABELS: Record<HeatmapMetric, { low: string; mid: string; high: string }> = {
  utilization: { low: '<50%', mid: '50-80%', high: '>80%' },
  latency: { low: '<50ms', mid: '50-200ms', high: '>200ms' },
  errorRate: { low: '0%', mid: '2.5%', high: '>5%' },
};

const METRIC_DISPLAY: Record<HeatmapMetric, string> = {
  utilization: 'Utilization',
  latency: 'Latency',
  errorRate: 'Error Rate',
};

function HeatmapLegend({ metric }: LegendProps) {
  const labels = LEGEND_LABELS[metric];
  return (
    <div className="pointer-events-auto absolute bottom-20 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface/90 px-3 py-2 shadow-lg backdrop-blur-lg">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {METRIC_DISPLAY[metric]}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground">{labels.low}</span>
          <div
            className="h-2.5 w-24 rounded-full"
            style={{
              background: 'linear-gradient(to right, #22C55E, #EAB308, #EF4444)',
            }}
          />
          <span className="text-[10px] text-muted-foreground">{labels.high}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main overlay ───────────────────────────────────────────

export const HeatmapOverlay = memo(function HeatmapOverlay({ metric }: HeatmapOverlayProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const viewport = useViewportStore(useShallow((s) => ({ x: s.x, y: s.y, zoom: s.zoom })));

  // We need to access the React Flow viewport for coordinate transforms
  const { getViewport } = useReactFlow();

  const overlayItems = useMemo(() => {
    const vp = getViewport();
    return nodes.map((node) => {
      const data = node.data as SystemDesignNodeData | undefined;
      const value = getMetricValue(data, metric);
      const color = getHeatmapColor(metric, value);
      const label = formatMetricValue(metric, value);

      const w = node.measured?.width ?? (node.width as number | undefined) ?? 180;
      const h = node.measured?.height ?? (node.height as number | undefined) ?? 60;

      // Transform flow coordinates to screen coordinates
      const screenX = node.position.x * vp.zoom + vp.x;
      const screenY = node.position.y * vp.zoom + vp.y;
      const screenW = w * vp.zoom;
      const screenH = h * vp.zoom;

      return {
        id: node.id,
        screenX,
        screenY,
        screenW,
        screenH,
        color,
        label,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, metric, viewport, getViewport]);

  return (
    <>
      {/* Semi-transparent colored overlays on each node */}
      <div className="pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        {overlayItems.map((item) => (
          <div
            key={item.id}
            className="absolute rounded-lg transition-colors duration-300"
            style={{
              left: item.screenX,
              top: item.screenY,
              width: item.screenW,
              height: item.screenH,
              backgroundColor: item.color,
              opacity: 0.35,
            }}
          >
            {/* Metric value badge */}
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-bold shadow-sm"
              style={{
                backgroundColor: item.color,
                color: '#fff',
                opacity: 1,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Color scale legend */}
      <HeatmapLegend metric={metric} />
    </>
  );
});

HeatmapOverlay.displayName = 'HeatmapOverlay';
