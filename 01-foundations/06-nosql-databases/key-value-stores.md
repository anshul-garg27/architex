# Key-Value Stores

## What Are Key-Value Stores?

The simplest NoSQL data model: every record is a **key** mapped to a **value**.
The store knows nothing about the value's internal structure -- it is an opaque blob
(string, JSON, binary, serialized object). All access is by primary key.

```
┌──────────────────────────────────────────────────────┐
│                  Key-Value Store                     │
│                                                      │
│   Key              Value                             │
│  ─────────────    ──────────────────────────────     │
│  "user:1001"  --> { "name":"Alice", "age":30 }       │
│  "sess:ab12"  --> "eyJhbGciOiJIUzI1NiJ9..."         │
│  "cart:5001"  --> [item1, item2, item3]               │
│  "config:v2"  --> <binary blob>                       │
│                                                      │
│  Operations:  GET key  |  SET key value  |  DEL key  │
│  Complexity:  O(1) read  |  O(1) write               │
└──────────────────────────────────────────────────────┘
```

**Why O(1)?** Values are located via hash table (in-memory) or hash index
(on-disk). No scanning, no joins, no secondary indexes (by default).

---

## Redis Deep Dive

Redis (Remote Dictionary Server) is an **in-memory** data structure store used as
a database, cache, message broker, and streaming engine.

### Data Structures

Redis is far more than a simple key-value store. It provides **rich data structures**
each with specialized commands.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Redis Data Structures                       │
├──────────────┬──────────────────────────────────────────────────┤
│ Structure    │ Description                                      │
├──────────────┼──────────────────────────────────────────────────┤
│ String       │ Binary-safe string up to 512MB                   │
│ List         │ Doubly-linked list of strings                    │
│ Set          │ Unordered collection of unique strings           │
│ Sorted Set   │ Set with float score per member, sorted by score │
│ Hash         │ Field-value map (like a mini document)           │
│ Stream       │ Append-only log with consumer groups             │
│ HyperLogLog  │ Probabilistic cardinality estimator (~0.81% err) │
│ Bitmap       │ Bit-level operations on strings                  │
│ Geospatial   │ Longitude/latitude with radius queries           │
└──────────────┴──────────────────────────────────────────────────┘
```

### Data Structure Use Cases

```bash
# ── STRING: Caching, counters, rate limiting ──
SET page:/home "<html>...</html>" EX 3600   # Cache page for 1 hour
INCR api:rate:user:1001                      # Atomic counter
SETEX lock:order:5001 30 "worker-3"          # Distributed lock (30s TTL)

# ── LIST: Message queues, activity feeds ──
LPUSH queue:emails '{"to":"a@b.com","body":"Hi"}'
BRPOP queue:emails 0                         # Blocking pop (consumer)
LRANGE feed:user:1001 0 49                   # Latest 50 feed items

# ── SET: Tags, unique visitors, social graph ──
SADD tags:post:42 "redis" "nosql" "database"
SINTER followers:alice followers:bob         # Mutual followers
SCARD visitors:2026-04-07                    # Unique visitor count

# ── SORTED SET: Leaderboards, priority queues, rate windows ──
ZADD leaderboard 9500 "player:alice"
ZADD leaderboard 8700 "player:bob"
ZREVRANGE leaderboard 0 9 WITHSCORES        # Top 10 players
ZRANGEBYSCORE delayed:jobs 0 1712512000      # Jobs due before timestamp

# ── HASH: Sessions, user profiles, object caching ──
HSET session:abc123 user_id 1001 role "admin" ip "10.0.0.1"
HGET session:abc123 user_id                  # Get single field
HGETALL session:abc123                       # Get all fields
HINCRBY product:42 view_count 1              # Atomic field increment

# ── STREAM: Event sourcing, CDC, real-time logs ──
XADD events:orders * action "created" order_id "5001" total "99.50"
XREADGROUP GROUP order-processors worker-1 COUNT 10 BLOCK 5000 STREAMS events:orders >
XACK events:orders order-processors 1712512000-0

# ── HYPERLOGLOG: Approximate cardinality (12KB per key!) ──
PFADD unique:pages:/home "user:1001" "user:1002" "user:1001"
PFCOUNT unique:pages:/home                   # Returns ~2

