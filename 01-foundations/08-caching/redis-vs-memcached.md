# Redis vs Memcached -- Complete Comparison

## Overview

Redis and Memcached are the two dominant distributed caching technologies. They solve
the same core problem (fast key-value lookups) but differ significantly in features,
architecture, and use cases.

```
  Redis: "Swiss Army knife" -- rich data structures, persistence, pub/sub
  Memcached: "Scalpel" -- simple, fast, multi-threaded KV cache
```

---

## Feature Comparison Table (25+ Criteria)

```
+------------------------------+---------------------------+---------------------------+
| Criteria                     | Redis                     | Memcached                 |
+------------------------------+---------------------------+---------------------------+
| Data Structures              | Strings, Hashes, Lists,   | Strings only (key->value) |
|                              | Sets, Sorted Sets, Streams|                           |
|                              | HyperLogLog, Bitmaps,     |                           |
|                              | Geospatial, JSON (module) |                           |
+------------------------------+---------------------------+---------------------------+
| Max Key Size                 | 512 MB                    | 250 bytes                 |
+------------------------------+---------------------------+---------------------------+
| Max Value Size               | 512 MB                    | 1 MB (default)            |
|                              |                           | Configurable with slabs   |
+------------------------------+---------------------------+---------------------------+
| Threading Model              | Single-threaded event loop| Multi-threaded             |
|                              | + I/O threads (Redis 6+)  | (scales across CPU cores)  |
+------------------------------+---------------------------+---------------------------+
| Persistence                  | RDB snapshots + AOF log   | None (pure in-memory)     |
|                              | (configurable durability)  |                           |
+------------------------------+---------------------------+---------------------------+
| Replication                  | Master-Replica (async)    | None built-in             |
|                              | Redis Sentinel for HA     | (client-side replication)  |
+------------------------------+---------------------------+---------------------------+
| Clustering                   | Redis Cluster (auto-shard | Client-side sharding only |
|                              | with hash slots)           | (consistent hashing)      |
+------------------------------+---------------------------+---------------------------+
| Pub/Sub                      | Yes (channels + patterns) | None                      |
|                              | + Redis Streams            |                           |
+------------------------------+---------------------------+---------------------------+
| Transactions                 | MULTI/EXEC (optimistic)   | CAS (Compare-And-Swap)    |
+------------------------------+---------------------------+---------------------------+
| Scripting                    | Lua scripting (atomic)    | None                      |
|                              | + Redis Functions (7.0+)   |                           |
+------------------------------+---------------------------+---------------------------+
| TTL Granularity              | Millisecond precision     | Second precision          |
+------------------------------+---------------------------+---------------------------+
| Eviction Policies            | 8 policies (LRU, LFU,    | LRU only                  |
|                              | random, volatile, noevict)|                           |
+------------------------------+---------------------------+---------------------------+
| Memory Efficiency            | Higher overhead per key   | Lower overhead (slab      |
|                              | (pointers, metadata)       | allocator, less metadata) |
+------------------------------+---------------------------+---------------------------+
| Memory Management            | jemalloc, active defrag   | Slab allocator            |
|                              | (Redis 4.0+)              | (fixed-size chunks)       |
+------------------------------+---------------------------+---------------------------+
| Protocol                     | RESP (Redis Serialization | ASCII text protocol       |
|                              | Protocol), binary-safe     | (simple, telnet-friendly) |
+------------------------------+---------------------------+---------------------------+
| Atomic Operations            | INCR, DECR, APPEND,       | INCR, DECR, APPEND,      |
|                              | GETSET, bit ops, etc.     | CAS, PREPEND              |
+------------------------------+---------------------------+---------------------------+
| Sorted/Ranked Data           | Sorted Sets (O(log N))    | Not supported             |
+------------------------------+---------------------------+---------------------------+
| Geospatial                   | GEOADD, GEODIST, etc.     | Not supported             |
+------------------------------+---------------------------+---------------------------+
| Streams / Message Queue      | Redis Streams (5.0+)      | Not supported             |
+------------------------------+---------------------------+---------------------------+
| Client Libraries             | Extensive (every language) | Extensive (every language)|
+------------------------------+---------------------------+---------------------------+
| Typical Latency              | ~0.5-1ms (single op)      | ~0.3-0.8ms (single op)   |
+------------------------------+---------------------------+---------------------------+
| Throughput (single node)     | ~100K-300K ops/s          | ~200K-700K ops/s          |
|                              | (single-threaded command)  | (multi-threaded)          |
+------------------------------+---------------------------+---------------------------+
| Memory Overhead Per Key      | ~80-100 bytes             | ~50-60 bytes              |
+------------------------------+---------------------------+---------------------------+
| SASL Authentication          | ACL system (Redis 6+)     | SASL supported            |
+------------------------------+---------------------------+---------------------------+
| TLS/SSL                      | Yes (Redis 6+)            | Yes (recent versions)     |
+------------------------------+---------------------------+---------------------------+
| Cloud Managed Services       | AWS ElastiCache, Azure    | AWS ElastiCache,          |
|                              | Cache, GCP Memorystore,   | GCP Memorystore           |
|                              | Redis Cloud                |                           |
+------------------------------+---------------------------+---------------------------+
```

