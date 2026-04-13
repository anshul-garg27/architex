// ─────────────────────────────────────────────────────────────
// Architex — Skill Tree Definitions
// ─────────────────────────────────────────────────────────────
//
// Five skill tracks modelling a system-design learning path:
//   Architecture, Databases, Distributed Systems, Performance,
//   Security.
//
// Each track contains 8-10 nodes arranged as a directed acyclic
// graph (DAG) where edges encode prerequisite relationships.
//
// Public helpers:
//   checkUnlockable(node, progress)   → can the learner unlock?
//   getTrackProgress(track, progress) → 0-100 percentage
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Skill track identifier. */
export type SkillTrack =
  | 'architecture'
  | 'databases'
  | 'distributed-systems'
  | 'performance'
  | 'security';

/** A single skill tree node. */
export interface SkillNode {
  /** Unique node identifier (kebab-case). */
  id: string;
  /** Human-readable skill name. */
  name: string;
  /** Short description of what the learner masters. */
  description: string;
  /** Which track this node belongs to. */
  track: SkillTrack;
  /** Node IDs that must be unlocked before this one. */
  prerequisites: string[];
  /** Experience points required to unlock (after prerequisites are met). */
  xpRequired: number;
  /** SVG layout hint: column (0-based depth in the DAG). */
  column: number;
  /** SVG layout hint: row position within the column. */
  row: number;
}

/** Tracks the learner's current state. */
export interface UserProgress {
  /** Set of unlocked node IDs. */
  unlockedNodes: Set<string>;
  /** Current XP available for spending. */
  availableXp: number;
}

// ── Track Colours ───────────────────────────────────────────

/** Colour mapping for each track (used by the UI). */
export const TRACK_COLORS: Record<SkillTrack, { base: string; glow: string; label: string }> = {
  architecture:         { base: '#6366f1', glow: '#818cf8', label: 'Architecture' },
  databases:            { base: '#f59e0b', glow: '#fbbf24', label: 'Databases' },
  'distributed-systems':{ base: '#10b981', glow: '#34d399', label: 'Distributed Systems' },
  performance:          { base: '#ef4444', glow: '#f87171', label: 'Performance' },
  security:             { base: '#8b5cf6', glow: '#a78bfa', label: 'Security' },
};

/** Ordered list of all tracks. */
export const ALL_TRACKS: SkillTrack[] = [
  'architecture',
  'databases',
  'distributed-systems',
  'performance',
  'security',
];

// ── Skill Nodes ─────────────────────────────────────────────

const architectureNodes: SkillNode[] = [
  { id: 'arch-fundamentals', name: 'Architecture Fundamentals', description: 'Understand client-server model, monolith vs microservices, and basic system components.', track: 'architecture', prerequisites: [], xpRequired: 0, column: 0, row: 0 },
  { id: 'arch-api-design', name: 'API Design', description: 'RESTful conventions, resource modelling, versioning, pagination, and error handling.', track: 'architecture', prerequisites: ['arch-fundamentals'], xpRequired: 100, column: 1, row: 0 },
  { id: 'arch-load-balancing', name: 'Load Balancing', description: 'L4 vs L7 balancers, algorithms (round-robin, least-connections, consistent hashing).', track: 'architecture', prerequisites: ['arch-fundamentals'], xpRequired: 100, column: 1, row: 1 },
  { id: 'arch-caching', name: 'Caching Strategies', description: 'Cache-aside, read-through, write-through, write-behind. TTL, invalidation, cache stampede.', track: 'architecture', prerequisites: ['arch-api-design'], xpRequired: 200, column: 2, row: 0 },
  { id: 'arch-messaging', name: 'Message Queues', description: 'Pub/sub, point-to-point, dead letter queues, backpressure. Kafka vs RabbitMQ vs SQS.', track: 'architecture', prerequisites: ['arch-api-design'], xpRequired: 200, column: 2, row: 1 },
  { id: 'arch-microservices', name: 'Microservices Patterns', description: 'Service mesh, sidecar proxy, circuit breaker, bulkhead, saga, CQRS.', track: 'architecture', prerequisites: ['arch-caching', 'arch-messaging', 'arch-load-balancing'], xpRequired: 400, column: 3, row: 0 },
  { id: 'arch-event-driven', name: 'Event-Driven Architecture', description: 'Event sourcing, CQRS, domain events, eventual consistency, outbox pattern.', track: 'architecture', prerequisites: ['arch-messaging'], xpRequired: 300, column: 3, row: 1 },
  { id: 'arch-scalability', name: 'Scalability Patterns', description: 'Horizontal vs vertical scaling, data partitioning, CDN, read replicas, auto-scaling.', track: 'architecture', prerequisites: ['arch-microservices'], xpRequired: 500, column: 4, row: 0 },
  { id: 'arch-system-interview', name: 'System Design Interview', description: 'Structured approach: requirements, estimation, API, schema, high-level design, deep dives.', track: 'architecture', prerequisites: ['arch-scalability', 'arch-event-driven'], xpRequired: 600, column: 5, row: 0 },
];

