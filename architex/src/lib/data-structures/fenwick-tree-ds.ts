// -----------------------------------------------------------------
// Architex -- Fenwick Tree (Binary Indexed Tree)  (DST-026)
// Efficient prefix sums with O(log n) point update and query.
// Step recording shows binary lowbit pattern at each index.
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface FenwickTreeState {
  /** BIT array (1-indexed; index 0 is unused). */
  tree: number[];
  /** Original input data (0-indexed). */
  data: number[];
  /** Number of elements. */
  n: number;
}

function nodeId(idx: number): string {
  return `bit-${idx}`;
}

/** Lowest set bit of i:  i & (-i).  Also known as lowbit. */
function lowbit(i: number): number {
  return i & -i;
}

/** Format number as binary string for visualization. */
function bin(n: number): string {
  return n.toString(2).padStart(8, '0');
}

function cloneFenwick(state: FenwickTreeState): FenwickTreeState {
  return {
    tree: [...state.tree],
    data: [...state.data],
    n: state.n,
  };
}

// ── Build ──────────────────────────────────────────────────

/**
 * Build a Fenwick tree from a 0-indexed array.
 * Uses the O(n) linear build technique.
 */
export function createFenwickTree(array: number[]): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const n = array.length;

  if (n === 0) {
    steps.push(step('Empty array -- nothing to build', []));
    const state: FenwickTreeState = { tree: [0], data: [], n: 0 };
    return { steps, snapshot: state };
  }

  steps.push(
    step(`Build Fenwick tree from [${array.join(', ')}] (n=${n})`, []),
  );

  // BIT is 1-indexed: tree[0] is unused sentinel
  const tree = new Array<number>(n + 1).fill(0);

  // Copy values into 1-indexed positions
  for (let i = 0; i < n; i++) {
    tree[i + 1] = array[i];
  }

  steps.push(
    step(`Initialise tree[1..${n}] with input values`, []),
  );

  // O(n) build: propagate each node to its parent
  for (let i = 1; i <= n; i++) {
    const parent = i + lowbit(i);
    steps.push(
      step(
        `tree[${i}] = ${tree[i]}  |  index ${i} (${bin(i)}), lowbit = ${lowbit(i)} (${bin(lowbit(i))}), parent = ${parent}`,
        [
          { targetId: nodeId(i), property: 'highlight', from: 'default', to: 'inserting' },
        ],
      ),
    );
    if (parent <= n) {
      tree[parent] += tree[i];
      steps.push(
        step(
          `Propagate tree[${i}] -> tree[${parent}]:  tree[${parent}] += ${tree[i] - (tree[parent] - tree[i])} => ${tree[parent]}`,
          [
            { targetId: nodeId(parent), property: 'highlight', from: 'default', to: 'visiting' },
          ],
        ),
      );
    }
  }

  steps.push(
    step(`Fenwick tree built. Tree = [${tree.slice(1).join(', ')}]`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  const state: FenwickTreeState = { tree, data: [...array], n };
  return { steps, snapshot: state };
}

// ── Point Update ───────────────────────────────────────────

/**
 * Add delta to the element at the given 0-based index.
 * Propagates through ancestors using lowbit.
 */
export function fenwickUpdate(
  state: FenwickTreeState,
  index: number,
  delta: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneFenwick(state);

  if (index < 0 || index >= s.n) {
    steps.push(step(`Index ${index} out of range [0, ${s.n - 1}] -- no update`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Point update: data[${index}] += ${delta}`, []),
  );

  s.data[index] += delta;

  // BIT is 1-indexed
  let i = index + 1;
  while (i <= s.n) {
    const oldVal = s.tree[i];
    s.tree[i] += delta;
    steps.push(
      step(
        `tree[${i}] (${bin(i)}):  ${oldVal} + ${delta} = ${s.tree[i]}  |  lowbit = ${lowbit(i)} (${bin(lowbit(i))})`,
        [
          { targetId: nodeId(i), property: 'highlight', from: 'default', to: 'inserting' },
        ],
      ),
    );
    const next = i + lowbit(i);
    steps.push(
      step(
        `Next: ${i} + lowbit(${i}) = ${i} + ${lowbit(i)} = ${next}${next > s.n ? ' (out of range -- done)' : ''}`,
        [],
      ),
    );
    i = next;
  }

  steps.push(
    step(`Update complete. data[${index}] is now ${s.data[index]}`, [
      { targetId: nodeId(index + 1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Prefix Sum Query ───────────────────────────────────────

/**
 * Compute prefix sum from data[0] through data[index] (inclusive).
 * Index is 0-based.
 */
export function fenwickPrefixSum(
  state: FenwickTreeState,
  index: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (state.n === 0) {
    steps.push(step('Tree is empty -- prefix sum is 0', []));
    return { steps, snapshot: state };
  }

  const clampedIdx = Math.min(index, state.n - 1);

  steps.push(
    step(`Prefix sum query: sum(data[0..${clampedIdx}])`, []),
  );

  let sum = 0;
  let i = clampedIdx + 1; // convert to 1-indexed

  while (i > 0) {
    sum += state.tree[i];
    steps.push(
      step(
        `Add tree[${i}] (${bin(i)}) = ${state.tree[i]}  |  running sum = ${sum}  |  lowbit = ${lowbit(i)}`,
        [
          { targetId: nodeId(i), property: 'highlight', from: 'default', to: 'found' },
        ],
      ),
    );
    const next = i - lowbit(i);
    steps.push(
      step(
        `Next: ${i} - lowbit(${i}) = ${i} - ${lowbit(i)} = ${next}${next === 0 ? ' (done)' : ''}`,
        [],
      ),
    );
    i = next;
  }

  steps.push(
    step(`Prefix sum(data[0..${clampedIdx}]) = ${sum}`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: state };
}

// ── Range Sum Query ────────────────────────────────────────

/**
 * Compute sum of data[left..right] (inclusive, 0-based) using
 * prefixSum(right) - prefixSum(left - 1).
 */
export function fenwickRangeSum(
  state: FenwickTreeState,
  left: number,
  right: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];

  if (state.n === 0) {
    steps.push(step('Tree is empty -- range sum is 0', []));
    return { steps, snapshot: state };
  }

  const clampedL = Math.max(0, left);
  const clampedR = Math.min(state.n - 1, right);

  steps.push(
    step(`Range sum query: sum(data[${clampedL}..${clampedR}])`, []),
  );

  // Compute prefixSum(right)
  steps.push(step(`Step 1: compute prefixSum(${clampedR})`, []));

  let sumR = 0;
  let i = clampedR + 1;
  while (i > 0) {
    sumR += state.tree[i];
    steps.push(
      step(
        `  Add tree[${i}] (${bin(i)}) = ${state.tree[i]}  |  sumR = ${sumR}`,
        [
          { targetId: nodeId(i), property: 'highlight', from: 'default', to: 'found' },
        ],
      ),
    );
    i -= lowbit(i);
  }

  let sumL = 0;
  if (clampedL > 0) {
    steps.push(step(`Step 2: compute prefixSum(${clampedL - 1})`, []));

    let j = clampedL; // 1-indexed version of (clampedL - 1 + 1)
    while (j > 0) {
      sumL += state.tree[j];
      steps.push(
        step(
          `  Add tree[${j}] (${bin(j)}) = ${state.tree[j]}  |  sumL = ${sumL}`,
          [
            { targetId: nodeId(j), property: 'highlight', from: 'default', to: 'visiting' },
          ],
        ),
      );
      j -= lowbit(j);
    }
  } else {
    steps.push(step(`Step 2: left=0, so prefixSum(-1) = 0`, []));
  }

  const result = sumR - sumL;
  steps.push(
    step(
      `Range sum(data[${clampedL}..${clampedR}]) = prefixSum(${clampedR}) - prefixSum(${clampedL > 0 ? clampedL - 1 : -1}) = ${sumR} - ${sumL} = ${result}`,
      [
        { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );

  return { steps, snapshot: state };
}
