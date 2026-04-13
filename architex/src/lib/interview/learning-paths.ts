// ── INT-025: Structured Learning Paths for Interview Engine ─────────

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  duration: string; // "4-8 weeks"
  weeks: LearningWeek[];
}

export interface LearningWeek {
  week: number;
  title: string;
  topics: string[];
  challengeIds: string[]; // references to CHALLENGES
  concepts: string[]; // for SRS
}

// ── 1. System Design Interview Prep (8 weeks) ──────────────────────

const SYSTEM_DESIGN_PREP: LearningPath = {
  id: 'path-system-design',
  name: 'System Design Interview Prep',
  description:
    'A comprehensive 8-week program covering everything you need to ace system design interviews, from back-of-the-envelope estimation to designing Uber-scale distributed systems.',
  duration: '8 weeks',
  weeks: [
    {
      week: 1,
      title: 'Estimation & Latency Numbers',
      topics: [
        'Back-of-the-envelope estimation',
        'Latency numbers every engineer should know',
        'Throughput and bandwidth calculations',
        'Storage estimation techniques',
      ],
      challengeIds: ['design-hit-counter', 'design-pastebin-simple'],
      concepts: [
        'Latency Numbers',
        'Throughput Estimation',
        'Storage Calculation',
        'QPS Estimation',
        'Bandwidth Planning',
      ],
    },
    {
      week: 2,
      title: 'Scaling Basics & Fundamentals',
      topics: [
        'Horizontal vs vertical scaling',
        'Stateless vs stateful services',
        'Replication strategies',
        'Database indexing fundamentals',
      ],
      challengeIds: ['design-logging-service', 'design-url-shortener'],
      concepts: [
        'Horizontal Scaling',
        'Vertical Scaling',
        'Replication',
        'Database Indexing',
        'Stateless Architecture',
      ],
    },
    {
      week: 3,
      title: 'Core Components: Load Balancing & Caching',
      topics: [
        'Load balancing algorithms (round robin, least connections, consistent hashing)',
        'Caching strategies (write-through, write-behind, cache-aside)',
        'Cache eviction policies (LRU, LFU, TTL)',
        'CDN fundamentals',
      ],
      challengeIds: ['design-cache', 'design-rate-limiter'],
      concepts: [
        'Load Balancing',
        'Caching',
        'LRU Eviction',
        'Cache Invalidation',
        'CDN',
        'Consistent Hashing',
      ],
    },
    {
      week: 4,
      title: 'Core Components: Queues & Database Selection',
      topics: [
        'Message queues and event-driven architecture',
        'SQL vs NoSQL selection criteria',
        'Database sharding and partitioning',
        'Task scheduling and background processing',
      ],
      challengeIds: [
        'design-notification-system',
        'design-task-scheduler',
        'design-key-value-store',
        'design-webhook-delivery-system',
      ],
      concepts: [
        'Message Queue',
        'Pub-Sub',
        'SQL vs NoSQL',
        'Sharding',
        'Partitioning',
        'Consistent Hashing',
        'Event-Driven Architecture',
      ],
    },
    {
      week: 5,
      title: 'Classic Designs: URL Shortener & Paste Service',
      topics: [
        'URL shortening with base62 encoding',
        'Content-addressable storage',
        'Analytics pipeline design',
        'Full-text search integration',
      ],
      challengeIds: [
        'design-paste-service',
        'design-link-shortener-analytics',
        'design-bookmark-manager',
        'design-image-upload-service',
      ],
      concepts: [
        'Base62 Encoding',
        'ID Generation',
        'Object Storage',
        'Full-Text Search',
        'Presigned URLs',
        'Stream Processing',
      ],
    },
    {
      week: 6,
      title: 'Classic Designs: Twitter, Instagram & Chat',
      topics: [
        'Fan-out on write vs fan-out on read',
        'News feed generation and ranking',
        'Real-time messaging with WebSockets',
        'Media upload and CDN delivery pipelines',
      ],
      challengeIds: [
        'design-twitter',
        'design-instagram',
        'design-chat-system',
        'design-polling-voting-system',
      ],
      concepts: [
        'Fan-out',
        'Timeline Generation',
        'WebSocket',
        'News Feed',
        'Image Processing',
        'Presence Service',
      ],
    },
    {
      week: 7,
      title: 'Advanced: Uber, Netflix & Search',
      topics: [
        'Geospatial indexing (geohash, quadtree)',
        'Real-time location tracking at scale',
        'Video streaming and adaptive bitrate',
        'Inverted index and search ranking (PageRank, TF-IDF)',
      ],
      challengeIds: [
        'design-uber',
        'design-netflix',
        'design-search-engine',
        'design-youtube',
      ],
      concepts: [
        'Geospatial Index',
        'Geohash',
        'Adaptive Bitrate',
        'Inverted Index',
        'PageRank',
        'CDN',
        'Recommendation Engine',
      ],
    },
    {
      week: 8,
      title: 'Advanced: Distributed Systems Deep Dive',
      topics: [
        'Distributed databases and consensus (Raft, Paxos)',
        'Distributed message queues (Kafka internals)',
        'Payment systems and exactly-once semantics',
        'Stock exchange matching engines',
      ],
      challengeIds: [
        'design-distributed-database',
        'design-distributed-message-queue',
        'design-payment-system',
        'design-stock-exchange',
      ],
      concepts: [
        'Raft Consensus',
        'Two-Phase Commit',
        'Exactly-Once Semantics',
        'Idempotency',
        'Event Sourcing',
        'Log-Structured Storage',
      ],
    },
  ],
};

