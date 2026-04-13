/**
 * Tree Algorithm Animation Choreography
 * ══════════════════════════════════════════════════════════════════
 *
 * Gives each tree algorithm its own animation personality.
 * BST insert is balanced and smooth; AVL rotations swing like a
 * pendulum; heap sift operations feel heavy and gravitational.
 *
 * Pure configuration module -- no side effects, no component imports.
 *
 * Usage:
 *   import { getTreeChoreography } from '@/lib/algorithms/tree-choreography';
 *
 *   const choreo = getTreeChoreography('avl-tree');
 *   // choreo.rotationSwing -> true
 *   // choreo.nodeTransition -> snappy spring for rotation speed
 */

import { springs } from '@/lib/constants/motion';

// ─── Types ──────────────────────────────────────────────────────

export interface TreeChoreography {
  /** Spring for node state transitions. */
  nodeTransition: { type: 'spring'; stiffness: number; damping: number; mass: number };
  /** Whether rotations should have a "swinging" animation. */
  rotationSwing: boolean;
  /** Scale pulse on inserted nodes: [start, peak, end]. */
  insertPulse: [number, number, number];
  /** Whether sift operations feel "heavy" (for heaps). */
  heavySift: boolean;
}

// ─── Per-Algorithm Overrides ────────────────────────────────────

const TREE_CHOREOGRAPHY: Record<string, Partial<TreeChoreography>> = {
  /**
   * BST Insert -- Balanced, smooth traversal.
   * Standard stiffness with a gentle insert pulse to mark the
   * newly placed node.
   */
  'bst-insert': {
    nodeTransition: { type: 'spring', stiffness: 250, damping: 24, mass: 0.9 },
    insertPulse: [1, 1.15, 1],
  },

  /**
   * AVL Tree -- Precise rotations with swing.
   * Higher stiffness for snappy rebalancing. Swing enabled so
   * rotations look like a pendulum settling into balance.
   */
  'avl-tree': {
    nodeTransition: { type: 'spring', stiffness: 300, damping: 20, mass: 0.8 },
    rotationSwing: true,
    insertPulse: [1, 1.1, 1],
  },

  /**
   * Heap Operations -- Heavy, gravitational sift.
   * High stiffness + standard mass for that "weight falling"
   * feel during sift-up and sift-down. Low damping lets the
   * nodes bounce slightly on landing.
   */
  'heap-operations': {
    nodeTransition: { type: 'spring', stiffness: 350, damping: 18, mass: 1.0 },
    heavySift: true,
    insertPulse: [1, 1.08, 1],
  },

  /**
   * Red-Black Tree -- Recoloring with rotational swing.
   * Moderate spring tuning. Swing enabled because red-black
   * rotations are frequent and should feel alive.
   */
  'red-black-tree': {
    nodeTransition: { type: 'spring', stiffness: 280, damping: 22, mass: 0.9 },
    rotationSwing: true,
    insertPulse: [1, 1.1, 1],
  },
};

// ─── Defaults ───────────────────────────────────────────────────

const DEFAULT: TreeChoreography = {
  nodeTransition: { ...springs.smooth },
  rotationSwing: false,
  insertPulse: [1, 1.05, 1],
  heavySift: false,
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get the full tree choreography for a specific algorithm.
 * Returns defaults for any algorithm ID not in the map.
 */
export function getTreeChoreography(algorithmId: string): TreeChoreography {
  const overrides = TREE_CHOREOGRAPHY[algorithmId];
  if (!overrides) return { ...DEFAULT };
  return { ...DEFAULT, ...overrides };
}

/** All algorithm IDs that have custom tree choreography defined. */
export const TREE_CHOREOGRAPHED_ALGORITHMS = Object.keys(TREE_CHOREOGRAPHY);
