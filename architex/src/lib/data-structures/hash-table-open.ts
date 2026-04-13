// -----------------------------------------------------------------
// Architex -- Open Addressing Hash Table  (DST-128)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// Open addressing stores all entries directly in the slot array — no chains, no pointers.
// When a collision occurs, the strategy probes alternative slots until finding an empty one.
// This gives better cache locality than chaining but is more sensitive to load factor.

// ── Types ──────────────────────────────────────────────────

export type ProbingStrategy = 'linear' | 'quadratic' | 'double';

export interface OASlot {
  key: string;
  value: number;
  deleted: boolean;
}

export interface OpenAddressingState {
  slots: (OASlot | null)[];
  capacity: number;
  size: number;
  strategy: ProbingStrategy;
}

// ── Hash Functions ─────────────────────────────────────────

/** Primary hash function (multiplicative hashing, prime 31). */
function hash1(key: string, capacity: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % capacity;
  }
  return Math.abs(h);
}

/** Secondary hash function for double hashing (different prime base).
 * WHY a different prime: Double hashing needs two independent hash functions
 * so the probe sequence covers the entire table. Using the same function would
 * just probe the same slot forever. The secondary hash must never return 0
 * (or probing stalls), so we use (result % (capacity - 1)) + 1.
 */
function hash2(key: string, capacity: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 37 + key.charCodeAt(i)) % capacity;
  }
  // Must be >= 1 to avoid infinite loop; (capacity - 1) keeps it within bounds
  return Math.abs(h % (capacity - 1)) + 1;
}

// ── Probe Function ─────────────────────────────────────────

// WHY three strategies: Each probing strategy makes a different trade-off.
// Linear probing is cache-friendly but causes primary clustering (long runs of
// occupied slots). Quadratic probing avoids primary clustering but can miss
// slots if capacity is not prime. Double hashing avoids both clustering types
// but requires a second hash computation — the gold standard for open addressing.
function probe(
  key: string,
  attempt: number,
  capacity: number,
  strategy: ProbingStrategy,
): number {
  const h1 = hash1(key, capacity);
  switch (strategy) {
    case 'linear':
      return (h1 + attempt) % capacity;
    case 'quadratic':
      return (h1 + attempt * attempt) % capacity;
    case 'double': {
      const h2 = hash2(key, capacity);
      return (h1 + attempt * h2) % capacity;
    }
  }
}

// ── Helpers ────────────────────────────────────────────────

export function createOAHashTable(
  capacity: number = 11,
  strategy: ProbingStrategy = 'linear',
): OpenAddressingState {
  return {
    slots: Array(capacity).fill(null),
    capacity,
    size: 0,
    strategy,
  };
}

function cloneOA(state: OpenAddressingState): OpenAddressingState {
  return {
    ...state,
    slots: state.slots.map((s) => (s ? { ...s } : null)),
  };
}

function strategyName(strategy: ProbingStrategy): string {
  switch (strategy) {
    case 'linear':
      return 'Linear probing (h1 + i)';
    case 'quadratic':
      return 'Quadratic probing (h1 + i\u00B2)';
    case 'double':
      return 'Double hashing (h1 + i * h2)';
  }
}

function clusteringNote(strategy: ProbingStrategy): string {
  switch (strategy) {
    case 'linear':
      return 'This is why linear probing causes clustering: occupied slots tend to group together, making future insertions slower.';
    case 'quadratic':
      return 'Quadratic probing jumps by increasing squares, avoiding the primary clustering that plagues linear probing.';
    case 'double':
      return 'Double hashing uses a second hash to compute the step size, producing a unique probe sequence per key and avoiding both primary and secondary clustering.';
  }
}

// ── Insert ─────────────────────────────────────────────────

