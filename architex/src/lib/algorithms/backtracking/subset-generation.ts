// -----------------------------------------------------------------
// Architex -- Subset Generation via Backtracking (ALG-236)
// Generates all 2^N subsets of a set by choosing to include or
// exclude each element. Records every branch, prune, and complete
// subset in the decision tree.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Public types ────────────────────────────────────────────────

export interface SubsetStep {
  /** The index of the element being decided on. */
  elementIndex: number;
  /** The current partial subset. */
  current: number[];
  /** Whether we are including or excluding the element. */
  action: 'include' | 'exclude' | 'complete';
}

// ── Config ──────────────────────────────────────────────────────

export const SUBSET_GENERATION_CONFIG: AlgorithmConfig = {
  id: 'subset-generation',
  name: 'Subset Generation',
  category: 'backtracking',
  timeComplexity: { best: 'O(2^N)', average: 'O(2^N)', worst: 'O(2^N)' },
  spaceComplexity: 'O(N)',
  description:
    'Generate all 2^N subsets of a set using backtracking. At each element, branch into two choices: include the element or exclude it. The resulting binary decision tree has 2^N leaves, each representing a unique subset.',
  pseudocode: [
    'procedure generateSubsets(index, current, set)',
    '  if index == |set|:',
    '    record current as a complete subset',
    '    return',
    '  // Branch 1: include set[index]',
    '  current.push(set[index])',
    '  generateSubsets(index+1, current, set)',
    '  // Branch 2: exclude set[index] (backtrack)',
    '  current.pop()',
    '  generateSubsets(index+1, current, set)',
  ],
};

// ── Default sample set ─────────────────────────────────────────

export const DEFAULT_SUBSET_SET = [1, 2, 3, 4];

// ── Solver ──────────────────────────────────────────────────────

export function generateSubsets(inputSet?: number[]): AlgorithmResult {
  const set = inputSet ?? DEFAULT_SUBSET_SET;
  // Clamp to 6 elements to keep 2^N manageable (64 subsets, ~200 steps)
  const elements = set.slice(0, 6);
  const n = elements.length;

  const steps: AnimationStep[] = [];
  const allSubsets: number[][] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Limit steps
  const MAX_STEPS = 1500;

  // ── Mutation helpers ───────────────────────────────────────

  /**
   * We model the decision tree visually:
   *  - `tree-node-{depth}-{pathId}` — a node in the decision tree
   *  - `list-subset-{index}` — a completed subset in the results list
   *
   * For the element set we use `element-{i}` IDs.
   */

  function elementMut(
    index: number,
    state: string,
    easing: VisualMutation['easing'] = 'ease-out',
  ): VisualMutation {
    return {
      targetId: `element-${index}`,
      property: 'highlight',
      from: 'default',
      to: state,
      easing,
    };
  }

  function treeMut(
    depth: number,
    pathId: number,
    state: string,
  ): VisualMutation {
    return {
      targetId: `tree-node-${depth}-${pathId}`,
      property: 'highlight',
      from: 'default',
      to: state,
      easing: 'ease-out',
    };
  }

  function subsetListMut(index: number, label: string): VisualMutation[] {
    return [
      {
        targetId: `list-subset-${index}`,
        property: 'highlight',
        from: 'default',
        to: 'found',
        easing: 'ease-out',
      },
      {
        targetId: `list-subset-${index}`,
        property: 'label',
        from: '',
        to: label,
        easing: 'ease-out',
      },
    ];
  }

  function pushStep(
    desc: string,
    line: number,
    mutations: VisualMutation[],
    dur = 300,
  ) {
    if (steps.length >= MAX_STEPS) return;
    steps.push({
      id: stepId++,
      description: desc,
      pseudocodeLine: line,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: dur,
    });
  }

  /** Show which elements are currently in `current`. */
  function currentSetMuts(current: number[]): VisualMutation[] {
    const muts: VisualMutation[] = [];
    const included = new Set(current);
    for (let i = 0; i < n; i++) {
      if (included.has(elements[i])) {
        muts.push(elementMut(i, 'queen'));
      }
    }
    return muts;
  }

  // ── Recursive generation ───────────────────────────────────

  /** pathId tracks the binary path taken so far (bit-packed). */
  function generate(index: number, current: number[], pathId: number): void {
    if (steps.length >= MAX_STEPS) return;

    // Base case: complete subset
    if (index === n) {
      const subset = [...current];
      allSubsets.push(subset);
      writes++;

      const label =
        subset.length === 0 ? '{}' : `{${subset.join(', ')}}`;

      pushStep(
        `Complete subset: ${label}`,
        2,
        [
          ...currentSetMuts(current),
          treeMut(index, pathId, 'found'),
          ...subsetListMut(allSubsets.length - 1, label),
        ],
        350,
      );
      return;
    }

    reads++;
    comparisons++;

    const elem = elements[index];

    // ── Branch 1: include ────────────────────────────────────

    pushStep(
      `Depth ${index}: consider including ${elem}`,
      4,
      [
        ...currentSetMuts(current),
        elementMut(index, 'active'),
        treeMut(index, pathId * 2, 'safe'),
      ],
      250,
    );

    current.push(elem);
    writes++;

    pushStep(
      `Include ${elem} → current = {${current.join(', ')}}`,
      5,
      [
        ...currentSetMuts(current),
        elementMut(index, 'queen'),
        treeMut(index, pathId * 2, 'queen'),
      ],
      300,
    );

    generate(index + 1, current, pathId * 2);

    // ── Backtrack (pop) ──────────────────────────────────────

    current.pop();
    writes++;

    pushStep(
      `Backtrack: remove ${elem} → current = {${current.length > 0 ? current.join(', ') : ''}}`,
      8,
      [
        ...currentSetMuts(current),
        elementMut(index, 'backtrack'),
        treeMut(index, pathId * 2, 'backtrack'),
      ],
      250,
    );

    // ── Branch 2: exclude ────────────────────────────────────

    pushStep(
      `Depth ${index}: exclude ${elem}`,
      9,
      [
        ...currentSetMuts(current),
        elementMut(index, 'comparing'),
        treeMut(index, pathId * 2 + 1, 'safe'),
      ],
      250,
    );

    generate(index + 1, current, pathId * 2 + 1);
  }

  // ── Entry point ────────────────────────────────────────────

  pushStep(
    `Generating all subsets of {${elements.join(', ')}} (2^${n} = ${Math.pow(2, n)} subsets)`,
    0,
    elements.map((_, i) => elementMut(i, 'default')),
    400,
  );

  generate(0, [], 0);

  pushStep(
    `Done — generated ${allSubsets.length} subsets`,
    0,
    [],
    400,
  );

  // Encode final state as flat array of subset lengths
  const finalState: number[] = allSubsets.map((s) => s.length);

  return {
    config: SUBSET_GENERATION_CONFIG,
    steps,
    finalState,
  };
}
