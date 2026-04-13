# Cache Challenges -- Problems, Diagrams, and Solutions

## Overview

Caching is deceptively simple until something goes wrong. These six challenges are
the reason "cache invalidation" is one of the two hard problems in computer science
(the other being naming things and off-by-one errors).

```
  The 6 Cache Challenges:

  1. Cache Invalidation    -- stale data in cache
  2. Cache Stampede        -- thundering herd on miss
  3. Cache Penetration     -- queries for non-existent data
  4. Cache Avalanche       -- mass expiration at same time
  5. Hot Key Problem       -- one key gets all the traffic
  6. Cache Consistency     -- cache and DB disagree
```

---

## 1. Cache Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming
> things." -- Phil Karlton

The fundamental question: when data changes in the database, how do you ensure the
cache reflects that change?

### The Problem

```
  T=0: User A reads user profile. Cached in Redis.
  +--------+    GET user:42    +--------+    query    +--------+
  | User A | ----------------> | Redis  | ---------> |   DB   |
  +--------+                   +--------+            +--------+
                                  |                       |
                                  | <-- "name: Alice" ----|
                                  | cache: user:42 = "Alice"

  T=5: User A updates name to "Bob" (writes to DB only)
  +--------+    UPDATE name    +--------+
  | User A | ----------------> |   DB   |  name = "Bob"
  +--------+                   +--------+

  T=6: User B reads user:42 from Redis
  +--------+    GET user:42    +--------+
  | User B | ----------------> | Redis  |  --> Returns "Alice" (STALE!)
  +--------+                   +--------+
                                              DB has "Bob" but cache has "Alice"
```

### Solution 1: TTL-Based Invalidation

```
  SET user:42 "Alice" EX 300    (expires in 5 minutes)

  Timeline:
  |---- 300 seconds ----|
  0s                   300s
  |    STALE WINDOW    |
  Data could be stale  Cache expires
  for up to 300s       Next read loads fresh data
```

**Pros:** Simple, automatic, no extra infrastructure
**Cons:** Data can be stale for up to TTL duration
**When to use:** Data where brief staleness is acceptable (product listings, blog posts)

### Solution 2: Event-Based Invalidation (Pub/Sub)

```
  +--------+   1. Update DB   +--------+
  | App    | ---------------> |   DB   |
  +--------+                  +--------+
      |
      | 2. Publish event
      v
  +----------+    3. Event delivered    +--------+
  | Message  | -----------------------> | Cache  |
  | Bus      |    "user:42 changed"     | Service|
  | (Kafka / |                          +--------+
  |  Redis   |                              |
  |  Pub/Sub)|                    4. DELETE user:42 from Redis
  +----------+
```

**Pros:** Near real-time invalidation (milliseconds), decoupled
**Cons:** Added infrastructure complexity, at-least-once delivery (may double-invalidate)
**When to use:** Systems requiring near-real-time freshness (social feeds, inventory)

### Solution 3: Version-Based Invalidation

```
  Cache key includes a version number:
    user:42:v7 = "Alice"

  On update:
    1. Increment version in DB: version = 8
    2. New reads use key user:42:v8 (cache miss, loads fresh)
    3. Old key user:42:v7 expires naturally via TTL

  No explicit invalidation needed -- stale keys just expire.
```

**Pros:** No race conditions, immutable cache entries, CDN-friendly
**Cons:** Old versions waste memory until TTL expires, must track version somewhere
**When to use:** CDN caching, API versioning, content that changes infrequently

### Comparison

```
  +--------------+-----------+----------+-----------+------------------+
  | Approach     | Staleness | Complexity| Infra    | Best For         |
  +--------------+-----------+----------+-----------+------------------+
  | TTL-based    | Up to TTL | Low      | None     | General purpose  |
  | Event-based  | Seconds   | High     | Msg bus  | Real-time systems|
  | Version-based| None*     | Medium   | Version  | CDN, immutable   |
  |              | (*new key)|          | tracking | content          |
  +--------------+-----------+----------+-----------+------------------+
```

---

## 2. Cache Stampede / Thundering Herd

