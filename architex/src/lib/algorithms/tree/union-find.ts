// -----------------------------------------------------------------
// Architex -- Union-Find (Disjoint Set) with Step Recording
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';

export const UNION_FIND_CONFIG: AlgorithmConfig = {
  id: 'union-find',
  name: 'Union-Find (Disjoint Set)',
  category: 'tree',
  difficulty: 'intermediate',
  timeComplexity: {
    best: 'O(α(n))',
    average: 'O(α(n))',
    worst: 'O(α(n))',
  },
  spaceComplexity: 'O(n)',
  description:
    'How do social networks detect friend groups? Union-Find tracks which elements belong to the same set. Union merges two sets. Find checks if two elements are connected. Path compression flattens the tree during find(), making future queries nearly O(1).',
  pseudocode: [
    'procedure makeSet(x)',
    '  parent[x] = x',
    '  rank[x] = 0',
    '',
    'procedure find(x)',
    '  if parent[x] != x then',
    '    parent[x] = find(parent[x])   // path compression',
    '  return parent[x]',
    '',
    'procedure union(x, y)',
    '  rootX = find(x)',
    '  rootY = find(y)',
    '  if rootX == rootY then return    // already connected',
    '  if rank[rootX] < rank[rootY] then',
    '    parent[rootX] = rootY',
    '  else if rank[rootX] > rank[rootY] then',
    '    parent[rootY] = rootX',
    '  else',
    '    parent[rootY] = rootX',
    '    rank[rootX]++',
  ],
};

/** Default union operations to demonstrate the algorithm. */
export const DEFAULT_UNION_OPS: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [0, 2],
  [4, 6],
  [3, 5],
  [1, 7],
];

export const DEFAULT_ELEMENT_COUNT = 8;

function mut(
  nodeId: number | string,
  property: VisualMutation['property'],
  from: string | number,
  to: string | number,
): VisualMutation {
  return { targetId: `tnode-${nodeId}`, property, from, to, easing: 'ease-out' };
}

/**
 * Union-Find demonstration.
 * Performs makeSet for n elements, then a series of union operations,
 * showing path compression and union by rank.
 *
 * Input array: first element is the element count, followed by pairs for union ops.
 * e.g. [8, 0, 1, 2, 3] means 8 elements, union(0,1), union(2,3).
 * If empty, uses defaults.
 */
export function unionFind(input: number[]): AlgorithmResult {
  let n: number;
  let ops: [number, number][];

  if (input.length >= 3) {
    n = input[0];
    ops = [];
    for (let i = 1; i < input.length - 1; i += 2) {
      ops.push([input[i], input[i + 1]]);
    }
  } else {
    n = DEFAULT_ELEMENT_COUNT;
    ops = [...DEFAULT_UNION_OPS];
  }

  const parent: number[] = new Array(n);
  const rank: number[] = new Array(n).fill(0);
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  function addStep(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    duration: number,
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration,
    });
  }

  // Phase 1: MakeSet for each element
  addStep(
    `Create ${n} singleton sets — each element is its own parent (its own root).`,
    0,
    [],
    400,
  );

  for (let i = 0; i < n; i++) {
    parent[i] = i;
    rank[i] = 0;
    writes++;

    addStep(
      `makeSet(${i}): parent[${i}] = ${i}, rank[${i}] = 0`,
      1,
      [mut(i, 'highlight', 'default', 'inserting')],
      300,
    );
  }

  // Phase 2: Find with path compression
  function find(x: number): number {
    reads++;

    if (parent[x] !== x) {
      addStep(
        `find(${x}): parent[${x}] = ${parent[x]}, not root — recurse up`,
        5,
        [mut(x, 'highlight', 'default', 'visiting')],
        350,
      );

      const root = find(parent[x]);

      // Path compression: point directly to root
      if (parent[x] !== root) {
        const oldParent = parent[x];
        parent[x] = root;
        writes++;

        addStep(
          `Path compression: parent[${x}] changed from ${oldParent} to root ${root} — flattening the tree for faster future queries.`,
          6,
          [
            mut(x, 'highlight', 'visiting', 'found'),
            mut(root, 'highlight', 'default', 'current'),
          ],
          400,
        );
      }

      return root;
    }

    addStep(
      `find(${x}): ${x} is root (parent[${x}] == ${x})`,
      7,
      [mut(x, 'highlight', 'default', 'found')],
      300,
    );

    return x;
  }

  // Phase 3: Union by rank
  function union(x: number, y: number): void {
    addStep(
      `union(${x}, ${y}): Find roots of both elements to determine which set each belongs to.`,
      9,
      [
        mut(x, 'highlight', 'default', 'active'),
        mut(y, 'highlight', 'default', 'active'),
      ],
      400,
    );

    const rootX = find(x);
    const rootY = find(y);

    comparisons++;

    if (rootX === rootY) {
      addStep(
        `${x} and ${y} already in the same set (root = ${rootX}) — nothing to do.`,
        12,
        [mut(rootX, 'highlight', 'default', 'found')],
        400,
      );
      return;
    }

    comparisons++;
    reads += 2;

    if (rank[rootX] < rank[rootY]) {
      parent[rootX] = rootY;
      writes++;

      addStep(
        `rank[${rootX}]=${rank[rootX]} < rank[${rootY}]=${rank[rootY]} — attach ${rootX} under ${rootY}. The shorter tree goes under the taller one to keep the structure flat.`,
        14,
        [
          mut(rootX, 'highlight', 'default', 'swapping'),
          mut(rootY, 'highlight', 'default', 'current'),
        ],
        500,
      );
    } else if (rank[rootX] > rank[rootY]) {
      parent[rootY] = rootX;
      writes++;

      addStep(
        `rank[${rootX}]=${rank[rootX]} > rank[${rootY}]=${rank[rootY]} — attach ${rootY} under ${rootX}.`,
        16,
        [
          mut(rootY, 'highlight', 'default', 'swapping'),
          mut(rootX, 'highlight', 'default', 'current'),
        ],
        500,
      );
    } else {
      parent[rootY] = rootX;
      rank[rootX]++;
      writes += 2;

      addStep(
        `Equal ranks (${rank[rootX] - 1}) — attach ${rootY} under ${rootX}, increment rank[${rootX}] to ${rank[rootX]}.`,
        18,
        [
          mut(rootY, 'highlight', 'default', 'swapping'),
          mut(rootX, 'highlight', 'default', 'current'),
        ],
        500,
      );
    }
  }

  // Execute all union operations
  for (const [x, y] of ops) {
    union(x, y);
  }

  // Final state: show connected components
  const componentMap = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!componentMap.has(root)) {
      componentMap.set(root, []);
    }
    componentMap.get(root)!.push(i);
  }

  const components = Array.from(componentMap.values());
  addStep(
    `Union-Find complete. ${components.length} connected component(s): ${components.map((c) => `{${c.join(', ')}}`).join(', ')}`,
    19,
    Array.from({ length: n }, (_, i) => mut(i, 'highlight', 'default', 'found')),
    600,
  );

  // finalState: parent array
  const finalState = [...parent];

  return { config: UNION_FIND_CONFIG, steps, finalState };
}
