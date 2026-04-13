/**
 * Throughput Benchmarks for System Design (2025 Edition)
 *
 * Realistic per-node throughput numbers for common infrastructure
 * components. Use these as starting points for capacity planning
 * and back-of-the-envelope calculations.
 *
 * All values represent a SINGLE instance/node on modern hardware
 * (e.g., c7g.xlarge / 4 vCPU, 8 GB RAM) unless noted otherwise.
 */

// ---------------------------------------------------------------------------
// Throughput table
// ---------------------------------------------------------------------------

export const THROUGHPUT = {
  // ---- Web Servers & Frameworks ----

  /** Nginx (reverse proxy / static), requests per second */
  NGINX_RPS: 50_000,

  /** Node.js + Express (JSON API, no DB), requests per second */
  NODE_EXPRESS_RPS: 15_000,

  /** Node.js + Fastify (JSON API, no DB), requests per second */
  NODE_FASTIFY_RPS: 30_000,

  /** Go net/http (JSON API, no DB), requests per second */
  GO_HTTP_RPS: 50_000,

  /** Rust Actix-Web (JSON API, no DB), requests per second */
  RUST_ACTIX_RPS: 80_000,

  /** Java Spring Boot (JSON API, no DB), requests per second */
  JAVA_SPRING_RPS: 25_000,

  /** Python FastAPI (JSON API, no DB, uvicorn), requests per second */
  PYTHON_FASTAPI_RPS: 8_000,

  // ---- Databases ----

  /** Redis single-threaded ops/sec (GET/SET, pipelining) */
  REDIS_OPS: 100_000,

  /** Redis cluster total ops/sec (6-node cluster) */
  REDIS_CLUSTER_OPS: 500_000,

  /** PostgreSQL transactions/sec (simple OLTP, pgbench) */
  POSTGRES_TPS: 10_000,

  /** PostgreSQL read queries/sec (indexed SELECT, connection pooled) */
  POSTGRES_READ_QPS: 25_000,

  /** MySQL transactions/sec (simple OLTP, sysbench) */
  MYSQL_TPS: 10_000,

  /** MongoDB operations/sec (single node, YCSB workload A) */
  MONGODB_OPS: 30_000,

  /** DynamoDB read capacity units per partition (default) */
  DYNAMODB_RCU_PER_PARTITION: 3_000,

  /** DynamoDB write capacity units per partition (default) */
  DYNAMODB_WCU_PER_PARTITION: 1_000,

  // ---- Message Queues & Streaming ----

  /** Kafka messages/sec per partition (1 KB messages, acks=1) */
  KAFKA_MSGS_PER_PARTITION: 1_000_000,

  /** Kafka bytes/sec per broker (~200 MB/s sustained write) */
  KAFKA_BYTES_PER_BROKER: 200_000_000,

  /** RabbitMQ messages/sec (persistent, mirrored queue) */
  RABBITMQ_MSGS: 20_000,

  /** AWS SQS messages/sec per queue (standard queue) */
  SQS_STANDARD_MSGS: 3_000,

  /** AWS SQS FIFO messages/sec (with batching) */
  SQS_FIFO_MSGS: 300,

  // ---- Search & Analytics ----

  /** Elasticsearch queries/sec (single node, simple match) */
  ELASTICSEARCH_QPS: 5_000,

  /** Elasticsearch indexing docs/sec (single node, bulk) */
  ELASTICSEARCH_INDEX_DPS: 10_000,

  /** ClickHouse queries/sec (analytical, single node) */
  CLICKHOUSE_QPS: 100,

  /** ClickHouse rows ingested/sec (single node, batch insert) */
  CLICKHOUSE_INGEST_RPS: 1_000_000,

  // ---- Networking ----

  /** Single TCP connection throughput (10 Gbps NIC) in bytes/sec */
  TCP_SINGLE_CONN_BPS: 1_250_000_000,

  /** HTTP/2 multiplexed streams per connection */
  HTTP2_STREAMS_PER_CONN: 100,

  /** WebSocket messages/sec per server (Node.js ws, small payloads) */
  WEBSOCKET_MSGS_PER_SERVER: 50_000,

  // ---- Object Storage ----

  /** S3 GET requests/sec per prefix */
  S3_GET_PER_PREFIX: 5_500,

  /** S3 PUT requests/sec per prefix */
  S3_PUT_PER_PREFIX: 3_500,
} as const;

/** Union of all throughput keys */
export type ThroughputKey = keyof typeof THROUGHPUT;

