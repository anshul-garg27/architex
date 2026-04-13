# Wide-Column Stores

## What Are Wide-Column Stores?

Wide-column stores organize data into **tables** with **rows** and **dynamic columns**.
Unlike relational databases, each row can have a different set of columns, and columns
are grouped into **column families**. They are optimized for **massive scale**,
**high write throughput**, and **distributed architecture**.

```
┌──────────────────────────────────────────────────────────────────┐
│                    Wide-Column Store Concept                     │
│                                                                  │
│  Row Key    │  Column Family: "profile"  │ Column Family: "orders"│
│  ───────────┼────────────────────────────┼────────────────────────│
│  user:1001  │  name="Alice"  age=30      │  ord:001={...}         │
│             │  email="alice@b.com"       │  ord:002={...}         │
│  ───────────┼────────────────────────────┼────────────────────────│
│  user:1002  │  name="Bob"                │  ord:001={...}         │
│             │  (no email -- sparse!)     │                        │
│  ───────────┼────────────────────────────┼────────────────────────│
│  user:1003  │  name="Carol" age=25       │  (no orders yet)       │
│             │  email="c@d.com"           │                        │
│             │  phone="+1-555-0123"       │                        │
└──────────────────────────────────────────────────────────────────┘

Key properties:
  - Rows can have DIFFERENT columns (sparse storage)
  - Column families are defined upfront; columns within are dynamic
  - Data sorted by row key within each partition
  - Optimized for writes (LSM-tree based)
  - Scales horizontally to petabytes
```

---

## Apache Cassandra Deep Dive

Cassandra is a **peer-to-peer**, **masterless**, **distributed** wide-column store
designed for high availability and linear horizontal scalability.

### Ring Architecture

```
                    Token Ring (2^63 range)
                         
                    Token: 0
                      │
               ╭──────┼──────╮
           ╭───┤             ├───╮
       ╭───┤   │   Node A    │   ├───╮
   ╭───┤   │   │ Tokens:     │   │   ├───╮
   │   │   │   │ 0 - 42      │   │   │   │
   │   │   │   ╰─────────────╯   │   │   │
   │   │   │                     │   │   │
   │ Node F│                     │Node B │
   │Tokens:│                     │Tokens:│
   │213-255│                     │43-84  │
   │   │   │                     │   │   │
   │   │   │   ╭─────────────╮   │   │   │
   │   │   │   │   Node E    │   │   │   │
   ╰───┤   │   │ Tokens:     │   │   ├───╯
       ╰───┤   │ 170-212     │   ├───╯
           ╰───┤             ├───╯
               ╰──────┼──────╯
                      │
               ╭──────┼──────╮
           ╭───┤             ├───╮
           │   │   Node D    │   │
           │   │ Tokens:     │   │
           │   │ 128-169     │   │
           │   ╰─────────────╯   │
           │                     │
           │      Node C         │
           │    Tokens: 85-127   │
           ╰─────────────────────╯

Each node owns a range of token values.
Partition key is hashed (Murmur3) to determine token, thus node.
Replication factor (RF=3): data stored on N consecutive nodes.

Virtual Nodes (vnodes):
  Instead of 1 token range per node, each node owns ~256 small ranges.
  Benefits:
    - More even data distribution
    - Faster rebalancing when nodes join/leave
    - Better streaming during repair
```

### Gossip Protocol

```
┌─────────────────────────────────────────────────────────────┐
│                     Gossip Protocol                         │
│                                                             │
│  Every 1 second, each node:                                 │
│    1. Picks 1-3 random nodes                                │
│    2. Sends its view of cluster state (heartbeat + version) │
│    3. Receives peer's view                                  │
│    4. Merges: keeps highest version for each node's state   │
│                                                             │
│  Node A ──gossip──► Node C                                  │
│    "I know: A=v5, B=v3, C=v2, D=v4"                        │
│  Node C ──reply──► Node A                                   │
│    "I know: A=v4, B=v3, C=v6, D=v5"                        │
│  Both merge: A=v5, B=v3, C=v6, D=v5                        │
│                                                             │
│  Failure detection:                                         │
│    - Phi Accrual Failure Detector                           │
│    - Tracks inter-arrival times of gossip messages          │
│    - Calculates probability that node has failed            │
│    - Threshold (default phi=8) triggers DOWN status         │
│    - More nuanced than simple heartbeat timeout             │
└─────────────────────────────────────────────────────────────┘
```

