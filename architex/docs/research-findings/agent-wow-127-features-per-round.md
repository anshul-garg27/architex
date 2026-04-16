Now I have a comprehensive understanding of the existing Architex codebase. Here is the complete feature catalog.

---

# ARCHITEX COMPLETE FEATURE CATALOG: 150+ FEATURES ACROSS 15 INTERVIEW ROUNDS

---

## EXISTING FOUNDATION (What You Already Have)

Before the new features, here is what already exists in the codebase and should be leveraged, not rebuilt:

- **System Design Simulator**: 30+ node types, React Flow canvas, drag-and-drop, live traffic simulation, chaos engine (30+ events across 10 categories), queuing model, SLA calculator, what-if engine, narrative engine, cost engine (AWS 2025 pricing), pressure counters, topology signatures, cascade engine, capacity planner
- **Algorithm Visualizer**: 26+ algorithms across sorting, graph, tree, DP, string, geometry, backtracking, greedy, probabilistic, with playback controller
- **LLD Module**: 33 problems, UML class diagrams, state machines, sequence diagrams, code-to-diagram bidirectional sync, grading engine, codegen (TypeScript, Python, Java), pattern enrichment, SOLID demos
- **Concurrency Module**: Producer-consumer, dining philosophers, event loop, goroutines, readers-writers, sleeping barber, deadlock demo, race conditions, mutex comparison
- **Interview Engine**: 20+ challenges, SRS (spaced repetition), daily challenges, learning paths, difficulty scaling, achievements, leaderboard, scoring rubric (10 dimensions)
- **Innovation Features**: Design battles, time attack mode, war stories (12 incidents), skill tree, design review, protocol deep-dive, explanation mode, difficulty adaptation, weekly challenges
- **Security**: OAuth 2.0 PKCE, JWT lifecycle + attacks, Diffie-Hellman, AES, HTTPS flow, cert chains, password hashing, CSRF, SSRF, CORS, web attacks, CSP
- **Database**: Normalization, ER diagrams, B-tree viz, hash index viz, LSM viz, MVCC viz, ARIES viz, join viz, query plan, transaction sim, schema converter
- **Networking**: TCP state machine, TLS 1.3, DNS, HTTP/1-2-3 comparison, WebSocket, CORS simulator, CDN flow, ARP, DHCP, serialization comparison, API comparison
- **OS**: CPU scheduling (6 algos + MLFQ), page replacement, deadlock, memory allocation, thrashing, priority inversion, context switch, system calls, race condition, banker's algorithm, buffer overflow, copy-on-write fork
- **Export**: JSON, PlantUML, Terraform, URL, PNG, SVG, PDF, draw.io, Mermaid, C4, Excalidraw, GIF recorder

---

## ROUND 1: DSA / CODING ROUND (10 features)

### 1.1 -- AlgoFilm

**One-liner**: Watch your sorting algorithm run as a cinematic bar-chart animation with sound design, where each comparison plays a pitch proportional to the value.

**The WOW moment**: You click "play" on merge sort and the bars dance apart, glow when compared, smoothly glide into position, and you HEAR the sort -- low bars rumble, high bars chime. When it finishes, the bars cascade in a rainbow sweep. Bubble sort sounds like anxious chattering. Merge sort sounds like a symphony resolving. You screenshot the side-by-side of quicksort vs. heapsort race with audio waveforms underneath.

**Why unique**: VisuAlgo and Algorithm Visualizer do static step-through. Nobody has cinematic-quality animation with audio sonification. The audio dimension adds a sensory channel that research shows improves retention by 20-30% (dual-coding theory, Paivio 1971). You already have 26+ sorting algorithms -- this is a rendering layer on top.

**Effort**: M (animation rendering on existing `playback-controller.ts`, Web Audio API for sonification)

---

### 1.2 -- Complexity Lens

**One-liner**: A live overlay that shows the Big-O complexity of your code AS YOU TYPE, with a growing curve visualization that updates keystroke-by-keystroke.

**The WOW moment**: You write a nested for-loop and the curve in the sidebar instantly jumps from O(n) to O(n^2). You add a hash map lookup and it drops back. The curve literally breathes with your code. You screenshot the moment your O(n^3) brute force collapses to O(n log n) after adding a sort.

**Why unique**: LeetCode shows complexity after submission. This shows it LIVE during typing. No platform does real-time static analysis with visual complexity curves in the editor itself.

**Effort**: L (AST parsing for loop detection, heuristic complexity inference, real-time curve rendering)

---

### 1.3 -- DP Table Builder

**One-liner**: For any DP problem, you see the memoization table fill cell-by-cell with colored arrows showing which previous cells contributed to the current answer.

**The WOW moment**: You're solving Longest Common Subsequence. The table is a grid. Each cell fills with a color gradient showing its value. Arrows trace back from the final answer through the optimal path, glowing like a circuit board. You click any cell and see the exact subproblem it represents in plain English: "LCS of 'ABC' and 'AC' = 2." You screenshot the finished table with the backtrack path illuminated.

**Why unique**: You already have `dp/lcs.ts`, `dp/edit-distance.ts`, `dp/knapsack.ts` etc. with step types defined. This is a visualization layer that makes the TABLE the hero, not the code. NeetCode shows tables statically. This animates the fill order and lets you click any cell to understand the subproblem.

**Effort**: M (grid renderer on existing DP step generators, backtrack path highlighting)

---

### 1.4 -- Recursion Tree Cinema

**One-liner**: Watch the recursive call tree expand in real-time for fibonacci, mergesort, or any recursive function -- see which calls are redundant (glowing red), which are cached (glowing green), and watch memoization PRUNE the tree live.

**The WOW moment**: Fibonacci(10) without memoization: the tree explodes into 177 nodes, with redundant subtrees highlighted in angry red. Toggle memoization ON: branches get pruned with a satisfying snip animation, the tree collapses to 19 nodes, and the redundant ones fade with a ghostly trail. The before/after split-screen makes you FEEL why DP matters.

**Why unique**: You already have `tree/tree-layout.ts` for layout algorithms. Nobody visualizes the PRUNING -- the dramatic before/after of memoization on a live call tree. This is the "aha moment" that makes DP click.

**Effort**: M (recursive call tree generator, tree diff animation, memoization toggle)

---

### 1.5 -- Code Anatomy Xray

**One-liner**: Hover over any line in a DSA solution and see it highlighted on the visualization -- the exact array element, tree node, or graph edge that line is operating on.

**The WOW moment**: You hover over `if arr[mid] > target` in binary search and the visualization highlights the exact mid element with a spotlight, shows the search range with brackets, and the target value floats beside it. Every line of code has a direct visual counterpart. You screenshot the perfect correspondence between code line 7 and the highlighted tree node.

**Why unique**: Existing algorithm visualizers separate code and visualization. This LINKS them bidirectionally. Click a node in the viz, jump to the code line. Hover a code line, highlight the data. The algorithm `CodePanel.tsx` component already exists -- this extends it.

**Effort**: M (bidirectional mapping between code lines and visualization state)

---

### 1.6 -- Race Mode

**One-liner**: Two algorithms race head-to-head on the same dataset, side by side, with a live operations counter showing which one finishes first and by how much.

**The WOW moment**: Quicksort vs. Merge Sort on 200 random elements. Two visualizations run simultaneously. You see quicksort occasionally hitting bad partitions (the bars stutter) while merge sort plods steadily. The operations counter ticks up in real-time. Quicksort finishes 15% faster. Then you click "sorted input" and watch quicksort degrade to O(n^2) while merge sort stays stable. The screenshot shows the dramatic divergence on adversarial input.

**Why unique**: Some sites let you compare algorithms. Nobody races them live with the SAME data and adversarial input controls. The drama of watching one algorithm choke on pathological input is unforgettable.

**Effort**: S (dual playback on existing algorithm engines, shared dataset, operations counter)

---

### 1.7 -- Pattern Recognizer

**One-liner**: Given a new problem, the system identifies which algorithmic PATTERN it belongs to (sliding window, two pointers, monotonic stack, etc.) and shows you the template before you code.

**The WOW moment**: You see the problem "Find the longest substring without repeating characters." The pattern recognizer highlights: "This is a SLIDING WINDOW problem" with a link to the sliding window template. It shows 5 other problems that use the same pattern. You toggle the template overlay and see the skeleton code for sliding window, with the parts you need to fill in highlighted.

**Why unique**: You already have `patterns/sliding-window.ts`, `patterns/two-pointers.ts`, `patterns/monotonic-stack.ts`, `patterns/intervals.ts`. Nobody connects problem classification to pattern templates as a learning path. LeetCode tags are passive. This is active pattern recognition training.

**Effort**: M (pattern classifier from problem description keywords, template overlay system)

---

### 1.8 -- Adversarial Input Generator

**One-liner**: For any algorithm, generate the WORST-CASE input that maximizes operations, the BEST-CASE that minimizes them, and random cases -- then visualize all three.

**The WOW moment**: You select "QuickSort with Lomuto partition." The generator creates: (1) already-sorted array (worst case, O(n^2)), (2) median-split array (best case, O(n log n)), (3) random. Three visualizations run, and you see the dramatic difference. The operations counter shows 10,000 vs. 200 vs. 650. You understand WHY quicksort needs randomization.

**Why unique**: No platform generates adversarial inputs for educational purposes. Students always test on random data and think "quicksort is always fast." This shatters that misconception.

**Effort**: S (worst-case generators for each sorting/searching algorithm, which are deterministic and well-known)

---

### 1.9 -- Memory Layout Viewer

**One-liner**: See exactly how your data structure lives in memory -- array contiguity, linked list pointer chasing, hash table collision chains, tree node allocation.

**The WOW moment**: You insert 10 elements into a hash map. The viewer shows the actual array buckets, each element's hash, the collision chains as linked lists hanging off buckets, and the load factor bar approaching the resize threshold. You add one more element and BOOM -- the table doubles in size, all elements rehash, and you watch them redistribute. You screenshot the resize animation.

**Why unique**: Nobody shows MEMORY LAYOUT for data structures. Everyone teaches the logical structure. This teaches the physical reality that actually matters for performance (cache lines, pointer chasing, locality).

**Effort**: M (simulated memory model for each data structure, resize animation)

---

### 1.10 -- Interview Simulator: DSA Edition

**One-liner**: A timed coding environment where an AI interviewer gives you a problem, asks follow-up questions based on your approach, and scores your solution on correctness, complexity analysis, and communication.

**The WOW moment**: You're solving a graph problem. You write BFS. The AI says: "What if the graph has 10 million nodes? Does your approach still work?" You realize you need to optimize. You refactor. The AI then asks: "What's the time complexity of your solution?" and scores your verbal explanation. At the end, you get a rubric score across 5 dimensions with specific feedback.

**Why unique**: LeetCode is "solve and submit." No platform simulates the INTERACTIVE nature of a real coding interview where the interviewer pushes back, asks for optimization, and evaluates your COMMUNICATION.

**Effort**: L (AI integration for follow-up generation, rubric scoring, communication analysis)

---

## ROUND 2: SYSTEM DESIGN / HLD ROUND (10 features)

### 2.1 -- Live Architecture Stress Test

**One-liner**: Press "simulate" and watch real traffic flow through your architecture, see bottlenecks form in real-time with queue depths, latency spikes, and cascading failures.

**The WOW moment**: Your architecture has a single database behind three API servers. Traffic starts at 100 RPS and ramps to 10,000. You watch the database queue depth spike, latency climb from 5ms to 2,000ms, error rate hit 40%, and then the cascade: API servers start timing out, load balancer health checks fail, the entire system goes red. Then you add a cache -- re-run -- and watch the database stay calm while the cache handles 90% of reads.

**Why unique**: This ALREADY EXISTS as your core simulation engine (`traffic-simulator.ts`, `cascade-engine.ts`, `queuing-model.ts`, `pressure-counters.ts`). The feature to amplify is making the metrics MORE dramatic and the narrative MORE clear via `narrative-engine.ts`.

**Effort**: S (already built -- enhancement to existing simulation viz)

---

### 2.2 -- Cost Ticker

**One-liner**: A running dollar counter that shows your architecture's estimated monthly AWS bill updating live as you add or remove components.

**The WOW moment**: You drag a managed Kafka cluster onto the canvas. The cost ticker jumps from $450/mo to $1,200/mo. You see the breakdown: "MSK: $750/mo (3 brokers x m5.large)." You swap it for SQS -- cost drops to $520/mo. The interviewer persona says: "Good thinking, but what do you lose with SQS vs. Kafka?" You screenshot the cost comparison side-by-side.

**Why unique**: This ALREADY EXISTS as `cost-engine.ts` with AWS 2025 pricing. The enhancement is making it more prominent, adding comparison mode (before/after), and integrating with the interview scoring rubric.

**Effort**: S (UI enhancement on existing cost engine)

---

### 2.3 -- What-If Scenario Lab

**One-liner**: Clone your architecture, apply a hypothetical change (remove the cache, double traffic, kill a database replica), and instantly see the impact in a side-by-side diff with delta metrics.

**The WOW moment**: You click "What if I remove the CDN?" The screen splits: left shows your current architecture with CDN, right shows without. Origin server latency jumps from 50ms to 800ms for static assets. Bandwidth cost triples. A narrative explains: "Without CDN, every static asset request hits origin. P99 latency degrades 16x."