/** The unit associated with each throughput metric */
export type ThroughputUnit =
  | 'rps'
  | 'ops/s'
  | 'tps'
  | 'qps'
  | 'msgs/s'
  | 'docs/s'
  | 'rows/s'
  | 'bytes/s'
  | 'streams'
  | 'units';

// ---------------------------------------------------------------------------
// Metadata: human-friendly unit per metric
// ---------------------------------------------------------------------------

const UNITS: Record<ThroughputKey, ThroughputUnit> = {
  NGINX_RPS: 'rps',
  NODE_EXPRESS_RPS: 'rps',
  NODE_FASTIFY_RPS: 'rps',
  GO_HTTP_RPS: 'rps',
  RUST_ACTIX_RPS: 'rps',
  JAVA_SPRING_RPS: 'rps',
  PYTHON_FASTAPI_RPS: 'rps',

  REDIS_OPS: 'ops/s',
  REDIS_CLUSTER_OPS: 'ops/s',
  POSTGRES_TPS: 'tps',
  POSTGRES_READ_QPS: 'qps',
  MYSQL_TPS: 'tps',
  MONGODB_OPS: 'ops/s',
  DYNAMODB_RCU_PER_PARTITION: 'units',
  DYNAMODB_WCU_PER_PARTITION: 'units',

  KAFKA_MSGS_PER_PARTITION: 'msgs/s',
  KAFKA_BYTES_PER_BROKER: 'bytes/s',
  RABBITMQ_MSGS: 'msgs/s',
  SQS_STANDARD_MSGS: 'msgs/s',
  SQS_FIFO_MSGS: 'msgs/s',

  ELASTICSEARCH_QPS: 'qps',
  ELASTICSEARCH_INDEX_DPS: 'docs/s',
  CLICKHOUSE_QPS: 'qps',
  CLICKHOUSE_INGEST_RPS: 'rows/s',

  TCP_SINGLE_CONN_BPS: 'bytes/s',
  HTTP2_STREAMS_PER_CONN: 'streams',
  WEBSOCKET_MSGS_PER_SERVER: 'msgs/s',

  S3_GET_PER_PREFIX: 'rps',
  S3_PUT_PER_PREFIX: 'rps',
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a large number with SI suffixes (K, M, G).
 *
 * @example
 *   formatNumber(1_000_000) // "1M"
 *   formatNumber(50_000)    // "50K"
 *   formatNumber(300)       // "300"
 */
export function formatNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `${+(n / 1_000_000_000).toPrecision(3)}G`;
  }
  if (abs >= 1_000_000) {
    return `${+(n / 1_000_000).toPrecision(3)}M`;
  }
  if (abs >= 1_000) {
    return `${+(n / 1_000).toPrecision(3)}K`;
  }
  return `${n}`;
}

/**
 * Format a throughput entry with its unit.
 *
 * @example
 *   formatThroughput("REDIS_OPS") // "100K ops/s"
 */
export function formatThroughput(key: ThroughputKey): string {
  return `${formatNumber(THROUGHPUT[key])} ${UNITS[key]}`;
}

/**
 * Return a labelled display string for a throughput key.
 *
 * @example
 *   formatThroughputEntry("KAFKA_MSGS_PER_PARTITION")
 *   // "Kafka Msgs Per Partition: 1M msgs/s"
 */
export function formatThroughputEntry(key: ThroughputKey): string {
  const label = key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return `${label}: ${formatThroughput(key)}`;
}

/**
 * Return all throughputs sorted from highest to lowest.
 */
export function getAllThroughputsSorted(): Array<{
  key: ThroughputKey;
  value: number;
  unit: ThroughputUnit;
  display: string;
}> {
  return (Object.keys(THROUGHPUT) as ThroughputKey[])
    .map((key) => ({
      key,
      value: THROUGHPUT[key],
      unit: UNITS[key],
      display: formatThroughputEntry(key),
    }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate how many instances you need to handle a target throughput.
 *
 * @param key         - The component type
 * @param target      - Desired throughput in the same unit as the component
 * @param headroom    - Safety factor (default 0.7 = use 70% of max)
 * @returns           - Number of instances needed (rounded up)
 *
 * @example
 *   instancesNeeded("POSTGRES_TPS", 35_000) // 5
 */
export function instancesNeeded(
  key: ThroughputKey,
  target: number,
  headroom = 0.7,
): number {
  const effective = THROUGHPUT[key] * headroom;
  return Math.ceil(target / effective);
}
