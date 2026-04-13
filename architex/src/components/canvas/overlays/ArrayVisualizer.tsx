'use client';

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { ElementState } from '@/lib/algorithms';
import { cn } from '@/lib/utils';
import { animations, duration, springs } from '@/lib/constants/motion';
import { SORTING_STATE_COLORS as STATE_COLORS, SORTING_STATE_GRADIENTS } from '@/lib/algorithms/visualization-colors';
import { getChoreography } from '@/lib/algorithms/algorithm-choreography';
import { Spotlight, getBarOpacity } from './Spotlight';
import { VizLegend } from './viz-primitives';

const MIN_BAR_HEIGHT = 8;
const BAR_GAP = 2;
const LABEL_HEIGHT = 20;
const VALUE_LABEL_OFFSET = 4;

// ── Types ────────────────────────────────────────────────────

export interface ArrayVisualizerProps {
  values: number[];
  states: ElementState[];
  className?: string;
  /** Container height in pixels. Defaults to 280. */
  height?: number;
  /** ALG-212: When true, bars are clickable for manual tracing. */
  traceMode?: boolean;
  /** ALG-212: Callback when a bar is clicked in trace mode. */
  onBarClick?: (index: number) => void;
  /** Phase 1: Algorithm ID for choreography-specific animation personalities */
  algorithmId?: string;
  /** Phase 1: Whether the algorithm is currently playing (for spotlight) */
  isPlaying?: boolean;
}

// ── Stable key generation ───────────────────────────────────

let nextStableId = 0;

/**
 * Returns a stable key array that tracks elements through swaps.
 * A new set of keys is generated only when the array length changes;
 * otherwise the existing keys are preserved across renders.
 */
function useStableKeys(length: number): string[] {
  const keysRef = useRef<string[]>([]);
  if (keysRef.current.length !== length) {
    keysRef.current = Array.from({ length }, () => `av-${++nextStableId}`);
  }
  return keysRef.current;
}

// ── Colorblind-safe state patterns (ALG-154) ───────────────

function getStatePattern(state: ElementState): string {
  switch (state) {
    case 'comparing':
      return 'bg-gradient-to-t from-blue-600 to-blue-400';
    case 'swapping':
      return 'border-2 border-dashed border-white/50';
    case 'sorted':
      return 'border-t-2 border-white';
    case 'pivot':
      return 'ring-2 ring-purple-400 ring-offset-1';
    default:
      return '';
  }
}

// ── Component ────────────────────────────────────────────────

