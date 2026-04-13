# Load Balancing Algorithms

---

## Why the Algorithm Matters

The algorithm is the **brain** of the load balancer. It decides which server receives the next request. Choose wrong and you get hot spots, wasted capacity, or broken sessions. Choose right and you get even utilization, low latency, and graceful scaling.

```
                         +-----------+
    Requests             |   Load    |       Which server?
  ================>      |  Balancer |       Algorithm decides.
    R1 R2 R3 R4 R5      |           |
                         +-----+-----+
                               |
                 +-------------+-------------+
                 |             |             |
              Server A     Server B     Server C
```

---

## 1. Round Robin

### How It Works

Assigns requests sequentially in a fixed circular order. Server A, then B, then C, then back to A. Dead simple.

```
Request #    Server Selected
---------    ---------------
   1         Server A
   2         Server B
   3         Server C
   4         Server A    <-- wraps around
   5         Server B
   6         Server C
   7         Server A
```

### ASCII Diagram

```
Requests:  R1  R2  R3  R4  R5  R6  R7  R8  R9
           |   |   |   |   |   |   |   |   |
           v   v   v   v   v   v   v   v   v
          [A] [B] [C] [A] [B] [C] [A] [B] [C]

Counter:   0   1   2   0   1   2   0   1   2
           (counter mod N)
```

### Implementation (Pseudocode)

```python
class RoundRobin:
    def __init__(self, servers):
        self.servers = servers
        self.index = 0

    def next_server(self):
        server = self.servers[self.index % len(self.servers)]
        self.index += 1
        return server
```

### Pros
- Trivially simple to implement and understand
- Zero overhead -- no state tracking beyond a counter
- Perfectly fair **if all servers are identical and all requests cost the same**

### Cons
- Ignores server capacity differences (8-core vs 2-core gets equal traffic)
- Ignores current load (server already drowning still gets new requests)
- Ignores request cost (a search query vs a file upload treated the same)

### When to Use
- Homogeneous server fleet with uniform request processing times
- Stateless workloads (REST APIs, static content)
- When simplicity is valued over optimization

### Real-World Example
- **DNS round robin**: multiple A records for a domain; resolvers cycle through them
- **Nginx default**: `upstream` block without directives uses round robin

---

## 2. Weighted Round Robin

### How It Works

Each server gets a **weight** proportional to its capacity. A server with weight 3 receives 3x the requests of a server with weight 1 before the cycle moves on.

```
Weights:  Server A = 5,  Server B = 3,  Server C = 2
Total weight = 10

In every cycle of 10 requests:
  A gets 5 requests
  B gets 3 requests
  C gets 2 requests
```

### ASCII Diagram

```
Cycle of 10 requests:

  R1 R2 R3 R4 R5    R6 R7 R8    R9 R10
  |  |  |  |  |     |  |  |     |  |
  v  v  v  v  v     v  v  v     v  v
  [--- A (w=5) -]   [- B (w=3)-] [C (w=2)]

  Smooth Weighted Round Robin (better interleaving):
  A A B A C A B A B C   <-- spreads servers evenly within cycle
  (avoids burst to single server)
```

### Nginx Configuration

```nginx
upstream backend {
    server 10.0.0.1 weight=5;   # beefy 8-core machine
    server 10.0.0.2 weight=3;   # medium 4-core machine
    server 10.0.0.3 weight=2;   # small 2-core machine
}
```

### Pros
- Accounts for heterogeneous server capacities
- Still simple, O(1) per request with smooth algorithms
- Good for mixed fleets (different instance sizes)

### Cons
- Weights are static -- must be reconfigured if capacity changes
- Still ignores real-time load
- Weight tuning requires benchmarking to get right

### When to Use
- Mixed server fleet (different CPU/RAM)
- Cloud environments with mixed instance types (m5.large + m5.xlarge)
- Gradual rollouts (weight new version at 10%, old at 90%)

### Real-World Example
- **Canary deployments**: new version gets weight=1, old version gets weight=99
- **AWS Weighted Target Groups**: ALB distributes by target weight

---

## 3. Least Connections

### How It Works

