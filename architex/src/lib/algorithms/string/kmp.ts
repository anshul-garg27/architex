// ─────────────────────────────────────────────────────────────
// Architex — KMP String Matching (ALG-048)
// Failure function + pattern sliding with match/mismatch highlights
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const KMP_CONFIG: AlgorithmConfig = {
  id: 'kmp',
  name: 'KMP String Search',
  category: 'string',
  timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n+m)' },
  spaceComplexity: 'O(m)',
  description:
    'Knuth-Morris-Pratt pattern matching. Precomputes a failure function to skip redundant comparisons when a mismatch occurs.',
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
};

export interface KMPResult extends AlgorithmResult {
  failureFunction: number[];
  matches: number[];
}

export function kmpSearch(text: string, pattern: string): KMPResult {
  const t = text.slice(0, 40);
  const p = pattern.slice(0, 15);
  const n = t.length;
  const m = p.length;

  if (m === 0 || n === 0 || m > n) {
    return {
      config: KMP_CONFIG,
      steps: [],
      finalState: [],
      failureFunction: [],
      matches: [],
    };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build failure function
  const F = new Array(m).fill(0);
  let k = 0;

  steps.push({
    id: stepId++,
    description: `Building failure function for pattern "${p}"`,
    pseudocodeLine: 0,
    mutations: [
      { targetId: 'failure-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'failure-0', property: 'label', from: '', to: '0', easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  for (let j = 1; j < m; j++) {
    while (k > 0 && p[k] !== p[j]) {
      comparisons++;
      reads += 2;
      k = F[k - 1];
    }

    comparisons++;
    reads += 2;
    if (p[k] === p[j]) {
      k++;
    }
    F[j] = k;
    writes++;

    steps.push({
      id: stepId++,
      description: `F[${j}] = ${k} (pattern[${k > 0 ? k - 1 : 0}]${k > 0 ? ` == '${p[k - 1]}'` : ''}, pattern[${j}] = '${p[j]}')`,
      pseudocodeLine: 5,
      mutations: [
        { targetId: `failure-${j}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    steps.push({
      id: stepId++,
      description: `F[${j}] = ${F[j]}`,
      pseudocodeLine: 5,
      mutations: [
        { targetId: `failure-${j}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
        { targetId: `failure-${j}`, property: 'label', from: '', to: String(F[j]), easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Search phase
  const matches: number[] = [];
  let q = 0;

  steps.push({
    id: stepId++,
    description: `Begin searching text "${t}" for pattern "${p}"`,
    pseudocodeLine: 6,
    mutations: [
      { targetId: 'pattern-offset', property: 'position', from: 0, to: 0, easing: 'spring' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  for (let i = 0; i < n; i++) {
    while (q > 0 && p[q] !== t[i]) {
      comparisons++;
      reads += 2;
      const oldQ = q;
      q = F[q - 1];

      steps.push({
        id: stepId++,
        description: `Mismatch: text[${i}]='${t[i]}' != pattern[${oldQ}]='${p[oldQ]}'. Shift: q = F[${oldQ - 1}] = ${q}`,
        pseudocodeLine: 10,
        mutations: [
          { targetId: `text-${i}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
          { targetId: `pattern-${oldQ}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
          { targetId: 'pattern-offset', property: 'position', from: i - oldQ, to: i - q, easing: 'spring' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
    }

    comparisons++;
    reads += 2;

    if (p[q] === t[i]) {
      // Match at this position
      steps.push({
        id: stepId++,
        description: `Match: text[${i}]='${t[i]}' == pattern[${q}]='${p[q]}'`,
        pseudocodeLine: 11,
        mutations: [
          { targetId: `text-${i}`, property: 'highlight', from: 'default', to: 'sorted', easing: 'ease-out' },
          { targetId: `pattern-${q}`, property: 'highlight', from: 'default', to: 'sorted', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });

      q++;

      if (q === m) {
        const matchPos = i - m + 1;
        matches.push(matchPos);

        // Highlight full match
        const matchMutations: VisualMutation[] = [];
        for (let mi = 0; mi < m; mi++) {
          matchMutations.push({
            targetId: `text-${matchPos + mi}`,
            property: 'highlight',
            from: 'sorted',
            to: 'found',
            easing: 'ease-out',
          });
        }

        steps.push({
          id: stepId++,
          description: `Full match found at position ${matchPos}!`,
          pseudocodeLine: 12,
          mutations: matchMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 600,
        });

        q = F[q - 1];
      }
    } else {
      // Mismatch at first character position
      steps.push({
        id: stepId++,
        description: `Mismatch: text[${i}]='${t[i]}' != pattern[${q}]='${p[q]}'. No prefix to fall back to.`,
        pseudocodeLine: 10,
        mutations: [
          { targetId: `text-${i}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
          { targetId: `pattern-${q}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
    }
  }

  // Summary
  steps.push({
    id: stepId++,
    description: matches.length > 0
      ? `Search complete. Found ${matches.length} match(es) at position(s): [${matches.join(', ')}]`
      : 'Search complete. No matches found.',
    pseudocodeLine: 13,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return {
    config: KMP_CONFIG,
    steps,
    finalState: F,
    failureFunction: F,
    matches,
  };
}
