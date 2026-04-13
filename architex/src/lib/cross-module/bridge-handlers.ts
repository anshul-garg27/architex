// ─────────────────────────────────────────────────────────────
// Architex — Cross-Module Bridge Handlers (CROSS-003)
// ─────────────────────────────────────────────────────────────

import type {
  BridgePayload,
  AlgorithmToSystem,
  DataStructureToSystem,
  DatabaseToSystem,
  DistributedToSystem,
  NetworkingToSystem,
  ConcurrencyToSystem,
  LLDToSystem,
  SecurityToSystem,
  InterviewSimulate,
  KnowledgeGraphOpenConcept,
} from "./bridge-types";

// ── Handler result ────────────────────────────────────────────

export interface BridgeHandlerResult {
  success: boolean;
  action: string;
  details: Record<string, unknown>;
  error?: string;
}

// ── Complexity → Processing Time mapping ──────────────────────

const COMPLEXITY_PROCESSING_MAP: Record<string, number> = {
  "O(1)": 1,
  "O(log n)": 2,
  "O(n)": 5,
  "O(n log n)": 12,
  "O(n^2)": 50,
  "O(n^3)": 200,
  "O(2^n)": 1000,
};

function complexityToProcessingTime(timeComplexity: string): number {
  return COMPLEXITY_PROCESSING_MAP[timeComplexity] ?? 10;
}

// ── Individual handlers ───────────────────────────────────────

export function handleAlgorithmBridge(
  payload: AlgorithmToSystem,
): BridgeHandlerResult {
  const processingTimeMs =
    payload.processingTimeMs ?? complexityToProcessingTime(payload.complexity.time);

  return {
    success: true,
    action: "configure-node-processing-time",
    details: {
      algorithmId: payload.algorithmId,
      processingTimeMs,
      timeComplexity: payload.complexity.time,
      spaceComplexity: payload.complexity.space,
      targetTemplate: payload.targetTemplate ?? "web-backend",
      targetNodeType: payload.targetNodeType ?? "web-server",
      configOverrides: {
        "processing-time-ms": processingTimeMs,
        algorithm: payload.algorithmId,
      },
    },
  };
}

export function handleDataStructureBridge(
  payload: DataStructureToSystem,
): BridgeHandlerResult {
  return {
    success: true,
    action: "configure-data-layer",
    details: {
      dataStructureId: payload.dataStructureId,
      category: payload.category,
      memoryProfile: payload.memoryProfile,
      targetNodeType: payload.targetNodeType ?? "cache",
      configOverrides: {
        "data-structure": payload.dataStructureId,
        "memory-profile": payload.memoryProfile,
      },
    },
  };
}

export function handleDatabaseBridge(
  payload: DatabaseToSystem,
): BridgeHandlerResult {
  // Map entity count and normalization form to shard/replica config
  const shardCount = payload.shardCount ?? (payload.entityCount > 10 ? 4 : payload.entityCount > 5 ? 2 : 1);
  const replicaCount = payload.replicaCount ?? (payload.normalizationForm === "BCNF" ? 3 : 2);

  return {
    success: true,
    action: "spawn-database-config",
    details: {
      entityCount: payload.entityCount,
      normalizationForm: payload.normalizationForm,
      indexStrategy: payload.indexStrategy ?? "btree",
      estimatedRows: payload.estimatedRows ?? 100_000,
      shardCount,
      replicaCount,
      configOverrides: {
        shards: shardCount,
        replicas: replicaCount,
        "normalization-form": payload.normalizationForm,
        "estimated-rows": payload.estimatedRows ?? 100_000,
      },
    },
  };
}

export function handleDistributedBridge(
  payload: DistributedToSystem,
): BridgeHandlerResult {
  const replicationFactor = payload.replicationFactor ?? 3;

  // Map consensus algorithm to replication config
  const consensusConfig: Record<string, unknown> = {
    raft: { leaderElection: true, logReplication: true, heartbeatMs: 150 },
    paxos: { proposerCount: 1, acceptorCount: replicationFactor, learnerCount: replicationFactor },
    zab: { leaderElection: true, atomicBroadcast: true, epochBased: true },
    pbft: { faultTolerance: Math.floor((replicationFactor - 1) / 3), viewChange: true },
  };

  return {
    success: true,
    action: "configure-replication",
    details: {
      consensusAlgorithm: payload.consensusAlgorithm,
      shardingStrategy: payload.shardingStrategy ?? "consistent-hashing",
      replicationFactor,
      consistencyLevel: payload.consistencyLevel ?? "strong",
      consensusConfig: consensusConfig[payload.consensusAlgorithm] ?? {},
      configOverrides: {
        "consensus-algorithm": payload.consensusAlgorithm,
        "replication-factor": replicationFactor,
        "consistency-level": payload.consistencyLevel ?? "strong",
      },
    },
  };
}

