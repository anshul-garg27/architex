# Locking and Concurrency

## Why This Matters

Even with MVCC, there are scenarios where explicit locking is required: preventing
double-booking, ensuring atomic read-modify-write cycles, or coordinating access to
shared resources. This document covers the locking primitives databases offer, the
optimistic vs pessimistic choice, deadlocks, and connection pooling -- all topics
that surface in system design interviews.

---

## Lock Types: Shared vs Exclusive

The two fundamental lock modes:

```
  +-------------------+-----------------------------+-----------------------------+
  |                   |   Shared (S) Held           |   Exclusive (X) Held        |
  +-------------------+-----------------------------+-----------------------------+
  | Request Shared    |   GRANTED (compatible)      |   BLOCKED (conflict)        |
  +-------------------+-----------------------------+-----------------------------+
  | Request Exclusive |   BLOCKED (conflict)        |   BLOCKED (conflict)        |
  +-------------------+-----------------------------+-----------------------------+
```

- **Shared (S)**: "I am reading this row. Others can read too, but nobody can write."
- **Exclusive (X)**: "I am writing this row. Nobody else can read or write."

In practice, PostgreSQL with MVCC rarely uses shared locks for reads (readers see
snapshots). But MySQL/InnoDB uses shared locks in some isolation levels, and explicit
locking (`SELECT ... FOR SHARE`) uses them.

---

## Lock Granularity

| Granularity  | What Is Locked       | Concurrency | Overhead |
|--------------|----------------------|-------------|----------|
| Row-level    | Individual row       | Highest     | Highest  |
| Page-level   | Disk page (~8 KB)    | Medium      | Medium   |
| Table-level  | Entire table         | Lowest      | Lowest   |

### Trade-offs

- **Row-level locks** (PostgreSQL, InnoDB default): Maximum concurrency. Two
  transactions can update different rows in the same table simultaneously. But
  managing millions of row locks consumes memory.
- **Table-level locks** (MyISAM, some DDL operations): Zero concurrency on that
  table. Simple and low overhead but serializes all writes. Used for DDL like
  `ALTER TABLE` or explicit `LOCK TABLE`.

**Interview insight**: PostgreSQL uses row-level locks for DML (INSERT/UPDATE/DELETE)
but takes various table-level locks for DDL. An `ALTER TABLE ADD COLUMN` with a
default value in older PostgreSQL required an exclusive table lock; modern versions
are smarter.

---

## Optimistic Locking

### Concept

Assume conflicts are rare. Do not hold locks during the transaction. Instead, detect
conflicts at write time using a **version column** or **timestamp**.

### Implementation: Version Column

```sql
-- Table schema
CREATE TABLE products (
  id         SERIAL PRIMARY KEY,
  name       TEXT,
  price      NUMERIC,
  version    INTEGER NOT NULL DEFAULT 1
);

-- Read the product (no lock held)
SELECT id, name, price, version FROM products WHERE id = 42;
-- Returns: id=42, name='Widget', price=29.99, version=5

-- Update with optimistic lock check
UPDATE products
SET price = 34.99, version = version + 1
WHERE id = 42 AND version = 5;
-- If another transaction updated the row, version != 5, and 0 rows are affected.
```

### Application-Level Check

```python
def update_price(product_id, new_price, expected_version):
    result = db.execute(
        """UPDATE products
           SET price = %s, version = version + 1
           WHERE id = %s AND version = %s""",
        (new_price, product_id, expected_version)
    )
    if result.rowcount == 0:
        raise ConflictError("Product was modified by another transaction. Retry.")
```

This is a **Compare-And-Swap (CAS)** pattern: compare the version, swap only if it
matches.

### When to Use Optimistic Locking

- Read-heavy workloads with infrequent write conflicts
- User-facing forms: user reads data, edits it, submits minutes later
- Shopping carts: low contention on individual items
- Any scenario where holding a database lock for the duration of user think-time
  would be wasteful

---

## Pessimistic Locking

### Concept

Assume conflicts are likely. Lock the row immediately when reading, hold the lock
until the transaction completes.

### Implementation: SELECT FOR UPDATE

```sql
BEGIN;

-- Lock the row. Other transactions that try FOR UPDATE on this row will BLOCK.
SELECT balance FROM accounts WHERE id = 42 FOR UPDATE;
-- Returns: balance = 1000

-- Safe to modify, nobody else can touch this row
UPDATE accounts SET balance = balance - 500 WHERE id = 42;

COMMIT;
-- Lock released
```

