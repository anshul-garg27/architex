// ── AI Hint System — 3-tier progressive hint engine ─────────────────
//
// Provides increasingly detailed hints for system design challenges.
// Tier 1 (nudge): brief question pushing the user in the right direction.
// Tier 2 (guided): specific suggestion with reasoning.
// Tier 3 (full-explanation): complete explanation with diagram suggestions.
//
// AI-004: Optionally uses Claude for dynamic, context-aware hints
// when an API key is configured. Falls back to static hints otherwise.

import { ClaudeClient } from './claude-client';
import type { ClaudeModel } from './claude-client';

// ── Types ───────────────────────────────────────────────────────────

export type HintTier = 'nudge' | 'guided' | 'full-explanation';

export type ChallengeCategory =
  | 'scaling'
  | 'reliability'
  | 'data'
  | 'caching'
  | 'messaging'
  | 'networking'
  | 'security'
  | 'general';

export interface HintRequest {
  challengeId: string;
  challengeTitle: string;
  category: ChallengeCategory;
  /** Serialised description of the user's current design (node/edge summary). */
  currentDesign: string;
  tier: HintTier;
}

export interface HintResponse {
  tier: HintTier;
  content: string;
  /** Optional follow-up question the user should consider. */
  followUp?: string;
  /** Suggested diagram additions (component names). */
  diagramSuggestions?: string[];
  /** Credit cost for this hint tier (1 / 3 / 5). */
  creditCost: number;
  /** Timestamp when the hint was generated. */
  generatedAt: number;
}

export interface HintBudget {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  hintsUsed: HintTier[];
}

// ── Constants ───────────────────────────────────────────────────────

export const TIER_CREDIT_COST: Record<HintTier, number> = {
  nudge: 1,
  guided: 3,
  'full-explanation': 5,
};

export const TIER_ORDER: HintTier[] = ['nudge', 'guided', 'full-explanation'];

const DEFAULT_TOTAL_CREDITS = 15;

// ── Mock hint bank ──────────────────────────────────────────────────

interface MockHintSet {
  nudge: string;
  nudgeFollowUp: string;
  guided: string;
  guidedFollowUp: string;
  full: string;
  fullDiagramSuggestions: string[];
}

