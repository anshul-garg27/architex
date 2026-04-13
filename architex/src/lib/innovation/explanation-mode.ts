// ─────────────────────────────────────────────────────────────
// Architex — Explanation Mode (Alt+Hover Contextual Help)
// ─────────────────────────────────────────────────────────────
//
// Rich explanations for every node and edge type on the canvas.
// Each entry includes: title, description, use-cases,
// trade-offs, and alternatives.
//
// Public API:
//   getExplanation(nodeType)      → NodeExplanation | undefined
//   getEdgeExplanation(edgeType)  → EdgeExplanation | undefined
//   ALL_NODE_EXPLANATIONS         → full map
//   ALL_EDGE_EXPLANATIONS         → full map
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Contextual explanation for a canvas node type. */
export interface NodeExplanation {
  /** Node type key (matches systemDesignNodeTypes key). */
  nodeType: string;
  /** Human-readable title. */
  title: string;
  /** One-paragraph description of what this component is. */
  description: string;
  /** When you would use this in a system design. */
  useCases: string[];
  /** Pros/cons and design trade-offs. */
  tradeoffs: string[];
  /** Alternative components that serve a similar purpose. */
  alternatives: string[];
}

/** Contextual explanation for a canvas edge type. */
export interface EdgeExplanation {
  /** Edge type key (matches systemDesignEdgeTypes key). */
  edgeType: string;
  /** Human-readable title. */
  title: string;
  /** What this connection pattern represents. */
  description: string;
  /** Typical use-cases for this edge type. */
  useCases: string[];
  /** Trade-offs of this communication pattern. */
  tradeoffs: string[];
}

// ── Node Explanations ───────────────────────────────────────

