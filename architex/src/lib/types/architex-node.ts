// ─────────────────────────────────────────────────────────────
// Architex — Canonical Node & Edge Types
//
// These types represent the business-domain model for Architex,
// decoupled from React Flow internals. The react-flow-adapter
// module converts between these and React Flow's Node/Edge types.
// ─────────────────────────────────────────────────────────────

import type { NodeCategory } from "@/lib/palette-items";
import type { EdgeType } from "@/lib/types";

// ── Node State ─────────────────────────────────────────────

export type ArchitexNodeState =
  | "idle"
  | "active"
  | "success"
  | "warning"
  | "error"
  | "processing";

// ── Node Metrics ───────────────────────────────────────────

export interface ArchitexNodeMetrics {
  throughput?: number;
  latency?: number;
  errorRate?: number;
  utilization?: number;
  queueDepth?: number;
  cacheHitRate?: number;
}

// ── Node Config ────────────────────────────────────────────

export type ArchitexNodeConfig = Record<string, number | string | boolean>;

// ── Node Metadata ──────────────────────────────────────────

export interface ArchitexNodeMetadata {
  /** lucide-react icon name. */
  icon: string;
  /** Concrete component, e.g. 'web-server', 'load-balancer'. */
  componentType: string;
  /** ISO timestamp of creation. */
  createdAt?: string;
  /** ISO timestamp of last update. */
  updatedAt?: string;
  /** Arbitrary extra data for extensibility. */
  [key: string]: unknown;
}

// ── ArchitexNode ───────────────────────────────────────────

export interface ArchitexNode {
  id: string;
  /** The node type key (maps to systemDesignNodeTypes). */
  type: string;
  label: string;
  position: { x: number; y: number };
  category: NodeCategory;
  config: ArchitexNodeConfig;
  metrics: ArchitexNodeMetrics;
  state: ArchitexNodeState;
  metadata: ArchitexNodeMetadata;
}

// ── Edge Metrics ───────────────────────────────────────────

export interface ArchitexEdgeMetrics {
  latency?: number;
  bandwidth?: number;
  errorRate?: number;
}

// ── ArchitexEdge ───────────────────────────────────────────

export interface ArchitexEdge {
  id: string;
  source: string;
  target: string;
  /** Visual edge type key (e.g. 'data-flow'). */
  type: string;
  label?: string;
  /** Protocol carried on this edge (http, grpc, etc.). */
  protocol: EdgeType;
  metrics: ArchitexEdgeMetrics;
  animated: boolean;
}
