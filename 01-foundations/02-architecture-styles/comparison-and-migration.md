# Architecture Decision Guide, Comparison, and Migration Patterns

## Giant Comparison Table

```
Criteria            Monolith         Microservices      Serverless         Event-Driven
────────────────────────────────────────────────────────────────────────────────────────
Dev Complexity      Low              High               Medium             High
Operational Cost    Low              High               Very Low           Medium-High
Scalability         Vertical/limited Independent/fine   Auto/infinite      Per-consumer
Team Size           1-15 devs        10-500+ devs       1-20 devs          10-100+ devs
Deployment Speed    Slow (all at     Fast (per service) Very fast (per fn) Medium
                    once)
Deployment Risk     High (all or     Low (per service)  Low (per function) Medium
                    nothing)
Latency             Very low         Medium (network)   Variable (cold     Medium (async)
                    (in-process)     1-10ms per hop     start 100ms-10s)
Data Consistency    Strong (ACID)    Eventual           Eventual           Eventual
Debugging           Easy (one        Hard (distributed  Hard (no SSH,      Hard (trace
                    process)         tracing needed)    ephemeral)         through events)
Testing             Easy (one app)   Hard (contract +   Medium (local      Hard (event
                                     integration)       emulation)         flow testing)
Tech Diversity      None (one stack) Full (per service) Limited (provider  Full (per
                                                        runtimes)          consumer)
Fault Isolation     None (one crash  High (per service) High (per function)High (per
                    kills all)       boundary)          boundary)          consumer)
Cost at Low Traffic Fixed (server    Fixed (multiple    Near zero          Fixed (broker
                    always on)       servers always on) (pay per call)     always on)
Cost at High Traffic Moderate        High (many         Can be very high   Moderate
                                     services/DBs)      (per-invocation)
Vendor Lock-in      Low              Low-Medium         High               Medium (broker
                                                                           choice)
Learning Curve      Low              High               Medium             High
```

---

## Decision Flowchart

```
                            START HERE
                               │
                    ┌──────────v──────────┐
                    │ How large is your   │
                    │ engineering team?    │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
            < 10 devs     10-50 devs      50+ devs
                 │             │             │
                 v             v             v
           ┌──────────┐  ┌──────────┐  ┌──────────────┐
           │MONOLITH  │  │How complex│  │MICROSERVICES │
           │(start    │  │is domain? │  │(team autonomy│
           │ here)    │  └─────┬────┘  │ is critical) │
           └────┬─────┘        │       └──────────────┘
                │         ┌────┼────┐
                v         │         │
           ┌──────────┐ Simple   Complex
           │Is traffic │   │         │
           │variable / │   v         v
           │event-     │ MODULAR   MICRO-
           │driven?    │ MONOLITH  SERVICES
           └─────┬─────┘
                 │
            ┌────┼────┐
            │         │
           Yes        No
            │         │
            v         v
      ┌───────────┐ ┌────────────┐
      │SERVERLESS │ │MONOLITH    │
      │(if spiky, │ │(if steady, │
      │low-med    │ │ keep it    │
      │traffic)   │ │ simple)    │
      └─────┬─────┘ └────────────┘
            │
            v
      ┌───────────────┐
      │Need complex   │
      │event workflows?│
      └───────┬───────┘
              │
         ┌────┼────┐
         │         │
        Yes        No
         │         │
         v         v
   ┌──────────┐  ┌──────────────┐
   │EVENT-    │  │SERVERLESS    │
   │DRIVEN +  │  │(simple API   │
   │SERVERLESS│  │ backend)     │
   └──────────┘  └──────────────┘

  NOTE: These are not mutually exclusive. Most real systems
  combine styles: microservices WITH event-driven communication,
  serverless FOR some microservices, etc.
```

---

## Migration Patterns

### 1. Strangler Fig Pattern

Named after strangler fig trees that grow around a host tree, eventually
replacing it entirely. You incrementally replace monolith functionality
with new services while keeping the system running.

