import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// Diagram Diff Engine
// Compares two diagram snapshots and produces a structured diff
// ─────────────────────────────────────────────────────────────

/** A single property change on a node or edge. */
export interface PropertyChange {
  field: string;
  before: unknown;
  after: unknown;
}

/** A modified node with its list of changed properties. */
export interface ModifiedNode {
  id: string;
  label: string;
  changes: PropertyChange[];
}

/** A modified edge with its list of changed properties. */
export interface ModifiedEdge {
  id: string;
  source: string;
  target: string;
  changes: PropertyChange[];
}

/** Full diff result between two diagram snapshots. */
export interface DiagramDiff {
  nodes: {
    added: Node[];
    removed: Node[];
    modified: ModifiedNode[];
    unchanged: string[];
  };
  edges: {
    added: Edge[];
    removed: Edge[];
    modified: ModifiedEdge[];
    unchanged: string[];
  };
  summary: string[];
}

/** Input shape: a diagram snapshot with nodes and edges. */
export interface DiagramSnapshot {
  nodes: Node[];
  edges: Edge[];
}

// ── Helpers ────────────────────────────────────────────────────

function getNodeLabel(node: Node): string {
  const data = node.data as Record<string, unknown> | undefined;
  return (data?.label as string) ?? node.id;
}

/**
 * Compare two values using JSON serialization for deep equality.
 * Returns true if they are structurally equal.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === undefined && b === undefined) return true;
  if (a === null && b === null) return true;
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Diff two plain objects, returning an array of property changes.
 * Only compares top-level keys — nested objects are compared via
 * JSON serialization.
 */
function diffObjects(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  prefix = "",
): PropertyChange[] {
  const changes: PropertyChange[] = [];
  const allKeys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);

  for (const key of allKeys) {
    const beforeVal = before[key];
    const afterVal = after[key];
    if (!deepEqual(beforeVal, afterVal)) {
      changes.push({
        field: prefix ? `${prefix}.${key}` : key,
        before: beforeVal,
        after: afterVal,
      });
    }
  }

  return changes;
}

// ── Node Diff ──────────────────────────────────────────────────

function diffNodePair(before: Node, after: Node): PropertyChange[] {
  const changes: PropertyChange[] = [];

  // Position
  if (
    before.position.x !== after.position.x ||
    before.position.y !== after.position.y
  ) {
    changes.push({
      field: "position",
      before: before.position,
      after: after.position,
    });
  }

  // Type
  if ((before.type ?? "default") !== (after.type ?? "default")) {
    changes.push({
      field: "type",
      before: before.type ?? "default",
      after: after.type ?? "default",
    });
  }

  // Data (deep comparison of all data fields)
  const beforeData = (before.data ?? {}) as Record<string, unknown>;
  const afterData = (after.data ?? {}) as Record<string, unknown>;
  const dataChanges = diffObjects(beforeData, afterData, "data");
  changes.push(...dataChanges);

  return changes;
}

// ── Edge Diff ──────────────────────────────────────────────────

function diffEdgePair(before: Edge, after: Edge): PropertyChange[] {
  const changes: PropertyChange[] = [];

  // Source / target
  if (before.source !== after.source) {
    changes.push({
      field: "source",
      before: before.source,
      after: after.source,
    });
  }
  if (before.target !== after.target) {
    changes.push({
      field: "target",
      before: before.target,
      after: after.target,
    });
  }

  // Type
  if ((before.type ?? "default") !== (after.type ?? "default")) {
    changes.push({
      field: "type",
      before: before.type ?? "default",
      after: after.type ?? "default",
    });
  }

  // Handles
  if (before.sourceHandle !== after.sourceHandle) {
    changes.push({
      field: "sourceHandle",
      before: before.sourceHandle,
      after: after.sourceHandle,
    });
  }
  if (before.targetHandle !== after.targetHandle) {
    changes.push({
      field: "targetHandle",
      before: before.targetHandle,
      after: after.targetHandle,
    });
  }

  // Data
  const beforeData = (before.data ?? {}) as Record<string, unknown>;
  const afterData = (after.data ?? {}) as Record<string, unknown>;
  const dataChanges = diffObjects(beforeData, afterData, "data");
  changes.push(...dataChanges);

  return changes;
}

// ── Main Diff ──────────────────────────────────────────────────

