import { describe, it, expect, beforeEach } from "vitest";
import { useCanvasStore } from "@/stores/canvas-store";

describe("canvas-store · annotations + notes", () => {
  beforeEach(() => {
    useCanvasStore.setState({ annotations: [], nodes: [] });
  });

  it("addAnnotation inserts with generated id", () => {
    useCanvasStore.getState().addAnnotation({
      kind: "sticky-note",
      nodeId: null,
      x: 100,
      y: 200,
      body: "Consider caching here",
      color: "amber",
      meta: {},
    });
    const list = useCanvasStore.getState().annotations;
    expect(list).toHaveLength(1);
    expect(list[0]?.body).toBe("Consider caching here");
    expect(list[0]?.id).toBeTruthy();
  });

  it("updateAnnotation merges fields", () => {
    useCanvasStore.getState().addAnnotation({
      kind: "sticky-note",
      nodeId: null,
      x: 0,
      y: 0,
      body: "old",
      color: "amber",
      meta: {},
    });
    const id = useCanvasStore.getState().annotations[0]!.id;
    useCanvasStore.getState().updateAnnotation(id, { body: "new" });
    expect(useCanvasStore.getState().annotations[0]?.body).toBe("new");
  });

  it("updateNodeNotes stores note string on node data", () => {
    useCanvasStore.setState({
      nodes: [{ id: "n1", type: "class", position: { x: 0, y: 0 }, data: {} }],
    });
    useCanvasStore.getState().updateNodeNotes("n1", "Remember: guard invariant");
    const node = useCanvasStore.getState().nodes.find((n) => n.id === "n1");
    expect((node?.data as { notes?: string }).notes).toBe(
      "Remember: guard invariant",
    );
  });
});
