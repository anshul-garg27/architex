// -----------------------------------------------------------------
// Architex -- Bloom Filter Simulation  (DST-016)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface BloomFilterState {
  bits: boolean[];
  m: number;       // bit array size
  k: number;       // number of hash functions
  n: number;       // number of inserted elements
  insertedItems: string[];
}

/**
 * Generate k independent hash values for a string.
 * Uses a double-hashing scheme: h_i(x) = (h1(x) + i * h2(x)) mod m
 *
 * WHY k independent hashes via double-hashing: True independent hash functions are
 * expensive. Kirsch and Mitzenmacher (2006) proved that just two hash functions combined
 * as h_i = h1 + i*h2 produce the same false-positive rate as k truly independent hashes.
 * This reduces implementation complexity from k functions to just 2.
 */
// Uses Kirsch-Mitzenmacher double hashing — same technique as Cassandra and LevelDB
function hashFunctions(element: string, k: number, m: number): number[] {
  // h1: djb2-like hash (Bernstein's hash — fast, low collision rate for short strings)
  let h1 = 5381;
  for (let i = 0; i < element.length; i++) {
    h1 = ((h1 << 5) + h1 + element.charCodeAt(i)) & 0x7fffffff;
  }
  h1 = h1 % m;

  // h2: sdbm-like hash (must be independent from h1 to ensure good bit distribution)
  let h2 = 0;
  for (let i = 0; i < element.length; i++) {
    h2 = (element.charCodeAt(i) + (h2 << 6) + (h2 << 16) - h2) & 0x7fffffff;
  }
  // WHY (m-1)+1: h2 must be in [1, m-1] (never 0) so each h_i maps to a distinct bit.
  // If h2 were 0, all k hashes would collide at h1, defeating the purpose of multiple hashes.
  h2 = (h2 % (m - 1)) + 1;

  const hashes: number[] = [];
  for (let i = 0; i < k; i++) {
    hashes.push(Math.abs((h1 + i * h2) % m));
  }
  return hashes;
}

/**
 * False positive probability: (1 - e^(-kn/m))^k
 */
export function falsePositiveRate(k: number, n: number, m: number): number {
  if (n === 0 || m === 0) return 0;
  return Math.pow(1 - Math.exp((-k * n) / m), k);
}

// ── Create ──────────────────────────────────────────────────

export function createBloomFilter(m: number = 32, k: number = 3): BloomFilterState {
  return {
    bits: Array.from({ length: m }, () => false),
    m,
    k,
    n: 0,
    insertedItems: [],
  };
}

function cloneFilter(filter: BloomFilterState): BloomFilterState {
  return {
    ...filter,
    bits: [...filter.bits],
    insertedItems: [...filter.insertedItems],
  };
}

// ── Insert ──────────────────────────────────────────────────

export function bloomInsert(
  filter: BloomFilterState,
  element: string,
): DSResult<BloomFilterState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneFilter(filter);

  // AUTOBIOGRAPHY: 'A new element arrives and I greet it with my k hash functions. Each one stamps a different
  // bit position in my bit array to 1. I am like a guest book with multiple signatures — the more signatures,
  // the harder it is to forge. But I can never erase a signature, and sometimes different guests sign in the same spots.'
  steps.push(step(`Insert "${element}" into Bloom filter. A Bloom filter uses multiple hash functions to set bits in a bit array — it can tell you "definitely not in set" or "probably in set", never with certainty.`, []));

  const hashes = hashFunctions(element, copy.k, copy.m);

  for (let i = 0; i < hashes.length; i++) {
    const bitIdx = hashes[i];
    const wasSet = copy.bits[bitIdx];
    steps.push(
      step(
        `h${i + 1}("${element}") = ${bitIdx}${wasSet ? ' (already 1)' : ' — set to 1'}. Each hash function maps to a different bit position — using ${copy.k} functions reduces false positive probability at the cost of filling the bit array faster.`,
        [
          { targetId: `bit-${bitIdx}`, property: 'highlight', from: 'default', to: wasSet ? 'already-set' : 'setting' },
          { targetId: `hash-${i}`, property: 'arrow', from: 'none', to: String(bitIdx) },
        ],
      ),
    );
    copy.bits[bitIdx] = true;
  }

  copy.n++;
  copy.insertedItems.push(element);

  // AUTOBIOGRAPHY: 'Another element recorded. With each insertion, my false positive rate creeps up — more bits
  // are set to 1, and the chance of a random query hitting all 1s by accident grows. The formula (1-e^(-kn/m))^k
  // tells me exactly how trustworthy I still am. I watch my own reliability decline with every insert.'
  const fpr = falsePositiveRate(copy.k, copy.n, copy.m);
  steps.push(
    step(
      `Inserted "${element}". n=${copy.n}, FP rate: ${(fpr * 100).toFixed(2)}%`,
      [],
    ),
  );

  return { steps, snapshot: copy };
}

