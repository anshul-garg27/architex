// ── Socratic Tutor — 4-phase conversational learning engine ─────────
//
// Guides a learner through a topic using the Socratic method:
//   Phase 1 (Assess):    Ask what the user knows about the topic
//   Phase 2 (Challenge): Present a scenario or edge case
//   Phase 3 (Guide):     Lead toward insight with questions
//   Phase 4 (Reinforce): Summarise what was learned
//
// Fully client-side with keyword-based mock responses — no API calls.

export type { ChallengeCategory } from './hint-system';
import type { ChallengeCategory } from './hint-system';

// ── Types ───────────────────────────────────────────────────────────

export type SocraticPhase = 'assess' | 'challenge' | 'guide' | 'reinforce';

export type MessageRole = 'tutor' | 'user';

export interface TutorMessage {
  id: string;
  role: MessageRole;
  content: string;
  phase: SocraticPhase;
  timestamp: number;
  /** Quick-response suggestions the user can click. */
  suggestions?: string[];
}

export interface SocraticSessionState {
  sessionId: string;
  topic: string;
  category: ChallengeCategory;
  currentPhase: SocraticPhase;
  history: TutorMessage[];
  isComplete: boolean;
  phaseProgress: Record<SocraticPhase, boolean>;
}

// ── Constants ───────────────────────────────────────────────────────

export const PHASE_ORDER: SocraticPhase[] = ['assess', 'challenge', 'guide', 'reinforce'];

export const PHASE_LABELS: Record<SocraticPhase, string> = {
  assess: 'Assess Understanding',
  challenge: 'Challenge Thinking',
  guide: 'Guide to Insight',
  reinforce: 'Reinforce Learning',
};

export const PHASE_DESCRIPTIONS: Record<SocraticPhase, string> = {
  assess: 'Exploring what you already know',
  challenge: 'Testing your understanding with edge cases',
  guide: 'Leading you toward deeper insight',
  reinforce: 'Summarising key takeaways',
};

// ── Mock response bank ──────────────────────────────────────────────

interface TopicResponses {
  assess: { opening: string; suggestions: string[] };
  challenge: { scenarios: string[]; suggestions: string[] };
  guide: { questions: string[]; suggestions: string[] };
  reinforce: { summaries: string[] };
}

