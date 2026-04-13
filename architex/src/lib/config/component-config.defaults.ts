// ─────────────────────────────────────────────────────────────
// Architex — Component Configuration Defaults
// ─────────────────────────────────────────────────────────────

import type { ComponentConfig, SimulatesAs } from './component-config.types';

// ── Global Defaults ────────────────────────────────────────────

/** Sensible defaults for every ComponentConfig field. */
export const GLOBAL_DEFAULTS: ComponentConfig = {
  // Identity
  componentType: 'unknown',
  simulatesAs: 'web-server',
  displayName: 'Component',

  // Capacity
  maxRps: 1000,
  maxConcurrentConnections: 1000,
  maxQueueDepth: 5000,
  baseLatencyMs: 10,
  cpuCores: 2,
  memoryGb: 4,
  storageGb: 50,

  // Scaling
  replicas: 1,
  shards: 1,
  autoScale: false,
  autoScaleMin: 1,
  autoScaleMax: 10,
  autoScaleTargetUtil: 0.7,

  // Reliability
  failoverEnabled: false,
  healthCheckIntervalMs: 10000,
  circuitBreakerEnabled: false,
  circuitBreakerThreshold: 5,
  retryPolicy: 'none',
  retryMaxAttempts: 3,
  timeoutMs: 30000,

  // Data
  consistencyLevel: 'eventual',
  replicationFactor: 1,
  writeRatio: 0.3,
  readRatio: 0.7,
  cacheTtlMs: 3600000,
  cacheMaxEntries: 100000,

  // Network
  protocol: 'http',
  tlsEnabled: true,
  compressionEnabled: false,
  rateLimitRps: 10000,
  bandwidthMbps: 1000,

  // Cost
  costPerHour: 0.10,
  region: 'us-east-1',

  // Observability
  metricsEnabled: true,
  tracingEnabled: false,
  loggingLevel: 'info',

  // Security
  authRequired: false,
  encryptionAtRest: false,
  encryptionInTransit: true,
};

// ── SimulatesAs Overrides ─────────────────────────────────────

