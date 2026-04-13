import { describe, it, expect, beforeEach } from 'vitest';
import { HashIndexViz } from '../hash-index-viz';

// ── HashIndexViz Tests ────────────────────────────────────────

describe('HashIndexViz', () => {
  let hashIndex: HashIndexViz;

  beforeEach(() => {
    hashIndex = new HashIndexViz(4); // 4 buckets
  });

  it('inserts a single key into correct bucket', () => {
    const steps = hashIndex.insert('name', 'Alice');

    expect(steps.length).toBeGreaterThanOrEqual(1);
    // Should have a hash step and an insert step
    const hashStep = steps.find((s) => s.operation === 'hash');
    const insertStep = steps.find((s) => s.operation === 'insert');
    expect(hashStep).toBeDefined();
    expect(insertStep).toBeDefined();
    expect(insertStep!.description).toContain('Inserted');

    const state = hashIndex.getState();
    expect(state.size).toBe(1);
    expect(state.loadFactor).toBeCloseTo(1 / 4);
  });

  it('insert triggering collision generates collision step', () => {
    // Use 1 bucket: every key hashes to bucket 0, guaranteeing a collision
    // on the second insert. The collision step is generated before the resize
    // step in the insert flow, so we will see it even though resize follows.
    const singleBucket = new HashIndexViz(1);
    singleBucket.insert('first', '1');
    const steps = singleBucket.insert('second', '2');

    const collisionStep = steps.find((s) => s.operation === 'collision');
    expect(collisionStep).toBeDefined();
    expect(collisionStep!.description).toContain('Collision');
  });

  it('insert triggering resize doubles bucket count', () => {
    // 4 buckets, load factor threshold 0.75 → resize after inserting 4th key
    // (4/4 = 1.0 > 0.75)
    hashIndex.insert('a', '1');
    hashIndex.insert('b', '2');
    hashIndex.insert('c', '3');
    const steps = hashIndex.insert('d', '4');

    const resizeStep = steps.find((s) => s.operation === 'resize');
    expect(resizeStep).toBeDefined();
    expect(resizeStep!.description).toContain('resized');
    expect(resizeStep!.description).toContain('from 4 to 8');

    const state = hashIndex.getState();
    expect(state.size).toBe(4);
    // After resize, bucket count doubled
    expect(state.buckets).toHaveLength(8);
  });

  it('search for existing key returns found step', () => {
    hashIndex.insert('name', 'Alice');
    const steps = hashIndex.search('name');

    const foundStep = steps.find((s) => s.operation === 'search');
    expect(foundStep).toBeDefined();
    expect(foundStep!.description).toContain('Found');
    expect(foundStep!.description).toContain('name');
    expect(foundStep!.description).toContain('Alice');
  });

  it('search for missing key returns not-found step', () => {
    hashIndex.insert('name', 'Alice');
    const steps = hashIndex.search('missing');

    const notFoundStep = steps.find(
      (s) => s.operation === 'search' && s.description.includes('not found'),
    );
    expect(notFoundStep).toBeDefined();
  });

  it('delete existing key returns deleted step and decreases entry count', () => {
    hashIndex.insert('name', 'Alice');
    hashIndex.insert('age', '30');
    expect(hashIndex.getState().size).toBe(2);

    const steps = hashIndex.delete('name');

    const deleteStep = steps.find((s) => s.operation === 'delete');
    expect(deleteStep).toBeDefined();
    expect(deleteStep!.description).toContain('Deleted');

    expect(hashIndex.getState().size).toBe(1);
  });

  it('delete missing key returns not-found step', () => {
    hashIndex.insert('name', 'Alice');

    const steps = hashIndex.delete('missing');

    const notFoundStep = steps.find(
      (s) => s.description.includes('not found'),
    );
    expect(notFoundStep).toBeDefined();
  });
});
