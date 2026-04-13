/**
 * What-If Scenario Engine (INO-001)
 *
 * Allows users to hypothetically modify their architecture and instantly
 * see the consequences. Clones the current topology, applies a
 * modification (remove node, double traffic, add/remove cache, scale
 * up/down, inject failure), runs a quick 10-tick simulation snapshot on
 * both the original and modified graphs, and returns a comparative
 * result with delta metrics and human-readable insights.
 */

import type { Node, Edge } from '@xyflow/react';
import { simulateNode } from './queuing-model';
import { getNodeServiceRateFromData } from './node-service-rates';
import type { TrafficConfig } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WhatIfScenarioType =
  | 'remove-node'
  | 'double-traffic'
  | 'add-cache'
  | 'remove-cache'
  | 'scale-up'
  | 'scale-down'
  | 'inject-failure';

export interface WhatIfScenario {
  id: string;
  name: string;
  type: WhatIfScenarioType;
  /** Node to target (required for most scenario types). */
  targetNodeId?: string;
  /** Traffic multiplier for double-traffic (default 2). */
  multiplier?: number;
}

export interface WhatIfMetrics {
  avgLatency: number;
  throughput: number;
  errorRate: number;
  cost: number;
}

export interface WhatIfResult {
  scenario: WhatIfScenario;
  originalMetrics: WhatIfMetrics;
  modifiedMetrics: WhatIfMetrics;
  delta: {
    latencyChange: string;
    throughputChange: string;
    errorRateChange: string;
    costChange: string;
  };
  insights: string[];
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Deep-clone nodes and edges so we never mutate the canvas state. */
function cloneGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: nodes.map((n) => ({
      ...n,
      data: { ...n.data },
      position: { ...n.position },
    })),
    edges: edges.map((e) => ({
      ...e,
      data: e.data ? { ...e.data } : e.data,
    })),
  };
}

/** Build adjacency list and identify entry nodes. */
function buildTopology(nodes: Node[], edges: Edge[]) {
  const adjacency = new Map<string, string[]>();
  const hasInbound = new Set<string>();

  for (const n of nodes) {
    adjacency.set(n.id, []);
  }

  for (const e of edges) {
    const list = adjacency.get(e.source);
    if (list) list.push(e.target);
    hasInbound.add(e.target);
  }

  const entryNodeIds: string[] = [];
  for (const n of nodes) {
    const data = n.data as Record<string, unknown> | undefined;
    const isClient = data?.category === 'client';
    if (isClient || !hasInbound.has(n.id)) {
      entryNodeIds.push(n.id);
    }
  }
  if (entryNodeIds.length === 0 && nodes.length > 0) {
    entryNodeIds.push(nodes[0].id);
  }

  return { adjacency, entryNodeIds };
}

/** Extract the service rate (req/ms) from node data — delegates to node-service-rates.ts. */
function getNodeServiceRate(data: Record<string, unknown>): number {
  return getNodeServiceRateFromData(data);
}

/** Extract server count (number of parallel servers). */
function getNodeServerCount(data: Record<string, unknown>): number {
  const config = (data.config ?? {}) as Record<string, unknown>;
  if (typeof config.instances === 'number' && config.instances >= 1) return Math.floor(config.instances);
  if (typeof config.replicas === 'number' && config.replicas >= 1) return Math.floor(config.replicas);
  if (typeof config.concurrency === 'number' && config.concurrency >= 1) return Math.floor(config.concurrency);
  if (typeof config.parallelism === 'number' && config.parallelism >= 1) return Math.floor(config.parallelism);
  return 1;
}

/** Rough per-node monthly cost estimate (entirely heuristic). */
function estimateNodeCost(data: Record<string, unknown>): number {
  const componentType = (data.componentType as string) ?? '';
  const config = (data.config ?? {}) as Record<string, unknown>;
  const replicas = getNodeServerCount(data);

  const baseCosts: Record<string, number> = {
    'web-server': 50,
    'app-server': 80,
    'load-balancer': 25,
    'reverse-proxy': 20,
    'database': 150,
    'document-db': 120,
    'wide-column': 200,
    'graph-db': 180,
    'timeseries-db': 130,
    'cache': 40,
    'message-queue': 60,
    'pub-sub': 55,
    'event-bus': 55,
    'api-gateway': 35,
    'cdn-edge': 30,
    'object-storage': 20,
    'search-engine': 100,
    'serverless': 10,
    'worker': 60,
    'batch-processor': 70,
    'stream-processor': 80,
    'ml-inference': 250,
    'firewall': 15,
    'rate-limiter': 10,
    'dns': 5,
    'auth-service': 40,
    'secret-manager': 20,
  };

  const base = baseCosts[componentType] ?? 30;
  return base * replicas;
}

