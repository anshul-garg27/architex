// ─────────────────────────────────────────────────────────────
// Architex — Merge Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'merge-sort',
  name: 'Merge Sort',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  stable: true,
  inPlace: false,
  description:
    'What if you could sort a million numbers by only ever merging two already-sorted lists? That is the key insight of Merge Sort. Split the array in half, sort each half recursively, then merge by always taking the smaller front element. This divide-conquer-combine strategy guarantees O(n log n) every time. Use when you need guaranteed worst-case performance, stability, or are sorting linked lists. Used in: Python Timsort (hybrid), Java Arrays.sort for objects, external sorting of files too large for memory. Remember: "Split, sort halves, merge. Always O(n log n). The safe choice."',
  comparisonGuide:
    'vs Quick Sort: Merge is stable and always O(n log n), but uses O(n) extra space. Quick Sort is faster on average but O(n^2) worst case.',
  productionNote:
    "Python's list.sort() uses Timsort -- a hybrid of Merge Sort and Insertion Sort that finds natural runs in data.",
  pseudocode: [
    'procedure mergeSort(A, left, right)',
    '  if left >= right then return',
    '  mid = (left + right) / 2',
    '  mergeSort(A, left, mid)',
    '  mergeSort(A, mid+1, right)',
    '  merge(A, left, mid, right)',
    '',
    'procedure merge(A, left, mid, right)',
    '  create temp arrays L, R',
    '  copy A[left..mid] into L',
    '  copy A[mid+1..right] into R',
    '  i = 0, j = 0, k = left',
    '  while i < len(L) and j < len(R)',
    '    if L[i] <= R[j] then A[k] = L[i]; i++',
    '    else A[k] = R[j]; j++',
    '    k++',
    '  copy remaining elements',
  ],
};

interface StepContext {
  steps: AnimationStep[];
  stepId: number;
  comparisons: number;
  swaps: number;
  reads: number;
  writes: number;
}

function addStep(
  ctx: StepContext,
  description: string,
  pseudocodeLine: number,
  mutations: VisualMutation[],
  duration: number,
  arraySnapshot?: number[],
): void {
  ctx.steps.push({
    id: ctx.stepId++,
    description,
    pseudocodeLine,
    mutations,
    complexity: {
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
      reads: ctx.reads,
      writes: ctx.writes,
    },
    duration,
    arraySnapshot,
  });
}

