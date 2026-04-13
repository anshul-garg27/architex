# DNS Deep Dive: The Domain Name System

---

## What DNS Does

DNS is the **phone book of the internet**. It translates human-readable domain names (`google.com`) into machine-routable IP addresses (`142.250.80.46`).

Without DNS, you would type `https://142.250.80.46` into your browser. Every time Google changed IPs, every bookmark would break.

**Scale:** The global DNS system handles **trillions of queries per day**. It is one of the most critical pieces of internet infrastructure and one of the most distributed databases ever built.

---

## DNS Resolution Process

When you type `www.example.com` in your browser, this happens:

### Step-by-Step

1. **Browser cache** -- Browser checks its own DNS cache (Chrome: `chrome://net-internals/#dns`)
2. **OS cache** -- OS-level resolver cache (`/etc/hosts` file is also checked here)
3. **Recursive resolver** -- Your ISP's or configured resolver (e.g., 8.8.8.8, 1.1.1.1) takes over
4. **Root nameserver** -- Resolver asks root "Who handles .com?"
5. **TLD nameserver** -- Resolver asks .com TLD "Who handles example.com?"
6. **Authoritative nameserver** -- Resolver asks example.com's nameserver "What is www.example.com?"
7. **Response cached** -- Resolver caches the answer and returns it to client

### Full Resolution Flow

```
Browser           OS             Recursive         Root         TLD (.com)    Authoritative
Cache             Cache          Resolver          Server       Server        (example.com)
  |                |                |                |              |              |
  |--check-------->|                |                |              |              |
  |  MISS          |--check-------->|                |              |              |
  |                |  MISS          |                |              |              |
  |                |                |--"www.example.com?"---------->|              |
  |                |                |<--"Ask .com TLD at x.x.x.x"--|              |
  |                |                |                               |              |
  |                |                |--"www.example.com?"----------->              |
  |                |                |<--"Ask ns1.example.com at y.y.y.y"----------|
  |                |                |                                              |
  |                |                |--"www.example.com?"------------------------->|
  |                |                |<--"A 93.184.216.34, TTL=3600"---------------|
  |                |                |                                              |
  |                |<--"93.184.216.34"--|                                          |
  |<--"93.184.216.34"--|                |                                          |
  |                     |               |                                          |
  |===TCP connect to 93.184.216.34===>                                            |
```

**Total time (cold cache):** 4 round trips, typically 50-200ms.
**Warm cache:** 0ms (local) or <5ms (resolver cache).

---

## DNS Record Types

| Record | Name                  | What It Does                                       | Example                               |
|--------|-----------------------|----------------------------------------------------|---------------------------------------|
| A      | Address               | Maps domain to IPv4 address                        | `example.com -> 93.184.216.34`        |
| AAAA   | IPv6 Address          | Maps domain to IPv6 address                        | `example.com -> 2606:2800:220:1:...`  |
| CNAME  | Canonical Name        | Alias pointing to another domain name              | `www.example.com -> example.com`      |
| MX     | Mail Exchange         | Where to deliver email for this domain             | `example.com -> mail.example.com (10)`|
| NS     | Name Server           | Which nameservers are authoritative for this domain| `example.com -> ns1.example.com`      |
| TXT    | Text                  | Arbitrary text (SPF, DKIM, domain verification)    | `v=spf1 include:_spf.google.com ~all` |
| SRV    | Service               | Host + port for specific services                  | `_sip._tcp.example.com -> 5060`       |
| PTR    | Pointer (Reverse DNS) | Maps IP address back to domain name                | `34.216.184.93 -> example.com`        |
| SOA    | Start of Authority    | Primary NS, admin email, serial number, TTL defaults| Zone metadata record                 |
| CAA    | Cert Authority Auth   | Which CAs can issue certificates for this domain   | `example.com CAA 0 issue "letsencrypt.org"` |

### Key Details

**CNAME restrictions:**
- Cannot coexist with other records at the same name (no CNAME + MX at root)
- Cannot be used at zone apex (`example.com` itself) -- use ALIAS/ANAME (provider-specific) or A record
- Adds an extra resolution hop (CNAME -> then resolve the target)

**MX priority:** Lower number = higher priority. `MX 10 primary.mail.com` tried before `MX 20 backup.mail.com`.

**TXT records in system design:** Used for domain ownership verification (Google, AWS), SPF (email auth), DKIM signatures, and DMARC policies.

**SRV records:** Critical for service discovery in microservices. Format: `_service._protocol.name TTL class SRV priority weight port target`.

---

## DNS Caching and TTL

### TTL (Time to Live)

Every DNS response includes a TTL in seconds. This controls how long the answer can be cached.

| TTL Value     | Duration  | Use Case                                          |
|---------------|-----------|---------------------------------------------------|
| 60            | 1 min     | Active failover, DNS-based routing changes        |
| 300           | 5 min     | Normal services, good balance                     |
| 3600          | 1 hour    | Stable services, reduce DNS query volume          |
| 86400         | 1 day     | Rarely changing records (MX, NS)                  |

