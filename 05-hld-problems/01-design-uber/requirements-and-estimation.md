# Design Uber / Ride-Sharing Service: Requirements and Estimation

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

Design a ride-sharing platform (like Uber) that connects riders who need transportation
with drivers who have vehicles. The system must handle real-time location tracking,
intelligent matching, dynamic pricing, payments, and ratings -- all at massive scale
with millions of concurrent users.

**Why this problem is the #1 Uber interview question:**
- It tests real-time systems (location streaming at 1M+ updates/sec)
- It tests geospatial indexing (finding nearest drivers)
- It tests distributed system design (matching, pricing, payments)
- It tests state machine design (ride lifecycle)
- It tests scale reasoning (back-of-envelope math is critical)

---

## 2. Functional Requirements

### 2.1 Core Rider Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-1 | **Request a ride** | Rider enters pickup and dropoff locations, selects ride type (UberX, UberXL, Black), sees fare estimate, and confirms request |
| FR-2 | **Real-time tracking** | Rider sees driver's live location on a map during pickup and ride |
| FR-3 | **Fare estimation** | Before requesting, rider sees an estimated fare range based on distance, time, and current surge |
| FR-4 | **Ride history** | Rider can view past rides with details (route, fare, driver, rating) |
| FR-5 | **Rating and feedback** | After ride completion, rider rates driver (1-5 stars) and optionally leaves comments |
| FR-6 | **Payment** | Rider is charged automatically upon ride completion via stored payment method |
| FR-7 | **Ride cancellation** | Rider can cancel a ride (may incur cancellation fee after driver is en route) |

### 2.2 Core Driver Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-8 | **Go online/offline** | Driver toggles availability status |
| FR-9 | **Accept/reject ride** | Driver receives ride request with pickup info, can accept or let it timeout |
| FR-10 | **Navigation** | Driver gets turn-by-turn navigation to pickup and dropoff |
| FR-11 | **Location broadcasting** | Driver's app continuously sends GPS coordinates while online |
| FR-12 | **Earnings tracking** | Driver sees earnings per ride and daily/weekly summaries |
| FR-13 | **Ride status updates** | Driver marks "arrived at pickup", "started ride", "completed ride" |

### 2.3 System Features

| # | Requirement | Description |
|---|-------------|-------------|
| FR-14 | **Matching** | System matches rider with optimal nearby driver based on distance, ETA, rating |
| FR-15 | **Surge pricing** | Dynamic pricing multiplier based on supply-demand ratio in each area |
| FR-16 | **Fare calculation** | Final fare = base fare + (per-mile rate x distance) + (per-minute rate x time) + booking fee, multiplied by surge |
| FR-17 | **Payment processing** | Charge rider, take platform commission, pay driver |
| FR-18 | **Notifications** | Push notifications for ride matched, driver arriving, ride started, ride completed, payment receipt |
| FR-19 | **ETA calculation** | Accurate estimated time of arrival using road network and real-time traffic |

---

## 3. Non-Functional Requirements

### 3.1 Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Matching latency** | < 1 second (p99 < 3s) | Riders expect near-instant driver assignment |
| **Location update ingestion** | 1.25M updates/sec | 5M online drivers, each sending GPS every 4 seconds |
| **Fare calculation** | < 200ms | Must be fast for fare estimates before ride request |
| **ETA calculation** | < 500ms | Real-time display on rider and driver apps |
| **Notification delivery** | < 2 seconds | Ride status changes must reach users promptly |

### 3.2 Availability and Reliability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **System availability** | 99.99% (52 min downtime/year) | Revenue-critical, people depend on rides |
| **Ride data durability** | 99.999999% | Financial records, legal compliance |
| **Payment reliability** | Exactly-once semantics | Cannot double-charge or miss charges |
| **Matching availability** | 99.99% with graceful degradation | Fallback to simpler matching if advanced features fail |

