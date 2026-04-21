// ─────────────────────────────────────────────────────────────
// Architex — Cross-Module Bridge Types (CROSS-001)
// ─────────────────────────────────────────────────────────────

import type { ModuleType } from "@/stores/ui-store";

/**
 * All 13 learning modules in the platform.
 * Used for mastery tracking and bridge labeling.
 */
export const ALL_MODULES: ModuleType[] = [
  "system-design",
  "algorithms",
  "data-structures",
  "lld",
  "blueprint",
  "database",
  "distributed",
  "networking",
  "os",
  "concurrency",
  "security",
  "ml-design",
  "interview",
  "knowledge-graph",
] as const;

/** Human-readable labels for each module. */
export const MODULE_LABELS: Record<ModuleType, string> = {
  "system-design": "System Design",
  algorithms: "Algorithms",
  "data-structures": "Data Structures",
  lld: "Low-Level Design",
  blueprint: "Blueprint",
  database: "Database",
  distributed: "Distributed Systems",
  networking: "Networking",
  os: "OS Concepts",
  concurrency: "Concurrency",
  security: "Security",
  "ml-design": "ML System Design",
  interview: "Interview",
  "knowledge-graph": "Knowledge Graph",
};

/** Module accent colors for bridge UI. */
export const MODULE_COLORS: Record<ModuleType, string> = {
  "system-design": "#3B82F6",
  algorithms: "#06B6D4",
  "data-structures": "#14B8A6",
  lld: "#F59E0B",
  blueprint: "#6366F1",
  database: "#22C55E",
  distributed: "#A855F7",
  networking: "#EC4899",
  os: "#EF4444",
  concurrency: "#6366F1",
  security: "#F97316",
  "ml-design": "#8B5CF6",
  interview: "#10B981",
  "knowledge-graph": "#84CC16",
};

// ── Bridge Payload Types ──────────────────────────────────────

export interface AlgorithmToSystem {
  type: "algorithm-to-system";
  algorithmId: string;
  complexity: { time: string; space: string };
  targetTemplate?: string;
  targetNodeType?: string;
  processingTimeMs?: number;
}

export interface DataStructureToSystem {
  type: "data-structure-to-system";
  dataStructureId: string;
  category: string;
  memoryProfile: string;
  targetNodeType?: string;
}

export interface DatabaseToSystem {
  type: "database-to-system";
  entityCount: number;
  normalizationForm: "1NF" | "2NF" | "3NF" | "BCNF";
  indexStrategy?: string;
  estimatedRows?: number;
  shardCount?: number;
  replicaCount?: number;
}

export interface DistributedToSystem {
  type: "distributed-to-system";
  consensusAlgorithm: "raft" | "paxos" | "zab" | "pbft";
  shardingStrategy?: "consistent-hashing" | "range" | "hash";
  replicationFactor?: number;
  consistencyLevel?: "strong" | "eventual" | "causal";
}

export interface NetworkingToSystem {
  type: "networking-to-system";
  protocol: "http" | "grpc" | "websocket" | "graphql";
  tlsEnabled?: boolean;
  compressionEnabled?: boolean;
  keepAlive?: boolean;
}

export interface ConcurrencyToSystem {
  type: "concurrency-to-system";
  threadModel: "thread-pool" | "event-loop" | "actor" | "coroutine";
  poolSize?: number;
  maxConnections?: number;
  backpressureStrategy?: "drop" | "buffer" | "throttle";
}

export interface LLDToSystem {
  type: "lld-to-system";
  patternId: string;
  patternName: string;
  serviceCount: number;
  communicationStyle: "sync" | "async" | "event-driven";
}

export interface SecurityToSystem {
  type: "security-to-system";
  authMechanism: "jwt" | "oauth2" | "api-key" | "mtls" | "saml";
  encryptionAtRest?: boolean;
  encryptionInTransit?: boolean;
  rateLimitRps?: number;
}

export interface InterviewSimulate {
  type: "interview-simulate";
  challengeId: string;
  canvasNodes: number;
  canvasEdges: number;
  tickCount?: number;
}

export interface KnowledgeGraphOpenConcept {
  type: "knowledge-graph-open-concept";
  conceptId: string;
  conceptName: string;
  targetModule: ModuleType;
  targetPath?: string;
}

/**
 * Discriminated union of all cross-module bridge payloads.
 * Switch on `payload.type` for exhaustive narrowing.
 */
export type BridgePayload =
  | AlgorithmToSystem
  | DataStructureToSystem
  | DatabaseToSystem
  | DistributedToSystem
  | NetworkingToSystem
  | ConcurrencyToSystem
  | LLDToSystem
  | SecurityToSystem
  | InterviewSimulate
  | KnowledgeGraphOpenConcept;

// ── Bridge Link ───────────────────────────────────────────────

/** Describes a single navigable cross-module connection. */
export interface BridgeLink {
  id: string;
  sourceModule: ModuleType;
  targetModule: ModuleType;
  label: string;
  description: string;
  conceptId?: string;
  payloadFactory: () => BridgePayload;
}

// ── Cross-Module Context ──────────────────────────────────────

/** Context passed along when navigating between modules. */
export interface CrossModuleContext {
  sourceModule: ModuleType;
  targetModule: ModuleType;
  payload: BridgePayload;
  timestamp: string;
  breadcrumb: { module: ModuleType; label: string }[];
}

// ── Mastery Tracking ──────────────────────────────────────────

export interface ModuleMasteryEntry {
  theory: number;
  practice: number;
  lastUpdated: string;
}

export interface ConceptProgressEntry {
  completed: boolean;
  module: ModuleType;
  completedAt?: string;
}
