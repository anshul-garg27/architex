# ARCHITEX — Complete Interview Prep Product Specification

> **"The only platform that prepares you for every round."**

*Compiled from 7 parallel research agents covering all 18 interview round types. Each feature rated on Learning Impact, WOW Factor, and Implementation Effort.*

---

## Overview: What This Document Covers

| Round | Agent | Features Designed | Top Priority Feature |
|-------|-------|-------------------|---------------------|
| DSA / Coding | Agent 1 | 198 features across 11 topics | Algorithm Race (split-screen comparison) |
| LLD / Machine Coding | Agent 2 | 32 features across 6 topics | Progressive Diagram Builder |
| HLD / System Design | Agent 3 | 30 features across 10 topics | Chaos Engineering Lab (unified UI) |
| Database | Agent 4 | 37 features (DB + Backend + Concurrency) | SQL Playground + EXPLAIN ANALYZE |
| Backend / API | Agent 4 | (included above) | Idempotency Key Simulator |
| Concurrency | Agent 4 | (included above) | CAS Lock-Free Visualizer |
| OS | Agent 5 | 28 features across 6 modules | Priority Inversion (Mars Pathfinder) |
| Networking | Agent 5 | (included above) | TCP Congestion Control |
| DevOps | Agent 5 | (included above) | K8s Deployment Strategies |
| Cloud | Agent 5 | (included above) | VPC Network Architecture |
| Security | Agent 5 | (included above) | OWASP Top 10 Interactive |
| SRE | Agent 5 | (included above) | SLO/Error Budget Dashboard |
| Debugging | Agent 6 | 30+ features across 5 modules | PR Review Simulator |
| Testing | Agent 6 | (included above) | Mutation-Scored Test Writer |
| Code Review | Agent 6 | (included above) | PR Review Simulator |
| Behavioral / HR | Agent 6 | (included above) | STAR Story Builder |
| Resume Deep Dive | Agent 6 | (included above) | Architecture Articulator |
| Peer Programming | Agent 7 | (pending) | AI Pair Programming Partner |

**Total features designed: 350+**
**Total features already existing in codebase: ~40%**

---

## The 8 Feature Dimensions (Applied to Every Topic)

Every feature is designed across these 8 dimensions:

| # | Dimension | What It Answers |
|---|-----------|----------------|
| 1 | **Learning** | How do you TEACH this concept visually? |
| 2 | **Simulation** | What can you SIMULATE interactively? |
| 3 | **Practice** | What CHALLENGES test application? |
| 4 | **Assessment** | How do you TEST understanding? |
| 5 | **Review** | How do you RETAIN with SRS? |
| 6 | **Reference** | Where do you LOOK IT UP quickly? |
| 7 | **Social** | How do PEERS help you learn? |
| 8 | **AI** | How does AI PERSONALIZE the experience? |

---

## MASTER PRIORITY MATRIX — Top 30 Features Across ALL Rounds

### Tier 1: CRITICAL (Define the product — build first)

| # | Feature | Round | Impact | WOW | Effort | Exists? |
|---|---------|-------|--------|-----|--------|---------|
| 1 | **Progressive Diagram Builder** (canvas builds step-by-step synced with lesson) | LLD | 10 | 10 | L | 90% built |
| 2 | **Chaos Engineering Lab** (unified UI for 30+ chaos events + cascade + narrative) | HLD | 10 | 10 | L | Engines exist, no UI |
| 3 | **Algorithm Race** (split-screen, 2 algos on same input simultaneously) | DSA | 10 | 10 | L | Partial |
| 4 | **PR Review Simulator** (GitHub-style diff with hidden bugs to find) | Code Review | 10 | 10 | XL | No |
| 5 | **"What Breaks at 10x?"** (multiply traffic, watch cascading failures) | HLD | 10 | 10 | M | WhatIfEngine exists |
| 6 | **Vector Clock Visualizer** (process timelines with happen-before) | Distributed | 10 | 10 | L | Engine 100% built |
| 7 | **CRDT Convergence Visualizer** (4 types, merge + diverge + converge) | Distributed | 10 | 10 | L | Engine 100% built |
| 8 | **Consistent Hash Ring Canvas** (virtual nodes, key redistribution) | Distributed | 9 | 9 | M | Engine 100% built |
| 9 | **STAR Story Builder** (guided behavioral answer construction + AI review) | Behavioral | 9 | 8 | M | No |
| 10 | **Learn Mode** (B+E fused scroll lesson with progressive canvas) | LLD | 10 | 10 | ~800 lines | 90% infrastructure |

### Tier 2: HIGH (Strong differentiation — build next)

