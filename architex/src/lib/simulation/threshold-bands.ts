/**
 * Threshold Bands (Threshold Coaching)
 *
 * Pure classification of raw simulation metrics into four named bands
 * (healthy / watch / concerning / critical) plus verdict composition:
 * per-metric bands with a one-sentence causal attribution for every
 * non-healthy metric. The UI leads with bands and sentences — raw
 * numbers stay behind a disclosure.
 *
 * Threshold constants and per-band explanation copy live in
 * `threshold-band-definitions.ts` (re-exported here for consumers).
 */

import { ISSUE_CATALOG } from './issue-taxonomy';
import type { DetectedIssue, IssueType } from './issue-taxonomy';
import {
  BAND_LABELS,
  METRIC_DEFINITIONS,
  UTIL_CONCERNING_MAX,
} from './threshold-band-definitions';
import type {
  MetricDefinition,
  MetricKind,
  ThresholdBand,
} from './threshold-band-definitions';

export type { MetricKind, ThresholdBand } from './threshold-band-definitions';
export {
  BAND_LABELS,
  METRIC_DEFINITIONS,
} from './threshold-band-definitions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IssueSeverity = DetectedIssue['severity'];

export interface BandClassification {
  kind: MetricKind;
  band: ThresholdBand;
  /** Display name of the band, e.g. "Watch". */
  label: string;
  /** One-sentence explanation of what this band means for this metric. */
  explanation: string;
}

export interface VerdictIssueInput {
  issueCode: string;
  nodeLabel: string;
  severity: IssueSeverity;
  /** Engine-authored narrative (preferred source of causal copy). */
  narrative?: string;
}

export interface VerdictRunMetrics {
  p50LatencyMs: number;
  p99LatencyMs: number;
  /** Fraction 0..1. */
  errorRate: number;
  /** Peak node utilization across the run, fraction 0..1. */
  peakUtilization?: number;
  /** Label of the most utilized node, used for fallback attribution. */
  bottleneckLabel?: string;
  /** Live hourly cost in $/hr. */
  costPerHour?: number;
  /** Delivered throughput as a fraction of offered load (higher is better). */
  deliveredRatio?: number;
}

export interface MetricVerdict extends BandClassification {
  metricLabel: string;
  rawValue: number;
  formattedValue: string;
  /** One causal sentence; null when the metric is healthy. */
  causalSentence: string | null;
}

export interface RunVerdict {
  worstBand: ThresholdBand;
  /** One-sentence overall verdict, senior-engineer voice. */
  headline: string;
  metrics: MetricVerdict[];
}

export interface ConsoleLikeMessage {
  level: string;
  message: string;
}

// ---------------------------------------------------------------------------
// classifyMetric
// ---------------------------------------------------------------------------

/**
 * Classify a raw metric value into a named band.
 * Non-finite values are treated as the worst band (the simulator clamps
 * runaway latencies, but external callers may not).
 */
export function classifyMetric(kind: MetricKind, value: number): BandClassification {
  const def = METRIC_DEFINITIONS[kind];
  const band = resolveBand(def, value);
  return {
    kind,
    band,
    label: BAND_LABELS[band],
    explanation: def.explanations[band],
  };
}

function resolveBand(def: MetricDefinition, value: number): ThresholdBand {
  if (!Number.isFinite(value)) return 'critical';
  const [a, b, c] = def.boundaries;
  const v = Math.max(0, value);
  if (def.direction === 'higherIsWorse') {
    if (v < a) return 'healthy';
    if (v < b) return 'watch';
    if (v < c) return 'concerning';
    return 'critical';
  }
  // lowerIsWorse: boundaries are lower bounds of healthy/watch/concerning.
  if (v >= a) return 'healthy';
  if (v >= b) return 'watch';
  if (v >= c) return 'concerning';
  return 'critical';
}

// ---------------------------------------------------------------------------
// Causal attribution
// ---------------------------------------------------------------------------

const CATALOG_BY_CODE: ReadonlyMap<string, IssueType> = new Map(
  ISSUE_CATALOG.map((t) => [t.code, t]),
);

const SEVERITY_RANK: Record<IssueSeverity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

