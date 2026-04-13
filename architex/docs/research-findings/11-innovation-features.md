# 11 — Innovation Features Specification

> Complete specifications for all 35 innovation features across AI, gamification, learning, community, and advanced visualization categories. Based on analysis of existing modules (`AlgorithmModule`, `DistributedModule`, `NetworkingModule`, `OSModule`, `ConcurrencyModule`, `InterviewModule`, `PlaceholderModule`) and simulation engine (`queuing-model`, `traffic-simulator`, `metrics-collector`, `chaos-engine`, `capacity-planner`).

---

## Existing Codebase Assets

Before specifying new features, here is what already exists and can be leveraged:

| Existing Module/Lib | Key Capabilities | Reusable For |
|---|---|---|
| `simulation/queuing-model.ts` | M/M/1, M/M/c, Erlang-C, Little's Law | Cost Calculator, What-If Engine, Capacity Planning |
| `simulation/traffic-simulator.ts` | Poisson traffic generation, timelines | Request Tracing, Heatmap, Load Testing |
| `simulation/chaos-engine.ts` | Failure injection by category/severity | Failure Explorer, War Stories |
| `simulation/capacity-planner.ts` | Capacity estimation, formatEstimate | Cost Calculator, Show-Your-Work |
| `simulation/metrics-collector.ts` | Per-node metric accumulation | SLA Dashboard, Latency Budget |
| `lib/distributed/raft.ts` | Raft consensus algorithm | Protocol Deep-Dive |
| `lib/distributed/consistent-hash.ts` | Consistent hashing with virtual nodes | Protocol Deep-Dive |
| `lib/distributed/gossip.ts` | Gossip protocol propagation | Protocol Deep-Dive |
| `lib/distributed/vector-clock.ts` | Vector clock operations | Protocol Deep-Dive, Architecture Diff |
| `lib/distributed/crdt.ts` | CRDT merge operations | Protocol Deep-Dive |
| `lib/distributed/cap-theorem.ts` | CA/CP/AP classification | Architecture Review, Concept Linker |
| `lib/algorithms/sorting/*` | 6 sorting algorithms with step recording | Algorithm visualization features |
| `lib/algorithms/playback-controller.ts` | Step-through playback | Reusable for all visualization features |
| `lib/interview/scoring.ts` | Multi-dimensional scoring | Multiplayer Battles, Daily Challenge |
| `lib/interview/srs.ts` | Spaced repetition scheduling | Difficulty Adaptation |
| `lib/interview/challenges.ts` | Challenge definitions | Daily Challenge, Time Attack |
| `lib/interview/achievements.ts` | Achievement system | Achievement Trees, Gamification |
| `lib/export/*` | JSON, Mermaid, PlantUML, Terraform, URL export | Gallery, Architecture Diff |
| `stores/simulation-store.ts` | Play/pause/stop/reset lifecycle | All simulation-based features |
| `stores/interview-store.ts` | Timer, scoring, streak state | All gamification features |
| `stores/canvas-store.ts` | Node/edge CRUD, undo/redo | All canvas-based features |

---

## AI Features (1-6)

### Feature 1: Architecture Generator

**Description:** AI-powered system that takes a natural language problem description (e.g., "Design a URL shortener that handles 100M URLs/day") and generates an initial architecture diagram on the canvas with appropriate nodes, edges, and configuration.

**Why it matters:** Eliminates the "blank canvas" problem. New users and interview candidates get a starting point to iterate on rather than building from scratch. Reduces time-to-value from minutes to seconds.

**Technical approach:**
- LLM integration via server-side API route (`/api/ai/generate`)
- Structured output using JSON mode to produce a list of nodes and edges
- Prompt engineering with few-shot examples of Architex node/edge schemas
- Post-processing: validate against `SystemDesignNodeData` types, assign positions using force-directed layout
- Stream partial results: show nodes appearing one by one with edge animations
- Model: Claude Sonnet for speed; user can toggle to Opus for quality

**Input/Output schema:**

```typescript
// Input
interface GenerateRequest {
  prompt: string;             // "Design a URL shortener for 100M URLs/day"
  constraints?: string[];     // ["must use NoSQL", "budget < $5k/month"]
  complexity?: 'simple' | 'moderate' | 'detailed';
}

// Output (streamed)
interface GenerateResponse {
  nodes: SystemDesignNodeData[];
  edges: SystemDesignEdgeData[];
  explanation: string;        // Why these components were chosen
  assumptions: string[];      // Assumptions made
}
```

**Effort:** L (2-3 weeks)
**Priority:** P0 -- flagship feature, top of marketing funnel
**Dependencies:** API route infrastructure, LLM provider integration, force-directed layout algorithm

---

### Feature 2: Socratic Tutor

**Description:** AI-powered conversational tutor embedded in the right panel that asks probing questions about the user's design rather than giving answers. "Why did you choose a relational database here?" "What happens if this load balancer fails?" "How would you handle a 10x traffic spike?"

**Why it matters:** Mimics a real interviewer, building critical thinking skills. Passive learning (reading) has 10% retention; active questioning has 50%+.

**Technical approach:**
- Chat interface in the right panel or bottom panel
- Context-aware: reads current canvas state (nodes, edges, metrics) and simulation results
- System prompt with Socratic method instructions and system design expertise
- Conversation history stored per design in IndexedDB
- Hints system: if user is stuck for >30s, offer a gentle nudge
- No direct answers mode: tutor never says "you should add X"; always asks "what would handle Y?"

