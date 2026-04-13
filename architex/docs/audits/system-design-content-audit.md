# System Design Module — Content Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Sources Searched:** 60+ URLs across academic syllabi, FAANG interview data, Reddit/community pain points, professional patterns, 2026 trends, competitor coverage
**Content Directory:** `templates/system-design/` (55 templates) + 73 component types

---

## PHASE 1: INVENTORY

### Template Inventory

| # | Template | Diff | Category | Nodes | LearnSteps | Sim? | Quality |
|---|----------|------|----------|-------|------------|------|---------|
| 1 | URL Shortener | 2 | classic | 6 | 4 | Y | 5/5 |
| 2 | API Rate Limiter | 2 | infra | 5 | 3 | Y | 4/5 |
| 3 | Rate Limiter | 2 | infra | 6 | 3 | Y | 4/5 |
| 4 | Typeahead | 2 | classic | 5 | 4 | Y | 4/5 |
| 5 | Search Autocomplete | 2 | classic | 6 | 4 | N | 4/5 |
| 6 | Feature Flags | 2 | infra | 5 | 3 | Y | 3/5 |
| 7 | Authentication | 3 | infra | 7 | 4 | N | 4/5 |
| 8 | A/B Testing | 3 | infra | 8 | 4 | N | 3/5 |
| 9 | CI/CD Pipeline | 3 | infra | 7 | 4 | Y | 4/5 |
| 10 | Content Moderation | 3 | modern | 7 | 4 | N | 3/5 |
| 11 | Distributed Cache | 3 | infra | 5 | 4 | N | 5/5 |
| 12 | DNS System | 3 | infra | 6 | 4 | N | 4/5 |
| 13 | Email Service | 3 | classic | 7 | 4 | Y | 4/5 |
| 14 | Hotel Reservation | 3 | classic | 7 | 4 | Y | 4/5 |
| 15 | Image CDN | 3 | modern | 7 | 4 | N | 3/5 |
| 16 | Inventory System | 3 | modern | 7 | 4 | N | 3/5 |
| 17 | Logging System | 3 | infra | 6 | 4 | Y | 4/5 |
| 18 | Metrics & Monitoring | 3 | infra | 6 | 4 | Y | 4/5 |
| 19 | Microservices/Mesh | 3 | infra | 9 | 4 | N | 4/5 |
| 20 | Monitoring & Alerting | 3 | infra | 7 | 4 | N | 3/5 |
| 21 | **Notification System** | 3 | infra | 8 | **0** | Y | **1/5** |
| 22 | Push Notification | 3 | infra | 5 | 4 | N | 3/5 |
| 23 | Social Login | 3 | infra | 7 | 4 | N | 3/5 |
| 24 | Task Queue | 3 | infra | 7 | 4 | N | 3/5 |
| 25 | URL Shortener+Analytics | 3 | classic | 9 | 4 | N | 4/5 |
| 26 | Web Crawler | 3 | classic | 7 | 4 | Y | 5/5 |
| 27 | Distributed KV Store | 5 | infra | 7 | 4 | N | 4/5 |
| 28 | Chat System | 4 | modern | 8 | 4 | Y | 5/5 |
| 29 | Real-Time Chat | 4 | modern | 8 | 4 | N | 4/5 |
| 30 | Data Lake | 4 | infra | 6 | 4 | N | 3/5 |
| 31 | Discord | 4 | modern | 9 | 4 | N | 4/5 |
| 32 | Event Sourcing | 4 | advanced | 8 | 4 | N | 5/5 |
| 33 | Food Delivery | 4 | modern | 9 | 4 | N | 4/5 |
| 34 | Gaming Backend | 4 | modern | 7 | 4 | N | 3/5 |
| 35 | IoT Platform | 4 | modern | 6 | 4 | N | 3/5 |
| 36 | Log Analytics | 4 | infra | 6 | 4 | N | 3/5 |
| 37 | Netflix CDN | 4 | modern | 8 | 4 | N | 5/5 |
| 38 | **Payment Gateway** | 4 | modern | 7 | 4 | N | 3/5 |
| 39 | **Payment System** | 4 | modern | 7 | **0** | N | **1/5** |
| 40 | Recommendation Engine | 4 | advanced | 8 | 4 | N | 4/5 |
| 41 | Ride Sharing | 4 | advanced | 7 | 4 | N | 4/5 |
| 42 | Search Engine | 4 | advanced | 8 | **0** | Y | **2/5** |
| 43 | Social Feed | 4 | advanced | 9 | 4 | N | 4/5 |
| 44 | Spotify | 4 | modern | 9 | 4 | N | 4/5 |
| 45 | Stock Exchange | 5 | advanced | 8 | 4 | N | 4/5 |
| 46 | Ticket Booking | 4 | modern | 8 | 4 | N | 4/5 |
| 47 | Twitter/X Timeline | 4 | advanced | 8 | 5 | Y | 5/5 |
| 48 | Video Processing | 4 | modern | 8 | 4 | N | 3/5 |
| 49 | Workflow Engine | 4 | infra | 7 | 4 | N | 3/5 |
| 50 | Collaborative Editor | 5 | advanced | 7 | 4 | N | 4/5 |
| 51 | Google Search | 5 | advanced | 8 | 4 | N | 3/5 |
| 52 | **Instagram** | 5 | advanced | 10 | **0** | N | **1/5** |
| 53 | ML Pipeline | 5 | advanced | 8 | 4 | N | 5/5 |
| 54 | Uber Dispatch | 5 | advanced | 8 | 4 | N | 4/5 |
| 55 | YouTube | 5 | advanced | 10 | 4 | N | 4/5 |