### 3.3 Scalability

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **Concurrent riders** | 100M registered, 2M+ concurrent | Global platform across hundreds of cities |
| **Concurrent drivers** | 5M+ online simultaneously | Peak hours across all time zones |
| **Rides per day** | 20M rides/day | ~14,000 rides starting every minute |
| **Location history** | Petabytes/year | Every GPS ping from every driver, retained for analytics |

### 3.4 Consistency

| Requirement | Model | Rationale |
|-------------|-------|-----------|
| **Ride state** | Strong consistency | A ride must never be assigned to two drivers |
| **Payment** | Strong consistency (ACID) | Financial transactions require exactness |
| **Driver location** | Eventual consistency (OK) | A few seconds of staleness is acceptable for nearby search |
| **Surge pricing** | Eventual consistency (OK) | Updated every 1-2 minutes, slight lag is acceptable |

---

## 4. Out of Scope

For a 45-minute interview, explicitly exclude:
- UberEats / food delivery
- Ride pooling (UberPool) -- mention as extension
- Driver onboarding and background checks
- Detailed fraud detection
- Admin dashboard
- Multi-stop rides
- Scheduled rides (mention as extension)
- International payment and currency handling

---

## 5. Back-of-Envelope Estimation

### 5.1 User Scale

```
Registered riders:     100,000,000 (100M)
Registered drivers:     10,000,000 (10M)
Online drivers (peak):   5,000,000 (5M)
Concurrent riders:       2,000,000 (2M)
Rides per day:          20,000,000 (20M)
```

### 5.2 Request Rate (QPS)

```
Ride requests:
  20M rides/day / 86,400 sec/day = ~230 QPS (average)
  Peak (5x average):              = ~1,150 QPS
  This is very manageable for any modern system.

Location updates (THE BOTTLENECK):
  5M online drivers x 1 update every 4 seconds
  = 5,000,000 / 4
  = 1,250,000 updates/sec (1.25M QPS)
  
  THIS is the hardest scaling challenge in the entire system.
  Compare: Twitter gets ~300K tweets/day. Uber's location service
  handles 1.25M writes per SECOND.

Ride status updates:
  20M rides/day x ~6 status changes per ride = 120M/day
  = 120M / 86,400 = ~1,400 QPS

ETA requests:
  Each active ride polls ETA every 10-30 seconds
  ~1M active rides x 1 request/15s = ~67K QPS

Fare estimates:
  Many users check fares without requesting (3:1 ratio)
  ~1,150 x 3 = ~3,450 QPS (peak)
```

### 5.3 Storage Estimation

```
User profiles (riders + drivers):
  110M users x 1 KB each = 110 GB
  Fits in a single PostgreSQL instance (but shard for availability)

Ride records:
  20M rides/day x 2 KB each = 40 GB/day = ~15 TB/year
  Each ride: rider_id, driver_id, pickup/dropoff coords, 
  timestamps, fare, distance, duration, status, surge, rating

Location history:
  1.25M updates/sec x 100 bytes each = 125 MB/sec
  = 125 MB/s x 86,400 s/day = ~10.8 TB/day
  = ~3.9 PB/year (before compression)
  With compression (~5x): ~780 TB/year
  Retain 30 days hot, archive cold: ~324 TB hot

Payment records:
  20M transactions/day x 500 bytes = 10 GB/day = ~3.6 TB/year

Driver location cache (real-time):
  5M drivers x 100 bytes (id + lat/lng + timestamp + status)
  = 500 MB in Redis (easily fits in memory)
```

### 5.4 Bandwidth Estimation

```
Location updates (inbound):
  1.25M updates/sec x 100 bytes = 125 MB/sec inbound
  = 1 Gbps sustained (just for location updates)

Location tracking (outbound to riders):
  1M active rides x driver location push every 2 seconds
  = 500K pushes/sec x 100 bytes = 50 MB/sec

Ride request/response:
  1,150 QPS x 2 KB avg = 2.3 MB/sec (negligible)

Map tiles and navigation:
  This is offloaded to map providers (Google Maps, Mapbox)

Total network bandwidth estimate:
  Inbound:  ~150 MB/sec (~1.2 Gbps)
  Outbound: ~75 MB/sec  (~600 Mbps)
```

