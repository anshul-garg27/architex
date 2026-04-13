// ─────────────────────────────────────────────────────────────
// Architex — Coin Change (ALG-046)
// 1D DP array filling with optimal coin selection
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const COIN_CHANGE_CONFIG: AlgorithmConfig = {
  id: 'coin-change',
  name: 'Coin Change',
  category: 'dp',
  timeComplexity: { best: 'O(n*amount)', average: 'O(n*amount)', worst: 'O(n*amount)' },
  spaceComplexity: 'O(amount)',
  description:
    'Minimum number of coins needed to make a given amount. Shows 1D DP array filling with coin contributions and optimal path.',
  pseudocode: [
    'procedure coinChange(coins, amount)',
    '  dp[0] = 0; dp[1..amount] = INF',
    '  for a = 1 to amount do',
    '    for each coin in coins do',
    '      if coin <= a and dp[a - coin] + 1 < dp[a] then',
    '        dp[a] = dp[a - coin] + 1',
    '        coinUsed[a] = coin',
    '  backtrack coinUsed to find which coins',
    '  return dp[amount]',
  ],
};

export interface CoinChangeResult extends AlgorithmResult {
  dpTable: DPTable;
  coinsUsed: number[];
  minCoins: number;
}

export function coinChange(coins: number[], amount: number): CoinChangeResult {
  const clampedAmount = Math.max(1, Math.min(amount, 20));
  const sortedCoins = [...coins].sort((a, b) => a - b);

  const dp = new Array(clampedAmount + 1).fill(Infinity);
  dp[0] = 0;
  const coinUsed = new Array(clampedAmount + 1).fill(-1);

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize
  writes++;
  steps.push({
    id: stepId++,
    description: `Initialize dp[0] = 0, dp[1..${clampedAmount}] = INF`,
    pseudocodeLine: 1,
    mutations: [
      { targetId: 'dp-0-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'dp-0-0', property: 'label', from: '', to: '0', easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill DP
  for (let a = 1; a <= clampedAmount; a++) {
    for (const coin of sortedCoins) {
      if (coin > a) continue;

      comparisons++;
      reads++;

      const prevVal = dp[a - coin];
      if (prevVal === Infinity) continue;

      if (prevVal + 1 < dp[a]) {
        reads++;
        dp[a] = prevVal + 1;
        coinUsed[a] = coin;
        writes++;

        steps.push({
          id: stepId++,
          description: `Amount ${a}: use coin ${coin}. dp[${a}] = dp[${a - coin}] + 1 = ${dp[a - coin] - 1} + 1 = ${dp[a]}. For each amount, try every coin: if using this coin gives fewer total coins, update. This builds the optimal solution bottom-up.`,
          pseudocodeLine: 5,
          mutations: [
            { targetId: `dp-0-${a}`, property: 'highlight', from: a === 1 ? 'default' : 'computed', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-0-${a - coin}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });

        steps.push({
          id: stepId++,
          description: `dp[${a}] = ${dp[a]} (using coin ${coin})`,
          pseudocodeLine: 5,
          mutations: [
            { targetId: `dp-0-${a}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-0-${a}`, property: 'label', from: '', to: String(dp[a]), easing: 'ease-out' },
            { targetId: `dp-0-${a - coin}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      }
    }

    // If amount was not reachable, mark computed with INF
    if (dp[a] === Infinity) {
      steps.push({
        id: stepId++,
        description: `Amount ${a}: no coin can reach this amount. dp[${a}] = INF`,
        pseudocodeLine: 3,
        mutations: [
          { targetId: `dp-0-${a}`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
          { targetId: `dp-0-${a}`, property: 'label', from: '', to: 'INF', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 350,
      });
    }
  }

  // Backtrack to find coins used
  const coinsUsed: number[] = [];
  const optimalPath: Array<{ row: number; col: number }> = [];

  if (dp[clampedAmount] !== Infinity) {
    let remaining = clampedAmount;
    while (remaining > 0) {
      optimalPath.push({ row: 0, col: remaining });
      coinsUsed.push(coinUsed[remaining]);
      remaining -= coinUsed[remaining];
    }
    optimalPath.push({ row: 0, col: 0 });
  }

  // Highlight optimal path
  const pathMutations: VisualMutation[] = optimalPath.map(({ row, col }) => ({
    targetId: `dp-${row}-${col}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  const resultDesc =
    dp[clampedAmount] === Infinity
      ? `Cannot make amount ${clampedAmount} with given coins`
      : `Min coins = ${dp[clampedAmount]}. Coins: [${coinsUsed.join(', ')}]`;

  steps.push({
    id: stepId++,
    description: resultDesc,
    pseudocodeLine: 8,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable (1D displayed as single row)
  const cols = Array.from({ length: clampedAmount + 1 }, (_, i) => String(i));
  const displayDp = dp.map((v) => (v === Infinity ? -1 : v));
  const cells = [
    cols.map((_, ci) => ({
      row: 0,
      col: ci,
      value: displayDp[ci],
      state: (optimalPath.some((p) => p.col === ci)
        ? 'optimal'
        : displayDp[ci] >= 0
          ? 'computed'
          : 'default') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  ];

  return {
    config: COIN_CHANGE_CONFIG,
    steps,
    finalState: displayDp,
    dpTable: {
      rows: [`Coins: [${sortedCoins.join(', ')}]`],
      cols,
      cells,
    },
    coinsUsed,
    minCoins: dp[clampedAmount] === Infinity ? -1 : dp[clampedAmount],
  };
}
