// ─────────────────────────────────────────────────────────────
// Architex — Architecture Playbook Library  (INO-035)
// Battle-tested patterns with documentation, nodes, and edges.
// ─────────────────────────────────────────────────────────────

import type { Node, Edge } from '@xyflow/react';

// ── Interface ─────────────────────────────────────────────────

export interface ArchitecturePlaybook {
  id: string;
  name: string;
  category: string;
  description: string;
  whenToUse: string[];
  whenNotToUse: string[];
  nodes: Node[];
  edges: Edge[];
  failureModes: string[];
  theory: string;
}

// ── Helpers ───────────────────────────────────────────────────

let _seq = 0;
function nid(prefix: string) {
  return `pb-${prefix}-${++_seq}`;
}

function eid(source: string, target: string) {
  return `e-${source}-${target}`;
}

function mkNode(
  id: string,
  type: string,
  label: string,
  category: string,
  componentType: string,
  icon: string,
  x: number,
  y: number,
  config: Record<string, number | string | boolean> = {},
): Node {
  return {
    id,
    type,
    position: { x, y },
    data: {
      label,
      category,
      componentType,
      icon,
      config,
      state: 'idle',
    },
  };
}

function mkEdge(
  source: string,
  target: string,
  edgeType: string,
  animated = false,
  label?: string,
): Edge {
  return {
    id: eid(source, target),
    source,
    target,
    type: 'data-flow',
    data: { edgeType, animated },
    ...(label ? { label } : {}),
  };
}

// ── 1. Cache-Aside Pattern ────────────────────────────────────

function cacheAside(): ArchitecturePlaybook {
  _seq = 0;
  const client = nid('ca');      // 1
  const appServer = nid('ca');   // 2
  const cache = nid('ca');       // 3
  const db = nid('ca');          // 4

  return {
    id: 'cache-aside',
    name: 'Cache-Aside Pattern',
    category: 'Caching',
    description:
      'Read from cache first; on a miss, read from the database and populate the cache. The application is responsible for loading data into the cache.',
    whenToUse: [
      'Read-heavy workloads with repeated access to the same data',
      'When data staleness for a short TTL is acceptable',
      'When the backing store is expensive to query',
      'When you need independent cache and database scaling',
    ],
    whenNotToUse: [
      'Write-heavy workloads where the cache would be constantly invalidated',
      'Data that changes frequently and must always be fresh',
      'When cache infrastructure adds unjustified complexity for small datasets',
    ],
    nodes: [
      mkNode(client, 'web-client', 'Client', 'client', 'web-client', 'Monitor', 50, 200),
      mkNode(appServer, 'app-server', 'App Server', 'compute', 'app-server', 'Server', 300, 200),
      mkNode(cache, 'cache', 'Cache (Redis)', 'storage', 'cache', 'Zap', 550, 80, { type: 'redis', memoryGB: 8, evictionPolicy: 'lru', ttlSeconds: 3600 }),
      mkNode(db, 'database', 'Database', 'storage', 'database', 'Database', 550, 330, { type: 'postgresql', replicas: 1, maxConnections: 100, storageGB: 100 }),
    ],
    edges: [
      mkEdge(client, appServer, 'http', true, 'request'),
      mkEdge(appServer, cache, 'cache-lookup', true, '1. check cache'),
      mkEdge(appServer, db, 'db-query', false, '2. on miss: query DB'),
      mkEdge(db, appServer, 'db-query', false, '3. return data'),
      mkEdge(appServer, cache, 'cache-lookup', false, '4. populate cache'),
    ],
    failureModes: [
      'Cache stampede: many concurrent misses for the same key overwhelm the DB',
      'Stale data: cache holds outdated values until TTL expires',
      'Cold start: empty cache causes a thundering herd on startup',
      'Inconsistency window: DB writes are not reflected until cache entry expires',
    ],
    theory:
      'Rooted in temporal locality of reference. Frequently accessed data ("hot" keys) remain in O(1) memory lookups, while infrequent data falls through to disk-backed storage. The LRU eviction policy approximates the optimal Belady algorithm for unknown future access patterns.',
  };
}

// ── 2. Write-Behind Cache ─────────────────────────────────────

