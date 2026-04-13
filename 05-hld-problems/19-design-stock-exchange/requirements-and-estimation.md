# Design a Stock Exchange / Trading Platform - Requirements & Estimation

## 1. Problem Statement

Design a stock exchange platform (think NYSE, NASDAQ, or LMAX) that allows participants
to place orders, matches buyers and sellers in real time, publishes market data, and
settles trades. The system must operate with ultra-low latency, guarantee order fairness,
and never lose a single order even under hardware failure.

> "In financial markets, microseconds translate to millions of dollars.
> A stock exchange is the canonical hard-real-time distributed system."

---

## 2. Clarifying Questions to Ask the Interviewer

| # | Question | Why It Matters |
|---|----------|---------------|
| 1 | Are we designing an institutional exchange (NYSE-like) or a retail broker (Robinhood-like)? | Latency targets differ by 1000x |
| 2 | How many symbols/instruments do we support? | Determines partitioning strategy |
| 3 | What order types are required (limit, market, stop, IOC, FOK)? | Matching engine complexity |
| 4 | Do we need to handle options/derivatives or only equities? | Affects risk engine |
| 5 | What is our SLA for matching latency? | Drives tech choices (FPGA vs software) |
| 6 | Do we need to support after-hours / pre-market trading? | Session management |
| 7 | Are we the exchange operator or a broker connecting to an exchange? | Completely different architecture |
| 8 | What regulatory jurisdiction (SEC, FCA, MiFID II)? | Audit and reporting requirements |
| 9 | Do we need a clearing/settlement layer or just matching? | Scope boundary |
| 10 | What is the expected peak order rate? | Capacity planning |

**Assumed answer**: We are designing the **exchange itself** for equities, handling ~8,000
symbols, targeting <1ms matching latency, supporting limit/market/stop/IOC/FOK orders,
with full settlement and market data publishing.

---

## 3. Functional Requirements

### 3.1 Core Trading

| # | Requirement | Description |
|---|------------|-------------|
| FR-1 | **Place Orders** | Participants submit buy/sell orders (market, limit, stop-loss, stop-limit, IOC, FOK, GTC) |
| FR-2 | **Order Book Management** | Maintain a live order book per symbol: bid side sorted descending, ask side sorted ascending |
| FR-3 | **Matching Engine** | Match incoming orders against resting orders using price-time priority (best price first, then FIFO) |
| FR-4 | **Order Lifecycle** | Support new, partial fill, full fill, cancel, cancel-replace (amend), and reject statuses |
| FR-5 | **Trade Execution** | Generate trade records when orders match, with unique trade IDs and execution prices |

### 3.2 Market Data

| # | Requirement | Description |
|---|------------|-------------|
| FR-6 | **Real-Time Price Feed** | Publish best bid/ask (Level 1) and full order book depth (Level 2) to subscribers |
| FR-7 | **Trade Tape** | Publish every executed trade (last price, quantity, timestamp) -- the "time & sales" feed |
| FR-8 | **OHLCV Candles** | Aggregate tick data into candlestick bars (1s, 1m, 5m, 1h, 1d) |

### 3.3 Risk & Compliance

| # | Requirement | Description |
|---|------------|-------------|
| FR-9 | **Pre-Trade Risk Checks** | Validate position limits, margin requirements, order-to-trade ratio, fat finger checks |
| FR-10 | **Circuit Breakers** | Halt trading on a symbol or market-wide when price moves exceed thresholds (e.g., 7% drop triggers Level 1 halt) |
| FR-11 | **Audit Trail** | Every order event, trade, and cancellation must be recorded with nanosecond timestamps for regulatory review |

### 3.4 Post-Trade

| # | Requirement | Description |
|---|------------|-------------|
| FR-12 | **Portfolio Management** | Track each participant's positions, P&L, and margin in real time |
| FR-13 | **Trade History** | Provide complete trade history per participant with filtering and export |
| FR-14 | **Settlement** | Clear and settle trades (T+1 in the US since May 2024) via a clearing house |
| FR-15 | **Corporate Actions** | Handle dividends, stock splits, and symbol changes |

---

## 4. Non-Functional Requirements

### 4.1 The Big Four for Exchanges

