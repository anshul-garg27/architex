/**
 * Context Switching Simulation  (OSC-062)
 *
 * Simulates the phases of a CPU context switch between processes,
 * emitting tick-by-tick {@link ContextSwitchEvent} records that
 * visualize register save/restore, TLB flushes, cache invalidation,
 * and the resume phase.
 *
 * Also provides a comparison between process-level switches (which
 * require TLB flushes and cache invalidation) and thread-level
 * switches (which share the same address space and skip those phases).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContextSwitchEvent {
  tick: number;
  phase:
    | 'save-registers'
    | 'flush-tlb'
    | 'invalidate-cache'
    | 'restore-registers'
    | 'resume';
  processFrom: string;
  processTo: string;
  description: string;
  costCycles: number;
}

export interface ContextSwitchResult {
  events: ContextSwitchEvent[];
  totalCycles: number;
  switchCount: number;
}

export interface ContextSwitchProcess {
  id: string;
  name: string;
  burstTime: number;
}

// ---------------------------------------------------------------------------
// Constants — cycle costs for each context-switch phase
// ---------------------------------------------------------------------------

/** Cycle cost to save all general-purpose + special registers to the PCB. */
const SAVE_REGISTERS_CYCLES = 50;

/** Cycle cost to flush the Translation Lookaside Buffer on a process switch. */
const FLUSH_TLB_CYCLES = 200;

/**
 * Cycle cost to invalidate / cold-start relevant cache lines when the
 * new process has a completely different working set.
 */
const INVALIDATE_CACHE_CYCLES = 300;

/** Cycle cost to restore registers from the incoming process's PCB. */
const RESTORE_REGISTERS_CYCLES = 50;

/** Cycle cost for the minimal bookkeeping before the process resumes. */
const RESUME_CYCLES = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone processes so mutations stay local to the simulation run. */
function cloneProcesses(ps: ContextSwitchProcess[]): ContextSwitchProcess[] {
  return ps.map((p) => ({ ...p }));
}

/**
 * Emit the full sequence of context-switch events between two processes.
 *
 * When `isThreadSwitch` is true the TLB flush and cache invalidation
 * phases are skipped because threads within the same process share a
 * virtual-address space.
 */
