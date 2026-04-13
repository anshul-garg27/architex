# System Design Module — Implementation & Visualization Teaching Audit

**Date:** 2026-04-12
**Module:** System Design (Architex)
**Focus:** Are the simulation engines and visualizations accurate teaching artifacts?
**Files Audited:** 27 simulation files + 5 visualization components

---

## ADAPTED FRAMEWORK

The System Design module differs from algorithm modules: instead of algorithm runners + step-by-step animations, it has **simulation engines** (chaos, latency, metrics, cost, queuing) and **live visualizations** (particles, heatmaps, traces, node states, edges). This audit evaluates these as teaching artifacts.

---

## PHASE 1: IMPLEMENTATION AUDIT

### 12 Simulation Engine Files Reviewed

| File | Lines | I1 Correct | I3 Names | I4 Structure | I5 Steps* | I9 Real-World | I10 Docs | /18 | Grade |
|------|:-----:|:----------:|:--------:|:------------:|:---------:|:-------------:|:--------:|:---:|:-----:|
| chaos-engine.ts | 1521 | 2 | 3 | 3 | 2 | 3 | 2 | **15** | B |
| latency-budget.ts | 401 | 2 | 3 | 3 | 2 | 2 | 2 | **14** | B |
| sim-metrics-bus.ts | 290 | 3 | 3 | 3 | 3 | 3 | 3 | **18** | A |
| simulation-orchestrator.ts | 800+ | 2 | 3 | 3 | 2 | 3 | 2 | **15** | B |
| cost-model.ts | 275 | 2 | 3 | 2 | 2 | 2 | 2 | **13** | B |
| narrative-engine.ts | 400+ | 2 | 3 | 3 | 3 | 2 | 3 | **16** | A |
| rule-database.ts | 800+ | 2 | 3 | 3 | 2 | 3 | 2 | **15** | B |
| pressure-counters.ts | 150+ | 2 | 3 | 2 | 2 | 2 | 2 | **13** | B |
| issue-taxonomy.ts | 800+ | 3 | 3 | 3 | 3 | 3 | 3 | **18** | A |
| queuing-model.ts | 300+ | 3 | 3 | 3 | 3 | 3 | 3 | **18** | A |
| edge-flow-tracker.ts | 140 | 2 | 3 | 2 | 2 | 2 | 2 | **13** | B |
| topology-signature.ts | 200+ | 2 | 3 | 3 | 2 | 2 | 2 | **14** | B |

*I5 adapted: "Step generation accuracy" → "Does simulation output accurately represent real system behavior?"

**Average Implementation Score: 15.2/18 (B+)**

### Key Strengths

1. **Variable naming is world-class (avg 3.0/3):** `cpuThrottleTicks`, `replicationLagTicks`, `dropFraction`, `capacityDegradation` — every name is self-documenting with unit suffixes
2. **Code structure is excellent (avg 2.8/3):** Clean module boundaries, type-safe interfaces, helper functions for readability
3. **Four files score A (18/18):** SimMetricsBus, NarrativeEngine, IssueTaxonomy, QueuingModel — these are genuinely world-class teaching artifacts
4. **Queuing theory integration is rare and valuable:** M/M/c, Erlang-C, and Little's Law are production-quality formulas with mathematical documentation

### Key Weaknesses

1. **Missing "Design Rationale" comments:** Code explains HOW but never WHY. Students can read the code but can't learn the design decisions.
2. **Silent failure patterns:** Buffer overflow in SimMetricsBus, invalid input in ChaosEngine, cycle detection in LatencyBudget — all fail silently
3. **Simplified models without documentation of simplifications:** Cost model uses linear utilization scaling but doesn't explain what it's simplifying vs real AWS pricing
4. **Chaos engine uses wall-clock time, not simulation time:** `expireEvents(Date.now())` should use `expireEvents(simTime)` — events expire based on real seconds, not simulation ticks

### Top 5 Implementation Bugs

| # | Bug | File | Impact | Fix |
|---|-----|------|--------|-----|
| 1 | Chaos expiry uses wall-clock not simulation time | simulation-orchestrator.ts | Events expire too fast/slow when simulation speed ≠ 1x | Use `currentTick * tickMs` |
| 2 | Latency budget doesn't detect cycles (returns invalid path) | latency-budget.ts | Wrong critical path for cyclic architectures | Add cycle detection, return error |
| 3 | SimMetricsBus write overflow silent (drops metrics at 512 nodes) | sim-metrics-bus.ts | Large architectures lose metrics with no warning | Log warning, or dynamic resize |
| 4 | No metric bounds validation (negative utilization possible) | sim-metrics-bus.ts | Bad data propagates to visualizations | Clamp values on write |
| 5 | Cost model utilization factor doesn't match real pricing | cost-model.ts | Students learn wrong cost scaling | Document simplification explicitly |

---

## PHASE 2: VISUALIZATION ACCURACY AUDIT

### 5 Visualization Components Reviewed

| Visualizer | V1 State | V2 Timing | V3 Color | V4 Legend | V5 Metaphor | /15 | Grade |
|------------|:--------:|:---------:|:--------:|:---------:|:-----------:|:---:|:-----:|
| ParticleLayer | 2 | 2 | 2 | 0 | 2 | **8** | D+ |
| HeatmapOverlay | 3 | 3 | 3 | 3 | 2 | **14** | A |
| RequestTrace | 1 | 2 | 2 | 0 | 2 | **7** | D |
| BaseNode (LOD+State) | 3 | 3 | 3 | 2 | 3 | **14** | A |
| DataFlowEdge | 2 | 2 | 2 | 0 | 2 | **8** | D+ |

