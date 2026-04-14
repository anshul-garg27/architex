// ─────────────────────────────────────────────────────────────
// Architex — Pattern Enrichment Data (LLD-023)
// ─────────────────────────────────────────────────────────────
//
// Provides complexity analysis, design rationale, common variations,
// anti-patterns, deep interview Q&A, and a pattern selection guide.
// Kept separate from patterns.ts to manage file size.
// ─────────────────────────────────────────────────────────────

// ── Pattern Selection Guide ─────────────────────────────────
// Extracted from pattern-selection-guide.md decision matrix.

export const PATTERN_SELECTION_GUIDE: Array<{
  signal: string;
  pattern: string;
  category: string;
}> = [
  { signal: "Only one instance globally", pattern: "Singleton", category: "creational" },
  { signal: "Create objects based on type/input", pattern: "Factory Method", category: "creational" },
  { signal: "Families of related objects (platform, theme)", pattern: "Abstract Factory", category: "creational" },
  { signal: "Many optional constructor parameters", pattern: "Builder", category: "creational" },
  { signal: "Clone/copy an expensive object", pattern: "Prototype", category: "creational" },
  { signal: "Reuse expensive resources (connections)", pattern: "Object Pool", category: "creational" },
  { signal: "Inject dependencies for testability", pattern: "Dependency Injection", category: "creational" },
  { signal: "Integrate incompatible interface / legacy", pattern: "Adapter", category: "structural" },
  { signal: "Varies in 2 dimensions (shape x color)", pattern: "Bridge", category: "structural" },
  { signal: "Tree / hierarchy / part-whole", pattern: "Composite", category: "structural" },
  { signal: "Add features dynamically / stack behaviors", pattern: "Decorator", category: "structural" },
  { signal: "Simplify a complex subsystem", pattern: "Facade", category: "structural" },
  { signal: "Millions of similar objects / memory constraint", pattern: "Flyweight", category: "structural" },
  { signal: "Lazy loading / access control / caching layer", pattern: "Proxy", category: "structural" },
  { signal: "Multiple ways to do the same thing", pattern: "Strategy", category: "behavioral" },
  { signal: "When X happens, notify Y, Z, W", pattern: "Observer", category: "behavioral" },
  { signal: "Undo/redo, macro, queued operations", pattern: "Command", category: "behavioral" },
  { signal: "Behavior depends on current state / FSM", pattern: "State", category: "behavioral" },
  { signal: "Pipeline / middleware / approval chain", pattern: "Chain of Responsibility", category: "behavioral" },
  { signal: "Algorithm skeleton with variable steps", pattern: "Template Method", category: "behavioral" },
  { signal: "Traverse a collection / paginate", pattern: "Iterator", category: "behavioral" },
  { signal: "Many-to-many communication centralized", pattern: "Mediator", category: "behavioral" },
  { signal: "Save/restore snapshots / checkpoints", pattern: "Memento", category: "behavioral" },
  { signal: "New operations on structure without modifying it", pattern: "Visitor", category: "behavioral" },
  { signal: "Avoid null checks / default do-nothing", pattern: "Null Object", category: "behavioral" },
  { signal: "Composable business rules / filters", pattern: "Specification", category: "behavioral" },
  { signal: "Notification channel selection at runtime", pattern: "Strategy + Factory", category: "behavioral" },
  { signal: "Rate limiting with different algorithms", pattern: "Strategy + Decorator", category: "behavioral" },
  { signal: "Multi-step order workflow", pattern: "State + Observer", category: "behavioral" },
  { signal: "Configurable logging levels and destinations", pattern: "Singleton + Chain of Responsibility + Strategy", category: "behavioral" },
  { signal: "Payment processing with multiple gateways", pattern: "Strategy + Factory", category: "behavioral" },
  { signal: "Caching with eviction policies", pattern: "Strategy + Proxy + Decorator", category: "structural" },
  { signal: "File system tree with operations", pattern: "Composite + Visitor", category: "structural" },
  { signal: "Plugin architecture", pattern: "Strategy + Factory + Observer", category: "behavioral" },
  { signal: "Game character creation with variations", pattern: "Builder + Prototype", category: "creational" },
];

// ── Enrichment Data per Pattern ─────────────────────────────
// Maps pattern ID to complexity analysis, design rationale,
// common variations, anti-patterns, and deep interview Q&A.

export interface PatternEnrichment {
  complexityAnalysis: string;
  designRationale: string;
  commonVariations: string[];
  antiPatterns: string[];
  interviewDepth: {
    question: string;
    expectedAnswer: string;
    followUp?: string;
  }[];
}

