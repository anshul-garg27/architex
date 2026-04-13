/**
 * Interview Q&A seed: 3-4 senior-level interview questions per design
 * pattern for the top 10 patterns.
 *
 * Each question includes a model answer, difficulty tier, follow-ups,
 * and evaluation criteria — everything an interviewer or interviewee
 * needs for structured practice.
 *
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
  // ── Singleton ─────────────────────────────────────────────
  {
    patternId: "singleton",
    slug: "singleton-explain",
    question: "Explain the Singleton pattern and when you'd actually use it.",
    modelAnswer:
      "Singleton ensures a class has exactly one instance and provides a global access point to it. The classic implementation uses a private constructor and a static getInstance() method that lazily creates the instance on first call. I'd use it for resources that are genuinely shared and expensive to create — database connection pools, logger instances, or configuration registries. In Node.js, ES modules are naturally singleton-scoped (the module cache returns the same export), so the GoF class-based pattern is less common — you'd just export a single instance. The main tradeoff is testability: singletons introduce hidden global state, making it harder to isolate tests. In modern codebases, I prefer dependency injection (NestJS, Spring) to manage singleton scope declaratively rather than baking it into the class itself.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How would you make a Singleton thread-safe in Java?",
        expectedPoints: [
          "synchronized getInstance()",
          "double-checked locking with volatile",
          "Bill Pugh idiom with static inner class",
          "eager initialization",
          "enum singleton",
        ],
      },
      {
        question: "Why do some engineers call Singleton an anti-pattern?",
        expectedPoints: [
          "hidden global state",
          "tight coupling to concrete class",
          "hard to mock in tests",
          "violates Single Responsibility — manages own lifecycle AND domain logic",
        ],
      },
    ],
    evaluationCriteria: [
      "mentions private constructor + static accessor",
      "gives concrete use cases (connection pool, logger)",
      "acknowledges testability tradeoff",
      "knows ES modules are natural singletons in Node.js",
    ],
  },
  {
    patternId: "singleton",
    slug: "singleton-test",
    question: "How would you unit-test code that depends on a Singleton?",
    modelAnswer:
      "The core problem is that the Singleton's global state leaks between tests. There are several approaches depending on the language. First, dependency injection: instead of calling MySingleton.getInstance() inside your class, accept the dependency via constructor. In tests, pass a mock. This is the cleanest approach and what frameworks like NestJS do with @Injectable({ scope: Scope.DEFAULT }). Second, add a reset method (resetInstance()) for test-only use — simple but leaks test concerns into production code. Third, use module-level mocking (jest.mock()) to replace the module export entirely. Fourth, in Java, reflection can reset the private static field, though this is fragile. The real lesson: if testing is painful, the Singleton is probably overused. Prefer DI for business logic classes and reserve Singleton for genuine infrastructure (connection pools, loggers).",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "What does NestJS do differently with its injection scope?",
        expectedPoints: [
          "default scope is singleton per module",
          "request scope creates per-request instances",
          "transient scope creates per-injection instances",
          "DI container manages lifecycle, not the class itself",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the root problem: global state between tests",
      "mentions dependency injection as primary solution",
      "provides at least two concrete testing approaches",
      "recommends limiting Singleton to infrastructure, not business logic",
    ],
  },
  {
    patternId: "singleton",
    slug: "singleton-vs-static",
    question: "What's the difference between a Singleton and a static class?",
    modelAnswer:
      "A static class (or a class with only static methods) can't be instantiated at all — it's a namespace for functions. A Singleton has exactly one instance. The key differences: (1) A Singleton can implement interfaces and be passed as a dependency — a static class cannot, making it untestable via mocking. (2) A Singleton supports lazy initialization — you control when the instance is created. Static members initialize when the class loads. (3) A Singleton can have state with proper encapsulation via private fields. Static state is effectively global mutable state with no lifecycle control. (4) A Singleton can be subclassed (carefully) for different environments. You can't override static methods polymorphically in most languages. Use a static class for pure utility functions (Math.max). Use Singleton when you need a single instance of stateful, injectable, mockable object.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can you give a case where a static class is better than a Singleton?",
        expectedPoints: [
          "pure utility functions with no state (math helpers, string formatters)",
          "no need for polymorphism or interface implementation",
          "simpler to reason about — no lifecycle, no initialization order",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes instance-based vs namespace-based",
      "mentions interface implementation / polymorphism difference",
      "mentions testability (DI) advantage of Singleton",
      "gives appropriate use case for each",
    ],
  },

  // ── Factory Method ────────────────────────────────────────
  {
    patternId: "factory-method",
    slug: "factory-method-explain",
    question: "Explain Factory Method in 2 minutes with a real example.",
    modelAnswer:
      "Factory Method defines an interface for creating objects but lets subclasses decide which class to instantiate. The creator class declares an abstract factoryMethod() returning a Product interface. Concrete creators override it to produce specific products. A real example: consider a notification system. The base NotificationService has a send(message) method that calls this.createChannel() — the factory method. EmailNotificationService overrides createChannel() to return an EmailChannel; PushNotificationService returns a PushChannel. The send() logic is identical — format the message, call channel.deliver() — but the delivery mechanism varies. This means adding SMSNotificationService requires zero changes to the base class. In Node.js, http.createServer() is a factory method — it creates an http.Server without exposing the constructor. React.createElement() is a parameterized factory — it takes a type string or component and returns the right virtual DOM node.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "When would you use Factory Method over Abstract Factory?",
        expectedPoints: [
          "Factory Method for a single product via inheritance",
          "Abstract Factory for families of related products via composition",
          "Factory Method when you want subclasses to customize creation",
          "Abstract Factory when products must be used together consistently",
        ],
      },
    ],
    evaluationCriteria: [
      "names participants: Creator, ConcreteCreator, Product, ConcreteProduct",
      "gives a concrete real-world example",
      "explains the Open/Closed benefit",
      "distinguishes from Abstract Factory",
    ],
  },
  {
    patternId: "factory-method",
    slug: "factory-method-vs-constructor",
    question: "Why would you use a factory method instead of calling new directly?",
    modelAnswer:
      "There are several practical reasons. First, named factory methods are self-documenting: Color.fromRGB(255, 0, 0) is clearer than new Color(255, 0, 0, 'rgb'). Second, a factory can return different subtypes based on input — Number.from('42') might return an Integer while Number.from('3.14') returns a Float. Constructors can only return the exact class. Third, factories can return cached instances — String.intern() in Java, or a connection pool handing out existing connections. Constructors always allocate. Fourth, factory methods can be async — you can await Database.connect() but can't await a constructor. Fifth, factories decouple callers from concrete classes — you depend on the interface, not the implementation. In TypeScript, I'd use a factory when construction involves validation, async initialization, or polymorphic return types. For simple value objects with a few fields, 'new' is perfectly fine.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does TypeScript's lack of multiple constructors affect this?",
        expectedPoints: [
          "TypeScript has no constructor overloading (only signature overloads)",
          "static factory methods provide named alternatives",
          "common pattern: private constructor + static create methods",
        ],
      },
    ],
    evaluationCriteria: [
      "mentions naming clarity benefit",
      "mentions polymorphic return types",
      "mentions caching/pooling capability",
      "mentions async initialization",
      "acknowledges when 'new' is fine",
    ],
  },
  {
    patternId: "factory-method",
    slug: "factory-method-critique",
    question: "What are the downsides of Factory Method? When is it overkill?",
    modelAnswer:
      "The primary downside is class proliferation — every new product variant requires a new creator subclass. For a system with 20 notification channels, that's 20 ConcreteCreator classes, each containing a one-line factory method. At that point, a parameterized factory (switch on a string or registry lookup) is simpler. Second, the pattern adds indirection — developers must trace through the creator hierarchy to understand which product is instantiated, which hurts readability in simple cases. Third, in languages with first-class functions (JavaScript, Python), you can pass a constructor or factory function directly, making the class hierarchy unnecessary. Factory Method is overkill when: you have 1-2 product types that won't grow, the creation logic is trivial, or you're in a language where a simple function parameter achieves the same decoupling. It shines when frameworks need to let users plug in custom implementations without modifying framework code.",
    difficulty: "deep-dive",
    category: "critique",
    followUps: [
      {
        question: "How would you refactor away from Factory Method if it's overengineered?",
        expectedPoints: [
          "collapse creator hierarchy into a parameterized factory",
          "use a registry/map from key to constructor",
          "pass factory functions directly in languages that support it",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies class proliferation problem",
      "mentions readability cost of indirection",
      "gives concrete criteria for when it's overkill",
      "contrasts with simpler alternatives (parameterized factory, function parameter)",
    ],
  },

  // ── Builder ───────────────────────────────────────────────
  {
    patternId: "builder",
    slug: "builder-explain",
    question: "Explain the Builder pattern and give a modern example.",
    modelAnswer:
      "Builder separates the construction of a complex object from its representation, allowing the same construction process to create different representations. The classic GoF version has four participants: Builder interface (defines build steps), ConcreteBuilder (implements steps, holds the product), Director (orchestrates the build sequence), and Product (the thing being built). In modern practice, the dominant form is the fluent builder — method chaining where each call returns 'this'. Knex.js is a perfect example: knex('users').select('name').where('active', true).orderBy('created_at').limit(10). Each method configures one aspect of the SQL query. The Product (SQL string) is created when you call .toString() or await the promise. Prisma's query builder, Java's StringBuilder, and Axios' request config all follow this pattern. The key benefit: construction is self-documenting (each method names what it configures) and order-safe (the builder validates internally).",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the role of the Director, and when would you skip it?",
        expectedPoints: [
          "Director encodes reusable build recipes",
          "skip it when builds are one-off or driven directly by the client",
          "useful when the same build sequence is needed in multiple places",
        ],
      },
      {
        question: "How does Builder differ from Factory?",
        expectedPoints: [
          "Builder constructs step-by-step; Factory creates in one shot",
          "Builder for complex objects with many optional parts; Factory for selecting among types",
          "Builder returns the product at the end; Factory returns it immediately",
        ],
      },
    ],
    evaluationCriteria: [
      "mentions telescoping constructor as the problem",
      "names the GoF participants (Builder, ConcreteBuilder, Director, Product)",
      "gives a real fluent API example (Knex, Prisma, StringBuilder)",
      "explains self-documenting construction benefit",
    ],
  },
  {
    patternId: "builder",
    slug: "builder-immutable",
    question: "How would you implement a Builder that produces immutable objects?",
    modelAnswer:
      "The builder accumulates mutable state internally, then the build() method creates a frozen, immutable product. In TypeScript: the builder has private fields for each property. Each setter returns 'this' for chaining. build() calls Object.freeze(new Product(this.name, this.age, ...)) or returns a readonly-typed object. The Product class has only readonly fields and no setters. This is how Immutable.js records work, and it's the approach Protocol Buffers use — the builder is mutable, the message is frozen. An alternative is the copy-on-write builder: each method returns a NEW builder instance with the modified field, leaving the original unchanged. This is more functional and enables branching: const base = builder.setName('A'); const v1 = base.setAge(25); const v2 = base.setAge(30). The tradeoff is memory allocation per step vs. mutability within the builder.",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "What's the copy-on-write builder pattern used in?",
        expectedPoints: [
          "functional programming languages (Scala case class copy)",
          "React's immutable state updates (spread operator pattern)",
          "Protocol Buffers / FlatBuffers",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes mutable builder from immutable product",
      "mentions Object.freeze or readonly types",
      "describes copy-on-write variant",
      "gives tradeoff analysis (memory vs safety)",
    ],
  },
  {
    patternId: "builder",
    slug: "builder-validation",
    question: "Where should validation happen in a Builder — at each step or at build time?",
    modelAnswer:
      "Both, for different purposes. Per-step validation catches invalid individual values immediately: setAge(-5) should throw right away, not wait until build(). This provides better error messages and faster feedback. Build-time validation catches cross-field constraints: 'if shippingMethod is express, address must not be a PO Box.' These rules depend on the combination of fields, so they can only be checked when the full state is known. In TypeScript, you can enforce required fields at the type level using the type-state pattern: select() returns a type that only has from(), from() returns a type that has where() and build(), etc. This gives compile-time guarantees that required steps were called. Zod schemas can validate the final product at build time for runtime checks. The worst approach is no validation — letting build() silently produce an invalid object that fails downstream.",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "What's the type-state pattern for builders?",
        expectedPoints: [
          "each builder method returns a different type",
          "build() only available on the type that has all required fields set",
          "compile-time enforcement of build step ordering",
          "Phantom types or branded types in TypeScript",
        ],
      },
    ],
    evaluationCriteria: [
      "distinguishes per-step vs build-time validation",
      "gives concrete examples of each",
      "mentions type-state pattern for compile-time safety",
      "identifies the anti-pattern: no validation at all",
    ],
  },

  // ── Observer ──────────────────────────────────────────────
  {
    patternId: "observer",
    slug: "observer-explain",
    question: "Explain the Observer pattern with a Node.js example.",
    modelAnswer:
      "Observer defines a one-to-many dependency where when one object (Subject) changes state, all registered dependents (Observers) are notified automatically. In Node.js, EventEmitter IS the Observer pattern. The Subject is any EventEmitter instance. Observers register via emitter.on('event', callback). When the subject calls emitter.emit('event', data), all registered callbacks fire. Every Node.js stream, HTTP server, and socket extends EventEmitter — it's the foundation of Node's event-driven architecture. For example, a server.on('request', handler) registers an observer for incoming requests. The server (Subject) doesn't know what the handler does — it just notifies. React's useState + useEffect is also Observer: when state changes, all components that depend on it re-render. The pattern separates the thing that changes from the things that respond to changes.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What happens if an observer throws during notification?",
        expectedPoints: [
          "in Node EventEmitter, the error propagates and stops remaining listeners",
          "need try/catch in emit or use 'error' event",
          "some implementations catch per-observer to isolate failures",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly maps Subject/Observer to EventEmitter/listener",
      "gives concrete Node.js example",
      "mentions the one-to-many relationship",
      "explains the decoupling benefit",
    ],
  },
  {
    patternId: "observer",
    slug: "observer-memory-leak",
    question: "How does the Observer pattern cause memory leaks and how do you prevent them?",
    modelAnswer:
      "When an observer subscribes to a subject but never unsubscribes, the subject holds a reference to the observer indefinitely. Even if the observer is 'logically dead' (a removed UI component, a closed connection), the garbage collector can't reclaim it because the subject's listener list still references it. In Node.js, this triggers the 'MaxListenersExceededWarning.' In browsers, an event listener on a global DOM element referencing a component's closure keeps the entire component tree alive. Prevention strategies: (1) Always unsubscribe on teardown — React's useEffect returns a cleanup function, Angular has ngOnDestroy, Vue has onUnmounted. (2) Use WeakRef or WeakMap so the observer can be garbage-collected even while subscribed. (3) Use AbortController: pass a signal to addEventListener and call controller.abort() to remove all associated listeners at once. (4) Use RxJS's takeUntil(destroy$) to auto-unsubscribe when a destroy subject emits.",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "How would you detect observer memory leaks in production?",
        expectedPoints: [
          "Node --inspect with heap snapshots",
          "Chrome DevTools Memory tab — retained size analysis",
          "EventEmitter.listenerCount() monitoring",
          "leak detection libraries (why-is-node-running)",
        ],
      },
    ],
    evaluationCriteria: [
      "explains the root cause: subject holds observer reference",
      "mentions garbage collection implications",
      "gives at least 3 prevention strategies",
      "provides framework-specific examples (React useEffect cleanup, AbortController)",
    ],
  },
  {
    patternId: "observer",
    slug: "observer-vs-pubsub",
    question: "What's the difference between Observer and Pub/Sub?",
    modelAnswer:
      "In the classic Observer pattern, the Subject directly knows its Observers — it maintains a list and calls their update() methods. There's a direct reference between publisher and subscriber. In Pub/Sub, there's an intermediary message broker or event bus. Publishers emit named events to the bus; subscribers register for those events on the bus. Publisher and subscriber never reference each other. This is a crucial architectural difference: Observer couples the subject to its observers (even if loosely via an interface). Pub/Sub fully decouples them — a publisher doesn't know if anyone is listening. Pub/Sub scales better for many-to-many communication (Redis Pub/Sub, Kafka topics, Redux store). Observer is simpler for local, one-to-many notification (EventEmitter, React state). In practice, Node's EventEmitter is Observer (direct reference), while Redis Pub/Sub is true Pub/Sub (broker-mediated).",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "When would you pick Observer over Pub/Sub?",
        expectedPoints: [
          "same-process, tightly scoped notification",
          "when you need guaranteed delivery order",
          "when the overhead of a message broker isn't justified",
          "when publisher needs to know its subscriber count",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies the key difference: direct reference vs broker mediation",
      "gives concrete examples of each (EventEmitter vs Redis Pub/Sub)",
      "explains the coupling tradeoff",
      "mentions scalability difference",
    ],
  },

  // ── Strategy ──────────────────────────────────────────────
  {
    patternId: "strategy",
    slug: "strategy-explain",
    question: "Explain Strategy pattern and where you've seen it in real codebases.",
    modelAnswer:
      "Strategy defines a family of algorithms, encapsulates each one, and makes them interchangeable. The Context holds a reference to a Strategy interface and delegates algorithmic work to it. Concrete strategies implement the interface with different algorithms. The client configures the context with the desired strategy at runtime. In real codebases: Array.sort(compareFn) is the textbook example — the comparison function is the strategy, and you swap it to change sort behavior. Passport.js authentication strategies (LocalStrategy, GoogleStrategy, JWTStrategy) let you add auth providers without touching the auth middleware. React Router's history prop accepts BrowserHistory or MemoryHistory — different navigation strategies for browser vs testing. Webpack's optimization.minimizer accepts different minification strategies (TerserPlugin, ESBuildPlugin). The pattern is especially powerful when combined with a registry: strategies are registered by name and selected via configuration rather than code changes.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "Can you implement Strategy without classes in JavaScript?",
        expectedPoints: [
          "yes, pass a function directly",
          "Array.sort(fn) is a function-based strategy",
          "higher-order functions replace the class hierarchy",
          "use classes when strategy needs state or multiple methods",
        ],
      },
    ],
    evaluationCriteria: [
      "names the three participants: Context, Strategy interface, ConcreteStrategy",
      "gives multiple real-world examples",
      "mentions runtime swappability as the key benefit",
      "contrasts with conditional logic (if/else chains)",
    ],
  },
  {
    patternId: "strategy",
    slug: "strategy-vs-template-method",
    question: "Compare Strategy with Template Method. When do you pick each?",
    modelAnswer:
      "Both let you vary part of an algorithm while keeping the rest fixed. Template Method uses inheritance: the base class defines the algorithm skeleton with abstract 'hook' methods that subclasses override. Strategy uses composition: the algorithm is extracted into a separate object injected into the context. Key tradeoffs: Strategy allows runtime swapping — you can change the algorithm after construction. Template Method is fixed at compile time via the subclass hierarchy. Strategy follows composition over inheritance, making it easier to test (inject a mock strategy). Template Method is simpler when there's only one variation point — you avoid creating a separate strategy interface and classes. Template Method lets the base class share more behavior across steps (protected methods). Strategy is better when you have multiple independent variation points — each can have its own strategy without combinatorial subclass explosion. I'd pick Strategy by default and only use Template Method when the algorithm steps are tightly coupled and a shared base class makes the code significantly cleaner.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Give an example where Template Method is genuinely better than Strategy.",
        expectedPoints: [
          "React class component lifecycle (componentDidMount, render)",
          "JUnit test framework (setUp, test, tearDown)",
          "when steps share significant protected state/methods",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly identifies inheritance vs composition distinction",
      "mentions runtime swapping advantage of Strategy",
      "gives criteria for choosing each",
      "mentions composition over inheritance principle",
    ],
  },
  {
    patternId: "strategy",
    slug: "strategy-registry",
    question: "How would you design a strategy registry for a plugin system?",
    modelAnswer:
      "A strategy registry maps identifiers to strategy implementations, allowing runtime lookup and extensibility. The design: (1) Define the Strategy interface with a type discriminator: interface PaymentStrategy { readonly type: string; process(amount: number): Promise<Result> }. (2) Create a Map<string, PaymentStrategy> as the registry. (3) Expose register(strategy) and get(type) methods. (4) At startup, plugins call registry.register(new StripeStrategy()) — each strategy self-registers. (5) At runtime: registry.get(user.preferredPayment).process(100). For TypeScript type safety, use a generic registry: Registry<T extends { type: string }> with get() returning T | undefined. Add validation: reject duplicate registrations, warn on missing strategies. For more advanced scenarios, support priority ordering (multiple strategies for the same type, picked by priority) and async lazy-loading (register a factory function instead of an instance). Webpack's plugin system, ESLint's rule registry, and Passport's strategy registration all follow this pattern.",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "How would you handle a missing strategy at runtime?",
        expectedPoints: [
          "throw descriptive error listing available strategies",
          "fallback to a default strategy",
          "log and degrade gracefully in non-critical paths",
          "validate at startup rather than at runtime",
        ],
      },
    ],
    evaluationCriteria: [
      "describes the registry data structure (Map<string, Strategy>)",
      "mentions self-registration pattern",
      "handles missing/duplicate strategies",
      "gives real-world registry examples (Webpack plugins, Passport)",
    ],
  },

  // ── Decorator ─────────────────────────────────────────────
  {
    patternId: "decorator",
    slug: "decorator-explain",
    question: "Explain the Decorator pattern. How is it different from inheritance?",
    modelAnswer:
      "Decorator attaches additional responsibilities to an object dynamically by wrapping it with another object that has the same interface. Unlike inheritance (which adds behavior at compile time for all instances), Decorator adds behavior at runtime for specific instances. The key structure: both the original object and the decorator implement the same Component interface. The decorator holds a reference to the wrapped object, adds its behavior, and delegates to the wrapped object. You can stack decorators: new LoggingDecorator(new CachingDecorator(new DatabaseService())). Each layer adds one concern without the original knowing it's been wrapped. With inheritance, adding logging + caching + retries to a DatabaseService requires 2^3 = 8 subclasses for every combination. With Decorator, you compose 3 independent wrappers. This is why Java I/O uses decorators (BufferedReader wrapping InputStreamReader wrapping FileInputStream) and why Express middleware is a decoration chain.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the relationship between Decorator and the Open/Closed Principle?",
        expectedPoints: [
          "Decorator adds behavior without modifying existing code (open for extension, closed for modification)",
          "new functionality = new decorator class, not edits to existing classes",
          "existing tests remain unaffected",
        ],
      },
    ],
    evaluationCriteria: [
      "explains same-interface wrapping mechanism",
      "contrasts with inheritance's combinatorial explosion",
      "shows decorator stacking with a real example",
      "mentions runtime vs compile-time distinction",
    ],
  },
  {
    patternId: "decorator",
    slug: "decorator-middleware",
    question: "How does Express/Koa middleware relate to the Decorator pattern?",
    modelAnswer:
      "Express middleware IS the Decorator pattern in functional form. Each middleware function wraps the next one: it receives (req, res, next), adds its behavior (logging, auth, CORS), and calls next() to delegate to the wrapped handler. The 'interface' is the (req, res, next) signature — all middleware conforms to it. app.use(cors()), app.use(auth()), app.use(logger()) stacks decorators. The order matters: cors runs first, then auth, then logger. This is identical to new CorsDecorator(new AuthDecorator(new LoggingDecorator(handler))) — just expressed as function composition instead of object wrapping. Koa improves on this with async/await — middleware can act both before AND after the inner handler (onion model), which is harder with Express's callback style. The key insight: middleware stacks and decorator chains are the same pattern — one uses functions, the other uses objects.",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "What's the 'onion model' in Koa and why does it matter?",
        expectedPoints: [
          "each middleware wraps the next, forming concentric layers",
          "await next() pauses current middleware, runs inner layers, then resumes",
          "enables response timing, error wrapping, and cleanup at each layer",
          "Express can't easily do this because next() doesn't return a promise",
        ],
      },
    ],
    evaluationCriteria: [
      "maps middleware to Decorator participants",
      "explains next() as delegation to wrapped object",
      "mentions ordering significance",
      "compares Express callback style with Koa's onion model",
    ],
  },
  {
    patternId: "decorator",
    slug: "decorator-ts-decorators",
    question: "How do TypeScript's @decorators relate to the GoF Decorator pattern?",
    modelAnswer:
      "TypeScript's @decorator syntax is a language-level implementation of the Decorator concept, but with some differences from the GoF pattern. A TS class decorator receives the constructor and can return a new constructor that extends it — effectively wrapping the class. A method decorator receives the property descriptor and can wrap the original method with additional behavior (logging, validation, memoization). NestJS uses @Injectable(), @Controller(), @Get() extensively. The similarity: both wrap existing behavior transparently. The difference: GoF Decorator works at the instance level (you decorate a specific object), while TS decorators work at the class/method definition level (all instances are affected). GoF Decorator is dynamic (applied at runtime); TS decorators are static (applied at class definition time, though the decorator function runs at runtime). Stage 3 TC39 decorators are converging toward a standardized API that better supports the GoF use case with accessor decorators.",
    difficulty: "deep-dive",
    category: "compare",
    followUps: [
      {
        question: "What's the difference between TS legacy decorators and Stage 3 decorators?",
        expectedPoints: [
          "different function signatures",
          "Stage 3 uses a context object instead of positional params",
          "Stage 3 has accessor decorators for fine-grained property control",
          "legacy decorators are experimentalDecorators in tsconfig",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly maps TS decorators to GoF concept",
      "identifies the key difference: class-level vs instance-level",
      "mentions concrete TS decorator usage (NestJS, MobX)",
      "knows about Stage 3 standardization",
    ],
  },

  // ── Adapter ───────────────────────────────────────────────
  {
    patternId: "adapter",
    slug: "adapter-explain",
    question: "Explain the Adapter pattern and when you'd use it in a Node.js project.",
    modelAnswer:
      "Adapter converts the interface of one class into another interface that clients expect. It lets classes work together that couldn't otherwise because of incompatible interfaces. Think of it as a translator: your code speaks interface A, the library speaks interface B, and the adapter translates between them. In Node.js, I'd use Adapter when: (1) Integrating third-party APIs — wrap the Stripe SDK with your PaymentProvider interface so you can swap to PayPal later. (2) Database migration — wrap the new Prisma client to match the old Knex repository interface during a gradual migration. (3) Testing — create an InMemoryDatabase adapter that implements your Repository interface for fast unit tests without hitting a real DB. (4) Multi-provider support — a StorageAdapter interface with S3Adapter, GCSAdapter, and LocalFSAdapter. The Adapter is always about making something you can't modify (third-party code, legacy systems) compatible with the interface your system expects.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How is Adapter different from Facade?",
        expectedPoints: [
          "Adapter matches an existing interface — it translates",
          "Facade creates a new, simplified interface — it simplifies",
          "Adapter wraps one class; Facade often wraps an entire subsystem",
          "Adapter is about compatibility; Facade is about convenience",
        ],
      },
    ],
    evaluationCriteria: [
      "defines interface translation clearly",
      "gives multiple concrete Node.js use cases",
      "mentions third-party integration as primary trigger",
      "distinguishes from Facade and Decorator",
    ],
  },
  {
    patternId: "adapter",
    slug: "adapter-migration",
    question: "How would you use the Adapter pattern for a gradual database migration?",
    modelAnswer:
      "Define a Repository interface that your application code depends on: interface UserRepository { findById(id: string): Promise<User>; save(user: User): Promise<void> }. Your current implementation is KnexUserRepository. Create a new PrismaUserRepository implementing the same interface. During migration: create a MigrationAdapter that implements UserRepository and holds both implementations. For reads, it queries Prisma first and falls back to Knex if the data hasn't been migrated yet. For writes, it writes to both (dual-write) or writes to Prisma and syncs to Knex. This adapter lets you migrate table by table — each method can independently switch from Knex to Prisma. Add a feature flag per method: if (migrated.users.findById) return this.prisma.findById(id) else return this.knex.findById(id). Once all methods point to Prisma and you've verified data consistency, remove the adapter and KnexUserRepository entirely. The application code never changes — it only depends on the UserRepository interface.",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "What are the risks of dual-write during migration?",
        expectedPoints: [
          "data inconsistency if one write fails",
          "increased latency (two writes per operation)",
          "conflict resolution if both DBs are read from",
          "need compensating transactions or eventual consistency",
        ],
      },
    ],
    evaluationCriteria: [
      "defines the Repository interface clearly",
      "describes dual-write or read-fallback strategy",
      "mentions feature flags for per-method migration",
      "explains the cleanup phase (remove adapter + old implementation)",
    ],
  },
  {
    patternId: "adapter",
    slug: "adapter-testing",
    question: "How does the Adapter pattern improve testability?",
    modelAnswer:
      "By coding against an interface (Target) rather than a concrete implementation (Adaptee), you can swap in a test-specific adapter without changing application code. Example: your app uses interface Cache { get(key: string): Promise<string | null>; set(key: string, value: string, ttl: number): Promise<void> }. In production, RedisCacheAdapter wraps the Redis client. In tests, InMemoryCacheAdapter wraps a simple Map. Tests run instantly without a Redis server, are deterministic (no network flakiness), and can be easily pre-populated. The same approach works for any external dependency: InMemoryEmailAdapter for testing email sends (captures calls instead of sending), MockHTTPAdapter for testing API clients, LocalFSAdapter instead of S3. The key: the Adapter pattern makes dependency injection practical. Without a shared interface, you'd need to mock the concrete Redis client's internals. With the adapter, you replace the entire implementation — cleaner and less brittle.",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "When is an adapter-based test double better than jest.mock()?",
        expectedPoints: [
          "adapter double implements a real interface — type-checked",
          "jest.mock replaces at module level — no type safety for mock shape",
          "adapter doubles are reusable across test files",
          "adapter doubles can have real behavior (in-memory DB) vs empty stubs",
        ],
      },
    ],
    evaluationCriteria: [
      "shows interface-based swapping for tests",
      "gives InMemory adapter example",
      "contrasts with mocking concrete implementations",
      "mentions dependency injection as the enabler",
    ],
  },

  // ── Command ───────────────────────────────────────────────
  {
    patternId: "command",
    slug: "command-explain",
    question: "Explain the Command pattern and how it enables undo/redo.",
    modelAnswer:
      "Command encapsulates a request as an object, containing all information needed to perform an action. The four participants: Command interface (execute(), undo()), ConcreteCommand (stores receiver + parameters, implements execute/undo), Invoker (triggers commands without knowing what they do), and Receiver (the object that performs the actual work). For undo/redo: maintain a history stack of executed commands. When the user executes an action, push the command onto the history stack. Undo pops the last command and calls command.undo(). Redo re-executes it. Each command must capture enough state to reverse itself — a DeleteTextCommand stores the deleted text and cursor position so undo() can re-insert it exactly. This is how VS Code, Photoshop, and Google Docs implement undo. The pattern also enables: macro recording (store a sequence of commands), queuing (serialize commands for deferred execution), and logging (replay commands to reconstruct state).",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How would you handle undo for a command that makes an API call?",
        expectedPoints: [
          "compensating command — a separate command that reverses the effect",
          "saga pattern for distributed undo",
          "store the pre-API-call state for local rollback",
          "some API calls are not reversible — acknowledge this limitation",
        ],
      },
    ],
    evaluationCriteria: [
      "names all four participants: Command, ConcreteCommand, Invoker, Receiver",
      "explains undo via history stack clearly",
      "mentions state capture requirement for undo",
      "gives real-world examples (VS Code, Photoshop)",
    ],
  },
  {
    patternId: "command",
    slug: "command-redux",
    question: "How does Redux relate to the Command pattern?",
    modelAnswer:
      "Redux actions ARE Command objects. The action { type: 'ADD_TODO', payload: { text: 'Buy milk' } } encapsulates the request with all necessary data. The store.dispatch() is the Invoker — it triggers the action without knowing what it does. The reducer is the Receiver — it performs the actual state mutation. The middleware chain (thunks, sagas) acts as a Command processor pipeline. Redux's time-travel debugging is Command pattern undo/redo: because every action is a serializable object stored in history, you can replay the sequence from any point. Redux DevTools lets you 'jump' to any previous state by replaying actions up to that point. The key mapping: Action = Command, dispatch = Invoker.execute(), reducer = Receiver, action log = Command History. The main difference from classical Command: Redux commands (actions) are plain objects, not class instances with execute() methods. The reducer handles execution externally rather than the command executing itself.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "How does Redux's approach differ from the classic Command pattern?",
        expectedPoints: [
          "actions are data, not objects with behavior (no execute method)",
          "reducer handles execution externally vs command executing itself",
          "actions are serializable plain objects for easy logging/replay",
          "no explicit undo method — reconstruct by replaying from initial state",
        ],
      },
    ],
    evaluationCriteria: [
      "correctly maps Redux concepts to Command participants",
      "explains time-travel debugging via action history",
      "identifies the 'data command' vs 'behavioral command' difference",
      "mentions middleware as command processor pipeline",
    ],
  },
  {
    patternId: "command",
    slug: "command-cqrs",
    question: "How does CQRS relate to the Command pattern?",
    modelAnswer:
      "CQRS (Command Query Responsibility Segregation) scales the Command pattern to system architecture. The core idea: separate the write model (Commands) from the read model (Queries). Commands mutate state — CreateOrder, CancelShipment, UpdateInventory. Each command is handled by a dedicated CommandHandler that validates, executes, and emits domain events. Queries read state — GetOrderDetails, ListProducts. They hit an optimized read model (often a denormalized view or separate database) that's updated asynchronously from command-generated events. This separation means you can scale reads and writes independently, optimize the read model for specific query patterns, and maintain a complete audit log of every command. Combined with Event Sourcing, you get the full power: every command produces events, events are the source of truth, and you can rebuild any read model by replaying events. The tradeoff: significantly more complexity — only justified for high-scale systems with distinct read/write patterns.",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "When is CQRS overkill?",
        expectedPoints: [
          "CRUD apps with simple, balanced read/write ratios",
          "small teams that can't maintain two models",
          "systems where eventual consistency is unacceptable",
          "when a single relational database serves both needs fine",
        ],
      },
    ],
    evaluationCriteria: [
      "explains command/query separation clearly",
      "connects to the Command pattern (commands as objects, handlers as receivers)",
      "mentions Event Sourcing as a complementary pattern",
      "gives honest tradeoff analysis (complexity vs scalability)",
    ],
  },

  // ── State ─────────────────────────────────────────────────
  {
    patternId: "state",
    slug: "state-explain",
    question: "Explain the State pattern with a real-world example.",
    modelAnswer:
      "State allows an object to alter its behavior when its internal state changes — the object appears to change its class. Instead of a massive switch statement checking the current state in every method, you extract each state into its own class. The Context (e.g., a Document) holds a reference to a State object. When you call document.publish(), it delegates to this.state.publish(this). DraftState.publish() moves the document to review. ReviewState.publish() moves it to published. PublishedState.publish() does nothing or throws. Each state encapsulates all behavior for that state in one class. A real-world example: a TCP connection. In LISTEN state, receiving SYN sends SYN-ACK and transitions to SYN_RECEIVED. In ESTABLISHED state, receiving data triggers acknowledgment. In CLOSE_WAIT, the connection is half-closed. Each state handles the same events differently. XState is a popular JavaScript library that formalizes this as state machines with visual state charts.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "What's the difference between State and a finite state machine library like XState?",
        expectedPoints: [
          "State pattern uses OOP (classes per state)",
          "XState uses a declarative configuration object",
          "XState adds guards, actions, parallel states, history states",
          "XState provides visualization tools",
          "State pattern is simpler for basic state management",
        ],
      },
    ],
    evaluationCriteria: [
      "explains delegation to current state object",
      "contrasts with switch/if-else approach",
      "gives a multi-state example with transitions",
      "mentions behavior changes per state",
    ],
  },
  {
    patternId: "state",
    slug: "state-vs-strategy",
    question: "State and Strategy are structurally identical. How do you tell them apart?",
    modelAnswer:
      "The UML diagrams are identical: both have a Context holding a reference to an interchangeable object via an interface. The difference is entirely in intent and transition ownership. Strategy: the CLIENT selects the algorithm. The Context accepts a strategy via constructor or setter, and it doesn't change on its own. The strategies don't know about each other. A sorting function with a pluggable comparator is Strategy — the caller picks the comparison algorithm. State: the OBJECT changes its own behavior. State transitions happen internally — DraftState knows about ReviewState and triggers the transition itself. The context's behavior evolves over its lifetime without external intervention. A document workflow is State — publishing moves from draft to review automatically. The practical test: if you'd set the strategy once at construction and never change it, it's Strategy. If the behavior changes automatically in response to actions or events, it's State. In code, Strategy rarely references other strategies; State objects frequently create or reference the next state.",
    difficulty: "core",
    category: "compare",
    followUps: [
      {
        question: "Can an object use both State and Strategy simultaneously?",
        expectedPoints: [
          "yes — State for lifecycle behavior, Strategy for pluggable algorithms within a state",
          "example: a game character uses State for (idle/fight/flee) and Strategy for (attack algorithm) within fight state",
          "they compose orthogonally",
        ],
      },
    ],
    evaluationCriteria: [
      "identifies structural identity but intent difference",
      "explains who triggers the change (client vs object)",
      "gives clear examples of each",
      "mentions that states reference each other but strategies don't",
    ],
  },
  {
    patternId: "state",
    slug: "state-invalid-transitions",
    question: "How do you prevent invalid state transitions?",
    modelAnswer:
      "There are several approaches at different enforcement levels. (1) Transition table: define allowed transitions explicitly — Map<State, Set<State>>. Before transitioning, check if the target state is in the allowed set. This is declarative and easy to visualize. (2) State classes enforce it: ReviewState.publish(context) transitions to PublishedState, but ReviewState has no method for 'moveToDraft' — the method simply doesn't exist or throws. The compiler/type system prevents invalid calls. (3) Type-state pattern in TypeScript: each state is a different type. A Draft<Document> has a .submit() method that returns Review<Document>, but no .publish() method. Invalid transitions are compile-time errors. (4) XState guards: declarative conditions that must be true for a transition to fire. (5) Event validation: validate events against the current state's allowed event set before processing. The strongest approach combines a transition table (for visualization and validation) with type-level enforcement (for compile-time safety).",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "How would you log and monitor state transitions in production?",
        expectedPoints: [
          "emit events on each transition for observability",
          "track transition counts and durations in metrics (Prometheus/DataDog)",
          "alert on unexpected transitions (transition to error state)",
          "store transition history for debugging (audit log)",
        ],
      },
    ],
    evaluationCriteria: [
      "describes at least 3 enforcement approaches",
      "mentions type-state pattern for compile-time safety",
      "references XState or formal state machine tools",
      "discusses the tradeoff between flexibility and safety",
    ],
  },

  // ── Proxy ─────────────────────────────────────────────────
  {
    patternId: "proxy",
    slug: "proxy-explain",
    question: "Explain the Proxy pattern and the different types of proxy.",
    modelAnswer:
      "Proxy provides a surrogate or placeholder that controls access to another object. The proxy has the same interface as the real subject — clients can't tell the difference. The proxy intercepts requests and may add behavior before, after, or instead of forwarding to the real subject. The main types: (1) Virtual Proxy — delays creation of expensive objects until first use. React.lazy() returns a proxy component that loads the real component on first render. (2) Protection Proxy — controls access based on permissions. Auth middleware that checks tokens before forwarding to the protected route. (3) Caching Proxy — stores results of expensive operations. Redis sitting in front of a database, returning cached results for repeated queries. (4) Logging Proxy — records all interactions for auditing without modifying the real object. (5) Remote Proxy — represents an object in another address space. gRPC stubs and GraphQL client wrappers are remote proxies. Each type adds exactly one access-control concern while maintaining interface transparency.",
    difficulty: "warmup",
    category: "explain",
    followUps: [
      {
        question: "How is JavaScript's built-in Proxy different from the GoF Proxy?",
        expectedPoints: [
          "JS Proxy intercepts at the meta-object level (get, set, apply, construct)",
          "GoF Proxy wraps specific methods via the same interface",
          "JS Proxy is more powerful — can intercept any property access dynamically",
          "Vue 3 reactivity uses JS Proxy for automatic dependency tracking",
        ],
      },
    ],
    evaluationCriteria: [
      "defines the same-interface requirement",
      "names at least 4 proxy types with examples",
      "distinguishes from Decorator and Adapter",
      "gives real-world examples for each type",
    ],
  },
  {
    patternId: "proxy",
    slug: "proxy-lazy-loading",
    question: "How would you implement a lazy-loading proxy for expensive API calls?",
    modelAnswer:
      "The proxy wraps the real API client and defers the actual call until the data is accessed. Implementation: define interface DataService { getReport(): Promise<Report> }. The RealDataService makes the expensive API call. The LazyProxy implements the same interface: it holds a private cache (Report | null) and a reference to the real service. On first getReport() call, it fetches from the real service, caches the result, and returns it. Subsequent calls return the cache directly. For more sophisticated lazy loading: use a Promise-based approach where getReport() returns a cached promise (not just the value) — this deduplicates concurrent requests. Multiple callers hitting getReport() simultaneously all await the same in-flight promise. Add a TTL: check if the cached result is stale and re-fetch if needed. Add cache invalidation: expose invalidate() to force a fresh fetch. This is exactly what React Query / SWR do — they're caching proxies for API calls with stale-while-revalidate semantics.",
    difficulty: "core",
    category: "apply",
    followUps: [
      {
        question: "How do React Query and SWR implement the stale-while-revalidate pattern?",
        expectedPoints: [
          "return stale cached data immediately for fast UI",
          "revalidate in the background",
          "update UI when fresh data arrives",
          "configurable staleTime and cacheTime",
        ],
      },
    ],
    evaluationCriteria: [
      "implements same-interface proxy correctly",
      "handles concurrent request deduplication",
      "mentions TTL and cache invalidation",
      "connects to real libraries (React Query, SWR)",
    ],
  },
  {
    patternId: "proxy",
    slug: "proxy-vue-reactivity",
    question: "How does Vue 3 use JavaScript Proxy for its reactivity system?",
    modelAnswer:
      "Vue 3's reactivity is built entirely on JavaScript's Proxy object. When you call reactive(obj), Vue creates a Proxy around the object. The Proxy's get trap intercepts property access — when a component reads data.count during render, the trap registers that component as a dependency of 'count' (this is 'tracking'). The set trap intercepts property mutation — when data.count = 5 is assigned, the trap notifies all registered dependents to re-render (this is 'triggering'). This is a massive improvement over Vue 2's Object.defineProperty approach, which couldn't detect property additions/deletions or array index mutations. Proxy intercepts everything: property access, assignment, deletion, enumeration, even 'in' operator checks. The effect() function wraps the render function — it sets a global 'activeEffect' so that get traps know which effect to register. ref() is similar but wraps a single value. The entire system is: Proxy for interception → dependency graph for tracking → batched updates for performance.",
    difficulty: "deep-dive",
    category: "apply",
    followUps: [
      {
        question: "Why did Vue 3 move from Object.defineProperty to Proxy?",
        expectedPoints: [
          "Proxy detects property addition and deletion",
          "Proxy handles array mutations natively",
          "Proxy doesn't require walking every property at init time",
          "Proxy is a cleaner abstraction — fewer edge cases and caveats",
        ],
      },
    ],
    evaluationCriteria: [
      "explains get/set trap mechanism correctly",
      "describes dependency tracking (track on read, trigger on write)",
      "contrasts with Vue 2's Object.defineProperty limitations",
      "mentions ref(), reactive(), and effect() functions",
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

  console.log(`    Upserting ${rows.length} interview Q&A rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
