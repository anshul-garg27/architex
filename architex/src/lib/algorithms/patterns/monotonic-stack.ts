// ─────────────────────────────────────────────────────────────
// Architex — Monotonic Stack (Next Greater Element) with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const MONOTONIC_STACK_CONFIG: AlgorithmConfig = {
  id: 'monotonic-stack',
  name: 'Monotonic Stack (Next Greater Element)',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(n)',
  stable: false,
  inPlace: false,
  description:
    "For each element in an array, what's the FIRST larger element to its right? The brute-force approach checks every element — O(n\u00B2). A monotonic stack solves this in O(n) by maintaining a stack of 'candidates' that are waiting for their next greater element. When a new element is larger than the stack top, we've found the answer for that candidate. Used in: stock price analysis (next higher price), histogram problems, temperature forecasting.",
  pseudocode: [
    'procedure nextGreaterElement(A: list)',
    '  n = length(A)',
    '  result = array of n, filled with -1',
    '  stack = empty stack  // stores indices',
    '  for i = n-1 down to 0 do',
    '    while stack is not empty and A[stack.top()] <= A[i] do',
    '      stack.pop()  // remove smaller candidates',
    '    if stack is not empty then',
    '      result[i] = stack.top()',
    '    stack.push(i)',
    '  return result',
  ],
};

export function monotonicStack(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: MONOTONIC_STACK_CONFIG, steps: [], finalState: arr.length === 1 ? [-1] : [] };
  }

  const a = [...arr];
  const n = a.length;
  const result: number[] = new Array(n).fill(-1);
  const stack: number[] = []; // stores indices
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initial overview step
  steps.push({
    id: stepId++,
    description:
      'For each element, find the first larger element to its right. We scan right-to-left, maintaining a stack of candidate indices.',
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 600,
  });

  for (let i = n - 1; i >= 0; i--) {
    reads++;

    // Highlight current element being processed
    const currentMutations: VisualMutation[] = [
      {
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      },
    ];

    steps.push({
      id: stepId++,
      description:
        i === n - 1
          ? `Start from the rightmost element: A[${i}] = ${a[i]}. The stack is empty, so no next greater element exists.`
          : `Process A[${i}] = ${a[i]}. Check the stack for a candidate larger than ${a[i]}.`,
      pseudocodeLine: 4,
      mutations: currentMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // Pop elements from stack that are <= current element
    while (stack.length > 0 && a[stack[stack.length - 1]] <= a[i]) {
      const popped = stack.pop()!;
      comparisons++;
      reads++;

      const popMutations: VisualMutation[] = [
        {
          targetId: `element-${popped}`,
          property: 'highlight',
          from: 'comparing',
          to: 'default',
          easing: 'ease-out',
        },
      ];

      steps.push({
        id: stepId++,
        description: `A[${popped}] = ${a[popped]} <= ${a[i]}, so pop index ${popped} from stack. It can never be a "next greater" for any remaining element.`,
        pseudocodeLine: 5,
        mutations: popMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 350,
      });
    }

    if (stack.length > 0) {
      comparisons++;
      reads++;
    }

    // If stack is not empty, top is the next greater element
    if (stack.length > 0) {
      const ngeIndex = stack[stack.length - 1];
      result[i] = ngeIndex;
      writes++;

      const foundMutations: VisualMutation[] = [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'active',
          to: 'found',
          easing: 'spring',
        },
        {
          targetId: `element-${ngeIndex}`,
          property: 'highlight',
          from: 'default',
          to: 'comparing',
          easing: 'spring',
        },
      ];

      steps.push({
        id: stepId++,
        description: `Stack top is index ${ngeIndex} (A[${ngeIndex}] = ${a[ngeIndex]}). That is the next greater element for A[${i}] = ${a[i]}. Record result[${i}] = ${ngeIndex}.`,
        pseudocodeLine: 8,
        mutations: foundMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 450,
      });
    } else {
      result[i] = -1;
      writes++;

      const noGreaterMutations: VisualMutation[] = [
        {
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'active',
          to: 'sorted',
          easing: 'ease-out',
        },
      ];

      steps.push({
        id: stepId++,
        description: `Stack is empty — no element to the right is larger than A[${i}] = ${a[i]}. Record result[${i}] = -1.`,
        pseudocodeLine: 8,
        mutations: noGreaterMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
    }

    // Push current index onto stack
    stack.push(i);

    const pushMutations: VisualMutation[] = [
      {
        targetId: `element-${i}`,
        property: 'highlight',
        from: result[i] === -1 ? 'sorted' : 'found',
        to: 'comparing',
        easing: 'ease-out',
      },
    ];

    steps.push({
      id: stepId++,
      description: `Push index ${i} (value ${a[i]}) onto the stack as a candidate for future elements.`,
      pseudocodeLine: 9,
      mutations: pushMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Final step: mark all as sorted
  const finalMutations: VisualMutation[] = a.map((_, idx) => ({
    targetId: `element-${idx}`,
    property: 'highlight' as const,
    from: 'comparing' as const,
    to: 'sorted' as const,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Done! Result: [${result.join(', ')}]. Each value is the index of the next greater element (-1 = none).`,
    pseudocodeLine: 10,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  return { config: MONOTONIC_STACK_CONFIG, steps, finalState: result };
}