const databaseNodes: SkillNode[] = [
  { id: 'db-fundamentals', name: 'Database Fundamentals', description: 'Relational model, SQL, ACID properties, primary keys, foreign keys, normalization.', track: 'databases', prerequisites: [], xpRequired: 0, column: 0, row: 0 },
  { id: 'db-indexing', name: 'Indexing Deep-Dive', description: 'B-tree, B+tree, hash indexes, composite indexes, covering indexes, index-only scans.', track: 'databases', prerequisites: ['db-fundamentals'], xpRequired: 150, column: 1, row: 0 },
  { id: 'db-query-optimization', name: 'Query Optimization', description: 'EXPLAIN plans, join algorithms (nested loop, hash, merge), statistics, query rewriting.', track: 'databases', prerequisites: ['db-indexing'], xpRequired: 250, column: 2, row: 0 },
  { id: 'db-nosql', name: 'NoSQL Databases', description: 'Key-value, document, wide-column, graph stores. CAP theorem trade-offs for each.', track: 'databases', prerequisites: ['db-fundamentals'], xpRequired: 150, column: 1, row: 1 },
  { id: 'db-replication', name: 'Replication', description: 'Single-leader, multi-leader, leaderless replication. Synchronous vs asynchronous. Conflict resolution.', track: 'databases', prerequisites: ['db-nosql', 'db-indexing'], xpRequired: 300, column: 2, row: 1 },
  { id: 'db-partitioning', name: 'Partitioning / Sharding', description: 'Hash partitioning, range partitioning, directory-based. Shard key selection, rebalancing.', track: 'databases', prerequisites: ['db-replication'], xpRequired: 350, column: 3, row: 0 },
  { id: 'db-transactions', name: 'Distributed Transactions', description: '2PC, 3PC, saga pattern. Isolation levels across shards. Serializable snapshot isolation.', track: 'databases', prerequisites: ['db-partitioning', 'db-query-optimization'], xpRequired: 400, column: 4, row: 0 },
  { id: 'db-time-series', name: 'Time-Series & Analytical', description: 'InfluxDB, TimescaleDB, ClickHouse. Columnar storage, aggregation engines, retention policies.', track: 'databases', prerequisites: ['db-nosql'], xpRequired: 200, column: 2, row: 2 },
  { id: 'db-data-modelling', name: 'Advanced Data Modelling', description: 'Denormalization strategies, materialized views, change data capture, schema evolution.', track: 'databases', prerequisites: ['db-transactions', 'db-time-series'], xpRequired: 500, column: 5, row: 0 },
];

const distributedNodes: SkillNode[] = [
  { id: 'dist-fundamentals', name: 'Distributed Fundamentals', description: 'Network partitions, partial failures, unreliable clocks, FLP impossibility.', track: 'distributed-systems', prerequisites: [], xpRequired: 0, column: 0, row: 0 },
  { id: 'dist-cap', name: 'CAP & PACELC', description: 'CAP theorem, PACELC framework. Choosing consistency vs availability under partition.', track: 'distributed-systems', prerequisites: ['dist-fundamentals'], xpRequired: 100, column: 1, row: 0 },
  { id: 'dist-clocks', name: 'Logical Clocks', description: 'Lamport timestamps, vector clocks, hybrid logical clocks. Causality tracking.', track: 'distributed-systems', prerequisites: ['dist-fundamentals'], xpRequired: 150, column: 1, row: 1 },
  { id: 'dist-consensus', name: 'Consensus Protocols', description: 'Paxos, Raft, ZAB. Leader election, log replication, membership changes.', track: 'distributed-systems', prerequisites: ['dist-cap', 'dist-clocks'], xpRequired: 350, column: 2, row: 0 },
  { id: 'dist-consistent-hashing', name: 'Consistent Hashing', description: 'Ring-based partitioning, virtual nodes, rebalancing on node join/leave.', track: 'distributed-systems', prerequisites: ['dist-cap'], xpRequired: 200, column: 2, row: 1 },
  { id: 'dist-gossip', name: 'Gossip Protocols', description: 'Epidemic dissemination, SWIM failure detection, crdt-based state merging.', track: 'distributed-systems', prerequisites: ['dist-clocks'], xpRequired: 250, column: 2, row: 2 },
  { id: 'dist-replication', name: 'Replication Strategies', description: 'Chain replication, quorum reads/writes, sloppy quorums, hinted handoff, anti-entropy.', track: 'distributed-systems', prerequisites: ['dist-consensus'], xpRequired: 400, column: 3, row: 0 },
  { id: 'dist-transactions', name: 'Distributed Transactions', description: '2PC, 3PC, saga orchestration/choreography, TCC pattern.', track: 'distributed-systems', prerequisites: ['dist-consensus', 'dist-consistent-hashing'], xpRequired: 450, column: 3, row: 1 },
  { id: 'dist-crdts', name: 'CRDTs', description: 'Conflict-free replicated data types: G-Counter, PN-Counter, LWW-Register, OR-Set.', track: 'distributed-systems', prerequisites: ['dist-gossip'], xpRequired: 350, column: 3, row: 2 },
  { id: 'dist-large-scale', name: 'Large-Scale Systems', description: 'MapReduce, Spark, Flink. Batch vs stream processing. Lambda/Kappa architecture.', track: 'distributed-systems', prerequisites: ['dist-replication', 'dist-transactions', 'dist-crdts'], xpRequired: 600, column: 4, row: 0 },
];

