# Real-World Benchmarks & Numbers for Realistic Simulation

> Exact numbers to hardcode as simulator defaults. All sourced from vendor documentation and published benchmarks.

---

## 1. LATENCY NUMBERS (Jeff Dean, updated ~2025 hardware)

| Operation | Latency | Notes |
|---|---|---|
| L1 cache reference | 0.5 ns | |
| Branch mispredict | 5 ns | |
| L2 cache reference | 7 ns | 14× L1 |
| Mutex lock/unlock | 25 ns | |
| Main memory reference | 100 ns | 200× L1 |
| Compress 1KB (Snappy) | 3 μs | |
| Send 2KB over 1 Gbps | 10 μs | |
| NVMe SSD random read | 10-20 μs | |
| SATA SSD random read | 100-200 μs | |
| Read 1MB from memory | 250 μs | |
| Same datacenter RTT | 500 μs | 0.5 ms |
| Read 1MB from NVMe SSD | 333 μs | |
| HDD disk seek | 4 ms | |
| Read 1MB from HDD | 10 ms | |
| Cross-continent RTT | 150 ms | Speed of light |

## 2. NETWORK LATENCY

### AWS Cross-Region (measured 2025)

| Route | RTT |
|---|---|
| US-East ↔ US-East (Ohio) | ~12 ms |
| US-East ↔ EU (Ireland) | ~69 ms |
| US-East ↔ EU (Frankfurt) | ~91 ms |
| US-East ↔ Asia (Singapore) | ~158 ms |
| US-West ↔ Asia (Tokyo) | ~97 ms |
| EU (Paris) ↔ EU (London) | ~7 ms |
| Asia (Tokyo) ↔ Asia (Singapore) | ~68 ms |
| South America ↔ Asia | ~311 ms |

### Quick Defaults

| Category | Latency |
|---|---|
| Same AZ | 0.5 ms |
| Cross-AZ, same region | 1-2 ms |
| Same continent, nearby | 10-30 ms |
| Same continent, far | 50-100 ms |
| Cross-continent | 100-200 ms |
| Antipodal | 250-320 ms |

## 3. DATABASE LATENCY

| Operation | p50 | p99 |
|---|---|---|
| Redis GET | 0.045 ms | 0.12 ms |
| Redis SET | 0.05 ms | 0.15 ms |
| PostgreSQL PK lookup | 0.1 ms | 0.5 ms |
| PostgreSQL simple SELECT | 0.1-0.3 ms | 1-5 ms |
| PostgreSQL complex JOIN | 1-10 ms | 50-100 ms |
| MySQL simple SELECT | 0.9-1.0 ms | 5-10 ms |
| DynamoDB GET | 1-5 ms | 10 ms |

## 4. THROUGHPUT NUMBERS

### Web Servers / Load Balancers

| Component | RPS | Notes |
|---|---|---|
| Nginx (static, 16-core) | ~120,000 | Static content |
| Nginx (tuned production) | 50,000-80,000 | |
| HAProxy (single ARM) | 2,000,000 | Peak benchmark |
| HAProxy (4-core VPS) | 50,000+ | Typical |
| Node.js Express | ~15,000 | Per instance |
| Go HTTP server | ~50,000 | Per instance |

### Databases

| System | Throughput | Notes |
|---|---|---|
| Redis (no pipeline) | 100,000-200,000 ops/s | Single instance |
| Redis (pipeline=16) | 1,500,000+ ops/s | Pipelined |
| Redis 8.6 (16 cores) | 3,500,000 ops/s | Latest |
| Redis Enterprise (cluster) | 200,000,000 ops/s | 40 instances |
| PostgreSQL (typical) | 2,000-5,000 TPS | |
| PostgreSQL (optimized) | 20,000-70,000 TPS | NVMe, tuned |

### Message Queues

| System | Throughput | Notes |
|---|---|---|
| Kafka (single broker) | 200,000-300,000 msg/s | 100-byte msgs |
| Kafka (3 brokers, no repl) | 2,000,000 msg/s | LinkedIn benchmark |
| RabbitMQ (single node) | 20,000-50,000 msg/s | |

### API Protocols

