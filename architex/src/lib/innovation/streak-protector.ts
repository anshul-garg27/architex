// ─────────────────────────────────────────────────────────────
// Architex — Streak Micro-Challenges
// ─────────────────────────────────────────────────────────────
//
// 5-minute micro-challenges to maintain a daily learning streak.
// Each day the user gets a quick question; answering it
// (correctly or not within time) keeps the streak alive.
//
// Public API:
//   getDailyMicroChallenge()          → today's challenge
//   submitMicroChallenge(id, answer)  → result + explanation
//   MICRO_CHALLENGES                  → full question bank (30+)
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** The type of answer input expected. */
export type AnswerType = 'multiple-choice' | 'short-answer';

/** A single micro-challenge question. */
export interface MicroChallenge {
  /** Unique identifier (kebab-case). */
  id: string;
  /** The question prompt. */
  question: string;
  /** Category tag. */
  category: 'caching' | 'load-balancing' | 'databases' | 'messaging' | 'architecture' | 'security' | 'networking' | 'monitoring' | 'scalability' | 'reliability' | 'distributed';
  /** Answer type. */
  answerType: AnswerType;
  /** For multiple-choice: the available options. */
  options?: string[];
  /** The correct answer (for MC: exact option text; for short-answer: keywords). */
  correctAnswer: string;
  /** Accepted alternative answers for short-answer (case-insensitive substring match). */
  acceptedAlternatives?: string[];
  /** Brief explanation shown after submission. */
  explanation: string;
  /** Time limit in seconds (default 300 = 5 min). */
  timeLimitSeconds: number;
}

/** Result of submitting a micro-challenge. */
export interface MicroChallengeResult {
  challengeId: string;
  correct: boolean;
  explanation: string;
  correctAnswer: string;
  userAnswer: string;
}

// ── Question Bank (30+ questions) ───────────────────────────

