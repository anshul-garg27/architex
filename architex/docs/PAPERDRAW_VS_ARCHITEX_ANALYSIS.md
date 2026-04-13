# PaperDraw vs Architex — Complete Analysis

> Generated 2026-04-11 from deep research of PaperDraw's codebase, Supabase data, simulation engine, and 107 component types.

## TL;DR

**PaperDraw** = world-class simulation engine (107 components, 35 pressure counters, AI-generated topology rules, automated incident reports)
**Architex** = world-class learning platform (13 modules, 3,232 tests, 53 templates, algorithms/DS/LLD/interviews)

PaperDraw wins on: simulation depth, component breadth, chaos engineering, cost modeling, automated reports
Architex wins on: educational breadth, template count, learning paths, interview prep, algorithm visualization

---

## 1. What Is PaperDraw

- **URL**: paperdraw.dev (internally "Antigravity System Design Simulator")
- **Launched**: February 2026
- **Users**: 7,885 (Hacker News spike: 4,543 in March alone)
- **Paying**: 6 Pro subscribers (0.076% conversion — terrible)
- **Tech**: Flutter/Dart compiled to WebAssembly (CanvasKit/Skia GPU-accelerated)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **AI**: Gemini 2.5 Flash for topology-aware rule generation
- **Pricing**: Free (3 sims) / Pro (unlimited + AI)

---

## 2. Side-by-Side Comparison

### Component Types

| Category | PaperDraw | Architex | Gap |
|----------|-----------|----------|-----|
| Infrastructure | 6 (DNS, CDN, LB, API GW, WAF, Ingress) | 4 (LB, API GW, Firewall, CDN) | PD +2 |
| Compute | 3 | 4 | Architex +1 |
| Services | 9 (Auth, Notifications, Search, Analytics, Scheduler, Discovery, Config, Secrets, Feature Flags) | 0 | **PD +9** |
| Observability | 5 | 3 | PD +2 |
| Network Containers | 7 (VPC, Subnet, NAT, VPN, Service Mesh, DNS Server) | 0 | **PD +7** |
| Network Children | 11 (Routing Rules, WAF Module, Security Groups, Sidecar Proxy, etc.) | 1 (Rate Limiter) | **PD +10** |
| AI/LLM | 5 (LLM Gateway, Tool Registry, Memory Fabric, Agent Orchestrator, Safety Mesh) | 0 | **PD +5** |
| Data/Storage | 10 | 7 | PD +3 |
| Messaging | 3 | 2 | PD +1 |
| FinTech | 4 (Payment GW, Ledger, Fraud Detection, HSM) | 0 | **PD +4** |
| Security | 2 (DDoS Shield, SIEM) | 0 | **PD +2** |
| Data Engineering | 6 (ETL, CDC, Schema Registry, Batch, Feature Store, Media) | 1 | **PD +5** |
| DB Internals | 7 (Sharding, Hashing, Shard/Primary/Partition/Replica/IO Nodes) | 0 | **PD +7** |
| UML + Shapes | 15 | Separate LLD module | Different approach |
| Custom/Sketch | 6 | 1 | PD +5 |
| **TOTAL** | **107** | **~35** | **PD has 3x more** |

### Simulation Engine

| Feature | PaperDraw | Architex |
|---------|-----------|----------|
| Model | Tick-based discrete-event | Tick-based discrete-event |
| Traffic patterns | 5 (constant, sine, spike, ramp, Poisson) | 5 (identical) |
| Pressure counters | **35 per component** (CPU throttle, thread pool, event loop, connection, ephemeral ports, GC, cache staleness, etc.) | Implicit via queuing theory |
| Topology-aware rules | **741 AI-generated profiles** (Gemini 2.5 Flash) | Hardcoded cascade logic |
| Issue detection | **150+ formal issue types** (JOB-001..018, BATCH-001..017, EXT-001..019, INFRA-001..013) | Metric threshold only |
| Causal narratives | AI-generated templates: "A failure in {downstream} causes {component} to fail..." | Generic text |
| Chaos injection | **73 types** in 7 categories | ~30 types |
| Post-sim report | **Auto-generated markdown** with incident history, root cause, recommendations | None |
| Cost modeling | Per-component: costPerHour x instances x regions x replication x sharding | Basic per-component cost |
| Autoscaling sim | Scale up at 70% CPU, scale down at 30%, with lag modeling | Basic |
| Replication sim | leader-follower, leaderless, chain, sync/async | Factor only |
| Sharding sim | range, hash, geographic, custom, with hot shard detection | Count only |

### Configuration Depth

| Property | PaperDraw | Architex |
|----------|-----------|----------|
| Config properties per component | **45 unified** | ~10-15 varying |
| Load balancing algorithms | 4 (round_robin, least_conn, ip_hash, consistent_hash) | 1 (round_robin implied) |
| Replication params | 4 (factor, strategy, type, boolean) | 1 (factor) |
| Sharding params | 5 (strategy, configs, partitions, consistent hashing, boolean) | 1 (count) |
| Consistency levels | 3 (strong, causal, eventual) + quorum read/write | 1 (level only) |
| Behavior profiles | **23 SimulatesAs modes** (db_oltp, db_olap, cache_hot_path, etc.) | 0 |
| Reliability flags | 6 (circuit breaker, retries, DLQ, rate limiting, rate limit RPS, availability target) | Mostly hardcoded |

