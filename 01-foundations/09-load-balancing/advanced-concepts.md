# Load Balancing: Advanced Concepts

---

## Health Checks

Health checks determine whether a backend server can receive traffic. Get them wrong and the LB sends requests to dead servers. Get them right and failures become invisible to users.

### Active Health Checks

The load balancer **proactively probes** each server at regular intervals. If a server fails N consecutive checks, it is removed from the pool. After it passes M checks, it is re-added.

```
Load Balancer                          Servers
     |                                    |
     |----> GET /health  ------->   Server A: 200 OK (healthy)
     |                                    |
     |----> GET /health  ------->   Server B: 200 OK (healthy)
     |                                    |
     |----> GET /health  ------->   Server C: 503 (unhealthy!)
     |                                    |
     |  (3 failures in a row)             |
     |  --> Remove Server C from pool     |
     |                                    |
     |  ... later ...                     |
     |                                    |
     |----> GET /health  ------->   Server C: 200 OK
     |----> GET /health  ------->   Server C: 200 OK
     |  (2 passes in a row)               |
     |  --> Re-add Server C to pool       |
```

**Types of active probes:**

```
Probe Type        What It Checks                  Config Example
--------------    ----------------------------    -------------------------
TCP Connect       Can open a TCP connection?      check inter 5s
HTTP GET          Returns 2xx from /health?       httpchk GET /health
HTTP with body    Response body contains "ok"?    expect string "ok"
gRPC              gRPC health check protocol      grpc_health_check
Script/command    Run custom check script         external-check /usr/local/bin/check.sh
```

**Health endpoint design -- what /health should check:**

```python
# GOOD: checks dependencies that would make this server unable to serve
@app.route('/health')
def health():
    checks = {
        'database': check_db_connection(),
        'cache': check_redis_ping(),
        'disk': check_disk_space() > MIN_DISK_GB,
    }
    if all(checks.values()):
        return jsonify(checks), 200
    else:
        return jsonify(checks), 503

# BAD: always returns 200 (does not detect degradation)
@app.route('/health')
def health():
    return "ok", 200

# BAD: too expensive (runs full DB query, slows down health checks)
@app.route('/health')
def health():
    result = db.execute("SELECT COUNT(*) FROM users")  # slow!
    return "ok", 200
```

### Passive Health Checks

The LB monitors **real traffic responses** rather than sending probes. If a server returns too many 5xx errors or times out, the LB marks it unhealthy.

```
Real traffic flow:
  Client --> LB --> Server A --> 200 OK        (count: 0 failures)
  Client --> LB --> Server A --> 200 OK        (count: 0 failures)
  Client --> LB --> Server A --> 502 Bad Gateway (count: 1 failure)
  Client --> LB --> Server A --> 503 Service    (count: 2 failures)
  Client --> LB --> Server A --> 502 Bad Gateway (count: 3 failures)
  --> 3 failures in 10s window --> mark Server A unhealthy

Envoy calls this "outlier detection":
  - Consecutive 5xx errors
  - Success rate threshold (e.g., < 90% success)
  - Latency threshold (e.g., p99 > 5s)
```

**Pros of passive:** no extra probe traffic, detects real-world issues, instant detection.
**Cons of passive:** needs actual traffic to detect (cold server stays unknown), one real user gets the error.

**Best practice:** use **both** active and passive together. Active catches servers that are completely down. Passive catches servers that are up but degraded.

### Kubernetes: Liveness vs Readiness vs Startup

```yaml
# Kubernetes pod health check configuration
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: app
      # Startup Probe: is the app done initializing?
      # Failure: restart the container
      # Runs first; other probes disabled until this passes
      startupProbe:
        httpGet:
          path: /healthz
          port: 8080
        failureThreshold: 30     # allow 30 * 10s = 5 min to start
        periodSeconds: 10

      # Liveness Probe: is the app still alive?
      # Failure: restart the container (kill + recreate)
      # Detects deadlocks, infinite loops, zombie processes
      livenessProbe:
        httpGet:
          path: /healthz
          port: 8080
        initialDelaySeconds: 15
        periodSeconds: 10
        failureThreshold: 3

      # Readiness Probe: can the app handle traffic?
      # Failure: remove from Service endpoints (stop sending traffic)
      # Does NOT restart -- just removes from LB pool
      readinessProbe:
        httpGet:
          path: /ready
          port: 8080
        periodSeconds: 5
        failureThreshold: 3
```

