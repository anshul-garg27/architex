// -----------------------------------------------------------------
// Architex -- LRU Cache Simulation with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const LRU_CACHE_CONFIG: AlgorithmConfig = {
  id: 'lru-cache',
  name: 'LRU Cache',
  category: 'sorting',
  timeComplexity: { best: 'O(1)', average: 'O(1)', worst: 'O(1)' },
  spaceComplexity: 'O(capacity)',
  stable: false,
  inPlace: false,
  description:
    'Your browser cache holds the last N pages. When full, which page gets evicted? The Least Recently Used one. An LRU Cache combines a hash map (O(1) lookup) with a doubly-linked list (O(1) removal/insertion). Every access moves the item to the front. When capacity is exceeded, the tail (least recently used) is evicted. Used in: browser caches, database buffer pools, CPU cache replacement, Redis eviction policy.',
  pseudocode: [
    'class LRUCache(capacity)',
    '  map = new HashMap()',
    '  list = new DoublyLinkedList()',
    '',
    '  procedure get(key)',
    '    if key in map then',
    '      move map[key] to front of list',
    '      return map[key].value',
    '    return -1  // cache miss',
    '',
    '  procedure put(key, value)',
    '    if key in map then',
    '      update map[key].value',
    '      move map[key] to front of list',
    '    else',
    '      if list.size == capacity then',
    '        evict tail (least recently used)',
    '      insert (key, value) at front',
    '      map[key] = new node',
  ],
};

/** Operation types for the LRU cache simulation. */
export type LRUOperation =
  | { type: 'get'; key: number }
  | { type: 'put'; key: number; value: string };

/** Default capacity and operations. */
export const LRU_CACHE_CAPACITY = 3;
export const LRU_CACHE_DEFAULT_OPS: LRUOperation[] = [
  { type: 'get', key: 1 },
  { type: 'put', key: 1, value: 'A' },
  { type: 'put', key: 2, value: 'B' },
  { type: 'put', key: 3, value: 'C' },
  { type: 'get', key: 2 },
  { type: 'put', key: 4, value: 'D' },
];

/**
 * Simulate an LRU Cache operating on a sequence of get/put operations.
 * The visualizer uses the array representation to show the cache state,
 * where index 0 = most recently used and the last index = least recently used.
 *
 * The input `arr` parameter is unused (kept for SORTING_RUNNERS compatibility).
 * We use the default operations instead.
 */
