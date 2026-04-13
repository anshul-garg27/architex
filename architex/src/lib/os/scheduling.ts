/**
 * Process Scheduling Algorithm Simulations
 *
 * Implements five CPU scheduling algorithms with full event logs,
 * Gantt chart generation, and per-process metric computation.
 *
 * Each algorithm accepts an array of {@link Process} descriptors and
 * returns a {@link ScheduleResult} containing an ordered event log
 * suitable for step-by-step playback in a visualization layer.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Process {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  priority: number; // Lower = higher priority
  remainingTime: number;
  // Computed
  startTime?: number;
  completionTime?: number;
  waitTime?: number;
  turnaroundTime?: number;
  responseTime?: number;
}

export interface ScheduleEvent {
  tick: number;
  processId: string | null; // null = CPU idle
  type: 'start' | 'resume' | 'preempt' | 'complete' | 'arrive' | 'idle' | 'demote' | 'boost' | 'io-return';
  description: string;
}

export interface ScheduleResult {
  algorithm: string;
  events: ScheduleEvent[];
  ganttChart: Array<{ processId: string | null; start: number; end: number }>;
  processes: Process[]; // With computed fields filled in
  avgWaitTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number; // 0-1
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone processes so mutations stay local to the algorithm run. */
function cloneProcesses(ps: Process[]): Process[] {
  return ps.map((p) => ({ ...p }));
}

/** Compute per-process and aggregate metrics after simulation. */
function finalise(
  algorithm: string,
  procs: Process[],
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
    algorithm,
    events,
    ganttChart: gantt,
    processes: procs,
    avgWaitTime,
    avgTurnaroundTime,
    avgResponseTime,
    cpuUtilization: makespan > 0 ? totalBurst / makespan : 0,
  };
}

/**
 * Push a segment onto the Gantt chart. Merges with the previous segment if
 * the same process is running.
 */
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

// ---------------------------------------------------------------------------
// 1. First-Come, First-Served (FCFS)
// ---------------------------------------------------------------------------

/**
 * Non-preemptive first-come, first-served scheduling.
 *
 * Processes are executed in the order of their arrival time. Ties are
 * broken by array position.
 */
export function fcfs(processes: Process[]): ScheduleResult {
  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];

  // Sort by arrival time, stable
  const queue = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);

  let time = 0;

  for (const p of queue) {
    // Emit arrive event at arrival time
    events.push({
      tick: p.arrivalTime,
      processId: p.id,
      type: 'arrive',
      description: `${p.name} arrives`,
    });
  }

  for (const p of queue) {
    if (time < p.arrivalTime) {
      // CPU idle until process arrives
      events.push({
        tick: time,
        processId: null,
        type: 'idle',
        description: `CPU idle from ${time} to ${p.arrivalTime} — no processes have arrived yet`,
      });
      pushGantt(gantt, null, time, p.arrivalTime);
      time = p.arrivalTime;
    }

    p.startTime = time;
    p.responseTime = time - p.arrivalTime;

    events.push({
      tick: time,
      processId: p.id,
      type: 'start',
      description: `${p.name} starts execution (burst=${p.burstTime}) — FCFS runs processes in arrival order without interruption`,
    });

    time += p.burstTime;
    p.remainingTime = 0;
    p.completionTime = time;
    p.turnaroundTime = p.completionTime - p.arrivalTime;
    p.waitTime = p.turnaroundTime - p.burstTime;

    pushGantt(gantt, p.id, p.startTime, time);

    events.push({
      tick: time,
      processId: p.id,
      type: 'complete',
      description: `${p.name} completes at ${time} — waited ${p.waitTime} time units behind earlier arrivals`,
    });
  }

  // Sort events chronologically then by type order for readability
  events.sort((a, b) => a.tick - b.tick);

  return finalise('FCFS', procs, events, gantt);
}

// ---------------------------------------------------------------------------
// 2. Shortest Job First (SJF) -- non-preemptive & preemptive (SRTF)
// ---------------------------------------------------------------------------

