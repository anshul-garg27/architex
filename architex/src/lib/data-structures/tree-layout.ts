// -----------------------------------------------------------------
// Architex -- Reingold-Tilford Tree Layout Engine  (DST-003)
// Generic layout for any binary tree. Computes x,y positions with
// minimal width and aesthetic symmetry.
//
// Algorithm:
//   Pass 1 (bottom-up): assign preliminary x-offsets via in-order
//     traversal, handling single-child nodes correctly (don't center
//     over empty space).
//   Pass 2 (top-down): compute viewBox-centered x positions using
//     configurable spacing.
// -----------------------------------------------------------------

import type { AVLNode } from './avl-ds';
import type { RBNode } from './red-black-ds';

// ── Public types ──────────────────────────────────────────────

export interface PositionedNode {
  id: string;
  value: number;
  x: number;
  y: number;
  /** Depth level (0-indexed). */
  depth: number;
  /** Balance factor (for AVL trees). */
  balanceFactor?: number;
  /** Node color (for Red-Black trees). */
  color?: 'red' | 'black';
}

export interface LayoutEdge {
  parentId: string;
  childId: string;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
}

export interface TreeLayoutConfig {
  /** Horizontal gap between adjacent leaf nodes. Default 50. */
  hSpacing: number;
  /** Vertical gap between levels. Default 60. */
  vSpacing: number;
  /** Node circle radius (used by renderers, not layout directly). Default 20. */
  nodeRadius: number;
  /** Top padding before root level. Default 30. */
  topPadding: number;
}

// ── Defaults ──────────────────────────────────────────────────

const DEFAULT_CONFIG: TreeLayoutConfig = {
  hSpacing: 50,
  vSpacing: 60,
  nodeRadius: 20,
  topPadding: 30,
};

// ── Internal intermediate node for the algorithm ─────────────

interface LayoutNode {
  id: string;
  value: number;
  left: LayoutNode | null;
  right: LayoutNode | null;
  depth: number;
  /** Preliminary x assigned during first pass (in-order index). */
  prelim: number;
  /** Final x position after centering. */
  x: number;
  /** Final y position. */
  y: number;
  balanceFactor?: number;
  color?: 'red' | 'black';
}

// ── Generic tree node interface ───────────────────────────────

export interface GenericTreeNode {
  id: string;
  value: number;
  left: GenericTreeNode | null;
  right: GenericTreeNode | null;
  height?: number;
  color?: 'red' | 'black';
}

// ── Build intermediate layout tree from AVL ───────────────────

function buildFromAVL(node: AVLNode | null, depth: number): LayoutNode | null {
  if (!node) return null;
  const lh = node.left ? node.left.height : 0;
  const rh = node.right ? node.right.height : 0;
  return {
    id: node.id,
    value: node.value,
    left: buildFromAVL(node.left, depth + 1),
    right: buildFromAVL(node.right, depth + 1),
    depth,
    prelim: 0,
    x: 0,
    y: 0,
    balanceFactor: lh - rh,
  };
}

function buildFromRB(node: RBNode | null, depth: number): LayoutNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: buildFromRB(node.left, depth + 1),
    right: buildFromRB(node.right, depth + 1),
    depth,
    prelim: 0,
    x: 0,
    y: 0,
    color: node.color,
  };
}

function buildFromGeneric(node: GenericTreeNode | null, depth: number): LayoutNode | null {
  if (!node) return null;
  const lh = node.height !== undefined && node.left && 'height' in node.left
    ? (node.left as GenericTreeNode & { height: number }).height
    : 0;
  const rh = node.height !== undefined && node.right && 'height' in node.right
    ? (node.right as GenericTreeNode & { height: number }).height
    : 0;
  return {
    id: node.id,
    value: node.value,
    left: buildFromGeneric(node.left, depth + 1),
    right: buildFromGeneric(node.right, depth + 1),
    depth,
    prelim: 0,
    x: 0,
    y: 0,
    balanceFactor: node.height !== undefined ? lh - rh : undefined,
    color: node.color,
  };
}

// ── Reingold-Tilford core ─────────────────────────────────────

/**
 * Pass 1: Bottom-up in-order traversal assigns preliminary x positions.
 * Each leaf gets the next available index. Internal nodes are centered
 * over their children. Single-child nodes are offset by half the spacing.
 */
function assignPrelim(node: LayoutNode | null, counter: { value: number }): void {
  if (!node) return;

  assignPrelim(node.left, counter);

  if (!node.left && !node.right) {
    // Leaf: assign current index
    node.prelim = counter.value;
    counter.value += 1;
  } else if (node.left && node.right) {
    // Two children: center between them
    node.prelim = (node.left.prelim + node.right.prelim) / 2;
  } else if (node.left) {
    // Only left child: place parent to the right
    node.prelim = node.left.prelim + 0.5;
    // Bump counter if leaf wasn't placed yet
    if (counter.value <= node.prelim) {
      counter.value = Math.ceil(node.prelim) + 1;
    }
  } else if (node.right) {
    // Only right child: place parent to the left
    node.prelim = node.right.prelim - 0.5;
    if (node.prelim < 0) {
      // Shift everything so nothing is negative
      const shift = -node.prelim;
      shiftPrelim(node, shift);
    }
  }

  assignPrelim(node.right, counter);
}

