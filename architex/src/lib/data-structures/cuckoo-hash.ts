// -----------------------------------------------------------------
// Architex -- Cuckoo Hashing Data Structure  (DST-131)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface CuckooHashState {
  table1: (string | null)[];
  table2: (string | null)[];
  capacity: number;
  size: number;
  maxKicks: number;
}

// ── Hash Functions ─────────────────────────────────────────

/** Primary hash function (multiplicative hashing). */
export function hash1(key: string, capacity: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) % capacity;
  }
  return Math.abs(h);
}

/** Secondary hash function (different prime base). */
export function hash2(key: string, capacity: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 37 + key.charCodeAt(i)) % capacity;
  }
  return Math.abs(h);
}

// ── Helpers ────────────────────────────────────────────────

export function createCuckooHash(capacity: number = 8, maxKicks: number = 10): CuckooHashState {
  return {
    table1: Array(capacity).fill(null),
    table2: Array(capacity).fill(null),
    capacity,
    size: 0,
    maxKicks,
  };
}

function cloneCuckoo(state: CuckooHashState): CuckooHashState {
  return {
    ...state,
    table1: [...state.table1],
    table2: [...state.table2],
  };
}

// ── Operations ─────────────────────────────────────────────

export function cuckooInsert(state: CuckooHashState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCuckoo(state);

  // Check if key already exists
  const idx1 = hash1(key, s.capacity);
  const idx2 = hash2(key, s.capacity);

  if (s.table1[idx1] === key) {
    steps.push(
      step(`Key '${key}' already exists in table1[${idx1}] -- skip insert`, [
        { targetId: `t1-${idx1}`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }
  if (s.table2[idx2] === key) {
    steps.push(
      step(`Key '${key}' already exists in table2[${idx2}] -- skip insert`, [
        { targetId: `t2-${idx2}`, property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Inserting '${key}'. hash1('${key}') = ${idx1}, hash2('${key}') = ${idx2}`, [
      { targetId: `t1-${idx1}`, property: 'highlight', from: 'default', to: 'targeting' },
      { targetId: `t2-${idx2}`, property: 'highlight', from: 'default', to: 'targeting' },
    ]),
  );

  // Try table1 first
  if (s.table1[idx1] === null) {
    s.table1[idx1] = key;
    s.size++;
    steps.push(
      step(`table1[${idx1}] is empty. Place '${key}' directly. Done!`, [
        { targetId: `t1-${idx1}`, property: 'highlight', from: 'targeting', to: 'done' },
      ]),
    );
    return { steps, snapshot: s };
  }

  // Slot occupied -- begin cuckoo displacement chain
  let current = key;
  let useTable1 = true;

  for (let kick = 0; kick < s.maxKicks; kick++) {
    if (useTable1) {
      const slot = hash1(current, s.capacity);
      const displaced = s.table1[slot];

      if (displaced === null) {
        s.table1[slot] = current;
        s.size++;
        steps.push(
          step(`table1[${slot}] is empty. Place '${current}'. Chain resolved after ${kick + 1} displacement(s)! This 'cuckoo' displacement is why lookups are always O(1) worst-case -- every key is in exactly one of two positions.`, [
            { targetId: `t1-${slot}`, property: 'highlight', from: 'default', to: 'done' },
          ]),
        );
        return { steps, snapshot: s };
      }

      // Displace existing element
      steps.push(
        step(`Inserting '${current}'. hash1('${current}') = ${slot} -> table1[${slot}] is occupied by '${displaced}'. Displace '${displaced}' to table2.`, [
          { targetId: `t1-${slot}`, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
      s.table1[slot] = current;
      current = displaced;
      useTable1 = false;
    } else {
      const slot = hash2(current, s.capacity);
      const displaced = s.table2[slot];

      if (displaced === null) {
        s.table2[slot] = current;
        s.size++;
        steps.push(
          step(`table2[${slot}] is empty. Place '${current}'. Chain resolved after ${kick + 1} displacement(s)! This 'cuckoo' displacement is why lookups are always O(1) worst-case -- every key is in exactly one of two positions.`, [
            { targetId: `t2-${slot}`, property: 'highlight', from: 'default', to: 'done' },
          ]),
        );
        return { steps, snapshot: s };
      }

      // Displace existing element
      steps.push(
        step(`Displacing '${current}'. hash2('${current}') = ${slot} -> table2[${slot}] is occupied by '${displaced}'. Displace '${displaced}' to table1.`, [
          { targetId: `t2-${slot}`, property: 'highlight', from: 'default', to: 'shifting' },
        ]),
      );
      s.table2[slot] = current;
      current = displaced;
      useTable1 = true;
    }
  }

  // Cycle detected -- maxKicks exceeded
  steps.push(
    step(`Cycle detected after ${s.maxKicks} displacements! Element '${current}' could not settle. Rehash needed -- grow tables and re-insert all elements with new hash functions.`, []),
  );

  return { steps, snapshot: s };
}

export function cuckooSearch(state: CuckooHashState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCuckoo(state);

  const idx1 = hash1(key, s.capacity);
  const idx2 = hash2(key, s.capacity);

  steps.push(
    step(`Search for '${key}'. O(1) worst-case: check table1[${idx1}] and table2[${idx2}] (only 2 lookups ever needed)`, [
      { targetId: `t1-${idx1}`, property: 'highlight', from: 'default', to: 'comparing' },
      { targetId: `t2-${idx2}`, property: 'highlight', from: 'default', to: 'comparing' },
    ]),
  );

  // Check table1
  if (s.table1[idx1] === key) {
    steps.push(
      step(`Found '${key}' in table1[${idx1}] -- first lookup!`, [
        { targetId: `t1-${idx1}`, property: 'highlight', from: 'comparing', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`table1[${idx1}] = ${s.table1[idx1] === null ? 'empty' : `'${s.table1[idx1]}'`} -- not a match. Check table2.`, [
      { targetId: `t1-${idx1}`, property: 'highlight', from: 'comparing', to: 'default' },
    ]),
  );

  // Check table2
  if (s.table2[idx2] === key) {
    steps.push(
      step(`Found '${key}' in table2[${idx2}] -- second lookup!`, [
        { targetId: `t2-${idx2}`, property: 'highlight', from: 'comparing', to: 'found' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`table2[${idx2}] = ${s.table2[idx2] === null ? 'empty' : `'${s.table2[idx2]}'`} -- not a match. Key '${key}' not found in either table.`, [
      { targetId: `t2-${idx2}`, property: 'highlight', from: 'comparing', to: 'default' },
    ]),
  );

  return { steps, snapshot: s };
}

export function cuckooDelete(state: CuckooHashState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneCuckoo(state);

  const idx1 = hash1(key, s.capacity);
  const idx2 = hash2(key, s.capacity);

  steps.push(
    step(`Delete '${key}'. Check table1[${idx1}] and table2[${idx2}]`, [
      { targetId: `t1-${idx1}`, property: 'highlight', from: 'default', to: 'comparing' },
      { targetId: `t2-${idx2}`, property: 'highlight', from: 'default', to: 'comparing' },
    ]),
  );

  // Check table1
  if (s.table1[idx1] === key) {
    s.table1[idx1] = null;
    s.size--;
    steps.push(
      step(`Found '${key}' in table1[${idx1}] -- removed. Size: ${s.size}`, [
        { targetId: `t1-${idx1}`, property: 'highlight', from: 'comparing', to: 'deleting' },
      ]),
    );
    return { steps, snapshot: s };
  }

  // Check table2
  if (s.table2[idx2] === key) {
    s.table2[idx2] = null;
    s.size--;
    steps.push(
      step(`Found '${key}' in table2[${idx2}] -- removed. Size: ${s.size}`, [
        { targetId: `t2-${idx2}`, property: 'highlight', from: 'comparing', to: 'deleting' },
      ]),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Key '${key}' not found in either table -- nothing to delete`, [
      { targetId: `t1-${idx1}`, property: 'highlight', from: 'comparing', to: 'default' },
      { targetId: `t2-${idx2}`, property: 'highlight', from: 'comparing', to: 'default' },
    ]),
  );

  return { steps, snapshot: s };
}
