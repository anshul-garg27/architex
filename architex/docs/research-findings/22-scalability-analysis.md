# Scalability Analysis: Every Breaking Point

**Date:** 2026-04-11
**Source agent:** Scalability Breaking Points (research/44)
**Scope:** Load scenarios at 10K, 100K, and 1M DAU with exact fixes per subsystem.

---

## Summary

| Subsystem | First Breaking Point | Scale Limit | Fix Complexity |
|-----------|---------------------|-------------|----------------|
| React Flow Canvas | 200+ nodes | 1000+ unusable | Week 1-4 |
| Particle Animations | 100+ particles | 60fps broken | Week 2 |
| Yjs Collaboration | 20+ users P2P | O(n^2) bandwidth | Week 2-3 |
| Claude API Queue | 1000 simultaneous | 5-25 min drain | Day 1 |
| Clerk Pricing | 100K MAU | $18K/mo at 1M | Month 6+ migration |
| WASM Modules | 1MB+ gzipped | 8s on 4G | Week 1-2 |
| IndexedDB | 10MB+ documents | Safari evicts at 7 days | Week 1-2 |
| Bundle Size | Unchecked growth | First paint regression | Ongoing |

---

## 1. Canvas Performance (React Flow)

### FPS Targets by Node Count

| Nodes | FPS (pan) | FPS (drag) | Memory | Status |
|-------|-----------|------------|--------|--------|
| 0-50 | 60 | 60 | ~30 MB | Excellent |
| 50-200 | 58-60 | 55-60 | ~60 MB | Good |
| 200-500 | 40-55 | 30-50 | ~120 MB | **First cliff** |
| 500-1000 | 15-30 | 10-25 | ~250 MB | **Severe degradation** |
| 1000+ | <15 | <10 | 400 MB+ | **Unusable without virtualization** |

### Breaking Point: 200+ Nodes (SVG Rendering)

React Flow renders every node and edge as SVG DOM elements. At 200+ nodes, the browser spends more time on layout/paint than animation frames.

### Particle Animation Cliff: 100+ Simultaneous Particles

`getPointAtLength()` is the hidden bottleneck. Each particle calls this DOM method every frame to compute its position along an SVG path. At 100+ particles, this dominates the frame budget.

### Fix Roadmap

| When | Fix | Impact |
|------|-----|--------|
| Day 1 | `React.memo` on all node/edge components | 10-20% improvement |
| Week 1 | Level-of-Detail (LOD) rendering: simplified nodes at zoom <0.5 | 30-50% improvement at low zoom |
| Week 2 | Pre-compute particle paths (sample path points at init, interpolate at runtime) | Eliminates `getPointAtLength` bottleneck |
| Week 3-4 | Edge virtualization (only render visible edges) | Handles 500+ nodes |
| Month 2 | OffscreenCanvas minimap (render minimap in Worker) | Removes minimap overhead from main thread |
| Month 3+ | Canvas/WebGL fallback for 1000+ node diagrams | Full scalability |

### Memory Budget per Module

| Module | Target | Max Allowed |
|--------|--------|-------------|
| Canvas core (React Flow) | 30 MB | 60 MB |
| Simulation engine | 20 MB | 40 MB |
| WASM modules (loaded) | 15 MB | 30 MB |
| Collaboration (Yjs doc) | 10 MB | 20 MB |
| IndexedDB cache | 50 MB | 100 MB |
| **Total per tab** | **125 MB** | **250 MB** |

---

## 2. WASM Engine

### Module Size vs Load Time

| Module Size (gzipped) | 4G Load Time | WiFi Load Time |
|-----------------------|--------------|----------------|
| 50-100 KB | 80-160 ms | 8-16 ms |
| 300 KB - 1 MB | 480 ms - 1.6 s | 48-160 ms |
| 1-5 MB | 1.6-8 s | **Must split** |

### Breaking Point: 1 MB+ Gzipped Module

