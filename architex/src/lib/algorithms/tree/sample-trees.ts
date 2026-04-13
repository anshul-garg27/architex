// -----------------------------------------------------------------
// Architex -- Pre-built Sample Trees for Demos
// -----------------------------------------------------------------

import type { TreeNode } from './types';

/** Helper to create a tree node with a unique string id. */
function n(
  value: number,
  left: TreeNode | null = null,
  right: TreeNode | null = null,
): TreeNode {
  return { id: `n${value}`, value, left, right };
}

/**
 * Balanced BST (7 nodes):
 *
 *         8
 *        / \
 *       4   12
 *      / \  / \
 *     2  6 10 14
 */
export const BALANCED_BST: TreeNode = n(
  8,
  n(4, n(2), n(6)),
  n(12, n(10), n(14)),
);

/**
 * Unbalanced BST (7 nodes, right-heavy):
 *
 *     3
 *      \
 *       5
 *      / \
 *     4   10
 *         / \
 *        7  15
 *          /
 *         12
 */
export const UNBALANCED_BST: TreeNode = n(
  3,
  null,
  n(5, n(4), n(10, n(7), n(15, n(12), null))),
);

/** Array for heap demo. */
export const HEAP_DEMO_ARRAY: number[] = [4, 10, 3, 5, 1, 8, 7, 2, 6, 9];

/**
 * Map from tree algorithm ID to its recommended sample data.
 *
 * For BST/AVL algorithms, `tree` is provided.
 * For heap algorithms, `array` is provided.
 * For traversals, `tree` is provided.
 */
export const SAMPLE_TREE_FOR_ALGORITHM: Record<
  string,
  { tree?: TreeNode; array?: number[]; label: string }
> = {
  'bst-operations': {
    tree: BALANCED_BST,
    label: 'Balanced BST (7 nodes)',
  },
  'avl-tree': {
    tree: BALANCED_BST,
    label: 'Balanced BST (7 nodes)',
  },
  'tree-traversals': {
    tree: BALANCED_BST,
    label: 'Balanced BST (7 nodes)',
  },
  'heap-operations': {
    array: HEAP_DEMO_ARRAY,
    label: 'Heap demo array [4,10,3,5,1,8,7,2,6,9]',
  },
};