const performanceNodes: SkillNode[] = [
  { id: 'perf-fundamentals', name: 'Performance Fundamentals', description: 'Latency vs throughput, percentiles (p50/p95/p99), Amdahl\'s law, Little\'s law.', track: 'performance', prerequisites: [], xpRequired: 0, column: 0, row: 0 },
  { id: 'perf-profiling', name: 'Profiling & Benchmarking', description: 'CPU profiling, flame graphs, memory profiling, load testing (k6, wrk, Locust).', track: 'performance', prerequisites: ['perf-fundamentals'], xpRequired: 100, column: 1, row: 0 },
  { id: 'perf-caching', name: 'Caching Systems', description: 'Redis, Memcached. Cache warming, thundering herd, bloom filters for negative caching.', track: 'performance', prerequisites: ['perf-fundamentals'], xpRequired: 100, column: 1, row: 1 },
  { id: 'perf-io', name: 'I/O Optimization', description: 'Async I/O, event loops, connection pooling, batching, prefetching, zero-copy.', track: 'performance', prerequisites: ['perf-profiling'], xpRequired: 250, column: 2, row: 0 },
  { id: 'perf-network', name: 'Network Performance', description: 'TCP tuning, HTTP/2 multiplexing, CDN strategies, edge computing, DNS prefetch.', track: 'performance', prerequisites: ['perf-profiling'], xpRequired: 200, column: 2, row: 1 },
  { id: 'perf-database', name: 'Database Performance', description: 'Connection pooling, query plan analysis, read replicas, materialized views, partitioning.', track: 'performance', prerequisites: ['perf-caching'], xpRequired: 250, column: 2, row: 2 },
  { id: 'perf-concurrency', name: 'Concurrency & Parallelism', description: 'Thread pools, lock-free structures, work stealing, actor model, CSP.', track: 'performance', prerequisites: ['perf-io'], xpRequired: 350, column: 3, row: 0 },
  { id: 'perf-capacity', name: 'Capacity Planning', description: 'Back-of-envelope estimation, traffic modelling, auto-scaling policies, cost optimization.', track: 'performance', prerequisites: ['perf-network', 'perf-database'], xpRequired: 300, column: 3, row: 1 },
  { id: 'perf-observability', name: 'Observability', description: 'Metrics, logging, distributed tracing (Jaeger, Zipkin). SLOs, SLIs, error budgets.', track: 'performance', prerequisites: ['perf-concurrency', 'perf-capacity'], xpRequired: 400, column: 4, row: 0 },
  { id: 'perf-chaos', name: 'Chaos Engineering', description: 'Fault injection, game days, steady-state hypothesis, blast radius control.', track: 'performance', prerequisites: ['perf-observability'], xpRequired: 500, column: 5, row: 0 },
];

