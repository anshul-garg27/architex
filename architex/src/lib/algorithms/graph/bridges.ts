// -----------------------------------------------------------------
// Architex -- Bridge Finding via DFS  (ALG-177)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'bridges',
  name: 'Bridge Finding',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds all bridges (cut edges) in an undirected graph. An edge is a bridge if removing it disconnects the graph.',
  pseudocode: [
    'procedure FindBridges(G)',
    '  timer = 0',
    '  for each vertex v in G do',
    '    if v not visited then DFS(v, null)',
    'procedure DFS(u, parent)',
    '  disc[u] = low[u] = timer++',
    '  for each neighbor v of u do',
    '    if v not visited then',
    '      DFS(v, u)',
    '      low[u] = min(low[u], low[v])',
    '      if low[v] > disc[u] then',
    '        (u, v) is a bridge',
    '    else if v != parent then',
    '      low[u] = min(low[u], disc[v])',
  ],
};

export function bridges(graph: Graph): AlgorithmResult {
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
  const bridgeEdges: Array<[string, string]> = [];

  steps.push({
    id: stepId++,
    description: 'Initialize bridge finding: DFS on undirected graph',
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
        steps.push({
          id: stepId++,
          description: `Edge ${u} -- ${v}: ${v} not visited. Recurse`,
          pseudocodeLine: 8,
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
            pseudocodeLine: 9,
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

        // Check bridge condition: low[v] > disc[u]
        const vLowVal = low.get(v)!;
        const uDiscVal = disc.get(u)!;

        if (vLowVal > uDiscVal) {
          bridgeEdges.push([u, v]);
          steps.push({
            id: stepId++,
            description: `BRIDGE found: (${u}, ${v}) -- low[${v}]=${vLowVal} > disc[${u}]=${uDiscVal}`,
            pseudocodeLine: 11,
            mutations: [
              {
                targetId: edgeId,
                property: 'highlight',
                from: 'visiting',
                to: 'in-path',
                easing: 'ease-out',
              },
            ],
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 600,
          });
        } else {
          // Not a bridge -- mark as visited
          steps.push({
            id: stepId++,
            description: `Edge (${u}, ${v}) is NOT a bridge -- low[${v}]=${vLowVal} <= disc[${u}]=${uDiscVal}`,
            pseudocodeLine: 10,
            mutations: [
              {
                targetId: edgeId,
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
          pseudocodeLine: 13,
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
          pseudocodeLine: 7,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 200,
        });
      }
    }

    // Mark node as fully processed
    steps.push({
      id: stepId++,
      description: `Finished processing ${u}`,
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

  // Run DFS on all unvisited nodes (handles disconnected graphs)
  for (const node of graph.nodes) {
    if (!disc.has(node.id)) {
      dfsVisit(node.id, null);
    }
  }

  // Summary step
  const bridgeLabels = bridgeEdges.map(([u, v]) => `(${u},${v})`).join(', ');
  steps.push({
    id: stepId++,
    description: `Complete: found ${bridgeEdges.length} bridge${bridgeEdges.length !== 1 ? 's' : ''}: ${bridgeLabels || 'none'}`,
    pseudocodeLine: 0,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // finalState: index into bridgeEdges for edges that are bridges, -1 otherwise
  // For nodes: 0 for all (bridges are about edges, not nodes)
  const finalState = graph.nodes.map(() => 0);

  return { config: CONFIG, steps, finalState };
}

/** Find the canonical edge ID for an undirected edge between u and v. */
function getEdgeId(u: string, v: string, graph: Graph): string {
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