function emitSwitchEvents(
  tick: number,
  from: ContextSwitchProcess,
  to: ContextSwitchProcess,
  isThreadSwitch: boolean,
): { events: ContextSwitchEvent[]; cyclesUsed: number } {
  const events: ContextSwitchEvent[] = [];
  let t = tick;

  // Phase 1 — save registers
  events.push({
    tick: t,
    phase: 'save-registers',
    processFrom: from.id,
    processTo: to.id,
    description:
      `CPU saves ${from.name}'s registers (PC, SP, GPRs) into its Process Control Block ` +
      `because the scheduler needs to preserve ${from.name}'s execution state for later resumption.`,
    costCycles: SAVE_REGISTERS_CYCLES,
  });
  t += SAVE_REGISTERS_CYCLES;

  if (!isThreadSwitch) {
    // Phase 2 — TLB flush (process switch only)
    events.push({
      tick: t,
      phase: 'flush-tlb',
      processFrom: from.id,
      processTo: to.id,
      description:
        `CPU flushes the TLB because ${to.name} has a different virtual-address space than ${from.name}. ` +
        `All cached page-table entries are now invalid and must be re-fetched on first access.`,
      costCycles: FLUSH_TLB_CYCLES,
    });
    t += FLUSH_TLB_CYCLES;

    // Phase 3 — cache invalidation (process switch only)
    events.push({
      tick: t,
      phase: 'invalidate-cache',
      processFrom: from.id,
      processTo: to.id,
      description:
        `CPU invalidates cache lines associated with ${from.name}'s working set ` +
        `because ${to.name} will access different physical memory pages, causing compulsory cache misses.`,
      costCycles: INVALIDATE_CACHE_CYCLES,
    });
    t += INVALIDATE_CACHE_CYCLES;
  }

  // Phase 4 — restore registers
  events.push({
    tick: t,
    phase: 'restore-registers',
    processFrom: from.id,
    processTo: to.id,
    description:
      `CPU loads ${to.name}'s saved registers from its PCB ` +
      `because execution must resume exactly where ${to.name} was last preempted.`,
    costCycles: RESTORE_REGISTERS_CYCLES,
  });
  t += RESTORE_REGISTERS_CYCLES;

  // Phase 5 — resume
  events.push({
    tick: t,
    phase: 'resume',
    processFrom: from.id,
    processTo: to.id,
    description:
      `${to.name} resumes execution at its saved program counter. ` +
      `The context switch is complete and ${to.name} now owns the CPU.`,
    costCycles: RESUME_CYCLES,
  });
  t += RESUME_CYCLES;

  return { events, cyclesUsed: t - tick };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Simulate Round-Robin scheduling with context switches between processes.
 *
 * For each quantum expiration a full context-switch sequence is emitted
 * showing the cost of saving/restoring state, flushing the TLB, and
 * invalidating the cache.
 *
 * @param processes - The set of processes to schedule.
 * @param quantum   - Time quantum in cycles before a preemption occurs.
 */
export function simulateContextSwitch(
  processes: ContextSwitchProcess[],
  quantum: number,
): ContextSwitchResult {
  const procs = cloneProcesses(processes);

  if (procs.length === 0) {
    return { events: [], totalCycles: 0, switchCount: 0 };
  }

  if (procs.length === 1) {
    // A single process never needs a context switch.
    return { events: [], totalCycles: procs[0].burstTime, switchCount: 0 };
  }

  const events: ContextSwitchEvent[] = [];
  let tick = 0;
  let switchCount = 0;

  // Build a round-robin ready queue with remaining burst tracking
  const remaining = new Map<string, number>();
  for (const p of procs) {
    remaining.set(p.id, p.burstTime);
  }

  const queue: ContextSwitchProcess[] = [...procs];
  let currentProcess: ContextSwitchProcess = queue.shift()!;

  while (queue.length > 0 || remaining.get(currentProcess.id)! > 0) {
    const rem = remaining.get(currentProcess.id)!;
    if (rem <= 0) {
      // Current process already finished; pick next if available
      if (queue.length === 0) break;
      const nextProcess = queue.shift()!;
      const { events: switchEvents, cyclesUsed } = emitSwitchEvents(
        tick,
        currentProcess,
        nextProcess,
        false,
      );
      events.push(...switchEvents);
      tick += cyclesUsed;
      switchCount++;
      currentProcess = nextProcess;
      continue;
    }

    const runTime = Math.min(quantum, rem);
    remaining.set(currentProcess.id, rem - runTime);
    tick += runTime;

    // If current process still has remaining time, re-enqueue it
    if (remaining.get(currentProcess.id)! > 0) {
      queue.push(currentProcess);
    }

    // If there are more processes to run, perform a context switch
    if (queue.length > 0) {
      const nextProcess = queue.shift()!;

      const { events: switchEvents, cyclesUsed } = emitSwitchEvents(
        tick,
        currentProcess,
        nextProcess,
        false,
      );
      events.push(...switchEvents);
      tick += cyclesUsed;
      switchCount++;

      currentProcess = nextProcess;
    }
  }

  return {
    events,
    totalCycles: tick,
    switchCount,
  };
}

/**
 * Compare the cost of process-level context switches against
 * thread-level context switches for the same workload.
 *
 * Thread switches omit TLB flushes and cache invalidation because all
 * threads within a process share the same address space.
 *
 * @param processCount - Number of processes (and corresponding threads)
 *   to include in the comparison.  Each gets a burst time of 100 cycles
 *   and a quantum of 20 cycles so there are multiple switches.
 */
export function compareProcessVsThreadSwitch(processCount: number): {
  processSwitch: ContextSwitchResult;
  threadSwitch: ContextSwitchResult;
} {
  const count = Math.max(2, Math.min(processCount, 10));
  const burstTime = 100;
  const quantum = 20;

  // --- Process switch simulation (full cost) ---
  const processDefs: ContextSwitchProcess[] = [];
  for (let i = 0; i < count; i++) {
    processDefs.push({ id: `P${i}`, name: `Process-${i}`, burstTime });
  }
  const processSwitch = simulateContextSwitch(processDefs, quantum);

  // --- Thread switch simulation (cheaper — no TLB/cache cost) ---
  const threadDefs: ContextSwitchProcess[] = [];
  for (let i = 0; i < count; i++) {
    threadDefs.push({ id: `T${i}`, name: `Thread-${i}`, burstTime });
  }

  // We cannot reuse simulateContextSwitch directly since it always emits
  // process-level switches, so we replicate the logic with isThreadSwitch=true.
  const threadEvents: ContextSwitchEvent[] = [];
  let tick = 0;
  let threadSwitchCount = 0;

  const remaining = new Map<string, number>();
  for (const t of threadDefs) {
    remaining.set(t.id, t.burstTime);
  }

  const queue: ContextSwitchProcess[] = [...threadDefs];
  let current: ContextSwitchProcess = queue.shift()!;

  while (queue.length > 0 || remaining.get(current.id)! > 0) {
    const rem = remaining.get(current.id)!;
    if (rem <= 0) {
      if (queue.length === 0) break;
      const next = queue.shift()!;
      const { events, cyclesUsed } = emitSwitchEvents(tick, current, next, true);
      threadEvents.push(...events);
      tick += cyclesUsed;
      threadSwitchCount++;
      current = next;
      continue;
    }

    const runTime = Math.min(quantum, rem);
    remaining.set(current.id, rem - runTime);
    tick += runTime;

    if (remaining.get(current.id)! > 0) {
      queue.push(current);
    }

    if (queue.length > 0) {
      const next = queue.shift()!;
      const { events, cyclesUsed } = emitSwitchEvents(tick, current, next, true);
      threadEvents.push(...events);
      tick += cyclesUsed;
      threadSwitchCount++;
      current = next;
    }
  }

  const threadResult: ContextSwitchResult = {
    events: threadEvents,
    totalCycles: tick,
    switchCount: threadSwitchCount,
  };

  return { processSwitch, threadSwitch: threadResult };
}
