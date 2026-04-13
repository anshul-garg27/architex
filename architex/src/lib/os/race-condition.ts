/**
 * Race Condition & Thread Interleaving Simulation  (OSC-075)
 *
 * Demonstrates the classic shared-counter race condition where two or
 * more threads each perform LOAD → INCREMENT → STORE as three
 * separate, non-atomic steps.  Without synchronization the
 * interleavings can cause lost updates; with a mutex the result is
 * always correct.
 *
 * Also provides {@link countPossibleInterleavings} to show the
 * combinatorial explosion of possible orderings.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InterleavingStep {
  tick: number;
  threadId: string;
  operation: 'load' | 'increment' | 'store';
  /** The value currently held in this thread's local register. */
  register: number;
  /** The value of the shared variable *after* this step executes. */
  sharedValue: number;
  description: string;
}

export interface InterleavingResult {
  steps: InterleavingStep[];
  finalValue: number;
  expectedValue: number;
  isCorrect: boolean;
  withMutex: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute the number of distinct interleavings of `threadCount`
 * threads each executing `stepsPerThread` atomic steps.
 *
 * This is the multinomial coefficient:
 *   (threadCount * stepsPerThread)! / (stepsPerThread!)^threadCount
 *
 * We compute incrementally (multiply-then-divide) to stay within
 * Number precision as long as possible, returning Infinity when
 * the result exceeds MAX_SAFE_INTEGER.
 */
function multinomialCount(threadCount: number, stepsPerThread: number): number {
  // For the multinomial (n*k)! / (k!)^n we can compute iteratively:
  // Result = product over each "group" of choosing positions for it.
  // Equivalent to C(n*k, k) * C((n-1)*k, k) * ... * C(k, k).
  //
  // Each binomial coefficient C(a, b) is computed with incremental
  // multiply/divide to keep intermediate values small.

  let result = 1;
  let remaining = threadCount * stepsPerThread;

  for (let t = 0; t < threadCount - 1; t++) {
    // Multiply by C(remaining, stepsPerThread)
    let binom = 1;
    for (let i = 0; i < stepsPerThread; i++) {
      binom = (binom * (remaining - i)) / (i + 1);
      if (!isFinite(binom) || binom > Number.MAX_SAFE_INTEGER) {
        return Infinity;
      }
    }
    result *= binom;
    if (!isFinite(result) || result > Number.MAX_SAFE_INTEGER) {
      return Infinity;
    }
    remaining -= stepsPerThread;
  }

  return Math.round(result);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate a race condition on a shared counter WITHOUT any
 * synchronization.
 *
 * Each thread performs `incrementsPerThread` increments where each
 * increment is three separate steps: LOAD, INCREMENT, STORE.  The
 * scheduler deliberately interleaves threads in a way that causes
 * lost updates, so the final value will be less than the expected
 * `threadCount * incrementsPerThread`.
 *
 * The interleaving strategy: after each thread completes its LOAD,
 * we context-switch to the next thread before the STORE, maximising
 * the chance of a lost update.
 */
export function simulateRaceCondition(
  threadCount: number,
  incrementsPerThread: number,
): InterleavingResult {
  const count = Math.max(2, Math.min(threadCount, 8));
  const increments = Math.max(1, Math.min(incrementsPerThread, 10));

  const steps: InterleavingStep[] = [];
  let sharedValue = 0;
  let tick = 0;

  // Thread state
  interface ThreadState {
    id: string;
    register: number;
    incrementsDone: number;
    /** Which micro-step the thread is on within the current increment. */
    phase: 'load' | 'increment' | 'store';
  }

  const threads: ThreadState[] = [];
  for (let i = 0; i < count; i++) {
    threads.push({
      id: `T${i}`,
      register: 0,
      incrementsDone: 0,
      phase: 'load',
    });
  }

  const expectedValue = count * increments;

  // -----------------------------------------------------------------------
  // Interleaving strategy for demonstrating the bug:
  //
  // For each increment round:
  //   1. ALL threads LOAD the shared value (they all read the same stale value)
  //   2. ALL threads INCREMENT their local register
  //   3. ALL threads STORE back — but they all write the same value,
  //      so (count - 1) updates are lost.
  //
  // This is the worst-case interleaving that produces the most dramatic
  // data loss, which is highly educational.
  // -----------------------------------------------------------------------

  for (let round = 0; round < increments; round++) {
    // Phase 1: All threads LOAD
    for (const t of threads) {
      t.register = sharedValue;
      t.phase = 'load';
      steps.push({
        tick,
        threadId: t.id,
        operation: 'load',
        register: t.register,
        sharedValue,
        description:
          `${t.id} loads shared counter (value=${sharedValue}) into its register` +
          (threads.indexOf(t) > 0
            ? ` — but ${threads[0].id} through ${threads[threads.indexOf(t) - 1].id} haven't stored their increments yet, so ${t.id} reads a stale value.`
            : `.`),
      });
      tick++;
    }

    // Phase 2: All threads INCREMENT their register
    for (const t of threads) {
      t.register += 1;
      t.phase = 'increment';
      steps.push({
        tick,
        threadId: t.id,
        operation: 'increment',
        register: t.register,
        sharedValue,
        description:
          `${t.id} increments its local register to ${t.register} — ` +
          `the shared counter is still ${sharedValue} because no thread has stored yet.`,
      });
      tick++;
    }

    // Phase 3: All threads STORE — only the last store "wins"
    for (let i = 0; i < threads.length; i++) {
      const t = threads[i];
      sharedValue = t.register;
      t.phase = 'store';
      t.incrementsDone++;

      const isLastThread = i === threads.length - 1;
      const lostUpdates = threads.length - 1;

      steps.push({
        tick,
        threadId: t.id,
        operation: 'store',
        register: t.register,
        sharedValue,
        description: isLastThread
          ? `${t.id} stores ${t.register} to shared counter. ` +
            `All ${threads.length} threads wrote the same value — ${lostUpdates} increment(s) lost this round!`
          : `${t.id} stores ${t.register} to shared counter — ` +
            `this write will be overwritten by subsequent threads in this round.`,
      });
      tick++;
    }
  }

  return {
    steps,
    finalValue: sharedValue,
    expectedValue,
    isCorrect: sharedValue === expectedValue,
    withMutex: false,
  };
}

/**
 * Simulate the same shared-counter workload WITH mutex protection.
 *
 * Each thread's LOAD → INCREMENT → STORE sequence is performed
 * atomically (no interleaving within one increment), so the final
 * value always equals `threadCount * incrementsPerThread`.
 */
export function simulateWithMutex(
  threadCount: number,
  incrementsPerThread: number,
): InterleavingResult {
  const count = Math.max(2, Math.min(threadCount, 8));
  const increments = Math.max(1, Math.min(incrementsPerThread, 10));

  const steps: InterleavingStep[] = [];
  let sharedValue = 0;
  let tick = 0;
  const expectedValue = count * increments;

  // Thread IDs
  const threadIds: string[] = [];
  for (let i = 0; i < count; i++) {
    threadIds.push(`T${i}`);
  }

  // With the mutex each thread runs its full LOAD → INCREMENT → STORE
  // atomically before the next thread gets a chance.  We round-robin
  // through threads, one increment at a time.

  for (let round = 0; round < increments; round++) {
    for (const tid of threadIds) {
      // LOAD
      const loadValue = sharedValue;
      steps.push({
        tick,
        threadId: tid,
        operation: 'load',
        register: loadValue,
        sharedValue,
        description:
          `${tid} acquires the mutex and loads shared counter (value=${loadValue}) into its register. ` +
          `No other thread can interleave because the mutex is held.`,
      });
      tick++;

      // INCREMENT
      const incremented = loadValue + 1;
      steps.push({
        tick,
        threadId: tid,
        operation: 'increment',
        register: incremented,
        sharedValue,
        description:
          `${tid} increments its local register to ${incremented}. ` +
          `The mutex guarantees this will be stored before any other thread reads.`,
      });
      tick++;

      // STORE
      sharedValue = incremented;
      steps.push({
        tick,
        threadId: tid,
        operation: 'store',
        register: incremented,
        sharedValue,
        description:
          `${tid} stores ${incremented} to shared counter and releases the mutex. ` +
          `The increment is safely committed — no lost update possible.`,
      });
      tick++;
    }
  }

  return {
    steps,
    finalValue: sharedValue,
    expectedValue,
    isCorrect: sharedValue === expectedValue,
    withMutex: true,
  };
}

/**
 * Count the number of possible interleavings of `threadCount` threads
 * each executing `stepsPerThread` atomic steps.
 *
 * For 2 threads x 3 steps each, there are C(6,3) = 20 interleavings.
 * For 3 threads x 3 steps each, there are 9!/(3!)^3 = 1680.
 *
 * This demonstrates why exhaustive testing of concurrent programs is
 * infeasible — the state space explodes combinatorially.
 */
export function countPossibleInterleavings(
  threadCount: number,
  stepsPerThread: number,
): number {
  const count = Math.max(1, threadCount);
  const steps = Math.max(1, stepsPerThread);
  return multinomialCount(count, steps);
}
