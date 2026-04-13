// -----------------------------------------------------------------
// Architex -- Z-Algorithm String Matching (ALG-051)
// Z-array construction and pattern matching via concatenation
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const Z_ALGORITHM_CONFIG: AlgorithmConfig = {
  id: 'z-algorithm',
  name: 'Z-Algorithm Search',
  category: 'string',
  timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n+m)' },
  spaceComplexity: 'O(n+m)',
  description:
    'Builds a Z-array where Z[i] is the length of the longest substring starting at position i that matches a prefix of the string. Uses the Z-array on the concatenation P$T to find pattern matches.',
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
};

export interface ZAlgorithmResult extends AlgorithmResult {
  zArray: number[];
  matches: number[];
}

export function zAlgorithmSearch(
  text: string,
  pattern: string,
): ZAlgorithmResult {
  const t = text.slice(0, 40);
  const p = pattern.slice(0, 15);
  const n = t.length;
  const m = p.length;

  if (m === 0 || n === 0 || m > n) {
    return {
      config: Z_ALGORITHM_CONFIG,
      steps: [],
      finalState: [],
      zArray: [],
      matches: [],
    };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Concatenation: P$T
  const concat = p + '$' + t;
  const len = concat.length;

  steps.push({
    id: stepId++,
    description: `Concatenate: S = "${p}" + "$" + "${t}" (length ${len})`,
    pseudocodeLine: 8,
    mutations: [
      { targetId: 'concat-string', property: 'label', from: '', to: concat, easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Build Z-array
  const Z = new Array(len).fill(0);
  Z[0] = len;
  writes++;

  let L = 0;
  let R = 0;

  steps.push({
    id: stepId++,
    description: `Initialize Z-array. Z[0] = ${len}. L=0, R=0`,
    pseudocodeLine: 1,
    mutations: [
      { targetId: 'z-0', property: 'label', from: '', to: String(len), easing: 'ease-out' },
      { targetId: 'z-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  for (let i = 1; i < len; i++) {
    // Initialize Z[i] from Z-box if possible
    if (i < R) {
      Z[i] = Math.min(R - i, Z[i - L]);
      reads++;
      writes++;

      steps.push({
        id: stepId++,
        description: `i=${i}: inside Z-box [${L},${R}). Z[${i}] = min(R-i=${R - i}, Z[i-L]=${Z[i - L]}) = ${Z[i]}`,
        pseudocodeLine: 3,
        mutations: [
          { targetId: `z-${i}`, property: 'highlight', from: 'default', to: 'active', easing: 'ease-out' },
          { targetId: `z-${i}`, property: 'label', from: '', to: String(Z[i]), easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });
    } else {
      Z[i] = 0;
      writes++;

      steps.push({
        id: stepId++,
        description: `i=${i}: outside Z-box. Z[${i}] = 0, start extending`,
        pseudocodeLine: 4,
        mutations: [
          { targetId: `z-${i}`, property: 'highlight', from: 'default', to: 'active', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });
    }

    // Extend Z[i] by character comparisons
    const startZ = Z[i];
    while (i + Z[i] < len && concat[Z[i]] === concat[i + Z[i]]) {
      comparisons++;
      reads += 2;
      Z[i]++;
      writes++;
    }
    if (i + Z[i] < len) {
      comparisons++;
      reads += 2;
    }

    if (Z[i] > startZ) {
      steps.push({
        id: stepId++,
        description: `Extended Z[${i}] from ${startZ} to ${Z[i]} by character matching`,
        pseudocodeLine: 5,
        mutations: [
          { targetId: `z-${i}`, property: 'label', from: String(startZ), to: String(Z[i]), easing: 'ease-out' },
          { targetId: `z-${i}`, property: 'highlight', from: 'active', to: 'computing', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
    }

    // Update Z-box
    if (i + Z[i] > R) {
      L = i;
      R = i + Z[i];

      steps.push({
        id: stepId++,
        description: `Update Z-box: L=${L}, R=${R}`,
        pseudocodeLine: 6,
        mutations: [
          { targetId: `z-${i}`, property: 'highlight', from: Z[i] > startZ ? 'computing' : 'active', to: 'computed', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 200,
      });
    } else {
      steps.push({
        id: stepId++,
        description: `Z[${i}] = ${Z[i]}. Z-box unchanged [${L},${R})`,
        pseudocodeLine: 6,
        mutations: [
          { targetId: `z-${i}`, property: 'highlight', from: Z[i] > startZ ? 'computing' : 'active', to: 'computed', easing: 'ease-out' },
          { targetId: `z-${i}`, property: 'label', from: '', to: String(Z[i]), easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 200,
      });
    }
  }

  // Extract matches from Z-array
  const matches: number[] = [];

  steps.push({
    id: stepId++,
    description: `Z-array built. Scanning for positions where Z[i] == ${m} (pattern length)`,
    pseudocodeLine: 10,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  for (let i = m + 1; i < len; i++) {
    if (Z[i] === m) {
      const matchPos = i - m - 1; // subtract pattern length and '$'
      matches.push(matchPos);

      const matchMutations: VisualMutation[] = [];
      for (let mi = 0; mi < m; mi++) {
        matchMutations.push({
          targetId: `text-${matchPos + mi}`,
          property: 'highlight',
          from: 'default',
          to: 'found',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description: `Z[${i}] = ${m} == pattern length. Match found at text position ${matchPos}!`,
        pseudocodeLine: 11,
        mutations: matchMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 600,
      });
    }
  }

  // Summary
  steps.push({
    id: stepId++,
    description: matches.length > 0
      ? `Search complete. Found ${matches.length} match(es) at position(s): [${matches.join(', ')}]`
      : 'Search complete. No matches found.',
    pseudocodeLine: 12,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return {
    config: Z_ALGORITHM_CONFIG,
    steps,
    finalState: Z,
    zArray: Z,
    matches,
  };
}
