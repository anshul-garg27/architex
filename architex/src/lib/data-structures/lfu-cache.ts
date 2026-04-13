// -----------------------------------------------------------------
// Architex -- LFU Cache Data Structure  (DST-133)
// -----------------------------------------------------------------
// Least Frequently Used cache evicts the entry with the lowest access
// frequency. On ties, evicts the least recently used among the least
// frequent. Used by Redis (volatile-lfu / allkeys-lfu), CDN edge caches,
// and database buffer pools.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface LFUEntry {
  key: string;
  value: number;
  freq: number;
}

export interface LFUCacheState {
  capacity: number;
  size: number;
  minFreq: number;
  entries: Map<string, LFUEntry>;
  freqBuckets: Map<number, string[]>; // freq → list of keys (ordered by recency, oldest first)
}

// ── Factory + Clone ────────────────────────────────────────

export function createLFUCache(capacity: number = 4): LFUCacheState {
  return {
    capacity: Math.max(1, capacity),
    size: 0,
    minFreq: 0,
    entries: new Map(),
    freqBuckets: new Map(),
  };
}

function cloneLFUCache(state: LFUCacheState): LFUCacheState {
  const clonedEntries = new Map<string, LFUEntry>();
  state.entries.forEach((v, k) => {
    clonedEntries.set(k, { ...v });
  });
  const clonedBuckets = new Map<number, string[]>();
  state.freqBuckets.forEach((keys, freq) => {
    clonedBuckets.set(freq, [...keys]);
  });
  return {
    ...state,
    entries: clonedEntries,
    freqBuckets: clonedBuckets,
  };
}

// ── Internal helpers ──────────────────────────────────────

/** Increment an entry's frequency and move it to the new freq bucket. */
function incrementFreq(state: LFUCacheState, entry: LFUEntry): void {
  const oldFreq = entry.freq;
  const oldBucket = state.freqBuckets.get(oldFreq);
  if (oldBucket) {
    const idx = oldBucket.indexOf(entry.key);
    if (idx !== -1) oldBucket.splice(idx, 1);
    if (oldBucket.length === 0) {
      state.freqBuckets.delete(oldFreq);
      // If we emptied the minFreq bucket, bump minFreq up
      if (state.minFreq === oldFreq) {
        state.minFreq = oldFreq + 1;
      }
    }
  }

  entry.freq = oldFreq + 1;
  const newBucket = state.freqBuckets.get(entry.freq) ?? [];
  newBucket.push(entry.key); // most recent goes to end
  state.freqBuckets.set(entry.freq, newBucket);
}

/** Evict the least frequently used entry; on ties the least recently used. */
function evictLFU(state: LFUCacheState): LFUEntry | null {
  const minBucket = state.freqBuckets.get(state.minFreq);
  if (!minBucket || minBucket.length === 0) return null;

  // The first key in the bucket is the oldest (LRU among least frequent)
  const evictKey = minBucket.shift()!;
  if (minBucket.length === 0) {
    state.freqBuckets.delete(state.minFreq);
  }

  const entry = state.entries.get(evictKey);
  if (!entry) return null;
  state.entries.delete(evictKey);
  state.size--;
  return entry;
}

/** Collect a frequency distribution summary for step descriptions. */
function freqSummary(state: LFUCacheState): string {
  const parts: string[] = [];
  const sortedFreqs = Array.from(state.freqBuckets.keys()).sort((a, b) => a - b);
  for (const freq of sortedFreqs) {
    const keys = state.freqBuckets.get(freq);
    if (keys && keys.length > 0) {
      parts.push(`freq-${freq}: [${keys.join(', ')}]`);
    }
  }
  return parts.length > 0 ? parts.join(' | ') : '(empty)';
}

// ── lfuGet ───────────────────────────────────────────────

