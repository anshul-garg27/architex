import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// Mermaid Flowchart Parser (INF-014)
// Parses `graph TD` / `graph LR` Mermaid syntax into Architex
// canvas nodes and edges.
// ─────────────────────────────────────────────────────────────

/** Result returned by the Mermaid parser. */
export type MermaidParseResult =
  | { ok: true; nodes: Node[]; edges: Edge[] }
  | { ok: false; error: string };

// ── Shape Detection ───────────────────────────────────────────

interface ShapeInfo {
  label: string;
  componentType: string;
  category: string;
  icon: string;
}

/**
 * Extract shape and label from a Mermaid node declaration.
 *
 * Supported shapes:
 *   `[text]`    → service (rectangle)
 *   `[(text)]`  → database (cylindrical)
 *   `{text}`    → decision (diamond)
 *   `(text)`    → rounded (rounded rect)
 *   `((text))`  → double-circle (client)
 *   `([text])`  → stadium (cache)
 *   `>text]`    → flag (queue)
 *   bare id     → fallback service
 */
function parseShape(raw: string): ShapeInfo {
  let match: RegExpMatchArray | null;

  // Database: [(text)]
  match = raw.match(/^\[\((.+)\)\]$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "database",
      category: "storage",
      icon: "database",
    };
  }

  // Stadium / cache: ([text])
  match = raw.match(/^\(\[(.+)\]\)$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "cache",
      category: "storage",
      icon: "database",
    };
  }

  // Double-circle / client: ((text))
  match = raw.match(/^\(\((.+)\)\)$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "client",
      category: "client",
      icon: "monitor",
    };
  }

  // Decision / diamond: {text}
  match = raw.match(/^\{(.+)\}$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "load-balancer",
      category: "load-balancing",
      icon: "git-branch",
    };
  }

  // Rounded rect: (text)
  match = raw.match(/^\((.+)\)$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "app-server",
      category: "compute",
      icon: "server",
    };
  }

  // Flag / queue: >text]
  match = raw.match(/^>(.+)\]$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "message-queue",
      category: "messaging",
      icon: "mail",
    };
  }

  // Rectangle / service: [text]
  match = raw.match(/^\[(.+)\]$/);
  if (match) {
    return {
      label: match[1].trim(),
      componentType: "web-server",
      category: "compute",
      icon: "server",
    };
  }

  // Bare id — no shape wrapper
  return {
    label: raw.trim(),
    componentType: "web-server",
    category: "compute",
    icon: "server",
  };
}

// ── Edge Pattern Detection ────────────────────────────────────

interface EdgeInfo {
  sourceId: string;
  targetId: string;
  label: string;
  edgeType: string;
}

/**
 * Parse a Mermaid edge line and return source, target, optional label,
 * and inferred edge type.
 *
 * Supported arrow styles:
 *   `-->`    solid (http)
 *   `---`    undirected link
 *   `-.->` / `-.->`  dotted (message-queue)
 *   `==>`    thick (replication)
 *   `<-->`   bidirectional (websocket)
 *
 * Label forms:
 *   `A -->|label| B`
 *   `A -- label --> B`
 */

/** Matches arrow operators in Mermaid syntax. */
const ARROW_RE = /\s+(<?[-=.]+>?)\s*/;

/** Matches the `|label|` segment after an arrow. */
const LABEL_PIPE_RE = /^\|([^|]*)\|\s*/;

function inferEdgeType(arrow: string): string {
  if (arrow.startsWith("<") && arrow.endsWith(">")) return "websocket";
  if (arrow.includes("=")) return "replication";
  if (arrow.includes(".")) return "message-queue";
  return "http";
}

/**
 * Check whether a string is a valid Mermaid arrow operator.
 * Must consist only of `-`, `=`, `.`, `<`, `>` characters and
 * be at least 2 chars long.
 */
function isArrowOperator(s: string): boolean {
  return s.length >= 2 && /^[<>=.-]+$/.test(s);
}

function parseEdgeLine(line: string): EdgeInfo | null {
  const arrowMatch = ARROW_RE.exec(line);
  if (!arrowMatch) return null;

  const arrow = arrowMatch[1];
  if (!isArrowOperator(arrow)) return null;

  const sourceRaw = line.slice(0, arrowMatch.index).trim();
  let rest = line.slice(arrowMatch.index + arrowMatch[0].length);

  // Check for pipe-label: -->|label| target
  let label = "";
  const labelMatch = LABEL_PIPE_RE.exec(rest);
  if (labelMatch) {
    label = labelMatch[1].trim();
    rest = rest.slice(labelMatch[0].length);
  }

  const targetRaw = rest.trim();

  if (!sourceRaw || !targetRaw) return null;

  return {
    sourceId: sourceRaw,
    targetId: targetRaw,
    label,
    edgeType: inferEdgeType(arrow),
  };
}

// ── Node Declaration Parsing ──────────────────────────────────

/**
 * Regex to capture a node declaration: `ID` followed by a shape.
 *
 * Handles shapes that start with `[`, `(`, `{`, `>` and captures
 * until the end of the declaration (balanced delimiters are ensured
 * by the `parseShape` function, not the regex).
 */
const NODE_DECL_RE = /^(\w[\w-]*)(\[.*\]|\(.*\)|\{.*\}|>\S+\])?\s*$/;

