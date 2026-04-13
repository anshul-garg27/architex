import { describe, it, expect } from 'vitest';
import { solveNQueens, N_QUEENS_CONFIG } from '../n-queens';
import { solveSudoku, SUDOKU_CONFIG, SAMPLE_SUDOKU } from '../sudoku';
import { solveKnightsTour, KNIGHTS_TOUR_CONFIG } from '../knights-tour';
import { generateSubsets, SUBSET_GENERATION_CONFIG, DEFAULT_SUBSET_SET } from '../subset-generation';

// ── N-Queens ──────────────────────────────────────────────────

describe('solveNQueens', () => {
  it('finds a valid solution for N=4', () => {
    const result = solveNQueens(4);
    const queens = result.finalState as number[];
    // Check that all 4 queens are placed (no -1)
    expect(queens.filter((v) => v >= 0)).toHaveLength(4);
  });

  it('places queens in non-conflicting positions for N=4', () => {
    const result = solveNQueens(4);
    const queens = result.finalState as number[];
    // No two queens share the same column or diagonal
    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        expect(queens[i]).not.toBe(queens[j]); // not same column
        expect(Math.abs(queens[i] - queens[j])).not.toBe(Math.abs(i - j)); // not same diagonal
      }
    }
  });

  it('finds a valid solution for N=8', () => {
    const result = solveNQueens(8);
    const queens = result.finalState as number[];
    expect(queens.filter((v) => v >= 0)).toHaveLength(8);
  });

  it('clamps N to minimum 1', () => {
    const result = solveNQueens(0);
    const queens = result.finalState as number[];
    expect(queens.length).toBeGreaterThanOrEqual(1);
  });

  it('generates animation steps', () => {
    const result = solveNQueens(4);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns correct config', () => {
    const result = solveNQueens(4);
    expect(result.config).toBe(N_QUEENS_CONFIG);
    expect(result.config.category).toBe('backtracking');
  });
});

// ── Sudoku Solver ─────────────────────────────────────────────

describe('solveSudoku', () => {
  it('preserves given values from the original board', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    const flat = result.finalState as number[];
    // The original board has 5 at position (0,0) -> flat index 0
    expect(flat[0]).toBe(5);
    // (0,1) = 3
    expect(flat[1]).toBe(3);
    // (0,4) = 7
    expect(flat[4]).toBe(7);
  });

  it('returns a flat array of 81 cells', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    expect(result.finalState).toHaveLength(81);
  });

  it('only contains valid digits (0-9) in final state', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    const flat = result.finalState as number[];
    expect(flat.every((v) => v >= 0 && v <= 9)).toBe(true);
  });

  it('generates animation steps', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('respects MAX_STEPS limit', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    expect(result.steps.length).toBeLessThanOrEqual(1200);
  });

  it('returns correct config', () => {
    const result = solveSudoku(SAMPLE_SUDOKU);
    expect(result.config).toBe(SUDOKU_CONFIG);
  });
});

// ── Knight's Tour ─────────────────────────────────────────────

describe('solveKnightsTour', () => {
  it('solves a 5x5 board', () => {
    const result = solveKnightsTour(5);
    const flat = result.finalState as number[];
    // On a solved 5x5 board, every cell should have a unique move number 1..25
    const nonZero = flat.filter((v) => v > 0);
    expect(nonZero.length).toBe(25);
    const unique = new Set(nonZero);
    expect(unique.size).toBe(25);
  });

  it('starts at the specified position', () => {
    const result = solveKnightsTour(5, 0, 0);
    const flat = result.finalState as number[];
    // Move 1 should be at position (0,0) -> flat index 0
    expect(flat[0]).toBe(1);
  });

  it('clamps board size to minimum 5', () => {
    const result = solveKnightsTour(3);
    const flat = result.finalState as number[];
    // Should use 5x5 board (25 cells)
    expect(flat.length).toBe(25);
  });

  it('generates animation steps', () => {
    const result = solveKnightsTour(5);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns correct config', () => {
    const result = solveKnightsTour(5);
    expect(result.config).toBe(KNIGHTS_TOUR_CONFIG);
  });
});

// ── Subset Generation ─────────────────────────────────────────

describe('generateSubsets', () => {
  it('generates 2^N subsets for default set of 4 elements', () => {
    const result = generateSubsets(DEFAULT_SUBSET_SET);
    const subsetCount = result.finalState.length;
    expect(subsetCount).toBe(16); // 2^4 = 16
  });

  it('generates correct count for custom set', () => {
    const result = generateSubsets([1, 2, 3]);
    expect(result.finalState.length).toBe(8); // 2^3 = 8
  });

  it('includes empty subset (length 0)', () => {
    const result = generateSubsets([1, 2]);
    // finalState contains lengths of each subset
    expect(result.finalState).toContain(0);
  });

  it('includes full set (length N)', () => {
    const result = generateSubsets([1, 2, 3]);
    expect(result.finalState).toContain(3);
  });

  it('clamps to maximum 6 elements', () => {
    const result = generateSubsets([1, 2, 3, 4, 5, 6, 7, 8]);
    // Should only use first 6 -> 2^6 = 64 subsets
    expect(result.finalState.length).toBe(64);
  });

  it('generates animation steps', () => {
    const result = generateSubsets([1, 2]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns correct config', () => {
    const result = generateSubsets();
    expect(result.config).toBe(SUBSET_GENERATION_CONFIG);
    expect(result.config.category).toBe('backtracking');
  });

  it('handles single element set', () => {
    const result = generateSubsets([42]);
    expect(result.finalState.length).toBe(2); // {} and {42}
  });
});
