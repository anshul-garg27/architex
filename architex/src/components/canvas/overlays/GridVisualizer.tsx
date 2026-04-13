'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { duration, easing, springs } from '@/lib/constants/motion';
import {
  GRID_STATE_BG as STATE_BG,
  GRID_STATE_BORDER as STATE_BORDER,
  GRID_STATE_TEXT as STATE_TEXT,
} from '@/lib/algorithms/visualization-colors';

// ── Cell state types ────────────────────────────────────────────

type GridCellState =
  | 'empty'
  | 'queen'
  | 'conflict'
  | 'safe'
  | 'trying'
  | 'backtrack'
  | 'given';

// ── Props ───────────────────────────────────────────────────────

export interface GridVisualizerProps {
  /** Grid size (NxN). For Sudoku always 9. */
  size: number;
  /** Algorithm type to decide rendering mode. */
  mode: 'n-queens' | 'sudoku';
  /** Current animation step (drives cell states via mutations). */
  step: AnimationStep | null;
  /** For Sudoku: initial given numbers (9x9 flat, row-major, 0 = empty). */
  givenNumbers?: number[];
  /** Container height in pixels. Defaults to 480. */
  height?: number;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function getCellStateFromMutations(
  row: number,
  col: number,
  mutations: VisualMutation[],
): GridCellState | null {
  for (const m of mutations) {
    if (m.targetId === `grid-${row}-${col}` && m.property === 'highlight') {
      const val = String(m.to) as GridCellState;
      if (val in STATE_BG) return val;
    }
  }
  return null;
}

function getCellLabelFromMutations(
  row: number,
  col: number,
  mutations: VisualMutation[],
): string | null {
  for (const m of mutations) {
    if (m.targetId === `grid-${row}-${col}` && m.property === 'label') {
      return String(m.to);
    }
  }
  return null;
}

// ── Queen icon (simple crown/circle) ────────────────────────────

function QueenIcon({ size: s }: { size: number }) {
  const r = s * 0.32;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {/* Crown shape */}
      <circle cx={s / 2} cy={s / 2} r={r} fill="currentColor" />
      <polygon
        points={`${s * 0.2},${s * 0.55} ${s * 0.3},${s * 0.25} ${s * 0.5},${s * 0.45} ${s * 0.7},${s * 0.25} ${s * 0.8},${s * 0.55}`}
        fill="currentColor"
      />
    </svg>
  );
}

// ── Component ───────────────────────────────────────────────────

export const GridVisualizer = memo(function GridVisualizer({
  size,
  mode,
  step,
  givenNumbers,
  height = 480,
  className,
}: GridVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const mutations = step?.mutations ?? [];

  // Compute cell states for entire grid
  const cells = useMemo(() => {
    const result: {
      state: GridCellState;
      label: string | null;
      isGiven: boolean;
    }[][] = [];

    for (let r = 0; r < size; r++) {
      const row: typeof result[0] = [];
      for (let c = 0; c < size; c++) {
        const stepState = getCellStateFromMutations(r, c, mutations);
        const stepLabel = getCellLabelFromMutations(r, c, mutations);

        let isGiven = false;
        if (mode === 'sudoku' && givenNumbers) {
          const idx = r * 9 + c;
          isGiven = (givenNumbers[idx] ?? 0) !== 0;
        }

        row.push({
          state: stepState ?? 'empty',
          label: stepLabel,
          isGiven,
        });
      }
      result.push(row);
    }

    return result;
  }, [size, mode, mutations, givenNumbers]);

  // Dynamic cell size based on container height and grid size
  const padding = 32;
  const maxGridPx = height - padding * 2;
  const gap = mode === 'sudoku' ? 2 : 2;
  const cellSize = Math.max(
    20,
    Math.floor((maxGridPx - gap * (size - 1)) / size),
  );
  const gridPx = cellSize * size + gap * (size - 1);

  if (size === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-elevated',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No grid to visualize</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border bg-elevated',
        className,
      )}
      style={{ height }}
    >
      {/* Grid */}
      <div
        className="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${size}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${size}, ${cellSize}px)`,
          gap,
          width: gridPx,
          height: gridPx,
        }}
      >
        {cells.map((row, r) =>
          row.map((cell, c) => {
            const bg = STATE_BG[cell.state];
            const border = STATE_BORDER[cell.state];
            const textColor = STATE_TEXT[cell.state];

            // Sudoku: thicker borders for 3x3 boxes
            const sudokuBorderRight =
              mode === 'sudoku' && c % 3 === 2 && c < size - 1;
            const sudokuBorderBottom =
              mode === 'sudoku' && r % 3 === 2 && r < size - 1;

            // Checkerboard pattern for N-Queens (subtle)
            const isCheckerDark = mode === 'n-queens' && (r + c) % 2 === 0;
            const finalBg =
              cell.state === 'empty' && isCheckerDark
                ? '#111827' // gray-900
                : bg;

            return (
              <motion.div
                key={`${r}-${c}`}
                className="relative flex items-center justify-center"
                style={{
                  width: cellSize,
                  height: cellSize,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: border,
                  borderRadius: 3,
                  // Sudoku box borders
                  ...(sudokuBorderRight
                    ? { borderRightWidth: 3, borderRightColor: '#6366f1' }
                    : {}),
                  ...(sudokuBorderBottom
                    ? { borderBottomWidth: 3, borderBottomColor: '#6366f1' }
                    : {}),
                }}
                animate={{
                  backgroundColor: finalBg,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : {
                  backgroundColor: { duration: duration.normal, ease: easing.out },
                }}
              >
                {/* N-Queens: queen icon */}
                {mode === 'n-queens' && cell.state === 'queen' && (
                  <motion.span
                    className="text-white"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={shouldReduceMotion ? { duration: 0 } : springs.bouncy}
                  >
                    <QueenIcon size={cellSize * 0.7} />
                  </motion.span>
                )}

                {/* N-Queens: conflict X */}
                {mode === 'n-queens' && cell.state === 'conflict' && (
                  <motion.span
                    className="text-xs font-bold text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ fontSize: cellSize * 0.4 }}
                  >
                    X
                  </motion.span>
                )}

                {/* Sudoku: number label */}
                {mode === 'sudoku' && cell.label && (
                  <motion.span
                    className="select-none"
                    style={{
                      color: textColor,
                      fontSize: cellSize * 0.45,
                      fontFamily: 'monospace',
                      fontWeight: cell.isGiven ? 700 : 400,
                      opacity: cell.isGiven ? 1 : 0.85,
                    }}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: cell.isGiven ? 1 : 0.85 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.fast }}
                  >
                    {cell.label}
                  </motion.span>
                )}
              </motion.div>
            );
          }),
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        {mode === 'n-queens' ? (
          <>
            <LegendItem color={STATE_BG.queen} label="Queen" />
            <LegendItem color={STATE_BG.conflict} label="Conflict" />
            <LegendItem color={STATE_BG.safe} label="Safe" />
            <LegendItem color={STATE_BG.backtrack} label="Backtrack" />
          </>
        ) : (
          <>
            <LegendItem color={STATE_BG.given} label="Given" />
            <LegendItem color={STATE_BG.queen} label="Placed" />
            <LegendItem color={STATE_BG.trying} label="Trying" />
            <LegendItem color={STATE_BG.conflict} label="Conflict" />
            <LegendItem color={STATE_BG.backtrack} label="Backtrack" />
          </>
        )}
      </div>
    </div>
  );
});

// ── Legend helper ────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-foreground-subtle">{label}</span>
    </div>
  );
}
