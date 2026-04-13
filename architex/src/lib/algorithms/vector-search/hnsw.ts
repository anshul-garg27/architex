// -----------------------------------------------------------------
// Architex -- HNSW (Hierarchical Navigable Small World) Algorithm
// Simplified 2-layer demo for approximate nearest neighbor search
// -----------------------------------------------------------------

import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  VisualMutation,
} from '../types';
import type { Point2D } from '../geometry/types';

// -- Config ---------------------------------------------------------------

export const HNSW_CONFIG: AlgorithmConfig = {
  id: 'hnsw',
  name: 'HNSW (Approx. Nearest Neighbor)',
  category: 'geometry',
  timeComplexity: { best: 'O(log n)', average: 'O(log n)', worst: 'O(n)' },
  spaceComplexity: 'O(n log n)',
  stable: false,
  inPlace: false,
  difficulty: 'advanced',
  description:
    "How does Spotify find songs similar to yours from 100 million tracks in milliseconds? HNSW — a multi-layer graph where higher layers have fewer, wider-spaced nodes (express lanes) and lower layers have all nodes. Search starts at the top, greedily walks toward the query, then drops down for finer resolution. Each layer halves the search space. Used in: Pinecone, Weaviate, Qdrant, pgvector — the backbone of every vector database powering AI/RAG applications.",
  pseudocode: [
    'procedure HNSW_Search(query, entry_point, layers)',
    '  current = entry_point',
    '  for layer = top_layer down to 1:',
    '    while improved:',
    '      for each neighbor of current in layer:',
    '        if dist(neighbor, query) < dist(current, query):',
    '          current = neighbor',
    '  // Now on layer 0 — search all neighbors',
    '  candidates = neighbors of current in layer 0',
    '  return closest K from candidates',
  ],
  complexityIntuition:
    'The top layer has ~log(n) nodes acting as express lanes, cutting the search space exponentially at each level. Dropping to denser layers refines the result. Average query visits O(log n) nodes total — similar to a skip list but in high-dimensional space.',
  realWorldApps: [
    'Pinecone — managed vector database for RAG',
    'Weaviate — open-source vector search engine',
    'Qdrant — high-performance vector similarity search',
    'pgvector — Postgres extension for vector search',
    'Spotify — song recommendation via embedding similarity',
  ],
  whenToUse:
    'Use HNSW when you need sub-millisecond approximate nearest neighbor search on millions+ vectors. Trade ~5% recall for 100x speed over brute force. Not suitable for exact search or very small datasets where brute force suffices.',
  commonMistakes: [
    'Confusing HNSW with exact k-NN — HNSW is approximate and may miss the true nearest neighbor',
    'Setting M (max connections) too low — reduces recall. Too high — wastes memory',
    'Forgetting that build time is O(n log n) — inserting 1M vectors takes time',
  ],
  summary: [
    'Multi-layer skip-list-like graph for vector similarity search',
    'O(log n) search by starting at sparse top layer and descending',
    'The backbone of modern vector databases (Pinecone, Weaviate, pgvector)',
  ],
};

// -- Default points for demo -----------------------------------------------

const DEFAULT_POINTS: Point2D[] = [
  { id: 'p0', x: 80, y: 200 },
  { id: 'p1', x: 150, y: 100 },
  { id: 'p2', x: 200, y: 300 },
  { id: 'p3', x: 280, y: 150 },
  { id: 'p4', x: 320, y: 280 },
  { id: 'p5', x: 400, y: 120 },
  { id: 'p6', x: 420, y: 250 },
  { id: 'p7', x: 500, y: 180 },
  { id: 'p8', x: 480, y: 330 },
  { id: 'p9', x: 350, y: 60 },
  { id: 'p10', x: 260, y: 350 },
  { id: 'p11', x: 140, y: 320 },
];

const DEFAULT_QUERY: Point2D = { id: 'query', x: 360, y: 200 };

// -- Helpers ----------------------------------------------------------------

