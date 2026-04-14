/**
 * Pattern Walkthrough seed (remaining 26 patterns): step-by-step guided
 * walkthroughs that complement the original 10 in pattern-walkthroughs.ts.
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
  // ── Creational ─────────────────────────────────────────────

  // ── 1. Abstract Factory ────────────────────────────────────
  {
    slug: "abstract-factory",
    name: "Abstract Factory Walkthrough",
    category: "creational",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Families of Related Objects",
        description:
          "Your cross-platform UI toolkit needs to create buttons, checkboxes, and text fields that match the host OS — Windows widgets with Windows look-and-feel, macOS widgets with macOS styling. If you scatter platform checks (if (os === 'win') new WinButton()) throughout your code, every new widget type or platform multiplies the conditional branches. Adding Linux support means touching every creation site.",
        highlightedClassIds: [],
        keyInsight:
          "When you create families of related objects, inconsistent mixing (a Windows button next to a macOS checkbox) is a bug — you need a way to enforce family cohesion.",
      },
      {
        stepNumber: 2,
        title: "The Abstract Factory Interface",
        description:
          "Declare a factory interface with one creation method per product type: createButton(), createCheckbox(), createTextField(). Each method returns an abstract product interface (Button, Checkbox, TextField). The client code depends only on these abstract interfaces — it never names a concrete class. The factory decides which concrete family to produce.",
        highlightedClassIds: ["AbstractFactory"],
        keyInsight:
          "An Abstract Factory declares a menu of creation methods — one per product in the family — all returning abstract types.",
      },
      {
        stepNumber: 3,
        title: "Concrete Factories Produce Cohesive Families",
        description:
          "WindowsFactory implements the interface: createButton() returns WinButton, createCheckbox() returns WinCheckbox. MacFactory does the same for macOS widgets. Each concrete factory guarantees that every product it creates is from the same family. You pick the factory once (at startup or via config), and all subsequent creations are automatically consistent.",
        highlightedClassIds: ["ConcreteFactory1", "ConcreteFactory2"],
        keyInsight:
          "Pick the factory once; get a consistent product family everywhere — no risk of mixing Windows buttons with macOS checkboxes.",
      },
      {
        stepNumber: 4,
        title: "Adding a New Family vs. a New Product",
        description:
          "Adding a new family (Linux) is easy: implement one new factory class, done — no existing code changes. Adding a new product (Slider) is hard: you must add createSlider() to the abstract factory interface and implement it in every concrete factory. This asymmetry is the pattern's key trade-off. Abstract Factory favors systems where families grow but the product set is stable.",
        highlightedClassIds: [],
        keyInsight:
          "New families are cheap (add a factory). New product types are expensive (change every factory). Design for the axis that changes most.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "At application startup, a configuration or runtime check selects the concrete factory. All application code receives the abstract factory and calls its creation methods. Components get injected products they can use without knowing which family they belong to. The factory is typically a singleton — one per process, chosen once, used everywhere.",
        highlightedClassIds: ["AbstractFactory", "ConcreteFactory1", "ConcreteFactory2"],
        keyInsight:
          "Abstract Factory + Dependency Injection = your entire application uses a consistent product family without a single platform check in business logic.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "React Native's platform-specific components (Button renders native iOS or Android controls) are an Abstract Factory. Java's AWT toolkit uses a peer factory that creates native widgets per platform. Database driver packages (pg, mysql2, better-sqlite3) behind a common ORM interface are abstract factories. Terraform providers are abstract factories — each provider (AWS, GCP, Azure) implements the same resource creation interface.",
        highlightedClassIds: [],
        keyInsight:
          "React Native, AWT, ORM drivers, and Terraform providers all use Abstract Factory — one interface, many platform-specific implementations.",
      },
    ],
  },

  // ── 2. Prototype ───────────────────────────────────────────
  {
    slug: "prototype",
    name: "Prototype Walkthrough",
    category: "creational",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Expensive or Complex Object Creation",
        description:
          "Creating a game character involves loading a 3D mesh, applying textures, setting up physics, and configuring hundreds of attributes. Doing this from scratch for every NPC is prohibitively slow. Or consider a document editor: duplicating a complex diagram means recreating every shape, connector, and style — deep construction logic scattered across dozens of classes. You need a way to copy existing objects cheaply.",
        highlightedClassIds: [],
        keyInsight:
          "When constructing an object from scratch is expensive or complex, cloning an existing one is often orders of magnitude faster.",
      },
      {
        stepNumber: 2,
        title: "Clone Instead of Construct",
        description:
          "The Prototype pattern defines a clone() method on objects. Instead of calling constructors, you take an existing object (the prototype) and clone it — producing a new instance with identical state. The client doesn't need to know the concrete class or its construction details. Clone handles deep copying of internal state, including private fields that external code can't access.",
        highlightedClassIds: ["Prototype"],
        keyInsight:
          "clone() lets an object copy itself — including private state that no external factory could replicate.",
      },
      {
        stepNumber: 3,
        title: "Shallow vs. Deep Copy",
        description:
          "A shallow clone copies primitive fields and shares references to nested objects — changing the nested object in one clone affects the other. A deep clone recursively copies every nested object, creating fully independent instances. The right choice depends on your use case: shared configuration can be shallow, but mutable state must be deep. JavaScript's structuredClone() provides built-in deep cloning; spread/Object.assign are shallow.",
        highlightedClassIds: [],
        keyInsight:
          "Shallow clone shares nested references (fast but coupled). Deep clone copies everything (independent but heavier). Choose deliberately.",
      },
      {
        stepNumber: 4,
        title: "Prototype Registry",
        description:
          "A prototype registry (or manager) stores a catalog of pre-configured prototypes indexed by name or type. Need a 'warrior' NPC? Clone the warrior prototype from the registry. Need an 'invoice' document? Clone the invoice template. This decouples the client from both the concrete class and the specific configuration — it just asks the registry for a named prototype and customizes the clone.",
        highlightedClassIds: ["Prototype"],
        keyInsight:
          "A prototype registry is a catalog of pre-built objects — ask for one by name, get a fresh clone, customize it.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define a Prototype interface with clone(). Concrete prototypes implement clone() with appropriate deep/shallow copy logic. Optionally, a PrototypeRegistry stores named prototypes. Client code requests a clone from the registry (or from any existing object), then customizes the clone. No constructors, no class names, no complex setup — just clone and tweak.",
        highlightedClassIds: ["Prototype"],
        keyInsight:
          "Prototype eliminates the need for parallel factory hierarchies — any object can serve as its own factory via clone().",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "JavaScript's Object.create() is the Prototype pattern — it creates a new object with the specified object as its prototype. React's cloneElement() clones a virtual DOM element with new props. Java's Object.clone() and Cloneable interface are the classic implementation. Spreadsheet applications clone cell formats. Game engines clone prefabs (Unity's Instantiate() is Prototype). structuredClone() in modern browsers deep-clones arbitrary objects.",
        highlightedClassIds: [],
        keyInsight:
          "Object.create(), React.cloneElement(), Unity.Instantiate(), and structuredClone() are all Prototype — cloning is built into every major platform.",
      },
    ],
  },

  // ── Structural ─────────────────────────────────────────────

  // ── 3. Facade ──────────────────────────────────────────────
  {
    slug: "facade",
    name: "Facade Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Subsystem Complexity Explosion",
        description:
          "Converting a video requires initializing a codec, configuring bitrate, setting up an audio channel, applying filters, and writing to an output stream — five subsystems, each with its own API, initialization order, and error modes. Every feature that needs video conversion duplicates this 30-line orchestration. The subsystems work fine individually, but coordinating them is a nightmare for calling code.",
        highlightedClassIds: [],
        keyInsight:
          "When using a subsystem requires orchestrating multiple classes in the right order, every caller repeats the same fragile choreography.",
      },
      {
        stepNumber: 2,
        title: "One Simple Interface Over the Complex Subsystem",
        description:
          "A Facade provides a single, simplified interface to a complex subsystem. VideoConverter.convert(file, format) internally orchestrates the codec, bitrate, audio, filters, and output stream. Callers interact with one method instead of five classes. The facade doesn't add new functionality — it just makes existing functionality easier to use by hiding coordination logic.",
        highlightedClassIds: ["Facade"],
        keyInsight:
          "A Facade doesn't add power — it subtracts complexity. One method replaces twenty lines of subsystem choreography.",
      },
      {
        stepNumber: 3,
        title: "Facade Doesn't Hide — It Simplifies",
        description:
          "The subsystem classes remain fully accessible. Power users can bypass the Facade and use the codec directly for fine-grained control. The Facade is an additional layer, not a replacement. This distinguishes it from encapsulation — a Facade doesn't enforce information hiding, it provides a convenient shortcut. Think of it as the express lane, not a locked gate.",
        highlightedClassIds: ["Facade"],
        keyInsight:
          "Facade is the express lane, not a locked gate — the underlying subsystem stays accessible for power users who need fine control.",
      },
      {
        stepNumber: 4,
        title: "Layered Facades and Anti-Corruption Layers",
        description:
          "In large systems, you often have facades over facades. A PaymentFacade calls a BillingFacade which calls the raw Stripe SDK. In Domain-Driven Design, an Anti-Corruption Layer is essentially a facade that translates between your domain model and an external system's model — preventing external concepts from leaking into your domain. Each layer simplifies the one below it.",
        highlightedClassIds: [],
        keyInsight:
          "Facades compose: an Anti-Corruption Layer is a domain-level facade that prevents external models from polluting your bounded context.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Identify a subsystem that multiple clients orchestrate in the same way. Create a Facade class that holds references to the subsystem objects and exposes high-level methods. Each method encapsulates the correct orchestration sequence, error handling, and defaults. Clients use the Facade for common cases and drop down to the subsystem for advanced use.",
        highlightedClassIds: ["Facade"],
        keyInsight:
          "A good Facade covers 80% of use cases with simple methods, while the other 20% go directly to the subsystem.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "jQuery is a Facade over the DOM API — $(selector).hide() replaces verbose cross-browser DOM manipulation. Express.js is a Facade over Node's http module. AWS SDK high-level clients (S3.upload()) facade the low-level multipart upload API. React's useState() is a Facade over the fiber reconciler's state management. Your project's /api routes are facades over your business logic layer.",
        highlightedClassIds: [],
        keyInsight:
          "jQuery, Express, AWS SDK high-level clients, and useState() are all Facades — frameworks are essentially curated facades over complex primitives.",
      },
    ],
  },

  // ── 4. Composite ───────────────────────────────────────────
  {
    slug: "composite",
    name: "Composite Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Tree Structures with Uniform Operations",
        description:
          "A file system has files and directories. A directory contains files and other directories. You want to calculate total size: for a file, return its size; for a directory, sum the sizes of its children (recursively). Without a unified interface, every operation needs two code paths — one for files, one for directories — with type checks scattered throughout. Adding 'symlink' means another branch everywhere.",
        highlightedClassIds: [],
        keyInsight:
          "When you have part-whole hierarchies and want to treat individual objects and compositions uniformly, type-checking each node is a maintenance trap.",
      },
      {
        stepNumber: 2,
        title: "Component: The Uniform Interface",
        description:
          "Define a Component interface that both leaves (File) and composites (Directory) implement. It declares operations common to both: getSize(), render(), calculatePrice(). Client code works with Component references — it doesn't know or care whether it's a single item or a tree of thousands. This is the key insight: uniformity lets you treat one item and a million the same way.",
        highlightedClassIds: ["Component"],
        keyInsight:
          "The Component interface makes a single leaf and a tree of 10,000 nodes interchangeable to client code.",
      },
      {
        stepNumber: 3,
        title: "Leaf and Composite",
        description:
          "A Leaf implements Component with base-case logic: File.getSize() returns the file's size directly. A Composite also implements Component but holds a list of children (which are Components — leaves or other composites). Composite.getSize() iterates its children, calling getSize() on each, and sums the results. The recursion is automatic — a composite doesn't know how deep its tree goes.",
        highlightedClassIds: ["Leaf", "Composite"],
        keyInsight:
          "Leaf does the work directly. Composite delegates to children and aggregates — recursion handles arbitrary depth automatically.",
      },
      {
        stepNumber: 4,
        title: "Child Management: Transparency vs. Safety",
        description:
          "Where do add()/remove() methods live? On Component (transparency — all nodes look the same, but add() on a Leaf is meaningless) or only on Composite (safety — compile-time guarantee, but clients must downcast to add children). GoF chose transparency; modern practice prefers safety. React's children prop is the transparent approach — any component can receive children, even if it ignores them.",
        highlightedClassIds: ["Component", "Composite"],
        keyInsight:
          "Transparency (add/remove on all) vs. Safety (add/remove on composites only) — React chose transparency, most typed languages choose safety.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define a Component interface with the operations you need. Implement Leaf for terminal nodes. Implement Composite with a children list and delegation logic. Clients work exclusively with Component references. Operations propagate recursively through the tree. Adding a new node type (e.g., SymLink) means implementing Component once — no changes to existing code.",
        highlightedClassIds: ["Component", "Leaf", "Composite"],
        keyInsight:
          "Composite turns tree traversal into polymorphism — you call one method at the root and the tree does the rest.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "React's component tree IS Composite — a <div> can contain <span> or <MyComponent>, and rendering recurses through the virtual DOM tree. The DOM itself is Composite (Node, Element, Text). File systems are Composite. UI layout engines (flexbox containers holding items or other containers). Org chart structures. AST nodes in compilers. Webpack's module dependency graph.",
        highlightedClassIds: [],
        keyInsight:
          "React's entire rendering model is Composite — every JSX tree is a composite structure that renders recursively from root to leaves.",
      },
    ],
  },

  // ── 5. Bridge ──────────────────────────────────────────────
  {
    slug: "bridge",
    name: "Bridge Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Cartesian Product of Variants",
        description:
          "You have shapes (Circle, Square) and rendering APIs (OpenGL, DirectX, Vulkan). Without Bridge, you get a class for every combination: OpenGLCircle, DirectXCircle, VulkanCircle, OpenGLSquare, DirectXSquare, VulkanSquare — 6 classes for 2 shapes x 3 renderers. Adding a Triangle means 3 more classes. Adding Metal means 4 more. The hierarchy grows as a Cartesian product, and each class mixes two independent concerns.",
        highlightedClassIds: [],
        keyInsight:
          "When two independent dimensions of variation multiply into a class explosion, you're missing a Bridge.",
      },
      {
        stepNumber: 2,
        title: "Separate Abstraction from Implementation",
        description:
          "Bridge splits the monolithic hierarchy into two independent hierarchies: the Abstraction (Shape) and the Implementation (Renderer). Shape holds a reference to a Renderer and delegates rendering calls to it. Circle.draw() calls this.renderer.renderCircle(). Now shapes and renderers evolve independently — add a Triangle without touching renderers, add Metal without touching shapes.",
        highlightedClassIds: ["Abstraction", "Implementor"],
        keyInsight:
          "Bridge decouples WHAT something does (abstraction) from HOW it does it (implementation) — they vary independently.",
      },
      {
        stepNumber: 3,
        title: "Composition Over Inheritance",
        description:
          "The Abstraction doesn't inherit from the Implementation — it holds a reference to it (composition). This is Bridge's core mechanism. You can swap implementations at runtime: switch a shape from OpenGL to Vulkan without changing the shape. You can also combine them freely: any shape with any renderer. Inheritance locks you into one combination at compile time; composition keeps options open.",
        highlightedClassIds: ["Abstraction", "Implementor"],
        keyInsight:
          "Bridge uses composition to connect abstraction and implementation — you can swap the implementation at runtime, not just at compile time.",
      },
      {
        stepNumber: 4,
        title: "Bridge vs. Adapter",
        description:
          "Adapter and Bridge look structurally similar (both use composition to delegate), but their intent differs fundamentally. Adapter is a retrofit — you have two incompatible interfaces and need to make them work together after the fact. Bridge is designed upfront — you anticipate two dimensions of variation and separate them from the start. Adapter fixes; Bridge prevents.",
        highlightedClassIds: [],
        keyInsight:
          "Adapter is a bandage for incompatible interfaces. Bridge is an architectural decision to keep two hierarchies independent from day one.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Identify two orthogonal dimensions (e.g., platform + feature, device + protocol, shape + renderer). Create an Abstraction hierarchy for one dimension and an Implementation interface for the other. The Abstraction holds an Implementation reference. Each concrete Abstraction delegates to the Implementation. Client code composes them: new Circle(new VulkanRenderer()).",
        highlightedClassIds: ["Abstraction", "Implementor"],
        keyInsight:
          "new Circle(new VulkanRenderer()) — Bridge lets you compose any abstraction with any implementation at object creation time.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "JDBC is a Bridge — the Driver interface (implementation) is separate from the Connection/Statement API (abstraction). React's reconciler (abstraction) bridges to platform renderers: react-dom, react-native, react-three-fiber. Logging facades (SLF4J) bridge to implementations (Logback, Log4j). Device drivers bridge OS abstractions to hardware implementations. Docker bridges container orchestration to runtime engines (containerd, CRI-O).",
        highlightedClassIds: [],
        keyInsight:
          "JDBC, React's reconciler architecture, and SLF4J are all Bridges — they separate the 'what' API from the 'how' implementation.",
      },
    ],
  },

  // ── 6. Flyweight ───────────────────────────────────────────
  {
    slug: "flyweight",
    name: "Flyweight Walkthrough",
    category: "structural",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Millions of Similar Objects",
        description:
          "A text editor renders a document with 100,000 characters. If each character is an object with font, size, color, position, and the glyph itself, you're storing 100,000 copies of 'font: Arial, size: 12' — the same data repeated thousands of times. A particle system with 10,000 bullets stores the same sprite, velocity profile, and color on every instance. Memory explodes with redundant state.",
        highlightedClassIds: [],
        keyInsight:
          "When millions of objects share most of their state, storing that shared state per-instance wastes enormous amounts of memory.",
      },
      {
        stepNumber: 2,
        title: "Intrinsic vs. Extrinsic State",
        description:
          "Flyweight splits object state into two categories. Intrinsic state is shared and immutable — the font face, particle sprite, tree species texture. It lives inside the Flyweight object and is reused across all contexts. Extrinsic state is unique per-use — the character position, particle coordinates, tree location. It's stored externally and passed to the Flyweight when needed.",
        highlightedClassIds: ["Flyweight"],
        keyInsight:
          "Intrinsic state (shared, immutable) lives in the flyweight. Extrinsic state (unique, mutable) is passed in from outside.",
      },
      {
        stepNumber: 3,
        title: "The Flyweight Factory",
        description:
          "A FlyweightFactory manages a pool of flyweight instances. When a client requests a flyweight (e.g., character 'A' in Arial-12), the factory checks its cache. If the flyweight exists, it returns the cached instance. If not, it creates one, caches it, and returns it. This ensures each unique intrinsic state exists exactly once in memory, no matter how many times it's used.",
        highlightedClassIds: ["FlyweightFactory", "Flyweight"],
        keyInsight:
          "The FlyweightFactory is a cache of shared instances — request, reuse, never duplicate.",
      },
      {
        stepNumber: 4,
        title: "Client Supplies Extrinsic State",
        description:
          "When rendering, the client passes extrinsic state to the flyweight: charFlyweight.render(x, y). The flyweight uses its intrinsic state (glyph, font) plus the provided extrinsic state (position) to perform the operation. This means the flyweight itself is stateless with respect to context — it can be used simultaneously by multiple clients without conflict.",
        highlightedClassIds: ["Flyweight"],
        keyInsight:
          "Flyweights are context-free — they rely on the caller to supply context, making them safely shareable across threads and call sites.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Identify which state is intrinsic (shared across instances) and which is extrinsic (varies per use). Create a Flyweight class holding only intrinsic state. Build a FlyweightFactory that caches and reuses instances. Client code stores extrinsic state separately and passes it to the flyweight for each operation. Memory drops from O(n * full_state) to O(unique_types * intrinsic + n * extrinsic).",
        highlightedClassIds: ["Flyweight", "FlyweightFactory"],
        keyInsight:
          "Flyweight trades computation (passing extrinsic state every call) for memory (storing shared state once) — a classic space-time trade-off.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "JavaScript's string interning automatically applies Flyweight — identical string literals share memory. Java's Integer.valueOf() caches instances for -128 to 127. Font rendering systems are textbook Flyweight: each glyph is rendered from a shared outline. React's reconciler reuses fiber nodes. Game engines share meshes, textures, and materials across instances. Connection pool objects share configuration but carry per-connection state externally.",
        highlightedClassIds: [],
        keyInsight:
          "String interning, Integer caching, font glyph rendering, and game engine shared assets are all Flyweight — the pattern is the foundation of memory-efficient rendering.",
      },
    ],
  },

  // ── Behavioral ─────────────────────────────────────────────

  // ── 7. Iterator ────────────────────────────────────────────
  {
    slug: "iterator",
    name: "Iterator Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Exposing Collection Internals",
        description:
          "You have a tree, a graph, a linked list, and a hash map. Each has different internal structure, but clients all want the same thing: visit every element. Without a uniform interface, clients must know the internal structure — array indexing for lists, pointer chasing for linked lists, DFS/BFS for trees. Every new data structure forces clients to learn a new traversal API. Changing the underlying structure breaks all callers.",
        highlightedClassIds: [],
        keyInsight:
          "When traversal logic is coupled to data structure internals, every structural change breaks every consumer.",
      },
      {
        stepNumber: 2,
        title: "A Uniform Traversal Interface",
        description:
          "Iterator defines a standard interface — typically hasNext() and next() (or the Symbol.iterator protocol in JS). Any collection that provides an Iterator can be traversed with the same code: while (it.hasNext()) process(it.next()). The client doesn't know if it's iterating an array, a tree, a database cursor, or an infinite sequence — the interface is the same.",
        highlightedClassIds: ["Iterator"],
        keyInsight:
          "Iterator decouples 'how to traverse' from 'what to traverse' — one loop syntax works for arrays, trees, streams, and infinite sequences.",
      },
      {
        stepNumber: 3,
        title: "Internal vs. External Iterators",
        description:
          "External iterators (Java's Iterator, JS's next()) give control to the client — you pull elements one at a time. Internal iterators (forEach, Ruby blocks) give control to the collection — it pushes elements to your callback. External iterators are more flexible (you can interleave two iterators, break early). Internal iterators are simpler to use. Most languages support both: for...of (external) and .forEach() (internal).",
        highlightedClassIds: [],
        keyInsight:
          "External iterators (pull) give you control. Internal iterators (push) give you convenience. Modern languages offer both.",
      },
      {
        stepNumber: 4,
        title: "Lazy Iteration and Generators",
        description:
          "Iterators don't need to compute all elements upfront. A generator function (function* in JS, yield in Python) produces values on demand — the next element is computed only when next() is called. This enables iterating over infinite sequences (Fibonacci), huge datasets (database cursors), and transformation pipelines (map/filter chains) without loading everything into memory.",
        highlightedClassIds: [],
        keyInsight:
          "Generators are lazy iterators — they compute the next value on demand, enabling infinite sequences and constant-memory pipelines.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define an Iterator interface (or implement Symbol.iterator in JS). Each collection provides a method that returns an iterator over its elements. The iterator encapsulates traversal state (current position, visited set for graphs). Client code uses the standard iteration protocol — for...of, spread operator, Array.from(). Multiple independent iterators can traverse the same collection simultaneously.",
        highlightedClassIds: ["Iterator", "IterableCollection"],
        keyInsight:
          "Implementing Symbol.iterator makes any object work with for...of, spread, destructuring, and Array.from() — instant language integration.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "JavaScript's Symbol.iterator protocol powers for...of on arrays, Maps, Sets, strings, and NodeLists. Python's __iter__/__next__ protocol is the same pattern. Database cursors (MongoDB, PostgreSQL) are iterators over result sets. Node.js Readable streams implement async iteration. RxJS Observables are push-based iterators. Pagination APIs are remote iterators — each page is a next() call.",
        highlightedClassIds: [],
        keyInsight:
          "Symbol.iterator, Python's __iter__, database cursors, streams, and pagination APIs are all Iterator — the pattern is how every language handles sequential access.",
      },
    ],
  },

  // ── 8. Mediator ────────────────────────────────────────────
  {
    slug: "mediator",
    name: "Mediator Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: N-to-N Communication Spaghetti",
        description:
          "A dialog box has a text field, a checkbox, a dropdown, and a submit button. When the checkbox changes, the dropdown options filter, the text field clears, and the submit button re-validates. Each component holds references to the others and calls their methods directly. With 4 components, you have up to 12 communication paths. With 10 components, it's 90. Every new component must be wired to every existing one.",
        highlightedClassIds: [],
        keyInsight:
          "When N components each know about N-1 others, adding one component means N new connections — the communication graph becomes unmanageable.",
      },
      {
        stepNumber: 2,
        title: "Introduce a Central Coordinator",
        description:
          "A Mediator sits between components and handles all communication. Components don't talk to each other — they notify the Mediator of events (checkbox changed), and the Mediator decides what to do (filter dropdown, clear text, re-validate). Each component knows only about the Mediator, reducing N*(N-1) connections to N. The components become reusable because they're decoupled from each other.",
        highlightedClassIds: ["Mediator"],
        keyInsight:
          "Mediator replaces N*(N-1) direct connections with N connections to one hub — components become independent and reusable.",
      },
      {
        stepNumber: 3,
        title: "Components Only Know the Mediator",
        description:
          "Each component (Colleague) holds a reference to the Mediator interface and calls mediator.notify(this, event) when something happens. The Mediator's notify() method contains the coordination logic: if sender is checkbox and event is 'changed', then dropdown.filter() and textField.clear(). The components are blissfully unaware of each other's existence.",
        highlightedClassIds: ["Mediator", "Colleague"],
        keyInsight:
          "Components fire events into the void — the Mediator catches them and orchestrates the response. No component knows who's listening.",
      },
      {
        stepNumber: 4,
        title: "The God Object Risk",
        description:
          "The Mediator absorbs all coordination logic, which can make it a God Object — one class that knows everything about every component. Mitigate this by keeping mediator logic purely coordinative (no business logic), splitting into sub-mediators for independent groups, or using event-based mediators where handlers are registered dynamically rather than hardcoded in one switch statement.",
        highlightedClassIds: ["Mediator"],
        keyInsight:
          "A Mediator can become a God Object — keep it thin by making it orchestrate, not compute. It should route, not reason.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define a Mediator interface with a notify(sender, event) method. Components hold a Mediator reference and call notify() on state changes. The Concrete Mediator implements coordination logic in notify(). Register components with the mediator at initialization. All inter-component communication flows through the mediator. Components can be tested in isolation by mocking the mediator.",
        highlightedClassIds: ["Mediator", "Colleague"],
        keyInsight:
          "Mediator centralizes coordination, not logic — components remain testable in isolation with a mock mediator.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Redux is a Mediator — components dispatch actions (notify), the store (mediator) routes to reducers, and connected components update. Air traffic control is the canonical Mediator analogy — planes don't talk to each other, they talk to the tower. Express middleware chains mediate between request and response. Chat room servers mediate between clients. Kubernetes' API server mediates between controllers, schedulers, and kubelets.",
        highlightedClassIds: [],
        keyInsight:
          "Redux, air traffic control, Express middleware, and Kubernetes API server are all Mediators — central coordination hubs that decouple participants.",
      },
    ],
  },

  // ── 9. Template Method ─────────────────────────────────────
  {
    slug: "template-method",
    name: "Template Method Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Duplicate Algorithm Skeletons",
        description:
          "Parsing CSV, JSON, and XML files follows the same skeleton: open file, validate format, parse content, transform data, close file. Each format implements parse and transform differently, but the surrounding steps (open, validate structure, close, handle errors) are identical. Without Template Method, each parser duplicates the skeleton, and a bug fix in the skeleton must be applied in three places.",
        highlightedClassIds: [],
        keyInsight:
          "When multiple classes share the same algorithm skeleton but differ in specific steps, duplicating the skeleton invites inconsistency.",
      },
      {
        stepNumber: 2,
        title: "Define the Skeleton, Defer the Steps",
        description:
          "Template Method defines the algorithm skeleton in a base class method (the 'template method'), calling abstract or hook methods for the steps that vary. The template method itself is typically final/non-overridable. Subclasses override only the varying steps. The base class controls the flow — subclasses fill in the blanks. This is the Hollywood Principle: don't call us, we'll call you.",
        highlightedClassIds: ["AbstractClass"],
        keyInsight:
          "The base class calls the subclass (Hollywood Principle), not the other way around — the skeleton controls when each step executes.",
      },
      {
        stepNumber: 3,
        title: "Abstract Methods vs. Hooks",
        description:
          "Abstract methods MUST be overridden — they represent steps that are always different (the actual parsing logic). Hook methods CAN be overridden — they have a default implementation that subclasses may replace (logging, pre/post-processing). Hooks provide optional extension points without forcing every subclass to implement them. The distinction between mandatory (abstract) and optional (hook) is key to a good template.",
        highlightedClassIds: ["AbstractClass"],
        keyInsight:
          "Abstract methods = mandatory customization points. Hooks = optional extension points with sensible defaults. Use both wisely.",
      },
      {
        stepNumber: 4,
        title: "Template Method vs. Strategy",
        description:
          "Template Method uses inheritance: the skeleton is in a base class, variations in subclasses. Strategy uses composition: the algorithm is injected as an object. Template Method varies steps within a fixed skeleton; Strategy swaps entire algorithms. Template Method is chosen at compile time (you subclass); Strategy can swap at runtime. If you need runtime flexibility, prefer Strategy.",
        highlightedClassIds: [],
        keyInsight:
          "Template Method = vary steps via inheritance. Strategy = vary entire algorithms via composition. Inheritance is simpler; composition is more flexible.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Create an abstract base class with a template method that defines the algorithm skeleton. Mark varying steps as abstract methods. Provide hook methods with default implementations for optional customization. Make the template method final to prevent subclasses from altering the skeleton. Each concrete subclass implements only the abstract methods and optionally overrides hooks.",
        highlightedClassIds: ["AbstractClass"],
        keyInsight:
          "A well-designed Template Method is a contract: 'I handle the flow, you handle the specifics — and neither of us touches the other's job.'",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "React class components use Template Method — componentDidMount(), render(), componentDidUpdate() are hooks called by React's lifecycle skeleton. Express middleware follows a template: next() is the hook that passes control. Java's AbstractList defines the iteration skeleton; subclasses implement get(). JUnit's setUp/tearDown/test lifecycle is Template Method. Compiler passes (lex, parse, optimize, emit) follow a fixed skeleton with pluggable phases.",
        highlightedClassIds: [],
        keyInsight:
          "React class lifecycle, Express next(), JUnit setUp/tearDown, and compiler passes are all Template Methods — frameworks define the skeleton, you fill in the steps.",
      },
    ],
  },

  // ── 10. Chain of Responsibility ────────────────────────────
  {
    slug: "chain-of-responsibility",
    name: "Chain of Responsibility Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Hardcoded Request Routing",
        description:
          "An HTTP request arrives and must be processed: authenticate, check rate limits, validate input, authorize, execute business logic. If you write this as nested if/else or a single monolithic function, the order is rigid, adding a new step (e.g., logging) means modifying existing code, and removing a step (e.g., skipping auth in dev mode) requires conditional branches everywhere.",
        highlightedClassIds: [],
        keyInsight:
          "When request processing is a pipeline of optional, reorderable steps, hardcoding the sequence makes it rigid and fragile.",
      },
      {
        stepNumber: 2,
        title: "Chain Handlers Together",
        description:
          "Each processing step becomes a Handler with a handle(request) method and a reference to the next handler. When a handler receives a request, it either processes it and stops (short-circuits), processes it and passes it along, or skips processing and passes it along unchanged. The chain is assembled by linking handlers: auth → rateLimit → validate → execute.",
        highlightedClassIds: ["Handler"],
        keyInsight:
          "Each handler decides independently: handle it, pass it on, or both — the chain is a pipeline of autonomous decision-makers.",
      },
      {
        stepNumber: 3,
        title: "Short-Circuiting and Fallthrough",
        description:
          "The power of CoR is short-circuiting. If the auth handler detects an invalid token, it returns a 401 immediately — the request never reaches rate limiting or validation. If all handlers pass, the final handler executes the business logic. This is exactly how Express/Koa middleware works: each middleware calls next() to continue or sends a response to short-circuit.",
        highlightedClassIds: ["Handler"],
        keyInsight:
          "Short-circuiting is the pattern's superpower — any handler can halt the chain, preventing unnecessary downstream processing.",
      },
      {
        stepNumber: 4,
        title: "Dynamic Chain Configuration",
        description:
          "Because handlers are linked objects (not hardcoded branches), you can configure the chain at runtime. Skip auth in development. Add a caching handler in production. Reorder validation before rate limiting. Insert logging between any two handlers. The chain is data, not code — you can build it from configuration, modify it per-request, or construct different chains for different endpoints.",
        highlightedClassIds: [],
        keyInsight:
          "The chain is a data structure, not a code path — you can assemble, reorder, and modify it at runtime without touching handler code.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define a Handler interface with handle(request) and setNext(handler). Each concrete handler implements its logic and calls this.next.handle(request) to pass along. Build the chain by linking handlers in order. The client sends the request to the first handler. Each handler autonomously decides whether to process, pass, or halt. New handlers are added by implementing the interface and inserting them into the chain.",
        highlightedClassIds: ["Handler"],
        keyInsight:
          "Adding a new processing step means writing one class and linking it into the chain — zero changes to existing handlers.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Express/Koa middleware IS Chain of Responsibility — each middleware calls next() or sends a response. DOM event bubbling is CoR: events propagate up the DOM tree until handled. Java's servlet filters chain. Exception handling in call stacks: each catch block either handles the error or lets it propagate. Kubernetes admission controllers form a chain. Logging frameworks chain log handlers (console → file → remote).",
        highlightedClassIds: [],
        keyInsight:
          "Express middleware, DOM event bubbling, servlet filters, and exception propagation are all Chain of Responsibility — pipelines of autonomous handlers.",
      },
    ],
  },

  // ── 11. Memento ────────────────────────────────────────────
  {
    slug: "memento",
    name: "Memento Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Undo Without Exposing Internal State",
        description:
          "A text editor needs undo/redo. The obvious approach is saving the editor's internal state (text buffer, cursor position, selection, scroll offset) before each change. But if external code can read and write this state, you've broken encapsulation — anyone can corrupt the editor's internals. You need to save state snapshots without exposing what's inside them.",
        highlightedClassIds: [],
        keyInsight:
          "Undo requires saving internal state externally — but exposing that state breaks encapsulation. You need an opaque snapshot.",
      },
      {
        stepNumber: 2,
        title: "The Memento: An Opaque State Snapshot",
        description:
          "A Memento is an object that stores a snapshot of the Originator's internal state. The Originator creates mementos (save()) and restores from them (restore(memento)). Crucially, only the Originator can read the memento's contents — the Caretaker (undo manager) stores mementos but treats them as opaque tokens. It's a sealed envelope: the caretaker holds it, only the originator can open it.",
        highlightedClassIds: ["Memento", "Originator"],
        keyInsight:
          "Memento is a sealed envelope — the caretaker holds it, but only the originator can open it and restore from it.",
      },
      {
        stepNumber: 3,
        title: "Originator, Memento, Caretaker",
        description:
          "The Originator (Editor) has the state you want to save. It provides save() → Memento and restore(Memento). The Memento stores the snapshot (private, immutable). The Caretaker (UndoManager) maintains a stack of mementos and triggers save/restore at appropriate times. The Caretaker never peeks inside mementos — it just pushes and pops them. This three-role separation preserves encapsulation.",
        highlightedClassIds: ["Originator", "Memento", "Caretaker"],
        keyInsight:
          "Originator creates and reads mementos. Caretaker stores them. Memento is immutable and opaque. Three roles, clean separation.",
      },
      {
        stepNumber: 4,
        title: "Memory and Performance Trade-offs",
        description:
          "Storing full state on every change is expensive for large objects. Solutions: store only the delta (incremental memento) instead of the full state. Use copy-on-write semantics so mementos share unchanged data. Limit the undo stack depth. Compress old mementos. Some systems combine Memento with Command — the command stores enough to undo itself (inverse operation) rather than a full state snapshot.",
        highlightedClassIds: [],
        keyInsight:
          "Full snapshots are safe but heavy. Deltas, copy-on-write, and Command-based undo reduce the cost — pick the right trade-off for your object size.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "The Originator implements save() (returns a new Memento with current state) and restore(memento) (applies the memento's saved state). The Memento class holds the state immutably, with access restricted to the Originator (via friend classes, nested classes, or module-private access). The Caretaker pushes a memento before each change and pops on undo. For redo, maintain a second stack.",
        highlightedClassIds: ["Originator", "Memento", "Caretaker"],
        keyInsight:
          "Undo = pop from history, push to redo stack. Redo = pop from redo stack, push to history. Two stacks, one Memento type.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Git commits are mementos of your entire project state. Redux time-travel debugging stores action/state snapshots. Browser history (back/forward) is a memento stack of page states. VS Code's undo system stores document mementos. Photoshop's History panel is a memento stack. Serialization (JSON.stringify/parse) is a crude memento. Database savepoints (SAVEPOINT/ROLLBACK TO) are transaction-level mementos.",
        highlightedClassIds: [],
        keyInsight:
          "Git commits, Redux time-travel, browser history, and database savepoints are all Memento — snapshots that let you rewind to any previous state.",
      },
    ],
  },

  // ── 12. Visitor ────────────────────────────────────────────
  {
    slug: "visitor",
    name: "Visitor Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Adding Operations to a Stable Hierarchy",
        description:
          "You have an AST with 20 node types (IfStatement, ForLoop, BinaryExpression, etc.). Now you need to add operations: type-checking, code generation, optimization, pretty-printing. Adding a method to each of 20 classes for each operation means 80 method additions across 20 files. Every new operation requires modifying every node class — violating Open/Closed Principle in a hierarchy that's supposed to be stable.",
        highlightedClassIds: [],
        keyInsight:
          "When you frequently add operations to a stable class hierarchy, modifying every class for each new operation is unsustainable.",
      },
      {
        stepNumber: 2,
        title: "Double Dispatch: Accept + Visit",
        description:
          "Each node class gets a single method: accept(visitor). Inside, it calls visitor.visitThisType(this) — dispatching to the correct visitor method based on both the visitor type and the node type. This is 'double dispatch': the first dispatch selects the visitor (polymorphism on the visitor), the second selects the node-specific method (the accept call). Now new operations mean new visitor classes, not new node methods.",
        highlightedClassIds: ["Visitor", "Element"],
        keyInsight:
          "Double dispatch = accept() picks the right visitor method for this node type. One method per class, forever — new operations go in new visitors.",
      },
      {
        stepNumber: 3,
        title: "Visitor Interface with One Method Per Element Type",
        description:
          "The Visitor interface declares one visit method per element type: visitIfStatement(node), visitForLoop(node), visitBinaryExpression(node). A TypeCheckVisitor implements all 20 methods with type-checking logic. A CodeGenVisitor implements all 20 with code generation. Each visitor class contains all the logic for one operation — neatly grouped instead of scattered across 20 node classes.",
        highlightedClassIds: ["Visitor"],
        keyInsight:
          "A Visitor groups one operation across all types in one class — the inverse of adding a method to each class.",
      },
      {
        stepNumber: 4,
        title: "The Trade-off: Easy to Add Operations, Hard to Add Types",
        description:
          "Visitor makes adding operations easy (new visitor class, no existing code changes) but adding new element types hard (every visitor must add a new method). This is the exact opposite of polymorphism's normal trade-off (easy to add types, hard to add operations). Use Visitor when the type hierarchy is stable but operations change frequently. This is called the Expression Problem in type theory.",
        highlightedClassIds: [],
        keyInsight:
          "Visitor inverts the usual OOP trade-off: easy to add operations (new visitors), hard to add types (change all visitors). Choose based on your growth axis.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Every element class implements accept(visitor) { visitor.visitMyType(this) }. The Visitor interface declares visitX() for each element type. Concrete visitors implement all visit methods for one operation. To traverse a structure, call accept(visitor) on the root — composite elements call accept on their children. Each new operation is a new visitor class with zero changes to the element hierarchy.",
        highlightedClassIds: ["Visitor", "Element"],
        keyInsight:
          "accept(visitor) on the root propagates through the tree — the visitor accumulates results as it visits each node.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Babel's AST transformation plugins are visitors — each plugin implements enter/exit hooks per node type. ESLint rules are visitors over the AST. TypeScript's type checker visits the AST to resolve types. Java's AnnotationProcessor visits class elements. LLVM's optimization passes are visitors over the IR. DOM tree walkers (document.createTreeWalker) implement visitor traversal.",
        highlightedClassIds: [],
        keyInsight:
          "Babel plugins, ESLint rules, TypeScript's type checker, and LLVM passes are all Visitors — the pattern dominates compiler and static analysis tooling.",
      },
    ],
  },

  // ── 13. Interpreter ────────────────────────────────────────
  {
    slug: "interpreter",
    name: "Interpreter Walkthrough",
    category: "behavioral",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Recurring Domain-Specific Expressions",
        description:
          "Your search feature supports queries like 'status:open AND (priority:high OR assignee:me)'. Your configuration system accepts expressions like 'env.NODE_ENV === production && feature.flags.darkMode'. These are small, domain-specific languages (DSLs) with grammars that users write dynamically. You can't hard-code every possible expression — you need to parse and evaluate them at runtime.",
        highlightedClassIds: [],
        keyInsight:
          "When users write dynamic expressions in a domain-specific grammar, you need a way to parse and evaluate them at runtime.",
      },
      {
        stepNumber: 2,
        title: "Grammar as a Class Hierarchy",
        description:
          "Interpreter maps grammar rules to classes. Each rule (terminal or non-terminal) becomes a class with an interpret() method. 'AND' becomes an AndExpression with two children. 'status:open' becomes a TerminalExpression that checks one field. The grammar tree IS the class hierarchy: composing expression objects mirrors composing grammar rules. Parsing builds the tree; interpretation walks it.",
        highlightedClassIds: [],
        keyInsight:
          "Interpreter turns grammar rules into objects — composing expression objects is the same as composing grammar rules.",
      },
      {
        stepNumber: 3,
        title: "Terminal and Non-Terminal Expressions",
        description:
          "Terminal expressions are leaves — they evaluate directly against context: NumberLiteral(42).interpret() returns 42; FieldCheck('status', 'open').interpret(issue) returns issue.status === 'open'. Non-terminal expressions are composites — they combine sub-expressions: AndExpression(left, right).interpret() returns left.interpret() && right.interpret(). The tree structure handles operator precedence naturally.",
        highlightedClassIds: [],
        keyInsight:
          "Terminals evaluate directly (literals, field lookups). Non-terminals combine sub-expressions (AND, OR, NOT). The tree encodes precedence.",
      },
      {
        stepNumber: 4,
        title: "The Context Object",
        description:
          "The Context holds the state that expressions evaluate against — variable bindings, environment values, the current record. It's passed to every interpret() call. For a search query, the context is the record being tested. For a math expression, it's a variable table. For a rule engine, it's the current facts. The same expression tree can be evaluated against different contexts.",
        highlightedClassIds: [],
        keyInsight:
          "The same expression tree evaluated against different contexts produces different results — separate the 'what' (expression) from the 'where' (context).",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define an Expression interface with interpret(context). Implement terminal expressions for literals and lookups. Implement non-terminal expressions for operators (AND, OR, NOT, comparison). Build a parser that converts string input into an expression tree. Evaluate by calling interpret(context) on the root. The pattern works best for simple grammars — complex languages should use parser generators (ANTLR, PEG.js) instead.",
        highlightedClassIds: [],
        keyInsight:
          "Interpreter is ideal for simple DSLs with < 20 grammar rules — for complex languages, use a parser generator.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Regular expression engines are Interpreters — each regex element (., *, +, []) is an expression node. SQL WHERE clauses are interpreted expression trees. Boolean search in Elasticsearch parses queries into expression trees. Template engines (Handlebars, Jinja2) interpret template syntax. CSS selectors are interpreted against the DOM tree. Math.js evaluates mathematical expressions via an interpreter AST.",
        highlightedClassIds: [],
        keyInsight:
          "Regex engines, SQL WHERE clauses, Elasticsearch queries, and template engines are all Interpreters — any DSL evaluator uses this pattern.",
      },
    ],
  },

  // ── Modern ─────────────────────────────────────────────────

  // ── 14. Repository ─────────────────────────────────────────
  {
    slug: "repository",
    name: "Repository Walkthrough",
    category: "modern",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Data Access Logic Scattered Everywhere",
        description:
          "SQL queries are embedded directly in your service layer: SELECT * FROM users WHERE email = ? appears in the auth service, the profile service, and the admin service. Each copy has slightly different column selections, joins, and error handling. Switching from PostgreSQL to MongoDB means finding and rewriting every query. Your business logic is tangled with database syntax.",
        highlightedClassIds: [],
        keyInsight:
          "When SQL queries are scattered across services, every database change requires a codebase-wide search-and-replace.",
      },
      {
        stepNumber: 2,
        title: "Abstract the Data Store Behind a Collection-Like Interface",
        description:
          "A Repository provides a collection-like interface — findById(id), findAll(criteria), save(entity), remove(entity) — that hides all data access details. The service layer calls userRepo.findByEmail(email) without knowing whether it's SQL, MongoDB, or an in-memory map. The Repository encapsulates query construction, connection management, and result mapping in one place.",
        highlightedClassIds: ["Repository"],
        keyInsight:
          "Repository makes your data store look like an in-memory collection — the domain layer doesn't know it's talking to a database.",
      },
      {
        stepNumber: 3,
        title: "Repository Interface and Implementations",
        description:
          "Define a UserRepository interface: findById(), findByEmail(), save(), remove(). Implement PostgresUserRepository that uses SQL. Implement MongoUserRepository that uses the MongoDB driver. Implement InMemoryUserRepository for testing. The service layer depends on the interface — swap implementations via dependency injection. This is the Dependency Inversion Principle applied to data access.",
        highlightedClassIds: ["Repository"],
        keyInsight:
          "Code to the Repository interface, inject the implementation — swap Postgres for Mongo for InMemory with zero service changes.",
      },
      {
        stepNumber: 4,
        title: "Repository vs. DAO vs. Active Record",
        description:
          "Repository speaks the domain language (findActiveSubscribers()). DAO (Data Access Object) speaks the database language (executeQuery()). Active Record merges the entity and the data access (user.save()). Repository is the most domain-friendly and testable. Active Record is the simplest for CRUD. DAO is the lowest-level. Prisma is a DAO; TypeORM repositories are Repositories; Rails models are Active Record.",
        highlightedClassIds: [],
        keyInsight:
          "Repository = domain language. DAO = database language. Active Record = entity IS the query. Choose based on domain complexity.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define repository interfaces in your domain layer — they speak in domain terms. Implement them in your infrastructure layer with actual database code. Inject repositories into services via DI. For testing, inject in-memory implementations. Keep repositories focused on one aggregate root (UserRepository, OrderRepository) — avoid a generic 'do everything' repository that leaks abstractions.",
        highlightedClassIds: ["Repository"],
        keyInsight:
          "One repository per aggregate root, interface in the domain layer, implementation in the infrastructure layer — clean architecture's data boundary.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "TypeORM and MikroORM provide built-in repository classes per entity. Spring Data JPA auto-generates repository implementations from interfaces. Django's Manager/QuerySet is a repository. Prisma's client acts as a repository layer. In DDD, repositories are the only way domain logic accesses persistence. The pattern is so fundamental that most ORMs have it built in.",
        highlightedClassIds: [],
        keyInsight:
          "TypeORM, Spring Data JPA, Django's Manager, and Prisma are all Repository implementations — the pattern is how modern ORMs structure data access.",
      },
    ],
  },

  // ── 15. CQRS ───────────────────────────────────────────────
  {
    slug: "cqrs",
    name: "CQRS Walkthrough",
    category: "modern",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: One Model for Reads and Writes",
        description:
          "Your application uses the same database schema and model for both reading and writing. But reads need denormalized data with joins across 5 tables (for dashboard views), while writes need normalized data with validation and business rules. Optimizing for reads (materialized views, caching) conflicts with write consistency. The single model is a compromise that serves neither concern well.",
        highlightedClassIds: [],
        keyInsight:
          "Reads and writes have fundamentally different requirements — forcing both through one model creates a compromised design that serves neither well.",
      },
      {
        stepNumber: 2,
        title: "Separate the Read Model from the Write Model",
        description:
          "CQRS (Command Query Responsibility Segregation) splits your application into two sides. The Command side handles writes: validates input, enforces business rules, updates the write store. The Query side handles reads: fetches pre-optimized, denormalized views. Each side has its own model, potentially its own database. Commands mutate state; Queries return data without side effects.",
        highlightedClassIds: [],
        keyInsight:
          "Commands change state (write model). Queries return data (read model). Separating them lets you optimize each independently.",
      },
      {
        stepNumber: 3,
        title: "Commands and Command Handlers",
        description:
          "A Command is an intent to change state: CreateOrderCommand { userId, items, shippingAddress }. A Command Handler validates the command, applies business rules, and persists the change. Commands are imperative ('do this'), named in the present tense, and always return void or a success/failure indicator — never data. This enforces the separation: if you want data, use a Query.",
        highlightedClassIds: [],
        keyInsight:
          "Commands are imperative intents (CreateOrder, CancelSubscription) — they always mutate, never return domain data.",
      },
      {
        stepNumber: 4,
        title: "Synchronizing Read and Write Models",
        description:
          "If both models share a database, they stay in sync automatically. With separate databases, you need a synchronization mechanism. The most common: the write side publishes domain events, and projections update the read model asynchronously. This introduces eventual consistency — the read model may lag by milliseconds to seconds. For most UIs, this delay is imperceptible.",
        highlightedClassIds: [],
        keyInsight:
          "Eventual consistency is the price of separate stores — domain events bridge the gap, and the lag is usually imperceptible to users.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define Commands (data objects describing write intent) and Command Handlers (execute the intent). Define Queries (data objects describing read intent) and Query Handlers (fetch from read-optimized store). Optionally use separate databases. Publish domain events from the command side to update the read side. Start simple — same database, different models — and split databases only when scaling demands it.",
        highlightedClassIds: [],
        keyInsight:
          "Start CQRS with separate models in the same database — you get 80% of the benefit without the complexity of separate stores.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Elasticsearch as a read store alongside PostgreSQL for writes is a common CQRS setup. GraphQL naturally separates queries and mutations — it's CQRS at the API level. Event-sourced systems almost always use CQRS because the event log is a poor read model. AWS uses DynamoDB for writes and ElastiCache for reads. Redux's action/reducer is a simplified CQRS: actions are commands, selectors are queries.",
        highlightedClassIds: [],
        keyInsight:
          "PostgreSQL + Elasticsearch, GraphQL queries/mutations, and Redux actions/selectors are all CQRS — the pattern appears whenever reads and writes have different performance requirements.",
      },
    ],
  },

  // ── 16. Event Sourcing ─────────────────────────────────────
  {
    slug: "event-sourcing",
    name: "Event Sourcing Walkthrough",
    category: "modern",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Lost History in Mutable State",
        description:
          "Your bank account table stores the current balance: $1,500. But how did it get there? Was it a $2,000 deposit minus a $500 withdrawal? A $10,000 deposit minus $8,500 in payments? You've lost the history. When an auditor asks 'what happened on March 3rd?', you can't answer. When a bug corrupts the balance, you can't reconstruct the correct value. Mutable state destroys the narrative of how you got here.",
        highlightedClassIds: [],
        keyInsight:
          "Mutable state answers 'what is it now?' but destroys the answer to 'how did it get here?' — and you need both.",
      },
      {
        stepNumber: 2,
        title: "Store Events, Not State",
        description:
          "Instead of storing current state, store the sequence of events that produced it: AccountCreated, MoneyDeposited($2000), MoneyWithdrawn($500). The current state is derived by replaying events from the beginning. Events are immutable facts — they happened, they can't un-happen. The event log is the source of truth; the current state is just a cached computation over the log.",
        highlightedClassIds: [],
        keyInsight:
          "Events are immutable facts. Current state is a fold over events. The log is truth; the state is a cached view.",
      },
      {
        stepNumber: 3,
        title: "Event Store and Replay",
        description:
          "An Event Store is an append-only log of events, ordered by sequence number. To get current state, load all events for an aggregate and replay them: events.reduce((state, event) => apply(state, event), initialState). This is like replaying a chess game from the move list — each move is an event, the board position is the state. The event store is the single source of truth for the entire system.",
        highlightedClassIds: [],
        keyInsight:
          "Replaying events is like replaying chess moves — given the same sequence, you always arrive at the same state.",
      },
      {
        stepNumber: 4,
        title: "Snapshots for Performance",
        description:
          "Replaying 10 million events on every request is too slow. Snapshots solve this: periodically save the current state (a snapshot) alongside the event sequence number. To rebuild, load the latest snapshot and replay only the events after it. A bank account with 10 million transactions might snapshot daily — rebuilding requires loading the snapshot plus at most one day's events.",
        highlightedClassIds: [],
        keyInsight:
          "Snapshots are performance checkpoints — they trade storage for replay speed, turning O(all-events) into O(events-since-snapshot).",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define domain events (immutable, past-tense: OrderPlaced, PaymentReceived). Implement an Event Store (append-only, per-aggregate streams). Build aggregate state by replaying events. Commands validate against current state, then append new events. Optionally: snapshot periodically for performance. Project events into read models (CQRS) for efficient queries. Publish events for downstream consumers.",
        highlightedClassIds: [],
        keyInsight:
          "Event Sourcing + CQRS is the canonical pairing — the event log feeds the write model, projections feed the read model.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Git is Event Sourcing — commits are immutable events; the working directory is derived state. Kafka is an event store — append-only, ordered, replayable. Accounting ledgers are event-sourced by law — you never delete entries, you add corrections. EventStoreDB is purpose-built for this pattern. Redux with action logging is client-side event sourcing. Blockchain is a distributed, consensus-based event store.",
        highlightedClassIds: [],
        keyInsight:
          "Git, Kafka, accounting ledgers, and blockchain are all Event Sourcing — append-only logs of immutable facts that derive all state.",
      },
    ],
  },

  // ── 17. Saga ───────────────────────────────────────────────
  {
    slug: "saga",
    name: "Saga Walkthrough",
    category: "modern",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Distributed Transactions",
        description:
          "Placing an order requires: charge the payment (Payment Service), reserve inventory (Inventory Service), schedule shipping (Shipping Service). In a monolith, a database transaction wraps all three. In microservices, each service has its own database — there's no shared transaction. If payment succeeds but inventory fails, you have an inconsistent state: money taken, no product reserved. You need a way to coordinate multi-service operations.",
        highlightedClassIds: [],
        keyInsight:
          "In microservices, there's no distributed ACID transaction — when step 2 of 3 fails, you need a way to undo step 1.",
      },
      {
        stepNumber: 2,
        title: "A Saga: Sequence of Local Transactions with Compensations",
        description:
          "A Saga breaks a distributed operation into a sequence of local transactions, each with a compensating action. Step 1: charge payment (compensation: refund payment). Step 2: reserve inventory (compensation: release inventory). Step 3: schedule shipping. If step 2 fails, the saga executes the compensation for step 1 (refund). Each step is atomic within its service; the saga ensures overall consistency.",
        highlightedClassIds: ["SagaOrchestrator"],
        keyInsight:
          "Each saga step has a forward action and a compensating action — if step N fails, compensations run backward from step N-1 to step 1.",
      },
      {
        stepNumber: 3,
        title: "Orchestration vs. Choreography",
        description:
          "Orchestration: a central Saga Orchestrator tells each service what to do and handles failures. It's a state machine: 'I'm in step 2, it failed, so now I run compensation 1.' Simple to reason about, but the orchestrator is a single point of coordination. Choreography: services publish events, and each service reacts to events from others. No central coordinator, but the flow is harder to trace and debug.",
        highlightedClassIds: ["SagaOrchestrator"],
        keyInsight:
          "Orchestration = central coordinator (easier to debug). Choreography = event-driven (more decoupled). Most teams start with orchestration.",
      },
      {
        stepNumber: 4,
        title: "Handling Partial Failure and Idempotency",
        description:
          "What if the compensation itself fails? Compensations must be idempotent — safe to retry. What if a service receives the same command twice? Steps must also be idempotent. Use unique transaction IDs to detect duplicates. Implement retries with exponential backoff for transient failures. For truly irrecoverable failures, alert a human — some problems require manual intervention and that's okay.",
        highlightedClassIds: [],
        keyInsight:
          "Every saga step and compensation must be idempotent — duplicate execution must produce the same result, not double-charge or double-refund.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define the saga as a sequence of steps, each with an action and a compensation. Implement an orchestrator that tracks current step and state (pending, completed, compensating, failed). On step failure, trigger compensations in reverse order. Use a persistent store for saga state (so it survives crashes). Make all actions and compensations idempotent. Add monitoring and alerting for stuck sagas.",
        highlightedClassIds: ["SagaOrchestrator", "SagaStep"],
        keyInsight:
          "A saga orchestrator is a persistent state machine: step forward on success, step backward on failure, never lose track of where you are.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "AWS Step Functions implement the Saga pattern for multi-service workflows with built-in compensation. Temporal.io and Cadence provide saga orchestration with durable execution. MassTransit (C#) and Axon Framework (Java) have built-in saga support. Stripe's payment flow (authorize → capture → fulfill) is a saga with compensations (void → refund). E-commerce order fulfillment is the canonical saga example.",
        highlightedClassIds: [],
        keyInsight:
          "AWS Step Functions, Temporal.io, Stripe's payment flow, and order fulfillment pipelines are all Sagas — the pattern is how microservices achieve consistency without distributed transactions.",
      },
    ],
  },

  // ── Resilience ─────────────────────────────────────────────

  // ── 18. Circuit Breaker ────────────────────────────────────
  {
    slug: "circuit-breaker",
    name: "Circuit Breaker Walkthrough",
    category: "resilience",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Cascading Failures",
        description:
          "Service A calls Service B, which is down. Each call to B hangs for 30 seconds before timing out. Service A's thread pool fills up with threads waiting on B. Now Service A can't handle any requests — including ones that don't need B. Service C, which depends on A, also stalls. A single unhealthy service cascades into a system-wide outage. Your retry logic makes it worse — hammering a failing service while consuming more resources.",
        highlightedClassIds: [],
        keyInsight:
          "Without a circuit breaker, a failing dependency doesn't just slow you down — it takes you down by exhausting your connection pool and threads.",
      },
      {
        stepNumber: 2,
        title: "The Three States: Closed, Open, Half-Open",
        description:
          "A Circuit Breaker wraps remote calls and tracks failures. Closed (normal): requests pass through, failures are counted. When failures exceed a threshold (e.g., 5 in 60 seconds), the circuit trips to Open. Open (fast-fail): all requests immediately fail without calling the downstream service — protecting your resources. After a timeout, it moves to Half-Open. Half-Open (probe): one test request goes through. If it succeeds, back to Closed. If it fails, back to Open.",
        highlightedClassIds: [],
        keyInsight:
          "Closed = normal. Open = fast-fail (protecting you). Half-Open = testing if the dependency recovered. Three states, automatic transitions.",
      },
      {
        stepNumber: 3,
        title: "Failure Detection Strategies",
        description:
          "Simple: count consecutive failures (5 failures → trip). Percentage-based: trip when error rate exceeds 50% in the last 100 calls. Time-window: trip when failures per second exceed a threshold. Slow-call detection: treat calls exceeding a latency threshold as failures. The right strategy depends on your traffic pattern — low-traffic services need count-based; high-traffic services use percentage-based.",
        highlightedClassIds: [],
        keyInsight:
          "Low traffic? Count consecutive failures. High traffic? Use error rate percentage. Always include slow-call detection — timeouts are failures too.",
      },
      {
        stepNumber: 4,
        title: "Fallback Strategies",
        description:
          "When the circuit is open, you don't have to return an error. Fallbacks include: serve cached data (stale but better than nothing), use a default value, degrade gracefully (show a simplified UI), redirect to a backup service, or queue the request for later. The fallback strategy depends on the business requirement — a product price should use cached data; a payment should fail loudly.",
        highlightedClassIds: [],
        keyInsight:
          "A good circuit breaker doesn't just fail fast — it fails smart, with a fallback strategy appropriate to the business context.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Wrap each external dependency call in a Circuit Breaker. Configure failure thresholds (5 failures or 50% error rate), open duration (30 seconds), and half-open probe count (1-3 test requests). Implement fallback logic for the open state. Add monitoring: track circuit state transitions, failure rates, and fallback usage. Use per-dependency breakers — a separate circuit for each downstream service.",
        highlightedClassIds: [],
        keyInsight:
          "One circuit breaker per dependency — a failure in the payment service shouldn't open the circuit for the notification service.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Netflix Hystrix (now in maintenance) popularized the pattern in Java. Resilience4j is the modern Java implementation. Polly (.NET) provides circuit breakers. Opossum is a Node.js circuit breaker. Envoy proxy implements circuit breaking at the infrastructure level. Istio service mesh provides circuit breakers as configuration. AWS App Mesh and gRPC health checking implement circuit breaker semantics. Every service mesh implements this pattern.",
        highlightedClassIds: [],
        keyInsight:
          "Hystrix, Resilience4j, Polly, Envoy, and Istio all implement Circuit Breaker — the pattern is the first line of defense against cascading failures.",
      },
    ],
  },

  // ── 19. Bulkhead ───────────────────────────────────────────
  {
    slug: "bulkhead",
    name: "Bulkhead Walkthrough",
    category: "resilience",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Resource Contention Sinks Everything",
        description:
          "Your service has one thread pool (100 threads) handling all requests: API calls, database queries, and external service calls. A slow external service starts taking 30 seconds per call. 60 threads get stuck waiting on that service. Only 40 threads remain for everything else. Now your fast database queries and API responses are queuing behind the slow-service traffic. One bad dependency degrades all functionality — not just its own.",
        highlightedClassIds: [],
        keyInsight:
          "A shared resource pool means any single slow dependency can monopolize resources and degrade everything — even unrelated functions.",
      },
      {
        stepNumber: 2,
        title: "Isolate Resources Into Compartments",
        description:
          "Named after ship bulkheads (watertight compartments that prevent one breach from sinking the ship), the Bulkhead pattern isolates resources into separate pools. Give the slow external service its own 20-thread pool. Give database queries another 50. Give API calls 30. If the external service pool fills up, only calls to that service are affected — database and API traffic continue at full capacity in their own pools.",
        highlightedClassIds: [],
        keyInsight:
          "Bulkhead isolates failure: if compartment A fills up, compartments B and C keep running — the ship stays afloat.",
      },
      {
        stepNumber: 3,
        title: "Thread Pool vs. Semaphore Bulkheads",
        description:
          "Thread pool isolation gives each dependency its own thread pool — the strongest isolation but highest overhead (more threads, more context switching). Semaphore isolation uses a counter to limit concurrent calls — no extra threads, lower overhead, but no timeout control. Thread pools for high-latency calls (external services). Semaphores for low-latency, high-throughput paths (in-memory lookups, fast database queries).",
        highlightedClassIds: [],
        keyInsight:
          "Thread pool bulkheads = strong isolation, higher cost. Semaphore bulkheads = lightweight limiting, less isolation. Match to the dependency's latency profile.",
      },
      {
        stepNumber: 4,
        title: "Sizing and Overflow Strategies",
        description:
          "How big should each compartment be? Start with: expected concurrent calls × p99 latency / expected throughput. Too small: unnecessary rejections. Too large: defeats the purpose. When a compartment is full, you can: reject immediately (fast fail), queue with a bounded buffer, or shed load (drop oldest). Monitor utilization — if a compartment is consistently above 80%, it's undersized.",
        highlightedClassIds: [],
        keyInsight:
          "Size bulkheads based on expected concurrency × latency — too small wastes capacity, too large defeats isolation.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Identify resource-sharing risks: which dependencies share thread pools, connection pools, or rate limits? Create isolated pools per dependency or per functional area. Configure pool sizes based on expected load. Implement overflow handling (reject, queue, fallback). Combine with Circuit Breaker: the bulkhead limits concurrent calls, the circuit breaker stops calling a failing service entirely. Monitor pool utilization and rejection rates.",
        highlightedClassIds: [],
        keyInsight:
          "Bulkhead + Circuit Breaker is the resilience power combo — Bulkhead limits concurrency, Circuit Breaker limits failure duration.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Netflix Hystrix used thread pool isolation per dependency. Resilience4j provides both thread pool and semaphore bulkheads. Node.js worker_threads can isolate CPU-heavy work. Kubernetes resource limits (CPU/memory per pod) are infrastructure-level bulkheads. Database connection pooling with per-service limits is a connection bulkhead. AWS Lambda concurrency limits per function are bulkheads. Docker containers themselves are bulkheads — isolated resource compartments.",
        highlightedClassIds: [],
        keyInsight:
          "Kubernetes resource limits, DB connection pools, Lambda concurrency limits, and Docker containers are all Bulkheads — resource isolation at every layer of the stack.",
      },
    ],
  },

  // ── 20. Retry ──────────────────────────────────────────────
  {
    slug: "retry",
    name: "Retry Walkthrough",
    category: "resilience",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Transient Failures Kill Reliability",
        description:
          "A network call fails because of a momentary DNS hiccup. A database query times out because of a brief GC pause. An API returns 503 because the server was restarting. These are transient failures — they'd succeed if you tried again a second later. But your code treats them the same as permanent failures (invalid credentials, 404 not found) and returns an error to the user for a problem that would self-resolve.",
        highlightedClassIds: [],
        keyInsight:
          "Transient failures are temporary by nature — a well-placed retry turns a momentary blip into an invisible non-event.",
      },
      {
        stepNumber: 2,
        title: "Retry with Exponential Backoff",
        description:
          "Don't retry immediately in a tight loop — you'll overwhelm the recovering service. Exponential backoff increases the delay between retries: 100ms, 200ms, 400ms, 800ms, 1600ms. This gives the downstream service time to recover while keeping total wait time reasonable. Add jitter (random variation) to prevent thundering herds — without jitter, 1000 clients all retry at the exact same exponential intervals.",
        highlightedClassIds: [],
        keyInsight:
          "Exponential backoff + jitter: increase delay between retries AND randomize timing to prevent thundering herds.",
      },
      {
        stepNumber: 3,
        title: "Retry Budget and Max Attempts",
        description:
          "Unlimited retries turn a transient failure into a persistent resource drain. Set a max retry count (3-5 for most operations) and a total timeout budget. A retry budget caps the percentage of requests that can be retries (e.g., 10% of total traffic) — this prevents retry storms during widespread outages. If 50% of your traffic is retries, you're doubling load on an already-struggling service.",
        highlightedClassIds: [],
        keyInsight:
          "Retry budgets prevent amplification: if more than 10% of traffic is retries, the system is failing and retries are making it worse.",
      },
      {
        stepNumber: 4,
        title: "Retryable vs. Non-Retryable Errors",
        description:
          "Not all errors should be retried. 503 Service Unavailable → retry. 429 Too Many Requests → retry with backoff. Connection timeout → retry. 400 Bad Request → don't retry (your request is invalid). 401 Unauthorized → don't retry (credentials are wrong). 404 Not Found → don't retry (resource doesn't exist). Classify errors upfront and only retry transient ones.",
        highlightedClassIds: [],
        keyInsight:
          "Retry 5xx and timeouts. Never retry 4xx client errors — they'll fail the same way every time, wasting resources and time.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Wrap external calls in a retry handler. Configure: max attempts (3-5), backoff strategy (exponential with jitter), retryable error classifier (5xx, timeout, connection reset), and total timeout budget. Make operations idempotent so retries are safe (use idempotency keys for non-idempotent operations). Combine with Circuit Breaker: retry for transient blips, circuit breaker for sustained failures.",
        highlightedClassIds: [],
        keyInsight:
          "Retry handles transient blips (seconds). Circuit Breaker handles sustained outages (minutes). Together, they cover the full failure spectrum.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "AWS SDK automatically retries with exponential backoff and jitter. gRPC has built-in retry policies configurable per-method. Axios-retry adds retry logic to HTTP clients. Polly (.NET) and Resilience4j (Java) provide sophisticated retry policies. Celery (Python) retries failed tasks with configurable backoff. Kafka producers retry message sends. Every cloud SDK implements retry because network calls are inherently unreliable.",
        highlightedClassIds: [],
        keyInsight:
          "AWS SDK, gRPC, Kafka producers, and every cloud SDK implement retry with exponential backoff — the pattern is the baseline for reliable distributed communication.",
      },
    ],
  },

  // ── 21. Rate Limiter ───────────────────────────────────────
  {
    slug: "rate-limiter",
    name: "Rate Limiter Walkthrough",
    category: "resilience",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Unbounded Traffic Overwhelms Systems",
        description:
          "Your API has no rate limiting. A client bug sends 10,000 requests per second instead of 10. A bot scrapes your entire catalog. A DDoS attack floods your endpoints. Without rate limiting, you either crash under load or degrade so badly that legitimate users get errors. You need a way to control how many requests any single client (or all clients combined) can make in a given time window.",
        highlightedClassIds: [],
        keyInsight:
          "Without rate limiting, one misbehaving client can consume all your capacity — rate limiting is an availability guarantee for everyone else.",
      },
      {
        stepNumber: 2,
        title: "Token Bucket Algorithm",
        description:
          "Imagine a bucket that holds N tokens and refills at a steady rate. Each request consumes one token. If the bucket is empty, the request is rejected (or queued). A bucket with capacity 100 and refill rate 10/second allows bursts of up to 100 requests, then sustains 10/second. The bucket capacity controls burst tolerance; the refill rate controls sustained throughput. This is the most common rate limiting algorithm.",
        highlightedClassIds: [],
        keyInsight:
          "Token bucket: capacity controls burst size, refill rate controls sustained throughput — simple, flexible, and the industry standard.",
      },
      {
        stepNumber: 3,
        title: "Other Algorithms: Sliding Window, Leaky Bucket, Fixed Window",
        description:
          "Fixed Window: count requests per clock minute — simple but allows burst at window boundaries (100 at 0:59 + 100 at 1:00 = 200 in 2 seconds). Sliding Window: smooths the boundary issue by weighting the previous window. Leaky Bucket: processes requests at a fixed rate, queuing excess — guarantees smooth output but adds latency. Choose based on whether you need burst tolerance (token bucket), smooth output (leaky bucket), or simplicity (fixed window).",
        highlightedClassIds: [],
        keyInsight:
          "Token bucket = burst-friendly. Leaky bucket = smooth output. Sliding window = accurate counting. Fixed window = simplest but allows boundary bursts.",
      },
      {
        stepNumber: 4,
        title: "Distributed Rate Limiting",
        description:
          "With multiple server instances, each tracking its own count, a client can get N × (per-instance limit). Centralized counting via Redis (INCR with TTL or Redis modules like redis-cell) ensures a global limit. Redis is fast enough for per-request checks. For even higher scale, use approximate algorithms: each instance tracks locally and syncs to Redis periodically, accepting small inaccuracies for massive throughput.",
        highlightedClassIds: [],
        keyInsight:
          "Redis INCR with TTL is the standard distributed rate limiter — fast, atomic, and shared across all instances.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Choose a rate limiting algorithm (token bucket for most APIs). Decide the key: per-user, per-API-key, per-IP, or global. Set limits based on capacity planning: if your backend handles 1000 RPS, set per-client limits so no single client can consume more than 10%. Return 429 Too Many Requests with a Retry-After header. Add rate limit headers (X-RateLimit-Remaining, X-RateLimit-Reset) so clients can self-throttle.",
        highlightedClassIds: [],
        keyInsight:
          "Return 429 with Retry-After and X-RateLimit headers — good rate limiting is transparent, not a black box.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Nginx's limit_req module implements leaky bucket rate limiting. Redis-based rate limiters power most API gateways (Kong, AWS API Gateway). GitHub's API uses token bucket with 5,000 requests/hour per authenticated user. Stripe returns 429 with Retry-After headers. Cloudflare's rate limiting operates at the edge. Express-rate-limit is the standard Node.js middleware. Every public API implements rate limiting — it's not optional, it's infrastructure.",
        highlightedClassIds: [],
        keyInsight:
          "Nginx limit_req, Redis-cell, GitHub's API limits, and Cloudflare rate limiting are all implementations — rate limiting is as fundamental as authentication for public APIs.",
      },
    ],
  },

  // ── Concurrency ────────────────────────────────────────────

  // ── 22. Thread Pool ────────────────────────────────────────
  {
    slug: "thread-pool",
    name: "Thread Pool Walkthrough",
    category: "concurrency",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Thread-Per-Request Doesn't Scale",
        description:
          "A web server creates a new thread for every incoming request. With 10 requests, this is fine. With 10,000 concurrent requests, you have 10,000 threads — each consuming ~1MB of stack memory (10GB total), plus context-switching overhead that destroys CPU cache locality. Thread creation itself takes microseconds that add up. The server becomes slower under load, the opposite of what you want. Eventually, the OS refuses to create more threads.",
        highlightedClassIds: [],
        keyInsight:
          "Creating a thread per request is O(n) in memory and context-switching cost — it works at low load but collapses under high concurrency.",
      },
      {
        stepNumber: 2,
        title: "Pre-Create and Reuse a Fixed Pool",
        description:
          "A Thread Pool creates N threads at startup and reuses them. Incoming tasks go into a queue. Idle threads pull tasks from the queue, execute them, and return to the pool. No thread creation per request — just queue insertion (nanoseconds). Memory is bounded: N threads × 1MB, regardless of request count. The pool size is tuned to hardware: typically CPU cores × 2 for IO-heavy work, CPU cores for CPU-heavy work.",
        highlightedClassIds: [],
        keyInsight:
          "Thread pool: bounded threads, unbounded throughput. Tasks queue up instead of spawning new threads — predictable resource usage under any load.",
      },
      {
        stepNumber: 3,
        title: "Work Queue and Task Scheduling",
        description:
          "The work queue sits between task producers (incoming requests) and consumers (pool threads). Queue types matter: unbounded queues risk memory exhaustion; bounded queues need an overflow policy (reject, caller-runs, discard-oldest). Work-stealing queues (used by ForkJoinPool) let idle threads steal from busy threads' queues — improving utilization. Priority queues let urgent tasks jump ahead.",
        highlightedClassIds: [],
        keyInsight:
          "The queue policy defines behavior under pressure: bounded + reject = fast-fail; unbounded = eventual OOM; work-stealing = optimal utilization.",
      },
      {
        stepNumber: 4,
        title: "Dynamic Sizing: Core, Max, and Keep-Alive",
        description:
          "Fixed-size pools are simple but inflexible. Dynamic pools have a core size (always alive), a max size (upper bound during spikes), and a keep-alive timeout (idle threads above core size are terminated). Java's ThreadPoolExecutor implements this. Under low load, only core threads run. Under spike, the pool grows to max. After the spike, excess threads die off. This balances resource usage with burst capacity.",
        highlightedClassIds: [],
        keyInsight:
          "Core threads handle steady load. Max threads handle spikes. Keep-alive reclaims resources after the spike — elastic scaling for threads.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Create a pool with N threads (start with 2 × CPU cores for IO-bound, 1 × CPU cores for CPU-bound). Use a bounded work queue with an appropriate overflow policy. Submit tasks via an async interface (Future/Promise). Monitor: queue depth, active threads, task completion time, rejection count. In Node.js, worker_threads or the built-in libuv thread pool serve this role. In Go, goroutines with a semaphore pattern achieve the same effect.",
        highlightedClassIds: [],
        keyInsight:
          "In Java, use ThreadPoolExecutor. In Node.js, use worker_threads. In Go, use a goroutine + semaphore. The concept is the same: bounded concurrency with queued overflow.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Java's ExecutorService and ForkJoinPool are thread pools. Node.js's libuv has a 4-thread pool for file I/O and DNS. Nginx uses a thread pool for blocking operations. PostgreSQL uses a process pool (connection pool). Go's runtime schedules goroutines onto an OS thread pool (GOMAXPROCS). Python's concurrent.futures.ThreadPoolExecutor. Web servers (Tomcat, Netty) use configurable thread pools. Every high-performance server is built on thread pools.",
        highlightedClassIds: [],
        keyInsight:
          "Java ExecutorService, Node's libuv, Nginx, PostgreSQL connection pools, and Go's scheduler are all thread/process pools — bounded concurrency is how every server handles load.",
      },
    ],
  },

  // ── 23. Producer-Consumer ──────────────────────────────────
  {
    slug: "producer-consumer",
    name: "Producer-Consumer Walkthrough",
    category: "concurrency",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Speed Mismatch Between Producers and Consumers",
        description:
          "Your web server receives 1,000 image uploads per second, but your image processing pipeline can only handle 100 per second. Without a buffer, either the server blocks on every upload (terrible latency) or it spawns unbounded processing tasks (OOM). The upload rate and processing rate are fundamentally mismatched — you need to decouple the speed of production from the speed of consumption.",
        highlightedClassIds: [],
        keyInsight:
          "When producers are faster than consumers, you need a buffer between them — otherwise you either block or crash.",
      },
      {
        stepNumber: 2,
        title: "Decouple with a Bounded Queue",
        description:
          "Place a bounded queue between producers and consumers. Producers add items to the queue and return immediately (fast). Consumers pull items at their own pace (independent). The queue absorbs speed differences. When the queue is full, producers can block (backpressure), drop items (load shedding), or return an error (fast-fail). When empty, consumers block waiting for work. The queue is the shock absorber.",
        highlightedClassIds: [],
        keyInsight:
          "The queue decouples production speed from consumption speed — producers don't wait for consumers, consumers don't starve without producers.",
      },
      {
        stepNumber: 3,
        title: "Backpressure and Flow Control",
        description:
          "An unbounded queue eventually eats all memory. Bounded queues force a decision when full: block (producer waits — backpressure propagates upstream), reject (producer gets an error — shed load), or evict oldest (lossy but bounded). Backpressure is usually best for correctness — it slows the producer to match the consumer, naturally rate-limiting the system. This is how TCP flow control works.",
        highlightedClassIds: [],
        keyInsight:
          "Backpressure is a feature, not a bug — slowing the producer to match the consumer prevents both OOM and data loss.",
      },
      {
        stepNumber: 4,
        title: "Multiple Producers, Multiple Consumers",
        description:
          "Scale independently: add more producers or consumers without changing the queue. 10 web servers producing and 3 worker processes consuming — the queue handles the coordination. Consumers compete for items (work distribution) or each gets a copy (fan-out). Thread-safe queues (ConcurrentLinkedQueue, channels) handle concurrent access. This is the foundation of every job queue system.",
        highlightedClassIds: [],
        keyInsight:
          "Producer-Consumer scales linearly: add producers for throughput, add consumers for processing speed — the queue is the coordination point.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Choose a queue implementation (in-process: blocking queue, channel; distributed: Redis, RabbitMQ, Kafka). Size the queue based on expected burst duration × production rate. Implement producers that enqueue work items. Implement consumers that dequeue and process. Add monitoring: queue depth, enqueue/dequeue rates, consumer lag. Configure backpressure behavior for when the queue fills up.",
        highlightedClassIds: [],
        keyInsight:
          "Queue depth is the key metric: growing = consumers too slow; empty = consumers idle; steady = balanced. Monitor it obsessively.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Kafka is the distributed Producer-Consumer queue — producers publish to topics, consumer groups process at their own pace. RabbitMQ, Amazon SQS, and Redis Streams are message-based implementations. Node.js event loop is Producer-Consumer: I/O callbacks produce events, the event loop consumes them. Go channels are in-process Producer-Consumer queues. Unix pipes (ls | grep) are Producer-Consumer. Every async job queue (Sidekiq, Celery, Bull) is this pattern.",
        highlightedClassIds: [],
        keyInsight:
          "Kafka, SQS, RabbitMQ, Go channels, Unix pipes, and the Node.js event loop are all Producer-Consumer — the pattern is how all async processing works.",
      },
    ],
  },

  // ── AI-Agent ───────────────────────────────────────────────

  // ── 24. ReAct (Reason + Act) ───────────────────────────────
  {
    slug: "react-pattern",
    name: "ReAct (Reason + Act) Walkthrough",
    category: "ai-agent",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: LLMs Can't Verify or Act on Their Knowledge",
        description:
          "An LLM is asked 'What is the current stock price of AAPL?' It generates a plausible-sounding number from training data — but it's months or years old. It can't look up the real answer. It can't run calculations, query databases, or verify facts. Pure generation is limited to the model's training data and reasoning ability. For tasks requiring current data or external actions, generation alone is insufficient.",
        highlightedClassIds: [],
        keyInsight:
          "LLMs can reason but can't act. They can think about what to do, but can't do it — unless you give them tools and a loop.",
      },
      {
        stepNumber: 2,
        title: "The ReAct Loop: Think, Act, Observe",
        description:
          "ReAct interleaves reasoning (Thought) with action (Act) and observation (Observe) in a loop. Thought: 'I need the current AAPL price. I should use the stock API tool.' Act: call stock_api(symbol='AAPL'). Observe: 'AAPL is $178.50.' Thought: 'Now I can answer the user.' The LLM reasons about what to do, executes a tool, observes the result, and reasons again — iterating until the task is complete.",
        highlightedClassIds: [],
        keyInsight:
          "ReAct = Thought → Action → Observation → Thought → ... until done. The LLM reasons about what to do, then actually does it.",
      },
      {
        stepNumber: 3,
        title: "Tool Selection and Grounding",
        description:
          "The model is given a set of tools with descriptions: search(query), calculator(expression), database(sql). In the Thought step, the model decides which tool to use and why. This 'chain of thought' reasoning dramatically improves tool selection accuracy over direct action. The observation grounds the model's knowledge in real data — it's no longer hallucinating facts, it's reasoning over retrieved evidence.",
        highlightedClassIds: [],
        keyInsight:
          "Explicit reasoning before action improves tool selection and grounds the model's answers in retrieved facts, not hallucinated ones.",
      },
      {
        stepNumber: 4,
        title: "Stopping Conditions and Error Handling",
        description:
          "The loop needs termination conditions: the model produces a final answer, a maximum iteration count is reached, or an unrecoverable error occurs. Without a max iteration limit, a confused model can loop forever. Error handling: if a tool call fails, the Observation returns the error, and the model can reason about it ('API returned 404, let me try a different query'). The model self-corrects through the loop.",
        highlightedClassIds: [],
        keyInsight:
          "Always set a max iteration limit — a confused model without one will loop forever. The loop enables self-correction, but needs a safety valve.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define available tools with names, descriptions, and parameter schemas. Prompt the model with the ReAct format: generate Thought, then Action (tool + params), then feed Observation (tool result) back. Loop until the model outputs a Final Answer or max iterations are hit. Parse the model's output to extract tool calls. Execute tools in a sandbox. Append the observation and continue. The entire loop is typically 2-5 iterations.",
        highlightedClassIds: [],
        keyInsight:
          "ReAct is the simplest viable agent architecture: a prompted loop that alternates between LLM reasoning and tool execution.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "LangChain agents implement ReAct as their default agent loop. Claude's tool use follows the ReAct pattern — the model reasons about which tool to call and processes the result. ChatGPT plugins used ReAct-style reasoning. AutoGPT and BabyAGI are elaborations of the ReAct loop. Google's Gemini function calling follows the same Think→Act→Observe pattern. Every LLM agent framework implements some variant of ReAct.",
        highlightedClassIds: [],
        keyInsight:
          "LangChain agents, Claude tool use, and ChatGPT plugins are all ReAct — it's the foundational loop behind every LLM agent.",
      },
    ],
  },

  // ── 25. Multi-Agent Orchestration ──────────────────────────
  {
    slug: "multi-agent-orchestration",
    name: "Multi-Agent Orchestration Walkthrough",
    category: "ai-agent",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: Single-Agent Limitations",
        description:
          "A single LLM agent handles everything: research, coding, testing, reviewing. But it loses context in long tasks, makes mistakes it can't catch itself (no second opinion), and can't parallelize work. It's like one person doing every job in a company. Complex tasks benefit from specialization: a researcher focuses on gathering information, a coder writes code, a reviewer checks for bugs. One generalist agent hits quality and throughput ceilings.",
        highlightedClassIds: [],
        keyInsight:
          "One agent doing everything hits a quality ceiling — specialization and review by separate agents catches errors a single agent misses.",
      },
      {
        stepNumber: 2,
        title: "Specialized Agents with Defined Roles",
        description:
          "Break the task into roles: a Planner decomposes the task, a Researcher gathers information, a Coder writes code, a Reviewer checks quality, a Tester validates correctness. Each agent has a focused system prompt, a limited tool set, and a specific responsibility. The Researcher has search tools. The Coder has file editing tools. The Reviewer only reads. Specialization improves output quality because each agent's context is focused.",
        highlightedClassIds: [],
        keyInsight:
          "Each agent gets a role, a focused prompt, and the minimal toolset for that role — specialization beats generalization for complex tasks.",
      },
      {
        stepNumber: 3,
        title: "Orchestration Patterns: Pipeline, Fan-out, Hierarchical",
        description:
          "Pipeline: agents work sequentially (Planner → Researcher → Coder → Reviewer). Fan-out: multiple agents work in parallel on independent subtasks, results are merged. Hierarchical: a manager agent delegates to worker agents and synthesizes their outputs. Pipeline is simplest. Fan-out is fastest for parallelizable work. Hierarchical is most flexible but hardest to debug. Most real systems combine all three.",
        highlightedClassIds: [],
        keyInsight:
          "Pipeline for sequential workflows. Fan-out for parallel subtasks. Hierarchical for complex delegation. Real systems combine all three.",
      },
      {
        stepNumber: 4,
        title: "Communication and Shared State",
        description:
          "Agents communicate through messages (structured hand-offs), shared artifacts (a document that multiple agents read and write), or a blackboard (shared state that agents observe and update). Message-passing is cleanest but requires well-defined interfaces. Shared artifacts are natural for collaborative writing. The key design decision: how much state does each agent see? Too much → context pollution. Too little → agents work at cross purposes.",
        highlightedClassIds: [],
        keyInsight:
          "Agent context management is the hardest part — each agent needs enough context to do its job but not so much that it loses focus.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define agent roles with specific system prompts and tool access. Build an orchestrator that routes tasks to agents and collects results. Implement hand-off protocols: what information passes between agents, in what format. Add monitoring: track each agent's inputs, outputs, tool calls, and token usage. Start with 2-3 agents and add more only when specialization demonstrably improves quality.",
        highlightedClassIds: [],
        keyInsight:
          "Start with 2-3 agents maximum — every additional agent adds coordination overhead. Add agents only when quality measurably improves.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Claude Code uses multi-agent orchestration — the main agent spawns sub-agents for research, code review, and exploration. AutoGen (Microsoft) provides a framework for multi-agent conversations. CrewAI defines agent roles and tasks declaratively. GitHub Copilot Workspace uses multiple agents for plan/implement/review cycles. Devin uses specialized agents for browsing, coding, and testing. The Anthropic Agent SDK supports multi-agent handoff patterns natively.",
        highlightedClassIds: [],
        keyInsight:
          "Claude Code sub-agents, AutoGen, CrewAI, and Copilot Workspace are all Multi-Agent Orchestration — the pattern scales LLM capability beyond single-context limits.",
      },
    ],
  },

  // ── 26. Tool Use ───────────────────────────────────────────
  {
    slug: "tool-use",
    name: "Tool Use Walkthrough",
    category: "ai-agent",
    steps: [
      {
        stepNumber: 1,
        title: "The Problem: LLMs Lack External Capabilities",
        description:
          "An LLM can't check the weather, run code, query a database, send an email, or read a file. It can only generate text based on its training data. When asked to 'calculate 7,293 × 8,147', it approximates (sometimes incorrectly) instead of using a calculator. When asked about today's news, it confabulates. The model is a reasoning engine trapped in a text-only sandbox — powerful thinking, zero agency.",
        highlightedClassIds: [],
        keyInsight:
          "LLMs are powerful reasoners but powerless actors — Tool Use bridges the gap between thinking and doing.",
      },
      {
        stepNumber: 2,
        title: "Define Tools as Structured Interfaces",
        description:
          "Tools are defined with a name, description, and parameter schema (typically JSON Schema). Example: { name: 'get_weather', description: 'Get current weather for a city', parameters: { city: string, units: 'celsius' | 'fahrenheit' } }. The LLM sees these definitions in its context and can decide to call a tool by generating a structured tool-call object instead of plain text. The description is critical — it's how the model understands when to use the tool.",
        highlightedClassIds: [],
        keyInsight:
          "Tool descriptions are prompts for the model — a clear, specific description is the difference between reliable and random tool selection.",
      },
      {
        stepNumber: 3,
        title: "The Tool Use Protocol",
        description:
          "The model generates a tool call: { tool: 'get_weather', params: { city: 'London' } }. Your application intercepts this, executes the actual function (calls a weather API), and feeds the result back to the model as a tool_result message. The model then incorporates the result into its response: 'The current temperature in London is 15C.' This is structured I/O — the model requests data, you provide it, it continues reasoning.",
        highlightedClassIds: [],
        keyInsight:
          "Tool Use is structured I/O: the model outputs a structured request, you execute it and return the result, the model continues with real data.",
      },
      {
        stepNumber: 4,
        title: "Tool Design: Granularity and Safety",
        description:
          "Granularity: too many small tools confuse the model; too few large tools limit flexibility. Group related operations (CRUD for one resource = one tool with an action parameter, or four focused tools). Safety: read-only tools (search, query) are safe to auto-execute. Write tools (send_email, delete_file) should require user confirmation. Destructive tools need guardrails — rate limits, sandboxing, or human-in-the-loop approval.",
        highlightedClassIds: [],
        keyInsight:
          "Read tools: auto-execute. Write tools: confirm with the user. Destructive tools: require explicit approval. Safety scales with consequence severity.",
      },
      {
        stepNumber: 5,
        title: "Putting It Together",
        description:
          "Define 5-15 tools with clear names, descriptions, and JSON Schema parameters. Include tools in the API request alongside the conversation. When the model returns a tool_use response, parse the tool name and parameters, execute the function, and send the result back as a tool_result. The model can call multiple tools per turn (parallel tool use) or chain tools across turns. Add error handling: if a tool fails, return the error as the tool_result so the model can adapt.",
        highlightedClassIds: [],
        keyInsight:
          "5-15 well-described tools is the sweet spot — enough capability for complex tasks, few enough for reliable selection.",
      },
      {
        stepNumber: 6,
        title: "Real-World Usage",
        description:
          "Claude's tool use (function calling) follows this pattern exactly — define tools via the API, the model calls them, you return results. OpenAI function calling is the same pattern. MCP (Model Context Protocol) standardizes tool interfaces across providers. ChatGPT plugins wrapped web APIs as tools. LangChain Tools, Semantic Kernel plugins, and Vercel AI SDK all implement this pattern. Every LLM application that goes beyond text generation uses Tool Use.",
        highlightedClassIds: [],
        keyInsight:
          "Claude tool use, OpenAI function calling, MCP, and every LLM agent framework implement Tool Use — it's the pattern that turns an LLM from a text generator into an agent.",
      },
    ],
  },
];

export async function seed(db: Database) {
  const SORT_OFFSET = 10; // continue numbering after the original 10
  const rows: NewModuleContent[] = WALKTHROUGHS.map((wt, i) => ({
    moduleId: MODULE_ID,
    contentType: CONTENT_TYPE,
    slug: wt.slug,
    name: wt.name,
    category: wt.category,
    difficulty: null,
    sortOrder: SORT_OFFSET + i,
    summary: wt.steps[0].description.slice(0, 300),
    tags: ["pattern-walkthrough", wt.category, wt.slug],
    content: { steps: wt.steps },
  }));

  console.log(`    Upserting ${rows.length} remaining pattern walkthrough rows...`);
  await batchUpsert(db, rows);
  console.log(`    ✓ ${rows.length} rows upserted`);
}
