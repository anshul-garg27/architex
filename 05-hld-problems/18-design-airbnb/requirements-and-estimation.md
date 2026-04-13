# Design Airbnb / Hotel Booking System: Requirements and Estimation

## Table of Contents
- [1. Problem Statement](#1-problem-statement)
- [2. Functional Requirements](#2-functional-requirements)
- [3. Non-Functional Requirements](#3-non-functional-requirements)
- [4. Out of Scope](#4-out-of-scope)
- [5. Back-of-Envelope Estimation](#5-back-of-envelope-estimation)
- [6. API Design](#6-api-design)
- [7. Data Model Overview](#7-data-model-overview)

---

## 1. Problem Statement

Design a vacation rental and accommodation booking platform (like Airbnb) that enables
hosts to list their properties and guests to search, browse, and book stays. The system
must handle geospatial search across millions of listings, real-time availability
management, double-booking prevention, dynamic pricing, reviews, messaging, and
payment processing -- all at global scale.

**Why this problem is a top-tier interview question:**
- It tests **geospatial search** (finding listings near a location with complex filters)
- It tests **calendar/availability systems** (date-range queries across millions of listings)
- It tests **distributed locking** (preventing double-bookings under concurrency)
- It tests **two-sided marketplace design** (host and guest flows, trust mechanisms)
- It tests **dynamic pricing** (demand, seasonality, local events, competitor data)
- It tests **consistency vs availability tradeoffs** (booking must be consistent; search can be eventually consistent)

**Key difference from hotel booking (Booking.com) vs. Airbnb:**
- Hotels have standardized room types (100 rooms of type X). Airbnb listings are unique.
- Hotel availability = room count. Airbnb availability = per-listing binary (available or not).
- Hotels use channel managers feeding multiple OTAs. Airbnb hosts typically list on one platform.
- This means Airbnb's availability model is simpler (no inventory count) but search ranking
  is far more complex (every listing is unique, quality varies enormously).

---

## 2. Functional Requirements

### 2.1 Core Guest Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Search listings** | Guest enters location (city, neighborhood, or map viewport), check-in/check-out dates, number of guests, and sees matching available listings |
| FR-2 | **Filter and sort** | Filter by price range, property type (entire home, private room, shared room), amenities (WiFi, kitchen, pool, parking), instant book, superhost, rating, bedrooms/beds/bathrooms |
| FR-3 | **View listing details** | Photos, description, amenities, house rules, host profile, location on map (approximate), reviews, availability calendar, pricing breakdown |
| FR-4 | **Book with date range** | Select check-in and check-out dates, confirm guest count, review pricing (nightly rate + cleaning fee + service fee + taxes), and submit booking |
| FR-5 | **Instant Book vs Request** | Some listings allow immediate booking; others require host approval within 24 hours |
| FR-6 | **Payment** | Guest is charged upon booking confirmation (full amount or split into payments) |
| FR-7 | **Messaging** | Guest can message host before and during a stay to ask questions, coordinate check-in |
| FR-8 | **Reviews** | After checkout, guest leaves a review (1-5 stars across multiple categories + written review) |
| FR-9 | **Wish lists** | Guest saves listings to named wish lists for later reference |
| FR-10 | **Booking history** | Guest views upcoming and past trips with details |

### 2.2 Core Host Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-11 | **Create listing** | Host adds property with photos, description, amenities, house rules, location, pricing |
| FR-12 | **Manage calendar** | Host sets availability per date, blocks dates for personal use, sets custom pricing per date or date range |
| FR-13 | **Pricing controls** | Base nightly rate, weekly/monthly discounts, weekend pricing, seasonal adjustments, cleaning fee |
| FR-14 | **Booking management** | Accept/decline booking requests, view upcoming reservations, cancel if necessary |
| FR-15 | **Instant Book toggle** | Host enables or disables instant booking (no approval needed) |
| FR-16 | **Review guests** | Host reviews guests after their stay (visible only after both reviews are posted) |
| FR-17 | **Payout management** | Host configures payout method, views earnings, receives payouts after guest check-in |
| FR-18 | **Co-hosting** | Host can invite co-hosts to help manage listings |

### 2.3 System Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-19 | **Search ranking** | Rank search results by relevance: location proximity, price match, listing quality score, conversion likelihood, personalization |
| FR-20 | **Availability management** | Track per-listing per-date availability, enforce minimum/maximum stay requirements |
| FR-21 | **Double-booking prevention** | Ensure no two confirmed bookings overlap on the same listing |
| FR-22 | **Dynamic pricing** | Smart Pricing suggestions based on demand, seasonality, local events, comparable listings |
| FR-23 | **Trust and safety** | Identity verification, fraud detection, content moderation for listings and reviews |
| FR-24 | **Notifications** | Push, email, SMS for booking confirmations, messages, reminders, review prompts |
| FR-25 | **Multi-currency** | Display prices in guest's local currency, charge in listing currency, convert for payouts |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Search latency** | < 500ms (p99 < 1.5s) | Users expect fast search results; Google research shows 53% abandon after 3s |
| **Availability check** | < 100ms | Must be fast during booking flow to prevent user drop-off |
| **Booking confirmation** | < 3 seconds | Includes availability lock, payment auth, confirmation |
| **Listing page load** | < 300ms (server) | Static content cacheable; dynamic (availability, price) must be fast |
| **Search ranking** | < 200ms | ML inference for ranking must complete within search latency budget |

### 3.2 Availability and Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **System availability** | 99.99% (52 min downtime/year) | Revenue-critical, global users across all time zones |
| **Booking data durability** | 99.999999999% (11 nines) | Financial records, legal contracts between host and guest |
| **Payment reliability** | Exactly-once semantics | Cannot double-charge guests or miss host payouts |
| **Search availability** | 99.95% with graceful degradation | Degrade to cached results or simpler ranking if ML service fails |

### 3.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Registered users** | 100,000,000 (100M) | Airbnb reports 150M+ users as of 2023 |
| **Active listings** | 10,000,000 (10M) | Airbnb has 7.7M+ listings globally |
| **Bookings per day** | 2,000,000 (2M) | ~800M guest arrivals/year (Airbnb 2023 data) |
| **Search QPS** | 50,000 (peak) | Multiple searches per session, many sessions concurrently |
| **Photos stored** | 500M+ images | Average 20-30 photos per listing across 10M listings |

### 3.4 Consistency

| Requirement | Model | Rationale |
|-------------|-------|-----------|
| **Booking state** | Strong consistency | A listing date must never be double-booked; requires serializable isolation |
| **Payment** | Strong consistency (ACID) | Financial transactions require exactness |
| **Availability calendar** | Strong consistency | Must reflect bookings immediately; stale data causes failed bookings |
| **Search results** | Eventual consistency (OK) | A few minutes of staleness is acceptable; new listings can appear with slight delay |
| **Reviews/ratings** | Eventual consistency (OK) | Reviews appearing seconds later is fine |
| **Listing details** | Eventual consistency (OK) | Host edits propagating within minutes is acceptable |

---

## 4. Out of Scope

For a 45-minute interview, explicitly exclude:
- Experiences (Airbnb Experiences -- activities, not stays)
- Long-term stays (30+ day leases with different legal requirements)
- Property management software integration
- Government tax reporting per jurisdiction
- Detailed fraud/identity verification pipeline
- Customer support ticketing system
- Host insurance claims processing
- Accessibility compliance details
- Mobile app offline functionality

---

## 5. Back-of-Envelope Estimation

### 5.1 User Scale

```
Registered users:          100,000,000 (100M)
Monthly active users:       30,000,000 (30M)
Active hosts:                2,000,000 (2M)
Active listings:            10,000,000 (10M)
Bookings per day:            2,000,000 (2M)
Average stay duration:       4.5 nights
```

### 5.2 Request Rate (QPS)

```
Search queries:
  Each active user searches ~3 times per session, ~2 sessions/month
  30M MAU x 6 searches/month = 180M searches/month
  180M / 30 days / 86,400 sec = ~70 QPS (average)
  Peak (10x average during travel season): ~700 QPS
  
  BUT each search triggers multiple backend calls:
  - Geo query + availability check + ranking = ~3 internal calls per search
  - Internal search QPS peak: ~2,100 QPS

Listing page views:
  Users view ~5-10 listings per search session
  700 QPS (search) x 7 (avg views per search) = ~5,000 QPS (peak)
  Mostly cacheable (photos, description, host info).
  Dynamic part: availability + pricing = ~5,000 QPS

Booking requests:
  2M bookings/day / 86,400 = ~23 QPS (average)
  Peak (5x): ~115 QPS
  This is very manageable. The hard part is NOT booking QPS --
  it is SEARCH QPS and AVAILABILITY QUERIES.

Availability queries (THE BOTTLENECK):
  Every search result (20 listings per page) needs availability check
  700 QPS search x 20 listings = 14,000 availability checks/sec (peak)
  Plus listing page views that show calendar: +5,000/sec
  Total: ~19,000 availability checks/sec at peak

  THIS is the scaling challenge for Airbnb's architecture.
  "Is listing X available from date A to date B?" across millions
  of listings, with real-time accuracy.

Messaging:
  ~10% of bookings involve pre-booking messages
  2M bookings/day x 3 messages avg x 10% = 600K messages/day
  = ~7 QPS (trivial)

Review writes:
  ~60% of stays result in a guest review
  2M bookings/day x 60% = 1.2M reviews/day
  = ~14 QPS (trivial)
```

### 5.3 Storage Estimation

```
User profiles:
  100M users x 2 KB each = 200 GB
  Includes name, email, phone, bio, verification status, preferences

Listing data:
  10M listings x 5 KB each = 50 GB
  Includes title, description, amenities, house rules, location, 
  pricing config, host_id, property type, room count, capacity

Listing photos:
  10M listings x 25 photos avg x 500 KB compressed = 125 TB
  Multiple sizes (thumbnail, medium, full) = ~200 TB total
  Stored on CDN/S3, not in database.

Availability calendar:
  10M listings x 365 days x 10 bytes per day entry = 36.5 GB
  Each entry: listing_id, date, available (bool), price, min_stay
  This is surprisingly small -- fits in memory with the right encoding.

Booking records:
  2M bookings/day x 1 KB each = 2 GB/day = ~730 GB/year
  Each booking: booking_id, guest_id, listing_id, check_in, check_out,
  num_guests, total_price, status, created_at, payment info

Reviews:
  1.2M reviews/day x 500 bytes = 600 MB/day = ~220 GB/year
  Each review: reviewer_id, listing_id, booking_id, ratings (6 categories),
  comment text, response text

Messages:
  600K messages/day x 300 bytes = 180 MB/day = ~66 GB/year

Payment records:
  2M transactions/day x 500 bytes = 1 GB/day = ~365 GB/year
```

### 5.4 Bandwidth Estimation

```
Search responses:
  700 QPS x 20 listings per result x 2 KB per listing summary = 28 MB/sec
  Including thumbnail URLs (loaded separately from CDN)

Listing page loads:
  5,000 QPS x 10 KB (listing detail JSON) = 50 MB/sec
  Photos loaded from CDN, not application servers

Photo CDN bandwidth:
  Each listing page loads ~10 photos x 200 KB = 2 MB per page view
  5,000 page views/sec x 2 MB = 10 GB/sec from CDN
  This is why CDN is critical -- application servers never serve photos.

Availability calendar reads:
  19,000 QPS x 500 bytes = 9.5 MB/sec
  Small payloads, but high QPS. In-memory caching essential.

Total application bandwidth (excluding CDN):
  Inbound:  ~10 MB/sec  (search requests, bookings, messages)
  Outbound: ~90 MB/sec  (search results, listing details, availability)
  CDN:      ~10 GB/sec  (photos dominate)
```

### 5.5 Infrastructure Estimation

```
Search servers (Elasticsearch cluster):
  10M listings indexed
  2,100 internal search QPS (peak) with complex geo + filter + ranking
  Each ES node handles ~200-500 QPS depending on query complexity
  = 5-10 Elasticsearch data nodes (with replicas: 15-30 total)

Application servers (API layer):
  ~6,000 QPS total across all endpoints (peak)
  Each server handles ~500 QPS
  = 12 servers minimum (with 3x headroom = ~36)

Availability service:
  19,000 QPS availability checks
  In-memory data (~37 GB for all calendars)
  Each instance holds a shard of listings' calendars
  = 8-12 instances (partitioned by listing_id hash)

PostgreSQL cluster:
  Moderate write load (~150 QPS for bookings, reviews, messages)
  Heavy read load offset by caching
  Primary + 2 read replicas per shard, 4-8 shards

Redis cache cluster:
  Hot listing data, session cache, rate limiting
  ~50 GB cache footprint
  = 4-6 Redis instances

CDN (CloudFront/Fastly):
  10 GB/sec photo serving
  200 TB photo storage
  Edge locations worldwide for latency
```

### 5.6 Summary Table

| Metric | Value |
|--------|-------|
| Bookings/day | 2M |
| Search QPS (peak) | 700 (external), 2,100 (internal) |
| Availability checks/sec (peak) | 19,000 |
| Listing page views/sec (peak) | 5,000 |
| Active listings | 10M |
| Photo storage | 200 TB (CDN) |
| Availability calendar data | ~37 GB (fits in memory) |
| Booking data/year | 730 GB |
| Elasticsearch nodes | 15-30 |
| Application servers | 30-40 |
| CDN bandwidth | 10 GB/sec |

---

## 6. API Design

### 6.1 Search APIs

```
GET /api/v1/search/listings
  Query Parameters:
    location=San+Francisco,CA     // or lat=37.77&lng=-122.41&radius=10km
    check_in=2026-07-01
    check_out=2026-07-05
    guests=2
    min_price=50
    max_price=300
    property_type=ENTIRE_HOME     // ENTIRE_HOME, PRIVATE_ROOM, SHARED_ROOM
    amenities=wifi,kitchen,pool   // comma-separated
    instant_book=true
    superhost=true
    min_rating=4.5
    bedrooms_min=2
    sort=RELEVANCE                // RELEVANCE, PRICE_LOW, PRICE_HIGH, RATING
    page=1
    page_size=20
    
  Response:
    {
      "total_results": 2847,
      "page": 1,
      "results": [
        {
          "listing_id": "lst_abc123",
          "title": "Cozy Victorian in Haight-Ashbury",
          "property_type": "ENTIRE_HOME",
          "location": {
            "city": "San Francisco",
            "neighborhood": "Haight-Ashbury",
            "lat": 37.7694,            // approximate, jittered for privacy
            "lng": -122.4484
          },
          "pricing": {
            "nightly_rate": 185.00,
            "total_price": 890.00,     // for the requested date range
            "currency": "USD"
          },
          "rating": { "average": 4.87, "count": 142 },
          "thumbnail_url": "https://cdn.airbnb.com/photos/lst_abc123/thumb.jpg",
          "photos_count": 24,
          "bedrooms": 2,
          "beds": 3,
          "bathrooms": 1,
          "max_guests": 4,
          "instant_book": true,
          "superhost": true,
          "is_available": true         // pre-checked for requested dates
        }
        // ... 19 more results
      ],
      "facets": {
        "price_histogram": [ ... ],
        "property_types": { "ENTIRE_HOME": 1820, "PRIVATE_ROOM": 980, ... },
        "amenity_counts": { "wifi": 2654, "kitchen": 2341, ... }
      },
      "map_bounds": {
        "ne": { "lat": 37.82, "lng": -122.35 },
        "sw": { "lat": 37.70, "lng": -122.52 }
      }
    }

POST /api/v1/search/map
  (Used when user drags the map -- search within visible viewport)
  Request:
    {
      "bounds": {
        "ne": { "lat": 37.82, "lng": -122.35 },
        "sw": { "lat": 37.70, "lng": -122.52 }
      },
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "guests": 2,
      "filters": { ... same as above ... },
      "zoom_level": 13
    }
  Response:
    {
      "clusters": [                    // at low zoom, cluster pins
        { "lat": 37.77, "lng": -122.44, "count": 45, "avg_price": 195 }
      ],
      "listings": [ ... ]             // at high zoom, individual listings
    }
```

### 6.2 Listing APIs

```
GET /api/v1/listings/{listing_id}
  Response:
    {
      "listing_id": "lst_abc123",
      "title": "Cozy Victorian in Haight-Ashbury",
      "description": "Welcome to our beautiful 1890s Victorian...",
      "property_type": "ENTIRE_HOME",
      "room_type": "ENTIRE_HOME",
      "location": {
        "address": "Haight-Ashbury, San Francisco, CA",
        "lat": 37.7694,
        "lng": -122.4484,
        "neighborhood_description": "Walk to Golden Gate Park..."
      },
      "capacity": {
        "max_guests": 4,
        "bedrooms": 2,
        "beds": 3,
        "bathrooms": 1
      },
      "amenities": ["wifi", "kitchen", "washer", "dryer", "heating", ...],
      "photos": [
        { "url": "https://cdn.airbnb.com/...", "caption": "Living room" },
        ...
      ],
      "pricing": {
        "base_nightly_rate": 185.00,
        "cleaning_fee": 75.00,
        "weekly_discount_pct": 10,
        "monthly_discount_pct": 20,
        "currency": "USD"
      },
      "house_rules": {
        "check_in_time": "15:00",
        "check_out_time": "11:00",
        "no_smoking": true,
        "no_pets": false,
        "no_parties": true,
        "max_guests": 4
      },
      "host": {
        "host_id": "usr_xyz789",
        "name": "Sarah",
        "superhost": true,
        "rating": 4.95,
        "reviews_count": 312,
        "joined_date": "2018-03-15",
        "response_rate": 98,
        "response_time": "within an hour",
        "photo_url": "https://cdn.airbnb.com/avatars/..."
      },
      "rating": {
        "average": 4.87,
        "count": 142,
        "categories": {
          "cleanliness": 4.9,
          "accuracy": 4.8,
          "check_in": 5.0,
          "communication": 4.9,
          "location": 4.7,
          "value": 4.8
        }
      },
      "reviews_preview": [ ... top 3 reviews ... ],
      "instant_book": true,
      "min_nights": 2,
      "max_nights": 30,
      "cancellation_policy": "MODERATE"
    }

GET /api/v1/listings/{listing_id}/calendar
  Query: ?start_date=2026-07-01&end_date=2026-08-31
  Response:
    {
      "listing_id": "lst_abc123",
      "calendar": [
        { "date": "2026-07-01", "available": true, "price": 185.00 },
        { "date": "2026-07-02", "available": true, "price": 185.00 },
        { "date": "2026-07-03", "available": false, "price": null },    // booked
        { "date": "2026-07-04", "available": false, "price": null },    // booked
        { "date": "2026-07-05", "available": true, "price": 220.00 },   // holiday pricing
        ...
      ],
      "min_nights": 2,
      "max_nights": 30
    }

POST /api/v1/listings  (Host creates listing)
  Request:
    {
      "host_id": "usr_xyz789",
      "title": "Cozy Victorian in Haight-Ashbury",
      "description": "...",
      "property_type": "ENTIRE_HOME",
      "location": { "address": "123 Haight St", "city": "San Francisco", ... },
      "capacity": { "max_guests": 4, "bedrooms": 2, "beds": 3, "bathrooms": 1 },
      "amenities": ["wifi", "kitchen", ...],
      "pricing": { "base_nightly_rate": 185.00, "cleaning_fee": 75.00 },
      "house_rules": { ... },
      "photos": [ ... ],              // uploaded separately via media API
      "instant_book": true,
      "min_nights": 2,
      "cancellation_policy": "MODERATE"
    }
  Response:
    { "listing_id": "lst_new456", "status": "PENDING_REVIEW" }
```

### 6.3 Booking APIs

```
POST /api/v1/bookings/price-quote
  (Called before booking to show exact price breakdown)
  Request:
    {
      "listing_id": "lst_abc123",
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "guests": 2
    }
  Response:
    {
      "listing_id": "lst_abc123",
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "nights": 4,
      "price_breakdown": {
        "nightly_rate": 185.00,
        "nightly_total": 740.00,       // 4 nights x $185
        "cleaning_fee": 75.00,
        "service_fee": 114.10,         // ~14% of subtotal
        "occupancy_tax": 109.15,       // ~12% varies by jurisdiction
        "total": 1038.25,
        "currency": "USD"
      },
      "is_available": true,
      "cancellation_policy": "MODERATE",
      "quote_expires_at": "2026-06-25T12:15:00Z"   // 10 min TTL
    }

POST /api/v1/bookings
  Request:
    {
      "guest_id": "usr_guest001",
      "listing_id": "lst_abc123",
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "guests": 2,
      "payment_method_id": "pm_xxx",
      "message_to_host": "Hi Sarah! We are excited to visit SF...",
      "price_quote_id": "pq_abc123",  // ties to the quoted price
      "idempotency_key": "book_usr_guest001_lst_abc123_20260701"
    }
  Response:
    {
      "booking_id": "bk_new789",
      "status": "CONFIRMED",           // or PENDING_HOST_APPROVAL for non-instant-book
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "total_price": 1038.25,
      "payment_status": "AUTHORIZED",
      "host_payout_date": "2026-07-02" // 24h after check-in
    }

GET /api/v1/bookings/{booking_id}
  Response:
    {
      "booking_id": "bk_new789",
      "status": "CONFIRMED",           // PENDING, CONFIRMED, CANCELLED, 
                                        // CHECKED_IN, COMPLETED, DECLINED
      "listing": { "listing_id": "lst_abc123", "title": "...", ... },
      "guest": { "guest_id": "usr_guest001", "name": "Alex" },
      "check_in": "2026-07-01",
      "check_out": "2026-07-05",
      "guests": 2,
      "pricing": { ... full breakdown ... },
      "cancellation_policy": "MODERATE",
      "cancel_by_date": "2026-06-26",  // full refund before this date
      "check_in_instructions": "...",  // revealed after booking
      "created_at": "2026-06-25T12:05:00Z"
    }

POST /api/v1/bookings/{booking_id}/cancel
  Request:
    {
      "cancelled_by": "GUEST",          // GUEST or HOST
      "reason": "CHANGE_OF_PLANS"
    }
  Response:
    {
      "booking_id": "bk_new789",
      "status": "CANCELLED",
      "refund_amount": 963.25,          // depends on cancellation policy
      "penalty_amount": 75.00
    }
```

### 6.4 Review APIs

```
POST /api/v1/reviews
  Request:
    {
      "booking_id": "bk_new789",
      "reviewer_id": "usr_guest001",
      "reviewer_type": "GUEST",
      "ratings": {
        "overall": 5,
        "cleanliness": 5,
        "accuracy": 4,
        "check_in": 5,
        "communication": 5,
        "location": 4,
        "value": 5
      },
      "comment": "Beautiful home, wonderful host! Exactly as described...",
      "private_feedback": "Minor: towels could be softer"   // only visible to host
    }
  Response:
    {
      "review_id": "rev_abc",
      "status": "SUBMITTED",
      "visible_after": "2026-07-20T00:00:00Z"   // both reviews posted or 14-day window
    }

GET /api/v1/listings/{listing_id}/reviews
  Query: ?page=1&page_size=10&sort=RECENT
  Response:
    {
      "total_reviews": 142,
      "average_rating": 4.87,
      "reviews": [ ... ]
    }
```

### 6.5 Messaging APIs

```
POST /api/v1/messages
  Request:
    {
      "sender_id": "usr_guest001",
      "thread_id": "thread_abc123",     // null for new thread
      "listing_id": "lst_abc123",       // required for new thread
      "body": "Hi Sarah, is your place close to public transit?"
    }
  Response:
    {
      "message_id": "msg_new001",
      "thread_id": "thread_abc123",
      "sent_at": "2026-06-24T10:00:00Z"
    }

GET /api/v1/messages/threads
  Query: ?user_id=usr_guest001&page=1
  Response:
    {
      "threads": [
        {
          "thread_id": "thread_abc123",
          "listing_id": "lst_abc123",
          "participants": ["usr_guest001", "usr_xyz789"],
          "last_message": { "body": "Yes! BART is 5 min walk...", "sent_at": "..." },
          "unread_count": 1
        }
      ]
    }
```

### 6.6 Host Calendar APIs

```
PUT /api/v1/listings/{listing_id}/calendar
  (Host updates availability and pricing for date ranges)
  Request:
    {
      "host_id": "usr_xyz789",
      "updates": [
        {
          "start_date": "2026-08-01",
          "end_date": "2026-08-15",
          "available": true,
          "custom_price": 220.00        // null to use base price
        },
        {
          "start_date": "2026-08-16",
          "end_date": "2026-08-20",
          "available": false,           // host blocks for personal use
          "custom_price": null
        }
      ]
    }
  Response:
    { "updated_dates": 20, "status": "ok" }
```

---

## 7. Data Model Overview

### 7.1 Core Entities

```sql
-- Users table (guests and hosts share this)
CREATE TABLE users (
    id                  UUID PRIMARY KEY,
    email               VARCHAR(255) UNIQUE NOT NULL,
    phone               VARCHAR(20),
    name                VARCHAR(100) NOT NULL,
    bio                 TEXT,
    profile_photo_url   VARCHAR(500),
    identity_verified   BOOLEAN DEFAULT FALSE,
    is_superhost        BOOLEAN DEFAULT FALSE,
    preferred_language  VARCHAR(10) DEFAULT 'en',
    preferred_currency  VARCHAR(3) DEFAULT 'USD',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Listings table (the core entity)
CREATE TABLE listings (
    id                  UUID PRIMARY KEY,
    host_id             UUID NOT NULL REFERENCES users(id),
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    property_type       VARCHAR(30) NOT NULL,    -- ENTIRE_HOME, PRIVATE_ROOM, SHARED_ROOM, HOTEL_ROOM
    latitude            DECIMAL(10,7) NOT NULL,
    longitude           DECIMAL(10,7) NOT NULL,
    city                VARCHAR(100),
    country             VARCHAR(3),              -- ISO country code
    neighborhood        VARCHAR(100),
    address             TEXT,                    -- encrypted, revealed after booking
    max_guests          SMALLINT NOT NULL,
    bedrooms            SMALLINT DEFAULT 1,
    beds                SMALLINT DEFAULT 1,
    bathrooms           DECIMAL(3,1) DEFAULT 1.0,
    base_nightly_rate   DECIMAL(10,2) NOT NULL,
    cleaning_fee        DECIMAL(10,2) DEFAULT 0,
    currency            VARCHAR(3) DEFAULT 'USD',
    weekly_discount_pct SMALLINT DEFAULT 0,
    monthly_discount_pct SMALLINT DEFAULT 0,
    min_nights          SMALLINT DEFAULT 1,
    max_nights          SMALLINT DEFAULT 365,
    instant_book        BOOLEAN DEFAULT FALSE,
    cancellation_policy VARCHAR(20) DEFAULT 'MODERATE',  -- FLEXIBLE, MODERATE, STRICT
    status              VARCHAR(20) DEFAULT 'ACTIVE',    -- DRAFT, PENDING_REVIEW, ACTIVE, DEACTIVATED
    avg_rating          DECIMAL(3,2) DEFAULT 0,
    review_count        INTEGER DEFAULT 0,
    check_in_time       TIME DEFAULT '15:00',
    check_out_time      TIME DEFAULT '11:00',
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Listing amenities (many-to-many)
CREATE TABLE listing_amenities (
    listing_id          UUID NOT NULL REFERENCES listings(id),
    amenity             VARCHAR(50) NOT NULL,    -- wifi, kitchen, pool, parking, ac, ...
    PRIMARY KEY (listing_id, amenity)
);

-- Listing photos
CREATE TABLE listing_photos (
    id                  UUID PRIMARY KEY,
    listing_id          UUID NOT NULL REFERENCES listings(id),
    url                 VARCHAR(500) NOT NULL,
    caption             VARCHAR(200),
    sort_order          SMALLINT DEFAULT 0,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Availability calendar (per listing, per date)
CREATE TABLE listing_calendar (
    listing_id          UUID NOT NULL REFERENCES listings(id),
    date                DATE NOT NULL,
    available           BOOLEAN NOT NULL DEFAULT TRUE,
    price               DECIMAL(10,2),          -- null = use base rate
    min_nights          SMALLINT,               -- null = use listing default
    booked_by           UUID REFERENCES bookings(id),   -- null if available or host-blocked
    PRIMARY KEY (listing_id, date)
);

-- Bookings table
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY,
    guest_id            UUID NOT NULL REFERENCES users(id),
    listing_id          UUID NOT NULL REFERENCES listings(id),
    host_id             UUID NOT NULL REFERENCES users(id),
    check_in            DATE NOT NULL,
    check_out           DATE NOT NULL,
    guests              SMALLINT NOT NULL,
    nightly_rate        DECIMAL(10,2) NOT NULL,
    cleaning_fee        DECIMAL(10,2) DEFAULT 0,
    service_fee         DECIMAL(10,2) DEFAULT 0,
    tax_amount          DECIMAL(10,2) DEFAULT 0,
    total_price         DECIMAL(10,2) NOT NULL,
    currency            VARCHAR(3) DEFAULT 'USD',
    status              VARCHAR(20) NOT NULL,    -- PENDING, CONFIRMED, CANCELLED, 
                                                 -- CHECKED_IN, COMPLETED, DECLINED
    cancellation_policy VARCHAR(20),
    cancelled_by        VARCHAR(10),             -- GUEST, HOST, SYSTEM
    cancellation_reason TEXT,
    message_to_host     TEXT,
    idempotency_key     VARCHAR(255) UNIQUE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id                  UUID PRIMARY KEY,
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    payer_id            UUID NOT NULL REFERENCES users(id),    -- guest
    payee_id            UUID NOT NULL REFERENCES users(id),    -- host
    amount              DECIMAL(10,2) NOT NULL,
    platform_fee        DECIMAL(10,2),
    host_payout_amount  DECIMAL(10,2),
    currency            VARCHAR(3) DEFAULT 'USD',
    status              VARCHAR(20) NOT NULL,     -- AUTHORIZED, CAPTURED, REFUNDED, FAILED
    payment_method_id   VARCHAR(100),
    payout_method_id    VARCHAR(100),
    idempotency_key     VARCHAR(255) UNIQUE,
    authorized_at       TIMESTAMP,
    captured_at         TIMESTAMP,
    payout_at           TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
    id                  UUID PRIMARY KEY,
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    reviewer_id         UUID NOT NULL REFERENCES users(id),
    reviewee_id         UUID NOT NULL REFERENCES users(id),
    listing_id          UUID NOT NULL REFERENCES listings(id),
    reviewer_type       VARCHAR(10) NOT NULL,     -- GUEST, HOST
    overall_rating      SMALLINT CHECK (overall_rating BETWEEN 1 AND 5),
    cleanliness         SMALLINT,
    accuracy            SMALLINT,
    check_in            SMALLINT,
    communication       SMALLINT,
    location            SMALLINT,
    value               SMALLINT,
    comment             TEXT,
    private_feedback    TEXT,                     -- only visible to host
    is_visible          BOOLEAN DEFAULT FALSE,    -- visible after both post or 14-day window
    created_at          TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id                  UUID PRIMARY KEY,
    thread_id           UUID NOT NULL,
    sender_id           UUID NOT NULL REFERENCES users(id),
    listing_id          UUID REFERENCES listings(id),
    booking_id          UUID REFERENCES bookings(id),
    body                TEXT NOT NULL,
    read_at             TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Indexes

```sql
-- Search and filtering
CREATE INDEX idx_listings_location ON listings USING GIST (
    ll_to_earth(latitude, longitude)
);
CREATE INDEX idx_listings_city ON listings(city, status);
CREATE INDEX idx_listings_host ON listings(host_id);
CREATE INDEX idx_listings_price ON listings(base_nightly_rate);

-- Availability queries (the critical path)
CREATE INDEX idx_calendar_available ON listing_calendar(listing_id, date)
    WHERE available = true;

-- Booking lookups
CREATE INDEX idx_bookings_guest ON bookings(guest_id, created_at DESC);
CREATE INDEX idx_bookings_listing ON bookings(listing_id, check_in, check_out);
CREATE INDEX idx_bookings_host ON bookings(host_id, created_at DESC);
CREATE UNIQUE INDEX idx_bookings_idempotency ON bookings(idempotency_key);

-- Review aggregation
CREATE INDEX idx_reviews_listing ON reviews(listing_id, created_at DESC);
CREATE INDEX idx_reviews_booking ON reviews(booking_id, reviewer_type);

-- Messaging
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at);
```

### 7.3 Elasticsearch Index (for Search)

```json
{
  "index": "listings",
  "mappings": {
    "properties": {
      "listing_id":      { "type": "keyword" },
      "title":           { "type": "text", "analyzer": "standard" },
      "description":     { "type": "text", "analyzer": "standard" },
      "location":        { "type": "geo_point" },
      "geohash":         { "type": "keyword" },
      "city":            { "type": "keyword" },
      "country":         { "type": "keyword" },
      "property_type":   { "type": "keyword" },
      "base_nightly_rate": { "type": "float" },
      "max_guests":      { "type": "integer" },
      "bedrooms":        { "type": "integer" },
      "amenities":       { "type": "keyword" },
      "instant_book":    { "type": "boolean" },
      "is_superhost":    { "type": "boolean" },
      "avg_rating":      { "type": "float" },
      "review_count":    { "type": "integer" },
      "quality_score":   { "type": "float" },
      "conversion_rate": { "type": "float" },
      "updated_at":      { "type": "date" }
    }
  }
}
```

---

## Key Interview Tip

> When presenting estimates, call out that **availability checking at scale (19K checks/sec)**
> is the dominant bottleneck, not booking writes. Searching across 10M listings with date-range
> availability, geo filters, and amenity filters -- all within 500ms -- is the hard problem.
> Bookings at ~23 QPS are trivial. The interviewer wants to see that you recognize WHERE
> the complexity is: the intersection of geospatial search and temporal availability.
