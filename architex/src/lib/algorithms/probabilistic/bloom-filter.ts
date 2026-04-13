// -----------------------------------------------------------------
// Architex -- Bloom Filter with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const BLOOM_FILTER_CONFIG: AlgorithmConfig = {
  id: 'bloom-filter',
  name: 'Bloom Filter',
  category: 'sorting',
  timeComplexity: { best: 'O(k)', average: 'O(k)', worst: 'O(k)' },
  spaceComplexity: 'O(m)',
  stable: false,
  inPlace: false,
  description:
    "How does Google Chrome check if a URL is malicious without storing every bad URL? A Bloom Filter \u2014 a bit array with multiple hash functions. Insert: hash the item k times, set those bits to 1. Query: hash and check all k bits \u2014 if ANY is 0, definitely not in set. If ALL are 1, PROBABLY in set (false positives possible, false negatives impossible). Used in: Chrome safe browsing, Cassandra/HBase (skip disk reads), Medium (article recommendations), Bitcoin SPV nodes. Remember: 'All bits set means maybe; any bit unset means never.'",
  pseudocode: [
    'procedure bloomInsert(filter, item)',
    '  for each hash function h_i:',
    '    index = h_i(item) mod m',
    '    filter[index] = 1',
    '',
    'procedure bloomQuery(filter, item)',
    '  for each hash function h_i:',
    '    index = h_i(item) mod m',
    '    if filter[index] == 0:',
    '      return DEFINITELY_NOT_IN_SET',
    '  return PROBABLY_IN_SET',
  ],
  complexityIntuition:
    'Each insert or query hashes the item k times (k = number of hash functions) and checks/sets k positions. The bit array size m is fixed, so memory stays constant regardless of how many items you insert \u2014 the tradeoff is a rising false-positive rate.',
  difficulty: 'intermediate',
};

// -- Hash functions --------------------------------------------------

/** h1: sum of char codes mod m */
function h1(s: string, m: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    sum += s.charCodeAt(i);
  }
  return ((sum % m) + m) % m;
}

/** h2: sum of (char code * 1-based position) mod m */
function h2(s: string, m: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    sum += s.charCodeAt(i) * (i + 1);
  }
  return ((sum % m) + m) % m;
}

/** h3: sum of (char code XOR position) mod m */
function h3(s: string, m: number): number {
  let sum = 0;
  for (let i = 0; i < s.length; i++) {
    // eslint-disable-next-line no-bitwise
    sum += s.charCodeAt(i) ^ i;
  }
  return ((sum % m) + m) % m;
}

function hashItem(s: string, m: number): [number, number, number] {
  return [h1(s, m), h2(s, m), h3(s, m)];
}

// -- Default inputs --------------------------------------------------

const DEFAULT_M = 16;
const DEFAULT_INSERTS = ['hello', 'world', 'bloom'];
const DEFAULT_QUERIES = ['hello', 'filter', 'bloom'];

// -- Main algorithm --------------------------------------------------

