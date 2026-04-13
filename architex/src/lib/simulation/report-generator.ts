/**
 * Report Generator (SIM-005)
 *
 * Produces a structured post-simulation analysis from tick history,
 * including incident timeline, root cause analysis, and cost impact.
 * Outputs both typed data and GitHub-flavored markdown.
 */

import type { Node, Edge } from '@xyflow/react';
import type { CostModelInput } from './cost-model';
import { computeNodeCost, computeTopologyCost } from './cost-model';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Per-tick record collected during simulation. */
export interface TickRecord {
  tick: number;
  timestampMs: number;
  rpsAtTick: number;
  globalErrorRate: number;
  avgLatencyMs: number;
  p99LatencyMs: number;
  nodeEvents: { nodeId: string; issueCode: string; severity: string }[];
}

/** Chaos log entry for the report. */
export interface ChaosLogEntry {
  tick: number;
  eventTypeId: string;
  targetNodeIds: string[];
}

/** Per-node simulation metrics for the report. */
export interface NodeSimMetrics {
  avgUtilization: number;
  peakUtilization: number;
  totalIssues: number;
  issueCodes: string[];
}

/** Structured simulation report. */
export interface SimulationReport {
  summary: {
    totalTicks: number;
    durationMs: number;
    peakRps: number;
    peakErrorRate: number;
    peakLatencyMs: number;
    totalIncidents: number;
    availabilityPercent: number;
  };
  incidentTimeline: {
    tick: number;
    timestamp: string;
    issueCode: string;
    nodeLabel: string;
    severity: string;
    narrative: string;
  }[];
  nodeBreakdown: {
    nodeId: string;
    nodeLabel: string;
    avgUtilization: number;
    peakUtilization: number;
    issueCount: number;
    topIssues: string[];
  }[];
  rootCauses: {
    issueCode: string;
    narrative: string;
    affectedNodes: string[];
    propagationChain: string[];
  }[];
  costImpact: {
    estimatedHourlyCost: number;
    projectedMonthlyCost: number;
    costByComponent: { nodeLabel: string; hourlyCost: number }[];
  };
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeLabel(node: Node): string {
  const data = node.data as Record<string, unknown> | undefined;
  return (data?.label as string) ?? (data?.componentType as string) ?? node.id;
}

function getComponentType(node: Node): string {
  const data = node.data as Record<string, unknown> | undefined;
  return (data?.componentType as string) ?? 'unknown';
}

function getNodeConfig(node: Node): Record<string, unknown> {
  const data = node.data as Record<string, unknown> | undefined;
  return (data?.config ?? {}) as Record<string, unknown>;
}

function formatTimestamp(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const frac = Math.floor((ms % 1000) / 100);
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${frac}`;
}

// ---------------------------------------------------------------------------
// Report Generation
// ---------------------------------------------------------------------------

/**
 * Generate a structured simulation report from tick history.
 *
 * @param tickHistory - Array of TickRecord from the simulation run
 * @param nodes       - Canvas nodes at the end of simulation
 * @param edges       - Canvas edges
 * @param metrics     - Per-node simulation metrics
 * @param chaosLog    - Log of chaos events injected during the run
 * @returns Structured SimulationReport
 */
export function generateReport(
  tickHistory: TickRecord[],
  nodes: Node[],
  edges: Edge[],
  metrics: Map<string, NodeSimMetrics>,
  chaosLog: ChaosLogEntry[],
): SimulationReport {
  // -- Summary --
  let peakRps = 0;
  let peakErrorRate = 0;
  let peakLatencyMs = 0;
  let totalIncidents = 0;
  let healthyTicks = 0;

  for (const tick of tickHistory) {
    if (tick.rpsAtTick > peakRps) peakRps = tick.rpsAtTick;
    if (tick.globalErrorRate > peakErrorRate) peakErrorRate = tick.globalErrorRate;
    if (tick.p99LatencyMs > peakLatencyMs) peakLatencyMs = tick.p99LatencyMs;
    totalIncidents += tick.nodeEvents.length;
    if (tick.globalErrorRate < 0.01) healthyTicks++;
  }

  const totalTicks = tickHistory.length;
  const durationMs = totalTicks > 0 ? tickHistory[totalTicks - 1].timestampMs : 0;
  const availabilityPercent = totalTicks > 0
    ? (healthyTicks / totalTicks) * 100
    : 100;

  // -- Incident Timeline --
  const incidentTimeline: SimulationReport['incidentTimeline'] = [];
  for (const tick of tickHistory) {
    for (const evt of tick.nodeEvents) {
      const node = nodes.find((n) => n.id === evt.nodeId);
      const label = node ? getNodeLabel(node) : evt.nodeId;
      incidentTimeline.push({
        tick: tick.tick,
        timestamp: formatTimestamp(tick.timestampMs),
        issueCode: evt.issueCode,
        nodeLabel: label,
        severity: evt.severity,
        narrative: `${label}: ${evt.issueCode} (${evt.severity})`,
      });
    }
  }
  incidentTimeline.sort((a, b) => a.tick - b.tick);

  // -- Node Breakdown --
  const nodeBreakdown: SimulationReport['nodeBreakdown'] = [];
  for (const node of nodes) {
    const m = metrics.get(node.id);
    nodeBreakdown.push({
      nodeId: node.id,
      nodeLabel: getNodeLabel(node),
      avgUtilization: m?.avgUtilization ?? 0,
      peakUtilization: m?.peakUtilization ?? 0,
      issueCount: m?.totalIssues ?? 0,
      topIssues: m?.issueCodes.slice(0, 5) ?? [],
    });
  }
  nodeBreakdown.sort((a, b) => b.issueCount - a.issueCount);

  // -- Root Causes --
  const issueNodeMap = new Map<string, Set<string>>();
  for (const tick of tickHistory) {
    for (const evt of tick.nodeEvents) {
      if (!issueNodeMap.has(evt.issueCode)) {
        issueNodeMap.set(evt.issueCode, new Set());
      }
      issueNodeMap.get(evt.issueCode)!.add(evt.nodeId);
    }
  }

  // Build adjacency for propagation chain tracing
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    const list = adj.get(edge.source) ?? [];
    list.push(edge.target);
    adj.set(edge.source, list);
  }

  const rootCauses: SimulationReport['rootCauses'] = [];
  for (const [issueCode, nodeIds] of issueNodeMap) {
    const affectedNodes = Array.from(nodeIds);
    // Trace propagation chain from affected nodes
    const chain: string[] = [];
    const visited = new Set<string>();
    const queue = [...affectedNodes];
    while (queue.length > 0) {
      const nid = queue.shift()!;
      if (visited.has(nid)) continue;
      visited.add(nid);
      const node = nodes.find((n) => n.id === nid);
      if (node) chain.push(getNodeLabel(node));
      const downstream = adj.get(nid) ?? [];
      for (const d of downstream) {
        if (!visited.has(d)) queue.push(d);
      }
    }

    rootCauses.push({
      issueCode,
      narrative: `${issueCode} affected ${affectedNodes.length} node(s) and propagated through ${chain.length} components.`,
      affectedNodes: affectedNodes.map((id) => {
        const n = nodes.find((nd) => nd.id === id);
        return n ? getNodeLabel(n) : id;
      }),
      propagationChain: chain,
    });
  }
  rootCauses.sort((a, b) => b.affectedNodes.length - a.affectedNodes.length);

  // -- Cost Impact --
  const costInputs: CostModelInput[] = nodes.map((node) => {
    const config = getNodeConfig(node);
    return {
      componentType: getComponentType(node),
      replicas: typeof config.replicas === 'number' ? config.replicas : 1,
      shards: typeof config.shards === 'number' ? config.shards : 1,
      storageGb: typeof config.storageGb === 'number' ? config.storageGb : 0,
      transferGbPerHour: typeof config.transferGbPerHour === 'number' ? config.transferGbPerHour : 0,
      utilization: metrics.get(node.id)?.avgUtilization ?? 0.3,
    };
  });

  const topologyCost = computeTopologyCost(costInputs);
  const costByComponent: { nodeLabel: string; hourlyCost: number }[] = nodes.map((node, i) => ({
    nodeLabel: getNodeLabel(node),
    hourlyCost: computeNodeCost(costInputs[i]).totalPerHour,
  }));
  costByComponent.sort((a, b) => b.hourlyCost - a.hourlyCost);

  // -- Recommendations --
  const recommendations: string[] = [];
  const issueSet = new Set(issueNodeMap.keys());

  if (issueSet.has('INFRA-001') || issueSet.has('INFRA-002')) {
    recommendations.push('Scale compute resources: add replicas or upgrade instance types for CPU/memory-constrained nodes.');
  }
  if (issueSet.has('INFRA-006') || issueSet.has('DATA-006')) {
    recommendations.push('Increase connection pool sizes or add a connection proxy (e.g., PgBouncer) for database-connected services.');
  }
  if (issueSet.has('CACHE-001') || issueSet.has('CACHE-002')) {
    recommendations.push('Review cache sizing and TTL strategy. Implement cache warming and staggered expiration.');
  }
  if (issueSet.has('QUEUE-001') || issueSet.has('QUEUE-004')) {
    recommendations.push('Scale message consumers or implement backpressure mechanisms to prevent queue overflow.');
  }
  if (issueSet.has('EXT-001') || issueSet.has('EXT-002')) {
    recommendations.push('Implement circuit breakers with exponential backoff and retry budgets to prevent retry storms.');
  }
  if (issueSet.has('DATA-001')) {
    recommendations.push('Address replication lag by optimizing write workload or upgrading replica network connectivity.');
  }
  if (peakErrorRate > 0.1) {
    recommendations.push(`Peak error rate was ${(peakErrorRate * 100).toFixed(1)}%. Investigate root cause and implement graceful degradation.`);
  }
  if (chaosLog.length > 0) {
    recommendations.push(`${chaosLog.length} chaos event(s) were injected. Review system resilience to: ${[...new Set(chaosLog.map((c) => c.eventTypeId))].join(', ')}.`);
  }
  if (recommendations.length === 0) {
    recommendations.push('No significant issues detected. System performed within acceptable parameters.');
  }

  return {
    summary: {
      totalTicks,
      durationMs,
      peakRps,
      peakErrorRate,
      peakLatencyMs,
      totalIncidents,
      availabilityPercent,
    },
    incidentTimeline,
    nodeBreakdown,
    rootCauses,
    costImpact: {
      estimatedHourlyCost: topologyCost.totalPerHour,
      projectedMonthlyCost: topologyCost.totalPerMonth,
      costByComponent,
    },
    recommendations,
  };
}

// ---------------------------------------------------------------------------
// Markdown Rendering
// ---------------------------------------------------------------------------

/**
 * Convert a SimulationReport to GitHub-flavored markdown.
 *
 * @param report - The structured simulation report
 * @returns Markdown string
 */
export function reportToMarkdown(report: SimulationReport): string {
  const lines: string[] = [];
  const { summary } = report;

  // -- Executive Summary --
  lines.push('# Simulation Report');
  lines.push('');
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Total Ticks | ${summary.totalTicks} |`);
  lines.push(`| Duration | ${formatTimestamp(summary.durationMs)} |`);
  lines.push(`| Peak RPS | ${summary.peakRps.toFixed(1)} |`);
  lines.push(`| Peak Error Rate | ${(summary.peakErrorRate * 100).toFixed(2)}% |`);
  lines.push(`| Peak Latency (P99) | ${summary.peakLatencyMs.toFixed(1)}ms |`);
  lines.push(`| Total Incidents | ${summary.totalIncidents} |`);
  lines.push(`| Availability | ${summary.availabilityPercent.toFixed(2)}% |`);
  lines.push('');

