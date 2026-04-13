// ─────────────────────────────────────────────────────────────
// Architex — Component Configuration Types
// ─────────────────────────────────────────────────────────────

/** Simulation behavior profile — maps a component to how it behaves in the queuing model. */
export type SimulatesAs =
  | 'web-server'
  | 'database-primary'
  | 'database-replica'
  | 'cache'
  | 'message-broker'
  | 'load-balancer'
  | 'cdn'
  | 'gateway'
  | 'worker'
  | 'scheduler'
  | 'stream-processor'
  | 'search-engine'
  | 'object-store'
  | 'dns'
  | 'waf'
  | 'monitoring'
  | 'service-mesh'
  | 'ledger'
  | 'fraud-detector'
  | 'llm-endpoint'
  | 'agent'
  | 'etl'
  | 'hsm';

/**
 * Unified configuration interface for all component types.
 * 45 properties covering identity, capacity, scaling, reliability,
 * data, network, cost, observability, and security.
 */
export interface ComponentConfig {
  // ── Identity (3) ──
  componentType: string;
  simulatesAs: SimulatesAs;
  displayName: string;

  // ── Capacity (7) ──
  maxRps: number;
  maxConcurrentConnections: number;
  maxQueueDepth: number;
  baseLatencyMs: number;
  cpuCores: number;
  memoryGb: number;
  storageGb: number;

  // ── Scaling (6) ──
  replicas: number;
  shards: number;
  autoScale: boolean;
  autoScaleMin: number;
  autoScaleMax: number;
  autoScaleTargetUtil: number;

  // ── Reliability (7) ──
  failoverEnabled: boolean;
  healthCheckIntervalMs: number;
  circuitBreakerEnabled: boolean;
  circuitBreakerThreshold: number;
  retryPolicy: 'none' | 'fixed' | 'exponential';
  retryMaxAttempts: number;
  timeoutMs: number;

  // ── Data (6) ──
  consistencyLevel: 'strong' | 'eventual' | 'causal';
  replicationFactor: number;
  writeRatio: number;
  readRatio: number;
  cacheTtlMs: number;
  cacheMaxEntries: number;

  // ── Network (5) ──
  protocol: 'http' | 'grpc' | 'tcp' | 'ws' | 'amqp' | 'custom';
  tlsEnabled: boolean;
  compressionEnabled: boolean;
  rateLimitRps: number;
  bandwidthMbps: number;

  // ── Cost (2) ──
  costPerHour: number;
  region: string;

  // ── Observability (3) ──
  metricsEnabled: boolean;
  tracingEnabled: boolean;
  loggingLevel: 'debug' | 'info' | 'warn' | 'error';

  // ── Security (3) ──
  authRequired: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
}

/** Descriptor for a single config field — used by the properties panel. */
export interface FieldDescriptor {
  key: keyof ComponentConfig;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'select';
  section: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  tooltip?: string;
}

/** Panel section definition for grouping fields. */
export interface PanelSection {
  id: string;
  label: string;
  description: string;
  fields: FieldDescriptor[];
}
