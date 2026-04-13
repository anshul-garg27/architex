// ─────────────────────────────────────────────────────────────
// Architex — Architecture Gallery (INO-027)
// ─────────────────────────────────────────────────────────────
//
// 15 reference architectures from well-known tech companies.
// Each entry contains a simplified node/edge graph,
// key design decisions, and scale metadata.
//
// Public API:
//   ARCHITECTURES                → full array of 15 entries
//   getArchitecture(name)        → single architecture | undefined
//   getArchitectureNames()       → string[] of all names
//   getArchitecturesByScale(s)   → filtered by scale tier
// ─────────────────────────────────────────────────────────────

// ── Types ───────────────────────────────────────────────────

/** Scale tier of the system. */
export type ScaleTier = 'medium' | 'large' | 'massive';

/** A simplified node in the architecture graph. */
export interface ArchNode {
  /** Unique node id (kebab-case). */
  id: string;
  /** Display label. */
  label: string;
  /** Component category. */
  type:
    | 'client'
    | 'gateway'
    | 'service'
    | 'cache'
    | 'database'
    | 'queue'
    | 'cdn'
    | 'storage'
    | 'search'
    | 'ml'
    | 'streaming'
    | 'load-balancer'
    | 'notification';
}

/** A directed edge in the architecture graph. */
export interface ArchEdge {
  /** Source node id. */
  from: string;
  /** Target node id. */
  to: string;
  /** Label describing what flows over this edge. */
  label: string;
}

/** A key design decision in the architecture. */
export interface KeyDecision {
  /** Short title. */
  title: string;
  /** Explanation of why this decision was made. */
  rationale: string;
}

/** A complete reference architecture. */
export interface ReferenceArchitecture {
  /** Canonical name (e.g. "Netflix"). */
  name: string;
  /** One-paragraph description. */
  description: string;
  /** Simplified architecture graph nodes. */
  nodes: ArchNode[];
  /** Simplified architecture graph edges. */
  edges: ArchEdge[];
  /** Notable design decisions. */
  keyDecisions: KeyDecision[];
  /** Scale tier. */
  scale: ScaleTier;
}

// ── Data ───────────────────────────────────────────────────

