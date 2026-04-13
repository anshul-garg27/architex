// ─────────────────────────────────────────────────────────────
// Architex — War Stories: Production Incident Case Studies
// ─────────────────────────────────────────────────────────────
//
// Twelve incident case studies inspired by real-world production
// failures. Each story includes a timeline, architecture diagram,
// root cause analysis, and prevention strategies.
//
// Public API:
//   WAR_STORIES           — all 12 stories keyed by id
//   WAR_STORY_LIST        — ordered array of all stories
//   getStoryById(id)      — O(1) lookup
//   getStoriesBySeverity() — grouped by severity
//   SEVERITY_CONFIG        — colour/label config per severity
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Severity of the incident. */
export type IncidentSeverity = 'critical' | 'high' | 'medium';

/** Type of event in the incident timeline. */
export type TimelineEventType =
  | 'trigger'
  | 'detection'
  | 'alert'
  | 'escalation'
  | 'investigation'
  | 'mitigation'
  | 'fix'
  | 'postmortem';

/** A single event in the incident timeline. */
export interface TimelineEvent {
  /** Minutes offset from incident start (T+0). */
  minutesOffset: number;
  /** Short label for the event. */
  label: string;
  /** Detailed description of what happened. */
  description: string;
  /** Event type (controls icon and colour). */
  type: TimelineEventType;
}

/** A node in the architecture diagram. */
export interface ArchitectureNode {
  /** Unique node id within the story. */
  id: string;
  /** Display label. */
  label: string;
  /** Node type for visual styling. */
  kind: 'service' | 'database' | 'cache' | 'queue' | 'loadbalancer' | 'dns' | 'client' | 'config' | 'certificate';
  /** X position (0-based grid column). */
  x: number;
  /** Y position (0-based grid row). */
  y: number;
  /** Timeline minute at which this node enters failure state (-1 = never). */
  failsAtMinute: number;
}

/** A directed edge in the architecture diagram. */
export interface ArchitectureEdge {
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** Optional label on the edge. */
  label?: string;
}

/** Impact metrics for the incident. */
export interface ImpactMetrics {
  /** Estimated revenue lost (human-readable). */
  revenueLost: string;
  /** Number of users affected (human-readable). */
  usersAffected: string;
  /** Total downtime duration. */
  downtime: string;
  /** SLA breach? */
  slaBreach: boolean;
  /** Additional metrics. */
  additional?: Record<string, string>;
}

/** A complete war story / incident case study. */
export interface WarStory {
  /** Unique identifier (kebab-case). */
  id: string;
  /** Human-readable incident title. */
  title: string;
  /** Severity level. */
  severity: IncidentSeverity;
  /** Total duration from trigger to resolution (human-readable). */
  duration: string;
  /** One-line summary of what went wrong. */
  summary: string;
  /** Ordered list of timeline events. */
  timeline: TimelineEvent[];
  /** Root cause analysis text. */
  rootCause: string;
  /** Architecture diagram: nodes. */
  architecture: {
    nodes: ArchitectureNode[];
    edges: ArchitectureEdge[];
  };
  /** Impact metrics. */
  impactMetrics: ImpactMetrics;
  /** Lessons learned from the incident. */
  lessonsLearned: string[];
  /** Concrete prevention strategies. */
  preventionStrategies: string[];
  /** Related system design concepts. */
  relatedConcepts: string[];
}

// ── Severity Config ─────────────────────────────────────────

export const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; border: string; label: string }> = {
  critical: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', label: 'Critical' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', label: 'High' },
  medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/40', label: 'Medium' },
};

// ── Timeline Event Type Config ──────────────────────────────

export const EVENT_TYPE_CONFIG: Record<TimelineEventType, { color: string; icon: string; label: string }> = {
  trigger:       { color: 'text-red-400',    icon: 'zap',         label: 'Trigger' },
  detection:     { color: 'text-amber-400',  icon: 'search',      label: 'Detection' },
  alert:         { color: 'text-orange-400', icon: 'bell',        label: 'Alert' },
  escalation:    { color: 'text-rose-400',   icon: 'arrow-up',    label: 'Escalation' },
  investigation: { color: 'text-blue-400',   icon: 'microscope',  label: 'Investigation' },
  mitigation:    { color: 'text-cyan-400',   icon: 'shield',      label: 'Mitigation' },
  fix:           { color: 'text-emerald-400',icon: 'check-circle', label: 'Fix' },
  postmortem:    { color: 'text-violet-400', icon: 'file-text',   label: 'Post-Mortem' },
};

// ── War Stories ─────────────────────────────────────────────

const blackFridayMeltdown: WarStory = {
  id: 'black-friday-meltdown',
  title: 'The Black Friday Meltdown',
  severity: 'critical',
  duration: '4h 23m',
  summary: 'Auto-scaling failed to keep up with a 50x traffic spike on peak shopping day, cascading into full site outage.',
  timeline: [
    { minutesOffset: 0,   label: 'Traffic surge begins',        description: 'Traffic jumps from 10K to 50K RPS in under 2 minutes as doorbuster deals go live. CDN absorbs initial static asset load.', type: 'trigger' },
    { minutesOffset: 3,   label: 'API latency spikes',          description: 'p99 latency on /api/products shoots from 120ms to 4.2s. Connection pool on primary DB reaches 95% utilization.', type: 'detection' },
    { minutesOffset: 5,   label: 'Auto-scaler triggers',        description: 'Kubernetes HPA kicks in but new pods take 45s to pull images from a cold registry. During this window, existing pods start OOMing.', type: 'alert' },
    { minutesOffset: 8,   label: 'Database connection exhaustion', description: 'All 500 connections to the primary PostgreSQL instance are consumed. New requests queue and timeout after 30s.', type: 'escalation' },
    { minutesOffset: 12,  label: 'Cart service crashes',        description: 'Cart service enters crash loop due to cascading timeouts from product service. Users see blank cart pages.', type: 'escalation' },
    { minutesOffset: 18,  label: 'Full site outage declared',   description: 'Load balancer health checks fail across all backend pools. 503 errors served to 100% of traffic. War room activated.', type: 'alert' },
    { minutesOffset: 35,  label: 'Emergency scale-up',          description: 'SRE team manually provisions 10x capacity on pre-warmed instances. DB read replicas promoted for read traffic.', type: 'mitigation' },
    { minutesOffset: 60,  label: 'Partial recovery',            description: 'Product browsing restored at 70% capacity. Cart and checkout still degraded due to session state inconsistencies.', type: 'mitigation' },
    { minutesOffset: 150, label: 'Full recovery',               description: 'Connection pooler (PgBouncer) deployed, circuit breakers tuned. All services healthy. Traffic handled at 80K RPS.', type: 'fix' },
    { minutesOffset: 263, label: 'Post-mortem scheduled',        description: 'Incident declared resolved. Post-mortem meeting scheduled for Monday. Preliminary timeline documented.', type: 'postmortem' },
  ],
  rootCause: 'The auto-scaling configuration used a cooldown period of 5 minutes between scale-up events, which was far too slow for the exponential traffic ramp. Combined with cold container image registries and a fixed database connection pool of 500, the system hit a hard ceiling almost immediately. The lack of connection pooling middleware (PgBouncer) meant each microservice instance consumed 10 DB connections, and with 50+ pods, the pool was exhausted.',
  architecture: {
    nodes: [
      { id: 'client', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'cdn', label: 'CDN', kind: 'loadbalancer', x: 1, y: 0, failsAtMinute: -1 },
      { id: 'lb', label: 'Load Balancer', kind: 'loadbalancer', x: 1, y: 1, failsAtMinute: 18 },
      { id: 'product-svc', label: 'Product Service', kind: 'service', x: 2, y: 0, failsAtMinute: 3 },
      { id: 'cart-svc', label: 'Cart Service', kind: 'service', x: 2, y: 1, failsAtMinute: 12 },
      { id: 'checkout-svc', label: 'Checkout Service', kind: 'service', x: 2, y: 2, failsAtMinute: 15 },
      { id: 'cache', label: 'Redis Cache', kind: 'cache', x: 3, y: 0, failsAtMinute: -1 },
      { id: 'db', label: 'PostgreSQL', kind: 'database', x: 3, y: 1, failsAtMinute: 8 },
    ],
    edges: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'lb' },
      { from: 'lb', to: 'product-svc' },
      { from: 'lb', to: 'cart-svc' },
      { from: 'lb', to: 'checkout-svc' },
      { from: 'product-svc', to: 'cache', label: 'read' },
      { from: 'product-svc', to: 'db', label: 'read' },
      { from: 'cart-svc', to: 'db', label: 'read/write' },
      { from: 'checkout-svc', to: 'db', label: 'write' },
    ],
  },
  impactMetrics: {
    revenueLost: '$12.4M',
    usersAffected: '2.3M',
    downtime: '4h 23m',
    slaBreach: true,
    additional: { 'Abandoned carts': '847K', 'Support tickets': '23K' },
  },
  lessonsLearned: [
    'Auto-scaling cooldowns must be tuned for expected traffic patterns, not just steady-state.',
    'Container image registries should be pre-warmed before known traffic events.',
    'Database connection pooling middleware is essential in microservice architectures.',
    'Load testing should simulate realistic traffic ramps, not just sustained throughput.',
    'Circuit breakers prevent one failing service from cascading to others.',
  ],
  preventionStrategies: [
    'Deploy PgBouncer or similar connection pooler between services and databases.',
    'Pre-scale infrastructure 2x expected peak before known events.',
    'Use pre-pulled container images on warm node pools.',
    'Implement circuit breakers with fallback responses for all inter-service calls.',
    'Run chaos engineering experiments simulating 10x traffic before peak events.',
  ],
  relatedConcepts: ['Auto-scaling', 'Connection pooling', 'Circuit breaker', 'Load testing', 'Capacity planning'],
};