**Why unique**: This ALREADY EXISTS as `what-if-engine.ts`. The enhancement is the side-by-side visual diff (you have `architecture-diff.ts`) and making the narrative output from `narrative-engine.ts` more prominent.

**Effort**: S (UI for side-by-side comparison on existing engines)

---

### 2.4 -- Incident War Room

**One-liner**: Drop into a live production incident scenario based on real war stories -- diagnose the root cause from metrics, logs, and architecture, then implement the fix on the canvas.

**The WOW moment**: "ALERT: p99 latency spiked to 5s at 2:30 AM. Error rate 30%. Revenue loss $50K/hour." You see the architecture, the timeline, the metrics dashboard. You investigate: click on the database -- connection pool exhausted. Click on the cache -- TTL misconfigured, thundering herd. You drag a circuit breaker onto the canvas, configure a cache warming strategy, and re-run the simulation. Incident resolved. Time: 8 minutes. Average for senior engineers: 12 minutes.

**Why unique**: This ALREADY EXISTS as `war-stories.ts` (12 incidents with timelines, architecture, root cause). The enhancement is making it INTERACTIVE -- instead of reading the story, you PLAY it. You diagnose and fix in real-time.

**Effort**: M (interactive mode on existing war stories data, connecting to canvas for fix implementation)

---

### 2.5 -- Architecture Evolution Timeline

**One-liner**: Design a system at 100 users, then 10K, then 1M, then 100M -- and watch your architecture EVOLVE across stages, with the system showing what breaks at each scale and what you need to add.

**The WOW moment**: Stage 1 (100 users): single server + SQLite. Stage 2 (10K): you need a real database, the system suggests PostgreSQL. Stage 3 (1M): database is bottleneck, system suggests read replicas + cache. Stage 4 (100M): you need sharding, CDN, message queues. At each stage, the simulation runs and shows WHERE the bottleneck is, and a "hint" suggests what to add. You screenshot the 4-stage evolution side by side.

**Why unique**: You have `EvolutionTimeline.tsx` as a component and `time-travel.ts` for state snapshots. Nobody structures system design practice as PROGRESSIVE SCALING with the system telling you what breaks. This mirrors how real interviews work: "Start simple, then scale."

**Effort**: M (progressive challenge framework with bottleneck detection at scale thresholds)

---

### 2.6 -- Napkin Math Pad

**One-liner**: An integrated estimation calculator where you do back-of-the-envelope math with auto-populated latency numbers, and the system checks your estimates against known benchmarks.

**The WOW moment**: The challenge says "Design Twitter." You open the math pad. "DAU: 300M. Tweets/day: 500M. Reads/writes ratio: 100:1." The pad auto-populates read QPS = 500M * 100 / 86400 = ~580K. Write QPS = ~5.8K. Storage per tweet: 140 chars = ~280 bytes + metadata ~1KB. Daily storage: 500M * 1KB = 500GB/day. The pad highlights your estimate in GREEN if within 2x of the known benchmark, YELLOW if within 10x, RED if off by more. You screenshot the clean estimation with color-coded accuracy.

**Why unique**: You ALREADY have `latency-numbers.ts`, `throughput-numbers.ts`, `system-numbers.ts`, and `EstimationPad.tsx`. The enhancement is benchmark checking -- comparing student estimates against known good values and showing accuracy.

**Effort**: S (benchmark database + accuracy checking on existing estimation pad)

---

### 2.7 -- Component Playbook

**One-liner**: A searchable encyclopedia of infrastructure components (Kafka vs. RabbitMQ vs. SQS, PostgreSQL vs. DynamoDB vs. Cassandra) with decision matrices showing when to use each.

**The WOW moment**: You're choosing between Redis and Memcached for your cache. You open the playbook. Side-by-side comparison: data structures (Redis: sorted sets, lists, hashes | Memcached: strings only), persistence (Redis: AOF/RDB | Memcached: none), clustering (Redis: cluster mode | Memcached: client-side sharding). A decision tree: "Need persistence? Redis. Need simple key-value at maximum throughput? Memcached." You drag the winner onto your canvas.

**Why unique**: You ALREADY have `playbook.ts` with pattern data. The enhancement is deep component comparisons with decision matrices. No platform integrates encyclopedia-level component knowledge directly into the design canvas.

**Effort**: M (component comparison database, decision tree UI, integration with canvas palette)

---

### 2.8 -- AI Design Interviewer

**One-liner**: An AI persona that conducts a full 45-minute system design interview, asking clarifying questions, pushing back on decisions, and scoring your design against the 10-dimension rubric.

**The WOW moment**: AI: "Design a URL shortener." You start designing. AI: "You haven't discussed non-functional requirements. What's your target latency?" You answer. AI: "Good. What's the read/write ratio?" You answer. AI pushes: "You said Redis for the cache, but you have 10 billion URLs. How much memory does that require?" You calculate. AI: "Your estimate is off by 5x. Here's why..." At the end: detailed rubric with scores across functional requirements, API design, data model, scalability, cost estimation, etc.

**Why unique**: You ALREADY have the 10-dimension scoring rubric in `scoring.ts`. The enhancement is AI-driven interview flow that uses the rubric dynamically. No platform simulates the CONVERSATIONAL nature of system design interviews.

**Effort**: XL (AI integration, conversational state machine, rubric-driven feedback generation)

---

### 2.9 -- Terraform Export + Cost Diff

**One-liner**: Export your architecture as real Terraform code, and see the actual AWS bill estimate from Terraform's cost estimation tools.

**The WOW moment**: You designed a microservices architecture. Click "Export to Terraform." Real `.tf` files are generated with VPC, ECS tasks, RDS instances, ElastiCache clusters, ALB. The cost estimate shows $4,200/month. You see which component is most expensive and can optimize directly.

**Why unique**: You ALREADY have `to-terraform.ts` and `terraform-exporter.ts`. The enhancement is linking cost estimation to the Terraform output. No design tool exports directly to infrastructure-as-code with cost estimates.

**Effort**: S (already built -- enhancement is cost annotation on export)

---

### 2.10 -- Architecture Gallery

**One-liner**: A curated gallery of reference architectures (Netflix, Uber, WhatsApp, Instagram) that you can load, study, simulate, and modify.

**The WOW moment**: You load "Netflix Architecture." A fully wired canvas appears: CDN, API Gateway, microservices (recommendation, search, playback), Cassandra clusters, Kafka pipelines, S3 storage. You click "simulate" and watch traffic flow. You click "What-if: remove CDN" and see latency spike 20x. You screenshot the reference architecture to study later.

**Why unique**: You ALREADY have `architecture-gallery.ts` and `templates/`. The enhancement is making these SIMULATABLE, not just static diagrams. No platform lets you load a real company's architecture and stress-test it.

**Effort**: M (template expansion with simulation-ready wiring)

---

## ROUND 3: LOW LEVEL DESIGN / MACHINE CODING ROUND (10 features)

### 3.1 -- Live Code-to-Diagram Sync

**One-liner**: Write TypeScript/Java/Python class code in the editor, and watch the UML class diagram update in real-time beside it -- add a method, the diagram adds a row; add inheritance, an arrow appears.

**The WOW moment**: You type `class Vehicle { start(): void {} }`. A UML box appears on the canvas with "Vehicle" and "+start(): void". You type `class Car extends Vehicle {}`. An inheritance arrow draws itself from Car to Vehicle. You add a `private engine: Engine` field -- a composition arrow snakes to a new Engine box that auto-creates. The diagram is ALIVE with your code.

**Why unique**: This ALREADY EXISTS as `code-to-diagram.ts` and `bidirectional-sync.ts`. The enhancement is making the sync feel INSTANT and the animation feel organic. PaperDraw has class diagrams but not bidirectional sync from real code.

**Effort**: S (polish on existing bidirectional sync)

---

### 3.2 -- Pattern Animation Theater

**One-liner**: Select any design pattern (Observer, Strategy, Factory, etc.) and watch an animated sequence diagram showing objects being created, methods being called, and messages being passed.

**The WOW moment**: You select "Observer Pattern." An animated sequence diagram plays: Subject creates, Observer1 subscribes (arrow flies to Subject), Observer2 subscribes, Subject publishes a state change, dotted arrows fire to BOTH observers simultaneously, both observers update. The animation loops. You can pause, step through, and see the code for each step highlighted in the sidebar.

**Why unique**: You ALREADY have `sequence-diagram.ts`, `solid-demos.ts`, and `oop-demos.ts`. The enhancement is ANIMATING the sequence diagrams rather than showing them statically. Nobody animates design pattern interactions as sequence diagrams with code correlation.

**Effort**: M (sequence diagram animation engine on existing data)

---

### 3.3 -- Machine Code Arena

**One-liner**: A timed machine coding environment (60-90 minutes) with a problem statement, auto-grading on OOP principles, design patterns used, SOLID violations, and test coverage.

**The WOW moment**: Problem: "Design a parking lot system in 60 minutes." Timer starts. You code in the editor. The grading sidebar updates LIVE: "Classes: 4/6 expected. Patterns detected: Strategy (yes), Factory (no). SOLID violations: LSP violation in VehicleType enum." At 60 minutes, you get a full report card with scores across 8 dimensions.

**Why unique**: You ALREADY have 33 LLD problems in `problems.ts` with starter classes and grading in `grading-engine.ts`. The enhancement is the LIVE grading dashboard that updates as you code. No platform does real-time SOLID analysis during coding.

**Effort**: M (live AST analysis for pattern detection, SOLID violation detection, integration with timer)

---

### 3.4 -- State Machine Playground

**One-liner**: Design state machines visually (drag states, draw transitions), then SIMULATE them by sending events and watching the current state highlight and transition.

**The WOW moment**: You've built an Order state machine: New -> Confirmed -> Shipped -> Delivered, with Cancel branching off. You click "Send Event: confirm." The state transitions from New to Confirmed with a glowing animation. You click "Send Event: cancel." It transitions to Cancelled. You try "Send Event: ship" from Cancelled -- the machine REJECTS it with a red flash: "No transition 'ship' from state 'Cancelled'."

**Why unique**: You ALREADY have `state-machine.ts` with 10+ example state machines (Order Lifecycle, etc.) complete with entry/exit actions and guards. The enhancement is making them INTERACTIVE -- send events, watch transitions, see action execution. Nobody lets you PLAY a state machine live.

**Effort**: S (event dispatch UI on existing state machine data)

---

### 3.5 -- SOLID Violation Detector

**One-liner**: Paste any OOP code and get a detailed analysis of which SOLID principles it violates, with specific line numbers, explanations, and refactoring suggestions.

**The WOW moment**: You paste a class that handles both file reading and data processing. The detector highlights: "SRP Violation (lines 5-45): Class FileProcessor handles both I/O and business logic. Extract DataProcessor class." It shows a side-by-side diff of the original vs. refactored code. You also see: "DIP Violation (line 12): Directly instantiating CsvParser. Use dependency injection."

**Why unique**: You ALREADY have `solid-demos.ts` with good/bad examples. The enhancement is automated detection on arbitrary code. Linters check syntax; nobody checks SOLID principles with design-level explanations.

**Effort**: L (AST analysis for SRP, OCP, LSP, ISP, DIP heuristics -- requires pattern matching on class dependencies and method responsibilities)

---

### 3.6 -- Refactoring Gym

**One-liner**: Given code with known design smells (God Class, Feature Envy, Shotgun Surgery), apply the correct refactoring and watch the UML diagram improve in real-time.

**The WOW moment**: You see a God Class with 15 methods and 8 fields. The UML diagram shows it as an oversized box connected to everything. You extract a class, move 5 methods into it. The diagram splits the box into two smaller, cleaner boxes. A "Design Health Score" in the corner climbs from 35/100 to 72/100. The coupling metrics chart shows coupling decrease.

**Why unique**: Nobody gamifies refactoring with live diagram feedback. Refactoring is taught abstractly ("extract class"). This makes you SEE the structural improvement in real-time.

**Effort**: M (design metrics calculator, UML diff animation, health score formula)

---

### 3.7 -- Pattern Decision Tree

**One-liner**: An interactive flowchart that asks you questions about your design problem and recommends the right design pattern, with animated examples.

**The WOW moment**: "Does your object need to change behavior at runtime?" -> Yes. "Does it need to switch between a family of algorithms?" -> Yes. "Use the STRATEGY pattern." The flowchart highlights the path, and clicking the recommendation opens the animated Pattern Theater (feature 3.2) for Strategy.

**Why unique**: You ALREADY have `pattern-enrichment.ts` and `patterns.ts` with pattern data. The enhancement is a decision tree that guides students to the RIGHT pattern for their problem. No platform does interactive pattern selection.

**Effort**: S (decision tree data structure, flowchart UI)

---

### 3.8 -- Class Diagram Diff

**One-liner**: Submit your LLD solution and see it diff'd against the reference solution -- missing classes in red, extra classes in yellow, correct matches in green.

**The WOW moment**: You designed a parking lot. Your solution has 5 classes. The reference has 7. The diff shows: 3 classes match (green), 2 of yours are close but missing methods (yellow), and 2 reference classes you completely missed (red with explanations). "Missing: ParkingSpotFactory -- you're using direct construction, consider the Factory pattern for spot creation."

