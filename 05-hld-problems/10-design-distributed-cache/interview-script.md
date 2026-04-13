# Design a Distributed Cache -- 45-Minute Interview Script

## How to Use This Script

This is a minute-by-minute simulation of a real system design interview for
"Design a Distributed Cache." Read both the **Interviewer** and **Candidate** lines
aloud to internalize the pacing, the transitions, and the depth expected at each
stage. The Candidate responses represent a strong Senior / Staff-level answer.

---

## Opening (0:00 -- 1:00)

**Interviewer:** Today I'd like you to design a distributed in-memory cache -- think
Redis Cluster or a simplified Memcached fleet. Multiple servers, terabytes of cached
data, sub-millisecond reads, and it needs to handle node failures gracefully. Take a
moment to think about your approach.

**Candidate:** Great topic. Distributed caching sits at the intersection of data
structures, networking, and distributed systems fundamentals. I'll start with
clarifying questions, then requirements, estimation, high-level design, APIs, data
model, and deep-dive into two areas: consistent hashing with virtual nodes, and hot
key mitigation. Let's begin.

**Interviewer:** Go ahead.

---

## Clarifying Questions (1:00 -- 4:00)

**Candidate:** First -- what's the primary access pattern? Read-heavy, write-heavy,
or balanced?

**Interviewer:** Read-heavy. Roughly 80% reads, 20% writes. Standard caching
workload.

**Candidate:** What data types should we support? Just simple key-value strings, or
richer types like lists, sets, and sorted sets?

**Interviewer:** Start with key-value (GET/SET/DELETE). Mention richer types as an
extension.

**Candidate:** What's the expected data size? How big are keys and values?

**Interviewer:** Keys are small (under 256 bytes). Values can be up to 1 MB. Average
value size is about 1 KB.

**Candidate:** Do we need persistence? Should the cache survive a full cluster
restart?

**Interviewer:** No. The cache is volatile by design. The source of truth is the
backend database. If the cache loses data, clients refill it from the DB.

**Candidate:** What about consistency? If I write a value and immediately read it,
must I see the new value?

**Interviewer:** Yes, for single-key operations on the same node. But across replicas,
eventual consistency is acceptable. Read-after-write consistency on the primary.

**Candidate:** What's the scale? How many cache nodes and how much total data?

**Interviewer:** Let's say 100+ nodes, each with 64 GB of RAM. Total cluster
capacity around 6 TB. Hundreds of thousands of operations per second.

**Candidate:** Perfect. Let me organize the requirements.

---

## Requirements (4:00 -- 7:00)

### Functional Requirements

**Candidate:** Here's what I'll design:

1. **GET(key)** -- retrieve the value for a key; return null on cache miss
2. **SET(key, value, TTL)** -- store a key-value pair with optional time-to-live
3. **DELETE(key)** -- remove a key from the cache
4. **TTL expiration** -- keys automatically expire after their TTL
5. **Eviction** -- when a node's memory is full, evict entries using LRU policy
6. **Replication** -- each key is replicated to N nodes for fault tolerance
7. **Cluster management** -- add/remove nodes with minimal data movement

### Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Read latency (p99) | < 1 millisecond |
| Write latency (p99) | < 5 milliseconds (including replication) |
| Throughput per node | 100K+ operations per second |
| Availability | 99.99% -- cache downtime causes database overload |
| Data loss tolerance | Some data loss on node failure is acceptable |
| Cluster size | 100+ nodes, 6+ TB total |
| Scalability | Linear throughput increase with added nodes |

**Interviewer:** Good. The "some data loss is acceptable" is important -- this is a
cache, not a database.

---

## Estimation (7:00 -- 10:00)

**Candidate:** Let me size the key metrics.

**Storage:**
- 100 nodes * 64 GB RAM each = 6.4 TB total raw capacity
- With replication factor of 3, effective capacity = 6.4 TB / 3 = ~2.1 TB usable
- Average value size: 1 KB, average key size: 100 bytes
- Entries: 2.1 TB / 1.1 KB = ~2 billion cache entries
- Overhead per entry (hash table pointer, LRU list pointer, TTL, metadata): ~100
  bytes
- Effective entries after overhead: ~1.5 billion

**Throughput:**
- Per node: 100K ops/sec (comparable to Redis single-thread benchmark)
- Cluster total: 100 * 100K = 10 million ops/sec
- Read:write ratio: 80:20 = 8 million reads/sec, 2 million writes/sec
- With replication factor 3, each write generates 3 writes (1 primary + 2 replicas)
- Actual write load: 2M * 3 = 6M write ops across the cluster

