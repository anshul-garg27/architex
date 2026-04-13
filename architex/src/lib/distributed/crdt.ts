// ─────────────────────────────────────────────────────────────
// Architex — CRDT Implementations
// ─────────────────────────────────────────────────────────────
//
// Provides four Conflict-free Replicated Data Types:
//   1. GCounter  — grow-only counter
//   2. PNCounter — positive-negative counter
//   3. LWWRegister — last-writer-wins register
//   4. ORSet    — observed-remove set
//
// Each CRDT supports independent mutation on replicas and a
// commutative, associative, idempotent merge() operation.
// A CRDTSimulation wraps N replicas for interactive demos.
// ─────────────────────────────────────────────────────────────

// ── Shared types ─────────────────────────────────────────────

/** Event emitted by the simulation for playback. */
export interface CRDTEvent {
  /** Simulation tick. */
  tick: number;
  /** Type of operation that occurred. */
  type: 'increment' | 'decrement' | 'set' | 'add' | 'remove' | 'merge';
  /** Replica that performed the operation. */
  replicaId: string;
  /** Target replica (for merge operations). */
  targetReplicaId?: string;
  /** Human-readable description. */
  description: string;
  /** Resulting value after the operation. */
  resultValue: unknown;
}

// ═════════════════════════════════════════════════════════════
// 1. G-Counter (Grow-Only Counter)
// ═════════════════════════════════════════════════════════════

/**
 * A grow-only counter where each replica maintains its own
 * increment count. The global value is the sum of all entries.
 * Merge takes the element-wise maximum.
 */
export class GCounter {
  /** Owning replica id. */
  readonly replicaId: string;
  /** Per-replica counts. */
  private counts: Record<string, number>;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
    this.counts = { [replicaId]: 0 };
  }

  /** Increments this replica's count by `amount` (default 1). */
  increment(amount: number = 1): void {
    if (amount < 0) throw new Error('GCounter only supports non-negative increments.');
    this.counts[this.replicaId] = (this.counts[this.replicaId] ?? 0) + amount;
  }

  /** Returns the aggregated counter value across all replicas. */
  value(): number {
    let sum = 0;
    for (const k of Object.keys(this.counts)) {
      sum += this.counts[k];
    }
    return sum;
  }

  /** Merges another GCounter's state into this one (element-wise max). */
  merge(other: GCounter): void {
    for (const [rid, count] of Object.entries(other.getState())) {
      this.counts[rid] = Math.max(this.counts[rid] ?? 0, count);
    }
  }

  /** Returns a copy of the internal state (for serialisation / merge). */
  getState(): Record<string, number> {
    return { ...this.counts };
  }
}

// ═════════════════════════════════════════════════════════════
// 2. PN-Counter (Positive-Negative Counter)
// ═════════════════════════════════════════════════════════════

/**
 * A counter that supports both increment and decrement by
 * maintaining two internal G-Counters: one for positive
 * increments and one for negative (decrements).
 * value = P.value() - N.value()
 */
export class PNCounter {
  readonly replicaId: string;
  private p: GCounter;
  private n: GCounter;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
    this.p = new GCounter(replicaId);
    this.n = new GCounter(replicaId);
  }

  /** Increments the counter by `amount` (default 1). */
  increment(amount: number = 1): void {
    if (amount < 0) throw new Error('Use decrement() for negative values.');
    this.p.increment(amount);
  }

  /** Decrements the counter by `amount` (default 1). */
  decrement(amount: number = 1): void {
    if (amount < 0) throw new Error('Decrement amount must be non-negative.');
    this.n.increment(amount);
  }

  /** Returns P - N. */
  value(): number {
    return this.p.value() - this.n.value();
  }

  /** Merges another PNCounter's state. */
  merge(other: PNCounter): void {
    this.p.merge(other.getPositive());
    this.n.merge(other.getNegative());
  }

  /** Exposes the positive G-Counter (for merge). */
  getPositive(): GCounter {
    return this.p;
  }

  /** Exposes the negative G-Counter (for merge). */
  getNegative(): GCounter {
    return this.n;
  }
}

