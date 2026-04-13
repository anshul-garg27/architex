import { describe, it, expect } from 'vitest';
import { fordFulkerson } from '@/lib/algorithms/graph/ford-fulkerson';
import type { Graph } from '@/lib/algorithms/graph/types';

const flowNetwork: Graph = {
  nodes: [
    { id: 'S', label: 'S', x: 0, y: 0 },
    { id: 'A', label: 'A', x: 1, y: 0 },
    { id: 'B', label: 'B', x: 1, y: 1 },
    { id: 'T', label: 'T', x: 2, y: 0 },
  ],
  edges: [
    { source: 'S', target: 'A', weight: 10, directed: true },
    { source: 'S', target: 'B', weight: 5, directed: true },
    { source: 'A', target: 'T', weight: 8, directed: true },
    { source: 'B', target: 'T', weight: 7, directed: true },
    { source: 'A', target: 'B', weight: 3, directed: true },
  ],
};

describe('Ford-Fulkerson max flow', () => {
  it('max flow equals expected value', () => {
    const result = fordFulkerson(flowNetwork, 'S');
    // S out capacity=15, T in capacity=15, max flow=15
    // Paths: S->A->T(8), S->A->B->T(2), S->B->T(5) = 15
    expect(result.finalState[0]).toBe(15);
  });

  it('returns category graph in config', () => {
    const result = fordFulkerson(flowNetwork, 'S');
    expect(result.config.category).toBe('graph');
  });
});
