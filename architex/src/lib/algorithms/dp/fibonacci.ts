// ─────────────────────────────────────────────────────────────
// Architex — Fibonacci DP (ALG-042)
// Top-down vs bottom-up with memoization table visualization
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const FIBONACCI_CONFIG: AlgorithmConfig = {
  id: 'fibonacci-dp',
  name: 'Fibonacci (DP)',
  category: 'dp',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(n)',
  description:
    'Computes Fibonacci numbers using dynamic programming. Shows bottom-up table filling with memoization — each cell depends on the previous two.',
  pseudocode: [
    'procedure fibonacci(n)',
    '  dp[0] = 0; dp[1] = 1',
    '  for i = 2 to n do',
    '    dp[i] = dp[i-1] + dp[i-2]',
    '  return dp[n]',
  ],
};

export interface FibonacciResult extends AlgorithmResult {
  dpTable: DPTable;
}

export function fibonacciDP(n: number): FibonacciResult {
  const clampedN = Math.max(2, Math.min(n, 20));
  const dp = new Array(clampedN + 1).fill(0);
  dp[1] = 1;

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let writes = 0;

  const cols = Array.from({ length: clampedN + 1 }, (_, i) => String(i));

  // Step: Initialize dp[0] and dp[1]
  writes += 2;
  steps.push({
    id: stepId++,
    description: 'Initialize dp[0] = 0 and dp[1] = 1',
    pseudocodeLine: 1,
    mutations: [
      { targetId: 'dp-0-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'dp-0-1', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'dp-0-0', property: 'label', from: '', to: '0', easing: 'ease-out' },
      { targetId: 'dp-0-1', property: 'label', from: '', to: '1', easing: 'ease-out' },
    ],
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill bottom-up
  for (let i = 2; i <= clampedN; i++) {
    reads += 2;

    // Highlight dependencies
    const depMutations: VisualMutation[] = [
      { targetId: `dp-0-${i - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
      { targetId: `dp-0-${i - 2}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
      { targetId: `dp-0-${i}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
    ];

    steps.push({
      id: stepId++,
      description: `Computing dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]}`,
      pseudocodeLine: 3,
      mutations: depMutations,
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 400,
    });

    dp[i] = dp[i - 1] + dp[i - 2];
    writes++;

    // Mark as computed
    steps.push({
      id: stepId++,
      description: `dp[${i}] = ${dp[i]}`,
      pseudocodeLine: 3,
      mutations: [
        { targetId: `dp-0-${i}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
        { targetId: `dp-0-${i}`, property: 'label', from: '', to: String(dp[i]), easing: 'ease-out' },
        { targetId: `dp-0-${i - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
        { targetId: `dp-0-${i - 2}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
      ],
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 400,
    });
  }

  // Highlight final answer
  steps.push({
    id: stepId++,
    description: `Fibonacci(${clampedN}) = ${dp[clampedN]}`,
    pseudocodeLine: 4,
    mutations: [
      { targetId: `dp-0-${clampedN}`, property: 'highlight', from: 'computed', to: 'optimal', easing: 'ease-out' },
    ],
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 600,
  });

  const cells = [cols.map((_, col) => ({
    row: 0,
    col,
    value: dp[col],
    state: 'computed' as const,
  }))];

  return {
    config: FIBONACCI_CONFIG,
    steps,
    finalState: dp,
    dpTable: {
      rows: ['F(n)'],
      cols,
      cells,
    },
  };
}