Any single WASM module over 1 MB gzipped makes 4G users wait 1.6+ seconds on first load, breaking the 1-second perception threshold.

### Fix: Split into Feature Chunks

```
core.wasm        -- Essential simulation primitives (~100 KB)
simulation.wasm  -- Traffic flow, queuing theory (~200 KB)
consensus.wasm   -- Raft, Paxos, vector clocks (~150 KB)
layout.wasm      -- Graph layout algorithms (~150 KB)
```

- SharedArrayBuffer for hot-path communication between WASM and main thread
- Worker pool with round-robin dispatch for parallel simulations
- Lazy-load non-essential modules on first use

### Bundle Size Budgets

| Asset | Budget (gzipped) |
|-------|-------------------|
| Initial JS bundle | 150 KB |
| Per-route chunk | 50 KB |
| WASM core module | 100 KB |
| WASM feature module | 200 KB each |
| Total first-load | 300 KB |
| Total with lazy modules | 1.5 MB max |

---

## 3. Collaboration (Yjs)

### User Count vs Protocol

| Users | Protocol | Issues |
|-------|----------|--------|
| 2-5 | y-webrtc (P2P) | None |
| 5-20 | y-webrtc (P2P) | Bandwidth O(n^2), mesh becomes expensive |
| 20-50 | **Must switch to server relay** | y-websocket required |
| 50-100 | y-websocket | Server becomes bottleneck |
| 100+ | Sharded y-websocket | Complex deployment needed |

### Breaking Point: 20+ Users on P2P

P2P collaboration uses a full mesh topology. With n peers, each peer maintains n-1 connections. At 20 users, that is 190 connections total, and bandwidth scales quadratically.

### Document Growth

A document with 60 nodes, 5 active users, over 8 hours generates 5-20 MB of Yjs history. Garbage collection is needed at 10 MB+.

### Fix Roadmap

| When | Fix | Impact |
|------|-----|--------|
| Week 1 | Debounce position updates to 10 Hz (100 ms) | 60-80% bandwidth reduction |
| Week 2 | Switch to y-websocket for 6+ users | Linear scaling replaces quadratic |
| Month 2 | Document compaction (Yjs GC) at 10 MB threshold | Controls document bloat |
| Month 3+ | Sub-document sharding (split diagram into regions) | Handles 100+ concurrent users |

---

## 4. Client Storage (IndexedDB)

### Operation Performance

| Operation | 10 KB | 100 KB | 1 MB | 10 MB |
|-----------|-------|--------|------|-------|
| Write | <1 ms | 2-5 ms | 10-30 ms | 50-200 ms |
| Read | <1 ms | 1-3 ms | 5-15 ms | 30-100 ms |
| List 500 items | 5-20 ms | 200-500 ms | **1-5 s** | **5-30 s** |

### Breaking Point: Safari ITP Eviction

Safari's Intelligent Tracking Prevention evicts IndexedDB data after 7 days of no site visits. `navigator.storage.persist()` helps but behavior is inconsistent across browsers.

### Fix Roadmap

| When | Fix | Impact |
|------|-----|--------|
| Day 1 | Separate metadata table from data table | Fast listing without loading payloads |
| Week 1 | Pagination for document lists | Eliminates slow list operations |
| Week 2 | Compress with fflate before storing | 50-70% storage reduction |
| Month 2 | OPFS (Origin Private File System) for binary assets | Better Safari compatibility |
| Month 2 | Run Dexie in Web Worker | Unblocks main thread for large operations |

---

## 5. AI (Claude API)

### Queue Drain Times

1000 simultaneous review requests:
- **Tier 4 rate limits:** ~5 minutes to drain the queue
- **Tier 2 rate limits:** ~25 minutes to drain the queue

### Cost Projections

| Scale | Requests/day | Monthly Cost |
|-------|-------------|-------------|
| 10K DAU | 500 reviews + 2K hints | ~$200 |
| 100K DAU | 10K reviews + 40K hints | ~$3,000 |
| 1M DAU | 100K reviews + 400K hints | ~$25,000 |

