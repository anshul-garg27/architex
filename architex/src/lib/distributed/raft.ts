// ─────────────────────────────────────────────────────────────
// Architex — Raft Consensus State Machine
// ─────────────────────────────────────────────────────────────
//
// Full simulation of the Raft consensus algorithm including:
//   - Leader election with randomised timeouts (150-300ms)
//   - Log replication via AppendEntries RPCs
//   - Commit rules requiring majority acknowledgement
//   - Leader heartbeats
//   - Node crash / recovery
//   - Network partitions
//
// The simulation advances in discrete ticks (~10ms each).
// All events are recorded for playback visualisation.
// ─────────────────────────────────────────────────────────────

/** The three Raft roles. */
export type RaftRole = 'follower' | 'candidate' | 'leader';

/** A single entry in the replicated log. */
export interface LogEntry {
  /** Term in which the entry was created. */
  term: number;
  /** 1-based log index. */
  index: number;
  /** Client command payload. */
  command: string;
}

/** State of one Raft node. */
export interface RaftNode {
  /** Unique node identifier. */
  id: string;
  /** Current role. */
  role: RaftRole;
  /** Current term (monotonically increasing). */
  term: number;
  /** Candidate this node voted for in the current term (null = none). */
  votedFor: string | null;
  /** Replicated log. */
  log: LogEntry[];
  /** Index of the highest log entry known to be committed. */
  commitIndex: number;
  /** Index of the highest log entry applied to the state machine. */
  lastApplied: number;
  /** (Leader only) Next log index to send to each follower. */
  nextIndex: Record<string, number>;
  /** (Leader only) Highest log index known to be replicated on each follower. */
  matchIndex: Record<string, number>;
  /** Random election timeout in milliseconds. */
  electionTimeoutMs: number;
  /** Heartbeat interval in milliseconds. */
  heartbeatIntervalMs: number;
}

/** A RequestVote RPC message. */
export interface RequestVoteMessage {
  type: 'RequestVote';
  from: string;
  to: string;
  term: number;
  candidateId: string;
  lastLogIndex: number;
  lastLogTerm: number;
}

/** A RequestVoteResponse RPC message. */
export interface RequestVoteResponseMessage {
  type: 'RequestVoteResponse';
  from: string;
  to: string;
  term: number;
  voteGranted: boolean;
}

/** An AppendEntries RPC message. */
export interface AppendEntriesMessage {
  type: 'AppendEntries';
  from: string;
  to: string;
  term: number;
  leaderId: string;
  prevLogIndex: number;
  prevLogTerm: number;
  entries: LogEntry[];
  leaderCommit: number;
}

/** An AppendEntriesResponse RPC message. */
export interface AppendEntriesResponseMessage {
  type: 'AppendEntriesResponse';
  from: string;
  to: string;
  term: number;
  success: boolean;
  matchIndex?: number;
}

/** An RPC message between Raft nodes (discriminated union). */
export type RaftMessage =
  | RequestVoteMessage
  | RequestVoteResponseMessage
  | AppendEntriesMessage
  | AppendEntriesResponseMessage;

/** A simulation event for the timeline / playback UI. */
export interface RaftEvent {
  /** Simulation tick when the event occurred. */
  tick: number;
  /** Event category. */
  type:
    | 'election-timeout'
    | 'vote-request'
    | 'vote-granted'
    | 'vote-denied'
    | 'become-leader'
    | 'heartbeat'
    | 'append-entries'
    | 'log-committed'
    | 'node-crash'
    | 'node-recover'
    | 'network-partition';
  /** Primary node involved. */
  nodeId: string;
  /** Human-readable description. */
  description: string;
  /** Optional structured data. */
  data?: unknown;
}

// ── Seeded RNG ───────────────────────────────────────────────

/** Deterministic xorshift32 RNG for repeatable simulations. */
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

  /** Returns an integer in [min, max] (inclusive). */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