/** Overrides applied based on the SimulatesAs profile. */
export const SIMULATES_AS_OVERRIDES: Record<SimulatesAs, Partial<ComponentConfig>> = {
  'web-server': {
    maxRps: 5000,
    baseLatencyMs: 5,
    protocol: 'http',
    cpuCores: 4,
    memoryGb: 8,
  },
  'database-primary': {
    maxRps: 3000,
    baseLatencyMs: 10,
    consistencyLevel: 'strong',
    failoverEnabled: true,
    replicationFactor: 3,
    storageGb: 500,
    encryptionAtRest: true,
  },
  'database-replica': {
    maxRps: 8000,
    baseLatencyMs: 5,
    consistencyLevel: 'eventual',
    replicationFactor: 3,
    storageGb: 500,
    writeRatio: 0,
    readRatio: 1,
  },
  cache: {
    maxRps: 50000,
    baseLatencyMs: 1,
    memoryGb: 16,
    storageGb: 0,
    cacheTtlMs: 3600000,
    cacheMaxEntries: 1000000,
  },
  'message-broker': {
    maxRps: 10000,
    baseLatencyMs: 5,
    protocol: 'amqp',
    maxQueueDepth: 100000,
    storageGb: 200,
  },
  'load-balancer': {
    maxRps: 100000,
    baseLatencyMs: 0.5,
    maxConcurrentConnections: 100000,
    healthCheckIntervalMs: 5000,
  },
  cdn: {
    maxRps: 500000,
    baseLatencyMs: 0.2,
    cacheTtlMs: 86400000,
    bandwidthMbps: 10000,
  },
  gateway: {
    maxRps: 20000,
    baseLatencyMs: 2,
    rateLimitRps: 10000,
    authRequired: true,
    circuitBreakerEnabled: true,
  },
  worker: {
    maxRps: 500,
    baseLatencyMs: 50,
    autoScale: true,
    autoScaleMin: 1,
    autoScaleMax: 20,
  },
  scheduler: {
    maxRps: 50,
    baseLatencyMs: 100,
    retryPolicy: 'exponential',
    retryMaxAttempts: 5,
  },
  'stream-processor': {
    maxRps: 10000,
    baseLatencyMs: 10,
    autoScale: true,
    protocol: 'grpc',
  },
  'search-engine': {
    maxRps: 2000,
    baseLatencyMs: 15,
    storageGb: 200,
    memoryGb: 16,
  },
  'object-store': {
    maxRps: 5000,
    baseLatencyMs: 20,
    storageGb: 10000,
    bandwidthMbps: 5000,
  },
  dns: {
    maxRps: 50000,
    baseLatencyMs: 1,
    cacheTtlMs: 300000,
  },
  waf: {
    maxRps: 100000,
    baseLatencyMs: 0.1,
    rateLimitRps: 100000,
  },
  monitoring: {
    maxRps: 10000,
    baseLatencyMs: 5,
    storageGb: 500,
    tracingEnabled: true,
    metricsEnabled: true,
  },
  'service-mesh': {
    maxRps: 50000,
    baseLatencyMs: 1,
    tlsEnabled: true,
    tracingEnabled: true,
    circuitBreakerEnabled: true,
  },
  ledger: {
    maxRps: 500,
    baseLatencyMs: 20,
    consistencyLevel: 'strong',
    encryptionAtRest: true,
    encryptionInTransit: true,
  },
  'fraud-detector': {
    maxRps: 300,
    baseLatencyMs: 50,
    cpuCores: 8,
    memoryGb: 32,
  },
  'llm-endpoint': {
    maxRps: 20,
    baseLatencyMs: 500,
    cpuCores: 8,
    memoryGb: 64,
    costPerHour: 1.50,
    timeoutMs: 120000,
  },
  agent: {
    maxRps: 100,
    baseLatencyMs: 200,
    autoScale: true,
    autoScaleMax: 50,
    timeoutMs: 120000,
    costPerHour: 2.00,
  },
  etl: {
    maxRps: 100,
    baseLatencyMs: 5000,
    autoScale: true,
    cpuCores: 8,
    memoryGb: 32,
  },
  hsm: {
    maxRps: 50,
    baseLatencyMs: 10,
    encryptionAtRest: true,
    encryptionInTransit: true,
    authRequired: true,
  },
};

// ── Per-Component-Type Defaults ───────────────────────────────

