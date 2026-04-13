# SQL vs NoSQL Decision Framework

---

## Decision Framework Table

```
┌──────────────────────┬───────────────────────┬───────────────────────┐
│ Criteria             │ Favor SQL             │ Favor NoSQL           │
├──────────────────────┼───────────────────────┼───────────────────────┤
│ 1. Schema            │ Fixed, well-defined   │ Flexible, evolving    │
│ 2. Relationships     │ Complex JOINs needed  │ Minimal or embedded   │
│ 3. Transactions      │ Multi-row ACID needed │ Single-doc sufficient │
│ 4. Query patterns    │ Ad-hoc, complex       │ Known, simple lookups │
│ 5. Scale             │ Vertical (up)         │ Horizontal (out)      │
│ 6. Consistency       │ Strong always         │ Eventual acceptable   │
│ 7. Write throughput  │ Moderate              │ Very high             │
│ 8. Read latency      │ Index-driven          │ Key-based sub-ms      │
│ 9. Data volume       │ < 10 TB typical       │ Petabytes possible    │
│ 10. Team expertise   │ SQL widely known      │ Specific DB knowledge │
│ 11. Maturity         │ Decades of tooling    │ Newer, less tooling   │
│ 12. Normalization    │ 3NF / BCNF expected   │ Denormalization OK    │
│ 13. Reporting/BI     │ SQL is lingua franca  │ Often needs ETL       │
│ 14. Development speed│ Schema migrations slow│ Schema-less = faster  │
│ 15. Ops complexity   │ Single node simpler   │ Distributed = complex │
└──────────────────────┴───────────────────────┴───────────────────────┘
```

---

## Storage Internals Comparison

### LSM Tree (Log-Structured Merge Tree)

Used by: Cassandra, HBase, LevelDB, RocksDB, ScyllaDB, InfluxDB.

```
Write Path (optimized for WRITES):

  Client Write
      │
      ▼
  ┌──────────────┐
  │ WAL (Write-  │   1. Append to write-ahead log (sequential I/O)
  │ Ahead Log)   │      Durability guarantee
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  MemTable    │   2. Insert into in-memory sorted structure
  │ (Sorted, e.g.│      (red-black tree or skip list)
  │  skip list)  │      O(log n) insert
  └──────┬───────┘
         │ (when MemTable is full, ~64MB)
         ▼
  ┌──────────────┐
  │  Immutable   │   3. MemTable becomes immutable
  │  MemTable    │      New MemTable created for writes
  └──────┬───────┘
         │ (flush to disk)
         ▼
  ┌──────────────┐
  │  SSTable     │   4. Written as sorted, immutable file on disk
  │  (Level 0)   │      (Sorted String Table)
  └──────┬───────┘
         │
         │  Compaction (background process)
         │
         ▼
  ┌──────────────────────────────────────────────────────┐
  │                     Disk (SSTables)                   │
  │                                                      │
  │  Level 0:  [SST-1] [SST-2] [SST-3]  (may overlap)   │
  │                 └────┬────┘                           │
  │  Level 1:  [SST-A] [SST-B] [SST-C]  (no overlap)    │
  │                      └───┬──┘                        │
  │  Level 2:  [SST-X] [SST-Y] [SST-Z] [SST-W]         │
  │                                                      │
  │  Each level ~10x the size of previous                │
  │  Compaction: merge overlapping SSTables              │
  │              discard obsolete versions                │
  │              produce non-overlapping files            │
  └──────────────────────────────────────────────────────┘

Read Path:
  1. Check MemTable (in-memory, most recent)
  2. Check immutable MemTable (if exists)
  3. For each SSTable level (newest first):
     a. Check Bloom filter ("definitely not here" vs "maybe here")
     b. If Bloom says maybe → check sparse index → read data block
  4. Merge results, return latest version

Write amplification:
  Each piece of data may be written multiple times through compaction.
  Total writes = original write + L0→L1 merge + L1→L2 merge + ...
  Write amplification factor = total_bytes_written / user_bytes_written
  Typical: 10-30x for leveled compaction
```

### B+ Tree

Used by: PostgreSQL, MySQL (InnoDB), Oracle, SQL Server, SQLite.

