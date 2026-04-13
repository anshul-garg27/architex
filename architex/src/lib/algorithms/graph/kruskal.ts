// -----------------------------------------------------------------
// Architex -- Kruskal's MST with Step Recording  (ALG-029)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'kruskal',
  name: "Kruskal's MST",
  category: 'graph',
  timeComplexity: {
    best: 'O(E log E)',
    average: 'O(E log E)',
    worst: 'O(E log E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Builds a minimum spanning tree by sorting all edges by weight and greedily adding edges that do not form a cycle, using Union-Find for cycle detection.',
  pseudocode: [
    "procedure Kruskal(G)",
    '  MST = empty set',
    '  sort edges by weight ascending',
    '  for each vertex v: make-set(v)',
    '  for each edge (u, v) in sorted order do',
    '    if find(u) != find(v) then',
    '      MST = MST + (u, v)',
    '      union(u, v)',
    '    else skip (would form cycle)',
    '  return MST',
  ],
};

// ---- Union-Find (Disjoint Set Union) ----

class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor(elements: string[]) {
    this.parent = new Map();
    this.rank = new Map();
    for (const e of elements) {
      this.parent.set(e, e);
      this.rank.set(e, 0);
    }
  }

  find(x: string): string {
    let root = x;
    while (this.parent.get(root) !== root) {
      root = this.parent.get(root)!;
    }
    // Path compression
    let curr = x;
    while (curr !== root) {
      const next = this.parent.get(curr)!;
      this.parent.set(curr, root);
      curr = next;
    }
    return root;
  }

  union(a: string, b: string): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;

    const rankA = this.rank.get(ra) ?? 0;
    const rankB = this.rank.get(rb) ?? 0;

    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
    return true;
  }
}

export function kruskal(graph: Graph, _startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Sort edges by weight
  const sortedEdges = [...graph.edges].sort((a, b) => a.weight - b.weight);
  reads += graph.edges.length;

  steps.push({
    id: stepId++,
    description: `Sort ${graph.edges.length} edges by weight: [${sortedEdges.map((e) => `${e.source}-${e.target}(${e.weight})`).join(', ')}]`,
    pseudocodeLine: 2,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Initialize Union-Find
  const nodeIds = graph.nodes.map((n) => n.id);
  const uf = new UnionFind(nodeIds);

  steps.push({
    id: stepId++,
    description: `Initialize Union-Find for ${nodeIds.length} nodes`,
    pseudocodeLine: 3,
    mutations: graph.nodes.map((n) => ({
      targetId: `node-${n.id}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'default',
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  let mstWeight = 0;
  let edgesAccepted = 0;

  for (const edge of sortedEdges) {
    comparisons++;
    reads += 2;

    const { source: u, target: v, weight } = edge;

    // Examining edge step
    steps.push({
      id: stepId++,
      description: `Examine edge ${u} - ${v} (weight = ${weight})`,
      pseudocodeLine: 4,
      mutations: [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'default',
          to: 'current',
          easing: 'ease-out',
        },
        {
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    const rootU = uf.find(u);
    const rootV = uf.find(v);

    if (rootU !== rootV) {
      // Accept edge
      uf.union(u, v);
      mstWeight += weight;
      edgesAccepted++;
      writes += 2;

      steps.push({
        id: stepId++,
        description: `Accept edge ${u} - ${v} (weight = ${weight}). Kruskal picks the cheapest edge that doesn't create a cycle — the greedy choice is safe because adding it can only help the MST. MST weight = ${mstWeight}, edges = ${edgesAccepted}`,
        pseudocodeLine: 6,
        mutations: [
          {
            targetId: `edge-${u}-${v}`,
            property: 'highlight',
            from: 'visiting',
            to: 'in-path',
            easing: 'spring',
          },
          {
            targetId: `node-${u}`,
            property: 'highlight',
            from: 'current',
            to: 'in-path',
            easing: 'ease-out',
          },
          {
            targetId: `node-${v}`,
            property: 'highlight',
            from: 'current',
            to: 'in-path',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 500,
      });
    } else {
      // Reject edge (would form cycle)
      steps.push({
        id: stepId++,
        description: `Reject edge ${u} - ${v} (weight = ${weight}). Would form a cycle (same component)`,
        pseudocodeLine: 8,
        mutations: [
          {
            targetId: `edge-${u}-${v}`,
            property: 'highlight',
            from: 'visiting',
            to: 'visited',
            easing: 'ease-out',
          },
          {
            targetId: `node-${u}`,
            property: 'highlight',
            from: 'current',
            to: 'default',
            easing: 'ease-out',
          },
          {
            targetId: `node-${v}`,
            property: 'highlight',
            from: 'current',
            to: 'default',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
    }

    // Early termination: MST has V-1 edges
    if (edgesAccepted === nodeIds.length - 1) {
      steps.push({
        id: stepId++,
        description: `MST complete! ${edgesAccepted} edges, total weight = ${mstWeight}`,
        pseudocodeLine: 9,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 500,
      });
      break;
    }
  }

  // Final state: MST weight repeated for each node (placeholder)
  const finalState = graph.nodes.map(() => mstWeight);

  return { config: CONFIG, steps, finalState };
}
