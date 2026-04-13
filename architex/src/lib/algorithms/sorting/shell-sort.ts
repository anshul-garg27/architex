// ─────────────────────────────────────────────────────────────
// Architex — Shell Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'shell-sort',
  name: 'Shell Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n log n)', average: 'O(n^(4/3))', worst: 'O(n^(3/2))' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'A generalization of insertion sort that allows the exchange of items that are far apart. Uses a diminishing gap sequence (Knuth) to progressively refine the order.',
  pseudocode: [
    'procedure shellSort(A)',
    '  n = length(A)',
    '  gap = 1',
    '  while gap < n/3 do gap = 3*gap + 1',
    '  while gap >= 1 do',
    '    for i = gap to n-1 do',
    '      key = A[i]',
    '      j = i',
    '      while j >= gap and A[j-gap] > key do',
    '        A[j] = A[j-gap]; j = j-gap',
    '      A[j] = key',
    '    gap = gap / 3',
  ],
};

export function shellSort(arr: number[]): AlgorithmResult {
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
    });
  }

  // Compute initial gap using Knuth sequence: h = 3h + 1
  let gap = 1;
  while (gap < Math.floor(n / 3)) {
    gap = 3 * gap + 1;
  }

  addStep(
    `Initial Knuth gap = ${gap}`,
    3,
    [],
    300,
  );

  while (gap >= 1) {
    addStep(
      `Begin pass with gap = ${gap}`,
      4,
      [],
      300,
    );

    for (let i = gap; i < n; i++) {
      const key = a[i];
      reads++;

      addStep(
        `Pick key = arr[${i}] = ${key} (gap=${gap})`,
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
        350,
      );

      let j = i;

      while (j >= gap) {
        comparisons++;
        reads++;

        const gapCompareDesc = comparisons === 1
          ? `Compare arr[${j - gap}]=${a[j - gap]} with key=${key}. Shell Sort compares elements separated by a gap — unlike Bubble Sort's adjacent-only comparisons, this lets small values jump large distances toward their correct position.`
          : `Compare arr[${j - gap}]=${a[j - gap]} with key=${key}`;

        addStep(
          gapCompareDesc,
          8,
          [
            {
              targetId: `element-${j - gap}`,
              property: 'highlight',
              from: 'default',
              to: 'comparing',
              easing: 'ease-out',
            },
            {
              targetId: `element-${j}`,
              property: 'highlight',
              from: 'active',
              to: 'comparing',
              easing: 'ease-out',
            },
          ],
          350,
        );

        if (a[j - gap] > key) {
          a[j] = a[j - gap];
          swaps++;
          writes++;

          addStep(
            `Shift arr[${j - gap}]=${a[j - gap]} to index ${j}`,
            9,
            [
              {
                targetId: `element-${j - gap}`,
                property: 'highlight',
                from: 'comparing',
                to: 'swapping',
                easing: 'spring',
              },
              {
                targetId: `element-${j}`,
                property: 'position',
                from: j - gap,
                to: j,
                easing: 'spring',
              },
            ],
            400,
          );

          j -= gap;
        } else {
          break;
        }
      }

      a[j] = key;
      writes++;

      addStep(
        `Insert key=${key} at position ${j}`,
        10,
        [
          {
            targetId: `element-${j}`,
            property: 'highlight',
            from: 'default',
            to: 'sorted',
            easing: 'spring',
          },
          {
            targetId: `element-${j}`,
            property: 'label',
            from: a[j],
            to: key,
            easing: 'ease-out',
          },
        ],
        400,
      );
    }

    gap = Math.floor(gap / 3);

    addStep(
      gap >= 1 ? `Reduce gap to ${gap}` : 'Gap reduced to 0 — sort complete',
      11,
      [],
      300,
    );
  }

  // Mark all elements as sorted
  for (let k = 0; k < n; k++) {
    addStep(
      'Array is fully sorted',
      11,
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
