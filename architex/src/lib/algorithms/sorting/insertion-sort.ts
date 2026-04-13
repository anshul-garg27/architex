// ─────────────────────────────────────────────────────────────
// Architex — Insertion Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'insertion-sort',
  name: 'Insertion Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: true,
  inPlace: true,
  description:
    'Ever sorted a hand of playing cards? You pick up one card at a time and slide it into the right spot among the cards you already hold. That is Insertion Sort. The left portion stays sorted; each new element shifts larger neighbors right until it finds its place. Use on small or nearly-sorted data -- it is the inner loop of Python/Java Timsort for runs under 64 elements. Used in: Timsort (Python, Java, V8), small-array fast paths in most standard libraries. Remember: "Pick it up, slide it in. Nearly sorted? Nearly free -- O(n) best case."',
  pseudocode: [
    'procedure insertionSort(A)',
    '  for i = 1 to length(A) - 1 do',
    '    key = A[i]',
    '    j = i - 1',
    '    while j >= 0 and A[j] > key do',
    '      A[j+1] = A[j]',
    '      j = j - 1',
    '    A[j+1] = key',
  ],
};

/**
 * Performs Insertion Sort on the given array, recording each step as an AnimationStep.
 * Builds a sorted region from left to right, inserting each element into its correct position.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = insertionSort([5, 2, 4, 6, 1, 3]);
 * // result.finalState = [1, 2, 3, 4, 5, 6]
 */
export function insertionSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  // WHY Insertion Sort is stable: when we encounter an element equal to key,
  // the while-loop condition (array[j] > key, not >=) stops shifting. This means
  // equal elements keep their original relative order — a property Timsort relies on.
  const array = [...arr];
  const length = array.length;
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

  // Mark first element as sorted
  addStep(
    'First element is trivially sorted',
    1,
    [
      {
        targetId: 'element-0',
        property: 'highlight',
        from: 'default',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    300,
  );

  // WHY we start at index 1: the first element (index 0) is trivially sorted on its
  // own. The invariant is: array[0..i-1] is always sorted. Each iteration extends
  // the sorted region by one element.
  for (let i = 1; i < length; i++) {
    const key = array[i];
    reads++;

    // Pick up the key
    const pickDesc = i === 1
      ? `Pick key = ${key} at index ${i}. Like picking up the next card — we will slide it left until it finds its place among the already-sorted elements.`
      : `Pick key = ${key} at index ${i}.`;
    addStep(
      pickDesc,
      2,
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

    let j = i - 1;

    // WHY we scan left: the subarray to the left is already sorted, so we slide
    // right any element larger than key. The moment we find an element <= key,
    // the gap is in the correct position — this is what gives Insertion Sort
    // its O(n) best case on nearly-sorted data.
    while (j >= 0) {
      comparisons++;
      reads++;

      const cmpDesc = comparisons === 1
        ? `Compare ${array[j]} with key=${key}. We scan left through the sorted portion — if this element is larger than our key, it needs to shift right to make room.`
        : `Compare ${array[j]} with key=${key} — ${array[j] > key ? 'larger, shift right' : 'not larger, insert here'}.`;
      addStep(
        cmpDesc,
        4,
        [
          {
            targetId: `element-${j}`,
            property: 'highlight',
            from: 'sorted',
            to: 'comparing',
            easing: 'ease-out',
          },
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'active',
            to: 'comparing',
            easing: 'ease-out',
          },
        ],
        350,
      );

      if (array[j] > key) {
        // WHY shift instead of swap: shifting is more efficient than swapping
        // (one write per element vs three). We overwrite array[j+1] knowing the
        // key is safely saved in a variable and will be placed once.
        array[j + 1] = array[j];
        writes++;
        swaps++;

        const shiftDesc = swaps === 1
          ? `Shift ${array[j]} one position right to index ${j + 1}. Since ${array[j]} > key=${key}, it moves right to open a gap for the key to land in.`
          : `Shift ${array[j]} right to index ${j + 1}.`;
        addStep(
          shiftDesc,
          5,
          [
            {
              targetId: `element-${j}`,
              property: 'highlight',
              from: 'comparing',
              to: 'swapping',
              easing: 'spring',
            },
            {
              targetId: `element-${j + 1}`,
              property: 'position',
              from: j,
              to: j + 1,
              easing: 'spring',
            },
          ],
          400,
        );

        j--;
      } else {
        break;
      }
    }

    // WHY insert at j+1: after the while loop, j points to the first element
    // that is NOT greater than key (or -1 if key is the smallest). The correct
    // position for key is one to the right of that element.
    array[j + 1] = key;
    writes++;

    addStep(
      `Insert key=${key} at position ${j + 1}`,
      7,
      [
        {
          targetId: `element-${j + 1}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'spring',
        },
        {
          targetId: `element-${j + 1}`,
          property: 'label',
          from: array[j + 1],
          to: key,
          easing: 'ease-out',
        },
      ],
      400,
    );

    // Mark all sorted elements
    for (let k = 0; k <= i; k++) {
      if (k !== j + 1) {
        addStep(
          `Elements [0..${i}] are now sorted`,
          7,
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
    }
  }

  return { config: CONFIG, steps, finalState: array };
}
