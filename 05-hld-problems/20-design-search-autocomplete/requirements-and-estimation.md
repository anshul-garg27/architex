# Design Search Autocomplete / Typeahead System: Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Functional Requirements](#2-functional-requirements)
- [3. Non-Functional Requirements](#3-non-functional-requirements)
- [4. Out of Scope](#4-out-of-scope)
- [5. Back-of-Envelope Estimation](#5-back-of-envelope-estimation)
- [6. API Design](#6-api-design)
- [7. Client-Side Optimization Strategy](#7-client-side-optimization-strategy)
- [8. Data Model Overview](#8-data-model-overview)

---

## 1. Problem Statement

Design a search autocomplete (typeahead) system that returns the top 5 most relevant
query suggestions as users type, with sub-100ms latency. The system powers the search
bar experience for a platform with 1 billion daily searches -- think Google Search,
Amazon product search, or Uber location search.

**Why this problem is a top system design interview question:**
- It tests data structure mastery (trie is the core, but the devil is in the optimization)
- It tests read-heavy system design (99.99% reads, near-zero tolerance for latency)
- It tests offline/online pipeline separation (data collection vs serving)
- It tests client-server co-design (debouncing, caching, progressive requests)
- It tests ranking and ML integration (not just prefix matching -- relevance matters)

**Real-world examples:**
- **Google Search**: ~8.5 billion searches/day, suggestions appear within 30-50ms
- **Amazon**: Product search with category-aware suggestions ("iphone 15 case" vs "iphone 15 pro")
- **Uber**: Location autocomplete using Google Places API + internal POI database
- **YouTube**: Video title suggestions blended with trending topics
- **Spotify**: Song/artist/playlist suggestions with fuzzy matching

---

## 2. Functional Requirements

### 2.1 Core Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Prefix-based suggestions** | As the user types each character, return the top 5 matching query suggestions that start with the typed prefix |
| FR-2 | **Ranked results** | Suggestions are ranked by a combination of popularity (search frequency), recency, and relevance |
| FR-3 | **Trending queries** | Incorporate real-time trending queries that are spiking in search volume (e.g., breaking news, live events) |
| FR-4 | **Personalization** | Blend the user's own recent search history into suggestions (e.g., a user who often searches "python" sees it ranked higher) |
| FR-5 | **Typo tolerance** | Handle common misspellings and return corrected suggestions (e.g., "amazn" suggests "amazon") |
| FR-6 | **Multi-language support** | Support autocomplete in multiple languages including CJK (Chinese, Japanese, Korean), Arabic (RTL), and Latin scripts |
| FR-7 | **Offensive content filtering** | Never show suggestions containing hate speech, explicit content, or legally problematic terms |
| FR-8 | **Query completion** | Suggest full queries, not just prefix extensions (e.g., typing "how to" suggests "how to tie a tie") |

### 2.2 Supporting Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-9 | **Category hints** | Optionally show category alongside suggestion (e.g., "MacBook Pro -- Electronics") |
| FR-10 | **Recent searches** | Show user's recent searches before any prefix is typed (zero-prefix state) |
| FR-11 | **Search-as-you-type** | Optionally trigger background search for the top suggestion to pre-warm results |
| FR-12 | **Analytics collection** | Log which suggestions users select for feedback loop into ranking |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **End-to-end latency** | < 100ms (p99 < 200ms) | Suggestions must feel instantaneous; users type at 40-60 WPM and expect results between keystrokes |
| **Server-side processing** | < 10ms per request | After network and gateway overhead, the trie lookup itself must be extremely fast |
| **Throughput** | 100K+ suggestions/sec per server | Handle massive keystroke volume with minimal fleet |
| **Availability** | 99.99% uptime | Search bar is the primary entry point; downtime = zero engagement |

### 3.2 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Total daily keystrokes** | 5 billion/day (~58K QPS avg, ~200K QPS peak) | 1B searches/day x ~5 keystrokes per search |
| **Unique queries in trie** | 10-50 million | Long tail trimmed; only queries with meaningful frequency stored |
| **Trie update frequency** | Every 15 minutes to 1 hour | Balance freshness vs rebuild cost |
| **Horizontal scaling** | Stateless serving tier + replicated tries | Each server holds a full trie replica (or a shard for very large datasets) |

### 3.3 Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Graceful degradation** | Return cached/stale results on failure | Better to show slightly old suggestions than nothing |
| **No single point of failure** | All components replicated | Trie servers, caches, data pipeline -- all redundant |
| **Data freshness** | Trending queries within 5-15 minutes | Breaking news must appear quickly in suggestions |

### 3.4 Safety and Compliance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Content filtering** | 100% of offensive terms blocked | Legal and brand safety; blocklist + ML classifier |
| **Privacy** | Search history opt-out supported | GDPR, CCPA compliance; personalization requires consent |
| **Audit logging** | All suggestion impressions logged | Enables A/B testing and compliance audits |

---

## 4. Out of Scope

| Item | Reason |
|------|--------|
| Full-text search engine | Autocomplete suggests queries; the search results page is a separate system |
| Voice search / speech-to-text | Different input modality with different latency characteristics |
| Image-based search | Visual search is a separate ML system |
| Spell-check as a standalone service | We handle typos within autocomplete, not as a general-purpose service |
| Ad insertion in suggestions | Monetization layer sits on top of suggestions, not part of core design |

---

## 5. Back-of-Envelope Estimation

### 5.1 Traffic Estimation

```
Given:
  - 1 billion searches per day
  - Average: user types 5 characters before selecting a suggestion
  - Each character typed triggers a suggestion request (before debouncing)

Raw keystroke volume:
  1B searches/day x 5 keystrokes/search = 5 billion keystrokes/day

With debouncing (only send request after 100-150ms of no typing):
  Effective reduction: ~60% of keystrokes actually trigger a request
  5B x 0.4 = 2 billion suggestion requests/day

QPS calculation:
  2B requests / 86,400 sec = ~23,000 QPS (average)
  Peak QPS (assume 3x average): ~70,000 QPS
  Absolute peak (major event like Super Bowl): ~200,000 QPS
```

### 5.2 Storage Estimation

```
Trie storage for query corpus:

  Unique queries to store: 10 million
  Average query length: 25 characters (bytes in ASCII)
  
  Raw query storage:
    10M queries x 25 bytes = 250 MB (just the strings)

  Trie node overhead:
    Each node: 1 byte (character) + 8 bytes (pointer) + 8 bytes (metadata)
    Estimated total trie nodes: ~50 million (shared prefixes compress this)
    50M nodes x ~17 bytes = 850 MB

  Pre-computed top-K per node:
    Each node stores top-5 suggestion IDs: 5 x 4 bytes = 20 bytes/node
    Nodes with suggestions: ~30 million (not all nodes are prefix endpoints)
    30M x 20 bytes = 600 MB

  Total trie in-memory: ~1.5-2 GB
  
  This comfortably fits in a single server's RAM (modern servers: 64-256 GB)
  We replicate the full trie across multiple servers for availability.

Query log storage (for aggregation pipeline):
  1B queries/day x 50 bytes avg = 50 GB/day raw logs
  After sampling (1 in 10): 5 GB/day
  30-day retention: 150 GB
```

### 5.3 Bandwidth Estimation

```
Request size (prefix query):
  ~50 bytes (prefix string + metadata)

Response size (5 suggestions):
  5 suggestions x 50 bytes avg = 250 bytes
  + JSON overhead: ~100 bytes
  Total response: ~350 bytes

Bandwidth:
  Inbound: 23K QPS x 50 bytes = 1.15 MB/s (negligible)
  Outbound: 23K QPS x 350 bytes = 8 MB/s (negligible)
  Peak outbound: 200K QPS x 350 bytes = 70 MB/s (easily handled)
```

### 5.4 Server Estimation

```
Single server capacity:
  - In-memory trie: ~2 GB (fits easily)
  - Per-request processing: ~5-10 microseconds (trie traversal)
  - Bottleneck: network I/O, not CPU
  - Realistic capacity: 50,000-100,000 QPS per server

Servers needed for serving tier:
  Peak 200K QPS / 50K per server = 4 servers minimum
  With 3x redundancy for availability: 12 servers
  
  In practice: 10-20 trie servers behind a load balancer
  (Google runs thousands for their scale, but the concept is the same)
```

### 5.5 Summary Table

| Metric | Value |
|--------|-------|
| Daily searches | 1 billion |
| Daily suggestion requests (after debounce) | 2 billion |
| Average QPS | 23,000 |
| Peak QPS | 70,000-200,000 |
| Unique queries in trie | 10 million |
| Trie memory footprint | ~2 GB |
| Query log volume (sampled) | 5 GB/day |
| Serving servers needed | 10-20 |
| End-to-end latency target | < 100ms |
| Server-side processing target | < 10ms |

---

## 6. API Design

### 6.1 Get Suggestions API

This is the primary API called on every (debounced) keystroke.

```
GET /v1/suggestions?prefix={prefix}&limit={limit}&lang={lang}&user_id={user_id}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `prefix` | string | Yes | The current text the user has typed (e.g., "how to") |
| `limit` | int | No | Number of suggestions to return (default: 5, max: 10) |
| `lang` | string | No | Language code (default: "en", supports "zh", "ja", "ko", "es", etc.) |
| `user_id` | string | No | Authenticated user ID for personalization (omitted for anonymous users) |
| `context` | string | No | Search context (e.g., "products", "videos", "locations") for domain-specific suggestions |
| `session_id` | string | No | Session ID for grouping keystrokes and tracking suggestion selection |
| `lat` / `lng` | float | No | User location for geo-aware suggestions (e.g., "restaurants near me") |

**Response:**

```json
{
  "prefix": "how to",
  "suggestions": [
    {
      "query": "how to tie a tie",
      "score": 0.95,
      "category": "lifestyle",
      "trending": false,
      "source": "popular"
    },
    {
      "query": "how to screenshot on mac",
      "score": 0.91,
      "category": "technology",
      "trending": true,
      "source": "trending"
    },
    {
      "query": "how to lose weight",
      "score": 0.88,
      "category": "health",
      "trending": false,
      "source": "popular"
    },
    {
      "query": "how to make money online",
      "score": 0.84,
      "category": "finance",
      "trending": false,
      "source": "popular"
    },
    {
      "query": "how to delete instagram account",
      "score": 0.80,
      "category": "technology",
      "trending": false,
      "source": "personal"
    }
  ],
  "metadata": {
    "processing_time_ms": 4,
    "trie_version": "2026-04-07T14:30:00Z",
    "personalized": true
  }
}
```

### 6.2 Report Suggestion Selection API

Called when the user clicks a suggestion. Critical for the feedback loop.

```
POST /v1/suggestions/select
```

**Request Body:**

```json
{
  "session_id": "sess_abc123",
  "user_id": "user_456",
  "prefix": "how to",
  "selected_query": "how to tie a tie",
  "position": 0,
  "suggestions_shown": [
    "how to tie a tie",
    "how to screenshot on mac",
    "how to lose weight",
    "how to make money online",
    "how to delete instagram account"
  ],
  "timestamp": "2026-04-07T14:32:15Z"
}
```

### 6.3 Report Search Query API

Called when the user submits a search (regardless of whether they used a suggestion).

```
POST /v1/queries/log
```

```json
{
  "user_id": "user_456",
  "query": "how to tie a tie",
  "source": "suggestion",
  "timestamp": "2026-04-07T14:32:15Z",
  "session_id": "sess_abc123"
}
```

---

## 7. Client-Side Optimization Strategy

Client-side behavior is **critical** for autocomplete -- arguably as important as server design.
The wrong client implementation can 10x your QPS or make suggestions feel laggy.

### 7.1 Debouncing Strategy

```
Without debouncing:
  User types "weather" (7 chars) → 7 API requests
  
With debouncing (100-150ms wait after last keystroke):
  User types "weather" at 60 WPM → characters arrive every ~100ms
  Fast typer: "w-e-a-t-h-e-r" → debouncer fires once after "weather"
  Slow typer: "w-e-a" (pause 200ms) "-t-h-e-r" → 2 requests: "wea", "weather"
  
Typical reduction: 60-70% fewer requests
```

**Implementation pseudocode:**

```javascript
let debounceTimer = null;
const DEBOUNCE_MS = 150;

function onKeyPress(prefix) {
  clearTimeout(debounceTimer);
  
  // Check local cache first (instant, no network)
  const cached = localCache.get(prefix);
  if (cached) {
    displaySuggestions(cached);
    return;  // No API call needed
  }
  
  debounceTimer = setTimeout(() => {
    fetchSuggestions(prefix);
  }, DEBOUNCE_MS);
}
```

### 7.2 Client-Side Caching

```
Strategy: Cache all suggestion responses in a local LRU cache (in-browser)

Why this works:
  - User types "weat" → API returns suggestions → cached
  - User deletes "t" (backspace) → "wea" → might be cached from earlier
  - User types "t" again → "weat" → cache hit! No API call

Cache policy:
  - LRU with 100-200 entries
  - TTL: 5-15 minutes (suggestions don't change that fast)
  - Key: prefix string, Value: suggestion list

Hit rate in practice: 30-50% (users frequently backspace and retype)
```

### 7.3 Request Cancellation

```
When a new keystroke arrives before the previous API response:
  - Cancel the in-flight HTTP request (AbortController in fetch API)
  - Only display the response for the latest prefix

This prevents:
  - Race conditions (response for "wea" arriving after response for "weat")
  - Wasted bandwidth
  - UI flickering
```

### 7.4 Progressive Prefix Optimization

```
Optimization: If we have results for "wea", we can locally filter for "weat"
without making a new API call.

Logic:
  1. Results for "wea": ["weather", "weapons", "wealth", "wearing", "weak"]
  2. User types "t" → prefix is "weat"
  3. Client-side filter: ["weather"] (only 1 match from "wea" results)
  4. If filtered count < 5 → make API call for "weat" to get more results
  5. If filtered count >= 5 → use local results, skip API call
  
This further reduces QPS by 10-20%.
```

### 7.5 Summary of Client Optimizations

```
Optimization                  QPS Reduction    Latency Impact
─────────────────────────────────────────────────────────────
Debouncing (150ms)            60-70%           +150ms worst case
Client-side cache             30-50%           0ms (cache hit)
Request cancellation          N/A              Prevents stale display
Progressive prefix filter     10-20%           0ms (local compute)
─────────────────────────────────────────────────────────────
Combined effect:              ~80-85% fewer API calls than naive approach
```

---

## 8. Data Model Overview

### 8.1 Query Frequency Table (aggregated data for trie building)

```sql
CREATE TABLE query_frequencies (
    query_text      VARCHAR(200)   PRIMARY KEY,
    frequency       BIGINT         NOT NULL,       -- total search count
    last_searched   TIMESTAMP      NOT NULL,       -- most recent search time
    language        VARCHAR(5)     NOT NULL,        -- "en", "zh", "ja", etc.
    category        VARCHAR(50),                    -- "technology", "sports", etc.
    is_blocked      BOOLEAN        DEFAULT FALSE,   -- offensive content flag
    created_at      TIMESTAMP      DEFAULT NOW(),
    updated_at      TIMESTAMP      DEFAULT NOW()
);

-- Index for trie builder to read in batches
CREATE INDEX idx_query_freq_lang ON query_frequencies(language, frequency DESC);
```

### 8.2 User Search History (for personalization)

```sql
CREATE TABLE user_search_history (
    user_id         VARCHAR(50)    NOT NULL,
    query_text      VARCHAR(200)   NOT NULL,
    searched_at     TIMESTAMP      NOT NULL,
    selected_from   VARCHAR(20),    -- "suggestion", "typed", "recent"
    PRIMARY KEY (user_id, searched_at)
);

-- Fast lookup for recent searches by user
CREATE INDEX idx_user_recent ON user_search_history(user_id, searched_at DESC);
-- TTL: 90 days (auto-expire old history)
```

### 8.3 Trending Queries (real-time counts)

```sql
-- In practice this is stored in Redis or Flink state, not SQL
-- Shown here for conceptual clarity

CREATE TABLE trending_queries (
    query_text      VARCHAR(200)   PRIMARY KEY,
    window_count    BIGINT,         -- count in current time window (e.g., last 1 hour)
    baseline_count  BIGINT,         -- typical count for this time period
    trending_score  FLOAT,          -- window_count / baseline_count
    detected_at     TIMESTAMP,
    expires_at      TIMESTAMP       -- auto-remove when trend dies
);
```

### 8.4 Blocked Terms (content filtering)

```sql
CREATE TABLE blocked_terms (
    term            VARCHAR(200)   PRIMARY KEY,
    reason          VARCHAR(100),   -- "hate_speech", "explicit", "legal"
    added_by        VARCHAR(50),    -- admin or ML classifier
    added_at        TIMESTAMP      DEFAULT NOW()
);
```

---

*Next: [High-Level Design](./high-level-design.md) -- Architecture, trie data structure, data collection pipeline, ranking, and caching strategy.*
