// ─────────────────────────────────────────────────────────────
// Architex — Floyd's Cycle Detection (Tortoise & Hare) with Step Recording
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const FLOYD_CYCLE_CONFIG: AlgorithmConfig = {
  id: 'floyd-cycle',
  name: "Floyd's Cycle Detection (Tortoise & Hare)",
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n)', worst: 'O(n)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    "Two runners on a circular track — one runs twice as fast. They MUST meet if there's a loop. Floyd's algorithm uses a slow pointer (1 step) and fast pointer (2 steps). If they meet, there's a cycle. Then to find WHERE the cycle starts: reset slow to the beginning, move both at speed 1 — they meet at the cycle entry. Used in: linked list cycle detection, finding duplicate numbers, detecting infinite loops.",
  pseudocode: [
    'procedure floydCycleDetection(A: index array)',
    '  slow = 0; fast = 0',
    '  // Phase 1: Detect cycle',
    '  repeat',
    '    slow = A[slow]       // 1 step',
    '    fast = A[A[fast]]    // 2 steps',
    '  until slow == fast',
    '  // Phase 2: Find cycle start',
    '  slow = 0',
    '  while slow != fast do',
    '    slow = A[slow]',
    '    fast = A[fast]',
    '  return slow  // cycle start index',
  ],
};

/**
 * Floyd's Cycle Detection on an array where values are indices (simulating a linked list).
 * Input: number array where arr[i] points to the next index (must contain a cycle).
 * The visualizer shows both pointer positions as they traverse.
 */
