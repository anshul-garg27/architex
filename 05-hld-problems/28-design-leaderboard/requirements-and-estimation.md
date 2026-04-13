# Design a Real-Time Leaderboard System - Requirements & Estimation

## 1. Problem Statement

Design a real-time leaderboard system that ranks millions of players by score, supports
instant top-K queries ("show me the top 100"), instant rank queries ("what is my rank?"),
and handles thousands of score updates per second -- all with sub-100ms latency.

> "A leaderboard looks trivially simple until you realize that ORDER BY score DESC
> on 50 million rows cannot run in real time, and that every single score update
> potentially reshuffles every rank below it."

Think: Clash Royale global leaderboard, LeetCode contest rankings, Dream11 fantasy
sports live standings, or any competitive multiplayer game where players need to see
their position among millions in real time.

---

## 2. Clarifying Questions to Ask the Interviewer

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | How many total players and how many are concurrently active? | Determines data structure sizing -- 50M vs 500M is a 10x difference in memory |
| 2 | What queries must be real-time: top-K, my-rank, or both? | My-rank for all users is harder than just top-K |
| 3 | Do we need time-scoped leaderboards (daily, weekly, all-time)? | Multiplies storage and adds rollover complexity |
| 4 | How are scores calculated -- single value or composite? | Composite scores (score + time) affect data structure choice |
| 5 | How should ties be broken? | Same score: who ranks higher? Earlier submission? Alphabetical? |
| 6 | Do we need relative leaderboards ("5 above and 5 below me")? | Requires range queries around an arbitrary rank |
| 7 | Do we need friend/social leaderboards? | Cannot be solved with a single sorted set -- different approach needed |
| 8 | Is the score monotonically increasing (additive) or can it decrease? | Affects update semantics (ZADD GT vs plain ZADD) |
| 9 | What is the acceptable latency for score updates to appear? | Real-time (<100ms) vs near-real-time (<5s) changes architecture |
| 10 | Do we need historical snapshots (e.g., "leaderboard at end of yesterday")? | Requires periodic snapshotting strategy |

**Assumed answer**: We are designing a **global real-time leaderboard** for a competitive
gaming platform. 50M total players, 10M daily active, scores update in real time,
support top-K, my-rank, relative leaderboard, and time-scoped boards (daily/weekly/all-time).
Ties broken by earlier timestamp (first to reach a score ranks higher).

---

## 3. Functional Requirements

### 3.1 Core Leaderboard Operations

| # | Requirement | Description |
|---|------------|-------------|
| FR-1 | **Submit/Update Score** | A player submits a new score; the leaderboard updates their rank in real time |
| FR-2 | **Top-K Query** | Retrieve the top K players with scores and ranks (e.g., top 10, top 100) |
| FR-3 | **My Rank Query** | Any player can query "what is my current global rank?" and get an answer in <100ms |
| FR-4 | **Relative Leaderboard** | Show N players above and N players below a given player ("neighborhood view") |
| FR-5 | **Time-Scoped Boards** | Separate leaderboards per time window: daily, weekly, monthly, all-time |

### 3.2 Social / Extended Features

| # | Requirement | Description |
|---|------------|-------------|
| FR-6 | **Friend Leaderboard** | Show a player's rank among only their friends |
| FR-7 | **Player Profile Lookup** | Given a player ID on the leaderboard, fetch their display name, avatar, stats |
| FR-8 | **Historical Snapshots** | Preserve the leaderboard state at the end of each period for rewards distribution |
| FR-9 | **Score Breakdown** | Store and display how a score was earned (optional detail view) |

### 3.3 Administrative

| # | Requirement | Description |
|---|------------|-------------|
| FR-10 | **Leaderboard Reset** | Reset daily/weekly boards at the start of each period |
| FR-11 | **Cheater Removal** | Remove a banned player's score and re-rank all players below them instantly |
| FR-12 | **Multi-Game Support** | Support leaderboards for multiple games/competitions simultaneously |

