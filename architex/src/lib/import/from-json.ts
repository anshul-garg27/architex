import type { Node, Edge } from "@xyflow/react";
import type { DiagramJSON } from "@/lib/export/to-json";

// ─────────────────────────────────────────────────────────────
// JSON Import with validation
// ─────────────────────────────────────────────────────────────

export type ImportResult =
  | { nodes: Node[]; edges: Edge[] }
  | { error: string };

/**
 * Parse and validate a JSON string or object into React Flow nodes/edges.
 *
 * Accepts either a raw JSON string or an already-parsed object.
 * Returns `{ nodes, edges }` on success, or `{ error }` with a
 * human-readable message on failure.
 */
export function importFromJSON(json: string | object): ImportResult {
  // ── 1. Parse if string ──────────────────────────────────────
  let parsed: unknown;
  if (typeof json === "string") {
    try {
      parsed = JSON.parse(json);
    } catch {
      return { error: "Invalid JSON: unable to parse the input." };
    }
  } else {
    parsed = json;
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { error: "Invalid format: expected a JSON object." };
  }

  const obj = parsed as Record<string, unknown>;

  // ── 2. Validate top-level structure ─────────────────────────
  if (!Array.isArray(obj.nodes)) {
    return { error: 'Invalid format: missing or invalid "nodes" array.' };
  }

  if (!Array.isArray(obj.edges)) {
    return { error: 'Invalid format: missing or invalid "edges" array.' };
  }

  // ── 3. Validate each node ──────────────────────────────────
  const nodes: Node[] = [];
  for (let i = 0; i < obj.nodes.length; i++) {
    const n = obj.nodes[i] as Record<string, unknown> | null;
    if (n === null || typeof n !== "object" || Array.isArray(n)) {
      return { error: `Invalid node at index ${i}: expected an object.` };
    }
    if (typeof n.id !== "string" || n.id.length === 0) {
      return { error: `Invalid node at index ${i}: missing or empty "id".` };
    }
    if (typeof n.type !== "string" || n.type.length === 0) {
      return { error: `Invalid node at index ${i}: missing or empty "type".` };
    }
    if (
      n.position === null ||
      typeof n.position !== "object" ||
      Array.isArray(n.position)
    ) {
      return { error: `Invalid node at index ${i}: missing or invalid "position".` };
    }
    const pos = n.position as Record<string, unknown>;
    if (typeof pos.x !== "number" || typeof pos.y !== "number") {
      return {
        error: `Invalid node at index ${i}: position must have numeric "x" and "y".`,
      };
    }

    nodes.push({
      id: n.id,
      type: n.type,
      position: { x: pos.x, y: pos.y },
      data: (n.data as Record<string, unknown>) ?? {},
    });
  }

  // ── 4. Validate each edge ──────────────────────────────────
  const edges: Edge[] = [];
  for (let i = 0; i < obj.edges.length; i++) {
    const e = obj.edges[i] as Record<string, unknown> | null;
    if (e === null || typeof e !== "object" || Array.isArray(e)) {
      return { error: `Invalid edge at index ${i}: expected an object.` };
    }
    if (typeof e.id !== "string" || e.id.length === 0) {
      return { error: `Invalid edge at index ${i}: missing or empty "id".` };
    }
    if (typeof e.source !== "string" || e.source.length === 0) {
      return { error: `Invalid edge at index ${i}: missing or empty "source".` };
    }
    if (typeof e.target !== "string" || e.target.length === 0) {
      return { error: `Invalid edge at index ${i}: missing or empty "target".` };
    }

    const edge: Edge = {
      id: e.id,
      source: e.source,
      target: e.target,
      type: typeof e.type === "string" ? e.type : "default",
    };
    if (typeof e.sourceHandle === "string") edge.sourceHandle = e.sourceHandle;
    if (typeof e.targetHandle === "string") edge.targetHandle = e.targetHandle;
    if (e.data != null) edge.data = e.data as Record<string, unknown>;

    edges.push(edge);
  }

  return { nodes, edges };
}
