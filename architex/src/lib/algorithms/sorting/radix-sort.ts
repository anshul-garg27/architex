// ─────────────────────────────────────────────────────────────
// Architex — Radix Sort (LSD) with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'radix-sort',
  name: 'Radix Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)' },
  spaceComplexity: 'O(n + k)',
  stable: true,
  inPlace: false,
  description:
    'Processes digits from least significant to most significant, using counting sort as a stable subroutine for each digit position. k = number of digits in the largest element.',
  pseudocode: [
    'procedure radixSort(A)',
    '  maxVal = max(A)',
    '  exp = 1',
    '  while maxVal / exp >= 1 do',
    '    buckets = 10 empty lists',
    '    for each x in A do',
    '      digit = floor(x / exp) mod 10',
    '      buckets[digit].append(x)',
    '    A = concatenate(buckets)',
    '    exp = exp * 10',
    '  return A',
    '',
    '// Uses counting sort per digit',
    '// for stability (LSD variant)',
    '// k = number of digit passes',
  ],
};

export function radixSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  const comparisons = 0;
  const swaps = 0;
  let reads = 0;
  let writes = 0;

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

  // Find max value to determine number of digit passes
  let maxVal = 0;
  for (let i = 0; i < n; i++) {
    reads++;
    if (a[i] > maxVal) maxVal = a[i];
  }

  addStep(
    `Max value = ${maxVal}`,
    1,
    [],
    300,
  );

  let digitPos = 0;
  const digitNames = ['ones', 'tens', 'hundreds', 'thousands', 'ten-thousands'];
  const maxDigits = Math.floor(Math.log10(Math.max(1, maxVal))) + 1;

  for (let d = 0; d < maxDigits; d++) {
    const exp = Math.pow(10, d);
    const label = digitPos < digitNames.length ? digitNames[digitPos] : `10^${digitPos}`;

    addStep(
      `Processing ${label} digit (exp=${exp})`,
      3,
      [],
      350,
    );

    // Initialize 10 buckets
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    // Distribute elements into buckets
    for (let i = 0; i < n; i++) {
      reads++;
      const digit = Math.floor(a[i] / exp) % 10;
      buckets[digit].push(a[i]);

      const digitBucketDesc = (d === 0 && i === 0)
        ? `arr[${i}]=${a[i]} → digit=${digit} → bucket[${digit}]. Radix Sort processes one digit at a time, from least significant to most — like sorting mail by ZIP code digit-by-digit.`
        : `arr[${i}]=${a[i]} → digit=${digit} → bucket[${digit}]`;

      addStep(
        digitBucketDesc,
        6,
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

    // Show bucket distribution
    const bucketSummary = buckets
      .map((b, idx) => (b.length > 0 ? `[${idx}]: {${b.join(',')}}` : null))
      .filter(Boolean)
      .join('  ');

    addStep(
      `Buckets: ${bucketSummary}`,
      7,
      [],
      400,
    );

    // Concatenate buckets back into array
    let idx = 0;
    for (let d = 0; d < 10; d++) {
      for (const val of buckets[d]) {
        a[idx] = val;
        writes++;

        addStep(
          `Collect bucket[${d}]: place ${val} at index ${idx}`,
          8,
          [
            {
              targetId: `element-${idx}`,
              property: 'highlight',
              from: 'default',
              to: 'swapping',
              easing: 'spring',
            },
            {
              targetId: `element-${idx}`,
              property: 'label',
              from: val,
              to: val,
              easing: 'ease-out',
            },
          ],
          300,
        );

        idx++;
      }
    }

    addStep(
      `After ${label} pass: [${a.join(', ')}]`,
      9,
      [],
      400,
    );

    digitPos++;
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
