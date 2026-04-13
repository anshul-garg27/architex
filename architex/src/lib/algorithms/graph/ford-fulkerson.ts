// -----------------------------------------------------------------
// Architex -- Ford-Fulkerson Max Flow (Edmonds-Karp variant)  (ALG-026)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'ford-fulkerson',
  name: 'Ford-Fulkerson (Edmonds-Karp)',
  category: 'graph',
  timeComplexity: {
    best: 'O(V * E^2)',
    average: 'O(V * E^2)',
    worst: 'O(V * E^2)',
  },
  spaceComplexity: 'O(V^2)',
  description:
    'Computes the maximum flow from a source to a sink in a flow network using BFS to find augmenting paths (Edmonds-Karp variant).',
  pseudocode: [
    'procedure FordFulkerson(G, source, sink)',
    '  initialize residual graph from capacity edges',
    '  maxFlow = 0',
    '  while BFS finds augmenting path from source to sink do',
    '    bottleneck = min residual capacity along path',
    '    for each edge (u, v) on path do',
    '      residual[u][v] -= bottleneck',
    '      residual[v][u] += bottleneck',
    '    maxFlow += bottleneck',
    '  return maxFlow',
  ],
};

/**
 * BFS to find an augmenting path in the residual graph.
 * Returns the parent map if a path exists, or null otherwise.
 */
function bfsFindPath(
  residual: Map<string, Map<string, number>>,
  source: string,
  sink: string,
  nodeIds: string[],
): Map<string, string | null> | null {
  const visited = new Set<string>();
  const parent = new Map<string, string | null>();
  const queue: string[] = [];

  visited.add(source);
  parent.set(source, null);
  queue.push(source);

  while (queue.length > 0) {
    const u = queue.shift()!;
    const neighbors = residual.get(u);
    if (!neighbors) continue;

    for (const nodeId of nodeIds) {
      const cap = neighbors.get(nodeId) ?? 0;
      if (!visited.has(nodeId) && cap > 0) {
        visited.add(nodeId);
        parent.set(nodeId, u);
        if (nodeId === sink) return parent;
        queue.push(nodeId);
      }
    }
  }

  return null;
}

/** Reconstruct the augmenting path from parent map. */
function reconstructPath(
  parent: Map<string, string | null>,
  sink: string,
): string[] {
  const path: string[] = [];
  let current: string | null = sink;
  while (current !== null) {
    path.unshift(current);
    current = parent.get(current) ?? null;
  }
  return path;
}

