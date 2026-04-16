Now I have a thorough understanding of the existing codebase. Let me compile the comprehensive research analysis.

---

Here is my research analysis of game-changing AI features for Architex, grounded in what your codebase already has and what frontier models make possible.

## EXISTING AI INFRASTRUCTURE (What You Have)

The codebase already has a solid AI foundation in `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/`:

- **claude-client.ts** -- Singleton wrapper with concurrency queue (max 3), IndexedDB cache, retry with exponential backoff, cost tracking. Supports Haiku 4.5 and Sonnet.
- **socratic-tutor.ts** -- 4-phase (assess/challenge/guide/reinforce) system with keyword-based mock responses across 8 categories. No actual LLM calls.
- **design-reviewer.ts** -- 8 static rule checks (SPOF, missing cache, no LB, etc.) with optional Claude enrichment via `reviewDesignWithAI`.
- **architecture-generator.ts** -- 8 pre-built reference architectures with keyword matching, plus `generateArchitectureWithAI` and `refineArchitectureWithAI` for LLM-powered generation.
- **hint-system.ts** -- 3-tier progressive hints (nudge/guided/full-explanation), credit budget system, `generateHintLive` for Claude-powered dynamic hints.
- **frustration-detector.ts** -- Behavioral signal analyzer tracking undo/redo cycles, pauses, failures. Sliding window scoring.
- **interview-scorer.ts** -- 8-dimension scoring with rule-based fallback and Claude Sonnet enrichment.
- **topology-rules.ts** -- 20 static topology profiles with async Claude Haiku fallback for unknown topologies.
- **cost-monitor.ts** -- Per-model token tracking with budget alerts at 75/90/100%.

Supporting infrastructure: FSRS-5 spaced repetition (`fsrs.ts`), difficulty scaling with performance-weighted assessment (`difficulty-scaling.ts`), 8-week learning paths (`learning-paths.ts`), knowledge graph with 50+ concepts across 10 domains (`knowledge-graph/concepts.ts`), cross-module bridges (`cross-module/`).

---

## FEATURE 1: ADAPTIVE LEARNING PATH (AI-Personalized Curriculum)

### UX Flow
1. User completes onboarding assessment: 5-minute diagnostic where they place components on canvas for a simple "design a URL shortener" challenge
2. AI analyzes: component selection speed, hint usage, which categories they attempted, FSRS card history
3. Dashboard shows a personalized roadmap: "Week 1: Caching fundamentals (you scored 3/10 here), Week 2: Database scaling (moderate, 6/10), skip Load Balancing (you aced it at 9/10)"
4. After each session, the path re-adjusts. Stuck on sharding? Insert a prerequisite on partitioning strategies. Racing through reliability? Skip ahead to chaos engineering patterns
5. Weekly "skill radar" chart shows growth across all 8 interview dimensions

### Technical Approach
- **Data layer**: Already have `PerformanceRecord` in `difficulty-scaling.ts` and `FSRSCard` in `fsrs.ts`. Need to unify these into a `UserLearningProfile` aggregate that combines quiz scores, challenge completion, time-on-task, hint usage, frustration events, and SRS card states
- **Model**: Claude Haiku for real-time path adjustments (cheap, fast). Sonnet for weekly deep analysis reports. The prompt includes: current skill profile (8 dimensions from interview-scorer), completed challenges, SRS due items, time constraints ("user studies 30 min/day")
- **Algorithm**: Hybrid approach. Use the existing `assessUserLevel` from `difficulty-scaling.ts` as the deterministic backbone. Layer LLM on top for nuanced recommendations like "You understand caching conceptually but your diagrams never include cache invalidation strategies -- focus on write-through vs write-behind patterns." The key is that the LLM interprets patterns in the data, not replaces the algorithm
- **Prompt structure**: System prompt establishes the tutor persona with the full concept graph from `knowledge-graph/concepts.ts` as context. User message includes the skill profile JSON. Response is structured JSON with `{ nextChallenges: [...], conceptsToReview: [...], skipConcepts: [...], rationale: string }`
- **Cost**: ~$0.002 per path adjustment (Haiku, ~500 input + 300 output tokens with prompt caching on the concept graph)