# ── BITMAP: Feature flags, daily active users ──
SETBIT feature:dark-mode 1001 1              # User 1001 has dark mode
BITCOUNT feature:dark-mode                   # How many users opted in
SETBIT active:2026-04-07 1001 1              # User 1001 active today
BITOP AND active:both active:2026-04-06 active:2026-04-07
```

### Pub/Sub

Redis Pub/Sub enables fire-and-forget message broadcasting.

```
┌──────────┐     PUBLISH channel msg     ┌──────────┐
│Publisher 1├────────────────────────────►│          │
└──────────┘                              │  Redis   │
┌──────────┐     PUBLISH channel msg     │  Server  │
│Publisher 2├────────────────────────────►│          │
└──────────┘                              │          │
                                          │          │
              SUBSCRIBE channel           │          │
┌──────────┐◄────────────────────────────┤          │
│Subscriber1│                             │          │
└──────────┘                              │          │
┌──────────┐◄────────────────────────────┤          │
│Subscriber2│  SUBSCRIBE channel          │          │
└──────────┘                              └──────────┘
```

```bash
# Terminal 1 (subscriber)
SUBSCRIBE notifications:user:1001

# Terminal 2 (publisher)
PUBLISH notifications:user:1001 '{"type":"message","from":"bob"}'

# Pattern subscribe
PSUBSCRIBE notifications:user:*
```

**Limitations of Pub/Sub:**
- **No persistence** -- if a subscriber is offline, messages are lost
- **No acknowledgment** -- no guarantee of delivery
- **No consumer groups** -- every subscriber gets every message
- For durable messaging, use **Redis Streams** instead

### Redis Cluster

Redis Cluster provides **horizontal scaling** and **high availability** across
multiple nodes with **automatic sharding**.

```
┌─────────────────────────────────────────────────────────────┐
│                     Redis Cluster                           │
│                                                             │
│  16,384 Hash Slots distributed across master nodes          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Master A    │  │  Master B    │  │  Master C    │       │
│  │ Slots 0-5460│  │ Slots 5461- │  │ Slots 10923-│        │
│  │              │  │     10922    │  │     16383    │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │  Replica A1  │  │  Replica B1  │  │  Replica C1  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Slot assignment:  slot = CRC16(key) mod 16384              │
└─────────────────────────────────────────────────────────────┘
```

**Key Concepts:**
- **Hash Slots**: 16,384 slots, each key maps to one slot via `CRC16(key) % 16384`
- **Hash Tags**: Force related keys to same slot: `{user:1001}:profile`, `{user:1001}:cart`
- **Resharding**: Migrate slots between nodes with zero downtime
- **Gossip Protocol**: Nodes exchange cluster state every 1 second via randomized pings
- **MOVED/ASK redirects**: Client receives redirect if it contacts wrong node

### Redis Sentinel

For HA without sharding (vertical scaling with replicas).

```
┌───────────┐  ┌───────────┐  ┌───────────┐
│ Sentinel 1│  │ Sentinel 2│  │ Sentinel 3│   (odd number, >= 3)
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │
      │    Monitor + Vote           │
      ▼              ▼              ▼
┌───────────┐     ┌───────────┐
│  Master   │────►│  Replica  │
│ (writes)  │     │ (reads)   │
└───────────┘     └───────────┘

Failover steps:
1. Sentinel detects master is down (subjective down)
2. Quorum of sentinels agree (objective down)
3. Sentinel leader elected (Raft-like)
4. Leader promotes replica to master
5. Other replicas reconfigured to replicate from new master
6. Clients notified of new master address
```

### Persistence: RDB vs AOF

```
┌──────────────────┬────────────────────────┬────────────────────────┐
│ Feature          │ RDB (Snapshots)        │ AOF (Append-Only File) │
├──────────────────┼────────────────────────┼────────────────────────┤
│ How it works     │ Point-in-time binary   │ Logs every write       │
│                  │ dump (fork + CoW)      │ command                │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Data loss risk   │ Up to last snapshot    │ At most 1 second       │
│                  │ interval               │ (with everysec)        │
├──────────────────┼────────────────────────┼────────────────────────┤
│ File size        │ Compact (compressed)   │ Larger (all commands)  │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Restart speed    │ Fast (load binary)     │ Slower (replay cmds)   │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Performance      │ No impact between      │ fsync can cause        │
│ impact           │ snapshots              │ latency spikes         │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Recommended      │ Backups, disaster      │ Durability-critical    │
│ for              │ recovery               │ applications           │
├──────────────────┼────────────────────────┼────────────────────────┤
│ Best practice    │ Use BOTH: AOF for durability + RDB for backups  │
└──────────────────┴─────────────────────────────────────────────────┘

AOF fsync policies:
  - always:    fsync every write (safest, slowest)
  - everysec:  fsync once per second (good balance -- DEFAULT)
  - no:        let OS decide (fastest, riskiest)

