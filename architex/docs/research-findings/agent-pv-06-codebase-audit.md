I now have a complete picture. Here is the comprehensive audit.

---

# Architex Codebase Complete Audit

## Architecture Overview

Architex is a Next.js application under `/Users/anshullkgarg/Desktop/system_design/architex/`. It has 13 active modules, a full simulation engine, AI integration, gamification, and a collaboration layer. Below is the complete inventory organized by area.

---

## 1. Module Components (`src/components/modules/`)

### Module Index: 13 active modules
`/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/index.ts`

| Module | Root File | Status |
|---|---|---|
| LLD (Low-Level Design) | `LLDModule.tsx` (re-export) | Complete |
| DataStructures | `data-structures/index.tsx` | Complete |
| Algorithms | `AlgorithmModule.tsx` | Complete |
| Distributed | `DistributedModule.tsx` | Complete |
| Networking | `NetworkingModule.tsx` | Complete |
| OS | `OSModule.tsx` | Complete |
| Concurrency | `ConcurrencyModule.tsx` | Complete |
| Interview | `InterviewModule.tsx` | Complete |
| Security | `SecurityModule.tsx` | Complete |
| ML Design | `MLDesignModule.tsx` | Complete |
| Database | `DatabaseModule.tsx` | Complete |
| Knowledge Graph | `KnowledgeGraphModule.tsx` | Partial |
| Placeholder | `PlaceholderModule.tsx` | Skeleton |

### LLD Module (`src/components/modules/lld/`)
45+ files. Full breakdown:

- `canvas/LLDCanvas.tsx` — SVG-based UML class diagram canvas with zoom/pan, A\* edge routing, connection handles, minimap, AI review panel, Mermaid/PlantUML export. Complete (~700+ lines).
- `canvas/SequenceDiagramCanvas.tsx` — Animated sequence diagram with latency overlays and playback. Complete.
- `canvas/StateMachineCanvas.tsx` — State machine SVG canvas with simulation. Complete.
- `canvas/AIReviewPanel.tsx` — Floating overlay calling POST /api/ai/explain; shows detected patterns, correctness issues, suggestions. Complete.
- `canvas/Minimap.tsx` — Minimap for LLD canvas. Complete.
- `canvas/AlignmentToolbar.tsx` — Node alignment tools. Complete.
- `canvas/IdleHint.tsx` — Idle state hint overlay. Complete.
- `panels/Flashcards.tsx` — Swipeable flashcards for all 36 patterns + SOLID; front/back flip, keyboard nav, Anki CSV export. Complete.
- `panels/WalkthroughPlayer.tsx` — Step-by-step pattern walkthroughs (Brilliant.org style) with 4 checkpoint types: multiple-choice, click-class, fill-blank, order-steps. Complete.
- `panels/AutoGrader.tsx` — Rubric-based auto-grader: 4 categories (Required Classes 40pts, Relationships 30pts, Pattern Usage 20pts, Completeness 10pts), score history in localStorage, animated progress bar. Complete.
- `panels/SOLIDQuiz.tsx` — Identify SOLID violations in code snippets, streak tracking, 15-question sessions. Complete.
- `panels/PatternQuiz.tsx` / `PatternQuizFiltered.tsx` — Pattern identification quiz. Complete.
- `panels/InterviewPractice.tsx` / `InterviewPrepTab.tsx` — Practice timer + interview assessment. Complete.
- `panels/PatternComparison.tsx` / `PatternComparisonOverlay.tsx` — Side-by-side pattern comparison. Complete.
- `panels/DailyChallenge.tsx` — LLD daily challenge panel. Complete.
- `panels/StudyPlan.tsx` — Study plan panel. Complete.
- `panels/ScenarioChallenge.tsx` — Scenario-based challenge. Complete.
- `panels/MermaidEditor.tsx` — Live Mermaid editor with diagram preview. Complete.
- `panels/BidirectionalSyncPanel.tsx` — Code ↔ diagram sync panel. Complete.
- `panels/ReviewWidget.tsx` — FSRS review widget. Complete.
- `panels/StreakCounter.tsx` — Streak counter for LLD. Complete.
- `panels/SocialProof.tsx` — Social proof badges/stats. Complete.
- `panels/ConfusedWithTab.tsx` — "Confused with" clarification tab. Complete.
- `panels/SOLIDViolationSpotter.tsx` — SOLID violation spotter. Complete.
- `panels/ScreenReaderView.tsx` — Accessibility: screen reader text view. Complete.
- `panels/AutoGrader.tsx` — Auto-grader (as above). Complete.
- `panels/ContextualBottomTabs.tsx` / `LLDBottomPanels.tsx` — Tab orchestration for bottom panels. Complete.
- `panels/LLDProperties.tsx` — Properties panel for all modes. Complete.
- `sidebar/LLDSidebar.tsx` — All sidebar browsers. Complete.
- `sidebar/PatternGraph.tsx` — Force-directed graph of pattern dependencies. Complete.
- `sidebar/LearningPathMap.tsx` — Visual learning path. Complete.
- `PatternBehavioralSimulator.tsx` — Behavioral simulation of patterns in action. Complete.
- `SequenceDiagramLatencyOverlay.tsx` — Latency annotation overlay for sequence diagrams. Complete.
- `hooks/useLLDModule.ts` / `useLLDModuleImpl.tsx` / `useLLDData.ts` — Main orchestration hooks. Complete.
- `LLDDataContext.tsx` — React context for LLD content. Complete.

