# Agent 5: Cardinality Auditor

> **Mission**: Verify that every UML relationship in diagram_templates has semantically correct cardinality (1:1, 1:*, *:*).
> **Scope**: All relationships across 69 diagram templates (36 patterns + 33 problems)
> **Status**: ✅ All findings fixed

---

## Methodology

1. Extracted all `relationships[]` arrays from 69 diagram templates
2. For each relationship, classified the semantic type:
   - **has-many**: Subject→Observer[], Composite→children[], Factory→products[] → should be 1:*
   - **wraps-one**: Decorator→Component, Adapter→Adaptee, Proxy→RealSubject → should be 1:1
   - **has-one**: Context→Strategy, Context→State, Bridge→Implementor → should be 1:1
   - **creates**: Factory→Product → no cardinality needed (dependency)
   - **extends**: Subclass→Superclass → no cardinality needed (inheritance)
3. Compared semantic expectation against actual values in DB

---

## Findings

### HIGH: 14 Wraps-One/Has-One Relationships Incorrectly Marked as 1:*

The original cardinality enrichment script (`enrich-cardinality.ts`) applied `1:*` as a default to many relationships that should be `1:1`. The script did not distinguish between:
- **Aggregation** (1:*) — one object holds a collection of another
- **Delegation** (1:1) — one object holds a single reference to another

| Pattern | Source Class | Target Class | Semantic Type | Was | Should Be |
|---------|-------------|-------------|---------------|-----|-----------|
| adapter | Adapter | Adaptee | wraps-one | 1:* | 1:1 |
| bridge | Abstraction | Implementor | has-one (delegator) | 1:* | 1:1 |
| strategy | Context | Strategy | has-one (pluggable) | 1:* | 1:1 |
| state | Context | State | has-one (mutable) | 1:* | 1:1 |
| decorator | BaseDecorator | Component | wraps-one | 1:* | 1:1 |
| facade | Facade | SubsystemA | has-one (delegator) | 1:* | 1:1 |
| facade | Facade | SubsystemB | has-one (delegator) | 1:* | 1:1 |
| facade | Facade | SubsystemC | has-one (delegator) | 1:* | 1:1 |
| circuit-breaker | CircuitBreaker | Config | has-one (config) | 1:* | 1:1 |
| bulkhead | Partition | Semaphore | has-one (resource) | 1:* | 1:1 |
| retry | RetryPolicy | BackoffStrategy | has-one (pluggable) | 1:* | 1:1 |
| tool-use | Agent | ToolRegistry | has-one (registry) | 1:* | 1:1 |
| react-pattern | Agent | ToolRegistry | has-one (registry) | 1:* | 1:1 |
| multi-agent | Orchestrator | Memory | has-one (shared) | 1:* | 1:1 |

### Correct 1:* Relationships (Not Changed)

These were correctly marked as 1:* and were NOT flagged:

| Pattern | Source | Target | Why 1:* is Correct |
|---------|--------|--------|-------------------|
| observer | Subject | Observer | Subject manages a LIST of observers |
| composite | Composite | Component | Composite holds a LIST of children |
| mediator | Mediator | Colleague | Mediator manages MULTIPLE colleagues |
| command | Invoker | Command | Invoker can queue MULTIPLE commands |
| iterator | Collection | Element | Collection holds MANY elements |

---

## Decision Framework for Future Cardinalities

```
Is the relationship "holds a collection"?
  YES → 1:*    (Observer→subscribers, Composite→children)
  NO  → 
    Is it "wraps" or "delegates to exactly one"?
      YES → 1:1  (Adapter→Adaptee, Strategy→ConcreteStrategy)
      NO  →
        Is it inheritance or implements?
          YES → No cardinality (UML convention)
          NO  → Evaluate case-by-case
```

---

## Fix Applied

**Seed script**: `src/db/seeds/fix-cardinalities.ts`
**Commit**: `01d90a7`

- Changed `targetCardinality` from `"*"` to `"1"` for all 14 relationships
- Set `sourceCardinality` to `"1"` for all 14 relationships
- Total: 13 diagram template rows updated (facade had 3 relationships in one row)