```
  PHASE 1: Intercept                PHASE 2: Migrate              PHASE 3: Complete
  ─────────────────────             ──────────────────             ──────────────────

  ┌──────────────────┐              ┌──────────────────┐           ┌──────────────┐
  │   Facade/Proxy   │              │   Facade/Proxy   │           │ Facade/Proxy │
  └────────┬─────────┘              └────────┬─────────┘           └──────┬───────┘
           │                                 │                            │
     ┌─────┴─────┐                    ┌──────┴──────┐              ┌──────┴──────┐
     │           │                    │             │              │             │
     v           v                    v             v              v             v
  ┌──────┐  ┌────────────┐        ┌──────┐  ┌────────────┐    ┌──────┐  ┌──────────┐
  │Mono- │  │New Service │        │Mono- │  │New Services│    │(gone)│  │All New   │
  │lith  │  │(1st piece  │        │lith  │  │(more pieces│    │      │  │Services  │
  │(all  │  │ extracted) │        │(most │  │ extracted) │    └──────┘  └──────────┘
  │logic)│  └────────────┘        │logic)│  └────────────┘
  └──────┘                        └──────┘
  100% monolith                   60% monolith               0% monolith
  0% services                     40% services               100% services
```

**How it works step by step:**
1. Place a proxy (facade) in front of the monolith
2. Pick one bounded context to extract (start with a simple, well-defined one)
3. Build the new service alongside the monolith
4. Route traffic for that feature to the new service via the proxy
5. Repeat for the next bounded context
6. Eventually, the monolith has nothing left to serve -- decommission it

**Key advantage:** the system works at every stage. No big-bang migration.

### 2. Branch by Abstraction

Used when the code you want to replace is deeply embedded in the monolith.

```
  Step 1: Identify the code to replace (e.g., payment processing)

  Step 2: Create an abstraction (interface) around it
  ┌──────────────────────────────────────────────┐
  │ Monolith                                     │
  │   Code ──> PaymentInterface ──> OldPayment   │
  └──────────────────────────────────────────────┘

  Step 3: Build the new implementation behind the same interface
  ┌──────────────────────────────────────────────┐
  │ Monolith                                     │
  │                  ┌──> OldPayment (existing)  │
  │   Code ──> PaymentInterface                  │
  │                  └──> NewPayment (service)   │
  └──────────────────────────────────────────────┘

  Step 4: Toggle traffic (feature flag) to the new implementation
  Step 5: Remove the old implementation and the abstraction
```

**Best for:** extracting a module that is deeply tangled within the monolith.
The abstraction layer lets you switch implementations without changing callers.

### 3. Parallel Run

Run the old and new system simultaneously, compare outputs, and switch
over when confident.

```
  Request ──> Splitter ──┬──> Old System ──> Response (used)
                         │                    │
                         └──> New System ──> Response (compared)
                                              │
                                    ┌─────────v─────────┐
                                    │  Comparator:      │
                                    │  Do outputs match? │
                                    │  Log differences.  │
                                    └───────────────────┘

  Phase 1: Old is primary, new is shadow (read-only comparison)
  Phase 2: New becomes primary, old is shadow (verification)
  Phase 3: Old is decommissioned
```

**Best for:** high-risk migrations where correctness is critical (financial
systems, billing logic). GitHub used this when migrating their permissions
system.

---

## Martin Fowler's "Monolith First" Philosophy

> "Almost all the successful microservice stories have started with a monolith
>  that got too big and was broken up. Almost all the cases where I've heard
>  of a system that was built as a microservice system from scratch, it has
>  ended up in serious trouble."
>  -- Martin Fowler

### The argument:

```
  1. You do NOT know the right service boundaries at the start.
     Domain understanding evolves. Premature decomposition creates
     a distributed monolith -- the worst of all worlds.

  2. Microservices have a PRODUCTIVITY tax.
     A team of 5 building 10 microservices is slower than the
     same team building one well-structured monolith.

  3. The path that works:
     Monolith ──> Modular Monolith ──> Microservices (if needed)
                        ^
                        |
               Most teams should STOP HERE.

  4. Only decompose when you feel REAL pain:
     - Deployment contention (teams blocking each other)
     - Scaling bottlenecks (one module is the hot path)
     - Team coordination cost exceeds development cost
```

