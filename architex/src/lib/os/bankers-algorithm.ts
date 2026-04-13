/**
 * Banker's Algorithm -- Standalone Implementation  (OSC-009)
 * ══════════════════════════════════════════════════════════════
 *
 * Matrix-based Banker's Algorithm for deadlock avoidance.
 *
 * Uses the classic formulation with:
 *   - Available vector
 *   - Max matrix
 *   - Allocation matrix
 *   - Need matrix (Max - Allocation)
 *
 * Provides:
 *   1. {@link isSafe} -- Determine whether a state is safe and
 *      compute a safe execution sequence.
 *   2. {@link requestResources} -- Attempt to grant a resource
 *      request, rolling back if the resulting state is unsafe.
 *
 * Both return detailed step-by-step traces for visualization.
 */

// ── Types ─────────────────────────────────────────────────────

export interface BankersStep {
  id: number;
  description: string;
  /** Snapshot of the available vector at this step. */
  available: number[];
  /** Which process is being considered (or -1 for global steps). */
  processId: number;
  /** Type of action performed in this step. */
  action:
    | 'init'
    | 'check-need'
    | 'tentative-allocate'
    | 'release'
    | 'safe'
    | 'unsafe'
    | 'request-check'
    | 'request-granted'
    | 'request-denied';
}

export interface BankersState {
  /** Available resources vector: available[j] = free instances of resource j. */
  available: number[];
  /** Max demand matrix: max[i][j] = max demand of process i for resource j. */
  max: number[][];
  /** Current allocation: allocation[i][j] = allocated to process i of resource j. */
  allocation: number[][];
  /** Need matrix: need[i][j] = max[i][j] - allocation[i][j]. */
  need: number[][];
}

export interface SafetyResult {
  safe: boolean;
  sequence: number[];
  steps: BankersStep[];
}

export interface RequestResult {
  granted: boolean;
  newState: BankersState | null;
  steps: BankersStep[];
}

// ── Helpers ───────────────────────────────────────────────────

let _stepId = 0;

function bStep(
  desc: string,
  available: number[],
  processId: number,
  action: BankersStep['action'],
): BankersStep {
  return {
    id: _stepId++,
    description: desc,
    available: [...available],
    processId,
    action,
  };
}

function resetStepId(): void {
  _stepId = 0;
}

/** Deep clone a BankersState (all arrays are new copies). */
export function cloneBankersState(state: BankersState): BankersState {
  return {
    available: [...state.available],
    max: state.max.map((row) => [...row]),
    allocation: state.allocation.map((row) => [...row]),
    need: state.need.map((row) => [...row]),
  };
}

/** Format a vector as a string for step descriptions. */
function vec(v: number[]): string {
  return `[${v.join(', ')}]`;
}

// ── Safety Algorithm ──────────────────────────────────────────

/**
 * Determine whether the given state is safe.
 *
 * Implements the Banker's Safety Algorithm:
 *   1. Initialize Work = Available, Finish[i] = false.
 *   2. Find process i where Finish[i] == false and Need[i] <= Work.
 *   3. Work = Work + Allocation[i], Finish[i] = true. Go to step 2.
 *   4. If all Finish[i] == true, the state is safe.
 */
export function isSafe(state: BankersState, startId?: number): SafetyResult {
  if (startId !== undefined) {
    _stepId = startId;
  } else {
    resetStepId();
  }
  const steps: BankersStep[] = [];

  const n = state.allocation.length; // number of processes
  const m = state.available.length;  // number of resource types
  const work = [...state.available];
  const finish = new Array<boolean>(n).fill(false);
  const sequence: number[] = [];

  steps.push(
    bStep(
      `Initialize: Work = ${vec(work)}, Finish = [${finish.map((f) => (f ? 'T' : 'F')).join(', ')}]`,
      work,
      -1,
      'init',
    ),
  );

  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      // Check if Need[i] <= Work.
      let canFinish = true;
      for (let j = 0; j < m; j++) {
        if (state.need[i][j] > work[j]) {
          canFinish = false;
          break;
        }
      }

      steps.push(
        bStep(
          `P${i}: Need ${vec(state.need[i])} ${canFinish ? '<=' : '>'} Work ${vec(work)} -- ${canFinish ? 'can proceed' : 'must wait'}`,
          work,
          i,
          'check-need',
        ),
      );

      if (canFinish) {
        // Tentative allocation: simulate granting remaining resources.
        steps.push(
          bStep(
            `P${i}: Tentatively allocate remaining need ${vec(state.need[i])}`,
            work,
            i,
            'tentative-allocate',
          ),
        );

        // Release: Work = Work + Allocation[i].
        for (let j = 0; j < m; j++) {
          work[j] += state.allocation[i][j];
        }
        finish[i] = true;
        sequence.push(i);

        steps.push(
          bStep(
            `P${i}: Finishes and releases allocation ${vec(state.allocation[i])} -- Work = ${vec(work)}`,
            work,
            i,
            'release',
          ),
        );

        progress = true;
      }
    }
  }

  const safe = finish.every((f) => f);

  if (safe) {
    steps.push(
      bStep(
        `SAFE: All processes can finish. Safe sequence: <${sequence.map((p) => `P${p}`).join(', ')}>`,
        work,
        -1,
        'safe',
      ),
    );
  } else {
    const blocked = finish
      .map((f, idx) => (f ? null : `P${idx}`))
      .filter((p) => p !== null);
    steps.push(
      bStep(
        `UNSAFE: Processes ${blocked.join(', ')} cannot finish. No safe sequence exists.`,
        work,
        -1,
        'unsafe',
      ),
    );
  }

  return { safe, sequence, steps };
}

