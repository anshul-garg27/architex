// -----------------------------------------------------------------
// Architex -- Subset Sum (ALG-046)
// Can a subset of the given set sum to the target? Boolean 2D table.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const SUBSET_SUM_CONFIG: AlgorithmConfig = {
  id: 'subset-sum',
  name: 'Subset Sum',
  category: 'dp',
  timeComplexity: { best: 'O(n*T)', average: 'O(n*T)', worst: 'O(n*T)' },
  spaceComplexity: 'O(n*T)',
  description:
    'Determines whether a subset of numbers sums to a target value. Boolean 2D table with elements as rows and sums as columns. Backtracks to highlight the selected subset.',
  pseudocode: [
    'procedure subsetSum(nums, target)',
    '  n = |nums|',
    '  dp[0][0] = true; dp[0][1..T] = false',
    '  for i = 1 to n do',
    '    for s = 0 to T do',
    '      dp[i][s] = dp[i-1][s]',
    '      if s >= nums[i] then',
    '        dp[i][s] = dp[i][s] OR dp[i-1][s - nums[i]]',
    '  backtrack to find selected elements',
    '  return dp[n][T]',
  ],
};

export interface SubsetSumResult extends AlgorithmResult {
  dpTable: DPTable;
  selectedIndices: number[];
  achievable: boolean;
}

export function subsetSum(
  nums: number[],
  target: number,
): SubsetSumResult {
  const n = nums.length;
  const T = Math.min(target, 30); // Clamp for visualization

  // dp[i][s] = can we make sum s using the first i numbers?
  const dp: boolean[][] = Array.from({ length: n + 1 }, () =>
    new Array(T + 1).fill(false),
  );
  dp[0][0] = true;

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize row 0
  const initMutations: VisualMutation[] = [];
  writes++;
  initMutations.push(
    { targetId: 'dp-0-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
    { targetId: 'dp-0-0', property: 'label', from: '', to: 'T', easing: 'ease-out' },
  );
  for (let s = 1; s <= T; s++) {
    writes++;
    initMutations.push(
      { targetId: `dp-0-${s}`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: `dp-0-${s}`, property: 'label', from: '', to: 'F', easing: 'ease-out' },
    );
  }

  steps.push({
    id: stepId++,
    description: 'Initialize: empty set can only make sum 0',
    pseudocodeLine: 2,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill table
  for (let i = 1; i <= n; i++) {
    const num = nums[i - 1];

    for (let s = 0; s <= T; s++) {
      reads++;
      // Exclude current element
      dp[i][s] = dp[i - 1][s];

      comparisons++;
      if (s >= num) {
        reads++;
        dp[i][s] = dp[i][s] || dp[i - 1][s - num];
      }
      writes++;

      const val = dp[i][s];
      const label = val ? 'T' : 'F';

      const depMutations: VisualMutation[] = [
        { targetId: `dp-${i}-${s}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
        { targetId: `dp-${i - 1}-${s}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
      ];

      if (s >= num) {
        depMutations.push(
          { targetId: `dp-${i - 1}-${s - num}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
        );
      }

      steps.push({
        id: stepId++,
        description: s >= num
          ? `nums[${i - 1}]=${num}: dp[${i}][${s}] = dp[${i - 1}][${s}](${dp[i - 1][s] ? 'T' : 'F'}) OR dp[${i - 1}][${s - num}](${dp[i - 1][s - num] ? 'T' : 'F'}) = ${label}`
          : `nums[${i - 1}]=${num} > sum ${s}: dp[${i}][${s}] = dp[${i - 1}][${s}] = ${label}`,
        pseudocodeLine: s >= num ? 7 : 5,
        mutations: depMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });

      const resolveMutations: VisualMutation[] = [
        { targetId: `dp-${i}-${s}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
        { targetId: `dp-${i}-${s}`, property: 'label', from: '', to: label, easing: 'ease-out' },
        { targetId: `dp-${i - 1}-${s}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
      ];
      if (s >= num) {
        resolveMutations.push(
          { targetId: `dp-${i - 1}-${s - num}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
        );
      }

      steps.push({
        id: stepId++,
        description: `dp[${i}][${s}] = ${label}`,
        pseudocodeLine: s >= num ? 7 : 5,
        mutations: resolveMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });
    }
  }

  // Backtrack to find selected elements
  const selectedIndices: number[] = [];
  const optimalPath: Array<{ row: number; col: number }> = [];
  const achievable = dp[n][T];

  if (achievable) {
    let s = T;
    for (let i = n; i > 0 && s > 0; i--) {
      if (!dp[i - 1][s]) {
        // Element i-1 was included
        selectedIndices.unshift(i - 1);
        optimalPath.push({ row: i, col: s });
        s -= nums[i - 1];
      }
    }
    if (s === 0 && selectedIndices.length > 0) {
      optimalPath.push({ row: 0, col: 0 });
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

  const selectedValues = selectedIndices.map((i) => nums[i]).join(' + ');

  steps.push({
    id: stepId++,
    description: achievable
      ? `Target ${T} is achievable! Subset: {${selectedValues}} = ${T}`
      : `Target ${T} is NOT achievable with the given set.`,
    pseudocodeLine: 9,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable
  const rows = ['empty', ...nums.map((v, i) => `nums[${i}]=${v}`)];
  const cols = Array.from({ length: T + 1 }, (_, i) => String(i));
  const cells = dp.map((row, ri) =>
    row.map((val, ci) => ({
      row: ri,
      col: ci,
      value: val ? 1 : 0,
      state: (optimalPath.some((p) => p.row === ri && p.col === ci)
        ? 'optimal'
        : 'computed') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  );

  // Numeric finalState: last row as 0/1
  const finalState = dp[n].map((v) => (v ? 1 : 0));

  return {
    config: SUBSET_SUM_CONFIG,
    steps,
    finalState,
    dpTable: { rows, cols, cells },
    selectedIndices,
    achievable,
  };
}

/** Default inputs for demo. */
export const DEFAULT_SUBSET_SUM_NUMS = [3, 7, 1, 8, 4];
export const DEFAULT_SUBSET_SUM_TARGET = 11;