/** Issue categories most likely to explain each metric, in preference order. */
const METRIC_ISSUE_CATEGORIES: Record<MetricKind, readonly string[]> = {
  p50: ['DATA', 'CACHE', 'INFRA', 'NET', 'QUEUE'],
  p99: ['INFRA', 'DATA', 'QUEUE', 'NET', 'CACHE', 'EXT'],
  errorRate: ['EXT', 'SEC', 'INFRA', 'DATA', 'NET', 'SCALE'],
  utilization: ['INFRA', 'SCALE', 'QUEUE', 'BATCH'],
  costPerHour: ['SCALE', 'INFRA'],
  throughputVsCapacity: ['SCALE', 'INFRA', 'QUEUE', 'NET'],
};

function issueCategory(issueCode: string): string {
  const dash = issueCode.indexOf('-');
  return dash > 0 ? issueCode.slice(0, dash) : issueCode;
}

/**
 * Pick the most explanatory issue for a metric: first matching category in
 * preference order, then highest severity, then most frequent code.
 */
function pickIssueForMetric(
  kind: MetricKind,
  issues: readonly VerdictIssueInput[],
): VerdictIssueInput | null {
  const categories = METRIC_ISSUE_CATEGORIES[kind];
  for (const category of categories) {
    const matches = issues.filter((i) => issueCategory(i.issueCode) === category);
    if (matches.length === 0) continue;

    const frequency = new Map<string, number>();
    for (const m of matches) {
      frequency.set(m.issueCode, (frequency.get(m.issueCode) ?? 0) + 1);
    }
    const sorted = [...matches].sort((x, y) => {
      const bySeverity = SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity];
      if (bySeverity !== 0) return bySeverity;
      return (frequency.get(y.issueCode) ?? 0) - (frequency.get(x.issueCode) ?? 0);
    });
    return sorted[0];
  }
  return null;
}

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) return trimmed;
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

/** Causal sentence from a detected issue: prefer the engine narrative, fall back to catalog copy. */
function issueCausalSentence(issue: VerdictIssueInput): string | null {
  if (issue.narrative && issue.narrative.trim().length > 0) {
    return ensureSentence(issue.narrative);
  }
  const catalogEntry = CATALOG_BY_CODE.get(issue.issueCode);
  if (catalogEntry) {
    return ensureSentence(`${catalogEntry.title} on ${issue.nodeLabel} — ${catalogEntry.cause}`);
  }
  return null;
}

/** Generic-but-specific fallback when no detected issue explains the metric. */
function genericCausalSentence(
  kind: MetricKind,
  band: ThresholdBand,
  rm: VerdictRunMetrics,
): string {
  const bottleneck = rm.bottleneckLabel ?? 'the busiest component';
  const utilPct =
    rm.peakUtilization !== undefined
      ? Math.round(Math.min(rm.peakUtilization, 1) * 100)
      : null;
  const utilPinned =
    rm.peakUtilization !== undefined && rm.peakUtilization >= UTIL_CONCERNING_MAX;

  switch (kind) {
    case 'p99':
      if (utilPinned && utilPct !== null) {
        return `p99 went ${band} while ${bottleneck} utilization pinned at ${utilPct}% — ${bottleneck} is the bottleneck.`;
      }
      return `The slowest 1% of requests stretched into the ${band} band — look for queueing just upstream of ${bottleneck}.`;
    case 'p50':
      if (utilPinned && utilPct !== null) {
        return `Median latency is ${band} because ${bottleneck} sat at ${utilPct}% utilization — every request waits in its queue.`;
      }
      return `Median latency drifted into the ${band} band — a slow dependency is on the hot path of every request.`;
    case 'errorRate':
      if (utilPinned && utilPct !== null) {
        return `Errors climbed into the ${band} band with ${bottleneck} at ${utilPct}% utilization — saturation-induced timeouts, not bugs.`;
      }
      return `Errors climbed into the ${band} band with no single failing dependency — suspect timeouts at ${bottleneck}.`;
    case 'utilization':
      return `${bottleneck} ran past the queueing knee — beyond ~75% utilization, every extra request waits longer than it works.`;
    case 'costPerHour':
      return `Spend landed in the ${band} band — replica counts and storage, not traffic, drive most of this bill.`;
    case 'throughputVsCapacity':
      return `Offered load exceeded what ${bottleneck} could serve — requests above its capacity were shed.`;
  }
}