Routes each new request to the server currently handling the **fewest active connections**. Naturally adapts to slow servers (they accumulate connections, so they get fewer new ones).

```
Current state:
  Server A: 12 active connections
  Server B:  4 active connections   <-- PICK THIS ONE
  Server C:  8 active connections

New request --> Server B
```

### ASCII Diagram

```
            Active Connections
            A: ||||||||||||  (12)
            B: ||||          (4)   <--- new request goes here
            C: ||||||||      (8)

After assignment:
            A: ||||||||||||  (12)
            B: |||||         (5)
            C: ||||||||      (8)
```

### Pros
- Adapts to variable request processing times
- Self-correcting: slow servers naturally shed load
- Great for long-lived connections (WebSocket, database connections)

### Cons
- Requires tracking per-server connection count (more state)
- Tie-breaking needed when counts are equal
- New server with 0 connections gets thundering herd
- Does not account for server capacity differences

### When to Use
- Requests with widely varying processing times
- Long-lived connections (WebSocket, gRPC streaming)
- When servers are identical but workload is unpredictable

### Real-World Example
- **HAProxy `leastconn`**: default for backend services with variable latency
- **Database connection pools**: route queries to least-loaded replica

---

## 4. Weighted Least Connections

### How It Works

Combines connection count with server weight. Routes to the server with the **lowest ratio** of (active connections / weight). A server with weight 5 and 10 connections (ratio = 2.0) is preferred over a server with weight 2 and 5 connections (ratio = 2.5).

```
Formula: score = active_connections / weight
Pick the server with the lowest score.

Server A: 10 connections, weight 5  -->  score = 10/5 = 2.0  <-- PICK
Server B:  5 connections, weight 2  -->  score = 5/2  = 2.5
Server C:  8 connections, weight 4  -->  score = 8/4  = 2.0  (tie, pick first)
```

### ASCII Diagram

```
  Server    Weight    Connections    Score (conn/weight)
  ------    ------    -----------    -------------------
    A         5          10          2.0  <-- lowest, chosen
    B         2           5          2.5
    C         4           8          2.0  (tie with A)
```

### Pros
- Best of both worlds: capacity-aware + load-aware
- Handles heterogeneous fleets with variable workloads
- Self-tuning to real-time conditions

### Cons
- More computation per request (division + comparison)
- Weight tuning still needed
- Slightly more complex to reason about

### When to Use
- Mixed server fleet with variable request durations
- Production environments where simplicity is less important than accuracy
- Upstream services with mixed instance sizes

### Real-World Example
- **Nginx Plus** `least_conn` with `weight`
- **F5 BIG-IP**: weighted least connections is a primary algorithm

---

## 5. IP Hash

### How It Works

Hashes the client's IP address to deterministically select a server. The same client IP **always** maps to the same server (until the server pool changes). Provides **sticky sessions** without cookies.

```
hash(client_ip) % num_servers = server_index

Client 10.1.2.3  -->  hash("10.1.2.3")  = 827364  -->  827364 % 3 = 0  --> Server A
Client 10.1.2.4  -->  hash("10.1.2.4")  = 119482  -->  119482 % 3 = 1  --> Server B
Client 10.1.2.3  -->  hash("10.1.2.3")  = 827364  -->  827364 % 3 = 0  --> Server A (same!)
```

### ASCII Diagram

```
Client 1 (IP: 10.1.2.3) ----+
                              |    hash(IP) % 3 = 0
                              +----> Server A
Client 1 (again) ------------+

Client 2 (IP: 10.1.2.4) ----------> Server B   hash % 3 = 1

Client 3 (IP: 10.1.2.5) ----------> Server C   hash % 3 = 2
```

### Nginx Configuration

```nginx
upstream backend {
    ip_hash;
    server 10.0.0.1;
    server 10.0.0.2;
    server 10.0.0.3;
}
```

### Pros
- Sticky sessions without cookies or session stores
- Deterministic: same client always hits same server
- Simple implementation

### Cons
- Adding/removing servers **remaps most clients** (N-1)/N disruption
- Clients behind NAT/proxy share an IP -- creates hot spots
- Uneven distribution if IP space is clustered
- Server failure drops all sessions for affected clients