When a popular cache key expires, MANY concurrent requests simultaneously miss
the cache and all query the database. This can overwhelm the database.

### The Problem

```
  Popular key "trending_posts" expires at T=300

  T=300.001: 1000 concurrent requests arrive
  +--------+                                    +--------+
  | Req 1  | ---> MISS -----------------------> |        |
  | Req 2  | ---> MISS -----------------------> |        |
  | Req 3  | ---> MISS -----------------------> |   DB   |  <-- 1000 identical
  | ...    | ---> MISS -----------------------> |        |      queries hit DB
  | Req1000| ---> MISS -----------------------> |        |      simultaneously
  +--------+                                    +--------+
                                                     |
                                                     v
                                                  DB OVERLOAD
                                                  (or crash)
```

### Solution 1: Locking / Mutex (Coalesce at Cache)

```
  T=300.001: Key expired

  Req 1: MISS --> acquire lock "trending_posts:lock" --> SUCCESS
         |
         +--> Query DB, get result, SET in cache, release lock

  Req 2-1000: MISS --> try acquire lock --> FAIL (already held)
              |
              +--> Wait/sleep briefly, then retry GET from cache
              |
              +--> HIT (Req 1 populated it) --> Return cached data

  Implementation:
  +--------+    1. GET key    +--------+
  | App    | --------------> | Redis  |  MISS
  +--------+                 +--------+
      |
      | 2. SETNX lock_key (acquire lock)
      v
  Lock acquired?
  YES --> query DB, SET cache, DEL lock_key
  NO  --> sleep 50ms, retry GET from cache
```

```python
def get_with_lock(key, ttl=300, lock_ttl=5):
    value = redis.get(key)
    if value:
        return value

    lock_key = f"{key}:lock"
    # Try to acquire lock (SETNX = SET if Not eXists)
    if redis.set(lock_key, "1", nx=True, ex=lock_ttl):
        try:
            value = db.query(key)
            redis.setex(key, ttl, value)
            return value
        finally:
            redis.delete(lock_key)
    else:
        # Another request is fetching -- wait and retry
        time.sleep(0.05)
        return redis.get(key) or db.query(key)  # fallback
```

**Pros:** Only 1 DB query per miss, simple to implement
**Cons:** Other requests wait (increased latency for waiters), lock management complexity
**When to use:** Most common solution, works well for most cases

### Solution 2: Probabilistic Early Recomputation (Refresh Before Expiry)

```
  Key TTL = 300s
  At T=280: random chance triggers early refresh

  +---- TTL = 300s --------------------------------+
  |                                                 |
  0s            250s        280s               300s
  |              |           |                  |
  FRESH         FRESH     RANDOM             EXPIRED
                          REFRESH
                          triggered
                          (before stampede)

  Formula: should_refresh = (current_time - (ttl - delta * beta * ln(rand())))
           where beta controls eagerness of early refresh
```

**Pros:** No locks needed, no waiting, probabilistic spread
**Cons:** More complex logic, occasional wasted refreshes
**When to use:** Very high-traffic keys where lock contention is a problem

### Solution 3: Request Coalescing (Deduplicate In-Flight Requests)

```
  1000 concurrent requests for same key:

  Without coalescing:
  Req 1 --> DB query
  Req 2 --> DB query
  ...
  Req 1000 --> DB query   (1000 identical queries!)

  With coalescing (e.g., Go singleflight):
  Req 1 --> DB query (first request -- actually executes)
  Req 2 --> wait for Req 1's result
  Req 3 --> wait for Req 1's result
  ...
  Req 1000 --> wait for Req 1's result
  
  Result from Req 1 shared with all 1000 requests. 1 DB query total.
```

```go
// Go singleflight example
import "golang.org/x/sync/singleflight"

var group singleflight.Group

func GetUser(id string) (*User, error) {
    v, err, _ := group.Do("user:"+id, func() (interface{}, error) {
        // Only ONE goroutine executes this, even if 1000 call GetUser concurrently
        return db.GetUser(id)
    })
    return v.(*User), err
}
```

