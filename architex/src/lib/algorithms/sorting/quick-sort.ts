// ─────────────────────────────────────────────────────────────
// Architex — Quick Sort (Lomuto Partition) with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'quick-sort',
  name: 'Quick Sort',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n^2)',
  },
  spaceComplexity: 'O(log n)',
  stable: false,
  inPlace: true,
  description:
    'How does your computer sort millions of files? Pick a pivot, put smaller items left, bigger right, repeat on each half. Like organizing a bookshelf: grab any book, shorter left, taller right. Each partition halves the problem. Uses Lomuto scheme (last element as pivot). Use as default general-purpose sort; prefer Merge Sort when stability or guaranteed O(n log n) is needed. Used in: C stdlib qsort, most language standard libraries, database engines. Remember: "Pick a pivot. Smaller left, bigger right. Repeat."',
  comparisonGuide:
    'vs Merge Sort: faster average case, in-place (O(log n) space), but not stable and O(n^2) worst case. Use Merge Sort for guaranteed performance.',
  productionNote:
    "C++ std::sort uses Introsort -- Quick Sort that falls back to Heap Sort if recursion gets too deep, guaranteeing O(n log n).",
  pseudocode: [
    'procedure quickSort(A, low, high)',
    '  if low < high then',
    '    pivotIndex = partition(A, low, high)',
    '    quickSort(A, low, pivotIndex - 1)',
    '    quickSort(A, pivotIndex + 1, high)',
    '',
    'procedure partition(A, low, high)',
    '  pivot = A[high]',
    '  i = low - 1',
    '  for j = low to high - 1 do',
    '    if A[j] <= pivot then',
    '      i = i + 1',
    '      swap(A[i], A[j])',
    '  swap(A[i+1], A[high])',
    '  return i + 1',
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
  });
}

// WHY Lomuto partition picks the last element: it simplifies the invariant.
// Everything in array[low..partitionBoundary] is <= pivot, and everything in
// array[partitionBoundary+1..j-1] is > pivot. One pointer (i) tracks the
// boundary; one pointer (j) scans left to right.
function partition(
  a: number[],
  low: number,
  high: number,
  ctx: StepContext,
  depth: number,
): number {
  const pivot = a[high];
  ctx.reads++;

  // Show pivot selection
  const pivotDesc = depth === 0
    ? `Select pivot = ${pivot} (the last element). Lomuto scheme always picks the rightmost element. Every other element will be compared against this pivot to decide which side it belongs on.`
    : `Select pivot = ${pivot} at index ${high} (depth ${depth}).`;
  addStep(
    ctx,
    pivotDesc,
    7,
    [
      {
        targetId: `element-${high}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      },
    ],
    400,
  );

  // WHY i starts at low-1: the "smaller than pivot" region is initially empty.
  // Each time we find an element <= pivot, we increment i first then swap,
  // growing the region by exactly one.
  let i = low - 1;

  for (let j = low; j < high; j++) {
    ctx.comparisons++;
    ctx.reads++;

    // Comparison step
    const qcDesc = ctx.comparisons === 1
      ? `Is ${a[j]} <= ${pivot}? Elements <= pivot go to the LEFT partition; elements > pivot stay RIGHT.`
      : `Compare ${a[j]} with pivot ${pivot} — ${a[j] <= pivot ? 'left partition' : 'stays right'}.`;
    addStep(
      ctx,
      qcDesc,
      10,
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

    if (a[j] <= pivot) {
      i++;
      if (i !== j) {
        // Capture pre-swap values for accurate step description
        const preI = a[i];
        const preJ = a[j];

        // Swap step
        const temp = a[i];
        a[i] = a[j];
        a[j] = temp;
        ctx.swaps++;
        ctx.writes += 2;

        const swapLDesc = ctx.swaps === 1
          ? `${preJ} <= ${pivot}, so swap it into the left partition at position ${i}. This grows the "smaller-than-pivot" region by one.`
          : `Swap ${preI} and ${preJ} — moving ${preJ} into left partition.`;
        addStep(
          ctx,
          swapLDesc,
          12,
          [
            {
              targetId: `element-${i}`,
              property: 'highlight',
              from: 'default',
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
  }

  // WHY pivot goes to i+1: at this point, everything at indices [low..i] is <= pivot
  // and everything at [i+1..high-1] is > pivot. Placing the pivot at i+1 puts it
  // between the two partitions — its final sorted position, guaranteed.
  const pivotFinal = i + 1;
  if (pivotFinal !== high) {
    const temp = a[pivotFinal];
    a[pivotFinal] = a[high];
    a[high] = temp;
    ctx.swaps++;
    ctx.writes += 2;

    addStep(
      ctx,
      `Place pivot=${pivot} at its sorted position ${pivotFinal}`,
      13,
      [
        {
          targetId: `element-${pivotFinal}`,
          property: 'highlight',
          from: 'default',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${high}`,
          property: 'highlight',
          from: 'pivot',
          to: 'swapping',
          easing: 'spring',
        },
      ],
      450,
    );
  }

  // Mark pivot as sorted
  ctx.steps.push({
    id: ctx.stepId++,
    description: `Pivot ${pivot} is now at its final sorted position ${pivotFinal}`,
    pseudocodeLine: 14,
    mutations: [
      {
        targetId: `element-${pivotFinal}`,
        property: 'highlight',
        from: 'swapping',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    complexity: {
      comparisons: ctx.comparisons,
      swaps: ctx.swaps,
      reads: ctx.reads,
      writes: ctx.writes,
    },
    duration: 300,
    milestone: `Pivot ${pivot} placed at position ${pivotFinal}`,
  });

  return pivotFinal;
}

// WHY Quick Sort is fast in practice: partitioning divides the problem in two,
// and on average each partition is roughly half — giving O(n log n). The worst
// case O(n^2) happens when the pivot is always the min or max (already sorted
// input with Lomuto). Randomized pivot selection avoids this in production.
function quickSortRecursive(
  a: number[],
  low: number,
  high: number,
  ctx: StepContext,
  depth: number,
): void {
  if (low < high) {
    const pi = partition(a, low, high, ctx, depth);
    quickSortRecursive(a, low, pi - 1, ctx, depth + 1);
    quickSortRecursive(a, pi + 1, high, ctx, depth + 1);
  } else if (low === high && low >= 0 && low < a.length) {
    // Single element is already sorted
    addStep(
      ctx,
      `Element at index ${low} is in its sorted position`,
      1,
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
 * Performs Quick Sort (Lomuto partition) on the given array, recording each step.
 * Picks last element as pivot, partitions smaller left / bigger right, recurses.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = quickSort([10, 7, 8, 9, 1, 5]);
 * // result.finalState = [1, 5, 7, 8, 9, 10]
 */
export function quickSort(arr: number[]): AlgorithmResult {
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

  quickSortRecursive(a, 0, a.length - 1, ctx, 0);

  return { config: CONFIG, steps: ctx.steps, finalState: a };
}
