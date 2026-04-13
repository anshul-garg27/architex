// -----------------------------------------------------------------
// Architex -- Pre-built Sample Graphs for Demos
// -----------------------------------------------------------------

import type { Graph } from './types';

/**
 * Simple undirected graph: 6 nodes, 8 edges.
 * Good for BFS and DFS demos.
 *
 *     A ---3--- B ---2--- C
 *     |         |         |
 *     4         1         5
 *     |         |         |
 *     D ---2--- E ---3--- F
 */
export const SIMPLE_UNDIRECTED: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 100, y: 80 },
    { id: 'B', label: 'B', x: 300, y: 80 },
    { id: 'C', label: 'C', x: 500, y: 80 },
    { id: 'D', label: 'D', x: 100, y: 280 },
    { id: 'E', label: 'E', x: 300, y: 280 },
    { id: 'F', label: 'F', x: 500, y: 280 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 3, directed: false },
    { source: 'B', target: 'C', weight: 2, directed: false },
    { source: 'A', target: 'D', weight: 4, directed: false },
    { source: 'B', target: 'E', weight: 1, directed: false },
    { source: 'C', target: 'F', weight: 5, directed: false },
    { source: 'D', target: 'E', weight: 2, directed: false },
    { source: 'E', target: 'F', weight: 3, directed: false },
    { source: 'A', target: 'E', weight: 6, directed: false },
  ],
};

/**
 * Weighted directed graph: 7 nodes, 10 edges.
 * Good for Dijkstra demos.
 *
 *     S --4--> A --2--> B
 *     |        |  \     |
 *     2        1   3    6
 *     v        v    \   v
 *     C --5--> D --1-> E
 *              |
 *              3
 *              v
 *              T
 */
export const WEIGHTED_DIRECTED: Graph = {
  nodes: [
    { id: 'S', label: 'S', x: 80, y: 80 },
    { id: 'A', label: 'A', x: 280, y: 80 },
    { id: 'B', label: 'B', x: 480, y: 80 },
    { id: 'C', label: 'C', x: 80, y: 280 },
    { id: 'D', label: 'D', x: 280, y: 280 },
    { id: 'E', label: 'E', x: 480, y: 280 },
    { id: 'T', label: 'T', x: 280, y: 440 },
  ],
  edges: [
    { source: 'S', target: 'A', weight: 4, directed: true },
    { source: 'S', target: 'C', weight: 2, directed: true },
    { source: 'A', target: 'B', weight: 2, directed: true },
    { source: 'A', target: 'D', weight: 1, directed: true },
    { source: 'A', target: 'E', weight: 3, directed: true },
    { source: 'B', target: 'E', weight: 6, directed: true },
    { source: 'C', target: 'D', weight: 5, directed: true },
    { source: 'D', target: 'E', weight: 1, directed: true },
    { source: 'D', target: 'T', weight: 3, directed: true },
    { source: 'E', target: 'T', weight: 2, directed: true },
  ],
};

/**
 * DAG (Directed Acyclic Graph): 8 nodes, 10 edges.
 * Good for topological sort demos.
 *
 *    CS101 --> CS201 --> CS301
 *      |         |         |
 *      v         v         v
 *   MATH101 -> MATH201   CS401
 *      |                   ^
 *      v                   |
 *   MATH301 -----------> CS350
 *                          ^
 *                          |
 *                       CS202 (from CS201)
 */
export const DAG: Graph = {
  nodes: [
    { id: 'CS101', label: 'CS101', x: 80, y: 60 },
    { id: 'CS201', label: 'CS201', x: 280, y: 60 },
    { id: 'CS301', label: 'CS301', x: 480, y: 60 },
    { id: 'MATH101', label: 'MATH101', x: 80, y: 220 },
    { id: 'MATH201', label: 'MATH201', x: 280, y: 220 },
    { id: 'CS401', label: 'CS401', x: 480, y: 220 },
    { id: 'MATH301', label: 'MATH301', x: 80, y: 380 },
    { id: 'CS350', label: 'CS350', x: 380, y: 380 },
  ],
  edges: [
    { source: 'CS101', target: 'CS201', weight: 1, directed: true },
    { source: 'CS201', target: 'CS301', weight: 1, directed: true },
    { source: 'CS101', target: 'MATH101', weight: 1, directed: true },
    { source: 'CS201', target: 'MATH201', weight: 1, directed: true },
    { source: 'CS301', target: 'CS401', weight: 1, directed: true },
    { source: 'MATH101', target: 'MATH201', weight: 1, directed: true },
    { source: 'MATH101', target: 'MATH301', weight: 1, directed: true },
    { source: 'MATH301', target: 'CS350', weight: 1, directed: true },
    { source: 'CS201', target: 'CS350', weight: 1, directed: true },
    { source: 'CS350', target: 'CS401', weight: 1, directed: true },
  ],
};