### Database Module (`src/components/modules/database/`)
28 files. Has 17 canvases (each a standalone animated visualization):
- ACID, ARIES, B-Tree, CAP Theorem, Connection Pooling, ER Diagram, Hash Index, Index Anti-Patterns, Join Algorithms, LSM Tree, MVCC, Normalization, Query Plan, Row/Column, SQL vs NoSQL, Star/Snowflake Schema, Transaction, Caching Patterns.
- Supporting: `ConsistencyLevelDemo.tsx`, `QueryPlanSimulation.tsx`, `ReplicationLagVisualizer.tsx`, `ShardingSimulator.tsx`, `DatabaseTour.tsx`, `DatabaseBottomPanel.tsx`, `DatabaseSidebar.tsx`, `DatabaseProperties.tsx`.
- All Complete.

### Data Structures Module (`src/components/modules/data-structures/`)
Visualizers organized into sub-categories:
- `visualizers/LinearCanvases.tsx` — Array, Stack, Queue, Linked List.
- `visualizers/TreeCanvases.tsx` — BST, AVL, Red-Black, B-Tree, Trie, Heap, Segment Tree, Fenwick, Huffman, Splay, Treap, Binomial Heap, Fibonacci Heap.
- `visualizers/HashCanvases.tsx` — Hash Table, Cuckoo Hash.
- `visualizers/GraphCanvases.tsx` — Graph traversals.
- `visualizers/HeapCanvases.tsx` — Priority Queue.
- `visualizers/ProbabilisticCanvases.tsx` — Bloom Filter, Skip List, Count-Min Sketch, HyperLogLog.
- `visualizers/SystemCanvases.tsx` — LSM Tree, Consistent Hash Ring, Merkle Tree, Write-Ahead Log, CRDT, Vector Clock.
- `visualizers/CRDTCanvases.tsx` — G-Counter, PN-Counter, OR-Set, LWW-Register.
- Interactive features: `BreakItMode.tsx`, `ReverseMode.tsx`, `ManualTrace.tsx`, `AutoQuiz.tsx`, `ComplexityQuiz.tsx`, `PredictionOverlay.tsx`, `ScenarioChallenges.tsx`, `DebuggingChallenges.tsx`, `DailyChallenge.tsx`, `InterviewPath.tsx`, `SystemRoleSelector.tsx`, `P95LatencyCalculator.tsx`, `Badges.tsx`, `VideoExport.tsx`, `WriteAmplificationVisualizer.tsx`.
- Sonification: `sonification.ts` — plays tones during algorithm steps.
- All Complete.

### Distributed Module (`src/components/modules/DistributedModule.tsx`)
Simulations for: Raft consensus, Consistent Hash Ring, Vector Clocks, Gossip Protocol, CRDTs (4 types), CAP Theorem + PACELC, Two-Phase Commit, Saga (choreography + orchestration), MapReduce, Lamport Timestamps, Paxos + Multi-Paxos. Lazy-loaded extras: `TopologyAwareFailureModes.tsx`, `SplitBrainVisualizer.tsx`. Complete.

### OS Module (`src/components/modules/OSModule.tsx`)
CPU scheduling (FCFS, SJF, Round Robin, Priority, MLFQ), page replacement (FIFO, LRU, Optimal, Clock), deadlock detection and Banker's Algorithm, virtual memory simulation, synchronization (mutex, semaphore, reader-writer lock), memory allocation (first-fit, best-fit, worst-fit). Lazy: `GCPauseLatencyVisualizer.tsx`. Complete.

### Networking Module (`src/components/modules/NetworkingModule.tsx`)
TCP state machine, TLS 1.2 + TLS 1.3 handshake, DNS resolution (5 scenarios), HTTP/1.1 vs HTTP/2 vs HTTP/3 comparison, WebSocket lifecycle, CORS simulation, CDN flow (6 scenarios), API comparison (REST/GraphQL/gRPC), serialization comparison (JSON/Protobuf/MessagePack). Lazy: `PacketJourneySimulator.tsx`, `ConnectionPoolVisualization.tsx`. Complete.

### Security Module (`src/components/modules/SecurityModule.tsx`)
OAuth 2.0 (Auth Code + PKCE, Client Credentials, Device Auth), JWT encode/decode/validate, JWT attacks (none algorithm, token replay, JWT confusion), AES-128 round-by-round animation, Diffie-Hellman with paint analogy, TLS/HTTPS flow, certificate chain, bcrypt vs rainbow table, rate limiting algorithms (token bucket, sliding window, leaky bucket), DDoS simulation, web attacks (SQLi, XSS, CSRF). Lazy: `DDoSSimulationVisualizer.tsx`. Complete.

