# L4 vs L7 Load Balancing

---

## The Layer Model (Quick Reference)

```
OSI Layer    Name           What LB Sees              LB Type
---------    -----------    -----------------------   --------
Layer 4      Transport      IP + Port + TCP/UDP       L4 LB
                            (source/dest only)

Layer 7      Application    HTTP headers, URL path,   L7 LB
                            cookies, body content,
                            gRPC metadata, etc.
```

**The core trade-off:** L4 is faster but dumber. L7 is smarter but slower. DNS is global but cached. Client-side is precise but complex.

---

## L4 Load Balancer (Transport Layer)

### How It Works

Operates at the TCP/UDP level. Reads the packet's **source IP, destination IP, source port, destination port, and protocol**. Makes a routing decision based on these 5-tuple values **without reading the application payload**.

The LB does NOT open HTTP, does NOT parse headers, does NOT understand URLs. It sees a TCP stream and forwards it.

### ASCII Diagram

```
  Client (10.1.2.3:54321)
    |
    |  TCP SYN to LB (50.0.0.1:443)
    v
+------------------+
|   L4 Load        |   Sees: src=10.1.2.3:54321, dst=50.0.0.1:443
|   Balancer       |   Decision: forward to Server B (based on algorithm)
|                  |   Does NOT read HTTP content inside the TCP stream
+------------------+
    |
    |  Rewrites dst to 192.168.1.2:8080
    v
  Server B (192.168.1.2:8080)

  The entire TCP connection is proxied at the packet level.
  TLS, HTTP, gRPC, custom protocols -- all pass through opaquely.
```

### Two Forwarding Modes

```
1. NAT Mode (most common):
   Client --> LB --> Server
   LB rewrites destination IP/port. Server sees LB as client.
   Return traffic: Server --> LB --> Client (LB rewrites source back)

2. DSR (Direct Server Return):
   Client --> LB --> Server
                     Server --> Client (bypasses LB on return path!)

   Much faster for asymmetric traffic (small request, large response).
   Server must be configured to accept traffic for LB's IP.

   DSR Flow:
   Client ----request----> LB ----request----> Server
   Client <---response------------------------Server  (direct!)
```

### What L4 CAN Do
- Route based on destination port (port 443 -> HTTPS servers, port 3306 -> DB servers)
- TCP connection-level load balancing
- UDP load balancing (DNS, gaming, VoIP)
- Health checks (TCP connect, TCP half-open)
- TLS passthrough (encrypted traffic stays encrypted)
- Protocol-agnostic: works with any TCP/UDP protocol

### What L4 CANNOT Do
- Path-based routing (/api -> service A, /web -> service B)
- Header inspection (no reading Host, Authorization, cookies)
- Content modification or injection
- SSL termination (it does not read TLS -- just passes it through)
- A/B testing based on headers or cookies
- Rate limiting by API key or user

### Performance Characteristics
- **Throughput**: millions of connections/sec (kernel-level, minimal processing)
- **Latency**: microseconds of added latency
- **CPU**: minimal (no content parsing)
- **Memory**: connection table only (no buffering HTTP bodies)

### When to Use L4
- High-throughput TCP services (database proxies, message brokers)
- Non-HTTP protocols (MQTT, custom TCP, gaming)
- When you need TLS passthrough (end-to-end encryption)
- UDP workloads (DNS, VoIP, video streaming)
- Putting L4 in front of L7 LBs (common pattern)
- Extreme performance requirements (millions of req/sec)

### Real-World Examples
- **AWS NLB**: Layer 4, handles millions of requests/sec, static IP
- **Linux IPVS**: kernel-level L4 LB used by kube-proxy in IPVS mode
- **HAProxy TCP mode**: `mode tcp` in configuration
- **Maglev** (Google): custom L4 LB for Google's frontend

---

## L7 Load Balancer (Application Layer)

### How It Works

