/**
 * Narrative Engine (SIM-010)
 *
 * 20 causal narrative templates for human-readable event explanations.
 * Each template has named slots filled from simulation data to produce
 * contextual descriptions of what happened and why.
 */

import type { PressureCounters, PressureCounterName } from './pressure-counters';
import type { TopologySignature } from './topology-signature';
import { ISSUE_CATALOG } from './issue-taxonomy';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A narrative template with named slots for contextual filling. */
export interface NarrativeTemplate {
  /** Unique identifier. */
  id: string;
  /** URL-safe slug. */
  slug: string;
  /** Template string with {{placeholder}} syntax. */
  template: string;
  /** List of required slot names. */
  requiredSlots: string[];
}

/** Context values used to fill narrative templates. */
export interface NarrativeContext {
  nodeLabel: string;
  nodeType: string;
  issueTitle: string;
  issueCode: string;
  severity: string;
  counterName: string;
  counterValue: number;
  threshold: number;
  upstreamLabel?: string;
  downstreamLabel?: string;
  rps?: number;
  latencyMs?: number;
  errorRate?: number;
  utilization?: number;
  tick?: number;
  chaosEvent?: string;
  recommendation?: string;
  propagationSource?: string;
  amplificationFactor?: number;
}

// ---------------------------------------------------------------------------
// 20 Narrative Templates
// ---------------------------------------------------------------------------