// ═════════════════════════════════════════════════════════════
// 3. LWW-Register (Last-Writer-Wins Register)
// ═════════════════════════════════════════════════════════════

/** Internal state of an LWW register. */
export interface LWWState<T> {
  value: T | null;
  timestamp: number;
  replicaId: string;
}

/**
 * A register where the write with the highest timestamp wins.
 * Ties are broken by replica-id lexicographic order.
 */
export class LWWRegister<T = string> {
  readonly replicaId: string;
  private state: LWWState<T>;
  /** Monotonic logical clock for this replica. */
  private clock: number;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
    this.clock = 0;
    this.state = { value: null, timestamp: 0, replicaId };
  }

  /** Sets the register value. Automatically assigns the next timestamp. */
  set(value: T): void {
    this.clock++;
    this.state = { value, timestamp: this.clock, replicaId: this.replicaId };
  }

  /** Returns the current value (may be null if never set). */
  value(): T | null {
    return this.state.value;
  }

  /** Returns the current timestamp. */
  timestamp(): number {
    return this.state.timestamp;
  }

  /**
   * Merges another register into this one.
   * The write with the higher timestamp wins.
   * On ties, higher replica-id (lexicographic) wins.
   */
  merge(other: LWWRegister<T>): void {
    const otherState = other.getState();
    // Advance our clock past the other's timestamp
    this.clock = Math.max(this.clock, otherState.timestamp);

    if (
      otherState.timestamp > this.state.timestamp ||
      (otherState.timestamp === this.state.timestamp &&
        otherState.replicaId > this.state.replicaId)
    ) {
      this.state = { ...otherState };
    }
  }

  /** Returns a copy of internal state. */
  getState(): LWWState<T> {
    return { ...this.state };
  }
}

// ═════════════════════════════════════════════════════════════
// 4. OR-Set (Observed-Remove Set)
// ═════════════════════════════════════════════════════════════

/** A tagged element in the OR-Set. */
interface TaggedElement<T> {
  value: T;
  /** Globally unique tag (replicaId + sequence). */
  tag: string;
}

/**
 * An observed-remove set where add and remove are both
 * supported without conflicts. Each add generates a unique
 * tag; remove only removes tags that the remover has observed.
 */
export class ORSet<T = string> {
  readonly replicaId: string;
  /** Active elements: tag -> value. */
  private elements: Map<string, T>;
  /** Monotonic sequence for generating unique tags. */
  private seq: number;

  constructor(replicaId: string) {
    this.replicaId = replicaId;
    this.elements = new Map();
    this.seq = 0;
  }

  /** Adds a value, generating a unique tag. */
  add(value: T): void {
    this.seq++;
    const tag = `${this.replicaId}:${this.seq}`;
    this.elements.set(tag, value);
  }

  /**
   * Removes all observed occurrences of `value`.
   * Only tags currently in this replica's set are removed.
   */
  remove(value: T): void {
    const serialised = JSON.stringify(value);
    for (const [tag, v] of Array.from(this.elements.entries())) {
      if (JSON.stringify(v) === serialised) {
        this.elements.delete(tag);
      }
    }
  }

  /** Returns the set of unique values currently in the set. */
  value(): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const v of Array.from(this.elements.values())) {
      const key = JSON.stringify(v);
      if (!seen.has(key)) {
        seen.add(key);
        result.push(v);
      }
    }
    return result;
  }

  /** Returns true if the value is in the set. */
  has(value: T): boolean {
    const serialised = JSON.stringify(value);
    for (const v of Array.from(this.elements.values())) {
      if (JSON.stringify(v) === serialised) return true;
    }
    return false;
  }

  /**
   * Merges another OR-Set into this one.
   * Union of all tags present in either set.
   */
  merge(other: ORSet<T>): void {
    const otherState = other.getState();
    for (const [tag, value] of Array.from(otherState.entries())) {
      if (!this.elements.has(tag)) {
        this.elements.set(tag, value);
      }
    }
    // Advance sequence past any received tags from this replicaId
    for (const tag of Array.from(otherState.keys())) {
      const parts = tag.split(':');
      if (parts[0] === this.replicaId) {
        const otherSeq = parseInt(parts[1], 10);
        if (otherSeq > this.seq) {
          this.seq = otherSeq;
        }
      }
    }
  }

  /** Returns a copy of the internal tag->value map. */
  getState(): Map<string, T> {
    return new Map(this.elements);
  }
}