// ── Check (Query) ───────────────────────────────────────────

export function bloomCheck(
  filter: BloomFilterState,
  element: string,
): DSResult<BloomFilterState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  // AUTOBIOGRAPHY: 'Someone is asking me if I have seen this element before. I check all my hash positions —
  // if even ONE bit is 0, I can say with absolute certainty: "No, never seen it." But if all bits are 1,
  // I can only say "probably." Other elements might have set those same bits. I am honest about my uncertainty.'
  steps.push(step(`Check if "${element}" might be in the set. We check all ${filter.k} hash positions — if ANY bit is 0, the element was never inserted. If all are 1, it's probably present (but could be a false positive from collisions).`, []));

  const hashes = hashFunctions(element, filter.k, filter.m);
  let allSet = true;

  for (let i = 0; i < hashes.length; i++) {
    const bitIdx = hashes[i];
    const isSet = filter.bits[bitIdx];

    steps.push(
      step(
        `h${i + 1}("${element}") = ${bitIdx} -- bit is ${isSet ? '1' : '0'}`,
        [
          {
            targetId: `bit-${bitIdx}`,
            property: 'highlight',
            from: 'default',
            to: isSet ? 'found' : 'not-found',
          },
          { targetId: `hash-${i}`, property: 'arrow', from: 'none', to: String(bitIdx) },
        ],
      ),
    );

    if (!isSet) {
      allSet = false;
      // AUTOBIOGRAPHY: 'I found a 0 bit! This is my moment of certainty. If this element had been inserted,
      // ALL its hash positions would be 1. A single 0 is irrefutable proof: this element was NEVER inserted.
      // This is my superpower — I never miss a real member. No false negatives, ever.'
      steps.push(
        step(`Bit ${bitIdx} is 0 — "${element}" is DEFINITELY NOT in the set. A 0 bit is conclusive proof of absence — no combination of other elements could have left this bit unset if "${element}" was inserted.`, []),
      );
      return { steps, snapshot: filter };
    }
  }

  // AUTOBIOGRAPHY: 'All bits are 1. I think I have seen this element, but I cannot be 100% sure. Other elements
  // might have collectively set all these bit positions by coincidence. This is my fundamental trade-off:
  // I trade certainty for incredible space efficiency. A small price for using only m bits instead of storing every element.'
  const wasInserted = filter.insertedItems.includes(element);
  if (allSet && wasInserted) {
    steps.push(
      step(`All ${filter.k} bits are 1 — "${element}" is PROBABLY in the set (true positive). All hash positions are set, and we know this element was inserted.`, []),
    );
  } else if (allSet) {
    steps.push(
      step(`All ${filter.k} bits are 1 — "${element}" is PROBABLY in the set (FALSE POSITIVE!). Other elements' hashes happened to set all the same bit positions — this is the fundamental trade-off of Bloom filters.`, []),
    );
  }

  return { steps, snapshot: filter };
}