### Everything Else

| Feature | PaperDraw | Architex |
|---------|-----------|----------|
| Templates | 9 (high quality, with engineering rationale) | **53** (learning-focused) |
| Learning modules | 0 | **13** (System Design, Algorithms, DS, LLD, Database, Distributed, Networking, OS, Concurrency, Security, ML, Interview, Knowledge Graph) |
| Interview prep | None | **Dedicated module** with 82 challenges, SRS, gamification |
| Import formats | **14** (JSON, Excalidraw, draw.io, Mermaid, Terraform, YAML, C4, D2, Eraser, PNG, JPG, WebP, GIF, SVG) | 5 (JSON, draw.io, Mermaid, YAML, clipboard) |
| Export formats | **12+** (PNG, JPEG, SVG, PDF, GIF, WebM, MP4, JSON, Markdown, CSV, YAML, Excalidraw) | 6 (PNG, SVG, PDF, JSON, draw.io, WebM) |
| Collaboration | Supabase Realtime (multi-user) | Types + UI built, no backend |
| Community | Gallery with upvotes, comments, design publishing | Gallery built (mock data) |
| Canvas renderer | **GPU-accelerated** (CanvasKit/Skia WASM) | DOM-based (React Flow) |
| Tests | Unknown | **3,232** |

---

## 3. PaperDraw's Core Innovation: Topology-Aware AI Rules

This is the **single biggest differentiator**. Here's how it works:

### Profile Signature System
When you place components and connect them, PaperDraw computes a signature:
```
{componentType}|up:{upstream_types}|down:{downstream_types}|traits:{trait_list}
```
Example: `appServer|up:load_balancer|down:cache,database|traits:autoscale,is_sync_request_path`

### Two-Tier Rule Lookup
- **Tier 1**: Base catalog (78 records) — generic issues per component TYPE
- **Tier 2**: Topology overlays (741 records) — specific rules per TOPOLOGY POSITION

### AI Generation
If no matching profile exists, Gemini 2.5 Flash generates new rules containing:
- **Issues**: Code, type, title, cause, root reason, impact, recommendation, severity
- **Rule Intents**: Propagation rules with causal narrative templates and amplification factors

### Why This Matters
Same "Database" behaves differently when:
- Behind a Load Balancer (OLTP pattern) vs behind ETL Pipeline (OLAP pattern)
- With cache upstream (read-heavy) vs without (write-heavy)
- On sync request path vs async background job

**Stats**: 741 profiles, 1,035 issues, 1,034 rule intents across 66 component types

---

## 4. PaperDraw's 35 Pressure Counters

Each component tracks these independently every tick:

**Compute/Runtime**: cpuThrottleTicks, threadPoolSaturationTicks, eventLoopBlockTicks, gcPressureTicks
**Networking**: connectionPressureTicks, ephemeralPortPressureTicks, egressBlockTicks, dnsFailureTicks
**Deployment**: deployInstabilityTicks, probeFailureTicks, infraPressureTicks, autoscaleLagTicks, controlPlaneLagTicks
**Caching**: cacheStalenessTicks, visibilityRaceTicks, staleResultTicks
**Batch/Async**: batchPreemptionTicks, checkpointRiskTicks, shufflePressureTicks, batchDiskPressureTicks, batchNetworkPressureTicks, batchSkewTicks
**Queue/Job**: jobLagTicks, jobTimeoutTicks, heartbeatStallTicks, duplicateExecutionTicks, schedulerOverlapTicks, dlqTicks
**External**: dependencyTimeoutTicks, dependencyRateLimitTicks, retryPressureTicks, credentialFailureTicks, downstreamPoolPressureTicks
**Logging**: logPressureTicks

When any exceeds threshold → trigger topology-specific issue → cascade via rule intents with amplification factors.

---

## 5. PaperDraw's 73 Chaos Types

| Category | Count | Examples |
|----------|-------|---------|
| Infrastructure | 10 | AZ Failure, Data Center Outage, Instance Crash, Disk Failure, VM CPU Throttle |
| Network | 19 | Network Partition, Packet Loss, Bandwidth Throttle, TLS Expired, DNS Failure, Connection Flapping |
| Application | 10 | Memory Leak, OOM Crash, Thread Pool Exhaustion, Deadlock, GC Pause Spike |
| Data Layer | 13 | DB Primary Crash, Replication Lag, Split-Brain, Hot Shard, Lock Contention, LSM Compaction |
| Cache | 11 | Cache Poisoning, Eviction Storm, Connection Storm, OOM Surge, Memory Fragmentation |
| Traffic | 5 | Traffic Spike, Retry Storm, Bot Flood, Thundering Herd, Payload Explosion |
| Dependency | 5 | Third-Party Outage, Auth Failure, Service Discovery Failure, Queue Backlog, Clock Skew |

