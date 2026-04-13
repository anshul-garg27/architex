// ─────────────────────────────────────────────────────────────
// Architex — CAP Theorem Explorer
// ─────────────────────────────────────────────────────────────
//
// Simulates a 3-node cluster operating in one of three modes:
//   CP — Consistent + Partition-tolerant (minority rejects writes)
//   AP — Available + Partition-tolerant (both sides accept, diverge)
//   CA — Consistent + Available (single-node, no partition tolerance)
//
// Demonstrates the fundamental trade-off by injecting partitions
// and observing how reads/writes behave in each mode.
// ─────────────────────────────────────────────────────────────

/** Operating mode of the cluster. */
export type CAPMode = 'CP' | 'AP' | 'CA';

/**
 * PACELC classification combining partition-time and normal-operation
 * trade-offs. During **P**artition choose **A** or **C**; **E**lse
 * (normal operation) choose **L**atency or **C**onsistency.
 *
 * - PC/EC — Spanner, HBase (always consistent, pay latency)
 * - PA/EL — Cassandra, DynamoDB (always fast, may be stale)
 * - PC/EL — rare combination
 * - PA/EC — rare combination
 */
export type PACELCMode = 'PC' | 'PA' | 'EC' | 'EL';

/** Result of a client operation against the cluster. */
export interface OperationResult {
  /** Whether the operation succeeded. */
  success: boolean;
  /** The node that handled the operation. */
  nodeId: string;
  /** For reads: the value returned. For writes: the value written. */
  value: string | null;
  /** Error message if operation failed. */
  error?: string;
  /** Version at which the value was written / read. */
  version: number;
}

/** A single node in the cluster. */
export interface CAPNode {
  /** Node identifier. */
  id: string;
  /** Whether the node is alive. */
  alive: boolean;
  /** Local key-value store: key -> { value, version }. */
  data: Map<string, { value: string; version: number }>;
  /** Whether this node can reach the majority (CP mode only). */
  hasMajority: boolean;
  /** Which partition group this node belongs to (0 = no partition). */
  partitionGroup: number;
}

/** Event recorded during simulation. */
export interface CAPEvent {
  /** Simulation tick. */
  tick: number;
  /** Event category. */
  type:
    | 'write-success'
    | 'write-rejected'
    | 'read-success'
    | 'read-stale'
    | 'partition-created'
    | 'partition-healed'
    | 'data-diverged'
    | 'data-reconciled'
    | 'node-crash'
    | 'node-recover'
    | 'write-latency'
    | 'read-stale-risk';
  /** Node involved. */
  nodeId: string;
  /** Human-readable description. */
  description: string;
  /** Extra data (key, value, etc.). */
  data?: unknown;
}

/**
 * Simulates a 3-node cluster that demonstrates CAP trade-offs.
 *
 * @example
 * ```ts
 * const cluster = new CAPCluster('CP');
 * cluster.write('node-0', 'x', '42');
 * cluster.createPartition(['node-0'], ['node-1', 'node-2']);
 * const result = cluster.write('node-0', 'x', '99');
 * console.log(result.success); // false — CP rejects minority writes
 * ```
 */
export class CAPCluster {
  /** Current operating mode. */
  mode: CAPMode;
  /** Whether PACELC extension is enabled. */
  pacelcEnabled: boolean;
  /** Cluster nodes. */
  private nodes: Map<string, CAPNode>;
  /** Whether a partition is currently active. */
  private partitioned: boolean;
  /** Simulation tick. */
  private tick: number;
  /** Event log. */
  private events: CAPEvent[];
  /** Global version counter for ordering writes. */
  private globalVersion: number;
  /** Total node count (always 3 for CP/AP, 1 for CA). */
  private nodeCount: number;
  /**
   * Simulated replication delay in ms for PACELC EC-mode writes
   * (CP mode, normal operation, PACELC enabled).
   */
  private readonly replicationDelay = 50;
  /**
   * Probability (0-1) of a read returning stale data in PACELC
   * EL mode (AP mode, normal operation, PACELC enabled).
   */
  private readonly staleReadProbability = 0.3;