/**
 * Connected components: 10 nodes, 3 separate components.
 * Good for testing BFS/DFS on disconnected graphs.
 *
 * Component 1:  A - B - C - D
 * Component 2:  E - F - G
 * Component 3:  H - I - J
 */
export const CONNECTED_COMPONENTS: Graph = {
  nodes: [
    // Component 1
    { id: 'A', label: 'A', x: 60, y: 80 },
    { id: 'B', label: 'B', x: 180, y: 80 },
    { id: 'C', label: 'C', x: 300, y: 80 },
    { id: 'D', label: 'D', x: 420, y: 80 },
    // Component 2
    { id: 'E', label: 'E', x: 100, y: 220 },
    { id: 'F', label: 'F', x: 240, y: 220 },
    { id: 'G', label: 'G', x: 380, y: 220 },
    // Component 3
    { id: 'H', label: 'H', x: 100, y: 360 },
    { id: 'I', label: 'I', x: 240, y: 360 },
    { id: 'J', label: 'J', x: 380, y: 360 },
  ],
  edges: [
    // Component 1
    { source: 'A', target: 'B', weight: 1, directed: false },
    { source: 'B', target: 'C', weight: 2, directed: false },
    { source: 'C', target: 'D', weight: 3, directed: false },
    { source: 'A', target: 'C', weight: 4, directed: false },
    // Component 2
    { source: 'E', target: 'F', weight: 2, directed: false },
    { source: 'F', target: 'G', weight: 1, directed: false },
    { source: 'E', target: 'G', weight: 3, directed: false },
    // Component 3
    { source: 'H', target: 'I', weight: 5, directed: false },
    { source: 'I', target: 'J', weight: 2, directed: false },
  ],
};

/**
 * A* demo graph: grid-like layout with meaningful (x, y) positions.
 * The Euclidean heuristic can guide search from S (top-left) to G (bottom-right).
 *
 *     S --4-- A --3-- B
 *     |       |       |
 *     3       2       5
 *     |       |       |
 *     C --6-- D --2-- E
 *     |       |       |
 *     4       3       1
 *     |       |       |
 *     F --5-- H --2-- G
 */
export const A_STAR_GRID: Graph = {
  nodes: [
    { id: 'S', label: 'S', x: 80, y: 60 },
    { id: 'A', label: 'A', x: 280, y: 60 },
    { id: 'B', label: 'B', x: 480, y: 60 },
    { id: 'C', label: 'C', x: 80, y: 220 },
    { id: 'D', label: 'D', x: 280, y: 220 },
    { id: 'E', label: 'E', x: 480, y: 220 },
    { id: 'F', label: 'F', x: 80, y: 380 },
    { id: 'H', label: 'H', x: 280, y: 380 },
    { id: 'G', label: 'G', x: 480, y: 380 },
  ],
  edges: [
    { source: 'S', target: 'A', weight: 4, directed: false },
    { source: 'A', target: 'B', weight: 3, directed: false },
    { source: 'S', target: 'C', weight: 3, directed: false },
    { source: 'A', target: 'D', weight: 2, directed: false },
    { source: 'B', target: 'E', weight: 5, directed: false },
    { source: 'C', target: 'D', weight: 6, directed: false },
    { source: 'D', target: 'E', weight: 2, directed: false },
    { source: 'C', target: 'F', weight: 4, directed: false },
    { source: 'D', target: 'H', weight: 3, directed: false },
    { source: 'E', target: 'G', weight: 1, directed: false },
    { source: 'F', target: 'H', weight: 5, directed: false },
    { source: 'H', target: 'G', weight: 2, directed: false },
  ],
};

