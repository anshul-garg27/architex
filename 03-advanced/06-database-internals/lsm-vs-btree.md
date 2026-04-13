# LSM Tree vs B+ Tree: Comprehensive Comparison

## The Two Storage Engine Paradigms

Every database storage engine falls into one of two families:

- **B+ Tree (in-place update):** Read-optimized. Data lives in fixed pages on
  disk and is updated in place. Reads are fast (direct page access), but writes
  cause random I/O.

- **LSM Tree (log-structured):** Write-optimized. Data is buffered in memory
  and flushed as immutable sorted files. Writes are fast (sequential I/O), but
  reads must search multiple files.

This is the single most important architectural decision in database internals,
and understanding the trade-offs is essential for senior-level interviews.

---

## Head-to-Head Comparison

| Dimension | LSM Tree | B+ Tree |
|-----------|----------|---------|
| **Write throughput** | Very high (sequential I/O, memtable buffering) | Moderate (random page updates, WAL + data write) |
| **Write amplification** | High: 10-30x (leveled), 4-10x (size-tiered) | Low: ~2-3x (WAL + data page) |
| **Write pattern** | Sequential (append SSTables) | Random (update arbitrary pages) |
| **Point read latency** | Higher (check memtable + bloom filters + multiple levels) | Lower (single B+ Tree traversal, 1-2 disk reads) |
| **Read amplification** | High without bloom filters; moderate with them | Low (1 traversal = 3-4 page reads) |
| **Range query** | Requires merge iterator across all levels | Follow leaf linked list (sequential) |
| **Space amplification** | 10-300% overhead (dead data before compaction) | Low (~10-25% for free space/fragmentation) |
| **Space reclamation** | Background compaction (continuous) | In-place (immediate) or VACUUM |
| **Compression** | Excellent (immutable sorted blocks compress well) | Good (but random updates limit effectiveness) |
| **SSD friendliness** | Mixed: sequential writes (good), high write amp (bad) | Random writes (bad for NAND), low write amp (good) |
| **Concurrency** | Simple (append-only, no page locking) | Complex (latch crabbing, page splits) |
| **Predictable latency** | Compaction can cause tail latency spikes | More predictable (no background compaction) |
| **Memory efficiency** | Bloom filters + block cache | Buffer pool (pages) |
| **Recovery** | Replay WAL into memtable (simple) | ARIES redo/undo (complex) |
| **Maturity** | Newer (2000s) | Decades of optimization (1970s) |

---

## Amplification Analysis

The three amplification factors are the core framework for reasoning about
storage engine trade-offs:

```
  +-------------------------------------------------------------------+
  |           THE AMPLIFICATION TRIANGLE                              |
  |                                                                   |
  |  You can optimize for two, but the third will suffer.             |
  |                                                                   |
  |              Write Amplification                                  |
  |                    /\                                              |
  |                   /  \                                             |
  |       Leveled    /    \    B+ Tree                                |
  |       LSM:  ----/      \----  Low write amp                       |
  |       High W   /        \     Low read amp                        |
  |       Low R,S /          \    Moderate space                      |
  |              /            \                                       |
  |             /   Size-Tiered\                                      |
  |            /    LSM:        \                                     |
  |           /     Low W, High R\                                    |
  |          /      Moderate S    \                                   |
  |         /______________________\                                  |
  |    Read Amplification    Space Amplification                      |
  +-------------------------------------------------------------------+

  Concrete numbers (1TB logical data):

  Engine           Write Amp    Read Amp         Space Amp
  ──────────────   ─────────    ──────────       ──────────
  B+ Tree          2-3x         1 (point)        1.1-1.25x
                                3-4 (range)
  LSM (Leveled)    10-30x       1-7 (point)      1.1x
                                all levels(range)
  LSM (Size-Tiered) 4-10x      10-50+ (point)    2-3x
  LSM (FIFO/TWCS)  1x          per-window        1.0x
```

### Write Amplification Breakdown

