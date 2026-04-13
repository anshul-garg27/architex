// ─────────────────────────────────────────────────────────────
// Architex — Saga Pattern Simulation  [DIS-018]
// ─────────────────────────────────────────────────────────────
//
// Models the choreography-based saga pattern for distributed
// transactions. Each service executes a local transaction and
// publishes an event that triggers the next service. If any
// step fails, compensating transactions are executed in
// reverse order to undo previous work.
// ─────────────────────────────────────────────────────────────

/** A single step in the saga simulation. */
export interface SagaStep {
  /** Simulation tick. */
  tick: number;
  /** The service executing this step. */
  service: string;
  /** The action being performed. */
  action: 'execute' | 'compensate' | 'complete' | 'fail';
  /** Human-readable description of this step. */
  description: string;
  /** Whether this step belongs to a choreography or orchestration saga. */
  mode: 'choreography' | 'orchestration';
  /** For orchestration sagas, the orchestrator node ID directing the step. */
  orchestrator?: string;
}

/** Default saga pipeline: a typical e-commerce order flow. */
const DEFAULT_SERVICES = ['Order', 'Payment', 'Inventory', 'Shipping'];

/**
 * Simulates a choreography-based saga across a pipeline of services.
 *
 * @param steps - Number of services in the saga pipeline (1-based).
 *                Uses the default service names when <= 4, otherwise
 *                generates "Service-N" names.
 * @param failAt - One-based index of the step that should fail.
 *                 If undefined, all steps succeed.
 * @returns An array of {@link SagaStep} objects describing the saga execution.
 *
 * @example
 * ```ts
 * // Happy path: Order → Payment → Inventory → Shipping
 * const happy = simulateSagaChoreography(4);
 *
 * // Inventory (step 3) fails → compensate Payment, then Order
 * const failing = simulateSagaChoreography(4, 3);
 * ```
 */
export function simulateSagaChoreography(
  steps: number,
  failAt?: number,
): SagaStep[] {
  if (steps < 1) {
    throw new Error('Saga requires at least 1 step.');
  }

  const services: string[] = [];
  for (let i = 0; i < steps; i++) {
    services.push(i < DEFAULT_SERVICES.length ? DEFAULT_SERVICES[i] : `Service-${i + 1}`);
  }

  const result: SagaStep[] = [];
  let tick = 0;

  const willFail =
    failAt !== undefined && failAt >= 1 && failAt <= steps;
  const failIndex = willFail ? failAt! - 1 : -1;

  // ── Forward execution ──────────────────────────────────────
  for (let i = 0; i < services.length; i++) {
    const svc = services[i];

    if (willFail && i === failIndex) {
      // This service fails
      result.push({
        tick: tick++,
        service: svc,
        action: 'fail',
        description: `${svc} service FAILED. Initiating compensation.`,
        mode: 'choreography',
      });
      break;
    }

    result.push({
      tick: tick++,
      service: svc,
      action: 'execute',
      description:
        i === 0
          ? `${svc} service begins saga. Local transaction executed.`
          : `${svc} service received event. Local transaction executed.`,
      mode: 'choreography',
    });
  }

  // ── Compensation (reverse order) ───────────────────────────
  if (willFail) {
    // Compensate all successfully executed services in reverse
    for (let i = failIndex - 1; i >= 0; i--) {
      const svc = services[i];
      result.push({
        tick: tick++,
        service: svc,
        action: 'compensate',
        description: `${svc} service: compensating transaction executed (rollback).`,
        mode: 'choreography',
      });
    }

    result.push({
      tick: tick++,
      service: services[0],
      action: 'fail',
      description: `Saga aborted. All compensating transactions complete.`,
      mode: 'choreography',
    });
  } else {
    // All succeeded
    result.push({
      tick: tick++,
      service: services[services.length - 1],
      action: 'complete',
      description: `Saga completed successfully. All ${steps} services committed.`,
      mode: 'choreography',
    });
  }

  return result;
}

