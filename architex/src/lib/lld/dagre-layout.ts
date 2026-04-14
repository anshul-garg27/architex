"use client";

/**
 * Dagre-based hierarchical auto-layout for UML class diagrams.
 *
 * Uses the Sugiyama algorithm (via @dagrejs/dagre) to compute
 * hierarchy-aware positions: interfaces at top, concrete classes
 * at bottom, minimal edge crossings, proper spacing.
 *
 * Also computes edge routing points so relationship lines can
 * follow smooth paths instead of cutting through intermediate boxes.
 */

import dagre from "@dagrejs/dagre";
import type { UMLClass, UMLRelationship } from "./types";
import { classBoxWidth, classBoxHeight } from "@/components/modules/lld/constants";

// ── Types ──────────────────────────────────────────────────

export interface LayoutOptions {
  /** Direction: "TB" (top-bottom) or "LR" (left-right). Default "TB". */
  rankDir?: "TB" | "LR";
  /** Horizontal gap between nodes in the same rank. Default 60. */
  nodeSep?: number;
  /** Vertical gap between ranks. Default 80. */
  rankSep?: number;
  /** Minimum separation between edges. Default 20. */
  edgeSep?: number;
  /** Alignment within rank: "UL" | "UR" | "DL" | "DR". Default undefined (center). */
  align?: "UL" | "UR" | "DL" | "DR";
}

export interface LayoutEdgePoints {
  /** Relationship id → array of routed points from dagre */
  [relId: string]: Array<{ x: number; y: number }>;
}

export interface LayoutResult {
  classes: UMLClass[];
  edgePoints: LayoutEdgePoints;
}

// ── Rank assignment helpers ────────────────────────────────

/**
 * Assign ranks (layers) based on UML relationship semantics:
 * - Interfaces/abstracts that are inherited → top ranks
 * - Concrete implementors → lower ranks
 * - Composition/aggregation sources → above targets
 */
function inferEdgeDirection(type: UMLRelationship["type"]): "up" | "down" {
  switch (type) {
    // inheritance/realization: child → parent (child is lower, parent higher)
    case "inheritance":
    case "realization":
      return "up";
    // composition/aggregation: whole → part (whole is higher)
    case "composition":
    case "aggregation":
      return "down";
    // association/dependency: source → target (source is higher or same)
    case "association":
    case "dependency":
      return "down";
  }
}

// ── Main layout function ───────────────────────────────────

export function layoutDagre(
  classes: UMLClass[],
  relationships: UMLRelationship[],
  options: LayoutOptions = {},
): LayoutResult {
  const {
    rankDir = "TB",
    nodeSep = 80,
    rankSep = 100,
    edgeSep = 30,
    align,
  } = options;

  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: rankDir,
    nodesep: nodeSep,
    ranksep: rankSep,
    edgesep: edgeSep,
    align,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes with actual computed dimensions
  for (const cls of classes) {
    g.setNode(cls.id, {
      label: cls.name,
      width: classBoxWidth(cls) + 20,  // padding for breathing room
      height: classBoxHeight(cls) + 16,
    });
  }

  // Add edges with direction that produces correct hierarchy.
  // Dagre places the edge *source* node in a higher rank (visually above in TB).
  // For inheritance/realization the UML source is the child, so we REVERSE the
  // dagre edge so the parent (target) sits above the child (source).
  for (const rel of relationships) {
    const dir = inferEdgeDirection(rel.type);
    if (dir === "up") {
      // Reverse: parent → child so parent gets a higher rank
      g.setEdge(rel.target, rel.source, { label: rel.id });
    } else {
      g.setEdge(rel.source, rel.target, { label: rel.id });
    }
  }

  // Run the layout algorithm
  dagre.layout(g);

  // Extract positioned classes
  // Dagre gives center coordinates; we need top-left
  const positionedClasses = classes.map((cls) => {
    const node = g.node(cls.id);
    if (!node) return cls;
    return {
      ...cls,
      x: Math.round(node.x - classBoxWidth(cls) / 2),
      y: Math.round(node.y - classBoxHeight(cls) / 2),
    };
  });

  // Extract edge routing points (match the edge direction used above)
  const edgePoints: LayoutEdgePoints = {};
  for (const rel of relationships) {
    const dir = inferEdgeDirection(rel.type);
    const edge =
      dir === "up"
        ? g.edge(rel.target, rel.source)   // reversed
        : g.edge(rel.source, rel.target);
    if (edge?.points) {
      edgePoints[rel.id] = edge.points.map((p: { x: number; y: number }) => ({
        x: Math.round(p.x),
        y: Math.round(p.y),
      }));
    }
  }

  return { classes: positionedClasses, edgePoints };
}
