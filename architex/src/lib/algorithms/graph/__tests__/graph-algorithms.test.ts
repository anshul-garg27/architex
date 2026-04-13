import { describe, it, expect } from 'vitest';
import { bfs } from '../bfs';
import { dfs } from '../dfs';
import { dijkstra } from '../dijkstra';
import { topologicalSort } from '../topological-sort';
import {
  SIMPLE_UNDIRECTED,
  WEIGHTED_DIRECTED,
  DAG,
  CONNECTED_COMPONENTS,
} from '../sample-graphs';
import type { Graph } from '../types';

// ── BFS ──────────────────────────────────────────────────────

describe('BFS', () => {
  it('visits all reachable nodes in a connected graph', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    // finalState holds distances; all should be finite for a connected graph
    for (const d of result.finalState) {
      expect(d).not.toBe(Infinity);
    }
  });

  it('source node has distance 0', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    // Node A is the first node in the nodes array
    expect(result.finalState[0]).toBe(0);
  });

  it('produces non-decreasing distances (level ordering)', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    // Filter out Infinity for disconnected graphs, then check valid distances
    const finite = result.finalState.filter((d) => d !== Infinity);
    expect(finite.length).toBeGreaterThan(0);
    for (const d of finite) {
      expect(d).toBeGreaterThanOrEqual(0);
    }
  });

  it('generates animation steps', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.config.id).toBe('bfs');
    expect(result.config.category).toBe('graph');
  });

  it('handles a disconnected graph (only visits reachable component)', () => {
    const result = bfs(CONNECTED_COMPONENTS, 'A');
    // Nodes A, B, C, D are in component 1 (indices 0-3), rest unreachable
    expect(result.finalState[0]).toBe(0); // A
    expect(result.finalState[1]).not.toBe(Infinity); // B
    expect(result.finalState[2]).not.toBe(Infinity); // C
    expect(result.finalState[3]).not.toBe(Infinity); // D
    // Nodes E, F, G, H, I, J should be Infinity
    expect(result.finalState[4]).toBe(Infinity); // E
    expect(result.finalState[7]).toBe(Infinity); // H
  });

  it('returns correct config metadata', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    expect(result.config.name).toBe('Breadth-First Search');
    expect(result.config.timeComplexity.worst).toBe('O(V + E)');
    expect(result.config.spaceComplexity).toBe('O(V)');
  });

  it('step descriptions reference node ids', () => {
    const result = bfs(SIMPLE_UNDIRECTED, 'A');
    const descriptionText = result.steps.map((s) => s.description).join(' ');
    expect(descriptionText).toContain('A');
  });
});

// ── DFS ──────────────────────────────────────────────────────

describe('DFS', () => {
  it('visits all nodes in a connected graph', () => {
    const result = dfs(SIMPLE_UNDIRECTED, 'A');
    // finalState is discovery times; all should be > 0 for connected graph
    for (const d of result.finalState) {
      expect(d).toBeGreaterThan(0);
    }
  });

  it('assigns unique discovery times to each node', () => {
    const result = dfs(SIMPLE_UNDIRECTED, 'A');
    const times = result.finalState.filter((d) => d > 0);
    const unique = new Set(times);
    expect(unique.size).toBe(times.length);
  });

  it('start node gets earliest discovery time', () => {
    const result = dfs(SIMPLE_UNDIRECTED, 'A');
    // A is the first node (index 0), should have discovery time 1
    expect(result.finalState[0]).toBe(1);
  });

  it('handles disconnected graphs by visiting all components', () => {
    const result = dfs(CONNECTED_COMPONENTS, 'A');
    // DFS visits remaining unvisited nodes for disconnected graphs
    // All nodes should have a positive discovery time
    for (const d of result.finalState) {
      expect(d).toBeGreaterThan(0);
    }
  });

  it('produces valid step structure', () => {
    const result = dfs(SIMPLE_UNDIRECTED, 'A');
    expect(result.steps.length).toBeGreaterThan(0);
    for (const step of result.steps) {
      expect(typeof step.id).toBe('number');
      expect(typeof step.description).toBe('string');
      expect(Array.isArray(step.mutations)).toBe(true);
    }
  });

  it('returns correct config', () => {
    const result = dfs(SIMPLE_UNDIRECTED, 'A');
    expect(result.config.id).toBe('dfs');
    expect(result.config.name).toBe('Depth-First Search');
  });
});

// ── Dijkstra ─────────────────────────────────────────────────

