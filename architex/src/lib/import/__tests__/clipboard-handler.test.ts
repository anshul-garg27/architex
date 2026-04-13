import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock external dependencies before imports
vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/lib/import/format-detector", () => ({
  detectFormat: vi.fn((content: string) => {
    if (content.startsWith("{")) return "json";
    if (content.startsWith("<?xml") || content.includes("<mxGraphModel"))
      return "drawio";
    if (/^graph\s+(TD|TB|LR|RL|BT)\b/im.test(content)) return "mermaid";
    if (/^services\s*:/m.test(content)) return "yaml";
    return "unknown";
  }),
}));

vi.mock("@/lib/import/json-parser", () => ({
  parseArchitexJSON: vi.fn((content: string) => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.nodes && parsed.edges) {
        return { ok: true, data: { nodes: parsed.nodes, edges: parsed.edges } };
      }
    } catch { /* empty */ }
    return { ok: false };
  }),
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

import { handleClipboardPaste } from "@/lib/import/clipboard-handler";

// -- Helpers ---------------------------------------------------

function makeClipboardEvent(
  textPlain: string,
  textHtml?: string,
): ClipboardEvent {
  const clipboardData = {
    getData: vi.fn((type: string) => {
      if (type === "text/plain") return textPlain;
      if (type === "text/html") return textHtml ?? "";
      return "";
    }),
  };

  return {
    clipboardData,
    preventDefault: vi.fn(),
  } as unknown as ClipboardEvent;
}

// -- Tests ----------------------------------------------------

describe("clipboard-handler format detection routing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when clipboardData is absent", async () => {
    const event = { clipboardData: null, preventDefault: vi.fn() } as unknown as ClipboardEvent;
    const result = await handleClipboardPaste(event);
    expect(result).toBeNull();
  });

  it("returns null for empty text content", async () => {
    const event = makeClipboardEvent("");
    const result = await handleClipboardPaste(event);
    expect(result).toBeNull();
  });

  it("routes JSON content to json parser and returns format", async () => {
    const json = JSON.stringify({ nodes: [{ id: "n1" }], edges: [] });
    const event = makeClipboardEvent(json);
    const result = await handleClipboardPaste(event);

    expect(result).not.toBeNull();
    expect(result!.format).toBe("json");
  });

  it("routes mermaid content to mermaid parser", async () => {
    const event = makeClipboardEvent("graph TD\n  A-->B");
    const result = await handleClipboardPaste(event);

    expect(result).not.toBeNull();
    expect(result!.format).toBe("mermaid");
  });

  it("returns null for unrecognized text (unknown format)", async () => {
    const event = makeClipboardEvent("just some random text");
    const result = await handleClipboardPaste(event);
    expect(result).toBeNull();
  });
});

describe("clipboard-handler text extraction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("falls back to text/html when text/plain is empty", async () => {
    const html = '<div>{"nodes":[{"id":"h1"}],"edges":[]}</div>';
    const event = makeClipboardEvent("", html);
    const result = await handleClipboardPaste(event);

    // After HTML tag stripping the content starts with { => json
    expect(result).not.toBeNull();
    expect(result!.format).toBe("json");
  });
});