/**
 * Directed graph with 3 clear strongly connected components for Tarjan's SCC.
 *
 * SCC 1: {A, B, C}   (cycle A->B->C->A)
 * SCC 2: {D, E, F}   (cycle D->E->F->D)
 * SCC 3: {G, H}      (cycle G->H->G)
 * Bridge edges: C->D, F->G
 */
export const SCC_DIRECTED: Graph = {
  nodes: [
    // SCC 1
    { id: 'A', label: 'A', x: 80, y: 80 },
    { id: 'B', label: 'B', x: 200, y: 40 },
    { id: 'C', label: 'C', x: 200, y: 140 },
    // SCC 2
    { id: 'D', label: 'D', x: 360, y: 80 },
    { id: 'E', label: 'E', x: 480, y: 40 },
    { id: 'F', label: 'F', x: 480, y: 140 },
    // SCC 3
    { id: 'G', label: 'G', x: 600, y: 60 },
    { id: 'H', label: 'H', x: 600, y: 140 },
  ],
  edges: [
    // SCC 1 cycle
    { source: 'A', target: 'B', weight: 1, directed: true },
    { source: 'B', target: 'C', weight: 1, directed: true },
    { source: 'C', target: 'A', weight: 1, directed: true },
    // SCC 2 cycle
    { source: 'D', target: 'E', weight: 1, directed: true },
    { source: 'E', target: 'F', weight: 1, directed: true },
    { source: 'F', target: 'D', weight: 1, directed: true },
    // SCC 3 cycle
    { source: 'G', target: 'H', weight: 1, directed: true },
    { source: 'H', target: 'G', weight: 1, directed: true },
    // Bridge edges (one-way, so they don't merge SCCs)
    { source: 'C', target: 'D', weight: 1, directed: true },
    { source: 'F', target: 'G', weight: 1, directed: true },
  ],
};

/**
 * Bipartite graph: 6 nodes, 2 partitions.
 * Partition 1: {A, C, E}  Partition 2: {B, D, F}
 * All edges go between partitions -- valid 2-coloring exists.
 *
 *     A ------- B
 *     |  \      |
 *     |   \     |
 *     C ------- D
 *     |   /     |
 *     |  /      |
 *     E ------- F
 */
export const BIPARTITE_GRAPH: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 120, y: 60 },
    { id: 'B', label: 'B', x: 400, y: 60 },
    { id: 'C', label: 'C', x: 120, y: 200 },
    { id: 'D', label: 'D', x: 400, y: 200 },
    { id: 'E', label: 'E', x: 120, y: 340 },
    { id: 'F', label: 'F', x: 400, y: 340 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 1, directed: false },
    { source: 'A', target: 'D', weight: 1, directed: false },
    { source: 'C', target: 'B', weight: 1, directed: false },
    { source: 'C', target: 'D', weight: 1, directed: false },
    { source: 'E', target: 'D', weight: 1, directed: false },
    { source: 'E', target: 'F', weight: 1, directed: false },
    { source: 'C', target: 'F', weight: 1, directed: false },
  ],
};

/**
 * Directed graph with a cycle for cycle detection demo.
 *
 *     A --> B --> C
 *     ^         |
 *     |         v
 *     F <-- E <-- D
 *
 * Cycle: A -> B -> C -> D -> E -> F -> A
 */
export const CYCLE_DIRECTED: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 80, y: 80 },
    { id: 'B', label: 'B', x: 280, y: 80 },
    { id: 'C', label: 'C', x: 480, y: 80 },
    { id: 'D', label: 'D', x: 480, y: 260 },
    { id: 'E', label: 'E', x: 280, y: 260 },
    { id: 'F', label: 'F', x: 80, y: 260 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 1, directed: true },
    { source: 'B', target: 'C', weight: 1, directed: true },
    { source: 'C', target: 'D', weight: 1, directed: true },
    { source: 'D', target: 'E', weight: 1, directed: true },
    { source: 'E', target: 'F', weight: 1, directed: true },
    { source: 'F', target: 'A', weight: 1, directed: true },
  ],
};