### Concurrency Module (`src/components/modules/ConcurrencyModule.tsx`)
Race conditions (unsafe/safe increment), producer-consumer, dining philosophers, event loop demos, thread lifecycle/states, goroutines + channels (5 demos), readers-writers, sleeping barber, async patterns, deadlock detection + prevention, mutex comparison (spinlock, mutex, TTAS), thread pool saturation. Lazy: `ThreadPoolSaturationVisualizer.tsx`. Complete.

### ML Design Module (`src/components/modules/MLDesignModule.tsx`)
6 modes: neural-network trainer (ReLU/Sigmoid/Tanh, circle/XOR/spiral/gaussian datasets, live loss landscape), pipeline-builder (drag-and-drop ML stages), model-serving (A/B test, canary, shadow deployment simulation), ab-testing (sample size calculator), experimentation (epsilon-greedy, UCB1, Thompson Sampling multi-armed bandits), feature-store simulation. Also: CNN visualizer (conv, pool, flatten, fully connected), dropout visualization, decision boundary canvas. Complete.

### Interview Module (`src/components/modules/InterviewModule.tsx`)
Full system design interview simulator with: challenge catalog (company-tagged), daily challenge (deterministic by date), timer with warm-resume (IndexedDB), 4-level progressive hints, AI scoring on canvas submission (8 dimensions), FSRS spaced-repetition review session, leaderboard (weekly/monthly/all-time), achievement grid, learning path view, mock interview mode, estimation pad, progress dashboard, `SimulateYourAnswerButton`, `AntiPatternAutoDetector`. Complete.

### Algorithm Module
6-file structure: `AlgorithmCanvas.tsx`, `AlgorithmBottomPanel.tsx`, `AlgorithmProperties.tsx`, `AlgorithmCanvas.tsx`, `SystemContextSelector.tsx`, `LatencyBridgePanel.tsx`, `PracticeDashboard.tsx`. Complete.

### Knowledge Graph Module (`src/components/modules/KnowledgeGraphModule.tsx`)
Force-directed graph of ~concepts across multiple domains. Uses `ConceptGraph.tsx` and `ConceptDetailPanel.tsx`. Partial — visualization works but content integration is limited.

---

## 2. Simulation Infrastructure (`src/lib/simulation/`)

34 files. This is the most technically sophisticated subsystem.

- `simulation-orchestrator.ts` — Master controller: start/pause/resume/stop/step with configurable speed. Complete.
- `metrics-collector.ts` — Real-time metrics: circular buffer for sliding-window throughput, sorted array with binary-search insertion for O(log n) percentile computation (p50/p90/p95/p99). Per-node and global aggregation. Complete.
- `traffic-simulator.ts` — Traffic generation: constant, sine-wave, spike, ramp, random patterns; Poisson sampling. Complete.
- `queuing-model.ts` — M/M/1, M/M/c queuing theory; Erlang-C; Little's Law; node simulation. Complete.
- `chaos-engine.ts` — 30+ chaos event types across 10 categories (infrastructure, network, data, traffic, dependency, application, security, resource, external, cache). Severity levels low/medium/high/critical. 35 pressure counter names. V2 amplification factors (errorAmplification, latencyAmplification, trafficAmplification, dropFraction, capacityDegradation). Visual indicators. Complete.
- `pressure-counter-tracker.ts` / `pressure-counters.ts` — 35 named system-design pressure counters (cpu, memory, disk, network, connections, threads, fileDescriptors, iops, bandwidth, queueDepth, cacheEvictions, gcPause, heapUsage, swapUsage, contextSwitches, pageFaults, tlbMisses, branchMisses, socketBacklog, diskLatency, replicationLag, lockContention, deadlockCount, openTransactions, walSize, indexBloat, vacuumLag, connectionPoolUsage, requestQueueDepth, errorBudget, retryRate, circuitBreakerTrips, rateLimitHits, timeoutRate, saturation). Complete.
- `cascade-engine.ts` — Cascade failure propagation across topology graph. Complete.
- `failure-modes.ts` — Named failure mode catalog with cascade rules. Complete.
- `what-if-engine.ts` — What-If scenario engine: clone topology, apply modification (remove-node, double-traffic, add-cache, remove-cache, scale-up, scale-down, inject-failure), run 10-tick snapshot on both, return delta metrics + insights. Complete.
- `time-travel.ts` — Frame-by-frame simulation recording and playback. Complete.
- `sla-calculator.ts` — Availability calculation from topology (used by SLADashboard). Complete.
- `capacity-planner.ts` — Back-of-envelope capacity estimation from DAU, requests/user, peak ratio, read-write ratio. Complete.
- `topology-signature.ts` — Stable topology fingerprinting for rule-database lookups. Complete.
- `issue-taxonomy.ts` — Issue catalog with detection logic per pressure counter. Complete.
- `rule-database.ts` — Topology-specific simulation rules. Complete.
- `narrative-engine.ts` — 20 causal narrative templates producing human-readable simulation event explanations with named slots. Complete.
- `cost-model.ts` — Live cost model per node type during simulation. Complete.
- `edge-flow-tracker.ts` — Per-edge request flow tracking. Complete.
- `node-service-rates.ts` — Service rate lookup by component type. Complete.
- `sim-metrics-bus.ts` / `simulation-metrics-bus.ts` — High-performance metrics pipeline with pub/sub. Complete.
- `particle-path-cache.ts` — Particle animation path caching. Complete.
- `architecture-diff.ts` — Diff two topology versions. Complete.
- `report-generator.ts` — Markdown simulation report generation. Complete.

