# Monolithic Architecture

## What Is a Monolith?

A monolithic architecture packages **all application functionality into a single
deployable unit**. The UI, business logic, data access layer, and background jobs
all live in one codebase, share one process, and deploy together.

```
┌─────────────────────────────────────────────────────────┐
│                   MONOLITHIC APPLICATION                 │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │     UI      │  │   Admin     │  │   API       │     │
│  │   Layer     │  │   Panel     │  │  Endpoints  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                │                │             │
│         v                v                v             │
│  ┌──────────────────────────────────────────────────┐   │
│  │              BUSINESS LOGIC LAYER                │   │
│  │                                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │   │
│  │  │  Users   │  │  Orders  │  │  Inventory   │   │   │
│  │  │  Module  │  │  Module  │  │   Module     │   │   │
│  │  └──────────┘  └──────────┘  └──────────────┘   │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────v───────────────────────────┐   │
│  │              DATA ACCESS LAYER (ORM)             │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │
                ┌─────────v─────────┐
                │   Single Database │
                │   (PostgreSQL)    │
                └───────────────────┘
```

**Key trait:** everything runs in a single process. A method call from the Orders
module to the Users module is an **in-process function call** -- no network hop.

---

## Pros

| Advantage             | Why It Matters                                       |
|-----------------------|------------------------------------------------------|
| **Simple development**    | One repo, one build, one IDE project                 |
| **Easy testing**          | Spin up the app, run integration tests end-to-end    |
| **Simple deployment**     | One artifact (WAR, JAR, binary, container image)     |
| **Low latency**           | In-process calls are nanoseconds, not milliseconds   |
| **Easy debugging**        | Single stack trace, one log stream, one debugger     |
| **ACID transactions**     | Single DB = straightforward transactional integrity  |
| **No network failures**   | Modules never face timeouts or partial failures      |
| **Low operational cost**  | One server, one health check, one deployment pipeline|

---

## Cons

| Disadvantage                | Detail                                              |
|-----------------------------|-----------------------------------------------------|
| **Scaling is all-or-nothing**   | Cannot scale only the hot path; must scale entire app |
| **Deployment coupling**        | One-line fix redeploys everything, risks regressions  |
| **Tech stack lock-in**         | Every module shares the same language and framework   |
| **Team bottlenecks**           | 20 devs touching one codebase = merge conflicts       |
| **Slow CI/CD**                 | Build time grows linearly with codebase size          |
| **Reliability risk**           | One memory leak crashes the entire application        |
| **Long startup time**          | Larger apps can take minutes to boot                  |

### The Big Ball of Mud

Without discipline, a monolith degrades into a "Big Ball of Mud" -- every module
knows about every other module, boundaries dissolve, and changes ripple
unpredictably.

```
  Before (structured)           After (ball of mud)

  ┌───┐  ┌───┐  ┌───┐         ┌───┐──┌───┐──┌───┐
  │ A │─>│ B │─>│ C │         │ A │<>│ B │<>│ C │
  └───┘  └───┘  └───┘         └─┬─┘──└─┬─┘──└─┬─┘
                                 │ \  / │ \  / │
                                 v  \/  v  \/  v
                               ┌───┐──┌───┐──┌───┐
                               │ D │<>│ E │<>│ F │
                               └───┘──└───┘──└───┘
```

---

## The Modular Monolith: Best of Both Worlds

A **modular monolith** keeps the single deployment unit but enforces strict
module boundaries internally. Each module owns its data, exposes a public API,
and hides its internals.

```
┌──────────────────────────────────────────────────┐
│               MODULAR MONOLITH                   │
│                                                  │
│  ┌──────────────┐   ┌──────────────┐             │
│  │   Orders     │   │   Payments   │             │
│  │ ┌──────────┐ │   │ ┌──────────┐ │             │
│  │ │ Public   │ │──>│ │ Public   │ │             │
│  │ │ API      │ │   │ │ API      │ │             │
│  │ └──────────┘ │   │ └──────────┘ │             │
│  │ ┌──────────┐ │   │ ┌──────────┐ │             │
│  │ │ Internal │ │   │ │ Internal │ │             │
│  │ │ Logic    │ │   │ │ Logic    │ │             │
│  │ └──────────┘ │   │ └──────────┘ │             │
│  │ ┌──────────┐ │   │ ┌──────────┐ │             │
│  │ │ Own Data │ │   │ │ Own Data │ │             │
│  │ │ (schema) │ │   │ │ (schema) │ │             │
│  │ └──────────┘ │   │ └──────────┘ │             │
│  └──────────────┘   └──────────────┘             │
│                                                  │
│           Single Deployment Unit                 │
└──────────────────────────────────────────────────┘
```