// ---------------------------------------------------------------------------
// buildVerdict
// ---------------------------------------------------------------------------

const BAND_RANK: Record<ThresholdBand, number> = {
  healthy: 0,
  watch: 1,
  concerning: 2,
  critical: 3,
};

/** Display/priority order: most user-impacting first. */
const METRIC_PRIORITY: readonly MetricKind[] = [
  'errorRate',
  'p99',
  'throughputVsCapacity',
  'utilization',
  'p50',
  'costPerHour',
];

const HEADLINES: Record<ThresholdBand, (metricLabel: string) => string> = {
  healthy: () => 'Clean run — every signal stayed in the healthy band.',
  watch: (l) => `Holding up, but ${l} is drifting — watch it before it trends worse.`,
  concerning: (l) => `Under strain — ${l} is in the concerning band and needs attention.`,
  critical: (l) => `Not production-ready — ${l} went critical during this run.`,
};

/**
 * Compose the post-run verdict: per-metric bands plus one causal sentence
 * for every non-healthy metric. Prefers engine-detected issue narratives,
 * then issue-catalog copy, then generic-but-specific fallback copy.
 */
export function buildVerdict(
  runMetrics: VerdictRunMetrics,
  detectedIssues: readonly VerdictIssueInput[],
): RunVerdict {
  const values: Partial<Record<MetricKind, number>> = {
    p50: runMetrics.p50LatencyMs,
    p99: runMetrics.p99LatencyMs,
    errorRate: runMetrics.errorRate,
    utilization: runMetrics.peakUtilization,
    costPerHour: runMetrics.costPerHour,
    throughputVsCapacity: runMetrics.deliveredRatio,
  };

  const metrics: MetricVerdict[] = [];
  for (const kind of METRIC_PRIORITY) {
    const rawValue = values[kind];
    if (rawValue === undefined) continue;

    const def = METRIC_DEFINITIONS[kind];
    const classification = classifyMetric(kind, rawValue);

    let causalSentence: string | null = null;
    if (classification.band !== 'healthy') {
      const issue = pickIssueForMetric(kind, detectedIssues);
      causalSentence =
        (issue ? issueCausalSentence(issue) : null) ??
        genericCausalSentence(kind, classification.band, runMetrics);
    }

    metrics.push({
      ...classification,
      metricLabel: def.metricLabel,
      rawValue,
      formattedValue: def.format(Number.isFinite(rawValue) ? rawValue : 0),
      causalSentence,
    });
  }

  // Worst metric: highest band rank wins; ties resolve by priority order.
  let worst: MetricVerdict | null = null;
  for (const m of metrics) {
    if (worst === null || BAND_RANK[m.band] > BAND_RANK[worst.band]) {
      worst = m;
    }
  }

  const worstBand: ThresholdBand = worst?.band ?? 'healthy';
  const headline = HEADLINES[worstBand](worst?.metricLabel ?? '');

  return { worstBand, headline, metrics };
}

// ---------------------------------------------------------------------------
// Console narrative extraction
// ---------------------------------------------------------------------------

/** Matches the orchestrator's issue log line: `[INFRA-001] Node Label: narrative…` */
const ISSUE_LOG_PATTERN = /^\[([A-Z]+-\d+)\]\s+(.+?):\s+(.+)$/;

/**
 * Recover engine-authored issue narratives from the console message stream
 * (the orchestrator logs `[CODE] label: narrative` for critical/high issues).
 * Returns a map of issueCode -> narrative; first occurrence wins.
 */
export function extractIssueNarratives(
  messages: readonly ConsoleLikeMessage[],
): Map<string, string> {
  const narratives = new Map<string, string>();
  for (const msg of messages) {
    if (msg.level !== 'error') continue;
    const match = ISSUE_LOG_PATTERN.exec(msg.message);
    if (!match) continue;
    const [, code, , narrative] = match;
    if (!narratives.has(code)) {
      narratives.set(code, narrative);
    }
  }
  return narratives;
}
