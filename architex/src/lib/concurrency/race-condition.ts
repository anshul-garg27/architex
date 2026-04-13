/**
 * Race Condition Demonstrator
 *
 * Simulates concurrent increment operations on a shared counter to
 * illustrate the difference between unsynchronised (racy) and
 * mutex-protected (safe) access patterns.
 *
 * The simulation is deterministic and produces an ordered event log
 * showing exactly when each thread reads, writes, acquires, or releases
 * a lock. The interleaving is synthetic (round-robin with deliberate
 * overlap for the unsafe variant) to guarantee that the race is visible.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThreadEvent {
  tick: number;
  threadId: string;
  action: 'read' | 'write' | 'lock' | 'unlock' | 'wait' | 'signal';
  variable: string;
  value: number;
  description: string;
}

export interface RaceConditionDemo {
  events: ThreadEvent[];
  finalValue: number;
  expectedValue: number;
  hasRace: boolean;
  explanation: string;
}

// ---------------------------------------------------------------------------
// 1. Unsafe Increment (demonstrates race condition)
// ---------------------------------------------------------------------------

/**
 * Simulate concurrent increments *without* synchronisation.
 *
 * The interleaving is deliberately constructed so that multiple threads
 * read the same stale value before any of them writes back, causing lost
 * updates. This makes the race condition clearly visible in the event log.
 *
 * @param threadCount        - Number of concurrent threads.
 * @param incrementsPerThread - How many increments each thread performs.
 */
export function unsafeIncrement(
  threadCount: number,
  incrementsPerThread: number,
): RaceConditionDemo {
  const events: ThreadEvent[] = [];
  let tick = 0;
  let sharedCounter = 0;
  const expectedValue = threadCount * incrementsPerThread;

  // For each increment round we interleave reads before writes to show races.
  for (let round = 0; round < incrementsPerThread; round++) {
    // Phase 1: all threads READ the current counter value (stale read)
    const localValues: number[] = [];
    for (let t = 0; t < threadCount; t++) {
      const threadId = `thread-${t}`;
      localValues.push(sharedCounter);
      events.push({
        tick: tick++,
        threadId,
        action: 'read',
        variable: 'counter',
        value: sharedCounter,
        description: `${threadId} reads counter = ${sharedCounter}`,
      });
    }

    // Phase 2: all threads WRITE localValue + 1 (all based on the same stale read)
    for (let t = 0; t < threadCount; t++) {
      const threadId = `thread-${t}`;
      const newValue = localValues[t] + 1;
      sharedCounter = newValue; // last writer wins
      events.push({
        tick: tick++,
        threadId,
        action: 'write',
        variable: 'counter',
        value: newValue,
        description: `${threadId} writes counter = ${newValue} (based on stale read ${localValues[t]})`,
      });
    }
  }

  return {
    events,
    finalValue: sharedCounter,
    expectedValue,
    hasRace: true,
    explanation:
      `Without synchronisation, all ${threadCount} threads read the same stale ` +
      `value in each round, then overwrite each other's increments. After ` +
      `${incrementsPerThread} rounds the counter is ${sharedCounter} instead ` +
      `of the expected ${expectedValue}. This is a classic lost-update race condition.`,
  };
}

// ---------------------------------------------------------------------------
// 1b. Randomised Unsafe Increment (for histogram / Monte Carlo runs)
// ---------------------------------------------------------------------------

/**
 * Like `unsafeIncrement`, but with a **random** interleaving each call.
 *
 * In each "round" of increments a random subset of threads may read the
 * stale value before any of them write. This models the non-deterministic
 * scheduling seen in real concurrent execution. Because the interleaving
 * differs every run, calling this function repeatedly produces a
 * distribution of final counter values -- perfect for a histogram.
 *
 * Returns only the final counter value (no event log) for efficiency.
 */
export function unsafeIncrementRandom(
  threadCount: number,
  incrementsPerThread: number,
): number {
  let sharedCounter = 0;

  for (let round = 0; round < incrementsPerThread; round++) {
    // Decide a random interleaving for this round.
    // Each thread independently either reads before any writes (stale)
    // or reads-then-writes atomically (lucky).
    const localValues: number[] = [];
    const writeOrder: number[] = [];

    // Shuffle thread order for reads
    const readOrder = Array.from({ length: threadCount }, (_, i) => i);
    for (let i = readOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [readOrder[i], readOrder[j]] = [readOrder[j], readOrder[i]];
    }

    // Each thread reads (some may read before others write)
    // Simulate: randomly pick how many threads read before the first write
    const staleReaders = Math.floor(Math.random() * (threadCount + 1));

    // Phase 1: first `staleReaders` threads read the stale value
    for (let i = 0; i < staleReaders; i++) {
      localValues[readOrder[i]] = sharedCounter;
    }

    // Phase 2: stale readers write (last writer wins among them)
    for (let i = 0; i < staleReaders; i++) {
      const t = readOrder[i];
      sharedCounter = localValues[t] + 1;
    }

    // Phase 3: remaining threads do read-then-write sequentially (no race)
    for (let i = staleReaders; i < threadCount; i++) {
      const readVal = sharedCounter;
      sharedCounter = readVal + 1;
    }
  }

  return sharedCounter;
}

// ---------------------------------------------------------------------------
// 2. Safe Increment (mutex-protected)
// ---------------------------------------------------------------------------

/**
 * Simulate concurrent increments *with* a mutex protecting the critical
 * section. Each thread acquires the lock, reads, increments, writes, then
 * releases. No interleaving occurs inside the critical section, so the
 * final counter value matches the expected total.
 *
 * @param threadCount        - Number of concurrent threads.
 * @param incrementsPerThread - How many increments each thread performs.
 */
export function safeIncrement(
  threadCount: number,
  incrementsPerThread: number,
): RaceConditionDemo {
  const events: ThreadEvent[] = [];
  let tick = 0;
  let sharedCounter = 0;
  const expectedValue = threadCount * incrementsPerThread;

  // Simple round-robin scheduling: each thread takes turns holding the lock.
  for (let round = 0; round < incrementsPerThread; round++) {
    for (let t = 0; t < threadCount; t++) {
      const threadId = `thread-${t}`;

      // Acquire lock
      events.push({
        tick: tick++,
        threadId,
        action: 'lock',
        variable: 'mutex',
        value: 1,
        description: `${threadId} acquires mutex`,
      });

      // Read
      const readValue = sharedCounter;
      events.push({
        tick: tick++,
        threadId,
        action: 'read',
        variable: 'counter',
        value: readValue,
        description: `${threadId} reads counter = ${readValue} (inside critical section)`,
      });

      // Write
      sharedCounter = readValue + 1;
      events.push({
        tick: tick++,
        threadId,
        action: 'write',
        variable: 'counter',
        value: sharedCounter,
        description: `${threadId} writes counter = ${sharedCounter}`,
      });

      // Release lock
      events.push({
        tick: tick++,
        threadId,
        action: 'unlock',
        variable: 'mutex',
        value: 0,
        description: `${threadId} releases mutex`,
      });
    }
  }

  return {
    events,
    finalValue: sharedCounter,
    expectedValue,
    hasRace: false,
    explanation:
      `With mutex protection each thread's read-modify-write is atomic. ` +
      `After ${threadCount} threads x ${incrementsPerThread} increments the ` +
      `counter correctly equals ${expectedValue}. No lost updates occur.`,
  };
}
