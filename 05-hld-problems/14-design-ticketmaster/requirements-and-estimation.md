# Design Ticketmaster / Event Booking System -- Requirements and Estimation

## Table of Contents
- [1.1 Problem Statement](#11-problem-statement)
- [1.2 Functional Requirements](#12-functional-requirements)
- [1.3 Non-Functional Requirements](#13-non-functional-requirements)
- [1.4 Out of Scope](#14-out-of-scope)
- [1.5 Back-of-Envelope Estimation](#15-back-of-envelope-estimation)
- [1.6 API Design](#16-api-design)
- [1.7 Data Model](#17-data-model)
- [1.8 Error Handling Contract](#18-error-handling-contract)

---

## 1.1 Problem Statement

Design a large-scale event ticketing platform that allows users to browse events, view
interactive seat maps, select specific seats, and complete bookings with payment processing.
The system must handle extreme concurrency during flash sales where millions of users
compete for a limited number of seats in the opening seconds of a sale.

**Why this is a top-tier interview question:**
- It is the **canonical concurrency problem** -- two users clicking the same seat at the same
  millisecond is the defining challenge
- It requires reasoning about distributed locking, exactly-once semantics, and overselling
  prevention
- It tests queue theory and traffic shaping (virtual waiting rooms, token buckets)
- It combines real-time inventory management with payment processing reliability
- It exposes the tension between user experience (fast response) and correctness (no double-booking)

**Real-world context:**
Ticketmaster processes over 500 million tickets per year. During the 2022 Taylor Swift
Eras Tour on-sale, 14 million users hit the site simultaneously, crashing the virtual
waiting room and causing a national controversy. BookMyShow in India handles 10M+ users
during IPL cricket ticket sales. The Glastonbury Festival sells 135,000 tickets in under
30 minutes. These scenarios represent some of the highest concurrency spikes in all of
software engineering -- far exceeding typical e-commerce, because inventory is tiny (thousands
of seats) relative to demand (millions of users).

**What makes this different from designing a generic e-commerce system?**
An event booking system differs from standard e-commerce in four critical ways:
1. **Fixed, non-fungible inventory** -- each seat is unique with a specific row, section, and
   view; you cannot "restock" a concert
2. **Extreme time pressure** -- demand is concentrated into seconds/minutes, not spread over days
3. **Emotional stakes** -- users experience rage and frustration when they lose a seat they were
   "about to buy," making UX around fairness crucial
4. **Seat adjacency constraints** -- groups need consecutive seats, creating a 2D packing problem
   on top of the concurrency problem

---

## 1.2 Functional Requirements

| # | Requirement | Description | Example |
|---|-------------|-------------|---------|
| FR-1 | **Browse events** | Search and discover events by artist, venue, city, date, genre. | Search "Taylor Swift concerts in NYC" |
| FR-2 | **View venue seat map** | Display an interactive map showing seat locations, sections, rows, and real-time availability (available/locked/sold). | See Madison Square Garden layout with Section 101, Row A, Seat 1-20 |
| FR-3 | **Select seats** | Choose one or more specific seats (or request "best available" for N seats). | Select Row C, Seats 5-8 in Section 202 |
| FR-4 | **Temporary seat hold** | Lock selected seats for a limited time (5-10 min) while the user completes checkout. Other users see these seats as unavailable. | Seats held for 7 minutes with a countdown timer |
| FR-5 | **Book and pay** | Process payment and confirm the booking atomically. Seats transition from "held" to "sold." | Pay $400 via credit card, receive confirmation #TM-2026-XYZ |
| FR-6 | **Release expired holds** | Automatically release seats back to inventory when the hold timer expires without payment. | User abandons checkout, seats become available again after 7 min |
| FR-7 | **Order confirmation** | Generate booking confirmation with e-tickets (QR codes / barcodes). | Email with PDF ticket + QR code for venue entry |
| FR-8 | **Flash sale queue** | For high-demand events, place users in a virtual waiting room with a queue position before allowing seat selection. | "You are #45,231 in line. Estimated wait: 8 minutes." |

### Detailed Requirement Breakdown

#### FR-1: Browse Events
The discovery layer must support:
- **Full-text search** across event names, artist/performer names, venue names
- **Geo-based filtering**: events near a city or within a radius
- **Faceted filters**: date range, genre, price range, availability status
- **Sorting**: by date, popularity, price, relevance
- **Pagination**: efficient cursor-based pagination for large result sets

The read path for browsing is extremely high volume but tolerates eventual consistency -- a
newly listed event appearing 30 seconds late is acceptable.

#### FR-2: View Venue Seat Map
The seat map is the most interactive part of the system:
- **Pre-built venue layouts** with sections, rows, and individual seats modeled as data
- **Real-time color coding**: green (available), yellow (held by another user), red (sold)
- **Zoom and pan** for large venues (50,000+ seats)
- **Price overlays**: color-coded pricing tiers per section
- **Accessibility markers**: wheelchair-accessible seats, companion seats

Critical: the seat map must reflect availability within a few seconds of changes. A user
should not click a seat that was sold 10 seconds ago without seeing it as unavailable.

#### FR-3: Select Seats
Two selection modes:
1. **Manual pick**: user clicks individual seats on the map
2. **Best available**: user requests N seats together, system finds the best consecutive seats
   in the best available section (heuristic: closest to stage, center, lowest row number)

The "best available" algorithm must handle the adjacency constraint -- a group of 4 cannot
be split across rows or aisles. This is a constrained search problem.

#### FR-4: Temporary Seat Hold (The Core Concurrency Problem)
When a user selects a seat:
1. The system must **atomically** check availability and lock the seat
2. If two users click the same seat within the same millisecond, exactly one must win
3. The lock has a **TTL** (time-to-live) of 5-10 minutes
4. The user sees a **countdown timer** in the checkout flow
5. If the timer expires, the lock is released and the seat becomes available again

This is the single most important requirement and the one interviewers will drill into.

#### FR-5: Book and Pay
The payment flow must be:
1. **Validate** that the hold is still active (not expired)
2. **Process payment** via payment gateway (Stripe, Adyen, etc.)
3. **Confirm booking** -- transition seats from "held" to "sold" atomically
4. **Handle payment failures** -- if payment fails, release the hold immediately so other
   users do not wait for the full TTL

Payment processing introduces a two-phase problem: external payment gateway latency
(2-10 seconds) during which the hold must remain valid.

#### FR-8: Flash Sale Queue (Virtual Waiting Room)
For events with expected demand exceeding capacity by 100x+:
- Users are placed in a queue **before** seeing the seat map
- Queue position is assigned randomly or by arrival time (randomized is fairer against bots)
- Users are admitted in **batches** (e.g., 500 at a time) as capacity opens
- Admitted users get a **time-limited token** to access the booking flow
- If an admitted user does not complete a booking in N minutes, their token expires and the
  next user in queue is admitted

---

## 1.3 Non-Functional Requirements

| # | Requirement | Target | Rationale |
|---|-------------|--------|-----------|
| NFR-1 | **Availability** | 99.99% (52 min downtime/year) | Event on-sales are time-sensitive; downtime means lost revenue and public backlash |
| NFR-2 | **Seat lock latency** | < 100ms p99 | Users expect instant feedback when clicking a seat |
| NFR-3 | **Consistency** | Strong consistency for inventory | Cannot oversell -- two users must never successfully book the same seat |
| NFR-4 | **Flash sale throughput** | 10M+ requests/min during peak | Eras Tour scale: 14M concurrent users |
| NFR-5 | **Hold release accuracy** | Seats released within 5 seconds of TTL expiry | Stale holds block legitimate buyers |
| NFR-6 | **Payment processing** | < 5 seconds end-to-end | Long checkout = abandoned carts |
| NFR-7 | **Search latency** | < 200ms p95 | Fast event discovery |
| NFR-8 | **Seat map freshness** | < 3 seconds staleness | Users need near-real-time availability |
| NFR-9 | **Fairness** | Queue-based ordering for flash sales | Prevent bots and scalpers from monopolizing inventory |
| NFR-10 | **Idempotency** | Exactly-once booking semantics | Network retries must not create duplicate bookings |

### The Consistency vs. Availability Tension

This system is a rare case where **consistency trumps availability** for the booking path.
Overselling a seat (two people show up with tickets for the same seat) is a business-critical
failure that generates lawsuits and brand damage. However, the browse/search path can be
eventually consistent.

```
Consistency Spectrum in Our System:

  Browse Events         Seat Map           Seat Lock          Booking
  ─────────────────────────────────────────────────────────────────────►
  Eventually             Near-real-time     Strongly           Strongly
  Consistent             (2-3 sec lag)      Consistent         Consistent +
  (30 sec lag OK)                           (linearizable)     Exactly-Once

  ◄── Higher Availability ──────────────────── Higher Consistency ──►
```

---

## 1.4 Out of Scope

| Feature | Reason |
|---------|--------|
| Ticket resale / secondary market | Separate system (StubHub model) |
| Event creation / organizer dashboard | Admin tooling, separate product |
| Venue management and layout editor | Done offline by venue operators |
| Social features (friend activity, shared carts) | Nice-to-have, not core |
| Ticket transfer / gifting | Post-purchase feature |
| Dynamic pricing (surge pricing) | Discussed briefly in deep dive, not core flow |
| Refund processing | Post-purchase operations |
| Physical ticket printing / will-call | Delivery mechanism detail |

---

## 1.5 Back-of-Envelope Estimation

### User and Traffic Scale

```
Users and Events:
  Total registered users:                     100,000,000 (100M)
  Daily active users (DAU):                    10,000,000 (10M)
  Events listed per day:                            10,000
  Average seats per event:                           5,000
  Total seats per day:                          50,000,000 (50M)
  Average booking completion rate:                     15%  (most browse, few buy)
  Bookings per day:                              1,500,000 (1.5M)

Traffic Patterns (Normal):
  Browse/search requests per day:             200,000,000 (200M)
  Seat map views per day:                      50,000,000 (50M)
  Seat lock attempts per day:                  10,000,000 (10M)
  Successful bookings per day:                  1,500,000 (1.5M)

  Average QPS (browse):                             2,300 req/sec
  Average QPS (seat map):                             580 req/sec
  Average QPS (seat lock):                            115 req/sec
  Average QPS (booking):                               17 req/sec
```

### Flash Sale Peak Estimation (The Hard Part)

```
Flash Sale Scenario: Major Artist, 1 Stadium, 80,000 Seats
  Users attempting to buy:                     10,000,000 (10M)
  Requests in first minute:                    10,000,000
  Peak QPS:                                       ~167,000 req/sec
  Seats available:                                  80,000
  Competition ratio:                              125 users per seat

  Breakdown of requests in first 60 seconds:
    Queue entry / waiting room:            10,000,000 requests
    Seat map loads (admitted users):           500,000 requests
    Seat lock attempts:                        200,000 requests
    Payment processing:                         80,000 requests (optimistic)

  Peak seat lock QPS:                           3,333 lock/sec
  Required lock throughput:                    ~5,000 lock/sec (with retries)

  If each lock check is a Redis SETNX:
    Redis single-node: ~100K ops/sec → single node handles this easily
    But we need: sharding by event_id + seat_id for isolation
```

### Storage Estimation

```
Event Data:
  Per event record:                                  2 KB (metadata, description, images refs)
  Events per year:                              3,650,000 (10K/day)
  Event storage per year:                          ~7 GB

Venue and Seat Data:
  Unique venues:                                   50,000
  Average seats per venue:                          5,000
  Seat record size:                                200 bytes (section, row, seat#, coords, type)
  Total venue/seat data:                          ~50 GB

Booking Data:
  Per booking record:                                1 KB
  Bookings per year:                          547,500,000 (1.5M/day)
  Booking storage per year:                      ~500 GB

Ticket Data (with QR codes):
  Per ticket:                                        5 KB (includes QR payload)
  Tickets per year:                         2,000,000,000 (avg 3.5 tickets per booking)
  Ticket storage per year:                        ~10 TB

Total Storage (annual):
  Hot data (active events + recent bookings):     ~100 GB
  Cold data (historical):                          ~11 TB
  Growth rate:                                    ~11 TB/year
```

### Bandwidth Estimation

```
Seat Map Rendering:
  Seat map payload (full venue, 50K seats):        200 KB (compressed JSON)
  Incremental availability updates (delta):          5 KB per push
  Seat map requests during flash sale:          500,000 in 60 sec
  Peak bandwidth for seat maps:                 ~1.6 GB/sec

  Strategy: CDN for static venue layout, WebSocket for availability deltas
  CDN-cached layout:                               200 KB (one-time load)
  WebSocket delta updates:                           5 KB every 2 seconds
  Effective bandwidth per user:                    2.5 KB/sec

Normal Operations:
  Average request size:                              2 KB
  Average response size:                            10 KB
  Daily bandwidth (in):                            ~4 TB
  Daily bandwidth (out):                          ~20 TB
```

### Infrastructure Estimation

```
Application Servers:
  Normal: 50 servers (auto-scaled)
  Flash sale peak: 500 servers (pre-scaled 30 min before on-sale)
  Instance type: c6i.2xlarge (8 vCPU, 16 GB RAM)

Redis Cluster (Seat Locks):
  Nodes: 6 (3 primary + 3 replica)
  Memory per node: 64 GB
  Total: 384 GB (mostly for active event inventory + locks)

Database (PostgreSQL):
  Primary: r6g.4xlarge (16 vCPU, 128 GB RAM)
  Read replicas: 5 (for browse/search queries)
  Storage: 20 TB (with yearly archival)

Queue System (Virtual Waiting Room):
  Kafka or SQS for queue management
  Peak: 167K messages/sec during flash sale
  Nodes: 6 Kafka brokers

Search (Elasticsearch):
  Nodes: 6 (3 data + 3 coordinator)
  Index size: ~50 GB (active events)

CDN:
  Venue map assets: ~500 GB
  Cache hit rate: 95%+
  Providers: CloudFront / Akamai with edge workers
```

---

## 1.6 API Design

### Event Discovery APIs

```
# Search events
GET /api/v1/events/search
  ?query=Taylor+Swift
  &city=New+York
  &date_from=2026-06-01
  &date_to=2026-08-31
  &genre=music
  &price_min=50
  &price_max=500
  &sort=date_asc
  &cursor=eyJsYXN0X2lkIjoiZXZ0XzEyMyJ9
  &limit=20

Response 200:
{
  "events": [
    {
      "event_id": "evt_2026_ts_msg",
      "name": "Taylor Swift | The Eras Tour",
      "artist": "Taylor Swift",
      "venue": {
        "venue_id": "ven_msg",
        "name": "Madison Square Garden",
        "city": "New York, NY",
        "capacity": 20,789
      },
      "date": "2026-07-15T20:00:00Z",
      "on_sale_date": "2026-05-01T10:00:00Z",
      "status": "ON_SALE",
      "price_range": {"min": 75, "max": 450, "currency": "USD"},
      "availability": "LIMITED",        // AVAILABLE | LIMITED | SOLD_OUT
      "image_url": "https://cdn.example.com/events/evt_2026_ts_msg.jpg"
    }
  ],
  "cursor": "eyJsYXN0X2lkIjoiZXZ0XzQ1NiJ9",
  "total_count": 3
}
```

### Seat Map APIs

```
# Get venue seat map layout (cacheable, rarely changes)
GET /api/v1/events/{event_id}/seatmap

Response 200:
{
  "event_id": "evt_2026_ts_msg",
  "venue_id": "ven_msg",
  "sections": [
    {
      "section_id": "sec_101",
      "name": "Section 101 - Floor",
      "tier": "PREMIUM",
      "price": 450.00,
      "rows": [
        {
          "row_id": "row_A",
          "row_label": "A",
          "seats": [
            {"seat_id": "sec101_A_1", "number": 1, "x": 120.5, "y": 45.2, "type": "STANDARD"},
            {"seat_id": "sec101_A_2", "number": 2, "x": 122.3, "y": 45.2, "type": "STANDARD"},
            {"seat_id": "sec101_A_3", "number": 3, "x": 124.1, "y": 45.2, "type": "ACCESSIBLE"}
          ]
        }
      ]
    }
  ],
  "svg_layout_url": "https://cdn.example.com/venues/ven_msg/layout.svg"
}


# Get real-time seat availability (polled or pushed via WebSocket)
GET /api/v1/events/{event_id}/availability

Response 200:
{
  "event_id": "evt_2026_ts_msg",
  "timestamp": "2026-05-01T10:02:34Z",
  "summary": {
    "total_seats": 20789,
    "available": 12450,
    "held": 3200,
    "sold": 5139
  },
  "sections": [
    {
      "section_id": "sec_101",
      "available": 12,
      "held": 5,
      "sold": 3
    }
  ],
  "seats": {
    "sec101_A_1": "AVAILABLE",
    "sec101_A_2": "HELD",
    "sec101_A_3": "SOLD"
    // ... per-seat status for the requested section
  }
}


# WebSocket for real-time availability deltas
WS /api/v1/events/{event_id}/availability/stream

Server pushes:
{
  "type": "SEAT_STATUS_CHANGE",
  "changes": [
    {"seat_id": "sec101_A_1", "old_status": "AVAILABLE", "new_status": "HELD"},
    {"seat_id": "sec101_A_5", "old_status": "HELD", "new_status": "AVAILABLE"}
  ],
  "timestamp": "2026-05-01T10:02:35.123Z"
}
```

### Booking Flow APIs

```
# Step 1: Select and hold seats (THE critical API)
POST /api/v1/events/{event_id}/holds
Headers:
  Authorization: Bearer <token>
  Idempotency-Key: "hold_usr123_evt456_20260501T100234"

Request:
{
  "seats": ["sec101_A_1", "sec101_A_2", "sec101_A_3", "sec101_A_4"],
  "hold_duration_seconds": 420     // 7 minutes
}

Response 201 (Success -- all seats held):
{
  "hold_id": "hold_abc123",
  "event_id": "evt_2026_ts_msg",
  "user_id": "usr_123",
  "seats": [
    {"seat_id": "sec101_A_1", "section": "101", "row": "A", "seat": 1, "price": 450.00},
    {"seat_id": "sec101_A_2", "section": "101", "row": "A", "seat": 2, "price": 450.00},
    {"seat_id": "sec101_A_3", "section": "101", "row": "A", "seat": 3, "price": 450.00},
    {"seat_id": "sec101_A_4", "section": "101", "row": "A", "seat": 4, "price": 450.00}
  ],
  "total_price": 1800.00,
  "currency": "USD",
  "expires_at": "2026-05-01T10:09:34Z",
  "status": "HELD"
}

Response 409 (Conflict -- one or more seats already held/sold):
{
  "error": "SEATS_UNAVAILABLE",
  "message": "One or more requested seats are no longer available",
  "unavailable_seats": ["sec101_A_3"],
  "available_alternatives": ["sec101_A_5", "sec101_A_6"]
}


# Step 2: Create booking (confirm hold + process payment)
POST /api/v1/bookings
Headers:
  Authorization: Bearer <token>
  Idempotency-Key: "book_hold_abc123_20260501T100300"

Request:
{
  "hold_id": "hold_abc123",
  "payment_method": {
    "type": "CARD",
    "token": "pm_stripe_tok_visa_4242"
  }
}

Response 201 (Booking confirmed):
{
  "booking_id": "bk_2026_xyz789",
  "hold_id": "hold_abc123",
  "event_id": "evt_2026_ts_msg",
  "status": "CONFIRMED",
  "seats": [
    {"seat_id": "sec101_A_1", "section": "101", "row": "A", "seat": 1, "price": 450.00},
    {"seat_id": "sec101_A_2", "section": "101", "row": "A", "seat": 2, "price": 450.00},
    {"seat_id": "sec101_A_3", "section": "101", "row": "A", "seat": 3, "price": 450.00},
    {"seat_id": "sec101_A_4", "section": "101", "row": "A", "seat": 4, "price": 450.00}
  ],
  "total_charged": 1800.00,
  "currency": "USD",
  "payment_id": "pay_stripe_pi_abc",
  "tickets": [
    {"ticket_id": "tkt_001", "seat_id": "sec101_A_1", "qr_code_url": "https://cdn.example.com/tickets/tkt_001.png"},
    {"ticket_id": "tkt_002", "seat_id": "sec101_A_2", "qr_code_url": "https://cdn.example.com/tickets/tkt_002.png"},
    {"ticket_id": "tkt_003", "seat_id": "sec101_A_3", "qr_code_url": "https://cdn.example.com/tickets/tkt_003.png"},
    {"ticket_id": "tkt_004", "seat_id": "sec101_A_4", "qr_code_url": "https://cdn.example.com/tickets/tkt_004.png"}
  ],
  "confirmation_email_sent": true
}

Response 410 (Hold expired):
{
  "error": "HOLD_EXPIRED",
  "message": "Your seat hold has expired. Please select seats again.",
  "expired_at": "2026-05-01T10:09:34Z"
}

Response 402 (Payment failed):
{
  "error": "PAYMENT_FAILED",
  "message": "Payment was declined. Your seats are still held for 3 more minutes.",
  "hold_expires_at": "2026-05-01T10:09:34Z",
  "retry_allowed": true
}


# Release a hold (user cancels)
DELETE /api/v1/events/{event_id}/holds/{hold_id}
Headers:
  Authorization: Bearer <token>

Response 200:
{
  "hold_id": "hold_abc123",
  "status": "RELEASED",
  "seats_released": ["sec101_A_1", "sec101_A_2", "sec101_A_3", "sec101_A_4"],
  "message": "Seats released successfully"
}
```

### Flash Sale Queue APIs

```
# Join the virtual waiting room
POST /api/v1/events/{event_id}/queue/join
Headers:
  Authorization: Bearer <token>

Response 202:
{
  "queue_token": "qt_xyz789",
  "position": 45231,
  "total_in_queue": 2340000,
  "estimated_wait_seconds": 480,
  "status": "WAITING",
  "event_id": "evt_2026_ts_msg"
}


# Poll queue status (or receive via WebSocket)
GET /api/v1/events/{event_id}/queue/status?queue_token=qt_xyz789

Response 200 (Still waiting):
{
  "queue_token": "qt_xyz789",
  "position": 12045,
  "status": "WAITING",
  "estimated_wait_seconds": 180
}

Response 200 (Admitted):
{
  "queue_token": "qt_xyz789",
  "position": 0,
  "status": "ADMITTED",
  "access_token": "at_booking_abc",
  "access_expires_at": "2026-05-01T10:20:00Z",
  "message": "You may now select seats. You have 10 minutes."
}

Response 200 (Event sold out while waiting):
{
  "queue_token": "qt_xyz789",
  "status": "EVENT_SOLD_OUT",
  "message": "Sorry, all seats have been sold."
}
```

---

## 1.7 Data Model

### Core Entities

```
┌─────────────────────────────────────────────────────────┐
│                      DATA MODEL                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐       ┌──────────────┐                 │
│  │   Venue      │       │    Event      │                │
│  │─────────────│       │──────────────│                 │
│  │ venue_id PK │◄──────│ venue_id  FK │                 │
│  │ name        │       │ event_id  PK │                 │
│  │ city        │       │ name         │                 │
│  │ state       │       │ artist       │                 │
│  │ country     │       │ date         │                 │
│  │ capacity    │       │ on_sale_date │                 │
│  │ layout_svg  │       │ status       │                 │
│  └──────┬──────┘       └──────┬───────┘                 │
│         │                     │                         │
│         │ 1:N                 │ 1:N                     │
│         ▼                     ▼                         │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │ Venue_Seat   │     │ Event_Seat_Price │              │
│  │──────────────│     │──────────────────│              │
│  │ seat_id   PK │◄────│ seat_id    FK    │              │
│  │ venue_id  FK │     │ event_id   FK    │              │
│  │ section_id   │     │ price            │              │
│  │ row_label    │     │ tier             │              │
│  │ seat_number  │     │ status           │──► AVAILABLE │
│  │ seat_type    │     │ hold_id    FK    │    HELD      │
│  │ x_coord      │     │ held_until       │    SOLD      │
│  │ y_coord      │     │ booking_id FK    │              │
│  │ is_accessible│     │ version (OCC)    │              │
│  └──────────────┘     └──────────────────┘              │
│                                                         │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │    Hold       │     │    Booking       │              │
│  │──────────────│     │──────────────────│              │
│  │ hold_id   PK │     │ booking_id  PK   │              │
│  │ user_id   FK │     │ user_id     FK   │              │
│  │ event_id  FK │     │ event_id    FK   │              │
│  │ seats[]      │     │ hold_id     FK   │              │
│  │ created_at   │     │ seats[]          │              │
│  │ expires_at   │     │ total_price      │              │
│  │ status       │──►  │ payment_id       │              │
│  │  ACTIVE      │     │ status           │──► CONFIRMED │
│  │  EXPIRED     │     │  PENDING         │    CANCELLED │
│  │  CONVERTED   │     │  CONFIRMED       │              │
│  │  CANCELLED   │     │  FAILED          │              │
│  └──────────────┘     │ idempotency_key  │              │
│                       │ created_at       │              │
│                       └──────────────────┘              │
│                                                         │
│  ┌──────────────┐     ┌──────────────────┐              │
│  │   Ticket      │     │  Queue_Entry     │              │
│  │──────────────│     │──────────────────│              │
│  │ ticket_id PK │     │ queue_id    PK   │              │
│  │ booking_id FK│     │ event_id    FK   │              │
│  │ seat_id   FK │     │ user_id     FK   │              │
│  │ qr_code      │     │ position         │              │
│  │ status       │     │ status           │              │
│  │ scanned_at   │     │ joined_at        │              │
│  └──────────────┘     │ admitted_at      │              │
│                       │ access_token     │              │
│                       │ token_expires_at │              │
│                       └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### Key Schema Details

```sql
-- The critical table: Event Seat with optimistic locking
CREATE TABLE event_seat (
    event_id       UUID NOT NULL REFERENCES event(event_id),
    seat_id        UUID NOT NULL REFERENCES venue_seat(seat_id),
    status         VARCHAR(10) NOT NULL DEFAULT 'AVAILABLE'
                   CHECK (status IN ('AVAILABLE', 'HELD', 'SOLD')),
    hold_id        UUID REFERENCES hold(hold_id),
    held_until     TIMESTAMP,
    booking_id     UUID REFERENCES booking(booking_id),
    price          DECIMAL(10,2) NOT NULL,
    tier           VARCHAR(20),
    version        INTEGER NOT NULL DEFAULT 0,    -- optimistic concurrency control
    PRIMARY KEY (event_id, seat_id),

    -- CRITICAL CONSTRAINT: prevents double-booking at the DB level
    CONSTRAINT unique_sold_booking
      EXCLUDE USING gist (seat_id WITH =, event_id WITH =)
      WHERE (status = 'SOLD')
);

-- Index for fast availability lookups per event
CREATE INDEX idx_event_seat_status ON event_seat(event_id, status);

-- Index for finding expired holds (cleanup job)
CREATE INDEX idx_event_seat_held_until ON event_seat(held_until)
    WHERE status = 'HELD' AND held_until IS NOT NULL;

-- Booking table with idempotency
CREATE TABLE booking (
    booking_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    event_id        UUID NOT NULL REFERENCES event(event_id),
    hold_id         UUID NOT NULL REFERENCES hold(hold_id),
    total_price     DECIMAL(10,2) NOT NULL,
    payment_id      VARCHAR(100),
    status          VARCHAR(15) NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## 1.8 Error Handling Contract

| HTTP Status | Error Code | Condition | Client Action |
|-------------|------------|-----------|---------------|
| 409 | `SEATS_UNAVAILABLE` | One or more selected seats are already held or sold | Show alternatives, ask user to pick different seats |
| 410 | `HOLD_EXPIRED` | Hold TTL expired before payment completed | Redirect back to seat selection |
| 402 | `PAYMENT_FAILED` | Payment gateway declined the charge | Allow retry with different payment method (hold still active) |
| 429 | `RATE_LIMITED` | Too many requests from this user/IP | Show "please wait" with Retry-After header |
| 503 | `QUEUE_FULL` | Virtual waiting room at capacity | Show "event is extremely popular, try again later" |
| 409 | `DUPLICATE_HOLD` | User already has an active hold for this event | Show existing hold, allow user to modify or cancel |
| 400 | `INVALID_SEAT_COMBINATION` | Seats requested are not adjacent (for group bookings) | Suggest valid adjacent combinations |
| 403 | `QUEUE_TOKEN_REQUIRED` | Flash sale event requires queue admission | Redirect to waiting room |
| 403 | `QUEUE_TOKEN_EXPIRED` | User's queue access token has expired | Re-enter queue or show sold-out message |

### Retry and Idempotency Strategy

```
Idempotency Key Strategy:

  Hold creation:   "hold_{user_id}_{event_id}_{timestamp_ms}"
  Booking creation: "book_{hold_id}_{timestamp_ms}"

  The server stores idempotency keys for 24 hours.
  If a duplicate key is received:
    - Return the original response (same status, same body)
    - Do NOT create a second hold or charge the user twice

  This protects against:
    - Network timeouts causing client retries
    - Double-clicks on the "Pay Now" button
    - Mobile app backgrounding and re-sending requests

  Implementation:
    1. Check idempotency_key in Redis (fast path)
    2. If found, return cached response
    3. If not found, proceed with operation
    4. Store result with idempotency_key in Redis (TTL: 24h)
    5. Also store in PostgreSQL booking table (permanent record)
```
