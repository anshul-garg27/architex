// ── DBL-142: Daily Challenge Pool ────────────────────────────
// Deterministic daily selection: challenges[dateHash % challenges.length]

export interface DailyChallenge {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  // ── Normalization (10) ──────────────────────────────────────
  {
    id: "norm-01",
    question: "What normal form allows partial dependencies?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctIndex: 0,
    explanation:
      "1NF only requires atomic values and a primary key. Partial dependencies (where a non-key attribute depends on part of a composite key) are allowed in 1NF but eliminated in 2NF.",
    category: "normalization",
  },
  {
    id: "norm-02",
    question: "Which normal form eliminates transitive dependencies?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctIndex: 2,
    explanation:
      "3NF eliminates transitive dependencies — where a non-key attribute depends on another non-key attribute. For example, if StudentID -> DeptID -> DeptName, then DeptName transitively depends on StudentID.",
    category: "normalization",
  },
  {
    id: "norm-03",
    question:
      "A table has columns {StudentID, CourseID, CourseName, Grade}. StudentID+CourseID is the primary key. CourseName depends only on CourseID. What is the highest normal form?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctIndex: 0,
    explanation:
      "CourseName depends on CourseID alone, which is only part of the composite primary key. This is a partial dependency, violating 2NF. The table is only in 1NF.",
    category: "normalization",
  },
  {
    id: "norm-04",
    question: "BCNF is stricter than 3NF. What additional constraint does it add?",
    options: [
      "Every determinant must be a superkey",
      "No multi-valued dependencies",
      "No partial dependencies",
      "All attributes must be atomic",
    ],
    correctIndex: 0,
    explanation:
      "BCNF requires that for every functional dependency X -> Y, X must be a superkey. 3NF allows non-superkey determinants if the dependent attribute is part of a candidate key.",
    category: "normalization",
  },
  {
    id: "norm-05",
    question: "What does denormalization trade for query performance?",
    options: [
      "Data integrity (risk of anomalies)",
      "Storage space only",
      "Network bandwidth",
      "Transaction support",
    ],
    correctIndex: 0,
    explanation:
      "Denormalization introduces redundancy to reduce JOINs and speed up reads. The trade-off is increased risk of update, insert, and delete anomalies — you must update data in multiple places.",
    category: "normalization",
  },
  {
    id: "norm-06",
    question: "Which decomposition property ensures no data loss when splitting tables?",
    options: [
      "Lossless join",
      "Dependency preservation",
      "Referential integrity",
      "Atomic decomposition",
    ],
    correctIndex: 0,
    explanation:
      "A lossless-join decomposition guarantees that joining the decomposed tables produces exactly the original table — no spurious tuples are introduced.",
    category: "normalization",
  },
  {
    id: "norm-07",
    question: "Which anomaly occurs when deleting a row removes unrelated data?",
    options: [
      "Deletion anomaly",
      "Insertion anomaly",
      "Update anomaly",
      "Phantom anomaly",
    ],
    correctIndex: 0,
    explanation:
      "A deletion anomaly happens when removing a row causes loss of data about an unrelated entity. For example, deleting the last student in a department also deletes the department information.",
    category: "normalization",
  },
  {
    id: "norm-08",
    question: "What is 4NF concerned with eliminating?",
    options: [
      "Multi-valued dependencies",
      "Transitive dependencies",
      "Partial dependencies",
      "Join dependencies",
    ],
    correctIndex: 0,
    explanation:
      "4NF (Fourth Normal Form) eliminates multi-valued dependencies — where one attribute independently determines multiple values of two other attributes.",
    category: "normalization",
  },
  {
    id: "norm-09",
    question:
      "A relation R(A,B,C) has FDs: A->B and B->C. What is its highest normal form with key {A}?",
    options: ["1NF", "2NF", "3NF", "BCNF"],
    correctIndex: 1,
    explanation:
      "With key {A}, A->B is fine (full dependency on key). But B->C is a transitive dependency (A->B->C), which violates 3NF. There are no partial dependencies (key is a single attribute), so it is in 2NF.",
    category: "normalization",
  },
  {
    id: "norm-10",
    question: "What is the purpose of a functional dependency X -> Y?",
    options: [
      "Each X value determines exactly one Y value",
      "X and Y must be in the same table",
      "Y is a foreign key referencing X",
      "X must be a primary key",
    ],
    correctIndex: 0,
    explanation:
      "A functional dependency X -> Y means that for any two tuples with the same X value, they must have the same Y value. X uniquely determines Y.",
    category: "normalization",
  },