const securityNodes: SkillNode[] = [
  { id: 'sec-fundamentals', name: 'Security Fundamentals', description: 'CIA triad, threat modelling, attack surfaces, defense in depth, principle of least privilege.', track: 'security', prerequisites: [], xpRequired: 0, column: 0, row: 0 },
  { id: 'sec-auth', name: 'Authentication', description: 'Passwords, MFA, OAuth 2.0, OIDC, SAML. Session management, token storage.', track: 'security', prerequisites: ['sec-fundamentals'], xpRequired: 100, column: 1, row: 0 },
  { id: 'sec-authz', name: 'Authorization', description: 'RBAC, ABAC, ReBAC. Policy engines (OPA, Cedar). API gateway authorization.', track: 'security', prerequisites: ['sec-fundamentals'], xpRequired: 100, column: 1, row: 1 },
  { id: 'sec-crypto', name: 'Applied Cryptography', description: 'Symmetric (AES), asymmetric (RSA, ECDSA), hashing (SHA-256), TLS, certificate management.', track: 'security', prerequisites: ['sec-fundamentals'], xpRequired: 150, column: 1, row: 2 },
  { id: 'sec-api', name: 'API Security', description: 'Rate limiting, input validation, CORS, CSRF, JWT best practices, API keys.', track: 'security', prerequisites: ['sec-auth', 'sec-authz'], xpRequired: 250, column: 2, row: 0 },
  { id: 'sec-network', name: 'Network Security', description: 'Firewalls, VPNs, mTLS, zero-trust architecture, DDoS mitigation.', track: 'security', prerequisites: ['sec-crypto'], xpRequired: 250, column: 2, row: 1 },
  { id: 'sec-data', name: 'Data Protection', description: 'Encryption at rest/in transit, key management (KMS), tokenization, PII handling, GDPR.', track: 'security', prerequisites: ['sec-crypto'], xpRequired: 300, column: 2, row: 2 },
  { id: 'sec-owasp', name: 'OWASP Top 10', description: 'Injection, broken auth, XSS, SSRF, insecure deserialization, misconfiguration.', track: 'security', prerequisites: ['sec-api'], xpRequired: 350, column: 3, row: 0 },
  { id: 'sec-infrastructure', name: 'Infrastructure Security', description: 'Container security, secrets management, supply chain (SBOMs), immutable infrastructure.', track: 'security', prerequisites: ['sec-network', 'sec-data'], xpRequired: 400, column: 3, row: 1 },
  { id: 'sec-incident', name: 'Incident Response', description: 'SIEM, intrusion detection, forensics, playbooks, post-mortems, compliance auditing.', track: 'security', prerequisites: ['sec-owasp', 'sec-infrastructure'], xpRequired: 500, column: 4, row: 0 },
];

// ── Exports ─────────────────────────────────────────────────

/** All skill nodes indexed by ID for O(1) lookup. */
export const SKILL_NODES: Record<string, SkillNode> = {};

/** All nodes grouped by track. */
export const TRACK_NODES: Record<SkillTrack, SkillNode[]> = {
  architecture: architectureNodes,
  databases: databaseNodes,
  'distributed-systems': distributedNodes,
  performance: performanceNodes,
  security: securityNodes,
};

// Populate the flat lookup map.
for (const track of ALL_TRACKS) {
  for (const node of TRACK_NODES[track]) {
    SKILL_NODES[node.id] = node;
  }
}

/**
 * Checks whether a node can be unlocked given the user's progress.
 *
 * A node is unlockable when:
 * 1. It is not already unlocked.
 * 2. All prerequisite nodes are unlocked.
 * 3. The user has enough available XP.
 *
 * @param nodeId - The skill node ID to check.
 * @param progress - The learner's current progress.
 * @returns true if the node can be unlocked right now.
 */
export function checkUnlockable(nodeId: string, progress: UserProgress): boolean {
  const node = SKILL_NODES[nodeId];
  if (!node) return false;

  // Already unlocked.
  if (progress.unlockedNodes.has(nodeId)) return false;

  // All prerequisites must be unlocked.
  const prereqsMet = node.prerequisites.every((prereq) =>
    progress.unlockedNodes.has(prereq),
  );
  if (!prereqsMet) return false;

  // Must have enough XP.
  return progress.availableXp >= node.xpRequired;
}

/**
 * Returns the percentage of nodes unlocked in a given track.
 *
 * @param track - The skill track to measure.
 * @param progress - The learner's current progress.
 * @returns A number between 0 and 100 (inclusive).
 */
export function getTrackProgress(track: SkillTrack, progress: UserProgress): number {
  const nodes = TRACK_NODES[track];
  if (!nodes || nodes.length === 0) return 0;

  const unlocked = nodes.filter((n) => progress.unlockedNodes.has(n.id)).length;
  return Math.round((unlocked / nodes.length) * 100);
}

/**
 * Returns all prerequisite edges for a given track as [from, to] pairs.
 * Useful for rendering the SVG lines connecting hexagon nodes.
 */
export function getTrackEdges(track: SkillTrack): Array<[string, string]> {
  const nodes = TRACK_NODES[track];
  if (!nodes) return [];

  const edges: Array<[string, string]> = [];
  for (const node of nodes) {
    for (const prereq of node.prerequisites) {
      edges.push([prereq, node.id]);
    }
  }
  return edges;
}

/**
 * Creates an initial UserProgress with no unlocked nodes.
 *
 * @param startingXp - XP the user starts with (default 0).
 */
export function createInitialProgress(startingXp = 0): UserProgress {
  return {
    unlockedNodes: new Set<string>(),
    availableXp: startingXp,
  };
}
