// -----------------------------------------------------------------
// Architex -- Segment Tree Data Structure  (DST-025)
// -----------------------------------------------------------------

import { createStepRecorder } from './types';
import type { DSStep, DSResult, DSMutation } from './types';

// ── Types ──────────────────────────────────────────────────

export interface SegmentTreeState {
  /** Flat array representation: tree[1] is root, tree[2i] left child, tree[2i+1] right. */
  tree: number[];
  /** Lazy propagation markers (pending additive updates). */
  lazy: number[];
  /** Original input size. */
  n: number;
  /** Original input array (for reference). */
  data: number[];
}

function nodeId(idx: number): string {
  return `seg-${idx}`;
}

function cloneSegTree(state: SegmentTreeState): SegmentTreeState {
  return {
    tree: [...state.tree],
    lazy: [...state.lazy],
    n: state.n,
    data: [...state.data],
  };
}

// ── Build ──────────────────────────────────────────────────

function buildHelper(
  tree: number[],
  data: number[],
  node: number,
  start: number,
  end: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  if (start === end) {
    tree[node] = data[start];
    steps.push(
      step(`Leaf node[${node}] = data[${start}] = ${data[start]}`, [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return;
  }

  const mid = Math.floor((start + end) / 2);
  const left = 2 * node;
  const right = 2 * node + 1;

  buildHelper(tree, data, left, start, mid, steps, step);
  buildHelper(tree, data, right, mid + 1, end, steps, step);

  tree[node] = tree[left] + tree[right];

  steps.push(
    step(
      `node[${node}] = node[${left}] + node[${right}] = ${tree[left]} + ${tree[right]} = ${tree[node]}  (range [${start},${end}])`,
      [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'done' },
      ],
    ),
  );
}

export function createSegmentTree(data: number[]): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const n = data.length;

  if (n === 0) {
    steps.push(step('Empty array -- nothing to build', []));
    const state: SegmentTreeState = { tree: [], lazy: [], n: 0, data: [] };
    return { steps, snapshot: state };
  }

  // Allocate 4*n space for worst case
  const size = 4 * n;
  const tree = new Array<number>(size).fill(0);
  const lazy = new Array<number>(size).fill(0);

  steps.push(
    step(`Build segment tree from [${data.join(', ')}] (n=${n})`, []),
  );

  buildHelper(tree, data, 1, 0, n - 1, steps, step);

  steps.push(
    step(`Segment tree built. Root sum = ${tree[1]}`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  const state: SegmentTreeState = { tree, lazy, n, data: [...data] };
  return { steps, snapshot: state };
}

// ── Range Query (Sum) ──────────────────────────────────────

function pushDown(tree: number[], lazy: number[], node: number, start: number, end: number): void {
  if (lazy[node] !== 0) {
    const mid = Math.floor((start + end) / 2);
    const left = 2 * node;
    const right = 2 * node + 1;

    tree[left] += lazy[node] * (mid - start + 1);
    tree[right] += lazy[node] * (end - mid);
    lazy[left] += lazy[node];
    lazy[right] += lazy[node];
    lazy[node] = 0;
  }
}

function queryHelper(
  tree: number[],
  lazy: number[],
  node: number,
  start: number,
  end: number,
  l: number,
  r: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): number {
  if (r < start || end < l) {
    steps.push(
      step(`node[${node}] range [${start},${end}] outside query [${l},${r}] -- skip`, [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
    return 0;
  }

  if (l <= start && end <= r) {
    steps.push(
      step(`node[${node}] range [${start},${end}] fully inside [${l},${r}] -- return ${tree[node]}`, [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'found' },
      ]),
    );
    return tree[node];
  }

  // Partial overlap -- push lazy and recurse
  pushDown(tree, lazy, node, start, end);

  steps.push(
    step(`node[${node}] range [${start},${end}] partial overlap with [${l},${r}] -- split`, [
      { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  const mid = Math.floor((start + end) / 2);
  const leftVal = queryHelper(tree, lazy, 2 * node, start, mid, l, r, steps, step);
  const rightVal = queryHelper(tree, lazy, 2 * node + 1, mid + 1, end, l, r, steps, step);

  return leftVal + rightVal;
}

export function segmentTreeQuery(state: SegmentTreeState, left: number, right: number): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSegTree(state);

  if (s.n === 0) {
    steps.push(step('Tree is empty -- nothing to query', []));
    return { steps, snapshot: s };
  }

  const clampedL = Math.max(0, left);
  const clampedR = Math.min(s.n - 1, right);

  steps.push(
    step(`Range sum query [${clampedL}, ${clampedR}]`, []),
  );

  const result = queryHelper(s.tree, s.lazy, 1, 0, s.n - 1, clampedL, clampedR, steps, step);

  steps.push(
    step(`Query result: sum([${clampedL},${clampedR}]) = ${result}`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Point Update ───────────────────────────────────────────

function pointUpdateHelper(
  tree: number[],
  lazy: number[],
  node: number,
  start: number,
  end: number,
  idx: number,
  value: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  // Push any pending lazy before updating
  if (start !== end) {
    pushDown(tree, lazy, node, start, end);
  }

  if (start === end) {
    const oldVal = tree[node];
    tree[node] = value;
    steps.push(
      step(`Leaf node[${node}]: update data[${idx}] from ${oldVal} to ${value}`, [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'inserting' },
      ]),
    );
    return;
  }

  steps.push(
    step(`Visit node[${node}] range [${start},${end}]`, [
      { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  const mid = Math.floor((start + end) / 2);
  if (idx <= mid) {
    steps.push(
      step(`Index ${idx} <= mid ${mid} -- go left`, []),
    );
    pointUpdateHelper(tree, lazy, 2 * node, start, mid, idx, value, steps, step);
  } else {
    steps.push(
      step(`Index ${idx} > mid ${mid} -- go right`, []),
    );
    pointUpdateHelper(tree, lazy, 2 * node + 1, mid + 1, end, idx, value, steps, step);
  }

  tree[node] = tree[2 * node] + tree[2 * node + 1];

  steps.push(
    step(`Propagate up: node[${node}] = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`, [
      { targetId: nodeId(node), property: 'highlight', from: 'visiting', to: 'done' },
    ]),
  );
}

export function segmentTreeUpdate(
  state: SegmentTreeState,
  index: number,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSegTree(state);

  if (s.n === 0 || index < 0 || index >= s.n) {
    steps.push(step(`Index ${index} out of range [0, ${s.n - 1}] -- no update`, []));
    return { steps, snapshot: s };
  }

  steps.push(
    step(`Point update: data[${index}] = ${value}`, []),
  );

  pointUpdateHelper(s.tree, s.lazy, 1, 0, s.n - 1, index, value, steps, step);
  s.data[index] = value;

  steps.push(
    step(`Update complete. New root sum = ${s.tree[1]}`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}

// ── Range Update (Lazy Propagation) ────────────────────────

function rangeUpdateHelper(
  tree: number[],
  lazy: number[],
  node: number,
  start: number,
  end: number,
  l: number,
  r: number,
  value: number,
  steps: DSStep[],
  step: (desc: string, mutations: DSMutation[]) => DSStep,
): void {
  if (r < start || end < l) {
    steps.push(
      step(`node[${node}] range [${start},${end}] outside update [${l},${r}] -- skip`, [
        { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'not-found' },
      ]),
    );
    return;
  }

  if (l <= start && end <= r) {
    // Fully covered -- apply lazy
    tree[node] += value * (end - start + 1);
    lazy[node] += value;
    steps.push(
      step(
        `node[${node}] range [${start},${end}] fully inside [${l},${r}] -- add ${value} * ${end - start + 1}, set lazy=${lazy[node]}`,
        [
          { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'inserting' },
        ],
      ),
    );
    return;
  }

  // Partial overlap
  pushDown(tree, lazy, node, start, end);

  steps.push(
    step(`node[${node}] range [${start},${end}] partial overlap -- split`, [
      { targetId: nodeId(node), property: 'highlight', from: 'default', to: 'visiting' },
    ]),
  );

  const mid = Math.floor((start + end) / 2);
  rangeUpdateHelper(tree, lazy, 2 * node, start, mid, l, r, value, steps, step);
  rangeUpdateHelper(tree, lazy, 2 * node + 1, mid + 1, end, l, r, value, steps, step);

  tree[node] = tree[2 * node] + tree[2 * node + 1];

  steps.push(
    step(`Propagate up: node[${node}] = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}`, [
      { targetId: nodeId(node), property: 'highlight', from: 'visiting', to: 'done' },
    ]),
  );
}

export function segmentTreeRangeUpdate(
  state: SegmentTreeState,
  left: number,
  right: number,
  value: number,
): DSResult {
  const { step } = createStepRecorder();
  const steps: DSStep[] = [];
  const s = cloneSegTree(state);

  if (s.n === 0) {
    steps.push(step('Tree is empty -- nothing to update', []));
    return { steps, snapshot: s };
  }

  const clampedL = Math.max(0, left);
  const clampedR = Math.min(s.n - 1, right);

  steps.push(
    step(`Range update: add ${value} to every element in [${clampedL}, ${clampedR}]`, []),
  );

  rangeUpdateHelper(s.tree, s.lazy, 1, 0, s.n - 1, clampedL, clampedR, value, steps, step);

  // Update the data array to reflect the range update
  for (let i = clampedL; i <= clampedR; i++) {
    s.data[i] += value;
  }

  steps.push(
    step(`Range update complete. New root sum = ${s.tree[1]}`, [
      { targetId: nodeId(1), property: 'highlight', from: 'default', to: 'done' },
    ]),
  );

  return { steps, snapshot: s };
}