```
Probe         On Failure                    Use For
-----------   --------------------------    -------------------------
Startup       Restart container             Slow-starting apps (JVM warmup)
Liveness      Restart container             Detecting deadlocks / hangs
Readiness     Remove from LB (Service)      Graceful startup/shutdown,
              but keep container running     temporary overload
```

---

## Session Persistence (Sticky Sessions)

Sticky sessions ensure that a client's requests consistently reach the **same backend server**. Needed when server-side state (session, cache, WebSocket connection) is not shared across servers.

### Cookie-Based Sticky Sessions

```
First request:
  Client ---> LB ---> picks Server B
  Client <--- LB <--- response + Set-Cookie: SERVERID=server-b

Subsequent requests:
  Client ---> LB (Cookie: SERVERID=server-b) ---> Server B (always)
  Client ---> LB (Cookie: SERVERID=server-b) ---> Server B (always)
```

**HAProxy cookie-based stickiness:**

```
backend web_servers
    balance roundrobin
    cookie SERVERID insert indirect nocache
    server web1 10.0.1.1:8080 check cookie s1
    server web2 10.0.1.2:8080 check cookie s2
    server web3 10.0.1.3:8080 check cookie s3
```

### IP-Based Sticky Sessions

```
hash(client_ip) % N = server_index

Client 10.1.2.3 --> always Server A
Client 10.4.5.6 --> always Server C

Problem: clients behind corporate NAT share one IP
         --> all routed to same server --> hot spot
```

### Trade-Offs of Sticky Sessions

```
Problem                          Impact
-------------------------------  ------------------------------------------
Uneven distribution              Popular clients stack on one server
Server failure                   All sticky clients lose their sessions
Scaling events                   New server gets no traffic (existing clients
                                 stick to old servers)
Deployment complexity            Rolling deploy must drain sessions first
Horizontal scaling limit         Cannot scale freely if sessions are pinned
```

### When Sticky Sessions Are Needed

```
Scenario                      Why Needed                   Better Alternative
---------------------------   --------------------------   ----------------------
Shopping cart in memory        Cart state on server         Externalize to Redis
WebSocket connections          Connection is stateful       (Inherently sticky)
File upload chunks             Chunks must reach same       Shared storage (S3)
                               server
In-memory cache warming        Repeated queries to same     Distributed cache
                               server hit warm cache
Legacy apps with server        App stores session in        Migrate to external
session state                  local memory                 session store (Redis)
```

**Best practice:** avoid sticky sessions by externalizing state. Use Redis, Memcached, or a database for session storage. Then any server can handle any request, and the LB has full freedom.

---

## SSL/TLS Termination

Three approaches to handling TLS encryption at the load balancer.

### Option 1: SSL Termination at LB

```
Client                  LB                   Server
  |                      |                      |
  |--- HTTPS (TLS) ---->|                      |
  |                      |--- HTTP (plain) ---->|
  |                      |<--- HTTP (plain) ----|
  |<--- HTTPS (TLS) ----|                      |

  LB decrypts. Server receives plain HTTP.
  LB has the TLS certificate + private key.
```

**Pros:**
- Servers freed from TLS overhead (no crypto CPU cost)
- Centralized certificate management (one place to renew certs)
- LB can inspect HTTP content (required for L7 routing)
- Simpler server configuration

**Cons:**
- Traffic between LB and servers is unencrypted
- LB becomes a high-value target (holds private keys)
- Compliance may require end-to-end encryption

### Option 2: SSL Passthrough

```
Client                  LB                   Server
  |                      |                      |
  |--- HTTPS (TLS) ---->|--- HTTPS (TLS) ---->|
  |                      |                      |
  |<--- HTTPS (TLS) ----|<--- HTTPS (TLS) ----|

  LB forwards encrypted traffic. Cannot read content.
  Each server has its own TLS certificate.
  LB can only do L4 routing (IP/port).
```

**Pros:**
- End-to-end encryption (compliance: PCI-DSS, HIPAA)
- LB never sees plain text (reduced attack surface)
- Server controls its own certificates