function writeBehind(): ArchitecturePlaybook {
  _seq = 0;
  const client = nid('wb');
  const appServer = nid('wb');
  const cache = nid('wb');
  const queue = nid('wb');
  const worker = nid('wb');
  const db = nid('wb');

  return {
    id: 'write-behind',
    name: 'Write-Behind Cache',
    category: 'Caching',
    description:
      'Write data to the cache immediately and asynchronously persist to the database via a background worker. Provides low write latency at the cost of durability guarantees.',
    whenToUse: [
      'Write-heavy workloads where latency matters more than immediate consistency',
      'Buffering bursty writes to protect a slower database',
      'Event counting, analytics, or session data',
      'When you can tolerate eventual consistency',
    ],
    whenNotToUse: [
      'Financial transactions requiring strong consistency',
      'When data loss on cache failure is unacceptable',
      'Systems with strict audit/compliance requirements',
    ],
    nodes: [
      mkNode(client, 'web-client', 'Client', 'client', 'web-client', 'Monitor', 50, 200),
      mkNode(appServer, 'app-server', 'App Server', 'compute', 'app-server', 'Server', 280, 200),
      mkNode(cache, 'cache', 'Cache (Redis)', 'storage', 'cache', 'Zap', 510, 200, { type: 'redis', memoryGB: 16, evictionPolicy: 'lru', ttlSeconds: 7200 }),
      mkNode(queue, 'message-queue', 'Write Queue', 'messaging', 'message-queue', 'ListOrdered', 740, 200, { type: 'kafka', partitions: 3 }),
      mkNode(worker, 'worker', 'Persist Worker', 'compute', 'worker', 'Cog', 740, 380),
      mkNode(db, 'database', 'Database', 'storage', 'database', 'Database', 510, 380, { type: 'postgresql', replicas: 2, maxConnections: 100, storageGB: 200 }),
    ],
    edges: [
      mkEdge(client, appServer, 'http', true),
      mkEdge(appServer, cache, 'cache-lookup', true, 'write to cache'),
      mkEdge(cache, queue, 'event-stream', true, 'enqueue write'),
      mkEdge(queue, worker, 'message-queue', true, 'consume'),
      mkEdge(worker, db, 'db-query', false, 'persist'),
    ],
    failureModes: [
      'Data loss: cache crash before async persist causes writes to vanish',
      'Queue backpressure: database cannot keep up with buffered write volume',
      'Ordering issues: concurrent writes may reach the DB out of order',
      'Retry storms: failed persists clog the dead-letter queue',
    ],
    theory:
      'Implements a write buffer analogous to the OS page cache (dirty pages flushed lazily). Based on the principle that batching amortizes I/O cost. The producer-consumer model decouples write acceptance latency from storage latency, achieving higher throughput via Little\'s Law.',
  };
}

// ── 3. Circuit Breaker ────────────────────────────────────────