const MOCK_HINTS: Record<ChallengeCategory, MockHintSet> = {
  scaling: {
    nudge: 'Have you considered what happens when your traffic increases by 10x? Which component becomes the bottleneck first?',
    nudgeFollowUp: 'Think about where requests are concentrated.',
    guided:
      'Consider adding horizontal scaling with a load balancer in front of your application servers. Use stateless services so any instance can handle any request. Move session state to a shared store like Redis.',
    guidedFollowUp: 'How would you handle database reads that are 10x heavier than writes?',
    full: 'For horizontal scaling, introduce an L7 load balancer (e.g. Nginx or ALB) distributing traffic across N stateless app servers. Add read replicas for your database to offload read traffic — most systems are read-heavy (80/20 rule). Use a CDN for static assets and implement connection pooling at the database layer. Consider database sharding if single-node capacity is exceeded: choose a shard key that distributes evenly (e.g. user_id modulo N). Add auto-scaling policies based on CPU utilisation or request queue depth.',
    fullDiagramSuggestions: ['Load Balancer', 'App Server (x3)', 'Read Replica (x2)', 'CDN', 'Redis Session Store'],
  },
  reliability: {
    nudge: 'What happens if one of your servers goes down right now? Can your system still serve requests?',
    nudgeFollowUp: 'Think about single points of failure in your architecture.',
    guided:
      'Add redundancy at every layer: multiple app server instances behind a load balancer, database replication with automatic failover, and health checks to detect and route around failures. Implement circuit breakers to prevent cascading failures between services.',
    guidedFollowUp: 'How would you handle a situation where your primary database becomes unreachable?',
    full: 'Build reliability through defence in depth. At the compute layer: run at least 3 instances across 2+ availability zones with a load balancer performing health checks. At the data layer: use primary-replica replication with automatic failover (RDS Multi-AZ or similar). Implement circuit breakers (open after 5 consecutive failures, half-open after 30s) between all service-to-service calls. Add retry logic with exponential backoff and jitter. Use a dead letter queue for failed async operations. Set up alerting on error rate thresholds (>1% 5xx responses triggers page).',
    fullDiagramSuggestions: ['Health Check', 'Circuit Breaker', 'Primary DB', 'Replica DB', 'Dead Letter Queue'],
  },
  data: {
    nudge: 'How are you modelling the relationships between your core entities? Are there any access patterns you have not considered?',
    nudgeFollowUp: 'Think about which queries will be most frequent.',
    guided:
      'Start by listing your top 5 read and write patterns. Choose your storage engine based on those patterns — relational for complex joins, NoSQL for flexible schemas or high write throughput. Denormalise for read-heavy patterns and consider event sourcing for audit trails.',
    guidedFollowUp: 'What indexing strategy would you use for your most common query?',
    full: 'Design your data model around access patterns, not entities. For a typical social/feed system: use a relational database (PostgreSQL) for user profiles and relationships (strong consistency needed), a wide-column store (Cassandra) for feed timelines (high write throughput, partition by user_id), and a search engine (Elasticsearch) for text queries. Add database indices on columns used in WHERE and JOIN clauses. Use write-ahead logging for durability. For analytics, consider a star schema with fact and dimension tables in a data warehouse. Implement CQRS if read and write patterns differ significantly.',
    fullDiagramSuggestions: ['PostgreSQL', 'Cassandra', 'Elasticsearch', 'Write-Ahead Log', 'Data Warehouse'],
  },
  caching: {
    nudge: 'Are there any repeated reads in your system that return the same data? Where could you avoid hitting the database?',
    nudgeFollowUp: 'Consider what percentage of your reads are identical.',
    guided:
      'Add a caching layer (Redis or Memcached) between your application and database for read-heavy data. Use cache-aside (lazy loading) for data that is read often but updated rarely. Set appropriate TTLs based on how stale the data can be.',
    guidedFollowUp: 'What cache invalidation strategy would you use — write-through, write-behind, or TTL?',
    full: 'Implement a multi-level caching strategy. Browser cache for static assets (Cache-Control headers, 1 year for versioned files). CDN cache for regional content distribution. Application-level cache (Redis) using cache-aside pattern: check cache first, on miss read from DB and populate cache. Set TTL based on data freshness requirements (user profiles: 5 min, product catalogue: 1 hour, static config: 24 hours). For cache invalidation, use write-through for critical data and TTL-based expiry for eventual consistency scenarios. Monitor cache hit rate — target >90%.',
    fullDiagramSuggestions: ['Browser Cache', 'CDN', 'Redis Cache', 'Cache Invalidation Service'],
  },
  messaging: {
    nudge: 'Are there operations in your flow that do not need to complete synchronously? Could the user receive a response before all processing finishes?',
    nudgeFollowUp: 'Think about which operations can tolerate a delay.',
    guided:
      'Introduce a message queue (e.g. Kafka or SQS) to decouple time-consuming operations from the request path. The API responds immediately with "accepted" and a worker processes the task asynchronously. This improves response times and makes your system more resilient to downstream slowdowns.',
    guidedFollowUp: 'How would you guarantee that a message is processed exactly once?',
    full: 'Use asynchronous messaging to decouple producers from consumers. Choose Kafka for high-throughput ordered event streams (partitioned by key for ordering guarantees) or SQS/RabbitMQ for simpler task queues. Implement the outbox pattern to prevent data loss: write the event to a database outbox table in the same transaction as the business data, then a poller or CDC mechanism publishes to the queue. Use consumer groups for parallel processing. Implement idempotency keys to handle at-least-once delivery safely. Add a dead letter queue for poison messages (retry 3x then DLQ).',
    fullDiagramSuggestions: ['Message Queue', 'Worker Pool', 'Dead Letter Queue', 'Outbox Table'],
  },
  networking: {
    nudge: 'How does a request travel from the client to your backend? Are there any hops you have not drawn yet?',
    nudgeFollowUp: 'Consider DNS, TLS, and load balancing.',
    guided:
      'Trace the full request path: client -> DNS resolver -> CDN/Edge -> Load Balancer -> API Gateway -> Service. At each hop, consider latency, failure modes, and security. Add an API Gateway for rate limiting, authentication, and request routing.',
    guidedFollowUp: 'What protocol would you choose between services — REST, gRPC, or GraphQL — and why?',
    full: 'Map the full network path. DNS resolution (use Route 53 with latency-based routing for multi-region). TLS termination at the load balancer or edge (reduces backend CPU). API Gateway handles rate limiting, auth token validation, and request routing. Between services: use gRPC for internal service-to-service (binary protocol, ~10x smaller payloads than JSON, bidirectional streaming), REST for public APIs (wide client support), and WebSockets for real-time features. Implement service mesh (Envoy/Istio) for observability, mutual TLS, and traffic management in a microservices architecture.',
    fullDiagramSuggestions: ['DNS', 'CDN Edge', 'API Gateway', 'Service Mesh', 'gRPC Channel'],
  },
  security: {
    nudge: 'Who can access your system, and how do you verify their identity? What happens if someone tries to access data they should not see?',
    nudgeFollowUp: 'Think about authentication versus authorisation.',
    guided:
      'Implement JWT-based authentication with short-lived access tokens (15 min) and longer refresh tokens (7 days). Use RBAC or ABAC for authorisation. Encrypt data at rest (AES-256) and in transit (TLS 1.3). Never store passwords in plaintext — use bcrypt with a cost factor of 12+.',
    guidedFollowUp: 'How would you handle token revocation for a compromised account?',
    full: 'Build security in layers. Authentication: OAuth 2.0 / OIDC flow with JWT access tokens (15 min TTL) and opaque refresh tokens stored server-side. Password hashing: bcrypt with cost 12+, never SHA/MD5. Authorisation: RBAC with permission-based checks at the API layer. Network: TLS 1.3 everywhere, mutual TLS between internal services. Data: AES-256-GCM at rest, column-level encryption for PII. API security: rate limiting, input validation, CORS, CSRF tokens, SQL injection prevention via parameterised queries. Add audit logging for all sensitive operations. Run SAST/DAST in CI pipeline.',
    fullDiagramSuggestions: ['Auth Service', 'Token Store', 'WAF', 'Encryption Service', 'Audit Log'],
  },
  general: {
    nudge: 'Take a step back and think about the core requirements. What is the single most important quality attribute for this system?',
    nudgeFollowUp: 'Prioritise: latency, throughput, consistency, or availability?',
    guided:
      'Break the problem into functional and non-functional requirements. Address the functional requirements first with a basic architecture, then layer on non-functional concerns (scaling, caching, reliability) one at a time. Start with a monolithic design and identify what needs to be extracted.',
    guidedFollowUp: 'What are the most important trade-offs in your current design?',
    full: 'Approach system design methodically. Step 1: Clarify requirements — functional (what it does) and non-functional (how well it does it). Step 2: Estimate scale — DAU, QPS, storage needs (back-of-envelope). Step 3: Define API contracts for core operations. Step 4: Design the data model and choose storage technologies. Step 5: Draw the high-level architecture with core components. Step 6: Deep-dive into the most complex or critical component. Step 7: Address failure modes and scaling bottlenecks. Throughout, call out trade-offs explicitly (CAP theorem, latency vs consistency, cost vs performance).',
    fullDiagramSuggestions: ['Client', 'Load Balancer', 'App Server', 'Database', 'Cache', 'Message Queue'],
  },
};