### Variants

```sql
SELECT ... FOR UPDATE;           -- exclusive lock, blocks other FOR UPDATE and writes
SELECT ... FOR NO KEY UPDATE;    -- weaker exclusive lock, doesn't block foreign key checks
SELECT ... FOR SHARE;            -- shared lock, blocks writes but allows other FOR SHARE
SELECT ... FOR KEY SHARE;        -- weakest shared lock, allows non-key updates

-- With NOWAIT: fail immediately if lock is not available
SELECT ... FOR UPDATE NOWAIT;

-- With SKIP LOCKED: skip rows that are already locked
SELECT ... FOR UPDATE SKIP LOCKED;
```

### SKIP LOCKED: Job Queue Pattern

A powerful pattern for implementing job queues in PostgreSQL:

```sql
-- Worker picks up the next available job, skipping locked ones
BEGIN;
SELECT id, payload FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

-- Process the job...
UPDATE jobs SET status = 'completed' WHERE id = <picked_id>;
COMMIT;
```

Multiple workers can run this concurrently. Each gets a different job.

### When to Use Pessimistic Locking

- High contention: many transactions compete for the same rows
- Short transactions: lock held for milliseconds, not seconds
- Critical sections: bank transfers, seat booking, inventory decrement
- When the cost of conflict detection and retry (optimistic) exceeds the cost
  of holding a lock (pessimistic)

---

## Optimistic vs Pessimistic: Decision Guide

```
  +---------------------+-------------------+---------------------+
  |                     | Optimistic        | Pessimistic         |
  +---------------------+-------------------+---------------------+
  | Conflict frequency  | Low               | High                |
  | Lock held during    | Never             | Transaction duration|
  | Conflict detection  | At write time     | At read time (block)|
  | Retry needed?       | Yes (on conflict) | No (blocks instead) |
  | Deadlock risk       | None              | Possible            |
  | Best for            | Read-heavy, low   | Write-heavy, high   |
  |                     | contention        | contention          |
  | Throughput          | Higher (usually)  | Lower (lock waits)  |
  | Example             | E-commerce product| Airline seat booking|
  |                     | page edits        | Bank transfers      |
  +---------------------+-------------------+---------------------+
```

---

## Two-Phase Locking (2PL)

2PL is a concurrency control protocol that guarantees serializability.

### The Two Phases

```
  Number of locks held
        |
        |         +-----------+
        |        /             \
        |       /               \
        |      /                 \
        |     /                   \
        |    /    Growing          \   Shrinking
        |   /     Phase             \  Phase
        |  /                         \
        | /                           \
        +/-----------------------------\---------> Time
              Lock Point
              (all locks acquired)
```

1. **Growing phase**: Transaction acquires locks, never releases any.
2. **Shrinking phase**: Transaction releases locks, never acquires new ones.

### Strict 2PL (S2PL)

Most databases use **Strict 2PL**: hold all locks until COMMIT or ROLLBACK. This
prevents cascading aborts (where aborting one transaction forces aborting others that
read its uncommitted data).

### 2PL and Deadlocks

2PL guarantees serializability but can cause deadlocks. The database must detect and
resolve them.

---

## Deadlocks

### How a Deadlock Occurs

```
  Transaction A                        Transaction B
  ─────────────                        ─────────────
  BEGIN;                               BEGIN;

  UPDATE accounts SET balance = 500    UPDATE accounts SET balance = 800
    WHERE id = 1;                        WHERE id = 2;
  -- A holds lock on row 1             -- B holds lock on row 2

  UPDATE accounts SET balance = 300    UPDATE accounts SET balance = 600
    WHERE id = 2;                        WHERE id = 1;
  -- A WAITS for B to release row 2   -- B WAITS for A to release row 1

  -- DEADLOCK: circular wait!
```

### Circular Wait Diagram

```
  +-------+   waits for   +-------+
  | Txn A | ------------> | Row 2 | (held by Txn B)
  +-------+               +-------+
      ^                       |
      |                       |
  +-------+               +-------+
  | Row 1 | <------------ | Txn B |
  +-------+   waits for   +-------+
  (held by A)
```

### The Four Coffman Conditions

All four must hold simultaneously for a deadlock to exist:

| Condition            | Meaning                                             |
|----------------------|-----------------------------------------------------|
| **Mutual Exclusion** | Resource can be held by only one transaction at a time|
| **Hold and Wait**    | Transaction holds resources while waiting for others |
| **No Preemption**    | Resources cannot be forcibly taken away              |
| **Circular Wait**    | A cycle exists in the wait-for graph                 |

