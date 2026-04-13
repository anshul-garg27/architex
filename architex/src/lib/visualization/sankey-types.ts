// ─────────────────────────────────────────────────────────────
// Architex — Sankey Diagram Type Definitions
// ─────────────────────────────────────────────────────────────
//
// Type definitions for the Sankey layout algorithm and
// interactive SVG diagram component (INO-024).
//
// Node positions are computed via topological column assignment
// and iterative relaxation. Link paths are cubic bezier curves
// with width proportional to flow volume.
// ─────────────────────────────────────────────────────────────

// ── Input Types ────────────────────────────────────────────

/** Raw node definition before layout. */
export interface SankeyInputNode {
  /** Unique identifier. */
  id: string;
  /** Display label. */
  label: string;
  /** Optional category for color coding. */
  category?: string;
  /** Optional fixed column assignment (0-based). */
  column?: number;
}

/** Raw link definition before layout. */
export interface SankeyInputLink {
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Flow volume (positive number). */
  value: number;
}

// ── Layout Output Types ────────────────────────────────────

/** Node with computed layout positions. */
export interface SankeyNode {
  /** Unique identifier. */
  id: string;
  /** Display label. */
  label: string;
  /** Column index (0 = leftmost). */
  column: number;
  /** Total flow volume through this node. */
  value: number;
  /** Left edge x coordinate. */
  x: number;
  /** Top edge y coordinate. */
  y: number;
  /** Width of the node rectangle. */
  width: number;
  /** Height proportional to value. */
  height: number;
  /** Fill color. */
  color: string;
  /** Optional category for color coding. */
  category?: string;
  /** Source link y offset tracker (used during link layout). */
  sourceOffset: number;
  /** Target link y offset tracker (used during link layout). */
  targetOffset: number;
}

/** Link with computed SVG path data. */
export interface SankeyLink {
  /** Source node id. */
  source: string;
  /** Target node id. */
  target: string;
  /** Flow volume. */
  value: number;
  /** SVG path `d` attribute (cubic bezier). */
  path: string;
  /** Link width (proportional to value). */
  width: number;
  /** Fill/stroke color. */
  color: string;
  /** Y coordinate at source (center of link band). */
  sy: number;
  /** Y coordinate at target (center of link band). */
  ty: number;
}

/** Layout configuration options. */
export interface SankeyOptions {
  /** Total SVG width in pixels. */
  width: number;
  /** Total SVG height in pixels. */
  height: number;
  /** Vertical padding between nodes in the same column. */
  nodePadding: number;
  /** Width of each node rectangle. */
  nodeWidth: number;
  /** Number of relaxation iterations for crossing minimization. */
  iterations: number;
}

/** Complete layout result. */
export interface SankeyLayout {
  nodes: SankeyNode[];
  links: SankeyLink[];
}