**Effort:** L (2-3 weeks)
**Priority:** P0 -- core differentiator for learning
**Dependencies:** AI API infrastructure (shared with Feature 1), chat UI component, canvas state serialization

---

### Feature 3: Architecture Review

**Description:** Automated review that analyzes the current design and provides structured feedback across 8 dimensions: scalability, reliability, performance, cost, security, maintainability, data consistency, and operational complexity. Produces a rubric score and specific improvement suggestions.

**Why it matters:** Instant feedback loop. In real interviews, you wait days/weeks for feedback. This gives it in seconds, accelerating the learning cycle.

**Technical approach:**
- Rule-based engine for deterministic checks (runs client-side, zero latency):
  - Single point of failure detection (node with no redundancy)
  - Missing caching layer
  - No load balancer before server fleet
  - Database without read replicas under high-read scenario
  - Missing message queue for async processing
- LLM-based engine for nuanced feedback (runs server-side):
  - Architecture pattern recognition
  - Trade-off analysis
  - Comparison against known good architectures
- Combined score: 0-100 per dimension, overall grade (A-F)
- Visual overlay: highlight nodes with issues (red/yellow borders)

**Effort:** L (3-4 weeks)
**Priority:** P0 -- essential for self-study users
**Dependencies:** Canvas state serialization, rule engine library, LLM API

---

### Feature 4: Difficulty Adaptation

**Description:** Adaptive learning system that tracks user performance across challenges and problems, then adjusts difficulty accordingly. Uses spaced repetition (SRS) for concept review and adjusts challenge complexity based on demonstrated mastery.

**Why it matters:** Prevents both boredom (too easy) and frustration (too hard). Personalized learning paths are 2-3x more effective than one-size-fits-all.

**Technical approach:**
- Extends existing `lib/interview/srs.ts` (already has spaced repetition)
- Performance tracking per concept: { conceptId, attempts, successRate, avgScore, lastSeen }
- Difficulty levels: Beginner, Intermediate, Advanced, Expert
- Promotion criteria: >80% success rate over 5+ attempts
- Demotion criteria: <50% success rate over 3 attempts
- Challenge generation: select concepts near user's frontier (not mastered, not too far ahead)
- Store in IndexedDB, sync to server when auth is available

**Effort:** M (1-2 weeks)
**Priority:** P1 -- leverages existing SRS infrastructure
**Dependencies:** Existing `srs.ts`, `scoring.ts`, `challenges.ts`, user progress store

---

### Feature 5: Explanation Mode

**Description:** Toggle that overlays explanatory annotations on every component and connection in the design. Each node gets a tooltip with "What is this?", "Why is it here?", "Common alternatives", and "Typical interview questions about this component."

**Why it matters:** Transforms the canvas from a drawing tool into an interactive textbook. Users learn not just what to draw but why.

**Technical approach:**
- Content database: `lib/content/explanations.ts` with entries per component type
- Each entry: `{ componentType, whatIsIt, whyUsed, alternatives, interviewQuestions, realWorldExamples }`
- UI: floating annotation cards connected to nodes via leader lines
- Progressive disclosure: click for more detail
- Context-aware: explanations adapt based on the surrounding architecture
- Can be powered by static content (fast) or LLM-enhanced (richer)

**Effort:** M (1-2 weeks)
**Priority:** P1 -- high learning value, medium engineering cost
**Dependencies:** Content database, tooltip/popover component, node metadata

---

### Feature 6: War Stories

**Description:** Real-world failure case studies attached to architectural patterns. When a user adds a component or connection, they can see "War Story: How Netflix's Zuul gateway handled 100K RPS" or "War Story: GitHub's 2018 DDoS and how they survived."

**Why it matters:** Bridges the gap between textbook knowledge and real-world experience. Interviewers love candidates who reference real incidents.

**Technical approach:**
- Content database: 50+ curated war stories with structured data
- Each story: `{ title, company, year, components, whatHappened, rootCause, howFixed, lessonsLearned, relatedNodes }`
- Matching engine: tag stories to component types and patterns
- UI: "War Stories" tab in properties panel when a node is selected
- Optional chaos simulation: "Replay this failure" button that configures chaos-engine
- Leverages existing `chaos-engine.ts` for failure replay

**Effort:** M (2 weeks -- mostly content curation)
**Priority:** P1 -- strong differentiator, content-heavy
**Dependencies:** Content database, `chaos-engine.ts`, properties panel tab

---

## Gamification Features (7-12)

### Feature 7: Multiplayer Battles

**Description:** Real-time 1v1 or 2v2 system design battles where players solve the same problem simultaneously. After a time limit, designs are scored and compared side-by-side. Spectators can watch live.

**Why it matters:** Competitive pressure simulates interview stress. Social feature drives virality. "I beat my friend at system design" is highly shareable.

**Technical approach:**
- WebSocket server for real-time state sync (Partykit or Liveblocks)
- Room-based matchmaking: create room, share link, or random match
- Synchronized timer (server-authoritative)
- Canvas state broadcasting: each player's canvas visible to opponent (optional fog-of-war)
- Scoring: automated Architecture Review (Feature 3) runs on both designs
- Post-battle: side-by-side comparison, highlight differences
- ELO rating system for ranked matches

**Effort:** XL (4-6 weeks)
**Priority:** P2 -- high impact but complex infrastructure
**Dependencies:** WebSocket infrastructure, Architecture Review (Feature 3), matchmaking service, user accounts

