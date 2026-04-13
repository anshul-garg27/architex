// -----------------------------------------------------------------
// Architex -- Fenwick Tree (Binary Indexed Tree) with Step Recording  (ALG-200)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Config ──────────────────────────────────────────────────

export const FENWICK_TREE_CONFIG: AlgorithmConfig = {
  id: 'fenwick-tree',
  name: 'Fenwick Tree (BIT)',
  category: 'tree',
  difficulty: 'advanced',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'A simpler alternative to Segment Tree — Fenwick Tree uses a clever bit manipulation trick to store partial sums in a flat array. Update: add to the current index, then add the lowest set bit to jump to the next responsible position. Query: sum from index down to 0 by subtracting the lowest set bit each time. Half the code of Segment Tree, but only supports prefix queries (not arbitrary ranges). Used in: competitive programming, counting inversions, frequency tables.',
  complexityIntuition:
    'O(log n) for both query and update: the lowest-set-bit trick means you jump through at most log n positions in the array. Build is O(n log n) naively, O(n) with the in-place trick.',
  realWorldApps: [
    'Competitive programming (prefix sums, inversions)',
    'Frequency tables (count elements <= x)',
    'Coordinate compression with range queries',
  ],
  interviewTips:
    "Know: lowbit(x) = x & (-x). Follow-up: 'Fenwick vs Segment Tree?' Fenwick is simpler and faster in practice, but only handles prefix/point queries. For arbitrary range updates, use Segment Tree with lazy propagation.",
  whenToUse:
    'Use when you need prefix sum queries with point updates. Simpler and faster constant than Segment Tree. For arbitrary range queries, use Segment Tree instead.',
  summary: [
    'Flat array with partial sums. Uses bit tricks to navigate.',
    'Update: add lowest set bit. Query: subtract lowest set bit.',
    '"Half the code of Segment Tree" -- but prefix queries only.',
  ],
  commonMistakes: [
    '"Fenwick Tree can do arbitrary range queries" -- only prefix sums. For sum(l..r), compute prefix(r) - prefix(l-1).',
    '"Fenwick uses 1-indexed by convention" -- yes! Index 0 is unused. Off-by-one errors are the #1 bug.',
  ],
  pseudocode: [
    'procedure update(bit, i, delta)',
    '  while i <= n:',
    '    bit[i] += delta',
    '    i += i & (-i)          // add lowest set bit',
    '',
    'procedure query(bit, i)',
    '  sum = 0',
    '  while i > 0:',
    '    sum += bit[i]',
    '    i -= i & (-i)          // subtract lowest set bit',
    '  return sum',
    '',
    'procedure build(arr)',
    '  bit = [0] * (n+1)',
    '  for i = 1 to n:',
    '    update(bit, i, arr[i-1])',
    '',
    'procedure rangeQuery(bit, l, r)',
    '  return query(bit, r) - query(bit, l-1)',
  ],
};

// ── Helpers ─────────────────────────────────────────────────