export const ALL_NODE_EXPLANATIONS: Record<string, NodeExplanation> = {
  'web-server': {
    nodeType: 'web-server',
    title: 'Web Server',
    description: 'An HTTP server that handles incoming web requests, serves static content, and may proxy dynamic requests to application servers. Examples include Nginx, Apache, and Caddy.',
    useCases: [
      'Serving static assets (HTML, CSS, JS, images)',
      'Reverse proxy in front of application servers',
      'TLS termination and request routing',
    ],
    tradeoffs: [
      'Simple to configure but limited request processing logic',
      'Single point of failure without load balancing',
      'Can become a bottleneck under heavy traffic',
    ],
    alternatives: ['load-balancer', 'api-gateway', 'cdn'],
  },
  'load-balancer': {
    nodeType: 'load-balancer',
    title: 'Load Balancer',
    description: 'Distributes incoming traffic across multiple backend servers to improve availability, reliability, and performance. Can operate at L4 (TCP/UDP) or L7 (HTTP).',
    useCases: [
      'Distributing traffic across multiple server instances',
      'Health checking and automatic failover',
      'TLS termination and SSL offloading',
    ],
    tradeoffs: [
      'Adds a network hop and slight latency',
      'L7 provides content-based routing but uses more resources',
      'Can become a single point of failure (use HA pairs)',
    ],
    alternatives: ['dns', 'api-gateway'],
  },
  database: {
    nodeType: 'database',
    title: 'Relational Database',
    description: 'A structured data store using tables, rows, and SQL queries. Provides ACID transactions, referential integrity, and complex query capabilities. Examples: PostgreSQL, MySQL.',
    useCases: [
      'Transactional workloads requiring ACID guarantees',
      'Complex queries with joins across related data',
      'Applications with well-defined, structured schemas',
    ],
    tradeoffs: [
      'Strong consistency but harder to scale horizontally',
      'Schema changes can be disruptive in production',
      'Joins become expensive at very large scale',
    ],
    alternatives: ['document-db', 'wide-column', 'graph-db'],
  },
  cache: {
    nodeType: 'cache',
    title: 'Cache',
    description: 'An in-memory data store providing sub-millisecond reads for frequently accessed data. Reduces database load and improves response times. Examples: Redis, Memcached.',
    useCases: [
      'Caching hot database query results',
      'Session storage for web applications',
      'Rate limiting counters and leaderboards',
    ],
    tradeoffs: [
      'Data can become stale (cache invalidation is hard)',
      'Memory is expensive compared to disk storage',
      'Cache failures can cause sudden DB load spikes',
    ],
    alternatives: ['cdn', 'database'],
  },
  'message-queue': {
    nodeType: 'message-queue',
    title: 'Message Queue',
    description: 'Asynchronous messaging middleware that decouples producers from consumers. Messages are durably stored until consumed. Examples: RabbitMQ, Amazon SQS, Apache Kafka.',
    useCases: [
      'Decoupling services for independent scaling',
      'Buffering bursts of traffic',
      'Reliable task distribution to worker pools',
    ],
    tradeoffs: [
      'Adds complexity and eventual consistency',
      'Message ordering can be hard to guarantee',
      'Monitoring and debugging is more complex',
    ],
    alternatives: ['event-bus', 'pub-sub', 'stream-processor'],
  },
  'api-gateway': {
    nodeType: 'api-gateway',
    title: 'API Gateway',
    description: 'A single entry point for API consumers that handles authentication, rate limiting, request routing, and protocol translation. Examples: Kong, AWS API Gateway, Envoy.',
    useCases: [
      'Unified API entry point for microservices',
      'Authentication and authorization enforcement',
      'Rate limiting, throttling, and request transformation',
    ],
    tradeoffs: [
      'Central point of failure if not highly available',
      'Can become a bottleneck under extreme load',
      'Adds latency due to additional processing',
    ],
    alternatives: ['load-balancer', 'web-server'],
  },
  cdn: {
    nodeType: 'cdn',
    title: 'CDN (Content Delivery Network)',
    description: 'A globally distributed network of edge servers that cache and serve content close to users. Reduces latency and origin server load. Examples: CloudFront, Cloudflare, Akamai.',
    useCases: [
      'Serving static assets with low latency globally',
      'DDoS protection and traffic absorption',
      'Edge computing and dynamic content acceleration',
    ],
    tradeoffs: [
      'Cache invalidation across edge locations is slow',
      'Cost scales with bandwidth usage',
      'Not suitable for highly personalized dynamic content',
    ],
    alternatives: ['web-server', 'cache'],
  },
  client: {
    nodeType: 'client',
    title: 'Client (Browser)',
    description: 'A web browser or desktop application that initiates requests to the system. Represents the end-user entry point in the architecture.',
    useCases: [
      'Representing the user-facing entry point',
      'Single-page application (SPA) rendering',
      'Client-side caching and service workers',
    ],
    tradeoffs: [
      'Limited compute resources compared to servers',
      'Unreliable network connectivity',
      'Security-sensitive (never trust client input)',
    ],
    alternatives: ['mobile-client'],
  },
  storage: {
    nodeType: 'storage',
    title: 'Object Storage',
    description: 'Scalable blob/object storage for unstructured data like images, videos, backups, and logs. Examples: Amazon S3, Google Cloud Storage, MinIO.',
    useCases: [
      'Storing user-uploaded files (images, videos)',
      'Data lake for analytics and ML training data',
      'Backup and disaster recovery storage',
    ],
    tradeoffs: [
      'High latency compared to block storage or in-memory',
      'Eventual consistency in some implementations',
      'Retrieval costs can be high for infrequently accessed data',
    ],
    alternatives: ['database', 'cdn'],
  },
  'app-server': {
    nodeType: 'app-server',
    title: 'Application Server',
    description: 'A backend service that runs business logic, processes requests, and coordinates with databases, caches, and other services. Examples: Node.js, Spring Boot, Django.',
    useCases: [
      'Running core business logic and domain rules',
      'Orchestrating calls to multiple downstream services',
      'Data validation and transformation',
    ],
    tradeoffs: [
      'Stateful servers are harder to scale horizontally',
      'Compute-heavy operations may need async processing',
      'Error handling complexity with multiple dependencies',
    ],
    alternatives: ['serverless', 'worker'],
  },
  serverless: {
    nodeType: 'serverless',
    title: 'Serverless Function',
    description: 'Event-driven compute that runs code without managing servers. Scales to zero when idle and auto-scales with demand. Examples: AWS Lambda, Google Cloud Functions, Vercel Functions.',
    useCases: [
      'Event-driven processing (file uploads, webhooks)',
      'Lightweight API endpoints with variable traffic',
      'Scheduled jobs and data transformations',
    ],
    tradeoffs: [
      'Cold start latency on first invocation',
      'Execution time limits (usually 15 min max)',
      'Vendor lock-in and limited runtime customization',
    ],
    alternatives: ['app-server', 'worker'],
  },
  worker: {
    nodeType: 'worker',
    title: 'Worker Service',
    description: 'A background processing service that consumes tasks from queues or event streams. Decoupled from request/response cycle for async workloads.',
    useCases: [
      'Processing background jobs (email, notifications)',
      'Data pipeline transformations',
      'Long-running computations off the critical path',
    ],
    tradeoffs: [
      'No direct user-facing response path',
      'Needs monitoring for job failures and retries',
      'Queue depth management to avoid OOM',
    ],
    alternatives: ['serverless', 'batch-processor'],
  },
  'document-db': {
    nodeType: 'document-db',
    title: 'Document Database',
    description: 'A NoSQL database storing data as flexible JSON-like documents. Schema-free with rich query capabilities. Examples: MongoDB, CouchDB, Amazon DocumentDB.',
    useCases: [
      'Applications with evolving or nested data schemas',
      'Content management systems',
      'User profiles and product catalogs',
    ],
    tradeoffs: [
      'No joins — data denormalization required',
      'Weaker consistency guarantees than relational DBs',
      'Can lead to data duplication and update anomalies',
    ],
    alternatives: ['database', 'wide-column'],
  },
  'wide-column': {
    nodeType: 'wide-column',
    title: 'Wide-Column Store',
    description: 'A NoSQL database optimized for writes and large-scale sequential reads. Data is organized by column families. Examples: Cassandra, HBase, ScyllaDB.',
    useCases: [
      'Time-series data and event logging at massive scale',
      'IoT sensor data ingestion',
      'Applications needing high write throughput',
    ],
    tradeoffs: [
      'Limited query flexibility (design around access patterns)',
      'Eventual consistency by default',
      'Complex data modeling compared to relational DBs',
    ],
    alternatives: ['database', 'timeseries-db', 'document-db'],
  },
  'search-engine': {
    nodeType: 'search-engine',
    title: 'Search Engine',
    description: 'A full-text search and analytics engine using inverted indexes for fast text retrieval. Examples: Elasticsearch, Apache Solr, Meilisearch.',
    useCases: [
      'Full-text search across product catalogs or documents',
      'Log aggregation and analysis (ELK stack)',
      'Autocomplete and fuzzy matching',
    ],
    tradeoffs: [
      'Not a primary data store — needs syncing with source of truth',
      'Index size can grow large with high cardinality data',
      'Write-heavy workloads can cause indexing lag',
    ],
    alternatives: ['database', 'document-db'],
  },
  'timeseries-db': {
    nodeType: 'timeseries-db',
    title: 'Time-Series Database',
    description: 'A database optimized for time-stamped data with efficient writes, compression, and time-range queries. Examples: InfluxDB, TimescaleDB, Prometheus.',
    useCases: [
      'Metrics and monitoring data storage',
      'IoT sensor readings',
      'Financial tick data and market analytics',
    ],
    tradeoffs: [
      'Optimized for append-only writes, not random updates',
      'Limited ad-hoc query capabilities',
      'Retention policies needed to manage data growth',
    ],
    alternatives: ['wide-column', 'database'],
  },
  'graph-db': {
    nodeType: 'graph-db',
    title: 'Graph Database',
    description: 'A database that stores data as nodes and edges, optimized for traversing relationships. Examples: Neo4j, Amazon Neptune, ArangoDB.',
    useCases: [
      'Social networks and recommendation engines',
      'Fraud detection via relationship analysis',
      'Knowledge graphs and ontologies',
    ],
    tradeoffs: [
      'Not ideal for tabular or aggregation-heavy queries',
      'Scaling graph databases horizontally is challenging',
      'Query languages (Cypher, Gremlin) have a learning curve',
    ],
    alternatives: ['database', 'document-db'],
  },
  'pub-sub': {
    nodeType: 'pub-sub',
    title: 'Pub/Sub System',
    description: 'A publish-subscribe messaging pattern where publishers send messages to topics and all subscribers receive copies. Examples: Google Pub/Sub, SNS, Redis Pub/Sub.',
    useCases: [
      'Fan-out notifications to multiple consumers',
      'Event broadcasting across microservices',
      'Real-time updates (chat, live feeds)',
    ],
    tradeoffs: [
      'No message persistence in basic implementations',
      'Subscriber must be online to receive (unless durable)',
      'Ordering guarantees vary by implementation',
    ],
    alternatives: ['message-queue', 'event-bus'],
  },
  'stream-processor': {
    nodeType: 'stream-processor',
    title: 'Stream Processor',
    description: 'A real-time data processing engine that consumes, transforms, and aggregates continuous data streams. Examples: Apache Flink, Kafka Streams, Spark Streaming.',
    useCases: [
      'Real-time analytics and dashboards',
      'Fraud detection on transaction streams',
      'ETL pipelines with low-latency requirements',
    ],
    tradeoffs: [
      'Complex state management for windowed aggregations',
      'Exactly-once processing is hard to guarantee',
      'Resource-intensive for high-throughput streams',
    ],
    alternatives: ['batch-processor', 'worker'],
  },
  'batch-processor': {
    nodeType: 'batch-processor',
    title: 'Batch Processor',
    description: 'A scheduled processing system that operates on large data sets in bulk. Optimized for throughput over latency. Examples: Apache Spark, Hadoop MapReduce, AWS Batch.',
    useCases: [
      'ETL pipelines (nightly data warehouse loads)',
      'ML model training on historical data',
      'Report generation and data aggregation',
    ],
    tradeoffs: [
      'High latency — not suitable for real-time needs',
      'Resource-hungry during processing windows',
      'Data staleness between batch runs',
    ],
    alternatives: ['stream-processor', 'worker'],
  },
  'ml-inference': {
    nodeType: 'ml-inference',
    title: 'ML Inference Service',
    description: 'A service that serves machine learning model predictions in real-time or batch mode. Handles model loading, preprocessing, inference, and postprocessing.',
    useCases: [
      'Real-time recommendation engines',
      'Image/text classification APIs',
      'Fraud scoring on incoming transactions',
    ],
    tradeoffs: [
      'GPU resources are expensive',
      'Model versioning and rollback complexity',
      'Latency spikes during model loading or switching',
    ],
    alternatives: ['app-server', 'serverless'],
  },
  dns: {
    nodeType: 'dns',
    title: 'DNS (Domain Name System)',
    description: 'The internet\'s phone book — translates human-readable domain names to IP addresses. Supports geographic routing, failover, and load distribution.',
    useCases: [
      'Domain name resolution for all web traffic',
      'Geographic routing (latency-based DNS)',
      'Failover and disaster recovery routing',
    ],
    tradeoffs: [
      'DNS propagation delays (TTL-dependent)',
      'DNS-based load balancing is coarse-grained',
      'Vulnerable to DNS spoofing and cache poisoning',
    ],
    alternatives: ['load-balancer'],
  },
  'cdn-edge': {
    nodeType: 'cdn-edge',
    title: 'CDN Edge Node',
    description: 'An individual point of presence (PoP) in a CDN network. Caches content locally and serves users in its geographic region.',
    useCases: [
      'Caching static assets at the edge',
      'Edge compute for request personalization',
      'Reducing origin server load',
    ],
    tradeoffs: [
      'Limited compute compared to origin servers',
      'Cache consistency across edge nodes',
      'Storage capacity limits at each PoP',
    ],
    alternatives: ['cdn', 'cache'],
  },
  firewall: {
    nodeType: 'firewall',
    title: 'Firewall',
    description: 'A network security device that monitors and controls incoming/outgoing traffic based on security rules. Can be network-level (L3/L4) or application-level (WAF).',
    useCases: [
      'Blocking unauthorized network access',
      'Web Application Firewall (WAF) for OWASP threats',
      'DDoS mitigation at the network perimeter',
    ],
    tradeoffs: [
      'Over-restrictive rules can block legitimate traffic',
      'Adds latency to every request',
      'Requires ongoing rule maintenance and updates',
    ],
    alternatives: ['rate-limiter', 'api-gateway'],
  },
  'mobile-client': {
    nodeType: 'mobile-client',
    title: 'Mobile Client',
    description: 'A native or hybrid mobile application running on iOS/Android. Communicates with backend services via APIs, often over unreliable mobile networks.',
    useCases: [
      'Consumer-facing mobile applications',
      'Offline-first apps with sync capabilities',
      'Push notification-driven engagement',
    ],
    tradeoffs: [
      'Battery and bandwidth constraints',
      'App store review and deployment cycles',
      'Platform fragmentation (iOS vs Android)',
    ],
    alternatives: ['client'],
  },
  'third-party-api': {
    nodeType: 'third-party-api',
    title: 'Third-Party API',
    description: 'An external service integration (payment processing, email, SMS, maps, etc.) that your system depends on but does not control.',
    useCases: [
      'Payment processing (Stripe, PayPal)',
      'Email and SMS delivery (SendGrid, Twilio)',
      'Maps and geocoding (Google Maps, Mapbox)',
    ],
    tradeoffs: [
      'External dependency — outages affect your system',
      'Rate limits and usage-based pricing',
      'Data privacy concerns with third-party data sharing',
    ],
    alternatives: ['app-server'],
  },
  'metrics-collector': {
    nodeType: 'metrics-collector',
    title: 'Metrics Collector',
    description: 'A system that gathers, aggregates, and stores numeric time-series metrics from applications and infrastructure. Examples: Prometheus, Datadog Agent, StatsD.',
    useCases: [
      'Application performance monitoring (APM)',
      'Infrastructure health dashboards',
      'Alerting on SLO/SLA breaches',
    ],
    tradeoffs: [
      'High-cardinality metrics can be expensive to store',
      'Pull-based (Prometheus) vs push-based (StatsD) trade-offs',
      'Metrics lag behind real-time events',
    ],
    alternatives: ['log-aggregator', 'tracer'],
  },
  'log-aggregator': {
    nodeType: 'log-aggregator',
    title: 'Log Aggregator',
    description: 'A centralized system for collecting, parsing, and querying application logs from distributed services. Examples: ELK Stack, Splunk, Loki.',
    useCases: [
      'Centralized logging for distributed systems',
      'Debugging and root-cause analysis',
      'Audit trails and compliance logging',
    ],
    tradeoffs: [
      'Storage costs grow rapidly with verbose logging',
      'Search performance degrades with unstructured logs',
      'Log shipping can consume significant network bandwidth',
    ],
    alternatives: ['metrics-collector', 'tracer'],
  },
  tracer: {
    nodeType: 'tracer',
    title: 'Distributed Tracer',
    description: 'Tracks request flow across multiple services by propagating trace context. Visualizes latency breakdown per service. Examples: Jaeger, Zipkin, AWS X-Ray.',
    useCases: [
      'Identifying latency bottlenecks in microservices',
      'Visualizing request flow across service boundaries',
      'Debugging intermittent failures in distributed calls',
    ],
    tradeoffs: [
      'Instrumentation overhead on every service',
      'Sampling required at high traffic volumes',
      'Storage intensive for full trace retention',
    ],
    alternatives: ['metrics-collector', 'log-aggregator'],
  },
  'event-bus': {
    nodeType: 'event-bus',
    title: 'Event Bus',
    description: 'A central messaging backbone for event-driven architectures. Services publish domain events and interested services subscribe. Examples: Kafka, EventBridge, NATS.',
    useCases: [
      'Event-driven microservice communication',
      'Event sourcing and CQRS patterns',
      'Cross-service data synchronization',
    ],
    tradeoffs: [
      'Event schema evolution must be managed carefully',
      'Debugging event flows is harder than synchronous calls',
      'Eventual consistency across consumers',
    ],
    alternatives: ['message-queue', 'pub-sub'],
  },
  'rate-limiter': {
    nodeType: 'rate-limiter',
    title: 'Rate Limiter',
    description: 'Controls the rate of incoming requests to protect services from abuse and overload. Algorithms include token bucket, leaky bucket, and sliding window.',
    useCases: [
      'Preventing API abuse and brute-force attacks',
      'Protecting backend services from traffic spikes',
      'Fair usage enforcement across tenants',
    ],
    tradeoffs: [
      'Overly aggressive limits degrade user experience',
      'Distributed rate limiting needs shared state (Redis)',
      'Different endpoints may need different limit policies',
    ],
    alternatives: ['firewall', 'api-gateway'],
  },
  'secret-manager': {
    nodeType: 'secret-manager',
    title: 'Secret Manager',
    description: 'A secure vault for storing and managing sensitive data like API keys, database credentials, and TLS certificates. Examples: HashiCorp Vault, AWS Secrets Manager.',
    useCases: [
      'Centralized credential management',
      'Automatic secret rotation',
      'Dynamic database credential generation',
    ],
    tradeoffs: [
      'Adds a dependency to the critical startup path',
      'Caching secrets vs. freshness trade-off',
      'Access control policies must be carefully managed',
    ],
    alternatives: ['app-server'],
  },
};