### Write Path

```
Client Write Request
        │
        ▼
┌──────────────┐
│ Coordinator  │   Any node can be coordinator (masterless)
│    Node      │
└──────┬───────┘
       │
       ├──────────────────────────────┐
       │                              │
       ▼                              ▼
┌──────────────┐              ┌──────────────┐
│  Replica 1   │              │  Replica 2   │  (RF=3, writing to 3 nodes)
│              │              │              │
│ ┌──────────┐ │              │ ┌──────────┐ │
│ │1.Commit  │ │              │ │1.Commit  │ │
│ │  Log     │ │ Sequential  │ │  Log     │ │  Commit log = WAL (durability)
│ │(append)  │ │              │ │(append)  │ │
│ └────┬─────┘ │              │ └────┬─────┘ │
│      │       │              │      │       │
│ ┌────▼─────┐ │              │ ┌────▼─────┐ │
│ │2.Memtable│ │              │ │2.Memtable│ │  In-memory sorted structure
│ │(in-memory│ │              │ │(in-memory│ │
│ │  write)  │ │              │ │  write)  │ │
│ └────┬─────┘ │              │ └────┬─────┘ │
│      │       │              │      │       │
│      │ (flush when full)    │      │       │
│ ┌────▼─────┐ │              │ ┌────▼─────┐ │
│ │3.SSTable │ │              │ │3.SSTable │ │  Immutable sorted file on disk
│ │(on disk) │ │              │ │(on disk) │ │
│ └──────────┘ │              │ └──────────┘ │
└──────────────┘              └──────────────┘

Key insight: Writes are SEQUENTIAL (commit log append + memtable insert).
No random I/O on writes -- this is why Cassandra has excellent write throughput.
```

### Read Path

```
Client Read Request
        │
        ▼
┌──────────────┐
│ Coordinator  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│              Read on a Replica Node               │
│                                                   │
│  ┌────────────┐                                   │
│  │ 1. Check   │  Data may be in memory            │
│  │  Memtable  │                                   │
│  └─────┬──────┘                                   │
│        │ (not found? check SSTables)              │
│        ▼                                          │
│  ┌────────────┐                                   │
│  │ 2. Bloom   │  Probabilistic: "Definitely NOT   │
│  │   Filter   │   in this SSTable" or "Maybe in"  │
│  └─────┬──────┘  (avoids useless disk reads)      │
│        │                                          │
│        ▼ (for each SSTable that passes bloom)     │
│  ┌────────────┐                                   │
│  │ 3. Key     │  Sparse index → find offset       │
│  │   Cache    │                                   │
│  │   / Index  │                                   │
│  └─────┬──────┘                                   │
│        │                                          │
│        ▼                                          │
│  ┌────────────┐                                   │
│  │ 4. Read    │  Fetch data from disk              │
│  │  SSTable   │                                   │
│  └─────┬──────┘                                   │
│        │                                          │
│        ▼                                          │
│  ┌────────────┐                                   │
│  │ 5. Merge   │  Merge memtable + SSTable results │
│  │  Results   │  Latest timestamp wins             │
│  └────────────┘                                   │
└──────────────────────────────────────────────────┘
```

### Tunable Consistency

