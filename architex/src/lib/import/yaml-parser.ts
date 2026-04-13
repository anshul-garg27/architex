import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// YAML Architecture Parser
// Parses a simple YAML architecture format into Architex nodes/edges
// ─────────────────────────────────────────────────────────────

/** Result returned by the YAML parser. */
export type YAMLParseResult =
  | { ok: true; nodes: Node[]; edges: Edge[] }
  | { ok: false; error: string };

// ── Minimal YAML Parser ────────────────────────────────────────
// We support a limited YAML subset — enough for the expected format:
//
//   services:
//     - name: api-gateway
//       type: load-balancer
//       category: load-balancing
//     - name: user-service
//       type: app-server
//
//   connections:
//     - from: api-gateway
//       to: user-service
//       protocol: http
//
// No external YAML dependency required.

interface RawService {
  name: string;
  type?: string;
  category?: string;
  icon?: string;
}

interface RawConnection {
  from: string;
  to: string;
  protocol?: string;
  label?: string;
}

interface ParsedYAML {
  services: RawService[];
  connections: RawConnection[];
}

/** Simple line-level YAML parser for the supported format. */
function parseSimpleYAML(yaml: string): ParsedYAML {
  const services: RawService[] = [];
  const connections: RawConnection[] = [];
  const lines = yaml.split("\n");

  let currentSection: "services" | "connections" | null = null;
  let currentItem: Record<string, string> | null = null;

  for (const rawLine of lines) {
    // Strip comments
    const commentIdx = rawLine.indexOf("#");
    const line =
      commentIdx >= 0 ? rawLine.substring(0, commentIdx) : rawLine;

    // Skip blank lines
    const trimmed = line.trimEnd();
    if (trimmed.trim().length === 0) continue;

    // Detect top-level section headers (no indentation, ends with ":")
    const sectionMatch = /^(\w+)\s*:/.exec(trimmed);
    if (sectionMatch && !trimmed.includes("- ")) {
      const sectionName = sectionMatch[1].toLowerCase();
      if (sectionName === "services") {
        currentSection = "services";
      } else if (sectionName === "connections") {
        currentSection = "connections";
      } else {
        currentSection = null;
      }
      currentItem = null;
      continue;
    }

    if (!currentSection) continue;

    // Detect list item start ("  - key: value" or "  - name")
    const listItemMatch = /^\s+-\s+(.*)$/.exec(trimmed);
    if (listItemMatch) {
      // Flush previous item
      if (currentItem) {
        flushItem(currentSection, currentItem, services, connections);
      }
      currentItem = {};

      // Parse inline key: value on the same line as "-"
      const inlineContent = listItemMatch[1];
      const kvMatch = /^(\w+)\s*:\s*(.+)$/.exec(inlineContent);
      if (kvMatch) {
        currentItem[kvMatch[1].toLowerCase()] = kvMatch[2].trim();
      } else if (inlineContent.trim().length > 0) {
        // Bare value like "  - api-gateway" — treat as name/from
        currentItem["name"] = inlineContent.trim();
      }
      continue;
    }

    // Continuation key: value inside a list item ("    key: value")
    const kvMatch = /^\s+(\w+)\s*:\s*(.+)$/.exec(trimmed);
    if (kvMatch && currentItem) {
      currentItem[kvMatch[1].toLowerCase()] = kvMatch[2].trim();
    }
  }

  // Flush last item
  if (currentItem && currentSection) {
    flushItem(currentSection, currentItem, services, connections);
  }

  return { services, connections };
}

function flushItem(
  section: "services" | "connections",
  item: Record<string, string>,
  services: RawService[],
  connections: RawConnection[],
): void {
  if (section === "services") {
    const name = item.name ?? item.service;
    if (name) {
      services.push({
        name,
        type: item.type,
        category: item.category,
        icon: item.icon,
      });
    }
  } else {
    const from = item.from ?? item.source;
    const to = item.to ?? item.target;
    if (from && to) {
      connections.push({
        from,
        to,
        protocol: item.protocol ?? item.type,
        label: item.label,
      });
    }
  }
}

