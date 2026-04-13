// -----------------------------------------------------------------
// Architex -- Dijkstra's Shortest Path with Step Recording  (ALG-025)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'dijkstra',
  name: "Dijkstra's Shortest Path",
  category: 'graph',
  timeComplexity: {
    best: 'O((V + E) log V)',
    average: 'O(V² log V)',
    worst: 'O(V² log V)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds the shortest path from a source to all other vertices in a weighted graph with non-negative edge weights. This implementation uses a sorted array for simplicity. Production versions use a binary heap for O((V+E) log V).',
  comparisonGuide:
    "vs Bellman-Ford: Dijkstra is faster but can't handle negative edges. vs A*: A* is faster with a good heuristic. vs Floyd-Warshall: use FW for all-pairs.",
  productionNote:
    'Google Maps uses Contraction Hierarchies -- a precomputed shortcut graph that makes Dijkstra 1000x faster on road networks.',
  pseudocode: [
    'procedure Dijkstra(G, source)',
    '  for each vertex v in G do',
    '    dist[v] = INF; prev[v] = NIL',
    '  dist[source] = 0',
    '  PQ = all vertices with dist as key',
    '  while PQ is not empty do',
    '    u = extract-min(PQ)',
    '    for each neighbor v of u do',
    '      alt = dist[u] + weight(u, v)',
    '      if alt < dist[v] then',
    '        dist[v] = alt; prev[v] = u',
    '        decrease-key(PQ, v, alt)',
    '  return dist, prev',
  ],
};

/** Simple min-heap entry. */
interface PQEntry {
  id: string;
  dist: number;
}

/**
 * Performs Dijkstra's shortest path algorithm on a weighted graph, recording each step.
 * Greedily visits the closest unvisited node, updating neighbor distances via relaxation.
 *
 * @param graph - The weighted graph (non-negative edge weights required)
 * @param startNodeId - The ID of the source node
 * @returns AlgorithmResult containing the traversal steps and shortest distances
 *
 * @example
 * const result = dijkstra(weightedGraph, 'A');
 * // result.steps shows greedy relaxation of shortest paths
 */
