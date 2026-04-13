'use client';

// ─────────────────────────────────────────────────────────────
// CacheHitGauge — Donut Chart for Hit/Miss Ratio
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 72x72px (configurable)
// Rendering: Canvas 2D
// Features:
//   - Two-segment donut: hit (green) vs miss (gray)
//   - Animated transition (250ms ease-out)
//   - Hit percentage in center
//
// Performance: < 0.2ms per frame
// Accessibility: aria-label with hit rate
// Responsive: Fixed square
// Implementation effort: S
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import { drawArc, drawCenteredText } from '@/lib/visualization/canvas-renderer';

// ── Types ───────────────────────────────────────────────────

export interface CacheHitGaugeProps {
  /** Hit rate 0..1. */
  hitRate: number;
  /** Side length in CSS pixels. Default 72. */
  size?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const HIT_COLOR = '#22C55E';
const MISS_COLOR = 'rgba(255,255,255,0.12)';
const RING_THICKNESS = 7;
const TWO_PI = Math.PI * 2;
const START_ANGLE = -Math.PI / 2; // 12 o'clock
const ANIMATION_MS = 250;

// ── Component ───────────────────────────────────────────────

export const CacheHitGauge = memo(function CacheHitGauge({
  hitRate,
  size = 72,
  className,
}: CacheHitGaugeProps) {
  const hitRef = useRef(hitRate);
  const animRef = useRef({ current: 0, target: 0, startTime: 0 });

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const now = performance.now();
      const anim = animRef.current;

      if (anim.target !== hitRef.current) {
        anim.current = anim.current;
        anim.target = hitRef.current;
        anim.startTime = now;
      }

      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / ANIMATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const displayValue = anim.current + (anim.target - anim.current) * eased;
      if (progress >= 1) anim.current = anim.target;

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) / 2 - 4;
      const clamped = Math.max(0, Math.min(1, displayValue));
      const hitEnd = START_ANGLE + TWO_PI * clamped;

      // Miss segment (full circle background)
      drawArc(ctx, cx, cy, radius, RING_THICKNESS, START_ANGLE, START_ANGLE + TWO_PI, MISS_COLOR);

      // Hit segment
      if (clamped > 0) {
        drawArc(ctx, cx, cy, radius, RING_THICKNESS, START_ANGLE, hitEnd, HIT_COLOR);
      }

      // Center text
      const pctText = `${Math.round(clamped * 100)}%`;
      drawCenteredText(ctx, pctText, cx, cy - 2, HIT_COLOR, 12, '700');

      // "HIT" label below percentage
      drawCenteredText(ctx, 'HIT', cx, cy + 10, 'rgba(255,255,255,0.35)', 7, '600');
    },
    [],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    hitRef.current = hitRate;
    scheduleUpdate();
  }, [hitRate, scheduleUpdate]);

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={`Cache hit rate: ${Math.round(hitRate * 100)}%`}
      />
    </div>
  );
});

CacheHitGauge.displayName = "CacheHitGauge";
