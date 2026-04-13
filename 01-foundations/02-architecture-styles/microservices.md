# Microservices Architecture

## What Are Microservices?

Microservices is an architectural style where an application is composed of
**small, independently deployable services**, each running in its own process,
communicating over the network, and organized around **business capabilities**.

### Core Characteristics

| Characteristic              | Meaning                                           |
|-----------------------------|---------------------------------------------------|
| **Independently deployable**    | Deploy service A without touching service B       |
| **Own database**                | Each service owns its data store (no shared DB)   |
| **Own tech stack**              | Service A in Go, Service B in Python -- your call |
| **Organized by business domain**| "Orders" service, not "database-access" service   |
| **Decentralized governance**    | Teams own services end-to-end (build + run)       |
| **Smart endpoints, dumb pipes** | Logic in services, not in the communication layer |
| **Design for failure**          | Every network call can fail -- plan for it        |

---

## Architecture Diagram

```
                        ┌─────────────────┐
          Clients  ────>│   API GATEWAY   │
         (Web/Mobile)   │  (Kong/Envoy)   │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              v                  v                  v
     ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
     │  User Service  │ │ Order Service │ │Payment Service │
     │  (Node.js)     │ │ (Java)        │ │(Go)            │
     │                │ │               │ │                │
     │  ┌──────────┐  │ │ ┌──────────┐  │ │ ┌──────────┐  │
     │  │ Users DB │  │ │ │Orders DB │  │ │ │Payments  │  │
     │  │(Postgres)│  │ │ │(MongoDB) │  │ │ │DB (MySQL)│  │
     │  └──────────┘  │ │ └──────────┘  │ │ └──────────┘  │
     └───────┬────────┘ └───────┬───────┘ └───────┬────────┘
             │                  │                  │
             └──────────────────┼──────────────────┘
                                │
                    ┌───────────v───────────┐
                    │     MESSAGE BUS       │
                    │   (Kafka / RabbitMQ)  │
                    └───────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              v                 v                 v
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │ Notification │  │  Inventory   │  │  Analytics   │
     │   Service    │  │   Service    │  │   Service    │
     └──────────────┘  └──────────────┘  └──────────────┘

  SERVICE MESH (Istio/Linkerd): handles mTLS, retries, circuit breakers
  SERVICE REGISTRY (Consul/Eureka): services find each other dynamically
  CONFIG SERVER: centralized configuration management
```

---

## Pros

| Advantage                | Why It Matters                                         |
|--------------------------|--------------------------------------------------------|
| **Independent scaling**      | Scale only the hot service (e.g., Search at 100 pods)  |
| **Team autonomy**            | Teams own their service end-to-end, move fast          |
| **Tech diversity**           | Use the best tool for each job (ML in Python, API in Go)|
| **Fault isolation**          | Payment crash does not take down catalog browsing       |
| **Independent deployments**  | Deploy 50 times/day without coordinating with others    |
| **Smaller codebases**        | Each service is easy to understand and onboard into     |
| **Organizational alignment** | Service boundaries map to team boundaries               |

---

## Cons

| Disadvantage                     | Detail                                         |
|----------------------------------|------------------------------------------------|
| **Distributed system complexity**    | Network failures, partial failures, clock skew |
| **Network latency**                  | Every service call adds 1-10ms of latency      |
| **Data consistency**                 | No cross-service ACID transactions (eventual)  |
| **Operational overhead**             | N services = N deployments, N log streams      |
| **Testing complexity**               | Integration testing across services is hard    |
| **Debugging difficulty**             | Tracing a request across 12 services           |
| **Data duplication**                 | Services often replicate data they need locally|
| **Infrastructure cost**              | More servers, load balancers, databases        |

---

## Key Challenges and Solutions

### 1. Service Discovery