// ── Edge Explanations ───────────────────────────────────────

export const ALL_EDGE_EXPLANATIONS: Record<string, EdgeExplanation> = {
  'data-flow': {
    edgeType: 'data-flow',
    title: 'Data Flow',
    description: 'Represents data moving between two components — HTTP requests, database queries, cache reads, message publishing, or any other form of inter-component communication.',
    useCases: [
      'HTTP/REST API calls between services',
      'Database read/write operations',
      'Cache get/set operations',
      'Message publishing and consuming',
    ],
    tradeoffs: [
      'Synchronous flows add latency to the request path',
      'Asynchronous flows add complexity and eventual consistency',
      'Each hop is a potential failure point — use retries and circuit breakers',
    ],
  },
};

// ── Lookup functions ────────────────────────────────────────

/** Get explanation for a node type. Returns undefined for unknown types. */
export function getExplanation(nodeType: string): NodeExplanation | undefined {
  return ALL_NODE_EXPLANATIONS[nodeType];
}

/** Get explanation for an edge type. Returns undefined for unknown types. */
export function getEdgeExplanation(edgeType: string): EdgeExplanation | undefined {
  return ALL_EDGE_EXPLANATIONS[edgeType];
}

/** Get all available node type keys that have explanations. */
export function getExplainedNodeTypes(): string[] {
  return Object.keys(ALL_NODE_EXPLANATIONS);
}

/** Get all available edge type keys that have explanations. */
export function getExplainedEdgeTypes(): string[] {
  return Object.keys(ALL_EDGE_EXPLANATIONS);
}