Terminates the TCP connection from the client, reads the full HTTP request (method, path, headers, cookies, body), makes a routing decision, then opens a **new** TCP connection to the chosen backend server. It is an HTTP-aware reverse proxy.

### ASCII Diagram

```
  Client
    |
    |  HTTPS request:
    |  GET /api/users HTTP/1.1
    |  Host: myapp.com
    |  Cookie: session=abc123
    v
+--------------------+
|   L7 Load          |   1. Terminates TLS (has the certificate)
|   Balancer         |   2. Reads HTTP: path=/api/users, Host=myapp.com
|                    |   3. Checks routing rules:
|   Routing Rules:   |      /api/*   --> API service cluster
|   /api/* -> API    |      /web/*   --> Web service cluster
|   /web/* -> Web    |      /static/* -> CDN / cache
|   /static/* -> CDN |   4. Forwards to API server
+--------------------+
    |
    |  New HTTP connection to backend
    |  GET /api/users HTTP/1.1
    |  X-Forwarded-For: <client IP>
    |  X-Request-ID: <trace ID>
    v
  API Server (192.168.1.5:8080)
```

### Routing Capabilities

```
L7 Routing Dimension     Example                          Use Case
-----------------------  ------------------------------   -------------------------
URL Path                 /api/v2/* --> v2-service          API versioning
Host Header              api.foo.com --> API cluster       Multi-tenant, microservices
HTTP Method              POST /upload --> upload-service   Specialized handlers
HTTP Headers             X-Beta: true --> canary-service   Feature flags, A/B testing
Cookies                  session_id=abc --> Server-3       Sticky sessions
Query Parameters         ?region=eu --> eu-cluster         Geo routing
Content Type             application/grpc --> gRPC-pool    Protocol-based routing
Client Certificate       CN=admin --> admin-service        mTLS-based routing
```

### What L7 CAN Do
- **Path-based routing**: `/api` to one cluster, `/web` to another
- **Host-based routing**: `api.example.com` vs `admin.example.com`
- **Header manipulation**: add X-Forwarded-For, inject trace IDs, strip headers
- **SSL/TLS termination**: decrypt once at the LB, forward plain HTTP to backends
- **Content compression**: gzip responses before sending to client
- **Request rewriting**: change URL paths, add/remove query parameters
- **Rate limiting**: by API key, user ID, or IP (reads from headers/cookies)
- **Authentication**: validate JWT tokens before forwarding
- **WebSocket support**: upgrade HTTP to WebSocket, route by path
- **Canary/A/B routing**: split traffic by cookie, header, or percentage

### What L7 COSTS
- Must terminate and re-establish TCP connections (two TCP handshakes)
- Must buffer and parse HTTP (CPU + memory for large payloads)
- TLS termination is CPU-intensive (but offloaded with hardware/AES-NI)
- Higher latency than L4 (typically 1-5ms added)
- More complex configuration and more things that can break

### Performance Characteristics
- **Throughput**: hundreds of thousands of req/sec (per instance)
- **Latency**: 1-5ms added (TLS termination + HTTP parsing)
- **CPU**: moderate to high (TLS, parsing, routing logic)
- **Memory**: buffers HTTP requests/responses

### When to Use L7
- Microservices architectures (path/host-based routing)
- API gateways (auth, rate limiting, transformation)
- SSL/TLS termination (centralized certificate management)
- A/B testing and canary deployments
- WebSocket applications
- Content-based routing (gRPC, GraphQL)
- When you need observability (HTTP-level metrics, access logs)

### Real-World Examples
- **AWS ALB**: L7, path/host routing, WebSocket, gRPC
- **Nginx**: reverse proxy mode with upstream routing
- **Envoy**: sidecar proxy in service meshes (Istio)
- **Traefik**: auto-discovery with Docker/Kubernetes labels

---

## L4 in Front of L7 (Common Production Pattern)