export const MICRO_CHALLENGES: MicroChallenge[] = [
  // ── Caching ──
  {
    id: 'cache-strategies-3',
    question: 'Name 3 common caching strategies.',
    category: 'caching',
    answerType: 'multiple-choice',
    options: [
      'Cache-aside, Read-through, Write-through',
      'Round-robin, Least-connections, IP-hash',
      'Sharding, Replication, Partitioning',
      'Pub/sub, Point-to-point, Fan-out',
    ],
    correctAnswer: 'Cache-aside, Read-through, Write-through',
    explanation: 'Cache-aside (lazy-loading), read-through (cache sits in front of DB), and write-through (writes go through cache to DB) are the three most common caching strategies.',
    timeLimitSeconds: 300,
  },
  {
    id: 'cache-invalidation',
    question: 'What is the hardest problem in caching?',
    category: 'caching',
    answerType: 'multiple-choice',
    options: ['Cache invalidation', 'Cache warming', 'Cache sizing', 'Cache partitioning'],
    correctAnswer: 'Cache invalidation',
    explanation: '"There are only two hard things in computer science: cache invalidation and naming things." Knowing when to expire or update cached data is notoriously difficult.',
    timeLimitSeconds: 300,
  },
  {
    id: 'cache-stampede',
    question: 'What causes a cache stampede?',
    category: 'caching',
    answerType: 'multiple-choice',
    options: [
      'Many requests hit the DB when a popular cache key expires',
      'The cache server runs out of memory',
      'Too many write operations to the cache',
      'Network partition between cache and app server',
    ],
    correctAnswer: 'Many requests hit the DB when a popular cache key expires',
    explanation: 'A cache stampede (thundering herd) occurs when a hot key expires and many concurrent requests all miss the cache simultaneously, overwhelming the database.',
    timeLimitSeconds: 300,
  },

  // ── Load Balancing ──
  {
    id: 'lb-algorithms',
    question: 'Which load balancing algorithm preserves session affinity?',
    category: 'load-balancing',
    answerType: 'multiple-choice',
    options: ['IP hash / sticky sessions', 'Round-robin', 'Random', 'Least connections'],
    correctAnswer: 'IP hash / sticky sessions',
    explanation: 'IP hash maps each client IP to a specific backend, ensuring requests from the same client always go to the same server (session affinity / sticky sessions).',
    timeLimitSeconds: 300,
  },
  {
    id: 'lb-l4-vs-l7',
    question: 'What is the key difference between L4 and L7 load balancers?',
    category: 'load-balancing',
    answerType: 'multiple-choice',
    options: [
      'L4 operates on TCP/UDP, L7 on HTTP/application layer',
      'L4 is faster, L7 is slower',
      'L4 is hardware, L7 is software',
      'L4 supports TLS, L7 does not',
    ],
    correctAnswer: 'L4 operates on TCP/UDP, L7 on HTTP/application layer',
    explanation: 'L4 load balancers route based on transport-layer info (IP, port). L7 balancers inspect application-layer data (HTTP headers, URLs, cookies) for smarter routing.',
    timeLimitSeconds: 300,
  },
  {
    id: 'lb-health-checks',
    question: 'Why are health checks important for load balancers?',
    category: 'load-balancing',
    answerType: 'multiple-choice',
    options: [
      'To remove unhealthy backends from the rotation',
      'To increase throughput',
      'To compress responses',
      'To enable TLS termination',
    ],
    correctAnswer: 'To remove unhealthy backends from the rotation',
    explanation: 'Health checks (active or passive) let the load balancer detect failing backends and stop sending traffic to them, improving overall reliability.',
    timeLimitSeconds: 300,
  },

  // ── Databases ──
  {
    id: 'db-cap-theorem',
    question: 'What does the CAP theorem state?',
    category: 'databases',
    answerType: 'multiple-choice',
    options: [
      'A distributed system can only guarantee 2 of: Consistency, Availability, Partition tolerance',
      'Caching Always Performs better than direct DB queries',
      'Consensus Always requires Paxos',
      'Clusters Are Partitioned by default',
    ],
    correctAnswer: 'A distributed system can only guarantee 2 of: Consistency, Availability, Partition tolerance',
    explanation: 'The CAP theorem (Brewer) states that during a network partition, a distributed system must choose between consistency and availability. All practical systems must handle partitions.',
    timeLimitSeconds: 300,
  },
  {
    id: 'db-acid',
    question: 'What does ACID stand for in database transactions?',
    category: 'databases',
    answerType: 'multiple-choice',
    options: [
      'Atomicity, Consistency, Isolation, Durability',
      'Availability, Consistency, Integrity, Distribution',
      'Asynchronous, Concurrent, Isolated, Distributed',
      'Atomic, Cached, Indexed, Durable',
    ],
    correctAnswer: 'Atomicity, Consistency, Isolation, Durability',
    explanation: 'ACID guarantees that transactions are atomic (all-or-nothing), consistent (valid state), isolated (concurrent transactions do not interfere), and durable (committed data persists).',
    timeLimitSeconds: 300,
  },
  {
    id: 'db-sharding-key',
    question: 'What is the most important consideration when choosing a shard key?',
    category: 'databases',
    answerType: 'multiple-choice',
    options: [
      'Even data distribution across shards',
      'Alphabetical ordering',
      'Smallest possible key size',
      'Using auto-increment IDs',
    ],
    correctAnswer: 'Even data distribution across shards',
    explanation: 'A good shard key distributes data evenly to avoid hot spots. Skewed distribution leads to some shards being overloaded while others sit idle.',
    timeLimitSeconds: 300,
  },

  // ── Messaging ──
  {
    id: 'msg-pubsub-vs-queue',
    question: 'What is the key difference between pub/sub and a message queue?',
    category: 'messaging',
    answerType: 'multiple-choice',
    options: [
      'Pub/sub fans out to all subscribers; queues deliver to one consumer',
      'Pub/sub is synchronous; queues are asynchronous',
      'Pub/sub is faster; queues are more reliable',
      'Pub/sub requires TCP; queues use UDP',
    ],
    correctAnswer: 'Pub/sub fans out to all subscribers; queues deliver to one consumer',
    explanation: 'In pub/sub, every subscriber receives every message. In a traditional queue, each message is consumed by exactly one consumer (competing consumers pattern).',
    timeLimitSeconds: 300,
  },
  {
    id: 'msg-dead-letter',
    question: 'What is a dead letter queue (DLQ)?',
    category: 'messaging',
    answerType: 'multiple-choice',
    options: [
      'A queue for messages that failed processing after max retries',
      'A queue that automatically deletes old messages',
      'A priority queue for urgent messages',
      'A queue that stores encrypted messages',
    ],
    correctAnswer: 'A queue for messages that failed processing after max retries',
    explanation: 'A DLQ captures messages that repeatedly fail processing. This prevents poison messages from blocking the main queue and allows debugging failed messages separately.',
    timeLimitSeconds: 300,
  },
  {
    id: 'msg-exactly-once',
    question: 'Why is exactly-once message delivery difficult to achieve?',
    category: 'messaging',
    answerType: 'multiple-choice',
    options: [
      'Network failures can cause duplicate deliveries or lost acknowledgments',
      'Messages are always too large',
      'Consumers are always slower than producers',
      'Queues have fixed capacity limits',
    ],
    correctAnswer: 'Network failures can cause duplicate deliveries or lost acknowledgments',
    explanation: 'In distributed systems, network failures mean a sender cannot know if a message was received. Retrying risks duplicates; not retrying risks loss. Most systems achieve at-least-once + idempotent consumers.',
    timeLimitSeconds: 300,
  },

  // ── Architecture ──
  {
    id: 'arch-monolith-vs-micro',
    question: 'When should you start with a monolith over microservices?',
    category: 'architecture',
    answerType: 'multiple-choice',
    options: [
      'When the domain is not well understood and the team is small',
      'When you need maximum scalability from day one',
      'When you have 50+ engineers',
      'When you need polyglot persistence',
    ],
    correctAnswer: 'When the domain is not well understood and the team is small',
    explanation: 'Microservices add operational complexity. A monolith lets a small team iterate quickly while learning the domain. Extract services later when boundaries are clear.',
    timeLimitSeconds: 300,
  },
  {
    id: 'arch-cqrs',
    question: 'What does CQRS stand for?',
    category: 'architecture',
    answerType: 'multiple-choice',
    options: [
      'Command Query Responsibility Segregation',
      'Concurrent Query Response System',
      'Cache Query Replication Service',
      'Centralized Queue Routing System',
    ],
    correctAnswer: 'Command Query Responsibility Segregation',
    explanation: 'CQRS separates read and write models. Commands mutate state; queries read state. This allows independent optimization of read and write paths.',
    timeLimitSeconds: 300,
  },
  {
    id: 'arch-circuit-breaker',
    question: 'What pattern prevents cascading failures between services?',
    category: 'architecture',
    answerType: 'multiple-choice',
    options: ['Circuit Breaker', 'Singleton', 'Observer', 'Factory'],
    correctAnswer: 'Circuit Breaker',
    explanation: 'The Circuit Breaker pattern monitors failures to a downstream service. After a threshold, it "opens" the circuit and returns errors immediately instead of waiting for timeouts.',
    timeLimitSeconds: 300,
  },

  // ── Security ──
  {
    id: 'sec-oauth-vs-jwt',
    question: 'What is the relationship between OAuth2 and JWT?',
    category: 'security',
    answerType: 'multiple-choice',
    options: [
      'OAuth2 is an authorization framework; JWT is a token format often used with it',
      'They are the same thing',
      'JWT replaced OAuth2',
      'OAuth2 is for authentication; JWT is for authorization',
    ],
    correctAnswer: 'OAuth2 is an authorization framework; JWT is a token format often used with it',
    explanation: 'OAuth2 defines authorization flows (auth code, client credentials, etc.). JWT is a self-contained token format. OAuth2 access tokens are often JWTs, but they are separate concepts.',
    timeLimitSeconds: 300,
  },
  {
    id: 'sec-rate-limiting',
    question: 'Name a common algorithm for rate limiting.',
    category: 'security',
    answerType: 'multiple-choice',
    options: [
      'Token bucket',
      'Binary search',
      'Dijkstra',
      'MapReduce',
    ],
    correctAnswer: 'Token bucket',
    explanation: 'Token bucket (and leaky bucket, sliding window, fixed window) are common rate-limiting algorithms. Token bucket allows bursts up to the bucket size while maintaining a steady average rate.',
    timeLimitSeconds: 300,
  },
  {
    id: 'sec-tls-termination',
    question: 'Where is TLS typically terminated in a web architecture?',
    category: 'security',
    answerType: 'multiple-choice',
    options: [
      'At the load balancer or reverse proxy',
      'At the database',
      'At the message queue',
      'At the client browser',
    ],
    correctAnswer: 'At the load balancer or reverse proxy',
    explanation: 'TLS termination at the load balancer/reverse proxy offloads encryption from backend servers and simplifies certificate management. Internal traffic may use plain HTTP or mTLS.',
    timeLimitSeconds: 300,
  },

  // ── Networking ──
  {
    id: 'net-dns-resolution',
    question: 'What is the typical order of DNS resolution?',
    category: 'networking',
    answerType: 'multiple-choice',
    options: [
      'Browser cache, OS cache, recursive resolver, root, TLD, authoritative',
      'Root server, then directly to the web server',
      'ISP, then CDN, then origin server',
      'DHCP, then ARP, then DNS',
    ],
    correctAnswer: 'Browser cache, OS cache, recursive resolver, root, TLD, authoritative',
    explanation: 'DNS resolution follows a hierarchical lookup: local caches first, then a recursive resolver queries root nameservers, TLD servers, and finally the authoritative nameserver.',
    timeLimitSeconds: 300,
  },
  {
    id: 'net-cdn-benefit',
    question: 'What is the primary benefit of a CDN?',
    category: 'networking',
    answerType: 'multiple-choice',
    options: [
      'Reduced latency by serving content from geographically closer edge servers',
      'Increased database throughput',
      'Better SQL query performance',
      'Automatic code deployment',
    ],
    correctAnswer: 'Reduced latency by serving content from geographically closer edge servers',
    explanation: 'CDNs cache content at edge locations worldwide, reducing the physical distance between users and content. This dramatically lowers latency for static assets.',
    timeLimitSeconds: 300,
  },
  {
    id: 'net-tcp-vs-udp',
    question: 'When would you choose UDP over TCP?',
    category: 'networking',
    answerType: 'multiple-choice',
    options: [
      'Real-time applications where speed matters more than reliability (video, gaming)',
      'Banking transactions',
      'File downloads',
      'Email delivery',
    ],
    correctAnswer: 'Real-time applications where speed matters more than reliability (video, gaming)',
    explanation: 'UDP has no connection setup, no retransmission, and lower overhead. This makes it ideal for real-time applications (video streaming, gaming, VoIP) where a dropped packet is better than a delayed one.',
    timeLimitSeconds: 300,
  },

  // ── Monitoring ──
  {
    id: 'mon-four-golden',
    question: 'What are the "Four Golden Signals" of monitoring?',
    category: 'monitoring',
    answerType: 'multiple-choice',
    options: [
      'Latency, Traffic, Errors, Saturation',
      'CPU, Memory, Disk, Network',
      'Uptime, Downtime, MTTR, MTBF',
      'Logs, Metrics, Traces, Alerts',
    ],
    correctAnswer: 'Latency, Traffic, Errors, Saturation',
    explanation: 'Google SRE defines four golden signals: Latency (request duration), Traffic (demand), Errors (failure rate), and Saturation (how full a resource is). These cover most monitoring needs.',
    timeLimitSeconds: 300,
  },
  {
    id: 'mon-observability-pillars',
    question: 'What are the three pillars of observability?',
    category: 'monitoring',
    answerType: 'multiple-choice',
    options: [
      'Logs, Metrics, Traces',
      'Alerts, Dashboards, Reports',
      'CPU, Memory, Disk',
      'Availability, Latency, Throughput',
    ],
    correctAnswer: 'Logs, Metrics, Traces',
    explanation: 'The three pillars of observability are: Logs (discrete events), Metrics (aggregated measurements over time), and Traces (request flow through distributed services).',
    timeLimitSeconds: 300,
  },
  {
    id: 'mon-slo-vs-sla',
    question: 'What is the difference between an SLO and an SLA?',
    category: 'monitoring',
    answerType: 'multiple-choice',
    options: [
      'SLO is an internal objective; SLA is a contractual agreement with consequences',
      'They are the same thing',
      'SLO is for databases; SLA is for APIs',
      'SLO measures uptime; SLA measures latency',
    ],
    correctAnswer: 'SLO is an internal objective; SLA is a contractual agreement with consequences',
    explanation: 'SLOs (Service Level Objectives) are internal targets (e.g., 99.9% uptime). SLAs (Service Level Agreements) are contracts with customers, often with financial penalties for violations.',
    timeLimitSeconds: 300,
  },

  // ── Scalability ──
  {
    id: 'scale-horizontal-vs-vertical',
    question: 'What is the difference between horizontal and vertical scaling?',
    category: 'scalability',
    answerType: 'multiple-choice',
    options: [
      'Horizontal adds more machines; vertical adds more power to one machine',
      'Horizontal is cheaper; vertical is always better',
      'Horizontal uses containers; vertical uses VMs',
      'Horizontal is for databases; vertical is for web servers',
    ],
    correctAnswer: 'Horizontal adds more machines; vertical adds more power to one machine',
    explanation: 'Vertical scaling (scale up) means upgrading CPU/RAM/disk on a single server. Horizontal scaling (scale out) means adding more servers. Horizontal scaling offers better fault tolerance but adds complexity.',
    timeLimitSeconds: 300,
  },
  {
    id: 'scale-consistent-hashing',
    question: 'What problem does consistent hashing solve?',
    category: 'scalability',
    answerType: 'multiple-choice',
    options: [
      'Minimizing key redistribution when nodes are added or removed',
      'Encrypting data at rest',
      'Compressing network traffic',
      'Sorting large datasets efficiently',
    ],
    correctAnswer: 'Minimizing key redistribution when nodes are added or removed',
    explanation: 'With naive hash(key) % N, adding/removing a node reshuffles nearly all keys. Consistent hashing maps nodes and keys to a ring so only K/N keys move when a node changes.',
    timeLimitSeconds: 300,
  },
  {
    id: 'scale-back-pressure',
    question: 'What is backpressure in a distributed system?',
    category: 'scalability',
    answerType: 'multiple-choice',
    options: [
      'A mechanism where a consumer signals the producer to slow down',
      'Compressing data before sending',
      'Encrypting messages in transit',
      'Routing traffic to the nearest data center',
    ],
    correctAnswer: 'A mechanism where a consumer signals the producer to slow down',
    explanation: 'Backpressure prevents a fast producer from overwhelming a slow consumer. Techniques include queue depth limits, flow control (TCP window), and reactive streams protocols.',
    timeLimitSeconds: 300,
  },

  // ── Reliability ──
  {
    id: 'rel-failover',
    question: 'What is active-passive failover?',
    category: 'reliability',
    answerType: 'multiple-choice',
    options: [
      'A standby replica takes over when the primary fails',
      'All replicas serve traffic simultaneously',
      'Traffic is split 50/50 between two servers',
      'A new server is created on every request',
    ],
    correctAnswer: 'A standby replica takes over when the primary fails',
    explanation: 'In active-passive (hot standby), the passive node replicates state from the active node. On failure, the passive promotes to active. Trade-off: the standby idles during normal operation.',
    timeLimitSeconds: 300,
  },
  {
    id: 'rel-idempotency',
    question: 'Why is idempotency important in distributed systems?',
    category: 'reliability',
    answerType: 'multiple-choice',
    options: [
      'It makes operations safe to retry without side effects',
      'It makes systems faster',
      'It reduces memory usage',
      'It enables data compression',
    ],
    correctAnswer: 'It makes operations safe to retry without side effects',
    explanation: 'Network failures cause retries. An idempotent operation produces the same result regardless of how many times it is applied. This is essential for at-least-once delivery guarantees.',
    timeLimitSeconds: 300,
  },
  {
    id: 'rel-bulkhead',
    question: 'What is the Bulkhead pattern?',
    category: 'reliability',
    answerType: 'multiple-choice',
    options: [
      'Isolating components so a failure in one does not cascade to others',
      'Compressing data to save bandwidth',
      'Encrypting all inter-service communication',
      'Balancing load across multiple data centers',
    ],
    correctAnswer: 'Isolating components so a failure in one does not cascade to others',
    explanation: 'Named after ship bulkheads, this pattern isolates resources (thread pools, connections, queues) per service or feature so one overloaded component cannot exhaust shared resources.',
    timeLimitSeconds: 300,
  },
  {
    id: 'rel-saga-pattern',
    question: 'What is the Saga pattern used for?',
    category: 'reliability',
    answerType: 'multiple-choice',
    options: [
      'Managing distributed transactions across multiple services with compensating actions',
      'Caching frequently accessed data',
      'Routing requests to the nearest server',
      'Compressing log files',
    ],
    correctAnswer: 'Managing distributed transactions across multiple services with compensating actions',
    explanation: 'A Saga breaks a distributed transaction into local transactions. If one step fails, compensating transactions undo previous steps. Orchestration or choreography coordinates the saga.',
    timeLimitSeconds: 300,
  },

  // ── Distributed ──
  {
    id: 'dist-raft-quorum',
    question: 'In a 5-node Raft cluster, what is the minimum number of votes to elect a leader?',
    category: 'distributed',
    answerType: 'multiple-choice',
    options: ['2', '3', '4', '5'],
    correctAnswer: '3',
    explanation: 'Raft requires a strict majority (quorum) to elect a leader. For a 5-node cluster, the quorum is ceil(5/2) + 0 = 3 nodes (majority of 5).',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-cap-p',
    question: 'What does the P in CAP stand for?',
    category: 'distributed',
    answerType: 'multiple-choice',
    options: ['Persistence', 'Partition tolerance', 'Performance', 'Parallelism'],
    correctAnswer: 'Partition tolerance',
    explanation: 'CAP stands for Consistency, Availability, and Partition tolerance. Partition tolerance means the system continues to operate despite network partitions between nodes.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-ap-reads',
    question: 'True or False: In AP mode, reads during a partition always return the latest write.',
    category: 'distributed',
    answerType: 'multiple-choice',
    options: ['True', 'False'],
    correctAnswer: 'False',
    explanation: 'In AP (Available + Partition-tolerant) mode, the system sacrifices consistency. During a partition, nodes may serve stale data to remain available, so reads may not reflect the latest write.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-crdt-lww',
    question: 'Which CRDT type resolves conflicts using timestamps?',
    category: 'distributed',
    answerType: 'multiple-choice',
    options: ['G-Counter', 'PN-Counter', 'LWW-Register', 'OR-Set'],
    correctAnswer: 'LWW-Register',
    explanation: 'LWW-Register (Last-Writer-Wins Register) uses timestamps to resolve concurrent writes. The write with the highest timestamp wins, providing eventual consistency at the cost of potentially losing updates.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-consistent-hash-fraction',
    question: 'In consistent hashing, adding a node moves approximately what fraction of keys?',
    category: 'distributed',
    answerType: 'short-answer',
    correctAnswer: '1/N',
    acceptedAlternatives: ['1/n', 'one-nth'],
    explanation: 'With consistent hashing, adding a node to an N-node ring only redistributes approximately 1/N of the keys (those that now map to the new node), compared to nearly all keys with naive hash % N.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-2pc-problem',
    question: 'What is the main problem with Two-Phase Commit?',
    category: 'distributed',
    answerType: 'short-answer',
    correctAnswer: 'Blocking',
    acceptedAlternatives: ['blocking', 'it blocks', 'coordinator failure blocks'],
    explanation: 'Two-Phase Commit is a blocking protocol. If the coordinator crashes after sending PREPARE but before sending COMMIT/ABORT, all participants are stuck holding locks, unable to proceed until the coordinator recovers.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-saga-compensation-order',
    question: 'In the Saga pattern, compensating transactions run in what order?',
    category: 'distributed',
    answerType: 'short-answer',
    correctAnswer: 'Reverse',
    acceptedAlternatives: ['reverse', 'reverse order', 'backwards'],
    explanation: 'When a saga step fails, compensating transactions execute in reverse order to undo the effects of previously completed steps, similar to unwinding a stack.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-gossip-rounds',
    question: 'How many gossip rounds to reach ~100 nodes with fanout 2?',
    category: 'distributed',
    answerType: 'short-answer',
    correctAnswer: '~7',
    acceptedAlternatives: ['7', '6-7', 'log(100)'],
    explanation: 'Gossip protocols spread information exponentially. With fanout 2, each round doubles the informed nodes: 2^7 = 128 >= 100. So approximately 7 rounds (O(log N)) suffice to reach all nodes.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-vector-clock-advantage',
    question: 'What does a vector clock detect that Lamport timestamps cannot?',
    category: 'distributed',
    answerType: 'short-answer',
    correctAnswer: 'Concurrency',
    acceptedAlternatives: ['concurrency', 'concurrent events'],
    explanation: 'Lamport timestamps provide a total order but cannot distinguish between causally related and concurrent events. Vector clocks can detect true concurrency: if neither clock dominates the other, the events are concurrent.',
    timeLimitSeconds: 300,
  },
  {
    id: 'dist-paxos-prepare',
    question: 'In Paxos, what phase establishes proposal priority?',
    category: 'distributed',
    answerType: 'multiple-choice',
    options: ['Prepare', 'Promise', 'Accept', 'Learn'],
    correctAnswer: 'Prepare',
    explanation: 'In the Prepare phase, a proposer sends a proposal number to acceptors. Acceptors promise not to accept proposals with lower numbers, effectively establishing priority for higher-numbered proposals.',
    timeLimitSeconds: 300,
  },
];