// ── Hint engine ─────────────────────────────────────────────────────

/**
 * Generate a hint for the given challenge at the requested tier.
 *
 * Returns a mock response based on the challenge category — no API calls.
 * Simulates a brief delay via the `generatedAt` timestamp.
 */
export function generateHint(
  challenge: { id: string; title: string; category?: ChallengeCategory },
  _currentDesign: string,
  tier: HintTier,
): HintResponse {
  const category: ChallengeCategory = challenge.category ?? inferCategory(challenge.title);
  const hints = MOCK_HINTS[category];
  const creditCost = TIER_CREDIT_COST[tier];

  switch (tier) {
    case 'nudge':
      return {
        tier,
        content: hints.nudge,
        followUp: hints.nudgeFollowUp,
        creditCost,
        generatedAt: Date.now(),
      };
    case 'guided':
      return {
        tier,
        content: hints.guided,
        followUp: hints.guidedFollowUp,
        creditCost,
        generatedAt: Date.now(),
      };
    case 'full-explanation':
      return {
        tier,
        content: hints.full,
        diagramSuggestions: hints.fullDiagramSuggestions,
        creditCost,
        generatedAt: Date.now(),
      };
  }
}

/**
 * Check whether a tier can be unlocked given the current usage history.
 * Progressive disclosure: must unlock tiers in order.
 */
export function canUnlockTier(tier: HintTier, usedTiers: HintTier[]): boolean {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === 0) return true;
  // All preceding tiers must be unlocked
  for (let i = 0; i < idx; i++) {
    if (!usedTiers.includes(TIER_ORDER[i])) return false;
  }
  return true;
}

/**
 * Create and manage a credit budget for a hint session.
 */
export function createHintBudget(totalCredits: number = DEFAULT_TOTAL_CREDITS): HintBudget {
  return {
    totalCredits,
    usedCredits: 0,
    remainingCredits: totalCredits,
    hintsUsed: [],
  };
}

/**
 * Spend credits on a hint tier. Returns the updated budget, or null if
 * there are not enough credits remaining.
 */
export function spendCredits(budget: HintBudget, tier: HintTier): HintBudget | null {
  const cost = TIER_CREDIT_COST[tier];
  if (cost > budget.remainingCredits) return null;
  return {
    totalCredits: budget.totalCredits,
    usedCredits: budget.usedCredits + cost,
    remainingCredits: budget.remainingCredits - cost,
    hintsUsed: [...budget.hintsUsed, tier],
  };
}

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Infer a challenge category from its title using keyword matching.
 */
