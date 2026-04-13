/**
 * Failure Mode Library (INO-003)
 *
 * Defines 18 failure modes across four categories (Network, Compute,
 * Storage, External). Each mode carries metadata for visualization and
 * simulation: severity, probability, affected component types, cascade
 * rules, and recovery steps.
 *
 * Also provides `simulateCascade` which uses the cascade engine to
 * produce a step-by-step failure propagation sequence.
 */

import type { NodeType } from './chaos-engine';
import type { CascadeStep, TopologyNode, TopologyEdge, CascadeConfig } from './cascade-engine';
import { CascadeEngine } from './cascade-engine';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** High-level failure categories. */
export type FailureCategory = 'network' | 'compute' | 'storage' | 'external';

/** Severity from informational to catastrophic. */
export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical';

/** How failures propagate to downstream nodes. */
export interface CascadeRule {
  /** Probability (0-1) that a downstream node becomes degraded. */
  degradeProbability: number;
  /** Probability (0-1) that a downstream node fails entirely. */
  failProbability: number;
  /** Delay in ms before propagation reaches the next hop. */
  propagationDelayMs: number;
  /** Whether this failure is blocked by a circuit breaker. */
  blockedByCircuitBreaker: boolean;
  /** Whether retries can mask this failure at the immediate consumer. */
  retriesMayMask: boolean;
}

/** A single failure mode definition. */
export interface FailureMode {
  id: string;
  name: string;
  category: FailureCategory;
  description: string;
  /** Node types that can be the origin of this failure. */
  affectedComponents: readonly NodeType[];
  cascadeRules: CascadeRule;
  /** Ordered steps an operator would take to recover. */
  recoverySteps: readonly string[];
  severity: FailureSeverity;
  /** Estimated annual probability (0-1) for realistic systems. */
  probability: number;
}

// ---------------------------------------------------------------------------
// Failure Mode Catalog (18 modes)
// ---------------------------------------------------------------------------

