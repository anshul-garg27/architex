/**
 * Rule Database (SIM-004)
 *
 * 80 topology-aware rule profiles mapping topology signatures to behavior.
 * Each profile defines what issues a component is susceptible to and how
 * errors/latency propagate through edges.
 */

import type { TopologySignature, TopologyTrait } from './topology-signature';
import { signatureToKey } from './topology-signature';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Amplification factors applied to error/latency/traffic during propagation. */
export interface AmplificationFactors {
  /** Multiplier on error rate (1.0 = no change). */
  errorAmplification: number;
  /** Multiplier on latency. */
  latencyAmplification: number;
  /** Multiplier on downstream traffic (retries). */
  trafficAmplification: number;
  /** Fraction of requests dropped [0, 1]. */
  dropFraction: number;
  /** Fraction of capacity lost [0, 1]. */
  capacityDegradation: number;
}

/** A rule describing how issues propagate across an edge. */
export interface PropagationRule {
  /** Unique identifier for this rule. */
  ruleId: string;
  /** Human-readable description. */
  description: string;
  /** Narrative template for explaining the propagation. */
  narrativeTemplate: string;
  /** Issue code triggered by this propagation, or null. */
  triggersIssueCode: string | null;
  /** Amplification factors. */
  amplification: AmplificationFactors;
  /** Probability of firing per tick [0, 1]. */
  probability: number;
}

/** A topology profile mapping a signature pattern to behavior. */
export interface TopologyProfile {
  /** Unique profile identifier. */
  profileId: string;
  /** Regex or exact match on signatureToKey output. */
  signaturePattern: string;
  /** Primary component type this profile applies to. */
  componentType: string;
  /** Required upstream types (subset match). */
  requiredUpstreamTypes?: string[];
  /** Required downstream types (subset match). */
  requiredDownstreamTypes?: string[];
  /** Required traits (subset match). */
  requiredTraits?: TopologyTrait[];
  /** Issue codes this profile is susceptible to. */
  issues: string[];
  /** Propagation rules for how failures spread. */
  propagationRules: PropagationRule[];
}

// ---------------------------------------------------------------------------
// Default amplification helpers
// ---------------------------------------------------------------------------

const DEFAULT_AMP: AmplificationFactors = {
  errorAmplification: 1.0,
  latencyAmplification: 1.0,
  trafficAmplification: 1.0,
  dropFraction: 0,
  capacityDegradation: 0,
};

function amp(overrides: Partial<AmplificationFactors>): AmplificationFactors {
  return { ...DEFAULT_AMP, ...overrides };
}

function propagation(
  ruleId: string,
  desc: string,
  template: string,
  issueCode: string | null,
  amplification: AmplificationFactors,
  probability: number = 0.8,
): PropagationRule {
  return { ruleId, description: desc, narrativeTemplate: template, triggersIssueCode: issueCode, amplification, probability };
}

// ---------------------------------------------------------------------------
// Profile Database (80 entries)
// ---------------------------------------------------------------------------

