// ── Blog post metadata for SEO ─────────────────────────────────────
//
// Canonical blog metadata consumed by the blog listing page, RSS feed,
// and sitemap. Each entry carries full markdown content for static
// rendering without an external CMS.

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readingTime: string;
  tags: string[];
  content: string;
}

// ── Post data ──────────────────────────────────────────────────────

export const BLOG_POST_DATA: BlogPostMeta[] = [
  // ── 1. System Design Interview Guide ─────────────────────────────
  {
    slug: "system-design-interview-complete-guide",
    title: "System Design Interview: The Complete Preparation Guide",
    description:
      "A comprehensive 2000-word guide to acing system design interviews. Covers the 4-step framework, common patterns, time management, and communication strategies used by successful candidates at top tech companies.",
    date: "2026-04-11",
    author: "Architex Team",
    readingTime: "15 min",
    tags: ["interview", "system-design"],
    content: `# System Design Interview: The Complete Preparation Guide

System design interviews are among the most challenging and consequential parts of the senior engineering hiring process. Unlike coding interviews with clear right-or-wrong answers, system design evaluates your ability to think at scale, make trade-offs, and communicate complex ideas clearly. This guide covers everything you need to prepare effectively.

## Why System Design Interviews Matter

At senior levels (L5+ at Google, E5+ at Meta, L5+ at Amazon), system design carries as much weight as coding rounds. Interviewers assess whether you can architect systems that serve millions of users, handle failures gracefully, and evolve over time. The signal they seek is not a perfect design but rather your engineering judgment and communication clarity.

## The 4-Step Framework

Every successful system design interview follows a structure. The 4-step framework ensures you cover all critical areas without running out of time.

### Step 1: Clarify Requirements (5 minutes)

Never jump straight into architecture. Start by asking clarifying questions to define the scope. There are two categories of requirements to nail down:

Functional requirements define what the system does. For a URL shortener, these might include creating short URLs, redirecting to originals, and tracking analytics. Non-functional requirements define how the system behaves: expected scale (100M URLs?), latency targets (sub-100ms redirects?), availability requirements (99.99%?), and durability guarantees.

Write these down visibly. Interviewers want to see that you can scope a problem before solving it. A common mistake is designing for requirements the interviewer never asked for, wasting precious time on features that do not matter.

### Step 2: Back-of-Envelope Estimation (5 minutes)

Estimation grounds your design in reality. Calculate key metrics that drive architectural decisions:

Start with traffic: if the system handles 100M daily active users making 10 requests each, that is 1 billion requests per day, or roughly 12,000 requests per second. Peak traffic is typically 2-3x average, so design for 30,000 RPS.

Calculate storage: if each record is 1KB and you store 1 billion records, that is 1TB of storage. Over 5 years, you need 5TB. These numbers tell you whether a single database suffices or whether you need sharding.

Estimate bandwidth: 30,000 RPS multiplied by 1KB average response size equals 30MB/s outbound bandwidth. This is well within the capacity of modern load balancers.

The goal is not precision but order-of-magnitude accuracy. If you calculate that you need 10 servers versus 10,000 servers, that fundamentally changes the architecture.

### Step 3: High-Level Design (15 minutes)

This is the core of your interview. Draw the major components and their interactions. Start from the client and work inward:

Begin with the API design. Define the key endpoints, their parameters, and response formats. For a URL shortener: POST /urls (create), GET /:shortCode (redirect), GET /urls/:shortCode/stats (analytics).

Then sketch the component architecture. Identify the load balancer, application servers, databases, caches, and any message queues or CDNs. Draw the data flow for each major operation.

Choose your database technology and justify it. SQL databases (PostgreSQL, MySQL) excel at complex queries and transactions. NoSQL databases (DynamoDB, Cassandra) excel at horizontal scaling and high write throughput. The choice depends on your access patterns and consistency requirements.

Design your data model. Show the key tables or collections, their fields, and indexes. For the URL shortener, you need a mapping table with columns for short_code (primary key), original_url, created_at, and expiry.

### Step 4: Deep Dive (15 minutes)

The interviewer will ask you to go deeper on specific components. Common deep-dive topics include:

Database scaling: How do you shard the data? What is your shard key? How do you handle cross-shard queries? Discuss consistent hashing for even distribution and the trade-offs of range-based versus hash-based sharding.

Caching strategy: Where do you add caches? What eviction policy (LRU, TTL)? How do you handle cache invalidation? Discuss the cache-aside pattern versus write-through caching.

Handling failures: What happens when a database node goes down? How does the system degrade gracefully? Discuss replication, failover, circuit breakers, and retry strategies with exponential backoff.

## Common Patterns You Must Know

Certain patterns appear repeatedly across different system design problems. Mastering these gives you building blocks for any question.

### Data Partitioning

Every large-scale system eventually outgrows a single database. Horizontal sharding distributes data across multiple database instances. The shard key determines which instance stores each record. Good shard keys distribute data evenly and keep related data together to minimize cross-shard queries.

### Caching Layers

Multi-level caching dramatically reduces latency. Browser caches handle static assets. CDN edge caches serve content from geographically close locations. Application-level caches (Redis, Memcached) store computed results. Database query caches avoid redundant computation. Each layer has different TTLs and invalidation strategies.

### Asynchronous Processing

Not every operation needs to complete synchronously. Message queues (Kafka, RabbitMQ, SQS) decouple producers from consumers, enabling the system to absorb traffic spikes and process work at its own pace. Common uses include email sending, image processing, analytics ingestion, and notification delivery.

### Leader-Follower Replication

Read-heavy workloads benefit from replication. A leader node handles all writes while follower nodes serve reads. This increases read throughput linearly with the number of followers. The trade-off is replication lag: followers may serve slightly stale data.

## Time Management

You have 35-45 minutes. Poor time management is the most common reason candidates fail. Here is a battle-tested allocation:

Requirements gathering: 5 minutes. Do not spend more. If you are still asking questions after 5 minutes, you are overthinking scope.

Estimation: 3-5 minutes. Quick math on napkin-level numbers. Move on even if estimates are rough.

High-level design: 15 minutes. This is your main act. Get the core architecture on the board with clear data flow.

Deep dive: 10-15 minutes. Go deep on 1-2 components. Show depth of knowledge.

Questions and wrap-up: 2-3 minutes. Ask the interviewer if there are areas they want to explore further.

## Communication Tips

How you communicate matters as much as what you design. Interviewers evaluate your ability to collaborate, not just your technical knowledge.

Think out loud. Share your reasoning as you make decisions. Say "I am choosing DynamoDB here because we need high write throughput and can tolerate eventual consistency" rather than silently drawing a box labeled "DB."

Acknowledge trade-offs. Every architectural decision has downsides. Proactively mention them: "This caching layer reduces latency but introduces a consistency window where users might see stale data for up to 30 seconds."

Use structured communication. When discussing a component, follow the pattern: what it does, why you chose it, what trade-offs it introduces, and how it interacts with other components.

Draw clean diagrams. Use boxes for services, cylinders for databases, and arrows for data flow. Label everything. A messy whiteboard signals disorganized thinking.

## What Interviewers Actually Look For

Having conducted hundreds of system design interviews, here is what differentiates strong candidates:

Scoping discipline: Can you identify what matters and ignore what does not? Spending 10 minutes on a feature that handles 0.1% of traffic is a red flag.

Trade-off awareness: Do you understand that every choice has a cost? Strong candidates say "we could use X, which gives us Y but costs us Z."

Depth on demand: Can you go deep when asked? Saying "we will use a cache" is surface-level. Explaining LRU eviction, cache stampede prevention, and TTL tuning shows mastery.

Practical experience signals: References to real systems, production incidents, or specific technologies you have worked with build credibility.

## Practice Strategy

Read about real architectures: study how Netflix, Uber, and Twitter built their systems. Their engineering blogs are gold mines.

Practice with a timer: simulate the 45-minute constraint. Record yourself and review.

Study the building blocks: master consistent hashing, message queues, database replication, caching, and load balancing before attempting full system designs.

Use Architex to build and visualize: drag components onto the canvas, connect them, and see how data flows through your architecture. Interactive practice builds intuition faster than reading alone.

## Conclusion

System design interviews reward prepared minds. The 4-step framework gives you structure. Common patterns give you building blocks. Time management keeps you on track. And clear communication ties it all together. Start practicing today, and approach your next interview with confidence.`,
  },

  // ── 2. CAP Theorem Deep Dive ─────────────────────────────────────
  {
    slug: "understanding-cap-theorem-beyond-basics",
    title: "Understanding CAP Theorem: Beyond the Basics",
    description:
      "A deep dive into CAP theorem, the PACELC extension, and real-world examples from DynamoDB, Cassandra, and Google Spanner. Learn how modern distributed databases navigate the fundamental trade-offs of distributed systems.",
    date: "2026-04-10",
    author: "Architex Team",
    readingTime: "12 min",
    tags: ["distributed-systems", "database"],
    content: `# Understanding CAP Theorem: Beyond the Basics

The CAP theorem is one of the most cited yet most misunderstood results in distributed systems. Engineers often reduce it to a simple trilemma -- pick two of three -- but the reality is far more nuanced. This post unpacks what CAP really means, extends it with the PACELC framework, and examines how production databases like DynamoDB, Cassandra, and Spanner navigate these trade-offs.

## The Original Theorem

In 2000, Eric Brewer conjectured (later proven by Gilbert and Lynch in 2002) that a distributed data store cannot simultaneously guarantee all three of the following properties:

Consistency (C): Every read receives the most recent write or an error. All nodes see the same data at the same time. This is linearizability, the strongest consistency model.

Availability (A): Every request receives a non-error response, without the guarantee that it contains the most recent write. The system always responds, even if the data might be stale.

Partition Tolerance (P): The system continues to operate despite an arbitrary number of messages being dropped or delayed by the network between nodes.

The critical insight is that network partitions are not optional. In any distributed system, networks will fail. Switches go down, cables get cut, and data centers lose connectivity. Since P is a given, the real choice during a partition is between C and A.

## Why "Pick Two" Is Misleading

The "pick two" framing suggests you make a permanent, system-wide choice. In reality, CAP is more subtle:

The trade-off only applies during a partition. When the network is healthy, you can have both consistency and availability. CAP constrains behavior during failure, not during normal operation.

Different operations can make different choices. A banking system might choose consistency for balance transfers (never show wrong balances) but availability for viewing transaction history (slightly stale history is acceptable).

Consistency and availability are not binary. Between strict linearizability and complete availability lie a spectrum of consistency models: eventual consistency, causal consistency, read-your-writes, monotonic reads, and more.

## The PACELC Extension

Daniel Abadi proposed PACELC in 2010 to address CAP's blind spot: what trade-offs exist when there is no partition?

PACELC states: if there is a Partition (P), choose between Availability (A) and Consistency (C); Else (E), when the system is running normally, choose between Latency (L) and Consistency (C).

This captures a crucial reality: even without partitions, enforcing strong consistency requires coordination between nodes, which adds latency. A system that replicates data synchronously across three data centers will have higher write latency than one that replicates asynchronously, even when all networks are healthy.

The PACELC classification reveals four practical categories:

PA/EL systems (like DynamoDB and Cassandra in their default configurations) choose availability during partitions and low latency during normal operation. They sacrifice consistency for speed.

PC/EC systems (like traditional single-leader relational databases with synchronous replication) choose consistency always, paying the cost in availability during partitions and latency during normal operation.

PA/EC systems choose availability during partitions but consistency during normal operation. This is unusual and represents systems that relax guarantees only under duress.

PC/EL systems choose consistency during partitions but optimize for latency when things are normal. Google Spanner approximates this category through its TrueTime mechanism.

## Real-World Examples

### Amazon DynamoDB (PA/EL)

DynamoDB defaults to eventual consistency for reads, meaning a read might not reflect the most recent write. This choice enables single-digit millisecond latency at any scale. During a partition, DynamoDB continues serving requests from whichever partition has the data, prioritizing availability.

However, DynamoDB offers strongly consistent reads as an option. When you request a strongly consistent read, DynamoDB routes the request to the leader replica and waits for the latest data. This costs twice the read capacity units and has higher latency, but guarantees you see the most recent write. This per-request flexibility lets applications choose their trade-off per operation.

DynamoDB also supports transactions with serializable isolation across multiple items and tables. These transactions sacrifice some availability and latency for cross-item consistency, demonstrating that modern databases do not make a single CAP choice but offer a menu of consistency options.

### Apache Cassandra (PA/EL, tunable)

Cassandra is a masterclass in tunable consistency. It lets you configure the consistency level per query using two parameters: the replication factor (how many copies of data exist) and the consistency level (how many replicas must acknowledge a read or write).

With a replication factor of 3, common configurations include:

ONE: write or read succeeds when a single replica acknowledges. Fastest, but you might read stale data.

QUORUM: write or read requires acknowledgment from a majority (2 of 3). This ensures that reads and writes overlap, providing strong consistency.

ALL: every replica must acknowledge. Strongest consistency but least available, since any single node failure blocks the operation.

The key insight is that when write consistency level plus read consistency level exceeds the replication factor, you get strong consistency. QUORUM writes plus QUORUM reads (2 + 2 > 3) guarantee that you always read the latest write.

During a partition, Cassandra with QUORUM consistency will reject operations that cannot reach enough replicas, behaving as a CP system. With ONE consistency, it continues serving from available replicas, behaving as an AP system. The same database exhibits different CAP behavior based on your per-query configuration.

### Google Spanner (PC/EL-ish)

Spanner challenges the conventional understanding of CAP by providing strong consistency (linearizability) across globally distributed data while maintaining high availability in practice. How does it do this?

The key innovation is TrueTime, a globally synchronized clock built on GPS receivers and atomic clocks in every Google data center. TrueTime does not give you the exact current time but instead gives you a bounded interval within which the true time falls. The uncertainty is typically less than 7 milliseconds.

Spanner uses TrueTime to implement a concurrency control scheme called external consistency. When a transaction commits, Spanner assigns it a timestamp and waits out the TrueTime uncertainty interval before acknowledging the commit. This wait (typically a few milliseconds) ensures that the assigned timestamp is in the past by the time any other transaction could observe the committed data.

The result is that Spanner behaves as a CP system: it chooses consistency over availability during partitions. Partitioned nodes will refuse to serve reads and writes rather than risk inconsistency. However, Google has engineered their network so thoroughly that partitions are extremely rare. In practice, Spanner achieves five-nines availability (99.999%) while maintaining strong consistency.

The trade-off is latency. Cross-region writes in Spanner typically take 10-15 milliseconds due to the TrueTime wait and synchronous replication. This is higher than eventually consistent systems but remarkably low for a globally consistent database.

## Beyond CAP: Consistency Models in Practice

Modern systems use a spectrum of consistency models. Understanding them helps you make informed trade-offs:

Linearizability: the strongest model. Operations appear to take effect at a single point in time between their invocation and response. This is what CAP calls "C."

Sequential consistency: all operations appear to execute in some sequential order consistent with the program order of each individual client. Slightly weaker than linearizability but often sufficient.

Causal consistency: operations that are causally related (one depends on the other) are seen by all nodes in the same order. Concurrent operations may be seen in different orders by different nodes.

Eventual consistency: given enough time without new writes, all replicas will converge to the same value. Provides no guarantees about ordering or how long convergence takes.

Read-your-writes: a session-level guarantee that your own writes are immediately visible to you, even if other clients might not see them yet. This is surprisingly important for user experience.

## Practical Advice for System Design

When designing a system, do not start with "should we be CP or AP?" Instead, ask these questions:

What are the consequences of reading stale data? If a user sees a friend count of 1,503 instead of 1,504 for a few seconds, nobody notices. If a bank balance shows the wrong amount after a transfer, that is a critical bug.

What are the consequences of temporary unavailability? If a social media feed is down for 30 seconds during a partition, users are annoyed. If a payment system is down for 30 seconds, transactions are lost and revenue suffers.

Can different parts of the system make different choices? Almost always yes. Use strong consistency for financial data, inventory counts, and unique constraints. Use eventual consistency for analytics, recommendations, and social features.

What is your latency budget? Synchronous replication across regions adds 50-150ms of write latency. If your SLA demands sub-10ms writes, you need asynchronous replication with eventual consistency.

Explore these trade-offs interactively in Architex. The [distributed systems module](/distributed) lets you simulate network partitions, observe consistency violations, and see how different configurations behave under failure.

## Conclusion

CAP is not a limitation to work around but a fundamental truth to design with. Network partitions are inevitable. Your job as an architect is to understand the consequences of each trade-off and make deliberate choices per operation, per data type, and per user expectation. The PACELC extension, combined with real-world examples from DynamoDB, Cassandra, and Spanner, provides a richer framework for making these decisions in practice.`,
  },

  // ── 3. Rate Limiting Algorithms ─────────────────────────────────
  {
    slug: "rate-limiting-algorithms-compared",
    title: "Rate Limiting Algorithms Compared: Token Bucket vs Sliding Window",
    description:
      "A technical comparison of rate limiting algorithms including token bucket, leaky bucket, fixed window, and sliding window. Covers implementation trade-offs, when to use each, and distributed rate limiting strategies.",
    date: "2026-04-09",
    author: "Architex Team",
    readingTime: "10 min",
    tags: ["system-design", "distributed-systems"],
    content: `# Rate Limiting Algorithms Compared: Token Bucket vs Sliding Window

Rate limiting is a critical component of any production API. It protects your servers from abuse, ensures fair resource allocation, and prevents cascading failures. But not all rate limiting algorithms are created equal. This post compares the four most common algorithms, their implementation trade-offs, and when to use each.

## Why Rate Limiting Matters

Without rate limiting, a single misbehaving client can consume all your server resources. A bot scraping your API at 10,000 requests per second will crowd out legitimate users. A buggy client stuck in a retry loop can amplify a minor issue into a full outage. DDoS attacks become trivial when there are no request limits.

Rate limiting serves multiple purposes: protecting backend services from overload, ensuring fair usage across clients, managing API costs and quotas, and providing a defense layer against abuse.

## Algorithm 1: Fixed Window Counter

The simplest approach divides time into fixed windows (e.g., 1-minute intervals) and counts requests per window. When the count exceeds the limit, subsequent requests are rejected until the next window starts.

Implementation: maintain a counter keyed by client ID and window start time. On each request, increment the counter. If it exceeds the threshold, reject. When the window expires, the counter resets.

Advantages: extremely simple to implement. A single Redis INCR with EXPIRE gives you a working rate limiter in a few lines of code. Memory efficient since you only store one counter per client per window.

Disadvantages: the boundary problem. Consider a limit of 100 requests per minute. A client sends 100 requests at 0:59 and another 100 at 1:01. Within a 2-second span centered on the minute boundary, the client sent 200 requests, double the intended limit. This happens because the counter resets at exact window boundaries.

Best for: simple use cases where occasional bursts at window boundaries are acceptable. Good for coarse-grained limits (e.g., 10,000 requests per day) where boundary effects are negligible.

## Algorithm 2: Sliding Window Log

The sliding window log tracks the timestamp of every request within the window. To check if a request should be allowed, count all timestamps within the last N seconds.

Implementation: store a sorted set of timestamps per client. On each request, remove timestamps older than the window, add the current timestamp, and check if the set size exceeds the limit. In Redis, this maps cleanly to ZREMRANGEBYSCORE, ZADD, and ZCARD.

Advantages: perfectly accurate. No boundary problem because the window slides continuously. Every request is evaluated against exactly the right time range.

Disadvantages: high memory usage. Storing every request timestamp means memory scales with request volume, not just client count. For a client making 1,000 requests per minute, you store 1,000 timestamps. At scale with millions of clients, this becomes expensive.

Best for: scenarios where accuracy is paramount and request volumes are moderate. Good for billing-related limits where you cannot afford to over-count or under-count.

## Algorithm 3: Sliding Window Counter

A hybrid approach that combines the efficiency of fixed windows with the accuracy of sliding windows. It uses counters from the current and previous windows, weighted by how far into the current window you are.

Implementation: maintain counters for the current and previous fixed windows. To estimate the request count at any point, calculate: previous_window_count * overlap_percentage + current_window_count. If the previous window had 70 requests and the current window has 30 requests and you are 40% through the current window, the estimated count is 70 * 0.6 + 30 = 72.

Advantages: near-perfect accuracy with minimal memory. Only two counters per client regardless of request volume. The weighted calculation smooths out the boundary problem that plagues fixed windows.

Disadvantages: it is an approximation. The weighted average assumes requests in the previous window were uniformly distributed, which may not be true. In practice, the error is small enough to be acceptable for nearly all use cases.

Best for: the default choice for most production systems. Cloudflare uses this approach. It balances accuracy, memory efficiency, and implementation simplicity better than any other algorithm.

## Algorithm 4: Token Bucket

The token bucket is the most flexible algorithm. Imagine a bucket that holds tokens. Tokens are added at a fixed rate (the refill rate). Each request consumes one token. If the bucket is empty, the request is rejected. The bucket has a maximum capacity that limits the burst size.

Implementation: store two values per client: the current token count and the last refill timestamp. On each request, calculate how many tokens have been added since the last refill, add them (up to the bucket capacity), then try to consume a token. This lazy refill approach means you only update state when a request arrives.

Advantages: naturally handles bursts. A bucket with capacity 100 and refill rate of 10 tokens per second allows a burst of 100 requests followed by a sustained rate of 10 per second. This matches real-world traffic patterns where clients send batches of requests followed by quiet periods.

The two parameters (capacity and refill rate) give you fine-grained control over both burst behavior and sustained rate. You can allow generous bursts with strict sustained limits, or vice versa.

Disadvantages: two parameters to tune instead of one. The relationship between bucket capacity, refill rate, and the resulting behavior is not always intuitive. A misconfigured bucket can either be too permissive or too restrictive.

Best for: APIs where you want to allow bursts. AWS API Gateway, Stripe, and most cloud provider APIs use token bucket rate limiting. It is ideal when you want to express limits as "X requests per second with a burst allowance of Y."

## Algorithm 5: Leaky Bucket

The leaky bucket is the dual of the token bucket. Requests enter a queue (the bucket) and are processed at a fixed rate. If the queue is full, new requests are rejected.

Implementation: model the bucket as a FIFO queue with a fixed processing rate. On each request, if the queue has space, enqueue the request. A separate process dequeues and processes requests at the fixed rate. In practice, you often implement this as a token bucket where each request consumes tokens and tokens refill at the leak rate.

Advantages: produces a perfectly smooth output rate. While the token bucket allows bursts, the leaky bucket enforces a constant processing rate. This is ideal when the downstream system has a strict throughput limit.

Disadvantages: does not accommodate bursts at all. Even if the system has spare capacity, requests must wait in the queue. This can lead to unnecessary latency spikes during traffic bursts that the system could otherwise handle.

Best for: scenarios where you need to smooth traffic to a fixed rate. Useful when forwarding to systems with strict throughput limits, such as third-party APIs with hard rate caps.

## Comparison Table

When choosing an algorithm, consider these dimensions:

Memory per client: Fixed window and sliding window counter use O(1) memory. Sliding window log uses O(N) where N is the request count. Token bucket and leaky bucket use O(1).

Accuracy: Sliding window log is exact. Sliding window counter is near-exact. Fixed window has boundary issues. Token bucket and leaky bucket are exact for their specific semantics.

Burst handling: Token bucket allows controlled bursts. Leaky bucket prevents bursts entirely. Window-based algorithms have no explicit burst control.

Implementation complexity: Fixed window is simplest. Sliding window counter and token bucket are moderate. Sliding window log and leaky bucket with actual queuing are more complex.

## Distributed Rate Limiting

In a distributed system with multiple API servers, rate limiting requires shared state. Several approaches exist:

Centralized counter with Redis: all servers increment a shared counter in Redis. This is the most common approach. Use Lua scripts for atomic check-and-increment operations. The trade-off is that every request requires a Redis round-trip, adding 1-3ms of latency.

Local rate limiters with overprovisioning: each server maintains its own rate limiter with a limit of total_limit / server_count. This avoids the Redis dependency but becomes inaccurate as servers scale up and down. A common refinement is to use a gossip protocol to share approximate counts between servers.

Token bucket with Redis: store the token count and last refill time in Redis. Use a Lua script to atomically calculate refill, check availability, and decrement. This is the approach used by many API gateway implementations.

Approximate algorithms: for very high throughput systems, use probabilistic data structures like Count-Min Sketch to approximate request counts with bounded error. This sacrifices some accuracy for extreme performance.

## Rate Limit Headers

Regardless of the algorithm, always communicate rate limit state to clients through standard headers:

X-RateLimit-Limit: the maximum number of requests allowed in the current window.

X-RateLimit-Remaining: how many requests the client can still make in the current window.

X-RateLimit-Reset: the Unix timestamp when the rate limit window resets.

Retry-After: when a request is rate-limited (HTTP 429), this header tells the client how many seconds to wait before retrying.

These headers enable well-behaved clients to self-regulate, reducing the load on your rate limiter and improving the developer experience.

## Implementation Trade-offs

When implementing rate limiting in production, consider:

Where to enforce: at the API gateway (centralized, consistent), in application middleware (flexible, per-route configuration), or at the load balancer level (coarse-grained, high performance). Most systems use multiple layers.

Granularity: per user, per API key, per IP, per endpoint, or combinations. A common pattern is a generous global limit per API key with stricter per-endpoint limits for expensive operations.

Graceful degradation: when your rate limiting infrastructure (e.g., Redis) is down, should you fail open (allow all traffic) or fail closed (reject all traffic)? Failing open is usually the right choice because a broken rate limiter should not cause a total outage.

Explore rate limiting algorithms interactively in Architex. The [Rate Limiting concept page](/concepts/rate-limiting) lets you visualize token bucket and sliding window behaviors with adjustable parameters.

## Conclusion

There is no universally best rate limiting algorithm. Token bucket excels for APIs that need burst tolerance. Sliding window counter is the best default for its balance of accuracy and efficiency. Fixed window works for simple cases. And leaky bucket smooths traffic to a constant rate. Choose based on your specific requirements for burst handling, accuracy, memory, and implementation complexity.`,
  },
];

// ── Query helpers ──────────────────────────────────────────────────

/** Return all blog posts sorted by date descending. */
export function getAllPosts(): BlogPostMeta[] {
  return [...BLOG_POST_DATA].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/** Look up a single blog post by slug. */
export function getPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POST_DATA.find((p) => p.slug === slug);
}