### Where DNS Is Cached

```
Layer                 TTL Respected?    Can You Control It?
------------------------------------------------------------
Browser cache         Mostly (~60s)     No (browser decides)
OS resolver cache     Yes               Partially (OS config)
Recursive resolver    Yes               No (ISP/public resolver)
CDN edge              Yes               Via DNS provider config
Authoritative NS      Source of truth   Yes (you set it)
```

### TTL Trade-offs

**Short TTL (60s):**
- Pro: Fast failover, quick DNS-based traffic shifts
- Con: More DNS queries, higher latency, more load on authoritative servers

**Long TTL (3600s+):**
- Pro: Fewer queries, faster resolution (cached), less DNS infrastructure load
- Con: Slow propagation of changes, hard to failover quickly

**Pre-migration pattern:** Lower TTL to 60s days before a migration, make the change, then raise TTL back. This ensures caches expire quickly when you need them to.

---

## DNS-Based Load Balancing

### Round-Robin DNS

Simplest form: return multiple A records, clients pick one (usually first):

```
example.com.  300  IN  A  10.0.0.1
example.com.  300  IN  A  10.0.0.2
example.com.  300  IN  A  10.0.0.3
```

**Limitations:**
- No health checking -- traffic goes to dead servers
- No session affinity -- same user hits different servers
- Uneven distribution -- caching means some IPs get more traffic
- No load awareness -- busy server gets same share as idle one

### Geo-Based DNS (GeoDNS)

Resolve to different IPs based on client's geographic location:

```
User in US  --> example.com --> 10.0.1.1  (US-East data center)
User in EU  --> example.com --> 10.0.2.1  (EU-West data center)
User in Asia -> example.com --> 10.0.3.1  (AP-Southeast data center)
```

**How it works:** Resolver's IP is mapped to a geography (GeoIP database). Authoritative NS returns the nearest data center's IP.

**Limitation:** Resolves based on the **recursive resolver's** location, not the end user's. A user in Tokyo using Google DNS (8.8.8.8) may be routed through Google's resolver in the US. EDNS Client Subnet (ECS) mitigates this by sending the client's subnet to the authoritative NS.

### Latency-Based DNS

Route to the data center with lowest measured latency to the user's resolver. AWS Route 53 does this by measuring latency from resolver IPs to each endpoint and returning the fastest option.

### Weighted DNS

Distribute traffic by percentage:
```
example.com  A  10.0.0.1  (weight: 70)   -- 70% of traffic
example.com  A  10.0.0.2  (weight: 20)   -- 20% of traffic
example.com  A  10.0.0.3  (weight: 10)   -- 10% of traffic (canary)
```

Useful for canary deployments and gradual migrations.

### Failover DNS

Health-check-aware DNS. If primary endpoint fails health check, return secondary:
```
Normal:    example.com -> 10.0.0.1 (primary, healthy)
Failover:  example.com -> 10.0.0.2 (secondary, now active)
```

**Critical limitation:** Failover speed is bounded by TTL. Even with TTL=60, cached resolvers will send traffic to the dead server for up to 60 seconds.

---

## Anycast DNS

### How It Works

Multiple servers in different locations **advertise the same IP address** via BGP routing. Network routers send each client to the **nearest** server.

```
                   User in NYC
                       |
                       v
              +--[BGP Routing]--+
              |                 |
        NYC Server         London Server
        IP: 1.1.1.1        IP: 1.1.1.1    <-- same IP!
              |                 |
              +--[BGP Routing]--+
                       ^
                       |
                  User in London
```

### Real-World Examples

- **Cloudflare (1.1.1.1):** 300+ data centers, all announcing the same IP
- **Google Public DNS (8.8.8.8):** Hundreds of nodes globally
- **Root DNS servers:** 13 logical root servers, hundreds of physical instances via anycast

### Why Anycast Matters for System Design

- **Low latency:** Users always hit the nearest node
- **DDoS resilience:** Attack traffic is distributed across all nodes globally
- **No client configuration:** Works transparently at the network layer
- **Automatic failover:** If a node goes down, BGP reroutes to next nearest

---

## DNS Propagation Delay

When you change a DNS record, it does NOT instantly update everywhere.

### What "Propagation" Really Means

There is no push mechanism. Old cached records simply **expire based on their TTL**:

```
Timeline (TTL = 3600s / 1 hour):
  T=0:    You change A record from 10.0.0.1 to 10.0.0.2
  T=0-5s: Users hitting authoritative NS directly see new IP
  T=5m:   Resolvers whose cache expired see new IP
  T=30m:  Most resolvers updated (depends on when they last queried)
  T=60m:  All correctly-behaving resolvers updated
  T=??:   Some resolvers/browsers ignore TTL (rare but happens)
```

### Implications for System Design

