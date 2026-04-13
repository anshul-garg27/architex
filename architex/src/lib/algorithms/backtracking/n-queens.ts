// -----------------------------------------------------------------
// Architex -- N-Queens Backtracking Solver (ALG-233)
// Places queens row by row, recording every placement, conflict, and backtrack.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Public types ────────────────────────────────────────────────

export interface QueenPlacement {
  row: number;
  col: number;
}

// ── Config ──────────────────────────────────────────────────────

export const N_QUEENS_CONFIG: AlgorithmConfig = {
  id: 'n-queens',
  name: 'N-Queens',
  category: 'backtracking',
  timeComplexity: { best: 'O(N!)', average: 'O(N!)', worst: 'O(N!)' },
  spaceComplexity: 'O(N)',
  description:
    'Place N queens on an NxN chessboard so that no two queens threaten each other. Uses backtracking to try placing queens row by row, pruning invalid branches early.',
  pseudocode: [
    'procedure solveNQueens(row, board)',
    '  if row == N: record solution; return true',
    '  for col = 0 to N-1 do',
    '    if isSafe(row, col, board) then',
    '      board[row] = col   // place queen',
    '      if solveNQueens(row+1, board): return true',
    '      board[row] = -1    // backtrack',
    '  return false            // no valid col',
  ],
};

// ── Helpers ─────────────────────────────────────────────────────

function isSafe(row: number, col: number, queens: number[]): boolean {
  for (let r = 0; r < row; r++) {
    const c = queens[r];
    if (c === col) return false;                         // same column
    if (Math.abs(c - col) === Math.abs(r - row)) return false; // diagonal
  }
  return true;
}

/**
 * Collect indices of every queen that attacks `(row, col)`.
 * Returns the list of (r, c) pairs that conflict.
 */
function getConflicts(
  row: number,
  col: number,
  queens: number[],
): QueenPlacement[] {
  const conflicts: QueenPlacement[] = [];
  for (let r = 0; r < row; r++) {
    const c = queens[r];
    if (c === col || Math.abs(c - col) === Math.abs(r - row)) {
      conflicts.push({ row: r, col: c });
    }
  }
  return conflicts;
}

// ── Solver ──────────────────────────────────────────────────────

export function solveNQueens(n: number): AlgorithmResult {
  const size = Math.max(1, Math.min(n, 12)); // clamp
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  const queens: number[] = Array(size).fill(-1);

  /** Mutation helper — mark a grid cell. */
  function cellMutation(
    row: number,
    col: number,
    state: string,
    easing: VisualMutation['easing'] = 'ease-out',
  ): VisualMutation {
    return {
      targetId: `grid-${row}-${col}`,
      property: 'highlight',
      from: 'default',
      to: state,
      easing,
    };
  }

  /** Push a step with the current complexity counters. */
  function pushStep(
    desc: string,
    line: number,
    mutations: VisualMutation[],
    dur = 350,
  ) {
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: dur,
    });
  }

  /** Mark all cells in a row as 'safe' (available). */
  function markRowSafe(row: number): VisualMutation[] {
    const muts: VisualMutation[] = [];
    for (let c = 0; c < size; c++) {
      muts.push(cellMutation(row, c, 'safe'));
    }
    return muts;
  }

  /** Show current placed queens as 'queen' cells. */
  function queensMutations(): VisualMutation[] {
    const muts: VisualMutation[] = [];
    for (let r = 0; r < size; r++) {
      if (queens[r] >= 0) {
        muts.push(cellMutation(r, queens[r], 'queen'));
      }
    }
    return muts;
  }

  /** Backtrack: recursively try placing queens row by row. */
  function solve(row: number): boolean {
    if (row === size) {
      // Solution found
      pushStep(
        `All ${size} queens placed — solution found!`,
        1,
        queensMutations(),
        500,
      );
      return true;
    }

    // Enter row
    pushStep(
      `Trying row ${row}`,
      2,
      [...queensMutations(), ...markRowSafe(row)],
      300,
    );

    for (let col = 0; col < size; col++) {
      comparisons++;
      reads++;

      const safe = isSafe(row, col, queens);

      if (!safe) {
        // Show conflict
        const conflicts = getConflicts(row, col, queens);
        const muts: VisualMutation[] = [
          ...queensMutations(),
          cellMutation(row, col, 'conflict'),
          ...conflicts.map((c) => cellMutation(c.row, c.col, 'conflict')),
        ];
        pushStep(
          `Column ${col} conflicts with queen${conflicts.length > 1 ? 's' : ''} at ${conflicts.map((c) => `(${c.row},${c.col})`).join(', ')}`,
          3,
          muts,
          250,
        );
        continue;
      }

      // Place queen
      queens[row] = col;
      writes++;

      pushStep(
        `Place queen at (${row}, ${col}). We try each column in this row — if no queen attacks this position (same column, same diagonal), it's safe to place.`,
        4,
        queensMutations(),
        350,
      );

      // Recurse
      if (solve(row + 1)) {
        return true;
      }

      // Backtrack
      queens[row] = -1;
      writes++;

      pushStep(
        `Backtrack: remove queen from (${row}, ${col})`,
        6,
        [
          ...queensMutations(),
          cellMutation(row, col, 'backtrack'),
        ],
        300,
      );
    }

    pushStep(
      `No valid column in row ${row} — backtrack`,
      7,
      queensMutations(),
      250,
    );

    return false;
  }

  pushStep(
    `Starting N-Queens solver for N=${size}`,
    0,
    [],
    400,
  );

  solve(0);

  return {
    config: N_QUEENS_CONFIG,
    steps,
    finalState: [...queens],
  };
}