  constructor(mode: CAPMode) {
    this.mode = mode;
    this.pacelcEnabled = false;
    this.partitioned = false;
    this.tick = 0;
    this.events = [];
    this.globalVersion = 0;
    this.nodes = new Map();
    this.nodeCount = mode === 'CA' ? 1 : 3;

    for (let i = 0; i < this.nodeCount; i++) {
      const id = `node-${i}`;
      this.nodes.set(id, {
        id,
        alive: true,
        data: new Map(),
        hasMajority: true,
        partitionGroup: 0,
      });
    }
  }

  // ── PACELC API ─────────────────────────────────────────────

  /** Enables or disables the PACELC extension. */
  setPacelc(enabled: boolean): void {
    this.pacelcEnabled = enabled;
  }

  /**
   * Returns the current PACELC classification based on the
   * cluster's CAP mode and whether a partition is active.
   *
   * - CP + partition → PC (Partition → Consistency)
   * - AP + partition → PA (Partition → Availability)
   * - CP + normal   → EC (Else → Consistency, pay latency)
   * - AP + normal   → EL (Else → Latency, risk staleness)
   */
  getPacelcMode(): PACELCMode {
    if (this.partitioned) {
      return this.mode === 'CP' ? 'PC' : 'PA';
    }
    return this.mode === 'CP' ? 'EC' : 'EL';
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Writes a key-value pair through a specific node.
   * Behaviour depends on mode and partition state.
   */
  write(nodeId: string, key: string, value: string): OperationResult {
    const node = this.getNodeOrThrow(nodeId);
    this.tick++;

    if (!node.alive) {
      this.recordEvent('write-rejected', nodeId, `Write to ${nodeId} failed: node is down.`);
      return { success: false, nodeId, value: null, error: 'Node is down.', version: 0 };
    }

    switch (this.mode) {
      case 'CA':
        return this.writeCA(node, key, value);
      case 'CP':
        return this.writeCP(node, key, value);
      case 'AP':
        return this.writeAP(node, key, value);
    }
  }

  /**
   * Reads a key from a specific node.
   * Behaviour depends on mode and partition state.
   */
  read(nodeId: string, key: string): OperationResult {
    const node = this.getNodeOrThrow(nodeId);
    this.tick++;

    if (!node.alive) {
      this.recordEvent('read-stale', nodeId, `Read from ${nodeId} failed: node is down.`);
      return { success: false, nodeId, value: null, error: 'Node is down.', version: 0 };
    }

    switch (this.mode) {
      case 'CA':
        return this.readCA(node, key);
      case 'CP':
        return this.readCP(node, key);
      case 'AP':
        return this.readAP(node, key);
    }
  }

  /**
   * Creates a network partition splitting nodes into two groups.
   * In CA mode, partitions cause the single node to go down entirely
   * (since CA cannot tolerate partitions).
   */
  createPartition(group1: string[], group2: string[]): void {
    this.tick++;

    if (this.mode === 'CA') {
      // CA mode: partition = node crash (no partition tolerance)
      for (const node of Array.from(this.nodes.values())) {
        node.alive = false;
      }
      this.partitioned = true;
      this.recordEvent(
        'partition-created',
        'cluster',
        'CA mode: Network partition caused total unavailability.',
      );
      return;
    }

    this.partitioned = true;

    // Assign partition groups
    for (const id of group1) {
      const n = this.nodes.get(id);
      if (n) n.partitionGroup = 1;
    }
    for (const id of group2) {
      const n = this.nodes.get(id);
      if (n) n.partitionGroup = 2;
    }

    // Determine majority for CP mode
    if (this.mode === 'CP') {
      const group1Alive = group1.filter((id) => this.nodes.get(id)?.alive).length;
      const group2Alive = group2.filter((id) => this.nodes.get(id)?.alive).length;
      const majority = Math.floor(this.nodeCount / 2) + 1;

      for (const id of group1) {
        const n = this.nodes.get(id);
        if (n) n.hasMajority = group1Alive >= majority;
      }
      for (const id of group2) {
        const n = this.nodes.get(id);
        if (n) n.hasMajority = group2Alive >= majority;
      }
    }

    this.recordEvent(
      'partition-created',
      'cluster',
      `Network partition: [${group1.join(', ')}] | [${group2.join(', ')}] (${this.mode} mode).`,
    );
  }

  /** Heals the network partition and reconciles data. */
  healPartition(): void {
    this.tick++;

    if (!this.partitioned) return;

    if (this.mode === 'CA') {
      // Bring the single node back up
      for (const node of Array.from(this.nodes.values())) {
        node.alive = true;
      }
      this.partitioned = false;
      this.recordEvent(
        'partition-healed',
        'cluster',
        'CA mode: Partition healed, node restored.',
      );
      return;
    }

    this.partitioned = false;

    // Reset partition state
    for (const node of Array.from(this.nodes.values())) {
      node.partitionGroup = 0;
      node.hasMajority = true;
    }

    // Reconcile data: in AP mode, detect and resolve divergence
    if (this.mode === 'AP') {
      this.reconcileAP();
    }
    // In CP mode, no reconciliation needed — minority never accepted writes.
    // Just replicate latest data from majority to minority.
    if (this.mode === 'CP') {
      this.reconcileCP();
    }

    this.recordEvent('partition-healed', 'cluster', 'Network partition healed. Data reconciled.');
  }

  /** Crashes a node (makes it unavailable). */
  crashNode(nodeId: string): void {
    const node = this.getNodeOrThrow(nodeId);
    node.alive = false;
    this.tick++;
    this.recordEvent('node-crash', nodeId, `Node ${nodeId} crashed.`);
  }

  /** Recovers a crashed node. Data survives (durable storage). */
  recoverNode(nodeId: string): void {
    const node = this.getNodeOrThrow(nodeId);
    node.alive = true;
    this.tick++;
    this.recordEvent('node-recover', nodeId, `Node ${nodeId} recovered.`);
  }

  /** Sets the cluster operating mode. Resets partition state. */
  setMode(mode: CAPMode): void {
    this.mode = mode;
    this.healPartition();

    // Rebuild nodes if switching to/from CA
    const newCount = mode === 'CA' ? 1 : 3;
    if (newCount !== this.nodeCount) {
      const preservedData = new Map<string, { value: string; version: number }>();
      // Preserve data from first node
      const firstNode = Array.from(this.nodes.values())[0];
      if (firstNode) {
        for (const [k, v] of Array.from(firstNode.data.entries())) {
          preservedData.set(k, { ...v });
        }
      }

      this.nodes.clear();
      this.nodeCount = newCount;
      for (let i = 0; i < newCount; i++) {
        const id = `node-${i}`;
        this.nodes.set(id, {
          id,
          alive: true,
          data: new Map(Array.from(preservedData.entries())),
          hasMajority: true,
          partitionGroup: 0,
        });
      }
    }
  }

  /**
   * Advances simulation by one tick. Useful for time-based
   * visualisations. No-op unless you want tick-based events.
   */
  step(): CAPEvent[] {
    this.tick++;
    return [];
  }

  /** Returns the full state for visualisation. */
  getState(): {
    mode: CAPMode;
    nodes: CAPNode[];
    partitioned: boolean;
    tick: number;
    pacelcEnabled: boolean;
    pacelcMode: PACELCMode | null;
  } {
    return {
      mode: this.mode,
      nodes: Array.from(this.nodes.values()),
      partitioned: this.partitioned,
      tick: this.tick,
      pacelcEnabled: this.pacelcEnabled,
      pacelcMode: this.pacelcEnabled ? this.getPacelcMode() : null,
    };
  }

  /** Returns the event log. */
  getEvents(): CAPEvent[] {
    return [...this.events];
  }

  /** Checks if any data divergence exists across alive nodes. */
  hasDivergence(): boolean {
    const aliveNodes = Array.from(this.nodes.values()).filter((n) => n.alive);
    if (aliveNodes.length < 2) return false;

    const ref = aliveNodes[0];
    for (let i = 1; i < aliveNodes.length; i++) {
      const other = aliveNodes[i];
      // Check all keys in ref
      for (const [key, entry] of Array.from(ref.data.entries())) {
        const otherEntry = other.data.get(key);
        if (!otherEntry || otherEntry.value !== entry.value) return true;
      }
      // Check keys in other not in ref
      for (const key of Array.from(other.data.keys())) {
        if (!ref.data.has(key)) return true;
      }
    }
    return false;
  }

  /** Resets the cluster to initial state. */
  reset(): void {
    this.tick = 0;
    this.events = [];
    this.partitioned = false;
    this.globalVersion = 0;
    for (const node of Array.from(this.nodes.values())) {
      node.alive = true;
      node.data.clear();
      node.hasMajority = true;
      node.partitionGroup = 0;
    }
  }

  // ── CA Mode ────────────────────────────────────────────────

  private writeCA(node: CAPNode, key: string, value: string): OperationResult {
    this.globalVersion++;
    node.data.set(key, { value, version: this.globalVersion });
    this.recordEvent('write-success', node.id, `CA write: ${key}="${value}" on ${node.id}.`);
    return { success: true, nodeId: node.id, value, version: this.globalVersion };
  }

  private readCA(node: CAPNode, key: string): OperationResult {
    const entry = node.data.get(key);
    this.recordEvent('read-success', node.id, `CA read: ${key} from ${node.id}.`);
    return {
      success: true,
      nodeId: node.id,
      value: entry?.value ?? null,
      version: entry?.version ?? 0,
    };
  }

  // ── CP Mode ────────────────────────────────────────────────

  private writeCP(node: CAPNode, key: string, value: string): OperationResult {
    if (this.partitioned && !node.hasMajority) {
      this.recordEvent(
        'write-rejected',
        node.id,
        `CP write rejected: ${node.id} is in minority partition.`,
      );
      return {
        success: false,
        nodeId: node.id,
        value: null,
        error: 'Write rejected: node is in minority partition (CP mode).',
        version: 0,
      };
    }

    this.globalVersion++;
    const entry = { value, version: this.globalVersion };

    // Write to this node
    node.data.set(key, { ...entry });

    // Replicate to reachable nodes
    for (const peer of Array.from(this.nodes.values())) {
      if (peer.id === node.id || !peer.alive) continue;
      if (this.canCommunicate(node, peer)) {
        peer.data.set(key, { ...entry });
      }
    }

    this.recordEvent('write-success', node.id, `CP write: ${key}="${value}" on ${node.id} (replicated to majority).`);

    // PACELC EC: during normal operation, consistency requires
    // waiting for all replicas — incurring a latency cost.
    if (this.pacelcEnabled && !this.partitioned) {
      this.recordEvent(
        'write-latency',
        node.id,
        `PACELC EC: Write replicated to all nodes — ${this.replicationDelay}ms latency for strong consistency.`,
        { replicationDelayMs: this.replicationDelay, pacelcMode: 'EC' },
      );
    }

    return { success: true, nodeId: node.id, value, version: this.globalVersion };
  }

  private readCP(node: CAPNode, key: string): OperationResult {
    if (this.partitioned && !node.hasMajority) {
      this.recordEvent(
        'read-stale',
        node.id,
        `CP read rejected: ${node.id} is in minority partition.`,
      );
      return {
        success: false,
        nodeId: node.id,
        value: null,
        error: 'Read rejected: node is in minority partition (CP mode).',
        version: 0,
      };
    }

    const entry = node.data.get(key);
    this.recordEvent('read-success', node.id, `CP read: ${key} from ${node.id}.`);
    return {
      success: true,
      nodeId: node.id,
      value: entry?.value ?? null,
      version: entry?.version ?? 0,
    };
  }

  // ── AP Mode ────────────────────────────────────────────────

  private writeAP(node: CAPNode, key: string, value: string): OperationResult {
    this.globalVersion++;
    const entry = { value, version: this.globalVersion };

    // Always accept the write locally
    node.data.set(key, { ...entry });

    // Replicate to reachable peers only
    for (const peer of Array.from(this.nodes.values())) {
      if (peer.id === node.id || !peer.alive) continue;
      if (this.canCommunicate(node, peer)) {
        peer.data.set(key, { ...entry });
      }
    }

    // If partitioned, flag potential divergence
    if (this.partitioned) {
      this.recordEvent(
        'data-diverged',
        node.id,
        `AP write during partition: ${key}="${value}" on ${node.id} — may diverge from other partition.`,
      );
    } else {
      this.recordEvent('write-success', node.id, `AP write: ${key}="${value}" on ${node.id}.`);

      // PACELC EL: during normal operation, AP systems prioritize
      // low latency over consistency — writes are instant but
      // subsequent reads on other nodes may return stale data.
      if (this.pacelcEnabled) {
        this.recordEvent(
          'write-latency',
          node.id,
          `PACELC EL: Write accepted instantly — async replication favors low latency over consistency.`,
          { replicationDelayMs: 0, pacelcMode: 'EL' },
        );
      }
    }

    return { success: true, nodeId: node.id, value, version: this.globalVersion };
  }

  private readAP(node: CAPNode, key: string): OperationResult {
    const entry = node.data.get(key);
    const eventType = this.partitioned ? 'read-stale' : 'read-success';
    this.recordEvent(
      eventType,
      node.id,
      `AP read: ${key} from ${node.id}${this.partitioned ? ' (possibly stale)' : ''}.`,
    );

    // PACELC EL: during normal operation, reads may return stale
    // data because AP systems use async replication for low latency.
    if (this.pacelcEnabled && !this.partitioned) {
      const isStale = Math.random() < this.staleReadProbability;
      this.recordEvent(
        'read-stale-risk',
        node.id,
        isStale
          ? `PACELC EL: Read from ${node.id} returned STALE data — async replication has not converged yet (${Math.round(this.staleReadProbability * 100)}% probability).`
          : `PACELC EL: Read from ${node.id} returned fresh data — but staleness is possible (${Math.round(this.staleReadProbability * 100)}% probability per read).`,
        { stale: isStale, staleReadProbability: this.staleReadProbability, pacelcMode: 'EL' },
      );
    }

    return {
      success: true,
      nodeId: node.id,
      value: entry?.value ?? null,
      version: entry?.version ?? 0,
    };
  }

  // ── Reconciliation ─────────────────────────────────────────

  /**
   * AP reconciliation: after partition heals, pick the highest
   * version for each key (last-writer-wins across all nodes).
   */
  private reconcileAP(): void {
    // Collect the latest version for every key
    const latest = new Map<string, { value: string; version: number }>();
    for (const node of Array.from(this.nodes.values())) {
      for (const [key, entry] of Array.from(node.data.entries())) {
        const existing = latest.get(key);
        if (!existing || entry.version > existing.version) {
          latest.set(key, { ...entry });
        }
      }
    }

    // Propagate latest to all alive nodes
    let divergenceFound = false;
    for (const node of Array.from(this.nodes.values())) {
      if (!node.alive) continue;
      for (const [key, entry] of Array.from(latest.entries())) {
        const local = node.data.get(key);
        if (!local || local.version < entry.version) {
          node.data.set(key, { ...entry });
          divergenceFound = true;
        }
      }
    }

    if (divergenceFound) {
      this.recordEvent(
        'data-reconciled',
        'cluster',
        'AP reconciliation: divergent data resolved using last-writer-wins.',
      );
    }
  }

  /**
   * CP reconciliation: replicate from the majority partition's
   * data to all nodes (minority was read-only during partition).
   */
  private reconcileCP(): void {
    // Find any node that has the latest data (was in majority)
    const allNodes = Array.from(this.nodes.values()).filter((n) => n.alive);
    if (allNodes.length === 0) return;

    // The node with the highest version across any key is the source of truth
    let sourceNode = allNodes[0];
    let maxVersion = 0;
    for (const node of allNodes) {
      for (const entry of Array.from(node.data.values())) {
        if (entry.version > maxVersion) {
          maxVersion = entry.version;
          sourceNode = node;
        }
      }
    }

    // Replicate source data to all other alive nodes
    for (const node of allNodes) {
      if (node.id === sourceNode.id) continue;
      for (const [key, entry] of Array.from(sourceNode.data.entries())) {
        const local = node.data.get(key);
        if (!local || local.version < entry.version) {
          node.data.set(key, { ...entry });
        }
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  /** Checks if two nodes can communicate (same partition group or no partition). */
  private canCommunicate(a: CAPNode, b: CAPNode): boolean {
    if (!this.partitioned) return true;
    if (a.partitionGroup === 0 || b.partitionGroup === 0) return true;
    return a.partitionGroup === b.partitionGroup;
  }

  /** Retrieves a node or throws if it does not exist. */
  private getNodeOrThrow(nodeId: string): CAPNode {
    const node = this.nodes.get(nodeId);
    if (!node) throw new Error(`Unknown node: "${nodeId}".`);
    return node;
  }

  /** Records an event in the log. */
  private recordEvent(
    type: CAPEvent['type'],
    nodeId: string,
    description: string,
    data?: unknown,
  ): void {
    this.events.push({ tick: this.tick, type, nodeId, description, data });
  }
}
