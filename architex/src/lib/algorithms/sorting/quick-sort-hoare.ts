// -----------------------------------------------------------------
// Architex -- Quick Sort (Hoare Partition) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'quick-sort-hoare',
  name: 'Quick Sort (Hoare)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n^2)',
  },
  spaceComplexity: 'O(log n)',
  stable: false,
  inPlace: true,
  difficulty: 'advanced',
  prerequisites: ['quick-sort'],
  description:
    "Hoare's original partition scheme \u2014 two pointers start at opposite ends and walk toward each other, swapping elements that are on the wrong side of the pivot. Fewer swaps than Lomuto (~n/3 vs ~n/2 average), but harder to implement correctly. The pivot doesn't end up at its final position \u2014 it's just somewhere in the correct partition. Used in most production quicksort implementations.",
  comparisonGuide:
    'vs Lomuto: ~3x fewer swaps on average, but pivot is not placed at final position. Harder to implement correctly. Preferred in production (GCC, glibc qsort).',
  productionNote:
    'Most production quicksorts (GCC, glibc) use Hoare partition with median-of-three pivot selection and fall back to insertion sort for small subarrays.',
  pseudocode: [
    'procedure quickSortHoare(A, low, high)',
    '  if low < high then',
    '    p = hoarePartition(A, low, high)',
    '    quickSortHoare(A, low, p)',
    '    quickSortHoare(A, p + 1, high)',
    '',
    'procedure hoarePartition(A, low, high)',
    '  pivot = A[low]',
    '  i = low - 1',
    '  j = high + 1',
    '  loop',
    '    do i = i + 1 while A[i] < pivot',
    '    do j = j - 1 while A[j] > pivot',
    '    if i >= j then return j',
    '    swap(A[i], A[j])',
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
  milestone?: string,
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
    ...(milestone ? { milestone } : {}),
  });
}

