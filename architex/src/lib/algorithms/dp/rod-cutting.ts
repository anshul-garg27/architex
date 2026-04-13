// ─────────────────────────────────────────────────────────────
// Architex — Rod Cutting Problem (ALG-049)
// 1D DP array with optimal cut visualization
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const ROD_CUTTING_CONFIG: AlgorithmConfig = {
  id: 'rod-cutting',
  name: 'Rod Cutting',
  category: 'dp',
  timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
  spaceComplexity: 'O(n)',
  description:
    'Maximizes revenue from cutting a rod of length n given a price table. 1D DP array where dp[i] is the max revenue for a rod of length i, with optimal cuts highlighted.',
  pseudocode: [
    'procedure rodCutting(prices, n)',
    '  dp[0] = 0',
    '  for i = 1 to n do',
    '    dp[i] = -INF',
    '    for j = 1 to i do',
    '      if prices[j] + dp[i-j] > dp[i] then',
    '        dp[i] = prices[j] + dp[i-j]',
    '        cutAt[i] = j',
    '  backtrack cutAt to find cuts',
    '  return dp[n]',
  ],
};

export interface RodCuttingResult extends AlgorithmResult {
  dpTable: DPTable;
  maxRevenue: number;
  cuts: number[];
}

/**
 * @param prices - prices[i] is the price of a rod of length i (1-indexed).
 *   prices[0] is ignored; prices[1] is the price for length 1, etc.
 * @param rodLength - length of the rod to cut
 */
export function rodCutting(prices: number[], rodLength: number): RodCuttingResult {
  const n = Math.max(1, Math.min(rodLength, 16));
  // Ensure prices covers lengths 1..n; pad with 0 if needed
  const p = [0, ...prices.slice(1)];
  while (p.length <= n) {
    p.push(p.length); // default price = length (linear pricing)
  }

  const dp = new Array(n + 1).fill(0);
  const cutAt = new Array(n + 1).fill(0);

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize dp[0] = 0
  writes++;
  steps.push({
    id: stepId++,
    description: 'Initialize dp[0] = 0 (rod of length 0 has no revenue)',
    pseudocodeLine: 1,
    mutations: [
      { targetId: 'dp-0-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'dp-0-0', property: 'label', from: '', to: '0', easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill DP table
  for (let i = 1; i <= n; i++) {
    dp[i] = -Infinity;

    steps.push({
      id: stepId++,
      description: `Computing dp[${i}]: max revenue for rod of length ${i}`,
      pseudocodeLine: 3,
      mutations: [
        { targetId: `dp-0-${i}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    for (let j = 1; j <= i; j++) {
      comparisons++;
      reads++;

      const candidate = p[j] + dp[i - j];

      // Show comparison: price[j] + dp[i-j]
      steps.push({
        id: stepId++,
        description: `Cut length ${j}: price[${j}]=${p[j]} + dp[${i - j}]=${dp[i - j]} = ${candidate}${candidate > dp[i] ? ' > ' + (dp[i] === -Infinity ? '-INF' : dp[i]) : ' <= ' + dp[i]}`,
        pseudocodeLine: 5,
        mutations: [
          { targetId: `dp-0-${i - j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });

      if (candidate > dp[i]) {
        dp[i] = candidate;
        cutAt[i] = j;
        writes++;

        steps.push({
          id: stepId++,
          description: `dp[${i}] updated to ${dp[i]} (first cut of length ${j})`,
          pseudocodeLine: 6,
          mutations: [
            { targetId: `dp-0-${i}`, property: 'label', from: '', to: String(dp[i]), easing: 'ease-out' },
            { targetId: `dp-0-${i - j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `No improvement, dp[${i}] stays ${dp[i]}`,
          pseudocodeLine: 5,
          mutations: [
            { targetId: `dp-0-${i - j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 250,
        });
      }
    }

    // Mark cell as computed
    steps.push({
      id: stepId++,
      description: `dp[${i}] = ${dp[i]} (best first cut = ${cutAt[i]})`,
      pseudocodeLine: 7,
      mutations: [
        { targetId: `dp-0-${i}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
        { targetId: `dp-0-${i}`, property: 'label', from: '', to: String(dp[i]), easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 350,
    });
  }

  // Backtrack to find optimal cuts
  const cuts: number[] = [];
  const optimalIndices: number[] = [];
  let remaining = n;
  while (remaining > 0) {
    optimalIndices.push(remaining);
    cuts.push(cutAt[remaining]);
    remaining -= cutAt[remaining];
  }
  optimalIndices.push(0);

  // Highlight optimal path
  const pathMutations: VisualMutation[] = optimalIndices.map((idx) => ({
    targetId: `dp-0-${idx}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Max revenue = ${dp[n]}. Cuts: [${cuts.join(', ')}]`,
    pseudocodeLine: 9,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable (1D displayed as single row)
  const cols = Array.from({ length: n + 1 }, (_, i) => String(i));
  const optimalSet = new Set(optimalIndices);
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
    config: ROD_CUTTING_CONFIG,
    steps,
    finalState: dp,
    dpTable: {
      rows: [`Prices: [${p.slice(1, n + 1).join(', ')}]`],
      cols,
      cells,
    },
    maxRevenue: dp[n],
    cuts,
  };
}
