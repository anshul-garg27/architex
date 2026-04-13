// -----------------------------------------------------------------
// Architex -- Iterative DFS with Step Recording  (ALG-223)
// -----------------------------------------------------------------
// Same DFS traversal as recursive dfs.ts but using an explicit stack
// instead of the call stack. Makes the stack data structure's role in
// DFS crystal clear and avoids stack overflow on deep graphs.

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'dfs-iterative',
  name: 'DFS (Iterative)',
  category: 'graph',
  difficulty: 'intermediate',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Same traversal as recursive DFS but using an explicit stack — making the implicit call stack visible. Each pop() is like a function return. This variant avoids stack overflow on deep graphs and makes the stack data structure\'s role in DFS crystal clear.',
  pseudocode: [
    'procedure DFS-Iterative(G, source)',
    '  for each vertex u in G do',
    '    color[u] = WHITE',
    '  push source onto stack',
    '  while stack is not empty do',
    '    u = pop(stack)',
    '    if color[u] != WHITE then continue',
    '    color[u] = GRAY; time++; discover[u] = time',
    '    for each neighbor v of u (in reverse) do',
    '      if color[v] == WHITE then',
    '        push v onto stack',
    '    color[u] = BLACK; time++; finish[u] = time',
  ],
};

export function dfsIterative(graph: Graph, startNodeId: string): AlgorithmResult {
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

  // WHY we use three colors even in the iterative version: WHITE = undiscovered,
  // GRAY = discovered/on stack, BLACK = fully processed. This mirrors the recursive
  // version's implicit call-stack state and lets us detect back edges (cycles).
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

  // WHY we use an explicit stack: this replaces the recursive call stack. Each
  // push is like making a recursive call, each pop is like returning from one.
  // The explicit stack makes the LIFO ordering visible — the key difference
  // between DFS (stack/LIFO) and BFS (queue/FIFO).
  const stack: string[] = [];

  // Helper to format stack contents for step descriptions
  function stackStr(): string {
    return `[${stack.join(', ')}]`;
  }

  function processComponent(sourceId: string): void {
    stack.push(sourceId);
    color.set(sourceId, 'gray');
    writes++;

    steps.push({
      id: stepId++,
      description: `Push source node ${sourceId} onto stack. Stack: ${stackStr()}`,
      pseudocodeLine: 3,
      mutations: [
        {
          targetId: `node-${sourceId}`,
          property: 'highlight',
          from: 'default',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // WHY the main loop checks stack.length: just like recursive DFS continues
    // until the call stack unwinds completely, iterative DFS continues until
    // the explicit stack is empty — meaning all reachable nodes are processed.
    while (stack.length > 0) {
      // WHY pop() and not shift(): pop() gives LIFO (stack) behavior — the last
      // node pushed is processed first, creating depth-first exploration. Using
      // shift() would give FIFO (queue) behavior, turning this into BFS.
      const u = stack.pop()!;
      reads++;

      // Skip if already fully processed (can happen when a node was pushed
      // multiple times before being popped)
      if (color.get(u) === 'black') {
        steps.push({
          id: stepId++,
          description: `Pop ${u} from stack — already finished (BLACK). Skip. Stack: ${stackStr()}`,
          pseudocodeLine: 6,
          mutations: [],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 250,
        });
        continue;
      }

      time++;
      discover.set(u, time);
      color.set(u, 'gray');
      writes += 2;

      // Discovery step
      steps.push({
        id: stepId++,
        description: `Pop and discover node ${u} (time = ${time}). Stack: ${stackStr()}`,
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
            to: `${time}/-`,
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 400,
      });

      const neighbors = adj.get(u) ?? [];

      // WHY reverse iteration: in the recursive version, neighbors are visited
      // in forward order. Because a stack reverses insertion order (LIFO), we
      // push neighbors in reverse so they're popped in forward order — matching
      // the recursive DFS traversal order.
      const whiteNeighbors: string[] = [];

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
          whiteNeighbors.push(v);

          steps.push({
            id: stepId++,
            description: `Explore edge ${u} -> ${v}: node ${v} is WHITE. Will push onto stack.`,
            pseudocodeLine: 9,
            mutations: edgeMutations,
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
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
            pseudocodeLine: 9,
            mutations: edgeMutations,
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        } else {
          steps.push({
            id: stepId++,
            description: `Edge ${u} -> ${v}: node ${v} is BLACK (already finished)`,
            pseudocodeLine: 9,
            mutations: edgeMutations,
            complexity: { comparisons, swaps: 0, reads, writes },
            duration: 300,
          });
        }
      }

      // Push white neighbors in reverse order so they are popped in forward order
      for (let idx = whiteNeighbors.length - 1; idx >= 0; idx--) {
        const v = whiteNeighbors[idx];
        stack.push(v);
        writes++;
      }

      if (whiteNeighbors.length > 0) {
        steps.push({
          id: stepId++,
          description: `Push [${whiteNeighbors.join(', ')}] onto stack (reversed for correct order). Stack: ${stackStr()}`,
          pseudocodeLine: 10,
          mutations: whiteNeighbors.map((v) => ({
            targetId: `node-${v}`,
            property: 'highlight' as const,
            from: 'default',
            to: 'in-queue',
            easing: 'ease-out' as const,
          })),
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 350,
        });
      }

      // Finish u
      time++;
      finish.set(u, time);
      color.set(u, 'black');
      writes += 2;

      steps.push({
        id: stepId++,
        description: `Finish node ${u} (discover=${discover.get(u)}, finish=${time}). Stack: ${stackStr()}`,
        pseudocodeLine: 11,
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
  }

  // Start DFS from the given start node
  if (color.get(startNodeId) === 'white') {
    steps.push({
      id: stepId++,
      description: `Start iterative DFS from node ${startNodeId}`,
      pseudocodeLine: 3,
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
    processComponent(startNodeId);
  }

  // Visit remaining unvisited nodes (for disconnected graphs)
  for (const node of graph.nodes) {
    if (color.get(node.id) === 'white') {
      steps.push({
        id: stepId++,
        description: `Node ${node.id} still WHITE. Start new DFS tree`,
        pseudocodeLine: 3,
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
      processComponent(node.id);
    }
  }

  // Final state: discovery times
  const finalState = graph.nodes.map((n) => discover.get(n.id) ?? 0);

  return { config: CONFIG, steps, finalState };
}
