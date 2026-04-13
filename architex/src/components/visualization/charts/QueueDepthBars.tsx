'use client';

// ─────────────────────────────────────────────────────────────
// QueueDepthBars — Horizontal Bar Chart per Node
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x (nodes * 28 + 16)px height
// Rendering: Canvas 2D
// Features:
//   - One horizontal bar per queue-bearing node
//   - Color: green (<50%), yellow (50-80%), red (>80%)
//   - Animated bar width transitions (300ms ease-out)
//   - Max capacity marker (dashed vertical line)
//   - Node label on left
//
// Performance: < 0.5ms per frame for 10 bars
// Accessibility: aria-label with queue occupancy per node
// Responsive: Fills parent width, height scales with node count
// Implementation effort: M
// ─────────────────────────────────────────────────────────────

import { memo, useCallback, useEffect, useRef } from 'react';
import { useCanvasChart } from '@/hooks/use-canvas-chart';
import { drawHBar } from '@/lib/visualization/canvas-renderer';
import { utilizationColor } from '@/lib/visualization/colors';

// ── Types ───────────────────────────────────────────────────

export interface QueueData {
  nodeId: string;
  label: string;
  current: number;
  capacity: number;
}

export interface QueueDepthBarsProps {
  queues: QueueData[];
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const BAR_HEIGHT = 16;
const BAR_GAP = 12;
const PADDING = { top: 8, right: 16, bottom: 8, left: 90 };
const ANIMATION_DURATION_MS = 300;

// ── Component ───────────────────────────────────────────────

export const QueueDepthBars = memo(function QueueDepthBars({
  queues,
  className,
}: QueueDepthBarsProps) {
  const queuesRef = useRef(queues);
  queuesRef.current = queues;

  // Animated current values
  const animatedRef = useRef<Map<string, { current: number; target: number; startTime: number }>>(
    new Map(),
  );

  const computedHeight = queues.length * (BAR_HEIGHT + BAR_GAP) + PADDING.top + PADDING.bottom;

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const qs = queuesRef.current;
      if (qs.length === 0) return;

      const now = performance.now();
      const plotLeft = PADDING.left;
      const plotRight = w - PADDING.right;
      const maxBarWidth = plotRight - plotLeft;

      for (let i = 0; i < qs.length; i++) {
        const q = qs[i];
        const y = PADDING.top + i * (BAR_HEIGHT + BAR_GAP);

        // Animation state
        let anim = animatedRef.current.get(q.nodeId);
        if (!anim) {
          anim = { current: q.current, target: q.current, startTime: now };
          animatedRef.current.set(q.nodeId, anim);
        }
        if (anim.target !== q.current) {
          anim.current = anim.current; // freeze at current interpolated value
          anim.target = q.current;
          anim.startTime = now;
        }

        // Ease-out interpolation
        const elapsed = now - anim.startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const displayValue = anim.current + (anim.target - anim.current) * eased;
        if (progress >= 1) anim.current = anim.target;

        // Filledness
        const fillRatio = q.capacity > 0 ? displayValue / q.capacity : 0;
        const barWidth = Math.max(fillRatio * maxBarWidth, 0);
        const color = utilizationColor(fillRatio);

        // Background track
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(plotLeft, y, maxBarWidth, BAR_HEIGHT, 3);
        ctx.fill();

        // Filled bar
        drawHBar(ctx, plotLeft, y, barWidth, BAR_HEIGHT, color, 3);

        // Capacity marker (dashed line at 100%)
        ctx.setLineDash([3, 2]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(plotRight, y);
        ctx.lineTo(plotRight, y + BAR_HEIGHT);
        ctx.stroke();
        ctx.setLineDash([]);

        // Node label
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(q.label, plotLeft - 6, y + BAR_HEIGHT / 2);

        // Value label inside bar
        ctx.fillStyle = fillRatio > 0.3 ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.5)';
        ctx.font = '600 9px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          `${Math.round(displayValue)}/${q.capacity}`,
          plotLeft + 4,
          y + BAR_HEIGHT / 2,
        );
      }
    },
    [],
  );

  const { canvasRef, scheduleUpdate } = useCanvasChart({ render });

  useEffect(() => {
    scheduleUpdate();
  }, [queues, scheduleUpdate]);

  const ariaLabel = queues
    .map((q) => {
      const pct = q.capacity > 0 ? ((q.current / q.capacity) * 100).toFixed(0) : '0';
      return `${q.label}: ${q.current} of ${q.capacity} (${pct}%)`;
    })
    .join('. ');

  return (
    <div className={className} style={{ position: 'relative', height: computedHeight }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
        role="img"
        aria-label={`Queue depth bars. ${ariaLabel}`}
      />
    </div>
  );
});

QueueDepthBars.displayName = "QueueDepthBars";