---

## 4. Non-Functional Requirements

### 4.1 The Big Four for Leaderboards

```
+-------------------+------------------------------------------+-------------------+
|   Requirement     |             Target                       |   Reference       |
+-------------------+------------------------------------------+-------------------+
| Query Latency     | < 50ms for top-K and my-rank queries     | Clash Royale      |
| Update Latency    | < 100ms from score submit to rank change | Real-time feel    |
| Throughput        | 10,000 score updates/sec sustained       | Peak gaming hours |
| Availability      | 99.9% (8.7 hours downtime/year)          | Gaming SLA        |
+-------------------+------------------------------------------+-------------------+
```

### 4.2 Detailed Non-Functional Requirements

| # | Requirement | Target | Rationale |
|---|------------|--------|-----------|
| NFR-1 | **Low Latency Reads** | <50ms p99 for top-K and my-rank | Players expect instant feedback |
| NFR-2 | **Low Latency Writes** | <100ms p99 for score update to rank reflection | Real-time competitive feel |
| NFR-3 | **High Read Throughput** | 50,000 reads/sec | Every active player checks their rank frequently |
| NFR-4 | **High Write Throughput** | 10,000 writes/sec peak | Concurrent game completions across millions |
| NFR-5 | **Consistency** | Eventual consistency within 100ms | Slight delay OK; stale rank for >1s is not |
| NFR-6 | **Scalability** | 50M players per leaderboard | Must not degrade as player base grows |
| NFR-7 | **Availability** | 99.9% uptime | Leaderboard outage degrades but doesn't block gameplay |
| NFR-8 | **Durability** | No score loss | Player scores represent hours of effort; losing them is unacceptable |
| NFR-9 | **Accuracy** | Exact ranks (not approximate) for top 10K; approximate OK beyond | Top players care about exact rank; casual players less so |
| NFR-10 | **Elasticity** | Handle 10x traffic spikes (tournaments, events) | Fortnite-style events can spike concurrency dramatically |

### 4.3 Latency Budget Breakdown

```
Score update flow:
  Client sends score:                0 ms
    |
    +-- API Gateway routing:         5 ms
    |
    +-- Score Service validation:   10 ms
    |
    +-- Redis ZADD (sorted set):     1 ms   <-- The critical operation
    |
    +-- Async DB persistence:       50 ms   (non-blocking)
    |
    +-- Response to client:          5 ms
    |
  Total write path:               ~21 ms (client perceives)

Rank query flow:
  Client requests rank:              0 ms
    |
    +-- API Gateway routing:         5 ms
    |
    +-- Query Service:               2 ms
    |
    +-- Redis ZREVRANK:              1 ms   <-- O(log N) for 50M members
    |
    +-- Enrich with player info:    10 ms   (cache hit)
    |
    +-- Response to client:          5 ms
    |
  Total read path:                ~23 ms
```

---

## 5. Capacity Estimation

### 5.1 Assumptions

| Parameter | Value | Source/Rationale |
|-----------|-------|-----------------|
| Total registered players | 50,000,000 (50M) | Large mobile game scale |
| Daily active players (DAU) | 10,000,000 (10M) | 20% DAU/MAU ratio |
| Concurrent players (peak) | 2,000,000 (2M) | 20% of DAU online simultaneously |
| Score updates per player per day | ~5 (average game sessions) | Casual gaming pattern |
| Peak score update rate | 10,000/sec | Concentrated during peak hours |
| Average score update rate | ~600/sec | 50M updates/day spread over 24h |
| Top-K query rate (peak) | 50,000/sec | Every active player checks leaderboard |
| My-rank query rate (peak) | 30,000/sec | Slightly less frequent than top-K |
| Player ID size | 16 bytes (UUID) | Standard identifier |
| Score size | 8 bytes (double) | Composite score with timestamp |
| Player metadata | ~200 bytes | Name, avatar URL, level, stats |
| Number of time-scoped boards | 4 | daily, weekly, monthly, all-time |
| Average friend list size | 50 friends | Social feature |

