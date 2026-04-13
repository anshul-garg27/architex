// ─────────────────────────────────────────────────────────────
// Architex — Bridge Appearance Rules (CROSS-007 / bridge-rules)
// 30+ rules defining when bridges should appear based on context.
// ─────────────────────────────────────────────────────────────

import type { ModuleType } from "@/stores/ui-store";
import type { BridgePayload } from "./bridge-types";

// ── Rule definition ───────────────────────────────────────────

export interface BridgeRule {
  id: string;
  /** Source module where the rule evaluates. */
  sourceModule: ModuleType;
  /** Target module to bridge to. */
  targetModule: ModuleType;
  /** Human-readable description of when this rule triggers. */
  description: string;
  /** Button label when this rule matches. */
  label: string;
  /**
   * Condition function. Receives the current context
   * (concept ID, algorithm ID, topic, etc.) and returns true
   * if the bridge should be shown.
   */
  condition: (context: BridgeRuleContext) => boolean;
  /** Factory to create the bridge payload when the rule triggers. */
  createPayload: (context: BridgeRuleContext) => BridgePayload;
}

export interface BridgeRuleContext {
  activeModule: ModuleType;
  conceptId?: string;
  algorithmId?: string;
  dataStructureId?: string;
  patternId?: string;
  topic?: string;
  exerciseCompleted?: boolean;
  tags?: string[];
}

// ── Rule database ─────────────────────────────────────────────

