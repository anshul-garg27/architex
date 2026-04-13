/**
 * Thread Synchronization Primitive Simulations  (OSC-011)
 *
 * Simulates three classic concurrency primitives -- Mutex, Counting
 * Semaphore, and Reader-Writer Lock -- and emits a tick-by-tick
 * {@link SyncEvent} log suitable for step-through visualization.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncEvent {
  tick: number;
  threadId: string;
  action: 'acquire' | 'release' | 'wait' | 'signal' | 'blocked';
  primitive: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Mutex Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate `threadCount` threads competing for a single mutex.
 *
 * Each thread performs several lock/critical-section/unlock cycles.
 * Only one thread may hold the lock at a time; others are blocked
 * until the holder releases it.
 */
export function simulateMutex(threadCount: number): SyncEvent[] {
  const events: SyncEvent[] = [];
  const clamp = Math.max(2, Math.min(threadCount, 8));

  // Thread work plan: each thread will try to acquire the mutex
  // a fixed number of times, spend some ticks in the critical section,
  // then release.
  interface ThreadPlan {
    id: string;
    csLength: number; // ticks spent in critical section per cycle
    cycles: number;
    cyclesDone: number;
    csRemaining: number; // ticks left in current critical section hold
    state: 'idle' | 'waiting' | 'holding';
    nextArrival: number; // tick when the thread first requests the lock
  }

  const plans: ThreadPlan[] = [];
  for (let i = 0; i < clamp; i++) {
    plans.push({
      id: `T${i}`,
      csLength: 2 + (i % 3),
      cycles: 2,
      cyclesDone: 0,
      csRemaining: 0,
      state: 'idle',
      nextArrival: i, // stagger arrivals
    });
  }

  let holder: string | null = null;
  const waitQueue: string[] = [];
  let tick = 0;
  const MAX_TICKS = 200;

  while (tick < MAX_TICKS) {
    const allDone = plans.every((p) => p.cyclesDone >= p.cycles);
    if (allDone) break;

    // 1. Threads arriving at this tick request the lock
    for (const p of plans) {
      if (p.state === 'idle' && p.nextArrival === tick && p.cyclesDone < p.cycles) {
        if (holder === null) {
          holder = p.id;
          p.state = 'holding';
          p.csRemaining = p.csLength;
          events.push({
            tick,
            threadId: p.id,
            action: 'acquire',
            primitive: 'Mutex',
            description: `${p.id} acquires the mutex — ${p.id} is now the OWNER and only ${p.id} can release it. KEY DISTINCTION: A mutex has OWNERSHIP — only the thread that locked it can unlock it. This is NOT the same as a binary semaphore.`,
          });
        } else {
          p.state = 'waiting';
          waitQueue.push(p.id);
          events.push({
            tick,
            threadId: p.id,
            action: 'blocked',
            primitive: 'Mutex',
            description: `${p.id} blocked — mutex held by ${holder}. Only one thread can hold a mutex at a time`,
          });
        }
      }
    }

    // 2. Holder spends a tick in CS
    if (holder !== null) {
      const hp = plans.find((p) => p.id === holder)!;
      hp.csRemaining--;
      if (hp.csRemaining <= 0) {
        // Release
        events.push({
          tick,
          threadId: hp.id,
          action: 'release',
          primitive: 'Mutex',
          description: `${hp.id} releases the mutex — only the owner can release it. Ownership transfers to the next waiting thread`,
        });
        hp.cyclesDone++;
        hp.state = 'idle';
        hp.nextArrival = tick + 2; // will retry after a gap
        holder = null;

        // Wake next waiter
        if (waitQueue.length > 0) {
          const nextId = waitQueue.shift()!;
          const np = plans.find((p) => p.id === nextId)!;
          holder = nextId;
          np.state = 'holding';
          np.csRemaining = np.csLength;
          events.push({
            tick,
            threadId: nextId,
            action: 'acquire',
            primitive: 'Mutex',
            description: `${nextId} acquires the mutex (was waiting) — ${nextId} is now the OWNER and only ${nextId} can release it. KEY DISTINCTION: A mutex has OWNERSHIP — only the thread that locked it can unlock it. This is NOT the same as a binary semaphore.`,
          });
        }
      }
    }

    tick++;
  }

  return events;
}

