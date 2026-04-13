import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before imports
vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/import/format-detector", () => ({
  detectFormat: vi.fn(() => "unknown"),
}));

vi.mock("@/lib/import/json-parser", () => ({
  parseArchitexJSON: vi.fn(() => ({
    ok: true,
    data: {
      nodes: [{ id: "j1", position: { x: 0, y: 0 }, data: {} }],
      edges: [],
    },
  })),
}));

vi.mock("@/lib/import/mermaid-parser", () => ({
  parseMermaidDiagram: vi.fn(() => ({
    ok: true,
    nodes: [{ id: "m1", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  })),
}));

vi.mock("@/lib/import/drawio-parser", () => ({
  parseDrawioXML: vi.fn(() => ({
    ok: true,
    nodes: [{ id: "d1", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  })),
}));

vi.mock("@/lib/import/yaml-parser", () => ({
  parseYAMLArchitecture: vi.fn(() => ({
    ok: true,
    nodes: [{ id: "y1", position: { x: 0, y: 0 }, data: {} }],
    edges: [],
  })),
}));

import { handleFileDrop } from "@/lib/import/drag-drop-handler";

// -- Helpers ---------------------------------------------------

function makeFile(name: string, content: string): File {
  return new File([content], name, { type: "text/plain" });
}

// -- Tests ----------------------------------------------------

describe("drag-drop-handler file type acceptance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null for an empty file list", async () => {
    const result = await handleFileDrop([]);
    expect(result).toBeNull();
  });

  it("rejects files with unsupported extensions", async () => {
    const file = makeFile("picture.png", "binary");
    const result = await handleFileDrop([file]);
    expect(result).toBeNull();
  });

  it("accepts a .json file and returns 'json' format", async () => {
    const file = makeFile(
      "diagram.json",
      JSON.stringify({ nodes: [], edges: [] }),
    );
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("json");
    expect(result!.fileName).toBe("diagram.json");
  });

  it("accepts a .drawio file and returns 'drawio' format", async () => {
    const file = makeFile("diagram.drawio", "<mxGraphModel></mxGraphModel>");
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("drawio");
  });

  it("accepts a .yaml file and returns 'yaml' format", async () => {
    const file = makeFile("arch.yaml", "services:\n  web:\n    port: 8080");
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("yaml");
  });

  it("accepts a .yml file and returns 'yaml' format", async () => {
    const file = makeFile("arch.yml", "services:\n  api:\n    port: 3000");
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("yaml");
  });
});

describe("drag-drop-handler extension mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps .xml extension to 'drawio' format", async () => {
    const file = makeFile("data.xml", "<mxGraphModel></mxGraphModel>");
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("drawio");
  });

  it("maps .mmd extension to 'mermaid' format", async () => {
    const file = makeFile("flow.mmd", "graph TD\n  A-->B");
    const result = await handleFileDrop([file]);
    expect(result).not.toBeNull();
    expect(result!.format).toBe("mermaid");
  });

  it("picks the first valid file from a mixed list", async () => {
    const invalidFile = makeFile("image.png", "binary");
    const validFile = makeFile(
      "diagram.json",
      JSON.stringify({ nodes: [], edges: [] }),
    );
    const result = await handleFileDrop([invalidFile, validFile]);
    expect(result).not.toBeNull();
    expect(result!.fileName).toBe("diagram.json");
  });
});
