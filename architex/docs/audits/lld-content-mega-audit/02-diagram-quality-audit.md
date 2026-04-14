# Agent 2: Diagram Quality Auditor

> **Mission**: Audit every diagram in `diagram_templates` for correctness of UML relationships, class completeness, and Mermaid→JSON consistency.
> **Scope**: `diagram_templates WHERE module_id='lld'` — 69 rows (36 patterns + 33 problems)
> **Status**: ✅ All critical findings fixed

---

## Methodology

1. For each of 69 diagram templates, verified:
   - Relationship types match UML semantics (inheritance, composition, aggregation, association)
   - Cardinalities are semantically correct (1:1, 1:*, *:*)
   - All expected classes are present per pattern definition
   - Mermaid source code matches the parsed JSON (classes[] and relationships[])
   - No dangling references (relationship pointing to non-existent class)

---

## Findings

### CRITICAL: Observer Pattern Diagram Has Wrong Relationship Type

**Severity**: P0 — Observer is the #1 most-asked pattern in interviews

| Field | Current (Wrong) | Correct |
|-------|-----------------|---------|
| `Subject→Observer` type | `association` | `aggregation` |
| `Subject→Observer` sourceCardinality | (missing) | `"1"` |
| `Subject→Observer` targetCardinality | (missing) | `"*"` |

**Why it matters**: Observer is fundamentally about one Subject holding a collection of Observers (aggregation, not plain association). Without the 1:* cardinality, the diagram fails to convey the core concept — that one subject notifies *many* observers.

**UML Reference**: GoF book p.294 — Subject aggregates Observer with 1:* multiplicity.

### HIGH: 14 Relationships Have Incorrect 1:* Cardinality

The enrichment script applied blanket `1:*` cardinality to many relationships that should be `1:1` (wraps-one or has-one semantics):

| Pattern | Relationship | Should Be | Was |
|---------|-------------|-----------|-----|
| `adapter` | Adapter→Adaptee | 1:1 | 1:* |
| `bridge` | Abstraction→Implementor | 1:1 | 1:* |
| `strategy` | Context→Strategy | 1:1 | 1:* |
| `state` | Context→State | 1:1 | 1:* |
| `decorator` | BaseDecorator→Component | 1:1 | 1:* |
| `facade` | Facade→SubsystemA | 1:1 | 1:* |
| `facade` | Facade→SubsystemB | 1:1 | 1:* |
| `facade` | Facade→SubsystemC | 1:1 | 1:* |
| `circuit-breaker` | CircuitBreaker→Config | 1:1 | 1:* |
| `bulkhead` | Partition→Semaphore | 1:1 | 1:* |
| `retry` | RetryPolicy→BackoffStrategy | 1:1 | 1:* |
| `tool-use` | Agent→ToolRegistry | 1:1 | 1:* |
| `react-pattern` | Agent→ToolRegistry | 1:1 | 1:* |
| `multi-agent-orchestration` | Orchestrator→Memory | 1:1 | 1:* |

**Semantic rule**: If a class *wraps*, *holds a reference to*, or *delegates to* exactly one instance of another class, the cardinality is 1:1. Only use 1:* when the class manages a *collection* (Observer→subscribers, Composite→children, Factory→products).

### MEDIUM: Mermaid↔JSON Drift in 4 Templates

Minor drift where Mermaid source and parsed JSON arrays had slightly different relationship labels. Not user-visible (canvas renders from JSON), but could cause issues in the Mermaid editor.

---

## Fix Applied

**Seed script**: `src/db/seeds/fix-cardinalities.ts`
**Commit**: `01d90a7`

- Observer: changed `association`→`aggregation`, added `sourceCardinality: "1"`, `targetCardinality: "*"`
- 14 relationships: changed `targetCardinality` from `"*"` to `"1"`
- Total: 15 diagram template rows updated
