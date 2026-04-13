// ── AI-003: Topology Rule Engine ─────────────────────────────────────
//
// Generates topology-specific simulation rules. Checks a static
// database of 20 common topologies first, then an AI-generated cache,
// and finally calls Claude Haiku for truly unknown topologies.
//
// Never blocks simulation — returns a fallback immediately and fetches
// AI rules asynchronously when needed.

import { ClaudeClient } from './claude-client';
import { AIResponseCache } from './indexeddb-cache';
import type { NodeCategory, EdgeType } from '@/lib/types';

// ── Types ───────────────────────────────────────────────────────────

export interface TopologyNode {
  id: string;
  label: string;
  category: NodeCategory;
  componentType: string;
}

export interface TopologyEdge {
  id: string;
  source: string;
  target: string;
  edgeType: EdgeType;
}

export interface TopologyProfile {
  signature: string;
  name: string;
  latencyBudgetMs: number;
  throughputMultiplier: number;
  failoverStrategy: 'active-passive' | 'active-active' | 'none';
  bottleneckComponent: string;
  cachingAdvice: string;
  scalingAdvice: string;
  reliabilityScore: number;
  rules: SimulationRule[];
}

export interface SimulationRule {
  /** Human-readable rule name */
  name: string;
  /** Condition expression evaluated during simulation */
  condition: string;
  /** Effect applied when condition is true */
  effect: string;
  /** Severity: how impactful this rule is */
  severity: 'info' | 'warning' | 'critical';
}

// ── Signature computation ──────────────────────────────────────────

/**
 * Compute a stable signature for a topology based on its node
 * categories/types and edge types. Two topologies with the same
 * component mix and connection patterns produce the same signature.
 */
export function computeTopologySignature(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
): string {
  const categoryCount = new Map<string, number>();
  for (const n of nodes) {
    const key = `${n.category}:${n.componentType}`;
    categoryCount.set(key, (categoryCount.get(key) ?? 0) + 1);
  }

  const edgeTypeCount = new Map<string, number>();
  for (const e of edges) {
    edgeTypeCount.set(e.edgeType, (edgeTypeCount.get(e.edgeType) ?? 0) + 1);
  }

  const nodePart = Array.from(categoryCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}x${v}`)
    .join('|');

  const edgePart = Array.from(edgeTypeCount.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}x${v}`)
    .join('|');

  return `${nodePart}::${edgePart}`;
}

// ── Static rule database (20 common topologies) ─────────────────────

function commonRules(overrides: Partial<TopologyProfile> & { signature: string; name: string }): TopologyProfile {
  return {
    latencyBudgetMs: 200,
    throughputMultiplier: 1.0,
    failoverStrategy: 'none',
    bottleneckComponent: 'unknown',
    cachingAdvice: 'Add caching for read-heavy paths.',
    scalingAdvice: 'Scale horizontally behind a load balancer.',
    reliabilityScore: 0.5,
    rules: [],
    ...overrides,
  };
}

