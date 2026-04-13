'use client';

// ─────────────────────────────────────────────────────────────
// Sparkline — Tiny Inline Charts (60x16px)
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 60x16px (configurable)
// Rendering: Canvas 2D
// Variants: line (throughput), area (latency), red-line (error)
// Data: Last 30 seconds, no axes, no labels
//
// Performance: < 0.15ms per frame
// Accessibility: aria-label with current value
// Responsive: Fixed size, inline display
// Implementation effort: S
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import { linearScale, drawLine, drawArea } from '@/lib/visualization/canvas-renderer';

// ── Types ───────────────────────────────────────────────────

export type SparklineVariant = 'line' | 'area' | 'error';

export interface SparklineProps {
  /** Data values (last 30 points). */
  data: number[];
  /** Visual variant. Default 'line'. */
  variant?: SparklineVariant;
  /** Line/fill color. Default varies by variant. */
  color?: string;
  /** Width in CSS pixels. Default 60. */
  width?: number;
  /** Height in CSS pixels. Default 16. */
  height?: number;
  /** Label for accessibility. */
  label?: string;
  className?: string;
}

// ── Default Colors ──────────────────────────────────────────

const VARIANT_DEFAULTS: Record<SparklineVariant, { color: string; fill: boolean; fillAlpha: number }> = {
  line:  { color: '#648FFF', fill: false, fillAlpha: 0 },
  area:  { color: '#EF4444', fill: true, fillAlpha: 0.2 },
  error: { color: '#EF4444', fill: false, fillAlpha: 0 },
};

// ── Component ───────────────────────────────────────────────

export const Sparkline = memo(function Sparkline({
  data,
  variant = 'line',
  color,
  width = 60,
  height = 16,
  label = 'Sparkline chart',
  className,
}: SparklineProps) {
  const dataRef = useRef(data);
  dataRef.current = data;

  const defaults = VARIANT_DEFAULTS[variant];
  const lineColor = color ?? defaults.color;

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const d = dataRef.current;
      if (d.length < 2) return;

      const pad = 1;
      const plotLeft = pad;
      const plotRight = w - pad;
      const plotTop = pad;
      const plotBottom = h - pad;

      let yMin = Infinity;
      let yMax = -Infinity;
      for (const v of d) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
      // Ensure some vertical range
      if (yMax - yMin < 0.001) { yMin = 0; yMax = Math.max(yMax, 1); }

      const xScale = linearScale(0, d.length - 1, plotLeft, plotRight);
      const yScale = linearScale(yMin, yMax, plotBottom, plotTop);

      const points = d.map((v, i) => ({ x: xScale(i), y: yScale(v) }));

      // Fill if variant calls for it
      if (defaults.fill) {
        drawArea(ctx, points, plotBottom, lineColor, defaults.fillAlpha);
      }

      // Line
      drawLine(ctx, points, lineColor, 1);
    },
    [lineColor, defaults],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    scheduleUpdate();
  }, [data, scheduleUpdate]);

  const current = data[data.length - 1] ?? 0;

  return (
    <div
      className={className}
      style={{ width, height, position: 'relative', display: 'inline-block' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={`${label}. Current value: ${current.toFixed(1)}`}
      />
    </div>
  );
});

Sparkline.displayName = "Sparkline";