### 5.5 Infrastructure Estimation

```
WebSocket servers (for driver connections):
  5M concurrent connections
  Each server handles ~50K connections
  = 100 WebSocket servers minimum (with 2x headroom = 200)

Location service (processing 1.25M updates/sec):
  Each instance processes ~25K updates/sec
  = 50 instances minimum (with headroom = ~100)

Redis cluster (geospatial index):
  500 MB data, 1.25M writes/sec + reads for matching
  Redis benchmarks: ~100K ops/sec per instance
  = ~15-20 Redis instances (sharded by city/region)

Kafka cluster (event streaming):
  125 MB/sec inbound throughput
  = 5-10 Kafka brokers with replication factor 3

PostgreSQL (rides, users):
  Moderate write load (~2K QPS), heavy reads
  Primary-replica setup, sharded by city for rides
```

### 5.6 Summary Table

| Metric | Value |
|--------|-------|
| Rides/day | 20M |
| Location updates/sec | 1.25M |
| Ride request QPS (peak) | 1,150 |
| Hot location data | ~500 MB (Redis) |
| Location history/day | 10.8 TB |
| Ride data/year | 15 TB |
| WebSocket servers | 100-200 |
| Redis instances | 15-20 |
| Kafka brokers | 5-10 |

---

## 6. API Design

### 6.1 Rider APIs

```
POST /api/v1/rides/estimate
  Request:
    {
      "rider_id": "uuid",
      "pickup": { "lat": 37.7749, "lng": -122.4194 },
      "dropoff": { "lat": 37.3382, "lng": -121.8863 },
      "ride_type": "UBER_X"          // UBER_X, UBER_XL, UBER_BLACK
    }
  Response:
    {
      "estimated_fare": { "min": 24.50, "max": 32.00, "currency": "USD" },
      "surge_multiplier": 1.5,
      "estimated_duration_sec": 2400,
      "estimated_distance_miles": 42.3,
      "eta_to_pickup_sec": 300
    }

POST /api/v1/rides/request
  Request:
    {
      "rider_id": "uuid",
      "pickup": { "lat": 37.7749, "lng": -122.4194 },
      "dropoff": { "lat": 37.3382, "lng": -121.8863 },
      "ride_type": "UBER_X",
      "payment_method_id": "pm_xxx",
      "surge_confirmation_id": "surge_abc123"  // if surge > 2x
    }
  Response:
    {
      "ride_id": "uuid",
      "status": "REQUESTED",
      "estimated_fare": { "min": 24.50, "max": 32.00 },
      "surge_multiplier": 1.5
    }

GET /api/v1/rides/{ride_id}/status
  Response:
    {
      "ride_id": "uuid",
      "status": "IN_PROGRESS",       // REQUESTED, MATCHED, DRIVER_EN_ROUTE, 
                                      // ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED
      "driver": {
        "id": "uuid", "name": "John", "rating": 4.92,
        "vehicle": { "make": "Toyota", "model": "Camry", "plate": "ABC123" },
        "location": { "lat": 37.7750, "lng": -122.4180 }
      },
      "eta_sec": 180,
      "fare_estimate": { "min": 24.50, "max": 32.00 }
    }

POST /api/v1/rides/{ride_id}/cancel
  Request:
    { "rider_id": "uuid", "reason": "CHANGED_PLANS" }
  Response:
    {
      "ride_id": "uuid",
      "status": "CANCELLED",
      "cancellation_fee": 5.00       // null if no fee applies
    }

POST /api/v1/rides/{ride_id}/rate
  Request:
    {
      "rider_id": "uuid",
      "rating": 5,                   // 1-5
      "comment": "Great driver!",
      "tip_amount": 3.00
    }
```

### 6.2 Driver APIs

