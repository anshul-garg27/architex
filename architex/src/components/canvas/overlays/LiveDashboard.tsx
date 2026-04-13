'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { springs, reducedMotion } from '@/lib/constants/motion';

// ── Types ────────────────────────────────────────────────────

export interface LiveDashboardProps {
  /** Current comparisons count */
  comparisons: number;
  /** Current swaps count */
  swaps: number;
  /** Array size (for calculating theoretical complexity bounds) */
  arraySize: number;
  /** Algorithm ID (to determine expected complexity) */
  algorithmId: string;
  /** Whether currently running */
  isPlaying: boolean;
  /** Current step index */
  stepIndex: number;
  /** Total steps */
  totalSteps: number;
  className?: string;
}

// ── Space complexity mapping ────────────────────────────────

type SpaceComplexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n+k)';

function getSpaceComplexity(algorithmId: string): SpaceComplexity {
  const id = algorithmId.toLowerCase().replace(/[-_\s]/g, '');
  if (['merge', 'mergesort', 'tim', 'timsort'].some((s) => id.includes(s))) return 'O(n)';
  if (['quick', 'quicksort'].some((s) => id.includes(s))) return 'O(log n)';
  if (['counting', 'countingsort', 'radix', 'radixsort'].some((s) => id.includes(s))) return 'O(n+k)';
  // bubble, insertion, selection, heap, shell -> O(1)
  return 'O(1)';
}

function getSpacePercent(complexity: SpaceComplexity): number {
  switch (complexity) {
    case 'O(1)':
      return 5;
    case 'O(log n)':
      return 35;
    case 'O(n)':
      return 100;
    case 'O(n+k)':
      return 100;
  }
}

// ── Gauge math ──────────────────────────────────────────────

function getGaugeAngle(comparisons: number, n: number): number {
  const nLogN = n > 1 ? n * Math.log2(n) : n;
  const nSquared = (n * n) / 2;
  if (comparisons <= 0) return 0;
  if (comparisons <= n) return (comparisons / n) * 60; // green: 0-60deg
  if (comparisons <= nLogN) return 60 + ((comparisons - n) / (nLogN - n)) * 60; // yellow: 60-120deg
  return 120 + Math.min(((comparisons - nLogN) / (nSquared - nLogN)) * 60, 60); // red: 120-180deg
}

/**
 * Convert a polar angle (0=left, 180=right on a top-opening semicircle)
 * to an SVG arc point. The arc is drawn with center at (cx, cy), radius r,
 * sweeping from left (180deg in standard math) to right (0deg).
 */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  // Map gauge angle (0=left, 180=right) to math angle (180=left, 0=right)
  const mathAngle = 180 - angleDeg;
  const rad = (mathAngle * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

// ── ComplexityGauge ─────────────────────────────────────────

interface ComplexityGaugeProps {
  comparisons: number;
  arraySize: number;
  shouldReduceMotion: boolean | null;
}

const ComplexityGauge = memo(function ComplexityGauge({
  comparisons,
  arraySize,
  shouldReduceMotion,
}: ComplexityGaugeProps) {
  const width = 120;
  const height = 72;
  const cx = width / 2;
  const cy = height - 4;
  const r = 46;
  const strokeWidth = 8;

  const angle = useMemo(
    () => getGaugeAngle(comparisons, arraySize),
    [comparisons, arraySize],
  );

  const needleEnd = useMemo(
    () => polarToCartesian(cx, cy, r - strokeWidth / 2 - 2, angle),
    [cx, cy, r, strokeWidth, angle],
  );

  // Arc paths for the three zones
  const greenArc = describeArc(cx, cy, r, 0, 60);
  const yellowArc = describeArc(cx, cy, r, 60, 120);
  const redArc = describeArc(cx, cy, r, 120, 180);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        className="overflow-visible"
      >
        {/* Green zone: O(n) */}
        <path
          d={greenArc}
          fill="none"
          stroke="#22c55e"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* Yellow zone: O(n log n) */}
        <path
          d={yellowArc}
          fill="none"
          stroke="#eab308"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* Red zone: O(n^2) */}
        <path
          d={redArc}
          fill="none"
          stroke="#ef4444"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.8}
        />
        {/* Needle */}
        <motion.line
          x1={cx}
          y1={cy}
          initial={{ x2: needleEnd.x, y2: needleEnd.y }}
          animate={{
            x2: needleEnd.x,
            y2: needleEnd.y,
          }}
          transition={shouldReduceMotion ? reducedMotion.instantTransition : springs.smooth}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="text-foreground"
        />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="currentColor" className="text-foreground" />
      </svg>
      <span className="text-[11px] font-mono font-medium text-foreground-muted tabular-nums">
        {comparisons.toLocaleString()} comparisons
      </span>
    </div>
  );
});

