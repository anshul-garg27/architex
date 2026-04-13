import { describe, it, expect } from 'vitest';
import { bstInsert, bstSearch } from '@/lib/algorithms/tree';
import type { TreeNode } from '@/lib/algorithms/tree';

describe('BST operations', () => {
  it('insert creates correct in-order tree from [5, 3, 7, 1, 4]', () => {
    let root: TreeNode | null = null;
    for (const v of [5, 3, 7, 1, 4]) {
      const result = bstInsert(root, v);
      root = rebuildTree(result.finalState);
    }
    expect(root && inorder(root)).toEqual([1, 3, 4, 5, 7]);
  });

  it('search finds an element that was inserted', () => {
    let root: TreeNode | null = null;
    for (const v of [10, 5, 15, 3, 8]) {
      root = rebuildTree(bstInsert(root, v).finalState);
    }
    const result = bstSearch(root, 8);
    const foundStep = result.steps.find((s) => s.description.includes('FOUND'));
    expect(foundStep).toBeDefined();
  });

  it('search reports NOT FOUND for a missing element', () => {
    let root: TreeNode | null = null;
    for (const v of [10, 5, 15]) {
      root = rebuildTree(bstInsert(root, v).finalState);
    }
    const result = bstSearch(root, 99);
    const notFound = result.steps.find((s) => s.description.includes('NOT FOUND'));
    expect(notFound).toBeDefined();
  });
});

/** Rebuild a minimal BST from sorted in-order values. */
function rebuildTree(sorted: number[]): TreeNode | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return {
    id: `n_${sorted[mid]}`,
    value: sorted[mid],
    left: rebuildTree(sorted.slice(0, mid)),
    right: rebuildTree(sorted.slice(mid + 1)),
  };
}

function inorder(node: TreeNode | null): number[] {
  if (!node) return [];
  return [...inorder(node.left), node.value, ...inorder(node.right)];
}