function circuitBreaker(): ArchitecturePlaybook {
  _seq = 0;
  const client = nid('cb');
  const gateway = nid('cb');
  const breaker = nid('cb');
  const serviceA = nid('cb');
  const serviceB = nid('cb');
  const fallback = nid('cb');
  const metrics = nid('cb');

  return {
    id: 'circuit-breaker',
    name: 'Circuit Breaker',
    category: 'Resilience',
    description:
      'Detect failures in downstream dependencies and trip a breaker to fail fast, preventing cascading failures. Periodically allow trial requests (half-open) to test recovery.',
    whenToUse: [
      'Calls to unreliable or high-latency external services',
      'Preventing cascading failures in microservice architectures',
      'When graceful degradation is preferable to slow failures',
      'Protecting thread pools from exhaustion by hanging calls',
    ],
    whenNotToUse: [
      'In-process calls where failure is cheap and immediate',
      'When there is no viable fallback behavior',
      'Fire-and-forget or best-effort operations',
    ],
    nodes: [
      mkNode(client, 'web-client', 'Client', 'client', 'web-client', 'Monitor', 50, 200),
      mkNode(gateway, 'api-gateway', 'API Gateway', 'load-balancing', 'api-gateway', 'Shield', 280, 200, { rateLimitRps: 10000, authType: 'jwt', timeoutMs: 5000 }),
      mkNode(breaker, 'rate-limiter', 'Circuit Breaker', 'security', 'rate-limiter', 'Gauge', 510, 200, { algorithm: 'circuit-breaker', limitRps: 1000, windowSeconds: 30 }),
      mkNode(serviceA, 'app-server', 'Service A', 'compute', 'app-server', 'Server', 740, 100),
      mkNode(serviceB, 'third-party-api', 'Service B (Unstable)', 'client', 'third-party-api', 'ExternalLink', 740, 300, { rateLimitRps: 100, latencyMs: 2000, errorRate: 0.15 }),
      mkNode(fallback, 'cache', 'Fallback Cache', 'storage', 'cache', 'Zap', 510, 400, { type: 'redis', memoryGB: 4 }),
      mkNode(metrics, 'metrics-collector', 'Metrics', 'observability', 'metrics-collector', 'BarChart3', 280, 400),
    ],
    edges: [
      mkEdge(client, gateway, 'http', true),
      mkEdge(gateway, breaker, 'http', true),
      mkEdge(breaker, serviceA, 'http', true, 'closed: forward'),
      mkEdge(breaker, serviceB, 'http', false, 'half-open: probe'),
      mkEdge(breaker, fallback, 'cache-lookup', false, 'open: fallback'),
      mkEdge(breaker, metrics, 'event-stream', false, 'state changes'),
    ],
    failureModes: [
      'Threshold too sensitive: breaker trips on transient glitches',
      'Threshold too lenient: cascading failure spreads before breaker opens',
      'Half-open thundering herd: too many trial requests overwhelm recovering service',
      'Stale fallback: cached fallback data diverges significantly from truth',
    ],
    theory:
      'Modeled after electrical circuit breakers. Implements a finite state machine (Closed -> Open -> Half-Open). Thresholds derive from the Exponentially Weighted Moving Average (EWMA) of error rates. Related to the bulkhead pattern from ship compartmentalization.',
  };
}

// ── 4. CQRS ───────────────────────────────────────────────────

function cqrs(): ArchitecturePlaybook {
  _seq = 0;
  const client = nid('cq');
  const cmdApi = nid('cq');
  const queryApi = nid('cq');
  const eventBus = nid('cq');
  const writeDb = nid('cq');
  const readDb = nid('cq');
  const projector = nid('cq');

  return {
    id: 'cqrs',
    name: 'CQRS',
    category: 'Architecture',
    description:
      'Command Query Responsibility Segregation: separate read and write models with an event bus. Write side emits domain events; read side builds optimized materialized views. Optionally paired with event sourcing.',
    whenToUse: [
      'Asymmetric read/write loads (read-heavy or write-heavy)',
      'Complex domain logic that benefits from dedicated write models',
      'When read models need different shapes (denormalized views)',
      'Event sourcing for full audit trail and temporal queries',
    ],
    whenNotToUse: [
      'Simple CRUD applications with symmetric read/write patterns',
      'When eventual consistency between read and write models is unacceptable',
      'Small teams where the operational overhead is unjustified',
    ],
    nodes: [
      mkNode(client, 'web-client', 'Client', 'client', 'web-client', 'Monitor', 50, 220),
      mkNode(cmdApi, 'app-server', 'Command API', 'compute', 'app-server', 'Server', 300, 100),
      mkNode(queryApi, 'app-server', 'Query API', 'compute', 'app-server', 'Server', 300, 350),
      mkNode(writeDb, 'database', 'Write Store (Event Log)', 'storage', 'database', 'Database', 560, 100, { type: 'postgresql', replicas: 1 }),
      mkNode(eventBus, 'event-bus', 'Event Bus', 'messaging', 'event-bus', 'Route', 560, 220),
      mkNode(projector, 'stream-processor', 'Projector', 'processing', 'stream-processor', 'Workflow', 560, 350),
      mkNode(readDb, 'document-db', 'Read Store (Views)', 'storage', 'document-db', 'FileJson', 780, 350, { shards: 3, replicaSetSize: 3 }),
    ],
    edges: [
      mkEdge(client, cmdApi, 'http', true, 'commands'),
      mkEdge(client, queryApi, 'http', true, 'queries'),
      mkEdge(cmdApi, writeDb, 'db-query', true, 'persist events'),
      mkEdge(cmdApi, eventBus, 'event-stream', true, 'publish events'),
      mkEdge(eventBus, projector, 'event-stream', true, 'subscribe'),
      mkEdge(projector, readDb, 'db-query', true, 'update views'),
      mkEdge(queryApi, readDb, 'db-query', true, 'read views'),
    ],
    failureModes: [
      'Projection lag: read model falls behind, showing stale data',
      'Event schema evolution: changing event shapes breaks consumers',
      'Replay storms: rebuilding projections from scratch is slow',
      'Complexity tax: two data models double operational burden',
    ],
    theory:
      'Derived from Bertrand Meyer\'s CQS principle and Greg Young\'s event sourcing. The read model is a materialized view (database theory), rebuilt via event replay (append-only log). Consistency follows the BASE model (Basically Available, Soft-state, Eventually consistent).',
  };
}

