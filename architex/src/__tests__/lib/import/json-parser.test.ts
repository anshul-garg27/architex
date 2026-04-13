import { describe, it, expect } from "vitest";
import { parseArchitexJSON } from "@/lib/import/json-parser";
import { exportToJSON } from "@/lib/export/to-json";
import type { Node, Edge } from "@xyflow/react";

// ── Test Fixtures ──────────────────────────────────────────────

function sampleNodes(): Node[] {
  return [
    {
      id: "n1",
      type: "system-design",
      position: { x: 100, y: 200 },
      data: {
        label: "Web Server",
        category: "compute",
        componentType: "web-server",
      },
    },
    {
      id: "n2",
      type: "system-design",
      position: { x: 300, y: 400 },
      data: {
        label: "Database",
        category: "storage",
        componentType: "postgres",
      },
    },
  ];
}

function sampleEdges(): Edge[] {
  return [
    {
      id: "e1",
      source: "n1",
      target: "n2",
      type: "default",
      sourceHandle: "out-0",
      targetHandle: "in-0",
      data: { edgeType: "db-query", latency: 5 },
    },
  ];
}

function validDiagramJSON(): object {
  return exportToJSON(sampleNodes(), sampleEdges(), "Test Diagram");
}

// ── Tests ──────────────────────────────────────────────────────

describe("parseArchitexJSON", () => {
  // ── Successful Parsing ────────────────────────────────────

  it("parses a valid Architex JSON object", () => {
    const result = parseArchitexJSON(validDiagramJSON());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.nodes).toHaveLength(2);
    expect(result.data.edges).toHaveLength(1);
    expect(result.data.metadata.version).toBe("1.0");
    expect(result.data.metadata.name).toBe("Test Diagram");
  });

  it("parses a valid JSON string", () => {
    const jsonStr = JSON.stringify(validDiagramJSON());
    const result = parseArchitexJSON(jsonStr);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.nodes).toHaveLength(2);
    expect(result.data.edges).toHaveLength(1);
  });

  it("preserves node positions and data", () => {
    const result = parseArchitexJSON(validDiagramJSON());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(result.data.nodes[0].data).toEqual(
      expect.objectContaining({ label: "Web Server" }),
    );
  });

  it("preserves edge handles and data", () => {
    const result = parseArchitexJSON(validDiagramJSON());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.edges[0].sourceHandle).toBe("out-0");
    expect(result.data.edges[0].targetHandle).toBe("in-0");
    expect(result.data.edges[0].data).toEqual(
      expect.objectContaining({ edgeType: "db-query" }),
    );
  });

  it("extracts metadata from the diagram", () => {
    const result = parseArchitexJSON(validDiagramJSON());
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.metadata.nodeCount).toBe(2);
    expect(result.data.metadata.edgeCount).toBe(1);
    expect(result.data.metadata.moduleType).toBe("compute");
  });

  // ── Version Detection ─────────────────────────────────────

  it("detects version from the version field", () => {
    const result = parseArchitexJSON(validDiagramJSON());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.metadata.version).toBe("1.0");
  });

  it("infers version 1.0 when nodes/edges arrays present but no version field", () => {
    const obj = { nodes: [], edges: [] };
    const result = parseArchitexJSON(obj);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.metadata.version).toBe("1.0");
  });

  it("rejects unsupported version", () => {
    const obj = { version: "99.0", nodes: [], edges: [] };
    const result = parseArchitexJSON(obj);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].path).toBe("$.version");
    expect(result.errors[0].message).toContain("Unsupported version");
  });

  // ── Error Handling ────────────────────────────────────────

  it("returns error for invalid JSON string", () => {
    const result = parseArchitexJSON("{bad json");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].path).toBe("$");
    expect(result.errors[0].message).toContain("Invalid JSON");
  });

  it("returns error for non-object root", () => {
    const result = parseArchitexJSON("[]");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].message).toContain("Expected a JSON object");
  });

  it("returns error for missing nodes array", () => {
    const result = parseArchitexJSON({ version: "1.0", edges: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "$.nodes",
          message: expect.stringContaining("nodes"),
        }),
      ]),
    );
  });

  it("returns error for missing edges array", () => {
    const result = parseArchitexJSON({ version: "1.0", nodes: [] });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "$.edges" }),
      ]),
    );
  });

  it("returns error for node with missing id", () => {
    const obj = {
      version: "1.0",
      nodes: [{ type: "test", position: { x: 0, y: 0 } }],
      edges: [],
    };
    const result = parseArchitexJSON(obj);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].path).toBe("$.nodes[0].id");
  });

  it("returns error for node with invalid position", () => {
    const obj = {
      version: "1.0",
      nodes: [{ id: "n1", type: "test", position: "bad" }],
      edges: [],
    };
    const result = parseArchitexJSON(obj);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].path).toBe("$.nodes[0].position");
  });

  it("returns error for edge with missing source", () => {
    const obj = {
      version: "1.0",
      nodes: [],
      edges: [{ id: "e1", target: "n2" }],
    };
    const result = parseArchitexJSON(obj);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0].path).toBe("$.edges[0].source");
  });

  // ── Roundtrip ─────────────────────────────────────────────

  it("roundtrips through export -> parse", () => {
    const exported = exportToJSON(sampleNodes(), sampleEdges(), "Roundtrip");
    const result = parseArchitexJSON(exported);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.nodes.map((n) => n.id)).toEqual(["n1", "n2"]);
    expect(result.data.edges.map((e) => e.id)).toEqual(["e1"]);
    expect(result.data.metadata.name).toBe("Roundtrip");
  });

  it("handles empty diagram", () => {
    const result = parseArchitexJSON({ version: "1.0", nodes: [], edges: [] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.nodes).toEqual([]);
    expect(result.data.edges).toEqual([]);
  });
});
