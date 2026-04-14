/**
 * Interview Q&A seed for the remaining 26 patterns that don't have Q&A yet.
 *
 * 3 questions per pattern: warmup, core, deep-dive.
 * Content type: 'interview-qa'
 * Module: 'lld'
 */

import type { Database } from "@/db";
import { batchUpsert } from "./seed-helpers";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "lld";
const CONTENT_TYPE = "interview-qa";

interface FollowUp {
  question: string;
  expectedPoints: string[];
}

interface InterviewQuestion {
  patternId: string;
  slug: string;
  question: string;
  modelAnswer: string;
  difficulty: "warmup" | "core" | "deep-dive";
  category: "explain" | "compare" | "apply" | "critique";
  followUps: FollowUp[];
  evaluationCriteria: string[];
}

const QUESTIONS: InterviewQuestion[] = [
  // ── Abstract Factory ────────────────────────────────────
  {
    patternId: "abstract-factory",
    slug: "abstract-factory-explain",
    question: "Explain the Abstract Factory pattern in 2 minutes.",
    modelAnswer:
      "Abstract Factory provides an interface for creating families of related objects without specifying their concrete classes. Unlike Factory Method (which produces one product via inheritance), Abstract Factory produces a suite of products via composition. Consider a cross-platform UI toolkit: you have a GUIFactory interface with createButton(), createCheckbox(), createTextField(). WindowsFactory returns WindowsButton, WindowsCheckbox, etc. MacFactory returns MacButton, MacCheckbox, etc. The client code works with the factory interface and product interfaces — it never mentions Windows or Mac. This guarantees consistency: you'll never accidentally mix a Windows button with a Mac checkbox. In practice, React Native's Platform.select() is a lightweight abstract factory — it returns platform-specific components. Dependency injection containers (NestJS, Spring) are abstract factories: you configure which family of implementations to inject based on the environment.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "When would Abstract Factory be overkill?",
        expectedPoints: [
          "only one product family exists",
          "products don't need to be consistent with each other",
          "the system is small and unlikely to support multiple platforms",
        ],
      },
    ],
    evaluationCriteria: [
      "explains families of related products",
      "distinguishes from Factory Method (composition vs inheritance)",
      "gives concrete use case (cross-platform UI, DI container)",
      "mentions consistency guarantee across product family",
    ],
  },
  {
    patternId: "abstract-factory",
    slug: "abstract-factory-vs-factory-method",
    question: "When would you use Abstract Factory vs Factory Method?",
    modelAnswer:
      "Factory Method handles creating a single product — you define a creation method in a base class, and subclasses override it to produce different products. It uses inheritance: one class hierarchy, one product. Abstract Factory handles creating families of related products — you define an interface with multiple creation methods, and each concrete factory implements all of them. It uses composition: the client holds a factory reference. Use Factory Method when you have one product that varies and the creation is part of a larger template method. Use Abstract Factory when you need multiple products that must be used together consistently. For example, if your app just needs different loggers (file, console, remote), Factory Method suffices — one createLogger() override. But if your app needs a complete theme (button + input + modal) that must match, Abstract Factory ensures you never mix themes. The tradeoff: Abstract Factory has a higher upfront cost (more interfaces) but is safer when product consistency matters. Factory Method is simpler but doesn't enforce cross-product consistency.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you combine both patterns?",
        expectedPoints: [
          "Abstract Factory methods can themselves be Factory Methods",
          "each createProduct() in the factory is a Factory Method that subclasses override",
          "this is the GoF default implementation strategy for Abstract Factory",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly identifies single product vs family of products",
      "mentions inheritance (FM) vs composition (AF)",
      "gives concrete scenario for each",
      "discusses consistency guarantee of Abstract Factory",
    ],
  },
  {
    patternId: "abstract-factory",
    slug: "abstract-factory-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Abstract Factory?",
    modelAnswer:
      "The primary pitfall is the Open/Closed violation when adding new product types. If you add createDropdown() to the GUIFactory interface, every concrete factory (Windows, Mac, Linux) must implement it — this is a shotgun change. The pattern is closed for new product types but open for new product families (adding LinuxFactory is easy). Second, interface explosion: N factories × M products = N×M concrete classes plus M product interfaces plus 1 factory interface. For 3 platforms and 5 widgets, that's 15 concrete classes. Third, rigidity — the factory decides the entire family upfront. If you need to mix products from different families (Mac buttons but Windows menus), the pattern fights you. Fourth, in dynamic languages (JavaScript, Python), the ceremony is often unnecessary — a simple config object or dictionary of constructor functions achieves the same result without the class hierarchy. Use Abstract Factory in strongly-typed languages where compile-time consistency matters, or in plugin architectures where third parties supply entire product families.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you handle the 'adding a new product type' problem?",
        expectedPoints: [
          "use a generic create(type) method with a registry",
          "accept the breaking change and update all factories",
          "use the Prototype pattern to clone products from a catalog",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the adding-new-product-type problem",
      "quantifies the class explosion",
      "mentions rigidity of family-level selection",
      "contrasts with simpler approaches in dynamic languages",
    ],
  },

  // ── Bridge ──────────────────────────────────────────────
  {
    patternId: "bridge",
    slug: "bridge-explain",
    question: "Explain the Bridge pattern in 2 minutes.",
    modelAnswer:
      "Bridge separates an abstraction from its implementation so the two can vary independently. Without Bridge, if you have M abstractions and N implementations, you get M×N subclasses (cartesian product explosion). Bridge introduces two independent hierarchies connected by composition: the Abstraction holds a reference to an Implementor interface. Consider a drawing application: Shape (abstraction) can be Circle or Rectangle. Renderer (implementation) can be SVGRenderer or CanvasRenderer. Without Bridge, you'd need SVGCircle, CanvasCircle, SVGRectangle, CanvasRectangle — 4 classes for 2×2. With Bridge, Circle and Rectangle each hold a Renderer reference and delegate drawing: this.renderer.renderCircle(x, y, r). Adding a new renderer means one new class, not one per shape. Real-world examples: JDBC drivers (same SQL API, different database implementations), React Native (same component API, platform-specific renderers), and logging frameworks (same log interface, multiple output targets).",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does Bridge differ from Adapter?",
        expectedPoints: [
          "Bridge is designed upfront to separate abstraction from implementation",
          "Adapter is applied after the fact to make incompatible interfaces work together",
          "Bridge lets both sides evolve independently; Adapter wraps a fixed interface",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the M×N class explosion problem",
      "describes two independent hierarchies connected by composition",
      "gives a concrete real-world example",
      "mentions independent variation as the key benefit",
    ],
  },
  {
    patternId: "bridge",
    slug: "bridge-vs-strategy",
    question: "When would you use Bridge vs Strategy?",
    modelAnswer:
      "Structurally, Bridge and Strategy look identical — both use composition to delegate to an interface. The difference is intent and lifetime. Strategy swaps algorithms at runtime within a single class. The context (e.g., a PaymentProcessor) exists independently and switches between strategies (CreditCard, PayPal, Bitcoin) based on user choice. The relationship is temporary and interchangeable. Bridge separates a permanent abstraction/implementation relationship that was designed upfront. A Shape is permanently bound to a Renderer — the relationship is structural, not behavioral. You don't typically hot-swap a shape's renderer at runtime. Think of it this way: Strategy is about choosing HOW to do something (algorithm selection). Bridge is about separating WHAT from HOW (abstraction from platform). If you're decoupling an algorithm that varies per context, use Strategy. If you're preventing a cartesian explosion of abstraction × implementation subclasses, use Bridge.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you give an example where Bridge and Strategy overlap?",
        expectedPoints: [
          "a logging system where Logger (abstraction) delegates to Transport (impl)",
          "the Transport could be seen as a strategy (swap console for file)",
          "but it's Bridge if the Logger hierarchy also varies (AppLogger, AuditLogger)",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies identical structure but different intent",
      "explains runtime swapping (Strategy) vs upfront design (Bridge)",
      "distinguishes algorithm selection from abstraction/implementation separation",
      "gives concrete examples for each",
    ],
  },
  {
    patternId: "bridge",
    slug: "bridge-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Bridge?",
    modelAnswer:
      "The main pitfall is premature abstraction — Bridge requires you to identify the two independent dimensions of variation upfront, before the cartesian explosion actually hurts. If you guess wrong about which axes will vary, you've added complexity for no benefit. Second, indirection overhead: every method call goes through the Implementor interface, which can complicate debugging ('where does this.renderer.draw() actually go?'). Third, the pattern is harder to retrofit than Adapter — if you didn't design the Bridge from the start, splitting a monolithic hierarchy into two is a significant refactor. Fourth, in practice, many systems only have one implementation (e.g., only SVGRenderer) and never add a second. YAGNI applies: don't Bridge until you have concrete evidence of the second dimension. The sweet spot is platform abstraction layers (JDBC, React Native, logging frameworks) where multiple implementations are guaranteed from day one. Avoid Bridge for internal code where the 'implementation' side has only one concrete class.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you refactor towards Bridge if you're already deep in a class explosion?",
        expectedPoints: [
          "identify the two independent dimensions",
          "extract the implementation interface from the existing concrete classes",
          "replace inheritance with composition incrementally",
          "use the Strangler Fig pattern to migrate gradually",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies premature abstraction risk",
      "mentions debugging indirection cost",
      "contrasts with Adapter (upfront vs retrofit)",
      "applies YAGNI appropriately",
    ],
  },

  // ── Bulkhead ────────────────────────────────────────────
  {
    patternId: "bulkhead",
    slug: "bulkhead-explain",
    question: "Explain the Bulkhead pattern in 2 minutes.",
    modelAnswer:
      "Bulkhead is a resilience pattern borrowed from ship design — ships have watertight compartments so that a breach in one doesn't sink the whole vessel. In software, Bulkhead isolates components so that a failure in one doesn't cascade to others. The most common implementation is resource partitioning: give each service or tenant its own thread pool, connection pool, or rate limit. For example, if your API calls both a payment service and a recommendation service, give each its own HTTP connection pool (say, 10 connections each). If the recommendation service hangs and exhausts its 10 connections, the payment service still has its 10 and continues operating normally. Without Bulkhead, a single shared pool would be drained by the hanging service, taking down payments too. Other forms include process isolation (microservices themselves are bulkheads), queue isolation (separate queues per priority), and cloud resource isolation (separate clusters per tenant). The tradeoff is resource efficiency — reserved pools mean some capacity sits idle during normal operation.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does Kubernetes implement Bulkhead?",
        expectedPoints: [
          "resource limits and requests per container (CPU, memory)",
          "namespace resource quotas",
          "pod disruption budgets",
          "node affinity/anti-affinity for workload isolation",
        ],
      },
    ],
    evaluationCriteria: [
      "uses the ship metaphor correctly",
      "explains resource partitioning with a concrete example",
      "describes the cascade failure prevention mechanism",
      "acknowledges the resource efficiency tradeoff",
    ],
  },
  {
    patternId: "bulkhead",
    slug: "bulkhead-vs-circuit-breaker",
    question: "When would you use Bulkhead vs Circuit Breaker?",
    modelAnswer:
      "Bulkhead and Circuit Breaker are complementary, not alternatives — you typically use both. Bulkhead is preventive: it partitions resources upfront so that one component's failure can't consume another's resources. It's always active, whether things are healthy or not. Circuit Breaker is reactive: it monitors failure rates and trips open when a downstream service is unhealthy, preventing wasted calls. It only activates when failures cross a threshold. Use Bulkhead when you need to guarantee resource availability for critical paths regardless of what other components do. Use Circuit Breaker when you need to detect a failing dependency and fail fast instead of waiting for timeouts. Example: your payment service has a Bulkhead (dedicated connection pool) AND a Circuit Breaker (stop calling if 50% of requests fail in 30 seconds). The Bulkhead prevents resource starvation. The Circuit Breaker prevents wasting the resources that are available. Together, they provide both isolation and intelligent failure detection.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What happens if you have Circuit Breaker but no Bulkhead?",
        expectedPoints: [
          "a slow service can still exhaust the shared thread pool before the circuit trips",
          "during the detection window, healthy services may be starved",
          "the circuit breaker only helps after the damage threshold is reached",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies preventive (Bulkhead) vs reactive (Circuit Breaker)",
      "explains they're complementary, not alternatives",
      "gives a concrete combined example",
      "describes the gap each pattern fills",
    ],
  },
  {
    patternId: "bulkhead",
    slug: "bulkhead-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Bulkhead?",
    modelAnswer:
      "The primary tradeoff is resource waste — if you allocate 10 connections per service and have 5 services, you've reserved 50 connections even if peak usage across all services is only 20. This is the classic isolation-vs-efficiency tension. Second, sizing is hard: too small and you throttle healthy services during normal spikes; too large and you defeat the isolation purpose. Getting the pool sizes right requires load testing and monitoring. Third, Bulkhead adds operational complexity — you now have N pools to monitor, configure, and tune instead of one. Fourth, cascading failures can still happen within a bulkhead: if all 10 threads in a partition are waiting on a dead service, requests to that partition still fail. You need Circuit Breaker inside the Bulkhead to handle this. Fifth, in serverless architectures (Lambda), concurrency limits are natural bulkheads, but they come with cold start penalties. The pattern works best in long-running services with shared resource pools where the isolation boundary matches the failure domain.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you determine the right pool sizes?",
        expectedPoints: [
          "measure p99 latency and throughput per dependency",
          "calculate: pool size = target throughput × p99 latency",
          "add headroom for bursts (typically 2-3x)",
          "use adaptive sizing with metrics feedback",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies resource waste as primary cost",
      "discusses sizing difficulty",
      "mentions need for Circuit Breaker inside Bulkhead",
      "connects to real infrastructure (K8s, serverless)",
    ],
  },

  // ── Chain of Responsibility ─────────────────────────────
  {
    patternId: "chain-of-responsibility",
    slug: "chain-of-responsibility-explain",
    question: "Explain the Chain of Responsibility pattern in 2 minutes.",
    modelAnswer:
      "Chain of Responsibility passes a request along a chain of handlers until one handles it. Each handler has a reference to the next handler and can either process the request or pass it along. The sender doesn't know which handler will process the request — it just sends it to the first in the chain. Express/Koa middleware is the canonical modern example: app.use(cors()), app.use(auth()), app.use(rateLimiter()) — each middleware either handles the request (e.g., auth rejects with 401) or calls next() to pass to the next middleware. DOM event bubbling is another example: a click on a button propagates up to its parent div, then section, then body — any handler can stop propagation. Java servlet filters work the same way. The key benefit is decoupling: the sender is decoupled from all handlers, and handlers are decoupled from each other. You can add, remove, or reorder handlers without changing any other handler or the sender. The variant where ALL handlers process the request (logging middleware, for example) is called a Pipeline or Interceptor pattern.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the difference between Chain of Responsibility and the Pipeline variant?",
        expectedPoints: [
          "classic CoR: ONE handler processes the request and stops the chain",
          "Pipeline: ALL handlers process the request in sequence",
          "Express middleware is actually Pipeline — most middleware calls next()",
          "DOM event handling with stopPropagation() is classic CoR",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the pass-along-until-handled mechanism",
      "gives concrete examples (middleware, event bubbling)",
      "mentions decoupling benefit",
      "distinguishes from Pipeline variant",
    ],
  },
  {
    patternId: "chain-of-responsibility",
    slug: "chain-of-responsibility-vs-decorator",
    question: "When would you use Chain of Responsibility vs Decorator?",
    modelAnswer:
      "Both Chain of Responsibility and Decorator compose handlers in a chain, but their intent differs fundamentally. Chain of Responsibility routes a request to the ONE handler that can deal with it — the chain is a decision mechanism. When a handler processes the request, it typically stops the chain. Decorator wraps behavior — EVERY decorator runs, adding its behavior around the core operation. There's no 'choosing' or 'routing'; all layers apply. Think of it this way: CoR is OR logic (handler A OR handler B handles the request). Decorator is AND logic (logging AND caching AND compression ALL wrap the response). Use CoR when you have multiple potential handlers and the request should reach the appropriate one: event handling, command dispatching, approval chains. Use Decorator when you want to stack cross-cutting concerns around a core operation: middleware for logging + auth + compression. The overlap is Express middleware, which is structurally CoR (next() passes to the next handler) but functionally closer to Decorator (most middleware runs AND passes along).",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you give a case where the wrong choice would cause problems?",
        expectedPoints: [
          "using Decorator when only one handler should run leads to all handlers executing unnecessarily",
          "using CoR when all handlers should run requires each to explicitly call next(), which is fragile",
          "Express middleware is a pragmatic hybrid that works because the convention is clear",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies OR logic (CoR) vs AND logic (Decorator)",
      "explains when chain stops (CoR) vs all layers run (Decorator)",
      "gives concrete use cases for each",
      "addresses the Express middleware overlap",
    ],
  },
  {
    patternId: "chain-of-responsibility",
    slug: "chain-of-responsibility-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Chain of Responsibility?",
    modelAnswer:
      "The biggest pitfall is the 'no handler' case — if no handler in the chain can process the request, it falls off the end silently. You must design for this: add a default/fallback handler at the end, or throw an error. Express does this with a default 404 handler. Second, debugging is harder because the request path is determined at runtime — you can't statically trace which handler will execute without understanding the runtime chain configuration. Third, performance: the request traverses the chain linearly, which is O(n) in the number of handlers. For hot paths with many handlers, this matters. Fourth, handler ordering is fragile — reordering auth and rate-limiting handlers changes security behavior, but the chain structure doesn't make this dependency explicit. Fifth, in strongly-typed languages, the 'request' object tends to accumulate fields as it passes through handlers (context bloat), becoming an untyped bag. Mitigate this with a typed context object or middleware-specific metadata. The pattern works best when the chain is short (3-7 handlers), handlers are independent, and the ordering is stable.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you handle ordering dependencies between handlers?",
        expectedPoints: [
          "document the expected order explicitly",
          "use priority/order fields on handlers",
          "group handlers into phases (pre-processing, processing, post-processing)",
          "test the chain order as part of integration tests",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the silent 'no handler' pitfall",
      "mentions debugging difficulty due to runtime resolution",
      "discusses handler ordering fragility",
      "suggests concrete mitigations",
    ],
  },

  // ── Circuit Breaker ─────────────────────────────────────
  {
    patternId: "circuit-breaker",
    slug: "circuit-breaker-explain",
    question: "Explain the Circuit Breaker pattern in 2 minutes.",
    modelAnswer:
      "Circuit Breaker prevents cascading failures by wrapping calls to external services with failure detection logic, inspired by electrical circuit breakers. It has three states: Closed (normal operation — requests pass through, failures are counted), Open (failing — all requests are immediately rejected without calling the downstream service, returning a fallback or error), and Half-Open (recovery probe — after a timeout, one request is allowed through to test if the service has recovered). If the probe succeeds, the breaker transitions back to Closed. If it fails, back to Open with a new timeout. The key metrics are the failure threshold (e.g., 5 failures in 30 seconds triggers Open), the timeout duration (e.g., 60 seconds before trying Half-Open), and the success threshold (e.g., 3 consecutive successes in Half-Open before closing). Netflix Hystrix popularized this pattern. Modern alternatives include resilience4j (Java), Polly (.NET), and opossum (Node.js). In microservices, Circuit Breaker is essential — without it, a single failing service can exhaust thread pools across the entire call chain.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What fallback strategies work well with Circuit Breaker?",
        expectedPoints: [
          "return cached data (stale but available)",
          "return a default/degraded response",
          "route to a backup service",
          "queue the request for later processing",
        ],
      },
    ],
    evaluationCriteria: [
      "names all three states (Closed, Open, Half-Open)",
      "explains the state transitions correctly",
      "mentions key configuration parameters (threshold, timeout)",
      "gives real-world library examples",
    ],
  },
  {
    patternId: "circuit-breaker",
    slug: "circuit-breaker-vs-retry",
    question: "When would you use Circuit Breaker vs Retry?",
    modelAnswer:
      "Retry and Circuit Breaker address different failure modes. Retry handles transient failures — brief network glitches, temporary 503s, lock contention. You retry the same operation 2-3 times with exponential backoff, expecting it to succeed soon. Circuit Breaker handles sustained failures — a service that's down, a database that's overloaded, a dependency in a crash loop. You stop retrying entirely to prevent wasting resources and allow recovery. The danger of Retry without Circuit Breaker: if the service is truly down, retries amplify load. 100 clients retrying 3 times each = 300 requests hitting an already-struggling service (retry storm). The danger of Circuit Breaker without Retry: you miss easy wins on transient failures and immediately trip the circuit on brief blips. Best practice: use both together. Retry handles the transient case (2-3 attempts with backoff). If retries exhaust, the failure is counted towards the Circuit Breaker threshold. Once the threshold is hit, the circuit opens and retries stop entirely. Libraries like resilience4j and Polly compose these as stacked decorators: CircuitBreaker(Retry(actualCall)).",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What is a retry storm and how do you prevent it?",
        expectedPoints: [
          "all clients retry simultaneously, amplifying load on a failing service",
          "add jitter to backoff intervals to spread retry timing",
          "use Circuit Breaker to stop retries when failures are sustained",
          "implement client-side rate limiting on retries",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes transient (Retry) from sustained (Circuit Breaker) failures",
      "explains the retry storm danger",
      "recommends using both together",
      "describes the composition order correctly",
    ],
  },
  {
    patternId: "circuit-breaker",
    slug: "circuit-breaker-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Circuit Breaker?",
    modelAnswer:
      "The primary tradeoff is availability vs correctness. When the circuit is open, you're returning fallbacks or errors — the system is 'available' but potentially serving stale or incomplete data. This is an explicit choice to favor partial availability over waiting for the real response. Second, threshold tuning is hard: too sensitive and the circuit trips on normal variance (false positives); too tolerant and it fails to protect. You need to tune per-dependency based on its error profile and latency characteristics. Third, the Half-Open state is a bottleneck — only one probe request goes through, so recovery is slow. Some implementations allow a configurable number of probe requests. Fourth, Circuit Breaker can mask real issues. If your circuit is open for hours and nobody notices, the downstream service might be permanently broken while your system silently degrades. You need alerting on circuit state changes. Fifth, in distributed systems, each instance has its own circuit state, which can lead to inconsistent behavior — some instances may have open circuits while others are still closed. Shared circuit state (via Redis or similar) fixes this but adds complexity.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you implement distributed circuit breaker state?",
        expectedPoints: [
          "store failure counts and circuit state in Redis or similar shared store",
          "use sliding window counters for failure rate calculation",
          "handle the case where the shared store itself fails",
          "consider eventual consistency — some staleness is acceptable",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies availability vs correctness tradeoff",
      "discusses threshold tuning difficulty",
      "mentions alerting on circuit state changes",
      "addresses distributed circuit state challenge",
    ],
  },

  // ── Composite ───────────────────────────────────────────
  {
    patternId: "composite",
    slug: "composite-explain",
    question: "Explain the Composite pattern in 2 minutes.",
    modelAnswer:
      "Composite lets you compose objects into tree structures and treat individual objects and compositions uniformly. The key insight is that a group of objects should behave exactly like a single object. You define a Component interface (e.g., FileSystemNode with getSize()). Leaf classes (File) implement it directly — getSize() returns the file's size. Composite classes (Directory) also implement it but contain children — getSize() recursively sums children's sizes. The client calls getSize() without knowing whether it has a file or a directory. This is the part-whole hierarchy pattern. Real examples: React's component tree (a <div> can contain other components, and rendering is recursive), the DOM (nodes contain child nodes, all share the same API), file systems (files and directories), and organization hierarchies (employees and managers). The power is recursive composition: a composite can contain other composites, enabling arbitrarily deep nesting. The constraint is that leaf and composite must share a common interface, which sometimes means leaf nodes have no-op implementations of add/remove child methods.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "Should Leaf classes have add/remove child methods?",
        expectedPoints: [
          "transparency approach: yes, they throw or no-op (GoF recommendation)",
          "safety approach: no, only Composite has child management methods",
          "transparency favors uniform interface; safety favors type correctness",
          "modern preference: safety approach with type narrowing",
        ],
      },
    ],
    evaluationCriteria: [
      "explains tree structure with uniform interface",
      "distinguishes Leaf from Composite roles",
      "gives real-world examples (DOM, React, file system)",
      "mentions recursive composition",
    ],
  },
  {
    patternId: "composite",
    slug: "composite-vs-decorator",
    question: "When would you use Composite vs Decorator?",
    modelAnswer:
      "Composite and Decorator both use recursive composition but serve different purposes. Composite builds tree structures where you need to treat part-whole hierarchies uniformly. The tree fans out — a node has many children. The goal is structure: represent a hierarchy. Decorator wraps a single object to add behavior. The chain is linear — each decorator wraps exactly one other object. The goal is behavior modification: add responsibilities without subclassing. Think of it this way: Composite is a tree (1-to-many), Decorator is a chain (1-to-1). Use Composite when you need to represent hierarchies: file systems, UI component trees, organization charts, mathematical expression trees. Use Decorator when you need to add cross-cutting behavior: logging, caching, compression, authentication. They can coexist: React's component tree (Composite) uses Higher-Order Components (Decorator) to add behavior to individual nodes in the tree. The confusion arises because both implement the same interface as their wrapped/child components, but the relationship cardinality is the distinguishing factor.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can a Decorator wrap a Composite?",
        expectedPoints: [
          "yes — a caching decorator could wrap a directory's getSize() to avoid recalculating",
          "the decorator doesn't know or care that it wraps a composite",
          "this is the beauty of the shared interface approach",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies tree (1-to-many) vs chain (1-to-1)",
      "distinguishes structural purpose (Composite) from behavioral (Decorator)",
      "gives clear use cases for each",
      "mentions they can coexist",
    ],
  },
  {
    patternId: "composite",
    slug: "composite-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Composite?",
    modelAnswer:
      "First, the overly-general interface problem: to treat leaves and composites uniformly, you often end up with methods on Leaf that don't make sense (addChild on a File). This violates Interface Segregation and confuses API consumers. Second, type safety erosion: if you store children as the Component type, you lose the ability to call composite-specific methods without casting. TypeScript's discriminated unions or type guards help here. Third, tree traversal performance: operations like getSize() on a deep tree visit every node recursively. For large trees, this can be slow without caching or lazy evaluation. Fourth, circular references: if a composite inadvertently contains itself (directly or indirectly), recursive operations become infinite loops. You need cycle detection or structural guarantees. Fifth, the pattern makes it hard to restrict which component types can be children — a file system allows files inside directories but not directories inside files, but the Component interface doesn't express this constraint. The pattern works best when the tree is naturally homogeneous and operations genuinely apply to both leaves and composites.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you optimize a Composite tree for read-heavy workloads?",
        expectedPoints: [
          "cache computed values (e.g., directory size) and invalidate on mutation",
          "use lazy evaluation — only compute when accessed",
          "use a flattened index for direct lookups instead of traversal",
          "implement iterators for streaming instead of collecting all results",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the overly-general interface problem",
      "mentions circular reference danger",
      "discusses performance of tree traversal",
      "suggests mitigations for type safety",
    ],
  },

  // ── CQRS ────────────────────────────────────────────────
  {
    patternId: "cqrs",
    slug: "cqrs-explain",
    question: "Explain CQRS in 2 minutes.",
    modelAnswer:
      "CQRS (Command Query Responsibility Segregation) splits your application into two separate models: a write model (Commands) that handles state changes, and a read model (Queries) that handles data retrieval. Instead of a single CRUD model that reads and writes through the same data structures, commands go through a write-optimized path and queries go through a read-optimized path. The simplest CQRS is using different DTOs for reads vs writes on the same database. The most sophisticated CQRS uses entirely separate databases — a normalized relational DB for writes and a denormalized search index (Elasticsearch) or materialized views for reads. Changes propagate from write to read model via events (eventual consistency). Real-world examples: Redux (actions/reducers are commands, selectors are queries), GraphQL (mutations vs queries), and database read replicas (writes to primary, reads from replicas). The key benefit is independent optimization — your write model can enforce complex business rules while your read model is denormalized for fast queries. The key cost is eventual consistency between the two models.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the simplest way to introduce CQRS?",
        expectedPoints: [
          "separate read DTOs from write DTOs on the same database",
          "use database views for the read model",
          "no separate database or event bus needed",
          "this gives 80% of the benefit with 20% of the complexity",
        ],
      },
    ],
    evaluationCriteria: [
      "clearly separates command (write) from query (read) models",
      "explains the spectrum from simple (different DTOs) to complex (separate DBs)",
      "mentions eventual consistency as the key tradeoff",
      "gives concrete real-world examples",
    ],
  },
  {
    patternId: "cqrs",
    slug: "cqrs-vs-event-sourcing",
    question: "When would you use CQRS vs Event Sourcing?",
    modelAnswer:
      "CQRS and Event Sourcing are independent patterns that pair well but serve different purposes. CQRS is about separating read and write paths — you can implement CQRS with a traditional database that stores current state. Event Sourcing is about how you store state — instead of storing current state, you store every state change as an immutable event and derive current state by replaying events. You can have CQRS without Event Sourcing: separate read/write models backed by the same PostgreSQL database. You can have Event Sourcing without CQRS: a single model that writes events and reads by replaying them (though this is slow without projections). They pair well because Event Sourcing naturally produces events that can update read models (CQRS projections). Use CQRS alone when your read and write loads have very different optimization needs (e.g., complex writes but simple reads, or high read volume). Add Event Sourcing when you need a complete audit trail, temporal queries ('what was the state on Tuesday?'), or the ability to rebuild read models from scratch.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What problems does Event Sourcing solve that CQRS alone doesn't?",
        expectedPoints: [
          "complete audit trail (every change is stored)",
          "temporal queries (reconstruct state at any point in time)",
          "ability to add new read models retroactively by replaying events",
          "debugging production issues by replaying the exact event sequence",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly identifies them as independent patterns",
      "explains CQRS without ES and ES without CQRS",
      "explains why they pair well (events drive read model updates)",
      "gives clear criteria for when to add each",
    ],
  },
  {
    patternId: "cqrs",
    slug: "cqrs-tradeoffs",
    question: "What are the tradeoffs and pitfalls of CQRS?",
    modelAnswer:
      "The biggest pitfall is unnecessary complexity. For simple CRUD applications with balanced read/write loads, CQRS doubles your surface area (two models, two APIs, synchronization logic) without proportional benefit. Greg Young, who coined the term, explicitly warns against using it everywhere. Second, eventual consistency is hard to get right in the UI. After a user creates an order (command), the read model may not reflect it for seconds. You need strategies: optimistic UI updates, polling, websocket notifications, or read-your-own-writes consistency. Third, the two models can diverge if synchronization fails — you need idempotent event handlers, dead letter queues, and reconciliation jobs. Fourth, testing is harder because you need to test the write model, the read model, AND the synchronization between them. Fifth, operational complexity: you now have multiple databases, an event bus, and projection workers to monitor and maintain. Use CQRS when: read/write loads differ by 10x or more, queries require complex joins or aggregations, or you need fundamentally different data shapes for reads and writes. Don't use it for simple CRUD.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you handle the 'read-your-own-writes' problem?",
        expectedPoints: [
          "optimistic UI: immediately reflect the change locally before confirmation",
          "sticky sessions: route subsequent reads to the write database",
          "version polling: include a version number and poll until the read model catches up",
          "websocket push: notify the client when the read model is updated",
        ],
      },
    ],
    evaluationCriteria: [
      "warns against using CQRS for simple CRUD",
      "addresses eventual consistency UX challenges",
      "mentions model divergence and reconciliation",
      "gives clear criteria for when CQRS is worth the cost",
    ],
  },

  // ── Event Sourcing ──────────────────────────────────────
  {
    patternId: "event-sourcing",
    slug: "event-sourcing-explain",
    question: "Explain Event Sourcing in 2 minutes.",
    modelAnswer:
      "Event Sourcing stores every state change as an immutable event in an append-only log, instead of storing just the current state. To get the current state, you replay all events for an entity from the beginning. For example, a bank account doesn't store 'balance: $500'. It stores: AccountOpened($0), Deposited($1000), Withdrawn($300), Deposited($100), TransferredOut($300). The current balance ($500) is derived by replaying these events. This gives you a complete audit trail for free, the ability to ask 'what was the balance on March 5th?' by replaying events up to that date, and the ability to rebuild any read model by replaying from scratch. Real examples: Git (commits are events, working tree is derived), database WAL (write-ahead log), Redux with action logging, and Google Docs (every keystroke is an event). The main challenge is performance — replaying thousands of events per read is slow. The solution is snapshots: periodically save the aggregate state at event N, then only replay events after N.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How do you handle schema evolution of events?",
        expectedPoints: [
          "events are immutable — never modify existing events",
          "use upcasters to transform old event versions to new format at read time",
          "maintain backward compatibility via weak schema",
          "version events with a schema version field",
        ],
      },
    ],
    evaluationCriteria: [
      "explains append-only event log vs current-state storage",
      "gives the bank account or similar concrete example",
      "mentions temporal queries and audit trail benefits",
      "addresses the replay performance problem and snapshots",
    ],
  },
  {
    patternId: "event-sourcing",
    slug: "event-sourcing-vs-cqrs",
    question: "When would you use Event Sourcing vs CQRS?",
    modelAnswer:
      "Event Sourcing answers 'how do I store state?' — as an immutable sequence of events. CQRS answers 'how do I organize reads and writes?' — as separate models. They're orthogonal. Use Event Sourcing when you need: a complete audit trail that can't be tampered with (finance, healthcare, legal), temporal queries (reconstruct state at any point), the ability to add new read projections retroactively, or debugging via event replay. Don't use Event Sourcing when: state changes are simple and audit isn't required, events would be enormous (e.g., binary file updates), or your team lacks experience with eventual consistency. Use CQRS when: read and write loads are fundamentally different (e.g., 100:1 read-to-write ratio), read models need denormalized views that are expensive to compute from normalized writes, or different consumers need different data shapes. Don't use CQRS when: a single model serves both reads and writes adequately, or the system is simple CRUD. They combine naturally because Event Sourcing produces events that CQRS projections consume, but neither requires the other.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you have Event Sourcing without CQRS?",
        expectedPoints: [
          "yes — a single model replays events to get current state",
          "but this is slow for reads, which is why you usually add projections (CQRS)",
          "for write-heavy systems with infrequent reads, ES alone can work",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly identifies orthogonal concerns (storage vs organization)",
      "gives clear criteria for when to use each independently",
      "explains why they combine well",
      "provides anti-patterns for each",
    ],
  },
  {
    patternId: "event-sourcing",
    slug: "event-sourcing-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Event Sourcing?",
    modelAnswer:
      "The biggest pitfall is event schema evolution. Events are immutable — you can't ALTER TABLE on a log of 10 million events. If the event format changes, you need upcasters (transformers that convert old event versions to the new format during replay). This is complex to maintain over years. Second, eventual consistency: the event store and read projections are separate, creating a lag window where the read model is stale. This confuses users and complicates UI design. Third, replay performance degrades over time — an aggregate with 100,000 events takes seconds to load. Snapshots help but add snapshot management complexity (when to snapshot, how to handle snapshot format changes). Fourth, debugging is counterintuitive — instead of looking at current state, you debug by examining event sequences, which requires different tooling. Fifth, deleting data is hard — GDPR 'right to be forgotten' conflicts with an immutable event log. Solutions include crypto-shredding (encrypt PII with a per-user key, delete the key) or event log compaction. The pattern is powerful for domains with complex state transitions, regulatory requirements, or temporal analysis needs, but it's a poor fit for simple CRUD applications.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you handle GDPR deletion with Event Sourcing?",
        expectedPoints: [
          "crypto-shredding: encrypt PII in events with a per-user key, delete the key",
          "event log compaction: rewrite the log excluding PII",
          "use tombstone events that mark data as deleted",
          "store PII references (not values) in events, delete from the referenced store",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies event schema evolution as primary difficulty",
      "explains eventual consistency impact",
      "mentions GDPR/deletion challenge",
      "discusses snapshot complexity",
    ],
  },

  // ── Facade ──────────────────────────────────────────────
  {
    patternId: "facade",
    slug: "facade-explain",
    question: "Explain the Facade pattern in 2 minutes.",
    modelAnswer:
      "Facade provides a simplified interface to a complex subsystem. Instead of forcing clients to interact with dozens of classes and understand their relationships, you create a single entry point that orchestrates the subsystem internally. Consider a home theater system: to watch a movie, you need to turn on the projector, set the input source, lower the screen, dim the lights, set the surround sound mode, and start the Blu-ray player. A HomeTheaterFacade provides watchMovie(title) that does all of this in one call. In code, consider an order processing system: OrderFacade.placeOrder(cart) internally calls InventoryService.reserve(), PaymentService.charge(), ShippingService.createLabel(), and NotificationService.sendConfirmation(). The client calls one method instead of four. jQuery is a classic Facade — it wrapped the browser's inconsistent DOM API behind $(selector).action(). AWS SDK methods are facades over complex HTTP API calls. The key distinction from Adapter: Facade simplifies (reduces complexity), Adapter converts (makes incompatible interfaces compatible). Facade doesn't add new functionality — it curates existing functionality.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "When does a Facade become a God Object?",
        expectedPoints: [
          "when it does more than delegating — adding business logic",
          "when it becomes the only way to access the subsystem (forced bottleneck)",
          "when it grows to dozens of methods covering every subsystem operation",
          "keep facades thin: orchestrate, don't implement",
        ],
      },
    ],
    evaluationCriteria: [
      "explains simplified interface to complex subsystem",
      "gives a concrete real-world example",
      "distinguishes from Adapter (simplify vs convert)",
      "notes Facade doesn't add new functionality",
    ],
  },
  {
    patternId: "facade",
    slug: "facade-vs-mediator",
    question: "When would you use Facade vs Mediator?",
    modelAnswer:
      "Facade and Mediator both simplify interactions between components, but their direction and awareness differ. Facade is one-way: the client talks to the Facade, the Facade talks to subsystem classes. The subsystem classes don't know the Facade exists and don't talk back through it. It's a simplified front door. Mediator is bidirectional: components talk to the Mediator, and the Mediator coordinates communication between them. All components know the Mediator and register with it. It's a central hub. Use Facade when you want to simplify access to a subsystem from the outside. The subsystem is self-contained and the Facade just provides a convenient entry point. Use Mediator when multiple objects need to communicate with each other and you want to prevent the N×N coupling explosion. Chat rooms are Mediator (users send messages through the room, not directly to each other). API gateways are Facade (the client talks to one endpoint, the gateway routes to microservices). Air traffic control is Mediator (planes coordinate through the tower, not with each other).",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can a class be both a Facade and a Mediator?",
        expectedPoints: [
          "yes — if it provides a simplified interface AND coordinates bidirectional communication",
          "an API gateway that also handles service-to-service orchestration",
          "the distinction is intent, not structure",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies one-way (Facade) vs bidirectional (Mediator)",
      "explains awareness: subsystem doesn't know Facade; components know Mediator",
      "gives concrete examples for each",
      "addresses the overlap case",
    ],
  },
  {
    patternId: "facade",
    slug: "facade-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Facade?",
    modelAnswer:
      "The primary pitfall is that Facades can become God Objects. A well-intentioned OrderFacade starts with placeOrder() and gradually absorbs cancelOrder(), refundOrder(), getOrderHistory(), updateShipping(), generateInvoice() — eventually it knows about every service and becomes a monolithic bottleneck. Discipline: one Facade per use case, not one Facade per subsystem. Second, Facades can become a leaky abstraction — when the simplified interface doesn't expose enough control, clients bypass the Facade and couple directly to subsystem classes, defeating its purpose. Third, Facades can create a maintenance burden: if the subsystem API changes, the Facade must change too, adding an extra layer to update. Fourth, over-Facading: wrapping a subsystem that's already simple adds indirection without benefit. Don't create a Facade for a single class with a clean API. Fifth, Facades can mask poor subsystem design — if the subsystem is hard to use, consider fixing the subsystem rather than papering over it with a Facade. Use Facade when the subsystem is genuinely complex, stable, and used from multiple clients.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you prevent a Facade from becoming a God Object?",
        expectedPoints: [
          "scope each Facade to a specific use case or workflow",
          "Facade should only orchestrate, never contain business logic",
          "if a Facade grows past 5-7 methods, split it",
          "ensure the subsystem is still directly accessible for advanced use cases",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies God Object risk",
      "mentions leaky abstraction problem",
      "discusses when NOT to use Facade",
      "suggests scoping Facades to use cases",
    ],
  },

  // ── Flyweight ───────────────────────────────────────────
  {
    patternId: "flyweight",
    slug: "flyweight-explain",
    question: "Explain the Flyweight pattern in 2 minutes.",
    modelAnswer:
      "Flyweight reduces memory usage by sharing data across many similar objects. The key idea is separating intrinsic state (shared, immutable, context-independent) from extrinsic state (unique, varies per context, passed in at runtime). Consider a text editor rendering a million characters. Without Flyweight, each character object stores: letter, font, size, color, position, paragraph — consuming hundreds of bytes each. With Flyweight, you share the intrinsic state (letter + font + size + color) across all instances of the same character, and pass the extrinsic state (position, paragraph) at render time. A million 'e' characters in Times New Roman 12pt share one Flyweight object. A FlyweightFactory manages the pool: if a Flyweight for ('e', TimesNewRoman, 12, black) exists, it returns it; otherwise it creates and caches one. Real examples: Java's String interning (identical strings share the same object), React's virtual DOM reconciliation (reuses fiber nodes), game engines sharing textures and meshes, and connection pools (shared connection objects). The pattern is essential when you have thousands of nearly-identical objects.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does Java's String interning relate to Flyweight?",
        expectedPoints: [
          "the JVM's string pool is a flyweight factory",
          "identical string literals share the same object in memory",
          "String.intern() explicitly adds a string to the pool",
          "this is why == comparison works for interned strings",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly separates intrinsic from extrinsic state",
      "gives a concrete example (text editor, game, etc.)",
      "explains the FlyweightFactory's role in caching",
      "quantifies the memory savings",
    ],
  },
  {
    patternId: "flyweight",
    slug: "flyweight-vs-singleton",
    question: "When would you use Flyweight vs Singleton?",
    modelAnswer:
      "Singleton ensures exactly one instance of a class exists globally — it controls instance creation. Flyweight shares intrinsic state across many conceptually different objects — it controls memory usage. The confusion arises because both involve 'sharing', but at different levels. A Singleton is one object shared everywhere (one database pool, one logger). Flyweights are many objects that share internal data (1000 character objects sharing 26 flyweight glyphs). A Singleton has identity — it IS the one instance. Flyweights have no individual identity — they're interchangeable within their type. Use Singleton for globally shared resources (configuration, connection pools, caches). Use Flyweight when you have thousands of similar objects and need to reduce memory footprint. You might combine them: a FlyweightFactory is often a Singleton (one factory managing the pool of shared objects). The factory itself is a Singleton; the objects it produces are Flyweights.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can a Flyweight be mutable?",
        expectedPoints: [
          "intrinsic state must be immutable (it's shared)",
          "extrinsic state can change freely (it's per-context)",
          "if you need to mutate shared state, you need Copy-on-Write semantics",
          "mutable shared state leads to subtle bugs across all flyweight users",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes one shared instance (Singleton) from many shared-state instances (Flyweight)",
      "explains identity vs interchangeability",
      "gives appropriate use cases for each",
      "mentions FlyweightFactory as potential Singleton",
    ],
  },
  {
    patternId: "flyweight",
    slug: "flyweight-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Flyweight?",
    modelAnswer:
      "The primary tradeoff is memory vs CPU time. Flyweight saves memory by sharing intrinsic state, but you pay for it with the overhead of separating intrinsic from extrinsic state and looking up flyweights in the factory on every access. If object creation is cheap but lookups are expensive, Flyweight can make things slower. Second, the intrinsic/extrinsic split can be non-obvious: what seems intrinsic today may need to become extrinsic tomorrow (e.g., all 'e' characters were black, but now some need to be red). This requires restructuring the flyweight. Third, debugging is harder because what looks like distinct objects are actually shared — mutating one 'accidentally' affects all references. This leads to subtle bugs if the intrinsic state isn't truly immutable. Fourth, Flyweight adds complexity: the factory, the two-state management, the context passing. Don't optimize prematurely — profile first to confirm memory is actually the bottleneck. Fifth, modern runtimes (V8, JVM) have sophisticated object pooling and GC, so the savings may be smaller than expected. Use Flyweight when profiling shows thousands of similar objects consuming significant memory.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you profile to decide if Flyweight is needed?",
        expectedPoints: [
          "use heap snapshots to identify many similar objects",
          "check if objects share significant immutable data",
          "estimate savings: (shared data size) × (instance count - 1)",
          "compare against the overhead of the factory and context passing",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies memory vs CPU tradeoff",
      "discusses the intrinsic/extrinsic classification difficulty",
      "warns against premature optimization",
      "recommends profiling before applying",
    ],
  },

  // ── Interpreter ─────────────────────────────────────────
  {
    patternId: "interpreter",
    slug: "interpreter-explain",
    question: "Explain the Interpreter pattern in 2 minutes.",
    modelAnswer:
      "Interpreter defines a grammar for a language and an interpreter to evaluate sentences in that language. You represent each grammar rule as a class. Terminal expressions are the atomic elements (numbers, variables). Non-terminal expressions combine other expressions (addition, multiplication, conditionals). Each expression class has an interpret() method that evaluates itself given a context (variable bindings). Consider a simple math expression '(3 + x) * 2' with x=5: you build an AST (Abstract Syntax Tree) — Multiply(Add(Number(3), Variable('x')), Number(2)). Calling interpret({x: 5}) on the root recursively evaluates: Variable('x').interpret() returns 5, Add evaluates to 8, Multiply evaluates to 16. Real examples: regular expression engines, SQL parsers, template languages (Handlebars, Jinja), CSS selectors, and mathematical formula evaluators. The pattern is a natural fit for Domain-Specific Languages (DSLs) where the grammar is small and changes slowly. For complex grammars, use parser generators (ANTLR, PEG.js) instead.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "When should you use a parser generator instead of Interpreter?",
        expectedPoints: [
          "when the grammar has more than 10-15 rules",
          "when performance matters (recursive interpret() is slow for large ASTs)",
          "when you need error reporting and recovery",
          "ANTLR, PEG.js, tree-sitter for complex grammars",
        ],
      },
    ],
    evaluationCriteria: [
      "explains grammar rules as classes",
      "distinguishes terminal from non-terminal expressions",
      "walks through an evaluation example",
      "mentions when NOT to use (complex grammars)",
    ],
  },
  {
    patternId: "interpreter",
    slug: "interpreter-vs-visitor",
    question: "When would you use Interpreter vs Visitor?",
    modelAnswer:
      "Interpreter and Visitor both operate on tree structures but from different angles. Interpreter defines evaluation as part of each node — every expression class has interpret(). The operation (evaluation) is built into the class hierarchy. This is simple but means adding a new operation (like pretty-printing or optimization) requires modifying every expression class. Visitor separates operations from the data structure — you define a Visitor interface with visitAdd(), visitMultiply(), etc. Each expression accepts a visitor and calls the appropriate visit method (double dispatch). Adding a new operation means adding a new Visitor class, not modifying any expression class. Use Interpreter when you have one primary operation (evaluation) and the grammar is small. Use Visitor when you have multiple operations on the same tree (evaluate, optimize, pretty-print, type-check) and want to add operations without modifying the tree classes. In practice, compilers use Visitor extensively: the AST is fixed but operations (type checking, optimization, code generation) multiply. Interpreter is for simple DSLs where evaluation is the only operation.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does TypeScript's compiler use the Visitor pattern?",
        expectedPoints: [
          "AST nodes are defined once (SyntaxKind types)",
          "transformers are visitors that walk the AST and produce modified versions",
          "type checker is a visitor that annotates nodes with types",
          "code emitter is a visitor that produces JavaScript output",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies operation-in-node (Interpreter) vs operation-separated (Visitor)",
      "explains when adding operations is the concern",
      "gives compiler as the canonical Visitor use case",
      "mentions the tradeoff in extensibility dimension",
    ],
  },
  {
    patternId: "interpreter",
    slug: "interpreter-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Interpreter?",
    modelAnswer:
      "The primary pitfall is performance. Each interpret() call recurses through the entire AST, and for complex expressions evaluated millions of times (e.g., in a game loop), this recursive evaluation is orders of magnitude slower than compiled code. The fix is to compile the AST to bytecode or directly to machine instructions, but then you've left the Interpreter pattern behind. Second, grammar complexity scales poorly: each grammar rule is a class, so a language with 50 rules has 50 classes, each with interpret(), toString(), and possibly optimize(). This becomes unwieldy fast. Third, the pattern doesn't handle parsing — it assumes you already have an AST. You still need a parser (recursive descent, PEG, or parser combinator) to convert text to the tree. Fourth, error handling is difficult: when interpretation fails, producing a helpful error message with line numbers and context requires carrying source location information through the entire tree. Fifth, the pattern encourages deep class hierarchies, which are fragile to change. For anything beyond simple configuration DSLs or math expressions, use a proper parser framework.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "What's the difference between interpretation and compilation?",
        expectedPoints: [
          "interpretation evaluates the AST directly at runtime (slow, simple)",
          "compilation transforms the AST to lower-level code ahead of time (fast, complex)",
          "JIT combines both: interpret first, compile hot paths",
          "the Interpreter pattern only covers interpretation, not compilation",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies performance as the primary limitation",
      "mentions grammar complexity scaling",
      "notes the pattern doesn't cover parsing",
      "suggests alternatives for complex grammars",
    ],
  },

  // ── Iterator ────────────────────────────────────────────
  {
    patternId: "iterator",
    slug: "iterator-explain",
    question: "Explain the Iterator pattern in 2 minutes.",
    modelAnswer:
      "Iterator provides a way to access elements of a collection sequentially without exposing the underlying data structure. The collection (Array, Tree, Graph, HashMap) implements a createIterator() method that returns an Iterator with next() and hasNext(). The client loops using the iterator without knowing whether it's traversing an array, a linked list, a tree, or a database cursor. JavaScript has this built in with the Symbol.iterator protocol — any object with [Symbol.iterator]() returning { next(): { value, done } } works with for...of loops, spread syntax, and destructuring. Python uses __iter__ and __next__. Java has java.util.Iterator. The pattern enables: multiple simultaneous traversals of the same collection, different traversal strategies (DFS vs BFS on a tree) as different iterator classes, lazy evaluation (generating elements on demand, not all upfront), and decoupling algorithms from data structures (sort() works on anything iterable). Generators (function*) make implementing iterators trivial — yield each element and the runtime handles the state machine. This eliminated most of the boilerplate that made Iterator tedious in older languages.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How do JavaScript generators simplify Iterator implementation?",
        expectedPoints: [
          "function* automatically returns an Iterator-compatible object",
          "yield pauses execution and resumes on next() call",
          "the runtime manages the state machine (cursor position)",
          "yield* delegates to another iterator for recursive traversal",
        ],
      },
    ],
    evaluationCriteria: [
      "explains sequential access without exposing internals",
      "mentions language-level iterator protocols (JS, Python, Java)",
      "discusses lazy evaluation benefit",
      "connects generators to iterator implementation",
    ],
  },
  {
    patternId: "iterator",
    slug: "iterator-vs-visitor",
    question: "When would you use Iterator vs Visitor?",
    modelAnswer:
      "Iterator and Visitor both traverse data structures, but they control different things. Iterator controls the traversal — the client pulls elements one at a time and decides what to do with each. The operation is external: for (const node of tree) { process(node); }. Visitor controls the operation — the data structure pushes each element to the visitor's typed visit methods. The traversal is internal: tree.accept(myVisitor), and the tree drives the walk. Use Iterator when: you need a generic traversal (any operation), want to compose with standard library functions (map, filter, reduce), need lazy evaluation, or want to abort traversal early (break). Use Visitor when: you need type-safe double dispatch (different code for each node type), the tree has a fixed set of node types, or you want to add many different operations without modifying the tree. In practice, Iterator dominates for simple collections (arrays, maps). Visitor dominates for heterogeneous trees (ASTs, DOM) where each node type needs different handling. Many codebases use both: iterate for simple cases, visit for complex tree processing.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you implement Visitor using Iterator?",
        expectedPoints: [
          "yes, with type checking: for (const node of tree) { if (node instanceof Add) handleAdd(node); }",
          "but this uses instanceof chains, which is fragile and violates OCP",
          "Visitor encapsulates this dispatch cleanly with typed visit methods",
          "Iterator + pattern matching (TypeScript 'in' guards) is a pragmatic middle ground",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes pull-based (Iterator) from push-based (Visitor)",
      "explains external vs internal traversal control",
      "gives clear use cases for each",
      "discusses practical overlap and coexistence",
    ],
  },
  {
    patternId: "iterator",
    slug: "iterator-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Iterator?",
    modelAnswer:
      "The primary pitfall is modification during iteration. If you add or remove elements from a collection while iterating, most iterators produce undefined behavior or throw ConcurrentModificationException (Java). Solutions include: iterating over a copy, using reverse iteration for removals, or collecting indices/keys to modify after iteration. Second, Iterator hides the collection size and random-access capability — you can't index into an iterator or know how many elements remain without consuming them. If you need these, use the collection directly. Third, some iterators are non-rewindable (generators, streams) — once consumed, you can't iterate again without creating a new iterator. This surprises developers who try to iterate twice. Fourth, lazy iterators can have surprising performance profiles: chaining 10 .map().filter() operations looks elegant but creates 10 layers of function calls per element. For hot loops, a single explicit for loop is faster. Fifth, in multi-threaded contexts, external iterators (client-driven) require synchronization, while internal iterators (forEach) can be parallelized by the collection (Java parallel streams). The pattern is so fundamental that it's usually a language feature rather than something you implement manually.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do Java Streams differ from traditional Iterators?",
        expectedPoints: [
          "Streams are lazy and compose operations into a pipeline",
          "Streams support parallelism (parallelStream())",
          "Streams are single-use (can't iterate twice)",
          "Traditional iterators are eager and imperative",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies concurrent modification problem",
      "discusses lazy evaluation surprises",
      "mentions non-rewindable iterators",
      "connects to language-level implementations",
    ],
  },

  // ── Mediator ────────────────────────────────────────────
  {
    patternId: "mediator",
    slug: "mediator-explain",
    question: "Explain the Mediator pattern in 2 minutes.",
    modelAnswer:
      "Mediator centralizes communication between objects so they don't refer to each other directly. Instead of N objects each knowing about N-1 others (N×N coupling), each object knows only the mediator (N×1 coupling). The mediator receives messages and routes them to the appropriate recipients. Consider an airport: without a control tower, every pilot would need to coordinate with every other pilot — chaos with 50 planes. The control tower (Mediator) handles all coordination. Pilots talk only to the tower, and the tower talks to pilots. In code, a chat room is a Mediator: users send messages to the room, which broadcasts to other users. Users don't have direct references to each other. React's state management pattern is mediator-like: components dispatch actions to a store (mediator), which notifies relevant subscribers. The DOM event system uses document as a mediator with event delegation. The key benefit is that you can change the interaction logic (who talks to whom, under what conditions) by modifying only the mediator, not the N participants.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does Redux act as a Mediator?",
        expectedPoints: [
          "components dispatch actions to the store (mediator)",
          "store holds the state and notifies subscribers",
          "components don't communicate directly — they go through the store",
          "middleware (like saga/thunk) can intercept and route messages",
        ],
      },
    ],
    evaluationCriteria: [
      "explains N×N to N×1 coupling reduction",
      "uses the airport/chat room analogy",
      "gives concrete code examples",
      "mentions centralized control of interaction logic",
    ],
  },
  {
    patternId: "mediator",
    slug: "mediator-vs-observer",
    question: "When would you use Mediator vs Observer?",
    modelAnswer:
      "Mediator and Observer both decouple senders from receivers, but at different levels of intelligence. Observer is a dumb broadcast: when the subject changes, ALL subscribers are notified. The subject doesn't know or care what subscribers do with the notification. It's one-to-many, fire-and-forget. Mediator is an intelligent router: it receives messages and decides who should be notified, potentially transforming the message or triggering different actions based on conditions. It encapsulates the coordination logic. Use Observer when you have a simple publish/subscribe relationship with no complex routing: button click handlers, state change notifications, event emitters. Use Mediator when the interaction rules between components are complex: 'when user A sends a message, notify users B and C only if they're online and not blocked' — this logic lives in the Mediator. A good rule of thumb: if the communication logic is complex enough that you'd need if/else chains in your Observer callbacks, extract it into a Mediator. In practice, many event-driven architectures start with Observer and evolve into Mediator as the routing logic grows.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you combine Mediator and Observer?",
        expectedPoints: [
          "yes — the Mediator can use Observer internally to notify participants",
          "participants subscribe to the Mediator (Observer), Mediator routes intelligently (Mediator)",
          "this is exactly what Redux does: Observer-based subscription with Mediator-based dispatching",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes dumb broadcast (Observer) from intelligent routing (Mediator)",
      "explains when routing logic justifies a Mediator",
      "gives concrete examples for each",
      "notes the evolution from Observer to Mediator",
    ],
  },
  {
    patternId: "mediator",
    slug: "mediator-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Mediator?",
    modelAnswer:
      "The primary pitfall is the God Object problem — as you centralize all communication logic, the Mediator grows into a monolithic class that knows about every participant and every interaction rule. A chat application's ChatMediator might start simple but eventually handles message routing, user status, typing indicators, read receipts, moderation, and rate limiting — becoming the most complex class in the system. Mitigate by splitting into focused mediators (ChatMediator, PresenceMediator, ModerationMediator). Second, the mediator becomes a single point of failure — if it crashes, all communication stops. In distributed systems, this means the mediator must be highly available (clustered, replicated). Third, debugging is harder because communication is indirect — you can't just follow a method call from A to B; you have to trace through the mediator's routing logic. Fourth, the pattern can hide poorly designed interfaces — if components communicate through a mediator because their APIs are incompatible, the mediator is a band-aid over bad design. Fifth, performance bottleneck: all messages funnel through one point, which can become a throughput constraint. Use Mediator when the interaction rules between components genuinely need centralized management.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you prevent the Mediator from becoming a God Object?",
        expectedPoints: [
          "split into multiple focused mediators by domain",
          "use the Observer pattern inside the mediator for simple notifications",
          "keep the mediator stateless where possible — let participants own their state",
          "extract complex routing rules into strategy objects",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies God Object risk as primary pitfall",
      "discusses single point of failure",
      "mentions debugging indirection",
      "suggests mitigation strategies",
    ],
  },

  // ── Memento ─────────────────────────────────────────────
  {
    patternId: "memento",
    slug: "memento-explain",
    question: "Explain the Memento pattern in 2 minutes.",
    modelAnswer:
      "Memento captures and externalizes an object's internal state so it can be restored later, without violating encapsulation. Three roles: the Originator (the object whose state you want to save), the Memento (an opaque snapshot of that state), and the Caretaker (manages the collection of mementos, typically an undo stack). The Originator creates a Memento via createMemento() and restores from one via restore(memento). The Caretaker holds mementos but never inspects or modifies their contents — it's a black box to the caretaker. This preserves encapsulation: only the Originator knows its internal structure. Ctrl+Z in every text editor is the classic example — the editor (Originator) creates state snapshots before each edit, the undo manager (Caretaker) stacks them, and undo pops the top memento and restores. Other examples: git stash (saves working directory state), database savepoints (SAVEPOINT/ROLLBACK TO), browser history (back/forward restores page state), and game save files. The pattern is essential for any application that needs undo, redo, or checkpoint/rollback functionality.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How would you implement redo on top of Memento?",
        expectedPoints: [
          "maintain two stacks: undo stack and redo stack",
          "on edit: push current state to undo stack, clear redo stack",
          "on undo: push current state to redo, pop undo and restore",
          "on redo: push current state to undo, pop redo and restore",
        ],
      },
    ],
    evaluationCriteria: [
      "names the three roles: Originator, Memento, Caretaker",
      "explains encapsulation preservation",
      "gives the Ctrl+Z example",
      "mentions other real-world examples",
    ],
  },
  {
    patternId: "memento",
    slug: "memento-vs-command",
    question: "When would you use Memento vs Command for undo?",
    modelAnswer:
      "Both Memento and Command can implement undo, but they work differently. Memento captures full state snapshots. Undo = restore the previous snapshot. Simple to implement, correct by construction (you restore the exact previous state), but expensive in memory if the state is large. Command captures operations with an undo() method. Undo = execute the reverse operation. Lightweight in memory (just store the operation and its parameters), but requires implementing a correct reverse for every command, which can be tricky for complex operations. Use Memento when: state is small and serializable (text editor with a few KB of content), operations are complex and hard to reverse (pixel-level image editing), or you need guaranteed correctness (financial systems). Use Command when: state is large and mostly unchanged per operation (modify one field in a 10MB document), operations have natural inverses (insert→delete, add→subtract), or you need to replay operations (macro recording). In practice, many systems combine both: Command for lightweight undo with Memento as a fallback for operations that are hard to reverse.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does Redux's time-travel debugging relate to these patterns?",
        expectedPoints: [
          "Redux uses both: actions are Commands, state snapshots are Mementos",
          "time-travel stores every state snapshot (Memento approach)",
          "replay applies actions to initial state (Command approach)",
          "dev tools toggle between snapshot and replay strategies",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes state snapshots (Memento) from reversible operations (Command)",
      "identifies memory vs implementation complexity tradeoff",
      "gives criteria for choosing each",
      "mentions hybrid approach",
    ],
  },
  {
    patternId: "memento",
    slug: "memento-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Memento?",
    modelAnswer:
      "The primary tradeoff is memory consumption. If the Originator's state is large (e.g., a 10MB image), and you save a memento after every brush stroke, you'll exhaust memory quickly. Mitigations: incremental mementos (store only the diff from the previous state), compression, limiting the undo stack depth, or using Command pattern for operations with cheap inverses. Second, serialization complexity: if the state contains circular references, closures, or non-serializable objects, creating a deep copy for the memento is non-trivial. JSON.parse(JSON.stringify(obj)) works for simple objects but fails on dates, maps, sets, and circular refs. Use structuredClone() in modern JS. Third, performance: creating deep copies on every operation introduces latency. For real-time applications (games, collaborative editors), this can be noticeable. Persistent data structures (immutable.js, Immer) solve this by sharing unchanged subtrees between snapshots. Fourth, the Caretaker doesn't know when mementos become invalid — if the Originator's class changes (new fields added), old mementos may not restore correctly. Version the memento format. Fifth, maintaining both undo AND redo stacks correctly is error-prone — be meticulous about when to clear the redo stack.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do persistent data structures help with Memento?",
        expectedPoints: [
          "unchanged parts are shared between versions (structural sharing)",
          "each 'snapshot' is O(log n) in size, not O(n)",
          "Immer in JavaScript uses Proxy to create cheap structural copies",
          "Git uses similar concepts (shared tree objects between commits)",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies memory consumption as primary concern",
      "discusses serialization challenges",
      "mentions persistent data structures as optimization",
      "addresses memento versioning",
    ],
  },

  // ── Multi-Agent Orchestration ───────────────────────────
  {
    patternId: "multi-agent-orchestration",
    slug: "multi-agent-orchestration-explain",
    question: "Explain the Multi-Agent Orchestration pattern in 2 minutes.",
    modelAnswer:
      "Multi-Agent Orchestration coordinates multiple AI specialist agents to solve complex tasks that no single agent could handle alone. An Orchestrator (or supervisor) receives a task, decomposes it into subtasks, routes each to the best-suited specialist agent, collects results, and synthesizes a final answer. Each agent has a specific capability: a Coder agent writes code, a Researcher agent searches the web, a Reviewer agent checks for bugs. The orchestrator maintains shared memory (conversation history, intermediate results) that agents can read and write. Unlike simple tool use (one model, one tool call), orchestration handles multi-step workflows with conditional routing — if the code agent's output fails tests, route back to the code agent with error context. Real examples: Claude Code (orchestrates file reading, code writing, terminal commands), AutoGPT and CrewAI (multi-agent frameworks), and GitHub Copilot Workspace (plan → implement → review pipeline). The key design decisions are: centralized vs decentralized coordination, shared vs isolated memory, and sequential vs parallel agent execution.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the difference between centralized and decentralized orchestration?",
        expectedPoints: [
          "centralized: one supervisor routes all tasks and collects results",
          "decentralized: agents communicate peer-to-peer, passing tasks directly",
          "centralized is simpler but creates a bottleneck",
          "decentralized is more resilient but harder to debug and coordinate",
        ],
      },
    ],
    evaluationCriteria: [
      "explains orchestrator decomposing tasks and routing to specialists",
      "mentions shared memory between agents",
      "gives real-world AI examples",
      "identifies key design decisions",
    ],
  },
  {
    patternId: "multi-agent-orchestration",
    slug: "multi-agent-orchestration-vs-mediator",
    question: "When would you use Multi-Agent Orchestration vs Mediator?",
    modelAnswer:
      "Multi-Agent Orchestration and Mediator share the hub-and-spoke communication structure, but they differ in intelligence and adaptability. Mediator coordinates generic objects with fixed interaction rules — when button A is clicked, enable text field B. The rules are deterministic, coded in advance, and the mediator has no understanding of what the components do. Multi-Agent Orchestration coordinates AI agents with dynamic, context-dependent routing. The orchestrator understands the task, reasons about which agent to invoke, and adapts based on intermediate results. It can retry, reroute, and adjust the plan. Use Mediator when you have predictable, rule-based coordination between UI components or services. Use Multi-Agent Orchestration when tasks require reasoning about decomposition, agents have genuine intelligence (LLMs), and the workflow must adapt to intermediate results. The gap is shrinking: sophisticated mediators with strategy patterns approach orchestration, and simple orchestrators with fixed workflows are essentially mediators. The distinguishing factor is whether the coordinator reasons about the task or follows predetermined rules.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Could you implement Multi-Agent Orchestration with Mediator as the base?",
        expectedPoints: [
          "yes — the orchestrator IS a mediator with added reasoning capability",
          "the agents register with the orchestrator like Mediator colleagues",
          "add LLM-based routing instead of fixed rules",
          "this is how many frameworks like LangGraph work internally",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies shared structure but different intelligence levels",
      "distinguishes fixed rules (Mediator) from reasoning-based routing (MAO)",
      "explains when dynamic adaptation justifies the complexity",
      "connects to real frameworks",
    ],
  },
  {
    patternId: "multi-agent-orchestration",
    slug: "multi-agent-orchestration-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Multi-Agent Orchestration?",
    modelAnswer:
      "The primary pitfall is compounding errors. Each agent can make mistakes, and in a multi-step pipeline, errors compound — a researcher agent retrieves wrong information, the coder agent builds on it, the reviewer agent doesn't catch the foundational error. Each step adds latency and cost (LLM calls aren't free). Second, coordination overhead: the orchestrator's routing decisions consume tokens and time. For simple tasks, a single capable agent outperforms an orchestrated team because the coordination cost exceeds the specialization benefit. Third, debugging is extremely difficult — when the final output is wrong, you must trace through multiple agent invocations, shared memory states, and routing decisions to find the failure point. Fourth, memory management: shared context grows with each agent's output, eventually exceeding context windows. You need summarization, relevance filtering, or vector store retrieval. Fifth, non-determinism: the same input can produce different agent routing and different final outputs on each run. This makes testing nearly impossible without mocking agent responses. Use orchestration when the task genuinely requires multiple specialized capabilities and the quality improvement justifies the latency, cost, and complexity.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you test a multi-agent system?",
        expectedPoints: [
          "mock individual agent responses for deterministic testing",
          "test each agent in isolation with known inputs/outputs",
          "use evaluation frameworks (LLM-as-judge) for end-to-end quality",
          "trace-based debugging to inspect the full agent chain",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies compounding errors across agent steps",
      "discusses coordination overhead vs benefit",
      "mentions debugging difficulty",
      "addresses memory/context management",
    ],
  },

  // ── Producer-Consumer ───────────────────────────────────
  {
    patternId: "producer-consumer",
    slug: "producer-consumer-explain",
    question: "Explain the Producer-Consumer pattern in 2 minutes.",
    modelAnswer:
      "Producer-Consumer decouples data production from data consumption using a shared buffer (queue). Producers generate work items and place them in the buffer. Consumers take items from the buffer and process them. The buffer absorbs the difference in speed between producers and consumers. If the producer is faster, the buffer fills up; if the consumer is faster, the buffer empties. This decoupling means producers and consumers don't need to know about each other and can run at different speeds, on different threads, or even on different machines. The classic implementation uses a bounded blocking queue: producers block when the queue is full (backpressure), consumers block when it's empty. In Node.js, this is implemented with streams (readable pipe to writable), message queues (RabbitMQ, SQS), or channels (BullMQ job queues). Real examples: print spooler (application produces print jobs, printer consumes), logging (code produces log entries, log writer flushes to disk), web servers (accept connections into a queue, worker threads process them), and ETL pipelines (extract produces, transform consumes and produces, load consumes).",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What happens when the buffer is full and another producer tries to add?",
        expectedPoints: [
          "blocking: producer waits until space is available",
          "dropping: newest or oldest item is discarded",
          "backpressure: signal the producer to slow down",
          "overflow: dynamic buffer expansion (risky — can exhaust memory)",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the buffer as the decoupling mechanism",
      "mentions speed difference absorption",
      "gives concrete examples (message queues, streams, print spooler)",
      "discusses bounded vs unbounded buffers",
    ],
  },
  {
    patternId: "producer-consumer",
    slug: "producer-consumer-vs-observer",
    question: "When would you use Producer-Consumer vs Observer?",
    modelAnswer:
      "Producer-Consumer and Observer both decouple senders from receivers but handle flow control differently. Observer is synchronous push with no buffer: when the subject changes, observers are notified immediately and synchronously (in most implementations). There's no queue, no backpressure, and no speed decoupling. If an observer is slow, it blocks the subject. Producer-Consumer is asynchronous pull with a buffer: producers and consumers run independently, and the buffer handles speed differences. Consumers pull at their own pace. Use Observer when: notifications should be immediate and synchronous, observers are fast (UI updates, event handlers), and you need one-to-many broadcast. Use Producer-Consumer when: processing takes significant time, producers and consumers run at different speeds, you need backpressure and flow control, or work items should be processed exactly once (not broadcast to all). Think of it this way: Observer broadcasts a notification to all listeners. Producer-Consumer distributes work items to one consumer each. Email notification (every subscriber gets it) = Observer. Task queue (each task is processed by one worker) = Producer-Consumer.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What's the relationship between Producer-Consumer and reactive streams (RxJS)?",
        expectedPoints: [
          "reactive streams combine Observer (push-based) with backpressure (Producer-Consumer)",
          "Observables push events, but operators like buffer/throttle add flow control",
          "this hybrid is why reactive programming is powerful for async data flows",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes synchronous push (Observer) from asynchronous pull (P-C)",
      "identifies the buffer as the key difference",
      "explains broadcast (Observer) vs distribute (P-C)",
      "gives clear criteria for choosing each",
    ],
  },
  {
    patternId: "producer-consumer",
    slug: "producer-consumer-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Producer-Consumer?",
    modelAnswer:
      "The primary pitfall is buffer sizing. Too small and producers are frequently blocked, reducing throughput. Too large and you consume excessive memory, and if the process crashes, all buffered items are lost. Finding the right size requires load testing. Second, message ordering: most queues are FIFO, but with multiple consumers processing in parallel, completion order differs from enqueue order. If ordering matters, you need partitioned queues (Kafka partitions) or sequence numbers. Third, exactly-once processing is hard. If a consumer crashes after processing but before acknowledging, the message is redelivered — you get at-least-once. Making consumers idempotent is essential. Fourth, visibility into the queue is limited — if items are piling up, you need monitoring and alerting on queue depth. Dead letter queues handle items that repeatedly fail processing. Fifth, in-memory queues don't survive process restarts — use persistent queues (Redis, RabbitMQ, SQS) for durability. Sixth, the pattern adds latency: items spend time in the buffer. For real-time systems, direct invocation may be better. Use Producer-Consumer when throughput and decoupling matter more than latency.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How does Kafka handle the ordering problem?",
        expectedPoints: [
          "messages within a partition are strictly ordered",
          "messages across partitions have no ordering guarantee",
          "use a partition key to ensure related messages go to the same partition",
          "each partition is consumed by exactly one consumer in a consumer group",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies buffer sizing difficulty",
      "discusses exactly-once processing challenge",
      "mentions dead letter queues for failed items",
      "addresses durability and monitoring concerns",
    ],
  },

  // ── Prototype ───────────────────────────────────────────
  {
    patternId: "prototype",
    slug: "prototype-explain",
    question: "Explain the Prototype pattern in 2 minutes.",
    modelAnswer:
      "Prototype creates new objects by cloning an existing instance (the prototype) rather than calling a constructor. The Prototype interface has a clone() method; each concrete class implements it to return a copy of itself. This is useful when: object creation is expensive (e.g., loading from database, complex computation), you need many similar objects with slight variations (clone and modify), or you want to avoid coupling to concrete classes (clone via the interface without knowing the specific type). JavaScript's entire object system is prototype-based: Object.create(proto) creates a new object with proto as its prototype. The spread operator { ...obj } and structuredClone(obj) are practical cloning mechanisms. In game development, Prototype is everywhere: enemy templates are cloned to spawn instances, each with modified health/position. Unity's Instantiate() clones prefabs. React's element reuse in reconciliation uses similar ideas. The key decision is shallow vs deep clone: shallow copies share nested references (fast but dangerous), deep copies duplicate everything (safe but slower). JavaScript's structuredClone() does deep cloning with circular reference support.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does JavaScript's prototypal inheritance relate to the Prototype pattern?",
        expectedPoints: [
          "JavaScript objects delegate to prototypes via the prototype chain",
          "Object.create() creates an object that inherits from the given prototype",
          "this is delegation, not cloning — the GoF Prototype creates independent copies",
          "JavaScript's prototype chain is about sharing behavior, GoF Prototype is about creating independent instances",
        ],
      },
    ],
    evaluationCriteria: [
      "explains cloning as an alternative to construction",
      "identifies when it's useful (expensive creation, similar objects)",
      "distinguishes shallow from deep cloning",
      "mentions JavaScript's prototype-based object system",
    ],
  },
  {
    patternId: "prototype",
    slug: "prototype-vs-factory-method",
    question: "When would you use Prototype vs Factory Method?",
    modelAnswer:
      "Prototype creates objects by cloning existing instances. Factory Method creates objects by calling a method that subclasses override. The key difference is the source of the new object: Prototype copies from a live instance, Factory Method invokes construction logic. Use Prototype when: you already have a configured instance and want variations of it (clone a complex configuration, tweak a few fields), object creation is expensive and cloning is cheaper (database-loaded templates), or you need to create objects without knowing their concrete type (clone through the Prototype interface). Use Factory Method when: object creation involves complex logic (validation, dependency wiring, multi-step initialization), you want subclasses to control which class is instantiated, or there's no suitable existing instance to clone from. In practice, Prototype is more common in game development (clone prefabs) and configuration management (clone a base config, override specific fields). Factory Method is more common in frameworks and libraries where creation logic is the extension point. They can combine: a factory that maintains a registry of prototypes and clones the appropriate one based on a key.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What is a Prototype Registry?",
        expectedPoints: [
          "a centralized store of pre-configured prototype instances",
          "clients look up a prototype by key and clone it",
          "avoids subclassing — new types are added by registering new prototypes",
          "combines Prototype with a simple factory/registry pattern",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes cloning (Prototype) from construction logic (FM)",
      "gives clear criteria for choosing each",
      "mentions the registry pattern combination",
      "provides concrete domain examples",
    ],
  },
  {
    patternId: "prototype",
    slug: "prototype-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Prototype?",
    modelAnswer:
      "The primary pitfall is the shallow vs deep copy confusion. If you shallow-clone an object with nested references, the clone and original share the same nested objects. Mutating a nested field in the clone mutates the original — a subtle and dangerous bug. Always be explicit about clone depth. Second, implementing clone() correctly for complex objects is hard: circular references, closures, event listeners, file handles, database connections — none of these clone naturally. You must decide what to clone, what to share, and what to reinitialize. Third, cloning bypasses constructors, which means any validation, side effects, or initialization logic in the constructor is skipped. If the constructor registers the object in a global registry, clones aren't registered. Fourth, in garbage-collected languages, Prototype can increase memory pressure if you clone large object graphs frequently. Consider flyweight or structural sharing instead if most of the object is unchanged. Fifth, the pattern is less useful in languages with cheap object creation — if construction is already fast, cloning adds complexity without performance benefit. Profile before choosing Prototype over direct construction.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How does structuredClone() handle edge cases?",
        expectedPoints: [
          "handles circular references correctly",
          "supports Map, Set, Date, RegExp, ArrayBuffer",
          "does NOT clone functions, DOM nodes, or Error objects",
          "throws on non-cloneable types rather than silently failing",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies shallow vs deep copy as the main pitfall",
      "discusses constructor bypass consequences",
      "mentions non-cloneable resources",
      "recommends profiling before adopting",
    ],
  },

  // ── Rate Limiter ────────────────────────────────────────
  {
    patternId: "rate-limiter",
    slug: "rate-limiter-explain",
    question: "Explain the Rate Limiter pattern in 2 minutes.",
    modelAnswer:
      "Rate Limiter controls the frequency of operations to protect resources from overload. It enforces a maximum number of requests within a time window, rejecting or delaying excess requests. The most common algorithms are: Token Bucket (tokens are added at a fixed rate; each request consumes a token; no tokens = rejected — allows bursts up to bucket size), Sliding Window (count requests in a rolling time window — precise but memory-intensive), Fixed Window (count requests in fixed time intervals like 'per minute' — simple but has the boundary burst problem where 2x the limit fires at window boundaries), and Leaky Bucket (requests queue and drain at a fixed rate — smooths traffic but adds latency). In practice, rate limiting applies at multiple levels: per-user (API keys), per-IP, per-endpoint, and globally. HTTP APIs return 429 Too Many Requests with a Retry-After header. Real implementations: Express rate-limit middleware, Nginx limit_req, Redis-backed distributed rate limiters (using INCR + EXPIRE), API gateways (Kong, AWS API Gateway), and cloud services' built-in quotas.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the boundary burst problem with Fixed Window?",
        expectedPoints: [
          "100 requests at 0:59 + 100 requests at 1:01 = 200 in 2 seconds",
          "both windows see only 100 requests (within limit)",
          "but the actual rate was 100/second, double the intended limit",
          "Sliding Window fixes this by counting across the boundary",
        ],
      },
    ],
    evaluationCriteria: [
      "names at least 3 algorithms (token bucket, sliding window, fixed window)",
      "explains the basic mechanism (count + reject/delay)",
      "mentions multi-level rate limiting",
      "gives real implementation examples",
    ],
  },
  {
    patternId: "rate-limiter",
    slug: "rate-limiter-vs-bulkhead",
    question: "When would you use Rate Limiter vs Bulkhead?",
    modelAnswer:
      "Rate Limiter and Bulkhead both protect systems from overload, but they control different dimensions. Rate Limiter controls the rate of incoming requests — 'no more than 100 requests per second to this endpoint.' It's about flow control over time. Bulkhead controls resource allocation — 'this service gets max 20 connections from the pool.' It's about isolation between consumers. Use Rate Limiter when you need to protect a service from too many requests regardless of source: public APIs, login endpoints, expensive search queries. The protection is temporal (per time window). Use Bulkhead when you need to prevent one consumer or dependency from monopolizing shared resources: thread pools, connection pools, memory. The protection is spatial (partitioned resources). They complement each other: Rate Limiter on the API gateway limits total incoming traffic. Bulkhead inside the service ensures that calls to a slow dependency don't consume all threads. Example: your API allows 1000 requests/second (Rate Limiter), and internally allocates 50 threads to database calls and 20 threads to recommendation service calls (Bulkhead).",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Where in the architecture stack should you apply each?",
        expectedPoints: [
          "Rate Limiter: at the edge (API gateway, load balancer) and per-user",
          "Bulkhead: inside the service, per-dependency",
          "Rate Limiter is public-facing; Bulkhead is internal",
          "both can be applied at multiple layers for defense-in-depth",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes temporal (Rate Limiter) from spatial (Bulkhead) protection",
      "explains they're complementary, not alternatives",
      "gives a concrete combined architecture example",
      "identifies appropriate placement in the stack",
    ],
  },
  {
    patternId: "rate-limiter",
    slug: "rate-limiter-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Rate Limiter?",
    modelAnswer:
      "The primary pitfall is choosing the wrong limit. Too aggressive and legitimate users hit 429 errors, degrading UX. Too permissive and the rate limiter fails to protect. The right limit depends on the downstream service's capacity and the expected traffic pattern — which requires load testing. Second, distributed rate limiting is hard: if you have 10 server instances, a per-instance limit of 100/s means the global limit is 1000/s, not 100/s. Use a centralized counter (Redis INCR + EXPIRE) for accurate global limiting, but this adds a Redis call to every request (latency). Third, the 'thundering herd' after a rate limit window resets: clients that were throttled all retry simultaneously. Mitigate with jittered retry-after times. Fourth, rate limiting doesn't distinguish between important and unimportant requests — a critical checkout request gets the same 429 as a browsing request. Priority-based rate limiting is more complex but necessary for critical paths. Fifth, rate limiting only works if clients respect 429 responses. Misbehaving clients require additional defense (IP banning, circuit breaker). Use rate limiting as the first line of defense, but combine with authentication, quotas, and monitoring for comprehensive protection.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you implement distributed rate limiting with Redis?",
        expectedPoints: [
          "use Redis INCR with EXPIRE for fixed-window counting",
          "use Redis sorted sets for sliding window (ZADD + ZCOUNT)",
          "Lua scripts for atomic token bucket operations",
          "handle Redis failures gracefully (fail open or use local fallback)",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies limit calibration difficulty",
      "discusses distributed rate limiting challenge",
      "mentions priority-based limiting need",
      "suggests Redis-based implementation",
    ],
  },

  // ── ReAct Pattern ───────────────────────────────────────
  {
    patternId: "react-pattern",
    slug: "react-pattern-explain",
    question: "Explain the ReAct pattern in 2 minutes.",
    modelAnswer:
      "ReAct (Reasoning + Acting) is an AI agent pattern where an LLM interleaves reasoning (Thought) with external actions (Act) and observations (Observe) in a loop until it reaches an answer. The cycle is: Thought (reason about what to do next), Act (call a tool — search, calculator, API), Observe (read the tool's result), repeat. This differs from simple chain-of-thought (reasoning only, no actions) and simple tool use (action only, no reasoning). A ReAct agent tackling 'What is the GDP of the country that hosted the 2024 Olympics?' would: Thought: 'I need to find which country hosted the 2024 Olympics.' Act: search('2024 Olympics host country'). Observe: 'France hosted the 2024 Olympics in Paris.' Thought: 'Now I need France's GDP.' Act: search('France GDP 2024'). Observe: '$2.78 trillion.' Thought: 'I have the answer.' Answer: '$2.78 trillion.' The key insight is that explicit reasoning steps before each action dramatically improve accuracy — the model explains why it's taking each action, catching errors in its reasoning. Original paper by Yao et al. (2022) showed ReAct outperformed both reasoning-only and action-only baselines.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "Why does adding explicit Thought steps improve performance?",
        expectedPoints: [
          "forces the model to plan before acting (reduces random tool calls)",
          "makes reasoning transparent and auditable",
          "allows the model to detect and correct reasoning errors",
          "mirrors how humans solve problems: think, then act, then observe",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the Thought→Act→Observe loop",
      "distinguishes from chain-of-thought and simple tool use",
      "walks through a concrete example",
      "mentions the Yao et al. paper or academic origin",
    ],
  },
  {
    patternId: "react-pattern",
    slug: "react-pattern-vs-tool-use",
    question: "When would you use ReAct vs Tool Use?",
    modelAnswer:
      "Tool Use is a single-shot pattern: the LLM decides to call one tool, gets the result, and incorporates it into its response. There's no iterative reasoning loop — just invoke and return. ReAct is an iterative multi-step pattern: the LLM reasons about what to do, takes an action, observes the result, and decides what to do next, potentially taking many actions in sequence. Use Tool Use when: the task requires a single lookup or computation (get weather, calculate math, query a database), the answer is directly available from one tool call, and you want low latency (one round trip). Use ReAct when: the task requires multiple steps of research and reasoning, the next action depends on the result of the previous one, or the problem requires exploration (searching, then refining, then verifying). The tradeoff is latency and cost vs capability. Tool Use is fast and cheap (one LLM call + one tool call). ReAct is slower and more expensive (multiple LLM calls + multiple tool calls) but can solve complex multi-step problems. Most modern AI applications use a hybrid: simple queries use tool use, complex queries trigger a ReAct loop.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does Claude's tool use relate to these patterns?",
        expectedPoints: [
          "Claude's native tool use is the Tool Use pattern (single-shot)",
          "Claude Code's agentic loop is closer to ReAct (multi-step reasoning + actions)",
          "the agentic loop interleaves reasoning with file reads, edits, and commands",
          "extended thinking acts as the explicit Thought step",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes single-shot (Tool Use) from iterative (ReAct)",
      "explains when iteration is necessary",
      "discusses latency/cost tradeoff",
      "mentions hybrid approaches",
    ],
  },
  {
    patternId: "react-pattern",
    slug: "react-pattern-tradeoffs",
    question: "What are the tradeoffs and pitfalls of ReAct?",
    modelAnswer:
      "The primary pitfall is infinite loops. If the LLM's reasoning leads to repeated tool calls without progress (searching for the same thing differently each time), the loop never terminates. You need a maximum iteration count, cost budget, and loop detection (comparing recent Thought steps for repetition). Second, latency compounds: each Thought→Act→Observe cycle requires an LLM call + a tool call. A 5-step chain takes 5× the time and cost of a single tool call. Users waiting for an answer may time out. Third, error propagation: if an early tool call returns incorrect information, all subsequent reasoning is built on a wrong foundation. The model may not recognize the error. Mitigate with verification steps ('let me double-check this'). Fourth, the Thought step can be verbose and meandering, consuming tokens without adding value. Structured prompting ('concise thought, then specific action') helps. Fifth, tool selection quality: the model may use the wrong tool for the job, wasting a cycle. Good tool descriptions and few-shot examples improve selection. Despite these issues, ReAct is the dominant agentic pattern because the alternative — single-shot tool use — simply can't solve multi-step problems.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you prevent infinite loops in a ReAct agent?",
        expectedPoints: [
          "set a maximum number of iterations (e.g., 10)",
          "set a cost/token budget",
          "detect repeated tool calls with same arguments",
          "add a 'give up and explain why' escape hatch",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies infinite loop risk",
      "discusses latency and cost compounding",
      "mentions error propagation from early steps",
      "suggests concrete mitigations",
    ],
  },

  // ── Repository ──────────────────────────────────────────
  {
    patternId: "repository",
    slug: "repository-explain",
    question: "Explain the Repository pattern in 2 minutes.",
    modelAnswer:
      "Repository provides a collection-like interface for accessing domain objects, abstracting the data access layer behind a clean API. Instead of writing SQL queries or ORM calls throughout your business logic, you call userRepository.findById(id), userRepository.save(user), userRepository.findByEmail(email). The repository encapsulates all data access: query construction, connection management, mapping between database rows and domain objects. The business logic depends on the repository interface, not the database — making it testable (mock the repository), portable (swap PostgreSQL for MongoDB), and clean (no SQL in service classes). In practice, the interface defines: findById, findAll, find (with criteria), save, update, delete. The implementation can use raw SQL, an ORM (Drizzle, Prisma, Hibernate), or even an in-memory map for testing. Spring Data JPA generates repository implementations automatically from interface definitions. NestJS and TypeORM use similar patterns. The key distinction from DAO (Data Access Object): Repository works with domain objects and domain-level queries; DAO works with database rows and CRUD operations.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does the Repository pattern relate to the Unit of Work pattern?",
        expectedPoints: [
          "Unit of Work tracks all changes made during a business transaction",
          "Repository handles individual entity persistence",
          "Unit of Work coordinates multiple repositories to commit atomically",
          "most ORMs implement both: Prisma transactions, EF DbContext",
        ],
      },
    ],
    evaluationCriteria: [
      "explains collection-like interface over data access",
      "mentions testability via mocking the repository",
      "distinguishes from DAO",
      "gives ORM/framework examples",
    ],
  },
  {
    patternId: "repository",
    slug: "repository-vs-dao",
    question: "When would you use Repository vs DAO/Active Record?",
    modelAnswer:
      "Repository, DAO, and Active Record are three data access patterns at different abstraction levels. Active Record: each domain object IS a database row — User.find(1), user.save(). The object contains both domain logic and persistence. Simplest approach, used by Rails, Django ORM, Sequelize. DAO (Data Access Object): a separate class that maps directly to database tables — UserDAO with insert, update, delete, findById. It's CRUD-oriented and table-centric. Works at the database level, not the domain level. Repository: operates at the domain level — findActiveUsersByRole('admin') returns fully-hydrated domain objects. It encapsulates complex queries and can aggregate data from multiple tables into a single domain object. Use Active Record for simple CRUD apps where domain objects map 1:1 to tables. Use DAO when you need to separate persistence from domain objects but queries are simple table operations. Use Repository when your domain model differs from your database schema, queries involve complex aggregation or filtering, or you need testability and database portability. In practice, modern ORMs blur these lines — Prisma acts as both DAO and Repository depending on how you use it.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What's the Generic Repository anti-pattern?",
        expectedPoints: [
          "a single Repository<T> with only CRUD methods (findById, save, delete)",
          "doesn't add domain-specific queries — defeats the purpose",
          "callers end up building queries outside the repository",
          "better: domain-specific repositories with meaningful query methods",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes all three patterns (Active Record, DAO, Repository)",
      "identifies abstraction level differences",
      "gives clear criteria for choosing each",
      "mentions the Generic Repository anti-pattern",
    ],
  },
  {
    patternId: "repository",
    slug: "repository-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Repository?",
    modelAnswer:
      "The primary pitfall is abstraction leakage. Repository promises database independence, but in practice, queries are shaped by the database's capabilities — a full-text search query on PostgreSQL looks different from MongoDB. The abstraction holds for simple queries but breaks for complex, database-specific features. Second, the 'repository per entity' approach leads to an explosion of repository classes, each with repetitive CRUD boilerplate. Generic repositories reduce this but sacrifice domain expressiveness. Third, the pattern can become a performance trap: the repository returns fully-hydrated domain objects when the caller might only need one field. Without lazy loading or projection support, you over-fetch. Fourth, complex cross-entity queries don't fit neatly into a single repository — 'find orders with items from discontinued products' spans OrderRepository and ProductRepository. The solution is a specification/criteria pattern or dedicated query services. Fifth, testing repositories requires either mocking (which doesn't test query correctness) or integration tests (which are slow). Use Repository when domain complexity justifies the abstraction. For simple CRUD, it's overhead.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How does the Specification pattern solve cross-entity queries?",
        expectedPoints: [
          "specifications are composable query objects (AND, OR, NOT)",
          "each specification encapsulates a query condition",
          "the repository accepts specifications and translates to database queries",
          "enables complex queries without bloating the repository interface",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies abstraction leakage as primary issue",
      "discusses over-fetching and performance",
      "mentions cross-entity query difficulty",
      "balances when the pattern is worth it",
    ],
  },

  // ── Retry ───────────────────────────────────────────────
  {
    patternId: "retry",
    slug: "retry-explain",
    question: "Explain the Retry pattern in 2 minutes.",
    modelAnswer:
      "Retry handles transient failures by automatically re-executing a failed operation. When an HTTP call returns 503 or a database connection times out, instead of failing immediately, you wait and try again — the issue is likely temporary. The key components are: max attempts (typically 2-3 retries), backoff strategy (how long to wait between retries), and retry conditions (which errors are retryable). Backoff strategies: constant (wait 1 second each time — simple but can create synchronized retries), exponential (1s, 2s, 4s, 8s — reduces load on the failing service), and exponential with jitter (add random variation to spread retry timing across clients — prevents thundering herd). Retry conditions: retry on 503, 429, connection timeout, lock contention. Don't retry on 400 Bad Request or 401 Unauthorized — these won't succeed on retry. Real implementations: axios-retry, resilience4j Retry, Polly RetryPolicy, AWS SDK built-in retry. In Node.js, a simple retry wrapper: call the function, catch retryable errors, sleep with exponential backoff, repeat up to max attempts, then throw.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "Why is jitter important in backoff strategies?",
        expectedPoints: [
          "without jitter, all clients retry at the same intervals",
          "synchronized retries create a 'thundering herd' hitting the server simultaneously",
          "jitter spreads retries randomly over the backoff window",
          "full jitter: random(0, backoff). Equal jitter: backoff/2 + random(0, backoff/2)",
        ],
      },
    ],
    evaluationCriteria: [
      "explains transient failure handling",
      "names backoff strategies (constant, exponential, jitter)",
      "specifies which errors are retryable vs not",
      "gives library/framework examples",
    ],
  },
  {
    patternId: "retry",
    slug: "retry-vs-circuit-breaker",
    question: "When would you use Retry vs Circuit Breaker?",
    modelAnswer:
      "Retry handles transient, short-lived failures by trying again. Circuit Breaker handles sustained, long-lived failures by stopping attempts entirely. They work at different time scales: Retry acts within a single request lifecycle (2-3 attempts over seconds). Circuit Breaker acts across many requests over minutes (trip after N failures, wait before probing). The critical danger: Retry without Circuit Breaker creates retry storms. If a service is down and 1000 clients each retry 3 times, the failing service gets 3000 requests — amplifying the overload. Circuit Breaker prevents this: once the failure threshold is reached, all clients stop retrying. The composition order matters: Retry wraps the actual call (handles transient blips), Circuit Breaker wraps the Retry (handles sustained failures). In code: circuitBreaker.execute(() => retry(3, () => httpCall())). If the call fails 3 retries, that counts as one Circuit Breaker failure. After enough such failures, the circuit opens and retries stop. Libraries like resilience4j and Polly make this composition declarative.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "What's the retry amplification problem in microservices?",
        expectedPoints: [
          "service A retries 3x to service B, which retries 3x to service C",
          "one failure in C causes 3×3 = 9 requests from A",
          "with N layers of retries, the amplification is exponential",
          "solution: only retry at the edge, not at every layer",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes transient (Retry) from sustained (Circuit Breaker) failures",
      "explains the retry storm danger",
      "describes correct composition order",
      "mentions retry amplification in microservices",
    ],
  },
  {
    patternId: "retry",
    slug: "retry-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Retry?",
    modelAnswer:
      "The primary pitfall is retrying non-idempotent operations. If a POST /createOrder times out but the server actually processed it, retrying creates a duplicate order. Only retry idempotent operations (GET, PUT, DELETE with idempotency keys) or use idempotency tokens (send a unique request ID; the server deduplicates). Second, retry amplification in microservice chains: if each layer retries 3 times, a 4-layer chain creates 3^4 = 81 requests from one client request. Only retry at the outermost layer, or use retry budgets (limit total retry attempts across the chain). Third, retrying can make things worse: if the server is overloaded, retries add more load. Without backoff and jitter, retries can trigger cascading failures. Fourth, unbounded retries with no max attempts lead to requests hanging indefinitely. Always set max attempts AND a total timeout. Fifth, logging and monitoring: if retries are silent, you miss the signal that a dependency is degraded. Log retry attempts and alert on retry rate increases. Sixth, retrying masks bugs — if a request consistently fails on retry, the error might not be transient. Set retry limits and escalate persistent failures to Circuit Breaker or alerting.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do idempotency keys prevent duplicate operations?",
        expectedPoints: [
          "client generates a unique key per operation and sends it with each request",
          "server stores the key and result; on duplicate key, returns the cached result",
          "this makes any operation safely retryable, even POST",
          "Stripe uses Idempotency-Key header for this purpose",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies non-idempotent retry danger",
      "explains retry amplification in distributed systems",
      "discusses the risk of retrying making things worse",
      "recommends idempotency keys",
    ],
  },

  // ── Saga ────────────────────────────────────────────────
  {
    patternId: "saga",
    slug: "saga-explain",
    question: "Explain the Saga pattern in 2 minutes.",
    modelAnswer:
      "Saga manages distributed transactions across multiple services without a central coordinator holding locks. Instead of one ACID transaction spanning databases, Saga breaks it into a sequence of local transactions, each with a compensating action that undoes its effect. If step 3 of 5 fails, compensating actions for steps 2 and 1 execute in reverse order — rolling back the distributed operation. Two orchestration styles: Choreography (event-driven) — each service publishes an event that triggers the next; no central controller. Works well for simple, linear flows. Orchestration (command-driven) — a Saga orchestrator sends commands to each service and handles responses. Better for complex flows with branching and error handling. Consider an order workflow: (1) OrderService creates order → (2) PaymentService charges card → (3) InventoryService reserves stock → (4) ShippingService schedules delivery. If inventory is out of stock at step 3, compensating actions fire: refund payment (undo step 2), cancel order (undo step 1). Real examples: travel booking (flight + hotel + car), e-commerce checkout, bank transfers, and CI/CD pipelines (deploy → test → rollback on failure).",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What happens if a compensating action fails?",
        expectedPoints: [
          "retry the compensating action (it should be idempotent)",
          "if still failing, enter a 'failed' state requiring manual intervention",
          "dead letter queue for unresolvable compensations",
          "this is the hardest part of Saga — compensation must be reliable",
        ],
      },
    ],
    evaluationCriteria: [
      "explains local transactions with compensating actions",
      "describes the reverse-order rollback mechanism",
      "distinguishes choreography from orchestration",
      "gives concrete multi-service example",
    ],
  },
  {
    patternId: "saga",
    slug: "saga-vs-event-sourcing",
    question: "When would you use Saga vs Event Sourcing?",
    modelAnswer:
      "Saga and Event Sourcing solve different problems in distributed systems. Saga coordinates distributed transactions — ensuring that a multi-step business process across services either completes or compensates. It's about workflow coordination and failure recovery. Event Sourcing stores state as a sequence of events — it's a persistence strategy. It's about how you store and reconstruct state, not how you coordinate across services. You can have Saga without Event Sourcing: each service uses traditional databases, and the Saga coordinator manages the transaction flow. You can have Event Sourcing without Saga: a single service stores its state as events. They combine well because Event Sourcing naturally produces events that Saga can use for choreography — when the PaymentService appends a 'PaymentCompleted' event, the InventoryService reacts to it. Use Saga when you need to coordinate operations across multiple services with rollback capability. Use Event Sourcing when you need a complete audit trail, temporal queries, or the ability to rebuild state. Many systems use both: Event Sourcing for persistence within services, Saga for coordination between services.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can events from Event Sourcing drive a choreography-based Saga?",
        expectedPoints: [
          "yes — each service publishes domain events from its event store",
          "other services subscribe and react to relevant events",
          "this is the natural combination of both patterns",
          "the event store serves as both persistence and communication backbone",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly identifies Saga as coordination vs ES as persistence",
      "explains independence of the two patterns",
      "describes how they combine (events drive Saga choreography)",
      "gives clear criteria for when to use each",
    ],
  },
  {
    patternId: "saga",
    slug: "saga-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Saga?",
    modelAnswer:
      "The primary tradeoff is eventual consistency — between step 2 (payment charged) and step 3 (inventory reserved), the system is in a partially-committed state. Users may see inconsistent data during this window. You need strategies: show 'processing' states, use read-your-own-writes, or accept and communicate the delay. Second, compensating actions are hard to write correctly. Refunding a payment is straightforward, but how do you compensate 'sent an email notification'? Some actions are inherently non-compensable — you can send a correction email, but you can't unsend. Third, the ordering and timing of compensations is critical — they must execute in reverse order and must be idempotent (since they may be retried). Fourth, choreography-based Sagas can become difficult to understand as the number of steps grows — the flow is implicit in event subscriptions, making it hard to visualize the overall process. Orchestration adds a central point that's easier to understand but is a single point of failure. Fifth, testing Sagas requires simulating failures at every step and verifying compensations execute correctly — this combinatorial explosion of failure scenarios makes testing expensive. Use Saga when you genuinely need distributed transactions; prefer single-service transactions when possible.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you handle non-compensable actions in a Saga?",
        expectedPoints: [
          "move non-compensable actions to the end of the Saga (after all compensable steps)",
          "use a 'pending' state: don't send the email until all other steps confirm",
          "accept that some actions need corrective actions instead of true compensation",
          "design for compensability upfront — make actions reversible where possible",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies eventual consistency as the primary tradeoff",
      "discusses non-compensable actions challenge",
      "compares choreography vs orchestration tradeoffs",
      "mentions testing complexity",
    ],
  },

  // ── Template Method ─────────────────────────────────────
  {
    patternId: "template-method",
    slug: "template-method-explain",
    question: "Explain the Template Method pattern in 2 minutes.",
    modelAnswer:
      "Template Method defines the skeleton of an algorithm in a base class and lets subclasses override specific steps without changing the overall structure. The base class has a final/non-overridable method (the 'template') that calls a sequence of steps, some of which are abstract (must be overridden) and some have default implementations (optional hooks). For example, a DataProcessor base class defines process(): (1) readData(), (2) parseData(), (3) validateData(), (4) transformData(), (5) writeData(). Subclasses like CSVProcessor and JSONProcessor override readData() and parseData() for their specific formats, but the overall flow (read→parse→validate→transform→write) is fixed. React class component lifecycle is Template Method: React defines the lifecycle (mount→render→update→unmount) and you override componentDidMount(), render(), etc. Express route handlers: the framework controls the request lifecycle and your handler is a step in the template. The pattern is the OOP equivalent of the Hollywood Principle: 'Don't call us, we'll call you.' Frameworks define the flow, your code fills in the blanks.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the difference between abstract methods and hooks in Template Method?",
        expectedPoints: [
          "abstract methods MUST be overridden — they have no default (pure virtual)",
          "hooks CAN be overridden — they have a default (often empty/no-op)",
          "abstract methods define required variation points",
          "hooks define optional extension points",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the skeleton-with-overridable-steps mechanism",
      "gives a concrete example with multiple steps",
      "mentions the Hollywood Principle",
      "connects to real frameworks (React, Express)",
    ],
  },
  {
    patternId: "template-method",
    slug: "template-method-vs-strategy",
    question: "When would you use Template Method vs Strategy?",
    modelAnswer:
      "Template Method and Strategy both let you vary behavior, but through different mechanisms. Template Method uses inheritance: the base class defines the algorithm skeleton, subclasses override specific steps. The algorithm's structure is fixed; only steps vary. Strategy uses composition: the client holds a reference to a strategy object that implements the varying behavior. The entire algorithm can be swapped. Use Template Method when: the algorithm's high-level structure is fixed and only certain steps vary, you want to enforce the execution order, and you're okay with inheritance coupling. Use Strategy when: the entire algorithm varies (not just steps), you need to switch algorithms at runtime, or you want to avoid inheritance in favor of composition. The practical tradeoff: Template Method is simpler when you have one clear extension point and the rest of the algorithm is stable. Strategy is more flexible but requires more setup (strategy interface, concrete strategies, injection). In modern code, Strategy is preferred because composition is generally favored over inheritance. Template Method lives on primarily in framework code where the framework defines the lifecycle.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you implement Template Method with composition instead of inheritance?",
        expectedPoints: [
          "yes — pass the varying steps as functions/callbacks",
          "DataProcessor({readData: csvReader, parseData: csvParser})",
          "this is effectively Strategy applied to individual steps",
          "most modern implementations prefer this approach over inheritance",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes inheritance (Template Method) from composition (Strategy)",
      "explains fixed structure with variable steps vs swappable algorithm",
      "discusses runtime swapping capability of Strategy",
      "notes modern preference for composition",
    ],
  },
  {
    patternId: "template-method",
    slug: "template-method-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Template Method?",
    modelAnswer:
      "The primary pitfall is inheritance coupling. Every subclass is tightly coupled to the base class's algorithm structure. If you change the step order in the base class, all subclasses are affected. This violates the fragile base class problem — a change in the parent can break children in subtle ways. Second, Template Method limits you to one variation axis. If you need CSVProcessor and JSONProcessor but ALSO encrypted and unencrypted variants, you get a cartesian explosion: EncryptedCSVProcessor, UnencryptedCSVProcessor, EncryptedJSONProcessor, etc. Strategy with composition handles multiple variation axes cleanly. Third, it's hard to understand the flow — you must read the base class to see the template, then each subclass to see the overridden steps. The control flow jumps between classes. Fourth, in languages with single inheritance (Java, TypeScript), Template Method consumes your one inheritance slot. You can't extend another class. Fifth, hooks (optional overrides with defaults) can be confusing: developers may not know which hooks exist, what they do, or when they're called. Use Template Method in framework code where you control the lifecycle. For application code, prefer Strategy with dependency injection.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "What is the Fragile Base Class problem?",
        expectedPoints: [
          "changes in the base class break subclass behavior in unexpected ways",
          "subclasses depend on the base class's implementation details, not just its interface",
          "a new step added to the template may conflict with subclass logic",
          "solution: minimize what the base class does and maximize what's delegated",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies inheritance coupling as the main issue",
      "mentions the cartesian explosion with multiple variation axes",
      "discusses the fragile base class problem",
      "recommends Strategy for application code",
    ],
  },

  // ── Thread Pool ─────────────────────────────────────────
  {
    patternId: "thread-pool",
    slug: "thread-pool-explain",
    question: "Explain the Thread Pool pattern in 2 minutes.",
    modelAnswer:
      "Thread Pool maintains a pool of pre-created worker threads that are ready to execute tasks, avoiding the overhead of creating and destroying threads for each task. A task queue holds submitted work; idle workers pull tasks from the queue and execute them. When a worker finishes, it returns to the pool and picks up the next task. This amortizes thread creation cost (creating a thread is expensive — stack allocation, OS scheduling), limits concurrency (the pool size caps how many tasks run simultaneously), and provides backpressure (when all workers are busy, new tasks queue up). Java's ExecutorService is the canonical implementation: Executors.newFixedThreadPool(10) creates 10 workers. In Node.js, the worker_threads module and the libuv internal thread pool (used by fs operations, dns.lookup, and crypto) are thread pools. Database connection pools work identically — the 'threads' are connections, and the 'tasks' are queries. Web servers like Tomcat use thread pools to handle concurrent requests. The key configuration parameters are: core pool size, max pool size, keep-alive time for idle threads, and queue capacity.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How does Node.js handle concurrency without a visible thread pool?",
        expectedPoints: [
          "Node.js is single-threaded for JavaScript execution (event loop)",
          "libuv manages a thread pool (default 4 threads) for blocking I/O",
          "fs, dns, crypto, zlib operations use the libuv thread pool",
          "UV_THREADPOOL_SIZE env var configures the pool size",
        ],
      },
    ],
    evaluationCriteria: [
      "explains pre-created workers pulling from a task queue",
      "mentions amortized creation cost and concurrency limiting",
      "gives language-specific examples (Java ExecutorService, Node.js libuv)",
      "discusses key configuration parameters",
    ],
  },
  {
    patternId: "thread-pool",
    slug: "thread-pool-vs-producer-consumer",
    question: "When would you use Thread Pool vs Producer-Consumer?",
    modelAnswer:
      "Thread Pool and Producer-Consumer are related but distinct. Thread Pool focuses on efficient task execution — you submit a task, a pre-created worker executes it, and you get a result. The pool manages worker lifecycle and concurrency. Producer-Consumer focuses on decoupling production from consumption — producers and consumers are separate components, possibly on different machines, communicating through a buffer. Thread Pool is an implementation of Producer-Consumer at the thread level: the task submitter is the producer, the queue is the buffer, and the worker threads are consumers. But the concepts differ. Use Thread Pool when: tasks arrive dynamically and need concurrent execution within a single process, you want to limit parallelism, and you don't need to decouple producers from consumers (they're in the same process). Use Producer-Consumer when: producers and consumers run at different speeds, are in different processes or machines, need explicit backpressure and flow control, or items need durable queuing (survive process restarts). In short: Thread Pool is an intra-process execution mechanism. Producer-Consumer is an inter-component communication pattern.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can a Thread Pool use a bounded queue for backpressure?",
        expectedPoints: [
          "yes — Java's ThreadPoolExecutor accepts a BlockingQueue",
          "bounded queue: when full, the rejection policy kicks in (CallerRunsPolicy, AbortPolicy)",
          "this transforms the thread pool into a full Producer-Consumer with backpressure",
          "CallerRunsPolicy is elegant: the submitting thread runs the task itself, naturally slowing the producer",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies Thread Pool as intra-process, Producer-Consumer as inter-component",
      "explains that Thread Pool is a specific implementation of Producer-Consumer",
      "gives clear criteria for choosing each",
      "mentions durability and cross-machine communication for P-C",
    ],
  },
  {
    patternId: "thread-pool",
    slug: "thread-pool-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Thread Pool?",
    modelAnswer:
      "The primary pitfall is pool sizing. Too small: tasks queue up, throughput drops, and latency increases. Too large: excessive context switching between threads wastes CPU, and each thread consumes memory (stack space, typically 512KB-1MB). The optimal size depends on the workload type: CPU-bound tasks: pool size ≈ number of CPU cores (adding more threads just adds context switching). I/O-bound tasks: pool size ≈ cores × (1 + wait_time/compute_time), often 10-50× cores. Second, thread pool starvation: if all workers are blocked on a slow operation (database query, external API), no workers are available for new tasks. The solution is separate pools for different types of work (Bulkhead pattern). Third, task queuing can hide latency problems — tasks wait in the queue while metrics show 'low CPU usage'. Monitor queue depth and wait time, not just execution time. Fourth, deadlocks can occur if tasks submitted to the pool themselves submit sub-tasks to the same pool and wait for results (all workers blocked waiting for sub-tasks that can't start). Use separate pools for parent and child tasks, or use fork-join pools. Fifth, error handling in background threads is tricky — uncaught exceptions may silently kill the worker.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How does Java's ForkJoinPool differ from a standard Thread Pool?",
        expectedPoints: [
          "ForkJoinPool uses work-stealing: idle threads steal tasks from busy threads",
          "optimized for recursive divide-and-conquer tasks (fork sub-tasks, join results)",
          "each thread has its own deque (double-ended queue)",
          "standard ThreadPoolExecutor uses a single shared queue",
        ],
      },
    ],
    evaluationCriteria: [
      "provides the CPU-bound vs I/O-bound sizing formulas",
      "identifies pool starvation problem",
      "discusses deadlock from nested task submission",
      "recommends monitoring queue depth",
    ],
  },

  // ── Tool Use ────────────────────────────────────────────
  {
    patternId: "tool-use",
    slug: "tool-use-explain",
    question: "Explain the Tool Use pattern in 2 minutes.",
    modelAnswer:
      "Tool Use enables an AI model to invoke external functions (tools) to extend its capabilities beyond text generation. Instead of guessing or hallucinating, the model recognizes when it needs external information or computation, selects the appropriate tool, formats the input, and incorporates the tool's output into its response. The flow is: (1) model receives a prompt, (2) model decides to use a tool (e.g., calculator, web search, database query), (3) model generates a structured tool call (function name + arguments), (4) the runtime executes the tool and returns the result, (5) model incorporates the result into its response. Tool definitions include: name, description, input schema (JSON Schema), and optionally output schema. The model selects tools based on the description and user intent. Real examples: Claude's tool use API, ChatGPT plugins and function calling, LangChain tool abstractions. The key design decisions: which tools to expose, how to describe them clearly enough for the model to choose correctly, how to handle tool errors, and whether to allow single-shot (one tool call) or multi-turn (iterative) tool use.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How do you design good tool descriptions for LLMs?",
        expectedPoints: [
          "clear, specific descriptions of what the tool does and when to use it",
          "include examples of when TO use and when NOT to use",
          "well-defined input schemas with descriptions for each parameter",
          "avoid overlapping tools — the model must be able to disambiguate",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the tool invocation flow (decide, call, incorporate)",
      "mentions structured tool definitions (name, description, schema)",
      "gives real API examples (Claude, ChatGPT, LangChain)",
      "identifies key design decisions",
    ],
  },
  {
    patternId: "tool-use",
    slug: "tool-use-vs-strategy",
    question: "When would you use Tool Use vs Strategy pattern?",
    modelAnswer:
      "Tool Use and Strategy both select and invoke specific implementations, but in different contexts. Strategy selects from a fixed set of algorithms known at compile time. A PaymentProcessor switches between CreditCardStrategy and PayPalStrategy based on deterministic criteria (user selection, configuration). The strategies are defined in code and implement a common interface. Tool Use dynamically discovers and invokes external capabilities at runtime. An AI agent selects from a set of tools (search, calculator, API) based on natural language understanding of the user's intent. The selection criteria is probabilistic, not deterministic. Use Strategy when: the options are known in advance, selection criteria are deterministic, and you're building traditional software. Use Tool Use when: an AI model needs to extend its capabilities, selection is based on natural language understanding, and tools may be added or changed without recompiling. The deeper insight: Tool Use is essentially runtime Strategy where the selection mechanism is an LLM instead of a conditional or config. If you squint, the model's tool-selection logic IS a Strategy selector — just one powered by intelligence rather than code.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does the model choose which tool to use?",
        expectedPoints: [
          "the model matches user intent to tool descriptions",
          "tool descriptions act as 'interface contracts' the model reasons about",
          "multi-tool scenarios: the model can call multiple tools in sequence",
          "poor descriptions lead to wrong tool selection (garbage in, garbage out)",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes compile-time fixed set (Strategy) from runtime discovery (Tool Use)",
      "identifies deterministic (Strategy) vs probabilistic (Tool Use) selection",
      "explains the LLM as a strategy selector concept",
      "gives clear use cases for each",
    ],
  },
  {
    patternId: "tool-use",
    slug: "tool-use-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Tool Use?",
    modelAnswer:
      "The primary pitfall is incorrect tool selection. The model may choose the wrong tool, pass incorrect arguments, or fail to use a tool when it should. Tool description quality is critical — ambiguous descriptions lead to wrong choices. Second, security: tool use means the model can execute code, make API calls, or modify data. Without proper sandboxing, a misguided tool call can cause real damage. Implement guardrails: confirm destructive actions, limit tool permissions, validate inputs. Third, latency: each tool call adds a round trip (model → tool → model). Multiple tool calls compound this. Fourth, error handling: when a tool fails, the model must gracefully handle the error — retry, try a different tool, or explain to the user. Models that can't handle errors well get stuck in loops. Fifth, token cost: tool definitions consume context window tokens. With many tools, descriptions alone can consume thousands of tokens. Use tool selection strategies (route to a subset of tools based on the query type) to manage this. Sixth, determinism: the same prompt may produce different tool calls across runs, making testing difficult. Use structured outputs and temperature=0 for more consistent behavior. Tool Use is transformative but requires careful engineering around safety, reliability, and cost.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How do you test AI applications that use tools?",
        expectedPoints: [
          "mock tools to test tool selection deterministically",
          "evaluation sets: known prompts → expected tool calls → expected outputs",
          "test error handling: simulate tool failures and verify graceful recovery",
          "use LLM-as-judge for open-ended quality assessment",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies incorrect tool selection as the primary risk",
      "discusses security and sandboxing",
      "mentions token cost of tool definitions",
      "suggests testing strategies",
    ],
  },

  // ── Visitor ─────────────────────────────────────────────
  {
    patternId: "visitor",
    slug: "visitor-explain",
    question: "Explain the Visitor pattern in 2 minutes.",
    modelAnswer:
      "Visitor lets you add new operations to a class hierarchy without modifying the classes. It uses double dispatch: each element class has an accept(visitor) method that calls the visitor's corresponding visit method. The visitor has a typed visit method for each element class: visitCircle(circle), visitRectangle(rectangle), visitTriangle(triangle). To add a new operation (calculate area, render, serialize), you create a new Visitor class implementing all visit methods — no changes to the shape classes. The accept method enables this: shape.accept(areaVisitor) calls areaVisitor.visitCircle(this) if the shape is a Circle. This resolves the correct method based on both the element's type AND the visitor's type (double dispatch). AST processing in compilers is the canonical example: the syntax tree is fixed (defined by the grammar), but operations multiply (type checking, optimization, code generation, pretty printing). Each operation is a Visitor. TypeScript's compiler uses this extensively. The pattern inverts the usual OOP approach: instead of operations inside objects, operations are external visitors walking over a stable data structure.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What is double dispatch and why does Visitor need it?",
        expectedPoints: [
          "single dispatch: method resolved based on the receiver's type only",
          "double dispatch: method resolved based on BOTH receiver and argument types",
          "accept(visitor) dispatches on element type; visitor.visitX() dispatches on visitor type",
          "languages don't natively support double dispatch, so Visitor simulates it",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the double dispatch mechanism (accept + visitX)",
      "gives the AST/compiler example",
      "describes adding operations without modifying elements",
      "mentions the inversion of where operations live",
    ],
  },
  {
    patternId: "visitor",
    slug: "visitor-vs-iterator",
    question: "When would you use Visitor vs Iterator?",
    modelAnswer:
      "Visitor and Iterator both traverse data structures but serve different purposes. Iterator provides sequential access to elements — the client pulls elements one at a time and applies whatever logic it wants. It's generic: any operation can be applied during iteration. The traversal order is the iterator's responsibility. Visitor provides type-safe, operation-specific processing — each element accepts the visitor, which dispatches to a typed method (visitCircle, visitRectangle). It's specialized: the visitor knows about every element type. The element drives the dispatch. Use Iterator when: elements are homogeneous (all the same type), the operation is simple and generic (filter, map, reduce), you need lazy evaluation, or the collection changes shape often. Use Visitor when: elements are heterogeneous (different types requiring different handling), you need to add many different operations to a stable element hierarchy, and type safety matters (no instanceof chains). AST processing: Visitor, because each node type (IfStatement, ForLoop, Assignment) needs different handling. List of records: Iterator, because all records are the same type and operations (filter, sort) are generic.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does pattern matching in modern languages reduce the need for Visitor?",
        expectedPoints: [
          "pattern matching (Rust match, Kotlin when, TypeScript discriminated unions) provides exhaustive type switching",
          "you get compile-time checking that all types are handled",
          "this eliminates the need for double dispatch ceremony",
          "Visitor remains useful when you want to encapsulate the operation as a reusable object",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes homogeneous (Iterator) from heterogeneous (Visitor) traversal",
      "explains type-safe dispatch as Visitor's advantage",
      "gives clear use cases (AST for Visitor, lists for Iterator)",
      "mentions pattern matching as a modern alternative",
    ],
  },
  {
    patternId: "visitor",
    slug: "visitor-tradeoffs",
    question: "What are the tradeoffs and pitfalls of Visitor?",
    modelAnswer:
      "The primary pitfall is the extension asymmetry. Visitor makes it easy to add new operations (new Visitor classes) but hard to add new element types (every existing Visitor must be updated with a new visitNewType method). If your element hierarchy changes frequently, Visitor becomes a maintenance burden — it's the dual of the standard OOP problem (easy to add types, hard to add operations). This is the Expression Problem. Second, the accept/visit double dispatch ceremony is verbose and confusing for developers unfamiliar with the pattern. Each element class needs a boilerplate accept() method. Third, Visitor breaks encapsulation in a different way: to be useful, visitors often need access to element internals (fields, children), requiring public getters or friend access. Fourth, traversal logic is ambiguous — should the Visitor traverse the tree, or should each element's accept() method traverse its children? The answer varies, creating inconsistency. Fifth, in dynamically typed languages (JavaScript, Python), pattern matching or simple type switches achieve the same result with less ceremony. Visitor shines in statically typed languages with stable hierarchies: compiler ASTs, document object models, and file system trees.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "What is the Expression Problem and how does Visitor relate?",
        expectedPoints: [
          "the Expression Problem: can't easily extend both types AND operations in a typed language",
          "OOP makes it easy to add types (new subclass) but hard to add operations (modify all classes)",
          "Visitor inverts this: easy to add operations but hard to add types",
          "neither approach solves both directions — it's a fundamental tradeoff",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the extension asymmetry (easy operations, hard types)",
      "mentions the Expression Problem",
      "discusses the verbosity of double dispatch",
      "notes encapsulation concerns",
    ],
  },
];

export async function seed(db: Database) {
  const rows: NewModuleContent[] = QUESTIONS.map((q, i) => ({
    moduleId: MODULE_ID,
    contentType: CONTENT_TYPE,
    slug: q.slug,
    name: `Interview: ${q.question.length > 80 ? q.question.slice(0, 77) + "..." : q.question}`,
    category: q.patternId,
    difficulty: q.difficulty === "warmup" ? "beginner" : q.difficulty === "core" ? "intermediate" : "advanced",
    sortOrder: i,
    summary: q.modelAnswer.slice(0, 300),
    tags: ["interview-qa", q.patternId, q.category, q.difficulty],
    content: {
      patternId: q.patternId,
      question: q.question,
      modelAnswer: q.modelAnswer,
      difficulty: q.difficulty,
      category: q.category,
      followUps: q.followUps,
      evaluationCriteria: q.evaluationCriteria,
    },
  }));

  console.log(`    Upserting ${rows.length} interview Q&A rows (remaining patterns)...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