// ── Auto Layout ───────────────────────────────────────────────

const GRID_COLS = 3;
const GRID_SPACING_X = 280;
const GRID_SPACING_Y = 180;
const GRID_OFFSET = 100;

function gridPosition(index: number): { x: number; y: number } {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  return {
    x: GRID_OFFSET + col * GRID_SPACING_X,
    y: GRID_OFFSET + row * GRID_SPACING_Y,
  };
}

// ── Main Parser ───────────────────────────────────────────────

/**
 * Parse a Mermaid flowchart string into Architex canvas nodes and edges.
 *
 * Supports `graph TD`, `graph LR`, and `graph TB` direction prefixes.
 *
 * ```mermaid
 * graph TD
 *   A[API Gateway] --> B[(PostgreSQL)]
 *   A -->|gRPC| C{Load Balancer}
 *   C --- D(Worker)
 * ```
 */
export function parseMermaidDiagram(text: string): MermaidParseResult {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: "Empty Mermaid input." };
  }

  const lines = text.split("\n").map((l) => l.trim());

  // ── 1. Validate header ───────────────────────────────────────
  const headerIdx = lines.findIndex((l) =>
    /^graph\s+(TD|TB|LR|RL|BT)\s*$/i.test(l),
  );
  if (headerIdx === -1) {
    return {
      ok: false,
      error:
        'Invalid Mermaid diagram: expected "graph TD", "graph LR", or similar direction.',
    };
  }

  // ── 2. Collect declarations ──────────────────────────────────
  // Track discovered nodes (id -> ShapeInfo) and edges
  const nodeMap = new Map<string, ShapeInfo>();
  const edgeInfos: EdgeInfo[] = [];

  const contentLines = lines.slice(headerIdx + 1).filter((l) => {
    // Skip empty lines, comments, and style/class directives
    return (
      l.length > 0 &&
      !l.startsWith("%%") &&
      !l.startsWith("style ") &&
      !l.startsWith("class ") &&
      !l.startsWith("classDef ") &&
      !l.startsWith("linkStyle ")
    );
  });

  for (const line of contentLines) {
    // Try parsing as an edge first (edges contain arrow operators)
    const edgeInfo = parseEdgeLine(line);
    if (edgeInfo) {
      edgeInfos.push(edgeInfo);
      // Ensure source and target are registered as nodes
      if (!nodeMap.has(edgeInfo.sourceId)) {
        nodeMap.set(edgeInfo.sourceId, {
          label: edgeInfo.sourceId,
          componentType: "web-server",
          category: "compute",
          icon: "server",
        });
      }
      if (!nodeMap.has(edgeInfo.targetId)) {
        nodeMap.set(edgeInfo.targetId, {
          label: edgeInfo.targetId,
          componentType: "web-server",
          category: "compute",
          icon: "server",
        });
      }
      continue;
    }

    // Try parsing as a standalone node declaration
    const nodeMatch = NODE_DECL_RE.exec(line);
    if (nodeMatch) {
      const id = nodeMatch[1];
      const shapeStr = nodeMatch[2] ?? "";
      const shape = shapeStr ? parseShape(shapeStr) : {
        label: id,
        componentType: "web-server",
        category: "compute",
        icon: "server",
      };
      nodeMap.set(id, shape);
    }
  }

  // ── 3. Handle edge lines that contain inline node declarations ─
  // Re-scan edge lines for node shapes embedded in the source/target.
  // e.g. `A[API Gateway] --> B[(DB)]` — the edge parser captures
  // `A[API Gateway]` as sourceId; we split out the id and shape here.
  for (const edgeInfo of edgeInfos) {
    for (const key of ["sourceId", "targetId"] as const) {
      const raw = edgeInfo[key];
      const declMatch = /^(\w[\w-]*)(\[.*\]|\(.*\)|\{.*\}|>.+\])$/.exec(raw);
      if (declMatch) {
        const id = declMatch[1];
        const shape = parseShape(declMatch[2]);
        nodeMap.set(id, shape);
        // Remove stale placeholder that was keyed on the raw string
        nodeMap.delete(raw);
        edgeInfo[key] = id;
      }
    }
  }

  if (nodeMap.size === 0) {
    return {
      ok: false,
      error: "No nodes found in the Mermaid diagram.",
    };
  }

  // ── 4. Build React Flow nodes ────────────────────────────────
  const nodes: Node[] = [];
  let idx = 0;
  for (const [id, shape] of nodeMap) {
    nodes.push({
      id: `mermaid-${id}`,
      type: "system-design",
      position: gridPosition(idx),
      data: {
        label: shape.label,
        category: shape.category,
        componentType: shape.componentType,
        icon: shape.icon,
        config: {},
        state: "idle",
      },
    });
    idx++;
  }

  // ── 5. Build React Flow edges ────────────────────────────────
  const edges: Edge[] = edgeInfos.map((info, i) => {
    const data: Record<string, unknown> = {
      edgeType: info.edgeType,
    };
    if (info.label) {
      data.label = info.label;
    }

    return {
      id: `mermaid-edge-${i}`,
      source: `mermaid-${info.sourceId}`,
      target: `mermaid-${info.targetId}`,
      type: "default",
      data,
    };
  });

  return { ok: true, nodes, edges };
}