/**
 * Shortest Job First scheduling.
 *
 * When `preemptive` is true this becomes Shortest Remaining Time First
 * (SRTF): whenever a new process arrives with a shorter remaining time
 * than the currently running process, the current process is preempted.
 */
export function sjf(
  processes: Process[],
  preemptive: boolean = false,
): ScheduleResult {
  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];

  const remaining = new Map<string, Process>(procs.map((p) => [p.id, p]));
  const arrived = new Set<string>();
  const completed = new Set<string>();
  const started = new Set<string>();

  let time = 0;
  let running: Process | null = null;
  const totalProcs = procs.length;

  // Determine end boundary
  const maxArrival = Math.max(...procs.map((p) => p.arrivalTime));
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
  const upperBound = maxArrival + totalBurst + 1;

  while (completed.size < totalProcs && time < upperBound) {
    // Check for arrivals at current tick
    for (const p of procs) {
      if (p.arrivalTime === time && !arrived.has(p.id)) {
        arrived.add(p.id);
        events.push({
          tick: time,
          processId: p.id,
          type: 'arrive',
          description: `${p.name} arrives (burst=${p.burstTime})`,
        });
      }
    }

    // Gather ready processes
    const ready = procs.filter(
      (p) => arrived.has(p.id) && !completed.has(p.id) && p.remainingTime > 0,
    );

    if (ready.length === 0) {
      if (running === null) {
        // CPU idle
        const nextArrival = Math.min(
          ...procs
            .filter((p) => !arrived.has(p.id))
            .map((p) => p.arrivalTime),
        );
        if (!isFinite(nextArrival)) break;
        events.push({
          tick: time,
          processId: null,
          type: 'idle',
          description: `CPU idle from ${time} to ${nextArrival} — no processes have arrived yet`,
        });
        pushGantt(gantt, null, time, nextArrival);
        time = nextArrival;
        continue;
      }
    }

    // Select shortest remaining (or shortest burst for non-preemptive)
    const pick = ready.sort((a, b) => a.remainingTime - b.remainingTime)[0];

    if (!pick) {
      time++;
      continue;
    }

    if (preemptive) {
      // Preemptive: check if we should switch
      if (running && running.id !== pick.id && running.remainingTime > 0) {
        events.push({
          tick: time,
          processId: running.id,
          type: 'preempt',
          description: `${running.name} preempted (remaining=${running.remainingTime}) — newly arrived ${pick.name} has shorter remaining time`,
        });
      }

      if (!started.has(pick.id)) {
        pick.startTime = time;
        pick.responseTime = time - pick.arrivalTime;
        started.add(pick.id);
        events.push({
          tick: time,
          processId: pick.id,
          type: 'start',
          description: `${pick.name} starts execution (burst=${pick.burstTime}) — SJF selects the process with shortest burst among ready processes`,
        });
      } else if (running?.id !== pick.id) {
        events.push({
          tick: time,
          processId: pick.id,
          type: 'resume',
          description: `${pick.name} resumes (remaining=${pick.remainingTime}) — SJF selects the process with shortest remaining time`,
        });
      }

      running = pick;
      pick.remainingTime--;
      pushGantt(gantt, pick.id, time, time + 1);
      time++;

      if (pick.remainingTime === 0) {
        pick.completionTime = time;
        pick.turnaroundTime = pick.completionTime - pick.arrivalTime;
        pick.waitTime = pick.turnaroundTime - pick.burstTime;
        completed.add(pick.id);
        events.push({
          tick: time,
          processId: pick.id,
          type: 'complete',
          description: `${pick.name} completes at ${time} — waited ${pick.waitTime} time units total`,
        });
        running = null;
      }
    } else {
      // Non-preemptive: run to completion
      if (running && running.id !== pick.id && running.remainingTime > 0) {
        // Shouldn't happen in non-preemptive but guard anyway
        time++;
        continue;
      }

      pick.startTime = time;
      pick.responseTime = time - pick.arrivalTime;
      started.add(pick.id);

      events.push({
        tick: time,
        processId: pick.id,
        type: 'start',
        description: `${pick.name} starts execution (burst=${pick.burstTime}) — SJF selects the process with shortest burst among ready processes`,
      });

      const endTime = time + pick.remainingTime;
      pushGantt(gantt, pick.id, time, endTime);

      // Check for arrivals during execution
      for (const p of procs) {
        if (
          p.arrivalTime > time &&
          p.arrivalTime < endTime &&
          !arrived.has(p.id)
        ) {
          arrived.add(p.id);
          events.push({
            tick: p.arrivalTime,
            processId: p.id,
            type: 'arrive',
            description: `${p.name} arrives (burst=${p.burstTime})`,
          });
        }
      }

      time = endTime;
      pick.remainingTime = 0;
      pick.completionTime = time;
      pick.turnaroundTime = pick.completionTime - pick.arrivalTime;
      pick.waitTime = pick.turnaroundTime - pick.burstTime;
      completed.add(pick.id);
      running = null;

      events.push({
        tick: time,
        processId: pick.id,
        type: 'complete',
        description: `${pick.name} completes at ${time} — waited ${pick.waitTime} time units total`,
      });
    }
  }

  events.sort((a, b) => a.tick - b.tick);
  return finalise(preemptive ? 'SRTF' : 'SJF', procs, events, gantt);
}