### 5.2 Storage Estimation

```
Redis Sorted Set (core leaderboard):
  Each member in a sorted set:
    - Member key (player_id): 16 bytes
    - Score (double): 8 bytes
    - Skip list node overhead: ~50 bytes (pointers, levels)
    - Hash table entry overhead: ~50 bytes
    ------------------------------------------
    Total per member: ~124 bytes

  Single leaderboard (50M players):
    50,000,000 x 124 bytes = 6.2 GB

  Four time-scoped boards:
    4 x 6.2 GB = 24.8 GB
    (But daily/weekly have fewer players -- assume ~20M active recently)
    Realistic total: ~18 GB

  Redis overhead (fragmentation, internal structures):
    ~1.5x of data = 18 GB x 1.5 = ~27 GB

  Conclusion: Fits comfortably in a single Redis instance with 32 GB RAM
              For 500M players: need sharding (discussed in deep dive)

Player metadata cache (Redis Hash):
  50M players x 200 bytes = 10 GB
  Total Redis memory: ~37 GB (leaderboard + metadata cache)

PostgreSQL (persistent store):
  Player table: 50M rows x 500 bytes = 25 GB
  Score history table (30 days): 50M x 5 scores/day x 30 days x 100 bytes = 750 GB
  With indexes: ~1 TB total
```

### 5.3 Bandwidth Estimation

```
Inbound (score updates):
  Peak: 10,000 updates/sec x 200 bytes (request) = 2 MB/sec
  Minimal -- not a bandwidth concern.

Outbound (leaderboard queries):
  Top-100 query response:
    100 players x 200 bytes (metadata) = 20 KB per response
    50,000 queries/sec x 20 KB = 1 GB/sec peak

  My-rank response:
    Single player rank + neighborhood (11 players) = ~2.5 KB per response
    30,000 queries/sec x 2.5 KB = 75 MB/sec

  Total outbound: ~1.1 GB/sec peak
  This requires CDN/edge caching for top-K (changes infrequently)
```

### 5.4 Compute Estimation

```
Redis operations:
  ZADD: ~10,000/sec peak → one Redis instance handles 100K+ ops/sec (comfortable)
  ZREVRANK: ~30,000/sec → O(log N) per query, very fast
  ZREVRANGE: ~50,000/sec → top-K is O(K + log N)
  Total: ~90,000 Redis ops/sec peak

  Single Redis instance can handle 100K-300K ops/sec
  → One Redis instance is sufficient for operations, but we need replicas for HA

API Servers (Score Service + Query Service):
  ~80,000 requests/sec total → ~8 servers at 10K req/sec each

Metadata enrichment:
  ~80,000 lookups/sec → served from Redis cache or local cache
```

### 5.5 Key Insight: Redis Sorted Set is the Perfect Fit

```
Why Redis Sorted Set is THE data structure for leaderboards:

Operation          | Redis Command    | Complexity    | Latency (50M members)
-------------------|------------------|---------------|----------------------
Add/update score   | ZADD             | O(log N)      | ~1 ms
Get rank of player | ZREVRANK         | O(log N)      | ~1 ms
Top-K players      | ZREVRANGE 0 K-1  | O(K + log N)  | ~1 ms (K=100)
Score of player    | ZSCORE           | O(1)          | <0.5 ms
Remove player      | ZREM             | O(log N)      | ~1 ms
Range around rank  | ZREVRANGE R-5 R+5| O(K + log N)  | ~1 ms
Count total players| ZCARD            | O(1)          | <0.5 ms

All operations are O(log N) or better. For N = 50,000,000:
  log2(50,000,000) = ~26 operations in the skip list
  At ~100ns per comparison: ~2.6 microseconds for the skip list traversal
  Plus network overhead: still under 1 ms total

No other single data structure provides ALL of these operations at O(log N).
This is why every leaderboard system in production uses Redis sorted sets.
```

---

