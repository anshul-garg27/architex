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
    complexityAnalysis: `**Time Complexity:** O(1) for getInstance() with both eager and lazy initialization -- constant-time check and return. With Double-Checked Locking, the first call incurs synchronization overhead; subsequent calls are O(1) with zero contention (volatile read only). Eager init is O(1) at class-load time with no runtime check needed.
**Space Complexity:** O(1) -- exactly one instance regardless of how many callers access it.
**Thread Safety:** Depends on implementation. Bill Pugh Holder and Enum approaches are inherently thread-safe with zero synchronization overhead (JVM class-loading guarantees). Double-checked locking requires the \`volatile\` keyword in Java to prevent instruction reordering. Simple lazy init (check-then-create without synchronization) is NOT thread-safe and creates race conditions under concurrent access.
**Real-world note:** In Node.js/TypeScript, module-level variables are effectively singletons because the module cache returns the same module object on subsequent require()/import calls. Java's Runtime.getRuntime() and Python's None/True/False are language-level singletons.`,
    designRationale: `Singleton exists to solve a specific resource-management problem: when creating multiple instances would cause resource conflicts (multiple connection pools fighting over sockets), data inconsistency (multiple config managers with different states), or waste (loading the same 100MB config file twice). The core design decision is to make the class itself responsible for enforcing the "one instance" invariant, rather than relying on caller discipline. The tradeoff is testability -- by coupling instantiation to a static method, you make dependency injection harder and mock substitution nearly impossible without a reset mechanism. Modern best practice: use DI containers (Spring, Guice) to manage singleton scope instead of the GoF pattern. This gives you single-instance semantics with full testability.`,
    commonVariations: [
      "Bill Pugh Holder (inner static class, JVM class-loading guarantees thread safety -- lazy and lock-free)",
      "Enum Singleton (Effective Java recommended -- handles serialization, reflection attacks, and thread safety automatically)",
      "Double-Checked Locking (requires volatile, explicit synchronization -- lazy but more verbose)",
      "Eager Initialization (instance created at class-load time -- simple but wastes resources if never used)",
      "Module-level Singleton (Node.js/Python -- module cache acts as singleton, idiomatic in these ecosystems)",
      "DI-managed Singleton (Spring @Scope('singleton'), Guice @Singleton, Angular providedIn: 'root' -- framework controls lifecycle)",
    ],
    antiPatterns: [
      "Global state dump -- using Singleton as a catch-all for unrelated data turns it into a God Object",
      "Hidden dependencies -- callers depend on Singleton.getInstance() without declaring it in their constructor signatures, making the dependency graph invisible",
      "Testing nightmare -- cannot easily substitute mocks when tests depend on global Singleton state; tests become order-dependent and non-deterministic",
      "Premature optimization -- using Singleton 'just in case' when multiple instances would be fine",
    ],
    interviewDepth: [
      {
        question: "How would you make a Singleton testable?",
        expectedAnswer: "Access the Singleton through an interface and inject it via constructor. The DI container manages the single-instance lifecycle, but the consuming class depends only on the interface. In tests, inject a mock implementation. Alternatively, add a package-private resetInstance() method used only in tests. The key insight: the GoF Singleton couples lifecycle management to the class itself; DI separates them.",
        followUp: "Can you show how Spring manages singleton scope differently from the GoF Singleton?",
      },
      {
        question: "What happens when you try to serialize and deserialize a Singleton?",
        expectedAnswer: "Standard Java serialization creates a new instance on deserialization, breaking the singleton guarantee. Fix: implement readResolve() to return the existing instance, or use an Enum Singleton which handles this automatically. The Enum approach is superior because the JVM guarantees exactly one instance of each enum constant, even across serialization, reflection, and cloning.",
        followUp: "What about reflection attacks -- can you use reflection to call the private constructor?",
      },
      {
        question: "Why is Singleton considered an anti-pattern by many modern developers?",
        expectedAnswer: "Three core reasons: (1) Hidden dependencies -- classes that call getInstance() internally have an invisible dependency that does not appear in constructors or interfaces. (2) Tight coupling to concrete implementation -- callers are coupled to the Singleton class, not an interface, making substitution impossible without modifying the Singleton. (3) Shared mutable state -- Singleton often becomes a dumping ground for global state, creating unpredictable interactions between components. The fix is not to avoid single instances, but to manage them through DI rather than static accessors.",
        followUp: "When IS Singleton still the right choice over DI-managed scope?",
      },
    ],
  },

  "factory-method": {
    complexityAnalysis: `**Time Complexity:** O(1) for object creation -- constant-time dispatch to the correct constructor via polymorphism or registry lookup.
**Space Complexity:** O(1) per creation -- one new object allocated. The factory itself is stateless (or holds only a registry map of O(t) for t registered types).
**Scalability:** Adding new product types is O(1) code change -- one new subclass + one registry entry, no existing code modified (OCP). Registry-based dispatch avoids the switch statement entirely, keeping dispatch at O(1) hash lookup regardless of type count.
**Real-world note:** In Java, \`java.util.Calendar.getInstance()\` and \`java.text.NumberFormat.getInstance()\` are factory methods. In TypeScript, Angular's \`useFactory\` provider is a factory method integrated into the DI system.`,
    designRationale: `Factory Method solves the "construction coupling" problem: when client code uses \`new ConcreteClass()\`, it creates a compile-time dependency on that concrete class. This violates the Dependency Inversion Principle and makes swapping implementations impossible without code changes. By delegating creation to a factory method, the client depends only on the product interface. The key design decision is using method-level polymorphism (subclasses override the factory method) rather than parameterized creation. This keeps each creator focused on one product family (SRP) and makes the system open for extension (OCP). In practice, Factory Method is the backbone of plugin architectures, format parsers, and notification dispatchers. The tradeoff: for trivially simple cases with one type that will never change, the factory indirection is overhead without benefit.`,
    commonVariations: [
      "Simple Factory (static method with switch -- not a true GoF pattern but most common in practice)",
      "Parameterized Factory (pass enum/string to select product type -- e.g., NotificationFactory.create('sms'))",
      "Abstract Creator (base class defines factory method, subclasses implement -- GoF canonical form)",
      "Registry-based Factory (Map<Type, Supplier<T>> -- avoids switch statements entirely, supports dynamic registration)",
      "Static Factory Method (Effective Java Item 1: valueOf(), of(), getInstance() -- not GoF but widely used in Java)",
    ],
    antiPatterns: [
      "Switch explosion -- giant switch/if-else blocks that grow with every new type (use registry pattern instead)",
      "Factory for everything -- creating a factory when you only have one product type and no foreseeable variation is over-engineering",
      "Leaking concrete types -- returning the concrete type instead of the interface from the factory method, defeating the purpose",
      "Factory with side effects -- factory methods that perform logging, I/O, or mutation beyond object creation violate SRP and surprise callers",
    ],
    interviewDepth: [
      {
        question: "When would you use Factory Method vs Abstract Factory?",
        expectedAnswer: "Factory Method creates ONE product -- the type depends on input (e.g., NotificationFactory.create('email') returns EmailNotification). Abstract Factory creates FAMILIES of related products that must be compatible (e.g., WindowsFactory creates WindowsButton + WindowsCheckbox -- all Windows-family). Factory Method uses inheritance (subclass overrides the method); Abstract Factory uses composition (client holds a factory reference).",
        followUp: "How does the Abstract Factory guarantee that products from the same family are used together?",
      },
      {
        question: "How does Factory Method support the Open/Closed Principle?",
        expectedAnswer: "The factory method defines a product interface. Adding a new product type means creating a new class that implements the interface and a new creator subclass (or a new entry in a registry map). Existing factory code, client code, and other product classes remain unchanged. In a registry-based factory, registration is the only new line of code. Real example: adding PushNotification to a NotificationFactory requires zero changes to EmailNotification or SMSNotification.",
        followUp: "What happens if the factory method needs to accept different constructor arguments for different product types?",
      },
      {
        question: "Design a notification system where new channels (email, SMS, push, Slack) can be added without modifying existing code.",
        expectedAnswer: "Define a Notification interface with send(recipient, message). Each channel implements it: EmailNotification, SMSNotification, PushNotification. A NotificationFactory with a Map<string, () => Notification> registry. New channels register themselves at startup. The factory's create(type) method does a lookup and returns the interface. Client code calls factory.create(userPreference).send(). Adding Slack means one new class + one registration line.",
      },
    ],
  },

  builder: {
    complexityAnalysis: `**Time Complexity:** O(1) per setter call, O(1) for build(). Total O(n) where n = number of fields set. The Director (if used) orchestrates the same O(n) calls but encapsulates the sequence.
**Space Complexity:** O(1) -- the builder holds a temporary copy of fields until build() creates the final object. The builder itself is discarded after build() returns.
**Validation:** The build() method is the ideal place for cross-field validation (e.g., "if crust is gluten-free, toppings cannot include wheat"). This is impossible with telescoping constructors. Step Builder enforces required fields at compile time by returning a different interface from each step.
**Real-world note:** Java's StringBuilder, Protobuf's generated builders, OkHttp's Request.Builder, and Kotlin's DSL builders are all production Builder implementations. TypeScript often uses the "options object" pattern instead, but Step Builder remains valuable for compile-time safety.`,
    designRationale: `Builder solves the "telescoping constructor" problem: a class with 10 optional parameters would need dozens of constructor overloads, and callers cannot tell which argument is which. The fluent API (method chaining) makes construction self-documenting. The key design decision is separating the construction process from the final representation, which enables: (1) immutable products -- fields are set on the builder, then the product is frozen at build(), (2) validation before creation -- build() can reject invalid combinations, (3) step-by-step construction -- the builder accumulates state across multiple calls. Tradeoff: more code than a simple constructor, but the readability payoff is enormous.`,
    commonVariations: [
      "Inner static Builder class (most common -- Builder is nested inside the Product class)",
      "Fluent Builder with method chaining (each setter returns 'this')",
      "Step Builder (each step returns the interface for the next required step -- compile-time enforcement)",
      "Director pattern (a separate class that orchestrates the builder in a fixed sequence)",
      "Lombok @Builder / Kotlin data class copy() (code generation eliminates boilerplate)",
      "TypeScript Options Object (pass a single config object -- idiomatic alternative to Builder in TS/JS)",
    ],
    antiPatterns: [
      "Builder for simple objects -- if a class has 2-3 required fields and no optional ones, a constructor is simpler",
      "Mutable builder producing mutable objects -- loses the immutability benefit",
      "No validation in build() -- missing the opportunity to enforce invariants before the object is used",
      "Reusing builder instances -- calling build() and then continuing to modify the builder can create aliasing bugs if build() does not copy its internal state",
    ],
    interviewDepth: [
      {
        question: "How does Builder differ from the Prototype pattern?",
        expectedAnswer: "Builder constructs complex objects step-by-step from scratch, allowing full control over each field. Prototype clones an existing object and modifies the copy. Use Builder when you need fine-grained control over construction; use Prototype when you have a 'template' object and want variations of it.",
      },
      {
        question: "Design a Builder for an SQL query.",
        expectedAnswer: "SQLQuery.Builder('users').select('id','name').where('age > 18').orderBy('name').limit(50).build() returns an immutable SQLQuery with toSQL() method. The builder validates that table is non-null before build(), and defaults to SELECT * if no columns are specified. Method chaining makes intent clear: each method name IS the documentation.",
        followUp: "How would you handle required vs optional fields at compile time?",
      },
      {
        question: "When is Builder overkill, and what should you use instead?",
        expectedAnswer: "Builder is overkill when: (1) the object has fewer than 4 fields and all are required -- use a constructor. (2) The object is a simple data container -- use a record (Java 16+) or data class (Kotlin). (3) In TypeScript/JavaScript -- the options object pattern (pass a single config: Partial<Config>) is idiomatic and achieves the same readability without a separate builder class. Builder pays off when: objects have many optional fields, require cross-field validation, need immutability, or are constructed in multiple steps across different code paths.",
        followUp: "How would you implement a Step Builder to enforce that host() must be called before port()?",
      },
    ],
  },

  "abstract-factory": {
    complexityAnalysis: `**Time Complexity:** O(1) per product creation -- each factory method is a direct constructor call. No conditional dispatch needed since each concrete factory knows exactly which concrete product to create.
**Space Complexity:** O(f * p) class count where f = number of families and p = products per family. Each family needs one concrete factory class + one concrete product class per product type. For 3 families x 4 products = 12 product classes + 3 factory classes = 15 classes total.
**Scalability tradeoff:** Adding a new family (e.g., Linux) is O(p) -- one new factory + p new product classes, zero changes to existing code (OCP-compliant). Adding a new product type (e.g., TextInput) is O(f) -- modify every factory, violating OCP. This asymmetry determines when Abstract Factory fits.
**Real-world note:** Java's AWT/Swing toolkit uses Abstract Factory for platform-specific widget creation. JDBC's DriverManager is an Abstract Factory for database-specific Connection, Statement, ResultSet families.`,
    designRationale: `Abstract Factory exists to enforce compatibility between related objects. Without it, a developer could accidentally create a WindowsButton + MacCheckbox combination that looks broken. The factory interface guarantees that all products returned from a single factory instance belong to the same family. The key design decision is composition over inheritance: the client holds a factory reference (injected), not a factory subclass. This enables runtime family switching (e.g., switching themes at runtime). In modern practice, DI containers (Spring, Angular) often serve as Abstract Factories: the container configuration determines which family of services is injected. Tradeoff: the interface grows with each new product type, requiring changes to ALL factories -- this is why Abstract Factory works best when the product set is stable and the family set varies.`,
    commonVariations: [
      "Platform-specific UI factories (Windows, macOS, Linux -- each producing compatible Button, Checkbox, TextInput)",
      "Database driver families (each driver provides compatible Connection, Statement, ResultSet -- JDBC pattern)",
      "Theme factories (Light/Dark/HighContrast -- each producing consistently themed components)",
      "DI Container as Abstract Factory (Spring profiles, Angular providers -- framework selects the family based on configuration)",
      "Config-driven factory selection (read environment/config to choose concrete factory at startup)",
    ],
    antiPatterns: [
      "Product explosion -- adding too many product types makes every factory grow; consider splitting into smaller, focused factories",
      "Single-product Abstract Factory -- if you only create one product type, Factory Method is simpler and less boilerplate",
      "Mixing families -- breaking the compatibility guarantee by returning products from different families within one factory",
      "Leaking family knowledge to clients -- if clients check which factory they received, they are coupled to families and the abstraction is broken",
    ],
    interviewDepth: [
      {
        question: "What is the structural difference between Abstract Factory and Factory Method?",
        expectedAnswer: "Factory Method is a single method (often in a base class) that subclasses override to create ONE product type. Abstract Factory is an interface/class with MULTIPLE factory methods, each creating a different product in a family. Factory Method uses inheritance (subclass overrides creation); Abstract Factory uses composition (client holds a factory object). Abstract Factory often contains multiple factory methods internally.",
        followUp: "Can you implement Abstract Factory using Factory Methods internally?",
      },
      {
        question: "How does Dependency Injection relate to Abstract Factory?",
        expectedAnswer: "DI containers (Spring, Guice, Angular) are essentially runtime Abstract Factories. The container configuration (profile, module) determines which family of concrete implementations is injected. Instead of manually creating a WindowsFactory and passing it around, you configure a 'windows' profile and the DI container injects Windows-family implementations everywhere. The benefit: zero factory boilerplate code, and switching families is a configuration change.",
        followUp: "When would you still use an explicit Abstract Factory instead of relying on DI?",
      },
      {
        question: "How do you add a new product type (e.g., TextInput) to an existing Abstract Factory?",
        expectedAnswer: "You must add createTextInput() to the AbstractFactory interface, then implement it in every concrete factory (WindowsFactory, MacFactory, etc.). This is the main weakness -- it violates OCP for factories. Mitigation: keep the product set small and stable. If product types change frequently, consider a registry-based approach or breaking the factory into smaller focused interfaces (ISP).",
        followUp: "How would you handle this if you have 10 families and product types change quarterly?",
      },
    ],
  },

  prototype: {
    complexityAnalysis: `**Time Complexity:** O(n) for deep clone where n = total number of fields/nested objects to copy. Shallow clone is O(1) (just pointer copies of reference fields, value copies of primitives).
**Space Complexity:** O(n) for the cloned object -- a complete independent copy of all nested state. For shallow clone, O(1) extra space (original and clone share nested objects).
**Critical distinction:** Shallow copy shares mutable references (dangerous for mutation), deep copy creates fully independent objects (safe but slower). In Java, Object.clone() produces a shallow copy by default. In JavaScript, the spread operator \`{...obj}\` and Object.assign() are shallow; structuredClone() is deep.
**Circular references:** Deep clone of object graphs with cycles requires a visited-map to avoid infinite recursion. Java serialization handles this automatically; manual implementations must track visited objects explicitly.`,
    designRationale: `Prototype solves the "expensive construction" problem: when creating an object requires costly operations (DB lookups, network calls, complex computation), cloning an existing instance is faster. It also reduces subclass proliferation -- instead of creating subclasses for every configuration, you create prototypical instances and clone them. The key design decision is defining clone() on the object itself (not on a factory), which means each class controls its own copying semantics. This is essential because only the class knows which fields need deep copies (mutable references) vs shallow copies (immutable values). In JavaScript, the language itself is prototype-based (Object.create() creates an object with a given prototype). Tradeoff: implementing correct deep clone is error-prone -- missing a mutable field leads to shared-state bugs that are extremely hard to diagnose.`,
    commonVariations: [
      "Shallow clone (Object.clone() in Java, spread operator in JS -- fast but shares mutable references)",
      "Deep clone (recursive copy of all nested objects -- safe but slower; structuredClone() in JS, serialization in Java)",
      "Prototype Registry (a map of named prototypes that can be cloned on demand -- avoids subclass proliferation)",
      "Copy constructor (C++/Java idiom: a constructor that takes another instance as parameter, giving explicit control over copying)",
      "Serialization-based clone (serialize to bytes/JSON then deserialize -- handles circular refs but slower and requires serialization support)",
      "Immutable Prototype (clone returns a new instance with modifications applied via a with() or toBuilder() method)",
    ],
    antiPatterns: [
      "Shallow clone of mutable state -- modifying the clone accidentally modifies the original (e.g., shared List, Map, or nested object references)",
      "Clone bypassing constructor validation -- clone() creates objects without calling the constructor, so invariants enforced by the constructor are skipped",
      "Circular reference clone without visited-map -- deep clone enters infinite recursion on cyclic object graphs",
      "Using Prototype when construction is cheap -- cloning adds complexity without benefit if the constructor is trivial",
    ],
    interviewDepth: [
      {
        question: "What is the difference between shallow copy and deep copy, and when does it matter?",
        expectedAnswer: "Shallow copy duplicates field values directly -- primitives are copied, but object references are shared. Deep copy recursively creates new instances of all referenced objects. It matters when cloned objects are mutated independently. Example: cloning an Army with a List<Soldier> -- shallow copy shares the same list (adding a soldier to clone affects original), deep copy creates a new list with new Soldier instances. Immutable fields (String, Integer) do not need deep copy.",
        followUp: "How would you implement deep clone for a complex object graph with circular references?",
      },
      {
        question: "How does JavaScript's prototype chain relate to the Prototype design pattern?",
        expectedAnswer: "JavaScript's prototype chain is a language-level implementation of the Prototype concept. Object.create(proto) creates a new object whose [[Prototype]] is proto -- property lookups delegate to the prototype chain. The GoF Prototype pattern is about cloning objects to avoid expensive construction. They share the idea of creating objects from existing objects rather than from classes, but JS prototypes use delegation (shared behavior via the chain) while GoF Prototype uses copying (independent clone with its own state).",
        followUp: "How does structuredClone() differ from JSON.parse(JSON.stringify()) for deep cloning?",
      },
      {
        question: "Design a document template system using the Prototype pattern.",
        expectedAnswer: "A PrototypeRegistry holds named document templates: 'invoice', 'report', 'contract'. Each template is a fully configured Document object (with headers, styles, sections, footer). When a user creates a new document, the system clones the template and lets the user customize the copy. The clone is a deep copy so modifications do not affect the template. This avoids re-reading template configuration from the database for every new document.",
        followUp: "How would you handle templates that share common sub-components (e.g., a standard header used across multiple templates)?",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  STRUCTURAL PATTERNS
  // ════════════════════════════════════════════════════════════

  adapter: {
    complexityAnalysis: `**Time Complexity:** O(1) overhead per call -- adapter translates method signatures and delegates to the adaptee. The adapter itself does no significant computation; total time equals adaptee execution time + constant translation overhead.
**Space Complexity:** O(1) -- adapter holds a single reference to the adaptee, no data duplication. If data format translation is required (e.g., XML to JSON), temporary conversion adds O(d) where d = data size.
**Integration cost:** One adapter class per incompatible interface. For N legacy systems with different interfaces, you need N adapters. This scales linearly and each adapter is independently testable.
**Real-world note:** Java's Arrays.asList() is an adapter (adapts array to List interface). InputStreamReader adapts byte stream to character stream. In TypeScript/JS, wrapper libraries around fetch (like axios adapters) are adapters for different HTTP environments (browser XMLHttpRequest, Node http module).`,
    designRationale: `Adapter exists because real systems evolve independently. Legacy code, third-party libraries, and new APIs often have incompatible interfaces even when they provide similar functionality. Rather than modifying existing code (which may be impossible for third-party code or risky for legacy code), Adapter creates a translation layer. The key design decision is composition over inheritance: the Object Adapter holds a reference to the adaptee and translates method calls (preferred because it works with any adaptee subclass). The Class Adapter uses multiple inheritance to combine target and adaptee interfaces (possible in C++, simulated in Java via class + interface). Tradeoff: one extra layer of indirection per call, but it isolates the system from external interface changes and makes third-party dependencies swappable.`,
    commonVariations: [
      "Object Adapter (composition -- adapter holds adaptee reference, works with any adaptee subclass, most common)",
      "Class Adapter (inheritance -- adapter extends adaptee and implements target interface, limited by single inheritance in Java)",
      "Two-way Adapter (adapts in both directions -- useful when two subsystems need to communicate through each other's interfaces)",
      "Default Adapter / Stub Adapter (provides no-op implementations of all interface methods; concrete adapters override only what they need)",
      "Pluggable Adapter (uses interfaces or callbacks to adapt dynamically at runtime -- common in event-driven systems)",
    ],
    antiPatterns: [
      "Adapter chain -- adapting an adapter of an adapter signals a deeper architecture problem; refactor the interfaces instead",
      "Business logic in adapter -- adapter should only translate method signatures and data formats, not add behavior (use Decorator for added behavior)",
      "Adapting identical interfaces -- if the target and adaptee interfaces are already the same, you do not need an adapter",
      "Performance-critical path adapter -- in tight loops or hot paths, the indirection overhead (virtual dispatch + delegation) may be measurable; consider direct integration for such cases",
    ],
    interviewDepth: [
      {
        question: "How does Adapter differ from Facade and from Bridge?",
        expectedAnswer: "Adapter converts one existing interface to another expected interface -- it is applied after-the-fact to achieve compatibility. Facade creates a NEW simplified interface over a complex subsystem -- it is about simplification, not compatibility. Bridge is designed up-front to separate abstraction from implementation so they can vary independently. Adapter wraps one object; Facade orchestrates multiple objects; Bridge splits one hierarchy into two.",
        followUp: "When would you use Adapter vs Proxy?",
      },
      {
        question: "What are the trade-offs between Class Adapter and Object Adapter?",
        expectedAnswer: "Class Adapter uses multiple inheritance (or class + interface in Java): it IS-A both target and adaptee. Advantage: can override adaptee behavior, no delegation overhead. Disadvantage: limited by single inheritance, cannot adapt subclasses of the adaptee. Object Adapter uses composition (HAS-A adaptee reference). Advantage: works with any adaptee subclass, more flexible. Disadvantage: cannot override adaptee methods. In practice, Object Adapter wins in most languages because Java/TypeScript do not support multiple class inheritance.",
        followUp: "How does TypeScript's structural typing affect the need for explicit adapters?",
      },
      {
        question: "Design an adapter that integrates a legacy XML-based payment gateway into a system expecting JSON.",
        expectedAnswer: "Define a PaymentGateway interface with processPayment(order: Order): PaymentResult (JSON-based). Create XMLPaymentAdapter implementing PaymentGateway, holding a reference to LegacyXMLGateway. In processPayment(): convert Order to XML format, call legacyGateway.submitXML(xml), parse the XML response, and return a PaymentResult object. The rest of the system depends only on PaymentGateway -- swapping to a new JSON-native gateway requires only a new implementation, zero adapter needed.",
      },
    ],
  },

  decorator: {
    complexityAnalysis: `**Time Complexity:** O(d) per call where d = number of decorators in the chain. Each decorator adds O(1) overhead (method delegation + its own logic).
**Space Complexity:** O(d) -- each decorator is a separate wrapper object holding a reference to the next component.
**Stacking behavior:** Decorators compose in any order: Encrypt(Compress(FileStream)) vs Compress(Encrypt(FileStream)). Order matters when operations are not commutative -- compressing then encrypting yields different (and typically smaller) output than encrypting then compressing.
**Thread safety:** Each decorator is a separate object; concurrent reads through the same decorator chain require the underlying component to be thread-safe. In Java I/O, wrapping a shared InputStream with BufferedInputStream is not thread-safe unless externally synchronized.
**Comparison with inheritance:** Inheritance is O(1) dispatch (vtable lookup) but requires compile-time decisions. Decorator is O(d) but allows runtime composition.`,
    designRationale: `Decorator solves the "combinatorial subclass explosion" problem: if you have 4 optional features, inheritance requires 2^4 = 16 subclasses to cover every combination. Decorator uses composition to wrap objects dynamically, yielding only 4 + 1 classes. The key design decision is that decorators implement the same interface as the component they wrap -- this makes them transparent to the client and allows arbitrary stacking. Java I/O streams are the canonical real-world example: BufferedInputStream(GZIPInputStream(FileInputStream)) stacks buffering and decompression without either decorator knowing about the other. The Single Responsibility Principle is enforced naturally -- each decorator handles exactly one concern. Tradeoff: many small wrapper objects can be confusing to debug (the stack trace shows every decorator layer), the decoration order can create subtle behavioral differences, and identity checks (instanceof) fail because the outermost type is the decorator, not the original component.`,
    commonVariations: [
      "Transparent Decorator (preserves the full interface, delegates all methods -- client cannot distinguish decorated from undecorated)",
      "Conditional Decorator (applies behavior only when a predicate is true, e.g., CompressionDecorator only compresses if payload > 1KB)",
      "Java I/O Streams (BufferedInputStream, GZIPInputStream, DataInputStream -- the textbook real-world example)",
      "Python @decorator syntax (syntactic sugar for higher-order function wrapping -- not identical to GoF but same intent)",
      "Spring AOP / Middleware Decorators (cross-cutting concerns like logging, transactions, security applied as decorator layers around service beans)",
      "Functional Decorator / Higher-Order Function (TypeScript: const withLogging = <T>(fn: T) => (...args) => { log(args); return fn(...args); })",
    ],
    antiPatterns: [
      "Order-dependent decorators without documentation -- when Encrypt(Compress(stream)) vs Compress(Encrypt(stream)) produces different results but the order constraint is not enforced or documented",
      "Decorator explosion / over-stacking -- wrapping 10+ decorators makes debugging and performance profiling extremely difficult (consider Facade to hide the chain)",
      "Type checking through decorated objects -- instanceof checks break because the outermost type is the decorator; use interface-based checks or provide an unwrap() method",
      "Stateful decorators with shared state -- if a decorator holds mutable state and the chain is shared across threads, race conditions emerge silently",
    ],
    interviewDepth: [
      {
        question: "How does Decorator differ from Proxy?",
        expectedAnswer: "Decorator adds NEW behavior dynamically -- the client explicitly creates and stacks the decorator chain (e.g., new Encrypt(new Compress(stream))). Proxy controls ACCESS to existing behavior -- the client usually does not know it is using a proxy (the proxy is injected transparently). Decorator typically involves multiple stacked wrappers; Proxy is typically a single layer. The core distinction is intent: Decorator enhances, Proxy controls. In Spring, @Transactional creates a proxy (access control for transaction management), while servlet filters are decorators (adding behavior to the request pipeline).",
        followUp: "Show how you would use Decorator to add logging and caching to a data service without modifying the service class.",
      },
      {
        question: "How does Python's @decorator syntax relate to the GoF Decorator pattern?",
        expectedAnswer: "Python's @decorator is syntactic sugar for higher-order functions: @log_calls def foo() is equivalent to foo = log_calls(foo). It wraps functions, not objects. GoF Decorator wraps objects that share an interface, enabling runtime composition and multiple stacked decorators. Python @decorator achieves the same goal (adding behavior transparently) but operates at the function level. For object-level decoration in Python, you still use the GoF approach with composition and shared abstract base classes.",
        followUp: "In Java I/O, why is BufferedInputStream a Decorator and not a Proxy?",
      },
      {
        question: "Design a notification system where messages can be decorated with encryption, compression, and logging.",
        expectedAnswer: "NotificationSender interface with send(message). BaseNotificationSender sends the raw message. NotificationDecorator implements NotificationSender and holds a wrapped NotificationSender. EncryptionDecorator encrypts the message then delegates to wrapped.send(). CompressionDecorator compresses then delegates. LoggingDecorator logs then delegates. Client composes: new Logging(new Encrypt(new Compress(new BaseSender()))). Adding a new concern (e.g., rate-limiting) requires one new decorator class and zero changes to existing code.",
        followUp: "What happens if the encryption decorator throws an exception -- how does error handling propagate through the chain?",
      },
    ],
  },

  facade: {
    complexityAnalysis: `**Time Complexity:** O(s) where s = number of subsystem calls orchestrated by the facade method. The facade itself adds zero computational overhead -- it is pure delegation.
**Space Complexity:** O(1) -- facade holds references to subsystem objects, no data duplication. Subsystem objects are typically injected or lazily created.
**Coupling reduction:** Without Facade, coupling is O(c * s) (every client talks to every subsystem). With Facade, coupling drops to O(c + s) (clients talk to facade, facade talks to subsystems). This is a dramatic improvement for testability -- mock the facade to test clients in isolation.
**Real-world scale:** AWS SDK is a massive example -- each service client (S3Client, DynamoDBClient) is a facade over complex HTTP signing, serialization, retry, and error-handling subsystems. Developers call s3.putObject() without knowing about SigV4 signing or chunked transfer encoding.`,
    designRationale: `Facade exists because complex subsystems are hard to use correctly. Without it, every client must understand the initialization order, method call sequences, and interdependencies of multiple subsystem classes. Facade provides a "happy path" API for common use cases while still allowing direct subsystem access for power users. The key design decision is that Facade does NOT add new functionality -- it simply orchestrates existing subsystem methods in the correct order. This distinguishes it from Adapter (which converts interfaces), Mediator (which manages bidirectional inter-object communication), and Decorator (which adds behavior). In layered architectures, facades often define layer boundaries -- a service layer facade hides the complexity of repositories, validators, and domain logic from controllers. Tradeoff: the facade can become a God Object if too many unrelated operations are added, and over-reliance on facades can hide necessary complexity that developers need to understand.`,
    commonVariations: [
      "Simple Facade (single class with a few methods orchestrating multiple subsystem calls -- e.g., OrderFacade.checkout() calls inventory, payment, shipping)",
      "Layered Facade / Facade of Facades (each layer simplifies a different subsystem level -- common in enterprise architectures with service, DAO, and integration layers)",
      "Session Facade (enterprise Java pattern -- one facade per use case or transaction boundary, wrapping EJBs or services)",
      "API Gateway as Facade (microservices pattern -- single entry point routing, aggregating, and transforming requests to many backend services)",
      "SDK Client Facade (AWS SDK, Stripe SDK -- hides authentication, serialization, retry, and error mapping behind simple method calls)",
    ],
    antiPatterns: [
      "God Facade -- stuffing dozens of unrelated operations into one facade class until it becomes a 2000-line dumping ground (split into focused, domain-specific facades)",
      "Mandatory Facade -- preventing direct subsystem access entirely, which blocks power users who need fine-grained control (facade should simplify, not restrict)",
      "Business logic in Facade -- adding validation, computation, or domain rules instead of pure orchestration (keep logic in the subsystem services, facade only coordinates)",
      "Tight coupling to subsystem internals -- facade depending on private methods or internal data structures of subsystems instead of their public interfaces",
    ],
    interviewDepth: [
      {
        question: "How does Facade differ from Mediator?",
        expectedAnswer: "Facade provides a simplified interface TO a subsystem -- it is unidirectional (client -> facade -> subsystems). Subsystem classes do not know about the facade. Mediator manages communication BETWEEN objects in a subsystem -- it is bidirectional (colleagues <-> mediator). Colleagues know about the mediator and route messages through it. Facade simplifies external access; Mediator coordinates internal interactions. A checkout flow uses a Facade (OrderFacade.checkout() calls inventory + payment + shipping). A chat room uses a Mediator (users send messages through the ChatRoom mediator, not directly to each other).",
        followUp: "Can a Facade also act as a Mediator internally?",
      },
      {
        question: "Is an API Gateway a Facade pattern?",
        expectedAnswer: "Yes, an API Gateway is a distributed Facade. It provides a single entry point to a complex microservices ecosystem, handling routing, authentication, rate limiting, and response aggregation. The key difference from a classic Facade: an API Gateway operates at the network boundary (HTTP/gRPC), while a GoF Facade is an in-process object. API Gateway also adds cross-cutting concerns (auth, rate limiting) which a pure Facade would not -- it is a Facade + Decorator hybrid in practice. Examples: AWS API Gateway, Kong, Netflix Zuul.",
        followUp: "When would you choose a BFF (Backend-for-Frontend) over a general API Gateway?",
      },
      {
        question: "Design an e-commerce checkout facade that coordinates inventory, payment, and shipping services.",
        expectedAnswer: "CheckoutFacade holds references to InventoryService, PaymentService, ShippingService. checkout(order) calls: (1) inventoryService.reserve(order.items) -- if fails, throw OutOfStockException. (2) paymentService.charge(order.total) -- if fails, inventoryService.release(order.items), throw PaymentException. (3) shippingService.schedule(order) -- if fails, paymentService.refund(order.total), inventoryService.release(order.items), throw ShippingException. The facade handles the compensation logic so the controller has a single checkout() call.",
        followUp: "How would you handle partial failures in step 3 without blocking the user?",
      },
    ],
  },

  proxy: {
    complexityAnalysis: `**Time Complexity:** Varies by type. Virtual Proxy: O(1) for lazy check + O(creation) on first access, O(1) thereafter. Caching Proxy: O(1) cache hit, O(real) cache miss. Protection Proxy: O(1) permission check per call. Logging Proxy: O(1) overhead per call.
**Space Complexity:** Virtual Proxy: O(0) until real object is created, then O(real). Caching Proxy: O(n) for n cached entries -- requires TTL/eviction to bound memory. Protection Proxy: O(1). Remote Proxy: O(serialization) for marshalling/unmarshalling.
**Transparency:** Proxy implements the same interface as the real object -- clients cannot distinguish them (Liskov Substitution Principle). This enables transparent insertion at any point.
**Thread safety:** Caching Proxy requires thread-safe cache (ConcurrentHashMap or synchronized access). Virtual Proxy requires double-checked locking or lazy holder for thread-safe initialization. Protection Proxy is inherently thread-safe if the permission check is stateless.`,
    designRationale: `Proxy provides a surrogate that controls access to another object. The key insight is the Proxy Principle: "do not pay for what you do not use." Virtual Proxy delays expensive creation until actually needed (lazy loading), Caching Proxy avoids redundant computation or network calls, Protection Proxy enforces access control, and Remote Proxy hides network communication complexity. The design decision to use the same interface as the real object means the proxy is completely transparent -- it can be inserted anywhere the real object is expected without client code changes. This is extensively used in enterprise frameworks: Spring AOP creates dynamic proxies for @Transactional, @Cacheable, @Secured annotations; JPA uses lazy-loading proxies for entity relationships; gRPC generates client stubs as Remote Proxies. Tradeoff: adds one level of indirection per proxy layer, caching proxies may serve stale data, and protection proxies may deny legitimate access if rules are too strict.`,
    commonVariations: [
      "Virtual Proxy (lazy initialization -- delay expensive object creation until first use; e.g., Hibernate lazy-loaded entity associations)",
      "Protection Proxy (access control -- check permissions/roles before delegating; e.g., Spring Security method-level authorization)",
      "Caching Proxy (memoization -- store results of expensive operations with TTL; e.g., HTTP response caching, CDN edge caching)",
      "Logging Proxy (monitoring -- log all method calls, arguments, and return values without modifying the real object)",
      "Remote Proxy (represent an object in a different address space -- gRPC stubs, Java RMI, .NET WCF proxies)",
      "Smart Reference (add reference counting, dirty tracking, or copy-on-write semantics -- e.g., std::shared_ptr in C++)",
    ],
    antiPatterns: [
      "Proxy hiding critical errors -- swallowing or transforming exceptions from the real object instead of propagating them faithfully breaks caller error handling",
      "Stale cache proxy -- serving outdated data without TTL, invalidation strategy, or cache-aside pattern leads to consistency bugs that are extremely hard to diagnose",
      "Over-proxying -- stacking multiple proxy layers (Circuit Breaker -> Cache -> Logging -> Auth -> Remote) adds cumulative latency; audit whether each layer justifies its cost",
      "Proxy violating Liskov Substitution -- if the proxy changes the observable behavior (not just adding control), clients will break when the proxy is inserted or removed",
    ],
    interviewDepth: [
      {
        question: "Proxy vs Decorator -- they look structurally identical. What is the real difference?",
        expectedAnswer: "Intent is the differentiator. Proxy CONTROLS ACCESS to the real object -- the client typically does not choose to use a proxy (it is injected transparently by a framework like Spring). Decorator ADDS NEW BEHAVIOR -- the client explicitly composes the decorator chain. Proxy manages lifecycle concerns (lazy loading, caching, access control); Decorator enhances functionality (encryption, compression, logging). Structurally identical (both implement the same interface and delegate), semantically different. Spring @Transactional is a proxy (controls transaction access); Java BufferedInputStream is a decorator (adds buffering behavior).",
        followUp: "Can a single wrapper be both a Proxy and a Decorator simultaneously?",
      },
      {
        question: "How does Spring AOP use the Proxy pattern?",
        expectedAnswer: "Spring creates dynamic proxies around beans annotated with @Transactional, @Cacheable, @Async, etc. For interface-based beans, Spring uses JDK Dynamic Proxy (java.lang.reflect.Proxy). For class-based beans, Spring uses CGLIB to generate a subclass proxy. The proxy intercepts method calls, applies the cross-cutting concern (open transaction, check cache, submit to thread pool), then delegates to the real bean. This is why @Transactional does not work on self-invocation -- the call bypasses the proxy.",
        followUp: "Why does @Transactional fail on private methods or self-invocation within the same class?",
      },
      {
        question: "In a microservices system, where would you use a Proxy pattern?",
        expectedAnswer: "A Remote Proxy (gRPC stub or REST client) represents a remote service as a local object. A Caching Proxy wraps the remote proxy to avoid redundant network calls. A Circuit Breaker Proxy wraps that to handle failures gracefully. This creates a proxy chain: CircuitBreaker(Cache(RemoteProxy(ServiceInterface))). Each layer is transparent to the layer above -- the controller sees a simple ServiceInterface and does not know about the proxy chain. In service meshes like Istio, the sidecar proxy (Envoy) is a network-level proxy handling mTLS, retries, and observability.",
        followUp: "How would you handle cache invalidation in the caching proxy for a distributed system?",
      },
    ],
  },

  composite: {
    complexityAnalysis: `**Time Complexity:** O(n) for tree operations (display, getSize) where n = total nodes. Each node is visited exactly once via recursive traversal.
**Space Complexity:** O(n) for the tree structure itself + O(d) call stack depth where d = maximum tree depth for recursive operations. For very deep trees (d > 10,000), convert to iterative traversal with an explicit stack to avoid StackOverflowError.
**Uniform interface cost:** In the transparent variant, leaf nodes must implement add/remove even though they do not use them (throws UnsupportedOperationException or no-op). This is the key tradeoff: uniformity vs type safety.
**Real-world scale:** React component trees, Android View/ViewGroup hierarchies, and XML/HTML DOMs are all Composites. React's virtual DOM diffing is O(n) on the composite tree. Java Swing's Container/Component hierarchy is the textbook implementation.`,
    designRationale: `Composite solves the "treat part and whole uniformly" problem. Without it, client code must constantly check if an object is a leaf or a container, leading to type-checking conditionals (instanceof/typeof) everywhere. By defining a common interface (Component) with both Leaf and Composite implementing it, clients call the same methods on both. The Composite delegates to its children recursively, aggregating results. The key design decision is the tradeoff between safety and transparency: safe design puts add/remove only on Composite (compile-time safety, but client must downcast), transparent design puts them on Component (runtime errors but simpler client code). Most real-world implementations choose transparency. Composite is fundamental to UI frameworks (React, Android View, Java Swing), document models (DOM), and organizational hierarchies. Tradeoff: forcing a uniform interface on structurally different objects (files vs directories) can be awkward, and deep trees create performance and stack-depth concerns.`,
    commonVariations: [
      "Transparent Composite (add/remove on Component interface -- simpler client code, runtime type errors for leaf.add(); React and DOM use this approach)",
      "Safe Composite (add/remove only on Composite class -- compile-time safety, client must cast; used in Java AWT/Swing)",
      "Composite with parent reference (each child holds a back-reference to its parent -- enables upward traversal; DOM parentNode, React fiber parent)",
      "Composite + Visitor (use Visitor to add operations to the tree without modifying node classes -- calculate size, search, serialize)",
      "Composite + Iterator (flatten recursive traversal into depth-first or breadth-first iteration without explicit recursion)",
    ],
    antiPatterns: [
      "Deep recursion on large trees -- can cause StackOverflowError for trees with depth > 10,000 (use iterative traversal with an explicit stack or trampoline pattern)",
      "Non-uniform leaf behavior -- when leaves behave very differently from composites, forcing them into the same interface creates confusing no-op methods and violates Interface Segregation Principle",
      "Composite for flat collections -- using Composite when there is no hierarchical relationship adds unnecessary complexity; a simple List or Array suffices",
    ],
    interviewDepth: [
      {
        question: "Design a file system using Composite. What is the Component, Leaf, and Composite?",
        expectedAnswer: "FileSystemEntry is the Component interface with getName(), getSize(), and display(indent). File is a Leaf that returns its own size and prints its name with indentation. Directory is a Composite that stores a List<FileSystemEntry>, implements getSize() by recursively summing children's sizes, and display() by printing its name then calling display(indent+1) on each child. The client code calls getSize() on any entry without caring if it is a file or directory -- a directory with 3 files and 2 subdirectories returns the sum of all contents recursively.",
        followUp: "How would you add permission checking to the composite structure without modifying File and Directory?",
      },
      {
        question: "Composite vs Decorator -- both use recursion and share an interface. What is the difference?",
        expectedAnswer: "Composite models a TREE structure (one-to-many: a Directory has many Files/Directories). Decorator wraps a SINGLE object (one-to-one: EncryptionDecorator wraps one DataStream). Composite aggregates children into a whole; Decorator adds behavior to a single component. Composite's recursion traverses a tree; Decorator's recursion traverses a linear chain. In React: a component containing children is Composite; a withAuth(Component) HOC is Decorator.",
        followUp: "Can you use Composite and Decorator together in the same design?",
      },
      {
        question: "How would you implement getSize() iteratively instead of recursively for a very deep file system tree?",
        expectedAnswer: "Use a stack-based iterative approach: push the root onto a stack. While stack is not empty, pop a node. If it is a File, add its size to the total. If it is a Directory, push all its children onto the stack. This converts O(d) call stack depth to O(n) heap usage (the explicit stack), avoiding StackOverflowError for deep trees. This is a standard DFS iterative conversion.",
        followUp: "What about breadth-first traversal -- when would you prefer BFS over DFS on a Composite?",
      },
    ],
  },

  bridge: {
    complexityAnalysis: `**Time Complexity:** O(1) per operation -- delegation to the implementation is a single method call with zero computational overhead.
**Space Complexity:** O(1) -- the abstraction holds one reference to the implementation object. No data duplication.
**Scalability:** Without Bridge, a * i classes (a abstractions x i implementations). With Bridge, a + i classes. Example: 5 notification types x 4 channels = 20 classes without Bridge, 5 + 4 = 9 with Bridge. Adding a 5th channel adds 1 class (not 5).
**Real-world scale:** JDBC is a Bridge: the JDBC API (abstraction) delegates to vendor-specific drivers (implementation). Adding PostgreSQL support means one new driver, zero changes to application code. Similarly, SLF4J bridges logging abstractions to implementations (Logback, Log4j2).`,
    designRationale: `Bridge exists to prevent class explosion when a system varies in two independent dimensions. Without it, 3 notification urgencies x 3 message channels = 9 classes, and every new channel requires 3 new classes. With Bridge, you have 3 + 3 = 6 classes, and adding a new channel requires exactly 1 new class. The key design decision is separating abstraction from implementation into two independent hierarchies connected by composition (has-a), rather than inheritance (is-a). This is fundamentally different from Adapter: Bridge is designed up-front to allow two dimensions to vary independently, while Adapter is applied after-the-fact to make existing incompatible interfaces work together. In modern software, Bridge appears as the driver/provider pattern: JDBC drivers, SLF4J logging backends, React Native's bridge to native modules, and cross-platform UI frameworks. Tradeoff: more indirection and initial design complexity for simple cases, but it pays off dramatically as the dimensions grow. If you only have one dimension of variation, inheritance or Strategy is simpler.`,
    commonVariations: [
      "Driver Architecture (JDBC API + vendor drivers, ODBC, SLF4J + Logback/Log4j2 -- the most common real-world Bridge)",
      "Notification + Channel Bridge (UrgentNotification/InfoNotification x EmailSender/SlackSender/SMSSender -- independent urgency and delivery)",
      "Shape + Renderer Bridge (Circle/Square x OpenGLRenderer/DirectXRenderer -- classic textbook example with real graphics applications)",
      "Platform + UI Bridge (React Native bridge to iOS/Android native modules, Flutter engine to platform-specific rendering)",
      "Bridge with Factory (use a factory to select the correct implementation at runtime based on configuration or environment)",
    ],
    antiPatterns: [
      "Premature bridging -- using Bridge when only one dimension varies; simple inheritance or Strategy pattern is sufficient and less complex",
      "Bridge with single implementation -- over-engineering when there is only one implementor and no realistic prospect of a second one",
      "Leaking implementation details through abstraction -- if the abstraction methods closely mirror implementation methods, the bridge adds indirection without real decoupling",
    ],
    interviewDepth: [
      {
        question: "What is the difference between Bridge and Adapter?",
        expectedAnswer: "Bridge is designed UP-FRONT to let abstraction and implementation vary independently -- you create both hierarchies simultaneously. Adapter is applied AFTER-THE-FACT to make an existing incompatible interface work with your expected interface. Bridge separates two dimensions that will evolve independently; Adapter wraps one existing interface to look like another. Bridge is about preventing future class explosion; Adapter is about backward compatibility. JDBC is a Bridge (designed for multiple drivers from the start); a JSON-to-XML adapter wraps an existing XML parser to look like a JSON parser.",
        followUp: "Can an Adapter evolve into a Bridge if you realize both sides need to vary independently?",
      },
      {
        question: "How does JDBC exemplify the Bridge pattern?",
        expectedAnswer: "The JDBC API (Connection, Statement, ResultSet) is the abstraction hierarchy. Database vendor drivers (PostgreSQL, MySQL, Oracle) are the implementation hierarchy. Application code uses the JDBC abstraction; the driver translates to database-specific protocols. Adding a new database (e.g., CockroachDB) means implementing one new driver -- zero changes to application code. Adding a new API feature (e.g., batch updates) means modifying the abstraction interface -- all drivers must implement it. This is exactly the Bridge trade-off: adding implementations is cheap, adding abstractions is expensive.",
        followUp: "What are the limitations of Bridge when both dimensions change frequently?",
      },
      {
        question: "Design a cross-platform notification system using Bridge where urgency and delivery channel vary independently.",
        expectedAnswer: "Notification is the abstraction with subclasses UrgentNotification (adds retry logic, escalation) and InfoNotification (fire-and-forget). MessageSender is the implementation interface with send(title, body). Concrete senders: EmailSender, SlackSender, SMSSender, PushSender. UrgentNotification.notify() calls sender.send() with retry on failure. InfoNotification.notify() calls sender.send() once. Adding a new channel (WhatsApp) means one new MessageSender class. Adding a new urgency level (ScheduledNotification) means one new Notification subclass. Neither change affects the other dimension.",
        followUp: "How would you combine Bridge with Factory to select the MessageSender at runtime?",
      },
    ],
  },

  flyweight: {
    complexityAnalysis: `**Time Complexity:** O(1) for flyweight lookup (HashMap.get()). O(1) for operations on the flyweight (extrinsic state passed as parameter).
**Space Complexity:** Without Flyweight: O(n * s) where n = objects and s = bytes per intrinsic state. With Flyweight: O(u * s + n * r) where u = unique flyweights, r = reference/pointer size. Example: 1M game tiles with 5 terrain types: without Flyweight = 1M * 200 bytes = 200MB; with Flyweight = 5 * 200 bytes + 1M * 8 bytes (pointers) = ~8MB. That is a 25x memory reduction.
**Prerequisite:** Must be able to cleanly separate intrinsic (shared, immutable) state from extrinsic (per-instance, passed at call time) state. If this separation is unclear, Flyweight is the wrong pattern.
**Thread safety:** Flyweight objects MUST be immutable (intrinsic state is read-only). This makes them inherently thread-safe -- no synchronization needed for concurrent access. The FlyweightFactory's cache (HashMap) may need synchronization for concurrent creation (ConcurrentHashMap or computeIfAbsent).`,
    designRationale: `Flyweight trades API complexity for dramatic memory savings. By sharing common state across thousands or millions of objects, it reduces memory usage by orders of magnitude. The key design decision is the intrinsic/extrinsic split: intrinsic state (font name, glyph bitmap, terrain texture) lives in the shared flyweight object and MUST be immutable; extrinsic state (position, color, context) is passed to methods at call time. The FlyweightFactory ensures each unique intrinsic configuration exists only once using a cache/map (often called an identity map or intern pool). Real-world examples are pervasive: Java String Pool (String.intern()), Java Integer Cache (-128 to 127), game engines sharing texture/sprite data across thousands of entities, and document editors sharing font/glyph objects across millions of characters. Flyweight is closely related to the concept of structural sharing in immutable data structures (used in Redux, Immer, persistent data structures). Tradeoff: method signatures become more complex (must pass extrinsic state as parameters), computation may increase (deriving extrinsic state instead of storing it), and the intrinsic/extrinsic boundary must be carefully designed upfront.`,
    commonVariations: [
      "String Interning (Java String.intern(), Python automatic string interning for identifiers -- the most ubiquitous flyweight in production systems)",
      "Integer/Boolean Cache (Java Integer.valueOf() caches -128 to 127, Boolean.TRUE/FALSE -- saves millions of autoboxing allocations)",
      "Game Tile/Sprite Flyweight (shared texture and rendering data per terrain type, per-instance position/rotation passed at render time)",
      "Document Character Flyweight (shared CharacterGlyph with font/style, per-character position/page passed to render() -- used in word processors)",
      "Unshared Flyweight (ConcreteFlyweight that opts out of sharing when uniqueness is needed -- part of the GoF pattern but rarely discussed)",
      "Connection Pool as Flyweight variant (shared connection objects with per-request context -- conceptually similar intrinsic/extrinsic split)",
    ],
    antiPatterns: [
      "Mutable intrinsic state -- if shared state can be modified, ALL users of that flyweight are affected simultaneously, creating impossible-to-debug global side effects",
      "Flyweight without significant duplication -- the overhead of the factory/cache is not worth it for fewer than hundreds of objects; profile before applying",
      "Confusing intrinsic and extrinsic -- putting per-instance state (position, context) in the flyweight breaks sharing and defeats the purpose entirely",
      "Premature flyweight optimization -- applying Flyweight before measuring actual memory pressure; profile first, optimize second",
    ],
    interviewDepth: [
      {
        question: "How does Java's String Pool use the Flyweight pattern?",
        expectedAnswer: "Java maintains a string intern pool in the heap (moved from PermGen in Java 7). String literals are automatically interned -- 'hello' == 'hello' is true because both reference the same flyweight. String.intern() manually adds a string to the pool. The intrinsic state is the character array (shared, immutable). This saves enormous memory in applications with many duplicate strings (e.g., parsing CSV files with repeated column values). The tradeoff: intern() has O(n) lookup cost and the pool can grow unbounded if overused with unique strings.",
        followUp: "What changed about String interning in Java 7, and why?",
      },
      {
        question: "Flyweight vs Singleton -- both share instances. What is the difference?",
        expectedAnswer: "Singleton ensures exactly ONE instance of a class globally. Flyweight manages a POOL of shared instances keyed by intrinsic state -- there can be many flyweight instances, each with different intrinsic state. Singleton controls lifecycle (one and only one); Flyweight optimizes memory (share identical objects). Singleton is about uniqueness; Flyweight is about deduplication. Integer.valueOf(42) returns a shared flyweight; Runtime.getRuntime() returns the singleton.",
        followUp: "Can a FlyweightFactory itself be a Singleton?",
      },
      {
        question: "Calculate the memory savings for a 1000x1000 game map with 5 terrain types, where each terrain has 200 bytes of texture data.",
        expectedAnswer: "Without Flyweight: 1,000,000 tiles x 200 bytes = 200MB for terrain data alone. With Flyweight: 5 flyweight objects x 200 bytes = 1KB for shared terrain data + 1,000,000 references x 8 bytes (64-bit pointer) = 8MB for tile references. Total with Flyweight: ~8MB vs 200MB without. That is a 25x memory reduction. Each tile stores only its position (extrinsic: x, y as 2 ints = 8 bytes) + a reference to its terrain flyweight (8 bytes) = 16 bytes per tile instead of 200+ bytes.",
        followUp: "How would you handle terrain tiles that need per-instance variation (e.g., damage level)?",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  BEHAVIORAL PATTERNS
  // ════════════════════════════════════════════════════════════

  observer: {
    complexityAnalysis: `**Time Complexity:** O(n) for notify() where n = number of observers. Each observer update() is called once. O(1) subscribe/unsubscribe with HashSet-backed storage (O(n) with array-backed due to linear scan on removal).
**Space Complexity:** O(n) for the observer list. Each observer reference is O(1). Weak references reduce this to O(live observers) by allowing GC of unreachable observers.
**Notification models:** Push model (subject sends data with notification -- Redux dispatch sends the entire action + state) vs Pull model (subject notifies, observers query what they need -- React useSyncExternalStore). Push is simpler but may send unnecessary data; Pull is more efficient but couples observers to the subject API.
**Amortized cost in real systems:** Redux notifies all subscribers on every dispatch, but React-Redux uses selector memoization (O(1) shallow equality check) to skip re-renders when the selected slice has not changed. Effective cost is O(n) notifications but O(k) re-renders where k = affected subscribers.`,
    designRationale: `Observer decouples the event source from event handlers, enabling the Open/Closed Principle at its purest: adding a new reaction to an event requires zero changes to the event source. Without it, the Subject would need to know about every consumer and call them directly -- every new consumer means modifying the Subject. This is why Observer is the backbone of every event-driven system from DOM events to Redux to Kafka consumers. The key design decision is the notification mechanism: synchronous (same thread, deterministic order, simpler debugging) vs asynchronous (event loop, non-blocking, better throughput). Most in-process implementations (Redux, EventEmitter) are synchronous; distributed systems use pub-sub (asynchronous Observer with a message broker). The second critical decision is push vs pull: Redux pushes the entire state on every dispatch (simple but wasteful), while React useSyncExternalStore pulls only what changed (efficient but more complex). Tradeoff: debugging is harder because the call chain is implicit -- you cannot see who gets notified by reading the Subject code, and notification storms can cascade unpredictably.`,
    commonVariations: [
      "Push Observer (subject sends data to observers in update() call -- Redux dispatch, DOM CustomEvent)",
      "Pull Observer (subject notifies, observers query via getState() -- React useSyncExternalStore)",
      "Event-based Observer (EventEmitter pattern -- subscribe to named events with typed payloads)",
      "Reactive Streams (RxJS Observable, Project Reactor Flux -- observers as composable data stream operators with backpressure)",
      "Pub-Sub (distributed Observer with message broker -- Kafka topics, SNS/SQS, Redis pub/sub -- decouples publisher/subscriber across processes)",
      "Weak Reference Observer (WeakRef/FinalizationRegistry -- observer auto-detaches when garbage collected, preventing memory leaks)",
    ],
    antiPatterns: [
      "Memory leak -- forgetting to detach observers when they are no longer needed (classic in SPAs: React useEffect without cleanup, Angular subscriptions without unsubscribe, leading to retained component trees)",
      "Cascade notifications -- observer A modifies subject during update(), triggering notify() again, creating an infinite loop (Redux middleware that dispatches inside a reducer, MobX reactions that write to observables they read)",
      "God Subject -- one subject with dozens of event types, forcing all observers to filter irrelevant events (split into focused subjects or use typed event channels)",
      "Synchronous bottleneck -- slow observers (e.g., writing to disk, making HTTP calls) block the notification chain, stalling all subsequent observers (use async notification, microtask queue, or dedicated worker threads)",
    ],
    interviewDepth: [
      {
        question: "What is the difference between Observer and Pub-Sub, and how does Redux fit?",
        expectedAnswer: "Observer is in-process: Subject directly holds references to Observers and calls update() synchronously. Pub-Sub is distributed: Publisher and Subscriber do not know each other -- a message broker (Kafka, RabbitMQ) sits between them, enabling async, cross-process communication. Redux is an in-process Observer: the store is the Subject, store.subscribe() registers observers, and dispatch() triggers synchronous notification. However, Redux middleware (redux-saga, redux-thunk) adds an async layer that makes it behave like a hybrid.",
        followUp: "How would you handle the case where an Observer update() throws an exception -- should it stop notification of remaining observers?",
      },
      {
        question: "Design an event notification system where order placement triggers inventory, billing, and notification updates.",
        expectedAnswer: "OrderService is the Subject with an EventManager. Observers: InventoryObserver reserves stock, BillingObserver initiates payment, NotificationObserver sends email/SMS, AnalyticsObserver tracks conversion. Each observer subscribes to ORDER_PLACED. Adding a new observer requires zero changes to OrderService (OCP). Use try-catch around each observer update() so a failing BillingObserver does not prevent NotificationObserver from running. For ordering guarantees, use a priority queue of observers.",
        followUp: "What if the billing observer needs to notify the order service of payment failure -- how do you avoid circular Observer dependencies?",
      },
      {
        question: "How do you prevent memory leaks in Observer implementations in frontend frameworks?",
        expectedAnswer: "Three strategies: (1) Explicit cleanup -- React useEffect returns a cleanup function that calls unsubscribe(); Angular ngOnDestroy calls subscription.unsubscribe(). (2) Weak references -- use WeakRef so the observer is automatically GCd when the component is destroyed, and FinalizationRegistry to clean up the subscription list. (3) Operator-based -- RxJS takeUntil(destroy$) or take(1) automatically completes the subscription. The root cause is that the Subject holds a strong reference to the Observer, preventing garbage collection even after the Observer owner is destroyed.",
        followUp: "How does React 18 useSyncExternalStore solve the tearing problem that useEffect-based subscriptions had?",
      },
    ],
  },

  strategy: {
    complexityAnalysis: `**Time Complexity:** O(1) for strategy swap (setStrategy). The execution time depends entirely on the strategy implementation -- the pattern adds zero overhead beyond a single virtual method dispatch.
**Space Complexity:** O(1) per strategy (each strategy is a stateless or lightweight object). O(s) total for s available strategies if pre-instantiated. Functional strategies (lambdas) have even lower overhead -- no class allocation, just a closure.
**Key characteristic:** Strategies are interchangeable -- they ALL implement the same interface, so swapping one for another requires zero code changes in the Context. This is what makes hot-swapping payment gateways or compression algorithms possible in production without redeployment.`,
    designRationale: `Strategy is the most important behavioral pattern for LLD interviews because it directly models a universal problem: algorithms change. Pricing models, payment gateways (Stripe, PayPal, Adyen), sorting algorithms, compression codecs, serialization formats -- all are strategies. Without Strategy, you get giant if/else or switch blocks that grow with every new algorithm and violate OCP. The key design decision is extracting the varying algorithm into a separate interface, letting the Context delegate to it. This is composition over inheritance in its purest form. The CLIENT chooses the strategy (unlike State where transitions happen internally). In real systems like payment processing, the strategy is often selected by a Factory based on runtime input (country, amount, merchant preference), combining Strategy + Factory. Tradeoff: clients must know which strategies exist. For trivial cases (one algorithm that will never change), the extra interface is over-engineering. Also, strategies that need rich context data may require complex parameter passing.`,
    commonVariations: [
      "Class-based Strategy (interface + concrete implementations -- GoF canonical, Java Comparator)",
      "Functional Strategy (pass lambda/closure directly -- idiomatic in JS/Python, Array.sort() comparator)",
      "Strategy + Factory (factory creates the right strategy from runtime input -- payment gateway selection by region)",
      "Context-free Strategy (strategy is a pure function, no instance state needed -- compression codecs, hash functions)",
      "Multi-strategy Context (context holds multiple strategies for different aspects -- e.g., serialization + compression + encryption)",
      "Enum-based Strategy (each enum constant implements the strategy method -- Java enums with abstract methods, TypeScript discriminated unions)",
    ],
    antiPatterns: [
      "Strategy for one algorithm -- over-engineering when there is only one implementation and no plan for more (YAGNI violation)",
      "Leaking context internals -- strategies that reach into the context private state instead of receiving data through parameters (breaks encapsulation, prevents unit testing strategies in isolation)",
      "Strategy selection in the strategy -- concrete strategies should not know about each other or select the next strategy (that is the State pattern job)",
      "Fat strategy interface -- a strategy interface with many methods that not all implementations need (violates ISP; split into smaller focused interfaces)",
    ],
    interviewDepth: [
      {
        question: "How does Strategy differ from State?",
        expectedAnswer: "Strategy: the CLIENT explicitly selects which algorithm to use (user picks credit card vs PayPal). Strategies do NOT know about each other. State: transitions happen INSIDE the object (order moves from PLACED to SHIPPED). States KNOW which state comes next. Same UML structure (Context delegates to an interface), entirely different control flow and intent.",
        followUp: "Can a Strategy ever be used together with the State pattern? Give a concrete example.",
      },
      {
        question: "Design a payment processing system using Strategy for a company like Stripe.",
        expectedAnswer: "PaymentStrategy interface with processPayment(amount, currency, metadata) and calculateFee(amount). Concrete strategies: CreditCardPayment (2.9% + $0.30), PayPalPayment (3.49% + $0.49), ACHBankTransfer (0.8% capped at $5), CryptoPayment (flat network fee). PaymentProcessor is the Context that holds a PaymentStrategy reference and delegates to it. A StrategyFactory selects the strategy based on payment method type. Adding a new gateway (e.g., ApplePay) means one new class implementing PaymentStrategy -- zero changes to PaymentProcessor or existing strategies.",
        followUp: "How would you add transaction retry logic with exponential backoff without modifying any strategy?",
      },
      {
        question: "When would you use a functional strategy (lambda) vs a class-based strategy?",
        expectedAnswer: "Use functional strategies when the algorithm is a single pure function with no state (sort comparators, validators, transformers). Use class-based strategies when the algorithm needs constructor-injected dependencies (API clients, config), maintains internal state across calls (connection pooling), or requires multiple methods (processPayment + calculateFee + refund). In Java, the line blurs because lambdas can implement single-method interfaces. In TypeScript/Python, functional strategies are the default for simple cases.",
        followUp: "How does this relate to the Command pattern -- both encapsulate behavior?",
      },
    ],
  },

  command: {
    complexityAnalysis: `**Time Complexity:** O(1) for execute() and undo() (direct delegation to receiver). O(n) for macro command executing n sub-commands. O(h) for undo-all where h = history depth.
**Space Complexity:** O(h) for the command history stack. Each command stores its parameters and enough state to undo. SaveDocumentCommand stores the full document snapshot; DeleteCommand saves the deleted content. Memory management is critical -- unbounded history causes OOM in long-running editors.
**Undo granularity:** Each command must store sufficient state to reverse its effect. For delete operations (DeleteCommand), this means saving the deleted data before removal. For insert operations, storing position and length is enough since undo just deletes. This asymmetry is a common interview gotcha.`,
    designRationale: `Command exists because operations need to be first-class objects. Without it, operations are ephemeral method calls that vanish after execution -- you cannot undo, replay, queue, or log them. By encapsulating each operation as an object with execute() and undo(), you gain: (1) undo/redo via a command history stack (every text editor, Figma, Photoshop), (2) macro recording by storing command sequences (Excel macros, Vim dot-repeat), (3) deferred execution by queuing commands (task queues, job schedulers), (4) transaction logging by serializing commands (event sourcing, database WAL). The key design decision is separating the invoker (toolbar button, keyboard shortcut) from the receiver (TextEditor, Canvas) via the command object. This three-way decoupling is what makes keybinding customization possible. Tradeoff: every operation becomes its own class (SaveDocumentCommand, DeleteCommand, FormatTextCommand), which increases class count significantly. For simple CRUD without undo, Command is over-engineering.`,
    commonVariations: [
      "Undoable Command (execute() + undo() -- the canonical variant used in text editors, graphic tools, IDEs)",
      "Macro Command (composite of commands executed as a batch -- Vim macros, Photoshop actions, Excel VBA)",
      "Queued Command (commands stored in a queue for deferred execution -- print spooler, job scheduler, SQS workers)",
      "Transaction Command (multiple commands wrapped in a transaction with rollback -- database operations, multi-step checkout)",
      "Lambda Command (in functional languages, commands as closures with captured state -- Redux action creators, React useReducer dispatch)",
      "Logged Command (commands serialized to an append-only log for replay -- event sourcing, crash recovery, audit trails)",
    ],
    antiPatterns: [
      "Command without undo -- if you never need undo/redo/replay/audit, Command is over-engineering (just call the method directly; the extra indirection adds complexity without value)",
      "Stateless commands that cannot undo -- execute() works but undo() is a no-op because no state was saved before mutation (SaveDocumentCommand that does not snapshot the previous content cannot undo)",
      "God command -- a single command class that handles multiple unrelated operations via a type switch (violates SRP; each operation should be its own command class)",
      "Unbounded history -- storing every command indefinitely leads to memory exhaustion in long-running applications (cap history size or use incremental snapshots like operational transforms)",
    ],
    interviewDepth: [
      {
        question: "How would you implement undo/redo in a text editor using Command?",
        expectedAnswer: "Each edit (InsertCommand, DeleteCommand, FormatTextCommand) is a Command object that stores the receiver (TextEditor), parameters, and state needed for undo. InsertCommand stores position and text; its undo() deletes that range. DeleteCommand saves the deleted text before removal; its undo() re-inserts it at the original position. CommandHistory maintains an undo stack and redo stack. execute() pushes to undo and clears redo. undo() pops from undo, calls command.undo(), pushes to redo. redo() pops from redo, calls command.execute(), pushes to undo.",
        followUp: "How would you implement macro recording (record a sequence of commands and replay them)?",
      },
      {
        question: "How does Command differ from Strategy -- both encapsulate behavior?",
        expectedAnswer: "Command encapsulates a REQUEST as an object -- it captures the receiver, parameters, and state at creation time for deferred execution, undo, and replay. Strategy encapsulates an ALGORITHM -- it is stateless and interchangeable at runtime. Command is a noun (SaveDocumentCommand holds data); Strategy is a verb (CompressionStrategy has no per-invocation state). Command has execute() + undo(); Strategy has a single algorithmic method. A Command knows its receiver; a Strategy is given data by the Context.",
        followUp: "Can a Command contain a Strategy? Give an example.",
      },
      {
        question: "How is the Command pattern used in distributed systems like task queues?",
        expectedAnswer: "In SQS/Celery/Sidekiq, each message in the queue is a serialized Command object containing the operation type, parameters, and metadata (timestamp, retry count, idempotency key). The worker process deserializes the command and calls execute(). Retry logic wraps the command in a RetryCommand decorator. Dead letter queues store commands that failed all retries. This is the Queued Command variant -- the invoker (API server) and receiver (worker) are in separate processes, and the queue decouples them temporally.",
        followUp: "How would you ensure idempotency for commands that may be delivered more than once?",
      },
    ],
  },

  state: {
    complexityAnalysis: `**Time Complexity:** O(1) for each state transition -- delegate to current state handler, which decides the next state. No conditional chain to traverse.
**Space Complexity:** O(s) where s = number of state classes. Each state is typically stateless (no per-instance data), so often only one instance per state class is needed (Flyweight optimization). Total memory: s state objects + 1 context reference to current state.
**State machine complexity:** Total transitions = s * e (states x events). Each state class handles only its own transitions, so complexity is distributed -- no single class contains the full transition table. Adding a new state requires only implementing handlers for the events that state responds to.
**Comparison with switch/case:** A switch with s states and e events has s*e branches in ONE method. State pattern distributes those same s*e branches across s classes with e methods each -- same total, but SRP-compliant and independently testable.`,
    designRationale: `State eliminates giant conditional blocks (if state == PLACED then ... else if state == SHIPPED then ...) by distributing behavior across state classes, each following the Single Responsibility Principle. This is essential for modeling object lifecycles: orders (Draft -> Confirmed -> Shipped -> Delivered), documents (Draft -> Review -> Published -> Archived), network connections (Closed -> Connecting -> Connected -> Disconnecting). The key design decision is that states control transitions internally (states know the next state), unlike Strategy where the client selects the algorithm externally. States can also enforce valid transitions -- DraftState.ship() throws an error because you cannot ship a draft. The Context delegates to its current state object and provides a setState() method for transitions. Tradeoff: more classes (one per state), adding a new event requires implementing it in every state class, and the transition logic is distributed across classes rather than visible in one place (a state transition diagram is essential documentation).`,
    commonVariations: [
      "Self-transitioning State (state object calls context.setState(nextState) -- the canonical GoF variant)",
      "Table-driven State Machine (transition table Map<State, Map<Event, State>> instead of state classes -- less code, less flexible, used in parser generators and protocol handlers)",
      "Hierarchical State Machine / Statechart (states within states -- used in complex game AI, UML statecharts, XState library)",
      "State + Observer (state transitions trigger notifications to external observers -- order status webhooks, UI state indicators)",
      "Pushdown State Machine (state stack with push/pop -- game menus, nested modal dialogs, interrupt handling)",
    ],
    antiPatterns: [
      "State pattern for 2 states -- a boolean flag is simpler when there are only two states with trivial transitions (isOpen/isClosed); the State pattern shines with 4+ states and complex transitions",
      "Exposing state classes to clients -- clients should interact with the Context, not individual states; leaking state classes means callers bypass transition validation",
      "Missing transitions -- forgetting to define what happens for an event in a particular state leads to silent failures (should throw IllegalStateTransition or return a no-op with logging)",
      "State storing context-specific data -- state objects should be stateless so they can be shared across contexts (Flyweight); per-context data belongs in the Context",
    ],
    interviewDepth: [
      {
        question: "Design a vending machine using the State pattern.",
        expectedAnswer: "VendingMachine is the Context with states: IdleState, HasMoneyState, DispensingState, OutOfStockState. IdleState.insertCoin() adds balance and transitions to HasMoneyState. HasMoneyState.selectProduct() checks balance -- if sufficient, transitions to DispensingState; if not, displays Insufficient funds. DispensingState.dispense() delivers product, gives change, checks stock -- transitions to IdleState if items remain, OutOfStockState otherwise. Each state rejects invalid operations: IdleState.dispense() says Insert coin first; OutOfStockState.insertCoin() refunds and displays Out of stock.",
        followUp: "How would you add a MaintenanceState that locks the machine and only an admin can unlock?",
      },
      {
        question: "How does the State pattern compare to a state machine library like XState?",
        expectedAnswer: "The GoF State pattern uses polymorphism -- each state is a class with methods for each event. XState uses a declarative configuration -- states, events, and transitions are defined in a JSON-like config object. XState adds features the GoF pattern does not: guards (conditional transitions), actions (side effects on transitions), parallel states, history states, and visualization tools. GoF is better for simple FSMs integrated into domain objects; XState is better for complex workflows with tooling requirements.",
        followUp: "When would you choose a table-driven state machine over the GoF State pattern?",
      },
      {
        question: "Model an e-commerce order lifecycle using the State pattern.",
        expectedAnswer: "OrderContext holds currentState and order data. States: DraftState (can addItem, removeItem, submit), PendingPaymentState (can pay, cancel), PaidState (can ship, refund), ShippedState (can deliver, reportLost), DeliveredState (can returnItem), CancelledState (terminal), RefundedState (terminal). Each state implements the OrderState interface with all event methods, throwing InvalidTransitionException for disallowed events. DraftState.submit() validates the cart is non-empty and transitions to PendingPaymentState. PaidState.ship() records tracking number and transitions to ShippedState.",
        followUp: "How would you handle partial refunds where the order is both partially refunded and partially shipped?",
      },
    ],
  },

  iterator: {
    complexityAnalysis: `**Time Complexity:** O(n) to iterate through all n elements. O(1) per hasNext()/next() call for indexed collections. O(1) amortized per next() for paginated iterators (O(page_size) when fetching a new page, amortized over page_size elements).
**Space Complexity:** O(1) for the iterator itself (stores current position/cursor). The underlying collection is O(n) regardless. Lazy/generator iterators can produce elements from O(1) state (e.g., Fibonacci sequence) -- no backing collection needed.
**Lazy evaluation:** Iterator can compute elements on demand -- no need to materialize the entire collection in memory. This is essential for paginated APIs (DynamoDB scan returning millions of rows), infinite sequences (event streams), and transformed pipelines (Java Streams, Python generators). The entire java.util.stream API is built on lazy iterators.`,
    designRationale: `Iterator decouples traversal logic from collection structure, solving two problems at once. First, it provides a uniform interface (hasNext/next) regardless of whether the underlying data is an array, linked list, tree, hash map, or remote API -- clients iterate without knowing the data structure. Second, it supports multiple simultaneous traversals with independent state -- two iterators over the same list track separate positions. The pattern is so fundamental that every modern language builds it in: Python for-in uses __iter__/__next__, Java for-each uses Iterable/Iterator, JavaScript for-of uses Symbol.iterator. The key design decision is external vs internal iteration: external (hasNext/next) gives the client control over traversal (early termination, interleaving), while internal (forEach callback) is simpler but less flexible. Tradeoff: external iteration is verbose and error-prone (forgetting to call next()), while internal iteration cannot be interrupted mid-traversal in most languages.`,
    commonVariations: [
      "External Iterator (client controls iteration with hasNext/next -- Java Iterator, C++ iterators, more flexible for complex control flow)",
      "Internal Iterator (collection drives iteration with forEach callback -- Ruby blocks, JS Array.forEach, simpler but no early termination)",
      "Filtered Iterator (wraps another iterator, skips elements not matching a predicate -- Java Stream.filter(), Python filter())",
      "Paginated Iterator (fetches next page from API when current page is exhausted -- DynamoDB paginator, GitHub API cursor-based pagination)",
      "Generator / Lazy Iterator (yields elements on demand via coroutine -- Python yield, JS function*, Kotlin sequence, essential for infinite streams)",
      "Bidirectional Iterator (supports both forward and backward traversal -- C++ bidirectional_iterator, Java ListIterator with previous()/hasPrevious())",
    ],
    antiPatterns: [
      "Modifying collection during iteration -- causes ConcurrentModificationException in Java, undefined behavior in most languages (use a copy, collect-then-remove, or CopyOnWriteArrayList)",
      "Iterator that materializes entire collection -- fetching all pages or expanding all lazy elements into memory defeats the purpose of lazy evaluation (stream the results instead)",
      "Leaking iterator state -- returning an iterator that holds references to resources (file handles, database cursors) without a close mechanism leads to resource leaks (use AutoCloseable iterators)",
      "Ignoring fail-fast semantics -- not handling ConcurrentModificationException or similar signals that the underlying collection has been structurally modified during iteration",
    ],
    interviewDepth: [
      {
        question: "How would you implement a paginated API iterator?",
        expectedAnswer: "PaginatedIterator stores the API client, endpoint, page size, current cursor/token, and current batch of results. hasNext() checks if there are remaining items in the current batch; if the batch is empty, it fetches the next page using the cursor. next() returns the current item and advances the index. When the API returns an empty next cursor, hasNext() returns false. The client code sees a simple Iterator interface and is completely unaware of pagination. This is exactly how AWS SDK DynamoDB paginator and GitHub GraphQL cursor pagination work.",
        followUp: "How would you handle API rate limiting (429 Too Many Requests) in the paginated iterator?",
      },
      {
        question: "What is the difference between Java Streams and the Iterator pattern?",
        expectedAnswer: "Java Streams are a pipeline of lazy, composable operations (filter, map, reduce) built on top of iterators. The Iterator pattern provides sequential element access (hasNext/next); Streams add functional transformations, parallel execution (parallelStream), and terminal operations (collect, forEach, reduce). Under the hood, Stream uses Spliterator (a splitting iterator) that can partition data for parallel processing. Iterator is pull-based and single-threaded; Stream can be push-based and multi-threaded.",
        followUp: "How does Python generator protocol (yield) relate to the Iterator pattern?",
      },
      {
        question: "Design a file system tree iterator that supports depth-first and breadth-first traversal.",
        expectedAnswer: "FileSystemIterator implements Iterator<FileNode>. It takes a root directory and a TraversalStrategy (DFS or BFS). DFS uses a stack -- push root, then for each directory popped, push its children in reverse order. BFS uses a queue -- enqueue root, then for each directory dequeued, enqueue its children. Both yield files and directories through the same hasNext()/next() interface. This combines Iterator with Strategy -- the traversal algorithm is swappable. Add a FilteredIterator wrapper to skip hidden files or match glob patterns.",
        followUp: "How would you make this iterator lazy so it does not load the entire file tree into memory?",
      },
    ],
  },

  mediator: {
    complexityAnalysis: `**Time Complexity:** O(c) per mediated interaction where c = number of colleagues that need to be notified/coordinated. The mediator decides which colleagues to contact based on the message type and routing logic.
**Space Complexity:** O(c) for the mediator holding references to all colleagues. O(r) additional for routing rules/event maps if using an event-driven mediator.
**Coupling reduction:** Without mediator, c colleagues with all-to-all communication = O(c^2) dependencies (each knows about every other). With mediator: O(c) dependencies (each colleague knows only the mediator). Adding a new colleague requires updating only the mediator, not all existing colleagues.
**Real-world scale:** Redux is a Mediator with O(1) routing per dispatch (single reducer tree) + O(n) subscriber notification. Air traffic control coordinates O(c) aircraft with O(c^2) potential conflict pairs, but the ATC (mediator) reduces each aircraft awareness to O(1) -- just the ATC.`,
    designRationale: `Mediator centralizes complex many-to-many communication between objects, transforming a mesh topology into a star topology. Without it, each colleague must hold references to all other colleagues it communicates with, creating a tangled web of dependencies that makes adding, removing, or changing a colleague ripple through the entire system. The mediator acts as a hub: colleagues send messages to the mediator, which applies routing logic and forwards to the appropriate recipients. This is why chat rooms, form dialogs, and Redux stores are all mediators. The key design decision is the tradeoff between distributed intelligence (each colleague routes its own messages -- simpler for 2-3 objects) and centralized intelligence (mediator handles all routing -- essential for 5+ interacting objects). Redux chose centralized: all state mutations go through one store, and the reducer is the mediator logic. Tradeoff: the mediator can become a God Object if it absorbs too much business logic -- it should only coordinate, not compute. Keep domain logic in the colleagues; keep routing logic in the mediator.`,
    commonVariations: [
      "Chat Room Mediator (users send messages through a room, not directly to each other -- Slack channels, Discord servers)",
      "UI Form Mediator (form components interact through a dialog controller -- enabling/disabling fields based on selections, cross-field validation)",
      "Event Mediator (colleagues emit events, mediator routes them based on event type -- similar to Observer but with centralized routing intelligence)",
      "Air Traffic Controller (planes communicate through ATC, not directly to each other -- the canonical real-world mediator example)",
      "Redux / Flux Store (components dispatch actions to a central store, reducers mediate state changes, subscribers receive updates -- combines Mediator + Observer)",
      "Message Broker as Mediator (RabbitMQ exchanges route messages between producers and consumers based on routing keys -- Mediator at infrastructure level)",
    ],
    antiPatterns: [
      "God Mediator -- mediator grows to contain all business logic that should be in colleagues, becoming the single most complex class in the system (keep the mediator as a thin routing layer)",
      "Mandatory mediation -- forcing simple point-to-point communication through a mediator adds unnecessary indirection (if only two objects communicate, let them talk directly)",
      "Mediator as service locator -- colleagues pull dependencies from the mediator instead of having them injected, hiding dependencies and making testing harder",
      "Circular mediation -- mediator notifies colleague A, which sends a message back to the mediator, which notifies A again (use a processing flag or message deduplication to break cycles)",
    ],
    interviewDepth: [
      {
        question: "How does Mediator differ from Observer?",
        expectedAnswer: "Observer is a broadcast mechanism: subject notifies ALL observers, observers are independent, and there is no central intelligence deciding who gets what. Mediator is a routing mechanism: it decides WHICH colleagues receive which messages based on routing logic. Observer has no awareness of the relationship between subscribers; Mediator encapsulates the communication protocol and can apply conditional logic. In Observer, the Subject does not know what observers do with notifications. In Mediator, the mediator orchestrates the interaction flow.",
        followUp: "When would you use Mediator vs an Event Bus?",
      },
      {
        question: "Is Redux a Mediator or an Observer? Defend your answer.",
        expectedAnswer: "Redux is BOTH. The store acts as a Mediator because all state mutations are centralized through dispatch() -> reducer -- components never modify each other state directly. The store also acts as an Observer because store.subscribe() lets components register for state change notifications. The dispatch-reduce cycle is Mediator (centralized routing of state changes). The subscribe-notify cycle is Observer (broadcast to registered listeners). This dual nature is why Redux is so powerful -- it combines the decoupling benefits of both patterns.",
        followUp: "How does the Flux architecture unidirectional data flow relate to the Mediator pattern?",
      },
      {
        question: "Design a smart home controller using the Mediator pattern.",
        expectedAnswer: "SmartHomeMediator is the central controller. Colleagues: ThermostatDevice, LightingDevice, SecuritySystem, MotionSensor, SmartLock. When MotionSensor detects movement, it calls mediator.notify(motion, location). The mediator checks the time: if nighttime, it tells LightingDevice to turn on hallway lights and SecuritySystem to log the event; if daytime, no action. When SmartLock is unlocked, the mediator tells ThermostatDevice to switch to home mode and LightingDevice to set welcome scene. No device knows about any other device -- all coordination goes through the mediator.",
        followUp: "How would you prevent the SmartHomeMediator from becoming a God Object as you add more device types and rules?",
      },
    ],
  },

  "template-method": {
    complexityAnalysis: `**Time Complexity:** O(sum of steps) -- the template method calls each step sequentially. Individual step complexity depends on the subclass implementation.
**Space Complexity:** O(1) beyond what each step requires -- the template method itself is stateless.
**Extension points:** Template methods have two types of steps: abstract (MUST override) and hooks (CAN override with default no-op). A well-designed template has 3-5 steps; more than 7 indicates the algorithm should be decomposed.`,
    designRationale: `Template Method defines the "what" (algorithm structure) and lets subclasses define the "how" (individual steps). The key insight is the Hollywood Principle: "Don't call us, we'll call you" -- the base class calls the subclass's methods, not the other way around. This is inheritance-based reuse at its best: the invariant parts of the algorithm live in one place (DRY), the variable parts are deferred to subclasses. Real-world examples: React class components (componentDidMount, render, componentWillUnmount), JUnit test lifecycle (setUp, testMethod, tearDown), and Java's AbstractList where subclasses only implement get() and size(). Tradeoff: rigid structure (subclasses cannot change the step order), and deep inheritance hierarchies become hard to maintain. Template Method is compile-time fixed; you cannot swap algorithms at runtime. For more flexibility, consider Strategy (composition-based).`,
    commonVariations: [
      "Hook Methods (optional override points with default no-op implementations -- React shouldComponentUpdate, JUnit setUp/tearDown)",
      "Template with Strategy Delegation (template defines the skeleton but delegates individual steps to injected strategy objects -- combines inheritance and composition)",
      "Abstract Class vs Interface Default Methods (Java 8+ default methods enable template methods in interfaces, avoiding single-inheritance limitation)",
      "NullObject Hooks (hook methods return safe defaults so subclasses only override what they need -- reduces boilerplate)",
      "Data Processing Pipeline (extract -> transform -> validate -> load, with variable implementations per data source)",
      "Framework Lifecycle Hooks (JUnit setUp/tearDown, Spring @PostConstruct/@PreDestroy, Android Activity lifecycle)",
    ],
    antiPatterns: [
      "Too many abstract steps -- forces subclasses to implement 10+ methods they do not need. Use hooks with default no-ops so subclasses only override what matters (Interface Segregation Principle).",
      "Calling overridable methods in constructor -- in Java/C++, if the base class constructor calls a virtual method, the subclass's fields are not yet initialized, leading to subtle NullPointerExceptions. The template method should only be called after construction is complete.",
      "Deep template hierarchy -- AbstractProcessor -> DatabaseProcessor -> SQLProcessor -> PostgreSQLProcessor becomes unmaintainable. Flatten to two levels (base + concrete) and use composition for additional variation.",
      "Template Method when Strategy would suffice -- if steps vary independently and you need runtime algorithm swapping, composition (Strategy) is more flexible than inheritance",
    ],
    interviewDepth: [
      {
        question: "How does Template Method differ from Strategy?",
        expectedAnswer: "Template Method uses inheritance: the algorithm skeleton is in a base class, subclasses override specific steps. The base class controls the flow (Hollywood Principle). Strategy uses composition: the entire algorithm is encapsulated in a separate object swappable at runtime. Template Method is fixed at compile time; Strategy can change at runtime. Template Method controls the overall flow with variable steps; Strategy encapsulates one complete interchangeable algorithm. Use Template Method when the algorithm structure is fixed but steps vary; use Strategy when the entire algorithm varies.",
        followUp: "Can you combine Template Method and Strategy? When would that make sense?",
      },
      {
        question: "How does the Hollywood Principle apply to Template Method, and where do you see it in real frameworks?",
        expectedAnswer: "The Hollywood Principle ('Don't call us, we'll call you') means the framework (base class) calls YOUR code, not the other way around. In Template Method, the base class's templateMethod() calls the subclass's abstract/hook methods at the right time. Examples: JUnit calls setUp() before each test and tearDown() after. Spring calls @PostConstruct after dependency injection. React calls componentDidMount after first render. The subclass never calls these lifecycle methods directly -- the framework invokes them at the correct point in the algorithm.",
        followUp: "What are the downsides of inversion of control through Template Method vs dependency injection?",
      },
      {
        question: "Design a data export system using Template Method where CSV, PDF, and Excel share the same export flow.",
        expectedAnswer: "AbstractDataExporter defines exportData() as the template method: openConnection() -> fetchData() -> transformData() (abstract) -> formatOutput() (abstract) -> writeToFile() (abstract) -> closeConnection(). Hook: addHeader() with default no-op. CSVExporter overrides transformData() to flatten nested objects, formatOutput() to write comma-separated rows, writeToFile() to stream to a .csv file. PDFExporter overrides addHeader() to add a company logo. The invariant flow (open, fetch, transform, format, write, close) lives in one place.",
        followUp: "What if a new requirement says the Excel exporter needs to fetch data differently (paginated vs bulk)?",
      },
    ],
  },

  "chain-of-responsibility": {
    complexityAnalysis: `**Time Complexity:** O(h) where h = number of handlers in the chain (worst case: request passes through all handlers).
**Space Complexity:** O(h) for the chain of handler objects.
**Short-circuit behavior:** Unlike Decorator (which always delegates), Chain of Responsibility can STOP processing. Express.js middleware: calling next() passes to the next handler; calling res.send() terminates the chain.`,
    designRationale: `Chain of Responsibility decouples the sender from the receiver by giving multiple objects a chance to handle a request. The sender does not know (or care) which handler processes its request. This is the pattern behind Express.js/Koa middleware (app.use(auth, logging, cors, router)), Java Servlet Filters, DOM event bubbling/capturing, and exception handler chains. The key design decision is whether handlers STOP or PASS: in some variants, only one handler processes the request (first match wins -- approval workflows); in others, all handlers process it sequentially (like log levels where DEBUG goes to console, file, AND alert). The chain can be configured dynamically at runtime, enabling flexible request processing pipelines. Tradeoff: debugging is harder because you cannot easily predict which handler will process a given request -- distributed control flow makes stack traces less informative.`,
    commonVariations: [
      "Middleware Pipeline (each handler can modify request/response, pass to next via next(), or reject -- Express.js, Koa, Django middleware)",
      "Event Bubbling/Capturing (DOM events propagate up the tree (bubbling) or down (capturing) -- each element can handle or pass)",
      "Approval Chain with Escalation (manager -> director -> VP -- each checks amount threshold, escalates if above their authority)",
      "Validation Chain (each validator checks one rule, stops on first failure -- Spring Validator, Joi, Zod)",
      "Log Level Chain (each handler checks if it can handle the log level, then passes to next regardless -- java.util.logging)",
      "Exception Handler Chain (catch blocks as a chain -- each handler catches specific exception types, rethrows unhandled ones)",
    ],
    antiPatterns: [
      "Unhandled requests -- request falls off the end of the chain with no handler processing it. Always add a default/fallback handler at the end (Express 404 middleware, default case in switch).",
      "Infinite chain loop -- handler A passes to B, B passes back to A. Use a set of visited handlers or enforce a linear chain structure to prevent cycles.",
      "Handler coupling -- handlers that depend on the execution of previous handlers break the chain's modularity. Each handler should be self-contained and independently testable.",
      "Guaranteed-to-fail chain -- a chain where no handler ever matches the request type wastes O(n) traversal. Validate that the chain covers all expected request types at configuration time.",
    ],
    interviewDepth: [
      {
        question: "How does Express.js middleware implement Chain of Responsibility?",
        expectedAnswer: "Each middleware function receives (req, res, next). Calling next() passes control to the next middleware in the chain. Calling res.send() or res.json() terminates the chain. The chain is configured via app.use() in order -- first registered, first executed. Error-handling middleware takes (err, req, res, next) and forms a separate error chain. This is CoR because: the sender (HTTP request) does not know which middleware handles it, and each middleware decides to handle, modify, or pass the request.",
        followUp: "How would you implement middleware that measures request duration across the entire chain?",
      },
      {
        question: "Chain of Responsibility vs Decorator -- both chain objects, what is the fundamental difference?",
        expectedAnswer: "Chain of Responsibility can STOP processing -- a handler decides to handle the request OR pass it on. Only one handler (or none) processes the request. Decorator ALWAYS delegates to the wrapped object AND adds behavior. Every decorator in the stack contributes. CoR is about routing/filtering (which handler?); Decorator is about enhancing (add logging + caching + compression). In Express: auth middleware rejects unauthorized requests (CoR -- stops chain), while logging middleware always calls next() and logs (Decorator-like -- always passes through).",
        followUp: "Can a single middleware act as both a Decorator and a Chain handler?",
      },
      {
        question: "Design a customer support ticket routing system using Chain of Responsibility.",
        expectedAnswer: "SupportHandler interface with handle(ticket) and setNext(handler). Concrete handlers: FAQBotHandler (checks if ticket matches FAQ, auto-responds), TechnicalSupportHandler (checks if category is 'technical'), BillingSupportHandler (checks if category is 'billing'), ManagerEscalationHandler (handles everything that reaches it -- the fallback). Chain: FAQ -> Technical -> Billing -> Manager. Each handler checks canHandle(ticket) -- if yes, processes and returns; if no, calls next.handle(ticket). The chain is configurable: adding a new SecurityHandler means inserting one handler, no existing code changes.",
        followUp: "How would you add priority-based routing where VIP customers skip the FAQ bot?",
      },
    ],
  },

  memento: {
    complexityAnalysis: `**Time Complexity:** O(s) for save (copy s fields to memento) and O(s) for restore. Individual save/restore is typically O(1) if state is a reference type (snapshot the reference).
**Space Complexity:** O(m * s) where m = number of mementos stored and s = state size per memento. Memory management is critical -- limit history size or use incremental mementos.
**Encapsulation:** Memento hides internal state from the Caretaker. The Caretaker stores mementos but cannot read or modify them. In Java, this is enforced with a package-private Memento class or a narrow public interface.`,
    designRationale: `Memento solves the "save/restore without breaking encapsulation" problem. Without it, saving state requires exposing internal fields (breaking encapsulation) or serializing the entire object (heavyweight). Memento provides a narrow interface: the Originator creates and restores mementos, the Caretaker stores them, but the Caretaker cannot access the state inside the memento. Real-world examples: Git commits (each commit is a snapshot of the repository state, the reflog is the Caretaker), browser history (each page visit stores a state memento for back/forward navigation), and game save files (full state snapshots at checkpoints). The key design decision is the three-role separation: Originator (creates/restores), Memento (stores state), Caretaker (manages history). Tradeoff: if state is large, storing many mementos consumes significant memory -- consider incremental mementos (like Git's delta compression) or periodic checkpoints (like database WAL with periodic snapshots).`,
    commonVariations: [
      "Full-state Memento (snapshot all fields -- simple but memory-heavy. Git's initial commit stores full tree state.)",
      "Incremental Memento (store only the diff from previous state -- Git's packfiles use delta compression. Memory-efficient but complex restore: must chain diffs.)",
      "Serialization-based Memento (serialize to JSON/protobuf -- portable across processes/machines but slower. Used in distributed checkpoint systems.)",
      "Memento + Command (Command saves a Memento before executing, uses it for undo. Best of both worlds: Command tracks what happened, Memento enables rollback.)",
      "Memento with Compression (compress snapshots before storage -- reduces memory at the cost of CPU. Useful for large state objects like document editors.)",
      "Checkpoint Memento (save full snapshots periodically, incremental changes between checkpoints -- database WAL approach)",
    ],
    antiPatterns: [
      "Unbounded history -- storing unlimited mementos causes memory leak. Set a max history size (e.g., Ctrl+Z limited to 100 steps) or use a circular buffer. Git solves this with gc and pruning.",
      "Exposing memento internals -- letting the Caretaker read or modify memento state breaks encapsulation. The Caretaker should treat mementos as opaque tokens. In TypeScript, use a branded type or private class fields.",
      "Storing entire state when diff would suffice -- if state is 10MB and changes are 100 bytes, storing full snapshots wastes 1000x memory. Use incremental mementos for large state objects.",
      "No memento metadata -- mementos without timestamps, descriptions, or version numbers make it impossible to display meaningful undo history to users.",
    ],
    interviewDepth: [
      {
        question: "How does Memento preserve encapsulation, and how does Git use this principle?",
        expectedAnswer: "Memento preserves encapsulation because only the Originator can create and restore mementos -- the Caretaker stores them but cannot inspect or modify the internal state. In Java, the Memento class can be an inner class of the Originator with private fields. Git applies this: each commit object stores a complete tree snapshot (the memento), the reflog (caretaker) tracks commit history, but the reflog never modifies commit contents. The commit hash guarantees immutability -- any modification would change the hash.",
        followUp: "How would you implement memento immutability in TypeScript where there are no true private fields at runtime?",
      },
      {
        question: "Memento vs Command for undo -- when do you use which?",
        expectedAnswer: "Command stores the operation and its inverse -- undo() reverses the command. More memory-efficient (stores delta, not full state). But: requires every operation to have a well-defined inverse, which is hard for complex operations (how do you inverse 'apply blur filter to image'?). Memento stores a full snapshot -- undo restores it. Simpler (no inverse logic) but memory-heavy. Use Command when operations have clear inverses (insert/delete text, move shape). Use Memento when state changes are complex or non-invertible (image filters, physics simulations, rich text formatting).",
        followUp: "How would you combine Memento and Command for a drawing application with both simple moves and complex filter operations?",
      },
      {
        question: "Design an undo/redo system for a collaborative text editor with multiple users.",
        expectedAnswer: "Each user has a local CommandHistory with Mementos. On edit: (1) save a Memento of current state, (2) execute the edit command, (3) push memento to undo stack, clear redo stack. Undo: pop from undo stack, restore memento, push current state to redo stack. For collaboration: use Operational Transformation (OT) or CRDTs to merge concurrent edits. Each user's undo only reverses THEIR operations, not other users'. The server stores authoritative mementos at periodic checkpoints for crash recovery.",
        followUp: "How do you handle the case where undoing your edit conflicts with another user's subsequent edit?",
      },
    ],
  },

  visitor: {
    complexityAnalysis: `**Time Complexity:** O(n) where n = elements in the structure. Each element is visited once. The visit() method's complexity depends on the operation.
**Space Complexity:** O(d) for recursive traversal where d = structure depth (call stack). O(1) for the Visitor itself beyond any accumulated results.
**Double dispatch:** Visitor uses element.accept(visitor) which calls visitor.visit(element) -- this achieves runtime dispatch on both the visitor type AND the element type, which single dispatch (virtual methods) cannot do. This is the mechanism that compilers like TypeScript, Babel, and GCC use for AST traversal.`,
    designRationale: `Visitor allows adding new operations to an object structure without modifying the structure's classes. The key insight is the tradeoff between adding operations and adding elements: if you frequently add new operations but rarely add new element types, Visitor is ideal (Open/Closed for operations). If you frequently add new element types, Visitor forces you to modify every visitor -- in that case, polymorphism (virtual methods) is better. Real-world examples: AST compilers (TypeScript compiler uses visitors for type-checking, code generation, and optimization passes over the same AST), Babel plugins (each plugin is a visitor that transforms specific AST node types), java.nio.file.FileVisitor (walk a file tree with custom pre/post visit logic), and DOM traversal (TreeWalker API). The double-dispatch mechanism (accept + visit) is what enables type-safe operation dispatch without instanceof checks. Tradeoff: adding a new element type requires changing all visitors (violates OCP for elements), and the Visitor has access to element internals (breaks encapsulation).`,
    commonVariations: [
      "AST Visitor (compilers use this -- TypeScript's checker.ts visits AST nodes for type inference, emitter.ts visits for code generation, same tree, different visitors)",
      "Acyclic Visitor (uses interface per element type -- avoids the cyclic dependency between Visitor and all Element types. More verbose but scales to large hierarchies.)",
      "Default Visitor (base visitor with no-op implementations for all visit methods -- concrete visitors override only the nodes they care about. Babel plugin visitors use this.)",
      "Visitor with Accumulator (visitor accumulates results during traversal -- e.g., collect all identifiers, sum all numeric literals, gather type errors)",
      "Hierarchical Visitor (separate enterNode/leaveNode callbacks -- allows pre-order and post-order processing in a single traversal. Used by ESLint rule visitors.)",
      "Visitor + Composite (visit each node in a composite tree structure -- the composite's accept() recursively calls accept() on children)",
    ],
    antiPatterns: [
      "Visitor on frequently changing structures -- adding a new AST node type requires adding a visit method to EVERY visitor. If your element hierarchy changes often, use polymorphism instead.",
      "Visitor with side effects that depend on visit order -- the traversal order becomes a hidden contract. Document traversal order explicitly or make visitors order-independent.",
      "Too many visit methods -- a visitor with 50+ visit methods for 50 element types is unmaintainable. Use the Default Visitor pattern or consider a type-switch approach for large hierarchies.",
      "Breaking encapsulation through visitor -- visitors that reach into element internals create tight coupling. Elements should expose only the data needed for the visitor's operation via their public interface.",
    ],
    interviewDepth: [
      {
        question: "Why does Visitor use double dispatch, and how do AST compilers like TypeScript and Babel use it?",
        expectedAnswer: "Double dispatch is needed because the operation depends on BOTH the visitor type (what operation: type-check, emit, optimize) AND the element type (what node: FunctionDecl, BinaryExpr, Identifier). Single dispatch (virtual methods) resolves only one dimension. Visitor solves this: element.accept(visitor) dispatches on element type, then calls visitor.visitFunctionDecl(this) which dispatches on visitor type. TypeScript's compiler has a Checker visitor (type-checks all AST nodes), an Emitter visitor (generates JS from all AST nodes), and a Transformer visitor (applies transformations). All three traverse the same AST structure with different operations.",
        followUp: "How would you achieve double dispatch in a language like Python that does not have method overloading?",
      },
      {
        question: "Visitor violates Open/Closed Principle for new element types -- how do you mitigate this?",
        expectedAnswer: "Three mitigations: (1) Acyclic Visitor -- each visitor implements only interfaces for the element types it cares about. Adding a new element type does not break existing visitors (they simply do not visit the new type). (2) Default Visitor -- provides no-op implementations for all visit methods. New element types get a default no-op; only visitors that care about the new type need updating. (3) Reflection-based dispatch -- use a type map instead of the visitor pattern (Map<NodeType, Handler>). Adding a new type means adding one map entry. ESLint uses this approach for rule visitors.",
        followUp: "What is the Expression Problem, and how do Visitor and type classes each address one half of it?",
      },
      {
        question: "Design a document export system using Visitor where the same document structure can be exported to HTML, PDF, and Markdown.",
        expectedAnswer: "Document elements: Heading, Paragraph, Image, CodeBlock, Table -- each implements accept(visitor). Three visitors: HTMLExportVisitor (generates <h1>, <p>, <img> tags), PDFExportVisitor (uses a PDF library to render each element), MarkdownExportVisitor (generates #, plain text, ![alt](url)). Each visitor accumulates output in a string buffer. Adding a new export format (e.g., LaTeX) means one new visitor class, zero changes to document elements. Adding a new element type (e.g., Footnote) requires adding visitFootnote() to all three visitors.",
        followUp: "How would you handle nested structures like a Table containing Paragraphs?",
      },
    ],
  },

  interpreter: {
    complexityAnalysis: `**Time Complexity:** O(n) for interpreting an expression tree where n = number of nodes. Each node's interpret() is called once.
**Space Complexity:** O(n) for the expression tree itself + O(d) call stack depth.
**Grammar complexity:** Works well for simple grammars (fewer than 20-30 rules). For complex grammars, the class count explodes -- use parser generators (ANTLR, PEG.js, tree-sitter) instead. Rule of thumb: if the grammar fits on one page, Interpreter works; if it needs a spec document, use a parser generator.`,
    designRationale: `Interpreter represents a grammar as a class hierarchy where each rule is a class. Terminal expressions handle leaf values, non-terminal expressions compose them via the Composite pattern. The key design decision is mapping grammar rules to classes, making the language extensible by adding new expression classes. Real-world examples: regular expressions (regex engines internally build an expression tree of Literal, Alternation, Repetition, Group nodes), SQL WHERE clauses (parsed into an expression tree of AND, OR, comparison nodes), template engines (Handlebars/Mustache parse templates into ASTs of Text, Variable, Block nodes), and mathematical expression evaluators (calculator apps). Tradeoff: only practical for simple languages -- complex grammars create too many classes. Modern alternatives include parser combinators (Parsec, nom) and parser generators (ANTLR, PEG). Interpreter is valuable in LLD for building DSLs (domain-specific languages), rule engines, feature flag evaluators, and expression evaluators.`,
    commonVariations: [
      "Recursive Descent Parser (hand-written top-down parser that mirrors the grammar -- each grammar rule is a method. Used by V8's JavaScript parser and early GCC.)",
      "Regex as Interpreter (regex engines build an NFA/DFA from a pattern -- each regex operator (*, +, ?, |) is an expression node. The pattern 'a(b|c)*d' becomes a tree of Literal, Alternation, Repetition.)",
      "SQL WHERE Clause Parser (parse 'age > 18 AND (status = active OR role = admin)' into an expression tree for query evaluation)",
      "Template Engine (parse '{{#if user}}Hello {{user.name}}{{/if}}' into an AST of Text, Variable, Conditional, Loop nodes -- Handlebars, Mustache, Jinja2)",
      "Rule Engine / Feature Flag Evaluator (interpret business rules like 'country IN (US, UK) AND plan = premium' for feature gating)",
      "Mathematical Expression Evaluator (parse and evaluate '3 + 4 * 2 / (1 - 5)^2' with proper operator precedence via expression tree)",
    ],
    antiPatterns: [
      "Interpreter for complex grammars -- a full programming language grammar has hundreds of rules. Each rule as a class creates unmaintainable class explosion. Use ANTLR/PEG/tree-sitter for grammars with more than 30 rules.",
      "Interpreter in performance-critical paths -- tree traversal with virtual dispatch is slow. Hot paths should compile expressions to bytecode or use a JIT. Regex engines compile to DFA for this reason.",
      "Non-tree grammars -- Interpreter assumes a tree structure (Composite pattern). Grammars with cycles, back-references, or context-sensitive rules (like C++ parsing) do not fit the pattern.",
      "Interpreter without a clear grammar specification -- jumping into code without formally defining the grammar leads to ambiguous parsing and inconsistent behavior. Always write the grammar in BNF/EBNF first.",
    ],
    interviewDepth: [
      {
        question: "When is Interpreter practical vs when should you use a parser generator like ANTLR?",
        expectedAnswer: "Interpreter is practical for simple DSLs with fewer than 20 rules: boolean expressions for access control, arithmetic calculators, template engines, feature flag rules. The grammar is simple enough that each rule maps to one class. Use a parser generator when: the grammar has 50+ rules (SQL, JavaScript), you need error recovery and good error messages, you need to handle operator precedence and associativity automatically, or you need a lexer/tokenizer. ANTLR generates both lexer and parser from a grammar file, handles ambiguity, and produces a parse tree automatically.",
        followUp: "How does a parser combinator (like Parsec or nom) compare to both Interpreter and parser generators?",
      },
      {
        question: "How does regex relate to the Interpreter pattern?",
        expectedAnswer: "A regex engine IS an Interpreter. The regex pattern 'a(b|c)*d' is parsed into an expression tree: Sequence(Literal('a'), Repetition(Alternation(Literal('b'), Literal('c'))), Literal('d')). Each node has an interpret/match method. Terminal expressions are Literal and CharacterClass. Non-terminal expressions are Sequence, Alternation, Repetition, Group. The context is the input string with a current position. The engine traverses the tree, matching against the input. NFA/DFA compilation is an optimization over naive tree interpretation.",
        followUp: "Why do production regex engines compile to NFA/DFA instead of interpreting the expression tree directly?",
      },
      {
        question: "Design a feature flag rule engine using Interpreter that evaluates rules like 'country IN (US, UK) AND (plan = premium OR beta_tester = true)'.",
        expectedAnswer: "Expression interface with evaluate(context: UserContext): boolean. Terminal expressions: ComparisonExpr (field, operator, value -- handles =, >, <), InExpr (field, values[] -- handles IN). Non-terminal: AndExpr(left, right), OrExpr(left, right), NotExpr(expr). Parser converts rule string to expression tree. Evaluate against UserContext with user attributes. Adding a new operator (e.g., CONTAINS) means one new TerminalExpression class. The same tree structure can be serialized to JSON for storage and deserialized for evaluation.",
        followUp: "How would you add support for nested field access like 'user.subscription.plan = premium'?",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  MODERN PATTERNS
  // ════════════════════════════════════════════════════════════

  repository: {
    complexityAnalysis: `**Time Complexity:** Depends on the underlying data store. find/save/delete are typically O(1) for key-based operations, O(n) for scans. The Repository pattern itself adds O(1) overhead (delegation).
**Space Complexity:** O(1) for the Repository object. The data store's space complexity depends on the implementation (SQL, NoSQL, in-memory).
**Abstraction benefit:** Switching from PostgreSQL to MongoDB requires changing only the concrete repository implementation -- zero changes to business logic. This also enables InMemoryRepository for unit tests that run in milliseconds without a database.
**Query complexity:** Simple CRUD is O(1) through the repository. Complex queries (joins, aggregations) may require Specification pattern or dedicated query methods. The repository should not expose raw query language.`,
    designRationale: `Repository abstracts data access behind a collection-like interface, decoupling business logic from persistence technology. Without it, services contain raw SQL queries scattered across business logic, making them impossible to test without a database and tightly coupled to the data store. The key design decision is defining the repository interface in terms of the domain (find, save, delete with domain objects) rather than in terms of the database (SELECT, INSERT, DELETE with rows). This enables the Persistence Ignorance principle -- domain objects do not know how they are stored. Real-world examples: Spring Data JPA (JpaRepository<T, ID> provides findById, save, delete with automatic query generation from method names), Django ORM (Model.objects is essentially a repository), and TypeORM's Repository<Entity>. In DDD, there should be one Repository per Aggregate Root -- the repository is the gateway to the aggregate. Tradeoff: an extra layer of indirection, and complex queries may not map cleanly to the simple repository interface (the "impedance mismatch" between domain model and relational schema).`,
    commonVariations: [
      "Generic Repository (Repository<T> with CRUD operations parameterized by entity type -- Spring Data's JpaRepository<T, ID>, TypeORM's Repository<Entity>)",
      "Specification-based Repository (pass Specification objects for complex queries -- findAll(spec) where spec encapsulates WHERE clauses. Enables composable, reusable query logic.)",
      "Unit of Work + Repository (repositories share a Unit of Work that tracks changes and commits them as a single transaction -- Entity Framework's DbContext pattern)",
      "CQRS with Separate Read/Write Repositories (write repository uses normalized model for consistency, read repository uses denormalized model for performance)",
      "Aggregate Repository (one repository per DDD aggregate root -- OrderRepository loads the entire Order aggregate including OrderItems, never loads OrderItem independently)",
      "In-Memory Repository (implements the same interface using a Map/Array -- used for unit testing without database setup. Runs in microseconds instead of milliseconds.)",
    ],
    antiPatterns: [
      "Generic Repository that leaks ORM queries -- exposing IQueryable<T> or QueryBuilder through the repository interface lets callers write arbitrary queries, defeating the abstraction. The repository should return domain objects, not query builders.",
      "Repository with business logic -- repositories should only handle persistence, not validate business rules. If UserRepository.save() checks password strength, you have mixed concerns. Business rules belong in domain services.",
      "Exposing IQueryable/QueryBuilder -- giving callers access to the ORM's query interface means the repository is just a pass-through. Every caller now depends on the ORM directly, making it impossible to swap implementations.",
      "God Repository -- one repository for all entity types violates SRP. In DDD, each Aggregate Root gets its own repository. UserRepository should not have methods for Orders.",
    ],
    interviewDepth: [
      {
        question: "How does Repository differ from DAO (Data Access Object)?",
        expectedAnswer: "Repository operates at the DOMAIN level -- it speaks in terms of Aggregate Roots and domain objects (OrderRepository.findByCustomer(customer)). DAO operates at the PERSISTENCE level -- it speaks in terms of tables, rows, and SQL (OrderDAO.executeQuery('SELECT * FROM orders WHERE customer_id = ?')). Repository often uses a DAO internally. Repository is a DDD concept; DAO is a data-access infrastructure concept. A Repository returns fully hydrated domain objects; a DAO may return raw result sets or DTOs.",
        followUp: "Can you use both Repository and DAO in the same project? When would that make sense?",
      },
      {
        question: "Why do some architects argue against Generic Repository<T>?",
        expectedAnswer: "Generic Repository provides the same interface (findById, save, delete) for all entities, but: (1) Not all entities need all operations -- Product might not support delete, but Generic Repository exposes it. Violates Interface Segregation. (2) It discourages domain-specific query methods -- developers use generic findAll() with filters instead of meaningful methods like findActiveOrdersByCustomer(). (3) It often leaks ORM concerns through generic query parameters. Better approach: specific repositories per aggregate root with domain-meaningful methods. Spring Data works around this by allowing custom query methods via method naming conventions.",
        followUp: "How does Spring Data JPA's approach of deriving queries from method names address some of these concerns?",
      },
      {
        question: "Design a Repository for an e-commerce Order aggregate that supports both PostgreSQL and DynamoDB.",
        expectedAnswer: "OrderRepository interface: save(order), findById(id), findByCustomerId(customerId), findByStatus(status). The Order aggregate includes Order + OrderItems + ShippingAddress (always loaded together). PostgresOrderRepository uses SQL JOINs to load the full aggregate. DynamoOrderRepository uses a single-table design where Order, Items, and Address are stored as items with the same partition key. InMemoryOrderRepository uses a Map<string, Order> for testing. The service layer depends only on OrderRepository interface -- swapping implementations requires only changing the DI configuration.",
        followUp: "How would you handle the case where you need a complex query (e.g., orders placed in the last 30 days with total > $100) that does not fit the repository interface?",
      },
    ],
  },

  cqrs: {
    complexityAnalysis: `**Time Complexity:** Write path: O(1) command dispatch + O(handler) domain logic + O(projection) async read-model update. Read path: O(1) denormalized query against optimized read store (Elasticsearch, Redis, DynamoDB). Command validation is O(v) where v = invariants to check.
**Space Complexity:** O(2n) -- data duplicated across write model (normalized) and read model (denormalized). Each additional query shape can require its own read model, scaling to O(n * r) for r read models.
**Eventual consistency window:** Read model lags by projection delay -- typically 50-200ms with Kafka/RabbitMQ, up to seconds under load. Per-command sync cost: serialize event, publish to broker, consume, project to read store.
**Infrastructure overhead:** Requires message broker (Kafka, RabbitMQ), potentially separate databases (PostgreSQL writes, Elasticsearch/Redis reads), and projection workers with consumer-lag monitoring.`,
    designRationale: `CQRS recognizes that reads and writes have fundamentally different optimization profiles -- writes need strong consistency, validation, and normalization, while reads need speed, denormalization, and flexible query shapes. By separating them, each side scales independently: the write model can use normalized PostgreSQL with strict integrity constraints, while the read model uses Elasticsearch for full-text search, Redis for low-latency lookups, or multiple denormalized projections per query shape. The synchronization mechanism is typically domain events published through Kafka or RabbitMQ. The CAP theorem trade-off is explicit: CQRS favors availability and partition tolerance on the read side at the cost of strong consistency. Teams adopting CQRS must invest in eventual-consistency-aware UI patterns (optimistic updates, version-gated reads, push notifications on projection completion) and robust monitoring of projection lag.`,
    commonVariations: [
      "Simple CQRS (separate read/write interfaces, same database -- lowest complexity, good starting point)",
      "Full CQRS (separate read and write databases with event-based sync via Kafka or RabbitMQ)",
      "CQRS + Event Sourcing (write model stores events in EventStoreDB, read model is a projection -- used at Walmart, ING Bank)",
      "CQRS with materialized views (database-level projections -- PostgreSQL materialized views, Cassandra)",
      "MediatR-style CQRS (in-process command/query dispatch via mediator -- ASP.NET, NestJS CQRS module)",
      "Multi-read-model CQRS (one write model feeds multiple read stores for different query patterns -- search, reporting, dashboards)",
    ],
    antiPatterns: [
      "CQRS for simple CRUD -- if read and write models are identical with no scaling asymmetry, the infrastructure overhead is unjustified",
      "Synchronous projections -- updating the read model in the same transaction as the write defeats the decoupling purpose and couples read/write scaling",
      "Ignoring eventual consistency in the UI -- assuming the read model reflects the latest write leads to confusing \'I just submitted but my data is missing\' experiences",
      "Bidirectional sync -- both models writing back to each other creates infinite loops, data conflicts, and split-brain scenarios",
    ],
    interviewDepth: [
      {
        question: "When should you NOT use CQRS?",
        expectedAnswer: "When the domain is simple CRUD with no significant read/write asymmetry. When strong consistency is required everywhere (e.g., financial ledger where reads must reflect the latest write). When the team lacks experience with eventual consistency and distributed debugging. CQRS only pays for itself when read/write ratio is heavily skewed (100:1+), different query shapes are needed, or read/write sides must scale independently.",
        followUp: "How does CQRS relate to Event Sourcing? Can you use one without the other?",
      },
      {
        question: "How do you handle the eventual consistency problem in CQRS?",
        expectedAnswer: "Production-proven approaches: (1) Read-your-own-writes -- after a command, the submitting user reads from the write model for the next request (used at LinkedIn). (2) Version-gated reads -- UI sends expected version from the command response, read side returns data only if version >= expected. (3) Push updates via WebSocket/SSE when projection completes (used at Slack). (4) Optimistic UI -- immediately update client state and reconcile when projection catches up (used at Meta).",
        followUp: "What happens if the projection consumer crashes mid-update? How do you ensure exactly-once projection processing?",
      },
      {
        question: "You have a system with 10,000 writes/sec and 1,000,000 reads/sec. How would you design the CQRS read side?",
        expectedAnswer: "Read side must handle 100x write throughput. Use multiple read replicas behind a load balancer. Denormalized read store optimized per query pattern -- Redis for key-value lookups, Elasticsearch for search, DynamoDB for high-throughput point reads. Projections consume events from Kafka with multiple consumer partitions for parallel processing. Monitor consumer group lag to detect projection falling behind. If lag grows, scale projection workers horizontally. Consider read-through caching to handle spikes beyond read-store capacity.",
      },
    ],
  },

  "event-sourcing": {
    complexityAnalysis: `**Time Complexity:** O(e) to reconstruct current state from e events (full replay). O(1) to append a new event (append-only write). With snapshots: O(1) snapshot load + O(delta) for events since snapshot. Kafka-based implementations achieve millions of appends/sec.
**Space Complexity:** O(e) -- all events stored forever (append-only log). For a bank account with 10 transactions/day over 10 years = ~36,500 events per account. Storage grows linearly; archiving cold events to S3/Glacier is standard practice.
**Query complexity:** Direct queries against the event store require full replay -- O(e) per entity. This is why Event Sourcing almost always pairs with CQRS: events drive read-model projections for efficient queries.
**Snapshot frequency:** Snapshot every N events (e.g., every 100) or every T time (e.g., daily). Tradeoff: more frequent snapshots = faster reads but more storage and snapshot-creation overhead.`,
    designRationale: `Event Sourcing stores state changes (events) rather than current state, making the event log the single source of truth. The key insight is that events are immutable facts -- they represent what happened and cannot be retroactively changed. This provides a complete audit trail (critical for finance, healthcare, compliance), enables temporal queries ("what was the account balance at 3pm on March 5th?"), supports event replay for debugging production issues, and allows rebuilding read models from scratch when requirements change. Kafka is the most common event store in practice (LinkedIn, Uber, Netflix), though specialized stores like EventStoreDB provide built-in projections and subscriptions. The CAP trade-off: Event Sourcing with async projections favors availability and partition tolerance over immediate consistency. Strong consistency can be achieved per-aggregate by using optimistic concurrency on the event stream version. The fundamental tradeoff is operational complexity: event schema versioning, snapshot management, and projection infrastructure require significant investment.`,
    commonVariations: [
      "Event Store + Snapshots (periodic snapshots to avoid replaying entire history -- EventStoreDB, Marten, Axon Framework)",
      "Event Sourcing + CQRS (events drive read-model projections -- the dominant production pattern, used at Walmart, ING Bank, Uber)",
      "Event Sourcing with Event Versioning/Upcasting (schema evolution via upcasters that transform old event formats during replay)",
      "Event Sourcing for audit trail (append-only log for compliance without full ES architecture -- used in banking, healthcare)",
      "Event Sourcing with Compaction (periodically collapse old events into a summary event -- reduces storage while preserving recent history)",
      "Event Sourcing + CDC (Change Data Capture from traditional DB into event stream via Debezium -- gradual migration path)",
    ],
    antiPatterns: [
      "Mutable events -- modifying or deleting stored events destroys the audit trail and breaks downstream projections that already processed the original",
      "No snapshots for long-lived aggregates -- replaying 100,000+ events on every load causes unacceptable latency (snapshot every 100-500 events)",
      "Treating events as commands -- events describe what HAPPENED (past tense: OrderPlaced), not what SHOULD happen (imperative: PlaceOrder). Confusing them creates circular dependencies",
      "Breaking event schema backward compatibility -- changing an event\'s field types or removing fields without an upcaster breaks all existing events in the store",
    ],
    interviewDepth: [
      {
        question: "How does Event Sourcing handle schema evolution?",
        expectedAnswer: "Event upcasting: when reading old events, a chain of upcasters transforms them to the current schema version. Each event carries a schema version number. The event handler applies upcasters sequentially (v1->v2->v3) during replay. Alternatively, use a flexible schema (JSON with optional fields and defaults). For breaking changes, publish a new event type alongside the old one and migrate projections. EventStoreDB and Axon Framework have built-in upcaster support.",
        followUp: "What happens if you need to delete events for GDPR compliance when events are supposed to be immutable?",
      },
      {
        question: "Event Sourcing vs Event-Driven Architecture -- are they the same thing?",
        expectedAnswer: "No. Event-Driven Architecture (EDA) is about communication -- services publish and subscribe to events via a message broker (Kafka, RabbitMQ) for loose coupling. Event Sourcing is about persistence -- the event log IS the source of truth for state, not just a communication channel. You can have EDA without ES (services communicate via events but store state in regular databases). You can have ES without EDA (a single service stores its state as events but does not publish them externally). They complement each other well: ES produces the events, EDA distributes them.",
        followUp: "How would you migrate an existing CRUD system to Event Sourcing incrementally?",
      },
      {
        question: "A bank account aggregate has 50,000 events. How do you optimize read performance?",
        expectedAnswer: "Three strategies: (1) Snapshots -- store the aggregate state every 100-500 events, load snapshot + replay only events since snapshot. (2) CQRS projections -- maintain a denormalized read model (account balance, transaction history) updated asynchronously from events. Queries hit the read model, not the event store. (3) Event archiving -- move events older than N days to cold storage (S3), keep only recent events + latest snapshot in the hot store. For the bank account: snapshot every 500 events = max 500 replays instead of 50,000.",
      },
    ],
  },

  saga: {
    complexityAnalysis: `**Time Complexity:** O(s) for a saga with s steps executing sequentially. Compensation is O(c) where c = completed steps to compensate in reverse order. End-to-end latency = sum of all step latencies + inter-service communication overhead.
**Space Complexity:** O(s) for saga state (step status, correlation IDs) + O(log entries) for the saga log. Each step must store enough context for its compensating action (e.g., the payment ID to issue a refund).
**Failure modes:** Single failure: compensate completed steps in reverse. Double failure (compensation fails): saga enters "stuck" state requiring manual intervention -- the saga log plus dead-letter queues are essential for ops teams to diagnose and resolve. Network partitions can cause "zombie" steps that executed but whose acknowledgment was lost.
**Distributed tracing:** Without distributed tracing (Jaeger, Zipkin), debugging a failed saga across 5+ microservices is nearly impossible. Correlation IDs must propagate through every step.`,
    designRationale: `Saga replaces distributed transactions (2PC) with a sequence of local transactions, each with a compensating action. In a microservices architecture, each service owns its database, making traditional ACID transactions across service boundaries impossible. Two-phase commit (2PC) locks resources across services and is both slow and fragile -- a single coordinator failure blocks all participants. Saga accepts eventual consistency and provides rollback through compensation rather than locking. The orchestration variant (used at Uber for ride matching, Airbnb for booking) centralizes control in a saga coordinator; the choreography variant (used at Shopify for order processing) distributes control through event chains. The CAP trade-off: Saga sacrifices immediate consistency for availability and partition tolerance. Semantic locks (reservations) can provide a form of isolation without distributed locks. The fundamental challenge is that compensation is not true rollback -- it is a new forward action that may itself fail, requiring careful design of compensating actions and dead-letter queue monitoring.`,
    commonVariations: [
      "Orchestration Saga (central orchestrator drives step execution and compensation -- Uber Cadence/Temporal, AWS Step Functions, Netflix Conductor)",
      "Choreography Saga (each service publishes events that trigger the next -- no coordinator, more decoupled but harder to debug)",
      "Saga with Saga Log (persistent audit trail of all step executions, compensations, and failures -- essential for production debugging)",
      "Saga with timeout / deadline (steps have SLA deadlines -- if exceeded, compensation begins automatically, prevents indefinite hanging)",
      "Parallel Saga (independent steps execute concurrently via fan-out, dependent steps sequential -- reduces total latency)",
      "Nested Saga (a saga step is itself a sub-saga -- used for complex multi-level workflows like travel booking with flight + hotel + car)",
    ],
    antiPatterns: [
      "Ignoring compensation failures -- if a compensating action fails, the system enters an inconsistent state; must have dead-letter queues, alerting, and manual resolution runbooks",
      "Saga for local transactions -- if all operations are in the same database, use a regular ACID transaction; saga overhead is unjustified",
      "No saga log -- without persistent logging of step status and compensations, diagnosing failed sagas in production is nearly impossible",
      "Non-idempotent steps -- network retries and at-least-once delivery mean steps may execute more than once; every step and compensation must be idempotent (use idempotency keys)",
    ],
    interviewDepth: [
      {
        question: "In a 5-step saga, if step 3 fails, what happens?",
        expectedAnswer: "Steps 1 and 2 have committed their local transactions. Step 3 failed, so its action was never committed. Compensation runs in REVERSE order: step 2\'s compensate() (e.g., release inventory reservation), then step 1\'s compensate() (e.g., refund payment). Steps 4 and 5 never started, so no compensation needed. The saga log records each compensation for audit. If step 2\'s compensation also fails, the saga enters a \'stuck/failed\' state -- the dead-letter queue captures the failure, ops gets alerted, and manual resolution is required.",
        followUp: "How do you handle \'zombie\' steps where the action executed but the acknowledgment was lost due to a network partition?",
      },
      {
        question: "Compare orchestration vs choreography sagas with real-world examples.",
        expectedAnswer: "Orchestration (Uber ride matching, Airbnb booking): central coordinator (Temporal/Cadence workflow) calls each service, handles failures, runs compensation. Advantages: clear flow visualization, centralized error handling, easier debugging via workflow UI. Disadvantages: coordinator is a single point of failure, tight coupling to coordinator framework. Choreography (Shopify order processing): each service reacts to events from the previous service via Kafka. Advantages: no single point of failure, services are fully decoupled, scales naturally. Disadvantages: flow is implicit (must reconstruct from logs), debugging requires distributed tracing, adding a step means modifying event subscriptions across services. Rule of thumb: orchestration for sagas with 4+ steps or complex branching; choreography for simple 2-3 step linear flows.",
        followUp: "How does Temporal/Cadence handle saga compensation differently from a hand-rolled orchestrator?",
      },
      {
        question: "Design a saga for an e-commerce order that coordinates payment, inventory, and shipping.",
        expectedAnswer: "OrderSaga orchestrator manages three steps: (1) PaymentService.charge(orderId, amount) -- compensate: PaymentService.refund(paymentId). (2) InventoryService.reserve(orderId, items) -- compensate: InventoryService.release(reservationId). (3) ShippingService.schedule(orderId, address) -- compensate: ShippingService.cancel(shipmentId). Each step returns a correlation ID used by its compensating action. The saga log persists step status. Idempotency keys prevent duplicate charges/reservations on retry. Timeouts on each step trigger compensation if a service is unresponsive. Dead-letter queue captures compensation failures for manual resolution.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  RESILIENCE PATTERNS
  // ════════════════════════════════════════════════════════════

  "circuit-breaker": {
    complexityAnalysis: `**Time Complexity:** O(1) per call -- state check (atomic read of enum) + delegate or fail-fast. Sliding window update is O(1) amortized (increment counter, decrement expired entries).
**Space Complexity:** O(w) where w = sliding window size for tracking recent call outcomes. Count-based: O(1) counter. Time-based: O(w) ring buffer of timestamped results.
**State machine:** Three states: Closed (normal operation, tracking failures) -> Open (fail-fast, reject all calls) -> Half-Open (probe with limited calls). Transitions driven by failure threshold (Closed->Open), cooldown timer (Open->Half-Open), and probe result (Half-Open->Closed or Half-Open->Open).
**Latency impact:** In Open state, calls fail in microseconds instead of waiting for timeout (typically 5-30 seconds). This is the core value -- converting slow failures into fast failures.`,
    designRationale: `Circuit Breaker prevents cascade failures in distributed systems. Without it, every call to a failing downstream service blocks waiting for a timeout, consuming threads and connections until the calling service itself crashes -- this cascade can take down an entire microservices fleet in seconds. Netflix popularized the pattern with Hystrix after experiencing production cascades. The circuit breaker "trips" after detecting a threshold of failures, immediately rejecting subsequent calls (fail-fast) instead of accumulating blocked threads. After a cooldown period, it enters half-open state and allows limited probe calls to test if the downstream service recovered. The key design decisions are: (1) threshold sensitivity (too low = false positives during normal error rates, too high = slow to protect), (2) cooldown duration (too short = hammering a recovering service, too long = unnecessary downtime), (3) fallback behavior (cached data, default response, or graceful degradation). Modern implementations (Resilience4j, Polly, Istio service mesh) integrate circuit breaking with metrics, dashboards, and alerting.`,
    commonVariations: [
      "Count-based Circuit Breaker (trips after N failures in last M calls -- simple but sensitive to call volume)",
      "Time-based / Sliding Window Circuit Breaker (trips when failure rate exceeds threshold in a time window -- Netflix Hystrix, Resilience4j default)",
      "Per-endpoint Circuit Breaker (separate circuit per downstream endpoint -- prevents one bad endpoint from blocking healthy ones)",
      "Half-open with gradual ramp-up (allow 1, then 2, then 4 probe calls before fully closing -- Resilience4j SlowCallRateThreshold)",
      "Circuit Breaker + Retry (retry within closed state, fail-fast in open state -- Polly PolicyWrap, Resilience4j decorator chain)",
      "Service mesh Circuit Breaker (Istio/Envoy outlier detection -- infrastructure-level circuit breaking without application code changes)",
    ],
    antiPatterns: [
      "Single circuit for all endpoints -- one failing endpoint trips the circuit for all healthy endpoints; always use per-endpoint or per-operation circuits",
      "No fallback strategy -- rejecting calls in open state without providing cached data, default responses, or graceful degradation leaves users with raw errors",
      "Circuit breaker on local/in-process calls -- circuit breaking adds overhead and complexity; it is designed for network calls with timeout risk, not local function calls",
      "No monitoring or alerting on state transitions -- if the circuit trips in production and nobody is notified, the team cannot investigate the root cause or assess blast radius",
    ],
    interviewDepth: [
      {
        question: "How did Netflix implement Circuit Breaker with Hystrix, and what replaced it?",
        expectedAnswer: "Netflix Hystrix wrapped every inter-service call in a HystrixCommand with a circuit breaker, thread pool isolation (bulkhead), timeout, and fallback. The circuit tracked failure rates in a 10-second rolling window; if failures exceeded the threshold (default 50%), it tripped open for 5 seconds, then half-open for one probe. Hystrix Dashboard provided real-time visualization. Hystrix entered maintenance mode in 2018; Resilience4j replaced it for Java (lighter weight, functional composition, no thread pool overhead by default). In the service mesh era, Istio/Envoy provide circuit breaking at the infrastructure level via outlier detection.",
        followUp: "What are the trade-offs between application-level circuit breaking (Resilience4j) and infrastructure-level (Istio outlier detection)?",
      },
      {
        question: "Circuit Breaker vs Retry -- when do you combine them, and in what order?",
        expectedAnswer: "Retry handles transient failures (brief glitches that succeed on retry). Circuit Breaker handles sustained failures (service is down or degraded). Combine them: Retry wraps the inner call (retry 2-3 times with backoff), Circuit Breaker wraps the Retry (if retried calls keep failing, trip the circuit). Order matters: CircuitBreaker(Retry(call)). Never retry when the circuit is open -- that defeats the fail-fast purpose. In Resilience4j: Decorators.ofSupplier(supplier).withRetry(retry).withCircuitBreaker(cb).get(). The circuit breaker counts a retried-and-still-failed call as one failure, not N failures.",
        followUp: "How do you prevent retry storms when multiple callers simultaneously retry against a recovering service?",
      },
      {
        question: "Your monitoring shows the circuit breaker is flapping (rapidly opening and closing). What do you investigate?",
        expectedAnswer: "Flapping indicates the downstream service is intermittently failing -- healthy enough to pass half-open probes but not stable. Investigation: (1) Check downstream service health metrics (CPU, memory, error rates, latency percentiles). (2) Review the circuit breaker configuration -- threshold may be too sensitive (increase failure threshold) or cooldown too short (increase to give the service more recovery time). (3) Check for a subset of bad instances behind a load balancer (one unhealthy pod). (4) Consider adding a slow-call-rate threshold to detect latency degradation, not just errors. (5) Add gradual ramp-up in half-open state instead of binary open/close.",
      },
    ],
  },

  bulkhead: {
    complexityAnalysis: `**Time Complexity:** O(1) for semaphore acquire/release (atomic CAS operation). Thread pool bulkhead: O(1) for task submission to the pool\'s queue.
**Space Complexity:** O(p * t) where p = number of partitions and t = threads per partition (for thread pool bulkhead). Semaphore bulkhead: O(p) with O(1) per partition (just an atomic counter).
**Isolation guarantee:** Failure in one bulkhead partition cannot consume resources from other partitions. Thread pool isolation is strongest (completely separate thread stacks); semaphore isolation is weakest (shared thread pool, only limits concurrency count).
**Sizing formula:** For I/O-bound calls: permits = (target_latency / actual_p99_latency) * desired_throughput. For thread pools: size = (p99_latency_ms / 1000) * target_rps_per_service. Over-provisioning wastes memory; under-provisioning causes queuing and request rejection.`,
    designRationale: `Bulkhead borrows from ship design: watertight compartments ensure a breach in one compartment does not sink the entire ship. In distributed systems, one slow or failing downstream service can monopolize all available threads/connections, causing the calling service to become unresponsive to ALL requests -- not just those to the failing service. AWS experienced this in their 2012 outage where a single misbehaving dependency consumed all threads in the calling service. Bulkhead isolates resources into partitions so that a slow service only consumes its allocated share. Netflix Hystrix popularized thread pool bulkheads; Resilience4j supports both thread pool and semaphore variants. The key architectural decision is the isolation level: thread pool (strongest, but each pool consumes memory -- ~1MB per thread stack), semaphore (lightweight, shares thread pool but limits concurrent access), or process/container level (Kubernetes resource limits, strongest but coarsest). In the service mesh era, Envoy connection pool limits provide infrastructure-level bulkheading without application code changes.`,
    commonVariations: [
      "Thread Pool Bulkhead (separate thread pool per downstream service -- strongest isolation, used by Netflix Hystrix; each pool ~10-20 threads, ~1MB stack each)",
      "Semaphore Bulkhead (shared thread pool with concurrency permits per partition -- Resilience4j default, lighter weight, no thread context-switch overhead)",
      "Connection Pool Bulkhead (separate HTTP/DB connection pools per downstream service -- prevents connection starvation, standard in JDBC DataSource configuration)",
      "Process-level / Container Bulkhead (separate pods/containers per workload -- Kubernetes resource limits, AWS ECS task definitions, strongest isolation at infrastructure level)",
      "Bulkhead + Circuit Breaker (bulkhead limits concurrency, circuit breaker handles sustained failures -- combined pattern in Resilience4j and Polly)",
      "Priority-based Bulkhead (allocate more resources to critical paths, fewer to background tasks -- ensures premium traffic gets served even under load)",
    ],
    antiPatterns: [
      "Under-partitioned bulkhead -- too few partitions means a slow service still impacts others sharing the same partition; partition per downstream dependency minimum",
      "Over-partitioned bulkhead -- too many thread pool partitions wastes resources on idle threads; a service calling 20 downstream services does not need 20 dedicated thread pools (group by criticality)",
      "Bulkhead without monitoring -- if a partition consistently rejects requests (queue full), the team needs alerts to investigate the downstream service or resize the partition",
      "Sizing based on average latency -- use p99 latency for sizing; a service with 50ms average but 5s p99 will exhaust its bulkhead during tail-latency spikes",
    ],
    interviewDepth: [
      {
        question: "How does Kubernetes implement Bulkhead at the infrastructure level?",
        expectedAnswer: "Kubernetes provides bulkheading through resource limits (CPU/memory requests and limits per pod), separate Deployments per workload (each with its own replica set), and network policies (isolating traffic between namespaces). A noisy-neighbor pod that exhausts its CPU limit gets throttled without affecting pods on the same node. For stronger isolation, use separate node pools (dedicated nodes per workload) or namespace-level ResourceQuotas. AWS Fargate provides task-level isolation. The key advantage over application-level bulkheads: no code changes needed, and isolation extends to all resources (CPU, memory, network, disk I/O), not just threads.",
        followUp: "When would you still need application-level bulkheads (Resilience4j) in addition to Kubernetes resource limits?",
      },
      {
        question: "Bulkhead vs Rate Limiter -- both limit resource consumption. What is the difference?",
        expectedAnswer: "Rate Limiter limits the RATE of requests over time (e.g., 100 requests/second) -- it protects the server from being overwhelmed by too many requests. Bulkhead limits CONCURRENT access to a resource (e.g., max 10 simultaneous calls to Service X) -- it protects the caller from a slow dependency consuming all its resources. Rate Limiter counts requests per time window; Bulkhead counts in-flight requests at any instant. You can hit the rate limit with fast requests; you hit the bulkhead limit with slow requests. Use Rate Limiter to protect your service FROM callers; use Bulkhead to protect your service from ITS dependencies.",
        followUp: "How would you combine Bulkhead, Circuit Breaker, and Retry for a single downstream call?",
      },
      {
        question: "Your service calls 5 downstream services. One of them starts responding with 10x normal latency. Without bulkheading, what happens?",
        expectedAnswer: "Without bulkheading, threads pile up waiting for the slow service. If your service has 200 threads total and the slow service holds each thread for 10 seconds instead of 1 second, 10x more threads are consumed by that service at any given time. Eventually all 200 threads are waiting on the slow service, leaving zero threads for the 4 healthy services. Your entire service becomes unresponsive -- not just for calls to the slow service, but for ALL traffic. With a bulkhead limiting the slow service to 20 concurrent threads, the remaining 180 threads continue serving the other 4 healthy services. This is the \'bulkhead prevents total-ship sinking\' analogy in action.",
      },
    ],
  },

  retry: {
    complexityAnalysis: `**Time Complexity:** O(r * t) where r = number of retries and t = time per attempt. With exponential backoff: total wait = base * (2^r - 1), e.g., 1s base, 4 retries = 1+2+4+8 = 15 seconds total wait. With jitter: same expected total but spread randomly to avoid synchronized retries.
**Space Complexity:** O(1) -- retry logic is stateless (counter + delay calculation). The retry policy itself (max retries, backoff params, retryable exceptions) is O(1) configuration.
**Retry budget / rate:** Google SRE recommends capping retries at 10% of total request volume. If a service sends 1000 requests/sec, at most 100 should be retries. This prevents retry amplification from overwhelming a recovering service.
**Idempotency requirement:** Safe retries require idempotent operations. For non-idempotent operations (payments, order creation), idempotency keys (client-generated UUID per operation) stored server-side are mandatory -- Stripe, AWS, and Google APIs all use this pattern.`,
    designRationale: `Retry handles transient failures -- temporary network glitches, brief service overloads, DNS timeouts, connection resets. The key insight is that many failures are transient: AWS reports that ~30% of service errors resolve within 1 second. The critical design decisions are: (1) WHICH failures to retry -- only transient ones (HTTP 500, 503, connection timeout); never retry permanent failures (400 Bad Request, 401 Unauthorized, 404 Not Found), (2) HOW MANY times -- bounded retries (3-5 max) to prevent infinite loops and retry storms, (3) HOW LONG to wait -- exponential backoff with jitter prevents the thundering herd problem where all clients retry simultaneously. The AWS SDK, gRPC, and Envoy all implement exponential backoff with full jitter as the default retry strategy. The fundamental tradeoff: retrying increases reliability for transient failures but adds latency (the caller waits longer), amplifies load on a struggling service (retries are additional requests), and risks duplicate side effects for non-idempotent operations.`,
    commonVariations: [
      "Fixed-delay Retry (constant wait between retries -- simple, predictable, but no thundering-herd mitigation)",
      "Exponential Backoff (double the delay: 1s, 2s, 4s, 8s -- standard in AWS SDK, gRPC, Azure SDK)",
      "Exponential Backoff with Full Jitter (delay = random(0, base * 2^attempt) -- AWS recommended, prevents correlated retries across clients)",
      "Exponential Backoff with Decorrelated Jitter (delay = random(base, previous_delay * 3) -- best spread per AWS Architecture Blog benchmarks)",
      "Retry with Circuit Breaker (stop retrying when circuit is open -- Polly PolicyWrap, Resilience4j decorator chain)",
      "Retry Budget (cap total retry rate at N% of traffic -- Google SRE practice, prevents retry amplification from overwhelming the downstream service)",
    ],
    antiPatterns: [
      "Retrying non-idempotent operations without idempotency keys -- charging a credit card twice is catastrophic; Stripe uses Idempotency-Key header, AWS uses ClientToken",
      "Retrying permanent failures -- retrying 400 Bad Request, 401 Unauthorized, or 404 Not Found wastes resources and never succeeds; classify errors into retryable vs non-retryable",
      "Unbounded retries -- retrying forever turns a transient failure into an infinite loop consuming resources; always set maxRetries (3-5 is typical)",
      "No backoff / immediate retry -- retrying instantly hammers the failing service, delays its recovery, and amplifies the outage (Google SRE calls this \'retry storm\')",
    ],
    interviewDepth: [
      {
        question: "How do you ensure retry safety for non-idempotent operations?",
        expectedAnswer: "Use idempotency keys: the client generates a unique UUID per logical operation and sends it with every request (including retries). The server stores a mapping of idempotency-key -> response. On receiving a request, the server checks: if the key exists, return the stored response without re-executing. If the key is new, execute the operation and store the result. This makes retries safe for any operation -- charging a payment, creating an order, sending a notification. Stripe, AWS, and Google APIs all use this pattern. Keys should have a TTL (typically 24-48 hours) to prevent unbounded storage.",
        followUp: "What happens if the server crashes between executing the operation and storing the idempotency key response?",
      },
      {
        question: "Why does AWS recommend full jitter over equal jitter for exponential backoff?",
        expectedAnswer: "Without jitter, all clients that failed at the same time retry at the same time (thundering herd). Equal jitter (delay = base * 2^attempt / 2 + random(0, base * 2^attempt / 2)) reduces correlation but still has a non-random floor. Full jitter (delay = random(0, base * 2^attempt)) produces the widest spread of retry times, maximally decorrelating clients. AWS Architecture Blog benchmarks show full jitter reduces total completion time by 2-3x compared to no jitter under contention. Decorrelated jitter (delay = random(base, previous_delay * 3)) performs even better in some scenarios because each client\'s delay sequence diverges further over successive retries.",
        followUp: "How do you prevent retry amplification in a multi-tier microservices architecture where each tier retries independently?",
      },
      {
        question: "Service A calls Service B calls Service C. Each has 3 retries. If C is down, how many total calls does C receive from a single user request?",
        expectedAnswer: "Without coordination: A retries B 3 times. Each B call retries C 3 times. Total calls to C = 3 (A retries) * 3 (B retries) = 9 calls from a single user request. This is retry amplification -- exponential in the number of tiers. With 4 tiers and 3 retries each: 3^3 = 27 calls. Mitigation: (1) Only retry at the outermost layer (A retries, B does not). (2) Use retry budgets -- cap retries at 10% of total traffic. (3) Propagate retry context in headers so inner services know not to retry. (4) Use a circuit breaker at B to fail-fast when C is down instead of retrying.",
      },
    ],
  },

  "rate-limiter": {
    complexityAnalysis: `**Time Complexity:** Token Bucket: O(1) tryAcquire -- check token count, decrement, done. Leaky Bucket: O(1) enqueue. Fixed Window Counter: O(1) increment and compare. Sliding Window Log: O(log n) insert into sorted set + O(n) to purge expired entries (where n = requests in window). Sliding Window Counter: O(1) weighted average of two counters.
**Space Complexity:** O(1) per limiter instance for Token Bucket (just a counter + timestamp). O(n) for Sliding Window Log (stores every request timestamp). O(c) total where c = distinct clients tracked.
**Distributed cost:** Centralized state (Redis INCR + EXPIRE or Lua script) adds ~1ms RTT per request. Stripe uses Token Bucket with Redis; Cloudflare uses a Sliding Window Counter at the edge.
**Real-world note:** Stripe's API rate limiter runs Token Bucket per API key with burst capacity of 25 and sustained rate of 100/sec. GitHub's API uses a Fixed Window of 5,000 requests per hour per authenticated user.`,
    designRationale: `Rate Limiter is the first line of defense against traffic spikes, abuse, and cascading failures. It protects downstream services by bounding the request rate at the edge. The core design decision is algorithm selection: Token Bucket tolerates bursts (ideal for bursty API traffic like mobile clients), while Sliding Window provides smoother rate enforcement (ideal for billing or metered APIs). Scope matters enormously -- per-user limits prevent a single bad actor from exhausting shared resources, while global limits protect the service from DDoS. The response strategy is equally critical: returning HTTP 429 with a Retry-After header and remaining-quota headers (X-RateLimit-Remaining) lets well-behaved clients back off gracefully. Tradeoff: distributed rate limiting with Redis adds ~1ms latency per request and introduces a dependency on the rate-limiting store; local in-memory limiters avoid this but cannot coordinate across instances, leading to over-admission by a factor of N (number of instances).`,
    commonVariations: [
      "Token Bucket (allows bursts up to bucket capacity, refills at steady rate -- Stripe, AWS API Gateway)",
      "Leaky Bucket (smooths traffic to a fixed output rate, queues excess -- used in network traffic shaping)",
      "Fixed Window Counter (count requests in fixed time windows -- simple but 2x burst at window boundary)",
      "Sliding Window Log (track exact timestamps in a sorted set -- precise but O(n) memory per client)",
      "Sliding Window Counter (weighted average of current and previous window counts -- Cloudflare's approach)",
      "Distributed Rate Limiter (Redis Lua script for atomic check-and-decrement across instances)",
    ],
    antiPatterns: [
      "Rate limiting without feedback -- returning 429 without Retry-After or X-RateLimit-Remaining headers forces clients to guess when to retry, causing thundering herd on recovery",
      "Same limits for all users -- treating free-tier and enterprise customers identically either under-protects or frustrates paying users; use tiered rate limits keyed by plan",
      "Client-side only rate limiting -- any client can be modified to bypass limits; always enforce server-side with client-side as a courtesy optimization",
      "Single Redis instance as rate limiter store -- creates a single point of failure; use Redis Cluster or local fallback with eventual consistency",
    ],
    interviewDepth: [
      {
        question: "Compare token bucket and sliding window algorithms -- when would you choose each?",
        expectedAnswer: "Token Bucket: tokens added at a fixed rate (e.g., 10/sec), each request consumes one token, bucket has a max capacity (e.g., 25) allowing bursts. O(1) per check. Best for APIs with bursty traffic (mobile clients, webhooks). Sliding Window Counter: keeps counts for current and previous fixed windows, computes a weighted average based on position within the current window. O(1) per check, smooth enforcement without burst spikes. Best for billing/metered APIs. Fixed Window is simplest but has the boundary problem -- a user can make 2x the limit by sending requests at the end of one window and start of the next.",
        followUp: "How would you implement distributed rate limiting across 50 API server instances?",
      },
      {
        question: "Design a rate limiter for Stripe's API that handles 100 requests/sec per API key with burst tolerance.",
        expectedAnswer: "Use a Token Bucket per API key stored in Redis. Bucket capacity = 25 (burst), refill rate = 100 tokens/sec. On each request: Lua script atomically reads the bucket, adds tokens based on elapsed time since last refill, checks if tokens >= 1, decrements if yes, returns allow/deny + remaining tokens. Store {token_count, last_refill_timestamp} per key. Return X-RateLimit-Limit, X-RateLimit-Remaining, and Retry-After headers. Use Redis Cluster for HA. Fallback: if Redis is unreachable, allow requests (fail open) to avoid blocking all traffic.",
        followUp: "What happens if your Redis rate limiter goes down -- fail open or fail closed, and why?",
      },
      {
        question: "How do you handle rate limiting in a microservices architecture with an API gateway?",
        expectedAnswer: "Apply rate limiting at the API gateway (edge) for per-client limits, and at individual services for per-resource limits. The gateway handles authentication, extracts the API key, and enforces global rate limits using a shared Redis store. Individual services can have their own local rate limiters for specific expensive endpoints. Use different algorithms at each layer: Token Bucket at the gateway for burst tolerance, Fixed Window at the service level for simplicity. Propagate rate limit headers from the most restrictive layer back to the client.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  CONCURRENCY PATTERNS
  // ════════════════════════════════════════════════════════════

  "thread-pool": {
    complexityAnalysis: `**Time Complexity:** O(1) for task submission (enqueue to work queue). O(t/w) wall-clock throughput where t = total tasks and w = worker threads (tasks processed in parallel batches of w).
**Space Complexity:** O(w + q) where w = worker thread stacks (~1MB each in Java) and q = task queue capacity. A 200-thread pool consumes ~200MB just in stack space.
**Optimal pool size formulas:** CPU-bound tasks: w = number of CPU cores (N). I/O-bound tasks: w = N * (1 + W/C) where W = average wait time and C = average compute time. Brian Goetz's formula from Java Concurrency in Practice.
**Real-world note:** Java's ThreadPoolExecutor (core pool, max pool, keep-alive, work queue, rejection handler) is the canonical implementation. Node.js libuv uses a fixed thread pool of 4 for file I/O. Go uses M:N scheduling with goroutines multiplexed onto OS threads via GOMAXPROCS.`,
    designRationale: `Thread Pool solves two critical problems: (1) the overhead of creating and destroying threads for each task (thread creation costs ~1ms and ~1MB stack in Java), and (2) unbounded concurrency that can exhaust system resources (10,000 simultaneous connections spawning 10,000 threads will OOM most servers). By pre-creating a bounded pool of workers and queueing tasks, Thread Pool amortizes thread creation cost and caps resource consumption. The key design decisions are: pool size (CPU-bound vs I/O-bound heuristics), queue type (bounded ArrayBlockingQueue vs unbounded LinkedBlockingQueue), and rejection policy (AbortPolicy throws, CallerRunsPolicy executes in the submitting thread, DiscardPolicy silently drops). Java's ThreadPoolExecutor exposes all of these as constructor parameters. Tradeoff: fixed pool size means tasks may queue during burst traffic, and thread starvation occurs if long-running tasks monopolize all workers.`,
    commonVariations: [
      "Fixed Thread Pool (Executors.newFixedThreadPool -- constant workers, unbounded queue, predictable resource usage)",
      "Cached Thread Pool (Executors.newCachedThreadPool -- creates threads on demand, reuses idle threads with 60s keep-alive, good for short-lived tasks but unbounded risk)",
      "Scheduled Thread Pool (ScheduledExecutorService -- executes tasks after a delay or periodically, replaces Timer/TimerTask)",
      "Work-Stealing Pool (ForkJoinPool -- idle workers steal tasks from busy workers' deques, optimal for recursive divide-and-conquer tasks)",
      "Virtual Threads (Java 21 Project Loom -- lightweight M:N threads managed by the JVM, eliminates the need for manual pool sizing for I/O-bound work)",
      "Event Loop + Worker Pool (Node.js model -- single event loop for I/O dispatch, fixed thread pool for blocking operations like file I/O and DNS)",
    ],
    antiPatterns: [
      "Unbounded thread creation -- creating a thread per request (new Thread(task).start()) leads to OOM under load; always use a pool with bounded concurrency",
      "Blocking I/O exhausting the pool -- all workers block on slow database queries, leaving zero threads for new requests; use separate pools for CPU-bound and I/O-bound work (bulkhead pattern)",
      "Unbounded task queue -- LinkedBlockingQueue with no capacity limit grows until OOM during traffic spikes; use ArrayBlockingQueue with a bounded capacity and a rejection policy",
      "Ignoring rejected tasks -- when the pool and queue are full, tasks are silently dropped if using DiscardPolicy; CallerRunsPolicy or explicit error handling is safer",
    ],
    interviewDepth: [
      {
        question: "How do you choose the right thread pool size?",
        expectedAnswer: "For CPU-bound tasks: pool size = number of CPU cores (N). Adding more threads just adds context-switching overhead. For I/O-bound tasks: pool size = N * (1 + W/C) where W = average wait time and C = average compute time. Example: 8 cores, tasks spend 80% waiting on I/O (W/C = 4) -> pool size = 8 * 5 = 40. For mixed workloads, use separate pools (bulkhead). Always validate with load testing under realistic conditions -- formulas are starting points, not answers.",
        followUp: "What happens if you configure a pool that is too large? What about too small?",
      },
      {
        question: "Explain Java's ThreadPoolExecutor parameters and how they interact.",
        expectedAnswer: "ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, rejectionHandler). On task submission: if active threads < corePoolSize, create a new thread. If >= corePoolSize, enqueue the task. If the queue is full AND active threads < maximumPoolSize, create a new thread. If the queue is full AND active threads >= maximumPoolSize, apply the rejection handler. Threads above corePoolSize are terminated after keepAliveTime of idleness. Executors.newFixedThreadPool sets core = max with an unbounded queue. Executors.newCachedThreadPool sets core = 0, max = Integer.MAX_VALUE with a SynchronousQueue (no queuing, always create new threads).",
        followUp: "Why is Executors.newCachedThreadPool dangerous in production?",
      },
      {
        question: "How does the work-stealing algorithm in ForkJoinPool work?",
        expectedAnswer: "Each worker thread has a double-ended queue (deque). When a task is forked (split), subtasks are pushed to the local deque. The worker processes tasks from its own deque (LIFO for cache locality). When a worker's deque is empty, it steals tasks from the tail of another worker's deque (FIFO for larger granularity). This balances load dynamically without a central dispatcher. ForkJoinPool is optimal for recursive divide-and-conquer tasks (merge sort, tree traversal) where subtask sizes are unpredictable. Java's parallel streams use the common ForkJoinPool internally.",
      },
    ],
  },

  "producer-consumer": {
    complexityAnalysis: `**Time Complexity:** O(1) amortized for produce (enqueue) and O(1) amortized for consume (dequeue) with a bounded buffer using lock-based or lock-free implementations. Blocking time depends on contention and buffer state.
**Space Complexity:** O(b) where b = buffer capacity. Ring buffer implementations achieve this with zero allocation after initialization.
**Throughput model:** Effective throughput = min(producer_rate, consumer_rate). When producer_rate > consumer_rate, the buffer fills and backpressure kicks in. Buffer capacity determines burst absorption: a 1000-slot buffer absorbs 1000 messages of burst before blocking.
**Real-world note:** Kafka uses a multi-partition producer-consumer model handling millions of messages/sec. Java's BlockingQueue (ArrayBlockingQueue, LinkedBlockingQueue) provides the standard in-process implementation. LMAX Disruptor achieves ~25M messages/sec using a lock-free ring buffer.`,
    designRationale: `Producer-Consumer decouples data production from data consumption using a shared buffer, enabling them to operate at different rates and on different threads. This is the foundational concurrency pattern -- Kafka, RabbitMQ, SQS, and every message queue is a distributed Producer-Consumer at scale. The core design decisions are: (1) buffer capacity -- too small causes frequent blocking, too large wastes memory and hides backpressure problems; (2) synchronization mechanism -- Java's BlockingQueue uses locks and conditions, LMAX Disruptor uses a lock-free ring buffer with CAS, Go channels use CSP semantics; (3) what happens when the buffer is full (block, drop oldest, drop newest, or signal backpressure). The pattern also solves the "variable processing speed" problem: web servers produce requests faster than database writes can consume them, so a queue absorbs the difference. Tradeoff: adds latency (items wait in buffer), introduces a new failure mode (buffer overflow or OOM with unbounded queues), and requires careful capacity planning.`,
    commonVariations: [
      "Bounded Buffer with BlockingQueue (Java ArrayBlockingQueue -- producers block when full, consumers block when empty)",
      "Lock-free Ring Buffer (LMAX Disruptor -- CAS-based, pre-allocated slots, ~25M msgs/sec, no GC pressure)",
      "Priority Queue Buffer (PriorityBlockingQueue -- consumers process highest-priority items first, useful for task scheduling)",
      "Multiple Producers / Multiple Consumers (MPMC -- thread-safe buffer with concurrent access, requires careful synchronization to avoid lost-wakeup)",
      "Go Channels (buffered channels implement bounded producer-consumer with CSP semantics, select statement for multiplexing)",
      "Distributed Message Queue (Kafka consumer groups, RabbitMQ, SQS -- producer-consumer at system scale with partitioning and replication)",
    ],
    antiPatterns: [
      "Unbounded buffer -- memory grows without limit if producers are faster than consumers; LinkedBlockingQueue without capacity is a ticking OOM bomb in production",
      "Busy-wait polling -- consuming CPU cycles checking the buffer in a tight loop instead of using blocking or condition-variable signaling",
      "Single-threaded consumer bottleneck -- one slow consumer limits total throughput; use consumer groups or multiple consumer threads with partitioned work",
      "Lost-wakeup problem -- notify() wakes one thread but the condition changes before it runs; always use while-loop condition checks (while(\!condition) wait()), not if-checks",
    ],
    interviewDepth: [
      {
        question: "How would you implement Producer-Consumer with backpressure?",
        expectedAnswer: "Use a bounded blocking queue (ArrayBlockingQueue in Java, bounded channel in Go). When the queue is full, produce() blocks until space is available -- this automatically slows down producers to match consumer throughput. The buffer capacity determines how much burst traffic is absorbed before backpressure kicks in. For distributed systems, Kafka consumer lag triggers backpressure: consumers commit offsets, and if the lag (unconsumed messages) grows, producers can be throttled via quotas or the application can scale up consumers.",
        followUp: "How does Kafka handle backpressure differently from RabbitMQ?",
      },
      {
        question: "How does the LMAX Disruptor achieve millions of messages per second?",
        expectedAnswer: "Three key techniques: (1) Lock-free ring buffer -- pre-allocated fixed-size array with CAS-based sequence counters, no locks means no context switching or kernel transitions. (2) Cache-line padding -- sequence counters are padded to fill a full cache line (64 bytes) to prevent false sharing between producer and consumer threads. (3) Mechanical sympathy -- data is laid out contiguously in memory for CPU cache friendliness. Producers and consumers each maintain their own sequence number; producers wait for consumers to advance before overwriting, consumers wait for producers to advance before reading. This yields ~25M messages/sec single-producer single-consumer on commodity hardware.",
        followUp: "What is false sharing and why does cache-line padding help?",
      },
      {
        question: "Design a log processing pipeline using Producer-Consumer.",
        expectedAnswer: "Multiple log producers (web servers, microservices) write log entries to a bounded buffer (Kafka topic with partitions). Consumer group with N consumers reads from partitions -- each partition is consumed by exactly one consumer in the group, providing ordered processing per partition. Consumers parse, filter, and aggregate logs, writing results to Elasticsearch. Backpressure: if consumers fall behind, Kafka retains messages (configurable retention). Scaling: add partitions and consumers. Dead-letter queue for malformed entries that fail parsing.",
      },
    ],
  },

  // ════════════════════════════════════════════════════════════
  //  AI AGENT PATTERNS
  // ════════════════════════════════════════════════════════════

  "react-pattern": {
    complexityAnalysis: `**Time Complexity:** O(s * t_llm) per task where s = number of Thought-Action-Observation steps and t_llm = LLM inference time per step. Each step includes one LLM call (~0.5-5s depending on model/provider) plus one tool call (variable latency). Total steps are bounded by max_iterations (typically 5-15).
**Space Complexity:** O(s * c) where s = steps and c = average context tokens per step. The scratchpad (all previous thoughts, actions, observations) is appended to the prompt each step, consuming the context window linearly. A 10-step task with 500 tokens/step consumes ~5,000 tokens of context.
**Token cost model:** Total tokens = sum over steps of (system_prompt + scratchpad + new_thought + action + observation). Cost grows quadratically with steps because the scratchpad is re-read every step. Mitigation: summarize scratchpad after N steps, or use sliding-window context.
**Real-world note:** LangChain's AgentExecutor, Claude's tool-use loop, and OpenAI's Assistants API all implement ReAct. Typical production agents cap at 10-15 steps with early termination on "Final Answer" token.`,
    designRationale: `ReAct (Reasoning + Acting) combines chain-of-thought reasoning with action execution in an interleaved loop, solving the fundamental limitation of pure LLMs: they cannot interact with the real world. The agent generates a Thought (reasoning about what to do next), takes an Action (calls a tool -- web search, database query, code execution), and receives an Observation (tool result). This cycle repeats until the agent produces a final answer. The key insight from the original ReAct paper (Yao et al., 2022) is that reasoning BEFORE acting improves action selection (the model plans which tool to use), and observations AFTER acting ground subsequent reasoning in reality (preventing hallucination chains). Compared to pure chain-of-thought, ReAct reduces hallucination because every reasoning step can be verified against real data. Compared to pure acting (e.g., blindly calling tools), ReAct produces more targeted actions. Tradeoff: more tokens and higher latency per task than direct action, but significantly better accuracy on multi-step tasks requiring information retrieval or computation.`,
    commonVariations: [
      "ReAct with Tool Registry (agent selects from a dynamic registry of available tools -- LangChain, Claude tool_use)",
      "ReAct with Self-Reflection (Reflexion pattern -- agent evaluates its own output, identifies errors, and retries with corrected reasoning)",
      "ReAct with RAG Memory (agent retrieves relevant documents from a vector store as an observation, grounding responses in domain-specific knowledge)",
      "Plan-and-Execute ReAct (agent creates a high-level plan first, then executes each step with ReAct -- reduces wasted steps on complex tasks)",
      "ReAct with Human-in-the-Loop (agent pauses for human approval before executing high-risk actions like database writes or API calls)",
      "Structured Output ReAct (agent outputs tool calls as structured JSON rather than free text -- reduces parsing errors, used by OpenAI function calling and Claude tool_use)",
    ],
    antiPatterns: [
      "Infinite reasoning loops -- agent repeats the same thought-action cycle without making progress; always set a max_iterations limit (typically 10-15) and detect repeated actions",
      "Tool hallucination -- agent invents tool names or parameters that do not exist; validate every action against the tool registry before execution and return a clear error message for unknown tools",
      "Context window overflow -- growing scratchpad exceeds the model's context window, causing truncation of early steps; implement scratchpad summarization or sliding-window compaction after N steps",
      "No observation validation -- trusting tool output without checking for errors or empty results; always validate observations and let the agent retry with different parameters on failure",
    ],
    interviewDepth: [
      {
        question: "How does ReAct differ from chain-of-thought prompting?",
        expectedAnswer: "Chain-of-thought (CoT) generates reasoning steps internally but cannot interact with the external world -- all knowledge comes from the LLM's training data, which may be outdated or wrong. ReAct interleaves reasoning with tool use: the agent can search the web, query databases, run code, and incorporate real results into subsequent reasoning. ReAct is grounded in reality; CoT is purely internal. For factual questions, ReAct reduces hallucination because the agent verifies claims via tools. For pure reasoning tasks (math proofs), CoT may be sufficient.",
        followUp: "When would you choose CoT over ReAct, and vice versa?",
      },
      {
        question: "What mechanisms prevent a ReAct agent from running forever?",
        expectedAnswer: "Three layers of protection: (1) max_iterations limit -- hard cap on Thought-Action-Observation cycles (e.g., 15 steps). (2) Repeated action detection -- if the agent calls the same tool with the same parameters twice in a row, force termination with an error message. (3) Token budget -- track cumulative token usage and terminate when approaching the context window limit or a cost threshold. (4) Timeout -- wall-clock time limit per task. LangChain's AgentExecutor implements max_iterations and early_stopping_method ('force' or 'generate' a final answer). Production systems should log all steps for debugging stalled agents.",
        followUp: "How would you design a ReAct agent that can recover from tool failures mid-execution?",
      },
      {
        question: "Design a ReAct agent that answers questions using a company's internal documentation.",
        expectedAnswer: "The agent has access to three tools: (1) vector_search(query) -- retrieves top-k relevant document chunks from a RAG vector store, (2) sql_query(query) -- queries the company database for structured data, (3) calculator(expression) -- evaluates arithmetic expressions. The system prompt instructs the agent to think about what information is needed, use vector_search for policy/procedure questions, sql_query for data questions, and calculator for numerical analysis. Each observation is validated (empty results trigger a refined search). The scratchpad accumulates context. Max iterations = 10. Final answer includes citations (document IDs from vector_search results).",
      },
    ],
  },

  "multi-agent-orchestration": {
    complexityAnalysis: `**Time Complexity:** O(a * s * t_llm) sequential worst case where a = number of agents, s = average steps per agent, t_llm = LLM inference time. Parallel execution reduces wall-clock time to O(s_max * t_llm) where s_max = steps of the slowest agent. Communication rounds add O(r * t_llm) where r = inter-agent message exchanges.
**Space Complexity:** O(a * c) where c = context window per agent. Shared memory adds O(m) where m = total entries in the shared store. Each agent maintains its own context independently, so total memory scales linearly with agent count.
**Communication overhead:** Orchestrator topology: O(a) messages per round (hub-and-spoke). Peer-to-peer: O(a^2) messages per round (every agent can message every other). Hierarchical: O(a * log(a)) for balanced trees.
**Real-world note:** OpenAI Swarm, CrewAI, AutoGen, and LangGraph implement multi-agent orchestration. Claude's sub-agent SDK uses orchestrator topology with structured handoffs. Microsoft's AutoGen achieves complex coding tasks with a planner + coder + reviewer agent trio.`,
    designRationale: `Multi-Agent Orchestration decomposes complex tasks into subtasks handled by specialized agents, each with focused expertise and a narrower context window. A single generalist agent attempting a complex task (research + code + test + deploy) often fails because the context window fills with irrelevant information and the model loses focus. Specialized agents (ResearchAgent, CoderAgent, ReviewerAgent) each see only relevant context, improving accuracy. The orchestrator manages task decomposition, agent assignment, result synthesis, and error handling. The key design decisions are: (1) orchestration topology -- central orchestrator for predictable workflows vs peer-to-peer for emergent collaboration vs hierarchical for deep subtask decomposition; (2) shared memory vs message passing -- shared memory (vector store, key-value store) enables implicit coordination, message passing enables explicit hand-offs; (3) agent selection -- static routing (always use CoderAgent for code tasks) vs dynamic routing (LLM-based router selects the best agent per subtask). Tradeoff: coordination overhead grows with agent count, debugging multi-agent interactions is significantly harder than single-agent debugging (you need traces per agent), and failure in one agent can cascade to others.`,
    commonVariations: [
      "Orchestrator / Hub-and-Spoke (central coordinator decomposes task, assigns subtasks to specialists, synthesizes results -- CrewAI, Claude sub-agents)",
      "Peer-to-peer / Autonomous Agents (agents communicate directly via message passing, no central coordinator -- emergent collaboration, harder to debug)",
      "Hierarchical Multi-Agent (supervisor agents manage groups of worker agents, forming a tree -- scales to complex enterprise workflows with delegation chains)",
      "Agent Debate / Consensus (multiple agents independently propose solutions, a judge agent evaluates and selects the best -- improves reasoning quality through adversarial verification)",
      "Mixture of Experts routing (a lightweight router model selects the best specialist agent for each input based on task classification -- lower latency than full orchestration)",
      "Sequential Pipeline (agents execute in a fixed order -- Research -> Draft -> Review -> Finalize -- simple, predictable, easy to debug)",
    ],
    antiPatterns: [
      "Too many agents for simple tasks -- coordination overhead (extra LLM calls for routing, synthesis) exceeds the benefit of specialization; use a single agent unless the task genuinely requires diverse expertise",
      "Circular delegation -- Agent A routes to Agent B which routes back to Agent A, creating an infinite loop; enforce acyclic routing with a maximum delegation depth",
      "Shared mutable state without coordination -- multiple agents writing to the same shared memory concurrently creates race conditions and inconsistent results; use append-only logs or turn-based access",
      "Orchestrator as bottleneck -- all inter-agent communication funnels through a single orchestrator LLM call, adding latency; allow direct agent-to-agent handoffs for sequential subtasks",
    ],
    interviewDepth: [
      {
        question: "When should you use multiple agents instead of a single agent?",
        expectedAnswer: "Use multiple agents when: (1) the task requires diverse expertise that a single system prompt cannot encode (research + coding + security review), (2) subtasks are independent and can run in parallel (searching multiple data sources simultaneously), (3) context window limitations prevent a single agent from holding all relevant information (100-page document analysis), (4) you need adversarial verification (one agent writes code, another reviews it). For simple tasks (summarization, Q&A, translation), a single well-prompted agent is simpler, cheaper, faster, and easier to debug.",
        followUp: "How do you decide the granularity of agent specialization?",
      },
      {
        question: "How do you handle conflicting outputs from multiple agents?",
        expectedAnswer: "Four strategies depending on use case: (1) Judge agent -- a separate LLM evaluates all outputs and selects the best based on criteria (accuracy, completeness, safety). Used in debate architectures. (2) Confidence scoring -- each agent returns a confidence score; the orchestrator selects the highest-confidence output or falls back to human review below a threshold. (3) Consensus voting -- if multiple agents agree on an answer, accept it; if they disagree, escalate to a more capable model or human. (4) Structured merging -- for non-conflicting partial outputs (one agent researched topic A, another researched topic B), merge results into a unified response. The choice depends on whether outputs are alternatives (judge/vote) or complements (merge).",
        followUp: "How does AutoGen's conversation-based multi-agent approach differ from CrewAI's task-based approach?",
      },
      {
        question: "Design a multi-agent system for automated code review.",
        expectedAnswer: "Four agents: (1) PlannerAgent -- receives the PR diff, decomposes review into subtasks (logic review, security audit, style check, test coverage). (2) SecurityAgent -- scans for common vulnerabilities (SQL injection, XSS, secrets in code), uses SAST tool integration. (3) LogicReviewAgent -- analyzes business logic correctness, identifies edge cases, checks error handling. (4) SynthesisAgent -- collects all agent outputs, resolves conflicts (if SecurityAgent flags a line but LogicAgent approves it, SecurityAgent wins), produces a unified review with severity-ranked comments. Orchestrator topology with shared memory (the PR diff is stored once, agents read it). Parallel execution of Security and Logic agents, sequential synthesis. Max total cost budget to prevent runaway agent loops.",
      },
    ],
  },

  "tool-use": {
    complexityAnalysis: `**Time Complexity:** O(1) for tool selection (LLM inference chooses which tool). O(t_exec) per tool execution where t_exec depends on the specific tool (web search ~1-3s, database query ~10-500ms, code execution ~100ms-30s). O(r) for registry lookup where r = number of registered tools, though LLMs select tools from the prompt context, not via explicit lookup.
**Space Complexity:** O(r * d) for the tool registry where r = registered tools and d = average description/schema size in tokens. Each tool definition includes name, description, and JSON Schema parameters. Large registries (50+ tools) consume significant prompt tokens.
**Tool selection accuracy:** Studies show accuracy degrades with registry size -- 5 tools ~95% correct selection, 20 tools ~85%, 50+ tools ~70%. Mitigation: dynamic tool filtering (only inject relevant tools per query), tool categories, or two-stage selection (first pick category, then pick tool within category).
**Real-world note:** Claude's tool_use, OpenAI's function calling, and Gemini's function declarations all implement structured tool use. The Model Context Protocol (MCP) standardizes tool schemas across providers. LangChain Tools and LlamaIndex Tools are the dominant framework implementations.`,
    designRationale: `Tool Use extends an LLM agent's capabilities beyond text generation by providing structured access to external systems -- web search, databases, calculators, APIs, code interpreters, and file systems. Without tools, LLMs are limited to knowledge from training data (potentially outdated) and cannot perform actions in the real world. The core design is a contract: the tool registry defines available tools with clear descriptions and JSON Schema parameters; the LLM selects a tool and generates structured arguments; the runtime validates arguments against the schema, executes the tool in a sandbox, and returns results to the LLM. The key design decisions are: (1) tool schema design -- clear, unambiguous descriptions are critical for correct selection; (2) input validation -- JSON Schema validation catches malformed arguments before execution; (3) sandboxing -- tools that write data or call external APIs need permission boundaries to prevent destructive actions; (4) error handling -- tool failures must be reported back to the agent as informative error messages so it can retry or choose a different approach. Tradeoff: each tool call adds latency (LLM inference + tool execution + result injection) and token cost (tool descriptions in prompt + arguments + results). Poorly described tools lead to incorrect selection and wasted computation.`,
    commonVariations: [
      "Function Calling / Structured Output (Claude tool_use, OpenAI function calling -- LLM outputs structured JSON arguments matched to a schema, runtime executes the function)",
      "Model Context Protocol / MCP (Anthropic's open standard -- unified tool schema format across providers, supports local and remote tool servers via stdio/SSE/HTTP)",
      "Code Interpreter / Sandbox (agent writes and executes code in a sandboxed environment for complex computation -- OpenAI Code Interpreter, Claude code execution)",
      "Plugin Architecture (extensible tool registry where third parties register tools at runtime -- ChatGPT Plugins, LangChain community tools)",
      "Retrieval-Augmented Generation / RAG as Tool (vector store search exposed as a tool -- agent decides when to retrieve context vs answer from training data)",
      "Tool Chaining / Agentic Workflows (output of one tool becomes input to another -- search -> extract -> summarize -> store, forming multi-step pipelines)",
    ],
    antiPatterns: [
      "Too many tools in the registry -- agent struggles to select the correct tool from 50+ options, leading to incorrect selections or excessive deliberation; limit visible tools to 10-15 per task via dynamic filtering",
      "Vague or overlapping tool descriptions -- 'search_web' and 'find_information' confuse the model; each tool must have a unique, specific description with concrete examples of when to use it",
      "No input validation -- agent sends malformed or missing parameters; always validate against JSON Schema before execution and return clear error messages for invalid inputs",
      "Tool hallucination -- agent invents tool names or parameter values that do not exist; validate tool name against registry and parameter values against schema; return 'tool not found' error with list of available tools",
    ],
    interviewDepth: [
      {
        question: "How does Claude/OpenAI function calling implement the Tool Use pattern?",
        expectedAnswer: "The developer defines tools as JSON Schema objects (name, description, parameters with types and descriptions). These are injected into the system prompt or a dedicated tools field. When the LLM determines it needs a tool, it outputs a structured tool_use block with the tool name and JSON arguments (not free text). The runtime extracts the tool call, validates arguments against the schema, executes the function, and injects the result as a tool_result message. The LLM then incorporates the result into its response. This is a formalized ReAct loop: the model reasons (chooses a tool), acts (structured output), and observes (tool result). The structured format eliminates parsing errors that plagued earlier free-text tool calling approaches.",
        followUp: "How does MCP (Model Context Protocol) improve on provider-specific function calling?",
      },
      {
        question: "How do you prevent tool hallucination and ensure tool safety?",
        expectedAnswer: "Four layers of defense: (1) Registry validation -- every tool call is checked against the registered tool names; unknown tools return an error with the list of valid tools. (2) Schema validation -- tool arguments are validated against the JSON Schema before execution; type mismatches, missing required fields, and extra fields are rejected with descriptive errors. (3) Sandboxing -- tools that perform writes (database, file system, API calls) require explicit permission scoping; code execution runs in an isolated container with resource limits (CPU, memory, network, time). (4) Output validation -- tool results are checked for size limits (truncate large outputs), sensitive data filtering (redact PII or credentials), and error formatting (convert exceptions to agent-readable error messages).",
        followUp: "How would you implement a permission model where different users have access to different tools?",
      },
      {
        question: "Design a tool registry for an AI agent that can search the web, query a database, and execute code.",
        expectedAnswer: "Three tools registered with JSON Schema: (1) web_search(query: string, num_results?: number) -- calls a search API, returns title + snippet + URL for each result, max 10 results. (2) sql_query(query: string, database: enum['analytics','users']) -- executes read-only SQL against specified database, returns JSON rows, 1000 row limit, 30s timeout. (3) code_execute(language: enum['python','javascript'], code: string) -- runs code in a sandboxed container with 60s timeout, 256MB memory, no network access, returns stdout + stderr. Each tool has a clear description, typed parameters, and examples. The registry provides a list_tools() method for injection into the prompt, and an execute(tool_name, args) method that validates then dispatches. Error responses include the tool name, error type, and a suggestion for the agent.",
      },
    ],
  },
};
