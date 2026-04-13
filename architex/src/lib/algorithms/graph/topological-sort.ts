// -----------------------------------------------------------------
// Architex -- Topological Sort (Kahn's Algorithm) with Step Recording  (ALG-028)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'topological-sort',
  name: 'Topological Sort',
  category: 'graph',
  timeComplexity: {
    best: 'O(V + E)',
    average: 'O(V + E)',
    worst: 'O(V + E)',
  },
  spaceComplexity: 'O(V)',
  description:
    "Produces a linear ordering of vertices in a DAG such that for every directed edge u -> v, u comes before v. Uses Kahn's algorithm (BFS-based) with in-degree tracking.",
  pseudocode: [
    "procedure TopologicalSort(G)   // Kahn's algorithm",
    '  compute in-degree for each vertex',
    '  Q = all vertices with in-degree 0',
    '  order = empty list',
    '  while Q is not empty do',
    '    u = dequeue(Q)',
    '    append u to order',
    '    for each neighbor v of u do',
    '      in-degree[v]--',
    '      if in-degree[v] == 0 then',
    '        enqueue(Q, v)',
    '  if |order| != |V| then cycle detected',
    '  return order',
  ],
};

export function topologicalSort(
  graph: Graph,
  _startNodeId: string,
): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list (directed only)
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of graph.nodes) {
    adj.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of graph.edges) {
    adj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Show initial in-degrees
  const inDegreeMutations: VisualMutation[] = graph.nodes.map((n) => ({
    targetId: `node-${n.id}`,
    property: 'label' as const,
    from: '',
    to: `in=${inDegree.get(n.id) ?? 0}`,
    easing: 'ease-out' as const,
  }));

  steps.push({
    id: stepId++,
    description: `Compute in-degrees: ${graph.nodes.map((n) => `${n.id}=${inDegree.get(n.id)}`).join(', ')}`,
    pseudocodeLine: 1,
    mutations: inDegreeMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  // Initialize queue with in-degree 0 nodes
  const queue: string[] = [];
  const queueMutations: VisualMutation[] = [];

  for (const node of graph.nodes) {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
      queueMutations.push({
        targetId: `node-${node.id}`,
        property: 'highlight',
        from: 'default',
        to: 'in-queue',
        easing: 'ease-out',
      });
    }
  }

  steps.push({
    id: stepId++,
    description: `Enqueue nodes with in-degree 0: [${queue.join(', ')}]`,
    pseudocodeLine: 2,
    mutations: queueMutations,
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  const order: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);
    reads++;
    writes++;

    // Dequeue step
    steps.push({
      id: stepId++,
      description: `Dequeue node ${u}. Order so far: [${order.join(', ')}]`,
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
      const newDeg = (inDegree.get(v) ?? 1) - 1;
      inDegree.set(v, newDeg);
      writes++;

      const neighborMutations: VisualMutation[] = [
        {
          targetId: `edge-${u}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
        {
          targetId: `node-${v}`,
          property: 'label',
          from: `in=${newDeg + 1}`,
          to: `in=${newDeg}`,
          easing: 'ease-out',
        },
      ];

      if (newDeg === 0) {
        queue.push(v);
        neighborMutations.push({
          targetId: `node-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'in-queue',
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Decrement in-degree of ${v} to ${newDeg}. In-degree is 0 -- enqueue ${v}`,
          pseudocodeLine: 9,
          mutations: neighborMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Decrement in-degree of ${v} to ${newDeg}`,
          pseudocodeLine: 8,
          mutations: neighborMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // Mark u as done
    steps.push({
      id: stepId++,
      description: `Node ${u} placed at position ${order.length} in topological order`,
      pseudocodeLine: 6,
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
          from: `in=0`,
          to: `#${order.length}`,
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Check for cycle
  if (order.length !== graph.nodes.length) {
    steps.push({
      id: stepId++,
      description: `Cycle detected! Only ${order.length} of ${graph.nodes.length} nodes ordered`,
      pseudocodeLine: 11,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 500,
    });
  } else {
    steps.push({
      id: stepId++,
      description: `Topological order complete: [${order.join(', ')}]`,
      pseudocodeLine: 12,
      mutations: order.map((id, i) => ({
        targetId: `node-${id}`,
        property: 'label' as const,
        from: `#${i + 1}`,
        to: `#${i + 1}`,
        easing: 'ease-out' as const,
      })),
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 500,
    });
  }

  // Final state: position in topological order (0-indexed)
  const orderMap = new Map<string, number>();
  order.forEach((id, i) => orderMap.set(id, i));
  const finalState = graph.nodes.map((n) => orderMap.get(n.id) ?? -1);

  return { config: CONFIG, steps, finalState };
}
