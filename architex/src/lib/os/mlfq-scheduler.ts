/**
 * Multi-Level Feedback Queue (MLFQ) Scheduler
 *
 * A full-featured MLFQ implementation supporting:
 * - Configurable number of priority queues (default 3)
 * - Per-queue time quanta (e.g., Q0=8ms, Q1=16ms, Q2=FCFS)
 * - Priority demotion: process that uses full quantum moves down one level
 * - Priority boost: all processes periodically moved to highest queue
 * - I/O boost: process that releases CPU before quantum expires stays at current level
 *
 * Returns a ScheduleResult compatible with the existing scheduling API.
 */

import type { Process, ScheduleEvent, ScheduleResult } from './scheduling';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface MLFQQueueConfig {
  /** Time quantum for this queue level. Use Infinity for FCFS (lowest queue). */
  quantum: number;
}

export interface MLFQConfig {
  /** Queue configurations ordered from highest priority (index 0) to lowest. */
  queues: MLFQQueueConfig[];
  /**
   * Interval (in time units) at which all processes are boosted to the
   * highest-priority queue. Set to 0 or Infinity to disable.
   */
  boostInterval: number;
}

export interface MLFQProcess extends Process {
  /** Index of the queue this process currently belongs to. */
  queueLevel: number;
  /** How much of the current quantum this process has consumed. */
  quantumUsed: number;
  /**
   * Whether the process performed I/O (released CPU voluntarily before
   * quantum expired). Simulated by providing an ioAt array on input.
   */
  ioAt?: number[];
}

