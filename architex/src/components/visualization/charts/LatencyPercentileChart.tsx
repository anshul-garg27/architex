'use client';

// ─────────────────────────────────────────────────────────────
// LatencyPercentileChart — Stacked Area with Log Y-Axis
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 120px height
// Rendering: Canvas 2D
// Y-Axis: Logarithmic (0.1ms to 10s)
// Color scheme: P50=green, P90=yellow, P95=orange, P99=red
// Features:
//   - Stacked area (P99 behind, P50 in front)
//   - Current values as badges on right edge
//   - Log-scale grid lines at powers of 10
//
// Performance: < 1.5ms per frame
// Accessibility: aria-label with current percentile values
// Responsive: Fills parent width, fixed 120px height
// Implementation effort: L
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import {
  logScale,
  logTicks,
  linearScale,
  drawStackedArea,
  drawLine,
  drawGridLines,
  drawYAxisLabels,
  drawCenteredText,
} from '@/lib/visualization/canvas-renderer';
import { LATENCY_COLORS, hexToRgba } from '@/lib/visualization/colors';

// ── Types ───────────────────────────────────────────────────

export interface LatencyPercentileData {
  /** Rolling data points (1 per second, 60 points max). */
  p50: number[];
  p90: number[];
  p95: number[];
  p99: number[];
}

export interface LatencyPercentileChartProps {
  data: LatencyPercentileData;
  /** Height in CSS pixels. Default 120. */
  height?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const PADDING = { top: 8, right: 56, bottom: 4, left: 42 };
const CHART_HEIGHT = 120;
const LOG_MIN = 0.1;  // 0.1ms
const LOG_MAX = 10000; // 10s

const PERCENTILES = [
  { key: 'p99' as const, label: 'P99', color: LATENCY_COLORS.p99, alpha: 0.18 },
  { key: 'p95' as const, label: 'P95', color: LATENCY_COLORS.p95, alpha: 0.22 },
  { key: 'p90' as const, label: 'P90', color: LATENCY_COLORS.p90, alpha: 0.28 },
  { key: 'p50' as const, label: 'P50', color: LATENCY_COLORS.p50, alpha: 0.35 },
];

// ── Helpers ─────────────────────────────────────────────────

function formatLatencyMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms >= 1) return `${ms.toFixed(0)}ms`;
  return `${(ms * 1000).toFixed(0)}us`;
}

// ── Component ───────────────────────────────────────────────

export const LatencyPercentileChart = memo(function LatencyPercentileChart({
  data,
  height = CHART_HEIGHT,
  className,
}: LatencyPercentileChartProps) {
  const dataRef = useRef(data);
  dataRef.current = data;

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const d = dataRef.current;
      const maxLen = Math.max(d.p50.length, d.p90.length, d.p95.length, d.p99.length, 1);
      if (maxLen === 0) return;

      const plotLeft = PADDING.left;
      const plotRight = w - PADDING.right;
      const plotTop = PADDING.top;
      const plotBottom = h - PADDING.bottom;

      // Scales
      const xScale = linearScale(0, maxLen - 1, plotLeft, plotRight);
      const yScale = logScale(LOG_MIN, LOG_MAX, plotBottom, plotTop);

      // Grid lines at log ticks
      const yTickValues = logTicks(LOG_MIN, LOG_MAX);
      const yPositions = yTickValues.map(yScale);
      drawGridLines(ctx, plotLeft, plotRight, yPositions);

      // Y-axis labels
      const yLabels = yTickValues.map(formatLatencyMs);
      drawYAxisLabels(ctx, yPositions, yLabels, plotLeft - 4);

      // Stacked areas (P99 largest area at back, P50 smallest in front)
      const seriesAreas = PERCENTILES.map((p) => {
        const values = d[p.key];
        const points = values.map((v, i) => ({ x: xScale(i), y: yScale(Math.max(v, LOG_MIN)) }));
        return { points, color: p.color, alpha: p.alpha };
      });
      drawStackedArea(ctx, seriesAreas, plotBottom);

      // Lines on top
      for (const p of PERCENTILES) {
        const values = d[p.key];
        const points = values.map((v, i) => ({ x: xScale(i), y: yScale(Math.max(v, LOG_MIN)) }));
        drawLine(ctx, points, p.color, 1.2);
      }

      // Right-edge badges with current values
      const badgeX = plotRight + 6;
      for (let i = 0; i < PERCENTILES.length; i++) {
        const p = PERCENTILES[i];
        const values = d[p.key];
        const current = values[values.length - 1] ?? 0;
        const y = plotTop + 10 + i * 18;

        // Badge background
        ctx.fillStyle = hexToRgba(p.color, 0.15);
        const textWidth = 46;
        ctx.beginPath();
        ctx.roundRect(badgeX, y - 7, textWidth, 14, 3);
        ctx.fill();

        // Badge text
        ctx.fillStyle = p.color;
        ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${p.label} ${formatLatencyMs(current)}`, badgeX + 3, y);
      }
    },
    [],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    scheduleUpdate();
  }, [data, scheduleUpdate]);

  const currentP50 = data.p50[data.p50.length - 1] ?? 0;
  const currentP99 = data.p99[data.p99.length - 1] ?? 0;
  const ariaLabel = `Latency percentile chart. P50: ${formatLatencyMs(currentP50)}, P99: ${formatLatencyMs(currentP99)}. Logarithmic scale from 0.1ms to 10 seconds.`;

  return (
    <div className={className} style={{ position: 'relative', height }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={ariaLabel}
      />
    </div>
  );
});

LatencyPercentileChart.displayName = "LatencyPercentileChart";