// ── 5. Saga (Choreography) ────────────────────────────────────

function sagaChoreography(): ArchitecturePlaybook {
  _seq = 0;
  const orderSvc = nid('sg');
  const eventBus = nid('sg');
  const paymentSvc = nid('sg');
  const inventorySvc = nid('sg');
  const shippingSvc = nid('sg');
  const orderDb = nid('sg');
  const paymentDb = nid('sg');
  const inventoryDb = nid('sg');

  return {
    id: 'saga-choreography',
    name: 'Saga (Choreography)',
    category: 'Distributed Transactions',
    description:
      'Coordinate a multi-step distributed transaction through event-driven choreography. Each service listens for events, performs its step, and publishes the next event. Compensating actions undo previous steps on failure.',
    whenToUse: [
      'Distributed transactions across multiple microservices',
      'When two-phase commit (2PC) is impractical or too slow',
      'Long-running business processes with compensating actions',
      'Loose coupling between services is a priority',
    ],
    whenNotToUse: [
      'Simple transactions that fit in a single database',
      'When strong consistency across services is mandatory (use 2PC)',
      'Small monoliths where distributed coordination is overkill',
    ],
    nodes: [
      mkNode(orderSvc, 'app-server', 'Order Service', 'compute', 'app-server', 'Server', 50, 100),
      mkNode(eventBus, 'event-bus', 'Event Bus', 'messaging', 'event-bus', 'Route', 310, 220),
      mkNode(paymentSvc, 'app-server', 'Payment Service', 'compute', 'app-server', 'Server', 560, 50),
      mkNode(inventorySvc, 'app-server', 'Inventory Service', 'compute', 'app-server', 'Server', 560, 220),
      mkNode(shippingSvc, 'app-server', 'Shipping Service', 'compute', 'app-server', 'Server', 560, 390),
      mkNode(orderDb, 'database', 'Order DB', 'storage', 'database', 'Database', 50, 300),
      mkNode(paymentDb, 'database', 'Payment DB', 'storage', 'database', 'Database', 810, 50),
      mkNode(inventoryDb, 'database', 'Inventory DB', 'storage', 'database', 'Database', 810, 220),
    ],
    edges: [
      mkEdge(orderSvc, eventBus, 'event-stream', true, 'OrderCreated'),
      mkEdge(eventBus, paymentSvc, 'event-stream', true, 'process payment'),
      mkEdge(eventBus, inventorySvc, 'event-stream', true, 'reserve stock'),
      mkEdge(paymentSvc, eventBus, 'event-stream', false, 'PaymentCompleted'),
      mkEdge(inventorySvc, eventBus, 'event-stream', false, 'StockReserved'),
      mkEdge(eventBus, shippingSvc, 'event-stream', true, 'ship order'),
      mkEdge(orderSvc, orderDb, 'db-query', false),
      mkEdge(paymentSvc, paymentDb, 'db-query', false),
      mkEdge(inventorySvc, inventoryDb, 'db-query', false),
    ],
    failureModes: [
      'Lost events: message broker failure causes missed steps',
      'Compensation failure: undo actions fail, leaving partial state',
      'Cyclic events: misconfigured routing creates infinite loops',
      'Observability gap: tracing a saga across services is difficult',
      'Semantic coupling: services must understand each other\'s events',
    ],
    theory:
      'Based on Hector Garcia-Molina\'s 1987 "Sagas" paper. Each step Ti has a compensating transaction Ci. On failure at step k, compensations Ck-1...C1 execute in reverse. Choreography uses event-driven pub/sub (reactive), contrasted with orchestration (imperative). Relates to the Outbox Pattern for reliable event publishing.',
  };
}

