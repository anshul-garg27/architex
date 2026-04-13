// -----------------------------------------------------------------
// Architex -- Knight's Tour Backtracking Solver (ALG-235)
// Attempts to visit every square on an NxN chessboard exactly once
// using a knight. Uses Warnsdorff's rule for move ordering.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Public types ────────────────────────────────────────────────

export interface KnightPosition {
  row: number;
  col: number;
}

// ── Config ──────────────────────────────────────────────────────

export const KNIGHTS_TOUR_CONFIG: AlgorithmConfig = {
  id: 'knights-tour',
  name: "Knight's Tour",
  category: 'backtracking',
  timeComplexity: { best: 'O(N^2)', average: 'O(8^(N^2))', worst: 'O(8^(N^2))' },
  spaceComplexity: 'O(N^2)',
  description:
    "Visit every square on an NxN chessboard exactly once using a knight's legal moves. Uses Warnsdorff's heuristic to order moves by fewest onward options, dramatically reducing backtracking.",
  pseudocode: [
    'procedure knightsTour(board, row, col, moveNum)',
    '  board[row][col] = moveNum',
    '  if moveNum == N*N: return true  // all visited',
    '  moves = getValidMoves(row, col)',
    '  sort moves by Warnsdorff degree (ascending)',
    '  for each (nr, nc) in moves do',
    '    if knightsTour(board, nr, nc, moveNum+1): return true',
    '  board[row][col] = 0  // backtrack',
    '  return false',
  ],
};

// ── Constants ──────────────────────────────────────────────────

/** The eight possible L-shaped knight moves (row delta, col delta). */
const KNIGHT_MOVES: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2],  [1, 2],  [2, -1],  [2, 1],
];

// ── Helpers ─────────────────────────────────────────────────────

function isInBounds(row: number, col: number, n: number): boolean {
  return row >= 0 && row < n && col >= 0 && col < n;
}

/**
 * Count the number of valid onward moves from (row, col).
 * Used by Warnsdorff's rule to pick the square with the fewest exits.
 */
function warnsdorffDegree(
  row: number,
  col: number,
  board: number[][],
  n: number,
): number {
  let count = 0;
  for (const [dr, dc] of KNIGHT_MOVES) {
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc, n) && board[nr][nc] === 0) {
      count++;
    }
  }
  return count;
}

/**
 * Return valid (unvisited, in-bounds) moves from (row, col),
 * sorted by Warnsdorff's rule (ascending onward-degree).
 */
function getValidMoves(
  row: number,
  col: number,
  board: number[][],
  n: number,
): KnightPosition[] {
  const moves: { pos: KnightPosition; degree: number }[] = [];
  for (const [dr, dc] of KNIGHT_MOVES) {
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc, n) && board[nr][nc] === 0) {
      moves.push({
        pos: { row: nr, col: nc },
        degree: warnsdorffDegree(nr, nc, board, n),
      });
    }
  }
  // Warnsdorff: prefer squares with fewer onward moves
  moves.sort((a, b) => a.degree - b.degree);
  return moves.map((m) => m.pos);
}

// ── Solver ──────────────────────────────────────────────────────

export function solveKnightsTour(
  n: number,
  startRow = 0,
  startCol = 0,
): AlgorithmResult {
  const size = Math.max(5, Math.min(n, 8)); // clamp 5-8
  const board: number[][] = Array.from({ length: size }, () =>
    Array(size).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Limit steps to avoid overwhelming the browser
  const MAX_STEPS = 1500;

  // ── Mutation helpers ───────────────────────────────────────

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
    dur = 300,
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

  /** Snapshot of the board — shows numbered visited squares. */
  function boardSnapshot(
    currentRow?: number,
    currentCol?: number,
  ): VisualMutation[] {
    const muts: VisualMutation[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] > 0) {
          const isCurrent = r === currentRow && c === currentCol;
          muts.push(
            ...cellMut(r, c, isCurrent ? 'active' : 'queen', String(board[r][c])),
          );
        }
      }
    }
    return muts;
  }

  // ── Recursive solver ───────────────────────────────────────

  function solve(row: number, col: number, moveNum: number): boolean {
    if (steps.length >= MAX_STEPS) return false;

    board[row][col] = moveNum;
    writes++;

    pushStep(
      `Move ${moveNum}: knight lands on (${row}, ${col})`,
      1,
      boardSnapshot(row, col),
      350,
    );

    // All squares visited
    if (moveNum === size * size) {
      pushStep(
        `All ${size * size} squares visited — tour complete!`,
        2,
        boardSnapshot(),
        500,
      );
      return true;
    }

    const moves = getValidMoves(row, col, board, size);
    reads++;

    if (moves.length > 0) {
      pushStep(
        `From (${row}, ${col}): ${moves.length} candidate move(s), ordered by Warnsdorff's rule`,
        4,
        [
          ...boardSnapshot(row, col),
          ...moves.map((m) => cellMut(m.row, m.col, 'safe')[0]),
        ],
        250,
      );
    }

    for (const next of moves) {
      if (steps.length >= MAX_STEPS) break;

      comparisons++;
      reads++;

      if (solve(next.row, next.col, moveNum + 1)) {
        return true;
      }
    }

    // Dead end — backtrack
    board[row][col] = 0;
    writes++;

    pushStep(
      `Dead end at move ${moveNum} — backtrack from (${row}, ${col})`,
      7,
      [
        ...boardSnapshot(),
        ...cellMut(row, col, 'backtrack'),
      ],
      250,
    );

    return false;
  }

  // ── Entry point ────────────────────────────────────────────

  const sr = Math.max(0, Math.min(startRow, size - 1));
  const sc = Math.max(0, Math.min(startCol, size - 1));

  pushStep(
    `Starting Knight's Tour on ${size}x${size} board from (${sr}, ${sc})`,
    0,
    [],
    400,
  );

  solve(sr, sc, 1);

  // Flatten final state
  const finalFlat: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      finalFlat.push(board[r][c]);
    }
  }

  return {
    config: KNIGHTS_TOUR_CONFIG,
    steps,
    finalState: finalFlat,
  };
}