const splitBrain: WarStory = {
  id: 'split-brain',
  title: 'The Split Brain',
  severity: 'critical',
  duration: '6h 15m',
  summary: 'A network partition in a distributed database caused two leaders to accept conflicting writes, resulting in silent data divergence.',
  timeline: [
    { minutesOffset: 0,   label: 'Network partition occurs',      description: 'A misconfigured firewall rule during maintenance severs communication between datacenter-east and datacenter-west. Both sides remain operational independently.', type: 'trigger' },
    { minutesOffset: 2,   label: 'Leader election in DC-west',    description: 'DC-west nodes cannot reach the existing leader in DC-east. After the election timeout (3s), they elect a new leader. Now two leaders exist.', type: 'trigger' },
    { minutesOffset: 5,   label: 'Dual writes begin',             description: 'Both clusters accept writes independently. User accounts created in DC-east get IDs that conflict with accounts in DC-west.', type: 'escalation' },
    { minutesOffset: 22,  label: 'Monitoring gap',                description: 'Replication lag alerts fire but are dismissed as transient. The monitoring system only checks lag, not partition state.', type: 'detection' },
    { minutesOffset: 45,  label: 'Customer reports data loss',    description: 'A user updates their profile in DC-east, but when routed to DC-west on next request, sees stale data. Support tickets escalate.', type: 'alert' },
    { minutesOffset: 60,  label: 'Partition identified',          description: 'On-call engineer discovers the firewall rule change. Both clusters have diverged with 12K conflicting writes.', type: 'investigation' },
    { minutesOffset: 90,  label: 'Write quorum enforced',         description: 'Writes halted on DC-west cluster. DC-east designated as authoritative leader.', type: 'mitigation' },
    { minutesOffset: 180, label: 'Data reconciliation begins',    description: 'Custom merge script written to reconcile 12K conflicting records using last-write-wins with manual review for conflicts.', type: 'mitigation' },
    { minutesOffset: 340, label: 'Reconciliation complete',       description: 'All conflicting records resolved. 847 records required manual review. Network partition healed and replication restored.', type: 'fix' },
    { minutesOffset: 375, label: 'Post-mortem initiated',         description: 'Incident closed. Fencing tokens and epoch-based leader validation identified as preventive measures.', type: 'postmortem' },
  ],
  rootCause: 'The distributed database used a simple leader election with a 3-second timeout but lacked fencing tokens. When the network partition isolated the two datacenters, the west datacenter legitimately elected a new leader. Without fencing tokens or epoch-based validation, both leaders accepted writes. The monitoring system only tracked replication lag, not actual partition detection, so the split-brain condition went undetected for 45 minutes.',
  architecture: {
    nodes: [
      { id: 'client-east', label: 'Users (East)', kind: 'client', x: 0, y: 0, failsAtMinute: -1 },
      { id: 'client-west', label: 'Users (West)', kind: 'client', x: 0, y: 2, failsAtMinute: -1 },
      { id: 'lb-east', label: 'LB East', kind: 'loadbalancer', x: 1, y: 0, failsAtMinute: -1 },
      { id: 'lb-west', label: 'LB West', kind: 'loadbalancer', x: 1, y: 2, failsAtMinute: -1 },
      { id: 'db-east', label: 'DB Leader (East)', kind: 'database', x: 2, y: 0, failsAtMinute: -1 },
      { id: 'db-west', label: 'DB Follower (West)', kind: 'database', x: 2, y: 2, failsAtMinute: 2 },
    ],
    edges: [
      { from: 'client-east', to: 'lb-east' },
      { from: 'client-west', to: 'lb-west' },
      { from: 'lb-east', to: 'db-east' },
      { from: 'lb-west', to: 'db-west' },
      { from: 'db-east', to: 'db-west', label: 'replication (severed)' },
    ],
  },
  impactMetrics: {
    revenueLost: '$3.2M',
    usersAffected: '890K',
    downtime: '6h 15m',
    slaBreach: true,
    additional: { 'Conflicting records': '12,247', 'Manual reviews': '847' },
  },
  lessonsLearned: [
    'Leader election without fencing tokens allows split-brain scenarios.',
    'Monitoring must detect partition state, not just replication lag.',
    'Network changes during maintenance require explicit partition testing.',
    'Conflict resolution strategies must be defined before incidents occur.',
    'Multi-datacenter deployments need quorum-based writes, not just replication.',
  ],
  preventionStrategies: [
    'Implement fencing tokens / epoch numbers for leader validation.',
    'Require write quorum (majority) across datacenters for critical data.',
    'Add partition detection alerts that check inter-DC connectivity directly.',
    'Use CRDTs for data that must remain available during partitions.',
    'Enforce change management windows with automated rollback for network changes.',
  ],
  relatedConcepts: ['CAP theorem', 'Split brain', 'Fencing tokens', 'Leader election', 'Consensus protocols', 'CRDTs'],
};