---

## Redis Architecture

```
  Single-Threaded Event Loop (Core Commands)

  +------------------------------------------------------+
  |                    Redis Server                        |
  |                                                        |
  |  +------------------+     +----------------------+    |
  |  | Event Loop       |     | I/O Threads (6+)     |    |
  |  | (single-threaded)|     | (Redis 6.0+)         |    |
  |  |                  |     |                       |    |
  |  | - Command exec   |     | - Read client input   |    |
  |  | - Lua scripts    |     | - Write client output  |    |
  |  | - Key expiry     |     | - Network I/O only    |    |
  |  | - Pub/sub        |     | - NO command execution |    |
  |  +------------------+     +----------------------+    |
  |           |                                            |
  |  +------------------+     +----------------------+    |
  |  | Persistence      |     | Memory               |    |
  |  | - RDB (fork+COW) |     | - jemalloc           |    |
  |  | - AOF (append)   |     | - Active defrag      |    |
  |  +------------------+     +----------------------+    |
  +------------------------------------------------------+

  Why single-threaded works:
  - No lock contention (all commands are atomic)
  - Predictable latency (no thread scheduling jitter)
  - 100K+ ops/s is enough for most workloads
  - Bottleneck is usually network, not CPU
  - Scale out with Redis Cluster (multiple nodes)
```

### Redis Cluster Architecture

```
  +--------+    +--------+    +--------+
  | Master |    | Master |    | Master |
  |  M1    |    |  M2    |    |  M3    |
  | 0-5460 |    |5461-   |    |10923-  |
  |        |    | 10922  |    | 16383  |
  +---+----+    +---+----+    +---+----+
      |             |             |
  +---+----+    +---+----+    +---+----+
  | Replica|    | Replica|    | Replica|
  |  R1    |    |  R2    |    |  R3    |
  +--------+    +--------+    +--------+

  - 16384 hash slots distributed across masters
  - Key -> CRC16(key) % 16384 -> slot -> master node
  - Replicas provide failover (automatic with Sentinel)
  - Client-side routing (MOVED/ASK redirects)
```

### Redis Persistence Options

```
  RDB (Snapshotting):
  - Fork child process, write entire dataset to disk
  - Copy-on-write for memory efficiency during fork
  - Compact binary format, fast recovery
  - Data loss: up to last snapshot interval

  AOF (Append-Only File):
  - Log every write operation
  - Three fsync policies: always (safest), everysec (default), no
  - Rewrite/compaction to prevent AOF from growing forever
  - Near-zero data loss (max 1 second with everysec)

  RDB + AOF (Recommended):
  - AOF for durability, RDB for fast restart
  - On restart: load AOF (more complete) or RDB (faster)
```

---

## Memcached Architecture