  // ── Indexing (10) ──────────────────────────────────────────
  {
    id: "idx-01",
    question: "O(log n) search — which index type?",
    options: ["B-Tree", "Hash Index", "Bitmap Index", "Full-text Index"],
    correctIndex: 0,
    explanation:
      "B-Trees provide O(log n) search by maintaining a balanced tree structure. Each level narrows the search space, so finding a value in a million rows takes about 20 comparisons.",
    category: "indexing",
  },
  {
    id: "idx-02",
    question: "What data structure does a hash index use?",
    options: ["Hash table", "Balanced tree", "Linked list", "Skip list"],
    correctIndex: 0,
    explanation:
      "A hash index uses a hash table — a hash function maps keys to bucket locations for O(1) average-case lookups. The trade-off: no range queries or ordering.",
    category: "indexing",
  },
  {
    id: "idx-03",
    question: "Which index type supports efficient range queries (e.g., WHERE price BETWEEN 10 AND 50)?",
    options: ["B-Tree", "Hash Index", "Bloom Filter", "Inverted Index"],
    correctIndex: 0,
    explanation:
      "B-Trees store keys in sorted order with linked leaf nodes, enabling efficient range scans. Hash indexes only support exact-match lookups — they cannot traverse a range.",
    category: "indexing",
  },
  {
    id: "idx-04",
    question: "What happens when you add too many indexes to a table?",
    options: [
      "Write performance degrades",
      "Read performance degrades",
      "The table becomes read-only",
      "Storage remains unchanged",
    ],
    correctIndex: 0,
    explanation:
      "Each index must be updated on every INSERT, UPDATE, or DELETE. More indexes mean more disk writes and WAL entries per mutation, degrading write throughput.",
    category: "indexing",
  },
  {
    id: "idx-05",
    question: "A composite index on (A, B, C) can help queries filtering on which combinations?",
    options: [
      "A; A+B; A+B+C",
      "Any combination of A, B, C",
      "Only A+B+C together",
      "B+C; A+C; A+B",
    ],
    correctIndex: 0,
    explanation:
      "Composite indexes follow the leftmost prefix rule. An index on (A,B,C) can be used for queries on A, A+B, or A+B+C — but not B alone or C alone.",
    category: "indexing",
  },
  {
    id: "idx-06",
    question: "What is a covering index?",
    options: [
      "An index that contains all columns needed by a query",
      "An index that covers all tables in a JOIN",
      "An index on a primary key",
      "An index with no null values",
    ],
    correctIndex: 0,
    explanation:
      "A covering index includes all columns referenced in a query. The database can answer the query entirely from the index without accessing the table (no heap fetch), which is significantly faster.",
    category: "indexing",
  },
  {
    id: "idx-07",
    question: "Why does a B+ Tree store all values in leaf nodes only?",
    options: [
      "To maximize fan-out in internal nodes and support efficient range scans",
      "To save memory in internal nodes",
      "Because internal nodes are read-only",
      "To prevent duplicate keys",
    ],
    correctIndex: 0,
    explanation:
      "B+ Trees keep values only at leaf nodes so internal nodes can fit more keys (higher fan-out = fewer tree levels). Leaf nodes are linked for fast sequential range scans.",
    category: "indexing",
  },
  {
    id: "idx-08",
    question: "What is the main disadvantage of a hash index?",
    options: [
      "Cannot perform range queries or ordered scans",
      "Slower than B-Tree for point lookups",
      "Requires more storage than B-Tree",
      "Cannot handle concurrent access",
    ],
    correctIndex: 0,
    explanation:
      "Hash indexes are optimized for equality lookups (O(1) average case) but cannot support ORDER BY, range queries, or prefix matching because keys are distributed by hash value, not sorted.",
    category: "indexing",
  },
  {
    id: "idx-09",
    question: "What causes an 'index scan' to degrade into a 'sequential scan'?",
    options: [
      "When the query returns a large percentage of rows",
      "When the index is too small",
      "When the table has no primary key",
      "When using transactions",
    ],
    correctIndex: 0,
    explanation:
      "If a query matches a large fraction of the table (typically >10-20%), the optimizer chooses a sequential scan because random I/O from index lookups becomes more expensive than reading the whole table sequentially.",
    category: "indexing",
  },
  {
    id: "idx-10",
    question: "What does EXPLAIN ANALYZE add compared to plain EXPLAIN?",
    options: [
      "Actual execution times and row counts",
      "Index recommendations",
      "Table statistics",
      "Query rewrite suggestions",
    ],
    correctIndex: 0,
    explanation:
      "EXPLAIN shows the planned execution. EXPLAIN ANALYZE actually runs the query and reports real execution times, actual row counts, and loop counts — essential for identifying where estimates diverge from reality.",
    category: "indexing",
  },

