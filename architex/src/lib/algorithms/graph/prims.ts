// -----------------------------------------------------------------
// Architex -- Prim's MST with Step Recording  (ALG-030)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'prims',
  name: "Prim's MST",
  category: 'graph',
  timeComplexity: {
    best: 'O(E log V)',
    average: 'O(E log V)',
    worst: 'O(E log V)',
  },
  spaceComplexity: 'O(V + E)',
  description:
    'Builds a minimum spanning tree by growing a single tree from a starting node, always adding the cheapest edge that crosses the cut between tree and non-tree vertices.',
  pseudocode: [
    "procedure Prim(G, source)",
    '  for each vertex v: key[v] = INF; inMST[v] = false',
    '  key[source] = 0',
    '  PQ = min-priority queue of all vertices by key',
    '  while PQ is not empty do',
    '    u = extract-min(PQ)',
    '    inMST[u] = true',
    '    for each neighbor v of u do',
    '      if not inMST[v] and weight(u,v) < key[v] then',
    '        key[v] = weight(u,v); parent[v] = u',
    '        decrease-key(PQ, v)',
    '  return parent (MST edges)',
  ],
};

/** Priority queue entry for Prim's. */
interface PQEntry {
  id: string;
  key: number;
}

export function prims(graph: Graph, startNodeId: string): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  // Build adjacency list (undirected)
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

  // Initialize keys and parent
  const key = new Map<string, number>();
  const parent = new Map<string, string | null>();
  const inMST = new Set<string>();

  for (const node of graph.nodes) {
    key.set(node.id, Infinity);
    parent.set(node.id, null);
  }
  key.set(startNodeId, 0);

  steps.push({
    id: stepId++,
    description: `Initialize all keys to INF. Set key[${startNodeId}] = 0`,
    pseudocodeLine: 1,
    mutations: [
      {
        targetId: `node-${startNodeId}`,
        property: 'label',
        from: '',
        to: 'key=0',
        easing: 'ease-out',
      },
      ...graph.nodes
        .filter((n) => n.id !== startNodeId)
        .map((n) => ({
          targetId: `node-${n.id}`,
          property: 'label' as const,
          from: '',
          to: 'key=INF',
          easing: 'ease-out' as const,
        })),
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 400,
  });

  // Priority queue (simple array-based)
  const pq: PQEntry[] = graph.nodes.map((n) => ({
    id: n.id,
    key: key.get(n.id) ?? Infinity,
  }));

  let mstWeight = 0;
  let edgesAccepted = 0;

  while (pq.length > 0) {
    // Extract min
    pq.sort((a, b) => a.key - b.key);
    const uEntry = pq.shift()!;
    const u = uEntry.id;
    const uKey = key.get(u) ?? Infinity;

    if (uKey === Infinity) {
      steps.push({
        id: stepId++,
        description: `Node ${u} has key INF -- unreachable. Stop`,
        pseudocodeLine: 4,
        mutations: [],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 300,
      });
      break;
    }

    reads++;
    inMST.add(u);
    mstWeight += uKey;

    // Build mutations for extracting u
    const extractMutations: VisualMutation[] = [
      {
        targetId: `node-${u}`,
        property: 'highlight',
        from: 'default',
        to: 'current',
        easing: 'ease-out',
      },
    ];

    // If u has a parent, highlight the MST edge
    const p = parent.get(u);
    if (p !== null && p !== undefined) {
      edgesAccepted++;
      extractMutations.push({
        targetId: `edge-${p}-${u}`,
        property: 'highlight',
        from: 'visiting',
        to: 'in-path',
        easing: 'spring',
      });
    }

    steps.push({
      id: stepId++,
      description: p
        ? `Extract min: node ${u} (key = ${uKey}). Add edge ${p} - ${u} to MST. Total weight = ${mstWeight}, edges = ${edgesAccepted}`
        : `Extract min: source node ${u} (key = 0). Start MST`,
      pseudocodeLine: 5,
      mutations: extractMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // Explore neighbors
    const neighbors = adj.get(u) ?? [];
    for (const { neighbor: v, weight } of neighbors) {
      if (inMST.has(v)) continue;

      comparisons++;
      reads += 2;
      const currentKey = key.get(v) ?? Infinity;

      if (weight < currentKey) {
        // Relax: update key and parent
        key.set(v, weight);
        parent.set(v, u);
        writes += 2;

        // Update PQ entry
        const pqEntry = pq.find((e) => e.id === v);
        if (pqEntry) pqEntry.key = weight;

        steps.push({
          id: stepId++,
          description: `Edge ${u} - ${v} (w=${weight}) < key[${v}]=${currentKey === Infinity ? 'INF' : currentKey}. Update key[${v}] = ${weight}. Prim's grows the MST from one node, always picking the cheapest edge connecting the tree to an outside node.`,
          pseudocodeLine: 8,
          mutations: [
            {
              targetId: `edge-${u}-${v}`,
              property: 'highlight',
              from: 'default',
              to: 'visiting',
              easing: 'ease-out',
            },
            {
              targetId: `node-${v}`,
              property: 'highlight',
              from: 'default',
              to: 'discovered',
              easing: 'ease-out',
            },
            {
              targetId: `node-${v}`,
              property: 'label',
              from: `key=${currentKey === Infinity ? 'INF' : currentKey}`,
              to: `key=${weight}`,
              easing: 'ease-out',
            },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        // Edge not improving -- mark as rejected (gray)
        steps.push({
          id: stepId++,
          description: `Edge ${u} - ${v} (w=${weight}) >= key[${v}]=${currentKey}. No improvement`,
          pseudocodeLine: 8,
          mutations: [
            {
              targetId: `edge-${u}-${v}`,
              property: 'highlight',
              from: 'default',
              to: 'visited',
              easing: 'ease-out',
            },
          ],
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 300,
        });
      }
    }

    // Mark u as finalized in MST (green)
    steps.push({
      id: stepId++,
      description: `Node ${u} finalized in MST`,
      pseudocodeLine: 6,
      mutations: [
        {
          targetId: `node-${u}`,
          property: 'highlight',
          from: 'current',
          to: 'in-path',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });
  }

  // Final summary
  steps.push({
    id: stepId++,
    description: `MST complete! ${edgesAccepted} edges, total weight = ${mstWeight}`,
    pseudocodeLine: 11,
    mutations: [],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  const finalState = graph.nodes.map(() => mstWeight);
  return { config: CONFIG, steps, finalState };
}
