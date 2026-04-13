# Content Style Guide

All pattern descriptions, SOLID demos, and LLD problems in Architex MUST follow
the structure below. The goal is **teaching**, not reference. Students should
feel a problem before they see a solution.

---

## Required Section Order

Every piece of content flows through six stages:

### 1. Hook (2-3 sentences)

Open with a concrete, relatable **problem**. Use second person ("you").
Reference a real app or scenario the student already knows.

**Template:**

> You're building [concrete app]. [Specific problem arises]. How do you solve it
> without [bad approach]?

**Example (Observer):**

> You're building a stock-trading app. When a stock price changes, the dashboard,
> notifications, and portfolio ALL need to update. Do you check every component
> manually?

### 2. Analogy (2-3 sentences)

Map the pattern to an everyday object or experience. Use concrete nouns
(newspaper, restaurant, GPS), not abstract terms. The analogy should map
cleanly to the pattern's key participants.

**Template:**

> Think of [everyday thing]. [How it works]. [Connection to the pattern].

**Example (Observer):**

> Think of a newspaper subscription. The newspaper publishes, subscribers
> receive. No subscriber knows about others. Adding a new subscriber requires
> zero changes to the newspaper.

### 3. UML Diagram

Show the structure visually. Keep it focused -- no more than 6-8 classes in a
single diagram. Use Mermaid or the built-in class diagram renderer.

### 4. Code (working example)

Provide a concise, runnable code sample that demonstrates the pattern. Prefer
TypeScript. Keep it under 40 lines if possible. Annotate with comments
explaining key decisions.

### 5. Tradeoffs (You gain / You pay)

Explain what the student gains and what they pay. Use the explicit
"You gain / You pay" structure.

**Template:**

> **You gain:** [concrete benefit -- decoupling, extensibility, testability].
> **You pay:** [concrete cost -- indirection, complexity, memory, debugging
> difficulty].

**Example (Observer):**

> **You gain:** Adding new observers without touching existing code.
> **You pay:** Debugging is harder because you can't see the call chain --
> events are implicit, not explicit.

### 6. Summary (exactly 3 bullets)

Flashcard-sized takeaways. Each bullet is under 15 words. Follow this
structure:

1. **What it is** -- one-sentence definition
2. **Key insight** -- the aha moment
3. **When to use** -- one trigger sentence

**Example (Observer):**

> - Observer = subscribe to changes, get notified automatically
> - Key insight: subject and observers don't know about each other (loose coupling)
> - Use when: one change should trigger multiple independent reactions

---

## Anti-Patterns

These are things to **never** do when writing content:

1. **Never start with a GoF definition.** "Defines a one-to-many dependency..."
   is a reference sentence, not a teaching sentence. Lead with the hook.
2. **Never show UML before explaining why.** The student must understand the
   problem before seeing the solution's structure.
3. **Never use abstract jargon without grounding it.** "Decoupling" alone means
   nothing -- say "adding a new observer requires zero changes to existing code."
4. **Never skip the tradeoffs.** Every pattern has a cost. Omitting it makes the
   student think patterns are free, which leads to overuse.
5. **Never write analogies with abstract nouns.** "Think of loose coupling" is
   not an analogy. "Think of a newspaper subscription" is.
6. **Never exceed 15 words per summary bullet.** If it doesn't fit on a
   flashcard, it's too long.

---

## New Content PR Checklist

Before merging any PR that adds or modifies a pattern, demo, or problem,
verify every item:

- [ ] **Hook present?** Description opens with a concrete problem scenario, NOT
  a definition.
- [ ] **Second person?** Hook uses "you" / "you're building."
- [ ] **Analogy present?** Real-world analogy with concrete nouns appears before
  the UML diagram.
- [ ] **Analogy maps to participants?** Each analogy noun maps to a class or
  role in the pattern.
- [ ] **UML diagram included?** Class or sequence diagram is present and
  accurate.
- [ ] **Code sample present?** Working, annotated code under 40 lines.
- [ ] **Tradeoffs present?** Explicit "You gain / You pay" section included.
- [ ] **Summary present?** Exactly 3 bullets, each under 15 words.
- [ ] **No GoF-first opening?** The first sentence is NOT a textbook definition.
- [ ] **No UML-before-why?** Diagram appears AFTER the hook and analogy.
- [ ] **Real-world mention?** At least one reference to a real app, framework,
  or company the student already knows.

---

## Quick Reference: Section Order

```
Hook --> Analogy --> UML Diagram --> Code --> Tradeoffs --> Summary
```

Every pattern. Every demo. Every problem. No exceptions.