// ---------------------------------------------------------------------------
// 3. Round Robin
// ---------------------------------------------------------------------------

/**
 * Round Robin scheduling with a configurable time quantum.
 *
 * Processes are dispatched in FIFO order. Each process runs for at most
 * `quantum` time units before being preempted and placed at the back of
 * the ready queue.
 */
export function roundRobin(
  processes: Process[],
  quantum: number,
): ScheduleResult {
  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];

  const readyQueue: Process[] = [];
  const completed = new Set<string>();
  const started = new Set<string>();
  const inQueue = new Set<string>();

  // Sort by arrival for initial ordering
  const sorted = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);

  let time = 0;
  let idx = 0; // pointer into sorted arrival list

  // Seed arrivals at time 0
  while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
    readyQueue.push(sorted[idx]);
    inQueue.add(sorted[idx].id);
    events.push({
      tick: sorted[idx].arrivalTime,
      processId: sorted[idx].id,
      type: 'arrive',
      description: `${sorted[idx].name} arrives`,
    });
    idx++;
  }

  while (completed.size < procs.length) {
    if (readyQueue.length === 0) {
      // CPU idle -- jump to next arrival
      if (idx >= sorted.length) break;
      const nextTime = sorted[idx].arrivalTime;
      events.push({
        tick: time,
        processId: null,
        type: 'idle',
        description: `CPU idle from ${time} to ${nextTime} — no processes have arrived yet`,
      });
      pushGantt(gantt, null, time, nextTime);
      time = nextTime;
      while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
        readyQueue.push(sorted[idx]);
        inQueue.add(sorted[idx].id);
        events.push({
          tick: sorted[idx].arrivalTime,
          processId: sorted[idx].id,
          type: 'arrive',
          description: `${sorted[idx].name} arrives`,
        });
        idx++;
      }
      continue;
    }

    const p = readyQueue.shift()!;
    const runTime = Math.min(quantum, p.remainingTime);

    if (!started.has(p.id)) {
      p.startTime = time;
      p.responseTime = time - p.arrivalTime;
      started.add(p.id);
      events.push({
        tick: time,
        processId: p.id,
        type: 'start',
        description: `${p.name} starts (quantum=${quantum}, remaining=${p.remainingTime}) — Round Robin gives each process a fixed time slice for fairness`,
      });
    } else {
      events.push({
        tick: time,
        processId: p.id,
        type: 'resume',
        description: `${p.name} resumes (remaining=${p.remainingTime}) — Round Robin gives each process a fixed time slice for fairness`,
      });
    }

    pushGantt(gantt, p.id, time, time + runTime);
    p.remainingTime -= runTime;
    time += runTime;

    // Admit new arrivals that appeared during this run slice
    while (idx < sorted.length && sorted[idx].arrivalTime <= time) {
      readyQueue.push(sorted[idx]);
      inQueue.add(sorted[idx].id);
      events.push({
        tick: sorted[idx].arrivalTime,
        processId: sorted[idx].id,
        type: 'arrive',
        description: `${sorted[idx].name} arrives`,
      });
      idx++;
    }

    if (p.remainingTime === 0) {
      p.completionTime = time;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitTime = p.turnaroundTime - p.burstTime;
      completed.add(p.id);
      events.push({
        tick: time,
        processId: p.id,
        type: 'complete',
        description: `${p.name} completes at ${time} — waited ${p.waitTime} time units total`,
      });
    } else {
      events.push({
        tick: time,
        processId: p.id,
        type: 'preempt',
        description: `${p.name} preempted after quantum (remaining=${p.remainingTime}) — RR ensures no process monopolizes the CPU`,
      });
      readyQueue.push(p);
    }
  }

  events.sort((a, b) => a.tick - b.tick);
  return finalise('Round Robin', procs, events, gantt);
}