## 6. API Design

### 6.1 Score Submission

```
POST /api/v1/leaderboard/{board_id}/scores

Request:
{
  "player_id": "player-uuid-12345",
  "score": 4250,
  "game_id": "game-session-67890",     // For audit/anti-cheat
  "metadata": {
    "level_completed": 42,
    "time_taken_ms": 128500
  }
}

Response:
{
  "player_id": "player-uuid-12345",
  "new_score": 4250,
  "previous_score": 4100,
  "new_rank": 15823,
  "previous_rank": 18291,
  "board_id": "weekly_2026-W15",
  "timestamp": "2026-04-07T14:30:00.123Z"
}
```

### 6.2 Top-K Query

```
GET /api/v1/leaderboard/{board_id}/top?limit=100&offset=0

Response:
{
  "board_id": "all_time",
  "total_players": 50000000,
  "entries": [
    {
      "rank": 1,
      "player_id": "player-abc",
      "display_name": "ProGamer99",
      "avatar_url": "https://cdn.example.com/avatars/abc.png",
      "score": 99850,
      "country": "KR"
    },
    {
      "rank": 2,
      "player_id": "player-def",
      "display_name": "NinjaSlayer",
      "avatar_url": "https://cdn.example.com/avatars/def.png",
      "score": 99720,
      "country": "US"
    },
    // ... up to limit
  ],
  "updated_at": "2026-04-07T14:30:00.000Z"
}
```

### 6.3 My Rank Query

```
GET /api/v1/leaderboard/{board_id}/rank/{player_id}

Response:
{
  "board_id": "all_time",
  "player_id": "player-uuid-12345",
  "rank": 15823,
  "score": 4250,
  "total_players": 50000000,
  "percentile": 99.97,
  "neighborhood": {
    "above": [
      {"rank": 15818, "player_id": "p-111", "display_name": "Alpha", "score": 4255},
      {"rank": 15819, "player_id": "p-222", "display_name": "Beta", "score": 4254},
      {"rank": 15820, "player_id": "p-333", "display_name": "Gamma", "score": 4253},
      {"rank": 15821, "player_id": "p-444", "display_name": "Delta", "score": 4252},
      {"rank": 15822, "player_id": "p-555", "display_name": "Epsilon", "score": 4251}
    ],
    "below": [
      {"rank": 15824, "player_id": "p-666", "display_name": "Zeta", "score": 4249},
      {"rank": 15825, "player_id": "p-777", "display_name": "Eta", "score": 4248},
      {"rank": 15826, "player_id": "p-888", "display_name": "Theta", "score": 4247},
      {"rank": 15827, "player_id": "p-999", "display_name": "Iota", "score": 4246},
      {"rank": 15828, "player_id": "p-000", "display_name": "Kappa", "score": 4245}
    ]
  }
}
```

### 6.4 Friend Leaderboard

```
GET /api/v1/leaderboard/{board_id}/friends/{player_id}

Response:
{
  "board_id": "weekly_2026-W15",
  "player_id": "player-uuid-12345",
  "friend_count": 47,
  "my_rank_among_friends": 12,
  "entries": [
    {"rank": 1, "player_id": "friend-a", "display_name": "BestFriend", "score": 8200},
    {"rank": 2, "player_id": "friend-b", "display_name": "Rival", "score": 7850},
    // ... all friends sorted by score
    {"rank": 12, "player_id": "player-uuid-12345", "display_name": "Me", "score": 4250},
    // ...
  ]
}
```

### 6.5 Administrative APIs

```
POST /api/v1/admin/leaderboard/{board_id}/reset          // Reset a time-scoped board
DELETE /api/v1/admin/leaderboard/{board_id}/players/{id}  // Remove banned player
POST /api/v1/admin/leaderboard/{board_id}/snapshot        // Force snapshot for rewards
GET  /api/v1/admin/leaderboard/{board_id}/stats           // Board health/stats
```

---

## 7. Database Schema

