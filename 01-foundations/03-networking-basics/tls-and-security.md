# TLS/HTTPS and Network Security

---

## TLS 1.3 Handshake

TLS 1.3 completes in **1 RTT** (down from 2 RTT in TLS 1.2). Resumption can be **0 RTT**.

### Full Handshake (New Connection)

```
Client                                          Server
  |                                                |
  |  ClientHello                                   |
  |    + supported cipher suites                   |
  |    + key_share (DH public key)                 |
  |    + supported_versions (TLS 1.3)              |
  |  --------------------------------------------> |
  |                                                |
  |                             ServerHello        |
  |                + selected cipher suite          |
  |                + key_share (DH public key)      |
  |                                                |
  |             {EncryptedExtensions}               |
  |             {Certificate}                       |
  |             {CertificateVerify}                 |
  |             {Finished}                          |
  |  <-------------------------------------------- |
  |                                                |
  |  *** Both sides now have shared keys ***        |
  |                                                |
  |  {Finished}                                    |
  |  --------------------------------------------> |
  |                                                |
  |  ========= Encrypted Application Data ======== |
  |                                                |

  {} = encrypted with handshake keys
  Total: 1 RTT before application data
```

### 0-RTT Resumption

For returning clients who previously connected:

```
Client                                          Server
  |                                                |
  |  ClientHello                                   |
  |    + pre_shared_key (from previous session)    |
  |    + early_data_indication                     |
  |    + [Encrypted 0-RTT Application Data]        |
  |  --------------------------------------------> |   <-- Data sent with first packet!
  |                                                |
  |                             ServerHello        |
  |             {EncryptedExtensions}               |
  |             {Finished}                          |
  |  <-------------------------------------------- |
  |                                                |
  |  ========= Encrypted Application Data ======== |

  Total: 0 RTT for early data
```

**0-RTT trade-off:** Early data is replayable (not forward-secret). Only safe for idempotent requests (GET). Servers must protect against replay attacks.

### What TLS 1.3 Removed (vs 1.2)

- RSA key exchange (no forward secrecy) -- only Diffie-Hellman now
- CBC mode ciphers (padding oracle attacks)
- RC4, 3DES, MD5, SHA-1
- Compression (CRIME attack)
- Renegotiation
- Static RSA and DH cipher suites

---

## Certificates and Chain of Trust

### How Certificates Work

```
Root CA (DigiCert, Let's Encrypt)
  |
  |-- signs -->  Intermediate CA
                   |
                   |-- signs -->  Your Server Certificate
                                    |
                                    Contains:
                                    - Domain name (CN/SAN)
                                    - Public key
                                    - Validity period
                                    - Issuer info
                                    - Digital signature
```

### Certificate Validation Chain

```
Browser receives server certificate:

1. Is the cert for this domain? (CN or SAN matches)
2. Is it expired? (check notBefore/notAfter)
3. Is it revoked? (OCSP check or CRL)
4. Was it signed by a trusted CA?
   -> Check intermediate cert signature
   -> Check intermediate was signed by root CA
   -> Root CA is in browser/OS trust store
5. All checks pass --> green lock
```

### Key Concepts

**Certificate Authority (CA):** Trusted entity that issues certificates. Browser/OS ships with a list of ~150 trusted root CAs.

**Let's Encrypt:** Free, automated CA. Issues certificates via ACME protocol. 90-day validity forces automation (good for security).

**SAN (Subject Alternative Name):** One certificate can cover multiple domains: `example.com`, `www.example.com`, `api.example.com`. Wildcard: `*.example.com`.

**OCSP Stapling:** Instead of the browser checking certificate revocation with the CA (slow, privacy leak), the server periodically fetches its OCSP response and "staples" it to the TLS handshake. Faster and more private.

---

## TLS Termination

### At Load Balancer (Most Common)

```
Client                  Load Balancer              Backend Servers
  |                        |                           |
  |  ====TLS Encrypted===> |                           |
  |                        |  ---Plain HTTP--->        |
  |                        |  ---Plain HTTP--->        |
  |                        |  ---Plain HTTP--->        |
  |  <=====TLS Encrypted== |                           |
```

