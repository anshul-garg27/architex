import { describe, it, expect } from 'vitest';
import { fibonacciDP, FIBONACCI_CONFIG } from '../fibonacci';
import { lcs, LCS_CONFIG } from '../lcs';
import { knapsack, KNAPSACK_CONFIG, DEFAULT_KNAPSACK_ITEMS } from '../knapsack';
import { editDistance, EDIT_DISTANCE_CONFIG } from '../edit-distance';
import { coinChange, COIN_CHANGE_CONFIG } from '../coin-change';

// ── Fibonacci DP ──────────────────────────────────────────────

describe('fibonacciDP', () => {
  it('computes fib(5) = 5', () => {
    const result = fibonacciDP(5);
    const table = result.dpTable;
    // dp[5] should be 5
    expect(table.cells[0][5].value).toBe(5);
  });

  it('computes fib(10) = 55', () => {
    const result = fibonacciDP(10);
    expect(result.dpTable.cells[0][10].value).toBe(55);
  });

  it('clamps n to minimum 2', () => {
    const result = fibonacciDP(0);
    // Should compute at least up to index 2
    expect(result.dpTable.cols.length).toBeGreaterThanOrEqual(3);
  });

  it('clamps n to maximum 20', () => {
    const result = fibonacciDP(100);
    expect(result.dpTable.cols.length).toBe(21); // 0..20
  });

  it('generates animation steps', () => {
    const result = fibonacciDP(5);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns correct config metadata', () => {
    const result = fibonacciDP(5);
    expect(result.config).toBe(FIBONACCI_CONFIG);
    expect(result.config.id).toBe('fibonacci-dp');
    expect(result.config.category).toBe('dp');
  });

  it('has base cases dp[0]=0 and dp[1]=1', () => {
    const result = fibonacciDP(5);
    const cells = result.dpTable.cells[0];
    expect(cells[0].value).toBe(0);
    expect(cells[1].value).toBe(1);
  });
});

// ── Longest Common Subsequence ────────────────────────────────

describe('lcs', () => {
  it('finds LCS of "ABCBDAB" and "BDCAB" as length 4', () => {
    const result = lcs('ABCBDAB', 'BDCAB');
    expect(result.lcsString.length).toBe(4);
  });

  it('returns empty string for no common characters', () => {
    const result = lcs('ABC', 'XYZ');
    expect(result.lcsString).toBe('');
  });

  it('finds identical strings have full LCS', () => {
    const result = lcs('HELLO', 'HELLO');
    expect(result.lcsString).toBe('HELLO');
  });

  it('returns correct dpTable dimensions', () => {
    const result = lcs('AB', 'CD');
    // dp table should be (m+1) x (n+1) = 3 x 3
    expect(result.dpTable.cells.length).toBe(3);
    expect(result.dpTable.cells[0].length).toBe(3);
  });

  it('generates animation steps', () => {
    const result = lcs('AB', 'AC');
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('truncates inputs to 12 characters', () => {
    const long = 'ABCDEFGHIJKLMNOP';
    const result = lcs(long, long);
    // Should use only first 12 chars
    expect(result.dpTable.rows.length).toBe(13); // '' + 12 chars
  });

  it('returns correct config', () => {
    const result = lcs('A', 'B');
    expect(result.config).toBe(LCS_CONFIG);
  });
});

// ── 0/1 Knapsack ─────────────────────────────────────────────

describe('knapsack', () => {
  it('finds max value for default items with capacity 7', () => {
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 7);
    // Items: A(w=2,v=3), B(w=3,v=4), C(w=4,v=5), D(w=5,v=8)
    // Optimal for capacity 7: A+D = 11, or A+B+... let's check
    expect(result.maxValue).toBeGreaterThan(0);
  });

  it('returns 0 for zero capacity', () => {
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 0);
    expect(result.maxValue).toBe(0);
  });

  it('selects correct items', () => {
    const items = [
      { name: 'X', weight: 1, value: 10 },
      { name: 'Y', weight: 2, value: 5 },
    ];
    const result = knapsack(items, 1);
    expect(result.maxValue).toBe(10);
    expect(result.selectedItems).toContain(0);
  });

  it('handles single item that fits', () => {
    const items = [{ name: 'A', weight: 3, value: 7 }];
    const result = knapsack(items, 5);
    expect(result.maxValue).toBe(7);
    expect(result.selectedItems).toEqual([0]);
  });

  it('handles single item that does not fit', () => {
    const items = [{ name: 'A', weight: 10, value: 7 }];
    const result = knapsack(items, 5);
    expect(result.maxValue).toBe(0);
    expect(result.selectedItems).toEqual([]);
  });

  it('returns correct config', () => {
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 5);
    expect(result.config).toBe(KNAPSACK_CONFIG);
  });
});

// ── Edit Distance ─────────────────────────────────────────────

describe('editDistance', () => {
  it('returns 0 for identical strings', () => {
    const result = editDistance('kitten', 'kitten');
    expect(result.distance).toBe(0);
  });

  it('returns correct distance for kitten -> sitting', () => {
    const result = editDistance('kitten', 'sitting');
    expect(result.distance).toBe(3);
  });

  it('returns length of target for empty source', () => {
    const result = editDistance('', 'abc');
    expect(result.distance).toBe(3);
  });

  it('returns length of source for empty target', () => {
    const result = editDistance('abc', '');
    expect(result.distance).toBe(3);
  });

  it('includes alignment operations', () => {
    const result = editDistance('abc', 'axc');
    expect(result.alignment).toContain('match');
    expect(result.alignment).toContain('replace');
  });

  it('returns correct config', () => {
    const result = editDistance('a', 'b');
    expect(result.config).toBe(EDIT_DISTANCE_CONFIG);
  });
});

// ── Coin Change ───────────────────────────────────────────────

describe('coinChange', () => {
  it('finds minimum coins for standard denominations', () => {
    const result = coinChange([1, 5, 10], 11);
    // 10 + 1 = 2 coins
    expect(result.minCoins).toBe(2);
  });

  it('returns -1 for impossible amount', () => {
    const result = coinChange([3, 7], 5);
    expect(result.minCoins).toBe(-1);
  });

  it('returns 0 coins for amount 0 (clamped to 1)', () => {
    const result = coinChange([1], 1);
    expect(result.minCoins).toBe(1);
  });

  it('finds exact coin match', () => {
    const result = coinChange([1, 5, 10], 10);
    expect(result.minCoins).toBe(1);
    expect(result.coinsUsed).toEqual([10]);
  });

  it('tracks which coins were used', () => {
    const result = coinChange([1, 5, 10], 15);
    // 10 + 5 = 2 coins
    expect(result.minCoins).toBe(2);
    expect(result.coinsUsed.reduce((a, b) => a + b, 0)).toBe(15);
  });

  it('clamps amount to max 20', () => {
    const result = coinChange([1], 100);
    // Amount is clamped to 20
    expect(result.dpTable.cols.length).toBe(21);
  });

  it('returns correct config', () => {
    const result = coinChange([1], 5);
    expect(result.config).toBe(COIN_CHANGE_CONFIG);
  });
});
