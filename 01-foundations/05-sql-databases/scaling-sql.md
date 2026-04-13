# Scaling SQL Databases

## Why This Matters

"SQL doesn't scale" is a common misconception. SQL databases scale extremely well
when you know the techniques. In system design interviews, you will be asked how to
handle millions of users with a relational database. This document covers every
scaling strategy from simple read replicas to full-blown sharding, plus a comparison
of the major RDBMS engines.

---

## Read Replicas

### How It Works

A primary (master) handles all writes. One or more replicas (slaves) receive a copy
of every write via replication and serve read queries.

```
  Clients (writes)          Clients (reads)
       |                    /       |       \
       v                   v        v        v
  +---------+        +---------+ +---------+ +---------+
  | Primary | -----> | Replica | | Replica | | Replica |
  | (R/W)   |  WAL   | (R/O)  | | (R/O)  | | (R/O)  |
  +---------+ stream +---------+ +---------+ +---------+
```

### Replication Types

| Type             | How                                        | Lag    | Consistency  |
|------------------|--------------------------------------------|--------|--------------|
| **Asynchronous** | Primary commits, ships WAL later           | ms-sec | Eventual     |
| **Synchronous**  | Primary waits for replica ACK before commit| ~0     | Strong       |
| **Semi-sync**    | Primary waits for at least 1 replica ACK   | Low    | Balanced     |

### Replication Lag: The Challenge

With async replication, a write on the primary may not be visible on replicas for
milliseconds to seconds. This causes stale reads.

```
  Timeline:
  ─────────────────────────────────────────────────>

  Primary:   [WRITE user.name='Bob'] [COMMIT]
                                          |
                                     replication lag (200ms)
                                          |
  Replica:                                [Bob visible here]

  User: "I just updated my name to Bob, but the page still shows Alice!"
  (User's read hit the replica before replication caught up)
```

### Read-After-Write Consistency Strategies

| Strategy                    | How It Works                              |
|-----------------------------|-------------------------------------------|
| Route to primary            | After a write, route that user's reads to |
|                             | the primary for N seconds                 |
| Track write timestamp       | Store the user's last write time. Route   |
|                             | reads to replicas only if they are caught |
|                             | up past that timestamp                    |
| Causal consistency token    | Attach a LSN/position to the write        |
|                             | response. Replica must be past that LSN   |
|                             | before serving the read.                  |
| Session stickiness          | Pin user to a specific replica that is    |
|                             | usually close to the primary              |

---

## Vertical Partitioning

Splitting a wide table into multiple narrower tables, each containing a subset of
columns.

```
  Before:                              After:
  +----------------------------------+ +------------------+ +-------------------+
  | users                            | | users_core       | | users_profile     |
  |----------------------------------| |------------------| |-------------------|
  | id | name | email | bio | avatar | | id | name | email| | id | bio | avatar |
  | .. | .... | ..... | ... | .....  | | .. | .... | .....| | .. | ... | .....  |
  +----------------------------------+ +------------------+ +-------------------+
       Frequently queried columns           Accessed by profile page only
```

### Benefits

- Frequently accessed columns stay in a smaller, hotter table (better cache hit rate)
- Large BLOB/TEXT columns do not pollute the hot table's I/O
- Reduces page reads for queries that only need a few columns

### When to Use

- Tables with many columns where different queries need different subsets
- Tables with large TEXT/BLOB columns accessed infrequently
- Not a replacement for proper column selection (SELECT only what you need)

---

## Horizontal Partitioning (Table Partitioning)

Splitting a table into multiple physical tables (partitions) based on row values.
The database hides this behind a single logical table name.

### Partitioning Strategies

#### Range Partitioning

```sql
CREATE TABLE orders (
    id          BIGSERIAL,
    created_at  TIMESTAMP NOT NULL,
    user_id     BIGINT,
    total       NUMERIC
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2024 PARTITION OF orders
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE orders_2025 PARTITION OF orders
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE orders_2026 PARTITION OF orders
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

-- Query automatically routes to the correct partition:
SELECT * FROM orders WHERE created_at = '2025-06-15';
-- Only scans orders_2025 ("partition pruning")
```

