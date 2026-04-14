# Agent 9: Competitor Gap Auditor

> **Mission**: Compare Architex LLD module against top competitors and identify gaps that prevent A++++ status.
> **Scope**: Feature-by-feature comparison against Refactoring Guru, DesignPatterns.dev, PaperDraw, LeetCode Design, System Design Primer
> **Status**: Findings documented, some addressed by other agents

---

## Methodology

1. Compared feature matrix against 5 competitors:
   - **Refactoring Guru** — Pattern articles + code examples (11 languages)
   - **DesignPatterns.dev** — Interactive pattern catalog
   - **PaperDraw** — AI-powered diagram tool (741 topology rules)
   - **LeetCode Design** — OOD interview problems
   - **System Design Primer** — Open-source study guide
2. Identified features present in competitors but missing in Architex
3. Prioritized by interview impact

---

## Findings

### CRITICAL: No Java Code Generation

**Severity**: P0 for interview prep

~60% of LLD/OOD interviews are conducted in Java. Architex only provides TypeScript code samples. Every major competitor offers Java:
- Refactoring Guru: 11 languages including Java
- DesignPatterns.dev: Java + TypeScript
- LeetCode: Java, Python, C++

**Recommendation**: Generate Java implementations for all 36 patterns. Can be AI-generated from TypeScript with manual review.

**Estimated effort**: 1 day (AI-assisted generation + review)

### CRITICAL: No Interactive Walkthrough Checkpoints

**Severity**: P0 for engagement

Brilliant.org style: learners complete micro-challenges between walkthrough steps. Current WalkthroughPlayer is passive (read-only steps). No checkpoint means no active learning during walkthroughs.

| Feature | Brilliant.org | Architex |
|---------|-------------|----------|
| Step-by-step content | ✅ | ✅ |
| Interactive checkpoints | ✅ | ❌ |
| Progress tracking | ✅ | ✅ (FSRS) |
| Visual feedback | ✅ | Partial |

**Recommendation**: Add 1-2 checkpoint questions per walkthrough (e.g., "Which class should hold the reference?" with clickable UML elements).

### HIGH: "Coming Soon" Placeholders Unfilled

3 features show "Coming Soon" but are never implemented:

| Feature | Location | What's Missing |
|---------|----------|---------------|
| SOLID Violation Spotter | SOLID mode tab 3 | Interactive exercise to spot violations in code |
| Problem Interview Mode | Problem mode tab 5 | Timed, blank canvas with auto-grading |
| Pattern Comparison (expanded) | Pattern mode tab 4 | Only 3 comparisons exist, need 11+ |

### HIGH: No Rubric-Based Auto-Grading

LeetCode and InterviewBit provide instant feedback on OOD solutions. Architex has no grading mechanism for problem submissions.

**What competitors do**:
- Check if required classes exist
- Verify relationships between key classes
- Score pattern usage
- Flag missing requirements

**Recommendation**: Rule-based grading using the diagram on canvas. Compare user's classes/relationships against the reference solution stored in `diagram_templates`.

### HIGH: No Pattern Relationship Graph

Refactoring Guru shows a visual graph of how patterns relate to each other. Architex has the data (`relatedPatterns`, `confusedWith`, `prerequisites`) but no visualization.

**Recommendation**: D3 or ReactFlow force-directed graph showing:
- Prerequisites (→ arrows)
- ConfusedWith (⟺ dotted lines)
- RelatedPatterns (— solid lines)

### MEDIUM: No Company Tags on Problems

LeetCode tags every problem with companies that ask it (Google, Amazon, Meta). This is a top-requested feature for interview prep.

**Recommendation**: Add `companyTags: string[]` to problem content. Seed with publicly available data.

### MEDIUM: Missing OOP Demos

Only 2 OOP demos exist (Polymorphism, Inheritance). Missing:
- Encapsulation demo
- Abstraction demo

These are fundamental and should be present for completeness.

### LOW: Traffic Light State Machine Too Simple

The state machine example has only 3 states (Red, Yellow, Green) with no error paths, pedestrian crossings, or sensor inputs. Not representative of real-world complexity.

---

## Architex Unique Advantages (Not in Any Competitor)

| Feature | Architex | Competitors |
|---------|----------|-------------|
| Context-aware tabs | ✅ | ❌ |
| FSRS spaced repetition | ✅ | ❌ |
| AI pattern analysis | ✅ | PaperDraw only |
| Mermaid DSL editor | ✅ | ❌ |
| Adaptive quiz difficulty | ✅ | ❌ |
| Learning path DAG | ✅ | ❌ |
| Bidirectional code↔diagram | ✅ | PaperDraw partial |

**Key insight**: Architex's differentiation is in the *integration* of all these features. No competitor offers UML + code + quizzes + spaced repetition + AI feedback in one contextual experience. The gaps are mostly in *breadth of content*, not in *depth of features*.