**Network:**
- Average response: 1 KB value + 100 bytes header = ~1.1 KB
- At 100K ops/sec per node: 100K * 1.1 KB = ~110 MB/sec per node
- Replication traffic: 2M writes * 1.1 KB * 2 replicas = ~4.4 GB/sec total
  replication bandwidth across the cluster

**Memory layout per node:**
- 64 GB total RAM
- ~60 GB for cache data (after OS, process overhead, and fragmentation buffer)
- Hash table: open addressing or chained, with ~60 million entries per node
- LRU tracking: doubly-linked list, 16 bytes per node (prev + next pointer)

**Candidate:** The key takeaway: memory is the bottleneck, not CPU or network. Every
design decision should optimize for memory efficiency.

---

## High-Level Design (10:00 -- 18:00)

**Candidate:** Here's the architecture:

```
    ┌──────────────────────────────────┐
    │        Application Servers        │
    │  (use cache client library)       │
    └──────────────┬───────────────────┘
                   │
                   │  Cache client hashes key
                   │  to determine target node
                   │
    ┌──────────────▼───────────────────────────────────┐
    │                                                   │
    │            Consistent Hash Ring                    │
    │    ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │
    │    │Node A│  │Node B│  │Node C│  │Node D│  ...   │
    │    │64 GB │  │64 GB │  │64 GB │  │64 GB │       │
    │    └──┬───┘  └──┬───┘  └──┬───┘  └──┬───┘       │
    │       │         │         │         │            │
    │       └─────────┼─────────┘         │            │
    │           replication               │            │
    │                                     │            │
    └─────────────────────────────────────┘            │
                                                       │
    ┌──────────────────────────────────────────────────┘
    │
    ▼
    ┌───────────────────────────────────────┐
    │      Cluster Coordinator              │
    │  (ZooKeeper / etcd / Gossip)          │
    │  - Node membership                    │
    │  - Ring topology                      │
    │  - Failure detection                  │
    └───────────────────────────────────────┘
```

**Candidate:** Let me explain the key components.

**1. Cache Client Library (smart client).**
The client is embedded in every application server. It knows the consistent hash ring
topology and routes requests directly to the correct cache node. There's no proxy or
load balancer in the data path -- the client talks to the cache node directly. This
is critical for latency: adding a proxy would add 0.5-1 ms per request, doubling our
latency budget.

The client maintains a local copy of the ring topology and updates it when nodes
join or leave (via a watcher on ZooKeeper or gossip protocol).

**2. Cache Node.**
Each cache node is a server with 64 GB of RAM running the cache process. Internally,
each node has:
- A hash table mapping keys to values
- A doubly-linked list implementing LRU eviction order
- A TTL wheel for efficient expiration
- A replication module that forwards writes to replica nodes

**3. Consistent Hash Ring.**
Keys are mapped to nodes using consistent hashing. Each physical node is represented
by multiple virtual nodes (vnodes) on the ring. When we hash a key, we walk clockwise
on the ring to find the first vnode -- the owning physical node is the primary. The
next N-1 distinct physical nodes clockwise are the replicas.

**4. Cluster Coordinator.**
Manages the ring topology: which nodes are alive, which vnodes they own, and the
replication assignments. Options:
- **ZooKeeper/etcd**: strongly consistent, external dependency
- **Gossip protocol (Swim/Memberlist)**: eventually consistent, no external dependency

I'll use gossip for membership detection and a consistent view of the ring
propagated through gossip metadata.

**Interviewer:** Walk me through a read and write operation.

**Candidate:**

**Read path (GET):**
1. Client hashes the key: `node = ring.getNode(hash(key))`
2. Client sends GET request to the primary node via TCP.
3. Node looks up the key in its hash table.
   - If found and not expired: return the value, move it to the head of the LRU list.
   - If found but expired (lazy expiration): delete it, return null.
   - If not found: return null (cache miss).
4. Client receives response. Total time: ~0.2 ms (1 network round trip + hash lookup).

