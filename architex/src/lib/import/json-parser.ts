import type { Node, Edge } from "@xyflow/react";
import type { DiagramJSON } from "@/lib/export/to-json";

// ─────────────────────────────────────────────────────────────
// JSON Diagram Importer
// Validates and parses Architex JSON (with version detection)
// ─────────────────────────────────────────────────────────────

/** Supported schema versions. */
const SUPPORTED_VERSIONS = ["1.0"] as const;
type SupportedVersion = (typeof SUPPORTED_VERSIONS)[number];

/** Metadata extracted from the parsed diagram. */
export interface ParsedMetadata {
  version: string;
  name: string;
  createdAt: string;
  moduleType: string;
  nodeCount: number;
  edgeCount: number;
}

/** Successful parse result. */
export interface ParsedDiagram {
  nodes: Node[];
  edges: Edge[];
  metadata: ParsedMetadata;
}

/** A single validation error with context. */
export interface ParseError {
  path: string;
  message: string;
}

/** Result: either a valid diagram or an array of errors. */
export type ParseResult =
  | { ok: true; data: ParsedDiagram }
  | { ok: false; errors: ParseError[] };

// ── Helpers ────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function detectVersion(obj: Record<string, unknown>): string {
  if (typeof obj.version === "string") return obj.version;
  if (typeof obj.version === "number") return String(obj.version);
  // Heuristic: if it has nodes/edges arrays but no version, assume 1.0
  if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) return "1.0";
  return "unknown";
}

// ── Main Parser ────────────────────────────────────────────────

/**
 * Parse and validate an Architex JSON diagram.
 *
 * Accepts either a raw JSON string or an already-parsed object.
 * Performs full schema validation with version detection and
 * returns detailed error reporting for any malformed data.
 */
export function parseArchitexJSON(json: string | object): ParseResult {
  const errors: ParseError[] = [];

  // ── 1. Parse if string ─────────────────────────────────────
  let parsed: unknown;
  if (typeof json === "string") {
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      return {
        ok: false,
        errors: [
          {
            path: "$",
            message: `Invalid JSON: ${e instanceof SyntaxError ? e.message : "unable to parse the input"}`,
          },
        ],
      };
    }
  } else {
    parsed = json;
  }

  if (!isObject(parsed)) {
    return {
      ok: false,
      errors: [{ path: "$", message: "Expected a JSON object at the root." }],
    };
  }

  const obj = parsed;

  // ── 2. Version detection ───────────────────────────────────
  const version = detectVersion(obj);
  if (version === "unknown") {
    errors.push({
      path: "$.version",
      message:
        "Could not detect schema version. Expected a 'version' field or 'nodes'/'edges' arrays.",
    });
  } else if (
    !SUPPORTED_VERSIONS.includes(version as SupportedVersion)
  ) {
    errors.push({
      path: "$.version",
      message: `Unsupported version "${version}". Supported: ${SUPPORTED_VERSIONS.join(", ")}.`,
    });
  }

  // ── 3. Validate nodes array ────────────────────────────────
  if (!Array.isArray(obj.nodes)) {
    errors.push({
      path: "$.nodes",
      message: 'Missing or invalid "nodes" array.',
    });
    return { ok: false, errors };
  }

  const nodes: Node[] = [];
  for (let i = 0; i < obj.nodes.length; i++) {
    const raw = obj.nodes[i];
    if (!isObject(raw)) {
      errors.push({
        path: `$.nodes[${i}]`,
        message: "Expected an object.",
      });
      continue;
    }

    if (typeof raw.id !== "string" || raw.id.length === 0) {
      errors.push({
        path: `$.nodes[${i}].id`,
        message: 'Missing or empty "id" (expected non-empty string).',
      });
      continue;
    }

    if (typeof raw.type !== "string" || raw.type.length === 0) {
      errors.push({
        path: `$.nodes[${i}].type`,
        message: 'Missing or empty "type" (expected non-empty string).',
      });
      continue;
    }

    if (!isObject(raw.position)) {
      errors.push({
        path: `$.nodes[${i}].position`,
        message: 'Missing or invalid "position" object.',
      });
      continue;
    }

    const pos = raw.position;
    if (typeof pos.x !== "number" || typeof pos.y !== "number") {
      errors.push({
        path: `$.nodes[${i}].position`,
        message: 'Position must have numeric "x" and "y" fields.',
      });
      continue;
    }

    nodes.push({
      id: raw.id,
      type: raw.type,
      position: { x: pos.x, y: pos.y },
      data: isObject(raw.data) ? (raw.data as Record<string, unknown>) : {},
    });
  }

  // ── 4. Validate edges array ────────────────────────────────
  if (!Array.isArray(obj.edges)) {
    errors.push({
      path: "$.edges",
      message: 'Missing or invalid "edges" array.',
    });
    return { ok: false, errors };
  }

  const edges: Edge[] = [];
  for (let i = 0; i < obj.edges.length; i++) {
    const raw = obj.edges[i];
    if (!isObject(raw)) {
      errors.push({
        path: `$.edges[${i}]`,
        message: "Expected an object.",
      });
      continue;
    }

    if (typeof raw.id !== "string" || raw.id.length === 0) {
      errors.push({
        path: `$.edges[${i}].id`,
        message: 'Missing or empty "id" (expected non-empty string).',
      });
      continue;
    }

    if (typeof raw.source !== "string" || raw.source.length === 0) {
      errors.push({
        path: `$.edges[${i}].source`,
        message: 'Missing or empty "source" (expected non-empty string).',
      });
      continue;
    }

    if (typeof raw.target !== "string" || raw.target.length === 0) {
      errors.push({
        path: `$.edges[${i}].target`,
        message: 'Missing or empty "target" (expected non-empty string).',
      });
      continue;
    }

    const edge: Edge = {
      id: raw.id,
      source: raw.source,
      target: raw.target,
      type: typeof raw.type === "string" ? raw.type : "default",
    };
    if (typeof raw.sourceHandle === "string")
      edge.sourceHandle = raw.sourceHandle;
    if (typeof raw.targetHandle === "string")
      edge.targetHandle = raw.targetHandle;
    if (raw.data != null && isObject(raw.data))
      edge.data = raw.data as Record<string, unknown>;

    edges.push(edge);
  }

  // If there were individual field errors but we still parsed some data,
  // return errors so the caller can decide whether to proceed.
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // ── 5. Build metadata ──────────────────────────────────────
  const metaRaw = isObject(obj.metadata) ? obj.metadata : {};
  const metadata: ParsedMetadata = {
    version,
    name: typeof obj.name === "string" ? obj.name : "Untitled Diagram",
    createdAt:
      typeof obj.createdAt === "string"
        ? obj.createdAt
        : new Date().toISOString(),
    moduleType:
      typeof metaRaw.moduleType === "string"
        ? metaRaw.moduleType
        : "system-design",
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };

  return { ok: true, data: { nodes, edges, metadata } };
}
