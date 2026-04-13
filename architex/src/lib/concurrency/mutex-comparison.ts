/**
 * Mutex Implementation Comparison (CON-011)
 *
 * Simulates three lock implementations side-by-side to compare their
 * CPU usage, latency, and suitability for different critical-section
 * durations:
 *
 * 1. **SpinLock** -- Busy-wait loop using test-and-set. Low latency
 *    for very short critical sections but wastes CPU cycles spinning.
 *
 * 2. **Mutex (blocking)** -- Threads sleep when the lock is held and
 *    are woken on release. Efficient CPU usage but higher context-switch
 *    latency, making it better for longer critical sections.
 *
 * 3. **TTAS (Test-and-Test-and-Set)** -- First reads the lock with a
 *    regular load; only attempts an atomic TAS if the lock appears free.
 *    Reduces bus/cache traffic compared to naive spinlock.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MutexThreadState =
  | 'running'
  | 'spinning'
  | 'sleeping'
  | 'acquired'
  | 'released';

export interface MutexThreadSnapshot {
  id: string;
  state: MutexThreadState;
  cpuCycles: number;
}

export interface MutexStep {
  tick: number;
  threads: MutexThreadSnapshot[];
  lockState: 'free' | 'held';
  description: string;
  /** Cumulative CPU cycles burned at this tick (spinning = +cycles, sleeping = +0). */
  cpuCycles: number;
}

