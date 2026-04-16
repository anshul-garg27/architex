Good. I now have a thorough picture of the platform structure: 13 modules, 40 system design concepts, 6 OS concepts, algorithm/DS/pattern pages, existing visualization components (RaftVisualizer, ConsistentHashRing, VectorClockDiagram, various gauges and charts), and a canvas with 60+ node types. Here is the full feature catalog.

---

## ARCHITEX WOW FEATURE CATALOG -- 150+ Interactive Visualizations by Topic

---

### MODULE 1: SYSTEM DESIGN

---

**LOAD BALANCING (5 features)**

1. **"The Great Race"**
   - Side-by-side comparison of Round Robin vs Least Connections vs Weighted vs IP Hash under the same traffic stream
   - WOW: Users drag a "traffic firehose" slider and watch requests pile up differently under each algorithm simultaneously. One starves a server while another distributes perfectly. Real-time latency counters diverge dramatically.
   - Effort: M

2. **"Kill Switch"**
   - User clicks a server to kill it mid-traffic and watches the load balancer react (or fail)
   - WOW: The dead server goes red with a skull icon, requests bounce off it, health check pings fail 3 times, then traffic reroutes. Queued requests during failover flash amber. A latency spike graph shows the cost of detection delay in milliseconds.
   - Effort: M

3. **"Hot Spot Heatmap"**
   - Consistent hashing under skewed key distribution shows traffic concentration
   - WOW: A ring visualization where server nodes glow proportional to load. Some servers turn white-hot while others are cold blue. User drags virtual nodes onto the ring and watches heat redistribute in real time. The Gini coefficient updates live.
   - Effort: L

4. **"Sticky Session Trap"**
   - Demonstrates session affinity causing imbalanced load after server restart
   - WOW: Server 3 goes down for maintenance. When it comes back, it is empty while Server 1 and 2 are overloaded. Users see the "stuck" sessions refusing to redistribute. A toggle switches between sticky and stateless to show the difference.
   - Effort: S

5. **"Layer 4 vs Layer 7"**
   - Animated packet inspection showing what each layer can see and decide on
   - WOW: A packet flies through the load balancer. At Layer 4, only IP/port headers light up and the decision is blind. At Layer 7, the HTTP path, cookies, and headers all illuminate, enabling content-based routing. Same traffic, radically different decisions.
   - Effort: M

---

**CACHING (5 features)**

6. **"Cold Start to Hot Cache"**
   - Watch a cache warm up from 0% hit rate to 95% under realistic traffic
   - WOW: Requests arrive as dots. Early dots all fall through to the database (red path, slow). Gradually the cache fills and dots start hitting the cache (green path, fast). A live hit-rate gauge climbs from 0 to 95. The database load graph drops inversely. The first 30 seconds feel painful; the last 30 feel effortless.
   - Effort: M

7. **"Thundering Herd"**
   - A popular cache key expires and 1000 simultaneous requests slam the database
   - WOW: A countdown timer shows TTL ticking to zero on a hot key. The moment it hits 0, a tsunami of request dots floods toward the database. The DB latency line spikes off the chart. Then user toggles "request coalescing" and replays the scenario, one request goes through and the rest wait. Night and day.
   - Effort: M

8. **"LRU Eviction Theatre"**
   - Watch elements get evicted from a fixed-size cache in real time
   - WOW: A visual doubly-linked list where the most recently accessed item glows at the head. As new items enter, the tail item gets physically pushed off the edge and falls away. User can click items to "access" them and watch them jump to the front. The moment an evicted item gets requested again (cache miss), a visible penalty pulse radiates.
   - Effort: S

9. **"Stale Data Disaster"**
   - Cache invalidation fails and users see wrong prices / stale inventory
   - WOW: A split screen showing "what the database says" vs "what users see." The DB updates a product price from $99 to $79 but the cache still serves $99. User after user gets the wrong price. A financial loss counter ticks up. Then toggle write-through vs write-behind vs cache-aside to see how each handles it.
   - Effort: M

10. **"Write Policy Showdown"**
    - Write-through vs write-back vs write-around under the same workload
    - WOW: Three parallel caches processing the same write-heavy traffic. Write-through shows every write going to both cache and DB (slow but safe). Write-back batches DB writes (fast but risky -- user clicks "power failure" and lost writes flash red). Write-around skips cache on writes (cache misses spike on subsequent reads).
    - Effort: M

---

**MESSAGE QUEUES / KAFKA (5 features)**

11. **"Backpressure Valve"**
    - Producer overwhelms consumer; queue depth grows until backpressure kicks in
    - WOW: Messages pile up as physical blocks in a tube. The queue stretches taller and taller. At threshold, the tube turns red and pushes back on the producer (visible slowdown). User controls producer/consumer speed independently. Without backpressure toggled on, the system OOMs and the whole visualization crashes theatrically.
    - Effort: M

12. **"Partition Rebalance Storm"**
    - Adding/removing a Kafka consumer triggers partition reassignment
    - WOW: 6 partitions distributed across 3 consumers shown as color-coded lanes. User clicks "+ Consumer" and watches all consumption STOP (the rebalance pause), partitions shuffle between consumers (animated card dealing), then consumption resumes. The "messages lost during rebalance" counter is the gut punch.
    - Effort: L

13. **"At-Least-Once vs Exactly-Once vs At-Most-Once"**
    - Same message stream processed under three delivery guarantees simultaneously
    - WOW: Three parallel consumers. At-most-once occasionally drops a message (it vanishes). At-least-once shows duplicate messages arriving (the same dot appears twice, counter increments twice). Exactly-once shows clean single delivery but with visible overhead (slower, more coordination arrows). A "processed messages" counter diverges across all three.
    - Effort: M

14. **"Dead Letter Graveyard"**
    - Messages that fail processing repeatedly get routed to a dead letter queue
    - WOW: Messages flow through a processing pipeline. Most succeed (green). Some fail and retry (amber bounce). After N retries, the failed message gets a skull icon and slides into a "graveyard" DLQ panel. User can click a dead message to see its full retry history. An alert fires when the DLQ count exceeds threshold.
    - Effort: S

15. **"Fan-Out Explosion"**
    - A single event triggers N downstream consumers
    - WOW: One message enters a topic. It clones itself into 5, 10, 20 copies fanning out to different consumer groups simultaneously. Each consumer processes at different speeds. The visual is a single dot entering and a starburst of dots radiating outward. Latency varies per consumer, showing the slowest-consumer problem.
    - Effort: S

---

**DATABASE CHOICES -- SQL vs NoSQL (3 features)**

16. **"Schema Straitjacket vs Schema Freedom"**
    - Adding a new field to a SQL table vs a document DB
    - WOW: On the SQL side, an ALTER TABLE runs and every row in a million-row table gets locked/migrated (progress bar, table lock icon, connection pool draining). On the NoSQL side, the new field just appears on the next write. Old documents coexist without it. Shows the real cost of schema migration at scale.
    - Effort: M

17. **"JOIN Waterfall vs Denormalized Read"**
    - A complex query across 5 normalized SQL tables vs one denormalized document read
    - WOW: On the SQL side, the query plan tree shows 5 table scans joining through nested loops. Each join adds latency (visible bar growing). On the NoSQL side, one document read returns everything in a single disk seek. But then the user updates one field and sees the write amplification on the NoSQL side (updating it in 47 documents).
    - Effort: M

18. **"CAP Theorem Playground"**
    - Interactive triangle where user picks two guarantees and sees what breaks
    - WOW: User drags a marker inside the CAP triangle. Moving toward CP makes availability drop (requests timeout). Moving toward AP shows stale reads (data diverges across nodes). Moving toward CA means no partition tolerance (network split kills everything). Real database logos positioned at their actual CAP coordinates.
    - Effort: M

---

**SHARDING & PARTITIONING (4 features)**

19. **"Shard Key Roulette"**
    - Choose different shard keys and watch data distribution change
    - WOW: A dataset of 10,000 user records. User selects "shard by user_id" and sees even distribution across 4 shards. Switches to "shard by country" and one shard (US) turns white-hot while others are nearly empty. Switches to "shard by created_at" and all new writes hammer one shard. Real-time standard deviation meter shows skew.
    - Effort: M

20. **"Range vs Hash Split"**
    - Same data partitioned by range (A-F, G-M, N-S, T-Z) vs hash
    - WOW: Range partitioning shows alphabetical clustering where celebrities cause hotspots in certain ranges. Hash partitioning shows even distribution but range queries now scatter across all shards (query cost counter shoots up). User can toggle between them to see the tradeoff.
    - Effort: M

21. **"Cross-Shard Query Pain"**
    - A query that spans multiple shards shows scatter-gather overhead
    - WOW: A simple "SELECT WHERE age > 25" lights up ALL shards simultaneously. Results stream back at different speeds from each shard. A coordinator node waits for the slowest shard (visible bottleneck). The latency bar shows total time dominated by the tail shard. Compare to a single-shard query that is 10x faster.
    - Effort: M

22. **"Resharding Earthquake"**
    - Adding a new shard triggers massive data migration
    - WOW: 4 shards each holding 25% of data. User clicks "+1 shard" and watches data physically migrate between shards (streams of dots moving). The system stays online but slows down during migration. A progress bar shows "23% resharded" while live traffic competes with migration traffic for bandwidth.
    - Effort: L

---

**REPLICATION (3 features)**

23. **"Leader Goes Down"**
    - Primary replica fails, automatic failover promotes a secondary
    - WOW: Three database nodes in a cluster. The primary (gold crown icon) goes dark. Followers detect the failure (heartbeat timeout counter). An election happens (vote arrows). A new leader is crowned. Writes that arrived during the gap either succeed (if acknowledged) or are lost (red flash). The "lost writes" counter is the key metric.
    - Effort: M

24. **"Replication Lag Drift"**
    - Under write-heavy load, replicas fall behind and serve stale reads
    - WOW: Primary and two replicas shown as timeline bars. The primary advances with every write. Replicas lag behind by increasing amounts. A user reads from a replica and gets data from 3 seconds ago (visible time delta). The lag meter grows. User toggles sync vs async replication to see the consistency/availability tradeoff.
    - Effort: M