**Best for**: Time-series data, logs, events -- anything with a natural time boundary.

#### List Partitioning

```sql
CREATE TABLE customers (
    id      BIGSERIAL,
    name    TEXT,
    region  TEXT NOT NULL
) PARTITION BY LIST (region);

CREATE TABLE customers_us  PARTITION OF customers FOR VALUES IN ('us-east', 'us-west');
CREATE TABLE customers_eu  PARTITION OF customers FOR VALUES IN ('eu-west', 'eu-central');
CREATE TABLE customers_ap  PARTITION OF customers FOR VALUES IN ('ap-south', 'ap-east');
```

**Best for**: Data with a natural categorical grouping (region, tenant, status).

#### Hash Partitioning

```sql
CREATE TABLE sessions (
    id       UUID PRIMARY KEY,
    user_id  BIGINT NOT NULL,
    data     JSONB
) PARTITION BY HASH (user_id);

CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
```

**Best for**: Even distribution when there is no natural range or list key.

### Partition Pruning

The optimizer skips partitions that cannot contain matching rows:

```
  Query: SELECT * FROM orders WHERE created_at = '2025-06-15'

  Partitions:
    orders_2024  --> PRUNED (not in range)
    orders_2025  --> SCANNED (matches!)
    orders_2026  --> PRUNED (not in range)
```

---

## Sharding

Sharding distributes data across **multiple independent database instances**. Each
shard is a full PostgreSQL/MySQL server holding a subset of the data.

### Sharding vs Partitioning

| Aspect          | Table Partitioning          | Sharding                      |
|-----------------|-----------------------------|-------------------------------|
| Scope           | Single database instance    | Multiple database instances   |
| Managed by      | Database engine             | Application or middleware     |
| Cross-partition | Joins work naturally        | Expensive scatter-gather      |
| Scaling         | Limited to one machine      | Horizontal, add more servers  |

### Shard Key Selection (The Critical Decision)

The shard key determines which shard holds each row. A bad shard key creates
**hotspots** (one shard handling most of the traffic).

```
  Good shard key: user_id
  +----------+  +----------+  +----------+  +----------+
  | Shard 0  |  | Shard 1  |  | Shard 2  |  | Shard 3  |
  | users    |  | users    |  | users    |  | users    |
  | 1-250K   |  | 250K-500K|  | 500K-750K|  | 750K-1M  |
  | ~25% load|  | ~25% load|  | ~25% load|  | ~25% load|
  +----------+  +----------+  +----------+  +----------+

  Bad shard key: country (if 80% of users are in the US)
  +----------+  +----------+  +----------+  +----------+
  | Shard 0  |  | Shard 1  |  | Shard 2  |  | Shard 3  |
  | US       |  | UK       |  | EU       |  | APAC     |
  | 80% load |  | 8% load  |  | 7% load  |  | 5% load  |
  +----------+  +----------+  +----------+  +----------+
   HOTSPOT!
```

### Shard Key Properties to Look For

1. **High cardinality**: Many distinct values for even distribution
2. **Even distribution**: No single value dominates
3. **Query locality**: Most queries include the shard key (avoids scatter-gather)
4. **Stable**: The shard key value should not change (moving rows between shards is
   expensive)

### Cross-Shard Queries (Scatter-Gather)

```
  Query: SELECT COUNT(*) FROM orders WHERE product_id = 42;
  (product_id is NOT the shard key, which is user_id)

  Application / Middleware:
    1. Send query to ALL shards (scatter)
    2. Each shard returns its local count
    3. Sum the results (gather)

  +----------+  +----------+  +----------+  +----------+
  | Shard 0  |  | Shard 1  |  | Shard 2  |  | Shard 3  |
  | count=12 |  | count=8  |  | count=15 |  | count=5  |
  +----------+  +----------+  +----------+  +----------+
        \           |             |           /
         \          |             |          /
          v         v             v         v
       +---------------------------------------+
       | Middleware: 12 + 8 + 15 + 5 = 40      |
       +---------------------------------------+
```