const TOPIC_RESPONSES: Record<ChallengeCategory, TopicResponses> = {
  scaling: {
    assess: {
      opening: 'Let us talk about scaling systems. Before we dive in, can you tell me what you understand about the difference between vertical and horizontal scaling? When would you choose one over the other?',
      suggestions: [
        'Vertical scaling means adding more resources to a single machine',
        'Horizontal scaling means adding more machines',
        'I am not sure about the trade-offs between them',
      ],
    },
    challenge: {
      scenarios: [
        'Interesting. Now imagine your application suddenly receives 100x its normal traffic due to a viral event. Your current setup is 2 app servers behind a load balancer with a single database. What breaks first, and what do you do?',
        'Good thinking. But here is a wrinkle: your database is now the bottleneck. You cannot just add more app servers. How do you scale the data layer without losing consistency for financial transactions?',
      ],
      suggestions: [
        'The database would be the bottleneck',
        'I would add read replicas',
        'Connection pooling might help',
      ],
    },
    guide: {
      questions: [
        'You mentioned read replicas — that is a solid start. But consider this: if a user writes data and immediately reads it, which replica serves that read? How do you prevent reading stale data in this scenario?',
        'Exactly right. Now let us connect this to a real pattern: what if we route reads that must be fresh to the primary, and eventual-consistency-tolerant reads to replicas? What is this pattern called, and what are its trade-offs?',
      ],
      suggestions: [
        'Read-after-write consistency',
        'Route writes and immediate reads to the primary',
        'This relates to the CAP theorem',
      ],
    },
    reinforce: {
      summaries: [
        'Excellent work. Let us recap what we covered:\n\n1. **Vertical vs Horizontal Scaling** — vertical is simpler but has a ceiling; horizontal requires stateless design.\n2. **Database Scaling** — read replicas for read-heavy workloads, sharding for write-heavy ones.\n3. **Consistency Trade-offs** — read-after-write consistency by routing to primary, eventual consistency for less critical reads.\n4. **Key Principle**: Scale the bottleneck, not everything. Always identify what breaks first.',
      ],
    },
  },
  reliability: {
    assess: {
      opening: 'Reliability is critical for production systems. What does it mean to you when we say a system needs to be "highly available"? Can you explain the concept of "nines" (99.9%, 99.99%) in availability?',
      suggestions: [
        '99.9% means about 8.7 hours of downtime per year',
        'It means the system is always accessible',
        'I know it is related to uptime but not the specifics',
      ],
    },
    challenge: {
      scenarios: [
        'Good foundation. Now here is a scenario: your primary database goes down at 3 AM. Your replica exists but is 30 seconds behind. You have a financial application where every transaction matters. Do you failover automatically, or do you wait? What are the risks either way?',
        'That is a thoughtful answer. Now consider this: your service depends on 5 downstream microservices. If any one of them is slow (not down, just slow — 10 second response times), your entire API becomes slow. How do you prevent one slow service from taking down the whole system?',
      ],
      suggestions: [
        'Automatic failover with some data loss risk',
        'Wait for manual intervention to prevent inconsistency',
        'Use circuit breakers to isolate failures',
      ],
    },
    guide: {
      questions: [
        'You brought up circuit breakers — great instinct. Can you walk me through the three states of a circuit breaker? When does it transition between them, and what happens to requests in each state?',
        'Perfect. Now think about this from the user\'s perspective. When a circuit is "open" and requests fail fast, what should the user experience be? Is returning an error always the right answer, or could you do something smarter?',
      ],
      suggestions: [
        'Closed, Open, Half-Open states',
        'Show cached or degraded content instead of errors',
        'Graceful degradation with fallback responses',
      ],
    },
    reinforce: {
      summaries: [
        'Great discussion. Here are the key takeaways:\n\n1. **Availability Maths** — each "nine" is 10x harder; 99.99% allows only 52 minutes of downtime per year.\n2. **Failover Decisions** — automatic is faster but risks data loss; the right choice depends on consistency requirements.\n3. **Circuit Breakers** — Closed (normal) -> Open (fail fast) -> Half-Open (test recovery). Prevents cascading failures.\n4. **Graceful Degradation** — serve cached/partial data rather than errors. The best systems fail partially, not totally.',
      ],
    },
  },
  data: {
    assess: {
      opening: 'Data modelling is the foundation of any system. What is your approach when you need to choose between a relational database and a NoSQL database? What factors drive that decision?',
      suggestions: [
        'It depends on the data relationships and query patterns',
        'Relational for structured data, NoSQL for flexible schemas',
        'I usually just use PostgreSQL for everything',
      ],
    },
    challenge: {
      scenarios: [
        'Interesting perspective. Here is a real scenario: you are building a social media feed. Users create posts, follow others, and see a personalised feed. You need to serve the feed in under 100ms. Would you store the feed pre-computed (fan-out on write) or compute it on read (fan-out on read)? What happens when a celebrity with 10 million followers posts?',
        'Good analysis. Now consider the data consistency angle: a user updates their profile photo. That photo appears in thousands of cached feeds. How do you keep all those feeds up to date without re-computing everything?',
      ],
      suggestions: [
        'Fan-out on write for most users, on read for celebrities',
        'Pre-compute feeds and store in a fast data store',
        'Use eventual consistency with a background update job',
      ],
    },
    guide: {
      questions: [
        'You mentioned a hybrid approach — that is exactly what large-scale systems do. This pattern is sometimes called the "push-pull" model. Can you think about what threshold you would use to switch between push and pull? How would you determine it?',
        'Now connect this to your storage choice. If you are storing pre-computed feeds, what data structure would you use in your data store? Think about what operations you need: append, truncate, read-top-N.',
      ],
      suggestions: [
        'Switch based on follower count threshold',
        'A sorted list or sorted set in Redis',
        'Use a time-series approach with partitioning by user',
      ],
    },
    reinforce: {
      summaries: [
        'Excellent reasoning. Let us summarise:\n\n1. **SQL vs NoSQL** — driven by access patterns, not data shape. Use both when they solve different problems.\n2. **Fan-out Strategies** — write-time for normal users (fast reads), read-time for high-follower accounts (avoids write amplification).\n3. **Hybrid Push-Pull** — real systems combine both approaches with a follower-count threshold.\n4. **Storage Choice** — Redis sorted sets for fast ranked feeds; Cassandra for high-write-throughput timelines.\n5. **Key Principle**: Model data around access patterns, not entity relationships.',
      ],
    },
  },
  caching: {
    assess: {
      opening: 'Caching is one of the most impactful performance optimisations. Can you explain the difference between cache-aside, write-through, and write-behind caching strategies? When would you choose each one?',
      suggestions: [
        'Cache-aside: app checks cache first, loads from DB on miss',
        'Write-through: writes go to cache and DB simultaneously',
        'I know caching helps but am not sure about the strategies',
      ],
    },
    challenge: {
      scenarios: [
        'Good start. Here is a tricky scenario: you have a cache-aside setup with Redis. A popular item\'s cache entry expires. At that exact moment, 1000 concurrent requests come in for that item. All of them see a cache miss. What happens, and how do you prevent it?',
        'Nice — you are thinking about cache stampede. Now consider another problem: your cache is full and you need to evict entries. You have LRU, LFU, and TTL as options. A user with a free account requests data every hour, while a premium user requests different data every second. Which eviction policy serves both well?',
      ],
      suggestions: [
        'All 1000 requests hit the database simultaneously',
        'Use a lock or single-flight pattern',
        'LRU would evict the free user\'s data first',
      ],
    },
    guide: {
      questions: [
        'You identified the stampede problem correctly. The "single-flight" or "lock" pattern is one solution. But what about cache warming — could you proactively refresh entries before they expire? What trade-offs does that introduce?',
        'Right, pre-warming uses resources even if the data is not needed. So let us combine approaches: background refresh for hot keys (how do you identify "hot"?), single-flight for warm keys, and normal cache-aside for cold keys. What metric would you track to classify keys?',
      ],
      suggestions: [
        'Track access frequency to identify hot keys',
        'Refresh keys that are accessed more than N times per minute',
        'Use a probabilistic approach like a count-min sketch',
      ],
    },
    reinforce: {
      summaries: [
        'Great exploration. Key takeaways:\n\n1. **Cache Strategies** — cache-aside for reads, write-through for consistency, write-behind for performance.\n2. **Cache Stampede** — prevent with single-flight/locking pattern or probabilistic early expiration.\n3. **Eviction Policies** — LRU is simple but misses frequency; LFU captures frequency but not recency; consider W-TinyLFU for best of both.\n4. **Hot Key Management** — monitor access patterns and proactively warm hot keys.\n5. **Key Principle**: A cache is only useful if the hit rate is high. Monitor it and optimise for your actual access patterns.',
      ],
    },
  },
  messaging: {
    assess: {
      opening: 'Message queues are fundamental to distributed systems. What is your understanding of the difference between a message queue (like SQS) and an event streaming platform (like Kafka)? When would you pick one over the other?',
      suggestions: [
        'Queues are for task distribution, streams are for event logs',
        'Kafka retains messages, SQS deletes after consumption',
        'I know they decouple services but am not sure about the specifics',
      ],
    },
    challenge: {
      scenarios: [
        'Good distinction. Now consider this: you are building an e-commerce order system. When an order is placed, you need to: (1) reserve inventory, (2) charge payment, (3) send confirmation email, (4) update analytics. If payment fails after inventory is reserved, how do you handle it?',
        'Interesting approach. But what about ordering? Kafka guarantees order within a partition. If you partition by order_id, you get per-order ordering. But what if you need to process all orders from the same user in order? And the user is placing orders from multiple devices simultaneously?',
      ],
      suggestions: [
        'Use a saga pattern with compensating transactions',
        'Two-phase commit across all services',
        'Partition by user_id instead of order_id',
      ],
    },
    guide: {
      questions: [
        'You mentioned the saga pattern — that is exactly right for distributed transactions. Can you walk me through the two types of sagas: choreography (event-driven) versus orchestration (central coordinator)? What are the trade-offs?',
        'Good comparison. Now think about failure in the saga itself. Your orchestrator has sent "reserve inventory" and "charge payment" messages. The orchestrator crashes before sending "send email." When it recovers, how does it know where it left off?',
      ],
      suggestions: [
        'Choreography: services react to events independently',
        'Orchestration: central service coordinates the flow',
        'Store saga state in a durable log before each step',
      ],
    },
    reinforce: {
      summaries: [
        'Excellent discussion. Summary:\n\n1. **Queues vs Streams** — queues for task distribution (delete after consume), streams for event sourcing (retain and replay).\n2. **Distributed Transactions** — avoid 2PC in microservices; use sagas with compensating actions.\n3. **Saga Patterns** — choreography for simple flows (loosely coupled), orchestration for complex flows (easier to reason about).\n4. **Durability** — persist saga state before each step; use idempotency keys for at-least-once delivery.\n5. **Key Principle**: Design for failure. Every message handler should be idempotent and every saga step should have a compensating action.',
      ],
    },
  },
  networking: {
    assess: {
      opening: 'Understanding networking is key to building efficient distributed systems. Can you explain what happens when a user types a URL in their browser and presses Enter? Walk me through the full journey of that request.',
      suggestions: [
        'DNS resolution, TCP handshake, TLS, HTTP request, response',
        'The browser sends a request to the server',
        'I know about HTTP but not the full path',
      ],
    },
    challenge: {
      scenarios: [
        'Good overview. Now here is a performance puzzle: your API responds in 5ms at the server, but users in another continent see 500ms latency. Where is the time going, and how would you reduce it?',
        'CDN helps for static content. But what about dynamic API calls? A user in Tokyo hits your server in Virginia. 200ms round trip just for physics (speed of light). How do you get that API response time under 100ms?',
      ],
      suggestions: [
        'Network latency from physical distance',
        'Use a CDN to serve content closer to users',
        'Deploy API servers in multiple regions',
      ],
    },
    guide: {
      questions: [
        'Multi-region deployment introduces a hard problem: data consistency across regions. If you deploy your API and database in both Virginia and Tokyo, how do you handle a user who writes in Tokyo and reads from Virginia 50ms later?',
        'Exactly — this is the CAP theorem in practice. Can you think of which of your data types need strong consistency (always read latest) versus which can tolerate eventual consistency (a few seconds stale is fine)?',
      ],
      suggestions: [
        'User authentication needs strong consistency',
        'Social feeds can tolerate eventual consistency',
        'Use conflict-free replicated data types (CRDTs)',
      ],
    },
    reinforce: {
      summaries: [
        'Great discussion. Takeaways:\n\n1. **Request Lifecycle** — DNS -> TCP -> TLS -> HTTP. Each adds latency; optimise with connection reuse, TLS session resumption, HTTP/2 multiplexing.\n2. **Latency Budget** — physics sets the floor. Speed of light: ~100ms for a cross-Pacific round trip.\n3. **Multi-Region** — deploy compute close to users; replicate data with appropriate consistency model.\n4. **Consistency Spectrum** — strong consistency for auth/payments, eventual for feeds/analytics. Not all data is equal.\n5. **Key Principle**: Network latency is the performance tax you cannot optimise away — you must architect around it.',
      ],
    },
  },
  security: {
    assess: {
      opening: 'Security is non-negotiable in production systems. Can you explain the difference between authentication and authorisation? How do modern systems typically implement each?',
      suggestions: [
        'Authentication: who are you? Authorisation: what can you do?',
        'JWT tokens for auth, RBAC for permissions',
        'I know authentication but am less clear on authorisation patterns',
      ],
    },
    challenge: {
      scenarios: [
        'Solid foundation. Here is a scenario: a user\'s JWT access token has been stolen. The token is valid for 15 more minutes. How do you immediately revoke access? Remember, JWTs are stateless — the server does not track them by design.',
        'Good thinking about token revocation. Now consider another attack vector: your internal microservices communicate over the network. If an attacker gains access to your internal network, they can call any internal API. How do you secure service-to-service communication?',
      ],
      suggestions: [
        'Maintain a blocklist of revoked tokens',
        'Use short-lived tokens and check a revocation endpoint',
        'Mutual TLS between services',
      ],
    },
    guide: {
      questions: [
        'You mentioned a revocation list — that works, but now every API call needs to check that list. You have re-introduced statefulness to a stateless system. Is there a way to balance security and performance here? Think about what an acceptable window of risk might be.',
        'Short-lived tokens plus refresh rotation is a good balance. But let us go deeper: what if the refresh token is also stolen? How does "refresh token rotation" help detect this kind of theft?',
      ],
      suggestions: [
        'Very short-lived access tokens (1-5 minutes)',
        'If a refresh token is reused, revoke the entire family',
        'Bind tokens to the device fingerprint',
      ],
    },
    reinforce: {
      summaries: [
        'Excellent reasoning. Key points:\n\n1. **AuthN vs AuthZ** — authentication verifies identity, authorisation verifies permissions. Implement separately.\n2. **JWT Trade-offs** — stateless (scalable) but hard to revoke. Balance with short TTLs (5-15 min).\n3. **Token Rotation** — refresh tokens are single-use. Reuse detection triggers family revocation.\n4. **Zero Trust** — mutual TLS + service identity for internal traffic. Never trust the network.\n5. **Key Principle**: Security is about layers. No single mechanism is sufficient; combine multiple controls at different levels.',
      ],
    },
  },
  general: {
    assess: {
      opening: 'System design is about making trade-offs. Before we explore a specific topic, can you tell me about your approach to a new system design problem? What are the first things you do when given a problem statement?',
      suggestions: [
        'Clarify requirements and constraints first',
        'Start drawing components immediately',
        'Estimate the scale of the system',
      ],
    },
    challenge: {
      scenarios: [
        'Requirements-first is a great instinct. Here is a challenge: your interviewer says "Design Twitter." You have 45 minutes. You could spend 10 minutes on requirements, but that is 22% of your time on no visible output. How do you balance thoroughness with showing progress?',
        'Good time management. Now here is a design trade-off: you are building a notification system. You can make it strongly consistent (every notification delivered exactly once, in order) or eventually consistent (might be slightly delayed or duplicated). Your PM wants both. What do you say?',
      ],
      suggestions: [
        'Spend 5 minutes on core requirements, iterate later',
        'Explain the CAP theorem trade-offs',
        'Strong consistency for critical notifications, eventual for others',
      ],
    },
    guide: {
      questions: [
        'You brought up prioritising notifications — that is real-world thinking. Can you generalise this principle? In what other areas of system design do we make different guarantees for different types of data or operations?',
        'Exactly — tiered quality of service is everywhere in distributed systems. The best architects do not design one-size-fits-all solutions. How would you communicate these trade-offs to a non-technical stakeholder?',
      ],
      suggestions: [
        'Different SLAs for different user tiers',
        'Different consistency levels for different data types',
        'Use concrete examples and business impact',
      ],
    },
    reinforce: {
      summaries: [
        'Great exploration. Summary:\n\n1. **Structured Approach** — requirements, estimation, API, data model, architecture, deep dive. Spend ~5 min on requirements, not 10.\n2. **Trade-offs Are the Point** — interviewers want to see you identify and reason about trade-offs, not build a perfect system.\n3. **Tiered Guarantees** — different data types deserve different consistency, latency, and durability guarantees.\n4. **Communication** — the best system design is one you can explain clearly. Use business impact to justify technical decisions.\n5. **Key Principle**: There is no perfect system. The best design is the one whose trade-offs are explicit and aligned with business requirements.',
      ],
    },
  },
};