/**
 * Undirected graph with an Euler circuit.
 * Every node has even degree, so an Euler circuit exists.
 *
 *       A
 *      / \
 *     B---C
 *     |   |
 *     D---E
 *      \ /
 *       F
 *
 * Degrees: A=2, B=3... wait, let's make them all even:
 *
 *     A -- B
 *     |    |
 *     D -- C
 *     |    |
 *     E -- F
 *     \   /
 *      \ /
 *       connects back: A--D, D--E, E--F, F--C, C--B, B--A, A--E (no)
 *
 * Simpler: a rectangular graph where every node has degree 2 = a simple cycle.
 *
 *     A -- B -- C
 *     |         |
 *     F -- E -- D
 */
export const EULER_GRAPH: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 80, y: 80 },
    { id: 'B', label: 'B', x: 280, y: 80 },
    { id: 'C', label: 'C', x: 480, y: 80 },
    { id: 'D', label: 'D', x: 480, y: 260 },
    { id: 'E', label: 'E', x: 280, y: 260 },
    { id: 'F', label: 'F', x: 80, y: 260 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 1, directed: false },
    { source: 'B', target: 'C', weight: 1, directed: false },
    { source: 'C', target: 'D', weight: 1, directed: false },
    { source: 'D', target: 'E', weight: 1, directed: false },
    { source: 'E', target: 'F', weight: 1, directed: false },
    { source: 'F', target: 'A', weight: 1, directed: false },
    { source: 'B', target: 'E', weight: 1, directed: false },
    { source: 'A', target: 'D', weight: 1, directed: false },
  ],
};

/**
 * Flow network for Ford-Fulkerson (Edmonds-Karp) max flow demo.
 * Source = S, Sink = T, 6 intermediate nodes with directed capacity edges.
 *
 *           A --8--> C --10--> T
 *          ^|        ^       ^
 *        10 |  6     | 2    / 10
 *        /  v   \    |    /
 *     S ---> B -9-> D --/
 *        \        ^
 *         5      7
 *          \    /
 *           v  /
 *            E --4--> F --6--> T
 *
 * Edges:
 *   S->A(10), S->B(5), S->E(5)
 *   A->C(8), A->B(6)
 *   B->D(9)
 *   C->T(10)
 *   D->C(2), D->T(10)
 *   E->D(7), E->F(4)
 *   F->T(6)
 *
 * Max flow = 19
 */
export const FLOW_NETWORK: Graph = {
  nodes: [
    { id: 'S', label: 'S', x: 60, y: 200 },
    { id: 'A', label: 'A', x: 220, y: 80 },
    { id: 'B', label: 'B', x: 220, y: 200 },
    { id: 'C', label: 'C', x: 400, y: 80 },
    { id: 'D', label: 'D', x: 400, y: 200 },
    { id: 'E', label: 'E', x: 220, y: 340 },
    { id: 'F', label: 'F', x: 400, y: 340 },
    { id: 'T', label: 'T', x: 560, y: 200 },
  ],
  edges: [
    { source: 'S', target: 'A', weight: 10, directed: true },
    { source: 'S', target: 'B', weight: 5, directed: true },
    { source: 'S', target: 'E', weight: 5, directed: true },
    { source: 'A', target: 'C', weight: 8, directed: true },
    { source: 'A', target: 'B', weight: 6, directed: true },
    { source: 'B', target: 'D', weight: 9, directed: true },
    { source: 'C', target: 'T', weight: 10, directed: true },
    { source: 'D', target: 'C', weight: 2, directed: true },
    { source: 'D', target: 'T', weight: 10, directed: true },
    { source: 'E', target: 'D', weight: 7, directed: true },
    { source: 'E', target: 'F', weight: 4, directed: true },
    { source: 'F', target: 'T', weight: 6, directed: true },
  ],
};

/**
 * Undirected graph with clear articulation points and bridges.
 *
 *       A --- B --- C
 *       |     |
 *       D --- E --- F --- G
 *                   |     |
 *                   H --- I
 *
 * Articulation points: B (connects A-B-C cluster to rest),
 *   E (connects D to F-side), F (connects E to G-H-I cycle)
 * Bridges: A-B, B-C, B-E, E-F
 * Non-bridges: A-D, D-E (cycle A-B-E-D-A), F-G, G-I, I-H, H-F (cycle F-G-I-H-F)
 */
