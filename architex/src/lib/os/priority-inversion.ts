/**
 * Priority Inversion with Mars Pathfinder Case Study  (OSC-171)
 *
 * Simulates the classic priority inversion problem and its fix via
 * priority inheritance, inspired by the real-world Mars Pathfinder
 * incident of 1997.
 *
 * Priority inversion occurs when a high-priority task is indirectly
 * blocked by a low-priority task through shared resource contention,
 * while medium-priority tasks that do NOT need the resource run freely.
 * The result: the highest-priority task in the system is starved by
 * medium-priority tasks — a complete violation of the priority contract.
 *
 * On Mars Pathfinder, this caused the spacecraft's watchdog timer to
 * repeatedly reset the computer (the "system reset" bug). JPL engineers
 * diagnosed and patched the issue remotely by enabling the VxWorks
 * RTOS's priority inheritance protocol — turning it on via an uplink
 * command from 191 million kilometers away.
 *
 * Priority inheritance temporarily boosts the low-priority task (holding
 * the mutex) to the priority of the highest-priority waiter, preventing
 * medium-priority tasks from preempting it and thus resolving the
 * inversion quickly.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PriorityInversionEvent {
  tick: number;
  taskId: string;
  taskPriority: 'high' | 'medium' | 'low';
  action:
    | 'run'
    | 'block'
    | 'preempt'
    | 'acquire-mutex'
    | 'release-mutex'
    | 'priority-boost';
  description: string;
}

export interface PriorityInversionResult {
  events: PriorityInversionEvent[];
  inversionDuration: number;
  highPriorityBlockedTicks: number;
  fixApplied: boolean;
}

// ---------------------------------------------------------------------------
// Constants — task definitions matching the Mars Pathfinder scenario
// ---------------------------------------------------------------------------

/**
 * Low-priority "meteorological data gathering" task — holds a shared
 * mutex (the information bus) for a portion of its execution.
 */
const LOW_TASK = {
  id: 'low',
  name: 'MetData (Low)',
  priority: 'low' as const,
  totalWork: 12,
  mutexAcquireTick: 1,    // acquires mutex early in its execution
  mutexHoldDuration: 8,   // holds mutex for 8 ticks of its work
};

/**
 * Medium-priority "communication" task — does NOT need the mutex but
 * has enough priority to preempt the low-priority task.
 */
const MED_TASK = {
  id: 'medium',
  name: 'Comms (Medium)',
  priority: 'medium' as const,
  totalWork: 10,
  arrivalTick: 5,
};

/**
 * High-priority "bus management" task — needs the same mutex as the
 * low-priority task. On Mars Pathfinder this was the real-time bus
 * scheduler that collected data from instruments.
 */
const HIGH_TASK = {
  id: 'high',
  name: 'BusMgr (High)',
  priority: 'high' as const,
  totalWork: 4,
  arrivalTick: 3,
};

// ---------------------------------------------------------------------------
// Simulation — without fix (demonstrates the bug)
// ---------------------------------------------------------------------------

/**
 * Simulate the classic unbounded priority inversion scenario.
 *
 * Timeline:
 *   1. Low acquires mutex (information bus).
 *   2. High arrives, needs mutex, BLOCKS — waiting for Low to release.
 *   3. Medium arrives, preempts Low (higher priority, no mutex needed).
 *   4. Medium runs to completion while High starves.
 *   5. Low finally resumes, finishes critical section, releases mutex.
 *   6. High finally acquires mutex and runs.
 *
 * The inversion: High is blocked not because of Low (which it could
 * tolerate — Low will finish eventually) but because Medium preempts Low,
 * extending High's wait *unboundedly*. Any number of medium-priority
 * tasks could arrive and further delay High.
 */
