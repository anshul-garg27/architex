# Isolation Levels and MVCC

## Why This Matters

Isolation is the "I" in ACID and the trickiest property to reason about. In system
design interviews, understanding isolation levels tells the interviewer you can
reason about concurrent access, stale reads, and the trade-offs between correctness
and throughput. MVCC is the mechanism that makes it all work in PostgreSQL and most
modern databases.

---

## The Three Read Phenomena

These are the anomalies that can occur when transactions run concurrently. The SQL
standard defines isolation levels in terms of which phenomena they permit.

---

### 1. Dirty Read

**Reading data written by a transaction that has not yet committed.**

```
  Transaction A                        Transaction B
  ─────────────                        ─────────────
  BEGIN;
  UPDATE accounts
    SET balance = 500
    WHERE id = 1;
    -- balance was 1000, now 500
    -- NOT YET COMMITTED
                                       BEGIN;
                                       SELECT balance FROM accounts
                                         WHERE id = 1;
                                       --> Returns 500 (DIRTY!)
  ROLLBACK;
  -- balance goes back to 1000
                                       -- Transaction B made a decision
                                       -- based on $500 that never existed.
                                       COMMIT;
```

**Why it is dangerous**: Transaction B saw phantom data. If B triggered a
notification "your balance is $500", that was a lie -- the balance was always $1000.

---

### 2. Non-Repeatable Read

**Same query within a transaction returns different results because another
transaction modified and committed a row between the two reads.**

```
  Transaction A                        Transaction B
  ─────────────                        ─────────────
  BEGIN;
  SELECT balance FROM accounts
    WHERE id = 1;
  --> Returns 1000

                                       BEGIN;
                                       UPDATE accounts
                                         SET balance = 500
                                         WHERE id = 1;
                                       COMMIT;

  SELECT balance FROM accounts
    WHERE id = 1;
  --> Returns 500 (DIFFERENT!)
  -- Same query, same txn, different result.
  COMMIT;
```

**Why it is dangerous**: Transaction A might compute something based on balance=1000,
then later verify and find balance=500. Logic within a single transaction should see
a consistent view.

---

### 3. Phantom Read

**Same query within a transaction returns a different SET of rows because another
transaction inserted or deleted rows that match the query condition.**

```
  Transaction A                        Transaction B
  ─────────────                        ─────────────
  BEGIN;
  SELECT COUNT(*) FROM orders
    WHERE status = 'pending';
  --> Returns 5

                                       BEGIN;
                                       INSERT INTO orders (status)
                                         VALUES ('pending');
                                       COMMIT;

  SELECT COUNT(*) FROM orders
    WHERE status = 'pending';
  --> Returns 6 (PHANTOM ROW!)
  COMMIT;
```

**Why it is dangerous**: Transaction A saw 5 pending orders, allocated 5 workers,
then found 6 orders. The new row "appeared out of nowhere" -- a phantom.

---

## The Four Isolation Levels

The SQL standard defines four levels. Each permits fewer anomalies but costs more.

```
  +--------------------+------------+------------------+-----------+
  | Isolation Level    | Dirty Read | Non-Repeatable   | Phantom   |
  |                    |            | Read             | Read      |
  +--------------------+------------+------------------+-----------+
  | READ UNCOMMITTED   |    Yes     |       Yes        |    Yes    |
  +--------------------+------------+------------------+-----------+
  | READ COMMITTED     |    No      |       Yes        |    Yes    |
  +--------------------+------------+------------------+-----------+
  | REPEATABLE READ    |    No      |       No         |  Yes*     |
  +--------------------+------------+------------------+-----------+
  | SERIALIZABLE       |    No      |       No         |    No     |
  +--------------------+------------+------------------+-----------+

  * PostgreSQL's REPEATABLE READ actually prevents phantom reads too
    (it uses Snapshot Isolation, which is stronger than SQL standard
     REPEATABLE READ). MySQL/InnoDB's REPEATABLE READ can have phantoms.
```

### Level 1: READ UNCOMMITTED

- Transactions can see uncommitted changes from other transactions.
- Almost never used in practice. PostgreSQL does not even implement it -- it silently
  upgrades to READ COMMITTED.
- Use case: rough real-time analytics where accuracy does not matter.

### Level 2: READ COMMITTED (PostgreSQL default)

- Each statement sees only data committed before that **statement** began.
- Two identical SELECTs in the same transaction may return different results if
  another transaction commits between them.