**Pros:**
- Offloads CPU-intensive TLS from application servers
- Centralized certificate management (one place to rotate certs)
- LB can inspect HTTP headers for routing (L7 load balancing)
- Backend servers are simpler (no TLS config)
- Enables HTTP caching at LB

**Cons:**
- Traffic between LB and backend is unencrypted (must trust internal network)
- Compliance issue: some regulations (PCI DSS, HIPAA) require encryption in transit everywhere
- LB is a high-value attack target (decrypts all traffic)

### End-to-End Encryption

```
Client                  Load Balancer              Backend Servers
  |                        |                           |
  |  ====TLS Encrypted===> |  ====TLS Encrypted===>   |
  |                        |  (L4 pass-through or      |
  |                        |   re-encrypt)             |
  |  <=====TLS Encrypted== |  <====TLS Encrypted====  |
```

**Pros:**
- Traffic encrypted everywhere (zero-trust model)
- Meets strict compliance requirements
- Defense in depth (compromised LB sees nothing)

**Cons:**
- More complex certificate management (every backend has certs)
- LB can only do L4 (TCP) routing, not L7 (HTTP) routing if pass-through
- Higher CPU usage on backend servers
- Harder to debug (can't inspect traffic at LB)

### Common Pattern: TLS Termination + mTLS Re-encryption

```
Internet              LB (TLS termination)          Backend (mTLS)
  |                        |                           |
  |  ====Public TLS=====> |  ====Internal mTLS====>   |
  |                        |  (re-encrypted with       |
  |                        |   internal certs)         |
```

Best of both worlds: L7 routing at LB + encrypted internal traffic.

---

## mTLS (Mutual TLS)

### What It Is

Standard TLS: only the **server** presents a certificate. The client verifies the server.
Mutual TLS: **both** client and server present certificates and verify each other.

```
Standard TLS:                    Mutual TLS:
  Client verifies Server           Client verifies Server
  Server trusts Client             Server verifies Client
  (based on auth token)            (based on client certificate)
```

### mTLS Handshake Flow

```
Client                                          Server
  |                                                |
  |  ClientHello                                   |
  |  --------------------------------------------> |
  |                                                |
  |  ServerHello + Server Certificate              |
  |  + CertificateRequest   <-- NEW: server asks   |
  |  <-------------------------------------------- |  for client cert
  |                                                |
  |  Client Certificate     <-- NEW: client sends  |
  |  CertificateVerify         its certificate     |
  |  Finished                                      |
  |  --------------------------------------------> |
  |                                                |
  |  Server verifies client cert against trusted CA|
  |                                                |
  |  ========= Encrypted, Mutually Authed ======== |
```

### Use Cases

- **Service-to-service communication** in microservices (service mesh: Istio, Linkerd)
- **Zero-trust architecture:** Every service authenticates to every other service
- **API security:** Client certificates replace API keys (stronger, no secret to leak)
- **IoT devices:** Each device has a unique certificate for identity

### Service Mesh mTLS

```
Service A Pod                                Service B Pod
+-------------------+                       +-------------------+
| App Container     |                       | App Container     |
|  (plain HTTP)     |                       |  (plain HTTP)     |
+-------------------+                       +-------------------+
| Sidecar Proxy     |  ====mTLS=========>   | Sidecar Proxy     |
| (Envoy)           |                       | (Envoy)           |
+-------------------+                       +-------------------+

The app code never handles TLS. The sidecar proxy transparently
encrypts/decrypts and validates certificates.
```

---

## Keep-Alive Connections and Connection Pooling

### HTTP Keep-Alive

Without keep-alive (HTTP/1.0 default):
```
Request 1:  TCP handshake + TLS handshake + Request + Response + TCP close
Request 2:  TCP handshake + TLS handshake + Request + Response + TCP close
            (full overhead for every request)
```

With keep-alive (HTTP/1.1 default):
```
            TCP handshake + TLS handshake (once)
Request 1:  Request + Response
Request 2:  Request + Response
Request 3:  Request + Response
            TCP close (after idle timeout)
```

**Savings:** Eliminates 1-3 RTTs of overhead per request after the first.

### Connection Pooling

Backend services maintain a **pool** of pre-established TCP connections to databases, caches, and other services:

```
Application Server
+---------------------------+
|  Connection Pool          |
|  +-----+-----+-----+     |     Database
|  |conn1|conn2|conn3| --------> (already connected,
|  +-----+-----+-----+     |     no handshake needed)
|  |conn4|conn5|     |     |
|  +-----+-----+-----+     |
+---------------------------+
```

**Key parameters:**
- **Min idle:** Minimum connections kept open (avoid cold-start)
- **Max size:** Upper bound on connections (protect the database)
- **Idle timeout:** Close connections unused for N seconds
- **Max lifetime:** Close connections after N minutes (avoid stale connections)

**Why this matters:** A database like PostgreSQL forks a new process per connection. 1000 connections = 1000 processes. Connection pools keep this manageable (typically 10-50 pooled connections serve thousands of app-level requests).

---

## VPC, Subnets, Security Groups, and Firewalls

### VPC (Virtual Private Cloud)

An isolated virtual network within a cloud provider. Your resources (servers, databases, caches) live inside your VPC and are not accessible from the internet by default.

```
AWS Region (us-east-1)
+----------------------------------------------------------+
|  Your VPC (10.0.0.0/16)                                  |
|                                                          |
|  +-- Public Subnet (10.0.1.0/24) ---+                   |
|  |  Load Balancer                    |  <-- Internet     |
|  |  NAT Gateway                      |      Gateway      |
|  +-----------------------------------+                   |
|                                                          |
|  +-- Private Subnet (10.0.2.0/24) --+                   |
|  |  App Servers                      |                   |
|  |  (no direct internet access)      |                   |
|  +-----------------------------------+                   |
|                                                          |
|  +-- Private Subnet (10.0.3.0/24) --+                   |
|  |  Databases, Caches               |                   |
|  |  (most restricted)               |                   |
|  +-----------------------------------+                   |
+----------------------------------------------------------+
```

### Subnets

**Public subnet:** Has a route to an Internet Gateway. Resources get public IPs.
**Private subnet:** No direct internet route. Outbound access via NAT Gateway only.

**Best practice:** Only load balancers and bastion hosts go in public subnets. Everything else (app servers, databases) goes in private subnets.

### Security Groups (Stateful Firewalls)

Act as virtual firewalls for individual resources. **Stateful** means if you allow inbound traffic, the response is automatically allowed.

```
Web Server Security Group:
  Inbound:   Allow TCP 443 from 0.0.0.0/0        (HTTPS from anywhere)
             Allow TCP 80  from 0.0.0.0/0         (HTTP from anywhere)
  Outbound:  Allow all                             (default)

App Server Security Group:
  Inbound:   Allow TCP 8080 from web-server-sg     (only from web tier)
  Outbound:  Allow all

Database Security Group:
  Inbound:   Allow TCP 5432 from app-server-sg     (only from app tier)
  Outbound:  Allow TCP 5432 to app-server-sg       (restrict outbound too)
```

**Key principle:** Reference other security groups instead of IP ranges. If you add a new app server, it automatically has access to the database because it joins the app-server-sg.

### Network ACLs (Stateless Firewalls)

Applied at the subnet level. **Stateless** means you must explicitly allow both inbound and outbound. Acts as a second layer of defense.

### Defense in Depth

```
Internet --> Internet Gateway --> Network ACL --> Security Group --> Application
                                 (subnet-level)   (instance-level)   (code-level
                                                                      auth/authz)
```

---

## DDoS Protection Basics

### Attack Types

| Type               | Layer | Method                              | Example                    |
|--------------------|-------|-------------------------------------|----------------------------|
| Volumetric         | L3/L4 | Flood with massive traffic          | UDP flood, DNS amplification|
| Protocol           | L3/L4 | Exploit protocol weaknesses         | SYN flood, Ping of Death   |
| Application        | L7    | Exhaust server resources            | HTTP GET flood, Slowloris  |

### Protection Layers

```
                    DDoS Attack Traffic
                          |
                          v
              +--- CDN / Edge Network ---+        Absorb volumetric attacks
              |  (Cloudflare, AWS Shield)|        (Tbps capacity)
              +-------------------------+
                          |
                          v
              +--- WAF (Web App Firewall)-+       Block L7 attack patterns
              |  Rate limiting, rules     |       (SQL injection, etc.)
              +---------------------------+
                          |
                          v
              +--- Load Balancer ---------+       Distribute remaining load
              |  Connection limits,       |       SYN cookies
              |  rate limiting            |
              +---------------------------+
                          |
                          v
              +--- Application -----------+       Application-level rate
              |  Auth, rate limiting,     |       limiting per user/IP
              |  CAPTCHA                  |
              +---------------------------+
```

### Key Mitigation Techniques

**Anycast absorption:** Distribute attack traffic across hundreds of edge nodes globally. No single node gets overwhelmed.

**SYN cookies:** Instead of allocating memory for each SYN (enabling SYN flood), encode connection state in the SYN-ACK sequence number. Only allocate on valid ACK response.

**Rate limiting:** Limit requests per IP, per user, per API key. Use token bucket or sliding window algorithms.

**Challenge-based:** CAPTCHAs, JavaScript challenges, proof-of-work. Distinguish bots from humans.

**Geo-blocking:** If your service only operates in the US, block traffic from known attack origins.

**Auto-scaling with limits:** Scale up to absorb attacks but set cost limits. Without limits, attackers inflate your cloud bill (economic DDoS).

---

## Interview Questions

1. **"How does HTTPS prevent man-in-the-middle attacks?"**
   TLS handshake: server presents a certificate signed by a trusted CA. Client verifies the certificate chain. Diffie-Hellman key exchange establishes a shared secret that an eavesdropper cannot derive (even if they see all handshake packets). All subsequent data is encrypted with this shared key. Without the server's private key, an attacker cannot impersonate the server.

2. **"Your internal microservices communicate over plain HTTP in a VPC. Is this secure enough?"**
   Depends on threat model. VPC provides network isolation, but: a compromised service can sniff all internal traffic. An attacker with VPC access sees everything. Compliance (PCI, HIPAA) may require encryption in transit. Best practice: use mTLS via service mesh (Istio/Linkerd). The sidecar proxy handles TLS transparently -- zero application code changes.

3. **"TLS termination at the load balancer vs end-to-end. Which do you choose?"**
   TLS termination at LB for most cases: simpler cert management, enables L7 routing and caching, offloads crypto from app servers. Add mTLS re-encryption from LB to backends for compliance or zero-trust. End-to-end only when you cannot trust the LB environment or need absolute zero-trust (rare). The performance hit of double encryption is usually acceptable.

4. **"How do you protect against DDoS for a public API?"**
   Layered defense. Use a CDN/edge network (Cloudflare, AWS Shield) to absorb volumetric attacks. WAF rules block known attack patterns. Rate limit at multiple levels: per-IP at edge, per-API-key at app layer. Auto-scale backend but set budget limits. For L7 attacks: challenge-response (CAPTCHA), behavioral analysis, connection timeouts. For critical APIs: require authentication (API keys, OAuth) to raise the cost of attack.

5. **"What is forward secrecy and why does TLS 1.3 mandate it?"**
   Forward secrecy (via ephemeral Diffie-Hellman) means each session uses unique encryption keys. Even if the server's long-term private key is later compromised, past recorded traffic cannot be decrypted. TLS 1.2 allowed RSA key exchange (no forward secrecy) -- if you recorded traffic and later stole the private key, you could decrypt everything retroactively. TLS 1.3 removed RSA key exchange entirely.

6. **"A developer wants to store database credentials in the application code. What's wrong and what's the alternative?"**
   Credentials in code: committed to version control, visible to all developers, hard to rotate, appears in logs/crash dumps. Alternatives: environment variables (better), secrets manager (AWS Secrets Manager, HashiCorp Vault) that provides automatic rotation, audit logging, and fine-grained access control via IAM. Application fetches secrets at startup or via sidecar. Never log, serialize, or expose secrets in error messages.