const thunderingHerd: WarStory = {
  id: 'thundering-herd',
  title: 'The Thundering Herd',
  severity: 'high',
  duration: '1h 47m',
  summary: 'A cache restart caused millions of requests to simultaneously hit the database, creating a thundering herd that took down the entire backend.',
  timeline: [
    { minutesOffset: 0,   label: 'Redis cache restart',            description: 'Routine Redis maintenance triggers a restart. Cache is flushed as persistence was configured for append-only without snapshot.', type: 'trigger' },
    { minutesOffset: 1,   label: 'Cache miss storm',               description: 'Every request results in a cache miss. 500K+ requests/sec bypass cache and hit the database directly.', type: 'trigger' },
    { minutesOffset: 2,   label: 'Database CPU saturates',         description: 'PostgreSQL CPU hits 100%. Query execution times jump from 5ms to 8s. Connection queue grows to 10K pending.', type: 'escalation' },
    { minutesOffset: 4,   label: 'Application timeouts cascade',   description: 'Service health checks fail as DB queries timeout. Kubernetes marks pods unhealthy and begins restarting them.', type: 'escalation' },
    { minutesOffset: 6,   label: 'Alerts fire',                    description: 'PagerDuty fires critical alerts for DB CPU, service health, and error rate. On-call responds.', type: 'alert' },
    { minutesOffset: 10,  label: 'Root cause identified',          description: 'Engineer identifies cache is empty post-restart. All traffic hitting DB. Standard cache warm-up would take 20+ minutes at this load.', type: 'investigation' },
    { minutesOffset: 15,  label: 'Request rate limiting applied',  description: 'Emergency rate limiter deployed at API gateway. Only 10% of traffic passed through, serving 429 to the rest.', type: 'mitigation' },
    { minutesOffset: 25,  label: 'Cache warming initiated',        description: 'Background job populates cache from DB snapshot for top 100K hot keys. Cache hit rate climbs from 0% to 65%.', type: 'mitigation' },
    { minutesOffset: 60,  label: 'Rate limits relaxed',            description: 'Cache hit rate reaches 92%. Rate limiter gradually opened to 50%, then 100% over 30 minutes.', type: 'fix' },
    { minutesOffset: 107, label: 'Full recovery confirmed',        description: 'Cache hit rate stable at 98%. All services healthy. Post-mortem reveals need for cache warming automation.', type: 'fix' },
  ],
  rootCause: 'The Redis cache had no warm-up strategy. When restarted, 100% of requests became cache misses, creating a thundering herd that overwhelmed PostgreSQL. The cache configuration used append-only persistence without RDB snapshots, so the restart could not reload from disk. Additionally, there was no request coalescing (singleflight pattern) to prevent duplicate DB queries for the same key.',
  architecture: {
    nodes: [
      { id: 'clients', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'lb', label: 'API Gateway', kind: 'loadbalancer', x: 1, y: 1, failsAtMinute: -1 },
      { id: 'app', label: 'App Service', kind: 'service', x: 2, y: 1, failsAtMinute: 4 },
      { id: 'cache', label: 'Redis Cache', kind: 'cache', x: 3, y: 0, failsAtMinute: 0 },
      { id: 'db', label: 'PostgreSQL', kind: 'database', x: 3, y: 2, failsAtMinute: 2 },
    ],
    edges: [
      { from: 'clients', to: 'lb' },
      { from: 'lb', to: 'app' },
      { from: 'app', to: 'cache', label: 'cache miss' },
      { from: 'app', to: 'db', label: 'fallback' },
    ],
  },
  impactMetrics: {
    revenueLost: '$1.8M',
    usersAffected: '1.2M',
    downtime: '1h 47m',
    slaBreach: true,
    additional: { 'DB queries/sec peak': '520K', 'Cache hit rate during incident': '0%' },
  },
  lessonsLearned: [
    'Cache restarts without warm-up create thundering herd conditions.',
    'Request coalescing (singleflight) prevents duplicate DB queries.',
    'RDB snapshots enable fast cache reload on restart.',
    'Gradual traffic ramp after cache events prevents DB overload.',
    'Cache infrastructure should be treated as critical and require change management.',
  ],
  preventionStrategies: [
    'Enable RDB snapshots alongside AOF for fast cache recovery.',
    'Implement singleflight/request coalescing to deduplicate concurrent cache misses.',
    'Build automated cache warming pipelines that run before traffic is restored.',
    'Deploy cache read replicas that can serve stale data during primary restarts.',
    'Add circuit breakers between application layer and database with fallback to stale cache.',
  ],
  relatedConcepts: ['Cache stampede', 'Thundering herd', 'Singleflight pattern', 'Cache warming', 'Rate limiting'],
};

const cascadingTimeout: WarStory = {
  id: 'cascading-timeout',
  title: 'The Cascading Timeout',
  severity: 'high',
  duration: '2h 10m',
  summary: 'A slow downstream payment service caused timeouts to propagate upstream through 5 microservices, consuming all thread pools and bringing down the entire platform.',
  timeline: [
    { minutesOffset: 0,   label: 'Payment provider degrades',     description: 'Third-party payment API response times increase from 200ms to 15s due to their internal database migration.', type: 'trigger' },
    { minutesOffset: 3,   label: 'Payment service threads exhaust',description: 'Payment service uses synchronous HTTP client with 30s timeout. All 200 threads blocked waiting for payment API responses.', type: 'escalation' },
    { minutesOffset: 5,   label: 'Order service queues grow',     description: 'Order service calls payment service synchronously. Its 30s timeout starts queueing. Thread pool at 180/200.', type: 'escalation' },
    { minutesOffset: 8,   label: 'API gateway saturates',         description: 'Gateway timeout set to 60s. Requests pile up as order service cannot respond. All gateway worker threads consumed.', type: 'escalation' },
    { minutesOffset: 10,  label: 'Search and browse affected',    description: 'Unrelated services (search, recommendations) share the same API gateway. They timeout because gateway has no threads available.', type: 'escalation' },
    { minutesOffset: 12,  label: 'Full platform outage',          description: 'Health checks fail. Load balancer drains all backends. 100% error rate. Pages return 504 Gateway Timeout.', type: 'alert' },
    { minutesOffset: 18,  label: 'Team identifies timeout chain', description: 'Distributed tracing shows the cascade: payment API -> payment svc -> order svc -> gateway -> everything.', type: 'investigation' },
    { minutesOffset: 25,  label: 'Circuit breaker deployed',      description: 'Emergency circuit breaker opens on payment service. Orders deferred to async queue. Gateway threads freed.', type: 'mitigation' },
    { minutesOffset: 45,  label: 'Non-payment services recover',  description: 'Search, browse, recommendations restored within minutes once gateway threads freed. Payment remains in degraded mode.', type: 'fix' },
    { minutesOffset: 130, label: 'Payment API recovers',          description: 'Third-party payment API returns to normal. Circuit breaker closes. Queued orders processed. Full recovery.', type: 'fix' },
  ],
  rootCause: 'The microservice chain used synchronous HTTP calls with excessively long timeouts (30s-60s) and no circuit breakers. When the third-party payment API degraded, each service in the chain held open connections waiting for responses, exhausting thread pools. The API gateway shared thread pools across all routes, so a slow payment path starved unrelated services. The lack of bulkhead isolation meant one failing dependency could consume all resources.',
  architecture: {
    nodes: [
      { id: 'users', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'gateway', label: 'API Gateway', kind: 'loadbalancer', x: 1, y: 1, failsAtMinute: 8 },
      { id: 'search-svc', label: 'Search Service', kind: 'service', x: 2, y: 0, failsAtMinute: 10 },
      { id: 'order-svc', label: 'Order Service', kind: 'service', x: 2, y: 1, failsAtMinute: 5 },
      { id: 'rec-svc', label: 'Recommendations', kind: 'service', x: 2, y: 2, failsAtMinute: 10 },
      { id: 'payment-svc', label: 'Payment Service', kind: 'service', x: 3, y: 1, failsAtMinute: 3 },
      { id: 'payment-api', label: 'Payment API (3rd party)', kind: 'service', x: 4, y: 1, failsAtMinute: 0 },
    ],
    edges: [
      { from: 'users', to: 'gateway' },
      { from: 'gateway', to: 'search-svc' },
      { from: 'gateway', to: 'order-svc' },
      { from: 'gateway', to: 'rec-svc' },
      { from: 'order-svc', to: 'payment-svc', label: 'sync call' },
      { from: 'payment-svc', to: 'payment-api', label: 'sync call' },
    ],
  },
  impactMetrics: {
    revenueLost: '$4.7M',
    usersAffected: '3.1M',
    downtime: '2h 10m',
    slaBreach: true,
    additional: { 'Services affected': '12', 'Queued orders': '45K' },
  },
  lessonsLearned: [
    'Synchronous call chains amplify latency issues across the entire stack.',
    'Circuit breakers are essential for every external dependency.',
    'Timeouts should decrease as you move upstream, not remain constant.',
    'Bulkhead isolation prevents one failing path from consuming shared resources.',
    'Third-party dependencies need aggressive timeout and fallback strategies.',
  ],
  preventionStrategies: [
    'Implement circuit breakers (Hystrix/Resilience4j) on all inter-service calls.',
    'Set tiered timeouts: gateway 5s, services 3s, downstream 1s.',
    'Use bulkhead pattern to isolate thread pools per downstream dependency.',
    'Convert synchronous payment flow to async with queue-based processing.',
    'Deploy service mesh (Istio) with automatic timeout and retry policies.',
  ],
  relatedConcepts: ['Circuit breaker', 'Bulkhead pattern', 'Timeout propagation', 'Service mesh', 'Backpressure'],
};