```
  Multi-Threaded Architecture

  +------------------------------------------------------+
  |                  Memcached Server                      |
  |                                                        |
  |  +------------------+                                  |
  |  | Listener Thread  |  Accepts connections             |
  |  +--------+---------+                                  |
  |           |                                            |
  |  +--------v---------+  +----------+  +----------+     |
  |  | Worker Thread 1  |  | Worker 2 |  | Worker N |     |
  |  | - Read/write     |  |          |  |          |     |
  |  | - Command exec   |  |          |  |          |     |
  |  | - Slab alloc     |  |          |  |          |     |
  |  +------------------+  +----------+  +----------+     |
  |                                                        |
  |  +--------------------------------------------------+ |
  |  | Slab Allocator                                    | |
  |  |                                                    | |
  |  | Slab Class 1: 64-byte chunks   [chunk][chunk]...  | |
  |  | Slab Class 2: 128-byte chunks  [chunk][chunk]...  | |
  |  | Slab Class 3: 256-byte chunks  [chunk][chunk]...  | |
  |  | ...                                                | |
  |  | Slab Class N: 1MB chunks       [chunk]            | |
  |  |                                                    | |
  |  | Item stored in smallest slab class that fits.      | |
  |  | Avoids memory fragmentation.                       | |
  |  +--------------------------------------------------+ |
  +------------------------------------------------------+

  Slab allocation:
  - Memory pre-divided into fixed-size chunk classes
  - Item stored in smallest class that fits
  - Internal fragmentation (wasted space within chunk) but no external fragmentation
  - No malloc/free per item (very fast)
```

### Client-Side Sharding (Consistent Hashing)

```
  Memcached has NO built-in clustering.
  Clients use consistent hashing to distribute keys.

  Hash Ring:
          node1
         /     \
      node4    node2
         \     /
          node3

  key "user:42" --> hash --> lands between node2 and node3
                         --> stored on node3

  Adding/removing a node only remaps ~1/N keys (minimal disruption).
```

---

## When to Use Redis

```
  Choose Redis when you need:

  1. Rich data structures
     - Sorted Sets for leaderboards/rankings
     - Lists for queues, recent items
     - Sets for unique collections, intersections
     - Hashes for object-like storage

  2. Persistence / Durability
     - Data must survive server restart
     - Session store that can't lose data

  3. Pub/Sub or Streams
     - Real-time notifications
     - Event streaming
     - Chat applications

  4. Atomic operations on complex data
     - Lua scripting for multi-step atomic operations
     - ZADD/ZINCRBY for atomic leaderboard updates

  5. Built-in clustering and replication
     - Automatic failover with Sentinel
     - Horizontal scaling with Redis Cluster

  Use Cases: Session store, leaderboard, rate limiter, real-time analytics,
             message broker, geospatial queries, feature flags
```

---

## When to Use Memcached

```
  Choose Memcached when you need:

  1. Simple key-value caching (no fancy data structures)
     - HTML fragment caching
     - Database query result caching
     - API response caching

  2. Maximum throughput on multi-core machines
     - Multi-threaded: saturates all CPU cores
     - Higher ops/sec per server than Redis for simple GET/SET

  3. Large object caching
     - Slab allocator is efficient for uniform-size objects
     - Less memory overhead per key

  4. Predictable, simple behavior
     - No persistence to worry about
     - No replication complexity
     - Pure cache (if it goes down, nothing is lost except cached data)

  5. Horizontal scaling with consistent hashing
     - Add more Memcached nodes, client handles distribution
     - Each node is independent (no cluster protocol overhead)

  Use Cases: Database query cache, page/fragment cache, session cache (ephemeral),
             CDN origin cache, large binary object cache
```

---

## Real-World Usage

### Twitter: Twemcache (Modified Memcached)
- Custom fork of Memcached called Twemcache
- Twemproxy (nutcracker) for sharding and connection pooling
- Caches user timelines, tweet data, social graph
- Hundreds of Memcached nodes, terabytes of cached data
- Chose Memcached for simplicity and multi-threaded performance

### Facebook: Memcache at Scale (NSDI 2013 Paper)
- Largest Memcached deployment in the world
- Thousands of Memcached servers, hundreds of TB
- Custom features: UDP for GET (reduced connection overhead), lease mechanism
- "Look-aside cache" pattern (cache-aside)
- mcrouter: proxy for connection pooling and routing
- Regional pools + cross-datacenter replication

