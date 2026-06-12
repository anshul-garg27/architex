import { describe, it, expect } from 'vitest';
import {
  classifyMetric,
  buildVerdict,
  extractIssueNarratives,
} from '../threshold-bands';
import type {
  MetricKind,
  ThresholdBand,
  VerdictIssueInput,
  VerdictRunMetrics,
} from '../threshold-bands';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function healthyMetrics(): VerdictRunMetrics {
  return {
    p50LatencyMs: 20,
    p99LatencyMs: 120,
    errorRate: 0.0001,
    peakUtilization: 0.4,
    bottleneckLabel: 'Postgres',
    costPerHour: 2,
    deliveredRatio: 1,
  };
}

function issue(overrides: Partial<VerdictIssueInput> = {}): VerdictIssueInput {
  return {
    issueCode: 'INFRA-001',
    nodeLabel: 'API Server',
    severity: 'high',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// classifyMetric — band boundaries
// ---------------------------------------------------------------------------

describe('classifyMetric', () => {
  const cases: [MetricKind, number, ThresholdBand][] = [
    // p50: 100 / 300 / 1000 ms
    ['p50', 0, 'healthy'],
    ['p50', 99.9, 'healthy'],
    ['p50', 100, 'watch'],
    ['p50', 299, 'watch'],
    ['p50', 300, 'concerning'],
    ['p50', 999, 'concerning'],
    ['p50', 1000, 'critical'],
    ['p50', 10_000, 'critical'],
    // p99: 300 / 1000 / 4000 ms
    ['p99', 299, 'healthy'],
    ['p99', 300, 'watch'],
    ['p99', 999, 'watch'],
    ['p99', 1000, 'concerning'],
    ['p99', 3999, 'concerning'],
    ['p99', 4000, 'critical'],
    // errorRate: 0.1% / 1% / 5%
    ['errorRate', 0, 'healthy'],
    ['errorRate', 0.0009, 'healthy'],
    ['errorRate', 0.001, 'watch'],
    ['errorRate', 0.009, 'watch'],
    ['errorRate', 0.01, 'concerning'],
    ['errorRate', 0.049, 'concerning'],
    ['errorRate', 0.05, 'critical'],
    ['errorRate', 1, 'critical'],
    // utilization: 60% / 75% / 90%
    ['utilization', 0.59, 'healthy'],
    ['utilization', 0.6, 'watch'],
    ['utilization', 0.74, 'watch'],
    ['utilization', 0.75, 'concerning'],
    ['utilization', 0.89, 'concerning'],
    ['utilization', 0.9, 'critical'],
    ['utilization', 1.2, 'critical'],
    // costPerHour: $5 / $25 / $100
    ['costPerHour', 4.99, 'healthy'],
    ['costPerHour', 5, 'watch'],
    ['costPerHour', 24.99, 'watch'],
    ['costPerHour', 25, 'concerning'],
    ['costPerHour', 99.99, 'concerning'],
    ['costPerHour', 100, 'critical'],
    // throughputVsCapacity (higher is better): 99.9% / 99% / 95%
    ['throughputVsCapacity', 1, 'healthy'],
    ['throughputVsCapacity', 1.4, 'healthy'],
    ['throughputVsCapacity', 0.999, 'healthy'],
    ['throughputVsCapacity', 0.995, 'watch'],
    ['throughputVsCapacity', 0.99, 'watch'],
    ['throughputVsCapacity', 0.96, 'concerning'],
    ['throughputVsCapacity', 0.95, 'concerning'],
    ['throughputVsCapacity', 0.9, 'critical'],
    ['throughputVsCapacity', 0, 'critical'],
  ];

  it.each(cases)('classifies %s value %d as %s', (kind, value, expected) => {
    expect(classifyMetric(kind, value).band).toBe(expected);
  });

  it('treats non-finite values as critical', () => {
    expect(classifyMetric('p99', Number.NaN).band).toBe('critical');
    expect(classifyMetric('p99', Number.POSITIVE_INFINITY).band).toBe('critical');
    expect(classifyMetric('throughputVsCapacity', Number.NaN).band).toBe('critical');
  });

  it('clamps negative values to zero before classifying', () => {
    expect(classifyMetric('errorRate', -0.5).band).toBe('healthy');
    expect(classifyMetric('throughputVsCapacity', -1).band).toBe('critical');
  });

  it('returns a capitalized label and a non-empty explanation for every band', () => {
    const kinds: MetricKind[] = [
      'p50',
      'p99',
      'errorRate',
      'utilization',
      'costPerHour',
      'throughputVsCapacity',
    ];
    for (const kind of kinds) {
      const result = classifyMetric(kind, 0);
      expect(result.label).toMatch(/^[A-Z]/);
      expect(result.explanation.length).toBeGreaterThan(10);
      expect(result.kind).toBe(kind);
    }
  });
});

// ---------------------------------------------------------------------------
// buildVerdict — composition
// ---------------------------------------------------------------------------

describe('buildVerdict', () => {
  it('produces a clean-run verdict with null causal sentences when all healthy', () => {
    const verdict = buildVerdict(healthyMetrics(), []);

    expect(verdict.worstBand).toBe('healthy');
    expect(verdict.headline).toBe(
      'Clean run — every signal stayed in the healthy band.',
    );
    expect(verdict.metrics.length).toBe(6);
    for (const m of verdict.metrics) {
      expect(m.band).toBe('healthy');
      expect(m.causalSentence).toBeNull();
    }
  });

  it('omits optional metrics that were not provided', () => {
    const verdict = buildVerdict(
      { p50LatencyMs: 20, p99LatencyMs: 100, errorRate: 0 },
      [],
    );
    const kinds = verdict.metrics.map((m) => m.kind);
    expect(kinds).toEqual(['errorRate', 'p99', 'p50']);
  });

  it('prefers the engine narrative for causal attribution', () => {
    const narrative =
      'API Server is experiencing CPU throttling (counter at 7/5) due to sustained high utilization';
    const verdict = buildVerdict(
      { ...healthyMetrics(), p99LatencyMs: 5000 },
      [issue({ narrative })],
    );

    const p99 = verdict.metrics.find((m) => m.kind === 'p99');
    expect(p99?.band).toBe('critical');
    expect(p99?.causalSentence).toBe(`${narrative}.`);
  });

  it('falls back to issue-catalog copy when no narrative is available', () => {
    const verdict = buildVerdict(
      { ...healthyMetrics(), p99LatencyMs: 5000 },
      [issue()], // INFRA-001 without narrative
    );

    const p99 = verdict.metrics.find((m) => m.kind === 'p99');
    expect(p99?.causalSentence).toContain('CPU Throttling');
    expect(p99?.causalSentence).toContain('API Server');
  });

  it('falls back to bottleneck attribution when no issue explains the metric', () => {
    const verdict = buildVerdict(
      {
        ...healthyMetrics(),
        p99LatencyMs: 5000,
        peakUtilization: 1,
        bottleneckLabel: 'Postgres',
      },
      [], // no detected issues at all
    );

    const p99 = verdict.metrics.find((m) => m.kind === 'p99');
    expect(p99?.causalSentence).toContain('Postgres is the bottleneck');
    expect(p99?.causalSentence).toContain('100%');
  });

  it('uses generic copy mentioning the bottleneck label when utilization is not pinned', () => {
    const verdict = buildVerdict(
      {
        ...healthyMetrics(),
        p99LatencyMs: 600,
        peakUtilization: 0.5,
        bottleneckLabel: 'Redis',
      },
      [],
    );

    const p99 = verdict.metrics.find((m) => m.kind === 'p99');
    expect(p99?.band).toBe('watch');
    expect(p99?.causalSentence).toContain('Redis');
  });

  it('prefers issue categories relevant to the metric (EXT over INFRA for error rate)', () => {
    const verdict = buildVerdict(
      { ...healthyMetrics(), errorRate: 0.2 },
      [
        issue({ issueCode: 'INFRA-001', nodeLabel: 'API Server', severity: 'high' }),
        issue({ issueCode: 'EXT-001', nodeLabel: 'Stripe API', severity: 'high' }),
      ],
    );

    const err = verdict.metrics.find((m) => m.kind === 'errorRate');
    expect(err?.causalSentence).toContain('Stripe API');
  });

  it('picks the most severe issue within a category', () => {
    const verdict = buildVerdict(
      { ...healthyMetrics(), p99LatencyMs: 5000 },
      [
        issue({ issueCode: 'INFRA-001', nodeLabel: 'Worker', severity: 'medium' }),
        issue({ issueCode: 'INFRA-001', nodeLabel: 'Worker', severity: 'medium' }),
        issue({ issueCode: 'INFRA-002', nodeLabel: 'API Server', severity: 'critical' }),
      ],
    );

    const p99 = verdict.metrics.find((m) => m.kind === 'p99');
    expect(p99?.causalSentence).toContain('API Server');
  });

  it('ranks the worst metric by band, breaking ties by user impact priority', () => {
    const verdict = buildVerdict(
      { ...healthyMetrics(), errorRate: 0.2, p99LatencyMs: 5000 },
      [],
    );

    // Both critical; errorRate outranks p99 in priority order.
    expect(verdict.worstBand).toBe('critical');
    expect(verdict.headline).toContain('error rate');
    expect(verdict.headline).toContain('Not production-ready');
  });

  it('composes watch and concerning headlines around the worst metric', () => {
    const watchVerdict = buildVerdict(
      { ...healthyMetrics(), peakUtilization: 0.65 },
      [],
    );
    expect(watchVerdict.worstBand).toBe('watch');
    expect(watchVerdict.headline).toContain('peak utilization');
    expect(watchVerdict.headline).toContain('drifting');

    const concerningVerdict = buildVerdict(
      { ...healthyMetrics(), errorRate: 0.02 },
      [],
    );
    expect(concerningVerdict.worstBand).toBe('concerning');
    expect(concerningVerdict.headline).toContain('error rate');
  });

  it('formats raw values for the disclosure (ms, s, %, $/hr)', () => {
    const verdict = buildVerdict(
      {
        p50LatencyMs: 42,
        p99LatencyMs: 5000,
        errorRate: 0.123,
        peakUtilization: 0.91,
        costPerHour: 12.5,
        deliveredRatio: 0.97,
      },
      [],
    );

    const byKind = new Map(verdict.metrics.map((m) => [m.kind, m.formattedValue]));
    expect(byKind.get('p50')).toBe('42ms');
    expect(byKind.get('p99')).toBe('5.0s');
    expect(byKind.get('errorRate')).toBe('12.3%');
    expect(byKind.get('utilization')).toBe('91.0%');
    expect(byKind.get('costPerHour')).toBe('$12.50/hr');
    expect(byKind.get('throughputVsCapacity')).toBe('97.0%');
  });

  it('every non-healthy metric carries exactly one causal sentence', () => {
    const verdict = buildVerdict(
      {
        p50LatencyMs: 400,
        p99LatencyMs: 5000,
        errorRate: 0.2,
        peakUtilization: 0.95,
        costPerHour: 50,
        deliveredRatio: 0.8,
      },
      [],
    );

    for (const m of verdict.metrics) {
      expect(m.band).not.toBe('healthy');
      expect(m.causalSentence).toBeTruthy();
      // One sentence: terminated, and not a paragraph.
      expect(m.causalSentence).toMatch(/[.!?]$/);
    }
  });
});

// ---------------------------------------------------------------------------
// extractIssueNarratives
// ---------------------------------------------------------------------------

describe('extractIssueNarratives', () => {
  it('parses orchestrator issue log lines into code -> narrative', () => {
    const result = extractIssueNarratives([
      { level: 'info', message: 'Simulation started. 600 ticks at 100ms' },
      {
        level: 'error',
        message:
          '[INFRA-001] API Server: API Server is experiencing CPU throttling (counter at 7/5)',
      },
      { level: 'warn', message: 'Chaos: Node Crash injected on 1 node' },
    ]);

    expect(result.size).toBe(1);
    expect(result.get('INFRA-001')).toBe(
      'API Server is experiencing CPU throttling (counter at 7/5)',
    );
  });

  it('keeps the first occurrence per issue code', () => {
    const result = extractIssueNarratives([
      { level: 'error', message: '[DATA-001] Postgres: first narrative' },
      { level: 'error', message: '[DATA-001] Postgres: second narrative' },
    ]);

    expect(result.get('DATA-001')).toBe('first narrative');
  });

  it('ignores non-error levels and non-matching messages', () => {
    const result = extractIssueNarratives([
      { level: 'info', message: '[INFRA-001] API Server: not an error level' },
      { level: 'error', message: 'plain error without issue prefix' },
    ]);

    expect(result.size).toBe(0);
  });
});