export const ARTICULATION_BRIDGE_GRAPH: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 80, y: 80 },
    { id: 'B', label: 'B', x: 240, y: 80 },
    { id: 'C', label: 'C', x: 400, y: 80 },
    { id: 'D', label: 'D', x: 80, y: 240 },
    { id: 'E', label: 'E', x: 240, y: 240 },
    { id: 'F', label: 'F', x: 400, y: 240 },
    { id: 'G', label: 'G', x: 540, y: 240 },
    { id: 'H', label: 'H', x: 400, y: 380 },
    { id: 'I', label: 'I', x: 540, y: 380 },
  ],
  edges: [
    // Cycle: A-B-E-D-A
    { source: 'A', target: 'B', weight: 1, directed: false },
    { source: 'A', target: 'D', weight: 1, directed: false },
    { source: 'D', target: 'E', weight: 1, directed: false },
    { source: 'B', target: 'E', weight: 1, directed: false },
    // Bridge: B-C (leaf)
    { source: 'B', target: 'C', weight: 1, directed: false },
    // Bridge: E-F
    { source: 'E', target: 'F', weight: 1, directed: false },
    // Cycle: F-G-I-H-F
    { source: 'F', target: 'G', weight: 1, directed: false },
    { source: 'G', target: 'I', weight: 1, directed: false },
    { source: 'I', target: 'H', weight: 1, directed: false },
    { source: 'H', target: 'F', weight: 1, directed: false },
  ],
};

/** Map from algorithm ID to its recommended sample graph and start node. */
export const SAMPLE_GRAPH_FOR_ALGORITHM: Record<
  string,
  { graph: Graph; startNodeId: string; label: string }
> = {
  bfs: { graph: SIMPLE_UNDIRECTED, startNodeId: 'A', label: 'Simple Undirected (6 nodes)' },
  dfs: { graph: SIMPLE_UNDIRECTED, startNodeId: 'A', label: 'Simple Undirected (6 nodes)' },
  'dfs-iterative': { graph: SIMPLE_UNDIRECTED, startNodeId: 'A', label: 'Simple Undirected (6 nodes)' },
  dijkstra: { graph: WEIGHTED_DIRECTED, startNodeId: 'S', label: 'Weighted Directed (7 nodes)' },
  kruskal: { graph: SIMPLE_UNDIRECTED, startNodeId: 'A', label: 'Simple Undirected (6 nodes)' },
  'topological-sort': { graph: DAG, startNodeId: 'CS101', label: 'DAG - Course Prerequisites (8 nodes)' },
  'bellman-ford': { graph: WEIGHTED_DIRECTED, startNodeId: 'S', label: 'Weighted Directed (7 nodes)' },
  'a-star': { graph: A_STAR_GRID, startNodeId: 'S', label: 'Grid Graph for A* (9 nodes)' },
  'tarjan-scc': { graph: SCC_DIRECTED, startNodeId: 'A', label: 'Directed Graph with 3 SCCs (8 nodes)' },
  prims: { graph: SIMPLE_UNDIRECTED, startNodeId: 'A', label: 'Simple Undirected (6 nodes)' },
  'floyd-warshall': { graph: WEIGHTED_DIRECTED, startNodeId: 'S', label: 'Weighted Directed (7 nodes)' },
  bipartite: { graph: BIPARTITE_GRAPH, startNodeId: 'A', label: 'Bipartite Graph (6 nodes)' },
  'cycle-detection': { graph: CYCLE_DIRECTED, startNodeId: 'A', label: 'Directed Cycle (6 nodes)' },
  'euler-path': { graph: EULER_GRAPH, startNodeId: 'A', label: 'Euler Circuit Graph (6 nodes)' },
  'ford-fulkerson': { graph: FLOW_NETWORK, startNodeId: 'S', label: 'Flow Network (8 nodes)' },
  'articulation-points': { graph: ARTICULATION_BRIDGE_GRAPH, startNodeId: 'A', label: 'Articulation & Bridge Graph (9 nodes)' },
  bridges: { graph: ARTICULATION_BRIDGE_GRAPH, startNodeId: 'A', label: 'Articulation & Bridge Graph (9 nodes)' },
};
