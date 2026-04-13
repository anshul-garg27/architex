/**
 * Node Service Rates (SIM-008)
 *
 * Single source of truth for component type service rates. Extracted from
 * the duplicated getNodeServiceRate() in simulation-orchestrator.ts and
 * what-if-engine.ts.
 *
 * Service rate = requests per millisecond that one server instance can handle.
 * rate = 1 / processingTimeMs
 */

// ---------------------------------------------------------------------------
// Service rate lookup table
// ---------------------------------------------------------------------------

/**
 * Base processing time in milliseconds per component type.
 *
 * Service rate (req/ms) = 1 / processingTimeMs.
 * Maps all ~75+ component types including v2 additions.
 */
const PROCESSING_TIME_MS: Record<string, number> = {
  // -- Load balancing --
  'load-balancer': 0.5,
  'load-balancer-l4': 0.3,
  'load-balancer-l7': 0.5,
  'reverse-proxy': 0.5,
  'api-gateway': 2,
  'service-mesh': 1,

  // -- Compute --
  'web-server': 5,
  'app-server': 5,
  'serverless': 10,
  'worker': 50,
  'batch-processor': 50,
  'stream-processor': 50,
  'container': 5,
  'vm-instance': 5,

  // -- Databases --
  'database': 10,
  'postgres': 10,
  'postgres-primary': 10,
  'postgres-replica': 8,
  'mysql': 10,
  'mysql-primary': 10,
  'mysql-replica': 8,
  'document-db': 10,
  'mongodb': 10,
  'wide-column': 10,
  'cassandra': 8,
  'graph-db': 15,
  'neo4j': 15,
  'timeseries-db': 5,
  'influxdb': 5,
  'vector-db': 20,
  'newSQL': 8,
  'cockroachdb': 8,

  // -- Cache --
  'cache': 1,
  'redis': 1,
  'redis-cache': 1,
  'redis-cluster': 1,
  'memcached': 0.8,

  // -- Messaging --
  'message-queue': 5,
  'rabbitmq': 5,
  'kafka': 2,
  'kafka-broker': 2,
  'pub-sub': 5,
  'event-bus': 5,
  'sns': 3,
  'sqs': 5,

  // -- Storage --
  'object-storage': 20,
  's3': 20,
  'block-storage': 5,
  'file-storage': 10,
  'data-lake': 50,

  // -- Search --
  'search-engine': 15,
  'elasticsearch': 15,

  // -- Networking --
  'cdn': 0.2,
  'cdn-edge': 0.2,
  'dns': 1,
  'firewall': 0.1,
  'waf': 0.2,
  'rate-limiter': 0.1,
  'vpn-gateway': 1,

  // -- Security --
  'auth-service': 5,
  'secret-manager': 5,
  'identity-provider': 10,
  'certificate-manager': 5,

  // -- Observability --
  'monitoring': 1,
  'logging': 2,
  'tracing': 2,
  'metrics-server': 1,
  'alerting': 5,

  // -- AI/ML --
  'ml-inference': 100,
  'ml-training': 500,
  'llm-gateway': 200,
  'feature-store': 5,
  'model-registry': 10,
  'embedding-service': 50,

  // -- Data engineering --
  'etl-pipeline': 100,
  'data-warehouse': 20,
  'spark-cluster': 50,
  'flink-cluster': 20,
  'airflow': 50,

  // -- Client (passthroughs) --
  'client': 1,
  'mobile-client': 1,
  'web-client': 1,
  'iot-device': 1,
};

/** Default processing time for unknown component types (ms). */
const DEFAULT_PROCESSING_TIME_MS = 1;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the base service rate (requests per millisecond) for a component type.
 *
 * This is the single source of truth used by the simulation orchestrator,
 * what-if engine, and any other module that needs node processing speeds.
 *
 * @param componentType - The node's component type string
 * @returns Service rate in requests per millisecond
 */
export function getNodeServiceRate(componentType: string): number {
  const processingTime = PROCESSING_TIME_MS[componentType] ?? DEFAULT_PROCESSING_TIME_MS;
  return 1 / processingTime;
}

/**
 * Get the base service rate from a node data record.
 *
 * Checks for an explicit `processingTimeMs` in the config first, then falls
 * back to the component type lookup table.
 *
 * @param data - The node data record (from node.data)
 * @returns Service rate in requests per millisecond
 */
export function getNodeServiceRateFromData(data: Record<string, unknown>): number {
  const config = (data.config ?? {}) as Record<string, unknown>;
  const componentType = (data.componentType as string) ?? '';

  // If the node has an explicit processingTimeMs, use it.
  if (typeof config.processingTimeMs === 'number' && config.processingTimeMs > 0) {
    return 1 / config.processingTimeMs;
  }

  return getNodeServiceRate(componentType);
}

/**
 * Get the processing time (ms per request) for a component type.
 *
 * @param componentType - The node's component type string
 * @returns Processing time in milliseconds
 */
export function getProcessingTimeMs(componentType: string): number {
  return PROCESSING_TIME_MS[componentType] ?? DEFAULT_PROCESSING_TIME_MS;
}

/**
 * Get all known component types that have a defined service rate.
 *
 * @returns Array of component type strings
 */
export function getAllComponentTypes(): string[] {
  return Object.keys(PROCESSING_TIME_MS);
}
