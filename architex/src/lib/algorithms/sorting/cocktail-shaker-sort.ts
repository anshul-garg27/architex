// -----------------------------------------------------------------
// Architex — Cocktail Shaker Sort with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'cocktail-shaker-sort',
  name: 'Cocktail Shaker Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: true,
  inPlace: true,
  description:
    'A bidirectional variant of bubble sort that alternates between forward and backward passes through the array, moving the largest unsorted element to the end and the smallest to the beginning on each full cycle.',
  pseudocode: [
    'procedure cocktailShakerSort(A)',
    '  start = 0; end = length(A) - 1',
    '  swapped = true',
    '  while swapped do',
    '    swapped = false',
    '    // forward pass',
    '    for i = start to end - 1 do',
    '      if A[i] > A[i+1] then',
    '        swap(A[i], A[i+1])',
    '        swapped = true',
    '    end = end - 1',
    '    // backward pass',
    '    for i = end down to start + 1 do',
    '      if A[i-1] > A[i] then',
    '        swap(A[i-1], A[i])',
    '        swapped = true',
    '    start = start + 1',
  ],
};

export function cocktailShakerSort(arr: number[]): AlgorithmResult {
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

  let start = 0;
  let end = n - 1;
  let swapped = true;

  addStep(`Initialize bounds: start=${start}, end=${end}`, 1, [], 300);

  while (swapped) {
    swapped = false;

    // Forward pass (left to right)
    addStep(
      `Forward pass [${start}..${end}]`,
      5,
      [],
      300,
    );

    for (let i = start; i < end; i++) {
      comparisons++;
      reads += 2;

      addStep(
        `Compare a[${i}]=${a[i]} with a[${i + 1}]=${a[i + 1]}`,
        7,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
          {
            targetId: `element-${i + 1}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
        ],
        300,
      );

      if (a[i] > a[i + 1]) {
        const tmp = a[i];
        a[i] = a[i + 1];
        a[i + 1] = tmp;
        swaps++;
        writes += 2;
        swapped = true;

        addStep(
          `Swap a[${i}]=${a[i]} and a[${i + 1}]=${a[i + 1]}`,
          8,
          [
            {
              targetId: `element-${i}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
            {
              targetId: `element-${i + 1}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
          ],
          400,
        );
      }
    }

    // Mark the element at the end as sorted
    addStep(
      `Element at index ${end} is in final position`,
      10,
      [
        {
          targetId: `element-${end}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      250,
    );

    end--;

    if (!swapped) {
      break;
    }

    swapped = false;

    // Backward pass (right to left)
    const backwardDesc = start === 0
      ? `Backward pass [${end}..${start}]. Unlike Bubble Sort which only bubbles upward, Cocktail Shaker alternates direction — this eliminates 'turtles' (small values stuck near the end).`
      : `Backward pass [${end}..${start}]`;

    addStep(
      backwardDesc,
      11,
      [],
      300,
    );

    for (let i = end; i > start; i--) {
      comparisons++;
      reads += 2;

      addStep(
        `Compare a[${i - 1}]=${a[i - 1]} with a[${i}]=${a[i]}`,
        13,
        [
          {
            targetId: `element-${i - 1}`,
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

      if (a[i - 1] > a[i]) {
        const tmp = a[i - 1];
        a[i - 1] = a[i];
        a[i] = tmp;
        swaps++;
        writes += 2;
        swapped = true;

        addStep(
          `Swap a[${i - 1}]=${a[i - 1]} and a[${i}]=${a[i]}`,
          14,
          [
            {
              targetId: `element-${i - 1}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
            {
              targetId: `element-${i}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
          ],
          400,
        );
      }
    }

    // Mark the element at start as sorted
    addStep(
      `Element at index ${start} is in final position`,
      16,
      [
        {
          targetId: `element-${start}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      250,
    );

    start++;
  }

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