export function dijkstra(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // WHY adjacency list over matrix: for sparse graphs (E << V^2), an adjacency
  // list uses O(V+E) space instead of O(V^2). Iterating over a node's neighbors
  // is O(degree) instead of O(V), which matters inside Dijkstra's inner loop.
  const adj = new Map<string, { neighbor: string; weight: number }[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push({ neighbor: edge.target, weight: edge.weight });
    if (!edge.directed) {
      adj.get(edge.target)?.push({ neighbor: edge.source, weight: edge.weight });
    }
  }

  // WHY initialize all distances to Infinity: we haven't discovered any paths yet.
  // The source gets distance 0 (zero-length path to itself). As the algorithm runs,
  // distances can only decrease — this monotonicity is key to Dijkstra's correctness.
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
    prev.set(node.id, null);
  }
  dist.set(startNodeId, 0);

  steps.push({
    id: stepId++,
    description: `Initialize all distances to INF. Set dist[${startNodeId}] = 0`,
    pseudocodeLine: 1,
    mutations: [
      {
        targetId: `node-${startNodeId}`,
        property: 'label',
        from: '',
        to: 'd=0',
        easing: 'ease-out',
      },
      ...graph.nodes
        .filter((n) => n.id !== startNodeId)
        .map((n) => ({
          targetId: `node-${n.id}`,
          property: 'label' as const,
          from: '',
          to: 'd=INF',
          easing: 'ease-out' as const,
        })),
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // WHY a priority queue: Dijkstra's greedy insight requires always processing
  // the closest unvisited node next. A min-heap makes extract-min O(log V) instead
  // of O(V) with a linear scan. This implementation uses a sorted array for clarity.
  const pq: PQEntry[] = graph.nodes.map((n) => ({
    id: n.id,
    dist: dist.get(n.id) ?? Infinity,
  }));

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.dist - b.dist);
    const uEntry = pq.shift()!;
    const u = uEntry.id;
    const uDist = dist.get(u) ?? Infinity;

    if (uDist === Infinity) {
      // Remaining nodes are unreachable
      steps.push({
        id: stepId++,
        description: `Node ${u} has distance INF -- unreachable. Stop`,
        pseudocodeLine: 6,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
      break;
    }

    reads++;
    visited.add(u);

    // Extract-min step
    steps.push({
      id: stepId++,
      description: `Extract min: node ${u} (dist = ${uDist}). Why this node? It has the smallest tentative distance among unvisited nodes. Dijkstra's greedy insight: the shortest known path to the closest unvisited node IS the true shortest path — no shorter route can exist.`,
      pseudocodeLine: 6,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'in-queue',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    const neighbors = adj.get(u) ?? [];
    for (const { neighbor: v, weight } of neighbors) {
      if (visited.has(v)) continue;

      comparisons++;
      reads += 2;
      const alt = uDist + weight;
      const currentDist = dist.get(v) ?? Infinity;

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      // WHY relaxation works: if going through u gives a shorter path to v than
      // what we currently know, we update. The name "relax" comes from the analogy
      // of a rubber band snapping to a shorter length. With non-negative weights,
      // once a node is extracted from the PQ, its distance is final — no future
      // relaxation can improve it (the greedy guarantee).
      if (alt < currentDist) {
        dist.set(v, alt);
        prev.set(v, u);
        writes += 2;

        // Update PQ
        const pqEntry = pq.find((e) => e.id === v);
        if (pqEntry) pqEntry.dist = alt;

        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'discovered',
          easing: 'ease-out',
        });
        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'label',
          from: `d=${currentDist === Infinity ? 'INF' : currentDist}`,
          to: `d=${alt}`,
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Relax edge ${u} -> ${v}: ${uDist} + ${weight} = ${alt} < ${currentDist === Infinity ? 'INF' : currentDist}. Found a shorter path! Update dist[${v}] = ${alt}. "Relaxation" means we discovered a cheaper route to ${v} by going through ${u}.`,
          pseudocodeLine: 9,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: ${uDist} + ${weight} = ${alt} >= ${currentDist}. No improvement`,
          pseudocodeLine: 9,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // WHY we mark visited AFTER processing neighbors: once u is extracted with the
    // minimum distance, its shortest path is locked in. Marking it visited prevents
    // future edges from trying to update it — which would be pointless since no
    // shorter path to u can exist (greedy property with non-negative weights).
    steps.push({
      id: stepId++,
      description: `Finished processing node ${u}`,
      pseudocodeLine: 7,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'current',
          to: 'visited',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Highlight shortest path tree edges
  const pathMutations: VisualMutation[] = [];
  for (const node of graph.nodes) {
    const p = prev.get(node.id);
    if (p !== null && p !== undefined) {
      pathMutations.push({
        targetId: `edge-${p}-${node.id}`,
        property: 'highlight',
        from: 'default',
        to: 'in-path',
        easing: 'ease-out',
      });
      pathMutations.push({
        targetId: `node-${node.id}`,
        property: 'highlight',
        from: 'visited',
        to: 'in-path',
        easing: 'ease-out',
      });
    }
  }
  pathMutations.push({
    targetId: `node-${startNodeId}`,
    property: 'highlight',
    from: 'visited',
    to: 'in-path',
    easing: 'ease-out',
  });

  if (pathMutations.length > 0) {
    steps.push({
      id: stepId++,
      description: 'Highlight shortest path tree',
      pseudocodeLine: 12,
      mutations: pathMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 600,
    });
  }

  const finalState = graph.nodes.map((n) => {
    const d = dist.get(n.id);
    return d === Infinity ? -1 : (d ?? -1);
  });

  return { config: CONFIG, steps, finalState };
}