/** Tick duration used for the snapshot simulation. */
const TICK_MS = 100;

/** Number of ticks to run for each snapshot. */
const SNAPSHOT_TICKS = 10;

/**
 * Run a quick snapshot simulation over a graph and return aggregate metrics.
 *
 * This is a stripped-down version of the orchestrator's tick loop that runs
 * synchronously for SNAPSHOT_TICKS ticks and collects average metrics.
 */
function runSnapshot(
  nodes: Node[],
  edges: Edge[],
  trafficConfig: TrafficConfig,
): WhatIfMetrics {
  if (nodes.length === 0) {
    return { avgLatency: 0, throughput: 0, errorRate: 0, cost: 0 };
  }

  const { adjacency, entryNodeIds } = buildTopology(nodes, edges);

  const nodeMap = new Map<string, Node>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Aggregate accumulators
  let totalLatency = 0;
  let totalRequests = 0;
  let failedRequests = 0;

  for (let tick = 0; tick < SNAPSHOT_TICKS; tick++) {
    const incomingRequests = trafficConfig.requestsPerSecond * (TICK_MS / 1000);
    const entryCount = entryNodeIds.length || 1;
    const perEntry = incomingRequests / entryCount;

    const nodeArrivals = new Map<string, number>();
    for (const entryId of entryNodeIds) {
      nodeArrivals.set(entryId, perEntry);
    }

    // BFS propagation
    const visited = new Set<string>();
    const queue = [...entryNodeIds];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);

      const node = nodeMap.get(nodeId);
      if (!node) continue;

      const data = node.data as Record<string, unknown> | undefined;
      if (!data) continue;

      const arrivalCount = nodeArrivals.get(nodeId) ?? 0;
      const arrivalRate = arrivalCount / TICK_MS;
      const serviceRate = getNodeServiceRate(data);
      const serverCount = getNodeServerCount(data);

      const result = simulateNode(arrivalRate, serviceRate, serverCount);

      const isOverloaded = result.utilization >= 1;
      const effectiveLatency = isFinite(result.avgSystemTime)
        ? result.avgSystemTime
        : 10_000;

      const requestCount = Math.max(1, Math.round(arrivalCount));
      totalRequests += requestCount;
      totalLatency += effectiveLatency * requestCount;

      if (isOverloaded) {
        failedRequests += requestCount;
      }

      // Propagate downstream
      const downstream = adjacency.get(nodeId) ?? [];
      if (downstream.length > 0 && !isOverloaded) {
        const perDownstream = arrivalCount / downstream.length;
        for (const downId of downstream) {
          const existing = nodeArrivals.get(downId) ?? 0;
          nodeArrivals.set(downId, existing + perDownstream);
          if (!visited.has(downId)) queue.push(downId);
        }
      }
    }
  }

  // Compute total cost
  let totalCost = 0;
  for (const n of nodes) {
    const data = n.data as Record<string, unknown>;
    totalCost += estimateNodeCost(data);
  }

  const avgLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;
  const throughput = totalRequests > 0
    ? totalRequests / ((SNAPSHOT_TICKS * TICK_MS) / 1000)
    : 0;
  const errorRate = totalRequests > 0 ? failedRequests / totalRequests : 0;

  return { avgLatency, throughput, errorRate, cost: totalCost };
}

// ---------------------------------------------------------------------------
// Scenario modifiers
// ---------------------------------------------------------------------------

function applyRemoveNode(
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string,
): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: nodes.filter((n) => n.id !== targetNodeId),
    edges: edges.filter((e) => e.source !== targetNodeId && e.target !== targetNodeId),
  };
}

function applyDoubleTraffic(
  trafficConfig: TrafficConfig,
  multiplier: number,
): TrafficConfig {
  return {
    ...trafficConfig,
    requestsPerSecond: trafficConfig.requestsPerSecond * multiplier,
  };
}

