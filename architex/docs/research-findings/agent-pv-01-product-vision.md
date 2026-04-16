I now have a comprehensive understanding of Architex's current state. Here is the complete feature universe.

---

# ARCHITEX: COMPLETE PRODUCT FEATURE UNIVERSE

## Executive Summary

Architex is already a remarkably deep engineering learning platform: 13 modules, 1000+ files, 36 design patterns with UML, FSRS spaced repetition, a chaos engineering simulator, what-if analysis, AI-powered review (Claude), code-to-diagram bidirectional sync, cross-module concept mapping, and a full billing/plans system. This is not a prototype -- it is a working product with real infrastructure.

The feature map below identifies every dimension where Architex can expand, rated against what already exists. Where the codebase already has a feature, I note the exact file path. Where a gap exists, I describe precisely what to build and why it matters, backed by learning science.

---

## A. LEARNING MODES

### A1. Guided Lessons (Brilliant-style)

**What it is.** Step-by-step interactive lessons where each screen presents one concept, asks a question, then reveals the answer before advancing. The learner never passively reads -- every 30-60 seconds they must actively engage.

**Why it matters.** The "testing effect" (Roediger & Karpicke, 2006) shows that retrieving information from memory strengthens retention far more than re-reading. Brilliant's entire business ($150M+ ARR) is built on this principle. Interleaving questions with content produces 50-100% better long-term retention than passive consumption.

**Best-in-class reference.** Brilliant.org, 3Blue1Brown's interactive essays, Explorable Explanations.