export const ArrayVisualizer = memo(function ArrayVisualizer({
  values,
  states,
  className,
  height = 280,
  traceMode,
  onBarClick,
  algorithmId,
  isPlaying = false,
}: ArrayVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const stableKeys = useStableKeys(values.length);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const maxValue = useMemo(
    () => Math.max(...values, 1),
    [values],
  );

  // Phase 1: Algorithm-specific choreography
  const choreo = useMemo(
    () => getChoreography(algorithmId ?? ''),
    [algorithmId],
  );

  // Phase 1: Derive active indices for spotlight
  const activeIndices = useMemo(
    () => states.reduce<number[]>((acc, s, i) => {
      if (s === 'comparing' || s === 'swapping' || s === 'active') acc.push(i);
      return acc;
    }, []),
    [states],
  );

  // Measure container width for spotlight positioning
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

  // Adaptive label visibility based on array size (ALG-245)
  const showValueLabels = values.length <= 30;
  const showAllIndices = values.length <= 20;
  const showSparseIndices = values.length <= 50;

  const barAreaHeight = height - LABEL_HEIGHT;

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
      aria-label="Algorithm visualization"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background px-2 pt-2',
        className,
      )}
      style={{ height }}
    >
      {/* Bars container */}
      <div
        ref={containerRef}
        className="relative flex items-end justify-center gap-px"
        style={{
          height: barAreaHeight,
          gap: BAR_GAP,
        }}
      >
        {/* Phase 1: Spotlight overlay */}
        <Spotlight
          totalElements={values.length}
          activeIndices={activeIndices}
          containerWidth={containerWidth}
          containerHeight={barAreaHeight}
          isPlaying={isPlaying}
        />
        {values.map((value, index) => {
          const state = states[index] ?? 'default';
          const color = STATE_COLORS[state];
          const barHeight = Math.max(
            (value / maxValue) * (barAreaHeight - VALUE_LABEL_OFFSET - 16),
            MIN_BAR_HEIGHT,
          );

          return (
            <div
              key={stableKeys[index]}
              className="relative flex flex-1 flex-col items-center justify-end"
              style={{ minWidth: 0, maxWidth: 48 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Hover tooltip (ALG-248) */}
              {hoveredIndex === index && (
                <div className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-border/30 bg-background/80 backdrop-blur-md px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none">
                  <span className="text-[10px] text-foreground-muted">
                    Value: {value} | Index: {index} | State: {state}
                  </span>
                </div>
              )}

              {/* Value label on top of bar — hidden at 30+ elements to prevent overlap */}
              {showValueLabels && (
                <motion.span
                  className="mb-0.5 text-[10px] font-mono font-medium leading-none"
                  style={{ color }}
                  initial={false}
                  animate={{ color }}
                  transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.normal }}
                >
                  {value}
                </motion.span>
              )}

              {/* Bar — entry animation with staggered cascade */}
              {/* ALG-241: Use gradient background via style instead of animated backgroundColor */}
              {/* ALG-212: Clickable in trace mode */}
              <motion.div
                onClick={traceMode ? () => onBarClick?.(index) : undefined}
                className={cn(
                  'w-full rounded-t-md',
                  getStatePattern(state),
                  traceMode && 'cursor-pointer hover:ring-2 hover:ring-primary',
                )}
                style={{
                  transformOrigin: 'bottom',
                  minWidth: 4,
                  background: SORTING_STATE_GRADIENTS[state] || SORTING_STATE_GRADIENTS.default,
                  boxShadow: state === 'comparing'
                    ? `inset 0 0 20px rgba(255,255,255,0.1), 0 0 ${8 + choreo.compareGlowIntensity * 12}px rgba(59,130,246,${choreo.compareGlowIntensity})`
                    : state !== 'default'
                      ? 'inset 0 0 20px rgba(255,255,255,0.1), 0 0 8px rgba(59,130,246,0.3)'
                      : 'none',
                  filter: state !== 'default' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
                }}
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: 1,
                  opacity: getBarOpacity(index, state, activeIndices, isPlaying),
                  height: barHeight,
                }}
                transition={{
                  scaleY: shouldReduceMotion
                    ? { duration: 0 }
                    : { delay: index * choreo.entryStagger, ...springs.bouncy },
                  opacity: shouldReduceMotion
                    ? { duration: 0 }
                    : { delay: index * choreo.entryStagger, duration: 0.15 },
                  height: shouldReduceMotion
                    ? { duration: 0 }
                    : { ...choreo.barTransition },
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Index labels below bars — all when <=20, every 5th when <=50, hidden otherwise */}
      {(showAllIndices || showSparseIndices) && (
        <div
          className="flex justify-center gap-px"
          style={{
            height: LABEL_HEIGHT,
            gap: BAR_GAP,
          }}
        >
          {values.map((_, index) => {
            const showLabel = showAllIndices || (showSparseIndices && index % 5 === 0);
            return (
              <div
                key={stableKeys[index]}
                className="flex flex-1 items-center justify-center"
                style={{ minWidth: 0, maxWidth: 48 }}
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

      {/* Legend — uses shared VizLegend primitive (ALG-247) */}
      <VizLegend
        position="bottom-right"
        items={[
          { color: STATE_COLORS.comparing, label: 'comparing' },
          { color: STATE_COLORS.swapping, label: 'swapping' },
          { color: STATE_COLORS.sorted, label: 'sorted' },
          { color: STATE_COLORS.pivot, label: 'pivot' },
        ]}
      />
    </div>
  );
});
