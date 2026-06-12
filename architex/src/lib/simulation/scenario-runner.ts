/**
 * Scenario Runner (Survive This Incident)
 *
 * Takes a template ChaosScenario (v2 simulation metadata) and drives it
 * against a running SimulationOrchestrator:
 *
 *  1. buildInjectionPlan()   - pure: derive deterministic sim-time
 *     injection schedule from the scenario (faultType -> chaos event,
 *     severity -> wave count).
 *  2. runScenario()          - subscribes to the simulation store's tick
 *     stream (NOT wall-clock setTimeout, so pause / speed changes stay
 *     correct) and fires orchestrator.injectChaos() at the right sim-times.
 *  3. evaluateSlaVerdict()   - pure: per-SLA pass/fail against measured
 *     run metrics, plus implicit performance-target checks and an
 *     overall verdict.
 *
 * The runner never writes to the scenario store directly; consumers wire
 * `onInjection` / `onVerdict` callbacks (keeps this module cycle-free
 * and unit-testable).
 */

import type {
  ChaosScenario,
  PerformanceTargets,
  SLADefinition,
} from '@/lib/templates/types';
import type { SimulationOrchestrator } from './simulation-orchestrator';
import { CHAOS_EVENTS } from './chaos-engine';
import { useSimulationStore } from '@/stores/simulation-store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Sim-time per tick. Mirrors DEFAULT_TICK_MS in simulation-orchestrator.ts
 * (private there); the orchestrator timestamps chaos with `tick * 100`.
 */
export const SIM_TICK_MS = 100;

/** Default run length, mirrors DEFAULT_DURATION_MS in the orchestrator. */
export const DEFAULT_RUN_DURATION_MS = 60_000;

/** Initial injection lands 25% into the run (system has warmed up). */
const INITIAL_INJECTION_FRACTION = 0.25;

/** Severe scenarios (severity >= 4) get an aftershock at 60%. */
const AFTERSHOCK_FRACTION = 0.6;
const AFTERSHOCK_MIN_SEVERITY = 4;

// ---------------------------------------------------------------------------
// Fault type -> chaos event mapping
// ---------------------------------------------------------------------------

/**
 * Map template fault types onto catalog chaos event IDs that the
 * orchestrator's applyChaosModifiers() switch handles explicitly,
 * so injections have deterministic simulation effects.
 */
const FAULT_TYPE_TO_EVENT: Record<ChaosScenario['faultType'], string> = {
  latency: 'latency-injection',
  error: 'config-error',
  crash: 'node-crash',
  partition: 'network-partition',
  'resource-exhaustion': 'connection-exhaustion',
  'data-corruption': 'data-corruption',
};

/** Resolve a scenario fault type to a chaos-engine catalog event ID. */
export function faultTypeToChaosEventId(
  faultType: ChaosScenario['faultType'],
): string {
  return FAULT_TYPE_TO_EVENT[faultType];
}

// ---------------------------------------------------------------------------
// Injection plan
// ---------------------------------------------------------------------------

export interface PlannedInjection {
  /** Sim-time (ms from run start) at which to inject. */
  atMs: number;
  /** Chaos-engine catalog event type ID. */
  eventTypeId: string;
  /** Human-readable event name from the catalog. */
  eventName: string;
  /** Node IDs the fault targets (template node IDs). */
  targetNodeIds: string[];
  /** Catalog default duration — how long the fault stays active. */
  durationMs: number;
  /** Which wave of the scenario this injection belongs to. */
  wave: 'initial' | 'aftershock';
}

/**
 * Build the deterministic injection schedule for a scenario.
 *
 * Template ChaosScenario carries no explicit timing, so timing is derived:
 * the fault lands 25% into the run, and scenarios with severity >= 4 get a
 * second "aftershock" wave at 60% to test recovery under repeat failure.
 */
export function buildInjectionPlan(
  scenario: ChaosScenario,
  runDurationMs: number = DEFAULT_RUN_DURATION_MS,
): PlannedInjection[] {
  const eventTypeId = faultTypeToChaosEventId(scenario.faultType);
  const catalogEntry = CHAOS_EVENTS.find((e) => e.id === eventTypeId);
  const eventName = catalogEntry?.name ?? eventTypeId;
  const durationMs = catalogEntry?.defaultDurationMs ?? 30_000;
  const safeDuration = Math.max(runDurationMs, SIM_TICK_MS);

  const plan: PlannedInjection[] = [
    {
      atMs: Math.round(safeDuration * INITIAL_INJECTION_FRACTION),
      eventTypeId,
      eventName,
      targetNodeIds: [...scenario.targetNodes],
      durationMs,
      wave: 'initial',
    },
  ];

  if (scenario.severity >= AFTERSHOCK_MIN_SEVERITY) {
    plan.push({
      atMs: Math.round(safeDuration * AFTERSHOCK_FRACTION),
      eventTypeId,
      eventName,
      targetNodeIds: [...scenario.targetNodes],
      durationMs,
      wave: 'aftershock',
    });
  }

  return plan;
}