// ── 6. Rate Limiting (Token Bucket) ───────────────────────────

function rateLimitingTokenBucket(): ArchitecturePlaybook {
  _seq = 0;
  const client = nid('rl');
  const gateway = nid('rl');
  const limiter = nid('rl');
  const tokenStore = nid('rl');
  const service = nid('rl');
  const dlq = nid('rl');

  return {
    id: 'rate-limiting-token-bucket',
    name: 'Rate Limiting (Token Bucket)',
    category: 'Resilience',
    description:
      'Throttle incoming requests using the token bucket algorithm. Tokens refill at a fixed rate; each request consumes a token. When the bucket is empty, requests are rejected (429) or queued.',
    whenToUse: [
      'Protecting APIs from abuse or accidental overload',
      'Enforcing fair usage across tenants (multi-tenant SaaS)',
      'Smoothing bursty traffic before it reaches downstream services',
      'Meeting contractual SLA rate limits with upstream providers',
    ],
    whenNotToUse: [
      'Internal service-to-service calls in a trusted network (prefer backpressure)',
      'When strict fairness requires a different algorithm (leaky bucket, sliding window)',
      'Batch workloads where throttling harms throughput',
    ],
    nodes: [
      mkNode(client, 'web-client', 'Client', 'client', 'web-client', 'Monitor', 50, 200),
      mkNode(gateway, 'api-gateway', 'API Gateway', 'load-balancing', 'api-gateway', 'Shield', 280, 200),
      mkNode(limiter, 'rate-limiter', 'Rate Limiter', 'security', 'rate-limiter', 'Gauge', 510, 200, { algorithm: 'token-bucket', limitRps: 1000, windowSeconds: 60 }),
      mkNode(tokenStore, 'cache', 'Token Store (Redis)', 'storage', 'cache', 'Zap', 510, 380, { type: 'redis', memoryGB: 2, evictionPolicy: 'noeviction', ttlSeconds: 60 }),
      mkNode(service, 'app-server', 'Backend Service', 'compute', 'app-server', 'Server', 740, 200),
      mkNode(dlq, 'message-queue', 'Rejected / DLQ', 'messaging', 'message-queue', 'ListOrdered', 280, 380),
    ],
    edges: [
      mkEdge(client, gateway, 'http', true),
      mkEdge(gateway, limiter, 'http', true, 'check limit'),
      mkEdge(limiter, tokenStore, 'cache-lookup', true, 'decrement token'),
      mkEdge(limiter, service, 'http', true, 'allowed'),
      mkEdge(limiter, dlq, 'event-stream', false, '429 rejected'),
    ],
    failureModes: [
      'Clock skew: distributed token stores disagree on refill time',
      'Race condition: concurrent requests consume the same token (use Lua scripts)',
      'Unfair distribution: large bursts starve well-behaved clients',
      'Redis failure: open-fail (allow all) vs closed-fail (deny all) trade-off',
    ],
    theory:
      'The token bucket is a classic traffic-shaping algorithm from network QoS (RFC 2697). Tokens arrive at rate r into a bucket of capacity b. A request of cost 1 is served if tokens >= 1, else rejected. Burst capacity equals the bucket depth b. Equivalent to a leaky bucket on the departure side. Distributed implementations use Redis MULTI/EXEC or Lua atomicity.',
  };
}

// ── 7. Sidecar / Service Mesh ─────────────────────────────────

