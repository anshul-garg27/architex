// ─────────────────────────────────────────────────────────────
// Architex — Levenshtein Edit Distance (ALG-044)
// Operations: insert (green), delete (red), replace (yellow), match (gray)
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const EDIT_DISTANCE_CONFIG: AlgorithmConfig = {
  id: 'edit-distance',
  name: 'Edit Distance (Levenshtein)',
  category: 'dp',
  timeComplexity: { best: 'O(m*n)', average: 'O(m*n)', worst: 'O(m*n)' },
  spaceComplexity: 'O(m*n)',
  description:
    'Minimum number of edit operations (insert, delete, replace) to transform one string into another. Shows operation types with color-coded backtracking.',
  pseudocode: [
    'procedure editDistance(A, B)',
    '  m = |A|; n = |B|',
    '  dp[i][0] = i; dp[0][j] = j',
    '  for i = 1 to m do',
    '    for j = 1 to n do',
    '      if A[i] == B[j] then',
    '        dp[i][j] = dp[i-1][j-1]       // match',
    '      else',
    '        dp[i][j] = 1 + min(',
    '          dp[i-1][j],    // delete',
    '          dp[i][j-1],    // insert',
    '          dp[i-1][j-1])  // replace',
    '  backtrack to find alignment',
    '  return dp[m][n]',
  ],
};

export type EditOp = 'match' | 'insert' | 'delete' | 'replace';

export interface EditDistanceResult extends AlgorithmResult {
  dpTable: DPTable;
  alignment: EditOp[];
  distance: number;
}

export function editDistance(str1: string, str2: string): EditDistanceResult {
  const s1 = str1.slice(0, 12);
  const s2 = str2.slice(0, 12);
  const m = s1.length;
  const n = s2.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize base cases
  const initMutations: VisualMutation[] = [];
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
    writes++;
    initMutations.push(
      { targetId: `dp-${i}-0`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: `dp-${i}-0`, property: 'label', from: '', to: String(i), easing: 'ease-out' },
    );
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j;
    writes++;
    initMutations.push(
      { targetId: `dp-0-${j}`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: `dp-0-${j}`, property: 'label', from: '', to: String(j), easing: 'ease-out' },
    );
  }

  steps.push({
    id: stepId++,
    description: 'Initialize base cases: dp[i][0] = i, dp[0][j] = j',
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
        // Match: take diagonal, cost 0
        reads++;
        dp[i][j] = dp[i - 1][j - 1];
        writes++;

        steps.push({
          id: stepId++,
          description: `'${s1[i - 1]}' == '${s2[j - 1]}' (match): dp[${i}][${j}] = dp[${i - 1}][${j - 1}] = ${dp[i][j]}`,
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
          description: `dp[${i}][${j}] = ${dp[i][j]} (match, no cost)`,
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
        reads += 3;
        const del = dp[i - 1][j];
        const ins = dp[i][j - 1];
        const rep = dp[i - 1][j - 1];
        dp[i][j] = 1 + Math.min(del, ins, rep);
        writes++;

        const minOp =
          rep <= del && rep <= ins ? 'replace' : del <= ins ? 'delete' : 'insert';

        steps.push({
          id: stepId++,
          description: `'${s1[i - 1]}' != '${s2[j - 1]}': 1 + min(del=${del}, ins=${ins}, rep=${rep}) = ${dp[i][j]} [${minOp}]. Each cell asks: what's cheapest — insert, delete, or replace? We pick the minimum of three options.`,
          pseudocodeLine: 8,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${j}] = ${dp[i][j]} (${minOp})`,
          pseudocodeLine: 8,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i - 1}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      }
    }
  }

  // Backtrack to find alignment and optimal path
  const optimalPath: Array<{ row: number; col: number }> = [];
  const alignment: EditOp[] = [];
  let bi = m;
  let bj = n;

  while (bi > 0 || bj > 0) {
    optimalPath.unshift({ row: bi, col: bj });

    if (bi > 0 && bj > 0 && s1[bi - 1] === s2[bj - 1]) {
      alignment.unshift('match');
      bi--;
      bj--;
    } else if (bi > 0 && bj > 0 && dp[bi][bj] === dp[bi - 1][bj - 1] + 1) {
      alignment.unshift('replace');
      bi--;
      bj--;
    } else if (bi > 0 && dp[bi][bj] === dp[bi - 1][bj] + 1) {
      alignment.unshift('delete');
      bi--;
    } else {
      alignment.unshift('insert');
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
    description: `Edit distance = ${dp[m][n]}. Operations: ${alignment.join(', ')}`,
    pseudocodeLine: 12,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable
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
    config: EDIT_DISTANCE_CONFIG,
    steps,
    finalState: dp[m],
    dpTable: { rows, cols, cells },
    alignment,
    distance: dp[m][n],
  };
}
