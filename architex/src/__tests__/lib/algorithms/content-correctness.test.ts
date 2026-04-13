import { describe, test, expect } from 'vitest';
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
  SEARCH_ALGORITHMS,
  GREEDY_ALGORITHMS,
  PATTERN_ALGORITHMS,
  bubbleSort,
  insertionSort,
  selectionSort,
  mergeSort,
  quickSort,
  heapSort,
  shellSort,
  countingSort,
  radixSort,
  bucketSort,
  timSort,
  cocktailShakerSort,
  combSort,
  pancakeSort,
  bogoSort,
  radixSortMSD,
  binarySearch,
  activitySelection,
  fractionalKnapsack,
  monotonicStack,
  floydCycle,
  twoPointers,
  slidingWindow,
  lruCache,
  mergeSortBottomUp,
  quickSortHoare,
  intervalMerge,
  skipList,
  countMinSketch,
  bloomFilter,
  cosineSimilarity,
  DESIGN_ALGORITHMS,
  PROBABILISTIC_ALGORITHMS,
  VECTOR_SEARCH_ALGORITHMS,
} from '@/lib/algorithms';
import type { AlgorithmResult } from '@/lib/algorithms';

// ── All algorithm configs across every category ─────────────

const ALL_CONFIGS = [
  ...SORTING_ALGORITHMS,
  ...SEARCH_ALGORITHMS,
  ...GREEDY_ALGORITHMS,
  ...GRAPH_ALGORITHMS,
  ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS,
  ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS,
  ...PATTERN_ALGORITHMS,
  ...DESIGN_ALGORITHMS,
];

// ── Sorting runners map (mirrors AlgorithmPanel's SORTING_RUNNERS) ─

const SORTING_RUNNERS: Record<string, (arr: number[]) => AlgorithmResult> = {
  'bubble-sort': bubbleSort,
  'insertion-sort': insertionSort,
  'selection-sort': selectionSort,
  'merge-sort': mergeSort,
  'quick-sort': quickSort,
  'heap-sort': heapSort,
  'shell-sort': shellSort,
  'counting-sort': countingSort,
  'radix-sort': radixSort,
  'bucket-sort': bucketSort,
  'tim-sort': timSort,
  'cocktail-shaker-sort': cocktailShakerSort,
  'comb-sort': combSort,
  'pancake-sort': pancakeSort,
  'bogo-sort': bogoSort,
  'radix-sort-msd': radixSortMSD,
  'binary-search': binarySearch,
  'activity-selection': activitySelection,
  'fractional-knapsack': fractionalKnapsack,
  'monotonic-stack': monotonicStack,
  'floyd-cycle': floydCycle,
  'two-pointers': twoPointers,
  'sliding-window': slidingWindow,
  'lru-cache': lruCache,
  'merge-sort-bottom-up': mergeSortBottomUp,
  'quick-sort-hoare': quickSortHoare,
  'interval-merge': intervalMerge,
  'skip-list': skipList,
  'count-min-sketch': countMinSketch,
  'bloom-filter': bloomFilter,
  'cosine-similarity': cosineSimilarity,
};

// ── Tests ───────────────────────────────────────────────────

describe('Algorithm content correctness', () => {
  test.each(ALL_CONFIGS)('$name has complete config', (config) => {
    expect(config.id).toBeTruthy();
    expect(config.name).toBeTruthy();
    expect(config.category).toBeTruthy();
    expect(config.description.length).toBeGreaterThan(50);
    expect(config.pseudocode.length).toBeGreaterThan(0);
    expect(config.timeComplexity.best).toBeTruthy();
    expect(config.timeComplexity.average).toBeTruthy();
    expect(config.timeComplexity.worst).toBeTruthy();
    expect(config.spaceComplexity).toBeTruthy();
  });

  test.each(ALL_CONFIGS)(
    '$name description starts with hook (not definition)',
    (config) => {
      // A-grade descriptions should NOT start with the algorithm name
      const startsWithName = config.description
        .toLowerCase()
        .startsWith(config.name.toLowerCase());
      // Allow some flexibility but flag textbook-style openings
      expect(startsWithName).toBe(false);
    },
  );

  test('no duplicate algorithm IDs', () => {
    const ids = ALL_CONFIGS.map((c) => c.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe('Sorting runner coverage', () => {
  const sortingLikeConfigs = [
    ...SORTING_ALGORITHMS,
    ...SEARCH_ALGORITHMS,
    ...GREEDY_ALGORITHMS,
    ...PATTERN_ALGORITHMS,
    ...DESIGN_ALGORITHMS,
    ...PROBABILISTIC_ALGORITHMS,
    ...VECTOR_SEARCH_ALGORITHMS.filter(a => a.category === 'sorting'),
  ];

  test.each(sortingLikeConfigs)(
    '$name ($id) has a runner in SORTING_RUNNERS',
    (config) => {
      expect(SORTING_RUNNERS[config.id]).toBeDefined();
    },
  );

  test('every SORTING_RUNNERS key maps to a real config ID', () => {
    const configIds = new Set(sortingLikeConfigs.map((c) => c.id));
    for (const key of Object.keys(SORTING_RUNNERS)) {
      expect(configIds.has(key)).toBe(true);
    }
  });
});
