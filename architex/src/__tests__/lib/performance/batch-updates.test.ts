import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '@/stores/canvas-store';
import {
  batchStoreUpdates,
  loadDiagramBatched,
  type DiagramPayload,
} from '@/lib/performance/batch-updates';
import type { Node, Edge } from '@xyflow/react';

function resetStore() {
  useCanvasStore.getState().clearCanvas();
}

function makeNode(id: string): Node {
  return { id, position: { x: 0, y: 0 }, data: { label: id } };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

describe('batchStoreUpdates', () => {
  beforeEach(() => {
    resetStore();
  });

  it('executes all updates within the batch', () => {
    batchStoreUpdates(() => {
      const store = useCanvasStore.getState();
      store.addNode(makeNode('n1'));
      store.addNode(makeNode('n2'));
      store.addEdge(makeEdge('e1', 'n1', 'n2'));
    });

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.edges).toHaveLength(1);
  });

  it('handles empty update function without error', () => {
    expect(() => batchStoreUpdates(() => {})).not.toThrow();
  });

  it('propagates errors from the update function', () => {
    expect(() =>
      batchStoreUpdates(() => {
        throw new Error('test error');
      }),
    ).toThrow('test error');
  });
});

describe('loadDiagramBatched', () => {
  beforeEach(() => {
    resetStore();
  });

  it('loads nodes and edges into the store', () => {
    const diagram: DiagramPayload = {
      nodes: [makeNode('a'), makeNode('b')],
      edges: [makeEdge('e1', 'a', 'b')],
    };

    loadDiagramBatched(diagram);

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes[0].id).toBe('a');
    expect(state.nodes[1].id).toBe('b');
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0].id).toBe('e1');
  });

  it('loads groups when provided', () => {
    const diagram: DiagramPayload = {
      nodes: [makeNode('a')],
      edges: [],
      groups: [
        { id: 'g1', label: 'Group 1', color: '#ff0000', nodeIds: ['a'] },
      ],
    };

    loadDiagramBatched(diagram);

    const state = useCanvasStore.getState();
    expect(state.groups).toHaveLength(1);
    expect(state.groups[0].id).toBe('g1');
  });

  it('clears existing data before loading', () => {
    // Pre-populate the store
    const store = useCanvasStore.getState();
    store.addNode(makeNode('old'));
    store.addEdge(makeEdge('old-edge', 'old', 'old'));

    // Load new diagram
    loadDiagramBatched({
      nodes: [makeNode('new')],
      edges: [],
    });

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0].id).toBe('new');
    expect(state.edges).toHaveLength(0);
  });

  it('handles empty diagram', () => {
    loadDiagramBatched({ nodes: [], edges: [] });

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
    expect(state.groups).toHaveLength(0);
  });

  it('handles diagram with multiple groups', () => {
    const diagram: DiagramPayload = {
      nodes: [makeNode('a'), makeNode('b'), makeNode('c')],
      edges: [],
      groups: [
        { id: 'g1', label: 'Frontend', color: '#0000ff', nodeIds: ['a'] },
        { id: 'g2', label: 'Backend', color: '#00ff00', nodeIds: ['b', 'c'] },
      ],
    };

    loadDiagramBatched(diagram);

    const state = useCanvasStore.getState();
    expect(state.groups).toHaveLength(2);
    expect(state.groups[0].label).toBe('Frontend');
    expect(state.groups[1].label).toBe('Backend');
  });
});