```
PUT /api/v1/drivers/{driver_id}/status
  Request:
    { "status": "ONLINE" }           // ONLINE, OFFLINE
  Response:
    { "driver_id": "uuid", "status": "ONLINE" }

POST /api/v1/drivers/{driver_id}/location
  (Usually sent via WebSocket, HTTP fallback)
  Request:
    {
      "driver_id": "uuid",
      "lat": 37.7749,
      "lng": -122.4194,
      "heading": 270,                // degrees from north
      "speed": 35.5,                 // mph
      "accuracy": 5.0,               // meters
      "timestamp": 1680000000000
    }
  Response:
    { "status": "ok" }

POST /api/v1/rides/{ride_id}/accept
  Request:
    { "driver_id": "uuid" }
  Response:
    {
      "ride_id": "uuid",
      "status": "MATCHED",
      "rider": { "name": "Alice", "rating": 4.85 },
      "pickup": { "lat": 37.7749, "lng": -122.4194, "address": "123 Main St" },
      "dropoff": { "lat": 37.3382, "lng": -121.8863, "address": "456 Oak Ave" }
    }

PUT /api/v1/rides/{ride_id}/status
  (Driver status transitions: ARRIVED, IN_PROGRESS, COMPLETED)
  Request:
    {
      "driver_id": "uuid",
      "status": "IN_PROGRESS",
      "location": { "lat": 37.7749, "lng": -122.4194 },
      "timestamp": 1680000000000
    }
```

### 6.3 Internal/System APIs

```
POST /internal/v1/matching/find-driver
  (Called by Ride Service when new ride is requested)
  Request:
    {
      "ride_id": "uuid",
      "pickup": { "lat": 37.7749, "lng": -122.4194 },
      "ride_type": "UBER_X",
      "max_radius_km": 5
    }
  Response:
    {
      "matched_driver_id": "uuid",
      "eta_sec": 240,
      "distance_km": 2.1
    }

GET /internal/v1/pricing/surge?lat=37.77&lng=-122.41
  Response:
    {
      "h3_cell": "872830828ffffff",
      "surge_multiplier": 1.5,
      "supply": 45,
      "demand": 78,
      "updated_at": "2025-01-15T10:30:00Z"
    }

POST /internal/v1/payments/charge
  Request:
    {
      "ride_id": "uuid",
      "rider_id": "uuid",
      "amount": 28.50,
      "currency": "USD",
      "payment_method_id": "pm_xxx",
      "idempotency_key": "ride_uuid_charge"
    }
```

### 6.4 WebSocket Events

```
Driver → Server (persistent WebSocket):
  { "type": "LOCATION_UPDATE", "lat": 37.77, "lng": -122.41, 
    "heading": 270, "speed": 35.5, "ts": 1680000000000 }

Server → Driver:
  { "type": "RIDE_REQUEST", "ride_id": "uuid", 
    "pickup": {...}, "eta_sec": 180, "surge": 1.5, 
    "timeout_sec": 15 }

Server → Rider (via push notification or WebSocket):
  { "type": "DRIVER_ASSIGNED", "driver": {...}, "eta_sec": 240 }
  { "type": "DRIVER_LOCATION", "lat": 37.775, "lng": -122.418 }
  { "type": "DRIVER_ARRIVED" }
  { "type": "RIDE_STARTED" }
  { "type": "RIDE_COMPLETED", "fare": 28.50 }
```

---

## 7. Data Model Overview

### 7.1 Core Entities

