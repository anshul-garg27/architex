import { describe, it, expect } from "vitest";
import {
  diffDiagrams,
  type DiagramSnapshot,
} from "@/lib/version-history/diff-engine";
import type { Node, Edge } from "@xyflow/react";

// ── Test Fixtures ──────────────────────────────────────────────

function makeNode(
  id: string,
  label: string,
  position = { x: 0, y: 0 },
  extra: Record<string, unknown> = {},
): Node {
  return {
    id,
    type: "system-design",
    position,
    data: { label, category: "compute", componentType: "web-server", ...extra },
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  extra: Record<string, unknown> = {},
): Edge {
  return { id, source, target, type: "default", data: extra };
}

function snapshot(nodes: Node[], edges: Edge[]): DiagramSnapshot {
  return { nodes, edges };
}

// ── Tests ──────────────────────────────────────────────────────

describe("diffDiagrams", () => {
  // ── No Changes ────────────────────────────────────────────

  it("reports no differences for identical diagrams", () => {
    const s = snapshot(
      [makeNode("n1", "Server")],
      [makeEdge("e1", "n1", "n2")],
    );
    const diff = diffDiagrams(s, s);

    expect(diff.nodes.added).toHaveLength(0);
    expect(diff.nodes.removed).toHaveLength(0);
    expect(diff.nodes.modified).toHaveLength(0);
    expect(diff.nodes.unchanged).toEqual(["n1"]);
    expect(diff.edges.unchanged).toEqual(["e1"]);
    expect(diff.summary).toEqual(["No differences found"]);
  });

  // ── Added Nodes ───────────────────────────────────────────

  it("detects added nodes", () => {
    const before = snapshot([makeNode("n1", "Server")], []);
    const after = snapshot(
      [makeNode("n1", "Server"), makeNode("n2", "Database")],
      [],
    );
    const diff = diffDiagrams(before, after);

    expect(diff.nodes.added).toHaveLength(1);
    expect(diff.nodes.added[0].id).toBe("n2");
    expect(diff.summary[0]).toContain("1 node(s) added");
    expect(diff.summary[0]).toContain("Database");
  });

  // ── Removed Nodes ─────────────────────────────────────────

  it("detects removed nodes", () => {
    const before = snapshot(
      [makeNode("n1", "Server"), makeNode("n2", "Cache")],
      [],
    );
    const after = snapshot([makeNode("n1", "Server")], []);
    const diff = diffDiagrams(before, after);

    expect(diff.nodes.removed).toHaveLength(1);
    expect(diff.nodes.removed[0].id).toBe("n2");
    expect(diff.summary).toEqual(
      expect.arrayContaining([expect.stringContaining("1 node(s) removed")]),
    );
  });

  // ── Modified Nodes ────────────────────────────────────────

  it("detects modified node data", () => {
    const before = snapshot(
      [makeNode("n1", "Server", { x: 0, y: 0 }, { config: { replicas: 1 } })],
      [],
    );
    const after = snapshot(
      [makeNode("n1", "Server", { x: 0, y: 0 }, { config: { replicas: 3 } })],
      [],
    );
    const diff = diffDiagrams(before, after);

    expect(diff.nodes.modified).toHaveLength(1);
    expect(diff.nodes.modified[0].id).toBe("n1");

    const configChange = diff.nodes.modified[0].changes.find(
      (c) => c.field === "data.config",
    );
    expect(configChange).toBeDefined();
    expect(configChange?.before).toEqual({ replicas: 1 });
    expect(configChange?.after).toEqual({ replicas: 3 });
  });

  it("detects node position changes", () => {
    const before = snapshot(
      [makeNode("n1", "Server", { x: 100, y: 200 })],
      [],
    );
    const after = snapshot(
      [makeNode("n1", "Server", { x: 500, y: 200 })],
      [],
    );
    const diff = diffDiagrams(before, after);

    expect(diff.nodes.modified).toHaveLength(1);
    const posChange = diff.nodes.modified[0].changes.find(
      (c) => c.field === "position",
    );
    expect(posChange).toBeDefined();
    expect(posChange?.before).toEqual({ x: 100, y: 200 });
    expect(posChange?.after).toEqual({ x: 500, y: 200 });
  });

  it("detects node label changes", () => {
    const before = snapshot([makeNode("n1", "Server A")], []);
    const after = snapshot([makeNode("n1", "Server B")], []);
    const diff = diffDiagrams(before, after);

    expect(diff.nodes.modified).toHaveLength(1);
    const labelChange = diff.nodes.modified[0].changes.find(
      (c) => c.field === "data.label",
    );
    expect(labelChange).toBeDefined();
    expect(labelChange?.before).toBe("Server A");
    expect(labelChange?.after).toBe("Server B");
  });

  // ── Added / Removed Edges ─────────────────────────────────

  it("detects added edges", () => {
    const before = snapshot([], []);
    const after = snapshot([], [makeEdge("e1", "n1", "n2")]);
    const diff = diffDiagrams(before, after);

    expect(diff.edges.added).toHaveLength(1);
    expect(diff.edges.added[0].id).toBe("e1");
    expect(diff.summary).toEqual(
      expect.arrayContaining([expect.stringContaining("1 edge(s) added")]),
    );
  });

  it("detects removed edges", () => {
    const before = snapshot([], [makeEdge("e1", "n1", "n2")]);
    const after = snapshot([], []);
    const diff = diffDiagrams(before, after);

    expect(diff.edges.removed).toHaveLength(1);
    expect(diff.edges.removed[0].id).toBe("e1");
  });

  // ── Modified Edges ────────────────────────────────────────

  it("detects modified edge source/target", () => {
    const before = snapshot([], [makeEdge("e1", "n1", "n2")]);
    const after = snapshot([], [makeEdge("e1", "n1", "n3")]);
    const diff = diffDiagrams(before, after);

    expect(diff.edges.modified).toHaveLength(1);
    const targetChange = diff.edges.modified[0].changes.find(
      (c) => c.field === "target",
    );
    expect(targetChange).toBeDefined();
    expect(targetChange?.before).toBe("n2");
    expect(targetChange?.after).toBe("n3");
  });

  it("detects modified edge data", () => {
    const before = snapshot(
      [],
      [makeEdge("e1", "n1", "n2", { latency: 10 })],
    );
    const after = snapshot(
      [],
      [makeEdge("e1", "n1", "n2", { latency: 50 })],
    );
    const diff = diffDiagrams(before, after);

    expect(diff.edges.modified).toHaveLength(1);
    const latencyChange = diff.edges.modified[0].changes.find(
      (c) => c.field === "data.latency",
    );
    expect(latencyChange).toBeDefined();
    expect(latencyChange?.before).toBe(10);
    expect(latencyChange?.after).toBe(50);
  });

  // ── Empty Diagrams ────────────────────────────────────────

  it("handles two empty diagrams", () => {
    const diff = diffDiagrams(snapshot([], []), snapshot([], []));
    expect(diff.summary).toEqual(["No differences found"]);
    expect(diff.nodes.added).toHaveLength(0);
    expect(diff.edges.added).toHaveLength(0);
  });

  // ── Complex Scenario ──────────────────────────────────────

  it("handles mixed adds, removes, and modifications", () => {
    const before = snapshot(
      [
        makeNode("n1", "Server"),
        makeNode("n2", "Cache"),
        makeNode("n3", "DB"),
      ],
      [makeEdge("e1", "n1", "n2"), makeEdge("e2", "n2", "n3")],
    );

    const after = snapshot(
      [
        makeNode("n1", "Server Updated", { x: 999, y: 999 }),
        // n2 removed
        makeNode("n3", "DB"),
        makeNode("n4", "New Queue"), // added
      ],
      [
        // e1 removed (n2 gone)
        makeEdge("e2", "n2", "n3"),
        makeEdge("e3", "n1", "n4"), // added
      ],
    );

    const diff = diffDiagrams(before, after);

    expect(diff.nodes.added).toHaveLength(1);
    expect(diff.nodes.added[0].id).toBe("n4");
    expect(diff.nodes.removed).toHaveLength(1);
    expect(diff.nodes.removed[0].id).toBe("n2");
    expect(diff.nodes.modified).toHaveLength(1);
    expect(diff.nodes.modified[0].id).toBe("n1");
    expect(diff.nodes.unchanged).toEqual(["n3"]);

    expect(diff.edges.added).toHaveLength(1);
    expect(diff.edges.removed).toHaveLength(1);
    expect(diff.edges.unchanged).toEqual(["e2"]);

    // Summary should mention all changes
    expect(diff.summary.length).toBeGreaterThanOrEqual(3);
  });

  // ── Summary Human Readability ─────────────────────────────

  it("includes node labels in summary messages", () => {
    const before = snapshot([], []);
    const after = snapshot(
      [makeNode("n1", "My API Gateway"), makeNode("n2", "Redis Cache")],
      [],
    );
    const diff = diffDiagrams(before, after);

    expect(diff.summary[0]).toContain("My API Gateway");
    expect(diff.summary[0]).toContain("Redis Cache");
  });
});
