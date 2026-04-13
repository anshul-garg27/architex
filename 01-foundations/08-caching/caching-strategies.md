# Caching Strategies -- Deep Dive

## Overview

Caching strategies define HOW data flows between the application, cache, and database.
Choosing the wrong strategy is the #1 cause of stale data, inconsistency, and performance
problems. Master all six and know when to combine them.

```
  Strategy Spectrum

  READ-HEAVY                                    WRITE-HEAVY
  <------------------------------------------------------>
  Cache-Aside    Read-Through    Write-Through    Write-Behind
  (most common)  (transparent)   (consistent)     (fastest writes)
```

---

## 1. Cache-Aside (Lazy Loading)

The application is responsible for all cache interactions. The cache is a "side" store --
the app decides when to read from it and when to populate it.

### How It Works

```
  Read Path (Cache Hit):
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> 2. Return value
  +--------+                 +--------+

  Read Path (Cache Miss):
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> 2. MISS
  +--------+                 +--------+
      |
      | 3. Query DB
      v
  +--------+
  |   DB   |  --> 4. Return data
  +--------+
      |
      | 5. App writes data to cache (SET key, value, TTL)
      v
  +--------+
  | Cache  |  --> 6. Future reads served from cache
  +--------+

  Write Path:
  +--------+    1. Write     +--------+
  |  App   | -------------> |   DB   |
  +--------+                +--------+
      |
      | 2. Invalidate/delete cache key
      v
  +--------+
  | Cache  |  --> key removed, next read re-populates
  +--------+
```

### Pros
- Only requested data is cached (memory efficient -- no wasted space)
- Cache failures are non-fatal (app falls back to DB)
- Simple to implement and reason about
- Works with any cache technology (Redis, Memcached, local)

### Cons
- First request always hits DB (cache miss penalty)
- Stale data possible if cache is not invalidated on writes
- Application code is tightly coupled to caching logic (every read/write path must handle it)
- "Thundering herd" risk if popular key expires

### When to Use
- Read-heavy workloads (80%+ reads)
- Data that can tolerate brief staleness
- When you want full control over caching logic
- Microservices where each service owns its cache

### Real-World Example
**Twitter Timeline:** User timeline is loaded into Memcached on first access. Subsequent
reads hit cache. When a user tweets, the relevant cache entries are invalidated. Twitter
serves ~600K requests/second with this pattern.

```python
# Cache-Aside in Python
def get_user(user_id):
    # Step 1: Check cache
    cached = redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # Step 2: Cache miss -- query DB
    user = db.query("SELECT * FROM users WHERE id = %s", user_id)

    # Step 3: Populate cache with TTL
    redis.setex(f"user:{user_id}", 300, json.dumps(user))

    return user

def update_user(user_id, data):
    # Step 1: Write to DB
    db.execute("UPDATE users SET ... WHERE id = %s", user_id)

    # Step 2: Invalidate cache (delete, not update -- safer)
    redis.delete(f"user:{user_id}")
```

---

## 2. Read-Through

The cache sits between the app and the DB. On a miss, the CACHE itself loads data from
the DB -- the application never talks to the DB directly for reads.

### How It Works

```
  Read Path (Cache Hit):
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> 2. Return value (from cache)
  +--------+                 +--------+

  Read Path (Cache Miss):
  +--------+    1. GET key    +--------+    3. Load from DB    +--------+
  |  App   | --------------> | Cache  | --------------------> |   DB   |
  +--------+                 +--------+                       +--------+
                                  |                               |
                                  | <---- 4. Return data ---------|
                                  |
                                  | 5. Cache stores data internally
                                  |
                                  | --> 6. Return data to App
```

### Key Difference from Cache-Aside
- Cache-Aside: **App** fetches from DB on miss, then writes to cache
- Read-Through: **Cache** fetches from DB on miss (transparent to app)

### Pros
- Application code is simpler (no cache management logic)
- Separation of concerns -- caching logic lives in the cache layer
- Consistent read path regardless of hit/miss

### Cons
- Requires a cache library that supports read-through (e.g., Caffeine, Guava, NCache)
- First request still hits DB
- Harder to debug -- cache logic is hidden inside the cache layer
- Less flexibility in how data is loaded

### When to Use
- When using a cache framework that natively supports it (Caffeine, Ehcache)
- When you want to simplify application code
- Microservices with a common caching middleware layer

