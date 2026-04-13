// ─────────────────────────────────────────────────────────────
// Architex — Bucket Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'bucket-sort',
  name: 'Bucket Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n^2)' },
  spaceComplexity: 'O(n + k)',
  stable: true,
  inPlace: false,
  description:
    'Distributes elements into buckets based on value range, sorts each bucket using insertion sort, then concatenates all buckets. Performs best when input is uniformly distributed.',
  pseudocode: [
    'procedure bucketSort(A)',
    '  n = length(A)',
    '  maxVal = max(A) + 1',
    '  buckets = n empty lists',
    '  for each x in A do',
    '    idx = floor(n * x / maxVal)',
    '    buckets[idx].append(x)',
    '  for each bucket in buckets do',
    '    insertionSort(bucket)',
    '  A = concatenate(buckets)',
    '  return A',
    '// k = number of buckets',
  ],
};

/** Simple insertion sort for a single bucket. */
function insertionSortBucket(
  bucket: number[],
  counters: { comparisons: number; swaps: number; reads: number; writes: number },
): void {
  for (let i = 1; i < bucket.length; i++) {
    const key = bucket[i];
    counters.reads++;
    let j = i - 1;
    while (j >= 0 && bucket[j] > key) {
      counters.comparisons++;
      counters.reads++;
      bucket[j + 1] = bucket[j];
      counters.writes++;
      counters.swaps++;
      j--;
    }
    if (j >= 0) {
      counters.comparisons++;
      counters.reads++;
    }
    bucket[j + 1] = key;
    counters.writes++;
  }
}

export function bucketSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  const counters = { comparisons, swaps, reads, writes };

  function syncCounters(): void {
    comparisons = counters.comparisons;
    swaps = counters.swaps;
    reads = counters.reads;
    writes = counters.writes;
  }

  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    duration: number,
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration,
      arraySnapshot: [...a],
    });
  }

  // Find max value
  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    reads++;
    if (a[i] > maxVal) maxVal = a[i];
  }
  maxVal += 1; // so the max element maps to last bucket, not out of range
  counters.comparisons = comparisons;
  counters.swaps = swaps;
  counters.reads = reads;
  counters.writes = writes;

  const bucketCount = n;

  addStep(
    `Create ${bucketCount} buckets for range [0..${maxVal - 1}]`,
    3,
    [],
    300,
  );

  // Distribute elements into buckets
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);

  for (let i = 0; i < n; i++) {
    reads++;
    counters.reads++;
    const idx = Math.min(Math.floor((bucketCount * a[i]) / maxVal), bucketCount - 1);
    buckets[idx].push(a[i]);

    const bucketDistDesc = i === 0
      ? `arr[${i}]=${a[i]} → bucket[${idx}]. Bucket Sort distributes elements into ranges — if data is uniformly distributed, each bucket gets roughly the same number of elements.`
      : `arr[${i}]=${a[i]} → bucket[${idx}]`;

    addStep(
      bucketDistDesc,
      5,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      300,
    );
  }

  // Show bucket contents
  const bucketSummary = buckets
    .map((b, idx) => (b.length > 0 ? `[${idx}]: {${b.join(',')}}` : null))
    .filter(Boolean)
    .join('  ');

  addStep(
    `Buckets: ${bucketSummary}`,
    6,
    [],
    400,
  );

  // Sort each bucket with insertion sort
  for (let b = 0; b < bucketCount; b++) {
    if (buckets[b].length <= 1) continue;

    const before = buckets[b].join(', ');
    insertionSortBucket(buckets[b], counters);
    syncCounters();
    const after = buckets[b].join(', ');

    addStep(
      `Sort bucket[${b}]: [${before}] → [${after}]`,
      8,
      [],
      350,
    );
  }

  // Concatenate buckets back into array
  let pos = 0;
  for (let b = 0; b < bucketCount; b++) {
    for (const val of buckets[b]) {
      a[pos] = val;
      writes++;
      counters.writes++;

      addStep(
        `Collect bucket[${b}]: place ${val} at index ${pos}`,
        9,
        [
          {
            targetId: `element-${pos}`,
            property: 'highlight',
            from: 'default',
            to: 'swapping',
            easing: 'spring',
          },
          {
            targetId: `element-${pos}`,
            property: 'label',
            from: val,
            to: val,
            easing: 'ease-out',
          },
        ],
        300,
      );

      pos++;
    }
  }

  // Mark all elements as sorted
  for (let k = 0; k < n; k++) {
    addStep(
      'Array is fully sorted',
      10,
      [
        {
          targetId: `element-${k}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      150,
    );
  }

  return { config: CONFIG, steps, finalState: a };
}