// ── SocraticSession class ───────────────────────────────────────────

let sessionCounter = 0;

function generateId(): string {
  return `msg_${Date.now()}_${++sessionCounter}`;
}

/**
 * A Socratic tutoring session that guides a learner through 4 phases
 * of understanding on a system design topic.
 */
export class SocraticSession {
  private state: SocraticSessionState;
  private responses: TopicResponses;
  private phaseInteractionCount: Record<SocraticPhase, number>;

  constructor(topic: string, category?: ChallengeCategory) {
    const resolvedCategory = category ?? inferCategoryFromTopic(topic);
    this.responses = TOPIC_RESPONSES[resolvedCategory];
    this.phaseInteractionCount = { assess: 0, challenge: 0, guide: 0, reinforce: 0 };

    this.state = {
      sessionId: `session_${Date.now()}`,
      topic,
      category: resolvedCategory,
      currentPhase: 'assess',
      history: [],
      isComplete: false,
      phaseProgress: { assess: false, challenge: false, guide: false, reinforce: false },
    };
  }

  /** Begin the session with the tutor's opening message. */
  start(): TutorMessage {
    const message: TutorMessage = {
      id: generateId(),
      role: 'tutor',
      content: this.responses.assess.opening,
      phase: 'assess',
      timestamp: Date.now(),
      suggestions: this.responses.assess.suggestions,
    };
    this.state.history.push(message);
    return message;
  }

