// ─────────────────────────────────────────────────────────────
// Architex — DP Algorithms Barrel Export
// ─────────────────────────────────────────────────────────────

import type { AlgorithmConfig } from '../types';

export type { DPCell, DPTable, DPAlgorithmResult } from './types';

export { fibonacciDP, FIBONACCI_CONFIG } from './fibonacci';
export type { FibonacciResult } from './fibonacci';

export { lcs, LCS_CONFIG } from './lcs';
export type { LCSResult } from './lcs';

export { editDistance, EDIT_DISTANCE_CONFIG } from './edit-distance';
export type { EditDistanceResult, EditOp } from './edit-distance';

export { knapsack, KNAPSACK_CONFIG, DEFAULT_KNAPSACK_ITEMS } from './knapsack';
export type { KnapsackItem, KnapsackResult } from './knapsack';

export { coinChange, COIN_CHANGE_CONFIG } from './coin-change';
export type { CoinChangeResult } from './coin-change';

export { lis, LIS_CONFIG } from './lis';
export type { LISResult } from './lis';

export { matrixChain, MATRIX_CHAIN_CONFIG } from './matrix-chain';
export type { MatrixChainResult } from './matrix-chain';

export { rodCutting, ROD_CUTTING_CONFIG } from './rod-cutting';
export type { RodCuttingResult } from './rod-cutting';

export { subsetSum, SUBSET_SUM_CONFIG, DEFAULT_SUBSET_SUM_NUMS, DEFAULT_SUBSET_SUM_TARGET } from './subset-sum';
export type { SubsetSumResult } from './subset-sum';

export { longestPalindrome, LONGEST_PALINDROME_CONFIG, DEFAULT_LPS_STRING } from './longest-palindrome';
export type { LongestPalindromeResult } from './longest-palindrome';

export { catalan, CATALAN_CONFIG, DEFAULT_CATALAN_N } from './catalan';
export type { CatalanResult } from './catalan';