### When to Use
- Simple session affinity requirements
- When you cannot use cookies (non-HTTP protocols, UDP)
- Caching tiers where same key should hit same cache node

### Real-World Example
- **Nginx `ip_hash`** directive
- **Memcached** client libraries: hash key to select cache server

---

## 6. Consistent Hashing

### How It Works

Maps both servers and requests onto a **hash ring** (0 to 2^32 - 1). Each request is hashed and routed to the **next server clockwise** on the ring. When a server is added or removed, only keys in the affected arc are remapped -- **not** the entire keyspace.

### The Problem with Simple Hashing

```
Simple hash:  hash(key) % N

N = 3:  key "abc" -> hash 17 -> 17 % 3 = 2 -> Server C
N = 4:  key "abc" -> hash 17 -> 17 % 4 = 1 -> Server B   <-- DIFFERENT!

Adding 1 server remaps ~75% of keys. Catastrophic for caches.
```

### Hash Ring

```
                        0 / 2^32
                          |
                    S_C   |   S_A
                  (pos 50) | (pos 200)
                   .       |       .
                 .                   .
               .                       .
  2^32 * 3/4 |                         | 2^32 * 1/4
              .                       .
               .                     .
                 .       S_B       .
                   .  (pos 700)  .
                          |
                     2^32 * 1/2

  Request "key1" hashes to position 150
    --> walk clockwise --> next server is S_A (pos 200)

  Request "key2" hashes to position 600
    --> walk clockwise --> next server is S_B (pos 700)
```

### Adding a Server (Minimal Disruption)

```
Before: S_A(200), S_B(700), S_C(50)

  Keys in range (50, 200]   -> S_A
  Keys in range (200, 700]  -> S_B
  Keys in range (700, 50]   -> S_C

Add S_D at position 400:

  Keys in range (50, 200]   -> S_A  (unchanged)
  Keys in range (200, 400]  -> S_D  (moved from S_B)
  Keys in range (400, 700]  -> S_B  (unchanged)
  Keys in range (700, 50]   -> S_C  (unchanged)

Only keys between 200-400 are remapped. ~K/N keys move instead of K*(N-1)/N.
```

### Virtual Nodes (Vnodes)

With few physical servers, the ring is unbalanced. Virtual nodes solve this:

```
Physical Servers: A, B, C
Virtual Nodes (3 per server):

  Ring positions:
    A_1(50),  B_1(120), C_1(200),
    A_2(350), B_2(500), C_2(600),
    A_3(800), B_3(900), C_3(950)

Result: 9 points on the ring instead of 3 -- much more even distribution.
Typical production: 100-200 virtual nodes per physical server.
```

```
         0
         |
    C3(950) A1(50)
   B3(900)    B1(120)
  A3(800)       C1(200)      <-- 9 points, well-distributed
              A2(350)
   C2(600)  B2(500)
```

### Pros
- Minimal disruption on server add/remove: only K/N keys move
- Scales well for distributed caches and storage
- Virtual nodes ensure even distribution

### Cons
- More complex implementation than simple hash
- Virtual nodes add memory overhead
- Ring must be kept in sync across all clients

### When to Use
- Distributed caches (Memcached, Redis Cluster)
- Distributed databases (Cassandra, DynamoDB)
- CDN origin selection
- Any system where remapping cost is high

### Real-World Example
- **Amazon DynamoDB**: consistent hashing for partition placement
- **Apache Cassandra**: token ring with virtual nodes
- **Akamai CDN**: original consistent hashing paper authors

---

## 7. Least Response Time

### How It Works

Routes to the server with the **lowest average response time** (and optionally fewest active connections as a tiebreaker). Measures actual latency, not just connection count.

```
Server A:  avg response = 45ms,  active = 10
Server B:  avg response = 12ms,  active = 15   <-- PICK (fastest)
Server C:  avg response = 30ms,  active = 8

Some implementations use: score = response_time * active_connections
  A: 45 * 10 = 450
  B: 12 * 15 = 180   <-- lowest combined score
  C: 30 * 8  = 240
```

### ASCII Diagram