---

### Feature 8: Daily Challenge

**Description:** A new system design problem every day, consistent across all users. 30-minute time limit. Global leaderboard. Streak tracking.

**Why it matters:** Daily engagement hook (like Wordle). Creates a shared experience. "Did you do today's Architex challenge?" Social proof and FOMO.

**Technical approach:**
- Challenge rotation: pre-authored challenges scheduled via cron
- Extends existing `lib/interview/challenges.ts`
- Timer: 30-minute countdown, server-verified start time
- Scoring: deterministic rule-based scoring (no AI needed for consistency)
- Leaderboard: Redis sorted set for O(log N) ranking
- Streak tracking: extends existing `stores/interview-store.ts` streak logic
- Share result: "I scored 87/100 on today's Architex challenge" card image

**Effort:** M (2 weeks)
**Priority:** P0 -- highest engagement ROI, leverages existing code
**Dependencies:** Challenge content (20+ challenges to start), leaderboard backend, share card generation

---

### Feature 9: Design Review (Peer Review)

**Description:** Submit your design for peer review. Other users review and score your architecture using a structured rubric. You earn points by reviewing others.

**Why it matters:** Peer feedback is more valuable than AI feedback for nuanced trade-offs. Creates a community feedback loop. Reviewing others is itself a learning exercise.

**Technical approach:**
- Submission flow: export design as JSON + screenshot, submit to review queue
- Review assignment: round-robin with skill-level matching
- Rubric: 8 dimensions (same as Architecture Review Feature 3)
- Reviewer UI: view design in read-only canvas, rate each dimension, leave comments
- Reputation system: reviewer accuracy compared to AI baseline and other reviewers
- Notification: "Your design received a review" via email/push

**Effort:** L (3 weeks)
**Priority:** P2 -- needs user base first
**Dependencies:** User accounts, design export, review queue backend, notification system

---

### Feature 10: Achievement Trees

**Description:** Skill trees (like RPG talent trees) that unlock as users demonstrate mastery across different system design domains. Branches: "Data Layer Master", "Distributed Architect", "Security Champion", etc.

**Why it matters:** Visual progress tracking is deeply motivating. Provides learning path structure. "I'm 70% through the Data Layer tree" gives a clear goal.

**Technical approach:**
- Extends existing `lib/interview/achievements.ts`
- Tree data structure: `{ branches: [{ name, nodes: [{ id, title, description, requirements, icon, children }] }] }`
- 6 branches, ~15 nodes each = ~90 total achievements
- Requirements: complete challenges, score thresholds, use specific components, time-based
- Visual: SVG skill tree with connections, glow effects on unlocked nodes
- Profile integration: display top achievements publicly

**Effort:** M (2 weeks)
**Priority:** P1 -- leverages existing achievement system
**Dependencies:** Existing `achievements.ts`, SVG tree renderer, user progress persistence

---

### Feature 11: Time Attack

**Description:** Speed-run mode where users must complete a design challenge as fast as possible while meeting minimum quality thresholds. Leaderboard is sorted by time (not score) among qualifying designs.

**Why it matters:** Trains interview time management. Most candidates fail interviews not because they don't know the answer, but because they run out of time. This builds speed.

**Technical approach:**
- Mode: select a problem, start timer, build design, submit when done
- Minimum quality threshold: Architecture Review score >= 60/100
- Timer: counts up (not down) -- millisecond precision
- Leaderboard: per-problem, sorted by completion time
- Ghost replay: watch the top-ranked player's build sequence (anonymized)
- Reuses existing simulation + scoring infrastructure

**Effort:** S (1 week)
**Priority:** P1 -- simple to build, high engagement
**Dependencies:** Timer, Architecture Review (Feature 3), leaderboard backend

---

### Feature 12: Streak Protector

**Description:** Protect your daily challenge streak with a "freeze" token. Earn freezes by completing extra challenges, reviewing others' designs, or watching educational content.

**Why it matters:** Streak loss is the #1 reason users churn from daily habit apps. Freezes reduce anxiety while maintaining engagement motivation.

**Technical approach:**
- Token system: earn freezes (max 3 stored), auto-apply when streak would break
- Earn conditions: complete bonus challenge (+1), review 2 designs (+1), 7-day streak (+1)
- Store in IndexedDB + server sync
- UI: streak counter with freeze count badge
- Push notification at 8 PM if daily challenge not completed: "Your {N}-day streak is at risk!"

**Effort:** S (3-4 days)
**Priority:** P1 -- small effort, big retention impact
**Dependencies:** Existing streak tracking in `interview-store.ts`, notification system (optional)

---

## Learning Features (13-20)

### Feature 13: What-If Engine

**Description:** Interactive parameter tweaker that lets users ask "What if traffic increases 10x?" "What if this database goes down?" "What if latency budget is 100ms instead of 500ms?" and see the architecture's behavior change in real-time.

**Why it matters:** Develops intuition for system behavior under changing conditions -- the core skill tested in system design interviews. Static diagrams cannot teach this.

**Technical approach:**
- Slider-based UI in the bottom panel
- Parameters: traffic multiplier (0.1x-100x), failure injection, latency budget, cost budget
- Real-time re-simulation using existing `simulation/queuing-model.ts` and `traffic-simulator.ts`
- Visual feedback: nodes change color (green->yellow->red) based on utilization
- Bottleneck highlighting: identify and annotate the first component to saturate
- Recommendation engine: "At 10x traffic, add 3 more web servers and a read replica"