```
B+ Tree Structure:

                    ┌─────────────────┐
                    │   Root Node     │
                    │  [30 | 60 | 90] │
                    └──┬────┬────┬──┬─┘
              ┌────────┘    │    │  └────────┐
              ▼             ▼    ▼           ▼
        ┌──────────┐  ┌──────────┐    ┌──────────┐
        │ [10 | 20]│  │ [40 | 50]│    │ [70 | 80]│  Internal nodes
        └──┬───┬──┬┘  └──┬───┬──┬┘    └──┬───┬──┬┘  (routing only)
           │   │  │      │   │  │        │   │  │
           ▼   ▼  ▼      ▼   ▼  ▼        ▼   ▼  ▼
        ┌────┐┌──┐┌──┐ ┌──┐┌──┐┌──┐  ┌──┐┌──┐┌──┐
        │5,8 ││12││22│ │35││42││55│  │65││75││85│  Leaf nodes
        │    ││15││25│ │38││48││58│  │68││78││88│  (actual data)
        └──┬─┘└┬─┘└┬─┘ └┬─┘└┬─┘└┬─┘  └┬─┘└┬─┘└┬─┘
           └───┴───┘     └───┴───┘      └───┴───┘
           Leaf nodes linked for range scans ──────►

Properties:
  - Balanced: all leaf nodes at same depth
  - High fanout: each node holds many keys (page-sized, ~4-16KB)
  - Leaf nodes: contain data (or pointers to data rows)
  - Leaf nodes: doubly linked for efficient range scans
  - Depth: typically 3-4 levels for billions of rows
  - Lookup: O(log_b(n)) where b = branching factor (~100-500)

Write Path:
  1. Find correct leaf node (tree traversal)
  2. Insert key-value into leaf
  3. If leaf is full → split into two leaves
  4. Propagate split up to parent (may cascade)
  5. Writes are RANDOM I/O (must update in-place)

Read Path:
  1. Start at root
  2. Binary search within node to find child pointer
  3. Descend to child node
  4. Repeat until leaf node
  5. For range: follow leaf node pointers
```

### LSM Tree vs B+ Tree Comparison

```
┌────────────────────┬──────────────────────┬──────────────────────┐
│ Property           │ LSM Tree             │ B+ Tree              │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Write performance  │ Excellent            │ Good                 │
│                    │ (sequential I/O)     │ (random I/O)         │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Read performance   │ Good (may check      │ Excellent            │
│                    │ multiple SSTables)   │ (single tree walk)   │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Space amplification│ Higher (multiple     │ Lower (in-place      │
│                    │ versions until       │ updates, ~1x)        │
│                    │ compaction)          │                      │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Write amplification│ Higher (compaction   │ Lower (write once +  │
│                    │ rewrites data, ~10x) │ occasional splits)   │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Read amplification │ Higher (check bloom  │ Lower (one tree path)│
│                    │ + multiple levels)   │                      │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Range scans        │ Requires merge of    │ Excellent (linked    │
│                    │ multiple sources     │ leaf nodes)          │
├────────────────────┼──────────────────────┼──────────────────────┤
│ SSD friendliness   │ Better (sequential   │ Worse (random writes │
│                    │ writes, less wear)   │ cause more wear)     │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Concurrent writes  │ Better (no contention│ Worse (page-level    │
│                    │ on same page)        │ locking)             │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Predictable latency│ Worse (compaction    │ Better (consistent   │
│                    │ spikes)              │ tree walks)          │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Compression        │ Better (sorted runs  │ Worse (pages have    │
│                    │ compress well)       │ internal frag)       │
├────────────────────┼──────────────────────┼──────────────────────┤
│ Best for           │ Write-heavy,         │ Read-heavy,          │
│                    │ append-only,         │ OLTP, point lookups, │
│                    │ time-series          │ range scans          │
└────────────────────┴──────────────────────┴──────────────────────┘
```

---

## Polyglot Persistence

Real-world applications use **multiple database types**, each chosen for the
access pattern it serves best.