  // ── Transactions (10) ──────────────────────────────────────
  {
    id: "tx-01",
    question: "Which isolation level prevents phantom reads?",
    options: [
      "Serializable",
      "Repeatable Read",
      "Read Committed",
      "Read Uncommitted",
    ],
    correctIndex: 0,
    explanation:
      "Only Serializable isolation prevents phantom reads — where a repeated query returns new rows inserted by another committed transaction. It achieves this through predicate locking or serializable snapshot isolation.",
    category: "transactions",
  },
  {
    id: "tx-02",
    question: "What is a dirty read?",
    options: [
      "Reading data written by an uncommitted transaction",
      "Reading stale cached data",
      "Reading data from a dropped table",
      "Reading corrupted data from disk",
    ],
    correctIndex: 0,
    explanation:
      "A dirty read occurs when Transaction A reads data that Transaction B has written but not yet committed. If B rolls back, A has read data that never existed. Only Read Uncommitted allows this.",
    category: "transactions",
  },
  {
    id: "tx-03",
    question: "What does the 'D' in ACID stand for?",
    options: ["Durability", "Dependency", "Distribution", "Decomposition"],
    correctIndex: 0,
    explanation:
      "Durability guarantees that once a transaction is committed, its changes survive system crashes. This is typically achieved using Write-Ahead Logging (WAL) — changes are written to a log on disk before being acknowledged.",
    category: "transactions",
  },
  {
    id: "tx-04",
    question: "What does WAL stand for?",
    options: [
      "Write-Ahead Log",
      "Write-After Lock",
      "Wide Area Link",
      "Weighted Adjacency List",
    ],
    correctIndex: 0,
    explanation:
      "Write-Ahead Log is a technique where changes are first recorded in a sequential log file before being applied to the actual data pages. This ensures durability — after a crash, the database replays the WAL to recover committed transactions.",
    category: "transactions",
  },
  {
    id: "tx-05",
    question: "Which isolation level allows non-repeatable reads but prevents dirty reads?",
    options: [
      "Read Committed",
      "Read Uncommitted",
      "Repeatable Read",
      "Serializable",
    ],
    correctIndex: 0,
    explanation:
      "Read Committed prevents dirty reads (you only see committed data) but allows non-repeatable reads (if you read the same row twice, another transaction may have committed a change in between).",
    category: "transactions",
  },
  {
    id: "tx-06",
    question: "What is the Two-Phase Locking (2PL) protocol?",
    options: [
      "Acquire all locks before releasing any",
      "Lock data twice for safety",
      "Lock during read phase, unlock during write phase",
      "Use two separate lock managers",
    ],
    correctIndex: 0,
    explanation:
      "2PL has a growing phase (acquire locks, never release) and a shrinking phase (release locks, never acquire). This guarantees serializability but can cause deadlocks.",
    category: "transactions",
  },
  {
    id: "tx-07",
    question: "What problem does MVCC solve?",
    options: [
      "Readers blocking writers (and vice versa)",
      "Disk fragmentation",
      "Network partitions",
      "Schema migrations",
    ],
    correctIndex: 0,
    explanation:
      "Multi-Version Concurrency Control keeps multiple versions of each row. Readers see a consistent snapshot without acquiring locks, so they never block writers and writers never block readers.",
    category: "transactions",
  },
  {
    id: "tx-08",
    question: "A non-repeatable read occurs when:",
    options: [
      "A row read twice in the same transaction returns different values",
      "A query returns different numbers of rows on re-execution",
      "A transaction reads its own uncommitted writes",
      "Two transactions deadlock on the same row",
    ],
    correctIndex: 0,
    explanation:
      "A non-repeatable read happens when Transaction A reads a row, Transaction B updates and commits that row, and Transaction A reads it again — getting a different value. Repeatable Read and higher prevent this.",
    category: "transactions",
  },
  {
    id: "tx-09",
    question: "What is the Atomicity guarantee in ACID?",
    options: [
      "All operations in a transaction succeed or all are rolled back",
      "Data is always in a valid state",
      "Transactions are isolated from each other",
      "Committed data survives crashes",
    ],
    correctIndex: 0,
    explanation:
      "Atomicity means a transaction is 'all or nothing.' If any operation fails, all changes are rolled back as if the transaction never happened. This is implemented via undo logs.",
    category: "transactions",
  },
  {
    id: "tx-10",
    question:
      "Which concurrency control mechanism does PostgreSQL primarily use?",
    options: ["MVCC", "Two-Phase Locking", "Optimistic Concurrency", "Timestamp Ordering"],
    correctIndex: 0,
    explanation:
      "PostgreSQL uses Multi-Version Concurrency Control (MVCC). Each transaction sees a snapshot of the database at its start time. Old row versions are cleaned up by the VACUUM process.",
    category: "transactions",
  },