// WHY Hoare picks A[low] as pivot: the two pointers walk inward from opposite
// ends, so using the first element as pivot gives a clean invariant:
// everything left of j is <= pivot, everything right of i is >= pivot.
// Unlike Lomuto, the pivot does NOT end at its final sorted position --
// it just ends up somewhere in the correct partition.
function hoarePartition(
  a: number[],
  low: number,
  high: number,
  ctx: StepContext,
  depth: number,
): number {
  const pivot = a[low];
  ctx.reads++;

  // Show pivot selection
  const pivotDesc = depth === 0
    ? `Select pivot = ${pivot} (the first element). Hoare scheme uses the leftmost element. Two pointers will converge from opposite ends, swapping elements on the wrong side.`
    : `Select pivot = ${pivot} at index ${low} (depth ${depth}). Two pointers converge inward.`;
  addStep(
    ctx,
    pivotDesc,
    7,
    [
      {
        targetId: `element-${low}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      },
    ],
    400,
  );

  let i = low - 1;
  let j = high + 1;

  // Show initial pointer positions
  addStep(
    ctx,
    `Left pointer starts before index ${low}, right pointer starts after index ${high}. They will walk toward each other.`,
    8,
    [
      {
        targetId: `element-${low}`,
        property: 'highlight',
        from: 'pivot',
        to: 'pivot',
        easing: 'ease-out',
      },
      {
        targetId: `element-${high}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      },
    ],
    350,
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Advance left pointer: find element >= pivot
    do {
      i++;
      ctx.comparisons++;
      ctx.reads++;
    } while (a[i] < pivot);

    // Show left pointer found its stop
    addStep(
      ctx,
      `Left pointer stops at index ${i} (value ${a[i]} >= pivot ${pivot}). Scanning left-to-right for an element that belongs on the right side.`,
      11,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      350,
    );

    // Advance right pointer: find element <= pivot
    do {
      j--;
      ctx.comparisons++;
      ctx.reads++;
    } while (a[j] > pivot);

    // Show right pointer found its stop
    addStep(
      ctx,
      `Right pointer stops at index ${j} (value ${a[j]} <= pivot ${pivot}). Scanning right-to-left for an element that belongs on the left side.`,
      12,
      [
        {
          targetId: `element-${j}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      350,
    );

    // If pointers have crossed, partition is done
    if (i >= j) {
      addStep(
        ctx,
        `Pointers crossed (left=${i} >= right=${j}). Partition complete \u2014 return ${j} as the partition point. Everything at or left of ${j} is <= ${pivot}, everything right is >= ${pivot}.`,
        13,
        [
          {
            targetId: `element-${j}`,
            property: 'highlight',
            from: 'comparing',
            to: 'active',
            easing: 'ease-out',
          },
        ],
        400,
        `Partition at index ${j} (pivot ${pivot})`,
      );
      return j;
    }

    // Swap elements that are on the wrong side
    const preI = a[i];
    const preJ = a[j];
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
    ctx.swaps++;
    ctx.writes += 2;

    const swapDesc = ctx.swaps === 1
      ? `Swap ${preI} (index ${i}) and ${preJ} (index ${j}) \u2014 both are on the wrong side of pivot ${pivot}. This is where Hoare shines: each swap fixes TWO misplaced elements at once.`
      : `Swap ${preI} and ${preJ} \u2014 fixing both sides simultaneously.`;
    addStep(
      ctx,
      swapDesc,
      14,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'comparing',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${j}`,
          property: 'highlight',
          from: 'comparing',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${i}`,
          property: 'position',
          from: i,
          to: j,
          easing: 'spring',
        },
        {
          targetId: `element-${j}`,
          property: 'position',
          from: j,
          to: i,
          easing: 'spring',
        },
      ],
      450,
    );
  }
}

// WHY Hoare recurses on [low..p] and [p+1..high] instead of excluding the
// pivot: the pivot is NOT guaranteed to be at position p. It could be anywhere
// in the left partition. So we must include p in the left recursive call.
function quickSortHoareRecursive(
  a: number[],
  low: number,
  high: number,
  ctx: StepContext,
  depth: number,
): void {
  if (low < high) {
    const p = hoarePartition(a, low, high, ctx, depth);
    quickSortHoareRecursive(a, low, p, ctx, depth + 1);
    quickSortHoareRecursive(a, p + 1, high, ctx, depth + 1);
  } else if (low === high && low >= 0 && low < a.length) {
    // Single element is already sorted
    addStep(
      ctx,
      `Element at index ${low} is in its sorted position`,
      0,
      [
        {
          targetId: `element-${low}`,
          property: 'highlight',
          from: 'default',
          to: 'sorted',
          easing: 'ease-out',
        },
      ],
      200,
    );
  }
}

/**
 * Performs Quick Sort using Hoare's partition scheme, recording each step.
 * Two pointers converge from opposite ends, swapping misplaced elements.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = quickSortHoare([10, 7, 8, 9, 1, 5]);
 * // result.finalState = [1, 5, 7, 8, 9, 10]
 */
export function quickSortHoare(arr: number[]): AlgorithmResult {
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

  quickSortHoareRecursive(a, 0, a.length - 1, ctx, 0);

  // Final step: mark all as sorted
  const finalMutations: VisualMutation[] = a.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'default' as string,
    to: 'sorted' as string,
    easing: 'ease-out' as const,
  }));

  ctx.steps.push({
    id: ctx.stepId++,
    description: `Sort complete! Hoare partition used ${ctx.swaps} swaps and ${ctx.comparisons} comparisons. Lomuto would typically need ~50% more swaps on this input.`,
    pseudocodeLine: 0,
    mutations: finalMutations,
    complexity: {
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
      reads: ctx.reads,
      writes: ctx.writes,
    },
    duration: 500,
  });

  return { config: CONFIG, steps: ctx.steps, finalState: a };
}