// ── 2. DSA Mastery (6 weeks) ────────────────────────────────────────

const DSA_MASTERY: LearningPath = {
  id: 'path-dsa-mastery',
  name: 'DSA Mastery',
  description:
    'A focused 6-week program covering the essential data structures and algorithms for coding interviews, with system design challenges that exercise each topic.',
  duration: '6 weeks',
  weeks: [
    {
      week: 1,
      title: 'Arrays, Hashing & Sorting',
      topics: [
        'Hash maps and hash sets',
        'Sorting algorithms and their tradeoffs',
        'Sliding window and two-pointer techniques',
        'Circular buffer and ring buffer patterns',
      ],
      challengeIds: [
        'design-hit-counter',
        'design-cache',
        'design-rate-limiter',
      ],
      concepts: [
        'Hash Map',
        'Sliding Window',
        'Circular Buffer',
        'Time Bucketing',
        'Atomic Operations',
        'LRU Eviction',
      ],
    },
    {
      week: 2,
      title: 'Graphs & BFS/DFS',
      topics: [
        'Graph representations (adjacency list, adjacency matrix)',
        'Breadth-first and depth-first search',
        'Shortest path algorithms (Dijkstra, A*)',
        'Social graph traversal and network analysis',
      ],
      challengeIds: [
        'design-web-crawler',
        'design-social-network-graph',
        'design-maps',
      ],
      concepts: [
        'BFS',
        'Graph Database',
        'Adjacency List',
        'A* Search',
        'Bloom Filter',
        'Graph Partitioning',
      ],
    },
    {
      week: 3,
      title: 'Trees & Binary Search Trees',
      topics: [
        'Binary search trees and balanced trees',
        'Tries and prefix trees',
        'B-trees and LSM trees for storage',
        'Quadtrees and spatial indexing',
      ],
      challengeIds: [
        'design-search-engine',
        'design-ecommerce-catalog',
        'design-google-maps-backend',
      ],
      concepts: [
        'Inverted Index',
        'TF-IDF',
        'Faceted Search',
        'Quadtree',
        'Contraction Hierarchies',
        'LSM Tree',
      ],
    },
    {
      week: 4,
      title: 'Dynamic Programming & Optimization',
      topics: [
        'Memoization and tabulation patterns',
        'Optimization problems in system design',
        'Scheduling and resource allocation',
        'Matching algorithms and constraint satisfaction',
      ],
      challengeIds: [
        'design-uber',
        'design-hotel-reservation',
        'design-task-scheduler',
        'design-ad-serving-platform',
      ],
      concepts: [
        'Matching Algorithm',
        'Surge Pricing',
        'Pessimistic Locking',
        'Optimistic Concurrency',
        'Budget Pacing',
        'Bin Packing',
      ],
    },
    {
      week: 5,
      title: 'String Algorithms & Text Processing',
      topics: [
        'String hashing and fingerprinting',
        'Full-text search and inverted indices',
        'Autocomplete with tries',
        'Similarity detection (SimHash, MinHash)',
      ],
      challengeIds: [
        'design-paste-service',
        'design-bookmark-manager',
        'design-url-shortener',
      ],
      concepts: [
        'Content Addressing',
        'Full-Text Search',
        'Base62 Encoding',
        'SimHash',
        'CDC',
        'Key Generation',
      ],
    },
    {
      week: 6,
      title: 'Advanced: Probabilistic & Specialized Structures',
      topics: [
        'Bloom filters and count-min sketch',
        'HyperLogLog for cardinality estimation',
        'Consistent hashing with virtual nodes',
        'Skip lists, sorted sets, and order books',
      ],
      challengeIds: [
        'design-realtime-leaderboard',
        'design-realtime-analytics-platform',
        'design-stock-exchange',
        'design-link-shortener-analytics',
      ],
      concepts: [
        'Sorted Set',
        'HyperLogLog',
        'Bloom Filter',
        'Count-Min Sketch',
        'Columnar Storage',
        'Price-Time Priority',
        'Skip List',
      ],
    },
  ],
};