function applyAddCache(
  nodes: Node[],
  edges: Edge[],
  targetNodeId: string,
): { nodes: Node[]; edges: Edge[] } {
  // Insert a cache node upstream of the target
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  if (!targetNode) return { nodes, edges };

  const cacheId = `whatif-cache-${targetNodeId}`;
  const cacheNode: Node = {
    id: cacheId,
    type: 'cache',
    position: {
      x: targetNode.position.x - 200,
      y: targetNode.position.y,
    },
    data: {
      label: 'Cache (What-If)',
      category: 'storage',
      componentType: 'cache',
      icon: 'Database',
      config: {},
      state: 'idle',
    },
  };

  // Re-route inbound edges to go through the cache
  const newEdges: Edge[] = [];
  let routedAtLeastOne = false;
  for (const e of edges) {
    if (e.target === targetNodeId) {
      // Source -> Cache
      newEdges.push({ ...e, id: `${e.id}-to-cache`, target: cacheId });
      // Cache -> Target
      newEdges.push({
        ...e,
        id: `${e.id}-cache-to-target`,
        source: cacheId,
        target: targetNodeId,
      });
      routedAtLeastOne = true;
    } else {
      newEdges.push(e);
    }
  }

  // If no inbound edges existed, just add a direct cache -> target edge
  if (!routedAtLeastOne) {
    newEdges.push({
      id: `whatif-cache-edge-${targetNodeId}`,
      source: cacheId,
      target: targetNodeId,
    });
  }

  return {
    nodes: [...nodes, cacheNode],
    edges: newEdges,
  };
}

function applyRemoveCache(
  nodes: Node[],
  edges: Edge[],
): { nodes: Node[]; edges: Edge[] } {
  // Remove all cache-type nodes
  const cacheIds = new Set(
    nodes
      .filter((n) => {
        const data = n.data as Record<string, unknown> | undefined;
        return data?.componentType === 'cache';
      })
      .map((n) => n.id),
  );

  if (cacheIds.size === 0) return { nodes, edges };

  // For each cache, re-link its upstream to its downstream
  const newEdges: Edge[] = [];
  const inboundToCache = new Map<string, string[]>(); // cacheId -> source ids
  const outboundFromCache = new Map<string, string[]>(); // cacheId -> target ids

  for (const e of edges) {
    if (cacheIds.has(e.target)) {
      const list = inboundToCache.get(e.target) ?? [];
      list.push(e.source);
      inboundToCache.set(e.target, list);
    } else if (cacheIds.has(e.source)) {
      const list = outboundFromCache.get(e.source) ?? [];
      list.push(e.target);
      outboundFromCache.set(e.source, list);
    } else {
      newEdges.push(e);
    }
  }

  // Re-link: each inbound source to each outbound target
  for (const cacheId of cacheIds) {
    const sources = inboundToCache.get(cacheId) ?? [];
    const targets = outboundFromCache.get(cacheId) ?? [];
    for (const src of sources) {
      for (const tgt of targets) {
        newEdges.push({
          id: `relink-${src}-${tgt}`,
          source: src,
          target: tgt,
        });
      }
    }
  }

  return {
    nodes: nodes.filter((n) => !cacheIds.has(n.id)),
    edges: newEdges,
  };
}

function applyScaleUp(
  nodes: Node[],
  targetNodeId: string,
  multiplier: number,
): Node[] {
  return nodes.map((n) => {
    if (n.id !== targetNodeId) return n;
    const data = n.data as Record<string, unknown>;
    const config = { ...((data.config ?? {}) as Record<string, unknown>) };
    const current = getNodeServerCount(data);
    config.replicas = current * multiplier;
    return { ...n, data: { ...data, config } };
  });
}

function applyScaleDown(
  nodes: Node[],
  targetNodeId: string,
): Node[] {
  return nodes.map((n) => {
    if (n.id !== targetNodeId) return n;
    const data = n.data as Record<string, unknown>;
    const config = { ...((data.config ?? {}) as Record<string, unknown>) };
    const current = getNodeServerCount(data);
    config.replicas = Math.max(1, Math.floor(current / 2));
    return { ...n, data: { ...data, config } };
  });
}

function applyInjectFailure(
  nodes: Node[],
  targetNodeId: string,
): Node[] {
  // Simulate node crash: set service rate to near-zero via very high processingTimeMs
  return nodes.map((n) => {
    if (n.id !== targetNodeId) return n;
    const data = n.data as Record<string, unknown>;
    const config = { ...((data.config ?? {}) as Record<string, unknown>) };
    config.processingTimeMs = 100_000; // effectively dead
    return { ...n, data: { ...data, config } };
  });
}

// ---------------------------------------------------------------------------
// Insight generation
// ---------------------------------------------------------------------------