**Why unique**: You ALREADY have `problem-solutions.ts` with reference solutions. The enhancement is structural diffing of class diagrams. Nobody compares your OOP design against a reference at the structural level.

**Effort**: M (class diagram similarity algorithm, diff visualization)

---

### 3.9 -- Sequence Diagram Recorder

**One-liner**: Step through your code execution and automatically GENERATE the sequence diagram showing which objects call which methods in what order.

**The WOW moment**: You run the parking lot "enter vehicle" flow. The recorder traces: Client -> ParkingLot.assignSpot() -> SpotAllocator.findAvailable() -> ParkingSpot.occupy() -> TicketGenerator.create() -> Client receives Ticket. A sequence diagram draws itself, step by step, as each method executes.

**Why unique**: You ALREADY have `sequence-diagram.ts`. The enhancement is auto-generation from code execution traces rather than manual creation. This is how senior engineers actually understand codebases -- by tracing execution flow.

**Effort**: L (code execution tracing, method call graph extraction, sequence diagram generation)

---

### 3.10 -- Concurrency Challenge Mode

**One-liner**: LLD problems with concurrency constraints -- design a thread-safe parking lot, a concurrent booking system -- where the grading tests for race conditions by running 1000 parallel simulations.

**The WOW moment**: You design a thread-safe booking system. The grader runs 1000 concurrent booking attempts. Result: "Double booking detected in 3/1000 runs. Race condition in BookingService.reserve() -- read-then-write without lock." It shows the exact interleaving that caused the double-book, with a timeline showing Thread A and Thread B's operations interleaved.

**Why unique**: You ALREADY have concurrency primitives (`mutex-comparison.ts`, `race-condition.ts`, `deadlock-demo.ts`). No platform tests LLD solutions for thread safety with simulated concurrent execution.

**Effort**: L (concurrent simulation harness, race condition detection, interleaving visualization)

---

## ROUND 4: PEER PROGRAMMING ROUND (10 features)

### 4.1 -- AI Pair Partner

**One-liner**: An AI that writes code WITH you in real-time, alternating between driver and navigator roles, asking questions, suggesting approaches, and catching your mistakes live.

**The WOW moment**: You're the driver, writing a function. The AI navigator says: "You're iterating from the end -- that works, but have you considered that the indices might be off by one for the boundary case?" You fix it. Then you switch: AI drives, you navigate. AI writes code and you review each line live, saying "wait, that variable name is misleading" and the AI refactors.

**Why unique**: GitHub Copilot writes code FOR you. This writes code WITH you, as a collaborative partner. The alternating driver/navigator is unique -- it practices the actual PAIR PROGRAMMING dynamic, not just autocompletion.

**Effort**: XL (AI integration with role-switching state machine, conversational coding)

---

### 4.2 -- Bug Injection Mode

**One-liner**: The AI pair partner deliberately introduces subtle bugs into the code, and you need to catch them in real-time during the pairing session.

**The WOW moment**: The AI is driving. It writes a binary search. But the mid calculation uses `(left + right) / 2` instead of `left + (right - left) / 2`. You catch it: "That'll overflow for large arrays." The AI says: "Good catch. What's the fix?" You explain. Score: +15 for catching an integer overflow bug. End of session: "You caught 7/10 injected bugs. Missed: off-by-one in loop termination, null check omission, resource leak in file handling."

**Why unique**: NOBODY does this. Code review training is always after-the-fact. This trains you to catch bugs IN REAL-TIME during collaborative coding, which is the actual skill tested in pair programming rounds.

**Effort**: L (bug injection templates by category, detection scoring, progressive difficulty)

---

### 4.3 -- Communication Scorecard

**One-liner**: During pair programming, the system tracks your communication patterns -- how often you explain your thinking, ask questions, respond to suggestions -- and scores your collaboration skills.

**The WOW moment**: End of session scorecard: "Thinking Out Loud: 8/10 (you verbalized 80% of your decisions). Active Listening: 7/10 (you addressed 70% of navigator suggestions). Question Quality: 9/10 (your questions were specific and actionable). Dead Air: 2 instances >30 seconds (interviewers notice silence)."

**Why unique**: No platform measures COMMUNICATION during coding. This is the #1 thing pair programming rounds actually test, and nobody trains for it.

**Effort**: L (speech/text analysis for communication pattern detection, silence detection, scoring rubric)

---

### 4.4 -- Persona Gallery

**One-liner**: Choose your AI pair partner's personality -- senior engineer who challenges every decision, junior dev who needs mentoring, aggressive interviewer who asks "why not X?" every 30 seconds, or quiet partner who only speaks when asked.

**The WOW moment**: You select "Senior Staff Engineer." The AI: "I see you're using a HashMap. What's the expected collision rate at your projected scale? Have you considered a concurrent hash map given the threading model?" You switch to "Junior Developer." The AI writes naive code and YOU have to guide them: "Let's think about what happens when the list is empty -- we need a guard clause."

**Why unique**: This tests different pair programming dynamics. Real interviews pair you with different personality types. Training with one AI personality doesn't prepare you for all. The "mentoring a junior" persona tests leadership skills.

**Effort**: M (prompt engineering for persona profiles, personality-consistent conversation)

---

### 4.5 -- Live Refactoring Relay

**One-liner**: You and the AI take turns refactoring a messy codebase. Each person makes one refactoring move, then passes control. The code quality score must improve with each pass.

**The WOW moment**: You see 200 lines of spaghetti code. Turn 1 (you): extract a method. Quality score: 35 -> 42. Turn 2 (AI): rename variables for clarity. Score: 42 -> 48. Turn 3 (you): apply Strategy pattern. Score: 48 -> 65. After 10 turns, the code is clean, and you see the entire refactoring journey as a timeline.

**Why unique**: Gamified collaborative refactoring. Nobody has this. It practices the real-world skill of incremental improvement in a pair context.

**Effort**: M (code quality scoring, turn-based control system, refactoring history timeline)

---

### 4.6 -- Think-Aloud Recorder

**One-liner**: Record yourself thinking aloud while coding. The AI transcribes and analyzes your thought process, identifying gaps in reasoning, unexplored alternatives, and unclear explanations.

**The WOW moment**: You record 10 minutes of pair programming. The analysis shows: "At 2:15, you chose BFS without explaining why. A good candidate would say: 'I'm choosing BFS because we need shortest path and the graph is unweighted.' At 5:30, you went silent for 45 seconds. In a real interview, verbalize even when stuck: 'I'm not sure about the termination condition, let me think about edge cases.'"

**Why unique**: You ALREADY have `RecordButton.tsx`. The enhancement is AI analysis of the recording for communication quality. No platform does post-session communication analysis.

**Effort**: L (speech-to-text, communication pattern analysis, gap detection)

---

### 4.7 -- Collaborative Debugging Session

**One-liner**: A broken program with multiple bugs. You and the AI pair-debug it, dividing the investigation -- you check one hypothesis, the AI checks another, and you converge on the root cause.

**The WOW moment**: The program crashes with a segfault. You say: "Let me check the array bounds." AI says: "I'll check the pointer dereferencing." You find the array is allocated correctly. AI finds: "The pointer is being used after free on line 45." You both converge: "The bug is a use-after-free. The fix is to set the pointer to null after freeing."

**Why unique**: Real debugging is collaborative. Nobody simulates collaborative debugging with role division. This practices the actual investigation flow of pair debugging.

**Effort**: M (pre-built buggy programs, investigation path tracking, convergence detection)

---

### 4.8 -- API Design Negotiation

**One-liner**: You and the AI design an API together, debating endpoint structure, error handling, and versioning -- the AI represents "the other team" that needs to consume your API.

**The WOW moment**: You propose `POST /users/create`. AI pushes back: "That's not RESTful. POST /users already implies creation. Also, what happens when the email already exists? A 409 Conflict, or do you upsert?" You debate. You settle on `POST /users` with `409 Conflict` for duplicates and `PUT /users/{id}` for upserts. The session produces a clean API spec that both "teams" agreed on.

**Why unique**: API design is collaborative in real companies. Nobody practices the NEGOTIATION aspect of API design with a counterpart who has different preferences and requirements.

**Effort**: M (AI persona as API consumer, design constraint generation, spec output)

---

### 4.9 -- Code Tour Guide

**One-liner**: Practice explaining a complex codebase to someone unfamiliar with it -- the AI asks naive questions and you learn to give clear, concise explanations.

**The WOW moment**: You load a 500-line codebase. AI: "I'm new to this project. Can you give me a 2-minute overview?" You explain. AI: "What does the `processQueue` function do? I see it's called from 3 places." You explain. AI evaluates: "Your explanation was clear for the first two, but you used jargon ('event loop') without defining it for a newcomer. Score: 7/10 for clarity."

**Why unique**: Code walkthrough is a real interview skill (onboarding, code review, design review). Nobody practices it in a structured way.

**Effort**: M (pre-built codebases, AI question generation, clarity scoring)

---

### 4.10 -- Pair TDD Ping-Pong

**One-liner**: Test-Driven Development in pairs: you write a failing test, the AI writes the minimum code to pass it, then the AI writes the next failing test for you to implement.

**The WOW moment**: You write: `expect(calculator.add(2, 3)).toBe(5)`. Test fails (red). AI writes: `add(a, b) { return a + b; }`. Test passes (green). AI writes the next test: `expect(calculator.divide(10, 0)).toThrow('Division by zero')`. Your turn to implement. Back and forth, a complete Calculator class emerges through pure TDD.

**Why unique**: TDD ping-pong is a well-known pair programming technique. Nobody has it as an interactive, structured exercise with an AI partner.

**Effort**: M (test/implementation alternation framework, minimal implementation scoring)

---

## ROUND 5: DEBUGGING ROUND (8 features)

### 5.1 -- Codebase Autopsy

**One-liner**: You're dropped into a BROKEN 500-line codebase with a failing test suite. Find and fix all bugs. Timer is ticking. Each bug has a difficulty rating and point value.

**The WOW moment**: 5 tests failing, 3 passing. You read the first failure: "Expected 42, got undefined." You trace it to line 87 -- a typo in a variable name. Fix. 2 tests now pass. Next: "Maximum call stack exceeded." You find infinite recursion on line 123 -- missing base case. Fix. 1 more passes. The remaining bug is a subtle race condition. Timer shows 12 minutes. You find it at 11:30. All tests green. Score: 95/100.

**Why unique**: HackerRank has "fix the bug" problems. Nobody gives you a REALISTIC codebase with multiple interacting bugs of varying difficulty. The multi-bug, multi-file experience is what real debugging feels like.

**Effort**: M (curated buggy codebases with multiple intentional bugs, progressive hint system)

---

### 5.2 -- Log Detective

**One-liner**: Given production logs from a failing system, find the root cause. Logs contain noise, red herrings, and the actual failure buried in 10,000 lines.

**The WOW moment**: 10,000 log lines. 99% are normal operations. You filter by ERROR -- 47 errors. Most are retryable transient failures (red herring). You filter by timestamp around the incident. You find: "ConnectionPool exhausted at 02:14:33, max=100, active=100, waiting=847." Root cause: connection leak in the payment service. The log viewer highlights your investigation path and shows what an expert would have done differently.

**Why unique**: Nobody trains log analysis. This is 80% of real debugging, and every interview candidate who has never debugged production systems struggles with it.

**Effort**: M (synthetic log generator with planted anomalies, investigation path tracking)

---

### 5.3 -- Memory Leak Investigator

**One-liner**: A program has a memory leak. You get a heap dump at T=0 and T=10 minutes. Find what's growing, why, and fix it.

**The WOW moment**: You see the heap profile: at T=0, 50MB. At T=10, 500MB. You look at the diff: `EventListener[]` grew from 100 to 100,000 objects. You find the code: `addEventListener` is called in a loop without `removeEventListener`. Each iteration adds a new listener. Fix: add cleanup. Re-run: heap stays flat at 50MB.

**Why unique**: Memory leak debugging is tested in senior interviews but never practiced anywhere. This gives you the actual investigation flow: heap diff, growth analysis, code correlation.

**Effort**: M (simulated heap profiles with planted leaks, growth visualization)

---

### 5.4 -- Deadlock Detector

**One-liner**: A multi-threaded program is deadlocked. You see the thread dump with lock ownership. Find the circular wait and fix it.

**The WOW moment**: 4 threads. Thread-1 holds Lock-A, waiting for Lock-B. Thread-2 holds Lock-B, waiting for Lock-C. Thread-3 holds Lock-C, waiting for Lock-A. The visualization shows the cycle as a glowing red circle on a resource allocation graph. You break the cycle by reordering lock acquisition in Thread-3.

**Why unique**: You ALREADY have `deadlock-demo.ts` and the OS module's deadlock detection. The enhancement is making this an INVESTIGATION exercise rather than a demonstration. You don't know where the deadlock is -- you have to find it.

**Effort**: S (investigation wrapper on existing deadlock simulation)

---

### 5.5 -- Performance Profiler Challenge

**One-liner**: A program runs in 30 seconds. Target: 500ms. Use the profiler to find hot paths and optimize.

**The WOW moment**: You run the profiler. A flame graph shows: 95% of time in `processData()`. Drill in: 80% in `findDuplicate()` which uses nested loops (O(n^2)). You replace with a HashSet (O(n)). Re-run: 500ms. The flame graph collapses to a thin bar. Before/after comparison shows the dramatic improvement.