function dist(a: Point2D, b: Point2D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Build a simple 2-layer HNSW graph. Layer 1 has ~1/3 of nodes, layer 0 has all. */
function buildLayers(points: Point2D[]): { layer0: Map<string, string[]>; layer1: Map<string, string[]>; layer1Nodes: Set<string> } {
  // Layer 1 (top): every 3rd point — sparse "express lane"
  const layer1Nodes = new Set<string>();
  for (let i = 0; i < points.length; i += 3) {
    layer1Nodes.add(points[i].id);
  }

  // Build adjacency: connect each node to its K nearest neighbors in the layer
  function buildAdjacency(pts: Point2D[], maxNeighbors: number): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    for (const p of pts) {
      const others = pts
        .filter((o) => o.id !== p.id)
        .sort((a, b) => dist(p, a) - dist(p, b))
        .slice(0, maxNeighbors);
      adj.set(p.id, others.map((o) => o.id));
    }
    return adj;
  }

  const layer1Points = points.filter((p) => layer1Nodes.has(p.id));
  const layer1 = buildAdjacency(layer1Points, 2); // sparse connections
  const layer0 = buildAdjacency(points, 4); // denser connections

  return { layer0, layer1, layer1Nodes };
}

// -- Main algorithm ---------------------------------------------------------