const silentDataCorruption: WarStory = {
  id: 'silent-data-corruption',
  title: 'The Silent Data Corruption',
  severity: 'critical',
  duration: '72h (undetected for 48h)',
  summary: 'An eventual consistency bug caused account balances to silently diverge across replicas, resulting in $2.1M in incorrect charges over 48 hours before detection.',
  timeline: [
    { minutesOffset: 0,    label: 'Code deploy with race condition',  description: 'New balance update logic deployed. Uses read-modify-write without proper optimistic locking. Works fine under low concurrency.', type: 'trigger' },
    { minutesOffset: 120,  label: 'Concurrent updates begin',         description: 'Peak traffic creates concurrent balance updates for popular accounts. Race condition causes lost writes on ~0.3% of transactions.', type: 'trigger' },
    { minutesOffset: 480,  label: 'Replica divergence accumulates',   description: 'Eventually consistent replicas propagate incorrect balances. Some users see different balances depending on which replica serves them.', type: 'escalation' },
    { minutesOffset: 1440, label: 'First customer complaint',         description: 'Customer reports being charged twice. Support dismisses as eventual consistency lag. Actually a corrupted balance.', type: 'detection' },
    { minutesOffset: 2160, label: 'Pattern recognized',               description: 'Support team notices 340+ similar complaints. Engineering investigates. Discovers read-modify-write race condition in balance service.', type: 'investigation' },
    { minutesOffset: 2280, label: 'Hotfix deployed',                  description: 'Balance updates changed to use atomic compare-and-swap with version vectors. Race condition eliminated.', type: 'fix' },
    { minutesOffset: 2400, label: 'Audit begins',                     description: 'Full transaction log audit initiated to identify all affected accounts. 15,247 accounts found with incorrect balances.', type: 'investigation' },
    { minutesOffset: 2880, label: 'Balance corrections applied',      description: 'Automated correction script processes all affected accounts. $2.1M in incorrect charges reversed.', type: 'fix' },
    { minutesOffset: 3600, label: 'Verification complete',            description: 'All account balances verified against transaction logs. Checksums added for ongoing integrity monitoring.', type: 'fix' },
    { minutesOffset: 4320, label: 'Post-mortem and process changes',  description: 'Mandatory concurrency testing added to CI pipeline. Balance operations require formal review. Continuous integrity checks deployed.', type: 'postmortem' },
  ],
  rootCause: 'The balance update code used a read-modify-write pattern without optimistic locking or compare-and-swap semantics. Under concurrent updates (two requests reading the same balance, both modifying it, both writing back), the last write would overwrite the first, causing a lost update. The eventually consistent replication then propagated these incorrect values across all replicas, making the corruption appear consistent.',
  architecture: {
    nodes: [
      { id: 'clients', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'api', label: 'API Layer', kind: 'service', x: 1, y: 1, failsAtMinute: -1 },
      { id: 'balance-svc', label: 'Balance Service', kind: 'service', x: 2, y: 1, failsAtMinute: 0 },
      { id: 'db-primary', label: 'DB Primary', kind: 'database', x: 3, y: 0, failsAtMinute: 120 },
      { id: 'db-replica1', label: 'DB Replica 1', kind: 'database', x: 3, y: 1, failsAtMinute: 480 },
      { id: 'db-replica2', label: 'DB Replica 2', kind: 'database', x: 3, y: 2, failsAtMinute: 480 },
    ],
    edges: [
      { from: 'clients', to: 'api' },
      { from: 'api', to: 'balance-svc' },
      { from: 'balance-svc', to: 'db-primary', label: 'read-modify-write' },
      { from: 'db-primary', to: 'db-replica1', label: 'async replication' },
      { from: 'db-primary', to: 'db-replica2', label: 'async replication' },
    ],
  },
  impactMetrics: {
    revenueLost: '$2.1M (reversed charges)',
    usersAffected: '15,247',
    downtime: '0h (silent corruption)',
    slaBreach: true,
    additional: { 'Corrupted transactions': '47K', 'Detection delay': '48 hours' },
  },
  lessonsLearned: [
    'Read-modify-write without locking is a ticking time bomb under concurrency.',
    'Eventual consistency must be paired with conflict detection mechanisms.',
    'Financial operations require atomic operations or serializable isolation.',
    'Customer complaints are the worst way to detect data integrity issues.',
    'Continuous integrity checks (checksums, audits) catch silent corruption early.',
  ],
  preventionStrategies: [
    'Use compare-and-swap (CAS) or optimistic locking for all mutable state.',
    'Deploy continuous data integrity monitors that compare replicas.',
    'Require serializable isolation for financial transactions.',
    'Implement event sourcing for audit trail and ability to reconstruct state.',
    'Add automated concurrency testing to CI pipeline for all state-modifying paths.',
  ],
  relatedConcepts: ['Eventual consistency', 'Lost update', 'Optimistic locking', 'CAS operations', 'Event sourcing'],
};

const dnsDisaster: WarStory = {
  id: 'dns-disaster',
  title: 'The DNS Disaster',
  severity: 'high',
  duration: '3h 40m',
  summary: 'A DNS TTL misconfiguration during a migration pointed 40% of traffic to decommissioned servers for hours due to aggressive caching.',
  timeline: [
    { minutesOffset: 0,   label: 'DNS record updated',              description: 'Infrastructure team updates A records to point to new server IPs as part of datacenter migration. Old TTL was 86400s (24h).', type: 'trigger' },
    { minutesOffset: 5,   label: 'Traffic split observed',           description: 'New servers receive 60% of traffic. Remaining 40% still hitting old IPs due to cached DNS records across ISPs and client resolvers.', type: 'detection' },
    { minutesOffset: 10,  label: 'Old servers decommissioned',       description: 'Team proceeds to shut down old servers per migration plan, not realizing 40% of users still resolve to old IPs.', type: 'escalation' },
    { minutesOffset: 12,  label: 'Connection refused errors surge',  description: '40% of users get connection refused / timeout errors. Error monitoring shows spike but is initially attributed to migration.', type: 'alert' },
    { minutesOffset: 25,  label: 'Scale of issue recognized',        description: 'Customer complaints flood in. Team realizes DNS TTL was not lowered before migration. ISPs are caching the old records.', type: 'investigation' },
    { minutesOffset: 35,  label: 'Old servers brought back online',  description: 'Emergency restart of decommissioned servers to serve the 40% of cached-DNS traffic. Services partially restored.', type: 'mitigation' },
    { minutesOffset: 60,  label: 'TTL lowered to 60s',              description: 'DNS TTL reduced to 60 seconds. However, existing cached records with 24h TTL will not refresh until they expire.', type: 'mitigation' },
    { minutesOffset: 120, label: 'Dual-stack running',               description: 'Both old and new servers running in parallel. Traffic gradually shifts as DNS caches expire. 85% on new infrastructure.', type: 'fix' },
    { minutesOffset: 200, label: 'Old servers drained',              description: 'Traffic on old IPs drops below 1%. Old servers safely decommissioned. Migration complete.', type: 'fix' },
    { minutesOffset: 220, label: 'Post-mortem: DNS migration runbook', description: 'New runbook created: lower TTL 48h before migration, verify propagation, keep old infra until TTL expires.', type: 'postmortem' },
  ],
  rootCause: 'The DNS records had a 24-hour TTL, but the team updated the records and decommissioned the old servers within the same maintenance window. ISP recursive resolvers and client DNS caches held the old records for up to 24 hours. The migration runbook did not include a TTL reduction step before the actual IP change, nor a verification step to confirm propagation completion.',
  architecture: {
    nodes: [
      { id: 'users', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'dns', label: 'DNS Resolver', kind: 'dns', x: 1, y: 1, failsAtMinute: 0 },
      { id: 'old-lb', label: 'Old LB (decomm)', kind: 'loadbalancer', x: 2, y: 0, failsAtMinute: 10 },
      { id: 'new-lb', label: 'New LB', kind: 'loadbalancer', x: 2, y: 2, failsAtMinute: -1 },
      { id: 'old-svc', label: 'Old Services', kind: 'service', x: 3, y: 0, failsAtMinute: 10 },
      { id: 'new-svc', label: 'New Services', kind: 'service', x: 3, y: 2, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'users', to: 'dns' },
      { from: 'dns', to: 'old-lb', label: 'cached (40%)' },
      { from: 'dns', to: 'new-lb', label: 'updated (60%)' },
      { from: 'old-lb', to: 'old-svc' },
      { from: 'new-lb', to: 'new-svc' },
    ],
  },
  impactMetrics: {
    revenueLost: '$890K',
    usersAffected: '1.6M',
    downtime: '3h 40m (for 40% of users)',
    slaBreach: true,
    additional: { 'ISPs with stale cache': '2,400+', 'Error rate peak': '40%' },
  },
  lessonsLearned: [
    'DNS TTL must be lowered well before any IP change (48h minimum).',
    'Old infrastructure must remain available until the previous TTL fully expires.',
    'DNS propagation is not instant and varies by ISP and client.',
    'Migration runbooks need explicit DNS readiness checks.',
    'Monitor both old and new endpoints during migration to detect split traffic.',
  ],
  preventionStrategies: [
    'Lower DNS TTL to 60s at least 48 hours before any IP migration.',
    'Keep old servers running for 2x the previous TTL duration after DNS change.',
    'Use DNS propagation checking tools to verify global propagation before decommissioning.',
    'Implement gradual traffic shifting via weighted DNS or load balancer, not instant cutover.',
    'Add pre-migration checklist that gates decommissioning on propagation verification.',
  ],
  relatedConcepts: ['DNS TTL', 'DNS propagation', 'Blue-green deployment', 'Traffic shifting', 'Migration patterns'],
};

