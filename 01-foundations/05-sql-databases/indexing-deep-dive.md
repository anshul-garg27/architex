# Indexing Deep Dive

## Why This Matters

Indexing is the single most impactful tool for SQL performance. In system design
interviews, you will be asked "how would you make this query fast?" and the answer
almost always starts with indexing. This document covers every index type you need
to know, when to use each, and the mistakes that trip people up.

---

## Full Table Scan vs Index Lookup

Without an index, the database must read **every row** in the table to find matches.

```
  Query: SELECT * FROM users WHERE email = 'alice@example.com';

  WITHOUT index (full table scan):
  +------+-------------------+-------+
  | id   | email             | name  |    Scan every row: O(n)
  +------+-------------------+-------+    1 million rows = 1 million comparisons
  |  1   | bob@example.com   | Bob   |
  |  2   | carol@example.com | Carol |
  |  3   | alice@example.com | Alice | <-- found at row 3, but must check all n rows
  | ...  | ...               | ...   |
  | 1M   | zara@example.com  | Zara  |
  +------+-------------------+-------+

  WITH B-Tree index on email:
  Root --> Internal Node --> Leaf Node --> Row pointer
  O(log n) comparisons: log2(1,000,000) ~ 20 comparisons
```

| Approach        | Time Complexity | 1M rows   | 100M rows  |
|-----------------|-----------------|-----------|------------|
| Full table scan | O(n)            | ~1M reads | ~100M reads|
| B-Tree index    | O(log n)        | ~20 reads | ~27 reads  |

That is the difference between milliseconds and minutes.

---

## B-Tree Index

The **B-Tree** (balanced tree) is the default and most common index type in every
major RDBMS (PostgreSQL, MySQL, Oracle, SQL Server).

### Properties

- Self-balancing: all leaf nodes are at the same depth
- Each node can hold multiple keys (high fan-out, typically 100-500 keys per node)
- Supports equality lookups, range queries, and ORDER BY
- Height is typically 3-4 levels even for billions of rows

### B-Tree Structure (3 Levels)

```
                          +------------------+
                          |   [30 | 60]      |    <-- Root (Level 0)
                          +--/----+----\-----+
                         /        |         \
                        v         v          v
              +-----------+  +-----------+  +-----------+
              | [10 | 20] |  | [40 | 50] |  | [70 | 80] |  <-- Internal (Level 1)
              +--/--+--\--+  +--/--+--\--+  +--/--+--\--+
              /    |    \    /    |    \    /    |    \
             v     v     v  v     v     v  v     v     v
           +---+ +---+ +---++---++---++---++---++---++---+
    Lvl 2: | 5 | |15 | |25 ||35 ||45 ||55 ||65 ||75 ||90 |  <-- Leaf nodes
           |10 | |20 | |30 ||40 ||50 ||60 ||70 ||80 ||95 |
           +---+ +---+ +---++---++---++---++---++---++---+
             |     |     |    |    |    |    |    |    |
             v     v     v    v    v    v    v    v    v
           [data pointers to actual table rows]
```

### Search Example: Find key = 45

```
  1. Start at root [30 | 60]
     45 > 30 and 45 < 60  -->  follow middle pointer

  2. Reach internal node [40 | 50]
     45 > 40 and 45 < 50  -->  follow middle pointer

  3. Reach leaf node containing [45]
     Found! Follow data pointer to the actual row.

  Total comparisons: 3 levels = 3 node reads (typically 3 disk I/Os)
```

### Insert and Delete

- **Insert**: Navigate to the correct leaf, insert the key. If the leaf is full,
  **split** it and propagate the middle key up to the parent. Splits can cascade
  up to the root.
- **Delete**: Navigate to the leaf, remove the key. If the leaf becomes less than
  half full, **merge** with a sibling or **redistribute** keys. Merges can cascade.

### Why B-Tree and Not Binary Tree?

A binary tree has fan-out of 2, so height = log2(n). For 1 billion rows, that is
~30 levels = 30 disk I/Os per lookup.

A B-Tree with fan-out 500 has height = log500(1B) ~ 3-4 levels = 3-4 disk I/Os.
Each node is sized to fit one disk page (typically 4-16 KB).

---

## B+ Tree

Most real databases use **B+ Trees**, a variant of B-Trees. PostgreSQL, MySQL/InnoDB,
and virtually all production systems use B+ Trees.

### Key Difference from B-Tree

