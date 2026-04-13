import { describe, it, expect } from 'vitest';
import { bfs } from '@/lib/algorithms/graph/bfs';
import type { Graph } from '@/lib/algorithms/graph/types';

const graph: Graph = {
  nodes: [
    { id: 'A', label: 'A', x: 0, y: 0 },
    { id: 'B', label: 'B', x: 1, y: 0 },
    { id: 'C', label: 'C', x: 2, y: 0 },
    { id: 'D', label: 'D', x: 3, y: 0 },
  ],
  edges: [
    { source: 'A', target: 'B', weight: 1, directed: false },
    { source: 'A', target: 'C', weight: 1, directed: false },
    { source: 'B', target: 'D', weight: 1, directed: false },
  ],
};

describe('BFS', () => {
  it('visits all reachable nodes', () => {
    const result = bfs(graph, 'A');
    // finalState contains distances for each node in order [A, B, C, D]
    // All should be finite (reachable)
    expect(result.finalState.every((d) => d < Infinity)).toBe(true);
  });

  it('computes correct distances from source', () => {
    const result = bfs(graph, 'A');
    // A=0, B=1, C=1, D=2
    expect(result.finalState).toEqual([0, 1, 1, 2]);
  });

  it('returns category graph in config', () => {
    const result = bfs(graph, 'A');
    expect(result.config.category).toBe('graph');
  });
});