### Deadlock Detection

PostgreSQL runs a **deadlock detector** periodically (default: every 1 second,
configurable via `deadlock_timeout`). When a cycle is detected, one transaction
is chosen as the **victim** and aborted with:

```
ERROR:  deadlock detected
DETAIL: Process 1234 waits for ShareLock on transaction 5678;
        blocked by process 5678.
        Process 5678 waits for ShareLock on transaction 1234;
        blocked by process 1234.
```

### Deadlock Prevention Strategies

1. **Lock ordering**: Always acquire locks in a consistent order (e.g., by ascending
   primary key). If Txn A and Txn B both lock row 1 before row 2, no cycle can form.

   ```sql
   -- Always lock lower ID first
   BEGIN;
   SELECT * FROM accounts WHERE id = 1 FOR UPDATE;  -- lock row 1 first
   SELECT * FROM accounts WHERE id = 2 FOR UPDATE;  -- then row 2
   -- Both transactions use same order = no deadlock
   COMMIT;
   ```

2. **Lock timeout**: Set `lock_timeout` so transactions fail fast instead of
   waiting indefinitely.

   ```sql
   SET lock_timeout = '5s';  -- give up if lock not acquired within 5 seconds
   ```

3. **Minimize transaction duration**: Short transactions hold locks briefly, reducing
   the window for deadlocks.

4. **Use NOWAIT**: Fail immediately if the lock is not available.

---

## Advisory Locks in PostgreSQL

Application-defined locks that are not tied to any specific table or row.

```sql
-- Acquire an advisory lock (blocks until available)
SELECT pg_advisory_lock(12345);

-- Do some application-level work that needs mutual exclusion
-- (e.g., running a data migration, generating a report)

-- Release the lock
SELECT pg_advisory_unlock(12345);

-- Non-blocking version (returns true/false)
SELECT pg_try_advisory_lock(12345);  -- returns false if already locked
```

### Use Cases

- Preventing duplicate cron job execution across multiple app servers
- Coordinating data migrations
- Implementing distributed mutexes (within a single database)
- Rate limiting per-user operations

### Transaction-Level Advisory Locks

```sql
BEGIN;
SELECT pg_advisory_xact_lock(12345);  -- released automatically at COMMIT/ROLLBACK
-- ... work ...
COMMIT;  -- lock released
```

---

## Connection Pooling

### Why Needed

Each database connection consumes memory (~5-10 MB in PostgreSQL). A server handling
10,000 concurrent requests cannot open 10,000 connections. Connection pooling
maintains a small pool of reusable connections.

```
  Without pooling:                    With pooling:
  +----------+     10,000 conns      +----------+     50 conns
  | App      | ===================> | Database | OOM!
  | (10K req)|                       +----------+
  +----------+

  +----------+     +--------+     50 conns     +----------+
  | App      | --> | Pooler | ===============> | Database | OK!
  | (10K req)|     +--------+                  +----------+
  +----------+   (queues excess)
```

### PgBouncer

The most popular external connection pooler for PostgreSQL.

#### Pooling Modes

| Mode          | When Connection Returns to Pool | Use Case                |
|---------------|-------------------------------|--------------------------|
| **Session**   | When client disconnects        | Prepared statements, LISTEN/NOTIFY |
| **Transaction** | When transaction ends (COMMIT/ROLLBACK) | Most applications (recommended) |
| **Statement** | After each statement           | Simple autocommit workloads only |

```
  Transaction mode (recommended):

  Client A: BEGIN ... COMMIT  --> connection returned to pool
  Client B: picks up that connection immediately
  Client C: waits in queue if all connections busy
```

**Transaction mode gotchas:**
- Cannot use `SET` commands (settings reset between transactions)
- Cannot use prepared statements (they are session-scoped)
- Cannot use `LISTEN`/`NOTIFY` (requires persistent session)
- Cannot use temporary tables across transactions

#### PgBouncer Configuration Example

```ini
[databases]
mydb = host=127.0.0.1 port=5432 dbname=mydb

[pgbouncer]
pool_mode = transaction
max_client_conn = 10000       ; accept up to 10K client connections
default_pool_size = 50        ; 50 actual PostgreSQL connections
reserve_pool_size = 5         ; 5 extra for spikes
reserve_pool_timeout = 3      ; wait 3s before using reserve
server_idle_timeout = 600     ; close idle server connections after 10m
```