export const COMMON_TOPOLOGY_RULES: TopologyProfile[] = [
  commonRules({
    signature: 'client-lb-server-db',
    name: 'Classic 3-Tier',
    latencyBudgetMs: 150,
    throughputMultiplier: 1.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'database',
    cachingAdvice: 'Add Redis between app and DB for read-heavy queries.',
    scalingAdvice: 'Scale app servers horizontally; add read replicas for DB.',
    reliabilityScore: 0.6,
    rules: [
      { name: 'DB bottleneck', condition: 'db.utilization > 0.8', effect: 'latency += 50%', severity: 'warning' },
      { name: 'SPOF database', condition: 'db.replicas === 0', effect: 'reliability -= 30%', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'client-lb-server-cache-db',
    name: '3-Tier with Cache',
    latencyBudgetMs: 100,
    throughputMultiplier: 1.5,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'app-server',
    cachingAdvice: 'Tune cache TTL; use write-through for consistency.',
    scalingAdvice: 'Scale app tier; shard cache if memory-limited.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Cache miss storm', condition: 'cache.hitRate < 0.5', effect: 'db.load += 100%', severity: 'warning' },
      { name: 'Cache warming', condition: 'cache.entries === 0', effect: 'latency += 80%', severity: 'info' },
    ],
  }),
  commonRules({
    signature: 'client-gateway-microservices-db',
    name: 'Microservices Gateway',
    latencyBudgetMs: 200,
    throughputMultiplier: 1.2,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'api-gateway',
    cachingAdvice: 'Cache at the gateway for GET requests.',
    scalingAdvice: 'Scale each microservice independently by demand.',
    reliabilityScore: 0.75,
    rules: [
      { name: 'Gateway overload', condition: 'gateway.qps > gateway.maxQps', effect: 'drop excess requests', severity: 'critical' },
      { name: 'Cascading failure', condition: 'any_service.errorRate > 0.5', effect: 'downstream services degrade', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'client-lb-server-queue-worker-db',
    name: 'Async Worker Pipeline',
    latencyBudgetMs: 300,
    throughputMultiplier: 2.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'worker',
    cachingAdvice: 'Cache results of processed jobs for deduplication.',
    scalingAdvice: 'Scale workers based on queue depth.',
    reliabilityScore: 0.8,
    rules: [
      { name: 'Queue backlog', condition: 'queue.depth > 10000', effect: 'processing latency += 200%', severity: 'warning' },
      { name: 'Worker starvation', condition: 'worker.count < queue.partitions', effect: 'throughput limited', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'client-cdn-lb-server-db',
    name: 'CDN-Fronted Web App',
    latencyBudgetMs: 80,
    throughputMultiplier: 3.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'origin-server',
    cachingAdvice: 'Maximise CDN cache hit ratio with proper Cache-Control headers.',
    scalingAdvice: 'CDN absorbs read load; scale origin for writes.',
    reliabilityScore: 0.8,
    rules: [
      { name: 'CDN cache miss', condition: 'cdn.hitRate < 0.7', effect: 'origin load increases', severity: 'warning' },
      { name: 'Origin failure', condition: 'origin.health === false', effect: 'CDN serves stale content', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'event-driven-kafka',
    name: 'Event-Driven (Kafka)',
    latencyBudgetMs: 500,
    throughputMultiplier: 5.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'kafka-broker',
    cachingAdvice: 'Cache materialised views from event streams.',
    scalingAdvice: 'Increase Kafka partitions for parallelism.',
    reliabilityScore: 0.85,
    rules: [
      { name: 'Consumer lag', condition: 'consumer.lag > 100000', effect: 'data staleness increases', severity: 'warning' },
      { name: 'Broker rebalance', condition: 'broker.count changes', effect: 'temporary throughput drop', severity: 'info' },
    ],
  }),
  commonRules({
    signature: 'client-ws-server-redis-db',
    name: 'Real-Time WebSocket',
    latencyBudgetMs: 50,
    throughputMultiplier: 1.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'websocket-server',
    cachingAdvice: 'Use Redis Pub/Sub for cross-server message delivery.',
    scalingAdvice: 'Shard connections across WS servers by user hash.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Connection limit', condition: 'ws.connections > ws.maxConnections', effect: 'new connections rejected', severity: 'critical' },
      { name: 'Fan-out overhead', condition: 'room.members > 1000', effect: 'broadcast latency increases', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'cqrs-pattern',
    name: 'CQRS (Command Query Separation)',
    latencyBudgetMs: 150,
    throughputMultiplier: 2.5,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'write-store',
    cachingAdvice: 'Read model is essentially a cache; optimise its projections.',
    scalingAdvice: 'Scale read replicas independently of write path.',
    reliabilityScore: 0.75,
    rules: [
      { name: 'Read model lag', condition: 'readModel.lag > 5s', effect: 'stale reads possible', severity: 'warning' },
      { name: 'Write contention', condition: 'writeStore.lockWait > 100ms', effect: 'write latency increases', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'lambda-gateway-dynamodb',
    name: 'Serverless',
    latencyBudgetMs: 300,
    throughputMultiplier: 10.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'cold-start',
    cachingAdvice: 'Use provisioned concurrency or keep-warm to reduce cold starts.',
    scalingAdvice: 'Auto-scales; watch DynamoDB provisioned capacity.',
    reliabilityScore: 0.85,
    rules: [
      { name: 'Cold start', condition: 'lambda.idleTime > 15min', effect: 'first request latency += 500ms', severity: 'info' },
      { name: 'DDB throttle', condition: 'ddb.consumed > ddb.provisioned', effect: 'requests throttled', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'primary-replica-db',
    name: 'Primary-Replica Database',
    latencyBudgetMs: 10,
    throughputMultiplier: 2.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'primary',
    cachingAdvice: 'Route reads to replicas; cache hot data in app layer.',
    scalingAdvice: 'Add replicas for read scaling; shard for write scaling.',
    reliabilityScore: 0.8,
    rules: [
      { name: 'Replication lag', condition: 'replica.lag > 1s', effect: 'stale reads', severity: 'warning' },
      { name: 'Primary failure', condition: 'primary.health === false', effect: 'promote replica', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'service-mesh',
    name: 'Service Mesh (Istio/Envoy)',
    latencyBudgetMs: 250,
    throughputMultiplier: 0.9,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'sidecar-proxy',
    cachingAdvice: 'Cache at service level; mesh adds latency overhead.',
    scalingAdvice: 'Scale services independently; mesh handles discovery.',
    reliabilityScore: 0.9,
    rules: [
      { name: 'Sidecar overhead', condition: 'always', effect: 'latency += 2ms per hop', severity: 'info' },
      { name: 'mTLS handshake', condition: 'new connection', effect: 'initial latency += 5ms', severity: 'info' },
    ],
  }),
  commonRules({
    signature: 'multi-region',
    name: 'Multi-Region Active-Active',
    latencyBudgetMs: 300,
    throughputMultiplier: 2.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'cross-region-replication',
    cachingAdvice: 'Cache per region; invalidate via cross-region events.',
    scalingAdvice: 'Each region scales independently.',
    reliabilityScore: 0.95,
    rules: [
      { name: 'Cross-region latency', condition: 'cross_region_call', effect: 'latency += 80ms', severity: 'warning' },
      { name: 'Conflict resolution', condition: 'concurrent writes', effect: 'last-writer-wins or CRDT merge', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'client-lb-server-sharded-db',
    name: 'Sharded Database',
    latencyBudgetMs: 120,
    throughputMultiplier: 3.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'shard-router',
    cachingAdvice: 'Cache per-shard hot keys to reduce cross-shard lookups.',
    scalingAdvice: 'Add shards for more capacity; rebalance with consistent hashing.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Hot shard', condition: 'shard.load > 2x average', effect: 'shard latency spikes', severity: 'critical' },
      { name: 'Cross-shard query', condition: 'query spans shards', effect: 'scatter-gather overhead', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'rate-limited-api',
    name: 'Rate-Limited Public API',
    latencyBudgetMs: 100,
    throughputMultiplier: 1.0,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'rate-limiter',
    cachingAdvice: 'Cache rate limit counters in Redis (sliding window).',
    scalingAdvice: 'Distributed rate limiting with Redis; scale API tier independently.',
    reliabilityScore: 0.8,
    rules: [
      { name: 'Rate limit hit', condition: 'client.qps > limit', effect: 'return 429', severity: 'info' },
      { name: 'Burst handling', condition: 'burst > 10x sustained', effect: 'queue or reject excess', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'pub-sub-fanout',
    name: 'Pub/Sub Fan-Out',
    latencyBudgetMs: 200,
    throughputMultiplier: 5.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'subscriber',
    cachingAdvice: 'Subscriber-side deduplication for at-least-once delivery.',
    scalingAdvice: 'Scale subscribers per topic; partition for parallelism.',
    reliabilityScore: 0.75,
    rules: [
      { name: 'Slow subscriber', condition: 'subscriber.processTime > 1s', effect: 'backpressure on publisher', severity: 'warning' },
      { name: 'Message loss', condition: 'ack not received', effect: 'retry with backoff', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'saga-orchestrator',
    name: 'Saga / Orchestrator Pattern',
    latencyBudgetMs: 500,
    throughputMultiplier: 0.8,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'orchestrator',
    cachingAdvice: 'Cache idempotency keys to prevent duplicate compensations.',
    scalingAdvice: 'Scale orchestrator; ensure participant services are idempotent.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Compensation failure', condition: 'compensating action fails', effect: 'manual intervention required', severity: 'critical' },
      { name: 'Saga timeout', condition: 'saga.duration > 30s', effect: 'trigger compensation', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'batch-etl-pipeline',
    name: 'Batch ETL Pipeline',
    latencyBudgetMs: 60000,
    throughputMultiplier: 10.0,
    failoverStrategy: 'none',
    bottleneckComponent: 'transform-stage',
    cachingAdvice: 'Cache intermediate results for idempotent reruns.',
    scalingAdvice: 'Parallelise transform stage; scale workers with data volume.',
    reliabilityScore: 0.6,
    rules: [
      { name: 'Stale data', condition: 'pipeline.lastRun > 24h', effect: 'data freshness degraded', severity: 'warning' },
      { name: 'Transform failure', condition: 'transform.errorRate > 0.01', effect: 'bad data downstream', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'graphql-federation',
    name: 'GraphQL Federation',
    latencyBudgetMs: 200,
    throughputMultiplier: 1.5,
    failoverStrategy: 'active-passive',
    bottleneckComponent: 'gateway',
    cachingAdvice: 'Cache resolved entities at the gateway level.',
    scalingAdvice: 'Scale subgraph services independently.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'N+1 query', condition: 'resolver.batchSize === 1', effect: 'latency scales with list size', severity: 'warning' },
      { name: 'Subgraph failure', condition: 'subgraph.health === false', effect: 'partial response returned', severity: 'critical' },
    ],
  }),
  commonRules({
    signature: 'data-lake',
    name: 'Data Lake (S3 + Spark)',
    latencyBudgetMs: 120000,
    throughputMultiplier: 50.0,
    failoverStrategy: 'none',
    bottleneckComponent: 'spark-cluster',
    cachingAdvice: 'Use partitioned Parquet for query pushdown.',
    scalingAdvice: 'Scale Spark executors with data volume.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Small files problem', condition: 'file.count > 100000', effect: 'query planning overhead', severity: 'warning' },
      { name: 'Data skew', condition: 'partition.skew > 3x', effect: 'uneven task completion', severity: 'warning' },
    ],
  }),
  commonRules({
    signature: 'edge-computing',
    name: 'Edge Computing',
    latencyBudgetMs: 20,
    throughputMultiplier: 1.0,
    failoverStrategy: 'active-active',
    bottleneckComponent: 'edge-node',
    cachingAdvice: 'Cache hot data at edge; sync to origin periodically.',
    scalingAdvice: 'Deploy to more edge locations for lower latency.',
    reliabilityScore: 0.7,
    rules: [
      { name: 'Edge capacity', condition: 'edge.memory > 80%', effect: 'evict cold data', severity: 'warning' },
      { name: 'Origin unreachable', condition: 'origin.latency > 5s', effect: 'serve stale edge data', severity: 'critical' },
    ],
  }),
];

// Build a lookup map for O(1) access by name
const STATIC_RULE_MAP = new Map<string, TopologyProfile>();
for (const profile of COMMON_TOPOLOGY_RULES) {
  STATIC_RULE_MAP.set(profile.signature, profile);
}

// ── AI Cache for generated rules ────────────────────────────────────

const aiRuleCache = new AIResponseCache('architex-ai-topology', 'rules', 500);
const AI_RULE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Topology Rule Engine ────────────────────────────────────────────

const DEFAULT_FALLBACK: TopologyProfile = {
  signature: 'generic',
  name: 'Generic Topology',
  latencyBudgetMs: 200,
  throughputMultiplier: 1.0,
  failoverStrategy: 'none',
  bottleneckComponent: 'unknown',
  cachingAdvice: 'Add caching for read-heavy paths to reduce latency.',
  scalingAdvice: 'Identify bottleneck components and scale horizontally.',
  reliabilityScore: 0.5,
  rules: [
    { name: 'Generic load check', condition: 'any.utilization > 0.9', effect: 'consider scaling', severity: 'warning' },
  ],
};

export class TopologyRuleEngine {
  /**
   * Get rules for a topology signature. Resolution order:
   * 1. Static rule database (synchronous, instant)
   * 2. AI-generated cache (IndexedDB, fast)
   * 3. Claude Haiku (async, non-blocking — returns fallback immediately)
   */
  async getRulesForSignature(
    signature: string,
    nodes?: TopologyNode[],
    edges?: TopologyEdge[],
  ): Promise<TopologyProfile> {
    // 1. Static DB
    const staticProfile = STATIC_RULE_MAP.get(signature);
    if (staticProfile) return staticProfile;

    // Try fuzzy match on static DB by name substring
    for (const profile of COMMON_TOPOLOGY_RULES) {
      if (signature.includes(profile.signature) || profile.signature.includes(signature)) {
        return profile;
      }
    }

    // 2. AI-generated cache
    const cached = await aiRuleCache.get<TopologyProfile>(signature);
    if (cached) return cached;

    // 3. If AI is configured, trigger async fetch — return fallback immediately
    const client = ClaudeClient.getInstance();
    if (client.isConfigured() && nodes && edges) {
      // Fire and forget: populate cache for next time
      this.fetchAndCacheRules(signature, nodes, edges).catch(() => {
        /* best effort */
      });
    }

    return { ...DEFAULT_FALLBACK, signature };
  }

  private async fetchAndCacheRules(
    signature: string,
    nodes: TopologyNode[],
    edges: TopologyEdge[],
  ): Promise<void> {
    const client = ClaudeClient.getInstance();

    const nodeDesc = nodes
      .map((n) => `${n.label} (${n.category}/${n.componentType})`)
      .join(', ');
    const edgeDesc = edges
      .map((e) => {
        const src = nodes.find((n) => n.id === e.source)?.label ?? e.source;
        const tgt = nodes.find((n) => n.id === e.target)?.label ?? e.target;
        return `${src} -> ${tgt} (${e.edgeType})`;
      })
      .join(', ');

    const response = await client.call({
      model: 'claude-haiku-4-5',
      systemPrompt: `You are a system design expert. Analyze the given topology and return a JSON object with simulation rules.`,
      userMessage: `Analyze this system topology and generate simulation rules.

Nodes: ${nodeDesc}
Edges: ${edgeDesc}
Signature: ${signature}

Return a JSON object with this exact structure (no markdown fences):
{
  "signature": "${signature}",
  "name": "<descriptive name>",
  "latencyBudgetMs": <number>,
  "throughputMultiplier": <number>,
  "failoverStrategy": "<active-passive|active-active|none>",
  "bottleneckComponent": "<component name>",
  "cachingAdvice": "<advice string>",
  "scalingAdvice": "<advice string>",
  "reliabilityScore": <0-1>,
  "rules": [
    { "name": "<rule>", "condition": "<condition>", "effect": "<effect>", "severity": "<info|warning|critical>" }
  ]
}`,
      maxTokens: 1024,
      cacheKey: `topology:${signature}`,
      cacheTtlMs: AI_RULE_TTL_MS,
    });

    try {
      const profile = JSON.parse(response.text) as TopologyProfile;
      await aiRuleCache.set(signature, profile, AI_RULE_TTL_MS);
    } catch {
      // Parse failed — skip caching
    }
  }
}

/**
 * Convenience function: compute signature and fetch rules in one call.
 */
export async function fetchTopologyRules(
  nodes: TopologyNode[],
  edges: TopologyEdge[],
): Promise<TopologyProfile> {
  const signature = computeTopologySignature(nodes, edges);
  const engine = new TopologyRuleEngine();
  return engine.getRulesForSignature(signature, nodes, edges);
}