const memoryLeakMarathon: WarStory = {
  id: 'memory-leak-marathon',
  title: 'The Memory Leak Marathon',
  severity: 'medium',
  duration: '5 days (slow degradation)',
  summary: 'A subtle memory leak in a connection pool grew at 50MB/hour, causing weekly OOM crashes that were masked by auto-restart and only caught after 3 weeks.',
  timeline: [
    { minutesOffset: 0,      label: 'Leaky code deployed',             description: 'New feature adds database connection retry logic that allocates buffers on retry but never releases them when the connection succeeds.', type: 'trigger' },
    { minutesOffset: 1440,   label: 'First OOM crash (Day 1)',         description: 'Service OOM-killed after 24h. Kubernetes auto-restarts it. Nobody notices because uptime checks reset. Memory: 0 -> 1.2GB -> OOM.', type: 'escalation' },
    { minutesOffset: 4320,   label: 'Pattern: daily restarts',         description: 'Service restarts daily at roughly the same time. Ops team attributes it to "noisy neighbors" on the node. No investigation.', type: 'detection' },
    { minutesOffset: 10080,  label: 'Weekly restart pattern noticed',  description: 'After 7 days, SRE reviewing dashboards notices the sawtooth memory pattern. Each cycle: gradual climb -> OOM -> restart -> repeat.', type: 'investigation' },
    { minutesOffset: 10200,  label: 'Heap dump analysis',              description: 'Engineer takes heap dump at 800MB. Finds 12M unreleased byte buffers from connection retry logic. Each retry allocates 4KB never freed.', type: 'investigation' },
    { minutesOffset: 10260,  label: 'Hotfix: buffer cleanup',          description: 'Fix adds proper cleanup in finally block for retry buffers. Deployed with canary to 5% of traffic.', type: 'fix' },
    { minutesOffset: 10320,  label: 'Canary verified stable',          description: 'Canary instance memory stable at 280MB after 1 hour (previously would be at 330MB). Fix rolled to 100%.', type: 'fix' },
    { minutesOffset: 11760,  label: 'Post-mortem: observability gaps',  description: 'Action items: memory growth alerts, leak detection in CI, mandatory heap profiling for connection-handling code.', type: 'postmortem' },
  ],
  rootCause: 'The database connection retry logic allocated a new byte buffer for each retry attempt but only freed it on failure paths, not success paths. When a retry succeeded (which was the common case for transient errors), the buffer was leaked. At ~50MB/hour growth rate, the service would OOM after ~24 hours. Kubernetes auto-restart masked the problem as a transient crash.',
  architecture: {
    nodes: [
      { id: 'lb', label: 'Load Balancer', kind: 'loadbalancer', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'svc', label: 'App Service', kind: 'service', x: 1, y: 1, failsAtMinute: 1440 },
      { id: 'connpool', label: 'Connection Pool', kind: 'service', x: 2, y: 0, failsAtMinute: 0 },
      { id: 'db', label: 'Database', kind: 'database', x: 2, y: 2, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'lb', to: 'svc' },
      { from: 'svc', to: 'connpool', label: 'retry + leak' },
      { from: 'connpool', to: 'db' },
    ],
  },
  impactMetrics: {
    revenueLost: '$120K',
    usersAffected: '50K (during OOM restarts)',
    downtime: '~2min per daily restart x 21 days',
    slaBreach: false,
    additional: { 'Leak rate': '50MB/hour', 'Total OOM events': '21', 'Buffers leaked': '12M' },
  },
  lessonsLearned: [
    'Auto-restart masks problems; OOM events should always trigger investigation.',
    'Memory growth over time (sawtooth pattern) is a classic leak signature.',
    'Connection retry logic is a common source of resource leaks.',
    'Heap profiling should be part of performance testing for connection-heavy services.',
    'Monitoring must alert on memory growth rate, not just absolute thresholds.',
  ],
  preventionStrategies: [
    'Alert on memory growth rate (delta) in addition to absolute memory usage.',
    'Flag any OOM-killed container for investigation, even if auto-restarted.',
    'Add memory leak detection to CI (e.g., track heap growth over test runs).',
    'Use try-with-resources / RAII patterns for all buffer allocations.',
    'Run long-duration soak tests (24h+) in staging before deploying connection-handling changes.',
  ],
  relatedConcepts: ['Memory leak', 'Connection pooling', 'Resource management', 'Soak testing', 'Observability'],
};