```
  LB tracks rolling average response time per server:

  Server A  [============================] 45ms avg
  Server B  [========]                     12ms avg  <-- fastest
  Server C  [====================]         30ms avg

  New request --> Server B

  After response comes back, LB updates B's average.
```

### Nginx Plus Configuration

```nginx
upstream backend {
    least_time header;   # measure time to first byte
    # least_time last_byte;  # or time to last byte
    server 10.0.0.1;
    server 10.0.0.2;
    server 10.0.0.3;
}
```

### Pros
- Directly optimizes for user-perceived latency
- Adapts to servers slowing down (GC pauses, disk I/O)
- Best for latency-sensitive workloads

### Cons
- Requires measuring and tracking response times (more overhead)
- Cold start problem: new server has no latency data
- Can oscillate: everyone avoids slow server, it recovers, everyone floods it
- Response time spikes from one bad request can skew the average

### When to Use
- Latency-sensitive applications (real-time APIs, gaming)
- Heterogeneous backends with variable performance
- When you need SLA compliance (p99 latency)

### Real-World Example
- **Nginx Plus `least_time`** directive
- **Envoy proxy**: outlier detection based on response time

---

## 8. Random

### How It Works

Picks a server uniformly at random. No state, no tracking. Surprisingly effective at scale due to the **law of large numbers** -- with many requests, the distribution approaches uniform.

```python
import random

def next_server(servers):
    return random.choice(servers)
```

### ASCII Diagram

```
Request #    Random Pick    Running Count
---------    -----------    --------------------------
   1         Server C       A:0  B:0  C:1
   2         Server A       A:1  B:0  C:1
   3         Server A       A:2  B:0  C:1  <-- uneven early
   4         Server B       A:2  B:1  C:1
   ...
   1000      Server B       A:332 B:335 C:333  <-- converges!
```

### Pros
- Zero state, zero coordination
- Works perfectly in distributed LB setups (no shared counter needed)
- O(1) per request, no lock contention
- With weighted random, supports heterogeneous servers

### Cons
- Short-term imbalance (fine at scale, bad with 10 requests/sec)
- No session affinity
- No load awareness
- Can stack requests on one server by chance (birthday problem)

### When to Use
- High request volume where law of large numbers applies
- Distributed LB without shared state
- When simplicity trumps perfect distribution
- As a building block for more advanced algorithms (see Power of Two)

### Real-World Example
- **gRPC client-side LB**: random pick as a base strategy
- **Netflix Ribbon**: random as one of several strategies

---

## 9. Power of Two Random Choices (P2C)

### How It Works

Pick **two** servers at random, then route to the one with fewer active connections (or lower load). This tiny change has a **dramatic** mathematical effect: maximum load drops from O(log n / log log n) to O(log log n) -- exponentially better than pure random.

```
Step 1: randomly pick 2 servers
Step 2: compare their load
Step 3: send request to the less loaded one

Server A: 12 connections
Server B:  4 connections   <-- random picks A and B
Server C:  8 connections

Compare A(12) vs B(4) --> choose B
```

### ASCII Diagram

```
                 Server Pool
           [A:12] [B:4] [C:8] [D:15] [E:6]

  Step 1:  Randomly pick 2 -->  [A:12]  [B:4]
                                   |       |
  Step 2:  Compare:  12  vs  4     |       |
                                   |     Winner!
  Step 3:  Route to B  --------------------+

  Next request:
  Step 1:  Randomly pick 2 -->  [C:8]  [D:15]
  Step 2:  Compare:  8  vs  15
  Step 3:  Route to C
```

### Why It Works So Well (The Math)

```
Pure Random:       max load = O(log n / log log n)  -- some servers get hammered
Round Robin:       max load = O(1)                  -- but needs coordination
Power of Two:      max load = O(log log n)          -- near-optimal, no coordination!

With 1000 servers:
  Random max load:     ~7x average
  Power of Two max:    ~3x average   <-- massive improvement from 1 extra check
```

### Pros
- Near-optimal load distribution with minimal overhead
- No shared state or coordination needed
- Simple to implement (just one comparison more than random)
- Works well in distributed systems without centralized LB

