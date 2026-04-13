// ─────────────────────────────────────────────────────────────
// Architex — Knowledge Graph Concept Database
// ─────────────────────────────────────────────────────────────

export type ConceptDomain =
  | "compute"
  | "storage"
  | "messaging"
  | "reliability"
  | "data"
  | "protocols"
  | "security"
  | "observability"
  | "patterns"
  | "distributed";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type RelationshipType =
  | "uses"
  | "alternative-to"
  | "depends-on"
  | "enhances"
  | "part-of";

export interface Concept {
  id: string;
  name: string;
  domain: ConceptDomain;
  description: string;
  relatedConcepts: string[];
  difficulty: Difficulty;
  tags: string[];
}

export interface ConceptRelationship {
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
}

// ── Domain Colors ──────────────────────────────────────────────

export const DOMAIN_COLORS: Record<ConceptDomain, string> = {
  compute: "#3b82f6",      // blue
  storage: "#10b981",      // emerald
  messaging: "#f59e0b",    // amber
  reliability: "#ef4444",  // red
  data: "#8b5cf6",         // violet
  protocols: "#06b6d4",    // cyan
  security: "#f97316",     // orange
  observability: "#84cc16", // lime
  patterns: "#ec4899",     // pink
  distributed: "#6366f1",  // indigo
};

export const DOMAIN_LABELS: Record<ConceptDomain, string> = {
  compute: "Compute",
  storage: "Storage",
  messaging: "Messaging",
  reliability: "Reliability",
  data: "Data",
  protocols: "Protocols",
  security: "Security",
  observability: "Observability",
  patterns: "Patterns",
  distributed: "Distributed",
};

// ── Concepts Database ──────────────────────────────────────────

