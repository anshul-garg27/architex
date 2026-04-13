// ─────────────────────────────────────────────────────────────
// Architex — Properties Panel Manifest
// ─────────────────────────────────────────────────────────────

import type { ComponentConfig, FieldDescriptor, PanelSection } from './component-config.types';

// ── All 45 Field Descriptors ──────────────────────────────────

export const ALL_FIELDS: FieldDescriptor[] = [
  // Identity (3)
  { key: 'componentType', label: 'Component Type', type: 'string', section: 'identity', tooltip: 'Internal type identifier' },
  { key: 'simulatesAs', label: 'Simulates As', type: 'select', section: 'identity', options: ['web-server', 'database-primary', 'database-replica', 'cache', 'message-broker', 'load-balancer', 'cdn', 'gateway', 'worker', 'scheduler', 'stream-processor', 'search-engine', 'object-store', 'dns', 'waf', 'monitoring', 'service-mesh', 'ledger', 'fraud-detector', 'llm-endpoint', 'agent', 'etl', 'hsm'], tooltip: 'Simulation behavior profile' },
  { key: 'displayName', label: 'Display Name', type: 'string', section: 'identity', tooltip: 'Name shown on the canvas' },

  // Capacity (7)
  { key: 'maxRps', label: 'Max RPS', type: 'number', section: 'capacity', min: 1, max: 1000000, step: 100, unit: 'req/s', tooltip: 'Maximum requests per second' },
  { key: 'maxConcurrentConnections', label: 'Max Connections', type: 'number', section: 'capacity', min: 1, max: 1000000, step: 100, tooltip: 'Maximum concurrent connections' },
  { key: 'maxQueueDepth', label: 'Max Queue Depth', type: 'number', section: 'capacity', min: 0, max: 1000000, step: 1000, tooltip: 'Maximum queued requests before rejection' },
  { key: 'baseLatencyMs', label: 'Base Latency', type: 'number', section: 'capacity', min: 0, max: 60000, step: 1, unit: 'ms', tooltip: 'Processing time per request under no load' },
  { key: 'cpuCores', label: 'CPU Cores', type: 'number', section: 'capacity', min: 0.25, max: 128, step: 0.25, unit: 'vCPU', tooltip: 'Virtual CPU cores allocated' },
  { key: 'memoryGb', label: 'Memory', type: 'number', section: 'capacity', min: 0.25, max: 1024, step: 0.25, unit: 'GB', tooltip: 'RAM allocated' },
  { key: 'storageGb', label: 'Storage', type: 'number', section: 'capacity', min: 0, max: 100000, step: 10, unit: 'GB', tooltip: 'Disk storage allocated' },

  // Scaling (6)
  { key: 'replicas', label: 'Replicas', type: 'number', section: 'scaling', min: 1, max: 100, step: 1, tooltip: 'Number of instances' },
  { key: 'shards', label: 'Shards', type: 'number', section: 'scaling', min: 1, max: 1000, step: 1, tooltip: 'Number of data shards' },
  { key: 'autoScale', label: 'Auto-Scale', type: 'boolean', section: 'scaling', tooltip: 'Enable horizontal auto-scaling' },
  { key: 'autoScaleMin', label: 'Auto-Scale Min', type: 'number', section: 'scaling', min: 1, max: 100, step: 1, tooltip: 'Minimum instances during auto-scale' },
  { key: 'autoScaleMax', label: 'Auto-Scale Max', type: 'number', section: 'scaling', min: 1, max: 1000, step: 1, tooltip: 'Maximum instances during auto-scale' },
  { key: 'autoScaleTargetUtil', label: 'Scale Target Util', type: 'number', section: 'scaling', min: 0.1, max: 1, step: 0.05, unit: '%', tooltip: 'Target utilization for auto-scaling' },

  // Reliability (7)
  { key: 'failoverEnabled', label: 'Failover', type: 'boolean', section: 'reliability', tooltip: 'Enable automatic failover' },
  { key: 'healthCheckIntervalMs', label: 'Health Check Interval', type: 'number', section: 'reliability', min: 1000, max: 300000, step: 1000, unit: 'ms', tooltip: 'Time between health checks' },
  { key: 'circuitBreakerEnabled', label: 'Circuit Breaker', type: 'boolean', section: 'reliability', tooltip: 'Enable circuit breaker pattern' },
  { key: 'circuitBreakerThreshold', label: 'CB Threshold', type: 'number', section: 'reliability', min: 1, max: 100, step: 1, tooltip: 'Consecutive failures before circuit opens' },
  { key: 'retryPolicy', label: 'Retry Policy', type: 'select', section: 'reliability', options: ['none', 'fixed', 'exponential'], tooltip: 'Retry strategy on failure' },
  { key: 'retryMaxAttempts', label: 'Max Retries', type: 'number', section: 'reliability', min: 0, max: 20, step: 1, tooltip: 'Maximum retry attempts' },
  { key: 'timeoutMs', label: 'Timeout', type: 'number', section: 'reliability', min: 100, max: 600000, step: 100, unit: 'ms', tooltip: 'Request timeout' },

  // Data (6)
  { key: 'consistencyLevel', label: 'Consistency', type: 'select', section: 'data', options: ['strong', 'eventual', 'causal'], tooltip: 'Data consistency guarantee' },
  { key: 'replicationFactor', label: 'Replication Factor', type: 'number', section: 'data', min: 1, max: 10, step: 1, tooltip: 'Number of data replicas' },
  { key: 'writeRatio', label: 'Write Ratio', type: 'number', section: 'data', min: 0, max: 1, step: 0.1, tooltip: 'Fraction of traffic that is writes' },
  { key: 'readRatio', label: 'Read Ratio', type: 'number', section: 'data', min: 0, max: 1, step: 0.1, tooltip: 'Fraction of traffic that is reads' },
  { key: 'cacheTtlMs', label: 'Cache TTL', type: 'number', section: 'data', min: 0, max: 86400000, step: 60000, unit: 'ms', tooltip: 'Cache entry time-to-live' },
  { key: 'cacheMaxEntries', label: 'Cache Max Entries', type: 'number', section: 'data', min: 0, max: 10000000, step: 10000, tooltip: 'Maximum cached entries' },

  // Network (5)
  { key: 'protocol', label: 'Protocol', type: 'select', section: 'network', options: ['http', 'grpc', 'tcp', 'ws', 'amqp', 'custom'], tooltip: 'Network protocol' },
  { key: 'tlsEnabled', label: 'TLS', type: 'boolean', section: 'network', tooltip: 'Enable TLS encryption' },
  { key: 'compressionEnabled', label: 'Compression', type: 'boolean', section: 'network', tooltip: 'Enable response compression' },
  { key: 'rateLimitRps', label: 'Rate Limit', type: 'number', section: 'network', min: 0, max: 1000000, step: 100, unit: 'req/s', tooltip: 'Inbound rate limit' },
  { key: 'bandwidthMbps', label: 'Bandwidth', type: 'number', section: 'network', min: 10, max: 100000, step: 100, unit: 'Mbps', tooltip: 'Network bandwidth' },

  // Cost (2)
  { key: 'costPerHour', label: 'Cost/Hour', type: 'number', section: 'cost', min: 0, max: 100, step: 0.01, unit: '$/hr', tooltip: 'Hourly infrastructure cost' },
  { key: 'region', label: 'Region', type: 'select', section: 'cost', options: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1', 'ap-southeast-1', 'ap-northeast-1'], tooltip: 'Cloud region' },

  // Observability (3)
  { key: 'metricsEnabled', label: 'Metrics', type: 'boolean', section: 'observability', tooltip: 'Enable metrics export' },
  { key: 'tracingEnabled', label: 'Tracing', type: 'boolean', section: 'observability', tooltip: 'Enable distributed tracing' },
  { key: 'loggingLevel', label: 'Log Level', type: 'select', section: 'observability', options: ['debug', 'info', 'warn', 'error'], tooltip: 'Minimum log level' },

  // Security (3)
  { key: 'authRequired', label: 'Auth Required', type: 'boolean', section: 'security', tooltip: 'Require authentication' },
  { key: 'encryptionAtRest', label: 'Encryption at Rest', type: 'boolean', section: 'security', tooltip: 'Encrypt stored data' },
  { key: 'encryptionInTransit', label: 'Encryption in Transit', type: 'boolean', section: 'security', tooltip: 'Encrypt network traffic' },
];

// ── Panel Sections (12) ───────────────────────────────────────

const SECTION_DEFS: { id: string; label: string; description: string }[] = [
  { id: 'identity', label: 'Identity', description: 'Component type and simulation profile' },
  { id: 'capacity', label: 'Capacity', description: 'Resource limits and baseline performance' },
  { id: 'scaling', label: 'Scaling', description: 'Horizontal and auto-scaling settings' },
  { id: 'reliability', label: 'Reliability', description: 'Failover, circuit breakers, retries' },
  { id: 'data', label: 'Data', description: 'Consistency, replication, caching' },
  { id: 'network', label: 'Network', description: 'Protocol, TLS, rate limiting' },
  { id: 'cost', label: 'Cost', description: 'Pricing and region' },
  { id: 'observability', label: 'Observability', description: 'Metrics, tracing, logging' },
  { id: 'security', label: 'Security', description: 'Auth, encryption settings' },
  { id: 'simulation', label: 'Simulation', description: 'Runtime simulation overrides' },
  { id: 'advanced', label: 'Advanced', description: 'Advanced configuration' },
  { id: 'custom', label: 'Custom', description: 'Component-specific settings' },
];

/** Pre-built sections with their fields assigned. */
export const PANEL_SECTIONS: PanelSection[] = SECTION_DEFS.map((def) => ({
  ...def,
  fields: ALL_FIELDS.filter((f) => f.section === def.id),
}));

// ── Visible Sections per Component Type ───────────────────────

/** Which panel sections to show for each component type. */
export const VISIBLE_SECTIONS: Record<string, string[]> = {
  // Compute
  'web-server':   ['identity', 'capacity', 'scaling', 'reliability', 'network', 'cost', 'observability'],
  'app-server':   ['identity', 'capacity', 'scaling', 'reliability', 'network', 'cost', 'observability'],
  serverless:     ['identity', 'capacity', 'scaling', 'cost', 'observability'],
  worker:         ['identity', 'capacity', 'scaling', 'reliability', 'cost'],

  // Load Balancing
  'load-balancer': ['identity', 'capacity', 'reliability', 'network'],
  'api-gateway':   ['identity', 'capacity', 'reliability', 'network', 'security'],
  'reverse-proxy': ['identity', 'capacity', 'network', 'cost'],

  // Storage
  database:        ['identity', 'capacity', 'scaling', 'reliability', 'data', 'cost', 'security'],
  'document-db':   ['identity', 'capacity', 'scaling', 'data', 'cost', 'security'],
  cache:           ['identity', 'capacity', 'scaling', 'data', 'cost'],
  'wide-column':   ['identity', 'capacity', 'scaling', 'data', 'cost'],
  'search-engine': ['identity', 'capacity', 'scaling', 'data'],
  'object-storage':['identity', 'capacity', 'data', 'cost', 'security'],
  'graph-db':      ['identity', 'capacity', 'scaling', 'data'],
  'timeseries-db': ['identity', 'capacity', 'scaling', 'data'],

  // Messaging
  'message-queue': ['identity', 'capacity', 'scaling', 'reliability', 'data'],
  'pub-sub':       ['identity', 'capacity', 'scaling', 'reliability'],
  'event-bus':     ['identity', 'capacity', 'scaling', 'reliability'],

  // Networking
  dns:             ['identity', 'capacity', 'data'],
  'cdn-edge':      ['identity', 'capacity', 'network', 'cost'],
  firewall:        ['identity', 'capacity', 'network', 'security'],
  vpc:             ['identity', 'capacity', 'network', 'security'],
  subnet:          ['identity', 'capacity', 'network'],
  'nat-gateway':   ['identity', 'capacity', 'network', 'cost'],
  'vpn-gateway':   ['identity', 'capacity', 'network', 'security', 'cost'],
  'service-mesh':  ['identity', 'capacity', 'reliability', 'network', 'observability', 'security'],
  'dns-server':    ['identity', 'capacity', 'data'],
  'ingress-controller': ['identity', 'capacity', 'reliability', 'network'],

  // Processing
  'batch-processor':  ['identity', 'capacity', 'scaling', 'reliability', 'cost'],
  'stream-processor': ['identity', 'capacity', 'scaling', 'reliability', 'cost'],
  'ml-inference':     ['identity', 'capacity', 'scaling', 'cost', 'observability'],

  // Client
  'web-client':     ['identity', 'capacity'],
  'mobile-client':  ['identity', 'capacity'],
  'third-party-api':['identity', 'capacity', 'reliability', 'network'],

  // Observability
  'metrics-collector': ['identity', 'capacity', 'data', 'observability'],
  'log-aggregator':    ['identity', 'capacity', 'data', 'cost', 'observability'],
  tracer:              ['identity', 'capacity', 'observability'],

  // Security
  'auth-service':    ['identity', 'capacity', 'reliability', 'security'],
  'rate-limiter':    ['identity', 'capacity', 'network'],
  'secret-manager':  ['identity', 'capacity', 'security'],
  'ddos-shield':     ['identity', 'capacity', 'network', 'security'],
  siem:              ['identity', 'capacity', 'data', 'security', 'observability'],

  // Services
  'notification-service': ['identity', 'capacity', 'scaling', 'reliability', 'cost'],
  'search-service':       ['identity', 'capacity', 'scaling', 'data'],
  'analytics-service':    ['identity', 'capacity', 'scaling', 'data', 'cost'],
  scheduler:              ['identity', 'capacity', 'reliability'],
  'service-discovery':    ['identity', 'capacity', 'reliability', 'data'],
  'config-service':       ['identity', 'capacity', 'data'],
  'secrets-manager-v2':   ['identity', 'capacity', 'security'],
  'feature-flags':        ['identity', 'capacity', 'data'],
  'auth-service-v2':      ['identity', 'capacity', 'reliability', 'security'],

  // FinTech
  'payment-gateway':  ['identity', 'capacity', 'reliability', 'data', 'security', 'cost'],
  'ledger-service':   ['identity', 'capacity', 'reliability', 'data', 'security', 'cost'],
  'fraud-detection':  ['identity', 'capacity', 'reliability', 'cost'],
  hsm:                ['identity', 'capacity', 'security', 'cost'],

  // Data Engineering
  'etl-pipeline':     ['identity', 'capacity', 'scaling', 'reliability', 'cost'],
  'cdc-service':      ['identity', 'capacity', 'scaling', 'data'],
  'schema-registry':  ['identity', 'capacity', 'data'],
  'feature-store':    ['identity', 'capacity', 'scaling', 'data', 'cost'],
  'media-processor':  ['identity', 'capacity', 'scaling', 'cost'],

  // AI / LLM
  'llm-gateway':         ['identity', 'capacity', 'scaling', 'reliability', 'network', 'cost', 'security'],
  'tool-registry':       ['identity', 'capacity', 'data'],
  'memory-fabric':       ['identity', 'capacity', 'scaling', 'data', 'cost'],
  'agent-orchestrator':  ['identity', 'capacity', 'scaling', 'reliability', 'cost'],
  'safety-mesh':         ['identity', 'capacity', 'network', 'security'],

  // DB Internals
  'shard-node':       ['identity', 'capacity', 'scaling', 'data'],
  'primary-node':     ['identity', 'capacity', 'reliability', 'data'],
  'partition-node':   ['identity', 'capacity', 'scaling', 'data'],
  'replica-node':     ['identity', 'capacity', 'data'],
  'input-node':       ['identity', 'capacity', 'scaling'],
  'output-node':      ['identity', 'capacity', 'scaling'],
  'coordinator-node': ['identity', 'capacity', 'reliability'],
};

// ── Section Resolver ──────────────────────────────────────────

const DEFAULT_SECTIONS = ['identity', 'capacity', 'scaling', 'reliability', 'network', 'cost', 'observability', 'security'];

/**
 * Get the panel sections applicable to a given component type.
 * Returns only sections that have at least one field.
 */
export function getSectionsForComponentType(componentType: string): PanelSection[] {
  const sectionIds = VISIBLE_SECTIONS[componentType] ?? DEFAULT_SECTIONS;
  return PANEL_SECTIONS.filter(
    (s) => sectionIds.includes(s.id) && s.fields.length > 0,
  );
}