  // ── Storage Engines (10) ──────────────────────────────────
  {
    id: "store-01",
    question: "LSM-Trees optimize for which type of workload?",
    options: [
      "Write-heavy workloads",
      "Read-heavy workloads",
      "Join-heavy workloads",
      "Schema-heavy workloads",
    ],
    correctIndex: 0,
    explanation:
      "LSM-Trees (Log-Structured Merge Trees) buffer writes in an in-memory memtable, then flush sorted runs to disk sequentially. This makes writes extremely fast (sequential I/O). Reads may need to check multiple levels.",
    category: "storage",
  },
  {
    id: "store-02",
    question: "What triggers an LSM-Tree compaction?",
    options: [
      "Too many SSTables at a level",
      "A read query",
      "A transaction commit",
      "A schema change",
    ],
    correctIndex: 0,
    explanation:
      "Compaction is triggered when the number of SSTables at a level exceeds a threshold. Compaction merges overlapping SSTables, removes deleted keys (tombstones), and produces fewer, larger sorted files.",
    category: "storage",
  },
  {
    id: "store-03",
    question: "What is a Bloom filter used for in LSM-Trees?",
    options: [
      "Quickly checking if a key might exist in an SSTable",
      "Compressing SSTable data",
      "Sorting keys in the memtable",
      "Encrypting data at rest",
    ],
    correctIndex: 0,
    explanation:
      "A Bloom filter is a probabilistic data structure that can tell you 'definitely not here' or 'possibly here.' LSM-Trees use them to skip SSTables that definitely don't contain a key, avoiding unnecessary disk reads.",
    category: "storage",
  },
  {
    id: "store-04",
    question: "Row-oriented storage is best for which type of query?",
    options: [
      "OLTP (fetching full rows by primary key)",
      "OLAP (aggregating a single column across millions of rows)",
      "Full-text search",
      "Graph traversals",
    ],
    correctIndex: 0,
    explanation:
      "Row stores keep all columns of a row together on disk. This is optimal for OLTP workloads that read/write entire rows (e.g., 'SELECT * FROM users WHERE id = 42'). Column stores are better for analytics.",
    category: "storage",
  },
  {
    id: "store-05",
    question: "Column-oriented storage achieves better compression because:",
    options: [
      "Similar values in the same column compress well together",
      "Columns are smaller than rows",
      "Column stores use a special filesystem",
      "Compression is applied per-table, not per-column",
    ],
    correctIndex: 0,
    explanation:
      "Columns of the same type (e.g., all integers, all country codes) have similar values and low cardinality, making them highly compressible with run-length encoding, dictionary encoding, or delta encoding.",
    category: "storage",
  },
  {
    id: "store-06",
    question: "What is an SSTable?",
    options: [
      "A sorted, immutable file of key-value pairs on disk",
      "A type of in-memory cache",
      "A SQL query plan node",
      "A transaction log segment",
    ],
    correctIndex: 0,
    explanation:
      "SSTable (Sorted String Table) is an immutable file where key-value pairs are stored in sorted order. Being sorted enables efficient merging during compaction and binary search for lookups.",
    category: "storage",
  },
  {
    id: "store-07",
    question: "What is write amplification in LSM-Trees?",
    options: [
      "Data being rewritten multiple times during compaction",
      "Writing to multiple replicas",
      "Logging writes to WAL and data files",
      "Writing indexes alongside data",
    ],
    correctIndex: 0,
    explanation:
      "Write amplification occurs because data written to the memtable is eventually flushed and then compacted through multiple levels — each level rewriting the data. A single write may be amplified 10-30x across levels.",
    category: "storage",
  },
  {
    id: "store-08",
    question: "Which database uses an LSM-Tree storage engine?",
    options: ["Cassandra", "PostgreSQL", "MySQL (InnoDB)", "Oracle"],
    correctIndex: 0,
    explanation:
      "Cassandra, RocksDB, LevelDB, and HBase all use LSM-Tree storage engines optimized for write-heavy workloads. PostgreSQL and MySQL's InnoDB use B-Tree based storage.",
    category: "storage",
  },
  {
    id: "store-09",
    question: "What is a tombstone in an LSM-Tree?",
    options: [
      "A marker indicating a key has been deleted",
      "A corrupted SSTable entry",
      "An expired cache entry",
      "A failed compaction result",
    ],
    correctIndex: 0,
    explanation:
      "Since SSTables are immutable, deletes are handled by writing a tombstone marker. During compaction, when the tombstone is encountered, the original key-value pair is dropped from the merged output.",
    category: "storage",
  },
  {
    id: "store-10",
    question: "What is the memtable in an LSM-Tree?",
    options: [
      "An in-memory sorted data structure that buffers writes",
      "A disk-based index file",
      "A transaction log",
      "A cache of frequently read keys",
    ],
    correctIndex: 0,
    explanation:
      "The memtable is an in-memory balanced tree (often a red-black tree or skip list) where all writes go first. When it reaches a size threshold, it is flushed to disk as a new SSTable.",
    category: "storage",
  },