  // -- Incident Timeline --
  lines.push('## Incident Timeline');
  lines.push('');
  if (report.incidentTimeline.length === 0) {
    lines.push('No incidents detected during this simulation run.');
  } else {
    lines.push('| Tick | Time | Node | Issue | Severity |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const evt of report.incidentTimeline.slice(0, 50)) {
      lines.push(`| ${evt.tick} | ${evt.timestamp} | ${evt.nodeLabel} | ${evt.issueCode} | ${evt.severity} |`);
    }
    if (report.incidentTimeline.length > 50) {
      lines.push(`| ... | ... | ... | ... | _${report.incidentTimeline.length - 50} more_ |`);
    }
  }
  lines.push('');

  // -- Per-Component Analysis --
  lines.push('## Per-Component Analysis');
  lines.push('');
  lines.push('| Node | Avg Util | Peak Util | Issues | Top Problems |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const node of report.nodeBreakdown.slice(0, 20)) {
    const topIssues = node.topIssues.length > 0 ? node.topIssues.join(', ') : '-';
    lines.push(`| ${node.nodeLabel} | ${(node.avgUtilization * 100).toFixed(1)}% | ${(node.peakUtilization * 100).toFixed(1)}% | ${node.issueCount} | ${topIssues} |`);
  }
  lines.push('');

