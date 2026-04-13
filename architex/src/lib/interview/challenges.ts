// ── Challenge database: 20+ system design interview problems ───────

import { LLD_CHALLENGES } from './lld-challenges';

export interface ChallengeDefinition {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  timeMinutes: number;
  category: 'classic' | 'modern' | 'infrastructure' | 'advanced' | 'lld';
  companies: string[];
  description: string;
  requirements: string[];
  checklist: string[];
  hints: Array<{ level: 1 | 2 | 3 | 4; text: string; pointsCost: number }>;
  concepts: string[];
  templateId?: string;
}

// ALL_COMPANIES is populated at the bottom of the file after CHALLENGES is defined.
// We use a mutable array wrapper so the export itself is const.
const _companies: string[] = [];
export { _companies as ALL_COMPANIES };

/** All category values. */
export const ALL_CATEGORIES: ChallengeDefinition['category'][] = ['classic', 'modern', 'infrastructure', 'advanced', 'lld'];

export type SortOption = 'difficulty-asc' | 'difficulty-desc' | 'popular' | 'newest';
export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'difficulty-asc', label: 'Difficulty (Low\u2192High)' },
  { value: 'difficulty-desc', label: 'Difficulty (High\u2192Low)' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
];

export const CHALLENGES: ChallengeDefinition[] = [
  // ────────────────────────────────────────────────────────────
  // Level 1 -- Foundational (15 min)
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-cache',
    title: 'Design a Cache',
    difficulty: 1,
    timeMinutes: 15,
    category: 'infrastructure',
    companies: ['Amazon', 'Google', 'Meta'],
    description: 'Design an in-memory caching system similar to Memcached or Redis. Focus on eviction policies, cache invalidation strategies, and data structure choices.',
    requirements: [
      'Support get/set/delete operations with O(1) average time complexity.',
      'Implement at least one eviction policy (LRU, LFU, or TTL-based).',
      'Handle cache invalidation and consistency with the source of truth.',
    ],
    checklist: [
      'Defined core data structures (hash map + doubly linked list for LRU).',
      'Explained eviction policy and when entries are removed.',
      'Addressed cache invalidation strategy (write-through, write-behind, or TTL).',
      'Discussed memory limits and monitoring.',
    ],
    hints: [
      { level: 1, text: 'Think about what data structure gives O(1) lookup AND maintains insertion/access order.', pointsCost: 5 },
      { level: 2, text: 'A hash map gives O(1) lookup. A doubly linked list lets you move recently accessed items to the front in O(1). Combine them.', pointsCost: 10 },
      { level: 3, text: 'For distributed caching, consider consistent hashing to distribute keys across nodes, and a gossip protocol for cluster membership.', pointsCost: 15 },
    ],
    concepts: ['Caching', 'LRU Eviction', 'Hash Map', 'Cache Invalidation'],
    templateId: 'cache-system',
  },
  {
    id: 'design-rate-limiter',
    title: 'Design a Rate Limiter',
    difficulty: 1,
    timeMinutes: 15,
    category: 'infrastructure',
    companies: ['Stripe', 'Google', 'Cloudflare'],
    description: 'Design a rate limiting service that controls the rate of requests a client can send to an API. Consider different algorithms and distributed scenarios.',
    requirements: [
      'Support configurable rate limits per client/API key.',
      'Implement at least one rate limiting algorithm (token bucket, sliding window, etc.).',
      'Return appropriate HTTP headers (X-RateLimit-Remaining, Retry-After).',
    ],
    checklist: [
      'Chose and explained a rate limiting algorithm with tradeoffs.',
      'Defined where the rate limiter sits in the architecture (API gateway, middleware).',
      'Handled distributed rate limiting across multiple servers.',
      'Discussed edge cases: burst traffic, clock synchronization, race conditions.',
    ],
    hints: [
      { level: 1, text: 'Compare token bucket (allows bursts) vs sliding window log (strict) vs fixed window counter (simple but allows boundary bursts).', pointsCost: 5 },
      { level: 2, text: 'For distributed rate limiting, use Redis with atomic INCR + EXPIRE. A Lua script can make the check-and-increment atomic.', pointsCost: 10 },
      { level: 3, text: 'Consider a sliding window counter: combine fixed window counters with a weighted average to approximate a true sliding window without storing each request timestamp.', pointsCost: 15 },
    ],
    concepts: ['Rate Limiting', 'Token Bucket', 'Sliding Window', 'API Gateway'],
  },
  {
    id: 'design-url-shortener',
    title: 'Design a URL Shortener',
    difficulty: 1,
    timeMinutes: 15,
    category: 'classic',
    companies: ['Google', 'Meta', 'Amazon'],
    description: 'Design a URL shortening service like TinyURL or bit.ly. Users can create short URLs that redirect to the original long URL.',
    requirements: [
      'Generate unique short URLs from long URLs with minimal collisions.',
      'Redirect short URLs to original URLs with low latency.',
      'Support custom short URLs and optional expiration.',
    ],
    checklist: [
      'Designed a unique ID generation strategy (base62 encoding, hash, or counter).',
      'Planned the storage schema and read-heavy optimization (caching).',
      'Addressed collision handling and uniqueness guarantees.',
      'Calculated storage and throughput estimates.',
    ],
    hints: [
      { level: 1, text: 'A 7-character base62 string gives 62^7 = 3.5 trillion unique URLs. Think about how to generate these IDs.', pointsCost: 5 },
      { level: 2, text: 'Use a distributed ID generator (Snowflake) and convert to base62. Or use MD5/SHA256 hash and take the first 7 chars, with collision detection.', pointsCost: 10 },
      { level: 3, text: 'Reads vastly outnumber writes. Put a multi-layer cache (browser cache with 302 vs 301, CDN, application cache) in front of the database.', pointsCost: 15 },
    ],
    concepts: ['Hashing', 'Base62 Encoding', 'Caching', 'Database Indexing', 'ID Generation'],
    templateId: 'url-shortener',
  },

  // ────────────────────────────────────────────────────────────
  // Level 2 -- Intermediate (25 min)
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-paste-service',
    title: 'Design a Paste Service',
    difficulty: 2,
    timeMinutes: 25,
    category: 'classic',
    companies: ['Meta', 'Google'],
    description: 'Design a Pastebin-like service where users can store and share plain text or code snippets with syntax highlighting and expiration.',
    requirements: [
      'Store text content with unique shareable URLs.',
      'Support syntax highlighting for common languages.',
      'Implement paste expiration (TTL) and size limits.',
      'Provide read/write API with rate limiting.',
    ],
    checklist: [
      'Separated metadata storage (SQL) from content storage (object store/blob).',
      'Designed content-addressable storage or unique key generation.',
      'Addressed cleanup of expired pastes (background job or lazy deletion).',
      'Calculated storage requirements for different usage tiers.',
    ],
    hints: [
      { level: 1, text: 'Text content can be large. Think about separating metadata (small, queryable) from content (large, blob-like).', pointsCost: 5 },
      { level: 2, text: 'Use S3 or a blob store for content, a relational DB for metadata. Content-addressable storage (hash of content as key) deduplicates identical pastes.', pointsCost: 10 },
      { level: 3, text: 'For expiration, use a scheduled cleanup job with a database index on expiry_time. Lazy deletion on read provides immediate consistency.', pointsCost: 15 },
    ],
    concepts: ['Object Storage', 'Content Addressing', 'TTL', 'Background Jobs', 'Blob Storage'],
  },
  {
    id: 'design-key-value-store',
    title: 'Design a Key-Value Store',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Amazon', 'Google', 'Apple'],
    description: 'Design a distributed key-value store like DynamoDB or etcd. Focus on consistency, partitioning, and replication strategies.',
    requirements: [
      'Support get/put/delete with configurable consistency levels.',
      'Partition data across multiple nodes using consistent hashing.',
      'Replicate data for fault tolerance with tunable replication factor.',
      'Handle node failures gracefully with read repair or anti-entropy.',
    ],
    checklist: [
      'Designed partitioning scheme with consistent hashing and virtual nodes.',
      'Explained replication strategy and quorum-based reads/writes.',
      'Addressed conflict resolution (vector clocks, last-write-wins, or CRDTs).',
      'Discussed failure detection (gossip protocol) and data recovery.',
    ],
    hints: [
      { level: 1, text: 'Consistent hashing distributes keys across a ring of nodes. Virtual nodes improve balance.', pointsCost: 5 },
      { level: 2, text: 'Use quorum reads/writes: with N replicas, require W writes and R reads where W + R > N for strong consistency. Tune W and R for your use case.', pointsCost: 10 },
      { level: 3, text: 'For conflict resolution, vector clocks track causality. If two versions are concurrent, use application-level merge or last-write-wins. Anti-entropy with Merkle trees detects inconsistencies.', pointsCost: 15 },
    ],
    concepts: ['Consistent Hashing', 'Quorum', 'Vector Clocks', 'Gossip Protocol', 'Replication'],
    templateId: 'kv-store',
  },
  {
    id: 'design-notification-system',
    title: 'Design a Notification System',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Meta', 'Apple', 'Amazon'],
    description: 'Design a notification system that supports push notifications, SMS, email, and in-app notifications with user preferences and delivery guarantees.',
    requirements: [
      'Support multiple channels: push, SMS, email, and in-app.',
      'Respect user notification preferences and quiet hours.',
      'Provide at-least-once delivery with deduplication.',
      'Support templating and batch/bulk notifications.',
    ],
    checklist: [
      'Designed a publisher-subscriber architecture with channel-specific workers.',
      'Addressed priority queuing and rate limiting per channel.',
      'Handled delivery tracking and retry logic with exponential backoff.',
      'Discussed template rendering and personalization pipeline.',
    ],
    hints: [
      { level: 1, text: 'Use a message queue per notification channel. A dispatcher routes notifications based on user preferences.', pointsCost: 5 },
      { level: 2, text: 'Priority queues ensure urgent notifications (security alerts) are processed before marketing emails. Rate limit per channel to avoid provider throttling.', pointsCost: 10 },
      { level: 3, text: 'Implement idempotency keys to prevent duplicate sends. Use a delivery status table to track sent/delivered/failed per notification per channel.', pointsCost: 15 },
    ],
    concepts: ['Message Queue', 'Pub-Sub', 'Rate Limiting', 'Idempotency', 'Priority Queue'],
  },
  {
    id: 'design-task-scheduler',
    title: 'Design a Task Scheduler',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Google', 'Uber', 'LinkedIn'],
    description: 'Design a distributed task scheduler like cron that can execute millions of scheduled jobs reliably across a cluster of workers.',
    requirements: [
      'Support one-time and recurring (cron) schedules.',
      'Guarantee at-least-once execution even during worker failures.',
      'Scale horizontally to handle millions of scheduled tasks.',
    ],
    checklist: [
      'Designed job storage with efficient next-execution-time queries.',
      'Addressed worker coordination to prevent duplicate execution.',
      'Handled missed schedules and catch-up logic.',
      'Discussed monitoring, alerting, and dead-letter handling.',
    ],
    hints: [
      { level: 1, text: 'Think about how to efficiently find the next N jobs to execute. A database index on next_run_time helps.', pointsCost: 5 },
      { level: 2, text: 'Use distributed locking (Redis SETNX or database advisory locks) to ensure only one worker picks up each job. Mark jobs as "claimed" with a lease timeout.', pointsCost: 10 },
      { level: 3, text: 'Partition the timeline into buckets (e.g., per-minute). Each bucket is assigned to a worker via consistent hashing. Workers pre-fetch their upcoming bucket.', pointsCost: 15 },
    ],
    concepts: ['Distributed Locking', 'Consistent Hashing', 'Leader Election', 'Cron Scheduling'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 3 -- Advanced (35 min)
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-twitter',
    title: 'Design Twitter',
    difficulty: 3,
    timeMinutes: 35,
    category: 'classic',
    companies: ['Twitter/X', 'Meta'],
    description: 'Design a social media platform like Twitter. Users can post tweets, follow others, and see a personalized home timeline.',
    requirements: [
      'Users can post tweets (280 chars), follow/unfollow other users.',
      'Home timeline shows tweets from followed users in reverse chronological order.',
      'Support hashtag search and trending topics.',
      'Handle celebrity users with millions of followers (fan-out problem).',
      'Display like counts and retweet counts in near-real-time.',
    ],
    checklist: [
      'Addressed the fan-out problem: push (pre-compute timelines) vs pull (query on read) vs hybrid.',
      'Designed tweet storage and timeline cache architecture.',
      'Handled celebrity fan-out differently from regular users.',
      'Discussed search indexing for hashtags and full-text search.',
    ],
    hints: [
      { level: 1, text: 'The core challenge is timeline generation. Pre-computing timelines (fan-out on write) is fast to read but expensive for celebrities with millions of followers.', pointsCost: 5 },
      { level: 2, text: 'Hybrid approach: fan-out on write for normal users (< 10K followers), fan-out on read (merge at query time) for celebrities. Cache the pre-computed timelines in Redis.', pointsCost: 10 },
      { level: 3, text: 'Use a graph database or adjacency list for the follower graph. For trending topics, use a Count-Min Sketch with time-decayed windows.', pointsCost: 15 },
    ],
    concepts: ['Fan-out', 'Timeline Generation', 'Caching', 'Graph Database', 'Count-Min Sketch'],
    templateId: 'social-media',
  },
  {
    id: 'design-instagram',
    title: 'Design Instagram',
    difficulty: 3,
    timeMinutes: 35,
    category: 'classic',
    companies: ['Meta', 'Google', 'ByteDance'],
    description: 'Design a photo-sharing social network like Instagram. Focus on photo upload/storage, news feed generation, and social graph.',
    requirements: [
      'Users can upload photos with captions and filters.',
      'Generate a personalized news feed from followed users.',
      'Support likes, comments, and direct messaging.',
      'Handle photo storage and CDN delivery for global users.',
      'Implement explore/discover feature based on user interests.',
    ],
    checklist: [
      'Designed photo upload pipeline: resize, compress, store originals + thumbnails.',
      'Planned CDN strategy for global photo delivery.',
      'Addressed news feed ranking (chronological vs algorithmic).',
      'Discussed storage costs and lifecycle management (hot/warm/cold tiers).',
    ],
    hints: [
      { level: 1, text: 'Separate the photo upload path from the metadata path. Photos go to object storage (S3); metadata goes to a database.', pointsCost: 5 },
      { level: 2, text: 'Generate multiple resolutions on upload (thumbnail, medium, full) asynchronously. Serve through a CDN with cache headers.', pointsCost: 10 },
      { level: 3, text: 'For the explore feature, use collaborative filtering: users who liked similar photos to you also liked these other photos. Pre-compute in batch with Spark/Flink.', pointsCost: 15 },
    ],
    concepts: ['Object Storage', 'CDN', 'Image Processing', 'News Feed', 'Recommendation Engine'],
  },
  {
    id: 'design-chat-system',
    title: 'Design a Chat System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Meta', 'WhatsApp', 'Slack'],
    description: 'Design a real-time messaging system like WhatsApp or Slack supporting 1:1 chats, group chats, and presence indicators.',
    requirements: [
      'Support 1:1 and group messaging with real-time delivery.',
      'Show online/offline presence and typing indicators.',
      'Persist message history with read receipts.',
      'Handle offline users and deliver messages when they reconnect.',
      'Support media attachments (images, files).',
    ],
    checklist: [
      'Chose a real-time protocol (WebSocket, SSE, or long polling) with justification.',
      'Designed message delivery guarantees and ordering.',
      'Addressed group chat fan-out and membership management.',
      'Discussed end-to-end encryption considerations.',
    ],
    hints: [
      { level: 1, text: 'WebSocket connections enable real-time bidirectional communication. Each user maintains a persistent connection to a chat server.', pointsCost: 5 },
      { level: 2, text: 'Use a connection registry (Redis) to map user IDs to their connected chat server. When sending a message, look up the recipient server and forward.', pointsCost: 10 },
      { level: 3, text: 'For message ordering, use a per-conversation sequence number. For offline delivery, store undelivered messages and push them when the user reconnects (like a message queue per user).', pointsCost: 15 },
    ],
    concepts: ['WebSocket', 'Message Ordering', 'Presence Service', 'Fan-out', 'End-to-End Encryption'],
    templateId: 'chat-system',
  },
  {
    id: 'design-youtube',
    title: 'Design YouTube',
    difficulty: 3,
    timeMinutes: 35,
    category: 'classic',
    companies: ['Google', 'Netflix', 'ByteDance'],
    description: 'Design a video sharing and streaming platform like YouTube. Focus on video upload, transcoding, storage, and adaptive streaming.',
    requirements: [
      'Users can upload videos which are transcoded into multiple resolutions.',
      'Support adaptive bitrate streaming (HLS/DASH).',
      'Implement video search and recommendation engine.',
      'Handle massive storage requirements with lifecycle policies.',
      'Display view counts, likes, and comments.',
    ],
    checklist: [
      'Designed the video upload and transcoding pipeline (DAG of tasks).',
      'Addressed storage tiers: hot (popular) vs cold (old/unpopular) videos.',
      'Planned CDN strategy for video segments with edge caching.',
      'Discussed recommendation system architecture.',
    ],
    hints: [
      { level: 1, text: 'Video upload and transcoding are separate. Upload to temporary storage, then trigger an async transcoding pipeline that produces multiple resolutions.', pointsCost: 5 },
      { level: 2, text: 'Use a DAG-based workflow engine for transcoding: split video into chunks, transcode in parallel, generate thumbnails, update metadata, and publish. Each step can retry independently.', pointsCost: 10 },
      { level: 3, text: 'For adaptive streaming, segment videos into 2-10 second chunks at multiple bitrates. The client player switches quality based on bandwidth. CDN caches popular segments at the edge.', pointsCost: 15 },
    ],
    concepts: ['Video Transcoding', 'Adaptive Streaming', 'CDN', 'DAG Workflow', 'Object Storage'],
  },
  {
    id: 'design-web-crawler',
    title: 'Design a Web Crawler',
    difficulty: 3,
    timeMinutes: 35,
    category: 'infrastructure',
    companies: ['Google', 'Microsoft', 'Amazon'],
    description: 'Design a distributed web crawler that can crawl billions of web pages efficiently while being polite to web servers.',
    requirements: [
      'Crawl the web breadth-first starting from seed URLs.',
      'Respect robots.txt and implement politeness policies (delay between requests to same host).',
      'Deduplicate URLs and detect content duplicates.',
      'Scale horizontally across multiple crawler nodes.',
    ],
    checklist: [
      'Designed the URL frontier with priority queues and politeness queues.',
      'Addressed URL deduplication (Bloom filter or similar).',
      'Discussed content extraction and storage pipeline.',
      'Handled traps: infinite loops, spider traps, dynamic URLs.',
    ],
    hints: [
      { level: 1, text: 'The URL frontier is the key data structure. It needs to prioritize important URLs and ensure politeness (one request per host at a time with delays).', pointsCost: 5 },
      { level: 2, text: 'Use a two-level queue: a priority queue selects which host to crawl next, and per-host FIFO queues maintain politeness. A Bloom filter deduplicates seen URLs.', pointsCost: 10 },
      { level: 3, text: 'Detect content duplicates with SimHash (locality-sensitive hashing). Assign URL partitions to crawler nodes via consistent hashing for host-level affinity.', pointsCost: 15 },
    ],
    concepts: ['Bloom Filter', 'BFS', 'Politeness Policy', 'Consistent Hashing', 'SimHash'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 4 -- Expert (45 min)
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-uber',
    title: 'Design Uber',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Uber', 'Lyft'],
    description: 'Design a ride-sharing platform like Uber. Focus on real-time driver matching, location tracking, ETA estimation, and surge pricing.',
    requirements: [
      'Match riders to nearby available drivers in real-time.',
      'Track driver locations with frequent GPS updates.',
      'Estimate arrival times and trip durations.',
      'Implement surge pricing based on supply and demand.',
      'Handle trip lifecycle: request, match, pickup, in-transit, complete.',
    ],
    checklist: [
      'Designed geospatial indexing for nearby driver queries (geohash, quadtree, or S2).',
      'Addressed real-time location ingestion pipeline at scale.',
      'Explained the matching algorithm and dispatch logic.',
      'Discussed surge pricing model and demand forecasting.',
    ],
    hints: [
      { level: 1, text: 'Geospatial indexing is the core challenge. Geohash converts 2D coordinates into a 1D string that can be prefix-searched for proximity.', pointsCost: 5 },
      { level: 2, text: 'Drivers send GPS pings every 3-5 seconds. Ingest into a location service backed by an in-memory geospatial index. Use a ringfence query to find drivers within radius.', pointsCost: 10 },
      { level: 3, text: 'Matching is a constrained optimization: minimize total wait time across all riders while considering driver ETA, direction of travel, and driver preferences. Start with greedy, evolve to batch matching.', pointsCost: 15 },
    ],
    concepts: ['Geospatial Index', 'Geohash', 'Real-time Location', 'Matching Algorithm', 'Surge Pricing'],
    templateId: 'ride-sharing',
  },
  {
    id: 'design-netflix',
    title: 'Design Netflix',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Netflix', 'Amazon'],
    description: 'Design a video streaming platform like Netflix. Focus on content delivery, recommendation engine, and handling millions of concurrent streams.',
    requirements: [
      'Stream video content to millions of concurrent users globally.',
      'Personalized recommendations based on viewing history.',
      'Support multiple devices and screen sizes with adaptive bitrate.',
      'Content licensing with regional availability.',
      'Handle peak traffic (new releases, live events).',
    ],
    checklist: [
      'Designed the content delivery network (Open Connect-style) with edge servers.',
      'Addressed the recommendation engine pipeline (collaborative + content-based filtering).',
      'Planned for traffic spikes with pre-positioning popular content at edges.',
      'Discussed microservice architecture and resilience (Circuit Breaker, Bulkhead).',
    ],
    hints: [
      { level: 1, text: 'Netflix uses its own CDN (Open Connect). Content is pre-positioned at ISP peering points. Think about what makes video CDN different from web CDN.', pointsCost: 5 },
      { level: 2, text: 'The recommendation engine is a multi-stage pipeline: candidate generation (collaborative filtering), ranking (ML model), and re-ranking (diversity, freshness). Run as offline batch + online serving.', pointsCost: 10 },
      { level: 3, text: 'Use the Chaos Engineering approach: Netflix Simian Army. Design for failure with circuit breakers (Hystrix), bulkheads, and graceful degradation (show cached recommendations if the ML service is down).', pointsCost: 15 },
    ],
    concepts: ['CDN', 'Recommendation Engine', 'Adaptive Bitrate', 'Circuit Breaker', 'Chaos Engineering'],
  },
  {
    id: 'design-search-engine',
    title: 'Design a Search Engine',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Google', 'Microsoft', 'Apple'],
    description: 'Design a web search engine like Google. Focus on crawling, indexing, ranking, and serving search results with low latency.',
    requirements: [
      'Build an inverted index from crawled web pages.',
      'Rank results by relevance using PageRank and other signals.',
      'Serve search queries with sub-second latency.',
      'Support autocomplete and spell correction.',
      'Handle index updates as new content is crawled.',
    ],
    checklist: [
      'Designed the inverted index structure with term-to-document mappings.',
      'Explained ranking algorithm combining PageRank, TF-IDF, and freshness.',
      'Addressed index partitioning (by document or by term) and replication.',
      'Discussed query parsing, autocomplete trie, and spell correction.',
    ],
    hints: [
      { level: 1, text: 'An inverted index maps each word to a sorted list of document IDs containing that word. Boolean queries intersect these lists.', pointsCost: 5 },
      { level: 2, text: 'Partition the index by document (each shard has all terms for a subset of docs). A query goes to all shards in parallel and results are merged. Replicate each shard for redundancy.', pointsCost: 10 },
      { level: 3, text: 'PageRank is computed offline in a batch MapReduce job. At query time, combine PageRank with TF-IDF relevance, click-through rate, and freshness signals. Use a two-phase ranking: fast first pass, then expensive re-ranking on top-K.', pointsCost: 15 },
    ],
    concepts: ['Inverted Index', 'PageRank', 'TF-IDF', 'Index Partitioning', 'MapReduce'],
  },
  {
    id: 'design-payment-system',
    title: 'Design a Payment System',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Stripe', 'PayPal', 'Square'],
    description: 'Design a payment processing system like Stripe. Focus on reliability, idempotency, and handling distributed transactions across payment providers.',
    requirements: [
      'Process credit card payments with exactly-once semantics.',
      'Support multiple payment providers with failover.',
      'Implement idempotency to prevent double charges.',
      'Handle refunds, disputes, and reconciliation.',
      'Meet PCI-DSS compliance requirements.',
    ],
    checklist: [
      'Designed the payment state machine (pending -> authorized -> captured -> settled).',
      'Addressed idempotency keys and exactly-once processing.',
      'Planned the reconciliation pipeline between internal ledger and provider records.',
      'Discussed PCI-DSS compliance: tokenization, encryption, and audit logging.',
    ],
    hints: [
      { level: 1, text: 'Payments are a state machine. Each payment moves through states: created -> processing -> authorized -> captured -> settled. Each transition must be idempotent.', pointsCost: 5 },
      { level: 2, text: 'Use idempotency keys: the client sends a unique key with each request. The server checks if this key has been processed before and returns the cached result. Store the key-to-result mapping.', pointsCost: 10 },
      { level: 3, text: 'For reconciliation, run a nightly batch job that compares your ledger with each payment provider\'s settlement report. Flag discrepancies for manual review. Use double-entry bookkeeping for the internal ledger.', pointsCost: 15 },
    ],
    concepts: ['Idempotency', 'State Machine', 'Double-Entry Bookkeeping', 'PCI-DSS', 'Reconciliation'],
  },
  {
    id: 'design-maps',
    title: 'Design Google Maps',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Google', 'Uber', 'Apple'],
    description: 'Design a mapping and navigation service like Google Maps. Focus on map tile serving, route planning, and real-time traffic.',
    requirements: [
      'Serve map tiles at multiple zoom levels with low latency.',
      'Calculate optimal routes between two points (driving, walking, transit).',
      'Incorporate real-time traffic data into route calculations.',
      'Support location search and points of interest.',
    ],
    checklist: [
      'Designed the map tile pre-rendering and serving pipeline.',
      'Explained routing algorithm (Dijkstra/A* with contraction hierarchies).',
      'Addressed real-time traffic data ingestion and route recalculation.',
      'Discussed geospatial search for POIs and reverse geocoding.',
    ],
    hints: [
      { level: 1, text: 'Map tiles are pre-rendered images at each zoom level. A quadtree divides the world into tiles. Tiles are served from CDN with aggressive caching.', pointsCost: 5 },
      { level: 2, text: 'For routing, use A* search on a road graph. Contraction Hierarchies pre-compute shortcuts that reduce search space from millions to thousands of nodes.', pointsCost: 10 },
      { level: 3, text: 'Real-time traffic: GPS pings from phones create speed observations per road segment. Aggregate into traffic tiles and overlay on routing weights. Recalculate ETA periodically during navigation.', pointsCost: 15 },
    ],
    concepts: ['Quadtree', 'A* Search', 'Contraction Hierarchies', 'Map Tiles', 'Geospatial Index'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 5 -- Master (60 min)
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-google-docs',
    title: 'Design Google Docs',
    difficulty: 5,
    timeMinutes: 60,
    category: 'advanced',
    companies: ['Google', 'Microsoft', 'Notion'],
    description: 'Design a real-time collaborative document editor like Google Docs. Focus on conflict resolution, real-time sync, and operational transforms.',
    requirements: [
      'Multiple users can simultaneously edit the same document in real-time.',
      'Resolve conflicting edits without data loss (OT or CRDT).',
      'Support rich text formatting, images, and tables.',
      'Maintain full revision history with the ability to revert.',
      'Handle offline editing and sync on reconnection.',
    ],
    checklist: [
      'Chose and explained a conflict resolution strategy (OT vs CRDT) with tradeoffs.',
      'Designed the real-time sync protocol (WebSocket with operational transforms).',
      'Addressed cursor presence and awareness of other editors.',
      'Discussed document storage format and revision history (event sourcing).',
    ],
    hints: [
      { level: 1, text: 'The core challenge is concurrent edits. Two users editing the same paragraph must see a consistent result. Look into Operational Transformation (OT) or CRDTs.', pointsCost: 5 },
      { level: 2, text: 'OT transforms operations against each other to maintain consistency. A central server orders operations. CRDTs are decentralized but have higher memory overhead. Google Docs uses OT.', pointsCost: 10 },
      { level: 3, text: 'Store the document as a sequence of operations (event sourcing). Periodically snapshot the document state for fast loading. For offline editing, buffer operations locally and merge on reconnection using OT.', pointsCost: 15 },
    ],
    concepts: ['Operational Transform', 'CRDT', 'WebSocket', 'Event Sourcing', 'Conflict Resolution'],
  },
  {
    id: 'design-distributed-database',
    title: 'Design a Distributed Database',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'CockroachDB'],
    description: 'Design a distributed SQL database like CockroachDB or Google Spanner. Focus on distributed transactions, consensus, and global consistency.',
    requirements: [
      'Support ACID transactions across distributed partitions.',
      'Implement a consensus protocol (Raft or Paxos) for replication.',
      'Provide serializable isolation level with distributed locking.',
      'Handle data partitioning with automatic rebalancing.',
      'Support global deployment with TrueTime-like clock synchronization.',
    ],
    checklist: [
      'Explained the consensus protocol (Raft) for leader election and log replication.',
      'Designed the distributed transaction protocol (2PC with Raft groups).',
      'Addressed the clock synchronization problem (TrueTime, hybrid logical clocks).',
      'Discussed range-based partitioning and automatic split/merge.',
    ],
    hints: [
      { level: 1, text: 'Each partition (range of keys) is managed by a Raft group. The Raft leader handles reads and writes for that partition. Think about what happens when a transaction spans multiple partitions.', pointsCost: 5 },
      { level: 2, text: 'Cross-partition transactions use two-phase commit (2PC) where each partition\'s Raft group participates as a resource manager. The transaction coordinator is itself replicated for fault tolerance.', pointsCost: 10 },
      { level: 3, text: 'Google Spanner uses TrueTime (GPS + atomic clocks) to assign globally meaningful timestamps. Without TrueTime, use Hybrid Logical Clocks (HLC) that combine physical time with logical counters.', pointsCost: 15 },
    ],
    concepts: ['Raft Consensus', 'Two-Phase Commit', 'TrueTime', 'Range Partitioning', 'Serializable Isolation'],
    templateId: 'distributed-db',
  },
  {
    id: 'design-stock-exchange',
    title: 'Design a Stock Exchange',
    difficulty: 5,
    timeMinutes: 60,
    category: 'advanced',
    companies: ['NASDAQ', 'Citadel', 'Jane Street'],
    description: 'Design a stock exchange matching engine like NASDAQ. Focus on order matching, low-latency processing, and market data dissemination.',
    requirements: [
      'Match buy and sell orders using price-time priority (limit order book).',
      'Process orders with sub-millisecond latency.',
      'Disseminate market data (quotes, trades) to subscribers in real-time.',
      'Support order types: market, limit, stop-loss, and cancel/modify.',
      'Ensure strict ordering and no lost or duplicate trades.',
    ],
    checklist: [
      'Designed the limit order book data structure (sorted by price, FIFO within price).',
      'Addressed the matching algorithm for different order types.',
      'Planned the market data feed with multicast and sequencing.',
      'Discussed fault tolerance: deterministic replay from the journal.',
    ],
    hints: [
      { level: 1, text: 'A limit order book has two sides: bids (buy, sorted descending by price) and asks (sell, sorted ascending by price). When a new order arrives, match it against the opposite side.', pointsCost: 5 },
      { level: 2, text: 'Use an event-sourced architecture: every order and match is written to a sequential journal. The matching engine is a deterministic state machine. Replay the journal to recover state.', pointsCost: 10 },
      { level: 3, text: 'For ultra-low latency: single-threaded matching per instrument (no locks), kernel bypass networking (DPDK/RDMA), pre-allocated memory pools, and lock-free ring buffers for inter-thread communication.', pointsCost: 15 },
    ],
    concepts: ['Order Book', 'Price-Time Priority', 'Event Sourcing', 'Multicast', 'Deterministic Replay'],
  },
  {
    id: 'design-distributed-message-queue',
    title: 'Design a Distributed Message Queue',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['LinkedIn', 'Uber', 'Confluent'],
    description: 'Design a distributed message queue like Apache Kafka. Focus on ordering guarantees, persistence, consumer groups, and high throughput.',
    requirements: [
      'Publish and consume messages with configurable ordering guarantees.',
      'Persist messages to disk with configurable retention.',
      'Support consumer groups with partition-based load balancing.',
      'Achieve high throughput with batching and zero-copy transfer.',
      'Replicate partitions for fault tolerance with ISR (in-sync replicas).',
    ],
    checklist: [
      'Designed the log-structured storage engine with append-only segments.',
      'Explained partition-based ordering and consumer group rebalancing.',
      'Addressed replication protocol with ISR and leader election.',
      'Discussed exactly-once semantics and idempotent producers.',
    ],
    hints: [
      { level: 1, text: 'A topic is divided into partitions. Each partition is an append-only log. Messages within a partition are totally ordered by offset.', pointsCost: 5 },
      { level: 2, text: 'Replication: each partition has a leader and N-1 followers. Producers write to the leader. The leader waits for ISR (in-sync replicas) to acknowledge before committing. If the leader fails, an ISR member is elected.', pointsCost: 10 },
      { level: 3, text: 'For exactly-once: assign each producer a PID and sequence number. The broker deduplicates by (PID, sequence). For transactional writes across partitions, use a transaction coordinator with a two-phase commit to the transaction log.', pointsCost: 15 },
    ],
    concepts: ['Log-Structured Storage', 'Partitioning', 'ISR', 'Consumer Groups', 'Exactly-Once Semantics'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 1 -- Beginner (15 min) -- continued
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-hit-counter',
    title: 'Design a Hit Counter',
    difficulty: 1,
    timeMinutes: 15,
    category: 'classic',
    companies: ['Amazon', 'Microsoft'],
    description: 'Design a hit counter that counts the number of hits received in the past 5 minutes. It should support high-throughput concurrent increments and efficient range queries.',
    requirements: [
      'Support a hit() method that records a hit at the current timestamp.',
      'Support a getHits() method that returns the count of hits in the last 300 seconds.',
      'Handle concurrent writes from multiple servers.',
    ],
    checklist: [
      'Chose an appropriate time-bucketed data structure (circular buffer, sliding window).',
      'Explained how to handle concurrent increments (atomic operations).',
      'Addressed clock skew and timestamp precision.',
      'Discussed scalability for distributed deployments (Redis INCR, sharded counters).',
    ],
    hints: [
      { level: 1, text: 'Think about bucketing hits by second. A circular buffer of 300 slots (one per second) avoids unbounded memory growth.', pointsCost: 5 },
      { level: 2, text: 'Each slot stores a count and a timestamp. When a hit arrives, check if the slot timestamp matches the current second. If not, reset the count. Use atomic compare-and-swap for thread safety.', pointsCost: 10 },
      { level: 3, text: 'For distributed counters, use Redis with per-second keys and INCR. Set a TTL of 300 seconds on each key. getHits() sums the last 300 keys using MGET.', pointsCost: 15 },
    ],
    concepts: ['Sliding Window', 'Circular Buffer', 'Atomic Operations', 'Time Bucketing'],
  },
  {
    id: 'design-logging-service',
    title: 'Design a Logging Service',
    difficulty: 1,
    timeMinutes: 15,
    category: 'infrastructure',
    companies: ['Datadog', 'Splunk', 'Amazon'],
    description: 'Design a centralized logging service that collects, stores, and searches log entries from multiple application servers. Focus on log ingestion, storage format, and basic querying.',
    requirements: [
      'Ingest structured log entries from multiple sources with timestamps.',
      'Store logs efficiently with configurable retention periods.',
      'Support searching and filtering logs by severity, service, and time range.',
    ],
    checklist: [
      'Designed the log ingestion pipeline (agents, collectors, storage).',
      'Chose a storage format optimized for append-heavy, time-range queries.',
      'Addressed log rotation and retention policies.',
      'Discussed indexing strategy for search and filtering.',
    ],
    hints: [
      { level: 1, text: 'Logs are append-only and time-ordered. Think about storage engines optimized for this pattern: append-only files, LSM trees, or time-series databases.', pointsCost: 5 },
      { level: 2, text: 'Use a log collector agent (Fluentd, Filebeat) on each server that ships logs to a central service. Buffer locally to handle network blips.', pointsCost: 10 },
      { level: 3, text: 'Partition logs by time (hourly or daily files/indices). Index by service name and severity for fast filtered queries. Use compressed columnar storage for cost efficiency.', pointsCost: 15 },
    ],
    concepts: ['Log Aggregation', 'LSM Tree', 'Time-Series Storage', 'Log Rotation', 'Indexing'],
  },
  {
    id: 'design-pastebin-simple',
    title: 'Design a Pastebin (simple)',
    difficulty: 1,
    timeMinutes: 15,
    category: 'classic',
    companies: ['Meta', 'Google'],
    description: 'Design a minimal paste service where users submit text and receive a short URL to share it. Focus on the core read/write path, unique key generation, and basic storage.',
    requirements: [
      'Accept text input and return a unique short URL for retrieval.',
      'Serve paste content with low latency on read.',
      'Support optional expiration (TTL) for pastes.',
    ],
    checklist: [
      'Designed a unique key generation strategy (auto-increment, hash, or random ID).',
      'Chose appropriate storage (SQL, NoSQL, or object store) for paste content.',
      'Addressed read-heavy traffic with caching.',
      'Discussed paste size limits and abuse prevention.',
    ],
    hints: [
      { level: 1, text: 'A 6-character base62 key gives ~56 billion unique combinations. Think about generating these without collisions.', pointsCost: 5 },
      { level: 2, text: 'Pre-generate a pool of unique keys in a key-generation service. When a paste is created, pop a key from the pool. This avoids collision checks at write time.', pointsCost: 10 },
      { level: 3, text: 'For reads, put a CDN or Redis cache in front of storage. Most pastes are read far more often than written. Set cache TTL to match paste expiration.', pointsCost: 15 },
    ],
    concepts: ['Key Generation', 'Base62 Encoding', 'Caching', 'TTL', 'Object Storage'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 2 -- Easy (25 min) -- continued
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-bookmark-manager',
    title: 'Design a Bookmark Manager',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Google', 'Pinterest', 'Apple'],
    description: 'Design a bookmark management service where users can save, organize, tag, and search their bookmarks. It should support folders, tags, and full-text search over saved page content.',
    requirements: [
      'Users can save URLs with titles, descriptions, and tags.',
      'Organize bookmarks into folders or collections.',
      'Full-text search across bookmark titles, descriptions, and tags.',
      'Support import/export of bookmarks in standard formats.',
    ],
    checklist: [
      'Designed the data model for bookmarks, folders, and tags (many-to-many).',
      'Addressed full-text search indexing (Elasticsearch or database FTS).',
      'Handled bookmark metadata fetching (title, favicon, preview) asynchronously.',
      'Discussed sync across devices and conflict resolution.',
    ],
    hints: [
      { level: 1, text: 'Tags create a many-to-many relationship. Think about whether to use a join table or denormalize tags into an array column.', pointsCost: 5 },
      { level: 2, text: 'When a user saves a URL, asynchronously fetch the page to extract title, description, and Open Graph metadata. Store a snapshot for offline search.', pointsCost: 10 },
      { level: 3, text: 'For full-text search, index bookmark content in Elasticsearch. Use a CDC (change data capture) pipeline to keep the search index in sync with the primary database.', pointsCost: 15 },
    ],
    concepts: ['Full-Text Search', 'Many-to-Many Relations', 'CDC', 'Async Processing', 'Data Modeling'],
  },
  {
    id: 'design-image-upload-service',
    title: 'Design an Image Upload Service',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Meta', 'Cloudflare', 'Imgur'],
    description: 'Design a service for uploading, processing, and serving images at scale. Focus on the upload pipeline, image transformations, and CDN-based delivery.',
    requirements: [
      'Accept image uploads with validation (format, size, dimensions).',
      'Generate multiple resolutions and formats (thumbnail, medium, WebP) on upload.',
      'Serve images through a CDN with appropriate cache headers.',
      'Support signed upload URLs for direct-to-storage uploads.',
    ],
    checklist: [
      'Designed the upload flow: presigned URL to object storage, then async processing.',
      'Addressed image processing pipeline (resize, compress, format conversion).',
      'Planned CDN invalidation strategy when images are updated or deleted.',
      'Discussed storage costs and lifecycle policies for different image sizes.',
    ],
    hints: [
      { level: 1, text: 'Uploading directly to the application server is a bottleneck. Use presigned URLs to let clients upload directly to S3/GCS.', pointsCost: 5 },
      { level: 2, text: 'Trigger image processing via an event (S3 notification -> SQS -> Lambda/worker). Generate thumbnails and variants asynchronously. Store all variants with predictable key naming.', pointsCost: 10 },
      { level: 3, text: 'Consider on-the-fly image transformation (like Imgix/Cloudinary): a CDN edge function resizes on first request and caches the result. This avoids pre-generating every possible size.', pointsCost: 15 },
    ],
    concepts: ['Object Storage', 'Presigned URLs', 'CDN', 'Image Processing', 'Event-Driven Architecture'],
  },
  {
    id: 'design-polling-voting-system',
    title: 'Design a Polling/Voting System',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Twitter/X', 'Meta', 'Reddit'],
    description: 'Design an online polling and voting system where users can create polls, cast votes, and see real-time results. Focus on vote integrity, preventing duplicate votes, and real-time tallying.',
    requirements: [
      'Users can create polls with multiple choice options.',
      'Each user can vote once per poll with tamper-proof recording.',
      'Display real-time vote tallies and percentages.',
      'Support both public and anonymous voting modes.',
    ],
    checklist: [
      'Designed vote deduplication strategy (user-poll unique constraint).',
      'Addressed real-time result updates (WebSocket or polling with caching).',
      'Handled high-concurrency vote counting without race conditions.',
      'Discussed vote integrity and audit trails.',
    ],
    hints: [
      { level: 1, text: 'A unique constraint on (user_id, poll_id) in the database prevents duplicate votes. But what about performance under high concurrency?', pointsCost: 5 },
      { level: 2, text: 'Use Redis for real-time counters: HINCRBY for vote counts, SADD to a set of voter IDs for deduplication. Periodically flush to the database for persistence.', pointsCost: 10 },
      { level: 3, text: 'For real-time results, publish vote events to a Pub-Sub channel. Clients subscribe via WebSocket and update their UI. Use a leaderboard sorted set for ranked options.', pointsCost: 15 },
    ],
    concepts: ['Deduplication', 'Atomic Counters', 'WebSocket', 'Pub-Sub', 'Unique Constraints'],
  },
  {
    id: 'design-link-shortener-analytics',
    title: 'Design a Link Shortener with Analytics',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Bitly', 'Google', 'Stripe'],
    description: 'Design a URL shortener with comprehensive analytics tracking. Beyond basic redirection, track clicks with metadata (referrer, geo, device) and provide real-time and historical dashboards.',
    requirements: [
      'Shorten URLs and redirect with sub-50ms latency.',
      'Track each click with timestamp, referrer, geo-location, and device info.',
      'Provide real-time click counts and historical analytics dashboards.',
      'Support custom vanity URLs and link expiration.',
    ],
    checklist: [
      'Separated the hot redirect path from the analytics ingestion path.',
      'Designed an analytics pipeline: collect -> buffer -> aggregate -> store.',
      'Addressed high-write analytics ingestion without impacting redirect latency.',
      'Discussed pre-aggregation vs raw event storage tradeoffs.',
    ],
    hints: [
      { level: 1, text: 'The redirect path must be fast. Log click events asynchronously so analytics collection does not block the redirect response.', pointsCost: 5 },
      { level: 2, text: 'Write click events to a Kafka topic. A stream processor (Flink) aggregates clicks per link per time window. Store aggregates in a time-series database for dashboards.', pointsCost: 10 },
      { level: 3, text: 'For geo-location, use a MaxMind IP database lookup at the edge. For real-time counters, use Redis HyperLogLog for unique visitor approximation and sorted sets for top links.', pointsCost: 15 },
    ],
    concepts: ['Stream Processing', 'Time-Series Database', 'HyperLogLog', 'Kafka', 'Pre-Aggregation'],
  },
  {
    id: 'design-webhook-delivery-system',
    title: 'Design a Webhook Delivery System',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Stripe', 'Twilio', 'GitHub'],
    description: 'Design a webhook delivery system that reliably sends HTTP callbacks to subscriber endpoints when events occur. Focus on delivery guarantees, retry logic, and subscriber management.',
    requirements: [
      'Register webhook endpoints for specific event types.',
      'Deliver webhook payloads with at-least-once guarantee.',
      'Implement exponential backoff retries for failed deliveries.',
      'Provide delivery logs and manual retry capability.',
    ],
    checklist: [
      'Designed the event-to-webhook dispatch pipeline with queuing.',
      'Addressed retry strategy with exponential backoff and max attempts.',
      'Handled slow/unresponsive endpoints without blocking other deliveries.',
      'Discussed webhook signature verification (HMAC) for security.',
    ],
    hints: [
      { level: 1, text: 'Use a message queue between event generation and webhook delivery. Each webhook endpoint gets its own delivery task, so one slow endpoint does not block others.', pointsCost: 5 },
      { level: 2, text: 'Implement exponential backoff: retry after 1s, 2s, 4s, 8s, ... up to a max. After N failures, mark the endpoint as disabled and alert the subscriber.', pointsCost: 10 },
      { level: 3, text: 'Sign payloads with HMAC-SHA256 using a per-subscriber secret. Include a timestamp in the signature to prevent replay attacks. Provide a verification endpoint subscribers can use to validate their setup.', pointsCost: 15 },
    ],
    concepts: ['Message Queue', 'Exponential Backoff', 'HMAC', 'At-Least-Once Delivery', 'Dead Letter Queue'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 3 -- Medium (35 min) -- continued
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-live-sports-scores',
    title: 'Design a Live Sports Score System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['ESPN', 'Apple', 'Google'],
    description: 'Design a system that delivers live sports scores and play-by-play updates to millions of concurrent users. Focus on low-latency push updates, data ingestion from multiple sports feeds, and handling traffic spikes during major events.',
    requirements: [
      'Ingest live scores from multiple data provider feeds in real-time.',
      'Push score updates to millions of concurrent clients with sub-second latency.',
      'Support multiple sports with different scoring models and game states.',
      'Handle massive traffic spikes during popular events (Super Bowl, World Cup).',
      'Provide historical scores and game summaries.',
    ],
    checklist: [
      'Designed the data ingestion pipeline from multiple provider feeds.',
      'Chose a push mechanism (WebSocket, SSE, or long polling) for real-time delivery.',
      'Addressed fan-out to millions of concurrent connections.',
      'Discussed graceful degradation during extreme traffic spikes.',
    ],
    hints: [
      { level: 1, text: 'Millions of users watching the same game get the same updates. Think about how pub-sub and connection fan-out servers can broadcast efficiently.', pointsCost: 5 },
      { level: 2, text: 'Use a tiered architecture: data ingestion -> normalization -> pub-sub (Redis/NATS) -> fan-out edge servers -> clients via SSE/WebSocket. Each edge server handles thousands of connections.', pointsCost: 10 },
      { level: 3, text: 'For extreme spikes, use CDN-based SSE or edge workers (Cloudflare Workers) to handle connection fan-out at the edge. Fall back to polling with short TTL cache for overflow.', pointsCost: 15 },
    ],
    concepts: ['Server-Sent Events', 'Fan-out', 'Pub-Sub', 'Edge Computing', 'Connection Pooling'],
  },
  {
    id: 'design-ecommerce-catalog',
    title: 'Design an E-commerce Product Catalog',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Amazon', 'Shopify', 'Walmart'],
    description: 'Design a product catalog for a large e-commerce platform like Amazon. Focus on product search, filtering, categorization, and handling a diverse schema across product categories.',
    requirements: [
      'Store millions of products with category-specific attributes (electronics vs clothing).',
      'Support faceted search with filters (price range, brand, ratings, attributes).',
      'Provide full-text product search with relevance ranking.',
      'Handle product variants (size, color) and inventory status.',
      'Support seller-managed product listings with moderation.',
    ],
    checklist: [
      'Designed a flexible schema for diverse product attributes (EAV, JSON, or document store).',
      'Addressed faceted search and filter implementation (Elasticsearch aggregations).',
      'Planned for catalog updates at scale (batch imports, real-time updates).',
      'Discussed product ranking signals (sales, reviews, relevance, sponsored).',
    ],
    hints: [
      { level: 1, text: 'Products across categories have wildly different attributes. A rigid relational schema does not work. Consider a document store or EAV (entity-attribute-value) model.', pointsCost: 5 },
      { level: 2, text: 'Use Elasticsearch for search and faceted filtering. Store the product catalog in a primary database (PostgreSQL with JSONB, or DynamoDB) and sync to Elasticsearch via CDC.', pointsCost: 10 },
      { level: 3, text: 'For product ranking, combine text relevance (BM25) with business signals (conversion rate, reviews, recency) in a learned ranking model. Sponsored products are injected at serving time with clear labeling.', pointsCost: 15 },
    ],
    concepts: ['Faceted Search', 'Elasticsearch', 'EAV Model', 'CDC', 'Learned Ranking'],
  },
  {
    id: 'design-ride-sharing-simplified',
    title: 'Design a Ride Sharing Service (simplified)',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Uber', 'Lyft', 'DoorDash'],
    description: 'Design a simplified ride-sharing service. Focus on the core matching loop: riders request rides, the system finds nearby drivers, and manages the trip lifecycle from pickup to drop-off.',
    requirements: [
      'Riders request a ride with pickup and drop-off locations.',
      'Find and match the nearest available driver within a radius.',
      'Track the trip lifecycle: requested -> matched -> en route -> in progress -> completed.',
      'Calculate fare based on distance and time.',
      'Show estimated time of arrival (ETA) to the rider.',
    ],
    checklist: [
      'Designed geospatial indexing for finding nearby drivers (geohash or quadtree).',
      'Explained the matching algorithm and driver acceptance flow.',
      'Addressed concurrent ride requests competing for the same driver.',
      'Discussed fare calculation and payment integration.',
    ],
    hints: [
      { level: 1, text: 'Store driver locations in a geospatial index. When a rider requests, query for drivers within a radius and rank by distance/ETA.', pointsCost: 5 },
      { level: 2, text: 'Use geohash prefixes for proximity queries. Drivers update their location every few seconds. Use Redis GEO commands (GEOADD, GEORADIUS) for fast spatial lookups.', pointsCost: 10 },
      { level: 3, text: 'Handle race conditions with optimistic locking: when a driver is matched, mark them as "offered" with a timeout. If they do not accept within N seconds, release and offer to the next driver.', pointsCost: 15 },
    ],
    concepts: ['Geospatial Index', 'Geohash', 'State Machine', 'Optimistic Locking', 'ETA Estimation'],
  },
  {
    id: 'design-social-network-graph',
    title: 'Design a Social Network Graph',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Meta', 'LinkedIn', 'Twitter/X'],
    description: 'Design the social graph backend for a social network like LinkedIn or Facebook. Focus on storing and querying relationships, friend-of-friend traversals, and connection recommendations.',
    requirements: [
      'Store user connections (follow, friend, block) with relationship types.',
      'Query mutual friends and degree-of-separation between two users.',
      'Generate "People You May Know" recommendations based on graph proximity.',
      'Support feed ranking based on connection strength (interaction frequency).',
      'Handle graphs with hundreds of millions of nodes and billions of edges.',
    ],
    checklist: [
      'Chose a graph storage strategy (graph database, adjacency list in SQL, or hybrid).',
      'Addressed efficient multi-hop traversal queries (BFS with depth limit).',
      'Designed the recommendation algorithm (common connections, shared attributes).',
      'Discussed graph partitioning and sharding strategies.',
    ],
    hints: [
      { level: 1, text: 'An adjacency list in a relational database works for simple queries but struggles with multi-hop traversals. Consider when a graph database (Neo4j) is worth the complexity.', pointsCost: 5 },
      { level: 2, text: 'For "People You May Know," find friends-of-friends who are not already connected. Rank by number of mutual connections. Precompute and cache recommendations in batch.', pointsCost: 10 },
      { level: 3, text: 'Shard the graph by user ID. Cross-shard traversals are expensive, so replicate high-degree nodes (celebrities) to all shards. Use bidirectional BFS for shortest path queries.', pointsCost: 15 },
    ],
    concepts: ['Graph Database', 'Adjacency List', 'BFS', 'Graph Partitioning', 'Collaborative Filtering'],
  },
  {
    id: 'design-video-conferencing',
    title: 'Design a Video Conferencing Backend',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Zoom', 'Google', 'Microsoft'],
    description: 'Design the backend for a video conferencing platform like Zoom. Focus on media routing, room management, and handling real-time audio/video streams at scale.',
    requirements: [
      'Support multi-party video calls with up to 100 participants.',
      'Route audio and video streams with low latency (<200ms).',
      'Handle screen sharing and recording.',
      'Support join/leave mid-call and participant management.',
      'Provide chat and reactions alongside video.',
    ],
    checklist: [
      'Chose a media routing topology (mesh, SFU, or MCU) with tradeoffs.',
      'Designed the signaling server for room management and session negotiation.',
      'Addressed bandwidth adaptation and quality adjustment per participant.',
      'Discussed recording pipeline and storage.',
    ],
    hints: [
      { level: 1, text: 'Mesh networking (peer-to-peer) works for small calls but does not scale. An SFU (Selective Forwarding Unit) receives streams from each participant and forwards them to others without transcoding.', pointsCost: 5 },
      { level: 2, text: 'Use WebRTC for media transport with an SFU server. Each participant sends one stream and receives N-1 streams. The SFU can drop quality layers (simulcast) based on each receiver bandwidth.', pointsCost: 10 },
      { level: 3, text: 'For global calls, deploy SFU servers in multiple regions. Use a cascading SFU topology: regional SFUs connect to each other to relay streams across regions, minimizing latency for each participant.', pointsCost: 15 },
    ],
    concepts: ['WebRTC', 'SFU', 'Simulcast', 'Signaling Server', 'Media Routing'],
  },
  {
    id: 'design-food-ordering',
    title: 'Design a Food Ordering System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['DoorDash', 'Uber', 'Instacart'],
    description: 'Design a food delivery platform like DoorDash or Uber Eats. Focus on order placement, restaurant management, delivery assignment, and real-time order tracking.',
    requirements: [
      'Users browse menus, place orders, and pay online.',
      'Restaurants receive orders and update preparation status.',
      'Assign delivery drivers and provide real-time tracking.',
      'Handle order modifications and cancellations within a time window.',
      'Estimate delivery time based on preparation and travel time.',
    ],
    checklist: [
      'Designed the order lifecycle state machine (placed -> confirmed -> preparing -> ready -> picked up -> delivered).',
      'Addressed restaurant capacity and order throttling during peak hours.',
      'Planned the delivery assignment algorithm (proximity, current load, batching).',
      'Discussed payment flow with holds, captures, and tip handling.',
    ],
    hints: [
      { level: 1, text: 'The order involves three parties: customer, restaurant, and driver. Design a state machine that coordinates all three with clear status transitions and notifications.', pointsCost: 5 },
      { level: 2, text: 'Decouple order placement from driver assignment. Assign a driver when the food is almost ready (predicted by prep time estimate). Use a dispatch service with a matching algorithm similar to ride-sharing.', pointsCost: 10 },
      { level: 3, text: 'Batch nearby orders to the same driver (order stacking). Use constraint optimization: minimize total delivery time while keeping each order within its freshness window. Factor in restaurant prep time variance.', pointsCost: 15 },
    ],
    concepts: ['State Machine', 'Geospatial Index', 'Order Batching', 'ETA Estimation', 'Event-Driven Architecture'],
  },
  {
    id: 'design-distributed-file-system',
    title: 'Design a Distributed File System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'Microsoft'],
    description: 'Design a distributed file system like HDFS or GFS. Focus on how files are split into chunks, replicated across nodes, and how metadata is managed for reliability and performance.',
    requirements: [
      'Store large files by splitting them into fixed-size chunks (64-128MB).',
      'Replicate each chunk across multiple nodes for fault tolerance.',
      'Use a metadata server (namenode) to track file-to-chunk mappings.',
      'Support append operations and sequential reads efficiently.',
    ],
    checklist: [
      'Designed the chunk server architecture and data flow for reads/writes.',
      'Addressed metadata management and namenode high availability.',
      'Explained the replication pipeline (chain replication or parallel writes).',
      'Discussed chunk placement strategy for rack-awareness and load balancing.',
    ],
    hints: [
      { level: 1, text: 'Separate metadata (file names, chunk locations) from data (chunk contents). The metadata server maps file paths to ordered lists of chunk IDs and their locations.', pointsCost: 5 },
      { level: 2, text: 'For writes, the client gets chunk server locations from the metadata server, then writes to the primary chunk server which chains the write to replicas. Acknowledgment flows back in reverse.', pointsCost: 10 },
      { level: 3, text: 'Make the metadata server highly available with a standby that replays an edit log. Use checksums on each chunk to detect corruption. Re-replicate under-replicated chunks automatically.', pointsCost: 15 },
    ],
    concepts: ['Chunk-Based Storage', 'Chain Replication', 'Namenode', 'Rack Awareness', 'Checksumming'],
  },
  {
    id: 'design-realtime-leaderboard',
    title: 'Design a Real-time Leaderboard',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Riot Games', 'Epic Games', 'Amazon'],
    description: 'Design a real-time leaderboard for an online game with millions of players. Support global rankings, friend rankings, and time-segmented leaderboards (daily, weekly, all-time).',
    requirements: [
      'Update player scores in real-time and reflect ranking changes immediately.',
      'Retrieve the top-N players and any player rank with low latency.',
      'Support multiple leaderboard segments (daily, weekly, monthly, all-time).',
      'Show friend-only leaderboards filtered by a user social graph.',
      'Handle millions of concurrent score updates.',
    ],
    checklist: [
      'Chose a data structure for efficient rank queries (sorted set, skip list, or segment tree).',
      'Addressed time-segmented leaderboards with periodic resets.',
      'Designed the friend leaderboard query path.',
      'Discussed sharding strategy for global leaderboards with millions of entries.',
    ],
    hints: [
      { level: 1, text: 'Redis sorted sets (ZADD, ZRANK, ZRANGE) provide O(log N) score updates and O(log N) rank lookups. This is the most common leaderboard building block.', pointsCost: 5 },
      { level: 2, text: 'For time-segmented leaderboards, use separate sorted sets per time window (daily:2024-01-15, weekly:2024-W03). A cron job archives and resets at period boundaries.', pointsCost: 10 },
      { level: 3, text: 'For friend leaderboards, query the user social graph for friend IDs, then ZSCORE each friend from the global leaderboard and sort client-side. Cache friend leaderboards with short TTL.', pointsCost: 15 },
    ],
    concepts: ['Sorted Set', 'Redis', 'Sharding', 'Time-Series Partitioning', 'Skip List'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 4 -- Hard (45 min) -- continued
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-hotel-reservation',
    title: 'Design a Hotel Reservation System',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Booking.com', 'Airbnb', 'Expedia'],
    description: 'Design a hotel reservation system like Booking.com. Focus on availability search, booking with double-booking prevention, pricing strategies, and managing inventory across multiple hotels.',
    requirements: [
      'Search available rooms by location, dates, room type, and price range.',
      'Book rooms with guaranteed no double-booking for the same room/dates.',
      'Support dynamic pricing based on demand, season, and competitor rates.',
      'Handle cancellations with configurable refund policies.',
      'Manage inventory for thousands of hotels with varying room types.',
    ],
    checklist: [
      'Designed the availability data model to handle date-range queries efficiently.',
      'Addressed double-booking prevention (pessimistic locking, optimistic concurrency).',
      'Planned the search and filtering pipeline for availability queries.',
      'Discussed overbooking strategies and compensation policies.',
    ],
    hints: [
      { level: 1, text: 'Model availability as date-indexed inventory counts per room type per hotel. A booking decrements the count. The challenge is concurrent bookings for the same room on the same date.', pointsCost: 5 },
      { level: 2, text: 'Use SELECT FOR UPDATE (pessimistic locking) or optimistic locking with version checks to prevent double bookings. For high-demand rooms, queue booking requests and process sequentially.', pointsCost: 10 },
      { level: 3, text: 'Separate the search path (eventually consistent, cached availability) from the booking path (strongly consistent). Availability search reads from a read replica or search index. Booking writes to the primary with locks.', pointsCost: 15 },
    ],
    concepts: ['Inventory Management', 'Pessimistic Locking', 'Optimistic Concurrency', 'Search Index', 'Dynamic Pricing'],
  },
  {
    id: 'design-ad-serving-platform',
    title: 'Design an Ad Serving Platform',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Google', 'Meta', 'Amazon'],
    description: 'Design an ad serving platform that selects and delivers targeted ads to users in real-time. Focus on the ad auction, targeting, and serving ads with sub-100ms latency at massive scale.',
    requirements: [
      'Run a real-time ad auction (second-price or VCG) for each ad request.',
      'Target ads based on user demographics, interests, and context.',
      'Serve ads with sub-100ms end-to-end latency.',
      'Track impressions, clicks, and conversions for billing and reporting.',
      'Support budget pacing to distribute spend evenly over a campaign period.',
    ],
    checklist: [
      'Designed the ad selection pipeline: targeting -> candidate retrieval -> auction -> serving.',
      'Addressed the real-time bidding and auction mechanism.',
      'Planned the event tracking pipeline for impressions, clicks, and conversions.',
      'Discussed budget pacing and fraud detection.',
    ],
    hints: [
      { level: 1, text: 'The ad serving pipeline is a funnel: start with all ads, filter by targeting criteria, score by relevance and bid, run an auction, and return the winner. Each step must be fast.', pointsCost: 5 },
      { level: 2, text: 'Use an inverted index of targeting criteria (age:25-34 -> [ad_ids], interest:sports -> [ad_ids]). Intersect matching sets for the user profile. Rank candidates by eCPM (bid * predicted CTR).', pointsCost: 10 },
      { level: 3, text: 'Budget pacing: divide the daily budget by expected impressions per hour. Use a PID controller to adjust the bid multiplier in real-time based on actual vs expected spend rate.', pointsCost: 15 },
    ],
    concepts: ['Ad Auction', 'Real-time Bidding', 'Inverted Index', 'Budget Pacing', 'Click-Through Rate'],
  },
  {
    id: 'design-stock-trading-system',
    title: 'Design a Stock Trading System',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Robinhood', 'Stripe', 'Goldman Sachs'],
    description: 'Design an online stock trading system like Robinhood. Focus on order management, portfolio tracking, real-time market data, and regulatory compliance.',
    requirements: [
      'Users can place market, limit, and stop-loss orders for stocks.',
      'Route orders to exchanges and track execution status.',
      'Display real-time stock prices and portfolio value.',
      'Maintain a transaction ledger with full audit trail.',
      'Enforce trading rules (margin requirements, pattern day trading).',
    ],
    checklist: [
      'Designed the order management system with order lifecycle states.',
      'Addressed real-time market data ingestion and distribution to clients.',
      'Planned the portfolio and position tracking system with P&L calculations.',
      'Discussed regulatory compliance, audit logging, and data retention.',
    ],
    hints: [
      { level: 1, text: 'An order goes through states: pending -> submitted -> partial fill -> filled (or cancelled/rejected). Use an event-sourced ledger to track every state change for audit.', pointsCost: 5 },
      { level: 2, text: 'Use a message queue (Kafka) between order submission and exchange routing. This decouples the user-facing API from exchange latency and provides replay capability.', pointsCost: 10 },
      { level: 3, text: 'For real-time portfolio value, subscribe to market data ticks for all held securities. Use a CQRS pattern: write path records trades to the ledger, read path projects portfolio value from a materialized view updated by trade events.', pointsCost: 15 },
    ],
    concepts: ['Event Sourcing', 'CQRS', 'Order Management', 'Market Data Feed', 'Ledger'],
  },
  {
    id: 'design-cloud-storage',
    title: 'Design a Cloud Storage Service (Dropbox)',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Dropbox', 'Google', 'Microsoft'],
    description: 'Design a cloud file storage and sync service like Dropbox. Focus on file synchronization across devices, efficient upload/download, conflict resolution, and deduplication.',
    requirements: [
      'Sync files across multiple devices with near-instant propagation.',
      'Support large file uploads with resumable, chunked transfers.',
      'Detect and resolve conflicts when the same file is edited on multiple devices.',
      'Deduplicate identical file chunks across users to save storage.',
      'Provide file versioning and restore from any previous version.',
    ],
    checklist: [
      'Designed the chunked file upload and download pipeline.',
      'Addressed file sync protocol: change detection, delta sync, and conflict resolution.',
      'Planned deduplication strategy using content-addressable storage.',
      'Discussed metadata service design for file trees and sharing permissions.',
    ],
    hints: [
      { level: 1, text: 'Split files into chunks (4MB). Hash each chunk. Only upload chunks that have changed or are new. The server stores chunks by their content hash (content-addressable storage).', pointsCost: 5 },
      { level: 2, text: 'Use a sync protocol: the client maintains a local snapshot of the file tree with versions. Periodically poll the server for changes (long polling or WebSocket). Apply remote changes locally, detecting conflicts.', pointsCost: 10 },
      { level: 3, text: 'For conflict resolution, if a file is modified on two devices before sync, keep both versions (user resolves). Use vector clocks or Lamport timestamps to detect concurrent edits vs causal edits.', pointsCost: 15 },
    ],
    concepts: ['Content-Addressable Storage', 'Delta Sync', 'Chunked Upload', 'Vector Clocks', 'Deduplication'],
  },
  {
    id: 'design-google-maps-backend',
    title: 'Design Google Maps Backend',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Google', 'Apple', 'Uber'],
    description: 'Design the backend for a mapping and navigation service. Focus on map tile rendering, route planning with real-time traffic, and place search with geocoding.',
    requirements: [
      'Serve pre-rendered map tiles at 20+ zoom levels with low latency.',
      'Compute driving routes using graph algorithms on a road network.',
      'Integrate real-time traffic data to adjust route weights and ETAs.',
      'Support place search, autocomplete, and reverse geocoding.',
      'Handle navigation with turn-by-turn directions and rerouting.',
    ],
    checklist: [
      'Designed the map tile storage and serving architecture (quadtree, CDN).',
      'Explained routing algorithms with preprocessed data (contraction hierarchies, ALT).',
      'Addressed real-time traffic integration into route weights.',
      'Discussed place indexing with geospatial search and text matching.',
    ],
    hints: [
      { level: 1, text: 'Map tiles follow a quadtree structure: each zoom level divides tiles into 4 sub-tiles. Pre-render tiles and serve from CDN. Only render vector tiles on-demand for custom styles.', pointsCost: 5 },
      { level: 2, text: 'Road networks are graphs with intersections as nodes and road segments as edges. Use contraction hierarchies to precompute shortcuts: query time drops from seconds to milliseconds.', pointsCost: 10 },
      { level: 3, text: 'For real-time rerouting during navigation, periodically re-query the routing engine with updated traffic weights. Use a speed layer that overlays current traffic on top of historical traffic patterns.', pointsCost: 15 },
    ],
    concepts: ['Quadtree', 'Contraction Hierarchies', 'Graph Algorithms', 'Geocoding', 'Vector Tiles'],
  },
  {
    id: 'design-recommendation-engine',
    title: 'Design a Recommendation Engine',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Netflix', 'Spotify', 'Amazon'],
    description: 'Design a recommendation engine for a content platform (movies, products, or articles). Focus on the ML pipeline, candidate generation, ranking, and serving personalized recommendations in real-time.',
    requirements: [
      'Generate personalized recommendations based on user behavior and item features.',
      'Support both collaborative filtering and content-based approaches.',
      'Serve recommendations with sub-200ms latency.',
      'Handle the cold-start problem for new users and new items.',
      'Support A/B testing of different recommendation algorithms.',
    ],
    checklist: [
      'Designed the two-stage pipeline: candidate generation + ranking.',
      'Addressed feature engineering and model training infrastructure.',
      'Planned the serving architecture for real-time inference.',
      'Discussed evaluation metrics (precision, recall, diversity, serendipity).',
    ],
    hints: [
      { level: 1, text: 'Recommendations are typically a two-stage process: (1) candidate generation narrows millions of items to hundreds using cheap models, (2) ranking scores candidates with an expensive model.', pointsCost: 5 },
      { level: 2, text: 'Collaborative filtering: embed users and items into a shared vector space (matrix factorization or two-tower neural network). Candidates are the nearest neighbors to the user embedding in item space.', pointsCost: 10 },
      { level: 3, text: 'For cold-start, use content-based features (item metadata, user demographics) until sufficient interaction data is available. Blend collaborative and content signals using a learned mixing weight.', pointsCost: 15 },
    ],
    concepts: ['Collaborative Filtering', 'Content-Based Filtering', 'Embedding', 'ANN Search', 'A/B Testing'],
  },
  {
    id: 'design-fraud-detection',
    title: 'Design a Fraud Detection System',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Stripe', 'PayPal', 'Square'],
    description: 'Design a real-time fraud detection system for a financial platform. Focus on detecting fraudulent transactions in real-time using rules and ML, while minimizing false positives.',
    requirements: [
      'Score each transaction in real-time with a fraud probability.',
      'Apply rule-based checks (velocity, amount, location) and ML model predictions.',
      'Block or flag suspicious transactions for manual review.',
      'Adapt to evolving fraud patterns with model retraining.',
      'Maintain low false positive rates to avoid blocking legitimate users.',
    ],
    checklist: [
      'Designed the real-time scoring pipeline: feature extraction -> rule engine -> ML model -> decision.',
      'Addressed feature computation from streaming data (transaction velocity, device fingerprint).',
      'Planned the feedback loop from manual reviews back to model training.',
      'Discussed latency budget: scoring must complete within the payment authorization window.',
    ],
    hints: [
      { level: 1, text: 'The scoring pipeline runs inline with the payment flow. Feature extraction pulls user history (last N transactions, typical amounts, usual locations) in real-time to feed the model.', pointsCost: 5 },
      { level: 2, text: 'Use a feature store (Redis) with pre-computed user profiles updated on each transaction. Features like "transaction count in last hour" and "unique merchants in last day" are computed via streaming aggregation.', pointsCost: 10 },
      { level: 3, text: 'Combine a rules engine (fast, interpretable, catches known patterns) with an ML model (gradient boosted trees, catches novel patterns). Use the rules engine as a first pass and the ML model as a second pass for borderline cases.', pointsCost: 15 },
    ],
    concepts: ['Feature Store', 'Stream Processing', 'ML Inference', 'Rules Engine', 'Anomaly Detection'],
  },
  {
    id: 'design-multi-tenant-saas',
    title: 'Design a Multi-tenant SaaS Platform',
    difficulty: 4,
    timeMinutes: 45,
    category: 'infrastructure',
    companies: ['Salesforce', 'Atlassian', 'Stripe'],
    description: 'Design the architecture for a multi-tenant SaaS application. Focus on tenant isolation, data partitioning, customization, and scaling strategies that balance cost efficiency with security.',
    requirements: [
      'Support hundreds of tenants with varying sizes (small to enterprise).',
      'Isolate tenant data to prevent cross-tenant access.',
      'Support tenant-specific customizations (branding, workflows, feature flags).',
      'Scale efficiently: small tenants share resources, large tenants get dedicated ones.',
      'Provide per-tenant usage metering and billing.',
    ],
    checklist: [
      'Chose a tenancy model (shared DB, schema-per-tenant, or DB-per-tenant) with tradeoffs.',
      'Addressed tenant isolation at the application and data layers.',
      'Designed the tenant provisioning and onboarding pipeline.',
      'Discussed noisy neighbor prevention and resource quotas.',
    ],
    hints: [
      { level: 1, text: 'Three tenancy models exist: shared everything (cheapest, hardest isolation), schema-per-tenant (moderate), database-per-tenant (most isolated, most expensive). Most SaaS uses shared with row-level isolation.', pointsCost: 5 },
      { level: 2, text: 'For shared-database tenancy, add a tenant_id column to every table and enforce it in every query. Use Row-Level Security (RLS) in PostgreSQL or middleware-based query rewriting.', pointsCost: 10 },
      { level: 3, text: 'Offer a tiered approach: free/small tenants share infrastructure (pooled), enterprise tenants get dedicated compute and possibly a dedicated database. Route requests via a tenant-aware load balancer.', pointsCost: 15 },
    ],
    concepts: ['Multi-tenancy', 'Row-Level Security', 'Tenant Isolation', 'Resource Quotas', 'Feature Flags'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 5 -- Expert (60 min) -- continued
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-global-cdn',
    title: 'Design a Global CDN',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['Cloudflare', 'Amazon', 'Akamai'],
    description: 'Design a global content delivery network like Cloudflare or Akamai. Focus on edge caching, request routing, cache invalidation at scale, and DDoS protection across hundreds of points of presence.',
    requirements: [
      'Cache and serve static and dynamic content from edge servers worldwide.',
      'Route user requests to the nearest/fastest edge server.',
      'Invalidate cached content globally within seconds.',
      'Protect origin servers from DDoS attacks and traffic spikes.',
      'Support edge compute (workers/functions) for custom logic at the edge.',
    ],
    checklist: [
      'Designed the edge caching hierarchy (L1 edge, L2 regional, origin shield).',
      'Addressed request routing with anycast, GeoDNS, or latency-based routing.',
      'Planned the cache invalidation propagation mechanism.',
      'Discussed DDoS mitigation and origin protection strategies.',
    ],
    hints: [
      { level: 1, text: 'CDNs use a hierarchical cache: edge PoPs (close to users) -> regional aggregation points -> origin shield (single point protecting the origin). Cache misses cascade up the hierarchy.', pointsCost: 5 },
      { level: 2, text: 'Route requests using BGP anycast: advertise the same IP from all PoPs and let BGP route to the nearest one. For finer control, use DNS-based routing with latency measurements.', pointsCost: 10 },
      { level: 3, text: 'For fast global purge, use a push-based invalidation protocol: the control plane sends purge commands to all PoPs via a fan-out messaging system. Each PoP marks cached objects as stale. Combine with soft purge (serve stale while revalidating).', pointsCost: 15 },
    ],
    concepts: ['Edge Caching', 'Anycast', 'Cache Invalidation', 'DDoS Mitigation', 'Origin Shield'],
  },
  {
    id: 'design-distributed-database-cockroach',
    title: 'Design a Distributed Database (CockroachDB-style)',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['CockroachDB', 'Google', 'Amazon'],
    description: 'Design a globally distributed SQL database with serializable transactions, automatic sharding, and multi-region replication. Focus on consensus, distributed transactions, and clock synchronization.',
    requirements: [
      'Support full SQL with serializable isolation across distributed partitions.',
      'Use Raft consensus for each partition (range) to replicate data.',
      'Handle distributed transactions spanning multiple ranges with 2PC.',
      'Automatically split and merge ranges as data grows.',
      'Support multi-region deployments with configurable replication zones.',
    ],
    checklist: [
      'Designed the range-based partitioning with automatic split/merge.',
      'Explained the Raft consensus protocol for each range group.',
      'Addressed distributed transaction protocol (parallel commits, transaction pipelining).',
      'Discussed clock synchronization (HLC or TrueTime) for global consistency.',
    ],
    hints: [
      { level: 1, text: 'Data is divided into ranges (contiguous key spans). Each range is replicated via its own Raft group with a leader. The leader serves reads and coordinates writes.', pointsCost: 5 },
      { level: 2, text: 'Distributed transactions use a transaction record and write intents. A coordinating node writes intents to all affected ranges, then commits the transaction record. Other readers see intents and wait or push the transaction.', pointsCost: 10 },
      { level: 3, text: 'CockroachDB uses Hybrid Logical Clocks (HLC) to order transactions. For reads, a read timestamp is assigned. The system ensures no committed write exists between the read timestamp and any concurrent transactions using a commit-wait or clock uncertainty interval.', pointsCost: 15 },
    ],
    concepts: ['Raft Consensus', 'Range Partitioning', 'Hybrid Logical Clocks', 'Distributed Transactions', 'Write Intents'],
  },
  {
    id: 'design-container-orchestrator',
    title: 'Design a Kubernetes-like Container Orchestrator',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'Microsoft'],
    description: 'Design a container orchestration platform like Kubernetes. Focus on scheduling, service discovery, desired-state reconciliation, and managing containerized workloads across a cluster.',
    requirements: [
      'Schedule containers across a cluster of worker nodes based on resource requirements.',
      'Implement desired-state reconciliation: declare target state, system converges.',
      'Provide service discovery and load balancing for containerized services.',
      'Handle node failures with automatic rescheduling of affected containers.',
      'Support rolling updates with health checks and automatic rollback.',
    ],
    checklist: [
      'Designed the control plane: API server, scheduler, and controller manager.',
      'Addressed the scheduling algorithm (bin packing, affinity, anti-affinity).',
      'Explained the reconciliation loop (desired state vs actual state).',
      'Discussed networking model: pod-to-pod, service routing, and ingress.',
    ],
    hints: [
      { level: 1, text: 'The control plane has three main components: an API server (stores desired state in etcd), a scheduler (assigns pods to nodes), and controllers (reconcile actual state with desired state).', pointsCost: 5 },
      { level: 2, text: 'The scheduler filters nodes (enough CPU/memory, matching constraints) then scores them (bin packing, spread, affinity). The top-scoring node gets the pod. This runs for each unscheduled pod.', pointsCost: 10 },
      { level: 3, text: 'Controllers watch for state changes via the API server watch stream. Each controller reconciles one resource type: the ReplicaSet controller ensures N pods exist, the Deployment controller manages rolling updates by creating new ReplicaSets.', pointsCost: 15 },
    ],
    concepts: ['Desired-State Reconciliation', 'Bin Packing', 'Service Discovery', 'etcd', 'Rolling Updates'],
  },
  {
    id: 'design-realtime-analytics-platform',
    title: 'Design a Real-time Analytics Platform',
    difficulty: 5,
    timeMinutes: 60,
    category: 'advanced',
    companies: ['Datadog', 'Snowflake', 'Google'],
    description: 'Design a real-time analytics platform like Apache Druid or ClickHouse that can ingest millions of events per second and serve interactive analytical queries with sub-second latency.',
    requirements: [
      'Ingest millions of events per second from multiple sources.',
      'Support interactive OLAP queries (group by, filter, aggregate) with sub-second latency.',
      'Handle both real-time data (last few minutes) and historical data (months/years).',
      'Support approximate query results (HyperLogLog, sketches) for ultra-fast responses.',
      'Provide pre-aggregated rollups for common query patterns.',
    ],
    checklist: [
      'Designed the Lambda or Kappa architecture for real-time and batch processing.',
      'Addressed the columnar storage format for efficient analytical queries.',
      'Planned the query engine with partition pruning and vectorized execution.',
      'Discussed data retention tiers and rollup aggregation strategies.',
    ],
    hints: [
      { level: 1, text: 'Analytical queries scan many rows but few columns. Columnar storage (store each column separately) enables compression and efficient scans. Think Parquet or ORC format.', pointsCost: 5 },
      { level: 2, text: 'Use a Lambda architecture: a speed layer (in-memory, last few minutes of data) serves recent queries, while a batch layer (columnar files on disk) serves historical queries. Merge results at query time.', pointsCost: 10 },
      { level: 3, text: 'For sub-second queries over billions of rows, use pre-computed rollups (hourly, daily aggregates), partition pruning (time-based partitions), and approximate algorithms (HyperLogLog for count distinct, t-digest for percentiles).', pointsCost: 15 },
    ],
    concepts: ['Columnar Storage', 'Lambda Architecture', 'OLAP', 'HyperLogLog', 'Vectorized Execution'],
  },
  {
    id: 'design-blockchain-exchange',
    title: 'Design a Blockchain Exchange',
    difficulty: 5,
    timeMinutes: 60,
    category: 'advanced',
    companies: ['Coinbase', 'Binance', 'Stripe'],
    description: 'Design a cryptocurrency exchange like Coinbase or Binance. Focus on the order matching engine, wallet management, blockchain integration, and regulatory compliance.',
    requirements: [
      'Support trading multiple cryptocurrency pairs with a matching engine.',
      'Manage user wallets with hot/cold storage separation.',
      'Process deposits and withdrawals by integrating with multiple blockchains.',
      'Provide real-time market data (order book, trades, candlestick charts).',
      'Implement KYC/AML compliance and transaction monitoring.',
    ],
    checklist: [
      'Designed the matching engine with order book and trade execution.',
      'Addressed wallet architecture: hot wallets (online) vs cold wallets (offline).',
      'Planned blockchain integration for deposit detection and withdrawal signing.',
      'Discussed security measures: 2FA, withdrawal limits, and cold storage policies.',
    ],
    hints: [
      { level: 1, text: 'The matching engine maintains an order book per trading pair. Buy and sell orders are matched by price-time priority. This is the heart of the exchange and must be fast and deterministic.', pointsCost: 5 },
      { level: 2, text: 'Keep the majority of funds in cold storage (air-gapped, multi-sig). Hot wallets hold only enough for near-term withdrawals. Automate cold-to-hot replenishment with approval workflows.', pointsCost: 10 },
      { level: 3, text: 'For each blockchain, run a node that monitors for deposits to user-assigned addresses. Wait for sufficient confirmations before crediting the user balance. Use an internal ledger separate from on-chain balances for instant internal transfers.', pointsCost: 15 },
    ],
    concepts: ['Order Book', 'Hot/Cold Wallet', 'Blockchain Integration', 'KYC/AML', 'Multi-Signature'],
  },
  {
    id: 'design-collaborative-code-editor',
    title: 'Design a Collaborative Code Editor (like Replit)',
    difficulty: 5,
    timeMinutes: 60,
    category: 'advanced',
    companies: ['Replit', 'GitHub', 'Google'],
    description: 'Design a cloud-based collaborative code editor like Replit. Focus on real-time collaborative editing, sandboxed code execution, project management, and terminal multiplexing.',
    requirements: [
      'Multiple users can edit the same file simultaneously with real-time sync.',
      'Execute code in a sandboxed environment with resource limits.',
      'Provide a shared terminal with multiplexed I/O streams.',
      'Support multiple programming languages with language server protocol (LSP).',
      'Manage projects with file trees, dependencies, and version history.',
    ],
    checklist: [
      'Designed the collaborative editing protocol (OT or CRDT) for conflict-free sync.',
      'Addressed the sandboxed execution environment (containers, microVMs, or Firecracker).',
      'Planned the terminal multiplexing architecture for shared sessions.',
      'Discussed language server integration for code intelligence (autocomplete, errors).',
    ],
    hints: [
      { level: 1, text: 'The collaborative editing layer and the code execution layer are separate concerns. Editing uses OT/CRDT for real-time sync. Execution runs in an isolated container per project.', pointsCost: 5 },
      { level: 2, text: 'Use CRDTs (like Yjs or Automerge) for the collaborative editor. Each user maintains a local replica. Changes are broadcast via WebSocket and merged without conflicts. Store the CRDT document state for persistence.', pointsCost: 10 },
      { level: 3, text: 'For sandboxed execution, use Firecracker microVMs: lightweight VM start in <125ms, provide strong isolation, and limit CPU/memory/network per user. Mount the project filesystem into the microVM. Multiplex terminal I/O via a PTY proxy.', pointsCost: 15 },
    ],
    concepts: ['CRDT', 'Firecracker', 'WebSocket', 'Language Server Protocol', 'Terminal Multiplexing'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 2 -- Intermediate (25 min) -- batch 3
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-leaderboard-service',
    title: 'Design a Leaderboard Service',
    difficulty: 2,
    timeMinutes: 25,
    category: 'modern',
    companies: ['Riot Games', 'Amazon', 'Spotify'],
    description: 'Design a generic leaderboard service that any game or application can use via API. Support creating named leaderboards, submitting scores, and querying ranks and top-N players.',
    requirements: [
      'Expose an API to create leaderboards, submit scores, and query rankings.',
      'Return top-N entries and the rank of any given user in O(log N) time.',
      'Support multiple leaderboard instances with independent score spaces.',
      'Handle thousands of concurrent score submissions without losing updates.',
    ],
    checklist: [
      'Chose a data structure that supports O(log N) rank lookup (sorted set, skip list).',
      'Designed the multi-tenant leaderboard isolation model.',
      'Addressed concurrent score updates and consistency guarantees.',
      'Discussed pagination for large leaderboards and caching of top-N results.',
    ],
    hints: [
      { level: 1, text: 'Redis sorted sets (ZADD, ZRANK, ZREVRANGE) are purpose-built for leaderboards. Think about how to namespace leaderboards by a prefix key.', pointsCost: 5 },
      { level: 2, text: 'For multi-tenant isolation, use a key naming convention like "lb:{leaderboard_id}". Each leaderboard is a separate sorted set. Persist snapshots to a database for durability.', pointsCost: 10 },
      { level: 3, text: 'For leaderboards with hundreds of millions of entries, shard by score range or use a distributed skip list. Cache the top-1000 in memory and only hit the sorted set for deeper rank queries.', pointsCost: 15 },
    ],
    concepts: ['Sorted Set', 'Skip List', 'Redis', 'Multi-Tenancy', 'Pagination'],
  },
  {
    id: 'design-config-service',
    title: 'Design a Config Service',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Google', 'Netflix', 'Amazon'],
    description: 'Design a centralized configuration management service that applications query at startup and subscribe to for live updates. Support versioning, rollback, and environment-specific overrides.',
    requirements: [
      'Store key-value or structured configuration with namespace/environment scoping.',
      'Push configuration changes to subscribed clients in near-real-time.',
      'Maintain a full version history with the ability to roll back to any previous version.',
      'Support environment-specific overrides (dev, staging, production).',
    ],
    checklist: [
      'Designed the data model for hierarchical config with inheritance and overrides.',
      'Addressed change propagation to clients (long polling, SSE, or watch API).',
      'Planned a safe rollout strategy (canary config, gradual rollout).',
      'Discussed high availability and what happens when the config service is down (cached fallback).',
    ],
    hints: [
      { level: 1, text: 'Configuration has a natural hierarchy: defaults -> environment -> service -> instance. Merge layers to resolve the effective config for a given context.', pointsCost: 5 },
      { level: 2, text: 'Use etcd or ZooKeeper as a backend with a watch API for change notifications. Clients cache the last known config locally so they survive config service outages.', pointsCost: 10 },
      { level: 3, text: 'For safe rollouts, implement canary configs: push changes to a small percentage of instances first, monitor metrics, then gradually roll out. Store config as immutable versions and keep a pointer to the active version for instant rollback.', pointsCost: 15 },
    ],
    concepts: ['Configuration Management', 'Watch API', 'Hierarchical Config', 'Canary Rollout', 'etcd'],
  },
  {
    id: 'design-analytics-pipeline',
    title: 'Design an Analytics Pipeline',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Google', 'Segment', 'Amplitude'],
    description: 'Design an event analytics pipeline that collects user events from web and mobile clients, processes them, and stores them for querying. Focus on reliable ingestion, schema validation, and storage.',
    requirements: [
      'Collect events from web and mobile SDKs with guaranteed delivery.',
      'Validate event schemas and enrich events with server-side metadata.',
      'Store events in a queryable format for product analytics dashboards.',
      'Support replay and reprocessing of historical events.',
    ],
    checklist: [
      'Designed the client SDK batching and retry strategy for reliable delivery.',
      'Addressed schema validation and dead-letter handling for malformed events.',
      'Planned the storage format for efficient analytical queries (columnar, partitioned by time).',
      'Discussed event replay from the raw event log for reprocessing.',
    ],
    hints: [
      { level: 1, text: 'Client SDKs should batch events and retry on failure with exponential backoff. Store events in a local queue (IndexedDB on web, SQLite on mobile) until acknowledged.', pointsCost: 5 },
      { level: 2, text: 'Ingest events into Kafka as the durable raw log. A stream processor validates schemas, enriches with server metadata (geo, user agent parsing), and writes to a columnar store (BigQuery, ClickHouse).', pointsCost: 10 },
      { level: 3, text: 'Keep the raw Kafka log as the source of truth. If the schema changes or a bug is found in processing, replay events from Kafka through a corrected pipeline to rebuild the queryable store.', pointsCost: 15 },
    ],
    concepts: ['Event Streaming', 'Kafka', 'Schema Validation', 'Columnar Storage', 'Dead Letter Queue'],
  },
  {
    id: 'design-session-store',
    title: 'Design a Session Store',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Amazon', 'Cloudflare', 'Stripe'],
    description: 'Design a distributed session store that web applications use to manage user sessions across a horizontally scaled fleet of application servers. Focus on consistency, expiration, and performance.',
    requirements: [
      'Store and retrieve session data by session ID with sub-millisecond latency.',
      'Support automatic session expiration (TTL) and sliding expiry on access.',
      'Replicate session data for high availability across data center failures.',
      'Handle millions of concurrent active sessions.',
    ],
    checklist: [
      'Chose a storage engine optimized for key-value lookups with TTL (Redis, Memcached).',
      'Addressed session replication and failover strategy.',
      'Designed the sliding expiration mechanism (reset TTL on read).',
      'Discussed session hijacking prevention and secure session ID generation.',
    ],
    hints: [
      { level: 1, text: 'Sessions are key-value pairs keyed by a random session ID. Redis with SETEX (set with expiry) is the most common backing store. Think about how to reset expiry on each access.', pointsCost: 5 },
      { level: 2, text: 'Use Redis with GET + EXPIRE for sliding expiry. For HA, run Redis Sentinel or Redis Cluster with replication. If Redis is unavailable, fall back to a signed cookie with limited data.', pointsCost: 10 },
      { level: 3, text: 'Generate session IDs with a CSPRNG (128+ bits of entropy) to prevent guessing. Store a fingerprint (IP + user agent hash) alongside the session and validate on each request to detect hijacking.', pointsCost: 15 },
    ],
    concepts: ['Key-Value Store', 'TTL', 'Session Management', 'Redis Cluster', 'CSPRNG'],
  },
  {
    id: 'design-cdn',
    title: 'Design a CDN',
    difficulty: 2,
    timeMinutes: 25,
    category: 'infrastructure',
    companies: ['Cloudflare', 'Amazon', 'Fastly'],
    description: 'Design a content delivery network for a mid-size web application. Focus on edge caching, cache invalidation, origin shielding, and how DNS directs users to the nearest edge.',
    requirements: [
      'Cache static assets (images, JS, CSS) at edge locations close to users.',
      'Route user requests to the geographically nearest edge server.',
      'Implement cache invalidation when origin content changes.',
      'Shield the origin server from cache stampedes and traffic spikes.',
    ],
    checklist: [
      'Designed the caching hierarchy (edge -> regional -> origin shield).',
      'Addressed request routing using DNS-based or anycast approaches.',
      'Planned cache invalidation (purge API, TTL, stale-while-revalidate).',
      'Discussed cache key design and vary headers for content negotiation.',
    ],
    hints: [
      { level: 1, text: 'DNS-based routing returns the IP of the nearest edge server. Alternatively, anycast advertises the same IP from multiple locations and BGP routes to the closest one.', pointsCost: 5 },
      { level: 2, text: 'Use an origin shield (a single intermediate cache) so that even if 100 edge servers miss, only one request reaches the origin. This prevents cache stampedes on cache expiry.', pointsCost: 10 },
      { level: 3, text: 'Implement stale-while-revalidate: serve the cached (stale) content immediately while fetching a fresh copy from the origin in the background. This hides origin latency from users.', pointsCost: 15 },
    ],
    concepts: ['Edge Caching', 'DNS Routing', 'Origin Shield', 'Cache Invalidation', 'Stale-While-Revalidate'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 3 -- Advanced (35 min) -- batch 3
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-slack',
    title: 'Design Slack',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Slack', 'Microsoft', 'Meta'],
    description: 'Design a team communication platform like Slack with channels, threads, direct messages, search, and integrations. Focus on real-time message delivery, channel fan-out, and message persistence.',
    requirements: [
      'Support channels (public/private), threads, and direct messages.',
      'Deliver messages in real-time to all online channel members.',
      'Provide full-text search across all messages a user has access to.',
      'Support file sharing, reactions, and message editing/deletion.',
      'Handle workspace-level multi-tenancy with data isolation.',
    ],
    checklist: [
      'Designed the real-time message delivery system (WebSocket per user, channel fan-out).',
      'Addressed message persistence with efficient channel history pagination.',
      'Planned the search infrastructure for messages across channels.',
      'Discussed workspace isolation and permission models (channels, roles).',
    ],
    hints: [
      { level: 1, text: 'Each connected user maintains a WebSocket to a gateway server. When a message is posted to a channel, the server must fan out to all online channel members. Think about how to know which gateway each user is connected to.', pointsCost: 5 },
      { level: 2, text: 'Use a connection registry (Redis hash: userId -> gatewayServerId). On channel post, look up all channel member gateway servers and dispatch. For offline members, increment unread counters and push notifications.', pointsCost: 10 },
      { level: 3, text: 'For search, index messages in Elasticsearch partitioned by workspace. Use ACL filtering at query time: only return messages from channels the user belongs to. Sync new messages to the index via a Kafka consumer.', pointsCost: 15 },
    ],
    concepts: ['WebSocket', 'Channel Fan-out', 'Full-Text Search', 'Multi-Tenancy', 'Pub-Sub'],
  },
  {
    id: 'design-reddit',
    title: 'Design Reddit',
    difficulty: 3,
    timeMinutes: 35,
    category: 'classic',
    companies: ['Reddit', 'Meta', 'Twitter/X'],
    description: 'Design a community-driven link aggregation and discussion platform like Reddit. Focus on subreddit management, voting, ranking, and feed generation.',
    requirements: [
      'Users can create subreddits, post links or text, and comment in threads.',
      'Upvote/downvote posts and comments with real-time score updates.',
      'Rank posts using time-decay algorithms (hot, top, new, controversial).',
      'Generate a personalized home feed from subscribed subreddits.',
      'Support nested comment threads with efficient retrieval.',
    ],
    checklist: [
      'Designed the voting system with deduplication and efficient score aggregation.',
      'Addressed post ranking algorithms (Reddit hot ranking formula).',
      'Planned nested comment storage and retrieval (tree structure or materialized path).',
      'Discussed feed generation from subscribed subreddits (fan-out vs fan-in).',
    ],
    hints: [
      { level: 1, text: 'Reddit hot ranking decays score over time: score = log10(upvotes - downvotes) + (post_age_in_seconds / 45000). This means a post with 10x the votes stays hot only ~12 hours longer.', pointsCost: 5 },
      { level: 2, text: 'Store comments as a tree using a materialized path (e.g., "1/4/7/12"). Fetching a subtree is a prefix query. For large threads, lazy-load deeper branches on expand.', pointsCost: 10 },
      { level: 3, text: 'For the home feed, use a hybrid approach: pre-compute feeds for active users (fan-out on write from popular subreddits), and compute on-the-fly for inactive users (fan-in on read by merging top posts from subscribed subreddits).', pointsCost: 15 },
    ],
    concepts: ['Ranking Algorithms', 'Materialized Path', 'Fan-out', 'Voting System', 'Feed Generation'],
  },
  {
    id: 'design-airbnb',
    title: 'Design Airbnb',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Airbnb', 'Booking.com', 'Expedia'],
    description: 'Design a property rental marketplace like Airbnb. Focus on listing search with geo and date filtering, booking with availability management, and the two-sided marketplace dynamics.',
    requirements: [
      'Hosts can list properties with descriptions, photos, pricing, and availability calendars.',
      'Guests search listings by location, dates, guests, and amenities.',
      'Book listings with guaranteed no double-booking for the same dates.',
      'Support reviews, ratings, and host/guest messaging.',
      'Calculate pricing with dynamic rates, fees, and taxes.',
    ],
    checklist: [
      'Designed the search pipeline with geo-filtering and date availability checks.',
      'Addressed booking atomicity and double-booking prevention.',
      'Planned the availability calendar data model for efficient date-range queries.',
      'Discussed the two-sided review and trust system.',
    ],
    hints: [
      { level: 1, text: 'Search involves two filters: geographic proximity (geospatial index) and date availability (calendar check). Think about how to combine these efficiently without scanning all listings.', pointsCost: 5 },
      { level: 2, text: 'Use Elasticsearch for search with geo_point and nested date filters. For booking, use optimistic locking on the availability calendar: read current availability, attempt to mark dates as booked, fail if a concurrent booking already claimed them.', pointsCost: 10 },
      { level: 3, text: 'Separate the search path (eventually consistent, cached) from the booking path (strongly consistent). When a booking is confirmed, asynchronously update the search index. Accept a small window where a recently-booked listing still appears in search.', pointsCost: 15 },
    ],
    concepts: ['Geospatial Search', 'Availability Calendar', 'Optimistic Locking', 'Elasticsearch', 'Two-Sided Marketplace'],
  },
  {
    id: 'design-linkedin-feed',
    title: 'Design LinkedIn Feed',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['LinkedIn', 'Meta', 'Twitter/X'],
    description: 'Design the LinkedIn feed that shows professional content, posts, articles, and job-related updates personalized to each user. Focus on feed ranking, content mixing, and engagement optimization.',
    requirements: [
      'Generate a personalized feed from connections, followed companies, and groups.',
      'Rank feed items by relevance using engagement signals and content quality.',
      'Mix content types: posts, articles, job updates, ads, and "People You May Know."',
      'Support viral distribution: show posts liked or commented on by connections.',
      'Handle varying content freshness requirements (real-time posts vs daily digests).',
    ],
    checklist: [
      'Designed the feed generation pipeline (candidate sourcing -> ranking -> blending).',
      'Addressed the viral/second-degree content distribution mechanism.',
      'Planned content type mixing and diversity rules (avoid showing 5 job posts in a row).',
      'Discussed the feedback loop from engagement metrics back to the ranking model.',
    ],
    hints: [
      { level: 1, text: 'Feed generation is a multi-stage funnel: source candidates from connections and followed entities, score each candidate by predicted engagement, then blend diverse content types with position rules.', pointsCost: 5 },
      { level: 2, text: 'For second-degree distribution, when a connection likes a post, inject it into the liker connection feeds with a "Connection X liked this" attribution. Use an activity-based trigger on the write path.', pointsCost: 10 },
      { level: 3, text: 'Use a two-pass ranking: a lightweight first pass scores thousands of candidates using simple features (recency, author affinity), then a heavy ML model re-ranks the top 500 with richer features (content embedding similarity, predicted engagement).', pointsCost: 15 },
    ],
    concepts: ['Feed Ranking', 'Content Mixing', 'Second-Degree Distribution', 'ML Ranking', 'Engagement Metrics'],
  },
  {
    id: 'design-coupon-system',
    title: 'Design a Coupon System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Amazon', 'Uber', 'Groupon'],
    description: 'Design a coupon and promotion system for an e-commerce or ride-sharing platform. Focus on coupon creation, validation, redemption with concurrency control, and analytics.',
    requirements: [
      'Create coupons with rules: discount type, minimum spend, product/category scope, user eligibility.',
      'Validate and apply coupons at checkout in real-time.',
      'Enforce usage limits (per-coupon total and per-user) with no over-redemption.',
      'Support stacking rules for combining multiple coupons.',
      'Track coupon performance metrics (redemptions, revenue impact).',
    ],
    checklist: [
      'Designed the coupon rule engine for flexible discount conditions.',
      'Addressed concurrent redemption with atomic usage count enforcement.',
      'Planned the coupon validation pipeline in the checkout flow.',
      'Discussed fraud prevention (account farming, coupon abuse detection).',
    ],
    hints: [
      { level: 1, text: 'Coupon redemption is a classic concurrency challenge: if a coupon has 100 uses left and 200 users try simultaneously, you must not exceed 100. Think atomic decrement with a floor check.', pointsCost: 5 },
      { level: 2, text: 'Use Redis DECR with a Lua script that checks if remaining > 0 before decrementing. For per-user limits, use a composite key (coupon_id:user_id) with SETNX. Record final redemption in the database for durability.', pointsCost: 10 },
      { level: 3, text: 'Build a rules engine that evaluates coupon eligibility: parse conditions as a predicate tree (AND/OR of conditions like min_spend > 50, category IN ["electronics"], user_type = "new"). This allows business users to define complex promotions without code changes.', pointsCost: 15 },
    ],
    concepts: ['Rules Engine', 'Atomic Counters', 'Concurrency Control', 'Redis Lua Scripts', 'Predicate Evaluation'],
  },
  {
    id: 'design-zoom-backend',
    title: 'Design Zoom Backend',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Zoom', 'Google', 'Microsoft'],
    description: 'Design the backend infrastructure for a video conferencing platform like Zoom. Focus on signaling, media routing, recording, and scaling to millions of concurrent meetings.',
    requirements: [
      'Manage meeting lifecycle: schedule, join, leave, and end meetings.',
      'Route audio/video streams between participants with low latency.',
      'Support screen sharing, recording, and live transcription.',
      'Scale to handle millions of concurrent meetings across global regions.',
      'Implement waiting rooms, breakout rooms, and host controls.',
    ],
    checklist: [
      'Designed the signaling server for meeting management and participant coordination.',
      'Chose a media routing topology (SFU with simulcast) and justified the decision.',
      'Addressed recording pipeline: capture streams, mux, encode, and store.',
      'Discussed global deployment with regional media servers and cascading.',
    ],
    hints: [
      { level: 1, text: 'Separate signaling (meeting state, participant lists, permissions) from media (audio/video streams). Signaling uses HTTPS/WebSocket; media uses WebRTC with an SFU server.', pointsCost: 5 },
      { level: 2, text: 'Each meeting is assigned to an SFU server in the region closest to the majority of participants. Use simulcast: each sender transmits multiple quality layers (high, medium, low). The SFU selectively forwards layers based on each receiver bandwidth.', pointsCost: 10 },
      { level: 3, text: 'For recording, the SFU sends a copy of all streams to a recording compositor service. This service mixes audio, composites video into a grid layout, encodes to MP4, and uploads to object storage. Run as a sidecar to the SFU for low-latency capture.', pointsCost: 15 },
    ],
    concepts: ['WebRTC', 'SFU', 'Simulcast', 'Signaling Server', 'Media Compositing'],
  },
  {
    id: 'design-calendar-system',
    title: 'Design a Calendar System',
    difficulty: 3,
    timeMinutes: 35,
    category: 'modern',
    companies: ['Google', 'Microsoft', 'Apple'],
    description: 'Design a calendar and scheduling system like Google Calendar. Focus on event storage, recurring events, timezone handling, free/busy queries, and meeting scheduling across participants.',
    requirements: [
      'Create, update, and delete events with start/end times and attendees.',
      'Support recurring events with flexible recurrence rules (RRULE).',
      'Handle timezone conversions for global users and multi-timezone meetings.',
      'Query free/busy availability for scheduling across multiple participants.',
      'Send invitations and track RSVP status (accepted, declined, tentative).',
    ],
    checklist: [
      'Designed the event data model including recurrence expansion strategy.',
      'Addressed free/busy query optimization for finding common available slots.',
      'Planned timezone storage and display (store in UTC, display in user TZ).',
      'Discussed notification and reminder delivery pipeline.',
    ],
    hints: [
      { level: 1, text: 'Recurring events are tricky: do you store each instance or a rule? Storing a rule (RRULE) is space-efficient but makes queries hard. Consider a hybrid: store the rule plus materialized instances for the next N months.', pointsCost: 5 },
      { level: 2, text: 'For free/busy queries, pre-compute a bitmap or interval list per user per day. When scheduling a meeting with 5 people, AND their free bitmaps to find common free slots. Update the bitmap when events change.', pointsCost: 10 },
      { level: 3, text: 'Store all event times in UTC. Store the timezone of the event separately. For recurring events, expand instances in the event original timezone (to handle DST transitions correctly), then convert to UTC for storage.', pointsCost: 15 },
    ],
    concepts: ['Recurring Events', 'RRULE', 'Timezone Handling', 'Free/Busy Query', 'Interval Scheduling'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 4 -- Expert (45 min) -- batch 3
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-apple-pay',
    title: 'Design Apple Pay',
    difficulty: 4,
    timeMinutes: 45,
    category: 'modern',
    companies: ['Apple', 'Google', 'Stripe', 'Visa'],
    description: 'Design a mobile payment system like Apple Pay. Focus on tokenization, secure element interaction, payment network integration, and the end-to-end transaction flow from tap to settlement.',
    requirements: [
      'Tokenize card credentials so the real card number is never transmitted.',
      'Process contactless payments via NFC with sub-second authorization.',
      'Integrate with payment networks (Visa, Mastercard) for token provisioning and authorization.',
      'Support in-app and web payments in addition to NFC tap-to-pay.',
      'Ensure PCI-DSS compliance with hardware-backed key storage (Secure Element).',
    ],
    checklist: [
      'Designed the tokenization flow: card enrollment, token provisioning, and cryptogram generation.',
      'Addressed the NFC payment transaction flow from tap to network authorization.',
      'Planned the Secure Element interaction for key storage and cryptogram signing.',
      'Discussed fraud prevention, device binding, and biometric authentication.',
    ],
    hints: [
      { level: 1, text: 'The key insight is tokenization: the real card number (PAN) is replaced with a device-specific token (DPAN). Each transaction also generates a one-time cryptogram, so even if the token is intercepted, it cannot be reused.', pointsCost: 5 },
      { level: 2, text: 'The Secure Element (hardware chip) stores the DPAN and private key. On tap, it generates a payment cryptogram signed with the key. The payment network de-tokenizes and verifies the cryptogram before forwarding to the issuing bank.', pointsCost: 10 },
      { level: 3, text: 'Token provisioning involves a Token Service Provider (TSP) run by the card network. During card enrollment: app sends PAN to Apple -> Apple forwards to TSP -> TSP provisions DPAN to the Secure Element. This is called the "green path" (auto-approved) or "yellow path" (additional verification needed).', pointsCost: 15 },
    ],
    concepts: ['Tokenization', 'Secure Element', 'NFC', 'Payment Cryptogram', 'PCI-DSS'],
  },
  {
    id: 'design-search-autocomplete-at-scale',
    title: 'Design a Search Autocomplete at Scale',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Google', 'Amazon', 'Microsoft', 'LinkedIn'],
    description: 'Design a search autocomplete system that serves typeahead suggestions to billions of queries per day. Focus on suggestion ranking, low-latency serving, and real-time trending updates.',
    requirements: [
      'Return ranked autocomplete suggestions within 100ms as the user types.',
      'Rank suggestions by popularity, personalization, and freshness.',
      'Update suggestions with trending queries in near-real-time.',
      'Handle billions of queries per day with global deployment.',
      'Filter inappropriate or sensitive suggestions.',
    ],
    checklist: [
      'Designed the trie or prefix-based data structure for fast prefix lookups.',
      'Addressed ranking within prefix matches (frequency, recency, personalization).',
      'Planned the data pipeline for updating suggestion rankings from query logs.',
      'Discussed content filtering and the serving infrastructure for global low-latency.',
    ],
    hints: [
      { level: 1, text: 'A trie maps prefixes to ranked completions. At each node, store the top-K completions for that prefix. This allows O(prefix_length) lookup with pre-ranked results.', pointsCost: 5 },
      { level: 2, text: 'Build the trie offline from aggregated query logs (MapReduce: count query frequencies, build trie, attach top-K at each node). Serve the trie from memory on edge servers. Update daily or hourly.', pointsCost: 10 },
      { level: 3, text: 'For trending queries, maintain a real-time counting layer (Count-Min Sketch or Redis sorted set) that captures query spikes. Blend trending results with the static trie results at serving time. Use a Zookeeper-style config push to propagate the trending list to edge servers.', pointsCost: 15 },
    ],
    concepts: ['Trie', 'Prefix Search', 'Count-Min Sketch', 'MapReduce', 'Edge Serving'],
  },
  {
    id: 'design-distributed-lock',
    title: 'Design a Distributed Lock',
    difficulty: 4,
    timeMinutes: 45,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'Uber'],
    description: 'Design a distributed locking service like Google Chubby or Apache ZooKeeper. Focus on lock semantics, fault tolerance, fencing tokens, and preventing split-brain scenarios.',
    requirements: [
      'Provide mutual exclusion across distributed processes for a named resource.',
      'Support lock acquisition with timeout and automatic expiry (lease-based).',
      'Issue monotonically increasing fencing tokens to prevent stale lock holders.',
      'Remain available and correct when a minority of lock servers fail.',
      'Support both exclusive locks and shared read locks.',
    ],
    checklist: [
      'Designed the lock acquisition protocol using consensus (Raft/Paxos) or Redlock.',
      'Addressed the fencing token mechanism to prevent split-brain writes.',
      'Planned lease expiry and automatic lock release on client failure.',
      'Discussed the tradeoffs between Redlock, ZooKeeper, and etcd-based approaches.',
    ],
    hints: [
      { level: 1, text: 'A single Redis SETNX can implement a lock, but a single Redis instance is a single point of failure. Redlock uses multiple independent Redis instances: acquire the lock on a majority to tolerate individual failures.', pointsCost: 5 },
      { level: 2, text: 'Fencing tokens solve the problem of a client that holds a lock, pauses (GC), and resumes after the lock expired. Each lock acquisition returns a monotonically increasing token. The protected resource rejects requests with tokens older than the latest it has seen.', pointsCost: 10 },
      { level: 3, text: 'For correctness under network partitions, consensus-based locks (ZooKeeper, etcd) are safer than Redlock. ZooKeeper uses ephemeral sequential nodes: create a node, check if yours is the lowest. If not, watch the next lower node. This gives ordered waiting without thundering herd.', pointsCost: 15 },
    ],
    concepts: ['Distributed Locking', 'Fencing Token', 'Redlock', 'Consensus', 'Lease-Based Expiry'],
  },
  {
    id: 'design-feature-store',
    title: 'Design a Feature Store',
    difficulty: 4,
    timeMinutes: 45,
    category: 'advanced',
    companies: ['Uber', 'Netflix', 'Airbnb', 'Stripe'],
    description: 'Design a feature store for machine learning that manages feature computation, storage, and serving. Focus on bridging the gap between offline training and online serving with consistent feature values.',
    requirements: [
      'Compute features from batch (data warehouse) and streaming (Kafka) sources.',
      'Serve precomputed features for online ML inference with sub-10ms latency.',
      'Ensure training-serving consistency: same feature logic produces same values.',
      'Catalog features with metadata, lineage, and discoverability.',
      'Support point-in-time correct feature retrieval to avoid data leakage in training.',
    ],
    checklist: [
      'Designed the dual compute path: batch features and streaming features.',
      'Addressed online serving with a low-latency key-value store.',
      'Planned the feature registry/catalog for discovery and governance.',
      'Discussed point-in-time correctness and the offline-online consistency guarantee.',
    ],
    hints: [
      { level: 1, text: 'A feature store has two planes: an offline store (for training, needs historical data) and an online store (for serving, needs latest values). Features are computed and pushed to both stores.', pointsCost: 5 },
      { level: 2, text: 'Batch features are computed in Spark/Flink from the data warehouse (daily). Streaming features are computed from Kafka events (real-time). Both write to the online store (Redis/DynamoDB) keyed by entity ID. The offline store is a time-partitioned data lake.', pointsCost: 10 },
      { level: 3, text: 'Point-in-time correctness: when building training data, join features as of the event timestamp, not the latest values. Maintain versioned feature snapshots in the offline store. This prevents future data from leaking into historical training examples.', pointsCost: 15 },
    ],
    concepts: ['Feature Store', 'Online/Offline Consistency', 'Point-in-Time Joins', 'Feature Catalog', 'Streaming Features'],
  },
  {
    id: 'design-multi-region-database',
    title: 'Design a Multi-Region Database',
    difficulty: 4,
    timeMinutes: 45,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'CockroachDB', 'Netflix'],
    description: 'Design a database system that operates across multiple geographic regions with configurable consistency and latency tradeoffs. Focus on replication topology, conflict resolution, and data residency.',
    requirements: [
      'Replicate data across 3+ geographic regions for disaster recovery and low-latency reads.',
      'Support configurable consistency levels: strong (linearizable) and eventual.',
      'Handle region failures with automatic failover and no data loss.',
      'Support data residency requirements (keep EU user data in EU regions).',
      'Minimize cross-region write latency for the common case.',
    ],
    checklist: [
      'Designed the replication topology (leader-follower, multi-leader, or leaderless) across regions.',
      'Addressed write conflict resolution for multi-region writes.',
      'Planned the data placement strategy for residency compliance (geo-partitioning).',
      'Discussed the latency-consistency tradeoff and how users configure it.',
    ],
    hints: [
      { level: 1, text: 'Three approaches: single-leader (simple, high write latency from remote regions), multi-leader (low write latency, conflict resolution needed), leaderless (Dynamo-style quorums). Each has different consistency-latency tradeoffs.', pointsCost: 5 },
      { level: 2, text: 'For data residency, use geo-partitioning: shard data by region and pin each partition to servers in its designated region. EU user rows live on EU servers. Cross-region reads require forwarding.', pointsCost: 10 },
      { level: 3, text: 'CockroachDB approach: use Raft consensus per range. For low-latency reads, place range leases in the region with the most reads (lease preferences). For global tables, use non-voting replicas with stale reads or use a global authority region with read-from-closest.', pointsCost: 15 },
    ],
    concepts: ['Multi-Region Replication', 'Geo-Partitioning', 'Conflict Resolution', 'Data Residency', 'Lease Placement'],
  },

  // ────────────────────────────────────────────────────────────
  // Level 5 -- Master (60 min) -- batch 3
  // ────────────────────────────────────────────────────────────
  {
    id: 'design-gfs',
    title: 'Design a Distributed File System (GFS)',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['Google', 'Amazon', 'Microsoft'],
    description: 'Design the Google File System (GFS): a distributed file system optimized for large sequential reads and appends across a massive cluster. Focus on the master-chunkserver architecture, consistency model, and fault tolerance at datacenter scale.',
    requirements: [
      'Store petabytes of data across thousands of commodity servers.',
      'Split files into large chunks (64MB) with 3-way replication.',
      'Use a single master for metadata with high-availability failover.',
      'Support atomic record appends for concurrent writers.',
      'Detect and recover from chunk server failures, disk corruption, and master failover.',
    ],
    checklist: [
      'Designed the master metadata structure (file namespace, chunk-to-server mapping, chunk version numbers).',
      'Explained the write and append data flow (lease, primary, chain replication).',
      'Addressed master HA (operation log, checkpoints, shadow masters).',
      'Discussed the relaxed consistency model and implications for applications.',
    ],
    hints: [
      { level: 1, text: 'GFS optimizes for large sequential reads and appends, not random writes. The master holds all metadata in memory for fast lookups. Chunks are large (64MB) to amortize metadata overhead and reduce master interactions.', pointsCost: 5 },
      { level: 2, text: 'For writes, the master grants a lease to a primary chunkserver. The client pushes data to all replicas, then sends a write request to the primary. The primary assigns a serial order and forwards to secondaries. All replicas apply in the same order.', pointsCost: 10 },
      { level: 3, text: 'GFS uses a relaxed consistency model: after a record append, data is "defined" only at the offset where the primary placed it. Concurrent appends may have duplicates or padding. Applications use checksums and unique record IDs to handle duplicates. The master is made HA via an operation log replicated to shadow masters.', pointsCost: 15 },
    ],
    concepts: ['Chunk-Based Storage', 'Lease Mechanism', 'Chain Replication', 'Operation Log', 'Relaxed Consistency'],
  },
  {
    id: 'design-stream-processing-engine',
    title: 'Design a Stream Processing Engine',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['LinkedIn', 'Uber', 'Netflix', 'Confluent'],
    description: 'Design a distributed stream processing engine like Apache Flink or Kafka Streams. Focus on exactly-once processing, windowed aggregations, state management, and fault tolerance with checkpointing.',
    requirements: [
      'Process unbounded data streams with low latency (sub-second) and high throughput.',
      'Support windowed aggregations (tumbling, sliding, session windows).',
      'Guarantee exactly-once processing semantics even across failures.',
      'Manage operator state with incremental checkpointing and recovery.',
      'Scale operators independently by adjusting parallelism per stage.',
    ],
    checklist: [
      'Designed the dataflow graph execution model (sources, operators, sinks).',
      'Explained the checkpointing protocol for exactly-once semantics (Chandy-Lamport).',
      'Addressed windowing and watermark-based event-time processing.',
      'Discussed state backend options (RocksDB, in-memory) and state migration on rescale.',
    ],
    hints: [
      { level: 1, text: 'A stream processing job is a directed acyclic graph (DAG) of operators. Data flows through operators which transform, filter, or aggregate. Each operator can be parallelized across multiple tasks.', pointsCost: 5 },
      { level: 2, text: 'Flink uses the Chandy-Lamport algorithm for checkpointing: the coordinator injects barrier markers into the input streams. When an operator receives barriers from all inputs, it snapshots its state. On failure, restore from the latest complete checkpoint and replay from the source offset.', pointsCost: 10 },
      { level: 3, text: 'For event-time processing, use watermarks: a watermark W means no events with timestamp < W will arrive. When W passes a window boundary, the window is triggered. Late events (after the watermark) are handled by allowed lateness or side outputs. Use RocksDB as the state backend for state that exceeds memory.', pointsCost: 15 },
    ],
    concepts: ['Chandy-Lamport Checkpointing', 'Watermarks', 'Windowed Aggregation', 'Exactly-Once Semantics', 'RocksDB State Backend'],
  },
  {
    id: 'design-service-mesh',
    title: 'Design a Service Mesh',
    difficulty: 5,
    timeMinutes: 60,
    category: 'infrastructure',
    companies: ['Google', 'Uber', 'Netflix', 'Lyft'],
    description: 'Design a service mesh like Istio or Linkerd that provides transparent service-to-service communication with observability, security, and traffic management. Focus on the sidecar proxy architecture, control plane, and data plane.',
    requirements: [
      'Intercept all service-to-service traffic transparently via sidecar proxies.',
      'Provide mutual TLS (mTLS) between all services without application code changes.',
      'Implement traffic management: load balancing, circuit breaking, retries, and canary routing.',
      'Collect distributed traces, metrics, and access logs from the data plane.',
      'Manage configuration centrally and push policies to all sidecar proxies.',
    ],
    checklist: [
      'Designed the data plane (sidecar proxy) and control plane (config distribution) architecture.',
      'Addressed mTLS certificate provisioning and rotation at scale.',
      'Planned the traffic management policies (routing rules, fault injection, rate limiting).',
      'Discussed the observability pipeline: distributed tracing, metrics aggregation, and access logs.',
    ],
    hints: [
      { level: 1, text: 'A sidecar proxy (Envoy) runs alongside each service instance. All inbound and outbound traffic passes through the proxy transparently (via iptables rules). The proxy handles mTLS, retries, load balancing, and telemetry without application changes.', pointsCost: 5 },
      { level: 2, text: 'The control plane has three responsibilities: (1) Certificate Authority for mTLS (issue and rotate certs per service identity), (2) Configuration distribution (push routing rules to all proxies via xDS API), (3) Service discovery (provide endpoint lists to proxies).', pointsCost: 10 },
      { level: 3, text: 'For canary routing, the control plane pushes weighted routing rules: 95% traffic to v1, 5% to v2. The sidecar proxy applies these rules on outbound requests. Combine with header-based routing for testing: requests with "x-canary: true" always go to v2. Use circuit breakers (consecutive-5xx threshold) to auto-eject unhealthy endpoints.', pointsCost: 15 },
    ],
    concepts: ['Sidecar Proxy', 'mTLS', 'Control Plane', 'xDS API', 'Circuit Breaker'],
  },

  // ────────────────────────────────────────────────────────────
  // LLD Challenges (injected from lld-challenges.ts)
  // ────────────────────────────────────────────────────────────
  ...LLD_CHALLENGES,
];

/**
 * Look up a challenge by ID.
 */
export function getChallengeById(id: string): ChallengeDefinition | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

/**
 * Filter challenges by difficulty level.
 */
export function getChallengesByDifficulty(difficulty: 1 | 2 | 3 | 4 | 5): ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.difficulty === difficulty);
}

/**
 * Filter challenges by category.
 */
export function getChallengesByCategory(category: ChallengeDefinition['category']): ChallengeDefinition[] {
  return CHALLENGES.filter((c) => c.category === category);
}

/**
 * Filter challenges by company (OR logic -- matches if challenge includes any of the given companies).
 */
export function getChallengesByCompanies(companies: string[]): ChallengeDefinition[] {
  if (companies.length === 0) return CHALLENGES;
  return CHALLENGES.filter((c) => c.companies.some((co) => companies.includes(co)));
}

/**
 * Count how many challenges reference each company.
 */
export function getCompanyCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const ch of CHALLENGES) {
    for (const co of ch.companies) {
      counts[co] = (counts[co] || 0) + 1;
    }
  }
  return counts;
}

// Populate ALL_COMPANIES now that CHALLENGES is defined.
_companies.push(
  ...Array.from(new Set(CHALLENGES.flatMap((c) => c.companies))).sort(),
);