// ── Type Inference ─────────────────────────────────────────────

const TYPE_TO_CATEGORY: Record<string, string> = {
  "load-balancer": "load-balancing",
  "api-gateway": "load-balancing",
  "app-server": "compute",
  "web-server": "compute",
  server: "compute",
  service: "compute",
  worker: "processing",
  database: "storage",
  db: "storage",
  postgres: "storage",
  mysql: "storage",
  mongo: "storage",
  redis: "storage",
  cache: "storage",
  cdn: "networking",
  dns: "networking",
  queue: "messaging",
  "message-queue": "messaging",
  kafka: "messaging",
  "pub-sub": "messaging",
  client: "client",
  browser: "client",
  mobile: "client",
  firewall: "security",
  "rate-limiter": "security",
};

function inferCategory(type: string | undefined): string {
  if (!type) return "compute";
  const normalised = type.toLowerCase();
  return TYPE_TO_CATEGORY[normalised] ?? "compute";
}

function inferIcon(type: string | undefined): string {
  if (!type) return "server";
  const normalised = type.toLowerCase();
  if (normalised.includes("database") || normalised.includes("db"))
    return "database";
  if (normalised.includes("cache") || normalised.includes("redis"))
    return "database";
  if (normalised.includes("queue") || normalised.includes("kafka"))
    return "mail";
  if (normalised.includes("load") || normalised.includes("gateway"))
    return "git-branch";
  if (normalised.includes("client") || normalised.includes("browser"))
    return "monitor";
  if (normalised.includes("cdn") || normalised.includes("cloud"))
    return "cloud";
  return "server";
}

// ── Layout ─────────────────────────────────────────────────────

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

// ── Main Parser ────────────────────────────────────────────────

/**
 * Parse a YAML architecture description into Architex canvas nodes and edges.
 *
 * Supported format:
 * ```yaml
 * services:
 *   - name: api-gateway
 *     type: load-balancer
 *   - name: user-service
 *     type: app-server
 *
 * connections:
 *   - from: api-gateway
 *     to: user-service
 *     protocol: http
 * ```
 */
export function parseYAMLArchitecture(yaml: string): YAMLParseResult {
  if (!yaml || yaml.trim().length === 0) {
    return { ok: false, error: "Empty YAML input." };
  }

  let parsed: ParsedYAML;
  try {
    parsed = parseSimpleYAML(yaml);
  } catch (e) {
    return {
      ok: false,
      error: `YAML parse error: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }

  if (parsed.services.length === 0) {
    return {
      ok: false,
      error: 'No services found. Expected a "services:" section with named items.',
    };
  }

  // Build a name -> id lookup for edge resolution
  const nameToId = new Map<string, string>();
  const nodes: Node[] = [];

  for (let i = 0; i < parsed.services.length; i++) {
    const svc = parsed.services[i];
    const id = `yaml-${svc.name.replace(/[^a-zA-Z0-9-_]/g, "-")}`;
    nameToId.set(svc.name, id);

    const category = svc.category ?? inferCategory(svc.type);
    const icon = svc.icon ?? inferIcon(svc.type);

    nodes.push({
      id,
      type: "system-design",
      position: gridPosition(i),
      data: {
        label: svc.name,
        category,
        componentType: svc.type ?? "app-server",
        icon,
        config: {},
        state: "idle",
      },
    });
  }

  const edges: Edge[] = [];
  for (let i = 0; i < parsed.connections.length; i++) {
    const conn = parsed.connections[i];
    const sourceId = nameToId.get(conn.from);
    const targetId = nameToId.get(conn.to);

    if (!sourceId || !targetId) {
      // Skip connections referencing unknown services rather than failing
      continue;
    }

    edges.push({
      id: `yaml-edge-${i}`,
      source: sourceId,
      target: targetId,
      type: "default",
      data: {
        edgeType: conn.protocol ?? "http",
        label: conn.label ?? conn.protocol ?? "",
      },
    });
  }

  return { ok: true, nodes, edges };
}