export const PATTERN_ENRICHMENTS: Record<string, PatternEnrichment> = {
  // ════════════════════════════════════════════════════════════
  //  CREATIONAL PATTERNS
  // ════════════════════════════════════════════════════════════

  singleton: {
    complexityAnalysis: `**Time Complexity:** O(1) for getInstance() -- constant-time check and return.
**Space Complexity:** O(1) -- exactly one instance regardless of how many callers access it.
**Thread Safety:** Depends on implementation. Bill Pugh Holder and Enum approaches are inherently thread-safe with zero synchronization overhead. Double-checked locking requires volatile keyword. Simple lazy init is NOT thread-safe.`,
    designRationale: `Singleton exists to solve a specific resource-management problem: when creating multiple instances would cause resource conflicts (multiple connection pools fighting over sockets), data inconsistency (multiple config managers with different states), or waste (loading the same 100MB config file twice). The core design decision is to make the class itself responsible for enforcing the "one instance" invariant, rather than relying on caller discipline. The tradeoff is testability -- by coupling instantiation to a static method, you make dependency injection harder. Modern best practice: use DI containers (Spring, Guice) to manage singleton scope instead of the GoF pattern.`,
    commonVariations: [
      "Bill Pugh Holder (inner static class, JVM class-loading guarantees thread safety)",
      "Enum Singleton (Effective Java recommended -- handles serialization and reflection attacks)",
      "Double-Checked Locking (requires volatile, explicit synchronization)",
      "Module-level Singleton (Node.js/Python -- module cache acts as singleton)",
      "DI-managed Singleton (Spring @Scope, Guice @Singleton -- framework controls lifecycle)",
    ],
    antiPatterns: [
      "Global state dump -- using Singleton as a catch-all for unrelated data turns it into a God Object",
      "Hidden dependencies -- callers depend on Singleton without declaring it in their constructor signatures",
      "Testing nightmare -- cannot easily substitute mocks when tests depend on global Singleton state",
      "Premature optimization -- using Singleton 'just in case' when multiple instances would be fine",
    ],
    interviewDepth: [
      {
        question: "How would you make a Singleton testable?",
        expectedAnswer: "Access the Singleton through an interface and inject it via constructor. The DI container manages the single-instance lifecycle, but the consuming class depends only on the interface. In tests, inject a mock implementation.",
        followUp: "Can you show how Spring manages singleton scope differently from the GoF Singleton?",
      },
      {
        question: "What happens when you try to serialize and deserialize a Singleton?",
        expectedAnswer: "Standard Java serialization creates a new instance on deserialization, breaking the singleton guarantee. Fix: implement readResolve() to return the existing instance, or use an Enum Singleton which handles this automatically.",
        followUp: "What about reflection attacks -- can you use reflection to call the private constructor?",
      },
    ],
  },

  "factory-method": {
    complexityAnalysis: `**Time Complexity:** O(1) for object creation -- constant-time dispatch to the correct constructor.
**Space Complexity:** O(1) per creation -- one new object. The factory itself is stateless.
**Scalability:** Adding new product types is O(1) code change -- one new subclass, no existing code modified. The factory dispatch (switch/map) grows linearly with product count.`,
    designRationale: `Factory Method solves the "construction coupling" problem: when client code uses \`new ConcreteClass()\`, it creates a compile-time dependency on that concrete class. This violates the Dependency Inversion Principle and makes swapping implementations impossible without code changes. By delegating creation to a factory method, the client depends only on the product interface. The key design decision is using method-level polymorphism (subclasses override the factory method) rather than parameterized creation. This keeps each creator focused on one product family (SRP) and makes the system open for extension (OCP).`,
    commonVariations: [
      "Simple Factory (static method with switch -- not a true GoF pattern but most common in practice)",
      "Parameterized Factory (pass enum/string to select product type)",
      "Abstract Creator (base class defines factory method, subclasses implement)",
      "Registry-based Factory (Map<Type, Supplier> -- avoids switch statements entirely)",
    ],
    antiPatterns: [
      "Switch explosion -- giant switch/if-else blocks that grow with every new type (use registry pattern instead)",
      "Factory for everything -- creating a factory when you only have one product type is over-engineering",
      "Leaking concrete types -- returning the concrete type instead of the interface from the factory",
    ],
    interviewDepth: [
      {
        question: "When would you use Factory Method vs Abstract Factory?",
        expectedAnswer: "Factory Method creates ONE product -- the type depends on input (e.g., NotificationFactory.create('email') returns EmailNotification). Abstract Factory creates FAMILIES of related products that must be compatible (e.g., WindowsFactory creates WindowsButton + WindowsCheckbox -- all Windows-family).",
        followUp: "How does the Abstract Factory guarantee that products from the same family are used together?",
      },
    ],
  },

  builder: {
    complexityAnalysis: `**Time Complexity:** O(1) per setter call, O(1) for build(). Total O(n) where n = number of fields set.
**Space Complexity:** O(1) -- the builder holds a temporary copy of fields until build() creates the final object.
**Validation:** The build() method is the ideal place for cross-field validation (e.g., "if crust is gluten-free, toppings cannot include wheat"). This is impossible with telescoping constructors.`,
    designRationale: `Builder solves the "telescoping constructor" problem: a class with 10 optional parameters would need dozens of constructor overloads, and callers cannot tell which argument is which. The fluent API (method chaining) makes construction self-documenting. The key design decision is separating the construction process from the final representation, which enables: (1) immutable products -- fields are set on the builder, then the product is frozen at build(), (2) validation before creation -- build() can reject invalid combinations, (3) step-by-step construction -- the builder accumulates state across multiple calls. Tradeoff: more code than a simple constructor, but the readability payoff is enormous.`,
    commonVariations: [
      "Inner static Builder class (most common -- Builder is nested inside the Product class)",
      "Fluent Builder with method chaining (each setter returns 'this')",
      "Step Builder (each step returns the interface for the next required step -- compile-time enforcement)",
      "Director pattern (a separate class that orchestrates the builder in a fixed sequence)",
      "Lombok @Builder (code generation eliminates boilerplate)",
    ],
    antiPatterns: [
      "Builder for simple objects -- if a class has 2-3 required fields and no optional ones, a constructor is simpler",
      "Mutable builder producing mutable objects -- loses the immutability benefit",
      "No validation in build() -- missing the opportunity to enforce invariants",
    ],
    interviewDepth: [
      {
        question: "How does Builder differ from the Prototype pattern?",
        expectedAnswer: "Builder constructs complex objects step-by-step from scratch, allowing full control over each field. Prototype clones an existing object and modifies the copy. Use Builder when you need fine-grained control over construction; use Prototype when you have a 'template' object and want variations of it.",
      },
      {
        question: "Design a Builder for an SQL query.",
        expectedAnswer: "SQLQuery.Builder('users').select('id','name').where('age > 18').orderBy('name').limit(50).build() returns an immutable SQLQuery with toSQL() method. The builder validates that table is non-null before build(), and defaults to SELECT * if no columns are specified.",
        followUp: "How would you handle required vs optional fields at compile time?",
      },
    ],
  },

  "abstract-factory": {
    complexityAnalysis: `**Time Complexity:** O(1) per product creation -- each factory method is a direct constructor call.
**Space Complexity:** O(f * p) where f = number of families and p = products per family. Each family needs a concrete factory class and concrete product classes.
**Scalability:** Adding a new family (e.g., Linux) requires one new factory + one class per product. Adding a new product type (e.g., TextInput) requires modifying every factory -- this is the key cost.`,
    designRationale: `Abstract Factory exists to enforce compatibility between related objects. Without it, a developer could accidentally create a WindowsButton + MacCheckbox combination that looks broken. The factory interface guarantees that all products returned from a single factory instance belong to the same family. The key design decision is composition over inheritance: the client holds a factory reference (injected), not a factory subclass. This enables runtime family switching (e.g., theme changes). Tradeoff: the interface grows with each new product type, requiring changes to ALL factories -- this is why Abstract Factory works best when the product set is stable and the family set varies.`,
    commonVariations: [
      "Platform-specific UI factories (Windows, macOS, Linux -- each producing compatible widgets)",
      "Database driver families (each driver provides compatible Connection, Statement, ResultSet)",
      "Theme factories (Light/Dark/HighContrast -- each producing themed components)",
      "Abstract Factory + Singleton (one factory instance per family, globally accessible)",
    ],
    antiPatterns: [
      "Product explosion -- adding too many product types makes every factory grow, consider splitting into smaller factories",
      "Unnecessary abstraction -- if you only have one family, Factory Method is simpler",
      "Mixing families -- breaking the guarantee by returning products from different families",
    ],
    interviewDepth: [
      {
        question: "How do you add a new product type (e.g., TextInput) to an existing Abstract Factory?",
        expectedAnswer: "You must add createTextInput() to the AbstractFactory interface, then implement it in every concrete factory (WindowsFactory, MacFactory, etc.). This is the main weakness -- it violates OCP for factories. Mitigation: keep the product set small and stable.",
        followUp: "How would you handle this problem if product types change frequently?",
      },
    ],
  },

  prototype: {
    complexityAnalysis: `**Time Complexity:** O(n) for deep clone where n = total number of fields/nested objects to copy. Shallow clone is O(1) (just pointer copies).
**Space Complexity:** O(n) for the cloned object -- a complete independent copy of all nested state.
**Critical distinction:** Shallow copy shares mutable references (dangerous), deep copy creates fully independent objects (safe but slower).`,
    designRationale: `Prototype solves the "expensive construction" problem: when creating an object requires costly operations (DB lookups, network calls, complex computation), cloning an existing instance is faster. The key design decision is defining clone() on the object itself (not on a factory), which means each class controls its own copying semantics. This is essential because only the class knows which fields need deep copies (mutable references) vs shallow copies (immutable values). Tradeoff: implementing correct deep clone is error-prone -- missing a mutable field leads to shared-state bugs that are extremely hard to diagnose.`,
    commonVariations: [
      "Shallow clone (Object.clone() in Java -- fast but shares mutable references)",
      "Deep clone (recursive copy of all nested objects -- safe but slower)",
      "Prototype Registry (a map of named prototypes that can be cloned on demand)",
      "Copy constructor (a constructor that takes another instance as parameter)",
      "Serialization-based clone (serialize then deserialize -- simple but slow)",
    ],
    antiPatterns: [
      "Shallow clone of mutable state -- modifying the clone accidentally modifies the original",
      "Clone without override -- forgetting to override clone() in subclasses leads to incomplete copies",
      "Using Prototype when construction is cheap -- cloning adds complexity without benefit",
    ],
    interviewDepth: [
      {
        question: "What is the difference between shallow copy and deep copy?",
        expectedAnswer: "Shallow copy duplicates field values directly -- primitives are copied, but object references are shared. Deep copy recursively creates new instances of all referenced objects. Example: cloning an Army with a List<Soldier> -- shallow copy shares the same list (adding a soldier to clone affects original), deep copy creates a new list with new Soldier instances.",
        followUp: "How would you implement deep clone for a complex object graph with circular references?",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  STRUCTURAL PATTERNS
  // ════════════════════════════════════════════════════════════

  adapter: {
    complexityAnalysis: `**Time Complexity:** O(1) overhead per call -- adapter translates and delegates, no significant computation.
**Space Complexity:** O(1) -- adapter holds a reference to the adaptee, no data duplication.
**Integration cost:** One adapter class per incompatible interface. For N legacy systems, you need N adapters.`,
    designRationale: `Adapter exists because real systems evolve independently. Legacy code, third-party libraries, and new APIs often have incompatible interfaces even when they provide similar functionality. Rather than modifying existing code (which may be impossible for third-party code or risky for legacy code), Adapter creates a translation layer. The key design decision is composition: the adapter holds a reference to the adaptee and translates method calls. This is the Interface Segregation Principle in action -- clients work with their expected interface, adapters handle the translation. Tradeoff: one extra layer of indirection, but it isolates the system from external interface changes.`,
    commonVariations: [
      "Object Adapter (composition -- adapter holds adaptee reference, most common)",
      "Class Adapter (inheritance -- adapter extends adaptee, limited by single inheritance)",
      "Two-way Adapter (adapts in both directions)",
      "Default Adapter (provides no-op implementations of interface methods, concrete adapters override what they need)",
    ],
    antiPatterns: [
      "Adapter chain -- adapting an adapter of an adapter signals a deeper architecture problem",
      "Business logic in adapter -- adapter should only translate, not add behavior (use Decorator for that)",
      "Adapting when refactoring is possible -- if you own both interfaces, just change one",
    ],
    interviewDepth: [
      {
        question: "How does Adapter differ from Facade?",
        expectedAnswer: "Adapter converts one interface to another expected interface -- the client knows what interface it wants, the adapter provides compatibility. Facade provides a new simplified interface to a complex subsystem -- the client gets something easier to use. Adapter is about compatibility, Facade is about simplification.",
        followUp: "When would you use Adapter vs Proxy?",
      },
    ],
  },

  decorator: {
    complexityAnalysis: `**Time Complexity:** O(d) per call where d = number of decorators in the chain. Each decorator adds O(1) overhead.
**Space Complexity:** O(d) -- each decorator is a wrapper object holding a reference to the next.
**Stacking behavior:** Decorators can be composed in any order: Milk(Sugar(Coffee)) vs Sugar(Milk(Coffee)). Order may matter for some operations.`,
    designRationale: `Decorator solves the "combinatorial subclass explosion" problem: if you have 4 optional features, inheritance requires 2^4 = 16 subclasses. Decorator uses composition to wrap objects dynamically. The key design decision is that decorators implement the same interface as the component they wrap -- this makes them transparent to the client and allows arbitrary stacking. Java I/O streams are the canonical example: BufferedInputStream(GZIPInputStream(FileInputStream)) stacks buffering and decompression. Tradeoff: many small wrapper objects can be confusing to debug, and the decoration order can create subtle behavioral differences.`,
    commonVariations: [
      "Concrete Decorator (wraps and extends a specific interface method)",
      "Abstract Decorator (base class that delegates all methods to the wrapped component)",
      "Functional Decorator (higher-order function wrapping in JS/Python)",
      "Java I/O style (InputStream -> BufferedInputStream -> GZIPInputStream)",
    ],
    antiPatterns: [
      "Decorating everything -- adding decorators where a simple method override would suffice",
      "Order-dependent decorators without documentation -- when stacking order matters but is not obvious",
      "Type checking through decorators -- instanceof checks break because the decorator wraps the real type",
    ],
    interviewDepth: [
      {
        question: "How does Decorator differ from Proxy?",
        expectedAnswer: "Decorator adds NEW behavior dynamically -- the client explicitly creates the decorator chain. Proxy controls ACCESS to existing behavior -- the client usually does not know it is using a proxy. Decorator stacks multiple wrappers; Proxy is typically one layer. Intent is the differentiator: enhance vs control.",
        followUp: "Show how you would use Decorator to add logging and caching to a data service.",
      },
    ],
  },

  facade: {
    complexityAnalysis: `**Time Complexity:** O(s) where s = number of subsystem calls orchestrated by the facade method. The facade itself adds zero computational overhead.
**Space Complexity:** O(1) -- facade holds references to subsystem objects, no data duplication.
**Coupling:** Facade reduces coupling from O(c * s) (every client talks to every subsystem) to O(c + s) (clients talk to facade, facade talks to subsystems).`,
    designRationale: `Facade exists because complex subsystems are hard to use correctly. Without it, every client must understand the initialization order, method call sequences, and interdependencies of multiple subsystem classes. Facade provides a "happy path" API for common use cases while still allowing direct subsystem access for power users. The key design decision is that Facade does NOT add new functionality -- it simply orchestrates existing subsystem methods. This distinguishes it from Adapter (which converts interfaces) and Mediator (which manages inter-object communication). Tradeoff: the facade can become a God Object if too many operations are added.`,
    commonVariations: [
      "Simple Facade (single method orchestrating multiple subsystem calls)",
      "Layered Facade (facade of facades -- each layer simplifies a different subsystem level)",
      "Session Facade (enterprise pattern -- one facade per use case / transaction boundary)",
      "API Gateway (microservices facade -- one entry point routing to many backend services)",
    ],
    antiPatterns: [
      "God Facade -- stuffing unrelated functionality into one facade class (split into focused facades)",
      "Mandatory Facade -- preventing direct subsystem access when power users need it",
      "Logic in Facade -- adding business logic instead of pure orchestration",
    ],
    interviewDepth: [
      {
        question: "How does Facade differ from Mediator?",
        expectedAnswer: "Facade provides a simplified interface TO a subsystem -- it is unidirectional (client -> facade -> subsystems). Mediator manages communication BETWEEN objects in a subsystem -- it is bidirectional (colleagues <-> mediator). Facade simplifies; Mediator coordinates.",
      },
    ],
  },

  proxy: {
    complexityAnalysis: `**Time Complexity:** Varies by type. Virtual Proxy: O(1) for lazy check + O(creation) on first access. Caching Proxy: O(1) cache hit, O(real) cache miss. Protection Proxy: O(1) permission check.
**Space Complexity:** Virtual Proxy: O(0) until real object is created. Caching Proxy: O(n) for cached entries. Protection Proxy: O(1).
**Transparency:** Proxy implements the same interface as the real object -- clients cannot distinguish them without checking the type.`,
    designRationale: `Proxy provides a surrogate that controls access to another object. The key insight is the Proxy Principle: "do not pay for what you do not use." Virtual Proxy delays expensive creation (lazy loading), Caching Proxy avoids redundant computation, Protection Proxy enforces access control. The design decision to use the same interface as the real object means the proxy is transparent -- it can be inserted anywhere the real object is expected. Tradeoff: adds one level of indirection, and the proxy may introduce stale data (caching) or unexpected access denial (protection).`,
    commonVariations: [
      "Virtual Proxy (lazy initialization -- delay expensive object creation)",
      "Protection Proxy (access control -- check permissions before delegating)",
      "Caching Proxy (memoization -- store results of expensive operations)",
      "Logging Proxy (monitoring -- log all calls to the real object)",
      "Remote Proxy (represent an object in a different address space -- RMI, gRPC stubs)",
      "Smart Reference (add reference counting, dirty tracking, or thread locking)",
    ],
    antiPatterns: [
      "Proxy hiding critical errors -- swallowing exceptions from the real object instead of propagating them",
      "Stale cache proxy -- serving outdated data without TTL or invalidation strategy",
      "Over-proxying -- multiple proxy layers adding latency without sufficient benefit",
    ],
    interviewDepth: [
      {
        question: "In a microservices system, where would you use a Proxy pattern?",
        expectedAnswer: "A Remote Proxy (gRPC stub or REST client) represents a remote service as a local object. A Caching Proxy wraps the remote proxy to avoid redundant network calls. A Circuit Breaker Proxy wraps that to handle failures gracefully. This creates a proxy chain: CircuitBreaker(Cache(RemoteProxy(ServiceInterface))).",
        followUp: "How would you handle cache invalidation in the caching proxy?",
      },
    ],
  },

  composite: {
    complexityAnalysis: `**Time Complexity:** O(n) for tree operations (display, getSize) where n = total nodes. Each node is visited once.
**Space Complexity:** O(n) for the tree structure itself + O(d) call stack depth where d = tree depth for recursive operations.
**Uniform interface cost:** Leaf nodes must implement add/remove even though they do not use them (throws UnsupportedOperation or no-op).`,
    designRationale: `Composite solves the "treat part and whole uniformly" problem. Without it, client code must constantly check if an object is a leaf or a container, leading to type-checking conditionals everywhere. By defining a common interface (Component) with both Leaf and Composite implementing it, clients call the same methods on both. The Composite delegates to its children recursively. The key design decision is the tradeoff between safety and transparency: safe design puts add/remove only on Composite (compile-time safety), transparent design puts them on Component (runtime errors but simpler client code). Most implementations choose transparency.`,
    commonVariations: [
      "Transparent Composite (add/remove on Component interface -- simpler client code, runtime type errors)",
      "Safe Composite (add/remove only on Composite -- compile-time safety, client must cast)",
      "Composite with parent reference (each child holds reference to parent -- enables upward traversal)",
      "Composite + Iterator (use Iterator to traverse the tree without recursion)",
    ],
    antiPatterns: [
      "Deep recursion on large trees -- can cause stack overflow (use iterative traversal with explicit stack)",
      "Non-uniform leaf behavior -- when leaves behave very differently from composites, forced uniformity hurts clarity",
    ],
    interviewDepth: [
      {
        question: "Design a file system using Composite. What is the Component, Leaf, and Composite?",
        expectedAnswer: "FileSystemEntry is the Component interface with getName() and getSize(). File is a Leaf that returns its own size. Directory is a Composite that recursively sums children's sizes. display() prints the tree with indentation. The client code calls getSize() on any entry without caring if it is a file or directory.",
        followUp: "How would you add permission checking to the composite structure?",
      },
    ],
  },

  bridge: {
    complexityAnalysis: `**Time Complexity:** O(1) per operation -- delegation to the implementation is a single method call.
**Space Complexity:** O(1) -- the abstraction holds one reference to the implementation.
**Scalability:** Without Bridge, a * i classes (a abstractions x i implementations). With Bridge, a + i classes. Grows linearly instead of multiplicatively.`,
    designRationale: `Bridge exists to prevent class explosion when a system varies in two independent dimensions. Without it, 3 shapes x 3 colors = 9 classes. With Bridge: 3 shapes + 3 colors = 6 classes, and adding a new color does not require any new shape classes. The key design decision is separating abstraction from implementation into two independent hierarchies connected by composition (has-a). This is the opposite of inheritance (is-a). Tradeoff: more indirection, and the initial setup is more complex for simple cases -- but it pays off dramatically as dimensions scale.`,
    commonVariations: [
      "Remote + Device (remote control hierarchy x device hierarchy)",
      "Shape + Color (shape hierarchy x rendering implementation)",
      "Platform + API (abstraction layer x platform-specific implementation)",
      "UI Component + Theme (component hierarchy x theme implementation)",
    ],
    antiPatterns: [
      "Premature bridging -- using Bridge when only one dimension varies (use inheritance instead)",
      "Bridge with single implementation -- over-engineering when there is only one implementor",
    ],
    interviewDepth: [
      {
        question: "What is the difference between Bridge and Adapter?",
        expectedAnswer: "Bridge is designed up-front to let abstraction and implementation vary independently. Adapter is applied after-the-fact to make incompatible interfaces work together. Bridge splits a hierarchy into two; Adapter wraps one interface to look like another.",
        followUp: "When does Bridge become essential in a real-world LLD problem?",
      },
    ],
  },

  flyweight: {
    complexityAnalysis: `**Time Complexity:** O(1) for flyweight lookup (HashMap get). O(1) for operations on the flyweight (extrinsic state passed as parameter).
**Space Complexity:** From O(n * s) (n objects x s bytes per intrinsic state) to O(u * s + n * r) where u = unique flyweights (shared), r = reference size. The savings are enormous: 1M tiles with 3 types = 3 flyweights + 1M pointers instead of 1M full objects.
**Prerequisite:** Must be able to separate intrinsic (shared, immutable) state from extrinsic (per-instance, passed in) state.`,
    designRationale: `Flyweight trades computation for memory. By sharing common state across thousands or millions of objects, it reduces memory usage by orders of magnitude. The key design decision is the intrinsic/extrinsic split: intrinsic state (font, glyph bitmap) lives in the shared flyweight object, extrinsic state (position, color) is passed to methods at call time. The FlyweightFactory ensures each unique intrinsic configuration exists only once (uses a cache/map). Tradeoff: method signatures become more complex (must pass extrinsic state) and computation may increase (computing extrinsic state instead of storing it).`,
    commonVariations: [
      "String interning (Java String.intern(), Python string interning)",
      "Integer cache (Java Integer.valueOf() caches -128 to 127)",
      "Game tile/sprite rendering (shared textures, per-instance position)",
      "Document character rendering (shared font/glyph, per-character position/color)",
    ],
    antiPatterns: [
      "Mutable intrinsic state -- if shared state can change, all flyweight users are affected simultaneously",
      "Flyweight without significant duplication -- the overhead of the factory/cache is not worth it for few objects",
      "Confusing intrinsic and extrinsic -- putting per-instance state in the flyweight breaks sharing",
    ],
    interviewDepth: [
      {
        question: "How does Flyweight relate to caching?",
        expectedAnswer: "Flyweight IS a form of caching -- the FlyweightFactory maintains a cache of unique flyweight instances. The difference from general caching: Flyweight caches the objects themselves (structural sharing), while general caching stores computed results. Flyweight objects are long-lived and reused; cache entries may have TTL.",
        followUp: "Calculate the memory savings for a 1000x1000 game map with 5 terrain types.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  BEHAVIORAL PATTERNS
  // ════════════════════════════════════════════════════════════

  observer: {
    complexityAnalysis: `**Time Complexity:** O(n) for notify() where n = number of observers. Each observer's update() is called once.
**Space Complexity:** O(n) for the observer list. Each observer reference is O(1).
**Notification models:** Push model (subject sends data with notification) vs Pull model (subject notifies, observers query what they need). Push is simpler but may send unnecessary data; Pull is more efficient but requires observers to know the subject's API.`,
    designRationale: `Observer decouples the event source from event handlers. Without it, the Subject would need to know about every consumer and call them directly -- adding a new consumer requires modifying the Subject (violates OCP). With Observer, the Subject only knows about the Observer interface, and concrete observers register themselves. The key design decision is the notification mechanism: synchronous (same thread, deterministic order) vs asynchronous (event loop, non-blocking). Most in-process implementations are synchronous; distributed systems use pub-sub (asynchronous Observer with a message broker). Tradeoff: debugging is harder because the call chain is implicit -- you cannot see who gets notified by reading the Subject code.`,
    commonVariations: [
      "Push Observer (subject sends data to observers in update() call)",
      "Pull Observer (subject notifies observers, they pull data via subject.getState())",
      "Event-based Observer (EventEmitter pattern -- subscribe to named events)",
      "Reactive Streams (RxJS, Reactor -- observers as data stream transformations)",
      "Pub-Sub (distributed Observer with message broker decoupling publisher/subscriber)",
    ],
    antiPatterns: [
      "Memory leak -- forgetting to detach observers when they are no longer needed (especially in long-lived subjects)",
      "Cascade notifications -- observer A modifies subject during update(), triggering notify() again (infinite loop)",
      "God Subject -- one subject with dozens of event types (split into focused subjects)",
      "Synchronous bottleneck -- slow observers block the notification chain (use async notification for slow handlers)",
    ],
    interviewDepth: [
      {
        question: "What is the difference between Observer and Pub-Sub?",
        expectedAnswer: "Observer is in-process: Subject directly holds references to Observers and calls update() synchronously. Pub-Sub is distributed: Publisher and Subscriber do not know each other -- a message broker (Kafka, RabbitMQ) sits between them, enabling async, cross-process communication. Observer is for LLD; Pub-Sub is for system design.",
        followUp: "How would you handle the case where an Observer's update() throws an exception?",
      },
      {
        question: "Design an event notification system where order placement triggers inventory, billing, and notification updates.",
        expectedAnswer: "OrderService is the Subject with an EventManager. Observers: InventoryObserver reserves stock, BillingObserver initiates payment, NotificationObserver sends email/SMS. Each observer subscribes to 'ORDER_PLACED'. Adding a new observer (e.g., AnalyticsObserver) requires zero changes to OrderService.",
        followUp: "What if the billing observer needs to notify the order service of payment failure?",
      },
    ],
  },

  strategy: {
    complexityAnalysis: `**Time Complexity:** O(1) for strategy swap (setStrategy). The execution time depends on the strategy implementation itself -- the pattern adds zero overhead.
**Space Complexity:** O(1) per strategy (each strategy is a stateless or lightweight object). O(s) total for s available strategies if pre-instantiated.
**Key characteristic:** Strategies are interchangeable -- they ALL implement the same interface, so swapping one for another requires zero code changes in the Context.`,
    designRationale: `Strategy is the most important behavioral pattern for LLD interviews. It exists because algorithms change -- pricing models, payment methods, sorting orders, routing policies. Without Strategy, you get giant if/else or switch blocks that grow with every new algorithm and violate OCP. The key design decision is extracting the varying algorithm into a separate interface, letting the Context delegate to it. This is composition over inheritance in its purest form. The CLIENT chooses the strategy (unlike State where transitions happen internally). Tradeoff: clients must know which strategies exist, and for simple cases (only one algorithm that will never change), the extra interface is over-engineering.`,
    commonVariations: [
      "Class-based Strategy (interface + concrete implementations -- GoF canonical)",
      "Functional Strategy (pass lambda/closure directly -- idiomatic in JS/Python)",
      "Strategy + Factory (factory creates the right strategy from runtime input)",
      "Context-free Strategy (strategy is a pure function, no instance state needed)",
      "Multi-strategy Context (context holds multiple strategies for different aspects)",
    ],
    antiPatterns: [
      "Strategy for one algorithm -- over-engineering when there is only one implementation and no plan for more",
      "Leaking context internals -- strategies that reach into the context's private state instead of receiving data through parameters",
      "Strategy selection in the strategy -- concrete strategies should not know about each other or select the next strategy (that is the State pattern)",
    ],
    interviewDepth: [
      {
        question: "How does Strategy differ from State?",
        expectedAnswer: "Strategy: the CLIENT explicitly selects which algorithm to use (user picks credit card vs PayPal). Strategies do NOT know about each other. State: transitions happen INSIDE the object (order moves from PLACED to SHIPPED). States KNOW which state comes next. Same structure, different control flow.",
        followUp: "Can a Strategy ever be used together with the State pattern?",
      },
      {
        question: "Design a payment processing system using Strategy.",
        expectedAnswer: "PaymentStrategy interface with pay(amount) and calculateFee(amount). Concrete strategies: CreditCardPayment (2.9% fee), PayPalPayment (3.5% fee), CryptoPayment (flat network fee). PaymentProcessor is the Context that holds a PaymentStrategy reference and delegates processPayment() and calculateFee(). Adding a new payment method means one new class -- zero changes to existing code.",
        followUp: "How would you add transaction retry logic without modifying the strategies?",
      },
    ],
  },

  command: {
    complexityAnalysis: `**Time Complexity:** O(1) for execute() and undo() (direct delegation to receiver). O(h) for undo-all where h = history size.
**Space Complexity:** O(h) for the command history stack. Each command stores its parameters and enough state to undo.
**Undo granularity:** Each command must store sufficient state to reverse its effect. For delete operations, this means saving the deleted data.`,
    designRationale: `Command exists because operations need to be first-class objects. Without it, operations are ephemeral method calls that vanish after execution -- you cannot undo, replay, queue, or log them. By encapsulating each operation as an object with execute() and undo(), you gain: (1) undo/redo via a command history stack, (2) macro recording by storing command sequences, (3) deferred execution by queuing commands, (4) transaction logging by serializing commands. The key design decision is separating the invoker (who triggers) from the receiver (who performs the work) via the command object. Tradeoff: every operation becomes its own class, which increases class count significantly.`,
    commonVariations: [
      "Undoable Command (execute() + undo() -- the canonical variant)",
      "Macro Command (composite of commands executed as a batch)",
      "Queued Command (commands stored in a queue for deferred execution)",
      "Transaction Command (multiple commands wrapped in a transaction -- all-or-nothing)",
      "Lambda Command (in functional languages, commands as closures with captured state)",
    ],
    antiPatterns: [
      "Command without undo -- if you never need undo/redo/replay, Command is over-engineering (just call the method directly)",
      "Stateless commands that cannot undo -- execute() works but undo() is a no-op because no state was saved",
      "God command -- a single command class that handles multiple unrelated operations",
    ],
    interviewDepth: [
      {
        question: "How would you implement undo/redo in a text editor using Command?",
        expectedAnswer: "Each edit (insert, delete, format) is a Command object that stores the receiver (TextEditor), parameters, and state needed for undo. InsertCommand stores position and text; its undo() deletes that text. DeleteCommand saves the deleted text; its undo() re-inserts it. CommandHistory maintains an undo stack and redo stack. Execute pushes to undo, clears redo. Undo pops from undo, calls command.undo(), pushes to redo.",
        followUp: "How would you implement macro recording (record a sequence of commands and replay them)?",
      },
    ],
  },

  state: {
    complexityAnalysis: `**Time Complexity:** O(1) for each state transition -- delegate to current state's handler, which decides the next state.
**Space Complexity:** O(s) where s = number of state classes. Each state is typically stateless (no per-instance data), so often only one instance per state class is needed.
**State machine complexity:** Total transitions = s * e (states x events). Each state class handles only its own transitions, so complexity is distributed.`,
    designRationale: `State eliminates giant conditional blocks (if state == PLACED then ... else if state == SHIPPED then ...) by distributing behavior across state classes. Each state class knows only its own valid transitions and actions. The key design decision is that states control transitions (states know the next state), unlike Strategy where the client selects the algorithm. This makes State ideal for modeling lifecycles and finite state machines. The Context delegates to its current state object and provides a setState() method for transitions. Tradeoff: more classes (one per state), and adding a new event requires modifying every state class.`,
    commonVariations: [
      "Self-transitioning State (state object sets the next state on the context)",
      "Table-driven State Machine (transition table instead of state classes -- less code, less flexible)",
      "Hierarchical State Machine (states within states -- used in complex game AI)",
      "State + Observer (state transitions trigger notifications to external observers)",
    ],
    antiPatterns: [
      "State pattern for 2 states -- a boolean flag is simpler when there are only two states",
      "Exposing state classes to clients -- clients should interact with the Context, not individual states",
      "Missing transitions -- forgetting to define what happens for an event in a particular state (should throw or no-op)",
    ],
    interviewDepth: [
      {
        question: "Design a vending machine using the State pattern.",
        expectedAnswer: "VendingMachine is the Context with states: IdleState, HasMoneyState, DispensingState. IdleState.insertCoin() adds balance and transitions to HasMoneyState. HasMoneyState.selectProduct() checks balance, transitions to DispensingState if sufficient. DispensingState.dispense() delivers product, gives change, transitions back to IdleState. Each state rejects invalid operations (e.g., IdleState.dispense() says 'Insert coin first').",
        followUp: "How would you add an OutOfStockState?",
      },
    ],
  },

  iterator: {
    complexityAnalysis: `**Time Complexity:** O(n) to iterate through all n elements. O(1) per hasNext()/next() call.
**Space Complexity:** O(1) for the iterator itself (stores current position). The underlying collection is O(n) regardless.
**Lazy evaluation:** Iterator can compute elements on demand -- no need to materialize the entire collection in memory. Essential for paginated APIs and infinite sequences.`,
    designRationale: `Iterator decouples traversal logic from collection structure. Without it, clients must know whether the collection is an array, linked list, tree, or graph to traverse it. With Iterator, clients use a uniform hasNext()/next() interface regardless of the underlying data structure. The key design decision is the Single Responsibility Principle: the collection is responsible for storing data, the iterator is responsible for traversal. Multiple iterators can traverse the same collection simultaneously with independent state. Tradeoff: external iteration (explicit hasNext/next) is more verbose than internal iteration (forEach with callback), but gives the client more control (e.g., early termination).`,
    commonVariations: [
      "External Iterator (client controls iteration with hasNext/next -- more flexible)",
      "Internal Iterator (collection drives iteration with forEach callback -- simpler but less control)",
      "Filtered Iterator (wraps another iterator, skips elements that do not match a predicate)",
      "Paginated Iterator (fetches next page from API when current page is exhausted)",
      "Generator / Lazy Iterator (yields elements on demand -- Python generators, JS generators)",
    ],
    antiPatterns: [
      "Modifying collection during iteration -- causes ConcurrentModificationException or undefined behavior",
      "Iterator that materializes entire collection -- defeats the purpose of lazy evaluation",
    ],
    interviewDepth: [
      {
        question: "How would you implement a paginated API iterator?",
        expectedAnswer: "PaginatedIterator stores the API client, endpoint, page size, current page, and current batch. hasNext() checks if there are remaining items in the current batch; if not, fetches the next page. next() returns the current item and advances. The client code sees a simple Iterator interface and is unaware of pagination.",
        followUp: "How would you handle API rate limiting in the paginated iterator?",
      },
    ],
  },

  mediator: {
    complexityAnalysis: `**Time Complexity:** O(c) per mediated interaction where c = number of colleagues that need to be notified. The mediator decides which colleagues to contact.
**Space Complexity:** O(c) for the mediator holding references to all colleagues.
**Coupling reduction:** Without mediator, c colleagues with all-to-all communication = O(c^2) dependencies. With mediator: O(c) dependencies (each colleague knows only the mediator).`,
    designRationale: `Mediator centralizes complex many-to-many communication between objects. Without it, each colleague must hold references to all other colleagues it communicates with, creating a tangled web of dependencies. The mediator acts as a hub: colleagues send messages to the mediator, which routes them to the appropriate recipients. The key design decision is the tradeoff between distributed and centralized communication: distributed (no mediator) is simpler for few objects but scales poorly; centralized (mediator) adds one class but reduces inter-object coupling from O(n^2) to O(n). Tradeoff: the mediator can become a God Object if it handles too much logic.`,
    commonVariations: [
      "Chat Room Mediator (users send messages through a room, not directly to each other)",
      "UI Mediator (form components interact through a dialog controller)",
      "Event Mediator (colleagues emit events, mediator routes them -- similar to Observer but centralized)",
      "Air Traffic Controller (planes communicate through ATC, not directly to each other)",
    ],
    antiPatterns: [
      "God Mediator -- mediator grows to contain all business logic that should be in colleagues",
      "Mandatory mediation -- forcing simple point-to-point communication through a mediator adds unnecessary complexity",
    ],
    interviewDepth: [
      {
        question: "How does Mediator differ from Observer?",
        expectedAnswer: "Observer is a broadcast mechanism: subject notifies ALL observers, observers are independent. Mediator is a routing mechanism: it decides WHICH colleagues receive which messages based on logic. Observer has no central intelligence; Mediator encapsulates the communication protocol.",
        followUp: "When would you use Mediator vs an Event Bus?",
      },
    ],
  },

  "template-method": {
    complexityAnalysis: `**Time Complexity:** O(sum of steps) -- the template method calls each step sequentially. Individual step complexity depends on the subclass implementation.
**Space Complexity:** O(1) beyond what each step requires -- the template method itself is stateless.
**Extension points:** Template methods have two types of steps: abstract (MUST override) and hooks (CAN override). This gives subclass authors clear guidance on what to customize.`,
    designRationale: `Template Method defines the "what" (algorithm structure) and lets subclasses define the "how" (individual steps). The key insight is the Hollywood Principle: "Don't call us, we'll call you" -- the base class calls the subclass's methods, not the other way around. This is inheritance-based reuse at its best: the invariant parts of the algorithm live in one place (DRY), the variable parts are deferred to subclasses. Tradeoff: rigid structure (subclasses cannot change the step order), and deep inheritance hierarchies can become hard to maintain. For more flexibility, consider Strategy (composition-based).`,
    commonVariations: [
      "Data Processing Pipeline (extract -> transform -> validate -> load, with variable implementations)",
      "Framework Lifecycle Hooks (JUnit setUp/tearDown, Spring lifecycle methods)",
      "Game Loop (init -> processInput -> update -> render, with game-specific implementations)",
      "Template Method + Strategy (template defines structure, strategies provide individual step implementations)",
    ],
    antiPatterns: [
      "Too many abstract steps -- forces subclasses to implement methods they do not need (use hooks with default no-ops instead)",
      "Template Method when Strategy would suffice -- if steps vary independently, composition (Strategy) is more flexible",
    ],
    interviewDepth: [
      {
        question: "How does Template Method differ from Strategy?",
        expectedAnswer: "Template Method uses inheritance: the algorithm skeleton is in a base class, subclasses override specific steps. Strategy uses composition: the algorithm is encapsulated in a separate object that can be swapped at runtime. Template Method is fixed at compile time; Strategy can change at runtime. Template Method controls the overall flow; Strategy encapsulates one interchangeable algorithm.",
      },
    ],
  },

  "chain-of-responsibility": {
    complexityAnalysis: `**Time Complexity:** O(h) where h = number of handlers in the chain (worst case: request passes through all handlers).
**Space Complexity:** O(h) for the chain of handler objects.
**Short-circuit behavior:** Unlike Decorator (which always delegates), Chain of Responsibility can STOP processing. This makes it ideal for validation pipelines where any step can reject the request.`,
    designRationale: `Chain of Responsibility decouples the sender from the receiver by giving multiple objects a chance to handle a request. The sender does not know (or care) which handler processes its request. This is essential for middleware pipelines (Express.js, Django), approval workflows, and log-level routing. The key design decision is whether handlers STOP or PASS: in some variants, only one handler processes the request (first match wins); in others, all handlers process it (like log levels where DEBUG goes to console, file, AND alert). Tradeoff: debugging is harder because you cannot easily predict which handler will process a given request.`,
    commonVariations: [
      "Middleware Pipeline (each handler can modify request, pass to next, or reject -- Express.js style)",
      "Log Level Chain (each handler checks if it can handle the log level, then passes to next regardless)",
      "Approval Chain (manager -> director -> VP -- each checks amount, escalates if above threshold)",
      "Validation Chain (each validator checks one rule, stops on first failure)",
    ],
    antiPatterns: [
      "Unhandled requests -- request falls off the end of the chain with no handler processing it (add a default handler)",
      "Overly long chains -- performance degrades with many handlers (profile and optimize the chain length)",
    ],
    interviewDepth: [
      {
        question: "How does Chain of Responsibility differ from Decorator?",
        expectedAnswer: "Chain of Responsibility can STOP processing -- a handler decides to handle the request or pass it on. Decorator ALWAYS delegates to the wrapped object. Chain is about filtering/routing; Decorator is about enhancing. In middleware: auth middleware rejects (stops chain), logging middleware always passes through (decorator-like).",
      },
    ],
  },

  memento: {
    complexityAnalysis: `**Time Complexity:** O(s) for save (copy s fields to memento) and O(s) for restore. Individual save/restore is typically O(1) if state is a reference type (snapshot the reference).
**Space Complexity:** O(m * s) where m = number of mementos stored and s = state size per memento. Memory management is critical -- limit history size or use incremental mementos.
**Encapsulation:** Memento hides internal state from the Caretaker. The Caretaker stores mementos but cannot read or modify them.`,
    designRationale: `Memento solves the "save/restore without breaking encapsulation" problem. Without it, saving state requires exposing internal fields (breaking encapsulation) or serializing the entire object (heavyweight). Memento provides a narrow interface: the Originator creates and restores mementos, the Caretaker stores them, but the Caretaker cannot access the state inside the memento. The key design decision is the three-role separation: Originator (creates/restores), Memento (stores state), Caretaker (manages history). Tradeoff: if state is large, storing many mementos consumes significant memory -- consider incremental mementos or periodic checkpoints.`,
    commonVariations: [
      "Full-state Memento (snapshot all fields -- simple but memory-heavy)",
      "Incremental Memento (store only the diff from previous state -- memory-efficient but complex)",
      "Serialization-based Memento (serialize to JSON/protobuf -- portable but slower)",
      "Memento + Command (Command saves a Memento before executing, uses it for undo)",
    ],
    antiPatterns: [
      "Unbounded history -- storing unlimited mementos causes memory leak (set a max history size)",
      "Exposing memento internals -- letting the Caretaker modify memento state breaks encapsulation",
    ],
    interviewDepth: [
      {
        question: "How does Memento differ from Command for implementing undo?",
        expectedAnswer: "Command stores the operation and its inverse -- undo() is a method on the command. Memento stores a snapshot of the entire state -- undo restores the snapshot. Command is more efficient (stores only the delta), Memento is simpler (no need to define inverse operations). Use Command when operations have clear inverses; use Memento when state changes are complex or unpredictable.",
        followUp: "How would you combine Memento and Command for a text editor?",
      },
    ],
  },

  visitor: {
    complexityAnalysis: `**Time Complexity:** O(n) where n = elements in the structure. Each element is visited once. The visit() method's complexity depends on the operation.
**Space Complexity:** O(d) for recursive traversal where d = structure depth (call stack). O(1) for the Visitor itself beyond any accumulated results.
**Double dispatch:** Visitor uses element.accept(visitor) which calls visitor.visit(element) -- this achieves runtime dispatch on both the visitor type AND the element type, which single dispatch (virtual methods) cannot do.`,
    designRationale: `Visitor allows adding new operations to an object structure without modifying the structure's classes. The key insight is the tradeoff between adding operations and adding elements: if you frequently add new operations but rarely add new element types, Visitor is ideal. If you frequently add new element types, Visitor forces you to modify every visitor -- in that case, polymorphism (virtual methods) is better. The double-dispatch mechanism (accept + visit) is what enables type-safe operation dispatch without instanceof checks. Tradeoff: adding a new element type requires changing all visitors, and the Visitor has access to element internals.`,
    commonVariations: [
      "AST Visitor (evaluate, print, optimize -- different operations on the same syntax tree)",
      "File System Visitor (calculate size, search, compress -- operations on file/directory tree)",
      "Visitor + Composite (visit each node in a composite tree structure)",
      "Acyclic Visitor (uses interface per element type -- avoids dependency cycles but more verbose)",
    ],
    antiPatterns: [
      "Visitor on frequently changing structures -- adding a new element type requires modifying every visitor",
      "Visitor with side effects that depend on visit order -- the traversal order becomes a hidden contract",
    ],
    interviewDepth: [
      {
        question: "When would you use Visitor instead of just adding methods to the element classes?",
        expectedAnswer: "When you need to add many unrelated operations (evaluate, print, type-check, optimize) to a structure without polluting the element classes. Each operation is a separate Visitor class (SRP). If the structure is an AST with 10 node types and you need 5 operations, Visitor gives 5 visitor classes instead of 50 methods spread across 10 node classes.",
        followUp: "What is the 'expression problem' and how does Visitor address it?",
      },
    ],
  },

  interpreter: {
    complexityAnalysis: `**Time Complexity:** O(n) for interpreting an expression tree where n = number of nodes. Each node's interpret() is called once.
**Space Complexity:** O(n) for the expression tree itself + O(d) call stack depth.
**Grammar complexity:** Works well for simple grammars. For complex grammars, consider parser generators (ANTLR, PEG) instead.`,
    designRationale: `Interpreter represents a grammar as a class hierarchy where each rule is a class. Terminal expressions handle leaf values, non-terminal expressions compose them. The key design decision is mapping grammar rules to classes, making the language extensible by adding new expression classes. Tradeoff: only practical for simple languages -- complex grammars create too many classes. Modern alternatives include parser combinators and parser generators. Interpreter is valuable in LLD for building DSLs (domain-specific languages), rule engines, and expression evaluators.`,
    commonVariations: [
      "Boolean Expression Interpreter (AND, OR, NOT with terminal predicates)",
      "Arithmetic Expression Tree (add, subtract, multiply with number terminals)",
      "SQL-like Query Interpreter (parse simple query syntax into executable operations)",
      "Rule Engine (interpret business rules defined as expressions)",
    ],
    antiPatterns: [
      "Interpreter for complex grammars -- class explosion makes it unmaintainable (use parser generators)",
      "Interpreter without a clear grammar -- if the language is not well-defined, the class hierarchy will be chaotic",
    ],
    interviewDepth: [
      {
        question: "How would you build a simple rule engine using Interpreter?",
        expectedAnswer: "Define Expression interface with interpret(context). TerminalExpression checks a single condition (e.g., 'age > 18'). AndExpression and OrExpression compose expressions. NotExpression negates. Build expression trees from user-defined rules, evaluate against a context object. This is the same approach used in specification/filter patterns.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  MODERN PATTERNS
  // ════════════════════════════════════════════════════════════

  repository: {
    complexityAnalysis: `**Time Complexity:** Depends on the underlying data store. find/save/delete are typically O(1) for key-based operations, O(n) for scans. The Repository pattern itself adds O(1) overhead (delegation).
**Space Complexity:** O(1) for the Repository object. The data store's space complexity depends on the implementation (SQL, NoSQL, in-memory).
**Abstraction benefit:** Switching from PostgreSQL to MongoDB requires changing only the concrete repository implementation -- zero changes to business logic.`,
    designRationale: `Repository abstracts data access behind a collection-like interface, decoupling business logic from persistence technology. Without it, services contain raw SQL queries, making them impossible to test without a database and tightly coupled to the data store. The key design decision is defining the repository interface in terms of the domain (find, save, delete with domain objects) rather than in terms of the database (SELECT, INSERT, DELETE with rows). This enables the Persistence Ignorance principle -- domain objects do not know how they are stored. Tradeoff: an extra layer of indirection, and complex queries may not map cleanly to the simple repository interface.`,
    commonVariations: [
      "Generic Repository (Repository<T> with CRUD operations parameterized by entity type)",
      "Specification-based Repository (pass Specification objects for complex queries)",
      "Aggregate Repository (one repository per DDD aggregate root)",
      "CQRS Repository (separate read and write repositories)",
    ],
    antiPatterns: [
      "God Repository -- one repository for all entity types (one repository per aggregate root)",
      "Leaking SQL -- repository methods that return raw database types instead of domain objects",
      "Repository with business logic -- repositories should only handle persistence, not business rules",
    ],
    interviewDepth: [
      {
        question: "How does Repository differ from DAO (Data Access Object)?",
        expectedAnswer: "Repository operates at the domain level -- it speaks in terms of Aggregate Roots and domain objects. DAO operates at the persistence level -- it speaks in terms of tables, rows, and SQL. Repository often uses a DAO internally. Repository is DDD; DAO is infrastructure.",
      },
    ],
  },

  cqrs: {
    complexityAnalysis: `**Time Complexity:** Command path: O(handler) for processing + O(projection) for updating read model. Query path: O(query) for reading from optimized read model (often denormalized, so faster than normalized writes).
**Space Complexity:** O(2n) -- data is stored in both write model (normalized, consistent) and read model (denormalized, optimized for queries). This is the fundamental space-time tradeoff.
**Eventual consistency window:** Read model lags behind write model by the projection delay (milliseconds to seconds). Applications must be designed to tolerate this.`,
    designRationale: `CQRS recognizes that reads and writes have fundamentally different requirements. Writes need strong consistency, validation, and normalization. Reads need speed, denormalization, and flexible query shapes. Using one model for both forces compromises. By separating them, each can be optimized independently: write model uses normalized PostgreSQL for integrity, read model uses denormalized Elasticsearch for search. The key design decision is the synchronization mechanism between models -- typically domain events. A command handler writes to the write model and publishes an event; a projection handler consumes the event and updates the read model. Tradeoff: significantly more infrastructure complexity, eventual consistency, and data duplication.`,
    commonVariations: [
      "Simple CQRS (separate read/write interfaces but same database)",
      "Full CQRS (separate read and write databases with event-based sync)",
      "CQRS + Event Sourcing (write model stores events, read model is a projection)",
      "CQRS with materialized views (database handles the projection automatically)",
    ],
    antiPatterns: [
      "CQRS for simple CRUD -- if read and write models are identical, CQRS adds complexity without benefit",
      "Ignoring eventual consistency -- assuming the read model is always up-to-date after a command",
      "Bidirectional sync -- both models writing back to each other creates infinite loops and data conflicts",
    ],
    interviewDepth: [
      {
        question: "When should you NOT use CQRS?",
        expectedAnswer: "When the domain is simple CRUD with no significant difference between read and write patterns. When strong consistency is required everywhere (financial ledgers). When the team does not have experience with eventual consistency. CQRS adds significant operational complexity -- only use when the read/write asymmetry justifies it.",
        followUp: "How does CQRS relate to Event Sourcing? Can you use one without the other?",
      },
      {
        question: "How do you handle the eventual consistency problem in CQRS?",
        expectedAnswer: "Three approaches: (1) After a command, redirect to a page that reads from the write model (read-your-own-writes). (2) Use a version number -- the UI sends the expected version, and the read side returns data only if its version >= expected. (3) Use WebSocket to push read model updates to the UI when the projection completes.",
      },
    ],
  },

  "event-sourcing": {
    complexityAnalysis: `**Time Complexity:** O(e) to reconstruct current state from e events. O(1) to append a new event. Snapshots reduce reconstruction to O(1) + O(events since snapshot).
**Space Complexity:** O(e) -- all events are stored forever (append-only log). This grows linearly and requires archiving strategies for long-lived entities.
**Query complexity:** Querying current state requires replaying events or reading from a projection. Direct queries against the event store are expensive.`,
    designRationale: `Event Sourcing stores state changes (events) rather than current state. The current state is derived by replaying events from the beginning. The key insight is that events are facts -- they represent what happened and cannot be changed. This provides a complete audit trail, enables temporal queries ("what was the state at time T?"), and supports event replay for debugging. Combined with CQRS, events published from the write side drive read model projections. Tradeoff: replaying events becomes slow for entities with many events (use snapshots), and the event schema must be carefully versioned since events are immutable.`,
    commonVariations: [
      "Event Store + Snapshots (periodic snapshots to avoid replaying entire event history)",
      "Event Sourcing + CQRS (events drive read model projections)",
      "Event Sourcing with Event Versioning (schema evolution for long-lived event streams)",
      "Event Sourcing for audit (append-only log of all changes for compliance)",
    ],
    antiPatterns: [
      "Mutable events -- modifying stored events destroys the audit trail guarantee",
      "No snapshots for long-lived entities -- replaying thousands of events on every load is too slow",
      "Treating events as commands -- events describe what HAPPENED, not what SHOULD happen",
    ],
    interviewDepth: [
      {
        question: "How does Event Sourcing handle schema evolution?",
        expectedAnswer: "Event upcasting: when reading old events, transform them to the current schema version. Store a version number with each event. The event handler maps old versions to new versions during replay. Alternatively, use a flexible schema (JSON) that gracefully handles missing fields with defaults.",
      },
    ],
  },

  saga: {
    complexityAnalysis: `**Time Complexity:** O(s) for a saga with s steps (each step runs sequentially). Compensation is O(c) where c = completed steps to compensate (in reverse order).
**Space Complexity:** O(s) for step state + O(log entries) for the saga log. Each step must store enough state for its compensating action.
**Failure modes:** If compensation itself fails (double failure), the saga enters a "failed" state requiring manual intervention. The saga log is essential for identifying and resolving such situations.`,
    designRationale: `Saga replaces distributed transactions (2PC) with a sequence of local transactions, each with a compensating action. The key insight is that in a microservices architecture, each service owns its own database, making traditional ACID transactions impossible across service boundaries. Instead of locking resources across services (2PC -- slow, fragile), Saga accepts eventual consistency and provides rollback through compensation. Two variants: orchestration (central orchestrator drives the saga) and choreography (each service triggers the next via events). Tradeoff: compensation is hard to get right (what if the refund API fails?), debugging distributed failures is extremely challenging, and eventual consistency requires careful UI design.`,
    commonVariations: [
      "Orchestration Saga (central orchestrator drives step execution and compensation)",
      "Choreography Saga (each service publishes events that trigger the next service -- no central coordinator)",
      "Saga with Saga Log (audit trail of all step executions and compensations)",
      "Saga with timeout (steps have deadlines -- if exceeded, compensation begins automatically)",
      "Parallel Saga (independent steps execute concurrently, dependent steps are sequential)",
    ],
    antiPatterns: [
      "Ignoring compensation failures -- if a compensating action fails, the system is in an inconsistent state (need manual resolution + alerting)",
      "Saga for local transactions -- if all operations are in the same database, use a regular transaction",
      "No saga log -- without logging, diagnosing failed sagas in production is nearly impossible",
      "Non-idempotent steps -- if a step is retried, it must produce the same result (use idempotency keys)",
    ],
    interviewDepth: [
      {
        question: "In a 5-step saga, if step 3 fails, what happens?",
        expectedAnswer: "Steps 1 and 2 have completed. Step 3 failed, so its action was never committed. Compensation runs in REVERSE order: step 2's compensate(), then step 1's compensate(). Steps 4 and 5 never started, so no compensation needed. The saga log records each compensation for audit.",
        followUp: "What if step 2's compensating action also fails?",
      },
      {
        question: "Compare orchestration vs choreography sagas.",
        expectedAnswer: "Orchestration: central coordinator calls each service, handles failures, runs compensation. Easier to understand, easier to debug, single point of failure. Choreography: each service reacts to events from the previous service. More decoupled, no single point of failure, but harder to trace the flow and debug failures. Use orchestration for complex sagas, choreography for simple 2-3 step flows.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  RESILIENCE PATTERNS
  // ════════════════════════════════════════════════════════════

  "circuit-breaker": {
    complexityAnalysis: `**Time Complexity:** O(1) per call -- state check + delegate or fail-fast. The circuit breaker maintains a sliding window of success/failure counts.
**Space Complexity:** O(w) where w = sliding window size for tracking recent call outcomes.
**State machine:** Three states (Closed -> Open -> Half-Open -> Closed/Open). Transitions are time and threshold driven.`,
    designRationale: `Circuit Breaker prevents a failing service from cascading failures to its callers. Without it, every call to a down service waits for timeout, consuming threads and memory until the caller itself crashes (cascade failure). The circuit breaker "trips" after a threshold of failures, immediately rejecting subsequent calls (fail-fast) instead of waiting. After a cooldown period, it allows one probe call (half-open) to check if the service recovered. The key design decision is the threshold and cooldown tuning -- too sensitive triggers false alarms, too lenient allows cascade failures. Tradeoff: legitimate calls are rejected during the open state.`,
    commonVariations: [
      "Count-based Circuit Breaker (trips after N consecutive failures)",
      "Time-based Circuit Breaker (trips when failure rate exceeds threshold in a time window)",
      "Per-endpoint Circuit Breaker (separate circuit for each downstream endpoint)",
      "Circuit Breaker + Retry (retry within closed state, fail-fast in open state)",
    ],
    antiPatterns: [
      "Single circuit for all endpoints -- one failing endpoint trips the circuit for all healthy endpoints",
      "No fallback -- rejecting calls in open state without providing degraded functionality",
      "Ignoring half-open probing -- not testing recovery means the circuit stays open forever",
    ],
    interviewDepth: [
      {
        question: "How would you implement a Circuit Breaker in a microservices architecture?",
        expectedAnswer: "Wrap each outgoing HTTP client with a Circuit Breaker. Track success/failure in a sliding window. When failure rate exceeds threshold (e.g., 50% in last 10 calls), transition to Open -- reject calls immediately with a fallback response. After cooldown (e.g., 30 seconds), transition to Half-Open -- allow one probe call. If probe succeeds, transition to Closed. If probe fails, back to Open.",
        followUp: "How do you choose the right threshold and cooldown values?",
      },
    ],
  },

  bulkhead: {
    complexityAnalysis: `**Time Complexity:** O(1) for semaphore acquire/release. The bulkhead itself adds negligible overhead.
**Space Complexity:** O(p) where p = number of partitions, each maintaining a semaphore with bounded concurrency.
**Isolation guarantee:** Failure in one bulkhead partition cannot consume resources from other partitions. Thread pool isolation provides stronger guarantees than semaphore isolation.`,
    designRationale: `Bulkhead borrows from ship design: ships have watertight compartments (bulkheads) so that a breach in one compartment does not sink the entire ship. In software, Bulkhead isolates resources (threads, connections) into partitions so that one slow or failing service cannot monopolize all resources. The key design decision is the isolation mechanism: semaphore-based (limits concurrency without thread isolation) or thread-pool-based (separate thread pools per partition, stronger isolation). Tradeoff: thread pools consume more resources but provide better isolation; semaphores are lightweight but share the same thread pool.`,
    commonVariations: [
      "Thread Pool Bulkhead (separate thread pool per service -- strongest isolation)",
      "Semaphore Bulkhead (shared thread pool with concurrency limits per partition)",
      "Connection Pool Bulkhead (separate connection pools per downstream service)",
      "Bulkhead + Circuit Breaker (bulkhead limits concurrency, circuit breaker handles failures)",
    ],
    antiPatterns: [
      "Under-partitioned bulkhead -- too few partitions means a slow service still impacts others in the same partition",
      "Over-partitioned bulkhead -- too many partitions wastes resources on idle thread pools",
    ],
    interviewDepth: [
      {
        question: "How does Bulkhead complement Circuit Breaker?",
        expectedAnswer: "Circuit Breaker prevents calling a failing service. Bulkhead prevents a slow service from consuming all resources. Together: Bulkhead limits concurrency to the slow service (so other services still get threads), and Circuit Breaker eventually trips if the slow service starts failing, rejecting calls immediately.",
      },
    ],
  },

  retry: {
    complexityAnalysis: `**Time Complexity:** O(r * t) where r = number of retries and t = time per attempt. With exponential backoff, total wait time is O(2^r * base).
**Space Complexity:** O(1) -- retry logic is stateless (just a counter and delay calculation).
**Jitter:** Adding random jitter to backoff delays prevents the "thundering herd" problem where all clients retry simultaneously after a failure.`,
    designRationale: `Retry handles transient failures -- temporary network glitches, brief overloads, intermittent timeouts. The key insight is that NOT all failures are permanent; retrying after a brief delay often succeeds. The design decisions are: (1) which failures to retry (transient vs permanent -- never retry 400 Bad Request), (2) how many times (bounded retries to prevent infinite loops), (3) how long to wait (exponential backoff + jitter to prevent thundering herd). Tradeoff: retrying adds latency for the caller, and retrying non-idempotent operations (e.g., payment charges) can cause duplicate side effects.`,
    commonVariations: [
      "Fixed-delay Retry (constant wait between retries)",
      "Exponential Backoff (double the delay with each retry: 1s, 2s, 4s, 8s...)",
      "Exponential Backoff with Jitter (add random jitter to prevent synchronized retries)",
      "Linear Backoff (increase delay linearly: 1s, 2s, 3s, 4s...)",
      "Retry with Circuit Breaker (stop retrying when circuit is open)",
    ],
    antiPatterns: [
      "Retrying non-idempotent operations -- charging a credit card twice is catastrophic (use idempotency keys)",
      "Retrying permanent failures -- retrying 404 Not Found or 403 Forbidden wastes resources",
      "Unbounded retries -- retrying forever turns a transient failure into an infinite loop",
      "No backoff -- retrying immediately hammers the failing service and delays its recovery",
    ],
    interviewDepth: [
      {
        question: "How do you ensure retry safety for non-idempotent operations?",
        expectedAnswer: "Use idempotency keys. The client generates a unique key per operation and sends it with each request (including retries). The server checks if it has already processed that key -- if yes, returns the cached result instead of processing again. This makes retries safe for any operation.",
        followUp: "How does exponential backoff with jitter prevent the thundering herd problem?",
      },
    ],
  },

  "rate-limiter": {
    complexityAnalysis: `**Time Complexity:** O(1) for token bucket (check and decrement counter). O(w) for sliding window where w = window entries to scan (typically small).
**Space Complexity:** O(c) where c = number of clients tracked. Each client has a counter and timestamp.
**Distributed challenge:** In a distributed system, rate limiting requires shared state (Redis, database) to coordinate limits across multiple instances.`,
    designRationale: `Rate Limiter protects services from abuse, ensures fair resource sharing, and prevents overload. The key design decisions are: (1) the algorithm (token bucket for burst tolerance, sliding window for smooth rate enforcement), (2) the scope (per-user, per-IP, per-API key, global), (3) the response to rate-limited requests (HTTP 429 with Retry-After header, queuing, or degraded response). Tradeoff: too strict limits frustrate legitimate users, too lenient limits fail to protect the service. Rate limiting in a distributed system requires shared state (typically Redis) which adds latency to every request.`,
    commonVariations: [
      "Token Bucket (allows bursts up to bucket capacity, then enforces average rate)",
      "Leaky Bucket (smooths traffic to a fixed rate, no bursts)",
      "Fixed Window Counter (count requests in fixed time windows -- boundary issue: 2x burst at window edge)",
      "Sliding Window Log (track exact timestamps, precise but memory-intensive)",
      "Sliding Window Counter (weighted average of current and previous window -- practical compromise)",
    ],
    antiPatterns: [
      "Rate limiting without feedback -- clients get 429 but no Retry-After header to know when to try again",
      "Same limits for all users -- premium users should have higher limits than free-tier users",
      "Client-side only rate limiting -- clients can be bypassed; always enforce on the server",
    ],
    interviewDepth: [
      {
        question: "Compare token bucket and sliding window algorithms.",
        expectedAnswer: "Token Bucket: tokens added at a fixed rate, each request consumes a token. Allows bursts (up to bucket capacity) then throttles. Simple to implement, O(1). Sliding Window: counts requests in a rolling time window. More precise rate enforcement, no burst allowance. Fixed Window has a boundary problem (2x burst at window edges); Sliding Window Counter solves it with weighted averaging.",
        followUp: "How would you implement distributed rate limiting across multiple API server instances?",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  CONCURRENCY PATTERNS
  // ════════════════════════════════════════════════════════════

  "thread-pool": {
    complexityAnalysis: `**Time Complexity:** O(1) for task submission (enqueue). O(t/w) throughput where t = tasks and w = workers (tasks processed in parallel).
**Space Complexity:** O(w + q) where w = worker threads and q = task queue capacity.
**Optimal pool size:** CPU-bound tasks: w = number of CPU cores. I/O-bound tasks: w = cores * (1 + wait_time/compute_time). Over-provisioning wastes memory; under-provisioning leaves CPU idle.`,
    designRationale: `Thread Pool solves two problems: (1) the overhead of creating and destroying threads for each task (thread creation is expensive -- ~1ms and ~1MB stack), and (2) unbounded concurrency that can exhaust system resources. By pre-creating a fixed pool of workers and queueing tasks, Thread Pool amortizes thread creation cost and bounds concurrency. The key design decisions are pool size (CPU-bound vs I/O-bound heuristics), queue type (bounded vs unbounded), and rejection policy (block, discard, or caller-runs). Tradeoff: fixed pool size means tasks may queue during burst traffic.`,
    commonVariations: [
      "Fixed Thread Pool (constant number of workers -- predictable resource usage)",
      "Cached Thread Pool (creates threads on demand, reuses idle threads -- good for short-lived tasks)",
      "Scheduled Thread Pool (executes tasks after a delay or periodically)",
      "Work-Stealing Thread Pool (idle workers steal tasks from busy workers' queues -- ForkJoinPool)",
    ],
    antiPatterns: [
      "Unbounded thread creation -- creating a thread per request leads to OOM under load",
      "Thread pool for blocking I/O without sufficient threads -- all threads block, deadlocking the pool",
      "Sharing mutable state between tasks without synchronization -- race conditions and data corruption",
    ],
    interviewDepth: [
      {
        question: "How do you choose the right thread pool size?",
        expectedAnswer: "For CPU-bound tasks: pool size = number of CPU cores (more threads just add context-switching overhead). For I/O-bound tasks: pool size = cores * (1 + wait_time/compute_time). Example: 4 cores, tasks spend 80% waiting on I/O -> pool size = 4 * (1 + 4) = 20. Always benchmark with realistic workloads.",
      },
    ],
  },

  "producer-consumer": {
    complexityAnalysis: `**Time Complexity:** O(1) for produce (enqueue) and O(1) for consume (dequeue) with a bounded buffer. Blocking occurs when buffer is full (producer) or empty (consumer).
**Space Complexity:** O(b) where b = buffer capacity. The buffer decouples production rate from consumption rate.
**Throughput:** Limited by the slower side (bottleneck). If producers are faster, buffer fills up and producers block. If consumers are faster, buffer empties and consumers block.`,
    designRationale: `Producer-Consumer decouples data production from data consumption using a shared buffer. Without it, producers must wait for consumers to process each item (synchronous coupling). The buffer allows producers and consumers to work at different rates, smoothing out burst traffic. The key design decisions are buffer capacity (too small causes frequent blocking, too large wastes memory), synchronization mechanism (semaphores, monitors, or lock-free queues), and handling of full/empty conditions (block, drop, or back-pressure). Tradeoff: adds latency (items wait in buffer) and complexity (synchronization, capacity planning).`,
    commonVariations: [
      "Bounded Buffer (fixed capacity -- producers block when full)",
      "Unbounded Buffer (dynamically growing -- risk of OOM under sustained overproduction)",
      "Priority Queue Buffer (consumers process highest-priority items first)",
      "Multiple Producers / Multiple Consumers (thread-safe buffer with concurrent access)",
    ],
    antiPatterns: [
      "Unbounded buffer -- memory grows without limit if producers are faster than consumers",
      "Busy-wait polling -- consuming CPU cycles checking the buffer instead of blocking/signaling",
      "Single-threaded consumer bottleneck -- one slow consumer limits total throughput",
    ],
    interviewDepth: [
      {
        question: "How would you implement Producer-Consumer with backpressure?",
        expectedAnswer: "Use a bounded blocking queue. When the queue is full, produce() blocks until space is available -- this automatically slows down producers to match consumer throughput. The buffer capacity determines how much burst traffic is absorbed. For distributed systems, use message queue acknowledgments (Kafka consumer groups) for backpressure.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  AI AGENT PATTERNS
  // ════════════════════════════════════════════════════════════

  "react-pattern": {
    complexityAnalysis: `**Time Complexity:** O(s) per reasoning cycle where s = number of Thought-Action-Observation steps. Total time depends on tool call latency and LLM inference time.
**Space Complexity:** O(s * c) where s = steps and c = context tokens per step. The growing context (scratchpad) is the primary memory constraint.
**Token budget:** ReAct's growing scratchpad consumes more tokens with each step. Long tasks may require summarization or context truncation.`,
    designRationale: `ReAct (Reasoning + Acting) combines chain-of-thought reasoning with action execution in an interleaved loop. The agent generates a Thought (reasoning about what to do), takes an Action (calls a tool), and receives an Observation (tool result). This cycle repeats until the task is complete. The key insight is that reasoning BEFORE acting improves action selection (compared to acting without thinking), and observations AFTER acting ground the reasoning in reality (compared to pure chain-of-thought). Tradeoff: more tokens and latency per step than direct action, but significantly better accuracy and reliability.`,
    commonVariations: [
      "ReAct with Tool Registry (agent selects from a registry of available tools)",
      "ReAct with Reflection (agent evaluates its own output and retries if unsatisfied)",
      "ReAct with Memory (agent stores and retrieves information across sessions)",
      "Multi-step ReAct with Planning (agent creates a plan, then executes steps with ReAct)",
    ],
    antiPatterns: [
      "Infinite loops -- agent repeats the same thought-action cycle without making progress (add max-step limit)",
      "Tool hallucination -- agent tries to use tools that do not exist (validate against tool registry)",
      "Context overflow -- growing scratchpad exceeds context window (summarize or truncate)",
    ],
    interviewDepth: [
      {
        question: "How does ReAct differ from chain-of-thought prompting?",
        expectedAnswer: "Chain-of-thought generates reasoning steps but cannot interact with the external world. ReAct interleaves reasoning with tool use -- the agent can search, compute, and query databases, then incorporate results into subsequent reasoning. ReAct is grounded in reality; chain-of-thought is purely internal.",
      },
    ],
  },

  "multi-agent-orchestration": {
    complexityAnalysis: `**Time Complexity:** O(a * s) where a = number of agents and s = average steps per agent. Parallel execution reduces wall-clock time to O(max agent time).
**Space Complexity:** O(a * c) where c = context per agent. Shared memory adds O(m) where m = memory entries.
**Communication overhead:** Message passing between agents adds latency. Orchestrator pattern centralizes this; peer-to-peer scales worse but is more flexible.`,
    designRationale: `Multi-Agent Orchestration decomposes complex tasks into subtasks handled by specialized agents. The orchestrator assigns subtasks, collects results, and synthesizes the final output. Each specialist agent has focused skills and a narrower context, improving accuracy compared to a single generalist agent. The key design decisions are: (1) orchestration vs peer-to-peer communication, (2) shared vs isolated memory, (3) sequential vs parallel execution. Tradeoff: coordination overhead increases with agent count, and debugging multi-agent interactions is significantly more complex than single-agent flows.`,
    commonVariations: [
      "Orchestrator pattern (central coordinator assigns tasks to specialists)",
      "Peer-to-peer agents (agents communicate directly, no central coordinator)",
      "Hierarchical agents (supervisor agents manage groups of worker agents)",
      "Debate pattern (multiple agents propose solutions, a judge agent selects the best)",
    ],
    antiPatterns: [
      "Too many agents -- coordination overhead exceeds the benefit of specialization",
      "Agents with overlapping responsibilities -- creates confusion and wasted work",
      "No shared memory -- agents repeat work because they cannot see what others have done",
    ],
    interviewDepth: [
      {
        question: "When should you use multiple agents instead of a single agent?",
        expectedAnswer: "When the task requires different expertise (research + coding + review), when subtasks are independent and can run in parallel, or when context window limitations prevent a single agent from holding all relevant information. For simple tasks, a single agent is simpler and more reliable.",
      },
    ],
  },

  "tool-use": {
    complexityAnalysis: `**Time Complexity:** O(t) per tool call where t = tool execution time. The agent's overhead for tool selection is O(1) (LLM inference to choose the tool).
**Space Complexity:** O(r) for the tool registry where r = number of registered tools. Each tool definition includes name, description, and parameter schema.
**Tool selection accuracy:** Depends on clear tool descriptions and parameter schemas. Ambiguous descriptions lead to incorrect tool selection.`,
    designRationale: `Tool Use extends an LLM agent's capabilities beyond text generation by providing access to external tools (web search, calculators, databases, APIs). The agent selects a tool based on the task, formats the input, calls the tool, and incorporates the result. The key design decisions are: (1) tool schema design (clear descriptions and parameter validation), (2) tool sandboxing (prevent destructive operations), (3) result formatting (convert tool output to agent-consumable text). Tradeoff: each tool call adds latency and token consumption, and tool calls can fail or return unexpected results.`,
    commonVariations: [
      "Function Calling (structured tool invocation with JSON schema parameters)",
      "Code Execution Tool (agent writes and runs code for complex computation)",
      "API Integration Tool (agent calls external APIs with authentication)",
      "Tool Chaining (output of one tool becomes input to another)",
    ],
    antiPatterns: [
      "Too many tools -- agent struggles to select the right tool from a large registry (limit to relevant tools per task)",
      "Vague tool descriptions -- agent cannot distinguish between similar tools",
      "No input validation -- agent sends malformed parameters to tools",
    ],
    interviewDepth: [
      {
        question: "How do you design a tool registry for an AI agent?",
        expectedAnswer: "Each tool has a name, description, and parameter schema (JSON Schema). The registry provides a list of available tools with descriptions. The agent selects a tool by matching the task to descriptions. Parameter validation ensures the agent's input matches the schema before execution. Results are formatted as text for the agent to consume.",
      },
    ],
  },
};
