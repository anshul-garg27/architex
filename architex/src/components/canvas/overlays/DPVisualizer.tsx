'use client';

import { memo, useMemo, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { DPTable, DPCell } from '@/lib/algorithms/dp/types';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { duration, springs } from '@/lib/constants/motion';
import {
  DP_STATE_COLORS as STATE_COLORS,
  DP_STATE_BORDERS as STATE_BORDERS,
  DP_STATE_TEXT as STATE_TEXT,
} from '@/lib/algorithms/visualization-colors';

// ── Constants ────────────────────────────────────────────────

const CELL_SIZE = 44;
const CELL_GAP = 2;
const HEADER_SIZE = 56;

// ── Types ────────────────────────────────────────────────────

export interface DPVisualizerProps {
  table: DPTable;
  step: AnimationStep | null;
  className?: string;
  height?: number;
  testMode?: boolean;
  onTestAnswer?: (correct: boolean) => void;
}

// ── Helpers ──────────────────────────────────────────────────

function getCellState(
  row: number,
  col: number,
  mutations: VisualMutation[],
): DPCell['state'] | null {
  for (const m of mutations) {
    if (m.targetId === `dp-${row}-${col}` && m.property === 'highlight') {
      const val = String(m.to) as DPCell['state'];
      if (val in STATE_COLORS) return val;
    }
  }
  return null;
}

function getCellLabel(
  row: number,
  col: number,
  mutations: VisualMutation[],
): string | null {
  for (const m of mutations) {
    if (m.targetId === `dp-${row}-${col}` && m.property === 'label') {
      return String(m.to);
    }
  }
  return null;
}

// ── Component ────────────────────────────────────────────────

export const DPVisualizer = memo(function DPVisualizer({
  table,
  step,
  className,
  height = 480,
  testMode = false,
  onTestAnswer,
}: DPVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const numRows = table.cells.length;
  const numCols = table.cells[0]?.length ?? 0;

  // ── ALG-180: Test mode state ──────────────────────────────
  const [awaitingClick, setAwaitingClick] = useState(false);
  const [expectedCell, setExpectedCell] = useState<{ row: number; col: number } | null>(null);
  const [flashCell, setFlashCell] = useState<{ row: number; col: number; correct: boolean } | null>(null);
  const lastTestStepId = useRef<number | null>(null);

  // Detect computing cell from current step mutations
  const computingCell = useMemo(() => {
    if (!step) return null;
    for (const m of step.mutations) {
      if (m.property === 'highlight' && String(m.to) === 'computing') {
        const match = m.targetId.match(/^dp-(\d+)-(\d+)$/);
        if (match) return { row: parseInt(match[1], 10), col: parseInt(match[2], 10) };
      }
    }
    return null;
  }, [step]);

  // When test mode is active and a new computing cell arrives, intercept it
  const shouldIntercept = testMode && computingCell !== null && step !== null && step.id !== lastTestStepId.current;
  if (shouldIntercept && !awaitingClick && step) {
    lastTestStepId.current = step.id;
    setAwaitingClick(true);
    setExpectedCell(computingCell);
    setFlashCell(null);
  }

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!awaitingClick || !expectedCell) return;
      const correct = row === expectedCell.row && col === expectedCell.col;
      onTestAnswer?.(correct);
      // On correct: green flash on clicked cell. On wrong: red flash on the correct cell to reveal it.
      setFlashCell(correct
        ? { row, col, correct: true }
        : { row: expectedCell.row, col: expectedCell.col, correct: false },
      );
      setAwaitingClick(false);
      // Clear flash after a short delay
      setTimeout(() => setFlashCell(null), 600);
    },
    [awaitingClick, expectedCell, onTestAnswer],
  );

  // Track cumulative cell states across steps so that cells marked
  // 'computed' in earlier steps remain visible in later steps.
  const cumulativeRef = useRef<{
    states: Record<string, DPCell['state']>;
    labels: Record<string, string>;
    lastStepId: number | null;
  }>({ states: {}, labels: {}, lastStepId: null });

  const cellStates = useMemo(() => {
    if (!step) {
      // No step — reset accumulator
      cumulativeRef.current = { states: {}, labels: {}, lastStepId: null };
      return { states: {} as Record<string, DPCell['state']>, labels: {} as Record<string, string> };
    }

    const prev = cumulativeRef.current;

    // If stepping backward (or to a different earlier step), rebuild from scratch
    if (prev.lastStepId !== null && step.id < prev.lastStepId) {
      cumulativeRef.current = { states: {}, labels: {}, lastStepId: null };
    }

    // If this is a new step (forward), merge current step's mutations into accumulated state
    if (step.id !== cumulativeRef.current.lastStepId) {
      const acc = cumulativeRef.current;
      for (const m of step.mutations) {
        const match = m.targetId.match(/^dp-(\d+)-(\d+)$/);
        if (!match) continue;
        const key = `${match[1]}-${match[2]}`;

        if (m.property === 'highlight') {
          const val = String(m.to) as DPCell['state'];
          if (val in STATE_COLORS) {
            // Once computed, keep it computed unless explicitly changed to
            // a higher-priority state (optimal, dependency, computing)
            if (val === 'default' && acc.states[key] === 'computed') {
              // Don't revert computed cells back to default
            } else {
              acc.states[key] = val;
            }
          }
        }
        if (m.property === 'label') {
          acc.labels[key] = String(m.to);
        }
      }
      acc.lastStepId = step.id;
    }

    return { states: { ...cumulativeRef.current.states }, labels: { ...cumulativeRef.current.labels } };
  }, [step]);

  if (numRows === 0 || numCols === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-elevated',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No DP table to visualize</p>
      </div>
    );
  }

  const gridWidth = HEADER_SIZE + numCols * (CELL_SIZE + CELL_GAP);
  const gridHeight = HEADER_SIZE + numRows * (CELL_SIZE + CELL_GAP);

  return (
    <div
      className={cn(
        'relative overflow-auto rounded-lg border border-border bg-elevated p-4',
        className,
      )}
      style={{ height }}
    >
      <div
        className="relative mx-auto"
        style={{ width: gridWidth, height: gridHeight, minWidth: gridWidth }}
      >
        {/* Column headers */}
        {table.cols.map((label, ci) => (
          <div
            key={`col-${ci}`}
            className="absolute flex items-center justify-center text-[10px] font-mono font-medium text-foreground-muted"
            style={{
              left: HEADER_SIZE + ci * (CELL_SIZE + CELL_GAP),
              top: 0,
              width: CELL_SIZE,
              height: HEADER_SIZE - CELL_GAP,
            }}
          >
            <span className="truncate px-0.5">{label}</span>
          </div>
        ))}

        {/* Row headers */}
        {table.rows.map((label, ri) => (
          <div
            key={`row-${ri}`}
            className="absolute flex items-center justify-end pr-1.5 text-[10px] font-mono font-medium text-foreground-muted"
            style={{
              left: 0,
              top: HEADER_SIZE + ri * (CELL_SIZE + CELL_GAP),
              width: HEADER_SIZE - CELL_GAP,
              height: CELL_SIZE,
            }}
          >
            <span className="truncate">{label}</span>
          </div>
        ))}

        {/* Cells */}
        {table.cells.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            const rawState = cellStates.states[key] ?? cell.state;
            // ALG-180: In test mode, hide the computing state until the user clicks
            const liveState = (awaitingClick && rawState === 'computing') ? (cell.state === 'computing' ? 'default' : cell.state) : rawState;
            const liveLabel = cellStates.labels[key];
            const displayValue =
              liveLabel != null ? liveLabel : cell.value !== 0 ? String(cell.value) : '';
            const isCurrent = liveState === 'computing';
            const entryDelay = (ri * numCols + ci) * 0.015;

            // ALG-180: Flash feedback for test mode
            const isFlashing = flashCell && flashCell.row === ri && flashCell.col === ci;
            const flashColor = isFlashing
              ? flashCell.correct ? '#22c55e' : '#ef4444'
              : undefined;

            return (
              <motion.div
                key={`cell-${ri}-${ci}`}
                className={cn(
                  "absolute flex items-center justify-center rounded-md font-mono text-xs font-semibold",
                  awaitingClick && "cursor-pointer hover:ring-2 hover:ring-primary/50",
                )}
                style={{
                  left: HEADER_SIZE + ci * (CELL_SIZE + CELL_GAP),
                  top: HEADER_SIZE + ri * (CELL_SIZE + CELL_GAP),
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
                onClick={awaitingClick ? () => handleCellClick(ri, ci) : undefined}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  backgroundColor: flashColor ?? STATE_COLORS[liveState],
                  borderColor: flashColor ?? STATE_BORDERS[liveState],
                  color: isFlashing ? '#ffffff' : STATE_TEXT[liveState],
                  scale: isCurrent || isFlashing ? 1.1 : 1,
                  opacity: 1,
                  borderWidth: isCurrent ? 3 : 1,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : {
                  backgroundColor: { duration: duration.moderate },
                  scale: springs.bouncy,
                  opacity: { delay: entryDelay, duration: 0.15 },
                  borderWidth: { duration: duration.normal },
                }}
              >
                {displayValue === '-1' ? '\u221E' : displayValue}
              </motion.div>
            );
          }),
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex gap-3">
        {(
          [
            ['computing', 'Computing'],
            ['dependency', 'Dependency'],
            ['computed', 'Computed'],
            ['optimal', 'Optimal'],
          ] as const
        ).map(([state, label]) => (
          <div key={state} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: STATE_COLORS[state] }}
            />
            <span className="text-[8px] text-foreground-subtle">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
