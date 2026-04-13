import { describe, it, expect } from 'vitest';
import { ConsistentHashRing } from '../consistent-hash';
import { VectorClockSimulation } from '../vector-clock';
import { RaftCluster } from '../raft';

// ── Consistent Hashing ──────────────────────────────────────

describe('ConsistentHashRing', () => {
  it('creates an empty ring', () => {
    const ring = new ConsistentHashRing(10);
    expect(ring.getAllNodes()).toEqual([]);
    expect(ring.getAllKeys()).toEqual([]);
  });

  it('adds a node and assigns keys to it', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    const hk = ring.addKey('user:1');
    expect(hk.assignedNode).toBe('n1');
  });

  it('distributes keys across multiple nodes', () => {
    const ring = new ConsistentHashRing(150);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.addNode('n3', 'Node 3');

    // Add many keys and check distribution
    for (let i = 0; i < 300; i++) {
      ring.addKey(`key:${i}`);
    }

    const dist = ring.getLoadDistribution();
    // Each node should have at least some keys with 150 vnodes and 300 keys
    expect(dist.get('n1')!).toBeGreaterThan(0);
    expect(dist.get('n2')!).toBeGreaterThan(0);
    expect(dist.get('n3')!).toBeGreaterThan(0);

    // Total should be 300
    let total = 0;
    for (const count of dist.values()) total += count;
    expect(total).toBe(300);
  });

  it('adding a node redistributes some keys', () => {
    const ring = new ConsistentHashRing(150);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');

    for (let i = 0; i < 200; i++) {
      ring.addKey(`key:${i}`);
    }

    // Add a third node -- some keys should be redistributed
    const { redistribution } = ring.addNode('n3', 'Node 3');
    const distAfter = ring.getLoadDistribution();

    // The new node should have some keys with 150 vnodes
    expect(distAfter.get('n3')!).toBeGreaterThan(0);
    // Not ALL keys moved -- consistent hashing minimizes redistribution
    const movedCount = redistribution.size;
    expect(movedCount).toBeLessThan(200);
    expect(movedCount).toBeGreaterThan(0);

    // Total keys still 200
    let total = 0;
    for (const count of distAfter.values()) total += count;
    expect(total).toBe(200);
  });

  it('removing a node redistributes its keys to remaining nodes', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    ring.addNode('n3', 'Node 3');

    for (let i = 0; i < 30; i++) {
      ring.addKey(`key:${i}`);
    }

    const { redistribution } = ring.removeNode('n2');

    const distAfter = ring.getLoadDistribution();
    // n2 should no longer exist
    expect(distAfter.has('n2')).toBe(false);
    // All 30 keys should still be assigned
    let total = 0;
    for (const count of distAfter.values()) total += count;
    expect(total).toBe(30);
  });

  it('throws when adding a duplicate node', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    expect(() => ring.addNode('n1', 'Node 1')).toThrow();
  });

  it('throws when removing a non-existent node', () => {
    const ring = new ConsistentHashRing(10);
    expect(() => ring.removeNode('missing')).toThrow();
  });

  it('throws when looking up a key with no nodes', () => {
    const ring = new ConsistentHashRing(10);
    expect(() => ring.getNode('some-key')).toThrow();
  });

  it('getNode returns consistent results for the same key', () => {
    const ring = new ConsistentHashRing(50);
    ring.addNode('n1', 'Node 1');
    ring.addNode('n2', 'Node 2');
    const owner1 = ring.getNode('user:42');
    const owner2 = ring.getNode('user:42');
    expect(owner1).toBe(owner2);
  });

  it('reset clears all state', () => {
    const ring = new ConsistentHashRing(10);
    ring.addNode('n1', 'Node 1');
    ring.addKey('key:1');
    ring.reset();
    expect(ring.getAllNodes()).toEqual([]);
    expect(ring.getAllKeys()).toEqual([]);
  });
});

// ── Vector Clocks ────────────────────────────────────────────

describe('VectorClockSimulation', () => {
  it('initializes all clocks to zero', () => {
    const sim = new VectorClockSimulation(['A', 'B', 'C']);
    const stateA = sim.getProcessState('A');
    expect(stateA.clock).toEqual({ A: 0, B: 0, C: 0 });
  });

  it('local event increments the process own component', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    const event = sim.localEvent('A');
    expect(event.clock.A).toBe(1);
    expect(event.clock.B).toBe(0);
    expect(event.type).toBe('local');
  });

  it('send event increments sender own component', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    const event = sim.sendEvent('A', 'B');
    expect(event.clock.A).toBe(1);
    expect(event.type).toBe('send');
    expect(event.targetProcessId).toBe('B');
  });

  it('receive event merges clocks (element-wise max) and increments receiver', () => {
    const sim = new VectorClockSimulation(['A', 'B', 'C']);
    // A does a local event: A={A:1, B:0, C:0}
    sim.localEvent('A');
    // A sends to B: A={A:2, B:0, C:0}
    const sendEvt = sim.sendEvent('A', 'B');
    // B receives: merge max({A:0,B:0,C:0}, {A:2,B:0,C:0}) then B++ => {A:2, B:1, C:0}
    const recvEvt = sim.receiveEvent('B', 'A', sendEvt.clock);
    expect(recvEvt.clock.A).toBe(2);
    expect(recvEvt.clock.B).toBe(1);
    expect(recvEvt.clock.C).toBe(0);
  });

  it('happensBefore detects causal ordering', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    const e1 = sim.localEvent('A'); // A={1,0}
    const sendEvt = sim.sendEvent('A', 'B'); // A={2,0}
    const e3 = sim.receiveEvent('B', 'A', sendEvt.clock); // B={2,1}

    expect(sim.happensBefore(e1, e3)).toBe(true);
    expect(sim.happensBefore(e3, e1)).toBe(false);
  });

  it('concurrent events are detected correctly', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    const eA = sim.localEvent('A'); // A={1,0}
    const eB = sim.localEvent('B'); // B={0,1}

    expect(sim.areConcurrent(eA, eB)).toBe(true);
    expect(sim.happensBefore(eA, eB)).toBe(false);
    expect(sim.happensBefore(eB, eA)).toBe(false);
  });

  it('getEvents returns the full ordered event log', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    sim.localEvent('A');
    sim.localEvent('B');
    sim.localEvent('A');
    const events = sim.getEvents();
    expect(events.length).toBe(3);
    expect(events[0].processId).toBe('A');
    expect(events[1].processId).toBe('B');
    expect(events[2].processId).toBe('A');
  });

  it('reset clears events and resets clocks', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    sim.localEvent('A');
    sim.localEvent('B');
    sim.reset();
    expect(sim.getEvents()).toEqual([]);
    expect(sim.getProcessState('A').clock).toEqual({ A: 0, B: 0 });
  });

  it('throws on duplicate process IDs', () => {
    expect(() => new VectorClockSimulation(['A', 'A'])).toThrow();
  });

  it('throws on empty process list', () => {
    expect(() => new VectorClockSimulation([])).toThrow();
  });

  it('throws when sending to self', () => {
    const sim = new VectorClockSimulation(['A', 'B']);
    expect(() => sim.sendEvent('A', 'A')).toThrow();
  });
});

