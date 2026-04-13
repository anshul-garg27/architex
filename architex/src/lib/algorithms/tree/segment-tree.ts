// -----------------------------------------------------------------
// Architex -- Segment Tree with Step Recording  (ALG-200)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

// ── Config ──────────────────────────────────────────────────

export const SEGMENT_TREE_CONFIG: AlgorithmConfig = {
  id: 'segment-tree',
  name: 'Segment Tree',
  category: 'tree',
  difficulty: 'advanced',
  timeComplexity: {
    best: 'O(log n)',
    average: 'O(log n)',
    worst: 'O(log n)',
  },
  spaceComplexity: 'O(n)',
  description:
    'Need to quickly find the sum of any range in an array AND update individual values? A Segment Tree does both in O(log n). It\'s a binary tree where each node stores the sum of a range. The root stores the total sum, children split the range in half. Query: traverse only the relevant branches. Update: change one leaf, update all ancestors. Used in: competitive programming (range queries), database indexing, computational geometry.',
  complexityIntuition:
    'O(n) to build: touch each of the ~2n nodes once. O(log n) for query/update: the tree has log n levels, and you visit at most 2 nodes per level.',
  realWorldApps: [
    'Competitive programming (range queries)',
    'Database indexing (range aggregations)',
    'Computational geometry (interval queries)',
  ],
  interviewTips:
    "Know build, query, update cold. Follow-up: 'What about lazy propagation?' Needed for range updates, not just point updates. 'Segment Tree vs Fenwick Tree?' Segment Tree supports arbitrary range queries; Fenwick only prefix sums.",
  whenToUse:
    'Use when you need both range queries and point/range updates. For prefix sums only, Fenwick Tree is simpler. For static arrays, use a prefix sum array.',
  summary: [
    'Binary tree: each node stores aggregate (sum) over a range.',
    'Build O(n), query O(log n), update O(log n).',
    '"Split the range in half" -- traverse only relevant branches.',
  ],
  commonMistakes: [
    '"Segment Tree needs 2n space" -- actually needs up to 4n to handle non-power-of-2 sizes safely.',
    '"Query visits every node" -- it visits at most O(log n) nodes by pruning irrelevant branches.',
  ],
  pseudocode: [
    'procedure build(node, start, end, arr)',
    '  if start == end:',
    '    tree[node] = arr[start]',
    '    return',
    '  mid = (start + end) / 2',
    '  build(2*node, start, mid, arr)',
    '  build(2*node+1, mid+1, end, arr)',
    '  tree[node] = tree[2*node] + tree[2*node+1]',
    '',
    'procedure query(node, start, end, l, r)',
    '  if r < start or end < l: return 0',
    '  if l <= start and end <= r: return tree[node]',
    '  mid = (start + end) / 2',
    '  return query(2*node, start, mid, l, r)',
    '       + query(2*node+1, mid+1, end, l, r)',
    '',
    'procedure update(node, start, end, idx, val)',
    '  if start == end:',
    '    tree[node] = val',
    '    return',
    '  mid = (start + end) / 2',
    '  if idx <= mid: update(2*node, start, mid, idx, val)',
    '  else: update(2*node+1, mid+1, end, idx, val)',
    '  tree[node] = tree[2*node] + tree[2*node+1]',
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

// ── Default input ───────────────────────────────────────────

/** Default input array for the segment tree demo. */
export const DEFAULT_SEGMENT_INPUT = [1, 3, 5, 7, 9, 11];

/** Default queries: [type, ...args] where type 0 = range query, 1 = point update. */
export const DEFAULT_SEGMENT_OPS: Array<[number, ...number[]]> = [
  [0, 1, 3],   // query sum [1..3]
  [0, 0, 5],   // query sum [0..5]
  [1, 3, 10],  // update index 3 to value 10
  [0, 1, 3],   // query sum [1..3] again after update
];

// ── Segment Tree ────────────────────────────────────────────

/**
 * Segment Tree demonstration.
 * Builds a segment tree for range SUM queries, then performs queries and updates.
 *
 * Input format: [n, a0, a1, ..., an-1, op_type, ...args, ...]
 *   op_type 0 = range query (l, r), op_type 1 = point update (idx, val)
 * If input is empty, uses defaults.
 */
export function segmentTree(input: number[]): AlgorithmResult {
  let arr: number[];
  let ops: Array<[number, ...number[]]>;

  if (input.length >= 1) {
    // Parse: first number is array length, then array, then ops
    const n = input[0];
    arr = input.slice(1, 1 + n);
    ops = [];
    let i = 1 + n;
    while (i < input.length) {
      const type = input[i];
      if (type === 0 && i + 2 < input.length) {
        ops.push([0, input[i + 1], input[i + 2]]);
        i += 3;
      } else if (type === 1 && i + 2 < input.length) {
        ops.push([1, input[i + 1], input[i + 2]]);
        i += 3;
      } else {
        i++;
      }
    }
    if (arr.length === 0) {
      arr = [...DEFAULT_SEGMENT_INPUT];
      ops = [...DEFAULT_SEGMENT_OPS];
    }
  } else {
    arr = [...DEFAULT_SEGMENT_INPUT];
    ops = [...DEFAULT_SEGMENT_OPS];
  }

  const n = arr.length;
  // Allocate 4*n to safely hold the segment tree
  const tree: number[] = new Array(4 * n).fill(0);
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
    `Build segment tree from array [${arr.join(', ')}] (n=${n}). Each leaf stores one element; internal nodes store the sum of their children's ranges.`,
    0,
    [],
    500,
    'Build Phase',
  );

  function build(node: number, start: number, end: number): void {
    if (start === end) {
      tree[node] = arr[start];
      writes++;
      addStep(
        `Leaf node ${node}: tree[${node}] = arr[${start}] = ${arr[start]}. This node covers range [${start}..${start}].`,
        2,
        [mut(node, 'highlight', 'default', 'inserting')],
        350,
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    reads++;
    addStep(
      `Node ${node} covers [${start}..${end}]. Split at mid=${mid}: left child covers [${start}..${mid}], right child covers [${mid + 1}..${end}].`,
      4,
      [mut(node, 'highlight', 'default', 'visiting')],
      350,
    );

    build(2 * node, start, mid);
    build(2 * node + 1, mid + 1, end);

    tree[node] = tree[2 * node] + tree[2 * node + 1];
    writes++;
    reads += 2;

    addStep(
      `Merge: tree[${node}] = tree[${2 * node}] + tree[${2 * node + 1}] = ${tree[2 * node]} + ${tree[2 * node + 1]} = ${tree[node]}. Node ${node} now stores sum of range [${start}..${end}].`,
      7,
      [
        mut(node, 'highlight', 'visiting', 'visited'),
        mut(2 * node, 'highlight', 'inserting', 'visited'),
        mut(2 * node + 1, 'highlight', 'inserting', 'visited'),
      ],
      400,
    );
  }

  build(1, 0, n - 1);

  addStep(
    `Segment tree built. Root tree[1] = ${tree[1]} (total sum). The tree has ~${2 * n} nodes and height ${Math.ceil(Math.log2(n)) + 1}.`,
    7,
    [mut(1, 'highlight', 'default', 'found')],
    500,
  );

  // ── Range Query ─────────────────────────────────────────

  function query(
    node: number,
    start: number,
    end: number,
    l: number,
    r: number,
  ): number {
    comparisons++;

    // Completely outside
    if (r < start || end < l) {
      addStep(
        `Node ${node} range [${start}..${end}] is outside query [${l}..${r}] -- return 0. Pruned.`,
        10,
        [mut(node, 'highlight', 'default', 'visiting')],
        300,
      );
      return 0;
    }

    // Completely inside
    if (l <= start && end <= r) {
      reads++;
      addStep(
        `Node ${node} range [${start}..${end}] is fully inside query [${l}..${r}] -- return tree[${node}] = ${tree[node]}. No need to go deeper.`,
        11,
        [mut(node, 'highlight', 'default', 'found')],
        400,
      );
      return tree[node];
    }

    // Partial overlap -- must check both children
    const mid = Math.floor((start + end) / 2);
    reads++;
    addStep(
      `Node ${node} range [${start}..${end}] partially overlaps query [${l}..${r}] -- check both children at mid=${mid}.`,
      12,
      [mut(node, 'highlight', 'default', 'current')],
      350,
    );

    const leftSum = query(2 * node, start, mid, l, r);
    const rightSum = query(2 * node + 1, mid + 1, end, l, r);
    const total = leftSum + rightSum;

    addStep(
      `Node ${node}: left sum = ${leftSum}, right sum = ${rightSum}, combined = ${total}.`,
      14,
      [mut(node, 'highlight', 'current', 'visited')],
      350,
    );

    return total;
  }

  // ── Point Update ────────────────────────────────────────

  function update(
    node: number,
    start: number,
    end: number,
    idx: number,
    val: number,
  ): void {
    if (start === end) {
      const oldVal = tree[node];
      tree[node] = val;
      arr[idx] = val;
      writes++;

      addStep(
        `Leaf node ${node}: update tree[${node}] from ${oldVal} to ${val}. This is arr[${idx}].`,
        18,
        [mut(node, 'highlight', 'default', 'inserting')],
        400,
      );
      return;
    }

    const mid = Math.floor((start + end) / 2);
    comparisons++;
    reads++;

    if (idx <= mid) {
      addStep(
        `Update index ${idx} <= mid ${mid}: go left to node ${2 * node} covering [${start}..${mid}].`,
        21,
        [mut(node, 'highlight', 'default', 'visiting')],
        350,
      );
      update(2 * node, start, mid, idx, val);
    } else {
      addStep(
        `Update index ${idx} > mid ${mid}: go right to node ${2 * node + 1} covering [${mid + 1}..${end}].`,
        22,
        [mut(node, 'highlight', 'default', 'visiting')],
        350,
      );
      update(2 * node + 1, mid + 1, end, idx, val);
    }

    const oldSum = tree[node];
    tree[node] = tree[2 * node] + tree[2 * node + 1];
    reads += 2;
    writes++;

    addStep(
      `Propagate up: tree[${node}] updated from ${oldSum} to ${tree[node]} (= ${tree[2 * node]} + ${tree[2 * node + 1]}). All ancestors on the path to root are updated.`,
      23,
      [mut(node, 'highlight', 'visiting', 'visited')],
      400,
    );
  }

  // ── Execute operations ──────────────────────────────────

  for (const op of ops) {
    if (op[0] === 0) {
      // Range query
      const l = op[1];
      const r = op[2];
      addStep(
        `Range query: sum of arr[${l}..${r}]. Traverse the tree, pruning branches that don't overlap the query range.`,
        9,
        [],
        400,
        `Query [${l}..${r}]`,
      );
      const result = query(1, 0, n - 1, l, r);
      addStep(
        `Query result: sum(arr[${l}..${r}]) = ${result}.`,
        14,
        [mut(1, 'highlight', 'default', 'found')],
        500,
      );
    } else if (op[0] === 1) {
      // Point update
      const idx = op[1];
      const val = op[2];
      addStep(
        `Point update: set arr[${idx}] = ${val}. Walk from root to the leaf, then propagate new sums back up to root.`,
        16,
        [],
        400,
        `Update arr[${idx}] = ${val}`,
      );
      update(1, 0, n - 1, idx, val);
      addStep(
        `Update complete. arr is now [${arr.join(', ')}]. Tree root sum = ${tree[1]}.`,
        23,
        [mut(1, 'highlight', 'default', 'found')],
        500,
      );
    }
  }

  addStep(
    `All operations complete. Final array: [${arr.join(', ')}]. Total sum = ${tree[1]}.`,
    23,
    [],
    500,
  );

  return { config: SEGMENT_TREE_CONFIG, steps, finalState: [...arr] };
}
