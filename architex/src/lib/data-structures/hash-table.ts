// -----------------------------------------------------------------
// Architex -- Hash Table with Separate Chaining  (DST-006)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ───────────────────────────────────────────────────

export interface HTEntry {
  key: string;
  value: number;
}

export interface HTBucket {
  index: number;
  chain: HTEntry[];
}

export interface HashTableState {
  buckets: HTBucket[];
  size: number;
  capacity: number;
}

/** Simple hash function for demonstration.
 * WHY prime 31: Prime multipliers distribute hash values more uniformly because
 * they have no common factors with typical data patterns. 31 is especially popular
 * because (hash << 5) - hash is a fast CPU operation, and it produces few collisions
 * in practice. Larger primes (e.g., 37) work too but 31 is the de facto standard.
 */
// This polynomial rolling hash (prime 31) is identical to Java's String.hashCode()
export function simpleHash(key: string, capacity: number): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % capacity;
  }
  return Math.abs(hash);
}

// WHY separate chaining instead of open addressing: Chaining is easier to visualize
// and reason about for teaching. Each bucket holds a linked list of colliding entries,
// making it obvious how collisions degrade performance. Open addressing (probing)
// is harder to animate and understand, though it offers better cache locality in production.
// Production note: Go's map uses open addressing with Swiss tables; Java's HashMap uses chaining.
export function createHashTable(capacity: number = 8): HashTableState {
  const buckets: HTBucket[] = [];
  for (let i = 0; i < capacity; i++) {
    buckets.push({ index: i, chain: [] });
  }
  return { buckets, size: 0, capacity };
}

function cloneTable(table: HashTableState): HashTableState {
  return {
    ...table,
    buckets: table.buckets.map((b) => ({
      ...b,
      chain: b.chain.map((e) => ({ ...e })),
    })),
  };
}

// ── Insert ──────────────────────────────────────────────────

