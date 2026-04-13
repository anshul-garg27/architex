// -----------------------------------------------------------------
// Architex -- Floyd-Warshall All-Pairs Shortest Path  (ALG-031)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'floyd-warshall',
  name: 'Floyd-Warshall',
  category: 'graph',
  timeComplexity: {
    best: 'O(V^3)',
    average: 'O(V^3)',
    worst: 'O(V^3)',
  },
  spaceComplexity: 'O(V^2)',
  description:
    'Computes shortest paths between all pairs of vertices using dynamic programming. At each stage k, considers whether a path through vertex k improves the current best distance between every pair (i, j).',
  pseudocode: [
    'procedure FloydWarshall(G)',
    '  let dist[][] = INF for all (i,j)',
    '  for each edge (u,v,w): dist[u][v] = w',
    '  for each vertex v: dist[v][v] = 0',
    '  for k = 1 to |V| do',
    '    for i = 1 to |V| do',
    '      for j = 1 to |V| do',
    '        if dist[i][k] + dist[k][j] < dist[i][j] then',
    '          dist[i][j] = dist[i][k] + dist[k][j]',
    '  return dist',
  ],
};

/** Format a distance value for display. */
function fmtDist(d: number): string {
  return d === Infinity ? 'INF' : String(d);
}

export function floydWarshall(graph: Graph, _startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  const nodeIds = graph.nodes.map((n) => n.id);
  const n = nodeIds.length;
  const idx = new Map<string, number>();
  nodeIds.forEach((id, i) => idx.set(id, i));

  // Initialize distance matrix
  const dist: number[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => Infinity),
  );

  // Self-loops = 0
  for (let i = 0; i < n; i++) {
    dist[i][i] = 0;
  }

  // Fill in direct edge weights
  for (const edge of graph.edges) {
    const si = idx.get(edge.source);
    const ti = idx.get(edge.target);
    if (si !== undefined && ti !== undefined) {
      dist[si][ti] = Math.min(dist[si][ti], edge.weight);
      if (!edge.directed) {
        dist[ti][si] = Math.min(dist[ti][si], edge.weight);
      }
    }
  }

  // Helper: build a compact matrix string for descriptions
  function matrixSummary(): string {
    const rows = nodeIds.map(
      (id, i) => `  ${id}: [${dist[i].map(fmtDist).join(', ')}]`,
    );
    return rows.join(' | ');
  }

  steps.push({
    id: stepId++,
    description: `Initialize ${n}x${n} distance matrix from edges. Nodes: [${nodeIds.join(', ')}]`,
    pseudocodeLine: 1,
    mutations: graph.nodes.map((nd) => ({
      targetId: `node-${nd.id}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'default',
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Main DP loop
  for (let k = 0; k < n; k++) {
    const kId = nodeIds[k];

    // Announce intermediate vertex k
    steps.push({
      id: stepId++,
      description: `Intermediate vertex k = ${kId} (${k + 1}/${n})`,
      pseudocodeLine: 4,
      mutations: [
        {
          targetId: `node-${kId}`,
          property: 'highlight',
          from: 'default',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    let relaxationsThisK = 0;

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;

        comparisons++;
        reads += 3; // dist[i][k], dist[k][j], dist[i][j]

        const through_k = dist[i][k] + dist[k][j];

        if (through_k < dist[i][j]) {
          const oldDist = dist[i][j];
          dist[i][j] = through_k;
          writes++;
          relaxationsThisK++;

          const iId = nodeIds[i];
          const jId = nodeIds[j];

          // Only record a step for actual relaxation (shorter path found)
          const mutations: VisualMutation[] = [
            {
              targetId: `node-${iId}`,
              property: 'highlight',
              from: 'default',
              to: 'visiting',
              easing: 'ease-out',
            },
            {
              targetId: `node-${jId}`,
              property: 'highlight',
              from: 'default',
              to: 'visiting',
              easing: 'ease-out',
            },
            {
              targetId: `node-${kId}`,
              property: 'highlight',
              from: 'current',
              to: 'current',
              easing: 'ease-out',
            },
          ];

          // Try to highlight edges involved in the path through k
          // i -> k edge
          const ikEdge = graph.edges.find(
            (e) =>
              (e.source === iId && e.target === kId) ||
              (!e.directed && e.source === kId && e.target === iId),
          );
          if (ikEdge) {
            mutations.push({
              targetId: `edge-${ikEdge.source}-${ikEdge.target}`,
              property: 'highlight',
              from: 'default',
              to: 'visiting',
              easing: 'ease-out',
            });
          }

          // k -> j edge
          const kjEdge = graph.edges.find(
            (e) =>
              (e.source === kId && e.target === jId) ||
              (!e.directed && e.source === jId && e.target === kId),
          );
          if (kjEdge) {
            mutations.push({
              targetId: `edge-${kjEdge.source}-${kjEdge.target}`,
              property: 'highlight',
              from: 'default',
              to: 'visiting',
              easing: 'ease-out',
            });
          }

          steps.push({
            id: stepId++,
            description: `dist[${iId}][${jId}]: ${fmtDist(oldDist)} -> ${through_k} via ${kId} (${fmtDist(dist[i][k])} + ${fmtDist(dist[k][j])}). Floyd-Warshall asks: is it cheaper to go through k? If yes, update. After trying all k, we have ALL shortest paths.`,
            pseudocodeLine: 7,
            mutations,
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 350,
          });
        }
      }
    }

    // Summary for this k iteration
    steps.push({
      id: stepId++,
      description: relaxationsThisK > 0
        ? `Done with k=${kId}: ${relaxationsThisK} relaxation(s)`
        : `Done with k=${kId}: no improvements found`,
      pseudocodeLine: 4,
      mutations: [
        {
          targetId: `node-${kId}`,
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

  // Final step: highlight all shortest-path edges that improved
  const finalMutations: VisualMutation[] = graph.nodes.map((nd) => ({
    targetId: `node-${nd.id}`,
    property: 'highlight' as const,
    from: 'visited',
    to: 'in-path',
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Floyd-Warshall complete. All-pairs shortest paths computed for ${n} vertices`,
    pseudocodeLine: 9,
    mutations: finalMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // finalState: flatten distance matrix row-major (cap at n*n values)
  const finalState: number[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      finalState.push(dist[i][j] === Infinity ? -1 : dist[i][j]);
    }
  }

  return { config: CONFIG, steps, finalState };
}