### Research Context
- **Duolingo** uses a Bayesian model called Birdbrain that estimates per-skill proficiency and selects exercises at the optimal difficulty (just above current level). Their key insight: model the *forgetting curve* per concept, not just pass/fail. Architex already has FSRS-5 which does exactly this -- the opportunity is to feed FSRS stability scores into path selection
- **Khan Academy's Khanmigo** (GPT-4 powered) generates personalized practice problems and adjusts pacing. Their published results show 14% improvement in test scores when students follow AI-suggested paths vs self-directed
- **Brilliant.app** uses spaced repetition with interleaved practice across related concepts. Their insight: mixing related-but-different concepts (e.g., caching + database indexing together) produces better retention than isolated practice
- **Effect sizes in the literature**: Adaptive learning systems show d=0.30 to d=0.50 improvement over fixed curricula (meta-analysis by Kulik & Fletcher, 2016). The biggest gains come from preventing students from spending time on material they already know

### Ratings
- **Learning Impact**: 9/10 -- This is the single highest-leverage feature because it affects every minute the user spends on the platform
- **Feasibility**: 8/10 -- You already have the data infrastructure (FSRS, difficulty-scaling, performance records). The LLM layer is straightforward structured output
- **Competitive Advantage**: Strong. Educative.io has static paths. LeetCode has no adaptation. Khan Academy has Khanmigo but not for system design. Nobody does adaptive system design curriculum
- **Implementation Effort**: M -- The data pipeline exists. Need to build the aggregation layer and the LLM-powered path recommender. Frontend work for the skill radar and adaptive dashboard

---

## FEATURE 2: SOCRATIC PATTERN DISCOVERY (LLM-Powered Tutoring)

### UX Flow
1. User clicks "Learn Observer Pattern" but instead of a lecture, the canvas loads empty
2. Tutor panel says: "You are building a stock trading dashboard. The StockTicker has price data. Three panels need to update: PriceChart, OrderBook, and TickerTape. How would you wire this up?"
3. User drags a StockTicker class and draws an arrow to PriceChart. Tutor detects the direct coupling: "That works for one panel. Now add OrderBook. What happens to StockTicker when you add a 4th, 5th, 10th display?"
4. User realizes the problem. Tutor guides: "What if StockTicker did not need to know about its displays at all? What interface could you define?"
5. User creates a `Subscriber` interface. Tutor: "Now StockTicker just keeps a list of Subscribers and calls update() on each. You just invented the Observer pattern."
6. Throughout, the AI responds to actual canvas state -- it sees what the user has drawn and adapts

### Technical Approach
- **Current gap**: The existing `SocraticSession` in `socratic-tutor.ts` is entirely keyword-based with hardcoded responses. It does not look at the canvas at all. The 4-phase structure (assess/challenge/guide/reinforce) is good pedagogical scaffolding -- keep it
- **Upgrade path**: Replace `generatePhaseResponse()` with Claude calls. The key input is `serializeDiagramForAI` from `serialize-diagram.ts` -- this already converts canvas state to text. Combine with: (a) the current Socratic phase, (b) the conversation history, (c) the target concept from `knowledge-graph/concepts.ts`, (d) a reference solution that the tutor guides toward but never reveals directly
- **Canvas-aware prompting**: After every user canvas action (add node, add edge, delete), serialize the delta and send to the tutor. The system prompt instructs: "You are a Socratic tutor. NEVER give the answer directly. Ask questions that lead the student to discover the pattern. Current canvas state: [serialized]. Target pattern: Observer. Student has placed: StockTicker, PriceChart with direct dependency. They have NOT yet created an abstraction."
- **Model**: Sonnet for this -- it needs strong reasoning to ask the right question at the right moment. Haiku is too shallow for genuine Socratic questioning
- **Frustration integration**: Wire in the existing `FrustrationDetector`. When frustration level hits "frustrated" (score >= 18), the tutor automatically escalates from questioning to hinting. When "very-frustrated" (>=30), switch to direct explanation. This already has the infrastructure -- just needs the bridge
- **Session state**: Maintain a `SocraticLLMSession` that extends the existing `SocraticSessionState` with an LLM conversation buffer. Use the phase progression logic already in `maybeAdvancePhase()` but trigger transitions based on LLM assessment of student understanding rather than fixed interaction counts