```sql
-- Users table (shared by riders and drivers)
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    user_type       ENUM('RIDER', 'DRIVER', 'BOTH'),
    rating          DECIMAL(3,2) DEFAULT 5.00,
    total_ratings   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Driver-specific details
CREATE TABLE driver_profiles (
    driver_id       UUID PRIMARY KEY REFERENCES users(id),
    license_number  VARCHAR(50),
    vehicle_make    VARCHAR(50),
    vehicle_model   VARCHAR(50),
    vehicle_year    INTEGER,
    vehicle_color   VARCHAR(30),
    license_plate   VARCHAR(20),
    vehicle_type    ENUM('UBER_X', 'UBER_XL', 'UBER_BLACK'),
    status          ENUM('OFFLINE', 'ONLINE', 'ON_RIDE'),
    current_city    VARCHAR(50),
    approved        BOOLEAN DEFAULT FALSE
);

-- Rides table (the central entity)
CREATE TABLE rides (
    id              UUID PRIMARY KEY,
    rider_id        UUID NOT NULL REFERENCES users(id),
    driver_id       UUID REFERENCES users(id),
    ride_type       ENUM('UBER_X', 'UBER_XL', 'UBER_BLACK'),
    status          ENUM('REQUESTED', 'MATCHED', 'DRIVER_EN_ROUTE', 
                         'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 
                         'CANCELLED'),
    pickup_lat      DECIMAL(10,7),
    pickup_lng      DECIMAL(10,7),
    pickup_address  VARCHAR(500),
    dropoff_lat     DECIMAL(10,7),
    dropoff_lng     DECIMAL(10,7),
    dropoff_address VARCHAR(500),
    estimated_fare_min  DECIMAL(10,2),
    estimated_fare_max  DECIMAL(10,2),
    actual_fare     DECIMAL(10,2),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.00,
    distance_miles  DECIMAL(10,2),
    duration_sec    INTEGER,
    requested_at    TIMESTAMP,
    matched_at      TIMESTAMP,
    pickup_at       TIMESTAMP,
    started_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    cancelled_at    TIMESTAMP,
    cancellation_reason VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id              UUID PRIMARY KEY,
    ride_id         UUID NOT NULL REFERENCES rides(id),
    rider_id        UUID NOT NULL REFERENCES users(id),
    driver_id       UUID NOT NULL REFERENCES users(id),
    amount          DECIMAL(10,2) NOT NULL,
    platform_fee    DECIMAL(10,2),
    driver_payout   DECIMAL(10,2),
    currency        VARCHAR(3) DEFAULT 'USD',
    status          ENUM('PENDING', 'CHARGED', 'FAILED', 'REFUNDED'),
    payment_method_id VARCHAR(100),
    idempotency_key VARCHAR(255) UNIQUE,
    charged_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Ratings table
CREATE TABLE ratings (
    id              UUID PRIMARY KEY,
    ride_id         UUID NOT NULL REFERENCES rides(id),
    rater_id        UUID NOT NULL REFERENCES users(id),
    rated_id        UUID NOT NULL REFERENCES users(id),
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    tip_amount      DECIMAL(10,2) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Redis Data Structures (Real-Time)

```
-- Driver locations (Redis GEO sorted set, one per city)
GEOADD drivers:sf <lng> <lat> <driver_id>
GEORADIUS drivers:sf <lng> <lat> 5 km COUNT 20 ASC

-- Driver availability (Redis SET, one per city)
SADD available_drivers:sf <driver_id>
SREM available_drivers:sf <driver_id>

-- Surge cache (Redis HASH)
HSET surge:sf <h3_cell_id> <multiplier>
HGET surge:sf <h3_cell_id>

-- Active rides (Redis HASH for fast lookup)
HSET ride:<ride_id> status "IN_PROGRESS" driver_id "uuid" ...
```

### 7.3 Cassandra Schema (Location History)

```sql
-- Location history (time-series, high write throughput)
CREATE TABLE location_history (
    driver_id   UUID,
    date        DATE,           -- partition key part (daily buckets)
    timestamp   TIMESTAMP,      -- clustering key
    lat         DOUBLE,
    lng         DOUBLE,
    heading     SMALLINT,
    speed       FLOAT,
    accuracy    FLOAT,
    h3_cell     TEXT,
    PRIMARY KEY ((driver_id, date), timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC)
  AND default_time_to_live = 2592000;  -- 30 day TTL
```

---

## Key Interview Tip

> When presenting estimates, always call out the **location update rate (1.25M/sec)**
> as the dominant scaling challenge. Ride requests at ~1K QPS are trivial by comparison.
> The interviewer wants to see that you recognize WHERE the scale challenge is and
> design specifically for it.