AOF Rewrite:  Periodically rewrite AOF to remove redundant commands
              (e.g., 1000 INCRs become one SET with final value)
```

### Lua Scripting for Atomic Operations

Redis executes Lua scripts **atomically** -- no other command runs during execution.

```lua
-- Rate limiter: allow 100 requests per 60 seconds
-- KEYS[1] = rate limit key, ARGV[1] = limit, ARGV[2] = window
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[2])
end
if current > tonumber(ARGV[1]) then
    return 0  -- rate limited
end
return 1      -- allowed
```

```bash
# Execute from client
EVAL "local current = redis.call('INCR', KEYS[1]) ..." 1 rate:user:1001 100 60

# Pre-load for repeated use (returns SHA)
SCRIPT LOAD "local current = redis.call('INCR', KEYS[1]) ..."
EVALSHA <sha> 1 rate:user:1001 100 60
```

**Why Lua over transactions (MULTI/EXEC)?**
- MULTI/EXEC cannot read intermediate values -- commands are queued blindly
- Lua can branch on intermediate results (read-then-write atomically)
- Lua runs as a single operation -- true atomicity, not just isolation

### Eviction Policies

When Redis hits `maxmemory`, it must evict keys to make room.

```
┌─────────────────┬──────────────────────────────────────────────┐
│ Policy          │ Behavior                                      │
├─────────────────┼──────────────────────────────────────────────┤
│ noeviction      │ Return error on writes when memory full       │
│ allkeys-lru     │ Evict least recently used key (any key)       │
│ allkeys-lfu     │ Evict least frequently used key (any key)     │
│ allkeys-random  │ Evict random key                              │
│ volatile-lru    │ LRU among keys WITH an expire set             │
│ volatile-lfu    │ LFU among keys WITH an expire set             │
│ volatile-random │ Random among keys WITH an expire set          │
│ volatile-ttl    │ Evict keys with shortest TTL first            │
└─────────────────┴──────────────────────────────────────────────┘

Recommended:
  - Pure cache:          allkeys-lru  (or allkeys-lfu for skewed access)
  - Mixed cache + data:  volatile-lru (only evict keys with TTL)
  - Must not lose data:  noeviction   (handle errors in application)
```

---

## Memcached

Memcached is a simpler, multi-threaded, in-memory key-value cache.

```
┌──────────────────────────────────────────────────────────┐
│                     Memcached                            │
│                                                          │
│  - Multi-threaded (leverages all CPU cores)              │
│  - Simple key-value only (no data structures)            │
│  - Max value size: 1MB (default, configurable)           │
│  - Max key size: 250 bytes                               │
│  - No persistence (pure cache)                           │
│  - No replication (client handles distribution)          │
│  - Slab allocator to minimize fragmentation              │
│  - LRU eviction per slab class                           │
│  - Text and binary protocols                             │
│                                                          │
│  Client-side consistent hashing:                         │
│                                                          │
│        Hash Ring                                         │
│         ╭─────╮                                          │
│       ╭─┤ S1  ├─╮     Nodes placed on ring               │
│      S3 ╰─────╯ S2    Key hashed to position             │
│       ╰────┬────╯      Walk clockwise to find node       │
│            │           Adding/removing node only          │
│         Virtual         affects adjacent segment          │
│         Nodes                                            │
└──────────────────────────────────────────────────────────┘
```

```bash
# Memcached commands
set user:1001 0 3600 45        # key, flags, TTL(sec), byte-count
{"name":"Alice","role":"admin"}

get user:1001                   # retrieve
delete user:1001                # remove
incr counter:page_views 1       # atomic increment
```

---

## DynamoDB

Amazon DynamoDB is a fully managed, serverless, wide key-value store designed
for single-digit millisecond latency at any scale.

### Table Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    DynamoDB Table                                │
│                                                                 │
│  Primary Key = Partition Key (PK) + optional Sort Key (SK)      │
│                                                                 │
│  ┌────────────┬────────────┬──────────┬──────────┬───────────┐ │
│  │ PK         │ SK         │ name     │ email    │ orders    │ │
│  ├────────────┼────────────┼──────────┼──────────┼───────────┤ │
│  │ USER#1001  │ PROFILE    │ Alice    │ a@b.com  │           │ │
│  │ USER#1001  │ ORDER#001  │          │          │ {...}     │ │
│  │ USER#1001  │ ORDER#002  │          │          │ {...}     │ │
│  │ USER#1002  │ PROFILE    │ Bob      │ b@c.com  │           │ │
│  │ USER#1002  │ ORDER#001  │          │          │ {...}     │ │
│  └────────────┴────────────┴──────────┴──────────┴───────────┘ │
│                                                                 │
│  Query: PK = "USER#1001" AND SK begins_with("ORDER#")          │
│  Result: All orders for user 1001 (efficient, single partition) │
└─────────────────────────────────────────────────────────────────┘
```

