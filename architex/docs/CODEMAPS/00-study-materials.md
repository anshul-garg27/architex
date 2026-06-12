# Code Map 00 — Study Materials & Top-Level Curriculum

> Scope: every directory and file at the root of `/Users/a0g11b6/Downloads/projects/architex/`
> EXCEPT the nested Next.js app at `architex/architex/` (covered by Code Maps 01-09).
> This map covers the curriculum text, problem catalogs, research artifacts, prompts,
> scripts, and strategic documents that surround — and predate — the Architex platform.

---

## 1. Purpose

The repository root is a **two-layer artifact**:

1. **Layer A (this map)** — Hand-authored study and reference content for system-design
   interview prep: ~99,800 lines of markdown across foundations, core, advanced,
   specialization tiers; 30 HLD problems with 4-6 file deep-dives each; 10 LLD problems
   with Java implementations; an Uber-specific prep guide; and a parallel research
   library that drove the platform spec.
2. **Layer B (Code Maps 01-09)** — The Next.js + Drizzle + Clerk + Anthropic
   application at `architex/architex/` that turns Layer A's content into an interactive,
   simulated, AI-graded learning surface.

**Relationship — content flows from Layer A into Layer B:**

| Layer A artifact | Layer B consumer |
|---|---|
| `01-foundations/` ... `04-specialization/` notes | Source material for Architex `learn` mode lesson MDX |
| `05-hld-problems/` (30 dirs) | Drives the System Design simulator's challenge gallery + Blueprint module units |
| `06-lld-problems/` (10 dirs with Java) | Drives the LLD module's pattern + practice content; Java ↔ TypeScript / Python codegen |
| `research/` (44 files) | Spec input for `MEGA_PROMPT.md`; competitive analysis and benchmarks hardcoded as simulation defaults |
| `research/paperdraw/` | Reverse-engineered competitor (paperdraw.dev) — establishes feature parity baseline + schema for the simulator |
| `prompts/PHASE-01..10.md` | The "layered prompt" build instructions that produced the Architex codebase |
| `BUILD_PLAN.md`, `MEGA_PROMPT.md`, `ONBOARDING.md` | Strategic and onboarding context for any agent or contributor |
| `docs/PROJECT-UNDERSTANDING.md` | Most recent (2026-04-30) cross-cutting analysis of where Layer B stands |
| `docs/wireframes/`, `docs/plans/`, `docs/architecture/` | Pre-app wireframe specs + ongoing planning docs that target the platform |

**Two important boundaries:**