// ---------------------------------------------------------------------------
// Counting Semaphore Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate `threadCount` threads contending on a counting semaphore
 * with the given number of `permits`.
 */
export function simulateSemaphore(
  threadCount: number,
  permits: number,
): SyncEvent[] {
  const events: SyncEvent[] = [];
  const clamp = Math.max(2, Math.min(threadCount, 8));
  const maxPermits = Math.max(1, Math.min(permits, clamp - 1));

  interface ThreadPlan {
    id: string;
    holdTime: number;
    cycles: number;
    cyclesDone: number;
    holdRemaining: number;
    state: 'idle' | 'waiting' | 'holding';
    nextArrival: number;
  }

  const plans: ThreadPlan[] = [];
  for (let i = 0; i < clamp; i++) {
    plans.push({
      id: `T${i}`,
      holdTime: 2 + (i % 2),
      cycles: 2,
      cyclesDone: 0,
      holdRemaining: 0,
      state: 'idle',
      nextArrival: i,
    });
  }

  let available = maxPermits;
  const waitQueue: string[] = [];
  let tick = 0;
  const MAX_TICKS = 200;

  while (tick < MAX_TICKS) {
    const allDone = plans.every((p) => p.cyclesDone >= p.cycles);
    if (allDone) break;

    // 1. New arrivals try to acquire a permit
    for (const p of plans) {
      if (p.state === 'idle' && p.nextArrival === tick && p.cyclesDone < p.cycles) {
        if (available > 0) {
          available--;
          p.state = 'holding';
          p.holdRemaining = p.holdTime;
          events.push({
            tick,
            threadId: p.id,
            action: 'acquire',
            primitive: 'Semaphore',
            description: `${p.id} acquires permit (${available}/${maxPermits} remaining) — semaphore decremented, any thread can signal (no ownership)`,
          });
        } else {
          p.state = 'waiting';
          waitQueue.push(p.id);
          events.push({
            tick,
            threadId: p.id,
            action: 'blocked',
            primitive: 'Semaphore',
            description: `${p.id} blocked — no permits available (0/${maxPermits}), must wait for a signal`,
          });
        }
      }
    }

    // 2. Holders decrement hold time
    for (const p of plans) {
      if (p.state === 'holding') {
        p.holdRemaining--;
        if (p.holdRemaining <= 0) {
          available++;
          p.cyclesDone++;
          p.state = 'idle';
          p.nextArrival = tick + 2;
          events.push({
            tick,
            threadId: p.id,
            action: 'signal',
            primitive: 'Semaphore',
            description: `${p.id} releases permit (${available}/${maxPermits} remaining) — semaphore incremented, any thread can signal (no ownership)`,
          });

          // Wake a waiter if possible
          if (waitQueue.length > 0 && available > 0) {
            const nextId = waitQueue.shift()!;
            const np = plans.find((pp) => pp.id === nextId)!;
            available--;
            np.state = 'holding';
            np.holdRemaining = np.holdTime;
            events.push({
              tick,
              threadId: nextId,
              action: 'acquire',
              primitive: 'Semaphore',
              description: `${nextId} acquires permit (was waiting, ${available}/${maxPermits} remaining) — semaphore decremented, any thread can signal (no ownership)`,
            });
          }
        }
      }
    }

    tick++;
  }

  return events;
}

// ---------------------------------------------------------------------------
// Reader-Writer Lock Simulation
// ---------------------------------------------------------------------------

