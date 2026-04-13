import { describe, it, expect } from 'vitest';
import { ConsistentHashRing } from '@/lib/distributed/consistent-hash';

describe('ConsistentHashRing', () => {
  // ── Basic operations ──────────────────────────────────────

  it('addNode places a node on the ring', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    expect(ring.getAllNodes()).toHaveLength(1);
    expect(ring.getAllNodes()[0].id).toBe('n1');
  });

  it('addNode throws if node already exists', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    expect(() => ring.addNode('n1', 'Duplicate')).toThrow();
  });

  it('removeNode removes the node from the ring', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.removeNode('n1');
    expect(ring.getAllNodes()).toHaveLength(1);
    expect(ring.getAllNodes()[0].id).toBe('n2');
  });

  it('removeNode throws if node does not exist', () => {
    const ring = new ConsistentHashRing(10);
    expect(() => ring.removeNode('nope')).toThrow();
  });

  // ── Key assignment ────────────────────────────────────────

  it('getNode assigns a key to one of the nodes', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.addNode('n3', 'Node 3');

    const owner = ring.getNode('user:42');
    expect(['n1', 'n2', 'n3']).toContain(owner);
  });

  it('getNode throws if no nodes are on the ring', () => {
    const ring = new ConsistentHashRing(50);
    expect(() => ring.getNode('key')).toThrow();
  });

  it('same key always maps to the same node (deterministic)', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');

    const owner1 = ring.getNode('stable-key');
    const owner2 = ring.getNode('stable-key');
    expect(owner1).toBe(owner2);
  });

  // ── Redistribution on addNode ─────────────────────────────

  it('adding a node only redistributes a subset of keys', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('server-a', 'Server A');
    ring.addNode('server-b', 'Server B');

    // Track 100 keys
    for (let i = 0; i < 100; i++) {
      ring.addKey(`key-${i}`);
    }

    const beforeKeys = ring.getAllKeys().map((k) => ({
      key: k.key,
      assignedNode: k.assignedNode,
    }));

    // Add a third node and see what moved
    const { redistribution } = ring.addNode('server-c', 'Server C');

    // Some keys should have moved, but not all
    expect(redistribution.size).toBeGreaterThan(0);
    expect(redistribution.size).toBeLessThan(100);
  });

  // ── Redistribution on removeNode ──────────────────────────

  it('removing a node redistributes its keys to remaining nodes', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.addNode('n3', 'Node 3');

    for (let i = 0; i < 100; i++) {
      ring.addKey(`key-${i}`);
    }

    const { redistribution } = ring.removeNode('n2');

    // All keys that were on n2 should have moved
    const allKeys = ring.getAllKeys();
    for (const hk of allKeys) {
      expect(hk.assignedNode).not.toBe('n2');
    }

    // Some keys should have been redistributed
    expect(redistribution.size).toBeGreaterThan(0);
  });

  // ── Load distribution ─────────────────────────────────────

  it('load distributes across all nodes (no node has 0 keys with enough keys)', () => {
    const ring = new ConsistentHashRing(150);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.addNode('n3', 'Node 3');

    for (let i = 0; i < 300; i++) {
      ring.addKey(`data-${i}`);
    }

    const dist = ring.getLoadDistribution();
    // With 150 vnodes and 300 keys over 3 nodes, each should have some keys
    expect(dist.get('n1')).toBeGreaterThan(0);
    expect(dist.get('n2')).toBeGreaterThan(0);
    expect(dist.get('n3')).toBeGreaterThan(0);
  });

  // ── Virtual nodes toggle ──────────────────────────────────

  it('toggling virtual nodes off and on re-maps keys', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');

    for (let i = 0; i < 50; i++) {
      ring.addKey(`item-${i}`);
    }

    // Disable virtual nodes
    ring.toggleVirtualNodes(false);
    const afterDisable = ring.getAllNodes();
    for (const node of afterDisable) {
      expect(node.virtualNodes).toHaveLength(0);
    }

    // Re-enable
    ring.toggleVirtualNodes(true);
    const afterEnable = ring.getAllNodes();
    for (const node of afterEnable) {
      expect(node.virtualNodes.length).toBeGreaterThan(0);
    }
  });

  // ── Reset ─────────────────────────────────────────────────

  it('reset clears all nodes and keys', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    ring.addKey('key');

    ring.reset();

    expect(ring.getAllNodes()).toEqual([]);
    expect(ring.getAllKeys()).toEqual([]);
  });
});