**Pros:** Perfect deduplication, no wasted queries, no locks in cache
**Cons:** Only works within a single process (not across instances), adds in-memory state
**When to use:** High-concurrency applications, especially in Go (singleflight is standard)

---

## 3. Cache Penetration

Repeatedly querying for data that does NOT exist in the database. Since it never exists,
it is never cached, so every request goes to the database.

### The Problem

```
  Attacker sends: GET /user/999999999 (user doesn't exist)

  +--------+    GET user:999999999    +--------+
  | Client | -----------------------> | Cache  |  --> MISS (not cached)
  +--------+                          +--------+
      |                                   |
      | <---------------------------------+
      |
      | --------> DB query: SELECT * FROM users WHERE id = 999999999
      |           --> empty result
      |           --> nothing to cache
      |
      | (repeat 10,000x per second -- DB overwhelmed)

  The cache provides ZERO protection because the data doesn't exist.
```

### Solution 1: Cache Null / Empty Values

```
  First request for user:999999999:
    DB returns empty --> cache the EMPTY result with short TTL

    SET user:999999999 "__NULL__" EX 60   (cache "not found" for 60s)

  Subsequent requests (within 60s):
    GET user:999999999 --> "__NULL__" --> Return 404 (no DB query)

  +--------+    GET user:999999999    +--------+
  | Client | -----------------------> | Cache  |  --> HIT ("__NULL__")
  +--------+                          +--------+
                                          |
                                    Return 404 immediately
                                    (DB not queried)
```

**Pros:** Simple, effective for known non-existent keys
**Cons:** Wastes cache memory on null entries, short TTL means periodic DB queries
**When to use:** When the set of non-existent queries is bounded

### Solution 2: Bloom Filter

```
  Bloom filter: space-efficient probabilistic data structure
  - Can tell you "definitely NOT in set" or "probably in set"
  - Zero false negatives, small false positive rate (~1%)
  - Very compact: ~1.2 bytes per element for 1% false positive rate

  +--------+    GET user:42    +----------+    +--------+    +--------+
  | Client | ----------------> | Bloom    | -> | Cache  | -> |   DB   |
  +--------+                   | Filter   |    +--------+    +--------+
                               +----------+
                                    |
                              Is user:42 in
                              the bloom filter?
                                /        \
                              YES         NO
                              /            \
                        Proceed to      Return 404
                        cache/DB        immediately
                        (may be         (definitely
                        false +)        not in DB)

  All valid keys are added to bloom filter when created.
  Non-existent keys are guaranteed to be filtered out.
```

```python
# Bloom filter for cache penetration prevention
from pybloom_live import BloomFilter

# Initialize with expected number of elements and error rate
bf = BloomFilter(capacity=10_000_000, error_rate=0.01)

# When a user is created, add to bloom filter
def create_user(user_id, data):
    db.insert(user_id, data)
    bf.add(user_id)

# On read, check bloom filter first
def get_user(user_id):
    if user_id not in bf:
        return None  # Definitely doesn't exist, skip cache AND DB

    cached = redis.get(f"user:{user_id}")
    if cached:
        return cached

    user = db.get(user_id)
    if user:
        redis.setex(f"user:{user_id}", 300, user)
    else:
        redis.setex(f"user:{user_id}", 60, "__NULL__")
    return user
```

**Pros:** Extremely memory-efficient, filters out all non-existent keys
**Cons:** Cannot remove elements (use Cuckoo filter if needed), false positives possible
**When to use:** Large datasets, protection against enumeration attacks

---

## 4. Cache Avalanche

Many cache keys expire at the same time, causing a sudden flood of database queries.
Unlike stampede (one key), avalanche involves MANY keys expiring simultaneously.

### The Problem

```
  T=0: System starts, loads 10,000 keys with TTL=300s

  T=300: ALL 10,000 keys expire simultaneously
  +--------+
  | 10,000 |    ALL MISS     +--------+    10,000 queries    +--------+
  | requests| -------------> | Cache  | ------------------> |   DB   |
  |         |                | (empty)|                      |        |
  +--------+                 +--------+                      +--------+
                                                                 |
                                                                 v
                                                              DB CRASH
                                                              (overwhelmed)

  Timeline:
  0s                   300s                 600s
  |---- all keys set ---|---- all expire ----|
  |     TTL = 300s      |  AVALANCHE!        |
  |                     |  10K DB queries    |
```

