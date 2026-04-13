/**
 * Thrashing & Working Set Visualization Engine  (OSC-068)
 *
 * Simulates the relationship between multiprogramming degree and CPU
 * utilization, demonstrating the thrashing phenomenon described by
 * Denning (1968) and covered extensively in Silberschatz Ch. 10.
 *
 * As processes are added to the system, CPU utilization initially rises
 * because idle time is filled with useful work. However, once the total
 * working-set demand exceeds physical memory, processes spend most of
 * their time page-faulting rather than executing. The page-fault rate
 * spikes, the disk becomes the bottleneck, and CPU utilization *drops*
 * — this cliff is thrashing.
 *
 * The working-set model is the classic prevention strategy: the OS
 * tracks each process's locality of reference (its "working set") and
 * only admits new processes when their combined working sets fit in RAM.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThrashingEvent {
  tick: number;
  type:
    | 'page-fault'
    | 'page-hit'
    | 'thrashing-start'
    | 'thrashing-end'
    | 'working-set-update';
  processCount: number;
  pageFaultRate: number;
  cpuUtilization: number;
  workingSetSize: number;
  description: string;
}

export interface ThrashingResult {
  events: ThrashingEvent[];
  thrashingStartTick: number | null;
  peakFaultRate: number;
  optimalProcessCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Compute CPU utilization as a function of multiprogramming degree.
 *
 * When total working sets fit in physical memory, utilization follows an
 * asymptotic curve: U = 1 - p^n  where p is the probability of ALL n
 * processes being blocked on I/O simultaneously (a simplification of
 * the probabilistic model from Silberschatz).
 *
 * Once total working sets exceed physical memory, utilization collapses
 * because page-fault servicing dominates — the CPU waits on disk I/O
 * for page swaps rather than executing instructions.
 */
function computeCpuUtilization(
  processCount: number,
  physicalFrames: number,
  totalWorkingSet: number,
): number {
  if (processCount === 0) return 0;

  // Base utilization from probabilistic I/O overlap model
  // p = 0.4 means each process is blocked on I/O 40% of the time
  const pIoBlocked = 0.4;
  const baseUtilization = 1 - Math.pow(pIoBlocked, processCount);

  if (totalWorkingSet <= physicalFrames) {
    // Working sets fit — utilization follows the classic asymptotic curve
    return Math.min(baseUtilization, 0.95);
  }

  // Thrashing: overcommitment ratio determines severity
  // The more we exceed physical memory, the worse the thrashing
  const overcommitRatio = totalWorkingSet / physicalFrames;
  const thrashingPenalty = Math.pow(overcommitRatio, 2);
  const degradedUtilization = baseUtilization / thrashingPenalty;

  return Math.max(degradedUtilization, 0.05);
}

/**
 * Compute page-fault rate given physical capacity and demand.
 *
 * When demand fits in memory, the fault rate is low (cold-start
 * compulsory faults only). When demand exceeds capacity, the fault
 * rate rises steeply because every page brought in evicts a page that
 * will soon be needed again (the definition of thrashing).
 */