export const ARCHITECTURES: readonly ReferenceArchitecture[] = [
  // 1. Netflix
  {
    name: 'Netflix',
    description:
      'Global video streaming platform serving 200M+ subscribers with microservices, edge computing, and chaos engineering.',
    nodes: [
      { id: 'client', label: 'Client Apps', type: 'client' },
      { id: 'cdn', label: 'Open Connect CDN', type: 'cdn' },
      { id: 'api-gw', label: 'Zuul API Gateway', type: 'gateway' },
      { id: 'service-discovery', label: 'Eureka Service Discovery', type: 'service' },
      { id: 'user-svc', label: 'User Service', type: 'service' },
      { id: 'recommendation', label: 'Recommendation Engine', type: 'ml' },
      { id: 'encoding', label: 'Video Encoding Pipeline', type: 'service' },
      { id: 'cassandra', label: 'Cassandra', type: 'database' },
      { id: 'evcache', label: 'EVCache', type: 'cache' },
      { id: 's3', label: 'S3 Object Store', type: 'storage' },
    ],
    edges: [
      { from: 'client', to: 'cdn', label: 'Video streams' },
      { from: 'client', to: 'api-gw', label: 'API requests' },
      { from: 'api-gw', to: 'service-discovery', label: 'Discover services' },
      { from: 'api-gw', to: 'user-svc', label: 'User data' },
      { from: 'api-gw', to: 'recommendation', label: 'Personalisation' },
      { from: 'encoding', to: 's3', label: 'Encoded video' },
      { from: 'cdn', to: 's3', label: 'Cache miss fetch' },
      { from: 'user-svc', to: 'cassandra', label: 'User profiles' },
      { from: 'user-svc', to: 'evcache', label: 'Hot data' },
    ],
    keyDecisions: [
      { title: 'Own CDN (Open Connect)', rationale: 'Reduces latency and cost by placing appliances inside ISP networks.' },
      { title: 'Microservices + Zuul Gateway', rationale: 'Enables independent deployment and dynamic routing of 1000+ services.' },
      { title: 'Chaos Engineering', rationale: 'Chaos Monkey & friends build resilience by testing failure modes continuously.' },
    ],
    scale: 'massive',
  },

  // 2. Uber
  {
    name: 'Uber',
    description:
      'Real-time ride-hailing platform with geospatial dispatch, dynamic pricing, and millions of concurrent trips.',
    nodes: [
      { id: 'rider-app', label: 'Rider App', type: 'client' },
      { id: 'driver-app', label: 'Driver App', type: 'client' },
      { id: 'api-gw', label: 'API Gateway', type: 'gateway' },
      { id: 'dispatch', label: 'Dispatch Service', type: 'service' },
      { id: 'pricing', label: 'Dynamic Pricing', type: 'ml' },
      { id: 'geospatial', label: 'Geospatial Index (H3)', type: 'service' },
      { id: 'trip-svc', label: 'Trip Service', type: 'service' },
      { id: 'kafka', label: 'Kafka', type: 'queue' },
      { id: 'mysql', label: 'MySQL (Schemaless)', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
    ],
    edges: [
      { from: 'rider-app', to: 'api-gw', label: 'Ride requests' },
      { from: 'driver-app', to: 'api-gw', label: 'Location updates' },
      { from: 'api-gw', to: 'dispatch', label: 'Match request' },
      { from: 'dispatch', to: 'geospatial', label: 'Nearby drivers' },
      { from: 'dispatch', to: 'pricing', label: 'Surge price' },
      { from: 'dispatch', to: 'trip-svc', label: 'Create trip' },
      { from: 'trip-svc', to: 'kafka', label: 'Trip events' },
      { from: 'trip-svc', to: 'mysql', label: 'Persist trip' },
      { from: 'geospatial', to: 'redis', label: 'Driver locations' },
    ],
    keyDecisions: [
      { title: 'H3 Hexagonal Grid', rationale: 'Geospatial indexing that handles density variation and enables fast proximity searches.' },
      { title: 'Ringpop Consistent Hashing', rationale: 'Partitions real-time state (driver locations) across a ring of stateful workers.' },
      { title: 'Schemaless on MySQL', rationale: 'Append-only datastore built atop MySQL for flexible schema evolution at scale.' },
    ],
    scale: 'massive',
  },

  // 3. Twitter
  {
    name: 'Twitter',
    description:
      'Social microblogging platform handling 500M+ tweets/day with fan-out, timeline caching, and real-time search.',
    nodes: [
      { id: 'client', label: 'Client Apps', type: 'client' },
      { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
      { id: 'tweet-svc', label: 'Tweet Service', type: 'service' },
      { id: 'fanout', label: 'Fanout Service', type: 'service' },
      { id: 'timeline-cache', label: 'Timeline Cache', type: 'cache' },
      { id: 'search', label: 'Earlybird Search', type: 'search' },
      { id: 'mysql', label: 'MySQL (Tweets)', type: 'database' },
      { id: 'redis', label: 'Redis Timelines', type: 'cache' },
      { id: 'kafka', label: 'Kafka', type: 'queue' },
      { id: 'manhattan', label: 'Manhattan KV', type: 'database' },
    ],
    edges: [
      { from: 'client', to: 'lb', label: 'HTTP requests' },
      { from: 'lb', to: 'tweet-svc', label: 'Post/read tweets' },
      { from: 'tweet-svc', to: 'mysql', label: 'Store tweet' },
      { from: 'tweet-svc', to: 'kafka', label: 'Tweet event' },
      { from: 'kafka', to: 'fanout', label: 'Fan-out trigger' },
      { from: 'fanout', to: 'redis', label: 'Push to follower timelines' },
      { from: 'tweet-svc', to: 'search', label: 'Index tweet' },
      { from: 'client', to: 'timeline-cache', label: 'Read timeline' },
      { from: 'timeline-cache', to: 'manhattan', label: 'Cache miss' },
    ],
    keyDecisions: [
      { title: 'Hybrid Fan-Out', rationale: 'Push for normal users, pull for celebrities to avoid O(followers) writes for accounts with millions.' },
      { title: 'Manhattan Key-Value Store', rationale: 'Multi-tenant, real-time KV store replacing legacy MySQL for low-latency reads.' },
      { title: 'Earlybird Real-Time Search', rationale: 'Custom inverted index updated in near real-time for search on fresh content.' },
    ],
    scale: 'massive',
  },

  // 4. WhatsApp
  {
    name: 'WhatsApp',
    description:
      'End-to-end encrypted messaging for 2B+ users running on a remarkably lean Erlang-based backend.',
    nodes: [
      { id: 'client', label: 'Mobile Client', type: 'client' },
      { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
      { id: 'conn-server', label: 'Erlang Connection Server', type: 'service' },
      { id: 'msg-router', label: 'Message Router', type: 'service' },
      { id: 'offline-store', label: 'Offline Message Store', type: 'database' },
      { id: 'mnesia', label: 'Mnesia (User State)', type: 'database' },
      { id: 'media-store', label: 'Media Storage', type: 'storage' },
      { id: 'cdn', label: 'CDN', type: 'cdn' },
    ],
    edges: [
      { from: 'client', to: 'lb', label: 'Persistent TCP/WS' },
      { from: 'lb', to: 'conn-server', label: 'Session binding' },
      { from: 'conn-server', to: 'msg-router', label: 'Route message' },
      { from: 'msg-router', to: 'conn-server', label: 'Deliver to recipient' },
      { from: 'msg-router', to: 'offline-store', label: 'Store if offline' },
      { from: 'conn-server', to: 'mnesia', label: 'User presence' },
      { from: 'client', to: 'media-store', label: 'Upload media' },
      { from: 'cdn', to: 'media-store', label: 'Serve media' },
    ],
    keyDecisions: [
      { title: 'Erlang/BEAM', rationale: 'Millions of concurrent lightweight processes per server; ideal for persistent connections.' },
      { title: 'End-to-End Encryption', rationale: 'Signal Protocol ensures only sender and receiver can read messages.' },
      { title: 'Minimal Server State', rationale: 'Messages are transient on servers (delivered then deleted), minimising storage needs.' },
    ],
    scale: 'massive',
  },

  // 5. Instagram
  {
    name: 'Instagram',
    description:
      'Photo/video sharing social network scaling Django to 1B+ users with PostgreSQL and extensive caching.',
    nodes: [
      { id: 'client', label: 'Mobile Client', type: 'client' },
      { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
      { id: 'django', label: 'Django Web Servers', type: 'service' },
      { id: 'postgres', label: 'PostgreSQL', type: 'database' },
      { id: 'cassandra', label: 'Cassandra (Feed)', type: 'database' },
      { id: 'memcached', label: 'Memcached', type: 'cache' },
      { id: 'rabbitmq', label: 'RabbitMQ', type: 'queue' },
      { id: 'celery', label: 'Celery Workers', type: 'service' },
      { id: 's3', label: 'S3 Photos', type: 'storage' },
      { id: 'cdn', label: 'CDN', type: 'cdn' },
    ],
    edges: [
      { from: 'client', to: 'cdn', label: 'Photos/videos' },
      { from: 'client', to: 'lb', label: 'API requests' },
      { from: 'lb', to: 'django', label: 'HTTP' },
      { from: 'django', to: 'postgres', label: 'User/media metadata' },
      { from: 'django', to: 'cassandra', label: 'Feed data' },
      { from: 'django', to: 'memcached', label: 'Cache lookups' },
      { from: 'django', to: 'rabbitmq', label: 'Async tasks' },
      { from: 'rabbitmq', to: 'celery', label: 'Process tasks' },
      { from: 'celery', to: 's3', label: 'Store processed images' },
      { from: 'cdn', to: 's3', label: 'Cache miss' },
    ],
    keyDecisions: [
      { title: 'Django at Scale', rationale: 'Kept the monolith manageable with careful profiling and selective service extraction.' },
      { title: 'PostgreSQL Sharding', rationale: 'Horizontal sharding of user data across hundreds of PostgreSQL instances.' },
      { title: 'Feed Ranking ML', rationale: 'ML-based feed ranking replaced chronological ordering to improve engagement.' },
    ],
    scale: 'massive',
  },

  // 6. YouTube
  {
    name: 'YouTube',
    description:
      'Largest video platform processing 500+ hours of upload per minute with adaptive streaming and global CDN.',
    nodes: [
      { id: 'client', label: 'Client (Web/Mobile)', type: 'client' },
      { id: 'cdn', label: 'Google CDN', type: 'cdn' },
      { id: 'api-gw', label: 'API Frontend', type: 'gateway' },
      { id: 'video-svc', label: 'Video Service', type: 'service' },
      { id: 'transcoder', label: 'Transcoding Pipeline', type: 'service' },
      { id: 'recommendation', label: 'Recommendation Engine', type: 'ml' },
      { id: 'bigtable', label: 'Bigtable', type: 'database' },
      { id: 'colossus', label: 'Colossus (GFS)', type: 'storage' },
      { id: 'mysql', label: 'Vitess (MySQL)', type: 'database' },
      { id: 'memcache', label: 'Memcache', type: 'cache' },
    ],
    edges: [
      { from: 'client', to: 'cdn', label: 'Stream video' },
      { from: 'client', to: 'api-gw', label: 'API calls' },
      { from: 'api-gw', to: 'video-svc', label: 'Video metadata' },
      { from: 'api-gw', to: 'recommendation', label: 'Suggestions' },
      { from: 'video-svc', to: 'transcoder', label: 'Transcode job' },
      { from: 'transcoder', to: 'colossus', label: 'Store renditions' },
      { from: 'cdn', to: 'colossus', label: 'Fetch video' },
      { from: 'video-svc', to: 'bigtable', label: 'View counts' },
      { from: 'video-svc', to: 'mysql', label: 'Video metadata' },
      { from: 'video-svc', to: 'memcache', label: 'Hot data' },
    ],
    keyDecisions: [
      { title: 'Vitess Sharding Layer', rationale: 'Horizontal scaling of MySQL through transparent sharding middleware.' },
      { title: 'Adaptive Bitrate Streaming', rationale: 'Multiple renditions per video with client-side ABR for optimal quality per connection.' },
      { title: 'Colossus (GFS v2)', rationale: 'Distributed file system optimised for large sequential reads of video data.' },
    ],
    scale: 'massive',
  },

  // 7. Slack
  {
    name: 'Slack',
    description:
      'Enterprise messaging platform with real-time channels, search, and integrations built on PHP/Hack and WebSockets.',
    nodes: [
      { id: 'client', label: 'Desktop/Web Client', type: 'client' },
      { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
      { id: 'webapp', label: 'PHP/Hack Web App', type: 'service' },
      { id: 'ws-gateway', label: 'WebSocket Gateway', type: 'gateway' },
      { id: 'msg-server', label: 'Message Server', type: 'service' },
      { id: 'search', label: 'Solr Search', type: 'search' },
      { id: 'mysql', label: 'MySQL (Vitess)', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'memcached', label: 'Memcached', type: 'cache' },
      { id: 's3', label: 'S3 File Storage', type: 'storage' },
    ],
    edges: [
      { from: 'client', to: 'lb', label: 'HTTP/WS' },
      { from: 'lb', to: 'webapp', label: 'API requests' },
      { from: 'lb', to: 'ws-gateway', label: 'WebSocket' },
      { from: 'ws-gateway', to: 'msg-server', label: 'Real-time events' },
      { from: 'msg-server', to: 'mysql', label: 'Store messages' },
      { from: 'msg-server', to: 'redis', label: 'Channel state' },
      { from: 'webapp', to: 'memcached', label: 'Cache reads' },
      { from: 'webapp', to: 'search', label: 'Search queries' },
      { from: 'webapp', to: 's3', label: 'File uploads' },
    ],
    keyDecisions: [
      { title: 'WebSocket Gateway', rationale: 'Dedicated WS tier handles millions of persistent connections for real-time messaging.' },
      { title: 'Vitess for MySQL', rationale: 'Transparent sharding layer for MySQL to handle enterprise workspace isolation.' },
      { title: 'Flannel Edge Cache', rationale: 'Edge layer that lazy-loads and caches workspace data to reduce boot time.' },
    ],
    scale: 'large',
  },

  // 8. Dropbox
  {
    name: 'Dropbox',
    description:
      'Cloud file storage and sync for 700M+ users with block-level deduplication and custom infrastructure.',
    nodes: [
      { id: 'client', label: 'Desktop Client', type: 'client' },
      { id: 'api', label: 'API Servers', type: 'service' },
      { id: 'notification', label: 'Notification Service', type: 'notification' },
      { id: 'block-server', label: 'Block Server', type: 'service' },
      { id: 'metadata', label: 'Metadata Store', type: 'database' },
      { id: 'magic-pocket', label: 'Magic Pocket (Storage)', type: 'storage' },
      { id: 's3', label: 'S3 (Overflow)', type: 'storage' },
      { id: 'mysql', label: 'MySQL (EdgeStore)', type: 'database' },
    ],
    edges: [
      { from: 'client', to: 'api', label: 'Sync requests' },
      { from: 'client', to: 'notification', label: 'Long-poll changes' },
      { from: 'api', to: 'block-server', label: 'Upload blocks' },
      { from: 'block-server', to: 'magic-pocket', label: 'Store blocks' },
      { from: 'block-server', to: 's3', label: 'Overflow storage' },
      { from: 'api', to: 'metadata', label: 'File metadata' },
      { from: 'metadata', to: 'mysql', label: 'EdgeStore queries' },
      { from: 'notification', to: 'client', label: 'Change events' },
    ],
    keyDecisions: [
      { title: 'Block-Level Deduplication', rationale: 'Files split into 4MB blocks with content-hash dedup; saves 30%+ storage.' },
      { title: 'Magic Pocket', rationale: 'Custom exabyte-scale storage system replacing S3 for cost and latency control.' },
      { title: 'EdgeStore on MySQL', rationale: 'Custom metadata store atop sharded MySQL that models file system DAGs.' },
    ],
    scale: 'large',
  },

  // 9. Airbnb
  {
    name: 'Airbnb',
    description:
      'Marketplace for lodging with search-driven discovery, dynamic pricing, and trust/safety systems.',
    nodes: [
      { id: 'client', label: 'Web/Mobile Client', type: 'client' },
      { id: 'api-gw', label: 'API Gateway', type: 'gateway' },
      { id: 'search', label: 'Search Service', type: 'search' },
      { id: 'booking', label: 'Booking Service', type: 'service' },
      { id: 'pricing', label: 'Smart Pricing (ML)', type: 'ml' },
      { id: 'trust', label: 'Trust & Safety', type: 'service' },
      { id: 'mysql', label: 'MySQL', type: 'database' },
      { id: 'elastic', label: 'Elasticsearch', type: 'search' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'kafka', label: 'Kafka', type: 'queue' },
    ],
    edges: [
      { from: 'client', to: 'api-gw', label: 'API calls' },
      { from: 'api-gw', to: 'search', label: 'Listing search' },
      { from: 'api-gw', to: 'booking', label: 'Reservations' },
      { from: 'search', to: 'elastic', label: 'Geo + text search' },
      { from: 'search', to: 'pricing', label: 'Price suggestions' },
      { from: 'booking', to: 'mysql', label: 'Booking data' },
      { from: 'booking', to: 'trust', label: 'Fraud check' },
      { from: 'booking', to: 'kafka', label: 'Booking events' },
      { from: 'search', to: 'redis', label: 'Cache results' },
    ],
    keyDecisions: [
      { title: 'Service-Oriented Architecture', rationale: 'Migrated from Rails monolith to SOA for team autonomy and deployability.' },
      { title: 'Smart Pricing ML', rationale: 'ML models suggest optimal nightly prices based on demand, seasonality, and comparables.' },
      { title: 'Elasticsearch for Geo Search', rationale: 'Powers fast location-aware listing search with complex filters.' },
    ],
    scale: 'large',
  },

  // 10. LinkedIn
  {
    name: 'LinkedIn',
    description:
      'Professional social network with real-time feeds, messaging, and large-scale graph processing.',
    nodes: [
      { id: 'client', label: 'Client Apps', type: 'client' },
      { id: 'li-gw', label: 'Rest.li Gateway', type: 'gateway' },
      { id: 'feed-svc', label: 'Feed Service', type: 'service' },
      { id: 'graph', label: 'Social Graph Service', type: 'service' },
      { id: 'messaging', label: 'Messaging Service', type: 'service' },
      { id: 'kafka', label: 'Kafka', type: 'queue' },
      { id: 'espresso', label: 'Espresso (NoSQL)', type: 'database' },
      { id: 'voldemort', label: 'Voldemort KV', type: 'database' },
      { id: 'search', label: 'Galene Search', type: 'search' },
      { id: 'couchbase', label: 'Couchbase Cache', type: 'cache' },
    ],
    edges: [
      { from: 'client', to: 'li-gw', label: 'API requests' },
      { from: 'li-gw', to: 'feed-svc', label: 'Feed queries' },
      { from: 'li-gw', to: 'graph', label: 'Connections' },
      { from: 'li-gw', to: 'messaging', label: 'Messages' },
      { from: 'feed-svc', to: 'kafka', label: 'Feed events' },
      { from: 'graph', to: 'voldemort', label: 'Graph data' },
      { from: 'messaging', to: 'espresso', label: 'Message store' },
      { from: 'feed-svc', to: 'couchbase', label: 'Feed cache' },
      { from: 'li-gw', to: 'search', label: 'People search' },
    ],
    keyDecisions: [
      { title: 'Kafka (Created at LinkedIn)', rationale: 'Invented Kafka for unified event streaming across all services.' },
      { title: 'Rest.li + D2', rationale: 'Custom REST framework with dynamic discovery for thousands of internal services.' },
      { title: 'Espresso Document Store', rationale: 'Custom NoSQL database for online serving of profile and messaging data.' },
    ],
    scale: 'massive',
  },

  // 11. Pinterest
  {
    name: 'Pinterest',
    description:
      'Visual discovery platform with ML-powered recommendations and a massive image processing pipeline.',
    nodes: [
      { id: 'client', label: 'Client Apps', type: 'client' },
      { id: 'api', label: 'API Servers', type: 'service' },
      { id: 'homefeed', label: 'Home Feed Service', type: 'service' },
      { id: 'visual-search', label: 'Visual Search (ML)', type: 'ml' },
      { id: 'mysql', label: 'MySQL', type: 'database' },
      { id: 'hbase', label: 'HBase', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'memcached', label: 'Memcached', type: 'cache' },
      { id: 's3', label: 'S3 Images', type: 'storage' },
      { id: 'cdn', label: 'CDN', type: 'cdn' },
    ],
    edges: [
      { from: 'client', to: 'cdn', label: 'Images' },
      { from: 'client', to: 'api', label: 'API requests' },
      { from: 'api', to: 'homefeed', label: 'Feed generation' },
      { from: 'api', to: 'visual-search', label: 'Image search' },
      { from: 'homefeed', to: 'redis', label: 'Feed cache' },
      { from: 'homefeed', to: 'hbase', label: 'Pin data' },
      { from: 'api', to: 'mysql', label: 'User/board data' },
      { from: 'api', to: 'memcached', label: 'Hot reads' },
      { from: 'cdn', to: 's3', label: 'Image origin' },
    ],
    keyDecisions: [
      { title: 'Sharded MySQL', rationale: 'All data in MySQL sharded by user/board ID for simplicity and strong consistency.' },
      { title: 'Visual Search with Deep Learning', rationale: 'CNN-based embeddings power "more like this" visual search.' },
      { title: 'Kafka + Storm Pipeline', rationale: 'Real-time event processing for notifications, analytics, and ML feature generation.' },
    ],
    scale: 'large',
  },

  // 12. Spotify
  {
    name: 'Spotify',
    description:
      'Music streaming platform with 500M+ users featuring personalised playlists and a microservice backend.',
    nodes: [
      { id: 'client', label: 'Client Apps', type: 'client' },
      { id: 'edge', label: 'Edge Proxy', type: 'gateway' },
      { id: 'playback', label: 'Playback Service', type: 'service' },
      { id: 'discovery', label: 'Discovery (ML)', type: 'ml' },
      { id: 'podcast', label: 'Podcast Service', type: 'service' },
      { id: 'storage', label: 'Audio Storage', type: 'storage' },
      { id: 'cdn', label: 'CDN', type: 'cdn' },
      { id: 'cassandra', label: 'Cassandra', type: 'database' },
      { id: 'bigtable', label: 'Bigtable', type: 'database' },
      { id: 'pubsub', label: 'Google Pub/Sub', type: 'queue' },
    ],
    edges: [
      { from: 'client', to: 'cdn', label: 'Audio stream' },
      { from: 'client', to: 'edge', label: 'API requests' },
      { from: 'edge', to: 'playback', label: 'Track lookup' },
      { from: 'edge', to: 'discovery', label: 'Recommendations' },
      { from: 'edge', to: 'podcast', label: 'Podcast feeds' },
      { from: 'playback', to: 'cassandra', label: 'Playback state' },
      { from: 'discovery', to: 'bigtable', label: 'User taste profiles' },
      { from: 'cdn', to: 'storage', label: 'Fetch audio' },
      { from: 'podcast', to: 'pubsub', label: 'Ingest events' },
    ],
    keyDecisions: [
      { title: 'Discover Weekly ML', rationale: 'Collaborative filtering + NLP on playlists generates personalised weekly playlists.' },
      { title: 'Backstage Developer Portal', rationale: 'Internal developer portal (now open-source) for service catalogue and documentation.' },
      { title: 'Event-Driven Microservices', rationale: '1000+ microservices communicate via events for loose coupling.' },
    ],
    scale: 'massive',
  },

  // 13. Discord
  {
    name: 'Discord',
    description:
      'Real-time voice/text chat platform for gaming communities handling millions of concurrent voice connections.',
    nodes: [
      { id: 'client', label: 'Client (Desktop/Mobile)', type: 'client' },
      { id: 'ws-gateway', label: 'WebSocket Gateway', type: 'gateway' },
      { id: 'guild-svc', label: 'Guild Service', type: 'service' },
      { id: 'voice', label: 'Voice Servers', type: 'service' },
      { id: 'msg-svc', label: 'Message Service', type: 'service' },
      { id: 'cassandra', label: 'Cassandra → ScyllaDB', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'cdn', label: 'CDN', type: 'cdn' },
    ],
    edges: [
      { from: 'client', to: 'ws-gateway', label: 'WebSocket' },
      { from: 'client', to: 'voice', label: 'UDP voice' },
      { from: 'ws-gateway', to: 'guild-svc', label: 'Guild events' },
      { from: 'ws-gateway', to: 'msg-svc', label: 'Text messages' },
      { from: 'msg-svc', to: 'cassandra', label: 'Store messages' },
      { from: 'guild-svc', to: 'redis', label: 'Presence/state' },
      { from: 'client', to: 'cdn', label: 'Attachments' },
    ],
    keyDecisions: [
      { title: 'Elixir for Real-Time', rationale: 'Elixir/Erlang VM handles millions of concurrent WebSocket connections per gateway.' },
      { title: 'Cassandra to ScyllaDB Migration', rationale: 'Replaced Cassandra with ScyllaDB for lower tail latency on message reads.' },
      { title: 'Rust for Performance-Critical Paths', rationale: 'Rewrote read states and other hot paths in Rust for 10x throughput.' },
    ],
    scale: 'large',
  },

  // 14. Stripe
  {
    name: 'Stripe',
    description:
      'Payment infrastructure processing billions of dollars with strong consistency, idempotency, and PCI compliance.',
    nodes: [
      { id: 'merchant', label: 'Merchant App', type: 'client' },
      { id: 'api', label: 'API Layer', type: 'gateway' },
      { id: 'payment-engine', label: 'Payment Engine', type: 'service' },
      { id: 'fraud', label: 'Radar (Fraud ML)', type: 'ml' },
      { id: 'ledger', label: 'Ledger Service', type: 'service' },
      { id: 'webhook', label: 'Webhook Service', type: 'notification' },
      { id: 'postgres', label: 'PostgreSQL', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'kafka', label: 'Kafka', type: 'queue' },
    ],
    edges: [
      { from: 'merchant', to: 'api', label: 'Payment request' },
      { from: 'api', to: 'payment-engine', label: 'Process payment' },
      { from: 'payment-engine', to: 'fraud', label: 'Fraud check' },
      { from: 'payment-engine', to: 'ledger', label: 'Record transaction' },
      { from: 'ledger', to: 'postgres', label: 'Double-entry ledger' },
      { from: 'payment-engine', to: 'kafka', label: 'Payment events' },
      { from: 'kafka', to: 'webhook', label: 'Deliver webhooks' },
      { from: 'api', to: 'redis', label: 'Idempotency keys' },
    ],
    keyDecisions: [
      { title: 'Idempotency Keys', rationale: 'Every mutation is idempotent via unique keys, preventing duplicate charges.' },
      { title: 'Sorbet Type Checker', rationale: 'Gradual typing for Ruby codebase to catch bugs at scale.' },
      { title: 'PCI-Compliant Isolation', rationale: 'Card data lives in a separately-audited, air-gapped environment.' },
    ],
    scale: 'large',
  },

  // 15. GitHub
  {
    name: 'GitHub',
    description:
      'Code hosting and collaboration platform with Git at its core, handling 100M+ repositories.',
    nodes: [
      { id: 'client', label: 'Web/CLI Client', type: 'client' },
      { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
      { id: 'rails', label: 'Rails Monolith', type: 'service' },
      { id: 'git-backend', label: 'Git Backend (Gitaly)', type: 'service' },
      { id: 'actions', label: 'Actions Runner', type: 'service' },
      { id: 'mysql', label: 'MySQL (Vitess)', type: 'database' },
      { id: 'redis', label: 'Redis', type: 'cache' },
      { id: 'memcached', label: 'Memcached', type: 'cache' },
      { id: 'elastic', label: 'Elasticsearch', type: 'search' },
      { id: 'storage', label: 'Git Object Storage', type: 'storage' },
    ],
    edges: [
      { from: 'client', to: 'lb', label: 'HTTP/SSH' },
      { from: 'lb', to: 'rails', label: 'Web requests' },
      { from: 'lb', to: 'git-backend', label: 'Git operations' },
      { from: 'rails', to: 'mysql', label: 'Metadata' },
      { from: 'rails', to: 'redis', label: 'Job queues' },
      { from: 'rails', to: 'memcached', label: 'View cache' },
      { from: 'rails', to: 'elastic', label: 'Code search' },
      { from: 'git-backend', to: 'storage', label: 'Git objects' },
      { from: 'rails', to: 'actions', label: 'Trigger CI' },
    ],
    keyDecisions: [
      { title: 'Modular Monolith', rationale: 'Rails monolith with clear module boundaries rather than premature microservices.' },
      { title: 'Spokes Replication', rationale: 'Custom Git replication system for cross-DC redundancy of repository data.' },
      { title: 'Vitess for MySQL', rationale: 'Transparent sharding layer to scale the relational metadata store.' },
    ],
    scale: 'large',
  },
] as const;

// ── Public Helpers ─────────────────────────────────────────

/**
 * Get a reference architecture by name (case-insensitive).
 */
export function getArchitecture(name: string): ReferenceArchitecture | undefined {
  const normalised = name.toLowerCase().trim();
  return ARCHITECTURES.find((a) => a.name.toLowerCase() === normalised);
}

/**
 * Get an array of all architecture names.
 */
export function getArchitectureNames(): string[] {
  return ARCHITECTURES.map((a) => a.name);
}

/**
 * Filter architectures by their scale tier.
 */
export function getArchitecturesByScale(scale: ScaleTier): ReferenceArchitecture[] {
  return ARCHITECTURES.filter((a) => a.scale === scale);
}