/** Next injection strictly after the given sim-time, if any. */
export function getNextInjection(
  plan: readonly PlannedInjection[],
  simMs: number,
): PlannedInjection | null {
  return plan.find((p) => p.atMs > simMs) ?? null;
}

/** Injection currently active (fired and within its duration), if any. */
export function getActiveInjection(
  plan: readonly PlannedInjection[],
  simMs: number,
): PlannedInjection | null {
  return (
    plan.find((p) => p.atMs <= simMs && simMs < p.atMs + p.durationMs) ?? null
  );
}

// ---------------------------------------------------------------------------
// SLA verdict evaluation (pure)
// ---------------------------------------------------------------------------

/** Minimal structural slice of SimulationMetrics the evaluator needs. */
export interface ScenarioRunMetrics {
  p50LatencyMs: number;
  p99LatencyMs: number;
  /** Error rate as a 0-1 fraction (matches MetricsCollector). */
  errorRate: number;
  throughputRps: number;
  totalRequests: number;
  successfulRequests: number;
}

export type SlaCheckStatus = 'pass' | 'fail' | 'unknown';

type MetricKind =
  | 'latency-p99'
  | 'latency-p50'
  | 'availability'
  | 'error-rate'
  | 'throughput';

export interface SlaCheckResult {
  name: string;
  metric: string;
  target: number;
  unit: string;
  /** Measured value in the same unit as `target`; null when unresolvable. */
  measured: number | null;
  status: SlaCheckStatus;
  /** 'lte' = measured must be <= target; 'gte' = measured must be >= target. */
  comparator: 'lte' | 'gte';
  /** Whether this came from an SLA definition or an implicit perf target. */
  source: 'sla' | 'performance-target';
  /** Contractual penalty (SLA-sourced checks only). */
  penalty?: string;
}

export interface SlaVerdict {
  /** True when every evaluable check passed (and at least one ran). */
  passed: boolean;
  checks: SlaCheckResult[];
  passCount: number;
  failCount: number;
  unknownCount: number;
}

function measuredAvailabilityPercent(m: ScenarioRunMetrics): number {
  if (m.totalRequests > 0) {
    return (m.successfulRequests / m.totalRequests) * 100;
  }
  return (1 - m.errorRate) * 100;
}

interface ResolvedMetric {
  kind: MetricKind;
  measured: number;
  comparator: 'lte' | 'gte';
}

/** Map a template SLA metric string onto a measured run value. */
function resolveSlaMetric(
  metric: string,
  unit: string,
  m: ScenarioRunMetrics,
): ResolvedMetric | null {
  const key = metric.toLowerCase();

  if (key.includes('uptime') || key.includes('availability')) {
    return {
      kind: 'availability',
      measured: measuredAvailabilityPercent(m),
      comparator: 'gte',
    };
  }
  if (key.includes('error')) {
    return { kind: 'error-rate', measured: m.errorRate * 100, comparator: 'lte' };
  }
  if (key.includes('p50')) {
    return { kind: 'latency-p50', measured: m.p50LatencyMs, comparator: 'lte' };
  }
  if (key.includes('p99') || unit === 'ms') {
    return { kind: 'latency-p99', measured: m.p99LatencyMs, comparator: 'lte' };
  }
  if (key.includes('throughput') || key.includes('rps')) {
    return { kind: 'throughput', measured: m.throughputRps, comparator: 'gte' };
  }
  return null;
}

function checkStatus(
  measured: number,
  target: number,
  comparator: 'lte' | 'gte',
): SlaCheckStatus {
  if (comparator === 'lte') return measured <= target ? 'pass' : 'fail';
  return measured >= target ? 'pass' : 'fail';
}

/**
 * Evaluate the run against template SLA definitions, then append implicit
 * checks from performanceTargets for any dimension not already covered by
 * an SLA (no duplicate rows). Pure — safe to unit test.
 */
