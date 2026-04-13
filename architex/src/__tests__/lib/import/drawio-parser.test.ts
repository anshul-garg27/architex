import { describe, it, expect } from "vitest";
import { parseDrawioXML } from "@/lib/import/drawio-parser";

// ── Test Fixtures ──────────────────────────────────────────────

/** Minimal valid draw.io XML with two nodes and one edge. */
const SIMPLE_DRAWIO = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="web1" value="Web Server" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="100" y="50" width="120" height="60" as="geometry"/>
    </mxCell>
    <mxCell id="db1" value="Users DB" style="shape=cylinder3;whiteSpace=wrap;" vertex="1" parent="1">
      <mxGeometry x="400" y="50" width="120" height="80" as="geometry"/>
    </mxCell>
    <mxCell id="e1" source="web1" target="db1" edge="1" parent="1">
      <mxGeometry relative="1" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

/** draw.io XML with diamond (decision/load balancer) shape. */
const DIAMOND_NODE = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="lb1" value="Load Balancer" style="rhombus;" vertex="1" parent="1">
      <mxGeometry x="200" y="100" width="100" height="100" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

/** draw.io XML with ellipse (client) shape. */
const ELLIPSE_NODE = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="c1" value="Browser" style="ellipse;" vertex="1" parent="1">
      <mxGeometry x="50" y="50" width="80" height="80" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

/** draw.io XML with HTML-encoded label. */
const HTML_LABEL = `<?xml version="1.0" encoding="UTF-8"?>
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <mxCell id="n1" value="&lt;b&gt;API Gateway&lt;/b&gt;" style="rounded=1;" vertex="1" parent="1">
      <mxGeometry x="0" y="0" width="120" height="60" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>`;

// ── Tests ──────────────────────────────────────────────────────

describe("parseDrawioXML", () => {
  // ── Successful Parsing ────────────────────────────────────

  it("parses a simple draw.io diagram with nodes and edges", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it("extracts node labels from the value attribute", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const labels = result.nodes.map(
      (n) => (n.data as Record<string, unknown>).label,
    );
    expect(labels).toContain("Web Server");
    expect(labels).toContain("Users DB");
  });

  it("extracts node positions from mxGeometry", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const webNode = result.nodes.find((n) => n.id === "web1");
    expect(webNode?.position).toEqual({ x: 100, y: 50 });

    const dbNode = result.nodes.find((n) => n.id === "db1");
    expect(dbNode?.position).toEqual({ x: 400, y: 50 });
  });

  it("extracts edge source and target", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.edges[0].source).toBe("web1");
    expect(result.edges[0].target).toBe("db1");
  });

  // ── Shape Mapping ─────────────────────────────────────────

  it("maps cylinder shape to database category", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const dbNode = result.nodes.find((n) => n.id === "db1");
    const data = dbNode?.data as Record<string, unknown>;
    expect(data.category).toBe("storage");
    expect(data.componentType).toBe("database");
  });

  it("maps diamond/rhombus shape to load-balancing category", () => {
    const result = parseDrawioXML(DIAMOND_NODE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const data = result.nodes[0].data as Record<string, unknown>;
    expect(data.category).toBe("load-balancing");
    expect(data.componentType).toBe("load-balancer");
  });

  it("maps ellipse shape to client category", () => {
    const result = parseDrawioXML(ELLIPSE_NODE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const data = result.nodes[0].data as Record<string, unknown>;
    expect(data.category).toBe("client");
    expect(data.componentType).toBe("client");
  });

  it("uses default mapping for rectangle/unknown shapes", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const webNode = result.nodes.find((n) => n.id === "web1");
    const data = webNode?.data as Record<string, unknown>;
    expect(data.category).toBe("compute");
    expect(data.componentType).toBe("web-server");
  });

  // ── HTML Labels ───────────────────────────────────────────

  it("strips HTML tags from labels", () => {
    const result = parseDrawioXML(HTML_LABEL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const data = result.nodes[0].data as Record<string, unknown>;
    expect(data.label).toBe("API Gateway");
  });

  // ── Skips structural cells ────────────────────────────────

  it("skips root cells with id 0 and 1", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const ids = result.nodes.map((n) => n.id);
    expect(ids).not.toContain("0");
    expect(ids).not.toContain("1");
  });

  // ── Error Handling ────────────────────────────────────────

  it("returns error for invalid XML", () => {
    const result = parseDrawioXML("<not-valid<xml");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeDefined();
  });

  it("returns error for XML with no mxCell elements", () => {
    const result = parseDrawioXML(
      '<?xml version="1.0"?><root><empty/></root>',
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toContain("No mxCell elements");
  });

  // ── All nodes get system-design type ──────────────────────

  it("assigns system-design type to all nodes", () => {
    const result = parseDrawioXML(SIMPLE_DRAWIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    for (const node of result.nodes) {
      expect(node.type).toBe("system-design");
    }
  });
});
