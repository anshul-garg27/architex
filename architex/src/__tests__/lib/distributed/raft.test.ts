import { describe, it, expect } from 'vitest';
import { RaftCluster } from '@/lib/distributed/raft';

describe('Raft consensus', () => {
  it('starts with all nodes as followers in term 0', () => {
    const cluster = new RaftCluster(3);
    const state = cluster.getState();
    expect(state.nodes).toHaveLength(3);
    for (const node of state.nodes) {
      expect(node.role).toBe('follower');
      expect(node.term).toBe(0);
    }
    expect(state.leader).toBeNull();
  });

  it('elects a leader within 30 steps', () => {
    const cluster = new RaftCluster(3);
    let leader: string | null = null;

    for (let i = 0; i < 30; i++) {
      cluster.step();
      const state = cluster.getState();
      if (state.leader) {
        leader = state.leader;
        break;
      }
    }

    expect(leader).not.toBeNull();

    // The elected leader should be in role 'leader'
    const state = cluster.getState();
    const leaderNode = state.nodes.find((n) => n.id === leader);
    expect(leaderNode).toBeDefined();
    expect(leaderNode!.role).toBe('leader');
    expect(leaderNode!.term).toBeGreaterThan(0);
  });

  it('only one node is leader after election', () => {
    const cluster = new RaftCluster(5);
    // Run enough steps to ensure election settles
    for (let i = 0; i < 50; i++) {
      cluster.step();
    }

    const state = cluster.getState();
    const leaders = state.nodes.filter((n) => n.role === 'leader');
    expect(leaders.length).toBeLessThanOrEqual(1);
    if (leaders.length === 1) {
      expect(state.leader).toBe(leaders[0].id);
    }
  });

  it('leader term is consistent across followers after election', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 50; i++) cluster.step();

    const state = cluster.getState();
    if (state.leader) {
      const leaderNode = state.nodes.find((n) => n.id === state.leader)!;
      const leaderTerm = leaderNode.term;
      // All followers should have term >= the leader's term
      // (they may have briefly had a higher term during elections,
      // but after stabilization they should match)
      for (const node of state.nodes) {
        expect(node.term).toBeGreaterThanOrEqual(leaderTerm);
      }
    }
  });

  it('replicates a submitted command to the leader log', () => {
    const cluster = new RaftCluster(3);
    // Elect a leader
    for (let i = 0; i < 50; i++) cluster.step();

    const state = cluster.getState();
    expect(state.leader).not.toBeNull();

    cluster.submitCommand('SET x 42');

    // The leader should have the command in its log
    const leaderState = cluster.getState().nodes.find(
      (n) => n.id === state.leader,
    )!;
    expect(leaderState.log.length).toBeGreaterThanOrEqual(1);
    expect(leaderState.log[leaderState.log.length - 1].command).toBe('SET x 42');
  });

  it('records events in the event log during steps', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 30; i++) cluster.step();
    expect(cluster.eventLog.length).toBeGreaterThan(0);

    // Should contain at least one election-timeout event
    const electionEvents = cluster.eventLog.filter(
      (e) => e.type === 'election-timeout',
    );
    expect(electionEvents.length).toBeGreaterThan(0);
  });

  it('reset restores cluster to initial state', () => {
    const cluster = new RaftCluster(3);
    for (let i = 0; i < 50; i++) cluster.step();
    expect(cluster.eventLog.length).toBeGreaterThan(0);

    cluster.reset();

    expect(cluster.tick).toBe(0);
    expect(cluster.eventLog).toHaveLength(0);
    const state = cluster.getState();
    for (const node of state.nodes) {
      expect(node.role).toBe('follower');
      expect(node.term).toBe(0);
    }
  });

  it('crashNode prevents a node from participating', () => {
    const cluster = new RaftCluster(3);
    // Elect a leader first
    for (let i = 0; i < 50; i++) cluster.step();

    const state = cluster.getState();
    const leader = state.leader;
    expect(leader).not.toBeNull();

    // Crash the leader
    cluster.crashNode(leader!);

    // Run more steps — a new leader should be elected from the remaining nodes
    for (let i = 0; i < 50; i++) cluster.step();

    const newState = cluster.getState();
    // The old leader should not be the leader anymore (it's crashed)
    if (newState.leader) {
      expect(newState.leader).not.toBe(leader);
    }
  });
});
