// -----------------------------------------------------------------
// Architex -- Sudoku Backtracking Solver (ALG-234)
// Tries digits 1-9 in each empty cell, checking row/col/box constraints.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Config ──────────────────────────────────────────────────────

export const SUDOKU_CONFIG: AlgorithmConfig = {
  id: 'sudoku',
  name: 'Sudoku Solver',
  category: 'backtracking',
  timeComplexity: { best: 'O(1)', average: 'O(9^m)', worst: 'O(9^81)' },
  spaceComplexity: 'O(81)',
  description:
    'Solve a 9x9 Sudoku puzzle via backtracking. For each empty cell, try digits 1-9, checking row, column, and 3x3 box constraints before recursing.',
  pseudocode: [
    'procedure solveSudoku(board)',
    '  cell = findEmpty(board)',
    '  if cell is null: return true  // solved',
    '  for num = 1 to 9 do',
    '    if isValid(cell, num, board) then',
    '      board[cell] = num',
    '      if solveSudoku(board): return true',
    '      board[cell] = 0  // backtrack',
    '  return false           // no valid number',
  ],
};

// ── Sample Puzzle (~30 givens) ──────────────────────────────────

export const SAMPLE_SUDOKU: number[][] = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

// ── Helpers ─────────────────────────────────────────────────────

function deepCopy(board: number[][]): number[][] {
  return board.map((row) => [...row]);
}

function isValid(
  board: number[][],
  row: number,
  col: number,
  num: number,
): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (board[row][c] === num) return false;
  }
  // Check column
  for (let r = 0; r < 9; r++) {
    if (board[r][col] === num) return false;
  }
  // Check 3x3 box
  const boxR = Math.floor(row / 3) * 3;
  const boxC = Math.floor(col / 3) * 3;
  for (let r = boxR; r < boxR + 3; r++) {
    for (let c = boxC; c < boxC + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function findEmpty(board: number[][]): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

/**
 * Build the set of given-cell coordinates from the initial board.
 */
function givenSet(board: number[][]): Set<string> {
  const s = new Set<string>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0) s.add(`${r}-${c}`);
    }
  }
  return s;
}

// ── Solver ──────────────────────────────────────────────────────

export function solveSudoku(board: number[][]): AlgorithmResult {
  const grid = deepCopy(board);
  const given = givenSet(board);
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Limit steps so we do not blow up the browser
  const MAX_STEPS = 1200;

  function cellMut(
    row: number,
    col: number,
    state: string,
    label?: string,
  ): VisualMutation[] {
    const muts: VisualMutation[] = [
      {
        targetId: `grid-${row}-${col}`,
        property: 'highlight',
        from: 'default',
        to: state,
        easing: 'ease-out' as const,
      },
    ];
    if (label !== undefined) {
      muts.push({
        targetId: `grid-${row}-${col}`,
        property: 'label',
        from: '',
        to: label,
        easing: 'ease-out' as const,
      });
    }
    return muts;
  }

  function pushStep(
    desc: string,
    line: number,
    mutations: VisualMutation[],
    dur = 200,
  ) {
    if (steps.length >= MAX_STEPS) return;
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: dur,
    });
  }

  /** Board snapshot mutations — show givens + placed values. */
  function boardSnapshot(): VisualMutation[] {
    const muts: VisualMutation[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] !== 0) {
          const state = given.has(`${r}-${c}`) ? 'given' : 'queen'; // 'queen' = placed number
          muts.push(...cellMut(r, c, state, String(grid[r][c])));
        }
      }
    }
    return muts;
  }

  pushStep('Starting Sudoku solver', 0, boardSnapshot(), 400);

  function solve(): boolean {
    if (steps.length >= MAX_STEPS) return false;

    const empty = findEmpty(grid);
    if (!empty) {
      pushStep('Puzzle solved!', 2, boardSnapshot(), 500);
      return true;
    }

    const [row, col] = empty;
    reads++;

    pushStep(
      `Find empty cell at (${row}, ${col})`,
      1,
      [...boardSnapshot(), ...cellMut(row, col, 'trying')],
      200,
    );

    for (let num = 1; num <= 9; num++) {
      if (steps.length >= MAX_STEPS) return false;

      comparisons++;
      reads++;

      if (!isValid(grid, row, col, num)) {
        pushStep(
          `Try ${num} at (${row},${col}) — conflicts. For each empty cell, try digits 1-9. If a digit violates row, column, or 3x3 box constraints, skip it — this pruning is what makes backtracking efficient.`,
          4,
          [...boardSnapshot(), ...cellMut(row, col, 'conflict', String(num))],
          150,
        );
        continue;
      }

      // Place number
      grid[row][col] = num;
      writes++;

      pushStep(
        `Place ${num} at (${row}, ${col})`,
        5,
        boardSnapshot(),
        200,
      );

      if (solve()) return true;

      // Backtrack
      grid[row][col] = 0;
      writes++;

      pushStep(
        `Backtrack: remove ${num} from (${row}, ${col})`,
        7,
        [...boardSnapshot(), ...cellMut(row, col, 'backtrack')],
        200,
      );
    }

    pushStep(
      `No valid digit for (${row}, ${col}) — backtrack`,
      8,
      boardSnapshot(),
      200,
    );

    return false;
  }

  solve();

  // Flatten final state
  const finalFlat: number[] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      finalFlat.push(grid[r][c]);
    }
  }

  return {
    config: SUDOKU_CONFIG,
    steps,
    finalState: finalFlat,
  };
}