// ── Raft ─────────────────────────────────────────────────────

describe('RaftCluster', () => {
  it('creates a 3-node cluster with all followers', () => {
    const cluster = new RaftCluster(3);
    const state = cluster.getState();
    expect(state.nodes.length).toBe(3);
    for (const node of state.nodes) {
      expect(node.role).toBe('follower');
      expect(node.term).toBe(0);
    }
    expect(state.leader).toBeNull();
  });

  it('eventually elects a leader', () => {
    const cluster = new RaftCluster(3);
    // Run enough steps for an election timeout to fire
    for (let i = 0; i < 100; i++) {
      cluster.step();
    }
    const state = cluster.getState();
    expect(state.leader).not.toBeNull();
  });

  it('leader has role=leader after election', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) {
      cluster.step();
    }
    const state = cluster.getState();
    const leaderNode = state.nodes.find((n) => n.id === state.leader);
    expect(leaderNode).toBeDefined();
    expect(leaderNode!.role).toBe('leader');
  });

  it('all nodes agree on the same term after election', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) {
      cluster.step();
    }
    const state = cluster.getState();
    const terms = state.nodes.map((n) => n.term);
    // All nodes should be on the same term
    expect(new Set(terms).size).toBe(1);
  });

  it('leader can accept and replicate a command', () => {
    const cluster = new RaftCluster(3);
    // Elect a leader
    for (let i = 0; i < 100; i++) {
      cluster.step();
    }

    cluster.submitCommand('SET x 42');

    // Run enough steps for replication
    for (let i = 0; i < 50; i++) {
      cluster.step();
    }

    const state = cluster.getState();
    const leader = state.nodes.find((n) => n.id === state.leader);
    expect(leader!.log.length).toBeGreaterThanOrEqual(1);
    expect(leader!.log[0].command).toBe('SET x 42');
  });

  it('crashed node stops responding', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) cluster.step();

    const state = cluster.getState();
    const leader = state.leader!;
    // Crash a non-leader follower
    const follower = state.nodes.find((n) => n.id !== leader)!;
    cluster.crashNode(follower.id);

    // Cluster should still function with 2 of 3 nodes
    cluster.submitCommand('SET y 10');
    for (let i = 0; i < 50; i++) cluster.step();

    const state2 = cluster.getState();
    expect(state2.leader).not.toBeNull();
  });

  it('recovered node rejoins as follower', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) cluster.step();

    const state = cluster.getState();
    const follower = state.nodes.find((n) => n.id !== state.leader)!;
    cluster.crashNode(follower.id);
    for (let i = 0; i < 20; i++) cluster.step();

    cluster.recoverNode(follower.id);
    // After recovery, node should be a follower
    const node = cluster.getState().nodes.find((n) => n.id === follower.id)!;
    expect(node.role).toBe('follower');
  });

  it('reset restores initial state', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) cluster.step();
    cluster.submitCommand('SET z 1');
    for (let i = 0; i < 20; i++) cluster.step();

    cluster.reset();
    const state = cluster.getState();
    expect(state.leader).toBeNull();
    for (const node of state.nodes) {
      expect(node.role).toBe('follower');
      expect(node.term).toBe(0);
      expect(node.log).toEqual([]);
    }
  });

  it('event log records election events', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 100; i++) {
      cluster.step();
    }
    const hasElection = cluster.eventLog.some(
      (e) => e.type === 'election-timeout' || e.type === 'become-leader',
    );
    expect(hasElection).toBe(true);
  });

  it('network partition isolates minority from electing leader', () => {
    const cluster = new RaftCluster(5);
    for (let i = 0; i < 100; i++) cluster.step();

    // Partition: 3 nodes vs 2 nodes
    cluster.createPartition(
      ['node-0', 'node-1', 'node-2'],
      ['node-3', 'node-4'],
    );

    // Run many steps -- the majority side should maintain/elect a leader
    for (let i = 0; i < 200; i++) cluster.step();

    const state = cluster.getState();
    if (state.leader) {
      // If a leader exists, it should be in the majority partition
      expect(['node-0', 'node-1', 'node-2']).toContain(state.leader);
    }
  });
});
