'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementState } from '@/lib/algorithms';
import { cn } from '@/lib/utils';
import { springs } from '@/lib/constants/motion';
import { SORTING_STATE_COLORS as STATE_COLORS } from '@/lib/algorithms/visualization-colors';
import { VizLegend } from './viz-primitives';

// ── Constants ───────────────────────────────────────────────

const SVG_PADDING = { top: 24, right: 24, bottom: 32, left: 36 };
const DEFAULT_HEIGHT = 400;

/** Active states get full opacity and glow effects. */
const ACTIVE_STATES = new Set<ElementState>([
  'comparing',
  'swapping',
  'sorted',
  'pivot',
  'active',
  'found',
]);

// ── Types ───────────────────────────────────────────────────

export interface DotPlotVisualizerProps {
  values: number[];
  states: ElementState[];
  className?: string;
  /** Container height in pixels. Defaults to 400. */
  height?: number;
  /** Algorithm ID (reserved for choreography-specific tuning) */
  algorithmId?: string;
  /** Whether the algorithm is currently playing */
  isPlaying?: boolean;
}

// ── Helpers ─────────────────────────────────────────────────

/** Resolve a CSS variable reference to its hex fallback for SVG attrs. */
function resolveColor(token: string): string {
  const match = token.match(/,\s*(#[0-9a-fA-F]{3,8})\)/);
  return match ? match[1] : token;
}

/** Dot radius adapts to array size so large arrays don't overlap. */
function getDotRadius(n: number, isActive: boolean): number {
  const base = n <= 20 ? 6 : n <= 50 ? 5 : n <= 100 ? 4 : 3;
  return isActive ? base + 1.5 : base;
}

// ── Component ───────────────────────────────────────────────

export const DotPlotVisualizer = memo(function DotPlotVisualizer({
  values,
  states,
  className,
  height = DEFAULT_HEIGHT,
}: DotPlotVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const n = values.length;

  const maxValue = useMemo(() => Math.max(...values, 1), [values]);

  // Compute the drawable area inside the SVG.
  const plotWidth = 600; // fixed internal SVG width — scales via viewBox
  const plotHeight = height;
  const xMin = SVG_PADDING.left;
  const xMax = plotWidth - SVG_PADDING.right;
  const yMin = SVG_PADDING.top;
  const yMax = plotHeight - SVG_PADDING.bottom;
  const drawW = xMax - xMin;
  const drawH = yMax - yMin;

  // ── Axis tick helpers ───────────────────────────────────

  const xTicks = useMemo(() => {
    if (n <= 1) return [0];
    const step = n <= 10 ? 1 : n <= 50 ? 5 : n <= 200 ? 20 : 50;
    const ticks: number[] = [];
    for (let i = 0; i <= n - 1; i += step) ticks.push(i);
    if (ticks[ticks.length - 1] !== n - 1) ticks.push(n - 1);
    return ticks;
  }, [n]);

  const yTicks = useMemo(() => {
    const count = 5;
    return Array.from({ length: count + 1 }, (_, i) =>
      Math.round((maxValue * i) / count),
    );
  }, [maxValue]);

  // ── Map index/value to SVG coordinates ──────────────────

  const toX = (index: number) =>
    n <= 1 ? xMin + drawW / 2 : xMin + (index / (n - 1)) * drawW;

  const toY = (value: number) =>
    yMax - (value / maxValue) * drawH;

  // Empty state
  if (n === 0) {
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
      aria-label="Dot plot visualization — sorted data forms a diagonal line"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background',
        className,
      )}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${plotWidth} ${plotHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
      >
        {/* ── Defs: glow filter for active dots ───────── */}
        <defs>
          <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Grid lines (very subtle) ────────────────── */}
        <g opacity={0.1}>
          {/* Horizontal grid lines at each y-tick */}
          {yTicks.map((v) => (
            <line
              key={`yg-${v}`}
              x1={xMin}
              y1={toY(v)}
              x2={xMax}
              y2={toY(v)}
              stroke="currentColor"
              strokeWidth={0.5}
            />
          ))}
          {/* Vertical grid lines at each x-tick */}
          {xTicks.map((i) => (
            <line
              key={`xg-${i}`}
              x1={toX(i)}
              y1={yMin}
              x2={toX(i)}
              y2={yMax}
              stroke="currentColor"
              strokeWidth={0.5}
            />
          ))}
        </g>

        {/* ── Sorted reference diagonal ───────────────── */}
        <line
          x1={toX(0)}
          y1={toY(0)}
          x2={toX(n - 1)}
          y2={toY(maxValue)}
          stroke="currentColor"
          strokeWidth={1}
          strokeDasharray="6 4"
          opacity={0.15}
        />

        {/* ── Axes ────────────────────────────────────── */}
        <line
          x1={xMin}
          y1={yMax}
          x2={xMax}
          y2={yMax}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.25}
        />
        <line
          x1={xMin}
          y1={yMin}
          x2={xMin}
          y2={yMax}
          stroke="currentColor"
          strokeWidth={1}
          opacity={0.25}
        />

        {/* X-axis labels */}
        {xTicks.map((i) => (
          <text
            key={`xl-${i}`}
            x={toX(i)}
            y={yMax + 16}
            textAnchor="middle"
            className="fill-current opacity-40"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)' }}
          >
            {i}
          </text>
        ))}

        {/* Y-axis labels */}
        {yTicks.map((v) => (
          <text
            key={`yl-${v}`}
            x={xMin - 6}
            y={toY(v) + 3}
            textAnchor="end"
            className="fill-current opacity-40"
            style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)' }}
          >
            {v}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={xMin + drawW / 2}
          y={plotHeight - 2}
          textAnchor="middle"
          className="fill-current opacity-30"
          style={{ fontSize: 8, fontFamily: 'var(--font-mono, monospace)' }}
        >
          position
        </text>
        <text
          x={8}
          y={yMin + drawH / 2}
          textAnchor="middle"
          className="fill-current opacity-30"
          style={{
            fontSize: 8,
            fontFamily: 'var(--font-mono, monospace)',
          }}
          transform={`rotate(-90, 8, ${yMin + drawH / 2})`}
        >
          value
        </text>

        {/* ── Data dots ───────────────────────────────── */}
        {values.map((value, index) => {
          const state = states[index] ?? 'default';
          const isActive = ACTIVE_STATES.has(state);
          const color = resolveColor(STATE_COLORS[state]);
          const r = getDotRadius(n, isActive);
          const cx = toX(index);
          const cy = toY(value);

          return (
            <motion.circle
              key={`dot-${index}`}
              cx={cx}
              cy={cy}
              fill={color}
              filter={isActive ? 'url(#dot-glow)' : undefined}
              initial={
                shouldReduceMotion
                  ? { r, opacity: isActive ? 1 : 0.6, cx, cy }
                  : { r: 0, opacity: 0, cx, cy }
              }
              animate={{
                r,
                opacity: isActive ? 1 : 0.6,
                cx,
                cy,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      // Entry: staggered scale-in
                      r: {
                        delay: index * (0.8 / Math.max(n, 1)),
                        ...springs.smooth,
                      },
                      opacity: {
                        delay: index * (0.8 / Math.max(n, 1)),
                        duration: 0.2,
                      },
                      // Position: smooth spring for sort transitions
                      cx: springs.smooth,
                      cy: springs.smooth,
                    }
              }
            />
          );
        })}
      </svg>

      {/* ── Legend ─────────────────────────────────────── */}
      <VizLegend
        position="bottom-right"
        items={[
          { color: resolveColor(STATE_COLORS.comparing), label: 'comparing' },
          { color: resolveColor(STATE_COLORS.swapping), label: 'swapping' },
          { color: resolveColor(STATE_COLORS.sorted), label: 'sorted' },
          { color: resolveColor(STATE_COLORS.pivot), label: 'pivot' },
        ]}
      />
    </div>
  );
});
