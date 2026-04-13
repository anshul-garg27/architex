import { describe, it, expect } from 'vitest';
import {
  layoutAVLTree,
  layoutRBTree,
  layoutTree,
} from '@/lib/data-structures/tree-layout';
import type { GenericTreeNode } from '@/lib/data-structures/tree-layout';
import { buildAVL } from '@/lib/data-structures/avl-ds';
import { buildRBTree } from '@/lib/data-structures/red-black-ds';

describe('Reingold-Tilford Tree Layout', () => {
  // ── Single node ─────────────────────────────────────────

  it('lays out a single node at the origin level', () => {
    const root = buildAVL([42]);
    expect(root).not.toBeNull();

    const result = layoutAVLTree(root);
    expect(result.nodes).toHaveLength(1);
    expect(result.edges).toHaveLength(0);

    const node = result.nodes[0];
    expect(node.value).toBe(42);
    expect(node.depth).toBe(0);
    // x should be 0 (centered at origin with single node)
    expect(node.x).toBe(0);
    // y should be topPadding (default 30)
    expect(node.y).toBe(30);
  });

  // ── Balanced tree ───────────────────────────────────────

  it('lays out a balanced tree with no overlapping nodes', () => {
    // Insert values that create a balanced AVL tree
    const root = buildAVL([50, 25, 75, 10, 30, 60, 90]);
    expect(root).not.toBeNull();

    const result = layoutAVLTree(root);
    expect(result.nodes.length).toBeGreaterThanOrEqual(7);

    // No two nodes should have the same (x, y)
    const positions = new Set<string>();
    for (const n of result.nodes) {
      const key = `${n.x},${n.y}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    }

    // Edges should connect parents to children
    expect(result.edges.length).toBe(result.nodes.length - 1);

    // All nodes at the same depth should have the same y
    const depthYMap = new Map<number, number>();
    for (const n of result.nodes) {
      if (depthYMap.has(n.depth)) {
        expect(n.y).toBe(depthYMap.get(n.depth));
      } else {
        depthYMap.set(n.depth, n.y);
      }
    }

    // Deeper nodes should have larger y values
    const depths = [...depthYMap.entries()].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < depths.length; i++) {
      expect(depths[i][1]).toBeGreaterThan(depths[i - 1][1]);
    }
  });

  // ── Skewed (right-leaning) tree ─────────────────────────

  it('lays out a right-skewed tree without overlaps', () => {
    // Even though AVL rebalances, building with sorted input
    // still creates a tree with multiple levels
    const root = buildAVL([1, 2, 3, 4, 5, 6, 7]);
    expect(root).not.toBeNull();

    const result = layoutAVLTree(root);
    expect(result.nodes.length).toBe(7);

    // No overlapping positions
    const positions = new Set<string>();
    for (const n of result.nodes) {
      const key = `${n.x},${n.y}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    }

    // In-order x positions should be strictly increasing
    // (since layout uses in-order index)
    const sorted = [...result.nodes].sort((a, b) => a.value - b.value);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].x).toBeGreaterThan(sorted[i - 1].x);
    }
  });

  // ── Left-skewed tree ────────────────────────────────────

  it('lays out a left-skewed tree correctly', () => {
    const root = buildAVL([7, 6, 5, 4, 3, 2, 1]);
    expect(root).not.toBeNull();

    const result = layoutAVLTree(root);
    expect(result.nodes.length).toBe(7);

    // All x values should be >= 0 (centered)
    for (const n of result.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
    }
  });

  // ── Red-Black tree layout ──────────────────────────────

  it('lays out a Red-Black tree with color information', () => {
    const root = buildRBTree([10, 20, 30, 15, 25]);
    expect(root).not.toBeNull();

    const result = layoutRBTree(root);
    expect(result.nodes.length).toBeGreaterThanOrEqual(5);

    // Check that color is preserved
    for (const n of result.nodes) {
      expect(n.color).toBeDefined();
      expect(['red', 'black']).toContain(n.color);
    }

    // Root should be black
    const rootNode = result.nodes.find((n) => n.depth === 0);
    expect(rootNode).toBeDefined();
    expect(rootNode!.color).toBe('black');
  });

  // ── Generic tree layout ────────────────────────────────

  it('lays out a generic tree', () => {
    const root: GenericTreeNode = {
      id: 'a',
      value: 50,
      left: {
        id: 'b',
        value: 25,
        left: { id: 'd', value: 10, left: null, right: null },
        right: { id: 'e', value: 30, left: null, right: null },
      },
      right: {
        id: 'c',
        value: 75,
        left: null,
        right: { id: 'f', value: 90, left: null, right: null },
      },
    };

    const result = layoutTree(root);
    expect(result.nodes.length).toBe(6);
    expect(result.edges.length).toBe(5);

    // Root should be at depth 0
    const rootNode = result.nodes.find((n) => n.id === 'a');
    expect(rootNode!.depth).toBe(0);

    // Leaves should be at depth 2
    const leaf = result.nodes.find((n) => n.id === 'd');
    expect(leaf!.depth).toBe(2);
  });

  // ── Empty tree ─────────────────────────────────────────

  it('returns empty result for null tree', () => {
    const result = layoutAVLTree(null);
    expect(result.nodes).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  // ── Custom config ──────────────────────────────────────

  it('respects custom spacing configuration', () => {
    const root = buildAVL([10, 5, 15]);
    const defaultResult = layoutAVLTree(root);
    const customResult = layoutAVLTree(root, { hSpacing: 100, vSpacing: 120 });

    // Custom spacing should produce wider spread
    const defaultWidth =
      Math.max(...defaultResult.nodes.map((n) => n.x)) -
      Math.min(...defaultResult.nodes.map((n) => n.x));
    const customWidth =
      Math.max(...customResult.nodes.map((n) => n.x)) -
      Math.min(...customResult.nodes.map((n) => n.x));
    expect(customWidth).toBeGreaterThan(defaultWidth);

    // Custom vertical spacing
    const defaultVGap =
      Math.max(...defaultResult.nodes.map((n) => n.y)) -
      Math.min(...defaultResult.nodes.map((n) => n.y));
    const customVGap =
      Math.max(...customResult.nodes.map((n) => n.y)) -
      Math.min(...customResult.nodes.map((n) => n.y));
    expect(customVGap).toBeGreaterThan(defaultVGap);
  });

  // ── Balance factor correctness ─────────────────────────

  it('computes balance factors correctly for AVL layout', () => {
    const root = buildAVL([30, 20, 40, 10, 25]);
    const result = layoutAVLTree(root);

    for (const n of result.nodes) {
      expect(n.balanceFactor).toBeDefined();
      // AVL tree invariant: |bf| <= 1
      expect(Math.abs(n.balanceFactor!)).toBeLessThanOrEqual(1);
    }
  });

  // ── Edge correctness ──────────────────────────────────

  it('edges reference valid node positions', () => {
    const root = buildAVL([50, 25, 75, 10, 30]);
    const result = layoutAVLTree(root);
    const nodeMap = new Map(result.nodes.map((n) => [n.id, n]));

    for (const edge of result.edges) {
      const parent = nodeMap.get(edge.parentId);
      const child = nodeMap.get(edge.childId);
      expect(parent).toBeDefined();
      expect(child).toBeDefined();
      expect(edge.parentX).toBe(parent!.x);
      expect(edge.parentY).toBe(parent!.y);
      expect(edge.childX).toBe(child!.x);
      expect(edge.childY).toBe(child!.y);
    }
  });
});
