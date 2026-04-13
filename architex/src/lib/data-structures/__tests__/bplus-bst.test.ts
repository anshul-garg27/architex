// -----------------------------------------------------------------
// Architex -- B+ Tree & BST Interactive Tests
// -----------------------------------------------------------------

import { describe, it, expect } from 'vitest';

import {
  createBPlusTree,
  bplusInsert,
  bplusSearch,
  bplusRangeQuery,
  bplusDelete,
  bplusLeafKeys,
} from '../bplus-tree-ds';
import type { BPlusTreeState } from '../bplus-tree-ds';

import { buildBST } from '../bst-ds';
import {
  bstInorder,
  bstPreorder,
  bstPostorder,
  bstLevelOrder,
  bstFindMin,
  bstFindMax,
  bstValidate,
} from '../bst-interactive';

// ── B+ Tree ────────────────────────────────────────────────────

describe('B+ Tree', () => {
  function insertKeys(keys: number[], order = 4): BPlusTreeState {
    let tree = createBPlusTree(order);
    for (const k of keys) {
      const result = bplusInsert(tree, k);
      tree = result.snapshot as BPlusTreeState;
    }
    return tree;
  }

  it('creates an empty tree', () => {
    const tree = createBPlusTree(4);
    expect(tree.rootId).toBeNull();
    expect(tree.size).toBe(0);
    expect(tree.order).toBe(4);
  });

  it('inserts a single key', () => {
    const result = bplusInsert(createBPlusTree(4), 10);
    const tree = result.snapshot as BPlusTreeState;
    expect(tree.size).toBe(1);
    expect(tree.rootId).not.toBeNull();
    expect(bplusLeafKeys(tree)).toEqual([10]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('inserts 10 keys and maintains sorted leaf order', () => {
    const keys = [5, 15, 25, 35, 45, 10, 20, 30, 40, 50];
    const tree = insertKeys(keys, 4);

    expect(tree.size).toBe(10);
    const leafKeys = bplusLeafKeys(tree);
    // All keys must be present.
    expect(leafKeys).toEqual([...keys].sort((a, b) => a - b));
  });

  it('rejects duplicate keys', () => {
    let tree = createBPlusTree(4);
    const r1 = bplusInsert(tree, 10);
    tree = r1.snapshot as BPlusTreeState;
    const r2 = bplusInsert(tree, 10);
    tree = r2.snapshot as BPlusTreeState;
    expect(tree.size).toBe(1);
    expect(bplusLeafKeys(tree)).toEqual([10]);
  });

  it('searches for an existing key', () => {
    const tree = insertKeys([10, 20, 30, 40, 50], 4);
    const result = bplusSearch(tree, 30);
    const snap = result.snapshot as { found: boolean };
    expect(snap.found).toBe(true);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('returns not found for missing key', () => {
    const tree = insertKeys([10, 20, 30], 4);
    const result = bplusSearch(tree, 99);
    const snap = result.snapshot as { found: boolean };
    expect(snap.found).toBe(false);
  });

  it('performs range query following leaf linked list', () => {
    const tree = insertKeys([5, 10, 15, 20, 25, 30, 35, 40, 45, 50], 4);
    const result = bplusRangeQuery(tree, 15, 35);
    const snap = result.snapshot as { result: number[] };
    expect(snap.result).toEqual([15, 20, 25, 30, 35]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('range query returns empty for out-of-range', () => {
    const tree = insertKeys([10, 20, 30], 4);
    const result = bplusRangeQuery(tree, 100, 200);
    const snap = result.snapshot as { result: number[] };
    expect(snap.result).toEqual([]);
  });

  it('leaf linked list traversal returns all keys in order', () => {
    const keys = [50, 40, 30, 20, 10, 5, 15, 25, 35, 45];
    const tree = insertKeys(keys, 4);
    const leafKeys = bplusLeafKeys(tree);
    const sorted = [...keys].sort((a, b) => a - b);
    expect(leafKeys).toEqual(sorted);
  });

  it('deletes a key from a leaf', () => {
    const tree = insertKeys([10, 20, 30, 40, 50], 4);
    const result = bplusDelete(tree, 30);
    const after = result.snapshot as BPlusTreeState;
    expect(after.size).toBe(4);
    expect(bplusLeafKeys(after)).not.toContain(30);
    expect(bplusLeafKeys(after).length).toBe(4);
  });

  it('delete on missing key does not change tree', () => {
    const tree = insertKeys([10, 20, 30], 4);
    const result = bplusDelete(tree, 99);
    const after = result.snapshot as BPlusTreeState;
    expect(after.size).toBe(3);
    expect(bplusLeafKeys(after)).toEqual([10, 20, 30]);
  });

  it('handles order-3 tree with splits', () => {
    // Order 3 means max 2 keys per node -- forces many splits.
    const tree = insertKeys([1, 2, 3, 4, 5, 6, 7, 8], 3);
    const leafKeys = bplusLeafKeys(tree);
    expect(leafKeys).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(tree.size).toBe(8);
  });
});

// ── BST Traversals & Utilities ─────────────────────────────────

describe('BST Interactive', () => {
  // Build a sample tree:
  //        8
  //       / \
  //      3   10
  //     / \    \
  //    1   6   14
  //       / \  /
  //      4  7 13
  const tree = buildBST([8, 3, 10, 1, 6, 4, 7, 14, 13]);

  it('inorder traversal produces sorted output', () => {
    const result = bstInorder(tree);
    const snap = result.snapshot as { result: number[] };
    expect(snap.result).toEqual([1, 3, 4, 6, 7, 8, 10, 13, 14]);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('preorder traversal visits root first', () => {
    const result = bstPreorder(tree);
    const snap = result.snapshot as { result: number[] };
    // First element must be root.
    expect(snap.result[0]).toBe(8);
    // All elements must be present.
    expect([...snap.result].sort((a, b) => a - b)).toEqual(
      [1, 3, 4, 6, 7, 8, 10, 13, 14],
    );
  });

  it('postorder traversal visits root last', () => {
    const result = bstPostorder(tree);
    const snap = result.snapshot as { result: number[] };
    // Last element must be root.
    expect(snap.result[snap.result.length - 1]).toBe(8);
    expect([...snap.result].sort((a, b) => a - b)).toEqual(
      [1, 3, 4, 6, 7, 8, 10, 13, 14],
    );
  });

  it('level-order traversal visits by level (BFS)', () => {
    const result = bstLevelOrder(tree);
    const snap = result.snapshot as { result: number[] };
    // Level 0: 8, Level 1: 3,10, Level 2: 1,6,14, Level 3: 4,7,13
    expect(snap.result).toEqual([8, 3, 10, 1, 6, 14, 4, 7, 13]);
  });

  it('findMin returns the smallest value', () => {
    const result = bstFindMin(tree);
    const snap = result.snapshot as { value: number };
    expect(snap.value).toBe(1);
    expect(result.steps.length).toBeGreaterThan(0);
  });

  it('findMax returns the largest value', () => {
    const result = bstFindMax(tree);
    const snap = result.snapshot as { value: number };
    expect(snap.value).toBe(14);
  });

  it('validate confirms a valid BST', () => {
    const result = bstValidate(tree);
    const snap = result.snapshot as { valid: boolean };
    expect(snap.valid).toBe(true);
  });

  it('validate returns true for empty tree', () => {
    const result = bstValidate(null);
    const snap = result.snapshot as { valid: boolean };
    expect(snap.valid).toBe(true);
  });

  it('findMin/findMax on empty tree returns null', () => {
    const minR = bstFindMin(null);
    const maxR = bstFindMax(null);
    expect((minR.snapshot as { value: number | null }).value).toBeNull();
    expect((maxR.snapshot as { value: number | null }).value).toBeNull();
  });

  it('level-order on empty tree returns empty array', () => {
    const result = bstLevelOrder(null);
    const snap = result.snapshot as { result: number[] };
    expect(snap.result).toEqual([]);
  });
});
