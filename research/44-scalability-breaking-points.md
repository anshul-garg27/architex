# Scalability Analysis: Every Breaking Point

> Load scenarios at 10K, 100K, and 1M DAU with exact fixes.

---

## CANVAS PERFORMANCE (React Flow)

| Nodes | FPS (pan) | FPS (drag) | Memory | Status |
|---|---|---|---|---|
| 0-50 | 60 | 60 | ~30MB | Excellent |
| 50-200 | 58-60 | 55-60 | ~60MB | Good |
| 200-500 | 40-55 | 30-50 | ~120MB | **First cliff** |
| 500-1000 | 15-30 | 10-25 | ~250MB | **Severe** |
| 1000+ | <15 | <10 | 400MB+ | **Unusable without virtualization** |

**Particles:** 100+ simultaneous particles break 60fps. `getPointAtLength()` is the hidden bottleneck.

**Fixes:** React.memo (Day 1), LOD rendering (Week 1), pre-compute particle paths (Week 2), edge virtualization (Week 3-4), OffscreenCanvas minimap (Month 2).

---

## WASM ENGINE

| Module Size (gz) | 4G Load | WiFi Load |
|---|---|---|
| 50-100 KB | 80-160ms | 8-16ms |
| 300KB-1MB | 480ms-1.6s | 48-160ms |
| 1-5 MB | 1.6-8s | **Must split** |

**Fix:** Split into feature chunks (core.wasm, simulation.wasm, consensus.wasm, layout.wasm). SharedArrayBuffer for hot-path communication. Worker pool with round-robin dispatch.

---

## COLLABORATION (Yjs)

| Users | Protocol | Issues |
|---|---|---|
| 2-5 | y-webrtc (P2P) | None |
| 5-20 | y-webrtc | Bandwidth O(n²) |
| 20-50 | **Must use server relay** | y-websocket needed |
| 50-100 | y-websocket | Server bottleneck |
| 100+ | Sharded y-websocket | Complex deployment |

**Document growth:** 60 nodes, 5 users, 8 hours = 5-20 MB. GC needed at 10MB+.

**Fixes:** Debounce position updates to 10Hz (Week 1), y-websocket for 6+ users (Week 2), document compaction (Month 2), sub-document sharding (Month 3+).

---

## CLIENT STORAGE (IndexedDB)

**Safari is the breaking point.** ITP evicts data after 7 days of no visits. `navigator.storage.persist()` helps but is inconsistent.

| Operation | 10KB | 100KB | 1MB | 10MB |
|---|---|---|---|---|
| Write | <1ms | 2-5ms | 10-30ms | 50-200ms |
| Read | <1ms | 1-3ms | 5-15ms | 30-100ms |
| List 500 items | 5-20ms | 200-500ms | **1-5s** | **5-30s** |

**Fixes:** Separate meta from data table (Day 1), pagination (Week 1), compress with fflate (Week 2), OPFS for binaries (Month 2), Dexie in Worker (Month 2).

---

## AI (Claude API)

**1000 simultaneous reviews:** At Tier 4, takes 5 minutes to drain. At Tier 2: 25 minutes.

**Cost projections:**
| Scale | Requests/day | Monthly Cost |
|---|---|---|
| 10K DAU | 500 reviews + 2K hints | ~$200 |
| 100K DAU | 10K reviews + 40K hints | ~$3,000 |
| 1M DAU | 100K reviews + 400K hints | ~$25,000 |

**Fixes:** Request queue + per-user rate limit (Day 1), prompt caching 63% savings (Day 1), tiered model routing 60-70% savings (Week 1), client-side response caching (Week 2), batch API for reports (Month 2).

---

## LOAD SCENARIOS

### 10K DAU ($100-200/mo)
Everything works. Vercel free/Pro, Neon free, Clerk free. No breaking points.

### 100K DAU ($2,500-4,000/mo)
**Breaks:** Clerk costs ($1,800/mo alone), PostHog volume (45M events/mo), AI costs ($3K/mo).
**Fix:** Plan Clerk→Better Auth migration, upgrade PostHog, gate AI behind Pro tier.

### 1M DAU — What Completely Breaks
1. **Clerk: $18,000/mo** → Better Auth (self-hosted, ~$200/mo)
2. **y-websocket: 2.5GB RAM** → Horizontal scaling + Redis Pub/Sub
3. **AI: $25,000/mo** → Gate behind Pro tier (3% conversion = $360K/mo revenue)
4. **Vercel: 150M invocations/mo** → Self-host API routes
5. **PostHog: 450M events/mo** → Self-host or ClickHouse pipeline
6. **Email: $1,600/mo** → AWS SES ($400/mo)

### What NEVER breaks (client-side scales for free):
- Canvas performance, WASM engine, IndexedDB, React Flow rendering, ISR pages on CDN
- **The core product is entirely client-side and scales to millions at near-zero marginal cost.**

---

## SCALING ROADMAP

**Phase 1 (0-10K):** React.memo, LOD, Zustand selectors, WASM lazy loading, AI queue + caching
**Phase 2 (10K-100K):** y-websocket server, particle cache, edge virtualization, IndexedDB compression, Neon DB, Yjs compaction
**Phase 3 (100K-1M):** Better Auth migration, horizontal WebSocket scaling, self-host PostHog, migrate API off Vercel, SES for email
**Phase 4 (1M+):** Cloudflare Durable Objects, Canvas/WebGL fallback, custom analytics pipeline, multi-region DB