**Current state in Architex.** Partially exists. The LLD module has pattern walkthroughs (`/architex/src/components/modules/lld/panels/WalkthroughPlayer.tsx`), prediction prompts in pattern definitions (e.g., the Singleton pattern's `predictionPrompts` array in `/architex/src/lib/lld/patterns.ts`), and the Socratic tutor (`/architex/src/lib/ai/socratic-tutor.ts`) has a 4-phase model. But there is no unified "lesson" format that every module uses.

**How it would work.** Create a `LessonEngine` that wraps any module's content into a sequence: (1) visual presentation with diagram animation, (2) prediction question ("what happens if we add a second database?"), (3) reveal with animation, (4) mini-quiz, (5) advance. Each lesson is a JSON definition with steps, and the engine renders them identically across all 13 modules.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 8/10. Differentiation: 7/10. Implementation Effort: L.

**Priority: Must-have.**

---

### A2. Progressive Canvas (Watch Diagram Build)

**What it is.** A timeline-based playback where the user watches a system architecture assemble itself node by node, with narration explaining each decision. "First we need a load balancer because..." then the node appears. "Next, we add a cache layer to handle read-heavy traffic..." and the cache materializes with an animated edge.

**Why it matters.** Dual coding theory (Paivio, 1971) -- combining visual and verbal channels doubles encoding strength. Watching an expert think aloud while building reveals the *reasoning process*, not just the final artifact. This is the single hardest thing to learn from textbooks: why each component was added in a specific order.

**Best-in-class reference.** Manim (3Blue1Brown), Excalidraw "watch me draw," Code.org's block-based animation playback.

**Current state in Architex.** The sequence diagram playback exists (`/architex/src/components/modules/lld/canvas/SequenceDiagramCanvas.tsx`) with narration per message step. The LLD walkthrough player exists. But there is no equivalent for the system design canvas -- you cannot watch a URL Shortener architecture assemble step-by-step.

**How it would work.** Each of the 8 reference architectures in `/architex/src/lib/ai/architecture-generator.ts` gets a `buildSequence` array: `[{step: 1, addNode: "client", narration: "Every system starts with a client..."}, {step: 2, addNode: "api-gateway", narration: "We place an API gateway to decouple..."}, ...]`. The canvas plays these with staggered Framer Motion animations. The GIF recorder (`/architex/src/lib/export/gif-recorder.ts`) already exists, so recordings can be exported.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 9/10. Differentiation: 9/10. Implementation Effort: M.

**Priority: Must-have.**

---

### A3. Reference Mode (Deep Read)

**What it is.** A traditional documentation view with long-form content, interactive diagrams inline, code samples, and academic references. Think of it as a textbook page that happens to have live diagrams embedded in it.

**Current state in Architex.** The concept pages exist (`/architex/src/app/concepts/[slug]/page.tsx`), the blog exists (`/architex/src/app/blog/[slug]/page.tsx`), and pattern descriptions in `/architex/src/lib/lld/patterns.ts` have rich text including `description`, `analogy`, `tradeoffs`, `summary`, and `youAlreadyUseThis`. The embed system (`/architex/src/app/embed/`) allows diagrams to render in isolation. This mode is largely built.

**What is missing.** Cross-linking between reference content and interactive modules. When reading about "Consistent Hashing" in reference mode, there should be a one-click bridge to the Distributed Systems module's interactive simulation. The `CONCEPT_MODULE_MAP` in `/architex/src/lib/cross-module/concept-module-map.ts` has the data -- it just needs UI integration in the reference view.

**Ratings.** Learning Impact: 6/10. Engagement Impact: 4/10. Differentiation: 3/10. Implementation Effort: S.

**Priority: Should-have.**

---

### A4. Video / Animation Mode

**What it is.** Auto-generated explainer animations that turn any diagram + narration sequence into a Manim-style video. The user presses "Watch" and gets a 2-3 minute animated walkthrough with voiceover (text-to-speech or pre-recorded).

**Why it matters.** Mayer's multimedia learning principles (2009) show that well-designed animations with synchronized narration outperform static diagrams for complex spatial-temporal processes (like how a message flows through a distributed system). However, animations without interactivity can reduce learning (the "seductive details" effect), so this must link back to interactive practice.

**Best-in-class reference.** 3Blue1Brown, Fireship 100-second explainers, ByteByteGo animated system design.

**Current state.** The GIF recorder exists. Sequence diagrams have narration text. No video generation pipeline exists.

**How it would work.** Use the existing progressive canvas build sequences, render them with motion.dev animations, capture via the GIF recorder (extend to WebM via MediaRecorder API), and overlay text-to-speech via the Web Speech API. Each pattern and architecture template gets an auto-generated 90-second walkthrough.

**Ratings.** Learning Impact: 6/10. Engagement Impact: 7/10. Differentiation: 6/10. Implementation Effort: L.

**Priority: Nice-to-have.**

---

### A5. Audio-Guided Tours

**What it is.** A podcast-style audio companion that explains the on-screen diagram while the user looks at it. Think museum audio guide for architecture diagrams.

**Why it matters.** Modality principle (Mayer, 2009) -- presenting words as narration rather than on-screen text reduces cognitive load because it uses the auditory channel instead of competing with visual processing of the diagram.

**Current state.** Sound infrastructure exists (`/architex/src/hooks/useSound.ts`, `/architex/src/hooks/useAlgorithmSound.ts`, `/architex/src/components/shared/SoundToggle.tsx`). Narration text exists for sequence diagrams. No spoken audio.

**Ratings.** Learning Impact: 5/10. Engagement Impact: 5/10. Differentiation: 4/10. Implementation Effort: M.

**Priority: Nice-to-have.**

---

## B. SIMULATION & INTERACTION

### B1. State Machine Simulator

**Current state: BUILT.** Full implementation at `/architex/src/lib/lld/state-machine.ts` with multiple examples (Order Lifecycle, TCP Connection). Canvas rendering at `/architex/src/components/modules/lld/canvas/StateMachineCanvas.tsx`. States have entry/exit actions, transitions have guards and triggers.

**What is missing.** User-created state machines (currently pre-built only). The editor should allow dragging states onto the canvas and connecting them with transitions, then simulating the machine by clicking triggers.

**Ratings.** Learning Impact: 8/10. Engagement Impact: 7/10. Differentiation: 7/10. Implementation Effort: M (to add editor mode).

---

### B2. Sequence Diagram Playback

**Current state: BUILT.** Full implementation at `/architex/src/lib/lld/sequence-diagram.ts` with rich examples (HTTP Request Lifecycle, OAuth PKCE). Each message has production-grade narration explaining why that architectural decision was made. Canvas at `/architex/src/components/modules/lld/canvas/SequenceDiagramCanvas.tsx`. Latency overlay at `/architex/src/components/modules/lld/SequenceDiagramLatencyOverlay.tsx`.

**This is best-in-class.** No competitor has sequence diagram playback with per-message narration that explains production infrastructure decisions.

---

### B3. What-If Analysis

**Current state: BUILT.** Full implementation at `/architex/src/lib/simulation/what-if-engine.ts`. Supports 7 scenario types: remove-node, double-traffic, add-cache, remove-cache, scale-up, scale-down, inject-failure. Runs comparative 10-tick simulations and produces delta metrics with human-readable insights.

**What is missing.** Side-by-side visual comparison. Currently returns metrics; should also render two canvases -- original and modified -- so the user sees the visual impact. The architecture-diff engine at `/architex/src/lib/simulation/architecture-diff.ts` already exists for this.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 8/10. Differentiation: 10/10. Implementation Effort: M (for visual comparison UI).

---

### B4. Live Data Flow Visualization (Particles)

**Current state: PARTIALLY BUILT.** The edge flow tracker at `/architex/src/lib/simulation/edge-flow-tracker.ts` and particle path cache at `/architex/src/lib/simulation/particle-path-cache.ts` exist. The simulation orchestrator at `/architex/src/lib/simulation/simulation-orchestrator.ts` drives the traffic simulation. Pressure counters at `/architex/src/lib/simulation/pressure-counters.ts` (35 counter types) track live metrics per node.

**What is missing.** Particle rendering on the canvas edges. The data flow numbers exist; the visual particles flowing along edges are not yet rendered in the React Flow edge components.

**Ratings.** Learning Impact: 7/10. Engagement Impact: 9/10. Differentiation: 9/10. Implementation Effort: M.

**Priority: Must-have** (this is the "wow" feature that makes the platform feel alive).

---

### B5. Latency Simulator

**Current state: BUILT.** Latency budget calculator at `/architex/src/lib/simulation/latency-budget.ts`. Latency numbers at `/architex/src/lib/constants/latency-numbers.ts`. The queuing model at `/architex/src/lib/simulation/queuing-model.ts` calculates per-node latency. The "Show Your Work" calculator at `/architex/src/components/shared/show-your-work-calculator.tsx` provides back-of-the-envelope estimation.

---

### B6. Load Testing Visualization

**Current state: PARTIALLY BUILT.** Traffic simulator at `/architex/src/lib/simulation/traffic-simulator.ts`. Capacity planner at `/architex/src/lib/simulation/capacity-planner.ts`. Queuing model with Little's Law. The simulation metrics bus broadcasts live metrics. What is missing is a "ramp up traffic" UI: a slider that goes from 100 RPS to 100K RPS while the user watches nodes turn red, queues overflow, and latencies spike. The pressure counter tracker (`pressure-counter-tracker.ts`) is ready for this.

**Ratings.** Learning Impact: 8/10. Engagement Impact: 8/10. Differentiation: 9/10. Implementation Effort: M.

**Priority: Should-have.**

---

### B7. Chaos Engineering Simulator

**Current state: BUILT.** Full implementation at `/architex/src/lib/simulation/chaos-engine.ts` with 30+ chaos events across 10 categories (infrastructure, network, data, traffic, dependency, application, security, resource, external, cache). Cascade engine at `/architex/src/lib/simulation/cascade-engine.ts` models failure propagation. Narrative engine at `/architex/src/lib/simulation/narrative-engine.ts` generates human-readable explanations of what happened.

**This is a genuine differentiator.** No learning platform lets you inject chaos events into your architecture and watch the cascade propagate with natural-language explanations.

---

## C. PRACTICE & ASSESSMENT

### C1. Timed Interview Practice

**Current state: BUILT.** Full implementation across multiple files. Interview store at `/architex/src/stores/interview-store.ts` with IndexedDB persistence for warm-resume (if the browser crashes mid-interview, the session survives). Timer bar at `/architex/src/components/modules/lld/panels/InterviewPractice.tsx` with color-coded urgency. 20+ challenges at `/architex/src/lib/interview/challenges.ts` with company tags (Google, Meta, Amazon, Stripe, etc.), multi-level hints with point costs, and per-dimension scoring.

---

### C2. Build-from-Scratch Challenges

**Current state: BUILT.** LLD challenges at `/architex/src/lib/interview/lld-challenges.ts`. The auto-grader at `/architex/src/components/modules/lld/panels/AutoGrader.tsx` evaluates user-drawn UML diagrams. The grading engine at `/architex/src/lib/lld/grading-engine.ts` checks structural correctness. Scenario challenges at `/architex/src/components/modules/lld/panels/ScenarioChallenge.tsx`.

---

### C3. Auto-Graded Diagram Submission

**Current state: BUILT.** Grading engine at `/architex/src/lib/lld/grading-engine.ts` with tests at `/architex/src/lib/lld/__tests__/grading-engine.test.ts`. AI interview scorer at `/architex/src/lib/ai/interview-scorer.ts` provides Claude-powered deeper analysis. Scoring system at `/architex/src/lib/interview/scoring.ts`.

---

### C4. Code Implementation Challenges

**What it is.** Given a diagram, write the code that implements it. Or: given a problem statement, write both the code and draw the diagram. Verify both match.

**Current state.** Bidirectional sync between code and diagram exists (`/architex/src/lib/lld/bidirectional-sync.ts`). Code-to-diagram conversion at `/architex/src/lib/lld/codegen/code-to-diagram.ts`. Diagram-to-TypeScript at `/architex/src/lib/lld/codegen/diagram-to-typescript.ts`, diagram-to-Python at `/architex/src/lib/lld/codegen/diagram-to-python.ts`. Java code at `/architex/src/lib/lld/java-code.ts`. The Mermaid editor exists at `/architex/src/components/modules/lld/panels/MermaidEditor.tsx`.

**What is missing.** A challenge mode where the user writes code in an embedded editor and the grader verifies it matches the expected pattern. The code generation and parsing infrastructure exists; the "write code, get graded" workflow does not.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 7/10. Differentiation: 8/10. Implementation Effort: L.

**Priority: Should-have.**

---

### C5. Scenario-Based Decision Making

**What it is.** "You are the lead architect at a startup that just got 10x traffic overnight. Your current architecture is [diagram]. You have 4 hours and $500/month budget. What do you change?" The user modifies the diagram and gets scored on the decisions.

**Current state.** Scenario challenges exist in the LLD module. What-if engine exists. Cost model at `/architex/src/lib/simulation/cost-model.ts` and cost engine at `/architex/src/lib/cost/cost-engine.ts` can evaluate monetary cost of architectures. The difficulty scaling system at `/architex/src/lib/interview/difficulty-scaling.ts` adapts to user ability.

**What is missing.** Tying the cost model + what-if engine + challenge system together into a "scenario simulation" mode for the system design module. The pieces exist; the integration does not.

**Ratings.** Learning Impact: 10/10. Engagement Impact: 9/10. Differentiation: 10/10. Implementation Effort: M.

**Priority: Must-have.**

---

### C6. Pattern Identification from Code

**What it is.** Show a code snippet and ask: "Which design pattern is this?" or "What's wrong with this code from a SOLID perspective?"

**Current state.** SOLID violation spotter exists at `/architex/src/components/modules/lld/panels/SOLIDViolationSpotter.tsx`. SOLID quiz at `/architex/src/components/modules/lld/panels/SOLIDQuiz.tsx`. Pattern quiz at `/architex/src/components/modules/lld/panels/PatternQuiz.tsx` with filtered variant. Anti-pattern auto-detector at `/architex/src/components/modules/interview/AntiPatternAutoDetector.tsx`.

**This is well-covered.**

---

### C7. System Design Mock Interview

**What it is.** A full 45-minute simulated interview with an AI interviewer that asks follow-up questions, probes weak areas, and provides a detailed scorecard at the end.

**Current state.** The Socratic tutor at `/architex/src/lib/ai/socratic-tutor.ts` has the conversation infrastructure. The interview scorer at `/architex/src/lib/ai/interview-scorer.ts` can evaluate designs. The simulate-your-answer button at `/architex/src/components/modules/interview/SimulateYourAnswerButton.tsx` exists.

**What is missing.** The full mock interview flow: (1) interviewer presents problem, (2) user asks clarifying questions (AI responds), (3) user builds diagram while explaining, (4) interviewer probes ("what about consistency?"), (5) deep-dive into a subsystem, (6) scorecard with dimension-by-dimension feedback.

**Ratings.** Learning Impact: 10/10. Engagement Impact: 9/10. Differentiation: 9/10. Implementation Effort: XL.

**Priority: Should-have** (requires significant AI prompt engineering and orchestration).

---

## D. RETENTION & REVIEW

### D1. Spaced Repetition (FSRS Algorithm)

**Current state: BUILT.** Full FSRS implementation at `/architex/src/lib/interview/srs.ts` with difficulty tracking, stability calculation, interval scheduling, lapse handling, and retention statistics. The due-reviews hook at `/architex/src/hooks/use-due-reviews.ts` surfaces cards needing review.

**Quality note.** This is a proper implementation with retrievability-based stability updates, not a simplified Leitner box. The code correctly implements forgetting curves with `Math.exp(-elapsedDays / stability)`.

---

### D2. Flashcards

**Current state: BUILT.** Full implementation at `/architex/src/components/modules/lld/panels/Flashcards.tsx` with swipe/keyboard navigation, flip animation, shuffle mode, category filtering, and CSV export for Anki import. Cards show pattern name, 3-bullet summary, analogy, and class list.

---

### D3. Daily Challenges

**Current state: BUILT.** Deterministic daily challenge selection at `/architex/src/lib/interview/daily-challenge.ts` using date-seeded hashing. Difficulty varies by day-of-week (Monday=easy through Friday=hard). Data structures module has a DailyChallenge component. LLD module has one too.

---

### D4. Streak System

**Current state: BUILT.** Streak tracking in progress store at `/architex/src/stores/progress-store.ts`. Streak badge UI at `/architex/src/components/interview/StreakBadge.tsx`. Streak counter in LLD at `/architex/src/components/modules/lld/panels/StreakCounter.tsx`. Achievements system includes streak-based badges ("Week Warrior," "Month Marathoner").

---

### D5. Micro-Review Sessions (2-min Daily)

**What it is.** A minimal daily review that takes exactly 2 minutes: 3-5 due flashcards from FSRS + 1 quick quiz question + 1 "identify this pattern" challenge. Surfaces on app open if there are due cards.

**Current state.** All the pieces exist (FSRS, flashcards, quizzes, daily challenges). The review widget at `/architex/src/components/modules/lld/panels/ReviewWidget.tsx` exists. The inactivity nudge at `/architex/src/components/shared/InactivityNudge.tsx` and next-module nudge at `/architex/src/components/shared/NextModuleNudge.tsx` exist.

**What is missing.** A single "Daily Review" screen that aggregates due cards across all modules into a 2-minute session. The cross-module store (`/architex/src/stores/cross-module-store.ts`) tracks per-module mastery, so the aggregation layer exists at the data level.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 8/10. Differentiation: 7/10. Implementation Effort: S.

**Priority: Must-have.**

---

### D6. Forgetting Curve Visualization

**What it is.** A personal analytics dashboard showing each concept's retention probability over time, with curves rising after reviews and decaying between them. Shows the user *why* spaced repetition works.

**Current state.** The FSRS implementation already calculates retention probability per card (`Math.exp(-elapsed / stability)`). The `getRetentionStats` function returns average retention. The canvas chart hook at `/architex/src/hooks/use-canvas-chart.ts` provides chart rendering infrastructure.

**What is missing.** A visual dashboard that plots individual concept curves over time.

**Ratings.** Learning Impact: 5/10. Engagement Impact: 7/10. Differentiation: 8/10. Implementation Effort: M.

**Priority: Nice-to-have.**

---

## E. AI-POWERED FEATURES

### E1. Socratic Tutor

**Current state: BUILT.** Full 4-phase implementation at `/architex/src/lib/ai/socratic-tutor.ts` (Assess, Challenge, Guide, Reinforce). Has keyword-based mock responses for offline use, with optional Claude-powered enrichment when API key is configured. Frustration detector at `/architex/src/lib/ai/frustration-detector.ts`.

---

### E2. AI Diagram Review

**Current state: BUILT.** Static analysis engine at `/architex/src/lib/ai/design-reviewer.ts` with rule-based checks (single points of failure, missing caching, no load balancer, unprotected databases, missing monitoring). Claude-powered deep analysis available. Topology rules at `/architex/src/lib/ai/topology-rules.ts`.

---

### E3. Natural Language to Diagram

**Current state: BUILT.** Architecture generator at `/architex/src/lib/ai/architecture-generator.ts` with 8 reference architectures and keyword-based matching for offline use. Claude-powered free-form generation when AI is configured. Hint system at `/architex/src/lib/ai/hint-system.ts`.

---

### E4. Code-to-Diagram Conversion

**Current state: BUILT.** Bidirectional sync at `/architex/src/lib/lld/bidirectional-sync.ts`. Code-to-diagram at `/architex/src/lib/lld/codegen/code-to-diagram.ts` with tests. Mermaid-to-diagram at `/architex/src/lib/lld/codegen/mermaid-to-diagram.ts`.

---

### E5. Personalized Learning Path

**What it is.** AI analyzes the user's performance data (which challenges they struggled with, which concepts they forget, which modules they skip) and generates a customized study plan.

**Current state.** Structured learning paths exist at `/architex/src/lib/interview/learning-paths.ts` (8-week System Design Prep, etc.). Difficulty scaling at `/architex/src/lib/interview/difficulty-scaling.ts` adapts challenge difficulty. Cross-module mastery tracking at `/architex/src/stores/cross-module-store.ts`. Learning path map UI at `/architex/src/components/modules/lld/sidebar/LearningPathMap.tsx`. Study plan panel at `/architex/src/components/modules/lld/panels/StudyPlan.tsx`.

**What is missing.** The paths are currently static JSON, not dynamically generated from user performance data. The mastery scores and FSRS data could feed into an algorithm that reorders and emphasizes specific topics.

**Ratings.** Learning Impact: 8/10. Engagement Impact: 7/10. Differentiation: 7/10. Implementation Effort: L.

**Priority: Should-have.**

---

### E6. Weakness Detection and Targeted Practice

**What it is.** Automatic identification of knowledge gaps from quiz performance, SRS lapses, and challenge scores, followed by targeted drills.

**Current state.** The FSRS system tracks lapses per card. The progress store tracks per-dimension scores. The achievements system at `/architex/src/lib/interview/achievements.ts` tracks `dimensionScores: Record<string, number[]>`. The auto-quiz at `/architex/src/components/modules/data-structures/AutoQuiz.tsx` exists.

**What is missing.** A "weakness detector" that aggregates these signals and generates a "Fix Your Weaknesses" practice session. The data exists across stores; the aggregation and recommendation engine does not.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 7/10. Differentiation: 8/10. Implementation Effort: M.

**Priority: Should-have.**

---

## F. SOCIAL & ENGAGEMENT

### F1. Leaderboards

**Current state: BUILT.** Full implementation at `/architex/src/lib/interview/leaderboard.ts` with weekly/monthly/all-time periods, deterministic mock data generation (seeded RNG), badge pool, and user positioning. Currently uses mock data with realistic distributions.

**What is missing.** Real backend persistence. The leaderboard engine is fully built for client-side; a server component (Neon PostgreSQL, which is already a dependency at `/architex/node_modules/.pnpm/@neondatabase+serverless@1.0.2/`) would make this real.

---

### F2. Achievements / Badges

**Current state: BUILT.** Extensive system at `/architex/src/lib/interview/achievements.ts` with 6 categories (learning, design, streak, mastery, social, exploration), 4 rarity tiers (common, rare, epic, legendary), XP rewards, and multi-step progress tracking. 30+ defined achievements including "First Design," "No Hints Needed," "Speed Demon," "Chaos Survivor."

---

### F3. Study Groups

**What it is.** Rooms where 2-5 users can collaboratively build diagrams, with shared cursors, real-time sync, and voice/text chat.

**Current state.** Collaboration store at `/architex/src/stores/collaboration-store.ts` with collaborator presence, cursor tracking, selection sync, and room management. Tests at `/architex/src/stores/__tests__/collaboration-store.test.ts`.

**What is missing.** The WebSocket/WebRTC transport layer. The store-level abstraction is ready; real-time communication is not implemented.

**Ratings.** Learning Impact: 7/10. Engagement Impact: 8/10. Differentiation: 8/10. Implementation Effort: XL.

**Priority: Nice-to-have** (high effort, medium learning impact).

---

### F4. Shared Diagrams

**Current state: PARTIALLY BUILT.** URL export at `/architex/src/lib/export/to-url.ts` with LZ compression via `lz-string`. Share dialog at `/architex/src/components/shared/ShareDialog.tsx`. Embed routes for LLD patterns, SOLID, and problems. What is missing: a gallery/social feed of community-shared diagrams.

---

### F5. Interview Buddy Matching

**What it is.** Algorithm that pairs two users of similar skill level for mock interview practice. One acts as interviewer, the other as candidate, then they switch.

**Ratings.** Learning Impact: 9/10. Engagement Impact: 8/10. Differentiation: 7/10. Implementation Effort: XL.

**Priority: Nice-to-have** (requires real-time matching infrastructure).

---

### F6. Progress Sharing

**What it is.** Shareable cards showing learning progress (LinkedIn/Twitter-ready). "I've completed 15 system design challenges and reached Level 12 on Architex."

**Current state.** XP display at `/architex/src/components/interview/XPDisplay.tsx`. Score display at `/architex/src/components/interview/ScoreDisplay.tsx`. Social proof panel at `/architex/src/components/modules/lld/panels/SocialProof.tsx`.

**What is missing.** OG image generation for shareable cards (Next.js OG Image API is available in the stack).

**Ratings.** Learning Impact: 2/10. Engagement Impact: 8/10 (viral growth). Differentiation: 4/10. Implementation Effort: S.

**Priority: Should-have** (low effort, high growth impact).

---

## G. CONTENT & CURRICULUM

### G1. Learning Paths (Beginner to Expert)

**Current state: BUILT.** Structured 8-week paths at `/architex/src/lib/interview/learning-paths.ts`. Learning path view at `/architex/src/components/interview/LearningPathView.tsx`. LLD sidebar has learning path map at `/architex/src/components/modules/lld/sidebar/LearningPathMap.tsx`.

---

### G2. Prerequisites Graph

**Current state: BUILT.** Full DAG with Kahn's algorithm topological sort at `/architex/src/lib/lld/prerequisites.ts`. Tier-based grouping. Pattern graph visualization at `/architex/src/components/modules/lld/sidebar/PatternGraph.tsx`. The LLD patterns have explicit `PATTERN_PREREQUISITES` in the patterns file.

---

### G3. Cross-Module Connections

**Current state: BUILT.** This is a genuine differentiator. Concept-module map at `/architex/src/lib/cross-module/concept-module-map.ts` with 40+ concepts mapped across all modules. Bridge types and handlers at `/architex/src/lib/cross-module/bridge-types.ts`, `bridge-handlers.ts`, `bridge-rules.ts`, `bridge-registry.ts`. Knowledge graph integration at `/architex/src/lib/cross-module/knowledge-graph-integration.ts`. Interview simulator bridge at `/architex/src/lib/cross-module/interview-simulator-bridge.ts`. Cross-module store at `/architex/src/stores/cross-module-store.ts` with mastery radar chart data.

**Example.** "Bloom filter" links to Data Structures (interactive viz), Database (LSM-tree usage), and Distributed Systems (sync optimization). A user studying B-trees in the Data Structures module can one-click jump to the Database module's B-tree indexing context.

---

### G4. Real-World Case Studies

**What it is.** "How Netflix implements Circuit Breaker," "How Uber scales consistent hashing," "How Stripe handles payment idempotency." Each case study maps a real company's architecture to the concepts taught in Architex.

**Current state.** Challenge definitions reference companies (Google, Meta, Amazon, Stripe, Cloudflare, etc.). Pattern definitions have `youAlreadyUseThis` arrays linking to real-world implementations. The playbook gallery at `/architex/src/components/shared/playbook-gallery.tsx` and playbook library at `/architex/src/lib/patterns/playbook.ts` exist.

**What is missing.** Deep case studies with actual architecture diagrams from public engineering blogs, beyond the current surface-level company tags.

**Ratings.** Learning Impact: 8/10. Engagement Impact: 8/10. Differentiation: 7/10. Implementation Effort: L (content creation, not engineering).

**Priority: Should-have.**

---

### G5. Company-Specific Interview Prep

**Current state: PARTIALLY BUILT.** Company interview pages at `/architex/src/app/interviews/[company]/page.tsx`. Challenges are tagged with companies. `ALL_COMPANIES` array extracted from challenge data.

**What is missing.** Per-company study plans ("Google tends to ask about distributed systems and scaling, so focus on these 8 challenges in this order").

**Ratings.** Learning Impact: 7/10. Engagement Impact: 9/10. Differentiation: 6/10. Implementation Effort: M.

**Priority: Should-have.**

---

## H. DEVELOPER EXPERIENCE

### H1. Keyboard-First Interaction

**Current state: BUILT.** Extensive keyboard infrastructure. Keyboard shortcuts hook at `/architex/src/hooks/use-keyboard-shortcuts.ts`. Canvas keyboard operations at `/architex/src/components/modules/lld/hooks/useCanvasKeyboard.ts`. Keyboard node operations at `/architex/src/hooks/useKeyboardNodeOps.ts` with tests. Skip link for accessibility at `/architex/src/components/shared/SkipLink.tsx`. Focus trap at `/architex/src/hooks/useFocusTrap.ts`.

---

### H2. Command Palette

**Current state: BUILT.** Command palette at `/architex/src/components/shared/command-palette.tsx` using `cmdk` library. Recent commands tracking at `/architex/src/hooks/useRecentCommands.ts` and `/architex/src/components/shared/RecentCommands.tsx`. Command bus at `/architex/src/hooks/useCommandBus.ts`. Keyboard shortcuts dialog at `/architex/src/components/shared/keyboard-shortcuts-dialog.tsx`.

---

### H3. Export to Mermaid / PlantUML / Draw.io / Excalidraw / C4

**Current state: BUILT.** Comprehensive export system. Mermaid at `/architex/src/lib/export/to-mermaid.ts`. PlantUML at `/architex/src/lib/export/to-plantuml.ts`. Draw.io at `/architex/src/lib/export/to-drawio.ts`. Excalidraw at `/architex/src/lib/export/excalidraw-exporter.ts`. C4 at `/architex/src/lib/export/c4-exporter.ts`. Terraform at `/architex/src/lib/export/terraform-exporter.ts`. PNG at `/architex/src/lib/export/to-png.ts`. SVG at `/architex/src/lib/export/to-svg.ts`. PDF at `/architex/src/lib/export/to-pdf.ts`. JSON at `/architex/src/lib/export/to-json.ts`. URL at `/architex/src/lib/export/to-url.ts`. GIF recorder at `/architex/src/lib/export/gif-recorder.ts`. Export manager at `/architex/src/lib/export/export-manager.ts`. Video export for data structures at `/architex/src/components/modules/data-structures/VideoExport.tsx`.

**This is extraordinary breadth.** No competitor exports to this many formats.

---

### H4. Embed Diagrams in Blog/Docs

**Current state: BUILT.** Embed routes at `/architex/src/app/embed/lld/pattern/[id]/page.tsx`, `/architex/src/app/embed/lld/solid/[id]/page.tsx`, `/architex/src/app/embed/lld/problem/[id]/page.tsx`, `/architex/src/app/embed/algorithms/[slug]/page.tsx`. ISR with 24-hour revalidation. Lightweight renders without sidebar or activity bar.

---

### H5. API for Programmatic Access

**What it is.** A REST/GraphQL API that lets developers programmatically create diagrams, run simulations, and export results. Use case: CI/CD pipeline that generates architecture docs from code, or a chatbot that generates diagrams.

**Current state.** Not built. All logic is client-side. The pattern/challenge data is in TypeScript files, not a database. Neon PostgreSQL dependency suggests server-side plans.

**Ratings.** Learning Impact: 2/10. Engagement Impact: 3/10. Differentiation: 7/10. Implementation Effort: XL.

**Priority: Nice-to-have.**

---

### H6. VS Code Extension

**What it is.** View and edit Architex diagrams directly in VS Code. Read class definitions from open code files and generate UML diagrams.

**Current state.** Not built. The code-to-diagram parser exists client-side.

**Ratings.** Learning Impact: 3/10. Engagement Impact: 5/10. Differentiation: 8/10. Implementation Effort: XL.

**Priority: Nice-to-have.**

---

## I. FEATURES NOT IN THE ORIGINAL LIST (Discovered in Codebase)

These features exist in the codebase but were not listed in the brief. They represent significant value.

### I1. Billing & Monetization

**Current state: BUILT.** Four-tier plan system at `/architex/src/lib/billing/plans.ts` (Free, Student, Pro at $19/mo, Team at $49/mo). Usage tracking at `/architex/src/lib/billing/usage-tracker.ts`. Feature gates at `/architex/src/lib/billing/feature-gates.ts`. Student verification at `/architex/src/lib/billing/student-verification.ts`. Billing store at `/architex/src/stores/billing-store.ts`.

### I2. Accessibility Infrastructure

Screen reader view at `/architex/src/components/modules/lld/panels/ScreenReaderView.tsx`. Skip link. Colorblind toggle at `/architex/src/components/shared/ColorblindToggle.tsx`. Focus trap. Simulation announcer at `/architex/src/components/shared/SimulationAnnouncer.tsx`.

### I3. Offline / PWA Support

Offline page at `/architex/src/app/offline/page.tsx`. Install prompt at `/architex/src/components/shared/install-prompt.tsx`. IndexedDB persistence via Dexie. Web Workers for off-thread computation at `/architex/src/workers/`.

### I4. Version History & Time Travel

Snapshot store at `/architex/src/stores/snapshot-store.ts`. Versioning snapshots at `/architex/src/lib/versioning/snapshots.ts`. Version history panel at `/architex/src/components/shared/VersionHistoryPanel.tsx`. Time travel at `/architex/src/lib/simulation/time-travel.ts`. Undo/redo via Zundo.

### I5. Onboarding

Onboarding overlay at `/architex/src/components/shared/onboarding-overlay.tsx`. First encounter hook at `/architex/src/hooks/useFirstEncounter.ts`. Database tour at `/architex/src/components/modules/database/DatabaseTour.tsx`. Canvas empty state at `/architex/src/components/shared/CanvasEmptyState.tsx`. LLD empty states at `/architex/src/components/shared/lld-empty-states.tsx`. Idle hints at `/architex/src/components/modules/lld/canvas/IdleHint.tsx`.

### I6. Advanced Module Features

**Data Structures:** Break-it mode, Reverse mode, Debugging challenges, Prediction overlay, Manual trace, System role selector, P95 latency calculator, Sonification (hear the algorithm), Scenario challenges, Badges, Complexity quiz, Auto quiz, Interview path.

**Database:** ACID canvas, ARIES recovery canvas, B-Tree canvas, CAP theorem canvas, Connection pooling canvas, ER diagram canvas, Hash index canvas, Query plan simulation, Replication lag visualizer, Sharding simulator, Consistency level demo.

**Distributed:** Split-brain visualizer, Topology-aware failure modes.

**Networking:** ARP visualization, Protocol decision tree, Packet journey simulator, Connection pool visualization.

**Concurrency:** Thread pool saturation visualizer.

**Security:** DDoS simulation visualizer.

---

## COMPREHENSIVE FEATURE RATINGS TABLE

| Feature | Learning (1-10) | Engagement (1-10) | Differentiation (1-10) | Effort | Status |
|---|---|---|---|---|---|
| **A. LEARNING MODES** | | | | | |
| A1. Guided Lessons | 9 | 8 | 7 | L | Partial |
| A2. Progressive Canvas | 9 | 9 | 9 | M | Partial |
| A3. Reference Mode | 6 | 4 | 3 | S | Built |
| A4. Video/Animation | 6 | 7 | 6 | L | Not built |
| A5. Audio Tours | 5 | 5 | 4 | M | Not built |
| **B. SIMULATION** | | | | | |
| B1. State Machine Sim | 8 | 7 | 7 | M | Built |
| B2. Sequence Playback | 9 | 8 | 9 | -- | Built |
| B3. What-If Analysis | 9 | 8 | 10 | M | Built (need UI) |
| B4. Data Flow Particles | 7 | 9 | 9 | M | Partial |
| B5. Latency Simulator | 8 | 7 | 7 | -- | Built |
| B6. Load Testing Viz | 8 | 8 | 9 | M | Partial |
| B7. Chaos Engineering | 9 | 9 | 10 | -- | Built |
| **C. PRACTICE** | | | | | |
| C1. Timed Interview | 8 | 8 | 6 | -- | Built |
| C2. Build Challenges | 9 | 8 | 8 | -- | Built |
| C3. Auto-Graded Diagrams | 9 | 7 | 9 | -- | Built |
| C4. Code Challenges | 9 | 7 | 8 | L | Partial |
| C5. Scenario Decisions | 10 | 9 | 10 | M | Partial |
| C6. Pattern from Code | 8 | 6 | 6 | -- | Built |
| C7. Mock Interview | 10 | 9 | 9 | XL | Partial |
| **D. RETENTION** | | | | | |
| D1. FSRS Spaced Rep | 9 | 7 | 7 | -- | Built |
| D2. Flashcards | 7 | 6 | 5 | -- | Built |
| D3. Daily Challenges | 7 | 8 | 6 | -- | Built |
| D4. Streak System | 5 | 8 | 4 | -- | Built |
| D5. Micro-Review | 9 | 8 | 7 | S | Partial |
| D6. Forgetting Curves | 5 | 7 | 8 | M | Not built |
| **E. AI** | | | | | |
| E1. Socratic Tutor | 9 | 8 | 9 | -- | Built |
| E2. AI Diagram Review | 8 | 7 | 8 | -- | Built |
| E3. NL to Diagram | 7 | 8 | 7 | -- | Built |
| E4. Code to Diagram | 8 | 6 | 8 | -- | Built |
| E5. Personalized Path | 8 | 7 | 7 | L | Partial |
| E6. Weakness Detection | 9 | 7 | 8 | M | Not built |
| **F. SOCIAL** | | | | | |
| F1. Leaderboards | 5 | 8 | 4 | M | Built (mock) |
| F2. Achievements | 5 | 8 | 5 | -- | Built |
| F3. Study Groups | 7 | 8 | 8 | XL | Partial (store only) |
| F4. Shared Diagrams | 4 | 7 | 5 | M | Partial |
| F5. Interview Buddy | 9 | 8 | 7 | XL | Not built |
| F6. Progress Sharing | 2 | 8 | 4 | S | Partial |
| **G. CONTENT** | | | | | |
| G1. Learning Paths | 8 | 7 | 6 | -- | Built |
| G2. Prerequisites Graph | 7 | 5 | 7 | -- | Built |
| G3. Cross-Module Links | 8 | 6 | 9 | -- | Built |
| G4. Case Studies | 8 | 8 | 7 | L | Partial |
| G5. Company-Specific Prep | 7 | 9 | 6 | M | Partial |
| **H. DEVELOPER EX** | | | | | |
| H1. Keyboard-First | 6 | 7 | 5 | -- | Built |
| H2. Command Palette | 5 | 7 | 5 | -- | Built |
| H3. Multi-Format Export | 4 | 5 | 9 | -- | Built |
| H4. Embeddable Diagrams | 4 | 5 | 7 | -- | Built |
| H5. Public API | 2 | 3 | 7 | XL | Not built |
| H6. VS Code Extension | 3 | 5 | 8 | XL | Not built |

---

## IMPLEMENTATION ROADMAP

### Phase 1: "The Wow Factor" (4-6 weeks) -- Close the experience gap

These are the features where the backend logic is built but the user-facing experience is incomplete.

1. **Data Flow Particles on Canvas Edges** (B4) -- The simulation engine, edge tracker, and particle path cache exist. Rendering animated particles on React Flow edges transforms the system design module from a static diagram tool into a living system. Effort: M. Impact: Transforms first impression.

2. **Progressive Canvas Build** (A2) -- Add `buildSequence` arrays to the 8 reference architectures. The motion library is already in the stack. Users watching an architecture assemble step-by-step will share it. Effort: M. Impact: Content marketing gold.

3. **Scenario Decision Mode** (C5) -- Wire the what-if engine + cost model + challenge system together. The user modifies a diagram under constraints and gets scored. This is the killer feature for interview prep. Effort: M. Impact: Unique to Architex.

4. **Micro-Review Dashboard** (D5) -- Aggregate FSRS due cards across modules into a 2-minute daily session. The data layer is ready. Effort: S. Impact: Dramatically improves retention.

5. **What-If Visual Comparison** (B3) -- Render side-by-side canvases for original vs. modified architectures. Architecture diff engine already exists. Effort: M. Impact: Makes what-if analysis tangible.

### Phase 2: "Intelligence Layer" (6-8 weeks) -- AI-powered personalization

6. **Weakness Detection & Targeted Practice** (E6) -- Aggregate FSRS lapses, quiz scores, challenge performance into a weakness score per concept. Generate targeted practice sessions. Effort: M.

7. **Load Testing Ramp** (B6) -- Traffic slider UI on the system design canvas. Watch nodes go from green to yellow to red as RPS increases. The simulation engine supports this already. Effort: M.

8. **Dynamic Learning Paths** (E5) -- Feed user performance data into path generation instead of static JSON. Effort: L.

9. **Progress Sharing OG Cards** (F6) -- OG image generation for social sharing. Low effort, high viral growth potential. Effort: S.

### Phase 3: "Content Depth" (8-12 weeks) -- Content that sells

10. **Deep Case Studies** (G4) -- Write 10 flagship case studies: Netflix Circuit Breaker, Uber Consistent Hashing, Stripe Idempotency, Discord Message Storage, Slack's Real-Time Architecture, Instagram Feed Ranking, Airbnb Search, DoorDash Dispatch, Robinhood Trading, GitHub Actions. Effort: L.

11. **Company-Specific Study Plans** (G5) -- Per-company learning sequences based on reported interview patterns. Effort: M.

12. **Full Mock Interview** (C7) -- Multi-phase AI-driven interview simulation with follow-up questions and detailed scorecard. Effort: XL.

### Phase 4: "Platform Effects" (12+ weeks) -- Network effects and ecosystem

13. **Real Leaderboards** (F1) -- Server-side persistence via Neon PostgreSQL. Effort: M.

14. **Study Groups** (F3) -- WebSocket/WebRTC real-time collaboration. Effort: XL.

15. **Guided Lesson Engine** (A1) -- Unified lesson format across all 13 modules. Effort: L.

16. **Code Implementation Challenges** (C4) -- Embedded code editor with grading against expected pattern. Effort: L.

---

## THE SINGLE MOST IMPORTANT INSIGHT

Architex's competitive moat is not any single feature -- it is the **simulation layer**. No competitor has a chaos engine with 30+ failure modes, a what-if engine with comparative analysis, a narrative engine that explains failures in natural language, pressure counters that model real queuing theory, and a cost model that prices architectures. This simulation infrastructure is the platform's defensible advantage.

The highest-leverage work is making this simulation layer *visible and tangible*. Right now, much of it exists as pure computation that returns numbers. Particles flowing through edges, nodes pulsing red under load, cascading failures visually propagating across the diagram -- these visual expressions of the simulation are what will make Architex impossible to copy from a screenshot. Every competitor can copy a static diagram tool. No competitor can trivially replicate a living, breathing system simulation with accurate queuing theory underneath.

**If you do one thing: ship data flow particles on edges.** It transforms Architex from "a nice diagram tool" to "a system that feels alive."

---

## KEY FILES REFERENCED

- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/what-if-engine.ts` -- What-if scenario engine
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/chaos-engine.ts` -- 30+ chaos events
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/narrative-engine.ts` -- Human-readable failure explanations
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/particle-path-cache.ts` -- Particle flow infrastructure
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/edge-flow-tracker.ts` -- Edge flow data
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/pressure-counters.ts` -- 35 pressure counter types
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/srs.ts` -- FSRS spaced repetition
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/achievements.ts` -- Gamification system
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/interview/learning-paths.ts` -- Structured learning paths
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/socratic-tutor.ts` -- 4-phase Socratic engine
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/design-reviewer.ts` -- AI design review
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/ai/architecture-generator.ts` -- NL to diagram
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/patterns.ts` -- 36 design patterns
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/lld/bidirectional-sync.ts` -- Code-diagram sync
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/cross-module/concept-module-map.ts` -- 40+ concept cross-refs
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/cross-module-store.ts` -- Cross-module mastery tracking
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/billing/plans.ts` -- Four-tier pricing
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/export/export-manager.ts` -- 12+ export formats
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/collaboration-store.ts` -- Real-time collab store
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/simulation/cost-model.ts` -- Architecture cost modeling