```
+------------------+------------------------------------------+------------------+
|   Requirement    |             Target                       |   NYSE Reference |
+------------------+------------------------------------------+------------------+
| Matching Latency | < 1 ms (p99), < 100 us (median)         | ~30-50 us        |
| Throughput       | 100,000+ orders/sec sustained            | ~1M msgs/sec     |
| Availability     | 99.999% during market hours              | 5 nines           |
| Durability       | Zero order loss, even on hardware failure| WAL + replication |
+------------------+------------------------------------------+------------------+
```

### 4.2 Detailed Non-Functional Requirements

| # | Requirement | Target | Rationale |
|---|------------|--------|-----------|
| NFR-1 | **Ultra-Low Latency** | <1ms end-to-end matching | Fairness -- slow matching advantages certain participants |
| NFR-2 | **High Throughput** | 100K orders/sec per symbol partition | Peak volumes during market open/close and volatility events |
| NFR-3 | **Strong Consistency** | Linearizable order processing | Cannot lose orders or process them out of sequence |
| NFR-4 | **Fairness (FIFO)** | Total ordering of all orders per symbol | Regulatory requirement; no participant should get unfair priority |
| NFR-5 | **Determinism** | Identical replay produces identical state | Enables audit, disaster recovery, and regulatory replay |
| NFR-6 | **Durability** | All orders persisted before acknowledgment | WAL (Write-Ahead Log) ensures crash recovery |
| NFR-7 | **Availability** | 99.999% during 6.5-hour trading day | ~2 seconds downtime per year during market hours |
| NFR-8 | **Auditability** | Nanosecond-resolution event log | MiFID II requires 1-microsecond timestamp granularity |
| NFR-9 | **Scalability** | 8,000+ symbols across partitions | Each symbol is an independent order book |
| NFR-10 | **Security** | mTLS, DMA controls, participant auth | Unauthorized access = catastrophic financial loss |

### 4.3 Latency Budget Breakdown

```
Order arrival at gateway:         0 us
  |
  +-- Network parsing + auth:    50 us
  |
  +-- Risk check:               100 us
  |
  +-- Sequencer (WAL write):    150 us
  |
  +-- Matching engine:           50 us
  |
  +-- Execution report out:      50 us
  |
Total round trip:              ~400 us target (< 1 ms budget)
```

---

## 5. Capacity Estimation

### 5.1 Assumptions

| Parameter | Value | Source |
|-----------|-------|--------|
| Trading hours | 6.5 hours/day (9:30 AM - 4:00 PM ET) | NYSE |
| Symbols | 8,000 | ~NYSE + NASDAQ combined |
| Daily orders | ~6 billion messages (orders + cancels + amends) | NYSE peak |
| Peak order rate | 1,000,000 orders/sec | Opening/closing auctions |
| Avg order rate | ~250,000 orders/sec | Spread across trading day |
| Trade rate | ~50,000 trades/sec peak | ~5-10% of orders result in trades |
| Order message size | ~200 bytes (FIX protocol) | Symbol, side, qty, price, type, metadata |
| Market data message | ~100 bytes per update | Ticker, bid, ask, last, volume |
| Participants | ~5,000 broker-dealer firms | NYSE member count |
| Concurrent connections | ~50,000 FIX sessions | Multiple sessions per firm |

### 5.2 Storage Estimation

```
Orders per day:
  6 billion messages x 200 bytes = 1.2 TB/day raw

Trades per day:
  ~500 million trades x 300 bytes = 150 GB/day

Market data per day:
  ~10 billion updates x 100 bytes = 1 TB/day

WAL (Write-Ahead Log):
  All messages sequenced: ~1.5 TB/day

Audit log retention (7 years per SEC Rule 17a-4):
  ~1.5 TB/day x 252 trading days x 7 years = ~2.6 PB

Active order book (in-memory):
  ~10 million resting orders x 200 bytes = 2 GB
  Easily fits in memory -- this is the hot path
```

### 5.3 Bandwidth Estimation

```
Inbound (orders):
  1M orders/sec x 200 bytes = 200 MB/sec = 1.6 Gbps peak

Outbound (market data):
  Market data is fan-out heavy:
  - 10M updates/sec x 100 bytes = 1 GB/sec raw
  - Multicast to 5,000 participants: handled by network multicast (not unicast)
  - WebSocket for retail: served by market data distribution layer

Execution reports:
  ~50K trades/sec x 300 bytes x 2 sides = 30 MB/sec
```