export const CONCEPTS: Concept[] = [
  // ── Compute ──────────────────────────────────────────────────
  {
    id: "load-balancer",
    name: "Load Balancer",
    domain: "compute",
    description: "Distributes incoming network traffic across multiple servers to ensure no single server bears too much demand, improving availability and responsiveness.",
    relatedConcepts: ["auto-scaling", "reverse-proxy", "health-check", "api-gateway"],
    difficulty: "beginner",
    tags: ["infrastructure", "availability", "scalability"],
  },
  {
    id: "auto-scaling",
    name: "Auto Scaling",
    domain: "compute",
    description: "Automatically adjusts the number of compute resources based on current demand, scaling out during peaks and scaling in during lulls.",
    relatedConcepts: ["load-balancer", "container-orchestration", "serverless", "metrics"],
    difficulty: "intermediate",
    tags: ["scalability", "cost", "elasticity"],
  },
  {
    id: "container-orchestration",
    name: "Container Orchestration",
    domain: "compute",
    description: "Automates deployment, scaling, and management of containerized applications. Kubernetes is the dominant platform.",
    relatedConcepts: ["auto-scaling", "service-mesh", "serverless", "load-balancer"],
    difficulty: "intermediate",
    tags: ["containers", "kubernetes", "deployment"],
  },
  {
    id: "serverless",
    name: "Serverless",
    domain: "compute",
    description: "Cloud execution model where the provider dynamically manages server allocation. Functions run on-demand with automatic scaling to zero.",
    relatedConcepts: ["auto-scaling", "event-bus", "api-gateway", "container-orchestration"],
    difficulty: "intermediate",
    tags: ["functions", "cost", "event-driven"],
  },
  {
    id: "service-mesh",
    name: "Service Mesh",
    domain: "compute",
    description: "Infrastructure layer for managing service-to-service communication with features like traffic management, security, and observability via sidecar proxies.",
    relatedConcepts: ["container-orchestration", "circuit-breaker", "tracing", "mutual-tls"],
    difficulty: "advanced",
    tags: ["microservices", "networking", "istio"],
  },
  {
    id: "reverse-proxy",
    name: "Reverse Proxy",
    domain: "compute",
    description: "A server that sits in front of web servers and forwards client requests. Provides load balancing, caching, SSL termination, and compression.",
    relatedConcepts: ["load-balancer", "cdn", "api-gateway", "tls"],
    difficulty: "beginner",
    tags: ["infrastructure", "nginx", "caching"],
  },

  // ── Storage ──────────────────────────────────────────────────
  {
    id: "sql-database",
    name: "SQL Database",
    domain: "storage",
    description: "Relational database management system using structured query language. Provides ACID transactions, schema enforcement, and powerful joins.",
    relatedConcepts: ["nosql-database", "indexing", "replication", "sharding"],
    difficulty: "beginner",
    tags: ["relational", "ACID", "postgres", "mysql"],
  },
  {
    id: "nosql-database",
    name: "NoSQL Database",
    domain: "storage",
    description: "Non-relational databases offering flexible schemas, horizontal scaling, and varied data models (document, key-value, column-family, graph).",
    relatedConcepts: ["sql-database", "sharding", "denormalization", "cap-theorem"],
    difficulty: "beginner",
    tags: ["document", "key-value", "mongodb", "cassandra"],
  },
  {
    id: "object-storage",
    name: "Object Storage",
    domain: "storage",
    description: "Stores data as objects with metadata in a flat namespace. Ideal for unstructured data like images, videos, and backups at massive scale.",
    relatedConcepts: ["cdn", "caching", "sql-database"],
    difficulty: "beginner",
    tags: ["S3", "blob", "unstructured"],
  },
  {
    id: "cdn",
    name: "CDN",
    domain: "storage",
    description: "Content Delivery Network: geographically distributed network of proxy servers that cache content closer to end users for faster delivery.",
    relatedConcepts: ["caching", "object-storage", "reverse-proxy", "load-balancer"],
    difficulty: "beginner",
    tags: ["edge", "latency", "caching"],
  },
  {
    id: "caching",
    name: "Caching",
    domain: "storage",
    description: "Storing frequently accessed data in a fast-access layer (RAM) to reduce latency and database load. Strategies include write-through, write-back, and cache-aside.",
    relatedConcepts: ["cdn", "sql-database", "nosql-database", "rate-limiting"],
    difficulty: "beginner",
    tags: ["redis", "memcached", "performance"],
  },
  {
    id: "time-series-db",
    name: "Time-Series DB",
    domain: "storage",
    description: "Database optimized for time-stamped data. Provides efficient storage, compression, and querying of metrics, events, and sensor data.",
    relatedConcepts: ["metrics", "logging", "sql-database", "nosql-database"],
    difficulty: "intermediate",
    tags: ["influxdb", "prometheus", "monitoring"],
  },

  // ── Messaging ────────────────────────────────────────────────
  {
    id: "message-queue",
    name: "Message Queue",
    domain: "messaging",
    description: "Asynchronous communication mechanism where messages are stored in a queue until consumed. Decouples producers from consumers for reliability.",
    relatedConcepts: ["event-bus", "pub-sub", "stream-processing", "retry"],
    difficulty: "beginner",
    tags: ["async", "decoupling", "rabbitmq", "SQS"],
  },
  {
    id: "event-bus",
    name: "Event Bus",
    domain: "messaging",
    description: "Middleware that enables event-driven communication between services. Events are published and routed to interested subscribers.",
    relatedConcepts: ["pub-sub", "message-queue", "event-sourcing", "serverless"],
    difficulty: "intermediate",
    tags: ["event-driven", "decoupling", "eventbridge"],
  },
  {
    id: "pub-sub",
    name: "Pub/Sub",
    domain: "messaging",
    description: "Publish-Subscribe messaging pattern where publishers send messages to topics and subscribers receive messages from topics they are interested in.",
    relatedConcepts: ["message-queue", "event-bus", "stream-processing", "websocket"],
    difficulty: "beginner",
    tags: ["topics", "fan-out", "kafka", "SNS"],
  },
  {
    id: "stream-processing",
    name: "Stream Processing",
    domain: "messaging",
    description: "Continuous processing of data streams in real-time. Enables windowed aggregations, joins, and transformations on unbounded data.",
    relatedConcepts: ["pub-sub", "message-queue", "event-sourcing", "cqrs"],
    difficulty: "advanced",
    tags: ["kafka-streams", "flink", "real-time"],
  },
  {
    id: "dead-letter-queue",
    name: "Dead Letter Queue",
    domain: "messaging",
    description: "A queue that stores messages that could not be delivered or processed after maximum retries. Enables debugging and manual reprocessing.",
    relatedConcepts: ["message-queue", "retry", "circuit-breaker"],
    difficulty: "intermediate",
    tags: ["error-handling", "reliability", "debugging"],
  },
  {
    id: "event-streaming",
    name: "Event Streaming",
    domain: "messaging",
    description: "Continuous capture and storage of events as an immutable ordered log. Enables replay, audit trails, and real-time processing.",
    relatedConcepts: ["pub-sub", "event-sourcing", "stream-processing", "message-queue"],
    difficulty: "intermediate",
    tags: ["kafka", "event-log", "immutable"],
  },

  // ── Reliability ──────────────────────────────────────────────
  {
    id: "circuit-breaker",
    name: "Circuit Breaker",
    domain: "reliability",
    description: "Prevents cascading failures by monitoring calls to an external service and tripping open when failure rate exceeds a threshold, allowing the system to recover.",
    relatedConcepts: ["retry", "bulkhead", "rate-limiting", "service-mesh"],
    difficulty: "intermediate",
    tags: ["resilience", "fault-tolerance", "hystrix"],
  },
  {
    id: "retry",
    name: "Retry with Backoff",
    domain: "reliability",
    description: "Automatically retries failed operations with exponential backoff and jitter to handle transient failures without overwhelming the target service.",
    relatedConcepts: ["circuit-breaker", "dead-letter-queue", "message-queue", "idempotency"],
    difficulty: "beginner",
    tags: ["resilience", "exponential-backoff", "jitter"],
  },
  {
    id: "bulkhead",
    name: "Bulkhead",
    domain: "reliability",
    description: "Isolates elements of an application into pools so that if one fails, the others continue to function. Named after ship compartments.",
    relatedConcepts: ["circuit-breaker", "rate-limiting", "service-mesh"],
    difficulty: "intermediate",
    tags: ["isolation", "resilience", "thread-pools"],
  },
  {
    id: "rate-limiting",
    name: "Rate Limiting",
    domain: "reliability",
    description: "Controls the rate of requests to a service to prevent abuse and overload. Common algorithms: token bucket, sliding window, fixed window.",
    relatedConcepts: ["api-gateway", "circuit-breaker", "bulkhead", "caching"],
    difficulty: "beginner",
    tags: ["throttling", "API", "token-bucket"],
  },
  {
    id: "chaos-engineering",
    name: "Chaos Engineering",
    domain: "reliability",
    description: "Discipline of experimenting on a system to build confidence in its ability to withstand turbulent conditions in production.",
    relatedConcepts: ["circuit-breaker", "bulkhead", "health-check", "observability-pillar"],
    difficulty: "advanced",
    tags: ["chaos-monkey", "resilience", "testing"],
  },
  {
    id: "health-check",
    name: "Health Check",
    domain: "reliability",
    description: "Endpoints that report the health status of a service, enabling load balancers and orchestrators to route traffic away from unhealthy instances.",
    relatedConcepts: ["load-balancer", "container-orchestration", "chaos-engineering", "alerting"],
    difficulty: "beginner",
    tags: ["monitoring", "liveness", "readiness"],
  },
  {
    id: "idempotency",
    name: "Idempotency",
    domain: "reliability",
    description: "Property where performing an operation multiple times produces the same result as performing it once. Critical for retry-safe APIs and message processing.",
    relatedConcepts: ["retry", "message-queue", "outbox-pattern", "rest"],
    difficulty: "intermediate",
    tags: ["API-design", "safety", "deduplication"],
  },

  // ── Data ─────────────────────────────────────────────────────
  {
    id: "sharding",
    name: "Sharding",
    domain: "data",
    description: "Horizontal partitioning of data across multiple database instances. Each shard holds a subset of the data, enabling horizontal scaling.",
    relatedConcepts: ["partitioning", "replication", "consistent-hashing", "nosql-database"],
    difficulty: "intermediate",
    tags: ["horizontal-scaling", "partition-key", "distribution"],
  },
  {
    id: "replication",
    name: "Replication",
    domain: "data",
    description: "Maintaining copies of data across multiple nodes for fault tolerance and read scalability. Modes: leader-follower, multi-leader, leaderless.",
    relatedConcepts: ["sharding", "cap-theorem", "consensus", "sql-database"],
    difficulty: "intermediate",
    tags: ["fault-tolerance", "read-scaling", "consistency"],
  },
  {
    id: "partitioning",
    name: "Partitioning",
    domain: "data",
    description: "Dividing a database into smaller, more manageable pieces. Can be range-based, hash-based, or list-based. Improves query performance and management.",
    relatedConcepts: ["sharding", "indexing", "sql-database"],
    difficulty: "intermediate",
    tags: ["range", "hash", "performance"],
  },
  {
    id: "indexing",
    name: "Indexing",
    domain: "data",
    description: "Data structures (B-tree, hash, GIN, GiST) that speed up data retrieval at the cost of additional storage and write overhead.",
    relatedConcepts: ["sql-database", "partitioning", "denormalization"],
    difficulty: "beginner",
    tags: ["B-tree", "hash-index", "performance"],
  },
  {
    id: "denormalization",
    name: "Denormalization",
    domain: "data",
    description: "Adding redundant data to optimize read performance by reducing joins. Trades write complexity and consistency for faster queries.",
    relatedConcepts: ["indexing", "nosql-database", "cqrs", "sql-database"],
    difficulty: "intermediate",
    tags: ["read-optimization", "redundancy", "performance"],
  },
  {
    id: "consistent-hashing",
    name: "Consistent Hashing",
    domain: "data",
    description: "Hash ring technique that minimizes key redistribution when nodes are added or removed. Essential for distributed caches and sharding.",
    relatedConcepts: ["sharding", "caching", "replication", "load-balancer"],
    difficulty: "advanced",
    tags: ["hash-ring", "distribution", "virtual-nodes"],
  },

  // ── Protocols ────────────────────────────────────────────────
  {
    id: "rest",
    name: "REST",
    domain: "protocols",
    description: "Representational State Transfer: architectural style for APIs using HTTP methods, stateless communication, and resource-oriented URLs.",
    relatedConcepts: ["grpc", "graphql", "api-gateway", "http2"],
    difficulty: "beginner",
    tags: ["HTTP", "API", "stateless"],
  },
  {
    id: "grpc",
    name: "gRPC",
    domain: "protocols",
    description: "High-performance RPC framework using Protocol Buffers for serialization and HTTP/2 for transport. Supports streaming and is ideal for microservices.",
    relatedConcepts: ["rest", "http2", "service-mesh", "graphql"],
    difficulty: "intermediate",
    tags: ["protobuf", "streaming", "microservices"],
  },
  {
    id: "graphql",
    name: "GraphQL",
    domain: "protocols",
    description: "Query language for APIs that allows clients to request exactly the data they need. Reduces over-fetching and under-fetching compared to REST.",
    relatedConcepts: ["rest", "api-gateway", "caching", "grpc"],
    difficulty: "intermediate",
    tags: ["query", "schema", "resolver"],
  },
  {
    id: "websocket",
    name: "WebSocket",
    domain: "protocols",
    description: "Full-duplex communication protocol over a single TCP connection. Enables real-time bidirectional data flow between client and server.",
    relatedConcepts: ["http2", "pub-sub", "rest", "server-sent-events"],
    difficulty: "intermediate",
    tags: ["real-time", "bidirectional", "persistent"],
  },
  {
    id: "http2",
    name: "HTTP/2",
    domain: "protocols",
    description: "Major revision of HTTP providing multiplexing, header compression, server push, and binary framing for improved performance.",
    relatedConcepts: ["rest", "grpc", "tls", "websocket"],
    difficulty: "intermediate",
    tags: ["multiplexing", "binary", "performance"],
  },
  {
    id: "server-sent-events",
    name: "Server-Sent Events",
    domain: "protocols",
    description: "One-way communication channel from server to client over HTTP. Simpler than WebSockets for scenarios that only need server-to-client streaming.",
    relatedConcepts: ["websocket", "rest", "http2"],
    difficulty: "beginner",
    tags: ["streaming", "unidirectional", "EventSource"],
  },

  // ── Security ─────────────────────────────────────────────────
  {
    id: "oauth",
    name: "OAuth 2.0",
    domain: "security",
    description: "Authorization framework that enables third-party applications to obtain limited access to user resources without exposing credentials.",
    relatedConcepts: ["jwt", "api-gateway", "cors", "oidc"],
    difficulty: "intermediate",
    tags: ["authorization", "tokens", "scopes"],
  },
  {
    id: "jwt",
    name: "JWT",
    domain: "security",
    description: "JSON Web Token: compact, URL-safe token format for securely transmitting claims between parties. Used for stateless authentication.",
    relatedConcepts: ["oauth", "api-gateway", "tls", "oidc"],
    difficulty: "beginner",
    tags: ["authentication", "stateless", "claims"],
  },
  {
    id: "tls",
    name: "TLS",
    domain: "security",
    description: "Transport Layer Security: cryptographic protocol for secure communication over networks. Provides encryption, authentication, and integrity.",
    relatedConcepts: ["http2", "mutual-tls", "cors", "reverse-proxy"],
    difficulty: "intermediate",
    tags: ["encryption", "certificates", "HTTPS"],
  },
  {
    id: "cors",
    name: "CORS",
    domain: "security",
    description: "Cross-Origin Resource Sharing: browser mechanism using HTTP headers to allow a server to indicate origins other than its own from which resources can be loaded.",
    relatedConcepts: ["rest", "api-gateway", "tls", "oauth"],
    difficulty: "beginner",
    tags: ["browser", "headers", "origin"],
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    domain: "security",
    description: "Single entry point for API requests providing routing, authentication, rate limiting, protocol translation, and request aggregation.",
    relatedConcepts: ["load-balancer", "rate-limiting", "oauth", "rest"],
    difficulty: "intermediate",
    tags: ["routing", "authentication", "aggregation"],
  },
  {
    id: "mutual-tls",
    name: "Mutual TLS",
    domain: "security",
    description: "Both client and server authenticate each other using certificates. Provides stronger security for service-to-service communication.",
    relatedConcepts: ["tls", "service-mesh", "api-gateway"],
    difficulty: "advanced",
    tags: ["mTLS", "certificates", "zero-trust"],
  },
  {
    id: "oidc",
    name: "OpenID Connect",
    domain: "security",
    description: "Identity layer on top of OAuth 2.0 that provides authentication. Returns an ID token containing user identity claims.",
    relatedConcepts: ["oauth", "jwt", "api-gateway"],
    difficulty: "intermediate",
    tags: ["identity", "authentication", "SSO"],
  },

  // ── Observability ────────────────────────────────────────────
  {
    id: "logging",
    name: "Logging",
    domain: "observability",
    description: "Recording discrete events with structured data for debugging and auditing. Centralized logging aggregates logs from all services.",
    relatedConcepts: ["metrics", "tracing", "alerting", "time-series-db"],
    difficulty: "beginner",
    tags: ["ELK", "structured", "aggregation"],
  },
  {
    id: "metrics",
    name: "Metrics",
    domain: "observability",
    description: "Numerical measurements collected over time: counters, gauges, histograms. Enable monitoring dashboards and alerting thresholds.",
    relatedConcepts: ["logging", "tracing", "alerting", "auto-scaling"],
    difficulty: "beginner",
    tags: ["prometheus", "grafana", "dashboard"],
  },
  {
    id: "tracing",
    name: "Distributed Tracing",
    domain: "observability",
    description: "Tracks requests as they flow through microservices, providing end-to-end visibility with trace IDs, spans, and latency breakdowns.",
    relatedConcepts: ["logging", "metrics", "service-mesh", "alerting"],
    difficulty: "intermediate",
    tags: ["jaeger", "zipkin", "OpenTelemetry"],
  },
  {
    id: "alerting",
    name: "Alerting",
    domain: "observability",
    description: "Automated notifications triggered when metrics cross defined thresholds. Supports escalation policies and on-call rotation.",
    relatedConcepts: ["metrics", "logging", "health-check", "chaos-engineering"],
    difficulty: "beginner",
    tags: ["PagerDuty", "thresholds", "on-call"],
  },
  {
    id: "observability-pillar",
    name: "Observability",
    domain: "observability",
    description: "The ability to understand a system's internal state from its external outputs. Built on three pillars: logs, metrics, and traces.",
    relatedConcepts: ["logging", "metrics", "tracing", "chaos-engineering"],
    difficulty: "intermediate",
    tags: ["three-pillars", "OpenTelemetry", "SRE"],
  },

  // ── Patterns ─────────────────────────────────────────────────
  {
    id: "cqrs",
    name: "CQRS",
    domain: "patterns",
    description: "Command Query Responsibility Segregation: separates read and write models, allowing independent optimization and scaling of each.",
    relatedConcepts: ["event-sourcing", "denormalization", "stream-processing", "saga"],
    difficulty: "advanced",
    tags: ["read-model", "write-model", "separation"],
  },
  {
    id: "event-sourcing",
    name: "Event Sourcing",
    domain: "patterns",
    description: "Stores state changes as a sequence of immutable events rather than current state. Enables complete audit trail and temporal queries.",
    relatedConcepts: ["cqrs", "event-bus", "stream-processing", "saga"],
    difficulty: "advanced",
    tags: ["event-store", "replay", "audit"],
  },
  {
    id: "saga",
    name: "Saga Pattern",
    domain: "patterns",
    description: "Manages distributed transactions by breaking them into a sequence of local transactions with compensating actions for rollback.",
    relatedConcepts: ["two-phase-commit", "event-sourcing", "message-queue", "outbox-pattern"],
    difficulty: "advanced",
    tags: ["choreography", "orchestration", "compensation"],
  },
  {
    id: "two-phase-commit",
    name: "Two-Phase Commit",
    domain: "patterns",
    description: "Distributed transaction protocol ensuring all participants either commit or abort. Provides atomicity at the cost of blocking and availability.",
    relatedConcepts: ["saga", "consensus", "replication"],
    difficulty: "advanced",
    tags: ["2PC", "atomicity", "blocking"],
  },
  {
    id: "outbox-pattern",
    name: "Outbox Pattern",
    domain: "patterns",
    description: "Ensures reliable event publishing by writing events to an outbox table within the same database transaction, then asynchronously publishing them.",
    relatedConcepts: ["saga", "message-queue", "event-sourcing", "idempotency"],
    difficulty: "advanced",
    tags: ["transactional-outbox", "CDC", "reliability"],
  },
  {
    id: "strangler-fig",
    name: "Strangler Fig",
    domain: "patterns",
    description: "Migration pattern that gradually replaces a legacy system by routing traffic to new implementations, eventually decommissioning the old system.",
    relatedConcepts: ["api-gateway", "reverse-proxy", "load-balancer"],
    difficulty: "intermediate",
    tags: ["migration", "legacy", "incremental"],
  },
  {
    id: "sidecar",
    name: "Sidecar Pattern",
    domain: "patterns",
    description: "Deploys a helper container alongside the primary service to handle cross-cutting concerns like logging, monitoring, and networking.",
    relatedConcepts: ["service-mesh", "container-orchestration", "tracing", "logging"],
    difficulty: "intermediate",
    tags: ["envoy", "proxy", "cross-cutting"],
  },

  // ── Distributed ──────────────────────────────────────────────
  {
    id: "cap-theorem",
    name: "CAP Theorem",
    domain: "distributed",
    description: "States that a distributed system can provide at most two of three guarantees: Consistency, Availability, and Partition tolerance.",
    relatedConcepts: ["consensus", "replication", "nosql-database", "vector-clocks"],
    difficulty: "intermediate",
    tags: ["trade-offs", "consistency", "availability"],
  },
  {
    id: "consensus",
    name: "Consensus",
    domain: "distributed",
    description: "Process by which distributed nodes agree on a single value. Algorithms include Raft, Paxos, and Zab. Critical for leader election and replication.",
    relatedConcepts: ["cap-theorem", "replication", "two-phase-commit", "vector-clocks"],
    difficulty: "advanced",
    tags: ["raft", "paxos", "leader-election"],
  },
  {
    id: "vector-clocks",
    name: "Vector Clocks",
    domain: "distributed",
    description: "Logical clock mechanism that captures causal relationships between events in a distributed system. Each node maintains a vector of counters.",
    relatedConcepts: ["cap-theorem", "consensus", "crdts", "replication"],
    difficulty: "advanced",
    tags: ["causality", "ordering", "conflict-detection"],
  },
  {
    id: "gossip-protocol",
    name: "Gossip Protocol",
    domain: "distributed",
    description: "Peer-to-peer communication protocol where nodes periodically exchange state information with random peers, eventually achieving consistency.",
    relatedConcepts: ["consensus", "health-check", "crdts", "consistent-hashing"],
    difficulty: "advanced",
    tags: ["epidemic", "membership", "failure-detection"],
  },
  {
    id: "crdts",
    name: "CRDTs",
    domain: "distributed",
    description: "Conflict-free Replicated Data Types: data structures that can be replicated across multiple nodes and updated independently with guaranteed convergence.",
    relatedConcepts: ["vector-clocks", "gossip-protocol", "cap-theorem", "replication"],
    difficulty: "advanced",
    tags: ["eventual-consistency", "merge", "collaboration"],
  },
  {
    id: "distributed-locking",
    name: "Distributed Locking",
    domain: "distributed",
    description: "Mechanism to coordinate exclusive access to shared resources across distributed nodes. Implementations use Redlock, ZooKeeper, or etcd.",
    relatedConcepts: ["consensus", "two-phase-commit", "caching"],
    difficulty: "advanced",
    tags: ["redlock", "fencing-token", "coordination"],
  },
];

