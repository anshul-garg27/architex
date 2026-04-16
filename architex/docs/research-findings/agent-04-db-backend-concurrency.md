I now have a comprehensive picture of the codebase. Let me compile the complete feature spec.

---

# ARCHITEX: Complete Interactive Feature Set
## Database, Backend Engineering, and Concurrency Modules

---

## EXISTING INVENTORY (What Already Ships)

Before designing new features, here is the precise inventory of what already exists, based on the codebase audit.

**Database Module (18 modes built):**
er-diagram, normalization, transaction-isolation, btree-index, bplus-tree, hash-index, query-plans, lsm-tree, acid, cap-theorem, mvcc, row-vs-column, sql-vs-nosql, index-anti-patterns, caching-patterns, join-algorithms, aries-recovery, star-snowflake, connection-pooling

Supporting engines: BTreeViz, HashIndexViz, LSMTreeViz, MVCCViz, JoinViz, ARIESViz, normalization engine, transaction-sim, er-to-sql, schema-converter, daily-challenges (60+ questions)

Bottom panel: ReplicationLagVisualizer, ShardingSimulator, ConsistencyLevelDemo, QueryPlanSimulation

**Concurrency Module (11 demos built):**
race-condition, producer-consumer, dining-philosophers, event-loop, thread-lifecycle, go-goroutines, readers-writers, sleeping-barber, async-patterns, deadlock-demo, lock-comparison, ThreadPoolSaturationVisualizer

**Security Module (11 topics, partial Backend Engineering overlap):**
oauth, jwt, diffie-hellman, aes, https-flow, cors, cert-chain, password-hashing, rate-limiting, web-attacks, encryption-comparison

Also exists: rate-limiting-demo.ts (token bucket, sliding window, leaky bucket), oauth-flows.ts, jwt-engine.ts, jwt-attacks.ts

**No dedicated Backend Engineering module exists.** Backend topics are scattered across Security (auth, rate limiting), Database (connection pooling, replication), and Distributed (service discovery). This is the biggest gap.

---

## PART 1: DATABASE MODULE -- NEW FEATURES

### DB-NEW-01: SQL Playground with EXPLAIN ANALYZE Visualizer

**1. LEARNING**
Canvas split-screen: left panel is a SQL editor with syntax highlighting and autocomplete. Right panel renders the EXPLAIN ANALYZE output as an interactive tree. Each node (SeqScan, IndexScan, HashJoin, Sort, Aggregate) is a colored box showing estimated-vs-actual rows, startup-cost, total-cost, and loops. Hovering a node highlights the table/index it touches. A "bottleneck mode" colors nodes red-to-green based on actual time. Below the tree, a timeline bar shows which operations run in parallel vs sequentially.

**Simulation engine:** `QueryPlanInteractiveViz` class. Takes a SQL string, parses it against a set of 5 predefined schemas (e-commerce, social media, banking, analytics, IoT). Generates a realistic plan tree with cost estimates based on table statistics (row count, average row width, index availability). Supports: SeqScan, IndexScan, IndexOnlyScan, BitmapScan, HashJoin, MergeJoin, NestedLoop, Sort, HashAggregate, GroupAggregate, Materialize, Limit, Append, SubqueryScan, CTEScan.

**File:** `architex/src/lib/database/query-plan-interactive.ts`
- `interface PlanNode { type, table?, index?, estimatedRows, actualRows, startupCost, totalCost, actualTimeMs, loops, filter?, children }`
- `function generatePlan(sql: string, schema: SchemaName): PlanNode`
- `function identifyBottleneck(plan: PlanNode): PlanNode` (returns the node with highest actual time)
- `function suggestIndexes(plan: PlanNode, schema: Schema): IndexSuggestion[]`

**Canvas component:** `architex/src/components/modules/database/canvases/ExplainAnalyzeCanvas.tsx`

| Metric | Score |
|--------|-------|
| Impact | 10 |
| WOW | 9 |
| Effort | L |
| Exists | Partial (QueryPlanSimulation.tsx exists but is a LEARN panel with toggle-index-on/off, not an interactive SQL editor) |

---

### DB-NEW-02: Window Functions Step Visualizer

