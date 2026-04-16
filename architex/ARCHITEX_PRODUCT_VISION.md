# ARCHITEX — Complete Product Vision & Strategy

> **The only platform where engineers don't just study system design — they build architectures, simulate production traffic, inject failures, and learn from what breaks.**

*Compiled from 6 parallel research agents covering: Product Vision, Competitive Analysis, Simulation R&D, AI Features, Retention Science, and Full Codebase Audit. Backed by 25+ published studies.*

---

## Executive Summary

Architex is a 1,000+ file Next.js platform with 13 interactive modules, a 10-stage simulation engine, 30+ chaos event types, 240+ algorithm implementations, 50+ data structure engines, FSRS spaced repetition, AI-powered review (Claude), and cross-module concept mapping. **This is not a prototype — it's a working product with enterprise-grade simulation infrastructure that no competitor has.**

The competitive moat is the **fusion of domain-specific simulation with structured education**. ByteByteGo has content but no simulation. Excalidraw has a canvas but no domain knowledge. LeetCode has practice but no system design. Brilliant has pedagogy but no engineering depth. **Nobody has all four: simulation + education + interactive canvas + open source.**

---

## I. What Already Exists (Codebase Inventory)

### By the Numbers
| Metric | Count |
|--------|-------|
| Total files | 1,000+ |
| Active modules | 13 |
| Design patterns (LLD) | 36 with UML, code (TS/Python/Java), walkthroughs |
| LLD problems | 33 with starter diagrams, hints |
| Algorithm implementations | 240+ across 108 files |
| Data structure engines | 50+ with step-by-step playback |
| System design node types | 75+ (compute, storage, messaging, ML, security, fintech) |
| Simulation pressure counters | 35 named counters |
| Chaos event types | 30+ across 10 categories |
| Export formats | 12+ (Mermaid, PlantUML, Terraform, Draw.io, Excalidraw, C4, PNG, SVG, PDF, GIF, URL) |
| Database tables | 11 |
| API routes | 24 |
| Zustand stores | 12 |
| Achievements | 30+ with 4 rarity tiers |
| Walkthrough steps | ~60 across 10 patterns, 30 checkpoints |

### Module Completion Status
| Module | Visualizations | Simulations | Status |
|--------|---------------|-------------|--------|
| **LLD** | UML class, sequence, state machine canvases | Pattern behavioral simulator | Complete |
| **System Design** | React Flow canvas with 75+ node types | Full simulation engine + chaos | Complete |
| **Data Structures** | 50+ animated visualizers | Break-it mode, reverse mode, prediction | Complete |
| **Algorithms** | Graph, DP, sorting, tree visualizers | Algorithm race, complexity quiz | Complete |
| **Database** | 17 canvases (B-Tree, LSM, MVCC, etc.) | Query plan, sharding, replication lag | Complete |
| **Distributed** | Raft, CRDTs, vector clocks, gossip | Consistent hashing, split-brain | Complete |
| **Networking** | Packet journey, ARP, protocol comparison | TCP, TLS, DNS, HTTP lifecycle | Complete |
| **OS** | CPU scheduling (6 algos), page replacement | Deadlock, memory allocation, sync | Complete |
| **Concurrency** | Thread lifecycle, event loop | Producer-consumer, dining philosophers | Complete |
| **Security** | OAuth, JWT, AES, DH, certificate chain | DDoS, rate limiting, web attacks | Complete |
| **ML Design** | Neural net trainer, CNN visualizer | Pipeline builder, A/B testing, bandits | Complete |
| **Interview** | Challenge catalog, progress dashboard | Timed practice, AI scoring, SRS review | Complete |
| **Knowledge Graph** | Force-directed concept graph | Cross-module bridges | Partial |

### Simulation Engine (the moat)
- **SimulationOrchestrator**: 10-stage tick pipeline (traffic → BFS propagation → amplification → pressure → issues → edge flow → metrics → recording → cost → time-travel)
- **ChaosEngine**: 30+ events (infra, network, data, traffic, dependency, app, security, resource, external, cache)
- **CascadeEngine**: Failure propagation with circuit breakers, retries, fallbacks
- **TimeTravel**: Frame-by-frame recording with O(1) seek
- **NarrativeEngine**: 20 causal templates producing human-readable failure explanations
- **WhatIfEngine**: Clone topology, apply modification, run comparative simulation
- **CostModel**: Live per-node cost during simulation
- **Architecture Diff**: Detect topology changes for hot-reload

### AI Infrastructure
- **Claude Client**: Singleton with concurrency queue (max 3), IndexedDB cache, retry, cost tracking
- **Socratic Tutor**: 4-phase (assess/challenge/guide/reinforce) with frustration detection
- **Design Reviewer**: 8 static rules + Claude enrichment + auto-fix actions
- **Architecture Generator**: 8 reference architectures + Claude free-form generation
- **Hint System**: 4-tier progressive hints with credit budget
- **Interview Scorer**: 8-dimension scoring with grade mapping
- **Diagram Serializer**: Canvas → AI-readable text for contextual analysis