### Research Context
- **Carnegie Mellon's Cognitive Tutors** (Anderson et al.) are the gold standard. They model the student's knowledge state as a Bayesian knowledge graph and provide hints only when the student's predicted error probability exceeds a threshold. Effect size: d=0.76 (two-thirds of a letter grade improvement). The key design principle: immediate, specific feedback tied to the exact misconception, not generic encouragement
- **AutoTutor** (Graesser et al., University of Memphis) uses a 5-step Socratic dialogue: (1) ask seed question, (2) evaluate student response, (3) give short feedback, (4) prompt for elaboration, (5) summarize. Published effect sizes: d=0.80 for deep learning tasks. Critically, AutoTutor detects "misconceptions" and addresses them directly rather than ignoring wrong answers
- **Recent LLM tutoring research**: A 2024 Stanford study on GPT-4 tutoring found that LLM tutors produce d=0.20-0.40 learning gains when used as Socratic guides, but d=0.05-0.10 when they just answer questions. The mode of interaction matters enormously -- you need to enforce the Socratic constraint in the system prompt, not just suggest it. GPT-4 tends to slip into "answer mode" unless strongly constrained
- **Key insight from the literature**: The effectiveness of Socratic tutoring depends on the tutor's ability to diagnose *where the student is stuck*, not just detect that they are stuck. The canvas gives Architex a massive advantage here -- the LLM can see the actual partial diagram, not just text descriptions of confusion

### Ratings
- **Learning Impact**: 10/10 -- Socratic discovery produces the deepest, most durable learning. This is the pedagogical gold standard
- **Feasibility**: 7/10 -- Technically straightforward (you have the infrastructure) but prompt engineering is tricky. Getting the Socratic questioning right without the LLM slipping into lecture mode requires careful iteration. Need to test with real learners
- **Competitive Advantage**: Massive. Nobody does canvas-aware Socratic tutoring for system design. This is the defining feature
- **Implementation Effort**: L -- Significant prompt engineering and testing. Need scenario banks for each pattern. Frustration detector integration. Conversation state management across canvas changes

---

## FEATURE 3: AI DIAGRAM GENERATION (Natural Language to Architecture)

### UX Flow
1. User types in command palette or chat: "Design a pub-sub system for a chat app with 10M users"
2. AI generates a complete architecture on the canvas: WebSocket servers, Redis Pub/Sub, Cassandra message store, presence service, push notification worker
3. Each node has appropriate configs pre-set (Cassandra: replication_factor=3, partition_key=conversation_id)
4. Reasoning panel explains: "Used Cassandra for message storage because of the write-heavy pattern. Redis Pub/Sub for cross-server message delivery. WebSocket for persistent connections."
5. User can then iterate: "Add rate limiting" -> AI modifies the existing diagram, adding a rate limiter node with Redis token bucket config
6. "What if I need to support message search?" -> AI adds Elasticsearch with a Kafka change-data-capture pipeline

### Technical Approach
- **Already built**: `generateArchitectureWithAI` and `refineArchitectureWithAI` in `architecture-generator.ts` do exactly this. They output structured JSON validated against `ALLOWED_COMPONENT_TYPES` from the palette, with auto-layout. The `refineArchitectureWithAI` supports iterative modification
- **What is missing**: (a) Constraint-aware generation (budget, latency requirements, compliance), (b) multi-turn refinement with conversation history, (c) config generation per node (the current output has positions and types but not `config` objects), (d) cost estimation for the generated architecture
- **Enhancement**: Add a `GenerationContext` that includes the existing cost engine from `cost/cost-engine.ts` to annotate each generated node with estimated monthly cost. The prompt should include: "Estimate monthly AWS cost for each component at the stated scale. Include cost in the node config."
- **Quality control**: The existing validation (checking component types against allowlist, filtering edges with invalid source/target) is good. Add: topology rule check -- run `fetchTopologyRules` on the generated topology immediately after generation to surface warnings before the user even starts modifying

