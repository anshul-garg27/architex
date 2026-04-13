// ─────────────────────────────────────────────────────────────
// Architex — Longest Increasing Subsequence (ALG-047)
// 1D DP array with element highlighting
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const LIS_CONFIG: AlgorithmConfig = {
  id: 'lis',
  name: 'Longest Increasing Subsequence',
  category: 'dp',
  timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
  spaceComplexity: 'O(n)',
  description:
    'Finds the length of the longest strictly increasing subsequence. Shows 1D dp array filling with comparisons and backtracking to recover the subsequence.',
  pseudocode: [
    'procedure LIS(arr)',
    '  n = |arr|; dp[0..n-1] = 1',
    '  for i = 1 to n-1 do',
    '    for j = 0 to i-1 do',
    '      if arr[j] < arr[i] then',
    '        dp[i] = max(dp[i], dp[j] + 1)',
    '  maxLen = max(dp)',
    '  backtrack to recover subsequence',
    '  return maxLen',
  ],
};

export interface LISResult extends AlgorithmResult {
  dpTable: DPTable;
  lisLength: number;
  subsequence: number[];
}

export function lis(arr: number[]): LISResult {
  const input = arr.slice(0, 16);
  const n = input.length;

  const dp = new Array(n).fill(1);
  const parent = new Array(n).fill(-1);

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize all dp values to 1
  const initMutations: VisualMutation[] = [];
  for (let i = 0; i < n; i++) {
    initMutations.push({
      targetId: `dp-0-${i}`,
      property: 'highlight',
      from: 'default',
      to: 'computed',
      easing: 'ease-out',
    });
    initMutations.push({
      targetId: `dp-0-${i}`,
      property: 'label',
      from: '',
      to: '1',
      easing: 'ease-out',
    });
    writes++;
  }

  steps.push({
    id: stepId++,
    description: 'Initialize all dp values to 1 (each element is a subsequence of length 1)',
    pseudocodeLine: 1,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill DP table
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      comparisons++;
      reads += 2;

      if (input[j] < input[i]) {
        // Show comparison: dependency on j
        steps.push({
          id: stepId++,
          description: `arr[${j}]=${input[j]} < arr[${i}]=${input[i]}: check dp[${i}] vs dp[${j}]+1 = ${dp[j] + 1}`,
          pseudocodeLine: 4,
          mutations: [
            { targetId: `dp-0-${i}`, property: 'highlight', from: 'computed', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-0-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        if (dp[j] + 1 > dp[i]) {
          dp[i] = dp[j] + 1;
          parent[i] = j;
          writes++;

          steps.push({
            id: stepId++,
            description: `dp[${i}] updated to ${dp[i]} (extending subsequence ending at index ${j})`,
            pseudocodeLine: 5,
            mutations: [
              { targetId: `dp-0-${i}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
              { targetId: `dp-0-${i}`, property: 'label', from: '', to: String(dp[i]), easing: 'ease-out' },
              { targetId: `dp-0-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        } else {
          steps.push({
            id: stepId++,
            description: `dp[${i}]=${dp[i]} already >= dp[${j}]+1=${dp[j] + 1}, no update`,
            pseudocodeLine: 5,
            mutations: [
              { targetId: `dp-0-${i}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
              { targetId: `dp-0-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        }
      }
    }
  }

  // Find maximum LIS length and its ending index
  let maxLen = 0;
  let maxIdx = 0;
  for (let i = 0; i < n; i++) {
    if (dp[i] > maxLen) {
      maxLen = dp[i];
      maxIdx = i;
    }
  }

  // Backtrack to recover the subsequence
  const lisIndices: number[] = [];
  let idx = maxIdx;
  while (idx !== -1) {
    lisIndices.unshift(idx);
    idx = parent[idx];
  }
  const subsequence = lisIndices.map((i) => input[i]);

  // Highlight optimal path
  const pathMutations: VisualMutation[] = lisIndices.map((i) => ({
    targetId: `dp-0-${i}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `LIS length = ${maxLen}. Subsequence: [${subsequence.join(', ')}]`,
    pseudocodeLine: 8,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable (1D displayed as single row)
  const cols = input.map((v) => String(v));
  const optimalSet = new Set(lisIndices);
  const cells = [
    cols.map((_, ci) => ({
      row: 0,
      col: ci,
      value: dp[ci],
      state: (optimalSet.has(ci)
        ? 'optimal'
        : 'computed') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  ];

  return {
    config: LIS_CONFIG,
    steps,
    finalState: dp,
    dpTable: {
      rows: ['dp'],
      cols,
      cells,
    },
    lisLength: maxLen,
    subsequence,
  };
}