function sidecarServiceMesh(): ArchitecturePlaybook {
  _seq = 0;
  const serviceA = nid('sm');
  const proxyA = nid('sm');
  const serviceB = nid('sm');
  const proxyB = nid('sm');
  const serviceC = nid('sm');
  const proxyC = nid('sm');
  const controlPlane = nid('sm');
  const observability = nid('sm');

  return {
    id: 'sidecar-service-mesh',
    name: 'Sidecar / Service Mesh',
    category: 'Infrastructure',
    description:
      'Deploy a proxy sidecar alongside each service instance. The mesh proxies handle mTLS, retries, circuit breaking, and observability transparently, decoupling cross-cutting concerns from application code.',
    whenToUse: [
      'Polyglot microservice environments needing uniform observability',
      'Zero-trust networking with mTLS between all services',
      'When consistent retry/timeout/circuit-breaker policies are needed',
      'Canary deployments and traffic shifting without app changes',
    ],
    whenNotToUse: [
      'Monoliths or small service counts where the overhead is too high',
      'Latency-critical paths where proxy hop adds unacceptable delay',
      'Teams lacking operational expertise to manage mesh infrastructure',
    ],
    nodes: [
      mkNode(serviceA, 'app-server', 'Service A', 'compute', 'app-server', 'Server', 50, 100),
      mkNode(proxyA, 'reverse-proxy', 'Sidecar Proxy A', 'load-balancing', 'reverse-proxy', 'Globe2', 50, 270),
      mkNode(serviceB, 'app-server', 'Service B', 'compute', 'app-server', 'Server', 380, 100),
      mkNode(proxyB, 'reverse-proxy', 'Sidecar Proxy B', 'load-balancing', 'reverse-proxy', 'Globe2', 380, 270),
      mkNode(serviceC, 'app-server', 'Service C', 'compute', 'app-server', 'Server', 700, 100),
      mkNode(proxyC, 'reverse-proxy', 'Sidecar Proxy C', 'load-balancing', 'reverse-proxy', 'Globe2', 700, 270),
      mkNode(controlPlane, 'api-gateway', 'Control Plane (Istiod)', 'load-balancing', 'api-gateway', 'Shield', 380, 440, { rateLimitRps: 100000, authType: 'mtls', timeoutMs: 5000 }),
      mkNode(observability, 'metrics-collector', 'Observability Stack', 'observability', 'metrics-collector', 'BarChart3', 700, 440),
    ],
    edges: [
      mkEdge(serviceA, proxyA, 'http', false, 'outbound'),
      mkEdge(proxyA, proxyB, 'grpc', true, 'mTLS'),
      mkEdge(proxyB, serviceB, 'http', false, 'inbound'),
      mkEdge(serviceB, proxyB, 'http', false, 'outbound'),
      mkEdge(proxyB, proxyC, 'grpc', true, 'mTLS'),
      mkEdge(proxyC, serviceC, 'http', false, 'inbound'),
      mkEdge(controlPlane, proxyA, 'grpc', false, 'config push'),
      mkEdge(controlPlane, proxyB, 'grpc', false, 'config push'),
      mkEdge(controlPlane, proxyC, 'grpc', false, 'config push'),
      mkEdge(proxyA, observability, 'event-stream', false, 'telemetry'),
      mkEdge(proxyB, observability, 'event-stream', false, 'telemetry'),
      mkEdge(proxyC, observability, 'event-stream', false, 'telemetry'),
    ],
    failureModes: [
      'Sidecar crash: proxy failure takes down traffic to/from the service',
      'Control plane outage: proxies use stale config, new services cannot join',
      'Added latency: each hop adds ~1-2ms, multiplied across call chains',
      'Resource overhead: sidecar memory/CPU consumption per pod adds up',
      'Configuration drift: mismatched proxy versions across services',
    ],
    theory:
      'The sidecar pattern is a structural decomposition from the Ambassador/Adapter/Sidecar family in distributed systems. Service meshes implement the data plane / control plane separation. Data plane proxies (Envoy) handle L4/L7 traffic; the control plane (Istiod) distributes configuration via xDS APIs. Observability is achieved through distributed tracing (OpenTelemetry) and Prometheus metrics scraping.',
  };
}

// ── 8. Fan-out / Fan-in ───────────────────────────────────────

