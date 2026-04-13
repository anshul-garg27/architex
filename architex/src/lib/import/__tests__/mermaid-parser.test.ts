import { describe, it, expect } from "vitest";
import { parseMermaidDiagram } from "../mermaid-parser";

// ---------------------------------------------------------------------------
// Tests — Mermaid Parser
// ---------------------------------------------------------------------------

describe("parseMermaidDiagram", () => {
  // ── Error cases ─────────────────────────────────────────────

  it("returns error for empty input", () => {
    const r = parseMermaidDiagram("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Empty");
  });

  it("returns error when graph header is missing", () => {
    const r = parseMermaidDiagram("A --> B");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("graph");
  });

  it("returns error for unsupported direction keyword", () => {
    const r = parseMermaidDiagram("graph XY\n  A --> B");
    expect(r.ok).toBe(false);
  });

  // ── graph TD / graph LR ─────────────────────────────────────

  it("accepts graph TD", () => {
    const r = parseMermaidDiagram("graph TD\n  A[API] --> B[DB]");
    expect(r.ok).toBe(true);
  });

  it("accepts graph LR", () => {
    const r = parseMermaidDiagram("graph LR\n  A --> B");
    expect(r.ok).toBe(true);
  });

  // ── Node parsing ────────────────────────────────────────────

  it("parses rectangle [text] as service", () => {
    const r = parseMermaidDiagram("graph TD\n  A[API Gateway]");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes[0].data.label).toBe("API Gateway");
    expect(r.nodes[0].data.componentType).toBe("web-server");
    expect(r.nodes[0].data.category).toBe("compute");
  });

  it("parses cylindrical [(text)] as database", () => {
    const r = parseMermaidDiagram("graph TD\n  DB[(PostgreSQL)]");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.componentType).toBe("database");
    expect(r.nodes[0].data.category).toBe("storage");
    expect(r.nodes[0].data.icon).toBe("database");
  });

  it("parses diamond {text} as decision", () => {
    const r = parseMermaidDiagram("graph TD\n  LB{Load Balancer}");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.componentType).toBe("load-balancer");
    expect(r.nodes[0].data.category).toBe("load-balancing");
  });

  it("parses rounded (text) as app-server", () => {
    const r = parseMermaidDiagram("graph TD\n  W(Worker)");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.componentType).toBe("app-server");
    expect(r.nodes[0].data.category).toBe("compute");
  });

  it("parses double-circle ((text)) as client", () => {
    const r = parseMermaidDiagram("graph TD\n  C((Browser))");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.componentType).toBe("client");
    expect(r.nodes[0].data.category).toBe("client");
  });

  it("parses stadium ([text]) as cache", () => {
    const r = parseMermaidDiagram("graph TD\n  R([Redis])");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.componentType).toBe("cache");
    expect(r.nodes[0].data.category).toBe("storage");
  });

  it("parses bare id node with no shape as web-server", () => {
    const r = parseMermaidDiagram("graph TD\n  myService");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].data.label).toBe("myService");
    expect(r.nodes[0].data.componentType).toBe("web-server");
  });

  // ── Edge parsing ────────────────────────────────────────────

  it("parses A --> B as a solid (http) edge", () => {
    const r = parseMermaidDiagram("graph TD\n  A --> B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges).toHaveLength(1);
    expect(r.edges[0].source).toBe("mermaid-A");
    expect(r.edges[0].target).toBe("mermaid-B");
    expect(r.edges[0].data?.edgeType).toBe("http");
  });

  it("parses A --- B as a solid edge", () => {
    const r = parseMermaidDiagram("graph TD\n  A --- B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges).toHaveLength(1);
    expect(r.edges[0].data?.edgeType).toBe("http");
  });

  it("parses A -->|label| B with edge label", () => {
    const r = parseMermaidDiagram("graph TD\n  A -->|gRPC| B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges[0].data?.label).toBe("gRPC");
  });

  it("parses A -.-> B as message-queue", () => {
    const r = parseMermaidDiagram("graph TD\n  A -.-> B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges[0].data?.edgeType).toBe("message-queue");
  });

  it("parses A ==> B as replication", () => {
    const r = parseMermaidDiagram("graph TD\n  A ==> B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges[0].data?.edgeType).toBe("replication");
  });

  it("parses A <--> B as websocket", () => {
    const r = parseMermaidDiagram("graph TD\n  A <--> B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges[0].data?.edgeType).toBe("websocket");
  });

  // ── Inline node declarations in edges ───────────────────────

  it("extracts node shapes from edge lines", () => {
    const r = parseMermaidDiagram(
      "graph TD\n  A[API Gateway] --> B[(Database)]",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes).toHaveLength(2);

    const api = r.nodes.find((n) => n.id === "mermaid-A");
    const db = r.nodes.find((n) => n.id === "mermaid-B");
    expect(api?.data.label).toBe("API Gateway");
    expect(api?.data.componentType).toBe("web-server");
    expect(db?.data.label).toBe("Database");
    expect(db?.data.componentType).toBe("database");
  });

  // ── Auto-layout ─────────────────────────────────────────────

  it("assigns grid positions to nodes", () => {
    const r = parseMermaidDiagram(
      "graph TD\n  A[A] --> B[B]\n  B --> C[C]\n  C --> D[D]",
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // Each node should have a distinct position
    const positions = r.nodes.map((n) => `${n.position.x},${n.position.y}`);
    const unique = new Set(positions);
    expect(unique.size).toBe(r.nodes.length);
  });

  // ── Node IDs ────────────────────────────────────────────────

  it("prefixes node IDs with 'mermaid-'", () => {
    const r = parseMermaidDiagram("graph TD\n  svc1[Service]");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes[0].id).toBe("mermaid-svc1");
  });

  it("prefixes edge IDs with 'mermaid-edge-'", () => {
    const r = parseMermaidDiagram("graph TD\n  A --> B");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.edges[0].id).toBe("mermaid-edge-0");
  });

  // ── Complex diagram ─────────────────────────────────────────

  it("parses a multi-node, multi-edge diagram", () => {
    const diagram = [
      "graph TD",
      "  Client((Browser)) --> LB{Load Balancer}",
      "  LB --> API[API Server]",
      "  API -->|SQL| DB[(PostgreSQL)]",
      "  API -.-> Q(Queue)",
    ].join("\n");

    const r = parseMermaidDiagram(diagram);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.nodes.length).toBeGreaterThanOrEqual(5);
    expect(r.edges).toHaveLength(4);

    // Verify specific node types
    const client = r.nodes.find((n) => n.id === "mermaid-Client");
    expect(client?.data.componentType).toBe("client");

    const db = r.nodes.find((n) => n.id === "mermaid-DB");
    expect(db?.data.componentType).toBe("database");

    const lb = r.nodes.find((n) => n.id === "mermaid-LB");
    expect(lb?.data.componentType).toBe("load-balancer");
  });

  // ── Skipping directives ─────────────────────────────────────

  it("ignores style and classDef directives", () => {
    const diagram = [
      "graph TD",
      "  A[Server] --> B[DB]",
      "  style A fill:#f9f",
      "  classDef default fill:#fff",
      "  linkStyle 0 stroke:#333",
    ].join("\n");

    const r = parseMermaidDiagram(diagram);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes).toHaveLength(2);
    expect(r.edges).toHaveLength(1);
  });

  it("ignores Mermaid comments (%%)", () => {
    const diagram = [
      "graph TD",
      "  %% This is a comment",
      "  A --> B",
    ].join("\n");

    const r = parseMermaidDiagram(diagram);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.nodes).toHaveLength(2);
  });

  // ── Node data completeness ──────────────────────────────────

  it("includes all required SystemDesignNodeData fields", () => {
    const r = parseMermaidDiagram("graph TD\n  S[Service]");
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    const data = r.nodes[0].data;
    expect(data).toHaveProperty("label");
    expect(data).toHaveProperty("category");
    expect(data).toHaveProperty("componentType");
    expect(data).toHaveProperty("icon");
    expect(data).toHaveProperty("config");
    expect(data).toHaveProperty("state");
    expect(data.state).toBe("idle");
  });
});
