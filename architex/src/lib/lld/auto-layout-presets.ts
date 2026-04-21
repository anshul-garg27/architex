/**
 * Four auto-layout presets for the Build-mode canvas.
 *
 * Presets 1-3 use @dagrejs/dagre (hierarchical Sugiyama layout) with
 * different rankDir / spacing combinations. Preset 4 (circular) uses a
 * standalone radial arranger because Dagre is hierarchical-only.
 *
 * These operate on React Flow `Node[]` / `Edge[]` directly rather than
 * the UML-specific `layoutDagre` in `dagre-layout.ts`, which targets
 * `UMLClass[]` / `UMLRelationship[]`. Build mode mixes pattern-library
 * templates and arbitrary class nodes, so the generic graph wrapper is
 * the right fit.
 */

import dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

export interface GenericLayoutOptions {
  rankDir: "TB" | "LR";
  nodeSep: number;
  rankSep: number;
}

export type AutoLayoutPresetId =
  | "left-right"
  | "top-down"
  | "layered"
  | "circular";

export interface AutoLayoutPreset {
  id: AutoLayoutPresetId;
  label: string;
  description: string;
  hotkey: string; // e.g. "Cmd+Shift+L"
  options: GenericLayoutOptions | "circular";
}

export const AUTO_LAYOUT_PRESETS: readonly AutoLayoutPreset[] = [
  {
    id: "left-right",
    label: "Left → Right",
    description: "Horizontal hierarchy. Best for pipelines and data flow.",
    hotkey: "Cmd+Shift+L",
    options: { rankDir: "LR", nodeSep: 60, rankSep: 100 },
  },
  {
    id: "top-down",
    label: "Top → Down",
    description: "Classic UML hierarchy. Interfaces above, concretes below.",
    hotkey: "Cmd+Shift+T",
    options: { rankDir: "TB", nodeSep: 60, rankSep: 90 },
  },
  {
    id: "layered",
    label: "Layered",
    description: "Looser ranks, wider gaps. Best for large graphs.",
    hotkey: "Cmd+Shift+Y",
    options: { rankDir: "TB", nodeSep: 80, rankSep: 140 },
  },
  {
    id: "circular",
    label: "Circular",
    description: "Radial arrangement. Best for peer-network topologies.",
    hotkey: "Cmd+Shift+O",
    options: "circular",
  },
] as const;

/** Default node dimensions for Dagre rank computation. */
const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 140;

/**
 * Run Dagre on arbitrary React Flow nodes/edges, returning nodes with
 * updated `position`. Caller can splice these back into the store.
 */
export function computeGenericDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: GenericLayoutOptions,
): Node[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: options.rankDir,
    nodesep: options.nodeSep,
    ranksep: options.rankSep,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const w = typeof node.width === "number" ? node.width : DEFAULT_NODE_WIDTH;
    const h =
      typeof node.height === "number" ? node.height : DEFAULT_NODE_HEIGHT;
    g.setNode(node.id, { width: w, height: h });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const laid = g.node(node.id);
    if (!laid) return node;
    const w = typeof node.width === "number" ? node.width : DEFAULT_NODE_WIDTH;
    const h =
      typeof node.height === "number" ? node.height : DEFAULT_NODE_HEIGHT;
    return {
      ...node,
      position: {
        x: Math.round(laid.x - w / 2),
        y: Math.round(laid.y - h / 2),
      },
    };
  });
}

/**
 * Circular layout: arrange nodes around a circle.
 * Returns position-only deltas; caller merges with existing node objects.
 */
export function circularLayout(
  nodes: Node[],
  radius = 320,
  center = { x: 480, y: 320 },
): Array<{ id: string; position: { x: number; y: number } }> {
  const n = nodes.length;
  if (n === 0) return [];
  return nodes.map((node, i) => {
    const angle = (i / n) * 2 * Math.PI;
    return {
      id: node.id,
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      },
    };
  });
}
