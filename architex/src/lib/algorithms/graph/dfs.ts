// -----------------------------------------------------------------
// Architex -- Depth-First Search with Step Recording  (ALG-024)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'dfs',
  name: 'Depth-First Search',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Explores as far as possible along each branch before backtracking. Records discovery and finish times for each node.',
  pseudocode: [
    'procedure DFS(G)',
    '  for each vertex u in G do',
    '    color[u] = WHITE',
    '  time = 0',
    '  for each vertex u in G do',
    '    if color[u] == WHITE then',
    '      DFS-Visit(G, u)',
    'procedure DFS-Visit(G, u)',
    '  time++; discover[u] = time',
    '  color[u] = GRAY',
    '  for each neighbor v of u do',
    '    if color[v] == WHITE then',
    '      DFS-Visit(G, v)',
    '  color[u] = BLACK',
    '  time++; finish[u] = time',
  ],
};

/**
 * Performs Depth-First Search on a graph, recording each step as an AnimationStep.
 * Explores as far as possible along each branch before backtracking.
 *
 * @param graph - The graph to traverse (nodes and edges)
 * @param startNodeId - The ID of the node to start DFS from
 * @returns AlgorithmResult containing the traversal steps with discovery/finish times
 *
 * @example
 * const result = dfs(myGraph, 'A');
 * // result.steps shows depth-first exploration and backtracking
 */
export function dfs(graph: Graph, startNodeId: string): AlgorithmResult {
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

  // Initialize
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  const discover = new Map<string, number>();
  const finish = new Map<string, number>();
  let time = 0;

  for (const node of graph.nodes) {
    color.set(node.id, 'white');
  }

  // Initialization step
  steps.push({
    id: stepId++,
    description: 'Initialize all nodes as WHITE (unvisited). time = 0',
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

  const recursionStack: string[] = [];

  function dfsVisit(u: string): void {
    time++;
    discover.set(u, time);
    color.set(u, 'gray');
    recursionStack.push(u);
    writes += 2;

    // Discovery step
    steps.push({
      id: stepId++,
      description: `Discover node ${u} (time = ${time}). Stack: [${recursionStack.join(', ')}]`,
      pseudocodeLine: 8,
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
          to: `${time}/-`,
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

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (color.get(v) === 'white') {
        steps.push({
          id: stepId++,
          description: `Explore edge ${u} -> ${v}: node ${v} is WHITE. Recurse. DFS dives as deep as possible before backtracking — using the stack (or recursion) to remember where to return.`,
          pseudocodeLine: 11,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });

        dfsVisit(v);
      } else if (color.get(v) === 'gray') {
        edgeMutations.push({
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'visiting',
          to: 'current',
          easing: 'ease-out',
        });
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: node ${v} is GRAY (back edge / cycle)`,
          pseudocodeLine: 10,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: node ${v} is BLACK (already finished)`,
          pseudocodeLine: 10,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // Finish u
    time++;
    finish.set(u, time);
    color.set(u, 'black');
    recursionStack.pop();
    writes += 2;

    steps.push({
      id: stepId++,
      description: `Finish node ${u} (discover=${discover.get(u)}, finish=${time}). Stack: [${recursionStack.join(', ')}]`,
      pseudocodeLine: 13,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'visiting',
          to: 'visited',
          easing: 'ease-out',
        },
        {
          targetId: `node-${u}`,
          property: 'label',
          from: `${discover.get(u)}/-`,
          to: `${discover.get(u)}/${time}`,
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Start DFS from the given start node first
  if (color.get(startNodeId) === 'white') {
    steps.push({
      id: stepId++,
      description: `Start DFS from node ${startNodeId}`,
      pseudocodeLine: 5,
      mutations: [
        {
          targetId: `node-${startNodeId}`,
          property: 'highlight',
          from: 'default',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });
    dfsVisit(startNodeId);
  }

  // Visit remaining unvisited nodes (for disconnected graphs)
  for (const node of graph.nodes) {
    if (color.get(node.id) === 'white') {
      steps.push({
        id: stepId++,
        description: `Node ${node.id} still WHITE. Start new DFS tree`,
        pseudocodeLine: 5,
        mutations: [
          {
            targetId: `node-${node.id}`,
            property: 'highlight',
            from: 'default',
            to: 'current',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
      dfsVisit(node.id);
    }
  }

  // Final state: discovery times
  const finalState = graph.nodes.map((n) => discover.get(n.id) ?? 0);

  return { config: CONFIG, steps, finalState };
}
