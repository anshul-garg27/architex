import { describe, expect, it } from 'vitest';
import {
  buildInjectionPlan,
  evaluateSlaVerdict,
  faultTypeToChaosEventId,
  getActiveInjection,
  getNextInjection,
  DEFAULT_RUN_DURATION_MS,
  type ScenarioRunMetrics,
} from '../scenario-runner';
import { CHAOS_EVENTS } from '../chaos-engine';
import type {
  ChaosScenario,
  PerformanceTargets,
  SLADefinition,
} from '@/lib/templates/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeScenario(overrides: Partial<ChaosScenario> = {}): ChaosScenario {
  return {
    id: 'cs-cache-failure',
    name: 'Redis Cache Failure',
    description: 'Complete Redis failure forcing all reads to hit database',
    targetNodes: ['cache'],
    faultType: 'crash',
    severity: 4,
    expectedBehavior: 'Read latency increases 10x.',
    mitigationSteps: ['Circuit breaker routes to DB directly'],
    ...overrides,
  };
}

function makeMetrics(
  overrides: Partial<ScenarioRunMetrics> = {},
): ScenarioRunMetrics {
  return {
    p50LatencyMs: 4,
    p99LatencyMs: 40,
    errorRate: 0,
    throughputRps: 12_000,
    totalRequests: 10_000,
    successfulRequests: 10_000,
    ...overrides,
  };
}

const PERF_TARGETS: PerformanceTargets = {
  defaultRps: 10_000,
  trafficProfile: 'bursty',
  p50LatencyMs: 5,
  p99LatencyMs: 50,
  availabilityTarget: 99.99,
  maxErrorRatePercent: 0.01,
  throughputRps: 10_000,
};

const SLAS: SLADefinition[] = [
  {
    name: 'Redirect Latency',
    metric: 'p99_redirect_ms',
    target: 50,
    unit: 'ms',
    penalty: '10% credit',
  },
  {
    name: 'Availability',
    metric: 'uptime',
    target: 99.99,
    unit: '%',
    penalty: '25% credit',
  },
];

// ---------------------------------------------------------------------------
// faultTypeToChaosEventId
// ---------------------------------------------------------------------------

describe('faultTypeToChaosEventId', () => {
  const faultTypes: ChaosScenario['faultType'][] = [
    'latency',
    'error',
    'crash',
    'partition',
    'resource-exhaustion',
    'data-corruption',
  ];

  it.each(faultTypes)(
    'maps "%s" to a real chaos catalog event',
    (faultType) => {
      const eventTypeId = faultTypeToChaosEventId(faultType);
      const catalogIds = CHAOS_EVENTS.map((e) => e.id);
      expect(catalogIds).toContain(eventTypeId);
    },
  );
});

// ---------------------------------------------------------------------------
// buildInjectionPlan
// ---------------------------------------------------------------------------

describe('buildInjectionPlan', () => {
  it('schedules the initial injection 25% into the run', () => {
    // Arrange
    const scenario = makeScenario({ severity: 3 });

    // Act
    const plan = buildInjectionPlan(scenario, 60_000);

    // Assert
    expect(plan).toHaveLength(1);
    expect(plan[0].atMs).toBe(15_000);
    expect(plan[0].wave).toBe('initial');
    expect(plan[0].eventTypeId).toBe('node-crash');
    expect(plan[0].targetNodeIds).toEqual(['cache']);
  });

  it('adds an aftershock wave at 60% for severity >= 4', () => {
    const plan = buildInjectionPlan(makeScenario({ severity: 5 }), 60_000);

    expect(plan).toHaveLength(2);
    expect(plan[1].wave).toBe('aftershock');
    expect(plan[1].atMs).toBe(36_000);
  });

  it('uses the default run duration when none is given', () => {
    const plan = buildInjectionPlan(makeScenario({ severity: 1 }));

    expect(plan[0].atMs).toBe(DEFAULT_RUN_DURATION_MS * 0.25);
  });

  it('carries the catalog duration and name for the mapped event', () => {
    const plan = buildInjectionPlan(makeScenario({ faultType: 'latency' }));
    const catalog = CHAOS_EVENTS.find((e) => e.id === 'latency-injection');

    expect(plan[0].eventName).toBe(catalog?.name);
    expect(plan[0].durationMs).toBe(catalog?.defaultDurationMs);
  });

  it('does not mutate the scenario targetNodes array', () => {
    const scenario = makeScenario();
    const plan = buildInjectionPlan(scenario);
    plan[0].targetNodeIds.push('mutated');

    expect(scenario.targetNodes).toEqual(['cache']);
  });
});

// ---------------------------------------------------------------------------
// getNextInjection / getActiveInjection
// ---------------------------------------------------------------------------

