/**
 * Issue Taxonomy (SIM-003)
 *
 * 52+ formal issue types with unique codes, severities, narrative templates,
 * and remediation suggestions. Maps pressure counter thresholds to named,
 * categorized issue types for automated detection during simulation.
 */

import type { PressureCounters, PressureCounterName } from './pressure-counters';
import type { TopologySignature } from './topology-signature';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Top-level issue categories. */
export type IssueCategory =
  | 'INFRA'
  | 'NET'
  | 'DATA'
  | 'QUEUE'
  | 'CACHE'
  | 'EXT'
  | 'BATCH'
  | 'SCALE'
  | 'SEC'
  | 'OBS';

/** Formal issue type definition in the catalog. */
export interface IssueType {
  /** Unique code, e.g. 'INFRA-001'. */
  code: string;
  /** Human-readable title. */
  title: string;
  /** Issue category. */
  category: IssueCategory;
  /** Severity level. */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Technical root cause description. */
  cause: string;
  /** User-facing impact description. */
  impact: string;
  /** Remediation advice. */
  recommendation: string;
  /** Narrative template with {{placeholders}}. */
  narrativeTemplate: string;
  /** Pressure counters that trigger this issue (ALL must exceed threshold). */
  triggerCounters: { counter: PressureCounterName; threshold: number }[];
  /** Component types this issue can occur on. '*' means all types. */
  applicableTypes: string[];
}

/** A detected issue instance attached to a specific node at a specific tick. */
export interface DetectedIssue {
  /** The issue code from the catalog. */
  issueCode: string;
  /** The affected node ID. */
  nodeId: string;
  /** The affected node label. */
  nodeLabel: string;
  /** Severity of the detected issue. */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Filled narrative string. */
  narrative: string;
  /** Tick at which the issue was detected. */
  detectedAtTick: number;
}

// ---------------------------------------------------------------------------
// Issue Catalog (52 entries)
// ---------------------------------------------------------------------------