```
┌──────────────────────────────────────────────────────────────────────┐
│              E-Commerce Platform: Polyglot Persistence              │
│                                                                      │
│  ┌────────────────┐     ┌──────────────────┐                        │
│  │   PostgreSQL   │     │     Redis         │                       │
│  │  (Primary DB)  │     │  (Cache + State)  │                       │
│  │                │     │                   │                       │
│  │ - Users        │     │ - Session store   │                       │
│  │ - Orders       │     │ - Shopping cart   │                       │
│  │ - Payments     │     │ - Rate limiting   │                       │
│  │ - Inventory    │     │ - Leaderboard     │                       │
│  │ (ACID needed)  │     │ - Page cache      │                       │
│  └────────┬───────┘     └────────┬──────────┘                       │
│           │                      │                                   │
│  ┌────────▼───────┐     ┌────────▼──────────┐                       │
│  │ Elasticsearch  │     │    MongoDB        │                       │
│  │   (Search)     │     │  (Catalog)        │                       │
│  │                │     │                   │                       │
│  │ - Product      │     │ - Product details │                       │
│  │   search       │     │   (varied schema) │                       │
│  │ - Autocomplete │     │ - Reviews         │                       │
│  │ - Faceted nav  │     │ - User-generated  │                       │
│  │ - Log analysis │     │   content         │                       │
│  └────────┬───────┘     └────────┬──────────┘                       │
│           │                      │                                   │
│  ┌────────▼───────┐     ┌────────▼──────────┐     ┌───────────────┐ │
│  │   InfluxDB     │     │    Neo4j          │     │   Pinecone    │ │
│  │ (Monitoring)   │     │  (Recommendations)│     │  (AI Search)  │ │
│  │                │     │                   │     │               │ │
│  │ - Server       │     │ - "Users who      │     │ - Semantic    │ │
│  │   metrics      │     │   bought also     │     │   product     │ │
│  │ - Business     │     │   bought"         │     │   search      │ │
│  │   KPIs         │     │ - Social features │     │ - Image       │ │
│  │ - Real-time    │     │ - Fraud detection │     │   similarity  │ │
│  │   dashboards   │     │                   │     │               │ │
│  └────────────────┘     └───────────────────┘     └───────────────┘ │
│                                                                      │
│  Data Flow:                                                          │
│    PostgreSQL ──CDC──► Elasticsearch (search index sync)             │
│    PostgreSQL ──CDC──► Neo4j (relationship graph sync)               │
│    All services ──► InfluxDB (metrics collection)                    │
│    MongoDB ──embed──► Pinecone (product embeddings)                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Polyglot Persistence Trade-offs:**
- (+) Each DB is optimal for its workload
- (+) Independent scaling per workload type
- (-) Operational complexity (manage 6 different databases)
- (-) Data consistency across systems (eventual consistency, CDC lag)
- (-) Team must learn multiple technologies
- (-) More failure modes

---

## NewSQL Databases

NewSQL databases aim to provide the **scalability of NoSQL** with the
**ACID guarantees and SQL interface of traditional RDBMS**.

### CockroachDB

```
┌──────────────────────────────────────────────────────────────────┐
│                      CockroachDB                                 │
│                                                                  │
│  Distributed SQL database inspired by Google Spanner.            │
│                                                                  │
│  Key concepts:                                                   │
│    - Raft consensus: every range (partition) has a Raft group    │
│    - Range partitioning: data split into ~512MB ranges           │
│    - Serializable isolation (strongest level)                    │
│    - Distributed transactions via parallel commits               │
│    - Geo-partitioning: pin data to specific regions              │
│    - Automatic rebalancing as nodes join/leave                   │
│                                                                  │
│  Architecture:                                                   │
│  ┌────────────────────────────────────────────┐                 │
│  │           SQL Layer (Gateway)               │                │
│  │  Parse → Optimize → Distribute → Execute    │                │
│  └───────────────────┬────────────────────────┘                 │
│                      │                                           │
│  ┌───────────────────▼────────────────────────┐                 │
│  │         Transaction Layer                   │                │
│  │  MVCC + Hybrid Logical Clock (HLC)          │                │
│  └───────────────────┬────────────────────────┘                 │
│                      │                                           │
│  ┌───────────────────▼────────────────────────┐                 │
│  │         Distribution Layer                  │                │
│  │  Ranges + Raft consensus groups             │                │
│  └───────────────────┬────────────────────────┘                 │
│                      │                                           │
│  ┌───────────────────▼────────────────────────┐                 │
│  │         Storage Layer (Pebble/RocksDB)      │                │
│  │  LSM-tree based key-value storage           │                │
│  └────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────┘
```

### Google Spanner

```
┌──────────────────────────────────────────────────────────────────┐
│                     Google Spanner                               │
│                                                                  │
│  Globally distributed, strongly consistent database.             │
│  The first system to provide global ACID at scale.               │
│                                                                  │
│  TrueTime API:                                                   │
│    - GPS receivers + atomic clocks in every datacenter           │
│    - Returns interval [earliest, latest] for current time        │
│    - Commit waits until TrueTime uncertainty window passes       │
│    - Guarantees: if T1 commits before T2 starts, T1's timestamp │
│      is less than T2's timestamp (external consistency)          │
│                                                                  │
│  Why it matters:                                                 │
│    Traditional distributed systems: "you can't trust clocks"     │
│    Spanner: "we made clocks trustworthy with hardware"           │
│    Result: global strong consistency without blocking reads      │
│                                                                  │
│  Features:                                                       │
│    - SQL interface (ANSI SQL compliant)                          │
│    - Schematized semi-relational data model                      │
│    - Synchronous replication across regions                       │
│    - Automatic sharding and resharding                           │
│    - 99.999% SLA (5 nines)                                      │
│    - Read-only transactions: lock-free, snapshot reads           │
└──────────────────────────────────────────────────────────────────┘
```

### NewSQL Comparison

```
┌────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Feature        │ CockroachDB  │ Spanner      │ TiDB         │ YugabyteDB   │
├────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ SQL dialect    │ PostgreSQL   │ ANSI SQL     │ MySQL        │ PostgreSQL   │
│                │ compatible   │              │ compatible   │ + Cassandra  │
│ Consistency    │ Serializable │ External     │ Snapshot     │ Serializable │
│ Consensus      │ Raft         │ Paxos        │ Raft         │ Raft         │
│ Partitioning   │ Range        │ Range        │ Range        │ Range + Hash │
│ Storage engine │ Pebble (LSM) │ Custom SST   │ RocksDB(LSM) │ RocksDB(LSM) │
│ Clock sync     │ HLC          │ TrueTime     │ TSO (server) │ HLC          │
│                │              │ (GPS+atomic) │              │              │
│ Geo-partition  │ Yes          │ Yes          │ Placement    │ Yes          │
│                │              │              │ rules        │              │
│ License        │ BSL/Apache   │ GCP only     │ Apache 2.0   │ Apache 2.0   │
│ HTAP           │ No           │ No           │ Yes (TiFlash)│ No           │
│ Best for       │ Global apps, │ Global,      │ MySQL users  │ PostgreSQL   │
│                │ PostgreSQL   │ financial,   │ needing scale│ users needing│
│                │ migration    │ 5-9s SLA     │ + analytics  │ geo-distrib  │
└────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘

