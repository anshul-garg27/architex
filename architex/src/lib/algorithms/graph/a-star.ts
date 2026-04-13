// -----------------------------------------------------------------
// Architex -- A* Search with Step Recording  (ALG-027)
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Graph, GraphNode } from './types';

const CONFIG: AlgorithmConfig = {
  id: 'a-star',
  name: 'A* Search',
  category: 'graph',
  timeComplexity: {
    best: 'O(E)',
    average: 'O(E log V)',
    worst: 'O(V^2)',
  },
  spaceComplexity: 'O(V)',
  description:
    'Finds the shortest path using a heuristic (Euclidean distance) to guide exploration. Explores fewer nodes than Dijkstra when a good heuristic is available.',
  pseudocode: [
    'procedure AStar(G, start, goal)',
    '  openSet = {start}; closedSet = {}',
    '  g[start] = 0',
    '  f[start] = h(start, goal)',
    '  while openSet is not empty do',
    '    current = node in openSet with lowest f',
    '    if current == goal then',
    '      return reconstruct_path()',
    '    move current from openSet to closedSet',
    '    for each neighbor v of current do',
    '      if v in closedSet then continue',
    '      tentative_g = g[current] + w(current, v)',
    '      if tentative_g < g[v] then',
    '        prev[v] = current',
    '        g[v] = tentative_g',
    '        f[v] = g[v] + h(v, goal)',
    '        add v to openSet',
    '  return failure (no path)',
  ],
};

