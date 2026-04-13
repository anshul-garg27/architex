'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementState } from '@/lib/algorithms';
import { cn } from '@/lib/utils';
import { SORTING_STATE_COLORS } from '@/lib/algorithms/visualization-colors';

// ── Constants ───────────────────────────────────────────────

const LABEL_HEIGHT = 20;
const CANVAS_THRESHOLD = 200;
const ENTRY_STAGGER_MS = 15;
const COLOR_TRANSITION_MS = 200;

// ── Types ───────────────────────────────────────────────────

export interface ColorMapVisualizerProps {
  values: number[];
  states: ElementState[];
  className?: string;
  /** Container height in pixels. Defaults to 120. */
  height?: number;
  /** Whether the algorithm is currently playing. */
  isPlaying?: boolean;
}

// ── Color helpers ───────────────────────────────────────────

function valueToHSL(value: number, maxValue: number, lightness = 55): string {
  const hue = (value / maxValue) * 270;
  return `hsl(${hue}, 80%, ${lightness}%)`;
}

function stateToOverlayStyle(state: ElementState): React.CSSProperties {
  switch (state) {
    case 'comparing':
      return { borderTop: `2px solid ${SORTING_STATE_COLORS.comparing}` };
    case 'swapping':
      return { border: '2px dashed rgba(255,255,255,0.7)' };
    case 'sorted':
      return {}; // Brightness boost handled via lightness param
    default:
      return {};
  }
}

function stateLightnessBoost(state: ElementState): number {
  return state === 'sorted' ? 65 : 55;
}

// ── Canvas renderer (>200 elements) ─────────────────────────

const CanvasColorMap = memo(function CanvasColorMap({
  values,
  states,
  maxValue,
  width,
  height,
  shouldReduceMotion,
}: {
  values: number[];
  states: ElementState[];
  maxValue: number;
  width: number;
  height: number;
  shouldReduceMotion: boolean | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animProgressRef = useRef(0);
  const prevTimestampRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  // Draw the color map to canvas
  const draw = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const drawWidth = width * dpr;
      const drawHeight = height * dpr;

      if (canvas.width !== drawWidth || canvas.height !== drawHeight) {
        canvas.width = drawWidth;
        canvas.height = drawHeight;
      }

      ctx.clearRect(0, 0, drawWidth, drawHeight);

      const cellWidth = drawWidth / values.length;
      const visibleCount = Math.min(
        values.length,
        Math.ceil(progress * values.length),
      );

      for (let i = 0; i < values.length; i++) {
        const state = states[i] ?? 'default';
        const lightness = stateLightnessBoost(state);
        const hue = (values[i] / maxValue) * 270;
        const alpha = i < visibleCount ? 1 : 0;

        if (alpha === 0) continue;

        const x = Math.floor(i * cellWidth);
        const nextX = Math.floor((i + 1) * cellWidth);
        const w = nextX - x;

        // Main cell color
        ctx.fillStyle = `hsl(${hue}, 80%, ${lightness}%)`;
        ctx.fillRect(x, 0, w, drawHeight);

        // State overlays
        if (state === 'comparing') {
          ctx.fillStyle = SORTING_STATE_COLORS.comparing;
          ctx.fillRect(x, 0, w, 2 * dpr);
        } else if (state === 'swapping') {
          ctx.strokeStyle = 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 2 * dpr;
          ctx.setLineDash([4 * dpr, 3 * dpr]);
          ctx.strokeRect(x + 1, 1, w - 2, drawHeight - 2);
          ctx.setLineDash([]);
        }
      }
    },
    [values, states, maxValue, width, height],
  );

  // Entry animation: fade cells in left-to-right
  useEffect(() => {
    if (shouldReduceMotion) {
      animProgressRef.current = 1;
      draw(1);
      return;
    }

    animProgressRef.current = 0;
    prevTimestampRef.current = null;

    const totalDuration = values.length * ENTRY_STAGGER_MS;

    const animate = (timestamp: number) => {
      if (prevTimestampRef.current === null) {
        prevTimestampRef.current = timestamp;
      }
      const elapsed = timestamp - prevTimestampRef.current;
      animProgressRef.current = Math.min(1, elapsed / totalDuration);
      draw(animProgressRef.current);

      if (animProgressRef.current < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  // Only run on mount (values.length change triggers new entry)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.length, shouldReduceMotion]);

  // Redraw when values/states change (after initial entry)
  useEffect(() => {
    if (animProgressRef.current >= 1) {
      draw(1);
    }
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        display: 'block',
      }}
    />
  );
});

// ── DOM renderer (<=200 elements) ───────────────────────────

const DOMColorMap = memo(function DOMColorMap({
  values,
  states,
  maxValue,
  height,
  shouldReduceMotion,
}: {
  values: number[];
  states: ElementState[];
  maxValue: number;
  height: number;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <div
      className="flex w-full"
      style={{ height }}
    >
      {values.map((value, index) => {
        const state = states[index] ?? 'default';
        const lightness = stateLightnessBoost(state);
        const color = valueToHSL(value, maxValue, lightness);
        const overlayStyle = stateToOverlayStyle(state);

        return (
          <motion.div
            key={index}
            className="flex-1 min-w-0"
            style={{
              backgroundColor: color,
              transition: shouldReduceMotion
                ? 'none'
                : `background-color ${COLOR_TRANSITION_MS}ms ease`,
              ...overlayStyle,
            }}
            initial={
              shouldReduceMotion ? false : { opacity: 0 }
            }
            animate={{ opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: index * (ENTRY_STAGGER_MS / 1000), duration: 0.15 }
            }
          />
        );
      })}
    </div>
  );
});

// ── Main component ──────────────────────────────────────────

export const ColorMapVisualizer = memo(function ColorMapVisualizer({
  values,
  states,
  className,
  height = 120,
  isPlaying: _isPlaying,
}: ColorMapVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const maxValue = useMemo(() => Math.max(...values, 1), [values]);

  // Adaptive label visibility (mirrors ArrayVisualizer)
  const showAllIndices = values.length <= 20;
  const showSparseIndices = values.length <= 50;

  const useCanvas = values.length > CANVAS_THRESHOLD;
  const cellAreaHeight = height - (showAllIndices || showSparseIndices ? LABEL_HEIGHT : 0);

  // Measure container width for canvas sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (values.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No data to visualize</p>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label="Color map visualization"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background px-2 pt-2',
        className,
      )}
      style={{ height }}
    >
      {/* Color strip container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-md"
        style={{ height: cellAreaHeight }}
      >
        {useCanvas && containerWidth > 0 ? (
          <CanvasColorMap
            values={values}
            states={states}
            maxValue={maxValue}
            width={containerWidth}
            height={cellAreaHeight}
            shouldReduceMotion={shouldReduceMotion}
          />
        ) : !useCanvas ? (
          <DOMColorMap
            values={values}
            states={states}
            maxValue={maxValue}
            height={cellAreaHeight}
            shouldReduceMotion={shouldReduceMotion}
          />
        ) : null}
      </div>

      {/* Index labels below — all when <=20, every 5th when <=50, hidden otherwise */}
      {(showAllIndices || showSparseIndices) && (
        <div
          className="flex w-full"
          style={{ height: LABEL_HEIGHT }}
        >
          {values.map((_, index) => {
            const showLabel =
              showAllIndices || (showSparseIndices && index % 5 === 0);
            return (
              <div
                key={index}
                className="flex flex-1 min-w-0 items-center justify-center"
              >
                {showLabel && (
                  <span className="text-xs font-mono text-foreground-subtle">
                    {index}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