25. **"Split Brain Horror"**
    - Network partition causes two nodes to both think they are the leader
    - WOW: A network partition splits the cluster. Both sides elect a leader. Both accept writes. The same key gets written with different values on each side (visible conflict). When the partition heals, the merge conflict is shown with both values side by side. A "conflicting writes" counter shows the damage.
    - Effort: L

---

**CDN (3 features)**

26. **"Edge Cache Cascade"**
    - Request travels from user to edge to regional to origin, hitting/missing at each tier
    - WOW: A world map with actual CDN edge nodes. User clicks a location and a request dot flies to the nearest edge. Cache HIT: instant green response. Cache MISS: dot bounces to regional, then origin. Each hop adds visible latency (growing bar). TTL timers tick down on each edge node independently.
    - Effort: L

27. **"Cache Stampede at the Edge"**
    - Popular content expires across all edge nodes simultaneously
    - WOW: 50 edge nodes worldwide all have the same TTL. When it expires simultaneously, 50 requests slam the origin. The origin's request queue visualization explodes. Toggle "staggered TTL with jitter" and the requests spread out harmlessly.
    - Effort: M

28. **"Geo-Routing Latency Map"**
    - User switches their simulated location and watches latency change
    - WOW: An interactive world map. User drags their location pin from New York to Tokyo. The request path visually re-routes to a different edge node. Latency numbers change in real time. Without CDN: 200ms. With CDN from nearby edge: 15ms. The difference is felt viscerally through a simulated page load comparison.
    - Effort: M

---

**API GATEWAY (3 features)**

29. **"Request Transformation Pipeline"**
    - Watch a request get modified as it flows through gateway middleware
    - WOW: A raw HTTP request enters the gateway. It passes through layers: auth check (JWT validated, green checkmark), rate limit check (counter decrements), request transformation (headers added, body modified), routing (path matched to service). Each layer visibly modifies the request object. The "before" and "after" request diff is shown.
    - Effort: M

30. **"BFF Pattern Comparison"**
    - Same data, three different backends-for-frontends serving mobile, web, IoT
    - WOW: Three client types make the same conceptual request. Mobile BFF aggregates 3 service calls into 1 compact response (saves bandwidth). Web BFF returns richer data with nested objects. IoT BFF strips everything to minimal bytes. Payload size comparison bar chart updates live.
    - Effort: M

31. **"Gateway as Single Point of Failure"**
    - The gateway goes down and everything behind it becomes unreachable
    - WOW: User clicks to kill the gateway. Every service behind it goes dark simultaneously, even though they are all healthy (visible green health indicators behind a red gateway wall). Contrast with a mesh architecture where services communicate directly.
    - Effort: S

---

**RATE LIMITING (3 features)**

32. **"Token Bucket Filling"**
    - Watch tokens replenish and deplete as requests arrive
    - WOW: A literal bucket filling with token coins at a steady rate. Each request grabs a token. Burst traffic drains the bucket fast. When empty, requests bounce off (429 Too Many Requests). The refill rate is adjustable. User can create traffic spikes and watch the bucket absorb bursts up to capacity then reject.
    - Effort: S

33. **"Sliding Window vs Fixed Window"**
    - Same traffic pattern shows different behavior at window boundaries
    - WOW: Fixed window: 100 requests allowed per minute. At 0:59, 100 requests arrive. At 1:01, another 100 arrive. Both windows pass -- 200 requests in 2 seconds. Sliding window catches this. The boundary exploitation is visually obvious as requests cluster at the window edge.
    - Effort: M

34. **"DDoS Wave Defense"**
    - A surge of malicious traffic hits the rate limiter
    - WOW: Normal traffic is green dots at 50 req/s. Suddenly a red wave of 10,000 req/s hits. The rate limiter creates a visible barrier. Legitimate green dots pass through while red dots bounce off. But some legitimate traffic gets caught (false positive indicator). User adjusts the threshold slider and watches the tradeoff between blocking attacks and blocking legitimate users.
    - Effort: M

---

**MICROSERVICES COMMUNICATION (4 features)**

35. **"Sync Chain of Death"**
    - A synchronous call chain where one slow service blocks everything upstream
    - WOW: Service A calls B calls C calls D. Service D takes 5 seconds. User watches the entire chain freeze. Thread pool indicators on each service drain. Timeout cascade triggers and all services return errors. A toggle switches to async messaging where D's slowness is absorbed by a queue.
    - Effort: M

36. **"Distributed Trace Waterfall"**
    - A single user request traced across 7 microservices
    - WOW: A request enters and a trace ID is born. As it propagates across services, a waterfall timeline builds showing exact time spent in each service. The bottleneck service turns red. User can click any span to see the exact function calls within. Branching parallel calls fork visually.
    - Effort: L

37. **"Event Sourcing Replay"**
    - Rebuild system state from an event log by replaying events from scratch
    - WOW: An event log scrolls showing "UserCreated", "OrderPlaced", "PaymentProcessed", etc. User clicks "rebuild state" and watches a blank state progressively fill in as each event replays. Like watching a painting form from brushstrokes. The final state matches the current state perfectly.
    - Effort: M

38. **"Saga vs 2PC Showdown"**
    - A distributed transaction handled two different ways
    - WOW: Same scenario: booking a flight + hotel + car. 2PC shows all services locked during the prepare phase (visible lock icons), then commit. Saga shows compensating transactions when the car booking fails (flight and hotel get reversed). The lock duration comparison bar is dramatic.
    - Effort: L

---

**SERVICE DISCOVERY (2 features)**

39. **"Registry Heartbeat Monitor"**
    - Services register, send heartbeats, and get deregistered on failure
    - WOW: 8 services pulse with heartbeat animations to a central registry. User kills one service. Its heartbeats stop. After the TTL expires, the registry removes it (fade out). Other services querying the registry stop routing to it. A new instance spins up and registers itself (fade in, heartbeat starts).
    - Effort: M

40. **"DNS vs Sidecar Discovery"**
    - Client-side vs server-side service discovery comparison
    - WOW: DNS-based: client queries DNS, gets an IP, caches it. Service moves to a new IP. Client still uses old IP (connection refused). Sidecar-based: a proxy intercepts every request and routes to the current healthy instance. The failure scenario makes the difference visceral.
    - Effort: M

---

**CIRCUIT BREAKER / RETRY / BULKHEAD (4 features)**

41. **"Circuit Breaker State Machine"**
    - Watch a circuit breaker transition through closed, open, half-open states
    - WOW: A literal circuit breaker switch. Requests flow through (closed, green). Failures increment a counter. At threshold, the breaker TRIPS (animated switch flip to open, red). Requests immediately fail-fast (no waiting). After a timeout, it enters half-open (amber, one test request). If it succeeds, the switch flips back to closed. Satisfying mechanical animation.
    - Effort: S

42. **"Retry Storm Amplification"**
    - Failed requests retry, each retry generates more retries, exponential explosion
    - WOW: Service A retries 3 times on failure. Service B (downstream) also retries 3 times. One failure at the bottom generates 3 x 3 x 3 = 27 requests. The visualization shows a tree of retries branching outward. Toggle "exponential backoff with jitter" and the tree thins dramatically.
    - Effort: M

43. **"Bulkhead Isolation"**
    - One failing service exhausts the thread pool and takes down unrelated services
    - WOW: Without bulkhead: 10 thread pool slots shared. Failing service consumes all 10 threads (visible slots filling with red). Healthy services cannot get a thread. With bulkhead: each service gets its own 3-thread pool. Failing service fills its own pool but healthy services keep working. The isolation is visible as separate containers.
    - Effort: M

44. **"Cascading Failure Dominos"**
    - One service failure propagates through the entire system
    - WOW: 12 services in a dependency graph. User kills one leaf service. Its callers start timing out. Their callers start timing out. Failure propagates like dominoes across the graph. Services go red one by one in a wave. Then replay with circuit breakers enabled: the failure is contained to 2 services.
    - Effort: L

---

### MODULE 2: ALGORITHMS

---

**SORTING (5 features)**

45. **"Sorting Grand Prix"**
    - 6 sorting algorithms racing side-by-side on the same dataset
    - WOW: Bar chart arrays for QuickSort, MergeSort, HeapSort, BubbleSort, InsertionSort, RadixSort all start simultaneously. BubbleSort crawls. QuickSort finishes in seconds. The comparison/swap counters diverge wildly. User can pick "nearly sorted" / "reverse sorted" / "random" / "few unique" to see algorithms behave totally differently.
    - Effort: M

46. **"Sound of Sorting"**
    - Each element plays a pitch proportional to its value during sorting
    - WOW: Sorting becomes audible. BubbleSort sounds like a slow ascending scale. QuickSort sounds like chaotic intervals resolving into harmony. MergeSort sounds like musical phrases being assembled. The sorted state is a clean ascending tone. This is synesthetic understanding of algorithmic behavior.
    - Effort: M

47. **"Pivot Disaster"**
    - QuickSort with worst-case pivot selection (already sorted data, first element pivot)
    - WOW: On random data, QuickSort partitions beautifully (even splits). User toggles to sorted data with naive pivot and the partition tree becomes maximally unbalanced -- a straight line instead of a tree. The recursion depth counter shows O(n) vs O(log n). Stack overflow animation when depth exceeds limit. Toggle "median-of-three" to fix it.
    - Effort: S

48. **"Stability Test"**
    - Cards with same value but different colors show whether relative order is preserved
    - WOW: Playing cards with duplicate values (two 7s: one red, one blue). Stable sort (MergeSort) always keeps red-7 before blue-7. Unstable sort (QuickSort) sometimes swaps them. The color flip on equal elements makes stability viscerally obvious. Users finally understand why stability matters.
    - Effort: S

49. **"Real-World Dataset Sort"**
    - Sorting actual data: names, dates, prices, with realistic distributions
    - WOW: Not abstract bars but actual product names being alphabetically sorted, or dates being chronologically ordered. The "nearly sorted" reality of real data makes InsertionSort suddenly look brilliant. Timsort's hybrid approach visibly detects and exploits existing runs.
    - Effort: M