### Canvas Overlays (`src/components/canvas/overlays/`)
- `SLADashboard.tsx` — Live availability + downtime display from topology analysis. Complete.
- `LayoutPicker.tsx` — Auto-layout algorithm selector. Complete.
- `AlignmentGuides.tsx` — Snap-to-grid alignment guides. Complete.
- `GroupZone.tsx` — Node grouping zone overlay. Complete.
- `CanvasContextMenu.tsx` — Right-click context menu. Complete.

---

## 3. AI Features

### `src/components/ai/`
- `GeneratedDiagramPreview.tsx` — Preview of AI-generated architecture. Complete.
- `ReviewOverlay.tsx` — AI review overlay for system design canvas. Complete.
- `HintPanel.tsx` — Tiered hint panel (4 levels). Complete.
- `SocraticTutor.tsx` — Socratic tutoring dialog component. Complete.

### `src/lib/ai/` (15 files)
- `claude-client.ts` — Singleton Claude client: max 3 concurrent requests, exponential backoff on 429, cost tracking per model, IndexedDB cache integration, graceful degradation without API key. Complete.
- `indexeddb-cache.ts` — IndexedDB cache for AI responses with TTL. Complete.
- `request-queue.ts` — Priority request queue. Complete.
- `cost-monitor.ts` — Per-feature cost tracking. Complete.
- `topology-rules.ts` — Static database of 20 common topologies + AI-generated rules cache + Claude Haiku fallback for unknown topologies. Never blocks simulation. Complete.
- `architecture-generator.ts` — 8 pre-built reference architectures (url-shortener, chat-app, social-feed, e-commerce, video-streaming, ride-sharing, payment-system, notification-service) + Claude Sonnet generation for free-form descriptions. Complete.
- `design-reviewer.ts` — AI design review engine. Complete.
- `interview-scorer.ts` — 8-dimension interview scoring (Scalability, Reliability, Performance, Security, Operability, Cost Efficiency, Correctness, Completeness); grade mapping (strong-hire/hire/borderline/no-hire); rule-based fallback. Complete.
- `socratic-tutor.ts` — Socratic tutoring logic. Complete.
- `hint-system.ts` — 4-level progressive hint system. Complete.
- `frustration-detector.ts` — Detects user frustration from interaction patterns. Complete.
- `eval-templates.ts` — Evaluation prompt templates. Complete.
- `parse-evaluation.ts` — Parse AI evaluation responses. Complete.
- `serialize-diagram.ts` — Serialize canvas to AI-readable format. Complete.
- `prompt-safety.ts` — Input sanitization for AI prompts. Complete.

### `src/app/api/ai/explain/route.ts`
POST endpoint: accepts UML classes + relationships, returns detected patterns, correctness issues, suggestions. Rate-limited: 10 calls/user/hour via ai_usage table. Falls back to heuristic structural analysis without API key. Complete.

---

## 4. Learning & Assessment

### FSRS Spaced Repetition (`src/lib/interview/srs.ts`)
Full FSRS implementation: ReviewCard with difficulty, stability, interval, reps, lapses, state (new/learning/review/relearning). `scheduleReview()` with full FSRS math (stability update, retrievability, difficulty mean-reversion). `getDueCards()`, `createCard()`, `getRetentionStats()`. Complete.

### Daily Challenge (`src/lib/interview/daily-challenge.ts`)
Deterministic date-seeded selection. Day-of-week difficulty mapping (Mon/Tue=easy, Wed=medium, Thu=medium-hard, Fri=hard, Sat/Sun=mixed). `getDailyChallenge()`, `getPastChallenges(n)`, `msUntilNextChallenge()`. Complete.

### Gamification (`src/lib/interview/achievements.ts`)
30 achievements in-memory (client side) + 30 in DB seed. Categories: learning, design, streak, mastery, social, exploration. `checkAchievements(userStats)`, `calculateLevel(xp)`, `getStreakStatus()`. XP level calculation. Complete.

### Leaderboard (`src/lib/interview/leaderboard.ts`)
Mock leaderboard generation (deterministic pseudo-random), period tabs (weekly/monthly/all-time), `insertUserIntoLeaderboard()` for positioning current user. UI: `LeaderboardPanel.tsx`. Complete (mock data only — no live DB backend).

### Difficulty Scaling (`src/lib/interview/difficulty-scaling.ts`)
`assessUserLevel()` from performance history, `selectNextChallenge()` adaptive selection. Complete.

