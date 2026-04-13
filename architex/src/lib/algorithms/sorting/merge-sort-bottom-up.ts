// ─────────────────────────────────────────────────────────────
// Architex — Merge Sort (Bottom-Up) with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const CONFIG: AlgorithmConfig = {
  id: 'merge-sort-bottom-up',
  name: 'Merge Sort (Bottom-Up)',
  category: 'sorting',
  timeComplexity: {
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  spaceComplexity: 'O(n)',
  stable: true,
  inPlace: false,
  difficulty: 'advanced',
  prerequisites: ['merge-sort'],
  description:
    'What if Merge Sort didn\'t use recursion at all? Bottom-up starts with single elements, merges pairs, then groups of 4, then 8 -- building up instead of breaking down. Same O(n log n) performance, but avoids recursion overhead and stack overflow risk on deep arrays.',
  comparisonGuide:
    'vs Merge Sort (top-down): same O(n log n) and stability, but iterative -- no recursion overhead or stack overflow risk on very large arrays.',
  pseudocode: [
    'procedure mergeSortBottomUp(A)',
    '  n = length(A)',
    '  for width = 1; width < n; width *= 2 do',
    '    for i = 0; i < n; i += 2 * width do',
    '      left = i',
    '      mid = min(i + width - 1, n - 1)',
    '      right = min(i + 2 * width - 1, n - 1)',
    '      if mid < right then',
    '        merge(A, left, mid, right)',
    '  return A',
    '',
    'procedure merge(A, left, mid, right)',
    '  create temp arrays L, R',
    '  merge L and R back into A[left..right]',
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
    ...(milestone ? { milestone } : {}),
    arraySnapshot,
  });
}

// Merge two sorted subarrays a[left..mid] and a[mid+1..right]
function merge(
  a: number[],
  left: number,
  mid: number,
  right: number,
  ctx: StepContext,
  width: number,
): void {
  const leftArr = a.slice(left, mid + 1);
  const rightArr = a.slice(mid + 1, right + 1);
  ctx.reads += right - left + 1;

  addStep(
    ctx,
    `Merge subarrays [${left}..${mid}] and [${mid + 1}..${right}] (width ${width})`,
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
    undefined,
    [...a],
  );

  let i = 0;
  let j = 0;
  let k = left;

  while (i < leftArr.length && j < rightArr.length) {
    ctx.comparisons++;
    ctx.reads += 2;

    addStep(
      ctx,
      `Compare L[${i}]=${leftArr[i]} with R[${j}]=${rightArr[j]} -- take ${leftArr[i] <= rightArr[j] ? leftArr[i] : rightArr[j]}.`,
      11,
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
      undefined,
      [...a],
    );

    if (leftArr[i] <= rightArr[j]) {
      a[k] = leftArr[i];
      ctx.writes++;

      addStep(
        ctx,
        `Place L[${i}]=${leftArr[i]} at position ${k}`,
        11,
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
        undefined,
        [...a],
      );

      i++;
    } else {
      a[k] = rightArr[j];
      ctx.writes++;

      addStep(
        ctx,
        `Place R[${j}]=${rightArr[j]} at position ${k}`,
        11,
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
        undefined,
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
      12,
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
      undefined,
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
      12,
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
      undefined,
      [...a],
    );

    j++;
    k++;
  }

  // Merge complete
  addStep(
    ctx,
    `Merge complete for [${left}..${right}]`,
    8,
    Array.from({ length: right - left + 1 }, (_, idx) => ({
      targetId: `element-${left + idx}`,
      property: 'highlight' as const,
      from: 'swapping' as const,
      to: 'default' as const,
      easing: 'ease-out' as const,
    })),
    250,
    `Merge complete for [${left}..${right}]`,
    [...a],
  );
}

/**
 * Performs iterative bottom-up Merge Sort on the given array, recording each step.
 * Starts with single elements, merges pairs into groups of 2, then 4, then 8, etc.
 *
 * @param arr - The array of numbers to sort
 * @returns AlgorithmResult containing the sorted array and animation steps
 *
 * @example
 * const result = mergeSortBottomUp([38, 27, 43, 3, 9, 82, 10]);
 * // result.finalState = [3, 9, 10, 27, 38, 43, 82]
 */
export function mergeSortBottomUp(arr: number[]): AlgorithmResult {
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

  // Iterative doubling of merge size
  for (let width = 1; width < n; width *= 2) {
    addStep(
      ctx,
      `Pass with width=${width}: merging pairs of ${width}-element subarrays into ${width * 2}-element sorted groups.`,
      2,
      [],
      300,
      `Width = ${width}`,
      [...a],
    );

    for (let i = 0; i < n; i += 2 * width) {
      const left = i;
      const mid = Math.min(i + width - 1, n - 1);
      const right = Math.min(i + 2 * width - 1, n - 1);

      if (mid < right) {
        merge(a, left, mid, right, ctx, width);
      }
    }
  }

  // Mark all elements as sorted
  for (let i = 0; i < a.length; i++) {
    addStep(
      ctx,
      'Array is fully sorted',
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
      undefined,
      [...a],
    );
  }

  return { config: CONFIG, steps: ctx.steps, finalState: a };
}