| # | Feature | Round | Impact | WOW | Effort |
|---|---------|-------|--------|-----|--------|
| 11 | **Bug Hunt Simulator** (find the bug in broken code) | Debugging | 9 | 8 | L |
| 12 | **Mutation-Scored Test Writer** ("your tests killed 14/20 mutants") | Testing | 9 | 9 | L |
| 13 | **N-Complexity Slider** (drag input size 10→100K, watch complexity curve form) | DSA | 10 | 10 | M |
| 14 | **SQL Playground + EXPLAIN ANALYZE** (interactive query plan tree) | Database | 10 | 9 | L |
| 15 | **Idempotency Key Simulator** (network failure → retry → dedup) | Backend | 10 | 10 | M |
| 16 | **CAS Lock-Free Visualizer** (compare-and-swap atomic animation) | Concurrency | 10 | 10 | L |
| 17 | **K8s Deployment Strategies** (rolling update, blue-green, canary animated) | DevOps | 10 | 10 | L |
| 18 | **Circuit Breaker State Machine** (closed→open→half-open animated) | SRE | 10 | 10 | M |
| 19 | **SLO/Error Budget Dashboard** (budget depleting in real-time) | SRE | 10 | 9 | L |
| 20 | **Resume Bullet Optimizer** (AI rewrites + follow-up predictor) | Resume | 9 | 8 | M |

### Tier 3: MEDIUM (Strong features — build soon)

| # | Feature | Round | Impact | WOW | Effort |
|---|---------|-------|--------|-----|--------|
| 21 | **Cache Strategy Visualizer** (cache-aside/write-through/write-back animated) | HLD | 10 | 9 | M |
| 22 | **Pessimistic vs Optimistic Locking** (split-screen contention demo) | Database | 9 | 9 | M |
| 23 | **Buffer Pool & Page Cache** (LRU eviction with dirty page flush) | Database | 9 | 10 | L |
| 24 | **Priority Inversion** (Mars Pathfinder case study animated) | OS | 9 | 9 | S |
| 25 | **Docker Image Layer Visualizer** (build, cache, multi-stage) | DevOps | 9 | 9 | L |
| 26 | **VPC Network Architecture Builder** (subnets, gateways, security groups) | Cloud | 10 | 9 | XL |
| 27 | **Mock Behavioral Interview** (AI asks, scores STAR structure) | Behavioral | 9 | 9 | L |
| 28 | **Architecture Articulator** (describe your project → auto-diagram) | Resume | 9 | 9 | L |
| 29 | **Incident Management Timeline** (role-play as Incident Commander) | SRE | 10 | 10 | XL |
| 30 | **Multi-Source BFS** (wavefronts from multiple sources, Voronoi-like) | DSA | 10 | 10 | M |

---

## What Already Exists (Leverage Before Building)

### Simulation Engines (production-ready, need UI)

| Engine | File | Status |
|--------|------|--------|
| SimulationOrchestrator (10-stage tick pipeline) | `lib/simulation/simulation-orchestrator.ts` | Complete |
| ChaosEngine (30+ events, 10 categories) | `lib/simulation/chaos-engine.ts` | Complete |
| CascadeEngine (failure propagation) | `lib/simulation/cascade-engine.ts` | Complete |
| NarrativeEngine (20 causal templates) | `lib/simulation/narrative-engine.ts` | Complete |
| WhatIfEngine (7 scenario types) | `lib/simulation/what-if-engine.ts` | Complete |
| MetricsCollector (percentiles, throughput) | `lib/simulation/metrics-collector.ts` | Complete |
| TimeTravel (frame-by-frame) | `lib/simulation/time-travel.ts` | Complete |
| CostModel (~75 component types) | `lib/simulation/cost-model.ts` | Complete |
| VectorClockSimulation | `lib/distributed/vector-clock.ts` | Complete, NO UI |
| CRDTSimulation (4 types) | `lib/distributed/crdt.ts` | Complete, NO UI |
| ConsistentHashRing | `lib/distributed/consistent-hash.ts` | Complete, NO UI |
| 35 Pressure Counters | `lib/simulation/pressure-counters.ts` | Complete |

### Algorithm Engines (step-recorded, 60+ algos)

| Category | Count | Key Engines |
|----------|-------|-------------|
| Sorting | 16 | Quick, Merge, Heap, Tim, Radix |
| Graph | 18 | BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim, Tarjan SCC, Floyd-Warshall |
| Tree | 12 | BST, AVL, Red-Black, B-Tree, Trie, Segment Tree, Fenwick |
| DP | 11 | LCS, Edit Distance, Knapsack, Coin Change, LIS, Matrix Chain |
| String | 4 | KMP, Rabin-Karp, Boyer-Moore, Z-Algorithm |
| Backtracking | 4 | N-Queens, Sudoku, Knight's Tour, Subsets |
| Patterns | 4 | Sliding Window, Two Pointers, Monotonic Stack, Floyd Cycle |