// ── Relationships ──────────────────────────────────────────────

export const RELATIONSHIPS: ConceptRelationship[] = [
  // Compute relationships
  { source: "load-balancer", target: "auto-scaling", type: "uses", label: "triggers scaling" },
  { source: "load-balancer", target: "reverse-proxy", type: "enhances" },
  { source: "auto-scaling", target: "container-orchestration", type: "part-of" },
  { source: "auto-scaling", target: "metrics", type: "depends-on", label: "monitors" },
  { source: "container-orchestration", target: "service-mesh", type: "uses" },
  { source: "serverless", target: "auto-scaling", type: "uses" },
  { source: "serverless", target: "event-bus", type: "uses", label: "triggered by" },
  { source: "serverless", target: "container-orchestration", type: "alternative-to" },

  // Storage relationships
  { source: "sql-database", target: "nosql-database", type: "alternative-to" },
  { source: "sql-database", target: "indexing", type: "uses" },
  { source: "sql-database", target: "replication", type: "uses" },
  { source: "nosql-database", target: "sharding", type: "uses" },
  { source: "nosql-database", target: "cap-theorem", type: "depends-on" },
  { source: "cdn", target: "caching", type: "uses" },
  { source: "cdn", target: "object-storage", type: "uses", label: "serves from" },
  { source: "caching", target: "sql-database", type: "enhances", label: "reduces load" },
  { source: "time-series-db", target: "metrics", type: "uses", label: "stores" },

  // Messaging relationships
  { source: "message-queue", target: "pub-sub", type: "alternative-to" },
  { source: "event-bus", target: "pub-sub", type: "uses" },
  { source: "pub-sub", target: "stream-processing", type: "enhances" },
  { source: "stream-processing", target: "event-sourcing", type: "uses" },
  { source: "dead-letter-queue", target: "message-queue", type: "part-of" },
  { source: "dead-letter-queue", target: "retry", type: "depends-on" },
  { source: "event-streaming", target: "pub-sub", type: "enhances" },
  { source: "event-streaming", target: "event-sourcing", type: "uses" },

  // Reliability relationships
  { source: "circuit-breaker", target: "retry", type: "enhances" },
  { source: "circuit-breaker", target: "bulkhead", type: "enhances" },
  { source: "circuit-breaker", target: "service-mesh", type: "part-of" },
  { source: "rate-limiting", target: "api-gateway", type: "part-of" },
  { source: "chaos-engineering", target: "circuit-breaker", type: "uses", label: "validates" },
  { source: "chaos-engineering", target: "health-check", type: "uses" },
  { source: "health-check", target: "load-balancer", type: "depends-on" },
  { source: "retry", target: "idempotency", type: "depends-on" },

  // Data relationships
  { source: "sharding", target: "consistent-hashing", type: "uses" },
  { source: "sharding", target: "replication", type: "enhances" },
  { source: "partitioning", target: "sharding", type: "part-of" },
  { source: "partitioning", target: "indexing", type: "enhances" },
  { source: "denormalization", target: "cqrs", type: "uses" },
  { source: "consistent-hashing", target: "load-balancer", type: "uses" },

  // Protocol relationships
  { source: "rest", target: "grpc", type: "alternative-to" },
  { source: "rest", target: "graphql", type: "alternative-to" },
  { source: "grpc", target: "http2", type: "depends-on" },
  { source: "websocket", target: "server-sent-events", type: "alternative-to" },
  { source: "http2", target: "tls", type: "depends-on" },

  // Security relationships
  { source: "oauth", target: "jwt", type: "uses" },
  { source: "oauth", target: "api-gateway", type: "part-of" },
  { source: "oidc", target: "oauth", type: "enhances" },
  { source: "tls", target: "mutual-tls", type: "part-of" },
  { source: "mutual-tls", target: "service-mesh", type: "part-of" },
  { source: "cors", target: "api-gateway", type: "part-of" },

  // Observability relationships
  { source: "logging", target: "observability-pillar", type: "part-of" },
  { source: "metrics", target: "observability-pillar", type: "part-of" },
  { source: "tracing", target: "observability-pillar", type: "part-of" },
  { source: "alerting", target: "metrics", type: "depends-on" },
  { source: "tracing", target: "service-mesh", type: "part-of" },

  // Pattern relationships
  { source: "cqrs", target: "event-sourcing", type: "uses" },
  { source: "event-sourcing", target: "saga", type: "enhances" },
  { source: "saga", target: "two-phase-commit", type: "alternative-to" },
  { source: "saga", target: "outbox-pattern", type: "uses" },
  { source: "outbox-pattern", target: "message-queue", type: "depends-on" },
  { source: "sidecar", target: "service-mesh", type: "part-of" },
  { source: "strangler-fig", target: "api-gateway", type: "uses" },

  // Distributed relationships
  { source: "cap-theorem", target: "consensus", type: "depends-on" },
  { source: "consensus", target: "replication", type: "uses" },
  { source: "vector-clocks", target: "crdts", type: "enhances" },
  { source: "gossip-protocol", target: "crdts", type: "uses" },
  { source: "gossip-protocol", target: "consistent-hashing", type: "uses" },
  { source: "distributed-locking", target: "consensus", type: "depends-on" },
];