```
  B+ Tree Write Path:
    1. Write to WAL (sequential)        = 1x
    2. Write dirty page to disk         = 1x
    (Maybe split causes extra writes)   = ~0.1x on average
    Total: ~2-3x

  LSM Leveled Write Path:
    1. Write to WAL                     = 1x
    2. Flush memtable to L0 SSTable     = 1x
    3. Compact L0 -> L1                 = ~1x
    4. Compact L1 -> L2 (10x size)      = ~10x
    5. Compact L2 -> L3 (10x size)      = ~10x
    ...
    Total: ~10-30x (each byte rewritten many times)
```

### Read Amplification Breakdown

```
  B+ Tree Point Query:
    Traverse root -> internal -> ... -> leaf
    = log_b(N) page reads
    = 3-4 for billions of rows
    With buffer pool: 1-2 actual disk reads

  LSM Point Query (worst case, key not found):
    Check memtable                        = 0 disk reads
    Check each L0 SSTable bloom filter    = 0 disk reads (in-memory)
    Bloom filter says "maybe" for 1%:
      Read 1 block per false positive     = ~0.04 reads
    Check L1 bloom filter -> data block   = ~0.01 reads
    Check L2 bloom filter -> data block   = ~0.01 reads
    ...
    Total (with bloom filters): ~1-2 disk reads on average
    Total (without bloom filters): ~7+ disk reads
```

---

## When to Use Each Engine

### Use LSM Tree When:

```
  1. WRITE-HEAVY WORKLOADS
     - Ingesting millions of events/second
     - Time-series data (metrics, IoT, logs)
     - Write:Read ratio > 10:1

  2. APPEND-ONLY / IMMUTABLE DATA
     - Event sourcing
     - Audit logs
     - Blockchain-style append

  3. SEQUENTIAL KEY PATTERNS
     - Time-ordered keys (timestamp prefix)
     - Auto-increment IDs
     - These minimize write amplification

  4. LARGE VALUE SIZES
     - Document storage
     - Blob-like data
     - LSM handles large values well (BlobDB in RocksDB)

  5. SSD-BASED STORAGE (with caveats)
     - Sequential writes align with NAND erase blocks
     - But high write amplification shortens SSD life
```

### Use B+ Tree When:

```
  1. READ-HEAVY WORKLOADS
     - OLTP with many point queries
     - Read:Write ratio > 5:1
     - Interactive applications requiring low latency

  2. RANGE QUERIES
     - Analytical queries scanning key ranges
     - Sorted iteration (ORDER BY on indexed column)
     - B+ Tree leaf linking makes this sequential I/O

  3. TRANSACTION PROCESSING
     - ACID transactions with read-modify-write patterns
     - Row-level locking
     - Multi-statement transactions

  4. PREDICTABLE LATENCY
     - No background compaction spikes
     - Consistent p99 latency
     - Real-time or latency-sensitive systems

  5. SPACE-CONSTRAINED ENVIRONMENTS
     - Low space amplification
     - No temporary compaction space needed
```

---

## Real-World Database Mapping

```
  +-----------------------------------------------------------+
  |              STORAGE ENGINE FAMILY TREE                    |
  +-----------------------------------------------------------+
  |                                                           |
  |  B+ TREE FAMILY              LSM TREE FAMILY              |
  |  ──────────────              ──────────────               |
  |  PostgreSQL (B-Tree idx)     RocksDB / LevelDB            |
  |  MySQL InnoDB                Cassandra                    |
  |  Oracle                      HBase                        |
  |  SQL Server                  ScyllaDB                     |
  |  SQLite                      CockroachDB (Pebble)         |
  |  MongoDB (WiredTiger*)       TiKV (TiDB)                  |
  |                              InfluxDB (TSM engine)        |
  |  HYBRID                      BadgerDB (Dgraph)            |
  |  ──────                      DynamoDB (internal)          |
  |  WiredTiger (both modes)     Kafka (log-structured)       |
  |  TiDB (TiKV + TiFlash)                                   |
  |  CockroachDB (LSM+optimized reads)                        |
  |  FoundationDB                                             |
  +-----------------------------------------------------------+

  * WiredTiger (MongoDB default) supports BOTH B-Tree and LSM.
    MongoDB defaults to B-Tree mode for general workloads.
```