Scatter-gather is expensive: latency is the slowest shard's response time, and it
scales poorly. Design your shard key to minimize scatter-gather queries.

### Resharding Challenges

When you need to add or remove shards:

1. **Data migration**: Rows must be moved between shards. For hash-based sharding,
   changing the modulus reshuffles most rows.
2. **Downtime or dual-writes**: During migration, either take downtime or write to
   both old and new shards.
3. **Consistent hashing**: Minimizes data movement when adding shards (only neighbors
   are affected). Vitess and some middleware support this.

---

## Vitess Architecture

Vitess is YouTube's open-source sharding middleware for MySQL. It transparently
shards MySQL and handles connection pooling, query routing, and schema management.

```
  +----------------------------------------------------------+
  |                      Application                          |
  +----------------------------------------------------------+
                           |
                    MySQL protocol
                           |
                           v
  +----------------------------------------------------------+
  |                      VTGate                               |
  |  (Stateless query router -- horizontally scalable)        |
  |  - Parses SQL                                             |
  |  - Routes to correct shard(s) based on vindex (shard key) |
  |  - Aggregates scatter-gather results                      |
  +----------------------------------------------------------+
          /          |          |          \
         v           v          v           v
  +----------+ +----------+ +----------+ +----------+
  | VTTablet | | VTTablet | | VTTablet | | VTTablet |
  | Shard -80| | Shard 80-| | Shard -80| | Shard 80-|
  | (primary)| | (primary)| | (replica)| | (replica)|
  +----------+ +----------+ +----------+ +----------+
       |            |            |            |
       v            v            v            v
  +----------+ +----------+ +----------+ +----------+
  |  MySQL   | |  MySQL   | |  MySQL   | |  MySQL   |
  +----------+ +----------+ +----------+ +----------+

  +----------------------------------------------------------+
  |                    Topology Service                        |
  |  (etcd / ZooKeeper / Consul)                              |
  |  - Stores shard map, schema, serving graph                |
  |  - Source of truth for cluster state                       |
  +----------------------------------------------------------+
```

### Key Components

| Component         | Role                                                    |
|-------------------|---------------------------------------------------------|
| **VTGate**        | Stateless proxy. Routes queries, manages scatter-gather |
| **VTTablet**      | Agent on each MySQL instance. Manages replication, health|
| **Topology**      | Metadata store (etcd/ZK). Shard map, schema definitions |
| **Vindexes**      | Sharding functions (hash, lookup, etc.)                 |

### Vitess in Production

- Used by YouTube, Slack, GitHub, Square, HubSpot
- Supports online schema changes (no downtime ALTER TABLE)
- Handles resharding (splitting/merging shards) with minimal downtime

---

## Materialized Views

A materialized view is a **precomputed query result** stored as a table.

### When to Use

- Complex aggregation queries that are expensive to compute on every request
- Dashboard summaries, leaderboards, analytics rollups
- Denormalized data for read-heavy workloads

### SQL Example

```sql
CREATE MATERIALIZED VIEW daily_revenue AS
  SELECT
    DATE(created_at) AS day,
    SUM(total) AS revenue,
    COUNT(*) AS order_count
  FROM orders
  WHERE status = 'completed'
  GROUP BY DATE(created_at);

-- Query the materialized view (instant, no aggregation needed)
SELECT * FROM daily_revenue WHERE day >= '2025-01-01';

-- Refresh the view (recomputes from scratch)
REFRESH MATERIALIZED VIEW daily_revenue;

-- Refresh concurrently (does not lock reads during refresh)
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;
-- Requires a unique index on the materialized view
```

### Refresh Strategies

| Strategy            | How                                     | Freshness    |
|---------------------|-----------------------------------------|--------------|
| Manual              | `REFRESH MATERIALIZED VIEW` via cron    | Minutes-hours|
| Trigger-based       | Trigger on base table updates refresh   | Near-real-time|
| CDC-based           | Stream changes to a processor that refreshes | Seconds |
| CONCURRENTLY        | Refresh without blocking readers        | Same as above|