### HikariCP (JVM Applications)

The fastest JDBC connection pool. Used widely in Java/Kotlin applications.

```java
HikariConfig config = new HikariConfig();
config.setJdbcUrl("jdbc:postgresql://localhost:5432/mydb");
config.setUsername("app_user");
config.setPassword("secret");
config.setMaximumPoolSize(20);          // max connections in pool
config.setMinimumIdle(5);               // keep 5 idle connections ready
config.setConnectionTimeout(30000);     // 30s max wait for connection
config.setIdleTimeout(600000);          // close idle connections after 10m
config.setMaxLifetime(1800000);         // recycle connections after 30m

HikariDataSource ds = new HikariDataSource(config);
```

### Sizing the Pool

**Rule of thumb** from the HikariCP wiki:

```
  pool_size = (core_count * 2) + effective_spindle_count
```

For a 4-core machine with SSD: pool_size = (4 * 2) + 1 = 9

A smaller pool with a longer queue often outperforms a larger pool due to reduced
context switching and cache invalidation.

---

## Code Examples Summary

### Optimistic Locking (Python + psycopg2)

```python
def update_product_price(product_id, new_price):
    conn = get_connection()
    cur = conn.cursor()

    # Read current version
    cur.execute(
        "SELECT price, version FROM products WHERE id = %s",
        (product_id,)
    )
    row = cur.fetchone()
    if not row:
        raise NotFoundError(f"Product {product_id} not found")

    current_price, current_version = row

    # Attempt CAS update
    cur.execute(
        """UPDATE products
           SET price = %s, version = version + 1
           WHERE id = %s AND version = %s""",
        (new_price, product_id, current_version)
    )

    if cur.rowcount == 0:
        conn.rollback()
        raise ConflictError("Concurrent modification detected. Retry.")

    conn.commit()
```

### Pessimistic Locking (Python + psycopg2)

```python
def transfer_money(from_id, to_id, amount):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute("BEGIN")

        # Lock both rows in consistent order to prevent deadlock
        low_id, high_id = sorted([from_id, to_id])
        cur.execute(
            "SELECT id, balance FROM accounts WHERE id IN (%s, %s) "
            "ORDER BY id FOR UPDATE",
            (low_id, high_id)
        )
        rows = {row[0]: row[1] for row in cur.fetchall()}

        if rows[from_id] < amount:
            raise InsufficientFundsError()

        cur.execute(
            "UPDATE accounts SET balance = balance - %s WHERE id = %s",
            (amount, from_id)
        )
        cur.execute(
            "UPDATE accounts SET balance = balance + %s WHERE id = %s",
            (amount, to_id)
        )

        conn.commit()
    except Exception:
        conn.rollback()
        raise
```

---

## Interview Quick Reference

| Question | Key Points |
|----------|------------|
| "Optimistic vs pessimistic locking?" | Optimistic = version check at write, no locks held. Pessimistic = FOR UPDATE, locks held. Choose based on contention level. |
| "How do deadlocks happen?" | Circular wait: A holds X, waits for Y; B holds Y, waits for X. Fix: consistent lock ordering. |
| "What is 2PL?" | Growing phase (acquire locks) then shrinking phase (release). Guarantees serializability. |
| "How do you handle 10K concurrent connections?" | Connection pooling (PgBouncer in transaction mode). Database handles 50-100 actual connections. |
| "What is SELECT FOR UPDATE?" | Pessimistic lock on selected rows. Others wait until COMMIT/ROLLBACK. |
| "What are advisory locks?" | Application-defined locks, not tied to rows. Used for cron coordination, distributed mutexes. |

---

## Key Takeaways

1. **Shared vs Exclusive** locks form the foundation. Know the compatibility matrix.
2. **Optimistic locking** (version column + CAS) is preferred for low-contention,
   read-heavy workloads. No deadlock risk.
3. **Pessimistic locking** (SELECT FOR UPDATE) is preferred for high-contention,
   write-heavy workloads. Watch for deadlocks.
4. **Deadlocks** require all four Coffman conditions. Prevent them by lock ordering
   or detect them with the database's deadlock detector.
5. **Connection pooling** is essential in production. PgBouncer (transaction mode) for
   PostgreSQL, HikariCP for JVM. Pool size should be small.
6. **SKIP LOCKED** is a powerful tool for job-queue patterns.