  // ── CAP Theorem & Distributed (10) ────────────────────────
  {
    id: "cap-01",
    question: "In CAP theorem, what does 'P' stand for?",
    options: [
      "Partition Tolerance",
      "Performance",
      "Persistence",
      "Parallelism",
    ],
    correctIndex: 0,
    explanation:
      "Partition Tolerance means the system continues to operate despite network partitions (messages being dropped or delayed between nodes). In practice, partitions are inevitable, so the real choice is between C and A.",
    category: "cap-theorem",
  },
  {
    id: "cap-02",
    question: "MongoDB is primarily a:",
    options: ["CP system", "AP system", "CA system", "None of the above"],
    correctIndex: 0,
    explanation:
      "MongoDB prioritizes Consistency and Partition Tolerance (CP). During a network partition, it elects a new primary and may briefly become unavailable until the election completes, sacrificing availability for consistency.",
    category: "cap-theorem",
  },
  {
    id: "cap-03",
    question: "Cassandra is primarily a:",
    options: ["AP system", "CP system", "CA system", "None of the above"],
    correctIndex: 0,
    explanation:
      "Cassandra prioritizes Availability and Partition Tolerance (AP). It uses tunable consistency — by default, it remains available during partitions and resolves conflicts using last-write-wins timestamps.",
    category: "cap-theorem",
  },
  {
    id: "cap-04",
    question: "Why is a true CA system impossible in a distributed environment?",
    options: [
      "Network partitions are inevitable",
      "Consistency and availability conflict by definition",
      "CA requires infinite bandwidth",
      "No database supports both features",
    ],
    correctIndex: 0,
    explanation:
      "In any distributed system, network partitions will eventually occur. When they do, you must choose between consistency (reject requests) and availability (serve potentially stale data). A CA system only exists on a single node.",
    category: "cap-theorem",
  },
  {
    id: "cap-05",
    question: "What is eventual consistency?",
    options: [
      "All replicas converge to the same value given enough time without new updates",
      "Data is always consistent after every write",
      "Consistency is guaranteed within one second",
      "Only the primary node has consistent data",
    ],
    correctIndex: 0,
    explanation:
      "Eventual consistency means that if no new writes occur, all replicas will eventually return the same value. It does not guarantee how long convergence takes — just that it will happen.",
    category: "cap-theorem",
  },
  {
    id: "cap-06",
    question: "What is a quorum in distributed systems?",
    options: [
      "A majority of nodes that must agree for an operation to succeed",
      "The minimum number of nodes in a cluster",
      "A special node that resolves conflicts",
      "The maximum number of simultaneous connections",
    ],
    correctIndex: 0,
    explanation:
      "A quorum requires W + R > N (writes + reads > total nodes) to guarantee consistency. For example, with 3 nodes, writing to 2 and reading from 2 guarantees at least one node has the latest value.",
    category: "cap-theorem",
  },
  {
    id: "cap-07",
    question: "What is a split-brain scenario?",
    options: [
      "Two partitioned groups both believe they are the primary",
      "A node that is half-crashed",
      "When data is split across two tables",
      "When a query plan chooses two conflicting indexes",
    ],
    correctIndex: 0,
    explanation:
      "Split-brain occurs during a network partition when both sides elect a leader, leading to conflicting writes. Fencing (STONITH), majority quorums, and epoch numbers help prevent this.",
    category: "cap-theorem",
  },
  {
    id: "cap-08",
    question: "What consistency model does DynamoDB use by default?",
    options: [
      "Eventually consistent reads",
      "Strongly consistent reads",
      "Linearizable reads",
      "Serially consistent reads",
    ],
    correctIndex: 0,
    explanation:
      "DynamoDB uses eventually consistent reads by default for higher throughput and lower latency. You can opt into strongly consistent reads per-request at the cost of double the read capacity units.",
    category: "cap-theorem",
  },
  {
    id: "cap-09",
    question: "What is the purpose of a consensus algorithm like Raft?",
    options: [
      "To ensure all nodes agree on the same value despite failures",
      "To encrypt data across nodes",
      "To balance load across replicas",
      "To compress data for network transfer",
    ],
    correctIndex: 0,
    explanation:
      "Consensus algorithms (Raft, Paxos, ZAB) ensure that a majority of nodes agree on the same sequence of operations, even when some nodes fail or messages are delayed. This is the foundation of CP systems.",
    category: "cap-theorem",
  },
  {
    id: "cap-10",
    question: "What trade-off does a CP system make during a network partition?",
    options: [
      "Sacrifices availability to maintain consistency",
      "Sacrifices consistency to maintain availability",
      "Sacrifices partition tolerance",
      "Sacrifices both consistency and availability",
    ],
    correctIndex: 0,
    explanation:
      "A CP system rejects requests (becomes unavailable) during a partition rather than risk serving inconsistent data. For example, a CP database may return errors until the partition heals and consensus is restored.",
    category: "cap-theorem",
  },