### Real-World Example
**Hibernate Second-Level Cache:** JPA/Hibernate's L2 cache is read-through. When an entity
is not found in the cache, Hibernate transparently queries the DB and populates the cache.

```java
// Read-Through with Caffeine (Java)
LoadingCache<String, User> cache = Caffeine.newBuilder()
    .maximumSize(10_000)
    .expireAfterWrite(5, TimeUnit.MINUTES)
    .build(key -> database.getUser(key));  // <-- cache loads from DB on miss

// Application code -- no cache management needed
User user = cache.get("user:123");  // hit or miss, same API
```

---

## 3. Write-Through

Every write goes to both the cache AND the database atomically (or as close to it as
possible). The write is not acknowledged until both stores are updated.

### How It Works

```
  Write Path:
  +--------+    1. Write     +--------+    2. Write     +--------+
  |  App   | -------------> | Cache  | -------------->  |   DB   |
  +--------+                +--------+                  +--------+
                                |                           |
                                | <--- 3. DB confirms ------|
                                |
                                | --> 4. Ack to App

  Read Path (always a hit after write):
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> 2. Return value (always fresh)
  +--------+                 +--------+
```

### Pros
- Cache is always consistent with DB (no stale reads after writes)
- Simplifies invalidation -- no need to delete keys on write
- Great for read-after-write consistency requirements

### Cons
- Write latency increases (must write to both cache and DB)
- Every write goes to cache, even for data that may never be read (wastes memory)
- Extra infrastructure complexity
- If DB write fails, must roll back cache (two-phase problem)

### When to Use
- Applications requiring strong read-after-write consistency
- Financial systems, user session data, shopping carts
- Combined with read-through for fully transparent caching

### Real-World Example
**DynamoDB DAX:** Amazon DynamoDB Accelerator uses write-through. Writes go through DAX to
DynamoDB, and DAX caches the result. Subsequent reads from DAX are guaranteed fresh.

```python
# Write-Through pattern
def update_user(user_id, data):
    # Write to cache AND DB (cache layer handles both)
    cache_layer.write("user:" + user_id, data)
    # Internally, cache_layer does:
    #   1. redis.set(key, data)
    #   2. db.update(key, data)
    #   3. Return ack only after both succeed
```

---

## 4. Write-Behind (Write-Back)

Writes go to the cache ONLY. The cache asynchronously flushes dirty entries to the DB
in batches. This decouples write latency from DB write speed.

### How It Works

```
  Write Path:
  +--------+    1. Write     +--------+
  |  App   | -------------> | Cache  |  --> 2. Ack immediately (fast!)
  +--------+                +--------+
                                |
                                | 3. Async batch write (after delay or batch size)
                                v
                            +--------+
                            |   DB   |  <-- written eventually
                            +--------+

  Timing Diagram:
  App Write -----> Cache updated (1ms) -----> Ack to client
                        |
                        |--- 50ms later ---> Batch flush to DB
                        |--- 100ms later --> Another batch
```

### Pros
- Extremely fast write latency (only writes to cache)
- Batching reduces DB write load (coalesce multiple writes to same key)
- Absorbs write spikes without overloading DB
- Can aggregate/merge writes before flushing

### Cons
- **DATA LOSS RISK** -- if cache crashes before flushing, writes are lost
- Eventual consistency between cache and DB
- Complex to implement correctly (need reliable async flush mechanism)
- Debugging is harder (DB state lags behind cache)

### When to Use
- Write-heavy workloads where speed matters more than durability
- Analytics/logging, view counters, like counts
- When DB is the bottleneck for writes
- Acceptable data loss window (e.g., losing last 100ms of writes is OK)

### Real-World Example
**Facebook Like Counters:** Like counts are written to cache (Memcached) and flushed to
MySQL in batches. Losing a few like counts is acceptable. This lets Facebook handle
millions of likes/second without overwhelming the database.

```python
# Write-Behind with a buffer
class WriteBehindCache:
    def __init__(self):
        self.dirty_keys = {}
        self.flush_interval = 0.1  # 100ms

    def write(self, key, value):
        redis.set(key, value)
        self.dirty_keys[key] = value  # mark as dirty
        return True  # ack immediately

    async def flush_loop(self):
        while True:
            await asyncio.sleep(self.flush_interval)
            if self.dirty_keys:
                batch = self.dirty_keys.copy()
                self.dirty_keys.clear()
                db.batch_upsert(batch)  # single batch write
```

---

## 5. Write-Around