/** Shift all prelim values in the subtree by delta. */
function shiftPrelim(node: LayoutNode | null, delta: number): void {
  if (!node) return;
  node.prelim += delta;
  shiftPrelim(node.left, delta);
  shiftPrelim(node.right, delta);
}

/**
 * Pass 2: Convert prelim index to final (x, y) coordinates.
 */
function assignFinal(
  node: LayoutNode | null,
  config: TreeLayoutConfig,
): void {
  if (!node) return;
  node.x = node.prelim * config.hSpacing;
  node.y = node.depth * config.vSpacing + config.topPadding;
  assignFinal(node.left, config);
  assignFinal(node.right, config);
}

/** Collect all LayoutNodes into a flat array. */
function collectLayoutNodes(node: LayoutNode | null): LayoutNode[] {
  if (!node) return [];
  return [node, ...collectLayoutNodes(node.left), ...collectLayoutNodes(node.right)];
}

/** Center the entire tree so min x starts at 0. */
function centerTree(nodes: LayoutNode[]): void {
  if (nodes.length === 0) return;
  let minX = Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
  }
  if (minX !== 0) {
    for (const n of nodes) {
      n.x -= minX;
    }
  }
}

// ── Layout using in-order index (simpler, guaranteed no overlaps) ──

function layoutInorder(
  root: LayoutNode,
  config: TreeLayoutConfig,
): LayoutNode[] {
  let index = 0;

  function walk(node: LayoutNode | null): void {
    if (!node) return;
    walk(node.left);
    node.prelim = index;
    node.x = index * config.hSpacing;
    node.y = node.depth * config.vSpacing + config.topPadding;
    index++;
    walk(node.right);
  }

  walk(root);
  const all = collectLayoutNodes(root);
  centerTree(all);
  return all;
}

// ── Public API ────────────────────────────────────────────────

export interface TreeLayoutResult {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
}

/**
 * Layout an AVL tree.
 */
export function layoutAVLTree(
  root: AVLNode | null,
  config?: Partial<TreeLayoutConfig>,
): TreeLayoutResult {
  if (!root) return { nodes: [], edges: [] };
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const layoutRoot = buildFromAVL(root, 0)!;
  const all = layoutInorder(layoutRoot, cfg);
  return buildResult(all);
}

/**
 * Layout a Red-Black tree.
 */
export function layoutRBTree(
  root: RBNode | null,
  config?: Partial<TreeLayoutConfig>,
): TreeLayoutResult {
  if (!root) return { nodes: [], edges: [] };
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const layoutRoot = buildFromRB(root, 0)!;
  const all = layoutInorder(layoutRoot, cfg);
  return buildResult(all);
}

/**
 * Layout any generic binary tree that matches GenericTreeNode.
 */
export function layoutTree(
  root: GenericTreeNode | null,
  config?: Partial<TreeLayoutConfig>,
): TreeLayoutResult {
  if (!root) return { nodes: [], edges: [] };
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const layoutRoot = buildFromGeneric(root, 0)!;
  const all = layoutInorder(layoutRoot, cfg);
  return buildResult(all);
}

/**
 * Convert collected LayoutNodes into the public result format.
 */
function buildResult(all: LayoutNode[]): TreeLayoutResult {
  const nodeMap = new Map<string, LayoutNode>();
  const nodes: PositionedNode[] = [];

  for (const ln of all) {
    nodeMap.set(ln.id, ln);
    nodes.push({
      id: ln.id,
      value: ln.value,
      x: ln.x,
      y: ln.y,
      depth: ln.depth,
      balanceFactor: ln.balanceFactor,
      color: ln.color,
    });
  }

  const edges: LayoutEdge[] = [];
  for (const ln of all) {
    if (ln.left) {
      const child = nodeMap.get(ln.left.id);
      if (child) {
        edges.push({
          parentId: ln.id,
          childId: child.id,
          parentX: ln.x,
          parentY: ln.y,
          childX: child.x,
          childY: child.y,
        });
      }
    }
    if (ln.right) {
      const child = nodeMap.get(ln.right.id);
      if (child) {
        edges.push({
          parentId: ln.id,
          childId: child.id,
          parentX: ln.x,
          parentY: ln.y,
          childX: child.x,
          childY: child.y,
        });
      }
    }
  }

  return { nodes, edges };
}

// ── Re-export the default config for consumers ────────────────

export { DEFAULT_CONFIG as TREE_LAYOUT_DEFAULTS };
