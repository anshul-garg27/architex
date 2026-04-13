import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCanvasStore } from "@/stores/canvas-store";
import type { Node, Edge } from "@xyflow/react";

// ── Helpers ──────────────────────────────────────────────────

function makeNode(id: string, label: string, x = 0, y = 0): Node {
  return {
    id,
    type: "web-server",
    position: { x, y },
    data: { label },
  };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

function fireKey(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  window.dispatchEvent(event);
  return event;
}

function setupNodes(nodes: Node[], edges: Edge[] = []) {
  const state = useCanvasStore.getState();
  state.clearCanvas();
  for (const node of nodes) {
    state.addNode(node);
  }
  for (const edge of edges) {
    state.addEdge(edge);
  }
}

// ── Tests ────────────────────────────────────────────────────

/**
 * Note: These tests validate the store-level logic that the
 * useKeyboardNodeOps hook relies on. The hook itself registers
 * a window event listener and calls these store methods.
 * We test the store operations directly for determinism.
 */
describe("keyboard node operations (store-level)", () => {
  beforeEach(() => {
    useCanvasStore.getState().clearCanvas();
  });

  // ── Tab: cycle through nodes ──

  describe("Tab cycling", () => {
    it("selects the first node when nothing is selected", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B"), makeNode("c", "C")]);
      const { nodes, setSelectedNodeIds } = useCanvasStore.getState();

      // Simulate Tab behavior: if no selection, pick index 0
      const currentIndex = -1;
      const nextIndex = currentIndex >= nodes.length - 1 ? 0 : currentIndex + 1;
      setSelectedNodeIds([nodes[nextIndex].id]);

      expect(useCanvasStore.getState().selectedNodeIds).toEqual(["a"]);
    });

    it("cycles forward through nodes", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B"), makeNode("c", "C")]);
      const store = useCanvasStore.getState;

      store().setSelectedNodeIds(["a"]);
      const idx = store().nodes.findIndex((n) => n.id === "a");
      const nextIdx = idx >= store().nodes.length - 1 ? 0 : idx + 1;
      store().setSelectedNodeIds([store().nodes[nextIdx].id]);

      expect(store().selectedNodeIds).toEqual(["b"]);
    });

    it("wraps around at the end", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B")]);
      const store = useCanvasStore.getState;

      store().setSelectedNodeIds(["b"]);
      const idx = store().nodes.findIndex((n) => n.id === "b");
      const nextIdx = idx >= store().nodes.length - 1 ? 0 : idx + 1;
      store().setSelectedNodeIds([store().nodes[nextIdx].id]);

      expect(store().selectedNodeIds).toEqual(["a"]);
    });

    it("cycles backward with Shift+Tab", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B"), makeNode("c", "C")]);
      const store = useCanvasStore.getState;

      store().setSelectedNodeIds(["b"]);
      const idx = store().nodes.findIndex((n) => n.id === "b");
      const prevIdx = idx <= 0 ? store().nodes.length - 1 : idx - 1;
      store().setSelectedNodeIds([store().nodes[prevIdx].id]);

      expect(store().selectedNodeIds).toEqual(["a"]);
    });
  });

  // ── Arrow keys: move nodes ──

  describe("arrow key movement", () => {
    it("moves selected node right by grid increment", () => {
      setupNodes([makeNode("a", "A", 100, 200)]);
      useCanvasStore.getState().setSelectedNodeIds(["a"]);

      const step = 20;
      const { nodes, setNodes, selectedNodeIds } = useCanvasStore.getState();
      const selectedSet = new Set(selectedNodeIds);
      const updated = nodes.map((n) =>
        selectedSet.has(n.id)
          ? { ...n, position: { x: n.position.x + step, y: n.position.y } }
          : n,
      );
      setNodes(updated);

      const node = useCanvasStore.getState().nodes[0];
      expect(node.position).toEqual({ x: 120, y: 200 });
    });

    it("moves selected node up by large increment with Shift", () => {
      setupNodes([makeNode("a", "A", 100, 200)]);
      useCanvasStore.getState().setSelectedNodeIds(["a"]);

      const step = 100;
      const { nodes, setNodes, selectedNodeIds } = useCanvasStore.getState();
      const selectedSet = new Set(selectedNodeIds);
      const updated = nodes.map((n) =>
        selectedSet.has(n.id)
          ? { ...n, position: { x: n.position.x, y: n.position.y - step } }
          : n,
      );
      setNodes(updated);

      const node = useCanvasStore.getState().nodes[0];
      expect(node.position).toEqual({ x: 100, y: 100 });
    });

    it("moves multiple selected nodes simultaneously", () => {
      setupNodes([makeNode("a", "A", 0, 0), makeNode("b", "B", 50, 50)]);
      useCanvasStore.getState().setSelectedNodeIds(["a", "b"]);

      const step = 20;
      const { nodes, setNodes, selectedNodeIds } = useCanvasStore.getState();
      const selectedSet = new Set(selectedNodeIds);
      const updated = nodes.map((n) =>
        selectedSet.has(n.id)
          ? { ...n, position: { x: n.position.x, y: n.position.y + step } }
          : n,
      );
      setNodes(updated);

      const updatedNodes = useCanvasStore.getState().nodes;
      expect(updatedNodes[0].position).toEqual({ x: 0, y: 20 });
      expect(updatedNodes[1].position).toEqual({ x: 50, y: 70 });
    });
  });

  // ── Delete ──

  describe("delete", () => {
    it("removes selected nodes", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B")]);
      useCanvasStore.getState().setSelectedNodeIds(["a"]);
      useCanvasStore.getState().removeNodes(["a"]);

      const nodes = useCanvasStore.getState().nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe("b");
    });

    it("removes connected edges when deleting nodes", () => {
      setupNodes(
        [makeNode("a", "A"), makeNode("b", "B")],
        [makeEdge("e1", "a", "b")],
      );
      useCanvasStore.getState().removeNodes(["a"]);

      expect(useCanvasStore.getState().edges).toHaveLength(0);
    });
  });

  // ── Escape: deselect ──

  describe("escape deselect", () => {
    it("clears all selections", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B")]);
      useCanvasStore.getState().setSelectedNodeIds(["a", "b"]);
      useCanvasStore.getState().setSelectedEdgeIds(["e1"]);

      useCanvasStore.getState().clearSelection();

      const state = useCanvasStore.getState();
      expect(state.selectedNodeIds).toHaveLength(0);
      expect(state.selectedEdgeIds).toHaveLength(0);
    });
  });

  // ── Select all ──

  describe("select all", () => {
    it("selects all nodes", () => {
      setupNodes([makeNode("a", "A"), makeNode("b", "B"), makeNode("c", "C")]);
      const { nodes, setSelectedNodeIds } = useCanvasStore.getState();
      setSelectedNodeIds(nodes.map((n) => n.id));

      expect(useCanvasStore.getState().selectedNodeIds).toEqual(["a", "b", "c"]);
    });
  });
});