| Feature           | B-Tree                    | B+ Tree                         |
|-------------------|---------------------------|---------------------------------|
| Data in internal  | Yes (keys + data pointers)| No (keys only, for navigation)  |
| nodes?            |                           |                                 |
| Data in leaf      | Yes                       | Yes (ALL data pointers here)    |
| nodes?            |                           |                                 |
| Leaf linked list? | No                        | Yes (doubly linked)             |
| Range scans       | Must traverse tree again  | Follow leaf pointers -- fast!   |
| Fan-out           | Lower (nodes store data)  | Higher (internal nodes are thin) |

### B+ Tree Diagram

```
                          +------------------+
                          |   [30 | 60]      |    <-- Root (keys only)
                          +--/----+----\-----+
                         /        |         \
                        v         v          v
              +-----------+  +-----------+  +-----------+
              | [10 | 20] |  | [40 | 50] |  | [70 | 80] |  <-- Internal (keys only)
              +--/--+--\--+  +--/--+--\--+  +--/--+--\--+
              /    |    \    /    |    \    /    |    \
             v     v     v  v     v     v  v     v     v
           +---+  +---+  +---+  +---+  +---+  +---+  +---+
    Leaf:  | 5 |->|10 |->|20 |->|30 |->|40 |->|50 |->|60 |-> ...
           |ptr|  |ptr|  |ptr|  |ptr|  |ptr|  |ptr|  |ptr|
           +---+  +---+  +---+  +---+  +---+  +---+  +---+
             ^                                           |
             |       Doubly linked leaf chain            |
             +<--<--<--<--<--<--<--<--<--<--<--<--<--<--+
```

### Why Databases Prefer B+ Tree

1. **Range scans are fast**: `WHERE price BETWEEN 10 AND 50` finds the first leaf
   then follows the linked list. No need to revisit the tree.
2. **Higher fan-out**: Internal nodes hold more keys because they do not store data
   pointers, so the tree is shallower.
3. **Sequential I/O on scans**: Leaf pages are often physically contiguous, making
   range scans efficient on disk.
4. **Consistent performance**: Every lookup traverses root-to-leaf, same depth.

---

## Hash Index

A hash index maps keys through a hash function to bucket locations.

### How It Works

```
  key "alice@example.com"
     |
     v
  hash("alice@example.com") = 0x7A3F
     |
     v
  bucket 0x7A3F --> row pointer (id=3, offset=0x1200)
```

### Pros and Cons

| Aspect        | Hash Index                     | B-Tree Index              |
|---------------|-------------------------------|---------------------------|
| Exact match   | O(1) -- constant time          | O(log n)                 |
| Range query   | Not supported                  | Supported                |
| ORDER BY      | Not supported                  | Supported                |
| LIKE 'abc%'   | Not supported                  | Supported (prefix only)  |
| Use case      | Primary key lookups, joins     | General purpose          |

### When to Use

- Equality-only lookups on high-cardinality columns (e.g., session tokens, UUIDs)
- PostgreSQL supports hash indexes (since v10 they are WAL-logged and crash-safe)
- MySQL/InnoDB does not expose user-created hash indexes, but uses an internal
  **adaptive hash index** automatically

---

## Composite (Multi-Column) Index

An index on multiple columns, ordered left to right.

```sql
CREATE INDEX idx_users_country_city_zip ON users (country, city, zip_code);
```

### The Leftmost Prefix Rule

The index can satisfy queries that use a **leftmost prefix** of the indexed columns:

```
  Index: (country, city, zip_code)

  CAN use index:
    WHERE country = 'US'                           -- uses (country)
    WHERE country = 'US' AND city = 'Austin'       -- uses (country, city)
    WHERE country = 'US' AND city = 'Austin'
      AND zip_code = '78701'                       -- uses all three

  CANNOT use index efficiently:
    WHERE city = 'Austin'                          -- skips country (leftmost)
    WHERE zip_code = '78701'                       -- skips country, city
    WHERE city = 'Austin' AND zip_code = '78701'   -- skips country
```

### Why Column Order Matters

Think of the index like a phone book sorted by last name, then first name:

```
  Phone book order:     | Can look up:          | Cannot efficiently look up:
  Adams, Alice          | All Adams             | All Alices (scattered
  Adams, Bob            | Adams, Alice          |   across many last names)
  Baker, Alice          | All Bakers            |
  Baker, Charlie        |                       |
```