### Cons
- Still not perfectly even (but close enough)
- Requires real-time load information from 2 servers
- Slightly more latency than pure random (one comparison)

### When to Use
- Distributed systems with no centralized LB
- Service mesh sidecar proxies
- High-scale systems where coordination is expensive
- When you want "good enough" without the complexity of least-connections

### Real-World Example
- **Envoy proxy**: default algorithm is P2C (called "LEAST_REQUEST" with 2 choices)
- **HAProxy**: `random(2)` option implements P2C
- **Netflix Zuul 2**: uses P2C for backend selection

---

## 10. Resource-Based (Adaptive)

### How It Works

The LB queries real-time health metrics from servers (CPU utilization, memory usage, disk I/O, request queue depth) and routes to the server with the most available capacity. Requires an **agent** on each server reporting metrics.

```
  Server A:  CPU 85%, Memory 70%, Queue: 45   --> score = 200 (overloaded)
  Server B:  CPU 30%, Memory 40%, Queue: 5    --> score = 75  (healthy)
  Server C:  CPU 55%, Memory 60%, Queue: 20   --> score = 135 (moderate)

  New request --> Server B (lowest composite score)
```

### ASCII Diagram

```
  +----------+     metrics     +----------+
  | Server A | -------------> |          |
  | CPU: 85% |   (agent/API)  |   Load   |
  +----------+                 | Balancer |
  +----------+     metrics     |          |     Picks server
  | Server B | -------------> |  Scoring |---> with best
  | CPU: 30% |                 |  Engine  |     composite score
  +----------+                 |          |
  +----------+     metrics     |          |
  | Server C | -------------> |          |
  | CPU: 55% |                 +----------+
  +----------+

  Score = w1*CPU + w2*Memory + w3*QueueDepth
  Lower score = more capacity = preferred target
```

### Pros
- Most accurate representation of server health
- Adapts to real-world conditions (noisy neighbors, GC pressure, disk issues)
- Can factor in application-specific metrics

### Cons
- Complex to implement (agents, metric collection, scoring)
- Metric staleness: decisions based on slightly old data
- Agent overhead on each server
- Scoring function tuning is an art

### When to Use
- High-value production systems where optimal utilization matters
- Heterogeneous workloads (some requests are CPU-heavy, others memory-heavy)
- Environments with noisy-neighbor problems (shared infrastructure)

### Real-World Example
- **AWS ALB**: monitors target health and deregisters unhealthy targets
- **F5 BIG-IP**: "dynamic ratio" mode uses SNMP metrics from servers
- **Kubernetes HPA + Service**: resource-based autoscaling + load balancing

---

## Giant Comparison Table

```
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Algorithm                  | Fairness | Sticky   | Over-   | Failure  | State   | Best For  |
|                            |          | Sessions | head    | Handling | Needed  |           |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Round Robin                | Even     | No       | O(1)    | Poor     | Counter | Stateless |
|                            | (if homo)|          | None    | (still   |         | uniform   |
|                            |          |          |         |  routes) |         | workloads |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Weighted Round Robin       | Propor-  | No       | O(1)    | Poor     | Counter | Mixed     |
|                            | tional   |          | None    |          | +weights| fleet     |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Least Connections          | Adaptive | No       | O(N)    | Good     | Conn    | Long-lived|
|                            |          |          | Low     | (auto-   | counts  | connections|
|                            |          |          |         |  sheds)  |         |           |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Weighted Least Connections | Best     | No       | O(N)    | Good     | Conn    | Mixed     |
|                            | adaptive |          | Low     |          | counts  | fleet +   |
|                            |          |          |         |          | +weights| variable  |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| IP Hash                    | Uneven   | Yes      | O(1)    | Bad      | None    | Simple    |
|                            | (IP      | (IP-     | None    | (rehash  |         | session   |
|                            |  clusters)|based)   |         |  all)    |         | affinity  |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Consistent Hashing         | Even     | Yes      | O(log N)| Great    | Ring    | Caches,   |
|                            | (w/vnodes)| (hash)  | Low     | (minimal |         | distributed|
|                            |          |          |         |  remap)  |         | storage   |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Least Response Time        | Latency- | No       | O(N)    | Good     | Latency | Latency-  |
|                            | optimal  |          | Medium  | (avoids  | history | sensitive |
|                            |          |          |         |  slow)   |         | apps      |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Random                     | Even     | No       | O(1)    | OK       | None    | High-     |
|                            | (at scale)|         | None    | (still   |         | volume    |
|                            |          |          |         |  routes) |         | stateless |
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Power of Two (P2C)         | Near-    | No       | O(1)    | Good     | Load    | Service   |
|                            | optimal  |          | Minimal | (avoids  | of 2    | mesh,     |
|                            |          |          |         |  loaded) | servers | distributed|
+----------------------------+----------+----------+---------+----------+---------+-----------+
| Resource-Based             | Best     | No       | O(N)    | Best     | Metrics | High-value|
|                            | possible |          | High    | (detects | from all| production|
|                            |          |          |         |  issues) | servers | systems   |
+----------------------------+----------+----------+---------+----------+---------+-----------+
```