// ═════════════════════════════════════════════════════════════
// CRDT Simulation Wrapper
// ═════════════════════════════════════════════════════════════

/** The four supported CRDT types. */
export type CRDTType = 'g-counter' | 'pn-counter' | 'lww-register' | 'or-set';

/**
 * Wraps N independent replicas of a chosen CRDT type.
 * Supports independent operations and pairwise merges.
 * Records all events for playback visualisation.
 *
 * @example
 * ```ts
 * const sim = new CRDTSimulation('g-counter', ['A', 'B', 'C']);
 * sim.operation('A', 'increment');
 * sim.operation('B', 'increment');
 * sim.mergeReplicas('A', 'B');
 * console.log(sim.getValue('A')); // 2
 * ```
 */
export class CRDTSimulation {
  /** The CRDT type being simulated. */
  readonly crdtType: CRDTType;
  /** Replica identifiers. */
  readonly replicaIds: string[];

  private gCounters: Map<string, GCounter>;
  private pnCounters: Map<string, PNCounter>;
  private lwwRegisters: Map<string, LWWRegister<string>>;
  private orSets: Map<string, ORSet<string>>;

  /** Event log for playback. */
  private events: CRDTEvent[];
  /** Current simulation tick. */
  private tick: number;

  constructor(crdtType: CRDTType, replicaIds: string[]) {
    if (replicaIds.length < 2) {
      throw new Error('CRDTSimulation requires at least 2 replicas.');
    }
    if (new Set(replicaIds).size !== replicaIds.length) {
      throw new Error('Duplicate replica IDs are not allowed.');
    }

    this.crdtType = crdtType;
    this.replicaIds = [...replicaIds];
    this.events = [];
    this.tick = 0;

    this.gCounters = new Map();
    this.pnCounters = new Map();
    this.lwwRegisters = new Map();
    this.orSets = new Map();

    this.initReplicas();
  }

  // ── Operations ─────────────────────────────────────────────

  /**
   * Performs an operation on a specific replica.
   *
   * Supported operations per type:
   * - g-counter: 'increment'
   * - pn-counter: 'increment', 'decrement'
   * - lww-register: 'set' (requires `payload`)
   * - or-set: 'add', 'remove' (require `payload`)
   */
  operation(
    replicaId: string,
    op: 'increment' | 'decrement' | 'set' | 'add' | 'remove',
    payload?: string,
  ): CRDTEvent {
    this.assertReplica(replicaId);
    this.tick++;

    let resultValue: unknown;

    switch (this.crdtType) {
      case 'g-counter': {
        if (op !== 'increment') throw new Error(`GCounter only supports 'increment'.`);
        const c = this.gCounters.get(replicaId)!;
        c.increment();
        resultValue = c.value();
        break;
      }
      case 'pn-counter': {
        const c = this.pnCounters.get(replicaId)!;
        if (op === 'increment') {
          c.increment();
        } else if (op === 'decrement') {
          c.decrement();
        } else {
          throw new Error(`PNCounter supports 'increment' and 'decrement'.`);
        }
        resultValue = c.value();
        break;
      }
      case 'lww-register': {
        if (op !== 'set') throw new Error(`LWWRegister only supports 'set'.`);
        if (payload === undefined) throw new Error(`'set' requires a payload.`);
        const r = this.lwwRegisters.get(replicaId)!;
        r.set(payload);
        resultValue = r.value();
        break;
      }
      case 'or-set': {
        const s = this.orSets.get(replicaId)!;
        if (op === 'add') {
          if (payload === undefined) throw new Error(`'add' requires a payload.`);
          s.add(payload);
        } else if (op === 'remove') {
          if (payload === undefined) throw new Error(`'remove' requires a payload.`);
          s.remove(payload);
        } else {
          throw new Error(`ORSet supports 'add' and 'remove'.`);
        }
        resultValue = s.value();
        break;
      }
    }

    const event: CRDTEvent = {
      tick: this.tick,
      type: op as CRDTEvent['type'],
      replicaId,
      description: `Replica ${replicaId}: ${op}${payload !== undefined ? `("${payload}")` : ''}`,
      resultValue,
    };
    this.events.push(event);
    return event;
  }

