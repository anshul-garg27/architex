// ─────────────────────────────────────────────────────────────
// Architex — Vector Clock Simulation
// ─────────────────────────────────────────────────────────────
//
// Implements Lamport-style vector clocks for tracking causal
// ordering of events across distributed processes. Supports
// local events, send/receive pairs, and causality queries.
// ─────────────────────────────────────────────────────────────

/** Immutable snapshot of one process's vector clock. */
export interface VectorClock {
  /** Owning process identifier. */
  processId: string;
  /** Map of process-id to logical timestamp. */
  clock: Record<string, number>;
}

/** Discriminator for event kinds. */
export type ClockEventType = 'local' | 'send' | 'receive';

/** A recorded event in the simulation timeline. */
export interface ClockEvent {
  /** Monotonically increasing event id. */
  id: number;
  /** Process that performed the event. */
  processId: string;
  /** Kind of event. */
  type: ClockEventType;
  /** Vector clock state *after* this event. */
  clock: Record<string, number>;
  /** For send/receive: the other process involved. */
  targetProcessId?: string;
  /** Human-readable summary. */
  description: string;
  /** Simulation tick when the event occurred. */
  tick: number;
}

/**
 * Simulates vector clocks across a set of named processes.
 *
 * @example
 * ```ts
 * const sim = new VectorClockSimulation(['A', 'B', 'C']);
 * sim.localEvent('A');
 * const sent = sim.sendEvent('A', 'B');
 * sim.receiveEvent('B', 'A', sent.clock);
 * console.log(sim.happensBefore(sim.getEvents()[0], sim.getEvents()[2])); // true
 * ```
 */
export class VectorClockSimulation {
  /** Current vector clock per process. */
  private clocks: Map<string, Record<string, number>>;
  /** Ordered list of process identifiers. */
  private processIds: string[];
  /** Full event history. */
  private events: ClockEvent[];
  /** Next event id counter. */
  private nextId: number;
  /** Current simulation tick. */
  private tick: number;

  constructor(processIds: string[]) {
    if (processIds.length === 0) {
      throw new Error('VectorClockSimulation requires at least one process.');
    }
    if (new Set(processIds).size !== processIds.length) {
      throw new Error('Duplicate process IDs are not allowed.');
    }
    this.processIds = [...processIds];
    this.clocks = new Map();
    this.events = [];
    this.nextId = 0;
    this.tick = 0;
    this.initClocks();
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Records a local event on the given process.
   * Increments that process's own component in the vector clock.
   */
  localEvent(processId: string): ClockEvent {
    this.assertProcess(processId);
    const vc = this.clocks.get(processId)!;
    vc[processId] = (vc[processId] ?? 0) + 1;
    this.tick++;

    const event: ClockEvent = {
      id: this.nextId++,
      processId,
      type: 'local',
      clock: { ...vc },
      description: `Process ${processId} performed a local event.`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Records a message send from one process to another.
   * Increments the sender's own clock component.
   * Returns the event (caller should pass `event.clock` to `receiveEvent`).
   */
  sendEvent(fromId: string, toId: string): ClockEvent {
    this.assertProcess(fromId);
    this.assertProcess(toId);
    if (fromId === toId) {
      throw new Error('A process cannot send a message to itself.');
    }

    const vc = this.clocks.get(fromId)!;
    vc[fromId] = (vc[fromId] ?? 0) + 1;
    this.tick++;

    const event: ClockEvent = {
      id: this.nextId++,
      processId: fromId,
      type: 'send',
      clock: { ...vc },
      targetProcessId: toId,
      description: `Process ${fromId} sent a message to ${toId}.`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Records a message receive on `toId` from `fromId`.
   * Merges the incoming clock (element-wise max) then increments the
   * receiver's own component.
   *
   * @param senderClock - The vector clock snapshot from the corresponding send event.
   */
  receiveEvent(
    toId: string,
    fromId: string,
    senderClock: Record<string, number>,
  ): ClockEvent {
    this.assertProcess(toId);
    this.assertProcess(fromId);

    const vc = this.clocks.get(toId)!;
    // Element-wise max merge
    for (const pid of this.processIds) {
      vc[pid] = Math.max(vc[pid] ?? 0, senderClock[pid] ?? 0);
    }
    // Increment receiver's own component
    vc[toId] = (vc[toId] ?? 0) + 1;
    this.tick++;

    const event: ClockEvent = {
      id: this.nextId++,
      processId: toId,
      type: 'receive',
      clock: { ...vc },
      targetProcessId: fromId,
      description: `Process ${toId} received a message from ${fromId}.`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Returns `true` if event e1 causally "happens before" event e2.
   * e1 -> e2 iff e1.clock <= e2.clock component-wise AND e1.clock != e2.clock.
   */
  happensBefore(e1: ClockEvent, e2: ClockEvent): boolean {
    let strictlyLess = false;
    for (const pid of this.processIds) {
      const v1 = e1.clock[pid] ?? 0;
      const v2 = e2.clock[pid] ?? 0;
      if (v1 > v2) return false;
      if (v1 < v2) strictlyLess = true;
    }
    return strictlyLess;
  }

  /**
   * Returns `true` if neither event causally precedes the other.
   * Two events are concurrent iff !(e1 -> e2) && !(e2 -> e1).
   */
  areConcurrent(e1: ClockEvent, e2: ClockEvent): boolean {
    return !this.happensBefore(e1, e2) && !this.happensBefore(e2, e1);
  }

  /** Returns the full ordered event log. */
  getEvents(): ClockEvent[] {
    return [...this.events];
  }

  /** Returns the current vector clock state for a given process. */
  getProcessState(processId: string): VectorClock {
    this.assertProcess(processId);
    return {
      processId,
      clock: { ...this.clocks.get(processId)! },
    };
  }

  /** Resets all clocks and event history. */
  reset(): void {
    this.events = [];
    this.nextId = 0;
    this.tick = 0;
    this.initClocks();
  }

  // ── Internals ──────────────────────────────────────────────

  /** Initialise all clocks to zero vectors. */
  private initClocks(): void {
    this.clocks.clear();
    for (const pid of this.processIds) {
      const vc: Record<string, number> = {};
      for (const p of this.processIds) {
        vc[p] = 0;
      }
      this.clocks.set(pid, vc);
    }
  }

  /** Throws if the process is unknown. */
  private assertProcess(processId: string): void {
    if (!this.clocks.has(processId)) {
      throw new Error(`Unknown process: "${processId}".`);
    }
  }
}