// ── 3. Backend Engineering (4 weeks) ────────────────────────────────

const BACKEND_ENGINEERING: LearningPath = {
  id: 'path-backend-engineering',
  name: 'Backend Engineering',
  description:
    'A 4-week intensive covering the core backend engineering topics: networking, OS concepts, database internals, and distributed systems fundamentals.',
  duration: '4 weeks',
  weeks: [
    {
      week: 1,
      title: 'Networking & Protocols',
      topics: [
        'HTTP/1.1, HTTP/2, and HTTP/3 (QUIC)',
        'WebSocket, SSE, and long polling for real-time',
        'TCP/UDP tradeoffs and connection management',
        'DNS, CDN, and request routing',
        'API design: REST, GraphQL, and gRPC',
      ],
      challengeIds: [
        'design-chat-system',
        'design-live-sports-scores',
        'design-video-conferencing',
        'design-webhook-delivery-system',
      ],
      concepts: [
        'WebSocket',
        'Server-Sent Events',
        'Fan-out',
        'WebRTC',
        'SFU',
        'HMAC',
        'At-Least-Once Delivery',
      ],
    },
    {
      week: 2,
      title: 'OS Concepts & Concurrency',
      topics: [
        'Process vs thread vs coroutine',
        'Concurrency primitives (mutex, semaphore, CAS)',
        'Connection pooling and resource management',
        'Container isolation (namespaces, cgroups)',
        'Memory management and garbage collection',
      ],
      challengeIds: [
        'design-rate-limiter',
        'design-container-orchestrator',
        'design-collaborative-code-editor',
        'design-food-ordering',
      ],
      concepts: [
        'Token Bucket',
        'Desired-State Reconciliation',
        'Bin Packing',
        'Service Discovery',
        'CRDT',
        'Firecracker',
        'State Machine',
      ],
    },
    {
      week: 3,
      title: 'Database Design & Transactions',
      topics: [
        'ACID properties and isolation levels',
        'Indexing strategies (B-tree, hash, GIN, GiST)',
        'Replication: synchronous, asynchronous, semi-sync',
        'Transactions: 2PC, saga pattern',
        'Schema design and data modeling patterns',
      ],
      challengeIds: [
        'design-key-value-store',
        'design-hotel-reservation',
        'design-payment-system',
        'design-distributed-database',
      ],
      concepts: [
        'Quorum',
        'Vector Clocks',
        'Gossip Protocol',
        'Pessimistic Locking',
        'Idempotency',
        'Double-Entry Bookkeeping',
        'Raft Consensus',
        'Two-Phase Commit',
      ],
    },
    {
      week: 4,
      title: 'Distributed Systems & Security',
      topics: [
        'CAP theorem and consistency models',
        'Consensus protocols (Raft, Paxos)',
        'Distributed caching and CDN architecture',
        'Authentication, authorization, and encryption',
        'Multi-tenant isolation and security boundaries',
      ],
      challengeIds: [
        'design-global-cdn',
        'design-multi-tenant-saas',
        'design-fraud-detection',
        'design-distributed-database-cockroach',
        'design-cloud-storage',
      ],
      concepts: [
        'Edge Caching',
        'Anycast',
        'Cache Invalidation',
        'Multi-tenancy',
        'Row-Level Security',
        'Feature Store',
        'Anomaly Detection',
        'Content-Addressable Storage',
        'Hybrid Logical Clocks',
      ],
    },
  ],
};

// ── Exported collection ─────────────────────────────────────────────

export const LEARNING_PATHS: LearningPath[] = [
  SYSTEM_DESIGN_PREP,
  DSA_MASTERY,
  BACKEND_ENGINEERING,
];

/**
 * Look up a learning path by ID.
 */
export function getLearningPathById(id: string): LearningPath | undefined {
  return LEARNING_PATHS.find((p) => p.id === id);
}