### Breaking Point: 1000 Simultaneous Requests

At peak usage (e.g., after a ByteByteGo newsletter mention), request queues can back up significantly, causing 5-25 minute wait times depending on API tier.

### Fix Roadmap

| When | Fix | Savings |
|------|-----|---------|
| Day 1 | Request queue with per-user rate limit | Prevents queue starvation |
| Day 1 | Prompt caching (Anthropic cache_control) | 63% cost reduction |
| Week 1 | Tiered model routing (Haiku for hints, Sonnet for reviews) | 60-70% cost reduction |
| Week 2 | Client-side response caching (same problem = cached feedback) | Eliminates duplicate calls |
| Month 2 | Batch API for aggregate reports | Reduces per-request overhead |

---

## 6. Load Scenarios

### 10K DAU ($100-200/mo)

**Everything works.** Vercel free/Pro, Neon free tier, Clerk free (10K MAU). No breaking points at this scale. The core product is entirely client-side and effectively free to serve.

### 100K DAU ($2,500-4,000/mo)

**What breaks:**

| Service | Issue | Monthly Cost |
|---------|-------|-------------|
| Clerk | Pricing cliff at 10K MAU | ~$1,800/mo |
| PostHog | 45M events/mo exceeds free tier | ~$500/mo |
| AI (Claude) | 10K reviews/day | ~$3,000/mo |
| Vercel | 15M invocations/mo | ~$300/mo |

**Fixes:** Plan Clerk-to-Better Auth migration, upgrade PostHog plan, gate AI features behind Pro tier.

### 1M DAU -- What Completely Breaks

| Service | Problem | Cost | Fix | Fixed Cost |
|---------|---------|------|-----|------------|
| Clerk | 1M MAU pricing | $18,000/mo | Better Auth (self-hosted) | ~$200/mo |
| y-websocket | 2.5 GB RAM for concurrent connections | Server OOM | Horizontal scaling + Redis Pub/Sub | ~$500/mo |
| AI (Claude) | 100K reviews/day | $25,000/mo | Gate behind Pro tier (3% conversion) | Covered by revenue |
| Vercel | 150M invocations/mo | $5,000+/mo | Self-host API routes | ~$1,000/mo |
| PostHog | 450M events/mo | $3,000+/mo | Self-host or ClickHouse pipeline | ~$500/mo |
| Email (Resend) | 1M+ transactional emails | $1,600/mo | AWS SES | ~$400/mo |

### What NEVER Breaks (Client-Side Scales for Free)

The following are purely client-side and scale to millions at near-zero marginal cost:
- Canvas rendering (React Flow)
- WASM simulation engine
- IndexedDB local storage
- ISR/static pages on CDN
- Client-side algorithm visualization

**The core product is entirely client-side and scales to millions at near-zero marginal cost.**

---

## 7. Scaling Roadmap

### Phase 1: 0-10K DAU (Weeks 1-4)

- React.memo on all node/edge components
- LOD rendering system
- Zustand selector optimization
- WASM lazy loading with code splitting
- AI request queue + prompt caching
- Bundle size monitoring in CI

### Phase 2: 10K-100K DAU (Months 2-4)

- y-websocket server deployment
- Particle path pre-computation and caching
- Edge virtualization for large diagrams
- IndexedDB compression with fflate
- Neon database scaling
- Yjs document compaction

### Phase 3: 100K-1M DAU (Months 6-12)

- Better Auth migration (eliminate Clerk costs)
- Horizontal WebSocket scaling with Redis Pub/Sub
- Self-host PostHog or build ClickHouse pipeline
- Migrate API routes off Vercel to dedicated servers
- AWS SES for transactional email

### Phase 4: 1M+ DAU (Year 2+)

- Cloudflare Durable Objects for stateful edge collaboration
- Canvas/WebGL fallback renderer for mega-diagrams
- Custom analytics pipeline
- Multi-region database replication
- CDN-based edge computation for simulation
