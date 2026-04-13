// -----------------------------------------------------------------
// Architex -- Articulation Points (Cut Vertices) via DFS  (ALG-176)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'articulation-points',
  name: 'Articulation Points',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds all articulation points (cut vertices) in an undirected graph. A vertex is an articulation point if removing it disconnects the graph.',
  pseudocode: [
    'procedure FindArticulationPoints(G)',
    '  timer = 0',
    '  for each vertex v in G do',
    '    if v not visited then DFS(v, null)',
    'procedure DFS(u, parent)',
    '  disc[u] = low[u] = timer++',
    '  childCount = 0',
    '  for each neighbor v of u do',
    '    if v not visited then',
    '      childCount++; DFS(v, u)',
    '      low[u] = min(low[u], low[v])',
    '      if parent == null and childCount > 1 then',
    '        u is articulation point (root)',
    '      if parent != null and low[v] >= disc[u] then',
    '        u is articulation point',
    '    else if v != parent then',
    '      low[u] = min(low[u], disc[v])',
  ],
};

export function articulationPoints(graph: Graph): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build undirected adjacency list
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
    adj.get(edge.target)?.push(edge.source);
  }

  // DFS state
  const disc = new Map<string, number>();
  const low = new Map<string, number>();
  let timer = 0;
  const apSet = new Set<string>();

  steps.push({
    id: stepId++,
    description: 'Initialize articulation points search: DFS on undirected graph',
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  function dfsVisit(u: string, parent: string | null): void {
    const uDisc = timer;
    disc.set(u, uDisc);
    low.set(u, uDisc);
    timer++;
    writes += 2;

    steps.push({
      id: stepId++,
      description: `Visit ${u}: disc=${uDisc}, low=${uDisc}`,
      pseudocodeLine: 5,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
        {
          targetId: `node-${u}`,
          property: 'label',
          from: '',
          to: `d=${uDisc} l=${uDisc}`,
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    let childCount = 0;
    const neighbors = adj.get(u) ?? [];

    for (const v of neighbors) {
      comparisons++;
      reads++;

      const edgeId = getEdgeId(u, v, graph);
      const edgeMutations: VisualMutation[] = [
        {
          targetId: edgeId,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (!disc.has(v)) {
        childCount++;

        steps.push({
          id: stepId++,
          description: `Edge ${u} -- ${v}: ${v} not visited. Recurse (child #${childCount})`,
          pseudocodeLine: 9,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        dfsVisit(v, u);

        // Update low value
        const uLow = low.get(u)!;
        const vLow = low.get(v)!;
        const newLow = Math.min(uLow, vLow);
        low.set(u, newLow);
        writes++;

        if (newLow !== uLow) {
          steps.push({
            id: stepId++,
            description: `Back to ${u}: low[${u}] = min(${uLow}, low[${v}]=${vLow}) = ${newLow}`,
            pseudocodeLine: 10,
            mutations: [
              {
                targetId: `node-${u}`,
                property: 'label',
                from: `d=${disc.get(u)} l=${uLow}`,
                to: `d=${disc.get(u)} l=${newLow}`,
                easing: 'ease-out',
              },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        }

        // Check articulation point conditions
        const vLowVal = low.get(v)!;
        const uDiscVal = disc.get(u)!;

        // Case 1: root with 2+ children
        if (parent === null && childCount > 1 && !apSet.has(u)) {
          apSet.add(u);
          steps.push({
            id: stepId++,
            description: `${u} is an ARTICULATION POINT (root with ${childCount} DFS children)`,
            pseudocodeLine: 12,
            mutations: [
              {
                targetId: `node-${u}`,
                property: 'highlight',
                from: 'visiting',
                to: 'in-path',
                easing: 'ease-out',
              },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 600,
          });
        }

        // Case 2: non-root where low[v] >= disc[u]
        if (parent !== null && vLowVal >= uDiscVal && !apSet.has(u)) {
          apSet.add(u);
          steps.push({
            id: stepId++,
            description: `${u} is an ARTICULATION POINT (low[${v}]=${vLowVal} >= disc[${u}]=${uDiscVal})`,
            pseudocodeLine: 14,
            mutations: [
              {
                targetId: `node-${u}`,
                property: 'highlight',
                from: 'visiting',
                to: 'in-path',
                easing: 'ease-out',
              },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 600,
          });
        }
      } else if (v !== parent) {
        // Back edge -- update low value
        const uLow = low.get(u)!;
        const vDisc = disc.get(v)!;
        const newLow = Math.min(uLow, vDisc);
        low.set(u, newLow);
        writes++;

        steps.push({
          id: stepId++,
          description: `Edge ${u} -- ${v}: back edge. low[${u}] = min(${uLow}, disc[${v}]=${vDisc}) = ${newLow}`,
          pseudocodeLine: 16,
          mutations: [
            ...edgeMutations,
            {
              targetId: `node-${u}`,
              property: 'label',
              from: `d=${disc.get(u)} l=${uLow}`,
              to: `d=${disc.get(u)} l=${newLow}`,
              easing: 'ease-out',
            },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      } else {
        // Edge to parent -- skip
        steps.push({
          id: stepId++,
          description: `Edge ${u} -- ${v}: parent edge. Skip`,
          pseudocodeLine: 8,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 200,
        });
      }
    }

    // Mark visited if not already an articulation point
    if (!apSet.has(u)) {
      steps.push({
        id: stepId++,
        description: `Finished ${u}: not an articulation point`,
        pseudocodeLine: 5,
        mutations: [
          {
            targetId: `node-${u}`,
            property: 'highlight',
            from: 'visiting',
            to: 'visited',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
    }
  }

  // Run DFS on all unvisited nodes (handles disconnected graphs)
  for (const node of graph.nodes) {
    if (!disc.has(node.id)) {
      dfsVisit(node.id, null);
    }
  }

  // Summary step
  const apList = Array.from(apSet);
  steps.push({
    id: stepId++,
    description: `Complete: found ${apList.length} articulation point${apList.length !== 1 ? 's' : ''}: {${apList.join(', ')}}`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // finalState: 1 for articulation points, 0 otherwise
  const finalState = graph.nodes.map((n) => (apSet.has(n.id) ? 1 : 0));

  return { config: CONFIG, steps, finalState };
}

/** Find the canonical edge ID for an undirected edge between u and v. */
function getEdgeId(u: string, v: string, graph: Graph): string {
  // Check which direction the edge is stored in
  for (const edge of graph.edges) {
    if (
      (edge.source === u && edge.target === v) ||
      (edge.source === v && edge.target === u)
    ) {
      return `edge-${edge.source}-${edge.target}`;
    }
  }
  return `edge-${u}-${v}`;
}
