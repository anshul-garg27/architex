// ─────────────────────────────────────────────────────────────
// Architex — Selection Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'selection-sort',
  name: 'Selection Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'Imagine lining up students by height: scan the whole line, find the shortest, pull them to the front. Repeat for the rest. That is Selection Sort -- always exactly n-1 swaps, no matter the input. It scans the unsorted region for the minimum and swaps it into the next sorted position. Use when swap cost is high (large records) or memory writes must be minimized. Prefer Insertion Sort for nearly-sorted data. Used in: embedded systems where write endurance matters (flash memory). Remember: "Find the min, put it in place. Fewest swaps possible, but always O(n^2) comparisons."',
  pseudocode: [
    'procedure selectionSort(A)',
    '  n = length(A)',
    '  for i = 0 to n-2 do',
    '    minIdx = i',
    '    for j = i+1 to n-1 do',
    '      if A[j] < A[minIdx] then',
    '        minIdx = j',
    '    if minIdx != i then',
    '      swap(A[i], A[minIdx])',
  ],
};

/**
 * Performs Selection Sort on the given array, recording each step as an AnimationStep.
 * Repeatedly finds the minimum in the unsorted region and swaps it into position.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = selectionSort([64, 25, 12, 22, 11]);
 * // result.finalState = [11, 12, 22, 25, 64]
 */
export function selectionSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  // WHY we copy the input: sorting mutates the array. Copying preserves the caller's
  // original data, following the immutable-input convention of these engine functions.
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

  // WHY the outer loop runs n-1 times: after placing n-1 minimums, the last
  // remaining element is necessarily the largest and is already in position.
  // The invariant: after iteration i, array[0..i] contains the i+1 smallest
  // elements in sorted order.
  for (let i = 0; i < length - 1; i++) {
    let minIdx = i;

    // Mark the initial minimum candidate
    const scanDesc = i === 0
      ? `Start scanning for the minimum from index ${i}. Selection Sort always finds the smallest unsorted element and places it next — like picking the shortest student from the line.`
      : `Scan for the minimum starting at index ${i}, current candidate = ${array[i]}.`;
    addStep(
      scanDesc,
      3,
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

    // WHY we must scan the entire unsorted region: unlike Insertion Sort which
    // can stop early, Selection Sort needs to check every remaining element to
    // guarantee it finds the true minimum. This is why it is always O(n^2)
    // comparisons regardless of input order.
    for (let j = i + 1; j < length; j++) {
      comparisons++;
      reads += 2;

      // Compare current with minimum
      const cmpDesc = comparisons === 1
        ? `Compare ${array[j]} with current min ${array[minIdx]}. We check every unsorted element to guarantee we find the true minimum — no shortcuts.`
        : `Compare ${array[j]} with min ${array[minIdx]} — ${array[j] < array[minIdx] ? 'new minimum!' : 'min unchanged'}.`;
      addStep(
        cmpDesc,
        5,
        [
          {
            targetId: `element-${j}`,
            property: 'highlight',
            from: 'default',
            to: 'comparing',
            easing: 'ease-out',
          },
          {
            targetId: `element-${minIdx}`,
            property: 'highlight',
            from: minIdx === i ? 'active' : 'pivot',
            to: 'comparing',
            easing: 'ease-out',
          },
        ],
        300,
      );

      if (array[j] < array[minIdx]) {
        // New minimum found
        const oldMin = minIdx;
        minIdx = j;

        addStep(
          `New minimum found: arr[${j}]=${array[j]} < arr[${oldMin}]=${array[oldMin]}`,
          6,
          [
            {
              targetId: `element-${j}`,
              property: 'highlight',
              from: 'comparing',
              to: 'pivot',
              easing: 'ease-out',
            },
            {
              targetId: `element-${oldMin}`,
              property: 'highlight',
              from: 'comparing',
              to: 'default',
              easing: 'ease-out',
            },
          ],
          300,
        );
      }
    }

    // WHY we check minIdx !== i: if the minimum is already at position i, swapping
    // it with itself is a wasted write. This guard is a micro-optimization but also
    // makes the "at most n-1 swaps" guarantee cleaner — we only swap when needed.
    if (minIdx !== i) {
      // WHY Selection Sort minimizes swaps: exactly one swap per pass places the
      // minimum directly into its final position. At most n-1 swaps total — ideal
      // when write cost is high (e.g., flash memory with limited write endurance).
      const temp = array[i];
      array[i] = array[minIdx];
      array[minIdx] = temp;
      swaps++;
      writes += 2;

      const swapDesc = swaps === 1
        ? `Swap ${array[minIdx]} into position ${i} — the minimum (${array[i]}) goes to its final sorted spot. Selection Sort does at most n-1 swaps total.`
        : `Swap ${array[minIdx]} with minimum ${array[i]} at position ${i}.`;
      addStep(
        swapDesc,
        8,
        [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'active',
            to: 'swapping',
            easing: 'spring',
          },
          {
            targetId: `element-${minIdx}`,
            property: 'highlight',
            from: 'pivot',
            to: 'swapping',
            easing: 'spring',
          },
          {
            targetId: `element-${i}`,
            property: 'position',
            from: i,
            to: minIdx,
            easing: 'spring',
          },
          {
            targetId: `element-${minIdx}`,
            property: 'position',
            from: minIdx,
            to: i,
            easing: 'spring',
          },
        ],
        450,
      );
    }

    // Mark as sorted
    addStep(
      `Position ${i} is now sorted with value ${array[i]}`,
      8,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'swapping',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      250,
    );
  }

  // Mark the last element as sorted
  addStep(
    `Last element at index ${length - 1} is in its sorted position`,
    8,
    [
      {
        targetId: `element-${length - 1}`,
        property: 'highlight',
        from: 'default',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    200,
  );

  return { config: CONFIG, steps, finalState: array };
}