### Data Structure Engines (52 implementations)
Including: Array, Stack, Queue, LinkedList, BST, AVL, Red-Black, B-Tree, B+Tree, Hash Table, Skip List, Trie, Bloom Filter, Count-Min Sketch, HyperLogLog, Heap, Segment Tree, Fenwick Tree, Union-Find, LSM Tree, Consistent Hash Ring, Merkle Tree, WAL, 4 CRDTs, Vector Clock, LRU/LFU Cache, and more.

### Learning Infrastructure
| Component | Status |
|-----------|--------|
| FSRS-5 Spaced Repetition | Complete |
| WalkthroughPlayer (4 checkpoint types) | Complete |
| AutoGrader (rubric-based scoring) | Complete |
| InterviewScorer (8 dimensions) | Complete |
| SocraticTutor (4-phase) | Complete |
| FrustrationDetector | Complete |
| DifficultyScaling | Complete |
| Achievements (30+, 4 rarity tiers) | Complete |
| Streaks + XP | Complete |
| Daily Challenges | Complete |

---

## The Learning System: Learn | Build Toggle

### V1 Implementation (~800 lines)

```
[Learn | Build] toggle in toolbar

Learn Mode:
┌──────┬──────────────────────────┬──────────────────┐
│ Icon │     CANVAS               │  LESSON COLUMN   │
│ Bar  │  (progressive reveal)    │  420px scroll    │
│ 48px │  classes appear as       │  B+E fused:      │
│      │  you scroll lesson       │  intro → build   │
│      │                          │  → code → quiz   │
└──────┴──────────────────────────┴──────────────────┘

Build Mode: current layout (sidebar + canvas + properties + tabs)
```

### Files to modify:
- `ui-store.ts` → +15 lines (learnPanelOpen boolean)
- Layout component → +20 lines (conditional 420px aside)
- `GuidedLesson.tsx` → ~400 lines NEW
- `LLDCanvas.tsx` → +30 lines (highlightedClassIds prop)
- `useLLDModuleImpl.tsx` → +100 lines (toggle + state sync)

---

## New Modules Needed

| Module | Priority | Features | Effort |
|--------|----------|----------|--------|
| **Backend Engineering** | HIGH | REST Studio, JWT Deep Dive, Idempotency, Retry/Backoff, Rate Limiting, Microservices, Pagination | XL |
| **DevOps** | HIGH | Docker Layers, K8s Pod Lifecycle, K8s Deployments, CI/CD Pipeline Builder, Terraform, Linux Commands | XL |
| **Cloud** | MEDIUM | VPC Builder, IAM Policy Simulator, Auto-Scaling, Service Decision Tree, Load Balancer Comparison | XL |
| **SRE** | HIGH | SLO/Error Budget, Circuit Breaker, Incident Timeline, RCA Workshop, Chaos Panel | XL |
| **Debugging** | HIGH | Bug Hunt, Stack Trace Reader, Log Detective, Memory Leak Investigator | L |
| **Testing** | MEDIUM | Mutation Test Writer, Coverage Visualizer, TDD Kata, Edge Case Finder | L |
| **Code Review** | HIGH | PR Review Simulator, Code Smell Detector, Security Audit, Refactoring Workshop | XL |
| **Behavioral** | MEDIUM | STAR Builder, Mock Interview, Company-Specific Prep | M |
| **Resume** | MEDIUM | Architecture Articulator, Numbers Driller, Bullet Optimizer, Deep-Dive Simulator | L |

---

## The Dream Feature: Full Loop Mock Interview

Simulate an ENTIRE interview loop:
- 45 min System Design
- 30 min Coding/DSA
- 30 min Debugging/Code Review
- 30 min Behavioral

AI evaluates each round independently, then gives overall **hire/no-hire** recommendation with per-round breakdown. Company-specific format (Google, Amazon, Meta, Stripe).

**This does not exist anywhere at any price point.**

---

## Revenue Model

| Tier | Price | What's Included |
|------|-------|----------------|
| **Free** | $0 | All visualizations, 3 daily challenges, 5 SRS reviews/day |
| **Student** | $9/mo | Full access, AI features (limited), mock interviews |
| **Pro** | $19/mo | Unlimited AI, all mock interviews, company-specific prep |
| **Team** | $49/mo | Collaboration, shared diagrams, peer review, admin dashboard |

Competitive pricing: Design Gurus $119/mo, Educative $59/mo, AlgoExpert $199/yr, Hello Interview $70/session.

---

## Key Metrics

| Metric | Target |
|--------|--------|
| D1 retention | >60% |
| D7 retention | >30% |
| D30 retention | >15% |
| Learn mode completion | >70% |
| Build mode entry after Learn | >40% |
| Mock interview sessions/user/week | >2 |
| SRS review completion | >80% |
| NPS | >50 |

---

*Full detailed specs for each agent's output are saved separately. This document is the executive summary and priority matrix.*

*Research sources: 25+ published studies (Mayer, Sweller, Bjork, Kapur, Roediger, Paivio, Collins, O'Keefe, Gick), 16 competitor analyses, full Architex codebase audit across 1,000+ files.*