### Solution 1: Jittered TTLs (Add Randomness)

```
  Instead of: TTL = 300 for all keys
  Use:        TTL = 300 + random(0, 60)   (240-360 seconds)

  Timeline with jitter:
  0s            240s    270s    300s    330s    360s
  |              |       |       |       |       |
                 +-- keys expire gradually ------+
                    over 120-second window
                    instead of all at once

  Spread is smooth, DB load stays manageable.
```

```python
import random

def cache_with_jitter(key, value, base_ttl=300, jitter=60):
    actual_ttl = base_ttl + random.randint(0, jitter)
    redis.setex(key, actual_ttl, value)
```

**Pros:** Trivial to implement, very effective
**Cons:** Slight unpredictability in cache freshness
**When to use:** ALWAYS. There is almost no reason not to add jitter.

### Solution 2: Pre-Warming (Load Cache Before Traffic)

```
  During deployment / startup:

  +--------+    1. Load hot keys    +--------+
  | App    | --------------------> | Cache   |
  | (init) |                       | (Redis) |
  +--------+                       +--------+
      |
      | 2. Stagger TTLs
      |    key1: TTL=300
      |    key2: TTL=315
      |    key3: TTL=330
      |    ...

  Cache is warm before any user traffic arrives.
```

**Pros:** Eliminates cold-start cache misses entirely
**Cons:** Need to know which keys to pre-load, startup time increases
**When to use:** After deployment, disaster recovery, known traffic patterns

### Solution 3: Multi-Layer Caching (Fallback Chain)

```
  If distributed cache has an avalanche:

  +--------+    MISS    +--------+    MISS    +--------+
  | Local  | ---------> | Redis  | ---------> |   DB   |
  | Cache  |            | (empty)|            |        |
  +--------+            +--------+            +--------+
     |                                             |
     | Local cache may still have                  |
     | data (different TTLs)                       |
     | Acts as shock absorber                      |

  Local cache TTL != Redis TTL, so they don't expire together.
```

---

## 5. Hot Key Problem

One cache key receives disproportionately more traffic than others. A single Redis shard
handles all requests for that key, becoming a bottleneck.

### The Problem

```
  Taylor Swift announces concert. Key: "event:taylor_swift_2026"

  +--------+
  | 500K   |    ALL requests for    +---------------+
  | req/s  | ---------------------> | Redis Shard 3 |  <-- OVERLOADED
  |        |    same key            | (owns this    |      (single-threaded,
  +--------+                        |  hash slot)   |       can't handle 500K/s)
                                    +---------------+
                                    
  Other shards are idle:
  +---------------+  +---------------+  +---------------+
  | Redis Shard 1 |  | Redis Shard 2 |  | Redis Shard 4 |
  | (idle)        |  | (idle)        |  | (idle)        |
  +---------------+  +---------------+  +---------------+
```

### Solution 1: Local Cache + Distributed Cache (Two-Tier)

```
  +--------+   L1: Local    +--------+   L2: Redis    +--------+
  | App    | ------------->  | Local  | ------------->  | Redis  |
  | (each  |   (10-30s TTL) | Cache  |   (300s TTL)   |        |
  | inst.) |                 +--------+                +--------+
  +--------+

  50 app instances, each with local cache:
  - 98% of requests served from local cache (nanoseconds)
  - Only ~2% reach Redis (after local TTL expires)
  - Redis load reduced from 500K/s to ~10K/s
```

**Pros:** Dramatically reduces load on distributed cache, fast reads
**Cons:** Brief inconsistency across instances (different local TTLs)
**When to use:** Most common solution for hot keys

### Solution 2: Key Replication Across Shards