// ── Helpers ────────────────────────────────────────────────────

const conceptMap = new Map(CONCEPTS.map((c) => [c.id, c]));

export function getConceptById(id: string): Concept | undefined {
  return conceptMap.get(id);
}

export function getConceptsByDomain(domain: ConceptDomain): Concept[] {
  return CONCEPTS.filter((c) => c.domain === domain);
}

export function getRelationshipsForConcept(id: string): ConceptRelationship[] {
  return RELATIONSHIPS.filter((r) => r.source === id || r.target === id);
}

export function getConnectionCount(id: string): number {
  return RELATIONSHIPS.filter((r) => r.source === id || r.target === id).length;
}

/** BFS to find shortest path between two concepts. */
export function findPath(startId: string, endId: string): string[] | null {
  if (startId === endId) return [startId];

  const adj = new Map<string, string[]>();
  for (const r of RELATIONSHIPS) {
    if (!adj.has(r.source)) adj.set(r.source, []);
    if (!adj.has(r.target)) adj.set(r.target, []);
    adj.get(r.source)!.push(r.target);
    adj.get(r.target)!.push(r.source);
  }

  const visited = new Set<string>([startId]);
  const parent = new Map<string, string>();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = adj.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      parent.set(neighbor, current);
      if (neighbor === endId) {
        const path: string[] = [];
        let node: string | undefined = endId;
        while (node !== undefined) {
          path.unshift(node);
          node = parent.get(node);
        }
        return path;
      }
      queue.push(neighbor);
    }
  }

  return null;
}

/** All domains as an ordered array. */
export const ALL_DOMAINS: ConceptDomain[] = [
  "compute",
  "storage",
  "messaging",
  "reliability",
  "data",
  "protocols",
  "security",
  "observability",
  "patterns",
  "distributed",
];