### Uber: Redis
- Redis for geospatial queries (driver locations)
- GEOADD/GEORADIUS for finding nearby drivers
- Sorted Sets for surge pricing calculations
- Redis Cluster for horizontal scaling
- Chose Redis for rich data structures

### Netflix: EVCache (Memcached-based)
- Custom Memcached wrapper (EVCache)
- Cross-region replication for global availability
- Caches subscriber data, personalization, video metadata
- Millions of ops/second, multi-region

### Instagram: Redis + Memcached
- Redis for counters (likes, followers) using INCR
- Memcached for larger cached objects (feed data)
- Chose each tool for its strengths

---

## Interview Questions with Answers

**Q1: "Why is Redis single-threaded? Doesn't that limit performance?"**
A: Redis command execution is single-threaded to avoid lock contention. This makes every
operation atomic without the overhead of mutexes. For most workloads, the bottleneck is
network I/O, not CPU. Redis 6+ added I/O threads for reading/writing socket data, keeping
command execution single-threaded. A single Redis instance handles 100K+ ops/s. For more
throughput, use Redis Cluster to shard across multiple nodes.

**Q2: "You need to build a leaderboard. Redis or Memcached?"**
A: Redis. Sorted Sets (ZADD, ZRANK, ZRANGE) provide O(log N) ranking operations natively.
Memcached has no sorted data structure -- you would need to serialize, deserialize, sort
in the application, and write back, which is slow and not atomic.

**Q3: "Your cache data must survive a restart. Which do you choose?"**
A: Redis with AOF persistence (everysec fsync). Memcached is purely in-memory with no
persistence. If the Memcached server restarts, all data is lost and must be re-populated
from the database (cold cache).

**Q4: "You have 64-core machines. Which cache gives better throughput?"**
A: Memcached. It is multi-threaded and will use all 64 cores. Redis command execution
uses 1 core (I/O threads help but don't execute commands). To fully use 64 cores with
Redis, you would need to run ~64 Redis instances or use Redis Cluster with many shards.

**Q5: "How does consistent hashing work in Memcached?"**
A: Each Memcached node is placed on a hash ring at one or more virtual node positions.
A key is hashed and walks clockwise on the ring to find its node. When a node is added
or removed, only keys between the new/removed node and its predecessor are remapped --
approximately 1/N of total keys. This minimizes cache misses during scaling.

**Q6: "Can you use Memcached as a message queue?"**
A: No. Memcached only supports GET/SET/DELETE. Redis supports Pub/Sub and Streams, which
can function as lightweight message queues. For serious queueing, use Kafka or RabbitMQ.

---

## Decision Cheat Sheet

```
+--------------------------------------------------+
|       CHOOSE REDIS WHEN...                       |
+--------------------------------------------------+
| Need data structures (sorted sets, lists, hashes)|
| Need persistence (data survives restart)         |
| Need pub/sub or streams                          |
| Need Lua scripting for atomic multi-step ops     |
| Need built-in replication and clustering         |
| Need TTL with millisecond precision              |
| Building: leaderboards, rate limiters, sessions, |
|           geospatial, real-time analytics         |
+--------------------------------------------------+

+--------------------------------------------------+
|       CHOOSE MEMCACHED WHEN...                   |
+--------------------------------------------------+
| Simple key-value cache (no complex data types)   |
| Need multi-threaded performance (many CPU cores) |
| Want simplicity (no persistence, no replication) |
| Caching large objects (slab allocator efficient)  |
| Want lowest possible per-key memory overhead     |
| Building: query cache, page cache, fragment cache|
| Already have infrastructure (Facebook pattern)    |
+--------------------------------------------------+

+--------------------------------------------------+
|       DEFAULT RECOMMENDATION                     |
+--------------------------------------------------+
| Start with Redis. It does everything Memcached   |
| does and more. Only switch to Memcached if you   |
| specifically need multi-threaded throughput on    |
| beefy machines or are caching simple large blobs.|
|                                                  |
| 90%+ of new projects choose Redis.               |
+--------------------------------------------------+
```