```
  Replicate hot key to N shards with different suffixes:

  Original: "event:taylor_swift_2026"
  Replicas: "event:taylor_swift_2026:r1"  --> Shard 1
            "event:taylor_swift_2026:r2"  --> Shard 2
            "event:taylor_swift_2026:r3"  --> Shard 3
            "event:taylor_swift_2026:r4"  --> Shard 4

  Client: pick random suffix --> read from that shard
          random.choice(["r1", "r2", "r3", "r4"])

  Load spread across 4 shards instead of 1.
```

```python
import random

REPLICAS = 4

def get_hot_key(key):
    replica = random.randint(1, REPLICAS)
    return redis.get(f"{key}:r{replica}")

def set_hot_key(key, value, ttl=300):
    for i in range(1, REPLICAS + 1):
        redis.setex(f"{key}:r{i}", ttl, value)
```

**Pros:** Spreads load across cluster, uses existing infrastructure
**Cons:** N writes per update, consistency across replicas, more memory
**When to use:** When local cache is insufficient, need distributed solution

### Solution 3: Dedicated Cache Instance

```
  +-------------------+
  | Hot Key           |    Dedicated Redis instance
  | Detection         |    just for hot keys
  | (monitor QPS/key) |
  +-------------------+
           |
           | Route hot key requests
           v
  +-------------------+
  | Redis Instance    |    Scaled up (more CPU, memory)
  | (hot keys only)   |    Read replicas for distribution
  +-------------------+
```

**Pros:** Isolated, scalable, no impact on other keys
**Cons:** Extra infrastructure, need hot key detection, routing complexity
**When to use:** Extreme cases (viral events, flash sales)

---

## 6. Cache Consistency

The cache and database disagree on the current value. This is the most fundamental
challenge with any caching system.

### The Problem

```
  Race condition with concurrent read and write:

  Thread A (Writer):              Thread B (Reader):
  1. UPDATE DB (val=new)
                                  2. GET from cache --> MISS
                                  3. SELECT from DB (val=new)
  4. DELETE cache key
                                  5. SET cache (val=new)  <-- seems OK?

  BUT what if order is:
  Thread A (Writer):              Thread B (Reader):
                                  1. GET from cache --> MISS
                                  2. SELECT from DB (val=OLD)
  3. UPDATE DB (val=new)
  4. DELETE cache key
                                  5. SET cache (val=OLD)  <-- STALE!
                                     (cache now has old value)
```

### Solution 1: Delete Cache on Write (Not Update)

```
  WRONG (update cache):
  1. Update DB
  2. Update cache with new value
  Problem: if step 2 fails, cache has old value
  Problem: race condition between two concurrent writers

  RIGHT (delete cache):
  1. Update DB
  2. DELETE cache key
  Next read: cache miss --> load fresh from DB --> re-cache

  Why delete is safer:
  - Idempotent: deleting twice is fine
  - No race condition between writers (both just delete)
  - Simpler error handling
```

### Solution 2: Double-Delete Pattern

```
  Addresses the race condition above:

  1. DELETE cache key                    (invalidate stale data)
  2. UPDATE database                     (write new value)
  3. Sleep/delay (e.g., 500ms)           (wait for in-flight reads to complete)
  4. DELETE cache key AGAIN              (clean up any stale writes from step 1-2 gap)

  Timeline:
  T=0:   DELETE cache:user:42
  T=1:   UPDATE DB SET name='Bob'
  T=500: DELETE cache:user:42 (again, catches any stale re-caches)

  Any read that occurred between T=0 and T=500 that re-cached stale data
  is cleaned up by the second delete.
```

```python
def update_user(user_id, data):
    cache_key = f"user:{user_id}"

    # First delete
    redis.delete(cache_key)

    # Update DB
    db.execute("UPDATE users SET name=%s WHERE id=%s", data['name'], user_id)

    # Delayed second delete (can be async/background job)
    schedule_delayed_task(
        delay_ms=500,
        task=lambda: redis.delete(cache_key)
    )
```

**Pros:** Handles race conditions, simple concept
**Cons:** 500ms window of potential staleness, delayed delete adds complexity
**When to use:** When eventual consistency with a tight window is acceptable

### Solution 3: Accept Eventual Consistency