/**
 * Simulates an orchestration-based saga across a pipeline of services.
 *
 * Unlike choreography (where services communicate via events), an
 * orchestrator acts as the central coordinator: it tells each service
 * what to do, waits for the result, and decides what happens next.
 *
 * @param steps - Number of services in the saga pipeline (1-based).
 *                Uses the default service names when <= 4, otherwise
 *                generates "Service-N" names.
 * @param failAt - One-based index of the step that should fail.
 *                 If undefined, all steps succeed.
 * @returns An array of {@link SagaStep} objects describing the saga execution.
 *
 * @example
 * ```ts
 * // Happy path: Orchestrator → Order → Payment → Inventory → Shipping
 * const happy = simulateSagaOrchestration(4);
 *
 * // Inventory (step 3) fails → Orchestrator directs compensation
 * const failing = simulateSagaOrchestration(4, 3);
 * ```
 */
export function simulateSagaOrchestration(
  steps: number,
  failAt?: number,
): SagaStep[] {
  if (steps < 1) {
    throw new Error('Saga requires at least 1 step.');
  }

  const orchestratorId = 'SagaOrchestrator';

  const services: string[] = [];
  for (let i = 0; i < steps; i++) {
    services.push(i < DEFAULT_SERVICES.length ? DEFAULT_SERVICES[i] : `Service-${i + 1}`);
  }

  const result: SagaStep[] = [];
  let tick = 0;

  const willFail =
    failAt !== undefined && failAt >= 1 && failAt <= steps;
  const failIndex = willFail ? failAt! - 1 : -1;

  // ── Forward execution (orchestrator-directed) ─────────────
  for (let i = 0; i < services.length; i++) {
    const svc = services[i];

    // Orchestrator directs the service to execute
    result.push({
      tick: tick++,
      service: orchestratorId,
      action: 'execute',
      description: `Orchestrator directs ${svc} to execute local transaction.`,
      mode: 'orchestration',
      orchestrator: orchestratorId,
    });

    if (willFail && i === failIndex) {
      // Service reports failure to Orchestrator
      result.push({
        tick: tick++,
        service: svc,
        action: 'fail',
        description: `${svc} service FAILED. Reports failure to Orchestrator.`,
        mode: 'orchestration',
        orchestrator: orchestratorId,
      });

      // Orchestrator initiates compensation
      result.push({
        tick: tick++,
        service: orchestratorId,
        action: 'compensate',
        description: `Orchestrator received failure from ${svc}. Initiating compensation.`,
        mode: 'orchestration',
        orchestrator: orchestratorId,
      });
      break;
    }

    // Service reports success to Orchestrator
    result.push({
      tick: tick++,
      service: svc,
      action: 'execute',
      description: `${svc} reports success to Orchestrator.`,
      mode: 'orchestration',
      orchestrator: orchestratorId,
    });
  }

  // ── Compensation (orchestrator-directed, reverse order) ────
  if (willFail) {
    for (let i = failIndex - 1; i >= 0; i--) {
      const svc = services[i];

      // Orchestrator directs the service to compensate
      result.push({
        tick: tick++,
        service: orchestratorId,
        action: 'compensate',
        description: `Orchestrator directs ${svc} to execute compensating transaction.`,
        mode: 'orchestration',
        orchestrator: orchestratorId,
      });

      // Service compensates and reports back
      result.push({
        tick: tick++,
        service: svc,
        action: 'compensate',
        description: `${svc} service: compensating transaction executed. Reports to Orchestrator.`,
        mode: 'orchestration',
        orchestrator: orchestratorId,
      });
    }

    result.push({
      tick: tick++,
      service: orchestratorId,
      action: 'fail',
      description: `Saga aborted. Orchestrator confirmed all compensating transactions complete.`,
      mode: 'orchestration',
      orchestrator: orchestratorId,
    });
  } else {
    // All succeeded — Orchestrator marks saga complete
    result.push({
      tick: tick++,
      service: orchestratorId,
      action: 'complete',
      description: `Saga completed successfully. Orchestrator confirmed all ${steps} services committed.`,
      mode: 'orchestration',
      orchestrator: orchestratorId,
    });
  }

  return result;
}