```
Consistency Levels and the R + W > N Formula
─────────────────────────────────────────────

N = Replication Factor (e.g., 3)
R = Read consistency level (replicas to read from)
W = Write consistency level (replicas to ack write)

Rule: R + W > N guarantees strong consistency

┌────────────┬───┬───┬───────────┬────────────────────────────────┐
│ Level      │ R │ W │ R+W > N?  │ Behavior                       │
├────────────┼───┼───┼───────────┼────────────────────────────────┤
│ ONE/ONE    │ 1 │ 1 │ 2 > 3? NO│ Fastest, eventual consistency  │
│ ONE/QUORUM │ 1 │ 2 │ 3 > 3? NO│ Durable writes, stale reads    │
│ QUORUM/ONE │ 2 │ 1 │ 3 > 3? NO│ Fresh reads, writes may be lost│
│ QUORUM/QRM │ 2 │ 2 │ 4 > 3?YES│ Strong consistency (common)    │
│ ALL/ONE    │ 3 │ 1 │ 4 > 3?YES│ Strong, but writes fragile     │
│ ONE/ALL    │ 1 │ 3 │ 4 > 3?YES│ Strong, but writes slow        │
│ ALL/ALL    │ 3 │ 3 │ 6 > 3?YES│ Strongest, worst availability  │
└────────────┴───┴───┴───────────┴────────────────────────────────┘

QUORUM = floor(N/2) + 1 = floor(3/2) + 1 = 2

Most common production setting: QUORUM reads + QUORUM writes
  - Tolerates 1 node failure (out of 3)
  - Strong consistency guaranteed
  - Good balance of latency and durability
```

### Data Modeling

```sql
-- Cassandra data modeling: query-first design
-- Step 1: Define your queries
-- Step 2: Design tables to serve each query

-- Query: "Get all orders for a user, sorted by date"
CREATE TABLE orders_by_user (
    user_id     UUID,
    order_date  TIMESTAMP,
    order_id    UUID,
    total       DECIMAL,
    status      TEXT,
    PRIMARY KEY ((user_id), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC);
-- Partition key: user_id (groups all orders for a user)
-- Clustering key: order_date DESC, order_id (sorted within partition)

-- Query: "Get all orders with a specific status"
CREATE TABLE orders_by_status (
    status      TEXT,
    order_date  TIMESTAMP,
    order_id    UUID,
    user_id     UUID,
    total       DECIMAL,
    PRIMARY KEY ((status), order_date, order_id)
) WITH CLUSTERING ORDER BY (order_date DESC);
-- SAME DATA, DIFFERENT TABLE -- denormalization is expected!

-- Insert into BOTH tables (application responsibility)
INSERT INTO orders_by_user (user_id, order_date, order_id, total, status)
    VALUES (uuid(), '2026-04-07', uuid(), 99.50, 'pending');
INSERT INTO orders_by_status (status, order_date, order_id, user_id, total)
    VALUES ('pending', '2026-04-07', uuid(), uuid(), 99.50);

-- Query examples
SELECT * FROM orders_by_user WHERE user_id = ?;
SELECT * FROM orders_by_user WHERE user_id = ? AND order_date > '2026-01-01';
SELECT * FROM orders_by_status WHERE status = 'pending' LIMIT 50;
```

**Cassandra Modeling Rules:**
1. **No JOINs** -- denormalize data across tables
2. **No subqueries** -- each table serves exactly one query pattern
3. **Partition key = access pattern** -- all data for a query in one partition
4. **Clustering keys define sort order** within a partition
5. **Write multiple tables** -- write the same data to different tables for different queries

### Compaction Strategies

