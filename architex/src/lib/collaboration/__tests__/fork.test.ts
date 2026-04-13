import { describe, it, expect, vi } from "vitest";
import { forkDesign, type ForkableDesign } from "@/lib/collaboration/fork";
import type { Node, Edge } from "@xyflow/react";

// -- Helpers ---------------------------------------------------

function makeDesign(
  overrides: Partial<ForkableDesign> = {},
): ForkableDesign {
  return {
    title: "Original",
    nodes: [
      { id: "n1", position: { x: 0, y: 0 }, data: {} },
      { id: "n2", position: { x: 100, y: 100 }, data: {} },
    ] as Node[],
    edges: [
      { id: "e1", source: "n1", target: "n2" },
    ] as Edge[],
    ...overrides,
  };
}

// -- ID remapping ----------------------------------------------

describe("fork ID remapping", () => {
  it("assigns new IDs to all forked nodes", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "alice");

    const originalIds = design.nodes.map((n) => n.id);
    for (const node of forked.nodes) {
      expect(originalIds).not.toContain(node.id);
    }
  });

  it("assigns new IDs to all forked edges", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "alice");

    const originalIds = design.edges.map((e) => e.id);
    for (const edge of forked.edges) {
      expect(originalIds).not.toContain(edge.id);
    }
  });

  it("generates unique IDs across nodes", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "alice");

    const ids = forked.nodes.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("generates unique IDs across edges", () => {
    const design = makeDesign({
      edges: [
        { id: "e1", source: "n1", target: "n2" },
        { id: "e2", source: "n2", target: "n1" },
      ] as Edge[],
    });
    const forked = forkDesign(design, "alice");

    const ids = forked.edges.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// -- Edge source/target update ---------------------------------

describe("fork edge source/target remapping", () => {
  it("remaps edge source and target to new node IDs", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "alice");

    const newNodeIds = new Set(forked.nodes.map((n) => n.id));
    for (const edge of forked.edges) {
      expect(newNodeIds.has(edge.source)).toBe(true);
      expect(newNodeIds.has(edge.target)).toBe(true);
    }
  });

  it("preserves correct source-target relationships", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "alice");

    // The first edge should connect the remapped versions of n1 and n2
    // The order of forked.nodes should match the order of design.nodes
    const newN1 = forked.nodes[0].id;
    const newN2 = forked.nodes[1].id;

    expect(forked.edges[0].source).toBe(newN1);
    expect(forked.edges[0].target).toBe(newN2);
  });
});

// -- Attribution metadata --------------------------------------

describe("fork attribution metadata", () => {
  it("includes forkedFrom with correct author", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "bob");

    expect(forked.forkedFrom).toBeDefined();
    expect(forked.forkedFrom.author).toBe("bob");
  });

  it("includes the original title in forkedFrom", () => {
    const design = makeDesign({ title: "My Design" });
    const forked = forkDesign(design, "bob");

    expect(forked.forkedFrom.originalTitle).toBe("My Design");
  });

  it("sets forkedAt to a recent timestamp", () => {
    const before = Date.now();
    const design = makeDesign();
    const forked = forkDesign(design, "bob");
    const after = Date.now();

    expect(forked.forkedFrom.forkedAt).toBeGreaterThanOrEqual(before);
    expect(forked.forkedFrom.forkedAt).toBeLessThanOrEqual(after);
  });

  it("appends (fork) to the title", () => {
    const design = makeDesign({ title: "Chat System" });
    const forked = forkDesign(design, "carol");

    expect(forked.title).toBe("Chat System (fork)");
  });

  it("preserves node count and edge count", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "dave");

    expect(forked.nodes).toHaveLength(design.nodes.length);
    expect(forked.edges).toHaveLength(design.edges.length);
  });

  it("produces a deep clone -- modifying original does not affect fork", () => {
    const design = makeDesign();
    const forked = forkDesign(design, "eve");

    // Mutate original
    (design.nodes[0].data as Record<string, unknown>).dirty = true;

    expect((forked.nodes[0].data as Record<string, unknown>).dirty).toBeUndefined();
  });
});