**Why unique**: Nobody teaches performance profiling as a skill. This gives you flame graphs, hot path identification, and optimization with measurable improvement.

**Effort**: M (simulated profiler with flame graph visualization, optimization validation)

---

### 5.6 -- Git Bisect Challenge

**One-liner**: A bug was introduced somewhere in the last 100 commits. Use binary search (git bisect) on the commit history to find which commit introduced the regression, in the minimum number of steps.

**The WOW moment**: 100 commits. You mark the current commit as "bad" and the oldest as "good." Binary search: commit 50 -- test passes (good). Commit 75 -- test fails (bad). Commit 62 -- test passes. Commit 68 -- test fails. Commit 65 -- test passes. Commit 66 -- test FAILS. Found it in 7 steps. The commit shows a one-line change that broke everything. Optimal was 7 steps (log2(100)). Your score: 100%.

**Why unique**: Git bisect is a real debugging skill that nobody practices in a structured way. This gamifies it with optimal-step scoring.

**Effort**: S (simulated commit history with planted regression, step counting)

---

### 5.7 -- Stack Trace Decoder

**One-liner**: Given a cryptic production stack trace (minified code, unfamiliar libraries, multiple async layers), trace it back to the root cause and explain what happened.

**The WOW moment**: Stack trace: 15 frames deep, minified function names, crossing through 3 libraries you've never seen. You decode: the bottom frame is in your code, calling a library function with wrong argument types. The library throws, caught and re-thrown by middleware, which wraps it in a custom error. You identify the root: line 42 in `UserService.ts` passes a string where a number was expected.

**Why unique**: Reading stack traces is a core debugging skill. Nobody practices it systematically, especially with the noise of production traces (minification, library internals, async boundaries).

**Effort**: S (curated stack traces with varying complexity, root cause identification)

---

### 5.8 -- Regression Detective

**One-liner**: A feature that worked yesterday is broken today. You get the diff (50 files changed), the failing test, and the production metrics. Find which change caused the regression.

**The WOW moment**: 50 files changed across 8 pull requests merged yesterday. The failing test is in the payment service. You narrow: which PRs touched payment? Three. You review the diffs. PR #3 changed the currency conversion function -- it now rounds DOWN instead of to nearest. That's the regression. Time: 4 minutes.

**Why unique**: This is the most common real-world debugging scenario, and nobody practices it. The skill is NARROWING from a large change set to the specific regression.

**Effort**: M (curated multi-file diffs with planted regressions, investigation scoring)

---

## ROUND 6: CORE CS (OS + DBMS + NETWORKING) (9 features)

### 6.1 -- CPU Scheduler Cockpit

**One-liner**: You ARE the CPU scheduler. Processes arrive in real-time. You manually decide which process to run next, and the system scores your scheduling against the optimal algorithm.

**The WOW moment**: Process A (burst 4ms) arrives at T=0. Process B (burst 2ms) arrives at T=1. Process C (burst 1ms) arrives at T=2. You're doing manual SJF. You run C first (shortest), then B, then A. Result: average waiting time = 2.0ms. Optimal (SJF) was 2.0ms. Score: 100%. Then you switch to "Round Robin mode" and manually quantum-slice. You FEEL why SJF minimizes waiting time.

**Why unique**: You ALREADY have 6+ scheduling algorithms in `scheduling.ts` and `mlfq-scheduler.ts`. Nobody lets you BE the scheduler. The manual scheduling forces you to internalize the algorithm instead of just watching it.

**Effort**: S (interactive scheduling interface on existing scheduling engines)

---

### 6.2 -- Page Fault Simulator

**One-liner**: You see a virtual memory system with page table, physical frames, and disk. Memory references arrive. You watch pages swap in/out and see page faults with the replacement algorithm animated.

**The WOW moment**: Physical memory has 4 frames. Reference string: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5. You watch with LRU: page 5 arrives, frame is full, LRU victim is page 3 (least recently used). Page 3 slides to disk with an animation, page 5 slides into the frame. Total page faults: 10. Switch to Optimal: 8 faults. You see WHY optimal is better -- it evicts the page used farthest in the future.

**Why unique**: You ALREADY have `page-replacement.ts`. The enhancement is making the physical memory layout VISUAL -- frames as boxes, pages sliding between memory and disk, with the replacement decision highlighted.

**Effort**: S (visualization layer on existing page replacement engine)

---

### 6.3 -- B-Tree Surgery

**One-liner**: Insert and delete keys from a B-Tree and watch the splits, merges, and rebalancing happen with smooth animations showing exactly which nodes change.

**The WOW moment**: You insert key 15 into a B-Tree of order 3. The leaf is full. SPLIT: the node divides, the median key 12 promotes to the parent. The parent is now full. CASCADE: the parent splits too, promoting key 20 to the root. A new root level appears. The entire operation animates smoothly, with split nodes sliding apart and the promoted key rising upward.

**Why unique**: You ALREADY have `btree-viz.ts`. The enhancement is smooth, step-by-step animation of splits and merges with clear visual narrative of WHY each step happens.

**Effort**: S (animation layer on existing B-tree operations)

---

### 6.4 -- Transaction Isolation Theater

**One-liner**: Two transactions run concurrently on the same database rows. Watch dirty reads, phantom reads, and non-repeatable reads happen (or get prevented) under different isolation levels.

**The WOW moment**: Isolation level: READ UNCOMMITTED. Transaction A writes $100 -> $50 (uncommitted). Transaction B reads $50. Transaction A rolls back. Transaction B now has a DIRTY READ of $50 that never existed. The visualization shows both transactions as parallel timelines with the data flowing between them. Switch to SERIALIZABLE: Transaction B blocks until A commits.

**Why unique**: You ALREADY have `transaction-sim.ts` and `mvcc-viz.ts`. The enhancement is the parallel timeline visualization showing exactly where anomalies occur. Nobody visualizes transaction isolation as two parallel timelines interacting.

**Effort**: M (dual-timeline visualization on existing transaction simulation)

---

### 6.5 -- TCP Handshake Step-Through

**One-liner**: Walk through the TCP 3-way handshake, slow start, congestion avoidance, and connection teardown packet by packet, with each packet's headers visible and explained.

**The WOW moment**: SYN packet flies from client to server. You click it mid-flight and see: "SEQ=0, ACK=0, Flags: SYN, Window: 65535." Server responds: SYN-ACK with SEQ=0, ACK=1. Client completes: ACK with SEQ=1, ACK=1. Connection established. Then data transfer begins with slow start: window doubles each RTT. You SEE the congestion window growing on a graph while packets animate.

**Why unique**: You ALREADY have `tcp-state-machine.ts`. The enhancement is packet-level animation with header inspection. Nobody lets you click on a packet mid-flight to inspect its headers.

**Effort**: M (packet animation with header inspection overlay on existing TCP simulation)

---

### 6.6 -- DNS Resolution Race

**One-liner**: Watch a DNS query traverse the hierarchy (browser cache -> OS cache -> recursive resolver -> root -> TLD -> authoritative), with timings at each hop, and see how caching speeds up repeat queries.

**The WOW moment**: First query: `api.example.com`. Browser cache: MISS (5ms). OS cache: MISS (10ms). Recursive resolver: MISS (20ms). Root server: "Try .com TLD" (40ms). TLD server: "Try ns1.example.com" (60ms). Authoritative: "192.168.1.1" (80ms). Total: 215ms. Second query (same domain): Browser cache HIT. Total: 5ms. The 43x speedup from caching is visually dramatic.

**Why unique**: You ALREADY have `dns-resolution.ts`. The enhancement is visualizing the FULL hierarchy traversal with timing accumulation. Nobody shows the timing stack for each DNS hop.

**Effort**: S (timing visualization on existing DNS resolution engine)

---

### 6.7 -- Process Lifecycle Theater

**One-liner**: Watch a process go through its entire lifecycle: created -> ready -> running -> blocked (I/O) -> ready -> running -> terminated, with the OS scheduling decisions visible at each transition.

**The WOW moment**: A process is created. It enters the ready queue. The scheduler picks it (you see WHY: highest priority). It runs for 10ms. I/O request: it moves to blocked queue. Another process runs while it waits. I/O completes: it moves back to ready. Scheduler picks it again. It terminates. The entire lifecycle is a visual state machine with real-time transitions.

**Why unique**: You ALREADY have `thread-lifecycle.ts` and `context-switch.ts`. The enhancement is a full lifecycle visualization combining scheduling, I/O waiting, and context switching in one coherent animation.

**Effort**: S (composite visualization on existing OS simulation engines)

---

### 6.8 -- Query Plan Explainer

**One-liner**: Write a SQL query and see the execution plan as an animated tree -- table scans, index lookups, joins, sorts -- with estimated costs at each node.

**The WOW moment**: You write: `SELECT * FROM orders JOIN users ON orders.user_id = users.id WHERE orders.amount > 100 ORDER BY orders.date`. The plan tree shows: Table Scan on orders (cost: 500) -> Filter amount > 100 (cost: 200) -> Nested Loop Join with users (cost: 50000). "Performance issue: Table Scan on orders. Add index on (amount) to reduce cost 10x." You add the index. Re-run: Index Scan (cost: 50) -> Filter -> Hash Join (cost: 500). Total cost drops 95%.

**Why unique**: You ALREADY have `query-plan.ts`. The enhancement is the animated tree with cost annotations and optimization suggestions. Nobody shows the plan as an interactive tree where you can add indexes and see the cost change instantly.

**Effort**: M (query plan tree visualization with interactive index addition)

---

### 6.9 -- Deadlock Banker's Game

**One-liner**: You're the operating system running the Banker's Algorithm. Processes request resources, and you must decide whether to grant each request (safe state) or deny it (would lead to deadlock).

**The WOW moment**: Process P1 requests 2 units of Resource A. You check the available resources and maximum claims. If you grant it, the remaining resources can satisfy P2 and P3's maximum needs (safe state). GRANT. Next: P2 requests 3 units of Resource B. If granted, no remaining sequence can satisfy all processes. DENY. P2 must wait. Score: 5/5 correct decisions.

**Why unique**: You ALREADY have `bankers-algorithm.ts`. Nobody makes you PLAY the algorithm manually and checks your decisions against the optimal. The manual decision-making forces internalization.