/** Animation step providing rich state for MLFQ visualization. */
export interface MLFQStep {
  tick: number;
  /** Snapshot of which process IDs are in each queue at this tick. */
  queueState: string[][];
  /** Currently running process ID, or null if CPU idle. */
  activeProcessId: string | null;
  /** Queue level of the active process. */
  activeQueueLevel: number;
  /** Remaining quantum for the active process at this tick. */
  remainingQuantum: number;
  /** Event that occurred at this tick. */
  event: ScheduleEvent;
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_MLFQ_CONFIG: MLFQConfig = {
  queues: [
    { quantum: 8 },
    { quantum: 16 },
    { quantum: Infinity }, // FCFS at lowest level
  ],
  boostInterval: 100,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cloneProcesses(ps: Process[]): MLFQProcess[] {
  return ps.map((p) => ({
    ...p,
    queueLevel: 0,
    quantumUsed: 0,
  }));
}

function pushGantt(
  gantt: Array<{ processId: string | null; start: number; end: number }>,
  processId: string | null,
  start: number,
  end: number,
): void {
  const last = gantt[gantt.length - 1];
  if (last && last.processId === processId && last.end === start) {
    last.end = end;
  } else {
    gantt.push({ processId, start, end });
  }
}

function finalise(
  procs: MLFQProcess[],
  events: ScheduleEvent[],
  gantt: Array<{ processId: string | null; start: number; end: number }>,
): ScheduleResult {
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
  const makespan =
    gantt.length > 0 ? gantt[gantt.length - 1].end - gantt[0].start : 0;

  const avgWaitTime =
    procs.length > 0
      ? procs.reduce((s, p) => s + (p.waitTime ?? 0), 0) / procs.length
      : 0;
  const avgTurnaroundTime =
    procs.length > 0
      ? procs.reduce((s, p) => s + (p.turnaroundTime ?? 0), 0) / procs.length
      : 0;
  const avgResponseTime =
    procs.length > 0
      ? procs.reduce((s, p) => s + (p.responseTime ?? 0), 0) / procs.length
      : 0;

  return {
    algorithm: 'MLFQ',
    events,
    ganttChart: gantt,
    processes: procs,
    avgWaitTime,
    avgTurnaroundTime,
    avgResponseTime,
    cpuUtilization: makespan > 0 ? totalBurst / makespan : 0,
  };
}

// ---------------------------------------------------------------------------
// Main MLFQ scheduler
// ---------------------------------------------------------------------------

/**
 * Run the Multi-Level Feedback Queue scheduling algorithm.
 *
 * @param processes - Array of process descriptors.
 * @param config - MLFQ configuration (queue quanta and boost interval).
 * @param ioMap - Optional map of process ID to sorted array of remaining-time
 *   thresholds at which the process performs I/O (voluntarily yields CPU).
 *   For example, if process P1 has burstTime=20 and ioMap['P1'] = [15, 5],
 *   then P1 will yield when its remainingTime reaches 15 and again at 5.
 * @returns ScheduleResult plus an array of MLFQStep for animation.
 */
export function mlfqScheduler(
  processes: Process[],
  config: MLFQConfig = DEFAULT_MLFQ_CONFIG,
  ioMap: Record<string, number[]> = {},
): { result: ScheduleResult; steps: MLFQStep[] } {
  const numQueues = config.queues.length;
  if (numQueues === 0) {
    return {
      result: finalise([], [], []),
      steps: [],
    };
  }

  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];
  const steps: MLFQStep[] = [];

  // Per-level ready queues (FIFO within each level)
  const levelQueues: MLFQProcess[][] = Array.from({ length: numQueues }, () => []);

  const arrived = new Set<string>();
  const completed = new Set<string>();
  const started = new Set<string>();

  // Sort processes by arrival time for efficient admission
  const sorted = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let arrIdx = 0;

  let time = 0;
  const maxArrival = Math.max(...procs.map((p) => p.arrivalTime));
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
  const upperBound = maxArrival + totalBurst + 1;

  // Track I/O thresholds per process
  const ioThresholds = new Map<string, number[]>();
  for (const p of procs) {
    const thresholds = ioMap[p.id];
    if (thresholds && thresholds.length > 0) {
      ioThresholds.set(p.id, [...thresholds].sort((a, b) => b - a));
    }
  }

  /** Build a snapshot of the current queue state. */
  function snapshotQueues(): string[][] {
    return levelQueues.map((q) => q.map((p) => p.id));
  }

  /** Record an animation step. */
  function recordStep(
    event: ScheduleEvent,
    activeId: string | null,
    activeLevel: number,
    remainingQuantum: number,
  ): void {
    steps.push({
      tick: time,
      queueState: snapshotQueues(),
      activeProcessId: activeId,
      activeQueueLevel: activeLevel,
      remainingQuantum,
      event,
    });
  }

  /** Admit all processes that have arrived by the current time. */
  function admitArrivals(): void {
    while (arrIdx < sorted.length && sorted[arrIdx].arrivalTime <= time) {
      const p = sorted[arrIdx];
      if (!arrived.has(p.id)) {
        arrived.add(p.id);
        p.queueLevel = 0; // New processes always enter the highest queue
        p.quantumUsed = 0;
        levelQueues[0].push(p);
        const evt: ScheduleEvent = {
          tick: time,
          processId: p.id,
          type: 'arrive',
          description: `${p.name} arrives -> Q${0} (quantum=${config.queues[0].quantum === Infinity ? 'FCFS' : config.queues[0].quantum})`,
        };
        events.push(evt);
        recordStep(evt, null, -1, 0);
      }
      arrIdx++;
    }
  }

  /** Perform a priority boost: move all non-completed processes to Q0. */
  function priorityBoost(): void {
    for (let level = 1; level < numQueues; level++) {
      while (levelQueues[level].length > 0) {
        const p = levelQueues[level].shift()!;
        p.queueLevel = 0;
        p.quantumUsed = 0;
        levelQueues[0].push(p);
      }
    }
    const evt: ScheduleEvent = {
      tick: time,
      processId: null,
      type: 'boost',
      description: `Priority boost: all processes moved to Q0`,
    };
    events.push(evt);
    recordStep(evt, null, 0, 0);
  }

  /** Pick the highest-priority non-empty queue and dequeue the front. */
  function pickNext(): { process: MLFQProcess; level: number } | null {
    for (let i = 0; i < numQueues; i++) {
      if (levelQueues[i].length > 0) {
        return { process: levelQueues[i].shift()!, level: i };
      }
    }
    return null;
  }

  /** Check if a process should do I/O at current remaining time. */
  function shouldDoIO(proc: MLFQProcess): boolean {
    const thresholds = ioThresholds.get(proc.id);
    if (!thresholds || thresholds.length === 0) return false;
    if (proc.remainingTime <= thresholds[0]) {
      thresholds.shift();
      return true;
    }
    return false;
  }

  // Main simulation loop
  while (completed.size < procs.length && time < upperBound) {
    // Check for priority boost
    if (
      config.boostInterval > 0 &&
      config.boostInterval < Infinity &&
      time > 0 &&
      time % config.boostInterval === 0
    ) {
      priorityBoost();
    }

    admitArrivals();

    const next = pickNext();
    if (!next) {
      // CPU idle -- jump to next arrival
      if (arrIdx >= sorted.length) break;
      const nextTime = sorted[arrIdx].arrivalTime;
      const evt: ScheduleEvent = {
        tick: time,
        processId: null,
        type: 'idle',
        description: `CPU idle from ${time} to ${nextTime}`,
      };
      events.push(evt);
      recordStep(evt, null, -1, 0);
      pushGantt(gantt, null, time, nextTime);
      time = nextTime;
      continue;
    }

    const { process: p, level } = next;
    const quantum = config.queues[level].quantum;
    const effectiveQuantum = quantum === Infinity
      ? p.remainingTime  // FCFS behavior at lowest queue
      : quantum;

    p.quantumUsed = 0;

    // Start or resume
    if (!started.has(p.id)) {
      p.startTime = time;
      p.responseTime = time - p.arrivalTime;
      started.add(p.id);
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'start',
        description: `${p.name} starts at Q${level} (quantum=${quantum === Infinity ? 'FCFS' : quantum})`,
      };
      events.push(evt);
      recordStep(evt, p.id, level, effectiveQuantum);
    } else {
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'resume',
        description: `${p.name} resumes at Q${level} (quantum=${quantum === Infinity ? 'FCFS' : quantum}, remaining=${p.remainingTime})`,
      };
      events.push(evt);
      recordStep(evt, p.id, level, effectiveQuantum - p.quantumUsed);
    }