```
Internet
    |
    v
+--------+      +--------+      +--------+
|  L4 LB |----->|  L7 LB |----->| Service|
| (NLB)  |  +-->| (ALB)  |--+-->|  A     |
|        |  |   | (Nginx)|  |   +--------+
+--------+  |   +--------+  |   +--------+
            |   +--------+  +-->| Service|
            +-->|  L7 LB |      |  B     |
                | (Nginx)|      +--------+
                +--------+

  L4 handles: raw TCP/UDP distribution, TLS passthrough,
              DDoS absorption, static IPs
  L7 handles: HTTP routing, SSL termination, header manipulation,
              auth, rate limiting
```

This is **extremely common** in production:
- L4 provides the stable entry point (static IP, high throughput)
- L7 provides the smart routing (microservice dispatching)
- Together they provide defense in depth (L4 absorbs L3/L4 DDoS, L7 handles L7 attacks)

---

## DNS Load Balancing

### How It Works

The DNS server returns **different IP addresses** for the same domain name. Each client resolves the domain and connects directly to the returned IP. Distribution happens at the DNS resolution level, not at a proxy.

### ASCII Diagram

```
  Client A                           Client B
    |                                   |
    | DNS: app.example.com?             | DNS: app.example.com?
    v                                   v
+------------------------------------------+
|            DNS Server                     |
|                                           |
|  app.example.com -->                      |
|    10.0.1.1  (DC East, weight=50)         |
|    10.0.2.1  (DC West, weight=50)         |
|    10.0.3.1  (DC EU,   weight=30)         |
|                                           |
|  Returns different IPs based on:          |
|    - Round robin                          |
|    - Geographic proximity                 |
|    - Latency measurements                 |
|    - Health checks                        |
+------------------------------------------+
    |                                   |
    | Response: 10.0.1.1                | Response: 10.0.2.1
    v                                   v
  Client A --> DC East               Client B --> DC West
  (directly)                         (directly)
```

### DNS Resolution Strategies

```
Strategy              How It Works                     Example
--------------------  ----------------------------     ------------------
Round Robin DNS       Rotate through A records         Simple multi-server
Weighted DNS          Return IPs proportional to       Canary deployments
                      weights
Geo-Based DNS         Return nearest datacenter IP     Route53 geolocation
Latency-Based DNS     Return lowest-latency DC         Route53 latency-based
Failover DNS          Return backup if primary         Active-passive DR
                      health check fails
```

### The DNS Caching Problem

```
  Time 0:  Client resolves app.com --> 10.0.1.1 (TTL=300s)
  Time 30:  Server 10.0.1.1 goes DOWN
  Time 30:  DNS updated to remove 10.0.1.1
  Time 30-300:  Client STILL connects to 10.0.1.1 (cached!)
                Other clients with cached DNS: also broken.

  Problem: DNS TTL means stale routing for minutes.
  Low TTL helps but increases DNS query volume.
  Some clients/resolvers ignore TTL entirely.
```

### Pros
- No infrastructure needed (just DNS configuration)
- Global distribution across datacenters
- No single point of failure (DNS is distributed)
- Can route by geography, latency, or health
- Works with any protocol (not just HTTP)

### Cons
- **DNS caching**: clients see stale IPs for TTL duration
- **Limited health checking**: slower to detect and react to failures
- **No connection awareness**: cannot balance by load or connections
- **Client behavior**: some clients cache forever, some always pick first IP
- **No content-based routing**: cannot route by URL path or header

### When to Use DNS LB
- Multi-datacenter / multi-region distribution
- CDN-like global traffic management
- As the first layer before L4/L7 LBs
- Disaster recovery failover
- When you need anycast-like behavior without BGP

### Real-World Examples
- **AWS Route 53**: weighted, latency, geolocation, failover policies
- **Cloudflare DNS**: global load balancing with health checks
- **Google Cloud DNS**: geo-routing policies

---

## Client-Side Load Balancing

### How It Works

The client itself decides which server to connect to. The client discovers available servers through a **service registry** (e.g., Consul, Eureka, etcd, Kubernetes DNS) and applies a load balancing algorithm locally. No proxy in the middle.