// ── Constants ────────────────────────────────────────────────

/** Ticks per millisecond (each tick ~10ms). */
const MS_PER_TICK = 10;
/** Election timeout range in milliseconds. */
const ELECTION_TIMEOUT_MIN_MS = 150;
const ELECTION_TIMEOUT_MAX_MS = 300;
/** Heartbeat interval in milliseconds. */
const HEARTBEAT_INTERVAL_MS = 50;

// ═════════════════════════════════════════════════════════════
// RaftCluster — the top-level simulation
// ═════════════════════════════════════════════════════════════

/**
 * Simulates a Raft cluster of 3, 5, or 7 nodes.
 *
 * Call `step()` to advance by one tick (~10ms). Each step
 * processes timer expirations, delivers pending messages,
 * and records events for the playback timeline.
 *
 * @example
 * ```ts
 * const cluster = new RaftCluster(3);
 * // Run until a leader is elected
 * while (!cluster.getState().leader) {
 *   cluster.step();
 * }
 * cluster.submitCommand('SET x 42');
 * for (let i = 0; i < 20; i++) cluster.step();
 * ```
 */
export class RaftCluster {
  /** All nodes keyed by id. */
  nodes: Map<string, RaftNode>;
  /** Pending messages to be delivered on the next tick. */
  messages: RaftMessage[];
  /** Full event log. */
  eventLog: RaftEvent[];
  /** Current simulation tick. */
  tick: number;
  /** Partition groups — nodes in the same Set can communicate. */
  partitions: Set<string>[];

  /** Set of crashed (offline) node ids. */
  private crashedNodes: Set<string>;
  /** Remaining election timer ticks per node. */
  private electionTimers: Map<string, number>;
  /** Remaining heartbeat timer ticks per node (leader only). */
  private heartbeatTimers: Map<string, number>;
  /** Votes received by each candidate: candidateId -> set of voter ids. */
  private votesReceived: Map<string, Set<string>>;
  /** Ordered list of all node ids. */
  private nodeIds: string[];
  /** Seeded RNG for deterministic timeouts. */
  private rng: SeededRandom;

  constructor(nodeCount: 3 | 5 | 7) {
    this.nodes = new Map();
    this.messages = [];
    this.eventLog = [];
    this.tick = 0;
    this.partitions = [];
    this.crashedNodes = new Set();
    this.electionTimers = new Map();
    this.heartbeatTimers = new Map();
    this.votesReceived = new Map();
    this.nodeIds = [];
    this.rng = new SeededRandom(12345);

    for (let i = 0; i < nodeCount; i++) {
      const id = `node-${i}`;
      this.nodeIds.push(id);
      const electionTimeoutMs = this.randomElectionTimeout();
      const node: RaftNode = {
        id,
        role: 'follower',
        term: 0,
        votedFor: null,
        log: [],
        commitIndex: 0,
        lastApplied: 0,
        nextIndex: {},
        matchIndex: {},
        electionTimeoutMs,
        heartbeatIntervalMs: HEARTBEAT_INTERVAL_MS,
      };
      this.nodes.set(id, node);
      this.electionTimers.set(id, this.msToTicks(electionTimeoutMs));
    }
  }

  // ── Public API ─────────────────────────────────────────────