  /** Process user input and return the tutor's response. */
  respond(userInput: string): TutorMessage {
    // Record the user's message
    const userMessage: TutorMessage = {
      id: generateId(),
      role: 'user',
      content: userInput,
      phase: this.state.currentPhase,
      timestamp: Date.now(),
    };
    this.state.history.push(userMessage);

    this.phaseInteractionCount[this.state.currentPhase]++;

    // Generate tutor response based on current phase
    const tutorResponse = this.generatePhaseResponse();
    this.state.history.push(tutorResponse);

    // Check if we should advance to the next phase
    this.maybeAdvancePhase();

    return tutorResponse;
  }

  /** Get the current phase of the session. */
  getCurrentPhase(): SocraticPhase {
    return this.state.currentPhase;
  }

  /** Get the full conversation history. */
  getHistory(): TutorMessage[] {
    return [...this.state.history];
  }

  /** Get the full session state. */
  getState(): SocraticSessionState {
    return { ...this.state, history: [...this.state.history] };
  }

  /** Check if the session is complete. */
  isComplete(): boolean {
    return this.state.isComplete;
  }

  /** Get phase completion progress. */
  getPhaseProgress(): Record<SocraticPhase, boolean> {
    return { ...this.state.phaseProgress };
  }

  // ── Private methods ─────────────────────────────────────────