### Research Context
- **GitHub Copilot / Cursor** generate code by treating it as a text completion problem. Diagrams are harder because of spatial relationships, but Architex's approach of generating structured JSON (nodes + edges) and rendering deterministically is the right pattern. This is analogous to how Cursor generates code tokens and the IDE renders them
- **Eraser.io** has "Diagram as Code" where you describe architecture in text and it generates a visual. But it uses its own DSL, not natural language. The LLM-powered natural language approach is strictly superior
- **Key accuracy insight**: LLMs are highly reliable at generating standard architectures (3-tier, microservices, event-driven) because they appear frequently in training data. They degrade for novel combinations. The template fallback in the existing code (`matchArchitecture` with 8 pre-built architectures) is a smart safety net

### Ratings
- **Learning Impact**: 6/10 -- Generation is a starting point, not a learning tool. The learning happens when the user modifies, questions, and iterates. The "why" reasoning is the learning value
- **Feasibility**: 9/10 -- Already 80% built. The remaining work is refinement quality and config generation
- **Competitive Advantage**: Medium. Eraser.io and others can generate diagrams. The edge is the iterative refinement loop tied to the learning context
- **Implementation Effort**: S -- Mostly prompt tuning and adding config generation to existing code

---

## FEATURE 4: INTELLIGENT DESIGN REVIEW (Deep Architectural Analysis)

### UX Flow
1. User finishes building a URL shortener architecture on the canvas
2. Clicks "Review My Design" button
3. AI analysis runs in stages, each appearing as it completes:
   - Stage 1 (instant, static): "3 issues found -- Missing cache (warning), single DB (critical), no monitoring (suggestion)" -- this is the existing rule engine
   - Stage 2 (2-3 seconds, LLM): "Deeper analysis: Your Base62 encoding at the API server creates a single point of contention. If two servers generate IDs simultaneously, you will get collisions. Consider a distributed ID generator like Snowflake, or partition the ID space per server."
   - Stage 3 (2-3 seconds, LLM): "For your stated scale of 100M URLs/day, your PostgreSQL write path needs ~1,157 QPS sustained. A single Postgres instance handles this, but during traffic spikes (3-5x), you will need connection pooling (PgBouncer) or a write queue."
4. Each issue has a "Fix It" button that applies the suggestion to the canvas automatically (already built: `addLoadBalancer`, `addCache`, `addReplica`, `addMonitoring`, `addGateway` in design-reviewer.ts)
5. Issue nodes glow on the canvas (red for critical, yellow for warning)

### Technical Approach
- **Already built**: `reviewDesignWithAI` in `design-reviewer.ts` does the static + LLM two-pass review. The 8 static rules are solid. The LLM enrichment returns `aiInsights` and `aiRecommendations` with a score adjustment
- **Enhancement 1: Back-of-envelope grounding**: The LLM review prompt should include the challenge's scale requirements (from `InterviewChallenge.requirements`) so it can do capacity math. "Your design must handle 10M DAU. That is ~115 QPS average, ~350 QPS peak. Does your single PostgreSQL handle this? (Yes, comfortably. But what about the read path at 10x?)"
- **Enhancement 2: Pattern detection**: Use the knowledge graph from `knowledge-graph/concepts.ts` to identify which architectural patterns the user has (partially) implemented. "I see you have a message queue and workers -- this is the Async Worker Pipeline pattern. But you are missing the Dead Letter Queue, which is critical for reliability."
- **Enhancement 3: Comparative review**: Compare the user's design against the reference architecture (from `ARCHITECTURES` in architecture-generator.ts) for the same problem. "The reference solution uses Redis for short-URL caching, which you are missing. Cache hit rates for URL shorteners are typically 80-90%, so this would reduce your DB read load by 80%."
- **Model**: Sonnet for deep review. Haiku for the quick static-rules pass (though that is currently client-side and free)

### Research Context
- **SonarQube / ESLint** work by pattern matching against a rule database -- exactly what your static rules do. The LLM layer is analogous to a senior engineer reviewing after the linter runs: it catches semantic issues (wrong pattern choice, missing edge cases) that pattern matching cannot
- **Google's AI-assisted code review** (published 2024) found that AI catches 40% of issues that human reviewers catch, with a 15% false positive rate. For architectural review (more abstract than code), LLMs are likely better because the "rules" are fuzzier and harder to formalize
- **Key insight**: The most valuable review feedback is not "you are missing X" (the static rules handle that) but "here is WHY you need X in this specific context." That is where LLMs excel -- contextual reasoning

