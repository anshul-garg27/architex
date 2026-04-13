// ─────────────────────────────────────────────────────────────
// Architex — Pancake Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const CONFIG: AlgorithmConfig = {
  id: 'pancake-sort',
  name: 'Pancake Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'Sorts by repeatedly finding the maximum element in the unsorted portion, flipping it to the front, then flipping it into its correct position — like flipping a stack of pancakes with a spatula.',
  pseudocode: [
    'procedure pancakeSort(A)',
    '  n = length(A)',
    '  for size = n down to 2 do',
    '    maxIdx = findMax(A, 0, size-1)',
    '    if maxIdx != size-1 then',
    '      if maxIdx != 0 then',
    '        flip(A, 0, maxIdx)      // bring max to front',
    '      flip(A, 0, size-1)        // flip max to correct pos',
    '  return A',
  ],
};

/** Reverse a[0..end] in place. */
function flip(a: number[], end: number): void {
  let left = 0;
  let right = end;
  while (left < right) {
    const tmp = a[left];
    a[left] = a[right];
    a[right] = tmp;
    left++;
    right--;
  }
}

/** Return the index of the maximum element in a[0..end]. */
function findMaxIndex(a: number[], end: number): number {
  let maxIdx = 0;
  for (let i = 1; i <= end; i++) {
    if (a[i] > a[maxIdx]) {
      maxIdx = i;
    }
  }
  return maxIdx;
}

export function pancakeSort(arr: number[]): AlgorithmResult {
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

  let firstFlip = true;

  for (let size = n; size > 1; size--) {
    // --- Find maximum in a[0..size-1] ---
    reads += size;
    comparisons += size - 1;
    const maxIdx = findMaxIndex(a, size - 1);

    // Highlight the max element we found
    const findMutations: VisualMutation[] = [
      {
        targetId: `element-${maxIdx}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      },
    ];

    steps.push({
      id: stepId++,
      description: `Find max in arr[0..${size - 1}]: arr[${maxIdx}]=${a[maxIdx]}`,
      pseudocodeLine: 3,
      mutations: findMutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 400,
      arraySnapshot: [...a],
    });

    if (maxIdx === size - 1) {
      // Already in correct position — mark sorted
      steps.push({
        id: stepId++,
        description: `Max is already at position ${size - 1} — no flips needed`,
        pseudocodeLine: 4,
        mutations: [
          {
            targetId: `element-${size - 1}`,
            property: 'highlight',
            from: 'active',
            to: 'sorted',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps, reads, writes },
        duration: 300,
        arraySnapshot: [...a],
      });
      continue;
    }

    // --- Flip 1: bring max to front (if not already there) ---
    if (maxIdx !== 0) {
      const flipCount = maxIdx + 1;
      swaps += Math.floor(flipCount / 2);
      writes += flipCount;

      const flip1Mutations: VisualMutation[] = [];
      for (let i = 0; i <= maxIdx; i++) {
        flip1Mutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'swapping',
          easing: 'spring',
        });
      }

      let flipDesc: string;
      if (firstFlip) {
        flipDesc = `Flip arr[0..${maxIdx}] — bring max (${a[maxIdx]}) to front. The only operation allowed is flipping the top N elements — like flipping a stack of pancakes with a spatula.`;
        firstFlip = false;
      } else {
        flipDesc = `Flip arr[0..${maxIdx}] — bring max (${a[maxIdx]}) to front`;
      }

      flip(a, maxIdx);

      steps.push({
        id: stepId++,
        description: flipDesc,
        pseudocodeLine: 6,
        mutations: flip1Mutations,
        complexity: { comparisons, swaps, reads, writes },
        duration: 500,
        arraySnapshot: [...a],
      });
    }

    // --- Flip 2: flip max from front into its correct position ---
    const flip2Count = size;
    swaps += Math.floor(flip2Count / 2);
    writes += flip2Count;

    const flip2Mutations: VisualMutation[] = [];
    for (let i = 0; i < size; i++) {
      flip2Mutations.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: 'swapping',
        easing: 'spring',
      });
    }

    flip(a, size - 1);

    steps.push({
      id: stepId++,
      description: `Flip arr[0..${size - 1}] — place max at position ${size - 1}`,
      pseudocodeLine: 7,
      mutations: flip2Mutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 500,
      arraySnapshot: [...a],
    });

    // Mark the element now in its sorted position
    steps.push({
      id: stepId++,
      description: `Element at index ${size - 1} is now in its sorted position`,
      pseudocodeLine: 8,
      mutations: [
        {
          targetId: `element-${size - 1}`,
          property: 'highlight',
          from: 'swapping',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps, reads, writes },
      duration: 300,
      arraySnapshot: [...a],
    });
  }

  // Mark the last remaining element as sorted
  steps.push({
    id: stepId++,
    description: `Element at index 0 is trivially sorted`,
    pseudocodeLine: 8,
    mutations: [
      {
        targetId: 'element-0',
        property: 'highlight',
        from: 'default',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps, reads, writes },
    duration: 200,
    arraySnapshot: [...a],
  });

  return { config: CONFIG, steps, finalState: a };
}