---

## Common RDBMS Comparison

### PostgreSQL

```
  Strengths:
  - MVCC with snapshot isolation at all levels
  - Rich data types: JSONB, arrays, hstore, range types, geometric
  - Extension ecosystem: PostGIS (geospatial), pgvector (embeddings),
    pg_trgm (fuzzy text), TimescaleDB (time-series)
  - Full SQL standard compliance + window functions + CTEs
  - Table partitioning (native since v10)
  - Logical replication (selective table replication)
  - LISTEN/NOTIFY for pub/sub

  Weaknesses:
  - VACUUM overhead (dead tuple cleanup)
  - No built-in connection pooler (need PgBouncer)
  - Write amplification from MVCC (every UPDATE creates a new row version)
  - No native multi-master replication
```

### MySQL (InnoDB)

```
  Strengths:
  - Clustered index: data stored IN the primary key B+ Tree
    (primary key lookups are extremely fast, no heap fetch)
  - Simpler VACUUM-like process (purge thread handles undo logs)
  - Group Replication for multi-primary clusters
  - Wide ecosystem, huge community, battle-tested at massive scale
  - MySQL 8.0+: window functions, CTEs, JSON support

  Weaknesses:
  - Gap locking in REPEATABLE READ (locks ranges, not just rows)
  - Historically weaker SQL compliance (improving rapidly)
  - Secondary indexes store the primary key value, not a row pointer
    (secondary index lookups require two B+ Tree traversals)
  - Fewer built-in types compared to PostgreSQL
```

### Amazon Aurora

```
  Architecture:
  +--------------------+     +--------------------+
  | Compute (Primary)  |     | Compute (Replicas) |  <-- up to 15
  +--------------------+     +--------------------+
           \                       /
            \                     /
             v                   v
  +------------------------------------------+
  |        Shared Distributed Storage         |
  |  6 copies across 3 Availability Zones     |
  |  Quorum: 4/6 for writes, 3/6 for reads   |
  +------------------------------------------+

  Strengths:
  - Separated compute and storage (scale independently)
  - 6-way replication across 3 AZs (extremely durable)
  - Replica lag typically < 20ms (shared storage, not WAL shipping)
  - Up to 5x throughput vs vanilla MySQL (Amazon's claim)
  - 128 TB max storage, auto-scaling
  - Backtrack: rewind database to a point in time without restore
  - Serverless v2: auto-scales compute based on load

  Weaknesses:
  - AWS vendor lock-in
  - More expensive than self-managed PostgreSQL/MySQL
  - Aurora PostgreSQL and Aurora MySQL are separate products
    with different behavior and limitations
  - Limited control over storage configuration
```

### Side-by-Side Comparison

```
  +------------------+------------------+------------------+------------------+
  | Feature          | PostgreSQL       | MySQL/InnoDB     | Aurora           |
  +------------------+------------------+------------------+------------------+
  | Default isolation| READ COMMITTED   | REPEATABLE READ  | (depends on      |
  |                  |                  |                  |  engine variant) |
  +------------------+------------------+------------------+------------------+
  | MVCC cleanup     | VACUUM           | Purge thread     | Managed          |
  +------------------+------------------+------------------+------------------+
  | Index structure  | Heap + separate  | Clustered (data  | Same as engine   |
  |                  | B+ Tree indexes  | in PK B+ Tree)   |                  |
  +------------------+------------------+------------------+------------------+
  | JSON support     | JSONB (indexed,  | JSON (stored as  | Same as engine   |
  |                  | binary, fast)    | text, slower)    |                  |
  +------------------+------------------+------------------+------------------+
  | Max connections  | ~500 (need       | ~5000 (built-in  | Connection       |
  |  (practical)     | PgBouncer)       | thread pool)     | pooling via RDS  |
  +------------------+------------------+------------------+------------------+
  | Replication      | Streaming (async | binlog (async/   | Shared storage   |
  |                  | /sync/logical)   | semi-sync/group) | (< 20ms lag)     |
  +------------------+------------------+------------------+------------------+
  | Extensions       | PostGIS,pgvector | Limited plugin   | Subset of engine |
  |                  | pg_trgm, etc.    | system           | extensions       |
  +------------------+------------------+------------------+------------------+
  | Best for         | Complex queries, | High throughput  | Managed cloud,   |
  |                  | rich types, geo  | web apps, simple | high availability|
  |                  |                  | schemas          | minimal ops      |
  +------------------+------------------+------------------+------------------+
```