function computePageFaultRate(
  physicalFrames: number,
  totalWorkingSet: number,
): number {
  if (totalWorkingSet <= physicalFrames) {
    // Only compulsory faults — proportional to how full memory is
    return 0.02 + 0.08 * (totalWorkingSet / physicalFrames);
  }

  // Capacity exceeded — fault rate climbs steeply
  const overcommitRatio = totalWorkingSet / physicalFrames;
  return Math.min(0.1 + 0.3 * (overcommitRatio - 1), 0.95);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate adding processes one by one and observe the transition from
 * healthy multiprogramming to thrashing.
 *
 * Each tick represents the addition of one process. The simulation
 * tracks total working-set demand, page-fault rate, and CPU utilization,
 * producing the classic "CPU utilization vs. degree of multiprogramming"
 * graph from Silberschatz.
 *
 * @param maxProcesses          - Maximum number of processes to add.
 * @param physicalFrames        - Total physical memory frames available.
 * @param workingSetPerProcess  - Number of frames in each process's working set.
 */
export function simulateThrashing(
  maxProcesses: number,
  physicalFrames: number,
  workingSetPerProcess: number,
): ThrashingResult {
  const events: ThrashingEvent[] = [];
  let thrashingStartTick: number | null = null;
  let peakFaultRate = 0;
  let peakUtilization = 0;
  let optimalProcessCount = 1;
  let isThrashing = false;

  for (let tick = 1; tick <= maxProcesses; tick++) {
    const processCount = tick;
    const totalWorkingSet = processCount * workingSetPerProcess;
    const faultRate = computePageFaultRate(physicalFrames, totalWorkingSet);
    const cpuUtil = computeCpuUtilization(
      processCount,
      physicalFrames,
      totalWorkingSet,
    );

    // Track peak fault rate
    if (faultRate > peakFaultRate) {
      peakFaultRate = faultRate;
    }

    // Track optimal process count (highest CPU utilization)
    if (cpuUtil > peakUtilization) {
      peakUtilization = cpuUtil;
      optimalProcessCount = processCount;
    }

    // Emit working-set update
    events.push({
      tick,
      type: 'working-set-update',
      processCount,
      pageFaultRate: Math.round(faultRate * 1000) / 1000,
      cpuUtilization: Math.round(cpuUtil * 1000) / 1000,
      workingSetSize: totalWorkingSet,
      description:
        `Process ${processCount} added — total working set is ${totalWorkingSet} frames ` +
        `(${physicalFrames} physical frames available). ` +
        `CPU utilization: ${(cpuUtil * 100).toFixed(1)}%, ` +
        `page-fault rate: ${(faultRate * 100).toFixed(1)}%`,
    });

    // Detect thrashing transition
    if (!isThrashing && totalWorkingSet > physicalFrames) {
      isThrashing = true;
      thrashingStartTick = tick;
      events.push({
        tick,
        type: 'thrashing-start',
        processCount,
        pageFaultRate: Math.round(faultRate * 1000) / 1000,
        cpuUtilization: Math.round(cpuUtil * 1000) / 1000,
        workingSetSize: totalWorkingSet,
        description:
          `THRASHING BEGINS — total working set (${totalWorkingSet}) exceeds physical memory (${physicalFrames}). ` +
          `Processes now compete for frames, causing cascading page faults. ` +
          `CPU utilization drops from ${(peakUtilization * 100).toFixed(1)}% to ${(cpuUtil * 100).toFixed(1)}% ` +
          `because the CPU spends most of its time waiting for disk I/O to resolve page faults.`,
      });
    }

    // Emit page faults / hits proportional to current fault rate
    // Simulate a burst of 10 memory references per process-addition tick
    const referencesPerTick = 10;
    const faults = Math.round(referencesPerTick * faultRate);
    const hits = referencesPerTick - faults;

    if (faults > 0) {
      events.push({
        tick,
        type: 'page-fault',
        processCount,
        pageFaultRate: Math.round(faultRate * 1000) / 1000,
        cpuUtilization: Math.round(cpuUtil * 1000) / 1000,
        workingSetSize: totalWorkingSet,
        description:
          `${faults}/${referencesPerTick} memory references caused page faults` +
          (isThrashing
            ? ` — pages are being swapped out and immediately needed again (thrashing)`
            : ` — normal compulsory misses while building the working set`),
      });
    }

    if (hits > 0) {
      events.push({
        tick,
        type: 'page-hit',
        processCount,
        pageFaultRate: Math.round(faultRate * 1000) / 1000,
        cpuUtilization: Math.round(cpuUtil * 1000) / 1000,
        workingSetSize: totalWorkingSet,
        description:
          `${hits}/${referencesPerTick} memory references hit in physical memory` +
          (isThrashing
            ? ` — even these "hits" are increasingly rare as frames are constantly being stolen`
            : ` — working set is resident in RAM, no disk access needed`),
      });
    }
  }

  return {
    events,
    thrashingStartTick,
    peakFaultRate: Math.round(peakFaultRate * 1000) / 1000,
    optimalProcessCount,
  };
}

/**
 * Find the optimal degree of multiprogramming using the working-set model.
 *
 * The working-set model (Denning, 1968) states that thrashing can be
 * prevented by ensuring the sum of all processes' working sets does not
 * exceed available physical memory:
 *
 *   Σ WSS_i ≤ physical frames
 *
 * If adding a new process would violate this invariant, the OS should
 * suspend a process rather than admit the new one.
 *
 * @param physicalFrames  - Total physical memory frames.
 * @param avgWorkingSet   - Average working-set size per process.
 */
export function findOptimalMultiprogramming(
  physicalFrames: number,
  avgWorkingSet: number,
): { optimalCount: number; events: ThrashingEvent[] } {
  const events: ThrashingEvent[] = [];

  if (avgWorkingSet <= 0) {
    return { optimalCount: 0, events: [] };
  }

  // Maximum processes before working sets exceed physical memory
  const maxBeforeThrashing = Math.floor(physicalFrames / avgWorkingSet);

  // Run the simulation to find the actual optimal point
  // (may be slightly less than maxBeforeThrashing due to OS overhead)
  const result = simulateThrashing(
    maxBeforeThrashing + 5, // simulate a few past the threshold
    physicalFrames,
    avgWorkingSet,
  );

  // Generate summary events
  for (let count = 1; count <= maxBeforeThrashing + 3; count++) {
    const totalWS = count * avgWorkingSet;
    const faultRate = computePageFaultRate(physicalFrames, totalWS);
    const cpuUtil = computeCpuUtilization(count, physicalFrames, totalWS);
    const fits = totalWS <= physicalFrames;

    events.push({
      tick: count,
      type: 'working-set-update',
      processCount: count,
      pageFaultRate: Math.round(faultRate * 1000) / 1000,
      cpuUtilization: Math.round(cpuUtil * 1000) / 1000,
      workingSetSize: totalWS,
      description: fits
        ? `${count} processes: total WSS=${totalWS} fits in ${physicalFrames} frames ` +
          `(${physicalFrames - totalWS} frames free). Safe to admit.`
        : `${count} processes: total WSS=${totalWS} EXCEEDS ${physicalFrames} frames ` +
          `by ${totalWS - physicalFrames}. Working-set model would DENY admission ` +
          `to prevent thrashing.`,
    });
  }

  return {
    optimalCount: result.optimalProcessCount,
    events,
  };
}