function mut(
  nodeIndex: number | string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeIndex}`, property, from, to, easing: 'ease-out' };
}

/**
 * Returns the lowest set bit of x.
 * e.g. lowbit(6) = lowbit(110_2) = 2 (10_2)
 */
function lowbit(x: number): number {
  return x & (-x);
}

/** Format a number in binary with prefix. */
function bin(x: number): string {
  return x.toString(2).padStart(4, '0');
}

// ── Default input ───────────────────────────────────────────

/** Default input array for the Fenwick tree demo. */
export const DEFAULT_FENWICK_INPUT = [3, 2, -1, 6, 5, 4, -3, 3];

/** Default operations: [type, ...args] where type 0 = prefix query(i), 1 = point update(i, delta). */
export const DEFAULT_FENWICK_OPS: Array<[number, ...number[]]> = [
  [0, 4],       // prefix sum [1..4]
  [0, 7],       // prefix sum [1..7]
  [1, 3, 5],    // update index 3 by +5
  [0, 4],       // prefix sum [1..4] after update
];

// ── Fenwick Tree ────────────────────────────────────────────

/**
 * Fenwick Tree (Binary Indexed Tree) demonstration.
 * Builds a Fenwick Tree for prefix sum queries and point updates,
 * showing the bit manipulation jumps at each step.
 *
 * Input format: [n, a0, a1, ..., an-1, op_type, ...args, ...]
 *   op_type 0 = prefix query (i -- 1-indexed), op_type 1 = point update (i, delta)
 * If input is empty, uses defaults.
 */
export function fenwickTree(input: number[]): AlgorithmResult {
  let arr: number[];
  let ops: Array<[number, ...number[]]>;

  if (input.length >= 1) {
    const n = input[0];
    arr = input.slice(1, 1 + n);
    ops = [];
    let i = 1 + n;
    while (i < input.length) {
      const type = input[i];
      if (type === 0 && i + 1 < input.length) {
        ops.push([0, input[i + 1]]);
        i += 2;
      } else if (type === 1 && i + 2 < input.length) {
        ops.push([1, input[i + 1], input[i + 2]]);
        i += 3;
      } else {
        i++;
      }
    }
    if (arr.length === 0) {
      arr = [...DEFAULT_FENWICK_INPUT];
      ops = [...DEFAULT_FENWICK_OPS];
    }
  } else {
    arr = [...DEFAULT_FENWICK_INPUT];
    ops = [...DEFAULT_FENWICK_OPS];
  }

  const n = arr.length;
  // BIT is 1-indexed; index 0 is unused
  const bit: number[] = new Array(n + 1).fill(0);
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    duration = 400,
    milestone?: string,
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration,
      ...(milestone ? { milestone } : {}),
    });
  }

  // ── Build ───────────────────────────────────────────────

  addStep(
    `Build Fenwick Tree from array [${arr.join(', ')}] (n=${n}). The BIT is 1-indexed: bit[i] stores the sum of a specific range determined by the lowest set bit of i.`,
    12,
    [],
    500,
    'Build Phase',
  );

  function buildUpdate(i: number, delta: number, showSteps: boolean): void {
    const startI = i;
    let jumpCount = 0;
    while (i <= n) {
      bit[i] += delta;
      writes++;

      if (showSteps) {
        const lb = lowbit(i);
        addStep(
          `bit[${i}] += ${delta} -> bit[${i}] = ${bit[i]}. Index ${i} in binary = ${bin(i)}, lowbit = ${lb} (${bin(lb)}). Next: ${i} + ${lb} = ${i + lb}.`,
          2,
          [mut(i, 'highlight', 'default', 'inserting')],
          350,
        );
      }

      i += lowbit(i);
      jumpCount++;
    }

    if (showSteps) {
      addStep(
        `Update for arr[${startI - 1}] complete after ${jumpCount} jumps. Jumped past n=${n}, stopping.`,
        3,
        [],
        300,
      );
    }
  }

  // Build by inserting each element
  for (let i = 0; i < n; i++) {
    const oneIdx = i + 1;
    addStep(
      `Insert arr[${i}] = ${arr[i]} at BIT position ${oneIdx}. Walk upward adding lowest set bit each time.`,
      14,
      [mut(oneIdx, 'highlight', 'default', 'visiting')],
      350,
    );
    buildUpdate(oneIdx, arr[i], true);
  }

  addStep(
    `Fenwick Tree built. BIT array: [${bit.slice(1).join(', ')}]. Each position stores a partial sum covering lowbit(i) elements ending at index i.`,
    15,
    Array.from({ length: n }, (_, i) => mut(i + 1, 'highlight', 'default', 'found')),
    500,
  );

  // ── Prefix Query ────────────────────────────────────────

  function prefixQuery(i: number): number {
    let sum = 0;
    const startI = i;
    let jumpCount = 0;

    addStep(
      `Prefix query: sum of arr[0..${i - 1}]. Start at BIT index ${i}, subtract lowest set bit to walk toward 0.`,
      6,
      [mut(i, 'highlight', 'default', 'current')],
      400,
    );

    while (i > 0) {
      const lb = lowbit(i);
      sum += bit[i];
      reads++;
      jumpCount++;

      addStep(
        `sum += bit[${i}] = ${bit[i]} -> running sum = ${sum}. Index ${i} binary = ${bin(i)}, lowbit = ${lb} (${bin(lb)}). Next: ${i} - ${lb} = ${i - lb}.`,
        8,
        [mut(i, 'highlight', 'default', 'found')],
        400,
      );

      i -= lb;
    }

    comparisons++;
    addStep(
      `Prefix query complete: sum(arr[0..${startI - 1}]) = ${sum}. Accessed ${jumpCount} BIT positions.`,
      10,
      [],
      400,
    );

    return sum;
  }

  // ── Point Update ────────────────────────────────────────

  function pointUpdate(i: number, delta: number): void {
    const startI = i;
    let jumpCount = 0;

    addStep(
      `Point update: add ${delta} to BIT position ${i} (arr[${i - 1}]). Walk upward adding lowest set bit to propagate the change.`,
      0,
      [mut(i, 'highlight', 'default', 'current')],
      400,
    );

    while (i <= n) {
      const lb = lowbit(i);
      const oldVal = bit[i];
      bit[i] += delta;
      writes++;
      jumpCount++;

      addStep(
        `bit[${i}] += ${delta}: ${oldVal} -> ${bit[i]}. Index ${i} binary = ${bin(i)}, lowbit = ${lb} (${bin(lb)}). Next: ${i} + ${lb} = ${i + lb}.`,
        2,
        [mut(i, 'highlight', 'default', 'inserting')],
        400,
      );

      i += lb;
    }

    // Also update the underlying array for bookkeeping
    arr[startI - 1] += delta;

    addStep(
      `Update complete for position ${startI}: ${jumpCount} jumps. arr is now [${arr.join(', ')}].`,
      3,
      [],
      400,
    );
  }

  // ── Execute operations ──────────────────────────────────

  for (const op of ops) {
    if (op[0] === 0) {
      // Prefix query (1-indexed)
      const i = op[1];
      addStep(
        `Prefix sum query for index ${i}. The key insight: subtract the lowest set bit to jump to the next partial sum that doesn't overlap.`,
        5,
        [],
        400,
        `Query prefix(${i})`,
      );
      const result = prefixQuery(i);
      addStep(
        `Result: prefix(${i}) = ${result}.`,
        10,
        [mut(Math.min(i, n), 'highlight', 'default', 'found')],
        500,
      );
    } else if (op[0] === 1) {
      // Point update (1-indexed)
      const i = op[1];
      const delta = op[2];
      addStep(
        `Point update: arr[${i - 1}] += ${delta}. The key insight: add the lowest set bit to jump to the next BIT position that includes this index in its range.`,
        0,
        [],
        400,
        `Update arr[${i - 1}] += ${delta}`,
      );
      pointUpdate(i, delta);
    }
  }

  addStep(
    `All operations complete. Final array: [${arr.join(', ')}]. Fenwick Tree BIT: [${bit.slice(1).join(', ')}].`,
    17,
    [],
    500,
  );

  return { config: FENWICK_TREE_CONFIG, steps, finalState: [...arr] };
}