  /**
   * Merges the state of `sourceId` into `targetId`.
   * This is a one-way merge (target receives source's state).
   */
  mergeReplicas(targetId: string, sourceId: string): CRDTEvent {
    this.assertReplica(targetId);
    this.assertReplica(sourceId);
    this.tick++;

    let resultValue: unknown;

    switch (this.crdtType) {
      case 'g-counter': {
        const target = this.gCounters.get(targetId)!;
        const source = this.gCounters.get(sourceId)!;
        target.merge(source);
        resultValue = target.value();
        break;
      }
      case 'pn-counter': {
        const target = this.pnCounters.get(targetId)!;
        const source = this.pnCounters.get(sourceId)!;
        target.merge(source);
        resultValue = target.value();
        break;
      }
      case 'lww-register': {
        const target = this.lwwRegisters.get(targetId)!;
        const source = this.lwwRegisters.get(sourceId)!;
        target.merge(source);
        resultValue = target.value();
        break;
      }
      case 'or-set': {
        const target = this.orSets.get(targetId)!;
        const source = this.orSets.get(sourceId)!;
        target.merge(source);
        resultValue = target.value();
        break;
      }
    }

    const event: CRDTEvent = {
      tick: this.tick,
      type: 'merge',
      replicaId: targetId,
      targetReplicaId: sourceId,
      description: `Merge: ${sourceId} -> ${targetId}`,
      resultValue,
    };
    this.events.push(event);
    return event;
  }

  // ── Queries ────────────────────────────────────────────────

  /** Returns the current value of a replica. */
  getValue(replicaId: string): unknown {
    this.assertReplica(replicaId);
    switch (this.crdtType) {
      case 'g-counter':
        return this.gCounters.get(replicaId)!.value();
      case 'pn-counter':
        return this.pnCounters.get(replicaId)!.value();
      case 'lww-register':
        return this.lwwRegisters.get(replicaId)!.value();
      case 'or-set':
        return this.orSets.get(replicaId)!.value();
    }
  }

  /** Returns all values across all replicas. */
  getAllValues(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const rid of this.replicaIds) {
      result[rid] = this.getValue(rid);
    }
    return result;
  }

  /** Returns whether all replicas have converged to the same value. */
  isConverged(): boolean {
    const values = this.replicaIds.map((rid) =>
      JSON.stringify(this.getValue(rid)),
    );
    return values.every((v) => v === values[0]);
  }

  /** Returns the full event log. */
  getEvents(): CRDTEvent[] {
    return [...this.events];
  }

  /**
   * Advances the simulation tick without performing any operation.
   * Useful for maintaining consistent timelines in visualisations.
   */
  step(): CRDTEvent[] {
    this.tick++;
    return [];
  }

  /** Resets all replicas and event history. */
  reset(): void {
    this.events = [];
    this.tick = 0;
    this.initReplicas();
  }

  // ── Internals ──────────────────────────────────────────────

  /** Create fresh replicas of the chosen CRDT type. */
  private initReplicas(): void {
    this.gCounters.clear();
    this.pnCounters.clear();
    this.lwwRegisters.clear();
    this.orSets.clear();

    for (const rid of this.replicaIds) {
      switch (this.crdtType) {
        case 'g-counter':
          this.gCounters.set(rid, new GCounter(rid));
          break;
        case 'pn-counter':
          this.pnCounters.set(rid, new PNCounter(rid));
          break;
        case 'lww-register':
          this.lwwRegisters.set(rid, new LWWRegister<string>(rid));
          break;
        case 'or-set':
          this.orSets.set(rid, new ORSet<string>(rid));
          break;
      }
    }
  }

  /** Throws if replica-id is unknown. */
  private assertReplica(replicaId: string): void {
    if (!this.replicaIds.includes(replicaId)) {
      throw new Error(`Unknown replica: "${replicaId}".`);
    }
  }
}
