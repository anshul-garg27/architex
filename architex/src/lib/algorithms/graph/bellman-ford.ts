// -----------------------------------------------------------------
// Architex -- Bellman-Ford Shortest Path with Step Recording  (ALG-026)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'bellman-ford',
  name: 'Bellman-Ford Shortest Path',
  category: 'graph',
  timeComplexity: {
    best: 'O(V * E)',
    average: 'O(V * E)',
    worst: 'O(V * E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds shortest paths from a source vertex to all others, handling negative edge weights. Detects negative-weight cycles.',
  pseudocode: [
    'procedure BellmanFord(G, source)',
    '  for each vertex v in G do',
    '    dist[v] = INF; prev[v] = NIL',
    '  dist[source] = 0',
    '  for i = 1 to |V| - 1 do',
    '    for each edge (u, v, w) in G do',
    '      if dist[u] + w < dist[v] then',
    '        dist[v] = dist[u] + w; prev[v] = u',
    '  for each edge (u, v, w) in G do',
    '    if dist[u] + w < dist[v] then',
    '      report negative cycle',
    '  return dist, prev',
  ],
};

export function bellmanFord(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Initialize distances
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

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
          from: '' as string | number,
          to: 'd=INF' as string | number,
          easing: 'ease-out' as const,
        })),
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // Collect all directed edges for iteration
  const edgeList: { u: string; v: string; w: number }[] = [];
  for (const edge of graph.edges) {
    edgeList.push({ u: edge.source, v: edge.target, w: edge.weight });
    if (!edge.directed) {
      edgeList.push({ u: edge.target, v: edge.source, w: edge.weight });
    }
  }

  const V = graph.nodes.length;
  let anyRelaxation = false;

  // Relax all edges V-1 times
  for (let i = 1; i < V; i++) {
    anyRelaxation = false;

    steps.push({
      id: stepId++,
      description: `Pass ${i} of ${V - 1}: relax all edges`,
      pseudocodeLine: 4,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    for (const { u, v, w } of edgeList) {
      comparisons++;
      reads += 2;
      const distU = dist.get(u) ?? Infinity;
      const distV = dist.get(v) ?? Infinity;

      if (distU === Infinity) {
        // Source unreachable, skip
        continue;
      }

      const alt = distU + w;
      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (alt < distV) {
        // Relaxation
        dist.set(v, alt);
        prev.set(v, u);
        writes += 2;
        anyRelaxation = true;

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
          from: `d=${distV === Infinity ? 'INF' : distV}`,
          to: `d=${alt}`,
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Relax ${u} -> ${v}: ${distU} + ${w} = ${alt} < ${distV === Infinity ? 'INF' : distV}. Update dist[${v}] = ${alt}. Bellman-Ford relaxes ALL edges V-1 times — unlike Dijkstra, this handles negative weights because it doesn't assume settled nodes are final.`,
          pseudocodeLine: 6,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: ${distU} + ${w} = ${alt} >= ${distV === Infinity ? 'INF' : distV}. No improvement`,
          pseudocodeLine: 6,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 200,
        });
      }
    }

    // Early termination if no relaxation happened
    if (!anyRelaxation) {
      steps.push({
        id: stepId++,
        description: `No relaxation in pass ${i}. Converged early`,
        pseudocodeLine: 4,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
      break;
    }
  }

  // Negative cycle detection (Vth pass)
  let hasNegativeCycle = false;

  steps.push({
    id: stepId++,
    description: 'Check for negative-weight cycles (Vth pass)',
    pseudocodeLine: 8,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  for (const { u, v, w } of edgeList) {
    comparisons++;
    reads += 2;
    const distU = dist.get(u) ?? Infinity;
    const distV = dist.get(v) ?? Infinity;

    if (distU !== Infinity && distU + w < distV) {
      hasNegativeCycle = true;

      steps.push({
        id: stepId++,
        description: `Negative cycle detected! Edge ${u} -> ${v} can still be relaxed: ${distU} + ${w} < ${distV}`,
        pseudocodeLine: 10,
        mutations: [
          {
            targetId: `edge-${u}-${v}`,
            property: 'highlight',
            from: 'default',
            to: 'current',
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
        duration: 600,
      });
      break;
    }
  }

  if (!hasNegativeCycle) {
    steps.push({
      id: stepId++,
      description: 'No negative-weight cycles detected',
      pseudocodeLine: 8,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Highlight shortest path tree edges
  if (!hasNegativeCycle) {
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
        pseudocodeLine: 11,
        mutations: pathMutations,
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 600,
      });
    }
  }

  const finalState = graph.nodes.map((n) => {
    const d = dist.get(n.id);
    return d === Infinity ? -1 : (d ?? -1);
  });

  return { config: CONFIG, steps, finalState };
}
