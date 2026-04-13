/**
 * Deadlock Visualizer (CON-008)
 *
 * Simulates a classic deadlock scenario with 2 threads and 2 resources
 * forming a circular wait, alongside a prevention strategy using
 * resource ordering.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DeadlockThread {
  id: string;
  holding: string[];
  waiting: string | null;
  state: 'running' | 'blocked' | 'deadlocked';
}

export interface DeadlockResource {
  id: string;
  owner: string | null;
}

export interface DeadlockStep {
  tick: number;
  threads: DeadlockThread[];
  resources: DeadlockResource[];
  description: string;
  isDeadlocked: boolean;
}

// ---------------------------------------------------------------------------
// 1. Simulate Deadlock — 2 threads, 2 resources, circular wait
// ---------------------------------------------------------------------------

/**
 * Thread-A acquires Resource-1 then tries Resource-2.
 * Thread-B acquires Resource-2 then tries Resource-1.
 * This creates a circular wait → deadlock.
 */
export function simulateDeadlock(): DeadlockStep[] {
  const steps: DeadlockStep[] = [];

  // Helper to snapshot thread/resource state
  const snap = (
    tick: number,
    threads: DeadlockThread[],
    resources: DeadlockResource[],
    description: string,
    isDeadlocked: boolean,
  ): DeadlockStep => ({
    tick,
    threads: threads.map((t) => ({ ...t, holding: [...t.holding] })),
    resources: resources.map((r) => ({ ...r })),
    description,
    isDeadlocked,
  });

  const threadA: DeadlockThread = { id: 'Thread-A', holding: [], waiting: null, state: 'running' };
  const threadB: DeadlockThread = { id: 'Thread-B', holding: [], waiting: null, state: 'running' };
  const resR1: DeadlockResource = { id: 'R1', owner: null };
  const resR2: DeadlockResource = { id: 'R2', owner: null };

  const threads = [threadA, threadB];
  const resources = [resR1, resR2];

  // Tick 0: Initial state
  steps.push(snap(0, threads, resources, 'Both threads start. Thread-A wants R1→R2, Thread-B wants R2→R1.', false));

  // Tick 1: Thread-A acquires R1
  threadA.holding.push('R1');
  resR1.owner = 'Thread-A';
  steps.push(snap(1, threads, resources, 'Thread-A acquires R1.', false));

  // Tick 2: Thread-B acquires R2
  threadB.holding.push('R2');
  resR2.owner = 'Thread-B';
  steps.push(snap(2, threads, resources, 'Thread-B acquires R2.', false));

  // Tick 3: Thread-A tries to acquire R2 — blocked (held by B)
  threadA.waiting = 'R2';
  threadA.state = 'blocked';
  steps.push(snap(3, threads, resources, 'Thread-A tries to acquire R2 — blocked (held by Thread-B).', false));

  // Tick 4: Thread-B tries to acquire R1 — blocked (held by A) → DEADLOCK
  threadB.waiting = 'R1';
  threadB.state = 'blocked';
  steps.push(snap(4, threads, resources, 'Thread-B tries to acquire R1 — blocked (held by Thread-A). Circular wait detected!', false));

  // Tick 5: Both threads deadlocked
  threadA.state = 'deadlocked';
  threadB.state = 'deadlocked';
  steps.push(snap(5, threads, resources, 'DEADLOCK: Thread-A holds R1, waits for R2. Thread-B holds R2, waits for R1. Neither can proceed.', true));

  return steps;
}

// ---------------------------------------------------------------------------
// 2. Simulate Deadlock Prevention — resource ordering
// ---------------------------------------------------------------------------

/**
 * Both threads acquire resources in the same order (R1 before R2).
 * This prevents circular wait and avoids deadlock.
 */
export function simulateDeadlockPrevention(): DeadlockStep[] {
  const steps: DeadlockStep[] = [];

  const snap = (
    tick: number,
    threads: DeadlockThread[],
    resources: DeadlockResource[],
    description: string,
    isDeadlocked: boolean,
  ): DeadlockStep => ({
    tick,
    threads: threads.map((t) => ({ ...t, holding: [...t.holding] })),
    resources: resources.map((r) => ({ ...r })),
    description,
    isDeadlocked,
  });

  const threadA: DeadlockThread = { id: 'Thread-A', holding: [], waiting: null, state: 'running' };
  const threadB: DeadlockThread = { id: 'Thread-B', holding: [], waiting: null, state: 'running' };
  const resR1: DeadlockResource = { id: 'R1', owner: null };
  const resR2: DeadlockResource = { id: 'R2', owner: null };

  const threads = [threadA, threadB];
  const resources = [resR1, resR2];

  // Tick 0: Initial state
  steps.push(snap(0, threads, resources, 'Both threads use resource ordering: always acquire R1 before R2.', false));

  // Tick 1: Thread-A acquires R1
  threadA.holding.push('R1');
  resR1.owner = 'Thread-A';
  steps.push(snap(1, threads, resources, 'Thread-A acquires R1 (lowest-numbered first).', false));

  // Tick 2: Thread-B tries to acquire R1 — blocked (held by A)
  threadB.waiting = 'R1';
  threadB.state = 'blocked';
  steps.push(snap(2, threads, resources, 'Thread-B tries to acquire R1 — blocked (held by Thread-A). It waits instead of grabbing R2.', false));

  // Tick 3: Thread-A acquires R2 (both resources held)
  threadA.holding.push('R2');
  resR2.owner = 'Thread-A';
  steps.push(snap(3, threads, resources, 'Thread-A acquires R2. It now holds both resources and proceeds.', false));

  // Tick 4: Thread-A releases both resources
  threadA.holding = [];
  resR1.owner = null;
  resR2.owner = null;
  steps.push(snap(4, threads, resources, 'Thread-A finishes and releases R1 and R2.', false));

  // Tick 5: Thread-B unblocked, acquires R1
  threadB.waiting = null;
  threadB.state = 'running';
  threadB.holding.push('R1');
  resR1.owner = 'Thread-B';
  steps.push(snap(5, threads, resources, 'Thread-B unblocked — acquires R1.', false));

  // Tick 6: Thread-B acquires R2
  threadB.holding.push('R2');
  resR2.owner = 'Thread-B';
  steps.push(snap(6, threads, resources, 'Thread-B acquires R2. Both resources held, proceeds.', false));

  // Tick 7: Thread-B releases both
  threadB.holding = [];
  resR1.owner = null;
  resR2.owner = null;
  steps.push(snap(7, threads, resources, 'Thread-B finishes and releases both resources. No deadlock occurred!', false));

  return steps;
}
