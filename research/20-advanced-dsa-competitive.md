# Advanced Data Structures & Competitive Programming Algorithms

> Structures that power real distributed systems + algorithms for competitive programming. Each with visualization specs.

---

## ADVANCED DATA STRUCTURES

### 1. Skip List
- **What:** Probabilistic multi-level sorted linked list. O(log n) search/insert/delete.
- **Used in:** Redis ZSET, LevelDB/RocksDB memtable, Apache Lucene
- **Visualize:** Multi-level "highway" structure, search path (right then down), coin flip for level assignment
- **Compare with:** Balanced BST side-by-side

### 2. Bloom Filter
- **What:** Probabilistic set membership. "Definitely not in set" or "probably in set."
- **Used in:** Bigtable, Cassandra, Chrome Safe Browsing, PostgreSQL hash joins
- **Visualize:** Bit array with k hash arrows per element, false positive demo, fill ratio → FP rate meter
- **Key insight:** Show WHY false positives occur (overlapping hash positions)

### 3. Count-Min Sketch
- **What:** Probabilistic frequency estimation. Over-counts, never under-counts.
- **Used in:** Network traffic monitoring, Spark Streaming, Twitter trending, DDoS detection
- **Visualize:** d×w grid, increment d cells per element, query takes MIN across rows

### 4. HyperLogLog
- **What:** Estimate distinct count using O(log log n) space. ~12KB for billions of items, ~2% error.
- **Used in:** Redis PFCOUNT, BigQuery APPROX_COUNT_DISTINCT, Presto, Flink
- **Visualize:** Binary hash → leading zeros → bucket registers → harmonic mean
- **Analogy:** "Longest coin flip streak indicates crowd size"

### 5. LSM Tree (Log-Structured Merge Tree)
- **What:** Write-optimized storage. Memtable → flush to SSTable → compaction across levels.
- **Used in:** LevelDB, RocksDB, Cassandra, CockroachDB, TiKV, InfluxDB
- **Visualize:** Full pipeline: WAL → Memtable → L0 → L1 → ... → LN, compaction merge animation
- **Key metrics:** Write amplification, space amplification, read amplification

### 6. R-Tree (Spatial Index)
- **What:** Balanced tree for spatial data. Minimum bounding rectangles.
- **Used in:** PostGIS, MongoDB 2dsphere, Elasticsearch geo, game collision detection
- **Visualize:** Nested bounding boxes on 2D canvas, range query pruning

### 7. Quadtree
- **What:** Recursive 2D space subdivision. Adaptive spatial partition.
- **Used in:** Barnes-Hut simulation, image compression, game engines, GIS
- **Visualize:** Space recursively divided as points added, range query showing pruned quadrants

### 8. Persistent Data Structure
- **What:** Preserves all previous versions via path copying (structural sharing).
- **Used in:** Git object model, Clojure collections, React/Redux time-travel debugging, Datomic
- **Visualize:** Path copy animation, shared vs new nodes highlighted, version timeline

### 9. Rope
- **What:** Binary tree for efficient string manipulation. O(log n) concat/split/insert.
- **Used in:** Xi editor, VS Code (piece table variant), Zed editor
- **Visualize:** Tree with leaf substrings, concat = new root, index walk using weights

### 10. van Emde Boas Tree
- **What:** O(log log U) predecessor/successor on integers [0, U). Exponentially faster than BST.
- **Used in:** Router IP lookup, OS schedulers
- **Visualize:** Recursive √U cluster splitting, predecessor query descent

---

## SYSTEM DESIGN DATA STRUCTURES

### 11. Consistent Hash Ring
- **Used in:** DynamoDB, Cassandra, Memcached, Akamai CDN, Discord
- **Visualize:** Circular ring, virtual nodes, key assignment (walk clockwise), node add/remove redistribution

### 12. Merkle Tree
- **Used in:** Bitcoin, Git, IPFS, DynamoDB anti-entropy, ZFS
- **Visualize:** Hash propagation on change, authentication path (O(log n) proof), two-tree diff comparison

### 13. CRDTs (G-Counter, PN-Counter, OR-Set, LWW-Register)
- **Used in:** Redis Enterprise, Riak, Figma, Apple Notes, Yjs/Automerge
- **Visualize:** Multiple replicas, concurrent updates, deterministic merge, eventual convergence

### 14. Gossip Protocol State
- **Used in:** Cassandra, DynamoDB, Consul, CockroachDB, Bitcoin
- **Visualize:** Epidemic spread across nodes, S-curve convergence, failure detection

### 15. Write-Ahead Log (WAL)
- **Used in:** PostgreSQL, MySQL, every database with durability
- **Visualize:** Write → WAL → crash → recovery replay, checkpoint process

---

## COMPETITIVE PROGRAMMING ALGORITHMS

### 16. Segment Tree + Lazy Propagation
- **What:** Range queries + range updates in O(log n). Lazy tags defer updates.
- **Visualize:** Tree with lazy tags, push-down on query, color-code lazy vs resolved nodes

### 17. Heavy-Light Decomposition (HLD)
- **What:** Decompose tree into chains. Any path crosses O(log n) chains.
- **Visualize:** Heavy edges bold, chains colored, path query decomposed into chain segments

### 18. Euler Tour on Trees
- **What:** Linearize tree → array. Subtree = contiguous range.
- **Visualize:** DFS building Euler tour array, subtree-to-range mapping

### 19. FFT (Fast Fourier Transform)
- **What:** DFT in O(n log n). Polynomial multiplication via frequency domain.
- **Visualize:** Butterfly diagram, time/frequency domain side-by-side, roots of unity

### 20. Matrix Exponentiation
- **What:** A^n in O(k³ log n). Linear recurrences in O(log n).
- **Visualize:** Squaring steps, binary exponent expansion, Fibonacci via 2×2 matrix

### 21. Tarjan's SCC
- **What:** Find strongly connected components in O(V+E) with single DFS.
- **Visualize:** DFS with discovery/lowlink labels, stack, SCC extraction, condensation DAG

### 22. Network Flow (Max Flow / Min Cut)
- **What:** Max flow = min cut. Ford-Fulkerson / Edmonds-Karp / Dinic's.
- **Visualize:** Residual graph, BFS augmenting paths, flow pushing, min cut highlight

### 23. KMP String Matching
- **What:** O(n+m) pattern matching using failure function.
- **Visualize:** Two-row text/pattern display, failure table arrows, pattern sliding on mismatch

### 24. Convex Hull
- **What:** Smallest convex polygon enclosing points.
- **Visualize:** Graham scan stack, left/right turn tests, points being accepted/rejected

### 25. Suffix Array
- **What:** Sorted array of all suffixes. O(n log n) construction.
- **Visualize:** Doubling technique, rank evolution, LCP array

---

## IMPLEMENTATION PRIORITY

**Tier 1 (Highest Impact — hard to understand without visualization):**
1. LSM Tree — core of modern databases, multi-component pipeline
2. Consistent Hash Ring — essential for system design interviews
3. Bloom Filter — probabilistic nature needs visual demo
4. Segment Tree + Lazy — lazy push-down is confusing without animation
5. CRDTs — concurrent operations on replicas need visual

**Tier 2 (High Impact):**
6. Merkle Tree — hash propagation and proof verification
7. Network Flow — augmenting paths need animation
8. KMP — failure function and pattern shift
9. Gossip Protocol — epidemic spread is beautiful and instructive
10. Skip List — multi-level highway benefits from visualization
