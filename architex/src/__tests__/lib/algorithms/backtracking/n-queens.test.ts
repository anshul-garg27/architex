import { describe, it, expect } from 'vitest';
import { solveNQueens } from '@/lib/algorithms/backtracking';

describe('N-Queens solver', () => {
  it('solves 4-queens with a valid placement', () => {
    const result = solveNQueens(4);
    expect(result.finalState).toHaveLength(4);
    expect(isValidPlacement(result.finalState as number[])).toBe(true);
  });

  it('solves 8-queens with a valid placement', () => {
    const result = solveNQueens(8);
    expect(result.finalState).toHaveLength(8);
    expect(isValidPlacement(result.finalState as number[])).toBe(true);
  });

  it('returns config with category backtracking', () => {
    const result = solveNQueens(4);
    expect(result.config.category).toBe('backtracking');
  });
});

/** Validate no two queens attack each other. */
function isValidPlacement(queens: number[]): boolean {
  for (let i = 0; i < queens.length; i++) {
    for (let j = i + 1; j < queens.length; j++) {
      if (queens[i] === queens[j]) return false;
      if (Math.abs(queens[i] - queens[j]) === Math.abs(i - j)) return false;
    }
  }
  return true;
}