export const NARRATIVE_TEMPLATES: NarrativeTemplate[] = [
  {
    id: 'resource-exhaustion',
    slug: 'resource-exhaustion',
    template: '{{nodeLabel}} ({{nodeType}}) is experiencing {{issueTitle}} [{{issueCode}}]. The {{counterName}} counter has reached {{counterValue}} (threshold: {{threshold}}), indicating {{severity}} resource exhaustion. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'nodeType', 'issueTitle', 'issueCode', 'counterName', 'counterValue', 'threshold', 'severity'],
  },
  {
    id: 'dependency-failure',
    slug: 'dependency-failure',
    template: '{{nodeLabel}} cannot reach its dependency {{downstreamLabel}}. Requests are timing out after {{latencyMs}}ms, causing {{issueTitle}} [{{issueCode}}]. Error rate has risen to {{errorRate}}. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'downstreamLabel', 'latencyMs', 'issueTitle', 'issueCode', 'errorRate'],
  },
  {
    id: 'saturation',
    slug: 'saturation',
    template: '{{nodeLabel}} is saturated at {{utilization}} utilization ({{rps}} RPS). {{issueTitle}} [{{issueCode}}] detected: {{counterName}} at {{counterValue}}/{{threshold}}. The node cannot process requests fast enough to drain its queue. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'utilization', 'rps', 'issueTitle', 'issueCode', 'counterName', 'counterValue', 'threshold'],
  },
  {
    id: 'backpressure',
    slug: 'backpressure',
    template: '{{nodeLabel}} is applying backpressure to {{upstreamLabel}}. Queue depth has exceeded safe limits ({{counterName}}: {{counterValue}}/{{threshold}}). Upstream producers are being throttled, which may cascade further. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'upstreamLabel', 'counterName', 'counterValue', 'threshold'],
  },
  {
    id: 'pool-exhaustion',
    slug: 'pool-exhaustion',
    template: '{{nodeLabel}} has exhausted its connection/thread pool ({{counterName}}: {{counterValue}}/{{threshold}}). New requests are rejected with {{issueCode}}. Current latency: {{latencyMs}}ms. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterName', 'counterValue', 'threshold', 'issueCode', 'latencyMs'],
  },
  {
    id: 'retry-amplification',
    slug: 'retry-amplification',
    template: 'A retry storm is amplifying traffic through {{nodeLabel}} by {{amplificationFactor}}x. Original failures at {{propagationSource}} triggered cascading retries, worsening the overload. {{counterName}}: {{counterValue}}/{{threshold}}. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'amplificationFactor', 'propagationSource', 'counterName', 'counterValue', 'threshold'],
  },
  {
    id: 'cascade-failure',
    slug: 'cascade-failure',
    template: 'Cascade failure in progress: {{propagationSource}} failure has propagated to {{nodeLabel}}. {{issueTitle}} [{{issueCode}}] detected with {{severity}} severity. Error rate: {{errorRate}}, latency: {{latencyMs}}ms. {{recommendation}}',
    requiredSlots: ['propagationSource', 'nodeLabel', 'issueTitle', 'issueCode', 'severity', 'errorRate', 'latencyMs'],
  },
  {
    id: 'hot-key',
    slug: 'hot-key',
    template: '{{nodeLabel}} has a hot key problem. Disproportionate traffic is hitting a single shard/partition ({{counterName}}: {{counterValue}}/{{threshold}}). Other shards are underutilized while this one is overwhelmed at {{utilization}} utilization. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterName', 'counterValue', 'threshold', 'utilization'],
  },
  {
    id: 'replication-lag',
    slug: 'replication-lag',
    template: '{{nodeLabel}} replica is falling behind its primary ({{counterName}}: {{counterValue}}/{{threshold}}). Read queries may return stale data. Current replication delay is impacting consistency guarantees. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterName', 'counterValue', 'threshold'],
  },
  {
    id: 'split-brain',
    slug: 'split-brain',
    template: 'CRITICAL: {{nodeLabel}} is in a split-brain state. Network partition has isolated replicas, and both sides are accepting writes. Data divergence is occurring. Immediate intervention required. {{recommendation}}',
    requiredSlots: ['nodeLabel'],
  },
  {
    id: 'thundering-herd',
    slug: 'thundering-herd',
    template: '{{nodeLabel}} is under thundering herd pressure. Mass reconnection of clients is creating a {{rps}} RPS burst ({{amplificationFactor}}x normal). Thread pool at {{counterValue}}/{{threshold}}. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'rps', 'amplificationFactor', 'counterValue', 'threshold'],
  },
  {
    id: 'cold-start',
    slug: 'cold-start',
    template: '{{nodeLabel}} is in cold-start phase. Cache is empty, causing {{counterValue}}/{{threshold}} miss rate pressure. All requests are falling through to the backing store, temporarily amplifying database load by {{amplificationFactor}}x. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterValue', 'threshold', 'amplificationFactor'],
  },
  {
    id: 'gc-pause',
    slug: 'gc-pause',
    template: '{{nodeLabel}} is experiencing GC pause pressure ({{counterName}}: {{counterValue}}/{{threshold}}). Intermittent latency spikes of {{latencyMs}}ms are occurring during garbage collection cycles. P99 latency is elevated. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterName', 'counterValue', 'threshold', 'latencyMs'],
  },
  {
    id: 'deadlock',
    slug: 'deadlock',
    template: '{{nodeLabel}} has detected deadlocks ({{counterValue}} detections, threshold: {{threshold}}). Circular lock dependencies between concurrent transactions are causing aborts and automatic retries. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterValue', 'threshold'],
  },
  {
    id: 'circuit-breaker-open',
    slug: 'circuit-breaker-open',
    template: '{{nodeLabel}} circuit breaker has opened after {{counterValue}} trips (threshold: {{threshold}}). All calls to {{downstreamLabel}} are being short-circuited with fast failures. Service is in degraded mode. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterValue', 'threshold', 'downstreamLabel'],
  },
  {
    id: 'rate-limit-breach',
    slug: 'rate-limit-breach',
    template: '{{nodeLabel}} rate limits are being breached at {{rps}} RPS. Legitimate requests may be rejected alongside abusive traffic. Queue depth: {{counterValue}}/{{threshold}}. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'rps', 'counterValue', 'threshold'],
  },
  {
    id: 'data-skew',
    slug: 'data-skew',
    template: '{{nodeLabel}} has severe data skew. One partition/worker is processing {{amplificationFactor}}x more data than peers. CPU throttle at {{counterValue}}/{{threshold}} while other workers are idle. Overall job time is dominated by the slowest worker. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'amplificationFactor', 'counterValue', 'threshold'],
  },
  {
    id: 'connection-timeout',
    slug: 'connection-timeout',
    template: '{{nodeLabel}} is experiencing connection timeouts to {{downstreamLabel}} ({{counterName}}: {{counterValue}}/{{threshold}}). Threads are blocked waiting for connections, draining the thread pool. Latency: {{latencyMs}}ms. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'downstreamLabel', 'counterName', 'counterValue', 'threshold', 'latencyMs'],
  },
  {
    id: 'dns-failure',
    slug: 'dns-failure',
    template: '{{nodeLabel}} cannot resolve DNS ({{counterValue}} failures, threshold: {{threshold}}). All new outbound connections are impossible. Existing keep-alive connections may still work temporarily. {{recommendation}}',
    requiredSlots: ['nodeLabel', 'counterValue', 'threshold'],
  },
  {
    id: 'chaos-injection',
    slug: 'chaos-injection',
    template: 'Chaos event "{{chaosEvent}}" injected on {{nodeLabel}} ({{nodeType}}). {{issueTitle}} [{{issueCode}}] has been triggered with {{severity}} severity. The system is being tested for resilience. {{recommendation}}',
    requiredSlots: ['chaosEvent', 'nodeLabel', 'nodeType', 'issueTitle', 'issueCode', 'severity'],
  },
];

/** Map from template ID to template for O(1) lookup. */
const TEMPLATE_MAP: ReadonlyMap<string, NarrativeTemplate> = new Map(
  NARRATIVE_TEMPLATES.map((t) => [t.id, t]),
);

// ---------------------------------------------------------------------------
// Issue code to template mapping
// ---------------------------------------------------------------------------