---

## 6. What We Should Adopt for Architex

### P0 — Must Have (Simulation Parity)

1. **Topology-Aware Rule System**
   - Compute profile signatures from node topology
   - Build a rule database (start with 50 profiles for top 10 component types)
   - Use Claude API to generate rules for new topologies
   - This is THE differentiator — without it, our simulation feels toy-like

2. **Post-Simulation Report Generation**
   - Auto-generate markdown with incident timeline, root cause, recommendations
   - Use causal narrative templates filled with actual simulation data
   - Table stakes — PaperDraw has it, we don't

3. **Formal Issue Taxonomy**
   - Create 50+ named issue types (JOB-001, BATCH-001, EXT-001, etc.)
   - Each with: code, title, cause, impact, recommendation, severity
   - Map to pressure counter thresholds

4. **Expand Pressure Counters**
   - Add 20+ counters beyond basic CPU/memory: thread pool, connection pool, GC, deployment stability, retry pressure, cache staleness
   - These drive realistic incident detection

### P1 — Should Have (Feature Parity)

5. **More Component Types**
   - Priority adds: VPC, Subnet, Service Mesh, Auth Service, Notification Service, Search Service
   - FinTech: Payment Gateway, Ledger, Fraud Detection
   - Data Engineering: ETL Pipeline, CDC Service, Schema Registry
   - Target: 60+ types (from current ~35)

6. **Deeper Config Per Component**
   - Add: replicationStrategy (leader-follower, leaderless, chain)
   - Add: shardingStrategy (range, hash, geographic)
   - Add: consistencyLevel with quorum read/write
   - Add: deliveryMode for queues (at-least-once, at-most-once, exactly-once)
   - Add: SimulatesAs profiles (at least 10: db_oltp, db_olap, cache_hot_path, etc.)

7. **More Chaos Types**
   - Target: 50+ (from current ~30)
   - Priority adds: Cache Poisoning, Eviction Storm, Replication Lag, Split-Brain, TLS Expired, Connection Flapping

8. **Real-Time Cost Calculator**
   - Always-visible cost bar: $/hr, cumulative spent, monthly projection
   - Factor in: instances x regions x replication x sharding
   - Show cost impact of autoscaling decisions

### P2 — Nice to Have (Competitive Advantages We Already Have)

9. We already beat PaperDraw on: **learning modules (13 vs 0)**, **templates (53 vs 9)**, **interview prep**, **algorithm visualization**, **data structure explorer**, **knowledge graph**, **test coverage (3,232 vs unknown)**

10. Our React/Next.js stack is more maintainable than their Flutter/Dart monolith (5.3MB JS bundle, 8,375 classes)

---

## 7. Architectural Differences

| Aspect | PaperDraw | Architex |
|--------|-----------|----------|
| Frontend | Flutter (Dart → JS/WASM) | Next.js + React + TypeScript |
| Canvas | CanvasKit (GPU-accelerated Skia) | React Flow (DOM-based) |
| State | Flutter widgets + localStorage + Supabase | Zustand + localStorage + IndexedDB |
| Backend | Supabase (PostgreSQL) | None yet (browser-only) |
| AI | Gemini 2.5 Flash (rule generation) | Mock (stubs for future API) |
| Bundle | 5.3 MB (monolithic) | Code-split (per-module lazy loading) |
| Tests | Unknown | 3,232 across 169 files |
| Rendering | 60fps GPU for 50+ components | DOM-based (slower for massive graphs) |

---

## 8. PaperDraw's Weaknesses (Our Opportunities)

1. **0.076% conversion** — their free tier is too generous (3 sims, all features)
2. **No learning platform** — just a simulation tool, no curriculum
3. **No interview prep** — huge market they're missing
4. **Only 9 templates** — we have 53
5. **5.3 MB monolithic bundle** — Flutter Web is heavy, slow initial load
6. **No algorithm visualization** — no sorting, graph, DP, tree visualizers
7. **No data structure explorer** — no interactive DS exploration
8. **No LLD studio** — no UML code generation, no design patterns
9. **Limited SEO** — no content pages for concepts, patterns, problems
10. **Poor monetization** — 6 paying users out of 7,885 signups

---

## 9. Action Plan

### Phase 1: Simulation Engine Upgrade (2-3 weeks)
- Implement profile signature computation
- Build rule database (50 profiles for top 10 component types)
- Add 20 pressure counters
- Create formal issue taxonomy (50+ types)
- Build post-simulation report generator
- Add causal narrative template system

### Phase 2: Component Expansion (1-2 weeks)
- Add 25 new component types (Services, Network, FinTech, Data Engineering)
- Deepen configuration per component (replication strategies, sharding, consistency levels)
- Add 20 more chaos types

### Phase 3: Polish (1 week)
- Always-visible cost calculator during simulation
- SimulatesAs behavior profiles (10 modes)
- Expand import/export formats
- Real-time traffic flow visualization on edges

This would bring our simulation from "prototype-grade" to "production-grade" while keeping our massive educational advantage intact.