**Total: 55 templates. 47 with learnSteps (85%). 15 with simulation (27%). 4 with 0 learnSteps (P0 content bugs).**

### Content Bugs (WRONG or MISSING content)

| # | Template | Issue | Severity |
|---|----------|-------|----------|
| CB-01 | Payment System | Zero learnSteps despite difficulty 4. No teaching on idempotency, exactly-once, ledger accounting. | P0 |
| CB-02 | Instagram | Zero learnSteps despite difficulty 5. No teaching on feed generation, social graph, media pipeline. | P0 |
| CB-03 | Notification System | Zero learnSteps despite difficulty 3. Simulation references non-existent nodes (dedup-service, push-provider). | P0 |
| CB-04 | Search Engine | Zero learnSteps despite difficulty 4. | P0 |
| CB-05 | Notification System | Simulation chaos scenarios reference nodes that don't exist in the template (dedup-service, push-provider) | P1 |
| CB-06 | Twitter/X | Simulation references "fanout-workers" node that doesn't exist (should be "fanout-service") | P1 |
| CB-07 | Payment System | Missing settlement layer, fraud detection, PCI compliance — real-world accuracy 2/5 | P1 |
| CB-08 | Uber Dispatch | Missing simulation config for a difficulty 5 system | P1 |

---

## PHASE 3: MASTER TOPIC LIST

Compiled from: MIT 6.5840, Stanford CS145, CMU 15-440, DDIA, Alex Xu Vol 1+2, NeetCode, ByteByteGo, HelloInterview, Codemia, DesignGurus, Educative, Reddit, Medium, HN, and 40+ additional sources.

### System Design PROBLEMS (what you build)

