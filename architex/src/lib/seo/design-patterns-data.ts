// ── Design Pattern database: 26 patterns (22 GoF + 4 modern) for SEO pages ───

export type PatternCategory = "creational" | "structural" | "behavioral" | "modern";

export interface DesignPatternDefinition {
  slug: string;
  title: string;
  category: PatternCategory;
  intent: string;
  motivation: string;
  applicability: string[];
  structure: string;
  participants: string[];
  consequences: string[];
  codeExample: string;
  relatedPatterns: string[];
}

export const DESIGN_PATTERNS: DesignPatternDefinition[] = [
  // ── Creational ───────────────────────────────────────────────
  {
    slug: "singleton",
    title: "Singleton",
    category: "creational",
    intent:
      "Ensure a class has only one instance and provide a global point of access to it.",
    motivation:
      "Some classes should have exactly one instance: a configuration manager, a connection pool, or a logging service. The Singleton pattern makes the class itself responsible for keeping track of its sole instance, refusing to create additional objects after the first.",
    applicability: [
      "There must be exactly one instance of a class, accessible from a well-known access point",
      "The sole instance should be extensible by subclassing without modifying clients",
      "You need lazy initialization of an expensive resource",
    ],
    structure:
      "A Singleton class declares a private static instance field and a private constructor. A public static getInstance() method creates the instance on first call and returns the cached instance on subsequent calls.",
    participants: [
      "Singleton — defines a static getInstance() method that returns the unique instance and a private constructor to prevent external instantiation",
    ],
    consequences: [
      "Controlled access to the sole instance",
      "Reduced namespace pollution compared to global variables",
      "Can be extended to permit a variable number of instances",
      "More flexible than class operations (static methods)",
      "Difficult to unit test due to global state — consider dependency injection as an alternative",
    ],
    codeExample: `class DatabasePool {
  private static instance: DatabasePool | null = null;
  private connections: Connection[] = [];

  private constructor(private maxSize: number) {
    for (let i = 0; i < maxSize; i++) {
      this.connections.push(new Connection());
    }
  }

  static getInstance(maxSize = 10): DatabasePool {
    if (!DatabasePool.instance) {
      DatabasePool.instance = new DatabasePool(maxSize);
    }
    return DatabasePool.instance;
  }

  acquire(): Connection | undefined {
    return this.connections.pop();
  }

  release(conn: Connection): void {
    if (this.connections.length < this.maxSize) {
      this.connections.push(conn);
    }
  }
}`,
    relatedPatterns: ["factory-method", "abstract-factory", "prototype"],
  },
  {
    slug: "factory-method",
    title: "Factory Method",
    category: "creational",
    intent:
      "Define an interface for creating an object, but let subclasses decide which class to instantiate. Factory Method lets a class defer instantiation to subclasses.",
    motivation:
      "A framework for building document editors needs to create document objects but cannot anticipate the specific document types. By defining a factory method, the framework delegates document creation to application-specific subclasses that know which concrete document to instantiate.",
    applicability: [
      "A class cannot anticipate the class of objects it must create",
      "A class wants its subclasses to specify the objects it creates",
      "You want to localize the knowledge of which helper class to instantiate",
    ],
    structure:
      "An abstract Creator class declares the factory method that returns a Product interface. Concrete Creators override the factory method to return specific Concrete Product instances.",
    participants: [
      "Product — defines the interface of objects the factory method creates",
      "ConcreteProduct — implements the Product interface",
      "Creator — declares the factory method and may provide a default implementation",
      "ConcreteCreator — overrides the factory method to return a ConcreteProduct",
    ],
    consequences: [
      "Eliminates the need to bind application-specific classes into your code",
      "Provides hooks for subclasses to extend object creation logic",
      "Connects parallel class hierarchies (creator-product pairs)",
      "May require creating a ConcreteCreator subclass just to instantiate a particular product",
    ],
    codeExample: `interface Notification {
  send(message: string): void;
}

class EmailNotification implements Notification {
  send(message: string): void {
    console.log(\`Email: \${message}\`);
  }
}

class SMSNotification implements Notification {
  send(message: string): void {
    console.log(\`SMS: \${message}\`);
  }
}

abstract class NotificationFactory {
  abstract createNotification(): Notification;

  notify(message: string): void {
    const notification = this.createNotification();
    notification.send(message);
  }
}

class EmailFactory extends NotificationFactory {
  createNotification(): Notification {
    return new EmailNotification();
  }
}

class SMSFactory extends NotificationFactory {
  createNotification(): Notification {
    return new SMSNotification();
  }
}`,
    relatedPatterns: ["abstract-factory", "prototype", "template-method"],
  },
  {
    slug: "abstract-factory",
    title: "Abstract Factory",
    category: "creational",
    intent:
      "Provide an interface for creating families of related or dependent objects without specifying their concrete classes.",
    motivation:
      "A UI toolkit that supports multiple look-and-feel standards needs to create widgets (buttons, scrollbars, menus) that match the chosen theme. An Abstract Factory provides a family of widget creation methods, and each concrete factory produces widgets consistent with one theme.",
    applicability: [
      "A system should be independent of how its products are created and composed",
      "A system must use one of multiple families of products",
      "Related product objects are designed to be used together and you need to enforce that constraint",
    ],
    structure:
      "An AbstractFactory interface declares creation methods for each abstract product. ConcreteFactory classes implement those methods to produce ConcreteProduct instances from the same family.",
    participants: [
      "AbstractFactory — declares creation methods for each type of abstract product",
      "ConcreteFactory — implements the creation methods for one family of products",
      "AbstractProduct — declares an interface for a type of product object",
      "ConcreteProduct — implements the AbstractProduct interface for a specific family",
    ],
    consequences: [
      "Isolates concrete classes from client code",
      "Makes exchanging product families easy by swapping the factory",
      "Promotes consistency among products in a family",
      "Supporting new product types requires changing the AbstractFactory interface",
    ],
    codeExample: `interface Button { render(): string; }
interface Input { render(): string; }

interface UIFactory {
  createButton(): Button;
  createInput(): Input;
}

class DarkButton implements Button {
  render() { return '<button class="dark">Click</button>'; }
}
class DarkInput implements Input {
  render() { return '<input class="dark" />'; }
}

class LightButton implements Button {
  render() { return '<button class="light">Click</button>'; }
}
class LightInput implements Input {
  render() { return '<input class="light" />'; }
}

class DarkThemeFactory implements UIFactory {
  createButton() { return new DarkButton(); }
  createInput() { return new DarkInput(); }
}

class LightThemeFactory implements UIFactory {
  createButton() { return new LightButton(); }
  createInput() { return new LightInput(); }
}`,
    relatedPatterns: ["factory-method", "builder", "singleton"],
  },
  {
    slug: "builder",
    title: "Builder",
    category: "creational",
    intent:
      "Separate the construction of a complex object from its representation so that the same construction process can create different representations.",
    motivation:
      "Building an HTTP request involves many optional parameters: headers, query params, body, timeout, authentication. Rather than a constructor with dozens of optional arguments, the Builder pattern lets clients construct requests step by step, producing different configurations from the same building process.",
    applicability: [
      "The algorithm for creating a complex object should be independent of the parts and how they are assembled",
      "The construction process must allow different representations for the object being constructed",
      "You need to construct objects with many optional parameters without telescoping constructors",
    ],
    structure:
      "A Builder interface defines steps for constructing parts of a Product. A ConcreteBuilder implements those steps and provides a method to retrieve the result. A Director orchestrates the building steps in a specific order.",
    participants: [
      "Builder — specifies an abstract interface for creating parts of a Product",
      "ConcreteBuilder — implements the Builder interface, assembles the product, and provides a retrieval method",
      "Director — constructs an object using the Builder interface",
      "Product — the complex object under construction",
    ],
    consequences: [
      "Lets you vary a product's internal representation",
      "Isolates code for construction from representation",
      "Gives finer control over the construction process step by step",
      "Requires creating a separate ConcreteBuilder for each product type",
    ],
    codeExample: `class QueryBuilder {
  private table = "";
  private conditions: string[] = [];
  private orderField = "";
  private limitCount = 0;

  from(table: string): this {
    this.table = table;
    return this;
  }

  where(condition: string): this {
    this.conditions.push(condition);
    return this;
  }

  orderBy(field: string): this {
    this.orderField = field;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  build(): string {
    let query = \`SELECT * FROM \${this.table}\`;
    if (this.conditions.length > 0) {
      query += \` WHERE \${this.conditions.join(" AND ")}\`;
    }
    if (this.orderField) {
      query += \` ORDER BY \${this.orderField}\`;
    }
    if (this.limitCount > 0) {
      query += \` LIMIT \${this.limitCount}\`;
    }
    return query;
  }
}

const query = new QueryBuilder()
  .from("users")
  .where("age > 18")
  .where("active = true")
  .orderBy("created_at")
  .limit(10)
  .build();`,
    relatedPatterns: ["abstract-factory", "composite", "prototype"],
  },
  {
    slug: "prototype",
    title: "Prototype",
    category: "creational",
    intent:
      "Specify the kinds of objects to create using a prototypical instance, and create new objects by copying this prototype.",
    motivation:
      "When creating objects is expensive (e.g., deep-cloning a complex graph of objects, or duplicating a database record with many associations), the Prototype pattern allows you to clone an existing instance rather than constructing a new one from scratch.",
    applicability: [
      "A system should be independent of how its products are created",
      "Classes to instantiate are specified at runtime by dynamic loading",
      "You want to avoid building a class hierarchy of factories that parallels the class hierarchy of products",
    ],
    structure:
      "A Prototype interface declares a clone() method. Concrete Prototypes implement clone() to return a copy of themselves. Clients create new objects by asking a prototype to clone itself.",
    participants: [
      "Prototype — declares the clone() interface",
      "ConcretePrototype — implements clone() by copying itself",
      "Client — creates a new object by asking a prototype to clone itself",
    ],
    consequences: [
      "Hides the concrete product classes from the client",
      "Allows adding and removing products at runtime by registering prototypical instances",
      "Reduces the need for subclassing compared to Factory Method",
      "Deep cloning complex objects with circular references can be difficult",
    ],
    codeExample: `interface Cloneable<T> {
  clone(): T;
}

class ServerConfig implements Cloneable<ServerConfig> {
  constructor(
    public host: string,
    public port: number,
    public ssl: boolean,
    public headers: Map<string, string>,
  ) {}

  clone(): ServerConfig {
    return new ServerConfig(
      this.host,
      this.port,
      this.ssl,
      new Map(this.headers), // deep copy
    );
  }
}

// Create a prototype and clone variants
const production = new ServerConfig(
  "api.example.com", 443, true,
  new Map([["Authorization", "Bearer token"]]),
);

const staging = production.clone();
staging.host = "staging.example.com";
staging.ssl = false;`,
    relatedPatterns: ["abstract-factory", "factory-method", "builder"],
  },
  // ── Structural ───────────────────────────────────────────────
  {
    slug: "adapter",
    title: "Adapter",
    category: "structural",
    intent:
      "Convert the interface of a class into another interface clients expect. Adapter lets classes work together that could not otherwise because of incompatible interfaces.",
    motivation:
      "You have a legacy payment gateway with a processPayment(amount, currency) method, but your new checkout system expects a PaymentProcessor.charge(order) interface. An Adapter wraps the legacy gateway and translates calls from the new interface to the old one.",
    applicability: [
      "You want to use an existing class but its interface does not match what you need",
      "You want to create a reusable class that cooperates with unrelated classes having incompatible interfaces",
      "You need to use several existing subclasses but it is impractical to adapt their interface by subclassing each one",
    ],
    structure:
      "An Adapter class implements the Target interface and wraps an Adaptee. It translates calls from the Target interface into calls on the Adaptee.",
    participants: [
      "Target — defines the domain-specific interface the Client uses",
      "Adaptee — the existing interface that needs adapting",
      "Adapter — adapts the Adaptee interface to the Target interface",
      "Client — collaborates with objects through the Target interface",
    ],
    consequences: [
      "Lets you reuse existing classes even when their interfaces are incompatible",
      "Introduces only one additional object with no need to modify the existing class",
      "Class adapters (via inheritance) cannot adapt a class and all its subclasses",
      "Object adapters (via composition) work with any subclass of the Adaptee",
    ],
    codeExample: `// Legacy analytics SDK
class LegacyAnalytics {
  track(eventName: string, data: Record<string, unknown>): void {
    console.log(\`Legacy: \${eventName}\`, data);
  }
}

// New interface our app expects
interface AnalyticsProvider {
  logEvent(event: { name: string; properties: Map<string, unknown> }): void;
}

// Adapter bridges the gap
class LegacyAnalyticsAdapter implements AnalyticsProvider {
  constructor(private legacy: LegacyAnalytics) {}

  logEvent(event: { name: string; properties: Map<string, unknown> }): void {
    const data = Object.fromEntries(event.properties);
    this.legacy.track(event.name, data);
  }
}`,
    relatedPatterns: ["bridge", "decorator", "facade"],
  },
  {
    slug: "bridge",
    title: "Bridge",
    category: "structural",
    intent:
      "Decouple an abstraction from its implementation so that the two can vary independently.",
    motivation:
      "A notification system needs to support multiple message types (alert, reminder, promotion) across multiple channels (email, SMS, push). Without Bridge, the number of classes explodes as the product of types and channels. Bridge separates the message abstraction from the delivery implementation.",
    applicability: [
      "You want to avoid a permanent binding between an abstraction and its implementation",
      "Both the abstractions and their implementations should be extensible by subclassing",
      "You want to share an implementation among multiple objects and hide that from clients",
    ],
    structure:
      "An Abstraction holds a reference to an Implementor interface. Refined Abstractions extend the Abstraction. Concrete Implementors provide platform-specific implementations.",
    participants: [
      "Abstraction — defines the abstraction's interface and holds a reference to Implementor",
      "RefinedAbstraction — extends the Abstraction interface",
      "Implementor — defines the interface for implementation classes",
      "ConcreteImplementor — implements the Implementor interface",
    ],
    consequences: [
      "Decouples interface and implementation, allowing them to vary independently",
      "Improves extensibility since abstractions and implementations can be extended independently",
      "Hides implementation details from clients",
      "Increases complexity by introducing an additional layer of indirection",
    ],
    codeExample: `// Implementor
interface MessageSender {
  sendMessage(to: string, body: string): void;
}

class EmailSender implements MessageSender {
  sendMessage(to: string, body: string): void {
    console.log(\`Email to \${to}: \${body}\`);
  }
}

class SMSSender implements MessageSender {
  sendMessage(to: string, body: string): void {
    console.log(\`SMS to \${to}: \${body}\`);
  }
}

// Abstraction
abstract class Notification {
  constructor(protected sender: MessageSender) {}
  abstract notify(to: string): void;
}

class AlertNotification extends Notification {
  notify(to: string): void {
    this.sender.sendMessage(to, "URGENT: System alert!");
  }
}

class ReminderNotification extends Notification {
  notify(to: string): void {
    this.sender.sendMessage(to, "Friendly reminder...");
  }
}`,
    relatedPatterns: ["adapter", "abstract-factory", "strategy"],
  },
  {
    slug: "composite",
    title: "Composite",
    category: "structural",
    intent:
      "Compose objects into tree structures to represent part-whole hierarchies. Composite lets clients treat individual objects and compositions of objects uniformly.",
    motivation:
      "A file system has files and directories. Directories contain files and other directories. Operations like getSize() or search() should work the same way on a single file or an entire directory tree. Composite achieves this by giving files and directories the same interface.",
    applicability: [
      "You want to represent part-whole hierarchies of objects",
      "You want clients to treat individual objects and compositions uniformly",
    ],
    structure:
      "A Component interface declares operations common to both simple and complex elements. Leaf implements the Component for primitives. Composite stores child Components and delegates operations to them.",
    participants: [
      "Component — declares the interface for objects in the composition and default behavior",
      "Leaf — represents leaf objects with no children, implementing the Component interface",
      "Composite — stores child components and implements child-related operations",
    ],
    consequences: [
      "Defines class hierarchies of primitive and composite objects that can be composed recursively",
      "Makes the client simple because it treats composites and individual objects uniformly",
      "Makes it easy to add new component types",
      "Can make the design overly general — harder to restrict components of a composite to certain types",
    ],
    codeExample: `interface FileSystemNode {
  getName(): string;
  getSize(): number;
}

class File implements FileSystemNode {
  constructor(private name: string, private size: number) {}
  getName() { return this.name; }
  getSize() { return this.size; }
}

class Directory implements FileSystemNode {
  private children: FileSystemNode[] = [];

  constructor(private name: string) {}

  add(node: FileSystemNode): void {
    this.children.push(node);
  }

  getName() { return this.name; }

  getSize(): number {
    return this.children.reduce(
      (total, child) => total + child.getSize(), 0,
    );
  }
}

const root = new Directory("root");
root.add(new File("readme.md", 1024));
const src = new Directory("src");
src.add(new File("index.ts", 2048));
root.add(src);
console.log(root.getSize()); // 3072`,
    relatedPatterns: ["decorator", "flyweight", "iterator", "visitor"],
  },
  {
    slug: "decorator",
    title: "Decorator",
    category: "structural",
    intent:
      "Attach additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.",
    motivation:
      "A data stream can be compressed, encrypted, or buffered. Instead of creating subclasses for every combination (CompressedEncryptedBufferedStream), the Decorator pattern lets you wrap a stream with any combination of these features at runtime.",
    applicability: [
      "You want to add responsibilities to objects dynamically and transparently without affecting other objects",
      "You want to withdraw responsibilities at runtime",
      "Extension by subclassing is impractical due to an explosion of subclass combinations",
    ],
    structure:
      "A Component interface defines operations. ConcreteComponent provides default behavior. A Decorator base class wraps a Component and delegates to it. Concrete Decorators add behavior before or after delegating.",
    participants: [
      "Component — defines the interface for objects that can have responsibilities added",
      "ConcreteComponent — the object to which additional responsibilities are attached",
      "Decorator — maintains a reference to a Component and conforms to its interface",
      "ConcreteDecorator — adds responsibilities to the component",
    ],
    consequences: [
      "More flexible than static inheritance for combining behaviors",
      "Avoids feature-laden classes high up in the hierarchy",
      "A decorator and its component are not identical — identity checks may break",
      "Can result in many small objects that are hard to debug",
    ],
    codeExample: `interface Logger {
  log(message: string): void;
}

class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(message);
  }
}

class TimestampDecorator implements Logger {
  constructor(private wrapped: Logger) {}
  log(message: string): void {
    this.wrapped.log(\`[\${new Date().toISOString()}] \${message}\`);
  }
}

class JsonDecorator implements Logger {
  constructor(private wrapped: Logger) {}
  log(message: string): void {
    this.wrapped.log(JSON.stringify({ message, level: "info" }));
  }
}

// Compose at runtime
const logger: Logger = new TimestampDecorator(
  new JsonDecorator(new ConsoleLogger()),
);
logger.log("Server started");`,
    relatedPatterns: ["adapter", "composite", "strategy", "proxy"],
  },
  {
    slug: "facade",
    title: "Facade",
    category: "structural",
    intent:
      "Provide a unified interface to a set of interfaces in a subsystem. Facade defines a higher-level interface that makes the subsystem easier to use.",
    motivation:
      "Deploying an application involves provisioning infrastructure, building a Docker image, pushing to a registry, updating Kubernetes manifests, and running health checks. A DeploymentFacade wraps these steps behind a single deploy(config) method, hiding the complexity from the caller.",
    applicability: [
      "You want to provide a simple interface to a complex subsystem",
      "There are many dependencies between clients and the implementation classes of an abstraction",
      "You want to layer your subsystems by defining a facade as the entry point to each level",
    ],
    structure:
      "A Facade class delegates client requests to appropriate subsystem objects. Subsystem classes implement actual functionality but are unaware of the Facade.",
    participants: [
      "Facade — delegates client requests to appropriate subsystem objects and orchestrates interactions",
      "Subsystem classes — implement subsystem functionality and handle work assigned by the Facade",
    ],
    consequences: [
      "Shields clients from subsystem components, reducing the number of objects clients deal with",
      "Promotes weak coupling between the subsystem and its clients",
      "Does not prevent clients from using subsystem classes directly if they need to",
      "Can become a god object coupled to many subsystem classes",
    ],
    codeExample: `class VideoConverter { convert(file: string) { return \`converted_\${file}\`; } }
class AudioExtractor { extract(file: string) { return \`audio_\${file}\`; } }
class Compressor { compress(file: string) { return \`compressed_\${file}\`; } }
class Uploader { upload(file: string) { return \`https://cdn.example.com/\${file}\`; } }

class MediaFacade {
  private converter = new VideoConverter();
  private extractor = new AudioExtractor();
  private compressor = new Compressor();
  private uploader = new Uploader();

  processAndUpload(file: string): string {
    const converted = this.converter.convert(file);
    this.extractor.extract(converted);
    const compressed = this.compressor.compress(converted);
    return this.uploader.upload(compressed);
  }
}

const facade = new MediaFacade();
const url = facade.processAndUpload("video.mp4");`,
    relatedPatterns: ["abstract-factory", "mediator", "singleton"],
  },
  {
    slug: "flyweight",
    title: "Flyweight",
    category: "structural",
    intent:
      "Use sharing to support large numbers of fine-grained objects efficiently by externalizing state that varies between objects.",
    motivation:
      "A text editor represents each character as an object. Storing font, size, and style in every character object is wasteful since most characters share the same formatting. Flyweight extracts shared state (intrinsic) into shared objects and passes varying state (extrinsic) as method parameters.",
    applicability: [
      "An application uses a large number of objects that are mostly identical",
      "Storage costs are high because of the sheer quantity of objects",
      "Most object state can be made extrinsic and passed in by the client",
    ],
    structure:
      "A FlyweightFactory creates and manages Flyweight objects, ensuring proper sharing. Flyweights store intrinsic state; extrinsic state is passed by the client at operation time.",
    participants: [
      "Flyweight — declares the interface for receiving extrinsic state",
      "ConcreteFlyweight — stores intrinsic state and is shareable",
      "FlyweightFactory — creates and manages flyweight objects, ensuring sharing",
      "Client — maintains extrinsic state and computes it at operation time",
    ],
    consequences: [
      "Reduces total number of objects in memory significantly",
      "Reduces memory per object by sharing intrinsic state",
      "Increases runtime cost due to extrinsic state computation and lookup",
      "Complicates the design by splitting state into intrinsic and extrinsic",
    ],
    codeExample: `class TreeType {
  constructor(
    public name: string,
    public color: string,
    public texture: string,
  ) {}

  render(x: number, y: number): void {
    console.log(\`Render \${this.name} at (\${x},\${y})\`);
  }
}

class TreeFactory {
  private static types = new Map<string, TreeType>();

  static getType(name: string, color: string, texture: string): TreeType {
    const key = \`\${name}_\${color}_\${texture}\`;
    if (!this.types.has(key)) {
      this.types.set(key, new TreeType(name, color, texture));
    }
    return this.types.get(key)!;
  }
}

class Tree {
  constructor(
    private x: number,
    private y: number,
    private type: TreeType,
  ) {}

  render(): void {
    this.type.render(this.x, this.y);
  }
}

// 1M trees but only a few shared TreeType flyweights
const oak = TreeFactory.getType("Oak", "green", "rough");
const trees = Array.from({ length: 1_000_000 }, (_, i) =>
  new Tree(Math.random() * 1000, Math.random() * 1000, oak),
);`,
    relatedPatterns: ["composite", "state", "strategy"],
  },
  {
    slug: "proxy",
    title: "Proxy",
    category: "structural",
    intent:
      "Provide a surrogate or placeholder for another object to control access to it.",
    motivation:
      "Loading a high-resolution image from disk is expensive. A Proxy object stands in for the real image, deferring the expensive load until the image is actually displayed. The proxy can also add access control, logging, or caching transparently.",
    applicability: [
      "You need a lazy-initialized heavyweight object (virtual proxy)",
      "You want to control access to an object based on permissions (protection proxy)",
      "You need a local representative for a remote object (remote proxy)",
      "You want to add logging or caching around operations (smart reference)",
    ],
    structure:
      "A Subject interface defines operations. RealSubject provides the actual implementation. Proxy holds a reference to RealSubject, controls access to it, and conforms to the same interface.",
    participants: [
      "Subject — defines the common interface for RealSubject and Proxy",
      "RealSubject — the real object that the proxy represents",
      "Proxy — controls access to the RealSubject and may create or destroy it",
    ],
    consequences: [
      "Introduces a level of indirection with various uses (access control, lazy loading, caching)",
      "Remote proxy hides the fact that an object resides in a different address space",
      "Virtual proxy can optimize expensive object creation and loading",
      "Adds complexity and potential latency from the extra layer of indirection",
    ],
    codeExample: `interface DataService {
  fetchData(query: string): Promise<unknown>;
}

class RealDataService implements DataService {
  async fetchData(query: string): Promise<unknown> {
    console.log(\`Fetching: \${query}\`);
    return { results: [] };
  }
}

class CachingProxy implements DataService {
  private cache = new Map<string, unknown>();
  private service = new RealDataService();

  async fetchData(query: string): Promise<unknown> {
    if (this.cache.has(query)) {
      console.log(\`Cache hit: \${query}\`);
      return this.cache.get(query);
    }
    const result = await this.service.fetchData(query);
    this.cache.set(query, result);
    return result;
  }
}`,
    relatedPatterns: ["adapter", "decorator", "facade"],
  },
  // ── Behavioral ───────────────────────────────────────────────
  {
    slug: "chain-of-responsibility",
    title: "Chain of Responsibility",
    category: "behavioral",
    intent:
      "Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle the request. Chain the receiving objects and pass the request along the chain until an object handles it.",
    motivation:
      "A request validation pipeline must check authentication, rate limits, input validation, and authorization in order. Each check either handles the request (rejects it) or passes it to the next handler. The Chain of Responsibility pattern models this pipeline cleanly.",
    applicability: [
      "More than one object may handle a request and the handler is not known in advance",
      "You want to issue a request to one of several objects without specifying the receiver explicitly",
      "The set of objects that can handle a request should be specified dynamically",
    ],
    structure:
      "A Handler interface declares a handle() method and a successor reference. Concrete Handlers check if they can handle the request; if not, they forward it to the successor.",
    participants: [
      "Handler — defines the interface for handling requests and optionally a successor link",
      "ConcreteHandler — handles requests it is responsible for; forwards others to the successor",
      "Client — initiates the request to a ConcreteHandler in the chain",
    ],
    consequences: [
      "Reduced coupling between sender and receiver",
      "Added flexibility in assigning responsibilities to objects",
      "Receipt of a request is not guaranteed — it may fall off the end of the chain unhandled",
      "Can be hard to observe and debug the flow of requests through the chain",
    ],
    codeExample: `abstract class Middleware {
  private next: Middleware | null = null;

  setNext(middleware: Middleware): Middleware {
    this.next = middleware;
    return middleware;
  }

  handle(request: Request): Response | null {
    if (this.next) return this.next.handle(request);
    return null;
  }
}

class AuthMiddleware extends Middleware {
  handle(request: Request): Response | null {
    if (!request.headers.get("Authorization")) {
      return new Response("Unauthorized", { status: 401 });
    }
    return super.handle(request);
  }
}

class RateLimitMiddleware extends Middleware {
  private count = 0;
  handle(request: Request): Response | null {
    if (++this.count > 100) {
      return new Response("Too Many Requests", { status: 429 });
    }
    return super.handle(request);
  }
}`,
    relatedPatterns: ["composite", "command", "mediator"],
  },
  {
    slug: "command",
    title: "Command",
    category: "behavioral",
    intent:
      "Encapsulate a request as an object, thereby letting you parameterize clients with different requests, queue or log requests, and support undoable operations.",
    motivation:
      "A text editor needs to support undo/redo for arbitrary operations: typing, deleting, formatting. By encapsulating each operation as a Command object with execute() and undo() methods, the editor can maintain a history stack and reverse operations in order.",
    applicability: [
      "You want to parameterize objects with an action to perform",
      "You want to specify, queue, and execute requests at different times",
      "You need support for undoable operations",
      "You need support for logging changes so they can be reapplied after a crash",
    ],
    structure:
      "A Command interface declares execute() and optionally undo(). Concrete Commands bind a Receiver to an action. An Invoker asks the Command to carry out the request.",
    participants: [
      "Command — declares the execute/undo interface",
      "ConcreteCommand — binds a Receiver to an action and implements execute/undo",
      "Invoker — asks the command to carry out the request",
      "Receiver — knows how to perform the actual work",
    ],
    consequences: [
      "Decouples the invoker from the object that performs the operation",
      "Commands can be composed into composite (macro) commands",
      "Easy to add new commands without changing existing code",
      "Can lead to an explosion of small command classes",
    ],
    codeExample: `interface Command {
  execute(): void;
  undo(): void;
}

class AddTextCommand implements Command {
  constructor(
    private document: string[],
    private text: string,
    private position: number,
  ) {}

  execute(): void {
    this.document.splice(this.position, 0, this.text);
  }

  undo(): void {
    this.document.splice(this.position, 1);
  }
}

class CommandHistory {
  private history: Command[] = [];
  private pointer = -1;

  execute(cmd: Command): void {
    cmd.execute();
    this.history = this.history.slice(0, this.pointer + 1);
    this.history.push(cmd);
    this.pointer++;
  }

  undo(): void {
    if (this.pointer >= 0) {
      this.history[this.pointer].undo();
      this.pointer--;
    }
  }
}`,
    relatedPatterns: ["memento", "composite", "chain-of-responsibility"],
  },
  {
    slug: "iterator",
    title: "Iterator",
    category: "behavioral",
    intent:
      "Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation.",
    motivation:
      "A tree data structure can be traversed in multiple ways: in-order, pre-order, post-order, level-order. Rather than bloating the tree class with traversal methods, the Iterator pattern extracts each traversal strategy into a separate iterator object.",
    applicability: [
      "You want to access an aggregate object's contents without exposing its internal representation",
      "You want to support multiple traversals of aggregate objects",
      "You want to provide a uniform interface for traversing different aggregate structures",
    ],
    structure:
      "An Iterator interface declares hasNext() and next() methods. ConcreteIterator implements traversal for a specific aggregate. The Aggregate interface declares a method to create an Iterator.",
    participants: [
      "Iterator — defines the interface for accessing and traversing elements",
      "ConcreteIterator — implements the Iterator interface and tracks the current position",
      "Aggregate — defines an interface for creating an Iterator",
      "ConcreteAggregate — returns a ConcreteIterator instance",
    ],
    consequences: [
      "Supports variations in the traversal of an aggregate",
      "Simplifies the aggregate interface by extracting traversal logic",
      "More than one traversal can be in progress simultaneously",
      "Iterators can become complex for graph-like structures with cycles",
    ],
    codeExample: `class TreeNode<T> {
  constructor(
    public value: T,
    public left: TreeNode<T> | null = null,
    public right: TreeNode<T> | null = null,
  ) {}

  *inOrder(): Generator<T> {
    if (this.left) yield* this.left.inOrder();
    yield this.value;
    if (this.right) yield* this.right.inOrder();
  }

  *preOrder(): Generator<T> {
    yield this.value;
    if (this.left) yield* this.left.preOrder();
    if (this.right) yield* this.right.preOrder();
  }

  *levelOrder(): Generator<T> {
    const queue: TreeNode<T>[] = [this];
    while (queue.length > 0) {
      const node = queue.shift()!;
      yield node.value;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
}`,
    relatedPatterns: ["composite", "visitor", "memento"],
  },
  {
    slug: "mediator",
    title: "Mediator",
    category: "behavioral",
    intent:
      "Define an object that encapsulates how a set of objects interact. Mediator promotes loose coupling by keeping objects from referring to each other explicitly.",
    motivation:
      "In a chat room, users should not hold direct references to every other user. A ChatRoom mediator receives messages from any user and broadcasts them to others. This prevents an N-to-N coupling explosion and centralizes communication logic.",
    applicability: [
      "A set of objects communicate in well-defined but complex ways, leading to unstructured and hard-to-understand interdependencies",
      "Reusing an object is difficult because it refers to and communicates with many other objects",
      "Behavior that is distributed among several classes should be customizable without excessive subclassing",
    ],
    structure:
      "A Mediator interface declares communication methods. ConcreteMediator implements coordination logic. Colleague classes communicate through the Mediator rather than directly.",
    participants: [
      "Mediator — defines the interface for communication between Colleague objects",
      "ConcreteMediator — implements coordination by routing messages between Colleagues",
      "Colleague — each colleague communicates with the Mediator rather than with other colleagues directly",
    ],
    consequences: [
      "Limits subclassing since behavior changes are localized in the mediator",
      "Decouples colleagues, allowing them to vary independently",
      "Simplifies object protocols from many-to-many to one-to-many",
      "The mediator itself can become a monolithic god object if not carefully scoped",
    ],
    codeExample: `interface ChatMediator {
  sendMessage(message: string, sender: User): void;
  addUser(user: User): void;
}

class ChatRoom implements ChatMediator {
  private users: User[] = [];

  addUser(user: User): void {
    this.users.push(user);
  }

  sendMessage(message: string, sender: User): void {
    for (const user of this.users) {
      if (user !== sender) {
        user.receive(message, sender.name);
      }
    }
  }
}

class User {
  constructor(public name: string, private chat: ChatMediator) {
    chat.addUser(this);
  }

  send(message: string): void {
    this.chat.sendMessage(message, this);
  }

  receive(message: string, from: string): void {
    console.log(\`\${this.name} received from \${from}: \${message}\`);
  }
}`,
    relatedPatterns: ["facade", "observer", "command"],
  },
  {
    slug: "memento",
    title: "Memento",
    category: "behavioral",
    intent:
      "Without violating encapsulation, capture and externalize an object's internal state so that the object can be restored to this state later.",
    motivation:
      "A text editor needs undo functionality. Rather than exposing the editor's internal state to the undo mechanism, the editor creates Memento objects that encapsulate a snapshot of its state. A Caretaker stores these mementos and restores them on demand.",
    applicability: [
      "A snapshot of an object's state must be saved so it can be restored later",
      "A direct interface to obtaining the state would expose implementation details and break encapsulation",
    ],
    structure:
      "An Originator creates a Memento containing a snapshot of its current state and uses the Memento to restore itself. A Caretaker stores Mementos but never operates on their contents.",
    participants: [
      "Memento — stores the internal state of the Originator as an opaque snapshot",
      "Originator — creates a Memento with its current state and restores state from a Memento",
      "Caretaker — manages Memento storage without examining or modifying their contents",
    ],
    consequences: [
      "Preserves encapsulation boundaries by not exposing internal state",
      "Simplifies the Originator by externalizing state management to the Caretaker",
      "Can be expensive if Originator state is large — consider incremental snapshots",
      "The Caretaker does not know how much state is in a Memento, so storage cost may be unpredictable",
    ],
    codeExample: `class EditorMemento {
  constructor(
    readonly content: string,
    readonly cursorPosition: number,
  ) {}
}

class TextEditor {
  private content = "";
  private cursor = 0;

  type(text: string): void {
    this.content =
      this.content.slice(0, this.cursor) +
      text +
      this.content.slice(this.cursor);
    this.cursor += text.length;
  }

  save(): EditorMemento {
    return new EditorMemento(this.content, this.cursor);
  }

  restore(memento: EditorMemento): void {
    this.content = memento.content;
    this.cursor = memento.cursorPosition;
  }

  getContent(): string {
    return this.content;
  }
}

const editor = new TextEditor();
editor.type("Hello ");
const snapshot = editor.save();
editor.type("World");
editor.restore(snapshot); // back to "Hello "`,
    relatedPatterns: ["command", "iterator", "state"],
  },
  {
    slug: "observer",
    title: "Observer",
    category: "behavioral",
    intent:
      "Define a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
    motivation:
      "A stock price feed has many displays: a chart, a ticker, an alert system. When the price changes, all displays must update. The Observer pattern lets the feed (subject) notify all registered displays (observers) without knowing their concrete types.",
    applicability: [
      "When a change to one object requires changing others and you do not know how many objects need to change",
      "When an object should notify other objects without making assumptions about who they are",
      "When an abstraction has two aspects where one depends on the other — encapsulating them in separate objects lets you vary and reuse them independently",
    ],
    structure:
      "A Subject maintains a list of Observers and notifies them of state changes. Observers implement an update() method that the Subject calls. Concrete Subjects store state; Concrete Observers react to updates.",
    participants: [
      "Subject — knows its observers and provides methods to attach/detach them",
      "Observer — defines an update interface for receiving notifications",
      "ConcreteSubject — stores state and notifies observers when state changes",
      "ConcreteObserver — implements the update method to react to changes",
    ],
    consequences: [
      "Loose coupling between subject and observers — they can vary independently",
      "Support for broadcast communication to multiple observers",
      "Unexpected cascading updates if observers trigger further changes",
      "No guarantee of notification order among observers",
    ],
    codeExample: `type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners = new Map<string, Set<Listener<T>>>();

  on(event: string, listener: Listener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener);
  }

  emit(event: string, data: T): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(data);
    }
  }
}

const prices = new EventEmitter<number>();
prices.on("AAPL", (price) => console.log(\`Chart: $\${price}\`));
prices.on("AAPL", (price) => {
  if (price > 200) console.log("ALERT: AAPL above $200!");
});
prices.emit("AAPL", 215);`,
    relatedPatterns: ["mediator", "singleton", "state"],
  },
  {
    slug: "state",
    title: "State",
    category: "behavioral",
    intent:
      "Allow an object to alter its behavior when its internal state changes. The object will appear to change its class.",
    motivation:
      "A vending machine behaves differently depending on its state: idle, has money, dispensing, out of stock. Instead of a massive switch statement, the State pattern encapsulates each state as a separate class with its own behavior for each action.",
    applicability: [
      "An object's behavior depends on its state and it must change behavior at runtime",
      "Operations have large conditional statements that depend on the object's state",
      "State transitions are well-defined and should be modeled explicitly",
    ],
    structure:
      "A Context delegates state-specific behavior to the current State object. State subclasses implement behavior for each state and trigger transitions by setting the Context's state.",
    participants: [
      "Context — maintains a reference to the current State and delegates behavior to it",
      "State — defines the interface for encapsulating behavior associated with a state of the Context",
      "ConcreteState — each subclass implements behavior for one state of the Context",
    ],
    consequences: [
      "Localizes state-specific behavior in separate state classes",
      "Makes state transitions explicit and visible",
      "State objects can be shared if they hold no instance-specific data (Flyweight)",
      "Increases the number of classes in the system",
    ],
    codeExample: `interface OrderState {
  next(order: Order): void;
  cancel(order: Order): void;
  toString(): string;
}

class PendingState implements OrderState {
  next(order: Order) { order.setState(new ProcessingState()); }
  cancel(order: Order) { order.setState(new CancelledState()); }
  toString() { return "Pending"; }
}

class ProcessingState implements OrderState {
  next(order: Order) { order.setState(new ShippedState()); }
  cancel(order: Order) { console.log("Cannot cancel while processing"); }
  toString() { return "Processing"; }
}

class ShippedState implements OrderState {
  next(order: Order) { order.setState(new DeliveredState()); }
  cancel(order: Order) { console.log("Cannot cancel shipped order"); }
  toString() { return "Shipped"; }
}

class DeliveredState implements OrderState {
  next(_order: Order) { console.log("Already delivered"); }
  cancel(_order: Order) { console.log("Cannot cancel delivered order"); }
  toString() { return "Delivered"; }
}

class CancelledState implements OrderState {
  next(_order: Order) { console.log("Order cancelled"); }
  cancel(_order: Order) { console.log("Already cancelled"); }
  toString() { return "Cancelled"; }
}

class Order {
  private state: OrderState = new PendingState();
  setState(state: OrderState) { this.state = state; }
  next() { this.state.next(this); }
  cancel() { this.state.cancel(this); }
  getStatus() { return this.state.toString(); }
}`,
    relatedPatterns: ["strategy", "flyweight", "singleton"],
  },
  {
    slug: "strategy",
    title: "Strategy",
    category: "behavioral",
    intent:
      "Define a family of algorithms, encapsulate each one, and make them interchangeable. Strategy lets the algorithm vary independently from clients that use it.",
    motivation:
      "A sorting library supports multiple algorithms: quicksort for general use, merge sort for stable sorting, insertion sort for nearly-sorted data. The Strategy pattern lets the client choose the algorithm at runtime without modifying the sorting context.",
    applicability: [
      "Many related classes differ only in their behavior — strategies let you configure a class with one of many behaviors",
      "You need different variants of an algorithm with different space-time trade-offs",
      "An algorithm uses data that clients should not know about — Strategy lets you avoid exposing complex data structures",
    ],
    structure:
      "A Context is configured with a Strategy object. The Strategy interface declares the algorithm. ConcreteStrategy classes implement specific algorithms. The Context delegates to the Strategy.",
    participants: [
      "Strategy — declares the interface common to all supported algorithms",
      "ConcreteStrategy — implements the algorithm using the Strategy interface",
      "Context — is configured with a ConcreteStrategy and delegates algorithmic work to it",
    ],
    consequences: [
      "Family of related algorithms defined in their own classes, ready to be reused",
      "An alternative to subclassing for varying behavior",
      "Eliminates conditional statements for selecting behavior",
      "Clients must be aware of different strategies to choose the appropriate one",
    ],
    codeExample: `interface CompressionStrategy {
  compress(data: Uint8Array): Uint8Array;
  name: string;
}

class GzipStrategy implements CompressionStrategy {
  name = "gzip";
  compress(data: Uint8Array): Uint8Array {
    console.log(\`Gzip compressing \${data.length} bytes\`);
    return data; // simplified
  }
}

class BrotliStrategy implements CompressionStrategy {
  name = "brotli";
  compress(data: Uint8Array): Uint8Array {
    console.log(\`Brotli compressing \${data.length} bytes\`);
    return data; // simplified
  }
}

class FileProcessor {
  constructor(private strategy: CompressionStrategy) {}

  setStrategy(strategy: CompressionStrategy): void {
    this.strategy = strategy;
  }

  process(data: Uint8Array): Uint8Array {
    console.log(\`Using \${this.strategy.name} strategy\`);
    return this.strategy.compress(data);
  }
}`,
    relatedPatterns: ["state", "template-method", "flyweight"],
  },
  {
    slug: "template-method",
    title: "Template Method",
    category: "behavioral",
    intent:
      "Define the skeleton of an algorithm in an operation, deferring some steps to subclasses. Template Method lets subclasses redefine certain steps of an algorithm without changing the algorithm's structure.",
    motivation:
      "Data import pipelines share the same high-level steps: connect, extract, transform, load, cleanup. The details of each step vary by data source (CSV, API, database). Template Method defines the pipeline skeleton, letting subclasses override individual steps.",
    applicability: [
      "You want to implement the invariant parts of an algorithm once and leave it to subclasses to implement the variable parts",
      "Common behavior among subclasses should be factored into a common class to avoid duplication",
      "You want to control at which points subclasses can extend the algorithm",
    ],
    structure:
      "An AbstractClass defines the template method as a sequence of steps. Some steps are implemented in the AbstractClass; others are abstract (primitive operations) that subclasses must implement.",
    participants: [
      "AbstractClass — defines the template method and declares abstract primitive operations",
      "ConcreteClass — implements the primitive operations to carry out subclass-specific steps",
    ],
    consequences: [
      "Fundamental technique for code reuse — pull common behavior into a single place",
      "Leads to an inverted control structure (Hollywood Principle: do not call us, we will call you)",
      "Template methods call primitive operations, factory methods, and hook operations",
      "Subclasses are constrained to the skeleton defined by the template method",
    ],
    codeExample: `abstract class DataPipeline {
  // Template method — defines the skeleton
  run(): void {
    this.connect();
    const raw = this.extract();
    const transformed = this.transform(raw);
    this.load(transformed);
    this.cleanup();
  }

  abstract connect(): void;
  abstract extract(): unknown[];
  abstract transform(data: unknown[]): unknown[];
  abstract load(data: unknown[]): void;

  // Hook — optional override
  cleanup(): void {
    console.log("Default cleanup");
  }
}

class CSVPipeline extends DataPipeline {
  connect() { console.log("Opening CSV file"); }
  extract() { return [{ name: "Alice" }, { name: "Bob" }]; }
  transform(data: unknown[]) { return data; }
  load(data: unknown[]) { console.log(\`Loaded \${data.length} rows\`); }
}`,
    relatedPatterns: ["factory-method", "strategy", "hook"],
  },
  {
    slug: "visitor",
    title: "Visitor",
    category: "behavioral",
    intent:
      "Represent an operation to be performed on the elements of an object structure. Visitor lets you define a new operation without changing the classes of the elements on which it operates.",
    motivation:
      "A compiler's AST has many node types: expressions, statements, declarations. Operations like type checking, code generation, and optimization need to traverse the AST differently. Adding each operation to every node class is impractical. Visitor lets you define new operations in separate visitor classes.",
    applicability: [
      "An object structure contains many classes with differing interfaces and you want to perform operations that depend on their concrete classes",
      "Many distinct and unrelated operations need to be performed on objects in a structure",
      "The classes defining the object structure rarely change but you often want to define new operations",
    ],
    structure:
      "A Visitor interface declares a visit method for each ConcreteElement type. ConcreteVisitors implement specific operations. Elements declare an accept(visitor) method that calls the appropriate visit method.",
    participants: [
      "Visitor — declares a visit operation for each ConcreteElement class",
      "ConcreteVisitor — implements each operation declared by Visitor for a specific traversal",
      "Element — defines an accept() method that takes a visitor",
      "ConcreteElement — implements accept() by calling the visitor's corresponding visit method",
    ],
    consequences: [
      "Makes adding new operations easy — just add a new visitor",
      "Groups related operations in a single visitor class",
      "Adding new ConcreteElement classes is hard — every visitor must be updated",
      "Can break encapsulation by requiring elements to expose internal state",
    ],
    codeExample: `interface ASTVisitor {
  visitNumber(node: NumberNode): string;
  visitBinary(node: BinaryNode): string;
}

interface ASTNode {
  accept(visitor: ASTVisitor): string;
}

class NumberNode implements ASTNode {
  constructor(public value: number) {}
  accept(visitor: ASTVisitor) { return visitor.visitNumber(this); }
}

class BinaryNode implements ASTNode {
  constructor(
    public op: string,
    public left: ASTNode,
    public right: ASTNode,
  ) {}
  accept(visitor: ASTVisitor) { return visitor.visitBinary(this); }
}

class PrintVisitor implements ASTVisitor {
  visitNumber(node: NumberNode) { return String(node.value); }
  visitBinary(node: BinaryNode) {
    const l = node.left.accept(this);
    const r = node.right.accept(this);
    return \`(\${l} \${node.op} \${r})\`;
  }
}

const ast = new BinaryNode(
  "+",
  new NumberNode(1),
  new BinaryNode("*", new NumberNode(2), new NumberNode(3)),
);
console.log(ast.accept(new PrintVisitor())); // (1 + (2 * 3))`,
    relatedPatterns: ["composite", "iterator", "interpreter"],
  },
  // ── Modern ─────────────────────────────────────────────────
  {
    slug: "repository",
    title: "Repository",
    category: "modern",
    intent:
      "Mediate between the domain and data mapping layers using a collection-like interface for accessing domain objects, decoupling business logic from persistence details.",
    motivation:
      "When SQL queries are scattered throughout business logic, swapping databases means rewriting everything. The Repository pattern provides a clean abstraction that makes the data store interchangeable — today PostgreSQL, tomorrow DynamoDB — without touching a single line of domain code.",
    applicability: [
      "You need to swap data stores (SQL, NoSQL, in-memory) without changing business logic",
      "You want to unit-test domain logic without a real database",
      "Multiple consumers need consistent data access through a unified API",
    ],
    structure:
      "A Repository interface declares CRUD-like methods (findById, save, delete). Concrete implementations (SQLRepository, MongoRepository, InMemoryRepository) provide the actual persistence logic.",
    participants: [
      "Repository<T> — defines the collection-like interface for accessing entities",
      "ConcreteRepository — implements persistence using a specific data store (SQL, Mongo, etc.)",
      "Entity — the domain object managed by the repository",
    ],
    consequences: [
      "Business logic is completely decoupled from storage technology",
      "Easy to mock for unit testing",
      "Provides a single place to optimize queries per data store",
      "Adds an abstraction layer that may be unnecessary for simple CRUD apps",
    ],
    codeExample: `interface Repository<T> {
  findById(id: string): T | null;
  findAll(): T[];
  save(entity: T): void;
  delete(id: string): void;
}

class InMemoryUserRepo implements Repository<User> {
  private store = new Map<string, User>();
  findById(id: string) { return this.store.get(id) ?? null; }
  findAll() { return [...this.store.values()]; }
  save(user: User) { this.store.set(user.id, user); }
  delete(id: string) { this.store.delete(id); }
}`,
    relatedPatterns: ["strategy", "factory-method", "proxy"],
  },
  {
    slug: "cqrs",
    title: "CQRS",
    category: "modern",
    intent:
      "Separate read and write operations into distinct models, allowing each to be optimized, scaled, and evolved independently.",
    motivation:
      "In an e-commerce platform where product browsing generates 100x more traffic than order placement, using the same model for reads and writes creates contention. CQRS (Command Query Responsibility Segregation) lets you optimize each path independently — denormalized views for fast reads, normalized writes for consistency.",
    applicability: [
      "Read and write workloads have vastly different scaling requirements",
      "You need different data models optimized for queries vs commands",
      "Event-driven architectures where write events feed read projections",
    ],
    structure:
      "Commands flow through a CommandBus to CommandHandlers that mutate the write model. Queries flow through a QueryBus to QueryHandlers that read from optimized read models. An event bus synchronizes the two sides.",
    participants: [
      "Command — encapsulates a write intention (CreateOrder, UpdateUser)",
      "CommandHandler — processes commands and mutates the write model",
      "Query — encapsulates a read request (GetOrderById, SearchProducts)",
      "QueryHandler — reads from the optimized read model and returns results",
      "CommandBus / QueryBus — routes commands and queries to their handlers",
    ],
    consequences: [
      "Read and write paths scale independently",
      "Each model is optimized for its specific workload",
      "Introduces eventual consistency between read and write models",
      "Significantly more infrastructure complexity than simple CRUD",
    ],
    codeExample: `interface Command { type: string; payload: unknown; }
interface Query { type: string; filters: unknown; }

class CommandBus {
  private handlers = new Map<string, (cmd: Command) => void>();
  register(type: string, handler: (cmd: Command) => void) {
    this.handlers.set(type, handler);
  }
  dispatch(cmd: Command) { this.handlers.get(cmd.type)?.(cmd); }
}

class QueryBus {
  private handlers = new Map<string, (q: Query) => unknown>();
  register(type: string, handler: (q: Query) => unknown) {
    this.handlers.set(type, handler);
  }
  execute(q: Query) { return this.handlers.get(q.type)?.(q); }
}`,
    relatedPatterns: ["event-sourcing", "mediator", "observer"],
  },
  {
    slug: "event-sourcing",
    title: "Event Sourcing",
    category: "modern",
    intent:
      "Store all changes to application state as a sequence of immutable events, enabling complete audit trails and the ability to reconstruct state at any point in time.",
    motivation:
      "In a banking system, storing only the current balance loses the history of how it got there. Event Sourcing captures every deposit, withdrawal, and transfer as an immutable event. The current balance is derived by replaying events — just like Git derives the working tree from commit history.",
    applicability: [
      "You need a complete, immutable audit trail of all state changes",
      "You need to reconstruct state at any point in time (time-travel debugging)",
      "Domain events are first-class business concepts, not just technical plumbing",
    ],
    structure:
      "An EventStore appends immutable Event objects. Aggregates apply events to transition state. The current state is rebuilt by replaying all events (with optional snapshots for performance).",
    participants: [
      "Event — an immutable record of something that happened (MoneyDeposited, OrderPlaced)",
      "EventStore — append-only store that persists events and retrieves them by aggregate ID",
      "Aggregate — domain object that applies events to transition its state",
      "EventBus — publishes events to subscribers for building read models or triggering side effects",
    ],
    consequences: [
      "Complete audit trail with full history of every state change",
      "Time-travel: reconstruct state at any point by replaying events up to that moment",
      "Event schema evolution is difficult and requires careful versioning",
      "Storage grows unbounded without snapshotting; replaying thousands of events can be slow",
    ],
    codeExample: `abstract class Event {
  constructor(
    public readonly aggregateId: string,
    public readonly timestamp = new Date(),
  ) {}
}

class MoneyDeposited extends Event {
  constructor(id: string, public readonly amount: number) { super(id); }
}

class EventStore {
  private events: Event[] = [];
  append(event: Event) { this.events.push(event); }
  getEvents(aggregateId: string) {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }
}`,
    relatedPatterns: ["cqrs", "memento", "command"],
  },
  {
    slug: "saga",
    title: "Saga",
    category: "modern",
    intent:
      "Manage distributed transactions across multiple microservices by defining a sequence of local transactions, each paired with a compensating action that undoes it if a later step fails.",
    motivation:
      "An e-commerce checkout must reserve inventory, charge the credit card, and confirm the order across three services. If the card charge fails after inventory was reserved, that inventory must be released. The Saga pattern coordinates these steps without requiring a distributed two-phase commit.",
    applicability: [
      "A business process spans multiple services that each own their own database",
      "You need transaction-like guarantees across service boundaries without 2PC",
      "Each step has a clear compensating (undo) action for rollback",
    ],
    structure:
      "A SagaOrchestrator executes SagaSteps in sequence. Each step has an execute() and a compensate() method. On failure, the orchestrator runs compensating actions in reverse order for all completed steps.",
    participants: [
      "SagaOrchestrator — coordinates step execution and triggers compensation on failure",
      "SagaStep — defines execute() for the forward action and compensate() for rollback",
      "SagaState — tracks the saga lifecycle (PENDING, RUNNING, COMPLETED, COMPENSATING, FAILED)",
      "SagaContext — shared state passed between steps to carry transaction data",
    ],
    consequences: [
      "Distributed transaction coordination without two-phase commit",
      "Each service stays autonomous with its own local transactions",
      "Compensating actions are hard to get right and test exhaustively",
      "Eventual consistency and complex debugging of distributed rollback scenarios",
    ],
    codeExample: `interface SagaStep {
  execute(ctx: Map<string, unknown>): Promise<void>;
  compensate(ctx: Map<string, unknown>): Promise<void>;
}

class SagaOrchestrator {
  private completed: SagaStep[] = [];
  constructor(private steps: SagaStep[]) {}

  async execute(ctx: Map<string, unknown>) {
    for (const step of this.steps) {
      try {
        await step.execute(ctx);
        this.completed.push(step);
      } catch {
        await this.compensate(ctx);
        throw new Error("Saga failed, compensated.");
      }
    }
  }

  private async compensate(ctx: Map<string, unknown>) {
    for (const step of [...this.completed].reverse()) {
      await step.compensate(ctx);
    }
  }
}`,
    relatedPatterns: ["command", "chain-of-responsibility", "state"],
  },
];

/** Look up a design pattern by slug. */
export function getDesignPatternBySlug(
  slug: string,
): DesignPatternDefinition | undefined {
  return DESIGN_PATTERNS.find((p) => p.slug === slug);
}

/** Return all design pattern slugs for static generation. */
export function getAllDesignPatternSlugs(): string[] {
  return DESIGN_PATTERNS.map((p) => p.slug);
}

/** Return related patterns for a given slug. */
export function getRelatedDesignPatterns(
  slug: string,
): DesignPatternDefinition[] {
  const pattern = getDesignPatternBySlug(slug);
  if (!pattern) return [];
  return pattern.relatedPatterns
    .map((relSlug) => getDesignPatternBySlug(relSlug))
    .filter((p): p is DesignPatternDefinition => p !== undefined);
}

/** Return all patterns in a given category. */
export function getPatternsByCategory(
  category: PatternCategory,
): DesignPatternDefinition[] {
  return DESIGN_PATTERNS.filter((p) => p.category === category);
}