**Cons:**
- LB cannot do L7 routing (cannot read HTTP)
- Each server needs its own certificate
- No content-based routing, no header manipulation

### Option 3: SSL Re-encryption (SSL Bridging)

```
Client                  LB                   Server
  |                      |                      |
  |--- HTTPS (TLS) ---->|--- HTTPS (TLS) ---->|
  |   (public cert)      |   (internal cert)    |
  |                      |                      |

  LB terminates client TLS, reads HTTP, re-encrypts
  with an internal certificate to the backend.
  Two TLS sessions: client-to-LB and LB-to-server.
```

**Pros:**
- End-to-end encryption (satisfies compliance)
- LB can still inspect and route HTTP traffic
- Internal certs can be self-signed (cheaper)

**Cons:**
- Double TLS overhead (terminate + re-establish)
- More complex certificate management
- Higher latency (two handshakes)

### Decision Guide

```
Requirement                    Choose
------------------------------  -------------------------
Max performance, internal LB   SSL Termination at LB
Compliance requires e2e TLS    SSL Re-encryption
Cannot touch server certs      SSL Termination at LB
No L7 routing needed + e2e     SSL Passthrough
Service mesh (mTLS)            Re-encryption (automatic)
```

---

## Connection Draining (Graceful Shutdown)

When removing a server from the pool (for deployment, scaling, or maintenance), in-flight requests must complete before the server is shut down.

```
Without connection draining:
  Time 0:  Server removed from pool
  Time 0:  50 in-flight requests DROPPED --> 50 errors!

With connection draining:
  Time 0:  Server marked "draining" -- no NEW requests
  Time 0-30s:  50 in-flight requests complete normally
  Time 30s:  Server has 0 connections --> safe to shut down
```

```
                     LB
                      |
         +-----------+-----------+
         |           |           |
      Server A    Server B    Server C
      (active)    (draining)  (active)
                      |
                  No new requests
                  Existing requests
                  finish (30s timeout)
                      |
                  0 connections
                      |
                  Safe to terminate
```

**AWS configuration:** deregistration delay (default 300s)
**Kubernetes:** `terminationGracePeriodSeconds` + `preStop` hook
**Nginx:** `proxy_next_upstream` + drain on SIGQUIT

---

## Avoiding the Load Balancer as a Single Point of Failure

The LB routes all traffic. If it dies, everything dies. Solutions:

### Active-Passive (Failover) Pair

```
         Floating IP / VIP: 50.0.0.1
              |
  +-----------+-----------+
  |                       |
  LB Primary          LB Standby
  (active)             (passive)
  |                       |
  Heartbeat <----------->|
  (VRRP / keepalived)    |
                          |
  If primary dies:        |
    Standby claims VIP -->|
    Takes over in <5s     |
```

**How it works:**
- Two LBs with a shared Virtual IP (VIP)
- Primary handles all traffic
- Standby monitors primary via heartbeat (VRRP, keepalived)
- If primary fails, standby claims the VIP (< 5 second failover)
- Only 50% utilization (standby is idle during normal operation)

### Active-Active Pair

```
         DNS: app.example.com
              |
    +---------+---------+
    |                   |
  LB-1 (IP: 50.0.0.1)  LB-2 (IP: 50.0.0.2)
    |                   |
    +---+---+---+       +---+---+---+
    |   |   |           |   |   |
   S1  S2  S3         S1  S2  S3  (same backend pool)

  Both LBs active. DNS returns both IPs.
  If LB-1 fails, DNS health check removes its IP.
  100% utilization of both LBs.
```

**How it works:**
- Both LBs actively handle traffic
- DNS returns both IPs (or ECMP routing at L3)
- If one fails, DNS removes it (or BGP withdraws the route)
- Better utilization but more complex (shared state, session sync)

### Cloud-Managed LBs

Cloud LBs (ALB, NLB, GCP LB) are inherently highly available. The cloud provider manages redundancy across AZs. You do not need to build failover yourself.

```
AWS ALB internals (managed by AWS):
  - Multiple LB nodes across AZs
  - Automatic failover if a node dies
  - Auto-scaling LB capacity based on traffic
  - You just get a DNS name (no single IP to fail)
```

---

## Reverse Proxy vs Load Balancer

