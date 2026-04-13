// ─────────────────────────────────────────────────────────────
// Architex — Distributed Systems Module (barrel export)
// ─────────────────────────────────────────────────────────────

// Raft Consensus
export {
  type RaftRole,
  type LogEntry,
  type RaftNode,
  type RaftMessage,
  type RaftEvent,
  RaftCluster,
} from './raft';

// Consistent Hashing
export {
  type HashNode,
  type HashKey,
  ConsistentHashRing,
} from './consistent-hash';

// Vector Clocks
export {
  type VectorClock,
  type ClockEventType,
  type ClockEvent,
  VectorClockSimulation,
} from './vector-clock';

// Gossip Protocol
export {
  type GossipMode,
  type GossipNode,
  type GossipEvent,
  GossipProtocol,
} from './gossip';

// CRDTs
export {
  type CRDTEvent,
  type CRDTType,
  type LWWState,
  GCounter,
  PNCounter,
  LWWRegister,
  ORSet,
  CRDTSimulation,
} from './crdt';

// CAP Theorem (+ PACELC extension)
export {
  type CAPMode,
  type PACELCMode,
  type OperationResult,
  type CAPNode,
  type CAPEvent,
  CAPCluster,
} from './cap-theorem';

// Two-Phase Commit
export {
  type TwoPCStep,
  simulate2PC,
} from './two-phase-commit';

// Saga Pattern (choreography + orchestration)
export {
  type SagaStep,
  simulateSagaChoreography,
  simulateSagaOrchestration,
} from './saga';

// MapReduce
export {
  type MRStep,
  simulateMapReduce,
} from './map-reduce';

// Lamport Timestamps
export {
  type LamportEvent,
  LamportSimulation,
} from './lamport-timestamps';

// Paxos (single-decree + Multi-Paxos)
export {
  type PaxosStep,
  simulatePaxos,
  simulateMultiPaxos,
} from './paxos';
