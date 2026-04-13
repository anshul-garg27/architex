# Reference Numbers for Back-of-the-Envelope Estimation

The single most important skill in system design estimation is having the right numbers
at your fingertips. This file is your lookup table. Memorize the bolded rows; know where
to find the rest.

---

## 1. Powers of 2 -- Data Units

Every storage and bandwidth calculation starts here.

| Power | Exact Value           | Approx. Metric | Name     |
|------:|-----------------------|-----------------|----------|
| 2^10  | 1,024                 | 1 Thousand      | 1 KB     |
| 2^20  | 1,048,576             | 1 Million       | 1 MB     |
| 2^30  | 1,073,741,824         | 1 Billion       | 1 GB     |
| 2^40  | 1,099,511,627,776     | 1 Trillion      | 1 TB     |
| 2^50  | ~1.13 x 10^15         | 1 Quadrillion   | 1 PB     |

**Quick conversions you will use constantly:**

```
1 KB  = 10^3  bytes   (1 thousand)
1 MB  = 10^6  bytes   (1 million)
1 GB  = 10^9  bytes   (1 billion)
1 TB  = 10^12 bytes   (1 trillion)
1 PB  = 10^15 bytes   (1 quadrillion)
```

> Tip: In interviews, always round to powers of 10 for speed.
> 2^10 ~ 10^3 is the only approximation you need.

---

## 2. Latency Numbers Every Programmer Should Know

Originally compiled by Jeff Dean (Google). These numbers shift with hardware generations
but the *relative order of magnitude* stays remarkably stable.

| Operation                                  | Latency        | Rounded  | Notes                          |
|--------------------------------------------|----------------|----------|--------------------------------|
| L1 cache reference                         | 0.5 ns         | ~1 ns    | On-chip, per-core              |
| Branch mispredict                          | 5 ns           | ~5 ns    |                                |
| L2 cache reference                         | 7 ns           | ~10 ns   | On-chip, shared                |
| Mutex lock/unlock                          | 25 ns          | ~25 ns   |                                |
| Main memory (RAM) reference                | 100 ns         | ~100 ns  | **Key number**                 |
| Compress 1 KB with Zippy/Snappy            | 3,000 ns       | ~3 us    |                                |
| Send 1 KB over 1 Gbps network              | 10,000 ns      | ~10 us   |                                |
| Read 4 KB randomly from SSD                | 150,000 ns     | ~150 us  |                                |
| Read 1 MB sequentially from memory         | 250,000 ns     | ~250 us  |                                |
| Round trip within same datacenter           | 500,000 ns     | ~500 us  | **Key number**                 |
| Read 1 MB sequentially from SSD            | 1,000,000 ns   | ~1 ms    |                                |
| HDD seek                                   | 10,000,000 ns  | ~10 ms   | Mechanical, avoid in hot path  |
| Read 1 MB sequentially from HDD            | 20,000,000 ns  | ~20 ms   |                                |
| Send packet CA -> Netherlands -> CA         | 150,000,000 ns | ~150 ms  | Speed of light + routing       |

**Visual scale (each dot = 10x slower):**

```
L1 cache     |
L2 cache     |.
RAM          |..
SSD random   |.....
Datacenter   |......
SSD seq 1MB  |......
HDD seek     |.......
Cross-ocean  |........
```

**The takeaway hierarchy for design decisions:**

```
Memory  >>  SSD  >>  Network (same DC)  >>  HDD  >>  Network (cross-region)
~100ns      ~150us     ~500us               ~10ms       ~150ms
```

---

## 3. Common Capacity Numbers

These are realistic ranges for modern commodity hardware and popular infrastructure
components. Use the conservative end during interviews unless you justify otherwise.

### 3a. Server Throughput

| Component / Service          | Throughput (ops/sec)   | Notes                                   |
|------------------------------|------------------------|-----------------------------------------|
| Single web server (Nginx)    | 1,000 - 10,000 QPS    | Depends on response size, CPU work      |
| Single app server (Java/Go)  | 1,000 - 5,000 QPS     | CPU-bound business logic                |
| Single relational DB (MySQL/Postgres) | 1,000 - 10,000 QPS | Read-heavy; writes 10-20% of this |
| Redis / Memcached            | 100,000 - 500,000 QPS | In-memory, single instance              |
| Kafka broker (per partition) | 10,000 - 100,000 msg/s| Depends on message size                 |
| Elasticsearch node           | 1,000 - 10,000 QPS    | Search queries                          |

### 3b. Single Machine Resources

| Resource               | Typical Range       | High-End         |
|------------------------|---------------------|------------------|
| RAM                    | 64 - 256 GB         | 512 GB - 1 TB    |
| CPU cores              | 8 - 64              | 128+             |
| SSD storage            | 1 - 4 TB            | 16 TB            |
| HDD storage            | 4 - 16 TB           | 20 TB            |
| Network bandwidth      | 1 - 10 Gbps         | 25 - 100 Gbps    |

### 3c. Managed Service Limits (AWS-scale)

| Service                | Limit / Capacity                        |
|------------------------|-----------------------------------------|
| S3 request rate        | 5,500 GETs/sec per prefix               |
| DynamoDB               | Virtually unlimited with auto-scaling   |
| RDS (MySQL)            | ~80,000 IOPS (io1/io2)                  |
| CloudFront (CDN)       | 250,000 requests/sec per distribution   |
| SQS                    | Virtually unlimited throughput           |
| ALB                    | Scales automatically to millions of RPS |