/**
 * Compute a structural diff between two diagram snapshots.
 *
 * Nodes and edges are matched by their `id` field:
 *   - **added**: IDs present in `after` but not `before`
 *   - **removed**: IDs present in `before` but not `after`
 *   - **modified**: IDs in both, but with changed properties
 *   - **unchanged**: IDs in both with identical data
 *
 * Returns a human-readable summary alongside the structured diff.
 */
export function diffDiagrams(
  before: DiagramSnapshot,
  after: DiagramSnapshot,
): DiagramDiff {
  // ── Build ID maps ────────────────────────────────────────
  const beforeNodeMap = new Map<string, Node>();
  for (const n of before.nodes) beforeNodeMap.set(n.id, n);

  const afterNodeMap = new Map<string, Node>();
  for (const n of after.nodes) afterNodeMap.set(n.id, n);

  const beforeEdgeMap = new Map<string, Edge>();
  for (const e of before.edges) beforeEdgeMap.set(e.id, e);

  const afterEdgeMap = new Map<string, Edge>();
  for (const e of after.edges) afterEdgeMap.set(e.id, e);

  // ── Diff nodes ───────────────────────────────────────────
  const addedNodes: Node[] = [];
  const removedNodes: Node[] = [];
  const modifiedNodes: ModifiedNode[] = [];
  const unchangedNodes: string[] = [];

  for (const [id, afterNode] of afterNodeMap) {
    const beforeNode = beforeNodeMap.get(id);
    if (!beforeNode) {
      addedNodes.push(afterNode);
    } else {
      const changes = diffNodePair(beforeNode, afterNode);
      if (changes.length > 0) {
        modifiedNodes.push({
          id,
          label: getNodeLabel(afterNode),
          changes,
        });
      } else {
        unchangedNodes.push(id);
      }
    }
  }

  for (const [id] of beforeNodeMap) {
    if (!afterNodeMap.has(id)) {
      removedNodes.push(beforeNodeMap.get(id)!);
    }
  }

  // ── Diff edges ───────────────────────────────────────────
  const addedEdges: Edge[] = [];
  const removedEdges: Edge[] = [];
  const modifiedEdges: ModifiedEdge[] = [];
  const unchangedEdges: string[] = [];

  for (const [id, afterEdge] of afterEdgeMap) {
    const beforeEdge = beforeEdgeMap.get(id);
    if (!beforeEdge) {
      addedEdges.push(afterEdge);
    } else {
      const changes = diffEdgePair(beforeEdge, afterEdge);
      if (changes.length > 0) {
        modifiedEdges.push({
          id,
          source: afterEdge.source,
          target: afterEdge.target,
          changes,
        });
      } else {
        unchangedEdges.push(id);
      }
    }
  }

  for (const [id] of beforeEdgeMap) {
    if (!afterEdgeMap.has(id)) {
      removedEdges.push(beforeEdgeMap.get(id)!);
    }
  }

  // ── Summary ──────────────────────────────────────────────
  const summary: string[] = [];

  if (addedNodes.length > 0) {
    const labels = addedNodes.map((n) => getNodeLabel(n)).join(", ");
    summary.push(
      `${addedNodes.length} node(s) added: ${labels}`,
    );
  }
  if (removedNodes.length > 0) {
    const labels = removedNodes.map((n) => getNodeLabel(n)).join(", ");
    summary.push(
      `${removedNodes.length} node(s) removed: ${labels}`,
    );
  }
  if (modifiedNodes.length > 0) {
    const labels = modifiedNodes.map((n) => n.label).join(", ");
    summary.push(
      `${modifiedNodes.length} node(s) modified: ${labels}`,
    );
  }
  if (addedEdges.length > 0) {
    summary.push(`${addedEdges.length} edge(s) added`);
  }
  if (removedEdges.length > 0) {
    summary.push(`${removedEdges.length} edge(s) removed`);
  }
  if (modifiedEdges.length > 0) {
    summary.push(`${modifiedEdges.length} edge(s) modified`);
  }
  if (summary.length === 0) {
    summary.push("No differences found");
  }

  return {
    nodes: {
      added: addedNodes,
      removed: removedNodes,
      modified: modifiedNodes,
      unchanged: unchangedNodes,
    },
    edges: {
      added: addedEdges,
      removed: removedEdges,
      modified: modifiedEdges,
      unchanged: unchangedEdges,
    },
    summary,
  };
}
