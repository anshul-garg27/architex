# AI Integration Strategy for Architex

> Complete strategy for integrating LLM capabilities into the platform.

---

## MODEL SELECTION & COST

| Model | Input/Output per M tokens | Best For |
|---|---|---|
| Claude Haiku 4.5 | $1/$5 | Quick hints, Tier 1-2 nudges, real-time lightweight tasks |
| Claude Sonnet 4.6 | $3/$15 | Design review, generation, interview sim, deep explanations |
| Claude Opus 4.6 | $5/$25 | Only for maximum reasoning (complex edge cases) |
| GPT-4o | $2.50/$10 | Vision analysis of uploaded images, fallback |

**Estimated cost per interview session:** ~$0.02-0.05 (with prompt caching)

---

## 1. AI-POWERED DESIGN REVIEW

### Approach
- Primary path: Send structured text (JSON/Mermaid) + problem statement + rubric to LLM
- Secondary: Vision analysis for uploaded diagrams
- Use Claude Sonnet 4.6 (best price-performance for architecture reasoning)
- **Prompt caching saves ~63%** (reference solution + rubric reusable across users)

### Rubric Dimensions
1. **Completeness** — Are all required components present?
2. **Correctness** — Do data flows make sense?
3. **Scalability** — Are bottlenecks addressed?
4. **Reliability** — Fault tolerance, redundancy?
5. **Trade-off Awareness** — Did user acknowledge alternatives?

### What LLMs Are Good/Bad At
- **Strong:** Missing components, single points of failure, inconsistencies, pattern deviations
- **Weak:** Context-specific design choices, deliberate omissions, business constraints

---

## 2. AI-POWERED HINTS & TUTORING

### Three-Tier Progressive Hint System

**Tier 1 — Nudge (~100 tokens, free):**
"Have you considered what happens when your database reaches 10TB?"

**Tier 2 — Guided Question (~300 tokens, -5 points):**
"For 100K QPS reads, what caching strategy would help? Consider where in the request path..."

**Tier 3 — Explanation (~500 tokens, -10 points):**
"Here is how caching works at this scale..." with link to relevant lesson.

### Socratic Method Design
1. **Elicit:** What does the user think?
2. **Probe:** Why?
3. **Diagnose:** Where is the gap?
4. **Deepen:** What about edge case X?

### Frustration Detection
If 3+ hints on same concept in rapid succession → escalate to direct explanation.

### Model Selection
- Tier 1-2: Claude Haiku 4.5 (fast, cheap)
- Tier 3: Claude Sonnet 4.6 (deeper reasoning)

---

## 3. AI-POWERED GENERATION

### Two-Step Pattern (most reliable)

1. LLM outputs **structured JSON** (nodes + edges + configs)
2. Deterministic renderer converts JSON → Mermaid/diagram

```json
{
  "nodes": [{"id": "...", "label": "...", "type": "service|database|cache|queue"}],
  "edges": [{"from": "...", "to": "...", "protocol": "HTTP|gRPC|async"}]
}
```

This avoids fragile Mermaid syntax errors from direct LLM generation.

### Accuracy Profile
- High: Standard patterns (microservices, 3-tier, data pipelines)
- Medium: Complex multi-service (good starting point)
- Low: Novel/unconventional architectures

### Iterative Refinement
"Add a cache layer between API and database" → LLM modifies JSON → re-render

---

## 4. AI INTERVIEW SIMULATION

### Multi-Phase Interview (45 min)

**Phase 1 — Requirements (5 min):**
AI presents vague problem. User asks clarifying questions. AI evaluates: did they ask about scale, scope, real-time?

**Phase 2 — High-Level Design (15 min):**
User builds diagram. AI asks probing questions mid-design.

**Phase 3 — Deep Dive (15 min):**
AI picks weakest part and digs in with specific questions.

**Phase 4 — Scaling (10 min):**
AI pushes edge cases: "handles 10K rides/day → what changes for 10M?"

### Scoring
Structured output: rubric scores (1-5) per dimension with evidence from conversation.

### Critical: Reference Solution Grounding
AI must have access to reference solution for each problem. Use prompt caching to amortize cost.

### Model Selection
- Interviewer: Claude Sonnet 4.6 (strong reasoning for follow-ups)
- Real-time hints: Haiku 4.5 (if user stuck 60+ seconds)
- Target latency: <2 seconds for follow-up questions

---

## 5. COST OPTIMIZATION

1. **Prompt caching** (saves ~63%): Cache problem statements, rubrics, reference solutions
2. **Batch API** (saves 50%): End-of-session reports, weekly summaries
3. **Tiered routing**: Haiku for simple tasks, Sonnet for complex
4. **Stay under 200K tokens**: Avoid 2× long-context premium

---

## 6. ARCHITECTURE

```
Frontend (React/Next.js)
  ↓
API Layer
  ├── /api/review      → Design Review Service
  ├── /api/hint        → Hint/Tutor Service  
  ├── /api/generate    → Diagram Generation Service
  └── /api/interview   → Interview Simulator Service
  ↓
AI Orchestration Layer
  ├── Model Router (Haiku vs Sonnet)
  ├── Prompt Cache Manager
  ├── Reference Solution Store
  ├── Rubric Store
  └── Conversation State Manager
  ↓
LLM Providers
  ├── Anthropic (Claude Haiku/Sonnet) — primary
  └── OpenAI (GPT-4o vision) — image analysis only
```

---

## IMPLEMENTATION ORDER

1. **Phase 1 — Generation** (lowest risk, highest immediate value)
2. **Phase 2 — Design Review** (builds on Phase 1)
3. **Phase 3 — Hint System** (builds on Phase 2)
4. **Phase 4 — Interview Simulation** (most complex, highest impact)