**Effort:** M (2 weeks)
**Priority:** P0 -- builds on existing simulation engine, high learning value
**Dependencies:** Existing simulation engine, slider UI, bottleneck detection algorithm

---

### Feature 14: Cost Calculator

**Description:** Real-time cost estimation that maps each node to its cloud provider equivalent and calculates monthly cost. Shows cost breakdown by component category and total.

**Why it matters:** Cost is a critical dimension in system design interviews and real-world architecture. "This design costs $47K/month" makes trade-offs concrete.

**Technical approach:**
- Cost database: `lib/content/cloud-pricing.ts` with AWS/GCP/Azure pricing
- Each node type maps to a cloud service: Web Server -> EC2/GKE, Database -> RDS/Cloud SQL, etc.
- Configuration-aware: cost scales with node config (instance type, storage, IOPS)
- Utilization-aware: leverages simulation metrics for right-sizing recommendations
- Extends existing `capacity-planner.ts` with cost dimension
- UI: cost breakdown panel with pie chart and per-node badges

**Cost data structure:**

```typescript
interface CloudPricing {
  provider: 'aws' | 'gcp' | 'azure';
  service: string;
  instanceType: string;
  hourlyRate: number;
  storagePerGB: number;
  transferPerGB: number;
  requestsPer1M: number;
}
```

**Effort:** M (2 weeks)
**Priority:** P0 -- high interview relevance, concrete value
**Dependencies:** Pricing database (manual curation), existing capacity planner

---

### Feature 15: Failure Explorer

**Description:** Interactive failure mode analysis. Select any component or connection, and see all possible failure modes, their blast radius, and mitigation strategies. Simulate each failure to see the system's response.

**Why it matters:** Reliability engineering is a critical interview topic. Understanding failure modes is what separates senior from junior engineers.

**Technical approach:**
- Failure catalog: `lib/content/failure-modes.ts` with entries per component type
- Each entry: `{ failureMode, probability, blastRadius, mttr, detection, mitigation, simulation }`
- Blast radius visualization: highlight all affected nodes/edges in red
- Simulation integration: use `chaos-engine.ts` to inject the failure and show metrics degradation
- Mitigation suggestions: "Add a circuit breaker", "Add a fallback", "Add redundancy"
- Cascading failure animation: show failure propagating through the system

**Effort:** L (2-3 weeks)
**Priority:** P0 -- leverages existing chaos engine, high educational value
**Dependencies:** Existing `chaos-engine.ts`, failure catalog content, blast radius graph traversal

---

### Feature 16: Architecture Diff

**Description:** Compare two architecture designs side-by-side and see what changed. Useful for: comparing your design to a reference solution, comparing before/after optimization, reviewing peer submissions.

**Why it matters:** Learning by comparison is one of the most effective pedagogical techniques. "What did I miss?" is answered visually.

**Technical approach:**
- Diff algorithm: graph isomorphism-based matching (by node type + position proximity)
- Visual diff: side-by-side canvases with color-coded overlays
  - Green: nodes/edges present in both
  - Red: nodes/edges in left only
  - Blue: nodes/edges in right only
  - Yellow: nodes present in both but with different configuration
- Summary panel: "Design B has 2 additional components, 1 missing edge, 3 config changes"
- Import from: JSON file, URL, template, or another user's submission

**Effort:** M (2 weeks)
**Priority:** P1 -- important for learning, moderate complexity
**Dependencies:** Canvas rendering (dual instances), graph diff algorithm, JSON import

---

### Feature 17: Time-Travel

**Description:** Rewind and replay your design process step by step. Every node addition, edge creation, configuration change, and simulation result is recorded and can be played back like a video.

**Why it matters:** Self-review of your design process reveals patterns and mistakes. Also useful for creating tutorials and walkthroughs.

**Technical approach:**
- Event sourcing: record every canvas mutation as an event with timestamp
- Extends existing undo/redo in `canvas-store.ts` (Zundo temporal middleware)
- Playback UI: timeline scrubber, play/pause, speed control (0.5x-4x)
- Event types: NODE_ADDED, NODE_MOVED, NODE_DELETED, EDGE_CREATED, CONFIG_CHANGED, SIM_STARTED, etc.
- Export: generate animated GIF or video from event sequence
- Share: shareable URL that replays the design process

**Effort:** M (2 weeks)
**Priority:** P1 -- leverages existing undo/redo infrastructure
**Dependencies:** Existing Zundo history, timeline UI component, event serialization

---

### Feature 18: Concept Linker

**Description:** Automatic detection and linking of system design concepts within the current design. When a user adds a cache, the Concept Linker highlights related concepts: "Cache Invalidation", "TTL Strategies", "Cache-Aside Pattern", "Write-Through vs Write-Behind" with links to deep-dive content.

**Why it matters:** Surfaces learning opportunities in context. Users discover concepts they didn't know they needed to learn.

**Technical approach:**
- Concept database: `lib/content/concepts.ts` with 80+ concepts
- Tagging: each component type maps to relevant concepts
- Each concept: `{ id, name, summary, relatedComponents, relatedConcepts, depth, content }`
- UI: "Related Concepts" section in properties panel
- Knowledge graph: visualize concept relationships (can reuse canvas renderer)
- Links to: internal content pages (for SEO) and external authoritative sources

**Effort:** M (1-2 weeks)
**Priority:** P1 -- content-heavy but architecturally simple
**Dependencies:** Concept database content, properties panel integration