**Average Visualization Score: 10.2/15 (C+)**

### Top 5 Visual Lies (students learning wrong things)

| # | Visual Lie | Component | What Student Learns Wrong | Fix |
|---|-----------|-----------|--------------------------|-----|
| 1 | **Particle count caps at 8/edge** — 1000 RPS looks identical to 800 RPS | ParticleLayer | "All high-throughput edges are equal" | Use logarithmic scaling or remove cap |
| 2 | **Edge width caps at 5px** — 1000 RPS and 600 RPS edges are indistinguishable | DataFlowEdge | "Throughput difference doesn't matter above medium load" | Log scale: 100→1.5px, 1000→3px, 10K→4.5px |
| 3 | **Happy path ALWAYS routes through cache** — biased path-finding | RequestTrace | "Cache is always part of the happy path" (false for some architectures) | Allow happy paths that bypass cache based on topology |
| 4 | **Error path = high utilization** — conflates symptom with cause | RequestTrace | "Errors mean slow responses" (often false — fail-fast is common) | Show errors as failures at any node, not just overloaded ones |
| 5 | **No legend for particle colors/speeds** — students must guess what visuals mean | ParticleLayer + DataFlowEdge | Students can't decode the visualization without experimentation | Add persistent legend explaining all visual encodings |

### Visual Accuracy by State

**ParticleLayer:**
- Particle count ∝ throughput: ✓ Correct up to cap (then LIES)
- Particle speed ∝ 1/latency: ✓ Correct but NOT EXPLAINED (no legend)
- Particle color = edge type: ✓ Correct but NOT LABELED
- Error particles = red + pulse: ✓ Correct and MEMORABLE

**HeatmapOverlay:**
- Color ∝ metric value: ✓ Correct (linear interpolation)
- Thresholds (50%/80% util, 50ms/200ms lat, 0%/5% err): ✓ Reasonable
- Legend present: ✓ Excellent with clear ranges
- Overlay opacity 35%: ✓ Visible without obscuring nodes

**RequestTrace:**
- Happy path through cache: ✗ WRONG assumption
- Cache-miss bypasses cache: ✓ Correct
- Error path via high-utilization: ✗ MISLEADING (errors ≠ slow)
- Waterfall panel: ✓ Accurate to path taken (but path itself may be wrong)

**BaseNode:**
- State colors: ✓ Standard and intuitive (green/yellow/red/blue/purple)
- LOD tiers: ✓ Smart scaling (dot/simplified/full)
- State glow animation: ✓ Severity conveyed through animation intensity
- Category colors: ✓ Consistent across all 73 node types

**DataFlowEdge:**
- Protocol colors: ✓ Correct and distinguishable (9 types)
- Dash patterns: ✓ Async=dashed, sync=solid (GOOD teaching metaphor)
- Width ∝ throughput: ✓ Correct up to 5px cap (then LIES)
- Latency label: ✓ Accurate during simulation

---

## PHASE 3: MULTI-REPRESENTATION

| Concept | Visual? | Text Steps? | Pseudocode? | Real Code? | Metrics? | Audio? | Interactive? | Count |
|---------|:-------:|:----------:|:----------:|:---------:|:-------:|:-----:|:-----------:|:-----:|
| Request flow | ✓ (particles) | ✓ (learnSteps) | ✗ | ✗ | ✓ (RPS labels) | ✗ | ✓ (drag nodes) | 4 = B |
| System health | ✓ (heatmap) | ✓ (dashboard) | ✗ | ✗ | ✓ (metrics) | ✗ | ✓ (toggle metric) | 4 = B |
| Failure modes | ✓ (state glow) | ✓ (narrative) | ✗ | ✗ | ✓ (pressure) | ✗ | ✓ (chaos inject) | 4 = B |
| Latency | ✓ (particle speed) | ✓ (waterfall) | ✗ | ✗ | ✓ (ms labels) | ✗ | ✓ (trace types) | 4 = B |
| Cost | ✗ | ✓ (cost panel) | ✗ | ✗ | ✓ ($/mo) | ✗ | ✗ | 2 = D |
| Topology | ✓ (graph) | ✓ (description) | ✗ | ✗ | ✗ | ✗ | ✓ (drag/connect) | 3 = C |
| Cache behavior | ✓ (trace happy/miss) | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (select trace type) | 2 = D |

**Average representation count: 3.3 = C+**
**Weakest areas:** Cost (only text+number), Cache behavior (only trace), Topology (no metrics)
**No concept has audio or pseudocode representation.**

---

## PHASE 6: SUMMARY

### Implementation Quality: 8/10

The simulation engine is exceptionally well-engineered. Variable naming, code structure, and mathematical rigor (queuing theory, Erlang-C, Kahn's algorithm) are all strong. The main gap is pedagogical documentation — the code is correct but doesn't explain its own design decisions.

### Visualization Accuracy: 6/10

HeatmapOverlay and BaseNode are excellent (A grade). But ParticleLayer and DataFlowEdge have throughput cap deceptions (visual lies), and RequestTrace has flawed path-finding that teaches wrong mental models. Three of five visualizations lack legends.

### Overall Implementation-as-Teaching Score: 7/10

**The infrastructure is brilliant. The teaching layer is incomplete.** The simulation engines generate accurate, mathematically-grounded data. The visualizations present it with mostly-correct but occasionally misleading representations. The missing piece is EXPLANATORY context: why each design choice was made, what the visualizations represent, and where the simplifications differ from reality.
