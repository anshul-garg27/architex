// -----------------------------------------------------------------
// Architex -- Sliding Window (Max Sum Subarray of Size K) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const SLIDING_WINDOW_CONFIG: AlgorithmConfig = {
  id: 'sliding-window',
  name: 'Sliding Window (Max Sum Subarray)',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: false,
  description:
    'Find the subarray of size K with the maximum sum. Naive approach recalculates every window \u2014 O(n\u00B7K). Sliding window: compute the first window, then SLIDE it by subtracting the element leaving and adding the element entering. One pass, O(n). The window expands and contracts like a caterpillar. Used in: network throughput monitoring, moving averages in finance, longest substring without repeating characters.',
  pseudocode: [
    'procedure maxSumSubarray(A: list, K: number)',
    '  windowSum = sum(A[0..K-1])',
    '  maxSum = windowSum',
    '  bestStart = 0',
    '  for i = K to length(A) - 1 do',
    '    windowSum = windowSum - A[i - K] + A[i]',
    '    if windowSum > maxSum then',
    '      maxSum = windowSum',
    '      bestStart = i - K + 1',
    '  return (bestStart, maxSum)',
  ],
};

/** Default input array and window size. */
export const SLIDING_WINDOW_DEFAULT = [2, 1, 5, 1, 3, 2];
export const SLIDING_WINDOW_K = 3;

export function slidingWindow(arr: number[]): AlgorithmResult {
  const K = SLIDING_WINDOW_K;

  if (arr.length < K || K <= 0) {
    return { config: SLIDING_WINDOW_CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;

  // Initial overview step
  steps.push({
    id: stepId++,
    description:
      `Find the subarray of size ${K} with the maximum sum in [${a.join(', ')}]. Instead of recalculating every window, we slide: subtract the leaving element, add the entering one.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 600,
  });

  // Compute first window sum
  let windowSum = 0;
  const firstWindowMutations: VisualMutation[] = [];
  for (let i = 0; i < K; i++) {
    windowSum += a[i];
    reads++;
    firstWindowMutations.push({
      targetId: `element-${i}`,
      property: 'highlight',
      from: 'default',
      to: 'active',
      easing: 'ease-out',
    });
  }

  let maxSum = windowSum;
  let bestStart = 0;

  steps.push({
    id: stepId++,
    description:
      `First window: A[0..${K - 1}] = [${a.slice(0, K).join(', ')}]. Sum = ${windowSum}. This is our initial best.`,
    pseudocodeLine: 1,
    mutations: firstWindowMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  // Mark first window as current best
  const bestMutations: VisualMutation[] = [];
  for (let i = 0; i < K; i++) {
    bestMutations.push({
      targetId: `element-${i}`,
      property: 'highlight',
      from: 'active',
      to: 'found',
      easing: 'spring',
    });
  }

  steps.push({
    id: stepId++,
    description:
      `Best so far: sum = ${maxSum}, starting at index 0. Now slide the window one position at a time.`,
    pseudocodeLine: 2,
    mutations: bestMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 400,
  });

  // Slide the window
  for (let i = K; i < n; i++) {
    const leaving = i - K;
    const entering = i;
    reads += 2;

    // Clear previous window highlights
    const clearMutations: VisualMutation[] = [];
    for (let j = leaving; j < entering; j++) {
      const wasInBest = j >= bestStart && j < bestStart + K;
      clearMutations.push({
        targetId: `element-${j}`,
        property: 'highlight',
        from: wasInBest ? 'found' : 'active',
        to: j === leaving ? 'sorted' : 'default',
        easing: 'ease-out',
      });
    }

    // Slide: subtract leaving, add entering
    const prevSum = windowSum;
    windowSum = windowSum - a[leaving] + a[entering];
    comparisons++;

    // Highlight new window
    const slideMutations: VisualMutation[] = [];
    for (let j = leaving + 1; j <= entering; j++) {
      slideMutations.push({
        targetId: `element-${j}`,
        property: 'highlight',
        from: 'default',
        to: 'comparing',
        easing: 'ease-out',
      });
    }

    steps.push({
      id: stepId++,
      description:
        `Slide: remove A[${leaving}] = ${a[leaving]}, add A[${entering}] = ${a[entering]}. Window sum: ${prevSum} \u2212 ${a[leaving]} + ${a[entering]} = ${windowSum}.`,
      pseudocodeLine: 5,
      mutations: [...clearMutations, ...slideMutations],
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 400,
    });

    if (windowSum > maxSum) {
      maxSum = windowSum;
      bestStart = leaving + 1;

      // Mark new best window
      const newBestMutations: VisualMutation[] = [];
      for (let j = bestStart; j < bestStart + K; j++) {
        newBestMutations.push({
          targetId: `element-${j}`,
          property: 'highlight',
          from: 'comparing',
          to: 'found',
          easing: 'spring',
        });
      }

      steps.push({
        id: stepId++,
        description:
          `New best! Window A[${bestStart}..${bestStart + K - 1}] = [${a.slice(bestStart, bestStart + K).join(', ')}] has sum ${maxSum}, beating the previous best.`,
        pseudocodeLine: 7,
        mutations: newBestMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 450,
      });
    } else {
      // Not a new best -- mark window elements back to default
      const notBestMutations: VisualMutation[] = [];
      for (let j = leaving + 1; j <= entering; j++) {
        notBestMutations.push({
          targetId: `element-${j}`,
          property: 'highlight',
          from: 'comparing',
          to: 'default',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description:
          `Window sum ${windowSum} <= best ${maxSum}. Not an improvement, keep sliding.`,
        pseudocodeLine: 6,
        mutations: notBestMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 350,
      });
    }
  }

  // Final step: highlight the best window
  const finalMutations: VisualMutation[] = a.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: (idx >= bestStart && idx < bestStart + K ? 'found' : 'default') as string,
    to: (idx >= bestStart && idx < bestStart + K ? 'found' : 'sorted') as string,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description:
      `Done! Maximum sum subarray of size ${K} starts at index ${bestStart}: [${a.slice(bestStart, bestStart + K).join(', ')}] with sum ${maxSum}. Found in O(n) \u2014 one pass through the array.`,
    pseudocodeLine: 9,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  return { config: SLIDING_WINDOW_CONFIG, steps, finalState: a };
}