### ASCII Diagram

```
+-------------------+
| Service Registry  |     Servers register themselves
| (Consul / etcd /  |<--- Server A: 10.0.1.1:8080 (healthy)
|  K8s DNS)         |<--- Server B: 10.0.1.2:8080 (healthy)
|                   |<--- Server C: 10.0.1.3:8080 (unhealthy)
+-------------------+
        |
        | Service A has instances: [A, B]  (C excluded, unhealthy)
        v
+-------------------+
|  Client / Sidecar |   Local LB algorithm:
|                   |     - Round robin among [A, B]
|  Service Discovery|     - Or P2C, least connections, etc.
|  + LB Logic       |
+-------------------+
    |           |
    v           v
  Server A    Server B
  (direct)    (direct)

  No proxy hop! Client connects directly to the chosen server.
```

### Service Mesh Model (Sidecar Proxy)

```
+-------------+    +-------------+    +-------------+
|  Service X  |    |  Service Y  |    |  Service Z  |
|  (app code) |    |  (app code) |    |  (app code) |
+------+------+    +------+------+    +------+------+
       |                  |                  |
+------+------+    +------+------+    +------+------+
|   Envoy     |    |   Envoy     |    |   Envoy     |
|   Sidecar   |--->|   Sidecar   |--->|   Sidecar   |
|   (LB here) |    |   (LB here) |    |   (LB here) |
+-------------+    +-------------+    +-------------+

  Each sidecar:
    - Discovers endpoints from control plane (Istio, Consul Connect)
    - Applies LB algorithm (P2C, round robin, etc.)
    - Handles retries, circuit breaking, timeouts
    - Reports metrics (latency, success rate)
```

### Pros
- **No proxy hop**: lower latency (direct connection)
- **No SPOF**: no central LB to fail
- **Per-client decisions**: can customize routing per service
- **Rich context**: client knows its own request pattern

### Cons
- LB logic in every client (or sidecar) -- more to maintain
- Client must handle service discovery, health checking
- Harder to debug (routing decisions distributed across clients)
- Language-specific implementations needed (or use sidecar)
- Stale endpoint lists if service registry is slow

### When to Use Client-Side LB
- Microservices with service mesh (Istio, Linkerd)
- gRPC services (gRPC has built-in client-side LB)
- High-performance internal services (eliminate proxy hop)
- When central LB is a bottleneck or SPOF concern

### Real-World Examples
- **gRPC**: built-in client-side LB with pluggable resolvers
- **Netflix Ribbon / Spring Cloud LoadBalancer**: client-side LB library
- **Envoy sidecar**: in Istio/Consul Connect service mesh
- **Kubernetes**: kube-proxy does client-side LB via iptables/IPVS

---

## Comparison Table: L4 vs L7 vs DNS vs Client-Side

