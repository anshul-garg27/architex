// ─────────────────────────────────────────────────────────────
// Architex — 0/1 Knapsack (ALG-045)
// Items as rows, capacities as columns. Shows item inclusion/exclusion.
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const KNAPSACK_CONFIG: AlgorithmConfig = {
  id: 'knapsack',
  name: '0/1 Knapsack',
  category: 'dp',
  timeComplexity: { best: 'O(n*W)', average: 'O(n*W)', worst: 'O(n*W)' },
  spaceComplexity: 'O(n*W)',
  description:
    'Maximizes value for items that fit within a weight capacity. Table shows items as rows and capacities as columns, highlighting selected items.',
  pseudocode: [
    'procedure knapsack(items, W)',
    '  n = |items|',
    '  for i = 0 to n, w = 0 to W: dp[0][w] = 0',
    '  for i = 1 to n do',
    '    for w = 0 to W do',
    '      if items[i].weight <= w then',
    '        dp[i][w] = max(dp[i-1][w],',
    '          items[i].value + dp[i-1][w - items[i].weight])',
    '      else',
    '        dp[i][w] = dp[i-1][w]',
    '  backtrack to find selected items',
    '  return dp[n][W]',
  ],
};

export interface KnapsackItem {
  name: string;
  weight: number;
  value: number;
}

export interface KnapsackResult extends AlgorithmResult {
  dpTable: DPTable;
  selectedItems: number[];
  maxValue: number;
}

/**
 * Solves the 0/1 Knapsack problem using dynamic programming, recording each step.
 * Builds a DP table where dp[i][w] = max value using items 1..i with capacity w.
 *
 * @param items - Array of items, each with name, weight, and value
 * @param capacity - Maximum weight capacity of the knapsack
 * @returns KnapsackResult with DP table, selected items, max value, and animation steps
 *
 * @example
 * const result = knapsack([{ name: 'A', weight: 2, value: 3 }], 5);
 * // result.maxValue = 3, result.selectedItems = [0]
 */
export function knapsack(
  items: KnapsackItem[],
  capacity: number,
): KnapsackResult {
  const n = items.length;
  const W = Math.min(capacity, 20); // Clamp for visualization

  // WHY the table is (n+1) x (W+1): row 0 represents "no items available" (base case),
  // and column 0 represents "zero capacity." Each cell dp[i][w] answers: what's the
  // maximum value achievable using items 1..i with capacity w? The +1 gives us clean
  // base cases without special-casing.
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(W + 1).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize row 0
  const initMutations: VisualMutation[] = [];
  for (let w = 0; w <= W; w++) {
    writes++;
    initMutations.push(
      { targetId: `dp-0-${w}`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: `dp-0-${w}`, property: 'label', from: '', to: '0', easing: 'ease-out' },
    );
  }

  steps.push({
    id: stepId++,
    description: 'Initialize: 0 items means 0 value for any capacity',
    pseudocodeLine: 2,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // WHY bottom-up filling: we process items in order and capacities from 0 to W.
  // Each cell only depends on the row above (i-1), so by the time we compute dp[i][w],
  // all its dependencies are already filled. This eliminates the overhead of recursion
  // and memoization lookups.
  for (let i = 1; i <= n; i++) {
    const item = items[i - 1];

    for (let w = 0; w <= W; w++) {
      comparisons++;
      reads++;

      // WHY the weight check: if the item is heavier than the current capacity,
      // we physically cannot include it. The only option is to carry forward the
      // best value without this item: dp[i-1][w]. This is the "skip" branch.
      if (item.weight > w) {
        // Cannot include this item
        reads++;
        dp[i][w] = dp[i - 1][w];
        writes++;

        steps.push({
          id: stepId++,
          description: `Item "${item.name}" (wt=${item.weight}) > capacity ${w}: skip, dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
          pseudocodeLine: 9,
          mutations: [
            { targetId: `dp-${i}-${w}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${w}] = ${dp[i][w]} (excluded)`,
          pseudocodeLine: 9,
          mutations: [
            { targetId: `dp-${i}-${w}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${w}`, property: 'label', from: '', to: String(dp[i][w]), easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      } else {
        // WHY max(exclude, include): this is the core DP recurrence. "Exclude" means
        // pretend this item doesn't exist (dp[i-1][w]). "Include" means take the item's
        // value plus the best we can do with the remaining capacity (dp[i-1][w-weight]).
        // We pick whichever is better — optimal substructure in action.
        reads += 2;
        const exclude = dp[i - 1][w];
        const include = item.value + dp[i - 1][w - item.weight];
        dp[i][w] = Math.max(exclude, include);
        writes++;

        const chosen = include > exclude ? 'include' : 'exclude';

        steps.push({
          id: stepId++,
          description: `Item "${item.name}" (wt=${item.weight}, val=${item.value}): exclude=${exclude}, include=${include} -> ${chosen}`,
          pseudocodeLine: 6,
          mutations: [
            { targetId: `dp-${i}-${w}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w - item.weight}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${w}] = ${dp[i][w]} (${chosen})`,
          pseudocodeLine: 6,
          mutations: [
            { targetId: `dp-${i}-${w}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${w}`, property: 'label', from: '', to: String(dp[i][w]), easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${w - item.weight}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }
  }

  // WHY backtracking recovers the actual items: the DP table only stores values, not
  // which items were chosen. Walking backward from dp[n][W], if dp[i][w] differs from
  // dp[i-1][w], item i must have been included (otherwise the value wouldn't change).
  // Subtract its weight and continue — this reconstructs the optimal set in O(n) time.
  const selectedItems: number[] = [];
  const optimalPath: Array<{ row: number; col: number }> = [];
  let bw = W;

  for (let i = n; i > 0; i--) {
    if (dp[i][bw] !== dp[i - 1][bw]) {
      selectedItems.unshift(i - 1); // 0-indexed item
      optimalPath.push({ row: i, col: bw });
      bw -= items[i - 1].weight;
    }
  }

  // Highlight optimal cells
  const pathMutations: VisualMutation[] = optimalPath.map(({ row, col }) => ({
    targetId: `dp-${row}-${col}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  const selectedNames = selectedItems.map((i) => items[i].name).join(', ');

  steps.push({
    id: stepId++,
    description: `Max value = ${dp[n][W]}. Selected: [${selectedNames}]`,
    pseudocodeLine: 10,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable
  const rows = ['0 items', ...items.map((item) => `${item.name} (w=${item.weight}, v=${item.value})`)];
  const cols = Array.from({ length: W + 1 }, (_, i) => String(i));
  const cells = dp.map((row, ri) =>
    row.map((val, ci) => ({
      row: ri,
      col: ci,
      value: val,
      state: (optimalPath.some((p) => p.row === ri && p.col === ci)
        ? 'optimal'
        : 'computed') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  );

  return {
    config: KNAPSACK_CONFIG,
    steps,
    finalState: dp[n],
    dpTable: { rows, cols, cells },
    selectedItems,
    maxValue: dp[n][W],
  };
}

/** Default items for demo. */
export const DEFAULT_KNAPSACK_ITEMS: KnapsackItem[] = [
  { name: 'A', weight: 2, value: 3 },
  { name: 'B', weight: 3, value: 4 },
  { name: 'C', weight: 4, value: 5 },
  { name: 'D', weight: 5, value: 8 },
];