// ── Resource Request ──────────────────────────────────────────

/**
 * Attempt to grant a resource request from a process.
 *
 * Algorithm:
 *   1. If Request[i] > Need[i], error (process exceeds max claim).
 *   2. If Request[i] > Available, process must wait.
 *   3. Tentatively allocate:
 *        Available -= Request
 *        Allocation[i] += Request
 *        Need[i] -= Request
 *   4. Run safety algorithm on tentative state.
 *   5. If safe, grant. Otherwise, roll back.
 */
export function requestResources(
  state: BankersState,
  processId: number,
  request: number[],
): RequestResult {
  resetStepId();
  const steps: BankersStep[] = [];
  const m = state.available.length;

  steps.push(
    bStep(
      `P${processId} requests ${vec(request)}. Available = ${vec(state.available)}`,
      state.available,
      processId,
      'request-check',
    ),
  );

  // Check 1: Request <= Need.
  for (let j = 0; j < m; j++) {
    if (request[j] > state.need[processId][j]) {
      steps.push(
        bStep(
          `DENIED: P${processId} request ${vec(request)} exceeds max need ${vec(state.need[processId])}`,
          state.available,
          processId,
          'request-denied',
        ),
      );
      return { granted: false, newState: null, steps };
    }
  }

  // Check 2: Request <= Available.
  for (let j = 0; j < m; j++) {
    if (request[j] > state.available[j]) {
      steps.push(
        bStep(
          `DENIED: P${processId} request ${vec(request)} exceeds available ${vec(state.available)} -- must wait`,
          state.available,
          processId,
          'request-denied',
        ),
      );
      return { granted: false, newState: null, steps };
    }
  }

  // Step 3: Tentative allocation.
  const tentative = cloneBankersState(state);
  for (let j = 0; j < m; j++) {
    tentative.available[j] -= request[j];
    tentative.allocation[processId][j] += request[j];
    tentative.need[processId][j] -= request[j];
  }

  steps.push(
    bStep(
      `Tentative allocation: Available = ${vec(tentative.available)}, Alloc[P${processId}] = ${vec(tentative.allocation[processId])}, Need[P${processId}] = ${vec(tentative.need[processId])}`,
      tentative.available,
      processId,
      'tentative-allocate',
    ),
  );

  // Step 4: Safety check (pass current _stepId so IDs stay monotonic).
  const safetyResult = isSafe(tentative, _stepId);
  // Merge safety steps into our steps array (IDs are already monotonic).
  for (const safeStep of safetyResult.steps) {
    steps.push(safeStep);
  }
  // Sync _stepId to account for steps added by isSafe.
  _stepId = safetyResult.steps.length > 0
    ? safetyResult.steps[safetyResult.steps.length - 1].id + 1
    : _stepId;

  if (safetyResult.safe) {
    steps.push(
      bStep(
        `GRANTED: Request ${vec(request)} from P${processId} leads to a safe state`,
        tentative.available,
        processId,
        'request-granted',
      ),
    );
    return { granted: true, newState: tentative, steps };
  }

  steps.push(
    bStep(
      `DENIED: Request ${vec(request)} from P${processId} would lead to an unsafe state -- rolled back`,
      state.available,
      processId,
      'request-denied',
    ),
  );
  return { granted: false, newState: null, steps };
}
