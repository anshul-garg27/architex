/**
 * SLA Calculator (INO-009)
 *
 * Computes theoretical availability from an architecture topology.
 *
 * Algorithm:
 *   1. Build a directed graph (adjacency list) from canvas nodes/edges.
 *   2. Identify entry nodes (no inbound edges or category === 'client').
 *   3. Identify terminal nodes (no outbound edges, excluding clients).
 *   4. Enumerate all paths from every entry to every terminal.
 *   5. For each path, compute composite availability:
 *        - Series (sequential) components: multiply A_i
 *        - Parallel (replicated) components: 1 - (1 - A)^N
 *   6. Overall availability = minimum across all paths (weakest path).
 *   7. Detect SPOFs: any node with replicas === 1 on the critical path.
 *   8. Generate actionable recommendations.
 */

import type { Node, Edge } from '@xyflow/react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SLAResult {
  /** Overall theoretical availability, e.g. 0.9999 */
  overallAvailability: number;
  /** Human-friendly nines string, e.g. "4 nines (99.99%)" */
  nines: string;
  /** Estimated annual downtime in minutes */
  annualDowntimeMinutes: number;
  /** Node IDs on the weakest (lowest-availability) path */
  weakestPath: string[];
  /** Per-component availability breakdown */
  perComponentAvailability: Array<{
    nodeId: string;
    label: string;
    availability: number;
    isSPOF: boolean;
  }>;
  /** Actionable recommendations to improve availability */
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Default availability per component type (single instance)
// ---------------------------------------------------------------------------

const COMPONENT_AVAILABILITY: Record<string, number> = {
  // Compute
  'web-server': 0.999,
  'app-server': 0.999,
  'serverless': 0.9999,
  'worker': 0.999,
  'batch-processor': 0.999,
  'stream-processor': 0.999,
  'ml-inference': 0.999,

  // Load balancing / networking
  'load-balancer': 0.9999,
  'reverse-proxy': 0.9999,
  'api-gateway': 0.9999,
  'cdn': 0.9999,
  'cdn-edge': 0.9999,
  'dns': 0.9999,
  'firewall': 0.9999,
  'rate-limiter': 0.9999,

  // Storage
  'database': 0.9995,
  'document-db': 0.9995,
  'wide-column': 0.9995,
  'graph-db': 0.9995,
  'timeseries-db': 0.9995,
  'object-storage': 0.99999,
  'storage': 0.99999,
  'search-engine': 0.999,

  // Messaging
  'cache': 0.999,
  'message-queue': 0.9999,
  'pub-sub': 0.9999,
  'event-bus': 0.9999,

  // Client (always available from SLA perspective)
  'client': 1.0,
  'browser': 1.0,
  'mobile': 1.0,

  // Observability (not on critical path, but include for completeness)
  'logging': 0.999,
  'monitoring': 0.999,
  'tracing': 0.999,

  // Security
  'auth-service': 0.999,
  'secret-manager': 0.9999,
};

/** Fallback availability for unknown component types. */
const DEFAULT_AVAILABILITY = 0.999;

// ---------------------------------------------------------------------------
// Minutes in a year (365.25 days)
// ---------------------------------------------------------------------------

const MINUTES_PER_YEAR = 365.25 * 24 * 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get the base availability for a single instance of a component type.
 */
function getBaseAvailability(componentType: string): number {
  return COMPONENT_AVAILABILITY[componentType] ?? DEFAULT_AVAILABILITY;
}

/**
 * Get the replica count from node data config.
 */
function getReplicaCount(data: Record<string, unknown>): number {
  const config = (data.config ?? {}) as Record<string, unknown>;
  if (typeof config.replicas === 'number' && config.replicas >= 1) {
    return Math.floor(config.replicas);
  }
  if (typeof config.instances === 'number' && config.instances >= 1) {
    return Math.floor(config.instances);
  }
  return 1;
}

/**
 * Compute effective availability for a component with N replicas.
 * Parallel: 1 - (1 - A)^N
 */
function parallelAvailability(baseAvail: number, replicas: number): number {
  if (replicas <= 1) return baseAvail;
  return 1 - Math.pow(1 - baseAvail, replicas);
}

/**
 * Convert an availability fraction to a human-friendly "nines" string.
 */
function availabilityToNines(avail: number): string {
  if (avail >= 1) return '100% (infinite nines)';
  if (avail <= 0) return '0%';

  // Count nines: -log10(1 - avail)
  const nines = -Math.log10(1 - avail);
  const rounded = Math.round(nines * 10) / 10;
  const pct = (avail * 100).toFixed(Math.max(0, Math.ceil(nines)));

  if (rounded === Math.floor(rounded)) {
    return `${Math.floor(rounded)} nines (${pct}%)`;
  }
  return `~${rounded.toFixed(1)} nines (${pct}%)`;
}