export function floydCycle(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: FLOYD_CYCLE_CONFIG, steps: [], finalState: [...arr] };
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
      'Each array value points to the next index, forming a linked list. We use a slow pointer (1 step) and fast pointer (2 steps) to detect if a cycle exists.',
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons: 0, swaps: 0, reads: 0, writes: 0 },
    duration: 600,
  });

  // ── Phase 1: Detect cycle ──
  let slow = 0;
  let fast = 0;
  let meetingPoint = -1;
  let phase1Steps = 0;
  const maxIterations = n * 3; // Safety limit

  // Show initial pointer positions
  steps.push({
    id: stepId++,
    description: `Phase 1 — Cycle detection. Both pointers start at index 0 (value ${a[0]}). Slow moves 1 step, fast moves 2 steps each iteration.`,
    pseudocodeLine: 1,
    mutations: [
      {
        targetId: 'element-0',
        property: 'highlight',
        from: 'default',
        to: 'comparing',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes: 0 },
    duration: 500,
  });

  do {
    phase1Steps++;
    if (phase1Steps > maxIterations) break;

    // Clear previous positions
    const clearMutations: VisualMutation[] = [];
    if (slow !== fast) {
      clearMutations.push({
        targetId: `element-${slow}`,
        property: 'highlight',
        from: 'active',
        to: 'default',
        easing: 'ease-out',
      });
      clearMutations.push({
        targetId: `element-${fast}`,
        property: 'highlight',
        from: 'pivot',
        to: 'default',
        easing: 'ease-out',
      });
    } else if (phase1Steps > 1) {
      clearMutations.push({
        targetId: `element-${slow}`,
        property: 'highlight',
        from: 'comparing',
        to: 'default',
        easing: 'ease-out',
      });
    }

    // Move slow one step
    const prevSlow = slow;
    slow = a[slow];
    reads++;

    // Move fast two steps
    const prevFast = fast;
    const fastMid = a[fast];
    reads++;
    fast = a[fastMid];
    reads++;

    comparisons++;

    const moveMutations: VisualMutation[] = [];

    if (slow === fast) {
      // They met!
      meetingPoint = slow;
      moveMutations.push({
        targetId: `element-${slow}`,
        property: 'highlight',
        from: 'default',
        to: 'swapping',
        easing: 'spring',
      });

      steps.push({
        id: stepId++,
        description: `Slow: ${prevSlow} -> ${slow}. Fast: ${prevFast} -> ${fastMid} -> ${fast}. They MEET at index ${slow} (value ${a[slow]})! A cycle exists.`,
        pseudocodeLine: 6,
        mutations: [...clearMutations, ...moveMutations],
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 600,
      });
    } else {
      // Show slow pointer position
      moveMutations.push({
        targetId: `element-${slow}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      });
      // Show fast pointer position
      moveMutations.push({
        targetId: `element-${fast}`,
        property: 'highlight',
        from: 'default',
        to: 'pivot',
        easing: 'ease-out',
      });

      steps.push({
        id: stepId++,
        description: `Slow: ${prevSlow} -> ${slow} (1 step). Fast: ${prevFast} -> ${fastMid} -> ${fast} (2 steps). Slow != Fast, continue.`,
        pseudocodeLine: 4,
        mutations: [...clearMutations, ...moveMutations],
        complexity: { comparisons, swaps: 0, reads, writes: 0 },
        duration: 400,
      });
    }
  } while (slow !== fast && phase1Steps <= maxIterations);

  // ── Phase 2: Find cycle start ──
  if (meetingPoint !== -1) {
    // Clear meeting point highlight
    steps.push({
      id: stepId++,
      description: `Phase 2 — Find cycle start. Reset slow to index 0. Keep fast at index ${meetingPoint}. Move both 1 step at a time until they meet.`,
      pseudocodeLine: 8,
      mutations: [
        {
          targetId: `element-${meetingPoint}`,
          property: 'highlight',
          from: 'swapping',
          to: 'pivot',
          easing: 'ease-out',
        },
        {
          targetId: 'element-0',
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 500,
    });

    slow = 0;
    let phase2Steps = 0;

    while (slow !== fast && phase2Steps < maxIterations) {
      phase2Steps++;
      comparisons++;

      const clearMuts: VisualMutation[] = [];
      if (slow !== fast) {
        clearMuts.push({
          targetId: `element-${slow}`,
          property: 'highlight',
          from: 'active',
          to: 'default',
          easing: 'ease-out',
        });
        clearMuts.push({
          targetId: `element-${fast}`,
          property: 'highlight',
          from: 'pivot',
          to: 'default',
          easing: 'ease-out',
        });
      }

      const prevS = slow;
      const prevF = fast;
      slow = a[slow];
      fast = a[fast];
      reads += 2;

      const phaseMuts: VisualMutation[] = [];

      if (slow === fast) {
        phaseMuts.push({
          targetId: `element-${slow}`,
          property: 'highlight',
          from: 'default',
          to: 'found',
          easing: 'spring',
        });

        steps.push({
          id: stepId++,
          description: `Slow: ${prevS} -> ${slow}. Fast: ${prevF} -> ${fast}. They meet at index ${slow}! This is the cycle start.`,
          pseudocodeLine: 12,
          mutations: [...clearMuts, ...phaseMuts],
          complexity: { comparisons, swaps: 0, reads, writes: 0 },
          duration: 600,
        });
      } else {
        phaseMuts.push({
          targetId: `element-${slow}`,
          property: 'highlight',
          from: 'default',
          to: 'active',
          easing: 'ease-out',
        });
        phaseMuts.push({
          targetId: `element-${fast}`,
          property: 'highlight',
          from: 'default',
          to: 'pivot',
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Slow: ${prevS} -> ${slow}. Fast: ${prevF} -> ${fast}. Not equal yet, continue.`,
          pseudocodeLine: 10,
          mutations: [...clearMuts, ...phaseMuts],
          complexity: { comparisons, swaps: 0, reads, writes: 0 },
          duration: 400,
        });
      }
    }

    // Mark the cycle visually
    const cycleStart = slow;
    const cycleMutations: VisualMutation[] = [];
    let current = cycleStart;
    const visited = new Set<number>();
    do {
      visited.add(current);
      cycleMutations.push({
        targetId: `element-${current}`,
        property: 'highlight',
        from: current === cycleStart ? 'found' : 'default',
        to: 'sorted',
        easing: 'ease-out',
      });
      current = a[current];
    } while (current !== cycleStart && !visited.has(current));

    steps.push({
      id: stepId++,
      description: `Cycle starts at index ${cycleStart} (value ${a[cycleStart]}). The cycle contains ${visited.size} element${visited.size > 1 ? 's' : ''}.`,
      pseudocodeLine: 12,
      mutations: cycleMutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 500,
    });
  } else {
    // No cycle detected (safety — should not happen with valid input)
    steps.push({
      id: stepId++,
      description: 'No cycle detected within iteration limit.',
      pseudocodeLine: 6,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration: 400,
    });
  }

  return { config: FLOYD_CYCLE_CONFIG, steps, finalState: a };
}