Writes go directly to the DB, bypassing the cache entirely. The cache is only populated
on reads (via cache-aside or read-through).

### How It Works

```
  Write Path:
  +--------+    1. Write directly    +--------+
  |  App   | ---------------------> |   DB   |
  +--------+                        +--------+
      |
      | 2. Optionally invalidate cache key
      v
  +--------+
  | Cache  |  --> key deleted (if existed)
  +--------+

  Read Path (cache-aside after write-around):
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> MISS (not cached yet)
  +--------+                 +--------+
      |
      | 2. Load from DB
      v
  +--------+
  |   DB   |  --> 3. Return data
  +--------+
      |
      | 4. Store in cache
      v
  +--------+
  | Cache  |  --> future reads served from cache
  +--------+
```

### Pros
- Cache only contains data that is actually read (memory efficient)
- No risk of filling cache with write-only data
- Simple to implement
- Good when writes vastly outnumber reads for the same key

### Cons
- Read-after-write results in a cache miss (must hit DB)
- Higher read latency for recently written data
- Not suitable when users read immediately after writing

### When to Use
- Write-heavy workloads where most written data is rarely read
- Log ingestion, audit trails, archival data
- Large datasets where caching everything is impractical

### Real-World Example
**Logging Systems:** Application logs are written directly to the database/storage.
Only when an engineer queries recent logs does the result get cached.

---

## 6. Refresh-Ahead (Predictive Refresh)

The cache proactively refreshes entries BEFORE they expire, based on predicted access
patterns. If a key is likely to be accessed again, refresh it before TTL expiration.

### How It Works

```
  Timeline:
  |------- TTL = 60s -------|
  |                          |
  0s                        60s
  |---- Refresh Window ----|
  |    (e.g., after 48s)   |
  |                         |
  0s    48s                60s
         |
         +--> Proactive refresh triggered
              (async DB query, update cache)
              Key never expires for active users

  Flow:
  +--------+    1. GET key    +--------+
  |  App   | --------------> | Cache  |  --> 2. Return value (still valid)
  +--------+                 +--------+
                                  |
                                  | 3. TTL remaining < threshold?
                                  |    YES --> trigger async refresh
                                  v
                             +--------+
                             |   DB   |  --> 4. Fetch fresh data
                             +--------+
                                  |
                                  | 5. Update cache with new data + reset TTL
                                  v
                             +--------+
                             | Cache  |  --> ready for next read (no miss)
                             +--------+
```

### Pros
- Near-zero cache miss rate for hot data
- No latency spike from cache miss on popular keys
- Smooth, predictable performance
- Great for data that is accessed regularly

### Cons
- Complex to implement (need to predict which keys to refresh)
- Wasted refreshes if data is not accessed again before new TTL
- Increases DB read load (refreshing data that might not be needed)
- Requires tracking access patterns

### When to Use
- Hot data that is accessed very frequently and predictably
- When cache miss latency is unacceptable (real-time systems)
- API responses that are polled at regular intervals
- Configuration data that must always be available

### Real-World Example
**Amazon Product Pages:** Product data for trending items is refreshed proactively before
TTL expiry. A product page visited 1000x/minute cannot afford a cache miss. Amazon's
internal caching library (EVCache at Netflix, similar concept) uses refresh-ahead.

```python
# Refresh-Ahead pattern
def get_with_refresh_ahead(key, ttl=60, refresh_threshold=0.8):
    value = redis.get(key)
    remaining_ttl = redis.ttl(key)

    if value is None:
        # Full cache miss -- load from DB
        value = db.get(key)
        redis.setex(key, ttl, value)
        return value

    # Check if within refresh window
    if remaining_ttl < ttl * (1 - refresh_threshold):
        # Async refresh -- don't block the current request
        asyncio.create_task(refresh_cache(key, ttl))

    return value  # return current (still valid) value

async def refresh_cache(key, ttl):
    fresh_value = await db.async_get(key)
    redis.setex(key, ttl, fresh_value)
```

---

## Comparison Table: All 6 Strategies