### Secondary Indexes

```
┌───────────────────────────────────────────────────────────────────┐
│  GSI (Global Secondary Index)      │  LSI (Local Secondary Index) │
├────────────────────────────────────┼──────────────────────────────┤
│ Different partition key + sort key │ Same partition key, diff sort │
│ Separate throughput provisioning   │ Shares base table throughput  │
│ Eventually consistent only         │ Supports strong consistency   │
│ Can be added anytime               │ Must be created with table    │
│ Max 20 per table                   │ Max 5 per table               │
│ Has its own partition space        │ Co-located with base table    │
└────────────────────────────────────┴──────────────────────────────┘

Example GSI -- query orders by status:
  GSI PK = "status"  GSI SK = "order_date"
  Query: status = "PENDING" AND order_date > "2026-04-01"
```

### Capacity Modes

```
┌──────────────────────┬──────────────────────────────────────────┐
│ Provisioned Mode     │ On-Demand Mode                          │
├──────────────────────┼──────────────────────────────────────────┤
│ You set RCU and WCU  │ Pay per request                         │
│ Auto-scaling option  │ No capacity planning needed              │
│ Cheaper at scale     │ More expensive per request               │
│ Throttled if exceeded│ Handles spikes automatically             │
│ Good for predictable │ Good for unpredictable or new workloads  │
│ workloads            │                                          │
└──────────────────────┴──────────────────────────────────────────┘

Capacity Units:
  1 RCU = 1 strongly consistent read/sec (up to 4KB)
        = 2 eventually consistent reads/sec (up to 4KB)
  1 WCU = 1 write/sec (up to 1KB)
```

### DAX (DynamoDB Accelerator)

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  App     │────►│   DAX    │────►│  DynamoDB    │
│  Server  │     │  Cluster │     │  Table       │
└──────────┘     │(in-memory│     └──────────────┘
                 │  cache)  │
                 └──────────┘

- Microsecond read latency (vs millisecond for DynamoDB)
- Write-through cache (writes go to DynamoDB, cache updated)
- API-compatible (drop-in replacement, change endpoint only)
- Item cache + query cache
- Good for read-heavy workloads
- NOT good for: write-heavy, strongly consistent reads needed
```

### Global Tables (Multi-Region)

```
         ┌────────────────┐
         │  Global Table  │
         └───────┬────────┘
        ┌────────┼────────┐
        ▼        ▼        ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │us-east-1 │ │eu-west-1 │ │ap-east-1 │
  │ (replica)│ │ (replica)│ │ (replica)│
  └──────────┘ └──────────┘ └──────────┘

- Active-active: writes accepted in any region
- Replication latency: typically < 1 second
- Conflict resolution: last-writer-wins (based on timestamp)
- Requires DynamoDB Streams enabled
- All replicas eventually consistent with each other
```

### Single-Table Design Pattern

The recommended DynamoDB pattern: store **all entity types** in one table.
Use composite keys and GSI overloading to support all access patterns.

```
┌──────────────┬──────────────────┬──────────┬──────────┬──────────┐
│ PK           │ SK               │ GSI1PK   │ GSI1SK   │ Data     │
├──────────────┼──────────────────┼──────────┼──────────┼──────────┤
│ USER#alice   │ METADATA         │ alice@.. │ USER     │ {name,..}│
│ USER#alice   │ ORDER#2026-04-01 │ PENDING  │ 2026-04  │ {total,} │
│ USER#alice   │ ORDER#2026-03-15 │ SHIPPED  │ 2026-03  │ {total,} │
│ ORG#acme     │ METADATA         │ acme.com │ ORG      │ {plan,..}│
│ ORG#acme     │ USER#alice       │ alice@.. │ MEMBER   │ {role,..}│
└──────────────┴──────────────────┴──────────┴──────────┴──────────┘

Access patterns served:
  - Get user profile:           PK = USER#alice, SK = METADATA
  - Get user's orders:          PK = USER#alice, SK begins_with("ORDER#")
  - Get orders by status:       GSI1 PK = "PENDING"
  - Get org members:            PK = ORG#acme, SK begins_with("USER#")
  - Find user by email:         GSI1 PK = "alice@.."