```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- sees committed data as of now
  -- another txn commits a change
  SELECT balance FROM accounts WHERE id = 1;  -- may see the new committed value
COMMIT;
```

### Level 3: REPEATABLE READ

- Transaction sees a consistent snapshot taken at the start of the transaction.
- All reads within the transaction see the same data, regardless of what other
  transactions commit.

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
  SELECT balance FROM accounts WHERE id = 1;  -- snapshot taken here
  -- another txn commits a change to id=1
  SELECT balance FROM accounts WHERE id = 1;  -- still sees the old value
COMMIT;
```

### Level 4: SERIALIZABLE

- Transactions execute as if they ran one at a time, in some serial order.
- Strongest guarantee. Prevents all anomalies including write skew.
- PostgreSQL implements this using **Serializable Snapshot Isolation (SSI)**.

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
  -- fully isolated, as if no other transactions exist
COMMIT;
-- If a conflict is detected, one transaction is aborted and must retry.
```

---

## How PostgreSQL Implements Each Level

| Level              | Implementation                                        |
|--------------------|-------------------------------------------------------|
| READ UNCOMMITTED   | Treated as READ COMMITTED (PG never allows dirty reads)|
| READ COMMITTED     | New snapshot per statement                             |
| REPEATABLE READ    | Single snapshot for entire transaction (Snapshot Iso.)  |
| SERIALIZABLE       | SSI: snapshot + dependency tracking + conflict detection|

**Key insight**: PostgreSQL uses MVCC at all levels. It never uses read locks. Readers
never block writers, and writers never block readers. Conflicts are resolved by
detecting violations and aborting one transaction.

---

## MVCC (Multi-Version Concurrency Control)

### The Core Idea

Instead of locking rows to prevent concurrent access, MVCC **keeps multiple versions**
of each row. Each transaction sees the version of the row that was current at the time
the transaction's snapshot was taken.

### How It Works in PostgreSQL

Every row in PostgreSQL has two hidden system columns:

| Column   | Meaning                                            |
|----------|----------------------------------------------------|
| `xmin`   | Transaction ID that **created** this row version   |
| `xmax`   | Transaction ID that **deleted/updated** this row   |
|          | (0 if the row is still live)                       |

When a row is **updated**, PostgreSQL does NOT modify it in place. Instead:

1. The old row version is marked with `xmax = current_txn_id`
2. A new row version is inserted with `xmin = current_txn_id`, `xmax = 0`

```
  Before UPDATE (balance 1000 -> 500):

  Heap Page:
  +----------------------------------------------------------+
  | Row Version 1:  xmin=100  xmax=0    balance=1000         |
  +----------------------------------------------------------+

  After UPDATE by transaction 200:

  Heap Page:
  +----------------------------------------------------------+
  | Row Version 1:  xmin=100  xmax=200  balance=1000  (dead) |
  | Row Version 2:  xmin=200  xmax=0    balance=500   (live) |
  +----------------------------------------------------------+
```

### Visibility Rules

A row version is visible to transaction T if:
1. `xmin` is committed AND `xmin` started before T's snapshot, AND
2. `xmax` is either 0 (not deleted) OR `xmax` is not committed OR `xmax` started
   after T's snapshot.

Simplified: "I can see this row if it was created before my snapshot and not deleted
before my snapshot."

### MVCC in Action: Two Concurrent Transactions

```
  Initial state: account balance = 1000 (created by txn 100)

  Txn 200 (snapshot at time 10)         Txn 300 (snapshot at time 11)
  ───────────────────────────           ───────────────────────────

  BEGIN (snapshot: sees txn <= 199)      BEGIN (snapshot: sees txn <= 299)

                                         SELECT balance WHERE id=1;
                                         --> Sees xmin=100 (committed, < 300)
                                         --> xmax=0 (not deleted)
                                         --> Returns 1000  (correct)

  UPDATE balance = 500 WHERE id=1;
  -- Creates new version:
  --   old row: xmin=100, xmax=200
  --   new row: xmin=200, xmax=0

                                         SELECT balance WHERE id=1;
                                         --> Old row: xmax=200, but 200 not
                                         -->   yet committed. Still visible!
                                         --> Returns 1000 (consistent!)

  COMMIT;
  -- Txn 200 is now committed

                                         SELECT balance WHERE id=1;
                                         --> Under REPEATABLE READ:
                                         -->   snapshot was taken at BEGIN
                                         -->   Txn 200 was NOT committed at
                                         -->   snapshot time. Still sees 1000.
                                         --> Under READ COMMITTED:
                                         -->   new snapshot per statement
                                         -->   Txn 200 IS now committed.
                                         -->   Sees 500.

                                         COMMIT;
```

