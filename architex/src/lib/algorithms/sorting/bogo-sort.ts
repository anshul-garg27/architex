// ─────────────────────────────────────────────────────────────
// Architex — Bogo Sort with Step Recording (Educational)
// ─────────────────────────────────────────────────────────────
//
// Bogo Sort (a.k.a. "stupid sort" or "permutation sort") is the
// worst practical sorting algorithm. It randomly shuffles the
// array and checks if the result happens to be sorted.
//
// Why O(n * n!) ?
//   - There are n! possible permutations of the array.
//   - Each shuffle has a 1/n! probability of producing the
//     sorted permutation, so the expected number of shuffles
//     is n!.
//   - Each "is it sorted?" check takes O(n) comparisons.
//   - Total expected work: O(n * n!).
//
// This implementation caps attempts at 1000 to avoid infinite
// loops — a practical necessity since even n=10 has 3,628,800
// permutations and could run for a very, very long time.
// ─────────────────────────────────────────────────────────────

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

const MAX_ATTEMPTS = 1000;

const CONFIG: AlgorithmConfig = {
  id: 'bogo-sort',
  name: 'Bogo Sort',
  category: 'sorting',
  timeComplexity: { best: 'O(n)', average: 'O(n * n!)', worst: 'O(∞)' },
  spaceComplexity: 'O(1)',
  stable: false,
  inPlace: true,
  description:
    'Randomly shuffles the array and checks if it is sorted. Repeats until sorted (or gives up). A famously terrible algorithm included for educational purposes — it demonstrates why random approaches fail spectacularly for sorting.',
  pseudocode: [
    'procedure bogoSort(A)',
    '  while not isSorted(A) do',
    '    shuffle(A)',
    '  return A',
    '',
    '// Expected attempts: n!',
    '// Expected comparisons: n * n!',
    `// Capped at ${MAX_ATTEMPTS} attempts`,
  ],
};

/** Fisher-Yates shuffle (in place). */
function shuffle(a: number[]): void {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
}

/** Returns true if the array is sorted in non-decreasing order. */
function isSorted(a: number[]): boolean {
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i] > a[i + 1]) return false;
  }
  return true;
}

export function bogoSort(arr: number[]): AlgorithmResult {
  if (arr.length <= 1) {
    return { config: CONFIG, steps: [], finalState: [...arr] };
  }

  const a = [...arr];
  const n = a.length;
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let swaps = 0;
  let reads = 0;
  let writes = 0;
  let attempts = 0;

  while (!isSorted(a) && attempts < MAX_ATTEMPTS) {
    // Record the "check if sorted" step
    comparisons += n - 1;
    reads += 2 * (n - 1);

    const checkMutations: VisualMutation[] = [];
    for (let i = 0; i < n; i++) {
      checkMutations.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: 'comparing',
        easing: 'ease-out',
      });
    }

    steps.push({
      id: stepId++,
      description: `Attempt ${attempts + 1}: check if sorted → NO [${a.join(', ')}]`,
      pseudocodeLine: 1,
      mutations: checkMutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 250,
      arraySnapshot: [...a],
    });

    // Shuffle
    shuffle(a);
    attempts++;
    swaps += n - 1; // Fisher-Yates does n-1 swaps
    writes += 2 * (n - 1);

    const shuffleMutations: VisualMutation[] = [];
    for (let i = 0; i < n; i++) {
      shuffleMutations.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'comparing',
        to: 'swapping',
        easing: 'spring',
      });
    }

    const shuffleDesc = attempts === 1
      ? `Shuffle → [${a.join(', ')}]. Bogo Sort randomly shuffles and checks — this is intentionally terrible, demonstrating why randomized approaches fail for sorting.`
      : `Shuffle → [${a.join(', ')}]`;

    steps.push({
      id: stepId++,
      description: shuffleDesc,
      pseudocodeLine: 2,
      mutations: shuffleMutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 300,
      arraySnapshot: [...a],
    });
  }

  // Final sorted check
  const sorted = isSorted(a);
  comparisons += n - 1;
  reads += 2 * (n - 1);

  if (sorted) {
    // Celebrate — mark all as sorted
    const sortedMutations: VisualMutation[] = [];
    for (let i = 0; i < n; i++) {
      sortedMutations.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: 'sorted',
        easing: 'ease-out',
      });
    }

    steps.push({
      id: stepId++,
      description: `Sorted after ${attempts} shuffle${attempts === 1 ? '' : 's'}! [${a.join(', ')}]`,
      pseudocodeLine: 3,
      mutations: sortedMutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 600,
      arraySnapshot: [...a],
    });
  } else {
    // Hit the cap — give up
    const giveUpMutations: VisualMutation[] = [];
    for (let i = 0; i < n; i++) {
      giveUpMutations.push({
        targetId: `element-${i}`,
        property: 'highlight',
        from: 'default',
        to: 'active',
        easing: 'ease-out',
      });
    }

    steps.push({
      id: stepId++,
      description: `Gave up after ${MAX_ATTEMPTS} attempts — this is why Bogo Sort is O(n * n!)`,
      pseudocodeLine: 7,
      mutations: giveUpMutations,
      complexity: { comparisons, swaps, reads, writes },
      duration: 600,
      arraySnapshot: [...a],
    });
  }

  return { config: CONFIG, steps, finalState: a };
}