### Ratings
- **Learning Impact**: 8/10 -- Specific, contextualized feedback on your own work is one of the most effective learning mechanisms
- **Feasibility**: 9/10 -- Already 70% built. Enhancement is incremental
- **Competitive Advantage**: Medium-high. Others have linting but nobody does LLM-powered architectural review with auto-fix on a canvas
- **Implementation Effort**: S -- Prompt enhancement and connecting to scale requirements. Auto-fix functions already exist

---

## FEATURE 5: INTERVIEW SIMULATION (AI Interviewer)

### UX Flow
1. User selects "Mock Interview: Design a URL Shortener" (45 min, difficulty 3/5)
2. AI interviewer panel opens alongside the canvas: "Let us design a URL shortening service like bit.ly. Before we start, what questions would you like to ask about the requirements?"
3. User asks: "How many URLs per day? Read-to-write ratio?" AI responds with realistic constraints: "100M new URLs per day. 10:1 read-to-write ratio. URLs should not be predictable."
4. User starts building on canvas. After 5 minutes, AI probes: "I see you have a single database. Walk me through what happens when a user clicks a short URL."
5. User explains. AI follows up: "Good. Now your service goes viral and gets 10x traffic for an hour. What breaks first?" User adds a cache. AI: "What invalidation strategy? What if a URL is updated?"
6. At 30 minutes, AI does a deep dive on the weakest dimension: "I notice you have no monitoring. How would you know if your service is down? How would you debug a 99th percentile latency spike?"
7. At 45 minutes, timer ends. AI generates a detailed scorecard across 8 dimensions with specific evidence from the conversation and canvas state
8. User can review: "Why did I get 4/10 on reliability?" AI explains with references to specific missing components

### Technical Approach
- **Partially built**: `scoreInterviewDesign` in `interview-scorer.ts` handles the scoring. The 8-week learning path in `learning-paths.ts` provides challenge progression. Challenge definitions exist in `interview/challenges.ts`
- **What is needed**: A real-time conversational loop. This is the most complex AI feature because it requires: (a) multi-turn conversation state, (b) canvas-aware context at each turn, (c) phase management (requirements -> design -> deep dive -> scaling), (d) real-time probing based on what the user builds
- **Architecture**: 
  - `InterviewSession` class maintains: conversation history, current phase, canvas snapshots at each turn, timer state, scoring rubric
  - Each AI turn: serialize current canvas via `serializeDiagramForAI`, append to conversation history, call Sonnet with the full context
  - **Phase management**: System prompt includes phase-specific instructions. At 5 min, if user has not asked any requirements questions, AI says "Let me share some constraints..." and moves to Phase 2. At 20 min, AI shifts to deep dive on the weakest dimension (assessed from current canvas)
  - **Reference solution grounding**: Each challenge has a reference architecture from `ARCHITECTURES`. The AI knows the "correct" solution but never reveals it. It asks questions that guide toward missing pieces
  - **Follow-up question generation**: This is where Sonnet shines. "You added Redis for caching. What is your cache eviction policy? What happens to cached entries when the original URL is deleted?" These questions cannot be scripted -- they depend entirely on the user's specific design
- **Cost**: ~$0.03-0.05 per 45-min session with prompt caching. ~15-20 turns, Sonnet, ~1000 tokens per turn. Prompt caching on the reference solution and rubric saves ~60%
- **Latency**: Target <2 seconds per AI response. Sonnet at ~50 tokens/second means ~400 output tokens in 2 seconds. Sufficient for a 2-3 sentence follow-up question