const ISSUE_CODE_TO_TEMPLATE: Record<string, string> = {
  'INFRA-001': 'resource-exhaustion',
  'INFRA-002': 'resource-exhaustion',
  'INFRA-003': 'resource-exhaustion',
  'INFRA-004': 'saturation',
  'INFRA-005': 'pool-exhaustion',
  'INFRA-006': 'pool-exhaustion',
  'INFRA-007': 'pool-exhaustion',
  'INFRA-008': 'gc-pause',
  'INFRA-009': 'resource-exhaustion',
  'INFRA-010': 'resource-exhaustion',
  'INFRA-011': 'cascade-failure',
  'INFRA-012': 'resource-exhaustion',
  'INFRA-013': 'resource-exhaustion',
  'NET-001': 'resource-exhaustion',
  'NET-002': 'dns-failure',
  'NET-003': 'dependency-failure',
  'NET-004': 'connection-timeout',
  'NET-005': 'resource-exhaustion',
  'NET-006': 'saturation',
  'NET-007': 'resource-exhaustion',
  'NET-008': 'resource-exhaustion',
  'DATA-001': 'replication-lag',
  'DATA-002': 'saturation',
  'DATA-003': 'deadlock',
  'DATA-004': 'saturation',
  'DATA-005': 'resource-exhaustion',
  'DATA-006': 'pool-exhaustion',
  'DATA-007': 'saturation',
  'DATA-008': 'resource-exhaustion',
  'QUEUE-001': 'backpressure',
  'QUEUE-002': 'resource-exhaustion',
  'QUEUE-003': 'retry-amplification',
  'QUEUE-004': 'saturation',
  'QUEUE-005': 'backpressure',
  'CACHE-001': 'resource-exhaustion',
  'CACHE-002': 'cold-start',
  'CACHE-003': 'hot-key',
  'CACHE-004': 'resource-exhaustion',
  'CACHE-005': 'cold-start',
  'EXT-001': 'circuit-breaker-open',
  'EXT-002': 'retry-amplification',
  'EXT-003': 'connection-timeout',
  'EXT-004': 'cascade-failure',
  'BATCH-001': 'saturation',
  'BATCH-002': 'resource-exhaustion',
  'BATCH-003': 'data-skew',
  'SCALE-001': 'saturation',
  'SCALE-002': 'thundering-herd',
  'SCALE-003': 'resource-exhaustion',
  'SEC-001': 'rate-limit-breach',
  'SEC-002': 'saturation',
  'OBS-001': 'resource-exhaustion',
};

// ---------------------------------------------------------------------------
// NarrativeEngine
// ---------------------------------------------------------------------------

/**
 * Fills contextual templates to produce human-readable explanations
 * of simulation events.
 */
export class NarrativeEngine {
  /**
   * Fill a specific template by ID with the given context.
   *
   * Replaces all `{{placeholder}}` occurrences with context values.
   * Missing optional slots are replaced with 'unknown'.
   *
   * @param templateId - The template ID to fill
   * @param context    - Context values for slot substitution
   * @returns Filled narrative string
   */
  fill(templateId: string, context: NarrativeContext): string {
    const tmpl = TEMPLATE_MAP.get(templateId);
    if (!tmpl) {
      return `[Unknown template: ${templateId}] ${context.nodeLabel} experienced ${context.issueTitle}`;
    }

    return fillSlots(tmpl.template, context);
  }

  /**
   * Build a narrative from simulation data using issue code mapping.
   *
   * Maps the issue code to the appropriate template, extracts context from
   * the counters and signature, and fills the template.
   *
   * @param issueCode  - The detected issue code (e.g. 'INFRA-001')
   * @param nodeId     - The affected node ID
   * @param counters   - Current pressure counters for the node
   * @param signature  - Topology signature of the node
   * @returns Filled narrative string
   */
  buildFromSimulationData(
    issueCode: string,
    nodeId: string,
    counters: PressureCounters,
    signature: TopologySignature,
  ): string {
    const templateId = ISSUE_CODE_TO_TEMPLATE[issueCode] ?? 'resource-exhaustion';
    const issue = ISSUE_CATALOG.find((i) => i.code === issueCode);

    // Find the highest trigger counter for context
    let maxCounter: PressureCounterName = 'cpuThrottleTicks';
    let maxValue = 0;
    let maxThreshold = 0;

    if (issue) {
      for (const trigger of issue.triggerCounters) {
        const val = counters[trigger.counter];
        if (val > maxValue) {
          maxValue = val;
          maxCounter = trigger.counter;
          maxThreshold = trigger.threshold;
        }
      }
    }

    const context: NarrativeContext = {
      nodeLabel: nodeId,
      nodeType: signature.componentType,
      issueTitle: issue?.title ?? issueCode,
      issueCode,
      severity: issue?.severity ?? 'medium',
      counterName: maxCounter,
      counterValue: maxValue,
      threshold: maxThreshold,
      upstreamLabel: signature.upstreamTypes[0] ?? 'unknown',
      downstreamLabel: signature.downstreamTypes[0] ?? 'unknown',
      recommendation: issue?.recommendation ?? 'Investigate and remediate.',
      propagationSource: signature.upstreamTypes[0] ?? 'unknown',
      amplificationFactor: 1,
    };

    return this.fill(templateId, context);
  }
}

// ---------------------------------------------------------------------------
// Slot filling helper
// ---------------------------------------------------------------------------

function fillSlots(template: string, context: NarrativeContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = (context as unknown as Record<string, unknown>)[key];
    if (value === undefined || value === null) return 'unknown';
    return String(value);
  });
}