---

## Anti-Patterns

### 1. The Distributed Monolith

The worst of both worlds: distributed system complexity with none of the
independence benefits.

```
  SYMPTOMS:
  ┌────────────────────────────────────────────────────┐
  │  [x] Services must be deployed together            │
  │  [x] Services share a database                     │
  │  [x] Changing Service A requires changing Service B│
  │  [x] Synchronous call chains: A -> B -> C -> D     │
  │  [x] Shared libraries with business logic          │
  │  [x] One service goes down, everything goes down   │
  └────────────────────────────────────────────────────┘

  You get: network latency + deployment coordination + no fault isolation
  You lose: simplicity of a monolith

  HOW TO AVOID:
  - Each service owns its database (no shared DB)
  - Prefer async communication (events over HTTP calls)
  - No shared business logic libraries
  - Each service must be deployable independently
  - Test: "Can I deploy Service A without touching anything else?"
```

### 2. Nano-Services

Too many services that are too small. Each one is trivial but the coordination
overhead is enormous.

```
  BAD: 200 services for a team of 15 engineers
       - "StringValidationService"
       - "EmailFormatterService"
       - "DateParserService"

  These should be libraries, NOT services.

  RULE OF THUMB:
  - A service should be owned by one team (2-pizza team)
  - A service should encapsulate a meaningful business capability
  - If a "service" has 50 lines of code, it is a function, not a service
  - If two "services" always deploy together, they are one service
```

---

## Case Study: Segment's Journey (Microservices -> Back to Monolith)

```
  2013: Segment starts as a monolith
        - Simple, fast development, small team

  2015: Grows, breaks into microservices
        - Each integration (Salesforce, Mixpanel, etc.) = own service
        - 140+ microservices for 140+ integrations

  PROBLEMS:
  ┌───────────────────────────────────────────────────┐
  │  - Each service had nearly identical code          │
  │  - Bug fixes had to be applied to 140 services    │
  │  - 140 deployment pipelines to maintain            │
  │  - Shared failure modes (same bug everywhere)      │
  │  - Team was drowning in operational overhead       │
  │  - Could not ship new integrations fast enough     │
  └───────────────────────────────────────────────────┘

  2017: Segment consolidates back to a monolith
        - Single binary with a plugin architecture
        - Called it "Centrifuge"
        - Development speed increased dramatically
        - Operational burden dropped by 10x

  LESSON: Microservices are not always the answer.
          The right architecture depends on the PROBLEM, not the trend.
```

---

## Hybrid Architectures (The Real World)

Most production systems are not purely one style. They combine approaches.

```
  ┌─────────────────────────────────────────────────────────┐
  │                 REAL-WORLD SYSTEM                       │
  │                                                         │
  │   ┌─────────────────┐     ┌──────────────────┐         │
  │   │ Core Platform   │     │  API Gateway     │         │
  │   │ (Modular        │     │  (routes to      │         │
  │   │  Monolith)      │     │   services)      │         │
  │   └────────┬────────┘     └────────┬─────────┘         │
  │            │                       │                    │
  │            v                       v                    │
  │   ┌──────────────┐       ┌──────────────────┐          │
  │   │ Event Bus    │       │ Microservices    │          │
  │   │ (Kafka)      │──────>│ (Search, Recs,   │          │
  │   │              │       │  Notifications)  │          │
  │   └──────┬───────┘       └──────────────────┘          │
  │          │                                             │
  │          v                                             │
  │   ┌──────────────┐       ┌──────────────────┐          │
  │   │ Serverless   │       │ Data Pipeline    │          │
  │   │ Functions    │       │ (Event-Driven)   │          │
  │   │ (webhooks,   │       │                  │          │
  │   │  cron jobs)  │       │                  │          │
  │   └──────────────┘       └──────────────────┘          │
  └─────────────────────────────────────────────────────────┘
```