These overlap heavily but are conceptually distinct.

```
Feature                  Reverse Proxy              Load Balancer
-----------------------  -------------------------  -------------------------
Primary purpose          Shield backend servers     Distribute traffic evenly
Backend count            1 or more                  2 or more (always)
Routing decision         Usually fixed              Algorithm-based
Health checks            Optional                   Essential
SSL termination          Common                     Common
Caching                  Yes (often)                Rarely
Compression              Yes                        Sometimes
Security (WAF, auth)     Yes                        Sometimes
Request rewriting        Yes                        Sometimes

A load balancer IS a reverse proxy that routes to multiple backends.
A reverse proxy is NOT necessarily a load balancer (can proxy to one backend).
```

**In practice:** Nginx, HAProxy, and Envoy act as both reverse proxies and load balancers simultaneously. The distinction is academic in most system design interviews, but knowing it shows depth.

---

## Global Server Load Balancing (GSLB)

Routes users to the **geographically closest** (or healthiest) datacenter. Operates at the DNS layer or via anycast.

```
User in Tokyo                        User in New York
     |                                    |
     v                                    v
  DNS Query: app.example.com           DNS Query: app.example.com
     |                                    |
     v                                    v
  GSLB DNS Server                      GSLB DNS Server
  (checks latency, health, load)       (checks latency, health, load)
     |                                    |
     v                                    v
  Returns: 10.0.1.1 (Tokyo DC)        Returns: 10.0.2.1 (Virginia DC)
     |                                    |
     v                                    v
  Tokyo Datacenter                     Virginia Datacenter
  [LB] --> [Servers]                   [LB] --> [Servers]
```

**GSLB Routing Policies:**

```
Policy              How It Works                     Use Case
-----------------   ----------------------------     ----------------------
Geographic          Route by client's country/region  Data sovereignty, GDPR
Latency-based       Route to lowest-latency DC        Performance optimization
Weighted            Percentage split across DCs        Gradual migration
Failover            Primary DC, fail to secondary      Disaster recovery
Round Robin         Rotate across all DCs              Simple distribution
```

**Real-World:** AWS Route 53, Cloudflare Load Balancing, GCP Cloud DNS, Akamai GTM.

---

## Auto-Scaling Integration

Load balancers work hand-in-hand with auto-scaling to dynamically adjust capacity.

```
                Metrics (CPU > 70%)
                       |
                       v
              +------------------+
              | Auto-Scaler      |   Launches new instances
              | (AWS ASG /       |
              |  K8s HPA)        |
              +--------+---------+
                       |
                       | Registers new targets
                       v
              +------------------+
              | Load Balancer    |   Starts routing traffic
              |                  |   to new instances after
              |                  |   health check passes
              +------------------+
                       |
              +--------+--------+--------+
              |        |        |        |
            Srv 1    Srv 2    Srv 3    Srv 4 (new!)

Scale-In Flow:
  1. Auto-scaler decides to remove Srv 4
  2. LB marks Srv 4 as "draining" (no new connections)
  3. In-flight requests on Srv 4 complete
  4. LB deregisters Srv 4
  5. Auto-scaler terminates Srv 4
```

**Key configuration points:**
- **Health check grace period**: give new instances time to start before checking
- **Deregistration delay**: time to drain connections before removal
- **Cooldown period**: prevent scale-in/scale-out thrashing
- **Warm pool**: pre-initialized instances for faster scaling

---

## Interview Questions with Answers

### Q1: "How would you design a load balancer for a web application?"

```
Answer structure:

1. DNS Layer: Route 53 with latency-based routing for multi-region
2. L4 Layer: NLB for TCP distribution, static IP, DDoS protection
3. L7 Layer: ALB or Nginx for HTTP routing, SSL termination

   /api/*    --> API service auto-scaling group
   /web/*    --> Web server auto-scaling group
   /static/* --> S3 + CloudFront (CDN, not LB)

4. Algorithm: Start with round robin. If services vary:
   - Weighted round robin for canary deployments
   - Least connections for WebSocket/streaming

5. Health checks: Active (HTTP GET /health every 10s) + passive (5xx tracking)
6. HA: Cloud-managed ALB is inherently HA. For self-hosted: keepalived VIP pair.
7. Session: Externalize to Redis. No sticky sessions if possible.
8. SSL: Terminate at ALB, plain HTTP to backends (internal VPC is trusted).
```