export function lruCache(arr: number[]): AlgorithmResult {
  const capacity = LRU_CACHE_CAPACITY;
  const ops = LRU_CACHE_DEFAULT_OPS;

  // Cache state: ordered list of { key, value } from MRU to LRU
  const cache: { key: number; value: string }[] = [];
  const map = new Map<number, string>();

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let writes = 0;

  // Initial overview step
  steps.push({
    id: stepId++,
    description:
      `LRU Cache with capacity ${capacity}. Operations: ${ops.map(op => op.type === 'get' ? `get(${op.key})` : `put(${op.key},'${op.value}')`).join(', ')}. The cache is empty.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 700,
  });

  for (let opIdx = 0; opIdx < ops.length; opIdx++) {
    const op = ops[opIdx];

    if (op.type === 'get') {
      reads++;
      const exists = map.has(op.key);

      if (exists) {
        // Cache hit: move to front
        const cacheIdx = cache.findIndex(e => e.key === op.key);
        const entry = cache.splice(cacheIdx, 1)[0];
        cache.unshift(entry);

        // Highlight the accessed element then move to front
        const hitMutations: VisualMutation[] = [];

        // Highlight the hit position
        if (cacheIdx < capacity) {
          hitMutations.push({
            targetId: `element-${cacheIdx}`,
            property: 'highlight',
            from: 'default',
            to: 'found',
            easing: 'spring',
          });
        }

        // Show movement to front
        for (let i = 0; i < cache.length; i++) {
          hitMutations.push({
            targetId: `element-${i}`,
            property: 'highlight',
            from: i === 0 ? 'found' : 'default',
            to: i === 0 ? 'active' : 'default',
            easing: 'ease-out',
          });
        }

        steps.push({
          id: stepId++,
          description:
            `get(${op.key}): Cache HIT! Found key ${op.key} = '${entry.value}' at position ${cacheIdx}. Move it to the front (most recently used). Cache: [${cache.map(e => `${e.key}:'${e.value}'`).join(', ')}].`,
          pseudocodeLine: 5,
          mutations: hitMutations,
          complexity: { comparisons: 0, swaps: 0, reads, writes },
          duration: 500,
        });
      } else {
        // Cache miss
        steps.push({
          id: stepId++,
          description:
            `get(${op.key}): Cache MISS. Key ${op.key} is not in the cache. Returns -1. Cache unchanged: [${cache.length > 0 ? cache.map(e => `${e.key}:'${e.value}'`).join(', ') : 'empty'}].`,
          pseudocodeLine: 8,
          mutations: cache.length > 0
            ? cache.map((_, i) => ({
                targetId: `element-${i}`,
                property: 'highlight' as const,
                from: 'default' as const,
                to: 'sorted' as const,
                easing: 'ease-out' as const,
              }))
            : [],
          complexity: { comparisons: 0, swaps: 0, reads, writes },
          duration: 450,
        });

        // Reset highlights after miss
        if (cache.length > 0) {
          steps.push({
            id: stepId++,
            description:
              `No match found for key ${op.key}. Moving on.`,
            pseudocodeLine: 8,
            mutations: cache.map((_, i) => ({
              targetId: `element-${i}`,
              property: 'highlight' as const,
              from: 'sorted' as const,
              to: 'default' as const,
              easing: 'ease-out' as const,
            })),
            complexity: { comparisons: 0, swaps: 0, reads, writes },
            duration: 300,
          });
        }
      }
    } else {
      // PUT operation
      writes++;
      const exists = map.has(op.key);

      if (exists) {
        // Update existing: move to front with new value
        const cacheIdx = cache.findIndex(e => e.key === op.key);
        cache.splice(cacheIdx, 1);
        cache.unshift({ key: op.key, value: op.value });
        map.set(op.key, op.value);

        const updateMutations: VisualMutation[] = [];
        for (let i = 0; i < cache.length; i++) {
          updateMutations.push({
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'default',
            to: i === 0 ? 'active' : 'default',
            easing: 'ease-out',
          });
        }

        steps.push({
          id: stepId++,
          description:
            `put(${op.key}, '${op.value}'): Key ${op.key} already exists. Update value to '${op.value}' and move to front. Cache: [${cache.map(e => `${e.key}:'${e.value}'`).join(', ')}].`,
          pseudocodeLine: 11,
          mutations: updateMutations,
          complexity: { comparisons: 0, swaps: 0, reads, writes },
          duration: 450,
        });
      } else {
        // New entry
        let evicted: { key: number; value: string } | null = null;

        if (cache.length >= capacity) {
          // Evict LRU (tail)
          evicted = cache.pop()!;
          map.delete(evicted.key);

          // Highlight the element about to be evicted
          const evictMutations: VisualMutation[] = [{
            targetId: `element-${cache.length}`,
            property: 'highlight',
            from: 'default',
            to: 'pivot',
            easing: 'spring',
          }];

          steps.push({
            id: stepId++,
            description:
              `put(${op.key}, '${op.value}'): Cache is FULL (${capacity}/${capacity}). Evicting least recently used: key ${evicted.key} = '${evicted.value}' (tail of the list).`,
            pseudocodeLine: 15,
            mutations: evictMutations,
            complexity: { comparisons: 0, swaps: 0, reads, writes },
            duration: 500,
          });
        }

        // Insert new entry at front
        cache.unshift({ key: op.key, value: op.value });
        map.set(op.key, op.value);

        const insertMutations: VisualMutation[] = [];
        for (let i = 0; i < cache.length; i++) {
          insertMutations.push({
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'default',
            to: i === 0 ? 'active' : 'default',
            easing: i === 0 ? 'spring' : 'ease-out',
          });
        }

        const evictNote = evicted
          ? ` Evicted ${evicted.key}:'${evicted.value}'.`
          : '';

        steps.push({
          id: stepId++,
          description:
            `put(${op.key}, '${op.value}'): Insert at front.${evictNote} Cache (${cache.length}/${capacity}): [${cache.map(e => `${e.key}:'${e.value}'`).join(', ')}].`,
          pseudocodeLine: 17,
          mutations: insertMutations,
          complexity: { comparisons: 0, swaps: 0, reads, writes },
          duration: 450,
        });
      }
    }
  }

  // Final step: show final cache state
  const finalMutations: VisualMutation[] = cache.map((_, i) => ({
    targetId: `element-${i}`,
    property: 'highlight' as const,
    from: 'default' as const,
    to: 'sorted' as const,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description:
      `Done! Final cache state (MRU -> LRU): [${cache.map(e => `${e.key}:'${e.value}'`).join(', ')}]. All operations were O(1) thanks to the hash map + doubly-linked list combo.`,
    pseudocodeLine: 18,
    mutations: finalMutations,
    complexity: { comparisons: 0, swaps: 0, reads, writes },
    duration: 600,
  });

  // Return cache keys as the final state array
  return {
    config: LRU_CACHE_CONFIG,
    steps,
    finalState: cache.map(e => e.key),
  };
}