**Effort**: S (interactive decision interface on existing Banker's algorithm)

---

## ROUND 7: BACKEND / API DESIGN ROUND (7 features)

### 7.1 -- API Playground

**One-liner**: Design an API with endpoints, then immediately test it with mock responses, validation, error handling, and rate limiting -- all in the browser.

**The WOW moment**: You define `POST /users` with body schema `{ name: string, email: string }`. Click "Test." The playground sends a request, mock server responds with `201 Created`. Send without email: `400 Bad Request: "email is required"`. Send 100 requests in 1 second: `429 Too Many Requests, Retry-After: 60`. The API behaves exactly as you designed it.

**Why unique**: Postman tests existing APIs. This lets you DESIGN and TEST an API that doesn't exist yet. The mock server enforces your schema, validation rules, and rate limits instantly.

**Effort**: M (schema-driven mock server, request builder, response viewer)

---

### 7.2 -- REST vs. gRPC vs. GraphQL Arena

**One-liner**: The same feature request implemented in all three paradigms, side by side, with performance metrics showing latency, payload size, and developer experience tradeoffs.

**The WOW moment**: Feature: "Get user with their 10 most recent orders." REST: 2 requests (GET /users/1, GET /users/1/orders?limit=10), total payload: 4.2KB, latency: 180ms. GraphQL: 1 request with nested query, payload: 1.8KB (no over-fetching), latency: 120ms. gRPC: 1 RPC with streaming, payload: 0.9KB (binary), latency: 45ms. The comparison table makes the tradeoffs visceral.

**Why unique**: You ALREADY have `api-comparison.ts` and `serialization-comparison.ts`. The enhancement is making the comparison interactive with the SAME use case across all three paradigms.

**Effort**: M (unified comparison framework on existing API and serialization comparison data)

---

### 7.3 -- Auth Flow Visualizer

**One-liner**: Watch OAuth 2.0 PKCE, JWT lifecycle, and session-based auth animated step by step, with each HTTP request and response visible.

**The WOW moment**: OAuth 2.0 PKCE flow: Client generates code_verifier. Redirects to authorization server with code_challenge (SHA256 hash). User logs in. Authorization server redirects back with authorization code. Client exchanges code + code_verifier for access token. Authorization server verifies code_challenge matches. Token issued. Each step is an animated arrow between Client, Auth Server, and Resource Server, with the actual HTTP request headers visible.

**Why unique**: You ALREADY have `oauth-flows.ts`, `jwt-engine.ts`, and `oauth.ts`. The enhancement is making the FULL flow visible as an animated sequence with actual HTTP request/response pairs.

**Effort**: S (sequence animation on existing auth flow data)

---

### 7.4 -- Pagination Showdown

**One-liner**: Compare offset pagination, cursor pagination, and keyset pagination on the same dataset, showing performance degradation at scale.

**The WOW moment**: Dataset: 10 million rows. Offset pagination: page 1 = 5ms, page 100 = 50ms, page 100,000 = 5,000ms (the database scans and discards 999,990 rows). Cursor pagination: every page = 5ms regardless of position. The chart showing offset's linear degradation vs. cursor's flat line is the screenshot moment.

**Why unique**: Everyone teaches pagination theoretically. Nobody DEMONSTRATES the performance degradation with real numbers and visualizations.

**Effort**: S (simulated query timing with visualization)

---

### 7.5 -- API Versioning Workshop

**One-liner**: Take an existing API, introduce a breaking change, and implement versioning (URL path, header, query param) -- then see how existing clients break or adapt.

**The WOW moment**: V1 API: `GET /users` returns `{ name: "John" }`. You need to split name into firstName/lastName. Option A (URL versioning): `/v2/users` returns `{ firstName: "John", lastName: "Doe" }` -- V1 clients unaffected. Option B (header versioning): `Accept: application/vnd.api+json;version=2` -- cleaner URLs but harder for browsers. The simulation shows 3 client types consuming your API and which break under each strategy.

**Why unique**: Nobody teaches API versioning interactively with simulated client impact. This is a real-world problem that comes up in every API design interview.

**Effort**: M (multi-client simulation, versioning strategy comparison)

---

### 7.6 -- Idempotency Key Lab

**One-liner**: Simulate network failures during API calls and see how idempotency keys prevent duplicate operations.

**The WOW moment**: Client sends `POST /payments` with idempotency key `abc123`. Network drops the response. Client retries with SAME key. Without idempotency: double charge. WITH idempotency: server recognizes key, returns cached response, no duplicate. The visualization shows both timelines side by side.

**Why unique**: Idempotency is critical for payment/financial APIs and asked about in interviews. Nobody demonstrates it with actual failure simulation.

**Effort**: S (network failure injection on simulated API)

---

### 7.7 -- Rate Limiter Playground

**One-liner**: Implement different rate limiting algorithms (token bucket, sliding window, fixed window, leaky bucket) and SEE them handle traffic bursts differently.

**The WOW moment**: Traffic burst: 100 requests in 1 second, then 0 for 9 seconds. Rate limit: 10/second. Token bucket: allows burst of 10, blocks 90, then refills. Sliding window: blocks consistently. Fixed window: allows 10, then blocks until window resets, then allows a burst at boundary. You SEE the difference in how each algorithm handles the same traffic pattern.

**Why unique**: You ALREADY have `rate-limiting-demo.ts` and `rate-limiter.ts`. The enhancement is comparative visualization of all algorithms on the SAME traffic pattern.

**Effort**: S (multi-algorithm comparison on existing rate limiter implementations)

---

## ROUND 8: DATABASE ROUND (7 features)

### 8.1 -- Query Execution Cinema

**One-liner**: Write a SQL query and watch it execute through the database engine step by step -- parser -> planner -> optimizer -> executor -- with the data flowing through each stage.

**The WOW moment**: You write `SELECT name FROM users WHERE age > 25 ORDER BY name`. Stage 1 (Parse): SQL string becomes AST. Stage 2 (Plan): optimizer considers table scan vs. index scan. Stage 3 (Execute): pages are read from disk (visualized as blocks), rows are filtered, results are sorted. You SEE pages being read and the executor scanning row by row. With an index: the executor jumps directly to matching pages.

**Why unique**: You ALREADY have `query-plan.ts` and `btree-viz.ts`. The enhancement is the FULL pipeline animation from SQL text to result set, showing internal engine operations.

**Effort**: L (full query pipeline visualization combining existing components)

---

### 8.2 -- Schema Design Feedback Loop

**One-liner**: Design a database schema, run sample queries against it, and get instant feedback: "This query requires a full table scan. Add an index on (user_id, created_at) to make it O(log n)."

**The WOW moment**: You design a schema for a social media app. Table: posts (id, user_id, content, created_at). Query: "Get all posts by user 123 ordered by date." Feedback: "Full table scan: 10M rows. Add composite index on (user_id, created_at). Estimated improvement: 99.9%." You add it. Re-run: "Index scan: 500 rows. Optimal."

**Why unique**: You ALREADY have `normalization.ts`, `er-to-sql.ts`, and `query-plan.ts`. Nobody gives instant index recommendations on a schema-in-progress during design time.

**Effort**: M (schema analyzer with index recommendation engine)

---

### 8.3 -- Normalization Gym

**One-liner**: Given an unnormalized table, step through normalization form by form (1NF -> 2NF -> 3NF -> BCNF), with the system showing functional dependencies and decomposition at each step.

**The WOW moment**: Table: StudentCourseInstructor(StudentID, StudentName, CourseID, CourseName, InstructorID, InstructorName). The system identifies: "FD: CourseID -> CourseName, InstructorID (partial dependency on part of candidate key). This violates 2NF." You decompose into Student, Course, Enrollment. The system validates: "Now in 2NF. But InstructorID -> InstructorName is a transitive dependency. Violates 3NF."

**Why unique**: You ALREADY have `normalization.ts`. The enhancement is interactive step-through where YOU decompose and the system validates, rather than the system decomposing automatically.

**Effort**: S (interactive decomposition with validation on existing normalization engine)

---

### 8.4 -- Join Algorithm Visualizer

**One-liner**: Watch how nested loop join, hash join, and merge join execute on the same data, with I/O counts and comparisons showing why hash join wins for large tables.

**The WOW moment**: Two tables: 1000 rows and 100 rows. Nested Loop: 100,000 comparisons (every row x every row). Hash Join: build hash table on small table (100 ops), probe with large table (1000 ops) = 1,100 total. Merge Join: sort both (1000 log 1000 + 100 log 100), then single pass = ~11,000. The animation shows nested loop painfully iterating while hash join finishes 100x faster.

**Why unique**: You ALREADY have `join-viz.ts`. The enhancement is the comparative animation with I/O counting. Nobody races join algorithms against each other visually.

**Effort**: S (comparative visualization on existing join implementations)

---

### 8.5 -- LSM Tree vs. B-Tree Showdown

**One-liner**: Compare write-optimized (LSM) vs. read-optimized (B-Tree) storage engines with animated write paths, compaction, and read amplification.

**The WOW moment**: 1000 random writes. B-Tree: each write seeks to the correct leaf, updates in place. Random I/O: slow. LSM: writes go to in-memory memtable (instant), then flush to sorted SSTable on disk. Sequential I/O: fast. Write throughput: LSM 5x faster. Then 1000 random reads. B-Tree: single lookup. LSM: check memtable, then level 0, then level 1... Read amplification visible. Read throughput: B-Tree 3x faster.

**Why unique**: You ALREADY have `lsm-viz.ts` and `btree-viz.ts`. Nobody puts them HEAD TO HEAD on the same workload to show the fundamental tradeoff.

**Effort**: M (unified workload runner on both existing storage engine visualizations)

---

### 8.6 -- MVCC Timeline

**One-liner**: Watch Multi-Version Concurrency Control create and manage row versions as transactions read and write, seeing exactly which version each transaction sees.

**The WOW moment**: Transaction T1 (snapshot at T=10) reads row: sees version from T=8. Meanwhile T2 (started at T=12) updates the same row, creating version at T=12. T1 re-reads: STILL sees T=8 version (snapshot isolation). T2 commits. New transaction T3 sees T=12 version. The version chain is visible as a linked list of row versions with transaction timestamps.

**Why unique**: You ALREADY have `mvcc-viz.ts`. The enhancement is the version chain visualization showing exactly which version each transaction resolves to and WHY.

**Effort**: S (version chain visualization on existing MVCC simulation)

---

### 8.7 -- Sharding Simulator

**One-liner**: Take a single-node database, apply different sharding strategies (hash, range, geographic), and watch how queries route to different shards with cross-shard query costs visible.

**The WOW moment**: 10 million users. Shard by user_id hash (4 shards). Query: "Get user 12345" -> routes to shard 3 (hash(12345) mod 4). Fast: single shard lookup. Query: "Get all users with age > 25" -> scatter-gather across ALL 4 shards. Slow: 4x the work. "This is why you shard on your access pattern, not arbitrary keys."

**Why unique**: Nobody lets you interactively shard a dataset and then run queries to SEE the routing decisions and cross-shard costs.

**Effort**: M (sharding simulation with query routing visualization)

---

## ROUND 9: CONCURRENCY / MULTITHREADING ROUND (7 features)

### 9.1 -- Thread Race Visualizer

**One-liner**: Watch two threads race for a shared variable, see the exact interleaving that causes a race condition, and then add synchronization to fix it.

**The WOW moment**: Two threads increment a shared counter 1000 times each. Expected: 2000. Without synchronization: result varies (1847, 1923, 2000, 1756). The visualization shows the exact interleaving: Thread A reads 5, Thread B reads 5, Thread A writes 6, Thread B writes 6. Lost update. Add mutex: result is always 2000, but you see the performance cost of lock contention.

**Why unique**: You ALREADY have `race-condition.ts` and `mutex-comparison.ts`. The enhancement is showing the EXACT interleaving that causes the bug, not just the result.

**Effort**: S (interleaving trace visualization on existing race condition simulation)

---

### 9.2 -- Dining Philosophers Theater

**One-liner**: Watch 5 philosophers eat and think, see deadlock form when they all pick up left fork simultaneously, and implement different solutions (resource ordering, arbitrator, Chandy/Misra).

**The WOW moment**: 5 philosophers at a table. They all reach for their left fork. All holding one fork, waiting for the right. DEADLOCK. The table glows red. You implement resource ordering: philosopher 4 picks up RIGHT fork first. Re-run: no deadlock, but philosopher 4 sometimes starves. You implement the arbitrator solution: a waiter limits concurrent eaters to 4. Perfect fairness.

**Why unique**: You ALREADY have `dining-philosophers.ts`. The enhancement is implementing and comparing MULTIPLE solutions side by side.

**Effort**: S (solution comparison on existing dining philosophers simulation)

---

### 9.3 -- Producer-Consumer Dashboard

**One-liner**: A bounded buffer with configurable producers, consumers, and buffer size. Watch the buffer fill and drain, see blocking when full/empty, and tune for optimal throughput.

**The WOW moment**: 3 producers, 1 consumer, buffer size 5. Buffer fills instantly. Producers block. Consumer drains slowly. Throughput: 100 items/sec. You add 2 more consumers. Buffer oscillates between 1-3 items. Throughput: 300 items/sec. You find the sweet spot: 3 producers, 3 consumers, buffer size 10 -> throughput: 500 items/sec with no blocking.

**Why unique**: You ALREADY have `producer-consumer.ts`. The enhancement is the TUNING experience -- adjusting parameters and seeing throughput change in real-time, like tuning a real system.

**Effort**: S (parameter sliders with real-time throughput graph on existing simulation)

---

### 9.4 -- Thread Pool Builder

**One-liner**: Build a thread pool from scratch, visually. Create worker threads, implement a task queue, watch tasks get dispatched, and see what happens when you over- or under-provision.

**The WOW moment**: 3 threads, 100 tasks. Tasks dispatch to idle threads. When all 3 are busy, tasks queue up. Queue grows to 97 tasks, then slowly drains as threads finish. Average wait time: 2.5 seconds. You increase to 10 threads: queue never exceeds 5, average wait: 200ms. You increase to 100 threads: context switching overhead makes it SLOWER than 10 threads.

**Why unique**: Nobody lets you build and tune a thread pool visually. The diminishing returns from too many threads is a key lesson that's hard to teach without experiencing it.

**Effort**: M (thread pool visualization with task dispatch animation and performance metrics)

---

### 9.5 -- Lock Comparison Lab

**One-liner**: Compare mutex, semaphore, read-write lock, and spinlock on the same workload, seeing contention, throughput, and CPU usage for each.

**The WOW moment**: Workload: 95% reads, 5% writes. Mutex: all operations serialize. Throughput: 100K ops/sec. Read-Write Lock: reads parallelize. Throughput: 900K ops/sec. The 9x improvement makes the case for RW locks visceral. But then: 50% reads, 50% writes. RW lock throughput drops to 200K (writer starvation issues). Mutex: still 100K. The tradeoff becomes clear.

**Why unique**: You ALREADY have `mutex-comparison.ts`. The enhancement is workload tuning to show WHERE each lock type excels.

**Effort**: S (workload slider with performance comparison on existing lock implementations)

---

### 9.6 -- Async/Await Demystifier

**One-liner**: Visualize the event loop, call stack, microtask queue, and macrotask queue executing async JavaScript code, showing EXACTLY why `Promise.then()` runs before `setTimeout()`.

**The WOW moment**: Code: `console.log('A'); setTimeout(() => console.log('B'), 0); Promise.resolve().then(() => console.log('C')); console.log('D');`. The visualization shows: Call stack runs synchronous code -> A, D. Microtask queue (Promise.then) runs next -> C. Macrotask queue (setTimeout) runs last -> B. Output: A, D, C, B. You SEE why C comes before B despite both being "async."

**Why unique**: You ALREADY have `event-loop.ts` and `async-patterns.ts`. The enhancement is connecting SPECIFIC code lines to queue positions, showing the execution model concretely.

**Effort**: S (code-to-queue mapping visualization on existing event loop simulation)

---

### 9.7 -- CAS & Lock-Free Challenge

**One-liner**: Implement a lock-free data structure using Compare-And-Swap. Watch atomic operations succeed or fail based on concurrent access, and see how retry loops handle CAS failures.

**The WOW moment**: You implement a lock-free counter. Thread A does CAS(counter, 5, 6). Thread B simultaneously does CAS(counter, 5, 6). One succeeds, one fails (expected value 5, actual is now 6). The failed thread retries with CAS(counter, 6, 7). The visualization shows the atomic compare step and the success/failure path for each thread.

**Why unique**: Nobody visualizes CAS operations at the atomic level. Lock-free programming is taught abstractly; this makes it concrete.

**Effort**: M (CAS operation visualization with concurrent thread simulation)

---

## ROUND 10: TESTING ROUND (6 features)

### 10.1 -- Mutation Arena

**One-liner**: Your test suite fights mutant versions of the code. Each mutant has one small change (flipped condition, removed line, changed operator). Tests that KILL mutants are strong. Tests that MISS mutants are weak.

**The WOW moment**: Your code: `if (x > 0) return true;`. Mutant 1: `if (x >= 0) return true;`. Your test with `x = 0` KILLS this mutant (expected false, mutant returns true). Mutant 2: `if (x > 0) return false;`. Your test with `x = 5` KILLS this. But Mutant 3: `if (x > 1) return true;` SURVIVES -- none of your tests use `x = 1`. You add a test. Mutation score: 95%.

**Why unique**: Mutation testing is a real technique, but no learning platform gamifies it. The "kill the mutant" framing makes test quality tangible.

**Effort**: M (mutation generator, test runner, survival analysis)

---

### 10.2 -- Coverage Heatmap

**One-liner**: Your code is displayed with a color heatmap: green for covered lines, red for uncovered, yellow for covered-but-only-by-one-test. See exactly where your test gaps are.

**The WOW moment**: 80% coverage looks good. But the heatmap shows: the error handling paths are ALL red. The happy path is green. You add error case tests. Coverage jumps to 95%, and more importantly, the RED is gone from all critical paths. The single-test yellow warns you: "If that one test breaks, these 5 lines become uncovered."

**Why unique**: Coverage tools exist but are post-hoc. This integrates coverage as a LIVE heatmap during test writing, making it a design tool rather than a report.

**Effort**: S (code coverage visualization, which is a known technique applied live)

---

### 10.3 -- TDD Dojo

**One-liner**: The editor is split into two locked panels: tests (left) and implementation (right). You MUST write a failing test before the implementation panel unlocks. Red-Green-Refactor enforced by the tool.

**The WOW moment**: Implementation panel is locked (greyed out). You write a test: `expect(add(2,3)).toBe(5)`. Run: RED (function doesn't exist). Implementation panel unlocks. You write the minimum code: `function add(a,b) { return a+b; }`. Run: GREEN. A "Refactor" button appears. You clean up. Run again: still GREEN. Panel locks. Write next test. The TDD cycle is ENFORCED.

**Why unique**: Nobody enforces TDD discipline in the editor. This makes the Red-Green-Refactor cycle mechanical and habitual.

**Effort**: M (panel locking logic, test-first enforcement, refactor phase detection)

---

### 10.4 -- Boundary Value Blitz

**One-liner**: Given a function specification, generate ALL boundary values automatically and challenge you to predict the output for each.

**The WOW moment**: Function: `calculateDiscount(amount: number): number`. Specification: 0-100: 0%, 101-500: 10%, 501+: 20%. Boundary values generated: -1, 0, 1, 100, 101, 500, 501, MAX_INT, NaN, undefined. For each: "What does your function return for amount = 101?" You predict: 10.1. Correct. "What about amount = -1?" You predict: 0. Actual: NaN (no negative handling). Bug found.

**Why unique**: Boundary value analysis is a testing fundamental, but nobody generates the boundary values and quizzes you on them.

**Effort**: S (boundary value generator from specification, prediction quiz)

---

### 10.5 -- Flaky Test Detective

**One-liner**: Given a test that passes 90% of the time and fails 10%, investigate WHY it's flaky: race condition? time dependency? external service? random data?

**The WOW moment**: Test: `expect(getUserBalance()).toBe(100)`. Passes 9/10 runs. You investigate: the test depends on a background process that sometimes hasn't finished. Run 100 times: failures correlate with slow database response. Root cause: test doesn't wait for async operation to complete. Fix: add `await` before assertion. Re-run 100 times: 100% pass.

**Why unique**: Flaky tests are the bane of real engineering. Nobody trains you to debug them systematically. This teaches root cause categories (timing, state, external deps) and investigation techniques.

**Effort**: M (pre-built flaky test scenarios with investigation tooling)

---

### 10.6 -- Property-Based Testing Lab

**One-liner**: Instead of writing specific test cases, define PROPERTIES your function must satisfy. The system generates thousands of random inputs and finds counter-examples.

**The WOW moment**: Property: "sort(array) should have the same elements as the input." Generator creates 10,000 random arrays. All pass. Property: "sort(array) should be idempotent: sort(sort(x)) == sort(x)." All pass. Property: "sort(array) should be ordered: every element <= next." 9,997 pass. 3 fail. Counter-example: `[NaN, 1, 2]`. Your sort doesn't handle NaN. The system found a bug you'd never think to test.

**Why unique**: Property-based testing is powerful but rarely taught interactively. The automatic counter-example discovery is the wow moment.

**Effort**: M (property definition UI, random input generator, counter-example minimizer)

---

## ROUND 11: CODE REVIEW ROUND (6 features)

### 11.1 -- PR Forensics

**One-liner**: Review a realistic pull request (200-500 lines across 5-10 files) with hidden bugs, security vulnerabilities, performance issues, and style violations. Find them all.

**The WOW moment**: A PR adds a user authentication feature. You review. File 1: SQL injection in the login query (string concatenation instead of parameterized). File 3: password stored in plaintext. File 7: race condition in session creation. You find 8/10 issues. The 2 you missed: a subtle timing attack on password comparison and a missing CORS header.

**Why unique**: Nobody has structured code review practice with scored outcomes. Real interviews include "review this code" rounds, and candidates struggle without practice.

**Effort**: M (curated PRs with categorized hidden issues, scoring rubric)

---

### 11.2 -- Security Audit Challenge

**One-liner**: Review code specifically for security vulnerabilities. Find SQL injection, XSS, CSRF, insecure deserialization, and other OWASP Top 10 issues.

**The WOW moment**: 10 security vulnerabilities hidden in 300 lines. You find the obvious SQL injection. You find the XSS in the template. But you miss the prototype pollution in `Object.assign()` and the insecure randomness in `Math.random()` for session IDs. Score: 7/10. The debrief shows each vulnerability with OWASP classification and fix.

**Why unique**: You ALREADY have `web-attacks.ts`, `csrf.ts`, `ssrf.ts`, `jwt-attacks.ts`. The enhancement is turning these into an interactive audit challenge rather than demonstrations.

**Effort**: M (curated vulnerable codebases, vulnerability classification and scoring)

---

### 11.3 -- Performance Review Lens

**One-liner**: Review code through a performance lens. Find N+1 queries, missing indexes, unnecessary allocations, and O(n^2) algorithms hiding in innocent-looking code.

**The WOW moment**: A seemingly clean controller function: `users.forEach(user => { user.orders = await getOrders(user.id); })`. You flag it: "N+1 query: this fires a database query per user. With 1000 users, that's 1001 queries. Use a batch query: `getOrdersForUsers(userIds)`." Score: +20 for catching the N+1.

**Why unique**: Performance code review is a senior engineer skill tested in interviews. Nobody practices it systematically.

**Effort**: M (curated performance-antipattern codebases with scoring)

---

### 11.4 -- Review Comment Workshop

**One-liner**: Practice writing GOOD code review comments. The system scores your comments on specificity, actionability, tone, and technical accuracy.

**The WOW moment**: You write: "This is bad code." Score: 2/10. "Vague, non-actionable, negative tone." You rewrite: "This database query inside a loop creates an N+1 problem. Consider batch-fetching with `SELECT * FROM orders WHERE user_id IN (...)` to reduce from O(n) queries to O(1)." Score: 9/10. "Specific, actionable, explains WHY, provides solution."

**Why unique**: Nobody teaches how to WRITE good code review comments. This is a critical team skill that interviews increasingly test.

**Effort**: S (comment quality scoring rubric, example library)

---

### 11.5 -- Architecture Review Board

**One-liner**: Review a system architecture design (presented as a canvas diagram) and identify scalability bottlenecks, single points of failure, and missing components.

**The WOW moment**: Architecture: Client -> API Server -> Database. No cache. No load balancer. Single database. You flag: "Single point of failure: one API server. Add load balancer + multiple instances." "No caching layer: database will be hit for every read. Add Redis." "No CDN: static assets served from API server. Add CloudFront." Score: 8/10. You missed: "No monitoring/alerting. Add DataDog/PagerDuty."

**Why unique**: You ALREADY have the architecture canvas and simulation engine. The enhancement is turning it into a REVIEW exercise where you identify issues in someone else's design.

**Effort**: M (pre-built architectures with known issues, review scoring rubric)

---

### 11.6 -- Diff Reading Speed Test

**One-liner**: Timed challenge: review a diff as fast as possible and identify all significant changes. Measures your code review speed and accuracy.

**The WOW moment**: 200-line diff. Timer starts. You scan: 3 bug fixes, 1 new feature, 2 refactors, 1 security issue. Time: 4 minutes. Accuracy: 6/7 significant changes found. Average senior engineer: 5 minutes, 5/7 found. You're above average. The missed item was a subtle change in error handling semantics.

**Why unique**: Code review speed and accuracy are never measured. This creates a benchmark for improvement.

**Effort**: S (curated diffs with tagged significant changes, timer, accuracy scoring)

---

## ROUND 12: BEHAVIORAL / HR ROUND (6 features)

### 12.1 -- STAR Story Studio

**One-liner**: An AI mock interviewer asks behavioral questions, you respond with STAR stories, and the AI scores each component (Situation, Task, Action, Result) with specific feedback.

**The WOW moment**: AI: "Tell me about a time you had to deal with a difficult team member." You respond. AI scores: "Situation: 8/10 (clear context). Task: 6/10 (your specific role was unclear). Action: 9/10 (specific steps you took). Result: 5/10 (no quantitative outcome). Improve: Add metrics -- 'After the conversation, our sprint velocity increased 20% and the team satisfaction score went from 3.2 to 4.1.'"

**Why unique**: Nobody scores STAR stories with component-level feedback. Most behavioral prep is "practice with a friend." This gives structured, repeatable feedback.

**Effort**: M (AI behavioral interview flow, STAR component extraction and scoring)

---

### 12.2 -- Leadership Principle Mapper

**One-liner**: For each target company (Amazon, Google, Meta, etc.), see their leadership principles, practice questions mapped to each principle, and track your coverage.

**The WOW moment**: Target: Amazon. 16 Leadership Principles. You've practiced: Customer Obsession (3 stories), Ownership (2 stories), Bias for Action (1 story). GAPS: Dive Deep (0 stories), Frugality (0 stories). The mapper suggests: "For 'Dive Deep,' think of a time you went beyond surface-level metrics to find the root cause of a problem."

**Why unique**: Amazon LP prep is usually a spreadsheet. Nobody maps your STAR stories to specific principles and shows coverage gaps.

**Effort**: S (company principle database, story-to-principle mapping, coverage dashboard)

---

### 12.3 -- Video Self-Review

**One-liner**: Record yourself answering behavioral questions, then review with AI annotations: "You said 'um' 14 times. You broke eye contact at 1:23. Your energy dropped at 2:45."

**The WOW moment**: You record a 3-minute response. AI analysis: "Filler words: 14 'ums', 8 'likes' (above average). Pacing: too fast in the first minute, good in minutes 2-3. Structure: you started with the result (not STAR order). Suggestion: reorder to Situation first."

**Why unique**: You ALREADY have `RecordButton.tsx`. The enhancement is AI analysis of the recording. Nobody provides structured feedback on behavioral interview delivery.

**Effort**: L (video/audio analysis, filler word detection, pacing analysis)

---

### 12.4 -- Conflict Resolution Simulator

**One-liner**: Interactive scenarios where you navigate a workplace conflict with branching dialogue options. Each choice leads to different outcomes.

**The WOW moment**: Scenario: "Your teammate pushed code without review and it broke production." Option A: "Publicly call them out in Slack." Option B: "DM them privately." Option C: "Fix the issue first, discuss later." You choose B. Follow-up: they get defensive. Option B1: "I understand, but we have a process..." Option B2: "Let's set up a pairing session to prevent this..." Each path leads to a different outcome scored on empathy, assertiveness, and resolution.

**Why unique**: Behavioral prep is always Q&A format. Nobody does interactive branching scenarios for soft skills. This is "choose your own adventure" for workplace conflicts.

**Effort**: M (branching dialogue system, scenario database, outcome scoring)

---

### 12.5 -- Salary Negotiation Trainer

**One-liner**: An AI HR representative makes you an offer. You negotiate: base salary, equity, signing bonus, level, team placement. The AI pushes back realistically.

**The WOW moment**: AI: "We're offering $180K base, 50K RSUs over 4 years, L5." You counter: "$210K base, 100K RSUs." AI: "We can do $195K base but can't increase RSUs. Would a $30K signing bonus work?" You evaluate. End score: "You negotiated 8% above initial offer. Average candidate: 5%. Expert: 15%. You left $15K on the table by not negotiating the equity refresh schedule."

**Why unique**: Nobody practices salary negotiation with an AI that pushes back realistically and scores your outcome against benchmarks.

**Effort**: M (negotiation AI with realistic counteroffers, market data for benchmarking)

---

### 12.6 -- "Why This Company?" Generator

**One-liner**: Given a company name, generate research-backed talking points for "Why do you want to work here?" from recent news, tech blog posts, and company values.

**The WOW moment**: Company: Stripe. Generated: "Stripe's recent launch of Stripe Atlas in 46 new countries shows their commitment to democratizing financial infrastructure. Your work on the payments API handles $817B in annual volume. I'm particularly interested in the challenge of maintaining 99.999% uptime at that scale, which aligns with my experience in distributed systems."

**Why unique**: Candidates Google the company 30 minutes before the interview. Nobody generates structured talking points that connect company facts to the candidate's experience.

**Effort**: S (company fact database, template-based talking point generation)

---

## ROUND 13: RESUME DEEP DIVE ROUND (6 features)

### 13.1 -- Project Architecture Generator

**One-liner**: Describe your project in plain English. The system generates an architecture diagram you can use to explain it visually in the interview.

**The WOW moment**: You type: "I built a real-time chat application with 100K concurrent users using WebSockets, Redis for pub/sub, PostgreSQL for message persistence, and Kubernetes for deployment." The system generates a full canvas diagram: Client -> WebSocket Gateway -> Redis Pub/Sub -> Chat Service -> PostgreSQL, with Kubernetes pods shown as container groups. You can edit and refine it.

**Why unique**: You ALREADY have the full canvas system with 30+ node types. The enhancement is NLP-to-architecture generation. Nobody auto-generates architecture diagrams from project descriptions.

**Effort**: L (NLP parsing of project descriptions, component identification, auto-layout on canvas)

---

### 13.2 -- Numbers Drill

**One-liner**: For YOUR specific project, practice answering "What were the numbers?" -- latency, throughput, availability, users, storage, cost -- with the system generating increasingly specific questions.

**The WOW moment**: You enter your project details. AI asks: "What was the P99 latency?" You: "200ms." AI: "What about P999?" You: "Uh..." AI: "If your P99 was 200ms, P999 is typically 3-5x that for most systems. You should know: approximately 600-1000ms. Next: What was your database query response time at peak load?"

**Why unique**: Nobody drills you on YOUR project's numbers. Interviewers always ask for specifics, and candidates always stumble because they didn't prepare concrete numbers.

**Effort**: S (project profile input, question generation from profile, benchmark validation)

---

### 13.3 -- Depth Ladder

**One-liner**: Practice "Tell me about your project" at 5 levels of depth: 30-second elevator pitch, 2-minute overview, 5-minute deep dive, 15-minute technical walkthrough, and unlimited Q&A.

**The WOW moment**: Level 1 (30 seconds): "I built a real-time analytics pipeline processing 1M events/sec." Timer forces conciseness. Level 3 (5 minutes): "The pipeline uses Kafka for ingestion, Flink for stream processing, and ClickHouse for analytics. Here's how we handle late-arriving events..." Level 5 (Q&A): AI drills into decisions: "Why ClickHouse over TimescaleDB?"

**Why unique**: Nobody practices project explanation at MULTIPLE depth levels. Real interviews require switching between summary and deep-dive instantly.

**Effort**: M (multi-level project presentation framework, AI depth probing)

---

### 13.4 -- Decision Defense Trainer

**One-liner**: For each technical decision in your project (chose Redis over Memcached, used microservices over monolith), practice defending it against pushback.

**The WOW moment**: Your decision: "We used MongoDB." AI pushback: "Why not PostgreSQL with JSONB? You get relational capabilities plus JSON flexibility." You defend: "Our schema was truly schemaless -- each document type had different fields. PostgreSQL JSONB can't index arbitrary nested paths efficiently." AI: "Good point about indexing. But what about transactions? MongoDB's multi-document transactions have higher latency." You counter with your actual experience.

**Why unique**: Nobody practices DEFENDING technical decisions. This is the core of resume deep-dive rounds, and candidates who can't defend their choices fail.

**Effort**: M (decision-challenge AI with realistic pushback for common technology choices)

---

### 13.5 -- Impact Quantifier

**One-liner**: You describe a project contribution vaguely ("I improved performance"). The system forces you to QUANTIFY: "By how much? Measured how? Compared to what baseline? Affecting how many users?"

**The WOW moment**: You say: "I improved the search API performance." System: "Improved from what to what? What metric?" You: "Latency went from 500ms to 100ms." System: "5x improvement. What was the method?" You: "Added caching and index optimization." System: "What was the cache hit rate? How many queries per second? What was the business impact?" You struggle. System: "For your interview, you need: 'I reduced search API P95 latency by 80% (500ms to 100ms) by implementing a Redis cache with 92% hit rate, serving 10K QPS, which improved user engagement by 15% as measured by search-to-click conversion.'"

**Why unique**: Nobody coaches you to transform vague impact statements into concrete, quantified stories. This is the single biggest weakness in resume deep-dive answers.

**Effort**: S (impact quantification prompts, template-based story strengthening)

---

### 13.6 -- Failure Story Bank

**One-liner**: Prepare and practice your best "failure" stories -- production incidents, bad decisions, missed deadlines -- with coaching on how to frame them positively.

**The WOW moment**: You describe: "I chose a NoSQL database and it was the wrong decision. We had to migrate to PostgreSQL 6 months later." System coaches: "Good raw material. Frame it as: 'I learned to evaluate technology choices more rigorously. The migration took 3 weeks, but I wrote a migration framework that the team reused for 4 subsequent migrations, saving an estimated 8 weeks of work.' Always end with what you LEARNED and how it made you BETTER."

**Why unique**: Everyone says "prepare a failure story." Nobody coaches you on HOW to tell it. The reframing from "I failed" to "I learned and created lasting value" is the key skill.

**Effort**: S (failure story templates, positive reframing prompts)

---

## ROUND 14: DEVOPS / CLOUD / SRE ROUND (7 features)

### 14.1 -- Pipeline Builder

**One-liner**: Build a CI/CD pipeline visually by dragging stages (build, test, lint, security scan, deploy to staging, canary, production) and see it execute on a sample repository.

**The WOW moment**: You drag: Checkout -> Install -> Lint -> Unit Test -> Build -> Security Scan -> Deploy Staging -> Integration Test -> Canary 5% -> Canary 25% -> Full Deploy. You click "run." Each stage executes with green/red status. The security scan finds a dependency vulnerability -- pipeline halts. You fix it. Re-run. Canary at 5% shows elevated error rate -- automatic rollback triggers. You see the ENTIRE pipeline lifecycle.

**Why unique**: Nobody lets you build and simulate a CI/CD pipeline visually with realistic stage behavior. AWS CodePipeline is for real infrastructure; this is for LEARNING the concepts.

**Effort**: L (visual pipeline builder, simulated stage execution)

---

### 14.2 -- Kubernetes Cluster Simulator

**One-liner**: Deploy pods, services, and ingress to a simulated Kubernetes cluster. Watch pod scheduling, scaling, and self-healing in action.

**The WOW moment**: You deploy 3 replicas of a web server. The simulator shows pods being scheduled across 3 nodes. You kill a node. Kubernetes detects: pod on dead node enters "Pending." Scheduler places a new pod on a healthy node. Self-healing in action. You scale to 10 replicas: pods distribute across nodes with resource-aware scheduling.

**Why unique**: Learning Kubernetes requires a real cluster ($$$). This simulates the core concepts (scheduling, scaling, self-healing) visually without infrastructure cost.

**Effort**: L (Kubernetes scheduling simulation, pod lifecycle visualization)

---

### 14.3 -- Incident Commander Roleplay

**One-liner**: You're the Incident Commander for a production outage. Coordinate the response: triage, assign roles, communicate to stakeholders, and make rollback decisions under time pressure.

**The WOW moment**: Alert: "Payment service returning 500 errors. Revenue impact: $10K/minute." You assign: "Engineer A: check recent deployments. Engineer B: check database metrics. Comms lead: post status page update." Engineer A reports: "Deployment 30 minutes ago changed payment validation." You decide: "Rollback immediately." Rollback takes 5 minutes. Total downtime: 12 minutes. Impact: $120K. Debrief shows: optimal response would have been 8 minutes ($80K) if you'd checked deployment first.

**Why unique**: Nobody practices incident management. SRE interviews increasingly test this skill. The time-pressure decision-making is what makes it valuable.

**Effort**: M (incident scenario engine with branching timelines and impact calculation)

---

### 14.4 -- SLO Calculator

**One-liner**: Define your SLIs and SLOs, then see how much error budget you have, how fast you're burning it, and when you need to freeze deployments.

**The WOW moment**: SLO: 99.9% availability = 43.8 minutes of downtime per month. Current burn rate: 2 incidents this month totaling 20 minutes. Remaining budget: 23.8 minutes. At current burn rate, you'll exhaust budget in 12 days. Alert: "If the next deployment causes a 5-minute outage, you'll have 18.8 minutes remaining. Deploy or wait?"

**Why unique**: SLO/SLI/SLA concepts are tested in SRE interviews but always taught theoretically. Nobody lets you MANAGE an error budget with real tradeoffs.

**Effort**: S (SLO calculation with error budget visualization and depletion projection)

---

### 14.5 -- Monitoring Dashboard Builder

**One-liner**: Build a monitoring dashboard by selecting metrics (latency, error rate, throughput, CPU, memory), setting alert thresholds, and watching simulated production data flow through.

**The WOW moment**: You build a dashboard: P99 latency (alert > 500ms), error rate (alert > 1%), CPU usage (alert > 80%). Simulated traffic flows. At T=5min, latency spikes to 800ms. Your alert fires. You investigate: CPU is at 90%. Root cause: traffic spike without auto-scaling. You add an auto-scaling rule: scale up at 70% CPU. Re-run: latency stays under 200ms.

**Why unique**: You ALREADY have `MetricsDashboard.tsx`, `ThroughputChart.tsx`, `LatencyPercentileChart.tsx`, `ErrorRateChart.tsx`, etc. The enhancement is connecting these to alert threshold configuration and auto-scaling rules.

**Effort**: M (alert threshold configuration on existing metrics dashboards)

---

### 14.6 -- Canary Deployment Visualizer

**One-liner**: Deploy a new version to 5% of traffic and watch metrics side by side (canary vs. baseline). Decide: promote to 25%, 50%, 100%, or rollback.

**The WOW moment**: Canary at 5%: error rate 0.5% vs. baseline 0.1%. Concerning but not definitive. You promote to 25%: error rate confirms at 0.4%. This is a real regression. You rollback. The canary version is pulled. No customer impact beyond the 5% that saw elevated errors. Time to decision: 3 minutes. The alternative (full deploy without canary) would have impacted 100% of users.

**Why unique**: Canary deployments are asked about in every SRE interview but never practiced. This makes the decision-making tangible.

**Effort**: M (canary simulation with split traffic and comparative metrics)

---

### 14.7 -- Terraform Plan Review

**One-liner**: Review a Terraform plan output and identify risky changes: resource deletion, security group modifications, database migrations that cause downtime.

**The WOW moment**: Terraform plan shows: "aws_db_instance.main: destroy and recreate (size change requires replacement)." You flag: "DANGER: this will destroy and recreate the database, causing data loss. Use a blue-green deployment instead." Score: +20. You also catch: "aws_security_group_rule: ingress 0.0.0.0/0 on port 22 -- this opens SSH to the world." Score: +15.

**Why unique**: Nobody practices Terraform plan review as a skill. This is increasingly tested in DevOps interviews and is a critical production safety skill.

**Effort**: M (curated Terraform plans with risky changes, risk identification scoring)

---

## ROUND 15: SECURITY ROUND (6 features)

### 15.1 -- Attack Lab

**One-liner**: PERFORM real attacks (SQL injection, XSS, CSRF) against deliberately vulnerable applications, then implement the defense.

**The WOW moment**: Target: a login form. You type `' OR '1'='1` in the username field. The query becomes `SELECT * FROM users WHERE username='' OR '1'='1'`. You're logged in as admin. The SQL query is shown with the injection highlighted in red. Fix: implement parameterized queries. Re-try the attack: it fails. The query now treats the input as a literal string.

**Why unique**: You ALREADY have `web-attacks.ts`, `csrf.ts`, `ssrf.ts`. The enhancement is making these INTERACTIVE -- you perform the attack, see it succeed, then implement the defense. OWASP WebGoat does this but nobody integrates it into an interview prep platform.

**Effort**: M (interactive vulnerable app with attack execution and defense implementation)

---

### 15.2 -- JWT Forensics

**One-liner**: Given a JWT token, decode it, identify vulnerabilities (weak algorithm, missing expiration, exposed secrets in payload), and exploit them.

**The WOW moment**: You paste a JWT. Decoded: header says `alg: "none"`. You exploit: remove the signature, change the payload to `admin: true`, send it. The server accepts it because it doesn't verify the algorithm. Fix: server must enforce algorithm whitelist. Another JWT uses HS256 with a weak secret. You brute-force the secret in 3 seconds. The visualization shows each guess and the crack.

**Why unique**: You ALREADY have `jwt-engine.ts` and `jwt-attacks.ts`. The enhancement is the interactive exploitation flow. Nobody lets you CRACK a JWT in the browser as a learning exercise.

**Effort**: S (interactive JWT decoder/exploiter on existing JWT engine)

---

### 15.3 -- OWASP Top 10 Gauntlet

**One-liner**: 10 challenges, one for each OWASP Top 10 vulnerability. Find and exploit the vulnerability, then implement the defense. Timed. Scored.

**The WOW moment**: Challenge 1 (Injection): Find the SQL injection in a search form. Challenge 3 (Sensitive Data Exposure): The API returns passwords in the response. Challenge 7 (XSS): Inject JavaScript through a comment form. You complete all 10 in 45 minutes. Score: 85/100. The two you missed: SSRF (the image URL fetcher hits internal services) and insecure deserialization.

**Why unique**: OWASP challenges exist (WebGoat, DVWA) but they're standalone tools. Nobody integrates them into an interview prep platform with scoring and time pressure.

**Effort**: L (10 vulnerable app challenges with exploit detection and defense implementation)

---

### 15.4 -- Encryption Showdown

**One-liner**: Compare symmetric (AES) vs. asymmetric (RSA) vs. hashing (SHA-256) side by side. Encrypt, decrypt, and see performance differences on the same data.

**The WOW moment**: Encrypt 1KB of data. AES-256: 0.01ms. RSA-2048: 2.5ms (250x slower). But AES needs key exchange, RSA doesn't. You see WHY TLS uses RSA for key exchange and AES for bulk data: "The best of both worlds." Hashing comparison: SHA-256 vs. bcrypt. SHA-256: 0.001ms. bcrypt: 250ms. "That's WHY bcrypt is used for passwords -- it's DELIBERATELY slow."

**Why unique**: You ALREADY have `aes-engine.ts`, `diffie-hellman.ts`, `encryption-comparison.ts`, `password-hashing.ts`. The enhancement is the unified comparison view with performance numbers. Nobody shows the performance tradeoffs side-by-side as the motivation for real-world protocol choices.

**Effort**: S (comparative visualization on existing crypto implementations)

---

### 15.5 -- Threat Model Workshop

**One-liner**: Given a system architecture (on the canvas), identify all threat vectors using STRIDE methodology. The system validates your threat model against a reference.

**The WOW moment**: Architecture: Client -> API Gateway -> Microservices -> Database. You identify: "Spoofing: no authentication at API Gateway." "Tampering: API requests not signed." "Information Disclosure: database connection not encrypted." "Denial of Service: no rate limiting." You submit. Score: 7/10 threats found. Missed: "Elevation of Privilege: API Gateway has admin access to all services" and "Repudiation: no audit logging."

**Why unique**: Threat modeling is a senior security skill. Nobody teaches it interactively with scoring against a reference. This bridges security and system design.

**Effort**: M (STRIDE framework integration with canvas analysis, reference threat model database)

---

### 15.6 -- Certificate Chain Inspector

**One-liner**: Inspect a TLS certificate chain, verify each certificate's signature, check expiration, and identify misconfiguration.

**The WOW moment**: You load a certificate chain: root CA -> intermediate CA -> leaf certificate. The visualization shows: root is self-signed (trusted anchor). Intermediate is signed by root (valid). Leaf is signed by intermediate (valid). Chain is complete. Then you load a BROKEN chain: intermediate is missing. The leaf can't be verified. "This is the most common TLS misconfiguration in production."

**Why unique**: You ALREADY have `cert-chain.ts` and `https-flow.ts`. The enhancement is interactive chain validation with intentional misconfigurations for diagnosis.

**Effort**: S (interactive chain visualization on existing cert chain data)

---

## CROSS-CUTTING PLATFORM FEATURES (8 features)

These span all rounds and make the overall platform experience distinctive.

### C.1 -- Knowledge Graph Navigator

**One-liner**: ALL concepts across all 15 rounds are connected in a zoomable knowledge graph. Click any concept to see its connections, prerequisites, and the features that teach it.

**The WOW moment**: You click "Consistent Hashing." The graph shows: prerequisites (Hash Functions, Distributed Systems Basics), connections (Load Balancing, Database Sharding, Caching), and features (System Design Simulator, Database Round). You see your mastery: "Consistent Hashing: 70% -- you've practiced it in system design but never in the database sharding context."

**Why unique**: You ALREADY have `KnowledgeGraphModule.tsx` and `ConceptDetailPanel.tsx`. The enhancement is cross-round concept tracking. Nobody connects interview preparation across multiple round types through a unified knowledge graph.

**Effort**: M (cross-module concept linking on existing knowledge graph)

---

### C.2 -- Interview Day Simulator

**One-liner**: Simulate an ENTIRE interview day: 4-6 rounds back-to-back (system design, coding, behavioral, peer programming), with time pressure and energy management.

**The WOW moment**: 9:00 AM -- System Design (45 min). 10:00 AM -- Coding (60 min). 11:15 AM -- Behavioral (30 min). 12:00 PM -- Lunch. 1:00 PM -- Peer Programming (45 min). 1:45 PM -- Code Review (30 min). End of day: aggregate scorecard across all rounds. "Your system design was strong (85/100) but your behavioral answers weakened in round 5 (65/100) -- fatigue factor. Practice stamina."

**Why unique**: Nobody simulates the FULL interview day. Real interviews test stamina and consistency across 4-6 hours. A single-round practice doesn't prepare you for that.

**Effort**: L (multi-round orchestration, fatigue modeling, aggregate scoring)

---

### C.3 -- Company-Specific Prep Packs

**One-liner**: Select your target company (Google, Amazon, Meta, etc.) and get a customized preparation plan based on their actual interview format, commonly asked questions, and evaluation criteria.

**The WOW moment**: Target: Google. Prep pack: "Google interviews focus heavily on System Design (2 rounds), Coding (2 rounds), and Googleyness (behavioral). Common system design topics: Design YouTube, Design Google Maps. Coding focus: graph algorithms (40% of questions), DP (30%), arrays/strings (30%). Timeline: 6-week plan with daily exercises."

**Why unique**: You ALREADY have company tags on challenges (`companies: ['Amazon', 'Google', 'Meta']`). The enhancement is company-specific preparation plans that go beyond topic tags.

**Effort**: M (company interview format database, customized plan generation)

---

### C.4 -- Progress Heatmap

**One-liner**: A GitHub-style contribution heatmap showing your daily practice, with drill-down to see which rounds you practiced and how your scores trended.

**The WOW moment**: Your heatmap shows: green every day for 3 weeks. Heavy green on weekends (more practice). You click on a day: "March 15: 2 system design challenges (avg score: 78), 3 coding problems (avg: 85), 1 behavioral mock (score: 72)." Trend line shows your system design score climbing from 60 to 82 over 3 weeks.

**Why unique**: You ALREADY have streak tracking (`StreakBadge.tsx`, `StreakProtector.tsx`), achievements (`AchievementGrid.tsx`), and progress (`ProgressDashboard.tsx`). The enhancement is the heatmap visualization with cross-round drill-down.

**Effort**: S (heatmap visualization on existing progress tracking)

---

### C.5 -- Spaced Repetition Engine

**One-liner**: Concepts you've learned decay over time. The system automatically resurfaces concepts at optimal intervals to maximize long-term retention.

**The WOW moment**: You learned "Consistent Hashing" 2 weeks ago (scored 90%). The system resurfaces it today with a quick quiz: "In a consistent hash ring with 100 virtual nodes per server, how many keys need to move when adding a new server?" You answer correctly. Next review: 1 month from now. You forget "CAP Theorem" details. The system resurfaces it after just 3 days.

**Why unique**: You ALREADY have `srs.ts` (spaced repetition system). The enhancement is making it cross-round: SRS applies not just to system design concepts but to all 15 round types.

**Effort**: S (extend existing SRS to cover all modules)

---

### C.6 -- Weakness Analyzer

**One-liner**: Based on your practice history, the system identifies your TOP 3 weaknesses and generates a focused improvement plan.

**The WOW moment**: After 50 practice sessions, the analyzer reports: "Weakness 1: Database Indexing (avg score: 55/100 across 8 attempts). You consistently miss composite index opportunities. Weakness 2: Behavioral STAR structure (your 'Result' component is weak in 6/10 stories). Weakness 3: Concurrency -- you've never practiced it (0 sessions)." Each weakness links to the specific features and exercises that target it.

**Why unique**: You ALREADY have `difficulty-adaptation.ts` for adaptive difficulty. The enhancement is cross-round weakness identification. Nobody analyzes your interview preparation gaps across all round types.

**Effort**: M (cross-round performance analysis, weakness classification, improvement plan generation)

---

### C.7 -- Exportable Interview Portfolio

**One-liner**: Export your best work as a shareable portfolio: system design diagrams, code solutions, architecture decisions -- to share with recruiters or review before interviews.

**The WOW moment**: You export: your best system design (URL Shortener, scored 92/100), your parking lot LLD class diagram, your top 3 STAR stories, and your project architecture diagram. It generates a clean PDF or shareable link. You review it on your phone the morning of the interview.

**Why unique**: You ALREADY have extensive export capabilities (PNG, SVG, PDF, Mermaid, etc.). The enhancement is curating your BEST work across rounds into a single portfolio. Nobody creates an interview preparation portfolio.

**Effort**: M (cross-round content curation, portfolio generation)

---

### C.8 -- Multiplayer Mode

**One-liner**: Practice with a friend: system design battles, paired coding, code review exchange, behavioral mock interviews with real humans, not just AI.

**The WOW moment**: You and a friend join a "Design Battle." Same challenge: "Design Twitter in 30 minutes." You both design simultaneously. Time's up. You review each other's designs using the scoring rubric. AI provides additional feedback. Elo ratings update. Your friend scored higher on API design; you scored higher on scalability.

**Why unique**: You ALREADY have `DesignBattle.tsx` and `design-battles.ts` with the battle framework. The enhancement is REAL multiplayer (currently simulated). No platform does real-time competitive system design with human opponents.

**Effort**: XL (WebSocket infrastructure, matchmaking, real-time canvas sync)

---

## SUMMARY TABLE

| Round | Feature Count | Already Have Foundation | Net New Effort |
|---|---|---|---|
| 1. DSA/Coding | 10 | Playback controller, 26+ algos, pattern files | Mix of S/M/L |
| 2. System Design/HLD | 10 | Full simulation engine, cost, what-if, war stories | Mostly S/M |
| 3. LLD/Machine Coding | 10 | 33 problems, code-to-diagram, grading, state machines | Mostly S/M |
| 4. Peer Programming | 10 | RecordButton | Mostly M/L/XL |
| 5. Debugging | 8 | Deadlock demo, race condition | Mostly M |
| 6. Core CS | 9 | OS, DB, Networking modules fully built | Mostly S |
| 7. Backend/API | 7 | API comparison, auth flows, rate limiter | Mostly S/M |
| 8. Database | 7 | B-tree, LSM, MVCC, join, query plan | Mostly S/M |
| 9. Concurrency | 7 | Full concurrency module | Mostly S |
| 10. Testing | 6 | None | Mostly M |
| 11. Code Review | 6 | Design review system | Mostly M |
| 12. Behavioral | 6 | RecordButton | Mostly M |
| 13. Resume Deep Dive | 6 | Canvas, export | Mix of S/M/L |
| 14. DevOps/SRE | 7 | Metrics dashboards, simulation | Mostly M/L |
| 15. Security | 6 | Full security module | Mostly S/M |
| Cross-Cutting | 8 | Knowledge graph, SRS, progress, streaks | Mostly S/M |

**Total: 127 features**

**Effort Distribution:**
- S (Small, 1-3 days): ~45 features -- mostly UI enhancements on existing engines
- M (Medium, 1-2 weeks): ~55 features -- new interaction patterns on existing foundations
- L (Large, 2-4 weeks): ~18 features -- significant new capability
- XL (Extra Large, 1-2 months): ~9 features -- AI integration, real-time multiplayer

**The critical insight**: Your existing codebase (chaos engine, simulation, 33 LLD problems, concurrency primitives, security flows, OS algorithms, database internals, networking protocols) is an ENORMOUS foundation. At least 45 of these 127 features are S-effort because they're visualization or interaction layers on top of engines you've already built. The biggest gap is in Rounds 4 (Peer Programming), 10 (Testing), and 12 (Behavioral), which have minimal existing infrastructure.

**If I had to pick the 10 highest-impact features to build first:**

1. **AlgoFilm** (1.1) -- immediate visual differentiation from every other platform
2. **Incident War Room** (2.4) -- you have 12 war stories ready to become interactive
3. **Machine Code Arena** (3.3) -- live grading on 33 existing LLD problems
4. **AI Pair Partner** (4.1) -- the category nobody has built well
5. **DP Table Builder** (1.3) -- makes DP intuitive, huge market demand
6. **Interview Day Simulator** (C.2) -- nobody simulates the full day
7. **STAR Story Studio** (12.1) -- behavioral prep is universally weak
8. **Transaction Isolation Theater** (6.4) -- you have the engine, just need the viz
9. **PR Forensics** (11.1) -- code review rounds are increasingly common
10. **Attack Lab** (15.1) -- you have the attack data, just make it interactive