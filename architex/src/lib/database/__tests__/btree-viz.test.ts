import { describe, it, expect, beforeEach } from 'vitest';
import { BTreeViz } from '../btree-viz';

// ── BTreeViz Tests ────────────────────────────────────────────

describe('BTreeViz', () => {
  let tree: BTreeViz;

  beforeEach(() => {
    tree = new BTreeViz(3); // order 3 → max 2 keys per node
  });

  it('inserts a single key into an empty tree', () => {
    const steps = tree.insert(10);

    expect(steps.length).toBeGreaterThanOrEqual(1);
    expect(steps.some((s) => s.operation === 'insert')).toBe(true);

    const root = tree.getTree();
    expect(root.keys).toEqual([10]);
    expect(root.isLeaf).toBe(true);
    expect(root.children).toHaveLength(0);
  });

  it('inserts causing root split (order 3, insert 3 keys)', () => {
    tree.insert(10);
    tree.insert(20);
    const steps = tree.insert(30);

    // A split step should have been generated
    expect(steps.some((s) => s.operation === 'split')).toBe(true);

    const root = tree.getTree();
    // After split, root should have 1 key (the median) and 2 children
    expect(root.keys).toHaveLength(1);
    expect(root.children).toHaveLength(2);
    expect(root.isLeaf).toBe(false);

    // The median (20) is promoted to root
    expect(root.keys[0]).toBe(20);
    // Left child has keys < median, right child has keys > median
    expect(root.children[0].keys).toEqual([10]);
    expect(root.children[1].keys).toEqual([30]);
  });

  it('search for existing key returns found step', () => {
    tree.insert(10);
    tree.insert(20);

    const steps = tree.search(10);

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const foundStep = steps.find((s) => s.description.includes('Found key 10'));
    expect(foundStep).toBeDefined();
    expect(foundStep!.operation).toBe('search');
    expect(foundStep!.highlightKey).toBe(10);
  });

  it('search for missing key returns not-found step', () => {
    tree.insert(10);
    tree.insert(20);

    const steps = tree.search(99);

    expect(steps.length).toBeGreaterThanOrEqual(1);
    const notFoundStep = steps.find((s) => s.description.includes('not found'));
    expect(notFoundStep).toBeDefined();
    expect(notFoundStep!.operation).toBe('search');
  });

  it('insert duplicate key produces "already exists" step and tree unchanged', () => {
    tree.insert(10);

    // Capture tree state with a single key (no split risk)
    const treeBefore = tree.getTree();
    expect(treeBefore.keys).toEqual([10]);

    const steps = tree.insert(10);

    const dupStep = steps.find((s) => s.description.includes('already exists'));
    expect(dupStep).toBeDefined();
    expect(dupStep!.operation).toBe('insert');

    // Tree structure should be unchanged
    const treeAfter = tree.getTree();
    expect(treeAfter.keys).toEqual([10]);
  });

  it('step count matches expected for a single insert into empty tree', () => {
    const steps = tree.insert(42);

    // Inserting into an empty leaf: exactly 1 insert step
    expect(steps).toHaveLength(1);
    expect(steps[0].operation).toBe('insert');
  });

  it('step count for insert with split includes traversal and split steps', () => {
    tree.insert(10);
    tree.insert(20);
    // Third insert triggers a root split
    const steps = tree.insert(30);

    // Should have at least a split step and an insert step
    const splitSteps = steps.filter((s) => s.operation === 'split');
    const insertSteps = steps.filter((s) => s.operation === 'insert');
    expect(splitSteps.length).toBeGreaterThanOrEqual(1);
    expect(insertSteps.length).toBeGreaterThanOrEqual(1);
  });
});
