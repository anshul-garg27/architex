/**
 * Threshold Band Definitions (Threshold Coaching)
 *
 * The data half of the threshold-coaching feature: named bands, the
 * threshold constants that separate them, and per-band explanation copy
 * for every metric kind. Every threshold constant is anchored to a
 * real-world number and carries a one-line source comment.
 *
 * Pure data + formatters; classification and verdict composition live
 * in `threshold-bands.ts`.
 */

// ---------------------------------------------------------------------------
// Core types
// ---------------------------------------------------------------------------

export type ThresholdBand = 'healthy' | 'watch' | 'concerning' | 'critical';

export type MetricKind =
  | 'p50'
  | 'p99'
  | 'errorRate'
  | 'utilization'
  | 'costPerHour'
  | 'throughputVsCapacity';

// ---------------------------------------------------------------------------
// Threshold constants (each anchored to a documented real-world number)
// ---------------------------------------------------------------------------

// p50 median latency (ms)
/** 100ms: Nielsen's "feels instantaneous" limit (Usability Engineering, 1993); Google RAIL response budget. */
export const P50_HEALTHY_MAX_MS = 100;
/** 300ms: Google's latency experiments — +400ms per search measurably reduced usage (Brutlag, 2009). */
export const P50_WATCH_MAX_MS = 300;
/** 1000ms: Nielsen's limit for keeping a user's flow of thought uninterrupted. */
export const P50_CONCERNING_MAX_MS = 1000;

// p99 tail latency (ms)
/** 300ms: common interactive-API p99 SLO (example SLO in the Google SRE Book, ch. 4). */
export const P99_HEALTHY_MAX_MS = 300;
/** 1000ms: 1-in-100 requests breaking the 1s flow-of-thought budget (Dean & Barroso, "The Tail at Scale"). */
export const P99_WATCH_MAX_MS = 1000;
/** 4000ms: approaching default client/LB timeouts (5–10s) where retry storms begin. */
export const P99_CONCERNING_MAX_MS = 4000;

// Error rate (fraction 0..1)
/** 0.1%: three-nines request success, a typical strict availability SLO. */
export const ERROR_HEALTHY_MAX = 0.001;
/** 1%: two-nines; a common error-budget exhaustion line (Google SRE Book error budgets). */
export const ERROR_WATCH_MAX = 0.01;
/** 5%: a typical page-the-on-call alerting threshold for request failure rate. */
export const ERROR_CONCERNING_MAX = 0.05;

// Utilization (fraction 0..1)
/** 60%: below the M/M/1 queueing knee — waiting time still grows roughly linearly. */
export const UTIL_HEALTHY_MAX = 0.6;
/** 75%: SRE guidance keeps serving systems near ~70% to absorb spikes (Google SRE Book, ch. 22). */
export const UTIL_WATCH_MAX = 0.75;
/** 90%: at rho = 0.9 the M/M/1 expected queue is 9x service time — latency explodes. */
export const UTIL_CONCERNING_MAX = 0.9;

// Cost per hour ($/hr)
/** $5/hr ≈ $3.6k/mo: a lean production stack (a few app instances + one managed DB on AWS on-demand). */
export const COST_HEALTHY_MAX = 5;
/** $25/hr ≈ $18k/mo: mid-size product infrastructure spend. */
export const COST_WATCH_MAX = 25;
/** $100/hr ≈ $73k/mo: enterprise-scale burn that demands dedicated capacity planning. */
export const COST_CONCERNING_MAX = 100;

// Throughput vs capacity (delivered fraction of offered load; HIGHER is better)
/** 99.9% delivered: effectively lossless — matches a three-nines request-success SLO. */
export const TVC_HEALTHY_MIN = 0.999;
/** 99% delivered: load shedding has begun; the 1% error-budget line is being spent on drops. */
export const TVC_WATCH_MIN = 0.99;
/** 95% delivered: dropping >1 in 20 requests is a visible outage for someone. */
export const TVC_CONCERNING_MIN = 0.95;

// ---------------------------------------------------------------------------
// Band labels
// ---------------------------------------------------------------------------