---

## Hybrid Approaches and Convergence

The sharp line between LSM and B+ Tree is blurring as each side adopts
optimizations from the other.

### LSM Trees Getting Read Optimizations

| Optimization | How It Works |
|-------------|-------------|
| **Bloom filters** | Avoid reading SSTables that don't contain the key |
| **Prefix bloom filters** | Efficient range queries within a prefix |
| **Block cache** | Cache frequently read SSTable blocks in memory |
| **Partitioned indexes** | Two-level index for huge SSTables |
| **Compaction priority** | Prioritize levels that affect read performance |
| **Tiered + Leveled hybrid** | Universal compaction in RocksDB |
| **Remote compaction** | Offload compaction to separate nodes (CockroachDB) |

### B+ Trees Getting Write Optimizations

| Optimization | How It Works |
|-------------|-------------|
| **Buffer pool + WAL** | Batch dirty page writes, avoid synchronous flushes |
| **Change buffer (InnoDB)** | Buffer secondary index changes, merge later |
| **HOT updates (PostgreSQL)** | Avoid index updates for non-indexed column changes |
| **Columnar extensions** | TimescaleDB, Citus columnar for analytical writes |
| **Write-optimized B-Trees** | Fractal trees (TokuDB) -- B-Tree with internal buffers |

### TiDB: A True Hybrid

```
  TiDB Architecture:

  +-------------------+        +-------------------+
  | TiKV              |        | TiFlash           |
  | (Row store)       |        | (Column store)    |
  | RocksDB (LSM)     |        | ClickHouse-based  |
  +-------------------+        +-------------------+
         |                              |
         |   Raft replication           |   Async replication
         |   (strong consistency)       |   (from TiKV)
         v                              v
  Point queries,             Analytical queries,
  Transactions (OLTP)        Aggregations (OLAP)

  TiDB's query optimizer automatically routes queries to the
  appropriate engine based on the query type (HTAP).
```

### WiredTiger (MongoDB): Configurable Engine

```
  MongoDB with WiredTiger:

  Default: B-Tree mode
    - Good for mixed read/write workloads
    - Standard document CRUD

  LSM mode (optional):
    - collection: { type: "lsm" }
    - Better for write-heavy ingestion
    - Rarely used in practice (B-Tree default works well enough)

  WiredTiger innovations:
    - Uses both in-memory B-Trees and on-disk B-Trees
    - Hazard pointers for lock-free reads
    - MVCC without undo logs (copy-on-write B-Trees)
```

---

## Performance Characteristics (Quantified)

```
  Benchmark: 1 billion key-value pairs (16 byte key, 100 byte value)
  Hardware: NVMe SSD, 64GB RAM, 16 cores

  Metric                    RocksDB (LSM)    InnoDB (B+Tree)
  ────────────────────────  ─────────────    ───────────────
  Random write (ops/sec)    500K-1M          50K-200K
  Sequential write          1M-2M            200K-500K
  Random point read         200K-500K        300K-800K
  Range scan (1000 keys)    50K-100K scans   100K-200K scans
  Write amplification       10-30x           2-3x
  Disk space used           110GB            125GB
  Recovery time (crash)     Seconds          Minutes (ARIES)
  p99 write latency         1-10ms           0.5-2ms
  p99 read latency          0.5-5ms          0.2-1ms
  Compaction CPU overhead   10-30% constant  Near zero

  NOTE: These are approximate. Actual numbers depend heavily on
  workload pattern, tuning, and hardware. The RELATIVE differences
  are what matter for interviews.
```

---

## Interview Decision Framework

### "Your system is write-heavy. Which storage engine?"

