// -----------------------------------------------------------------
// Architex — Tim Sort with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'tim-sort',
  name: 'Tim Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n log n)', worst: 'O(n log n)' },
  spaceComplexity: 'O(n)',
  stable: true,
  inPlace: false,
  description:
    'A hybrid sorting algorithm derived from merge sort and insertion sort. Finds natural runs in the data, extends short runs with insertion sort to a minimum run length, then merges all runs using a merge procedure.',
  pseudocode: [
    'procedure timSort(A)',
    '  n = length(A)',
    '  minRun = computeMinRun(n)',
    '  // Step 1: create runs of size minRun',
    '  for start = 0 to n-1 step minRun do',
    '    end = min(start + minRun - 1, n - 1)',
    '    insertionSort(A, start, end)',
    '  // Step 2: merge runs bottom-up',
    '  size = minRun',
    '  while size < n do',
    '    for left = 0 to n-1 step 2*size do',
    '      mid = min(left + size - 1, n - 1)',
    '      right = min(left + 2*size - 1, n - 1)',
    '      if mid < right then',
    '        merge(A, left, mid, right)',
    '    size = size * 2',
  ],
};

/** Compute the minimum run length for Tim Sort. */
function computeMinRun(n: number): number {
  let r = 0;
  while (n >= 64) {
    r |= n & 1;
    n >>= 1;
  }
  return n + r;
}

export function timSort(arr: number[]): AlgorithmResult {
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

  const minRun = computeMinRun(n);

  addStep(`Computed minRun = ${minRun}`, 2, [], 300);

  // Step 1: Insertion-sort individual runs of size minRun
  for (let start = 0; start < n; start += minRun) {
    const end = Math.min(start + minRun - 1, n - 1);

    const runDesc = start === 0
      ? `Insertion sort run [${start}..${end}]. Tim Sort looks for natural 'runs' (already sorted sequences) in the data — real-world data often has these, which is why Tim Sort is faster in practice.`
      : `Insertion sort run [${start}..${end}]`;

    addStep(
      runDesc,
      4,
      [
        {
          targetId: `element-${start}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
        {
          targetId: `element-${end}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      350,
    );

    // Insertion sort on sub-array [start..end]
    for (let i = start + 1; i <= end; i++) {
      const key = a[i];
      reads++;
      let j = i - 1;

      while (j >= start) {
        comparisons++;
        reads++;

        addStep(
          `Compare a[${j}]=${a[j]} with key=${key}`,
          6,
          [
            {
              targetId: `element-${j}`,
              property: 'highlight',
              from: 'default',
              to: 'comparing',
              easing: 'ease-out',
            },
            {
              targetId: `element-${i}`,
              property: 'highlight',
              from: 'default',
              to: 'comparing',
              easing: 'ease-out',
            },
          ],
          300,
        );

        if (a[j] > key) {
          a[j + 1] = a[j];
          swaps++;
          writes++;

          addStep(
            `Shift a[${j}]=${a[j]} to index ${j + 1}`,
            6,
            [
              {
                targetId: `element-${j}`,
                property: 'highlight',
                from: 'comparing',
                to: 'swapping',
                easing: 'spring',
              },
            ],
            350,
          );

          j--;
        } else {
          break;
        }
      }

      a[j + 1] = key;
      writes++;
    }

    addStep(
      `Run [${start}..${end}] sorted`,
      6,
      Array.from({ length: end - start + 1 }, (_, k) => ({
        targetId: `element-${start + k}`,
        property: 'highlight' as const,
        from: 'default' as const,
        to: 'sorted' as const,
        easing: 'ease-out' as const,
      })),
      300,
    );
  }

  // Step 2: Merge runs bottom-up
  let size = minRun;
  while (size < n) {
    addStep(`Begin merge pass with size = ${size}`, 9, [], 300);

    for (let left = 0; left < n; left += 2 * size) {
      const mid = Math.min(left + size - 1, n - 1);
      const right = Math.min(left + 2 * size - 1, n - 1);

      if (mid < right) {
        addStep(
          `Merge [${left}..${mid}] and [${mid + 1}..${right}]`,
          14,
          [
            {
              targetId: `element-${left}`,
              property: 'highlight',
              from: 'default',
              to: 'active',
              easing: 'ease-out',
            },
            {
              targetId: `element-${right}`,
              property: 'highlight',
              from: 'default',
              to: 'active',
              easing: 'ease-out',
            },
          ],
          350,
        );

        // Standard merge procedure
        const leftPart = a.slice(left, mid + 1);
        const rightPart = a.slice(mid + 1, right + 1);
        reads += right - left + 1;

        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftPart.length && j < rightPart.length) {
          comparisons++;
          reads += 2;

          addStep(
            `Compare ${leftPart[i]} with ${rightPart[j]}`,
            14,
            [
              {
                targetId: `element-${k}`,
                property: 'highlight',
                from: 'default',
                to: 'comparing',
                easing: 'ease-out',
              },
            ],
            300,
          );

          if (leftPart[i] <= rightPart[j]) {
            a[k] = leftPart[i];
            i++;
          } else {
            a[k] = rightPart[j];
            j++;
          }
          writes++;
          k++;
        }

        while (i < leftPart.length) {
          a[k] = leftPart[i];
          writes++;
          i++;
          k++;
        }

        while (j < rightPart.length) {
          a[k] = rightPart[j];
          writes++;
          j++;
          k++;
        }

        addStep(
          `Merged [${left}..${right}]`,
          14,
          Array.from({ length: right - left + 1 }, (_, idx) => ({
            targetId: `element-${left + idx}`,
            property: 'highlight' as const,
            from: 'comparing' as const,
            to: 'sorted' as const,
            easing: 'spring' as const,
          })),
          400,
        );
      }
    }

    size *= 2;

    addStep(
      size < n ? `Double merge size to ${size}` : 'All runs merged — sort complete',
      15,
      [],
      300,
    );
  }

  // Mark all elements as sorted
  for (let k = 0; k < n; k++) {
    addStep(
      'Array is fully sorted',
      15,
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