```
┌──────────────────┬───────────────────────────────────────────────┐
│ Strategy         │ How It Works                                  │
├──────────────────┼───────────────────────────────────────────────┤
│ Size-Tiered      │ Merge SSTables of similar size together       │
│ (STCS)           │ Good for: write-heavy workloads               │
│ [Default]        │ Bad: temporary 2x space during compaction,    │
│                  │      read amplification (many SSTables)       │
│                  │                                               │
│                  │  L0: [4MB] [4MB] [4MB] [4MB]                  │
│                  │       └────┬────┘ └────┬────┘                 │
│                  │       [  8MB   ] [  8MB   ]                   │
│                  │          └────────┬───────┘                   │
│                  │          [     16MB      ]                    │
├──────────────────┼───────────────────────────────────────────────┤
│ Leveled          │ SSTables organized into levels (L0, L1, ...)  │
│ (LCS)            │ Each level is 10x the size of previous        │
│                  │ Good for: read-heavy workloads                │
│                  │ Bad: more I/O during compaction (write amp)   │
│                  │                                               │
│                  │  L0: [SST] [SST]     (overlapping allowed)    │
│                  │  L1: [SST][SST][SST] (non-overlapping)        │
│                  │  L2: [SST][SST][SST][SST][SST]...             │
│                  │  Each SSTable ~160MB, no overlap within level  │
├──────────────────┼───────────────────────────────────────────────┤
│ Time-Window      │ Groups SSTables by time window                │
│ (TWCS)           │ Good for: time-series data                    │
│                  │ Old windows are never compacted again          │
│                  │ Pairs well with TTL (entire SSTable dropped)   │
│                  │                                               │
│                  │  Window 1 (Jan): [compacted SST]               │
│                  │  Window 2 (Feb): [compacted SST]               │
│                  │  Window 3 (Mar): [SST] [SST] (being merged)   │
│                  │  Window 4 (Apr): [SST] [SST] [SST] (active)   │
└──────────────────┴───────────────────────────────────────────────┘
```

### Anti-Patterns

```
┌──────────────────────────────────────────────────────────────────┐
│                  Cassandra Anti-Patterns                         │
│                                                                  │
│  1. TOO MANY TOMBSTONES                                          │
│     ─────────────────────                                        │
│     Cassandra doesn't delete data immediately; it writes a       │
│     "tombstone" marker. Tombstones accumulate until compaction   │
│     and gc_grace_seconds expires (default 10 days).              │
│     Problem: Reads scanning many tombstones → timeouts           │
│     Fix: Avoid frequent deletes; use TTLs instead; tune          │
│          gc_grace_seconds; use TWCS for time-series              │
│                                                                  │
│  2. LARGE PARTITIONS                                             │
│     ──────────────────                                           │
│     If one partition key maps to millions of rows:               │
│     - All data on same node (hot spot)                           │
│     - Memory pressure (partition must fit in memory for reads)   │
│     - Compaction struggles                                       │
│     Rule of thumb: keep partitions under 100MB / 100K rows       │
│     Fix: Add a bucket column (e.g., month, shard number) to PK  │
│                                                                  │
│  3. SECONDARY INDEXES ON HIGH-CARDINALITY COLUMNS               │
│     ─────────────────────────────────────────────                │
│     Cassandra secondary indexes are LOCAL (per-node scan).       │
│     High-cardinality = scatter-gather across all nodes.          │
│     Fix: Create a separate denormalized table instead            │
│                                                                  │
│  4. USING CASSANDRA LIKE A RELATIONAL DATABASE                   │
│     ─────────────────────────────────────────                    │
│     No JOINs, no ad-hoc queries, no subqueries.                 │
│     Design tables around queries, not entities.                  │
│                                                                  │
│  5. UNBALANCED PARTITION KEYS                                    │
│     ────────────────────────                                     │
│     Using country or status as partition key → few large          │
│     partitions. Use composite keys or bucketing.                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## HBase

```
┌──────────────────────────────────────────────────────────────────┐
│                          HBase                                   │
│                                                                  │
│  Hadoop ecosystem's wide-column store, modeled after Google      │
│  Bigtable. Strong consistency + CP in CAP theorem.               │
│                                                                  │
│  Architecture:                                                   │
│  ┌───────────────┐                                               │
│  │   HMaster     │  Coordinates region assignment, schema ops    │
│  └───────┬───────┘                                               │
│          │                                                       │
│   ┌──────┼──────┐                                                │
│   ▼      ▼      ▼                                                │
│  ┌────┐ ┌────┐ ┌────┐                                           │
│  │ RS │ │ RS │ │ RS │   Region Servers (data nodes)              │
│  └──┬─┘ └──┬─┘ └──┬─┘                                           │
│     │      │      │                                              │
│  ┌──▼──────▼──────▼──┐                                           │
│  │       HDFS         │   Distributed filesystem (storage)       │
│  └────────────────────┘                                          │
│                                                                  │
│  ┌────────────────────┐                                          │
│  │     ZooKeeper      │   Coordination, master election          │
│  └────────────────────┘                                          │
│                                                                  │
│  Region Server internals:                                        │
│    Write: WAL (Write-Ahead Log) → MemStore → HFile (on HDFS)    │
│    Read:  BlockCache → MemStore → HFiles (with Bloom filters)    │
│                                                                  │
│  Key differences from Cassandra:                                 │
│    - Master-slave (not peer-to-peer)                             │
│    - Strong consistency (CP, not AP)                             │
│    - Depends on HDFS + ZooKeeper                                 │
│    - Better for random reads of large datasets                   │
│    - Native Hadoop/MapReduce integration                         │
│    - Range-partitioned (good for scans, risk of hot spots)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Google Bigtable