### 5.4 Compute Estimation

```
Matching Engine:
  - Single-threaded per symbol (LMAX Disruptor pattern)
  - One core can handle ~1M match operations/sec
  - 8,000 symbols partitioned across ~64 matching engine cores
  - Each core handles ~125 symbols

Gateway:
  - 50,000 FIX sessions
  - ~100 gateways, 500 sessions each
  - Standard networking hardware

Market Data:
  - Fan-out servers with multicast
  - ~20 servers for institutional feed
  - ~50 servers for WebSocket retail feed
```

---

## 6. API Design

### 6.1 Order Entry API (FIX Protocol / Binary)

Real exchanges use the **FIX protocol** (Financial Information eXchange) or proprietary
binary protocols. For interview purposes, we describe REST-like semantics, but note
that production systems use persistent TCP connections with binary framing.

#### Place Order

```
POST /api/v1/orders

Request:
{
  "client_order_id": "firm-123-00042",     // Idempotency key
  "symbol": "AAPL",
  "side": "BUY",                           // BUY | SELL
  "order_type": "LIMIT",                   // MARKET | LIMIT | STOP | STOP_LIMIT | IOC | FOK
  "quantity": 100,
  "price": 185.50,                         // Required for LIMIT, STOP_LIMIT
  "stop_price": null,                      // Required for STOP, STOP_LIMIT
  "time_in_force": "GTC",                  // DAY | GTC | IOC | FOK | GTD
  "participant_id": "FIRM-123",
  "account_id": "ACC-789"
}

Response (Execution Report):
{
  "order_id": "EX-2026-00000001",          // Exchange-assigned ID
  "client_order_id": "firm-123-00042",
  "status": "NEW",                         // NEW | PARTIALLY_FILLED | FILLED | CANCELLED | REJECTED
  "symbol": "AAPL",
  "side": "BUY",
  "order_type": "LIMIT",
  "quantity": 100,
  "filled_quantity": 0,
  "remaining_quantity": 100,
  "price": 185.50,
  "avg_fill_price": null,
  "timestamp": "2026-04-07T14:30:00.000123456Z",
  "sequence_number": 98765432                // Global sequence for determinism
}
```

#### Cancel Order

```
DELETE /api/v1/orders/{order_id}

Request:
{
  "client_order_id": "firm-123-00042",
  "participant_id": "FIRM-123",
  "reason": "USER_REQUESTED"
}

Response:
{
  "order_id": "EX-2026-00000001",
  "status": "CANCELLED",
  "cancelled_quantity": 100,
  "timestamp": "2026-04-07T14:30:01.000456789Z"
}
```

#### Amend Order (Cancel-Replace)

```
PUT /api/v1/orders/{order_id}

Request:
{
  "client_order_id": "firm-123-00043",
  "original_order_id": "EX-2026-00000001",
  "new_quantity": 200,
  "new_price": 185.25,
  "participant_id": "FIRM-123"
}
```

### 6.2 Market Data API

#### Subscribe to Real-Time Feed (WebSocket)

```
WebSocket: wss://feed.exchange.com/v1/market-data

Subscribe:
{
  "action": "subscribe",
  "channels": ["level1", "level2", "trades"],
  "symbols": ["AAPL", "GOOGL", "MSFT"]
}

Level 1 Update (Best Bid/Ask):
{
  "type": "level1",
  "symbol": "AAPL",
  "best_bid": 185.48,
  "best_bid_qty": 500,
  "best_ask": 185.50,
  "best_ask_qty": 300,
  "last_price": 185.49,
  "last_qty": 100,
  "volume": 42000000,
  "timestamp": "2026-04-07T14:30:00.000789Z"
}

Level 2 Update (Order Book Depth):
{
  "type": "level2",
  "symbol": "AAPL",
  "bids": [
    {"price": 185.48, "quantity": 500, "order_count": 12},
    {"price": 185.47, "quantity": 800, "order_count": 25},
    {"price": 185.46, "quantity": 1200, "order_count": 31}
  ],
  "asks": [
    {"price": 185.50, "quantity": 300, "order_count": 8},
    {"price": 185.51, "quantity": 600, "order_count": 15},
    {"price": 185.52, "quantity": 900, "order_count": 22}
  ],
  "timestamp": "2026-04-07T14:30:00.000789Z"
}

Trade Event:
{
  "type": "trade",
  "symbol": "AAPL",
  "trade_id": "T-2026-00000001",
  "price": 185.49,
  "quantity": 100,
  "aggressor_side": "BUY",
  "timestamp": "2026-04-07T14:30:00.000789Z"
}
```