export function bloomFilter(
  arr: number[],
  inserts: string[] = DEFAULT_INSERTS,
  queries: string[] = DEFAULT_QUERIES,
  m: number = DEFAULT_M,
): AlgorithmResult {
  const bits: number[] = new Array(m).fill(0);
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let writes = 0;

  // ---- Step 0: overview ----
  steps.push({
    id: stepId++,
    description:
      `Bloom Filter with m=${m} bits and k=3 hash functions. We will insert ${inserts.length} items, then query ${queries.length} items. The bit array starts as all zeros.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 700,
  });

  // Helper to build mutations that show current bit array state
  function bitStateMutations(highlightIndices: number[], mode: 'active' | 'found' | 'comparing'): VisualMutation[] {
    const muts: VisualMutation[] = [];
    for (let i = 0; i < m; i++) {
      const isHighlighted = highlightIndices.includes(i);
      muts.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: isHighlighted ? mode : (bits[i] === 1 ? 'sorted' : 'default'),
        easing: isHighlighted ? 'spring' : 'ease-out',
      });
    }
    return muts;
  }

  // ---- INSERT phase ----
  for (const item of inserts) {
    const [i1, i2, i3] = hashItem(item, m);
    const indices = [i1, i2, i3];
    reads += 3;

    // Show which positions the hashes map to
    steps.push({
      id: stepId++,
      description:
        `INSERT "${item}": h1=${i1}, h2=${i2}, h3=${i3}. These are the three bit positions we will set to 1.`,
      pseudocodeLine: 1,
      mutations: bitStateMutations(indices, 'active'),
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 500,
    });

    // Set the bits
    for (const idx of indices) {
      const wasBit = bits[idx];
      bits[idx] = 1;
      writes++;

      steps.push({
        id: stepId++,
        description:
          wasBit === 1
            ? `Bit ${idx} is already 1 (set by a previous insert). No change needed \u2014 collisions are expected in Bloom Filters.`
            : `Set bit ${idx} to 1. This position now marks that some item hashed here.`,
        pseudocodeLine: 3,
        mutations: bitStateMutations([idx], 'found'),
        complexity: { comparisons: 0, swaps: 0, reads, writes },
        duration: 350,
      });
    }

    // Show bit array after insert
    steps.push({
      id: stepId++,
      description:
        `"${item}" inserted. Current bit array: [${bits.join('')}]. ${bits.filter(b => b === 1).length} of ${m} bits are set.`,
      pseudocodeLine: 3,
      mutations: bitStateMutations([], 'found'),
      complexity: { comparisons: 0, swaps: 0, reads, writes },
      duration: 400,
    });
  }

  // ---- QUERY phase ----
  const insertSet = new Set(inserts);

  for (const item of queries) {
    const [i1, i2, i3] = hashItem(item, m);
    const indices = [i1, i2, i3];
    reads += 3;

    steps.push({
      id: stepId++,
      description:
        `QUERY "${item}": h1=${i1}, h2=${i2}, h3=${i3}. Check if ALL three bits are 1.`,
      pseudocodeLine: 6,
      mutations: bitStateMutations(indices, 'comparing'),
      complexity: { comparisons: indices.length, swaps: 0, reads, writes },
      duration: 500,
    });

    const allSet = indices.every(idx => bits[idx] === 1);
    const actuallyPresent = insertSet.has(item);

    if (allSet) {
      const falsePositive = !actuallyPresent;
      steps.push({
        id: stepId++,
        description: falsePositive
          ? `All bits at positions [${indices.join(', ')}] are 1, so Bloom Filter says PROBABLY IN SET. But "${item}" was never inserted \u2014 this is a FALSE POSITIVE! The hash positions overlapped with other items.`
          : `All bits at positions [${indices.join(', ')}] are 1 \u2014 PROBABLY IN SET. And "${item}" was indeed inserted, so this is a true positive.`,
        pseudocodeLine: 10,
        mutations: bitStateMutations(indices, falsePositive ? 'active' : 'found'),
        complexity: { comparisons: indices.length, swaps: 0, reads, writes },
        duration: 500,
      });
    } else {
      const zeroBits = indices.filter(idx => bits[idx] === 0);
      steps.push({
        id: stepId++,
        description:
          `Bit(s) at position(s) [${zeroBits.join(', ')}] are 0 \u2014 DEFINITELY NOT IN SET. "${item}" was never inserted. False negatives are impossible with Bloom Filters.`,
        pseudocodeLine: 9,
        mutations: bitStateMutations(zeroBits, 'active'),
        complexity: { comparisons: indices.length, swaps: 0, reads, writes },
        duration: 500,
      });
    }
  }

  // ---- Final step ----
  const finalMutations: VisualMutation[] = bits.map((b, idx): VisualMutation => ({
    targetId: `element-${idx}`,
    property: 'highlight',
    from: 'default',
    to: b === 1 ? 'sorted' : 'default',
    easing: 'ease-out',
  }));

  const setBits = bits.filter(b => b === 1).length;
  steps.push({
    id: stepId++,
    description:
      `Done! Final bit array: [${bits.join('')}]. ${setBits}/${m} bits set (${(setBits / m * 100).toFixed(0)}% fill rate). Higher fill rate = higher false positive probability.`,
    pseudocodeLine: 10,
    mutations: finalMutations,
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 600,
  });

  return { config: BLOOM_FILTER_CONFIG, steps, finalState: bits };
}