describe('injection plan lookups', () => {
  const plan = buildInjectionPlan(makeScenario({ severity: 5 }), 60_000);

  it('returns the upcoming injection before it fires', () => {
    expect(getNextInjection(plan, 0)?.wave).toBe('initial');
    expect(getNextInjection(plan, 15_000)?.wave).toBe('aftershock');
    expect(getNextInjection(plan, 36_000)).toBeNull();
  });

  it('returns the active injection while its duration runs', () => {
    // node-crash default duration is 30s, so 20s in it is still active
    expect(getActiveInjection(plan, 20_000)?.wave).toBe('initial');
    expect(getActiveInjection(plan, 14_999)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// evaluateSlaVerdict
// ---------------------------------------------------------------------------

describe('evaluateSlaVerdict', () => {
  it('passes when all SLA checks are within target', () => {
    // Arrange
    const metrics = makeMetrics({ p99LatencyMs: 40 });

    // Act
    const verdict = evaluateSlaVerdict(SLAS, PERF_TARGETS, metrics);

    // Assert
    expect(verdict.passed).toBe(true);
    expect(verdict.failCount).toBe(0);
    expect(verdict.passCount).toBeGreaterThan(0);
  });

  it('fails when measured p99 latency exceeds the SLA target', () => {
    const metrics = makeMetrics({ p99LatencyMs: 180 });

    const verdict = evaluateSlaVerdict(SLAS, PERF_TARGETS, metrics);
    const latencyCheck = verdict.checks.find(
      (c) => c.metric === 'p99_redirect_ms',
    );

    expect(verdict.passed).toBe(false);
    expect(latencyCheck?.status).toBe('fail');
    expect(latencyCheck?.measured).toBe(180);
    expect(latencyCheck?.penalty).toBe('10% credit');
  });

  it('computes availability from successful/total requests', () => {
    const metrics = makeMetrics({
      totalRequests: 10_000,
      successfulRequests: 9_500,
      errorRate: 0.05,
    });

    const verdict = evaluateSlaVerdict(SLAS, PERF_TARGETS, metrics);
    const uptime = verdict.checks.find((c) => c.metric === 'uptime');

    expect(uptime?.measured).toBeCloseTo(95);
    expect(uptime?.status).toBe('fail');
    expect(verdict.passed).toBe(false);
  });

  it('marks unresolvable SLA metrics as unknown without failing the run', () => {
    const weirdSla: SLADefinition[] = [
      {
        name: 'Support Response',
        metric: 'support_ticket_hours',
        target: 4,
        unit: 'hours',
        penalty: 'none',
      },
    ];

    const verdict = evaluateSlaVerdict(weirdSla, PERF_TARGETS, makeMetrics());
    const unknown = verdict.checks.find(
      (c) => c.metric === 'support_ticket_hours',
    );

    expect(unknown?.status).toBe('unknown');
    expect(unknown?.measured).toBeNull();
    expect(verdict.unknownCount).toBe(1);
    expect(verdict.passed).toBe(true);
  });

  it('appends implicit performance-target checks for uncovered dimensions only', () => {
    const verdict = evaluateSlaVerdict(SLAS, PERF_TARGETS, makeMetrics());

    // SLAs already cover p99 latency + availability; only error budget
    // should be appended from performance targets.
    const implicit = verdict.checks.filter(
      (c) => c.source === 'performance-target',
    );
    expect(implicit).toHaveLength(1);
    expect(implicit[0].metric).toBe('max_error_rate_percent');
  });

  it('fails the implicit error budget when error rate exceeds the target', () => {
    const metrics = makeMetrics({ errorRate: 0.02, successfulRequests: 9_800 });

    const verdict = evaluateSlaVerdict([], PERF_TARGETS, metrics);
    const errorCheck = verdict.checks.find(
      (c) => c.metric === 'max_error_rate_percent',
    );

    // 2% measured vs 0.01% target
    expect(errorCheck?.measured).toBeCloseTo(2);
    expect(errorCheck?.status).toBe('fail');
    expect(verdict.passed).toBe(false);
  });

  it('does not pass when there are no evaluable checks at all', () => {
    const verdict = evaluateSlaVerdict([], null, makeMetrics());

    expect(verdict.checks).toHaveLength(0);
    expect(verdict.passed).toBe(false);
  });

  it('handles a zero-request run without dividing by zero', () => {
    const metrics = makeMetrics({
      totalRequests: 0,
      successfulRequests: 0,
      errorRate: 0,
    });

    const verdict = evaluateSlaVerdict(SLAS, PERF_TARGETS, metrics);
    const uptime = verdict.checks.find((c) => c.metric === 'uptime');

    expect(uptime?.measured).toBeCloseTo(100);
  });
});