### LLD-specific challenges (`src/lib/interview/lld-challenges.ts`)
LLD challenge definitions separate from system-design challenges. Complete.

### Panels for LLD
- `SRSDashboard.tsx` — FSRS card stats, due-today count, mastered count. Complete.
- `SRSReviewSession.tsx` — Full review session UI with Again/Hard/Good/Easy rating buttons, keyboard shortcuts (1-4). Complete.
- `AchievementGrid.tsx` — Grid of earned/locked achievements. Complete.
- `AchievementGallery.tsx` / `AchievementToast.tsx` — Achievement display components. Complete.
- `ProgressDashboard.tsx` — Attempt history, score charts, per-dimension breakdown. Complete.
- `LearningPathView.tsx` — Visual learning path component. Complete.
- `MockInterviewMode.tsx` — Full mock interview flow. Complete.
- `EstimationPad.tsx` — Back-of-envelope estimation scratch pad. Complete.
- `DailyChallengeCard.tsx` / `ChallengeCard.tsx` — Challenge display cards. Complete.
- `ChallengeOverlay.tsx` — Full-screen challenge modal. Complete.
- `SimulationScorePanel.tsx` — Score display after simulation-based assessment. Complete.
- `LearnMode.tsx` — Learn mode component. Complete.

### Module Progress (`src/lib/progress/module-progress.ts`)
`markFeatureExplored()`, `recordModuleVisit()`, `logActivity()`. Complete (thin utility layer).

---

## 5. Data & Content

### Database Schema (`src/db/schema/`)
11 tables:
- `users` — Auth + profile.
- `diagrams` — Saved canvas diagrams.
- `simulations` — Simulation run results.
- `progress` — Per-user, per-module, per-concept mastery scores with full FSRS fields (stability, difficulty, elapsedDays, scheduledDays, reps, lapses, fsrsState, nextReviewAt).
- `templates` — System design templates.
- `gallery` / `gallery_upvotes` — Community gallery with upvotes.
- `ai_usage` — AI API call tracking for rate limiting.
- `module_content` — Seeded learning content.
- `achievements` / `user_achievements` — Achievement definitions + per-user unlock state.
- `activity_events` — Activity log.
- `quiz_questions` — Quiz question bank.
- `diagram_templates` — LLD diagram templates.

### Seed Files (`src/db/seeds/`)
23 seed files:
- `lld.ts` — 36 patterns, 33 problems, 5 SOLID demos, 26+ quiz questions, 2 OOP demos, 10 sequence examples, 6 state machines.
- `system-design.ts` — System design content.
- `algorithms.ts` — Algorithm content.
- `data-structures.ts` — DS content.
- `database.ts` — Database concepts.
- `networking.ts` — Networking content.
- `security.ts` — Security content.
- `distributed.ts` — Distributed systems content.
- `os.ts` — OS content.
- `ml-design.ts` — ML design content.
- `concurrency.ts` — Concurrency content.
- `achievements.ts` — 30 achievement definitions.
- `pattern-walkthroughs.ts` / `pattern-walkthroughs-remaining.ts` — Step-by-step walkthroughs.
- `interview-qa.ts` / `interview-qa-remaining.ts` — Interview Q&A.
- `walkthrough-checkpoints.ts` — Checkpoint questions for walkthroughs.
- `quizzes.ts` — Quiz questions.
- `diagram-templates.ts` — LLD diagram templates.
- `java-code-gen.ts` — Java code generation seed.
- Various fix scripts: `fix-code-bugs.ts`, `fix-cardinalities.ts`, `fix-confused-with.ts`, `fix-prediction-prompts.ts`, `content-quality-fixes.ts`, `enrich-confused-with.ts`, `enrich-cardinality.ts`.

### LLD Data Files (`src/lib/lld/`)
33 files:
- `patterns.ts` — 36 design patterns (5 creational, 7 structural, 11 behavioral, 4 modern, 4 resilience, 2 concurrency, 3 ai-agent). Each has UML class defs, relationships, code samples, real-world examples, analogies, difficulty, tradeoffs, summary, "you already use this" examples.
- `problems.ts` — 33 LLD interview problems with starter UML, hints, progressive difficulty, SEO slugs, key patterns, interview frequency.
- `solid-demos.ts` — 5 SOLID demos + 26+ quiz questions.
- `problem-solutions.ts` — Reference solutions for problems.
- `pattern-enrichment.ts` — Pattern selection guide + enrichment data.
- `java-code.ts` — Java code samples for all patterns.
- `oop-demos.ts` — OOP concept demos.
- `sequence-diagram.ts` — 10 sequence diagram examples.
- `state-machine.ts` — 6 state machine examples.
- `codegen/diagram-to-typescript.ts` — UML → TypeScript generation.
- `codegen/diagram-to-python.ts` — UML → Python generation.
- `codegen/diagram-to-mermaid.ts` — UML → Mermaid generation.
- `codegen/mermaid-to-diagram.ts` — Mermaid → UML parsing.
- `codegen/code-to-diagram.ts` — TypeScript/Python → UML parsing.
- `bidirectional-sync.ts` — SyncManager for live code ↔ diagram sync.
- `grading-engine.ts` — Rubric grading: required classes (fuzzy matching), relationships (type-aware), pattern heuristics, completeness checks.
- `astar-router.ts` — A\* edge routing for canvas.
- `dagre-layout.ts` — Auto-layout using Dagre.
- `class-diagram-model.ts` — CRUD operations for UML diagram state.
- `persistence.ts` — localStorage save/load with debounced save.
- `search.ts` — Cross-content search.
- `prerequisites.ts` — Pattern prerequisite graph.
- `export-diagram.ts` — Mermaid/PlantUML export.
- `types.ts`, `index.ts`, `constants.ts`.

