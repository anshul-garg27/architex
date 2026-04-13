// ─────────────────────────────────────────────────────────────
// Architex — Core Type Definitions
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';

/** Available learning modules in the platform. Maps to route segments and activity bar entries. */
export type ModuleType =
  | 'system-design'
  | 'algorithms'
  | 'data-structures'
  | 'lld'
  | 'database'
  | 'distributed'
  | 'networking'
  | 'os'
  | 'concurrency'
  | 'security'
  | 'ml-design'
  | 'interview';

/** Node category — drives palette grouping and colour mapping. */
export type NodeCategory =
  | 'compute'
  | 'load-balancing'
  | 'storage'
  | 'messaging'
  | 'networking'
  | 'processing'
  | 'client'
  | 'observability'
  | 'security'
  | 'services'
  | 'fintech'
  | 'data-engineering'
  | 'ai-llm'
  | 'db-internals';

// ── Node Data ───────────────────────────────────────────────

/** Data payload carried by every system-design canvas node. */
export interface SystemDesignNodeData extends Record<string, unknown> {
  label: string;
  category: NodeCategory;
  /** Concrete component, e.g. 'web-server', 'load-balancer-l7', 'redis'. */
  componentType: string;
  /** lucide-react icon name. */
  icon: string;
  config: Record<string, number | string | boolean>;
  metrics?: {
    throughput?: number;
    latency?: number;
    errorRate?: number;
    utilization?: number;
    queueDepth?: number;
    cacheHitRate?: number;
  };
  state: 'idle' | 'active' | 'success' | 'warning' | 'error' | 'processing';
}

/** Typed React Flow Node carrying SystemDesignNodeData. */
export type SystemDesignNode = Node<SystemDesignNodeData>;

// ── Edge Types ──────────────────────────────────────────────

/** Communication protocol type for edges between system components. */
export type EdgeType =
  | 'http'
  | 'grpc'
  | 'graphql'
  | 'websocket'
  | 'message-queue'
  | 'event-stream'
  | 'db-query'
  | 'cache-lookup'
  | 'replication';

/** Data payload carried by every system-design canvas edge. */
export interface SystemDesignEdgeData extends Record<string, unknown> {
  /** Protocol type determining visual style and label. */
  edgeType: EdgeType;
  /** Round-trip latency in milliseconds. */
  latency?: number;
  /** Maximum bandwidth in Mbps. */
  bandwidth?: number;
  /** Percentage of requests that fail (0-1). */
  errorRate?: number;
  /** Whether the edge shows flow animation during simulation. */
  animated?: boolean;
  /** Requests per second flowing through this edge (set during simulation). */
  throughput?: number;
}

/** Typed React Flow Edge carrying SystemDesignEdgeData. */
export type SystemDesignEdge = Edge<SystemDesignEdgeData>;

// ── Node Shapes ────────────────────────────────────────────

/** Visual shape for rendering a node on the canvas. Mapped from NodeCategory by default. */
export type NodeShape =
  | 'rectangle'
  | 'cylinder'
  | 'parallelogram'
  | 'hexagon'
  | 'pill'
  | 'dashed-rect'
  | 'octagon'
  | 'diamond';

// ── Component Palette ───────────────────────────────────────

/** Descriptor shown in the sidebar drag-and-drop palette. */
export interface PaletteItem {
  type: string;
  label: string;
  category: NodeCategory;
  icon: string;
  description: string;
  defaultConfig: Record<string, number | string | boolean>;
  /** Visual shape for the canvas node. Defaults to category-based shape. */
  shape: NodeShape;
}

// ── Simulation ──────────────────────────────────────────────

/** Instruction sent to the simulation worker (play, pause, inject chaos, etc.). */
export interface SimulationCommand {
  /** Command identifier, e.g. 'play', 'pause', 'injectChaos'. */
  type: string;
  /** Command-specific payload. */
  payload: unknown;
}

/** Point-in-time capture of all node and edge metrics at a given simulation tick. */
export interface SimulationSnapshot {
  nodes: NodeMetrics[];
  edges: EdgeMetrics[];
  /** Zero-based simulation tick number. */
  tick: number;
}

/** Discrete event emitted during a simulation run (e.g. failure, recovery, alert). */
export interface SimulationEvent {
  /** Event identifier. */
  type: string;
  /** Epoch timestamp in milliseconds. */
  timestamp: number;
  /** Event-specific payload. */
  data: unknown;
}

/** Runtime metrics for a single node during simulation. */
export interface NodeMetrics {
  /** Unique node identifier matching the canvas node id. */
  id: string;
  /** Requests processed per second. */
  throughput: number;
  /** Average response latency in milliseconds. */
  latency: number;
  /** Fraction of failed requests (0-1). */
  errorRate: number;
  /** CPU/resource utilization percentage (0-1). */
  utilization: number;
  /** Number of requests waiting in the processing queue. */
  queueDepth: number;
}

/** Runtime metrics for a single edge during simulation. */
export interface EdgeMetrics {
  /** Unique edge identifier matching the canvas edge id. */
  id: string;
  /** Requests per second flowing through the edge. */
  throughput: number;
  /** Average latency in milliseconds. */
  latency: number;
  /** Fraction of packets lost in transit (0-1). */
  packetLoss: number;
}