| Protocol | RPS | Notes |
|---|---|---|
| REST (JSON/HTTP 1.1) | ~20,000 | |
| gRPC (protobuf/HTTP 2) | ~50,000 | 2.5× REST |

## 5. REAL-WORLD SYSTEM SCALE

| System | Metric | Value |
|---|---|---|
| **Twitter/X** | Tweets/day | ~500 million |
| | Tweets/sec (avg) | ~6,000 |
| | Tweets/sec (peak) | ~25,000 |
| **Google Search** | Searches/sec | ~190,000 |
| | Searches/day | ~16.4 billion |
| **WhatsApp** | Messages/day | ~150 billion |
| | Messages/sec | ~1,700,000 |
| | Monthly active users | 3.3 billion |
| **YouTube** | Video uploads/min | 500 hours |
| **Instagram** | Photos/day | ~95 million |
| **Netflix** | Paid subscribers | ~325 million |
| | Peak concurrent (live) | 65 million |

## 6. TYPICAL OBJECT SIZES

| Object | Size |
|---|---|
| Tweet / short text | 250-300 bytes |
| Chat message | 300-500 bytes |
| URL | 100 bytes |
| JSON API response | 200 bytes - 10 KB |
| User profile metadata | 1-5 KB |
| Thumbnail image | 10-50 KB |
| Compressed photo (JPEG) | 200 KB - 2 MB |
| HD video (1 min, 1080p) | 100-150 MB |
| Log line | 100-200 bytes |
| Database row (OLTP) | 200 bytes - 1 KB |

## 7. BANDWIDTH

| Stream Type | Bandwidth |
|---|---|
| 480p video | 1.5-3 Mbps |
| 1080p video | 5-8 Mbps |
| 4K video | 15-25 Mbps |
| Audio (music) | 128-320 Kbps |
| Voice call | 30-100 Kbps |

## 8. AWS S3 LIMITS

| Limit | Value |
|---|---|
| GET/HEAD per prefix | 5,500/s |
| PUT/POST/DELETE per prefix | 3,500/s |
| Prefixes per bucket | Unlimited |

## 9. COST ESTIMATION

### Compute (AWS EC2, us-east-1, on-demand)

| Instance | vCPUs | Memory | $/month |
|---|---|---|---|
| t3.micro | 2 | 1 GiB | ~$7.59 |
| t3.medium | 2 | 4 GiB | ~$30 |
| m5.large | 2 | 8 GiB | ~$70 |
| m5.xlarge | 4 | 16 GiB | ~$140 |
| c5.large | 2 | 4 GiB | ~$62 |

### Serverless

| Service | Cost |
|---|---|
| Lambda + HTTP API Gateway | ~$1.20 per 1M requests |
| Lambda + REST API Gateway | ~$3.70 per 1M requests |
| DynamoDB on-demand reads | $1.25 per 1M |
| DynamoDB on-demand writes | $1.25 per 1M |

### CDN

| Provider | Cost/GB (first 10TB) |
|---|---|
| CloudFront | $0.085 |
| Fastly | $0.12 |
| Google Cloud CDN | $0.08 |
| Cloudflare Pro | $20/mo flat |

### Serverless vs Dedicated Breakeven

| Volume | Serverless | Dedicated | Winner |
|---|---|---|---|
| 10M msg/day | ~$430/mo | ~$2,431/mo | Serverless |
| 100M msg/day | ~$3,000/mo | ~$2,500/mo | Even |
| 1B msg/month | ~$26,800/mo | ~$5,183/mo | Dedicated (81% savings) |

### Quick Math Constants

| Unit | Exact | Approx |
|---|---|---|
| Seconds/day | 86,400 | ~10⁵ |
| Seconds/month | 2,592,000 | ~2.5×10⁶ |
| Seconds/year | 31,536,000 | ~3×10⁷ |

### Powers of Two

| Power | Value | Unit |
|---|---|---|
| 2¹⁰ | ~1 thousand | 1 KB |
| 2²⁰ | ~1 million | 1 MB |
| 2³⁰ | ~1 billion | 1 GB |
| 2⁴⁰ | ~1 trillion | 1 TB |