/** Euclidean distance heuristic between two nodes. */
function heuristic(a: GraphNode, b: GraphNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function aStar(
  graph: Graph,
  startNodeId: string,
  goalNodeId?: string,
): AlgorithmResult {
  // Guard: empty graph has no nodes to search
  if (graph.nodes.length === 0) {
    return { steps: [], config: CONFIG, finalState: [] };
  }

  const steps: AnimationStep[] = [];
  let stepId = 0;
  let comparisons = 0;
  let reads = 0;
  let writes = 0;

  const nodeMap = new Map<string, GraphNode>();
  for (const node of graph.nodes) {
    nodeMap.set(node.id, node);
  }

  // Default goal: last node in the graph
  const effectiveGoal = goalNodeId ?? graph.nodes[graph.nodes.length - 1].id;
  const goalNode = nodeMap.get(effectiveGoal)!;

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

  // g, f maps and tracking sets
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const openSet = new Set<string>();
  const closedSet = new Set<string>();

  for (const node of graph.nodes) {
    gScore.set(node.id, Infinity);
    fScore.set(node.id, Infinity);
    prev.set(node.id, null);
  }

  gScore.set(startNodeId, 0);
  const startH = heuristic(nodeMap.get(startNodeId)!, goalNode);
  fScore.set(startNodeId, startH);
  openSet.add(startNodeId);

  steps.push({
    id: stepId++,
    description: `Initialize A*: start=${startNodeId}, goal=${effectiveGoal}. g[${startNodeId}]=0, h=${startH.toFixed(1)}, f=${startH.toFixed(1)}`,
    pseudocodeLine: 0,
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
        to: `g=0 f=${startH.toFixed(0)}`,
        easing: 'ease-out',
      },
      {
        targetId: `node-${effectiveGoal}`,
        property: 'highlight',
        from: 'default',
        to: 'current',
        easing: 'ease-out',
      },
    ],
    complexity: { comparisons, swaps: 0, reads, writes },
    duration: 500,
  });

  let pathFound = false;

  while (openSet.size > 0) {
    // Find node in openSet with lowest fScore
    let current = '';
    let currentF = Infinity;
    for (const nodeId of openSet) {
      reads++;
      const f = fScore.get(nodeId) ?? Infinity;
      if (f < currentF) {
        current = nodeId;
        currentF = f;
      }
    }

    const currentG = gScore.get(current) ?? Infinity;
    const currentNode = nodeMap.get(current)!;
    const currentH = heuristic(currentNode, goalNode);

    steps.push({
      id: stepId++,
      description: `Select ${current} from open set: g=${currentG.toFixed(1)}, h=${currentH.toFixed(1)}, f=${currentF.toFixed(1)}. A* picks the node with lowest f(n) = g(n) + h(n) — the heuristic h pulls the search toward the goal, making it faster than Dijkstra.`,
      pseudocodeLine: 5,
      mutations: [
        {
          targetId: `node-${current}`,
          property: 'highlight',
          from: 'in-queue',
          to: 'current',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });

    // Goal reached
    if (current === effectiveGoal) {
      pathFound = true;

      steps.push({
        id: stepId++,
        description: `Goal ${effectiveGoal} reached! Reconstructing path`,
        pseudocodeLine: 7,
        mutations: [
          {
            targetId: `node-${current}`,
            property: 'highlight',
            from: 'current',
            to: 'in-path',
            easing: 'ease-out',
          },
        ],
        complexity: { comparisons, swaps: 0, reads, writes },
        duration: 500,
      });
      break;
    }

    // Move current from openSet to closedSet
    openSet.delete(current);
    closedSet.add(current);

    steps.push({
      id: stepId++,
      description: `Move ${current} to closed set (${closedSet.size} explored)`,
      pseudocodeLine: 8,
      mutations: [
        {
          targetId: `node-${current}`,
          property: 'highlight',
          from: 'current',
          to: 'visited',
          easing: 'ease-out',
        },
      ],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 300,
    });

    // Explore neighbors
    const neighbors = adj.get(current) ?? [];
    for (const { neighbor: v, weight } of neighbors) {
      if (closedSet.has(v)) {
        comparisons++;
        continue;
      }

      comparisons++;
      reads += 2;
      const tentativeG = currentG + weight;
      const currentGv = gScore.get(v) ?? Infinity;
      const vNode = nodeMap.get(v)!;
      const vH = heuristic(vNode, goalNode);

      const edgeMutations: VisualMutation[] = [
        {
          targetId: `edge-${current}-${v}`,
          property: 'highlight',
          from: 'default',
          to: 'visiting',
          easing: 'ease-out',
        },
      ];

      if (tentativeG < currentGv) {
        // Better path found
        prev.set(v, current);
        gScore.set(v, tentativeG);
        const newF = tentativeG + vH;
        fScore.set(v, newF);
        writes += 3;

        if (!openSet.has(v)) {
          openSet.add(v);
        }

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
          from: `g=${currentGv === Infinity ? 'INF' : currentGv.toFixed(0)}`,
          to: `g=${tentativeG.toFixed(0)} f=${newF.toFixed(0)}`,
          easing: 'ease-out',
        });

        steps.push({
          id: stepId++,
          description: `Neighbor ${v}: g=${tentativeG.toFixed(1)}, h=${vH.toFixed(1)}, f=${(tentativeG + vH).toFixed(1)} -- improved`,
          pseudocodeLine: 12,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 400,
        });
      } else {
        steps.push({
          id: stepId++,
          description: `Neighbor ${v}: tentative g=${tentativeG.toFixed(1)} >= current g=${currentGv.toFixed(1)}. No improvement`,
          pseudocodeLine: 12,
          mutations: edgeMutations,
          complexity: { comparisons, swaps: 0, reads, writes },
          duration: 250,
        });
      }
    }
  }

  // Reconstruct and highlight path
  if (pathFound) {
    const path: string[] = [];
    let cur: string | null = effectiveGoal;
    while (cur !== null) {
      path.unshift(cur);
      cur = prev.get(cur) ?? null;
    }

    const pathMutations: VisualMutation[] = [];
    for (let i = 0; i < path.length; i++) {
      pathMutations.push({
        targetId: `node-${path[i]}`,
        property: 'highlight',
        from: 'visited',
        to: 'in-path',
        easing: 'ease-out',
      });
      if (i > 0) {
        pathMutations.push({
          targetId: `edge-${path[i - 1]}-${path[i]}`,
          property: 'highlight',
          from: 'default',
          to: 'in-path',
          easing: 'ease-out',
        });
      }
    }

    steps.push({
      id: stepId++,
      description: `Shortest path: ${path.join(' -> ')} (explored ${closedSet.size} nodes vs ${graph.nodes.length} total)`,
      pseudocodeLine: 7,
      mutations: pathMutations,
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 600,
    });
  } else {
    steps.push({
      id: stepId++,
      description: `No path found from ${startNodeId} to ${effectiveGoal}`,
      pseudocodeLine: 17,
      mutations: [],
      complexity: { comparisons, swaps: 0, reads, writes },
      duration: 400,
    });
  }

  const finalState = graph.nodes.map((n) => {
    const g = gScore.get(n.id);
    return g === Infinity ? -1 : Math.round(g ?? -1);
  });

  return { config: CONFIG, steps, finalState };
}