export function handleNetworkingBridge(
  payload: NetworkingToSystem,
): BridgeHandlerResult {
  // Map protocol to edge type
  const protocolToEdgeType: Record<string, string> = {
    http: "http",
    grpc: "grpc",
    websocket: "websocket",
    graphql: "http",
  };

  return {
    success: true,
    action: "configure-network-layer",
    details: {
      protocol: payload.protocol,
      edgeType: protocolToEdgeType[payload.protocol] ?? "http",
      tlsEnabled: payload.tlsEnabled ?? false,
      compressionEnabled: payload.compressionEnabled ?? false,
      keepAlive: payload.keepAlive ?? true,
      configOverrides: {
        protocol: payload.protocol,
        tls: payload.tlsEnabled ?? false,
        compression: payload.compressionEnabled ?? false,
      },
    },
  };
}

export function handleConcurrencyBridge(
  payload: ConcurrencyToSystem,
): BridgeHandlerResult {
  // Map thread model to connection pool config
  const poolDefaults: Record<string, { poolSize: number; maxConnections: number }> = {
    "thread-pool": { poolSize: 100, maxConnections: 500 },
    "event-loop": { poolSize: 1, maxConnections: 10_000 },
    actor: { poolSize: 50, maxConnections: 2_000 },
    coroutine: { poolSize: 10, maxConnections: 5_000 },
  };

  const defaults = poolDefaults[payload.threadModel] ?? poolDefaults["thread-pool"];

  return {
    success: true,
    action: "configure-connection-pool",
    details: {
      threadModel: payload.threadModel,
      poolSize: payload.poolSize ?? defaults.poolSize,
      maxConnections: payload.maxConnections ?? defaults.maxConnections,
      backpressureStrategy: payload.backpressureStrategy ?? "buffer",
      configOverrides: {
        "thread-model": payload.threadModel,
        "pool-size": payload.poolSize ?? defaults.poolSize,
        "max-connections": payload.maxConnections ?? defaults.maxConnections,
      },
    },
  };
}

export function handleLLDBridge(
  payload: LLDToSystem,
): BridgeHandlerResult {
  return {
    success: true,
    action: "scaffold-microservice",
    details: {
      patternId: payload.patternId,
      patternName: payload.patternName,
      serviceCount: payload.serviceCount,
      communicationStyle: payload.communicationStyle,
      configOverrides: {
        pattern: payload.patternId,
        "service-count": payload.serviceCount,
        "communication-style": payload.communicationStyle,
      },
    },
  };
}

export function handleSecurityBridge(
  payload: SecurityToSystem,
): BridgeHandlerResult {
  return {
    success: true,
    action: "enable-security-features",
    details: {
      authMechanism: payload.authMechanism,
      encryptionAtRest: payload.encryptionAtRest ?? false,
      encryptionInTransit: payload.encryptionInTransit ?? true,
      rateLimitRps: payload.rateLimitRps ?? 1000,
      configOverrides: {
        "auth-mechanism": payload.authMechanism,
        "encryption-at-rest": payload.encryptionAtRest ?? false,
        "encryption-in-transit": payload.encryptionInTransit ?? true,
        "rate-limit-rps": payload.rateLimitRps ?? 1000,
      },
    },
  };
}

export function handleInterviewSimulate(
  payload: InterviewSimulate,
): BridgeHandlerResult {
  return {
    success: true,
    action: "run-interview-simulation",
    details: {
      challengeId: payload.challengeId,
      canvasNodes: payload.canvasNodes,
      canvasEdges: payload.canvasEdges,
      tickCount: payload.tickCount ?? 600,
    },
  };
}

export function handleKnowledgeGraph(
  payload: KnowledgeGraphOpenConcept,
): BridgeHandlerResult {
  return {
    success: true,
    action: "navigate-to-concept",
    details: {
      conceptId: payload.conceptId,
      conceptName: payload.conceptName,
      targetModule: payload.targetModule,
      targetPath: payload.targetPath ?? `/${payload.targetModule}`,
    },
  };
}

// ── Dispatcher ────────────────────────────────────────────────

/**
 * Routes a bridge payload to the correct handler.
 * Returns a result describing the action to take.
 */
export function dispatchBridge(payload: BridgePayload): BridgeHandlerResult {
  switch (payload.type) {
    case "algorithm-to-system":
      return handleAlgorithmBridge(payload);
    case "data-structure-to-system":
      return handleDataStructureBridge(payload);
    case "database-to-system":
      return handleDatabaseBridge(payload);
    case "distributed-to-system":
      return handleDistributedBridge(payload);
    case "networking-to-system":
      return handleNetworkingBridge(payload);
    case "concurrency-to-system":
      return handleConcurrencyBridge(payload);
    case "lld-to-system":
      return handleLLDBridge(payload);
    case "security-to-system":
      return handleSecurityBridge(payload);
    case "interview-simulate":
      return handleInterviewSimulate(payload);
    case "knowledge-graph-open-concept":
      return handleKnowledgeGraph(payload);
    default: {
      const _exhaustive: never = payload;
      return {
        success: false,
        action: "unknown",
        details: {},
        error: `Unknown bridge payload type: ${(_exhaustive as BridgePayload).type}`,
      };
    }
  }
}
