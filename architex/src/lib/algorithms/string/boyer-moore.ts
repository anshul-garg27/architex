// -----------------------------------------------------------------
// Architex -- Boyer-Moore String Matching (ALG-050)
// Bad character heuristic with right-to-left scanning
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const BOYER_MOORE_CONFIG: AlgorithmConfig = {
  id: 'boyer-moore',
  name: 'Boyer-Moore Search',
  category: 'string',
  timeComplexity: { best: 'O(n/m)', average: 'O(n)', worst: 'O(n*m)' },
  spaceComplexity: 'O(k)',
  description:
    'Boyer-Moore pattern matching with the bad character heuristic. Scans pattern right-to-left within each text window and shifts by the bad character rule on mismatch.',
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
};

export interface BoyerMooreResult extends AlgorithmResult {
  badCharTable: Record<string, number>;
  matches: number[];
}

function buildBadCharTable(pattern: string): Record<string, number> {
  const table: Record<string, number> = {};
  for (let i = 0; i < pattern.length; i++) {
    table[pattern[i]] = i;
  }
  return table;
}

export function boyerMooreSearch(
  text: string,
  pattern: string,
): BoyerMooreResult {
  const t = text.slice(0, 40);
  const p = pattern.slice(0, 15);
  const n = t.length;
  const m = p.length;

  if (m === 0 || n === 0 || m > n) {
    return {
      config: BOYER_MOORE_CONFIG,
      steps: [],
      finalState: [],
      badCharTable: {},
      matches: [],
    };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build bad character table
  const badChar = buildBadCharTable(p);

  const tableEntries = Object.entries(badChar)
    .map(([ch, idx]) => `'${ch}':${idx}`)
    .join(', ');

  steps.push({
    id: stepId++,
    description: `Built bad character table for "${p}": { ${tableEntries} }`,
    pseudocodeLine: 2,
    mutations: [
      { targetId: 'bad-char-table', property: 'label', from: '', to: tableEntries, easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Search phase
  const matches: number[] = [];
  let s = 0; // shift of the pattern with respect to text

  steps.push({
    id: stepId++,
    description: `Begin searching text "${t}" for pattern "${p}" (right-to-left scan)`,
    pseudocodeLine: 3,
    mutations: [
      { targetId: 'pattern-offset', property: 'position', from: 0, to: 0, easing: 'spring' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  while (s <= n - m) {
    let j = m - 1;

    steps.push({
      id: stepId++,
      description: `Window at shift s=${s}. Compare right-to-left starting at pattern[${j}]`,
      pseudocodeLine: 7,
      mutations: [
        { targetId: 'pattern-offset', property: 'position', from: Math.max(0, s - 1), to: s, easing: 'spring' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    // Scan right-to-left
    while (j >= 0) {
      comparisons++;
      reads += 2;

      if (p[j] === t[s + j]) {
        // Character match
        steps.push({
          id: stepId++,
          description: `Match: pattern[${j}]='${p[j]}' == text[${s + j}]='${t[s + j]}'`,
          pseudocodeLine: 8,
          mutations: [
            { targetId: `text-${s + j}`, property: 'highlight', from: 'default', to: 'sorted', easing: 'ease-out' },
            { targetId: `pattern-${j}`, property: 'highlight', from: 'default', to: 'sorted', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 250,
        });
        j--;
      } else {
        // Mismatch
        const badCharIdx = badChar[t[s + j]] ?? -1;
        const shift = Math.max(1, j - badCharIdx);

        steps.push({
          id: stepId++,
          description: `Mismatch: pattern[${j}]='${p[j]}' != text[${s + j}]='${t[s + j]}'. Bad char '${t[s + j]}' last at ${badCharIdx}. Shift by ${shift}.`,
          pseudocodeLine: 10,
          mutations: [
            { targetId: `text-${s + j}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
            { targetId: `pattern-${j}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });

        s += shift;
        break;
      }
    }

    if (j < 0) {
      // Full match found
      matches.push(s);

      const matchMutations: VisualMutation[] = [];
      for (let mi = 0; mi < m; mi++) {
        matchMutations.push({
          targetId: `text-${s + mi}`,
          property: 'highlight',
          from: 'sorted',
          to: 'found',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description: `Full match found at position ${s}!`,
        pseudocodeLine: 9,
        mutations: matchMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 600,
      });

      s += 1;
    }
  }

  // Summary
  steps.push({
    id: stepId++,
    description: matches.length > 0
      ? `Search complete. Found ${matches.length} match(es) at position(s): [${matches.join(', ')}]`
      : 'Search complete. No matches found.',
    pseudocodeLine: 11,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return {
    config: BOYER_MOORE_CONFIG,
    steps,
    finalState: Object.values(badChar),
    badCharTable: badChar,
    matches,
  };
}