// WHY merging two sorted halves is O(n): both halves are already sorted (guaranteed
// by deeper recursion). We just walk two pointers, always picking the smaller front
// element. Each element is compared at most once during this merge — that's the key
// insight that makes Merge Sort O(n log n) overall: log n levels, each doing O(n) work.
function merge(
  a: number[],
  left: number,
  mid: number,
  right: number,
  ctx: StepContext,
  depth: number,
): void {
  // WHY we copy to temporary arrays: merging in-place is possible but complex.
  // Using temp arrays lets us overwrite the original positions without losing data.
  // This is the source of Merge Sort's O(n) extra space.
  const leftArr = a.slice(left, mid + 1);
  const rightArr = a.slice(mid + 1, right + 1);
  ctx.reads += right - left + 1;

  addStep(
    ctx,
    `Merge subarrays [${left}..${mid}] and [${mid + 1}..${right}] (depth ${depth})`,
    7,
    [
      ...Array.from({ length: mid - left + 1 }, (_, i) => ({
        targetId: `element-${left + i}`,
        property: 'highlight' as const,
        from: 'default' as const,
        to: 'active' as const,
        easing: 'ease-out' as const,
      })),
      ...Array.from({ length: right - mid }, (_, i) => ({
        targetId: `element-${mid + 1 + i}`,
        property: 'highlight' as const,
        from: 'default' as const,
        to: 'active' as const,
        easing: 'ease-out' as const,
      })),
    ],
    300,
    [...a],
  );

  let i = 0;
  let j = 0;
  let k = left;

  while (i < leftArr.length && j < rightArr.length) {
    ctx.comparisons++;
    ctx.reads += 2;

    const mergeCompareDesc = ctx.comparisons === 1
      ? `Compare L[${i}]=${leftArr[i]} with R[${j}]=${rightArr[j]}. Both halves are already sorted, so we just take the smaller front element. This is why Merge Sort is stable — equal elements from the left half go first.`
      : `Compare L[${i}]=${leftArr[i]} with R[${j}]=${rightArr[j]} — take ${leftArr[i] <= rightArr[j] ? leftArr[i] : rightArr[j]}.`;
    addStep(
      ctx,
      mergeCompareDesc,
      12,
      [
        {
          targetId: `element-${k}`,
          property: 'highlight',
          from: 'active',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      400,
      [...a],
    );

    // WHY <= preserves stability: when left and right elements are equal, we
    // take from the left half first, preserving the original relative order
    // of equal elements — this is what makes Merge Sort a stable sort.
    if (leftArr[i] <= rightArr[j]) {
      a[k] = leftArr[i];
      ctx.writes++;

      addStep(
        ctx,
        `Place L[${i}]=${leftArr[i]} at position ${k}`,
        13,
        [
          {
            targetId: `element-${k}`,
            property: 'label',
            from: a[k],
            to: leftArr[i],
            easing: 'spring',
          },
          {
            targetId: `element-${k}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'spring',
          },
        ],
        350,
        [...a],
      );

      i++;
    } else {
      a[k] = rightArr[j];
      ctx.writes++;

      addStep(
        ctx,
        `Place R[${j}]=${rightArr[j]} at position ${k}`,
        14,
        [
          {
            targetId: `element-${k}`,
            property: 'label',
            from: a[k],
            to: rightArr[j],
            easing: 'spring',
          },
          {
            targetId: `element-${k}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'spring',
          },
        ],
        350,
        [...a],
      );

      j++;
    }
    k++;
  }

  while (i < leftArr.length) {
    a[k] = leftArr[i];
    ctx.writes++;
    ctx.reads++;

    addStep(
      ctx,
      `Copy remaining L[${i}]=${leftArr[i]} to position ${k}`,
      16,
      [
        {
          targetId: `element-${k}`,
          property: 'label',
          from: a[k],
          to: leftArr[i],
          easing: 'ease-out',
        },
      ],
      250,
      [...a],
    );

    i++;
    k++;
  }

  while (j < rightArr.length) {
    a[k] = rightArr[j];
    ctx.writes++;
    ctx.reads++;

    addStep(
      ctx,
      `Copy remaining R[${j}]=${rightArr[j]} to position ${k}`,
      16,
      [
        {
          targetId: `element-${k}`,
          property: 'label',
          from: a[k],
          to: rightArr[j],
          easing: 'ease-out',
        },
      ],
      250,
      [...a],
    );

    j++;
    k++;
  }

  // Merge complete — mark as milestone
  ctx.steps.push({
    id: ctx.stepId++,
    description: `Merge complete for [${left}..${right}]`,
    pseudocodeLine: 5,
    mutations: Array.from({ length: right - left + 1 }, (_, idx) => ({
      targetId: `element-${left + idx}`,
      property: 'highlight' as const,
      from: 'swapping' as const,
      to: 'default' as const,
      easing: 'ease-out' as const,
    })),
    complexity: {
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
      reads: ctx.reads,
      writes: ctx.writes,
    },
    duration: 250,
    milestone: `Merge complete for [${left}..${right}]`,
    arraySnapshot: [...a],
  });
}

function mergeSortRecursive(
  a: number[],
  left: number,
  right: number,
  ctx: StepContext,
  depth: number,
): void {
  // WHY base case is left >= right: a single element (left == right) or empty
  // range is trivially sorted. This is the recursion anchor that bottoms out
  // the divide step.
  if (left >= right) return;

  // WHY we split at the midpoint: halving ensures at most log2(n) recursion
  // levels. Unequal splits (like Quick Sort's worst case) would degrade to O(n^2).
  const mid = Math.floor((left + right) / 2);

  // Divide step
  const divideDesc = depth === 0
    ? `Split [${left}..${right}] at midpoint ${mid}. Divide-and-conquer: by splitting in half each time, we create only log2(n) levels of recursion. Each level will do O(n) work during the merge.`
    : `Split [${left}..${right}] at mid=${mid} (depth ${depth}).`;
  addStep(
    ctx,
    divideDesc,
    2,
    [
      {
        targetId: `element-${mid}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      },
    ],
    300,
    [...a],
  );

  mergeSortRecursive(a, left, mid, ctx, depth + 1);
  mergeSortRecursive(a, mid + 1, right, ctx, depth + 1);
  merge(a, left, mid, right, ctx, depth);
}

/**
 * Performs Merge Sort on the given array, recording each step as an AnimationStep.
 * Uses recursive divide-and-conquer: split in half, sort each, merge sorted halves.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = mergeSort([38, 27, 43, 3, 9, 82, 10]);
 * // result.finalState = [3, 9, 10, 27, 38, 43, 82]
 */
export function mergeSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const ctx: StepContext = {
    steps: [],
    stepId: 0,
    comparisons: 0,
    swaps: 0,
    reads: 0,
    writes: 0,
  };

  mergeSortRecursive(a, 0, a.length - 1, ctx, 0);

  // Mark all elements as sorted
  for (let i = 0; i < a.length; i++) {
    addStep(
      ctx,
      `Array is fully sorted`,
      0,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      200,
      [...a],
    );
  }

  return { config: CONFIG, steps: ctx.steps, finalState: a };
}
