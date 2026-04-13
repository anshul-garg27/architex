// -----------------------------------------------------------------
// Architex -- Longest Palindromic Subsequence (ALG-047)
// 2D table with string as both axes. Diagonal expansion pattern.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const LONGEST_PALINDROME_CONFIG: AlgorithmConfig = {
  id: 'longest-palindrome',
  name: 'Longest Palindromic Subsequence',
  category: 'dp',
  timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(n^2)',
  description:
    'Finds the longest subsequence of a string that is a palindrome. 2D table with the string as both axes, filled by diagonal expansion. Backtracks to recover the palindrome.',
  pseudocode: [
    'procedure LPS(s)',
    '  n = |s|',
    '  for i = 0 to n-1: dp[i][i] = 1',
    '  for len = 2 to n do',
    '    for i = 0 to n - len do',
    '      j = i + len - 1',
    '      if s[i] == s[j] then',
    '        dp[i][j] = dp[i+1][j-1] + 2',
    '      else',
    '        dp[i][j] = max(dp[i+1][j], dp[i][j-1])',
    '  backtrack to recover palindrome',
    '  return dp[0][n-1]',
  ],
};

export interface LongestPalindromeResult extends AlgorithmResult {
  dpTable: DPTable;
  palindrome: string;
  length: number;
}

export function longestPalindrome(
  s: string,
): LongestPalindromeResult {
  const input = s.slice(0, 15); // Clamp for visualization
  const n = input.length;

  const dp: number[][] = Array.from({ length: n }, () =>
    new Array(n).fill(0),
  );

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Base case: single characters are palindromes of length 1
  const initMutations: VisualMutation[] = [];
  for (let i = 0; i < n; i++) {
    dp[i][i] = 1;
    writes++;
    initMutations.push(
      { targetId: `dp-${i}-${i}`, property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: `dp-${i}-${i}`, property: 'label', from: '', to: '1', easing: 'ease-out' },
    );
  }

  steps.push({
    id: stepId++,
    description: 'Initialize diagonal: each single character is a palindrome of length 1',
    pseudocodeLine: 2,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill by diagonal expansion (increasing substring length)
  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1;
      comparisons++;

      if (input[i] === input[j]) {
        reads++;
        dp[i][j] = (len === 2 ? 0 : dp[i + 1][j - 1]) + 2;
        writes++;

        const depMutations: VisualMutation[] = [
          { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
        ];
        if (len > 2) {
          depMutations.push(
            { targetId: `dp-${i + 1}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          );
        }

        steps.push({
          id: stepId++,
          description: `s[${i}]='${input[i]}' == s[${j}]='${input[j]}': dp[${i}][${j}] = ${len > 2 ? `dp[${i + 1}][${j - 1}](${dp[i + 1][j - 1]})` : '0'} + 2 = ${dp[i][j]}`,
          pseudocodeLine: 7,
          mutations: depMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        const resolveMutations: VisualMutation[] = [
          { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
          { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
        ];
        if (len > 2) {
          resolveMutations.push(
            { targetId: `dp-${i + 1}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          );
        }

        steps.push({
          id: stepId++,
          description: `dp[${i}][${j}] = ${dp[i][j]} (match)`,
          pseudocodeLine: 7,
          mutations: resolveMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      } else {
        reads += 2;
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
        writes++;

        steps.push({
          id: stepId++,
          description: `s[${i}]='${input[i]}' != s[${j}]='${input[j]}': max(dp[${i + 1}][${j}](${dp[i + 1][j]}), dp[${i}][${j - 1}](${dp[i][j - 1]})) = ${dp[i][j]}`,
          pseudocodeLine: 9,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
            { targetId: `dp-${i + 1}-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        steps.push({
          id: stepId++,
          description: `dp[${i}][${j}] = ${dp[i][j]} (no match)`,
          pseudocodeLine: 9,
          mutations: [
            { targetId: `dp-${i}-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j}`, property: 'label', from: '', to: String(dp[i][j]), easing: 'ease-out' },
            { targetId: `dp-${i + 1}-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
            { targetId: `dp-${i}-${j - 1}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }
  }

  // Backtrack to recover the palindrome
  const optimalPath: Array<{ row: number; col: number }> = [];
  const lpsLength = n > 0 ? dp[0][n - 1] : 0;
  const palindromeChars: string[] = new Array(lpsLength).fill('');
  let lo = 0;
  let hi = lpsLength - 1;
  let bi = 0;
  let bj = n - 1;

  while (bi <= bj && lo <= hi) {
    if (bi === bj) {
      palindromeChars[lo] = input[bi];
      optimalPath.push({ row: bi, col: bj });
      break;
    } else if (input[bi] === input[bj]) {
      palindromeChars[lo] = input[bi];
      palindromeChars[hi] = input[bj];
      optimalPath.push({ row: bi, col: bj });
      bi++;
      bj--;
      lo++;
      hi--;
    } else if (dp[bi + 1][bj] > dp[bi][bj - 1]) {
      bi++;
    } else {
      bj--;
    }
  }

  const palindrome = palindromeChars.join('');

  // Highlight optimal cells
  const pathMutations: VisualMutation[] = optimalPath.map(({ row, col }) => ({
    targetId: `dp-${row}-${col}`,
    property: 'highlight' as const,
    from: 'computed',
    to: 'optimal',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Longest Palindromic Subsequence length = ${lpsLength}: "${palindrome}"`,
    pseudocodeLine: 11,
    mutations: pathMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable
  const charLabels = input.split('').map((c, i) => `${c} (${i})`);
  const cells = dp.map((row, ri) =>
    row.map((val, ci) => ({
      row: ri,
      col: ci,
      value: val,
      state: (optimalPath.some((p) => p.row === ri && p.col === ci)
        ? 'optimal'
        : ri <= ci ? 'computed' : 'default') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  );

  const finalState = n > 0 ? dp[0] : [];

  return {
    config: LONGEST_PALINDROME_CONFIG,
    steps,
    finalState,
    dpTable: { rows: charLabels, cols: charLabels, cells },
    palindrome,
    length: lpsLength,
  };
}

/** Default input for demo. */
export const DEFAULT_LPS_STRING = 'BBABCBCAB';