// ---------------------------------------------------------------------------
// 4. Priority Scheduling
// ---------------------------------------------------------------------------

/**
 * Priority-based scheduling (lower number = higher priority).
 *
 * When `preemptive` is true, the running process is preempted whenever a
 * higher-priority process arrives.
 */
export function priorityScheduling(
  processes: Process[],
  preemptive: boolean = false,
): ScheduleResult {
  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];

  const arrived = new Set<string>();
  const completed = new Set<string>();
  const started = new Set<string>();

  let time = 0;
  let running: Process | null = null;

  const maxArrival = Math.max(...procs.map((p) => p.arrivalTime));
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
  const upperBound = maxArrival + totalBurst + 1;

  while (completed.size < procs.length && time < upperBound) {
    // Arrivals
    for (const p of procs) {
      if (p.arrivalTime === time && !arrived.has(p.id)) {
        arrived.add(p.id);
        events.push({
          tick: time,
          processId: p.id,
          type: 'arrive',
          description: `${p.name} arrives (priority=${p.priority})`,
        });
      }
    }

    // Ready set
    const ready = procs.filter(
      (p) => arrived.has(p.id) && !completed.has(p.id) && p.remainingTime > 0,
    );

    if (ready.length === 0) {
      const nextArrival = Math.min(
        ...procs.filter((p) => !arrived.has(p.id)).map((p) => p.arrivalTime),
      );
      if (!isFinite(nextArrival)) break;
      events.push({
        tick: time,
        processId: null,
        type: 'idle',
        description: `CPU idle from ${time} to ${nextArrival} — no processes have arrived yet`,
      });
      pushGantt(gantt, null, time, nextArrival);
      time = nextArrival;
      continue;
    }

    // Pick highest priority (lowest number), break ties by arrival
    ready.sort(
      (a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime,
    );
    const pick = ready[0];

    if (preemptive) {
      if (running && running.id !== pick.id && running.remainingTime > 0) {
        events.push({
          tick: time,
          processId: running.id,
          type: 'preempt',
          description: `${running.name} preempted by higher-priority ${pick.name} — a more urgent process just arrived`,
        });
      }
      if (!started.has(pick.id)) {
        pick.startTime = time;
        pick.responseTime = time - pick.arrivalTime;
        started.add(pick.id);
        events.push({
          tick: time,
          processId: pick.id,
          type: 'start',
          description: `${pick.name} starts (priority=${pick.priority}) — Priority scheduling selects the process with lowest priority number (highest urgency)`,
        });
      } else if (running?.id !== pick.id) {
        events.push({
          tick: time,
          processId: pick.id,
          type: 'resume',
          description: `${pick.name} resumes (remaining=${pick.remainingTime}) — Priority scheduling selects the process with lowest priority number (highest urgency)`,
        });
      }
      running = pick;
      pick.remainingTime--;
      pushGantt(gantt, pick.id, time, time + 1);
      time++;

      if (pick.remainingTime === 0) {
        pick.completionTime = time;
        pick.turnaroundTime = pick.completionTime - pick.arrivalTime;
        pick.waitTime = pick.turnaroundTime - pick.burstTime;
        completed.add(pick.id);
        events.push({
          tick: time,
          processId: pick.id,
          type: 'complete',
          description: `${pick.name} completes at ${time} — waited ${pick.waitTime} time units total`,
        });
        running = null;
      }
    } else {
      // Non-preemptive
      pick.startTime = time;
      pick.responseTime = time - pick.arrivalTime;
      started.add(pick.id);
      events.push({
        tick: time,
        processId: pick.id,
        type: 'start',
        description: `${pick.name} starts (priority=${pick.priority}, burst=${pick.burstTime}) — Priority scheduling selects the process with lowest priority number (highest urgency)`,
      });

      const endTime = time + pick.remainingTime;
      pushGantt(gantt, pick.id, time, endTime);

      // Record arrivals that happen during execution
      for (const p of procs) {
        if (
          p.arrivalTime > time &&
          p.arrivalTime < endTime &&
          !arrived.has(p.id)
        ) {
          arrived.add(p.id);
          events.push({
            tick: p.arrivalTime,
            processId: p.id,
            type: 'arrive',
            description: `${p.name} arrives (priority=${p.priority})`,
          });
        }
      }

      time = endTime;
      pick.remainingTime = 0;
      pick.completionTime = time;
      pick.turnaroundTime = pick.completionTime - pick.arrivalTime;
      pick.waitTime = pick.turnaroundTime - pick.burstTime;
      completed.add(pick.id);
      running = null;
      events.push({
        tick: time,
        processId: pick.id,
        type: 'complete',
        description: `${pick.name} completes at ${time} — waited ${pick.waitTime} time units total`,
      });
    }
  }

  events.sort((a, b) => a.tick - b.tick);
  return finalise(
    preemptive ? 'Priority (Preemptive)' : 'Priority (Non-preemptive)',
    procs,
    events,
    gantt,
  );
}