HTAP = Hybrid Transactional/Analytical Processing
  TiDB stores row data in TiKV (OLTP) and columnar data in TiFlash (OLAP)
  simultaneously, serving both workloads from one system.
```

---

## Decision Flowchart

```
                        START
                          │
                          ▼
                 ┌────────────────────┐
                 │  Need ACID across  │
                 │  multiple rows?    │
                 └────────┬───────────┘
                    YES   │    NO
              ┌───────────┴───────────┐
              ▼                       ▼
     ┌────────────────┐     ┌────────────────────┐
     │ Need global    │     │  Data model fits   │
     │ scale (multi-  │     │  key-value?        │
     │ region)?       │     └────────┬───────────┘
     └───────┬────────┘        YES   │    NO
        YES  │  NO         ┌────────┴────────┐
     ┌───────┴──────┐      ▼                 ▼
     ▼              ▼  ┌──────────┐  ┌────────────────┐
  ┌────────┐  ┌──────┐│  Redis/  │  │ Flexible       │
  │NewSQL  │  │ SQL  ││ DynamoDB │  │ schema with    │
  │Spanner,│  │Postgr││          │  │ rich queries?  │
  │CockDB  │  │MySQL ││(in-memory│  └────────┬───────┘
  └────────┘  └──────┘│ or       │     YES   │    NO
                      │ managed) │  ┌────────┴────────┐
                      └──────────┘  ▼                 ▼
                               ┌──────────┐  ┌────────────────┐
                               │ MongoDB  │  │ Write-heavy,   │
                               │ Firestore│  │ known access   │
                               │ Couchbase│  │ patterns?      │
                               └──────────┘  └────────┬───────┘
                                               YES    │    NO
                                            ┌─────────┴────────┐
                                            ▼                  ▼
                                      ┌──────────┐    ┌────────────────┐
                                      │Cassandra │    │ Relationships  │
                                      │HBase     │    │ are primary    │
                                      │ScyllaDB  │    │ concern?       │
                                      └──────────┘    └────────┬───────┘
                                                         YES   │   NO
                                                      ┌────────┴───────┐
                                                      ▼                ▼
                                                ┌──────────┐   ┌────────────┐
                                                │ Neo4j    │   │Time-series?│
                                                │ Neptune  │   │→InfluxDB   │
                                                └──────────┘   │Search?     │
                                                               │→Elastic    │
                                                               │Vectors?    │
                                                               │→Pinecone   │
                                                               └────────────┘
