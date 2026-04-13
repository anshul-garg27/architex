# Caching Layers -- The Full Request Journey

## Overview

A single HTTP request can pass through 6+ caching layers before reaching the database.
Each layer trades latency for freshness. Understanding every layer lets you design
systems that serve requests in microseconds instead of milliseconds.

```
 Full Caching Hierarchy (Latency Estimates)

 +--------------------------------------------------------------------+
 |                        CLIENT SIDE                                  |
 |                                                                     |
 |  +------------------+                                               |
 |  | Browser Cache    | ~0ms (instant, local disk/memory)             |
 |  | (HTTP Cache)     |                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 +-----------|--------------------------------------------------------+
             v
 +--------------------------------------------------------------------+
 |                        EDGE / CDN                                   |
 |                                                                     |
 |  +------------------+                                               |
 |  | CDN Cache        | ~5-30ms (edge PoP, geographically close)     |
 |  | (Cloudflare,     |                                               |
 |  |  CloudFront)     |                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 +-----------|--------------------------------------------------------+
             v
 +--------------------------------------------------------------------+
 |                        SERVER SIDE                                  |
 |                                                                     |
 |  +------------------+                                               |
 |  | API Gateway      | ~1-5ms (in-memory at gateway)                |
 |  | Cache            |                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 |           v                                                         |
 |  +------------------+                                               |
 |  | Application      | ~0.01-0.1ms (in-process, same JVM/process)   |
 |  | Cache (Local)    |                                               |
 |  | (Caffeine/Guava) |                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 |           v                                                         |
 |  +------------------+                                               |
 |  | Distributed      | ~0.5-2ms (network hop to Redis/Memcached)    |
 |  | Cache            |                                               |
 |  | (Redis/Memcached)|                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 |           v                                                         |
 |  +------------------+                                               |
 |  | Database Cache   | ~0.1-1ms (buffer pool, query cache)          |
 |  | (Buffer Pool,    |                                               |
 |  |  Query Cache)    |                                               |
 |  +--------+---------+                                               |
 |           | MISS                                                    |
 |           v                                                         |
 |  +------------------+                                               |
 |  | Database Disk    | ~5-20ms (SSD) or ~10-100ms (HDD)             |
 |  +------------------+                                               |
 +--------------------------------------------------------------------+
```

---

## Layer 0: CPU Caches (Hardware Context)

Not directly controllable by application code, but critical for understanding latency.

```
  CPU Core
  +-------------------+
  | Registers         |  ~0.3ns   (1 cycle)
  |                   |
  | L1 Cache (64KB)   |  ~1ns     (3-4 cycles)     -- per core
  |  - L1d (data)     |
  |  - L1i (instruct) |
  |                   |
  | L2 Cache (256KB)  |  ~3-4ns   (10-12 cycles)   -- per core
  +-------------------+
           |
  +-------------------+
  | L3 Cache (8-32MB) |  ~10-12ns (30-40 cycles)   -- shared across cores
  +-------------------+
           |
  +-------------------+
  | Main Memory (RAM) |  ~50-100ns (150-300 cycles)
  +-------------------+
           |
  +-------------------+
  | SSD               |  ~50,000-100,000ns (50-100us)
  +-------------------+
           |
  +-------------------+
  | HDD               |  ~5,000,000-10,000,000ns (5-10ms)
  +-------------------+
```

### Why This Matters for System Design
- L1 cache miss: ~1ns penalty. Irrelevant at system level.
- RAM vs SSD: 1000x difference. This is why database buffer pools exist.
- Network round-trip (~500us-2ms) is 10-100x slower than local RAM access.
- This is why local (in-process) caches are so valuable.

---

## Layer 1: Browser Cache

The closest cache to the user. Controlled entirely via HTTP headers.

### How It Works

```
  First Request:
  Browser ----GET /api/data----> Server
  Browser <---200 OK----------  Server
               |
               +-- Cache-Control: max-age=300
               +-- ETag: "abc123"
               +-- Last-Modified: Mon, 01 Jan 2026

  Second Request (within 300s):
  Browser ----(no request)----> Server    <-- NEVER HITS SERVER
  Browser <--- from disk cache              (served from local cache)

  After 300s (stale):
  Browser ----GET /api/data----> Server
               |
               +-- If-None-Match: "abc123"
  Browser <---304 Not Modified-- Server   <-- NO BODY (saves bandwidth)
               |
               +-- (browser uses cached copy)
```

### Key HTTP Cache Headers

