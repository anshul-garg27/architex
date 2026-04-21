import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore, canvasUndoManager } from "@/stores/canvas-store";

describe("canvas-store · named snapshots", () => {
  beforeEach(() => {
    canvasUndoManager.clear();
    useCanvasStore.setState({
      nodes: [],
      edges: [],
      groups: [],
      namedSnapshots: [],
      activeDesignId: null,
    });
  });

  it("pushNamedSnapshot captures current canvas with label + note", () => {
    useCanvasStore.setState({
      nodes: [{ id: "a", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore
      .getState()
      .pushNamedSnapshot("Before refactor", "Split the God class");
    const snaps = useCanvasStore.getState().namedSnapshots;
    expect(snaps).toHaveLength(1);
    expect(snaps[0]?.label).toBe("Before refactor");
    expect(snaps[0]?.nodes).toHaveLength(1);
  });

  it("restoreNamedSnapshot swaps nodes/edges back", () => {
    useCanvasStore.setState({
      nodes: [{ id: "a", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore.getState().pushNamedSnapshot("Checkpoint", null);
    useCanvasStore.setState({ nodes: [] });
    const snap = useCanvasStore.getState().namedSnapshots[0]!;
    useCanvasStore.getState().restoreNamedSnapshot(snap.id);
    expect(useCanvasStore.getState().nodes).toHaveLength(1);
  });

  it("deleteNamedSnapshot removes by id", () => {
    useCanvasStore.getState().pushNamedSnapshot("A", null);
    useCanvasStore.getState().pushNamedSnapshot("B", null);
    const [a, b] = useCanvasStore.getState().namedSnapshots;
    useCanvasStore.getState().deleteNamedSnapshot(a!.id);
    expect(useCanvasStore.getState().namedSnapshots.map((s) => s.id)).toEqual([
      b!.id,
    ]);
  });
});