---

**GRAPH ALGORITHMS (5 features)**

50. **"Maze Runner"**
    - BFS vs DFS solving the same maze simultaneously
    - WOW: A generated maze. BFS explores level-by-level (wavefront of blue). DFS dives deep down corridors (single green thread). BFS finds the shortest path but explores more cells. DFS finds A path but it is often longer. The explored-cell count and path-length comparison is shown live.
    - Effort: M

51. **"Real Map Pathfinding"**
    - Dijkstra / A-star on an actual city grid finding the shortest route
    - WOW: A stylized city map with intersections as nodes. User picks start and end. Dijkstra explores in all directions (expanding circle). A-star explores toward the goal (directed cone). The explored-node comparison shows A-star's efficiency. Both find the same optimal path but A-star visits 60% fewer nodes.
    - Effort: L

52. **"Social Network Degrees"**
    - BFS from a person showing 1st, 2nd, 3rd degree connections expanding outward
    - WOW: Click a person node. First-degree connections light up (direct friends). Then second-degree (friends of friends, much larger ring). Then third-degree (massive explosion). The "six degrees" concept becomes visual as the reachable set grows exponentially at each hop.
    - Effort: M

53. **"Cycle Detection Trap"**
    - A directed graph that contains a cycle, with DFS detecting it
    - WOW: DFS traverses the graph, coloring nodes white (unvisited), gray (in-progress), black (complete). When it encounters a gray node again (back edge), a red cycle highlight traces the loop. The algorithm freezes at the moment of detection with an alarm pulse. Toggle "topological sort" to show it is impossible on cyclic graphs.
    - Effort: S

54. **"Minimum Spanning Tree Growth"**
    - Kruskal's or Prim's building a spanning tree edge by edge
    - WOW: All edges shown as faint gray with weights. Edges light up in green one by one in weight order (Kruskal) or from a growing frontier (Prim). Edges that would create a cycle flash red and get rejected. The total weight counter increments. The final tree is the cheapest way to connect everything.
    - Effort: M

---

**DYNAMIC PROGRAMMING (4 features)**

55. **"Recursion Tree Explosion"**
    - Naive recursive Fibonacci shows exponential call tree blowing up
    - WOW: Computing fib(8) without memoization. The recursion tree starts small (fib(8) -> fib(7) + fib(6)). Then it branches and branches. fib(3) gets computed 21 times (each duplicate highlighted in red). The tree fills the screen. Total calls counter hits 67. Then toggle memoization: the tree collapses to a linear chain. 67 calls become 8.
    - Effort: M

56. **"DP Table Filling"**
    - Watch a 2D DP table fill cell by cell with arrow traces showing dependencies
    - WOW: Longest Common Subsequence on two strings. A 2D grid fills cell by cell. Each cell shows which previous cells it depends on (arrows). The optimal path traces back through the table highlighting the LCS. User can change the input strings and watch the table rebuild. The arrow pattern reveals the problem structure.
    - Effort: M

57. **"Knapsack Packing"**
    - Items with weights and values being optimally packed into a knapsack
    - WOW: Physical items with sizes and dollar values. A knapsack with finite capacity. The DP table fills showing the optimal value at each capacity. Then the backtrack highlights which items were selected. A side panel shows the items physically fitting (or not) into the knapsack. Greedy comparison shows a suboptimal solution.
    - Effort: M

58. **"Memoization Cache Hits"**
    - Visualize which subproblems hit the cache vs compute fresh
    - WOW: A memoization table shown as a grid. First computation of a subproblem shows a full calculation animation (slow, sparks). Second access shows an instant cache hit (green flash, fast). The hit/miss ratio counter climbs as the algorithm progresses. The speedup from memoization is shown as a time-saved bar growing.
    - Effort: S

---

**BINARY SEARCH (3 features)**

59. **"The Halving"**
    - Binary search visually eliminating half the array each step
    - WOW: 1000 elements. First comparison eliminates 500 (they fade and physically shrink away). Second eliminates 250. Third eliminates 125. In 10 steps, 1 element remains. The dramatic visual of the search space collapsing from 1000 to 1 makes O(log n) visceral. A linear search counter runs alongside showing it checking element by element.
    - Effort: S

60. **"Search on the Answer Space"**
    - Binary search applied not to an array but to a range of possible answers (e.g., finding the square root)
    - WOW: A number line from 0 to 100. Binary search narrows the range to find sqrt(50). The window shrinks: 0-100, 0-50, 25-50, 25-37, 31-37... Each step shows "too low" or "too high" with the midpoint tested. The answer converges to 7.07. This reveals binary search as a general technique, not just an array search.
    - Effort: S

61. **"Off-By-One Graveyard"**
    - Common binary search bugs visualized as they cause infinite loops or miss the target
    - WOW: Three implementations side by side. The correct one converges. The one with `mid = (low + high) / 2` on even-length arrays gets stuck in an infinite loop (loop counter spins). The one with `low <= high` vs `low < high` misses the last element. Each bug is highlighted in the code while the visualization shows the consequence.
    - Effort: S

---

**BACKTRACKING (3 features)**

62. **"N-Queens Battle"**
    - Watch queens placed and removed from a chessboard as backtracking explores solutions
    - WOW: An 8x8 chessboard. Queens placed one column at a time. Attack lines radiate from each queen (diagonal, row, column). When a conflict is found, the queen gets removed (backtrack animation) and the next row is tried. Partial solutions form and dissolve. The moment a full solution is found, all 8 queens glow gold simultaneously. Counter shows how many backtracks occurred.
    - Effort: M

63. **"Sudoku Solver Live"**
    - Watch a Sudoku puzzle solve itself cell by cell with backtracking
    - WOW: A Sudoku grid with given numbers in bold. The algorithm tries digits 1-9 in each empty cell. Valid placements appear in blue. When a conflict arises, the cell turns red and the digit is erased (backtrack). Multiple levels of backtracking are visible as a cascade of erasures. The solved board fills in with a satisfying wave.
    - Effort: M

64. **"Pruning Power"**
    - Same problem with and without pruning, showing the search tree difference
    - WOW: Left side: brute force explores the full tree (massive, slow). Right side: with pruning, entire subtrees get slashed (red X, dramatic branch cut). The node-count comparison is orders of magnitude different. The pruned tree is sparse and elegant while the unpruned tree is a tangled mess.
    - Effort: M

---

### MODULE 3: DATA STRUCTURES

---

**BST / AVL / RED-BLACK TREES (4 features)**

65. **"Degeneration Horror"**
    - Inserting sorted data into a BST creates a linked list
    - WOW: Insert 1, 2, 3, 4, 5, 6, 7 into a BST. The tree degenerates into a straight line leaning right. Height counter shows O(n). Search for element 7 traverses every node. Then replay with AVL: rotations fire after each insertion, keeping the tree balanced. Height stays O(log n). The visual contrast between a stick and a bushy tree is immediate.
    - Effort: M

66. **"Rotation Choreography"**
    - AVL/Red-Black tree rotations animated step by step
    - WOW: An insertion triggers an imbalance. The balance factor at the unbalanced node turns red. Then the rotation begins: nodes physically swing around each other (left rotation, right rotation, or double rotation). Parent-child pointers re-link with visible animated arrows. The tree rebalances and balance factors return to green. Slow-motion replay available.
    - Effort: M

67. **"Tree Tournament"**
    - BST vs AVL vs Red-Black inserting/searching the same sequence
    - WOW: Three trees side by side processing the same operations. BST occasionally degenerates. AVL stays perfectly balanced but does more rotations (rotation counter higher). Red-Black is "good enough" balanced with fewer rotations. A combined height/rotation/operation-cost dashboard shows the tradeoffs quantitatively.
    - Effort: L

68. **"Delete & Restructure"**
    - Deleting a node with two children shows successor replacement and rebalancing
    - WOW: User clicks a node to delete it. The algorithm finds the in-order successor (highlighted with a dotted arrow path). The successor's value replaces the deleted node. The successor's original position is removed. Rebalancing rotations fire if needed. The entire sequence plays in slow motion with narration.
    - Effort: M

---

**HASH TABLE (4 features)**

69. **"Collision Chain Growth"**
    - Watch a hash table's chains grow as load factor increases
    - WOW: A hash table with 8 buckets. Keys insert and hash to buckets. Initially, mostly one per bucket. As more keys enter, chains grow (linked list nodes extending downward). At load factor 0.75, some chains are 4-5 deep. Search time degrades from O(1) to O(n) on the longest chain. A lookup on the worst chain visibly traverses every node.
    - Effort: S

70. **"Resize & Rehash Earthquake"**
    - Hash table doubles in size, every element gets rehashed
    - WOW: Table at load factor 0.75 triggers resize. The table visually doubles (8 buckets become 16). Every existing element lifts off, gets re-hashed (hash function recomputed visually), and lands in a new bucket. Some elements stay in the same bucket, others move. The redistribution animation takes 2-3 seconds and shows why resizing is O(n).
    - Effort: M

71. **"Bloom Filter False Positive"**
    - Probabilistic membership test showing guaranteed no false negatives but occasional false positives
    - WOW: A bit array of 20 bits. Insert "cat" -- 3 hash functions set bits 2, 7, 14. Insert "dog" -- bits 4, 7, 19. Query "fish" -- bits 2, 4, 14 are all set (by cat and dog coincidentally). "PROBABLY IN SET" -- but it was never inserted. A false positive rate gauge shows the probability increasing with each insertion.
    - Effort: M

72. **"Open Addressing Probe Dance"**
    - Linear probing, quadratic probing, and double hashing on collision
    - WOW: Three tables side by side. A collision occurs. Linear probing walks forward one slot at a time (clustering visible as elements bunch up). Quadratic probing jumps 1, 4, 9, 16 slots (spread out). Double hashing uses a second hash to determine the jump (best distribution). The cluster visualization makes the performance difference intuitive.
    - Effort: M

---

**HEAP (3 features)**