```
+----------------+------------+-----------+--------+----------+-----------+--------+
|   Criteria     | Cache-     | Read-     | Write- | Write-   | Write-    | Refresh|
|                | Aside      | Through   | Through| Behind   | Around    | Ahead  |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Read Perf      | Fast (hit) | Fast (hit)| Fast   | Fast     | Slow      | Fastest|
|                | Slow (miss)| Slow(miss)| Always | (always  | (miss     | (no    |
|                |            |           | hit    | in cache)| after     | misses)|
|                |            |           |        |          | write)    |        |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Write Perf     | DB speed   | DB speed  | Slow   | Fastest  | DB speed  | N/A    |
|                |            |           | (both) | (cache   |           |        |
|                |            |           |        | only)    |           |        |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Consistency    | Eventual   | Eventual  | Strong | Eventual | Eventual  | Eventual|
+----------------+------------+-----------+--------+----------+-----------+--------+
| Data Loss Risk | None       | None      | None   | HIGH     | None      | None   |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Complexity     | Low        | Medium    | Medium | High     | Low       | High   |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Memory Usage   | Efficient  | Efficient | High   | High     | Efficient | Medium |
|                | (on-demand)| (on-demand)| (all  | (all     | (on-demand)|        |
|                |            |           | writes)| writes)  |           |        |
+----------------+------------+-----------+--------+----------+-----------+--------+
| Best For       | General    | Framework | Strong | Write-   | Write-    | Hot    |
|                | purpose    | based     | consis-| heavy,   | heavy,    | data,  |
|                | read-heavy | apps      | tency  | speed    | rarely    | latency|
|                |            |           |        | critical | read data | critical|
+----------------+------------+-----------+--------+----------+-----------+--------+
```

---

## Decision Guide: Which Strategy for Which Scenario?

```
START
  |
  v
Is it READ-heavy or WRITE-heavy?
  |                    |
  READ                 WRITE
  |                    |
  v                    v
Need transparent    Do reads happen
caching?            after writes?
  |        |          |         |
  YES      NO         YES       NO
  |        |          |         |
  v        v          v         v
Read-    Cache-    Need        Write-
Through  Aside     speed or    Around
                   consistency?
                   |          |
                   SPEED      CONSISTENCY
                   |          |
                   v          v
                 Write-     Write-
                 Behind     Through
  |
  v
Is the data HOT and accessed predictably?
  |          |
  YES        NO
  |          |
  v          v
Refresh-   Use one of
Ahead      the above
(+ another
strategy)
```

### Common Combinations in Production

```
+------------------------------+------------------------------------------+
| Combination                  | Use Case                                 |
+------------------------------+------------------------------------------+
| Cache-Aside + Write-Around   | Most common. Read-heavy apps with        |
|                               | infrequent writes. (Twitter, Reddit)     |
+------------------------------+------------------------------------------+
| Read-Through + Write-Through | Fully transparent caching. App doesn't   |
|                               | know about cache. (DynamoDB DAX)         |
+------------------------------+------------------------------------------+
| Cache-Aside + Refresh-Ahead  | Hot data with low-latency requirements.  |
|                               | (Product pages, leaderboards)            |
+------------------------------+------------------------------------------+
| Write-Behind + Read-Through  | High write throughput with transparent   |
|                               | reads. (Analytics, counters)             |
+------------------------------+------------------------------------------+
| Cache-Aside + Write-Behind   | General purpose with fast writes.        |
|                               | (Social media feeds)                     |
+------------------------------+------------------------------------------+
```

---

## Interview Quick-Reference

**Q: "How would you cache user profiles?"**
A: Cache-Aside. Read-heavy, tolerates brief staleness, invalidate on profile update.

**Q: "How would you cache a real-time leaderboard?"**
A: Redis Sorted Sets + Refresh-Ahead. Must always be fresh, high read rate.

**Q: "How would you handle a write-heavy analytics pipeline?"**
A: Write-Behind. Absorb write spikes, batch flush to DB, accept small data loss window.

**Q: "How would you cache for a financial transaction system?"**
A: Write-Through + Read-Through. Strong consistency required, no stale reads.

**Q: "What strategy would you pick for an audit log system?"**
A: Write-Around. Logs are written frequently but rarely read. No point caching writes.

---

## Summary

```
  Cache-Aside     --> Default choice. You manage everything.
  Read-Through    --> Like Cache-Aside, but cache loads data for you.
  Write-Through   --> Consistent but slow writes.
  Write-Behind    --> Fastest writes, but risk data loss.
  Write-Around    --> Don't cache writes that won't be read.
  Refresh-Ahead   --> Proactive refresh for always-hot data.
```

The best systems combine 2-3 strategies for different data paths. There is no
single "best" strategy -- it depends on your read/write ratio, consistency needs,
and latency budget.
