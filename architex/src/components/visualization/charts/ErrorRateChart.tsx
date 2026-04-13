'use client';

// ─────────────────────────────────────────────────────────────
// ErrorRateChart — Area Chart with SLO Threshold
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 80px height
// Rendering: Canvas 2D
// Features:
//   - Red area fill with opacity gradient (intensifies near SLO)
//   - Dashed threshold line at SLO target (default 1%)
//   - Fill color alpha: 0.1 at 0%, 0.8 at threshold
//
// Performance: < 0.8ms per frame
// Accessibility: aria-label with current error rate and SLO status
// Responsive: Fills parent width, fixed 80px height
// Implementation effort: M
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import {
  linearScale,
  niceRange,
  linearTicks,
  drawLine,
  drawGridLines,
  drawYAxisLabels,
} from '@/lib/visualization/canvas-renderer';
import { hexToRgba } from '@/lib/visualization/colors';

// ── Types ───────────────────────────────────────────────────

export interface ErrorRateChartProps {
  /** Error rate values (0..1), one per second, 60 points max. */
  data: number[];
  /** SLO threshold (0..1). Default 0.01 (1%). */
  sloThreshold?: number;
  /** Height in CSS pixels. Default 80. */
  height?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const PADDING = { top: 6, right: 12, bottom: 4, left: 36 };
const ERROR_COLOR = '#EF4444';
const THRESHOLD_COLOR = '#F59E0B';

// ── Component ───────────────────────────────────────────────

export const ErrorRateChart = memo(function ErrorRateChart({
  data,
  sloThreshold = 0.01,
  height = 80,
  className,
}: ErrorRateChartProps) {
  const dataRef = useRef(data);
  dataRef.current = data;
  const thresholdRef = useRef(sloThreshold);
  thresholdRef.current = sloThreshold;

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const d = dataRef.current;
      const threshold = thresholdRef.current;
      if (d.length === 0) return;

      const plotLeft = PADDING.left;
      const plotRight = w - PADDING.right;
      const plotTop = PADDING.top;
      const plotBottom = h - PADDING.bottom;

      // Y range: 0 to max(threshold * 2, max(data))
      const maxVal = Math.max(...d, threshold * 2);
      const { max: yMax } = niceRange(0, maxVal);

      const xScale = linearScale(0, d.length - 1, plotLeft, plotRight);
      const yScale = linearScale(0, yMax, plotBottom, plotTop);

      // Grid
      const yTicks = linearTicks(0, yMax, 4);
      const yPositions = yTicks.map(yScale);
      drawGridLines(ctx, plotLeft, plotRight, yPositions);
      drawYAxisLabels(
        ctx,
        yPositions,
        yTicks.map((v) => `${(v * 100).toFixed(1)}%`),
        plotLeft - 4,
      );

      // Gradient fill: alpha increases as error rate approaches threshold
      const points = d.map((v, i) => ({ x: xScale(i), y: yScale(v) }));

      // Draw filled area with per-column alpha based on value
      for (let i = 0; i < points.length - 1; i++) {
        const v = d[i];
        const intensity = Math.min(v / Math.max(threshold, 0.001), 1);
        const alpha = 0.08 + intensity * 0.55;

        ctx.beginPath();
        ctx.moveTo(points[i].x, plotBottom);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.lineTo(points[i + 1].x, plotBottom);
        ctx.closePath();

        ctx.fillStyle = hexToRgba(ERROR_COLOR, alpha);
        ctx.fill();
      }

      // Error rate line
      drawLine(ctx, points, ERROR_COLOR, 1.5);

      // SLO threshold dashed line
      const thresholdY = yScale(threshold);
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = THRESHOLD_COLOR;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(plotLeft, thresholdY);
      ctx.lineTo(plotRight, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Threshold label
      ctx.fillStyle = THRESHOLD_COLOR;
      ctx.font = '500 8px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`SLO ${(threshold * 100).toFixed(1)}%`, plotRight, thresholdY - 2);
    },
    [],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    scheduleUpdate();
  }, [data, sloThreshold, scheduleUpdate]);

  const current = data[data.length - 1] ?? 0;
  const overSlo = current > sloThreshold;
  const ariaLabel = `Error rate chart. Current: ${(current * 100).toFixed(2)}%. SLO threshold: ${(sloThreshold * 100).toFixed(1)}%. Status: ${overSlo ? 'EXCEEDING SLO' : 'within SLO'}.`;

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

ErrorRateChart.displayName = "ErrorRateChart";