---

## 6. Gamification & Engagement

### Streak System
- `progress-store.ts` — `streakDays`, `lastActiveDate`, `updateStreak()` with consecutive-day logic. Persisted via localStorage. Complete.
- `StreakBadge.tsx` — Streak badge display component. Complete.
- `panels/StreakCounter.tsx` — LLD-specific streak counter. Complete.
- `lib/innovation/streak-protector.ts` — Streak protector logic. Complete.
- `innovation/StreakProtector.tsx` — UI component. Complete.

### XP System
- `progress-store.ts` — `totalXP`, `addXP()`. Persisted. Complete.
- `XPDisplay.tsx` — XP display component. Complete.
- `lib/interview/achievements.ts` — `calculateLevel(xp)`, level thresholds. Complete.

### Achievements
- `lib/interview/achievements.ts` — Client-side: 30+ achievements, `checkAchievements(UserStats)`, rarity system (common/rare/epic/legendary). Complete.
- `db/schema/achievements.ts` — DB-side: `achievements` + `user_achievements` tables. Complete.
- `db/seeds/achievements.ts` — 30 achievement definitions seeded. Complete.
- `AchievementGrid.tsx`, `AchievementGallery.tsx`, `AchievementToast.tsx` — UI. Complete.

### Leaderboard
- `lib/interview/leaderboard.ts` — Mock leaderboard engine (deterministic). Complete.
- `LeaderboardPanel.tsx` — UI with weekly/monthly/all-time tabs, rank icons, delta arrows. Complete.
- Note: no live backend — currently uses generated mock data.

### FSRS Spaced Repetition
As described above. Complete implementation at `src/lib/interview/srs.ts`. DB schema has FSRS fields in `progress` table.

### Daily Challenge
- `lib/interview/daily-challenge.ts` — Deterministic selection. Complete.
- `DailyChallengeCard.tsx` — UI card. Complete.
- `api/challenges/route.ts` — API route serving challenges. Complete.

### Skill Tree
- `lib/innovation/skill-tree.ts` — 5 tracks (Architecture, Databases, Distributed Systems, Performance, Security), 8-10 nodes per track as DAG. `checkUnlockable()`, `getTrackProgress()`. Complete.
- `innovation/SkillTree.tsx` — SVG hexagonal visualization with particle burst on unlock. Complete.

### Time Attack Mode
- `lib/innovation/time-attack.ts` — Timed challenge engine. Complete.
- `innovation/TimeAttackMode.tsx` — UI. Complete.

### Design Battle
- `lib/innovation/design-battles.ts` — Battle session logic, scoring, Elo delta. Complete.
- `innovation/DesignBattle.tsx` — Split-canvas UI (your canvas | opponent canvas), requirements checklist, submit + results. Complete.

### Weekly Challenge
- `lib/innovation/weekly-challenge.ts` — Weekly challenge rotation. Complete.

### Difficulty Adaptation
- `lib/innovation/difficulty-adaptation.ts` — Adaptive difficulty engine. Complete.

### War Stories
- `lib/innovation/war-stories.ts` — Real-world system failure case studies. Complete.
- `innovation/WarStoryViewer.tsx` / `IncidentTimeline.tsx` — UI. Complete.

---

## 7. Stores (`src/stores/`)

12 Zustand stores:

| Store | Key State | Persistence |
|---|---|---|
| `ui-store.ts` | Active module, theme, sidebar state | localStorage |
| `canvas-store.ts` | Nodes, edges, groups, selection, undo/redo (100 entries) | localStorage |
| `simulation-store.ts` | Status, metrics, metrics history (up to 1000), chaos events, heatmap, trace, console messages | Memory |
| `viewport-store.ts` | Zoom, pan position | Memory |
| `editor-store.ts` | Code editor language, content | Memory |
| `interview-store.ts` | Active challenge, timer, hints (4 levels), AI hint, evaluation; warm-resume via IndexedDB | IndexedDB |
| `progress-store.ts` | XP, streak, attempt history | localStorage |
| `notification-store.ts` | Toast notifications | Memory |
| `collaboration-store.ts` | Collaborators, cursors, selections, room ID | Memory |
| `billing-store.ts` | Subscription tier, usage | localStorage |
| `ai-store.ts` | API key (obfuscated), per-feature toggles, cost tracking, budget limit | localStorage |
| `cross-module-store.ts` | Bridge payloads, module mastery (13 modules), concept progress | localStorage |
| `snapshot-store.ts` | Versioned canvas snapshots | Memory |

