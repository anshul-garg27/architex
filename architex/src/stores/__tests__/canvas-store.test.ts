import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../canvas-store';
import type { Node, Edge } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(id: string, data: Record<string, unknown> = {}): Node {
  return { id, type: 'default', position: { x: 0, y: 0 }, data };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('canvas-store', () => {
  beforeEach(() => {
    // Reset state between tests
    useCanvasStore.getState().clearCanvas();
  });

  // ── addNode ────────────────────────────────────────────────────────────

  it('addNode appends a node to the nodes array', () => {
    const node = makeNode('n1', { label: 'Server' });
    useCanvasStore.getState().addNode(node);

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
  });

  it('addNode preserves the data payload', () => {
    const node = makeNode('n1', { label: 'DB', kind: 'postgres' });
    useCanvasStore.getState().addNode(node);

    const stored = useCanvasStore.getState().nodes[0];
    expect(stored.data).toEqual({ label: 'DB', kind: 'postgres' });
  });

  it('addNode does not overwrite existing nodes', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().addNode(makeNode('b'));

    expect(useCanvasStore.getState().nodes).toHaveLength(2);
  });

  // ── removeNodes ────────────────────────────────────────────────────────

  it('removeNodes removes nodes by id', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().addNode(makeNode('b'));
    useCanvasStore.getState().addNode(makeNode('c'));

    useCanvasStore.getState().removeNodes(['b']);

    const ids = useCanvasStore.getState().nodes.map((n) => n.id);
    expect(ids).toEqual(['a', 'c']);
  });

  it('removeNodes also removes connected edges', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().addNode(makeNode('b'));
    useCanvasStore.getState().addEdge(makeEdge('e1', 'a', 'b'));

    useCanvasStore.getState().removeNodes(['b']);

    expect(useCanvasStore.getState().edges).toHaveLength(0);
  });

  it('removeNodes clears selected IDs for removed nodes', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().addNode(makeNode('b'));
    useCanvasStore.getState().setSelectedNodeIds(['a', 'b']);

    useCanvasStore.getState().removeNodes(['a']);

    expect(useCanvasStore.getState().selectedNodeIds).toEqual(['b']);
  });

  it('removeNodes with empty array leaves nodes unchanged', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().removeNodes([]);

    expect(useCanvasStore.getState().nodes).toHaveLength(1);
  });

  // ── updateNodeData ─────────────────────────────────────────────────────

  it('updateNodeData merges partial data into an existing node', () => {
    useCanvasStore.getState().addNode(makeNode('n1', { label: 'A', count: 1 }));
    useCanvasStore.getState().updateNodeData('n1', { count: 2 });

    const data = useCanvasStore.getState().nodes[0].data;
    expect(data).toEqual({ label: 'A', count: 2 });
  });

  it('updateNodeData adds new keys without removing existing ones', () => {
    useCanvasStore.getState().addNode(makeNode('n1', { label: 'X' }));
    useCanvasStore.getState().updateNodeData('n1', { status: 'active' });

    const data = useCanvasStore.getState().nodes[0].data;
    expect(data).toEqual({ label: 'X', status: 'active' });
  });

  it('updateNodeData is a no-op for a non-existent id', () => {
    useCanvasStore.getState().addNode(makeNode('n1', { label: 'A' }));
    useCanvasStore.getState().updateNodeData('missing', { label: 'B' });

    // Original should be unchanged
    expect(useCanvasStore.getState().nodes[0].data).toEqual({ label: 'A' });
  });

  // ── clearCanvas ────────────────────────────────────────────────────────

  it('clearCanvas removes all nodes, edges, selections, and groups', () => {
    useCanvasStore.getState().addNode(makeNode('a'));
    useCanvasStore.getState().addEdge(makeEdge('e1', 'a', 'a'));
    useCanvasStore.getState().setSelectedNodeIds(['a']);
    useCanvasStore.getState().addGroup({
      id: 'g1',
      label: 'Group',
      color: '#ff0000',
      nodeIds: ['a'],
    });

    useCanvasStore.getState().clearCanvas();

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
    expect(state.selectedNodeIds).toHaveLength(0);
    expect(state.selectedEdgeIds).toHaveLength(0);
    expect(state.groups).toHaveLength(0);
  });

  // ── Edges ──────────────────────────────────────────────────────────────

  it('addEdge appends an edge to the edges array', () => {
    useCanvasStore.getState().addEdge(makeEdge('e1', 'a', 'b'));

    expect(useCanvasStore.getState().edges).toHaveLength(1);
    expect(useCanvasStore.getState().edges[0].id).toBe('e1');
  });

  it('removeEdges removes edges by id and clears their selection', () => {
    useCanvasStore.getState().addEdge(makeEdge('e1', 'a', 'b'));
    useCanvasStore.getState().addEdge(makeEdge('e2', 'b', 'c'));
    useCanvasStore.getState().setSelectedEdgeIds(['e1', 'e2']);

    useCanvasStore.getState().removeEdges(['e1']);

    expect(useCanvasStore.getState().edges.map((e) => e.id)).toEqual(['e2']);
    expect(useCanvasStore.getState().selectedEdgeIds).toEqual(['e2']);
  });

  // ── Selection ──────────────────────────────────────────────────────────

  it('clearSelection empties both node and edge selection', () => {
    useCanvasStore.getState().setSelectedNodeIds(['a']);
    useCanvasStore.getState().setSelectedEdgeIds(['e1']);

    useCanvasStore.getState().clearSelection();

    expect(useCanvasStore.getState().selectedNodeIds).toHaveLength(0);
    expect(useCanvasStore.getState().selectedEdgeIds).toHaveLength(0);
  });

  // ── setEdges with function updater ─────────────────────────────────────

  it('setEdges accepts a function updater', () => {
    useCanvasStore.getState().addEdge(makeEdge('e1', 'a', 'b'));
    useCanvasStore
      .getState()
      .setEdges((prev) => [...prev, makeEdge('e2', 'b', 'c')]);

    expect(useCanvasStore.getState().edges).toHaveLength(2);
  });

  // ── Groups ─────────────────────────────────────────────────────────────

  it('addGroup, updateGroup, removeGroup lifecycle works', () => {
    const store = useCanvasStore.getState;

    store().addGroup({
      id: 'g1',
      label: 'Services',
      color: '#00ff00',
      nodeIds: [],
    });
    expect(store().groups).toHaveLength(1);

    store().updateGroup('g1', { label: 'Databases' });
    expect(store().groups[0].label).toBe('Databases');

    store().removeGroup('g1');
    expect(store().groups).toHaveLength(0);
  });
});