- **Never rely on DNS for instant failover.** Use load balancers or IP failover instead.
- **Blue/green deployments via DNS** work but have a transition window equal to TTL.
- **Lower TTL before migrations.** Change from 3600 to 60 at least TTL-hours before the actual migration.
- **Both old and new servers must handle traffic** during the propagation window.

---

## DNSSEC (DNS Security Extensions)

### The Problem

Standard DNS has **no authentication**. A man-in-the-middle can forge DNS responses (DNS spoofing/cache poisoning), redirecting users to malicious servers.

### How DNSSEC Works

Adds **cryptographic signatures** to DNS responses:

```
Without DNSSEC:
  Resolver: "What is example.com?"
  Response: "93.184.216.34"           (could be forged)

With DNSSEC:
  Resolver: "What is example.com?"
  Response: "93.184.216.34"
           + RRSIG (signature of this record)
           + DNSKEY (public key to verify signature)
  Resolver: Verifies signature chain up to root
```

**Chain of trust:** Root zone signs .com's key. .com signs example.com's key. example.com signs its own records. Resolver validates the entire chain.

**Limitations:** DNSSEC adds latency (larger responses, verification). Deployment is incomplete. Does not encrypt queries (DNS-over-HTTPS/TLS does that).

---

## Split-Horizon DNS (Split-Brain DNS)

### Concept

Return **different DNS answers** depending on where the query comes from:

```
External user (internet):
  api.example.com -> 203.0.113.10  (public load balancer IP)

Internal user (corporate network / VPC):
  api.example.com -> 10.0.1.50     (private internal IP)
```

### Use Cases

- **Internal services:** Employees access internal tools by name without going through public internet
- **VPC private DNS:** AWS Route 53 Private Hosted Zones resolve to private IPs within the VPC
- **Security:** Internal service topology is not exposed to public DNS
- **Performance:** Internal traffic stays on the private network, avoiding NAT and external hops

### Implementation

- **AWS:** Route 53 Private Hosted Zones associated with VPCs
- **GCP:** Cloud DNS private zones
- **On-prem:** BIND views, separate DNS servers for internal vs external

---

## DNS in System Design Patterns

**Global Load Balancing:** DNS is the first layer of routing. GeoDNS routes to the nearest region, then regional load balancers handle server-level distribution.

**Service Discovery:** In microservices, internal DNS (Consul DNS, Kubernetes CoreDNS) resolves service names to pod IPs. `payment-service.default.svc.cluster.local -> 10.244.1.5`.

**CDN Routing:** CDNs use DNS to route users to the nearest edge node. `cdn.example.com` returns different IPs based on user location.

**Email Delivery:** MX records determine where email goes. SPF/DKIM/DMARC (via TXT records) authenticate senders and prevent spoofing.

---

## Interview Questions

1. **"A user reports your site is unreachable but your servers are healthy. What could be wrong?"**
   DNS issue. Check: Is the domain's DNS resolving correctly (`dig`, `nslookup`)? Did the domain expire? Is the authoritative NS responding? Is there a DNS cache poisoning issue? Could the user's local resolver be returning stale/wrong records? Check from multiple locations (different ISPs, regions).

2. **"You need to migrate traffic from data center A to data center B with zero downtime. How?"**
   Lower DNS TTL to 60s well in advance (at least old-TTL hours before). Set up the new data center and verify it works. Update DNS to point to new DC. Monitor both DCs during the propagation window (up to old TTL). Keep old DC running until TTL fully expires. Then raise TTL back.

3. **"How does Cloudflare serve DNS so fast globally?"**
   Anycast. Cloudflare announces the same IP (1.1.1.1) from 300+ data centers via BGP. Each user's query is routed to the physically nearest node by network routers. Combined with aggressive caching and optimized resolver software, queries resolve in <10ms.

4. **"Your microservice architecture has 50 services. How do they find each other?"**
   Service discovery via DNS. In Kubernetes, CoreDNS resolves service names to cluster IPs. `order-service.prod.svc.cluster.local` resolves to the service's ClusterIP, which load-balances across pods. For more features (health checking, circuit breaking), use a service mesh (Istio, Linkerd) or service registry (Consul).

5. **"What's the difference between CNAME and A records? When would you use each?"**
   A record maps directly to an IP. CNAME maps to another domain name (alias). Use A records for zone apex (example.com) and when you know the IP. Use CNAME for subdomains that should follow another domain (www -> example.com, or app.example.com -> load-balancer.aws.com). CNAME cannot coexist with other records at the same name.

6. **"Your DNS TTL is 1 hour. An entire AZ goes down. How long are users affected?"**
   Up to 1 hour for DNS-based failover. Users whose resolvers cached the old IP continue hitting the dead AZ until their cache expires. Mitigation: use shorter TTLs (60s), health-check-based failover DNS (Route 53), or better yet, use an always-on load balancer with IP failover (BGP anycast, floating IPs) instead of relying solely on DNS.