export function oaInsert(
  state: OpenAddressingState,
  key: string,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneOA(state);

  if (s.size >= s.capacity) {
    steps.push(
      step(`Table is full (${s.size}/${s.capacity}). Cannot insert '${key}' -- rehash needed to grow the table.`, []),
    );
    return { steps, snapshot: s };
  }

  const h1 = hash1(key, s.capacity);

  steps.push(
    step(`hash('${key}') = ${h1}. Strategy: ${strategyName(s.strategy)}. We probe from slot ${h1} until we find an empty or deleted slot.`, [
      { targetId: `oa-${h1}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  for (let attempt = 0; attempt < s.capacity; attempt++) {
    const idx = probe(key, attempt, s.capacity, s.strategy);
    const slot = s.slots[idx];

    if (slot !== null && !slot.deleted && slot.key === key) {
      // Key already exists -- update value
      steps.push(
        step(`Slot ${idx} contains '${key}' -- update value ${slot.value} -> ${value}.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'updating' },
        ]),
      );
      slot.value = value;
      steps.push(
        step(`Update complete. Size: ${s.size}, load factor: ${(s.size / s.capacity).toFixed(2)}.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'updating', to: 'done' },
        ]),
      );
      return { steps, snapshot: s };
    }

    if (slot === null || slot.deleted) {
      // Empty or tombstone -- insert here
      if (attempt > 0) {
        steps.push(
          step(`Slot ${idx} is ${slot === null ? 'empty' : 'a tombstone (deleted)'} -- insert '${key}' = ${value} here after ${attempt} probe(s). ${clusteringNote(s.strategy)}`, [
            { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'inserting' },
          ]),
        );
      } else {
        steps.push(
          step(`Slot ${idx} is empty -- no collision! Insert '${key}' = ${value} directly. Best case: O(1) with no probing needed.`, [
            { targetId: `oa-${idx}`, property: 'highlight', from: 'hashing', to: 'inserting' },
          ]),
        );
      }
      s.slots[idx] = { key, value, deleted: false };
      s.size++;
      steps.push(
        step(`Insert complete. Size: ${s.size}, load factor: ${(s.size / s.capacity).toFixed(2)}. High load factors (> 0.7) degrade performance sharply with open addressing -- resize before that.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'inserting', to: 'done' },
        ]),
      );
      return { steps, snapshot: s };
    }

    // Occupied by a different key -- probe further
    steps.push(
      step(`Slot ${idx} is occupied by '${slot.key}'. ${s.strategy === 'linear' ? `Linear probing: try slot ${probe(key, attempt + 1, s.capacity, s.strategy)}.` : s.strategy === 'quadratic' ? `Quadratic probing: next offset = ${(attempt + 1) * (attempt + 1)}, try slot ${probe(key, attempt + 1, s.capacity, s.strategy)}.` : `Double hashing: step = hash2('${key}') = ${hash2(key, s.capacity)}, try slot ${probe(key, attempt + 1, s.capacity, s.strategy)}.`}`, [
        { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
  }

  steps.push(
    step(`All ${s.capacity} slots probed -- table is full. Rehash needed.`, []),
  );

  return { steps, snapshot: s };
}

// ── Search ─────────────────────────────────────────────────

export function oaSearch(
  state: OpenAddressingState,
  key: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneOA(state);

  const h1 = hash1(key, s.capacity);

  steps.push(
    step(`Search for '${key}'. hash('${key}') = ${h1}. Strategy: ${strategyName(s.strategy)}. We probe from slot ${h1}, skipping tombstones, until we find the key or hit a null slot.`, [
      { targetId: `oa-${h1}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  for (let attempt = 0; attempt < s.capacity; attempt++) {
    const idx = probe(key, attempt, s.capacity, s.strategy);
    const slot = s.slots[idx];

    if (slot === null) {
      // Null slot means key was never inserted (or was deleted and slot reclaimed)
      steps.push(
        step(`Slot ${idx} is null -- search terminates. '${key}' is not in the table. A null slot is a hard stop: it proves no probe sequence ever placed the key beyond this point.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'not-found' },
        ]),
      );
      return { steps, snapshot: s };
    }

    if (slot.deleted) {
      // Tombstone -- skip but keep probing
      // WHY we cannot stop at tombstones: If we stopped at a deleted slot, we might miss
      // a key that was inserted before the deletion. The tombstone preserves the probe chain.
      steps.push(
        step(`Slot ${idx} is a tombstone (deleted). Skip it but keep probing -- tombstones preserve the probe chain so we do not lose keys inserted after this slot was occupied.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      continue;
    }

    if (slot.key === key) {
      steps.push(
        step(`Found '${key}' = ${slot.value} at slot ${idx} after ${attempt} probe(s). ${attempt === 0 ? 'Direct hit -- O(1)!' : `${attempt} collision(s) resolved by ${s.strategy} probing.`}`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'found' },
        ]),
      );
      return { steps, snapshot: s };
    }

    // Different key -- keep probing
    steps.push(
      step(`Slot ${idx} contains '${slot.key}' -- not a match. Continue probing.`, [
        { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
  }

  steps.push(
    step(`All ${s.capacity} slots probed -- '${key}' not found.`, []),
  );

  return { steps, snapshot: s };
}

// ── Delete ─────────────────────────────────────────────────

// WHY tombstone deletion: We cannot simply null out a deleted slot because that
// would break probe chains. If key A was inserted, then key B collided and probed
// past A's slot, nulling A would make B unreachable. Instead, we mark A as "deleted"
// (a tombstone). Searches skip tombstones, and inserts can reuse them. The downside
// is that too many tombstones degrade performance -- periodic rehashing cleans them up.
export function oaDelete(
  state: OpenAddressingState,
  key: string,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneOA(state);

  const h1 = hash1(key, s.capacity);

  steps.push(
    step(`Delete '${key}'. hash('${key}') = ${h1}. Probe from slot ${h1} to find the key, then mark it as a tombstone (not null -- that would break probe chains).`, [
      { targetId: `oa-${h1}`, property: 'highlight', from: 'default', to: 'hashing' },
    ]),
  );

  for (let attempt = 0; attempt < s.capacity; attempt++) {
    const idx = probe(key, attempt, s.capacity, s.strategy);
    const slot = s.slots[idx];

    if (slot === null) {
      steps.push(
        step(`Slot ${idx} is null -- '${key}' not found. Nothing to delete.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'not-found' },
        ]),
      );
      return { steps, snapshot: s };
    }

    if (slot.deleted) {
      steps.push(
        step(`Slot ${idx} is a tombstone -- skip and continue probing.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'visiting' },
        ]),
      );
      continue;
    }

    if (slot.key === key) {
      steps.push(
        step(`Found '${key}' at slot ${idx}. Mark as tombstone (deleted = true). We do NOT null the slot -- that would sever probe chains and make other keys unreachable.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'deleting' },
        ]),
      );
      slot.deleted = true;
      s.size--;
      steps.push(
        step(`Deleted '${key}'. Size: ${s.size}. Tombstones accumulate over time -- when too many build up, a full rehash compacts the table and reclaims those slots.`, [
          { targetId: `oa-${idx}`, property: 'highlight', from: 'deleting', to: 'done' },
        ]),
      );
      return { steps, snapshot: s };
    }

    // Different key -- keep probing
    steps.push(
      step(`Slot ${idx} contains '${slot.key}' -- not '${key}'. Continue probing.`, [
        { targetId: `oa-${idx}`, property: 'highlight', from: 'default', to: 'comparing' },
      ]),
    );
  }

  steps.push(
    step(`All ${s.capacity} slots probed -- '${key}' not found. Nothing to delete.`, []),
  );

  return { steps, snapshot: s };
}