| # | Topic | Acad | Interview | Pain | Prof | 2026 | Competitor | Architex? | Consensus |
|---|-------|------|-----------|------|------|------|------------|-----------|-----------|
| 1 | URL Shortener | | X | | | | All | ✅ | ESSENTIAL |
| 2 | Chat/Messaging (WhatsApp) | | X | | | | All | ✅ | ESSENTIAL |
| 3 | Video Streaming (YouTube/Netflix) | | X | | | | All | ✅ | ESSENTIAL |
| 4 | Social Feed (Twitter/Instagram) | | X | | | | All | ✅ | ESSENTIAL |
| 5 | Ride-Sharing (Uber/Lyft) | | X | | | | All | ✅ | ESSENTIAL |
| 6 | Rate Limiter | | X | | X | | All | ✅ | ESSENTIAL |
| 7 | Web Crawler | | X | | | | All | ✅ | ESSENTIAL |
| 8 | Notification System | | X | | | | All | ✅ (broken) | ESSENTIAL |
| 9 | Search Autocomplete/Typeahead | | X | | | | All | ✅ | ESSENTIAL |
| 10 | Payment System | | X | | X | | Most | ✅ (broken) | ESSENTIAL |
| 11 | **Proximity/Location (Yelp)** | | X | | | | All | ❌ | **ESSENTIAL** |
| 12 | **File Storage/Sync (Dropbox)** | | X | | | | All | ❌ | **ESSENTIAL** |
| 13 | **Google Maps / Navigation** | | X | | | | Codemia | ❌ | **ESSENTIAL** |
| 14 | **TikTok / Short-Video** | | X (NEW) | | | X | Codemia | ❌ | **ESSENTIAL** |
| 15 | Ticket Booking (Ticketmaster) | | X | | | | Most | ✅ | IMPORTANT |
| 16 | Distributed Cache | X | X | X | X | | Most | ✅ | ESSENTIAL |
| 17 | Recommendation Engine | | X | | | | Most | ✅ | IMPORTANT |
| 18 | Food Delivery (DoorDash) | | X | | | | Some | ✅ | IMPORTANT |
| 19 | Collaborative Editor (Google Docs) | | X | X | | | Some | ✅ | IMPORTANT |
| 20 | **Airbnb / Marketplace** | | X | | | | Codemia | ❌ | **IMPORTANT** |
| 21 | **Design ChatGPT / LLM Service** | | X (NEW) | | | X | Educative | ❌ | **ESSENTIAL** |
| 22 | Stock Exchange / Trading | | X | | X | | HelloInt | ✅ | IMPORTANT |
| 23 | E-commerce / Inventory | | X | | | | Codemia | ✅ | IMPORTANT |
| 24 | **Ad Click Aggregator** | | X | | X | | HelloInt | ❌ | IMPORTANT |
| 25 | Hotel Reservation | | X | | | | Some | ✅ | IMPORTANT |
| 26 | **Job Scheduler** | | X | | X | | HelloInt | ⚠️ partial | IMPORTANT |
| 27 | **Online Auction** | | X | | | | HelloInt | ❌ | ADVANCED |
| 28 | **Tinder / Dating App** | | X | | | | HelloInt | ❌ | ADVANCED |
| 29 | **Coding Platform (LeetCode)** | | X | | | | HelloInt | ❌ | ADVANCED |
| 30 | **News Aggregator** | | X | | | | HelloInt | ❌ | ADVANCED |
| 31 | **Crypto Exchange** | | X | | | | Some | ❌ | ADVANCED |

### System Design CONCEPTS (what you must understand)

| # | Concept | Acad | Interview | Pain | Prof | 2026 | Competitor | Architex? | Consensus |
|---|---------|------|-----------|------|------|------|------------|-----------|-----------|
| 32 | Load Balancing (algorithms, L4/L7) | | X | | X | | All | ✅ component | ESSENTIAL |
| 33 | Caching (strategies, invalidation) | X | X | X | X | | All | ✅ component | ESSENTIAL |
| 34 | Database Sharding | X | X | X | X | | All | ✅ component | ESSENTIAL |
| 35 | Database Replication | X | X | | X | | All | ✅ component | ESSENTIAL |
| 36 | CAP Theorem / PACELC | X | X | X | | | All | ⚠️ implicit | ESSENTIAL |
| 37 | Consistent Hashing | X | X | X | X | | All | ⚠️ implicit | ESSENTIAL |
| 38 | Message Queues (Kafka, etc.) | X | X | | X | | All | ✅ component | ESSENTIAL |
| 39 | API Gateway | | X | | X | | All | ✅ component | ESSENTIAL |
| 40 | CDN | | X | | X | | All | ✅ component | ESSENTIAL |
| 41 | Consensus (Raft/Paxos) | X | | X | | | DG | ⚠️ no template | IMPORTANT |
| 42 | Distributed Transactions (2PC, Saga) | X | X | X | X | | DG | ⚠️ implicit | ESSENTIAL |
| 43 | Back-of-Envelope Estimation | | X | X | | | All | ⚠️ no tool | ESSENTIAL |
| 44 | Circuit Breaker Pattern | | | | X | | DG | ⚠️ implicit | IMPORTANT |
| 45 | Observability (metrics/logs/traces) | X | X | | X | X | Some | ✅ template | IMPORTANT |
| 46 | gRPC vs REST vs GraphQL | | X | | X | | BBG | ⚠️ edge types | IMPORTANT |
| 47 | WebSockets / SSE / Polling | | X | | X | | BBG | ⚠️ edge types | IMPORTANT |
| 48 | Bloom Filters / Probabilistic DS | X | X | | | | DG | ❌ | IMPORTANT |
| 49 | Gossip Protocol | X | | | | | DG | ❌ | ADVANCED |
| 50 | Vector Clocks / Lamport Clocks | X | | | | | DG | ❌ | ADVANCED |

### 2026 AI/LLM System Design (NEW CATEGORY)