const hotPartition: WarStory = {
  id: 'hot-partition',
  title: 'The Hot Partition',
  severity: 'high',
  duration: '8h 30m',
  summary: 'A celebrity product launch caused a single database shard to receive 95% of all writes due to sequential ID-based sharding, melting one node while others sat idle.',
  timeline: [
    { minutesOffset: 0,   label: 'Celebrity product drops',          description: 'Viral product launch drives 200K users to a single product page within seconds. All order writes target the same shard (product_id range 1M-2M).', type: 'trigger' },
    { minutesOffset: 2,   label: 'Shard 7 latency spikes',           description: 'Shard 7 (hosting product IDs 1M-2M) p99 latency jumps from 5ms to 12s. Other 15 shards at normal load (< 10ms).', type: 'detection' },
    { minutesOffset: 5,   label: 'Shard 7 disk I/O saturates',       description: 'Write-ahead log on Shard 7 cannot flush fast enough. Disk I/O at 100%. Write queue grows to 50K pending operations.', type: 'escalation' },
    { minutesOffset: 8,   label: 'Replication lag on Shard 7',       description: 'Read replicas for Shard 7 fall 45 seconds behind. Users see stale inventory counts. Overselling begins.', type: 'escalation' },
    { minutesOffset: 15,  label: 'Order service timeouts',           description: 'Order service gives up on Shard 7 after 30s timeout. Checkout failures at 78% for the viral product.', type: 'alert' },
    { minutesOffset: 25,  label: 'Hot partition identified',          description: 'DBA identifies that sequential product_id sharding puts all writes for the viral product on one node.', type: 'investigation' },
    { minutesOffset: 40,  label: 'Emergency read replica scaling',   description: 'Two additional read replicas added to Shard 7. Reads offloaded. Write pressure still high.', type: 'mitigation' },
    { minutesOffset: 90,  label: 'Write buffering implemented',      description: 'Emergency queue placed before Shard 7 to buffer writes. Orders processed at Shard 7 capacity (~5K/sec).', type: 'mitigation' },
    { minutesOffset: 360, label: 'Traffic normalizes',               description: 'Product sells out. Write queue drains. Shard 7 recovers. All 892 oversold orders identified and refunded.', type: 'fix' },
    { minutesOffset: 510, label: 'Hash-based resharding planned',    description: 'Post-mortem recommends hash-based sharding to distribute hot keys. Resharding project initiated.', type: 'postmortem' },
  ],
  rootCause: 'The database used range-based sharding on sequential product_id. This meant that popular products (which often have IDs in the same range because they were created around the same time) all land on the same shard. When a viral product launch drove massive traffic, 95% of writes targeted a single shard while 15 other shards sat nearly idle. The sharding key was chosen for easy range queries, not for write distribution.',
  architecture: {
    nodes: [
      { id: 'users', label: 'Users', kind: 'client', x: 0, y: 2, failsAtMinute: -1 },
      { id: 'order-svc', label: 'Order Service', kind: 'service', x: 1, y: 2, failsAtMinute: 15 },
      { id: 'shard-router', label: 'Shard Router', kind: 'service', x: 2, y: 2, failsAtMinute: -1 },
      { id: 'shard-1', label: 'Shard 1-6', kind: 'database', x: 3, y: 0, failsAtMinute: -1 },
      { id: 'shard-7', label: 'Shard 7 (hot)', kind: 'database', x: 3, y: 2, failsAtMinute: 2 },
      { id: 'shard-8', label: 'Shard 8-16', kind: 'database', x: 3, y: 4, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'users', to: 'order-svc' },
      { from: 'order-svc', to: 'shard-router' },
      { from: 'shard-router', to: 'shard-1', label: '2.5%' },
      { from: 'shard-router', to: 'shard-7', label: '95%' },
      { from: 'shard-router', to: 'shard-8', label: '2.5%' },
    ],
  },
  impactMetrics: {
    revenueLost: '$2.8M',
    usersAffected: '200K',
    downtime: '8h 30m (degraded for viral product)',
    slaBreach: true,
    additional: { 'Oversold orders': '892', 'Shard 7 write queue peak': '50K', 'Other shards load': '<5%' },
  },
  lessonsLearned: [
    'Range-based sharding on sequential IDs creates predictable hotspots.',
    'Shard key selection must consider write distribution, not just query patterns.',
    'Monitoring should alert on per-shard load imbalance, not just aggregate.',
    'Viral/flash-sale traffic patterns are fundamentally different from steady-state.',
    'Overselling is a data integrity issue that requires serializable inventory checks.',
  ],
  preventionStrategies: [
    'Use hash-based or consistent-hash sharding to distribute writes evenly.',
    'Implement per-shard load monitoring with automatic alerting on imbalance.',
    'Deploy a write buffer/queue before hot shards to smooth write spikes.',
    'Use distributed counters (CRDTs) for inventory to avoid single-shard bottleneck.',
    'Pre-provision dedicated capacity for known flash-sale events.',
  ],
  relatedConcepts: ['Database sharding', 'Hot partition', 'Consistent hashing', 'Write amplification', 'CRDT counters'],
};

const retryStorm: WarStory = {
  id: 'retry-storm',
  title: 'The Retry Storm',
  severity: 'high',
  duration: '1h 55m',
  summary: 'Aggressive retry logic without exponential backoff or jitter turned a brief 30-second API blip into a 2-hour outage by amplifying traffic 8x.',
  timeline: [
    { minutesOffset: 0,   label: 'Brief API degradation',           description: 'Garbage collection pause causes 30-second API response delay. Under normal conditions, would self-heal.', type: 'trigger' },
    { minutesOffset: 1,   label: 'Clients begin retrying',          description: 'All clients retry immediately on timeout (no backoff). 100K clients x 3 retries = 300K additional requests in 10 seconds.', type: 'trigger' },
    { minutesOffset: 2,   label: 'Traffic amplification 8x',        description: 'Each retry generates more timeouts, which generate more retries. Effective RPS jumps from 50K to 400K.', type: 'escalation' },
    { minutesOffset: 3,   label: 'API servers overwhelmed',         description: 'All API servers at 100% CPU processing retry requests. Legitimate requests cannot get through.', type: 'escalation' },
    { minutesOffset: 5,   label: 'Downstream services cascade',     description: 'Downstream services also implement aggressive retries. Traffic amplification compounds to 15x normal.', type: 'escalation' },
    { minutesOffset: 8,   label: 'Full outage declared',            description: 'All services unresponsive. Retry traffic dominates. Even after the original GC pause resolved, the system cannot recover.', type: 'alert' },
    { minutesOffset: 15,  label: 'Traffic analysis reveals retries', description: 'Packet analysis shows 85% of all traffic is retry requests. The original issue (GC pause) resolved 14 minutes ago.', type: 'investigation' },
    { minutesOffset: 25,  label: 'Client retry disabled via config', description: 'Feature flag pushed to disable client retries. Traffic drops 80% immediately. Services begin recovering.', type: 'mitigation' },
    { minutesOffset: 45,  label: 'Gradual retry re-enablement',     description: 'Retries re-enabled with exponential backoff + jitter. Traffic stable. No amplification.', type: 'fix' },
    { minutesOffset: 115, label: 'All services healthy',            description: 'Full recovery. Mandatory retry policy (backoff + jitter + max retries + circuit breaker) added to service template.', type: 'fix' },
  ],
  rootCause: 'All services used immediate retry on failure with no exponential backoff, no jitter, and no maximum retry limit. When a brief GC pause caused timeouts, every client retried simultaneously, creating synchronized retry waves that overwhelmed the already-recovering service. This is a classic retry storm / metastable failure: the system cannot recover because the recovery generates more load than the original failure.',
  architecture: {
    nodes: [
      { id: 'clients', label: 'Mobile/Web Clients', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'api-gw', label: 'API Gateway', kind: 'loadbalancer', x: 1, y: 1, failsAtMinute: 3 },
      { id: 'svc-a', label: 'Service A', kind: 'service', x: 2, y: 0, failsAtMinute: 2 },
      { id: 'svc-b', label: 'Service B', kind: 'service', x: 2, y: 1, failsAtMinute: 5 },
      { id: 'svc-c', label: 'Service C', kind: 'service', x: 2, y: 2, failsAtMinute: 5 },
      { id: 'db', label: 'Database', kind: 'database', x: 3, y: 1, failsAtMinute: 3 },
    ],
    edges: [
      { from: 'clients', to: 'api-gw', label: 'retries (no backoff)' },
      { from: 'api-gw', to: 'svc-a', label: 'retries' },
      { from: 'api-gw', to: 'svc-b', label: 'retries' },
      { from: 'svc-a', to: 'svc-c', label: 'retries' },
      { from: 'svc-b', to: 'db', label: 'retries' },
    ],
  },
  impactMetrics: {
    revenueLost: '$1.5M',
    usersAffected: '2.8M',
    downtime: '1h 55m',
    slaBreach: true,
    additional: { 'Traffic amplification': '8-15x', 'Original issue duration': '30 seconds', 'Recovery time': '1h 55m' },
  },
  lessonsLearned: [
    'Retries without backoff and jitter create synchronized thundering herds.',
    'A 30-second issue became a 2-hour outage purely due to retry behavior.',
    'Retry storms are metastable failures: the system cannot self-heal.',
    'Feature flags for retry behavior enable rapid mitigation.',
    'Every service in the chain that retries amplifies the problem multiplicatively.',
  ],
  preventionStrategies: [
    'Mandate exponential backoff with full jitter on all retry logic.',
    'Set maximum retry limits (typically 3) with circuit breaker fallback.',
    'Implement server-side rate limiting and load shedding.',
    'Add retry budget: limit retries to 10% of total request volume.',
    'Use feature flags to disable/tune retry behavior without redeploy.',
  ],
  relatedConcepts: ['Retry storm', 'Exponential backoff', 'Jitter', 'Metastable failure', 'Load shedding', 'Circuit breaker'],
};