```

### Conditional Writes for Optimistic Locking

```python
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Products')

# Read item with version
item = table.get_item(Key={'PK': 'PRODUCT#42'})['Item']
current_version = item['version']

# Conditional write -- only succeeds if version hasn't changed
try:
    table.update_item(
        Key={'PK': 'PRODUCT#42'},
        UpdateExpression='SET stock = stock - :qty, version = :new_v',
        ConditionExpression='version = :curr_v',
        ExpressionAttributeValues={
            ':qty': 1,
            ':curr_v': current_version,
            ':new_v': current_version + 1
        }
    )
except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
    # Another writer changed the item -- retry or abort
    pass
```

---

## Redis vs Memcached vs DynamoDB

```
┌───────────────────┬──────────────┬──────────────┬────────────────┐
│ Feature           │ Redis        │ Memcached    │ DynamoDB       │
├───────────────────┼──────────────┼──────────────┼────────────────┤
│ Data model        │ Rich structs │ Simple KV    │ KV + Document  │
│ Storage           │ In-memory    │ In-memory    │ SSD (managed)  │
│ Persistence       │ RDB + AOF    │ None         │ Durable (auto) │
│ Max value size    │ 512 MB       │ 1 MB         │ 400 KB item    │
│ Threading         │ Single*      │ Multi        │ Managed        │
│ Replication       │ Master-Replica│ None (client)│ Multi-region  │
│ Clustering        │ Hash slots   │ Client-side  │ Auto-partition │
│ TTL support       │ Per-key      │ Per-key      │ Per-item (TTL) │
│ Transactions      │ MULTI/EXEC   │ CAS only     │ TransactWrite  │
│ Scripting         │ Lua          │ None         │ None           │
│ Pub/Sub           │ Yes          │ No           │ Streams (DDB)  │
│ Consistency       │ Eventual     │ N/A          │ Strong/Eventual│
│ Ops burden        │ Self-managed │ Self-managed │ Fully managed  │
│ Cost model        │ Infrastructure│ Infrastructure│ Pay-per-use  │
│ Latency           │ Sub-ms       │ Sub-ms       │ Single-digit ms│
│ Best for          │ Cache + more │ Pure cache   │ Serverless KV  │
└───────────────────┴──────────────┴──────────────┴────────────────┘

* Redis 7+ uses I/O threads for network, but commands still single-threaded.
```

---

## When to Use Key-Value Stores

```
USE Key-Value stores when:
  [x] Access patterns are simple: get by key, put by key
  [x] Ultra-low latency is required (caching, session store)
  [x] Schema is flexible or varies per record
  [x] No complex queries or joins needed
  [x] High throughput at scale

AVOID when:
  [ ] You need complex queries (joins, aggregations)
  [ ] You need ACID transactions across multiple keys
  [ ] Data relationships are important
  [ ] You need to search by value contents (use document or search)
```

### Real-World Architecture: E-Commerce Session + Cart

```
┌──────────────┐         ┌──────────────────┐
│   Web App    │         │     Redis         │
│              │         │                   │
│  Login ──────┼────────►│ HSET session:abc  │  Session store
│              │         │   user_id 1001    │  (Hash)
│              │         │   role "user"     │
│              │         │   expires 3600    │
│              │         │                   │
│  Add to ─────┼────────►│ SADD cart:1001    │  Shopping cart
│  Cart        │         │   "sku:A1" "sku:B2"│ (Set)
│              │         │                   │
│  View ───────┼────────►│ ZREVRANGE         │  Trending
│  Trending    │         │   trending:today  │  products
│              │         │   0 9 WITHSCORES  │  (Sorted Set)
│              │         │                   │
│  Rate ───────┼────────►│ EVAL rate_limit   │  Rate limiting
│  Limit       │         │   rate:api:1001   │  (Lua + String)
└──────────────┘         └──────────────────┘
```

---

## Interview Tips

1. **"Design a rate limiter"** -- Redis + Lua sliding window or token bucket
2. **"Design a leaderboard"** -- Redis Sorted Sets with ZADD/ZREVRANGE
3. **"Cache invalidation strategy"** -- TTL + event-driven invalidation via Pub/Sub
4. **"Session management at scale"** -- Redis Hash with Sentinel/Cluster for HA
5. **"When Redis vs DynamoDB?"** -- Redis for ephemeral + low latency; DynamoDB for durable + serverless
6. **"What happens when Redis master fails?"** -- Sentinel detects, quorum agrees, promotes replica
7. **"Hot partition in DynamoDB?"** -- Bad partition key choice; fix with composite keys or write sharding