---

## Interview Questions and Answers

### Q1: "You're starting a new project. What architecture would you choose?"

**Answer:** "I would start with a monolith -- specifically a modular monolith
with well-defined internal boundaries. Here is my reasoning:

1. We do not know the domain well enough yet to draw service boundaries.
   Wrong boundaries are extremely expensive to fix in microservices.
2. A small team moves faster with a single deployable unit.
3. We can always extract services later using the Strangler Fig pattern
   when we experience actual pain (deployment contention, scaling
   bottlenecks, team coordination overhead).

I would structure the monolith with clear modules, separate schemas per
module, and compile-time boundary enforcement -- so it is ready to decompose
if and when we need to."

### Q2: "Your monolith is struggling with scale. How do you migrate to microservices?"

**Answer:** "I would use the Strangler Fig pattern in three phases:

1. **Identify the bottleneck:** Which module needs independent scaling? Start
   there -- not with a random module.
2. **Extract:** Place a facade/proxy in front of the monolith, build the new
   service, route traffic to it gradually (canary deployment).
3. **Iterate:** Extract one service at a time, validate it works, then move to
   the next. Each extraction is a low-risk, reversible step.

I would NOT do a big-bang rewrite. I would NOT try to extract everything at
once. The system must work at every intermediate stage."

### Q3: "What is a distributed monolith and how do you avoid it?"

**Answer:** "A distributed monolith has all the complexity of microservices with
none of the benefits. Symptoms: services must deploy together, share a database,
or have long synchronous call chains. To avoid it: each service owns its data,
prefer async communication, no shared business logic libraries, and every
service must be independently deployable."

### Q4: "When would you use event-driven architecture vs. request-response?"

**Answer:** "Use event-driven when: multiple consumers need the same data,
temporal decoupling is valuable (producer and consumer can be offline at
different times), you need an audit trail, or you need to absorb traffic
spikes. Use request-response when: you need an immediate answer, the
interaction is simple query/response, or strong consistency is required."

### Q5: "Serverless vs. containers -- how do you decide?"

**Answer:** "Serverless for: spiky/variable traffic, event-driven processing,
low-traffic APIs, rapid prototyping, and when minimizing operational overhead
is the priority. Containers for: steady high-throughput traffic, long-running
processes, GPU workloads, latency-sensitive paths that cannot tolerate cold
starts, and when vendor independence matters."

### Q6: "What is CQRS and when would you use it?"

**Answer:** "CQRS separates the write model from the read model. Commands go to
a write-optimized store; events propagate to read-optimized views. Use it when:
read and write patterns are vastly different (e.g., complex writes but simple
reads), you need to scale reads and writes independently, or your domain has
complex business rules on the write side. Do NOT use it for simple CRUD -- it
adds significant complexity."

---

## Architecture Maturity Model

```
  Level 0: Big Ball of Mud
           No structure, everything coupled, deploy and pray.

  Level 1: Structured Monolith
           Layered architecture (controller/service/repo), some organization.

  Level 2: Modular Monolith
           Strict module boundaries, separate schemas, enforced interfaces.
           >>> MOST TEAMS SHOULD AIM HERE <<<

  Level 3: Microservices (selective)
           Extract only the modules that need independent scaling/deployment.
           Keep the rest as a monolith.

  Level 4: Full Microservices + Event-Driven
           Complete decomposition, async communication, CQRS where needed.
           Only for large orgs with mature platform teams.
```

---

## Key Takeaways

```
  1. There is NO universally "best" architecture. Context determines choice.
  2. Start with a monolith. Decompose when you feel REAL pain.
  3. Wrong service boundaries are more expensive than a monolith.
  4. The Strangler Fig pattern is the safest migration path.
  5. Distributed monolith = worst of both worlds. Avoid at all costs.
  6. Most production systems are HYBRID (multiple styles combined).
  7. Architecture should mirror team structure (Conway's Law).
  8. Segment's story: microservices are not always the answer.
  9. In interviews, always discuss TRADE-OFFS, never declare one style "best."
```