| # | Topic | Acad | Interview | Pain | Prof | 2026 | Competitor | Architex? | Consensus |
|---|-------|------|-----------|------|------|------|------------|-----------|-----------|
| 51 | **RAG Pipeline Architecture** | | X (NEW) | X | X | X | None | ❌ | **ESSENTIAL** |
| 52 | **Vector Database System** | | X (NEW) | | X | X | None | ❌ | **ESSENTIAL** |
| 53 | **LLM Serving Infrastructure** | | X (NEW) | | X | X | None | ❌ | **EMERGING** |
| 54 | **Agentic AI System** | | X (NEW) | X | X | X | None | ⚠️ components | **EMERGING** |
| 55 | **Multi-Region Architecture** | | X | | X | X | None | ❌ | **ESSENTIAL** |
| 56 | **Edge Computing Architecture** | | | | X | X | None | ⚠️ components | EMERGING |
| 57 | **Serverless Patterns** | X | | | X | X | None | ⚠️ component | IMPORTANT |

---

## PHASE 4: GAP ANALYSIS

### CRITICAL MISSING (embarrassing gaps — all competitors have these)

| # | Topic | Consensus | Why Critical in 2026 | Who Needs It | Effort | Priority |
|---|-------|-----------|---------------------|-------------|--------|----------|
| 1 | Proximity/Location Service (Yelp) | ESSENTIAL | Top-5 FAANG question. Tests geospatial indexing. All competitors have it. | Interview candidates | M | P0 |
| 2 | File Storage/Sync (Dropbox) | ESSENTIAL | Top-10 question. Tests chunking, dedup, sync conflicts. All competitors have it. | Interview candidates | M | P0 |
| 3 | Google Maps / Navigation | ESSENTIAL | Tests graph algorithms + geospatial. Google asks it. Codemia has it. | Interview candidates | M | P0 |
| 4 | TikTok / Short-Video Platform | ESSENTIAL | #1 NEW question 2025-2026. Recommendation + video pipeline. | Interview candidates + 2026 trend | M | P0 |
| 5 | Design ChatGPT / LLM Service | ESSENTIAL | Standard question at AI companies + FAANG. No competitor has good interactive version. | AI engineers + interview candidates | L | P0 |
| 6 | RAG Pipeline Architecture | ESSENTIAL | Most-asked AI SD question 2026. 70%+ enterprise gen-AI needs this. FIRST MOVER. | AI engineers + senior engineers | M | P0 |

### IMPORTANT MISSING

| # | Topic | Why Important | Effort | Priority |
|---|-------|-------------|--------|----------|
| 7 | Vector Database Architecture | Core AI infrastructure. 30%+ enterprise adoption. | M | P1 |
| 8 | Multi-Region Architecture | Senior+ FAANG question. Active-active/passive. No competitor has it. | L | P1 |
| 9 | Airbnb / Marketplace | Two-sided marketplace. Commonly asked. | M | P1 |
| 10 | Ad Click Aggregator | Meta/Google ask it. HelloInterview has it. | M | P1 |
| 11 | Agentic AI System Design | Hottest 2026 topic. CNCF Agentics Day. Gartner: 40% adoption. | M | P1 |
| 12 | Online Auction System | Tests real-time bidding + concurrency. | M | P2 |
| 13 | Tinder / Dating App | Tests geospatial + matching. | M | P2 |
| 14 | Coding Platform (LeetCode) | HelloInterview has it. | M | P2 |
| 15 | News Aggregator | HelloInterview has it. | M | P2 |
| 16 | Crypto Exchange | Fintech interview question. | M | P2 |
| 17 | Flash Sale / High-Concurrency | Tests distributed locks. | M | P2 |
| 18 | LLM Serving Infrastructure | vLLM, quantization, GPU selection. | M | P2 |

### CONTENT BUGS (existing templates with wrong/missing content)

| # | Template | Bug | Priority |
|---|----------|-----|----------|
| 19 | Payment System | Zero learnSteps. Missing settlement layer, fraud, PCI. | P0 |
| 20 | Instagram | Zero learnSteps. No teaching on feed gen, social graph. | P0 |
| 21 | Notification System | Zero learnSteps + simulation refs non-existent nodes. | P0 |
| 22 | Search Engine | Zero learnSteps. | P0 |
| 23 | Notification System simulation | References dedup-service, push-provider nodes that don't exist. | P1 |
| 24 | Twitter simulation | References fanout-workers node that doesn't exist. | P1 |
| 25 | Payment System architecture | Missing settlement layer, no fraud detection, no PCI compliance. | P1 |