  private generatePhaseResponse(): TutorMessage {
    const phase = this.state.currentPhase;
    const count = this.phaseInteractionCount[phase];

    switch (phase) {
      case 'assess':
        return this.buildMessage(
          'That is a good starting point. Let me push your thinking a bit further.',
          this.responses.assess.suggestions,
        );

      case 'challenge': {
        const scenarios = this.responses.challenge.scenarios;
        const scenarioIdx = Math.min(count - 1, scenarios.length - 1);
        return this.buildMessage(
          scenarios[scenarioIdx],
          this.responses.challenge.suggestions,
        );
      }

      case 'guide': {
        const questions = this.responses.guide.questions;
        const questionIdx = Math.min(count - 1, questions.length - 1);
        return this.buildMessage(
          questions[questionIdx],
          this.responses.guide.suggestions,
        );
      }

      case 'reinforce': {
        const summaries = this.responses.reinforce.summaries;
        this.state.isComplete = true;
        return this.buildMessage(summaries[0]);
      }
    }
  }

  private buildMessage(content: string, suggestions?: string[]): TutorMessage {
    return {
      id: generateId(),
      role: 'tutor',
      content,
      phase: this.state.currentPhase,
      timestamp: Date.now(),
      suggestions,
    };
  }

  private maybeAdvancePhase(): void {
    const phase = this.state.currentPhase;
    const count = this.phaseInteractionCount[phase];
    const phaseIdx = PHASE_ORDER.indexOf(phase);

    // Each phase requires at least 1 interaction to advance (2 for guide)
    const minInteractions: Record<SocraticPhase, number> = {
      assess: 1,
      challenge: 2,
      guide: 2,
      reinforce: 1,
    };

    if (count >= minInteractions[phase] && phaseIdx < PHASE_ORDER.length - 1) {
      this.state.phaseProgress[phase] = true;
      this.state.currentPhase = PHASE_ORDER[phaseIdx + 1];
    } else if (phase === 'reinforce') {
      this.state.phaseProgress[phase] = true;
    }
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function inferCategoryFromTopic(topic: string): ChallengeCategory {
  const lower = topic.toLowerCase();
  const mapping: Array<[string[], ChallengeCategory]> = [
    [['scale', 'scaling', 'load', 'horizontal', 'shard', 'partition'], 'scaling'],
    [['reliable', 'reliability', 'failover', 'redundan', 'fault', 'circuit'], 'reliability'],
    [['database', 'data model', 'schema', 'storage', 'sql', 'nosql', 'data'], 'data'],
    [['cache', 'caching', 'redis', 'memcached', 'cdn', 'eviction'], 'caching'],
    [['queue', 'message', 'kafka', 'pub/sub', 'event', 'async', 'saga'], 'messaging'],
    [['network', 'dns', 'http', 'api gateway', 'grpc', 'latency', 'protocol'], 'networking'],
    [['security', 'auth', 'encrypt', 'token', 'oauth', 'jwt', 'rate limit'], 'security'],
  ];
  for (const [keywords, category] of mapping) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return 'general';
}
