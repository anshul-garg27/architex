// -----------------------------------------------------------------
// Architex -- Two Pointers (Two Sum on Sorted Array) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const TWO_POINTERS_CONFIG: AlgorithmConfig = {
  id: 'two-pointers',
  name: 'Two Pointers (Two Sum)',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'Given a sorted array, find two numbers that add up to a target. Brute force checks every pair \u2014 O(n\u00B2). Two pointers solve it in O(n): start from both ends, move inward. If the sum is too small, advance the left pointer (increase the sum). Too large? Retreat the right pointer. They converge on the answer. Used in: array problems (Container With Most Water), linked list (detect cycle entry point), string palindrome checking.',
  pseudocode: [
    'procedure twoPointers(A: sorted list, target: number)',
    '  left = 0',
    '  right = length(A) - 1',
    '  while left < right do',
    '    sum = A[left] + A[right]',
    '    if sum == target then',
    '      return (left, right)',
    '    else if sum < target then',
    '      left = left + 1   // need a bigger sum',
    '    else',
    '      right = right - 1  // need a smaller sum',
    '  return NOT_FOUND',
  ],
};

/** Default sorted input array. Target = 13 -> answers are (2,11) and (5,8). */
export const TWO_POINTERS_DEFAULT = [1, 2, 3, 5, 8, 11, 15];
export const TWO_POINTERS_TARGET = 13;

export function twoPointers(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: TWO_POINTERS_CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const target = TWO_POINTERS_TARGET;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;

  // Initial overview step
  steps.push({
    id: stepId++,
    description:
      `Find two numbers in [${a.join(', ')}] that add up to ${target}. Place one pointer at each end and walk them inward.`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 600,
  });

  let left = 0;
  let right = n - 1;
  let foundPair = false;

  // Show initial pointer positions
  steps.push({
    id: stepId++,
    description:
      `Left pointer at index ${left} (value ${a[left]}). Right pointer at index ${right} (value ${a[right]}). Their sum is ${a[left] + a[right]}.`,
    pseudocodeLine: 1,
    mutations: [
      {
        targetId: `element-${left}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      },
      {
        targetId: `element-${right}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  while (left < right) {
    reads += 2;
    comparisons++;
    const sum = a[left] + a[right];

    if (sum === target) {
      // Found a match!
      foundPair = true;

      const matchMutations: VisualMutation[] = [
        {
          targetId: `element-${left}`,
          property: 'highlight',
          from: 'active',
          to: 'found',
          easing: 'spring',
        },
        {
          targetId: `element-${right}`,
          property: 'highlight',
          from: 'pivot',
          to: 'found',
          easing: 'spring',
        },
      ];

      steps.push({
        id: stepId++,
        description:
          `A[${left}] + A[${right}] = ${a[left]} + ${a[right]} = ${sum} == ${target}. Found it! The pair (${a[left]}, ${a[right]}) sums to the target.`,
        pseudocodeLine: 5,
        mutations: matchMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 600,
      });

      // Mark the rest as eliminated
      const eliminatedMutations: VisualMutation[] = [];
      for (let k = 0; k < n; k++) {
        if (k !== left && k !== right) {
          eliminatedMutations.push({
            targetId: `element-${k}`,
            property: 'highlight',
            from: 'default',
            to: 'sorted',
            easing: 'ease-out',
          });
        }
      }

      if (eliminatedMutations.length > 0) {
        steps.push({
          id: stepId++,
          description:
            `Pair found: indices ${left} and ${right} (values ${a[left]} and ${a[right]}). All other elements are irrelevant.`,
          pseudocodeLine: 6,
          mutations: eliminatedMutations,
          complexity: { comparisons, swaps: 0, reads, writes: 0 },
          duration: 400,
        });
      }

      break;
    }

    if (sum < target) {
      // Sum too small -- move left pointer right to increase it
      const clearLeft: VisualMutation = {
        targetId: `element-${left}`,
        property: 'highlight',
        from: 'active',
        to: 'sorted',
        easing: 'ease-out',
      };

      left++;

      const newLeftMut: VisualMutation = {
        targetId: `element-${left}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      };

      steps.push({
        id: stepId++,
        description:
          `Sum = ${a[left - 1]} + ${a[right]} = ${sum} < ${target}. Too small \u2014 advance left pointer to index ${left} (value ${a[left]}) to increase the sum.`,
        pseudocodeLine: 8,
        mutations: [clearLeft, newLeftMut],
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 400,
      });
    } else {
      // Sum too large -- move right pointer left to decrease it
      const clearRight: VisualMutation = {
        targetId: `element-${right}`,
        property: 'highlight',
        from: 'pivot',
        to: 'sorted',
        easing: 'ease-out',
      };

      right--;

      const newRightMut: VisualMutation = {
        targetId: `element-${right}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      };

      steps.push({
        id: stepId++,
        description:
          `Sum = ${a[left]} + ${a[right + 1]} = ${sum} > ${target}. Too large \u2014 retreat right pointer to index ${right} (value ${a[right]}) to decrease the sum.`,
        pseudocodeLine: 10,
        mutations: [clearRight, newRightMut],
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 400,
      });
    }
  }

  if (!foundPair) {
    // No pair found
    const noMatchMutations: VisualMutation[] = a.map((_, idx) => ({
      targetId: `element-${idx}`,
      property: 'highlight' as const,
      from: 'default' as const,
      to: 'sorted' as const,
      easing: 'ease-out' as const,
    }));

    steps.push({
      id: stepId++,
      description:
        `Pointers crossed \u2014 no pair in the array sums to ${target}.`,
      pseudocodeLine: 11,
      mutations: noMatchMutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 500,
    });
  }

  // Final completion step
  const finalMutations: VisualMutation[] = a.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: foundPair ? 'found' : 'sorted',
    to: 'sorted' as const,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: foundPair
      ? `Done! Two pointers found the pair in ${comparisons} comparison${comparisons !== 1 ? 's' : ''} \u2014 O(n) vs O(n\u00B2) brute force.`
      : `Done! Exhausted all possibilities in ${comparisons} comparison${comparisons !== 1 ? 's' : ''}. No valid pair exists.`,
    pseudocodeLine: 11,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  return { config: TWO_POINTERS_CONFIG, steps, finalState: a };
}