---

## II. Competitive Landscape

### Direct Competitors
| Platform | Users | Strength | Weakness | Architex Edge |
|----------|-------|----------|----------|---------------|
| **Refactoring Guru** | ~5M/yr | Best static pattern illustrations | Zero interactivity | Interactive UML + FSRS + walkthroughs |
| **System Design Primer** | 342K stars | Most comprehensive free text | Static, aging, no simulation | Every concept made interactive |
| **ByteByteGo** | 1M+ subs | Best visual explanations | Passive consumption only | Build it, simulate it, break it |
| **Educative.io** | 1-3M users | 1,600+ courses, in-browser coding | No visualization, expensive ($59/mo) | 13 specialized simulation modules |
| **Design Gurus** | 440K learners | Created "Grokking" methodology | Text + static diagrams only ($119/mo) | Apply Grokking by actually building |
| **Neetcode** | 2-5M users | Best problem curation | Shallow system design | Full simulation + 13 modules |
| **LeetCode** | 15-20M users | Dominant for algorithms | Zero system design, no visualization | Algorithm viz + system design in one |
| **Brilliant.org** | 10M users | Best interactive pedagogy | No system design, expensive ($28/mo) | Brilliant's pedagogy + engineering depth |

### The Gap Nobody Fills
**Interactive, scored system design practice with real-time simulation feedback.** The market has content platforms (explain), code judges (test algorithms), and diagram tools (draw). Nobody offers: *"design this system, simulate it, get scored on correctness, learn from what broke."*

### The One-Sentence Pitch
> "Architex is the only platform where engineers don't just study system design — they build architectures, simulate production traffic, inject failures, and learn from what breaks, across 13 interactive modules from algorithms to distributed consensus to security, all open source."

---

## III. Learning System (The B+E Fusion)

### The Core Decision
Three learning approaches tested well: **A (Jupyter-style scrollable lessons)**, **B (Brilliant-style step-by-step cards)**, **E (Progressive canvas that builds as you scroll)**. The recommendation from all research agents: **Fuse B + E into ONE scrollable experience. Keep A as a Reference sub-mode.**

### How It Works
```
Toggle:  [Learn | Build]
              ↓
         Guided (B+E fused)  ←  V1
         Reference (A)       ←  V2
```

The lesson is a **420px scrollable column on the right**. The canvas fills the rest.

| Scroll Position | Experience | Canvas State |
|----------------|------------|--------------|
| 0-20% | **Brilliant-style intro**: Problem scenario, analogy, first MCQ | Empty or minimal "problem" illustration |
| 20-70% | **Progressive build**: Classes appear one-by-one with explanations | Builds incrementally, new classes glow |
| 70-100% | **Synthesis**: Code block, key takeaway, "Switch to Build →" | Full diagram visible |

### What Already Exists (90% built)
- `WalkthroughPlayer.tsx`: 4 checkpoint types (MCQ, click-class, fill-blank, order-steps)
- 10 patterns × 6 steps × 30 checkpoints in DB
- `highlightedClassIds` per step in seed data — **designed but never consumed**
- `onHighlightClasses` and `onClassClicked` props — **designed but never wired**
- Pattern data: analogy, description, code, predictionPrompts, whenToUse, confusedWith

### V1 Implementation: ~800 lines, 6 files
| File | Change | Lines |
|------|--------|-------|
| `ui-store.ts` | Add `learnPanelOpen` boolean | ~15 |
| Layout component | Conditional 420px aside | ~20 |
| `GuidedLesson.tsx` | NEW — port from E demo | ~400 |
| `LLDCanvas.tsx` | `highlightedClassIds` prop | ~30 |
| `ContextualBottomTabs.tsx` | Wire walkthrough callbacks | ~50 |
| `useLLDModuleImpl.tsx` | Learn/Build toggle + state | ~100 |

### Brilliant's Formula Applied
1. **Problem first** — show the broken system BEFORE naming the pattern
2. **Visual over text** — 70% diagram, 30% text
3. **Name it last** — "Observer" appears only after they feel the intuition
4. **Scaffolding fades** — Learn mode → Build mode transition
5. **Failure normalized** — wrong answers show same explanation, no punishment

---

## IV. Simulation Roadmap (The Differentiator)

### Phase 1: Quick Wins (already have backends)