export function simulatePriorityInversion(): PriorityInversionResult {
  const events: PriorityInversionEvent[] = [];

  let tick = 0;
  let lowWorkDone = 0;
  let medWorkDone = 0;
  let highWorkDone = 0;

  let mutexHolder: string | null = null;
  let lowHasMutex = false;
  let highBlocked = false;
  let highBlockedStart: number | null = null;
  let highBlockedTicks = 0;
  let medArrived = false;
  let highArrived = false;
  let medComplete = false;
  let lowMutexWorkDone = 0;

  // Phase 1: Low-priority task starts and acquires mutex
  events.push({
    tick,
    taskId: LOW_TASK.id,
    taskPriority: LOW_TASK.priority,
    action: 'run',
    description:
      `${LOW_TASK.name} begins execution — it is the only task in the system, ` +
      `so the scheduler dispatches it despite its low priority.`,
  });

  // Simulate tick by tick
  while (highWorkDone < HIGH_TASK.totalWork || !medComplete || lowWorkDone < LOW_TASK.totalWork) {
    // Guard against infinite loops
    if (tick > 100) break;

    // --- Check arrivals ---
    if (tick === LOW_TASK.mutexAcquireTick && !lowHasMutex) {
      mutexHolder = LOW_TASK.id;
      lowHasMutex = true;
      events.push({
        tick,
        taskId: LOW_TASK.id,
        taskPriority: LOW_TASK.priority,
        action: 'acquire-mutex',
        description:
          `${LOW_TASK.name} acquires the shared mutex (information bus). ` +
          `On Mars Pathfinder, this was the bus used to publish instrument data. ` +
          `No contention yet — Low runs normally.`,
      });
    }

    if (tick === HIGH_TASK.arrivalTick && !highArrived) {
      highArrived = true;
      events.push({
        tick,
        taskId: HIGH_TASK.id,
        taskPriority: HIGH_TASK.priority,
        action: 'run',
        description:
          `${HIGH_TASK.name} arrives — highest priority task in the system. ` +
          `It preempts ${LOW_TASK.name} immediately because priority scheduling ` +
          `always runs the highest-priority ready task.`,
      });

      // High needs the mutex
      if (lowHasMutex) {
        highBlocked = true;
        highBlockedStart = tick;
        events.push({
          tick,
          taskId: HIGH_TASK.id,
          taskPriority: HIGH_TASK.priority,
          action: 'block',
          description:
            `${HIGH_TASK.name} tries to acquire the mutex but ${LOW_TASK.name} holds it. ` +
            `High BLOCKS — it cannot proceed without the information bus. ` +
            `Low resumes because it is now the highest-priority READY task.`,
        });
      }
    }

    if (tick === MED_TASK.arrivalTick && !medArrived) {
      medArrived = true;
      events.push({
        tick,
        taskId: MED_TASK.id,
        taskPriority: MED_TASK.priority,
        action: 'run',
        description:
          `${MED_TASK.name} arrives and preempts ${LOW_TASK.name}. ` +
          `Medium has higher priority than Low and does NOT need the mutex. ` +
          `THIS IS THE INVERSION: High is blocked waiting for Low to release the mutex, ` +
          `but Medium prevents Low from running — so High is effectively blocked by Medium.`,
      });

      if (lowHasMutex && highBlocked) {
        events.push({
          tick,
          taskId: LOW_TASK.id,
          taskPriority: LOW_TASK.priority,
          action: 'preempt',
          description:
            `${LOW_TASK.name} is preempted by ${MED_TASK.name} while still holding the mutex. ` +
            `Low cannot release the mutex until it finishes its critical section, ` +
            `but Medium's higher priority prevents Low from running. ` +
            `High remains blocked — starved by a medium-priority task.`,
        });
      }
    }

    // --- Determine who runs this tick ---
    if (medArrived && !medComplete && (!highBlocked || highBlocked)) {
      // Medium runs (it is highest-priority READY task when High is blocked)
      if (highBlocked && medWorkDone < MED_TASK.totalWork) {
        medWorkDone++;
        if (highBlockedStart !== null) highBlockedTicks++;

        if (medWorkDone === MED_TASK.totalWork) {
          medComplete = true;
          events.push({
            tick,
            taskId: MED_TASK.id,
            taskPriority: MED_TASK.priority,
            action: 'run',
            description:
              `${MED_TASK.name} completes after ${MED_TASK.totalWork} ticks. ` +
              `During this entire time, ${HIGH_TASK.name} (the HIGHEST priority task) was starved. ` +
              `${LOW_TASK.name} can now resume and finish its critical section.`,
          });
        } else if (medWorkDone === 1) {
          // Already emitted arrival event; track progress silently
        } else if (medWorkDone % 3 === 0) {
          events.push({
            tick,
            taskId: MED_TASK.id,
            taskPriority: MED_TASK.priority,
            action: 'run',
            description:
              `${MED_TASK.name} running (${medWorkDone}/${MED_TASK.totalWork}) — ` +
              `${HIGH_TASK.name} has been blocked for ${highBlockedTicks} ticks. ` +
              `On Mars Pathfinder, this delay caused the watchdog timer to expire and reset the system.`,
          });
        }
        tick++;
        continue;
      }
    }

    // Low runs (when medium hasn't arrived yet or is complete, and high is blocked)
    if (!medArrived || medComplete) {
      if (lowHasMutex && lowMutexWorkDone < LOW_TASK.mutexHoldDuration) {
        lowWorkDone++;
        lowMutexWorkDone++;

        if (lowMutexWorkDone === LOW_TASK.mutexHoldDuration) {
          // Low releases mutex
          mutexHolder = null;
          lowHasMutex = false;
          events.push({
            tick,
            taskId: LOW_TASK.id,
            taskPriority: LOW_TASK.priority,
            action: 'release-mutex',
            description:
              `${LOW_TASK.name} finally releases the mutex after completing its critical section. ` +
              `${HIGH_TASK.name} can now acquire the mutex and proceed. ` +
              `Total inversion duration: ${highBlockedTicks} ticks.`,
          });

          if (highBlocked) {
            highBlocked = false;
            events.push({
              tick,
              taskId: HIGH_TASK.id,
              taskPriority: HIGH_TASK.priority,
              action: 'acquire-mutex',
              description:
                `${HIGH_TASK.name} acquires the mutex and begins execution. ` +
                `High-priority task blocked for ${highBlockedTicks} ticks — ` +
                `Mars Pathfinder experienced this exact bug in 1997, causing ` +
                `repeated system resets until JPL engineers enabled priority inheritance remotely.`,
            });
          }
          tick++;
          continue;
        }

        events.push({
          tick,
          taskId: LOW_TASK.id,
          taskPriority: LOW_TASK.priority,
          action: 'run',
          description:
            `${LOW_TASK.name} runs in critical section (${lowMutexWorkDone}/${LOW_TASK.mutexHoldDuration}) ` +
            `while holding the mutex.`,
        });
        tick++;
        continue;
      }

      // High runs after getting the mutex
      if (highArrived && !highBlocked && highWorkDone < HIGH_TASK.totalWork) {
        highWorkDone++;
        if (highWorkDone === HIGH_TASK.totalWork) {
          events.push({
            tick,
            taskId: HIGH_TASK.id,
            taskPriority: HIGH_TASK.priority,
            action: 'release-mutex',
            description:
              `${HIGH_TASK.name} completes execution and releases the mutex. ` +
              `Total delay due to priority inversion: ${highBlockedTicks} ticks.`,
          });
        } else {
          events.push({
            tick,
            taskId: HIGH_TASK.id,
            taskPriority: HIGH_TASK.priority,
            action: 'run',
            description:
              `${HIGH_TASK.name} executing (${highWorkDone}/${HIGH_TASK.totalWork}).`,
          });
        }
        tick++;
        continue;
      }

      // Low finishes remaining non-critical work
      if (lowWorkDone < LOW_TASK.totalWork) {
        lowWorkDone++;
        events.push({
          tick,
          taskId: LOW_TASK.id,
          taskPriority: LOW_TASK.priority,
          action: 'run',
          description:
            `${LOW_TASK.name} runs remaining work (${lowWorkDone}/${LOW_TASK.totalWork}).`,
        });
        tick++;
        continue;
      }

      break;
    }

    tick++;
  }

  return {
    events,
    inversionDuration: highBlockedTicks,
    highPriorityBlockedTicks: highBlockedTicks,
    fixApplied: false,
  };
}