73. **"Heapify in Reverse"**
    - Build a max-heap from an unsorted array using bottom-up heapify
    - WOW: An array of random numbers displayed both as a flat array and as a binary tree. Heapify starts from the last non-leaf node, bubbling down. Swaps are animated (nodes physically swap positions in the tree with the array updating simultaneously). The array-to-tree dual representation makes the relationship click.
    - Effort: M

74. **"Priority Queue Hospital"**
    - Patients arrive with different priorities; higher priority gets served first regardless of arrival
    - WOW: A hospital waiting room. Patients arrive with severity levels (critical=red, urgent=amber, minor=green). They enter the heap and bubble up based on priority. The next patient served is always the root (highest priority). A minor patient who arrived first watches critical patients skip ahead. The heap invariant is the "why."
    - Effort: M

75. **"Heap Sort vs Quick Sort"**
    - Both algorithms racing on the same array
    - WOW: Side by side, same input. HeapSort builds the heap first (visible overhead) then extracts max repeatedly. QuickSort partitions recursively. QuickSort usually wins on random data but HeapSort has guaranteed O(n log n) worst case. Toggle to adversarial input where QuickSort degrades and HeapSort stays consistent.
    - Effort: M

---

**TRIE (3 features)**

76. **"Autocomplete Live"**
    - Type letters and watch the trie narrow to matching completions in real time
    - WOW: A trie loaded with a dictionary. User types "pro" and the path through p->r->o highlights. All subtree leaves ("program", "process", "product", "promise") light up as suggestions. Each additional keystroke prunes more branches. Backspace re-expands them. The speed is instantaneous because trie lookup is O(key length), not O(n).
    - Effort: M

77. **"Prefix Matching Heatmap"**
    - Common prefixes glow brighter showing shared structure
    - WOW: Insert words "programming", "program", "progress", "process", "pro". The shared prefix "pro" glows intensely (3 layers of sharing). "progr" is shared by 3 words (slightly dimmer). The trie reveals that English words share massive prefix structure. Storage savings counter shows trie vs storing each word independently.
    - Effort: S

78. **"Spell Checker"**
    - Type a misspelled word, watch the trie search for close matches using edit distance
    - WOW: User types "programing" (missing an m). The trie search explores nearby branches within edit distance 1. Candidate corrections ("programming", "programing") appear as the search fans out from the closest matching prefix. The Levenshtein distance to each candidate is shown. The trie structure makes this fast.
    - Effort: L

---

**GRAPH (2 features)**

79. **"Adjacency Matrix vs Adjacency List"**
    - Same graph shown in both representations, highlighting space/time tradeoffs
    - WOW: A graph with 10 nodes and 15 edges. The adjacency matrix is 10x10 with most cells empty (sparse graph, wasted space highlighted in gray). The adjacency list shows only existing edges (compact). User adds an edge and watches both representations update. The "is there an edge from A to B?" query shows O(1) matrix lookup vs O(degree) list scan.
    - Effort: S

80. **"BFS Wavefront"**
    - BFS expanding from a source node showing level-by-level discovery
    - WOW: A large random graph. BFS starts from one node. Level 0 (the source) lights up blue. Then all level-1 neighbors light up simultaneously (first wave). Then level-2 (second wave). Each wave is a different shade, creating concentric ripples through the graph. The wavefront expands like a sonar ping.
    - Effort: S

---

### MODULE 4: DATABASE

---

**INDEXING (4 features)**

81. **"B-Tree Descent"**
    - Search a key by descending through B-Tree levels, showing which pages are loaded
    - WOW: A 3-level B-Tree. Searching for key 42. The root node loads (1 disk read). Keys are compared and the correct child pointer is followed (animated arrow down). Second level loads (2nd disk read). Third level found (3rd disk read). Only 3 disk reads for millions of records. Without an index: full table scan animation shows sequential reads of every page.
    - Effort: M

82. **"Composite Index Column Order"**
    - Shows why (A, B) index helps `WHERE A=1 AND B=2` but not `WHERE B=2`
    - WOW: A phone book metaphor. Sorted by (LastName, FirstName). Finding "Smith, John" is fast (binary search on LastName, then FirstName within Smiths). Finding anyone named "John" regardless of last name requires scanning the entire book. The visualization shows the sorted order and which queries can exploit it.
    - Effort: M

83. **"Covering Index Speedup"**
    - A query that can be answered entirely from the index without touching the table
    - WOW: Query: SELECT name, email WHERE department='Engineering'. Without covering index: index lookup finds row IDs, then "bookmark lookup" goes to the table for each row (visible back-and-forth arrows). With covering index (department, name, email): all data is in the index leaf nodes. Zero table access. The eliminated round trips show the speedup.
    - Effort: M

84. **"Index Write Penalty"**
    - Every INSERT now updates N indexes, showing the write amplification
    - WOW: A table with 5 indexes. A single INSERT arrives. The row gets written to the table (1 write). Then each of the 5 indexes gets updated (5 more writes, animated sequentially). The write amplification is 6x. A "writes per second" gauge shows throughput halving as indexes are added one by one. The read vs write tradeoff becomes quantified.
    - Effort: S

---

**TRANSACTIONS (4 features)**

85. **"Isolation Level Theatre"**
    - Four isolation levels side by side showing what anomalies each allows
    - WOW: Same scenario (two concurrent transactions reading/writing the same row) played under Read Uncommitted, Read Committed, Repeatable Read, Serializable. Dirty reads happen under Read Uncommitted (transaction sees uncommitted data). Non-repeatable reads under Read Committed. Phantom reads under Repeatable Read. Serializable blocks everything. Anomaly labels flash when they occur.
    - Effort: L

86. **"Dirty Read Caught"**
    - Transaction A reads data that Transaction B has written but not committed, then B rolls back
    - WOW: Transaction B writes price=$50 (uncommitted). Transaction A reads price=$50 and acts on it. Transaction B ROLLBACK. The price reverts to $100. Transaction A made a decision based on data that never existed. The "phantom price" flashes and fades, leaving A holding a wrong result.
    - Effort: M

87. **"Deadlock Detection Ring"**
    - Two (or more) transactions waiting on each other's locks form a cycle
    - WOW: Transaction A holds lock on Row 1, wants lock on Row 2. Transaction B holds lock on Row 2, wants lock on Row 1. Visible wait-for arrows form a cycle. The cycle detection algorithm runs, identifies the deadlock, and chooses a victim (one transaction gets rolled back with a dramatic "VICTIM" stamp). Lock arrows release.
    - Effort: M

88. **"MVCC Time Travel"**
    - Multiple versions of the same row existing simultaneously for different transactions
    - WOW: A row has versions V1, V2, V3 stacked like a timeline. Transaction started at time T2 sees version V2 (snapshot isolation). A newer transaction sees V3. Both are reading the same row but seeing different values. The version chain is visible as a stack of colored layers. Garbage collection eventually removes old versions.
    - Effort: M

---

**QUERY OPTIMIZATION (3 features)**

89. **"EXPLAIN ANALYZE Tree"**
    - A query plan visualized as a tree showing costs and actual row counts at each node
    - WOW: A SQL query becomes a visual execution tree. Sequential Scan (expensive, red). Hash Join (medium, amber). Index Scan (cheap, green). Each node shows estimated vs actual rows. A node where estimates are wildly wrong (1000 estimated, 1M actual) pulses red -- a bad statistics problem. The tree highlights the bottleneck path.
    - Effort: M

90. **"Before and After Index"**
    - Same query, same data, with and without an index
    - WOW: Left: Sequential scan reading every row (progress bar crawling, 500ms). Right: Index scan jumping directly to matching rows (near instant, 2ms). The row-access visualization shows the sequential scan touching every page while the index scan touches only 3 pages. Speedup: 250x. The "add index" button is the satisfying moment.
    - Effort: M

91. **"Join Algorithm Showdown"**
    - Nested Loop vs Hash Join vs Merge Join on the same query
    - WOW: Three animations. Nested Loop: for each row in A, scan all rows in B (O(n*m), slow pulsing). Hash Join: build hash table on B, probe with each row of A (two phases visible). Merge Join: both tables sorted, single pass merge (elegant synchronized scan). Row comparison counters show orders-of-magnitude differences.
    - Effort: L

---

**REPLICATION (DATABASE-LEVEL) (2 features)**

92. **"Sync vs Async Commit"**
    - Write acknowledged before vs after reaching replicas
    - WOW: A write arrives. Synchronous: leader writes, waits for 2 replicas to confirm (visible round-trip arrows), THEN acknowledges to client. Slow but safe. Asynchronous: leader writes, immediately acknowledges, replicas catch up later. Fast but a power failure before replication = lost data. A "kill leader" button after async write shows the data loss.
    - Effort: M

93. **"Multi-Master Conflict"**
    - Two masters accept conflicting writes on the same key
    - WOW: Master-East sets `name = "Alice"`. Master-West simultaneously sets `name = "Bob"`. When they replicate to each other, both see a conflict. The conflict resolution strategy fires: last-write-wins (one value disappears), merge (concatenate? absurd result), or custom resolver. The "wrong" resolution makes the problem tangible.
    - Effort: M

---

**LSM TREE (3 features)**

94. **"Memtable Flush"**
    - Watch a memtable fill up in memory, then flush to disk as an SSTable
    - WOW: Writes arrive and fill a red-black tree in memory (the memtable). Entries sort themselves on insert. When the memtable reaches threshold (visible fill gauge), it freezes and flushes to disk as a sorted SSTable file. A new empty memtable takes over. The freeze-and-flush moment is the key transition.
    - Effort: M

95. **"Compaction Levels"**
    - SSTables at different levels being compacted and merged
    - WOW: Level 0: multiple overlapping SSTables. Level 1: non-overlapping, merged. Compaction picks files from L0 and L1, merges them (sorted merge animation), and writes to L1. Duplicate keys get resolved (newer version wins, old version physically discarded). The "write amplification" counter shows data being rewritten multiple times.
    - Effort: L