const certificateCliff: WarStory = {
  id: 'certificate-cliff',
  title: 'The Certificate Cliff',
  severity: 'critical',
  duration: '4h 45m',
  summary: 'A TLS certificate expired at 3am on a Saturday, immediately severing all HTTPS connections and taking down the entire platform.',
  timeline: [
    { minutesOffset: 0,   label: 'TLS certificate expires',        description: 'Wildcard TLS certificate for *.company.com expires at 03:00 UTC Saturday. All HTTPS handshakes immediately fail.', type: 'trigger' },
    { minutesOffset: 1,   label: '100% HTTPS failure',             description: 'Every client connection attempt receives TLS handshake error. Browsers show "Your connection is not private". All API calls fail.', type: 'escalation' },
    { minutesOffset: 3,   label: 'Automated alerts fire',          description: 'SSL monitoring alerts fire. PagerDuty pages on-call. On-call engineer is asleep; wakes up 12 minutes later.', type: 'alert' },
    { minutesOffset: 15,  label: 'On-call responds',               description: 'Engineer acknowledges alert. Takes 10 minutes to VPN in, access dashboards, and identify the expired certificate.', type: 'investigation' },
    { minutesOffset: 25,  label: 'Certificate renewal initiated',  description: 'Engineer requests new certificate from internal CA. Approval required from security team lead. Security lead unreachable.', type: 'escalation' },
    { minutesOffset: 60,  label: 'Emergency cert issued',          description: 'VP of Engineering approves emergency certificate bypass. New cert generated via Lets Encrypt automation.', type: 'mitigation' },
    { minutesOffset: 75,  label: 'Certificate deployed to CDN',    description: 'New certificate uploaded to CDN and load balancers. CDN propagation takes 15 minutes across all edge nodes.', type: 'mitigation' },
    { minutesOffset: 90,  label: 'Partial recovery',               description: '70% of edge nodes serving new certificate. Users in some regions still seeing errors due to CDN cache lag.', type: 'fix' },
    { minutesOffset: 180, label: 'Full global recovery',           description: 'All edge nodes updated. 100% of traffic served with valid certificate. Service fully restored.', type: 'fix' },
    { minutesOffset: 285, label: 'Automation and policy changes',  description: 'cert-manager deployed for auto-renewal. 90-day rotation policy. Expiry alerts at 30, 14, 7, 3, 1 days before.', type: 'postmortem' },
  ],
  rootCause: 'The TLS certificate was manually managed with a 1-year renewal cycle. The certificate renewal reminder email went to a distribution list that was deactivated during a team reorganization 6 months earlier. No automated monitoring checked certificate expiry dates. The single point of failure in the approval chain (security team lead) added 35 minutes to resolution time during off-hours.',
  architecture: {
    nodes: [
      { id: 'users', label: 'Users', kind: 'client', x: 0, y: 1, failsAtMinute: -1 },
      { id: 'cert', label: 'TLS Certificate', kind: 'certificate', x: 1, y: 0, failsAtMinute: 0 },
      { id: 'cdn', label: 'CDN / Edge', kind: 'loadbalancer', x: 1, y: 1, failsAtMinute: 0 },
      { id: 'lb', label: 'Load Balancer', kind: 'loadbalancer', x: 2, y: 1, failsAtMinute: 0 },
      { id: 'api', label: 'API Services', kind: 'service', x: 3, y: 0, failsAtMinute: -1 },
      { id: 'web', label: 'Web App', kind: 'service', x: 3, y: 2, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'users', to: 'cdn', label: 'HTTPS (fails)' },
      { from: 'cert', to: 'cdn', label: 'expired' },
      { from: 'cert', to: 'lb', label: 'expired' },
      { from: 'cdn', to: 'lb' },
      { from: 'lb', to: 'api' },
      { from: 'lb', to: 'web' },
    ],
  },
  impactMetrics: {
    revenueLost: '$6.2M',
    usersAffected: '8.5M',
    downtime: '4h 45m',
    slaBreach: true,
    additional: { 'APIs affected': 'All', 'Regions affected': 'Global', 'Certificate age': '365 days (expired)' },
  },
  lessonsLearned: [
    'Manual certificate management is a single point of failure.',
    'Reminder emails to deactivated distribution lists create silent failures.',
    'Off-hours incidents require pre-authorized emergency procedures.',
    'Certificate expiry is 100% predictable and should be 100% automated.',
    'CDN propagation time adds significant latency to certificate deployment.',
  ],
  preventionStrategies: [
    'Deploy cert-manager or ACME-based auto-renewal (Lets Encrypt).',
    'Monitor certificate expiry with alerts at 30, 14, 7, 3, 1 days.',
    'Use short-lived certificates (90 days) to force automation.',
    'Pre-authorize emergency certificate issuance for on-call engineers.',
    'Test certificate rotation in staging regularly to verify the pipeline works.',
  ],
  relatedConcepts: ['TLS/SSL', 'Certificate management', 'PKI', 'ACME protocol', 'CDN propagation'],
};

const configPushGoneWrong: WarStory = {
  id: 'config-push-gone-wrong',
  title: 'The Config Push Gone Wrong',
  severity: 'critical',
  duration: '3h 15m',
  summary: 'A bad configuration change pushed to 100% of servers simultaneously disabled authentication, exposing user data for 47 minutes before rollback.',
  timeline: [
    { minutesOffset: 0,   label: 'Config change pushed',            description: 'Engineer pushes config update to change rate limit thresholds. A typo sets auth_enabled: false instead of auth_detailed_logging: false.', type: 'trigger' },
    { minutesOffset: 1,   label: 'Config applied globally',         description: 'Config management system pushes to all 200 servers simultaneously (no canary, no gradual rollout). Auth middleware disabled on all endpoints.', type: 'trigger' },
    { minutesOffset: 3,   label: 'Auth bypass in production',       description: 'All API endpoints now accessible without authentication. Automated scanners detect open endpoints within minutes.', type: 'escalation' },
    { minutesOffset: 12,  label: 'Security scanner alerts',         description: 'External security monitoring detects unauthenticated access to protected endpoints. Alert fires to security team.', type: 'detection' },
    { minutesOffset: 18,  label: 'Scope assessed',                  description: 'Security team confirms auth is disabled globally. 47 unauthenticated requests to sensitive endpoints in the window.', type: 'investigation' },
    { minutesOffset: 22,  label: 'Config rollback initiated',       description: 'Previous config version restored. Auth re-enabled across all servers within 3 minutes.', type: 'mitigation' },
    { minutesOffset: 25,  label: 'Auth restored',                   description: 'Authentication working on all endpoints. Unauthorized sessions invalidated. Audit log review begins.', type: 'fix' },
    { minutesOffset: 60,  label: 'Forensic analysis complete',      description: '47 unauthenticated API calls identified. 12 accessed user PII. No evidence of data exfiltration beyond API responses.', type: 'investigation' },
    { minutesOffset: 120, label: 'Affected users notified',         description: 'GDPR notification process initiated for 12 affected users. Regulatory disclosure timeline started.', type: 'escalation' },
    { minutesOffset: 195, label: 'Post-mortem: config safety',      description: 'Mandatory config review, canary rollouts, and semantic validation for security-critical keys implemented.', type: 'postmortem' },
  ],
  rootCause: 'The configuration management system had no semantic validation, no canary deployment, and no rollout stages. A single-character typo (auth_enabled instead of auth_detailed_logging) was applied to all 200 servers simultaneously. The config file schema allowed arbitrary boolean keys without validation against a known set. There was no approval gate for changes to security-critical configuration.',
  architecture: {
    nodes: [
      { id: 'engineer', label: 'Engineer', kind: 'client', x: 0, y: 0, failsAtMinute: -1 },
      { id: 'config-svc', label: 'Config Service', kind: 'config', x: 1, y: 0, failsAtMinute: 0 },
      { id: 'server-1', label: 'Server Pool A', kind: 'service', x: 2, y: 0, failsAtMinute: 1 },
      { id: 'server-2', label: 'Server Pool B', kind: 'service', x: 2, y: 1, failsAtMinute: 1 },
      { id: 'server-3', label: 'Server Pool C', kind: 'service', x: 2, y: 2, failsAtMinute: 1 },
      { id: 'users', label: 'Users', kind: 'client', x: 3, y: 1, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'engineer', to: 'config-svc', label: 'bad config push' },
      { from: 'config-svc', to: 'server-1', label: 'simultaneous' },
      { from: 'config-svc', to: 'server-2', label: 'simultaneous' },
      { from: 'config-svc', to: 'server-3', label: 'simultaneous' },
      { from: 'users', to: 'server-2', label: 'no auth' },
    ],
  },
  impactMetrics: {
    revenueLost: '$0 (direct)',
    usersAffected: '12 (PII exposed)',
    downtime: '0h (functional but insecure)',
    slaBreach: true,
    additional: { 'Unauthorized API calls': '47', 'PII exposures': '12 users', 'GDPR notifications': 'Required' },
  },
  lessonsLearned: [
    'Configuration changes can be as dangerous as code deployments.',
    'Global simultaneous rollout eliminates the ability to catch mistakes.',
    'Security-critical config must have schema validation and approval gates.',
    'Config keys should be validated against a known schema, not free-form.',
    'Even brief auth bypass can trigger regulatory notification requirements.',
  ],
  preventionStrategies: [
    'Implement canary rollout for all configuration changes (1% -> 10% -> 100%).',
    'Add schema validation that rejects unknown config keys and validates types.',
    'Require two-person approval for security-critical configuration changes.',
    'Deploy config diff preview and semantic analysis before applying.',
    'Implement automatic rollback triggers for security posture changes.',
  ],
  relatedConcepts: ['Configuration management', 'Canary deployment', 'Feature flags', 'Security posture', 'GDPR compliance'],
};

