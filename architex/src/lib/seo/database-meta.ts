// ── SEO metadata for individual database mode pages ──────────────────
//
// Each of the 7 database visualization modes gets its own URL with
// unique title, description, and structured data for search engines.

export type DatabaseModeSlug =
  | "er-diagram"
  | "normalization"
  | "transaction-isolation"
  | "btree-index"
  | "hash-index"
  | "query-plans"
  | "lsm-tree"
  | "mvcc"
  | "aries-recovery"
  | "sql-vs-nosql"
  | "index-anti-patterns";

export interface DatabaseModeMeta {
  slug: DatabaseModeSlug;
  title: string;
  description: string;
  /** Heading shown on the SEO landing section */
  heading: string;
  /** Short educational blurb for the landing page body */
  explanation: string[];
  keywords: string[];
}

export const DATABASE_MODES: DatabaseModeMeta[] = [
  {
    slug: "er-diagram",
    title: "ER Diagram Builder — Interactive Database Design | Architex",
    description:
      "Create entity-relationship diagrams with attributes, cardinality, and auto-generated SQL. Design your database visually.",
    heading: "ER Diagram Builder",
    explanation: [
      "Entity-Relationship diagrams are the foundation of database design. They visually represent entities (tables), attributes (columns), and the relationships between them, including cardinality constraints like one-to-many and many-to-many.",
      "With Architex's interactive ER builder, you can add entities, define primary and foreign keys, set relationship types, and instantly generate CREATE TABLE SQL from your diagram.",
    ],
    keywords: [
      "ER diagram",
      "entity relationship diagram",
      "database design",
      "SQL generation",
      "cardinality",
    ],
  },
  {
    slug: "normalization",
    title: "Database Normalization — Interactive 3NF Decomposition | Architex",
    description:
      "Analyze functional dependencies, find candidate keys, and decompose relations to 3NF. Learn normalization interactively.",
    heading: "Database Normalization",
    explanation: [
      "Normalization eliminates redundancy and update anomalies by decomposing relations into smaller, well-structured tables. Understanding normal forms (1NF through BCNF) is essential for database design and a common interview topic.",
      "This tool lets you enter a relation's attributes and functional dependencies, then computes closures, candidate keys, the current normal form, and a lossless 3NF decomposition step by step.",
    ],
    keywords: [
      "database normalization",
      "3NF",
      "functional dependency",
      "candidate key",
      "BCNF",
      "decomposition",
    ],
  },
  {
    slug: "transaction-isolation",
    title: "Transaction Isolation Levels — Anomaly Simulation | Architex",
    description:
      "Step through READ UNCOMMITTED to SERIALIZABLE and see dirty reads, phantom reads, and write skew in action.",
    heading: "Transaction Isolation Levels",
    explanation: [
      "Transaction isolation levels control how concurrent transactions interact. From READ UNCOMMITTED (fastest, least safe) to SERIALIZABLE (slowest, fully isolated), each level trades performance for correctness guarantees.",
      "This simulation walks you through real anomalies — dirty reads, non-repeatable reads, phantom reads, and write skew — showing exactly when and why they occur at each isolation level.",
    ],
    keywords: [
      "transaction isolation",
      "ACID",
      "dirty read",
      "phantom read",
      "serializable",
      "database concurrency",
    ],
  },
  {
    slug: "btree-index",
    title: "B-Tree Index Visualization — Step-by-Step | Architex",
    description:
      "Watch B-Tree insert and search operations animate step by step. Learn how database indexes work.",
    heading: "B-Tree Index Visualization",
    explanation: [
      "B-Trees are the most widely used index structure in relational databases. They keep data sorted and allow searches, insertions, and deletions in logarithmic time by maintaining a balanced tree of nodes with multiple keys.",
      "This visualization lets you insert keys one at a time and watch the tree split and rebalance. Step through each operation to understand how B-Trees maintain their invariants.",
    ],
    keywords: [
      "B-Tree",
      "B-Tree index",
      "database index",
      "balanced tree",
      "index visualization",
    ],
  },
  {
    slug: "hash-index",
    title: "Hash Index Visualization — Collision Chains & Resizing | Architex",
    description:
      "Visualize hash table operations with collision chains, load factors, and dynamic resizing. Understand hash indexes.",
    heading: "Hash Index Visualization",
    explanation: [
      "Hash indexes provide O(1) average-case lookups by mapping keys through a hash function to bucket positions. They excel at equality queries but cannot support range scans like B-Trees.",
      "This tool shows how keys are hashed into buckets, how collision chains form, and when and how the table resizes. Observe load factor thresholds and the cost of rehashing in real time.",
    ],
    keywords: [
      "hash index",
      "hash table",
      "collision chain",
      "load factor",
      "rehashing",
      "database index",
    ],
  },
  {
    slug: "query-plans",
    title: "Query Plan Visualizer — SQL Execution Plans | Architex",
    description:
      "Generate and visualize SQL query execution plans. Understand sequential scans, index scans, joins, and cost estimation.",
    heading: "Query Plan Visualizer",
    explanation: [
      "Every SQL query goes through a query planner that decides the most efficient execution strategy. Understanding query plans — sequential scans, index scans, nested loop joins, hash joins, and sort operations — is critical for performance tuning.",
      "Enter a SQL query and explore the generated execution plan as an interactive tree. Each node shows its operation type, estimated cost, and row count.",
    ],
    keywords: [
      "query plan",
      "SQL execution plan",
      "EXPLAIN",
      "index scan",
      "sequential scan",
      "query optimization",
    ],
  },
  {
    slug: "lsm-tree",
    title: "LSM-Tree Visualization — Writes, Flushes & Compaction | Architex",
    description:
      "Visualize LSM-Tree writes, memtable flushes, and SSTable compaction. Learn how write-optimized storage engines work.",
    heading: "LSM-Tree Visualization",
    explanation: [
      "Log-Structured Merge Trees (LSM-Trees) power write-optimized storage engines like LevelDB, RocksDB, and Cassandra. They buffer writes in an in-memory memtable, flush sorted runs to disk as SSTables, and periodically compact overlapping levels.",
      "This visualization shows the full LSM-Tree lifecycle: writes landing in the memtable, flushes creating new SSTables, and level-based compaction merging and garbage-collecting old data.",
    ],
    keywords: [
      "LSM-Tree",
      "memtable",
      "SSTable",
      "compaction",
      "write-optimized",
      "storage engine",
    ],
  },
  {
    slug: "mvcc",
    title: "MVCC Visualization — Snapshot Isolation & Version Chains | Architex",
    description:
      "Visualize Multi-Version Concurrency Control (MVCC) with PostgreSQL-style snapshot isolation. See xmin/xmax version chains and how concurrent transactions read consistent snapshots.",
    heading: "MVCC Visualization",
    explanation: [
      "Multi-Version Concurrency Control (MVCC) is how PostgreSQL, Oracle, and other modern databases handle concurrent access without locks. Instead of blocking readers while a write is in progress, MVCC creates a new version of the row. Each transaction sees a consistent snapshot from the moment it began.",
      "This visualization walks through a complete snapshot isolation scenario: two concurrent transactions reading and writing the same row. Watch how xmin and xmax markers track version lifecycles, and see firsthand that T1 never sees T2's uncommitted or even committed changes — because its snapshot is frozen.",
    ],
    keywords: [
      "MVCC",
      "multi-version concurrency control",
      "snapshot isolation",
      "PostgreSQL MVCC",
      "xmin xmax",
      "version chain",
      "database concurrency",
    ],
  },
  {
    slug: "aries-recovery",
    title: "ARIES Recovery Protocol — Interactive 3-Phase Visualization | Architex",
    description:
      "Visualize the ARIES crash recovery protocol step by step. Watch Analysis, Redo, and Undo phases recover a database from a crash using WAL, dirty page tables, and compensation log records.",
    heading: "ARIES Recovery Protocol",
    explanation: [
      "ARIES (Algorithm for Recovery and Isolation Exploiting Semantics) is the gold standard for database crash recovery, used by PostgreSQL, MySQL, Oracle, and SQL Server. It guarantees both durability (committed data survives crashes) and atomicity (uncommitted data is rolled back).",
      "The protocol uses a Write-Ahead Log (WAL) and 3 recovery phases: Analysis scans the WAL to determine what happened, Redo replays all operations to restore the pre-crash state, and Undo rolls back uncommitted transactions using Compensation Log Records (CLRs).",
    ],
    keywords: [
      "ARIES recovery",
      "database crash recovery",
      "write-ahead log",
      "WAL recovery",
      "dirty page table",
      "compensation log record",
      "CLR",
      "redo undo recovery",
    ],
  },
  {
    slug: "sql-vs-nosql",
    title: "SQL vs NoSQL — Interactive Comparison Guide | Architex",
    description:
      "Compare SQL and NoSQL databases across 6 dimensions. Use the decision flowchart and real-world examples from Instagram, WhatsApp, and more to choose the right database.",
    heading: "SQL vs NoSQL Comparison",
    explanation: [
      "Choosing between SQL and NoSQL is one of the most important architectural decisions. SQL databases (PostgreSQL, MySQL) excel at consistency, complex queries, and relational data. NoSQL databases (MongoDB, Cassandra, DynamoDB) excel at flexible schemas, horizontal scaling, and high write throughput.",
      "This interactive guide compares the two across 6 dimensions, provides a decision flowchart to find the right fit for your use case, and shows real-world examples of companies like Instagram (PostgreSQL), WhatsApp (Cassandra), and eBay (MongoDB).",
    ],
    keywords: [
      "SQL vs NoSQL",
      "database comparison",
      "PostgreSQL vs MongoDB",
      "when to use NoSQL",
      "relational vs document",
      "database selection",
    ],
  },
  {
    slug: "index-anti-patterns",
    title: "Index Anti-Patterns — 5 Common Indexing Mistakes | Architex",
    description:
      "Learn 5 common indexing anti-patterns that cause SeqScans instead of IndexScans. See the bad query, the execution plan, and the fix for each pattern.",
    heading: "Index Anti-Patterns",
    explanation: [
      "Creating an index does not guarantee the database will use it. Common mistakes like applying functions to indexed columns, type mismatches, leading wildcards, low cardinality indexes, and over-indexing can all prevent index usage and force expensive sequential scans.",
      "This interactive tool shows each anti-pattern with the bad query, its execution plan (SeqScan), the fixed query, and the improved plan (IndexScan). Each example includes cost estimates showing the performance difference.",
    ],
    keywords: [
      "index anti-patterns",
      "database indexing",
      "SeqScan vs IndexScan",
      "query optimization",
      "PostgreSQL performance",
      "EXPLAIN ANALYZE",
    ],
  },
];

/** All valid mode slugs for static param generation and validation */
export const DATABASE_MODE_SLUGS: DatabaseModeSlug[] = DATABASE_MODES.map(
  (m) => m.slug,
);

/** Look up a mode by slug. Returns undefined for invalid slugs. */
export function getDatabaseModeBySlug(
  slug: string,
): DatabaseModeMeta | undefined {
  return DATABASE_MODES.find((m) => m.slug === slug);
}