  /**
   * Advances the simulation by one tick (~10ms).
   * Processes timers, delivers messages, handles state transitions.
   * Returns events that occurred during this tick.
   */
  step(): RaftEvent[] {
    this.tick++;
    const events: RaftEvent[] = [];

    // 1. Deliver pending messages
    const pending = [...this.messages];
    this.messages = [];
    for (const msg of pending) {
      if (this.crashedNodes.has(msg.to)) continue;
      if (!this.canCommunicate(msg.from, msg.to)) continue;
      const msgEvents = this.handleMessage(msg);
      events.push(...msgEvents);
    }

    // 2. Process timers for alive nodes
    for (const id of this.nodeIds) {
      if (this.crashedNodes.has(id)) continue;
      const node = this.nodes.get(id)!;

      if (node.role === 'leader') {
        // Heartbeat timer
        const remaining = (this.heartbeatTimers.get(id) ?? 0) - 1;
        if (remaining <= 0) {
          const hbEvents = this.sendHeartbeats(node);
          events.push(...hbEvents);
          this.heartbeatTimers.set(id, this.msToTicks(HEARTBEAT_INTERVAL_MS));
        } else {
          this.heartbeatTimers.set(id, remaining);
        }
      } else {
        // Election timer (followers and candidates)
        const remaining = (this.electionTimers.get(id) ?? 0) - 1;
        if (remaining <= 0) {
          const elEvents = this.startElection(node);
          events.push(...elEvents);
        } else {
          this.electionTimers.set(id, remaining);
        }
      }

      // Advance commit -> apply
      this.advanceStateMachine(node, events);
    }

    this.eventLog.push(...events);
    return events;
  }

