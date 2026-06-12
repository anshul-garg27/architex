import { describe, it, expect } from 'vitest';
import {
  formatRps,
  formatLatency,
  formatQueueDepth,
  formatErrorRate,
  formatUtilization,
  classifyUtilizationBand,
  classifyNodeMetrics,
  BAND_COLOR_VAR,
} from '../format-metrics';
import {
  UTIL_HEALTHY_MAX,
  UTIL_WATCH_MAX,
  UTIL_CONCERNING_MAX,
  ERROR_CONCERNING_MAX,
} from '../threshold-band-definitions';

// ---------------------------------------------------------------------------
// formatRps
// ---------------------------------------------------------------------------

describe('formatRps', () => {
  it('rounds small values to integers', () => {
    expect(formatRps(42.4)).toBe('42');
    expect(formatRps(0)).toBe('0');
    expect(formatRps(999.4)).toBe('999');
  });

  it('compacts thousands with a lowercase k', () => {
    expect(formatRps(1240)).toBe('1.2k');
    expect(formatRps(1000)).toBe('1k');
    expect(formatRps(2000)).toBe('2k');
    expect(formatRps(15_600)).toBe('15.6k');
  });

  it('compacts millions with M', () => {
    expect(formatRps(1_500_000)).toBe('1.5M');
    expect(formatRps(2_000_000)).toBe('2M');
  });

  it('clamps negatives to zero and dashes non-finite input', () => {
    expect(formatRps(-5)).toBe('0');
    expect(formatRps(Number.NaN)).toBe('—');
    expect(formatRps(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// formatLatency
// ---------------------------------------------------------------------------

describe('formatLatency', () => {
  it('rounds millisecond values', () => {
    expect(formatLatency(12.7)).toBe('13ms');
    expect(formatLatency(5)).toBe('5ms');
    expect(formatLatency(0)).toBe('0ms');
  });

  it('shows "<1ms" for tiny non-zero values instead of a raw float', () => {
    expect(formatLatency(0.3)).toBe('<1ms');
    expect(formatLatency(0.49)).toBe('<1ms');
  });

  it('switches to seconds at 1000ms', () => {
    expect(formatLatency(1240)).toBe('1.2s');
    expect(formatLatency(1000)).toBe('1s');
    expect(formatLatency(2000)).toBe('2s');
  });

  it('handles invalid input', () => {
    expect(formatLatency(Number.NaN)).toBe('—');
    expect(formatLatency(-10)).toBe('0ms');
  });
});

// ---------------------------------------------------------------------------
// formatQueueDepth
// ---------------------------------------------------------------------------

describe('formatQueueDepth', () => {
  it('returns null for sub-1 queues (fractional expected depth is noise)', () => {
    expect(formatQueueDepth(0)).toBeNull();
    expect(formatQueueDepth(0.0395)).toBeNull();
    expect(formatQueueDepth(0.99)).toBeNull();
  });

  it('rounds real queues to integers', () => {
    expect(formatQueueDepth(1)).toBe('1');
    expect(formatQueueDepth(1.6)).toBe('2');
    expect(formatQueueDepth(14.2)).toBe('14');
  });

  it('returns null for non-finite input', () => {
    expect(formatQueueDepth(Number.NaN)).toBeNull();
    expect(formatQueueDepth(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatErrorRate
// ---------------------------------------------------------------------------

describe('formatErrorRate', () => {
  it('returns null below 0.1% (healthy noise)', () => {
    expect(formatErrorRate(0)).toBeNull();
    expect(formatErrorRate(0.0005)).toBeNull();
  });

  it('formats visible error rates with one decimal', () => {
    expect(formatErrorRate(0.001)).toBe('0.1%');
    expect(formatErrorRate(0.012)).toBe('1.2%');
    expect(formatErrorRate(0.5)).toBe('50.0%');
  });

  it('returns null for non-finite input', () => {
    expect(formatErrorRate(Number.NaN)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// formatUtilization
// ---------------------------------------------------------------------------

describe('formatUtilization', () => {
  it('renders whole percentages', () => {
    expect(formatUtilization(0.239)).toBe('24%');
    expect(formatUtilization(0)).toBe('0%');
    expect(formatUtilization(1)).toBe('100%');
  });

  it('does not clamp overload above 100%', () => {
    expect(formatUtilization(1.2)).toBe('120%');
  });

  it('clamps negatives and dashes non-finite input', () => {
    expect(formatUtilization(-0.2)).toBe('0%');
    expect(formatUtilization(Number.NaN)).toBe('—');
  });
});

// ---------------------------------------------------------------------------
// classifyUtilizationBand (delegates to threshold-bands constants)
// ---------------------------------------------------------------------------

describe('classifyUtilizationBand', () => {
  it('matches the published utilization boundaries', () => {
    expect(classifyUtilizationBand(UTIL_HEALTHY_MAX - 0.01)).toBe('healthy');
    expect(classifyUtilizationBand(UTIL_HEALTHY_MAX)).toBe('watch');
    expect(classifyUtilizationBand(UTIL_WATCH_MAX)).toBe('concerning');
    expect(classifyUtilizationBand(UTIL_CONCERNING_MAX)).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// classifyNodeMetrics
// ---------------------------------------------------------------------------

describe('classifyNodeMetrics', () => {
  it('is healthy when both signals are low', () => {
    expect(classifyNodeMetrics({ utilization: 0.3, errorRate: 0 })).toBe('healthy');
  });

  it('tracks the utilization band when errors are quiet', () => {
    expect(classifyNodeMetrics({ utilization: 0.7, errorRate: 0 })).toBe('watch');
    expect(classifyNodeMetrics({ utilization: 0.8, errorRate: 0 })).toBe('concerning');
    expect(classifyNodeMetrics({ utilization: 0.95, errorRate: 0 })).toBe('critical');
  });

  it('takes the worst of the two signals', () => {
    // util=watch but errors=concerning -> concerning wins
    expect(classifyNodeMetrics({ utilization: 0.7, errorRate: 0.02 })).toBe('concerning');
    // util=healthy but errors past paging threshold -> critical
    expect(
      classifyNodeMetrics({ utilization: 0.3, errorRate: ERROR_CONCERNING_MAX + 0.01 }),
    ).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// BAND_COLOR_VAR
// ---------------------------------------------------------------------------

describe('BAND_COLOR_VAR', () => {
  it('keeps healthy muted and escalates watch/concerning/critical', () => {
    expect(BAND_COLOR_VAR.healthy).toBe('var(--state-idle)');
    expect(BAND_COLOR_VAR.watch).toBe('var(--state-warning)');
    expect(BAND_COLOR_VAR.concerning).toBe('var(--state-error)');
    expect(BAND_COLOR_VAR.critical).toBe('var(--state-error)');
  });

  it('never hands the UI a hex literal', () => {
    for (const color of Object.values(BAND_COLOR_VAR)) {
      expect(color).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });
});
