// ─────────────────────────────────────────────────────────────
// Architex — COL-012 Fork Design
// ─────────────────────────────────────────────────────────────
//
// Creates a deep copy of a design with new IDs for all nodes
// and edges, plus attribution metadata linking to the original.

import type { Node, Edge } from '@xyflow/react';

// ── Types ─────────────────────────────────────────────────────

/** Minimal design representation for forking. */
export interface ForkableDesign {
  title: string;
  nodes: Node[];
  edges: Edge[];
}

/** The result of forking a design. */
export interface ForkedDesign {
  title: string;
  nodes: Node[];
  edges: Edge[];
  forkedFrom: {
    author: string;
    originalTitle: string;
    forkedAt: number;
  };
}

// ── Public API ────────────────────────────────────────────────

/**
 * Fork a design: deep-clones nodes and edges with fresh IDs,
 * and attaches "Forked from [author]" attribution metadata.
 */
export function forkDesign(design: ForkableDesign, originalAuthor: string): ForkedDesign {
  // Build a mapping from old node ID -> new node ID
  const nodeIdMap = new Map<string, string>();

  for (const node of design.nodes) {
    nodeIdMap.set(node.id, generateId('node'));
  }

  // Clone nodes with new IDs
  const forkedNodes: Node[] = design.nodes.map((node) => ({
    ...structuredClone(node),
    id: nodeIdMap.get(node.id)!,
    // Update parentId references if present (for grouped nodes)
    ...(node.parentId && nodeIdMap.has(node.parentId)
      ? { parentId: nodeIdMap.get(node.parentId)! }
      : {}),
  }));

  // Clone edges with new IDs and remapped source/target
  const forkedEdges: Edge[] = design.edges.map((edge) => ({
    ...structuredClone(edge),
    id: generateId('edge'),
    source: nodeIdMap.get(edge.source) ?? edge.source,
    target: nodeIdMap.get(edge.target) ?? edge.target,
  }));

  return {
    title: `${design.title} (fork)`,
    nodes: forkedNodes,
    edges: forkedEdges,
    forkedFrom: {
      author: originalAuthor,
      originalTitle: design.title,
      forkedAt: Date.now(),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────

let counter = 0;

function generateId(prefix: string): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${timestamp}_${random}_${counter}`;
}