```
  +-------------------------+-------------------------------------------------+
  | Header                  | Purpose                                         |
  +-------------------------+-------------------------------------------------+
  | Cache-Control: max-age  | How long (seconds) the response is fresh        |
  | Cache-Control: no-cache | Always revalidate with server (can still cache) |
  | Cache-Control: no-store | Do NOT cache at all (sensitive data)            |
  | Cache-Control: private  | Only browser can cache (not CDN/proxy)          |
  | Cache-Control: public   | CDN/proxy can cache too                         |
  | Cache-Control: s-maxage | TTL specifically for shared caches (CDN)        |
  | ETag                    | Version hash for conditional requests           |
  | Last-Modified           | Timestamp for conditional requests              |
  | Vary                    | Cache key includes these request headers        |
  +-------------------------+-------------------------------------------------+
```

### Typical TTLs
- Static assets (JS, CSS, images): `max-age=31536000` (1 year) + content hash in URL
- API responses: `max-age=0, s-maxage=60` (CDN caches 60s, browser always revalidates)
- User-specific data: `Cache-Control: private, max-age=300`
- Sensitive data (banking): `Cache-Control: no-store`

### Technologies
- Built into every browser (Chrome, Firefox, Safari)
- Service Workers (programmatic cache control)
- localStorage / IndexedDB (application-managed)

---

## Layer 2: CDN Cache (Content Delivery Network)

Edge servers distributed globally cache content close to users.

### How It Works

```
  User in Tokyo          CDN PoP in Tokyo        Origin in US-East
  +--------+    5ms     +--------+    150ms     +--------+
  | Client | ---------> | CDN    | -----------> | Origin |
  +--------+            | Edge   |              | Server |
                        +--------+              +--------+

  Cache HIT:  Client --> CDN Edge (5ms)  --> Response (no origin contact)
  Cache MISS: Client --> CDN Edge (5ms)  --> Origin (150ms) --> Cache + Respond
```

### Cache Key Construction

```
  Default cache key: scheme + host + path + query string
  Example: https://api.example.com/users?page=1

  +-- Vary: Accept-Encoding, Accept-Language
  |   Cache key now includes: encoding + language
  |   Same URL, different cache entries for gzip vs brotli

  Custom cache keys (Cloudflare, Fastly):
  +-- Can include: cookies, headers, device type, country
  +-- Example: cache different HTML for mobile vs desktop
```

### Cache Busting

```
  Problem: CDN cached old version of script.js for 1 year
  Solution: Content-addressed URLs

  /assets/script.abc123.js   <-- hash in filename
  /assets/script.def456.js   <-- new deploy = new hash = new URL = no stale cache

  Webpack, Vite, etc. do this automatically.
```

### Typical TTLs
- Static assets: 1 year (with content hash)
- HTML pages: 60-300 seconds
- API responses: 1-60 seconds (varies by endpoint)

### Technologies
- Cloudflare, AWS CloudFront, Fastly, Akamai
- Vercel Edge Network, Netlify Edge
- Varnish (self-hosted reverse proxy cache)

---

## Layer 3: API Gateway Cache

The API gateway can cache responses to avoid hitting backend services entirely.

```
  +--------+       +----------+       +-----------+
  | Client | ----> | API      | ----> | Backend   |
  +--------+       | Gateway  |       | Service   |
                   +----------+       +-----------+
                        |
                   +----------+
                   | Gateway  |
                   | Cache    |
                   | (in-mem) |
                   +----------+

  GET /api/products?category=electronics
    --> Gateway checks cache
    --> HIT: return cached response (1-5ms)
    --> MISS: forward to backend, cache response, return
```

### What Gets Cached
- GET requests only (typically)
- Responses keyed by: URL + query params + selected headers
- Short TTLs (5-60 seconds) for API responses

### Technologies
- AWS API Gateway (built-in caching with configurable TTL)
- Kong (proxy-cache plugin)
- NGINX (proxy_cache directive)
- Envoy (HTTP cache filter)

---

## Layer 4: Application Cache (In-Process / Local)

Cache that lives inside the application process. No network hop. Fastest server-side
cache, but scoped to a single instance.

```
  +-----------------------------------------------+
  |            Application Process (JVM)           |
  |                                                |
  |  +------------------+    +------------------+  |
  |  | Application Code | -> | In-Process Cache |  |
  |  |                  | <- | (Caffeine/Guava) |  |
  |  +------------------+    +------------------+  |
  |                               |                |
  |                          HashMap in heap       |
  |                          ~10-100 nanoseconds   |
  |                          per-instance, not     |
  |                          shared                |
  +-----------------------------------------------+

  Instance A              Instance B
  +----------+            +----------+
  | Cache:   |            | Cache:   |
  | user:1=A |            | user:1=? |  <-- MISS (each instance
  | user:2=B |            | user:3=C |      has its own cache)
  +----------+            +----------+
```