const queueOverflow: WarStory = {
  id: 'queue-overflow',
  title: 'The Queue Overflow',
  severity: 'high',
  duration: '5h 20m',
  summary: 'A message queue without backpressure controls accumulated 50M unprocessed messages, exhausted disk space, and crashed, losing 2.3M messages permanently.',
  timeline: [
    { minutesOffset: 0,   label: 'Consumer deployment breaks',      description: 'New consumer version deployed with a serialization bug. Messages fail to deserialize and are rejected without processing.', type: 'trigger' },
    { minutesOffset: 5,   label: 'Queue depth growing rapidly',     description: 'Producers continue publishing at 10K msgs/sec. Consumers reject all messages. Queue depth grows by 600K/minute.', type: 'escalation' },
    { minutesOffset: 15,  label: 'Dead letter queue fills',         description: 'Failed messages routed to DLQ. DLQ also fills rapidly. No alerting configured on DLQ depth.', type: 'escalation' },
    { minutesOffset: 30,  label: 'Queue depth alert fires',         description: 'Alert triggers at 10M message threshold. On-call investigates but attributes to "slow consumers" and adds more consumer instances.', type: 'detection' },
    { minutesOffset: 45,  label: 'More consumers = more failures',  description: 'Additional consumer instances all hit the same serialization bug. Queue depth continues growing. Now at 25M messages.', type: 'escalation' },
    { minutesOffset: 90,  label: 'Broker disk space critical',      description: 'Message broker disk at 95%. Broker starts rejecting new messages from producers. Producer-side errors spike.', type: 'alert' },
    { minutesOffset: 120, label: 'Broker crash and data loss',      description: 'Broker OOM-kills as it tries to manage 50M message index. Unclean shutdown corrupts 2.3M messages on disk.', type: 'escalation' },
    { minutesOffset: 150, label: 'Root cause found: serialization', description: 'Engineer discovers consumer serialization bug. Reverts consumer to previous version. Broker restarted with recovered data.', type: 'investigation' },
    { minutesOffset: 240, label: 'Queue processing resumes',        description: 'Old consumer version processing messages. Backlog of 47.7M messages being drained at 15K msgs/sec.', type: 'fix' },
    { minutesOffset: 320, label: 'Backlog cleared',                 description: 'All recoverable messages processed. 2.3M lost messages identified from producer logs for replay. Backpressure controls added.', type: 'fix' },
  ],
  rootCause: 'The consumer deployment introduced a serialization bug that caused all messages to fail deserialization. Without proper backpressure, the queue grew unchecked. The broker had no disk space limits configured, no message TTL, and no maximum queue depth. When disk space ran out, the broker crashed ungracefully, corrupting messages. The dead letter queue had no monitoring, hiding the systematic failure.',
  architecture: {
    nodes: [
      { id: 'producers', label: 'Producer Services', kind: 'service', x: 0, y: 1, failsAtMinute: 90 },
      { id: 'queue', label: 'Message Queue', kind: 'queue', x: 1, y: 1, failsAtMinute: 5 },
      { id: 'dlq', label: 'Dead Letter Queue', kind: 'queue', x: 1, y: 2, failsAtMinute: 15 },
      { id: 'consumers', label: 'Consumer Services', kind: 'service', x: 2, y: 0, failsAtMinute: 0 },
      { id: 'db', label: 'Target Database', kind: 'database', x: 3, y: 0, failsAtMinute: -1 },
    ],
    edges: [
      { from: 'producers', to: 'queue', label: '10K msgs/sec' },
      { from: 'queue', to: 'consumers', label: 'all rejected' },
      { from: 'consumers', to: 'dlq', label: 'failed messages' },
      { from: 'consumers', to: 'db', label: 'none processed' },
    ],
  },
  impactMetrics: {
    revenueLost: '$3.4M',
    usersAffected: '1.9M',
    downtime: '5h 20m',
    slaBreach: true,
    additional: { 'Messages lost': '2.3M', 'Peak queue depth': '50M', 'Replay required': 'Yes' },
  },
  lessonsLearned: [
    'Queues without backpressure controls will eventually overflow.',
    'Dead letter queues need monitoring just like primary queues.',
    'Adding more consumers to a systematic bug just accelerates failure.',
    'Message brokers need disk space limits, TTLs, and max queue depth.',
    'Consumer deployments are as critical as producer deployments.',
  ],
  preventionStrategies: [
    'Configure max queue depth, disk quotas, and message TTL on all queues.',
    'Monitor DLQ depth and alert when any messages arrive in DLQ.',
    'Canary deploy consumers and verify message processing before full rollout.',
    'Implement producer-side backpressure (reject/slow down when queue is full).',
    'Add message serialization contract tests to CI to catch breaking changes.',
  ],
  relatedConcepts: ['Message queues', 'Backpressure', 'Dead letter queue', 'Consumer groups', 'Serialization contracts'],
};

// ── Exports ─────────────────────────────────────────────────

/** All war stories keyed by id. */
export const WAR_STORIES: Record<string, WarStory> = {
  'black-friday-meltdown':   blackFridayMeltdown,
  'split-brain':             splitBrain,
  'thundering-herd':         thunderingHerd,
  'cascading-timeout':       cascadingTimeout,
  'silent-data-corruption':  silentDataCorruption,
  'dns-disaster':            dnsDisaster,
  'memory-leak-marathon':    memoryLeakMarathon,
  'hot-partition':           hotPartition,
  'retry-storm':             retryStorm,
  'certificate-cliff':       certificateCliff,
  'config-push-gone-wrong':  configPushGoneWrong,
  'queue-overflow':          queueOverflow,
};

/** Ordered array of all war stories. */
export const WAR_STORY_LIST: WarStory[] = [
  blackFridayMeltdown,
  splitBrain,
  thunderingHerd,
  cascadingTimeout,
  silentDataCorruption,
  dnsDisaster,
  memoryLeakMarathon,
  hotPartition,
  retryStorm,
  certificateCliff,
  configPushGoneWrong,
  queueOverflow,
];

/**
 * Retrieve a war story by id.
 *
 * @param id - The story identifier (kebab-case).
 * @returns The story or undefined.
 */
export function getStoryById(id: string): WarStory | undefined {
  return WAR_STORIES[id];
}

/**
 * Group all stories by severity.
 *
 * @returns Record mapping severity to stories at that level.
 */
export function getStoriesBySeverity(): Record<IncidentSeverity, WarStory[]> {
  const result: Record<IncidentSeverity, WarStory[]> = {
    critical: [],
    high: [],
    medium: [],
  };
  for (const story of WAR_STORY_LIST) {
    result[story.severity].push(story);
  }
  return result;
}
