// ─────────────────────────────────────────────────────────────
// Architex — Binary Search with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const BINARY_SEARCH_CONFIG: AlgorithmConfig = {
  id: 'binary-search',
  name: 'Binary Search',
  category: 'sorting',
  timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(log n)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'Finds a target value in a sorted array by repeatedly halving the search space. Compares the target to the middle element — if smaller, search left half; if larger, search right half.',
  pseudocode: [
    'procedure binarySearch(A: sorted list, target)',
    '  left = 0',
    '  right = length(A) - 1',
    '  while left <= right do',
    '    mid = floor((left + right) / 2)',
    '    if A[mid] == target then',
    '      return mid',
    '    else if A[mid] < target then',
    '      left = mid + 1',
    '    else',
    '      right = mid - 1',
    '  return -1  // not found',
  ],
};

/**
 * Run binary search on `arr`, looking for `target`.
 *
 * When called from the sorting-runner map (which passes only an array),
 * the array is sorted first and a target is chosen automatically from
 * the middle region so the visualisation always has something to find.
 */
export function binarySearch(arr: number[], target?: number): AlgorithmResult {
  if (arr.length === 0) {
    return { config: BINARY_SEARCH_CONFIG, steps: [], finalState: [] };
  }

  // Sort a copy so the precondition holds
  const a = [...arr].sort((x, y) => x - y);

  // Pick a target if none provided — choose a value from the array
  const actualTarget =
    target !== undefined ? target : a[Math.floor(a.length / 2)];

  if (a.length === 1) {
    const steps: AnimationStep[] = [];
    const found = a[0] === actualTarget;
    steps.push({
      id: 0,
      description: found
        ? `Single element arr[0]=${a[0]} equals target ${actualTarget}. Found!`
        : `Single element arr[0]=${a[0]} does not equal target ${actualTarget}. Not found.`,
      pseudocodeLine: found ? 5 : 11,
      mutations: [
        {
          targetId: 'element-0',
          property: 'highlight',
          from: 'default',
          to: found ? 'found' : 'sorted',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons: 1, swaps: 0, reads: 1, writes: 0 },
      duration: 400,
    });
    return { config: BINARY_SEARCH_CONFIG, steps, finalState: a };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;

  let left = 0;
  let right = a.length - 1;

  // Initial step — show the sorted array and the target
  const initMutations: VisualMutation[] = [];
  for (let i = 0; i < a.length; i++) {
    initMutations.push({
      targetId: `element-${i}`,
      property: 'highlight',
      from: 'default',
      to: 'active',
      easing: 'ease-out',
    });
  }
  steps.push({
    id: stepId++,
    description: `Searching for target ${actualTarget} in sorted array [${a.join(', ')}]. Search range: indices 0..${a.length - 1}.`,
    pseudocodeLine: 1,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    reads++;
    comparisons++;

    // Highlight the current search range as active, eliminated range as sorted
    const rangeMutations: VisualMutation[] = [];
    for (let i = 0; i < a.length; i++) {
      if (i < left || i > right) {
        rangeMutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'active',
          to: 'sorted',
          easing: 'ease-out',
        });
      } else if (i === mid) {
        rangeMutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'active',
          to: 'comparing',
          easing: 'ease-out',
        });
      } else {
        rangeMutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        });
      }
    }

    steps.push({
      id: stepId++,
      description: `Compare target ${actualTarget} with middle element arr[${mid}]=${a[mid]}. Search range: [${left}..${right}], mid=${mid}.`,
      pseudocodeLine: 4,
      mutations: rangeMutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 500,
    });

    if (a[mid] === actualTarget) {
      // Found the target
      const foundMutations: VisualMutation[] = [];
      for (let i = 0; i < a.length; i++) {
        if (i === mid) {
          foundMutations.push({
            targetId: `element-${i}`,
            property: 'highlight',
            from: 'comparing',
            to: 'found',
            easing: 'spring',
          });
        } else {
          foundMutations.push({
            targetId: `element-${i}`,
            property: 'highlight',
            from: i >= left && i <= right ? 'active' : 'sorted',
            to: 'sorted',
            easing: 'ease-out',
          });
        }
      }

      steps.push({
        id: stepId++,
        description: `Found target ${actualTarget} at index ${mid}!`,
        pseudocodeLine: 6,
        mutations: foundMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 600,
      });

      return { config: BINARY_SEARCH_CONFIG, steps, finalState: a };
    }

    if (a[mid] < actualTarget) {
      // Search right half
      const halveMutations: VisualMutation[] = [];
      for (let i = left; i <= mid; i++) {
        halveMutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: i === mid ? 'comparing' : 'active',
          to: 'sorted',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description: `Since ${actualTarget} > ${a[mid]}, eliminate left half [${left}..${mid}]. Search right half [${mid + 1}..${right}].`,
        pseudocodeLine: 8,
        mutations: halveMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 400,
      });

      left = mid + 1;
    } else {
      // Search left half
      const halveMutations: VisualMutation[] = [];
      for (let i = mid; i <= right; i++) {
        halveMutations.push({
          targetId: `element-${i}`,
          property: 'highlight',
          from: i === mid ? 'comparing' : 'active',
          to: 'sorted',
          easing: 'ease-out',
        });
      }

      steps.push({
        id: stepId++,
        description: `Since ${actualTarget} < ${a[mid]}, eliminate right half [${mid}..${right}]. Search left half [${left}..${mid - 1}].`,
        pseudocodeLine: 10,
        mutations: halveMutations,
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 400,
      });

      right = mid - 1;
    }
  }

  // Target not found — mark everything as sorted (eliminated)
  const notFoundMutations: VisualMutation[] = [];
  for (let i = 0; i < a.length; i++) {
    notFoundMutations.push({
      targetId: `element-${i}`,
      property: 'highlight',
      from: 'active',
      to: 'sorted',
      easing: 'ease-out',
    });
  }

  steps.push({
    id: stepId++,
    description: `Target ${actualTarget} not found in the array. Search space exhausted.`,
    pseudocodeLine: 11,
    mutations: notFoundMutations,
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  return { config: BINARY_SEARCH_CONFIG, steps, finalState: a };
}