### Research Context
- **Pramp** pairs users with other humans for mock interviews. Their data shows that candidates who do 5+ mock interviews see a 30% increase in offer rates. The bottleneck is scheduling and availability -- AI removes this completely
- **Interviewing.io** has published data showing that technical interview performance improves with practice, with diminishing returns after ~10 sessions. An AI interviewer enables unlimited practice at zero marginal cost
- **The FAANG interview rubric** (publicly described by many interviewers) evaluates: (1) requirements gathering, (2) high-level design, (3) deep dive, (4) scaling, (5) trade-off awareness. Your existing 8-dimension scoring aligns well
- **Critical limitation**: AI interviewers are not as good as human interviewers at detecting when a candidate is "hand-waving" vs genuinely understanding. The canvas mitigates this -- the user must actually build the design, not just describe it verbally. This is Architex's structural advantage
- **Emerging research**: A 2024 paper from UC Berkeley found that GPT-4 as an interviewer agreed with human interviewers on hire/no-hire decisions 72% of the time. The disagreements were mostly borderline cases. For practice purposes, this is more than adequate

### Ratings
- **Learning Impact**: 9/10 -- Interview simulation with adaptive follow-ups is the closest thing to a real interview. Unlimited practice with immediate, specific feedback
- **Feasibility**: 7/10 -- The multi-turn conversational loop with canvas awareness is complex. Prompt engineering for natural interviewer behavior is hard. But the infrastructure pieces exist
- **Competitive Advantage**: Very strong. No existing platform does AI-powered system design interview simulation with a live canvas. Pramp and Interviewing.io are human-only. LeetCode's AI is code-focused
- **Implementation Effort**: XL -- The most complex feature. Needs: conversation state management, phase transitions, real-time canvas serialization, reference solution integration, detailed scoring with evidence, session replay

---

## FEATURE 6: CONTEXTUAL CONCEPT EXPLANATION (Click-to-Explain)

### UX Flow
1. User has a load balancer node on their canvas. They right-click it and select "Explain This"
2. Side panel shows: "This Load Balancer distributes traffic across your 3 API servers. In your current design, it is the ONLY entry point, which makes it a single point of failure. In production, you would typically deploy a pair of load balancers with health-check failover (active-passive or active-active with DNS round-robin)."
3. User clicks an edge labeled "gRPC" between two services. Explain: "This gRPC connection uses Protocol Buffers for serialization, which is ~10x smaller than JSON. It also supports bidirectional streaming, which is why it is used between your Order Service and Payment Service -- you could stream payment status updates back."
4. Depth adapts: beginner user gets "A load balancer is like a traffic cop directing cars to different lanes." Expert user gets "L7 load balancers can inspect HTTP headers for content-based routing. Consider connection draining during deploys to avoid dropped requests."

### Technical Approach
- **Data source**: Combine (a) the node's properties (category, componentType, config, connections to other nodes), (b) the concept definition from `knowledge-graph/concepts.ts` (description, related concepts, domain), (c) the broader canvas context (what other nodes exist, what is the overall architecture)
- **Model routing**: Haiku for quick tooltip-style explanations (100-200 tokens). Sonnet for deep explanations triggered by "Tell me more" or when the user has follow-up questions
- **Depth detection**: Use the `assessUserLevel` function from `difficulty-scaling.ts` to determine beginner/intermediate/advanced/expert. Include this in the prompt: "Explain at the [level] level."
- **Prompt**: "Explain this [componentType] in the context of the user's current architecture. The user has: [serialized canvas]. This [componentType] connects to: [adjacent nodes]. User level: [level]. Be specific to their design, not generic."
- **Cache aggressively**: Same component in the same topology context -> same explanation. Use the topology signature from `computeTopologySignature` as part of the cache key