```
  In most systems, brief inconsistency is fine:

  +---------------------------------------------------+
  | Scenario                  | Acceptable Staleness   |
  +---------------------------------------------------+
  | Social media feed         | 5-30 seconds           |
  | Product catalog           | 1-5 minutes            |
  | User profile              | 1-30 seconds           |
  | Leaderboard               | 1-10 seconds           |
  | Inventory count           | 0 seconds (no cache!)  |
  | Bank balance              | 0 seconds (no cache!)  |
  +---------------------------------------------------+

  For most applications:
  - Use TTL (e.g., 60 seconds)
  - Delete on write
  - Accept that reads MIGHT be up to TTL seconds stale
  - This is FINE for 95%+ of use cases
```

### Solution 4: Write-Through with Read-Through

```
  Eliminates inconsistency entirely by making the cache the single writer:

  +--------+    write    +--------+    write    +--------+
  | App    | ----------> | Cache  | ----------> |   DB   |
  +--------+             +--------+             +--------+
      |                      |
      | read                 | always consistent
      v                      | (cache writes to DB)
  +--------+                 |
  | Cache  | <---------------+
  +--------+

  Cache is always consistent because it owns the write path.
  But: higher write latency, more complex cache layer.
```

---

## Summary: Challenge Quick-Reference

```
+--------------------+----------------------------+---------------------------+
| Challenge          | Root Cause                 | Best Solution             |
+--------------------+----------------------------+---------------------------+
| Cache Invalidation | Stale data after DB write  | TTL + event-based delete  |
+--------------------+----------------------------+---------------------------+
| Cache Stampede     | Popular key expires,       | Lock/mutex on miss +      |
|                    | many concurrent misses     | singleflight coalescing   |
+--------------------+----------------------------+---------------------------+
| Cache Penetration  | Queries for non-existent   | Bloom filter +            |
|                    | data bypass cache          | cache null values         |
+--------------------+----------------------------+---------------------------+
| Cache Avalanche    | Mass simultaneous          | Jittered TTLs (ALWAYS) +  |
|                    | key expiration             | pre-warming on deploy     |
+--------------------+----------------------------+---------------------------+
| Hot Key            | Single key gets extreme    | Local cache (L1) +        |
|                    | disproportionate traffic   | key replication           |
+--------------------+----------------------------+---------------------------+
| Cache Consistency  | Cache and DB disagree      | Delete on write +         |
|                    | on current value           | short TTL + accept        |
|                    |                            | eventual consistency      |
+--------------------+----------------------------+---------------------------+
```

---

## Interview Defense Matrix

**Q: "How would you prevent a cache stampede?"**
A: Three layers: (1) Distributed lock so only one request fetches from DB on miss.
   (2) singleflight/request coalescing within each process. (3) Refresh-ahead to
   proactively refresh before TTL expires for known hot keys.

**Q: "An attacker is sending millions of requests for random user IDs. How do you protect your database?"**
A: Bloom filter in front of cache rejects IDs that definitely don't exist. For IDs that
   might exist but don't, cache the null result with a short TTL (60s). Rate limiting
   at the API gateway provides additional protection.

**Q: "Your entire cache just went down. What happens?"**
A: Cache avalanche scenario. Mitigation: (1) Circuit breaker prevents all traffic from
   hitting DB. (2) Gradually warm cache with most critical keys first. (3) Rate limit
   DB queries. (4) Local in-process caches absorb some load during recovery.
   Prevention: Redis Cluster with replicas for high availability.

**Q: "How do you keep cache and DB in sync?"**
A: Delete cache key on write (not update). Use TTL as a safety net. For critical data,
   use write-through caching. Accept that eventual consistency (seconds) is fine for
   most use cases. For strict consistency, don't cache -- query DB directly.

**Q: "A celebrity tweeted and one key is getting 1M requests/second."**
A: Hot key problem. (1) Add a local in-process cache (Caffeine) with 10-30s TTL on each
   app instance to absorb 98% of traffic. (2) Replicate the key across multiple Redis
   shards with random suffixes. (3) If still insufficient, dedicate a scaled Redis
   instance to hot keys with read replicas.
