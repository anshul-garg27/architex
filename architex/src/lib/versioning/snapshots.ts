import type { Node, Edge } from "@xyflow/react";

// ─────────────────────────────────────────────────────────────
// Architecture Snapshot  (INO-020)
// ─────────────────────────────────────────────────────────────

export interface ArchitectureSnapshot {
  id: string;
  label: string;
  timestamp: number;
  nodeCount: number;
  edgeCount: number;
  nodes: Node[];
  edges: Edge[];
  thumbnail?: string; // base64 mini preview
}

/**
 * Create a deep-cloned snapshot of the current canvas state.
 */
export function createSnapshot(
  label: string,
  nodes: Node[],
  edges: Edge[],
): ArchitectureSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label,
    timestamp: Date.now(),
    nodeCount: nodes.length,
    edgeCount: edges.length,
    // Deep clone to avoid stale references
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
  };
}

/**
 * Restore a snapshot, returning fresh copies of its nodes and edges.
 */
export function restoreSnapshot(
  snapshot: ArchitectureSnapshot,
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
    edges: JSON.parse(JSON.stringify(snapshot.edges)),
  };
}