export const BRIDGE_RULES: BridgeRule[] = [
  // ── Data Structures → Database ──────────────────────────────
  {
    id: "btree-to-db-indexing",
    sourceModule: "data-structures",
    targetModule: "database",
    description: "When viewing B-Tree, show bridge to Database Indexing module",
    label: "See as DB index",
    condition: (ctx) => ctx.dataStructureId === "b-tree" || ctx.conceptId === "b-tree",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 3,
      normalizationForm: "3NF",
      indexStrategy: "btree",
      estimatedRows: 1_000_000,
    }),
  },
  {
    id: "hash-table-to-db",
    sourceModule: "data-structures",
    targetModule: "database",
    description: "When viewing hash table, show bridge to hash indexes",
    label: "See as hash index",
    condition: (ctx) => ctx.dataStructureId === "hash-table" || ctx.conceptId === "hash-table",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 2,
      normalizationForm: "3NF",
      indexStrategy: "hash",
      estimatedRows: 500_000,
    }),
  },
  {
    id: "skip-list-to-db",
    sourceModule: "data-structures",
    targetModule: "database",
    description: "When viewing skip list, show bridge to LSM-tree memtable",
    label: "See in LSM-tree",
    condition: (ctx) => ctx.dataStructureId === "skip-list" || ctx.conceptId === "skip-list",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 1,
      normalizationForm: "3NF",
      indexStrategy: "lsm-skiplist",
      estimatedRows: 10_000_000,
    }),
  },
  {
    id: "bloom-filter-to-db",
    sourceModule: "data-structures",
    targetModule: "database",
    description: "When viewing bloom filter, show bridge to DB bloom filters",
    label: "See in DB layer",
    condition: (ctx) => ctx.dataStructureId === "bloom-filter" || ctx.conceptId === "bloom-filter",
    createPayload: () => ({
      type: "data-structure-to-system",
      dataStructureId: "bloom-filter",
      category: "probabilistic",
      memoryProfile: "O(m)",
      targetNodeType: "database",
    }),
  },

  // ── Data Structures → System Design ─────────────────────────
  {
    id: "lru-cache-to-system",
    sourceModule: "data-structures",
    targetModule: "system-design",
    description: "When viewing LRU cache, show bridge to caching layer",
    label: "Configure cache layer",
    condition: (ctx) => ctx.dataStructureId === "lru-cache" || ctx.conceptId === "lru-cache",
    createPayload: () => ({
      type: "data-structure-to-system",
      dataStructureId: "lru-cache",
      category: "cache",
      memoryProfile: "O(n)",
      targetNodeType: "cache",
    }),
  },
  {
    id: "heap-to-system",
    sourceModule: "data-structures",
    targetModule: "system-design",
    description: "When viewing heap/priority queue, show bridge to task scheduling",
    label: "See in task scheduler",
    condition: (ctx) => ctx.dataStructureId === "heap" || ctx.conceptId === "heap" || ctx.conceptId === "priority-queue",
    createPayload: () => ({
      type: "data-structure-to-system",
      dataStructureId: "heap",
      category: "priority-queue",
      memoryProfile: "O(n)",
      targetNodeType: "processing",
    }),
  },

  // ── Algorithm → System Design ───────────────────────────────
  {
    id: "sorting-algo-to-system",
    sourceModule: "algorithms",
    targetModule: "system-design",
    description: "When viewing any sorting algorithm, show latency impact bridge",
    label: "See latency impact",
    condition: (ctx) => ctx.tags?.includes("sorting") === true || ["quicksort", "mergesort", "heapsort", "timsort"].includes(ctx.algorithmId ?? ""),
    createPayload: (ctx) => ({
      type: "algorithm-to-system",
      algorithmId: ctx.algorithmId ?? "quicksort",
      complexity: { time: "O(n log n)", space: "O(log n)" },
      processingTimeMs: 12,
    }),
  },
  {
    id: "binary-search-to-system",
    sourceModule: "algorithms",
    targetModule: "system-design",
    description: "When viewing binary search, show O(log n) throughput impact",
    label: "See throughput impact",
    condition: (ctx) => ctx.algorithmId === "binary-search",
    createPayload: () => ({
      type: "algorithm-to-system",
      algorithmId: "binary-search",
      complexity: { time: "O(log n)", space: "O(1)" },
      processingTimeMs: 1,
    }),
  },
  {
    id: "graph-algo-to-system",
    sourceModule: "algorithms",
    targetModule: "system-design",
    description: "When viewing graph algorithms, show network topology impact",
    label: "See in network topology",
    condition: (ctx) => ctx.tags?.includes("graph") === true || ["bfs", "dfs", "dijkstra", "bellman-ford"].includes(ctx.algorithmId ?? ""),
    createPayload: (ctx) => ({
      type: "algorithm-to-system",
      algorithmId: ctx.algorithmId ?? "dijkstra",
      complexity: { time: "O(V + E)", space: "O(V)" },
      targetNodeType: "networking",
    }),
  },
  {
    id: "dp-algo-to-system",
    sourceModule: "algorithms",
    targetModule: "system-design",
    description: "When viewing DP algorithms, show optimization impact",
    label: "See optimization impact",
    condition: (ctx) => ctx.tags?.includes("dp") === true || ctx.tags?.includes("dynamic-programming") === true,
    createPayload: (ctx) => ({
      type: "algorithm-to-system",
      algorithmId: ctx.algorithmId ?? "dp",
      complexity: { time: "O(n^2)", space: "O(n)" },
      processingTimeMs: 50,
    }),
  },

  // ── Distributed → System Design ─────────────────────────────
  {
    id: "raft-to-system",
    sourceModule: "distributed",
    targetModule: "system-design",
    description: "When viewing Raft consensus, show replication config bridge",
    label: "Configure replication",
    condition: (ctx) => ctx.conceptId === "raft" || ctx.topic === "raft",
    createPayload: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "raft",
      replicationFactor: 3,
      consistencyLevel: "strong",
    }),
  },
  {
    id: "paxos-to-system",
    sourceModule: "distributed",
    targetModule: "system-design",
    description: "When viewing Paxos, show consensus config bridge",
    label: "Configure consensus",
    condition: (ctx) => ctx.conceptId === "paxos" || ctx.topic === "paxos",
    createPayload: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "paxos",
      replicationFactor: 5,
      consistencyLevel: "strong",
    }),
  },
  {
    id: "consistent-hashing-to-system",
    sourceModule: "distributed",
    targetModule: "system-design",
    description: "When viewing consistent hashing, show sharding bridge",
    label: "Configure sharding",
    condition: (ctx) => ctx.conceptId === "consistent-hashing" || ctx.topic === "consistent-hashing",
    createPayload: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "raft",
      shardingStrategy: "consistent-hashing",
      replicationFactor: 3,
    }),
  },
  {
    id: "crdt-to-system",
    sourceModule: "distributed",
    targetModule: "system-design",
    description: "When viewing CRDTs, show eventual consistency bridge",
    label: "See in system",
    condition: (ctx) => ctx.conceptId === "crdt" || ctx.topic === "crdt",
    createPayload: () => ({
      type: "distributed-to-system",
      consensusAlgorithm: "raft",
      consistencyLevel: "eventual",
      replicationFactor: 3,
    }),
  },

  // ── Database → System Design ────────────────────────────────
  {
    id: "er-diagram-to-system",
    sourceModule: "database",
    targetModule: "system-design",
    description: "After ER diagram completion, show deploy bridge",
    label: "Deploy schema",
    condition: (ctx) => ctx.exerciseCompleted === true && ctx.topic === "er-diagram",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 5,
      normalizationForm: "3NF",
      estimatedRows: 1_000_000,
      shardCount: 3,
      replicaCount: 2,
    }),
  },
  {
    id: "normalization-to-system",
    sourceModule: "database",
    targetModule: "system-design",
    description: "After normalization exercise, show DB config bridge",
    label: "Configure DB layer",
    condition: (ctx) => ctx.exerciseCompleted === true && ctx.topic === "normalization",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 4,
      normalizationForm: "BCNF",
      indexStrategy: "composite-btree",
      estimatedRows: 500_000,
    }),
  },
  {
    id: "query-plan-to-system",
    sourceModule: "database",
    targetModule: "system-design",
    description: "When viewing query plans, show optimization bridge",
    label: "Optimize in system",
    condition: (ctx) => ctx.topic === "query-plan" || ctx.conceptId === "query-optimization",
    createPayload: () => ({
      type: "database-to-system",
      entityCount: 3,
      normalizationForm: "3NF",
      indexStrategy: "covering-index",
      estimatedRows: 2_000_000,
    }),
  },

  // ── Networking → System Design ──────────────────────────────
  {
    id: "grpc-to-system",
    sourceModule: "networking",
    targetModule: "system-design",
    description: "When viewing gRPC, show protocol config bridge",
    label: "Configure gRPC",
    condition: (ctx) => ctx.conceptId === "grpc" || ctx.topic === "grpc",
    createPayload: () => ({
      type: "networking-to-system",
      protocol: "grpc",
      tlsEnabled: true,
      compressionEnabled: true,
    }),
  },
  {
    id: "websocket-to-system",
    sourceModule: "networking",
    targetModule: "system-design",
    description: "When viewing WebSocket, show real-time bridge",
    label: "Configure WebSocket",
    condition: (ctx) => ctx.conceptId === "websocket" || ctx.topic === "websocket",
    createPayload: () => ({
      type: "networking-to-system",
      protocol: "websocket",
      keepAlive: true,
    }),
  },
  {
    id: "http-to-system",
    sourceModule: "networking",
    targetModule: "system-design",
    description: "When viewing HTTP protocol, show REST API bridge",
    label: "Configure HTTP API",
    condition: (ctx) => ctx.conceptId === "http" || ctx.topic === "http",
    createPayload: () => ({
      type: "networking-to-system",
      protocol: "http",
      tlsEnabled: true,
    }),
  },

  // ── Concurrency → System Design ─────────────────────────────
  {
    id: "thread-pool-to-system",
    sourceModule: "concurrency",
    targetModule: "system-design",
    description: "When viewing thread pools, show connection pool bridge",
    label: "Configure pool",
    condition: (ctx) => ctx.conceptId === "thread-pool" || ctx.topic === "thread-pool",
    createPayload: () => ({
      type: "concurrency-to-system",
      threadModel: "thread-pool",
      poolSize: 100,
      maxConnections: 500,
    }),
  },
  {
    id: "event-loop-to-system",
    sourceModule: "concurrency",
    targetModule: "system-design",
    description: "When viewing event loop, show high-concurrency bridge",
    label: "Configure event loop",
    condition: (ctx) => ctx.conceptId === "event-loop" || ctx.topic === "event-loop",
    createPayload: () => ({
      type: "concurrency-to-system",
      threadModel: "event-loop",
      maxConnections: 10_000,
      backpressureStrategy: "throttle",
    }),
  },
  {
    id: "actor-model-to-system",
    sourceModule: "concurrency",
    targetModule: "system-design",
    description: "When viewing actor model, show actor-based architecture bridge",
    label: "Configure actors",
    condition: (ctx) => ctx.conceptId === "actor-model" || ctx.topic === "actor",
    createPayload: () => ({
      type: "concurrency-to-system",
      threadModel: "actor",
      poolSize: 50,
      maxConnections: 2_000,
    }),
  },

  // ── Security → System Design ────────────────────────────────
  {
    id: "jwt-to-system",
    sourceModule: "security",
    targetModule: "system-design",
    description: "After JWT demo, show auth config bridge",
    label: "Secure with JWT",
    condition: (ctx) => ctx.conceptId === "jwt" || ctx.topic === "jwt",
    createPayload: () => ({
      type: "security-to-system",
      authMechanism: "jwt",
      encryptionInTransit: true,
      rateLimitRps: 1000,
    }),
  },
  {
    id: "oauth2-to-system",
    sourceModule: "security",
    targetModule: "system-design",
    description: "After OAuth2 demo, show auth service bridge",
    label: "Configure OAuth2",
    condition: (ctx) => ctx.conceptId === "oauth2" || ctx.topic === "oauth2",
    createPayload: () => ({
      type: "security-to-system",
      authMechanism: "oauth2",
      encryptionInTransit: true,
    }),
  },
  {
    id: "mtls-to-system",
    sourceModule: "security",
    targetModule: "system-design",
    description: "After mTLS demo, show zero-trust bridge",
    label: "Enable mTLS",
    condition: (ctx) => ctx.conceptId === "mtls" || ctx.topic === "mtls",
    createPayload: () => ({
      type: "security-to-system",
      authMechanism: "mtls",
      encryptionInTransit: true,
      encryptionAtRest: true,
    }),
  },

  // ── LLD → System Design ─────────────────────────────────────
  {
    id: "observer-to-system",
    sourceModule: "lld",
    targetModule: "system-design",
    description: "When viewing Observer pattern, show pub-sub bridge",
    label: "Build pub-sub system",
    condition: (ctx) => ctx.patternId === "observer",
    createPayload: () => ({
      type: "lld-to-system",
      patternId: "observer",
      patternName: "Observer Pattern",
      serviceCount: 3,
      communicationStyle: "event-driven",
    }),
  },
  {
    id: "cqrs-to-system",
    sourceModule: "lld",
    targetModule: "system-design",
    description: "When viewing CQRS pattern, show architecture bridge",
    label: "Build CQRS system",
    condition: (ctx) => ctx.patternId === "cqrs",
    createPayload: () => ({
      type: "lld-to-system",
      patternId: "cqrs",
      patternName: "CQRS",
      serviceCount: 4,
      communicationStyle: "async",
    }),
  },
  {
    id: "saga-to-system",
    sourceModule: "lld",
    targetModule: "system-design",
    description: "When viewing Saga pattern, show distributed tx bridge",
    label: "Build saga orchestration",
    condition: (ctx) => ctx.patternId === "saga",
    createPayload: () => ({
      type: "lld-to-system",
      patternId: "saga",
      patternName: "Saga Pattern",
      serviceCount: 5,
      communicationStyle: "async",
    }),
  },

  // ── Cross-module knowledge graph bridges ────────────────────
  {
    id: "kg-any-concept",
    sourceModule: "knowledge-graph",
    targetModule: "system-design",
    description: "When viewing any concept in knowledge graph, show system bridge",
    label: "See in system design",
    condition: (ctx) => ctx.activeModule === "knowledge-graph" && ctx.conceptId != null,
    createPayload: (ctx) => ({
      type: "knowledge-graph-open-concept",
      conceptId: ctx.conceptId ?? "",
      conceptName: ctx.conceptId?.replace(/-/g, " ") ?? "",
      targetModule: "system-design",
    }),
  },
];

// ── Rule evaluation ───────────────────────────────────────────

/**
 * Evaluate all rules against a context and return matching rules.
 */
export function evaluateRules(context: BridgeRuleContext): BridgeRule[] {
  return BRIDGE_RULES.filter((rule) => {
    // Only evaluate rules from the active module
    if (rule.sourceModule !== context.activeModule) return false;
    try {
      return rule.condition(context);
    } catch {
      return false;
    }
  });
}

/**
 * Get bridge payloads for all matching rules in the current context.
 */
export function getMatchingBridgePayloads(
  context: BridgeRuleContext,
): { rule: BridgeRule; payload: BridgePayload }[] {
  return evaluateRules(context).map((rule) => ({
    rule,
    payload: rule.createPayload(context),
  }));
}