### MVCC Diagram

```
  Timeline:
  ─────────────────────────────────────────────────────────>

  Txn 200:  [------- UPDATE balance=500 ------- COMMIT]
  Txn 300:  [-- SELECT ------ SELECT ------ SELECT -- COMMIT]

  What Txn 300 sees (REPEATABLE READ):
    All three SELECTs: balance = 1000
    (snapshot frozen at BEGIN, txn 200 was not yet committed)

  What Txn 300 sees (READ COMMITTED):
    First SELECT:  balance = 1000 (txn 200 not committed yet)
    Second SELECT: balance = 1000 (txn 200 not committed yet)
    Third SELECT:  balance = 500  (txn 200 committed, new snapshot)
```

---

## VACUUM: Cleaning Up Dead Tuples

### Why VACUUM Is Needed

MVCC creates dead row versions (old tuples with xmax set). These dead tuples:
- Waste disk space
- Slow down sequential scans (database reads through dead rows)
- Bloat indexes (index entries still point to dead tuples)

### How VACUUM Works

```
  Before VACUUM:
  +----------------------------------------------------------+
  | Row v1: xmin=100  xmax=200  balance=1000  [DEAD]         |
  | Row v2: xmin=200  xmax=300  balance=500   [DEAD]         |
  | Row v3: xmin=300  xmax=0    balance=750   [LIVE]         |
  +----------------------------------------------------------+
  Page utilization: 33% useful, 67% dead

  After VACUUM:
  +----------------------------------------------------------+
  | [free space]                                              |
  | [free space]                                              |
  | Row v3: xmin=300  xmax=0    balance=750   [LIVE]         |
  +----------------------------------------------------------+
  Dead tuples removed, space reclaimed for reuse (but NOT returned to OS).
```

### VACUUM vs VACUUM FULL

| Operation      | What It Does                              | Locks?         |
|----------------|-------------------------------------------|----------------|
| VACUUM         | Marks dead tuple space as reusable        | No lock        |
| VACUUM FULL    | Rewrites entire table, returns space to OS| Exclusive lock!|
| autovacuum     | Background daemon runs VACUUM periodically| No lock        |

### Autovacuum Tuning

PostgreSQL's autovacuum daemon runs automatically. Key parameters:

```
autovacuum_vacuum_threshold = 50          -- min dead tuples before vacuum
autovacuum_vacuum_scale_factor = 0.2      -- fraction of table size
-- Vacuum triggers when: dead_tuples > threshold + scale_factor * table_size
-- For a 1M row table: 50 + 0.2 * 1,000,000 = 200,050 dead tuples
```

**Common production issue**: On write-heavy tables, autovacuum may fall behind.
Dead tuples accumulate, table bloats, queries slow down. Solutions:
- Lower `autovacuum_vacuum_scale_factor` for large tables
- Increase `autovacuum_vacuum_cost_limit` to let vacuum work faster
- Run manual VACUUM during off-peak hours

---

## Snapshot Isolation vs Serializable: The Write Skew Anomaly

### What Is Write Skew?