---

### Feature 19: Protocol Deep-Dive

**Description:** Interactive, step-by-step visualizations of distributed systems protocols (Raft, Paxos, Gossip, 2PC, PBFT) and networking protocols (TCP, TLS, DNS, HTTP/2, WebSocket). Users can step through each round/phase and see exactly what messages are exchanged.

**Why it matters:** Protocols are the hardest topic to learn from reading. Visualization makes the abstract concrete. Deep understanding of protocols is rare and impressive in interviews.

**Technical approach:**
- Leverages existing implementations:
  - `lib/distributed/raft.ts` -- Raft consensus
  - `lib/distributed/gossip.ts` -- Gossip protocol
  - `lib/distributed/consistent-hash.ts` -- Consistent hashing
  - `lib/networking/tcp-state-machine.ts` -- TCP states
  - `lib/networking/tls-handshake.ts` -- TLS handshake
  - `lib/networking/dns-resolution.ts` -- DNS resolution
- Reuses `lib/algorithms/playback-controller.ts` for step-through
- New protocol visualizations to add: Paxos, 2PC, 3PC, PBFT, Chord DHT
- UI: dedicated visualization panel per protocol with node/message animations

**Effort:** L (3-4 weeks for new protocols, 1 week for existing)
**Priority:** P0 -- builds directly on existing code, high educational value
**Dependencies:** Existing protocol implementations, playback controller, visualization components

---

### Feature 20: Show-Your-Work Calculator

**Description:** Guided back-of-envelope estimation tool. Users input assumptions (DAU, read/write ratio, object size, etc.) and the calculator shows step-by-step math for QPS, storage, bandwidth, and server count. Every formula is explained.

**Why it matters:** Back-of-envelope estimation is tested in every system design interview. Most candidates cannot do it systematically. This teaches the process, not just the answer.

**Technical approach:**
- Step-by-step calculation engine: `lib/estimation/calculator.ts`
- Input parameters: DAU, peak multiplier, read:write ratio, avg object size, retention period
- Output calculations (each showing formula + substitution + result):
  1. Total requests/day -> QPS -> Peak QPS
  2. Storage per day -> per year -> total with retention
  3. Bandwidth: ingress + egress
  4. Server count: given QPS per server
  5. Database size: with indexes and overhead
  6. Cache size: based on working set
- Leverages existing `capacity-planner.ts` for base calculations
- Integration: results feed into canvas node configurations
- UI: worksheet format with editable cells and live updates

**Effort:** M (1-2 weeks)
**Priority:** P0 -- critical interview skill, leverages existing capacity planner
**Dependencies:** Existing `capacity-planner.ts`, worksheet UI component

---

## Community Features (21-25)

### Feature 21: Gallery

**Description:** Public gallery of user-created system designs. Browse, search, fork, and remix other users' architectures. Categories by problem type, complexity, and community ratings.

**Why it matters:** User-generated content flywheel. Each design becomes a learning resource for others. "There are 200+ community designs for Design a URL Shortener" is powerful social proof.

**Technical approach:**
- Submission flow: export design + metadata, publish to gallery
- Metadata: title, description, problem, tags, difficulty, author
- Preview: static Mermaid rendering (SSR-friendly for SEO) + interactive canvas on click
- Forking: one-click fork to user's workspace (like GitHub fork)
- Rating: thumbs up + dimensional rating (same rubric as Architecture Review)
- Search: full-text search over title, description, tags + faceted filters
- Storage: PostgreSQL (design JSON) + S3 (thumbnails) + Algolia/Meilisearch (search)

**Effort:** L (3-4 weeks)
**Priority:** P1 -- needs user base, but creates content flywheel
**Dependencies:** User accounts, design export, database backend, search index

---

### Feature 22: Study Groups

**Description:** Create or join study groups of 3-8 people. Shared workspace where group members can see each other's designs, discuss in real-time, and do mock interviews.

**Why it matters:** Accountability and social learning. Study groups have 2-3x higher completion rates than solo study. Reduces isolation of interview prep.

**Technical approach:**
- Group management: create, invite (link), join, leave
- Shared workspace: each member's design visible in tabs
- Real-time presence: see who's online, cursor positions
- Chat: text chat sidebar with @mentions
- Voice: integration with Daily.co or Twilio for optional voice chat
- Scheduling: group practice sessions with calendar integration
- Infrastructure: WebSocket (Partykit) for real-time, PostgreSQL for groups

**Effort:** XL (4-6 weeks)
**Priority:** P2 -- complex infrastructure, needs user base
**Dependencies:** User accounts, WebSocket infrastructure, real-time sync

---

### Feature 23: Mentor Mode

**Description:** Experienced users can mentor newcomers by watching their design process in real-time, providing live feedback, and guiding them through problems.

**Why it matters:** 1:1 mentorship is the most effective form of learning but historically unscalable. This tool makes it asynchronous-capable and structured.

**Technical approach:**
- Mentor registration: application process, minimum achievement level
- Matching: by skill level, timezone, availability
- Session types:
  - Live: real-time canvas sharing + voice (uses Study Group infra)
  - Async: mentor reviews recorded design session (uses Time-Travel Feature 17)
- Feedback tools: annotation overlay on canvas, timestamped comments
- Rating: mentee rates mentor, mentor rates mentee effort
- Incentives: mentors earn premium features, badges, community recognition