export const BAND_LABELS: Record<ThresholdBand, string> = {
  healthy: 'Healthy',
  watch: 'Watch',
  concerning: 'Concerning',
  critical: 'Critical',
};

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

export interface MetricDefinition {
  metricLabel: string;
  /**
   * 'higherIsWorse': boundaries are upper bounds of healthy/watch/concerning.
   * 'lowerIsWorse': boundaries are lower bounds of healthy/watch/concerning.
   */
  direction: 'higherIsWorse' | 'lowerIsWorse';
  boundaries: readonly [number, number, number];
  explanations: Record<ThresholdBand, string>;
  format: (value: number) => string;
}

function formatMs(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export const METRIC_DEFINITIONS: Record<MetricKind, MetricDefinition> = {
  p50: {
    metricLabel: 'p50 latency',
    direction: 'higherIsWorse',
    boundaries: [P50_HEALTHY_MAX_MS, P50_WATCH_MAX_MS, P50_CONCERNING_MAX_MS],
    explanations: {
      healthy: 'The median request feels instantaneous to users.',
      watch: 'The typical request is fast but no longer feels instant.',
      concerning: 'Half of all requests are slow enough that users notice the wait.',
      critical: 'The median request breaks the one-second flow-of-thought budget.',
    },
    format: formatMs,
  },
  p99: {
    metricLabel: 'p99 latency',
    direction: 'higherIsWorse',
    boundaries: [P99_HEALTHY_MAX_MS, P99_WATCH_MAX_MS, P99_CONCERNING_MAX_MS],
    explanations: {
      healthy: 'Even the slowest 1% of requests stay within an interactive SLO.',
      watch: 'The tail is stretching — 1 in 100 requests now feels sluggish.',
      concerning: 'Tail requests exceed one second; fan-out calls will compound this.',
      critical: 'Tail latency is in timeout territory — retries and cascades are imminent.',
    },
    format: formatMs,
  },
  errorRate: {
    metricLabel: 'error rate',
    direction: 'higherIsWorse',
    boundaries: [ERROR_HEALTHY_MAX, ERROR_WATCH_MAX, ERROR_CONCERNING_MAX],
    explanations: {
      healthy: 'Failures are within a strict three-nines success budget.',
      watch: 'The error budget is being spent — failures are above three nines.',
      concerning: 'More than 1 in 100 requests fail; users are seeing errors.',
      critical: 'Failure rate is past the paging threshold — this is an incident.',
    },
    format: formatPct,
  },
  utilization: {
    metricLabel: 'peak utilization',
    direction: 'higherIsWorse',
    boundaries: [UTIL_HEALTHY_MAX, UTIL_WATCH_MAX, UTIL_CONCERNING_MAX],
    explanations: {
      healthy: 'There is comfortable headroom below the queueing knee.',
      watch: 'Headroom is thinning — a traffic spike would start queueing.',
      concerning: 'Past the queueing knee: waiting time grows non-linearly from here.',
      critical: 'Pinned near saturation — queues grow without bound and latency explodes.',
    },
    format: formatPct,
  },
  costPerHour: {
    metricLabel: 'hourly cost',
    direction: 'higherIsWorse',
    boundaries: [COST_HEALTHY_MAX, COST_WATCH_MAX, COST_CONCERNING_MAX],
    explanations: {
      healthy: 'Spend is in lean-production territory.',
      watch: 'Spend is real money now — worth a look at idle replicas.',
      concerning: 'Burn is at a level that deserves a capacity-planning review.',
      critical: 'Enterprise-scale burn — every overprovisioned component is expensive.',
    },
    format: (v) => `$${v.toFixed(2)}/hr`,
  },
  throughputVsCapacity: {
    metricLabel: 'delivered throughput',
    direction: 'lowerIsWorse',
    boundaries: [TVC_HEALTHY_MIN, TVC_WATCH_MIN, TVC_CONCERNING_MIN],
    explanations: {
      healthy: 'The system delivered essentially all of the offered load.',
      watch: 'A sliver of offered traffic is being shed — capacity is at its edge.',
      concerning: 'Noticeable load shedding — some component cannot keep up.',
      critical: 'More than 1 in 20 requests never made it through — the system is saturated.',
    },
    format: formatPct,
  },
};