const PROFILES: TopologyProfile[] = [
  // ===== LOAD BALANCERS (8) =====
  {
    profileId: 'lb-basic',
    signaturePattern: 'load-balancer',
    componentType: 'load-balancer',
    issues: ['INFRA-001', 'INFRA-004', 'NET-001'],
    propagationRules: [
      propagation('lb-err-spread', 'LB propagates errors downstream', '{{nodeLabel}} LB forwarded errors to downstream services', null, amp({ errorAmplification: 1.2 })),
    ],
  },
  {
    profileId: 'lb-with-cache-down',
    signaturePattern: 'load-balancer',
    componentType: 'load-balancer',
    requiredDownstreamTypes: ['cache'],
    issues: ['INFRA-001', 'INFRA-004', 'CACHE-001'],
    propagationRules: [
      propagation('lb-cache-miss', 'LB routes cache misses to origin', '{{nodeLabel}} LB routed cache misses, increasing origin load', 'CACHE-002', amp({ trafficAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'lb-autoscale',
    signaturePattern: 'load-balancer',
    componentType: 'load-balancer',
    requiredTraits: ['autoscale'],
    issues: ['INFRA-001', 'SCALE-001', 'SCALE-002'],
    propagationRules: [
      propagation('lb-scale-lag', 'LB overloaded while autoscaler provisions', '{{nodeLabel}} is saturated while waiting for autoscaler', 'SCALE-001', amp({ latencyAmplification: 2.0, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'lb-l4',
    signaturePattern: 'load-balancer-l4',
    componentType: 'load-balancer-l4',
    issues: ['INFRA-001', 'INFRA-004', 'NET-001', 'NET-006'],
    propagationRules: [
      propagation('lb-l4-drop', 'L4 LB drops packets under load', '{{nodeLabel}} L4 LB is dropping packets', null, amp({ dropFraction: 0.05 })),
    ],
  },
  {
    profileId: 'lb-l7',
    signaturePattern: 'load-balancer-l7',
    componentType: 'load-balancer-l7',
    issues: ['INFRA-001', 'INFRA-004', 'INFRA-005', 'NET-001'],
    propagationRules: [
      propagation('lb-l7-latency', 'L7 LB adds parsing latency under load', '{{nodeLabel}} L7 inspection adding latency', null, amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'reverse-proxy',
    signaturePattern: 'reverse-proxy',
    componentType: 'reverse-proxy',
    issues: ['INFRA-001', 'INFRA-004', 'NET-006'],
    propagationRules: [
      propagation('proxy-buffer', 'Proxy buffering adding latency', '{{nodeLabel}} proxy buffer is filling', null, amp({ latencyAmplification: 1.3 })),
    ],
  },
  {
    profileId: 'lb-entry',
    signaturePattern: 'load-balancer',
    componentType: 'load-balancer',
    requiredTraits: ['is_entry'],
    issues: ['INFRA-001', 'INFRA-004', 'SEC-001', 'SCALE-002'],
    propagationRules: [
      propagation('lb-entry-flood', 'Entry LB overwhelmed by traffic', '{{nodeLabel}} entry point flooded with requests', null, amp({ errorAmplification: 1.5, dropFraction: 0.1 })),
    ],
  },
  {
    profileId: 'service-mesh',
    signaturePattern: 'service-mesh',
    componentType: 'service-mesh',
    issues: ['INFRA-001', 'NET-001', 'NET-004'],
    propagationRules: [
      propagation('mesh-overhead', 'Service mesh sidecar adding overhead', '{{nodeLabel}} mesh sidecar latency overhead', null, amp({ latencyAmplification: 1.2 })),
    ],
  },

  // ===== API GATEWAYS (6) =====
  {
    profileId: 'api-gw-basic',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    issues: ['INFRA-001', 'INFRA-005', 'SEC-001', 'NET-004'],
    propagationRules: [
      propagation('gw-rate-limit', 'Gateway rate limiting active', '{{nodeLabel}} gateway rejecting excess requests', 'SEC-001', amp({ dropFraction: 0.2 })),
    ],
  },
  {
    profileId: 'api-gw-sync',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    requiredTraits: ['is_sync_request_path'],
    issues: ['INFRA-001', 'INFRA-005', 'NET-004', 'EXT-003'],
    propagationRules: [
      propagation('gw-sync-block', 'Sync path blocks on slow backends', '{{nodeLabel}} gateway threads blocked on backend', 'EXT-003', amp({ latencyAmplification: 2.5 })),
    ],
  },
  {
    profileId: 'api-gw-async',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    requiredTraits: ['is_async_path'],
    issues: ['INFRA-001', 'QUEUE-001', 'QUEUE-004'],
    propagationRules: [
      propagation('gw-async-backlog', 'Async gateway queuing requests', '{{nodeLabel}} gateway async queue growing', null, amp({ trafficAmplification: 1.1 })),
    ],
  },
  {
    profileId: 'api-gw-circuit-breaker',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    requiredTraits: ['has_circuit_breaker'],
    issues: ['INFRA-001', 'EXT-001', 'EXT-002'],
    propagationRules: [
      propagation('gw-cb-open', 'Gateway circuit breaker opened', '{{nodeLabel}} circuit breaker is open, failing fast', 'EXT-001', amp({ errorAmplification: 1.0, dropFraction: 0.5 }), 0.9),
    ],
  },
  {
    profileId: 'api-gw-entry',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    requiredTraits: ['is_entry'],
    issues: ['INFRA-001', 'SEC-001', 'SEC-002', 'SCALE-002'],
    propagationRules: [
      propagation('gw-entry-auth', 'Entry gateway auth storm', '{{nodeLabel}} authentication overloaded', 'SEC-002', amp({ latencyAmplification: 3.0, capacityDegradation: 0.4 })),
    ],
  },
  {
    profileId: 'api-gw-replicated',
    signaturePattern: 'api-gateway',
    componentType: 'api-gateway',
    requiredTraits: ['replicated'],
    issues: ['INFRA-001', 'SCALE-001'],
    propagationRules: [
      propagation('gw-replica-lag', 'Replicated gateway scaling', '{{nodeLabel}} replicas absorbing load', null, amp({ latencyAmplification: 1.1 }), 0.3),
    ],
  },

  // ===== DATABASES (14) =====
  {
    profileId: 'db-primary',
    signaturePattern: 'database',
    componentType: 'database',
    issues: ['INFRA-001', 'INFRA-003', 'INFRA-006', 'DATA-001', 'DATA-002', 'DATA-004', 'DATA-007'],
    propagationRules: [
      propagation('db-slow-query', 'Slow queries blocking connections', '{{nodeLabel}} slow queries consuming connection pool', 'DATA-004', amp({ latencyAmplification: 3.0, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'db-replica',
    signaturePattern: 'database',
    componentType: 'database',
    requiredTraits: ['replicated'],
    issues: ['INFRA-001', 'DATA-001', 'DATA-007'],
    propagationRules: [
      propagation('db-repl-lag', 'Replica lag increasing', '{{nodeLabel}} replica falling behind primary', 'DATA-001', amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'db-sharded',
    signaturePattern: 'database',
    componentType: 'database',
    requiredTraits: ['sharded'],
    issues: ['INFRA-001', 'DATA-002', 'DATA-005', 'CACHE-003', 'BATCH-003'],
    propagationRules: [
      propagation('db-hot-shard', 'Hot shard receiving disproportionate traffic', '{{nodeLabel}} shard imbalance detected', 'BATCH-003', amp({ latencyAmplification: 2.0, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'db-with-cache-up',
    signaturePattern: 'database',
    componentType: 'database',
    requiredTraits: ['has_cache_upstream'],
    issues: ['INFRA-001', 'INFRA-003', 'DATA-004', 'CACHE-001'],
    propagationRules: [
      propagation('db-cache-stampede', 'Cache miss stampede hitting DB', '{{nodeLabel}} DB absorbing cache misses', 'CACHE-001', amp({ trafficAmplification: 2.0, latencyAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'db-write-heavy',
    signaturePattern: 'database',
    componentType: 'database',
    requiredTraits: ['is_write_heavy'],
    issues: ['INFRA-003', 'DATA-002', 'DATA-003', 'DATA-008'],
    propagationRules: [
      propagation('db-write-amp', 'Write amplification from indexes/replication', '{{nodeLabel}} write amplification saturating I/O', 'DATA-008', amp({ latencyAmplification: 2.5, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'db-read-heavy',
    signaturePattern: 'database',
    componentType: 'database',
    requiredTraits: ['is_read_heavy'],
    issues: ['INFRA-001', 'DATA-005', 'DATA-006', 'DATA-007'],
    propagationRules: [
      propagation('db-read-pressure', 'Read load exhausting connections', '{{nodeLabel}} read pressure draining pool', 'DATA-006', amp({ latencyAmplification: 1.5, capacityDegradation: 0.15 })),
    ],
  },
  {
    profileId: 'postgres-primary',
    signaturePattern: 'postgres',
    componentType: 'postgres',
    issues: ['INFRA-001', 'INFRA-003', 'DATA-002', 'DATA-003', 'DATA-004', 'DATA-006'],
    propagationRules: [
      propagation('pg-vacuum', 'PostgreSQL autovacuum pressure', '{{nodeLabel}} autovacuum contending for I/O', null, amp({ latencyAmplification: 1.3 }), 0.4),
    ],
  },
  {
    profileId: 'mysql-primary',
    signaturePattern: 'mysql',
    componentType: 'mysql',
    issues: ['INFRA-001', 'INFRA-003', 'DATA-002', 'DATA-003', 'DATA-004'],
    propagationRules: [
      propagation('mysql-lock', 'MySQL table-level lock contention', '{{nodeLabel}} table locks blocking writes', 'DATA-002', amp({ latencyAmplification: 2.0, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'document-db',
    signaturePattern: 'document-db',
    componentType: 'document-db',
    issues: ['INFRA-001', 'DATA-004', 'DATA-005', 'DATA-007'],
    propagationRules: [
      propagation('docdb-scan', 'Document DB collection scan', '{{nodeLabel}} performing full collection scan', 'DATA-005', amp({ latencyAmplification: 3.0 })),
    ],
  },
  {
    profileId: 'wide-column-db',
    signaturePattern: 'wide-column',
    componentType: 'wide-column',
    issues: ['INFRA-001', 'INFRA-003', 'DATA-001', 'DATA-007'],
    propagationRules: [
      propagation('wc-compaction', 'Compaction pressure on wide-column store', '{{nodeLabel}} compaction contending for I/O', null, amp({ latencyAmplification: 1.5, capacityDegradation: 0.1 }), 0.5),
    ],
  },
  {
    profileId: 'graph-db',
    signaturePattern: 'graph-db',
    componentType: 'graph-db',
    issues: ['INFRA-001', 'INFRA-002', 'DATA-004', 'DATA-007'],
    propagationRules: [
      propagation('graph-traversal', 'Deep graph traversal memory spike', '{{nodeLabel}} deep traversal consuming memory', null, amp({ latencyAmplification: 5.0, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'timeseries-db',
    signaturePattern: 'timeseries-db',
    componentType: 'timeseries-db',
    issues: ['INFRA-001', 'INFRA-003', 'DATA-007'],
    propagationRules: [
      propagation('tsdb-ingest', 'Time series ingestion backlog', '{{nodeLabel}} ingestion rate exceeding write capacity', null, amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'vector-db',
    signaturePattern: 'vector-db',
    componentType: 'vector-db',
    issues: ['INFRA-001', 'INFRA-002', 'DATA-004'],
    propagationRules: [
      propagation('vecdb-index', 'Vector index rebuild pressure', '{{nodeLabel}} vector index rebuild consuming resources', null, amp({ latencyAmplification: 2.0, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'newsql-db',
    signaturePattern: 'newSQL',
    componentType: 'newSQL',
    issues: ['INFRA-001', 'DATA-001', 'DATA-002', 'DATA-007'],
    propagationRules: [
      propagation('newsql-dist-txn', 'Distributed transaction overhead', '{{nodeLabel}} distributed txn adding cross-node latency', null, amp({ latencyAmplification: 2.0 })),
    ],
  },

  // ===== CACHES (6) =====
  {
    profileId: 'cache-basic',
    signaturePattern: 'cache',
    componentType: 'cache',
    issues: ['CACHE-001', 'CACHE-002', 'CACHE-004'],
    propagationRules: [
      propagation('cache-miss-db', 'Cache misses falling through to DB', '{{nodeLabel}} cache misses hitting database', 'CACHE-002', amp({ trafficAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'cache-upstream-db',
    signaturePattern: 'cache',
    componentType: 'cache',
    requiredDownstreamTypes: ['database'],
    issues: ['CACHE-001', 'CACHE-002', 'CACHE-005'],
    propagationRules: [
      propagation('cache-stampede', 'Cache stampede to database', '{{nodeLabel}} cache stampede overwhelming database', 'CACHE-001', amp({ trafficAmplification: 3.0 })),
    ],
  },
  {
    profileId: 'cache-hot-key',
    signaturePattern: 'cache',
    componentType: 'cache',
    issues: ['CACHE-003', 'CACHE-004'],
    propagationRules: [
      propagation('cache-hot-shard', 'Hot key overloading cache shard', '{{nodeLabel}} hot key on single shard', 'CACHE-003', amp({ latencyAmplification: 2.0, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'redis-basic',
    signaturePattern: 'redis',
    componentType: 'redis',
    issues: ['CACHE-001', 'CACHE-002', 'CACHE-003', 'CACHE-004'],
    propagationRules: [
      propagation('redis-eviction', 'Redis eviction under memory pressure', '{{nodeLabel}} Redis maxmemory evictions active', 'CACHE-001', amp({ trafficAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'redis-cluster',
    signaturePattern: 'redis-cluster',
    componentType: 'redis-cluster',
    requiredTraits: ['sharded'],
    issues: ['CACHE-001', 'CACHE-003', 'CACHE-004', 'BATCH-003'],
    propagationRules: [
      propagation('redis-rebalance', 'Redis cluster slot rebalancing', '{{nodeLabel}} cluster rebalancing slots', null, amp({ latencyAmplification: 1.5, capacityDegradation: 0.1 }), 0.3),
    ],
  },
  {
    profileId: 'memcached',
    signaturePattern: 'memcached',
    componentType: 'memcached',
    issues: ['CACHE-001', 'CACHE-002', 'CACHE-004'],
    propagationRules: [
      propagation('mc-slab', 'Memcached slab allocator fragmentation', '{{nodeLabel}} slab fragmentation reducing capacity', 'CACHE-004', amp({ capacityDegradation: 0.2 })),
    ],
  },

  // ===== MESSAGE QUEUES (6) =====
  {
    profileId: 'mq-basic',
    signaturePattern: 'message-queue',
    componentType: 'message-queue',
    issues: ['QUEUE-001', 'QUEUE-002', 'QUEUE-003', 'QUEUE-004'],
    propagationRules: [
      propagation('mq-backpressure', 'Queue backpressure to producers', '{{nodeLabel}} queue applying backpressure', 'QUEUE-005', amp({ latencyAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'kafka-broker',
    signaturePattern: 'kafka',
    componentType: 'kafka',
    issues: ['QUEUE-001', 'QUEUE-002', 'QUEUE-004', 'INFRA-003'],
    propagationRules: [
      propagation('kafka-isr', 'Kafka ISR shrinkage under load', '{{nodeLabel}} Kafka ISR shrinking', null, amp({ latencyAmplification: 1.5, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'rabbitmq',
    signaturePattern: 'rabbitmq',
    componentType: 'rabbitmq',
    issues: ['QUEUE-001', 'QUEUE-002', 'QUEUE-003', 'QUEUE-004', 'INFRA-002'],
    propagationRules: [
      propagation('rabbit-flow', 'RabbitMQ flow control active', '{{nodeLabel}} RabbitMQ flow control throttling', 'QUEUE-005', amp({ trafficAmplification: 0.5 })),
    ],
  },
  {
    profileId: 'mq-no-consumer',
    signaturePattern: 'message-queue',
    componentType: 'message-queue',
    requiredTraits: ['is_terminal'],
    issues: ['QUEUE-001', 'QUEUE-002', 'QUEUE-004'],
    propagationRules: [
      propagation('mq-unbounded', 'Queue growing unbounded without consumers', '{{nodeLabel}} no consumers attached', 'QUEUE-004', amp({ capacityDegradation: 0.5 })),
    ],
  },
  {
    profileId: 'pub-sub',
    signaturePattern: 'pub-sub',
    componentType: 'pub-sub',
    issues: ['QUEUE-001', 'QUEUE-004'],
    propagationRules: [
      propagation('pubsub-fanout', 'Pub/sub fanout amplification', '{{nodeLabel}} pub/sub fanout multiplying messages', null, amp({ trafficAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'event-bus',
    signaturePattern: 'event-bus',
    componentType: 'event-bus',
    issues: ['QUEUE-001', 'QUEUE-003', 'QUEUE-004'],
    propagationRules: [
      propagation('ebus-replay', 'Event bus replay pressure', '{{nodeLabel}} event replay consuming resources', null, amp({ latencyAmplification: 1.5 })),
    ],
  },

  // ===== MICROSERVICES (8) =====
  {
    profileId: 'service-entry',
    signaturePattern: 'app-server',
    componentType: 'app-server',
    requiredTraits: ['is_entry'],
    issues: ['INFRA-001', 'INFRA-005', 'INFRA-006', 'SEC-001', 'SCALE-002'],
    propagationRules: [
      propagation('svc-entry-flood', 'Entry service overwhelmed', '{{nodeLabel}} entry service under traffic flood', null, amp({ errorAmplification: 1.5, dropFraction: 0.1 })),
    ],
  },
  {
    profileId: 'service-mid-chain',
    signaturePattern: 'app-server',
    componentType: 'app-server',
    requiredTraits: ['has_lb_upstream'],
    issues: ['INFRA-001', 'INFRA-005', 'INFRA-006', 'EXT-003'],
    propagationRules: [
      propagation('svc-cascade', 'Mid-chain service cascading failures', '{{nodeLabel}} propagating failures downstream', 'EXT-004', amp({ errorAmplification: 1.3, latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'service-terminal',
    signaturePattern: 'app-server',
    componentType: 'app-server',
    requiredTraits: ['is_terminal'],
    issues: ['INFRA-001', 'INFRA-005'],
    propagationRules: [
      propagation('svc-terminal-slow', 'Terminal service bottleneck', '{{nodeLabel}} terminal service is bottleneck', null, amp({ latencyAmplification: 1.0 })),
    ],
  },
  {
    profileId: 'web-server',
    signaturePattern: 'web-server',
    componentType: 'web-server',
    issues: ['INFRA-001', 'INFRA-005', 'INFRA-007', 'NET-001'],
    propagationRules: [
      propagation('web-static', 'Web server static asset pressure', '{{nodeLabel}} static asset serving under pressure', null, amp({ latencyAmplification: 1.2 })),
    ],
  },
  {
    profileId: 'worker-basic',
    signaturePattern: 'worker',
    componentType: 'worker',
    issues: ['INFRA-001', 'INFRA-002', 'QUEUE-001'],
    propagationRules: [
      propagation('worker-slow', 'Worker processing slowly', '{{nodeLabel}} worker falling behind queue', 'QUEUE-001', amp({ capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'worker-batch',
    signaturePattern: 'batch-processor',
    componentType: 'batch-processor',
    issues: ['INFRA-001', 'INFRA-002', 'BATCH-001', 'BATCH-003'],
    propagationRules: [
      propagation('batch-slow', 'Batch processor exceeding window', '{{nodeLabel}} batch job exceeding time window', 'BATCH-001', amp({ latencyAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'stream-proc',
    signaturePattern: 'stream-processor',
    componentType: 'stream-processor',
    issues: ['INFRA-001', 'INFRA-002', 'QUEUE-001', 'BATCH-002'],
    propagationRules: [
      propagation('stream-checkpoint', 'Stream processor checkpoint lag', '{{nodeLabel}} checkpoint falling behind', 'BATCH-002', amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'serverless',
    signaturePattern: 'serverless',
    componentType: 'serverless',
    issues: ['INFRA-001', 'INFRA-008', 'SCALE-001', 'CACHE-005'],
    propagationRules: [
      propagation('cold-start', 'Serverless cold start latency', '{{nodeLabel}} cold start penalty', 'CACHE-005', amp({ latencyAmplification: 5.0 }), 0.3),
    ],
  },

  // ===== NETWORKING (6) =====
  {
    profileId: 'cdn-edge',
    signaturePattern: 'cdn',
    componentType: 'cdn',
    issues: ['INFRA-004', 'NET-006', 'CACHE-002'],
    propagationRules: [
      propagation('cdn-origin', 'CDN cache miss to origin', '{{nodeLabel}} CDN origin pull under load', null, amp({ trafficAmplification: 1.3 })),
    ],
  },
  {
    profileId: 'dns-server',
    signaturePattern: 'dns',
    componentType: 'dns',
    issues: ['NET-002', 'INFRA-001'],
    propagationRules: [
      propagation('dns-cascade', 'DNS failure cascading', '{{nodeLabel}} DNS failure affecting all dependents', 'NET-002', amp({ errorAmplification: 5.0 })),
    ],
  },
  {
    profileId: 'firewall',
    signaturePattern: 'firewall',
    componentType: 'firewall',
    issues: ['INFRA-001', 'NET-001', 'SEC-001'],
    propagationRules: [
      propagation('fw-drop', 'Firewall dropping suspicious traffic', '{{nodeLabel}} firewall dropping packets', null, amp({ dropFraction: 0.1 })),
    ],
  },
  {
    profileId: 'waf',
    signaturePattern: 'waf',
    componentType: 'waf',
    issues: ['INFRA-001', 'NET-001', 'SEC-001'],
    propagationRules: [
      propagation('waf-block', 'WAF blocking requests', '{{nodeLabel}} WAF actively blocking threats', null, amp({ dropFraction: 0.15, latencyAmplification: 1.2 })),
    ],
  },
  {
    profileId: 'rate-limiter',
    signaturePattern: 'rate-limiter',
    componentType: 'rate-limiter',
    issues: ['SEC-001'],
    propagationRules: [
      propagation('rl-reject', 'Rate limiter rejecting excess', '{{nodeLabel}} rate limiter active', 'SEC-001', amp({ dropFraction: 0.3 })),
    ],
  },
  {
    profileId: 'vpn-gateway',
    signaturePattern: 'vpn-gateway',
    componentType: 'vpn-gateway',
    issues: ['NET-001', 'NET-004', 'NET-006'],
    propagationRules: [
      propagation('vpn-tunnel', 'VPN tunnel saturation', '{{nodeLabel}} VPN tunnel capacity reached', null, amp({ latencyAmplification: 2.0, capacityDegradation: 0.2 })),
    ],
  },

  // ===== SECURITY (4) =====
  {
    profileId: 'auth-service',
    signaturePattern: 'auth-service',
    componentType: 'auth-service',
    issues: ['INFRA-001', 'INFRA-006', 'SEC-002'],
    propagationRules: [
      propagation('auth-storm', 'Auth service under credential storm', '{{nodeLabel}} authentication service overwhelmed', 'SEC-002', amp({ latencyAmplification: 3.0, capacityDegradation: 0.4 })),
    ],
  },
  {
    profileId: 'identity-provider',
    signaturePattern: 'identity-provider',
    componentType: 'identity-provider',
    issues: ['INFRA-001', 'SEC-002', 'NET-004'],
    propagationRules: [
      propagation('idp-timeout', 'IdP response timeout', '{{nodeLabel}} identity provider timing out', 'EXT-003', amp({ latencyAmplification: 5.0 })),
    ],
  },
  {
    profileId: 'secret-manager',
    signaturePattern: 'secret-manager',
    componentType: 'secret-manager',
    issues: ['INFRA-001', 'NET-004'],
    propagationRules: [
      propagation('secret-fetch', 'Secret fetch latency', '{{nodeLabel}} secret retrieval delayed', null, amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'cert-manager',
    signaturePattern: 'certificate-manager',
    componentType: 'certificate-manager',
    issues: ['NET-003'],
    propagationRules: [
      propagation('cert-renew', 'Certificate renewal failure', '{{nodeLabel}} certificate renewal failed', 'NET-003', amp({ errorAmplification: 3.0 })),
    ],
  },

  // ===== OBSERVABILITY (4) =====
  {
    profileId: 'monitoring',
    signaturePattern: 'monitoring',
    componentType: 'monitoring',
    issues: ['OBS-001', 'INFRA-001'],
    propagationRules: [
      propagation('mon-gap', 'Monitoring gap', '{{nodeLabel}} metric collection falling behind', 'OBS-001', amp({})),
    ],
  },
  {
    profileId: 'logging',
    signaturePattern: 'logging',
    componentType: 'logging',
    issues: ['OBS-001', 'INFRA-003', 'QUEUE-004'],
    propagationRules: [
      propagation('log-backlog', 'Log pipeline backlog', '{{nodeLabel}} log ingestion queuing', 'OBS-001', amp({ capacityDegradation: 0.1 })),
    ],
  },
  {
    profileId: 'tracing',
    signaturePattern: 'tracing',
    componentType: 'tracing',
    issues: ['OBS-001', 'INFRA-001'],
    propagationRules: [
      propagation('trace-sample', 'Tracing forced sampling reduction', '{{nodeLabel}} trace sampling rate reduced', 'OBS-001', amp({})),
    ],
  },
  {
    profileId: 'alerting',
    signaturePattern: 'alerting',
    componentType: 'alerting',
    issues: ['OBS-001'],
    propagationRules: [
      propagation('alert-queue', 'Alert queue growing', '{{nodeLabel}} alert notification queuing', 'OBS-001', amp({})),
    ],
  },

  // ===== STORAGE (4) =====
  {
    profileId: 'object-storage',
    signaturePattern: 'object-storage',
    componentType: 'object-storage',
    issues: ['INFRA-003', 'INFRA-004', 'NET-006'],
    propagationRules: [
      propagation('s3-throttle', 'Object storage request throttling', '{{nodeLabel}} storage API rate limited', null, amp({ latencyAmplification: 2.0, dropFraction: 0.05 })),
    ],
  },
  {
    profileId: 's3',
    signaturePattern: 's3',
    componentType: 's3',
    issues: ['INFRA-003', 'NET-006'],
    propagationRules: [
      propagation('s3-rate', 'S3 prefix rate limit', '{{nodeLabel}} S3 prefix rate limit hit', null, amp({ dropFraction: 0.1 })),
    ],
  },
  {
    profileId: 'block-storage',
    signaturePattern: 'block-storage',
    componentType: 'block-storage',
    issues: ['INFRA-003', 'INFRA-010'],
    propagationRules: [
      propagation('ebs-throttle', 'Block storage IOPS throttle', '{{nodeLabel}} IOPS limit reached', null, amp({ latencyAmplification: 3.0 })),
    ],
  },
  {
    profileId: 'data-lake',
    signaturePattern: 'data-lake',
    componentType: 'data-lake',
    issues: ['INFRA-003', 'BATCH-001'],
    propagationRules: [
      propagation('lake-scan', 'Data lake full scan', '{{nodeLabel}} full partition scan in progress', null, amp({ latencyAmplification: 5.0 })),
    ],
  },

  // ===== SEARCH (2) =====
  {
    profileId: 'search-engine',
    signaturePattern: 'search-engine',
    componentType: 'search-engine',
    issues: ['INFRA-001', 'INFRA-002', 'INFRA-003', 'DATA-004'],
    propagationRules: [
      propagation('search-merge', 'Search index merge pressure', '{{nodeLabel}} index merge consuming resources', null, amp({ latencyAmplification: 2.0, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'elasticsearch',
    signaturePattern: 'elasticsearch',
    componentType: 'elasticsearch',
    issues: ['INFRA-001', 'INFRA-002', 'INFRA-003', 'DATA-004', 'DATA-007'],
    propagationRules: [
      propagation('es-circuit', 'Elasticsearch circuit breaker', '{{nodeLabel}} ES field data circuit breaker tripped', null, amp({ errorAmplification: 2.0, capacityDegradation: 0.3 })),
    ],
  },

  // ===== AI/ML (6) =====
  {
    profileId: 'ml-inference',
    signaturePattern: 'ml-inference',
    componentType: 'ml-inference',
    issues: ['INFRA-001', 'INFRA-002', 'INFRA-008', 'SCALE-001'],
    propagationRules: [
      propagation('ml-gpu', 'ML inference GPU saturation', '{{nodeLabel}} GPU memory/compute saturated', null, amp({ latencyAmplification: 3.0, capacityDegradation: 0.4 })),
    ],
  },
  {
    profileId: 'ml-training',
    signaturePattern: 'ml-training',
    componentType: 'ml-training',
    issues: ['INFRA-001', 'INFRA-002', 'INFRA-003', 'BATCH-001'],
    propagationRules: [
      propagation('ml-train-oom', 'Training OOM on large batch', '{{nodeLabel}} training batch OOM', null, amp({ capacityDegradation: 0.5 })),
    ],
  },
  {
    profileId: 'llm-gateway',
    signaturePattern: 'llm-gateway',
    componentType: 'llm-gateway',
    issues: ['INFRA-001', 'INFRA-005', 'EXT-003', 'SEC-001'],
    propagationRules: [
      propagation('llm-rate', 'LLM API rate limit', '{{nodeLabel}} LLM provider rate-limited', 'SEC-001', amp({ dropFraction: 0.3, latencyAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'feature-store',
    signaturePattern: 'feature-store',
    componentType: 'feature-store',
    issues: ['INFRA-001', 'DATA-007', 'CACHE-002'],
    propagationRules: [
      propagation('fs-stale', 'Feature store serving stale features', '{{nodeLabel}} serving stale feature data', null, amp({ latencyAmplification: 1.5 })),
    ],
  },
  {
    profileId: 'embedding-service',
    signaturePattern: 'embedding-service',
    componentType: 'embedding-service',
    issues: ['INFRA-001', 'INFRA-002', 'SCALE-001'],
    propagationRules: [
      propagation('embed-queue', 'Embedding request queuing', '{{nodeLabel}} embedding requests queuing', null, amp({ latencyAmplification: 2.0, capacityDegradation: 0.2 })),
    ],
  },
  {
    profileId: 'model-registry',
    signaturePattern: 'model-registry',
    componentType: 'model-registry',
    issues: ['INFRA-001', 'INFRA-003'],
    propagationRules: [
      propagation('registry-fetch', 'Model fetch latency', '{{nodeLabel}} model artifact download slow', null, amp({ latencyAmplification: 3.0 })),
    ],
  },

  // ===== DATA ENGINEERING (4) =====
  {
    profileId: 'etl-pipeline',
    signaturePattern: 'etl-pipeline',
    componentType: 'etl-pipeline',
    issues: ['INFRA-001', 'BATCH-001', 'BATCH-003'],
    propagationRules: [
      propagation('etl-slow', 'ETL pipeline exceeding window', '{{nodeLabel}} ETL job behind schedule', 'BATCH-001', amp({ latencyAmplification: 2.0 })),
    ],
  },
  {
    profileId: 'data-warehouse',
    signaturePattern: 'data-warehouse',
    componentType: 'data-warehouse',
    issues: ['INFRA-001', 'INFRA-003', 'DATA-004', 'BATCH-001'],
    propagationRules: [
      propagation('dw-query', 'Warehouse query queuing', '{{nodeLabel}} warehouse query slots exhausted', 'DATA-004', amp({ latencyAmplification: 3.0 })),
    ],
  },
  {
    profileId: 'spark-cluster',
    signaturePattern: 'spark-cluster',
    componentType: 'spark-cluster',
    issues: ['INFRA-001', 'INFRA-002', 'BATCH-001', 'BATCH-003'],
    propagationRules: [
      propagation('spark-shuffle', 'Spark shuffle spill to disk', '{{nodeLabel}} Spark shuffle spilling to disk', null, amp({ latencyAmplification: 3.0, capacityDegradation: 0.3 })),
    ],
  },
  {
    profileId: 'flink-cluster',
    signaturePattern: 'flink-cluster',
    componentType: 'flink-cluster',
    issues: ['INFRA-001', 'QUEUE-001', 'BATCH-002'],
    propagationRules: [
      propagation('flink-backpressure', 'Flink backpressure propagating', '{{nodeLabel}} Flink backpressure active', 'QUEUE-005', amp({ trafficAmplification: 0.5, latencyAmplification: 2.0 })),
    ],
  },

  // ===== CLIENT/IOT (2) =====
  {
    profileId: 'client',
    signaturePattern: 'client',
    componentType: 'client',
    requiredTraits: ['is_entry'],
    issues: [],
    propagationRules: [
      propagation('client-retry', 'Client retrying failed requests', '{{nodeLabel}} client layer retrying', null, amp({ trafficAmplification: 1.5 }), 0.5),
    ],
  },
  {
    profileId: 'iot-device',
    signaturePattern: 'iot-device',
    componentType: 'iot-device',
    issues: ['NET-001', 'NET-004'],
    propagationRules: [
      propagation('iot-reconnect', 'IoT device reconnection storm', '{{nodeLabel}} IoT devices reconnecting', 'SCALE-002', amp({ trafficAmplification: 3.0 })),
    ],
  },
];

// ---------------------------------------------------------------------------
// RuleDatabase class
// ---------------------------------------------------------------------------

/**
 * Rule database for looking up topology profiles by signature.
 *
 * Uses exact-match index for O(1) lookup on component type, falling back to
 * partial matching with specificity scoring for more nuanced matches.
 */
export class RuleDatabase {
  private exactIndex: Map<string, TopologyProfile[]> = new Map();
  private partialProfiles: TopologyProfile[];

  constructor(profiles: TopologyProfile[] = PROFILES) {
    this.partialProfiles = profiles;

    // Build exact index by componentType for fast lookup
    for (const profile of profiles) {
      const key = profile.componentType;
      const list = this.exactIndex.get(key) ?? [];
      list.push(profile);
      this.exactIndex.set(key, list);
    }
  }

  /**
   * Look up the best matching profile for a topology signature.
   *
   * 1. Exact match on componentType (O(1))
   * 2. Among matches, score specificity based on trait/upstream/downstream overlap
   * 3. Return the highest-scoring profile, or null if none match
   */
  lookup(signature: TopologySignature): TopologyProfile | null {
    const candidates = this.exactIndex.get(signature.componentType);
    if (!candidates || candidates.length === 0) {
      // Try partial match across all profiles
      return this.partialMatch(signature);
    }

    let bestProfile: TopologyProfile | null = null;
    let bestScore = -1;

    for (const profile of candidates) {
      const score = this.scoreSpecificity(profile, signature);
      if (score > bestScore) {
        bestScore = score;
        bestProfile = profile;
      }
    }

    return bestProfile;
  }

  /**
   * Score how specifically a profile matches a signature.
   *
   * Higher scores = better match. Returns -1 if required constraints are not met.
   */
  private scoreSpecificity(profile: TopologyProfile, sig: TopologySignature): number {
    let score = 0;

    // Required traits must ALL be present
    if (profile.requiredTraits) {
      for (const trait of profile.requiredTraits) {
        if (!sig.traits.includes(trait)) return -1;
      }
      score += profile.requiredTraits.length * 10;
    }

    // Required upstream types (subset match)
    if (profile.requiredUpstreamTypes) {
      for (const t of profile.requiredUpstreamTypes) {
        if (!sig.upstreamTypes.some((u) => u.includes(t))) return -1;
      }
      score += profile.requiredUpstreamTypes.length * 5;
    }

    // Required downstream types (subset match)
    if (profile.requiredDownstreamTypes) {
      for (const t of profile.requiredDownstreamTypes) {
        if (!sig.downstreamTypes.some((d) => d.includes(t))) return -1;
      }
      score += profile.requiredDownstreamTypes.length * 5;
    }

    // Bonus for matching component type exactly
    if (profile.componentType === sig.componentType) {
      score += 3;
    }

    // Bonus for signature pattern match
    if (sig.componentType.includes(profile.signaturePattern)) {
      score += 1;
    }

    return score;
  }

  /**
   * Partial match: try all profiles and return the best one.
   */
  private partialMatch(sig: TopologySignature): TopologyProfile | null {
    let bestProfile: TopologyProfile | null = null;
    let bestScore = -1;

    for (const profile of this.partialProfiles) {
      // Check if the component type is at least partially related
      if (
        !sig.componentType.includes(profile.signaturePattern) &&
        !profile.signaturePattern.includes(sig.componentType)
      ) {
        continue;
      }

      const score = this.scoreSpecificity(profile, sig);
      if (score > bestScore) {
        bestScore = score;
        bestProfile = profile;
      }
    }

    return bestProfile;
  }

  /** Get all profiles in the database. */
  getAllProfiles(): TopologyProfile[] {
    return this.partialProfiles;
  }

  /** Get profiles for a specific component type. */
  getProfilesForType(componentType: string): TopologyProfile[] {
    return this.exactIndex.get(componentType) ?? [];
  }
}

/** Singleton rule database instance. */
export const RULE_DATABASE = new RuleDatabase();
