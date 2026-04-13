// -----------------------------------------------------------------
// Architex -- Directed Cycle Detection via DFS (White/Gray/Black)  (ALG-036)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'cycle-detection',
  name: 'Cycle Detection (Directed)',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Detects cycles in a directed graph using DFS with three-color marking (white/gray/black). A back edge to a gray node proves a cycle exists.',
  pseudocode: [
    'procedure HasCycle(G)',
    '  for each vertex u in G do',
    '    color[u] = WHITE',
    '  for each vertex u in G do',
    '    if color[u] == WHITE then',
    '      if DFS-Visit(u) == true then',
    '        return true  // cycle found',
    '  return false',
    'procedure DFS-Visit(u)',
    '  color[u] = GRAY  // in current stack',
    '  for each neighbor v of u do',
    '    if color[v] == GRAY then',
    '      return true  // back edge = cycle',
    '    if color[v] == WHITE then',
    '      if DFS-Visit(v) then return true',
    '  color[u] = BLACK',
    '  return false',
  ],
};

export function cycleDetection(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list (directed only)
  const adj = new Map<string, string[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }
  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
    // Only add reverse if undirected
    if (!edge.directed) {
      adj.get(edge.target)?.push(edge.source);
    }
  }

  // Three-color marking
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  for (const node of graph.nodes) {
    color.set(node.id, 'white');
  }

  let cycleFound = false;
  const cycleEdge: { from: string; to: string } | null = null;

  // Initialization step
  steps.push({
    id: stepId++,
    description: 'Initialize all nodes as WHITE (unvisited)',
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

  function dfsVisit(u: string): boolean {
    color.set(u, 'gray');
    writes++;

    // Mark node as in-stack (gray)
    steps.push({
      id: stepId++,
      description: `Enter DFS-Visit(${u}): mark as GRAY (in recursion stack)`,
      pseudocodeLine: 9,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'default',
          to: 'in-queue',
          easing: 'ease-out',
        },
        {
          targetId: `node-${u}`,
          property: 'label',
          from: '',
          to: 'GRAY',
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
      const vColor = color.get(v)!;

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (vColor === 'gray') {
        // Back edge -- cycle found!
        cycleFound = true;

        edgeMutations.push({
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'visiting',
          to: 'in-path',
          easing: 'ease-out',
        });
        edgeMutations.push({
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'in-queue',
          to: 'current',
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `BACK EDGE: ${u} -> ${v} (GRAY). CYCLE DETECTED!`,
          pseudocodeLine: 12,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 600,
        });

        return true;
      } else if (vColor === 'white') {
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: node ${v} is WHITE. Recurse into ${v}`,
          pseudocodeLine: 14,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });

        if (dfsVisit(v)) {
          return true;
        }
      } else {
        // black -- already fully processed
        steps.push({
          id: stepId++,
          description: `Edge ${u} -> ${v}: node ${v} is BLACK (fully processed). No cycle here`,
          pseudocodeLine: 10,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // Finish node
    color.set(u, 'black');
    writes++;

    steps.push({
      id: stepId++,
      description: `Finish DFS-Visit(${u}): mark as BLACK`,
      pseudocodeLine: 15,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'in-queue',
          to: 'visited',
          easing: 'ease-out',
        },
        {
          targetId: `node-${u}`,
          property: 'label',
          from: 'GRAY',
          to: 'BLACK',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    return false;
  }

  // Start from startNodeId first, then process remaining nodes
  const orderedNodes = [
    startNodeId,
    ...graph.nodes.map((n) => n.id).filter((id) => id !== startNodeId),
  ];

  for (const nodeId of orderedNodes) {
    if (color.get(nodeId) === 'white') {
      steps.push({
        id: stepId++,
        description: `Start DFS from unvisited node ${nodeId}`,
        pseudocodeLine: 4,
        mutations: [
          {
            targetId: `node-${nodeId}`,
            property: 'highlight',
            from: 'default',
            to: 'current',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });

      if (dfsVisit(nodeId)) {
        break;
      }
    }
  }

  // Summary step
  steps.push({
    id: stepId++,
    description: cycleFound
      ? 'Cycle DETECTED in the directed graph'
      : 'No cycle found. The graph is acyclic (DAG)',
    pseudocodeLine: cycleFound ? 6 : 7,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  const finalState = [cycleFound ? 1 : 0];

  return { config: CONFIG, steps, finalState };
}