---

## 4. Data Size Reference

Knowing byte sizes lets you quickly estimate storage and bandwidth.

### 4a. Primitive Data Types

| Type           | Size     | Example                         |
|----------------|----------|---------------------------------|
| char (ASCII)   | 1 byte   | 'A'                             |
| char (UTF-8)   | 1-4 bytes| Emoji = 4 bytes                 |
| boolean        | 1 byte   | true/false                      |
| short int      | 2 bytes  |                                 |
| int            | 4 bytes  | 32-bit integer                  |
| long / double  | 8 bytes  | 64-bit integer / floating point |
| UUID           | 16 bytes | 128-bit identifier              |
| SHA-256 hash   | 32 bytes |                                 |
| IPv4 address   | 4 bytes  | Stored as integer               |
| IPv6 address   | 16 bytes |                                 |
| Timestamp      | 8 bytes  | Unix epoch (long)               |

### 4b. Common Object Sizes

| Object                        | Approx. Size | Breakdown                                    |
|-------------------------------|--------------|----------------------------------------------|
| Short URL mapping             | ~100 bytes   | short_url(7B) + long_url(80B) + metadata     |
| Tweet / Short post            | ~500 bytes   | 280 chars + user_id + timestamp + metadata    |
| User profile (basic)          | ~1 KB        | name + email + bio + avatar_url + settings    |
| Chat message                  | ~200 bytes   | text(160B) + sender + timestamp + metadata    |
| JSON API response (small)     | ~1-5 KB      | Typical REST response                        |
| Typical web page (HTML)       | ~50-100 KB   | Compressed                                   |
| Thumbnail image               | ~10-50 KB    | 150x150 JPEG                                 |
| Profile photo                 | ~200 KB      | 400x400 JPEG                                 |
| Typical image (social media)  | ~300 KB      | 1080px wide JPEG                             |
| High-res photo                | ~2-5 MB      | 4K JPEG                                      |
| 1 minute of audio (MP3)       | ~1 MB        | 128 kbps                                     |
| 1 minute of SD video          | ~15-25 MB    | 480p H.264                                   |
| 1 minute of HD video          | ~50 MB       | 720p H.264                                   |
| 1 minute of Full HD video     | ~150 MB      | 1080p H.264                                  |
| 1 minute of 4K video          | ~350 MB      | 2160p H.264                                  |

---

## 5. Time Conversions

These eliminate arithmetic errors in interviews. **Memorize the bolded ones.**

| Conversion                    | Value                | Rounded Shortcut       |
|-------------------------------|----------------------|------------------------|
| Seconds in a minute           | 60                   | 60                     |
| **Seconds in an hour**        | **3,600**            | **~3.6 x 10^3**       |
| **Seconds in a day**          | **86,400**           | **~10^5** (use this!)  |
| Seconds in a month (30 days)  | 2,592,000            | ~2.5 x 10^6           |
| **Seconds in a year**         | **31,536,000**       | **~3 x 10^7**         |
| Minutes in a day              | 1,440                | ~1.5 x 10^3           |
| Hours in a year               | 8,760                | ~10^4                  |

### QPS Conversion Shortcut

```
Daily requests --> QPS:  divide by 86,400  (~10^5)
                         i.e., divide by 100,000

Example:
  100M requests/day  =  100,000,000 / 100,000  =  ~1,000 QPS

Quick formula:
  QPS  =  DAU  x  (actions per user per day)  /  10^5
  Peak =  QPS  x  2    (typical daily peak multiplier)
```

### Handy Rounding Rules

```
1 Million / day    ~= 12 / sec
10 Million / day   ~= 120 / sec
100 Million / day  ~= 1,200 / sec
1 Billion / day    ~= 12,000 / sec
```

> Mnemonic: **1M/day ~ 12/sec** -- multiply from there.

---

## 6. Quick Reference Card (Tear-Off Summary)

```
+-------------------------------------------------------+
|  BACK-OF-ENVELOPE CHEAT SHEET                         |
+-------------------------------------------------------+
|  2^10 = 1K    2^20 = 1M    2^30 = 1G    2^40 = 1T    |
|                                                       |
|  1 day = 86,400s ~ 10^5 s                             |
|  1M/day ~ 12/sec                                      |
|                                                       |
|  RAM: 100ns    SSD: 150us    DC RTT: 500us            |
|  HDD: 10ms     Cross-region: 150ms                    |
|                                                       |
|  Web server: 1K-10K QPS   DB: 1K-10K QPS              |
|  Redis: 100K QPS          RAM: 64-256 GB              |
|                                                       |
|  Tweet: 500B   Image: 300KB   Video min: 50MB         |
|  char: 1B   int: 4B   long: 8B   UUID: 16B           |
+-------------------------------------------------------+
```

---

## Sources and Further Reading

- Jeff Dean, "Numbers Every Programmer Should Know" (Google, updated periodically)
- Alex Xu, "System Design Interview" (2020) -- Chapter 2
- Latency numbers visualization: https://colin-scott.github.io/personal_website/research/interactive_latency.html
- AWS service limits: https://docs.aws.amazon.com/general/latest/gr/aws-service-information.html