  /** Crashes a node — it stops processing messages and timers. */
  crashNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) throw new Error(`Unknown node: "${nodeId}".`);
    this.crashedNodes.add(nodeId);
    // Remove any pending messages TO this node
    this.messages = this.messages.filter((m) => m.to !== nodeId);
    const event: RaftEvent = {
      tick: this.tick,
      type: 'node-crash',
      nodeId,
      description: `Node ${nodeId} crashed.`,
    };
    this.eventLog.push(event);
  }

  /** Recovers a crashed node. It restarts as a follower with its persisted state. */
  recoverNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) throw new Error(`Unknown node: "${nodeId}".`);
    this.crashedNodes.delete(nodeId);
    const node = this.nodes.get(nodeId)!;
    // On recovery, become a follower and reset election timer
    node.role = 'follower';
    node.votedFor = null;
    node.nextIndex = {};
    node.matchIndex = {};
    this.resetElectionTimer(nodeId);
    const event: RaftEvent = {
      tick: this.tick,
      type: 'node-recover',
      nodeId,
      description: `Node ${nodeId} recovered as follower (term ${node.term}).`,
    };
    this.eventLog.push(event);
  }

  /**
   * Creates a network partition. Nodes in the same group can
   * communicate; nodes in different groups cannot.
   */
  createPartition(group1: string[], group2: string[]): void {
    this.partitions = [new Set(group1), new Set(group2)];
    const event: RaftEvent = {
      tick: this.tick,
      type: 'network-partition',
      nodeId: 'cluster',
      description: `Partition: [${group1.join(', ')}] | [${group2.join(', ')}]`,
      data: { group1, group2 },
    };
    this.eventLog.push(event);
  }

  /** Heals the current network partition. */
  healPartition(): void {
    this.partitions = [];
    const event: RaftEvent = {
      tick: this.tick,
      type: 'network-partition',
      nodeId: 'cluster',
      description: 'Network partition healed.',
    };
    this.eventLog.push(event);
  }

  /**
   * Submits a client command to the current leader.
   * If no leader exists, the command is silently dropped.
   */
  submitCommand(command: string): boolean {
    const leaderId = this.findLeader();
    if (!leaderId) return false;
    const leader = this.nodes.get(leaderId)!;
    const entry: LogEntry = {
      term: leader.term,
      index: leader.log.length + 1,
      command,
    };
    leader.log.push(entry);
    // Update own matchIndex
    leader.matchIndex[leader.id] = entry.index;
    return true;
  }

  /** Returns a snapshot of the cluster state for the UI. */
  getState(): {
    nodes: RaftNode[];
    messages: RaftMessage[];
    leader: string | null;
  } {
    return {
      nodes: this.nodeIds.map((id) => this.copyNode(this.nodes.get(id)!)),
      messages: [...this.messages],
      leader: this.findLeader(),
    };
  }

  /** Resets the cluster to its initial state. */
  reset(): void {
    this.tick = 0;
    this.messages = [];
    this.eventLog = [];
    this.crashedNodes.clear();
    this.votesReceived.clear();
    this.partitions = [];
    this.rng = new SeededRandom(12345);

    for (const id of this.nodeIds) {
      const node = this.nodes.get(id)!;
      const electionTimeoutMs = this.randomElectionTimeout();
      node.role = 'follower';
      node.term = 0;
      node.votedFor = null;
      node.log = [];
      node.commitIndex = 0;
      node.lastApplied = 0;
      node.nextIndex = {};
      node.matchIndex = {};
      node.electionTimeoutMs = electionTimeoutMs;
      this.electionTimers.set(id, this.msToTicks(electionTimeoutMs));
      this.heartbeatTimers.delete(id);
    }
  }

  // ── Election ───────────────────────────────────────────────

  /**
   * Starts an election: node transitions to candidate, increments
   * its term, votes for itself, and sends RequestVote RPCs.
   */
  private startElection(node: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];

    node.term++;
    node.role = 'candidate';
    node.votedFor = node.id;

    // Track votes — candidate votes for itself
    const votes = new Set<string>([node.id]);
    this.votesReceived.set(node.id, votes);

    events.push({
      tick: this.tick,
      type: 'election-timeout',
      nodeId: node.id,
      description: `Node ${node.id} election timeout — starting election for term ${node.term}.`,
      data: { term: node.term },
    });

    // Reset election timer with new random timeout
    this.resetElectionTimer(node.id);

    // Check if single-node majority (edge case for nodeCount=1, not typical)
    if (this.hasMajority(votes.size)) {
      return [...events, ...this.becomeLeader(node)];
    }

    // Send RequestVote to all other alive nodes
    const lastLogIndex = node.log.length;
    const lastLogTerm = lastLogIndex > 0 ? node.log[lastLogIndex - 1].term : 0;

    for (const peerId of this.nodeIds) {
      if (peerId === node.id) continue;
      if (this.crashedNodes.has(peerId)) continue;

      const msg: RaftMessage = {
        type: 'RequestVote',
        from: node.id,
        to: peerId,
        term: node.term,
        candidateId: node.id,
        lastLogIndex,
        lastLogTerm,
      };
      this.messages.push(msg);
      events.push({
        tick: this.tick,
        type: 'vote-request',
        nodeId: node.id,
        description: `${node.id} requests vote from ${peerId} (term ${node.term}).`,
        data: { to: peerId, term: node.term },
      });
    }

    return events;
  }

  /** Transitions a candidate to leader after winning the election. */
  private becomeLeader(node: RaftNode): RaftEvent[] {
    node.role = 'leader';
    node.nextIndex = {};
    node.matchIndex = {};

    // Initialise leader volatile state
    const nextIdx = node.log.length + 1;
    for (const peerId of this.nodeIds) {
      node.nextIndex[peerId] = nextIdx;
      node.matchIndex[peerId] = peerId === node.id ? node.log.length : 0;
    }

    // Reset heartbeat timer
    this.heartbeatTimers.set(node.id, this.msToTicks(HEARTBEAT_INTERVAL_MS));

    const events: RaftEvent[] = [
      {
        tick: this.tick,
        type: 'become-leader',
        nodeId: node.id,
        description: `Node ${node.id} became leader for term ${node.term}.`,
        data: { term: node.term },
      },
    ];

    // Immediately send heartbeats
    events.push(...this.sendHeartbeats(node));
    return events;
  }

  // ── Heartbeats & Log Replication ───────────────────────────

  /** Leader sends AppendEntries (heartbeat / log replication) to all peers. */
  private sendHeartbeats(leader: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];

    for (const peerId of this.nodeIds) {
      if (peerId === leader.id) continue;
      if (this.crashedNodes.has(peerId)) continue;

      const nextIdx = leader.nextIndex[peerId] ?? (leader.log.length + 1);
      const prevLogIndex = nextIdx - 1;
      const prevLogTerm = prevLogIndex > 0 && prevLogIndex <= leader.log.length
        ? leader.log[prevLogIndex - 1].term
        : 0;

      // Entries to send (from nextIndex onward)
      const entries = leader.log.slice(nextIdx - 1);

      const msg: RaftMessage = {
        type: 'AppendEntries',
        from: leader.id,
        to: peerId,
        term: leader.term,
        leaderId: leader.id,
        prevLogIndex,
        prevLogTerm,
        entries: entries.length > 0 ? entries : [],
        leaderCommit: leader.commitIndex,
      };
      this.messages.push(msg);

      if (entries.length > 0) {
        events.push({
          tick: this.tick,
          type: 'append-entries',
          nodeId: leader.id,
          description: `${leader.id} replicating ${entries.length} entry(s) to ${peerId}.`,
          data: { to: peerId, entryCount: entries.length },
        });
      } else {
        events.push({
          tick: this.tick,
          type: 'heartbeat',
          nodeId: leader.id,
          description: `${leader.id} heartbeat to ${peerId} (term ${leader.term}).`,
          data: { to: peerId },
        });
      }
    }

    return events;
  }

  // ── Message Handling ───────────────────────────────────────

  /** Dispatches an incoming message to the correct handler. */
  private handleMessage(msg: RaftMessage): RaftEvent[] {
    const node = this.nodes.get(msg.to);
    if (!node) return [];

    switch (msg.type) {
      case 'RequestVote':
        return this.handleRequestVote(node, msg);
      case 'RequestVoteResponse':
        return this.handleRequestVoteResponse(node, msg);
      case 'AppendEntries':
        return this.handleAppendEntries(node, msg);
      case 'AppendEntriesResponse':
        return this.handleAppendEntriesResponse(node, msg);
    }
  }

  // ── RequestVote ────────────────────────────────────────────

  private handleRequestVote(node: RaftNode, msg: RequestVoteMessage): RaftEvent[] {
    const events: RaftEvent[] = [];

    // If the candidate's term is higher, step down
    if (msg.term > node.term) {
      this.stepDown(node, msg.term);
    }

    let voteGranted = false;

    if (msg.term >= node.term) {
      const canVote =
        node.votedFor === null || node.votedFor === msg.candidateId;
      const candidateLogUpToDate = this.isLogUpToDate(
        node,
        msg.lastLogIndex,
        msg.lastLogTerm,
      );

      if (canVote && candidateLogUpToDate) {
        voteGranted = true;
        node.votedFor = msg.candidateId;
        // Reset election timer when granting a vote
        this.resetElectionTimer(node.id);
      }
    }

    // Send response
    const response: RequestVoteResponseMessage = {
      type: 'RequestVoteResponse',
      from: node.id,
      to: msg.from,
      term: node.term,
      voteGranted,
    };
    this.messages.push(response);

    events.push({
      tick: this.tick,
      type: voteGranted ? 'vote-granted' : 'vote-denied',
      nodeId: node.id,
      description: `${node.id} ${voteGranted ? 'granted' : 'denied'} vote to ${msg.from} (term ${msg.term}).`,
      data: { candidateId: msg.from, voteGranted },
    });

    return events;
  }

  private handleRequestVoteResponse(node: RaftNode, msg: RequestVoteResponseMessage): RaftEvent[] {
    const events: RaftEvent[] = [];

    // If response has higher term, step down
    if (msg.term > node.term) {
      this.stepDown(node, msg.term);
      return events;
    }

    // Only process if still a candidate in the same term
    if (node.role !== 'candidate' || msg.term !== node.term) return events;

    if (msg.voteGranted) {
      const votes = this.votesReceived.get(node.id) ?? new Set<string>();
      votes.add(msg.from);
      this.votesReceived.set(node.id, votes);

      // Check if majority reached
      if (this.hasMajority(votes.size)) {
        events.push(...this.becomeLeader(node));
      }
    }

    return events;
  }

  // ── AppendEntries ──────────────────────────────────────────

  private handleAppendEntries(node: RaftNode, msg: AppendEntriesMessage): RaftEvent[] {
    const events: RaftEvent[] = [];

    // If leader's term is higher (or equal), recognise authority
    if (msg.term >= node.term) {
      if (msg.term > node.term || node.role === 'candidate') {
        this.stepDown(node, msg.term);
      }
      // Reset election timer — we heard from a valid leader
      this.resetElectionTimer(node.id);
    }

    let success = false;

    if (msg.term >= node.term) {
      const prevLogIndex = msg.prevLogIndex;
      const prevLogTerm = msg.prevLogTerm;

      // Check log consistency
      if (prevLogIndex === 0) {
        success = true;
      } else if (
        prevLogIndex <= node.log.length &&
        node.log[prevLogIndex - 1].term === prevLogTerm
      ) {
        success = true;
      }

      if (success && msg.entries.length > 0) {
        // Append entries (handle conflicts by truncating)
        for (const entry of msg.entries) {
          if (entry.index <= node.log.length) {
            if (node.log[entry.index - 1].term !== entry.term) {
              // Conflict: truncate from here
              node.log = node.log.slice(0, entry.index - 1);
              node.log.push({ ...entry });
            }
            // else: already have this entry, skip
          } else {
            node.log.push({ ...entry });
          }
        }
      }

      // Update commitIndex
      if (success && msg.leaderCommit > node.commitIndex) {
        const lastNewEntry = msg.entries.length > 0
          ? msg.entries[msg.entries.length - 1].index
          : node.log.length;
        node.commitIndex = Math.min(msg.leaderCommit, lastNewEntry);
      }
    }

    // Send response
    const response: AppendEntriesResponseMessage = {
      type: 'AppendEntriesResponse',
      from: node.id,
      to: msg.from,
      term: node.term,
      success,
      // Include the match index so leader can update
      matchIndex: success
        ? (msg.entries.length > 0
            ? msg.entries[msg.entries.length - 1].index
            : msg.prevLogIndex)
        : undefined,
    };
    this.messages.push(response);

    return events;
  }

  private handleAppendEntriesResponse(node: RaftNode, msg: AppendEntriesResponseMessage): RaftEvent[] {
    const events: RaftEvent[] = [];

    if (msg.term > node.term) {
      this.stepDown(node, msg.term);
      return events;
    }

    if (node.role !== 'leader' || msg.term !== node.term) return events;

    if (msg.success) {
      // Update nextIndex and matchIndex for the follower
      const matchIdx = msg.matchIndex ?? 0;
      if (matchIdx > 0) {
        node.matchIndex[msg.from] = matchIdx;
        node.nextIndex[msg.from] = matchIdx + 1;
      }

      // Try to advance commitIndex
      const commitEvents = this.advanceCommitIndex(node);
      events.push(...commitEvents);
    } else {
      // Decrement nextIndex and retry
      const current = node.nextIndex[msg.from] ?? 1;
      node.nextIndex[msg.from] = Math.max(1, current - 1);
    }

    return events;
  }

  // ── Commit Advancement ─────────────────────────────────────

  /**
   * Leader advances commitIndex if there exists an N such that:
   *   - N > commitIndex
   *   - A majority of matchIndex[i] >= N
   *   - log[N].term == currentTerm
   */
  private advanceCommitIndex(leader: RaftNode): RaftEvent[] {
    const events: RaftEvent[] = [];

    for (let n = leader.log.length; n > leader.commitIndex; n--) {
      if (leader.log[n - 1].term !== leader.term) continue;

      let replicatedCount = 0;
      for (const peerId of this.nodeIds) {
        if ((leader.matchIndex[peerId] ?? 0) >= n) {
          replicatedCount++;
        }
      }

      if (this.hasMajority(replicatedCount)) {
        leader.commitIndex = n;
        events.push({
          tick: this.tick,
          type: 'log-committed',
          nodeId: leader.id,
          description: `Leader ${leader.id} committed log index ${n} (command: "${leader.log[n - 1].command}").`,
          data: { commitIndex: n, command: leader.log[n - 1].command },
        });
        break; // We found the highest N; lower ones are also committed.
      }
    }

    return events;
  }

  /** Applies committed but unapplied log entries. */
  private advanceStateMachine(node: RaftNode, events: RaftEvent[]): void {
    while (node.lastApplied < node.commitIndex) {
      node.lastApplied++;
      // In a real system, we would apply the command here.
      // For simulation, we just advance the pointer.
      if (node.role !== 'leader') {
        events.push({
          tick: this.tick,
          type: 'log-committed',
          nodeId: node.id,
          description: `${node.id} applied log index ${node.lastApplied}.`,
          data: { appliedIndex: node.lastApplied },
        });
      }
    }
  }

  // ── Helpers ────────────────────────────────────────────────

  /** Steps a node down to follower in the given term. */
  private stepDown(node: RaftNode, newTerm: number): void {
    node.term = newTerm;
    node.role = 'follower';
    node.votedFor = null;
    node.nextIndex = {};
    node.matchIndex = {};
    this.resetElectionTimer(node.id);
  }

  /**
   * Returns true if the candidate's log is at least as up-to-date
   * as the voter's log (Raft §5.4.1).
   */
  private isLogUpToDate(
    voter: RaftNode,
    candidateLastLogIndex: number,
    candidateLastLogTerm: number,
  ): boolean {
    const voterLastIndex = voter.log.length;
    const voterLastTerm = voterLastIndex > 0 ? voter.log[voterLastIndex - 1].term : 0;

    if (candidateLastLogTerm !== voterLastTerm) {
      return candidateLastLogTerm > voterLastTerm;
    }
    return candidateLastLogIndex >= voterLastIndex;
  }

  /** Returns true if `count` forms a majority of the cluster. */
  private hasMajority(count: number): boolean {
    return count > this.nodeIds.length / 2;
  }

  /** Returns the current leader id, or null. */
  private findLeader(): string | null {
    for (const node of Array.from(this.nodes.values())) {
      if (node.role === 'leader' && !this.crashedNodes.has(node.id)) {
        return node.id;
      }
    }
    return null;
  }

  /** Returns whether two nodes can communicate given the current partition state. */
  private canCommunicate(a: string, b: string): boolean {
    if (this.partitions.length === 0) return true;
    for (const group of this.partitions) {
      if (group.has(a) && group.has(b)) return true;
    }
    return false;
  }

  /** Resets the election timer for a node with a fresh random timeout. */
  private resetElectionTimer(nodeId: string): void {
    const timeout = this.randomElectionTimeout();
    const node = this.nodes.get(nodeId);
    if (node) node.electionTimeoutMs = timeout;
    this.electionTimers.set(nodeId, this.msToTicks(timeout));
  }

  /** Generates a random election timeout in [150, 300] ms. */
  private randomElectionTimeout(): number {
    return this.rng.nextInt(ELECTION_TIMEOUT_MIN_MS, ELECTION_TIMEOUT_MAX_MS);
  }

  /** Converts milliseconds to ticks. */
  private msToTicks(ms: number): number {
    return Math.ceil(ms / MS_PER_TICK);
  }

  /** Creates a deep copy of a RaftNode for external consumption. */
  private copyNode(node: RaftNode): RaftNode {
    return {
      ...node,
      log: node.log.map((e) => ({ ...e })),
      nextIndex: { ...node.nextIndex },
      matchIndex: { ...node.matchIndex },
    };
  }
}