/** Per-component-type overrides — keys match PaletteItem.type values. */
export const COMPONENT_TYPE_DEFAULTS: Record<string, Partial<ComponentConfig>> = {
  // ── Compute ──
  'web-server':   { simulatesAs: 'web-server', displayName: 'Web Server', maxRps: 5000, baseLatencyMs: 5, cpuCores: 4, memoryGb: 8 },
  'app-server':   { simulatesAs: 'web-server', displayName: 'Application Server', maxRps: 3000, baseLatencyMs: 20, cpuCores: 4, memoryGb: 16 },
  serverless:     { simulatesAs: 'web-server', displayName: 'Serverless Function', maxRps: 1000, baseLatencyMs: 10, memoryGb: 0.5, costPerHour: 0.002 },
  worker:         { simulatesAs: 'worker', displayName: 'Worker Service', maxRps: 500, baseLatencyMs: 50, autoScale: true },

  // ── Load Balancing ──
  'load-balancer': { simulatesAs: 'load-balancer', displayName: 'Load Balancer (L7)', maxRps: 100000, baseLatencyMs: 0.5 },
  'api-gateway':   { simulatesAs: 'gateway', displayName: 'API Gateway', maxRps: 20000, baseLatencyMs: 2, authRequired: true },
  'reverse-proxy': { simulatesAs: 'cdn', displayName: 'CDN / Reverse Proxy', maxRps: 500000, baseLatencyMs: 0.2 },

  // ── Data Storage ──
  database:        { simulatesAs: 'database-primary', displayName: 'Relational DB (SQL)', maxRps: 3000, baseLatencyMs: 10, consistencyLevel: 'strong', storageGb: 500 },
  'document-db':   { simulatesAs: 'database-primary', displayName: 'Document DB (NoSQL)', maxRps: 5000, baseLatencyMs: 8, consistencyLevel: 'eventual', storageGb: 200 },
  cache:           { simulatesAs: 'cache', displayName: 'Cache (Redis)', maxRps: 50000, baseLatencyMs: 1, memoryGb: 16 },
  'wide-column':   { simulatesAs: 'database-primary', displayName: 'Wide-Column (Cassandra)', maxRps: 10000, baseLatencyMs: 5, consistencyLevel: 'eventual' },
  'search-engine': { simulatesAs: 'search-engine', displayName: 'Search Engine', maxRps: 2000, baseLatencyMs: 15 },
  'object-storage':{ simulatesAs: 'object-store', displayName: 'Object Storage (S3)', maxRps: 5000, baseLatencyMs: 20, storageGb: 10000 },
  'graph-db':      { simulatesAs: 'database-primary', displayName: 'Graph DB (Neo4j)', maxRps: 1000, baseLatencyMs: 20 },
  'timeseries-db': { simulatesAs: 'database-primary', displayName: 'Time-Series DB', maxRps: 5000, baseLatencyMs: 5 },

  // ── Messaging ──
  'message-queue': { simulatesAs: 'message-broker', displayName: 'Message Queue', maxRps: 10000, baseLatencyMs: 5 },
  'pub-sub':       { simulatesAs: 'message-broker', displayName: 'Pub/Sub', maxRps: 20000, baseLatencyMs: 3 },
  'event-bus':     { simulatesAs: 'message-broker', displayName: 'Event Bus', maxRps: 15000, baseLatencyMs: 4 },

  // ── Networking ──
  dns:             { simulatesAs: 'dns', displayName: 'DNS', maxRps: 50000, baseLatencyMs: 1 },
  'cdn-edge':      { simulatesAs: 'cdn', displayName: 'CDN Edge Node', maxRps: 500000, baseLatencyMs: 0.2 },
  firewall:        { simulatesAs: 'waf', displayName: 'Firewall / WAF', maxRps: 100000, baseLatencyMs: 0.1 },
  vpc:             { simulatesAs: 'gateway', displayName: 'VPC', maxRps: 100000, baseLatencyMs: 0.1 },
  subnet:          { simulatesAs: 'gateway', displayName: 'Subnet', maxRps: 100000, baseLatencyMs: 0.1 },
  'nat-gateway':   { simulatesAs: 'gateway', displayName: 'NAT Gateway', maxRps: 10000, baseLatencyMs: 1 },
  'vpn-gateway':   { simulatesAs: 'gateway', displayName: 'VPN Gateway', maxRps: 5000, baseLatencyMs: 5, encryptionInTransit: true },
  'service-mesh':  { simulatesAs: 'service-mesh', displayName: 'Service Mesh', maxRps: 50000, baseLatencyMs: 1, tlsEnabled: true },
  'dns-server':    { simulatesAs: 'dns', displayName: 'DNS Server', maxRps: 50000, baseLatencyMs: 1 },
  'ingress-controller': { simulatesAs: 'load-balancer', displayName: 'Ingress Controller', maxRps: 20000, baseLatencyMs: 1 },

  // ── Processing ──
  'batch-processor':  { simulatesAs: 'worker', displayName: 'Batch Processor', maxRps: 100, baseLatencyMs: 500 },
  'stream-processor': { simulatesAs: 'stream-processor', displayName: 'Stream Processor', maxRps: 10000, baseLatencyMs: 10, autoScale: true },
  'ml-inference':     { simulatesAs: 'llm-endpoint', displayName: 'ML Inference Service', maxRps: 100, baseLatencyMs: 100, cpuCores: 8, memoryGb: 32 },

  // ── Client / External ──
  'web-client':     { simulatesAs: 'web-server', displayName: 'Web Client (Browser)', maxRps: 100, baseLatencyMs: 1 },
  'mobile-client':  { simulatesAs: 'web-server', displayName: 'Mobile Client', maxRps: 50, baseLatencyMs: 1 },
  'third-party-api':{ simulatesAs: 'web-server', displayName: 'Third-Party API', maxRps: 100, baseLatencyMs: 200, timeoutMs: 10000 },

  // ── Observability ──
  'metrics-collector': { simulatesAs: 'monitoring', displayName: 'Metrics (Prometheus)', maxRps: 10000, baseLatencyMs: 5, metricsEnabled: true },
  'log-aggregator':    { simulatesAs: 'monitoring', displayName: 'Log Aggregator (ELK)', maxRps: 5000, baseLatencyMs: 10, storageGb: 1000 },
  tracer:              { simulatesAs: 'monitoring', displayName: 'Distributed Tracer', maxRps: 5000, baseLatencyMs: 5, tracingEnabled: true },

  // ── Security ──
  'auth-service':    { simulatesAs: 'web-server', displayName: 'Auth Service', maxRps: 1000, baseLatencyMs: 5, authRequired: true },
  'rate-limiter':    { simulatesAs: 'waf', displayName: 'Rate Limiter', maxRps: 100000, baseLatencyMs: 0.1 },
  'secret-manager':  { simulatesAs: 'hsm', displayName: 'Secret Manager', maxRps: 100, baseLatencyMs: 5, encryptionAtRest: true },
  'ddos-shield':     { simulatesAs: 'waf', displayName: 'DDoS Shield', maxRps: 100000, baseLatencyMs: 0.1, rateLimitRps: 100000 },
  siem:              { simulatesAs: 'monitoring', displayName: 'SIEM', maxRps: 10000, baseLatencyMs: 5, storageGb: 500 },

  // ── Services ──
  'notification-service': { simulatesAs: 'worker', displayName: 'Notification Service', maxRps: 500, baseLatencyMs: 50 },
  'search-service':       { simulatesAs: 'search-engine', displayName: 'Search Service', maxRps: 200, baseLatencyMs: 15 },
  'analytics-service':    { simulatesAs: 'stream-processor', displayName: 'Analytics Service', maxRps: 1000, baseLatencyMs: 10 },
  scheduler:              { simulatesAs: 'scheduler', displayName: 'Scheduler', maxRps: 50, baseLatencyMs: 100 },
  'service-discovery':    { simulatesAs: 'dns', displayName: 'Service Discovery', maxRps: 5000, baseLatencyMs: 1 },
  'config-service':       { simulatesAs: 'web-server', displayName: 'Config Service', maxRps: 2000, baseLatencyMs: 5 },
  'secrets-manager-v2':   { simulatesAs: 'hsm', displayName: 'Secrets Manager v2', maxRps: 100, baseLatencyMs: 10, encryptionAtRest: true },
  'feature-flags':        { simulatesAs: 'web-server', displayName: 'Feature Flags', maxRps: 10000, baseLatencyMs: 1 },
  'auth-service-v2':      { simulatesAs: 'web-server', displayName: 'Auth Service v2', maxRps: 1000, baseLatencyMs: 5, authRequired: true },

  // ── FinTech ──
  'payment-gateway':  { simulatesAs: 'ledger', displayName: 'Payment Gateway', maxRps: 200, baseLatencyMs: 200, encryptionInTransit: true, consistencyLevel: 'strong' },
  'ledger-service':   { simulatesAs: 'ledger', displayName: 'Ledger Service', maxRps: 500, baseLatencyMs: 20, consistencyLevel: 'strong', encryptionAtRest: true },
  'fraud-detection':  { simulatesAs: 'fraud-detector', displayName: 'Fraud Detection', maxRps: 300, baseLatencyMs: 50, cpuCores: 8 },
  hsm:                { simulatesAs: 'hsm', displayName: 'HSM', maxRps: 50, baseLatencyMs: 10, encryptionAtRest: true, encryptionInTransit: true },

  // ── Data Engineering ──
  'etl-pipeline':     { simulatesAs: 'etl', displayName: 'ETL Pipeline', maxRps: 100, baseLatencyMs: 5000, autoScale: true, cpuCores: 8 },
  'cdc-service':      { simulatesAs: 'stream-processor', displayName: 'CDC Service', maxRps: 5000, baseLatencyMs: 10 },
  'schema-registry':  { simulatesAs: 'web-server', displayName: 'Schema Registry', maxRps: 10000, baseLatencyMs: 2 },
  'feature-store':    { simulatesAs: 'cache', displayName: 'Feature Store', maxRps: 5000, baseLatencyMs: 5, memoryGb: 32 },
  'media-processor':  { simulatesAs: 'worker', displayName: 'Media Processor', maxRps: 50, baseLatencyMs: 2000, cpuCores: 8, memoryGb: 32 },

  // ── AI / LLM ──
  'llm-gateway':         { simulatesAs: 'llm-endpoint', displayName: 'LLM Gateway', maxRps: 20, baseLatencyMs: 500, costPerHour: 1.50, cpuCores: 8, memoryGb: 64 },
  'tool-registry':       { simulatesAs: 'web-server', displayName: 'Tool Registry', maxRps: 5000, baseLatencyMs: 2 },
  'memory-fabric':       { simulatesAs: 'cache', displayName: 'Memory Fabric', maxRps: 10000, baseLatencyMs: 5, memoryGb: 64 },
  'agent-orchestrator':  { simulatesAs: 'agent', displayName: 'Agent Orchestrator', maxRps: 100, baseLatencyMs: 200, autoScale: true, costPerHour: 2.00 },
  'safety-mesh':         { simulatesAs: 'waf', displayName: 'Safety Mesh', maxRps: 5000, baseLatencyMs: 10 },

  // ── DB Internals ──
  'shard-node':       { simulatesAs: 'database-primary', displayName: 'Shard Node', maxRps: 5000, baseLatencyMs: 8, storageGb: 500 },
  'primary-node':     { simulatesAs: 'database-primary', displayName: 'Primary Node', maxRps: 3000, baseLatencyMs: 10, consistencyLevel: 'strong', failoverEnabled: true },
  'partition-node':   { simulatesAs: 'message-broker', displayName: 'Partition Node', maxRps: 10000, baseLatencyMs: 5 },
  'replica-node':     { simulatesAs: 'database-replica', displayName: 'Replica Node', maxRps: 8000, baseLatencyMs: 5, writeRatio: 0, readRatio: 1 },
  'input-node':       { simulatesAs: 'stream-processor', displayName: 'Input Node', maxRps: 5000, baseLatencyMs: 5 },
  'output-node':      { simulatesAs: 'worker', displayName: 'Output Node', maxRps: 2000, baseLatencyMs: 20 },
  'coordinator-node': { simulatesAs: 'scheduler', displayName: 'Coordinator Node', maxRps: 1000, baseLatencyMs: 10 },
};

// ── Config Resolution ─────────────────────────────────────────

/**
 * Resolve the effective ComponentConfig for a given component type.
 *
 * Merge order (later wins):
 *   1. GLOBAL_DEFAULTS
 *   2. COMPONENT_TYPE_DEFAULTS[componentType]
 *   3. SIMULATES_AS_OVERRIDES[simulatesAs] (only for fields not set by type)
 *   4. userOverrides
 */
export function resolveConfig(
  componentType: string,
  userOverrides?: Partial<ComponentConfig>,
): ComponentConfig {
  const typeDefaults = COMPONENT_TYPE_DEFAULTS[componentType] ?? {};
  const simulatesAs = userOverrides?.simulatesAs ?? typeDefaults.simulatesAs ?? GLOBAL_DEFAULTS.simulatesAs;
  const simOverrides = SIMULATES_AS_OVERRIDES[simulatesAs] ?? {};

  return {
    ...GLOBAL_DEFAULTS,
    ...simOverrides,
    ...typeDefaults,
    ...userOverrides,
    componentType,
    simulatesAs,
  };
}
