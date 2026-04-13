import { describe, it, expect } from 'vitest';
import {
  isSafe,
  requestResources,
  cloneBankersState,
} from '../bankers-algorithm';
import type { BankersState } from '../bankers-algorithm';

// ── Test Fixtures ─────────────────────────────────────────────

/**
 * Classic textbook example (Silberschatz, Ch. 7):
 *   5 processes, 3 resource types (A, B, C)
 *   Available = [3, 3, 2]
 */
function createSafeState(): BankersState {
  const allocation = [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
    [2, 1, 1], // P3
    [0, 0, 2], // P4
  ];
  const max = [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
    [2, 2, 2], // P3
    [4, 3, 3], // P4
  ];
  const available = [3, 3, 2];
  const need = max.map((row, i) =>
    row.map((val, j) => val - allocation[i][j]),
  );
  return { available, max, allocation, need };
}

/** An unsafe state -- no safe sequence exists. */
function createUnsafeState(): BankersState {
  const allocation = [
    [0, 1, 0], // P0
    [2, 0, 0], // P1
    [3, 0, 2], // P2
  ];
  const max = [
    [7, 5, 3], // P0
    [3, 2, 2], // P1
    [9, 0, 2], // P2
  ];
  // Available is very low -- no process can finish.
  const available = [0, 0, 0];
  const need = max.map((row, i) =>
    row.map((val, j) => val - allocation[i][j]),
  );
  return { available, max, allocation, need };
}

/** Simple 2-process, 2-resource safe state. */
function createSimpleState(): BankersState {
  const allocation = [
    [1, 0], // P0
    [0, 1], // P1
  ];
  const max = [
    [2, 1], // P0
    [1, 2], // P1
  ];
  const available = [1, 1];
  const need = max.map((row, i) =>
    row.map((val, j) => val - allocation[i][j]),
  );
  return { available, max, allocation, need };
}

// ── isSafe Tests ──────────────────────────────────────────────

describe('Banker\'s Algorithm -- isSafe', () => {
  it('identifies a safe state and produces a valid safe sequence', () => {
    const state = createSafeState();
    const result = isSafe(state);

    expect(result.safe).toBe(true);
    expect(result.sequence.length).toBe(5);
    // Every process ID should appear exactly once.
    const sorted = [...result.sequence].sort();
    expect(sorted).toEqual([0, 1, 2, 3, 4]);
  });

  it('identifies an unsafe state', () => {
    const state = createUnsafeState();
    const result = isSafe(state);

    expect(result.safe).toBe(false);
    // Sequence should be incomplete.
    expect(result.sequence.length).toBeLessThan(3);
  });

  it('produces step-by-step trace with init step', () => {
    const state = createSafeState();
    const result = isSafe(state);

    expect(result.steps.length).toBeGreaterThan(0);
    expect(result.steps[0].action).toBe('init');
    expect(result.steps[0].description).toContain('Initialize');
  });

  it('trace contains check-need steps for each process', () => {
    const state = createSafeState();
    const result = isSafe(state);

    const checkSteps = result.steps.filter((s) => s.action === 'check-need');
    expect(checkSteps.length).toBeGreaterThan(0);
  });

  it('trace contains release steps for completed processes', () => {
    const state = createSafeState();
    const result = isSafe(state);

    const releaseSteps = result.steps.filter((s) => s.action === 'release');
    expect(releaseSteps.length).toBe(5); // one per process in safe state
  });

  it('safe state trace ends with a safe action', () => {
    const state = createSafeState();
    const result = isSafe(state);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.action).toBe('safe');
  });

  it('unsafe state trace ends with an unsafe action', () => {
    const state = createUnsafeState();
    const result = isSafe(state);
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.action).toBe('unsafe');
  });

  it('handles simple 2-process state correctly', () => {
    const state = createSimpleState();
    const result = isSafe(state);

    expect(result.safe).toBe(true);
    expect(result.sequence.length).toBe(2);
  });

  it('available vector in steps tracks resource changes', () => {
    const state = createSafeState();
    const result = isSafe(state);

    // The init step should have the original available vector.
    expect(result.steps[0].available).toEqual([3, 3, 2]);

    // After all releases, the final safe step should have
    // available = original available + sum of all allocations.
    const lastStep = result.steps[result.steps.length - 1];
    expect(lastStep.available[0]).toBeGreaterThanOrEqual(3);
  });
});

// ── requestResources Tests ────────────────────────────────────

describe('Banker\'s Algorithm -- requestResources', () => {
  it('grants a request that leads to a safe state', () => {
    const state = createSafeState();
    // P1 requests [1, 0, 2]: Need[P1] = [1, 2, 2], so [1, 0, 2] <= Need.
    const result = requestResources(state, 1, [1, 0, 2]);

    expect(result.granted).toBe(true);
    expect(result.newState).not.toBeNull();
    if (result.newState) {
      // Available should decrease by the request.
      expect(result.newState.available).toEqual([2, 3, 0]);
      // Allocation should increase.
      expect(result.newState.allocation[1]).toEqual([3, 0, 2]);
      // Need should decrease.
      expect(result.newState.need[1]).toEqual([0, 2, 0]);
    }
  });

  it('denies a request that exceeds the max need', () => {
    const state = createSafeState();
    // P0 max need for resource 0 is 7, allocation is 0, need is 7.
    // Request [8, 0, 0] exceeds need.
    const result = requestResources(state, 0, [8, 0, 0]);

    expect(result.granted).toBe(false);
    expect(result.newState).toBeNull();

    const denyStep = result.steps.find((s) => s.action === 'request-denied');
    expect(denyStep).toBeDefined();
    expect(denyStep!.description).toContain('exceeds max need');
  });

  it('denies a request that exceeds available resources', () => {
    const state = createSafeState();
    // Available = [3, 3, 2]. Request [4, 0, 0] exceeds available for resource 0.
    const result = requestResources(state, 0, [4, 0, 0]);

    expect(result.granted).toBe(false);
    expect(result.newState).toBeNull();

    const denyStep = result.steps.find((s) => s.action === 'request-denied');
    expect(denyStep).toBeDefined();
    expect(denyStep!.description).toContain('exceeds available');
  });

  it('produces trace steps showing the request check', () => {
    const state = createSafeState();
    const result = requestResources(state, 1, [1, 0, 2]);

    const requestCheck = result.steps.find((s) => s.action === 'request-check');
    expect(requestCheck).toBeDefined();
    expect(requestCheck!.description).toContain('P1 requests');
  });

  it('does not mutate the original state', () => {
    const state = createSafeState();
    const originalAvail = [...state.available];
    const originalAlloc = state.allocation.map((r) => [...r]);

    requestResources(state, 1, [1, 0, 2]);

    expect(state.available).toEqual(originalAvail);
    expect(state.allocation).toEqual(originalAlloc);
  });
});

// ── cloneBankersState Tests ───────────────────────────────────

describe('cloneBankersState', () => {
  it('produces a deep copy', () => {
    const state = createSafeState();
    const clone = cloneBankersState(state);

    // Mutate clone, check original is untouched.
    clone.available[0] = 999;
    clone.allocation[0][0] = 999;
    clone.max[0][0] = 999;
    clone.need[0][0] = 999;

    expect(state.available[0]).toBe(3);
    expect(state.allocation[0][0]).toBe(0);
    expect(state.max[0][0]).toBe(7);
    expect(state.need[0][0]).toBe(7);
  });
});