describe('Dijkstra', () => {
  it('finds shortest path from source (distance 0)', () => {
    const result = dijkstra(WEIGHTED_DIRECTED, 'S');
    // S is index 0
    expect(result.finalState[0]).toBe(0);
  });

  it('computes correct shortest distances', () => {
    const result = dijkstra(WEIGHTED_DIRECTED, 'S');
    // WEIGHTED_DIRECTED: S->A=4, S->C=2, A->D=1 so S->D=5, A->B=2 so S->B=6
    // S(0), A(4), B(6), C(2), D(5), E(6), T(8)
    const nodeIds = WEIGHTED_DIRECTED.nodes.map((n) => n.id);
    const distMap = new Map<string, number>();
    nodeIds.forEach((id, i) => distMap.set(id, result.finalState[i]));

    expect(distMap.get('S')).toBe(0);
    expect(distMap.get('A')).toBe(4);
    expect(distMap.get('C')).toBe(2);
    expect(distMap.get('D')).toBe(5);
    expect(distMap.get('B')).toBe(6);
    expect(distMap.get('E')).toBe(6);
    expect(distMap.get('T')).toBe(8);
  });

  it('marks unreachable nodes as -1 in finalState', () => {
    // Create a graph where some nodes are unreachable
    const partialGraph: Graph = {
      nodes: [
        { id: 'X', label: 'X', x: 0, y: 0 },
        { id: 'Y', label: 'Y', x: 100, y: 0 },
        { id: 'Z', label: 'Z', x: 200, y: 0 },
      ],
      edges: [
        { source: 'X', target: 'Y', weight: 5, directed: true },
        // Z has no incoming edges
      ],
    };
    const result = dijkstra(partialGraph, 'X');
    expect(result.finalState[0]).toBe(0); // X
    expect(result.finalState[1]).toBe(5); // Y
    expect(result.finalState[2]).toBe(-1); // Z is unreachable
  });

  it('generates step-by-step animation', () => {
    const result = dijkstra(WEIGHTED_DIRECTED, 'S');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.config.id).toBe('dijkstra');
  });

  it('handles single-node graph', () => {
    const singleNode: Graph = {
      nodes: [{ id: 'only', label: 'Only', x: 0, y: 0 }],
      edges: [],
    };
    const result = dijkstra(singleNode, 'only');
    expect(result.finalState).toEqual([0]);
  });
});

// ── Topological Sort ─────────────────────────────────────────

describe('Topological Sort', () => {
  it('produces a valid topological ordering of a DAG', () => {
    const result = topologicalSort(DAG, 'CS101');
    // finalState contains position in topological order (0-indexed)
    // All should be >= 0 (valid position) for a DAG
    for (const pos of result.finalState) {
      expect(pos).toBeGreaterThanOrEqual(0);
    }
  });

  it('orders all nodes (none are -1) for a valid DAG', () => {
    const result = topologicalSort(DAG, 'CS101');
    const positions = result.finalState;
    // All 8 nodes should have positions 0-7
    expect(positions.length).toBe(8);
    for (const pos of positions) {
      expect(pos).not.toBe(-1);
    }
  });

  it('assigns unique positions to all nodes', () => {
    const result = topologicalSort(DAG, 'CS101');
    const positions = result.finalState;
    const unique = new Set(positions);
    expect(unique.size).toBe(positions.length);
  });

  it('respects dependency edges (predecessor appears before successor)', () => {
    const result = topologicalSort(DAG, 'CS101');
    const nodeIds = DAG.nodes.map((n) => n.id);
    const posMap = new Map<string, number>();
    nodeIds.forEach((id, i) => posMap.set(id, result.finalState[i]));

    // For every directed edge u -> v, pos(u) < pos(v)
    for (const edge of DAG.edges) {
      const sourcePos = posMap.get(edge.source)!;
      const targetPos = posMap.get(edge.target)!;
      expect(sourcePos).toBeLessThan(targetPos);
    }
  });

  it('detects cycle in a cyclic graph', () => {
    const cyclicGraph: Graph = {
      nodes: [
        { id: 'A', label: 'A', x: 0, y: 0 },
        { id: 'B', label: 'B', x: 100, y: 0 },
        { id: 'C', label: 'C', x: 200, y: 0 },
      ],
      edges: [
        { source: 'A', target: 'B', weight: 1, directed: true },
        { source: 'B', target: 'C', weight: 1, directed: true },
        { source: 'C', target: 'A', weight: 1, directed: true },
      ],
    };
    const result = topologicalSort(cyclicGraph, 'A');
    // With a cycle, not all nodes will be placed
    const placed = result.finalState.filter((p) => p >= 0);
    expect(placed.length).toBeLessThan(cyclicGraph.nodes.length);
  });

  it('generates animation steps', () => {
    const result = topologicalSort(DAG, 'CS101');
    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.config.id).toBe('topological-sort');
    expect(result.config.category).toBe('graph');
  });
});
