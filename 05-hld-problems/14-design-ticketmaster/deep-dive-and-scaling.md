# Design Ticketmaster / Event Booking System -- Deep Dive and Scaling

## Table of Contents
- [3.1 Deep Dive: Seat Locking at Scale](#31-deep-dive-seat-locking-at-scale)
- [3.2 Deep Dive: Flash Sale and the Thundering Herd](#32-deep-dive-flash-sale-and-the-thundering-herd)
- [3.3 Deep Dive: Consistency -- Never Oversell](#33-deep-dive-consistency----never-oversell)
- [3.4 Overbooking Strategy (Airlines Model)](#34-overbooking-strategy-airlines-model)
- [3.5 Dynamic Pricing](#35-dynamic-pricing)
- [3.6 Scalability and Performance](#36-scalability-and-performance)
- [3.7 Failure Scenarios and Recovery](#37-failure-scenarios-and-recovery)
- [3.8 Monitoring and Observability](#38-monitoring-and-observability)
- [3.9 Real-World Systems Comparison](#39-real-world-systems-comparison)
- [3.10 Trade-off Analysis](#310-trade-off-analysis)
- [3.11 Interview Tips](#311-interview-tips)

---

## 3.1 Deep Dive: Seat Locking at Scale

### Three Approaches to Concurrent Seat Booking

This is the question the interviewer is really asking: "How do you prevent two people from
booking the same seat?" There are three approaches, and production systems use a combination.

### Approach 1: Redis SETNX with TTL (Optimistic, Fast Path)

```
How It Works:
─────────────
  1. User selects seat → server calls Redis: SET seat_lock:evt:seat VALUE NX EX 420
  2. Redis is single-threaded → SETNX is atomic → exactly one caller wins
  3. Winner gets the seat, loser gets 409 Conflict immediately
  4. Lock auto-expires after TTL if user never completes payment

Implementation Detail:
──────────────────────

  -- Lock acquisition (single seat)
  SET seat_lock:evt_123:sec101_A_5 "hold_abc:usr_456:1714560000" NX EX 420

  Returns OK  → lock acquired
  Returns nil → lock already held by someone else

  -- Lock acquisition (multiple seats, atomic via Lua)
  EVAL "
    -- Check phase
    for i, key in ipairs(KEYS) do
      if redis.call('EXISTS', key) == 1 then
        return redis.call('GET', key)  -- return who holds the blocking seat
      end
    end
    -- Lock phase
    for i, key in ipairs(KEYS) do
      redis.call('SET', key, ARGV[1], 'EX', tonumber(ARGV[2]))
    end
    return 'OK'
  " 4 seat_lock:evt:s1 seat_lock:evt:s2 seat_lock:evt:s3 seat_lock:evt:s4 \
    "hold_abc:usr_456" "420"

  -- Lock release (only by owner, Lua for safety)
  EVAL "
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      redis.call('DEL', KEYS[1])
      return 1
    end
    return 0
  " 1 seat_lock:evt:sec101_A_5 "hold_abc:usr_456"

Performance:
────────────
  Single SETNX:     < 1ms
  Lua (4 seats):    < 5ms
  Throughput:       100,000+ ops/sec per Redis node

Failure Mode:
─────────────
  If Redis crashes (node failure):
    - Active holds are lost (all seats appear available in Redis)
    - PostgreSQL still has the hold records
    - On Redis restart: rebuild state from PostgreSQL active holds
    - During the gap: possible double-locks (caught by PostgreSQL constraint)

  Mitigation:
    - Redis Cluster with replication (1 primary + 2 replicas per shard)
    - On primary failure: replica promotes in < 5 seconds
    - Small window of potential inconsistency (< 1 second of lost writes)
    - PostgreSQL constraint is the ultimate safety net
```

### Approach 2: Optimistic Locking with Version (Database, Safety Net)

```
How It Works:
─────────────
  Each seat has a "version" column. To update a seat, you must provide
  the version you read. If someone else updated it first, your version
  is stale and the UPDATE affects 0 rows → you lose.

  This is optimistic because it assumes conflicts are rare and checks
  only at write time.

Implementation:
──────────────
  -- Step 1: Read seat status and version
  SELECT status, version, hold_id
  FROM event_seat
  WHERE event_id = 'evt_123' AND seat_id = 'sec101_A_5';
  -- Returns: status=AVAILABLE, version=5, hold_id=NULL

  -- Step 2: Attempt to lock (only succeeds if version matches)
  UPDATE event_seat
  SET status = 'HELD',
      hold_id = 'hold_abc',
      held_until = NOW() + INTERVAL '7 minutes',
      version = version + 1
  WHERE event_id = 'evt_123'
    AND seat_id = 'sec101_A_5'
    AND status = 'AVAILABLE'    -- must still be available
    AND version = 5;            -- must not have been modified

  -- Check: affected_rows == 1? → Success
  --        affected_rows == 0? → Someone else got it (stale version)

  -- Step 3: Confirm booking
  UPDATE event_seat
  SET status = 'SOLD',
      booking_id = 'bk_xyz',
      hold_id = NULL,
      held_until = NULL,
      version = version + 1
  WHERE event_id = 'evt_123'
    AND seat_id = 'sec101_A_5'
    AND status = 'HELD'
    AND hold_id = 'hold_abc'
    AND version = 6;

Multi-Seat Atomic Lock (DB transaction):
────────────────────────────────────────
  BEGIN;

  -- Lock all seats in a single transaction
  -- Use SELECT ... FOR UPDATE to prevent concurrent reads
  SELECT seat_id, status, version
  FROM event_seat
  WHERE event_id = 'evt_123'
    AND seat_id IN ('s1', 's2', 's3', 's4')
    AND status = 'AVAILABLE'
  FOR UPDATE;                    -- row-level exclusive lock

  -- If we got exactly 4 rows, all are available
  -- Update all 4 atomically
  UPDATE event_seat
  SET status = 'HELD',
      hold_id = 'hold_abc',
      held_until = NOW() + INTERVAL '7 minutes',
      version = version + 1
  WHERE event_id = 'evt_123'
    AND seat_id IN ('s1', 's2', 's3', 's4');

  COMMIT;

Performance:
────────────
  Single seat update:  20-50ms (includes index lookup + row lock)
  Multi-seat (4):      50-100ms (single transaction)
  Throughput:          ~5,000 transactions/sec per PostgreSQL primary
  Under contention:    Retries add latency; can degrade to 200-500ms

When to Use:
────────────
  - As the CONFIRMATION step (after Redis lock, before final booking)
  - As a fallback if Redis is temporarily unavailable
  - For the final source-of-truth check before charging payment
```

### Approach 3: Distributed Lock (Redlock, Cross-Datacenter)

```
How It Works:
─────────────
  Redlock algorithm: acquire locks on N/2+1 independent Redis nodes.
  If majority succeed within a time window, the lock is considered acquired.
  Designed for multi-datacenter scenarios where a single Redis cannot be trusted.

  For Ticketmaster: probably unnecessary. Single-datacenter Redis Cluster
  with replication is sufficient for most events. Redlock adds latency
  and complexity.

When You Would Use It:
──────────────────────
  - Multi-datacenter active-active deployment
  - When a single Redis failure is unacceptable (financial trading)
  - Regulatory requirement for stronger lock guarantees

  For Ticketmaster: NOT recommended as primary. The Redis SETNX + PostgreSQL
  defense-in-depth approach is simpler and handles all realistic scenarios.

Implementation (for reference):
──────────────────────────────
  1. Get current time T1
  2. Try SET NX on 5 independent Redis instances (not replicas)
  3. If >= 3 succeed AND total time < lock_validity:
     → Lock acquired (validity = TTL - (now - T1))
  4. If < 3 succeed:
     → Unlock all, retry after random delay

  Latency: 50-100ms (5 network round trips)
  Complexity: Must handle clock drift, partial failures
  Controversial: Martin Kleppmann argued Redlock is unsafe in practice
```

### Our Combined Strategy

```
Production Seat Locking Architecture:

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │  Layer 1: Redis SETNX (Speed)                                  │
  │  ────────────────────────────                                   │
  │  ✓ Primary lock mechanism                                      │
  │  ✓ Sub-5ms latency                                             │
  │  ✓ 100K+ ops/sec                                               │
  │  ✓ Auto-expiry via TTL                                         │
  │  ✗ Volatile (lost on crash)                                    │
  │                                                                 │
  │  ↓ Lock acquired in Redis? Proceed to hold creation            │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Layer 2: PostgreSQL Hold Record (Durability)                  │
  │  ────────────────────────────────────────────                   │
  │  ✓ Durable record of hold                                     │
  │  ✓ Survives Redis failure                                      │
  │  ✓ Source of truth for hold status                             │
  │  ✓ Used by cleanup job for expired hold detection              │
  │                                                                 │
  │  ↓ Payment succeeds? Proceed to booking confirmation           │
  │                                                                 │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Layer 3: PostgreSQL Booking Transaction (Correctness)         │
  │  ─────────────────────────────────────────────────             │
  │  ✓ UPDATE with WHERE version=N + status=HELD + hold_id=mine   │
  │  ✓ UNIQUE constraint on (event_id, seat_id) WHERE SOLD        │
  │  ✓ Atomic transaction for multi-seat booking                   │
  │  ✓ The FINAL arbiter -- if this fails, booking fails           │
  │                                                                 │
  │  Even if Redis had a bug and gave locks to 2 users,            │
  │  only 1 will succeed at this layer.                            │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  Defense in Depth:
    Redis prevents most contention at high speed
    PostgreSQL prevents ALL double-bookings with absolute certainty
    Both together: fast AND correct
```

---

## 3.2 Deep Dive: Flash Sale and the Thundering Herd

### The Thundering Herd Problem

```
Thundering Herd Visualization:

  T = 10:00:00.000 (On-sale time)

  ─────── Before on-sale ───────
  10M users staring at countdown timer, finger hovering over "Buy"

  ─────── T+0ms to T+100ms ───────
  ALL 10M users send requests simultaneously

  Without protection:
  ┌─────────────────────────────────────────────────────┐
  │  Load Balancer: 167,000 req/sec                     │
  │  ├── API Gateway: OVERWHELMED (10x capacity)         │
  │  ├── Booking Service: CRASHED (OOM)                  │
  │  ├── Redis: 100K+ SETNX in 1 second (survivable)    │
  │  ├── PostgreSQL: 50K writes/sec (connection pool     │
  │  │   exhausted, timeouts, cascading failures)        │
  │  └── Payment Gateway: rate limited by Stripe         │
  │                                                      │
  │  Result: 503 errors for 99% of users                │
  │  Headlines: "TICKETMASTER CRASHES AGAIN"              │
  └─────────────────────────────────────────────────────┘

  With virtual waiting room:
  ┌─────────────────────────────────────────────────────┐
  │  Queue Service: absorbs 10M requests                │
  │  ├── Lightweight endpoint: assign position + token   │
  │  ├── No database writes needed for queueing          │
  │  ├── Redis ZADD: 100K+ ops/sec (handles easily)     │
  │  ├── Admit 500 users every 30 seconds                │
  │  └── Each batch has low-contention access             │
  │                                                      │
  │  Result: All users get a queue position              │
  │  "You are #45,231 in line"                           │
  │  System processes at sustainable rate                 │
  └─────────────────────────────────────────────────────┘
```

### Virtual Queue Implementation Deep Dive

```
Queue Architecture in Redis:

  Data Structures:
  ────────────────
  1. Sorted Set: Queue positions
     ZADD queue:evt_123 <random_score> <user_id>
     - Score = random float [0, 1] → fair random ordering
     - 10M members → ~300 MB in Redis (manageable)

  2. Hash: User → queue metadata
     HSET queue_meta:evt_123:usr_456 \
       joined_at "2026-05-01T10:00:00.123Z" \
       position "45231" \
       status "WAITING"

  3. String: Access tokens for admitted users
     SET access:evt_123:usr_789 "jwt_token_here" EX 600
     - TTL = 10 minutes (time to complete booking)

  Queue Operations:
  ────────────────
  Join queue:
    score = random.uniform(0, 1)
    ZADD queue:evt_123 NX score usr_456        -- NX = no update if exists
    position = ZRANK queue:evt_123 usr_456     -- O(log N)
    total = ZCARD queue:evt_123                -- O(1)
    → Return {position, total, estimated_wait}

  Check position:
    position = ZRANK queue:evt_123 usr_456
    → Return {position, estimated_wait}

  Admit batch:
    users = ZPOPMIN queue:evt_123 500          -- pop 500 lowest scores
    for user in users:
      token = generate_jwt(user, event, ttl=600)
      SET access:evt_123:user token EX 600
      notify_user(user, token)                 -- WebSocket push

  Validate admission:
    token = GET access:evt_123:usr_789
    if token is None → not admitted or token expired
    verify_jwt(token) → check signature + expiry
```

### Token Bucket Admission Control

```
Token Bucket for Rate-Controlled Admission:

  Concept:
  ────────
  A "bucket" fills with tokens at a fixed rate. Each admitted user
  consumes one token. When the bucket is empty, admission pauses
  until new tokens are generated.

  Parameters:
  ──────────
  - Bucket capacity: 500 (max burst admission)
  - Refill rate: 500 tokens per 30 seconds
  - Refill adjusted by: remaining inventory, active hold count

  Implementation (Redis):
  ──────────────────────
  -- Token bucket as Redis Lua script
  local key = "admission_bucket:" .. KEYS[1]  -- event_id
  local now = tonumber(ARGV[1])               -- current timestamp ms
  local rate = tonumber(ARGV[2])              -- tokens per second
  local capacity = tonumber(ARGV[3])          -- max tokens

  local bucket = redis.call("HMGET", key, "tokens", "last_refill")
  local tokens = tonumber(bucket[1]) or capacity
  local last_refill = tonumber(bucket[2]) or now

  -- Refill tokens based on elapsed time
  local elapsed = (now - last_refill) / 1000
  tokens = math.min(capacity, tokens + elapsed * rate)

  if tokens >= 1 then
    tokens = tokens - 1
    redis.call("HMSET", key, "tokens", tokens, "last_refill", now)
    return 1  -- admitted
  else
    redis.call("HMSET", key, "tokens", tokens, "last_refill", now)
    return 0  -- wait
  end

  Adaptive Rate:
  ─────────────
  The refill rate adjusts based on system health:

  if remaining_seats > 5000:
    rate = 20 tokens/sec (aggressive admission)
  elif remaining_seats > 1000:
    rate = 10 tokens/sec (moderate)
  elif remaining_seats > 100:
    rate = 2 tokens/sec (conservative)
  else:
    rate = 0.5 tokens/sec (trickle, almost sold out)
```

### Pre-Generated Booking Tokens

```
Pre-Generated Token Strategy (For Extreme Scale):

  Instead of generating tokens on-demand during the flash sale,
  pre-generate a fixed number of booking tokens BEFORE the on-sale time.

  How It Works:
  ────────────
  1. Before on-sale: generate N tokens (one per available seat)
     For 80,000 seat venue: generate 80,000 booking tokens

  2. Tokens stored in Redis as a list:
     LPUSH tokens:evt_123 token_1 token_2 ... token_80000

  3. When a user is admitted from the queue:
     token = LPOP tokens:evt_123
     If token is None → sold out (no more tokens to give)

  4. Token is a signed JWT containing:
     {event_id, seat_section_hint, expires_at, nonce}

  5. User presents token when locking seats:
     - Token validates that user was legitimately admitted
     - Token is single-use (nonce tracked in Redis SET)
     - Token has short TTL (10 minutes)

  Why This Helps:
  ──────────────
  - We know exactly how many users CAN book (= available seats)
  - Once tokens run out, we stop admitting → no wasted queue processing
  - Each token is pre-generated → no JWT signing under peak load
  - Prevents the scenario: "admitted from queue, but all seats gone"

  Trade-offs:
  ──────────
  - Seats may have varied hold success rates (some users abandon)
  - Generate 1.5x tokens (120,000 for 80,000 seats) to account for
    abandonment, then stop admission when seats actually sell out
  - More complex token lifecycle management
```

### Bot Detection During Flash Sales

```
Anti-Bot Measures:

  Layer 1: CAPTCHA at Queue Entry
  ───────────────────────────────
  - Invisible reCAPTCHA v3 for low-friction check
  - Challenge-based CAPTCHA for suspicious scores (< 0.5)
  - Must complete CAPTCHA before receiving queue position
  - Bots that solve CAPTCHA at scale are expensive ($2-5 per solve)
    which makes scalping less profitable

  Layer 2: Device Fingerprinting
  ──────────────────────────────
  - Collect browser fingerprint (screen resolution, fonts, WebGL hash)
  - Detect headless browsers (Puppeteer, Playwright)
  - Flag users with matching fingerprints (same bot, many accounts)
  - Require phone number verification for flagged accounts

  Layer 3: Behavioral Analysis
  ────────────────────────────
  - Time from page load to "Buy" click (bots click in < 100ms)
  - Mouse movement patterns (bots move in straight lines)
  - Request cadence (bots have unnaturally consistent timing)
  - API-only access (no preceding page views → likely API scraping)

  Layer 4: Rate Limiting
  ──────────────────────
  - Per IP: 10 requests/second
  - Per user: 1 queue entry per event
  - Per IP block: if > 100 unique users from same /24 → block
  - Geo-blocking: block known datacenter IP ranges (AWS, GCP)

  Ticketmaster's Approach: "Verified Fan"
  ───────────────────────────────────────
  - Fans register interest days before on-sale
  - System verifies: account age, purchase history, identity
  - Verified fans get priority queue access
  - Dramatically reduces bot success rate
```

---

## 3.3 Deep Dive: Consistency -- Never Oversell

### Why Overselling Is the Worst Failure

```
Impact of Overselling:

  Technical: Two confirmed tickets for the same seat
  Business:  Must cancel one ticket → angry customer
  Legal:     Potential lawsuits, regulatory fines
  Brand:     Viral social media backlash
  Financial: Refund costs + compensation + lost trust

  Contrast with other systems:
  ├── E-commerce: oversell a T-shirt → ship later (backorder), inconvenient
  ├── Social media: duplicate post → delete one, minor
  ├── Ticketing: oversell a seat → two people show up at same seat → CRISIS
  └── Airlines: actually overbook on purpose (but it is a deliberate choice)

  Rule: It is ALWAYS better to show "sold out" 1 second too early than to
  sell the same seat twice. False negatives are vastly preferable to false
  positives.
```

### Exactly-Once Booking via Idempotency + DB Constraints

```
Three Layers of Oversell Prevention:

  ┌─────────────────────────────────────────────────────────────────┐
  │ Layer 1: Idempotency Keys (Prevent Duplicate Requests)         │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Problem: Network timeout → client retries → double booking     │
  │                                                                 │
  │  Solution: Idempotency key on every booking request             │
  │                                                                 │
  │  Flow:                                                          │
  │  1. Client generates key: "book_{hold_id}_{timestamp}"          │
  │  2. Server checks Redis: EXISTS idempotency:{key}               │
  │  3. If exists → return cached response (no new booking)         │
  │  4. If not exists → process booking, store result:              │
  │     SET idempotency:{key} {response_json} EX 86400              │
  │  5. Also store in PostgreSQL:                                   │
  │     INSERT INTO booking(idempotency_key=key, ...)               │
  │     UNIQUE constraint on idempotency_key                        │
  │                                                                 │
  │  Result: Same request sent 10 times = exactly 1 booking         │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ Layer 2: Optimistic Concurrency (Prevent Race Conditions)      │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Problem: Two different users both hold the same seat (Redis    │
  │  somehow failed) and both try to confirm.                       │
  │                                                                 │
  │  Solution: Optimistic locking with version numbers              │
  │                                                                 │
  │  UPDATE event_seat                                              │
  │  SET status = 'SOLD', version = version + 1                     │
  │  WHERE event_id = ? AND seat_id = ?                             │
  │    AND status = 'HELD'       -- must be HELD, not already SOLD  │
  │    AND hold_id = ?           -- must be MY hold                 │
  │    AND version = ?;          -- must not have changed            │
  │                                                                 │
  │  affected_rows = 1 → success (I won)                            │
  │  affected_rows = 0 → someone else already confirmed             │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ Layer 3: Database Constraints (Ultimate Safety Net)            │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Problem: What if application logic has a bug?                  │
  │                                                                 │
  │  Solution: Database-level constraints that make overselling      │
  │  PHYSICALLY IMPOSSIBLE regardless of application code.          │
  │                                                                 │
  │  -- Option A: Unique partial index                              │
  │  CREATE UNIQUE INDEX idx_one_booking_per_seat                   │
  │  ON event_seat (event_id, seat_id)                              │
  │  WHERE status = 'SOLD';                                         │
  │                                                                 │
  │  -- Option B: Separate sold_seat table                          │
  │  CREATE TABLE sold_seat (                                       │
  │    event_id UUID NOT NULL,                                      │
  │    seat_id UUID NOT NULL,                                       │
  │    booking_id UUID NOT NULL,                                    │
  │    PRIMARY KEY (event_id, seat_id)  -- PK = unique              │
  │  );                                                             │
  │                                                                 │
  │  Any attempt to insert a second sold record for the same seat   │
  │  → UNIQUE VIOLATION → transaction rolls back → booking fails    │
  │                                                                 │
  │  This works even if Redis failed, version checks had a bug,     │
  │  and application code was wrong. The database is the last wall. │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### Booking Confirmation Transaction (Detailed)

```sql
-- The complete booking confirmation transaction
-- This runs when a user clicks "Pay Now" and payment succeeds

BEGIN;

-- Step 1: Validate the hold (defensive check)
SELECT h.hold_id, h.user_id, h.status, h.expires_at
FROM hold h
WHERE h.hold_id = 'hold_abc123'
  AND h.user_id = 'usr_456'
  AND h.status = 'ACTIVE'
  AND h.expires_at > NOW()
FOR UPDATE;  -- lock the hold row

-- If no rows: hold expired or doesn't belong to this user → ROLLBACK

-- Step 2: Lock and update all seats atomically
UPDATE event_seat
SET status = 'SOLD',
    booking_id = 'bk_xyz789',
    hold_id = NULL,
    held_until = NULL,
    version = version + 1
WHERE event_id = 'evt_123'
  AND seat_id IN ('s1', 's2', 's3', 's4')
  AND status = 'HELD'
  AND hold_id = 'hold_abc123';

-- Check: affected_rows must equal number of seats in hold
-- If not: some seats were modified by another process → ROLLBACK

-- Step 3: Create booking record
INSERT INTO booking (
    booking_id, user_id, event_id, hold_id,
    total_price, payment_id, status, idempotency_key
) VALUES (
    'bk_xyz789', 'usr_456', 'evt_123', 'hold_abc123',
    1800.00, 'pay_stripe_pi_abc', 'CONFIRMED',
    'book_hold_abc123_1714560200'
);
-- UNIQUE on idempotency_key → prevents duplicate booking

-- Step 4: Insert into sold_seat (ultimate double-booking prevention)
INSERT INTO sold_seat (event_id, seat_id, booking_id)
VALUES ('evt_123', 's1', 'bk_xyz789'),
       ('evt_123', 's2', 'bk_xyz789'),
       ('evt_123', 's3', 'bk_xyz789'),
       ('evt_123', 's4', 'bk_xyz789');
-- PRIMARY KEY (event_id, seat_id) → physically prevents two bookings for same seat

-- Step 5: Update hold status
UPDATE hold SET status = 'CONVERTED' WHERE hold_id = 'hold_abc123';

-- Step 6: Update inventory counters (denormalized for fast reads)
UPDATE event_inventory
SET sold_count = sold_count + 4,
    held_count = held_count - 4
WHERE event_id = 'evt_123';

COMMIT;

-- Post-commit: async operations
-- 1. Publish BookingConfirmed to Kafka
-- 2. Delete Redis seat locks (no longer needed)
-- 3. Update Redis counters
```

---

## 3.4 Overbooking Strategy (Airlines Model)

```
Airlines Deliberately Overbook (and it works):

  How: Sell 105 tickets for 100 seats
  Why: ~5% of passengers no-show
  Net effect: 100 passengers on a 100-seat plane (perfect utilization)

Can Ticketmaster Do This?

  In theory: sell 83,000 tickets for an 80,000-seat venue
  Expected no-show rate: ~3-5% for concerts

  But there are critical differences:

  Airlines vs. Events:
  ┌──────────────────────┬──────────────────────────────────┐
  │ Airlines             │ Events/Concerts                   │
  ├──────────────────────┼──────────────────────────────────┤
  │ Fungible seats       │ Unique seats (row/section matter)│
  │ (any seat in economy │ (I paid for Floor Row A Seat 5)  │
  │  is interchangeable) │                                  │
  ├──────────────────────┼──────────────────────────────────┤
  │ Predictable no-show  │ Lower no-show rate for popular   │
  │ rate (5-10%)         │ events (people REALLY want to go)│
  ├──────────────────────┼──────────────────────────────────┤
  │ Legal framework for  │ No legal framework for concert   │
  │ denied boarding      │ denied entry                     │
  │ (compensation rules) │                                  │
  ├──────────────────────┼──────────────────────────────────┤
  │ Regular travelers    │ One-time emotional purchase       │
  │ (understand the game)│ (fan will riot if denied)        │
  └──────────────────────┴──────────────────────────────────┘

  Verdict: DO NOT overbooking for assigned-seat events.
  Exception: General admission (festival, standing room) can oversell
  by 2-3% because seats are not assigned.

  For GA (General Admission):
  ──────────────────────────
  - Capacity: 10,000 standing
  - Sell: 10,200 tickets
  - Expected no-show: ~300 (3%)
  - Worst case: 10,200 show up → venue slightly crowded but manageable
  - Monitor check-in rate in real-time → stop selling if trending above 98%
```

---

## 3.5 Dynamic Pricing

```
Dynamic Pricing Model (Surge Pricing for Events):

  Concept: Adjust ticket prices based on demand in real-time,
  similar to Uber's surge pricing or airline fare classes.

  Implementation:
  ──────────────
  Base price for Section 101: $200

  Pricing factors:
  1. Demand ratio:    demand_score = (requests per minute) / (seats available)
  2. Time to event:   urgency_score = 1.0 / (days_until_event)
  3. Section fill:    scarcity_score = seats_sold / total_seats_in_section
  4. Historical:      similar_event_multiplier (comparable past events)

  Formula:
    multiplier = 1.0
                + demand_weight     * normalize(demand_score)
                + urgency_weight    * normalize(urgency_score)
                + scarcity_weight   * normalize(scarcity_score)
                + historical_weight * normalize(similar_event_multiplier)

    final_price = base_price * max(floor_multiplier, min(cap_multiplier, multiplier))

  Example:
    Taylor Swift, Section 101, 3 days before show, 90% sold:
    multiplier = 1.0 + 0.3*0.9 + 0.2*0.8 + 0.4*0.9 + 0.1*0.7
               = 1.0 + 0.27 + 0.16 + 0.36 + 0.07
               = 1.86
    final_price = $200 * 1.86 = $372

  Constraints:
  ───────────
  - Floor: 0.7x base (never sell at massive loss)
  - Cap: 3.0x base (prevent PR disaster with $600 nosebleed seats)
  - Price shown at time of hold = price charged (no bait-and-switch)
  - Lock price when user starts checkout (hold includes price)

  Architecture:
  ────────────
  - Pricing Service: calculates multiplier every 60 seconds per section
  - Cached in Redis: price:evt_123:sec_101 = 372.00 (TTL: 60s)
  - Event Service reads cached price when serving seat map
  - When hold is created: snapshot price into hold record (locked in)

  Trade-offs:
  ──────────
  + Maximizes revenue for organizers
  + Better utilization (cheap seats for low-demand events)
  - User frustration ("price changed while I was browsing!")
  - Regulatory scrutiny (some jurisdictions restrict dynamic pricing)
  - Complexity in refund calculations
```

---

## 3.6 Scalability and Performance

### Horizontal Scaling Strategy

```
Scaling by Service:

  ┌──────────────────┬───────────────┬──────────────────┬─────────────────────┐
  │ Service          │ Normal Scale  │ Flash Sale Scale │ Scaling Strategy    │
  ├──────────────────┼───────────────┼──────────────────┼─────────────────────┤
  │ API Gateway      │ 10 instances  │ 100 instances    │ Auto-scale on QPS   │
  │ Event Service    │ 20 instances  │ 50 instances     │ Auto-scale on CPU   │
  │ Queue Service    │ 5 instances   │ 50 instances     │ Pre-scale before    │
  │                  │               │                  │ on-sale time        │
  │ Inventory Svc    │ 10 instances  │ 30 instances     │ Auto-scale on Redis │
  │                  │               │                  │ connection count    │
  │ Booking Service  │ 10 instances  │ 20 instances     │ Limited by DB       │
  │ Payment Service  │ 5 instances   │ 10 instances     │ Limited by gateway  │
  │ Redis Cluster    │ 6 nodes       │ 12 nodes         │ Pre-scale shards    │
  │ PostgreSQL       │ 1 primary     │ 1 primary        │ Cannot scale writes │
  │                  │ + 5 replicas  │ + 10 replicas    │ (partition by event)│
  │ Elasticsearch    │ 6 nodes       │ 6 nodes          │ No change (search   │
  │                  │               │                  │ not in critical path│
  │ Kafka            │ 6 brokers     │ 12 brokers       │ Add partitions      │
  └──────────────────┴───────────────┴──────────────────┴─────────────────────┘

Pre-Scaling Protocol (Flash Sale Preparation):
  T-60 min: Alert operations team, begin scaling
  T-30 min: Scale API Gateway, Queue Service, Inventory Service
  T-15 min: Warm Redis (load all seat data for the event)
  T-5 min:  Verify all services healthy, load test with synthetic traffic
  T-0:      On-sale begins, queue opens
```

### Database Partitioning

```
PostgreSQL Partitioning Strategy:

  Problem: Single PostgreSQL handles ALL events.
  During a flash sale, writes for one event overwhelm the DB.

  Solution: Partition by event_id

  -- Range partition on event_id (or hash partition)
  CREATE TABLE event_seat (
      event_id UUID NOT NULL,
      seat_id UUID NOT NULL,
      status VARCHAR(10),
      ...
  ) PARTITION BY HASH (event_id);

  CREATE TABLE event_seat_p0 PARTITION OF event_seat
      FOR VALUES WITH (MODULUS 16, REMAINDER 0);
  CREATE TABLE event_seat_p1 PARTITION OF event_seat
      FOR VALUES WITH (MODULUS 16, REMAINDER 1);
  ...
  CREATE TABLE event_seat_p15 PARTITION OF event_seat
      FOR VALUES WITH (MODULUS 16, REMAINDER 15);

  Benefits:
  ─────────
  - Flash sale writes hit only 1 partition (1/16 of table)
  - Other events unaffected on different partitions
  - Can distribute partitions across multiple disks
  - Partition pruning speeds up queries

  Advanced: Dedicated Database Per Hot Event
  ──────────────────────────────────────────
  For Taylor-Swift-scale events:
  - Spin up a dedicated PostgreSQL instance for this event
  - Route all booking queries for this event_id to dedicated DB
  - After event sells out, migrate data back to main DB
  - Costly but provides perfect isolation
```

### Redis Cluster Topology

```
Redis Cluster for Seat Locking:

  ┌──────────────────────────────────────────────────────┐
  │                 Redis Cluster (6 nodes)              │
  ├──────────────────────────────────────────────────────┤
  │                                                      │
  │  Shard 1 (events A-F):                               │
  │  ┌─────────────┐    ┌─────────────┐                  │
  │  │ Primary 1   │───►│ Replica 1   │                  │
  │  │ 64 GB RAM   │    │ 64 GB RAM   │                  │
  │  └─────────────┘    └─────────────┘                  │
  │                                                      │
  │  Shard 2 (events G-N):                               │
  │  ┌─────────────┐    ┌─────────────┐                  │
  │  │ Primary 2   │───►│ Replica 2   │                  │
  │  │ 64 GB RAM   │    │ 64 GB RAM   │                  │
  │  └─────────────┘    └─────────────┘                  │
  │                                                      │
  │  Shard 3 (events O-Z):                               │
  │  ┌─────────────┐    ┌─────────────┐                  │
  │  │ Primary 3   │───►│ Replica 3   │                  │
  │  │ 64 GB RAM   │    │ 64 GB RAM   │                  │
  │  └─────────────┘    └─────────────┘                  │
  │                                                      │
  │  Key distribution:                                   │
  │  seat_lock:{event_id}:{seat_id}                      │
  │  → hash(event_id) determines shard                   │
  │  → all seats for one event on the same shard         │
  │  → Lua scripts work (single-shard execution)         │
  │                                                      │
  │  Hot event problem:                                  │
  │  If one event gets 90% of traffic, one shard gets    │
  │  90% of load. Solution: use {event_id} as hash tag   │
  │  but add per-section sub-sharding for mega-events:   │
  │  seat_lock:{evt_123_sec101}:{seat_id}                │
  │  → distributes one event across shards               │
  │                                                      │
  └──────────────────────────────────────────────────────┘

  Memory calculation for one event (80,000 seats):
    Key: "seat_lock:evt_2026_ts_msg:sec101_A_5" (~50 bytes)
    Value: "hold_abc:usr_456:1714560000" (~40 bytes)
    Redis overhead per key: ~80 bytes
    Total per seat: ~170 bytes
    Total for 80,000 seats: ~13.6 MB

    Plus counters, queue sorted set (10M users = ~300 MB), 
    access tokens (~50 MB)
    Total for one mega-event: ~400 MB
    → One 64 GB shard handles this easily
```

---

## 3.7 Failure Scenarios and Recovery

```
Failure Scenario Analysis:

  ┌─────────────────────────┬────────────────────────────────────────────┐
  │ Failure                 │ Impact + Recovery                          │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Redis primary crashes   │ Impact: seat locks temporarily lost        │
  │                         │ Recovery: replica promotes (< 5s)          │
  │                         │ Risk: ~1s of lock writes lost              │
  │                         │ Mitigation: PostgreSQL constraint catches  │
  │                         │ any resulting double-books                 │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ PostgreSQL primary down │ Impact: no new bookings can confirm        │
  │                         │ Recovery: promote read replica (< 30s)     │
  │                         │ Holds remain in Redis (TTL not affected)   │
  │                         │ Users see "try again in a moment"          │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Payment gateway down    │ Impact: users cannot complete payment      │
  │                         │ Recovery: hold protects seats              │
  │                         │ Action: show "payment temporarily          │
  │                         │ unavailable, your seats are held"          │
  │                         │ Extend hold TTL if outage > 3 min         │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Queue service crashes   │ Impact: new users cannot join queue        │
  │                         │ Recovery: restart service (stateless)      │
  │                         │ Queue positions in Redis (survive restart) │
  │                         │ Already-admitted users unaffected           │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Kafka broker down       │ Impact: async operations delayed           │
  │                         │ (emails, ticket PDF generation)            │
  │                         │ Recovery: Kafka replication, auto-heal     │
  │                         │ Booking is confirmed regardless            │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Redis + PostgreSQL      │ Impact: total system failure               │
  │ both down               │ Recovery: extremely unlikely (different    │
  │                         │ failure domains). If happens:              │
  │                         │ → Circuit breaker: return 503              │
  │                         │ → Queue absorbs: extend waiting room       │
  │                         │ → On recovery: reconcile state             │
  ├─────────────────────────┼────────────────────────────────────────────┤
  │ Network partition       │ Impact: some servers cannot reach Redis    │
  │ (split brain)           │ Recovery: fencing tokens on locks          │
  │                         │ Clients that cannot reach Redis fall back  │
  │                         │ to PostgreSQL-only path (slower but safe)  │
  └─────────────────────────┴────────────────────────────────────────────┘

Redis State Recovery After Crash:
─────────────────────────────────
  1. Query PostgreSQL for all active holds:
     SELECT event_id, seat_id, hold_id, user_id, expires_at
     FROM event_seat WHERE status = 'HELD' AND expires_at > NOW()

  2. For each active hold, rebuild Redis keys:
     SET seat_lock:{event_id}:{seat_id} "{hold_id}:{user_id}" 
         EX (expires_at - now_seconds)

  3. Rebuild sold seat keys:
     SELECT event_id, seat_id FROM event_seat WHERE status = 'SOLD'
     SET seat_lock:{event_id}:{seat_id} "SOLD" 
     (no TTL -- sold permanently)

  4. Rebuild counters from PostgreSQL:
     SELECT event_id, status, COUNT(*) FROM event_seat
     GROUP BY event_id, status

  Time to rebuild: < 60 seconds for 100K active holds
```

---

## 3.8 Monitoring and Observability

### Key Metrics Dashboard

```
Critical Metrics for Ticketmaster:

  ┌─────────────────────────────────────────────────────────────────┐
  │                    REAL-TIME DASHBOARD                          │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                 │
  │  Booking Pipeline:                                              │
  │  ├── Seat lock success rate:     98.7%  (target: > 95%)        │
  │  ├── Seat lock p99 latency:       3ms   (target: < 10ms)       │
  │  ├── Hold → booking conversion:  15.2%  (industry avg: 10-20%) │
  │  ├── Payment success rate:       97.1%  (target: > 95%)        │
  │  ├── End-to-end booking latency:  3.2s  (target: < 5s)         │
  │  └── Double-booking incidents:     0    (target: ALWAYS 0)      │
  │                                                                 │
  │  Inventory Health:                                              │
  │  ├── Redis-PG consistency:       99.99% (target: > 99.9%)      │
  │  ├── Expired holds pending cleanup: 23  (target: < 100)        │
  │  ├── Hold TTL accuracy:         ±2s    (target: < ±5s)         │
  │  └── Seats in HELD > 10 min:      0    (bug indicator)         │
  │                                                                 │
  │  Queue (Flash Sale):                                            │
  │  ├── Users in queue:         2,340,000                         │
  │  ├── Admission rate:            500/30s                        │
  │  ├── Queue drain ETA:           39 minutes                     │
  │  ├── Access token usage rate:    87%   (13% abandon after      │
  │  │                                      admission)             │
  │  └── Bot detection blocks:      12,345 (last hour)             │
  │                                                                 │
  │  Infrastructure:                                                │
  │  ├── Redis memory usage:          45%  (per shard)              │
  │  ├── Redis ops/sec:            45,000  (capacity: 100K)        │
  │  ├── PostgreSQL active connections: 180 (max: 500)             │
  │  ├── PostgreSQL TPS:             3,200 (capacity: 5K)          │
  │  ├── Kafka consumer lag:            50 messages                │
  │  └── API Gateway error rate:      0.3% (target: < 1%)          │
  │                                                                 │
  │  Alerts:                                                        │
  │  ├── CRITICAL: Double booking detected           → PagerDuty   │
  │  ├── CRITICAL: Redis primary down                → PagerDuty   │
  │  ├── HIGH: Hold→booking rate < 5%                → Slack       │
  │  ├── HIGH: Payment failure rate > 10%            → Slack       │
  │  ├── MEDIUM: Redis-PG consistency < 99.9%        → Slack       │
  │  └── LOW: Seat map latency p99 > 200ms           → Dashboard   │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```

### Distributed Tracing for Booking Flow

```
Trace Example: Successful Booking

  TraceID: abc123def456
  Duration: 3,247ms

  ├── [0ms-5ms] API Gateway → route to Booking Service
  │   ├── Auth validation: 2ms
  │   └── Rate limit check: 1ms
  │
  ├── [5ms-12ms] Inventory Service → Redis SETNX (4 seats)
  │   ├── Lua script execution: 3ms
  │   ├── All 4 seats locked: OK
  │   └── Redis network RTT: 2ms
  │
  ├── [12ms-45ms] Booking Service → PostgreSQL INSERT hold
  │   ├── Connection acquired: 5ms
  │   ├── INSERT execution: 15ms
  │   └── Index updates: 8ms
  │
  ├── [45ms-2800ms] Payment Service → Stripe Authorization
  │   ├── Stripe API call: 2,700ms (external latency)
  │   └── Response parsing: 10ms
  │
  ├── [2800ms-3200ms] Booking Service → PostgreSQL COMMIT
  │   ├── BEGIN: 1ms
  │   ├── UPDATE event_seat (4 rows): 30ms
  │   ├── INSERT booking: 15ms
  │   ├── INSERT sold_seat (4 rows): 20ms
  │   ├── COMMIT + fsync: 50ms
  │   └── Total DB time: 116ms
  │
  ├── [3200ms-3210ms] Redis → DELETE seat locks + update counters
  │
  └── [3210ms-3247ms] Kafka → Publish BookingConfirmed event
      └── Async: email and ticket generation follow

  Key Insight: 83% of latency is Stripe API call (external).
  Our system adds only ~550ms. Optimization efforts should focus
  on reducing external payment gateway latency (caching tokens,
  using local payment methods, etc.)
```

---

## 3.9 Real-World Systems Comparison

```
┌──────────────────┬─────────────────────┬──────────────────────┬────────────────────┐
│                  │ Ticketmaster        │ BookMyShow (India)   │ Our Design         │
├──────────────────┼─────────────────────┼──────────────────────┼────────────────────┤
│ Scale            │ 500M tickets/year   │ 200M tickets/year    │ 550M tickets/year  │
│ Peak users       │ 14M simultaneous    │ 10M+ for IPL         │ 10M+ (designed)    │
│ Queue system     │ "Smart Queue"       │ Virtual waiting room │ Redis sorted set   │
│                  │ (Akamai-based)      │ + CAPTCHA            │ + token bucket     │
│ Seat locking     │ Proprietary         │ Redis + DB locks     │ Redis SETNX + PG   │
│ Hold duration    │ ~5-8 minutes        │ ~10 minutes          │ 7 minutes (config) │
│ Anti-bot         │ Verified Fan +      │ CAPTCHA + phone      │ CAPTCHA + device   │
│                  │ device fingerprint  │ verification         │ fingerprint        │
│ Payment          │ Multiple gateways   │ UPI, cards, wallets  │ Auth/Capture model │
│ Dynamic pricing  │ "Platinum" (demand- │ Limited              │ Demand-based       │
│                  │ based pricing)      │                      │ multiplier         │
│ Oversell         │ Never for assigned  │ Never                │ Never (3-layer     │
│ protection       │ seats               │                      │ defense)           │
├──────────────────┼─────────────────────┼──────────────────────┼────────────────────┤
│ Eras Tour 2022   │ System crashed.     │ N/A                  │ Queue service      │
│ lesson           │ 14M users overwhelmed│                     │ prevents cascade   │
│                  │ waiting room. Bots  │                      │ failure. Pre-scale │
│                  │ bypassed queue.     │                      │ protocol handles   │
│                  │ Congressional       │                      │ demand prediction. │
│                  │ hearing followed.   │                      │                    │
└──────────────────┴─────────────────────┴──────────────────────┴────────────────────┘

Key Lesson from Ticketmaster Eras Tour Failure:
───────────────────────────────────────────────
1. Queue capacity was underestimated (expected 1.5M, got 14M)
2. Bots created millions of fake queue entries
3. Verified Fan system leaked access codes
4. No graceful degradation -- queue crash cascaded to booking

Our Design Addresses:
1. Queue is stateless Redis → handles 10M+ entries in ~300 MB
2. CAPTCHA + device fingerprint + behavioral analysis
3. Short-lived JWTs with nonce tracking (one-use tokens)
4. Queue service isolated from booking -- queue crash ≠ booking crash
```

---

## 3.10 Trade-off Analysis

### Trade-off 1: Hold Duration

```
Short Hold (3 min) vs Long Hold (10 min):

  Short (3 min):
  + Seats released faster → higher inventory turnover
  + More users get a chance to buy
  + Less "phantom unavailability" (seats locked but never bought)
  - User pressure → more abandoned checkouts
  - Slow payment processors may exceed hold time
  - Bad UX for users who need to discuss with friends

  Long (10 min):
  + Comfortable checkout experience
  + Handles slow payment gateways
  + Higher hold-to-booking conversion rate
  - Seats locked longer → fewer users see "available"
  - During flash sales, 10-min holds can block all inventory
  - Strategic holders (hold seats to "decide") waste capacity

  Our Choice: 7 minutes (configurable per event)
  ──────────────────────────────────────────────
  - Flash sale events: reduce to 5 minutes (high urgency)
  - Normal events: 7 minutes (balanced)
  - Accessible checkout: 10 minutes (ADA compliance)
  - Configurable by event organizer
```

### Trade-off 2: Redis vs Database for Primary Locks

```
Redis Primary (our choice):
  + 100K+ ops/sec → handles flash sale load
  + Sub-5ms lock acquisition
  + Native TTL for automatic hold expiry
  - Volatile: data loss on crash
  - Must maintain consistency with PostgreSQL
  - Additional infrastructure to operate

Database Primary:
  + Single source of truth (no sync issues)
  + Durable (survives crashes)
  + Simpler architecture (fewer moving parts)
  - 5-10K ops/sec → may bottleneck in flash sales
  - 20-50ms per lock → noticeable user-facing latency
  - No native TTL (need cleanup job only)

Why We Choose Redis + PostgreSQL:
  The flash sale scenario requires 5K+ lock operations per second
  with sub-10ms latency. PostgreSQL alone cannot achieve this.
  Redis handles the speed; PostgreSQL handles the correctness.
  The dual-write complexity is the price of supporting flash sales.
```

### Trade-off 3: Queue Fairness

```
Random Queue vs FIFO Queue:

  FIFO (First In, First Out):
  + Feels "fair" to users (I arrived first, I go first)
  + Simple to understand and implement
  - Bots with low-latency connections always arrive first
  - Geography advantage (close to datacenter = earlier)
  - CDN/edge effects create inconsistent timing

  Random Position Assignment:
  + Perfectly fair: everyone has equal chance regardless of speed
  + Bots gain zero advantage from fast connections
  + No geography bias
  - "I was here first!" complaints from users
  - Feels less fair even though it IS more fair
  - Need clear communication ("positions are randomized for fairness")

  Our Choice: Randomized with Verified Fan priority
  ─────────────────────────────────────────────────
  Verified fans: random position in [0, 0.5]  → first half of queue
  General public: random position in [0.5, 1.0] → second half
  This rewards loyal customers while preventing bot advantage.
```

### Trade-off 4: Consistency Model

```
Strong Consistency Everywhere vs. Mixed Consistency:

  Strong Everywhere:
  + Simple mental model (everything is always correct)
  + No "stale seat map" issues
  - Much higher latency for reads (no caching)
  - Lower throughput (every read hits primary DB)
  - Overkill for browsing/search (eventual is fine)

  Mixed Consistency (our choice):
  + Optimized for each use case
  + Browse/search: eventually consistent → fast, cacheable
  + Seat locking: strongly consistent → correct
  + Booking: strongly consistent + exactly-once → bulletproof
  - More complex to reason about
  - Edge case: user sees "available" but seat is held (brief mismatch)
  - Need clear UX for "seat no longer available" (409 handling)

  Mixed consistency is the standard industry approach. No production
  ticketing system uses strong consistency for the seat map -- the
  cost would be too high for the benefit.
```

---

## 3.11 Interview Tips

### How to Structure Your Answer (45-Minute Interview)

```
Minute-by-Minute Walkthrough:

  [0-5 min] Requirements and Scope
  ─────────────────────────────────
  - Clarify: assigned seats or general admission?
  - Clarify: flash sale handling required?
  - State functional requirements (browse, select, book, pay)
  - State NFRs (consistency >> availability for booking path)
  - Quick estimation: 10M users, 10K events/day, peak flash sale

  [5-15 min] High-Level Architecture
  ───────────────────────────────────
  - Draw: Client → CDN → LB → API GW → Services → Data stores
  - Name the services: Event, Venue, Inventory, Booking, Payment, Queue
  - Explain read path (browse) vs write path (booking) separation
  - Mention Redis for locks + PostgreSQL for truth

  [15-30 min] Core Problem: Seat Locking (THE money section)
  ──────────────────────────────────────────────────────────
  - Explain the race condition (two users, one seat)
  - Draw the SETNX solution with TTL
  - Walk through the hold → pay → confirm sequence diagram
  - Explain hold expiration (Redis TTL + cleanup job)
  - Explain defense in depth (Redis speed + PG safety)

  [30-40 min] Flash Sale / Deep Dives
  ────────────────────────────────────
  - Virtual waiting room architecture
  - Queue → admission → token → booking flow
  - Anti-bot measures
  - Why overselling is unacceptable + how to prevent

  [40-45 min] Scaling and Trade-offs
  ──────────────────────────────────
  - Pre-scaling protocol for flash sales
  - Redis cluster sharding
  - PostgreSQL partitioning by event
  - Key trade-offs: hold duration, consistency model
```

### Common Interviewer Questions and Strong Answers

```
Q: "What happens if Redis goes down during a flash sale?"
A: "Redis Cluster has automatic failover -- a replica promotes in
   under 5 seconds. During that window, we may lose ~1 second of
   lock writes. Two outcomes: (1) a user who locked a seat in Redis
   but it was lost -- they will get an error at PostgreSQL confirmation
   time and need to re-select. (2) Two users appear to lock the same
   seat -- the PostgreSQL UNIQUE constraint catches this at booking
   confirmation. We never oversell because the database is the final
   arbiter."

Q: "How do you prevent bots from buying all the tickets?"
A: "Four layers: CAPTCHA at queue entry, device fingerprinting to detect
   headless browsers, behavioral analysis (click timing, mouse patterns),
   and Verified Fan priority for accounts with established purchase
   history. Critically, the queue uses randomized positioning so bots
   cannot gain advantage from faster network connections."

Q: "Why not just use a database for locking? Why Redis?"
A: "During a flash sale, we need 5,000+ lock operations per second
   with sub-10ms latency. PostgreSQL can do ~5K TPS but at 20-50ms
   per operation. Redis does 100K+ ops/sec at sub-5ms. The user
   experience difference between a 5ms lock and a 50ms lock matters
   when millions are competing. We use both: Redis for speed in the
   happy path, PostgreSQL as the safety net."

Q: "What if the payment takes 10 seconds and the hold is only 7 minutes?"
A: "Good question. 10 seconds is fine -- the hold timer protects the
   seats for the full 7 minutes. The payment just needs to complete
   before the hold expires. Even if payment takes 30 seconds, we have
   over 6 minutes of headroom. If the payment gateway is down entirely,
   we show the user 'payment temporarily unavailable, your seats are
   held for X minutes' and allow retry."

Q: "Can you guarantee exactly-once booking?"
A: "Yes, through three mechanisms: (1) Idempotency keys on every booking
   request -- retries return the cached result. (2) Optimistic locking
   with version numbers -- concurrent confirms are serialized. (3)
   Database UNIQUE constraint on (event_id, seat_id) for sold seats --
   physically prevents two bookings for the same seat regardless of
   application bugs. These three layers make double-booking impossible
   in practice."

Q: "How would you handle a 100,000-seat stadium?"
A: "Three optimizations: (1) The seat map loads the static SVG layout
   from CDN and only fetches dynamic availability from the server --
   so 100K seats does not mean 100K API calls. (2) Availability is
   aggregated per section (300 sections, not 100K seats) for the
   initial view, with per-seat detail loaded on section zoom. (3) Redis
   easily handles 100K keys -- at ~170 bytes per seat, that is only
   17 MB for the entire venue."
```

### Red Flags to Avoid

```
Things That Will Hurt You in the Interview:

  ✗ "Just use a SQL transaction for everything"
    → Shows no understanding of scale requirements

  ✗ "We can use eventual consistency for booking"
    → Instant fail. Booking MUST be strongly consistent.

  ✗ Not mentioning the race condition
    → This IS the question. If you design everything else but
      skip seat locking, you missed the entire point.

  ✗ "Lock the seat in the database with SELECT FOR UPDATE"
    (as the only solution)
    → Works for small scale but will not survive a flash sale.
      Mention it as the safety net, not the primary mechanism.

  ✗ Forgetting hold expiration
    → If holds never expire, abandoned checkouts permanently
      block seats. Always mention TTL.

  ✗ Ignoring the flash sale scenario
    → Normal booking is easy. Flash sale is the hard part.
      If the interviewer asks about concurrency, they are testing
      your ability to handle the 10M-users-in-60-seconds case.

  ✗ "Just add more servers"
    → Horizontal scaling alone does not solve the concurrency
      problem. You need locking, queuing, and traffic shaping.
      Scaling is necessary but not sufficient.

Things That Will Impress:

  ✓ Mentioning defense in depth (Redis + PostgreSQL together)
  ✓ Drawing the state machine (AVAILABLE → HELD → SOLD)
  ✓ Explaining the auth/capture payment model
  ✓ Discussing the virtual waiting room with adaptive admission
  ✓ Knowing that Ticketmaster failed during the Eras Tour and WHY
  ✓ Mentioning idempotency keys for exactly-once semantics
  ✓ Discussing the Lua script for atomic multi-seat locking
  ✓ Acknowledging trade-offs (hold duration, consistency model)
```