export function fordFulkerson(
  graph: Graph,
  startNodeId: string,
): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // The startNodeId is the source.  We detect the sink as the node
  // whose id appears in SAMPLE_GRAPH_FOR_ALGORITHM for this algo,
  // but generically we pick the last node if no explicit sink.
  // Convention: edge weights represent capacities in a flow network.
  // We assume all edges are directed.
  const source = startNodeId;
  // Find sink: pick node with id 'T' if it exists, otherwise last node
  const sink =
    graph.nodes.find((n) => n.id === 'T')?.id ??
    graph.nodes[graph.nodes.length - 1].id;

  const nodeIds = graph.nodes.map((n) => n.id);

  // Build residual graph (adjacency map of maps)
  const residual = new Map<string, Map<string, number>>();
  for (const node of graph.nodes) {
    residual.set(node.id, new Map<string, number>());
  }
  for (const edge of graph.edges) {
    const fwd = residual.get(edge.source)!;
    fwd.set(edge.target, (fwd.get(edge.target) ?? 0) + edge.weight);
    // Ensure backward edge exists (initialized to 0 if not present)
    const bwd = residual.get(edge.target)!;
    if (!bwd.has(edge.source)) {
      bwd.set(edge.source, 0);
    }
  }

  // Record initial capacities for display
  const capacity = new Map<string, Map<string, number>>();
  residual.forEach((neighbors, u) => {
    capacity.set(u, new Map(neighbors));
  });

  // Initialization step
  steps.push({
    id: stepId++,
    description: `Initialize residual graph. Source = ${source}, Sink = ${sink}`,
    pseudocodeLine: 1,
    mutations: [
      {
        targetId: `node-${source}`,
        property: 'highlight',
        from: 'default',
        to: 'in-path',
        easing: 'ease-out',
      },
      {
        targetId: `node-${sink}`,
        property: 'highlight',
        from: 'default',
        to: 'in-path',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  let maxFlow = 0;
  let iteration = 0;

  // Main loop: find augmenting paths via BFS
  while (true) {
    iteration++;

    // BFS search step
    const bfsMutations: VisualMutation[] = graph.nodes
      .filter((n) => n.id !== source && n.id !== sink)
      .map((n) => ({
        targetId: `node-${n.id}`,
        property: 'highlight' as const,
        from: 'default',
        to: 'in-queue' as const,
        easing: 'ease-out' as const,
      }));

    steps.push({
      id: stepId++,
      description: `Iteration ${iteration}: BFS searching for augmenting path from ${source} to ${sink}`,
      pseudocodeLine: 3,
      mutations: bfsMutations,
      complexity: { comparisons: ++comparisons, swaps: 0, reads: ++reads, writes },
      duration: 400,
    });

    const parent = bfsFindPath(residual, source, sink, nodeIds);

    if (parent === null) {
      // No augmenting path -- done
      steps.push({
        id: stepId++,
        description: `No augmenting path found. Max flow = ${maxFlow}`,
        pseudocodeLine: 9,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 500,
      });
      break;
    }

    // Reconstruct path
    const path = reconstructPath(parent, sink);
    reads += path.length;

    // Compute bottleneck
    let bottleneck = Infinity;
    for (let i = 0; i < path.length - 1; i++) {
      const cap = residual.get(path[i])!.get(path[i + 1]) ?? 0;
      bottleneck = Math.min(bottleneck, cap);
      comparisons++;
    }

    // Augmenting path found step
    const pathMutations: VisualMutation[] = [];
    for (let i = 0; i < path.length; i++) {
      pathMutations.push({
        targetId: `node-${path[i]}`,
        property: 'highlight',
        from: 'in-queue',
        to: 'current',
        easing: 'ease-out',
      });
      if (i < path.length - 1) {
        pathMutations.push({
          targetId: `edge-${path[i]}-${path[i + 1]}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        });
      }
    }

    steps.push({
      id: stepId++,
      description: `Augmenting path: ${path.join(' -> ')} (bottleneck = ${bottleneck})`,
      pseudocodeLine: 4,
      mutations: pathMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 500,
    });

    // Update residual graph
    const updateMutations: VisualMutation[] = [];
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const fwdMap = residual.get(u)!;
      const bwdMap = residual.get(v)!;

      const oldFwd = fwdMap.get(v) ?? 0;
      const oldBwd = bwdMap.get(u) ?? 0;

      fwdMap.set(v, oldFwd - bottleneck);
      bwdMap.set(u, oldBwd + bottleneck);
      writes += 2;

      updateMutations.push({
        targetId: `edge-${u}-${v}`,
        property: 'label',
        from: `${oldFwd}`,
        to: `${oldFwd - bottleneck}`,
        easing: 'ease-out',
      });
    }

    steps.push({
      id: stepId++,
      description: `Update residual: forward edges -${bottleneck}, backward edges +${bottleneck}`,
      pseudocodeLine: 6,
      mutations: updateMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    maxFlow += bottleneck;

    // Flow update step
    steps.push({
      id: stepId++,
      description: `Flow increased by ${bottleneck}. Total max flow = ${maxFlow}`,
      pseudocodeLine: 8,
      mutations: [
        ...path.map((nodeId) => ({
          targetId: `node-${nodeId}`,
          property: 'highlight' as const,
          from: 'current' as const,
          to: 'visited' as const,
          easing: 'ease-out' as const,
        })),
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });
  }

  // Final highlight: show all edges that carry flow
  const finalMutations: VisualMutation[] = [];
  for (const edge of graph.edges) {
    const originalCap = capacity.get(edge.source)?.get(edge.target) ?? 0;
    const residualCap = residual.get(edge.source)?.get(edge.target) ?? 0;
    const flow = originalCap - residualCap;
    if (flow > 0) {
      finalMutations.push({
        targetId: `edge-${edge.source}-${edge.target}`,
        property: 'highlight',
        from: 'default',
        to: 'in-path',
        easing: 'ease-out',
      });
      finalMutations.push({
        targetId: `edge-${edge.source}-${edge.target}`,
        property: 'label',
        from: '',
        to: `${flow}/${originalCap}`,
        easing: 'ease-out',
      });
    }
  }
  finalMutations.push({
    targetId: `node-${source}`,
    property: 'highlight',
    from: 'visited',
    to: 'in-path',
    easing: 'ease-out',
  });
  finalMutations.push({
    targetId: `node-${sink}`,
    property: 'highlight',
    from: 'visited',
    to: 'in-path',
    easing: 'ease-out',
  });

  steps.push({
    id: stepId++,
    description: `Done. Maximum flow from ${source} to ${sink} = ${maxFlow}`,
    pseudocodeLine: 9,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 600,
  });

  return { config: CONFIG, steps, finalState: [maxFlow] };
}
