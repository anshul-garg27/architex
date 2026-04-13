// ─────────────────────────────────────────────────────────────
// Architex — Rabin-Karp String Matching (ALG-049)
// Rolling hash with window sliding, hash comparison, and verification
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const RABIN_KARP_CONFIG: AlgorithmConfig = {
  id: 'rabin-karp',
  name: 'Rabin-Karp Search',
  category: 'string',
  timeComplexity: { best: 'O(n+m)', average: 'O(n+m)', worst: 'O(n*m)' },
  spaceComplexity: 'O(1)',
  description:
    'Uses a rolling hash to quickly compare pattern hash with text window hash. Only does character-by-character verification on hash matches.',
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
};

export interface RabinKarpResult extends AlgorithmResult {
  matches: number[];
  hashValues: number[];
}

const BASE = 256;
const MOD = 101;

function charCode(c: string): number {
  return c.charCodeAt(0);
}

export function rabinKarpSearch(
  text: string,
  pattern: string,
): RabinKarpResult {
  const t = text.slice(0, 40);
  const p = pattern.slice(0, 15);
  const n = t.length;
  const m = p.length;

  if (m === 0 || n === 0 || m > n) {
    return {
      config: RABIN_KARP_CONFIG,
      steps: [],
      finalState: [],
      matches: [],
      hashValues: [],
    };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Compute h = BASE^(m-1) mod MOD
  let h = 1;
  for (let i = 0; i < m - 1; i++) {
    h = (h * BASE) % MOD;
  }

  // Compute initial hashes
  let patHash = 0;
  let winHash = 0;
  for (let i = 0; i < m; i++) {
    patHash = (BASE * patHash + charCode(p[i])) % MOD;
    winHash = (BASE * winHash + charCode(t[i])) % MOD;
  }

  steps.push({
    id: stepId++,
    description: `Pattern hash = ${patHash}. Initial window hash = ${winHash}.`,
    pseudocodeLine: 2,
    mutations: [
      { targetId: 'hash-pattern', property: 'label', from: '', to: String(patHash), easing: 'ease-out' },
      { targetId: 'hash-window', property: 'label', from: '', to: String(winHash), easing: 'ease-out' },
      { targetId: 'pattern-offset', property: 'position', from: 0, to: 0, easing: 'spring' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  const matches: number[] = [];
  const hashValues: number[] = [winHash];

  // Sliding window
  for (let i = 0; i <= n - m; i++) {
    comparisons++;
    reads++;

    if (winHash === patHash) {
      // Hash match — verify character by character
      const verifyMutations: VisualMutation[] = [];
      for (let vi = 0; vi < m; vi++) {
        verifyMutations.push({
          targetId: `text-${i + vi}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description: `Hash match at position ${i} (hash=${winHash}). Verifying character by character...`,
        pseudocodeLine: 6,
        mutations: [
          ...verifyMutations,
          { targetId: 'hash-window', property: 'highlight', from: 'default', to: 'found', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });

      // Verify
      let verified = true;
      for (let j = 0; j < m; j++) {
        comparisons++;
        reads += 2;
        if (t[i + j] !== p[j]) {
          verified = false;

          steps.push({
            id: stepId++,
            description: `Verification failed: text[${i + j}]='${t[i + j]}' != pattern[${j}]='${p[j]}' (spurious hit)`,
            pseudocodeLine: 7,
            mutations: [
              { targetId: `text-${i + j}`, property: 'highlight', from: 'active', to: 'swapping', easing: 'ease-out' },
              { targetId: `pattern-${j}`, property: 'highlight', from: 'default', to: 'swapping', easing: 'ease-out' },
              { targetId: 'hash-window', property: 'highlight', from: 'found', to: 'default', easing: 'ease-out' },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 400,
          });
          break;
        }
      }

      if (verified) {
        matches.push(i);

        const matchMutations: VisualMutation[] = [];
        for (let mi = 0; mi < m; mi++) {
          matchMutations.push({
            targetId: `text-${i + mi}`,
            property: 'highlight',
            from: 'active',
            to: 'found',
            easing: 'ease-out',
          });
        }

        steps.push({
          id: stepId++,
          description: `Verified match at position ${i}!`,
          pseudocodeLine: 8,
          mutations: [
            ...matchMutations,
            { targetId: 'hash-window', property: 'highlight', from: 'found', to: 'default', easing: 'ease-out' },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 600,
        });
      }
    } else {
      // No hash match
      steps.push({
        id: stepId++,
        description: `Position ${i}: window hash ${winHash} != pattern hash ${patHash}. Slide window. Rabin-Karp compares hashes first — if hashes don't match, the strings definitely differ. Only when hashes match do we verify character-by-character.`,
        pseudocodeLine: 5,
        mutations: [
          { targetId: 'pattern-offset', property: 'position', from: i, to: i, easing: 'spring' },
          { targetId: 'hash-window', property: 'label', from: '', to: String(winHash), easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });
    }

    // Roll the hash (if not last position)
    if (i < n - m) {
      reads += 2;
      writes++;
      winHash =
        ((BASE * (winHash - charCode(t[i]) * h) + charCode(t[i + m])) % MOD + MOD) % MOD;

      hashValues.push(winHash);

      steps.push({
        id: stepId++,
        description: `Roll hash: remove '${t[i]}', add '${t[i + m]}' -> hash = ${winHash}`,
        pseudocodeLine: 10,
        mutations: [
          { targetId: `text-${i}`, property: 'highlight', from: 'default', to: 'default', easing: 'ease-out' },
          { targetId: `text-${i + m}`, property: 'highlight', from: 'default', to: 'active', easing: 'ease-out' },
          { targetId: 'pattern-offset', property: 'position', from: i, to: i + 1, easing: 'spring' },
          { targetId: 'hash-window', property: 'label', from: '', to: String(winHash), easing: 'ease-out' },
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
    pseudocodeLine: 12,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return {
    config: RABIN_KARP_CONFIG,
    steps,
    finalState: hashValues,
    matches,
    hashValues,
  };
}