```
  Structured answer:

  1. "For write-heavy workloads, I would start with an LSM-tree based
     engine like RocksDB or Cassandra."

  2. "LSM trees convert random writes into sequential writes via
     memtable buffering and SSTable flushes, achieving 5-10x higher
     write throughput than B+ Trees."

  3. "The trade-off is higher read amplification and background
     compaction overhead. I would mitigate reads with bloom filters
     and a large block cache."

  4. "For compaction strategy: if the data is time-series, I would
     use TWCS. If mixed workload with some reads, leveled compaction.
     If pure write throughput matters most, size-tiered."

  5. "Specific choice depends on other requirements:
     - Need distributed? -> Cassandra, ScyllaDB, TiKV
     - Need embedded? -> RocksDB
     - Need SQL? -> CockroachDB, TiDB
     - Need time-series? -> InfluxDB, TimescaleDB"
```

### "Your system is read-heavy. Which storage engine?"

```
  Structured answer:

  1. "For read-heavy workloads, a B+ Tree engine like PostgreSQL or
     MySQL InnoDB is the natural choice."

  2. "B+ Trees provide O(log_b N) point lookups with high fan-out,
     meaning 3-4 page reads for billions of rows. With buffer pool
     caching, this drops to 1-2 disk reads."

  3. "Range queries follow the leaf linked list -- sequential I/O,
     no merge iterators needed."

  4. "I would optimize with:
     - Covering indexes for frequent queries
     - Appropriate buffer pool size (70-80% of RAM)
     - Fill factor tuning for update-heavy tables
     - Connection pooling to maximize cache efficiency"

  5. "If some write volume is needed alongside reads, modern B+ Tree
     engines handle this well with WAL + buffer pool. Write throughput
     of 50K-200K ops/sec is sufficient for most OLTP workloads."
```

### "Compare RocksDB and PostgreSQL for a real-time analytics pipeline"

```
  "It depends on the access pattern:

  Ingestion layer (write path):
    RocksDB wins. Ingesting millions of events/second with sequential
    writes. I would use RocksDB (or Cassandra/ScyllaDB) as the
    ingestion tier with TWCS for time-series data.

  Query layer (read path):
    PostgreSQL (or a columnar engine) wins. Analytical queries with
    aggregations, JOINs, and complex predicates are better served by
    a B+ Tree engine with a mature query optimizer.

  Hybrid architecture:
    Ingest into an LSM-based system (Kafka -> RocksDB/Cassandra),
    then materialize aggregated views into PostgreSQL or a columnar
    store (ClickHouse, TiFlash) for serving queries.

  This is essentially what modern HTAP databases like TiDB do --
  LSM for writes, columnar for analytical reads."
```

---

## The Convergence Thesis

The industry trend is convergence:

1. **LSM engines are adding read optimizations:** bloom filters, prefix
   iterators, block cache, adaptive compaction, remote compaction.

2. **B+ Tree engines are adding write optimizations:** change buffers,
   batch WAL commits, async dirty page flushing, columnar extensions.

3. **Hybrid engines** are emerging: WiredTiger (configurable), TiDB
   (LSM + columnar), FoundationDB (custom engine), CockroachDB
   (LSM with read-optimized compaction).

4. **Specialized engines** for specific workloads: columnar for OLAP
   (ClickHouse), time-series (InfluxDB TSM), graph (custom adjacency),
   vector (HNSW/IVF indexes).

The senior-level insight is that storage engine choice is not binary. Modern
systems often use multiple engines for different data tiers and access patterns.

---

## Key Takeaways

1. **LSM = write-optimized, B+ Tree = read-optimized.** This is the fundamental
   trade-off. Know it cold.

2. **The amplification triangle** (write, read, space) is the framework for
   reasoning about any storage engine decision.

3. **Real systems are hybrid.** CockroachDB uses LSM with read optimizations.
   PostgreSQL adds columnar extensions. TiDB runs both engines simultaneously.

4. **Workload determines the answer.** Write-heavy/time-series -> LSM.
   Read-heavy/OLTP -> B+ Tree. Mixed/HTAP -> hybrid.

5. **Bloom filters are the great equalizer** for LSM read performance. Without
   them, LSM reads are impractical. With them, point queries are competitive.

6. **For interviews:** always frame your answer around the specific workload,
   quantify the trade-offs (write amp, read amp, space amp), and mention a
   concrete database that implements your recommendation.
