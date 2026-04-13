/**
 * Latency Budget Visualizer — INO-010
 *
 * Calculates where latency is spent across each hop in the critical request
 * path. Uses graph traversal to find the longest-latency path from entry
 * nodes to leaf nodes, then breaks down per-hop latency contributions.
 */

import type { Node, Edge } from "@xyflow/react";
import type { SystemDesignNodeData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LatencyHop {
  nodeId: string;
  label: string;
  componentType: string;
  category: string;
  latencyMs: number;
  percentage: number;
  overBudget: boolean;
}

export interface LatencyBudget {
  totalBudgetMs: number;
  actualTotalMs: number;
  overBudget: boolean;
  hops: LatencyHop[];
  bottleneck: { nodeId: string; label: string; latencyMs: number };
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Default latency estimates per component type (milliseconds)
// ---------------------------------------------------------------------------

const DEFAULT_LATENCY_MS: Record<string, number> = {
  // Compute
  "web-server": 5,
  "app-server": 8,
  serverless: 50, // includes cold-start amortised
  worker: 10,

  // Load balancing
  "load-balancer": 0.5,
  "api-gateway": 2,

  // Storage
  database: 10,
  "document-db": 8,
  "wide-column": 5,
  "search-engine": 15,
  "timeseries-db": 5,
  "graph-db": 12,
  storage: 50, // object storage (S3-like)

  // Caching
  cache: 1, // cache hit

  // Messaging
  "message-queue": 5,
  "pub-sub": 3,
  "event-bus": 2,
  "stream-processor": 10,
  "batch-processor": 100,

  // Networking
  cdn: 10,
  "cdn-edge": 5,
  dns: 20,
  firewall: 0.5,

  // Client
  client: 0,
  "mobile-client": 0,
  "third-party-api": 50,

  // Processing
  "ml-inference": 30,

  // Observability (passthrough, negligible)
  "metrics-collector": 0.2,
  "log-aggregator": 0.2,
  tracer: 0.1,

  // Security
  "auth-service": 5,
  "rate-limiter": 0.1,
  "secret-manager": 5,
};

/** Network hop latency added per edge (ms). */
const EDGE_LATENCY_MS = 0.5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeLatencyMs(node: Node): number {
  const data = node.data as SystemDesignNodeData | undefined;
  const componentType = node.type ?? "unknown";

  // Use explicit processingTimeMs from config if present
  const config = data?.config;
  if (config && typeof config.processingTimeMs === "number") {
    return config.processingTimeMs;
  }

  // Cache: check hit rate to blend hit/miss latency
  if (componentType === "cache") {
    const hitRate =
      config && typeof config.cacheHitRate === "number"
        ? config.cacheHitRate
        : 0.9;
    return hitRate * 1 + (1 - hitRate) * 10;
  }

  return DEFAULT_LATENCY_MS[componentType] ?? 5;
}

function getNodeLabel(node: Node): string {
  const data = node.data as SystemDesignNodeData | undefined;
  return data?.label ?? node.type ?? node.id;
}

function getNodeCategory(node: Node): string {
  const data = node.data as SystemDesignNodeData | undefined;
  return data?.category ?? "compute";
}

// ---------------------------------------------------------------------------
// Build adjacency list
// ---------------------------------------------------------------------------

interface AdjEntry {
  targetId: string;
  edgeLatencyMs: number;
}

function buildAdjacency(
  nodes: Node[],
  edges: Edge[],
): { adj: Map<string, AdjEntry[]>; inDegree: Map<string, number> } {
  const nodeSet = new Set(nodes.map((n) => n.id));
  const adj = new Map<string, AdjEntry[]>();
  const inDegree = new Map<string, number>();

  for (const n of nodes) {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
  }

  for (const e of edges) {
    if (!nodeSet.has(e.source) || !nodeSet.has(e.target)) continue;
    adj.get(e.source)!.push({
      targetId: e.target,
      edgeLatencyMs: EDGE_LATENCY_MS,
    });
    inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1);
  }

  return { adj, inDegree };
}

// ---------------------------------------------------------------------------
// Longest path via topological sort (DAG assumption)
// If cycle detected, fall back to BFS with visited set.
// ---------------------------------------------------------------------------

interface PathResult {
  path: string[];
  totalMs: number;
}

function findCriticalPath(
  nodes: Node[],
  edges: Edge[],
  nodeMap: Map<string, Node>,
): PathResult {
  const { adj, inDegree } = buildAdjacency(nodes, edges);

  // Entry nodes: in-degree 0
  const entries = nodes.filter((n) => (inDegree.get(n.id) ?? 0) === 0);

  if (entries.length === 0 && nodes.length > 0) {
    // Cycle or isolated — use first node
    return { path: [nodes[0].id], totalMs: getNodeLatencyMs(nodes[0]) };
  }

  // dist[nodeId] = longest latency from any entry to this node
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();

  for (const n of nodes) {
    dist.set(n.id, -Infinity);
    prev.set(n.id, null);
  }

  // Topological sort (Kahn's algorithm)
  const inDeg = new Map(inDegree);
  const queue: string[] = [];

  for (const e of entries) {
    queue.push(e.id);
    dist.set(e.id, getNodeLatencyMs(nodeMap.get(e.id)!));
  }

  const topoOrder: string[] = [];

  while (queue.length > 0) {
    const u = queue.shift()!;
    topoOrder.push(u);

    for (const { targetId, edgeLatencyMs } of adj.get(u) ?? []) {
      const newDist =
        dist.get(u)! + edgeLatencyMs + getNodeLatencyMs(nodeMap.get(targetId)!);
      if (newDist > dist.get(targetId)!) {
        dist.set(targetId, newDist);
        prev.set(targetId, u);
      }
      inDeg.set(targetId, (inDeg.get(targetId) ?? 1) - 1);
      if (inDeg.get(targetId) === 0) {
        queue.push(targetId);
      }
    }
  }

  // Find the node with the maximum distance
  let maxNode = entries[0]?.id ?? nodes[0].id;
  let maxDist = dist.get(maxNode) ?? 0;

  for (const [id, d] of dist) {
    if (d > maxDist) {
      maxDist = d;
      maxNode = id;
    }
  }

  // Reconstruct path
  const path: string[] = [];
  let cur: string | null = maxNode;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev.get(cur) ?? null;
  }

  return { path, totalMs: maxDist };
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

function generateRecommendations(hops: LatencyHop[]): string[] {
  const recs: string[] = [];

  for (const hop of hops) {
    if (hop.percentage >= 40) {
      switch (hop.componentType) {
        case "database":
        case "document-db":
        case "wide-column":
        case "graph-db":
        case "timeseries-db":
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — add read replica or caching layer`,
          );
          break;
        case "cache":
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — check cache hit rate, consider warming`,
          );
          break;
        case "third-party-api":
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — add circuit breaker and timeout`,
          );
          break;
        case "serverless":
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — use provisioned concurrency to avoid cold starts`,
          );
          break;
        case "storage":
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — serve from CDN or edge cache`,
          );
          break;
        default:
          recs.push(
            `${hop.label} accounts for ${hop.percentage.toFixed(0)}% of latency — consider horizontal scaling or caching`,
          );
      }
    } else if (hop.percentage >= 25) {
      recs.push(
        `${hop.label} contributes ${hop.percentage.toFixed(0)}% — review for optimisation opportunities`,
      );
    }
  }

  // Edge latency recommendations
  const edgeCount = hops.length - 1;
  if (edgeCount > 5) {
    recs.push(
      `${edgeCount} network hops detected — consider consolidating services to reduce serialization overhead`,
    );
  }

  return recs;
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

export function calculateLatencyBudget(
  nodes: Node[],
  edges: Edge[],
  budgetMs: number = 200,
): LatencyBudget {
  if (nodes.length === 0) {
    return {
      totalBudgetMs: budgetMs,
      actualTotalMs: 0,
      overBudget: false,
      hops: [],
      bottleneck: { nodeId: "", label: "N/A", latencyMs: 0 },
      recommendations: [],
    };
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const { path, totalMs } = findCriticalPath(nodes, edges, nodeMap);

  // Build hops from the critical path
  const hops: LatencyHop[] = [];
  let runningTotal = 0;

  for (let i = 0; i < path.length; i++) {
    const nodeId = path[i];
    const node = nodeMap.get(nodeId)!;
    let hopLatency = getNodeLatencyMs(node);

    // Add edge latency for all hops after the first
    if (i > 0) {
      hopLatency += EDGE_LATENCY_MS;
    }

    runningTotal += hopLatency;

    hops.push({
      nodeId,
      label: getNodeLabel(node),
      componentType: node.type ?? "unknown",
      category: getNodeCategory(node),
      latencyMs: hopLatency,
      percentage: 0, // calculated below
      overBudget: false, // calculated below
    });
  }

  // Calculate percentages
  const actualTotal = runningTotal;
  for (const hop of hops) {
    hop.percentage =
      actualTotal > 0 ? (hop.latencyMs / actualTotal) * 100 : 0;
    // Mark individual hops that alone exceed a proportional share of the budget
    const fairShare = budgetMs / hops.length;
    hop.overBudget = hop.latencyMs > fairShare * 2;
  }

  // Find bottleneck
  const bottleneckHop = hops.reduce(
    (max, h) => (h.latencyMs > max.latencyMs ? h : max),
    hops[0],
  );

  const recommendations = generateRecommendations(hops);

  // If overall over budget, add a summary recommendation
  if (actualTotal > budgetMs) {
    recommendations.unshift(
      `Total latency ${actualTotal.toFixed(1)}ms exceeds ${budgetMs}ms budget by ${(actualTotal - budgetMs).toFixed(1)}ms`,
    );
  }

  return {
    totalBudgetMs: budgetMs,
    actualTotalMs: actualTotal,
    overBudget: actualTotal > budgetMs,
    hops,
    bottleneck: {
      nodeId: bottleneckHop.nodeId,
      label: bottleneckHop.label,
      latencyMs: bottleneckHop.latencyMs,
    },
    recommendations,
  };
}