// ── Lookup helpers ──────────────────────────────────────────

const challengeMap = new Map(MICRO_CHALLENGES.map((c) => [c.id, c]));

/** Get a micro-challenge by ID. */
export function getMicroChallengeById(id: string): MicroChallenge | undefined {
  return challengeMap.get(id);
}

// ── Daily challenge selection ───────────────────────────────

/**
 * Deterministic daily challenge: hash today's date string to
 * pick an index into the challenge array. Same date always
 * returns the same challenge.
 */
export function getDailyMicroChallenge(): MicroChallenge {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % MICRO_CHALLENGES.length;
  return MICRO_CHALLENGES[idx];
}

// ── Submission ──────────────────────────────────────────────

/**
 * Submit an answer to a micro-challenge.
 *
 * For multiple-choice: exact match against correctAnswer.
 * For short-answer: case-insensitive substring match against
 *   correctAnswer or any acceptedAlternatives.
 */
export function submitMicroChallenge(
  challengeId: string,
  answer: string,
): MicroChallengeResult {
  const challenge = challengeMap.get(challengeId);
  if (!challenge) {
    return {
      challengeId,
      correct: false,
      explanation: 'Challenge not found.',
      correctAnswer: '',
      userAnswer: answer,
    };
  }

  let correct = false;
  if (challenge.answerType === 'multiple-choice') {
    correct = answer === challenge.correctAnswer;
  } else {
    // Short-answer: case-insensitive substring match
    const normalised = answer.toLowerCase().trim();
    const targets = [challenge.correctAnswer, ...(challenge.acceptedAlternatives ?? [])];
    correct = targets.some((t) => normalised.includes(t.toLowerCase()));
  }

  return {
    challengeId,
    correct,
    explanation: challenge.explanation,
    correctAnswer: challenge.correctAnswer,
    userAnswer: answer,
  };
}