---

## 8. Canvas System

### System Design Nodes (`src/components/canvas/nodes/system-design/`)
75+ node types covering: web infrastructure (Client, WebServer, AppServer, LoadBalancer, APIGateway, CDN, CDNEdge, DNS, DNSServer, Firewall), storage (Database, DocumentDB, WideColumn, GraphDB, TimeSeriesDB, SearchEngine, Storage), compute (Worker, BatchProcessor, ServerlessFunction, StreamProcessor), messaging (MessageQueue, PubSub, EventBus), observability (MetricsCollector, DistributedTracer, LogAggregator), ML (MLInference, FeatureStore, LLMGateway, AgentOrchestrator, ToolRegistry, MemoryFabric, SafetyMesh), security (RateLimiter, DDoSShield, SIEM, HSM), payment (PaymentGateway, LedgerService, FraudDetection), networking (VPC, Subnet, NATGateway, VPNGateway, IngressController, ServiceMesh, ServiceDiscovery), platform (ConfigService, SecretManager, FeatureFlags, SchemaRegistry, CDCService, ETLPipeline), distributed primitives (ShardNode, PrimaryNode, PartitionNode, ReplicaNode, InputNode, OutputNode, CoordinatorNode). Each has `SimMetricsBadge.tsx` for live simulation metrics overlay.

### Database ER Nodes: `EntityNode.tsx`, `WeakEntityNode.tsx`, `RelationshipDiamond.tsx`.

### Export System (`src/lib/export/`)
19 files covering: JSON, Mermaid, PlantUML, Terraform HCL, URL encoding (shareable links), PNG, SVG, PDF, Draw.io, Excalidraw, C4 model, GIF recorder, `ExportManager` with format registry. Complete.

---

## 9. Collaboration (`src/components/collaboration/`, `src/lib/collaboration/`)

- `LiveCursors.tsx` — Real-time cursor presence. Complete (UI only; backend not wired).
- `SelectionRings.tsx` — Per-user selection highlights. Complete.
- `PresenceBar.tsx` — Avatars of online collaborators. Complete.
- `FollowIndicator.tsx` — Follow-mode indicator. Complete.
- `lib/collaboration/collaboration-manager.ts` — WebSocket/Yjs collaboration engine. Complete (UI ready; real-time sync needs backend deployment).
- `lib/collaboration/shareable-links.ts` — Shareable link generation. Complete.
- `lib/collaboration/fork.ts` — Fork a diagram. Complete.
- `lib/collaboration/follow-mode.ts` — Follow presenter's viewport. Complete.
- `lib/collaboration/upvotes.ts` / `comments.ts` — Gallery upvotes and comments. Complete.

---

## 10. Innovation Components (`src/components/innovation/`)

10 components, all complete:
- `SkillTree.tsx` — SVG hexagonal skill tree with particle unlocks.
- `DesignBattle.tsx` — Side-by-side multiplayer design battle.
- `TimeAttackMode.tsx` — Timed speed challenge.
- `StreakProtector.tsx` — Streak protection UI.
- `DesignReview.tsx` — AI-powered design review flow.
- `ProtocolDeepDive.tsx` — Protocol deep-dive interactive explorer.
- `WarStoryViewer.tsx` — Real-world incident case studies.
- `IncidentTimeline.tsx` — Timeline visualization for incidents.
- `IntentCursor.tsx` — Intent-aware cursor (shows what action is active).
- `ExplanationTooltip.tsx` — Contextual explanation tooltip.

---

## 11. Visualization Components (`src/components/visualization/`)

- `charts/MetricsDashboard.tsx` — Combined metrics dashboard.
- `charts/ErrorRateChart.tsx` — Error rate time-series chart.
- `charts/ThroughputChart.tsx` — Throughput chart.
- `charts/LatencyPercentileChart.tsx` — p50/p90/p95/p99 latency chart.
- `charts/QueueDepthBars.tsx` — Queue depth bar chart.
- `gauges/CacheHitGauge.tsx` — Cache hit rate gauge.
- `gauges/UtilizationGauge.tsx` — Utilization gauge.
- `sparklines/Sparkline.tsx` — Mini sparkline.
- `MultiRegionMap.tsx` — Geographic multi-region deployment map.
- `SankeyDiagram.tsx` — Sankey flow diagram.
- `RegionDetailPanel.tsx` — Region detail panel.
- `distributed/RaftVisualizer.tsx`, `ConsistentHashRingVisualizer.tsx`, `VectorClockDiagram.tsx` — Dedicated distributed system visualizers.

---

## 12. API Routes (`src/app/api/`)