/**
 * Format annual downtime for display.
 */
function formatDowntime(minutes: number): string {
  if (minutes < 1) {
    return `${(minutes * 60).toFixed(1)} sec/year`;
  }
  if (minutes < 60) {
    return `${minutes.toFixed(1)} min/year`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${hours.toFixed(2)} hours/year`;
  }
  const days = hours / 24;
  return `${days.toFixed(2)} days/year`;
}

// ---------------------------------------------------------------------------
// Graph / Path utilities
// ---------------------------------------------------------------------------

interface GraphInfo {
  adjacency: Map<string, string[]>;
  entryNodeIds: string[];
  terminalNodeIds: string[];
}

function buildGraph(nodes: Node[], edges: Edge[]): GraphInfo {
  const adjacency = new Map<string, string[]>();
  const hasInbound = new Set<string>();
  const hasOutbound = new Set<string>();

  // Initialize all nodes
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const list = adjacency.get(edge.source);
    if (list) {
      list.push(edge.target);
    }
    hasInbound.add(edge.target);
    hasOutbound.add(edge.source);
  }

  const entryNodeIds: string[] = [];
  const terminalNodeIds: string[] = [];

  for (const node of nodes) {
    const data = node.data as Record<string, unknown> | undefined;
    const isClient = data?.category === 'client';

    if (isClient || !hasInbound.has(node.id)) {
      entryNodeIds.push(node.id);
    }

    // Terminal: no outbound edges, and not a client node
    if (!hasOutbound.has(node.id) && !isClient) {
      terminalNodeIds.push(node.id);
    }
  }

  // Fallback: if no entries found, use first node
  if (entryNodeIds.length === 0 && nodes.length > 0) {
    entryNodeIds.push(nodes[0].id);
  }

  // Fallback: if no terminals found, use nodes with no outbound edges
  if (terminalNodeIds.length === 0 && nodes.length > 0) {
    // Use any node without outbound edges, including clients
    for (const node of nodes) {
      if (!hasOutbound.has(node.id)) {
        terminalNodeIds.push(node.id);
      }
    }
  }

  // Ultimate fallback: use the last node
  if (terminalNodeIds.length === 0 && nodes.length > 0) {
    terminalNodeIds.push(nodes[nodes.length - 1].id);
  }

  return { adjacency, entryNodeIds, terminalNodeIds };
}

/**
 * Find all simple paths from `start` to any node in `terminals`.
 * Uses DFS with cycle detection. Caps at MAX_PATHS to avoid combinatorial
 * explosion on very large graphs.
 */
const MAX_PATHS = 1000;

function findAllPaths(
  adjacency: Map<string, string[]>,
  start: string,
  terminals: Set<string>,
): string[][] {
  const paths: string[][] = [];

  function dfs(current: string, path: string[], visited: Set<string>): void {
    if (paths.length >= MAX_PATHS) return;

    path.push(current);
    visited.add(current);

    if (terminals.has(current)) {
      paths.push([...path]);
    }

    const neighbors = adjacency.get(current) ?? [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        dfs(next, path, visited);
      }
    }

    path.pop();
    visited.delete(current);
  }

  dfs(start, [], new Set());
  return paths;
}

// ---------------------------------------------------------------------------
// Main calculator
// ---------------------------------------------------------------------------

export function calculateSLA(nodes: Node[], edges: Edge[]): SLAResult {
  // Handle empty canvas
  if (nodes.length === 0) {
    return {
      overallAvailability: 1,
      nines: 'N/A (no components)',
      annualDowntimeMinutes: 0,
      weakestPath: [],
      perComponentAvailability: [],
      recommendations: ['Add components to your architecture to calculate SLA.'],
    };
  }

  // Build node lookup
  const nodeMap = new Map<string, Node>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Compute per-component effective availability
  const componentAvails: Map<string, { avail: number; replicas: number; label: string; componentType: string }> = new Map();

  for (const node of nodes) {
    const data = node.data as Record<string, unknown> | undefined;
    if (!data) continue;

    const componentType = (data.componentType as string) ?? '';
    const label = (data.label as string) ?? componentType ?? node.id;
    const replicas = getReplicaCount(data);
    const baseAvail = getBaseAvailability(componentType);
    const effectiveAvail = parallelAvailability(baseAvail, replicas);

    componentAvails.set(node.id, {
      avail: effectiveAvail,
      replicas,
      label,
      componentType,
    });
  }

  // Build graph
  const { adjacency, entryNodeIds, terminalNodeIds } = buildGraph(nodes, edges);
  const terminalSet = new Set(terminalNodeIds);

  // Find all paths from entries to terminals
  let allPaths: string[][] = [];
  for (const entryId of entryNodeIds) {
    const paths = findAllPaths(adjacency, entryId, terminalSet);
    allPaths.push(...paths);
  }

  // If no paths found (disconnected graph), treat each node individually
  if (allPaths.length === 0) {
    // Single-node or disconnected: overall = product of all
    allPaths = [nodes.map((n) => n.id)];
  }

  // Compute availability per path (series multiplication)
  let weakestAvail = 1;
  let weakestPathIds: string[] = [];

  for (const path of allPaths) {
    let pathAvail = 1;
    for (const nodeId of path) {
      const comp = componentAvails.get(nodeId);
      if (comp) {
        pathAvail *= comp.avail;
      }
    }
    if (pathAvail < weakestAvail) {
      weakestAvail = pathAvail;
      weakestPathIds = [...path];
    }
  }

  // Detect SPOFs on the weakest path
  const weakestPathSet = new Set(weakestPathIds);
  const spofNodeIds = new Set<string>();

  for (const nodeId of weakestPathIds) {
    const comp = componentAvails.get(nodeId);
    if (!comp) continue;

    // A SPOF is a non-replicated node on the critical path
    // whose component type is not inherently highly available (e.g., not a client)
    const data = nodeMap.get(nodeId)?.data as Record<string, unknown> | undefined;
    const isClient = data?.category === 'client';
    if (!isClient && comp.replicas <= 1) {
      spofNodeIds.add(nodeId);
    }
  }

  // Build per-component result
  const perComponentAvailability = nodes.map((node) => {
    const comp = componentAvails.get(node.id);
    return {
      nodeId: node.id,
      label: comp?.label ?? node.id,
      availability: comp?.avail ?? DEFAULT_AVAILABILITY,
      isSPOF: spofNodeIds.has(node.id),
    };
  });

  // Generate recommendations
  const recommendations = generateRecommendations(
    weakestPathIds,
    componentAvails,
    spofNodeIds,
    weakestAvail,
    nodes,
    edges,
  );

  const overallAvailability = weakestAvail;
  const annualDowntimeMinutes = (1 - overallAvailability) * MINUTES_PER_YEAR;

  return {
    overallAvailability,
    nines: availabilityToNines(overallAvailability),
    annualDowntimeMinutes,
    weakestPath: weakestPathIds,
    perComponentAvailability,
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

function generateRecommendations(
  weakestPath: string[],
  componentAvails: Map<string, { avail: number; replicas: number; label: string; componentType: string }>,
  spofNodeIds: Set<string>,
  currentAvail: number,
  _nodes: Node[],
  _edges: Edge[],
): string[] {
  const recs: string[] = [];

  // Recommend adding replicas to SPOFs
  for (const nodeId of spofNodeIds) {
    const comp = componentAvails.get(nodeId);
    if (!comp) continue;

    const baseAvail = getBaseAvailability(comp.componentType);
    const withTwo = parallelAvailability(baseAvail, 2);

    // Estimate improvement: replace this node's contribution in the weakest path
    const currentContribution = comp.avail;
    const improvedPathAvail = (currentAvail / currentContribution) * withTwo;
    const improvedPct = (improvedPathAvail * 100).toFixed(
      Math.max(2, Math.ceil(-Math.log10(1 - improvedPathAvail))),
    );

    recs.push(
      `Add a replica to "${comp.label}" to improve from ${(currentAvail * 100).toFixed(
        Math.max(2, Math.ceil(-Math.log10(1 - currentAvail))),
      )}% to ~${improvedPct}% (eliminates SPOF).`,
    );
  }

  // Find the single weakest component on the critical path
  let weakestCompId = '';
  let weakestCompAvail = 1;
  for (const nodeId of weakestPath) {
    const comp = componentAvails.get(nodeId);
    if (comp && comp.avail < weakestCompAvail) {
      weakestCompAvail = comp.avail;
      weakestCompId = nodeId;
    }
  }

  if (weakestCompId && !spofNodeIds.has(weakestCompId)) {
    const comp = componentAvails.get(weakestCompId)!;
    recs.push(
      `"${comp.label}" has the lowest availability (${(comp.avail * 100).toFixed(3)}%) on the critical path. Consider adding more replicas.`,
    );
  }

  // General recommendations
  if (spofNodeIds.size > 0) {
    recs.push(
      `${spofNodeIds.size} single point${spofNodeIds.size > 1 ? 's' : ''} of failure detected. Replicate critical components for higher availability.`,
    );
  }

  if (currentAvail < 0.999) {
    recs.push(
      'Overall availability is below 3 nines. Consider adding redundancy across your architecture.',
    );
  }

  if (recs.length === 0) {
    recs.push('Architecture looks solid. No immediate improvements needed.');
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Exports for tests / external use
// ---------------------------------------------------------------------------

export { availabilityToNines, formatDowntime, COMPONENT_AVAILABILITY };