    // Execute tick-by-tick
    let preempted = false;
    let ioYield = false;
    const runStart = time;

    while (
      p.remainingTime > 0 &&
      p.quantumUsed < effectiveQuantum &&
      !preempted &&
      !ioYield
    ) {
      p.remainingTime--;
      p.quantumUsed++;
      time++;

      // Admit new arrivals during execution
      admitArrivals();

      // Check for priority boost during execution
      if (
        config.boostInterval > 0 &&
        config.boostInterval < Infinity &&
        time > 0 &&
        time % config.boostInterval === 0
      ) {
        // Boost happens -- the running process also gets boosted
        // We handle this by completing the current slice first,
        // then boosting after the running process is re-enqueued
      }

      // Check for I/O yield (voluntary release before quantum expires)
      if (p.remainingTime > 0 && shouldDoIO(p)) {
        ioYield = true;
        break;
      }

      // Check if a higher-priority queue now has a waiting process
      if (p.remainingTime > 0 && p.quantumUsed < effectiveQuantum) {
        for (let hl = 0; hl < level; hl++) {
          if (levelQueues[hl].length > 0) {
            preempted = true;
            break;
          }
        }
      }
    }

    pushGantt(gantt, p.id, runStart, time);

    if (p.remainingTime === 0) {
      // Process completed
      p.completionTime = time;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitTime = p.turnaroundTime - p.burstTime;
      completed.add(p.id);
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'complete',
        description: `${p.name} completes at ${time} (was in Q${level})`,
      };
      events.push(evt);
      recordStep(evt, null, level, 0);
    } else if (ioYield) {
      // I/O boost: process stays at current level (reward for not using full quantum)
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'io-return',
        description: `${p.name} yields for I/O after ${p.quantumUsed}/${quantum === Infinity ? 'FCFS' : quantum} -> stays at Q${level}`,
      };
      events.push(evt);
      recordStep(evt, null, level, 0);
      p.quantumUsed = 0;
      levelQueues[level].push(p);
    } else if (preempted) {
      // Preempted by a higher-priority arrival -- stays at same level
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'preempt',
        description: `${p.name} preempted by higher-priority process -> stays at Q${level}`,
      };
      events.push(evt);
      recordStep(evt, null, level, effectiveQuantum - p.quantumUsed);
      levelQueues[level].push(p);
    } else {
      // Used full quantum without completing -> demote
      const nextLevel = Math.min(level + 1, numQueues - 1);
      p.queueLevel = nextLevel;
      p.quantumUsed = 0;
      const evt: ScheduleEvent = {
        tick: time,
        processId: p.id,
        type: 'demote',
        description: `${p.name} used full quantum (${quantum === Infinity ? 'FCFS' : quantum}) -> demoted Q${level} to Q${nextLevel}`,
      };
      events.push(evt);
      recordStep(evt, null, nextLevel, 0);
      levelQueues[nextLevel].push(p);
    }

    // Check for boost after process is re-enqueued
    if (
      config.boostInterval > 0 &&
      config.boostInterval < Infinity &&
      time > 0 &&
      time % config.boostInterval === 0
    ) {
      priorityBoost();
    }
  }

  events.sort((a, b) => a.tick - b.tick);
  return {
    result: finalise(procs, events, gantt),
    steps,
  };
}
