/**
 * Graph Algorithm Animation Choreography
 * ══════════════════════════════════════════════════════════════════
 *
 * Gives each graph algorithm its own animation personality.
 * BFS ripples outward like water; DFS dives deep with quick flashes;
 * Dijkstra is methodical and careful; Kruskal snaps edges into place.
 *
 * Pure configuration module -- no side effects, no component imports.
 *
 * Usage:
 *   import { getGraphChoreography } from '@/lib/algorithms/graph-choreography';
 *
 *   const choreo = getGraphChoreography('bfs');
 *   // choreo.waveBehavior -> 'ripple'
 *   // choreo.nodeTransition -> smooth, even spring
 */

import { springs } from '@/lib/constants/motion';

// ─── Types ──────────────────────────────────────────────────────

export interface GraphChoreography {
  /** Spring for node state transitions. */
  nodeTransition: { type: 'spring'; stiffness: number; damping: number; mass: number };
  /** How the "frontier" or "visited" wave spreads. */
  waveBehavior: 'ripple' | 'flash' | 'pulse';
  /** Edge animation speed multiplier. */
  edgeSpeed: number;
  /** Whether to dim unvisited nodes during traversal. */
  dimUnvisited: boolean;
  /** Glow intensity on active/frontier nodes (0-1). */
  activeGlow: number;
}

// ─── Per-Algorithm Overrides ────────────────────────────────────

const GRAPH_CHOREOGRAPHY: Record<string, Partial<GraphChoreography>> = {
  /**
   * BFS -- Water rippling outward.
   * Smooth, even spread. Moderate stiffness and standard mass for
   * that wavefront-expanding feel. Dim unvisited nodes to emphasize
   * the frontier.
   */
  'bfs': {
    nodeTransition: { type: 'spring', stiffness: 180, damping: 24, mass: 1.0 },
    waveBehavior: 'ripple',
    edgeSpeed: 1.0,
    dimUnvisited: true,
    activeGlow: 0.4,
  },

  /**
   * DFS -- Deep dive, quick and decisive.
   * High stiffness + low mass = fast, snappy transitions. Flash
   * behavior for that sharp "I found it" moment at each node.
   */
  'dfs': {
    nodeTransition: { type: 'spring', stiffness: 350, damping: 28, mass: 0.7 },
    waveBehavior: 'flash',
    edgeSpeed: 1.3,
    dimUnvisited: true,
    activeGlow: 0.5,
  },

  /**
   * DFS (Iterative) -- Same personality as recursive DFS.
   */
  'dfs-iterative': {
    nodeTransition: { type: 'spring', stiffness: 350, damping: 28, mass: 0.7 },
    waveBehavior: 'flash',
    edgeSpeed: 1.3,
    dimUnvisited: true,
    activeGlow: 0.5,
  },

  /**
   * Dijkstra -- Careful, methodical exploration.
   * Lower stiffness + higher mass = gentle, deliberate movement.
   * Strong glow on the active node to show "I'm computing the
   * shortest path."
   */
  'dijkstra': {
    nodeTransition: { type: 'spring', stiffness: 150, damping: 22, mass: 1.2 },
    waveBehavior: 'ripple',
    edgeSpeed: 0.8,
    dimUnvisited: true,
    activeGlow: 0.6,
  },

  /**
   * Kruskal -- Collecting edges, snappy selection.
   * Higher stiffness for that crisp "edge selected" snap.
   * No dimming because all nodes are relevant from the start.
   */
  'kruskal': {
    nodeTransition: { type: 'spring', stiffness: 300, damping: 30, mass: 0.8 },
    waveBehavior: 'flash',
    edgeSpeed: 1.2,
    dimUnvisited: false,
    activeGlow: 0.3,
  },

  /**
   * Prim -- Growing a tree from a root.
   * Smooth ripple outward as the MST grows, one edge at a time.
   */
  'prim': {
    nodeTransition: { type: 'spring', stiffness: 200, damping: 25, mass: 1.0 },
    waveBehavior: 'ripple',
    edgeSpeed: 1.0,
    dimUnvisited: true,
    activeGlow: 0.4,
  },

  /**
   * Topological Sort (Kahn's) -- Layered, pulsing removal.
   * Pulse behavior suits the "peel off zero-degree nodes" pattern.
   */
  'topological-sort-kahn': {
    nodeTransition: { type: 'spring', stiffness: 250, damping: 28, mass: 0.9 },
    waveBehavior: 'pulse',
    edgeSpeed: 1.0,
    dimUnvisited: false,
    activeGlow: 0.3,
  },
};

// ─── Defaults ───────────────────────────────────────────────────

const DEFAULT: GraphChoreography = {
  nodeTransition: { ...springs.smooth },
  waveBehavior: 'ripple',
  edgeSpeed: 1.0,
  dimUnvisited: false,
  activeGlow: 0.3,
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get the full graph choreography for a specific algorithm.
 * Returns defaults for any algorithm ID not in the map.
 */
export function getGraphChoreography(algorithmId: string): GraphChoreography {
  const overrides = GRAPH_CHOREOGRAPHY[algorithmId];
  if (!overrides) return { ...DEFAULT };
  return { ...DEFAULT, ...overrides };
}

/** All algorithm IDs that have custom graph choreography defined. */
export const GRAPH_CHOREOGRAPHED_ALGORITHMS = Object.keys(GRAPH_CHOREOGRAPHY);
