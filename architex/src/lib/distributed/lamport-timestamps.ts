// -----------------------------------------------------------------
// Architex -- Lamport Timestamp Simulation  [DIS-016]
// -----------------------------------------------------------------
//
// Implements scalar Lamport timestamps for ordering events
// across distributed processes. Unlike vector clocks, Lamport
// timestamps cannot detect concurrency -- they only provide
// a partial ordering where a -> b implies L(a) < L(b), but
// L(a) < L(b) does NOT imply a -> b.
// -----------------------------------------------------------------

/** A single event in the Lamport timestamp simulation. */
export interface LamportEvent {
  /** Monotonically increasing event id. */
  id: number;
  /** Process that performed the event. */
  processId: string;
  /** Kind of event. */
  type: 'local' | 'send' | 'receive';
  /** Lamport timestamp *after* this event. */
  timestamp: number;
  /** For send/receive: the other process involved. */
  targetProcessId?: string;
  /** Human-readable summary. */
  description: string;
  /** Simulation tick when the event occurred. */
  tick: number;
}

/**
 * Simulates Lamport timestamps across a set of named processes.
 *
 * Rules:
 * 1. Local event: increment own clock.
 * 2. Send: increment own clock, attach timestamp to message.
 * 3. Receive: clock = max(local, received) + 1.
 *
 * Key limitation compared to vector clocks: Lamport timestamps
 * give a total order consistent with causality but cannot detect
 * whether two events are concurrent. If L(a) < L(b), event `a`
 * may or may not have happened before `b`.
 *
 * @example
 * ```ts
 * const sim = new LamportSimulation(['A', 'B', 'C']);
 * sim.localEvent('A');
 * const sent = sim.sendEvent('A', 'B');
 * sim.receiveEvent('B', sent.timestamp);
 * ```
 */
export class LamportSimulation {
  /** Current scalar clock per process. */
  private clocks: Map<string, number>;
  /** Ordered list of process identifiers. */
  private processIds: string[];
  /** Full event history. */
  private events: LamportEvent[];
  /** Next event id counter. */
  private nextId: number;
  /** Current simulation tick. */
  private tick: number;

  constructor(processIds: string[]) {
    if (processIds.length === 0) {
      throw new Error('LamportSimulation requires at least one process.');
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

  // -- Public API ---------------------------------------------------

  /**
   * Records a local event on the given process.
   * Increments that process's Lamport clock by 1.
   */
  localEvent(processId: string): LamportEvent {
    this.assertProcess(processId);
    const newTime = (this.clocks.get(processId) ?? 0) + 1;
    this.clocks.set(processId, newTime);
    this.tick++;

    const event: LamportEvent = {
      id: this.nextId++,
      processId,
      type: 'local',
      timestamp: newTime,
      description: `Process ${processId} performed a local event. L=${newTime}`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Records a message send from one process to another.
   * Increments the sender's clock, returns the event whose timestamp
   * the caller should pass to `receiveEvent`.
   */
  sendEvent(from: string, to: string): LamportEvent {
    this.assertProcess(from);
    this.assertProcess(to);
    if (from === to) {
      throw new Error('A process cannot send a message to itself.');
    }

    const newTime = (this.clocks.get(from) ?? 0) + 1;
    this.clocks.set(from, newTime);
    this.tick++;

    const event: LamportEvent = {
      id: this.nextId++,
      processId: from,
      type: 'send',
      timestamp: newTime,
      targetProcessId: to,
      description: `Process ${from} sent msg to ${to}. L=${newTime}`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Records a message receive on a process.
   * Sets clock to max(local, senderTimestamp) + 1.
   *
   * @param to - The receiving process.
   * @param senderTimestamp - The Lamport timestamp from the send event.
   */
  receiveEvent(to: string, senderTimestamp: number): LamportEvent {
    this.assertProcess(to);

    const localTime = this.clocks.get(to) ?? 0;
    const newTime = Math.max(localTime, senderTimestamp) + 1;
    this.clocks.set(to, newTime);
    this.tick++;

    const event: LamportEvent = {
      id: this.nextId++,
      processId: to,
      type: 'receive',
      timestamp: newTime,
      description: `Process ${to} received msg. max(${localTime},${senderTimestamp})+1 = L=${newTime}`,
      tick: this.tick,
    };
    this.events.push(event);
    return event;
  }

  /** Returns the full ordered event log. */
  getEvents(): LamportEvent[] {
    return [...this.events];
  }

  /** Returns the list of process identifiers. */
  getProcessIds(): string[] {
    return [...this.processIds];
  }

  /** Returns the current Lamport clock for a process. */
  getTimestamp(processId: string): number {
    this.assertProcess(processId);
    return this.clocks.get(processId) ?? 0;
  }

  /** Resets all clocks and event history. */
  reset(): void {
    this.events = [];
    this.nextId = 0;
    this.tick = 0;
    this.initClocks();
  }

  // -- Internals ----------------------------------------------------

  /** Initialise all clocks to zero. */
  private initClocks(): void {
    this.clocks.clear();
    for (const pid of this.processIds) {
      this.clocks.set(pid, 0);
    }
  }

  /** Throws if the process is unknown. */
  private assertProcess(processId: string): void {
    if (!this.clocks.has(processId)) {
      throw new Error(`Unknown process: "${processId}".`);
    }
  }
}