export function lfuGet(state: LFUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLFUCache(state);

  steps.push(
    step(
      `GET '${key}' -- Looking up key '${key}' in the entries map. LFU tracks access frequency for every entry so it can evict the one used LEAST often.`,
      [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const entry = s.entries.get(key);

  if (!entry) {
    steps.push(
      step(
        `Key '${key}' NOT FOUND in the cache. Cache miss -- the caller must fetch from the original source and potentially lfuPut it.`,
        [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  const oldFreq = entry.freq;
  incrementFreq(s, entry);

  steps.push(
    step(
      `Found '${key}' with value ${entry.value}. Incrementing frequency from ${oldFreq} to ${entry.freq} and moving to freq-${entry.freq} bucket. LFU always evicts the entry used LEAST often -- if '${key}' has been accessed ${entry.freq} times and another entry only once, that other entry gets evicted first.`,
      [
        { targetId: `lfu-${key}`, property: 'highlight', from: 'default', to: 'found' },
        { targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'found' },
        { targetId: `lfu-freq-${key}`, property: 'freq', from: oldFreq, to: entry.freq },
      ],
    ),
  );

  steps.push(
    step(
      `GET complete. MinFreq: ${s.minFreq}. Buckets: ${freqSummary(s)}`,
      [{ targetId: `lfu-${key}`, property: 'highlight', from: 'found', to: 'done' }],
    ),
  );

  return { steps, snapshot: s };
}

// ── lfuPut ───────────────────────────────────────────────

export function lfuPut(state: LFUCacheState, key: string, value: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLFUCache(state);

  steps.push(
    step(
      `PUT '${key}' = ${value} -- Check if '${key}' already exists in the cache. This O(1) lookup determines whether we update or insert.`,
      [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const existing = s.entries.get(key);

  // ── Update existing key ──
  if (existing) {
    const oldValue = existing.value;
    const oldFreq = existing.freq;
    existing.value = value;
    incrementFreq(s, existing);

    steps.push(
      step(
        `Key '${key}' already exists. Updating value from ${oldValue} to ${value} and incrementing frequency from ${oldFreq} to ${existing.freq}. Moving to freq-${existing.freq} bucket.`,
        [
          { targetId: `lfu-${key}`, property: 'value', from: oldValue, to: value },
          { targetId: `lfu-${key}`, property: 'highlight', from: 'default', to: 'shifting' },
          { targetId: `lfu-freq-${key}`, property: 'freq', from: oldFreq, to: existing.freq },
        ],
      ),
    );

    steps.push(
      step(
        `Update complete. Size: ${s.size}/${s.capacity}. MinFreq: ${s.minFreq}. Buckets: ${freqSummary(s)}`,
        [{ targetId: `lfu-${key}`, property: 'highlight', from: 'shifting', to: 'done' }],
      ),
    );

    return { steps, snapshot: s };
  }

  // ── Eviction if at capacity ──
  if (s.size >= s.capacity) {
    const minBucket = s.freqBuckets.get(s.minFreq);
    const evictCandidate = minBucket && minBucket.length > 0 ? minBucket[0] : '?';
    const evictEntry = s.entries.get(evictCandidate);
    const evictFreq = evictEntry?.freq ?? 0;
    const evictValue = evictEntry?.value ?? 0;

    steps.push(
      step(
        `Cache is full (${s.size}/${s.capacity}). Must evict the LEAST frequently used entry. MinFreq is ${s.minFreq}, so we evict '${evictCandidate}' (freq=${evictFreq}, value=${evictValue}) -- the oldest entry in the lowest-frequency bucket. This is the key difference from LRU: LFU tracks HOW OFTEN each entry is accessed, not just WHEN.`,
        [
          { targetId: `lfu-${evictCandidate}`, property: 'highlight', from: 'default', to: 'deleting' },
          { targetId: `lfu-map-${evictCandidate}`, property: 'highlight', from: 'default', to: 'deleting' },
        ],
      ),
    );

    const evicted = evictLFU(s);

    if (evicted) {
      steps.push(
        step(
          `Evicted '${evicted.key}' (freq=${evicted.freq}). Removed from both entries map and freq-${evicted.freq} bucket.`,
          [],
        ),
      );
    }
  }

  // ── Insert new key ──
  const newEntry: LFUEntry = { key, value, freq: 1 };
  s.entries.set(key, newEntry);

  const bucket1 = s.freqBuckets.get(1) ?? [];
  bucket1.push(key);
  s.freqBuckets.set(1, bucket1);

  s.size++;
  s.minFreq = 1; // New entry always has freq=1, so minFreq resets to 1

  steps.push(
    step(
      `Inserting '${key}' = ${value} with freq=1. New entries always start at frequency 1, so minFreq resets to 1. This means the next eviction will target freq-1 entries first.`,
      [
        { targetId: `lfu-${key}`, property: 'highlight', from: 'default', to: 'inserting' },
        { targetId: `lfu-map-${key}`, property: 'highlight', from: 'default', to: 'inserting' },
      ],
    ),
  );

  steps.push(
    step(
      `Insert complete. Size: ${s.size}/${s.capacity}. MinFreq: ${s.minFreq}. Buckets: ${freqSummary(s)}`,
      [
        { targetId: `lfu-${key}`, property: 'highlight', from: 'inserting', to: 'done' },
        { targetId: `lfu-map-${key}`, property: 'highlight', from: 'inserting', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: s };
}

// ── lfuDelete ────────────────────────────────────────────

export function lfuDelete(state: LFUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLFUCache(state);

  steps.push(
    step(
      `DELETE '${key}' -- Look up '${key}' in the entries map to find it in O(1).`,
      [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const entry = s.entries.get(key);

  if (!entry) {
    steps.push(
      step(
        `Key '${key}' not found in cache -- nothing to delete.`,
        [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  const freq = entry.freq;

  steps.push(
    step(
      `Found '${key}' (value=${entry.value}, freq=${freq}). Removing from freq-${freq} bucket and entries map.`,
      [
        { targetId: `lfu-${key}`, property: 'highlight', from: 'default', to: 'deleting' },
        { targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'deleting' },
      ],
    ),
  );

  // Remove from freq bucket
  const bucket = s.freqBuckets.get(freq);
  if (bucket) {
    const idx = bucket.indexOf(key);
    if (idx !== -1) bucket.splice(idx, 1);
    if (bucket.length === 0) {
      s.freqBuckets.delete(freq);
      // Update minFreq if we emptied the minFreq bucket
      if (s.minFreq === freq) {
        if (s.size <= 1) {
          s.minFreq = 0;
        } else {
          // Find next minimum freq
          const remaining = Array.from(s.freqBuckets.keys());
          s.minFreq = remaining.length > 0 ? Math.min(...remaining) : 0;
        }
      }
    }
  }

  s.entries.delete(key);
  s.size--;

  steps.push(
    step(
      `Delete complete. Removed '${key}' from entries map and freq-${freq} bucket. Size: ${s.size}/${s.capacity}. MinFreq: ${s.minFreq}. Buckets: ${freqSummary(s)}`,
      [],
    ),
  );

  return { steps, snapshot: s };
}

// ── lfuPeek ──────────────────────────────────────────────

export function lfuPeek(state: LFUCacheState, key: string): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneLFUCache(state);

  steps.push(
    step(
      `PEEK '${key}' -- Looking up key '${key}' WITHOUT incrementing its frequency. Peek is a read-only operation that does not affect eviction order.`,
      [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'default', to: 'comparing' }],
    ),
  );

  const entry = s.entries.get(key);

  if (!entry) {
    steps.push(
      step(
        `Key '${key}' NOT FOUND in the cache. Cache miss on peek.`,
        [{ targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'miss' }],
      ),
    );
    return { steps, snapshot: s };
  }

  steps.push(
    step(
      `Found! Key '${key}' has value ${entry.value} with freq=${entry.freq}. Unlike GET, we do NOT increment the frequency -- peek preserves the current eviction order. Buckets: ${freqSummary(s)}`,
      [
        { targetId: `lfu-${key}`, property: 'highlight', from: 'default', to: 'found' },
        { targetId: `lfu-map-${key}`, property: 'highlight', from: 'comparing', to: 'found' },
      ],
    ),
  );

  return { steps, snapshot: s };
}