export interface MutexMetrics {
  lockType: string;
  totalCpuCycles: number;
  totalTicks: number;
  avgWaitTicks: number;
  throughput: number;
  recommendation: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function snap(
  tick: number,
  threads: MutexThreadSnapshot[],
  lockState: 'free' | 'held',
  description: string,
  cpuCycles: number,
): MutexStep {
  return {
    tick,
    threads: threads.map((t) => ({ ...t })),
    lockState,
    description,
    cpuCycles,
  };
}

// ---------------------------------------------------------------------------
// 1. SpinLock -- busy-wait
// ---------------------------------------------------------------------------

/**
 * Simulates a naive SpinLock (test-and-set loop).
 *
 * When a thread cannot acquire the lock it spins (burns CPU cycles)
 * each tick until the lock becomes free.
 *
 * @param threadCount - Number of threads competing for the lock.
 * @param csTime      - Number of ticks spent holding the lock (critical section).
 */
export function simulateSpinLock(
  threadCount: number,
  csTime: number,
): MutexStep[] {
  const steps: MutexStep[] = [];
  let tick = 0;
  let totalCpu = 0;

  const threads: MutexThreadSnapshot[] = Array.from(
    { length: threadCount },
    (_, i) => ({
      id: `T${i}`,
      state: 'running' as MutexThreadState,
      cpuCycles: 0,
    }),
  );

  // Initial state
  steps.push(snap(tick++, threads, 'free', 'All threads ready. Lock is free.', totalCpu));

  // Each thread takes a turn holding the lock
  for (let owner = 0; owner < threadCount; owner++) {
    // Acquire
    threads[owner].state = 'acquired';
    threads[owner].cpuCycles += 1; // TAS cost
    totalCpu += 1;

    // Others start spinning
    for (let j = 0; j < threadCount; j++) {
      if (j !== owner) {
        threads[j].state = j > owner ? 'spinning' : 'running';
      }
    }

    steps.push(
      snap(tick++, threads, 'held', `${threads[owner].id} acquires lock (TAS succeeds).`, totalCpu),
    );

    // Critical section ticks -- others spin
    for (let cs = 0; cs < csTime; cs++) {
      for (let j = 0; j < threadCount; j++) {
        if (j !== owner && j > owner) {
          // Spinning threads burn CPU
          threads[j].cpuCycles += 4; // each spin iteration costs cycles
          totalCpu += 4;
          threads[j].state = 'spinning';
        }
      }
      threads[owner].cpuCycles += 1;
      totalCpu += 1;
      steps.push(
        snap(
          tick++,
          threads,
          'held',
          `${threads[owner].id} in critical section (tick ${cs + 1}/${csTime}). ` +
            `${threadCount - owner - 1} thread(s) busy-waiting.`,
          totalCpu,
        ),
      );
    }

    // Release
    threads[owner].state = 'released';
    steps.push(
      snap(tick++, threads, 'free', `${threads[owner].id} releases lock.`, totalCpu),
    );
  }

  // Final state
  for (const t of threads) t.state = 'released';
  steps.push(snap(tick, threads, 'free', 'All threads completed.', totalCpu));

  return steps;
}

// ---------------------------------------------------------------------------
// 2. Mutex (blocking) -- sleep/wake
// ---------------------------------------------------------------------------

/**
 * Simulates a blocking Mutex (sleep on contention, wake on release).
 *
 * Threads that cannot acquire the lock go to sleep (0 CPU) and are
 * woken up when the lock holder releases. Context-switch cost is
 * modelled as extra ticks on wake-up.
 *
 * @param threadCount - Number of threads competing for the lock.
 * @param csTime      - Number of ticks spent holding the lock (critical section).
 */
export function simulateMutex(
  threadCount: number,
  csTime: number,
): MutexStep[] {
  const steps: MutexStep[] = [];
  let tick = 0;
  let totalCpu = 0;
  const CONTEXT_SWITCH_COST = 2; // ticks added when waking

  const threads: MutexThreadSnapshot[] = Array.from(
    { length: threadCount },
    (_, i) => ({
      id: `T${i}`,
      state: 'running' as MutexThreadState,
      cpuCycles: 0,
    }),
  );

  steps.push(snap(tick++, threads, 'free', 'All threads ready. Lock is free.', totalCpu));

  for (let owner = 0; owner < threadCount; owner++) {
    // Acquire
    threads[owner].state = 'acquired';
    threads[owner].cpuCycles += 1;
    totalCpu += 1;

    // Others go to sleep
    for (let j = 0; j < threadCount; j++) {
      if (j !== owner && j > owner) {
        threads[j].state = 'sleeping';
      }
    }

    steps.push(
      snap(tick++, threads, 'held', `${threads[owner].id} acquires lock. Others sleep (0 CPU).`, totalCpu),
    );

    // Critical section ticks -- others are sleeping (0 CPU cost)
    for (let cs = 0; cs < csTime; cs++) {
      threads[owner].cpuCycles += 1;
      totalCpu += 1;
      // Sleeping threads burn 0 cycles
      steps.push(
        snap(
          tick++,
          threads,
          'held',
          `${threads[owner].id} in critical section (tick ${cs + 1}/${csTime}). ` +
            `${threadCount - owner - 1} thread(s) sleeping.`,
          totalCpu,
        ),
      );
    }

    // Release + context switch cost for wake-up
    threads[owner].state = 'released';
    steps.push(
      snap(tick++, threads, 'free', `${threads[owner].id} releases lock. Waking next thread...`, totalCpu),
    );

    // Model context switch overhead
    if (owner < threadCount - 1) {
      for (let w = 0; w < CONTEXT_SWITCH_COST; w++) {
        totalCpu += 1;
        threads[owner + 1].cpuCycles += 1;
        steps.push(
          snap(
            tick++,
            threads,
            'free',
            `Context switch overhead (${w + 1}/${CONTEXT_SWITCH_COST}) waking ${threads[owner + 1].id}.`,
            totalCpu,
          ),
        );
      }
    }
  }

  for (const t of threads) t.state = 'released';
  steps.push(snap(tick, threads, 'free', 'All threads completed.', totalCpu));

  return steps;
}

// ---------------------------------------------------------------------------
// 3. TTAS (Test-and-Test-and-Set)
// ---------------------------------------------------------------------------

/**
 * Simulates Test-and-Test-and-Set lock.
 *
 * Threads first read the lock with a regular (cached) load. Only if
 * the lock appears free do they attempt an expensive atomic TAS. This
 * dramatically reduces bus/interconnect traffic compared to naive
 * spinlock, especially under high contention.
 *
 * @param threadCount - Number of threads competing for the lock.
 * @param csTime      - Number of ticks spent holding the lock (critical section).
 */
export function simulateTTAS(
  threadCount: number,
  csTime: number,
): MutexStep[] {
  const steps: MutexStep[] = [];
  let tick = 0;
  let totalCpu = 0;

  const threads: MutexThreadSnapshot[] = Array.from(
    { length: threadCount },
    (_, i) => ({
      id: `T${i}`,
      state: 'running' as MutexThreadState,
      cpuCycles: 0,
    }),
  );

  steps.push(snap(tick++, threads, 'free', 'All threads ready. Lock is free.', totalCpu));

  for (let owner = 0; owner < threadCount; owner++) {
    // Acquire
    threads[owner].state = 'acquired';
    threads[owner].cpuCycles += 1;
    totalCpu += 1;

    // Others spin with TTAS (cheaper per iteration: test from cache first)
    for (let j = 0; j < threadCount; j++) {
      if (j !== owner && j > owner) {
        threads[j].state = 'spinning';
      }
    }

    steps.push(
      snap(
        tick++,
        threads,
        'held',
        `${threads[owner].id} acquires lock (TAS after local test).`,
        totalCpu,
      ),
    );

    // Critical section ticks -- TTAS spinners use fewer cycles per tick
    for (let cs = 0; cs < csTime; cs++) {
      for (let j = 0; j < threadCount; j++) {
        if (j !== owner && j > owner) {
          // TTAS: 1 cycle local read (cache hit) vs 4 cycles for naive TAS
          threads[j].cpuCycles += 1;
          totalCpu += 1;
          threads[j].state = 'spinning';
        }
      }
      threads[owner].cpuCycles += 1;
      totalCpu += 1;
      steps.push(
        snap(
          tick++,
          threads,
          'held',
          `${threads[owner].id} in critical section (tick ${cs + 1}/${csTime}). ` +
            `${threadCount - owner - 1} thread(s) test-spinning (cache reads).`,
          totalCpu,
        ),
      );
    }

    // On release, waiting threads detect free via local test, then 1 TAS attempt each
    // The winner spends 1 TAS cycle; losers each spend 1 TAS cycle that fails
    const waitingCount = threadCount - owner - 1;
    if (waitingCount > 0) {
      for (let j = owner + 1; j < threadCount; j++) {
        threads[j].cpuCycles += 1; // failed TAS on release detection
        totalCpu += 1;
      }
    }

    threads[owner].state = 'released';
    steps.push(
      snap(
        tick++,
        threads,
        'free',
        `${threads[owner].id} releases lock.` +
          (waitingCount > 0 ? ` ${waitingCount} thread(s) detect free via cache, attempt TAS.` : ''),
        totalCpu,
      ),
    );
  }

  for (const t of threads) t.state = 'released';
  steps.push(snap(tick, threads, 'free', 'All threads completed.', totalCpu));

  return steps;
}

// ---------------------------------------------------------------------------
// Metrics computation
// ---------------------------------------------------------------------------

export function computeMetrics(
  steps: MutexStep[],
  lockType: string,
  threadCount: number,
  csTime: number,
): MutexMetrics {
  const totalTicks = steps.length > 0 ? steps[steps.length - 1].tick : 0;
  const totalCpuCycles = steps.length > 0 ? steps[steps.length - 1].cpuCycles : 0;

  // Average wait ticks per thread (ticks where thread is spinning or sleeping)
  let totalWaitTicks = 0;
  for (const step of steps) {
    for (const t of step.threads) {
      if (t.state === 'spinning' || t.state === 'sleeping') {
        totalWaitTicks += 1;
      }
    }
  }
  const avgWaitTicks = threadCount > 0 ? totalWaitTicks / threadCount : 0;

  // Throughput: threads completed per tick
  const throughput = totalTicks > 0 ? threadCount / totalTicks : 0;

  let recommendation: string;
  if (lockType === 'SpinLock') {
    recommendation = csTime <= 2
      ? 'Good for short CS (< few us). Minimal latency, but wastes CPU under contention.'
      : 'Poor choice for long CS. CPU cycles wasted spinning scale with hold time.';
  } else if (lockType === 'Mutex') {
    recommendation = csTime >= 3
      ? 'Ideal for long CS. Sleeping threads free CPU for useful work.'
      : 'Overhead of context switches can hurt for very short CS durations.';
  } else {
    recommendation = 'Best general-purpose spinlock. Reduces bus traffic vs naive TAS while keeping low latency.';
  }

  return {
    lockType,
    totalCpuCycles,
    totalTicks,
    avgWaitTicks: Math.round(avgWaitTicks * 10) / 10,
    throughput: Math.round(throughput * 1000) / 1000,
    recommendation,
  };
}
