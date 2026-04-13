// ─────────────────────────────────────────────────────────────
// Architex — Gossip Protocol Simulation
// ─────────────────────────────────────────────────────────────
//
// Simulates an anti-entropy gossip protocol where nodes
// periodically exchange versioned key-value data with a random
// subset of peers (fanout). Supports node failures, recovery,
// and convergence tracking.
// ─────────────────────────────────────────────────────────────

/** A node participating in the gossip protocol. */
export interface GossipNode {
  /** Unique node identifier. */
  id: string;
  /** X coordinate for 2D visualisation. */
  x: number;
  /** Y coordinate for 2D visualisation. */
  y: number;
  /** Key-value store with versioned entries. */
  data: Map<string, { value: string; version: number }>;
  /** Whether the node is alive (reachable). */
  alive: boolean;
}

/** Gossip propagation mode. */
export type GossipMode = 'push' | 'pull' | 'push-pull';

/** A single gossip exchange event. */
export interface GossipEvent {
  /** Simulation tick when the exchange occurred. */
  tick: number;
  /** Initiator of the gossip exchange. */
  from: string;
  /** Recipient of the gossip exchange. */
  to: string;
  /** Keys that were updated on the recipient. */
  keysExchanged: string[];
  /** Human-readable description. */
  description: string;
  /** Which gossip mode was used for this exchange. */
  mode: GossipMode;
}

/**
 * Deterministic seeded random number generator (xorshift32).
 * Provides repeatable simulations when given the same seed.
 */
class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0 || 1;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let s = this.state;
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    this.state = s;
    return (s >>> 0) / 0x100000000;
  }

  /** Returns an integer in [0, max). */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Simulates a gossip (epidemic) protocol across a set of nodes.
 *
 * Each call to `step()` represents one gossip round: every alive node
 * selects `fanout` random alive peers and pushes its data to them,
 * using version numbers to resolve which value wins.
 *
 * @example
 * ```ts
 * const gp = new GossipProtocol(5, 2, 1);
 * gp.introduceData('node-0', 'leader', 'node-0');
 * while (!gp.getConvergenceStatus().converged) {
 *   gp.step();
 * }
 * ```
 */
export class GossipProtocol {
  /** All nodes in the cluster. */
  private nodes: Map<string, GossipNode>;
  /** Number of peers each node contacts per round. */
  private fanout: number;
  /** Ticks between gossip rounds (1 = every tick). */
  private intervalTicks: number;
  /** Current simulation tick. */
  private tick: number;
  /** Full event log. */
  private eventLog: GossipEvent[];
  /** Global version counter (monotonically increasing). */
  private globalVersion: number;
  /** Seeded RNG for deterministic peer selection. */
  private rng: SeededRandom;
  /** Gossip propagation mode: push, pull, or push-pull. */
  private mode: GossipMode;

