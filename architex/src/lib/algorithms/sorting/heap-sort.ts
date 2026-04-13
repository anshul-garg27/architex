// ─────────────────────────────────────────────────────────────
// Architex — Heap Sort with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'heap-sort',
  name: 'Heap Sort',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'What if you could always grab the biggest item instantly? A max-heap makes that possible. Think of a tournament bracket -- the winner rises to the top each round. Builds a max-heap, swaps the root to the end, re-heapifies the rest. Guaranteed O(n log n) with O(1) extra space. Use when memory is tight and worst-case guarantees matter; prefer Quick Sort for faster average-case. Used in: Linux kernel sort, priority queues in Dijkstra, embedded real-time systems. Remember: "Build heap, extract max, repeat. O(n log n) guaranteed, in-place."',
  productionNote:
    'Priority queues in practice use d-ary heaps (d=4 or 8) for better cache performance than binary heaps.',
  pseudocode: [
    'procedure heapSort(A)',
    '  n = length(A)',
    '  // Build max heap',
    '  for i = n/2 - 1 down to 0 do',
    '    heapify(A, n, i)',
    '  // Extract elements one by one',
    '  for i = n-1 down to 1 do',
    '    swap(A[0], A[i])',
    '    heapify(A, i, 0)',
    '',
    'procedure heapify(A, n, i)',
    '  largest = i',
    '  left = 2*i + 1',
    '  right = 2*i + 2',
    '  if left < n and A[left] > A[largest]',
    '    largest = left',
    '  if right < n and A[right] > A[largest]',
    '    largest = right',
    '  if largest != i then',
    '    swap(A[i], A[largest])',
    '    heapify(A, n, largest)',
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

function heapify(
  a: number[],
  heapSize: number,
  i: number,
  ctx: StepContext,
): void {
  let largest = i;
  const left = 2 * i + 1;
  const right = 2 * i + 2;

  // Compare with left child
  if (left < heapSize) {
    ctx.comparisons++;
    ctx.reads += 2;

    const heapCmpDesc = ctx.comparisons === 1
      ? `Compare node ${i} (${a[i]}) with left child ${left} (${a[left]}). In a max-heap, every parent must be larger than its children — like a tournament bracket where the winner always rises to the top.`
      : `Compare node ${i} (${a[i]}) with left child ${left} (${a[left]}).`;
    addStep(
      ctx,
      heapCmpDesc,
      14,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
        {
          targetId: `element-${left}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      350,
    );

    if (a[left] > a[largest]) {
      largest = left;
    }
  }

  // Compare with right child
  if (right < heapSize) {
    ctx.comparisons++;
    ctx.reads += 2;

    addStep(
      ctx,
      `Compare node ${largest} (${a[largest]}) with right child ${right} (${a[right]})`,
      16,
      [
        {
          targetId: `element-${largest}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
        {
          targetId: `element-${right}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      350,
    );

    if (a[right] > a[largest]) {
      largest = right;
    }
  }

  if (largest !== i) {
    // Capture pre-swap values for accurate step description
    const preI = a[i];
    const preLargest = a[largest];

    // Swap
    const temp = a[i];
    a[i] = a[largest];
    a[largest] = temp;
    ctx.swaps++;
    ctx.writes += 2;

    const heapSwapDesc = ctx.swaps === 1
      ? `Swap ${preI} with ${preLargest} — the larger child rises up to restore the max-heap property. This "sift down" repeats until the subtree is a valid heap.`
      : `Swap node ${i} (${preI}) with ${largest} (${preLargest}) — heapify.`;
    addStep(
      ctx,
      heapSwapDesc,
      19,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'comparing',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${largest}`,
          property: 'highlight',
          from: 'comparing',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${i}`,
          property: 'position',
          from: i,
          to: largest,
          easing: 'spring',
        },
        {
          targetId: `element-${largest}`,
          property: 'position',
          from: largest,
          to: i,
          easing: 'spring',
        },
      ],
      450,
    );

    // Recursively heapify the affected subtree
    heapify(a, heapSize, largest, ctx);
  }
}

/**
 * Performs Heap Sort on the given array, recording each step as an AnimationStep.
 * Builds a max-heap, then repeatedly extracts the maximum to the end.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = heapSort([12, 11, 13, 5, 6, 7]);
 * // result.finalState = [5, 6, 7, 11, 12, 13]
 */
export function heapSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const ctx: StepContext = {
    steps: [],
    stepId: 0,
    comparisons: 0,
    swaps: 0,
    reads: 0,
    writes: 0,
  };

  // Build max heap
  addStep(
    ctx,
    'Build max heap from unsorted array',
    2,
    [],
    300,
  );

  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    addStep(
      ctx,
      `Heapify subtree rooted at index ${i}`,
      4,
      [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      300,
    );
    heapify(a, n, i, ctx);
  }

  addStep(
    ctx,
    'Max heap built — begin extracting elements',
    5,
    [],
    400,
  );

  // Extract elements one by one
  for (let i = n - 1; i > 0; i--) {
    // Capture pre-swap values for accurate step description
    const preRoot = a[0];
    const preLast = a[i];

    // Swap root (max) with last unsorted element
    const temp = a[0];
    a[0] = a[i];
    a[i] = temp;
    ctx.swaps++;
    ctx.writes += 2;

    addStep(
      ctx,
      `Extract max: swap root ${preRoot} with position ${i} (${preLast})`,
      7,
      [
        {
          targetId: 'element-0',
          property: 'highlight',
          from: 'default',
          to: 'swapping',
          easing: 'spring',
        },
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'swapping',
          easing: 'spring',
        },
      ],
      450,
    );

    // Mark extracted element as sorted
    addStep(
      ctx,
      `Element ${a[i]} placed at final position ${i}`,
      7,
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

    // Heapify the reduced heap
    heapify(a, i, 0, ctx);
  }

  // Mark root as sorted
  addStep(
    ctx,
    'Element at index 0 is in its sorted position',
    7,
    [
      {
        targetId: 'element-0',
        property: 'highlight',
        from: 'default',
        to: 'sorted',
        easing: 'ease-out',
      },
    ],
    200,
  );

  return { config: CONFIG, steps: ctx.steps, finalState: a };
}