### Characteristics
- **Latency:** ~10-100ns (memory access, no serialization, no network)
- **Scope:** Per-instance only. Not shared across instances.
- **Capacity:** Limited by JVM heap / process memory (typically 100MB-1GB)
- **Consistency:** Each instance may have different cached data
- **Eviction:** LRU, LFU, or W-TinyLFU

### Technologies

```
  +-------------+----------+------------------+---------------------------+
  | Technology  | Language | Eviction Policy  | Notes                     |
  +-------------+----------+------------------+---------------------------+
  | Caffeine    | Java     | W-TinyLFU        | Best Java cache. Near     |
  |             |          |                  | optimal hit ratio.        |
  +-------------+----------+------------------+---------------------------+
  | Guava Cache | Java     | LRU (size/time)  | Predecessor to Caffeine.  |
  |             |          |                  | Still widely used.        |
  +-------------+----------+------------------+---------------------------+
  | Ehcache     | Java     | LRU/LFU/FIFO    | Supports overflow to disk.|
  +-------------+----------+------------------+---------------------------+
  | node-cache  | Node.js  | TTL-based        | Simple in-process cache.  |
  +-------------+----------+------------------+---------------------------+
  | lru-cache   | Node.js  | LRU              | Popular npm package.      |
  +-------------+----------+------------------+---------------------------+
  | cachetools  | Python   | LRU/LFU/TTL      | Standard Python caching.  |
  +-------------+----------+------------------+---------------------------+
```

### Common Pattern: Two-Tier Cache (Local + Distributed)

```
  def get_user(user_id):
      # Tier 1: Local cache (nanoseconds)
      user = local_cache.get(user_id)
      if user:
          return user

      # Tier 2: Distributed cache (milliseconds)
      user = redis.get(f"user:{user_id}")
      if user:
          local_cache.set(user_id, user, ttl=30)  # shorter TTL locally
          return json.loads(user)

      # Tier 3: Database (many milliseconds)
      user = db.get_user(user_id)
      redis.setex(f"user:{user_id}", 300, json.dumps(user))
      local_cache.set(user_id, user, ttl=30)
      return user
```

---

## Layer 5: Distributed Cache

Shared cache accessible by all application instances. The workhorse of most systems.

```
  +----------+     +----------+     +----------+
  | App      |     | App      |     | App      |
  | Instance |     | Instance |     | Instance |
  | A        |     | B        |     | C        |
  +----+-----+     +----+-----+     +----+-----+
       |                |                |
       +--------+-------+--------+-------+
                |                |
           +----+-----+    +----+-----+
           |  Redis   |    |  Redis   |
           |  Shard 1 |    |  Shard 2 |
           |  (a-m)   |    |  (n-z)   |
           +----------+    +----------+

  - All instances see same data (shared state)
  - Network hop required (~0.5-2ms per operation)
  - Supports millions of keys (limited by memory across cluster)
  - Handles 100K-500K ops/second per node
```

### Characteristics
- **Latency:** ~0.5-2ms (network RTT + serialization)
- **Scope:** Shared across all instances (global view)
- **Capacity:** 10GB-1TB+ (across cluster)
- **Consistency:** Single source of truth (within cache)
- **Serialization:** Data must be serialized (JSON, MessagePack, Protobuf)

### Technologies
- **Redis:** Data structures, persistence, pub/sub, Lua scripting (see redis-vs-memcached.md)
- **Memcached:** Simple key-value, multi-threaded, slab allocator
- **Hazelcast:** Java-native distributed cache, embedded mode
- **Apache Ignite:** Distributed cache + compute grid

### Typical TTLs
- User sessions: 30 minutes
- API response cache: 60-300 seconds
- Feature flags: 30-60 seconds
- Rate limit counters: 1-60 seconds

---

## Layer 6: Database Cache

The database itself has multiple caching layers before touching disk.

```
  +---------------------------------------------------+
  |                    Database                         |
  |                                                     |
  |  +-------------------------------------------+     |
  |  | Query Cache (deprecated in MySQL 8.0)     |     |
  |  | Caches exact query text -> result set      |     |
  |  | Invalidated on ANY write to involved tables|     |
  |  +-------------------------------------------+     |
  |                     |                               |
  |                     v                               |
  |  +-------------------------------------------+     |
  |  | Buffer Pool / Shared Buffers               |     |
  |  | (InnoDB Buffer Pool / PostgreSQL cache)    |     |
  |  |                                             |     |
  |  | Caches data pages (16KB blocks) in RAM     |     |
  |  | LRU-based eviction                         |     |
  |  | Typically 50-80% of available RAM           |     |
  |  | HIT: ~0.1ms  MISS: ~5-20ms (disk I/O)     |     |
  |  +-------------------------------------------+     |
  |                     |                               |
  |                     v                               |
  |  +-------------------------------------------+     |
  |  | OS Page Cache (filesystem cache)           |     |
  |  | Kernel caches recently read disk pages     |     |
  |  +-------------------------------------------+     |
  |                     |                               |
  |                     v                               |
  |  +-------------------------------------------+     |
  |  | Disk (SSD or HDD)                          |     |
  |  +-------------------------------------------+     |
  +---------------------------------------------------+
```