---

## Decision Guide: Which Algorithm for Which System

### Decision Tree

```
START
  |
  v
Need session affinity?
  |         |
  YES       NO
  |         |
  v         v
Can use     Need load awareness?
cookies?      |         |
  |   |       YES       NO
  YES NO      |         |
  |   |       v         v
  |   v     Heterogeneous fleet?    High volume?
  |  IP Hash   |         |           |       |
  |  or Con-   YES       NO          YES     NO
  |  sistent   |         |           |       |
  |  Hashing   v         v           v       v
  |         W. Least   Least       Random   Round
  |         Conn       Conn        or P2C   Robin
  v
Cookie-based sticky
at L7 LB (any algo)
```

### Quick Reference by System Type

```
System Type                    Recommended Algorithm       Why
-------------------------      -------------------------   ---------------------------
Static content / CDN           Round Robin or Random       All requests ~equal cost
REST API (homogeneous)         Round Robin                 Simple, effective
REST API (mixed fleet)         Weighted Round Robin        Capacity-proportional
WebSocket / streaming          Least Connections           Long-lived connections
Database read replicas         Weighted Least Conn         Mixed sizes, variable queries
Distributed cache              Consistent Hashing          Minimize cache misses
Microservice mesh              Power of Two (P2C)          No coordination needed
Latency-critical API           Least Response Time         Directly optimizes latency
Shopping cart / sessions       IP Hash + fallback          Session affinity needed
High-value production          Resource-Based              Maximum utilization insight
A/B testing / canary           Weighted Round Robin        Control traffic split
```

### Interview Cheat Sheet

```
"How would you distribute traffic across servers?"

1. Start with Round Robin (simplest baseline)
2. If servers differ in capacity --> Weighted Round Robin
3. If request duration varies --> Least Connections
4. If both differ --> Weighted Least Connections
5. If you need sessions --> IP Hash or Consistent Hashing
6. If distributed (no central LB) --> Power of Two Choices
7. If latency matters most --> Least Response Time
8. If you have metrics --> Resource-Based (Adaptive)

Key insight: P2C is the interviewer's favorite.
It shows you understand the trade-off between
simplicity and optimality. One extra random pick
gives exponentially better distribution.
```

---

## Algorithm Complexity Summary

```
Algorithm                 Time per      Space        Coordination
                          Request       Required     Required
-----------------------   ----------    ----------   ---------------
Round Robin               O(1)          O(1)         Shared counter
Weighted Round Robin      O(1)          O(N)         Shared counter
Least Connections         O(N) or O(1)* O(N)         Per-server counts
W. Least Connections      O(N)          O(N)         Per-server counts
IP Hash                   O(1)          O(1)         None
Consistent Hashing        O(log N)      O(N * vnodes)Ring structure
Least Response Time       O(N)          O(N)         Response tracking
Random                    O(1)          O(1)         None
Power of Two Choices      O(1)          O(1)         Load of 2 servers
Resource-Based            O(N)          O(N * M)     Metric agents

* Least Connections can be O(1) with a min-heap
  N = number of servers, M = number of metrics tracked
```