**Rules for a modular monolith:**
1. Modules communicate only through **well-defined interfaces** (no reaching into another module's internals).
2. Each module owns a **separate database schema** (or separate tables with no cross-module JOINs).
3. Enforce boundaries with **compile-time checks** (packages, visibility modifiers, ArchUnit tests).
4. Internal module classes are **package-private**, not public.

**Why this matters:** Shopify's modular monolith ("componentized monolith")
handles billions of dollars in transactions. They get monolith simplicity with
clear team ownership.

---

## When to Use a Monolith

```
  USE A MONOLITH WHEN:                    RECONSIDER WHEN:

  [x] Team < 10 engineers                 [ ] 50+ engineers across 8+ teams
  [x] Early-stage startup / MVP           [ ] Need to scale parts independently
  [x] Simple, well-understood domain      [ ] Teams need full autonomy
  [x] Speed-to-market is priority         [ ] Different components need
  [x] Budget is tight (one server)            different tech stacks
  [x] You want ACID transactions easily   [ ] Deploy frequency > 10x/day
```

### Martin Fowler's Advice

> "Almost all the successful microservice stories have started with a monolith
> that got too big and was broken up."
>  -- Martin Fowler, "Monolith First"

Start monolithic. Break apart only when you feel real pain.

---

## Real-World Examples

### Basecamp (Hey.com)
- 20+ years as a monolith on Ruby on Rails
- Serves millions of users from a single deployable app
- DHH (creator of Rails) is an outspoken monolith advocate
- Their philosophy: "Majestic Monolith" -- large but well-structured

### Early Shopify (2006-2016)
- Single Ruby on Rails monolith for the first 10 years
- Scaled to handle Black Friday traffic spikes
- Eventually evolved to a **modular monolith** (not microservices)
- Used "componentization" -- internal modules with enforced boundaries

### Stack Overflow
- Famously runs on a monolith: 2 web servers handle ~1.3 billion page views/month
- Performance comes from aggressive caching and careful optimization
- Proves that a well-tuned monolith can handle enormous scale

---

## Scaling a Monolith

Even monoliths can scale significantly before you need to break them apart:

```
  Level 1: Vertical Scaling          Level 2: Horizontal Scaling
  ┌────────────────┐                 ┌──────────────┐
  │   Bigger       │                 │ Load Balancer │
  │   Server       │                 └──────┬───────┘
  │   (more CPU,   │                   ┌────┼────┐
  │    RAM, SSD)   │                   v    v    v
  └────────────────┘                 ┌──┐ ┌──┐ ┌──┐
                                     │M1│ │M2│ │M3│  (stateless copies)
                                     └┬─┘ └┬─┘ └┬─┘
                                      └────┼────┘
  Level 3: Read Replicas                   v
  ┌──────────┐  ┌──────────┐        ┌──────────┐
  │  Primary  │─>│ Replica  │        │ Shared   │
  │    DB     │─>│ Replica  │        │ Database │
  └──────────┘  └──────────┘        └──────────┘
```

---

## Interview Tips

**Q: "Why not start with microservices?"**
A: Premature decomposition is worse than a monolith. You don't know the right
service boundaries until you understand the domain. Getting boundaries wrong
creates a distributed monolith -- the worst of both worlds.

**Q: "How do you prevent a monolith from becoming a Big Ball of Mud?"**
A: Enforce module boundaries with package-private visibility, ban cross-module
database JOINs, use ArchUnit or similar tools for compile-time boundary checks,
and establish code ownership (CODEOWNERS file).

**Q: "When should you break the monolith?"**
A: When you experience at least two of: (1) deployment contention between teams,
(2) scaling bottlenecks in specific modules, (3) team coordination overhead
exceeding development time, (4) need for heterogeneous tech stacks.

**Q: "Monolith vs. modular monolith?"**
A: A modular monolith is a monolith with enforced internal structure. Think of it
as the intermediate step: Monolith -> Modular Monolith -> Microservices. Many
organizations (Shopify) stop at step 2 and thrive.

---

## Key Takeaways

```
  1. A monolith is NOT a bad architecture -- it is the RIGHT starting point.
  2. Modular monolith = monolith simplicity + clean module boundaries.
  3. Scale vertically first, horizontally second, decompose last.
  4. Discipline (enforced boundaries) matters more than architecture choice.
  5. Most systems never need microservices.
```