// ── OdometerCounter ─────────────────────────────────────────

interface OdometerCounterProps {
  value: number;
  label: string;
  shouldReduceMotion: boolean | null;
}

const DIGIT_HEIGHT = 24;

const OdometerCounter = memo(function OdometerCounter({
  value,
  label,
  shouldReduceMotion,
}: OdometerCounterProps) {
  // Pad to at least 4 digits for visual consistency
  const digits = useMemo(() => {
    const str = String(Math.max(0, Math.floor(value)));
    return str.padStart(4, '0').split('');
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 100 }}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
        {label}
      </span>
      <div
        className="flex items-center justify-end overflow-hidden rounded-md border border-border/20 bg-background/50 px-1"
        style={{ height: DIGIT_HEIGHT }}
        aria-label={`${label}: ${value}`}
      >
        {digits.map((digit, i) => (
          <div
            key={`col-${i}`}
            className="relative overflow-hidden"
            style={{ width: 16, height: DIGIT_HEIGHT }}
          >
            <motion.div
              className="absolute left-0 top-0 w-full font-mono text-sm font-semibold text-foreground"
              style={{
                height: DIGIT_HEIGHT * 10,
              }}
              animate={{
                y: -parseInt(digit, 10) * DIGIT_HEIGHT,
              }}
              transition={
                shouldReduceMotion
                  ? reducedMotion.instantTransition
                  : springs.snappy
              }
            >
              {Array.from({ length: 10 }, (_, d) => (
                <div
                  key={d}
                  className="flex items-center justify-center"
                  style={{ height: DIGIT_HEIGHT }}
                >
                  {d}
                </div>
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── MemoryBar ───────────────────────────────────────────────

interface MemoryBarProps {
  algorithmId: string;
  shouldReduceMotion: boolean | null;
}

const MemoryBar = memo(function MemoryBar({
  algorithmId,
  shouldReduceMotion,
}: MemoryBarProps) {
  const complexity = useMemo(() => getSpaceComplexity(algorithmId), [algorithmId]);
  const percent = useMemo(() => getSpacePercent(complexity), [complexity]);

  return (
    <div className="flex flex-col items-center gap-1" style={{ width: 80 }}>
      <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
        Space
      </span>
      <div className="h-3 w-full overflow-hidden rounded-full border border-border/20 bg-background/50">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #22c55e 0%, #eab308 60%, #f59e0b 100%)',
          }}
          initial={{ width: '0%' }}
          animate={{ width: `${percent}%` }}
          transition={
            shouldReduceMotion
              ? reducedMotion.instantTransition
              : springs.gentle
          }
        />
      </div>
      <span className="text-[11px] font-mono font-medium text-foreground-muted">
        {complexity}
      </span>
    </div>
  );
});

// ── LiveDashboard Container ─────────────────────────────────

export const LiveDashboard = memo(function LiveDashboard({
  comparisons,
  swaps,
  arraySize,
  algorithmId,
  isPlaying: _isPlaying,
  stepIndex: _stepIndex,
  totalSteps: _totalSteps,
  className,
}: LiveDashboardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border border-border/30 bg-background/70 p-3 backdrop-blur-xl',
        className,
      )}
    >
      {/* Complexity Gauge */}
      <ComplexityGauge
        comparisons={comparisons}
        arraySize={arraySize}
        shouldReduceMotion={shouldReduceMotion}
      />

      {/* Divider */}
      <div className="h-12 w-px bg-border/20" />

      {/* Odometer Counters */}
      <div className="flex items-center gap-3">
        <OdometerCounter
          value={comparisons}
          label="Comparisons"
          shouldReduceMotion={shouldReduceMotion}
        />
        <OdometerCounter
          value={swaps}
          label="Swaps"
          shouldReduceMotion={shouldReduceMotion}
        />
      </div>

      {/* Divider */}
      <div className="h-12 w-px bg-border/20" />

      {/* Memory Bar */}
      <MemoryBar
        algorithmId={algorithmId}
        shouldReduceMotion={shouldReduceMotion}
      />
    </div>
  );
});

export default LiveDashboard;