export const ISSUE_CATALOG: IssueType[] = [
  // ---- INFRA-001 through INFRA-013 ----
  {
    code: 'INFRA-001',
    title: 'CPU Throttling',
    category: 'INFRA',
    severity: 'high',
    cause: 'Sustained CPU utilization above 80% causing kernel-level throttling.',
    impact: 'Increased request latency and reduced throughput across all services on this node.',
    recommendation: 'Scale horizontally by adding replicas, or vertically by upgrading instance type.',
    narrativeTemplate: '{{nodeLabel}} is experiencing CPU throttling (counter at {{counterValue}}/{{threshold}}) due to sustained high utilization. Requests are being delayed.',
    triggerCounters: [{ counter: 'cpuThrottleTicks', threshold: 5 }],
    applicableTypes: ['*'],
  },
  {
    code: 'INFRA-002',
    title: 'Memory Exhaustion (OOM Risk)',
    category: 'INFRA',
    severity: 'critical',
    cause: 'Memory usage exceeding 85% of available capacity, risking OOM kill.',
    impact: 'Process may be killed by the OS, causing complete service disruption.',
    recommendation: 'Profile memory usage to find leaks. Increase memory limits or add replicas.',
    narrativeTemplate: '{{nodeLabel}} is at risk of OOM with memory pressure at {{counterValue}}/{{threshold}}. Process termination is imminent.',
    triggerCounters: [{ counter: 'memoryPressureTicks', threshold: 5 }],
    applicableTypes: ['*'],
  },
  {
    code: 'INFRA-003',
    title: 'Disk I/O Saturation',
    category: 'INFRA',
    severity: 'high',
    cause: 'Disk I/O bandwidth is fully consumed, queuing all read/write operations.',
    impact: 'Database queries and file operations experience significant latency spikes.',
    recommendation: 'Migrate to SSD/NVMe storage, add read replicas, or implement caching layer.',
    narrativeTemplate: '{{nodeLabel}} has saturated disk I/O ({{counterValue}}/{{threshold}} ticks). All storage operations are queuing.',
    triggerCounters: [{ counter: 'diskIoSaturationTicks', threshold: 4 }],
    applicableTypes: ['database', 'document-db', 'wide-column', 'graph-db', 'timeseries-db', 'object-storage', 'block-storage', 'storage', '*'],
  },
  {
    code: 'INFRA-004',
    title: 'Network Bandwidth Saturation',
    category: 'INFRA',
    severity: 'high',
    cause: 'Network interface throughput at capacity, dropping or delaying packets.',
    impact: 'Increased latency and packet loss affecting all network-dependent operations.',
    recommendation: 'Enable network compression, reduce payload sizes, or upgrade NIC capacity.',
    narrativeTemplate: '{{nodeLabel}} has saturated its network bandwidth ({{counterValue}}/{{threshold}}). Packet queuing is occurring.',
    triggerCounters: [{ counter: 'networkBandwidthSaturation', threshold: 4 }],
    applicableTypes: ['load-balancer', 'cdn', 'cdn-edge', 'reverse-proxy', '*'],
  },
  {
    code: 'INFRA-005',
    title: 'Thread Pool Exhaustion',
    category: 'INFRA',
    severity: 'high',
    cause: 'All worker threads are busy, new requests must wait in the accept queue.',
    impact: 'Request latency increases dramatically; timeouts begin occurring for clients.',
    recommendation: 'Increase thread pool size, add connection pooling, or implement async I/O.',
    narrativeTemplate: '{{nodeLabel}} has exhausted its thread pool ({{counterValue}}/{{threshold}}). New requests are queuing at the socket level.',
    triggerCounters: [{ counter: 'threadPoolSaturation', threshold: 6 }],
    applicableTypes: ['web-server', 'app-server', 'api-gateway', 'worker', 'service', '*'],
  },
  {
    code: 'INFRA-006',
    title: 'Connection Pool Exhaustion',
    category: 'INFRA',
    severity: 'critical',
    cause: 'All database/service connections are in use with none available.',
    impact: 'New requests fail immediately with connection timeout errors.',
    recommendation: 'Increase pool size, implement connection recycling, or add a connection proxy like PgBouncer.',
    narrativeTemplate: '{{nodeLabel}} has exhausted its connection pool ({{counterValue}}/{{threshold}}). New requests are being rejected.',
    triggerCounters: [{ counter: 'connectionPoolExhaustion', threshold: 5 }],
    applicableTypes: ['database', 'app-server', 'web-server', 'worker', 'service', '*'],
  },
  {
    code: 'INFRA-007',
    title: 'File Descriptor Exhaustion',
    category: 'INFRA',
    severity: 'critical',
    cause: 'Process has reached the OS file descriptor limit.',
    impact: 'Cannot open new sockets, files, or pipes. All new connections are refused.',
    recommendation: 'Increase ulimit, fix file/socket leaks, or distribute load across more instances.',
    narrativeTemplate: '{{nodeLabel}} is running out of file descriptors ({{counterValue}}/{{threshold}}). New connections will be refused.',
    triggerCounters: [{ counter: 'fileDescriptorPressure', threshold: 4 }],
    applicableTypes: ['web-server', 'app-server', 'worker', 'service', '*'],
  },
  {
    code: 'INFRA-008',
    title: 'GC Pause Storm',
    category: 'INFRA',
    severity: 'medium',
    cause: 'Frequent garbage collection pauses consuming significant CPU time.',
    impact: 'Intermittent latency spikes as the application pauses for garbage collection.',
    recommendation: 'Tune GC settings, reduce object allocation rate, or switch to a low-latency GC.',
    narrativeTemplate: '{{nodeLabel}} is experiencing GC pause pressure ({{counterValue}}/{{threshold}}). Intermittent latency spikes are occurring.',
    triggerCounters: [{ counter: 'gcPausePressure', threshold: 3 }],
    applicableTypes: ['app-server', 'web-server', 'worker', 'service', '*'],
  },
  {
    code: 'INFRA-009',
    title: 'Swap Thrashing',
    category: 'INFRA',
    severity: 'critical',
    cause: 'System is actively swapping memory to disk due to extreme memory pressure.',
    impact: 'Order-of-magnitude latency increase; effectively unusable performance.',
    recommendation: 'Add memory, kill memory-hungry processes, or enable OOM killer policies.',
    narrativeTemplate: '{{nodeLabel}} is swap-thrashing ({{counterValue}}/{{threshold}}). Performance has degraded by 10-100x.',
    triggerCounters: [{ counter: 'swapUsageTicks', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'INFRA-010',
    title: 'I/O Wait Bottleneck',
    category: 'INFRA',
    severity: 'medium',
    cause: 'CPU idle time dominated by I/O wait, indicating storage is the bottleneck.',
    impact: 'Reduced throughput despite available CPU; queries block on disk operations.',
    recommendation: 'Optimize queries, add caching, or upgrade to faster storage (SSD/NVMe).',
    narrativeTemplate: '{{nodeLabel}} is bottlenecked on I/O wait ({{counterValue}}/{{threshold}}). CPU is idle waiting for disk.',
    triggerCounters: [{ counter: 'iowaitTicks', threshold: 4 }],
    applicableTypes: ['database', 'document-db', 'wide-column', 'storage', '*'],
  },
  {
    code: 'INFRA-011',
    title: 'Cascading Resource Exhaustion',
    category: 'INFRA',
    severity: 'critical',
    cause: 'Multiple resource limits hit simultaneously (CPU + memory + connections).',
    impact: 'Complete service degradation with no single fix; system is in failure spiral.',
    recommendation: 'Immediate horizontal scaling. Investigate root cause of resource amplification.',
    narrativeTemplate: '{{nodeLabel}} is experiencing cascading resource exhaustion: CPU, memory, and connection pools are all under pressure.',
    triggerCounters: [
      { counter: 'cpuThrottleTicks', threshold: 3 },
      { counter: 'memoryPressureTicks', threshold: 3 },
      { counter: 'connectionPoolExhaustion', threshold: 3 },
    ],
    applicableTypes: ['*'],
  },
  {
    code: 'INFRA-012',
    title: 'Container OOM Kill',
    category: 'INFRA',
    severity: 'critical',
    cause: 'Container memory limit reached, triggering OOM kill by orchestrator.',
    impact: 'Container restarts, causing brief downtime and potential data loss.',
    recommendation: 'Increase container memory limits or fix memory leaks in application code.',
    narrativeTemplate: '{{nodeLabel}} container was OOM-killed (memory pressure at {{counterValue}}/{{threshold}}). Container is restarting.',
    triggerCounters: [{ counter: 'memoryPressureTicks', threshold: 8 }],
    applicableTypes: ['*'],
  },
  {
    code: 'INFRA-013',
    title: 'Noisy Neighbor Effect',
    category: 'INFRA',
    severity: 'medium',
    cause: 'Shared infrastructure resources contended by co-located workloads.',
    impact: 'Unpredictable performance variance and intermittent latency spikes.',
    recommendation: 'Use dedicated instances, implement resource quotas, or migrate to isolated compute.',
    narrativeTemplate: '{{nodeLabel}} is affected by noisy neighbor contention (CPU throttle at {{counterValue}}/{{threshold}} with high jitter).',
    triggerCounters: [
      { counter: 'cpuThrottleTicks', threshold: 3 },
      { counter: 'jitterAccumulator', threshold: 3 },
    ],
    applicableTypes: ['*'],
  },

  // ---- NET-001 through NET-008 ----
  {
    code: 'NET-001',
    title: 'Packet Loss Degradation',
    category: 'NET',
    severity: 'medium',
    cause: 'Sustained packet loss causing TCP retransmissions and throughput reduction.',
    impact: 'Effective throughput reduced by 30-70%; tail latency increases significantly.',
    recommendation: 'Investigate network path, check for congestion, or switch to a more reliable link.',
    narrativeTemplate: '{{nodeLabel}} is experiencing packet loss ({{counterValue}}/{{threshold}}). TCP retransmissions are reducing effective throughput.',
    triggerCounters: [{ counter: 'packetLossAccumulator', threshold: 5 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-002',
    title: 'DNS Resolution Failure',
    category: 'NET',
    severity: 'high',
    cause: 'DNS resolver unable to resolve hostnames, preventing new connections.',
    impact: 'All new outbound connections fail; existing connections may still work.',
    recommendation: 'Check DNS server health, add redundant resolvers, implement DNS caching.',
    narrativeTemplate: '{{nodeLabel}} cannot resolve DNS ({{counterValue}}/{{threshold}} failures). New connections are impossible.',
    triggerCounters: [{ counter: 'dnsResolutionFailures', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-003',
    title: 'TLS Handshake Failures',
    category: 'NET',
    severity: 'high',
    cause: 'TLS certificate issues or handshake failures blocking secure connections.',
    impact: 'All HTTPS connections fail; service is unreachable via secure channels.',
    recommendation: 'Renew certificates, verify certificate chain, check clock synchronization.',
    narrativeTemplate: '{{nodeLabel}} has TLS handshake failures ({{counterValue}}/{{threshold}}). Secure connections are failing.',
    triggerCounters: [{ counter: 'tlsHandshakeFailures', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-004',
    title: 'Connection Timeout Storm',
    category: 'NET',
    severity: 'high',
    cause: 'Multiple connection attempts timing out, indicating unreachable backend.',
    impact: 'Threads blocked waiting for connections; client-facing timeout errors.',
    recommendation: 'Reduce timeout values, implement circuit breaker, check target availability.',
    narrativeTemplate: '{{nodeLabel}} is experiencing connection timeouts ({{counterValue}}/{{threshold}}). Backend may be unreachable.',
    triggerCounters: [{ counter: 'connectionTimeoutAccumulator', threshold: 4 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-005',
    title: 'Half-Open Connection Leak',
    category: 'NET',
    severity: 'medium',
    cause: 'TCP connections stuck in half-open state consuming file descriptors.',
    impact: 'Gradual resource leak leading to file descriptor exhaustion.',
    recommendation: 'Enable TCP keepalive, reduce SYN timeout, implement connection health checks.',
    narrativeTemplate: '{{nodeLabel}} has accumulating half-open connections ({{counterValue}}/{{threshold}}). File descriptor leak in progress.',
    triggerCounters: [{ counter: 'halfOpenConnections', threshold: 5 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-006',
    title: 'Bandwidth Throttle Active',
    category: 'NET',
    severity: 'medium',
    cause: 'Network bandwidth is being throttled, limiting data transfer rates.',
    impact: 'Large payloads and streaming requests experience significant delays.',
    recommendation: 'Compress data in transit, implement pagination, or upgrade network tier.',
    narrativeTemplate: '{{nodeLabel}} is being bandwidth-throttled ({{counterValue}}/{{threshold}}). Large transfers are delayed.',
    triggerCounters: [{ counter: 'bandwidthThrottling', threshold: 4 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-007',
    title: 'TCP Retransmission Storm',
    category: 'NET',
    severity: 'high',
    cause: 'High retransmission rate indicating severe network path issues.',
    impact: 'Effective throughput collapse with latency spikes across all connections.',
    recommendation: 'Investigate network path, check for packet drops at switches/routers.',
    narrativeTemplate: '{{nodeLabel}} has high TCP retransmissions ({{counterValue}}/{{threshold}}). Network path is severely degraded.',
    triggerCounters: [{ counter: 'retransmissionRate', threshold: 4 }],
    applicableTypes: ['*'],
  },
  {
    code: 'NET-008',
    title: 'High Network Jitter',
    category: 'NET',
    severity: 'low',
    cause: 'Inconsistent network latency causing unpredictable response times.',
    impact: 'Tail latency increases; timeout-sensitive operations may fail intermittently.',
    recommendation: 'Use dedicated network paths, implement request hedging, increase timeout buffers.',
    narrativeTemplate: '{{nodeLabel}} is experiencing high jitter ({{counterValue}}/{{threshold}}). Response times are unpredictable.',
    triggerCounters: [{ counter: 'jitterAccumulator', threshold: 5 }],
    applicableTypes: ['*'],
  },

  // ---- DATA-001 through DATA-008 ----
  {
    code: 'DATA-001',
    title: 'Replication Lag Crisis',
    category: 'DATA',
    severity: 'high',
    cause: 'Database replica falling behind primary by multiple seconds.',
    impact: 'Stale reads from replicas; potential data inconsistency for users.',
    recommendation: 'Reduce write load, optimize replication, or switch reads to primary temporarily.',
    narrativeTemplate: '{{nodeLabel}} has critical replication lag ({{counterValue}}/{{threshold}} ticks). Reads may return stale data.',
    triggerCounters: [{ counter: 'replicationLagTicks', threshold: 3 }],
    applicableTypes: ['database', 'document-db', 'wide-column', 'postgres', 'mysql', '*'],
  },
  {
    code: 'DATA-002',
    title: 'Lock Contention',
    category: 'DATA',
    severity: 'medium',
    cause: 'Multiple transactions competing for the same database locks.',
    impact: 'Increased query latency and reduced transaction throughput.',
    recommendation: 'Optimize transaction scope, use optimistic locking, or partition hot tables.',
    narrativeTemplate: '{{nodeLabel}} is experiencing lock contention ({{counterValue}}/{{threshold}}). Transaction throughput is reduced.',
    triggerCounters: [{ counter: 'lockContentionTicks', threshold: 4 }],
    applicableTypes: ['database', 'document-db', 'postgres', 'mysql', '*'],
  },
  {
    code: 'DATA-003',
    title: 'Deadlock Detected',
    category: 'DATA',
    severity: 'high',
    cause: 'Circular lock dependency between concurrent transactions.',
    impact: 'Affected transactions are aborted; automatic retry may cause retry storms.',
    recommendation: 'Enforce consistent lock ordering, reduce transaction scope, use row-level locks.',
    narrativeTemplate: '{{nodeLabel}} has detected deadlocks ({{counterValue}}/{{threshold}}). Transactions are being aborted and retried.',
    triggerCounters: [{ counter: 'deadlockDetections', threshold: 2 }],
    applicableTypes: ['database', 'postgres', 'mysql', '*'],
  },
  {
    code: 'DATA-004',
    title: 'Slow Query Accumulation',
    category: 'DATA',
    severity: 'medium',
    cause: 'Multiple queries exceeding acceptable latency thresholds.',
    impact: 'Database connection pool draining as connections are held by slow queries.',
    recommendation: 'Add missing indexes, optimize query plans, implement query timeout limits.',
    narrativeTemplate: '{{nodeLabel}} has accumulating slow queries ({{counterValue}}/{{threshold}}). Connection pool is draining.',
    triggerCounters: [{ counter: 'slowQueryAccumulator', threshold: 4 }],
    applicableTypes: ['database', 'document-db', 'postgres', 'mysql', 'search-engine', '*'],
  },
  {
    code: 'DATA-005',
    title: 'Index Miss Pressure',
    category: 'DATA',
    severity: 'medium',
    cause: 'Queries hitting table scans instead of indexes.',
    impact: 'Exponentially increasing query times as data volume grows.',
    recommendation: 'Analyze query patterns and add appropriate indexes. Run EXPLAIN on slow queries.',
    narrativeTemplate: '{{nodeLabel}} has high index miss rate ({{counterValue}}/{{threshold}}). Full table scans are occurring.',
    triggerCounters: [{ counter: 'indexMissPressure', threshold: 5 }],
    applicableTypes: ['database', 'document-db', 'postgres', 'mysql', '*'],
  },
  {
    code: 'DATA-006',
    title: 'Connection Pool Wait Time',
    category: 'DATA',
    severity: 'high',
    cause: 'Requests queuing for available database connections.',
    impact: 'Latency increases proportional to pool wait time; potential cascading timeouts.',
    recommendation: 'Increase pool size, add connection proxy (PgBouncer), or reduce per-query time.',
    narrativeTemplate: '{{nodeLabel}} database pool wait time is excessive ({{counterValue}}/{{threshold}}). Requests are queuing for connections.',
    triggerCounters: [{ counter: 'connectionPoolWaitTime', threshold: 5 }],
    applicableTypes: ['database', 'postgres', 'mysql', 'document-db', '*'],
  },
  {
    code: 'DATA-007',
    title: 'Query Latency Spike',
    category: 'DATA',
    severity: 'high',
    cause: 'Sudden increase in average query execution time.',
    impact: 'P99 latency exceeds SLA thresholds; downstream services may timeout.',
    recommendation: 'Check for lock contention, missing indexes, or increased data volume.',
    narrativeTemplate: '{{nodeLabel}} has query latency spikes ({{counterValue}}/{{threshold}}). P99 may be exceeding SLA.',
    triggerCounters: [{ counter: 'queryLatencySpikes', threshold: 4 }],
    applicableTypes: ['database', 'document-db', 'wide-column', 'graph-db', '*'],
  },
  {
    code: 'DATA-008',
    title: 'Write Amplification',
    category: 'DATA',
    severity: 'medium',
    cause: 'Excessive write operations due to indexing, replication, and journaling.',
    impact: 'Disk I/O saturates faster than expected from write throughput alone.',
    recommendation: 'Batch writes, reduce index count on write-heavy tables, use async replication.',
    narrativeTemplate: '{{nodeLabel}} is experiencing write amplification. Disk I/O ({{counterValue}}/{{threshold}}) exceeds expected write rate.',
    triggerCounters: [{ counter: 'diskIoSaturationTicks', threshold: 3 }, { counter: 'lockContentionTicks', threshold: 2 }],
    applicableTypes: ['database', 'document-db', 'postgres', 'mysql', '*'],
  },

  // ---- QUEUE-001 through QUEUE-005 ----
  {
    code: 'QUEUE-001',
    title: 'Consumer Lag',
    category: 'QUEUE',
    severity: 'high',
    cause: 'Consumers unable to keep up with message production rate.',
    impact: 'Growing backlog; messages processed with increasing delay.',
    recommendation: 'Add consumer instances, increase batch size, or implement backpressure.',
    narrativeTemplate: '{{nodeLabel}} has growing consumer lag ({{counterValue}}/{{threshold}}). Messages are being delayed.',
    triggerCounters: [{ counter: 'consumerLagTicks', threshold: 4 }],
    applicableTypes: ['message-queue', 'kafka', 'rabbitmq', 'pub-sub', 'event-bus', 'sqs', '*'],
  },
  {
    code: 'QUEUE-002',
    title: 'DLQ Overflow',
    category: 'QUEUE',
    severity: 'critical',
    cause: 'Dead letter queue growing, indicating persistent processing failures.',
    impact: 'Messages are being permanently lost or require manual intervention.',
    recommendation: 'Investigate failure root cause, fix consumer bugs, implement retry policies.',
    narrativeTemplate: '{{nodeLabel}} DLQ is overflowing ({{counterValue}}/{{threshold}}). Messages are being lost.',
    triggerCounters: [{ counter: 'dlqOverflowTicks', threshold: 3 }],
    applicableTypes: ['message-queue', 'kafka', 'rabbitmq', 'sqs', '*'],
  },
  {
    code: 'QUEUE-003',
    title: 'Message Redelivery Storm',
    category: 'QUEUE',
    severity: 'medium',
    cause: 'High rate of message redeliveries due to consumer failures.',
    impact: 'Duplicate processing and amplified load on downstream services.',
    recommendation: 'Implement idempotent consumers, fix processing errors, tune visibility timeout.',
    narrativeTemplate: '{{nodeLabel}} has high message redelivery rate ({{counterValue}}/{{threshold}}). Duplicate processing is occurring.',
    triggerCounters: [{ counter: 'messageRedeliveryRate', threshold: 3 }],
    applicableTypes: ['message-queue', 'kafka', 'rabbitmq', 'sqs', '*'],
  },
  {
    code: 'QUEUE-004',
    title: 'Queue Depth Critical',
    category: 'QUEUE',
    severity: 'high',
    cause: 'Queue depth exceeding safe operating limits.',
    impact: 'Memory pressure on broker; oldest messages may be dropped or TTL-expired.',
    recommendation: 'Scale consumers, implement flow control, or increase queue capacity.',
    narrativeTemplate: '{{nodeLabel}} queue depth is critical ({{counterValue}}/{{threshold}}). Broker memory may be at risk.',
    triggerCounters: [{ counter: 'queueDepthPressure', threshold: 5 }],
    applicableTypes: ['message-queue', 'kafka', 'rabbitmq', 'pub-sub', 'event-bus', 'sqs', '*'],
  },
  {
    code: 'QUEUE-005',
    title: 'Backpressure Cascade',
    category: 'QUEUE',
    severity: 'high',
    cause: 'Queue backpressure propagating to upstream producers.',
    impact: 'Producer threads block, causing upstream service degradation.',
    recommendation: 'Implement async publishing, add buffer capacity, or throttle producers.',
    narrativeTemplate: '{{nodeLabel}} is applying backpressure to producers (queue depth at {{counterValue}}/{{threshold}}). Upstream services affected.',
    triggerCounters: [{ counter: 'queueDepthPressure', threshold: 7 }, { counter: 'consumerLagTicks', threshold: 3 }],
    applicableTypes: ['message-queue', 'kafka', 'rabbitmq', 'pub-sub', '*'],
  },

  // ---- CACHE-001 through CACHE-005 ----
  {
    code: 'CACHE-001',
    title: 'Cache Eviction Storm',
    category: 'CACHE',
    severity: 'high',
    cause: 'Mass eviction of cached entries due to memory pressure.',
    impact: 'Thundering herd of requests hitting the backing database.',
    recommendation: 'Increase cache memory, implement staggered TTLs, or add cache warming.',
    narrativeTemplate: '{{nodeLabel}} is experiencing cache eviction storm ({{counterValue}}/{{threshold}}). Database load is spiking.',
    triggerCounters: [{ counter: 'cacheEvictionRate', threshold: 4 }],
    applicableTypes: ['cache', 'redis', 'redis-cache', 'redis-cluster', 'memcached', '*'],
  },
  {
    code: 'CACHE-002',
    title: 'Cache Miss Rate Critical',
    category: 'CACHE',
    severity: 'medium',
    cause: 'Cache hit rate has dropped below acceptable levels.',
    impact: 'Most requests falling through to the database, negating cache benefits.',
    recommendation: 'Review cache key strategy, extend TTLs, or implement cache-aside pattern.',
    narrativeTemplate: '{{nodeLabel}} cache miss rate is critical ({{counterValue}}/{{threshold}}). Database is absorbing cache load.',
    triggerCounters: [{ counter: 'cacheMissRatePressure', threshold: 5 }],
    applicableTypes: ['cache', 'redis', 'redis-cache', 'redis-cluster', 'memcached', '*'],
  },
  {
    code: 'CACHE-003',
    title: 'Hot Key Contention',
    category: 'CACHE',
    severity: 'high',
    cause: 'Disproportionate traffic to a single cache key.',
    impact: 'Single shard overwhelmed; other shards underutilized.',
    recommendation: 'Implement key-level replication, add local caching, or shard the hot key.',
    narrativeTemplate: '{{nodeLabel}} has a hot key problem ({{counterValue}}/{{threshold}}). One shard is overwhelmed.',
    triggerCounters: [{ counter: 'hotKeyPressure', threshold: 4 }],
    applicableTypes: ['cache', 'redis', 'redis-cache', 'redis-cluster', 'memcached', 'database', '*'],
  },
  {
    code: 'CACHE-004',
    title: 'Memory Fragmentation',
    category: 'CACHE',
    severity: 'medium',
    cause: 'Internal memory fragmentation reducing effective cache capacity.',
    impact: 'Less data cached than expected for the allocated memory.',
    recommendation: 'Restart cache with defragmentation, use jemalloc, or normalize value sizes.',
    narrativeTemplate: '{{nodeLabel}} has high memory fragmentation ({{counterValue}}/{{threshold}}). Effective capacity is reduced.',
    triggerCounters: [{ counter: 'memoryFragmentation', threshold: 5 }],
    applicableTypes: ['cache', 'redis', 'redis-cache', 'redis-cluster', 'memcached', '*'],
  },
  {
    code: 'CACHE-005',
    title: 'Cold Cache Start',
    category: 'CACHE',
    severity: 'low',
    cause: 'Cache was recently cleared or restarted with empty state.',
    impact: 'Temporary spike in database load until cache warms up.',
    recommendation: 'Implement cache warming on startup, use persistent cache storage.',
    narrativeTemplate: '{{nodeLabel}} is in cold-start phase (miss pressure at {{counterValue}}/{{threshold}}). Database load is temporarily elevated.',
    triggerCounters: [{ counter: 'cacheMissRatePressure', threshold: 3 }, { counter: 'cacheEvictionRate', threshold: 1 }],
    applicableTypes: ['cache', 'redis', 'redis-cache', 'redis-cluster', 'memcached', '*'],
  },

  // ---- EXT-001 through EXT-004 ----
  {
    code: 'EXT-001',
    title: 'Circuit Breaker Open',
    category: 'EXT',
    severity: 'high',
    cause: 'Error rate exceeded circuit breaker threshold; calls are being short-circuited.',
    impact: 'All requests to the dependency fail immediately without attempting the call.',
    recommendation: 'Investigate root cause of failures. Implement fallback responses.',
    narrativeTemplate: '{{nodeLabel}} circuit breaker has opened ({{counterValue}}/{{threshold}} trips). Dependency calls are short-circuited.',
    triggerCounters: [{ counter: 'circuitBreakerTrips', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'EXT-002',
    title: 'Retry Storm Amplification',
    category: 'EXT',
    severity: 'high',
    cause: 'Cascading retries from multiple layers amplifying traffic 3-5x.',
    impact: 'Already-stressed services receive amplified load, deepening the outage.',
    recommendation: 'Implement exponential backoff with jitter, circuit breakers, and retry budgets.',
    narrativeTemplate: '{{nodeLabel}} is in a retry storm ({{counterValue}}/{{threshold}}). Traffic is amplified 3-5x.',
    triggerCounters: [{ counter: 'retryStormPressure', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'EXT-003',
    title: 'Dependency Timeout',
    category: 'EXT',
    severity: 'medium',
    cause: 'External service calls consistently timing out.',
    impact: 'Thread pool drain as threads block on slow external calls.',
    recommendation: 'Reduce timeout values, implement async calls, add caching for external data.',
    narrativeTemplate: '{{nodeLabel}} has dependency timeouts ({{counterValue}}/{{threshold}}). Threads are blocked on external calls.',
    triggerCounters: [{ counter: 'connectionTimeoutAccumulator', threshold: 4 }],
    applicableTypes: ['*'],
  },
  {
    code: 'EXT-004',
    title: 'Cascade Failure',
    category: 'EXT',
    severity: 'critical',
    cause: 'Failure in one service propagating to dependent services.',
    impact: 'Multiple services degraded or failing; system-wide outage in progress.',
    recommendation: 'Implement bulkheads, circuit breakers, and graceful degradation patterns.',
    narrativeTemplate: '{{nodeLabel}} is participating in a cascade failure. Multiple counters elevated: circuit breakers ({{counterValue}}) and retry pressure.',
    triggerCounters: [{ counter: 'circuitBreakerTrips', threshold: 2 }, { counter: 'retryStormPressure', threshold: 2 }],
    applicableTypes: ['*'],
  },

  // ---- BATCH-001 through BATCH-003 ----
  {
    code: 'BATCH-001',
    title: 'Batch Job Timeout',
    category: 'BATCH',
    severity: 'medium',
    cause: 'Batch processing job exceeding its expected execution window.',
    impact: 'Downstream data pipelines stalled; SLA violations for data freshness.',
    recommendation: 'Optimize batch size, parallelize processing, or extend execution window.',
    narrativeTemplate: '{{nodeLabel}} batch job is timing out (slow query accumulation at {{counterValue}}/{{threshold}}).',
    triggerCounters: [{ counter: 'slowQueryAccumulator', threshold: 5 }],
    applicableTypes: ['batch-processor', 'etl-pipeline', 'worker', 'spark-cluster', '*'],
  },
  {
    code: 'BATCH-002',
    title: 'Checkpoint Failure',
    category: 'BATCH',
    severity: 'high',
    cause: 'Stream processor unable to checkpoint progress.',
    impact: 'Potential data loss on restart; duplicate processing on recovery.',
    recommendation: 'Check checkpoint storage health, reduce checkpoint interval, add redundancy.',
    narrativeTemplate: '{{nodeLabel}} checkpoint is failing (disk I/O at {{counterValue}}/{{threshold}}). Data loss risk on restart.',
    triggerCounters: [{ counter: 'diskIoSaturationTicks', threshold: 3 }],
    applicableTypes: ['stream-processor', 'flink-cluster', 'spark-cluster', '*'],
  },
  {
    code: 'BATCH-003',
    title: 'Data Skew',
    category: 'BATCH',
    severity: 'medium',
    cause: 'Uneven data distribution causing hotspot on specific partitions.',
    impact: 'Some workers overwhelmed while others idle; overall job time dominated by slowest.',
    recommendation: 'Repartition data, add salting to keys, or implement dynamic load balancing.',
    narrativeTemplate: '{{nodeLabel}} has data skew (CPU throttle at {{counterValue}}/{{threshold}} while peers are idle).',
    triggerCounters: [{ counter: 'cpuThrottleTicks', threshold: 4 }, { counter: 'queueDepthPressure', threshold: 4 }],
    applicableTypes: ['batch-processor', 'stream-processor', 'spark-cluster', 'flink-cluster', '*'],
  },

  // ---- SCALE-001 through SCALE-003 ----
  {
    code: 'SCALE-001',
    title: 'Autoscale Lag',
    category: 'SCALE',
    severity: 'medium',
    cause: 'Autoscaler responding too slowly to traffic increase.',
    impact: 'Service degraded during the scaling window; requests queuing.',
    recommendation: 'Reduce scaling cooldown, implement predictive scaling, or pre-warm capacity.',
    narrativeTemplate: '{{nodeLabel}} autoscaler is lagging behind demand (CPU at {{counterValue}}/{{threshold}}). Scaling in progress.',
    triggerCounters: [{ counter: 'cpuThrottleTicks', threshold: 4 }, { counter: 'threadPoolSaturation', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'SCALE-002',
    title: 'Thundering Herd',
    category: 'SCALE',
    severity: 'high',
    cause: 'Mass simultaneous reconnection after brief outage.',
    impact: 'Instantaneous load spike that may trigger cascading failures.',
    recommendation: 'Implement connection jitter, use exponential backoff on reconnect.',
    narrativeTemplate: '{{nodeLabel}} is under thundering herd pressure (thread pool at {{counterValue}}/{{threshold}} with connection surge).',
    triggerCounters: [{ counter: 'threadPoolSaturation', threshold: 5 }, { counter: 'connectionPoolExhaustion', threshold: 3 }],
    applicableTypes: ['*'],
  },
  {
    code: 'SCALE-003',
    title: 'Capacity Ceiling Hit',
    category: 'SCALE',
    severity: 'critical',
    cause: 'Service at maximum configured capacity with no room to scale.',
    impact: 'Requests are being dropped or queued with no relief in sight.',
    recommendation: 'Increase maximum instance count, optimize per-request resource usage.',
    narrativeTemplate: '{{nodeLabel}} has hit its capacity ceiling (CPU at {{counterValue}}/{{threshold}}, all pools exhausted). No scaling headroom.',
    triggerCounters: [
      { counter: 'cpuThrottleTicks', threshold: 7 },
      { counter: 'threadPoolSaturation', threshold: 5 },
      { counter: 'connectionPoolExhaustion', threshold: 4 },
    ],
    applicableTypes: ['*'],
  },

  // ---- SEC-001 through SEC-002 ----
  {
    code: 'SEC-001',
    title: 'Rate Limit Breach',
    category: 'SEC',
    severity: 'medium',
    cause: 'Incoming traffic exceeding configured rate limits.',
    impact: 'Legitimate requests may be rejected alongside abusive traffic.',
    recommendation: 'Tune rate limit thresholds, implement per-client limits, add WAF rules.',
    narrativeTemplate: '{{nodeLabel}} rate limits are being breached (queue depth at {{counterValue}}/{{threshold}}). Requests are being rejected.',
    triggerCounters: [{ counter: 'queueDepthPressure', threshold: 6 }],
    applicableTypes: ['api-gateway', 'rate-limiter', 'load-balancer', 'waf', '*'],
  },
  {
    code: 'SEC-002',
    title: 'Authentication Storm',
    category: 'SEC',
    severity: 'high',
    cause: 'Massive spike in authentication requests (possible credential stuffing).',
    impact: 'Auth service overwhelmed; legitimate users unable to log in.',
    recommendation: 'Implement CAPTCHA, progressive delays, IP blocking, and account lockout.',
    narrativeTemplate: '{{nodeLabel}} is under authentication storm (CPU at {{counterValue}}/{{threshold}} with connection surge).',
    triggerCounters: [{ counter: 'cpuThrottleTicks', threshold: 5 }, { counter: 'connectionPoolExhaustion', threshold: 4 }],
    applicableTypes: ['auth-service', 'identity-provider', 'api-gateway', '*'],
  },

  // ---- OBS-001 ----
  {
    code: 'OBS-001',
    title: 'Metric Collection Gap',
    category: 'OBS',
    severity: 'low',
    cause: 'Metrics pipeline unable to collect or ingest data at required rate.',
    impact: 'Blind spots in monitoring; alerts may not fire during incidents.',
    recommendation: 'Scale metrics infrastructure, implement sampling, check agent health.',
    narrativeTemplate: '{{nodeLabel}} has a metric collection gap (queue depth at {{counterValue}}/{{threshold}}). Monitoring has blind spots.',
    triggerCounters: [{ counter: 'queueDepthPressure', threshold: 4 }],
    applicableTypes: ['monitoring', 'logging', 'tracing', 'metrics-server', '*'],
  },
];

// ---------------------------------------------------------------------------
// Inverted index: counter name -> issue types that reference it
// ---------------------------------------------------------------------------

const COUNTER_TO_ISSUES: Map<PressureCounterName, IssueType[]> = new Map();

for (const issue of ISSUE_CATALOG) {
  for (const trigger of issue.triggerCounters) {
    const existing = COUNTER_TO_ISSUES.get(trigger.counter) ?? [];
    existing.push(issue);
    COUNTER_TO_ISSUES.set(trigger.counter, existing);
  }
}

/** Get all issue types that reference a specific counter. */
export function getIssuesForCounter(counter: PressureCounterName): IssueType[] {
  return COUNTER_TO_ISSUES.get(counter) ?? [];
}

// ---------------------------------------------------------------------------
// Issue detection
// ---------------------------------------------------------------------------

/** Fill narrative template with context values. */
function fillTemplate(
  template: string,
  nodeLabel: string,
  counterValue: number,
  threshold: number,
): string {
  return template
    .replace(/\{\{nodeLabel\}\}/g, nodeLabel)
    .replace(/\{\{counterValue\}\}/g, String(counterValue))
    .replace(/\{\{threshold\}\}/g, String(threshold));
}

/**
 * Detect issues for a node based on its current pressure counters and topology.
 *
 * Checks every issue in the catalog to see if all trigger counters exceed
 * their thresholds and the issue applies to this component type.
 *
 * @param nodeId        - The node ID
 * @param nodeLabel     - Human-readable node label
 * @param componentType - The node's component type
 * @param counters      - Current pressure counter values
 * @param _signature    - Topology signature (reserved for future use)
 * @param tick          - Current simulation tick
 * @returns Array of detected issues
 */
export function detectIssues(
  nodeId: string,
  nodeLabel: string,
  componentType: string,
  counters: PressureCounters,
  _signature: TopologySignature,
  tick: number,
): DetectedIssue[] {
  const detected: DetectedIssue[] = [];

  for (const issue of ISSUE_CATALOG) {
    // Check applicable types
    if (!issue.applicableTypes.includes('*') && !issue.applicableTypes.includes(componentType)) {
      continue;
    }

    // Check all trigger counters
    let allTriggered = true;
    let maxCounterValue = 0;
    let maxThreshold = 0;

    for (const trigger of issue.triggerCounters) {
      const value = counters[trigger.counter];
      if (value < trigger.threshold) {
        allTriggered = false;
        break;
      }
      if (value > maxCounterValue) {
        maxCounterValue = value;
        maxThreshold = trigger.threshold;
      }
    }

    if (!allTriggered) continue;

    const narrative = fillTemplate(
      issue.narrativeTemplate,
      nodeLabel,
      maxCounterValue,
      maxThreshold,
    );

    detected.push({
      issueCode: issue.code,
      nodeId,
      nodeLabel,
      severity: issue.severity,
      narrative,
      detectedAtTick: tick,
    });
  }

  return detected;
}