export const FAILURE_MODES: readonly FailureMode[] = [
  // ---- Network (4) ----
  {
    id: 'network-partition',
    name: 'Network Partition',
    category: 'network',
    description:
      'A split-brain event isolating a subset of nodes from the rest of the cluster. Nodes on either side cannot communicate, leading to inconsistency or unavailability depending on CAP trade-offs.',
    affectedComponents: ['api-server', 'database', 'cache', 'queue', 'service'],
    cascadeRules: {
      degradeProbability: 0.9,
      failProbability: 0.6,
      propagationDelayMs: 200,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect partition via heartbeat timeouts',
      'Activate network monitoring alerts',
      'Route traffic to healthy partition',
      'Resolve network issue (switch/router fix)',
      'Reconcile divergent state across partitions',
      'Verify data consistency post-heal',
    ],
    severity: 'critical',
    probability: 0.02,
  },
  {
    id: 'dns-failure',
    name: 'DNS Failure',
    category: 'network',
    description:
      'DNS resolution fails, preventing clients and services from discovering endpoints. Cached DNS entries may keep some traffic flowing temporarily.',
    affectedComponents: ['dns', 'api-server', 'web-server', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.7,
      failProbability: 0.5,
      propagationDelayMs: 500,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect DNS resolution failures',
      'Failover to secondary DNS provider',
      'Flush local DNS caches once resolved',
      'Verify service discovery is functional',
    ],
    severity: 'high',
    probability: 0.05,
  },
  {
    id: 'packet-loss',
    name: 'Packet Loss',
    category: 'network',
    description:
      'Random packet loss (10-30%) causing TCP retransmissions, increased latency, and potential timeouts on long-running requests.',
    affectedComponents: ['load-balancer', 'api-server', 'database', 'cache', 'queue', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.5,
      failProbability: 0.15,
      propagationDelayMs: 300,
      blockedByCircuitBreaker: false,
      retriesMayMask: true,
    },
    recoverySteps: [
      'Identify affected network segment',
      'Check for NIC errors or cable issues',
      'Reroute traffic through alternate paths',
      'Monitor packet loss rates until stable',
    ],
    severity: 'medium',
    probability: 0.08,
  },
  {
    id: 'high-latency',
    name: 'High Latency',
    category: 'network',
    description:
      'Network latency spikes to 500ms+ per hop, causing request timeouts and degraded user experience. Often caused by congestion or misconfigured routing.',
    affectedComponents: ['load-balancer', 'api-server', 'web-server', 'database', 'cache', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.6,
      failProbability: 0.2,
      propagationDelayMs: 1000,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Identify latency source via traceroute',
      'Enable request timeouts and circuit breakers',
      'Scale out to distribute load',
      'Fix routing or congestion issue',
    ],
    severity: 'medium',
    probability: 0.1,
  },

  // ---- Compute (4) ----
  {
    id: 'oom-kill',
    name: 'Out of Memory (OOM)',
    category: 'compute',
    description:
      'Process exceeds memory limits and is killed by the OS OOM killer. The node goes offline until the process is restarted, potentially with cold-start penalties.',
    affectedComponents: ['api-server', 'web-server', 'worker', 'cache', 'service'],
    cascadeRules: {
      degradeProbability: 0.8,
      failProbability: 0.7,
      propagationDelayMs: 100,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect OOM via process monitoring',
      'Auto-restart process with health checks',
      'Investigate memory leak via heap dumps',
      'Tune memory limits or fix leak',
      'Roll out patched version',
    ],
    severity: 'high',
    probability: 0.06,
  },
  {
    id: 'cpu-saturation',
    name: 'CPU Saturation',
    category: 'compute',
    description:
      'CPU utilization exceeds 95%, causing extreme response time degradation. All requests are processed but at 5-10x normal latency.',
    affectedComponents: ['api-server', 'web-server', 'worker', 'database', 'service'],
    cascadeRules: {
      degradeProbability: 0.7,
      failProbability: 0.25,
      propagationDelayMs: 500,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Alert on CPU utilization threshold',
      'Auto-scale horizontally',
      'Shed non-critical traffic',
      'Profile hot code paths',
      'Optimize or cache expensive computations',
    ],
    severity: 'medium',
    probability: 0.12,
  },
  {
    id: 'crash-loop',
    name: 'Crash Loop',
    category: 'compute',
    description:
      'Process repeatedly crashes within seconds of starting (CrashLoopBackOff). Typically caused by a bad deploy, missing config, or corrupted state.',
    affectedComponents: ['api-server', 'web-server', 'worker', 'service'],
    cascadeRules: {
      degradeProbability: 0.85,
      failProbability: 0.8,
      propagationDelayMs: 150,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect crash loop via orchestrator status',
      'Check logs from last successful start',
      'Rollback to previous known-good version',
      'Fix root cause (config, dependency, code)',
      'Deploy fix with canary rollout',
    ],
    severity: 'critical',
    probability: 0.04,
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    category: 'compute',
    description:
      'Two or more threads/transactions hold locks that the other needs, causing indefinite blocking. Affected operations time out after deadlock detection.',
    affectedComponents: ['database', 'api-server', 'service'],
    cascadeRules: {
      degradeProbability: 0.4,
      failProbability: 0.3,
      propagationDelayMs: 2000,
      blockedByCircuitBreaker: false,
      retriesMayMask: true,
    },
    recoverySteps: [
      'Detect via deadlock detection timeout',
      'Abort one of the deadlocked transactions',
      'Retry the aborted transaction',
      'Refactor lock ordering to prevent recurrence',
    ],
    severity: 'medium',
    probability: 0.07,
  },

  // ---- Storage (4) ----
  {
    id: 'disk-full',
    name: 'Disk Full',
    category: 'storage',
    description:
      'Storage volume reaches capacity. Write operations fail, databases may become read-only, and log rotation stops.',
    affectedComponents: ['database', 'storage', 'api-server', 'worker'],
    cascadeRules: {
      degradeProbability: 0.8,
      failProbability: 0.5,
      propagationDelayMs: 100,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Alert on disk usage threshold (>85%)',
      'Delete temporary files and old logs',
      'Expand volume or attach additional storage',
      'Implement log rotation and retention policies',
    ],
    severity: 'high',
    probability: 0.05,
  },
  {
    id: 'data-corruption',
    name: 'Data Corruption',
    category: 'storage',
    description:
      'Silent corruption of stored data due to hardware failure, software bug, or cosmic rays. Detected through checksums or data validation failures.',
    affectedComponents: ['database', 'storage'],
    cascadeRules: {
      degradeProbability: 0.6,
      failProbability: 0.4,
      propagationDelayMs: 5000,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect via checksum validation',
      'Isolate corrupted data segments',
      'Restore from backup or replica',
      'Run full integrity check',
      'Investigate hardware health (SMART, ECC)',
    ],
    severity: 'critical',
    probability: 0.01,
  },
  {
    id: 'slow-io',
    name: 'Slow I/O',
    category: 'storage',
    description:
      'Disk I/O latency increases 10-50x due to hardware degradation, noisy neighbors, or RAID rebuild. All storage operations become bottlenecked.',
    affectedComponents: ['database', 'storage', 'worker'],
    cascadeRules: {
      degradeProbability: 0.65,
      failProbability: 0.2,
      propagationDelayMs: 800,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Identify I/O latency via iostat/sar',
      'Migrate workload to healthy storage',
      'Replace degraded disks',
      'Verify I/O performance post-fix',
    ],
    severity: 'medium',
    probability: 0.09,
  },
  {
    id: 'replication-lag',
    name: 'Replication Lag',
    category: 'storage',
    description:
      'Database replicas fall behind the primary by seconds to minutes. Read replicas return stale data, potentially causing business logic errors.',
    affectedComponents: ['database'],
    cascadeRules: {
      degradeProbability: 0.5,
      failProbability: 0.1,
      propagationDelayMs: 3000,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Monitor replication lag metric',
      'Reduce write throughput if possible',
      'Route reads to primary temporarily',
      'Investigate slow replica (I/O, network)',
      'Rebuild replica from fresh snapshot if needed',
    ],
    severity: 'medium',
    probability: 0.1,
  },

  // ---- External (6) ----
  {
    id: 'third-party-down',
    name: 'Third-Party API Down',
    category: 'external',
    description:
      'An external dependency (payment gateway, email service, etc.) is completely unavailable. All calls return 503 or connection refused.',
    affectedComponents: ['api-server', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.7,
      failProbability: 0.5,
      propagationDelayMs: 200,
      blockedByCircuitBreaker: true,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect via circuit breaker trip',
      'Activate fallback or cached responses',
      'Queue requests for retry when service recovers',
      'Notify users of degraded functionality',
      'Monitor third-party status page',
    ],
    severity: 'high',
    probability: 0.08,
  },
  {
    id: 'rate-limited',
    name: 'Rate Limited',
    category: 'external',
    description:
      'Third-party API returns 429 Too Many Requests. Quota exceeded for the current window; must wait for reset or use exponential backoff.',
    affectedComponents: ['api-server', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.5,
      failProbability: 0.2,
      propagationDelayMs: 300,
      blockedByCircuitBreaker: true,
      retriesMayMask: true,
    },
    recoverySteps: [
      'Detect via 429 response monitoring',
      'Implement exponential backoff with jitter',
      'Queue excess requests',
      'Request quota increase from provider',
      'Cache responses to reduce API call volume',
    ],
    severity: 'medium',
    probability: 0.15,
  },
  {
    id: 'auth-expired',
    name: 'Auth Token Expired',
    category: 'external',
    description:
      'API credentials or OAuth tokens have expired. All authenticated calls fail with 401/403 until credentials are refreshed.',
    affectedComponents: ['api-server', 'gateway', 'service'],
    cascadeRules: {
      degradeProbability: 0.6,
      failProbability: 0.4,
      propagationDelayMs: 100,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect via 401/403 response spike',
      'Trigger automatic token refresh',
      'Rotate credentials if refresh fails',
      'Implement token expiry monitoring',
      'Add pre-emptive token refresh before expiry',
    ],
    severity: 'high',
    probability: 0.06,
  },
  {
    id: 'certificate-expiry',
    name: 'TLS Certificate Expiry',
    category: 'external',
    description:
      'TLS certificate has expired, causing all HTTPS connections to fail with certificate validation errors. Affects both inbound and outbound traffic.',
    affectedComponents: ['load-balancer', 'api-server', 'gateway', 'cdn'],
    cascadeRules: {
      degradeProbability: 0.9,
      failProbability: 0.8,
      propagationDelayMs: 50,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect via TLS handshake failures',
      'Issue emergency certificate renewal',
      'Deploy renewed certificate to all endpoints',
      'Implement certificate expiry monitoring',
      'Set up auto-renewal with Let\'s Encrypt or similar',
    ],
    severity: 'critical',
    probability: 0.03,
  },
  {
    id: 'config-drift',
    name: 'Configuration Drift',
    category: 'external',
    description:
      'Configuration across instances has diverged. Some nodes have incorrect settings, causing inconsistent behavior and intermittent failures.',
    affectedComponents: ['api-server', 'web-server', 'worker', 'service'],
    cascadeRules: {
      degradeProbability: 0.4,
      failProbability: 0.2,
      propagationDelayMs: 1000,
      blockedByCircuitBreaker: false,
      retriesMayMask: true,
    },
    recoverySteps: [
      'Audit configuration across all instances',
      'Identify divergent settings',
      'Push canonical configuration via config management',
      'Rolling restart to apply changes',
      'Implement configuration validation in CI/CD',
    ],
    severity: 'medium',
    probability: 0.1,
  },
  {
    id: 'cloud-region-outage',
    name: 'Cloud Region Outage',
    category: 'external',
    description:
      'An entire cloud region becomes unavailable. All services hosted in that region are down. Requires multi-region failover to recover.',
    affectedComponents: ['api-server', 'database', 'cache', 'queue', 'storage', 'service'],
    cascadeRules: {
      degradeProbability: 0.95,
      failProbability: 0.9,
      propagationDelayMs: 100,
      blockedByCircuitBreaker: false,
      retriesMayMask: false,
    },
    recoverySteps: [
      'Detect via health check failures across region',
      'Trigger DNS failover to secondary region',
      'Promote standby databases in secondary region',
      'Reroute traffic via global load balancer',
      'Monitor recovery and data sync when primary returns',
    ],
    severity: 'critical',
    probability: 0.005,
  },
] as const;