**Effort:** L (3 weeks, assuming Study Groups infrastructure exists)
**Priority:** P3 -- depends on user base and Study Groups
**Dependencies:** Study Groups (Feature 22), Time-Travel (Feature 17), user accounts

---

### Feature 24: Weekly Challenge

**Description:** Week-long open-ended design challenge with a complex problem, community submissions, and voting. Winner gets featured on the homepage and earns a badge.

**Why it matters:** Creates a recurring content generation event. Community voting drives engagement and repeat visits.

**Technical approach:**
- Challenge lifecycle: Mon release -> Sun deadline -> Mon-Tue voting -> Wed winner
- Problem complexity: harder than daily challenges, multi-system scope
- Submission: full design + write-up (markdown)
- Voting: community votes (1 per user), weighted by voter skill level
- Winner: featured on homepage, badge, profile highlight
- Archive: all past weekly challenges become learning resources
- Content: 52 challenges/year, pre-authored 3 months ahead

**Effort:** M (2 weeks, leveraging Gallery infrastructure)
**Priority:** P2 -- depends on Gallery and user base
**Dependencies:** Gallery (Feature 21), voting system, content pipeline

---

### Feature 25: Office Hours

**Description:** Scheduled live sessions where expert architects walk through a problem, take questions, and demonstrate design thinking in real-time using Architex.

**Why it matters:** Creates appointment content (drives scheduled engagement), builds authority, and provides high-quality learning content that can be recorded for async viewing.

**Technical approach:**
- Scheduling: calendar with upcoming sessions, timezone-aware
- Live session: expert shares canvas via WebSocket, audience has read-only view + chat
- Q&A: audience submits questions, upvote, expert addresses top questions
- Recording: session replay saved to library (uses Time-Travel infrastructure)
- Notification: remind registered users 1 hour before
- Platform: embed in Architex (WebSocket) or integrate with YouTube Live/Twitch

**Effort:** M (2 weeks for embedding, 1 week for external integration)
**Priority:** P2 -- marketing/content value, moderate engineering
**Dependencies:** WebSocket infrastructure (or external streaming), recording, scheduling

---

## Visualization Features (26-35)

### Feature 26: Request Tracing

**Description:** Visualize a single request flowing through the entire architecture, hop by hop, with timing at each stage. Like a distributed trace (Jaeger/Zipkin) but animated on the canvas.

**Why it matters:** Makes request flow tangible. "A user request hits the CDN, then load balancer, then web server, then cache (miss), then database, then back" -- seeing this animated builds deep understanding.

**Technical approach:**
- Trace model: ordered list of hops with timing, each hop = node + edge traversal
- Animation: colored dot/packet traveling along edges with per-hop latency display
- Timing breakdown: waterfall chart in bottom panel (like Chrome DevTools Network tab)
- Multiple requests: show concurrent requests with different colors
- Failure paths: show what happens when a hop fails (retry, circuit breaker, fallback)
- Leverages existing `traffic-simulator.ts` for realistic timing

**Effort:** M (2 weeks)
**Priority:** P0 -- the single most educational visualization feature
**Dependencies:** Edge animation system, traffic simulator, waterfall chart component

---

### Feature 27: Heatmap

**Description:** Color-code nodes and edges by any metric: utilization (cold blue -> hot red), error rate, latency, throughput, cost. Instantly see bottlenecks and cold spots.

**Why it matters:** Pattern recognition through color is the fastest way for humans to identify system bottlenecks. "The database is glowing red" is immediately actionable.

**Technical approach:**
- Metric selector: dropdown to choose which metric drives the heatmap
- Color scale: blue (0%) -> green (25%) -> yellow (50%) -> orange (75%) -> red (100%)
- Node overlay: background color intensity based on metric value
- Edge overlay: stroke color and thickness based on traffic volume
- Legend: color scale bar with min/max values
- Leverages existing `metrics-collector.ts` for per-node metrics
- Canvas overlay layer (z-index above nodes, below labels)

**Effort:** S (1 week)
**Priority:** P0 -- simple to build, high visual impact
**Dependencies:** Existing metrics collector, color interpolation utility, canvas overlay layer

---

### Feature 28: Geographic View

**Description:** Overlay the architecture onto a world map showing data center locations, CDN PoPs, user traffic origin, and cross-region replication links. Visualize latency between regions.

**Why it matters:** Geography matters for global systems. "Where should I put my data centers?" is a key interview question. Seeing latency on a map makes it intuitive.

**Technical approach:**
- Map library: Mapbox GL JS or Leaflet (open-source)
- Data center placement: drag pins onto map, each pin represents a region
- Node assignment: assign canvas nodes to regions
- Latency overlay: lines between regions with latency labels (real AWS/GCP inter-region latency data)
- Traffic visualization: animated arcs showing request flow between regions
- CDN PoP overlay: show Cloudflare/AWS CloudFront PoP locations
- User distribution: heatmap of user locations driving traffic patterns

**Effort:** L (3 weeks)
**Priority:** P2 -- impressive but niche, complex implementation
**Dependencies:** Map library, region latency database, CDN PoP data

---

### Feature 29: 3D City Visualization

**Description:** Render the architecture as a 3D city where each component is a building. Building height = throughput, color = health, roads = connections. Like SimCity for system design.

**Why it matters:** Memorable, shareable, and fun. Creates "wow" moments that drive social sharing. Also genuinely useful for intuitive understanding of relative scale.

