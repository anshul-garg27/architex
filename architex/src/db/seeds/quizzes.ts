/**
 * Quiz data seed — extracts hardcoded quiz/scenario content into quiz_questions table.
 *
 * Sources:
 *   - ScenarioChallenge.tsx: 11 scenario challenges (GoF patterns)
 *   - solid-demos.ts: 25 SOLID quiz questions
 *   - PatternComparison.tsx: 11 pattern comparison scenarios
 *   - 13 additional scenarios for Modern / Resilience / Concurrency / AI categories
 */

import type { Database } from "@/db";
import { quizQuestions } from "@/db/schema/quiz-questions";
import type { NewQuizQuestion } from "@/db/schema/quiz-questions";

const MODULE_ID = "lld";

/* ------------------------------------------------------------------ */
/*  Option helper type                                                 */
/* ------------------------------------------------------------------ */
interface QuizOption {
  label: string;
  whyWrong: string;
}

export async function seed(db: Database) {
  const rows: NewQuizQuestion[] = [];

  // ── SOLID Quiz Questions (25) ────────────────────────────
  const { SOLID_QUIZ_QUESTIONS } = await import("@/lib/lld/solid-demos");

  for (let i = 0; i < SOLID_QUIZ_QUESTIONS.length; i++) {
    const q = SOLID_QUIZ_QUESTIONS[i] as unknown as Record<string, unknown>;
    // SOLID quiz: user identifies which principle is violated
    // Options are always the 5 SOLID principles
    const principles = ["SRP", "OCP", "LSP", "ISP", "DIP"];
    const correctPrinciple = q.violatedPrinciple as string;
    const correctIdx = principles.indexOf(correctPrinciple);

    rows.push({
      moduleId: MODULE_ID,
      quizType: "solid",
      slug: (q.id as string) ?? `solid-quiz-${i}`,
      question: `Which SOLID principle is violated in this code?`,
      context: q.code as string,
      options: principles.map((p) => ({
        label: p,
        description: p === correctPrinciple ? "" : "",
      })),
      correctIndex: correctIdx >= 0 ? correctIdx : 0,
      explanation: q.explanation as string,
      patternId: (q.violatedPrinciple as string).toLowerCase(),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Scenario Challenges (11 GoF + 13 Modern/Resilience/Concurrency/AI) ──
  const SCENARIOS: Array<{
    id: string;
    question: string;
    context: string;
    correctIndex: number;
    correctPattern: string;
    options: QuizOption[];
    explanation: string;
  }> = [
    // ── GoF Pattern Scenarios (11) ────────────────────────────
    {
      id: "s-payments",
      question: "Your e-commerce checkout needs to support credit cards, PayPal, Bitcoin, and Apple Pay",
      context: "Each payment method has different validation rules, processing APIs, and confirmation flows. New payment methods are added quarterly.",
      correctIndex: 0,
      correctPattern: "Strategy",
      options: [
        { label: "Strategy", whyWrong: "" },
        { label: "State", whyWrong: "State manages lifecycle transitions (Draft\u2192Published). Payment methods aren't states \u2014 the user picks one each time, they don't transition between them." },
        { label: "Factory Method", whyWrong: "Factory Method delegates object creation to subclasses. The problem here is selecting an algorithm at runtime, not creating different object types." },
        { label: "Command", whyWrong: "Command encapsulates operations for undo/redo/queueing. Payment processing needs interchangeable algorithms, not reversible command objects." },
      ],
      explanation: "Strategy lets the client choose the payment algorithm at runtime. Each payment method encapsulates its own validation and processing logic behind a common interface.",
    },
    {
      id: "s-document-states",
      question: "A document goes through Draft \u2192 Review \u2192 Approved \u2192 Published states",
      context: "Each state has different allowed actions. A Draft can be edited and submitted. A Review can be approved or rejected. An Approved document can be published or reverted.",
      correctIndex: 1,
      correctPattern: "State",
      options: [
        { label: "Strategy", whyWrong: "Strategy lets users pick an algorithm. Documents don't choose behavior \u2014 their behavior is determined by their current lifecycle state, not user selection." },
        { label: "State", whyWrong: "" },
        { label: "Observer", whyWrong: "Observer broadcasts events to subscribers. The problem isn't notification \u2014 it's that allowed actions change based on which state the document is in." },
        { label: "Command", whyWrong: "Command encapsulates operations for undo/redo. The document needs state-dependent behavior rules, not reversible action objects." },
      ],
      explanation: "State pattern encapsulates state-specific behavior. The document delegates actions to its current state object, which knows what transitions are valid.",
    },
    {
      id: "s-mediator",
      question: "A chat room where users send messages that all others receive",
      context: "Users shouldn't reference each other directly. Adding a new user type (bot, admin) shouldn't require changing existing users.",
      correctIndex: 2,
      correctPattern: "Mediator",
      options: [
        { label: "Observer", whyWrong: "Observer broadcasts from one subject to many listeners, but doesn't coordinate bidirectional communication between peers like a chat room needs." },
        { label: "Chain of Responsibility", whyWrong: "Chain of Responsibility passes a request along a chain of handlers. Chat messages need central routing between peers, not sequential handoff." },
        { label: "Mediator", whyWrong: "" },
        { label: "Facade", whyWrong: "Facade simplifies a complex subsystem's interface. The chat room needs to coordinate peer-to-peer communication, not hide subsystem complexity." },
      ],
      explanation: "Mediator centralizes communication. Users only know the chat room (mediator), not each other. The mediator handles routing, filtering, and broadcasting.",
    },
    {
      id: "s-command",
      question: "A text editor with undo, redo, and macro recording",
      context: "Users perform actions like type, delete, format. Each action must be reversible. Macros record a sequence of actions for replay.",
      correctIndex: 3,
      correctPattern: "Command",
      options: [
        { label: "Memento", whyWrong: "Memento captures entire object state snapshots. Undo/redo needs fine-grained operation reversal and macro recording, not full state restoration." },
        { label: "Strategy", whyWrong: "Strategy swaps interchangeable algorithms at runtime. The editor needs operation history with execute/undo, not algorithm selection." },
        { label: "State", whyWrong: "State changes object behavior based on lifecycle. The editor needs to record, reverse, and replay individual operations as first-class objects." },
        { label: "Command", whyWrong: "" },
      ],
      explanation: "Command encapsulates each operation as an object with execute() and undo(). A history stack enables undo/redo. Macros are composite commands.",
    },
    {
      id: "s-adapter",
      question: "Your app needs to work with both a legacy XML API and a modern JSON REST API",
      context: "Both APIs provide user data but with completely different formats and protocols. Your domain code should work with either without changes.",
      correctIndex: 0,
      correctPattern: "Adapter",
      options: [
        { label: "Adapter", whyWrong: "" },
        { label: "Bridge", whyWrong: "Bridge separates abstraction from implementation upfront. Adapter retrofits an existing incompatible interface \u2014 you're adapting legacy, not designing ahead." },
        { label: "Facade", whyWrong: "Facade simplifies a complex API but doesn't convert between incompatible interfaces. You need interface translation, not simplification." },
        { label: "Proxy", whyWrong: "Proxy controls access to an object with the same interface. The XML and JSON APIs have different interfaces that need conversion, not access control." },
      ],
      explanation: "Adapter converts the interface of the legacy XML API to match your expected interface. Your code works with one interface; the adapter handles translation.",
    },
    {
      id: "s-observer",
      question: "A stock trading app where price changes update multiple displays simultaneously",
      context: "A price chart, order book, portfolio value, and alert system all need to update when any stock price changes. New display types are added frequently.",
      correctIndex: 1,
      correctPattern: "Observer",
      options: [
        { label: "Mediator", whyWrong: "Mediator centralizes complex peer-to-peer coordination. Stock displays don't communicate with each other \u2014 they just react to price changes from a single source." },
        { label: "Observer", whyWrong: "" },
        { label: "Pub/Sub", whyWrong: "Pub/Sub uses a message broker for loose coupling across distributed systems. For in-app display updates, Observer's direct subscription is simpler and sufficient." },
        { label: "Strategy", whyWrong: "Strategy selects interchangeable algorithms at runtime. The displays need to be notified of data changes, not swap their update algorithms." },
      ],
      explanation: "Observer lets the stock price subject notify all registered display observers when a price changes. New displays just subscribe \u2014 no changes to the price source.",
    },
    {
      id: "s-decorator",
      question: "A coffee ordering system where toppings can be added in any combination",
      context: "A base coffee can have milk, sugar, whipped cream, caramel, etc. Each topping adds cost and modifies the description. Customers choose any combination.",
      correctIndex: 2,
      correctPattern: "Decorator",
      options: [
        { label: "Strategy", whyWrong: "Strategy selects one algorithm at runtime. Coffee toppings stack in any combination \u2014 you need composable wrapping, not single-algorithm selection." },
        { label: "Builder", whyWrong: "Builder constructs a complex object step-by-step to produce one final result. Decorators wrap dynamically and can be mixed freely at any time." },
        { label: "Decorator", whyWrong: "" },
        { label: "Composite", whyWrong: "Composite creates tree hierarchies of part-whole relationships. Toppings wrap linearly around a base coffee, they don't form a tree structure." },
      ],
      explanation: "Decorator wraps each topping around the base coffee. Each decorator adds its cost and description while delegating to the wrapped object. Toppings compose freely.",
    },
    {
      id: "s-factory",
      question: "A notification system that sends alerts via email, SMS, and push notifications",
      context: "Adding a new channel like Slack shouldn't require modifying existing code. The decision of which channel to use depends on user preferences.",
      correctIndex: 1,
      correctPattern: "Factory Method",
      options: [
        { label: "Abstract Factory", whyWrong: "Abstract Factory creates families of related objects. You need one notification object per channel, not families of related notification components." },
        { label: "Factory Method", whyWrong: "" },
        { label: "Builder", whyWrong: "Builder constructs complex objects step-by-step. Notification creation is single-step \u2014 you need object creation delegation via subclasses, not multi-step construction." },
        { label: "Strategy", whyWrong: "Strategy swaps algorithms at runtime. The problem is creating the right notification object type, not selecting between interchangeable algorithms." },
      ],
      explanation: "Factory Method lets subclasses decide which notification object to create. Adding Slack means adding one new creator subclass \u2014 no existing code changes.",
    },
    {
      id: "s-builder",
      question: "Construct a complex SQL query with optional WHERE, JOIN, ORDER BY, and LIMIT clauses",
      context: "Your ORM needs to build SQL queries. Some queries use all clauses, some use none. The order matters, and you need to validate the final result. Telescoping constructors with 10+ optional parameters are unreadable.",
      correctIndex: 0,
      correctPattern: "Builder",
      options: [
        { label: "Builder", whyWrong: "" },
        { label: "Factory Method", whyWrong: "Factory Method creates objects in one step via subclasses. SQL queries need step-by-step construction with optional parts \u2014 that's what Builder's fluent API provides." },
        { label: "Strategy", whyWrong: "Strategy selects one algorithm at runtime. Query construction isn't about choosing an algorithm \u2014 it's about composing optional clauses incrementally." },
        { label: "Chain of Responsibility", whyWrong: "Chain of Responsibility passes requests through handler chains. SQL construction needs a fluent API that accumulates clauses, not pass-or-reject handler delegation." },
      ],
      explanation: "Builder separates construction steps. Each method adds one clause and returns the builder (fluent API). build() validates and produces the final query.",
    },
    {
      id: "s-chain",
      question: "HTTP middleware stack: authentication \u2192 rate limiting \u2192 logging \u2192 handler",
      context: "Each middleware can pass the request forward, modify it, or reject it. The order matters. New middleware can be added without changing existing ones.",
      correctIndex: 3,
      correctPattern: "Chain of Responsibility",
      options: [
        { label: "Decorator", whyWrong: "Decorator wraps objects to add behavior transparently. Middleware needs to decide whether to pass the request forward or reject it \u2014 that's Chain's pass-or-handle logic." },
        { label: "Strategy", whyWrong: "Strategy selects one algorithm at runtime. Middleware stacks process requests sequentially with each handler deciding the next step, not selecting a single algorithm." },
        { label: "Pipeline", whyWrong: "Pipeline always passes data through every stage. Chain of Responsibility lets each handler decide whether to process, modify, or reject the request before passing it on." },
        { label: "Chain of Responsibility", whyWrong: "" },
      ],
      explanation: "Chain of Responsibility links middleware handlers. Each decides whether to process the request, modify it, or pass it to the next handler in the chain.",
    },
    {
      id: "s-singleton-config",
      question: "An application configuration manager that loads settings from files and environment variables",
      context: "Multiple services need the same config. Loading config is expensive (file I/O + parsing). Config should be immutable after initialization. Only one config instance should exist.",
      correctIndex: 0,
      correctPattern: "Singleton",
      options: [
        { label: "Singleton", whyWrong: "" },
        { label: "Factory Method", whyWrong: "Factory Method delegates object creation to subclasses. The problem requires exactly one shared instance with lazy initialization, not flexible object creation." },
        { label: "Flyweight", whyWrong: "Flyweight shares many fine-grained objects to save memory. Config isn't about sharing many small objects \u2014 it's about having exactly one global immutable instance." },
        { label: "Proxy", whyWrong: "Proxy controls access to another object with the same interface. The config needs guaranteed single instantiation and global access, not access control or lazy loading of a delegate." },
      ],
      explanation: "Singleton ensures one config instance globally. The private constructor loads config once; getInstance() provides the shared immutable reference everywhere.",
    },

    // ── Modern Pattern Scenarios (4) ─────────────────────────
    {
      id: "s-repository",
      question: "Your app needs to decouple domain logic from database queries and support switching between PostgreSQL and MongoDB",
      context: "Business logic directly using SQL queries makes testing hard and ties code to one database vendor. You need a clean abstraction layer for data access that provides collection-like semantics.",
      correctIndex: 0,
      correctPattern: "Repository",
      options: [
        { label: "Repository", whyWrong: "" },
        { label: "DAO", whyWrong: "DAO exposes database operations (CRUD) directly. Repository provides a higher-level collection abstraction over domain objects, hiding query details from business logic." },
        { label: "Active Record", whyWrong: "Active Record couples domain objects to database rows \u2014 each object knows how to save itself. This creates the exact vendor lock-in you're trying to avoid." },
        { label: "Facade", whyWrong: "Facade simplifies a complex subsystem's interface. You need domain-aware data access abstraction with collection semantics, not just a simplified API wrapper." },
      ],
      explanation: "Repository mediates between domain and data mapping layers, providing collection-like access to domain objects while hiding persistence details behind a clean interface.",
    },
    {
      id: "s-cqrs",
      question: "Your e-commerce system has reads 100x more frequent than writes, and the read model needs denormalized views",
      context: "The same data model serves product listings (reads) and inventory updates (writes). Read queries are slow because the normalized write schema requires complex joins across five tables.",
      correctIndex: 1,
      correctPattern: "CQRS",
      options: [
        { label: "Event Sourcing", whyWrong: "Event Sourcing stores state as a sequence of events. The problem here is optimizing read vs write paths independently, not preserving a full event history." },
        { label: "CQRS", whyWrong: "" },
        { label: "Repository", whyWrong: "Repository abstracts data access but uses one model for reads and writes. You need separate, independently optimized read and write models." },
        { label: "Mediator", whyWrong: "Mediator coordinates communication between objects. The problem is architectural separation of read/write concerns, not object coordination." },
      ],
      explanation: "CQRS separates read and write models, letting you optimize each independently \u2014 denormalized views for fast reads, normalized model for consistent writes.",
    },
    {
      id: "s-event-sourcing",
      question: "A banking system needs complete audit trail of every balance change with ability to reconstruct state at any point in time",
      context: "Regulators require knowing exactly what happened, when, and why. Simply storing current balance loses history. Soft deletes and audit columns only capture the latest change.",
      correctIndex: 2,
      correctPattern: "Event Sourcing",
      options: [
        { label: "CQRS", whyWrong: "CQRS separates read/write models for performance. The problem here is preserving a complete immutable history of every state change, not read/write optimization." },
        { label: "Saga", whyWrong: "Saga coordinates distributed transactions with compensating actions. You need a full audit trail of state changes, not cross-service transaction management." },
        { label: "Event Sourcing", whyWrong: "" },
        { label: "Memento", whyWrong: "Memento captures object snapshots for undo. Event Sourcing stores every individual state-changing event, enabling reconstruction at any point \u2014 not just undo to a snapshot." },
      ],
      explanation: "Event Sourcing stores every state change as an immutable event. Current state is derived by replaying events, giving you complete auditable history and time-travel debugging.",
    },
    {
      id: "s-saga",
      question: "An order process spans payment, inventory, and shipping services \u2014 each must compensate if a later step fails",
      context: "Distributed transactions across microservices can't use traditional ACID. If payment succeeds but inventory is out of stock, the payment must be refunded automatically.",
      correctIndex: 1,
      correctPattern: "Saga",
      options: [
        { label: "Chain of Responsibility", whyWrong: "Chain of Responsibility passes requests through handlers sequentially. It has no built-in compensation \u2014 if a later handler fails, earlier handlers can't automatically roll back." },
        { label: "Saga", whyWrong: "" },
        { label: "Event Sourcing", whyWrong: "Event Sourcing records state changes as events. The problem is orchestrating compensating transactions across services, not maintaining an event log." },
        { label: "Two-Phase Commit", whyWrong: "Two-Phase Commit requires all participants to lock resources until commit. This blocks services and doesn't scale in distributed microservice architectures." },
      ],
      explanation: "Saga orchestrates a sequence of local transactions across services. Each step has a compensating action \u2014 if inventory fails after payment, the saga triggers a refund.",
    },

    // ── Resilience Pattern Scenarios (4) ─────────────────────
    {
      id: "s-circuit-breaker",
      question: "Your service calls a flaky third-party API that occasionally goes down for minutes, causing cascading timeouts",
      context: "When the API is down, every request hangs for 30 seconds until timeout. This exhausts your thread pool and causes your healthy endpoints to fail too.",
      correctIndex: 1,
      correctPattern: "Circuit Breaker",
      options: [
        { label: "Retry", whyWrong: "Retry re-attempts failed requests, but if the API is down for minutes, retries just pile up more hanging requests. You need to fail fast, not retry into a black hole." },
        { label: "Circuit Breaker", whyWrong: "" },
        { label: "Bulkhead", whyWrong: "Bulkhead isolates resource pools per dependency. It limits blast radius but doesn't prevent the slow requests themselves \u2014 you still waste threads waiting on timeouts." },
        { label: "Rate Limiter", whyWrong: "Rate Limiter caps request throughput. The problem isn't too many requests \u2014 it's that each failing request blocks for 30 seconds instead of failing fast." },
      ],
      explanation: "Circuit Breaker monitors failures and 'opens' after a threshold, failing fast instead of waiting for timeouts. After a cooldown, it tests with a single probe request.",
    },
    {
      id: "s-bulkhead",
      question: "Your microservice has 10 downstream dependencies \u2014 one slow dependency shouldn't exhaust all available threads",
      context: "A single slow service consumed all 200 threads in the shared pool, causing requests to completely unrelated healthy endpoints to queue and timeout.",
      correctIndex: 2,
      correctPattern: "Bulkhead",
      options: [
        { label: "Circuit Breaker", whyWrong: "Circuit Breaker fails fast after repeated failures. But before it trips, the slow requests still consume shared threads. You need resource isolation, not just failure detection." },
        { label: "Rate Limiter", whyWrong: "Rate Limiter caps request rates. The problem isn't request volume \u2014 it's that one slow dependency's thread consumption spills over to starve unrelated endpoints." },
        { label: "Bulkhead", whyWrong: "" },
        { label: "Thread Pool", whyWrong: "A single shared thread pool is the problem. Bulkhead partitions resources into isolated pools per dependency \u2014 like ship compartments preventing a hull breach from sinking the whole vessel." },
      ],
      explanation: "Bulkhead isolates resources into separate pools per dependency. If one pool is exhausted, other pools (and their endpoints) continue operating normally \u2014 like ship compartments.",
    },
    {
      id: "s-retry",
      question: "Network calls to a cloud storage API occasionally fail with transient 503 errors that succeed on the next attempt",
      context: "About 2% of requests fail randomly due to load balancer hiccups. The failures are transient \u2014 the same request typically succeeds immediately when retried.",
      correctIndex: 1,
      correctPattern: "Retry",
      options: [
        { label: "Circuit Breaker", whyWrong: "Circuit Breaker trips after sustained failures and blocks all requests. For rare transient errors (2%), you'd never hit the failure threshold \u2014 a simple retry resolves each one." },
        { label: "Retry", whyWrong: "" },
        { label: "Bulkhead", whyWrong: "Bulkhead isolates resource pools. The problem isn't resource exhaustion \u2014 it's occasional transient failures that succeed on the very next attempt." },
        { label: "Fallback", whyWrong: "Fallback returns a degraded response. You don't need degraded results \u2014 the actual request succeeds on retry since the errors are transient, not persistent." },
      ],
      explanation: "Retry with exponential backoff handles transient failures by automatically re-attempting the operation. With jitter added, it avoids thundering herd on recovery.",
    },
    {
      id: "s-rate-limiter",
      question: "Your public API needs to limit each client to 100 requests per minute to prevent abuse and ensure fair resource sharing",
      context: "Without limits, a single misbehaving client can consume all server capacity. You need per-client quotas with clear feedback when limits are exceeded.",
      correctIndex: 2,
      correctPattern: "Rate Limiter",
      options: [
        { label: "Bulkhead", whyWrong: "Bulkhead isolates internal resource pools per dependency. The problem is controlling external client request rates, not isolating internal thread pools." },
        { label: "Throttle", whyWrong: "Throttle slows down processing speed. Rate Limiter explicitly rejects excess requests with 429 status and retry-after headers, giving clients clear feedback." },
        { label: "Rate Limiter", whyWrong: "" },
        { label: "Circuit Breaker", whyWrong: "Circuit Breaker protects your service from failing dependencies. The problem is protecting your service from abusive clients, not from downstream failures." },
      ],
      explanation: "Rate Limiter tracks request counts per client using token bucket or sliding window algorithms. Exceeding the limit returns 429 Too Many Requests with retry-after headers.",
    },

    // ── Concurrency Pattern Scenarios (2) ────────────────────
    {
      id: "s-thread-pool",
      question: "A web server needs to handle 10,000 concurrent connections without creating 10,000 OS threads",
      context: "Creating one thread per request is expensive \u2014 each thread uses ~1MB of stack memory. Context switching between thousands of threads destroys CPU cache performance.",
      correctIndex: 1,
      correctPattern: "Thread Pool",
      options: [
        { label: "Producer-Consumer", whyWrong: "Producer-Consumer decouples production from consumption via a buffer queue. The problem is bounding thread creation cost, not decoupling two different processing rates." },
        { label: "Thread Pool", whyWrong: "" },
        { label: "Bulkhead", whyWrong: "Bulkhead partitions resources to isolate failures. You need to reuse a fixed set of threads efficiently, not partition them across failure domains." },
        { label: "Reactor", whyWrong: "Reactor uses a single thread with non-blocking I/O and event demultiplexing. Thread Pool uses a fixed set of worker threads \u2014 simpler and sufficient when tasks are CPU-bound." },
      ],
      explanation: "Thread Pool maintains a fixed set of reusable worker threads. Incoming tasks queue up and are dispatched to available workers, bounding memory and context-switch overhead.",
    },
    {
      id: "s-producer-consumer",
      question: "Web scraper produces URLs faster than they can be downloaded \u2014 you need to decouple production rate from consumption rate",
      context: "The URL discovery phase finds 1000 URLs/second, but downloading handles only 50/second. Without buffering, the producer blocks or URLs are lost.",
      correctIndex: 2,
      correctPattern: "Producer-Consumer",
      options: [
        { label: "Thread Pool", whyWrong: "Thread Pool reuses worker threads but doesn't address rate mismatch between producers and consumers. You need a buffer queue to decouple their speeds." },
        { label: "Observer", whyWrong: "Observer broadcasts events to subscribers synchronously. You need an asynchronous bounded buffer that absorbs speed differences between producer and consumer." },
        { label: "Producer-Consumer", whyWrong: "" },
        { label: "Pipeline", whyWrong: "Pipeline chains processing stages sequentially. Producer-Consumer specifically addresses rate mismatch with a bounded buffer queue between independent producer and consumer threads." },
      ],
      explanation: "Producer-Consumer uses a bounded queue to decouple producers from consumers. Producers add items at their pace; consumers process at theirs. The buffer absorbs speed mismatches.",
    },

    // ── AI Pattern Scenarios (3) ─────────────────────────────
    {
      id: "s-react-pattern",
      question: "An AI agent needs to solve multi-step problems by alternating between reasoning about what to do and taking actions",
      context: "The agent must break down complex questions, decide which tool to call, observe results, reason about what to do next, and iterate until it has a final answer.",
      correctIndex: 1,
      correctPattern: "ReAct",
      options: [
        { label: "Chain of Responsibility", whyWrong: "Chain of Responsibility passes requests through a fixed handler chain. The AI agent needs dynamic reasoning loops \u2014 think, act, observe, re-think \u2014 not a predetermined chain." },
        { label: "ReAct (Reason+Act)", whyWrong: "" },
        { label: "Multi-Agent", whyWrong: "Multi-Agent uses multiple specialized agents. This is a single agent that needs an internal loop of reasoning and action-taking, not delegation to other agents." },
        { label: "Tool Use", whyWrong: "Tool Use gives the agent access to external functions. ReAct is the reasoning loop that decides when and why to use tools \u2014 Tool Use is the mechanism, ReAct is the strategy." },
      ],
      explanation: "ReAct interleaves reasoning traces with action steps: Thought \u2192 Action \u2192 Observation \u2192 Thought. This lets the agent plan, execute, observe results, and adapt its approach.",
    },
    {
      id: "s-multi-agent",
      question: "A complex software project needs separate specialized AI agents for planning, coding, reviewing, and testing",
      context: "A single agent can't hold all context or expertise. You need specialized agents that collaborate \u2014 a planner breaks down tasks, a coder implements, a reviewer checks quality.",
      correctIndex: 2,
      correctPattern: "Multi-Agent",
      options: [
        { label: "ReAct", whyWrong: "ReAct is a reasoning loop for a single agent. The problem requires multiple specialized agents with different expertise collaborating, not one agent thinking harder." },
        { label: "Tool Use", whyWrong: "Tool Use gives one agent access to external functions. You need multiple agents with distinct roles and context, not one agent with more tools." },
        { label: "Multi-Agent", whyWrong: "" },
        { label: "Mediator", whyWrong: "Mediator coordinates communication between objects. Multi-Agent systems need task decomposition, role specialization, and result aggregation \u2014 richer than just message routing." },
      ],
      explanation: "Multi-Agent systems decompose complex problems across specialized agents. Each agent has focused expertise and context. An orchestrator coordinates collaboration and aggregates results.",
    },
    {
      id: "s-tool-use",
      question: "An LLM needs to search the web, run code, and query databases to answer questions beyond its training data",
      context: "The model's knowledge is frozen at training time. It needs to call external APIs, execute Python for calculations, and look up real-time data to give accurate current answers.",
      correctIndex: 1,
      correctPattern: "Tool Use",
      options: [
        { label: "ReAct", whyWrong: "ReAct is a reasoning strategy (think-act-observe loop). Tool Use is the mechanism that makes external capabilities available \u2014 ReAct may use tools, but it's not the tool system itself." },
        { label: "Tool Use", whyWrong: "" },
        { label: "Multi-Agent", whyWrong: "Multi-Agent delegates to specialized agents. The problem is giving a single LLM structured access to external capabilities, not distributing work across multiple agents." },
        { label: "Plugin", whyWrong: "Plugin is a product term for installable extensions. Tool Use is the underlying pattern \u2014 structured function calling with typed schemas that the model invokes and incorporates." },
      ],
      explanation: "Tool Use gives an LLM structured access to external capabilities via typed function schemas. The model decides which tool to invoke, generates parameters, and incorporates results.",
    },
  ];

  for (let i = 0; i < SCENARIOS.length; i++) {
    const s = SCENARIOS[i];
    rows.push({
      moduleId: MODULE_ID,
      quizType: "scenario",
      slug: s.id,
      question: s.question,
      context: s.context,
      options: s.options,
      correctIndex: s.correctIndex,
      explanation: s.explanation,
      patternId: s.correctPattern.toLowerCase().replace(/\s+/g, "-"),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Pattern Comparisons (11) ───────────────────────────────
  const COMPARISONS = [
    // Original 3: Strategy vs State vs Command
    { id: "cs-sorting", question: "User selects between QuickSort, MergeSort, and BubbleSort in a visualization app", context: "The USER explicitly picks which sorting algorithm to run. The algorithm doesn't change based on internal state.", correctIndex: 0, options: ["Strategy", "State", "Command"], explanation: "Strategy: the USER selects the algorithm. The context delegates to the chosen strategy. State would mean the algorithm changes automatically based on system state." },
    { id: "cs-vending", question: "A vending machine: idle \u2192 coin inserted \u2192 item selected \u2192 dispensing \u2192 idle", context: "The machine's behavior changes completely based on its current state. Inserting a coin in 'idle' is valid but in 'dispensing' it should be rejected.", correctIndex: 1, options: ["Strategy", "State", "Command"], explanation: "State: the SYSTEM transitions between states automatically. Each state defines which actions are valid. Strategy would require the user to explicitly select behavior." },
    { id: "cs-text-editor", question: "Recording keystrokes in a text editor for undo/redo and macro playback", context: "Each keystroke is an operation. You need to store operations, reverse them (undo), replay them (redo), and group them into macros.", correctIndex: 2, options: ["Strategy", "State", "Command"], explanation: "Command: OPERATIONS are objects. Each command has execute() and undo(). A history stack stores commands. Macros are composite commands that replay a sequence." },

    // New 8: commonly confused pattern pairs
    { id: "cs-chat-notifications", question: "Chat room notifications: should message routing use Observer (broadcast) or Mediator (central hub)?", context: "Users send messages to a chat room. The system must route messages to all participants without users referencing each other directly. New user types are added over time.", correctIndex: 1, options: ["Observer", "Mediator", "Pub/Sub"], explanation: "Mediator: the chat room is a central hub that coordinates bidirectional communication between peers. Observer is one-to-many broadcast from a single subject \u2014 it doesn't manage peer-to-peer routing." },
    { id: "cs-http-logging", question: "Add logging to an HTTP client: Decorator (enhance behavior) or Proxy (control access)?", context: "You want to transparently add request/response logging to an existing HTTP client without modifying it. The logging wrapper has the same interface.", correctIndex: 0, options: ["Decorator", "Proxy", "Adapter"], explanation: "Decorator: you're enhancing the client with new behavior (logging) while keeping the same interface. Proxy controls access (caching, auth, lazy init) \u2014 logging is behavioral enhancement, not access control." },
    { id: "cs-db-connections", question: "Create database connections for MySQL, PostgreSQL, and SQLite: Factory Method (one type) or Abstract Factory (family)?", context: "Each database vendor needs a connection object. You might later need vendor-specific query builders and migration tools that must be compatible with the connection.", correctIndex: 1, options: ["Factory Method", "Abstract Factory", "Builder"], explanation: "Abstract Factory: you need families of related objects (connection + query builder + migrator) that must be compatible. Factory Method creates one product type \u2014 it can't ensure cross-product compatibility." },
    { id: "cs-sort-selection", question: "Sort algorithm selection: Strategy (compose at runtime) or Template Method (inherit skeleton)?", context: "A data processing pipeline has fixed steps: validate, transform, sort, output. Only the sort step varies between implementations. The overall algorithm skeleton is the same.", correctIndex: 1, options: ["Strategy", "Template Method", "State"], explanation: "Template Method: the skeleton is fixed (validate\u2192transform\u2192sort\u2192output) with one varying step. Strategy would compose the entire sort as a separate object \u2014 overkill when only one step in a fixed pipeline varies." },
    { id: "cs-legacy-api", question: "Legacy API integration: Adapter (convert interface) or Facade (simplify interface)?", context: "A third-party library has 15 classes with complex configuration. Your code only needs 3 operations. The library's interface is fine \u2014 there's just too much of it.", correctIndex: 1, options: ["Adapter", "Facade", "Bridge"], explanation: "Facade: you're simplifying a complex subsystem into a few high-level operations. Adapter converts an incompatible interface \u2014 here the interface isn't incompatible, it's just unnecessarily complex." },
    { id: "cs-multi-platform", question: "Multi-platform rendering: Adapter (retrofit existing) or Bridge (plan abstraction upfront)?", context: "You're designing a new UI framework that must support Windows, macOS, and Linux from day one. The platform backends will evolve independently from the UI abstractions.", correctIndex: 1, options: ["Adapter", "Bridge", "Proxy"], explanation: "Bridge: you're designing the abstraction/implementation split upfront so both can vary independently. Adapter retrofits an existing incompatible interface \u2014 Bridge is the planned-ahead version." },
    { id: "cs-file-system", question: "File system tree: Composite (uniform hierarchy) or Decorator (enhance individual nodes)?", context: "Files and folders form a tree. Folders contain files and other folders. You need to calculate total size recursively \u2014 a folder's size is the sum of its children's sizes.", correctIndex: 0, options: ["Composite", "Decorator", "Flyweight"], explanation: "Composite: files and folders share a uniform interface, and folders recursively contain children. Decorator wraps a single object to add behavior \u2014 it doesn't model part-whole tree hierarchies." },
    { id: "cs-object-creation", question: "Complex object creation: Builder (step-by-step) or Factory (one-shot)?", context: "Creating a report requires setting a title, adding sections with different layouts, configuring headers/footers, and choosing an export format. Not all parts are required.", correctIndex: 0, options: ["Builder", "Factory Method", "Abstract Factory"], explanation: "Builder: the report is constructed step-by-step with optional parts and validated at the end. Factory Method creates an object in one call \u2014 it can't handle incremental construction with optional components." },
  ];

  for (let i = 0; i < COMPARISONS.length; i++) {
    const c = COMPARISONS[i];
    rows.push({
      moduleId: MODULE_ID,
      quizType: "pattern-comparison",
      slug: c.id,
      question: c.question,
      context: c.context,
      options: c.options.map((opt) => ({ label: opt })),
      correctIndex: c.correctIndex,
      explanation: c.explanation,
      patternId: c.options[c.correctIndex].toLowerCase().replace(/\s+/g, "-"),
      difficulty: "intermediate",
      sortOrder: i,
    });
  }

  // ── Upsert all ────────────────────────────────────────────
  console.log(`    Upserting ${rows.length} quiz questions...`);

  const BATCH_SIZE = 20;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(quizQuestions)
      .values(batch)
      .onConflictDoUpdate({
        target: [
          quizQuestions.moduleId,
          quizQuestions.quizType,
          quizQuestions.slug,
        ],
        set: {
          question: quizQuestions.question,
          context: quizQuestions.context,
          options: quizQuestions.options,
          correctIndex: quizQuestions.correctIndex,
          explanation: quizQuestions.explanation,
          patternId: quizQuestions.patternId,
          sortOrder: quizQuestions.sortOrder,
        },
      });
  }

  console.log(`    \u2713 ${rows.length} quiz questions upserted`);
}