  constructor(nodeCount: number, fanout: number = 2, intervalTicks: number = 1) {
    if (nodeCount < 2) {
      throw new Error('GossipProtocol requires at least 2 nodes.');
    }
    if (fanout < 1) {
      throw new Error('Fanout must be at least 1.');
    }

    this.fanout = fanout;
    this.intervalTicks = intervalTicks;
    this.tick = 0;
    this.eventLog = [];
    this.globalVersion = 0;
    this.rng = new SeededRandom(42);
    this.nodes = new Map();
    this.mode = 'push';

    // Lay out nodes in a circle for visualisation
    const radius = 200;
    const cx = 250;
    const cy = 250;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount - Math.PI / 2;
      const id = `node-${i}`;
      this.nodes.set(id, {
        id,
        x: Math.round(cx + radius * Math.cos(angle)),
        y: Math.round(cy + radius * Math.sin(angle)),
        data: new Map(),
        alive: true,
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Sets the gossip propagation mode.
   *
   * - **push**: sender pushes its data to peers (default, original behaviour).
   * - **pull**: sender requests data FROM peers; peer's newer data overwrites sender's.
   * - **push-pull**: both directions in one round — fastest convergence.
   */
  setMode(mode: GossipMode): void {
    this.mode = mode;
  }

  /** Returns the current gossip propagation mode. */
  getMode(): GossipMode {
    return this.mode;
  }

  /**
   * Introduces (or updates) a key-value pair on a specific node.
   * This simulates a client write hitting one node.
   */
  introduceData(nodeId: string, key: string, value: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Unknown node: "${nodeId}".`);
    if (!node.alive) throw new Error(`Node "${nodeId}" is dead.`);

    this.globalVersion++;
    node.data.set(key, { value, version: this.globalVersion });
  }

  /**
   * Advances the simulation by one tick.
   * On gossip-round ticks (determined by `intervalTicks`), every alive
   * node selects random peers and exchanges data according to the
   * current {@link GossipMode}.
   *
   * - **push** — sender's data overwrites peer's if version is higher.
   * - **pull** — peer's data overwrites sender's if version is higher.
   * - **push-pull** — both directions in one round (fastest convergence).
   *
   * Returns events generated this tick.
   */
  step(): GossipEvent[] {
    this.tick++;
    const events: GossipEvent[] = [];

    // Only run gossip exchange on interval boundaries
    if (this.tick % this.intervalTicks !== 0) return events;

    const aliveIds = this.getAliveIds();
    if (aliveIds.length < 2) return events;

    for (const senderId of aliveIds) {
      const sender = this.nodes.get(senderId)!;
      const peers = this.selectPeers(senderId, aliveIds);

      for (const peerId of peers) {
        const peer = this.nodes.get(peerId)!;
        const exchanged: string[] = [];

        // ── Push direction: sender → peer ──────────────────────
        if (this.mode === 'push' || this.mode === 'push-pull') {
          for (const [key, senderEntry] of Array.from(sender.data.entries())) {
            const peerEntry = peer.data.get(key);
            if (!peerEntry || peerEntry.version < senderEntry.version) {
              peer.data.set(key, { ...senderEntry });
              if (!exchanged.includes(key)) exchanged.push(key);
            }
          }
        }

        // ── Pull direction: peer → sender ──────────────────────
        if (this.mode === 'pull' || this.mode === 'push-pull') {
          for (const [key, peerEntry] of Array.from(peer.data.entries())) {
            const senderEntry = sender.data.get(key);
            if (!senderEntry || senderEntry.version < peerEntry.version) {
              sender.data.set(key, { ...peerEntry });
              if (!exchanged.includes(key)) exchanged.push(key);
            }
          }
        }

        if (exchanged.length > 0) {
          const modeLabel =
            this.mode === 'push'
              ? 'pushed'
              : this.mode === 'pull'
                ? 'pulled'
                : 'push-pulled';

          const directionHint =
            this.mode === 'push'
              ? `${senderId} → ${peerId}`
              : this.mode === 'pull'
                ? `${peerId} → ${senderId}`
                : `${senderId} ↔ ${peerId}`;

          const event: GossipEvent = {
            tick: this.tick,
            from: senderId,
            to: peerId,
            keysExchanged: exchanged,
            description: `${senderId} ${modeLabel} ${exchanged.length} key(s) with ${peerId} (${directionHint}): [${exchanged.join(', ')}].`,
            mode: this.mode,
          };
          events.push(event);
          this.eventLog.push(event);
        }
      }
    }

    return events;
  }

  /** Marks a node as dead — it will not participate in gossip. */
  killNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Unknown node: "${nodeId}".`);
    node.alive = false;
  }

  /** Brings a dead node back online with its existing data intact. */
  recoverNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Unknown node: "${nodeId}".`);
    node.alive = true;
  }

  /**
   * Returns convergence status: whether all alive nodes have
   * identical data, and the percentage of key-node pairs that
   * are in sync.
   */
  getConvergenceStatus(): { converged: boolean; percentSynced: number } {
    const aliveIds = this.getAliveIds();
    if (aliveIds.length < 2) {
      return { converged: true, percentSynced: 100 };
    }

    // Collect the superset of all known keys across alive nodes
    const allKeys = new Set<string>();
    for (const id of aliveIds) {
      for (const key of Array.from(this.nodes.get(id)!.data.keys())) {
        allKeys.add(key);
      }
    }
    if (allKeys.size === 0) {
      return { converged: true, percentSynced: 100 };
    }

    // For each key, determine the latest version among alive nodes
    const latestVersion = new Map<string, number>();
    for (const key of Array.from(allKeys)) {
      let maxVer = 0;
      for (const id of aliveIds) {
        const entry = this.nodes.get(id)!.data.get(key);
        if (entry && entry.version > maxVer) {
          maxVer = entry.version;
        }
      }
      latestVersion.set(key, maxVer);
    }

    // Count how many (node, key) pairs are at the latest version
    const totalPairs = aliveIds.length * allKeys.size;
    let syncedPairs = 0;
    for (const id of aliveIds) {
      const nodeData = this.nodes.get(id)!.data;
      for (const key of Array.from(allKeys)) {
        const entry = nodeData.get(key);
        if (entry && entry.version === latestVersion.get(key)) {
          syncedPairs++;
        }
      }
    }

    const percentSynced = Math.round((syncedPairs / totalPairs) * 10000) / 100;
    return {
      converged: syncedPairs === totalPairs,
      percentSynced,
    };
  }

  /** Returns a snapshot of all nodes. */
  getNodes(): GossipNode[] {
    return Array.from(this.nodes.values());
  }

  /** Returns the full event log. */
  getEventLog(): GossipEvent[] {
    return [...this.eventLog];
  }

  /** Resets simulation to initial state (empty data, all alive, tick 0). */
  reset(): void {
    this.tick = 0;
    this.eventLog = [];
    this.globalVersion = 0;
    this.rng = new SeededRandom(42);
    for (const node of Array.from(this.nodes.values())) {
      node.data.clear();
      node.alive = true;
    }
  }

  // ── Internals ──────────────────────────────────────────────

  /** Returns IDs of all alive nodes. */
  private getAliveIds(): string[] {
    const ids: string[] = [];
    for (const node of Array.from(this.nodes.values())) {
      if (node.alive) ids.push(node.id);
    }
    return ids;
  }

  /**
   * Selects up to `fanout` random alive peers for a given sender.
   * Uses Fisher-Yates partial shuffle for efficiency.
   */
  private selectPeers(senderId: string, aliveIds: string[]): string[] {
    const candidates = aliveIds.filter((id) => id !== senderId);
    const count = Math.min(this.fanout, candidates.length);
    // Partial Fisher-Yates shuffle
    for (let i = 0; i < count; i++) {
      const j = i + this.rng.nextInt(candidates.length - i);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    return candidates.slice(0, count);
  }
}
