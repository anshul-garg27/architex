// -----------------------------------------------------------------
// Architex -- Breadth-First Search with Step Recording  (ALG-023)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'bfs',
  name: 'Breadth-First Search',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Explores a graph level by level, visiting all neighbors of a node before moving to the next level. Useful for finding shortest paths in unweighted graphs.',
  comparisonGuide:
    'vs DFS: BFS finds shortest path in unweighted graphs; DFS uses less memory and is better for topological sort and cycle detection.',
  productionNote:
    'Web crawlers use priority-BFS with politeness delays, domain-level queues, and seen-URL Bloom Filters.',
  pseudocode: [
    'procedure BFS(G, source)',
    '  for each vertex u in G do',
    '    color[u] = WHITE; dist[u] = INF',
    '  color[source] = GRAY; dist[source] = 0',
    '  enqueue(Q, source)',
    '  while Q is not empty do',
    '    u = dequeue(Q)',
    '    for each neighbor v of u do',
    '      if color[v] == WHITE then',
    '        color[v] = GRAY; dist[v] = dist[u] + 1',
    '        enqueue(Q, v)',
    '    color[u] = BLACK',
    '  return dist',
  ],
};

/**
 * Performs Breadth-First Search on a graph, recording each step as an AnimationStep.
 * Explores level by level using a FIFO queue, finding shortest paths in unweighted graphs.
 *
 * @param graph - The graph to traverse (nodes and edges)
 * @param startNodeId - The ID of the node to start BFS from
 * @returns AlgorithmResult containing the traversal steps and final distances
 *
 * @example
 * const result = bfs(myGraph, 'A');
 * // result.steps shows level-by-level exploration
 */
export function bfs(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list
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

  // WHY three colors: WHITE = undiscovered, GRAY = discovered but not fully explored
  // (in the queue), BLACK = all neighbors examined. This prevents re-visiting nodes
  // and proves every node is processed exactly once, giving O(V+E) time.
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  const dist = new Map<string, number>();
  for (const node of graph.nodes) {
    color.set(node.id, 'white');
    dist.set(node.id, Infinity);
  }

  // Initialization step
  steps.push({
    id: stepId++,
    description: `Initialize all nodes as unvisited. Set source = ${startNodeId}`,
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

  // Start BFS
  color.set(startNodeId, 'gray');
  dist.set(startNodeId, 0);
  writes += 2;

  // WHY a FIFO queue and not a stack: the queue ensures nodes at distance d are
  // ALL processed before any node at distance d+1. This is why BFS guarantees
  // shortest paths in unweighted graphs — it explores level by level like ripples
  // from a stone dropped in water.
  const queue: string[] = [startNodeId];

  steps.push({
    id: stepId++,
    description: `Enqueue source node ${startNodeId} (distance = 0). BFS uses a FIFO queue — nodes are processed in the order they were discovered, ensuring we explore ring by ring (closest first).`,
    pseudocodeLine: 4,
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
        to: 'd=0',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  while (queue.length > 0) {
    // WHY shift() (dequeue from front): FIFO ordering is the entire mechanism
    // behind BFS. Switching to pop() (LIFO) would turn this into DFS.
    const u = queue.shift()!;
    reads++;

    // Dequeue step
    steps.push({
      id: stepId++,
      description: `Dequeue node ${u} (distance = ${dist.get(u)}). We take from the front of the queue — this is the FIFO guarantee that makes BFS explore level by level, nearest nodes first.`,
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
    for (const { neighbor: v } of neighbors) {
      comparisons++;
      reads++;

      // Explore edge
      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      // WHY we only enqueue WHITE nodes: a node that's already GRAY (in queue)
      // or BLACK (finished) was discovered via an equal-or-shorter path. Enqueueing
      // it again would waste work and could report incorrect distances.
      if (color.get(v) === 'white') {
        color.set(v, 'gray');
        const newDist = (dist.get(u) ?? 0) + 1;
        dist.set(v, newDist);
        queue.push(v);
        writes += 2;

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
          to: `d=${newDist}`,
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Discover node ${v} via ${u} (distance = ${newDist}). Enqueue ${v}. Because BFS processes nodes in order of discovery, ${v} won't be visited until all nodes at distance ${newDist - 1} are done — guaranteeing shortest path.`,
          pseudocodeLine: 9,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: node ${v} already visited/discovered`,
          pseudocodeLine: 8,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // WHY mark BLACK after processing all neighbors: BLACK means "fully explored."
    // This node's contribution to distance computation is complete and it will
    // never be revisited — ensuring O(V+E) total work.
    color.set(u, 'black');
    writes++;

    steps.push({
      id: stepId++,
      description: `Finish node ${u}. Mark as visited`,
      pseudocodeLine: 11,
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

  // Build final state as distances (using node order)
  const finalState = graph.nodes.map((n) => dist.get(n.id) ?? Infinity);

  return { config: CONFIG, steps, finalState };
}
