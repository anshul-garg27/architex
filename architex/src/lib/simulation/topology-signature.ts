/**
 * Topology Signature System (SIM-001)
 *
 * Analyzes the React Flow graph to compute a structural fingerprint for each
 * node. The fingerprint encodes what kind of component it is, what connects
 * upstream/downstream, and what behavioral traits it exhibits.
 *
 * Used by the rule database (SIM-004) to match topology-aware behavior profiles
 * and by the issue taxonomy (SIM-003) for context-aware issue detection.
 */

import type { Node, Edge } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Behavioral trait inferred from a node's position in the topology graph. */
export type TopologyTrait =
  | 'autoscale'
  | 'is_sync_request_path'
  | 'is_async_path'
  | 'has_cache_upstream'
  | 'has_lb_upstream'
  | 'is_terminal'
  | 'is_entry'
  | 'replicated'
  | 'sharded'
  | 'has_circuit_breaker'
  | 'is_write_heavy'
  | 'is_read_heavy';

/** Structural fingerprint for a single node in the topology. */
export interface TopologySignature {
  /** Full signature string (same as signatureToKey output). */
  raw: string;
  /** Concrete component type, e.g. 'load-balancer', 'redis-cache'. */
  componentType: string;
  /** Sorted component types of nodes feeding into this node. */
  upstreamTypes: string[];
  /** Sorted component types of nodes this node feeds. */
  downstreamTypes: string[];
  /** Inferred behavioral traits based on graph position and node config. */
  traits: TopologyTrait[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract componentType from node data, defaulting to 'unknown'. */
function getComponentType(node: Node): string {
  const data = node.data as Record<string, unknown> | undefined;
  return (data?.componentType as string) ?? 'unknown';
}

/** Extract a numeric config value from node data. */
function getConfigNum(node: Node, key: string): number {
  const data = node.data as Record<string, unknown> | undefined;
  const config = (data?.config ?? {}) as Record<string, unknown>;
  const val = config[key];
  return typeof val === 'number' ? val : 0;
}

/** Extract a boolean config value from node data. */
function getConfigBool(node: Node, key: string): boolean {
  const data = node.data as Record<string, unknown> | undefined;
  const config = (data?.config ?? {}) as Record<string, unknown>;
  return config[key] === true;
}

/** Extract a numeric value directly from node data (not config). */
function getDataNum(node: Node, key: string): number {
  const data = node.data as Record<string, unknown> | undefined;
  const val = data?.[key];
  return typeof val === 'number' ? val : 0;
}

/** Get the edge type (edgeType from data, or fallback from type field). */
function getEdgeType(edge: Edge): string {
  const data = edge.data as Record<string, unknown> | undefined;
  return (data?.edgeType as string) ?? (edge.type as string) ?? '';
}

// ---------------------------------------------------------------------------
// Trait inference
// ---------------------------------------------------------------------------

/** Sync edge type strings. */
const SYNC_EDGE_TYPES = new Set(['sync', 'http', 'grpc', 'graphql', 'websocket', 'db-query', 'cache-lookup']);

/** Async edge type strings. */
const ASYNC_EDGE_TYPES = new Set(['async', 'queue', 'message-queue', 'event-stream']);

/**
 * Infer behavioral traits for a node based on its topology position,
 * configuration, and edge types.
 */
function inferTraits(
  node: Node,
  upstreamTypes: string[],
  downstreamTypes: string[],
  inboundEdges: Edge[],
  outboundEdges: Edge[],
): TopologyTrait[] {
  const traits: TopologyTrait[] = [];

  // is_entry: no upstream edges
  if (upstreamTypes.length === 0) {
    traits.push('is_entry');
  }

  // is_terminal: no downstream edges
  if (downstreamTypes.length === 0) {
    traits.push('is_terminal');
  }

  // has_cache_upstream: any upstream type contains 'cache'
  if (upstreamTypes.some((t) => t.includes('cache'))) {
    traits.push('has_cache_upstream');
  }

  // has_lb_upstream: any upstream type contains 'load-balancer'
  if (upstreamTypes.some((t) => t.includes('load-balancer'))) {
    traits.push('has_lb_upstream');
  }

  // autoscale: node data has autoScale === true
  if (getConfigBool(node, 'autoScale')) {
    traits.push('autoscale');
  }

  // replicated: node data has replicas > 1
  if (getConfigNum(node, 'replicas') > 1) {
    traits.push('replicated');
  }

  // sharded: node data has shards > 1
  if (getConfigNum(node, 'shards') > 1) {
    traits.push('sharded');
  }

  // is_sync_request_path: all edges to/from are sync types
  const allEdges = [...inboundEdges, ...outboundEdges];
  if (allEdges.length > 0) {
    const allSync = allEdges.every((e) => {
      const et = getEdgeType(e);
      return et === '' || SYNC_EDGE_TYPES.has(et);
    });
    if (allSync) {
      traits.push('is_sync_request_path');
    }
  }

  // is_async_path: any edge to/from is async type
  if (allEdges.some((e) => ASYNC_EDGE_TYPES.has(getEdgeType(e)))) {
    traits.push('is_async_path');
  }

  // has_circuit_breaker: downstream includes circuit-breaker type
  if (downstreamTypes.some((t) => t.includes('circuit-breaker'))) {
    traits.push('has_circuit_breaker');
  }

  // is_write_heavy: node data writeRatio > 0.7
  if (getDataNum(node, 'writeRatio') > 0.7 || getConfigNum(node, 'writeRatio') > 0.7) {
    traits.push('is_write_heavy');
  }

  // is_read_heavy: node data readRatio > 0.7
  if (getDataNum(node, 'readRatio') > 0.7 || getConfigNum(node, 'readRatio') > 0.7) {
    traits.push('is_read_heavy');
  }

  return traits.sort();
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Compute the topology signature for a single node.
 *
 * Walks edges to find upstream/downstream component types and infers
 * behavioral traits from adjacency patterns and node configuration.
 *
 * @param nodeId - The node to compute the signature for
 * @param nodes  - All nodes in the graph
 * @param edges  - All edges in the graph
 * @returns The computed TopologySignature
 */
export function computeSignature(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
): TopologySignature {
  const nodeMap = new Map<string, Node>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const targetNode = nodeMap.get(nodeId);
  if (!targetNode) {
    return {
      raw: 'unknown|up:|down:|traits:',
      componentType: 'unknown',
      upstreamTypes: [],
      downstreamTypes: [],
      traits: [],
    };
  }

  const componentType = getComponentType(targetNode);

  // Find upstream and downstream nodes via edges
  const inboundEdges: Edge[] = [];
  const outboundEdges: Edge[] = [];
  const upstreamIds: string[] = [];
  const downstreamIds: string[] = [];

  for (const edge of edges) {
    if (edge.target === nodeId) {
      inboundEdges.push(edge);
      upstreamIds.push(edge.source);
    }
    if (edge.source === nodeId) {
      outboundEdges.push(edge);
      downstreamIds.push(edge.target);
    }
  }

  // Resolve to component types
  const upstreamTypes = upstreamIds
    .map((id) => {
      const n = nodeMap.get(id);
      return n ? getComponentType(n) : 'unknown';
    })
    .sort();

  const downstreamTypes = downstreamIds
    .map((id) => {
      const n = nodeMap.get(id);
      return n ? getComponentType(n) : 'unknown';
    })
    .sort();

  // Infer traits
  const traits = inferTraits(targetNode, upstreamTypes, downstreamTypes, inboundEdges, outboundEdges);

  const sig: TopologySignature = {
    raw: '', // filled below
    componentType,
    upstreamTypes,
    downstreamTypes,
    traits,
  };

  sig.raw = signatureToKey(sig);
  return sig;
}

/**
 * Convert a TopologySignature to a deterministic string key.
 *
 * Format: `"{type}|up:{sorted}|down:{sorted}|traits:{sorted}"`
 *
 * @param sig - The signature to convert
 * @returns Deterministic key string
 */
export function signatureToKey(sig: TopologySignature): string {
  const up = sig.upstreamTypes.slice().sort().join(',');
  const down = sig.downstreamTypes.slice().sort().join(',');
  const traits = sig.traits.slice().sort().join(',');
  return `${sig.componentType}|up:${up}|down:${down}|traits:${traits}`;
}

/**
 * Batch-compute topology signatures for every node in the graph.
 *
 * @param nodes - All nodes in the graph
 * @param edges - All edges in the graph
 * @returns Map from nodeId to TopologySignature
 */
export function buildSignatureCache(
  nodes: Node[],
  edges: Edge[],
): Map<string, TopologySignature> {
  const cache = new Map<string, TopologySignature>();
  for (const node of nodes) {
    cache.set(node.id, computeSignature(node.id, nodes, edges));
  }
  return cache;
}