function formatPercent(original: number, modified: number): string {
  if (original === 0 && modified === 0) return '+0.0%';
  if (original === 0) return '+999.9%';
  const pct = ((modified - original) / original) * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function generateInsights(
  scenario: WhatIfScenario,
  original: WhatIfMetrics,
  modified: WhatIfMetrics,
  nodes: Node[],
): string[] {
  const insights: string[] = [];

  const latencyDelta = modified.avgLatency - original.avgLatency;
  const throughputDelta = modified.throughput - original.throughput;
  const errorDelta = modified.errorRate - original.errorRate;
  const costDelta = modified.cost - original.cost;

  const targetNode = nodes.find((n) => n.id === scenario.targetNodeId);
  const targetLabel = targetNode
    ? ((targetNode.data as Record<string, unknown>).label as string) ?? scenario.targetNodeId
    : scenario.targetNodeId ?? 'the system';

  switch (scenario.type) {
    case 'remove-node': {
      if (errorDelta > 0.1) {
        insights.push(
          `Removing "${targetLabel}" causes a cascading failure: error rate jumps by ${formatPercent(original.errorRate, modified.errorRate)}.`,
        );
      }
      if (latencyDelta > 0) {
        insights.push(
          `Latency increases by ${latencyDelta.toFixed(1)}ms without "${targetLabel}" as remaining nodes absorb extra load.`,
        );
      }
      if (costDelta < 0) {
        insights.push(
          `Removing the node saves approximately $${Math.abs(costDelta).toFixed(0)}/mo but at significant reliability cost.`,
        );
      }
      if (errorDelta <= 0 && latencyDelta <= 0) {
        insights.push(
          `"${targetLabel}" appears to be redundant -- removing it has minimal performance impact.`,
        );
      }
      break;
    }
    case 'double-traffic': {
      const mult = scenario.multiplier ?? 2;
      if (modified.errorRate > 0.05) {
        insights.push(
          `At ${mult}x traffic, error rate reaches ${(modified.errorRate * 100).toFixed(1)}% -- consider adding capacity.`,
        );
      }
      if (latencyDelta > original.avgLatency * 0.5) {
        insights.push(
          `Latency degrades significantly under ${mult}x load (${formatPercent(original.avgLatency, modified.avgLatency)}). Bottleneck detected.`,
        );
      }
      if (modified.errorRate <= 0.01) {
        insights.push(
          `The system handles ${mult}x traffic well. Current capacity has headroom.`,
        );
      }
      break;
    }
    case 'add-cache': {
      if (latencyDelta < 0) {
        insights.push(
          `Adding a cache before "${targetLabel}" reduces average latency by ${Math.abs(latencyDelta).toFixed(1)}ms (${formatPercent(original.avgLatency, modified.avgLatency)}).`,
        );
      }
      if (costDelta > 0) {
        insights.push(
          `Cache adds approximately $${costDelta.toFixed(0)}/mo in infrastructure cost.`,
        );
      }
      if (modified.errorRate < original.errorRate) {
        insights.push(
          `Cache reduces error rate by absorbing load spikes upstream of "${targetLabel}".`,
        );
      }
      break;
    }
    case 'remove-cache': {
      if (latencyDelta > 0) {
        insights.push(
          `Removing caches increases average latency by ${latencyDelta.toFixed(1)}ms (${formatPercent(original.avgLatency, modified.avgLatency)}).`,
        );
      }
      if (errorDelta > 0) {
        insights.push(
          `Without caching, error rate increases by ${formatPercent(original.errorRate, modified.errorRate)} as backend nodes take full load.`,
        );
      }
      if (costDelta < 0) {
        insights.push(
          `Removing caches saves approximately $${Math.abs(costDelta).toFixed(0)}/mo.`,
        );
      }
      break;
    }
    case 'scale-up': {
      if (latencyDelta < 0) {
        insights.push(
          `Scaling "${targetLabel}" to ${scenario.multiplier ?? 3} replicas reduces latency by ${Math.abs(latencyDelta).toFixed(1)}ms.`,
        );
      }
      if (modified.errorRate < original.errorRate) {
        insights.push(
          `Error rate drops from ${(original.errorRate * 100).toFixed(1)}% to ${(modified.errorRate * 100).toFixed(1)}% with more capacity.`,
        );
      }
      if (costDelta > 0) {
        insights.push(
          `Scaling adds approximately $${costDelta.toFixed(0)}/mo in compute costs.`,
        );
      }
      break;
    }
    case 'scale-down': {
      if (latencyDelta > 0) {
        insights.push(
          `Scaling down "${targetLabel}" increases latency by ${latencyDelta.toFixed(1)}ms.`,
        );
      }
      if (errorDelta > 0.05) {
        insights.push(
          `Warning: scaling down causes error rate to spike by ${formatPercent(original.errorRate, modified.errorRate)}. Not recommended.`,
        );
      }
      if (costDelta < 0) {
        insights.push(
          `Scaling down saves approximately $${Math.abs(costDelta).toFixed(0)}/mo.`,
        );
      }
      break;
    }
    case 'inject-failure': {
      if (errorDelta > 0) {
        insights.push(
          `If "${targetLabel}" fails, error rate increases by ${formatPercent(original.errorRate, modified.errorRate)}.`,
        );
      }
      if (latencyDelta > 100) {
        insights.push(
          `Failure of "${targetLabel}" causes significant latency degradation (+${latencyDelta.toFixed(0)}ms). Consider adding redundancy.`,
        );
      }
      if (errorDelta <= 0.01) {
        insights.push(
          `The system gracefully handles failure of "${targetLabel}" -- good resilience.`,
        );
      }
      break;
    }
  }

  // Fallback: always have at least one insight
  if (insights.length === 0) {
    insights.push('No significant change detected for this scenario.');
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Run a what-if scenario analysis.
 *
 * Clones the current graph, applies the scenario modification, runs
 * quick simulation snapshots on both original and modified, and returns
 * a comparative result with delta metrics and actionable insights.
 *
 * @param nodes         - Current canvas nodes
 * @param edges         - Current canvas edges
 * @param trafficConfig - Current traffic configuration
 * @param scenario      - The what-if scenario to evaluate
 * @returns Comparative analysis result
 */
export function runWhatIfScenario(
  nodes: Node[],
  edges: Edge[],
  trafficConfig: TrafficConfig,
  scenario: WhatIfScenario,
): WhatIfResult {
  // 1. Run original snapshot
  const originalMetrics = runSnapshot(nodes, edges, trafficConfig);

  // 2. Clone and modify
  const cloned = cloneGraph(nodes, edges);
  let modifiedNodes = cloned.nodes;
  let modifiedEdges = cloned.edges;
  let modifiedTraffic = { ...trafficConfig };

  switch (scenario.type) {
    case 'remove-node': {
      if (scenario.targetNodeId) {
        const result = applyRemoveNode(modifiedNodes, modifiedEdges, scenario.targetNodeId);
        modifiedNodes = result.nodes;
        modifiedEdges = result.edges;
      }
      break;
    }
    case 'double-traffic': {
      modifiedTraffic = applyDoubleTraffic(modifiedTraffic, scenario.multiplier ?? 2);
      break;
    }
    case 'add-cache': {
      if (scenario.targetNodeId) {
        const result = applyAddCache(modifiedNodes, modifiedEdges, scenario.targetNodeId);
        modifiedNodes = result.nodes;
        modifiedEdges = result.edges;
      }
      break;
    }
    case 'remove-cache': {
      const result = applyRemoveCache(modifiedNodes, modifiedEdges);
      modifiedNodes = result.nodes;
      modifiedEdges = result.edges;
      break;
    }
    case 'scale-up': {
      if (scenario.targetNodeId) {
        modifiedNodes = applyScaleUp(modifiedNodes, scenario.targetNodeId, scenario.multiplier ?? 3);
      }
      break;
    }
    case 'scale-down': {
      if (scenario.targetNodeId) {
        modifiedNodes = applyScaleDown(modifiedNodes, scenario.targetNodeId);
      }
      break;
    }
    case 'inject-failure': {
      if (scenario.targetNodeId) {
        modifiedNodes = applyInjectFailure(modifiedNodes, scenario.targetNodeId);
      }
      break;
    }
  }

  // 3. Run modified snapshot
  const modifiedMetrics = runSnapshot(modifiedNodes, modifiedEdges, modifiedTraffic);

  // 4. Compute deltas
  const delta = {
    latencyChange: formatPercent(originalMetrics.avgLatency, modifiedMetrics.avgLatency),
    throughputChange: formatPercent(originalMetrics.throughput, modifiedMetrics.throughput),
    errorRateChange: formatPercent(originalMetrics.errorRate, modifiedMetrics.errorRate),
    costChange: formatPercent(originalMetrics.cost, modifiedMetrics.cost),
  };

  // 5. Generate insights
  const insights = generateInsights(scenario, originalMetrics, modifiedMetrics, nodes);

  return {
    scenario,
    originalMetrics,
    modifiedMetrics,
    delta,
    insights,
  };
}