/** Map from failure mode ID to its definition for O(1) lookup. */
const FAILURE_MODE_MAP: ReadonlyMap<string, FailureMode> = new Map(
  FAILURE_MODES.map((m) => [m.id, m]),
);

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/**
 * Look up a failure mode by its ID.
 *
 * @param id - The failure mode ID
 * @returns The FailureMode definition, or undefined if not found
 */
export function getFailureMode(id: string): FailureMode | undefined {
  return FAILURE_MODE_MAP.get(id);
}

/**
 * Get failure modes filtered by category.
 *
 * @param category - The failure category to filter by
 * @returns Array of matching FailureMode definitions
 */
export function getFailureModesByCategory(category: FailureCategory): FailureMode[] {
  return FAILURE_MODES.filter((m) => m.category === category);
}

/**
 * Get all failure categories with their modes grouped.
 *
 * @returns Map of category to failure modes
 */
export function getGroupedFailureModes(): Map<FailureCategory, FailureMode[]> {
  const grouped = new Map<FailureCategory, FailureMode[]>();
  for (const mode of FAILURE_MODES) {
    const list = grouped.get(mode.category) ?? [];
    list.push(mode);
    grouped.set(mode.category, list);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// Cascade simulation bridge
// ---------------------------------------------------------------------------

/**
 * Simulate a failure cascade starting from a specific node.
 *
 * Wraps the CascadeEngine to produce a step-by-step propagation sequence
 * driven by the cascade rules of the selected failure mode.
 *
 * @param mode     - The failure mode to simulate
 * @param nodes    - Topology nodes
 * @param edges    - Topology edges
 * @param startNodeId - The node where the failure originates
 * @param config   - Optional cascade simulation configuration overrides
 * @returns Array of CascadeStep describing the propagation sequence
 */
export function simulateCascade(
  mode: FailureMode,
  nodes: TopologyNode[],
  edges: TopologyEdge[],
  startNodeId: string,
  config?: Partial<CascadeConfig>,
): CascadeStep[] {
  const engine = new CascadeEngine({
    propagationDelayMs: mode.cascadeRules.propagationDelayMs,
    degradeProbability: mode.cascadeRules.degradeProbability,
    failProbability: mode.cascadeRules.failProbability,
    recoveryProbability: config?.recoveryProbability ?? 0.1,
    circuitBreakerEnabled: mode.cascadeRules.blockedByCircuitBreaker,
    retryEnabled: mode.cascadeRules.retriesMayMask,
    maxRetries: config?.maxRetries ?? 3,
    retryDelayMs: config?.retryDelayMs ?? 500,
    timeoutMs: config?.timeoutMs ?? 5000,
    ...config,
  });

  return engine.simulate(nodes, edges, startNodeId, mode);
}
