import { describe, it, expect } from "vitest";
import {
  createShareableLink,
  parseShareableLink,
  type ShareableDiagram,
} from "@/lib/collaboration/shareable-links";
import type { Node, Edge } from "@xyflow/react";

// -- Helpers ---------------------------------------------------

function makeDiagram(
  overrides: Partial<ShareableDiagram> = {},
): ShareableDiagram {
  return {
    title: "Test Diagram",
    nodes: [{ id: "n1", position: { x: 0, y: 0 }, data: {} }] as Node[],
    edges: [] as Edge[],
    version: 1,
    ...overrides,
  };
}

// -- Round-trip ------------------------------------------------

describe("shareable-links round-trip", () => {
  it("round-trips a simple diagram through compress/decompress", () => {
    const diagram = makeDiagram();
    const linkResult = createShareableLink(diagram);
    expect(linkResult.ok).toBe(true);

    if (!linkResult.ok) return;
    const parsed = parseShareableLink(linkResult.url);
    expect(parsed.ok).toBe(true);

    if (!parsed.ok) return;
    expect(parsed.diagram.title).toBe("Test Diagram");
    expect(parsed.diagram.nodes).toHaveLength(1);
    expect(parsed.diagram.edges).toHaveLength(0);
    expect(parsed.diagram.version).toBe(1);
  });

  it("preserves node positions through round-trip", () => {
    const diagram = makeDiagram({
      nodes: [
        { id: "n1", position: { x: 100, y: 200 }, data: { label: "A" } },
        { id: "n2", position: { x: 300, y: 400 }, data: { label: "B" } },
      ] as Node[],
    });

    const linkResult = createShareableLink(diagram);
    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) return;

    const parsed = parseShareableLink(linkResult.url);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.diagram.nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(parsed.diagram.nodes[1].position).toEqual({ x: 300, y: 400 });
  });

  it("preserves edge data through round-trip", () => {
    const diagram = makeDiagram({
      edges: [
        { id: "e1", source: "n1", target: "n2" },
      ] as Edge[],
    });

    const linkResult = createShareableLink(diagram);
    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) return;

    const parsed = parseShareableLink(linkResult.url);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.diagram.edges).toHaveLength(1);
    expect(parsed.diagram.edges[0].source).toBe("n1");
    expect(parsed.diagram.edges[0].target).toBe("n2");
  });

  it("always stamps version to 1 on creation", () => {
    const diagram = makeDiagram({ version: 99 });
    const linkResult = createShareableLink(diagram);
    expect(linkResult.ok).toBe(true);
    if (!linkResult.ok) return;

    const parsed = parseShareableLink(linkResult.url);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.diagram.version).toBe(1);
  });
});

// -- Max URL length --------------------------------------------

describe("shareable-links max URL length", () => {
  it("rejects a diagram that produces a URL longer than 2048 chars", () => {
    // Create a diagram with enough data to exceed the limit
    const bigNodes: Node[] = Array.from({ length: 200 }, (_, i) => ({
      id: `node-${i}`,
      position: { x: i * 10, y: i * 10 },
      data: { label: `Label-${"X".repeat(50)}-${i}` },
    })) as Node[];

    const diagram = makeDiagram({ nodes: bigNodes });
    const result = createShareableLink(diagram);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("exceeds maximum length");
    }
  });

  it("succeeds when URL is within the 2048 char limit", () => {
    const diagram = makeDiagram();
    const result = createShareableLink(diagram);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.url.length).toBeLessThanOrEqual(2048);
    }
  });
});

// -- Invalid data handling ------------------------------------

describe("shareable-links invalid data", () => {
  it("returns error for a completely invalid URL string", () => {
    const result = parseShareableLink("not a url");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid URL");
    }
  });

  it("returns error when the 'd' parameter is missing", () => {
    const result = parseShareableLink("https://architex.app/?foo=bar");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain('Missing "d" parameter');
    }
  });

  it("returns error for corrupted compressed data", () => {
    const result = parseShareableLink(
      "https://architex.app/?d=notvalidcompresseddata!!!",
    );
    expect(result.ok).toBe(false);
  });

  it("returns error when decompressed data is not valid JSON diagram", () => {
    // Manually compress something that is valid JSON but not a diagram
    const LZString = require("lz-string") as typeof import("lz-string");
    const compressed = LZString.compressToEncodedURIComponent(
      JSON.stringify({ foo: "bar" }),
    );
    const result = parseShareableLink(
      `https://architex.app/?d=${compressed}`,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Invalid diagram data");
    }
  });
});
