import { describe, it, expect } from 'vitest';
import { knapsack, DEFAULT_KNAPSACK_ITEMS } from '@/lib/algorithms/dp/knapsack';

describe('0/1 Knapsack', () => {
  it('computes correct optimal value for known input', () => {
    // Items: A(w=2,v=3), B(w=3,v=4), C(w=4,v=5), D(w=5,v=8), capacity=7
    // Optimal: A + D = 3 + 8 = 11 (weight 2+5=7)
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 7);
    expect(result.maxValue).toBe(11);
  });

  it('selects the correct items', () => {
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 7);
    const names = result.selectedItems.map((i) => DEFAULT_KNAPSACK_ITEMS[i].name);
    expect(names).toEqual(['A', 'D']);
  });

  it('returns 0 for zero capacity', () => {
    const result = knapsack(DEFAULT_KNAPSACK_ITEMS, 0);
    expect(result.maxValue).toBe(0);
    expect(result.selectedItems).toHaveLength(0);
  });
});
