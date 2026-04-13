// -----------------------------------------------------------------
// Architex -- Bipartite Check via BFS 2-Coloring  (ALG-035)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'bipartite',
  name: 'Bipartite Check',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Determines whether a graph is bipartite (2-colorable) using BFS. Assigns each node one of two colors and checks for conflicts along edges.',
  pseudocode: [
    'procedure IsBipartite(G, source)',
    '  for each vertex u in G do',
    '    color[u] = UNCOLORED',
    '  color[source] = RED; enqueue(Q, source)',
    '  while Q is not empty do',
    '    u = dequeue(Q)',
    '    for each neighbor v of u do',
    '      if color[v] == UNCOLORED then',
    '        color[v] = opposite(color[u])',
    '        enqueue(Q, v)',
    '      else if color[v] == color[u] then',
    '        return false  // conflict found',
    '  return true',
  ],
};

export function bipartiteCheck(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list (undirected)
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
    if (!edge.directed) {
      adj.get(edge.target)?.push(edge.source);
    }
  }

  // Color map: 0 = uncolored, 1 = RED, 2 = BLUE
  const colorMap = new Map<string, number>();
  for (const node of graph.nodes) {
    colorMap.set(node.id, 0);
  }

  let isBipartite = true;

  // Initialization step
  steps.push({
    id: stepId++,
    description: 'Initialize all nodes as uncolored',
    pseudocodeLine: 1,
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

  // Color source node RED
  colorMap.set(startNodeId, 1);
  writes++;

  const queue: string[] = [startNodeId];

  steps.push({
    id: stepId++,
    description: `Color source node ${startNodeId} as RED. Enqueue`,
    pseudocodeLine: 3,
    mutations: [
      {
        targetId: `node-${startNodeId}`,
        property: 'highlight',
        from: 'default',
        to: 'in-queue',
        easing: 'ease-out',
      },
      {
        targetId: `node-${startNodeId}`,
        property: 'label',
        from: '',
        to: 'RED',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  while (queue.length > 0 && isBipartite) {
    const u = queue.shift()!;
    reads++;
    const uColor = colorMap.get(u)!;
    const uColorName = uColor === 1 ? 'RED' : 'BLUE';

    // Dequeue step
    steps.push({
      id: stepId++,
      description: `Dequeue node ${u} (color = ${uColorName})`,
      pseudocodeLine: 5,
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
    for (const v of neighbors) {
      comparisons++;
      reads++;
      const vColor = colorMap.get(v)!;
      const oppositeColor = uColor === 1 ? 2 : 1;
      const oppositeColorName = oppositeColor === 1 ? 'RED' : 'BLUE';

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (vColor === 0) {
        // Uncolored -- assign opposite color
        colorMap.set(v, oppositeColor);
        queue.push(v);
        writes++;

        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'in-queue',
          easing: 'ease-out',
        });
        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'label',
          from: '',
          to: oppositeColorName,
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Color node ${v} as ${oppositeColorName} (opposite of ${u}). Enqueue`,
          pseudocodeLine: 8,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else if (vColor === uColor) {
        // Conflict -- not bipartite
        isBipartite = false;

        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'in-queue',
          to: 'current',
          easing: 'ease-out',
        });
        edgeMutations.push({
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'visiting',
          to: 'in-path',
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `CONFLICT: node ${v} has same color (${uColorName}) as ${u}. Graph is NOT bipartite!`,
          pseudocodeLine: 11,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 600,
        });
        break;
      } else {
        // Already colored with opposite -- OK
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: already colored ${vColor === 1 ? 'RED' : 'BLUE'} (no conflict)`,
          pseudocodeLine: 7,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    if (isBipartite) {
      // Mark node as finished
      steps.push({
        id: stepId++,
        description: `Finish node ${u}. Mark as visited`,
        pseudocodeLine: 5,
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
  }

  // Summary step
  steps.push({
    id: stepId++,
    description: isBipartite
      ? 'Graph IS bipartite. 2-coloring successful'
      : 'Graph is NOT bipartite. Conflict detected',
    pseudocodeLine: isBipartite ? 12 : 11,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // finalState: 1 for bipartite, 0 for not
  const finalState = [isBipartite ? 1 : 0];

  return { config: CONFIG, steps, finalState };
}