  // ── SQL vs NoSQL (5) ──────────────────────────────────────
  {
    id: "sql-01",
    question: "Which database type enforces a fixed schema?",
    options: ["SQL (relational)", "Document store", "Key-value store", "Graph database"],
    correctIndex: 0,
    explanation:
      "Relational databases enforce a predefined schema — every row in a table must conform to the column definitions. NoSQL databases (document, key-value, graph) typically offer schema flexibility.",
    category: "sql-vs-nosql",
  },
  {
    id: "sql-02",
    question: "Which NoSQL type is best for social network 'friends-of-friends' queries?",
    options: ["Graph database", "Document store", "Key-value store", "Column-family store"],
    correctIndex: 0,
    explanation:
      "Graph databases (Neo4j, Amazon Neptune) store data as nodes and edges, making traversal queries like 'friends-of-friends' efficient O(depth) operations instead of expensive multi-way JOINs.",
    category: "sql-vs-nosql",
  },
  {
    id: "sql-03",
    question: "When would you choose a document database over a relational one?",
    options: [
      "Flexible schema with nested, self-contained documents",
      "Complex multi-table JOINs are common",
      "Strict ACID transactions across multiple entities",
      "Heavy aggregation across normalized tables",
    ],
    correctIndex: 0,
    explanation:
      "Document databases (MongoDB, CouchDB) excel when data naturally forms self-contained documents with variable structure — like user profiles, product catalogs, or CMS content where each item may have different fields.",
    category: "sql-vs-nosql",
  },
  {
    id: "sql-04",
    question: "Which type of NoSQL database is Redis?",
    options: ["Key-value store", "Document store", "Column-family store", "Graph database"],
    correctIndex: 0,
    explanation:
      "Redis is an in-memory key-value store supporting multiple data structures (strings, hashes, lists, sets, sorted sets). Its primary use cases are caching, session management, and real-time leaderboards.",
    category: "sql-vs-nosql",
  },
  {
    id: "sql-05",
    question: "What is the primary scaling strategy for most NoSQL databases?",
    options: [
      "Horizontal scaling (sharding across nodes)",
      "Vertical scaling (bigger server)",
      "Read replicas only",
      "Query optimization only",
    ],
    correctIndex: 0,
    explanation:
      "NoSQL databases are designed for horizontal scaling — distributing data across many nodes via sharding. Relational databases traditionally scale vertically, though modern solutions (CockroachDB, Spanner) add horizontal scaling.",
    category: "sql-vs-nosql",
  },

