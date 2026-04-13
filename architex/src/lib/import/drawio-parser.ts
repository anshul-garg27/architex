import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// draw.io XML Parser
// Parses mxGraph XML and maps shapes to Architex node types
// ─────────────────────────────────────────────────────────────

/** Result returned by the draw.io parser. */
export type DrawioParseResult =
  | { ok: true; nodes: Node[]; edges: Edge[] }
  | { ok: false; error: string };

// ── Shape Mapping ──────────────────────────────────────────────

/**
 * Map draw.io style shapes to Architex component types and categories.
 *
 * draw.io encodes shape info in the `style` attribute as semicolon-separated
 * key=value pairs. We inspect the `shape` value and fall back to heuristics
 * on the raw style string.
 */
interface NodeMapping {
  componentType: string;
  category: string;
  icon: string;
}

const SHAPE_MAP: Record<string, NodeMapping> = {
  // Cylinder -> database
  cylinder: {
    componentType: "database",
    category: "storage",
    icon: "database",
  },
  cylinder3: {
    componentType: "database",
    category: "storage",
    icon: "database",
  },

  // Diamond -> decision / load balancer
  rhombus: {
    componentType: "load-balancer",
    category: "load-balancing",
    icon: "git-branch",
  },
  mxgraph_flowchart_decision: {
    componentType: "load-balancer",
    category: "load-balancing",
    icon: "git-branch",
  },

  // Hexagon -> worker / processing
  hexagon: {
    componentType: "worker-service",
    category: "processing",
    icon: "cog",
  },

  // Ellipse / circle -> client
  ellipse: {
    componentType: "client",
    category: "client",
    icon: "monitor",
  },

  // Cloud -> CDN / cloud service
  cloud: {
    componentType: "cdn",
    category: "networking",
    icon: "cloud",
  },
  mxgraph_networks_cloud: {
    componentType: "cdn",
    category: "networking",
    icon: "cloud",
  },

  // Document -> storage / log
  document: {
    componentType: "storage",
    category: "storage",
    icon: "file",
  },

  // Parallelogram -> queue / message
  parallelogram: {
    componentType: "message-queue",
    category: "messaging",
    icon: "mail",
  },

  // Process (rectangle with double bar) -> app server
  process: {
    componentType: "app-server",
    category: "compute",
    icon: "server",
  },
};

/** Default mapping when no specific shape is detected. */
const DEFAULT_MAPPING: NodeMapping = {
  componentType: "web-server",
  category: "compute",
  icon: "server",
};

// ── Style Parsing ──────────────────────────────────────────────

function parseStyleString(style: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!style) return result;

  const parts = style.split(";").filter(Boolean);
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx === -1) {
      // Bare keyword like "ellipse" or "rhombus"
      result[part.trim()] = "1";
    } else {
      result[part.substring(0, eqIdx).trim()] =
        part.substring(eqIdx + 1).trim();
    }
  }
  return result;
}

function resolveMapping(styleStr: string): NodeMapping {
  const style = parseStyleString(styleStr);

  // 1. Check explicit shape key
  if (style.shape) {
    const normalised = style.shape.toLowerCase().replace(/\./g, "_");
    for (const [key, mapping] of Object.entries(SHAPE_MAP)) {
      if (normalised.includes(key)) return mapping;
    }
  }

  // 2. Check bare keywords in style (draw.io uses "ellipse;" etc.)
  for (const [key, mapping] of Object.entries(SHAPE_MAP)) {
    if (style[key] === "1" || styleStr.toLowerCase().includes(key)) {
      return mapping;
    }
  }

  return DEFAULT_MAPPING;
}

// ── XML Parsing (DOMParser) ────────────────────────────────────

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractLabel(cell: Element): string {
  // draw.io stores labels in the `value` attribute
  const valueAttr = cell.getAttribute("value") ?? "";
  // Strip HTML tags that draw.io sometimes wraps labels in
  const stripped = valueAttr.replace(/<[^>]*>/g, "").trim();
  return decodeHTMLEntities(stripped) || "Untitled";
}

function extractGeometry(
  cell: Element,
): { x: number; y: number; width: number; height: number } | null {
  const geo = cell.querySelector("mxGeometry");
  if (!geo) return null;
  return {
    x: parseFloat(geo.getAttribute("x") ?? "0") || 0,
    y: parseFloat(geo.getAttribute("y") ?? "0") || 0,
    width: parseFloat(geo.getAttribute("width") ?? "120") || 120,
    height: parseFloat(geo.getAttribute("height") ?? "60") || 60,
  };
}

// ── Main Parser ────────────────────────────────────────────────

/**
 * Parse a draw.io (mxGraph) XML string and convert it to Architex
 * nodes and edges.
 *
 * Handles the standard `.drawio` / `.xml` export format that uses
 * `<mxGraphModel>` with `<mxCell>` elements.
 */
export function parseDrawioXML(xml: string): DrawioParseResult {
  if (typeof DOMParser === "undefined") {
    return { ok: false, error: "DOMParser is not available in this environment." };
  }

  let doc: Document;
  try {
    const parser = new DOMParser();
    doc = parser.parseFromString(xml, "text/xml");
  } catch {
    return { ok: false, error: "Failed to parse XML input." };
  }

  // Check for XML parse errors
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return {
      ok: false,
      error: `XML parse error: ${parseError.textContent?.slice(0, 200) ?? "unknown error"}`,
    };
  }

  // Find all mxCell elements
  const cells = doc.querySelectorAll("mxCell");
  if (cells.length === 0) {
    // Also check for root > object > mxCell pattern
    const objects = doc.querySelectorAll("object");
    if (objects.length === 0) {
      return { ok: false, error: "No mxCell elements found in the XML." };
    }
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeIndex = 0;
  let edgeIndex = 0;

  // Process all cells
  const allCells = [
    ...Array.from(cells),
    ...Array.from(doc.querySelectorAll("object")),
  ];

  for (const cell of allCells) {
    const id = cell.getAttribute("id") ?? "";
    const source = cell.getAttribute("source");
    const target = cell.getAttribute("target");
    const styleStr = cell.getAttribute("style") ?? "";
    const isEdge =
      cell.getAttribute("edge") === "1" ||
      (source != null && target != null);
    const isVertex =
      cell.getAttribute("vertex") === "1" ||
      (!isEdge && extractGeometry(cell) !== null);

    // Skip the root cells (id "0" and "1" are mxGraph structural)
    if (id === "0" || id === "1") continue;

    if (isEdge && source && target) {
      edges.push({
        id: id || `drawio-edge-${edgeIndex}`,
        source,
        target,
        type: "default",
        data: { edgeType: "http", label: extractLabel(cell) },
      });
      edgeIndex++;
    } else if (isVertex) {
      const geo = extractGeometry(cell);
      const mapping = resolveMapping(styleStr);
      const label = extractLabel(cell);

      nodes.push({
        id: id || `drawio-node-${nodeIndex}`,
        type: "system-design",
        position: { x: geo?.x ?? nodeIndex * 200, y: geo?.y ?? 0 },
        data: {
          label,
          category: mapping.category,
          componentType: mapping.componentType,
          icon: mapping.icon,
          config: {},
          state: "idle",
          _drawio: {
            originalStyle: styleStr,
            width: geo?.width ?? 120,
            height: geo?.height ?? 60,
          },
        },
      });
      nodeIndex++;
    }
  }

  return { ok: true, nodes, edges };
}