export function hashInsert(
  table: HashTableState,
  key: string,
  value: number,
): DSResult<HashTableState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneTable(table);

  // Step 1: Hash the key
  // AUTOBIOGRAPHY: 'I take the key and run it through my hash function — my secret formula that turns any string
  // into a bucket number. No searching, no scanning — I know EXACTLY where to go. That is my O(1) superpower.'
  const bucketIdx = simpleHash(key, copy.capacity);
  steps.push(
    step(`hash("${key}") = ${bucketIdx}. The hash function converts any key into a bucket index (0 to ${copy.capacity - 1}), giving us O(1) direct access instead of searching.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  // Step 2: Find the bucket
  const bucket = copy.buckets[bucketIdx];
  steps.push(
    step(`Go to bucket[${bucketIdx}] (chain length: ${bucket.chain.length}). If multiple keys hash to the same bucket, they form a chain — more collisions mean longer chains and slower lookups.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'hashing', to: 'visiting' },
    ]),
  );

  // Step 3: Check for existing key
  const existingIdx = bucket.chain.findIndex((e) => e.key === key);
  if (existingIdx >= 0) {
    steps.push(
      step(`Key "${key}" already exists -- update value ${bucket.chain[existingIdx].value} -> ${value}`, [
        { targetId: `chain-${bucketIdx}-${existingIdx}`, property: 'highlight', from: 'default', to: 'updating' },
      ]),
    );
    bucket.chain[existingIdx].value = value;
  } else {
    // AUTOBIOGRAPHY: 'Uh oh, someone else is already living in my bucket! I have to walk down the chain,
    // checking each tenant one by one. This is my weakness — collisions turn my O(1) dream into an O(n) nightmare.'
    // Traverse chain
    for (let i = 0; i < bucket.chain.length; i++) {
      steps.push(
        step(`Check chain[${i}]: key="${bucket.chain[i].key}" -- not a match`, [
          { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
        ]),
      );
    }

    steps.push(
      step(`Append ("${key}", ${value}) to bucket[${bucketIdx}] chain`, [
        { targetId: `chain-${bucketIdx}-${bucket.chain.length}`, property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    bucket.chain.push({ key, value });
    copy.size++;
  }

  // AUTOBIOGRAPHY: 'Done! I keep an eye on my load factor — when it gets too high (above 0.75), I know I need to
  // resize and rehash everything. More buckets means shorter chains, and shorter chains mean I stay close to O(1).'
  steps.push(
    step(`Insert complete. Size: ${copy.size}, Load factor: ${(copy.size / copy.capacity).toFixed(2)}`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'visiting', to: 'done' },
    ]),
  );

  return { steps, snapshot: copy };
}

// ── Search ──────────────────────────────────────────────────

export function hashSearch(
  table: HashTableState,
  key: string,
): DSResult<HashTableState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  // AUTOBIOGRAPHY: 'Someone is looking for a key, and I know exactly which bucket to check. I hash the key,
  // walk straight to the bucket, and scan the chain. If no one is home, I know for certain: it was never here.'
  const bucketIdx = simpleHash(key, table.capacity);
  steps.push(
    step(`hash("${key}") = ${bucketIdx}. The hash function maps the key directly to a bucket — this is why hash table lookup is O(1) on average.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  const bucket = table.buckets[bucketIdx];
  steps.push(
    step(`Check bucket[${bucketIdx}] (chain length: ${bucket.chain.length}). We only search within this bucket's chain, not the entire table — the hash narrows our search space.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'hashing', to: 'visiting' },
    ]),
  );

  for (let i = 0; i < bucket.chain.length; i++) {
    const entry = bucket.chain[i];
    steps.push(
      step(`Compare chain[${i}]: key="${entry.key}" with "${key}"`, [
        { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (entry.key === key) {
      steps.push(
        step(`Found! "${key}" => ${entry.value}`, [
          { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'comparing', to: 'found' },
        ]),
      );
      return { steps, snapshot: table };
    }

    steps.push(
      step(`"${entry.key}" != "${key}", continue`, [
        { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'comparing', to: 'visited' },
      ]),
    );
  }

  steps.push(step(`Key "${key}" not found`, []));
  return { steps, snapshot: table };
}

// ── Delete ──────────────────────────────────────────────────

export function hashDelete(
  table: HashTableState,
  key: string,
): DSResult<HashTableState> {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const copy = cloneTable(table);

  // AUTOBIOGRAPHY: 'Time to evict someone. I hash the key to find the right bucket, then walk the chain to find
  // the exact entry. Once found, I snip it out of the chain — like removing a link from a necklace. Quick and clean.'
  const bucketIdx = simpleHash(key, copy.capacity);
  steps.push(
    step(`hash("${key}") = ${bucketIdx}. To delete, we first hash the key to find its bucket — same O(1) lookup path as insert and search.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  const bucket = copy.buckets[bucketIdx];
  steps.push(
    step(`Check bucket[${bucketIdx}] (chain length: ${bucket.chain.length}). We walk the chain to find the exact key — deletion in a chain is O(1) once found, just remove the link.`, [
      { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'hashing', to: 'visiting' },
    ]),
  );

  for (let i = 0; i < bucket.chain.length; i++) {
    const entry = bucket.chain[i];
    steps.push(
      step(`Compare chain[${i}]: key="${entry.key}" with "${key}"`, [
        { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );

    if (entry.key === key) {
      steps.push(
        step(`Found "${key}" -- removing from chain`, [
          { targetId: `chain-${bucketIdx}-${i}`, property: 'highlight', from: 'comparing', to: 'deleting' },
        ]),
      );
      bucket.chain.splice(i, 1);
      copy.size--;
      steps.push(
        step(`Deleted "${key}". Size: ${copy.size}`, [
          { targetId: `bucket-${bucketIdx}`, property: 'highlight', from: 'visiting', to: 'done' },
        ]),
      );
      return { steps, snapshot: copy };
    }
  }

  steps.push(step(`Key "${key}" not found -- nothing to delete`, []));
  return { steps, snapshot: copy };
}