  // -- Root Cause Analysis --
  lines.push('## Root Cause Analysis');
  lines.push('');
  if (report.rootCauses.length === 0) {
    lines.push('No root causes identified.');
  } else {
    for (const rc of report.rootCauses.slice(0, 10)) {
      lines.push(`### ${rc.issueCode}`);
      lines.push('');
      lines.push(rc.narrative);
      lines.push('');
      lines.push(`**Affected nodes:** ${rc.affectedNodes.join(', ')}`);
      lines.push('');
      if (rc.propagationChain.length > 1) {
        lines.push(`**Propagation chain:** ${rc.propagationChain.join(' -> ')}`);
        lines.push('');
      }
    }
  }

  // -- Cost Impact --
  lines.push('## Cost Impact');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`| --- | --- |`);
  lines.push(`| Estimated Hourly Cost | $${report.costImpact.estimatedHourlyCost.toFixed(2)} |`);
  lines.push(`| Projected Monthly Cost | $${report.costImpact.projectedMonthlyCost.toFixed(2)} |`);
  lines.push('');
  lines.push('| Component | Hourly Cost |');
  lines.push('| --- | --- |');
  for (const comp of report.costImpact.costByComponent.slice(0, 10)) {
    lines.push(`| ${comp.nodeLabel} | $${comp.hourlyCost.toFixed(4)} |`);
  }
  lines.push('');

  // -- Recommendations --
  lines.push('## Recommendations');
  lines.push('');
  for (let i = 0; i < report.recommendations.length; i++) {
    lines.push(`${i + 1}. ${report.recommendations[i]}`);
  }
  lines.push('');

  return lines.join('\n');
}