function fanOutFanIn(): ArchitecturePlaybook {
  _seq = 0;
  const dispatcher = nid('fo');
  const queue = nid('fo');
  const workerA = nid('fo');
  const workerB = nid('fo');
  const workerC = nid('fo');
  const resultQueue = nid('fo');
  const aggregator = nid('fo');
  const resultStore = nid('fo');

  return {
    id: 'fan-out-fan-in',
    name: 'Fan-out / Fan-in',
    category: 'Processing',
    description:
      'Distribute a workload across multiple parallel workers (fan-out), then collect and aggregate results (fan-in). Classic scatter-gather for parallelizable tasks.',
    whenToUse: [
      'CPU/IO-bound tasks that can be partitioned (map-reduce, batch processing)',
      'Search queries fanning out to multiple shards and merging results',
      'Notification delivery to many recipients in parallel',
      'When throughput scales linearly with worker count',
    ],
    whenNotToUse: [
      'Tasks with strong ordering or sequential dependencies',
      'When the aggregation step becomes the bottleneck (Amdahl\'s Law)',
      'Small workloads where parallelization overhead exceeds benefit',
    ],
    nodes: [
      mkNode(dispatcher, 'app-server', 'Dispatcher', 'compute', 'app-server', 'Server', 50, 200),
      mkNode(queue, 'message-queue', 'Work Queue', 'messaging', 'message-queue', 'ListOrdered', 280, 200, { type: 'kafka', partitions: 6 }),
      mkNode(workerA, 'worker', 'Worker A', 'compute', 'worker', 'Cog', 510, 50),
      mkNode(workerB, 'worker', 'Worker B', 'compute', 'worker', 'Cog', 510, 200),
      mkNode(workerC, 'worker', 'Worker C', 'compute', 'worker', 'Cog', 510, 350),
      mkNode(resultQueue, 'message-queue', 'Result Queue', 'messaging', 'message-queue', 'ListOrdered', 700, 200),
      mkNode(aggregator, 'stream-processor', 'Aggregator', 'processing', 'stream-processor', 'Workflow', 900, 200),
      mkNode(resultStore, 'database', 'Result Store', 'storage', 'database', 'Database', 900, 380),
    ],
    edges: [
      mkEdge(dispatcher, queue, 'message-queue', true, 'fan-out'),
      mkEdge(queue, workerA, 'message-queue', true, 'partition 0-1'),
      mkEdge(queue, workerB, 'message-queue', true, 'partition 2-3'),
      mkEdge(queue, workerC, 'message-queue', true, 'partition 4-5'),
      mkEdge(workerA, resultQueue, 'message-queue', true, 'partial result'),
      mkEdge(workerB, resultQueue, 'message-queue', true, 'partial result'),
      mkEdge(workerC, resultQueue, 'message-queue', true, 'partial result'),
      mkEdge(resultQueue, aggregator, 'message-queue', true, 'fan-in'),
      mkEdge(aggregator, resultStore, 'db-query', false, 'store final'),
    ],
    failureModes: [
      'Straggler problem: one slow worker delays the entire aggregation',
      'Partial failure: some workers fail but others succeed, needing reconciliation',
      'Result ordering: fan-in must handle out-of-order partial results',
      'Backpressure: work queue fills faster than workers can drain it',
      'Aggregator bottleneck: single aggregator limits total throughput',
    ],
    theory:
      'Generalizes the MapReduce programming model (Dean & Ghemawat, 2004). Fan-out exploits task parallelism; the speedup is bounded by Amdahl\'s Law: S = 1 / ((1 - p) + p/n) where p is the parallelizable fraction. The barrier synchronization at fan-in is analogous to a join in fork-join parallelism. Queue-based decoupling provides natural backpressure (bounded buffer problem).',
  };
}

// ── Export ─────────────────────────────────────────────────────

export const PLAYBOOKS: ArchitecturePlaybook[] = [
  cacheAside(),
  writeBehind(),
  circuitBreaker(),
  cqrs(),
  sagaChoreography(),
  rateLimitingTokenBucket(),
  sidecarServiceMesh(),
  fanOutFanIn(),
];

/** Look up a single playbook by its unique ID. */
export function getPlaybookById(id: string): ArchitecturePlaybook | undefined {
  return PLAYBOOKS.find((p) => p.id === id);
}

/** Return all playbooks that match the given category. */
export function getPlaybooksByCategory(category: string): ArchitecturePlaybook[] {
  return PLAYBOOKS.filter((p) => p.category === category);
}

/** All unique playbook categories. */
export function getPlaybookCategories(): string[] {
  return [...new Set(PLAYBOOKS.map((p) => p.category))];
}