**Write path (SET):**
1. Client hashes the key and sends SET to the primary node.
2. Primary stores the value in its hash table and LRU list.
3. If TTL is specified, register it in the TTL wheel.
4. Primary asynchronously replicates to the 2 replica nodes.
5. Primary responds to the client immediately (doesn't wait for replica ACKs).
6. Total time: ~0.3 ms for client response. Replication completes in ~1 ms.

**Interviewer:** You said async replication. What about consistency?

**Candidate:** Async replication gives us lower write latency but means replicas may
lag behind the primary by a few milliseconds. If a client reads from a replica
(during failover), it might see stale data. This is acceptable for a cache because:

1. The cache is volatile -- clients must handle misses and stale data anyway.
2. The database is the source of truth.
3. The staleness window is milliseconds, which is negligible.

If a use case requires strong consistency, the client can issue a "read from primary"
flag. But the default path optimizes for speed.

---

## API Design (18:00 -- 21:00)

### Wire Protocol

**Candidate:** The protocol is binary, not text-based like Redis's RESP. Binary is
more compact and faster to parse.

```
Request format:
┌────────┬──────────┬───────────┬──────────┬─────────┬──────────┐
│ Magic  │ Version  │ Opcode    │ Key Len  │ Val Len │ Extras   │
│ 2 bytes│ 1 byte   │ 1 byte    │ 2 bytes  │ 4 bytes │ variable │
├────────┴──────────┴───────────┴──────────┴─────────┴──────────┤
│                         Key bytes                              │
├────────────────────────────────────────────────────────────────┤
│                        Value bytes                             │
└────────────────────────────────────────────────────────────────┘
```

**Opcodes:**
- `0x01` GET
- `0x02` SET
- `0x03` DELETE
- `0x04` GET_MULTI (batch)
- `0x05` SET_MULTI (batch)
- `0x06` CAS (compare-and-swap)

### Client API (application-facing)

```python
class CacheClient:
    def get(key: str) -> Optional[bytes]:
        """Returns the cached value or None on miss."""

    def set(key: str, value: bytes, ttl_seconds: int = 0) -> bool:
        """Stores a value. ttl=0 means no expiration."""

    def delete(key: str) -> bool:
        """Removes a key. Returns True if it existed."""

    def get_multi(keys: List[str]) -> Dict[str, Optional[bytes]]:
        """Batch get. Groups keys by node and sends parallel requests."""

    def cas(key: str, expected: bytes, new_value: bytes) -> bool:
        """Compare-and-swap. Returns True if the swap succeeded."""
```

### Batch Operations

**Candidate:** `get_multi` is critical for performance. The client:
1. Groups the requested keys by their target node (using the hash ring).
2. Sends parallel GET requests to each node.
3. Collects responses and returns a unified map.

This reduces round trips from N to the number of distinct nodes (typically 5-10
for a batch of 100 keys).

**Interviewer:** Why a binary protocol instead of something human-readable like
Redis's RESP?

**Candidate:** Parsing efficiency. At 100K ops/sec per node, every microsecond of
parsing overhead matters. A binary protocol with fixed-width headers can be parsed
with pointer arithmetic -- no string scanning. Redis chose RESP for simplicity and
debugging, which is a valid trade-off for a general-purpose tool. For a purpose-
built cache at our scale, binary is worth the reduced debuggability.

That said, we'd provide a CLI tool that translates human-readable commands to binary
for debugging.

---

## Data Model (21:00 -- 24:00)

### In-Memory Data Structure

**Candidate:** Each cache node uses a hash table combined with an LRU list.

```
Hash Table (open addressing with Robin Hood hashing):
┌───────────────────────────────────────────────┐
│ Bucket 0: key_hash | key_ptr | value_ptr | TTL │
│ Bucket 1: (empty)                               │
│ Bucket 2: key_hash | key_ptr | value_ptr | TTL │
│ ...                                              │
│ Bucket N: key_hash | key_ptr | value_ptr | TTL │
└───────────────────────────────────────────────┘

Each bucket: 8 (hash) + 8 (key ptr) + 8 (value ptr) + 8 (TTL) + 8 (LRU ptrs) = 40 bytes
With 60M entries per node: 40 * 60M = 2.4 GB overhead -- acceptable at 4% of 64 GB

LRU Doubly-Linked List:
HEAD ←→ [most recent] ←→ [recent] ←→ ... ←→ [least recent] ←→ TAIL
  │                                                              │
  └── on GET: move entry to HEAD                                 │
                                                on eviction: remove from TAIL
```

### Memory Allocation

**Candidate:** Key design decision: how to store variable-size values in memory.

**Option A: Malloc per entry.** Simple, but causes memory fragmentation over time.
After hours of inserts and deletes, the heap is Swiss cheese. Fragmentation can waste
20-30% of memory.

**Option B: Slab allocator (Memcached approach).** Pre-allocate memory into slabs of
fixed sizes: 64B, 128B, 256B, 512B, 1KB, 4KB, 16KB, 64KB, 256KB, 1MB. Each value
goes into the smallest slab that fits. Internal fragmentation is bounded at 2x.

I'd use Option B. The slab allocator eliminates external fragmentation and makes
memory management predictable. The downside is internal waste (a 65-byte value uses
a 128-byte slab), but this is controllable and predictable.

```
Slab Classes:
Class 1:  64B slabs  ← keys and small values
Class 2: 128B slabs
Class 3: 256B slabs
Class 4: 512B slabs
Class 5:   1KB slabs ← most values land here (average = 1KB)
Class 6:   4KB slabs
Class 7:  16KB slabs
Class 8:  64KB slabs
Class 9: 256KB slabs
Class 10:  1MB slabs ← max value size
```

### TTL Expiration

**Candidate:** Two mechanisms working together:

**Lazy expiration:** On every GET, check if the entry's TTL has passed. If yes,
delete it and return null. This is O(1) per access and catches most expirations.

**Active expiration (timing wheel):** A background thread uses a hierarchical timing
wheel. Each tick (e.g., 1 second), it scans a batch of entries in the current wheel
slot and deletes expired ones. This catches entries that are never accessed again.

The timing wheel is memory-efficient: one pointer per wheel slot. With 3600 slots
(1-hour wheel), it adds just 28 KB of overhead.

### Consistent Hash Ring

```
Ring structure:
  - 256 virtual nodes per physical node
  - 100 physical nodes = 25,600 vnodes on the ring
  - Each vnode: { position: uint32, node_id: string }
  - Ring stored as a sorted array for binary search: O(log V) lookup

Key routing:
  position = hash(key) % 2^32
  primary = first vnode clockwise from position
  replicas = next 2 distinct physical nodes clockwise
```

---

## Deep Dive 1: Consistent Hashing and Node Failure (24:00 -- 33:00)

**Interviewer:** What happens when a node fails? Walk me through the entire failure
scenario.

**Candidate:** Let me trace through a complete node failure and recovery.

**Setup:** 100 nodes, each with 256 vnodes, replication factor 3. Node C fails.

**T=0: Node C becomes unresponsive.**

**T=0-3s: Detection.**
Other nodes detect the failure through gossip heartbeats. Each node pings a random
subset of peers every second. When Node C doesn't respond, the pinging node marks it
as "suspect." After 3 failed attempts from different nodes, Node C is declared
"dead" in the gossip protocol.

**T=3s: Ring update.**
All 256 of Node C's vnodes are removed from the ring. The gossip protocol propagates
this ring update to all nodes and clients within seconds.

**T=3s: Read impact.**
Keys that were primarily owned by Node C are now handled by Node C's successor on
the ring (let's call it Node D). But Node D has replicas of Node C's data because
it was the next node clockwise -- it's already a replica. So reads are served
immediately from Node D with zero data loss for keys that had been replicated.

**T=3s: Write impact.**
New writes that hash to Node C's range go to Node D (the new primary). Node D
begins replicating to the next successor (Node E), restoring the replication factor
to 3.

**T=3s-30s: Replica repair.**
Node D was a replica for Node C's keys, but now it's the primary. It only has a
replica copy, which might be slightly behind (async replication). For the few
milliseconds of writes that were in-flight when Node C died, those writes are lost.
This is acceptable -- the cache is volatile.

However, the replication factor for Node C's key range is now 2 instead of 3. A
background repair process kicks in:
- Node D sends Node C's key range to the next available node (Node F) to restore
  the third replica.
- This happens gradually to avoid overloading the network.

**T=variable: Node C comes back online.**
When Node C rejoins, it registers its vnodes back on the ring. But its data is stale.
Two options:
1. **Start empty.** Node C rejoins with an empty cache. Misses on its keys are
   filled from the backend database. Simple but causes a spike in database load.
2. **Bulk transfer.** Node D streams Node C's key range to Node C before Node C
   starts serving traffic. Takes longer to rejoin but avoids the DB spike.

I'd use option 2 for planned maintenance (we know the node is coming back) and
option 1 for unplanned failures (we don't know when the node will return).

**Interviewer:** With 256 virtual nodes per physical node, how do you ensure even
distribution? What if the hash function clusters vnodes?

**Candidate:** The virtual node positions are deterministic: `hash(node_id + "-" +
vnode_index)` for vnode_index 0 through 255. Using a strong hash function like
SHA-256, the positions are uniformly distributed on the ring.

With 25,600 vnodes total (100 nodes * 256 vnodes), the standard deviation of load
per node is approximately `1/sqrt(256)` = 6.25% of the mean. So the most loaded
node has about 6% more keys than average. This is acceptable.

If we need tighter balance, we increase vnodes to 1024 per node, reducing variance
to ~3%. The cost is a larger ring metadata structure (1024 * 100 = 102,400 entries),
but at 20 bytes each, that's just 2 MB.

**Interviewer:** When a node is added to the cluster, how much data moves?

**Candidate:** This is the beauty of consistent hashing. When a new node joins:
- It takes over some vnodes from existing nodes.
- Only keys in those vnodes' ranges need to move.
- With 100 nodes, adding 1 node means ~1% of total data moves.
- Contrast with naive modular hashing: adding 1 node to 100 would remap ~99% of
  keys (because `hash(key) % 100 != hash(key) % 101` for most keys).

The transfer process:
1. New node registers on the ring.
2. For each vnode it owns, it contacts the previous owner and requests a key range
   transfer.
3. During transfer, reads for that range are served by the old owner.
4. Once transfer is complete, the new node starts serving that range.
5. We use a handoff flag: the old owner stops accepting writes for the transferred
   range only after the new owner confirms receipt.

**Interviewer:** What about split-brain? Two nodes both think they own the same key
range?

**Candidate:** With gossip-based membership, there's a window where two nodes have
different views of the ring. Node X thinks it still owns a range; Node Y thinks it
was assigned that range.

Resolution: we adopt a **last-writer-wins** policy with vector clocks. Each value has
a version (logical timestamp). On conflict, the higher version wins. For a cache,
this is acceptable -- the worst case is serving a slightly stale value, which the
client handles through normal cache invalidation patterns.

For stricter guarantees, we'd use a consensus-based coordinator (etcd/ZooKeeper)
instead of gossip. The trade-off: higher latency for ring updates but no split-brain.

---

## Deep Dive 2: Hot Key Mitigation (33:00 -- 40:00)

**Interviewer:** How do you handle hot keys? Imagine a celebrity tweets and suddenly
one cache key gets 1 million requests per second. One node can't handle that.

**Candidate:** Hot keys are the single most common cause of cache cluster outages.
One key melting one node, which cascades as traffic redistributes. Let me walk
through the problem and four mitigation strategies, in order of implementation
complexity.

**Strategy 1: Local caching in the client (L1 cache).**
The cache client maintains a small in-process LRU cache (e.g., 10,000 entries, 100
MB). Before sending a request to the cache cluster, it checks the local cache.

```python
def get(key):
    # Check L1 (local) cache first
    value = local_cache.get(key)
    if value is not None:
        return value

    # L1 miss -> go to distributed cache
    value = remote_cache.get(key)
    if value is not None:
        local_cache.set(key, value, ttl=5)  # short TTL for freshness
    return value
```

For a hot key, the first request from each application server hits the cache node,
but subsequent requests (within the 5-second local TTL) are served from local memory.
If we have 1,000 app servers, the cache node sees 1,000 requests per 5 seconds
(200/sec) instead of 1,000,000/sec.

**Trade-off:** Local caching adds staleness. A write to the key takes up to 5 seconds
to propagate to all local caches. For most read-heavy hot keys (celebrity profile,
trending topic), this is fine.

**Strategy 2: Read replicas for hot keys.**
When we detect a hot key (see detection below), we replicate it to additional nodes.
Instead of one primary, the key exists on 5-10 nodes. The client randomly picks one
for each read.

```python
def get(key):
    if key in hot_key_set:
        # Spread reads across multiple replicas
        node = random.choice(hot_key_replicas[key])
    else:
        node = ring.get_node(hash(key))
    return node.get(key)
```

**Trade-off:** More replication traffic and memory usage for hot keys. Writes must
propagate to all replicas.

**Strategy 3: Key-level request coalescing.**
When multiple requests for the same key arrive within a short window, only one
actually reads from the data structure. The others wait and receive the same
response.

```python
# Inside the cache node
pending_requests = {}   # key -> Future

def handle_get(key):
    if key in pending_requests:
        # Another request is already fetching this key
        return pending_requests[key].wait()

    future = Future()
    pending_requests[key] = future

    value = hash_table.get(key)   # actual lookup
    future.resolve(value)
    del pending_requests[key]

    return value
```

This prevents CPU waste from redundant hash lookups but doesn't help with network
bandwidth (each client still gets its own response).

**Strategy 4: Cache node auto-scaling (most complex).**
When a node detects it's receiving disproportionate traffic (> 3x average), it
signals the cluster coordinator. The coordinator splits the node's key range:
some of its vnodes are reassigned to a new "overflow" node. This redistributes
the load.

This is a last resort -- it changes the ring topology and requires data migration.

**Detection: How do we know a key is hot?**

Each cache node maintains a **Count-Min Sketch** -- a probabilistic frequency counter
that uses constant memory. Every request increments the sketch. A background thread
periodically checks the sketch and identifies keys above a threshold (e.g., > 10,000
requests/sec).

```
Count-Min Sketch:
  - 4 hash functions, each mapping to a row of 10,000 counters
  - Memory: 4 * 10,000 * 4 bytes = 160 KB
  - On each request: increment 4 counters
  - To query frequency: take minimum of 4 counter values
  - False positive rate: ~0.01% at these dimensions
```

When a hot key is detected:
1. The node publishes to a `hot-keys` channel.
2. The client library receives the notification and enables local caching for that
   key.
3. If the key is persistently hot, the cluster coordinator creates read replicas.

**Interviewer:** What about thundering herd on cache miss? A hot key expires, 10,000
concurrent requests all miss, and all 10,000 slam the database simultaneously.

**Candidate:** This is the "cache stampede" problem. Three defenses:

**Defense 1: Probabilistic early expiration (PER).**
Instead of all clients discovering the expiration at the same moment, each client
independently decides to refresh the cache slightly before the TTL expires. The
probability of refreshing increases as the TTL approaches 0:

```
should_refresh = (current_time - fetch_time) > TTL - (beta * log(random()))
```

Where `beta` is a tuning parameter. This spreads out the refresh over a window before
expiration, so only 1-2 clients refresh instead of 10,000.

**Defense 2: Locking (node-side).**
When a cache miss occurs, the node sets a short-lived lock for that key. The first
request acquires the lock and goes to the database. Subsequent requests wait for the
lock to be released (with a timeout), then read the refreshed value.

```python
def get_with_miss_coalescing(key):
    value = cache.get(key)
    if value is not None:
        return value

    # Cache miss -- try to acquire refresh lock
    if cache.set_nx(key + ":lock", "1", ttl=5):
        # We won the lock -- go to database
        value = database.get(key)
        cache.set(key, value, ttl=300)
        cache.delete(key + ":lock")
        return value
    else:
        # Someone else is refreshing -- wait and retry
        time.sleep(0.05)
        return cache.get(key)  # should be populated now
```

**Defense 3: Stale-while-revalidate.**
The cache stores values with two TTLs: a "fresh" TTL and a "stale" TTL. When the
fresh TTL expires, the cache still serves the stale value while one client refreshes
in the background.

```
Key: "celebrity:profile"
Value: { data: "...", fresh_until: T+300, stale_until: T+600 }

- Before T+300: serve normally
- Between T+300 and T+600: serve stale data, trigger async refresh
- After T+600: true cache miss
```

This is the most robust approach because users always get a response (even if
slightly stale), and the database never sees a thundering herd.

---

## Trade-offs Discussion (40:00 -- 42:00)

**Candidate:** Key design trade-offs:

| Decision | Trade-off |
|----------|-----------|
| **Consistent hashing over modular hashing** | More complex ring management, but adding/removing nodes only moves ~1/N of data instead of nearly all of it. |
| **Async replication over sync** | Risk of losing a few ms of writes on node failure, but 3-5x lower write latency. Acceptable for a cache. |
| **Slab allocator over malloc** | Internal waste (up to 2x for unlucky sizes) but zero external fragmentation. Predictable memory behavior over months of operation. |
| **Smart client (direct routing) over proxy** | Client must know the ring topology, but saves 0.5-1 ms per request by eliminating the proxy hop. |
| **Gossip over ZooKeeper for membership** | No external dependency, but eventual consistency means brief windows of inconsistent ring views. |
| **Count-Min Sketch for hot key detection** | Probabilistic (false positives), but O(1) per operation and constant memory. An exact counter would require tracking every distinct key. |

**Interviewer:** If you could only pick one thing to get right, what would it be?

**Candidate:** The consistent hash ring and its behavior during node failures. If the
ring is wrong, keys route to the wrong nodes, cache hit rates collapse, and the
backend database gets crushed by a sudden flood of misses. We've seen production
incidents where a cache cluster failure cascaded into a database outage within
seconds. The ring is the foundation -- everything else is optimization.

---

## Future Improvements (42:00 -- 43:30)

**Candidate:** Improvements I'd make with more time:

1. **Client-side consistent hashing with read replicas.** The client knows all 3
   replicas for a key and can read from the closest one (by network latency), not
   just the primary. This improves read latency for globally distributed deployments.

2. **Memory-tiered caching.** Use NVMe SSDs as a second tier. Hot data stays in RAM,
   warm data overflows to SSD. Reads from SSD are 100 microseconds -- slower than
   RAM but 100x faster than a database query. This dramatically increases effective
   capacity.

3. **Cross-datacenter replication.** Async replicate cache entries to other DCs so
   that a cache warm-up in DC-B is instant after DC-A has been running.

4. **Adaptive eviction policies.** Instead of pure LRU, use a frequency-based policy
   like W-TinyLFU (used by Caffeine, Java's best caching library). It combines
   recency and frequency, keeping frequently accessed items even if not recently
   accessed.

5. **Compression.** For values above 1 KB, apply LZ4 compression. LZ4 compresses at
   3 GB/sec and decompresses at 5 GB/sec -- effectively free at our throughput.
   Typical compression ratio: 2-4x, effectively doubling our cache capacity.

6. **Observability.** Per-key access metrics, hit/miss rate dashboards, hot key
   alerts, replication lag monitoring, and memory fragmentation tracking.

---

## Red Flags to Avoid

| Red Flag | Why It's Bad |
|----------|-------------|
| Using modular hashing (hash % N) | Adding or removing a node remaps nearly all keys, causing a cache stampede on the database |
| No eviction policy | The cache fills up and either crashes (OOM) or rejects writes. Must have LRU or similar. |
| Synchronous replication with write-back | Turns a ~0.3 ms write into a ~5 ms write. For a cache, this latency is unacceptable. |
| No mention of hot keys | Every cache at scale has hot keys. Not addressing it shows lack of production experience. |
| Storing cache data on disk | It's a CACHE, not a database. The entire point is in-memory speed. Disk defeats the purpose. |
| Single-node design | The question says "distributed." A single Redis instance is not a system design answer. |
| No client-side routing (using a proxy for every request) | The proxy becomes a bottleneck and adds latency. Smart clients that know the ring are essential. |

---

## Power Phrases

Use these exact phrases to signal expertise during the interview:

- "We use **consistent hashing with 256 virtual nodes per physical node**, giving us
  ~6% load variance and O(1/N) data movement on topology changes."
- "The eviction policy is **LRU implemented as a doubly-linked list** integrated with
  the hash table. Every GET promotes the entry to the head in O(1)."
- "Memory is managed with a **slab allocator** (like Memcached) to eliminate external
  fragmentation. Fixed-size slab classes ensure predictable memory behavior."
- "Writes replicate to 2 followers **asynchronously**. The client gets a response in
  ~0.3 ms. We accept the risk of losing milliseconds of writes on failure because
  the cache is volatile by design."
- "Hot keys are detected with a **Count-Min Sketch** -- a probabilistic frequency
  counter using 160 KB of memory per node. When a key exceeds 10K requests/sec, we
  activate local caching in the client."
- "Cache stampede is prevented with **stale-while-revalidate**: expired entries are
  still served while a single client refreshes from the database in the background."
- "The client library is a **smart client** that maintains a local copy of the hash
  ring and routes directly to the owning node -- no proxy in the data path."
- "Node failure is handled by **replica promotion**: the next node clockwise on the
  ring already has a copy and starts serving immediately. Zero-downtime failover."
- "The TTL system uses a **hierarchical timing wheel** for O(1) expiration scheduling
  with just 28 KB of memory overhead."
- "For thundering herd on popular cache misses, we use **probabilistic early
  expiration** where clients independently refresh before TTL expiry with increasing
  probability, spreading the database load."