// ---------------------------------------------------------------------------
// 5. Multi-Level Feedback Queue (MLFQ)
// ---------------------------------------------------------------------------

/**
 * Multi-Level Feedback Queue scheduling.
 *
 * Multiple queues are ordered by priority (index 0 = highest). Each queue
 * has its own time quantum. A process that exhausts its quantum is demoted
 * to the next lower-priority queue. Processes in a higher-priority queue
 * always preempt those in lower queues.
 *
 * @param queues - Ordered from highest to lowest priority. Each entry
 *   specifies the time quantum for that level.
 */
export function mlfq(
  processes: Process[],
  queues: Array<{ quantum: number; priority: number }>,
): ScheduleResult {
  const procs = cloneProcesses(processes);
  const events: ScheduleEvent[] = [];
  const gantt: Array<{ processId: string | null; start: number; end: number }> =
    [];

  // Sort queue levels by priority (lower = higher priority)
  const levels = [...queues].sort((a, b) => a.priority - b.priority);

  // Per-level ready queues
  const levelQueues: Process[][] = levels.map(() => []);

  const arrived = new Set<string>();
  const completed = new Set<string>();
  const started = new Set<string>();
  const processLevel = new Map<string, number>(); // process ID -> level index

  let time = 0;
  const sorted = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let arrIdx = 0;

  const maxArrival = Math.max(...procs.map((p) => p.arrivalTime));
  const totalBurst = procs.reduce((s, p) => s + p.burstTime, 0);
  const upperBound = maxArrival + totalBurst + 1;

  /** Admit all processes that have arrived by `time`. */
  function admitArrivals(): void {
    while (arrIdx < sorted.length && sorted[arrIdx].arrivalTime <= time) {
      const p = sorted[arrIdx];
      if (!arrived.has(p.id)) {
        arrived.add(p.id);
        processLevel.set(p.id, 0); // new processes enter top queue
        levelQueues[0].push(p);
        events.push({
          tick: time,
          processId: p.id,
          type: 'arrive',
          description: `${p.name} arrives -> queue level 0`,
        });
      }
      arrIdx++;
    }
  }

  /** Pick the highest-priority non-empty queue and dequeue. */
  function pickNext(): { process: Process; level: number } | null {
    for (let i = 0; i < levelQueues.length; i++) {
      if (levelQueues[i].length > 0) {
        return { process: levelQueues[i].shift()!, level: i };
      }
    }
    return null;
  }

  while (completed.size < procs.length && time < upperBound) {
    admitArrivals();

    const next = pickNext();
    if (!next) {
      // CPU idle -- jump to next arrival
      if (arrIdx >= sorted.length) break;
      const nextTime = sorted[arrIdx].arrivalTime;
      events.push({
        tick: time,
        processId: null,
        type: 'idle',
        description: `CPU idle from ${time} to ${nextTime}`,
      });
      pushGantt(gantt, null, time, nextTime);
      time = nextTime;
      continue;
    }

    const { process: p, level } = next;
    const quantum = levels[level].quantum;
    const runTime = Math.min(quantum, p.remainingTime);

    if (!started.has(p.id)) {
      p.startTime = time;
      p.responseTime = time - p.arrivalTime;
      started.add(p.id);
      events.push({
        tick: time,
        processId: p.id,
        type: 'start',
        description: `${p.name} starts at level ${level} (quantum=${quantum})`,
      });
    } else {
      events.push({
        tick: time,
        processId: p.id,
        type: 'resume',
        description: `${p.name} resumes at level ${level} (quantum=${quantum}, remaining=${p.remainingTime})`,
      });
    }

    // Execute for runTime ticks -- check for preemption at each tick
    let ranFor = 0;
    let preempted = false;

    for (let t = 0; t < runTime; t++) {
      p.remainingTime--;
      ranFor++;
      time++;

      // Admit new arrivals during execution
      admitArrivals();

      // Check if a higher-priority queue now has a waiting process
      if (p.remainingTime > 0) {
        let higherReady = false;
        for (let hl = 0; hl < level; hl++) {
          if (levelQueues[hl].length > 0) {
            higherReady = true;
            break;
          }
        }
        if (higherReady) {
          preempted = true;
          break;
        }
      }
    }

    pushGantt(gantt, p.id, time - ranFor, time);

    if (p.remainingTime === 0) {
      p.completionTime = time;
      p.turnaroundTime = p.completionTime - p.arrivalTime;
      p.waitTime = p.turnaroundTime - p.burstTime;
      completed.add(p.id);
      events.push({
        tick: time,
        processId: p.id,
        type: 'complete',
        description: `${p.name} completes at ${time}`,
      });
    } else if (preempted) {
      // Return to same level (preempted by higher-priority arrival)
      events.push({
        tick: time,
        processId: p.id,
        type: 'preempt',
        description: `${p.name} preempted by higher-priority process at level ${level}`,
      });
      levelQueues[level].push(p);
    } else {
      // Used full quantum without completing -> demote
      const nextLevel = Math.min(level + 1, levels.length - 1);
      processLevel.set(p.id, nextLevel);
      events.push({
        tick: time,
        processId: p.id,
        type: 'demote',
        description: `${p.name} quantum expired -> demoted to level ${nextLevel}`,
      });
      levelQueues[nextLevel].push(p);
    }
  }

  events.sort((a, b) => a.tick - b.tick);
  return finalise('MLFQ', procs, events, gantt);
}

// ---------------------------------------------------------------------------
// Comparison helper
// ---------------------------------------------------------------------------

/**
 * Run all scheduling algorithms on the same process set and return a
 * mapping from algorithm name to its result.
 */
export function compareAlgorithms(
  processes: Process[],
): Record<string, ScheduleResult> {
  return {
    FCFS: fcfs(processes),
    SJF: sjf(processes, false),
    SRTF: sjf(processes, true),
    'Round Robin (q=2)': roundRobin(processes, 2),
    'Priority (Non-preemptive)': priorityScheduling(processes, false),
    'Priority (Preemptive)': priorityScheduling(processes, true),
    MLFQ: mlfq(processes, [
      { quantum: 2, priority: 0 },
      { quantum: 4, priority: 1 },
      { quantum: 8, priority: 2 },
    ]),
  };
}