/** Catalog of all DP algorithm configurations. */
export const DP_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'fibonacci-dp',
    name: 'Fibonacci (DP)',
    category: 'dp',
    difficulty: 'beginner',
    timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(n)',
    description:
      'Computes Fibonacci numbers using dynamic programming. Shows bottom-up table filling with memoization — each cell depends on the previous two.',
    complexityIntuition: 'O(n): one pass through the table, each cell computed in O(1) from the previous two.',
    realWorldApps: ['Dynamic programming teaching', 'Fibonacci heaps', 'Nature modeling (phyllotaxis)'],
    interviewTips: "Gateway DP question. Know: recursive O(2^n) vs DP O(n). Follow-up: 'Can you do O(1) space?' Yes, two variables.",
    whenToUse: 'Use bottom-up DP for Fibonacci. Memoized recursion works too but uses O(n) call stack.',
    pseudocode: [
      'procedure fibonacci(n)',
      '  dp[0] = 0; dp[1] = 1',
      '  for i = 2 to n do',
      '    dp[i] = dp[i-1] + dp[i-2]',
      '  return dp[n]',
    ],
  },
  {
    id: 'lcs',
    name: 'Longest Common Subsequence',
    category: 'dp',
    difficulty: 'intermediate',
    prerequisites: ['fibonacci-dp'],
    timeComplexity: { best: 'O(m*n)', average: 'O(m*n)', worst: 'O(m*n)' },
    spaceComplexity: 'O(m*n)',
    description:
      'How does "git diff" figure out which lines changed between two files? It finds the Longest Common Subsequence -- the longest sequence of elements appearing in both strings in order (not necessarily contiguous). Build an (m x n) table: if characters match, take the diagonal + 1; otherwise, take the max of left or above. Backtrack from the bottom-right corner to recover the actual subsequence. Used in: diff tools (git diff, unified diff), DNA/protein sequence alignment, version control merge. Remember: "Match = diagonal + 1, else max(left, above). Backtrack for the answer."',
    complexityIntuition: 'O(m\u00B7n): fill every cell in an m\u00D7n table. Two 100-char strings = 10,000 operations.',
    realWorldApps: ['git diff (file comparison)', 'DNA sequence alignment', 'Version control merge'],
    interviewTips: "Classic 2D DP. Know the backtracking step to recover the sequence. Follow-up: 'O(n) space possible?' Yes, one row.",
    whenToUse: 'Use for comparing two sequences. For edit distance (insert/delete/replace), use Levenshtein instead.',
    summary: [
      'Match = diagonal+1, else max(left, above). Backtrack.',
      'O(m*n) time filling an m x n table. Classic 2D DP.',
      '"git diff engine" -- finds what two files have in common.',
    ],
    commonMistakes: [
      '"LCS means longest common substring" -- no! Subsequence allows gaps, substring must be contiguous.',
      '"LCS table gives the subsequence directly" -- it gives the LENGTH. You must backtrack to recover it.',
    ],
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
  },
  {
    id: 'edit-distance',
    name: 'Edit Distance (Levenshtein)',
    category: 'dp',
    difficulty: 'intermediate',
    prerequisites: ['lcs'],
    timeComplexity: { best: 'O(m*n)', average: 'O(m*n)', worst: 'O(m*n)' },
    spaceComplexity: 'O(m*n)',
    description:
      'How does your phone\'s autocorrect know that "teh" is probably "the"? Edit Distance (Levenshtein) counts the minimum inserts, deletes, and replacements to transform one string into another. Build an (m x n) table: if characters match, copy the diagonal; otherwise, take 1 + min(left, above, diagonal) representing insert, delete, or replace. Backtrack to see exactly which operations were chosen. Used in: spell checkers, autocorrect, DNA mutation analysis, fuzzy search (e.g., Elasticsearch). Remember: "Match = free (diagonal). Mismatch = 1 + min(insert, delete, replace)."',
    realWorldApps: ['Spell checkers (autocorrect)', 'DNA mutation analysis', 'Fuzzy search (Elasticsearch)'],
    interviewTips: "Know all 3 operations: insert, delete, replace. Follow-up: 'O(n) space?' Yes, keep only two rows.",
    whenToUse: 'Use to measure string similarity with edits. For subsequence matching only, use LCS instead.',
    summary: [
      'Match = free (diagonal). Mismatch = 1 + min(ins, del, rep).',
      'O(m*n) time. Measures minimum edits to transform one string.',
      '"Autocorrect engine" -- how far is "teh" from "the"?',
    ],
    commonMistakes: [
      '"Edit distance and LCS are the same" -- LCS finds common parts; edit distance counts transformations.',
      '"You need O(m*n) space" -- you can optimize to O(min(m,n)) by keeping only two rows.',
    ],
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
  },
  {
    id: 'knapsack',
    name: '0/1 Knapsack',
    category: 'dp',
    difficulty: 'intermediate',
    prerequisites: ['fibonacci-dp'],
    timeComplexity: { best: 'O(n*W)', average: 'O(n*W)', worst: 'O(n*W)' },
    spaceComplexity: 'O(n*W)',
    description:
      'You\'re packing for a trip. Your bag holds 10 kg. You have 5 items, each with a weight and a value — whole item or nothing. Which combination maximizes value? Brute force tries all 2^n subsets, way too slow. DP builds an (items x capacity) table: each cell asks "skip or take?" and picks the better option. Use for resource allocation with discrete choices and a constraint (budget, weight, time). Used in: portfolio optimization, cargo loading, bandwidth allocation. Remember: "For each item: skip or take? Compare both. Fill the table."',
    complexityIntuition: 'O(n\u00B7W): n items \u00D7 W capacity cells. Pseudo-polynomial \u2014 W can be exponentially large in input bits.',
    realWorldApps: ['Investment portfolio optimization', 'Cargo loading', 'Resource scheduling'],
    interviewTips: "Top DP question. Know: 0/1 vs unbounded difference. Follow-up: 'Can you optimize space to O(W)?' Yes, 1D array.",
    whenToUse: 'Use for resource allocation with discrete choices. For fractional items, use greedy (fractional knapsack).',
    summary: [
      'For each item: skip or take? Compare both. Fill the table.',
      'O(n*W) time. Pseudo-polynomial (W can be huge).',
      '"Packing a suitcase" -- maximize value within weight limit.',
    ],
    commonMistakes: [
      '"Knapsack is polynomial" -- it is pseudo-polynomial. O(n*W) and W can be exponential in input bits.',
      '"Greedy works for 0/1 knapsack" -- no! Greedy only works for the fractional variant.',
    ],
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
  },
  {
    id: 'coin-change',
    name: 'Coin Change',
    category: 'dp',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n*amount)', average: 'O(n*amount)', worst: 'O(n*amount)' },
    spaceComplexity: 'O(amount)',
    description:
      'A vending machine needs to give 67 cents change using the fewest coins possible. Greedy (always pick the largest coin) fails for some denominations. DP gets it right: build an array dp[0..amount] where dp[i] = fewest coins to make amount i. For each amount, try every coin and take min(dp[amount - coin]) + 1. If dp[amount] is still infinity, no solution exists. Used in: currency systems, resource allocation with fixed unit sizes, making change in retail point-of-sale systems. Remember: "For each amount, try every coin. dp[amount - coin] + 1. Take the min."',
    realWorldApps: ['Vending machines', 'Currency exchange systems', 'Resource allocation with fixed units'],
    interviewTips: "Know: greedy fails for some denominations. Follow-up: 'How to count total ways?' Different DP recurrence.",
    whenToUse: 'Use for minimum coins/steps with fixed denominations. For counting all ways, modify the recurrence.',
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
  },
  {
    id: 'lis',
    name: 'Longest Increasing Subsequence',
    category: 'dp',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(n)',
    description:
      'In a stream of stock prices, what\'s the longest stretch of increasing values (not necessarily consecutive)? That\'s the Longest Increasing Subsequence. For each element i, check all previous elements j: if arr[j] < arr[i], then dp[i] = max(dp[i], dp[j] + 1). The naive approach is O(n^2). A clever patience-sorting approach with binary search achieves O(n log n). Used in: stock trend analysis, scheduling jobs by deadline, layered network design (longest chain). Remember: "For each element, find the best predecessor. dp[i] = dp[j] + 1 if arr[j] < arr[i]."',
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
  },
  {
    id: 'matrix-chain',
    name: 'Matrix Chain Multiplication',
    category: 'dp',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n³)', average: 'O(n³)', worst: 'O(n³)' },
    spaceComplexity: 'O(n²)',
    description:
      'Multiplying 3 matrices: does the ORDER of multiplication matter for speed? Absolutely -- (A*B)*C vs A*(B*C) can differ by millions of operations. Matrix Chain finds the optimal parenthesization. Build a 2D table: dp[i][j] = min cost to multiply matrices i through j. Try every split point k and pick the cheapest: dp[i][k] + dp[k+1][j] + dimension cost. O(n^3) time, O(n^2) space. Used in: compiler query optimization, graphics pipeline (transform chains), scientific computing. Remember: "Try every split point. dp[i][j] = min over k of left + right + merge cost."',
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
  },
  {
    id: 'rod-cutting',
    name: 'Rod Cutting',
    category: 'dp',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(n)',
    description:
      'You have an 8-meter steel rod and different prices per length -- a 3m piece sells for $8, a 5m piece for $10. How do you cut to maximize revenue? Build dp[0..n] where dp[i] = max revenue for length i. For each length i, try every cut j from 1 to i: dp[i] = max(price[j] + dp[i-j]). Backtrack through cut choices to find the actual cuts. O(n^2) time, O(n) space. Used in: lumber mills, fabric cutting, bandwidth allocation. Remember: "For each length, try every first-cut. dp[i] = max(price[j] + dp[i-j])."',
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
  },
  {
    id: 'subset-sum',
    name: 'Subset Sum',
    category: 'dp',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n*T)', average: 'O(n*T)', worst: 'O(n*T)' },
    spaceComplexity: 'O(n*T)',
    description:
      'Can you pick some numbers from a set that add up EXACTLY to a target? Brute force checks all 2^n subsets. DP does it in O(n*T): build a boolean table dp[i][s] = "can we make sum s using the first i numbers?" Each cell: either skip the number (copy row above) or include it (check dp[i-1][s-num]). If dp[n][target] is true, backtrack to find which numbers were picked. Used in: financial reconciliation, partitioning resources evenly, cryptographic knapsack systems. Remember: "Skip or include each number. dp[i][s] = dp[i-1][s] OR dp[i-1][s-num]."',
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
  },
  {
    id: 'longest-palindrome',
    name: 'Longest Palindromic Subsequence',
    category: 'dp',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(n²)',
    description:
      'What\'s the longest word you can read the same forwards and backwards inside a string? Every single character is a palindrome of length 1. Build outward: dp[i][j] = length of the longest palindromic subsequence in s[i..j]. If s[i] == s[j], take dp[i+1][j-1] + 2; otherwise max(dp[i+1][j], dp[i][j-1]). Fill the table by increasing substring length (diagonal by diagonal). Used in: DNA sequence analysis (palindromic sequences), text compression, computational linguistics. Remember: "Ends match? Diagonal + 2. Otherwise max(shrink left, shrink right)."',
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
  },
  {
    id: 'catalan',
    name: 'Catalan Numbers',
    category: 'dp',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(n)',
    description:
      'How many different ways can you arrange N pairs of parentheses so they\'re all valid? The answer is the Nth Catalan number. C(n) = sum of C(i)*C(n-1-i) for i=0..n-1. It counts an astonishing range of structures: valid parenthesizations, BST shapes with n nodes, paths that never cross the diagonal, and triangulations of polygons. Build bottom-up: each C(n) uses all previously computed values. O(n^2) time, O(n) space. Used in: compiler parse tree counting, combinatorial enumeration, ballot problem analysis. Remember: "C(n) = sum of C(i)*C(n-1-i). Counts BSTs, parentheses, paths, and more."',
    pseudocode: [
      'procedure catalan(n)',
      '  C[0] = 1; C[1] = 1',
      '  for i = 2 to n do',
      '    C[i] = 0',
      '    for j = 0 to i-1 do',
      '      C[i] += C[j] * C[i-1-j]',
      '  return C[n]',
    ],
  },
];
