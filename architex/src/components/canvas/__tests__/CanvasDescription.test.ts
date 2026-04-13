import { describe, it, expect } from "vitest";
import type { Node, Edge } from "@xyflow/react";
import { generateCanvasDescription } from "../CanvasDescription";

// ── Helpers ──────────────────────────────────────────────────

function makeNode(
  id: string,
  type: string,
  label: string,
  position = { x: 0, y: 0 },
): Node {
  return { id, type, position, data: { label } };
}

function makeEdge(id: string, source: string, target: string): Edge {
  return { id, source, target };
}

// ── Tests ────────────────────────────────────────────────────

describe("generateCanvasDescription", () => {
  it("returns empty canvas message when there are no nodes", () => {
    const result = generateCanvasDescription([], []);
    expect(result).toBe(
      "Empty canvas. Drag components from the sidebar to begin designing.",
    );
  });

  it("describes a single node with no connections", () => {
    const nodes = [makeNode("n1", "load-balancer", "Main LB")];
    const result = generateCanvasDescription(nodes, []);

    expect(result).toContain("System design with 1 node");
    expect(result).toContain("1 Load Balancer");
    expect(result).toContain("0 connections");
    expect(result).toContain("Load Balancer: Main LB");
  });

  it("pluralizes node type counts correctly", () => {
    const nodes = [
      makeNode("n1", "load-balancer", "LB-1"),
      makeNode("n2", "load-balancer", "LB-2"),
      makeNode("n3", "database", "Users DB"),
    ];
    const result = generateCanvasDescription(nodes, []);

    expect(result).toContain("3 nodes");
    expect(result).toContain("2 Load Balancers");
    expect(result).toContain("1 Database");
  });

  it("correctly counts connections", () => {
    const nodes = [
      makeNode("n1", "load-balancer", "LB"),
      makeNode("n2", "web-server", "Web-1"),
      makeNode("n3", "web-server", "Web-2"),
    ];
    const edges = [
      makeEdge("e1", "n1", "n2"),
      makeEdge("e2", "n1", "n3"),
    ];
    const result = generateCanvasDescription(nodes, edges);

    expect(result).toContain("2 connections");
  });

  it("lists node names grouped by type", () => {
    const nodes = [
      makeNode("n1", "web-server", "API-1"),
      makeNode("n2", "web-server", "API-2"),
      makeNode("n3", "cache", "Redis"),
    ];
    const result = generateCanvasDescription(nodes, []);

    expect(result).toContain("Web Servers: API-1, API-2");
    expect(result).toContain("Cache: Redis");
  });

  it("describes topology when edges exist", () => {
    const nodes = [
      makeNode("n1", "load-balancer", "LB"),
      makeNode("n2", "web-server", "Web-1"),
      makeNode("n3", "database", "DB"),
    ];
    const edges = [
      makeEdge("e1", "n1", "n2"),
      makeEdge("e2", "n2", "n3"),
    ];
    const result = generateCanvasDescription(nodes, edges);

    expect(result).toContain("Topology:");
    expect(result).toContain("Load Balancer connects to Web Server");
    expect(result).toContain("Web Server connects to Database");
  });

  it("describes topology with multiple targets", () => {
    const nodes = [
      makeNode("n1", "load-balancer", "LB"),
      makeNode("n2", "web-server", "Web-1"),
      makeNode("n3", "cache", "Redis"),
      makeNode("n4", "database", "Postgres"),
    ];
    const edges = [
      makeEdge("e1", "n1", "n2"),
      makeEdge("e2", "n1", "n3"),
      makeEdge("e3", "n1", "n4"),
    ];
    const result = generateCanvasDescription(nodes, edges);

    expect(result).toContain("Load Balancer connects to");
    // Should list multiple targets
    expect(result).toMatch(/Web Server.*Cache|Cache.*Web Server/);
  });

  it("falls back to title-cased type for unknown node types", () => {
    const nodes = [makeNode("n1", "custom-thingy", "My Node")];
    const result = generateCanvasDescription(nodes, []);

    expect(result).toContain("Custom Thingy");
  });

  it("uses node id when label is missing", () => {
    const nodes: Node[] = [
      { id: "xyz-123", type: "database", position: { x: 0, y: 0 }, data: {} },
    ];
    const result = generateCanvasDescription(nodes, []);

    expect(result).toContain("xyz-123");
  });

  it("handles the full example from the spec", () => {
    const nodes = [
      makeNode("n1", "load-balancer", "LB-1"),
      makeNode("n2", "load-balancer", "LB-2"),
      makeNode("n3", "web-server", "Service-1"),
      makeNode("n4", "web-server", "Service-2"),
      makeNode("n5", "web-server", "Service-3"),
      makeNode("n6", "database", "Primary DB"),
      makeNode("n7", "database", "Replica DB"),
      makeNode("n8", "cache", "Redis"),
    ];
    const edges = [
      makeEdge("e1", "n1", "n3"),
      makeEdge("e2", "n1", "n4"),
      makeEdge("e3", "n1", "n5"),
      makeEdge("e4", "n2", "n3"),
      makeEdge("e5", "n2", "n4"),
      makeEdge("e6", "n2", "n5"),
      makeEdge("e7", "n3", "n6"),
      makeEdge("e8", "n4", "n6"),
      makeEdge("e9", "n5", "n7"),
      makeEdge("e10", "n3", "n8"),
      makeEdge("e11", "n4", "n8"),
      makeEdge("e12", "n5", "n8"),
    ];
    const result = generateCanvasDescription(nodes, edges);

    expect(result).toContain("8 nodes");
    expect(result).toContain("2 Load Balancers");
    expect(result).toContain("3 Web Servers");
    expect(result).toContain("2 Databases");
    expect(result).toContain("1 Cache");
    expect(result).toContain("12 connections");
  });
});
