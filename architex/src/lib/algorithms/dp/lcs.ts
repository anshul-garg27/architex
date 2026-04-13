// ─────────────────────────────────────────────────────────────
// Architex — Longest Common Subsequence (ALG-043)
// 2D DP table with backtracking visualization
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const LCS_CONFIG: AlgorithmConfig = {
  id: 'lcs',
  name: 'Longest Common Subsequence',
  category: 'dp',
  timeComplexity: { best: 'O(m*n)', average: 'O(m*n)', worst: 'O(m*n)' },
  spaceComplexity: 'O(m*n)',
  description:
    'Finds the longest subsequence common to two strings. 2D table with dependency arrows and optimal path backtracking.',
  pseudocode: [
    'procedure LCS(X, Y)',
    '  m = |X|; n = |Y|',
    '  for i = 0 to m, j = 0 to n: dp[i][0] = dp[0][j] = 0',
    '  for i = 1 to m do',
    '    for j = 1 to n do',
    '      if X[i] == Y[j] then',
    '        dp[i][j] = dp[i-1][j-1] + 1',
    '      else',
    '        dp[i][j] = max(dp[i-1][j], dp[i][j-1])',
    '  backtrack from dp[m][n] to recover LCS',
    '  return dp[m][n]',
  ],
};

export interface LCSResult extends AlgorithmResult {
  dpTable: DPTable;
  lcsString: string;
}

export function lcs(str1: string, str2: string): LCSResult {
  const s1 = str1.slice(0, 12);
  const s2 = str2.slice(0, 12);
  const m = s1.length;
  const n = s2.length;

  // Build dp table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize row 0 and col 0
  const initMutations: VisualMutation[] = [];
  for (let i = 0; i <= m; i++) {
    initMutations.push({
      targetId: `dp-${i}-0`,
      property: 'highlight',
      from: 'default',
      to: 'computed',
      easing: 'ease-out',
    });
    initMutations.push({
      targetId: `dp-${i}-0`,
      property: 'label',
      from: '',
      to: '0',
      easing: 'ease-out',
    });
    writes++;
  }
  for (let j = 1; j <= n; j++) {
    initMutations.push({
      targetId: `dp-0-${j}`,
      property: 'highlight',
      from: 'default',
      to: 'computed',
      easing: 'ease-out',
    });
    initMutations.push({
      targetId: `dp-0-${j}`,
      property: 'label',
      from: '',
      to: '0',
      easing: 'ease-out',
    });
    writes++;
  }

  steps.push({
    id: stepId++,
    description: 'Initialize first row and column to 0',
    pseudocodeLine: 2,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      comparisons++;
      reads += 2;

      if (s1[i - 1] === s2[j - 1]) {
        reads++;
        dp[i][j] = dp[i - 1][j - 1] + 1;
        writes++;

        // Show dependency on diagonal
        steps.push({
          id: stepId++,
          description: `'${s1[i - 1]}' == '${s2[j - 1]}': dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${dp[i][j]}. If characters match, extend the previous diagonal — the LCS grows by 1. If not, take the better of skipping either character.`,
          pseudocodeLine: 6,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${j}] = ${dp[i][j]} (match on '${s1[i - 1]}')`,
          pseudocodeLine: 6,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      } else {
        reads += 2;
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        writes++;

        const fromAbove = dp[i - 1][j] >= dp[i][j - 1];

        steps.push({
          id: stepId++,
          description: `'${s1[i - 1]}' != '${s2[j - 1]}': dp[${i}][${j}] = max(dp[${i - 1}][${j}], dp[${i}][${j - 1}]) = max(${dp[i - 1][j]}, ${dp[i][j - 1]}) = ${dp[i][j]}`,
          pseudocodeLine: 8,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${j}] = ${dp[i][j]} (took ${fromAbove ? 'above' : 'left'})`,
          pseudocodeLine: 8,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      }
    }
  }

  // Backtrack to find LCS string and optimal path
  const optimalPath: Array<{ row: number; col: number }> = [];
  let lcsString = '';
  let bi = m;
  let bj = n;

  while (bi > 0 && bj > 0) {
    if (s1[bi - 1] === s2[bj - 1]) {
      optimalPath.unshift({ row: bi, col: bj });
      lcsString = s1[bi - 1] + lcsString;
      bi--;
      bj--;
    } else if (dp[bi - 1][bj] > dp[bi][bj - 1]) {
      bi--;
    } else {
      bj--;
    }
  }

  // Highlight optimal path
  const pathMutations: VisualMutation[] = optimalPath.map(({ row, col }) => ({
    targetId: `dp-${row}-${col}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `LCS = "${lcsString}" (length ${dp[m][n]})`,
    pseudocodeLine: 9,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable for visualizer
  const rows = ['', ...s1.split('')];
  const cols = ['', ...s2.split('')];
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
    config: LCS_CONFIG,
    steps,
    finalState: dp[m],
    dpTable: { rows, cols, cells },
    lcsString,
  };
}