export function evaluateSlaVerdict(
  slaDefinitions: readonly SLADefinition[],
  performanceTargets: PerformanceTargets | null | undefined,
  runMetrics: ScenarioRunMetrics,
): SlaVerdict {
  const checks: SlaCheckResult[] = [];
  const coveredKinds = new Set<MetricKind>();

  for (const sla of slaDefinitions) {
    const resolved = resolveSlaMetric(sla.metric, sla.unit, runMetrics);
    if (resolved) coveredKinds.add(resolved.kind);

    checks.push({
      name: sla.name,
      metric: sla.metric,
      target: sla.target,
      unit: sla.unit,
      measured: resolved ? resolved.measured : null,
      status: resolved
        ? checkStatus(resolved.measured, sla.target, resolved.comparator)
        : 'unknown',
      comparator: resolved?.comparator ?? 'lte',
      source: 'sla',
      penalty: sla.penalty,
    });
  }

  if (performanceTargets) {
    const implicit: Array<{
      kind: MetricKind;
      name: string;
      metric: string;
      target: number;
      unit: string;
      measured: number;
      comparator: 'lte' | 'gte';
    }> = [
      {
        kind: 'latency-p99',
        name: 'P99 Latency Target',
        metric: 'p99_latency_ms',
        target: performanceTargets.p99LatencyMs,
        unit: 'ms',
        measured: runMetrics.p99LatencyMs,
        comparator: 'lte',
      },
      {
        kind: 'error-rate',
        name: 'Error Budget',
        metric: 'max_error_rate_percent',
        target: performanceTargets.maxErrorRatePercent,
        unit: '%',
        measured: runMetrics.errorRate * 100,
        comparator: 'lte',
      },
      {
        kind: 'availability',
        name: 'Availability Target',
        metric: 'availability',
        target: performanceTargets.availabilityTarget,
        unit: '%',
        measured: measuredAvailabilityPercent(runMetrics),
        comparator: 'gte',
      },
    ];

    for (const item of implicit) {
      if (coveredKinds.has(item.kind)) continue;
      coveredKinds.add(item.kind);
      checks.push({
        name: item.name,
        metric: item.metric,
        target: item.target,
        unit: item.unit,
        measured: item.measured,
        status: checkStatus(item.measured, item.target, item.comparator),
        comparator: item.comparator,
        source: 'performance-target',
      });
    }
  }

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const unknownCount = checks.filter((c) => c.status === 'unknown').length;

  return {
    passed: failCount === 0 && passCount > 0,
    checks,
    passCount,
    failCount,
    unknownCount,
  };
}

// ---------------------------------------------------------------------------
// Runner: drive a scenario against a live orchestrator via sim-time
// ---------------------------------------------------------------------------

export interface ScenarioRunnerCallbacks {
  /** Fired when an injection lands; `firedAtSimMs` is sim-time. */
  onInjection?: (injection: PlannedInjection, firedAtSimMs: number) => void;
  /** Fired once when the run completes and the verdict is evaluated. */
  onVerdict?: (verdict: SlaVerdict) => void;
}

/**
 * Attach a scenario to a live simulation run.
 *
 * Subscribes to the simulation store's tick stream so injections track
 * sim-time: pausing freezes the countdown and playback-speed changes do
 * not skew timing. Detaches itself when the run completes (after writing
 * the verdict) or is stopped/reset.
 *
 * @returns cleanup function (idempotent) that detaches the runner.
 */
export function runScenario(
  scenario: ChaosScenario,
  orchestrator: SimulationOrchestrator,
  slaDefinitions: readonly SLADefinition[],
  performanceTargets: PerformanceTargets | null | undefined,
  callbacks: ScenarioRunnerCallbacks = {},
): () => void {
  const store = useSimulationStore;
  const initial = store.getState();

  const runDurationMs =
    initial.totalTicks > 0
      ? initial.totalTicks * SIM_TICK_MS
      : DEFAULT_RUN_DURATION_MS;

  const plan = buildInjectionPlan(scenario, runDurationMs);
  const fired = new Set<PlannedInjection>();
  let finished = false;
  let unsubscribe: (() => void) | null = null;

  const detach = (): void => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  };

  const fireDueInjections = (currentTick: number): void => {
    const simMs = currentTick * SIM_TICK_MS;
    for (const injection of plan) {
      if (fired.has(injection) || injection.atMs > simMs) continue;
      fired.add(injection);
      try {
        orchestrator.injectChaos(injection.eventTypeId, injection.targetNodeIds);
        callbacks.onInjection?.(injection, simMs);
      } catch {
        // Unknown event type or disposed orchestrator — log to the sim
        // console rather than crashing the tick listener.
        store
          .getState()
          .addConsoleMessage(
            'error',
            `Scenario "${scenario.name}": failed to inject ${injection.eventTypeId}`,
          );
      }
    }
  };

  const finalize = (): void => {
    if (finished) return;
    finished = true;
    const metrics = store.getState().metrics;
    callbacks.onVerdict?.(
      evaluateSlaVerdict(slaDefinitions, performanceTargets, metrics),
    );
    detach();
  };

  unsubscribe = store.subscribe((state, prev) => {
    if (state.currentTick !== prev.currentTick) {
      fireDueInjections(state.currentTick);
    }
    if (state.status === 'completed' && prev.status !== 'completed') {
      finalize();
    }
    // Stopped or reset mid-run: detach silently, no verdict.
    if (state.status === 'idle' && prev.status !== 'idle') {
      detach();
    }
  });

  // Handle attach-after-the-fact edge cases (very short runs).
  if (initial.status === 'completed') {
    finalize();
  } else {
    fireDueInjections(initial.currentTick);
  }

  return detach;
}
