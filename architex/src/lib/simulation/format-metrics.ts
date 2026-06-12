/**
 * format-metrics — Calm-telemetry display formatters for live sim values
 *
 * Pure helpers that turn raw simulation floats into short, human strings
 * for the in-canvas telemetry layer (SimMetricsBadge, edge chips). The
 * calm-telemetry rule: never show a raw float, and return `null` when a
 * value is noise — "show what's broken, mute what's fine".
 *
 * Band classification reuses the threshold constants behind
 * `threshold-bands.ts` via `classifyMetric` — no duplicated thresholds.
 */

import { classifyMetric } from './threshold-bands';
import type { ThresholdBand } from './threshold-bands';

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const THOUSAND = 1_000;
const MILLION = 1_000_000;

/** "2.0" -> "2" so compact units read clean (2k, not 2.0k). */
function trimTrailingZero(text: string): string {
  return text.endsWith('.0') ? text.slice(0, -2) : text;
}

/**
 * Compact requests-per-second: 42 -> "42", 1240 -> "1.2k", 2_000_000 -> "2M".
 */
export function formatRps(rps: number): string {
  if (!Number.isFinite(rps)) return '—';
  const v = Math.max(0, rps);
  if (v >= MILLION) return `${trimTrailingZero((v / MILLION).toFixed(1))}M`;
  if (v >= THOUSAND) return `${trimTrailingZero((v / THOUSAND).toFixed(1))}k`;
  return String(Math.round(v));
}

/**
 * Compact latency: 12.7 -> "13ms", 1240 -> "1.2s", 0.3 -> "<1ms".
 */
export function formatLatency(ms: number): string {
  if (!Number.isFinite(ms)) return '—';
  const v = Math.max(0, ms);
  if (v >= THOUSAND) return `${trimTrailingZero((v / THOUSAND).toFixed(1))}s`;
  if (v > 0 && v < 0.5) return '<1ms';
  return `${Math.round(v)}ms`;
}

/**
 * Queue depth rounded to an integer. A sub-1 queue is noise (the queuing
 * model emits fractional expected depths like 0.0395) — return null so the
 * UI omits it entirely.
 */
export function formatQueueDepth(depth: number): string | null {
  if (!Number.isFinite(depth)) return null;
  if (depth < 1) return null;
  return String(Math.round(depth));
}

/** Below 0.1% (three-nines success) an error rate is noise, not signal. */
const ERROR_RATE_DISPLAY_MIN = 0.001;

/**
 * Error rate as a percentage with one decimal: 0.012 -> "1.2%".
 * Returns null below 0.1% so healthy nodes show no error text at all.
 */
export function formatErrorRate(rate: number): string | null {
  if (!Number.isFinite(rate)) return null;
  if (rate < ERROR_RATE_DISPLAY_MIN) return null;
  return `${(rate * 100).toFixed(1)}%`;
}

/** Utilization as a whole percentage: 0.239 -> "24%". */
export function formatUtilization(utilization: number): string {
  if (!Number.isFinite(utilization)) return '—';
  return `${Math.round(Math.max(0, utilization) * 100)}%`;
}

// ---------------------------------------------------------------------------
// Band classification (reuses threshold-bands thresholds)
// ---------------------------------------------------------------------------

/** Node-local signals that drive ambient health chrome. */
export interface NodeBandMetrics {
  /** Fraction 0..1 (may exceed 1 under overload). */
  utilization: number;
  /** Fraction 0..1. */
  errorRate: number;
}

const BAND_RANK: Record<ThresholdBand, number> = {
  healthy: 0,
  watch: 1,
  concerning: 2,
  critical: 3,
};

/** Band for a single utilization value (drives the badge's utilization bar). */
export function classifyUtilizationBand(utilization: number): ThresholdBand {
  return classifyMetric('utilization', utilization).band;
}

/**
 * Worst threshold band across a node's local health signals.
 *
 * Deliberately classifies utilization + error rate only: the latency
 * thresholds in threshold-bands are end-to-end UX budgets, and a
 * slow-by-design component (e.g. an LLM gateway) should not glow amber
 * for its configured service time. Queueing distress already surfaces
 * through the utilization band (M/M/1 knee).
 */
export function classifyNodeMetrics(metrics: NodeBandMetrics): ThresholdBand {
  const utilBand = classifyMetric('utilization', metrics.utilization).band;
  const errBand = classifyMetric('errorRate', metrics.errorRate).band;
  return BAND_RANK[errBand] > BAND_RANK[utilBand] ? errBand : utilBand;
}

/**
 * Calm-telemetry color tokens per band: healthy stays muted, watch goes
 * amber, concerning/critical go red. Matches the band names/colors used
 * by the threshold-coaching UI.
 */
export const BAND_COLOR_VAR: Record<ThresholdBand, string> = {
  healthy: 'var(--state-idle)',
  watch: 'var(--state-warning)',
  concerning: 'var(--state-error)',
  critical: 'var(--state-error)',
};