```
  Problem: Service A needs to call Service B.
           But B might have 5 instances, IPs change.

  Solution: Service Registry

  ┌──────────┐  1. Register   ┌──────────────────┐
  │Service B │ ──────────────>│  Service Registry │
  │(instance)│                │  (Consul/Eureka)  │
  └──────────┘                └────────┬──────────┘
                                       │
  ┌──────────┐  2. Lookup     ┌────────v──────────┐
  │Service A │ <──────────────│  Returns B's IPs  │
  └──────────┘                └───────────────────┘
```

### 2. Distributed Transactions (Saga Pattern)

```
  Problem: "Create Order" spans Orders, Payments, and Inventory.
           No single DB transaction can cover all three.

  Choreography Saga (event-driven):

  Order         Payment        Inventory
  Created  ───> Process   ───> Reserve
    │           Payment         Stock
    │              │              │
    │           Payment        Stock
    │           Processed  <── Reserved
    │              │
    v              v
  Order         (if failure:
  Confirmed      emit compensating events to roll back)
```

### 3. Distributed Tracing

```
  Request: GET /checkout

  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
  │ Gateway │───>│  Orders  │───>│ Inventory │───>│ Payment  │
  │ 2ms     │    │  15ms    │    │  8ms      │    │  120ms   │
  └─────────┘    └──────────┘    └───────────┘    └──────────┘
  trace_id: abc-123 propagated through all services

  Tools: Jaeger, Zipkin, AWS X-Ray, Datadog APM
```

### 4. API Gateway Pattern

```
  Without Gateway:                With Gateway:
  Client knows every service      Client talks to ONE endpoint

  Client ──> User Service         Client ──> API Gateway ──> User Service
  Client ──> Order Service                                ──> Order Service
  Client ──> Payment Service                              ──> Payment Service

  Gateway handles: routing, auth, rate limiting, response aggregation
```

---

## Conway's Law and Team Structure

> "Organizations which design systems are constrained to produce designs
>  which are copies of the communication structures of those organizations."
>  -- Melvin Conway, 1967

**Implication:** your service boundaries should mirror your team boundaries.

```
  BAD: Teams organized by layer         GOOD: Teams organized by domain

  ┌──────────────────────────┐         ┌──────────┐ ┌──────────┐ ┌──────────┐
  │   Frontend Team          │         │  Orders  │ │ Payments │ │ Catalog  │
  ├──────────────────────────┤         │  Team    │ │  Team    │ │  Team    │
  │   Backend Team           │         │          │ │          │ │          │
  ├──────────────────────────┤         │ FE+BE+DB │ │ FE+BE+DB │ │ FE+BE+DB │
  │   Database Team          │         │ +DevOps  │ │ +DevOps  │ │ +DevOps  │
  └──────────────────────────┘         └──────────┘ └──────────┘ └──────────┘

  Layer teams = constant                Domain teams = autonomous
  cross-team coordination               ("you build it, you run it")
```

Amazon's "two-pizza team" rule: each service is owned by a team small enough
to be fed by two pizzas (6-8 people).

---

## Communication Patterns

### Synchronous (Request-Response)

```
  REST/HTTP:  Service A ──HTTP GET──> Service B
  gRPC:      Service A ──protobuf──> Service B  (faster, typed)

  Pros: simple, immediate response
  Cons: tight coupling, cascading failures, latency chains
```

### Asynchronous (Event-Driven)

```
  Service A ──publish event──> Message Bus ──> Service B
                                           ──> Service C

  Pros: loose coupling, temporal decoupling, natural load leveling
  Cons: eventual consistency, harder to reason about ordering
```

### Best practice: use sync for queries, async for commands/events.

---

## When to Use Microservices

```
  GOOD FIT:                              BAD FIT:

  [x] Large engineering org (50+)        [ ] Team < 10 engineers
  [x] Complex domain (many subdomains)   [ ] Early-stage startup / MVP
  [x] Need independent scaling           [ ] Simple CRUD application
  [x] Teams need full autonomy           [ ] Tight budget (infra is pricey)
  [x] High deployment frequency          [ ] Team lacks distributed systems
  [x] Different parts need different          experience
      tech stacks or scaling profiles    [ ] You cannot define clear service
                                              boundaries yet
```