Snapshot Isolation (PostgreSQL's REPEATABLE READ) prevents dirty reads,
non-repeatable reads, and phantom reads. But it allows **write skew**.

### The Classic Example: On-Call Doctor Scheduling

Hospital rule: At least one doctor must be on call at all times.

```
  Initial state: Alice=on_call, Bob=on_call (2 doctors on call)

  Txn A (Alice wants to go off-call)     Txn B (Bob wants to go off-call)
  ──────────────────────────────────      ─────────────────────────────────
  BEGIN REPEATABLE READ;                  BEGIN REPEATABLE READ;

  SELECT COUNT(*) FROM doctors            SELECT COUNT(*) FROM doctors
    WHERE on_call = true;                   WHERE on_call = true;
  --> 2 (Alice and Bob)                   --> 2 (Alice and Bob)

  -- 2 > 1, so safe to go off-call       -- 2 > 1, so safe to go off-call

  UPDATE doctors SET on_call = false      UPDATE doctors SET on_call = false
    WHERE name = 'Alice';                   WHERE name = 'Bob';

  COMMIT;                                 COMMIT;

  Final state: Alice=off_call, Bob=off_call
  NOBODY IS ON CALL -- invariant violated!
```

Both transactions read a snapshot where 2 doctors were on call, both decided it was
safe to go off-call, and both committed. Neither saw the other's write because they
were working from their own snapshot.

### How SERIALIZABLE Prevents This

Under SERIALIZABLE isolation, PostgreSQL's SSI (Serializable Snapshot Isolation)
tracks read-write dependencies. It detects that Txn A and Txn B have conflicting
read-write patterns and **aborts one** of them:

```
  Txn A: reads on_call count, writes Alice.on_call
  Txn B: reads on_call count, writes Bob.on_call
  Conflict: both read the same data that the other writes
  --> One transaction aborted with serialization failure
  --> Application retries the aborted transaction, sees count=1, does not proceed
```

### When to Use SERIALIZABLE

- Financial calculations where write skew could cause incorrect totals
- Inventory systems where double-allocation must be prevented
- Any system where correctness under concurrency is non-negotiable
- **Cost**: higher abort rate, application must handle retries

---

## Setting Isolation Levels

### Per-Transaction

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- ... operations ...
COMMIT;

-- Or inline:
BEGIN ISOLATION LEVEL REPEATABLE READ;
-- ... operations ...
COMMIT;
```

### Per-Session

```sql
SET SESSION CHARACTERISTICS AS TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

### Per-Database (PostgreSQL)

```sql
ALTER DATABASE mydb SET default_transaction_isolation = 'serializable';
```

---

## Practical Guidance: Which Level to Choose?

```
  +------------------------------------------+---------------------------+
  | Use Case                                 | Recommended Level         |
  +------------------------------------------+---------------------------+
  | Most web applications (default)          | READ COMMITTED            |
  | Reports that need consistent snapshot    | REPEATABLE READ           |
  | Financial transactions, booking systems  | SERIALIZABLE              |
  | Analytics on stale data (rare)           | READ UNCOMMITTED (avoid)  |
  +------------------------------------------+---------------------------+
```

### The Retry Pattern for SERIALIZABLE

```python
import psycopg2

MAX_RETRIES = 3

def transfer_money(from_id, to_id, amount):
    for attempt in range(MAX_RETRIES):
        try:
            conn = get_connection()
            conn.set_isolation_level(
                psycopg2.extensions.ISOLATION_LEVEL_SERIALIZABLE
            )
            cur = conn.cursor()
            cur.execute("BEGIN")
            cur.execute(
                "UPDATE accounts SET balance = balance - %s WHERE id = %s",
                (amount, from_id)
            )
            cur.execute(
                "UPDATE accounts SET balance = balance + %s WHERE id = %s",
                (amount, to_id)
            )
            conn.commit()
            return  # success
        except psycopg2.errors.SerializationFailure:
            conn.rollback()
            if attempt == MAX_RETRIES - 1:
                raise
            # retry
```

---

## Interview Quick Reference

| Question | Key Points |
|----------|------------|
| "What are dirty/non-repeatable/phantom reads?" | Define each with a two-transaction example |
| "What isolation level would you use?" | READ COMMITTED for most apps, SERIALIZABLE for financial correctness |
| "How does MVCC work?" | Row versions with xmin/xmax, readers never block writers, snapshot determines visibility |
| "What is VACUUM?" | Cleans dead tuples left by MVCC, autovacuum runs in background |
| "What is write skew?" | Two txns read overlapping data, make decisions, both commit -- invariant violated. Fix: SERIALIZABLE |
| "PostgreSQL vs MySQL isolation?" | PG REPEATABLE READ = Snapshot Isolation (no phantoms). MySQL REPEATABLE READ uses gap locking, can still have issues |

---

## Key Takeaways

1. **Read phenomena** (dirty, non-repeatable, phantom) are the vocabulary for
   discussing isolation. Know them with examples.
2. **READ COMMITTED** is the safe default for most applications. Each statement sees
   the latest committed data.
3. **REPEATABLE READ** in PostgreSQL is actually Snapshot Isolation -- stronger than
   the SQL standard requires.
4. **SERIALIZABLE** prevents write skew but requires retry logic in your application.
5. **MVCC** is what makes PostgreSQL fast under concurrency: no read locks, multiple
   row versions, visibility based on snapshots.
6. **VACUUM** is the price you pay for MVCC. Understand autovacuum and its tuning.
7. In interviews, always mention the **trade-off**: stronger isolation = more aborts
   and retries = lower throughput.