**Technical approach:**
- 3D library: Three.js with React Three Fiber
- Building models: procedural generation based on node type and metrics
- Height: throughput (taller = more traffic)
- Width: capacity/replica count
- Color: health (green = healthy, red = failing)
- Roads: edge connections with traffic animation
- Camera: orbit controls, first-person walkthrough mode
- Performance: instanced rendering for 100+ buildings, LOD for detail management

**Effort:** XL (4-6 weeks)
**Priority:** P3 -- "wow" feature, very high engineering cost
**Dependencies:** Three.js/R3F, building model generator, performance optimization

---

### Feature 30: Sankey Diagram

**Description:** Sankey diagram showing data flow volumes through the system. Width of flows proportional to request volume. Shows where traffic splits, merges, and is filtered.

**Why it matters:** Makes traffic distribution tangible. "80% of requests hit the cache, 20% go to the database" is much clearer as a Sankey than as numbers.

**Technical approach:**
- Library: D3.js Sankey layout (or custom SVG)
- Data source: simulation traffic data from `traffic-simulator.ts` and `metrics-collector.ts`
- Flow calculation: trace request paths through graph, accumulate volume per edge
- Interactive: hover to highlight a single flow path, click to see details
- Time-varying: animate flow changes during simulation
- Overlay mode: render as overlay on the standard canvas, or as separate panel

**Effort:** M (2 weeks)
**Priority:** P1 -- visually striking, moderate complexity
**Dependencies:** D3 Sankey or custom SVG, simulation metrics, flow tracing algorithm

---

### Feature 31: SLA Dashboard

**Description:** Real-time SLA compliance dashboard showing uptime percentage, error budget remaining, request latency percentiles (P50/P90/P99), and projected SLA violations. Mimics production monitoring dashboards (Datadog, Grafana).

**Why it matters:** SLAs are discussed in every L5+ system design interview. Understanding error budgets and SLA math is essential. Having a live dashboard makes it concrete.

**Technical approach:**
- SLA definition: user sets target uptime (99.9%, 99.99%, etc.)
- Calculations:
  - Error budget: (1 - SLA) * time_period -> allowed downtime
  - Burn rate: current error rate vs budget
  - Projected violation: linear extrapolation
- Metrics: leverages existing `metrics-collector.ts`
- Visualization: extends existing chart components (ThroughputChart, LatencyPercentileChart, ErrorRateChart)
- Alerting: visual alert when error budget consumed past 50%, 80%, 100%
- Historical: track SLA compliance over simulation time

**Effort:** M (1-2 weeks)
**Priority:** P0 -- leverages existing metrics infrastructure, high interview relevance
**Dependencies:** Existing metrics collector and chart components

---

### Feature 32: Latency Budget Visualizer

**Description:** Visual breakdown of end-to-end latency showing how much each hop contributes to total latency. Interactive: drag latency sliders per component to see how it affects overall P99.

**Why it matters:** Latency budgeting is a key system design skill. "We have 200ms total budget -- how do we allocate it?" This tool makes the math visual and interactive.

**Technical approach:**
- Waterfall chart: horizontal bars showing each hop's latency contribution
- Budget bar: total budget at top, each component's allocation stacked below
- Interactive sliders: adjust per-component latency, see total update in real-time
- Percentile toggle: switch between P50, P90, P99 views
- Optimization suggestions: highlight the biggest contributor, suggest caching or parallelization
- Integration: reads from simulation results or user-specified values
- Leverages existing `lib/constants/latency-numbers.ts` for realistic defaults

**Effort:** S (1 week)
**Priority:** P0 -- simple, high value, leverages existing data
**Dependencies:** Existing latency numbers, waterfall chart component

---

### Feature 33: Evolution Timeline

**Description:** Show how an architecture should evolve over time as scale increases. Stage 1 (MVP): monolith. Stage 2 (10K users): add cache + load balancer. Stage 3 (1M users): microservices + sharding. Interactive timeline slider.

**Why it matters:** Real architectures evolve. Interview questions often ask "how would this scale?" Showing the evolution path demonstrates senior-level thinking.

**Technical approach:**
- Timeline model: ordered list of architectural snapshots with scale labels
- Each snapshot: complete canvas state (nodes + edges + config)
- Diff between stages: highlight what was added/changed/removed
- Slider UI: drag to see architecture morph between stages
- Auto-generation: given a final architecture, AI generates plausible earlier stages
- Templates: pre-built evolution timelines for common problems (URL shortener, chat system, etc.)
- Smooth transition: animate node positions and opacity between stages

**Effort:** L (2-3 weeks)
**Priority:** P1 -- high learning value, moderate complexity
**Dependencies:** Canvas state snapshots, diff algorithm (Feature 16), interpolation animation

---

### Feature 34: Intent Cursors

**Description:** When hovering over a component or edge during simulation, show a contextual overlay of what the component is "thinking." Load balancer: "Routing to server-3 (least connections: 12)." Cache: "Key 'user:1234' found, TTL 45s remaining."

**Why it matters:** Makes invisible system behavior visible. Understanding internal component logic is critical for debugging and interview discussions.

**Technical approach:**
- Cursor overlay: tooltip that follows mouse when hovering over a node during simulation
- Content generation: based on node type, config, and current simulation state
- Examples:
  - Load Balancer: algorithm name, current server weights, connection counts
  - Cache: hit/miss for current request, TTL, eviction policy
  - Database: query plan, index usage, connection pool status
  - Message Queue: queue depth, consumer count, oldest message age
- Simulation integration: read from per-tick simulation state
- Performance: debounced updates, only compute for hovered node

