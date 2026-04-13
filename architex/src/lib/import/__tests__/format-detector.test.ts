import { describe, it, expect } from "vitest";
import { detectFormat } from "../format-detector";

// ---------------------------------------------------------------------------
// Tests — Format Detector
// ---------------------------------------------------------------------------

describe("detectFormat", () => {
  // ── Empty / invalid ─────────────────────────────────────────

  it('returns "unknown" for empty string', () => {
    expect(detectFormat("")).toBe("unknown");
  });

  it('returns "unknown" for whitespace-only string', () => {
    expect(detectFormat("   \n\t  ")).toBe("unknown");
  });

  it('returns "unknown" for unrecognised content', () => {
    expect(detectFormat("Hello, world!")).toBe("unknown");
  });

  // ── JSON ────────────────────────────────────────────────────

  it('detects JSON from opening brace "{"', () => {
    expect(detectFormat('{ "nodes": [] }')).toBe("json");
  });

  it('detects JSON from opening bracket "["', () => {
    expect(detectFormat('[{"id":"1"}]')).toBe("json");
  });

  it("detects JSON with leading whitespace", () => {
    expect(detectFormat('  \n  { "version": "1.0" }')).toBe("json");
  });

  // ── draw.io ─────────────────────────────────────────────────

  it('detects draw.io from "<?xml" prefix', () => {
    expect(
      detectFormat('<?xml version="1.0"?><mxGraphModel></mxGraphModel>'),
    ).toBe("drawio");
  });

  it('detects draw.io from "<mxGraphModel" prefix', () => {
    expect(detectFormat("<mxGraphModel><root></root></mxGraphModel>")).toBe(
      "drawio",
    );
  });

  it("detects draw.io when <mxGraphModel> is embedded in content", () => {
    expect(
      detectFormat(
        'some header\n<mxGraphModel dx="1422"><root></root></mxGraphModel>',
      ),
    ).toBe("drawio");
  });

  // ── Mermaid ─────────────────────────────────────────────────

  it('detects Mermaid from "graph TD"', () => {
    expect(detectFormat("graph TD\n  A --> B")).toBe("mermaid");
  });

  it('detects Mermaid from "graph LR"', () => {
    expect(detectFormat("graph LR\n  A --> B")).toBe("mermaid");
  });

  it('detects Mermaid from "graph TB"', () => {
    expect(detectFormat("graph TB\n  A --> B")).toBe("mermaid");
  });

  it("detects Mermaid case-insensitively", () => {
    expect(detectFormat("Graph LR\n  A --> B")).toBe("mermaid");
  });

  it("detects Mermaid with leading whitespace", () => {
    expect(detectFormat("  graph TD\n  A --> B")).toBe("mermaid");
  });

  // ── YAML ────────────────────────────────────────────────────

  it('detects YAML from "services:" key', () => {
    expect(
      detectFormat("services:\n  - name: api-gateway\n    type: load-balancer"),
    ).toBe("yaml");
  });

  it("detects YAML when services key has leading whitespace on line", () => {
    expect(
      detectFormat("# Comment\nservices:\n  - name: svc1"),
    ).toBe("yaml");
  });

  // ── Priority order ──────────────────────────────────────────

  it("JSON takes priority over YAML when content starts with {", () => {
    // A JSON object that happens to contain "services:"
    expect(
      detectFormat('{ "services": [] }'),
    ).toBe("json");
  });

  it("draw.io takes priority over Mermaid when XML header present", () => {
    expect(
      detectFormat('<?xml version="1.0"?>\ngraph TD\nA-->B'),
    ).toBe("drawio");
  });
});
