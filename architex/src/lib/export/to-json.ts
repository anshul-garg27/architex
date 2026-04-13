import type { Node, Edge } from '@xyflow/react';

// ─────────────────────────────────────────────────────────────
// JSON Export / Import
// ─────────────────────────────────────────────────────────────

export interface DiagramJSON {
  version: '1.0';
  name: string;
  createdAt: string;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    type: string;
    data?: Record<string, unknown>;
  }>;
  metadata?: {
    moduleType: string;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * Serialize canvas nodes and edges into a portable JSON format.
 */
export function exportToJSON(
  nodes: Node[],
  edges: Edge[],
  name?: string,
): DiagramJSON {
  // Infer the module type from the first node's data if available
  const firstNodeData = nodes[0]?.data as Record<string, unknown> | undefined;
  const moduleType =
    typeof firstNodeData?.category === 'string'
      ? firstNodeData.category
      : 'system-design';

  return {
    version: '1.0',
    name: name ?? 'Untitled Diagram',
    createdAt: new Date().toISOString(),
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'default',
      position: { x: n.position.x, y: n.position.y },
      data: n.data as Record<string, unknown>,
    })),
    edges: edges.map((e) => {
      const mapped: DiagramJSON['edges'][number] = {
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type ?? 'default',
      };
      if (e.sourceHandle != null) mapped.sourceHandle = e.sourceHandle;
      if (e.targetHandle != null) mapped.targetHandle = e.targetHandle;
      if (e.data != null) mapped.data = e.data as Record<string, unknown>;
      return mapped;
    }),
    metadata: {
      moduleType,
      nodeCount: nodes.length,
      edgeCount: edges.length,
    },
  };
}

/**
 * Reconstruct React Flow nodes and edges from a DiagramJSON payload.
 */
export function importFromJSON(
  json: DiagramJSON,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = json.nodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));

  const edges: Edge[] = json.edges.map((e) => {
    const edge: Edge = {
      id: e.id,
      source: e.source,
      target: e.target,
      type: e.type,
    };
    if (e.sourceHandle != null) edge.sourceHandle = e.sourceHandle;
    if (e.targetHandle != null) edge.targetHandle = e.targetHandle;
    if (e.data != null) edge.data = e.data;
    return edge;
  });

  return { nodes, edges };
}

/**
 * Trigger a browser download of the diagram as a `.json` file.
 */
export function downloadJSON(
  diagram: DiagramJSON,
  filename?: string,
): void {
  const json = JSON.stringify(diagram, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename ?? `${diagram.name.replace(/\s+/g, '-').toLowerCase()}.json`;
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