function inferCategory(title: string): ChallengeCategory {
  const lower = title.toLowerCase();
  const mapping: Array<[string[], ChallengeCategory]> = [
    [['scale', 'scaling', 'load balancer', 'horizontal', 'sharding'], 'scaling'],
    [['reliable', 'reliability', 'failover', 'redundancy', 'fault'], 'reliability'],
    [['database', 'data model', 'schema', 'storage', 'sql', 'nosql'], 'data'],
    [['cache', 'caching', 'redis', 'memcached', 'cdn'], 'caching'],
    [['queue', 'message', 'kafka', 'pub/sub', 'event', 'async'], 'messaging'],
    [['network', 'dns', 'http', 'api gateway', 'grpc', 'protocol'], 'networking'],
    [['security', 'auth', 'encrypt', 'token', 'oauth', 'rate limit'], 'security'],
  ];
  for (const [keywords, category] of mapping) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'general';
}

// ── AI-004: Live Claude-powered hint generation ─────────────────────

/** Simple hash of a string for use in cache keys. */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Map hint tiers to Claude models. nudge/guided use Haiku (cheap), full uses Sonnet. */
function modelForTier(tier: HintTier): ClaudeModel {
  return tier === 'full-explanation' ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5';
}

export interface LiveHintNode {
  id: string;
  label: string;
  category: string;
  componentType: string;
}

export interface LiveHintEdge {
  source: string;
  target: string;
  edgeType: string;
}

/**
 * Generate a dynamic, context-aware hint using Claude.
 *
 * Falls back to static `generateHint` when AI is not configured.
 *
 * @param challengeId     Unique challenge identifier.
 * @param tier            Hint detail level: nudge, guided, or full-explanation.
 * @param diagramState    Current nodes and edges on the canvas.
 * @param attemptHistory  Previous hints or actions by the user (for context).
 */
export async function generateHintLive(
  challengeId: string,
  tier: HintTier,
  diagramState: { nodes: LiveHintNode[]; edges: LiveHintEdge[] },
  attemptHistory: string[] = [],
): Promise<HintResponse> {
  const client = ClaudeClient.getInstance();

  // Fall back to static hints when AI is not available
  if (!client.isConfigured()) {
    const category = inferCategory(challengeId);
    return generateHint(
      { id: challengeId, title: challengeId, category },
      JSON.stringify(diagramState),
      tier,
    );
  }

  const diagramSummary = diagramState.nodes
    .map((n) => `${n.label} (${n.category}/${n.componentType})`)
    .join(', ');
  const edgeSummary = diagramState.edges
    .map((e) => `${e.source} -> ${e.target} (${e.edgeType})`)
    .join(', ');
  const stateHash = simpleHash(
    JSON.stringify({ n: diagramState.nodes.map((n) => n.id).sort(), e: diagramState.edges.length }),
  );

  const cacheKey = `hint:${challengeId}:${tier}:${stateHash}`;
  const cacheTtlMs = 3_600_000; // 1 hour

  const tierInstructions: Record<HintTier, string> = {
    nudge:
      'Give a brief, one-sentence nudge. Ask a question that guides the student toward what they are missing. Do NOT reveal the answer.',
    guided:
      'Give a specific suggestion with reasoning (2-3 sentences). Explain WHY this component or pattern is needed. Include a follow-up question.',
    'full-explanation':
      'Give a comprehensive explanation with:\n- What is missing and why\n- How to fix it step by step\n- Suggested components to add\n- A brief mermaid diagram showing the improved architecture\n- Follow-up considerations',
  };

  try {
    const response = await client.call({
      model: modelForTier(tier),
      systemPrompt: `You are a system design tutor providing hints for a design challenge. Your tone is encouraging and Socratic. Format your response as markdown.`,
      userMessage: `Challenge: ${challengeId}

Current diagram:
- Nodes: ${diagramSummary || '(empty canvas)'}
- Edges: ${edgeSummary || '(no connections)'}

Previous hints/actions: ${attemptHistory.length > 0 ? attemptHistory.join('; ') : 'None'}

Hint tier: ${tier}
Instructions: ${tierInstructions[tier]}`,
      maxTokens: tier === 'full-explanation' ? 1024 : 256,
      cacheKey,
      cacheTtlMs,
    });

    return {
      tier,
      content: response.text,
      creditCost: TIER_CREDIT_COST[tier],
      generatedAt: Date.now(),
    };
  } catch {
    // AI call failed — fall back to static hints
    const category = inferCategory(challengeId);
    return generateHint(
      { id: challengeId, title: challengeId, category },
      JSON.stringify(diagramState),
      tier,
    );
  }
}