96. **"Read Path: Bloom + Index + Data"**
    - A read query checking bloom filter, then sparse index, then data block
    - WOW: A read for key "K". First, bloom filters on each SSTable are checked (fast hash computation, most return "definitely not here"). One returns "maybe." The sparse index narrows the search to a specific data block. The data block is loaded and searched. The multi-step narrowing from millions of keys to one data block is shown as a funnel.
    - Effort: M

---

### MODULE 5: DISTRIBUTED SYSTEMS

---

**RAFT CONSENSUS (4 features)**

97. **"Election Night"**
    - A Raft leader election triggered by leader timeout
    - WOW: 5 nodes in a pentagon. The leader stops sending heartbeats (flatline). A follower's election timeout fires (countdown at zero). It becomes a candidate, increments its term, votes for itself, and sends RequestVote RPCs (animated arrows). Votes come back (checkmark arrows). Majority achieved: new leader crowned (gold animation). Term number increments.
    - Effort: M (partially built in RaftVisualizer.tsx)

98. **"Log Replication Pipeline"**
    - Leader replicates a log entry to followers and commits when majority confirms
    - WOW: Client sends a write to the leader. Leader appends to its log (visible entry), sends AppendEntries to all followers (animated arrows). Followers append and respond. When 3/5 respond (majority, checkmarks accumulate), the leader commits (entry turns green). Followers learn of the commit on next heartbeat. The uncommitted-to-committed transition is the safety moment.
    - Effort: M

99. **"Network Partition Brain Split"**
    - A network partition splits the cluster, showing which side can still accept writes
    - WOW: A red dashed line splits 5 nodes into {3} and {2}. The side with 3 nodes (majority) can still elect a leader and accept writes. The side with 2 nodes cannot reach quorum; client requests timeout. When the partition heals, the minority side catches up from the majority's log. Lost writes from the minority side (if any were accepted) get overwritten.
    - Effort: L (partition visualization partially built)

100. **"Safety Proof Walkthrough"**
     - Step through why Raft guarantees only one leader per term
     - WOW: A scenario where two candidates run simultaneously. Candidate A gets votes from nodes 1 and 2. Candidate B gets votes from nodes 3 and 4. Node 5 is the tiebreaker. Because each node votes only once per term (highlighted rule), only one can win. If neither gets majority, a new term starts with randomized timeouts. The impossibility of dual leadership is proven step by step.
     - Effort: M

---

**CRDTs (3 features)**

101. **"Convergence Dance"**
     - Two replicas diverge, then converge to the same state without coordination
     - WOW: Two counters, both starting at 0. Replica A increments to 3. Replica B increments to 5. They are disconnected (values differ). When they reconnect, the G-Counter merge takes the max of each node's count and both converge to 8 (3+5). No conflicts, no coordination. The merge animation shows the mathematical guarantee.
     - Effort: M

102. **"Collaborative Text Editing"**
     - Two users editing the same document simultaneously with CRDT-based resolution
     - WOW: User A types "Hello" at position 0. User B simultaneously types "World" at position 0. Without CRDT: conflict, one write lost. With CRDT (RGA or Yjs-style): both edits are merged deterministically. Characters interleave based on unique IDs and timestamps. The document converges to the same state on both replicas without a central server.
     - Effort: L

103. **"OR-Set: Add Wins"**
     - Demonstrating add-remove semantics in an observed-remove set
     - WOW: Replica A adds "apple." Replica B concurrently removes "apple" (using an old tag). When they merge, the add wins because it has a newer unique tag. Contrast with a naive set where remove wins and the item vanishes despite being re-added. The tag-based mechanism is shown as physical tokens attached to each element.
     - Effort: M

---

**VECTOR CLOCKS (3 features)**

104. **"Happens-Before Chain"**
     - Events on multiple nodes with vector clock arrows showing causal ordering
     - WOW: 3 nodes with timeline rows. Events happen. Messages pass between nodes (arrows). Vector clocks update at each event. When comparing two events, the visualization highlights whether A happened-before B (all components less or equal) or they are concurrent (incomparable). The partial order becomes visible as a directed graph of causality.
     - Effort: M (partially built in VectorClockDiagram.tsx)

105. **"Concurrent Event Detection"**
     - Two events that are causally independent (neither happened before the other)
     - WOW: Node A and Node B both perform events without communicating. Their vector clocks are [2,0,0] and [0,0,3]. Neither dominates the other. The visualization shows them at the same "level" with no causal arrow connecting them. This is true concurrency. A conflict detection alert fires showing these events may conflict.
     - Effort: S

106. **"Clock Size Explosion"**
     - Vector clock size grows with number of nodes, showing scalability problem
     - WOW: Start with 3 nodes: vector clocks have 3 entries. Add nodes one by one. At 10 nodes, every message carries a 10-entry vector. At 100 nodes, the vector is 100 entries (visible bloat). Storage and bandwidth costs climb. This motivates the transition to Dynamo-style dotted version vectors or interval tree clocks.
     - Effort: S

---

**CONSISTENT HASHING (3 features)**

107. **"Virtual Node Smoothing"**
     - Adding virtual nodes to a hash ring smooths out load distribution
     - WOW: A ring with 3 physical nodes. Keys cluster unevenly (one node handles 50% of keys). Add 50 virtual nodes per physical node: the ring fills with interleaved virtual nodes. Key distribution flattens dramatically. A standard deviation gauge drops from 0.4 to 0.02. The visual transformation from lumpy to smooth is satisfying.
     - Effort: M (partially built in ConsistentHashRingVisualizer.tsx)

108. **"Node Failure: Minimal Disruption"**
     - A node leaves and only its keys get redistributed (not all keys)
     - WOW: 5 nodes on a ring, each owning a segment. Node C is removed. Only C's keys move to the next node clockwise. All other key-to-node assignments remain unchanged. A disruption percentage shows "20% of keys moved" vs naive hashing where "80% of keys move." The minimal-disruption guarantee is the selling point.
     - Effort: M

