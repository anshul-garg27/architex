// ─────────────────────────────────────────────────────────────
// Architex — React Flow Adapter
//
// Bidirectional converters between canonical ArchitexNode/Edge
// types and React Flow Node/Edge types. All domain data is
// preserved in both directions.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from "@xyflow/react";
import type {
  ArchitexNode,
  ArchitexEdge,
  ArchitexNodeMetrics,
  ArchitexNodeConfig,
  ArchitexNodeMetadata,
  ArchitexNodeState,
  ArchitexEdgeMetrics,
} from "@/lib/types/architex-node";
import type { NodeCategory } from "@/lib/palette-items";
import type { EdgeType } from "@/lib/types";

// ── Node converters ────────────────────────────────────────

/**
 * Convert a canonical ArchitexNode to a React Flow Node.
 * All Architex-specific fields are stored inside `data`.
 */
export function toReactFlowNode(node: ArchitexNode): Node {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      label: node.label,
      category: node.category,
      componentType: node.metadata.componentType,
      icon: node.metadata.icon,
      config: node.config,
      metrics: node.metrics,
      state: node.state,
      createdAt: node.metadata.createdAt,
      updatedAt: node.metadata.updatedAt,
      ...extractExtraMetadata(node.metadata),
    },
  };
}

/**
 * Extract extra metadata keys beyond the known ones.
 */
function extractExtraMetadata(
  metadata: ArchitexNodeMetadata,
): Record<string, unknown> {
  const { icon, componentType, createdAt, updatedAt, ...rest } = metadata;
  return rest;
}

/**
 * Convert a React Flow Node back to a canonical ArchitexNode.
 * Pulls domain fields out of `data` and structures them properly.
 */
export function fromReactFlowNode(rfNode: Node): ArchitexNode {
  const data = (rfNode.data ?? {}) as Record<string, unknown>;
  const {
    label,
    category,
    componentType,
    icon,
    config,
    metrics,
    state,
    createdAt,
    updatedAt,
    ...extraMetadata
  } = data;

  return {
    id: rfNode.id,
    type: rfNode.type ?? "web-server",
    label: (label as string) ?? "",
    position: rfNode.position,
    category: (category as NodeCategory) ?? "compute",
    config: (config as ArchitexNodeConfig) ?? {},
    metrics: (metrics as ArchitexNodeMetrics) ?? {},
    state: (state as ArchitexNodeState) ?? "idle",
    metadata: {
      icon: (icon as string) ?? "Box",
      componentType: (componentType as string) ?? rfNode.type ?? "web-server",
      createdAt: createdAt as string | undefined,
      updatedAt: updatedAt as string | undefined,
      ...extraMetadata,
    },
  };
}

// ── Edge converters ────────────────────────────────────────

/**
 * Convert a canonical ArchitexEdge to a React Flow Edge.
 * Protocol, metrics, and animated state are stored in `data`.
 */
export function toReactFlowEdge(edge: ArchitexEdge): Edge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    label: edge.label,
    data: {
      edgeType: edge.protocol,
      latency: edge.metrics.latency,
      bandwidth: edge.metrics.bandwidth,
      errorRate: edge.metrics.errorRate,
      animated: edge.animated,
    },
    animated: edge.animated,
  };
}

/**
 * Convert a React Flow Edge back to a canonical ArchitexEdge.
 */
export function fromReactFlowEdge(rfEdge: Edge): ArchitexEdge {
  const data = (rfEdge.data ?? {}) as Record<string, unknown>;

  return {
    id: rfEdge.id,
    source: rfEdge.source,
    target: rfEdge.target,
    type: rfEdge.type ?? "data-flow",
    label: (rfEdge.label as string | undefined) ?? (data.label as string | undefined),
    protocol: (data.edgeType as EdgeType) ?? "http",
    metrics: {
      latency: data.latency as number | undefined,
      bandwidth: data.bandwidth as number | undefined,
      errorRate: data.errorRate as number | undefined,
    },
    animated: (data.animated as boolean) ?? rfEdge.animated ?? false,
  };
}

// ── Batch converters ───────────────────────────────────────

export function toReactFlowNodes(nodes: ArchitexNode[]): Node[] {
  return nodes.map(toReactFlowNode);
}

export function toReactFlowEdges(edges: ArchitexEdge[]): Edge[] {
  return edges.map(toReactFlowEdge);
}

export function fromReactFlowNodes(rfNodes: Node[]): ArchitexNode[] {
  return rfNodes.map(fromReactFlowNode);
}

export function fromReactFlowEdges(rfEdges: Edge[]): ArchitexEdge[] {
  return rfEdges.map(fromReactFlowEdge);
}