### CONCEPT GAPS (no interactive explanation)

| # | Concept | Why Needed | Priority |
|---|---------|-----------|----------|
| 26 | CAP Theorem interactive explorer | Top student pain point. ByteByteGo calls it "most misunderstood term." | P1 |
| 27 | Consistent Hashing interactive ring | Top-3 student pain point. Perfect for interactive visualization. | P1 |
| 28 | Back-of-Envelope Estimation calculator | Required in every SD interview. No interactive tool exists. | P1 |
| 29 | Distributed Transactions (Saga) visualizer | Top-5 student pain point. Choreography vs orchestration. | P1 |
| 30 | Cache Invalidation strategies comparison | "Hardest problem in CS." Write-through vs cache-aside vs write-behind. | P2 |

---

## PHASE 5: CONTENT DEPTH REVIEW (Top 10 Templates)

| Template | Correctness | Depth | Education | Real-World | Interview-Ready | Overall |
|----------|------------|-------|-----------|------------|----------------|---------|
| URL Shortener | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | **5.0** |
| Twitter/X Timeline | 5/5 | 4/5 | 5/5 | 4/5 | 5/5 | **4.6** |
| Web Crawler | 5/5 | 4/5 | 5/5 | 5/5 | 4/5 | **4.6** |
| Netflix CDN | 5/5 | 4/5 | 5/5 | 5/5 | 5/5 | **4.8** |
| ML Pipeline | 5/5 | 4/5 | 5/5 | 5/5 | 4/5 | **4.6** |
| Distributed Cache | 5/5 | 4/5 | 5/5 | 5/5 | 4/5 | **4.6** |
| Event Sourcing | 5/5 | 4/5 | 5/5 | 5/5 | 4/5 | **4.6** |
| Chat System | 5/5 | 4/5 | 5/5 | 4/5 | 5/5 | **4.6** |
| Uber Dispatch | 5/5 | 3/5 | 4/5 | 4/5 | 4/5 | **4.0** |
| **Payment System** | 3/5 | 1/5 | 1/5 | 2/5 | 2/5 | **1.8** |

---

## PHASE 6: CURRICULUM DESIGN (2026 Learning Paths)

### PATH 1: "FAANG Interview Prep" (4-week intensive)

**Week 1: Foundations** — Concepts every SD interview tests
| Day | Topic | Architex Status |
|-----|-------|----------------|
| 1 | Scalability, Load Balancing, API Gateway | ✅ HAVE (components) |
| 2 | Caching strategies, CDN, Rate Limiting | ✅ HAVE |
| 3 | Database: SQL vs NoSQL, Indexing, Replication | ✅ HAVE |
| 4 | Sharding, Consistent Hashing, CAP Theorem | ⚠️ PARTIAL (no interactive concept explainer) |
| 5 | Message Queues, Pub/Sub, Event-Driven | ✅ HAVE |
| 6 | Back-of-Envelope Estimation | ❌ NEED (no estimation tool) |
| 7 | Review + Practice (URL Shortener) | ✅ HAVE |

**Week 2: Core Problems** — Top 10 interview questions
| Day | Topic | Status |
|-----|-------|--------|
| 1 | URL Shortener + Rate Limiter | ✅ |
| 2 | Chat/Messaging System | ✅ |
| 3 | Social Feed (Twitter timeline) | ✅ |
| 4 | Notification System | ⚠️ FIX NEEDED (0 learnSteps) |
| 5 | **Proximity/Location Service** | ❌ NEED |
| 6 | **File Storage (Dropbox)** | ❌ NEED |
| 7 | Web Crawler + Search Autocomplete | ✅ |

**Week 3: Advanced Problems**
| Day | Topic | Status |
|-----|-------|--------|
| 1 | Video Streaming (YouTube/Netflix) | ✅ |
| 2 | Ride-Sharing (Uber) | ✅ |
| 3 | Payment System | ⚠️ FIX NEEDED (0 learnSteps, inaccurate) |
| 4 | **Google Maps / Navigation** | ❌ NEED |
| 5 | Ticket Booking (Ticketmaster) | ✅ |
| 6 | **TikTok / Short-Video** | ❌ NEED |
| 7 | Collaborative Editor (Google Docs) | ✅ |