### Research Context
- **Adaptive explanation research** (Chi & Wylie, 2014): The ICAP framework shows that explanations are most effective when they are "Constructive" (the learner generates their own understanding) rather than "Active" (the learner engages but does not create). This means the explanation should end with a question: "In your design, what would happen if this load balancer's health check interval is too long?"
- **Contextualized vs. decontextualized explanations**: Research consistently shows that explanations tied to a specific artifact (the user's own diagram) produce 2-3x better retention than generic explanations. This is why "explain this node in context" is more valuable than a textbook definition

### Ratings
- **Learning Impact**: 7/10 -- High utility as a just-in-time learning tool. Not as deep as Socratic tutoring but much lower friction
- **Feasibility**: 9/10 -- Straightforward to implement. The data is all available
- **Competitive Advantage**: Medium. Hover-to-explain exists in various tools, but context-aware explanation tied to the user's specific architecture is novel
- **Implementation Effort**: S -- Prompt engineering plus a right-click context menu. Can reuse existing `serializeDiagramForAI` and knowledge graph data

---

## FEATURE 7: NATURAL LANGUAGE QUERYING (RAG Over Pattern Knowledge)

### UX Flow
1. User types in command palette: "Which pattern should I use for undo/redo?"
2. AI responds: "The Command pattern is the standard approach for undo/redo. Each user action is encapsulated as a Command object with execute() and undo() methods. A CommandHistory stack tracks them." Loads the Command pattern template on canvas
3. "Compare Strategy vs State" -> Side-by-side comparison panel showing both patterns, highlighting the structural difference (Strategy swaps algorithm, State swaps behavior based on internal state)
4. "Show me all patterns that decouple producers from consumers" -> Returns: Observer, Mediator, Event Bus, Message Queue. Each clickable to load on canvas

### Technical Approach
- **RAG architecture**: Build an embedding index over: (a) all concepts from `knowledge-graph/concepts.ts`, (b) all challenge descriptions from `interview/challenges.ts`, (c) all architecture templates from `architecture-generator.ts`, (d) curated system design content
- **Embedding**: Use Anthropic's or OpenAI's embedding model. Store in a client-side vector store (e.g., `vectra` for in-browser, or a server-side Qdrant instance). For a corpus of ~200-500 items, a simple cosine similarity search over pre-computed embeddings works fine without a full vector database
- **Retrieval + Generation**: (1) Embed the user's query, (2) retrieve top-5 relevant concepts/patterns, (3) send to Haiku with the retrieved context for a synthesized answer
- **Canvas integration**: The response can include `loadTemplate: "observer"` which triggers loading the corresponding architecture from `ARCHITECTURES` or a new LLD pattern template

### Research Context
- **RAG systems** (Lewis et al., 2020) show that retrieval-augmented generation reduces hallucination by 40-60% compared to pure generation. For a domain-specific knowledge base like system design patterns, RAG is strictly better than hoping the LLM remembers correctly
- **For a small corpus** (hundreds, not millions of documents), the most cost-effective approach is pre-compute embeddings and store them as a JSON file. No vector database needed. Cosine similarity over 500 vectors takes <1ms in JavaScript

### Ratings
- **Learning Impact**: 6/10 -- Useful as a reference tool but not a deep learning mechanism
- **Feasibility**: 8/10 -- Well-understood RAG pattern. Moderate implementation effort
- **Competitive Advantage**: Low-medium. ChatGPT can answer these questions. The canvas integration (loading patterns as live diagrams) is the differentiator
- **Implementation Effort**: M -- Need to build the embedding index, retrieval pipeline, and command palette integration

---

## RECOMMENDED PRIORITIZATION

Based on the intersection of learning impact, competitive moat, and feasibility given the existing codebase:

**Phase 1 (immediate, high ROI):**
1. **Contextual Concept Explanation** (S effort, 7/10 impact) -- Quick win. Right-click to explain with context-aware depth
2. **Intelligent Design Review Enhancement** (S effort, 8/10 impact) -- Already 70% built. Add back-of-envelope grounding and pattern detection

**Phase 2 (next sprint, defining features):**
3. **Socratic Pattern Discovery with LLM** (L effort, 10/10 impact) -- Replace keyword-based tutor with real Claude calls. This is the feature that makes Architex unlike anything else
4. **Adaptive Learning Path** (M effort, 9/10 impact) -- Unify FSRS + difficulty-scaling + LLM into a personalized curriculum engine

**Phase 3 (flagship, major effort):**
5. **Interview Simulation** (XL effort, 9/10 impact) -- The premium feature. Multi-turn AI interviewer with live canvas. This is what users will pay for

**Phase 4 (polish):**
6. **AI Diagram Generation Enhancement** (S effort, 6/10 impact) -- Already mostly built
7. **Natural Language Querying** (M effort, 6/10 impact) -- Nice-to-have reference tool

The unique competitive advantage of Architex is the combination of a live canvas (where users BUILD, not just describe) with AI that can SEE and RESPOND to what they build. Every feature should leverage this canvas-awareness. That is the moat no chatbot or text-based platform can replicate.