```
┌──────────────────────────────────────────────────────────────────┐
│                      Google Bigtable                             │
│                                                                  │
│  The original wide-column store (2006 paper). Managed GCP        │
│  service. Powers Google Search, Maps, Gmail, YouTube.            │
│                                                                  │
│  Data Model:                                                     │
│    Row Key  │  Column Family:cf1       │  Column Family:cf2      │
│    ─────────┼──────────────────────────┼─────────────────────────│
│    row1     │  cf1:col1@t3 = "v3"     │  cf2:colA@t2 = "vA"    │
│             │  cf1:col1@t2 = "v2"     │                         │
│             │  cf1:col2@t1 = "val"    │                         │
│                                                                  │
│  - Cell = (row_key, column_family:qualifier, timestamp) → value  │
│  - Multiple versions per cell (timestamp-indexed)                │
│  - Rows sorted lexicographically by row key                      │
│  - Column families declared at schema time; qualifiers dynamic   │
│                                                                  │
│  Architecture:                                                   │
│    - Tablets: contiguous row ranges (like Cassandra partitions)  │
│    - Tablet servers: serve reads/writes for assigned tablets     │
│    - Data stored in SSTable format on GFS/Colossus               │
│    - Metadata in Chubby (distributed lock service)               │
│                                                                  │
│  Row Key Design (CRITICAL):                                      │
│    GOOD: "device#12345#2026-04-07T10:00"                        │
│      - Distributes writes (device prefix varies)                │
│      - Enables range scans (all readings for a device + time)    │
│    BAD:  "2026-04-07T10:00#device#12345"                        │
│      - Timestamp prefix → all writes go to same tablet (hotspot)│
│                                                                  │
│  Use cases: Time-series, IoT, analytics, ML feature stores       │
│  Latency: Single-digit millisecond                               │
│  Scale: Petabytes, millions of ops/sec                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## ScyllaDB

```
┌──────────────────────────────────────────────────────────────────┐
│                         ScyllaDB                                 │
│                                                                  │
│  Drop-in replacement for Cassandra, rewritten in C++.            │
│  Same CQL interface, same data model, dramatically better        │
│  performance.                                                    │
│                                                                  │
│  Shard-per-Core Architecture:                                    │
│  ┌──────────────────────────────────────────┐                    │
│  │              ScyllaDB Node                │                   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐│                   │
│  │  │Core 0 │ │Core 1 │ │Core 2 │ │Core 3 ││                   │
│  │  │Shard 0│ │Shard 1│ │Shard 2│ │Shard 3││                   │
│  │  │       │ │       │ │       │ │       ││                   │
│  │  │Own    │ │Own    │ │Own    │ │Own    ││                   │
│  │  │memory │ │memory │ │memory │ │memory ││                   │
│  │  │Own    │ │Own    │ │Own    │ │Own    ││                   │
│  │  │I/O    │ │I/O    │ │I/O    │ │I/O    ││                   │
│  │  └───────┘ └───────┘ └───────┘ └───────┘│                   │
│  │  No locks, no contention, no shared state│                   │
│  └──────────────────────────────────────────┘                    │
│                                                                  │
│  Key innovations:                                                │
│    - Seastar framework: async I/O, no thread context switches    │
│    - Each CPU core handles its own data partition independently  │
│    - Eliminates JVM GC pauses (Cassandra's biggest weakness)     │
│    - Automatic workload prioritization                           │
│    - 10x fewer nodes for same throughput as Cassandra            │
│                                                                  │
│  Compatibility:                                                  │
│    - CQL wire protocol compatible                                │
│    - Cassandra drivers work unmodified                           │
│    - SSTable format compatible (can import from Cassandra)       │
│    - DynamoDB-compatible API (Alternator)                        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Comparison Table

```
┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Feature          │ Cassandra    │ HBase        │ Bigtable     │ ScyllaDB     │
├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Architecture     │ Peer-to-peer │ Master-slave │ Managed      │ Peer-to-peer │
│ Consistency      │ Tunable      │ Strong (CP)  │ Strong       │ Tunable      │
│ Language         │ Java         │ Java         │ N/A (managed)│ C++          │
│ Query language   │ CQL          │ Java API     │ gRPC/Java API│ CQL          │
│ Partitioning     │ Consistent   │ Range        │ Range        │ Consistent   │
│                  │ hash (vnodes)│ (regions)    │ (tablets)    │ hash (vnodes)│
│ Dependencies     │ None         │ HDFS,ZK,HMstr│ GCP          │ None         │
│ Write perf       │ Excellent    │ Good         │ Excellent    │ Excellent    │
│ Read perf        │ Good         │ Good (random)│ Excellent    │ Excellent    │
│ GC pauses        │ Yes (JVM)    │ Yes (JVM)    │ N/A          │ No (C++)     │
│ Multi-DC         │ Native       │ Replication  │ Multi-region │ Native       │
│ Operational cost │ Medium       │ High         │ Low (managed)│ Low (fewer   │
│                  │              │              │              │  nodes)      │
│ Best for         │ Write-heavy, │ Hadoop eco,  │ IoT, time-  │ Same as Cass │
│                  │ AP workloads │ analytics    │ series, ML   │ + lower lat  │
│ Compaction       │ STCS/LCS/   │ Size/Stripe/ │ Managed      │ STCS/LCS/   │
│                  │ TWCS         │ Date-tiered  │              │ TWCS/ICS     │
│ Cell versioning  │ No           │ Yes          │ Yes          │ No           │
│ Max row size     │ ~2 billion   │ ~2 billion   │ ~2 billion   │ ~2 billion   │
│                  │ columns      │ columns      │ columns      │ columns      │
└──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## When to Use Wide-Column Stores

```
IDEAL USE CASES:
  [x] Time-series data (IoT sensors, metrics, logs)
  [x] Write-heavy workloads (event tracking, messaging)
  [x] Data with known access patterns (query-first design)
  [x] Multi-datacenter deployments (Cassandra excels)
  [x] Large-scale analytics with high cardinality
  [x] User activity tracking, recommendations

AVOID WHEN:
  [ ] Ad-hoc queries needed (no JOINs, limited WHERE clauses)
  [ ] Strong consistency required everywhere (use HBase/Spanner)
  [ ] Small dataset (< 100GB -- RDBMS is simpler)
  [ ] Complex transactions needed
  [ ] Frequently changing query patterns (each needs its own table)
```

---

## Interview Tips

1. **"Cassandra vs MongoDB?"** -- Cassandra for write-heavy, AP, multi-DC;
   MongoDB for flexible queries, document model, aggregation
2. **"How does Cassandra achieve high write throughput?"** -- Sequential writes:
   commit log append + memtable insert, no random I/O
3. **"What is R+W>N?"** -- Tunable consistency formula: if the number of replicas
   you read from plus write to exceeds replication factor, reads see latest writes
4. **"How to model in Cassandra?"** -- Query-first: one table per query pattern,
   denormalize aggressively, partition key = query predicate
5. **"What happens when a Cassandra node fails?"** -- Gossip detects failure,
   hints stored on coordinator, hinted handoff when node returns, read repair
   on future reads
6. **"Why ScyllaDB over Cassandra?"** -- C++ (no GC pauses), shard-per-core
   (no locks), 10x throughput per node, CQL-compatible migration
