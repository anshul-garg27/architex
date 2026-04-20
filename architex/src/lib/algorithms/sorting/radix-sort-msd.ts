// -----------------------------------------------------------------
// Architex -- Radix Sort MSD (Most Significant Digit) with Step Recording  (ALG-016)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'radix-sort-msd',
  name: 'Radix Sort (MSD)',
  category: 'sorting',
  timeComplexity: { best: 'O(nk)', average: 'O(nk)', worst: 'O(nk)' },
  spaceComplexity: 'O(n + k)',
  stable: true,
  inPlace: false,
  description:
    'Most Significant Digit radix sort processes digits from the highest order to the lowest, recursively sorting sub-arrays within each bucket. Naturally produces lexicographic order. k = number of digits in the largest element.',
  pseudocode: [
    'procedure radixSortMSD(A, lo, hi, digitPos)',
    '  if lo >= hi or digitPos < 0 then return',
    '  buckets = 10 empty lists',
    '  for i = lo to hi do',
    '    d = digit(A[i], digitPos)',
    '    buckets[d].append(A[i])',
    '  idx = lo',
    '  for d = 0 to 9 do',
    '    for each val in buckets[d] do',
    '      A[idx] = val; idx++',
    '  offset = lo',
    '  for d = 0 to 9 do',
    '    count = buckets[d].length',
    '    if count > 1 then',
    '      radixSortMSD(A, offset, offset+count-1, digitPos-1)',
    '    offset += count',
    '  return A',
  ],
};

/** Extract digit at a given position (0 = ones, 1 = tens, ...). */
function getDigit(num: number, pos: number): number {
  return Math.floor(Math.abs(num) / Math.pow(10, pos)) % 10;
}

/** Count the number of digits in a number. */
function digitCount(num: number): number {
  if (num === 0) return 1;
  return Math.floor(Math.log10(Math.abs(num))) + 1;
}

export function radixSortMSD(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  const comparisons = 0;
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
      complexity: { comparisons, swaps: 0, reads, writes },
      duration,
      arraySnapshot: [...a],
    });
  }

  // Find the maximum number of digits
  let maxDigits = 0;
  for (let i = 0; i < n; i++) {
    reads++;
    maxDigits = Math.max(maxDigits, digitCount(a[i]));
  }

  addStep(
    `Max digits = ${maxDigits}. Starting MSD radix sort from digit position ${maxDigits - 1}.`,
    0,
    [],
    350,
  );

  let firstBucketStep = true;

  function msdSort(lo: number, hi: number, digitPos: number, depth: number): void {
    if (lo >= hi || digitPos < 0) {
      if (lo >= hi) {
        addStep(
          `${' '.repeat(depth)}Subarray [${lo}..${hi}] has ${hi - lo + 1} element(s) -- base case`,
          1,
          [],
          200,
        );
      }
      return;
    }

    const indent = ' '.repeat(depth);
    addStep(
      `${indent}Processing subarray [${lo}..${hi}] at digit position ${digitPos}`,
      0,
      Array.from({ length: hi - lo + 1 }, (_, i) => ({
        targetId: `element-${lo + i}`,
        property: 'highlight' as const,
        from: 'default',
        to: 'active',
        easing: 'ease-out' as const,
      })),
      350,
    );

    // Initialize 10 buckets
    const buckets: number[][] = Array.from({ length: 10 }, () => []);

    // Distribute into buckets by the current digit
    for (let i = lo; i <= hi; i++) {
      reads++;
      const d = getDigit(a[i], digitPos);
      buckets[d].push(a[i]);

      let msdBucketDesc: string;
      if (firstBucketStep) {
        msdBucketDesc = `${indent}arr[${i}]=${a[i]} digit[${digitPos}]=${d} -> bucket[${d}]. MSD Radix processes from the most significant digit first — like sorting words alphabetically by first letter, then second letter within each group.`;
        firstBucketStep = false;
      } else {
        msdBucketDesc = `${indent}arr[${i}]=${a[i]} digit[${digitPos}]=${d} -> bucket[${d}]`;
      }

      addStep(
        msdBucketDesc,
        4,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
        ],
        250,
      );
    }

    // Show bucket summary
    const bucketSummary = buckets
      .map((b, idx) => (b.length > 0 ? `[${idx}]: {${b.join(',')}}` : null))
      .filter(Boolean)
      .join('  ');

    addStep(
      `${indent}Buckets: ${bucketSummary}`,
      5,
      [],
      350,
    );

    // Write buckets back to array in order
    let idx = lo;
    for (let d = 0; d < 10; d++) {
      for (const val of buckets[d]) {
        a[idx] = val;
        writes++;

        addStep(
          `${indent}Collect bucket[${d}]: place ${val} at index ${idx}`,
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
          250,
        );

        idx++;
      }
    }

    addStep(
      `${indent}After digit ${digitPos} pass: [${a.slice(lo, hi + 1).join(', ')}]`,
      9,
      [],
      300,
    );

    // Recurse into each bucket's range
    let offset = lo;
    for (let d = 0; d < 10; d++) {
      const count = buckets[d].length;
      if (count > 1) {
        addStep(
          `${indent}Recurse into bucket[${d}] range [${offset}..${offset + count - 1}] at digit ${digitPos - 1}`,
          14,
          [],
          300,
        );
        msdSort(offset, offset + count - 1, digitPos - 1, depth + 1);
      }
      offset += count;
    }
  }

  msdSort(0, n - 1, maxDigits - 1, 0);

  // Mark all elements as sorted
  for (let k = 0; k < n; k++) {
    addStep(
      'Array is fully sorted',
      16,
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
