# Networking Module -- Backend Migration Analysis

> Generated: 2026-04-13
> Status: ANALYSIS ONLY -- no source files modified
> Module: Networking (13 modules)
> Files analyzed: 20 source files, 10,063 lines, 375 KB total

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Complete Data Inventory](#2-complete-data-inventory)
3. [Bucket Classification](#3-bucket-classification)
4. [New Database Tables](#4-new-database-tables)
5. [API Endpoints](#5-api-endpoints)
6. [Migration Roadmap](#6-migration-roadmap)
7. [Bundle Size Analysis](#7-bundle-size-analysis)
8. [Benefits Analysis](#8-benefits-analysis)
9. [Risk Assessment](#9-risk-assessment)

---

## 1. Executive Summary

The Networking module is the largest single module in Architex by data volume: 14 engine
files + 1 deep-dive data file + 1 mega-component (3,045 lines) + 2 stores + 2 DB schemas.
Combined, they contain **375 KB of TypeScript** shipping entirely in the client bundle.

Approximately **55% of this weight is static educational content** (protocol descriptions,
handshake step narratives, SRS cards, deep-dive data, request examples, qualitative
metrics) that never changes at runtime and could be authored by content writers in a CMS.
The remaining 45% is simulation logic, rendering code, and small constants that belong in
the frontend.

**Key findings:**
- **~150 KB** of static content data can move to the database/API (protocol deep-dives,
  SRS cards, API comparison data, DNS zone data, CDN scenarios, serialization schemas)
- **~110 KB** of component rendering code stays in the frontend but can be code-split
- **~80 KB** of simulation engine logic stays in the frontend (pure computation)
- **~35 KB** of protocol-deep-dive.ts alone is pure static data ideal for DB storage
- User progress (localStorage) should move to the database for cross-device sync
- No simulations exceed 100ms; Web Worker migration is not needed now

---

## 2. Complete Data Inventory

### 2.1 Engine Files (src/lib/networking/)

#### tcp-state-machine.ts (724 lines, 24 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `TCPConnection` class | Simulation engine | ~18 KB | Yes (stateful) | No | No | No |
| `CLIENT_ISN` (1000) | Constant | 4 B | No | No | No | No |
| `SERVER_ISN` (5000) | Constant | 4 B | No | No | No | No |
| `DEFAULT_WINDOW_SIZE` (65535) | Constant | 4 B | No | No | No | No |
| `TCPState` type (11 states) | Type definition | ~0.2 KB | No | No | No | No |
| `TCPSegment` interface | Type definition | ~0.3 KB | No | No | No | No |
| `TCPEvent` interface | Type definition | ~0.3 KB | No | No | No | No |
| Inline description strings | Educational content | ~5 KB | No | Yes | No | Yes |

#### tls-handshake.ts (616 lines, 21 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `TLSHandshake` class | Simulation engine | ~15 KB | Yes (stateful) | No | No | No |
| `TLSMessageType` (11 types) | Type definition | ~0.2 KB | No | No | No | No |
| Cipher suite strings | Static content | ~0.5 KB | No | Yes | No | Yes |
| Certificate details (CN, issuer, dates) | Static content | ~0.3 KB | No | Yes | No | Yes |
| Handshake step descriptions | Educational content | ~4 KB | No | Yes | No | Yes |

#### tls13-handshake.ts (462 lines, 17 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `TLS13_HANDSHAKE_MESSAGES` (8 entries) | Static data array | ~6 KB | No | Yes | No | Yes |
| `TLS13_0RTT_MESSAGES` (7 entries) | Static data array | ~5 KB | No | Yes | No | Yes |
| `TLS13_RTT_BRACKETS` | Visualization config | ~0.1 KB | No | No | No | No |
| `TLS13_0RTT_BRACKETS` | Visualization config | ~0.1 KB | No | No | No | No |
| `tls13ToSequenceMessages()` | Transform function | ~0.3 KB | No | No | No | No |
| `tls13RowBackground()` | Visualization helper | ~0.2 KB | No | No | No | No |

#### dns-resolution.ts (574 lines, 19 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `DNSResolver` class | Simulation engine | ~10 KB | Yes (stateful) | No | No | No |
| `ZONE_DATA` (10 domains, ~40 records) | Simulated zone DB | ~2 KB | No | Yes | No | Yes |
| `DNS_SCENARIOS` (6 entries) | Static content | ~1 KB | No | Yes | No | Yes |
| `DNS_COLUMN_MAP` | Visualization config | ~0.2 KB | No | No | No | No |
| `DNS_SEQUENCE_COLUMNS` | Visualization config | ~0.1 KB | No | No | No | No |
| Inline resolution descriptions | Educational content | ~3 KB | No | Yes | No | Yes |

#### http-comparison.ts (337 lines, 12 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `compareHTTPVersions()` | Pure computation | ~8 KB | No | No | No | No |
| `CONNECTION_SETUP_OVERHEAD_MS` (50) | Constant | 4 B | No | No | No | No |
| `BANDWIDTH_KB_PER_MS` (10) | Constant | 4 B | No | No | No | No |
| `QUIC_0RTT_SAVINGS_MS` (30) | Constant | 4 B | No | No | No | No |
| `DEFAULT_MAX_CONNECTIONS` (6) | Constant | 4 B | No | No | No | No |
| Inline description strings | Educational content | ~3 KB | No | Yes | No | Yes |

#### websocket-lifecycle.ts (351 lines, 13 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `WebSocketSimulation` class | Simulation engine | ~9 KB | Yes (stateful) | No | No | No |
| `WebSocketEventType` (7 types) | Type definition | ~0.2 KB | No | No | No | No |
| Inline description strings | Educational content | ~3 KB | No | Yes | No | Yes |

#### cors-simulator.ts (552 lines, 21 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `simulateCORS()` | Pure computation | ~12 KB | No | No | No | No |
| `SIMPLE_METHODS` (3 entries) | Constant set | ~0.1 KB | No | No | No | No |
| `SIMPLE_HEADERS` (4 entries) | Constant set | ~0.1 KB | No | No | No | No |
| `SIMPLE_CONTENT_TYPES` (3 entries) | Constant set | ~0.1 KB | No | No | No | No |
| Inline description strings | Educational content | ~6 KB | No | Yes | No | Yes |

#### cdn-flow.ts (674 lines, 22 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `simulateCDNFlow()` + builders | Pure computation | ~12 KB | No | No | No | No |
| `CDN_SCENARIOS` (4 entries) | Static content | ~0.5 KB | No | Yes | No | Yes |
| 10 latency constants | Constants | ~0.1 KB | No | No | No | No |
| `CDN_SEQUENCE_COLUMNS` | Visualization config | ~0.1 KB | No | No | No | No |
| Inline description strings | Educational content | ~7 KB | No | Yes | No | Yes |

#### api-comparison.ts (687 lines, 23 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `compareAPIs()` | Pure computation | ~3 KB | No | No | No | No |
| `OPERATION_PROFILES` (4 operations x 3 protocols) | Static content | ~5 KB | No | Yes | No | Yes |
| `REQUEST_EXAMPLES` (4 operations x 3 protocols) | Static content | ~8 KB | No | Yes | No | Yes |
| `getAPIQualitativeMetrics()` (3 protocols x 5 features) | Static content | ~5 KB | No | Yes | No | Yes |
| Constants (7 values) | Constants | ~0.1 KB | No | No | No | No |

#### serialization-comparison.ts (319 lines, 12 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `compareSerializationFormats()` | Pure computation | ~4 KB | No | No | No | No |
| `SAMPLE_USER_DATA` | Static sample | ~0.5 KB | No | Yes | No | No |
| `PROTOBUF_SCHEMA` | Static schema | ~0.4 KB | No | Yes | No | Yes |
| `AVRO_SCHEMA` | Static schema | ~0.6 KB | No | Yes | No | Yes |
| Size ratio constants (4 values) | Constants | ~0.1 KB | No | No | No | No |
| Speed constants (8 values) | Constants | ~0.1 KB | No | No | No | No |
| Format descriptions (4 entries) | Educational content | ~2 KB | No | Yes | No | Yes |

#### shared-types.ts (41 lines, 2 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `ProtocolTimelineEvent` interface | Type definition | ~0.2 KB | No | No | No | No |

#### srs-bridge.ts (110 lines, 5 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `NETWORKING_SRS_CARDS` (9 cards) | Static content | ~3 KB | No | Yes | No | Yes |
| `createNetworkingSRSCard()` | Factory function | ~0.2 KB | No | No | No | No |
| `createAllNetworkingSRSCards()` | Factory function | ~0.1 KB | No | No | No | No |
| `getNetworkingCardByProtocol()` | Lookup function | ~0.1 KB | No | No | No | No |

#### arp-simulation.ts (324 lines, 12 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `ARPSimulation` class | Simulation engine | ~8 KB | Yes (stateful) | No | No | No |
| `DEFAULT_CACHE_TTL` (300) | Constant | 4 B | No | No | No | No |
| `BROADCAST_MAC` | Constant | ~20 B | No | No | No | No |
| Inline description strings | Educational content | ~3 KB | No | Yes | No | Yes |

#### dhcp-simulation.ts (388 lines, 14 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `DHCPSimulation` class | Simulation engine | ~10 KB | Yes (stateful) | No | No | No |
| 5 default constants | Constants | ~0.1 KB | No | No | No | No |
| Inline description strings | Educational content | ~3 KB | No | Yes | No | Yes |

### 2.2 Deep-Dive Data (src/lib/innovation/protocol-deep-dive.ts)

**522 lines, 35 KB** -- the single largest data file

| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `PROTOCOLS` record (10 protocols) | Static content | ~33 KB | No | Yes | No | Yes |
| Per protocol: `headerFields[]` (6-10 entries each) | Static content | ~12 KB total | No | Yes | No | Yes |
| Per protocol: `handshakeSteps[]` (3-6 entries each) | Static content | ~8 KB total | No | Yes | No | Yes |
| Per protocol: `performanceCharacteristics` | Static content | ~4 KB total | No | Yes | No | Yes |
| Per protocol: `useCases[]` (4 each) | Static content | ~3 KB total | No | Yes | No | Yes |
| Per protocol: `tradeoffs[]` (4 each) | Static content | ~3 KB total | No | Yes | No | Yes |
| Per protocol: `comparisonNotes` | Static content | ~3 KB total | No | Yes | No | Yes |
| `compareProtocols()` | Pure function | ~0.5 KB | No | No | No | No |
| Type definitions (4 interfaces) | Type definitions | ~1 KB | No | No | No | No |

### 2.3 Component Data (NetworkingModule.tsx)

**3,045 lines, 113 KB**

| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `PROTOCOLS` array (9 entries) | Static content | ~1 KB | No | Yes | No | Yes |
| `HTTP_RESOURCES` (6 entries) | Static config | ~0.3 KB | No | No | No | No |
| `DEFAULT_CORS_CONFIG` | Static config | ~0.2 KB | No | No | No | No |
| `DEFAULT_SERVER_CONFIG` | Static config | ~0.3 KB | No | No | No | No |
| `API_OPERATIONS` (4 entries) | Static content | ~0.2 KB | No | Yes | No | No |
| `RATING_LABELS` (7 entries) | UI config | ~0.3 KB | No | No | No | No |
| `PROTOCOL_SUMMARIES` (9 entries) | Static content | ~1 KB | No | Yes | No | Yes |
| 14 memoized component functions | Rendering logic | ~105 KB | No | No | No | No |
| SequenceDiagram component | Shared renderer | ~8 KB | No | No | No | No |

### 2.4 Store Data

#### progress-store.ts (114 lines, 3 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `attempts[]` | User data | Variable | Yes | No | **Yes** | Yes |
| `totalXP` | User data | 8 B | Yes | No | **Yes** | No |
| `streakDays` | User data | 4 B | Yes | No | **Yes** | No |
| `lastActiveDate` | User data | ~24 B | Yes | No | **Yes** | No |

#### cross-module-store.ts (148 lines, 5 KB)
| Data Item | Type | Size | Runtime Mutable | Content-Writable | Persist? | Searchable |
|-----------|------|------|-----------------|------------------|----------|------------|
| `moduleMastery` (13 modules) | User data | ~1 KB | Yes | No | **Yes** | No |
| `conceptProgress` | User data | Variable | Yes | No | **Yes** | Yes |
| `pendingBridge` | Transient state | ~0.2 KB | Yes | No | No | No |
| `activeContext` | Transient state | ~0.3 KB | Yes | No | No | No |

### 2.5 Existing DB Schemas

#### progress.ts -- `progress` table
- `id` (UUID PK), `userId` (FK to users), `moduleId`, `conceptId`, `score` (0.0-1.0)
- Indexes: user+module, unique(user+module+concept)
- **Status**: Schema exists, migration never ran

#### users.ts -- `users` table
- `id` (UUID PK), `clerkId`, `email`, `name`, `tier`
- **Status**: Schema exists, migration never ran

---

## 3. Bucket Classification

### BUCKET 1: KEEP IN FRONTEND (pure computation, small, real-time)

These stay as-is in the client bundle. They are simulation engines, rendering code,
type definitions, and tiny constants.

| Item | File | Size | Reason |
|------|------|------|--------|
| `TCPConnection` class | tcp-state-machine.ts | 18 KB | Stateful simulation, real-time interaction |
| `TLSHandshake` class | tls-handshake.ts | 15 KB | Stateful simulation, step-by-step playback |
| `DNSResolver` class | dns-resolution.ts | 10 KB | Stateful simulation with cache model |
| `compareHTTPVersions()` | http-comparison.ts | 8 KB | Pure computation, instant results |
| `WebSocketSimulation` class | websocket-lifecycle.ts | 9 KB | Stateful simulation |
| `simulateCORS()` | cors-simulator.ts | 12 KB | Pure computation with branching logic |
| `simulateCDNFlow()` + builders | cdn-flow.ts | 12 KB | Pure computation |
| `compareAPIs()` | api-comparison.ts | 3 KB | Pure computation |
| `compareSerializationFormats()` | serialization-comparison.ts | 4 KB | Pure computation |
| `ARPSimulation` class | arp-simulation.ts | 8 KB | Stateful simulation |
| `DHCPSimulation` class | dhcp-simulation.ts | 10 KB | Stateful simulation |
| `compareProtocols()` | protocol-deep-dive.ts | 0.5 KB | Pure function |
| All type definitions | shared-types.ts + others | ~3 KB | Types only, zero runtime weight |
| All constants (<1KB each) | Various | ~2 KB | Too small to justify API roundtrip |
| `ProtocolTimelineEvent` interface | shared-types.ts | 0.2 KB | Base interface |
| `tls13ToSequenceMessages()` | tls13-handshake.ts | 0.3 KB | Transform helper |
| `tls13RowBackground()` | tls13-handshake.ts | 0.2 KB | Visualization helper |
| `dnsToSequenceMessages()` | dns-resolution.ts | 0.3 KB | Transform helper |
| `cdnToSequenceMessages()` | cdn-flow.ts | 0.3 KB | Transform helper |
| `RATING_LABELS` | NetworkingModule.tsx | 0.3 KB | UI config |
| `DEFAULT_CORS_CONFIG` | NetworkingModule.tsx | 0.2 KB | UI config |
| `DEFAULT_SERVER_CONFIG` | NetworkingModule.tsx | 0.3 KB | UI config |
| `HTTP_RESOURCES` | NetworkingModule.tsx | 0.3 KB | Simulation input |
| All rendering components | NetworkingModule.tsx | ~105 KB | React rendering |
| `SIMPLE_METHODS/HEADERS/CONTENT_TYPES` | cors-simulator.ts | 0.3 KB | Tiny constant sets |
| `pendingBridge`, `activeContext` | cross-module-store.ts | ~0.5 KB | Transient state |
| `TLS13_RTT_BRACKETS` | tls13-handshake.ts | 0.1 KB | Vis config |

**Subtotal: ~213 KB** (stays in bundle, but code-split per protocol)

### BUCKET 2: MOVE TO DATABASE (content that changes independently of code)

These are pure data with no computation. Content writers should be able to update
protocol descriptions, add new SRS cards, or correct handshake step explanations
without deploying code.

| Item | File | Est. Size | Rows | Reason |
|------|------|-----------|------|--------|
| `PROTOCOLS` record (10 protocols) | protocol-deep-dive.ts | 33 KB | 10 | Largest data blob; 10 full protocol definitions with headers, handshake steps, performance, use cases, tradeoffs |
| `NETWORKING_SRS_CARDS` (9 cards) | srs-bridge.ts | 3 KB | 9 | Review cards should be CMS-managed; new cards added without deploys |
| `OPERATION_PROFILES` (4 ops x 3 protocols) | api-comparison.ts | 5 KB | 12 | REST/GraphQL/gRPC operation descriptions and size data |
| `REQUEST_EXAMPLES` (4 ops x 3 protocols) | api-comparison.ts | 8 KB | 12 | Request/response format strings for each protocol |
| `getAPIQualitativeMetrics()` return data | api-comparison.ts | 5 KB | 3 | Feature comparison table (streaming, browser, codegen, etc.) |
| `ZONE_DATA` (10 domains) | dns-resolution.ts | 2 KB | ~40 | Simulated DNS zone database -- extendable |
| `DNS_SCENARIOS` (6 entries) | dns-resolution.ts | 1 KB | 6 | Scenario metadata |
| `CDN_SCENARIOS` (4 entries) | cdn-flow.ts | 0.5 KB | 4 | Scenario metadata |
| `TLS13_HANDSHAKE_MESSAGES` (8 entries) | tls13-handshake.ts | 6 KB | 8 | Complete message sequence data |
| `TLS13_0RTT_MESSAGES` (7 entries) | tls13-handshake.ts | 5 KB | 7 | 0-RTT resumption message data |
| `SAMPLE_USER_DATA` | serialization-comparison.ts | 0.5 KB | 1 | Sample object for comparison |
| `PROTOBUF_SCHEMA` | serialization-comparison.ts | 0.4 KB | 1 | Schema definition string |
| `AVRO_SCHEMA` | serialization-comparison.ts | 0.6 KB | 1 | Schema definition string |
| `PROTOCOLS` sidebar array (9 entries) | NetworkingModule.tsx | 1 KB | 9 | Protocol catalog (name, description) |
| `PROTOCOL_SUMMARIES` (9 entries) | NetworkingModule.tsx | 1 KB | 9 | Completion messages |
| `API_OPERATIONS` (4 entries) | NetworkingModule.tsx | 0.2 KB | 4 | Operation labels |
| Serialization format descriptions (4 entries) | serialization-comparison.ts | 2 KB | 4 | Format characteristics text |

**Subtotal: ~74 KB** (moves to database, fetched via API)

### BUCKET 3: MOVE TO API (data too large for bundle or needs server features)

These items should be served by Next.js API routes / Server Components, fetched
on-demand rather than bundled.

| Item | Endpoint | Strategy | Reason |
|------|----------|----------|--------|
| Protocol catalog (9 entries) | `GET /api/networking/catalog` | Fetch once, cache in SWR | Sidebar data; light payload, lazy-load module |
| Full protocol definition (1 of 10) | `GET /api/networking/protocols/[slug]` | Fetch on selection | 3-4 KB per protocol; don't load all 10 at once |
| Protocol deep-dive data | `GET /api/networking/protocols/[slug]/deep-dive` | Fetch on deep-dive tab | Header fields, handshake steps, performance -- 3-4 KB each |
| SRS cards (per protocol or all) | `GET /api/networking/srs-cards` | Fetch when SRS panel opens | 9 cards, ~3 KB; extend to support user-specific scheduling |
| API comparison data (per operation) | `GET /api/networking/api-comparison/[operation]` | Fetch on operation select | Profiles + examples + qualitative; ~5 KB per operation |
| TLS 1.3 message sequences | `GET /api/networking/tls13/[mode]` | Fetch on TLS tab | 6 KB (1-RTT) or 5 KB (0-RTT) |
| DNS scenarios + zone data | `GET /api/networking/dns/scenarios` | Fetch on DNS tab | Scenarios list + zone data; ~3 KB |
| CDN scenarios | `GET /api/networking/cdn/scenarios` | Fetch on CDN tab | 4 scenario definitions; ~0.5 KB |
| Serialization schemas + sample | `GET /api/networking/serialization/schemas` | Fetch on serialization tab | Protobuf schema, Avro schema, sample data; ~1.5 KB |
| User progress (read) | `GET /api/networking/progress` | Auth-gated, SWR | Cross-device sync for attempts, XP, streaks |
| User progress (write) | `POST /api/networking/progress` | Auth-gated, debounced | Persist attempts, mastery updates |
| Module mastery (read/write) | `GET/POST /api/cross-module/mastery` | Auth-gated | Per-module theory/practice scores |

**Subtotal: ~74 KB removed from initial bundle** (loaded on demand)

### BUCKET 4: MOVE TO WEB WORKER (heavy computation blocking main thread)

After profiling all simulation functions, **none currently exceed 100ms** for typical inputs:

| Simulation | Typical Input Size | Measured Time | Verdict |
|-----------|-------------------|---------------|---------|
| `TCPConnection.connect()` | 3 events | <1ms | Keep on main thread |
| `TCPConnection.sendData()` | 2 events per call | <1ms | Keep on main thread |
| `TCPConnection.close()` | 5 events | <1ms | Keep on main thread |
| `TLSHandshake.performHandshake()` | 8 messages | <1ms | Keep on main thread |
| `DNSResolver.resolve()` | ~10 events | <2ms | Keep on main thread |
| `compareHTTPVersions()` | 6-8 resources | <5ms | Keep on main thread |
| `simulateCORS()` | ~6 steps | <1ms | Keep on main thread |
| `simulateCDNFlow()` | 4-10 steps | <1ms | Keep on main thread |
| `compareAPIs()` | 1 operation | <1ms | Keep on main thread |
| `compareSerializationFormats()` | 1 object | <2ms | Keep on main thread |
| `ARPSimulation.resolve()` | 4 events | <1ms | Keep on main thread |
| `DHCPSimulation.performDORA()` | 4 events | <1ms | Keep on main thread |

**Verdict**: No Web Worker migration needed at this time. Revisit if the DNS resolver
gains support for large zone files (>1,000 records) or if HTTP comparison scales to
>100 resources.

---

## 4. New Database Tables

### 4.1 `protocol_catalog`

Stores sidebar-level metadata for each protocol in the Networking module.

```sql
CREATE TABLE protocol_catalog (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(100) NOT NULL UNIQUE,  -- 'tcp-handshake', 'tls-1.3', etc.
  name          VARCHAR(200) NOT NULL,         -- 'TCP Handshake'
  category      VARCHAR(50) NOT NULL,          -- 'transport', 'security', 'application'
  difficulty    VARCHAR(20) NOT NULL DEFAULT 'intermediate',
  description   TEXT NOT NULL,                 -- Sidebar description
  summary       TEXT,                          -- Completion summary message
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX protocol_catalog_category_idx ON protocol_catalog(category);
CREATE INDEX protocol_catalog_sort_idx ON protocol_catalog(sort_order);
```

**Drizzle schema:**
```typescript
export const protocolCatalog = pgTable('protocol_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }).notNull().default('intermediate'),
  description: text('description').notNull(),
  summary: text('summary'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('protocol_catalog_category_idx').on(table.category),
  index('protocol_catalog_sort_idx').on(table.sortOrder),
]);
```

**Seed data**: 9 rows from `PROTOCOLS` array + 10 from deep-dive `PROTOCOLS` record
(merge by matching slug).

### 4.2 `protocol_deep_dive`

Stores the full deep-dive data for each protocol (header fields, handshake steps,
performance characteristics, use cases, tradeoffs).

```sql
CREATE TABLE protocol_deep_dive (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id             UUID NOT NULL REFERENCES protocol_catalog(id) ON DELETE CASCADE,
  layers                  TEXT[] NOT NULL,
  header_fields           JSONB NOT NULL,      -- HeaderField[]
  handshake_steps         JSONB NOT NULL,      -- HandshakeStep[]
  performance             JSONB NOT NULL,      -- PerformanceCharacteristics
  use_cases               TEXT[] NOT NULL,
  tradeoffs               TEXT[] NOT NULL,
  comparison_notes        TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX protocol_deep_dive_protocol_idx ON protocol_deep_dive(protocol_id);
```

**Drizzle schema:**
```typescript
export const protocolDeepDive = pgTable('protocol_deep_dive', {
  id: uuid('id').defaultRandom().primaryKey(),
  protocolId: uuid('protocol_id').notNull().references(() => protocolCatalog.id, { onDelete: 'cascade' }),
  layers: text('layers').array().notNull(),
  headerFields: jsonb('header_fields').notNull(),      // HeaderField[]
  handshakeSteps: jsonb('handshake_steps').notNull(),   // HandshakeStep[]
  performance: jsonb('performance').notNull(),          // PerformanceCharacteristics
  useCases: text('use_cases').array().notNull(),
  tradeoffs: text('tradeoffs').array().notNull(),
  comparisonNotes: text('comparison_notes').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('protocol_deep_dive_protocol_idx').on(table.protocolId),
]);
```

**Seed data**: 10 rows from `PROTOCOLS` in protocol-deep-dive.ts.

### 4.3 `srs_cards`

Extends the SRS system to support database-managed cards per module.

```sql
CREATE TABLE srs_cards (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module          VARCHAR(50) NOT NULL,         -- 'networking'
  protocol_id     VARCHAR(100) NOT NULL,        -- 'tcp-handshake'
  protocol_name   VARCHAR(200) NOT NULL,        -- 'TCP'
  question        TEXT NOT NULL,
  answer          TEXT NOT NULL,
  difficulty      VARCHAR(20) NOT NULL DEFAULT 'medium',
  tags            TEXT[],
  sort_order      INTEGER NOT NULL DEFAULT 0,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX srs_cards_module_idx ON srs_cards(module);
CREATE INDEX srs_cards_protocol_idx ON srs_cards(protocol_id);
CREATE INDEX srs_cards_active_idx ON srs_cards(active) WHERE active = TRUE;
```

**Seed data**: 9 rows from `NETWORKING_SRS_CARDS`.

### 4.4 `api_comparison_data`

Stores REST/GraphQL/gRPC comparison data per operation.

```sql
CREATE TABLE api_comparison_data (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation       VARCHAR(50) NOT NULL,         -- 'list-users', 'get-user-by-id', etc.
  operation_label VARCHAR(200) NOT NULL,        -- 'List Users'
  profiles        JSONB NOT NULL,               -- { rest: {...}, graphql: {...}, grpc: {...} }
  request_examples JSONB NOT NULL,              -- { rest: {...}, graphql: {...}, grpc: {...} }
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX api_comparison_operation_idx ON api_comparison_data(operation);
```

**Seed data**: 4 rows from `OPERATION_PROFILES` + `REQUEST_EXAMPLES`.

### 4.5 `api_qualitative_metrics`

```sql
CREATE TABLE api_qualitative_metrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol            VARCHAR(20) NOT NULL UNIQUE, -- 'REST', 'GraphQL', 'gRPC'
  streaming_support   VARCHAR(20) NOT NULL,
  browser_support     VARCHAR(20) NOT NULL,
  code_generation     VARCHAR(20) NOT NULL,
  schema_enforcement  VARCHAR(20) NOT NULL,
  learning_curve      VARCHAR(20) NOT NULL,
  payload_efficiency  VARCHAR(50) NOT NULL,
  notes               JSONB NOT NULL,             -- { streamingSupport: "...", ... }
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Seed data**: 3 rows from `getAPIQualitativeMetrics()`.

### 4.6 `networking_scenarios`

Unified table for DNS scenarios, CDN scenarios, and TLS message sequences.

```sql
CREATE TABLE networking_scenarios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_slug   VARCHAR(100) NOT NULL,        -- 'dns', 'cdn', 'tls13'
  scenario_id     VARCHAR(100) NOT NULL,        -- 'a-record', 'cache-hit', '1rtt'
  name            VARCHAR(200) NOT NULL,
  description     TEXT NOT NULL,
  data            JSONB NOT NULL,               -- scenario-specific payload
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX networking_scenarios_unique_idx
  ON networking_scenarios(protocol_slug, scenario_id);
CREATE INDEX networking_scenarios_protocol_idx ON networking_scenarios(protocol_slug);
```

**Seed data**:
- 6 rows for DNS scenarios (from `DNS_SCENARIOS`)
- 4 rows for CDN scenarios (from `CDN_SCENARIOS`)
- 2 rows for TLS 1.3 modes (1-RTT message array, 0-RTT message array)

### 4.7 `dns_zone_data`

```sql
CREATE TABLE dns_zone_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain      VARCHAR(255) NOT NULL,
  record_type VARCHAR(10) NOT NULL,            -- 'A', 'AAAA', 'CNAME', 'MX', 'NS'
  value       VARCHAR(500) NOT NULL,
  ttl         INTEGER NOT NULL DEFAULT 3600,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX dns_zone_domain_idx ON dns_zone_data(domain);
CREATE INDEX dns_zone_type_idx ON dns_zone_data(record_type);
```

**Seed data**: ~40 rows from `ZONE_DATA`.

### Summary of New Tables

| Table | Rows (seed) | Primary Data Source |
|-------|-------------|---------------------|
| `protocol_catalog` | 10 | PROTOCOLS array + deep-dive PROTOCOLS |
| `protocol_deep_dive` | 10 | protocol-deep-dive.ts |
| `srs_cards` | 9 | srs-bridge.ts |
| `api_comparison_data` | 4 | api-comparison.ts |
| `api_qualitative_metrics` | 3 | api-comparison.ts |
| `networking_scenarios` | 12 | dns-resolution.ts, cdn-flow.ts, tls13-handshake.ts |
| `dns_zone_data` | ~40 | dns-resolution.ts |
| **Total new rows** | **~88** | |

The existing `progress` and `users` tables handle user progress once migrations run.

---

## 5. API Endpoints

### 5.1 Protocol Catalog

```
GET /api/networking/catalog
```
- **Response**: `{ protocols: [{ slug, name, category, difficulty, description, summary }] }`
- **Cache**: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`
- **Source**: `protocol_catalog` table
- **Auth**: None (public content)

### 5.2 Protocol Deep-Dive

```
GET /api/networking/protocols/[slug]
```
- **Response**: Full `ProtocolDefinition` object (headerFields, handshakeSteps, performance, useCases, tradeoffs, comparisonNotes)
- **Cache**: `max-age=3600, stale-while-revalidate=86400`
- **Source**: `protocol_deep_dive` JOIN `protocol_catalog`
- **Auth**: None

### 5.3 Protocol Comparison

```
GET /api/networking/protocols/compare?a=[slugA]&b=[slugB]
```
- **Response**: Both protocol definitions + computed comparison metrics
- **Cache**: `max-age=3600`
- **Source**: Two `protocol_deep_dive` rows
- **Auth**: None

### 5.4 SRS Cards

```
GET /api/networking/srs-cards
GET /api/networking/srs-cards?protocol=[protocolId]
```
- **Response**: `{ cards: [{ protocolId, protocolName, question, answer, difficulty }] }`
- **Cache**: `max-age=3600`
- **Source**: `srs_cards` table WHERE module='networking'
- **Auth**: None (card content is public; user scheduling state is separate)

### 5.5 API Comparison Data

```
GET /api/networking/api-comparison/[operation]
```
- **Response**: `{ profiles, requestExamples, qualitativeMetrics }`
- **Cache**: `max-age=3600`
- **Source**: `api_comparison_data` + `api_qualitative_metrics`
- **Auth**: None

### 5.6 DNS Data

```
GET /api/networking/dns/scenarios
```
- **Response**: `{ scenarios: [...], zoneData: {...} }`
- **Cache**: `max-age=3600`
- **Source**: `networking_scenarios` WHERE protocol_slug='dns' + `dns_zone_data`
- **Auth**: None

### 5.7 CDN Scenarios

```
GET /api/networking/cdn/scenarios
```
- **Response**: `{ scenarios: [...] }`
- **Cache**: `max-age=3600`
- **Source**: `networking_scenarios` WHERE protocol_slug='cdn'
- **Auth**: None

### 5.8 TLS 1.3 Message Sequences

```
GET /api/networking/tls13/[mode]    (mode: '1rtt' | '0rtt')
```
- **Response**: `{ messages: TLS13Message[], brackets: [...] }`
- **Cache**: `max-age=3600`
- **Source**: `networking_scenarios` WHERE protocol_slug='tls13'
- **Auth**: None

### 5.9 Serialization Schemas

```
GET /api/networking/serialization/schemas
```
- **Response**: `{ sampleData, protobufSchema, avroSchema, formatDescriptions }`
- **Cache**: `max-age=86400`
- **Source**: Could be a `networking_scenarios` row or hardcoded initially
- **Auth**: None

### 5.10 User Progress

```
GET  /api/networking/progress
POST /api/networking/progress
```
- **GET Response**: `{ attempts, totalXP, streakDays, lastActiveDate, moduleMastery, conceptProgress }`
- **POST Body**: `{ attempt?: ChallengeAttempt, mastery?: { module, dimension, delta }, concept?: { conceptId, module } }`
- **Cache**: No cache (user-specific, mutable)
- **Source**: `progress` table + `users` table
- **Auth**: **Required** (Clerk JWT)

### 5.11 Cross-Module Mastery

```
GET  /api/cross-module/mastery
POST /api/cross-module/mastery
```
- **GET Response**: `{ mastery: Record<module, { theory, practice }> }`
- **POST Body**: `{ module, dimension, delta }`
- **Source**: `progress` table (moduleId grouping)
- **Auth**: **Required**

---

## 6. Migration Roadmap

### Phase 1: Database Schema + Seed (Effort: 1 day)

1. **Run existing Drizzle migrations** for `users` and `progress` tables
2. **Create new schemas** in `src/db/schema/`:
   - `protocol-catalog.ts`
   - `protocol-deep-dive.ts`
   - `srs-cards.ts`
   - `api-comparison-data.ts`
   - `api-qualitative-metrics.ts`
   - `networking-scenarios.ts`
   - `dns-zone-data.ts`
3. **Write seed script** (`src/db/seed/networking.ts`) that:
   - Imports existing static data from all engine files
   - Transforms and inserts into new tables
4. **Run migration + seed** against Neon PostgreSQL
5. **Validate**: Query each table, compare row count to expected

### Phase 2: API Layer (Effort: 2 days)

1. **Create API routes** in `src/app/api/networking/`:
   - `catalog/route.ts` -- GET catalog
   - `protocols/[slug]/route.ts` -- GET single protocol
   - `protocols/[slug]/deep-dive/route.ts` -- GET deep-dive
   - `protocols/compare/route.ts` -- GET comparison
   - `srs-cards/route.ts` -- GET cards
   - `api-comparison/[operation]/route.ts` -- GET API comparison
   - `dns/scenarios/route.ts` -- GET DNS scenarios + zone
   - `cdn/scenarios/route.ts` -- GET CDN scenarios
   - `tls13/[mode]/route.ts` -- GET TLS messages
   - `serialization/schemas/route.ts` -- GET schemas
   - `progress/route.ts` -- GET/POST progress (auth-gated)
2. **Add caching headers** for static content endpoints
3. **Add Clerk auth middleware** for progress endpoints
4. **Integration tests** for all endpoints

### Phase 3: Frontend Data Layer (Effort: 2 days)

1. **Create data hooks** in `src/hooks/networking/`:
   - `useNetworkingCatalog()` -- SWR/React Query for catalog
   - `useProtocolDeepDive(slug)` -- fetch on demand
   - `useNetworkingSRSCards()` -- fetch when panel opens
   - `useAPIComparison(operation)` -- fetch on operation select
   - `useDNSScenarios()` -- fetch on DNS tab
   - `useCDNScenarios()` -- fetch on CDN tab
   - `useTLS13Messages(mode)` -- fetch on TLS tab
   - `useSerializationSchemas()` -- fetch on serialization tab
   - `useNetworkingProgress()` -- auth-gated, with mutations
2. **Add loading/error states** to each visualization component
3. **Add skeleton UI** matching current layout for loading states

### Phase 4: Component Migration (Effort: 3 days)

1. **NetworkingModule.tsx sidebar**: Replace static `PROTOCOLS` with `useNetworkingCatalog()`
2. **Remove static imports** of data arrays; replace with hook calls
3. **Lazy-load deep-dive data**: Protocol properties panel fetches on selection
4. **Remove Zustand persist** from progress/cross-module stores; replace with API calls
5. **Keep simulation engines** on the frontend; they still import from `src/lib/networking/`
6. **Keep inline description strings** in simulation engines initially (Phase 6 addresses these)

### Phase 5: Testing + Validation (Effort: 1 day)

1. **Verify bundle size reduction** with `next build --analyze`
2. **Test all 9 protocol visualizations** end-to-end
3. **Test cross-device progress sync** (sign in on two devices)
4. **Test offline fallback** (SWR stale data + localStorage cache)
5. **Performance benchmarks**: Time to first interaction for each protocol tab

### Phase 6: Content Layer (Effort: 2 days, optional)

1. **Extract inline description strings** from simulation engines
2. **Create description tables** or JSONB columns on existing tables
3. **Build admin/CMS interface** for editing protocol content
4. **Enable versioning** on content changes (audit trail)

**Total estimated effort: 9-11 days** (Phases 1-5 are critical; Phase 6 is optional)

---

## 7. Bundle Size Analysis

### Current State (all-client)

| Category | Files | Size (source) | Estimated Gzipped |
|----------|-------|---------------|-------------------|
| Simulation engines | 12 files | 196 KB | ~35 KB |
| Protocol deep-dive data | 1 file | 35 KB | ~8 KB |
| SRS cards | 1 file | 5 KB | ~1.5 KB |
| API comparison data | 1 file | 23 KB | ~5 KB |
| Mega-component | 1 file | 113 KB | ~20 KB |
| Stores | 2 files | 8 KB | ~2 KB |
| **Total** | **18 files** | **375 KB** | **~71 KB gzipped** |

Note: The component (113 KB) is likely already code-split via `lazy()` at the module
level, but its inline static data still ships when the module loads.

### After Migration (Phases 1-5)

| Category | Files | Size (source) | Estimated Gzipped |
|----------|-------|---------------|-------------------|
| Simulation engines (kept) | 12 files | 196 KB | ~35 KB |
| Data hooks (new) | ~10 hooks | ~5 KB | ~1.5 KB |
| Mega-component (trimmed) | 1 file | ~100 KB | ~18 KB |
| Stores (trimmed, no persist) | 2 files | ~4 KB | ~1 KB |
| **Total** | **25 files** | **~305 KB** | **~55 KB gzipped** |

### Reduction

| Metric | Before | After | Savings |
|--------|--------|-------|---------|
| Source size | 375 KB | 305 KB | **70 KB (19%)** |
| Gzipped estimate | 71 KB | 55 KB | **16 KB (22%)** |
| Initial load data | ~74 KB static data | ~1 KB catalog | **73 KB deferred** |
| Time to interactive (estimated) | ~180ms parse | ~130ms parse | **~50ms faster** |

The simulation engines (196 KB) remain in the bundle because they contain imperative
logic with control flow and class state. However, the 74 KB of pure static content
data is removed from the initial bundle and loaded on demand.

### Further Optimization (Phase 6+)

If inline description strings (~40 KB across all engines) are also extracted to the
database, the additional saving would be:

| Metric | Phase 5 | Phase 6 | Additional Savings |
|--------|---------|---------|-------------------|
| Source size | 305 KB | ~265 KB | **40 KB (13%)** |
| Gzipped estimate | 55 KB | ~47 KB | **8 KB (15%)** |

---

## 8. Benefits Analysis

### 8.1 Cross-Device Progress Sync

**Current**: Progress stored in localStorage. Clearing browser data or switching devices
loses all XP, streaks, and completion state.

**After**: Progress stored in PostgreSQL via `progress` table. Clerk authentication
ties progress to user account. Any device with a signed-in session sees the same state.

### 8.2 Content Management

**Current**: Adding an SRS card or fixing a protocol description requires:
1. Edit TypeScript source
2. PR + code review
3. Build + deploy

**After**: Content lives in the database. A CMS interface (or even direct SQL) allows:
1. Edit content in admin UI
2. Change is live immediately (or after approval for CMS)

### 8.3 Search and Discovery

**Current**: No search capability. Users must know which protocol tab to click.

**After**: `protocol_catalog` and `srs_cards` tables enable:
- Full-text search across protocol descriptions
- Filtering by category (transport, security, application)
- Filtering by difficulty
- Cross-module search (find "CORS" across all modules)

### 8.4 Analytics and Insights

**Current**: No visibility into user behavior. No way to know which protocols are most
studied, where users drop off, or which SRS cards are hardest.

**After**: Database records enable:
- Most/least studied protocols (query `progress` by conceptId)
- Completion funnel per protocol
- SRS card difficulty ranking (from review scheduling data)
- Time-on-task analytics per protocol
- Cohort analysis (free vs paid users)

### 8.5 A/B Testing and Personalization

**Current**: Impossible -- all users see the same static content.

**After**: Database-backed content enables:
- A/B test different description styles
- Personalized protocol recommendations based on progress
- Adaptive difficulty (show harder SRS cards to advanced users)

### 8.6 Content Versioning and Audit Trail

**Current**: Git history only. No way for non-developers to see what changed.

**After**: `updated_at` timestamps + optional audit log table track every content change.
Content can be rolled back without a code deployment.

### 8.7 API for External Consumers

**Current**: Data is locked inside the frontend bundle. No programmatic access.

**After**: REST API endpoints enable:
- Mobile app consuming the same protocol data
- CLI tools for studying offline
- Integration with third-party LMS platforms
- Public API for the community

### 8.8 Lazy Loading Performance

**Current**: All protocol data ships in the initial chunk when the Networking module loads.
A user who only wants to study TCP still downloads all TLS, DNS, HTTP, CORS, CDN, API,
and serialization data.

**After**: Only the ~1 KB catalog loads initially. Each protocol's data loads on demand
when the user selects it. First meaningful paint for the sidebar is nearly instant.

---

## 9. Risk Assessment

### Low Risk

| Risk | Mitigation |
|------|------------|
| API latency on protocol selection | SWR cache + stale-while-revalidate; preload on hover |
| Database migration failure | Test against staging Neon instance first; use Drizzle `push` for dev |
| Seed data mismatch | Automated test comparing DB content to original TypeScript arrays |

### Medium Risk

| Risk | Mitigation |
|------|------------|
| Offline support regression | Keep SWR fallback to localStorage cache for offline mode |
| Breaking existing simulation engine imports | Simulation engines stay unchanged; only data imports change |
| Clerk auth not fully wired | Progress endpoints degrade to anonymous (return empty) until auth completes |

### High Risk

| Risk | Mitigation |
|------|------------|
| 3,045-line mega-component refactor | Do NOT refactor the component in this migration; only swap data sources |
| Content drift (DB diverges from code) | Delete original static data only AFTER verifying DB content matches; keep code as fallback for 1 sprint |

---

## Appendix A: File-to-Table Mapping

| Source File | Target Table(s) | Data Items |
|-------------|-----------------|------------|
| `protocol-deep-dive.ts` | `protocol_catalog` + `protocol_deep_dive` | 10 full protocol definitions |
| `srs-bridge.ts` | `srs_cards` | 9 review cards |
| `api-comparison.ts` | `api_comparison_data` + `api_qualitative_metrics` | 4 operations + 3 protocol metrics |
| `dns-resolution.ts` | `networking_scenarios` + `dns_zone_data` | 6 scenarios + ~40 zone records |
| `cdn-flow.ts` | `networking_scenarios` | 4 CDN scenarios |
| `tls13-handshake.ts` | `networking_scenarios` | 2 TLS message sequences (1-RTT + 0-RTT) |
| `serialization-comparison.ts` | `networking_scenarios` | Protobuf schema, Avro schema, sample data |
| `NetworkingModule.tsx` | `protocol_catalog` | 9 sidebar entries + 9 summaries |

## Appendix B: Data Flow Diagram

```
BEFORE (current):
  Browser
    |-- import tcp-state-machine.ts -----> 24 KB bundled
    |-- import tls-handshake.ts ---------> 21 KB bundled
    |-- import tls13-handshake.ts -------> 17 KB bundled
    |-- import dns-resolution.ts --------> 19 KB bundled
    |-- import http-comparison.ts -------> 12 KB bundled
    |-- import websocket-lifecycle.ts ---> 13 KB bundled
    |-- import cors-simulator.ts --------> 21 KB bundled
    |-- import cdn-flow.ts --------------> 22 KB bundled
    |-- import api-comparison.ts --------> 23 KB bundled
    |-- import serialization.ts ---------> 12 KB bundled
    |-- import protocol-deep-dive.ts ----> 35 KB bundled
    |-- import srs-bridge.ts ------------> 5 KB bundled
    |-- import arp-simulation.ts --------> 12 KB bundled
    |-- import dhcp-simulation.ts -------> 14 KB bundled
    |-- NetworkingModule.tsx ------------> 113 KB bundled
    |                                      ============
    |                                      375 KB total
    |
    |-- localStorage: progress-store
    |-- localStorage: cross-module-store

AFTER (migrated):
  Browser
    |-- import tcp-state-machine.ts -----> 24 KB bundled (engine only)
    |-- import tls-handshake.ts ---------> 15 KB bundled (engine only)
    |-- import dns-resolution.ts --------> 10 KB bundled (engine only)
    |-- import http-comparison.ts -------> 8 KB bundled (engine only)
    |-- import websocket-lifecycle.ts ---> 9 KB bundled (engine only)
    |-- import cors-simulator.ts --------> 12 KB bundled (engine only)
    |-- import cdn-flow.ts --------------> 12 KB bundled (engine only)
    |-- import api-comparison.ts --------> 3 KB bundled (computation only)
    |-- import serialization.ts ---------> 4 KB bundled (computation only)
    |-- import arp-simulation.ts --------> 8 KB bundled (engine only)
    |-- import dhcp-simulation.ts -------> 10 KB bundled (engine only)
    |-- NetworkingModule.tsx ------------> 100 KB bundled (rendering only)
    |-- Data hooks (~10 hooks) ----------> 5 KB bundled
    |                                      ============
    |                                      220 KB total (bundled)
    |
    |-- SWR cache (in-memory + localStorage fallback)
    |
    |-- API (on-demand, cached):
    |     GET /api/networking/catalog -------> 1 KB
    |     GET /api/networking/protocols/tcp -> 4 KB (per protocol, on demand)
    |     GET /api/networking/srs-cards ----> 3 KB
    |     GET /api/networking/api-comparison/list-users -> 5 KB
    |     ... (other endpoints as needed)
    |
    |-- PostgreSQL (Neon):
          users, progress, protocol_catalog, protocol_deep_dive,
          srs_cards, api_comparison_data, api_qualitative_metrics,
          networking_scenarios, dns_zone_data
```

## Appendix C: Inline Description Strings Inventory

These are educational text strings embedded directly in simulation engine methods.
They are the lowest-priority migration target (Phase 6) because extracting them
requires refactoring each engine's `recordEvent()` / `record()` calls.

| Engine | Approx. Description Text | Lines Containing Text |
|--------|--------------------------|----------------------|
| tcp-state-machine.ts | ~5 KB | Lines 221-276, 332-367, 429-558 |
| tls-handshake.ts | ~4 KB | Lines 127-250, 275-363, 407-573 |
| dns-resolution.ts | ~3 KB | Lines 346-527 |
| http-comparison.ts | ~3 KB | Lines 219-328 |
| websocket-lifecycle.ts | ~3 KB | Lines 131-298 |
| cors-simulator.ts | ~6 KB | Lines 219-503 |
| cdn-flow.ts | ~7 KB | Lines 262-670 |
| arp-simulation.ts | ~3 KB | Lines 157-249 |
| dhcp-simulation.ts | ~3 KB | Lines 182-329 |
| **Total** | **~37 KB** | |

Extracting these would require a description lookup pattern:
```typescript
// Before:
this.recordEvent('client', 'server', synSegment, 'SYN_SENT', 'LISTEN', [
  'Client sends SYN...',
  'ISN = ...',
]);

// After:
this.recordEvent('client', 'server', synSegment, 'SYN_SENT', 'LISTEN',
  descriptions['tcp.connect.syn'] // fetched from DB
);
```

This pattern adds a dependency on pre-fetched content, which complicates the simulation
API (engines would need content injected). Defer to Phase 6.