**1. LEARNING**
A table of sample data (10-20 rows) displayed as a spreadsheet. When the user writes a window function (ROW_NUMBER, RANK, DENSE_RANK, NTILE, LAG, LEAD, SUM OVER, AVG OVER), the canvas:
1. Highlights the PARTITION BY groups with distinct background colors
2. Draws ORDER BY arrows showing sort direction within each partition
3. Animates the "window frame" sliding across rows (ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
4. Shows the computed value appearing in a new column, row by row

**Simulation engine:** `WindowFunctionViz`
- `interface WindowSpec { function: WindowFn, partitionBy: string[], orderBy: { column: string, dir: 'ASC'|'DESC' }[], frame: FrameSpec }`
- `interface WindowStep { rowIndex: number, frameStart: number, frameEnd: number, computedValue: number|string, description: string }`
- `function simulateWindow(data: Row[], spec: WindowSpec): WindowStep[]`
- Pre-built scenarios: "Sales by region with running total", "Employee salary ranking by department", "Customer order with LAG/LEAD comparison"

**File:** `architex/src/lib/database/window-function-viz.ts`
**Canvas:** `architex/src/components/modules/database/canvases/WindowFunctionCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | M | No |

---

### DB-NEW-03: CTE and Subquery Execution Flow

**1. LEARNING**
Visual execution of CTEs (WITH clauses) and subqueries. For a CTE chain like `WITH a AS (...), b AS (... FROM a), final AS (... FROM b)`, the canvas renders each CTE as a "materialized table" card. Arrows flow from one CTE to the next. When stepping through, each CTE evaluates and its result set populates its card. For correlated subqueries, the canvas shows the outer loop executing and the inner query re-evaluating per row with a "calls" counter.

Recursive CTEs get special treatment: the canvas shows the "anchor member" producing seed rows, then the "recursive member" iterating, with a growing result set and a cycle counter. A tree of org-chart data visualizes the recursion naturally.

**Simulation engine:** `CTEViz`
- `interface CTEStep { cteId: string, phase: 'materialize'|'recursive-iterate'|'final', rowsProduced: number, description: string, highlightedRows: number[] }`
- `function simulateCTE(query: string, dataset: string): CTEStep[]`
- Predefined datasets: org_chart (recursive), sales_summary (chained CTEs), graph_traversal (recursive with cycle detection)

**File:** `architex/src/lib/database/cte-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 8 | M | No |

---

### DB-NEW-04: Composite and Covering Index Simulator

**1. LEARNING**
Extends existing B-Tree/B+ Tree canvases. The user defines a composite index on (col_A, col_B, col_C). The canvas shows:
1. The multi-level sort: rows sorted by A, then B within A, then C within B
2. Leftmost prefix rule: queries using (A), (A,B), (A,B,C) highlight green. Queries using only (B) or (C) highlight red with explanation "cannot use index -- violates leftmost prefix"
3. Covering index: when SELECT columns are all in the index, a badge says "Index-Only Scan -- no table lookup needed" with the eliminated random I/O count

**Simulation engine:** extend `BTreeViz` class
- `function simulateCompositeQuery(index: string[], query: { where: string[], select: string[] }): { usesIndex: boolean, prefixUsed: string[], covering: boolean, ioSaved: number, steps: CompositeIndexStep[] }`
- `interface CompositeIndexStep { phase: 'sort-demo'|'prefix-check'|'covering-check'|'scan', description: string, highlightedRows: number[] }`

**File:** `architex/src/lib/database/composite-index-viz.ts`
**Canvas:** `architex/src/components/modules/database/canvases/CompositeIndexCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 7 | M | No (BTreeCanvas exists but is single-column only) |

---

### DB-NEW-05: Partial Index and Expression Index Demo

**1. LEARNING**
Canvas shows a table with a boolean column `is_active` where 95% of rows are `true`. A full index on `is_active` is wasteful. The canvas shows:
1. Full index: all rows indexed, huge storage, slow writes
2. Partial index: `CREATE INDEX ... WHERE is_active = false` -- only 5% of rows indexed, 20x smaller, dramatically faster for "find inactive users"
3. Expression index: `CREATE INDEX ... ON lower(email)` -- shows the function applied to each row value before indexing, and how `WHERE lower(email) = 'alice'` uses the index but `WHERE email = 'Alice'` does not

Side-by-side storage comparison with actual byte counts.

**File:** `architex/src/lib/database/partial-index-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 7 | 7 | S | No |

---

### DB-NEW-06: Pessimistic vs Optimistic Locking Interactive

**1. LEARNING**
Split-screen simulation. Left: pessimistic locking. Two transactions try to update the same row. T1 acquires a row-level lock (SELECT ... FOR UPDATE). T2 blocks, shown as a grayed-out waiting thread with a timer counting up. T1 commits, T2 unblocks and proceeds.

Right: optimistic locking. Both T1 and T2 read the row (version=1). T1 writes (version becomes 2, success). T2 tries to write (WHERE version=1 -- 0 rows affected). T2 gets a "stale data" error and must retry.

A "contention slider" lets the user increase concurrent writers from 2 to 10. At high contention, pessimistic shows long queue times. Optimistic shows exponentially increasing retries. A metrics panel shows throughput vs. contention for both strategies.

**Simulation engine:**
- `function simulatePessimistic(txCount: number, holdTime: number): LockingStep[]`
- `function simulateOptimistic(txCount: number, conflictRate: number): LockingStep[]`
- `interface LockingStep { tick: number, txId: string, action: 'read'|'lock'|'wait'|'write'|'commit'|'retry'|'fail', description: string, version?: number }`

**File:** `architex/src/lib/database/locking-viz.ts`
**Canvas:** `architex/src/components/modules/database/canvases/LockingCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | M | No |

---

### DB-NEW-07: Deadlock Detection and Resolution Visualizer (DB-specific)

**1. LEARNING**
Wait-for graph rendered as a directed graph. Nodes are transactions, edges point from "waiting" to "holding". When a cycle forms, the graph edge forming the cycle turns red and pulses. The victim transaction (chosen by lowest cost heuristic) gets rolled back with a visual "X" and explanation.

Three scenarios pre-built:
1. Simple 2-transaction deadlock (T1 holds R1, wants R2; T2 holds R2, wants R1)
2. 3-transaction cycle deadlock
3. No deadlock (proper ordering prevents cycle)

The wait-for graph updates live as each lock request executes.

**Simulation engine:**
- `interface WaitForGraph { nodes: TxNode[], edges: WaitEdge[] }`
- `function detectCycle(graph: WaitForGraph): TxNode[] | null`
- `function simulateDeadlockDetection(scenario: string): DeadlockDetectionStep[]`

**File:** `architex/src/lib/database/deadlock-detection-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 8 | M | No (concurrency module has deadlock demo but it is thread-level, not DB transaction-level with wait-for graphs) |

---

### DB-NEW-08: Buffer Pool and Page Cache Visualizer

**1. LEARNING**
Canvas shows memory as a grid of page slots (16 slots). Each slot shows a page ID and a "pin count" badge. When a query requests a page:
1. Buffer pool hit: slot glows green, pin count increments
2. Buffer pool miss: a page must be evicted. The eviction policy (LRU, Clock, LRU-K) determines which page leaves. The evicted page flashes red if dirty (must write to disk first) or gray if clean (just discard).

The clock algorithm gets a special circular visualization with a "clock hand" sweeping around the buffer slots, checking reference bits.

A "workload runner" sends a predefined sequence of page requests (sequential scan, random lookups, index scan pattern). The user watches hit rate change in real time.

**Simulation engine:**
- `interface BufferPoolState { slots: PageSlot[], clockHand?: number, hitRate: number, diskReads: number, diskWrites: number }`
- `interface BufferPoolStep { requestedPage: number, action: 'hit'|'evict-clean'|'evict-dirty'|'load', evictedSlot?: number, description: string }`
- `function simulateBufferPool(capacity: number, policy: 'LRU'|'Clock'|'LRU-K', requests: number[]): BufferPoolStep[]`

**File:** `architex/src/lib/database/buffer-pool-viz.ts`
**Canvas:** `architex/src/components/modules/database/canvases/BufferPoolCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 10 | L | No |

---

### DB-NEW-09: Replication Topology Builder

**1. LEARNING**
Extends the existing ReplicationLagVisualizer. Instead of a fixed primary + replicas layout, the user can drag-and-drop nodes to build:
1. Single-leader (master-slave): one primary, N replicas
2. Multi-leader: multiple primaries that sync with each other
3. Leaderless (Dynamo-style): all nodes accept writes, quorum reads

For each topology, the canvas shows write propagation with animated arrows and latency labels. Conflict detection for multi-leader: when two leaders write the same key, a conflict popup appears with resolution options (last-writer-wins, merge, custom).

Quorum controls: user adjusts W (write quorum) and R (read quorum) with sliders. The formula W + R > N for strong consistency is shown. When violated, the canvas demonstrates a stale read.

**File:** `architex/src/lib/database/replication-topology-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | L | Partial (ReplicationLagVisualizer and ConsistencyLevelDemo exist but are separate non-interactive visualizers) |

---

### DB-NEW-10: Partitioning Strategy Comparison

**1. LEARNING**
Extends existing ShardingSimulator. Adds three side-by-side partition views with the same dataset:
1. Range partitioning: show partition boundaries on a number line. Demonstrates hot spots when data is skewed.
2. Hash partitioning: show modulo distribution. Demonstrates even distribution but inability to do range queries.
3. List partitioning: show category-based assignment (e.g., by country).

A "query router" panel shows which partitions each query type touches: point lookup (1 partition), range scan (multiple for range, all for hash), full table scan (all partitions). Partition pruning is animated.

**File:** `architex/src/lib/database/partition-compare-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | M | Partial (ShardingSimulator has hash/range/directory/consistent but no side-by-side comparison or query routing) |

---

### DB-NEW-11: NoSQL Data Modeling Canvas

**1. LEARNING**
Starting from the existing ERDiagramCanvas, add a "Convert to NoSQL" workflow. The user selects a target database type (Document/Key-Value/Wide-Column/Graph). The canvas transforms:

- **Document (MongoDB):** ER entities become nested documents. The canvas shows embedding vs referencing trade-offs. For a 1:N relationship, option A embeds the N-side inside the 1-side (show the JSON document growing). Option B stores references (show the _id links). A "query access pattern" panel lets the user define their top 3 queries, and the system recommends embedding or referencing based on read-vs-write ratio.

- **Key-Value (Redis):** Entities become key patterns. Show `user:123:profile`, `user:123:orders` key naming conventions. Demonstrate TTL, EXPIRE, and memory overhead.

- **Wide-Column (Cassandra):** Show the partition key and clustering key selection. The canvas renders a "wide row" as a horizontal strip of columns. Demonstrate how query patterns determine partition key choice.

- **Graph (Neo4j):** ER entities become nodes, relationships become edges with properties. Show Cypher query traversal with animated path highlighting.

**File:** `architex/src/lib/database/nosql-modeling-viz.ts` (extends existing `erToNoSQL` function)

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | XL | Partial (erToNoSQL exists for MongoDB conversion, SQLvsNoSQLCanvas exists for comparison table) |

---

### Database Practice Challenges (DB-PRACTICE)

**DB-PRACTICE-01: "Fix the Slow Query" Challenge**
Given a schema, a slow SQL query, and its EXPLAIN output showing SeqScan on 10M rows, the user must:
1. Identify the missing index
2. Write the CREATE INDEX statement
3. Predict the new plan (IndexScan vs SeqScan)
The system validates the index and shows the improved plan.

5 difficulty levels, 4 challenges each (20 total).

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 8 | M | No |

**DB-PRACTICE-02: "Design the Schema" Challenge**
Given a set of business requirements (e.g., "Uber needs to store rides, drivers, passengers, and real-time locations"), the user drags entities and relationships onto the ER canvas. The system grades:
- All entities present? (required set)
- Correct cardinalities?
- Proper normalization level?
- Missing indexes for common queries?

8 scenarios: e-commerce, social media, banking, ride-sharing, chat app, hotel booking, healthcare, gaming leaderboard.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 9 | L | No (ER canvas exists but no auto-grading against requirements) |

**DB-PRACTICE-03: "Predict the Anomaly" Challenge**
Extends existing PredictionPrompt. Given two concurrent transactions at a specific isolation level, the user must predict:
1. What anomaly occurs (dirty read, phantom read, lost update, write skew)?
2. At which step does it manifest?
3. Which isolation level would prevent it?

10 scenarios across all 4 isolation levels.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 7 | S | Partial (PredictionPrompt exists in transaction-sim.ts but only for 2 scenarios) |

**DB-PRACTICE-04: "Choose the Right Index Type" Challenge**
Given a query pattern and table statistics:
- B-Tree, B+ Tree, Hash, GIN, GiST, BRIN?
- Composite index column ordering?
- Covering index to eliminate table lookup?

The user selects their answer, system shows the cost comparison.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 6 | S | No |

---

### Database Assessment (DB-ASSESS)

**DB-ASSESS-01: Timed Query Optimization Challenge**
A SQL query runs in 3.2 seconds. The user has 5 minutes to bring it under 100ms using only: adding indexes, rewriting the query, adjusting isolation level. Each change shows the new EXPLAIN output and timing. Scored by final execution time and number of changes (fewer = bonus points).

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | L | No |

**DB-ASSESS-02: Database Internals Quiz Engine**
Adaptive difficulty quiz covering:
- "Which data structure does PostgreSQL use for its default index?" (B+ Tree)
- "What happens during LSM compaction?" (merge sorted runs)
- "What does MVCC's xmin field represent?" (creating transaction ID)
- "Why does ARIES use 3 phases?" (Analysis finds dirty pages, Redo replays WAL, Undo reverses uncommitted)

60 questions across 6 categories, FSRS-integrated for spaced repetition.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 5 | M | Partial (daily-challenges.ts has 60+ questions but no adaptive engine; FSRS exists in srs.ts) |

---

### Database Review (DB-REVIEW)

**DB-REVIEW-01: Flashcard Deck per Topic**
FSRS-integrated flashcards. Front/back format:

- "What is write amplification in LSM-Trees?" / "Each write is eventually written multiple times due to compaction merges. A write amplification of 10x means each 1KB user write causes 10KB of disk I/O."
- "When does a phantom read occur?" / "At REPEATABLE READ, a transaction re-executes a range query and sees new rows inserted by another committed transaction."
- "What is the leftmost prefix rule for composite indexes?" / "A composite index on (A,B,C) can serve queries on (A), (A,B), or (A,B,C), but NOT (B), (C), or (B,C) alone."

150 flashcards across all database topics. Stored in database module_content table with type='flashcard'.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 5 | M | Partial (FSRS engine exists, LLD has ReviewWidget, but no database-specific flashcard deck) |

---

### Database AI Features (DB-AI)

**DB-AI-01: AI Query Optimizer**
User pastes a SQL query. AI analyzes:
1. Missing indexes (with CREATE INDEX suggestion)
2. Query rewrites (e.g., correlated subquery to JOIN, DISTINCT to GROUP BY)
3. N+1 query detection
4. Unnecessary columns in SELECT *

Uses Claude Sonnet via existing `claude-client.ts`. Heuristic fallback for offline mode.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No (claude-client.ts and AI infrastructure exist) |

**DB-AI-02: Schema Design Reviewer**
After the user builds an ER diagram, AI reviews:
- Normalization issues (redundant attributes, missing FKs)
- Missing audit columns (created_at, updated_at)
- Naming convention violations
- N+1 query risks based on relationship patterns

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | M | No |

---

## PART 2: BACKEND ENGINEERING MODULE -- NEW MODULE

This is an entirely new module. It requires a new wrapper, module component, sidebar, canvas area, bottom panel, and lib engines.

**File structure:**
```
architex/src/components/modules/BackendModule.tsx
architex/src/components/modules/backend/useBackendModule.ts
architex/src/components/modules/backend/BackendSidebar.tsx
architex/src/components/modules/backend/BackendProperties.tsx
architex/src/components/modules/backend/BackendBottomPanel.tsx
architex/src/components/modules/backend/canvases/
architex/src/components/modules/wrappers/BackendWrapper.tsx
architex/src/lib/backend/
```

### BE-01: REST API Design Studio

**1. LEARNING**
An interactive API design canvas. The user defines resources (e.g., /users, /orders). For each resource:
- Available HTTP verbs shown as colored pills (GET=green, POST=blue, PUT=yellow, PATCH=orange, DELETE=red)
- Response codes shown per verb (200, 201, 204, 400, 401, 403, 404, 409, 422, 500)
- Request/response body schema shown as expandable JSON trees

A "violations panel" detects common REST anti-patterns in real time:
- Using POST for retrieval
- Using GET with body
- Returning 200 on error
- Verbs in URLs (/createUser instead of POST /users)
- Missing pagination on list endpoints
- Missing HATEOAS links

**Simulation:** User defines an API surface. The system simulates a client making requests. The canvas shows the request/response sequence diagram (reuse sequence diagram engine from LLD module).

**Simulation engine:**
- `interface RESTEndpoint { path: string, method: HttpMethod, requestSchema?: JSONSchema, responseSchema: JSONSchema, statusCodes: StatusCode[], description: string }`
- `interface RESTViolation { rule: string, severity: 'error'|'warning', endpoint: string, fix: string }`
- `function analyzeAPI(endpoints: RESTEndpoint[]): RESTViolation[]`
- `function simulateClientServer(endpoints: RESTEndpoint[], scenario: string): SequenceStep[]`

**File:** `architex/src/lib/backend/rest-api-viz.ts`
**Canvas:** `architex/src/components/modules/backend/canvases/RESTDesignCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | L | No |

---

### BE-02: JWT Internals Deep Dive

**1. LEARNING**
Extends existing SecurityModule JWT lifecycle. New features:
1. Token anatomy: header.payload.signature as three colored blocks. Click each to expand its JSON and see every field (alg, typ, sub, iat, exp, iss, aud, custom claims).
2. Signature verification: animated HMAC-SHA256 flow. Input = base64(header) + "." + base64(payload) + secret. Show the hash computation step-by-step.
3. Refresh token flow: access token expires (timer counts down), client sends refresh token to /auth/refresh, new access token issued. Show the token rotation with the old refresh token invalidated.
4. Session vs Token comparison: split-screen. Left: session-based (server stores session in Redis, client sends cookie). Right: token-based (client stores JWT in memory, sends Authorization header). Show server memory usage growing for sessions vs staying flat for tokens.

**Simulation engine:**
- `function simulateTokenRotation(accessTTL: number, refreshTTL: number, requestCount: number): TokenRotationStep[]`
- `function simulateSessionVsToken(userCount: number, requestRate: number): ComparisonStep[]`
- `interface TokenRotationStep { tick: number, event: 'request'|'access-expired'|'refresh'|'new-token'|'refresh-expired'|'re-login', accessToken?: string, refreshToken?: string, description: string }`

**File:** `architex/src/lib/backend/jwt-deep-dive.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | M | Partial (jwt-engine.ts, jwt-attacks.ts exist in security module) |

---

### BE-03: OAuth 2.0 Complete Flow Simulator

**1. LEARNING**
Extends existing OAuth module. Adds all 4 flows as interactive sequence diagrams:
1. **Authorization Code + PKCE** (already exists)
2. **Client Credentials** (already exists)
3. **Device Authorization** (device-auth.ts exists)
4. **Implicit (deprecated)** -- show it, then show why it was deprecated with a MITM attack animation where the attacker intercepts the token from the URL fragment

New: **Token Inspection Panel.** At any step, the user can click a token to see its decoded contents, expiration, and scope.

New: **Scope Visualization.** Define scopes (read:users, write:orders, admin:*). Show how scope restricts API access with a matrix: endpoint x scope = allowed/denied.

**File:** `architex/src/lib/backend/oauth-complete.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 7 | 6 | M | Partial (oauth-flows.ts has auth-code-pkce and client-credentials; device-auth.ts exists) |

---

### BE-04: Pagination Strategy Comparison

**1. LEARNING**
Three columns showing the same dataset (1000 user records) paginated three ways:

1. **Offset-based:** `LIMIT 20 OFFSET 40`. Show the SQL, the page links (1, 2, 3... 50), and the problem: when a new record is inserted, page 3 shows a duplicate from page 2. Animation: insert a record at position 5, watch all subsequent pages shift.

2. **Cursor-based:** `WHERE id > :cursor LIMIT 20`. Show the opaque cursor token. Demonstrate stability: inserting at position 5 does NOT affect the current page. Show the downside: cannot jump to page 37.

3. **Keyset:** `WHERE (created_at, id) > (:last_created_at, :last_id) LIMIT 20`. Show the composite cursor. Demonstrate: even with timestamp ties, the tie-breaking by id ensures no duplicates.

A "consistency test" button inserts/deletes records during pagination to show which strategy remains stable.

**Simulation engine:**
- `interface PaginationStep { strategy: string, page: number, sql: string, results: Row[], cursor?: string, problem?: string }`
- `function simulateOffset(data: Row[], pageSize: number, mutations: Mutation[]): PaginationStep[]`
- `function simulateCursor(data: Row[], pageSize: number, mutations: Mutation[]): PaginationStep[]`
- `function simulateKeyset(data: Row[], pageSize: number, keyColumns: string[], mutations: Mutation[]): PaginationStep[]`

**File:** `architex/src/lib/backend/pagination-viz.ts`
**Canvas:** `architex/src/components/modules/backend/canvases/PaginationCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | M | No |

---

### BE-05: Idempotency Key Simulator

**1. LEARNING**
Canvas shows a client making a payment request to a server. Scenario flow:
1. Client generates idempotency key (UUID v4)
2. Client sends POST /payments with Idempotency-Key header
3. Server checks key store (Redis). Key not found -> process payment -> store result keyed by idempotency key with TTL
4. Network fails. Client never gets response.
5. Client retries with SAME idempotency key
6. Server checks key store. Key found -> return cached result without reprocessing
7. Customer is charged exactly once

"What-if" toggles:
- What if no idempotency key? -> Double charge animation
- What if different key on retry? -> Double charge animation
- What if key expired (TTL)? -> Re-process (show TTL countdown)
- What if concurrent requests with same key? -> Server locks key, second request waits

**Simulation engine:**
- `interface IdempotencyStep { tick: number, actor: 'client'|'server'|'redis'|'payment-provider', action: string, idempotencyKey?: string, status: 'processing'|'cached'|'error'|'success', description: string }`
- `function simulateIdempotency(scenario: 'happy'|'retry'|'no-key'|'concurrent'|'expired'): IdempotencyStep[]`

**File:** `architex/src/lib/backend/idempotency-viz.ts`
**Canvas:** `architex/src/components/modules/backend/canvases/IdempotencyCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | M | No |

---

### BE-06: Retry with Exponential Backoff and Jitter

**1. LEARNING**
Three timeline visualizations running simultaneously with the same failing service:

1. **No retry:** Request fails, user sees error. End.
2. **Fixed interval retry:** Retry every 1s. All clients retry at the same time -> thundering herd. Show the server request spike.
3. **Exponential backoff + jitter:** First retry at 1s + random(0-500ms), second at 2s + jitter, third at 4s + jitter. Show requests spreading out. Server load stays manageable.

A server "health bar" at the top shows request load. With fixed retries, the bar spikes red. With backoff + jitter, the bar stays yellow.

**Circuit breaker integration:** After N consecutive failures, the circuit opens. Requests fail fast without hitting the server. After a timeout, a single probe request tests recovery. If successful, circuit closes.

A state machine diagram for the circuit breaker: CLOSED -> OPEN -> HALF_OPEN -> CLOSED/OPEN.

**Simulation engine:**
- `interface RetryStep { tick: number, clientId: number, attempt: number, delay: number, serverLoad: number, circuitState?: 'closed'|'open'|'half-open', result: 'success'|'fail'|'fast-fail', description: string }`
- `function simulateRetryStrategy(strategy: 'none'|'fixed'|'exponential'|'exponential-jitter', clientCount: number, failureDuration: number, circuitBreaker: boolean): RetryStep[]`

**File:** `architex/src/lib/backend/retry-viz.ts`
**Canvas:** `architex/src/components/modules/backend/canvases/RetryCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | L | No |

---

### BE-07: Rate Limiting Algorithm Deep Comparison

**1. LEARNING**
Extends existing rate-limiting-demo.ts from Security module. New features:

1. **Visual token bucket:** A literal bucket that fills with tokens over time. Each request removes a token. When empty, requests bounce off (denied). Token count shown as fill level.

2. **Sliding window log:** A horizontal timeline. Each request places a dot. The window slides right. When dots in the window exceed limit, new dots are red (denied). The user can see the window moving.

3. **Sliding window counter:** Weighted combination of current and previous window counts. Show the math: `count = prev_window_count * (1 - elapsed/window_size) + current_window_count`. Animated calculation.

4. **Leaky bucket:** A bucket that drains at a constant rate. Requests enter from top. If bucket overflows, requests are rejected. Show the queue forming inside the bucket.

All four algorithms run simultaneously against the same traffic pattern (burst, steady, burst-steady-burst). A comparison table updates live: allowed count, denied count, burst tolerance, memory usage.

**Distributed rate limiting extension:** Show the challenge when rate limiting spans multiple API servers. Token bucket with Redis EVAL script. Sliding window with sorted set.

**File:** `architex/src/lib/backend/rate-limiting-deep.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | L | Partial (rate-limiting-demo.ts has token-bucket, sliding-window, leaky-bucket but as data-only steps; no visual bucket metaphor or distributed extension) |

---

### BE-08: Microservices Communication Patterns

**1. LEARNING**
Interactive service mesh canvas. The user places services (User Service, Order Service, Payment Service, Notification Service, API Gateway). Connections represent communication patterns:

1. **Synchronous (REST/gRPC):** Solid arrow. Show latency propagation: if User Service -> Order Service -> Payment Service, total latency = sum. If Payment Service is slow, everything upstream blocks. Timeout cascade demonstrated.

2. **Asynchronous (Message Queue):** Dashed arrow with a queue icon between services. Show message being produced, enqueued, consumed. If consumer is slow, queue grows (show queue depth). Fire-and-forget vs request-reply patterns.

3. **Service Discovery:** Show the registry (Consul, Eureka) that services register with. When a service instance dies, the registry deregisters it after TTL. Other services see the updated list.

4. **API Gateway pattern:** All external traffic enters through the gateway. Show routing rules, rate limiting per client, authentication, request transformation.

**Failure modes:** Click a service to "kill" it. Watch cascading failures propagate (or not, if circuit breakers are enabled). Show retry storms, timeout propagation.

**File:** `architex/src/lib/backend/microservices-viz.ts`
**Canvas:** `architex/src/components/modules/backend/canvases/MicroservicesCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | XL | No (system design canvas has service nodes but no service-to-service communication simulation) |

---

### BE-09: Database Schema Design Workshop

**1. LEARNING**
Focused on normalization vs denormalization trade-offs for real-world scenarios. Given a set of query patterns with frequency and latency requirements:

1. Start with a fully normalized schema (3NF)
2. Show query execution: JOIN heavy, multiple table lookups, 120ms response time
3. User selectively denormalizes: embed order_total in orders table (eliminates SUM query), duplicate customer_name in orders (eliminates JOIN)
4. Show improved query time but highlight the trade-off: now UPDATE customer name must update orders table too (show the UPDATE propagation)
5. A "write amplification" counter shows how many additional writes each denormalization causes

**File:** `architex/src/lib/backend/schema-design-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No (normalization engine exists but focuses on NF detection, not denormalization trade-offs) |

---

### Backend Practice Challenges (BE-PRACTICE)

**BE-PRACTICE-01: "Design the API" Challenge**
Given business requirements (e.g., "Design an API for a library management system"), the user must:
1. Define resources and endpoints
2. Choose correct HTTP verbs
3. Design request/response schemas
4. Handle error cases
5. Add pagination to list endpoints

System grades against a rubric: resource naming (10pts), verb correctness (10pts), status codes (10pts), pagination (5pts), idempotency (5pts). 10 scenarios.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 8 | L | No |

**BE-PRACTICE-02: "Fix the Retry Logic" Challenge**
Given a code snippet with broken retry logic (e.g., retries on non-idempotent operations, no backoff, no circuit breaker), the user identifies and fixes the issues. Multiple choice + code editing.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | M | No |

---

### Backend Assessment (BE-ASSESS)

**BE-ASSESS-01: API Design Review**
The user designs an API from scratch. An AI reviewer (Claude Sonnet via existing claude-client.ts) analyzes:
- RESTful compliance score
- Error handling completeness
- Security considerations (auth, rate limiting, input validation)
- Scalability patterns (pagination, caching headers, ETags)

Produces a letter grade (A-F) with specific improvement suggestions.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No |

---

### Backend Review (BE-REVIEW)

**BE-REVIEW-01: Backend Concepts Flashcard Deck**
100 FSRS-integrated flashcards:
- "What HTTP status code for 'resource created'?" / "201 Created. Include Location header pointing to the new resource."
- "What is the difference between PUT and PATCH?" / "PUT replaces the entire resource. PATCH applies partial modifications. PUT is idempotent; PATCH may or may not be."
- "Why add jitter to exponential backoff?" / "Without jitter, all clients retry at the same backoff intervals, causing synchronized retry storms (thundering herd)."
- "What is a circuit breaker's half-open state?" / "After the circuit has been open for a timeout period, one probe request is allowed through. If it succeeds, circuit closes. If it fails, circuit reopens."

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 5 | S | No |

---

### Backend AI Features (BE-AI)

**BE-AI-01: API Design Copilot**
User describes their API in natural language ("I need an API for an e-commerce platform with users, products, orders, and payments"). AI generates:
1. Resource hierarchy
2. Endpoint definitions with verbs, paths, request/response schemas
3. Authentication recommendations
4. Pagination strategy recommendation based on data patterns
5. Rate limiting configuration

User can accept, modify, or reject each suggestion. Results populate the REST Design Studio.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | L | No |

---

## PART 3: CONCURRENCY MODULE -- NEW FEATURES

### CON-NEW-01: CAS (Compare-and-Swap) Lock-Free Visualizer

**1. LEARNING**
Canvas shows a memory location with a value (e.g., counter = 5). Three threads attempt CAS simultaneously:

1. Thread A reads value 5, computes 6, CAS(expected=5, new=6) -- SUCCESS (value becomes 6)
2. Thread B reads value 5 (stale!), computes 6, CAS(expected=5, new=6) -- FAIL (value is now 6, not 5)
3. Thread B retries: reads value 6, computes 7, CAS(expected=6, new=7) -- SUCCESS

The animation shows:
- The atomic compare step (value matches expected? green check / red X)
- The swap step (if match, atomically replace)
- The retry loop (failed CAS -> re-read -> recompute -> retry)

**Lock-free stack demo:** Push and pop operations using CAS on the head pointer. Show the ABA problem: Thread A reads head=X, gets preempted. Thread B pops X, pops Y, pushes X back. Thread A wakes up, CAS succeeds (head is X again) but the stack state is different. Show the fix: add a version counter to the pointer.

**Lock-free queue (Michael-Scott queue):** Enqueue and dequeue with CAS on head/tail pointers. Show how dummy node eliminates contention between enqueue and dequeue.

**Simulation engine:**
- `interface CASStep { tick: number, threadId: string, action: 'read'|'compute'|'cas-attempt'|'cas-success'|'cas-fail'|'retry', expected?: number, actual?: number, newValue?: number, description: string }`
- `function simulateCASCounter(threadCount: number, incrementsEach: number): CASStep[]`
- `function simulateLockFreeStack(operations: StackOp[]): CASStep[]`
- `function simulateABAProblem(): CASStep[]`

**File:** `architex/src/lib/concurrency/cas-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | L | No |

---

### CON-NEW-02: Java ConcurrentHashMap Internals

**1. LEARNING**
Interactive visualization of ConcurrentHashMap (Java 8+):

1. **Segment-level locking (Java 7 style):** Show the 16 segments, each with its own lock. Two threads writing to different segments proceed in parallel. Two threads writing to the same segment: one acquires the segment lock, the other waits.

2. **Node-level CAS + synchronized (Java 8 style):** Show the bucket array. For empty buckets, CAS the first node in. For non-empty, synchronized on the first node of the chain. Demonstrate concurrent writes to different buckets proceeding without locks.

3. **Treeification:** When a bucket's chain exceeds 8 nodes, it converts to a red-black tree. Show the linked list transforming into a tree with O(log n) lookup. When it shrinks below 6, convert back.

4. **Resize:** Show the "transfer" operation where each thread helps migrate buckets. The `transferIndex` counter shows which bucket is being moved. Multiple threads can resize concurrently.

**Simulation engine:**
- `interface CHMStep { tick: number, threadId: string, operation: 'put'|'get'|'cas'|'lock'|'unlock'|'treeify'|'untreeify'|'resize'|'transfer', bucket: number, description: string, state: CHMState }`
- `interface CHMState { buckets: BucketState[], size: number, threshold: number, resizing: boolean }`
- `function simulateCHM(operations: CHMOp[], version: 'java7'|'java8'): CHMStep[]`

**File:** `architex/src/lib/concurrency/concurrent-hashmap-viz.ts`
**Canvas:** `architex/src/components/modules/concurrency/ConcurrentHashMapCanvas.tsx`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 10 | XL | No |

---

### CON-NEW-03: Thread Pool Deep Dive

**1. LEARNING**
Extends existing ThreadPoolSaturationVisualizer. New features:

1. **Pool sizing calculator:** User inputs: CPU cores (N), target CPU utilization (U), wait-to-compute ratio (W/C). Formula: `optimalThreads = N * U * (1 + W/C)`. The canvas shows a CPU with N cores, threads assigned to cores, and idle/waiting threads visualized.

2. **Rejection policies:** When the thread pool is saturated and the queue is full:
   - AbortPolicy: throw exception (request rejected with red X)
   - CallerRunsPolicy: the submitting thread runs the task itself (show it blocking)
   - DiscardPolicy: silently drop the task (task vanishes)
   - DiscardOldestPolicy: drop the oldest queued task, submit new one (show swap)

3. **Work stealing:** ForkJoinPool visualization. Each thread has its own deque. When a thread's deque is empty, it "steals" from the tail of another thread's deque. Show the deques as horizontal bars with tasks, and theft arrows between them.

**Simulation engine:**
- `function calculateOptimalPoolSize(cores: number, utilization: number, waitComputeRatio: number): { threads: number, explanation: string }`
- `function simulateRejectionPolicy(policy: RejectionPolicy, poolSize: number, queueSize: number, tasks: Task[]): RejectionStep[]`
- `function simulateWorkStealing(threadCount: number, tasks: Task[]): WorkStealingStep[]`

**File:** `architex/src/lib/concurrency/thread-pool-deep.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | L | Partial (ThreadPoolSaturationVisualizer exists with pool/queue/reject but no sizing formula, rejection policies, or work stealing) |

---

### CON-NEW-04: Go Select and Channel Patterns Deep Dive

**1. LEARNING**
Extends existing goroutines.ts. New interactive patterns:

1. **Fan-out/Fan-in:** One goroutine distributes work to N worker goroutines via channels. Workers send results back to a single collector. Show goroutine bars, channel pipes, and messages flowing.

2. **Select with timeout:** Multiple channels, select picks the first ready. `time.After(3s)` creates a timeout channel. If no other channel is ready in 3s, timeout fires. Show the select statement highlighting which case matches.

3. **Done channel (cancellation):** A parent goroutine signals cancellation by closing the done channel. All child goroutines detect the close via `<-done` and exit. Show cascading shutdown.

4. **Worker pool with buffered channels:** N goroutines read from a buffered job channel. Show backpressure when the channel is full: the producer blocks until a worker consumes.

5. **Pipeline pattern:** Stage1 -> chan -> Stage2 -> chan -> Stage3. Each stage is a goroutine. Show how each stage processes concurrently. If Stage2 is slow, the channel between Stage1 and Stage2 fills up (backpressure).

**Simulation engine:**
- `function simulateFanOutFanIn(workerCount: number, jobCount: number): GoPatternStep[]`
- `function simulateSelectTimeout(channels: number, timeoutMs: number): GoPatternStep[]`
- `function simulateDoneChannel(goroutineCount: number): GoPatternStep[]`
- `function simulateWorkerPool(poolSize: number, bufferSize: number, jobCount: number): GoPatternStep[]`
- `function simulatePipeline(stages: number, bufferSize: number): GoPatternStep[]`

**File:** `architex/src/lib/concurrency/go-patterns-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | L | Partial (goroutines.ts has 5 demos but not fan-out/fan-in, pipeline, done channel, or worker pool) |

---

### CON-NEW-05: ReentrantLock and Condition Variables (Java)

**1. LEARNING**
Canvas shows two code paths: synchronized block vs ReentrantLock with try-finally.

1. **Reentrancy:** Thread A acquires lock, calls method B which also acquires the same lock. With ReentrantLock, the hold count increments (shown as a counter). Without reentrancy, this would deadlock.

2. **Condition variables:** Producer-consumer with `Condition notFull = lock.newCondition()` and `Condition notEmpty = lock.newCondition()`. Show:
   - Producer calls `notFull.await()` when buffer is full (thread moves to waiting queue)
   - Consumer removes item, calls `notFull.signal()` (thread moves from waiting to ready)
   - Separate condition queues vs single wait set

3. **tryLock with timeout:** Thread A holds lock. Thread B calls `tryLock(500, MILLISECONDS)`. Timer counts down. If A releases before timeout, B acquires. If not, B gives up (no deadlock).

4. **Fair vs unfair lock:** With fair=true, threads acquire in FIFO order (show ordered queue). With fair=false, newly arriving threads can jump the queue (show barging). Throughput vs fairness trade-off graph.

**File:** `architex/src/lib/concurrency/reentrant-lock-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 8 | M | No |

---

### CON-NEW-06: Volatile and Memory Visibility (Java)

**1. LEARNING**
Canvas shows two threads, each with their own CPU cache and a shared main memory.

1. **Without volatile:** Thread A writes `flag = true` to its cache. Thread B reads `flag` from its own cache: still `false`. The write is not visible. Show the inconsistency with arrows from thread to cache to memory.

2. **With volatile:** Thread A writes `flag = true`. The volatile keyword forces a write-through to main memory AND invalidates Thread B's cached copy. Thread B's next read goes to main memory: sees `true`.

3. **Happens-before relationship:** Show the timeline. Write to volatile variable happens-before read of same variable by another thread. All writes before the volatile write are also visible.

4. **Volatile is NOT atomic for compound operations:** `volatile int counter; counter++` is still unsafe because `counter++` is read-modify-write (3 steps). Show the race condition even with volatile.

**File:** `architex/src/lib/concurrency/volatile-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 9 | M | No |

---

### CON-NEW-07: Deadlock Prevention Strategies Comparison

**1. LEARNING**
Extends existing deadlock-demo.ts. Adds four prevention strategies side-by-side:

1. **Lock ordering:** All threads acquire locks in global order (Resource-1 before Resource-2). Show that circular wait is impossible.
2. **Lock timeout (tryLock):** Threads give up after timeout and release held locks. Show the backoff and retry.
3. **Deadlock detection + victim selection:** Allow deadlocks to occur, detect cycle in wait-for graph, kill lowest-cost transaction.
4. **Wound-Wait / Wait-Die:** Timestamp-based. Older transaction wounds (aborts) younger. Or younger waits, older dies. Show the timestamp comparison.

Each strategy runs the same scenario. A comparison table shows: deadlock possible? (Y/N), throughput, abort rate, latency.

**File:** `architex/src/lib/concurrency/deadlock-prevention-viz.ts`

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 8 | M | Partial (deadlock-demo.ts has circular-wait and ordering, but no timeout, detection, or wound-wait) |

---

### Concurrency Practice Challenges (CON-PRACTICE)

**CON-PRACTICE-01: "Spot the Race Condition" Challenge**
Given a code snippet (Java or Go), the user must:
1. Identify the shared mutable state
2. Mark the critical section
3. Choose the correct synchronization primitive (mutex, atomic, channel, synchronized, volatile)
4. Predict the output range (e.g., counter will be between 80 and 100 for 100 increments)

10 scenarios with increasing difficulty. System runs the simulation to verify the user's prediction.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 9 | M | No |

**CON-PRACTICE-02: "Fix the Deadlock" Challenge**
Given a resource allocation graph with a deadlock, the user must:
1. Identify the cycle
2. Choose a prevention strategy
3. Reorder lock acquisition to break the cycle
System verifies by running the simulation with the user's fix.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No |

**CON-PRACTICE-03: "Size the Thread Pool" Challenge**
Given: CPU cores, task characteristics (CPU-bound vs I/O-bound), target throughput.
User must calculate optimal pool size and queue depth.
System simulates the workload and shows whether the pool is undersized (tasks rejected), oversized (threads idle), or optimal.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | S | No |

---

### Concurrency Assessment (CON-ASSESS)

**CON-ASSESS-01: Concurrency Bug Finder**
A timed assessment. The user is shown 10 code snippets in 10 minutes. Each has a concurrency bug (race condition, deadlock, livelock, starvation, or no bug). The user classifies each and identifies the fix. Scored by accuracy and speed.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No |

**CON-ASSESS-02: Adaptive Concurrency Quiz**
50 questions across all concurrency topics. FSRS-integrated, adaptive difficulty:
- "What is the ABA problem?" (lock-free)
- "Why does `volatile` alone not protect `counter++`?" (Java memory model)
- "What does `select {}` do in Go?" (blocks forever)
- "What is the difference between `await()` and `signal()` vs `wait()` and `notify()`?" (Condition vs Object monitor)
- "In a ForkJoinPool, which end of the deque does the owning thread use?" (LIFO/head for locality)

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 5 | M | No |

---

### Concurrency Review (CON-REVIEW)

**CON-REVIEW-01: Concurrency Flashcard Deck**
120 FSRS-integrated flashcards:
- "What are the four Coffman conditions for deadlock?" / "Mutual exclusion, hold-and-wait, no preemption, circular wait. Remove ANY one to prevent deadlock."
- "When should you use a spinlock vs a mutex?" / "Spinlock: critical section < context switch time (~1-10us). Mutex: longer critical sections where thread should sleep."
- "What is the Java Memory Model's happens-before guarantee for volatile?" / "A write to a volatile field happens-before every subsequent read of that field. All writes before the volatile write are also visible to the reading thread."
- "What is goroutine scheduling model?" / "M:N scheduling. M goroutines multiplexed onto N OS threads. The Go runtime scheduler uses work stealing."

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 5 | S | No |

---

### Concurrency AI Features (CON-AI)

**CON-AI-01: Concurrency Code Reviewer**
User pastes Java or Go code. AI analyzes:
1. Shared mutable state without synchronization
2. Lock ordering violations
3. Missing volatile on flag variables
4. Goroutine leaks (no cancellation context)
5. Channel misuse (unbuffered where buffered needed, or vice versa)

Produces annotated code with issue highlights and fixes.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 9 | 8 | M | No |

---

## PART 4: CROSS-MODULE INTEGRATION FEATURES

### CROSS-01: Database + Concurrency -- Transaction Isolation + Locking Integration

When viewing Transaction Isolation, a toggle shows the locking mechanism underneath:
- Read Committed: row-level shared locks released after each statement
- Repeatable Read: row-level shared locks held until commit
- Serializable: predicate locks (show the lock range)

The lock visualization from the Concurrency module appears overlaid on the Transaction canvas.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 8 | 7 | M | No |

### CROSS-02: Backend + Database -- API Request to Query Pipeline

An end-to-end trace: HTTP request -> API Gateway -> Backend service -> connection pool -> SQL query -> query plan -> result -> JSON response. Each stage shows latency. The user can identify which stage is the bottleneck.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 10 | 10 | XL | No |

### CROSS-03: Backend + Concurrency -- Rate Limiter with Thread Pool

Show how a rate limiter protects a thread pool. Requests arrive faster than the pool can process. Without rate limiting, the queue overflows. With token bucket rate limiting, excess requests are rejected early.

| Impact | WOW | Effort | Exists |
|--------|-----|--------|--------|
| 7 | 7 | M | No |

---

## IMPLEMENTATION PRIORITY MATRIX

### CRITICAL (Ship First) -- Highest Impact x WOW, Reasonable Effort

| # | Feature | Impact | WOW | Effort | Module |
|---|---------|--------|-----|--------|--------|
| 1 | BE-05: Idempotency Key Simulator | 10 | 10 | M | Backend |
| 2 | BE-06: Retry + Backoff + Circuit Breaker | 10 | 10 | L | Backend |
| 3 | CON-NEW-01: CAS Lock-Free Visualizer | 10 | 10 | L | Concurrency |
| 4 | DB-NEW-06: Pessimistic vs Optimistic Locking | 9 | 9 | M | Database |
| 5 | BE-04: Pagination Strategy Comparison | 9 | 9 | M | Backend |
| 6 | DB-NEW-01: SQL Playground + EXPLAIN ANALYZE | 10 | 9 | L | Database |
| 7 | DB-PRACTICE-01: Fix the Slow Query Challenge | 10 | 8 | M | Database |

### HIGH (Ship Soon)

| # | Feature | Impact | WOW | Effort | Module |
|---|---------|--------|-----|--------|--------|
| 8 | CON-NEW-06: Volatile + Memory Visibility | 9 | 9 | M | Concurrency |
| 9 | DB-NEW-02: Window Functions Step Visualizer | 9 | 9 | M | Database |
| 10 | CON-NEW-03: Thread Pool Deep Dive | 9 | 9 | L | Concurrency |
| 11 | BE-07: Rate Limiting Algorithm Deep Comparison | 9 | 9 | L | Backend |
| 12 | DB-NEW-08: Buffer Pool + Page Cache Visualizer | 9 | 10 | L | Database |
| 13 | CON-NEW-04: Go Select/Channel Patterns | 9 | 9 | L | Concurrency |
| 14 | BE-08: Microservices Communication Patterns | 10 | 10 | XL | Backend |
| 15 | DB-NEW-09: Replication Topology Builder | 9 | 9 | L | Database |
| 16 | CON-NEW-02: ConcurrentHashMap Internals | 9 | 10 | XL | Concurrency |
| 17 | BE-01: REST API Design Studio | 9 | 8 | L | Backend |
| 18 | CON-PRACTICE-01: Spot the Race Condition | 10 | 9 | M | Concurrency |
| 19 | DB-PRACTICE-02: Design the Schema Challenge | 10 | 9 | L | Database |

### MEDIUM (Nice to Have)

| # | Feature | Impact | WOW | Effort | Module |
|---|---------|--------|-----|--------|--------|
| 20 | DB-NEW-03: CTE Execution Flow | 8 | 8 | M | Database |
| 21 | CON-NEW-05: ReentrantLock + Conditions | 8 | 8 | M | Concurrency |
| 22 | CON-NEW-07: Deadlock Prevention Comparison | 8 | 8 | M | Concurrency |
| 23 | DB-NEW-07: DB Deadlock Detection (Wait-For Graph) | 8 | 8 | M | Database |
| 24 | DB-NEW-04: Composite/Covering Index Simulator | 9 | 7 | M | Database |
| 25 | DB-NEW-10: Partitioning Strategy Comparison | 8 | 7 | M | Database |
| 26 | CROSS-02: API-to-Query Pipeline | 10 | 10 | XL | Cross |
| 27 | DB-NEW-11: NoSQL Data Modeling Canvas | 9 | 9 | XL | Database |
| 28 | DB-ASSESS-01: Timed Query Optimization | 10 | 10 | L | Database |
| 29 | BE-09: Schema Design Workshop | 9 | 8 | M | Backend |
| 30 | CON-ASSESS-01: Concurrency Bug Finder | 9 | 8 | M | Concurrency |

### LOWER (Future)

| # | Feature | Impact | WOW | Effort | Module |
|---|---------|--------|-----|--------|--------|
| 31 | DB-NEW-05: Partial/Expression Index | 7 | 7 | S | Database |
| 32 | BE-02: JWT Internals Deep Dive | 8 | 7 | M | Backend |
| 33 | BE-03: OAuth 2.0 Complete Flows | 7 | 6 | M | Backend |
| 34 | All flashcard decks (DB/BE/CON) | 8 | 5 | M | All |
| 35 | All AI features (DB-AI/BE-AI/CON-AI) | 9 | 8 | M | All |
| 36 | CROSS-01: Transaction + Locking overlay | 8 | 7 | M | Cross |
| 37 | CROSS-03: Rate Limiter + Thread Pool | 7 | 7 | M | Cross |

---

## EFFORT ESTIMATION KEY

- **S (Small):** 1-2 files, < 500 lines, single simulation engine + single canvas component. ~1 session.
- **M (Medium):** 3-5 files, 500-1500 lines, simulation engine + canvas + sidebar integration + tests. ~2 sessions.
- **L (Large):** 5-10 files, 1500-3000 lines, engine + multiple canvases + properties panel + bottom panel + tests. ~3-4 sessions.
- **XL (Extra Large):** 10+ files, 3000+ lines, new module structure + multiple engines + multiple canvases + full panel suite. ~5-6 sessions.

---

## NEW FILE MANIFEST

### Database (new files)
- `architex/src/lib/database/query-plan-interactive.ts`
- `architex/src/lib/database/window-function-viz.ts`
- `architex/src/lib/database/cte-viz.ts`
- `architex/src/lib/database/composite-index-viz.ts`
- `architex/src/lib/database/partial-index-viz.ts`
- `architex/src/lib/database/locking-viz.ts`
- `architex/src/lib/database/deadlock-detection-viz.ts`
- `architex/src/lib/database/buffer-pool-viz.ts`
- `architex/src/lib/database/replication-topology-viz.ts`
- `architex/src/lib/database/partition-compare-viz.ts`
- `architex/src/lib/database/nosql-modeling-viz.ts`
- `architex/src/components/modules/database/canvases/ExplainAnalyzeCanvas.tsx`
- `architex/src/components/modules/database/canvases/WindowFunctionCanvas.tsx`
- `architex/src/components/modules/database/canvases/CompositeIndexCanvas.tsx`
- `architex/src/components/modules/database/canvases/LockingCanvas.tsx`
- `architex/src/components/modules/database/canvases/BufferPoolCanvas.tsx`

### Backend Engineering (entire new module)
- `architex/src/lib/backend/rest-api-viz.ts`
- `architex/src/lib/backend/jwt-deep-dive.ts`
- `architex/src/lib/backend/oauth-complete.ts`
- `architex/src/lib/backend/pagination-viz.ts`
- `architex/src/lib/backend/idempotency-viz.ts`
- `architex/src/lib/backend/retry-viz.ts`
- `architex/src/lib/backend/rate-limiting-deep.ts`
- `architex/src/lib/backend/microservices-viz.ts`
- `architex/src/lib/backend/schema-design-viz.ts`
- `architex/src/lib/backend/index.ts`
- `architex/src/components/modules/BackendModule.tsx`
- `architex/src/components/modules/backend/useBackendModule.ts`
- `architex/src/components/modules/backend/BackendSidebar.tsx`
- `architex/src/components/modules/backend/BackendProperties.tsx`
- `architex/src/components/modules/backend/BackendBottomPanel.tsx`
- `architex/src/components/modules/backend/canvases/RESTDesignCanvas.tsx`
- `architex/src/components/modules/backend/canvases/PaginationCanvas.tsx`
- `architex/src/components/modules/backend/canvases/IdempotencyCanvas.tsx`
- `architex/src/components/modules/backend/canvases/RetryCanvas.tsx`
- `architex/src/components/modules/backend/canvases/MicroservicesCanvas.tsx`
- `architex/src/components/modules/wrappers/BackendWrapper.tsx`

### Concurrency (new files)
- `architex/src/lib/concurrency/cas-viz.ts`
- `architex/src/lib/concurrency/concurrent-hashmap-viz.ts`
- `architex/src/lib/concurrency/thread-pool-deep.ts`
- `architex/src/lib/concurrency/go-patterns-viz.ts`
- `architex/src/lib/concurrency/reentrant-lock-viz.ts`
- `architex/src/lib/concurrency/volatile-viz.ts`
- `architex/src/lib/concurrency/deadlock-prevention-viz.ts`
- `architex/src/components/modules/concurrency/ConcurrentHashMapCanvas.tsx`
- `architex/src/components/modules/concurrency/CASCanvas.tsx`

---

## KEY ARCHITECTURAL PATTERNS TO FOLLOW

Based on the codebase audit, every new feature should follow these established patterns:

1. **Simulation engine pattern:** Pure TypeScript class or functions in `architex/src/lib/{module}/`. Returns an array of `Step` objects for step-through playback. See `MVCCViz`, `BTreeViz`, `ARIESViz` for reference.

2. **Canvas component pattern:** React component in `canvases/` directory. Receives step array and current step index. Renders the visualization. See `BTreeCanvas.tsx`, `MVCCCanvas.tsx`.

3. **Module hook pattern:** `use{Module}Module()` custom hook manages all state. See `useDatabaseModule.ts`. Returns state, handlers, and computed values.

4. **Sidebar pattern:** Lists all modes/demos with difficulty badges and descriptions. See `DatabaseSidebar.tsx`.

5. **Bottom panel pattern:** Tabbed panel with Log, Generated Code, and Learn sections. See `DatabaseBottomPanel.tsx`.

6. **Motion pattern:** Use `motion/react` (not framer-motion). Always check `useReducedMotion()`. See any existing canvas.

7. **Progress tracking:** Use `useProgressStore` for completion tracking. See existing module integrations.

8. **FSRS integration:** For flashcards and spaced repetition, use existing `architex/src/lib/interview/srs.ts` FSRS engine.

9. **AI integration:** Use existing `architex/src/lib/ai/claude-client.ts` with heuristic fallback for offline mode.