109. **"Hot Key on the Ring"**
     - A single extremely popular key creates a hotspot on one node
     - WOW: One key (e.g., a celebrity's profile) gets 50% of all traffic. The node responsible for that key turns red-hot while others are cold. Virtual nodes do NOT help here (same key always maps to the same nodes). The solution -- read replicas or key-level caching -- is shown as an escape hatch.
     - Effort: S

---

**GOSSIP PROTOCOL (3 features)**

110. **"Viral Information Spread"**
     - One node learns a fact and watch it propagate through the cluster
     - WOW: 20 nodes in a random mesh. Node 1 learns "server X is down" (turns orange). Each tick, each orange node tells a random neighbor. The information spreads exponentially: 1, 2, 4, 8, 16... In O(log N) rounds, all nodes know. The spreading pattern looks like a virus simulation. A "rounds to full convergence" counter shows the efficiency.
     - Effort: M

111. **"Convergence Speed vs Bandwidth"**
     - Adjusting gossip fanout and frequency, showing the tradeoff
     - WOW: Fanout=1: information spreads slowly (many rounds). Fanout=3: much faster but 3x network messages per round. Fanout=N: instant convergence but N messages per node per round (bandwidth explosion). Sliders control fanout and interval. A bandwidth meter and convergence time counter show the engineering tradeoff.
     - Effort: M

112. **"Failure Detection via Gossip"**
     - A node fails and gossip gradually marks it as suspected, then confirmed dead
     - WOW: All nodes gossip heartbeat timestamps. Node 7 dies. Nearby nodes notice its timestamp going stale. Suspicion spreads through gossip (amber nodes that suspect Node 7 is dead). After enough suspectors agree, Node 7 is declared dead (red). The detection latency (time from failure to declaration) depends on gossip interval.
     - Effort: M

---

### MODULE 6: NETWORKING

---

**TCP (4 features)**

113. **"Three-Way Handshake"**
     - SYN, SYN-ACK, ACK animated between client and server with sequence numbers
     - WOW: Client sends SYN with seq=100 (animated packet arrow). Server responds SYN-ACK with seq=300, ack=101 (return arrow). Client sends ACK with ack=301 (final arrow). Connection established (green indicator). Each packet shows its headers. The sequence numbers increment logically. A "what if SYN is lost?" toggle shows the retry and timeout.
     - Effort: S

114. **"Congestion Window Sawtooth"**
     - TCP congestion control showing slow start, congestion avoidance, fast retransmit
     - WOW: A live graph of congestion window size over time. Slow start: exponential growth (window doubles each RTT). At ssthresh: switches to linear growth (congestion avoidance). Packet loss detected: window crashes to half (the sawtooth drop). The pattern repeats. Toggle between Reno, Cubic, and BBR to see different sawtooth shapes.
     - Effort: M

115. **"Sliding Window Flow Control"**
     - Sender transmits packets within the window; receiver advertises available buffer
     - WOW: A row of numbered packets. A green window highlights which packets can be sent. As ACKs return, the window slides forward. If the receiver's buffer fills, the window shrinks (receiver advertises smaller window). Packets outside the window cannot be sent (grayed out, blocked). A "fill receiver buffer" button demonstrates zero-window probing.
     - Effort: M

116. **"Head-of-Line Blocking"**
     - A lost packet blocks all subsequent packets from being delivered to the application
     - WOW: Packets 1-10 arrive. Packet 3 is lost. Packets 4-10 are buffered (visible in a waiting area) but cannot be delivered to the app until packet 3 is retransmitted and arrives. The application sees a stall. This is why QUIC/HTTP3 moved to stream-level ordering. Toggle to QUIC mode where only stream 3 is blocked while other streams proceed.
     - Effort: M

---

**TLS (3 features)**

117. **"TLS 1.2 vs 1.3 Handshake Race"**
     - Side-by-side handshakes showing 1.3's reduced round trips
     - WOW: TLS 1.2: ClientHello, ServerHello, Certificate, KeyExchange, ChangeCipherSpec, Finished (2 round trips). TLS 1.3: ClientHello with key share, ServerHello with key share, encrypted data begins (1 round trip). Both run simultaneously. The 1.3 side starts sending encrypted data while 1.2 is still negotiating. The RTT savings are shown in a timer.
     - Effort: M

118. **"Certificate Chain Verification"**
     - Following the chain from server cert to intermediate to root CA
     - WOW: Server presents its certificate. The browser checks the signature against the intermediate CA's public key (arrow up). Then checks the intermediate against the root CA (arrow up). Root CA is in the trust store (green checkmark). Each verification step shows the cryptographic operation. A "what if the intermediate is revoked?" toggle shows the chain breaking.
     - Effort: M

119. **"0-RTT Resumption Attack"**
     - TLS 1.3 0-RTT data showing replay vulnerability
     - WOW: A returning client sends 0-RTT data (request included in the first message, no waiting). The server responds immediately (ultra fast). But an attacker captures and replays the 0-RTT data. The server processes the same request twice (duplicate payment). This is why 0-RTT is only safe for idempotent requests. The replay animation makes the vulnerability obvious.
     - Effort: M

---

**DNS (3 features)**

120. **"Recursive Resolution Hop by Hop"**
     - A DNS query traveling from client to recursive resolver to root to TLD to authoritative
     - WOW: Query "architex.dev". Step 1: client to recursive resolver. Step 2: resolver to root server (gets referral to .dev TLD). Step 3: resolver to .dev TLD (gets referral to architex.dev nameserver). Step 4: resolver to authoritative nameserver (gets the IP). Each hop is a visible arrow on a hierarchy diagram. 4 network hops for one URL.
     - Effort: M

121. **"DNS Cache Poisoning"**
     - An attacker races to inject a false DNS response before the real one arrives
     - WOW: Resolver sends a query. The real nameserver prepares a response. An attacker floods fake responses with guessed transaction IDs. If a fake response arrives first with the right ID, the resolver caches the attacker's IP. All subsequent clients get sent to the attacker's server. The race condition visualization shows packets competing.
     - Effort: M

122. **"TTL & Cache Layer Hierarchy"**
     - DNS cache at browser, OS, resolver, and authoritative levels with different TTLs
     - WOW: Four cache layers shown as stacked boxes. First query: all cache miss (falls through all layers to authoritative). Second query: hits the resolver cache (doesn't even leave the ISP). After TTL expires at resolver but not at OS cache: OS cache still returns the old IP. Staleness propagates through layers at different rates.
     - Effort: M

---

**HTTP (3 features)**

123. **"HTTP/1.1 vs 2 vs 3 Multiplexing"**
     - Same page load under three protocol versions showing parallel request handling
     - WOW: Loading a page with 20 resources. HTTP/1.1: 6 connections, each handling one request at a time (visible queueing). HTTP/2: one connection, all 20 requests multiplexed (interleaved frames). HTTP/3: same multiplexing but over QUIC, no head-of-line blocking. A page load timeline waterfall shows the dramatic time differences.
     - Effort: L

124. **"Request Waterfall"**
     - A real page load showing the cascade of dependent requests
     - WOW: HTML loads first. Parser discovers CSS and JS links (new requests fire). CSS loads, discovers font and image URLs (more requests). JS loads, makes API calls (even more). The waterfall builds showing critical path dependencies. User can toggle "preload hints" and "HTTP/2 server push" to see the waterfall compress.
     - Effort: M

125. **"HTTP/2 Stream Priority"**
     - CSS gets higher priority than images, showing how browsers optimize loading
     - WOW: 10 resources requested simultaneously. Without priority: all get equal bandwidth (images load while CSS is still incomplete, page renders ugly). With priority: CSS and JS get full bandwidth first (page renders correctly sooner), then images stream in. The "first meaningful paint" timestamp shows the user-visible difference.
     - Effort: M

---

### MODULE 7: OS CONCEPTS

---

**CPU SCHEDULING (4 features)**

126. **"Scheduler Showdown"**
     - FCFS vs Round Robin vs MLFQ vs SJF processing the same process set
     - WOW: 6 processes with varied CPU burst lengths. Four Gantt charts fill simultaneously. FCFS: long process blocks short ones (convoy effect visible). RR: fair but context switch overhead (switch count ticking up). SJF: optimal average wait but starves long processes. MLFQ: adapts by demoting CPU-bound processes. Average wait time, turnaround, and response time dashboards update live.
     - Effort: M

127. **"Starvation Demo"**
     - A low-priority process never gets CPU time because high-priority processes keep arriving
     - WOW: A priority queue scheduler. Process "LowPri" arrives at time 0. High-priority processes keep arriving every 2ms. LowPri watches from the queue as every new arrival gets served before it. A "waiting time" counter for LowPri climbs to absurd numbers (10,000ms). Toggle "aging" and watch LowPri's priority gradually increase until it finally runs.
     - Effort: S

128. **"Context Switch Cost"**
     - Visualize what happens during a context switch (save registers, flush TLB, load new state)
     - WOW: CPU is running Process A. Timer interrupt fires. Registers saved (visible register file snapshot). PCB updated. TLB flushed (entries fade out). Process B's state loaded (new register values appear). Process B resumes. The dead time during the switch (no useful work) is highlighted. A "switches per second" slider shows how overhead compounds with smaller time quanta.
     - Effort: M

129. **"Preemption in Action"**
     - A high-priority process arrives and immediately interrupts the running process
     - WOW: A medium-priority process is running on the CPU. A high-priority process arrives (alarm animation). The running process is immediately yanked off the CPU (save state), and the high-priority process takes over. When it finishes, the original process resumes where it left off. The interruption is jarring and immediate.
     - Effort: S

---

**MEMORY (4 features)**

130. **"Page Fault Drama"**
     - A memory access triggers a page fault, page is loaded from disk
     - WOW: A process accesses address 0x7FA3. Page table lookup: the present bit is 0 (page not in RAM). PAGE FAULT fires (alarm). The OS searches the page table for the disk location. A page is loaded from disk (slow animation, spinning disk icon). The page table is updated. The instruction re-executes. Total cost: millions of cycles. The disk access animation makes the latency visceral.
     - Effort: M

131. **"TLB Lookup Fast Path"**
     - Address translation hitting the TLB cache vs walking the page table
     - WOW: A virtual address enters the TLB. TLB HIT: physical address returned instantly (1 cycle, green flash). TLB MISS: walk the 4-level page table (4 memory accesses, each adding latency). The speedup from TLB hit is 100x visible on a latency bar. Toggle "large pages" to show higher TLB hit rates (fewer entries needed for same coverage).
     - Effort: M

132. **"Virtual to Physical Translation"**
     - Step through splitting a virtual address into VPN + offset and looking up the PFN
     - WOW: A 64-bit virtual address displayed as binary. The bits split into VPN (page number) and offset. The VPN indexes into the page table. The page table entry contains the PFN (physical frame number). PFN + offset = physical address. Each step is animated with bit fields highlighted in different colors. The address transformation is demystified.
     - Effort: M

133. **"Page Replacement Algorithm Race"**
     - FIFO vs LRU vs Optimal processing the same page reference string
     - WOW: Same page references, three frame sets side by side. Each page access either HITS (green) or triggers a replacement (evicted page slides out, new page slides in). FIFO evicts the oldest. LRU evicts the least recently used. Optimal evicts the one used furthest in the future. Hit/miss counters diverge. Belady's anomaly with FIFO (more frames = more faults) is toggleable.
     - Effort: M

---

**DEADLOCK (3 features)**

134. **"Resource Allocation Graph Cycle"**
     - Processes and resources with request/assignment edges forming a cycle
     - WOW: Process P1 holds R1, requests R2. Process P2 holds R2, requests R1. The edges form a visible cycle (highlighted in red). The cycle = deadlock. Adding a third process makes the cycle longer. The cycle detection algorithm (DFS on the resource graph) runs and identifies the cycle path. Removing one edge (killing a process) breaks the cycle.
     - Effort: M

135. **"Banker's Algorithm Safe Sequence"**
     - Finding a safe execution order that avoids deadlock
     - WOW: 4 processes with max resource needs and current allocations. The algorithm checks: "If we give P2 what it needs, can it finish and release resources for others?" Yes: P2 runs, releases. Then P4, then P1, then P3. The safe sequence is built step by step. An unsafe state is shown where no process can complete (deadlock inevitable).
     - Effort: M

136. **"Dining Philosophers Fork Grab"**
     - 5 philosophers around a table, each needing two forks to eat
     - WOW: Philosophers think, then try to pick up forks. Two adjacent philosophers grab the same fork (contention). Eventually all 5 hold one fork each and wait for the other (deadlock). They sit forever. Solutions toggled: "pick up both forks atomically," "odd/even ordering," "one philosopher is left-handed." Each solution breaks the circular wait.
     - Effort: M

---

**PROCESS vs THREAD (2 features)**

137. **"Context Switch: Process vs Thread"**
     - A process context switch (expensive) vs thread context switch (cheap) side by side
     - WOW: Process switch: save all registers, flush TLB, switch address space, load new page table, reload caches (cold). Thread switch: save registers, switch stack pointer (same address space, TLB stays warm). The operation count and time bar show threads switching 10-100x faster. A "switches per second" comparison counter drives it home.
     - Effort: M

138. **"Shared Memory Peril"**
     - Two threads reading/writing the same memory location without synchronization
     - WOW: Two threads increment a shared counter. Each does: read counter, add 1, write counter. Without locking, they interleave: Thread A reads 5, Thread B reads 5, Thread A writes 6, Thread B writes 6. Expected: 7. Got: 6. The lost update is shown with a timeline interleaving diagram. A lock toggle fixes it but shows serialization overhead.
     - Effort: S

---

### MODULE 8: CONCURRENCY

---

**RACE CONDITION (3 features)**

139. **"Lost Update"**
     - Two threads both read-modify-write, one update gets overwritten
     - WOW: Bank account balance = $100. Thread A: read $100, add $50. Thread B: read $100 (before A writes), subtract $20. Thread A writes $150. Thread B writes $80. Final balance: $80 instead of $130. The $50 deposit vanished. The timeline shows the interleaving with the lost write highlighted in red.
     - Effort: S

140. **"Check-Then-Act (TOCTOU)"**
     - Check if file exists, then create it. Between check and create, another thread creates it.
     - WOW: Thread A: `if (!file.exists())` returns true. Thread B: creates the file. Thread A: `file.create()` fails or overwrites. The time gap between check and act is highlighted. The race window is shown expanding and contracting as timing varies. An atomic `createIfAbsent` operation eliminates the window.
     - Effort: S

141. **"Thread Scheduling Lottery"**
     - Run the same racy code 100 times, showing different outcomes based on scheduling
     - WOW: Same unsynchronized code runs 100 times in fast-forward. Most times: correct result (by luck). Sometimes: wrong result (race hit). A histogram of results builds showing a distribution of wrong answers. The non-determinism is the terrifying part: "works on my machine" but fails 3% of the time.
     - Effort: M

---

**DEADLOCK (2 features, concurrency flavor)**

142. **"Circular Wait Builder"**
     - Interactively create a deadlock by assigning resources to threads
     - WOW: User drags locks between threads. "Thread 1 holds Lock A, wants Lock B." "Thread 2 holds Lock B, wants Lock A." The moment a cycle forms, a DEADLOCK alarm fires with the cycle highlighted. User tries to resolve it by reordering lock acquisition. The deadlock disappears.
     - Effort: M

143. **"Lock Ordering Solution"**
     - Same scenario with consistent lock ordering preventing deadlock
     - WOW: Without ordering: Thread 1 grabs A then B, Thread 2 grabs B then A (deadlock possible). With ordering: both grab A first, then B. Thread 2 blocks on A (no cycle, just waiting). Thread 1 completes and releases. Thread 2 proceeds. The total ordering eliminates the cycle structurally.
     - Effort: S

---

**PRODUCER-CONSUMER (3 features)**

144. **"Bounded Buffer Filling and Draining"**
     - A physical buffer showing items being produced and consumed at different rates
     - WOW: A tube with N slots. Producer adds items at the left (green). Consumer removes items at the right (blue). When producer is faster: buffer fills to capacity, producer blocks (visible waiting). When consumer is faster: buffer empties, consumer blocks. User controls both speeds independently with sliders.
     - Effort: S

145. **"Backpressure Mechanism"**
     - Producer slows down when consumer cannot keep up
     - WOW: Without backpressure: buffer overflows, items are dropped (red items falling off the edge). With backpressure: producer's speed automatically throttles as buffer fills (visible speedometer decreasing). Buffer stays healthy. Throughput graph shows sustained vs burst-then-crash patterns.
     - Effort: M

146. **"Multiple Producers, Multiple Consumers"**
     - Work queue distributing tasks across a consumer pool
     - WOW: 3 producers feeding a shared queue. 4 consumers pulling from it. Work items distribute across consumers. One slow consumer causes its items to pile up (visible queue building behind it). Work stealing: fast consumers help the slow one (items migrate between consumer queues). Load balancing improves visibly.
     - Effort: M

---

**LOCK-FREE (2 features)**

147. **"CAS Spin Loop"**
     - Compare-And-Swap operation retrying until it succeeds
     - WOW: Thread A reads value=5. Thread B reads value=5. Thread A does CAS(expected=5, new=6): SUCCESS (value becomes 6). Thread B does CAS(expected=5, new=7): FAIL (value is now 6, not 5). Thread B retries: reads 6, CAS(expected=6, new=7): SUCCESS. The retry loop is visible as a "spin" animation that resolves.
     - Effort: S

148. **"ABA Problem"**
     - Value changes from A to B to A, CAS thinks nothing changed
     - WOW: Thread 1 reads value A. Thread 2 changes A to B. Thread 3 changes B back to A. Thread 1 does CAS(expected=A, new=C): SUCCESS because value is still A. But the semantic meaning changed (the A it sees is a different A). An "object identity" visualization shows the ABA is actually A1->B->A2, and A1 is not A2. A version counter (tagged pointer) solution shows the fix.
     - Effort: M

---

### MODULE 9: SECURITY

---

**SQL INJECTION (3 features)**

149. **"Union-Based Extraction"**
     - An attacker uses UNION SELECT to extract data from other tables
     - WOW: A search field. User types `' UNION SELECT username, password FROM users --`. The query builder shows the SQL forming with the injected UNION. The result table suddenly shows usernames and passwords instead of search results. The injected SQL is highlighted in red within the assembled query. Parameterized query toggle shows the injection being safely escaped.
     - Effort: M

150. **"Blind Injection Bit Extraction"**
     - Extracting data one bit at a time by observing response time or boolean responses
     - WOW: Attacker sends: `IF(SUBSTR(password,1,1)='a', SLEEP(5), 0)`. If response takes 5 seconds: first character is 'a'. The timing bar shows long response = true, short = false. Letter by letter, the password is extracted through timing. A "characters extracted" counter builds the password character by character. Agonizingly slow but effective.
     - Effort: M

151. **"Second-Order Injection"**
     - Malicious input stored safely, then injected when used in a later query
     - WOW: User registers with username `admin'--`. The registration sanitizes and stores it safely. Later, a password reset query uses the stored username without re-sanitizing: `WHERE username='admin'--'`. The `--` comments out the rest of the query. The attack works not at input time but at retrieval time. The time delay between injection and exploitation makes it hard to detect.
     - Effort: M

---

**XSS (3 features)**

152. **"Reflected XSS in the URL"**
     - User clicks a crafted link and a script executes in their browser
     - WOW: A search page echoes the search term in the page. Attacker crafts URL: `?q=<script>document.cookie</script>`. Victim clicks the link. The script tag renders in the page and executes (visible script execution animation). The victim's cookie flies to the attacker's server. CSP header toggle blocks the inline script execution.
     - Effort: M

153. **"Stored XSS: The Gift That Keeps Giving"**
     - Malicious script stored in a comment/post and executed for every viewer
     - WOW: Attacker posts a comment containing `<script>`. The comment is stored in the database. Every user who views the page loads the comment, and the script executes. A "victims counter" increments every time a new user visits the page. The persistent nature is what makes stored XSS devastating. Output encoding toggle neutralizes it.
     - Effort: M

154. **"DOM-Based XSS"**
     - Client-side JavaScript unsafely uses URL fragment as innerHTML
     - WOW: JavaScript reads `window.location.hash` and inserts it into the page via innerHTML. Attacker crafts `#<img onerror=alert(1)>`. The script never hits the server (no server logs show the attack). The attack happens entirely in the browser. Server-side defenses are useless. Only client-side sanitization (DOMPurify) helps.
     - Effort: M

---

**CSRF (2 features)**

155. **"Hidden Form Auto-Submit"**
     - Victim visits attacker's page, which submits a form to their bank
     - WOW: Attacker's page contains a hidden form pointing to `bank.com/transfer?to=attacker&amount=10000` with auto-submit JavaScript. Victim visits the page. Their browser sends the request WITH the bank's cookies (because cookies are automatic). The bank processes the transfer. The victim sees nothing. Toggle SameSite=Strict cookies and the cookie is NOT sent cross-origin.
     - Effort: M

156. **"CSRF Token Defense"**
     - A unique token in the form that the attacker cannot guess
     - WOW: Each form rendered by the server includes a random token. When the form is submitted, the server verifies the token. The attacker's page cannot include the correct token (it is unique per session and unpredictable). The forged request arrives without the token and gets rejected (403). The token comparison animation shows match vs mismatch.
     - Effort: S

---

**JWT (3 features)**

157. **"None Algorithm Attack"**
     - Attacker changes the JWT algorithm to "none" and forges tokens
     - WOW: A valid JWT with header.payload.signature. Attacker modifies the header `"alg": "none"` and removes the signature. If the server accepts "none" algorithm, the forged token is valid. The attacker becomes admin. The JWT is decoded live showing the tampered header. Toggle "algorithm whitelist" on the server to reject "none."
     - Effort: M

158. **"Token Replay"**
     - A stolen JWT is used by an attacker from a different device
     - WOW: User authenticates, gets a JWT. Attacker intercepts it (via XSS, network sniffing). Attacker replays the JWT from their device. The server accepts it (JWT is self-contained, no server-side session to check). The attacker is now logged in as the user. A "time since theft" counter shows the token remains valid until expiry. Short expiry + refresh token rotation shown as mitigation.
     - Effort: M

159. **"JWT Size Bloat"**
     - Adding claims to a JWT and watching the token size grow
     - WOW: Start with a minimal JWT (50 bytes). Add roles, permissions, user metadata. The JWT grows to 2KB. It is sent with EVERY request (visible in request headers). Compare to a session ID (32 bytes) that requires a server-side lookup but keeps requests tiny. The bandwidth overhead of large JWTs on mobile connections is calculated.
     - Effort: S

---

**OAUTH (2 features)**

160. **"Authorization Code Flow Step by Step"**
     - The full OAuth 2.0 dance with auth code, token exchange, and API access
     - WOW: User clicks "Login with Google." Redirect to Google (browser bar changes). User consents. Google redirects back with a code. The app's backend exchanges the code for tokens (server-to-server, invisible to user). Access token is used for API calls. Each step is a visible arrow between Client, Auth Server, and Resource Server.
     - Effort: M

161. **"PKCE Protection Against Code Interception"**
     - A malicious app intercepts the auth code; PKCE prevents token theft
     - WOW: Without PKCE: attacker intercepts the auth code from the redirect URL and exchanges it for tokens (code is the key). With PKCE: the legitimate client generated a code_verifier and sent a code_challenge. The attacker has the code but not the verifier. The token exchange fails. The verifier/challenge pair is shown as a cryptographic lock-and-key.
     - Effort: M

---

### MODULE 10: ML DESIGN

---

**NEURAL NETWORK (4 features)**

162. **"Forward Pass Illumination"**
     - Watch activations propagate layer by layer through a neural network
     - WOW: Input values enter the first layer. Each neuron computes weighted sum + bias (numbers visible). Activation function fires (ReLU clips negatives to zero, visibly). Activations propagate to the next layer. The final output layer produces a prediction. Each connection wire thickens proportional to its weight magnitude.
     - Effort: M

163. **"Backpropagation Gradient Flow"**
     - Loss computed, gradients flow backward through the network
     - WOW: The loss is computed (number appears at the output). Gradients flow backward through the network (reverse arrows). Each weight gets a gradient (positive = increase, negative = decrease, shown as green/red intensity). Weights update by a small step. The next forward pass shows improved predictions. The learning loop is visible.
     - Effort: L

164. **"Vanishing Gradient Abyss"**
     - Deep network where gradients shrink to near-zero in early layers
     - WOW: A 20-layer network. Gradients flowing backward get multiplied through sigmoid activations. By layer 5, gradients are tiny (fading arrows). By layer 1, they are invisible (effectively zero). Early layers do not learn. A "gradient magnitude by layer" bar chart shows the exponential decay. Toggle from sigmoid to ReLU and gradients maintain their magnitude.
     - Effort: M

165. **"Attention Heatmap"**
     - A transformer attention mechanism showing which tokens attend to which
     - WOW: An input sentence where each word attends to every other word. Attention weights shown as a heatmap matrix. "The cat sat on the mat" -- "sat" attends strongly to "cat" (who sat?) and "mat" (where?). Hovering over a word highlights its attention distribution. Multi-head attention shows each head focusing on different relationships.
     - Effort: L

---

**TRAINING (3 features)**

166. **"Loss Landscape Descent"**
     - A ball rolling down a 3D loss surface, finding the minimum
     - WOW: A 3D surface with hills, valleys, and saddle points. A ball (representing current weights) rolls down the gradient. With high learning rate: it overshoots and bounces. With low learning rate: it crawls and gets stuck in local minima. With momentum: it rolls through small bumps. The 3D surface rotates as the ball descends.
     - Effort: L (partially built in LossLandscapeCanvas.tsx)

167. **"Learning Rate Comparison"**
     - Same network training with different learning rates simultaneously
     - WOW: Three training curves. LR=0.1: loss oscillates wildly, may diverge. LR=0.001: loss decreases smoothly but very slowly. LR=0.01: sweet spot, fast and stable convergence. A fourth curve with learning rate scheduling (warm-up + decay) outperforms all three. The convergence speed vs stability tradeoff is quantified.
     - Effort: M

168. **"Overfitting Diagnosis"**
     - Training loss keeps dropping while validation loss starts climbing
     - WOW: Two loss curves: training (blue) and validation (orange). Initially both drop together. Then training loss keeps falling but validation loss plateaus and starts rising. The gap widens (the overfitting region is highlighted in red). The model memorizes training data but fails on new data. Toggle dropout/regularization and watch the gap close.
     - Effort: M

---

**MODEL SERVING (2 features)**

169. **"A/B Test Traffic Split"**
     - Two model versions serving traffic simultaneously with metric comparison
     - WOW: Traffic arrives. 90% goes to Model A (current). 10% to Model B (challenger). Each model's accuracy, latency, and error rate are tracked in real-time dashboards. After enough data, a statistical significance test runs (confidence interval shrinking). When the challenger wins, a "promote" button swaps it to 100%.
     - Effort: M

170. **"Canary Deployment Rollout"**
     - New model version rolled out to 1% of traffic, then gradually increased
     - WOW: Model v2 deployed to 1% (one tiny green sliver). Error metrics monitored. No increase in errors: bump to 5%, then 25%, then 50%, then 100%. If errors spike at any stage (visible red alert), automatic rollback to v1 (green retracts, blue returns). The staged rollout is visible as a gradually expanding green bar.
     - Effort: M

---

### MODULE 11: LLD (Low-Level Design)

---

**BEHAVIORAL PATTERNS (4 features)**

171. **"Observer Notify Cascade"**
     - A subject state change ripples notifications to all registered observers
     - WOW: A subject (e.g., a stock price) changes. Notification arrows fire simultaneously to 5 observers (chart widget, alert system, portfolio tracker, mobile push, email). Each observer updates independently. User can register/unregister observers by dragging them on/off the subscription list. Removing an observer stops its notifications instantly.
     - Effort: S

172. **"Strategy Runtime Swap"**
     - A payment processing system switching strategies at runtime
     - WOW: A "process payment" pipeline. The strategy slot is interchangeable. User drags "CreditCardStrategy" into the slot and the pipeline uses credit card processing. Swaps to "PayPalStrategy" and the same pipeline uses PayPal. Swaps to "CryptoStrategy." The pipeline code never changes, only the strategy object. The hot-swap animation is satisfying.
     - Effort: S

173. **"Command Undo/Redo Stack"**
     - A text editor where every action is a command object that can be undone
     - WOW: User performs actions: type "Hello", bold it, change font size. Each action pushes a Command object onto an undo stack (visible stack growing). Click undo: the top command pops off and its `undo()` method fires (action reverses). Click undo again: another reversal. Click redo: the command moves to the redo stack and re-executes. The dual-stack mechanism is visible.
     - Effort: M

174. **"Chain of Responsibility Pipeline"**
     - A request passes through a chain of handlers until one processes it
     - WOW: A support ticket enters the chain. Level 1 handler checks: "Can I handle this?" No (passes along). Level 2 checks: No (passes along). Level 3 checks: Yes (handles it). The ticket physically moves through the chain. User changes the ticket type and it gets handled at a different level. The decoupling of sender from receiver is the insight.
     - Effort: S

---

**CREATIONAL PATTERNS (3 features)**

175. **"Factory Assembly Line"**
     - A factory producing different product types based on input
     - WOW: A factory machine receives an order type ("Circle", "Square", "Triangle"). The machine configures itself (gears turning) and produces the corresponding shape object. The caller never knows the concrete class. User switches order types and watches different products emerge from the same factory interface.
     - Effort: S

176. **"Builder Step-by-Step Construction"**
     - Building a complex object (a house, a query, a config) one property at a time
     - WOW: A house being built. `.setFoundation("concrete")` lays the foundation (animated). `.setWalls("brick")` adds walls. `.setRoof("tile")` adds a roof. `.setGarage(true)` adds a garage. Each method call is a visible construction step. The final `.build()` returns the completed house. Changing the builder chain produces a different house.
     - Effort: M

177. **"Singleton Danger Zone"**
     - Multiple threads racing to create a singleton, showing double initialization
     - WOW: Two threads both check `if instance == null` simultaneously (both see null). Both enter the creation block. Two instances are created. The "singleton" is not a singleton. A double-checked locking toggle shows the fix. A "just use an enum" alternative is shown as the simplest solution. The concurrency bug is the horror moment.
     - Effort: S

---

**STRUCTURAL PATTERNS (3 features)**

178. **"Decorator Wrapping"**
     - A base component getting wrapped with progressively more decorators
     - WOW: A basic `Coffee` object. Wrap with `MilkDecorator` (milk pours onto the coffee, price increases). Wrap with `SugarDecorator` (sugar added, price increases again). Wrap with `WhipCreamDecorator` (whip cream added). Each decorator is a visible layer around the core object. The method call shows delegation through the wrapper chain.
     - Effort: S

179. **"Proxy Access Gate"**
     - A proxy intercepting requests and adding behavior (caching, logging, access control)
     - WOW: A client calls `getImage()`. The proxy intercepts: checks access (green checkmark), checks cache (cache hit = instant return, cache miss = forwards to real object). The real object loads the image (slow, disk icon). The proxy caches it for next time. Second call: proxy serves from cache (fast). The interception is visible as a gate between client and real service.
     - Effort: S

180. **"Adapter Translation"**
     - An adapter converting between incompatible interfaces
     - WOW: System A speaks JSON. System B speaks XML. An adapter sits between them. A JSON message enters the adapter, gets transformed (visible field mapping), and exits as XML. System B processes it. Response comes back as XML, adapter converts to JSON for System A. The bidirectional translation is animated with format highlighting.
     - Effort: S

---

## SUMMARY

**Total features catalogued: 180**

Breakdown by module:
- System Design: 44 features across 12 topics
- Algorithms: 20 features across 5 categories
- Data Structures: 16 features across 5 structures
- Database: 16 features across 5 topics
- Distributed Systems: 16 features across 5 protocols
- Networking: 13 features across 4 protocols
- OS Concepts: 13 features across 4 concepts
- Concurrency: 12 features across 4 problems
- Security: 13 features across 5 attack types
- ML Design: 9 features across 3 concepts
- LLD: 10 features across 3 pattern categories
- (Interview + Knowledge Graph modules are meta/tools, not content visualizations)

Effort distribution:
- Small (S): ~45 features -- single-component, < 1 day each
- Medium (M): ~105 features -- multi-component, 1-3 days each
- Large (L): ~30 features -- full systems, 3-7 days each

---

## IMPLEMENTATION PRIORITY GUIDANCE

**Highest-impact features to build first** (things that make people screenshot and share):

1. "Sorting Grand Prix" (#45) -- Everyone understands sorting. The race format is immediately compelling. S/M effort.
2. "Thundering Herd" (#7) -- The tsunami visual of 1000 requests is viscerally dramatic. M effort.
3. "Cascading Failure Dominos" (#44) -- Watching failure propagate like dominoes through a system graph is unforgettable. L effort.
4. "Recursion Tree Explosion" (#55) -- The contrast between 67 calls and 8 calls with memoization is the biggest "aha" in CS education. M effort.
5. "Election Night" (#97) -- Raft election is already partially built. Completing it gives a marquee distributed systems demo. M effort.
6. "Dirty Read Caught" (#86) -- Seeing a transaction use data that never existed makes isolation levels click forever. M effort.
7. "Three-Way Handshake" (#113) -- The most-asked networking interview question, animated. S effort.
8. "LRU Eviction Theatre" (#8) -- Physically watching elements get pushed off the end of a cache. S effort.
9. "Dining Philosophers Fork Grab" (#136) -- The canonical concurrency visualization. M effort.
10. "N-Queens Battle" (#62) -- The chessboard with attack lines and backtracking is visually rich. M effort.

**Leverage what already exists.** The codebase already has `RaftVisualizer.tsx`, `ConsistentHashRingVisualizer.tsx`, `VectorClockDiagram.tsx`, `LossLandscapeCanvas.tsx`, `CacheHitGauge.tsx`, and `simulation-transport.tsx`. Extending these components into full WOW experiences is lower effort than building from scratch.