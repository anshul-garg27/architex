// -----------------------------------------------------------------
// Architex -- Catalan Numbers (ALG-048)
// 1D array showing C(n) = sum(C(i)*C(n-1-i)) for i=0..n-1.
// Visualizes the recursive decomposition structure.
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { DPTable } from './types';

export const CATALAN_CONFIG: AlgorithmConfig = {
  id: 'catalan',
  name: 'Catalan Numbers',
  category: 'dp',
  timeComplexity: { best: 'O(n^2)', average: 'O(n^2)', worst: 'O(n^2)' },
  spaceComplexity: 'O(n)',
  description:
    'Computes the nth Catalan number using the recurrence C(n) = sum of C(i)*C(n-1-i) for i=0..n-1. 1D array visualization shows how each value is built from all previously computed values.',
  pseudocode: [
    'procedure catalan(n)',
    '  C[0] = 1; C[1] = 1',
    '  for i = 2 to n do',
    '    C[i] = 0',
    '    for j = 0 to i-1 do',
    '      C[i] += C[j] * C[i-1-j]',
    '  return C[n]',
  ],
};

export interface CatalanResult extends AlgorithmResult {
  dpTable: DPTable;
  catalanNumber: number;
}

export function catalan(n: number): CatalanResult {
  const N = Math.min(n, 16); // Clamp for visualization
  const C: number[] = new Array(N + 1).fill(0);
  C[0] = 1;
  if (N >= 1) C[1] = 1;

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize base cases
  const initMutations: VisualMutation[] = [
    { targetId: 'dp-0-0', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
    { targetId: 'dp-0-0', property: 'label', from: '', to: '1', easing: 'ease-out' },
  ];
  writes++;

  if (N >= 1) {
    writes++;
    initMutations.push(
      { targetId: 'dp-0-1', property: 'highlight', from: 'default', to: 'computed', easing: 'ease-out' },
      { targetId: 'dp-0-1', property: 'label', from: '', to: '1', easing: 'ease-out' },
    );
  }

  steps.push({
    id: stepId++,
    description: 'Initialize: C(0) = 1, C(1) = 1',
    pseudocodeLine: 1,
    mutations: initMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Fill array using recurrence
  for (let i = 2; i <= N; i++) {
    C[i] = 0;

    // Step: begin computing C(i)
    steps.push({
      id: stepId++,
      description: `Begin computing C(${i}) = sum of C(j)*C(${i - 1}-j) for j=0..${i - 1}`,
      pseudocodeLine: 2,
      mutations: [
        { targetId: `dp-0-${i}`, property: 'highlight', from: 'default', to: 'computing', easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    // Show each term of the summation
    for (let j = 0; j <= i - 1; j++) {
      reads += 2;
      comparisons++;
      const term = C[j] * C[i - 1 - j];
      C[i] += term;
      writes++;

      steps.push({
        id: stepId++,
        description: `C(${i}) += C(${j})*C(${i - 1 - j}) = ${C[j]}*${C[i - 1 - j]} = ${term}  (running sum = ${C[i]})`,
        pseudocodeLine: 5,
        mutations: [
          { targetId: `dp-0-${j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
          { targetId: `dp-0-${i - 1 - j}`, property: 'highlight', from: 'computed', to: 'dependency', easing: 'ease-out' },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 250,
      });

      // Restore dependencies
      const restoreMutations: VisualMutation[] = [
        { targetId: `dp-0-${j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
      ];
      // Avoid duplicate mutation when j === i-1-j
      if (j !== i - 1 - j) {
        restoreMutations.push(
          { targetId: `dp-0-${i - 1 - j}`, property: 'highlight', from: 'dependency', to: 'computed', easing: 'ease-out' },
        );
      }

      steps.push({
        id: stepId++,
        description: `Accumulated C(${i}) = ${C[i]}`,
        pseudocodeLine: 5,
        mutations: restoreMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 200,
      });
    }

    // Finalize C(i)
    steps.push({
      id: stepId++,
      description: `C(${i}) = ${C[i]}`,
      pseudocodeLine: 5,
      mutations: [
        { targetId: `dp-0-${i}`, property: 'highlight', from: 'computing', to: 'computed', easing: 'ease-out' },
        { targetId: `dp-0-${i}`, property: 'label', from: '', to: String(C[i]), easing: 'ease-out' },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Highlight the final answer
  steps.push({
    id: stepId++,
    description: `C(${N}) = ${C[N]}`,
    pseudocodeLine: 6,
    mutations: [
      { targetId: `dp-0-${N}`, property: 'highlight', from: 'computed', to: 'optimal', easing: 'ease-out' },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 800,
  });

  // Build DPTable (1D = single row)
  const rows = ['C(n)'];
  const cols = Array.from({ length: N + 1 }, (_, i) => String(i));
  const cells = [
    C.map((val, ci) => ({
      row: 0,
      col: ci,
      value: val,
      state: (ci === N
        ? 'optimal'
        : 'computed') as 'default' | 'computing' | 'computed' | 'optimal' | 'dependency',
    })),
  ];

  return {
    config: CATALAN_CONFIG,
    steps,
    finalState: [...C],
    dpTable: { rows, cols, cells },
    catalanNumber: C[N],
  };
}

/** Default input for demo. */
export const DEFAULT_CATALAN_N = 8;