| Simulation | Backend Status | What's Missing | Effort | Impact |
|-----------|---------------|----------------|--------|--------|
| **Consistent Hashing Ring** | 100% complete (`consistent-hash.ts`) | Ring canvas renderer | S | 9/10 |
| **Concurrency Swim-Lane Timeline** | Event logs complete (3 simulations) | Swim-lane renderer | M | 10/10 |
| **Data Flow Particles on Edges** | Edge tracker + particle cache complete | Canvas 2D particle renderer | M | 9/10 (WOW) |

### Phase 2: World-Firsts

| Simulation | Description | Effort | Impact |
|-----------|-------------|--------|--------|
| **Pattern Runtime Animator** | Watch Observer's notify() propagate as animated particles between objects | M | 9/10 |
| **Network Protocol Encapsulation** | See packets "dress up" in headers as they descend OSI layers | M | 9/10 |
| **Algorithm Complexity Scaler** | Drag slider 10→100K elements, watch complexity curve form in real-time | M | 8/10 |

### Phase 3: Flagship (conference demo material)

| Simulation | Description | Effort | Impact |
|-----------|-------------|--------|--------|
| **"Architect Mode"** | Design a system, then simulate live traffic. Inject failures. Modify topology WHILE simulation runs. Score your incident response. | L | 10/10 |
| **Database Surgery Table** | Watch a SQL query traverse B-Tree index → buffer pool → disk pages, all connected as one animated system | L | 10/10 |

### Competitive Position After Implementation
| Feature | VisuAlgo | Cisco PT | Brilliant | Neetcode | **Architex** |
|---------|----------|----------|-----------|----------|------------|
| Algorithm step-through | Basic | No | Basic | No | **Advanced + race + complexity scaler** |
| Design pattern simulation | No | No | No | No | **All GoF patterns animated** |
| Concurrency visualization | No | No | No | No | **Swim-lane timeline** |
| Database internals | No | No | No | No | **Connected subsystem simulation** |
| Network protocol sim | No | Yes (low-level) | No | No | **OSI encapsulation animation** |
| Live system simulation | No | Partial | No | No | **Architect Mode with chaos** |
| Modify topology under load | No | No | No | No | **Yes (world-first)** |

---

## V. AI Features Roadmap

### Priority Order (by learning impact × feasibility)

| # | Feature | Impact | Feasibility | Status |
|---|---------|--------|-------------|--------|
| 1 | **Contextual Explain** (right-click → AI explains in context) | 7/10 | 9/10 | S effort |
| 2 | **Enhanced Design Review** (back-of-envelope grounding + pattern detection) | 8/10 | 9/10 | S effort, 70% built |
| 3 | **Socratic Pattern Discovery** (AI asks questions, user discovers pattern on canvas) | 10/10 | 7/10 | L effort, infrastructure exists |
| 4 | **Adaptive Learning Path** (FSRS + quiz scores → personalized curriculum) | 9/10 | 8/10 | M effort, data layer exists |
| 5 | **AI Interview Simulation** (45-min mock with adaptive follow-ups, scorecard) | 9/10 | 7/10 | XL effort, premium feature |
| 6 | **Natural Language Querying** (RAG over pattern knowledge base) | 6/10 | 8/10 | M effort |

### The Unique Moat
**Canvas-aware AI.** Every AI feature reads the actual diagram state via `serializeDiagramForAI`. The Socratic tutor sees what you've built and responds contextually. The reviewer identifies patterns in YOUR design, not generic examples. No chatbot can replicate this — it requires the canvas.

---

## VI. Retention & Engagement Strategy (Research-Backed)

### Spaced Repetition
- **Current**: SM-2 variant (suboptimal)
- **Upgrade to**: FSRS-5 (~100 lines). 99.6% superiority over SM-2, 20-30% fewer reviews
- **Three card types**: Concept cards, Diagram cards (visual recognition), Application cards (scenario-based)
- **Desired retention slider**: User chooses 85-95% (controls interval length)

### Streak System (Duolingo's 2024 Model)
- **Separated streak**: One micro-action maintains streak (2 min). Daily goal is separate, higher bar.
- **Result**: Duolingo saw +3.3% D14 retention, +10.5% streak adoption, +19% new user streaks
- **Safety nets**: Streak freeze (1 per 7 days maintained), weekend mode, grace period, lifetime total never zeros

### Gamification (White Hat, not Black Hat)
- **Brilliant model** (mastery + empowerment), NOT Duolingo model (loss aversion + shame)
- **Mastery-based progression**: 5 levels per pattern (Aware → Familiar → Proficient → Expert → Master)
- **Insight rewards**: After challenges, show real-world case study (Netflix uses this exact pattern)
- **NO global leaderboards** (research: linked to demotivation). Use "personal best" tracking instead.

### Micro-Learning (2-Minute Daily)
- **7-day pattern micro-curriculum**: Day 1 = name + analogy, Day 2 = diagram interaction, Day 3 = case study, Day 4 = identify-the-pattern, Day 5 = compare with similar, Day 6 = mini-build, Day 7 = SRS review
- **80% completion rate** for micro-modules vs 20% for long-form
- **150% better retention** from spaced micro-sessions vs equivalent time in one sitting

