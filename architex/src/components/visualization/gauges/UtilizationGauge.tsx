'use client';

// ─────────────────────────────────────────────────────────────
// UtilizationGauge — Circular Donut Gauge
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 80x80px (configurable)
// Rendering: Canvas 2D
// Features:
//   - 270-degree arc (gap at bottom)
//   - Color gradient: green -> yellow -> red
//   - Current percentage in center (large mono text)
//   - Animated arc transition (300ms ease-out)
//   - Track (background ring at 4% opacity)
//
// Performance: < 0.3ms per frame
// Accessibility: aria-label with node name and utilization
// Responsive: Fixed square, centered in container
// Implementation effort: M
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import { drawArc, drawCenteredText } from '@/lib/visualization/canvas-renderer';
import { utilizationColor } from '@/lib/visualization/colors';

// ── Types ───────────────────────────────────────────────────

export interface UtilizationGaugeProps {
  /** Node name shown below the gauge. */
  label: string;
  /** Utilization 0..1. */
  value: number;
  /** Side length in CSS pixels. Default 80. */
  size?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const ARC_START = Math.PI * 0.75;  // 135 degrees from top
const ARC_END = Math.PI * 2.25;    // 405 degrees (270 degree sweep)
const ARC_SWEEP = ARC_END - ARC_START;
const RING_THICKNESS = 8;
const ANIMATION_MS = 300;

// ── Component ───────────────────────────────────────────────

export const UtilizationGauge = memo(function UtilizationGauge({
  label,
  value,
  size = 80,
  className,
}: UtilizationGaugeProps) {
  const valueRef = useRef(value);
  const animRef = useRef({ current: 0, target: 0, startTime: 0 });

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const now = performance.now();
      const anim = animRef.current;

      // Update animation target
      if (anim.target !== valueRef.current) {
        anim.current = anim.current; // freeze at interpolated
        anim.target = valueRef.current;
        anim.startTime = now;
      }

      // Ease-out interpolation
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / ANIMATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const displayValue = anim.current + (anim.target - anim.current) * eased;
      if (progress >= 1) anim.current = anim.target;

      const cx = w / 2;
      const cy = h / 2 - 6; // shift up to leave room for label
      const radius = Math.min(w, h) / 2 - 4;
      const clampedValue = Math.max(0, Math.min(1, displayValue));

      // Track (background ring)
      drawArc(
        ctx,
        cx, cy,
        radius,
        RING_THICKNESS,
        ARC_START,
        ARC_END,
        'rgba(255,255,255,0.06)',
      );

      // Filled arc
      const fillEnd = ARC_START + ARC_SWEEP * clampedValue;
      const fillColor = utilizationColor(clampedValue);
      drawArc(ctx, cx, cy, radius, RING_THICKNESS, ARC_START, fillEnd, fillColor);

      // Center text: percentage
      const pctText = `${Math.round(clampedValue * 100)}%`;
      drawCenteredText(ctx, pctText, cx, cy, fillColor, 14, '700');

      // Label below
      drawCenteredText(
        ctx,
        label,
        cx,
        h - 6,
        'rgba(255,255,255,0.5)',
        9,
        '500',
      );
    },
    [label],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    valueRef.current = value;
    scheduleUpdate();
  }, [value, scheduleUpdate]);

  const ariaLabel = `${label} utilization: ${Math.round(value * 100)}%`;

  return (
    <div
      className={className}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={ariaLabel}
      />
    </div>
  );
});

UtilizationGauge.displayName = "UtilizationGauge";
