// -----------------------------------------------------------------
// Architex -- Euler Path / Circuit via Hierholzer's Algorithm  (ALG-037)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'euler-path',
  name: "Euler Path (Hierholzer's)",
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(E)',
  description:
    "Finds an Euler path or circuit using Hierholzer's algorithm. An Euler path visits every edge exactly once. An Euler circuit is an Euler path that starts and ends at the same node.",
  pseudocode: [
    "procedure Hierholzer(G, start)",
    '  check degree conditions for path/circuit',
    '  stack = [start]; circuit = []',
    '  while stack is not empty do',
    '    u = top of stack',
    '    if u has unused edges then',
    '      pick an unused edge (u, v)',
    '      mark edge as used',
    '      push v onto stack',
    '    else',
    '      pop u from stack',
    '      prepend u to circuit',
    '  return circuit',
  ],
};

export function eulerPath(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list with edge indices for tracking usage
  // For undirected graphs, each edge appears in both directions
  interface AdjEntry {
    neighbor: string;
    edgeIndex: number; // index into graph.edges
  }
  const adj = new Map<string, AdjEntry[]>();
  for (const node of graph.nodes) {
    adj.set(node.id, []);
  }

  for (let i = 0; i < graph.edges.length; i++) {
    const edge = graph.edges[i];
    adj.get(edge.source)?.push({ neighbor: edge.target, edgeIndex: i });
    if (!edge.directed) {
      adj.get(edge.target)?.push({ neighbor: edge.source, edgeIndex: i });
    }
  }

  // Track used edges
  const usedEdge = new Array<boolean>(graph.edges.length).fill(false);

  // Track current position in adjacency list for each node
  const adjPointer = new Map<string, number>();
  for (const node of graph.nodes) {
    adjPointer.set(node.id, 0);
  }

  // Check degree conditions
  const degree = new Map<string, number>();
  for (const node of graph.nodes) {
    degree.set(node.id, 0);
  }
  for (const edge of graph.edges) {
    if (edge.directed) {
      // out-degree / in-degree check is more complex; for simplicity we use undirected logic
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    } else {
      degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
      degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    }
  }

  let oddDegreeCount = 0;
  for (const [, deg] of degree) {
    if (deg % 2 !== 0) oddDegreeCount++;
  }

  const isCircuitPossible = oddDegreeCount === 0;
  const isPathPossible = oddDegreeCount === 0 || oddDegreeCount === 2;

  // Initialization step
  steps.push({
    id: stepId++,
    description: `Check degrees: ${oddDegreeCount} node(s) with odd degree. ${
      isCircuitPossible
        ? 'Euler CIRCUIT possible'
        : isPathPossible
          ? 'Euler PATH possible (not circuit)'
          : 'No Euler path/circuit exists'
    }`,
    pseudocodeLine: 1,
    mutations: graph.nodes.map((n) => ({
      targetId: `node-${n.id}`,
      property: 'highlight' as const,
      from: 'default',
      to: 'default',
      easing: 'ease-out' as const,
    })),
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  if (!isPathPossible) {
    steps.push({
      id: stepId++,
      description: 'No Euler path or circuit exists for this graph',
      pseudocodeLine: 1,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    return { config: CONFIG, steps, finalState: [0] };
  }

  // Hierholzer's algorithm
  const stack: string[] = [startNodeId];
  const circuit: string[] = [];

  steps.push({
    id: stepId++,
    description: `Initialize: push ${startNodeId} onto stack`,
    pseudocodeLine: 2,
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

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    reads++;

    // Find next unused edge from u
    const adjList = adj.get(u) ?? [];
    let ptr = adjPointer.get(u) ?? 0;
    let foundEdge = false;

    while (ptr < adjList.length) {
      comparisons++;
      const entry = adjList[ptr];
      if (!usedEdge[entry.edgeIndex]) {
        // Use this edge
        usedEdge[entry.edgeIndex] = true;
        writes++;
        adjPointer.set(u, ptr + 1);

        const v = entry.neighbor;
        stack.push(v);

        const edge = graph.edges[entry.edgeIndex];
        const edgeId =
          edge.source === u
            ? `edge-${edge.source}-${edge.target}`
            : `edge-${edge.target}-${edge.source}`;

        steps.push({
          id: stepId++,
          description: `Traverse edge ${u} -> ${v}. Mark edge as used. Push ${v} onto stack`,
          pseudocodeLine: 7,
          mutations: [
            {
              targetId: edgeId,
              property: 'highlight',
              from: 'default',
              to: 'in-path',
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
          duration: 400,
        });

        foundEdge = true;
        break;
      }
      ptr++;
      adjPointer.set(u, ptr);
    }

    if (!foundEdge) {
      // No unused edges -- pop and add to circuit
      stack.pop();
      circuit.push(u);
      writes++;

      steps.push({
        id: stepId++,
        description: `No unused edges from ${u}. Pop from stack, prepend to circuit. Circuit so far: [${circuit.join(', ')}]`,
        pseudocodeLine: 11,
        mutations: [
          {
            targetId: `node-${u}`,
            property: 'highlight',
            from: 'current',
            to: 'visited',
            easing: 'ease-out',
          },
          {
            targetId: `node-${u}`,
            property: 'label',
            from: '',
            to: `#${circuit.length}`,
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });
    }
  }

  // Reverse circuit to get proper order
  circuit.reverse();

  const allEdgesUsed = usedEdge.every((u) => u);

  // Summary step
  steps.push({
    id: stepId++,
    description: allEdgesUsed
      ? `Euler ${isCircuitPossible ? 'circuit' : 'path'} found: ${circuit.join(' -> ')}`
      : `Partial path found (graph may be disconnected): ${circuit.join(' -> ')}`,
    pseudocodeLine: 12,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  const finalState = [allEdgesUsed ? 1 : 0];

  return { config: CONFIG, steps, finalState };
}