### Q2: "Your load balancer is the bottleneck. How do you fix it?"

```
1. Horizontal scaling: Add more LB instances behind DNS round robin
2. L4 in front of L7: NLB distributes to multiple ALB/Nginx instances
3. Client-side LB: Service mesh eliminates central LB for east-west traffic
4. DNS-based LB: Distribute at DNS level before traffic reaches any LB
5. Optimize LB: Enable keep-alive, connection pooling, tune buffers
6. Offload: Move static content to CDN, reducing LB traffic
7. DSR (Direct Server Return): Responses bypass LB entirely
```

### Q3: "How do you handle session state with load balancing?"

```
Bad approach: Sticky sessions (pin client to server)
  - Uneven load, session loss on server failure

Good approach: Externalize state
  - Store sessions in Redis/Memcached (shared, fast)
  - Store sessions in database (shared, slower, durable)
  - Use JWT tokens (stateless, client carries state)

  Any server can handle any request. LB has full freedom.
  Server failure has zero session impact.
```

### Q4: "Explain the difference between L4 and L7 load balancing."

```
L4: Operates at transport layer. Sees IP+port. Fast (microsecond overhead),
    protocol-agnostic, cannot read HTTP. Use for TCP services, high throughput.

L7: Operates at application layer. Reads HTTP headers, paths, cookies.
    Can do smart routing, SSL termination, auth. Adds 1-5ms latency.
    Use for microservices, API gateways.

Production: Stack both. L4 (NLB) in front for raw TCP distribution,
L7 (ALB/Nginx) behind for HTTP-smart routing.
```

### Q5: "What is consistent hashing and when would you use it?"

```
Maps servers and keys onto a hash ring. When a server is added/removed,
only K/N keys are remapped (instead of almost all keys with modulo hashing).

Use for: distributed caches (Memcached, Redis), distributed databases
(Cassandra, DynamoDB), CDN origin selection -- anywhere remapping is expensive.

Virtual nodes (100-200 per server) ensure even distribution.
```

---

## Cheat Sheet: Load Balancing in System Design Interviews

```
+-------------------------------+--------------------------------------------+
| Topic                         | Key Point to Mention                       |
+-------------------------------+--------------------------------------------+
| First thing to say            | "I'd use an L7 LB like ALB/Nginx for      |
|                               | HTTP routing with health checks"           |
+-------------------------------+--------------------------------------------+
| Algorithm                     | "Round robin for homogeneous, least-conn   |
|                               | for variable workloads, P2C for distributed"|
+-------------------------------+--------------------------------------------+
| L4 vs L7                      | "L4 for raw TCP/performance, L7 for smart  |
|                               | HTTP routing. Often stack both."           |
+-------------------------------+--------------------------------------------+
| SPOF                          | "Cloud LBs are managed HA. Self-hosted:    |
|                               | active-passive with VRRP/keepalived"       |
+-------------------------------+--------------------------------------------+
| Session state                 | "Externalize to Redis. Avoid sticky sessions|
|                               | -- they break even distribution"           |
+-------------------------------+--------------------------------------------+
| SSL                           | "Terminate at LB for performance. Re-encrypt|
|                               | if compliance requires end-to-end"         |
+-------------------------------+--------------------------------------------+
| Health checks                 | "Active (probe /health) + passive (monitor |
|                               | 5xx). K8s: liveness + readiness probes"    |
+-------------------------------+--------------------------------------------+
| Scaling                       | "LB + auto-scaling group. Health check     |
|                               | grace period, connection draining"         |
+-------------------------------+--------------------------------------------+
| Global                        | "DNS LB (Route 53) for multi-region, then  |
|                               | L4/L7 per datacenter"                      |
+-------------------------------+--------------------------------------------+
| Consistent hashing            | "For caches and distributed DBs. Virtual   |
|                               | nodes for even distribution. K/N remap"    |
+-------------------------------+--------------------------------------------+
| Show depth with               | "Power of Two Random Choices: pick 2       |
|                               | random servers, choose less loaded.        |
|                               | O(log log n) max load. Used in Envoy."    |
+-------------------------------+--------------------------------------------+
```