### Progress Visualization
- **System Design Skill Map**: Your progress IS a system design diagram. Nodes = patterns, edges = relationships, color = mastery level. Leverages Architex's own diagramming engine.
- **Learning Heatmap**: GitHub-style 52-week calendar. Gray → light blue → dark blue → gold.
- **Knowledge Radar**: Spider chart showing proficiency across categories, overlaid with target role profile.

### Anti-Pattern List (What NOT to Build)
1. Global leaderboards (demotivation research)
2. Loss-of-life mechanics (punishing mistakes hinders learning)
3. Streak-break shame messaging (dark pattern, causes churn)
4. XP for quantity not quality (gaming the system)
5. Notification spam about at-risk streaks
6. Time-gated content (frustrates motivated learners)

---

## VII. Implementation Roadmap

### Phase 1: "The Wow Factor" (4-6 weeks)
| # | Feature | Impact | Effort | Prerequisite |
|---|---------|--------|--------|-------------|
| 1 | **Wire Learn mode** (B+E fusion) | HIGH | ~800 lines | None |
| 2 | **Data flow particles on canvas edges** | WOW | M | Particle cache exists |
| 3 | **Consistent hashing ring visualizer** | HIGH | S | Backend 100% built |
| 4 | **2-minute daily micro-review** | HIGH | S | FSRS + flashcards exist |
| 5 | **FSRS upgrade** (SM-2 → FSRS-5) | HIGH | S (~100 lines) | None |

### Phase 2: "Intelligence Layer" (6-8 weeks)
| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 6 | **Contextual AI explain** (right-click any node) | HIGH | S |
| 7 | **Enhanced AI review** (back-of-envelope + pattern detection) | HIGH | S |
| 8 | **Concurrency swim-lane timeline** | HIGH | M |
| 9 | **Weakness detection + targeted practice** | HIGH | M |
| 10 | **Separated streak model** | MEDIUM | S |

### Phase 3: "Flagship Features" (8-12 weeks)
| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 11 | **Socratic pattern discovery** (canvas-aware LLM tutor) | MASSIVE | L |
| 12 | **Pattern runtime animator** (Observer notify() as particles) | HIGH | M |
| 13 | **Architect Mode** (modify topology under live simulation) | MASSIVE | L |
| 14 | **Adaptive learning paths** | HIGH | M |

### Phase 4: "Premium & Growth" (12+ weeks)
| # | Feature | Impact | Effort |
|---|---------|--------|--------|
| 15 | **AI mock interview** (45-min with scorecard) | MASSIVE | XL |
| 16 | **Database surgery table** (query → index → buffer → disk) | WOW | L |
| 17 | **Progress sharing OG cards** (viral growth) | GROWTH | S |
| 18 | **Network protocol encapsulation visualizer** | HIGH | M |
| 19 | **Deep case studies** (Netflix, Uber, Stripe, etc.) | HIGH | L (content) |

---

## VIII. Key Metrics to Track

| Metric | Target | Why |
|--------|--------|-----|
| D1 retention | >60% | First day back rate |
| D7 retention | >30% | Habit formation threshold |
| D30 retention | >15% | Long-term engagement |
| Avg session length | 8-15 min | Micro-learning sweet spot |
| Learn mode completion | >70% | Content quality signal |
| Build mode entry after Learn | >40% | Transfer to practice |
| SRS review completion | >80% | Retention system health |
| Streak 7+ days | >30% of DAU | Habit strength |
| AI feature usage | >20% of sessions | AI value signal |
| NPS | >50 | Product-market fit |

---

## IX. The Single Most Important Insight

**Your simulation engine is the moat. Make it VISIBLE.**

Right now, the 10-stage tick pipeline, 35 pressure counters, chaos engine, cascade propagation, and cost model exist as pure computation returning numbers. The highest-leverage work is turning these numbers into visual experiences: **particles flowing through edges, nodes pulsing red under load, cascading failures propagating across the diagram.**

No competitor can copy this from a screenshot. Every competitor can copy a static diagram tool. The living, breathing simulation is what makes Architex impossible to replicate.

> **If you do ONE thing: ship data flow particles on edges.** It transforms Architex from "a nice diagram tool" to "a system that feels alive."

---

*Research sources: Mayer (2001, 2009), Sweller (1988), Bjork (1994), Paivio (1986), Kapur (2008), Roediger & Karpicke (2006), Duolingo Engineering Blog (2024), FSRS Benchmark (2024), Sailer & Homner gamification meta-analysis (2019), 16 competitor analyses with pricing/user data, full Architex codebase audit across 1,000+ files.*
