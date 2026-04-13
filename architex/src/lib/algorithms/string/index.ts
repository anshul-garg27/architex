// ─────────────────────────────────────────────────────────────
// Architex — String Algorithms Barrel Export
// ─────────────────────────────────────────────────────────────

import type { AlgorithmConfig } from '../types';

export { kmpSearch, KMP_CONFIG } from './kmp';
export type { KMPResult } from './kmp';

export { rabinKarpSearch, RABIN_KARP_CONFIG } from './rabin-karp';
export type { RabinKarpResult } from './rabin-karp';

export { boyerMooreSearch, BOYER_MOORE_CONFIG } from './boyer-moore';
export type { BoyerMooreResult } from './boyer-moore';

export { zAlgorithmSearch, Z_ALGORITHM_CONFIG } from './z-algorithm';
export type { ZAlgorithmResult } from './z-algorithm';

/** Catalog of all string algorithm configurations. */
export const STRING_ALGORITHMS: AlgorithmConfig[] = [
  {
    id: 'kmp',
    name: 'KMP String Search',
    category: 'string',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n+m)' },
    spaceComplexity: 'O(m)',
    description:
      'You\'re searching for "ABABC" in a book. You match A-B-A-B... then mismatch. Restart? Wasteful — the "AB" at the end already matches the start. KMP precomputes a failure function: on mismatch at position j, jump to failure[j-1] instead of restarting. Never moves backward in the text. Builds the failure table in O(m), matches in O(n). Use for guaranteed linear-time search, especially on streaming data where backtracking is impossible. Used in: text editors (find/replace), DNA sequence matching, intrusion detection. Remember: "Precompute where to jump on mismatch. Never re-read the text."',
    pseudocode: [
      'procedure buildFailure(P)',
      '  F[0] = 0; k = 0',
      '  for j = 1 to |P| - 1 do',
      '    while k > 0 and P[k] != P[j]: k = F[k-1]',
      '    if P[k] == P[j]: k++',
      '    F[j] = k',
      'procedure KMP(T, P)',
      '  F = buildFailure(P)',
      '  q = 0',
      '  for i = 0 to |T| - 1 do',
      '    while q > 0 and P[q] != T[i]: q = F[q-1]',
      '    if P[q] == T[i]: q++',
      '    if q == |P|: match at i - |P| + 1; q = F[q-1]',
      '  return matches',
    ],
  },
  {
    id: 'rabin-karp',
    name: 'Rabin-Karp Search',
    category: 'string',
    difficulty: 'intermediate',
    timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n*m)' },
    spaceComplexity: 'O(1)',
    description:
      'What if you could compare a whole substring in O(1) using a hash -- and only verify characters when hashes match? Rabin-Karp slides a window across the text, updating the hash in O(1) by subtracting the outgoing char and adding the incoming one. Hash matches the pattern? Verify char-by-char to rule out collisions. Shines for multi-pattern search: hash all patterns, check each window against the set. Used in: plagiarism detection, grep-like multi-pattern tools, DNA substring search. Remember: "Rolling hash, O(1) per shift. Hash match? Verify. Best for many patterns."',
    pseudocode: [
      'procedure RabinKarp(T, P)',
      '  d = 256; q = 101  // base & modulus',
      '  patHash = hash(P)',
      '  winHash = hash(T[0..m-1])',
      '  h = d^(m-1) mod q',
      '  for i = 0 to n - m do',
      '    if winHash == patHash then',
      '      verify T[i..i+m-1] == P char by char',
      '      if match: record position i',
      '    if i < n - m then',
      '      winHash = (d*(winHash - T[i]*h) + T[i+m]) mod q',
      '      if winHash < 0: winHash += q',
      '  return matches',
    ],
  },
  {
    id: 'boyer-moore',
    name: 'Boyer-Moore Search',
    category: 'string',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n/m)', average: 'O(n)', worst: 'O(n*m)' },
    spaceComplexity: 'O(k)',
    description:
      'Most search algorithms scan left-to-right. Boyer-Moore scans RIGHT-TO-LEFT and can skip entire chunks of text. On mismatch, the bad character rule asks: "Where does this character appear in the pattern?" If nowhere, skip the entire pattern length. If found, align it. In practice, this means sublinear time -- O(n/m) best case. The longer the pattern, the bigger the skips. Used in: GNU grep (default algorithm), text editors (Ctrl+F), large-scale log searching. Remember: "Compare right-to-left. Mismatch = skip. Longer patterns = bigger jumps."',
    pseudocode: [
      'procedure buildBadChar(P)',
      '  for each char c: table[c] = -1',
      '  for j = 0 to |P| - 1: table[P[j]] = j',
      'procedure BoyerMoore(T, P)',
      '  table = buildBadChar(P)',
      '  s = 0  // current shift',
      '  while s <= n - m do',
      '    j = m - 1',
      '    while j >= 0 and P[j] == T[s+j]: j--',
      '    if j < 0: match at s; s += 1',
      '    else: s += max(1, j - table[T[s+j]])',
      '  return matches',
    ],
  },
  {
    id: 'z-algorithm',
    name: 'Z-Algorithm Search',
    category: 'string',
    difficulty: 'advanced',
    timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n+m)' },
    spaceComplexity: 'O(n+m)',
    description:
      'The Z-array tells you: for each position i, how much of the string starting at i matches its own prefix? Concatenate pattern + "$" + text, build the Z-array in O(n+m). Any Z[i] equal to pattern length is a match. The trick: maintain a window [L, R] of the rightmost Z-box to avoid redundant comparisons -- similar to KMP but sometimes simpler to implement. Guaranteed O(n+m) with no worst-case degradation. Used in: pattern matching, string compression, finding all periods/repetitions in a string. Remember: "Z[i] = prefix match length at i. Concatenate P$T. Z[i] == |P| means match."',
    pseudocode: [
      'procedure buildZArray(S)',
      '  Z[0] = |S|; L = 0; R = 0',
      '  for i = 1 to |S| - 1 do',
      '    if i < R: Z[i] = min(R - i, Z[i - L])',
      '    else: Z[i] = 0',
      '    while i + Z[i] < |S| and S[Z[i]] == S[i + Z[i]]: Z[i]++',
      '    if i + Z[i] > R: L = i; R = i + Z[i]',
      'procedure ZSearch(T, P)',
      '  S = P + "$" + T',
      '  Z = buildZArray(S)',
      '  for i = |P| + 1 to |S| - 1 do',
      '    if Z[i] == |P|: match at i - |P| - 1',
      '  return matches',
    ],
  },
];
