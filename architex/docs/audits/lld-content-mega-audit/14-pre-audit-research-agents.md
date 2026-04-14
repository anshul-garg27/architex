# Pre-Audit Research Agents (3 Opus Agents)

> These 3 agents ran BEFORE the 10-agent content audit. They designed the LLD "world best" architecture that guided all subsequent work.
> **Output**: `docs/plans/2026-04-14-lld-world-best-design.md`

---

## Agent A: UX Researcher

**Mission**: Design the context-aware bottom panel system — what tabs appear for each mode, how content adapts to the selected item.

### Key Decisions:
1. **Tabs are computed, not configured**: `f(mode, selectedItem) → Tab[]`
2. **5 modes with distinct tab sets**: Pattern (6 tabs), SOLID (5), Problem (5), Sequence (4), State Machine (4)
3. **Features moved OUT of tabs**: Flashcards → floating widget, Study Plan → dedicated page, Progress Map → sidebar
4. **Auto-open intelligence**: First visit → Explain tab; Return visit → Quiz tab

### Deliverable:
Complete tab specification for all 5 modes with content sources, data requirements, and UI behavior.

---

## Agent B: Content Strategist

**Mission**: Define the content model — what new content types are needed, how they fit in the database, quality standards.

### Key Decisions:
1. **7 new content types** fitting in existing `module_content` + `quiz_questions` tables:
   - Pattern Walkthroughs (~200 steps)
   - Problem Guides (~660 items)
   - Interview Q&A Bank (~260 items)
   - 6 new Quiz Types (~561 items)
   - Anti-Patterns (~90 items)
   - Production Code Examples (~108 items)
   - Pattern Evolution (~144 configs)
2. **Zero new DB tables needed** — all fit in existing schema
3. **Total content estimate**: ~1,400 items, ~285K words

### Quality Standards:
- Model answers: 200-400 words with real-world examples
- Walkthroughs: 5-7 steps per pattern with UML highlighting
- Problem guides: Progressive hints gated by time

---

## Agent C: Tech Architect

**Mission**: Design the technical architecture — FSRS-5, PostgreSQL search, AI explainer, learning path DAG.

### Key Decisions:
1. **FSRS-5** over SM-2: Modern algorithm (2023), better calibration, handles variable intervals
2. **PostgreSQL ILIKE** over full-text search (initially): Simpler, sufficient for <1K rows
3. **Claude Sonnet 4.6** for AI analysis: Best cost/quality ratio for diagram analysis
4. **Kahn's algorithm** for prerequisites: Simple, deterministic, detects cycles
5. **Heuristic fallback** for AI: When no API key, detect patterns structurally

### Architecture:
```
FSRS-5 Engine (src/lib/fsrs.ts) — pure function
    ↓
Review API (POST /api/review) — update FSRS state
    ↓
Review Hooks (useReviewSession) — queue-based UI
    ↓
ReviewWidget — 4 rating buttons (Again/Hard/Good/Easy)

PostgreSQL Search (GET /api/search) — ILIKE with ranking
    ↓
SidebarSearch — integrated in LLD sidebar

AI Explainer (POST /api/ai/explain) — Claude Sonnet
    ↓
AIReviewPanel — floating overlay on canvas

Prerequisites DAG (28 edges, Kahn's sort)
    ↓
Learning Path API (GET /api/learning-path)
    ↓
LearningPathMap — 4-column sidebar grid
```

---

## Combined Impact

These 3 research agents produced the unified design document (`2026-04-14-lld-world-best-design.md`) that guided:
- 11 Opus execution agents building features
- 10 Opus audit agents verifying quality
- 3 Opus fix agents addressing findings
- Total: ~24 agent invocations across the session
