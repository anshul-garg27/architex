// ─────────────────────────────────────────────────────────────
// Architex — Matrix Chain Multiplication (ALG-048)
// 2D DP table with split-point evaluation
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const MATRIX_CHAIN_CONFIG: AlgorithmConfig = {
  id: 'matrix-chain',
  name: 'Matrix Chain Multiplication',
  category: 'dp',
  timeComplexity: { best: 'O(n³)', average: 'O(n³)', worst: 'O(n³)' },
  spaceComplexity: 'O(n²)',
  description:
    'Finds the optimal way to parenthesize a chain of matrices to minimize scalar multiplications. 2D table where dp[i][j] stores the minimum cost to multiply matrices i..j.',
  pseudocode: [
    'procedure matrixChain(dims)',
    '  n = |dims| - 1',
    '  for i = 1 to n: dp[i][i] = 0',
    '  for len = 2 to n do',
    '    for i = 1 to n - len + 1 do',
    '      j = i + len - 1; dp[i][j] = INF',
    '      for k = i to j - 1 do',
    '        cost = dp[i][k] + dp[k+1][j] + d[i-1]*d[k]*d[j]',
    '        if cost < dp[i][j] then',
    '          dp[i][j] = cost; split[i][j] = k',
    '  return dp[1][n], optimal parenthesization',
  ],
};

export interface MatrixChainResult extends AlgorithmResult {
  dpTable: DPTable;
  minOps: number;
  parenthesization: string;
}

/**
 * @param dims - Array of matrix dimensions. For n matrices, dims has n+1 elements.
 *   Matrix i has dimensions dims[i-1] x dims[i].
 */
export function matrixChain(dims: number[]): MatrixChainResult {
  const d = dims.slice(0, 8); // cap at 7 matrices for visualization
  const n = d.length - 1; // number of matrices

  // dp[i][j] = min cost to multiply matrices i..j (1-indexed)
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  const split: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize diagonal to 0
  const initMutations: VisualMutation[] = [];
  for (let i = 1; i <= n; i++) {
    initMutations.push({
      targetId: `dp-${i}-${i}`,
      property: 'highlight',
      from: 'default',
      to: 'computed',
      easing: 'ease-out',
    });
    initMutations.push({
      targetId: `dp-${i}-${i}`,
      property: 'label',
      from: '',
      to: '0',
      easing: 'ease-out',
    });
    writes++;
  }

  steps.push({
    id: stepId++,
    description: 'Initialize diagonal dp[i][i] = 0 (single matrix, no multiplication)',
    pseudocodeLine: 2,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill table by increasing chain length
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i <= n - len + 1; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;

      // Show we are computing dp[i][j]
      steps.push({
        id: stepId++,
        description: `Computing dp[${i}][${j}]: optimal cost to multiply M${i}..M${j}`,
        pseudocodeLine: 5,
        mutations: [
          { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });

      for (let k = i; k < j; k++) {
        comparisons++;
        reads += 2;

        const cost = dp[i][k] + dp[k + 1][j] + d[i - 1] * d[k] * d[j];

        // Show the two sub-problems being read
        steps.push({
          id: stepId++,
          description: `Split k=${k}: cost = dp[${i}][${k}](${dp[i][k]}) + dp[${k + 1}][${j}](${dp[k + 1][j]}) + ${d[i - 1]}*${d[k]}*${d[j]} = ${cost}`,
          pseudocodeLine: 7,
          mutations: [
            { targetId: `dp-${i}-${k}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${k + 1}-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        // Reset dependencies
        const resetMutations: VisualMutation[] = [
          { targetId: `dp-${i}-${k}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          { targetId: `dp-${k + 1}-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
        ];

        if (cost < dp[i][j]) {
          dp[i][j] = cost;
          split[i][j] = k;
          writes++;

          steps.push({
            id: stepId++,
            description: `New minimum for dp[${i}][${j}] = ${cost} at split k=${k}`,
            pseudocodeLine: 9,
            mutations: [
              ...resetMutations,
              { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(cost), easing: 'ease-out' },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        } else {
          steps.push({
            id: stepId++,
            description: `cost ${cost} >= dp[${i}][${j}]=${dp[i][j]}, no update`,
            pseudocodeLine: 8,
            mutations: resetMutations,
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 250,
          });
        }
      }

      // Mark cell as computed
      steps.push({
        id: stepId++,
        description: `dp[${i}][${j}] = ${dp[i][j]} (best split at k=${split[i][j]})`,
        pseudocodeLine: 9,
        mutations: [
          { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
          { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 350,
      });
    }
  }

  // Build optimal parenthesization string
  function buildParens(i: number, j: number): string {
    if (i === j) return `M${i}`;
    const k = split[i][j];
    return `(${buildParens(i, k)} x ${buildParens(k + 1, j)})`;
  }

  const parenthesization = buildParens(1, n);
  const minOps = dp[1][n];

  // Highlight optimal path through split points
  const optimalCells: Array<{ row: number; col: number }> = [];
  function collectOptimalCells(i: number, j: number): void {
    if (i === j) {
      optimalCells.push({ row: i, col: j });
      return;
    }
    optimalCells.push({ row: i, col: j });
    const k = split[i][j];
    collectOptimalCells(i, k);
    collectOptimalCells(k + 1, j);
  }
  collectOptimalCells(1, n);

  const pathMutations: VisualMutation[] = optimalCells.map(({ row, col }) => ({
    targetId: `dp-${row}-${col}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Min operations = ${minOps}. Optimal: ${parenthesization}`,
    pseudocodeLine: 10,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable (2D, 1-indexed)
  const labels = Array.from({ length: n }, (_, i) => `M${i + 1}`);
  const rows = ['', ...labels];
  const cols = ['', ...labels];
  const cells = Array.from({ length: n + 1 }, (_, ri) =>
    Array.from({ length: n + 1 }, (_, ci) => ({
      row: ri,
      col: ci,
      value: ri >= 1 && ci >= 1 && ci >= ri ? dp[ri][ci] : -1,
      state: (ri >= 1 && ci >= 1 && ci >= ri
        ? optimalCells.some((p) => p.row === ri && p.col === ci)
          ? 'optimal'
          : 'computed'
        : 'default') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  );

  return {
    config: MATRIX_CHAIN_CONFIG,
    steps,
    finalState: dp[1],
    dpTable: { rows, cols, cells },
    minOps,
    parenthesization,
  };
}