### 7.1 Player Table (PostgreSQL)

```sql
CREATE TABLE players (
    player_id       UUID PRIMARY KEY,
    display_name    VARCHAR(50) NOT NULL,
    avatar_url      VARCHAR(256),
    country_code    CHAR(2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_banned       BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_players_name ON players(display_name);
```

### 7.2 Scores Table (PostgreSQL -- persistent backup)

```sql
CREATE TABLE scores (
    id              BIGSERIAL PRIMARY KEY,
    player_id       UUID NOT NULL REFERENCES players(player_id),
    board_id        VARCHAR(64) NOT NULL,          -- "all_time", "daily_2026-04-07"
    score           BIGINT NOT NULL,
    composite_score DOUBLE PRECISION NOT NULL,     -- score * 1e9 + inverted_ts
    game_session_id UUID,
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    INDEX idx_board_score (board_id, composite_score DESC),
    INDEX idx_player_board (player_id, board_id)
);
```

### 7.3 Leaderboard Snapshots (for reward distribution)

```sql
CREATE TABLE leaderboard_snapshots (
    snapshot_id     BIGSERIAL PRIMARY KEY,
    board_id        VARCHAR(64) NOT NULL,
    period_end      TIMESTAMPTZ NOT NULL,
    player_id       UUID NOT NULL,
    final_rank      INTEGER NOT NULL,
    final_score     BIGINT NOT NULL,
    reward_tier     VARCHAR(32),                   -- "top_1", "top_10", "top_100", etc.
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    INDEX idx_snapshot_board (board_id, period_end, final_rank)
);
```

### 7.4 Friend Relationships

```sql
CREATE TABLE friendships (
    player_id       UUID NOT NULL REFERENCES players(player_id),
    friend_id       UUID NOT NULL REFERENCES players(player_id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, friend_id)
);

CREATE INDEX idx_friendships_reverse ON friendships(friend_id, player_id);
```

---

## 8. Summary of Scope

```
+-------------------------------------------------------------------+
|                         IN SCOPE                                   |
|  - Global real-time leaderboard (50M players)                     |
|  - Top-K query (top 10, top 100, top 1000)                       |
|  - My-rank query (instant rank for any player)                    |
|  - Relative leaderboard (N above / N below me)                   |
|  - Time-scoped boards (daily, weekly, monthly, all-time)          |
|  - Friend leaderboard                                             |
|  - Tie-breaking with composite scores                             |
|  - Score persistence and recovery                                 |
|  - Leaderboard snapshots for rewards                              |
|  - Cheater/ban removal                                            |
+-------------------------------------------------------------------+
|                        OUT OF SCOPE                                |
|  - Anti-cheat / score validation logic (assumed external)         |
|  - Game server design                                             |
|  - Push notifications for rank changes                            |
|  - Matchmaking based on leaderboard rank                          |
|  - Payment / reward fulfillment                                   |
|  - Player authentication (assumed handled by auth service)        |
+-------------------------------------------------------------------+
```

---

## 9. Core Insight for the Interview

```
+---------------------------------------------------------------------+
|                                                                       |
|  The entire leaderboard problem reduces to choosing the RIGHT        |
|  data structure. SQL "ORDER BY score DESC LIMIT K" is O(N log N)    |
|  per query -- unusable for 50M rows in real time.                   |
|                                                                       |
|  Redis Sorted Set (backed by a skip list + hash table) gives:       |
|    - ZADD:     O(log N) -- insert/update score                      |
|    - ZREVRANK: O(log N) -- get rank of any player                   |
|    - ZREVRANGE:O(K + log N) -- top-K players                        |
|    - ZSCORE:   O(1) -- get score of any player                      |
|                                                                       |
|  For 50M members, log2(50M) ~ 26. That is 26 skip-list hops        |
|  to answer ANY query. This is why Redis sorted sets are THE         |
|  standard solution for leaderboards in the gaming industry.         |
|                                                                       |
+---------------------------------------------------------------------+
```