---

## Interview Questions with Answers

### Q1: "How would you scale a SQL database for 10M users?"

**Answer**:
1. Start with **vertical scaling** (bigger machine) -- cheapest and simplest.
2. Add **read replicas** to offload read traffic (most apps are 90%+ reads).
3. Implement **connection pooling** (PgBouncer) to handle thousands of app connections.
4. Add **caching** (Redis) for hot data to reduce DB load.
5. **Partition** large tables (range by date for time-series data).
6. If a single primary cannot handle write load, consider **sharding** by user_id.
7. For cloud: consider **Aurora** for managed scaling with minimal operational burden.

### Q2: "When would you shard and when would you not?"

**Answer**:
- **Shard when**: Single primary cannot handle write throughput; data size exceeds
  single-machine storage; regulatory requirements demand geographic data separation.
- **Do not shard when**: Read replicas + caching handle the load; table partitioning
  is sufficient; the added complexity of cross-shard queries is not justified.
- Sharding is a **last resort** -- it is the most operationally complex scaling
  strategy. Exhaust simpler options first.

### Q3: "Your read replica is 5 seconds behind. A user updates their profile and immediately sees stale data. How do you fix this?"

**Answer**:
1. **Route reads to primary** for the user who just wrote, for a brief window.
2. **Track the write LSN** in the session. Route the user's reads to a replica only
   once that replica has applied past that LSN.
3. Use **causal consistency tokens** returned with the write response.
4. On the frontend, use **optimistic UI** -- show the user their own change
   immediately, confirm with the backend asynchronously.

### Q4: "Why would you choose PostgreSQL over MySQL?"

**Answer**:
- Need rich data types (JSONB, arrays, geometric with PostGIS, vector embeddings
  with pgvector).
- Need advanced SQL features (CTEs, window functions, lateral joins).
- Need partial indexes, expression indexes, or GIN/GiST indexes.
- Need logical replication for selective table replication.
- If the team already has PostgreSQL expertise.

### Q5: "What is Aurora's main architectural innovation?"

**Answer**:
- Aurora separates **compute from storage**. The storage layer is a shared,
  distributed, replicated volume across 3 AZs with 6 copies.
- The primary writes redo log records directly to the storage layer (not full pages).
  Storage nodes apply the log records independently.
- Replicas share the same storage and only need to invalidate their buffer cache
  when new log records arrive, resulting in sub-20ms replica lag.
- This design eliminates the need for shipping WAL files between instances.

---

## Key Takeaways

1. **Read replicas** are your first scaling tool. Understand replication lag and
   read-after-write consistency strategies.
2. **Table partitioning** (range, list, hash) keeps single-machine data manageable.
   Partition pruning makes queries fast.
3. **Sharding is a last resort** but sometimes necessary. Shard key selection is the
   most critical decision -- get it wrong and you get hotspots and scatter-gather.
4. **Vitess** is the production-proven sharding middleware for MySQL. Know its
   architecture (VTGate, VTTablet, Topology).
5. **Materialized views** precompute expensive queries. Use REFRESH CONCURRENTLY
   to avoid blocking readers.
6. **PostgreSQL** excels at complex queries and rich types. **MySQL** excels at
   simple, high-throughput web workloads. **Aurora** excels at managed cloud
   deployments with high availability.
7. In interviews, always present a **progression**: vertical scaling --> read replicas
   --> caching --> partitioning --> sharding. Do not jump to sharding first.
