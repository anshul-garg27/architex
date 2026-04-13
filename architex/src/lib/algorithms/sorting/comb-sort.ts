// -----------------------------------------------------------------
// Architex — Comb Sort with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'comb-sort',
  name: 'Comb Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n log n)', average: 'O(n^2 / 2^p)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'An improvement over bubble sort that eliminates "turtles" (small values near the end) by comparing elements separated by a gap that shrinks by a factor of 1.3 on each pass until the gap reaches 1.',
  pseudocode: [
    'procedure combSort(A)',
    '  n = length(A)',
    '  gap = n',
    '  shrink = 1.3',
    '  sorted = false',
    '  while not sorted do',
    '    gap = floor(gap / shrink)',
    '    if gap <= 1 then',
    '      gap = 1',
    '      sorted = true',
    '    for i = 0 to n - gap - 1 do',
    '      if A[i] > A[i + gap] then',
    '        swap(A[i], A[i + gap])',
    '        sorted = false',
  ],
};

const SHRINK_FACTOR = 1.3;

export function combSort(arr: number[]): AlgorithmResult {
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

  let gap = n;
  let sorted = false;

  addStep(`Initialize gap = ${gap}, shrink factor = ${SHRINK_FACTOR}`, 2, [], 300);

  while (!sorted) {
    gap = Math.floor(gap / SHRINK_FACTOR);

    if (gap <= 1) {
      gap = 1;
      sorted = true;
    }

    addStep(
      `Shrink gap to ${gap}${gap === 1 ? ' (final pass)' : ''}`,
      6,
      [],
      300,
    );

    for (let i = 0; i + gap < n; i++) {
      comparisons++;
      reads += 2;

      const combCompareDesc = comparisons === 1
        ? `Compare a[${i}]=${a[i]} with a[${i + gap}]=${a[i + gap]}. Comb Sort starts with a large gap and shrinks it — this eliminates small values far from their position much faster than Bubble Sort's gap of 1.`
        : `Compare a[${i}]=${a[i]} with a[${i + gap}]=${a[i + gap]}`;

      addStep(
        combCompareDesc,
        11,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
          {
            targetId: `element-${i + gap}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
        ],
        300,
      );

      if (a[i] > a[i + gap]) {
        const tmp = a[i];
        a[i] = a[i + gap];
        a[i + gap] = tmp;
        swaps++;
        writes += 2;
        sorted = false;

        addStep(
          `Swap a[${i}]=${a[i]} and a[${i + gap}]=${a[i + gap]}`,
          12,
          [
            {
              targetId: `element-${i}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
            {
              targetId: `element-${i + gap}`,
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

    addStep(
      gap === 1 && sorted
        ? 'No swaps in final pass — sort complete'
        : `Pass complete with gap=${gap}`,
      13,
      [],
      300,
    );
  }

  // Mark all elements as sorted
  for (let k = 0; k < n; k++) {
    addStep(
      'Array is fully sorted',
      13,
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