---

## Real-World Examples

### Netflix (700+ microservices)
- Migrated from monolith after a major database corruption (2008)
- Built Zuul (API gateway), Eureka (service discovery), Hystrix (circuit breaker)
- Open-sourced their entire toolchain as Netflix OSS
- Each team owns 2-5 services end-to-end

### Amazon
- Jeff Bezos's famous 2002 "API Mandate": all teams must expose data through APIs
- This forced microservices-like architecture before the term existed
- Led directly to the creation of AWS (they productized their internal platform)

### Uber
- Started as a monolith, broke apart as they expanded to new cities/products
- Domain-oriented microservice architecture (DOMA)
- Thousands of services organized into "domains" with clear interfaces
- Lesson learned: even microservices need higher-level organization

---

## Essential Infrastructure

A production microservices platform needs ALL of these:

```
  ┌─────────────────────────────────────────────────────────┐
  │                  PLATFORM LAYER                         │
  │                                                         │
  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
  │  │ Container    │  │ Service Mesh  │  │ CI/CD per   │  │
  │  │ Orchestration│  │ (Istio)       │  │ service     │  │
  │  │ (Kubernetes) │  │               │  │ (ArgoCD)    │  │
  │  └──────────────┘  └───────────────┘  └─────────────┘  │
  │                                                         │
  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
  │  │ Distributed  │  │ Centralized   │  │ Secrets     │  │
  │  │ Tracing      │  │ Logging       │  │ Management  │  │
  │  │ (Jaeger)     │  │ (ELK Stack)   │  │ (Vault)     │  │
  │  └──────────────┘  └───────────────┘  └─────────────┘  │
  │                                                         │
  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │
  │  │ API Gateway  │  │ Config Server │  │ Monitoring   │  │
  │  │ (Kong)       │  │ (Consul)      │  │ (Prometheus) │  │
  │  └──────────────┘  └───────────────┘  └─────────────┘  │
  └─────────────────────────────────────────────────────────┘
```

**The "microservices tax":** you need this infrastructure BEFORE you get the
benefits. Without it, you have distributed chaos.

---

## Interview Tips

**Q: "How do you determine service boundaries?"**
A: Use Domain-Driven Design (DDD). Identify bounded contexts through event
storming sessions. Each bounded context typically maps to one microservice.
Validate boundaries with the "can this team deploy independently?" test.

**Q: "How do you handle data consistency across services?"**
A: Accept eventual consistency. Use the Saga pattern for distributed
transactions. Use outbox pattern + CDC (Change Data Capture) for reliable
event publishing. Reserve strong consistency for within a single service.

**Q: "What is a distributed monolith and how do you avoid it?"**
A: A distributed monolith is when services are tightly coupled -- they must be
deployed together, share databases, or make synchronous call chains. Avoid it by:
(1) each service owns its data, (2) prefer async communication, (3) no shared
libraries with business logic, (4) services can deploy independently.

**Q: "Microservices vs. SOA?"**
A: SOA (Service-Oriented Architecture) is the broader concept; microservices is a
specific implementation. Key differences: microservices use lightweight protocols
(REST/gRPC vs. SOAP/ESB), smaller scope per service, decentralized data, and
smart endpoints over smart middleware.

---

## Key Takeaways

```
  1. Microservices solve ORGANIZATIONAL problems as much as technical ones.
  2. The "microservices tax" (infra overhead) is real -- budget for it.
  3. Start with a monolith, decompose when you understand the domain.
  4. Service boundaries = team boundaries (Conway's Law).
  5. You need distributed tracing, centralized logging, and CI/CD per
     service BEFORE going to production.
  6. Eventual consistency is the default -- design for it.
```