- **`prompts/` (this map) ≠ `architex/prompts/` (the app's runtime LLM prompts).**
  This directory holds the **build-time** PHASE prompts; the app-side directory holds
  **runtime** prompts shipped to Claude during user sessions.
- **`drizzle/` and `src/` at the repo root** contain a *parallel*, design-doc-quality
  schema tree distinct from the *actually-deployed* one inside the app. Per
  `docs/PROJECT-UNDERSTANDING.md:26`: *"Two parallel schema trees in the repo … Newcomers
  will edit the wrong tree."* This map flags them but defers their content to the app code maps.

---

## 2. Curriculum Tiers (01-foundations through 04-specialization)

Four numbered tiers ascend from estimation primitives to multi-region, ML, and chaos topics.
Each tier is a directory of topic-folders; each topic-folder contains 2-5 hand-authored
markdown files. **No exercises, no JSON, no code per se** at the tier level (LLD/HLD
problems live in tier 05/06; Java code lives in 06 and in machine-coding-practice). The
files are dense long-form interview-prep notes — comparison tables, ASCII diagrams, code
snippets in fenced blocks, and worked numerical examples. Average file length 600-900
lines; combined tier total **99,814 lines** across **132 markdown files**.

### 2.1 Tier 01 — Foundations (12 topics, 53 files)

Where every system-design conversation actually starts. The estimation framework here
(`01-foundations/01-estimation/estimation-framework.md:1-80`) is referenced by every
HLD problem's "requirements-and-estimation" file.

| Topic dir | Files | What it covers |
|---|---|---|
| `01-estimation/` | `estimation-framework.md`, `interview-cheatsheet.md`, `reference-numbers.md`, `worked-examples.md` | 5-step QPS/storage/bandwidth/cache method; powers-of-2 + powers-of-10 tables; latency numbers; peak-traffic multipliers |
| `02-architecture-styles/` | `monolith.md`, `microservices.md`, `event-driven.md`, `serverless.md`, `comparison-and-migration.md` | Tradeoffs between four canonical styles, plus a migration walkthrough |
| `03-networking-basics/` | `tcp-udp-quic.md`, `http-evolution.md`, `dns-deep-dive.md`, `tls-and-security.md`, `real-time-protocols.md` | TCP/IP fundamentals through HTTP/3, DNS hierarchy, TLS handshake, WebSocket / SSE / WebTransport |
| `04-api-design/` | `rest-api.md`, `graphql.md`, `grpc-protobuf.md`, `websockets-webhooks.md`, `api-gateway-and-patterns.md` | REST principles, GraphQL vs REST, gRPC streaming modes, gateway patterns |
| `05-sql-databases/` | `acid-and-transactions.md`, `indexing-deep-dive.md`, `isolation-levels-and-mvcc.md`, `locking-and-concurrency.md`, `scaling-sql.md` | ACID semantics, B-tree indexing, isolation level anomalies, MVCC, sharding |
| `06-nosql-databases/` | `key-value-stores.md`, `document-stores.md`, `wide-column-stores.md`, `graph-timeseries-vector-search.md`, `sql-vs-nosql-decision.md` | KV, document, wide-column, graph, TS, vector, search; decision matrix |
| `07-cap-theorem-acid-base/` | `cap-theorem.md`, `acid-vs-base.md`, `consistency-models.md` | CAP, BASE, linearizability vs eventual, monotonic reads, causal consistency |
| `08-caching/` | `caching-strategies.md`, `caching-layers.md`, `eviction-policies.md`, `cache-challenges.md`, `redis-vs-memcached.md` | Cache-aside / write-through / write-behind, LRU/LFU/ARC, stampede, thundering herd |
| `09-load-balancing/` | `algorithms.md`, `l4-vs-l7.md`, `technologies.md`, `advanced-concepts.md` | Round-robin / least-conn / consistent hash, L4 vs L7, HAProxy / NGINX / Envoy |
| `10-message-queues/` | `concepts.md`, `kafka-deep-dive.md`, `rabbitmq-and-others.md`, `event-driven-patterns.md` | Pub/sub vs queue, partitions, offsets, exchanges, dead-letter queues |
| `11-oop-solid/` | `four-pillars.md`, `solid-principles.md`, `additional-principles.md`, `relationships-and-uml-basics.md` | Encapsulation/abstraction/inheritance/polymorphism, SOLID, DRY/KISS/YAGNI, UML basics |
| `12-design-patterns-core/` | `creational-patterns.md`, `structural-patterns.md`, `behavioral-patterns.md`, `pattern-selection-guide.md` | Gang-of-Four — when to use each, when NOT to use, structure, code |

**Format characteristic:** Every file leads with a "Why this exists" or "Interview Insight"
callout, then a layered table-of-contents, then comparison tables and worked code/ASCII
examples. Reference: `01-foundations/12-design-patterns-core/creational-patterns.md:1-30`.

### 2.2 Tier 02 — Core System Design (11 topics, 41 files)

This is the heart of distributed systems theory — Kleppmann + Alex Xu Vol 1 territory,
re-told as interview-ready notes.

| Topic dir | Files | What it covers |
|---|---|---|
| `01-distributed-systems/` | `fundamentals.md`, `clocks-and-ordering.md`, `coordination-services.md`, `failure-handling.md` | Logical/vector clocks, happened-before, ZooKeeper/etcd, FLP, Byzantine |
| `02-replication-partitioning/` | `replication.md`, `partitioning.md`, `conflict-resolution.md` | Leader-follower, multi-leader, leaderless; range vs hash partitioning; LWW, Lamport, CRDTs |
| `03-consistent-hashing/` | `consistent-hashing.md`, `real-world-usage.md` | Ring construction, virtual nodes, deployment in DynamoDB / Cassandra / Discord |
| `04-cdn-blob-storage/` | `cdn.md`, `object-storage.md`, `distributed-file-systems.md` | Edge POPs, cache hierarchy, S3 / GFS / HDFS internals |
| `05-distributed-transactions/` | `two-phase-commit.md`, `saga-pattern.md`, `outbox-and-cdc.md` | 2PC blocking problem, choreography vs orchestration, transactional outbox + Debezium |
| `06-rate-limiting/` | `algorithms.md`, `distributed-rate-limiting.md`, `system-design-rate-limiter.md` | Token bucket, leaky bucket, sliding window log/counter; Redis Cluster + scripting |
| `07-unique-id-generation/` | `approaches.md`, `snowflake-deep-dive.md`, `interview-walkthrough.md` | UUID variants, Twitter Snowflake bit layout, ULID, KSUID, leaderless DB sequences |
| `08-search-systems/` | `inverted-index.md`, `elasticsearch.md`, `ranking-and-relevance.md`, `autocomplete-typeahead.md` | Postings lists, TF-IDF, BM25, Elasticsearch architecture, trie autocomplete |
| `09-all-design-patterns/` | `concurrency-patterns.md`, `enterprise-patterns.md`, `pattern-combinations.md` | Thread pool, future, actor, CQRS, repository, unit of work; combining patterns |
| `10-uml-diagrams/` | `class-diagrams.md`, `sequence-diagrams.md`, `state-diagrams.md`, `other-diagrams.md` | Notation reference; class, sequence, state, activity, deployment, component |
| `11-concurrency-basics/` | `thread-fundamentals.md`, `synchronization.md`, `concurrent-data-structures.md`, `classic-problems.md`, `async-models.md` | Threads vs processes, mutexes, semaphores, atomics, dining philosophers, async/await |

The Raft / Paxos files live one tier up in `03-advanced/01-consensus-algorithms/` —
foundations only covers logical clocks and leader election as a precursor.

### 2.3 Tier 03 — Advanced (10 topics, 33 files)

| Topic dir | Files | What it covers |
|---|---|---|
| `01-consensus-algorithms/` | `raft.md`, `paxos.md`, `other-consensus.md`, `consensus-in-practice.md` | Full Raft state machine, Multi-Paxos, Viewstamped Replication, EPaxos, where each is used |
| `03-event-sourcing-cqrs/` | `event-sourcing-deep.md`, `cqrs-deep.md`, `implementation-patterns.md` | Append-only event store, projections, snapshotting, schema evolution, axon/eventstore |
| `04-stream-processing/` | `fundamentals.md`, `kafka-streams.md`, `flink.md`, `real-world-architectures.md` | Stateful streams, watermarks, exactly-once, KStreams vs Flink, Lambda vs Kappa |
| `05-microservices-patterns/` | `service-communication.md`, `resilience-patterns.md`, `service-mesh.md`, `decomposition-and-migration.md` | Circuit breaker, bulkhead, retry-with-jitter, Istio/Linkerd, strangler fig |
| `06-database-internals/` | `b-plus-tree.md`, `lsm-tree.md`, `lsm-vs-btree.md`, `wal-and-recovery.md` | B+ tree node operations, LSM memtable + SSTable + compaction, WAL replay |
| `07-geospatial-indexing/` | `geohash.md`, `quadtree.md`, `s2-h3-rtree.md`, `proximity-search-design.md` | Geohash bit interleave, quadtree split, Google S2, Uber H3, R-tree |
| `08-observability/` | `three-pillars.md`, `monitoring-stack.md`, `opentelemetry.md`, `sli-slo-sla.md` | Metrics + logs + traces; Prometheus/Grafana, OTEL collector, error budgets |
| `09-security/` | `authentication.md`, `authorization.md`, `encryption-and-data-security.md` | OAuth 2.1 / OIDC, RBAC vs ABAC, KMS, TLS termination, mTLS |
| `10-ddd/` | `strategic-patterns.md`, `tactical-patterns.md`, `ddd-in-practice.md` | Bounded contexts, ubiquitous language, aggregates, repositories, anti-corruption layers |
| `11-clean-architecture/` | `clean-architecture.md`, `hexagonal-architecture.md`, `onion-and-comparison.md` | Ports & adapters, dependency rule, comparing Uncle Bob vs Cockburn vs Palermo |

Note the missing `02-` slot — the topic that would have lived there has been folded into
adjacent dirs; dir numbering is non-contiguous by design.

### 2.4 Tier 04 — Specialization (8 topics, 22 files)

| Topic dir | Files | What it covers |
|---|---|---|
| `01-ml-system-design/` | `ml-pipelines-and-serving.md`, `feature-stores.md`, `recommendation-systems.md`, `llm-and-rag.md` | Training + serving topology, Feast/Tecton, candidate gen + ranking, vLLM + RAG |
| `02-real-time-systems/` | `live-streaming.md`, `collaboration.md`, `presence-and-notifications.md` | HLS/DASH, WebRTC, OT vs CRDT for collab, push notification architecture |
| `03-payment-systems/` | `payment-fundamentals.md`, `idempotency-and-reliability.md`, `fraud-and-compliance.md` | Card networks, idempotency keys, ledger DB design, PCI-DSS, fraud ML |
| `04-cloud-native/` | `twelve-factor-app.md`, `kubernetes.md`, `infrastructure-as-code.md` | 12-factor, k8s control plane, deployments / services / ingress, Terraform / Pulumi |
| `05-data-engineering/` | `etl-elt-pipelines.md`, `warehouse-lake-lakehouse.md`, `data-mesh.md` | Airflow / dbt, Snowflake / BigQuery / Databricks, mesh principles |
| `06-multi-region/` | `multi-region-architectures.md`, `disaster-recovery.md`, `data-residency-and-compliance.md` | Active-active, geo-DNS, RPO/RTO, GDPR, data sovereignty |
| `07-chaos-engineering/` | `principles-and-practice.md`, `tools-and-implementation.md` | Netflix Simian Army, Gremlin, Litmus, game days |
| `08-machine-coding-practice/` | `machine-coding-guide.md`, `parking-lot-solution.md`, `elevator-system-solution.md`, `more-problems-templates.md` | The "live coding for 90 minutes" round; full Java parking-lot at 1029 lines |

`04-specialization/08-machine-coding-practice/parking-lot-solution.md:1-30` opens with:
*"The #1 most asked machine coding problem at Uber India. If you prepare only one
problem, prepare this one."* This file is referenced by the LLD module's practice tab.

---

## 3. HLD Problem Catalog (`05-hld-problems/`)

30 problem directories, each containing 3-6 markdown files. Standard layout per problem:
- `requirements-and-estimation.md` — clarifying questions, FRs, NFRs, back-of-envelope, API
- `high-level-design.md` — architecture diagram (Mermaid), component deep-dive, data flow, DB design
- `deep-dive-and-scaling.md` — bottleneck analysis, scaling strategy, failure modes, alternatives
- `interview-script.md` (most problems) — minute-by-minute opening, clarifying Qs, board layout, defense
- A few have extras: `01-design-uber/` adds `interview-walkthrough-v2.md`, `scaling-and-tradeoffs.md`, `deep-dive.md`

Combined HLD line count: **94,457 lines across ~115 files**. Average problem dir = 3,150 lines.

| # | Problem dir | One-line summary |
|---|---|---|
| 01 | `01-design-uber` | Ride-sharing platform — connects riders + drivers, real-time location streaming at 1M+/sec, geospatial matching, surge pricing, payments. The flagship Uber India problem |
| 02 | `02-design-whatsapp` | Real-time messaging at billion-user scale; one-to-one + group chat; presence; delivery receipts; voice/video and Stories explicitly out of scope |
| 03 | `03-design-youtube` | Global video streaming — upload, transcode, store, stream — exabyte storage, billions of views/day, ABR with low startup latency at planetary CDN scale |
| 04 | `04-design-twitter` | Tweet posting + home timeline — fan-out strategy is the central tradeoff; follow/unfollow + search included; 4-step interview framework structure |
| 05 | `05-design-notification-system` | Multi-channel push / SMS / email / in-app notification infrastructure used cross-cutting by every product team — providers, retries, scheduling |
| 06 | `06-design-rate-limiter` | Production-grade rate limiter (Uber/Stripe/Cloudflare style); token bucket + sliding window; tiered limits; Redis-distributed |
| 07 | `07-design-url-shortener` | TinyURL / bit.ly — short ID generation, 301 vs 302, click analytics, custom aliases, expiration; the canonical "small first" problem |
| 08 | `08-design-instagram` | Photo-sharing at 1B users / 500M DAU — uploads with filters, ranked feed, follow graph, Stories, Explore, hashtag search |
| 09 | `09-design-google-docs` | Real-time collaborative editor — OT vs CRDT, presence cursors, WebSocket protocol, document storage, sharing/permissions |
| 10 | `10-design-distributed-cache` | In-memory KV cluster (simplified Redis Cluster / Memcached) — sub-ms reads, consistent hashing, replication, LRU |
| 11 | `11-design-google-maps` | Mapping + navigation — tile rendering, place search, shortest path on 1B+ edge road graph, real-time traffic from GPS aggregation |
| 12 | `12-design-food-delivery` | Three-sided marketplace (customer / restaurant / driver) with 10+ state ride-like lifecycle, geosearch, ETA composition, payment splitting |
| 13 | `13-design-payment-system` | Stripe-style payment processing — merchant onboarding, payment intents, 3DS, webhooks, idempotency, ledger |
| 14 | `14-design-ticketmaster` | Event ticketing under flash-sale concurrency (Taylor Swift 500M+ tickets/year) — distributed locking, exactly-once seat allocation |
| 15 | `15-design-dropbox` | Cloud file storage + sync — block-level dedup, delta sync, conflict resolution, sharing, real-time notification |
| 16 | `16-design-amazon` | Global e-commerce — 500M product catalog, faceted search, inventory across distributed warehouses, Prime Day 100x spike, cell-based |
| 17 | `17-design-spotify` | Music streaming at hundreds of millions concurrent — gapless playback, Discover Weekly recommendations, offline + DRM, 100M track catalog |
| 18 | `18-design-airbnb` | Vacation rental — geosearch over millions of listings, calendar availability, double-booking prevention, dynamic pricing, two-sided trust |
| 19 | `19-design-stock-exchange` | NYSE / NASDAQ / LMAX — ultra-low latency matching engine, order types, market data publication, never-lose-an-order durability |
| 20 | `20-design-search-autocomplete` | Typeahead at 1B daily queries — sub-100ms top-5 suggestions, trie + ranking, offline aggregation pipeline + online serving |
| 21 | `21-design-web-crawler` | Googlebot-scale crawler (1B pages/month) — politeness, robots.txt, dedup, BFS over the web graph, freshness |
| 22 | `22-design-key-value-store` | Distributed persistent KV (DynamoDB / Cassandra / Riak) — consistent hashing, replication, quorum reads, vector clocks, gossip, Merkle, LSM |
| 23 | `23-design-message-queue` | Distributed log-based queue (Kafka / Redpanda / Pulsar) — partitions, consumer groups, broker-failure tolerance, 1M+ msg/sec |
| 24 | `24-design-metrics-monitoring` | Datadog / Prometheus / Grafana Cloud — push vs pull collection, time-series storage with downsampling, alert evaluation, dashboards |
| 25 | `25-design-nearby-friends` | Facebook Nearby Friends / Snap Map / WhatsApp Live Location — proximity service, fixed-radius friends-on-map, privacy controls |
| 26 | `26-design-task-scheduler` | Cron at planetary scale — millions of tasks, exactly-once execution, recurring schedules, priorities, retries, dependencies |
| 27 | `27-design-ad-click-aggregation` | 10B click events/day; real-time aggregation for billing + reporting; dedup; exactly-once stream processing; sub-second queries |
| 28 | `28-design-leaderboard` | Top-K and my-rank on millions of players in real time; sub-100ms; Redis sorted sets; time-scoped variants; tie-breaking |
| 29 | `29-design-logging-system` | ELK / Splunk / Datadog Logs — 500K+ lines/sec from 10K+ servers, full-text search, structured query, hot/cold tiered retention |
| 30 | `30-design-social-graph` | Facebook friend graph / LinkedIn / Twitter follow graph — billions of users, mutual friends, friends-of-friends, People-You-May-Know |

**Cross-references:** problems 04, 23, 24, 27 reference Alex Xu *System Design Interview Vol 1
& 2*; problems 01, 11, 12, 14, 25, 26 are explicitly tagged "Uber India" in the file headers.

---

## 4. LLD Problem Catalog (`06-lld-problems/`)

10 directories, each with 2-3 markdown files. Standard layout:
- `design-walkthrough.md` — problem statement, requirements, entity identification, class diagram, design patterns, design decisions
- `code.md` (most problems) — full Java implementation as a single compilable file with `// =====` section dividers; ranges from 600 to 1600 lines per file
- `interview-script.md` (some problems) — minute-by-minute interview narration
- `04-design-splitwise/` uses `implementation.md` instead of `code.md` (per-class breakdown rather than a monolithic file)

Combined LLD line count: **27,034 lines across 27 files**.

| # | Problem dir | One-line summary |
|---|---|---|
| 01 | `01-design-chess` | Two-player chess with all rules — piece-specific moves, check / checkmate / stalemate detection, undo/redo, castling, en passant, pawn promotion. Tagged "Hard, 45-60 min, Uber India" |
| 02 | `02-design-vending-machine` | Multi-product vending machine demonstrating State + Strategy + Singleton patterns; coin/note acceptance, change return, out-of-stock + insufficient-funds + cancellation handling |
| 03 | `03-design-bookmyshow` | Movie ticket booking — interactive seat maps, concurrent seat locking, Strategy/Observer/State/Factory patterns, Decorator for offers/coupons |
| 04 | `04-design-splitwise` | Group expense sharing with three split types (equal, exact, percentage), graph-based debt simplification, Strategy + Observer; "rising-frequency Uber India LLD" |
| 05 | `05-design-snake-ladder` | N-player Snake & Ladder; configurable board / snakes / ladders / dice; round-robin turns; classic Uber India SDE1/2 problem |
| 06 | `06-design-shopping-cart` | Online cart with stacked pricing rules — flat / percentage / buy-X-get-Y / category discounts, coupons, taxes; Strategy + Decorator + Observer + Builder |
| 07 | `07-design-atm` | ATM with State pattern for session lifecycle, Chain of Responsibility for cash dispensing, Strategy for transaction types, dispense algorithm |
| 08 | `08-design-hotel-booking` | Room search by date range / type / price, double-booking prevention, reservation lifecycle state machine |
| 09 | `09-design-food-ordering` | Uber Eats LLD twin to HLD problem 12 — restaurants, menu, cart, order placement, delivery assignment, full lifecycle |
| 10 | `10-design-library-management` | Books + members + lending policies, fine calculation, reservation queue, notification flow |

**Code style observation:** All Java code in `06-lld-problems/*/code.md` follows the same
template: enums first, immutable value objects, then domain entities, then strategies /
states / observers, then a `Game` or service orchestrator, then a `main()` demo. Reference:
`06-lld-problems/01-design-chess/code.md:1-60`, lines 1-1525 total.

---

## 5. Uber Prep (`07-uber-prep/`)

Contains a single file — `uber-interview-prep.md` (48,127 bytes, 1,044 lines) — which is
**identical in name and content** to the top-level `uber-interview-prep.md`. Per
`07-uber-prep/uber-interview-prep.md:1-100`:

- Sections: 9 — Uber India interview process, LeetCode questions (most-recent / 3-month / all-time 300+), Uber India HLD list (25+), Uber India LLD list (30+), Uber internal-system → interview-question mapping, DSA topics & patterns, evaluation criteria, 8-week prep roadmap
- Sources: GitHub LeetCode scrapers (snehasishroy, krishnadey30, liquidslr, dataengineervishal — Feb 2026 snapshot), GeeksforGeeks, Glassdoor, Blind, Reddit, Medium, LinkedIn
- Round structure: Recruiter screen → OA → DSA1 → DSA2 → LLD/Machine Coding → HLD → Hiring Manager / Bar Raiser
- Targets: 150-200 LeetCode problems, daily 5-10 problems, 2x/week mocks, CodeSignal 800+/840
- The "MUST DO" table at the top lists 18 problems with 87.5%-100% recent frequency (Hit Counter, Min Edge Reversals, Number of Islands II, etc.)

**De-duplication note:** Two copies of this file exist at root and inside `07-uber-prep/`.
Both bytes-identical. The directory wrapper exists to keep numbered tier alignment
(01..07) consistent for any tooling that walks the tree.

---

## 6. Research (`research/` and `research/paperdraw/`)

### 6.1 `research/` (44 files, ~31,500 lines)

The research library was generated by 21 parallel research agents in April 2026 plus
later expansion. Files 01-21 are core platform research; 22-* are content/design
specialization; 26+ are growth and meta. Per `research/README.md:55-69`:
*"21 research agents running in parallel. Total research volume ~150,000+ words. Tools
analyzed: 100+. Platforms compared: 20+."*

| File range | Theme | Notable contents |
|---|---|---|
| `01-04` | Tooling landscape | DSA viz platforms, system-design tools, LLD/OS/DB tools, tech-stack recommendations |
| `05-09` | Domain-specific viz | Networking/security viz, concurrency/ML/devops tools, interview gamification, distributed-systems algorithms, 55+ real-world case studies |
| `10-15` | Implementation depth | UI/UX patterns, animation techniques, export/sharing/persistence, competitive analysis (20+ platforms), accessibility, testing/deployment |
| `16-21` | Hardcore/advanced | Queuing theory + simulation math (Little's Law, M/M/c, USL), AI integration ($0.02-0.05/session), 29 microservices patterns, onboarding/plugins/mobile, advanced DSA, real-world benchmarks |
| `22-*` | Spec packs | The 60kB+ files in this group are full specifications: design system, content pipeline, canvas editor deep-dive, search/social/integrations, sound/microinteractions, backend infrastructure, auth/security/compliance, landing page |
| `26`, `31`, `32` | Growth | Monetization (AGPL-3.0 + $12/mo Pro), SEO content (270+ programmatic pages), analytics/email/notifications |
| `40-44` | Adversarial review | Devil's-advocate vs defense vs chief-architect 3-way debate; security threat model; scalability breaking points |
| `50` | Master task list | 1,633-line content / SEO / growth task registry — programmatic SEO pages, blog plan, email sequences, social, onboarding, templates, pricing |

Reference: `research/40-devils-advocate-review.md:9-22` shows the verdict matrix where
4 decisions get changed (Next.js, WASM, Monaco, PostHog), 2 deferred (Yjs collab, Tauri),
and 4 kept with guardrails. The actual platform shipped most of the original choices —
the debate was input, not edict.

### 6.2 `research/paperdraw/` — competitor reverse-engineering

**What it is:** A complete reverse-engineering of `paperdraw.dev`, a Flutter Web /
CanvasKit-based system-design simulator and Architex's primary competitive reference.
Captured 2026-04-11. The directory contains:

| Asset | Size / count | Purpose |
|---|---|---|
| `README.md` (286 lines) | Top-level navigation | Tech-stack table, two-schema (V1 vs V2) comparison, 37 component types catalog, 9 solutions matrix, PWA config |
| `PAPERDRAW_COMPLETE_REFERENCE.md` (32,427 bytes) | Master reference | Full feature surface |
| `PAPERDRAW_SYSTEM_DEEP_DIVE.md` (30,011 bytes) | System architecture | How the simulator actually works |
| `CODE_REVERSE_ENGINEERING.md` (13,519 bytes) | Compiled-code extraction | Cost calculation, error budget, exact formulas pulled from main.dart.js |
| `COMPONENT_SETTINGS_LOGIC.md` (17,810 bytes) | Per-component config | Capacity, instances, scaling, rate limits — what knobs exist |
| `js-analysis.md` (36,616 bytes) | JS bundle dive | 60 components, 73 chaos items, 14 protocols extracted |
| `features.md` (7,688 bytes) | Live-app features | 80+ component types, chaos categories, simulation metrics |
| `supabase-*.json` (5 files, 7.4 MB total) | Public Supabase data | Public designs, profiles, table schemas, specialization drafts, all overlays — scraped from their backend |
| `solutions/` (9 files) | Sample architectures | Ridesharing, URL shortener, AI agent orchestration, banking ledger, video streaming, data analytics, complex sample, minimal, SOS UML |
| `explanations/` (9 files) | Solution rationale | Hand-written explanations of why each component was chosen |
| `source-code/` | Flutter bundle | `main.dart.js`, `main.dart.wasm`, `flutter_bootstrap.js`, `index.html`, manifest, sitemap |
| `complete-data.json`, `browser-deep-dive.json`, `code-logic-blocks.json`, etc. | Structured extracts | Machine-readable forms of the above |

**Relationship to Architex:** PaperDraw is the *thing Architex must do better than*.
The competitor's V1 + V2 schemas, 37 component types, and chaos categories define the
parity baseline; the project's stated bet (`MEGA_PROMPT.md:42-52`) is to ship 12 modules
(vs paperdraw's one), 60+ components, WASM-powered queuing physics, and a code-editor +
visualization combo per module. The folder is read-only research input — none of its
JSON or Dart code is consumed at runtime.

---

## 7. Top-Level Prompts (`prompts/` — distinct from `architex/prompts`)

10 markdown files, **412KB combined**, named `PHASE-01-FOUNDATION.md` through
`PHASE-10-ACCESSIBILITY-PERFORMANCE-ENTERPRISE.md`. These are **build-time** prompts
that an AI agent (or human) feeds to Claude Code to generate the platform layer-by-layer.

| Phase file | Goal stated in file header |
|---|---|
| `PHASE-01-FOUNDATION.md` (33,816 bytes) | Running Next.js shell — panels, canvas, command palette, auth, DB, stores, persistence, theme, CI/CD; no features yet but the skeleton renders |
| `PHASE-02-SYSTEM-DESIGN-SIMULATOR.md` (42,060 bytes) | Drag-drop architecture canvas + WASM queuing-theory simulator + chaos injection + real-time metrics — flagship module |
| `PHASE-03-ALGORITHMS-DATA-STRUCTURES.md` (37,002 bytes) | Algorithm visualizer (240+ algos with step-by-step animation) + data structure explorer (50+ structures) |
| `PHASE-04-LLD-DATABASE-DISTRIBUTED.md` (45,774 bytes) | LLD studio (36 patterns, UML canvas, code↔diagram), Database lab (B-tree / LSM viz, query plans), Distributed systems playground (Raft / Paxos / CRDT) |
| `PHASE-05-NETWORKING-OS-CONCURRENCY-SECURITY-ML.md` (50,031 bytes) | Five remaining modules — Networking, OS, Concurrency, Security & Crypto, ML System Design |
| `PHASE-06-INTERVIEW-ENGINE-AI.md` (65,118 bytes) | Interview Engine — challenge mode, AI scoring, hints, Socratic tutor, spaced repetition, gamification |
| `PHASE-07-COLLABORATION-COMMUNITY.md` (49,337 bytes) | Yjs + PartyKit collaboration, community gallery, comments, fork/remix, profiles |
| `PHASE-08-DESKTOP-EXPORT-SEARCH-PLUGINS.md` (54,280 bytes) | Tauri v2 desktop, export pipelines (PNG / PDF / GIF / video), site search, plugin SDK |
| `PHASE-09-LANDING-SEO-LAUNCH.md` (45,220 bytes) | Landing page (Linear-dark + Stripe-anim polish), 270+ programmatic SEO pages, onboarding flow, Product Hunt + HN launch, AGPL-3.0 open source |
| `PHASE-10-ACCESSIBILITY-PERFORMANCE-ENTERPRISE.md` (52,254 bytes) | WCAG 2.2 AA compliance, performance budgets, enterprise tier (SSO, SCIM, SOC2 path) |

**Distinct from `architex/prompts/`** — that directory (covered by Code Map 05) holds
runtime LLM prompts shipped to Claude during user-facing AI features (Socratic tutor,
diagram review, postmortem generator). The prompts in **this** map were never deployed;
they're the *meta-prompt* layer that produced the codebase. `BUILD_PLAN.md` (next
section) describes how to use them.

---

## 8. Top-Level Scripts (`scripts/`)

A single TypeScript file, executable via tsx — the only build automation living
*outside* the Next.js app.

| Script | Lines | Purpose |
|---|---|---|
| `scaffold-pattern.ts` | 222 | LLD-165 utility — generates a `DesignPattern` object with `// TODO` placeholders for a given pattern name + category. Outputs valid TypeScript to stdout for paste into `architex/src/lib/lld/patterns.ts`. Categories: creational / structural / behavioral / modern / resilience / concurrency / ai-agent. Usage: `npx tsx scripts/scaffold-pattern.ts "Abstract Factory" creational` |

The script is referenced by `docs/architecture/lld-module.md:213` as the canonical way
to add a new design pattern. There are no other scripts at root — all CI / lint /
typecheck / migration scripts live inside the app at `architex/architex/`.

---

## 9. Strategic Documents

Four strategic markdowns at the repo root plus the curriculum mega-doc and a snapshot.

### 9.1 `README.md` (304 lines)

The repo's front door. Sections: repository structure, study materials tier overview
(matching tiers 01-12 with topic tables), a setup quickstart (`pnpm install` → `pnpm
db:push` → `pnpm db:seed` → `pnpm dev`), Architex feature matrix (13 modules, simulation
engine details, AI features), research overview (`architex/docs/research-findings/`),
strategy documents, interview prep coverage, environment variables, full setup-from-
scratch script, tech stack summary, AGPL-3.0 license note. **The entry point for any
human or agent landing on this repo.**

### 9.2 `BUILD_PLAN.md` (492 lines)

Subtitled "Layered Build Execution Strategy." The thesis (`BUILD_PLAN.md:1-26`):
*"The MEGA_PROMPT.md is 16,000+ words. No AI can hold all of it AND write good code …
If you paste the full prompt and say 'build this' → you get incomplete boilerplate."*
Solution: a 3-layer prompt system — Layer 1 = Context (~2,000 words pasted at session
start), Layer 2 = Task (~500-1,000 words per coding session, references one phase file),
Layer 3 = Verification (~200 words after each task). The file then walks Phase 1 task-
by-task with concrete prompt templates (Task 1.1 = project init, etc.). It is the
**HOW-to-use** companion to `MEGA_PROMPT.md`.

### 9.3 `MEGA_PROMPT.md` (2,367 lines, 121,593 bytes)

The original full platform specification — the "what to build" document that
`BUILD_PLAN.md` references. Structure (`MEGA_PROMPT.md:1-120`): Project Vision &
Philosophy → Architecture Debate Verdicts (from 7 review agents) → Tech Stack & Architecture
→ Module specifications for all 12 modules → Cross-cutting concerns. Notable
declarations: build scope is "FULL V3 — ALL 12 MODULES FROM DAY 1, no phased MVP";
queuing theory is "from day 1, this is what separates a toy from credible." Lists 5 top
architectural risks, 5 critical security vulnerabilities, and 5 scalability breaking
points with their fixes. **The platform's constitution.**

### 9.4 `ONBOARDING.md` (73 lines)

Shorter, more recent. Per `ONBOARDING.md:1-50`: usage stats (55% Build Feature, 25%
Plan Design, 10% Prototype, 10% Write Docs), top skills (`/plugin` 5x/mo, `/effort`
4x/mo), top MCP server (Chrome DevTools, 69 calls), a setup checklist (codebase
descriptions, MCP servers to activate, skills to know about), and an instruction block
for Claude on how to onboard a new teammate. **The first-day-on-the-team document.**

### 9.5 `uber-interview-prep.md` (1,044 lines, identical to `07-uber-prep/uber-interview-prep.md`)

Covered in §5 above.

### 9.6 `advanced_system_design_curriculum.md` (1,886 lines, 76,418 bytes)

Per `advanced_system_design_curriculum.md:1-60`: a 40-section, 18-table-of-contents
master document compiled from "20+ sources: Alex Xu Vol 1 & 2, ByteByteGo, DDIA, Grokking
the System Design Interview, Gaurav Sen, system-design-primer, Netflix/Uber/Google/
Meta/Amazon engineering blogs." Structured in four parts: Part A (HLD, sections 1-14),
Part B (LLD, sections 15-23), Part C (Advanced & Specialized, sections 24-36), Part D
(Meta — interview framework, case studies, learning roadmap, resources). **The
single-file reference that the tier-01..04 directories were extracted from and expanded
on.** Functions as a cross-check rather than a primary source.

### 9.7 `dbl-snapshot-er.md` (84 lines)

A frozen accessibility-tree snapshot of the running app's `/database` page, captured for
regression testing. 84 lines of `uid=N_M role "label"` lines that describe the rendered
DOM structure (skip-to-main-content link, module navigation list of 13 buttons, the
ER Diagram Builder palette, 3 sample schemas, cross-module bridges section, etc.). Used
as a fixture for accessibility audits and visual regression. Belongs adjacent to the
app, not strictly under "study materials," but lives at root for historical reasons.

### 9.8 Phase-progress trackers — `.progress-phase-1.md` through `.progress-phase-4.md`

Hidden files (leading dot) that track LLD-module phase work — Phase 1 (mode scaffolding),
Phase 2 (Learn mode), Phase 3 (Build mode), Phase 4 (Drill mode). Each tracker lists
20-30 completed tasks with commit SHAs, lint/test/typecheck baselines, deviations from
the plan, and commit-by-commit status. Phase 4 ended 2026-04-21; the platform then
absorbed several days of drill-mode bug-fix commits (per recent `git log`). These
trackers map 1:1 to the plan files in `docs/superpowers/plans/2026-04-20-lld-phase-*.md`.

### 9.9 `tasks-sds-326-380.json` and `tasks_sds_381_468.json`

Two large JSON task boards (165KB + 148KB). The naming "sds-XXX" suggests system-design-
study task IDs 326-468. Likely consumed by a task-tracking workflow (presumably
`docs/tasks/` infrastructure inside the app). Not surveyed in detail — they're data,
not narrative.

---

## 10. Project Meta — `docs/PROJECT-UNDERSTANDING.md`, plans, wireframes, architecture

### 10.1 `docs/PROJECT-UNDERSTANDING.md` (903 lines, generated 2026-04-30)

The most current and most synthesized cross-cutting document in the repo. Generated by
a 10-agent parallel sweep (frontend / backend / database / API / UI-UX / design /
features / product / PM / infra). Three of those ten agents (design system, API surface,
infra/ops) "hit a persistent OneDrive FileProvider wedge" during their run — those
three sections are partially reconstructed from cross-cutting data and **flagged
LOW-MEDIUM confidence inline**. The other seven sections are HIGH confidence.

Section structure (`docs/PROJECT-UNDERSTANDING.md:36-49`):
1. Product Positioning
2. Feature Inventory
3. UI / UX Flows
4. Design System (LOW-MEDIUM confidence)
5. Frontend Architecture
6. Backend / Server
7. Database & Data Model
8. API Surface (LOW-MEDIUM confidence)
9. PM / Roadmap Lens
10. Infra / Ops / DX (LOW-MEDIUM confidence)
11. Cross-cutting Observations
12. Open Questions for the Owner

Top-of-document executive summary calls out three risks: **strategy ↔ code disagree**
(memory says old LLD frozen, but recent commits are 5 drill bug fixes); **two parallel
schema trees** (root-level `drizzle/` + `src/db/schema/` vs `architex/src/db/schema/`);
**hand-authored content is the velocity ceiling** for the new Blueprint module (SP3
produced exactly 1 unit). Top three bets next 4 weeks: stop shipping new code on
`/modules/lld`, shift focus to Blueprint SP4+SP5, and write down a concrete sunset
trigger for the old LLD.

**Freshness:** very current (5 days old at time of this map, 2026-05-07). This is the
single best document to give a new agent for a fast read of where the platform is.

### 10.2 `docs/architecture/lld-module.md` (226 lines)

Architecture overview of the LLD module — data flow Mermaid diagram, component tree,
file responsibility table (15 rows mapping "Looking for X" to a concrete file path
inside `architex/src/`), data model class diagram, and a "Where is X?" Q&A table (16
questions). All content describes code that lives **inside the app**, but the doc
itself sits at root in the curriculum tree. References:
- main hook: `useLLDModule()` at the bottom of `LLDModule.tsx` (line ~5627)
- pattern data: `lib/lld/patterns.ts`
- code generation: `lib/lld/codegen/diagram-to-typescript.ts`, `diagram-to-python.ts`
- localStorage persistence: `architex-lld-state` key
- design pattern scaffolding script: `scripts/scaffold-pattern.ts` (the one in §8)

This file is referenced by `docs/PROJECT-UNDERSTANDING.md` and is the canonical
hand-off doc for any agent touching LLD.

### 10.3 `docs/plans/`

Two large planning docs (3,321 lines combined):

| File | Lines | Subject |
|---|---|---|
| `2026-04-07-system-design-curriculum.md` | 1,613 | The "Ultimate System Design & Low-Level Design Curriculum" — 40 sections in 4 parts (Part A HLD, Part B LLD, Part C Advanced, Part D Meta). Sourced from 20+ books and engineering blogs. Functions as the master TOC the tier directories crystallize from. Substantial overlap with `advanced_system_design_curriculum.md` at the root |
| `performance-optimization-strategy.md` | 1,708 | Full performance budget for Architex — Core Web Vitals targets (LCP <2.5s, INP <100ms, CLS <0.05, TBT <200ms), canvas perf (60fps for pan/zoom, render budgets at 100/500/1000 nodes), bundle budgets (gzipped: 250KB initial, 1MB total, 300KB WASM), memory budgets, plus 1700-line implementation plan |

**Freshness:** dated 2026-04-07 and undated respectively. The curriculum plan is older
(slightly pre-dates the tier extraction); the performance doc is more current
implementation-ready.

### 10.4 `docs/wireframes/architex-wireframe-specs.md` (2,146 lines)

"Blueprint-level wireframe specs for every screen in the Architex platform — intended
as the source of truth for Figma mockup creation." Covers 22 screens: landing,
home dashboard, module selection, system-design editor, algorithm visualizer, DS
explorer, LLD studio, database lab, distributed systems playground, interview
challenge + results, template gallery + detail, learning path, profile/progress,
settings, collaboration session, community gallery, share/export dialog, command
palette overlay, onboarding, keyboard shortcut sheet. Each screen lists purpose, layout
structure (Mermaid), component list, interactions, and design tokens (Electric Indigo
`#6C5CE7`, Teal Accent `#00CEC9`, etc.).

**Freshness:** undated, but the design tokens listed (`#6C5CE7` indigo, JetBrains
Mono code, 4px base grid) **predate** the current dark-violet design system in the
deployed app (Geist Sans, `#0C0D0F` base, `#6E56CF` violet — see `BUILD_PLAN.md:67-70`).
Treat this file as historical — useful for understanding intent, but not normative for
current UI.

### 10.5 `docs/superpowers/` — sub-folder not in scope per task brief

Listed for completeness: contains `plans/2026-04-20-lld-phase-*.md` (6 phase plans for
LLD: scaffolding / learn / build / drill / review / polish-rollout) plus
`2026-04-20-sd-phase-*.md` (6 SD phase plans), and `specs/2026-04-20-lld-architect-
studio-rebuild.md` + handoff. These map directly to the `.progress-phase-N.md` trackers
at root. Belong to the app side of the build pipeline; treated by the docs but covered
in the LLD/Drill code maps.

### 10.6 Other root-level docs not in scope per brief

- `.claude/worktrees/` — Claude Code worktree state for this repo
- `.superpowers/brainstorm/` — five timestamped brainstorm sessions
- `.idea/` — JetBrains IDE config
- `drizzle/migrations/0001_custom_constraints.sql` + `drizzle.config.ts` — the parallel
  schema tree flagged as a hazard in §1
- `src/db/index.ts` + `src/db/schema/` — the other half of that parallel tree

These are flagged here so future agents know they exist; their content is not
surveyed.

---

## 11. Open Questions

1. **Tier 03's missing `02-` slot.** `03-advanced/` jumps from `01-consensus-algorithms`
   to `03-event-sourcing-cqrs` with nothing in between. Was a topic deleted, never
   authored, or absorbed into another dir? `docs/plans/2026-04-07-system-design-
   curriculum.md` lists 14 advanced sections — only 10 made it into the tree.

2. **Two copies of `uber-interview-prep.md`.** Identical bytes at repo root and inside
   `07-uber-prep/`. Is the directory wrapper intentional (numbered-tier symmetry), or
   a relic? Either consolidate to one location or document the intentional duplication.

3. **`docs/plans/2026-04-07-system-design-curriculum.md` vs `advanced_system_design_curriculum.md`.**
   Both attempt the same 40-section master TOC. Significant overlap, slight version
   drift. Which is canonical going forward? — neither is dated newer than the other in
   any obvious way (one is in docs/plans, one at root).

4. **Wireframe staleness.** `docs/wireframes/architex-wireframe-specs.md` uses an
   indigo+teal token system that doesn't match the current dark-violet `--bg #0C0D0F`
   `--accent #6E56CF` Geist-Sans system in the live app. Either the wireframe needs a
   refresh pass or it should be marked "frozen — historical."

5. **Two parallel schema trees.** Per `docs/PROJECT-UNDERSTANDING.md:26`, the
   root-level `drizzle/` + `src/db/schema/` is design-doc-quality but not deployed; the
   actually-deployed schema lives in `architex/src/db/schema/`. New contributors
   editing the wrong tree is an active hazard. Should the root copies be deleted,
   archived, or symlinked?

6. **Are `tasks-sds-326-380.json` and `tasks_sds_381_468.json` still live?** Naming
   suggests a task-tracking workflow (143 tasks total, IDs 326-468). No README explains
   what consumes them. If unused, archive; if used, document.

7. **PaperDraw research currency.** `research/paperdraw/` was scraped 2026-04-11. If
   competitive parity is still a stated goal (per `MEGA_PROMPT.md:42-52`), is there a
   refresh cadence? PaperDraw could have shipped new components / chaos events in the
   ~25 days since the scrape.

8. **`prompts/PHASE-*.md` divergence from current code.** The PHASE files describe
   the platform as it *was specified* — but `BUILD_PLAN.md:5-15` already concedes that
   you can't paste them whole. After 4+ phases of execution and bug-fix iterations, how
   closely does the running code match what these prompts asked for? Worth a one-pass
   audit before reusing them for greenfield modules.

9. **Tier 01-04 interview-cheatsheet ↔ HLD problem cross-references.** The estimation
   cheatsheets at `01-foundations/01-estimation/interview-cheatsheet.md` are referenced
   informally by tier-05 problem files but no automated index exists. A simple grep of
   "see 01-foundations/" suggests these are documentation pointers, not enforced links.

10. **Are HLD problems 03, 15, 21, 22, 28, 30 missing `interview-script.md`?** Files
    in 05-hld-problems/ vary between 3 and 6 markdown files. Problems 01, 02, 05, 06,
    10, 11, 12, 13, 25, 26 have an `interview-script.md`; the rest do not. Pattern is
    not random — Uber-tagged problems are over-represented in the with-script set.
    Conscious authoring strategy or coverage gap?