```

---

## Interview Questions with Answers

### Q1: "When would you choose NoSQL over SQL?"

**Answer:** I would choose NoSQL when:
- Access patterns are simple and known upfront (key lookups, time-range scans)
- Schema is flexible or varies per entity (product catalogs)
- Horizontal scalability is critical (petabyte-scale data, millions of ops/sec)
- Availability is more important than immediate consistency (AP systems)
- Write throughput requirements exceed what a single RDBMS node can handle

I would stick with SQL when strong ACID transactions across entities are needed
(financial systems), complex ad-hoc queries are common (analytics, reporting),
or the data is naturally relational with many JOINs.

### Q2: "How do you handle transactions in a NoSQL system?"

**Answer:** Several strategies depending on requirements:
1. **Single-document atomicity** (MongoDB, DynamoDB): design data model so related
   data is in one document/item -- updates are atomic at document level
2. **Optimistic concurrency control**: conditional writes with version numbers
   (DynamoDB ConditionExpression, MongoDB findOneAndUpdate with version check)
3. **Saga pattern**: sequence of local transactions with compensating actions
   for rollback (common in microservices)
4. **Multi-document transactions** (MongoDB 4.0+, DynamoDB TransactWriteItems):
   ACID across multiple documents, but with performance overhead
5. **Application-level idempotency**: design operations to be safely retried

### Q3: "You are designing a social media platform. Which databases?"

**Answer:**
- **PostgreSQL**: User accounts, authentication, payments (ACID)
- **Redis**: Session store, news feed cache, real-time counters (likes), rate limiting
- **Cassandra**: User activity timeline, notifications (write-heavy, time-ordered)
- **Neo4j or PostgreSQL graph extension**: Social graph (followers, recommendations)
- **Elasticsearch**: Post search, hashtag search, user search
- **Object storage (S3)**: Images, videos
- **CDN**: Static content delivery

### Q4: "LSM tree vs B+ tree -- when to use which?"

**Answer:**
- **LSM tree** (Cassandra, RocksDB): Write-heavy workloads. Writes are sequential
  I/O (append to WAL + memtable), no random I/O. Trade-off is read amplification
  (checking multiple SSTables) and compaction overhead.
- **B+ tree** (PostgreSQL, MySQL): Read-heavy or balanced workloads. Point lookups
  and range scans are efficient (single tree walk, linked leaf nodes). Writes
  require random I/O (find and update the correct page). Better latency
  predictability (no compaction spikes).

### Q5: "What is the CAP theorem and how do real databases handle it?"

**Answer:**
CAP states that during a **network partition**, a distributed system must choose
between **consistency** (all reads see latest write) and **availability** (every
request receives a response).

In practice, partitions are rare, so the real trade-off is **latency vs consistency**
during normal operation (PACELC theorem):
- **Cassandra** (AP): Tunable -- QUORUM/QUORUM gives consistency; ONE/ONE gives
  availability. During partition, available but possibly stale.
- **MongoDB** (CP): Primary handles writes; during partition, minority side
  becomes read-only. Favors consistency.
- **DynamoDB**: Eventually consistent by default; option for strong consistency.
  Global tables are eventually consistent across regions.
- **Spanner** (CP): Strongly consistent globally, but commits wait for TrueTime
  uncertainty window (small latency cost for correctness).

### Q6: "Design a leaderboard system for a game with 10 million players."

**Answer:**
- **Redis Sorted Set**: ZADD for score updates, ZREVRANGE for top-N, ZRANK for
  player rank. O(log N) operations. Single Redis node handles this at 10M members.
- For durability: Redis with AOF persistence + periodic snapshots
- For HA: Redis Sentinel or Cluster
- For global: Regional Redis instances with periodic merge to DynamoDB Global Table
  for the canonical leaderboard
- Real-time updates: Redis Pub/Sub or Streams to push rank changes to clients

### Q7: "How would you migrate from SQL to NoSQL?"

**Answer:**
1. **Identify access patterns**: Map every SQL query to its NoSQL equivalent
2. **Dual-write period**: Write to both databases, read from SQL (source of truth)
3. **Backfill**: Migrate historical data to NoSQL
4. **Shadow reads**: Read from both, compare results, fix discrepancies
5. **Switch reads**: Read from NoSQL, still write to both
6. **Stop writing to SQL**: NoSQL becomes source of truth
7. **Key principle**: This is NOT a schema migration -- it is a complete rethink
   of data modeling around access patterns
