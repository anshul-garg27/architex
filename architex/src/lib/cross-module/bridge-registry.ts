// ─────────────────────────────────────────────────────────────
// Architex — Cross-Module Bridge Registry (CROSS-002)
// ─────────────────────────────────────────────────────────────

import type { BridgeLink, BridgePayload } from "./bridge-types";
import type { ModuleType } from "@/stores/ui-store";

// ── Registry ──────────────────────────────────────────────────

/**
 * Static registry of all cross-module bridge connections.
 * Each entry defines a navigable link between two modules
 * with a factory function that creates the default payload.
 */
export const BRIDGE_REGISTRY: BridgeLink[] = [
  // ── Algorithm → System Design ───────────────────────────────
  {
    id: "algo-sys-latency",
    sourceModule: "algorithms",
    targetModule: "system-design",
    label: "See latency impact in system",
    description: "See how this algorithm's time complexity affects system latency under load.",
    payloadFactory: () => ({
      type: "algorithm-to-system",
      algorithmId: "quicksort",
      complexity: { time: "O(n log n)", space: "O(log n)" },
      processingTimeMs: 12,
    }),
  },
  {
    id: "algo-sys-throughput",
    sourceModule: "algorithms",
    targetModule: "system-design",
    label: "Analyze throughput impact",
    description: "Understand how algorithm efficiency impacts overall system throughput.",
    payloadFactory: () => ({
      type: "algorithm-to-system",
      algorithmId: "binary-search",
      complexity: { time: "O(log n)", space: "O(1)" },
      processingTimeMs: 1,
    }),
  },

  // ── Data Structures → System Design ─────────────────────────
  {
    id: "ds-sys-cache",
    sourceModule: "data-structures",
    targetModule: "system-design",
    label: "Configure as cache layer",
    description: "Use this data structure to configure a caching strategy in the system.",
    payloadFactory: () => ({
      type: "data-structure-to-system",
      dataStructureId: "lru-cache",
      category: "cache",
      memoryProfile: "O(n)",
      targetNodeType: "cache",
    }),
  },
  {
    id: "ds-sys-index",
    sourceModule: "data-structures",
    targetModule: "database",
    label: "Use as database index",
    description: "Apply this data structure as an indexing strategy in the database module.",
    payloadFactory: () => ({
      type: "data-structure-to-system",
      dataStructureId: "b-tree",
      category: "tree",
      memoryProfile: "O(n)",
      targetNodeType: "database",
    }),
  },

  // ── Database → System Design ────────────────────────────────
  {
    id: "db-sys-schema",
    sourceModule: "database",
    targetModule: "system-design",
    label: "Deploy this schema",
    description: "Spawn a database component on the canvas configured with this schema's properties.",
    payloadFactory: () => ({
      type: "database-to-system",
      entityCount: 5,
      normalizationForm: "3NF",
      estimatedRows: 1_000_000,
      shardCount: 3,
      replicaCount: 2,
    }),
  },
  {
    id: "db-sys-indexing",
    sourceModule: "database",
    targetModule: "system-design",
    label: "Configure indexing strategy",
    description: "Apply this indexing approach to database nodes in the system design.",
    payloadFactory: () => ({
      type: "database-to-system",
      entityCount: 3,
      normalizationForm: "BCNF",
      indexStrategy: "composite-btree",
      estimatedRows: 500_000,
    }),
  },

  // ── Distributed → System Design ─────────────────────────────
  {
    id: "dist-sys-raft",
    sourceModule: "distributed",
    targetModule: "system-design",
    label: "Configure Raft consensus",
    description: "Apply Raft consensus protocol to the replication layer of your system.",
    payloadFactory: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "raft",
      replicationFactor: 3,
      consistencyLevel: "strong",
    }),
  },
  {
    id: "dist-sys-consistent-hash",
    sourceModule: "distributed",
    targetModule: "system-design",
    label: "Apply consistent hashing",
    description: "Configure consistent hashing for data distribution across shards.",
    payloadFactory: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "raft",
      shardingStrategy: "consistent-hashing",
      replicationFactor: 3,
    }),
  },

  // ── Networking → System Design ──────────────────────────────
  {
    id: "net-sys-grpc",
    sourceModule: "networking",
    targetModule: "system-design",
    label: "Configure gRPC protocol",
    description: "Set up gRPC communication between services in the system.",
    payloadFactory: () => ({
      type: "networking-to-system",
      protocol: "grpc",
      tlsEnabled: true,
      compressionEnabled: true,
    }),
  },
  {
    id: "net-sys-ws",
    sourceModule: "networking",
    targetModule: "system-design",
    label: "Configure WebSocket layer",
    description: "Add real-time WebSocket communication to the system architecture.",
    payloadFactory: () => ({
      type: "networking-to-system",
      protocol: "websocket",
      keepAlive: true,
    }),
  },

  // ── Concurrency → System Design ─────────────────────────────
  {
    id: "conc-sys-pool",
    sourceModule: "concurrency",
    targetModule: "system-design",
    label: "Configure connection pooling",
    description: "Apply this concurrency model to configure connection pool sizes.",
    payloadFactory: () => ({
      type: "concurrency-to-system",
      threadModel: "thread-pool",
      poolSize: 100,
      maxConnections: 500,
    }),
  },
  {
    id: "conc-sys-eventloop",
    sourceModule: "concurrency",
    targetModule: "system-design",
    label: "Configure event-loop model",
    description: "Set up an event-loop-based processing model for high-concurrency nodes.",
    payloadFactory: () => ({
      type: "concurrency-to-system",
      threadModel: "event-loop",
      maxConnections: 10_000,
      backpressureStrategy: "throttle",
    }),
  },

  // ── LLD → System Design ─────────────────────────────────────
  {
    id: "lld-sys-pattern",
    sourceModule: "lld",
    targetModule: "system-design",
    label: "Scaffold microservice from pattern",
    description: "Create a microservice architecture based on this design pattern.",
    payloadFactory: () => ({
      type: "lld-to-system",
      patternId: "observer",
      patternName: "Observer Pattern",
      serviceCount: 3,
      communicationStyle: "event-driven",
    }),
  },
  {
    id: "lld-sys-cqrs",
    sourceModule: "lld",
    targetModule: "system-design",
    label: "Apply CQRS pattern",
    description: "Scaffold a CQRS architecture with separate read/write paths.",
    payloadFactory: () => ({
      type: "lld-to-system",
      patternId: "cqrs",
      patternName: "CQRS",
      serviceCount: 4,
      communicationStyle: "async",
    }),
  },

  // ── Security → System Design ────────────────────────────────
  {
    id: "sec-sys-jwt",
    sourceModule: "security",
    targetModule: "system-design",
    label: "Secure with JWT auth",
    description: "Enable JWT authentication on the API gateway and service nodes.",
    payloadFactory: () => ({
      type: "security-to-system",
      authMechanism: "jwt",
      encryptionInTransit: true,
      rateLimitRps: 1000,
    }),
  },
  {
    id: "sec-sys-mtls",
    sourceModule: "security",
    targetModule: "system-design",
    label: "Enable mTLS",
    description: "Configure mutual TLS between all services for zero-trust networking.",
    payloadFactory: () => ({
      type: "security-to-system",
      authMechanism: "mtls",
      encryptionInTransit: true,
      encryptionAtRest: true,
    }),
  },

  // ── Interview → Simulation ──────────────────────────────────
  {
    id: "interview-sim",
    sourceModule: "interview",
    targetModule: "system-design",
    label: "Run simulation scoring",
    description: "Score your interview canvas design by running a full simulation.",
    payloadFactory: () => ({
      type: "interview-simulate",
      challengeId: "generic",
      canvasNodes: 0,
      canvasEdges: 0,
      tickCount: 600,
    }),
  },

  // ── Knowledge Graph cross-links ─────────────────────────────
  {
    id: "kg-distributed",
    sourceModule: "knowledge-graph",
    targetModule: "distributed",
    label: "Explore in Distributed Systems",
    description: "Open this concept in the Distributed Systems learning module.",
    payloadFactory: () => ({
      type: "knowledge-graph-open-concept",
      conceptId: "raft",
      conceptName: "Raft Consensus",
      targetModule: "distributed",
    }),
  },
  {
    id: "kg-database",
    sourceModule: "knowledge-graph",
    targetModule: "database",
    label: "Explore in Database Lab",
    description: "Open this concept in the Database Design learning module.",
    payloadFactory: () => ({
      type: "knowledge-graph-open-concept",
      conceptId: "b-tree-index",
      conceptName: "B-Tree Index",
      targetModule: "database",
    }),
  },
];

// ── Lookup helpers ────────────────────────────────────────────

/** Get all bridges originating from a specific module. */
export function getBridgesFromModule(module: ModuleType): BridgeLink[] {
  return BRIDGE_REGISTRY.filter((b) => b.sourceModule === module);
}

/** Get all bridges targeting a specific module. */
export function getBridgesToModule(module: ModuleType): BridgeLink[] {
  return BRIDGE_REGISTRY.filter((b) => b.targetModule === module);
}

/** Get all bridges between two specific modules. */
export function getBridgesBetween(
  source: ModuleType,
  target: ModuleType,
): BridgeLink[] {
  return BRIDGE_REGISTRY.filter(
    (b) => b.sourceModule === source && b.targetModule === target,
  );
}

/** Get a specific bridge by its ID. */
export function getBridgeById(id: string): BridgeLink | undefined {
  return BRIDGE_REGISTRY.find((b) => b.id === id);
}

/** Get all unique modules that have outgoing bridges. */
export function getModulesWithBridges(): ModuleType[] {
  const modules = new Set<ModuleType>();
  for (const b of BRIDGE_REGISTRY) {
    modules.add(b.sourceModule);
  }
  return [...modules];
}