**Interview tip**: When asked "what index would you create for this query?", always
consider the column order. Put the most selective (most unique) column first, or
match the query's WHERE/ORDER BY clause structure.

### Composite Index and Sorting

```sql
-- This query benefits from index (country, city):
SELECT * FROM users WHERE country = 'US' ORDER BY city;

-- This query CANNOT use the index for sorting:
SELECT * FROM users WHERE country = 'US' ORDER BY zip_code;
-- (zip_code is not the next column after country in the index)
```

---

## Covering Index

A covering index contains **all columns** the query needs. The database can answer
the query entirely from the index without ever touching the main table ("index-only
scan").

```sql
-- Query:
SELECT city, zip_code FROM users WHERE country = 'US';

-- Covering index:
CREATE INDEX idx_cover ON users (country, city, zip_code);
-- The index contains country (for filtering), city and zip_code (for SELECT).
-- No need to look up the main table row. Huge performance win.
```

### PostgreSQL INCLUDE Syntax

PostgreSQL lets you add non-key columns to an index with INCLUDE:

```sql
CREATE INDEX idx_cover ON users (country) INCLUDE (city, zip_code);
-- country is in the B-Tree key (searchable + sorted)
-- city, zip_code are stored in leaf pages only (not searchable, but available)
```

This keeps the internal nodes slim while still covering the query.

### When Covering Indexes Shine

- Frequent queries that SELECT a small set of columns with a WHERE on indexed columns
- Analytics dashboards that aggregate over a few columns
- Avoids random I/O to the heap (main table), which can be 10-100x faster

---

## Partial Index

An index that only includes rows matching a WHERE condition.

```sql
-- Only index active users (assume 5% of users are active)
CREATE INDEX idx_active_users ON users (email) WHERE is_active = true;
```

### Benefits

- **Smaller index**: 5% of the rows = 5% of the space and maintenance cost
- **Faster writes**: inserts/updates of inactive users don't touch this index
- **Faster reads**: smaller index = fewer pages to scan

### Use Cases

- Indexing only non-NULL values: `WHERE column IS NOT NULL`
- Indexing only recent records: `WHERE created_at > '2025-01-01'`
- Indexing only specific status values: `WHERE status = 'pending'`

---

## Full-Text Index

For searching natural language text (e.g., "find products containing 'wireless
bluetooth headphones'").

### How It Works: Inverted Index

```
  Documents:
    doc1: "wireless bluetooth headphones"
    doc2: "wired headphones with mic"
    doc3: "wireless keyboard and mouse"

  Inverted Index:
    "bluetooth"  --> [doc1]
    "headphones" --> [doc1, doc2]
    "keyboard"   --> [doc3]
    "mic"        --> [doc2]
    "mouse"      --> [doc3]
    "wired"      --> [doc2]
    "wireless"   --> [doc1, doc3]
    "and"        --> (stop word, excluded)
    "with"       --> (stop word, excluded)

  Query: "wireless headphones"
    "wireless"   --> [doc1, doc3]
    "headphones" --> [doc1, doc2]
    Intersection --> [doc1]   (matches both terms)
```

### PostgreSQL Full-Text Search

```sql
-- Create a tsvector column and GIN index
ALTER TABLE products ADD COLUMN search_vector tsvector;
UPDATE products SET search_vector = to_tsvector('english', name || ' ' || description);
CREATE INDEX idx_fts ON products USING GIN (search_vector);

-- Query
SELECT * FROM products
WHERE search_vector @@ to_tsquery('english', 'wireless & headphones');
```

### When to Use Full-Text vs LIKE

| Feature          | `LIKE '%keyword%'`      | Full-Text Index           |
|------------------|-------------------------|---------------------------|
| Performance      | Full scan (no index)    | Index lookup              |
| Relevance ranking| No                      | Yes (ts_rank)             |
| Stemming         | No ("run" != "running") | Yes                       |
| Stop words       | No filtering            | Filtered automatically    |
| Use case         | Simple substring match  | Search engine behavior    |

---

## GiST and GIN Indexes (PostgreSQL)

### GIN (Generalized Inverted Index)

Best for: **multi-valued data** -- arrays, JSONB, full-text search.

```sql
-- Index JSONB data
CREATE INDEX idx_tags ON products USING GIN (metadata jsonb_path_ops);

-- Query: find products where metadata contains {"color": "red"}
SELECT * FROM products WHERE metadata @> '{"color": "red"}';

-- Index array columns
CREATE INDEX idx_arr ON products USING GIN (tags);

-- Query: find products with tag 'electronics'
SELECT * FROM products WHERE tags @> ARRAY['electronics'];
```

### GiST (Generalized Search Tree)

Best for: **geometric, range, and spatial data**.

```sql
-- PostGIS: spatial index for geographic queries
CREATE INDEX idx_geo ON restaurants USING GiST (location);

-- Find restaurants within 5km of a point
SELECT * FROM restaurants
WHERE ST_DWithin(location, ST_MakePoint(-97.74, 30.27)::geography, 5000);

-- Range types
CREATE INDEX idx_schedule ON events USING GiST (time_range);

-- Find overlapping events
SELECT * FROM events WHERE time_range && '[2025-01-01, 2025-01-31]'::daterange;
```

### GiST vs GIN Summary

| Index  | Best For                    | Build Speed | Lookup Speed | Update Speed |
|--------|-----------------------------|-------------|--------------|--------------|
| GIN    | Exact containment, FTS      | Slower      | Faster       | Slower       |
| GiST   | Nearest-neighbor, overlaps  | Faster      | Slower       | Faster       |

---

## Index Selectivity and Cardinality

### Definitions

- **Cardinality**: Number of distinct values in a column.
- **Selectivity**: Cardinality / Total Rows. Range: 0 to 1.

### Why Low-Cardinality Columns Are Bad Indexes

```
  Column: gender (values: M, F, Other)
  Table: 10 million users
  Cardinality: 3
  Selectivity: 3 / 10,000,000 = 0.0000003

  Index lookup for gender = 'M' returns ~3.3 million rows.
  The database will just do a full table scan -- it is faster than
  following 3.3 million index pointers back to the table.
```

**Rule of thumb**: An index is useful when it filters out most rows. If a query
returns more than ~10-15% of the table, the optimizer often prefers a full scan.

### High-Selectivity Examples (Good Indexes)

| Column       | Cardinality       | Selectivity | Good Index? |
|--------------|-------------------|-------------|-------------|
| email        | ~10M (unique)     | 1.0         | Excellent   |
| user_id (FK) | ~10M              | ~1.0        | Excellent   |
| created_at   | ~10M (timestamps) | ~1.0        | Good        |
| status       | 5 values          | 0.0000005   | Poor*       |
| is_active    | 2 values (bool)   | 0.0000002   | Poor*       |

*Unless combined with other columns in a composite index, or used as a partial index.

---

## When NOT to Index

1. **Write-heavy tables**: Every INSERT, UPDATE, DELETE must also update every index.
   More indexes = slower writes.

2. **Small tables**: If the table has < 1000 rows, a full scan fits in a single disk
   page. An index adds overhead for no benefit.

3. **Columns rarely queried**: An index on a column nobody filters or joins on is
   pure waste (space + write overhead).

4. **Highly volatile columns**: Columns updated every request (e.g., `last_seen_at`
   timestamp) cause constant index maintenance.

5. **Columns used only with functions**: `WHERE UPPER(email) = 'ALICE@EXAMPLE.COM'`
   cannot use a regular index on `email`. You need a **functional index**:
   ```sql
   CREATE INDEX idx_upper_email ON users (UPPER(email));
   ```

---

## EXPLAIN Plan Reading Guide

### How to Read a Query Plan

```sql
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';
```

```
  Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=256)
    (actual time=0.023..0.025 rows=1 loops=1)
    Index Cond: (email = 'alice@example.com'::text)
  Planning Time: 0.152 ms
  Execution Time: 0.048 ms
```

### Key Fields to Examine

| Field              | Meaning                                               |
|--------------------|-------------------------------------------------------|
| **Scan type**      | Seq Scan (bad for large tables), Index Scan (good),   |
|                    | Index Only Scan (best), Bitmap Scan (good for ranges) |
| **cost**           | Estimated cost in arbitrary units (startup..total)    |
| **rows**           | Estimated row count (compare with actual!)            |
| **actual time**    | Real execution time in ms (only with ANALYZE)         |
| **loops**          | How many times this node executed                     |
| **Filter**         | Post-scan filter (means index was NOT fully used)     |
| **Index Cond**     | Condition pushed down to the index (good)             |
| **Rows Removed**   | Rows read but then discarded by filter (waste)        |

### Common Scan Types

```
  Best to worst (generally):

  1. Index Only Scan   -- answer from index alone (covering index)
  2. Index Scan        -- use index, then fetch row from table
  3. Bitmap Index Scan -- combine multiple indexes, then fetch
  4. Seq Scan          -- full table scan (fine for small tables)
```

### Red Flags in EXPLAIN Output

```
  Red Flag                          What It Means
  ──────────────────────────────    ────────────────────────────────────
  Seq Scan on large table           Missing index or bad query
  "rows=1" but "actual rows=50000" Stale statistics (run ANALYZE)
  "Rows Removed by Filter: 99999"  Index only partially effective
  Nested Loop with Seq Scan inner  Missing index on join column
  Sort + Limit without index       Could be index-driven sort
```

### Example: Spotting a Missing Index

```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 42 AND status = 'pending';
```

```
  Seq Scan on orders  (cost=0.00..25000.00 rows=50 width=128)
    (actual time=120.5..350.2 rows=3 loops=1)
    Filter: ((user_id = 42) AND (status = 'pending'::text))
    Rows Removed by Filter: 999997
```

**Diagnosis**: Seq Scan on 1M rows, 999,997 rows thrown away. Fix:

```sql
CREATE INDEX idx_orders_user_status ON orders (user_id, status);
```

After:

```
  Index Scan using idx_orders_user_status on orders  (cost=0.42..12.50 rows=3 width=128)
    (actual time=0.03..0.04 rows=3 loops=1)
    Index Cond: ((user_id = 42) AND (status = 'pending'::text))
```

350ms --> 0.04ms. That is an 8,750x improvement.

---

## Common Indexing Mistakes in Interviews

### 1. Indexing Every Column

"Just put an index on everything!" -- No. Each index slows writes, consumes storage,
and the optimizer can only use a few indexes per query anyway.

### 2. Wrong Column Order in Composite Index

```sql
-- Query: WHERE status = 'active' AND created_at > '2025-01-01'
-- BAD:  INDEX (created_at, status)  -- status is the equality, should come first
-- GOOD: INDEX (status, created_at)  -- equality first, then range
```

**Rule**: In a composite index, put **equality** columns before **range** columns.

### 3. Forgetting Function Invalidation

```sql
-- This query CANNOT use an index on created_at:
WHERE DATE(created_at) = '2025-01-15'
-- Rewrite to:
WHERE created_at >= '2025-01-15' AND created_at < '2025-01-16'
```

### 4. Over-Indexing Boolean Columns

An index on `is_deleted` (true/false) is nearly useless by itself. Use a partial
index instead: `WHERE is_deleted = false`.

### 5. Not Considering Index Maintenance

In an interview, mention write amplification: "We'd add this index, but since this
table handles 50K inserts/sec, we need to weigh the write overhead."

### 6. Ignoring the Optimizer

The database optimizer may choose not to use your index if it estimates a full scan
would be faster (e.g., query returns >15% of rows). Always validate with EXPLAIN.

---

## Interview Quick Reference

| Question | Key Points |
|----------|------------|
| "How do indexes work?" | B+ Tree, O(log n) lookups, leaf-level linked list for range scans |
| "When would you NOT use an index?" | Write-heavy, small tables, low selectivity, rarely queried columns |
| "Explain composite index" | Leftmost prefix rule, column order matters, equality before range |
| "What is a covering index?" | Index contains all columns the query needs, avoids table lookup |
| "How do you debug slow queries?" | EXPLAIN ANALYZE, look for Seq Scans, filter waste, row estimate drift |
| "Hash vs B-Tree index?" | Hash = O(1) exact match only. B-Tree = O(log n) but supports range, sort |
| "How would you index JSON data?" | GIN index in PostgreSQL with jsonb_path_ops |

---

## Key Takeaways

1. **B+ Tree** is the workhorse. Understand its structure, why leaf linking matters,
   and why fan-out beats binary trees.
2. **Composite index column order** is the most common interview gotcha. Equality
   columns first, then range columns, matching the query pattern.
3. **Covering indexes** eliminate table lookups entirely -- the biggest single
   performance optimization for read-heavy queries.
4. **Partial indexes** save space and write overhead by indexing only relevant rows.
5. **EXPLAIN ANALYZE** is your diagnostic tool. Know how to read it.
6. **Selectivity matters**: indexing a boolean column alone is almost always wrong.
7. Every index has a **write cost**. Always discuss the trade-off in interviews.