**Effort:** M (1-2 weeks)
**Priority:** P1 -- builds understanding, moderate complexity
**Dependencies:** Simulation per-tick state exposure, tooltip/overlay component

---

### Feature 35: Playbook Library

**Description:** Pre-built architectural playbooks for common patterns: "Add Read Replicas", "Implement Circuit Breaker", "Shard Database", "Add CDN Layer", "Event-Driven Decomposition." Each playbook is a one-click architectural modification with explanation.

**Why it matters:** Bridges the gap between knowing a pattern name and knowing how to implement it. One-click application with visual before/after.

**Technical approach:**
- Playbook data structure:

```typescript
interface Playbook {
  id: string;
  name: string;                    // "Add Read Replicas"
  category: string;                // "Scalability" | "Reliability" | "Performance"
  description: string;             // What it does and when to use it
  applicability: (graph) => boolean;  // Can this be applied to current design?
  apply: (graph) => GraphDelta;    // What nodes/edges to add/modify
  explanation: string;             // Why this pattern works
  tradeoffs: string[];             // What you give up
  interviewTip: string;            // When to mention this in an interview
}
```

- Library: 30+ playbooks covering all major patterns
- Context-aware: only show applicable playbooks based on current architecture
- Preview: show before/after diff before applying
- Undo: standard undo/redo integration
- Learning mode: apply step-by-step with explanation at each step

**Effort:** L (2-3 weeks -- mostly content authoring)
**Priority:** P0 -- high learning value, reusable content asset
**Dependencies:** Canvas mutation API, diff preview, content authoring

---

## Priority & Effort Summary

### By Priority

| Priority | Features | Total Effort |
|---|---|---|
| **P0** | Architecture Generator, Socratic Tutor, Architecture Review, Daily Challenge, What-If Engine, Cost Calculator, Failure Explorer, Protocol Deep-Dive, Show-Your-Work Calculator, Request Tracing, Heatmap, SLA Dashboard, Latency Budget, Playbook Library | ~25-35 weeks |
| **P1** | Difficulty Adaptation, Explanation Mode, War Stories, Achievement Trees, Time Attack, Streak Protector, Architecture Diff, Time-Travel, Concept Linker, Gallery, Sankey Diagram, Evolution Timeline, Intent Cursors | ~20-28 weeks |
| **P2** | Multiplayer Battles, Design Review, Study Groups, Weekly Challenge, Office Hours, Geographic View | ~18-26 weeks |
| **P3** | Mentor Mode, 3D City Visualization | ~7-9 weeks |

### By Effort

| Effort | Features |
|---|---|
| **S** (< 1 week) | Heatmap, Time Attack, Streak Protector, Latency Budget Visualizer |
| **M** (1-2 weeks) | Difficulty Adaptation, Explanation Mode, War Stories, Daily Challenge, Architecture Diff, Time-Travel, Concept Linker, Show-Your-Work Calculator, Cost Calculator, Sankey Diagram, SLA Dashboard, Intent Cursors, Weekly Challenge, Office Hours |
| **L** (2-4 weeks) | Architecture Generator, Socratic Tutor, Architecture Review, Failure Explorer, Protocol Deep-Dive, Gallery, Evolution Timeline, Playbook Library, Mentor Mode, Achievement Trees, Design Review, Geographic View |
| **XL** (4-6 weeks) | Multiplayer Battles, Study Groups, 3D City Visualization |

### Recommended Build Order (4 Phases)

**Phase 1: Core Intelligence (Weeks 1-8)**
1. Heatmap (S) -- instant visual impact
2. Latency Budget Visualizer (S) -- leverages existing data
3. Request Tracing (M) -- the showcase visualization
4. What-If Engine (M) -- interactive simulation
5. SLA Dashboard (M) -- leverages existing metrics
6. Show-Your-Work Calculator (M) -- interview prep essential
7. Cost Calculator (M) -- concrete value demonstration

**Phase 2: AI & Learning (Weeks 9-16)**
8. Architecture Review (L) -- foundation for many features
9. Architecture Generator (L) -- flagship AI feature
10. Socratic Tutor (L) -- core differentiator
11. Failure Explorer (L) -- leverages chaos engine
12. Protocol Deep-Dive (L) -- leverages existing implementations
13. Playbook Library (L) -- reusable content

**Phase 3: Engagement & Gamification (Weeks 17-24)**
14. Daily Challenge (M) -- daily engagement hook
15. Streak Protector (S) -- retention
16. Time Attack (S) -- speed training
17. Achievement Trees (M) -- progress visualization
18. Difficulty Adaptation (M) -- personalization
19. Explanation Mode (M) -- learning depth
20. War Stories (M) -- content differentiation

**Phase 4: Community & Advanced (Weeks 25-36)**
21. Gallery (L) -- content flywheel
22. Concept Linker (M) -- contextual learning
23. Architecture Diff (M) -- comparison tool
24. Time-Travel (M) -- replay & review
25. Sankey Diagram (M) -- flow visualization
26. Evolution Timeline (L) -- architecture evolution
27. Intent Cursors (M) -- component insights
28. Weekly Challenge (M) -- community event
29. Office Hours (M) -- expert content
30. Design Review (L) -- peer feedback
31. Multiplayer Battles (XL) -- competitive mode
32. Study Groups (XL) -- collaborative learning
33. Geographic View (L) -- global systems
34. Mentor Mode (L) -- 1:1 learning
35. 3D City Visualization (XL) -- wow factor