24 routes:
- `/api/ai/explain` — AI UML pattern analysis (rate-limited).
- `/api/evaluate` — Challenge evaluation.
- `/api/hint` — Tiered hints.
- `/api/review` — Design review.
- `/api/quiz` — Quiz questions.
- `/api/challenges` — Challenge catalog.
- `/api/diagrams` + `/api/diagrams/[id]` — CRUD for saved diagrams.
- `/api/simulations` — Simulation run persistence.
- `/api/progress` + `/api/progress/sync` — Progress tracking and sync.
- `/api/learning-path` — Learning path recommendations.
- `/api/activity` — Activity event logging.
- `/api/content` + `/api/content/[slug]` — Module content serving.
- `/api/templates` — Template catalog.
- `/api/search` — Cross-content search.
- `/api/og` + `/api/og/database` — Open Graph image generation.
- `/api/oembed` — oEmbed for embeds.
- `/api/webhooks/clerk` — Auth webhook.
- `/api/csp-report` — CSP violation reporting.
- `/api/health` — Health check.
- `/api/email-preview` — Email preview.
- `/blog/feed.xml` — RSS feed.

---

## 13. Algorithm Library (`src/lib/algorithms/`)

108 files, 240+ exported functions. Coverage:
- Sorting: bubble, insertion, selection, quick (Lomuto + Hoare), merge (top-down + bottom-up), heap, shell, counting, radix (LSD + MSD), bucket, comb, cocktail-shaker, tim, pancake, bogo.
- Graph: BFS, DFS (recursive + iterative), Dijkstra, Bellman-Ford, Floyd-Warshall, A\*, Kruskal, Prim, topological sort (DFS + Kahn), Ford-Fulkerson, bipartite check, cycle detection, Euler path, articulation points, bridges, Tarjan SCC.
- Tree: BST, AVL, Red-Black, B-Tree, B+ Tree, Trie, Segment Tree, Fenwick Tree, Huffman, Union-Find, Splay, Treap, Binomial Heap.
- DP: Fibonacci, LCS, Edit Distance, Knapsack (0/1 + fractional), Coin Change, LIS, Subset Sum, Matrix Chain, Rod Cutting, Catalan, Longest Palindrome.
- Backtracking: N-Queens, Sudoku, Knight's Tour, Subset Generation.
- String: KMP, Boyer-Moore, Z-Algorithm, Rabin-Karp.
- Geometry: Convex Hull, Closest Pair, Line Intersection.
- Patterns: Sliding Window, Two Pointers, Monotonic Stack, Floyd's Cycle Detection, Intervals.
- Probabilistic: Bloom Filter, Skip List, Count-Min Sketch, HNSW.
- Greedy: Activity Selection, Fractional Knapsack.
- Search: Binary Search.
- Design: LRU Cache.
- Vector Search: Cosine Similarity.
- Also: `playback-controller.ts`, `visualization-colors.ts`, `learning-paths.ts`, `practice/scoring.ts`, `practice/spaced-repetition.ts`, `algorithm-choreography.ts`, `graph-choreography.ts`, `tree-choreography.ts`.

---

## 14. Data Structures Library (`src/lib/data-structures/`)

52 files. All implementations are interactive (step-by-step with operation recording): Array, Stack/Queue (via array-ds), Doubly Linked List, Deque, Circular Buffer, Priority Queue, LRU Cache, LFU Cache, Hash Table (chaining + open addressing), Cuckoo Hash, BST, AVL, Red-Black, B-Tree, B+ Tree, Skip List, Trie, Bloom Filter, Count-Min Sketch, HyperLogLog, Heap (min/max), Segment Tree, Fenwick Tree, Union-Find (Disjoint Set), LSM Tree, Consistent Hash Ring, Merkle Tree, Write-Ahead Log, CRDT (GCounter, PNCounter, LWWRegister, ORSet), Vector Clock, Monotonic Stack, Rope, Interval Tree, R-Tree, Quadtree, Fibonacci Heap, Splay Tree, Treap, Binomial Heap, Suffix Array.

---

## Key Observations

**What is genuinely complete and production-quality:**
1. The LLD module is the most complete — canvas, 10+ bottom panel tabs, AI review, bidirectional sync, grading engine, walkthroughs with 4 checkpoint types, flashcards, quizzes.
2. The simulation engine is enterprise-grade — 35 pressure counters, chaos engineering, cascade failure, what-if scenarios, narrative engine, cost model, time-travel replay.
3. The algorithm + data structure libraries are extremely comprehensive — 100+ algorithms, 50+ data structures, all with step-by-step playback.
4. Gamification infrastructure is fully wired — FSRS, XP, streaks, achievements (both client and DB), leaderboard (mock), daily challenges, skill tree, design battles.
5. Export system covers 10+ formats including GIF recording.

**What is partial or skeleton:**
1. Knowledge Graph Module — visualization exists but content integration is shallow.
2. Leaderboard — mock data only, no live DB backend.
3. Collaboration — UI components are complete but real-time sync (WebSocket/Yjs) needs backend deployment.
4. `PlaceholderModule.tsx` — template for future modules.
5. Some innovation components (ProtocolDeepDive, IntentCursor) exist as UI but may not be wired into the main navigation.

**Key files for understanding the architecture:**
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/db/schema/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/export/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/distributed/index.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/simulation-store.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/chaos-engine.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/srs.ts`
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/claude-client.ts`