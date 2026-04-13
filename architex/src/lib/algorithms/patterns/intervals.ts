// -----------------------------------------------------------------
// Architex -- Merge Intervals Pattern with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const INTERVAL_MERGE_CONFIG: AlgorithmConfig = {
  id: 'interval-merge',
  name: 'Merge Intervals',
  category: 'sorting',
  timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
  spaceComplexity: 'O(n)',
  stable: true,
  inPlace: false,
  description:
    'Given a list of meeting times, which ones overlap? Sort by start time, then scan \u2014 if the current interval overlaps the previous, merge them. O(n log n) for the sort, O(n) for the scan. Used in: calendar scheduling, genomic sequence assembly, network packet coalescing.',
  pseudocode: [
    'procedure mergeIntervals(intervals)',
    '  sort intervals by start time',
    '  merged = [intervals[0]]',
    '  for i = 1 to length(intervals) - 1 do',
    '    last = merged[end]',
    '    current = intervals[i]',
    '    if current.start <= last.end then',
    '      last.end = max(last.end, current.end)',
    '    else',
    '      merged.append(current)',
    '  return merged',
  ],
  complexityIntuition:
    'The bottleneck is sorting: O(n log n). The merge scan is a single pass through the sorted intervals, O(n). Total: O(n log n). Space is O(n) for the merged output in the worst case (no overlaps).',
  difficulty: 'intermediate',
  whenToUse:
    'Use when you need to find overlapping ranges, consolidate time slots, or detect conflicts in scheduling. The sort-then-scan pattern applies to any interval overlap problem.',
  interviewTips:
    'Classic LC Medium. Edge cases: empty input, single interval, fully nested intervals, touching endpoints ([1,3],[3,5]). Follow-up: insert an interval into a sorted non-overlapping list.',
  commonMistakes: [
    'Forgetting to sort by start time first.',
    'Using current.start < last.end instead of <= (missing touching intervals).',
    'Not taking max(last.end, current.end) when merging \u2014 the current interval could be fully nested inside the last.',
  ],
};

/** Default intervals for demonstration. */
export const INTERVAL_MERGE_DEFAULT: [number, number][] = [
  [1, 3], [2, 6], [8, 10], [15, 18], [9, 12],
];

/**
 * Merges overlapping intervals, recording each step for visualization.
 * The arr parameter is used to derive intervals for visualization compatibility.
 *
 * @param arr - Array of numbers (used for engine compatibility; intervals are derived or use defaults)
 * @param intervals - Optional explicit intervals to merge
 * @returns AlgorithmResult containing the merged intervals encoded as finalState
 *
 * @example
 * const result = intervalMerge([], [[1,3],[2,6],[8,10],[15,18]]);
 * // merged: [[1,6],[8,10],[15,18]]
 */
export function intervalMerge(
  arr: number[],
  intervals?: [number, number][],
): AlgorithmResult {
  // Use provided intervals, or derive from arr (pairs), or use defaults
  let input: [number, number][];
  if (intervals && intervals.length > 0) {
    input = intervals.map(([s, e]) => [s, e]);
  } else if (arr.length >= 2) {
    // Interpret arr as flattened pairs: [s1,e1, s2,e2, ...]
    input = [];
    for (let i = 0; i + 1 < arr.length; i += 2) {
      input.push([arr[i], arr[i + 1]]);
    }
    if (input.length === 0) input = [...INTERVAL_MERGE_DEFAULT];
  } else {
    input = [...INTERVAL_MERGE_DEFAULT];
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Step 0: overview
  const inputStr = input.map(([s, e]) => `[${s},${e}]`).join(', ');
  steps.push({
    id: stepId++,
    description:
      `Merge overlapping intervals: {${inputStr}}. Step 1: sort by start time. Step 2: scan and merge overlaps.`,
    pseudocodeLine: 0,
    mutations: input.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default' as string,
      to: 'active' as string,
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 600,
  });

  // Step 1: sort by start time
  input.sort((a, b) => a[0] - b[0]);
  const sortedStr = input.map(([s, e]) => `[${s},${e}]`).join(', ');
  comparisons += input.length; // approximate for the sort

  steps.push({
    id: stepId++,
    description:
      `Sorted by start time: {${sortedStr}}. Now scan left to right \u2014 if the current interval overlaps the last merged one, extend it.`,
    pseudocodeLine: 1,
    mutations: input.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'active' as string,
      to: 'default' as string,
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Step 2: merge scan
  const merged: [number, number][] = [input[0]];
  reads++;
  writes++;

  // Show first interval added to merged
  steps.push({
    id: stepId++,
    description:
      `Start merged list with [${input[0][0]},${input[0][1]}]. This is our first interval \u2014 nothing to compare against yet.`,
    pseudocodeLine: 2,
    mutations: [
      {
        targetId: `element-0`,
        property: 'highlight',
        from: 'default',
        to: 'found',
        easing: 'spring',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  for (let i = 1; i < input.length; i++) {
    const last = merged[merged.length - 1];
    const current = input[i];
    reads += 2;
    comparisons++;

    // Show comparison
    steps.push({
      id: stepId++,
      description:
        `Compare current [${current[0]},${current[1]}] with last merged [${last[0]},${last[1]}]. Does ${current[0]} <= ${last[1]}?`,
      pseudocodeLine: 6,
      mutations: [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    if (current[0] <= last[1]) {
      // Merge: extend the last interval
      const oldEnd = last[1];
      last[1] = Math.max(last[1], current[1]);
      writes++;

      steps.push({
        id: stepId++,
        description:
          `Overlap! ${current[0]} <= ${oldEnd}. Merge: extend [${last[0]},${oldEnd}] to [${last[0]},${last[1]}] (taking max of ${oldEnd} and ${current[1]}).`,
        pseudocodeLine: 7,
        mutations: [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'comparing',
            to: 'swapping',
            easing: 'spring',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 450,
      });
    } else {
      // No overlap: add as new interval
      merged.push([current[0], current[1]]);
      writes++;

      steps.push({
        id: stepId++,
        description:
          `No overlap: ${current[0]} > ${last[1]}. Add [${current[0]},${current[1]}] as a new merged interval. Gap between the two ranges.`,
        pseudocodeLine: 9,
        mutations: [
          {
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'comparing',
            to: 'found',
            easing: 'spring',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
    }
  }

  // Final step
  const mergedStr = merged.map(([s, e]) => `[${s},${e}]`).join(', ');
  const finalMutations: VisualMutation[] = input.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'default' as string,
    to: 'sorted' as string,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description:
      `Done! ${input.length} intervals merged into ${merged.length}: {${mergedStr}}. O(n log n) for sorting + O(n) for the scan.`,
    pseudocodeLine: 10,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Encode merged intervals as flat array for finalState
  const finalState: number[] = merged.flat();

  return { config: INTERVAL_MERGE_CONFIG, steps, finalState };
}
