'use client';

// ─────────────────────────────────────────────────────────────
// ThroughputChart — Rolling 60s Window Line Chart
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 120px height
// Rendering: Canvas 2D (60fps capable)
// Granularity: 1-second data points, 60-point window
// Features:
//   - Multi-series (per-node, color-coded by category)
//   - Auto-scaling Y-axis with SI suffix (1K, 10K, 100K)
//   - Hover tooltip with exact values
//   - Anomaly markers (Z-score > 2.5 sigma)
//   - Horizontal grid lines (opacity 0.08)
//
// Performance: < 2ms per frame for 8 series x 60 points
// Accessibility: aria-label with current throughput summary
// Responsive: Fills parent width, fixed 120px height
// Implementation effort: L
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import {
  linearScale,
  niceRange,
  linearTicks,
  drawLine,
  drawArea,
  drawGridLines,
  drawYAxisLabels,
  drawAnomalyMarkers,
  detectAnomalies,
} from '@/lib/visualization/canvas-renderer';
import { siSuffix, hexToRgba } from '@/lib/visualization/colors';

// ── Types ───────────────────────────────────────────────────

export interface ThroughputSeries {
  id: string;
  label: string;
  color: string;
  /** Rolling 60-second data, one value per second. */
  data: number[];
}

export interface ThroughputChartProps {
  series: ThroughputSeries[];
  /** Height in CSS pixels. Default 120. */
  height?: number;
  /** Whether to show anomaly markers. Default true. */
  showAnomalies?: boolean;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const PADDING = { top: 8, right: 12, bottom: 4, left: 42 };
const TICK_COUNT = 5;
const CHART_HEIGHT = 120;

// ── Component ───────────────────────────────────────────────

export const ThroughputChart = memo(function ThroughputChart({
  series,
  height = CHART_HEIGHT,
  showAnomalies = true,
  className,
}: ThroughputChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    values: { label: string; color: string; value: number }[];
    index: number;
  } | null>(null);

  const seriesRef = useRef(series);
  seriesRef.current = series;

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const s = seriesRef.current;
      if (s.length === 0) return;

      const plotLeft = PADDING.left;
      const plotRight = w - PADDING.right;
      const plotTop = PADDING.top;
      const plotBottom = h - PADDING.bottom;
      const plotWidth = plotRight - plotLeft;
      const plotHeight = plotBottom - plotTop;

      // Find global Y range across all series
      let yMin = Infinity;
      let yMax = -Infinity;
      for (const sr of s) {
        for (const v of sr.data) {
          if (v < yMin) yMin = v;
          if (v > yMax) yMax = v;
        }
      }
      if (!isFinite(yMin)) { yMin = 0; yMax = 1; }
      const { min: nMin, max: nMax } = niceRange(Math.min(0, yMin), yMax);

      // Scales
      const xScale = linearScale(0, 59, plotLeft, plotRight);
      const yScale = linearScale(nMin, nMax, plotBottom, plotTop);

      // Grid lines
      const yTicks = linearTicks(nMin, nMax, TICK_COUNT);
      const yPositions = yTicks.map(yScale);
      drawGridLines(ctx, plotLeft, plotRight, yPositions);

      // Y-axis labels
      const yLabels = yTicks.map(siSuffix);
      drawYAxisLabels(ctx, yPositions, yLabels, plotLeft - 4);

      // Draw each series
      for (const sr of s) {
        const points = sr.data.map((v, i) => ({ x: xScale(i), y: yScale(v) }));

        // Area fill
        drawArea(ctx, points, plotBottom, sr.color, 0.12);

        // Line
        drawLine(ctx, points, sr.color, 1.5);

        // Anomaly markers
        if (showAnomalies) {
          const anomalyIndices = detectAnomalies(sr.data);
          const anomalyPoints = anomalyIndices.map((i) => points[i]);
          drawAnomalyMarkers(ctx, anomalyPoints, '#FFB000', 3);
        }
      }
    },
    [showAnomalies],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  // Re-render when series data changes
  useEffect(() => {
    scheduleUpdate();
  }, [series, scheduleUpdate]);

  // Mouse interaction for tooltip
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const w = rect.width;

      const plotLeft = PADDING.left;
      const plotRight = w - PADDING.right;
      const plotWidth = plotRight - plotLeft;

      // Map mouse X to data index
      const ratio = (mouseX - plotLeft) / plotWidth;
      const index = Math.round(ratio * 59);
      if (index < 0 || index > 59) {
        setTooltip(null);
        return;
      }

      const values = seriesRef.current
        .filter((sr) => sr.data[index] !== undefined)
        .map((sr) => ({
          label: sr.label,
          color: sr.color,
          value: sr.data[index],
        }));

      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        values,
        index,
      });
    },
    [canvasRef],
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  // Accessibility: compute summary string
  const totalCurrent =
    series.length > 0
      ? series.reduce(
          (sum, sr) => sum + (sr.data[sr.data.length - 1] ?? 0),
          0,
        )
      : 0;
  const ariaLabel = `Throughput chart. Current total: ${siSuffix(totalCurrent)} requests per second across ${series.length} series. 60-second rolling window.`;

  return (
    <div className={className} style={{ position: 'relative', height }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={ariaLabel}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border px-2 py-1.5 text-[10px] font-mono shadow-lg"
          style={{
            left: Math.min(tooltip.x + 12, 200),
            top: tooltip.y - 10,
            backgroundColor: 'var(--viz-tooltip-bg)',
            color: 'var(--viz-tooltip-text)',
            borderColor: 'var(--viz-tooltip-border)',
          }}
        >
          <div className="mb-0.5 text-[9px] opacity-60">
            t-{59 - tooltip.index}s
          </div>
          {tooltip.values.map((v) => (
            <div key={v.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: v.color }}
              />
              <span className="opacity-70">{v.label}:</span>
              <span className="font-medium">{siSuffix(v.value)} rps</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

ThroughputChart.displayName = "ThroughputChart";