  // ── Query Plans (5) ──────────────────────────────────────
  {
    id: "qp-01",
    question: "What does a Seq Scan (Sequential Scan) mean in a query plan?",
    options: [
      "The entire table is read row by row",
      "The query uses a sorted index",
      "Only matching rows are scanned",
      "The scan is performed in parallel",
    ],
    correctIndex: 0,
    explanation:
      "A Seq Scan reads every row in the table from disk sequentially. It means no index was used for this operation. For small tables this is fine, but for large tables it often indicates a missing index.",
    category: "query-plans",
  },
  {
    id: "qp-02",
    question: "What type of JOIN reads the inner table once per outer row?",
    options: ["Nested Loop Join", "Hash Join", "Merge Join", "Sort-Merge Join"],
    correctIndex: 0,
    explanation:
      "Nested Loop Join iterates over the outer table and, for each row, scans the inner table for matches. It is efficient when the outer table is small and the inner table has an index, but O(n*m) without indexes.",
    category: "query-plans",
  },
  {
    id: "qp-03",
    question: "When does the query optimizer choose a Hash Join?",
    options: [
      "When joining two large unsorted tables on an equality condition",
      "When both tables are already sorted on the join key",
      "When one table has fewer than 10 rows",
      "When using a LIKE pattern match",
    ],
    correctIndex: 0,
    explanation:
      "Hash Join builds a hash table from the smaller table and probes it with each row from the larger table. It is efficient for equality joins on large, unsorted tables — O(n + m) time.",
    category: "query-plans",
  },
  {
    id: "qp-04",
    question: "What is the purpose of the query optimizer?",
    options: [
      "Choose the most efficient execution plan among alternatives",
      "Parse SQL syntax",
      "Enforce access control",
      "Manage memory allocation",
    ],
    correctIndex: 0,
    explanation:
      "The query optimizer evaluates multiple possible execution plans (different join orders, index choices, scan methods) and picks the one with the lowest estimated cost based on table statistics.",
    category: "query-plans",
  },
  {
    id: "qp-05",
    question: "What is an Index Only Scan?",
    options: [
      "A scan that retrieves all needed data from the index without touching the table",
      "A scan that only uses the primary key index",
      "A scan that creates a temporary index",
      "A scan limited to a single index level",
    ],
    correctIndex: 0,
    explanation:
      "An Index Only Scan means the query's SELECT and WHERE columns are all in the index (a covering index). The database reads only the index, skipping the slower heap table access.",
    category: "query-plans",
  },
];

// ── Deterministic daily selection ────────────────────────────

function getDateHash(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const ch = dateStr.charCodeAt(i);
    hash = (hash * 31 + ch) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns today's challenge deterministically based on the current date.
 * Same date always returns the same challenge.
 */
export function getTodaysChallenge(): DailyChallenge {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const hash = getDateHash(today);
  return DAILY_CHALLENGES[hash % DAILY_CHALLENGES.length];
}

/**
 * Returns the date string used for keying today's challenge completion.
 */
export function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const DAILY_CHALLENGE_STORAGE_KEY = "architex-daily-challenge-completed";

/**
 * Check if today's daily challenge has already been completed.
 */
export function isDailyChallengeCompleted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    if (!stored) return false;
    const data = JSON.parse(stored) as { date: string };
    return data.date === getTodayDateKey();
  } catch {
    return false;
  }
}

/**
 * Mark today's daily challenge as completed.
 */
export function markDailyChallengeCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DAILY_CHALLENGE_STORAGE_KEY,
      JSON.stringify({ date: getTodayDateKey() }),
    );
  } catch {
    // localStorage may be full or unavailable
  }
}