/**
 * Simulate a reader-writer lock with `readers` reader threads and
 * `writers` writer threads.
 *
 * Multiple readers may hold the lock simultaneously, but a writer
 * requires exclusive access.  Writers are prioritized to prevent
 * starvation.
 */
export function simulateReaderWriterLock(
  readers: number,
  writers: number,
): SyncEvent[] {
  const events: SyncEvent[] = [];
  const rCount = Math.max(1, Math.min(readers, 6));
  const wCount = Math.max(1, Math.min(writers, 4));

  type Role = 'reader' | 'writer';

  interface ThreadPlan {
    id: string;
    role: Role;
    holdTime: number;
    cycles: number;
    cyclesDone: number;
    holdRemaining: number;
    state: 'idle' | 'waiting' | 'holding';
    nextArrival: number;
  }

  const plans: ThreadPlan[] = [];
  for (let i = 0; i < rCount; i++) {
    plans.push({
      id: `R${i}`,
      role: 'reader',
      holdTime: 2,
      cycles: 2,
      cyclesDone: 0,
      holdRemaining: 0,
      state: 'idle',
      nextArrival: i,
    });
  }
  for (let i = 0; i < wCount; i++) {
    plans.push({
      id: `W${i}`,
      role: 'writer',
      holdTime: 3,
      cycles: 2,
      cyclesDone: 0,
      holdRemaining: 0,
      state: 'idle',
      nextArrival: i + 1, // writers arrive slightly later
    });
  }

  let activeReaders = 0;
  let activeWriter: string | null = null;
  const waitQueue: string[] = []; // FIFO; writers get priority check
  let tick = 0;
  const MAX_TICKS = 200;

  const canAdmitReader = () => activeWriter === null;
  const canAdmitWriter = () => activeWriter === null && activeReaders === 0;

  while (tick < MAX_TICKS) {
    const allDone = plans.every((p) => p.cyclesDone >= p.cycles);
    if (allDone) break;

    // 1. New arrivals
    for (const p of plans) {
      if (p.state === 'idle' && p.nextArrival === tick && p.cyclesDone < p.cycles) {
        if (p.role === 'reader' && canAdmitReader()) {
          activeReaders++;
          p.state = 'holding';
          p.holdRemaining = p.holdTime;
          events.push({
            tick,
            threadId: p.id,
            action: 'acquire',
            primitive: 'RWLock',
            description: `${p.id} acquires read lock (${activeReaders} active readers) — multiple readers allowed simultaneously`,
          });
        } else if (p.role === 'writer' && canAdmitWriter()) {
          activeWriter = p.id;
          p.state = 'holding';
          p.holdRemaining = p.holdTime;
          events.push({
            tick,
            threadId: p.id,
            action: 'acquire',
            primitive: 'RWLock',
            description: `${p.id} acquires write lock (exclusive) — writers require exclusive access, blocking all readers and other writers`,
          });
        } else {
          p.state = 'waiting';
          waitQueue.push(p.id);
          const reason =
            p.role === 'writer'
              ? activeWriter
                ? `writer ${activeWriter} holds lock`
                : `${activeReaders} readers active`
              : `writer ${activeWriter} holds lock`;
          events.push({
            tick,
            threadId: p.id,
            action: 'blocked',
            primitive: 'RWLock',
            description: `${p.id} blocked — ${reason}. Writers have priority to prevent writer starvation`,
          });
        }
      }
    }

    // 2. Holders work
    // Writer release
    if (activeWriter !== null) {
      const wp = plans.find((p) => p.id === activeWriter)!;
      wp.holdRemaining--;
      if (wp.holdRemaining <= 0) {
        events.push({
          tick,
          threadId: wp.id,
          action: 'release',
          primitive: 'RWLock',
          description: `${wp.id} releases write lock — exclusive access ended, waiting threads may now proceed`,
        });
        wp.cyclesDone++;
        wp.state = 'idle';
        wp.nextArrival = tick + 3;
        activeWriter = null;
      }
    }

    // Reader releases
    for (const p of plans) {
      if (p.role === 'reader' && p.state === 'holding') {
        p.holdRemaining--;
        if (p.holdRemaining <= 0) {
          activeReaders--;
          events.push({
            tick,
            threadId: p.id,
            action: 'release',
            primitive: 'RWLock',
            description: `${p.id} releases read lock (${activeReaders} active readers) — when all readers release, waiting writers can proceed`,
          });
          p.cyclesDone++;
          p.state = 'idle';
          p.nextArrival = tick + 2;
        }
      }
    }

    // 3. Try to wake waiters (writer-priority)
    // First check if a writer can be admitted
    if (activeWriter === null) {
      // Try writers first (priority)
      const writerIdx = waitQueue.findIndex((id) => {
        const tp = plans.find((p) => p.id === id)!;
        return tp.role === 'writer';
      });
      if (writerIdx >= 0 && canAdmitWriter()) {
        const wId = waitQueue.splice(writerIdx, 1)[0];
        const wp = plans.find((p) => p.id === wId)!;
        activeWriter = wId;
        wp.state = 'holding';
        wp.holdRemaining = wp.holdTime;
        events.push({
          tick,
          threadId: wId,
          action: 'acquire',
          primitive: 'RWLock',
          description: `${wId} acquires write lock (was waiting, exclusive) — writers require exclusive access, blocking all readers and other writers`,
        });
      } else if (writerIdx < 0) {
        // No writers waiting -- admit all waiting readers
        const readersToAdmit: number[] = [];
        for (let i = 0; i < waitQueue.length; i++) {
          const tp = plans.find((p) => p.id === waitQueue[i])!;
          if (tp.role === 'reader') readersToAdmit.push(i);
        }
        // Remove in reverse order to keep indices valid
        for (let j = readersToAdmit.length - 1; j >= 0; j--) {
          const idx = readersToAdmit[j];
          const rId = waitQueue.splice(idx, 1)[0];
          const rp = plans.find((p) => p.id === rId)!;
          activeReaders++;
          rp.state = 'holding';
          rp.holdRemaining = rp.holdTime;
          events.push({
            tick,
            threadId: rId,
            action: 'acquire',
            primitive: 'RWLock',
            description: `${rId} acquires read lock (was waiting, ${activeReaders} active readers) — multiple readers allowed simultaneously`,
          });
        }
      }
    }

    tick++;
  }

  return events;
}

