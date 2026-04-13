/**
 * Pattern Walkthrough seed: step-by-step guided walkthroughs for the
 * 10 most important design patterns.
 *
 * Each walkthrough has 5-7 educational steps that build understanding
 * progressively — from the problem the pattern solves through to
 * real-world fluent/modern variants.
 *
 * Content type: 'pattern-walkthrough'
 * Module: 'lld'
 */

import type { Database } from "@/db";
import { batchUpsert } from "./seed-helpers";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "lld";
const CONTENT_TYPE = "pattern-walkthrough";

interface WalkthroughStep {
  stepNumber: number;
  title: string;
  description: string;
  highlightedClassIds: string[];
  keyInsight: string;
}

interface PatternWalkthrough {
  slug: string;
  name: string;
  category: string;
  steps: WalkthroughStep[];
}

const WALKTHROUGHS: PatternWalkthrough[] = [
  // ── 1. Singleton ────────────────────────────────────────────
  {
    slug: "singleton",
    name: "Singleton Walkthrough",
    category: "creational",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Uncontrolled Instance Proliferation",
        description:
          "Some resources must exist exactly once in a system — a database connection pool, a logger, a configuration registry. Without constraints, every caller creates its own instance, leading to duplicated state, wasted memory, and conflicting configurations. Imagine three parts of your app each spinning up a separate DB pool: you've tripled your connection count and introduced subtle race conditions.",
        highlightedClassIds: [],
        keyInsight:
          "When multiple instances of a shared resource cause bugs, you need a way to guarantee exactly one exists.",
      },
      {
        stepNumber: 2,
        title: "The Naive Fix: Global Variable",
        description:
          "The simplest approach is a global variable — export a single instance from a module. This works in many languages but offers no protection: any code can overwrite it, there's no lazy initialization, and it pollutes the global namespace. In languages without module systems (classic Java, C++), this is even worse — you get static initialization order problems.",
        highlightedClassIds: [],
        keyInsight:
          "A global variable gives you one instance but no control over when or how it's created.",
      },
      {
        stepNumber: 3,
        title: "The Singleton Class Structure",
        description:
          "The classic Singleton hides its constructor (private) and exposes a static getInstance() method. The first call creates the instance; subsequent calls return the same one. The class itself becomes the gatekeeper — nobody else can call 'new'. This is the GoF formulation: private constructor + static instance field + public static accessor.",
        highlightedClassIds: ["Singleton"],
        keyInsight:
          "Private constructor + static accessor = compile-time guarantee that only one instance can ever exist.",
      },
      {
        stepNumber: 4,
        title: "Thread Safety Considerations",
        description:
          "In concurrent environments, two threads can both see instance as null simultaneously and each create one — breaking the guarantee. Solutions include eager initialization (create at class-load time), synchronized/locked getInstance(), or double-checked locking. In Java, the Bill Pugh approach uses a static inner holder class that leverages the classloader's thread safety. In Node.js/Python, single-threaded execution makes this a non-issue for most cases.",
        highlightedClassIds: ["Singleton"],
        keyInsight:
          "Lazy Singleton in a multithreaded language needs synchronization — or use eager initialization to sidestep the problem entirely.",
      },
      {
        stepNumber: 5,
        title: "Modern Alternatives: Module Pattern & DI",
        description:
          "In modern TypeScript/JavaScript, ES modules are singletons by default — the module cache ensures a file is evaluated once. So 'export const db = new Pool()' is already a Singleton without the ceremony. In larger systems, Dependency Injection containers (NestJS, Spring, Angular) manage singleton scope declaratively. The GoF class-based Singleton is most relevant in Java/C++ where module-level singletons don't exist.",
        highlightedClassIds: ["Singleton"],
        keyInsight:
          "ES modules are natural singletons — the classic pattern is mainly needed in languages without module-scoped instances.",
      },
      {
        stepNumber: 6,
        title: "When Singleton Becomes an Anti-Pattern",
        description:
          "Singletons introduce hidden global state, making unit testing painful — you can't easily swap in a mock. They create tight coupling: every consumer depends on the concrete class. They violate the Single Responsibility Principle by managing their own lifecycle AND their domain logic. Use Singleton sparingly: connection pools, loggers, and config registries are legitimate; business-logic classes almost never are.",
        highlightedClassIds: [],
        keyInsight:
          "If you can't test your code without resetting a Singleton between tests, you've coupled too tightly to global state.",
      },
    ],
  },

  // ── 2. Factory Method ───────────────────────────────────────
  {
    slug: "factory-method",
    name: "Factory Method Walkthrough",
    category: "creational",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Hardcoded Object Creation",
        description:
          "Your code creates objects directly with 'new ConcreteClass()'. This works until you need to vary the type at runtime — different payment processors, different document renderers, different notification channels. Every if/else or switch that decides which class to instantiate scatters creation logic across your codebase and violates the Open/Closed Principle.",
        highlightedClassIds: [],
        keyInsight:
          "When 'new' appears inside business logic, you've coupled creation to consumption — any new type requires changing existing code.",
      },
      {
        stepNumber: 2,
        title: "Extract Creation Into a Method",
        description:
          "The Factory Method pattern defines an interface for creating objects but lets subclasses decide which class to instantiate. The creator class declares an abstract 'factoryMethod()' that returns a Product interface. Concrete creators override it to return specific products. Client code works with the creator and product interfaces, never knowing the concrete types.",
        highlightedClassIds: ["Creator", "Product"],
        keyInsight:
          "Defer the 'which class?' decision to subclasses — the framework calls your factory method, you decide what to build.",
      },
      {
        stepNumber: 3,
        title: "The Creator-Product Hierarchy",
        description:
          "You end up with two parallel hierarchies: Creators and Products. LogisticsApp (Creator) has subclasses RoadLogistics and SeaLogistics. Transport (Product) has subclasses Truck and Ship. RoadLogistics.createTransport() returns a Truck; SeaLogistics returns a Ship. The framework code in LogisticsApp.planDelivery() calls this.createTransport() without caring which concrete transport it gets.",
        highlightedClassIds: ["Creator", "ConcreteCreatorA", "ConcreteCreatorB", "Product", "ConcreteProductA", "ConcreteProductB"],
        keyInsight:
          "Parallel hierarchies (Creator ↔ Product) let you add new product families without modifying framework code.",
      },
      {
        stepNumber: 4,
        title: "Parameterized Factory Variant",
        description:
          "Instead of subclassing, you can pass a parameter (string, enum, config object) to a single factory method that switches on it. React.createElement(type) is a parameterized factory — 'div' vs MyComponent. This is simpler when you don't need the full subclass hierarchy but still want to centralize creation logic in one place.",
        highlightedClassIds: ["Creator"],
        keyInsight:
          "Parameterized factories trade type safety for simplicity — one method, one switch, all types in one place.",
      },
      {
        stepNumber: 5,
        title: "Real-World Examples",
        description:
          "Node.js http.createServer() is a factory method — it returns an http.Server without exposing the constructor. React's createElement() builds virtual DOM nodes. In Express, app.use() creates middleware chains through an internal factory. Java's Collection.iterator() is a textbook factory method — each collection subclass returns its own iterator implementation.",
        highlightedClassIds: [],
        keyInsight:
          "Factory Methods are everywhere in frameworks — they're how libraries let you extend behavior without forking source code.",
      },
      {
        stepNumber: 6,
        title: "Factory Method vs Abstract Factory",
        description:
          "Factory Method creates one product via inheritance (subclass overrides a method). Abstract Factory creates families of related products via composition (inject a factory object). Use Factory Method when a class can't anticipate which objects it needs to create. Use Abstract Factory when you need to ensure a set of products are used together (e.g., Windows widgets vs Mac widgets).",
        highlightedClassIds: [],
        keyInsight:
          "Factory Method = one product via subclassing. Abstract Factory = a family of products via composition.",
      },
    ],
  },

  // ── 3. Builder ──────────────────────────────────────────────
  {
    slug: "builder",
    name: "Builder Walkthrough",
    category: "creational",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Telescoping Constructors",
        description:
          "Your class has 10+ constructor parameters — some required, some optional, with multiple valid combinations. Each combination needs its own constructor overload: new Pizza(size), new Pizza(size, cheese), new Pizza(size, cheese, pepperoni, mushrooms...). This is unreadable, error-prone (was that third boolean for olives or onions?), and impossible to maintain as you add new options.",
        highlightedClassIds: [],
        keyInsight:
          "When a constructor has more than 3-4 parameters, the call site becomes a guessing game — Builder makes it self-documenting.",
      },
      {
        stepNumber: 2,
        title: "Naive Fix: Config Object",
        description:
          "Passing a config object (new Pizza({ size: 'L', cheese: true })) is cleaner but still has issues: there's no validation order, no way to enforce required-before-optional sequences, and no compile-time guarantee that the object is fully configured. You've moved complexity from the parameter list to the config shape — but haven't eliminated it.",
        highlightedClassIds: [],
        keyInsight:
          "Config objects move complexity around but don't reduce it — you still need validation, defaults, and ordering guarantees.",
      },
      {
        stepNumber: 3,
        title: "Enter the Builder Interface",
        description:
          "The Builder interface declares step-by-step methods: setSize(), addCheese(), addTopping(). Each method configures one aspect and returns void (or the builder itself for chaining). The interface defines WHAT can be configured without specifying HOW — different builders might construct different representations from the same steps.",
        highlightedClassIds: ["Builder"],
        keyInsight:
          "A Builder interface separates the construction algorithm from the representation — same steps, different results.",
      },
      {
        stepNumber: 4,
        title: "The ConcreteBuilder",
        description:
          "The ConcreteBuilder implements the Builder interface and holds the product being assembled. Each method mutates internal state: addTopping() pushes to a toppings array; setSize() stores the size enum. A getResult() method returns the finished product and resets the builder for reuse. The product's constructor can be private — only the builder can create it, guaranteeing all products are well-formed.",
        highlightedClassIds: ["ConcreteBuilder", "Product"],
        keyInsight:
          "The builder owns the product during construction — private constructors ensure nobody can create a half-built object.",
      },
      {
        stepNumber: 5,
        title: "The Director",
        description:
          "The Director knows HOW to build common configurations using a builder. director.buildMargherita(builder) calls builder.setSize('M'), builder.addCheese('mozzarella'), builder.addSauce('tomato') in the right order. The Director encodes domain recipes; the Builder handles construction mechanics. You can skip the Director and drive the builder directly when recipes aren't reusable.",
        highlightedClassIds: ["Director"],
        keyInsight:
          "Directors encode reusable recipes — separate 'what to build' (Director) from 'how to assemble' (Builder).",
      },
      {
        stepNumber: 6,
        title: "Fluent API Variant: Method Chaining",
        description:
          "The most popular modern variant returns 'this' from each method, enabling chaining: query.select('*').from('users').where('active', true).limit(10). Knex, Axios config, Prisma queries, and Java's StringBuilder all use this. The fluent API IS the builder — no separate Director needed. TypeScript can even enforce step ordering via type-state: after .select() you get a type that only allows .from().",
        highlightedClassIds: ["ConcreteBuilder"],
        keyInsight:
          "Fluent builders (method chaining) are the dominant modern form — Knex, Prisma, and StringBuilder are all builders in disguise.",
      },
    ],
  },

  // ── 4. Observer ─────────────────────────────────────────────
  {
    slug: "observer",
    name: "Observer Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Polling for Changes",
        description:
          "Component A needs to react when Component B's state changes. Without a notification mechanism, A must repeatedly check B (polling): 'has the price changed yet? How about now?' This wastes CPU cycles, introduces latency (you only detect changes at poll intervals), and creates tight coupling — A must know B's internal state structure to check it.",
        highlightedClassIds: [],
        keyInsight:
          "Polling is wasteful and laggy — push-based notification lets interested parties react instantly without checking.",
      },
      {
        stepNumber: 2,
        title: "The Publish-Subscribe Mechanism",
        description:
          "Observer defines a one-to-many dependency: when one object (the Subject) changes state, all dependents (Observers) are notified automatically. The Subject maintains a list of subscribers and exposes subscribe(), unsubscribe(), and notify() methods. Observers implement an update() method that the Subject calls. This inverts the dependency — Observers register interest rather than polling.",
        highlightedClassIds: ["Subject", "Observer"],
        keyInsight:
          "Invert the dependency: instead of consumers checking for changes, let the source push notifications to registered listeners.",
      },
      {
        stepNumber: 3,
        title: "Push vs Pull Models",
        description:
          "In the push model, the Subject sends the changed data directly in update(data). In the pull model, update() just signals 'something changed' and the Observer calls subject.getState() to fetch what it needs. Push is simpler but may send irrelevant data. Pull is flexible but requires the Observer to know the Subject's API. Most modern implementations (React state, RxJS) use push with typed event payloads.",
        highlightedClassIds: ["Subject", "Observer"],
        keyInsight:
          "Push sends data eagerly; Pull notifies lazily — push is dominant in modern event-driven architectures.",
      },
      {
        stepNumber: 4,
        title: "Real-World: Node.js EventEmitter",
        description:
          "Node.js EventEmitter is Observer in its purest form: emitter.on('data', callback) subscribes, emitter.emit('data', payload) notifies. Every stream, server, and socket in Node extends EventEmitter. The DOM's addEventListener is the same pattern. React's useState + useEffect is Observer with the framework managing subscription lifecycle automatically.",
        highlightedClassIds: ["Subject"],
        keyInsight:
          "EventEmitter IS the Observer pattern — Node.js built its entire I/O model on publish-subscribe.",
      },
      {
        stepNumber: 5,
        title: "Avoiding Memory Leaks",
        description:
          "The biggest Observer pitfall is forgetting to unsubscribe. If a component subscribes to a global EventEmitter but never calls removeListener, the emitter holds a reference to the dead component forever — a classic memory leak. React's useEffect cleanup, RxJS's unsubscribe(), and AbortController all solve this. The rule: every subscribe must have a paired unsubscribe on teardown.",
        highlightedClassIds: [],
        keyInsight:
          "Every subscription is a potential memory leak — always clean up in componentWillUnmount / useEffect cleanup / dispose().",
      },
      {
        stepNumber: 6,
        title: "Observer vs Mediator vs Event Bus",
        description:
          "Observer is direct: Subject knows its Observers. Mediator centralizes communication — components talk through a hub, not to each other. An Event Bus (Redux, Kafka) is a Mediator for events — publishers and subscribers never reference each other. Use Observer for local, focused notifications. Use Mediator/Event Bus when many-to-many communication creates a tangled dependency web.",
        highlightedClassIds: [],
        keyInsight:
          "Observer = direct notification. Event Bus = decoupled broadcast. Choose based on how many publishers and subscribers you have.",
      },
    ],
  },

  // ── 5. Strategy ─────────────────────────────────────────────
  {
    slug: "strategy",
    name: "Strategy Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Conditional Algorithm Selection",
        description:
          "Your payment processor has a massive if/else chain: if (method === 'credit') { ... } else if (method === 'paypal') { ... } else if (method === 'crypto') { ... }. Adding a new payment method means modifying this function, risking regressions in all existing methods. The function grows linearly with each new algorithm, violating Open/Closed and making testing a nightmare.",
        highlightedClassIds: [],
        keyInsight:
          "A growing if/else chain for algorithm selection is a code smell — each branch should be its own encapsulated class.",
      },
      {
        stepNumber: 2,
        title: "Extract Each Algorithm Into a Strategy",
        description:
          "Define a Strategy interface with a single method: execute(context). Each algorithm becomes a class implementing that interface — CreditCardStrategy, PayPalStrategy, CryptoStrategy. Each class encapsulates its own logic, validation, and error handling. You can test each strategy in isolation without instantiating the others.",
        highlightedClassIds: ["Strategy", "ConcreteStrategyA", "ConcreteStrategyB"],
        keyInsight:
          "One class per algorithm, one interface to bind them — adding a new strategy means adding a class, not editing existing ones.",
      },
      {
        stepNumber: 3,
        title: "The Context Delegates to Strategy",
        description:
          "The Context class holds a reference to a Strategy and delegates the work: this.strategy.execute(data). The Context doesn't know or care which concrete strategy it holds. Callers configure the Context at construction time or swap strategies at runtime via setStrategy(). This is composition over inheritance in action.",
        highlightedClassIds: ["Context", "Strategy"],
        keyInsight:
          "The Context is strategy-agnostic — it delegates, never decides. Strategy selection happens at the boundary, not inside business logic.",
      },
      {
        stepNumber: 4,
        title: "Runtime Strategy Swapping",
        description:
          "Unlike Template Method (which uses inheritance and is fixed at compile time), Strategy allows runtime swapping. A sorting library can switch between QuickSort (for large arrays) and InsertionSort (for small arrays) mid-operation. React Router's history object swaps between BrowserHistory and HashHistory depending on environment. This flexibility is Strategy's superpower.",
        highlightedClassIds: ["Context"],
        keyInsight:
          "Strategy's killer feature is runtime flexibility — swap algorithms based on data size, user preference, or environment.",
      },
      {
        stepNumber: 5,
        title: "Functions as Strategies",
        description:
          "In JavaScript/TypeScript, you don't always need classes. A strategy can be a plain function: sort(arr, compareFn). Array.sort(), React's custom hooks, and Express middleware are all functional strategies. The 'interface' is just the function signature. Use classes when strategies have state or multiple methods; use functions when a single callback suffices.",
        highlightedClassIds: [],
        keyInsight:
          "In languages with first-class functions, a callback IS a Strategy — Array.sort(compareFn) is the pattern without the ceremony.",
      },
      {
        stepNumber: 6,
        title: "Strategy vs State vs Template Method",
        description:
          "Strategy and State both use composition to delegate behavior, but State transitions are driven by internal state changes (the object rewires itself). Strategy is selected externally by the client. Template Method achieves similar variation via inheritance — the superclass defines the algorithm skeleton, subclasses fill in steps. Strategy is more flexible (runtime swap); Template Method is simpler (no extra objects).",
        highlightedClassIds: [],
        keyInsight:
          "Strategy = client picks the algorithm. State = object picks internally. Template Method = inheritance instead of composition.",
      },
    ],
  },

  // ── 6. Decorator ────────────────────────────────────────────
  {
    slug: "decorator",
    name: "Decorator Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Subclass Explosion",
        description:
          "You have a Notifier class. Now you need EmailNotifier, SlackNotifier, SMSNotifier. Then you need EmailAndSlackNotifier, EmailAndSMSNotifier, SlackAndSMSNotifier, AllThreeNotifier. With N notification channels, you need 2^N subclasses to cover every combination. Each new channel doubles your class count. Inheritance doesn't compose — it multiplies.",
        highlightedClassIds: [],
        keyInsight:
          "When the number of subclasses grows exponentially with feature combinations, inheritance is the wrong tool — you need composition.",
      },
      {
        stepNumber: 2,
        title: "Wrap Instead of Extend",
        description:
          "Decorator wraps an object with the same interface, adding behavior before or after delegating to the wrapped object. Each decorator IS-A Component (same interface) and HAS-A Component (wraps one). This means decorators can wrap other decorators infinitely: new Encryption(new Compression(new FileWriter())). Each layer adds one responsibility.",
        highlightedClassIds: ["Component", "Decorator"],
        keyInsight:
          "Decorator = same interface + wraps the original. Stack them like layers — each one adds exactly one behavior.",
      },
      {
        stepNumber: 3,
        title: "The Decorator Structure",
        description:
          "The Component interface defines the operations. ConcreteComponent is the base object. The Decorator abstract class implements Component and holds a reference to another Component. Concrete decorators (LoggingDecorator, CachingDecorator) override methods to add behavior, then call this.wrapped.operation() to delegate. The client sees a single Component — it doesn't know how many layers exist.",
        highlightedClassIds: ["Component", "ConcreteComponent", "Decorator", "ConcreteDecoratorA", "ConcreteDecoratorB"],
        keyInsight:
          "Transparency is key: the client can't tell a decorated object from an undecorated one — they share the same interface.",
      },
      {
        stepNumber: 4,
        title: "Real-World: Node.js Streams and Express Middleware",
        description:
          "Node.js streams are decorators: a Transform stream wraps a Readable, adding compression or encryption while maintaining the stream interface. Express/Koa middleware is a decoration chain — each middleware wraps the next, adding logging, auth, CORS, etc. Java's I/O is the textbook example: new BufferedReader(new InputStreamReader(new FileInputStream(file))) — three decorators deep.",
        highlightedClassIds: [],
        keyInsight:
          "Middleware stacks ARE decorator chains — Express, Koa, and Java I/O all prove this pattern scales to production.",
      },
      {
        stepNumber: 5,
        title: "TypeScript Decorators (@decorator)",
        description:
          "TypeScript/Python's @decorator syntax is a language-level implementation of this pattern. @Injectable(), @Controller(), @Log() all wrap a class or method with additional behavior. NestJS, Angular, and MobX are built on decorators. The @ syntax is syntactic sugar for the same composition: the decorator function receives the target and returns an enhanced version.",
        highlightedClassIds: [],
        keyInsight:
          "The @ symbol in TypeScript/Python IS the Decorator pattern codified into language syntax — same concept, cleaner surface.",
      },
      {
        stepNumber: 6,
        title: "Decorator vs Proxy vs Chain of Responsibility",
        description:
          "Decorator adds behavior to an existing interface. Proxy controls access to the same interface (lazy loading, caching, access control). Chain of Responsibility passes a request through handlers where each can choose to process or forward it. The key distinction: Decorator always delegates to the wrapped object; CoR handlers may short-circuit. Proxy typically wraps a single object; Decorator chains stack.",
        highlightedClassIds: [],
        keyInsight:
          "Decorator always delegates. Proxy controls access. Chain of Responsibility can short-circuit — know which wrapping semantics you need.",
      },
    ],
  },

  // ── 7. Adapter ──────────────────────────────────────────────
  {
    slug: "adapter",
    name: "Adapter Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Incompatible Interfaces",
        description:
          "You're integrating a third-party analytics library, but its API expects XML data while your system produces JSON. Or you're migrating from MySQL to PostgreSQL and your repository layer speaks MySQL-specific queries. The existing code works fine — the new component works fine — but they can't talk to each other because their interfaces don't match.",
        highlightedClassIds: [],
        keyInsight:
          "When two working components can't communicate because their interfaces differ, you need a translator — not a rewrite.",
      },
      {
        stepNumber: 2,
        title: "The Adapter Bridges the Gap",
        description:
          "An Adapter wraps the incompatible class (Adaptee) and exposes the interface the client expects (Target). The client calls target.request(); the adapter translates that into adaptee.specificRequest() internally. The client never knows it's talking to a wrapper — it only sees the Target interface. The Adaptee is unchanged — no modifications needed.",
        highlightedClassIds: ["Target", "Adapter", "Adaptee"],
        keyInsight:
          "Adapter translates interface A to interface B without modifying either — it's a bridge, not a rewrite.",
      },
      {
        stepNumber: 3,
        title: "Object Adapter vs Class Adapter",
        description:
          "Object Adapter uses composition: it holds a reference to the Adaptee and delegates calls. This is the standard approach in JavaScript/TypeScript and the more flexible option — you can adapt any subclass of the Adaptee. Class Adapter uses multiple inheritance (available in C++, Python): the adapter extends both Target and Adaptee. Simpler but less flexible. In practice, Object Adapter dominates.",
        highlightedClassIds: ["Adapter", "Adaptee"],
        keyInsight:
          "Object Adapter (composition) works everywhere and is more flexible. Class Adapter (inheritance) is a niche optimization.",
      },
      {
        stepNumber: 4,
        title: "Real-World: ORMs, API Wrappers, and Polyfills",
        description:
          "Every ORM is an Adapter — Prisma adapts SQL databases to a TypeScript-object interface. Axios adapts the browser's XMLHttpRequest and Node's http module to one unified API. Polyfills are adapters for missing browser APIs: they expose the standard interface while implementing it with available primitives. AWS SDK adapters let you swap between S3-compatible providers.",
        highlightedClassIds: [],
        keyInsight:
          "ORMs, API clients, and polyfills are all Adapters — they're the most common pattern in integration code.",
      },
      {
        stepNumber: 5,
        title: "Two-Way Adapters and Legacy Migration",
        description:
          "During gradual migrations, you often need a two-way adapter: old code calls the adapter with the old interface, new code calls it with the new interface, and the adapter translates both directions. This is how you migrate from REST to GraphQL incrementally — the adapter serves both protocols. Once migration is complete, you remove the adapter and the old interface.",
        highlightedClassIds: ["Adapter"],
        keyInsight:
          "Two-way adapters enable incremental migration — run old and new systems simultaneously without a big-bang cutover.",
      },
    ],
  },

  // ── 8. Command ──────────────────────────────────────────────
  {
    slug: "command",
    name: "Command Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Tightly Coupled Actions",
        description:
          "A UI button directly calls editor.bold() when clicked. Now you need the same action from a keyboard shortcut, a menu item, a toolbar button, and a voice command. Each trigger duplicates the call. Worse, you need undo/redo — but there's no record of what was done. The action and its trigger are fused together, making reuse and history tracking impossible.",
        highlightedClassIds: [],
        keyInsight:
          "When actions are hardcoded to triggers, you can't reuse them, queue them, undo them, or log them — encapsulate the action as an object.",
      },
      {
        stepNumber: 2,
        title: "Encapsulate Actions as Objects",
        description:
          "Command turns a request into a stand-alone object containing all information needed to perform the action. A BoldCommand stores the receiver (editor), the execute() method (editor.bold()), and enough state to undo(). Now any trigger — button, shortcut, menu — can hold a Command reference and call execute(). The trigger is completely decoupled from the action.",
        highlightedClassIds: ["Command", "ConcreteCommand"],
        keyInsight:
          "A Command object is a reified method call — it captures the action, the receiver, and the parameters as a first-class object.",
      },
      {
        stepNumber: 3,
        title: "The Invoker and Receiver",
        description:
          "The Invoker triggers commands without knowing what they do — it just calls command.execute(). A toolbar button is an Invoker. The Receiver is the object that actually performs the work — the text editor, the file system, the database. The Command sits between them: it knows the Receiver and which method to call. This three-layer decoupling is the pattern's power.",
        highlightedClassIds: ["Invoker", "Command", "Receiver"],
        keyInsight:
          "Invoker triggers, Command translates, Receiver acts — three objects that can each change independently.",
      },
      {
        stepNumber: 4,
        title: "Undo/Redo with Command History",
        description:
          "Since each Command is an object, you can store executed commands in a history stack. Undo pops the last command and calls command.undo(). Redo re-executes it. The Command must capture enough state to reverse its effect — BoldCommand remembers the selection range and previous formatting. This is how every text editor, Photoshop, and Git implements undo.",
        highlightedClassIds: ["Command"],
        keyInsight:
          "Command + Stack = Undo/Redo. Every editor you've ever used implements this exact pattern.",
      },
      {
        stepNumber: 5,
        title: "Macro Commands and Queuing",
        description:
          "A MacroCommand holds a list of commands and executes them sequentially — one button click performs multiple actions. Commands can be serialized and queued: task queues (Bull, RabbitMQ) send Command objects to workers for deferred execution. CQRS (Command Query Responsibility Segregation) is this pattern at architecture scale — commands mutate state, queries read it.",
        highlightedClassIds: [],
        keyInsight:
          "Commands compose (macros), serialize (queues), and scale (CQRS) — the pattern works from UI buttons to distributed systems.",
      },
      {
        stepNumber: 6,
        title: "Real-World: Redux Actions, Git, and Task Queues",
        description:
          "Redux actions are Command objects: { type: 'ADD_TODO', payload: {...} }. The store is the Invoker; the reducer is the Receiver. Git commits are Commands with full undo capability (git revert). Task queues (Celery, Bull) serialize Command objects for async execution. Even SQL transactions follow the Command pattern — BEGIN is the start, COMMIT executes, ROLLBACK is undo.",
        highlightedClassIds: [],
        keyInsight:
          "Redux actions ARE commands. Git commits ARE commands. The pattern is foundational to every system that tracks or queues operations.",
      },
    ],
  },

  // ── 9. State ────────────────────────────────────────────────
  {
    slug: "state",
    name: "State Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Conditional State Spaghetti",
        description:
          "Your Document class has a publish() method with a growing conditional: if (state === 'draft') { ... } else if (state === 'review') { ... } else if (state === 'published') { ... }. Every method in the class has the same if/else chain. Adding a new state ('archived') means editing every method. The state logic is smeared across the entire class, and you can't reason about one state's behavior in isolation.",
        highlightedClassIds: [],
        keyInsight:
          "When every method in a class starts with 'if (state === ...)' you have state logic scattered everywhere — consolidate it.",
      },
      {
        stepNumber: 2,
        title: "Model Each State as a Class",
        description:
          "State pattern extracts each state into its own class implementing a common State interface. DraftState, ReviewState, PublishedState each define how the document behaves in that state: DraftState.publish() moves to review, ReviewState.publish() moves to published. The behavior for each state is encapsulated in one class — no conditionals needed.",
        highlightedClassIds: ["State", "ConcreteStateA", "ConcreteStateB"],
        keyInsight:
          "One class per state, all behavior for that state in one place — adding a state means adding a class, not editing existing ones.",
      },
      {
        stepNumber: 3,
        title: "The Context Delegates to Current State",
        description:
          "The Context (Document) holds a reference to its current State object. When document.publish() is called, it delegates: this.state.publish(this). The state object performs the action and may transition the context to a new state: context.setState(new PublishedState()). The Context never decides its own behavior — it always asks the current state.",
        highlightedClassIds: ["Context", "State"],
        keyInsight:
          "The Context is a shell — it delegates every decision to whichever State object it currently holds.",
      },
      {
        stepNumber: 4,
        title: "State Transitions: Who Decides?",
        description:
          "Two approaches: (1) States decide — DraftState.publish() sets context to ReviewState. This is simpler and keeps transition logic near the behavior. (2) Context decides using a transition table mapping (currentState, event) → nextState. This is more explicit and easier to validate. Finite state machine libraries (XState) use the table approach. For simple cases, let states decide; for complex workflows, use a transition table.",
        highlightedClassIds: ["ConcreteStateA", "ConcreteStateB"],
        keyInsight:
          "Let states manage their own transitions for simple flows; use a transition table (XState) when the state graph gets complex.",
      },
      {
        stepNumber: 5,
        title: "Real-World: TCP Connections, UI Components, Game AI",
        description:
          "TCP connection states (LISTEN, SYN_SENT, ESTABLISHED, FIN_WAIT) are the textbook example — each state handles packets differently. React component lifecycle (mounting, updating, unmounting) follows the same pattern. Game character AI (idle, patrol, chase, attack) uses State to switch behavior based on environmental triggers. XState brings formal state machines to JavaScript with visualizable state charts.",
        highlightedClassIds: [],
        keyInsight:
          "TCP, React lifecycle, and game AI all use the State pattern — anywhere behavior changes with mode, State applies.",
      },
      {
        stepNumber: 6,
        title: "State vs Strategy",
        description:
          "State and Strategy are structurally identical — both use composition to delegate behavior to an interchangeable object. The difference is intent: Strategy is selected externally by the client and doesn't change on its own. State transitions internally — the object itself decides to switch. In State, the states know about each other (to transition); in Strategy, strategies are independent and interchangeable.",
        highlightedClassIds: [],
        keyInsight:
          "Strategy = the client picks the behavior. State = the object changes its own behavior based on internal transitions.",
      },
    ],
  },

  // ── 10. Proxy ───────────────────────────────────────────────
  {
    slug: "proxy",
    name: "Proxy Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Expensive or Sensitive Direct Access",
        description:
          "Loading a 50MB image upfront wastes memory if it's never viewed. Querying a remote database on every call is slow without caching. Letting any code directly access a sensitive service (billing, admin panel) is a security risk. In each case, you need a gatekeeper that sits between the client and the real object — controlling when, how, or whether the real object is accessed.",
        highlightedClassIds: [],
        keyInsight:
          "When direct access is too expensive, too slow, or too risky, you need a stand-in that controls access to the real object.",
      },
      {
        stepNumber: 2,
        title: "The Proxy Has the Same Interface",
        description:
          "A Proxy implements the exact same interface as the real object (Subject). The client talks to the proxy as if it were the real thing — it can't tell the difference. Internally, the proxy holds a reference to the real subject and decides when to forward requests. This transparency is what makes Proxy different from Adapter (different interface) or Facade (simplified interface).",
        highlightedClassIds: ["Subject", "Proxy", "RealSubject"],
        keyInsight:
          "Proxy = same interface as the real object. The client never knows it's not talking to the real thing.",
      },
      {
        stepNumber: 3,
        title: "Types of Proxy",
        description:
          "Virtual Proxy delays creation of expensive objects until first use (lazy-loaded images). Caching Proxy stores results of expensive operations (Redis in front of a database). Protection Proxy checks permissions before forwarding (auth middleware). Logging Proxy records all calls for auditing. Remote Proxy represents an object in another process/server (gRPC stubs, Java RMI). Each type adds exactly one concern.",
        highlightedClassIds: ["Proxy"],
        keyInsight:
          "Virtual, Caching, Protection, Logging, Remote — each proxy type adds exactly one access-control concern.",
      },
      {
        stepNumber: 4,
        title: "Real-World: JavaScript Proxy, ORMs, and API Gateways",
        description:
          "JavaScript's built-in Proxy object is a meta-programming proxy — it intercepts property access, assignment, and function calls. Vue 3's reactivity system is built on Proxy: accessing data.name triggers the getter trap, which registers a reactive dependency. ORMs use lazy-loading proxies for relationships. API gateways (Kong, Nginx) are caching/protection proxies at infrastructure scale.",
        highlightedClassIds: [],
        keyInsight:
          "JavaScript's Proxy object IS the pattern built into the language — Vue 3's entire reactivity system runs on it.",
      },
      {
        stepNumber: 5,
        title: "Proxy vs Decorator vs Facade",
        description:
          "All three wrap objects, but with different intent. Proxy controls access — same interface, manages lifecycle or permissions. Decorator adds behavior — same interface, enhances functionality. Facade simplifies — different (simpler) interface to a complex subsystem. A caching proxy and a caching decorator look similar, but the proxy owns the lifecycle of the real object; the decorator assumes it already exists.",
        highlightedClassIds: [],
        keyInsight:
          "Proxy controls access. Decorator adds behavior. Facade simplifies interface. Same wrapping mechanic, different purpose.",
      },
      {
        stepNumber: 6,
        title: "Lazy Loading and Performance Proxies",
        description:
          "Lazy loading is Proxy's most impactful application. React.lazy() returns a proxy component that loads the real component on first render. Prisma's relation loading uses proxies — user.posts isn't loaded until you access it. Webpack's dynamic imports create proxy modules. The proxy pattern is how every framework implements 'load only what you need, when you need it.'",
        highlightedClassIds: ["Proxy", "RealSubject"],
        keyInsight:
          "React.lazy(), ORM lazy-loading, and dynamic imports are all proxies — the pattern is the foundation of performance optimization.",
      },
    ],
  },
];

export async function seed(db: Database) {
  const rows: NewModuleContent[] = WALKTHROUGHS.map((wt, i) => ({
    moduleId: MODULE_ID,
    contentType: CONTENT_TYPE,
    slug: wt.slug,
    name: wt.name,
    category: wt.category,
    difficulty: null,
    sortOrder: i,
    summary: wt.steps[0].description.slice(0, 300),
    tags: ["pattern-walkthrough", wt.category, wt.slug],
    content: { steps: wt.steps },
  }));

  console.log(`    Upserting ${rows.length} pattern walkthrough rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
