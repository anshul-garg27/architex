# Design Airbnb / Hotel Booking System: High-Level Design

## Table of Contents
- [1. Architecture Overview](#1-architecture-overview)
- [2. System Architecture Diagram](#2-system-architecture-diagram)
- [3. Component Deep Dive](#3-component-deep-dive)
- [4. Data Flow Walkthroughs](#4-data-flow-walkthroughs)
- [5. Database Design](#5-database-design)
- [6. Communication Patterns](#6-communication-patterns)

---

## 1. Architecture Overview

The system is organized as a **microservices architecture** with eight core services,
event-driven communication via Kafka, and a polyglot persistence strategy
(PostgreSQL + Elasticsearch + Redis + S3). Guests and hosts connect through an API
Gateway backed by a CDN for static content (photos, listing pages).

**Key architectural decisions:**
1. **Elasticsearch for search** -- geo queries + filters + full-text across 10M listings with sub-500ms latency
2. **Per-date availability calendar** -- each listing has a row per date; availability checks are range scans
3. **Pessimistic locking on booking** -- prevents double-booking via SELECT ... FOR UPDATE on date ranges
4. **Two-phase booking** -- authorize payment first, then confirm booking, then capture payment after check-in
5. **CDC (Change Data Capture)** -- PostgreSQL listing changes streamed to Elasticsearch via Debezium/Kafka
6. **CDN-first for photos** -- application servers never serve images; 200TB on CloudFront/Fastly

**Airbnb's actual architecture (public references):**
- Airbnb uses a service-oriented architecture with ~1,000 microservices
- Search is powered by a custom search platform (Nebula) built on Elasticsearch
- Availability uses a dedicated Availability Service with in-memory calendars
- Pricing uses ML models trained on billions of data points
- Payments use an internal Payments Platform with idempotency guarantees

---

## 2. System Architecture Diagram

```mermaid
graph TB
    subgraph Clients
        GA[Guest App<br/>iOS/Android/Web]
        HA[Host App<br/>iOS/Android/Web]
    end

    subgraph Edge Layer
        CDN[CDN<br/>CloudFront/Fastly<br/>- Listing photos<br/>- Static assets<br/>- Cached search results]
        AG[API Gateway<br/>Kong/Envoy<br/>- Auth & Rate Limiting<br/>- Request Routing<br/>- A/B Experiment Flags]
    end

    subgraph Core Services
        SS[Search Service<br/>- Geo + date + filter queries<br/>- ML ranking pipeline<br/>- Faceted results<br/>- Map clustering]
        LS[Listing Service<br/>- CRUD listings<br/>- Photo management<br/>- Amenities/rules<br/>- Host calendar mgmt]
        AS[Availability Service<br/>- Per-date calendar<br/>- Date range queries<br/>- Block/unblock dates<br/>- Min/max stay rules]
        BS[Booking Service<br/>- Booking lifecycle<br/>- Double-booking prevention<br/>- Cancellation handling<br/>- Instant Book vs Request]
        PAY[Payment Service<br/>- Auth, capture, refund<br/>- Host payouts<br/>- Multi-currency<br/>- Idempotent operations]
        PS[Pricing Service<br/>- Nightly rate calculation<br/>- Dynamic smart pricing<br/>- Fees and taxes<br/>- Currency conversion]
        RS[Review Service<br/>- Guest and host reviews<br/>- Rating aggregation<br/>- Dual-blind reveal<br/>- Quality score updates]
        MS[Messaging Service<br/>- Host-guest threads<br/>- Pre-booking questions<br/>- Check-in coordination<br/>- Automated messages]
    end

    subgraph Support Services
        NS[Notification Service<br/>- Push / Email / SMS<br/>- Booking confirmations<br/>- Review reminders<br/>- Message alerts]
        IS[Identity Service<br/>- Authentication<br/>- Verification<br/>- Fraud detection]
        IMG[Image Service<br/>- Upload processing<br/>- Resize & optimize<br/>- CDN invalidation]
    end

    subgraph Message Queue
        K[Apache Kafka<br/>- booking-events topic<br/>- listing-updates topic<br/>- availability-changes topic<br/>- payment-events topic<br/>- notification-events topic]
    end

    subgraph Data Stores
        PG[(PostgreSQL<br/>Bookings, Payments<br/>Users, Reviews)]
        ES[(Elasticsearch<br/>Listing Search Index<br/>Geo + Filters + Ranking)]
        RD[(Redis Cluster<br/>Availability Cache<br/>Session & Rate Limit<br/>Booking Locks)]
        S3[(S3 / Object Storage<br/>Listing Photos<br/>User Documents)]
    end

    subgraph External Services
        STRIPE[Payment Gateway<br/>Stripe / Adyen]
        MAP[Map Service<br/>Google Maps / Mapbox]
        APNS[Push Service<br/>APNs / FCM]
        ML[ML Platform<br/>Search Ranking Model<br/>Smart Pricing Model<br/>Fraud Detection Model]
    end

    GA -->|HTTPS| CDN
    HA -->|HTTPS| CDN
    GA -->|REST/gRPC| AG
    HA -->|REST/gRPC| AG

    AG --> SS
    AG --> LS
    AG --> BS
    AG --> PS
    AG --> RS
    AG --> MS

    SS --> ES
    SS --> AS
    SS --> ML
    SS --> RD

    LS --> PG
    LS --> K
    LS --> IMG
    IMG --> S3

    AS --> PG
    AS --> RD
    AS --> K

    BS --> AS
    BS --> PS
    BS --> PAY
    BS --> LS
    BS --> NS
    BS --> PG
    BS --> RD

    PAY --> STRIPE
    PAY --> PG
    PAY --> K

    PS --> ML
    PS --> RD

    RS --> PG
    RS --> K
    RS --> SS

    MS --> PG
    MS --> NS

    NS --> APNS
    NS --> K

    K --> ES
    K --> NS
    K --> AS

    CDN --> S3

    style SS fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style AS fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style BS fill:#ff6b6b,stroke:#c92a2a,color:#fff
    style K fill:#ffd43b,stroke:#f08c00,color:#000
    style ES fill:#4ecdc4,stroke:#099268,color:#fff
    style RD fill:#4ecdc4,stroke:#099268,color:#fff
```

---

## 3. Component Deep Dive

### 3.1 Search Service (The Core User Experience)

**Responsibility:** Given a location, date range, guest count, and filters, return
ranked available listings with sub-500ms latency.

**Why this is the hardest component:** Search must combine three dimensions simultaneously:
1. **Geospatial** -- "within 10km of San Francisco downtown" (geo_distance query)
2. **Temporal** -- "available from July 1 to July 5" (calendar range check)
3. **Attribute** -- "2+ bedrooms, has pool, under $300/night" (multi-field filter)
4. **Ranking** -- order by ML-predicted conversion probability

Most systems handle one or two of these well. Airbnb must handle all four in < 500ms.

```mermaid
graph TB
    subgraph "Search Request Pipeline"
        REQ[Search Request<br/>location, dates, guests, filters]
        
        subgraph "Step 1: Geo + Filter (Elasticsearch)"
            GEO[Geo Query<br/>geo_distance or geo_bounding_box<br/>within specified radius]
            FILT[Apply Filters<br/>property_type, amenities,<br/>price range, bedrooms,<br/>instant_book, superhost]
            ES_SCORE[ES Relevance Score<br/>text match on title/description<br/>if keyword search present]
        end
        
        subgraph "Step 2: Availability Check"
            AVAIL[Availability Service<br/>For each candidate listing:<br/>is it available for the full<br/>date range? Check min/max stay.]
            PRUNE[Prune Unavailable<br/>Remove listings booked<br/>for any date in range]
        end
        
        subgraph "Step 3: Pricing"
            PRICE[Pricing Service<br/>Calculate total price<br/>for requested date range<br/>per remaining listing]
            PRICE_FILT[Apply Price Filters<br/>Remove listings outside<br/>guest's price range]
        end
        
        subgraph "Step 4: ML Ranking"
            FEAT[Feature Assembly<br/>listing quality score,<br/>price competitiveness,<br/>host response rate,<br/>guest preferences]
            RANK[ML Ranking Model<br/>Predict P(booking)<br/>for each listing-guest pair]
            RERANK[Re-rank Results<br/>Sort by predicted<br/>conversion probability]
        end
        
        subgraph "Step 5: Response Assembly"
            PAGE[Paginate Results<br/>Top 20 per page]
            ENRICH[Enrich with<br/>photos, host info,<br/>review summary]
            FACETS[Compute Facets<br/>price histogram,<br/>amenity counts]
        end
    end
    
    REQ --> GEO
    GEO --> FILT
    FILT --> ES_SCORE
    ES_SCORE --> AVAIL
    AVAIL --> PRUNE
    PRUNE --> PRICE
    PRICE --> PRICE_FILT
    PRICE_FILT --> FEAT
    FEAT --> RANK
    RANK --> RERANK
    RERANK --> PAGE
    PAGE --> ENRICH
    ENRICH --> FACETS
```

**Search query execution (Elasticsearch):**

```json
{
  "query": {
    "bool": {
      "must": [
        {
          "geo_distance": {
            "distance": "15km",
            "location": { "lat": 37.77, "lon": -122.41 }
          }
        }
      ],
      "filter": [
        { "term": { "property_type": "ENTIRE_HOME" } },
        { "terms": { "amenities": ["wifi", "kitchen"] } },
        { "range": { "base_nightly_rate": { "gte": 50, "lte": 300 } } },
        { "range": { "max_guests": { "gte": 2 } } },
        { "range": { "bedrooms": { "gte": 2 } } },
        { "term": { "instant_book": true } },
        { "term": { "status": "ACTIVE" } }
      ]
    }
  },
  "sort": [
    { "_score": "desc" },
    { "quality_score": "desc" }
  ],
  "size": 100
}
```

**Geo indexing approaches (trade-offs):**

```
1. Geohash (what Elasticsearch uses internally):
   - Divides Earth into rectangular grid cells
   - Each cell has a string prefix (e.g., "9q8yy" for SF)
   - Neighboring cells share prefixes -- enables prefix search
   - Problem: cell boundary artifacts (two nearby points in different cells)
   - Airbnb uses geohash in ES but supplements with distance calculation

2. H3 Hexagonal Grid (Uber's system, Airbnb also uses):
   - Hexagonal cells have uniform distance to neighbors
   - No boundary artifacts (hexagons tile better than rectangles)
   - Resolution 7: ~5.16 km^2 per cell (good for city-level)
   - Resolution 9: ~0.11 km^2 per cell (good for neighborhood-level)
   - Airbnb uses H3 for demand aggregation and pricing zones

3. PostGIS / geo_distance (brute force):
   - Calculate Haversine distance for every listing
   - Too slow for 10M listings, but fine for pre-filtered sets < 10K

For interview: mention geohash as ES default, H3 as the modern approach for
demand zones and pricing, geo_distance for final ranking.
```

**Map-based search (when user drags the map):**

```
When user drags the map viewport, we need a different approach:

1. Client sends bounding box (NE corner, SW corner lat/lng)
2. At low zoom levels (zoomed out): return CLUSTERS
   - Pre-computed using geohash aggregation
   - "45 listings in this area, avg price $195"
   - Reduces response size from thousands of pins to ~50 clusters
   
3. At high zoom levels (zoomed in): return individual listings
   - ES geo_bounding_box query with all filters
   - Availability pre-checked
   - Max 200 results on map

Clustering algorithm:
  - Pre-compute listings per geohash at multiple resolutions
  - Zoom level 8-10: geohash precision 4 (large clusters)
  - Zoom level 11-13: geohash precision 5 (medium clusters)
  - Zoom level 14+: individual pins

Airbnb actually pre-computes "supercluster" tiles for fast map rendering.
```

---

### 3.2 Availability Service (The Consistency Challenge)

**Responsibility:** Track whether each listing is available on each date. Answer
"is listing X available from date A to date B?" with real-time accuracy.

**Why this matters:** If availability data is stale by even a few minutes, guests
will attempt to book unavailable listings, leading to failed bookings and terrible UX.
But checking availability across 10M listings in real-time is expensive.

```mermaid
graph TB
    subgraph "Availability Data Model"
        subgraph "Option A: Per-Date Row (Airbnb's approach)"
            ROW["listing_calendar table<br/>─────────────────<br/>listing_id | date | available | price | booked_by<br/>lst_001 | 2026-07-01 | true | 185.00 | null<br/>lst_001 | 2026-07-02 | true | 185.00 | null<br/>lst_001 | 2026-07-03 | false | null | bk_789<br/>lst_001 | 2026-07-04 | false | null | bk_789"]
        end
        
        subgraph "Option B: Date Range Intervals"
            RANGE["listing_availability_ranges<br/>─────────────────<br/>listing_id | start | end | status | booking_id<br/>lst_001 | 2026-07-01 | 2026-07-02 | AVAILABLE | null<br/>lst_001 | 2026-07-03 | 2026-07-04 | BOOKED | bk_789<br/>lst_001 | 2026-07-05 | 2026-08-31 | AVAILABLE | null"]
        end
        
        subgraph "Option C: Bitmap (365-bit per listing per year)"
            BITMAP["In-memory bitmap<br/>─────────────────<br/>lst_001_2026: 1100111111...<br/>(1 = available, 0 = booked)<br/>365 bits = ~46 bytes per listing per year<br/>10M listings = 460 MB total (fits in RAM!)"]
        end
    end
```

**Comparison of approaches:**

```
| Approach       | Storage     | Range Query   | Update Cost | Concurrency  |
|----------------|-------------|---------------|-------------|--------------|
| Per-date row   | 36.5 GB     | Range scan    | Update N rows| Row-level lock |
| Date ranges    | ~1 GB       | Interval query| Split/merge | Complex locks |
| Bitmap         | ~460 MB     | Bitwise AND   | Bit flip    | CAS atomic   |

Airbnb uses Option A (per-date row) in PostgreSQL as the source of truth,
with Option C (bitmap) as an in-memory cache in the Availability Service.

Why per-date row wins for the DB:
  - Simple to reason about (each date is independent)
  - Easy to lock specific dates during booking (SELECT ... FOR UPDATE)
  - Custom price per date is natural
  - PostgreSQL range scans on (listing_id, date) are efficient with index

Why bitmap wins for the cache:
  - 460 MB fits entirely in RAM
  - "Is listing available July 1-5?" = check 4 bits, O(1)
  - Can check 10,000 listings in < 1ms
  - Updated via CDC from PostgreSQL
```

**Availability check flow:**

```mermaid
sequenceDiagram
    participant SS as Search Service
    participant AS as Availability Service
    participant RD as Redis Cache
    participant PG as PostgreSQL

    SS->>AS: checkAvailability(listing_ids[], check_in, check_out)
    
    AS->>AS: Check in-memory bitmap cache
    Note over AS: For each listing: AND bits for date range<br/>If all 1s = available, 0 = unavailable
    
    alt Cache hit (99% of cases)
        AS-->>SS: {lst_001: true, lst_002: false, lst_003: true, ...}
    else Cache miss (new listing or cache eviction)
        AS->>RD: GET calendar:lst_new
        alt Redis hit
            RD-->>AS: Calendar data
            AS->>AS: Update bitmap cache
            AS-->>SS: Availability result
        else Redis miss
            AS->>PG: SELECT * FROM listing_calendar<br/>WHERE listing_id = ? AND date BETWEEN ? AND ?<br/>AND available = false
            PG-->>AS: Booked dates (if any)
            AS->>RD: SET calendar:lst_new (TTL 1h)
            AS->>AS: Update bitmap cache
            AS-->>SS: Availability result
        end
    end
```

**Cache invalidation (critical for correctness):**

```
When a booking is confirmed:
  1. PostgreSQL: UPDATE listing_calendar SET available=false, booked_by=?
     WHERE listing_id=? AND date BETWEEN check_in AND check_out
  2. Kafka: publish availability-changed event
  3. Availability Service: receive event, flip bits in bitmap cache
  4. Redis: invalidate calendar:{listing_id} key
  5. Elasticsearch: NOT updated (search results can be slightly stale;
     availability is re-checked before booking anyway)

Latency of invalidation: < 500ms from booking to cache update
This means there is a brief window where search results may show a 
listing as available when it was just booked. This is acceptable because:
  - The booking flow re-checks availability before confirming
  - The probability of two guests trying to book the same listing in 
    the same 500ms window is very low (unlike hotel rooms with high volume)
```

---

### 3.3 Booking Service (The Orchestrator)

**Responsibility:** Manage the complete booking lifecycle from request to checkout.
Prevent double-bookings. Handle Instant Book vs Request-to-Book. Process cancellations.

**Booking State Machine:**

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: Guest submits booking

    PENDING_PAYMENT --> PAYMENT_AUTHORIZED: Payment auth succeeds
    PENDING_PAYMENT --> FAILED: Payment auth fails

    PAYMENT_AUTHORIZED --> CONFIRMED: Instant Book listing
    PAYMENT_AUTHORIZED --> PENDING_HOST: Request-to-Book listing

    PENDING_HOST --> CONFIRMED: Host approves (within 24h)
    PENDING_HOST --> DECLINED: Host declines
    PENDING_HOST --> EXPIRED: Host does not respond in 24h

    DECLINED --> [*]: Refund issued
    EXPIRED --> [*]: Refund issued
    FAILED --> [*]: No charge

    CONFIRMED --> CANCELLED_BY_GUEST: Guest cancels
    CONFIRMED --> CANCELLED_BY_HOST: Host cancels
    CONFIRMED --> CHECKED_IN: Guest checks in (auto on check-in date)

    CANCELLED_BY_GUEST --> [*]: Refund per cancellation policy
    CANCELLED_BY_HOST --> [*]: Full refund + host penalty

    CHECKED_IN --> COMPLETED: Check-out date reached
    
    COMPLETED --> REVIEWED: Both reviews submitted
    COMPLETED --> [*]: Review window closes (14 days)
    REVIEWED --> [*]
```

**Double-booking prevention (the critical section):**

```mermaid
sequenceDiagram
    participant G1 as Guest 1
    participant G2 as Guest 2
    participant BS as Booking Service
    participant PG as PostgreSQL
    participant PAY as Payment Service

    Note over G1,PAY: Two guests try to book the same listing for overlapping dates

    G1->>BS: Book lst_001 (Jul 1-5)
    G2->>BS: Book lst_001 (Jul 3-7)
    
    Note over BS,PG: Pessimistic locking approach
    
    BS->>PG: BEGIN TRANSACTION (Serializable)
    BS->>PG: SELECT * FROM listing_calendar<br/>WHERE listing_id = 'lst_001'<br/>AND date BETWEEN '2026-07-01' AND '2026-07-04'<br/>AND available = true<br/>FOR UPDATE
    
    Note over PG: Guest 1's transaction locks rows Jul 1-4
    
    PG-->>BS: 4 available dates (all locked)
    BS->>BS: All dates available? YES for Guest 1
    
    Note over BS,PG: Guest 2's transaction tries to lock overlapping dates
    
    BS->>PG: SELECT * FROM listing_calendar<br/>WHERE listing_id = 'lst_001'<br/>AND date BETWEEN '2026-07-03' AND '2026-07-06'<br/>AND available = true<br/>FOR UPDATE
    
    Note over PG: BLOCKS! Jul 3-4 are locked by Guest 1's transaction
    
    BS->>PAY: Authorize Guest 1 payment
    PAY-->>BS: Authorized
    
    BS->>PG: UPDATE listing_calendar SET available = false, booked_by = 'bk_001'<br/>WHERE listing_id = 'lst_001' AND date BETWEEN '2026-07-01' AND '2026-07-04'
    BS->>PG: INSERT INTO bookings (id, ...) VALUES ('bk_001', ...)
    BS->>PG: COMMIT
    
    Note over PG: Guest 1's transaction commits. Rows unlocked.
    Note over PG: Guest 2's SELECT now executes
    
    PG-->>BS: Only 2 available dates (Jul 5-6), NOT 4
    BS->>BS: All dates available? NO (Jul 3-4 now booked)
    BS->>PG: ROLLBACK
    BS-->>G2: Booking failed: dates no longer available
    BS-->>G1: Booking confirmed!
```

**Why pessimistic locking (not optimistic):**

```
Optimistic locking (version check at commit time):
  - Read availability without locks
  - Process booking
  - At commit: check if dates were modified since read
  - If conflict: retry
  Problem: for popular listings during peak season, high contention
  means many retries, wasted payment authorizations, and bad UX.

Pessimistic locking (SELECT ... FOR UPDATE):
  - Lock the specific date rows at the start
  - Process booking while holding locks
  - Commit releases locks
  - Loser waits (blocked) rather than retrying
  
  Advantage: guaranteed success for the first transaction.
  Disadvantage: second transaction must wait (adds latency).
  
  Acceptable because:
  - Contention is rare (10M listings, 2M bookings/day = avg 0.2 bookings/listing/day)
  - Lock duration is short (~1-3 seconds for payment auth)
  - The locking granularity is per-listing-per-date, not global

Airbnb's actual approach: pessimistic locking with a timeout.
If the lock is held for > 5 seconds (payment gateway slow), release
the lock and return an error. Guest can retry.
```

**Instant Book vs Request-to-Book:**

```
Instant Book (70% of Airbnb listings):
  1. Guest submits booking
  2. System checks availability (with lock)
  3. Authorizes payment
  4. Marks dates as booked
  5. Sends confirmation to guest and host
  6. Total time: 1-3 seconds
  
Request-to-Book (30% of listings):
  1. Guest submits booking request
  2. System checks availability (with TENTATIVE hold)
  3. Pre-authorizes payment (hold on card, not charged)
  4. Marks dates as HELD (not yet booked)
  5. Notifies host of request
  6. Host has 24 hours to approve or decline
  7a. Host approves: dates marked as BOOKED, payment captured
  7b. Host declines: dates released, pre-auth voided
  7c. No response in 24h: dates released, pre-auth voided
  
  HELD state prevents other guests from booking those dates while
  the host is deciding. But if the host declines, dates become
  available again immediately.
```

---

### 3.4 Listing Service

**Responsibility:** CRUD operations for listings. Photo management. Host calendar
management. Listing quality scoring.

```mermaid
graph TB
    subgraph "Listing Lifecycle"
        DRAFT[DRAFT<br/>Host starts creating listing]
        REVIEW[PENDING_REVIEW<br/>Submitted for review<br/>Content moderation]
        ACTIVE[ACTIVE<br/>Visible in search<br/>Bookable]
        PAUSED[SNOOZED<br/>Temporarily hidden<br/>Host pauses listing]
        DEACTIVATED[DEACTIVATED<br/>Permanently removed<br/>or policy violation]
    end
    
    DRAFT -->|Submit| REVIEW
    REVIEW -->|Approved| ACTIVE
    REVIEW -->|Rejected| DRAFT
    ACTIVE -->|Host pauses| PAUSED
    PAUSED -->|Host resumes| ACTIVE
    ACTIVE -->|Deactivate| DEACTIVATED
    PAUSED -->|Deactivate| DEACTIVATED
```

**Photo upload pipeline:**

```
1. Host selects photos in app
2. Client uploads directly to S3 via presigned URL
   (bypasses application servers -- critical for large uploads)
3. S3 triggers Lambda/event to Image Service
4. Image Service:
   a. Validate image (format, size, content moderation via ML)
   b. Generate thumbnails: 200x200, 400x300, 800x600, 1200x900
   c. Optimize with WebP/AVIF for modern browsers
   d. Store all variants in S3
   e. Push CDN URLs to Listing Service
5. Listing Service updates listing record with photo URLs
6. CDN serves photos globally with cache headers (1 year TTL)
```

**Listing-to-Elasticsearch sync (CDC pipeline):**

```mermaid
graph LR
    PG[(PostgreSQL<br/>listings table)] -->|WAL| DEB[Debezium<br/>CDC Connector]
    DEB -->|Change events| K[Kafka<br/>listing-updates]
    K -->|Consumer| TRANS[Transform Service<br/>- Enrich with ratings<br/>- Compute quality score<br/>- Add host data]
    TRANS -->|Bulk index| ES[(Elasticsearch<br/>listings index)]
    
    style DEB fill:#ffd43b,stroke:#f08c00,color:#000
```

```
Why CDC instead of dual-write:
  - Dual-write (write to PG and ES in the same request) is fragile.
    If ES write fails after PG succeeds, data is inconsistent.
  - CDC guarantees eventual consistency: PG is source of truth,
    ES is derived and always catches up.
  - Latency: ~1-5 seconds from PG write to ES index update.
  - This means a host creates a listing and it appears in search
    within a few seconds. Acceptable.
  
Airbnb uses a similar pattern with their "Derived Data" platform.
```

---

### 3.5 Payment Service

**Responsibility:** Handle the full payment lifecycle -- authorize, capture, refund,
payout. Multi-currency support. Exactly-once semantics via idempotency.

**Two-phase payment model (how Airbnb actually works):**

```mermaid
sequenceDiagram
    participant BS as Booking Service
    participant PAY as Payment Service
    participant PG as PostgreSQL
    participant STRIPE as Stripe/Adyen
    participant K as Kafka

    Note over BS,K: Phase 1: Authorization (at booking time)
    BS->>PAY: authorize(guest, amount, currency, idempotency_key)
    PAY->>PG: Check idempotency_key
    PAY->>STRIPE: Create PaymentIntent (authorize only)
    STRIPE-->>PAY: auth_id, status=AUTHORIZED
    PAY->>PG: INSERT payment (status=AUTHORIZED)
    PAY-->>BS: Authorized

    Note over BS,K: Guest checks in (days/weeks later)

    Note over BS,K: Phase 2: Capture (24h after check-in)
    BS->>PAY: capture(payment_id, idempotency_key)
    PAY->>STRIPE: Capture PaymentIntent
    STRIPE-->>PAY: status=CAPTURED
    PAY->>PG: UPDATE payment (status=CAPTURED)
    PAY->>K: Publish payment.captured event

    Note over BS,K: Phase 3: Host Payout (24h after check-in)
    K->>PAY: Trigger payout job
    PAY->>PAY: Calculate: total - service_fee = host_payout
    PAY->>STRIPE: Transfer to host's connected account
    STRIPE-->>PAY: payout_id
    PAY->>PG: INSERT payout (status=SENT)
    PAY->>K: Publish payout.completed event
```

**Why two-phase (authorize then capture):**

```
- Guest books on June 25 for July 1 check-in
- Authorization holds funds on guest's card (not charged)
- If guest cancels before policy deadline: void auth (no charge)
- If guest cancels after policy deadline: capture partial amount per policy
- If host cancels: void auth, apply penalty to host
- On check-in: capture full amount
- 24h after check-in: payout to host

This protects both parties:
  - Guest: not charged until they actually stay
  - Host: guaranteed payment 24h after check-in
  
Airbnb charges the guest at booking for most policies now, but the
authorize-then-capture model is still used for some payment methods
and longer-term stays.
```

**Cancellation refund matrix:**

```
| Policy     | Cancel Before | Refund Amount              | After          |
|------------|---------------|---------------------------|----------------|
| Flexible   | 24h before    | 100% of nightly + cleaning| 0% (+ service) |
| Moderate   | 5 days before | 100%                      | 50% nightly    |
| Strict     | 14 days before| 100%                      | 50% nightly    |
|            | 7 days before | 50%                       | 0%             |
| Host cancel| Any time      | 100% to guest             | Host penalty   |

Cleaning fee: refunded if cancelled before check-in for all policies
Service fee: refunded if cancelled within 48h of booking AND 14+ days before
```

---

### 3.6 Pricing Service

**Responsibility:** Calculate the total price for a stay. Provide Smart Pricing
recommendations. Handle fees, taxes, and currency conversion.

**Price calculation flow:**

```
total_price = nightly_total + cleaning_fee + service_fee + taxes

Where:
  nightly_total = sum of price for each night (may vary by date)
  
  For each night:
    if host set custom_price for that date:
      nightly_rate = custom_price
    elif Smart Pricing enabled:
      nightly_rate = smart_pricing_model.predict(listing, date)
    else:
      nightly_rate = base_nightly_rate
    
    Apply discounts:
      if stay >= 7 nights: apply weekly_discount_pct
      if stay >= 28 nights: apply monthly_discount_pct
  
  cleaning_fee = listing.cleaning_fee (flat, once per stay)
  
  service_fee = nightly_total * 0.14  (Airbnb charges ~14% guest service fee)
  
  taxes = (nightly_total + cleaning_fee) * local_tax_rate
    (varies by jurisdiction: 12-15% in most US cities)

Example:
  4 nights at $185/night, $75 cleaning fee, San Francisco:
  nightly_total  = 4 x $185           = $740.00
  cleaning_fee   = $75.00
  service_fee    = $740 x 0.14        = $103.60
  SF occupancy tax = ($740 + $75) x 0.14 = $114.10
  total_price    = $740 + $75 + $103.60 + $114.10 = $1,032.70
```

**Dynamic Smart Pricing (detailed in deep-dive):**

```mermaid
graph TB
    subgraph "Smart Pricing Inputs"
        DEM[Demand Signals<br/>- Search volume for area<br/>- Booking velocity<br/>- Lead time to check-in]
        COMP[Comparable Listings<br/>- Similar listings nearby<br/>- Their pricing and occupancy<br/>- Price position]
        HIST[Historical Data<br/>- Day of week patterns<br/>- Seasonal trends<br/>- Past booking rates]
        EVENT[External Events<br/>- Local events/conferences<br/>- Holidays<br/>- Weather forecasts]
    end
    
    subgraph "ML Model"
        FEAT[Feature Engineering<br/>100+ features per listing-date]
        MODEL["Demand Prediction Model<br/>P(booking | price, features)<br/>Optimize for host revenue"]
        SUGGEST[Suggested Price<br/>per date]
    end
    
    subgraph "Output"
        HOST[Host Dashboard<br/>Suggested prices with<br/>explanation]
        AUTO[Auto-Apply<br/>if host enabled<br/>Smart Pricing]
    end
    
    DEM --> FEAT
    COMP --> FEAT
    HIST --> FEAT
    EVENT --> FEAT
    FEAT --> MODEL
    MODEL --> SUGGEST
    SUGGEST --> HOST
    SUGGEST --> AUTO
```

---

### 3.7 Review Service

**Responsibility:** Manage the dual-blind review system. Aggregate ratings. Update
listing quality scores used in search ranking.

**Dual-blind review mechanism (Airbnb's design):**

```
1. Guest checks out on July 5
2. Both guest and host have 14 days to submit reviews
3. Reviews are NOT visible until BOTH are submitted
   OR the 14-day window expires
4. This prevents retaliation reviews (host sees bad review, writes bad one back)

Implementation:
  - review.is_visible = false on creation
  - When second review for same booking is submitted:
    UPDATE reviews SET is_visible = true WHERE booking_id = ?
  - Cron job: after 14 days, SET is_visible = true for any remaining

After visibility:
  - Recalculate listing avg_rating and review_count
  - Publish rating-updated event to Kafka
  - Search Service updates quality_score in Elasticsearch
```

**Rating aggregation:**

```sql
-- Efficient aggregation using materialized counters
-- Updated on each new review via trigger or application code

UPDATE listings
SET avg_rating = (
    (avg_rating * review_count + NEW.overall_rating) / (review_count + 1)
),
review_count = review_count + 1
WHERE id = NEW.listing_id;

-- Category-level aggregation stored in a separate table
-- to avoid widening the listings table
```

---

### 3.8 Messaging Service

**Responsibility:** Enable communication between hosts and guests. Pre-booking
inquiries. Check-in coordination. Automated messages triggered by booking events.

```mermaid
graph LR
    subgraph "Message Types"
        PRE[Pre-booking inquiry<br/>Guest asks question<br/>before booking]
        BOOK[Booking message<br/>Attached to booking<br/>request]
        STAY[During-stay<br/>Check-in instructions<br/>Issue reporting]
        AUTO[Automated<br/>Check-in reminder<br/>Review prompt<br/>Payout notification]
    end
    
    subgraph "Messaging Architecture"
        API[Message API]
        PG[(PostgreSQL<br/>Message store)]
        WS[WebSocket<br/>Real-time delivery<br/>typing indicators]
        PUSH[Push Notification<br/>Offline delivery]
        EMAIL[Email Fallback<br/>If no app activity<br/>in 10 minutes]
    end
    
    PRE --> API
    BOOK --> API
    STAY --> API
    AUTO --> API
    API --> PG
    API --> WS
    API --> PUSH
    API --> EMAIL
```

**Response rate tracking (affects search ranking):**

```
Airbnb tracks host response rate and response time:
  - Response rate: % of new inquiries responded to within 24h
  - Response time: median time to first response
  
  Metrics directly impact:
    1. Superhost status (requires 90%+ response rate)
    2. Search ranking (responsive hosts ranked higher)
    3. Instant Book eligibility
    
  Calculated daily via batch job analyzing message threads.
```

---

## 4. Data Flow Walkthroughs

### 4.1 Complete Search-to-Booking Flow (End-to-End)

```mermaid
sequenceDiagram
    participant G as Guest App
    participant AG as API Gateway
    participant SS as Search Service
    participant ES as Elasticsearch
    participant AS as Availability Service
    participant PS as Pricing Service
    participant BS as Booking Service
    participant PG as PostgreSQL
    participant RD as Redis
    participant PAY as Payment Service
    participant NS as Notification Service
    participant H as Host App

    Note over G,H: Phase 1: Search
    G->>AG: GET /search?location=SF&check_in=Jul1&check_out=Jul5&guests=2
    AG->>SS: Search request
    SS->>ES: Geo query + filters (get 200 candidates)
    ES-->>SS: 200 listing IDs matching geo + filters
    SS->>AS: checkAvailability(200 listing_ids, Jul1-Jul5)
    AS->>AS: Bitmap check in memory (sub-ms)
    AS-->>SS: 142 available listings
    SS->>PS: getPrices(142 listings, Jul1-Jul5)
    PS-->>SS: Prices for each listing
    SS->>SS: ML ranking (top 20 by conversion probability)
    SS-->>AG: 20 ranked results with prices + photos
    AG-->>G: Display search results

    Note over G,H: Phase 2: View Listing Detail
    G->>AG: GET /listings/lst_abc123
    AG->>PG: Listing details (cacheable)
    PG-->>AG: Full listing data
    AG->>AS: GET /listings/lst_abc123/calendar (Jul-Aug)
    AS-->>AG: Calendar with prices per date
    AG-->>G: Display listing with calendar and reviews

    Note over G,H: Phase 3: Book
    G->>AG: POST /bookings/price-quote
    AG->>PS: Calculate exact price
    PS-->>AG: Price breakdown ($1,032.70)
    AG-->>G: Show price breakdown + confirm button

    G->>AG: POST /bookings (confirm booking)
    AG->>BS: Create booking
    
    Note over BS,PG: Critical section: lock + verify + pay + confirm
    BS->>PG: BEGIN TRANSACTION
    BS->>PG: SELECT ... FROM listing_calendar<br/>WHERE listing_id='lst_abc123'<br/>AND date BETWEEN Jul1 AND Jul4<br/>FOR UPDATE
    PG-->>BS: 4 rows (all available + locked)
    
    BS->>PAY: Authorize $1,032.70
    PAY-->>BS: Authorization successful
    
    BS->>PG: UPDATE listing_calendar SET available=false, booked_by='bk_new'
    BS->>PG: INSERT INTO bookings (...)
    BS->>PG: COMMIT
    
    BS->>RD: Invalidate availability cache for lst_abc123
    BS->>NS: Send booking confirmation
    BS-->>AG: Booking confirmed (bk_new789)
    AG-->>G: "Your trip is confirmed!"

    NS->>G: Push: "Booking confirmed for Jul 1-5"
    NS->>H: Push: "New booking from Alex for Jul 1-5"
    NS->>H: Email: Booking details

    Note over G,H: Phase 4: Pre-Trip
    Note over G,H: 48h before check-in: automated reminder
    NS->>G: Push: "Your trip starts in 2 days"
    H->>G: Message: "Here are check-in instructions..."

    Note over G,H: Phase 5: Check-in + Payment Capture
    Note over BS,PAY: Day of check-in (Jul 1)
    BS->>PAY: Capture payment ($1,032.70)
    PAY-->>BS: Captured
    
    Note over BS,PAY: 24h after check-in (Jul 2)
    PAY->>PAY: Calculate host payout
    PAY->>PAY: Transfer to host ($740 + $75 - 3% host fee = $790.55)
    NS->>H: Push: "You earned $790.55 for Alex's stay"

    Note over G,H: Phase 6: Review
    Note over G,H: After check-out (Jul 5)
    G->>AG: POST /reviews (5 stars, "Amazing stay!")
    H->>AG: POST /reviews (5 stars, "Great guest!")
    Note over PG: Both reviews submitted -- make visible
```

### 4.2 Host Creates a Listing

```mermaid
sequenceDiagram
    participant H as Host App
    participant AG as API Gateway
    participant LS as Listing Service
    participant IMG as Image Service
    participant S3 as S3
    participant PG as PostgreSQL
    participant K as Kafka
    participant ES as Elasticsearch
    participant AS as Availability Service

    H->>S3: Upload 20 photos (presigned URLs)
    S3-->>H: Upload complete

    S3->>IMG: S3 event trigger
    IMG->>IMG: Validate, resize, optimize
    IMG->>S3: Store 4 sizes per photo (80 images total)
    IMG->>LS: Photo URLs ready

    H->>AG: POST /listings (create listing)
    AG->>LS: Create listing
    LS->>PG: INSERT INTO listings (status=PENDING_REVIEW)
    LS->>PG: INSERT INTO listing_photos (20 rows)
    LS->>PG: INSERT INTO listing_amenities
    LS->>PG: INSERT INTO listing_calendar (365 rows, all available)
    
    Note over LS: Content moderation (automated + manual queue)
    LS->>LS: ML content check (photos, text)
    LS->>PG: UPDATE listing SET status=ACTIVE
    
    LS->>K: Publish listing.created event
    K->>ES: Index new listing in Elasticsearch
    K->>AS: Initialize availability bitmap

    LS-->>AG: Listing created (lst_new456)
    AG-->>H: "Your listing is live!"
```

### 4.3 Cancellation Flow

```mermaid
sequenceDiagram
    participant G as Guest
    participant BS as Booking Service
    participant AS as Availability Service
    participant PAY as Payment Service
    participant PG as PostgreSQL
    participant NS as Notification Service
    participant H as Host

    G->>BS: POST /bookings/bk_789/cancel
    
    BS->>PG: Get booking details + cancellation policy
    BS->>BS: Calculate refund based on policy and timing
    
    Note over BS: Moderate policy, cancelled 3 days before check-in<br/>Refund: 50% of nightly rate + cleaning fee
    
    BS->>PG: BEGIN TRANSACTION
    BS->>PG: UPDATE bookings SET status='CANCELLED_BY_GUEST'
    BS->>PG: UPDATE listing_calendar SET available=true, booked_by=null<br/>WHERE listing_id='lst_abc' AND booked_by='bk_789'
    BS->>PG: COMMIT
    
    BS->>PAY: Partial refund ($445.00)
    PAY-->>BS: Refund processed
    
    BS->>AS: Invalidate availability cache (dates now available again)
    
    BS->>NS: Notify both parties
    NS->>G: "Cancellation confirmed. Refund: $445.00"
    NS->>H: "Alex cancelled their Jul 1-5 stay. Dates are now available."
```

---

## 5. Database Design

### 5.1 Storage Strategy Overview

```mermaid
graph TB
    subgraph "PostgreSQL (ACID, Source of Truth)"
        PG1[users<br/>100M rows]
        PG2[listings<br/>10M rows]
        PG3[bookings<br/>2M/day]
        PG4[payments<br/>2M/day]
        PG5[reviews<br/>1.2M/day]
        PG6[listing_calendar<br/>3.65B rows<br/>10M x 365 days]
        PG7[messages<br/>600K/day]
    end

    subgraph "Elasticsearch (Search Index)"
        ES1[listings index<br/>10M documents<br/>Geo + filters + ranking<br/>Updated via CDC]
    end

    subgraph "Redis (Cache + Locks)"
        RD1[Availability bitmap<br/>460 MB in memory<br/>19K checks/sec]
        RD2[Listing detail cache<br/>Hot listings<br/>TTL 5 min]
        RD3[Session store<br/>Active sessions]
        RD4[Rate limiter<br/>Per-user, per-IP]
        RD5[Booking locks<br/>Distributed lock<br/>during checkout]
    end

    subgraph "S3 + CDN (Photos)"
        S3_1[Listing photos<br/>200 TB<br/>Multiple sizes]
        CDN1[CloudFront/Fastly<br/>Global edge cache<br/>10 GB/sec]
    end

    subgraph "Kafka (Event Streaming)"
        K1[booking-events<br/>~25 events/sec]
        K2[listing-updates<br/>~100 events/sec]
        K3[availability-changes<br/>~50 events/sec]
        K4[payment-events<br/>~25 events/sec]
        K5[notification-events<br/>~100 events/sec]
    end
```

### 5.2 Sharding Strategy

```
PostgreSQL sharding:

  Users: shard by user_id (hash-based, 8 shards)
    - Uniform distribution, no hotspots
    - Each shard: ~12.5M users

  Listings: shard by listing_id (hash-based, 8 shards)
    - NOT by city/country (would create hotspots: Paris, NYC have 10x more listings)
    - Hash ensures even distribution
    - Each shard: ~1.25M listings

  Bookings: shard by listing_id (co-located with listings)
    - Booking always needs listing data (join on same shard)
    - Guest's booking history requires scatter-gather across shards
      (acceptable: users don't view history often, and it is cacheable)

  listing_calendar: shard by listing_id (co-located with listings and bookings)
    - Critical: SELECT ... FOR UPDATE during booking must be single-shard
    - Cross-shard transactions would kill performance
    - Each shard: ~457M calendar rows (10M/8 listings x 365 days)

  Payments: shard by booking_id (which maps to listing_id shard)
    - Co-located with bookings for transactional integrity

  Reviews: shard by listing_id
    - Most reads are "reviews for listing X" (single-shard query)

Elasticsearch:
  - 10M listings across 5 primary shards, 1 replica each
  - Sharded by listing_id hash (default ES behavior)
  - Each shard: ~2M documents

Redis:
  - Availability bitmap: partitioned by listing_id range
    across 4-6 instances
  - Session/rate-limit: consistent hashing across 3 instances
```

### 5.3 Indexing Strategy

```sql
-- Critical indexes for performance

-- Search: listings by city and status (for ES re-index)
CREATE INDEX idx_listings_city_status ON listings(city, status);

-- Availability: THE most queried table
-- Primary key (listing_id, date) handles range scans
-- Additional index for finding available dates quickly
CREATE INDEX idx_calendar_listing_avail ON listing_calendar(listing_id, date)
    WHERE available = true;

-- Booking lookups
CREATE INDEX idx_bookings_guest ON bookings(guest_id, check_in DESC);
CREATE INDEX idx_bookings_listing_dates ON bookings(listing_id, check_in, check_out)
    WHERE status IN ('CONFIRMED', 'CHECKED_IN');
CREATE INDEX idx_bookings_host ON bookings(host_id, created_at DESC);

-- Payment lookups
CREATE UNIQUE INDEX idx_payments_idempotency ON payments(idempotency_key);

-- Reviews: listing page shows reviews sorted by date
CREATE INDEX idx_reviews_listing_date ON reviews(listing_id, created_at DESC)
    WHERE is_visible = true;

-- Messages: thread view
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
CREATE INDEX idx_messages_user ON messages(sender_id, created_at DESC);
```

---

## 6. Communication Patterns

### 6.1 Synchronous (Request-Reply)

```
Used for: operations where the caller needs an immediate response

  Guest → API Gateway → Search Service → Elasticsearch
  (Guest is waiting for search results)

  Booking Service → Availability Service
  (Must verify availability before proceeding with booking)

  Booking Service → Payment Service → Stripe
  (Payment must be authorized before confirming booking)

  Guest → API Gateway → Listing Service → PostgreSQL
  (Guest viewing listing details, must return content)

Protocol: gRPC between internal services (efficient, typed)
         REST for client-facing APIs (broad client compatibility)
Timeout: 3s default, 10s for search (includes ES + availability + pricing)
Retry: exponential backoff with jitter, max 3 retries
Circuit breaker: trip after 50% failure rate in 10s window
```

### 6.2 Asynchronous (Event-Driven via Kafka)

```
Used for: decoupled processing, side effects, data pipelines

  Listing updates → Kafka → Elasticsearch indexer
  (Keep search index in sync with PostgreSQL source of truth)

  Booking confirmed → Kafka → Notification Service → Push/Email/SMS
  (Don't block booking confirmation on notification delivery)

  Booking confirmed → Kafka → Availability Service → Cache update
  (Update in-memory bitmap after booking)

  Review submitted → Kafka → Rating aggregation → Listing update
  (Recalculate avg_rating asynchronously)

  All events → Kafka → Analytics Pipeline → Data Warehouse
  (Business intelligence, ML training data)
```

### 6.3 Communication Decision Matrix

```
| Communication              | Pattern     | Why                                       |
|---------------------------|-------------|-------------------------------------------|
| Search query              | Sync gRPC   | Guest waiting for results                 |
| Listing detail            | Sync REST   | Guest viewing page                        |
| Availability check        | Sync gRPC   | Must verify before booking                |
| Price calculation         | Sync gRPC   | Must show price before confirm            |
| Payment authorization     | Sync gRPC   | Must authorize before confirming booking  |
| Booking confirmation      | Sync gRPC   | Guest waiting for confirmation            |
| Notification delivery     | Async Kafka | Don't block booking on notification       |
| ES index update           | Async Kafka | Eventual consistency is fine for search   |
| Availability cache update | Async Kafka | Sub-second propagation sufficient         |
| Rating recalculation      | Async Kafka | Non-critical path, eventual is fine       |
| Photo processing          | Async S3+SQS| Heavy processing, don't block upload      |
| Host payout               | Async Kafka | Batch processing, scheduled               |
| Analytics events          | Async Kafka | Offline processing                        |
```

---

## Key Interview Talking Points

> **Start with the architecture diagram.** Draw the 8 services and their data stores.
> Label the three hardest problems: (1) Search across geo + time + attributes,
> (2) Availability checking at scale, (3) Double-booking prevention.

> **Highlight the search pipeline.** Walk through how a search query flows:
> Elasticsearch for geo + filters, Availability Service for date checking,
> Pricing Service for totals, ML model for ranking. Each step narrows the
> candidate set: 10M listings -> 200 geo matches -> 142 available -> 20 ranked.

> **Explain the booking critical section.** Draw the sequence diagram showing
> pessimistic locking with SELECT ... FOR UPDATE on the calendar rows.
> This is the money question -- the interviewer will probe how you prevent
> double-bookings.

> **Mention Airbnb-specific details:** Nebula search platform, Smart Pricing ML,
> dual-blind review system, Instant Book vs Request-to-Book, two-phase payment
> (authorize then capture). This shows you have studied the actual system.