// ---------------------------------------------------------------------------
// Condition Variable Simulation (OSC-069)
// ---------------------------------------------------------------------------

/**
 * Simulate the classic bounded-buffer (producer-consumer) problem using
 * condition variables.
 *
 * Producers: acquire mutex -> check if buffer full -> if full, WAIT on
 * `notFull` condvar -> produce item -> signal `notEmpty` condvar -> release mutex.
 *
 * Consumers: acquire mutex -> check if buffer empty -> if empty, WAIT on
 * `notEmpty` condvar -> consume item -> signal `notFull` condvar -> release mutex.
 *
 * @param producers  - Number of producer threads (clamped 1-4)
 * @param consumers  - Number of consumer threads (clamped 1-4)
 * @param bufferSize - Bounded buffer capacity (clamped 1-5)
 */
export function simulateConditionVariable(
  producers: number,
  consumers: number,
  bufferSize: number,
): SyncEvent[] {
  const events: SyncEvent[] = [];
  const pCount = Math.max(1, Math.min(producers, 4));
  const cCount = Math.max(1, Math.min(consumers, 4));
  const bSize = Math.max(1, Math.min(bufferSize, 5));

  type Role = 'producer' | 'consumer';

  interface ThreadPlan {
    id: string;
    role: Role;
    cycles: number;
    cyclesDone: number;
    state: 'idle' | 'waiting-mutex' | 'holding-mutex' | 'waiting-condvar';
    nextArrival: number;
    /** Which condvar this thread is waiting on, if any */
    waitingOn: 'notFull' | 'notEmpty' | null;
    /** Whether this thread was just woken from a condvar wait */
    wokenFromWait: boolean;
  }

  const plans: ThreadPlan[] = [];
  for (let i = 0; i < pCount; i++) {
    plans.push({
      id: `P${i}`,
      role: 'producer',
      cycles: 3,
      cyclesDone: 0,
      state: 'idle',
      nextArrival: i * 2,
      waitingOn: null,
      wokenFromWait: false,
    });
  }
  for (let i = 0; i < cCount; i++) {
    plans.push({
      id: `C${i}`,
      role: 'consumer',
      cycles: 3,
      cyclesDone: 0,
      state: 'idle',
      nextArrival: 1 + i * 2,
      waitingOn: null,
      wokenFromWait: false,
    });
  }

  let mutexHolder: string | null = null;
  const mutexQueue: string[] = [];
  let bufferCount = 0; // items currently in the buffer
  const notFullWaiters: string[] = []; // producers waiting for space
  const notEmptyWaiters: string[] = []; // consumers waiting for items
  let tick = 0;
  const MAX_TICKS = 200;

  while (tick < MAX_TICKS) {
    const allDone = plans.every((p) => p.cyclesDone >= p.cycles);
    if (allDone) break;

    // 1. Threads arriving at this tick try to acquire the mutex
    for (const p of plans) {
      if (p.state === 'idle' && p.nextArrival === tick && p.cyclesDone < p.cycles) {
        if (mutexHolder === null) {
          mutexHolder = p.id;
          p.state = 'holding-mutex';
          events.push({
            tick,
            threadId: p.id,
            action: 'acquire',
            primitive: 'CondVar',
            description: `${p.id} acquires the mutex — entering critical section to check buffer state (${bufferCount}/${bSize})`,
          });
        } else {
          p.state = 'waiting-mutex';
          mutexQueue.push(p.id);
          events.push({
            tick,
            threadId: p.id,
            action: 'blocked',
            primitive: 'CondVar',
            description: `${p.id} blocked on mutex — held by ${mutexHolder}, must wait to enter critical section`,
          });
        }
      }
    }

    // 2. The mutex holder performs its produce/consume action
    if (mutexHolder !== null) {
      const hp = plans.find((p) => p.id === mutexHolder)!;

      if (hp.role === 'producer') {
        if (hp.wokenFromWait) {
          // Just woken from condvar wait — now produce
          hp.wokenFromWait = false;
          bufferCount++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} wakes from wait — a consumer freed a slot, buffer now has room`,
          });
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} signals notEmpty — produced an item, buffer now has data (${bufferCount}/${bSize})`,
          });
          // Wake a consumer if any waiting on notEmpty
          if (notEmptyWaiters.length > 0) {
            const wakee = notEmptyWaiters.shift()!;
            const wp = plans.find((pp) => pp.id === wakee)!;
            wp.state = 'waiting-mutex';
            wp.waitingOn = null;
            wp.wokenFromWait = true;
            mutexQueue.push(wakee);
          }
          hp.cyclesDone++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'release',
            primitive: 'CondVar',
            description: `${hp.id} releases the mutex — done producing, allowing next thread to enter critical section`,
          });
          hp.state = 'idle';
          hp.nextArrival = tick + 2;
          mutexHolder = null;
        } else if (bufferCount >= bSize) {
          // Buffer full — wait on notFull condvar
          events.push({
            tick,
            threadId: hp.id,
            action: 'wait',
            primitive: 'CondVar',
            description: `${hp.id} waits on notFull — buffer is full (${bufferCount}/${bSize}), must wait for consumer to free a slot`,
          });
          hp.state = 'waiting-condvar';
          hp.waitingOn = 'notFull';
          notFullWaiters.push(hp.id);
          mutexHolder = null; // release mutex atomically with condvar wait
        } else {
          // Buffer has space — produce
          bufferCount++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} signals notEmpty — produced an item, buffer now has data (${bufferCount}/${bSize})`,
          });
          // Wake a consumer if any waiting on notEmpty
          if (notEmptyWaiters.length > 0) {
            const wakee = notEmptyWaiters.shift()!;
            const wp = plans.find((pp) => pp.id === wakee)!;
            wp.state = 'waiting-mutex';
            wp.waitingOn = null;
            wp.wokenFromWait = true;
            mutexQueue.push(wakee);
          }
          hp.cyclesDone++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'release',
            primitive: 'CondVar',
            description: `${hp.id} releases the mutex — done producing, allowing next thread to enter critical section`,
          });
          hp.state = 'idle';
          hp.nextArrival = tick + 2;
          mutexHolder = null;
        }
      } else {
        // Consumer
        if (hp.wokenFromWait) {
          // Just woken from condvar wait — now consume
          hp.wokenFromWait = false;
          bufferCount--;
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} wakes from wait — a producer added an item, buffer now has data`,
          });
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} signals notFull — consumed an item, buffer has space now (${bufferCount}/${bSize})`,
          });
          // Wake a producer if any waiting on notFull
          if (notFullWaiters.length > 0) {
            const wakee = notFullWaiters.shift()!;
            const wp = plans.find((pp) => pp.id === wakee)!;
            wp.state = 'waiting-mutex';
            wp.waitingOn = null;
            wp.wokenFromWait = true;
            mutexQueue.push(wakee);
          }
          hp.cyclesDone++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'release',
            primitive: 'CondVar',
            description: `${hp.id} releases the mutex — done consuming, allowing next thread to enter critical section`,
          });
          hp.state = 'idle';
          hp.nextArrival = tick + 2;
          mutexHolder = null;
        } else if (bufferCount <= 0) {
          // Buffer empty — wait on notEmpty condvar
          events.push({
            tick,
            threadId: hp.id,
            action: 'wait',
            primitive: 'CondVar',
            description: `${hp.id} waits on notEmpty — buffer is empty (${bufferCount}/${bSize}), must wait for producer to add an item`,
          });
          hp.state = 'waiting-condvar';
          hp.waitingOn = 'notEmpty';
          notEmptyWaiters.push(hp.id);
          mutexHolder = null; // release mutex atomically with condvar wait
        } else {
          // Buffer has items — consume
          bufferCount--;
          events.push({
            tick,
            threadId: hp.id,
            action: 'signal',
            primitive: 'CondVar',
            description: `${hp.id} signals notFull — consumed an item, buffer has space now (${bufferCount}/${bSize})`,
          });
          // Wake a producer if any waiting on notFull
          if (notFullWaiters.length > 0) {
            const wakee = notFullWaiters.shift()!;
            const wp = plans.find((pp) => pp.id === wakee)!;
            wp.state = 'waiting-mutex';
            wp.waitingOn = null;
            wp.wokenFromWait = true;
            mutexQueue.push(wakee);
          }
          hp.cyclesDone++;
          events.push({
            tick,
            threadId: hp.id,
            action: 'release',
            primitive: 'CondVar',
            description: `${hp.id} releases the mutex — done consuming, allowing next thread to enter critical section`,
          });
          hp.state = 'idle';
          hp.nextArrival = tick + 2;
          mutexHolder = null;
        }
      }
    }

    // 3. If mutex is free, admit next waiter from the mutex queue
    if (mutexHolder === null && mutexQueue.length > 0) {
      const nextId = mutexQueue.shift()!;
      const np = plans.find((p) => p.id === nextId)!;
      mutexHolder = nextId;
      np.state = 'holding-mutex';
      events.push({
        tick,
        threadId: nextId,
        action: 'acquire',
        primitive: 'CondVar',
        description: `${nextId} acquires the mutex (was waiting) — entering critical section to check buffer state (${bufferCount}/${bSize})`,
      });
    }

    tick++;
  }

  return events;
}