**Week 4: 2026 Topics + Mock Practice**
| Day | Topic | Status |
|-----|-------|--------|
| 1 | **Design ChatGPT / LLM Service** | ❌ NEED |
| 2 | **RAG Pipeline** | ❌ NEED |
| 3 | **Multi-Region Architecture** | ❌ NEED |
| 4 | Distributed Cache + Event Sourcing | ✅ |
| 5 | Stock Exchange / Trading | ✅ |
| 6 | Mock interview practice | ✅ (mock interview mode exists) |
| 7 | Mock interview practice | ✅ |

**FAANG Prep Coverage: 20/28 days have content (71%). Need 8 new templates + 3 fixes.**

### PATH 2: "AI/ML Engineer" (NEW for 2026)

| # | Topic | Status |
|---|-------|--------|
| 1 | ML Pipeline (MLOps) | ✅ HAVE |
| 2 | **RAG Pipeline Architecture** | ❌ NEED |
| 3 | **Vector Database System** | ❌ NEED |
| 4 | **LLM Serving Infrastructure** | ❌ NEED |
| 5 | **Agentic AI System Design** | ❌ NEED |
| 6 | **Design ChatGPT** | ❌ NEED |
| 7 | Recommendation Engine | ✅ HAVE |
| 8 | Content Moderation (AI) | ✅ HAVE |

**AI/ML Path Coverage: 3/8 (37.5%). Need 5 new templates. This is the BIGGEST gap and BIGGEST opportunity.**

---

## PHASE 9: SUMMARY

### Content Completeness Score

| Level | Should Exist | We Have | Coverage | Grade |
|-------|-------------|---------|----------|-------|
| Essential (top 20 interview) | 20 | 14 | 70% | C+ |
| Important (21-35) | 15 | 9 | 60% | D+ |
| Emerging (2026 AI/LLM) | 6 | 1 (partial) | 17% | F |
| Advanced (niche) | 16 | 8 | 50% | D |
| **Total** | **57** | **32** | **56%** | **D+** |

### Top 10 Most Embarrassing Missing Topics

1. **Proximity/Location Service** — Every competitor has it. #1 gap.
2. **File Storage/Sync (Dropbox)** — Top-10 question. All competitors.
3. **Google Maps** — Google literally asks this. Codemia has it.
4. **TikTok** — #1 NEW question 2025-2026. Only Codemia has it.
5. **RAG Pipeline** — Most-asked AI question. NO competitor has interactive version.
6. **Design ChatGPT** — Standard at AI companies. Educative covers it.
7. **Payment System has 0 learnSteps** — A difficulty 4 template with NO teaching content.
8. **Instagram has 0 learnSteps** — A difficulty 5 template with NO teaching content.
9. **Multi-Region Architecture** — Senior-level differentiator. Nobody has it.
10. **Vector Database** — 30%+ enterprise adoption. Nobody has interactive version.

### Top 5 Accuracy Issues

1. **Payment System** — Missing settlement layer, fraud detection, PCI compliance (real-world accuracy: 2/5)
2. **Notification System** — Simulation references non-existent nodes (dedup-service, push-provider)
3. **Twitter simulation** — References non-existent "fanout-workers" node
4. **Uber Dispatch** — Oversimplified matching (real Uber uses ML-based batched matching)
5. **Instagram** — No feed ranking algorithm explained (real Instagram uses engagement-based ranking, not chronological)

### Top 5 Emerging Topics for 2026

1. **Agentic AI System Design** — Gartner: 40% enterprise adoption. 15 design patterns. CNCF Agentics Day.
2. **RAG Pipeline Architecture** — 70%+ enterprise gen-AI needs structured retrieval.
3. **LLM Serving Infrastructure** — vLLM, PagedAttention, quantization, GPU selection.
4. **Vector Database Architecture** — HNSW, IVF, hybrid search.
5. **AI-Native System Design** — Model tiering, context management, streaming-first.

### 2026 Readiness Score: 4/10

**What would make it 10/10:**
- Add 6 critical missing templates (Proximity, Dropbox, Maps, TikTok, ChatGPT, RAG)
- Fix 4 templates with 0 learnSteps (Payment, Instagram, Notification, Search Engine)
- Add 5 AI/LLM templates (RAG, Vector DB, LLM Serving, Agentic AI, ChatGPT)
- Add 5 interactive concept explorers (CAP, Consistent Hashing, Estimation, Saga, Cache Invalidation)
- Add simulation configs to remaining 40 templates
- Build 6 structured learning paths with progressive difficulty