### 6.3 Portfolio & History API

```
GET /api/v1/portfolio/{account_id}/positions
GET /api/v1/portfolio/{account_id}/balance
GET /api/v1/trades?account_id=ACC-789&symbol=AAPL&from=2026-04-01&to=2026-04-07
GET /api/v1/orders?account_id=ACC-789&status=OPEN&symbol=AAPL
```

### 6.4 Admin / Operations API

```
POST /api/v1/admin/circuit-breaker          // Trigger halt
POST /api/v1/admin/symbols/{symbol}/halt    // Halt single symbol
GET  /api/v1/admin/system/health            // System health
GET  /api/v1/admin/audit-trail?from=...     // Audit log query
```

---

## 7. Database Schema (Conceptual)

### Orders Table (Hot -- in matching engine memory; Cold -- persisted)

```sql
CREATE TABLE orders (
    order_id            BIGINT PRIMARY KEY,       -- Exchange-assigned
    client_order_id     VARCHAR(64) NOT NULL,
    participant_id      VARCHAR(32) NOT NULL,
    account_id          VARCHAR(32) NOT NULL,
    symbol              VARCHAR(16) NOT NULL,
    side                ENUM('BUY', 'SELL'),
    order_type          ENUM('MARKET','LIMIT','STOP','STOP_LIMIT'),
    time_in_force       ENUM('DAY','GTC','IOC','FOK','GTD'),
    quantity            BIGINT NOT NULL,
    filled_quantity     BIGINT DEFAULT 0,
    price               DECIMAL(18,8),
    stop_price          DECIMAL(18,8),
    status              ENUM('NEW','PARTIAL','FILLED','CANCELLED','REJECTED'),
    sequence_number     BIGINT NOT NULL,          -- Global sequence
    created_at          TIMESTAMP(9) NOT NULL,    -- Nanosecond precision
    updated_at          TIMESTAMP(9) NOT NULL,
    INDEX idx_symbol_status (symbol, status),
    INDEX idx_participant (participant_id, created_at)
);
```

### Trades Table

```sql
CREATE TABLE trades (
    trade_id            BIGINT PRIMARY KEY,
    symbol              VARCHAR(16) NOT NULL,
    buy_order_id        BIGINT NOT NULL,
    sell_order_id       BIGINT NOT NULL,
    buyer_participant   VARCHAR(32) NOT NULL,
    seller_participant  VARCHAR(32) NOT NULL,
    price               DECIMAL(18,8) NOT NULL,
    quantity            BIGINT NOT NULL,
    aggressor_side      ENUM('BUY', 'SELL'),
    sequence_number     BIGINT NOT NULL,
    executed_at         TIMESTAMP(9) NOT NULL,
    settlement_date     DATE NOT NULL,            -- T+1
    settlement_status   ENUM('PENDING','CLEARING','SETTLED','FAILED'),
    INDEX idx_symbol_time (symbol, executed_at),
    INDEX idx_settlement (settlement_date, settlement_status)
);
```

---

## 8. Summary of Scope

```
+----------------------------------------------------------+
|                    IN SCOPE                                |
|  - Order entry (limit, market, stop, IOC, FOK, GTC)      |
|  - Order book management (bid/ask sides)                  |
|  - Matching engine (price-time priority)                  |
|  - Real-time market data (L1, L2, trades)                 |
|  - Pre-trade risk checks                                  |
|  - Portfolio and position management                      |
|  - Trade history and audit trail                          |
|  - Settlement (T+1 clearing)                              |
|  - Circuit breakers                                       |
+----------------------------------------------------------+
|                   OUT OF SCOPE                             |
|  - Options/derivatives trading                            |
|  - Dark pools / alternative trading systems               |
|  - Market making algorithms                               |
|  - Regulatory reporting (just audit trail)                |
|  - FIX protocol implementation details                    |
|  - FPGA/hardware acceleration                             |
+----------------------------------------------------------+
```
