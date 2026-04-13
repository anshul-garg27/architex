// -----------------------------------------------------------------
// Architex -- Simple Reingold-Tilford-style Tree Layout
// -----------------------------------------------------------------

import type { TreeNode } from './types';

/** Minimum horizontal separation between sibling subtrees. */
const H_SEP = 50;

/**
 * Assign (x, y) coordinates to every node in the tree so it can
 * be rendered without overlaps.
 *
 * Uses a simplified Reingold-Tilford approach:
 *  1. Post-order traverse to assign preliminary x offsets.
 *  2. Centre the tree within the given width/height.
 */
export function layoutTree(
  root: TreeNode | null,
  width: number,
  height: number,
): void {
  if (!root) return;

  const depth = treeDepth(root);
  if (depth === 0) return;

  const vGap = Math.min(80, (height - 60) / depth);

  // Phase 1 -- assign preliminary x using in-order index
  let index = 0;
  function inorder(node: TreeNode | null): void {
    if (!node) return;
    inorder(node.left);
    node.x = index * H_SEP;
    node.y = nodeDepth(root!, node) * vGap + 40;
    index++;
    inorder(node.right);
  }
  inorder(root);

  // Phase 2 -- centre horizontally
  let minX = Infinity;
  let maxX = -Infinity;
  function findBounds(node: TreeNode | null): void {
    if (!node) return;
    if (node.x! < minX) minX = node.x!;
    if (node.x! > maxX) maxX = node.x!;
    findBounds(node.left);
    findBounds(node.right);
  }
  findBounds(root);

  const treeWidth = maxX - minX;
  const offsetX = (width - treeWidth) / 2 - minX;

  function applyOffset(node: TreeNode | null): void {
    if (!node) return;
    node.x = node.x! + offsetX;
    applyOffset(node.left);
    applyOffset(node.right);
  }
  applyOffset(root);
}

/** Returns the depth (number of levels) of the tree. */
function treeDepth(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

/** Returns the depth of `target` within `root` (0-indexed). */
function nodeDepth(root: TreeNode, target: TreeNode): number {
  function dfs(node: TreeNode | null, d: number): number {
    if (!node) return -1;
    if (node.id === target.id) return d;
    const left = dfs(node.left, d + 1);
    if (left >= 0) return left;
    return dfs(node.right, d + 1);
  }
  return dfs(root, 0);
}

/** Collect all nodes in the tree into a flat array. */
export function collectNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  return [root, ...collectNodes(root.left), ...collectNodes(root.right)];
}