```
+---------------------+------------------+------------------+------------------+------------------+
| Feature             | L4 LB            | L7 LB            | DNS LB           | Client-Side LB   |
+---------------------+------------------+------------------+------------------+------------------+
| OSI Layer           | Transport (4)    | Application (7)  | Application (7)  | Application (7)  |
+---------------------+------------------+------------------+------------------+------------------+
| Sees                | IP + Port        | Full HTTP/gRPC   | Domain name      | Service registry |
|                     | TCP/UDP headers  | Headers, path,   | resolution       | endpoints list   |
|                     |                  | cookies, body    |                  |                  |
+---------------------+------------------+------------------+------------------+------------------+
| Routing By          | IP, port,        | URL path, host,  | Geo, latency,    | Any algorithm    |
|                     | protocol         | header, cookie,  | weight, health   | (round robin,    |
|                     |                  | method, content  |                  | P2C, etc.)       |
+---------------------+------------------+------------------+------------------+------------------+
| SSL/TLS             | Passthrough      | Termination      | N/A              | End-to-end or    |
|                     | (no termination) | (reads content)  |                  | sidecar terminates|
+---------------------+------------------+------------------+------------------+------------------+
| Latency Added       | Microseconds     | 1-5 ms           | DNS TTL delay    | None (direct)    |
+---------------------+------------------+------------------+------------------+------------------+
| Throughput          | Millions req/s   | 100K+ req/s      | Unlimited        | Per-client limit |
|                     |                  | (per instance)   | (no proxy)       | (no proxy)       |
+---------------------+------------------+------------------+------------------+------------------+
| Health Checks       | TCP connect,     | HTTP GET /health,| DNS health check | Service registry |
|                     | TCP half-open    | response codes,  | (slower)         | heartbeat        |
|                     |                  | body content     |                  |                  |
+---------------------+------------------+------------------+------------------+------------------+
| Session Affinity    | IP hash          | Cookie, header,  | Client caches IP | Client controls  |
|                     |                  | URL hash         |                  |                  |
+---------------------+------------------+------------------+------------------+------------------+
| Protocol Support    | Any TCP/UDP      | HTTP/1.1, HTTP/2,| Any (DNS level)  | Any              |
|                     |                  | gRPC, WebSocket  |                  |                  |
+---------------------+------------------+------------------+------------------+------------------+
| SPOF Risk           | Yes (needs HA)   | Yes (needs HA)   | No (distributed) | No (distributed) |
+---------------------+------------------+------------------+------------------+------------------+
| Complexity          | Low              | Medium-High      | Low              | High             |
+---------------------+------------------+------------------+------------------+------------------+
| Best For            | High throughput, | Microservices,   | Multi-DC,        | Service mesh,    |
|                     | non-HTTP, front  | API gateway,     | global routing,  | gRPC, internal   |
|                     | of L7            | smart routing    | DR failover      | microservices    |
+---------------------+------------------+------------------+------------------+------------------+
```

---

## Decision Guide: Choosing the Right LB Type

```
START
  |
  v
Multi-datacenter / global routing needed?
  |              |
  YES            NO
  |              |
  v              v
DNS LB       Is the protocol HTTP/gRPC?
(first layer)    |            |
  |              YES          NO (raw TCP, UDP, custom)
  +              |            |
  |              v            v
  |         Need smart        L4 LB
  |         routing?          (HAProxy TCP mode, NLB)
  |         (path, header,
  |          cookie, auth)
  |           |        |
  |          YES       NO
  |           |        |
  |           v        v
  |         L7 LB    L4 LB
  |         (ALB,    (simpler, faster)
  |          Nginx,
  |          Envoy)
  |
  v
Also use DNS LB in front of L4/L7 for global distribution.
Use client-side LB in service mesh for internal traffic.
```

### Common Production Architecture

```
Internet
    |
    v
[DNS LB]  (Route 53: geo + latency + failover)
    |
    v
[L4 LB]   (NLB: static IP, DDoS absorption, TCP distribution)
    |
    v
[L7 LB]   (ALB/Nginx/Envoy: path routing, SSL termination, auth)
    |
    +-------+-------+-------+
    |       |       |       |
    v       v       v       v
  API     Web     Admin   gRPC
  Service Service Service Service

Internal (east-west) traffic:
  Service A --[Envoy sidecar / client-side LB]--> Service B
```

---

## Interview Tips

```
"What's the difference between L4 and L7 load balancing?"

L4 operates at the transport layer -- it sees IP addresses and ports but
NOT the HTTP content. It's fast (microsecond overhead) but dumb (cannot
route by URL or header). Use for high-throughput non-HTTP or as a front
layer.

L7 operates at the application layer -- it fully parses HTTP, reads paths,
headers, cookies, and can make smart routing decisions. It adds 1-5ms
latency but enables microservice routing, A/B testing, and SSL termination.

In production, you often stack them: DNS for global routing, L4 for TCP
distribution, L7 for HTTP-smart routing. Internally, service mesh sidecars
provide client-side LB between microservices.
```