### Key Components

**Buffer Pool (InnoDB / PostgreSQL Shared Buffers)**
- Caches data pages and index pages in RAM
- MySQL InnoDB: `innodb_buffer_pool_size` (set to 70-80% of RAM)
- PostgreSQL: `shared_buffers` (set to 25% of RAM, OS cache handles rest)
- Most important database tuning parameter

**Query Cache (Largely Deprecated)**
- MySQL 5.x had query cache -- exact query text mapped to result
- Invalidated on ANY write to the table (too aggressive)
- Caused more contention than benefit at scale
- Removed in MySQL 8.0
- PostgreSQL never had a query cache (relies on buffer pool + OS cache)

**Prepared Statement Cache**
- Caches parsed/compiled query plans
- Avoids re-parsing SQL on every execution
- PostgreSQL: `prepared_statements`, connection-level
- MySQL: server-side prepared statements

---

## Complete Latency Reference

```
  +----------------------------+------------------+---------------------+
  | Cache Layer                | Typical Latency  | Hit Ratio Target    |
  +----------------------------+------------------+---------------------+
  | L1 CPU Cache               | ~1ns             | 95-99%              |
  | L2 CPU Cache               | ~3-4ns           | 80-95%              |
  | L3 CPU Cache               | ~10-12ns         | 70-90%              |
  | RAM                        | ~50-100ns        | --                  |
  | Browser Cache              | ~0ms             | 80-95% (static)     |
  | CDN Edge Cache             | ~5-30ms          | 85-98% (static)     |
  | API Gateway Cache          | ~1-5ms           | 50-80%              |
  | In-Process Cache           | ~0.01-0.1ms      | 70-95%              |
  | Distributed Cache (Redis)  | ~0.5-2ms         | 85-99%              |
  | DB Buffer Pool (hit)       | ~0.1ms           | 95-99%              |
  | SSD Read                   | ~0.05-0.1ms      | --                  |
  | HDD Read                   | ~5-10ms          | --                  |
  | Cross-region Network       | ~50-150ms        | --                  |
  +----------------------------+------------------+---------------------+
```

---

## Design Principles for Multi-Layer Caching

### 1. TTL Should Decrease as You Move Closer to the User

```
  Browser:  300s   (5 min)   -- longest, user sees stale briefly
  CDN:      60s    (1 min)   -- medium, shared across users
  Gateway:  30s              -- shorter
  Local:    10s              -- shortest, revalidates quickly
  Redis:    300s             -- source of truth for cache layer
```

### 2. Cache Closer to the Source for Writes, Closer to User for Reads

```
  READS:  Serve from the closest (fastest) cache that has fresh data
  WRITES: Invalidate starting from the source (DB) outward
```

### 3. The Cache Stampede Risk Increases at Each Layer

```
  100 users request same uncached resource simultaneously:
  - CDN: 100 requests -> 1 origin request (CDN coalesces)
  - App: 1 request per instance -> N instances hit Redis
  - Redis: 1 miss -> 1 DB query (with locking)
```

---

## Interview Quick-Reference

**Q: "Walk me through what happens when a user loads a product page."**
A: Browser checks local HTTP cache (Cache-Control). If stale, request goes to CDN edge.
   CDN checks its cache. On miss, request goes to origin. API gateway may have a cached
   response. Application checks local in-process cache (Caffeine), then distributed cache
   (Redis). On miss, database query hits buffer pool. If data page is not in buffer pool,
   disk I/O occurs. Response flows back, populating each layer.

**Q: "Why use an in-process cache AND a distributed cache?"**
A: Speed. In-process cache avoids network hop (~100ns vs ~1ms). Distributed cache
   provides consistency across instances. Use local cache with short TTL (10-30s) as L1,
   distributed cache with longer TTL (5-10min) as L2.

**Q: "What should you cache at the CDN vs application layer?"**
A: CDN: static assets (JS, CSS, images, fonts), public HTML pages, public API responses.
   Application: user-specific data, personalized content, session data, database query
   results.
