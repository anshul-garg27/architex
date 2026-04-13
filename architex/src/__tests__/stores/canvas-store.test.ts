import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '@/stores/canvas-store';
import type { Node, Edge } from '@xyflow/react';

// Helper to reset the store between tests
function resetStore() {
  useCanvasStore.getState().clearCanvas();
}

function makeNode(id: string, overrides?: Partial<Node>): Node {
  return {
    id,
    position: { x: 0, y: 0 },
    data: { label: id },
    ...overrides,
  };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

describe('canvas-store', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── addNode ──────────────────────────────────────────────

  it('addNode appends a node to the store', () => {
    const store = useCanvasStore.getState();
    const node = makeNode('n1');

    store.addNode(node);

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('n1');
  });

  it('addNode does not remove existing nodes', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('n1'));
    store.addNode(makeNode('n2'));

    const { nodes } = useCanvasStore.getState();
    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.id)).toEqual(['n1', 'n2']);
  });

  // ── removeNodes (cascading edges) ────────────────────────

  it('removeNodes removes the node and cascades to connected edges', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('a'));
    store.addNode(makeNode('b'));
    store.addNode(makeNode('c'));
    store.addEdge(makeEdge('e1', 'a', 'b'));
    store.addEdge(makeEdge('e2', 'b', 'c'));
    store.addEdge(makeEdge('e3', 'a', 'c'));

    // Remove node 'b' — should also remove edges e1 and e2
    useCanvasStore.getState().removeNodes(['b']);

    const state = useCanvasStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes.map((n) => n.id)).toEqual(['a', 'c']);
    expect(state.edges).toHaveLength(1);
    expect(state.edges[0].id).toBe('e3');
  });

  it('removeNodes clears the node from selectedNodeIds', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('x'));
    store.setSelectedNodeIds(['x']);

    useCanvasStore.getState().removeNodes(['x']);

    expect(useCanvasStore.getState().selectedNodeIds).toEqual([]);
  });

  // ── updateNodeData ───────────────────────────────────────

  it('updateNodeData merges new data into the target node', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('n1', { data: { label: 'Original', count: 0 } }));

    useCanvasStore.getState().updateNodeData('n1', { count: 42, extra: true });

    const node = useCanvasStore.getState().nodes[0];
    expect(node.data).toEqual({ label: 'Original', count: 42, extra: true });
  });

  it('updateNodeData does not affect other nodes', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('n1', { data: { label: 'A' } }));
    store.addNode(makeNode('n2', { data: { label: 'B' } }));

    useCanvasStore.getState().updateNodeData('n1', { label: 'A-updated' });

    const [n1, n2] = useCanvasStore.getState().nodes;
    expect(n1.data.label).toBe('A-updated');
    expect(n2.data.label).toBe('B');
  });

  // ── clearCanvas ──────────────────────────────────────────

  it('clearCanvas resets nodes, edges, selections, and groups', () => {
    const store = useCanvasStore.getState();
    store.addNode(makeNode('n1'));
    store.addEdge(makeEdge('e1', 'n1', 'n1'));
    store.setSelectedNodeIds(['n1']);
    store.addGroup({ id: 'g1', label: 'Group', color: '#000', nodeIds: ['n1'] });

    useCanvasStore.getState().clearCanvas();

    const state = useCanvasStore.getState();
    expect(state.nodes).toEqual([]);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodeIds).toEqual([]);
    expect(state.selectedEdgeIds).toEqual([]);
    expect(state.groups).toEqual([]);
  });
});