export function hnsw(
  points: Point2D[] = DEFAULT_POINTS,
  query: Point2D = DEFAULT_QUERY,
): AlgorithmResult {
  const steps: AnimationStep[] = [];
  let stepId = 0;
  let reads = 0;
  let comparisons = 0;

  function record(
    description: string,
    pseudocodeLine: number,
    mutations: VisualMutation[],
    duration = 600,
  ): void {
    steps.push({
      id: stepId++,
      description,
      pseudocodeLine,
      mutations,
      complexity: { comparisons, swaps: 0, reads, writes: 0 },
      duration,
    });
  }

  const { layer0, layer1, layer1Nodes } = buildLayers(points);
  const pointMap = new Map(points.map((p) => [p.id, p]));

  // --- Step 0: Introduction ---
  record(
    `HNSW Search: find the closest point to query (${query.x}, ${query.y}). ` +
      `We built a 2-layer graph: Layer 1 (top) has ${layer1Nodes.size} express nodes, Layer 0 (bottom) has all ${points.length} nodes.`,
    0,
    [],
    800,
  );

  // --- Highlight layer 1 nodes ---
  const layer1Mutations: VisualMutation[] = points
    .filter((p) => layer1Nodes.has(p.id))
    .map((p) => ({
      targetId: p.id,
      property: 'highlight' as const,
      from: 'default' as const,
      to: 'pivot' as const,
      easing: 'spring' as const,
    }));

  record(
    `Layer 1 (express lane) nodes: ${[...layer1Nodes].join(', ')}. These are the sparse set we search first — like highway exits before local streets.`,
    2,
    layer1Mutations,
    700,
  );

  // --- Layer 1 greedy search ---
  const layer1Array = [...layer1Nodes];
  let current = layer1Array[0]; // entry point = first layer 1 node
  let currentPoint = pointMap.get(current)!;
  let currentDist = dist(currentPoint, query);

  record(
    `Start at entry point ${current} on Layer 1. Distance to query: ${currentDist.toFixed(1)}`,
    1,
    [
      {
        targetId: current,
        property: 'highlight',
        from: 'pivot',
        to: 'current',
        easing: 'spring',
      },
    ],
    600,
  );

  let improved = true;
  while (improved) {
    improved = false;
    const neighbors = layer1.get(current) || [];
    reads += neighbors.length;

    for (const neighborId of neighbors) {
      const neighborPoint = pointMap.get(neighborId)!;
      const neighborDist = dist(neighborPoint, query);
      comparisons++;

      record(
        `Layer 1: Check neighbor ${neighborId} — distance ${neighborDist.toFixed(1)} vs current ${currentDist.toFixed(1)}`,
        5,
        [
          {
            targetId: neighborId,
            property: 'highlight',
            from: layer1Nodes.has(neighborId) ? 'pivot' : 'default',
            to: 'processing',
            easing: 'ease-out',
          },
        ],
        500,
      );

      if (neighborDist < currentDist) {
        // Mark old current as visited
        record(
          `Layer 1: ${neighborId} is closer (${neighborDist.toFixed(1)} < ${currentDist.toFixed(1)}). Move to ${neighborId}.`,
          6,
          [
            {
              targetId: current,
              property: 'highlight',
              from: 'current',
              to: 'hull',
              easing: 'ease-out',
            },
            {
              targetId: neighborId,
              property: 'highlight',
              from: 'processing',
              to: 'current',
              easing: 'spring',
            },
          ],
          600,
        );

        current = neighborId;
        currentPoint = neighborPoint;
        currentDist = neighborDist;
        improved = true;
        break; // restart neighbor scan from new position
      } else {
        // Not closer — mark as checked
        record(
          `Layer 1: ${neighborId} not closer (${neighborDist.toFixed(1)} >= ${currentDist.toFixed(1)}). Skip.`,
          5,
          [
            {
              targetId: neighborId,
              property: 'highlight',
              from: 'processing',
              to: layer1Nodes.has(neighborId) ? 'pivot' : 'default',
              easing: 'ease-out',
            },
          ],
          400,
        );
      }
    }
  }

  // --- Drop to layer 0 ---
  record(
    `Layer 1 converged at ${current} (dist ${currentDist.toFixed(1)}). Drop to Layer 0 for fine-grained search among all ${points.length} nodes.`,
    7,
    [
      {
        targetId: current,
        property: 'highlight',
        from: 'current',
        to: 'current',
        easing: 'spring',
      },
    ],
    700,
  );

  // Reset layer 1 highlights
  const resetLayer1: VisualMutation[] = points
    .filter((p) => layer1Nodes.has(p.id) && p.id !== current)
    .map((p) => ({
      targetId: p.id,
      property: 'highlight' as const,
      from: 'pivot' as const,
      to: 'default' as const,
      easing: 'ease-out' as const,
    }));

  if (resetLayer1.length > 0) {
    record(
      'Transitioning to Layer 0 — all nodes now visible.',
      7,
      resetLayer1,
      400,
    );
  }

  // --- Layer 0 greedy search ---
  improved = true;
  while (improved) {
    improved = false;
    const neighbors = layer0.get(current) || [];
    reads += neighbors.length;

    for (const neighborId of neighbors) {
      const neighborPoint = pointMap.get(neighborId)!;
      const neighborDist = dist(neighborPoint, query);
      comparisons++;

      record(
        `Layer 0: Check neighbor ${neighborId} — distance ${neighborDist.toFixed(1)} vs current ${currentDist.toFixed(1)}`,
        8,
        [
          {
            targetId: neighborId,
            property: 'highlight',
            from: 'default',
            to: 'processing',
            easing: 'ease-out',
          },
        ],
        450,
      );

      if (neighborDist < currentDist) {
        record(
          `Layer 0: ${neighborId} is closer (${neighborDist.toFixed(1)} < ${currentDist.toFixed(1)}). Move!`,
          8,
          [
            {
              targetId: current,
              property: 'highlight',
              from: 'current',
              to: 'hull',
              easing: 'ease-out',
            },
            {
              targetId: neighborId,
              property: 'highlight',
              from: 'processing',
              to: 'current',
              easing: 'spring',
            },
          ],
          550,
        );

        current = neighborId;
        currentPoint = neighborPoint;
        currentDist = neighborDist;
        improved = true;
        break;
      } else {
        record(
          `Layer 0: ${neighborId} not closer. Skip.`,
          8,
          [
            {
              targetId: neighborId,
              property: 'highlight',
              from: 'processing',
              to: 'default',
              easing: 'ease-out',
            },
          ],
          350,
        );
      }
    }
  }

  // --- Final result ---
  const trueBest = points.reduce((best, p) =>
    dist(p, query) < dist(best, query) ? p : best,
  );
  const trueMin = dist(trueBest, query);
  const isExact = current === trueBest.id;

  record(
    `HNSW found: ${current} at distance ${currentDist.toFixed(1)}. ` +
      (isExact
        ? `This IS the true nearest neighbor (exact match).`
        : `True nearest: ${trueBest.id} at ${trueMin.toFixed(1)} — HNSW is approximate, but searched only ${comparisons} pairs vs ${(points.length * (points.length - 1)) / 2} brute-force.`),
    9,
    [
      {
        targetId: current,
        property: 'highlight',
        from: 'current',
        to: 'closest',
        easing: 'spring',
      },
    ],
    800,
  );

  // Final visual state as flat numbers for AlgorithmResult compatibility
  const finalState = points.flatMap((p) => [p.x, p.y]);

  return { config: HNSW_CONFIG, steps, finalState };
}
