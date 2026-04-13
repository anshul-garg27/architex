// ─────────────────────────────────────────────────────────────
// Architex — Bubble Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'bubble-sort',
  name: 'Bubble Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: true,
  inPlace: true,
  description:
    'What if you could only compare two cards next to each other -- how would you sort a whole deck? That is Bubble Sort. Like bubbles in soda, the biggest value rises to the top each pass. Compares adjacent elements, swaps if the left is larger, repeats until zero swaps occur. Use on tiny or nearly-sorted data. Prefer Merge/Quick Sort for anything larger. Used in: CS education worldwide; Timsort (Python/Java) borrows the small-runs idea. Remember: "Biggest bubble rises first. Each pass = one more element in place."',
  comparisonGuide:
    'vs Selection Sort: both O(n^2), but Bubble is stable and has O(n) best case. vs Insertion Sort: Insertion is faster on nearly-sorted data.',
  pseudocode: [
    'procedure bubbleSort(A: list)',
    '  n = length(A)',
    '  for i = 0 to n-1 do',
    '    swapped = false',
    '    for j = 0 to n-i-2 do',
    '      if A[j] > A[j+1] then',
    '        swap(A[j], A[j+1])',
    '        swapped = true',
    '    if not swapped then break',
    '  return A',
  ],
};

/**
 * Performs Bubble Sort on the given array, recording each step as an AnimationStep.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = bubbleSort([5, 3, 8, 1]);
 * // result.finalState = [1, 3, 5, 8]
 * // result.steps.length = ~10 (depends on input)
 */
export function bubbleSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const array = [...arr];
  const length = array.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;

  // WHY outer loop runs n-1 times: after n-1 passes, n-1 elements are in their
  // final position, so the last element must also be correct. One fewer pass than
  // you'd guess is ever needed.
  for (let i = 0; i < length - 1; i++) {
    let swapped = false;

    // WHY inner loop shrinks by i: after pass i, the last i elements are in their
    // final sorted position (the largest "bubbles" have already risen to the top).
    // Comparing them again would be wasted work.
    for (let j = 0; j < length - i - 1; j++) {
      reads += 2;
      comparisons++;

      // Comparison step
      const compareMutations: VisualMutation[] = [
        {
          targetId: `element-${j}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
        {
          targetId: `element-${j + 1}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ];

      const compareDesc = comparisons === 1
        ? `Compare neighbors ${array[j]} and ${array[j + 1]}. Bubble Sort always checks adjacent pairs — if the left value is larger, they are out of order.`
        : `Compare ${array[j]} and ${array[j + 1]} — ${array[j] > array[j + 1] ? `${array[j]} > ${array[j + 1]}, so swap` : 'already in order'}.`;

      steps.push({
        id: stepId++,
        description: compareDesc,
        pseudocodeLine: 5,
        mutations: compareMutations,
        complexity: { comparisons, swaps, reads, writes },
        duration: 400,
      });

      // WHY we only swap when left > right (strict): using > (not >=) means equal
      // elements are never swapped, preserving their original relative order. This
      // is what makes Bubble Sort a stable sorting algorithm.
      if (array[j] > array[j + 1]) {
        // Capture pre-swap values for accurate step description
        const preJ = array[j];
        const preJ1 = array[j + 1];

        // Swap step
        const temp = array[j];
        array[j] = array[j + 1];
        array[j + 1] = temp;
        swaps++;
        writes += 2;
        swapped = true;

        const swapMutations: VisualMutation[] = [
          {
            targetId: `element-${j}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'spring',
          },
          {
            targetId: `element-${j + 1}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'spring',
          },
          {
            targetId: `element-${j}`,
            property: 'position',
            from: j,
            to: j + 1,
            easing: 'spring',
          },
          {
            targetId: `element-${j + 1}`,
            property: 'position',
            from: j + 1,
            to: j,
            easing: 'spring',
          },
        ];

        const swapDesc = swaps === 1
          ? `Since ${preJ} > ${preJ1}, swap them. The smaller value (${preJ1}) moves left toward where it belongs.`
          : `Swap ${preJ} and ${preJ1} — moving ${preJ1} left.`;

        steps.push({
          id: stepId++,
          description: swapDesc,
          pseudocodeLine: 6,
          mutations: swapMutations,
          complexity: { comparisons, swaps, reads, writes },
          duration: 500,
        });
      }
    }

    // WHY we mark this element: after pass i, the element at position (length - i - 1)
    // has "bubbled" into its final sorted position. This is the loop invariant.
    steps.push({
      id: stepId++,
      description: `Element at index ${length - i - 1} is now in its sorted position`,
      pseudocodeLine: 8,
      mutations: [
        {
          targetId: `element-${length - i - 1}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps, reads, writes },
      duration: 300,
      milestone: `Pass ${i + 1} complete`,
    });

    if (!swapped) {
      // WHY early termination works: if a full pass made zero swaps, every adjacent
      // pair is already in order, meaning the entire array is sorted. This is the
      // optimization that gives Bubble Sort its O(n) best case on already-sorted input.
      for (let k = 0; k < length - i - 1; k++) {
        steps.push({
          id: stepId++,
          description: `No swaps in this pass — array is sorted`,
          pseudocodeLine: 8,
          mutations: [
            {
              targetId: `element-${k}`,
              property: 'highlight',
              from: 'default',
              to: 'sorted',
              easing: 'ease-out',
            },
          ],
          complexity: { comparisons, swaps, reads, writes },
          duration: 200,
          ...(k === 0 ? { milestone: 'Early exit — array sorted!' } : {}),
        });
      }
      break;
    }
  }

  return { config: CONFIG, steps, finalState: array };
}