// ---------------------------------------------------------------------------
// Simulation — with Priority Inheritance Protocol (the fix)
// ---------------------------------------------------------------------------

/**
 * Simulate the same scenario but with Priority Inheritance enabled.
 *
 * When High blocks on the mutex held by Low, the OS temporarily boosts
 * Low's priority to match High's. This prevents Medium from preempting
 * Low, so Low finishes its critical section quickly and releases the
 * mutex. High proceeds with minimal delay.
 *
 * This is exactly what JPL engineers enabled on Mars Pathfinder's
 * VxWorks RTOS to fix the bug — a configuration flag that was already
 * in the code but turned off.
 */
export function simulateWithPriorityInheritance(): PriorityInversionResult {
  const events: PriorityInversionEvent[] = [];

  let tick = 0;
  let lowWorkDone = 0;
  let medWorkDone = 0;
  let highWorkDone = 0;

  let lowHasMutex = false;
  let highBlocked = false;
  let highBlockedStart: number | null = null;
  let highBlockedTicks = 0;
  let medArrived = false;
  let highArrived = false;
  let medComplete = false;
  let lowBoosted = false;
  let lowMutexWorkDone = 0;

  // Phase 1: Low starts
  events.push({
    tick,
    taskId: LOW_TASK.id,
    taskPriority: LOW_TASK.priority,
    action: 'run',
    description:
      `${LOW_TASK.name} begins execution — same scenario as before, ` +
      `but now priority inheritance protocol is ENABLED.`,
  });

  while (highWorkDone < HIGH_TASK.totalWork || !medComplete || lowWorkDone < LOW_TASK.totalWork) {
    if (tick > 100) break;

    // --- Check arrivals ---
    if (tick === LOW_TASK.mutexAcquireTick && !lowHasMutex) {
      lowHasMutex = true;
      events.push({
        tick,
        taskId: LOW_TASK.id,
        taskPriority: LOW_TASK.priority,
        action: 'acquire-mutex',
        description:
          `${LOW_TASK.name} acquires the shared mutex. Same as before — ` +
          `no contention exists yet.`,
      });
    }

    if (tick === HIGH_TASK.arrivalTick && !highArrived) {
      highArrived = true;
      events.push({
        tick,
        taskId: HIGH_TASK.id,
        taskPriority: HIGH_TASK.priority,
        action: 'run',
        description:
          `${HIGH_TASK.name} arrives and preempts ${LOW_TASK.name}.`,
      });

      if (lowHasMutex) {
        highBlocked = true;
        highBlockedStart = tick;
        events.push({
          tick,
          taskId: HIGH_TASK.id,
          taskPriority: HIGH_TASK.priority,
          action: 'block',
          description:
            `${HIGH_TASK.name} blocks on the mutex held by ${LOW_TASK.name}. ` +
            `But now the priority inheritance protocol activates!`,
        });

        // PRIORITY INHERITANCE: Boost Low to High's priority
        lowBoosted = true;
        events.push({
          tick,
          taskId: LOW_TASK.id,
          taskPriority: LOW_TASK.priority,
          action: 'priority-boost',
          description:
            `PRIORITY INHERITANCE: ${LOW_TASK.name}'s priority is temporarily boosted ` +
            `from LOW to HIGH because it holds a mutex that ${HIGH_TASK.name} needs. ` +
            `This prevents any medium-priority task from preempting Low while ` +
            `it holds the critical resource. Low will run at high priority ` +
            `until it releases the mutex.`,
        });
      }
    }

    if (tick === MED_TASK.arrivalTick && !medArrived) {
      medArrived = true;
      if (lowBoosted) {
        events.push({
          tick,
          taskId: MED_TASK.id,
          taskPriority: MED_TASK.priority,
          action: 'block',
          description:
            `${MED_TASK.name} arrives but CANNOT preempt ${LOW_TASK.name} — ` +
            `Low is running with inherited HIGH priority. ` +
            `This is the key difference: priority inheritance prevents the unbounded inversion. ` +
            `Medium must wait until Low releases the mutex and reverts to low priority.`,
        });
      } else {
        events.push({
          tick,
          taskId: MED_TASK.id,
          taskPriority: MED_TASK.priority,
          action: 'run',
          description: `${MED_TASK.name} arrives.`,
        });
      }
    }

    // --- Determine who runs this tick ---

    // Boosted Low runs in critical section (effectively at high priority)
    if (lowBoosted && lowHasMutex && lowMutexWorkDone < LOW_TASK.mutexHoldDuration) {
      lowWorkDone++;
      lowMutexWorkDone++;

      if (lowMutexWorkDone === LOW_TASK.mutexHoldDuration) {
        // Low releases mutex and priority reverts
        lowHasMutex = false;
        lowBoosted = false;

        events.push({
          tick,
          taskId: LOW_TASK.id,
          taskPriority: LOW_TASK.priority,
          action: 'release-mutex',
          description:
            `${LOW_TASK.name} releases the mutex and its priority reverts from HIGH back to LOW. ` +
            `Critical section completed in just ${LOW_TASK.mutexHoldDuration} ticks ` +
            `because no medium-priority task could preempt the boosted Low.`,
        });

        highBlocked = false;
        highBlockedTicks = tick - (highBlockedStart ?? tick);

        events.push({
          tick,
          taskId: HIGH_TASK.id,
          taskPriority: HIGH_TASK.priority,
          action: 'acquire-mutex',
          description:
            `${HIGH_TASK.name} acquires the mutex and begins execution immediately. ` +
            `Blocked for only ${highBlockedTicks} ticks (vs. ${MED_TASK.totalWork + LOW_TASK.mutexHoldDuration}+ without inheritance). ` +
            `Priority inheritance reduced the delay by eliminating the medium-priority interference.`,
        });

        tick++;
        continue;
      }

      events.push({
        tick,
        taskId: LOW_TASK.id,
        taskPriority: LOW_TASK.priority,
        action: 'run',
        description:
          `${LOW_TASK.name} runs critical section at BOOSTED priority ` +
          `(${lowMutexWorkDone}/${LOW_TASK.mutexHoldDuration}) — ` +
          `${MED_TASK.name}${medArrived ? ' is waiting' : ' has not arrived yet'}, ` +
          `cannot preempt.`,
      });
      tick++;
      continue;
    }

    // High runs after getting the mutex
    if (highArrived && !highBlocked && highWorkDone < HIGH_TASK.totalWork) {
      highWorkDone++;
      if (highWorkDone === HIGH_TASK.totalWork) {
        events.push({
          tick,
          taskId: HIGH_TASK.id,
          taskPriority: HIGH_TASK.priority,
          action: 'release-mutex',
          description:
            `${HIGH_TASK.name} completes execution and releases the mutex. ` +
            `With priority inheritance, total blocked time was only ${highBlockedTicks} ticks. ` +
            `The Mars Pathfinder fix: JPL enabled this exact protocol via an uplink command ` +
            `from 191 million kilometers away.`,
        });
      } else {
        events.push({
          tick,
          taskId: HIGH_TASK.id,
          taskPriority: HIGH_TASK.priority,
          action: 'run',
          description:
            `${HIGH_TASK.name} executing (${highWorkDone}/${HIGH_TASK.totalWork}).`,
        });
      }
      tick++;
      continue;
    }

    // Medium runs (after high completes, medium gets the CPU)
    if (medArrived && !medComplete && medWorkDone < MED_TASK.totalWork) {
      if (highWorkDone >= HIGH_TASK.totalWork || !highArrived) {
        medWorkDone++;
        if (medWorkDone === MED_TASK.totalWork) {
          medComplete = true;
          events.push({
            tick,
            taskId: MED_TASK.id,
            taskPriority: MED_TASK.priority,
            action: 'run',
            description:
              `${MED_TASK.name} completes. With priority inheritance, Medium ran AFTER High ` +
              `(the correct priority order), not before it.`,
          });
        } else if (medWorkDone === 1) {
          events.push({
            tick,
            taskId: MED_TASK.id,
            taskPriority: MED_TASK.priority,
            action: 'run',
            description:
              `${MED_TASK.name} begins execution now that both higher-priority tasks ` +
              `have completed — priorities are correctly respected.`,
          });
        }
        tick++;
        continue;
      }
    }

    // Low finishes remaining non-critical work
    if (lowWorkDone < LOW_TASK.totalWork) {
      lowWorkDone++;
      events.push({
        tick,
        taskId: LOW_TASK.id,
        taskPriority: LOW_TASK.priority,
        action: 'run',
        description:
          `${LOW_TASK.name} runs remaining work (${lowWorkDone}/${LOW_TASK.totalWork}).`,
      });
      tick++;
      continue;
    }

    // All done
    if (highWorkDone >= HIGH_TASK.totalWork && medComplete && lowWorkDone >= LOW_TASK.totalWork) {
      break;
    }

    tick++;
  }

  return {
    events,
    inversionDuration: highBlockedTicks,
    highPriorityBlockedTicks: highBlockedTicks,
    fixApplied: true,
  };
}
