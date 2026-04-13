// ─────────────────────────────────────────────────────────────
// Architex — Design Pattern Templates (LLD-019 to LLD-022)
// ─────────────────────────────────────────────────────────────
//
// 36 design patterns: 5 creational, 7 structural, 11 behavioral, 4 modern, 4 resilience, 2 concurrency, 3 ai-agent.
// Each includes UML class definitions, relationships, code samples,
// real-world examples, and usage guidance.
// ─────────────────────────────────────────────────────────────

import type { DesignPattern, PatternCategory } from "./types";

// ── Helper: generate relationship ids ──────────────────────

let _relId = 0;
function rid(): string {
  return `rel-${++_relId}`;
}

// ════════════════════════════════════════════════════════════
//  CREATIONAL PATTERNS
// ════════════════════════════════════════════════════════════

const singleton: DesignPattern = {
  id: "singleton",
  name: "Singleton",
  category: "creational",
  description:
    "Your app needs exactly ONE database connection pool shared across all services. Creating multiple pools wastes memory and causes connection conflicts. The Singleton pattern ensures a class has only one instance and provides a global point of access to it.",
  analogy: "Think of a company's CEO. No matter which department you ask, they all report to the same CEO. You can't appoint a second one — the organization enforces exactly one.",
  difficulty: 1,
  tradeoffs: "You gain: guaranteed single instance and a global access point. You pay: global state makes unit testing harder — you can't easily mock or reset it between tests.",
  summary: [
    "Singleton = one instance, global access, private constructor",
    "Key insight: the class itself controls its instantiation, not the caller",
    "Use when: exactly one shared resource is needed (config, pool, logger)",
  ],
  youAlreadyUseThis: [
    "Node.js module cache (require() returns the same object)",
    "React createContext() (one provider, many consumers)",
    "Python logging.getLogger() (same logger instance per name)",
  ],
  predictionPrompts: [
    {
      question: "Can you create two different Singleton instances by calling the constructor twice?",
      answer: "No — the constructor is private. Only getInstance() can create the instance, and it reuses the existing one.",
    },
  ],
  classes: [
    {
      id: "singleton-class",
      name: "Singleton",
      stereotype: "class",
      attributes: [
        { id: "singleton-class-attr-0", name: "instance", type: "Singleton", visibility: "-" },
        { id: "singleton-class-attr-1", name: "data", type: "Map<string, string>", visibility: "-" },
      ],
      methods: [
        { id: "singleton-class-meth-0", name: "constructor", returnType: "void", params: [], visibility: "-" },
        { id: "singleton-class-meth-1", name: "getInstance", returnType: "Singleton", params: [], visibility: "+" },
        { id: "singleton-class-meth-2", name: "getData", returnType: "string", params: ["key: string"], visibility: "+" },
        { id: "singleton-class-meth-3", name: "setData", returnType: "void", params: ["key: string", "value: string"], visibility: "+" },
      ],
      x: 200,
      y: 100,
    },
  ],
  relationships: [],
  code: {
    typescript: `class Singleton {
  // Static field ensures the instance lives on the class, not on any particular object.
  // This is what makes it "one per class" rather than "one per import."
  private static instance: Singleton;
  private data = new Map<string, string>();

  // Private constructor is the enforcement mechanism — without it, anyone could call \`new Singleton()\`.
  // This forces all access through getInstance(), which is where we control instantiation.
  private constructor() {}

  static getInstance(): Singleton {
    // Lazy initialization: we don't create until first request.
    // Tradeoff: simpler than eager init, but NOT thread-safe in multi-threaded envs.
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  getData(key: string): string | undefined {
    return this.data.get(key);
  }

  setData(key: string, value: string): void {
    this.data.set(key, value);
  }
}

// Usage
const a = Singleton.getInstance();
const b = Singleton.getInstance();
console.log(a === b); // true

// ─── Thread-Safe Variant (Module-Scoped) ────────────────
// In TypeScript/Node.js, ES modules are evaluated once and cached.
// Exporting a single instance from a module is inherently thread-safe
// because the module system guarantees single evaluation.

// singleton.ts (module-scoped approach)
// const instance = new Map<string, string>();
//
// export function getData(key: string): string | undefined {
//   return instance.get(key);
// }
//
// export function setData(key: string, value: string): void {
//   instance.set(key, value);
// }
//
// Every import of this module shares the same \`instance\`.
// No class needed — the module IS the singleton.`,
    python: `class Singleton:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._data = {}
        return cls._instance

    def get_data(self, key: str) -> str | None:
        return self._data.get(key)

    def set_data(self, key: str, value: str) -> None:
        self._data[key] = value

# Usage
a = Singleton()
b = Singleton()
print(a is b)  # True

# ─── Thread-Safe Variant (with threading.Lock) ───────────
# In multi-threaded Python, __new__ alone has a race condition.
# Use a lock to ensure only one thread creates the instance.

# import threading
#
# class ThreadSafeSingleton:
#     _instance = None
#     _lock = threading.Lock()
#
#     def __new__(cls):
#         if cls._instance is None:
#             with cls._lock:
#                 # Double-checked locking
#                 if cls._instance is None:
#                     cls._instance = super().__new__(cls)
#                     cls._instance._data = {}
#         return cls._instance
#
#     def get_data(self, key: str) -> str | None:
#         return self._data.get(key)
#
#     def set_data(self, key: str, value: str) -> None:
#         self._data[key] = value`,
  },
  realWorldExamples: [
    "Database connection pool manager",
    "Application configuration/settings store",
    "Logger instance shared across modules",
  ],
  whenToUse: [
    "Exactly one instance of a class is needed globally",
    "Controlled access to a shared resource (config, connection pool)",
    "Lazy initialization of expensive objects",
  ],
  whenNotToUse: [
    "When objects need to be tested independently (hard to mock)",
    "When you need multiple instances with different configurations",
    "In multithreaded contexts without proper synchronization",
  ],
  interviewTips: [
    "Often asked as warm-up question — show thread-safety awareness",
    "Interviewers test: when NOT to use Singleton (testing difficulty)",
    "Mention the module-scoped alternative in JS/TS to show modern awareness",
  ],
  commonMistakes: [
    "Forgetting thread-safety in getInstance()",
    "Making Singleton too global — harder to test and mock",
    "Using Singleton as a glorified global variable instead of dependency injection",
  ],
  relatedPatterns: [
    { patternId: "factory-method", relationship: "Factory Method can return a Singleton instance" },
    { patternId: "facade", relationship: "A Facade is often implemented as a Singleton since one entry point suffices" },
    { patternId: "builder", relationship: "Builder can be used to configure the Singleton's initial state" },
  ],
};

const factoryMethod: DesignPattern = {
  id: "factory-method",
  name: "Factory Method",
  category: "creational",
  description:
    "You're building a notification system that sends alerts via email, SMS, and push notifications. Adding a new channel like Slack shouldn't require rewriting existing code. The Factory Method pattern defines an interface for creating objects but lets subclasses decide which class to instantiate, deferring instantiation to subclasses.",
  analogy: "Think of a pizza restaurant franchise. Each city's franchise makes pizza differently (NY thin crust, Chicago deep dish), but the ordering process is identical. The franchise (Creator) defines 'make pizza' but each location (ConcreteCreator) decides the style.",
  difficulty: 3,
  tradeoffs: "You gain: new product types without modifying existing creator code. You pay: one extra class per product variant — the class hierarchy grows with each new type.",
  summary: [
    "Factory Method = subclasses decide which class to instantiate",
    "Key insight: the creator delegates object creation to its subclasses",
    "Use when: you don't know in advance which concrete class is needed",
  ],
  youAlreadyUseThis: [
    "React.createElement() (factory for React elements)",
    "document.createElement() (DOM factory method)",
    "Angular's dependency injection (providers create instances)",
  ],
  predictionPrompts: [
    {
      question: "If you add a new notification channel (e.g., Slack), how many existing classes need to change?",
      answer: "Zero — you create a new SlackNotificationCreator subclass. Existing email and SMS creators are untouched.",
    },
  ],
  classes: [
    {
      id: "fm-product",
      name: "Product",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fm-product-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "fm-concrete-a",
      name: "ConcreteProductA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "fm-concrete-a-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 250,
      y: 220,
    },
    {
      id: "fm-concrete-b",
      name: "ConcreteProductB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "fm-concrete-b-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 550,
      y: 220,
    },
    {
      id: "fm-creator",
      name: "Creator",
      stereotype: "abstract",
      attributes: [],
      methods: [
        { id: "fm-creator-meth-0", name: "factoryMethod", returnType: "Product", params: [], visibility: "+", isAbstract: true },
        { id: "fm-creator-meth-1", name: "someOperation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 400,
      y: 380,
    },
    {
      id: "fm-creator-a",
      name: "ConcreteCreatorA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "fm-creator-a-meth-0", name: "factoryMethod", returnType: "Product", params: [], visibility: "+" },
      ],
      x: 250,
      y: 550,
    },
    {
      id: "fm-creator-b",
      name: "ConcreteCreatorB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "fm-creator-b-meth-0", name: "factoryMethod", returnType: "Product", params: [], visibility: "+" },
      ],
      x: 550,
      y: 550,
    },
  ],
  relationships: [
    { id: rid(), source: "fm-concrete-a", target: "fm-product", type: "realization" },
    { id: rid(), source: "fm-concrete-b", target: "fm-product", type: "realization" },
    { id: rid(), source: "fm-creator-a", target: "fm-creator", type: "inheritance" },
    { id: rid(), source: "fm-creator-b", target: "fm-creator", type: "inheritance" },
    { id: rid(), source: "fm-creator", target: "fm-product", type: "dependency", label: "creates" },
  ],
  code: {
    typescript: `// The Product interface is what makes Factory Method work: the Creator only
// knows this interface, never the concrete classes. That's the decoupling.
interface Product {
  operation(): string;
}

class ConcreteProductA implements Product {
  operation(): string {
    return "Result of ConcreteProductA";
  }
}

class ConcreteProductB implements Product {
  operation(): string {
    return "Result of ConcreteProductB";
  }
}

abstract class Creator {
  // Abstract method forces subclasses to decide WHICH product to create.
  // This is the "factory method" — it defers instantiation to subclasses.
  abstract factoryMethod(): Product;

  someOperation(): string {
    // Creator calls its own factory method — it doesn't know (or care)
    // which concrete product it gets. This is the Open/Closed Principle in action.
    const product = this.factoryMethod();
    return \`Creator works with: \${product.operation()}\`;
  }
}

class ConcreteCreatorA extends Creator {
  factoryMethod(): Product {
    return new ConcreteProductA();
  }
}

class ConcreteCreatorB extends Creator {
  factoryMethod(): Product {
    return new ConcreteProductB();
  }
}

// Usage
const creatorA = new ConcreteCreatorA();
console.log(creatorA.someOperation());`,
    python: `from abc import ABC, abstractmethod

class Product(ABC):
    @abstractmethod
    def operation(self) -> str: ...

class ConcreteProductA(Product):
    def operation(self) -> str:
        return "Result of ConcreteProductA"

class ConcreteProductB(Product):
    def operation(self) -> str:
        return "Result of ConcreteProductB"

class Creator(ABC):
    @abstractmethod
    def factory_method(self) -> Product: ...

    def some_operation(self) -> str:
        product = self.factory_method()
        return f"Creator works with: {product.operation()}"

class ConcreteCreatorA(Creator):
    def factory_method(self) -> Product:
        return ConcreteProductA()

class ConcreteCreatorB(Creator):
    def factory_method(self) -> Product:
        return ConcreteProductB()

# Usage
creator = ConcreteCreatorA()
print(creator.some_operation())`,
  },
  realWorldExamples: [
    "UI framework creating platform-specific buttons/dialogs",
    "Document parsers for different file formats (PDF, Word, CSV)",
    "Payment gateway integrations (Stripe, PayPal, Square)",
  ],
  whenToUse: [
    "You don't know the exact types of objects your code will work with",
    "You want to provide users a way to extend internal components",
    "You need to decouple object creation from usage",
  ],
  whenNotToUse: [
    "When there is only one type of product (unnecessary abstraction)",
    "When object creation is simple and unlikely to change",
    "When it adds complexity without real extensibility benefit",
  ],
  interviewTips: [
    "Classic OOP interview question — be ready to draw the UML from memory",
    "Always contrast with Abstract Factory: Factory Method = one product, Abstract Factory = families",
    "Show how it satisfies the Open/Closed Principle by adding new creators without modifying existing code",
  ],
  commonMistakes: [
    "Returning concrete types instead of interfaces from the factory",
    "Creating a factory for a single product type (over-engineering)",
    "Confusing Factory Method (inheritance-based) with Simple Factory (just a static method)",
  ],
  confusedWith: [
    { patternId: "abstract-factory", difference: "Factory Method creates ONE product. Abstract Factory creates FAMILIES of related products." },
  ],
  relatedPatterns: [
    { patternId: "abstract-factory", relationship: "Abstract Factory uses Factory Methods internally to create each product in the family" },
    { patternId: "template-method", relationship: "Factory Method is often called within a Template Method to create objects needed by the algorithm" },
    { patternId: "prototype", relationship: "Prototype eliminates the need for factory subclasses by cloning existing objects" },
  ],
};

const builder: DesignPattern = {
  id: "builder",
  name: "Builder",
  category: "creational",
  description:
    "You're constructing SQL queries with optional WHERE clauses, JOINs, ORDER BY, and LIMIT. Passing 12 parameters to a constructor is unreadable and error-prone. The Builder pattern separates the construction of a complex object from its representation, allowing the same construction process to create different representations.",
  analogy: "Think of ordering a custom sandwich at Subway. You don't get handed a random sandwich — you choose bread, then protein, then veggies, then sauce, step by step. The sandwich artist (Director) follows the same process but your choices (Builder) produce a unique result.",
  difficulty: 2,
  tradeoffs: "You gain: readable step-by-step construction with optional parameters. You pay: more classes and boilerplate — overkill for objects with only 2-3 fields.",
  summary: [
    "Builder = construct complex objects step by step with a fluent API",
    "Key insight: separate what to build from how to assemble it",
    "Use when: constructor has many optional parameters or multiple representations",
  ],
  youAlreadyUseThis: [
    "SQL query builders (Knex, Drizzle, Prisma's fluent API)",
    "StringBuilder / URLSearchParams in standard libraries",
    "Jest expect().toBe().toHaveBeenCalled() chaining",
  ],
  classes: [
    {
      id: "b-builder",
      name: "Builder",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "b-builder-meth-0", name: "reset", returnType: "void", params: [], visibility: "+" },
        { id: "b-builder-meth-1", name: "buildStepA", returnType: "void", params: [], visibility: "+" },
        { id: "b-builder-meth-2", name: "buildStepB", returnType: "void", params: [], visibility: "+" },
        { id: "b-builder-meth-3", name: "buildStepC", returnType: "void", params: [], visibility: "+" },
      ],
      x: 100,
      y: 50,
    },
    {
      id: "b-concrete",
      name: "ConcreteBuilder",
      stereotype: "class",
      attributes: [
        { id: "b-concrete-attr-0", name: "result", type: "Product", visibility: "-" },
      ],
      methods: [
        { id: "b-concrete-meth-0", name: "reset", returnType: "void", params: [], visibility: "+" },
        { id: "b-concrete-meth-1", name: "buildStepA", returnType: "void", params: [], visibility: "+" },
        { id: "b-concrete-meth-2", name: "buildStepB", returnType: "void", params: [], visibility: "+" },
        { id: "b-concrete-meth-3", name: "buildStepC", returnType: "void", params: [], visibility: "+" },
        { id: "b-concrete-meth-4", name: "getResult", returnType: "Product", params: [], visibility: "+" },
      ],
      x: 100,
      y: 280,
    },
    {
      id: "b-product",
      name: "Product",
      stereotype: "class",
      attributes: [
        { id: "b-product-attr-0", name: "partA", type: "string", visibility: "-" },
        { id: "b-product-attr-1", name: "partB", type: "string", visibility: "-" },
        { id: "b-product-attr-2", name: "partC", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "b-product-meth-0", name: "listParts", returnType: "string[]", params: [], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
    {
      id: "b-director",
      name: "Director",
      stereotype: "class",
      attributes: [
        { id: "b-director-attr-0", name: "builder", type: "Builder", visibility: "-" },
      ],
      methods: [
        { id: "b-director-meth-0", name: "setBuilder", returnType: "void", params: ["builder: Builder"], visibility: "+" },
        { id: "b-director-meth-1", name: "buildMinimal", returnType: "void", params: [], visibility: "+" },
        { id: "b-director-meth-2", name: "buildFull", returnType: "void", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
  ],
  relationships: [
    { id: rid(), source: "b-concrete", target: "b-builder", type: "realization" },
    { id: rid(), source: "b-director", target: "b-builder", type: "association", label: "uses" },
    { id: rid(), source: "b-concrete", target: "b-product", type: "dependency", label: "creates" },
  ],
  code: {
    typescript: `interface Builder {
  reset(): void;
  buildStepA(): void;
  buildStepB(): void;
  buildStepC(): void;
}

class Product {
  parts: string[] = [];
  listParts(): void {
    console.log("Parts:", this.parts.join(", "));
  }
}

class ConcreteBuilder implements Builder {
  private product!: Product;

  constructor() { this.reset(); }

  reset(): void { this.product = new Product(); }
  buildStepA(): void { this.product.parts.push("PartA"); }
  buildStepB(): void { this.product.parts.push("PartB"); }
  buildStepC(): void { this.product.parts.push("PartC"); }

  getResult(): Product {
    const result = this.product;
    this.reset();
    return result;
  }
}

class Director {
  private builder!: Builder;

  setBuilder(builder: Builder): void {
    this.builder = builder;
  }

  buildMinimal(): void {
    this.builder.buildStepA();
  }

  buildFull(): void {
    this.builder.buildStepA();
    this.builder.buildStepB();
    this.builder.buildStepC();
  }
}

// Usage
const builder = new ConcreteBuilder();
const director = new Director();
director.setBuilder(builder);
director.buildFull();
builder.getResult().listParts();

// --- Variant: Fluent Builder (Method Chaining) ---

class HttpRequest {
  constructor(
    readonly method: string,
    readonly url: string,
    readonly headers: Record<string, string>,
    readonly body?: string,
    readonly timeout?: number
  ) {}
}

class HttpRequestBuilder {
  private method = "GET";
  private url = "";
  private headers: Record<string, string> = {};
  private body?: string;
  private timeout?: number;

  setMethod(method: string): this { this.method = method; return this; }
  setUrl(url: string): this { this.url = url; return this; }
  setHeader(key: string, value: string): this { this.headers[key] = value; return this; }
  setBody(body: string): this { this.body = body; return this; }
  setTimeout(ms: number): this { this.timeout = ms; return this; }

  build(): HttpRequest {
    if (!this.url) throw new Error("URL is required");
    return new HttpRequest(this.method, this.url, { ...this.headers }, this.body, this.timeout);
  }
}

// Usage — Fluent Builder
const request = new HttpRequestBuilder()
  .setMethod("POST")
  .setUrl("https://api.example.com/users")
  .setHeader("Content-Type", "application/json")
  .setHeader("Authorization", "Bearer token123")
  .setBody(JSON.stringify({ name: "Alice" }))
  .setTimeout(5000)
  .build();

console.log(request.method, request.url); // POST https://api.example.com/users`,
    python: `from abc import ABC, abstractmethod

class Builder(ABC):
    @abstractmethod
    def reset(self) -> None: ...
    @abstractmethod
    def build_step_a(self) -> None: ...
    @abstractmethod
    def build_step_b(self) -> None: ...
    @abstractmethod
    def build_step_c(self) -> None: ...

class Product:
    def __init__(self):
        self.parts: list[str] = []

    def list_parts(self):
        print("Parts:", ", ".join(self.parts))

class ConcreteBuilder(Builder):
    def __init__(self):
        self.reset()

    def reset(self):
        self._product = Product()

    def build_step_a(self):
        self._product.parts.append("PartA")

    def build_step_b(self):
        self._product.parts.append("PartB")

    def build_step_c(self):
        self._product.parts.append("PartC")

    def get_result(self) -> Product:
        result = self._product
        self.reset()
        return result

class Director:
    def __init__(self):
        self._builder = None

    def set_builder(self, builder: Builder):
        self._builder = builder

    def build_full(self):
        self._builder.build_step_a()
        self._builder.build_step_b()
        self._builder.build_step_c()

# Usage
builder = ConcreteBuilder()
director = Director()
director.set_builder(builder)
director.build_full()
builder.get_result().list_parts()

# --- Variant: Fluent Builder (Method Chaining) ---

from dataclasses import dataclass
from typing import Self

@dataclass(frozen=True)
class HttpRequest:
    method: str
    url: str
    headers: dict[str, str]
    body: str | None = None
    timeout: int | None = None

class HttpRequestBuilder:
    def __init__(self):
        self._method = "GET"
        self._url = ""
        self._headers: dict[str, str] = {}
        self._body: str | None = None
        self._timeout: int | None = None

    def set_method(self, method: str) -> Self:
        self._method = method
        return self

    def set_url(self, url: str) -> Self:
        self._url = url
        return self

    def set_header(self, key: str, value: str) -> Self:
        self._headers[key] = value
        return self

    def set_body(self, body: str) -> Self:
        self._body = body
        return self

    def set_timeout(self, ms: int) -> Self:
        self._timeout = ms
        return self

    def build(self) -> HttpRequest:
        if not self._url:
            raise ValueError("URL is required")
        return HttpRequest(
            method=self._method,
            url=self._url,
            headers=dict(self._headers),
            body=self._body,
            timeout=self._timeout,
        )

# Usage - Fluent Builder
import json

request = (
    HttpRequestBuilder()
    .set_method("POST")
    .set_url("https://api.example.com/users")
    .set_header("Content-Type", "application/json")
    .set_header("Authorization", "Bearer token123")
    .set_body(json.dumps({"name": "Alice"}))
    .set_timeout(5000)
    .build()
)

print(request.method, request.url)  # POST https://api.example.com/users`,
  },
  realWorldExamples: [
    "SQL query builders (Knex, Drizzle, SQLAlchemy)",
    "HTTP request builders (Axios config, fetch wrappers)",
    "UI component configuration (chart builders, form builders)",
  ],
  whenToUse: [
    "Object construction involves many optional parameters",
    "You need to create different representations of the same object",
    "Construction steps must follow a specific order",
  ],
  whenNotToUse: [
    "When objects are simple with few properties",
    "When there is only one way to build the object",
    "When the added builder abstraction is not justified by complexity",
  ],
  interviewTips: [
    "Common in API design interviews — show fluent interface with method chaining",
    "Contrast with Factory: Factory picks WHICH class, Builder picks HOW to configure it",
    "Mention immutability: Builder lets you create immutable objects with many optional params",
  ],
  commonMistakes: [
    "Making the builder mutable after build() — the product should be immutable",
    "Not validating required fields before build() — silent creation of invalid objects",
    "Over-using Builder for simple objects that only need 2-3 constructor params",
  ],
  relatedPatterns: [
    { patternId: "abstract-factory", relationship: "Abstract Factory creates families, Builder constructs complex objects step by step" },
    { patternId: "composite", relationship: "Builder is often used to construct Composite trees step by step" },
    { patternId: "singleton", relationship: "Builder can be combined with Singleton when you need one complex configured object" },
  ],
};

// ════════════════════════════════════════════════════════════
//  STRUCTURAL PATTERNS
// ════════════════════════════════════════════════════════════

const adapter: DesignPattern = {
  id: "adapter",
  name: "Adapter",
  category: "structural",
  description:
    "You're integrating a third-party payment API that returns XML, but your app only speaks JSON. You can't modify the vendor's library. The Adapter pattern converts the interface of a class into another interface clients expect, letting classes work together that couldn't otherwise because of incompatible interfaces.",
  analogy: "Think of a travel power adapter. Your US laptop plug doesn't fit a European wall socket. The adapter sits between them, translating the physical interface without modifying either the laptop or the wall.",
  difficulty: 2,
  tradeoffs: "You gain: reuse of existing classes with incompatible interfaces. You pay: an extra wrapper layer that can obscure the actual API being called underneath.",
  summary: [
    "Adapter = wrap an incompatible interface to make it compatible",
    "Key insight: translate between two interfaces without changing either one",
    "Use when: integrating third-party libraries with mismatched APIs",
  ],
  youAlreadyUseThis: [
    "Express body-parser (adapts raw request to parsed JSON)",
    "TypeScript type assertions (adapting one type to another)",
    "ORMs like Sequelize (adapting SQL results to JS objects)",
  ],
  classes: [
    {
      id: "a-target",
      name: "Target",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "a-target-meth-0", name: "request", returnType: "string", params: [], visibility: "+" },
      ],
      x: 100,
      y: 100,
    },
    {
      id: "a-adapter",
      name: "Adapter",
      stereotype: "class",
      attributes: [
        { id: "a-adapter-attr-0", name: "adaptee", type: "Adaptee", visibility: "-" },
      ],
      methods: [
        { id: "a-adapter-meth-0", name: "request", returnType: "string", params: [], visibility: "+" },
      ],
      x: 350,
      y: 100,
    },
    {
      id: "a-adaptee",
      name: "Adaptee",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "a-adaptee-meth-0", name: "specificRequest", returnType: "string", params: [], visibility: "+" },
      ],
      x: 600,
      y: 100,
    },
    {
      id: "a-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "a-client-meth-0", name: "doWork", returnType: "void", params: ["target: Target"], visibility: "+" },
      ],
      x: 100,
      y: 300,
    },
  ],
  relationships: [
    { id: rid(), source: "a-adapter", target: "a-target", type: "realization" },
    { id: rid(), source: "a-adapter", target: "a-adaptee", type: "composition", label: "wraps" },
    { id: rid(), source: "a-client", target: "a-target", type: "dependency", label: "uses" },
  ],
  code: {
    typescript: `// Target is what the CLIENT expects. The Adapter's job is to make
// something that DOESN'T match this interface look like it does.
interface Target {
  request(): string;
}

// Adaptee is the existing class with an incompatible interface.
// We can't (or shouldn't) change it — it may be a third-party library.
class Adaptee {
  specificRequest(): string {
    return "Adaptee's specific behavior";
  }
}

// The Adapter implements the Target interface but internally delegates to the Adaptee.
// This is "object adapter" (composition). The alternative is "class adapter" (inheritance),
// but composition is preferred because it's more flexible and doesn't require multiple inheritance.
class Adapter implements Target {
  private adaptee: Adaptee;

  constructor(adaptee: Adaptee) {
    this.adaptee = adaptee;
  }

  request(): string {
    return \`Adapter: (TRANSLATED) \${this.adaptee.specificRequest()}\`;
  }
}

// Usage
const adaptee = new Adaptee();
const adapter = new Adapter(adaptee);
console.log(adapter.request());`,
    python: `from abc import ABC, abstractmethod

class Target(ABC):
    @abstractmethod
    def request(self) -> str: ...

class Adaptee:
    def specific_request(self) -> str:
        return "Adaptee's specific behavior"

class Adapter(Target):
    def __init__(self, adaptee: Adaptee):
        self._adaptee = adaptee

    def request(self) -> str:
        return f"Adapter: (TRANSLATED) {self._adaptee.specific_request()}"

# Usage
adaptee = Adaptee()
adapter = Adapter(adaptee)
print(adapter.request())`,
  },
  realWorldExamples: [
    "Payment gateway wrappers (unified interface over Stripe/PayPal)",
    "ORM adapters mapping database results to domain objects",
    "Third-party API wrappers (standardizing different cloud provider SDKs)",
  ],
  whenToUse: [
    "You need to use an existing class with an incompatible interface",
    "You want to create a reusable class that cooperates with unrelated classes",
    "Wrapping a third-party library to decouple your code from it",
  ],
  whenNotToUse: [
    "When you can modify the existing class directly",
    "When the interfaces are already compatible",
    "When the adaptation logic is too complex (consider Facade instead)",
  ],
  interviewTips: [
    "Most practical pattern in interviews — almost every codebase has adapters",
    "Two variants: class adapter (inheritance) vs object adapter (composition) — prefer composition",
    "Show real example: wrapping a third-party library's interface to match your domain",
  ],
  commonMistakes: [
    "Adding business logic to the adapter — it should only translate interfaces, not add behavior",
    "Using adapter when the real problem is poor API design (fix the API instead)",
    "Creating chains of adapters (A adapts B adapts C) — refactor the interfaces instead",
  ],
  confusedWith: [
    { patternId: "bridge", difference: "Adapter fixes incompatible interfaces after the fact. Bridge separates abstraction from implementation upfront by design." },
  ],
  relatedPatterns: [
    { patternId: "bridge", relationship: "Bridge is designed upfront to separate abstraction from implementation; Adapter is a retrofit" },
    { patternId: "decorator", relationship: "Both wrap objects, but Adapter changes the interface while Decorator enhances it" },
    { patternId: "facade", relationship: "Facade simplifies a complex interface; Adapter makes an incompatible interface compatible" },
    { patternId: "proxy", relationship: "Proxy provides the same interface; Adapter provides a different one" },
  ],
};

const decorator: DesignPattern = {
  id: "decorator",
  name: "Decorator",
  category: "structural",
  description:
    "You're building an Express-like server and need to add logging, authentication, and compression to requests -- but in any combination. Creating a class for every permutation would explode into dozens of subclasses. The Decorator pattern attaches additional responsibilities to an object dynamically, providing a flexible alternative to subclassing for extending functionality.",
  analogy: "Think of dressing for winter. You start with a shirt, then add a sweater, then a jacket. Each layer wraps the previous one, adding warmth without replacing what's underneath. You can mix and match layers in any order.",
  difficulty: 3,
  tradeoffs: "You gain: flexible, composable behavior without subclass explosion. You pay: many small wrapper objects that can be hard to debug — stack traces show nested calls.",
  summary: [
    "Decorator = wrap an object to add behavior without modifying it",
    "Key insight: decorators and the original share the same interface, so they stack",
    "Use when: you need combinable behaviors like logging + caching + auth",
  ],
  youAlreadyUseThis: [
    "Express/Koa middleware (app.use(cors()), app.use(auth()))",
    "Python @decorator syntax (@login_required, @cache)",
    "React Higher-Order Components (withRouter, withTheme)",
  ],
  predictionPrompts: [
    {
      question: "If you need logging + caching + auth on a request handler, how many subclasses would you need WITHOUT decorators?",
      answer: "Seven (one per permutation of 3 behaviors). Decorators reduce this to 3 wrapper classes that compose freely.",
    },
  ],
  classes: [
    {
      id: "d-component",
      name: "Component",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "d-component-meth-0", name: "execute", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "d-concrete",
      name: "ConcreteComponent",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "d-concrete-meth-0", name: "execute", returnType: "string", params: [], visibility: "+" },
      ],
      x: 100,
      y: 230,
    },
    {
      id: "d-base-decorator",
      name: "BaseDecorator",
      stereotype: "abstract",
      attributes: [
        { id: "d-base-decorator-attr-0", name: "wrappee", type: "Component", visibility: "#" },
      ],
      methods: [
        { id: "d-base-decorator-meth-0", name: "execute", returnType: "string", params: [], visibility: "+" },
      ],
      x: 500,
      y: 230,
    },
    {
      id: "d-decorator-a",
      name: "ConcreteDecoratorA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "d-decorator-a-meth-0", name: "execute", returnType: "string", params: [], visibility: "+" },
        { id: "d-decorator-a-meth-1", name: "extraBehavior", returnType: "void", params: [], visibility: "-" },
      ],
      x: 380,
      y: 430,
    },
    {
      id: "d-decorator-b",
      name: "ConcreteDecoratorB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "d-decorator-b-meth-0", name: "execute", returnType: "string", params: [], visibility: "+" },
      ],
      x: 620,
      y: 430,
    },
  ],
  relationships: [
    { id: rid(), source: "d-concrete", target: "d-component", type: "realization" },
    { id: rid(), source: "d-base-decorator", target: "d-component", type: "realization" },
    { id: rid(), source: "d-base-decorator", target: "d-component", type: "aggregation", label: "wraps" },
    { id: rid(), source: "d-decorator-a", target: "d-base-decorator", type: "inheritance" },
    { id: rid(), source: "d-decorator-b", target: "d-base-decorator", type: "inheritance" },
  ],
  code: {
    typescript: `interface Component {
  execute(): string;
}

class ConcreteComponent implements Component {
  execute(): string {
    return "ConcreteComponent";
  }
}

// BaseDecorator implements THE SAME interface as the component it wraps.
// This is the key insight — because both share an interface, decorators are invisible
// to clients and can be stacked in any combination.
abstract class BaseDecorator implements Component {
  protected wrappee: Component;
  constructor(component: Component) {
    this.wrappee = component;
  }
  // Default: just delegate. Subclasses override to add behavior BEFORE or AFTER.
  execute(): string {
    return this.wrappee.execute();
  }
}

class LoggingDecorator extends BaseDecorator {
  execute(): string {
    // Behavior added BEFORE delegation — this is "pre-processing" decoration.
    // Middleware works the same way: do something, then call next().
    console.log("LOG: executing...");
    return \`Logged(\${super.execute()})\`;
  }
}

class CachingDecorator extends BaseDecorator {
  execute(): string {
    return \`Cached(\${super.execute()})\`;
  }
}

// Usage - decorators can be stacked
// Nesting order matters: CachingDecorator(LoggingDecorator(Component))
// means caching wraps logging wraps component — like middleware layers.
const component = new CachingDecorator(
  new LoggingDecorator(new ConcreteComponent())
);
console.log(component.execute());
// "Cached(Logged(ConcreteComponent))"`,
    python: `from abc import ABC, abstractmethod

class Component(ABC):
    @abstractmethod
    def execute(self) -> str: ...

class ConcreteComponent(Component):
    def execute(self) -> str:
        return "ConcreteComponent"

class BaseDecorator(Component):
    def __init__(self, wrappee: Component):
        self._wrappee = wrappee

    def execute(self) -> str:
        return self._wrappee.execute()

class LoggingDecorator(BaseDecorator):
    def execute(self) -> str:
        print("LOG: executing...")
        return f"Logged({super().execute()})"

class CachingDecorator(BaseDecorator):
    def execute(self) -> str:
        return f"Cached({super().execute()})"

# Usage - decorators can be stacked
component = CachingDecorator(LoggingDecorator(ConcreteComponent()))
print(component.execute())
# "Cached(Logged(ConcreteComponent))"`,
  },
  realWorldExamples: [
    "Express/Koa middleware (logging, auth, compression)",
    "Java I/O streams (BufferedInputStream wrapping FileInputStream)",
    "React higher-order components (withAuth, withTheme)",
  ],
  whenToUse: [
    "You need to add responsibilities to objects without modifying their code",
    "Behaviors can be combined in many permutations",
    "Extension by subclassing is impractical due to class explosion",
  ],
  whenNotToUse: [
    "When the order of decorators matters and is hard to manage",
    "When a single responsibility extension is sufficient",
    "When the component interface is very wide (too many methods to wrap)",
  ],
  interviewTips: [
    "Classic interview pattern — draw the recursive wrapping structure",
    "Key insight: decorators are stackable and order-independent (unlike inheritance)",
    "Mention Java I/O streams as the canonical real-world example of Decorator",
  ],
  commonMistakes: [
    "Creating too many small decorator classes — the class explosion problem",
    "Decorator order dependencies (e.g., compression before encryption matters)",
    "Forgetting that decorators must implement the FULL interface, not just the methods they enhance",
  ],
  confusedWith: [
    { patternId: "proxy", difference: "Decorator adds behavior. Proxy controls access. Decorator is stackable; Proxy usually isn't." },
  ],
  relatedPatterns: [
    { patternId: "proxy", relationship: "Both wrap objects with the same interface, but Proxy controls access while Decorator adds behavior" },
    { patternId: "composite", relationship: "Decorator is like a Composite with only one child — both use recursive composition" },
    { patternId: "strategy", relationship: "Decorator changes the skin (wrapping), Strategy changes the guts (algorithm replacement)" },
    { patternId: "adapter", relationship: "Adapter changes the interface; Decorator keeps the same interface but adds responsibilities" },
  ],
};

const facade: DesignPattern = {
  id: "facade",
  name: "Facade",
  category: "structural",
  description:
    "You're using a video conversion library that requires you to juggle codec selection, bitrate configuration, format settings, and buffer management separately. Your team just wants one function: convertVideo(). The Facade pattern provides a simplified interface to a complex subsystem, defining a higher-level interface that makes the subsystem easier to use.",
  analogy: "Think of a hotel concierge. Instead of you calling the restaurant, booking the taxi, and arranging the tour separately, you tell the concierge what you want and they handle all the coordination behind the scenes.",
  difficulty: 2,
  tradeoffs: "You gain: a simple entry point that hides subsystem complexity. You pay: the facade can become a 'god object' if it grows too many convenience methods.",
  summary: [
    "Facade = one simple interface in front of a complex subsystem",
    "Key insight: hide internal complexity behind a single high-level API",
    "Use when: clients don't need fine-grained control over subsystem details",
  ],
  youAlreadyUseThis: [
    "jQuery ($() wraps complex DOM, AJAX, and event APIs)",
    "Axios (simple .get()/.post() over complex XMLHttpRequest)",
    "Docker Compose (one command orchestrates many services)",
  ],
  classes: [
    {
      id: "f-facade",
      name: "Facade",
      stereotype: "class",
      attributes: [
        { id: "f-facade-attr-0", name: "subsystemA", type: "SubsystemA", visibility: "-" },
        { id: "f-facade-attr-1", name: "subsystemB", type: "SubsystemB", visibility: "-" },
        { id: "f-facade-attr-2", name: "subsystemC", type: "SubsystemC", visibility: "-" },
      ],
      methods: [
        { id: "f-facade-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "f-sub-a",
      name: "SubsystemA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "f-sub-a-meth-0", name: "operationA1", returnType: "string", params: [], visibility: "+" },
        { id: "f-sub-a-meth-1", name: "operationA2", returnType: "string", params: [], visibility: "+" },
      ],
      x: 80,
      y: 280,
    },
    {
      id: "f-sub-b",
      name: "SubsystemB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "f-sub-b-meth-0", name: "operationB1", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "f-sub-c",
      name: "SubsystemC",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "f-sub-c-meth-0", name: "operationC1", returnType: "string", params: [], visibility: "+" },
        { id: "f-sub-c-meth-1", name: "operationC2", returnType: "string", params: [], visibility: "+" },
      ],
      x: 520,
      y: 280,
    },
    {
      id: "f-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "f-client-meth-0", name: "doWork", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: -120,
    },
  ],
  relationships: [
    { id: rid(), source: "f-facade", target: "f-sub-a", type: "composition" },
    { id: rid(), source: "f-facade", target: "f-sub-b", type: "composition" },
    { id: rid(), source: "f-facade", target: "f-sub-c", type: "composition" },
    { id: rid(), source: "f-client", target: "f-facade", type: "dependency", label: "uses" },
  ],
  code: {
    typescript: `class SubsystemA {
  operationA1(): string { return "SubsystemA: Ready!"; }
  operationA2(): string { return "SubsystemA: Go!"; }
}

class SubsystemB {
  operationB1(): string { return "SubsystemB: Fire!"; }
}

class SubsystemC {
  operationC1(): string { return "SubsystemC: Prepare!"; }
  operationC2(): string { return "SubsystemC: Execute!"; }
}

class Facade {
  private a = new SubsystemA();
  private b = new SubsystemB();
  private c = new SubsystemC();

  operation(): string {
    const results = [
      this.a.operationA1(),
      this.c.operationC1(),
      this.b.operationB1(),
      this.a.operationA2(),
      this.c.operationC2(),
    ];
    return results.join("\\n");
  }
}

// Usage
const facade = new Facade();
console.log(facade.operation());`,
    python: `class SubsystemA:
    def operation_a1(self) -> str:
        return "SubsystemA: Ready!"

    def operation_a2(self) -> str:
        return "SubsystemA: Go!"

class SubsystemB:
    def operation_b1(self) -> str:
        return "SubsystemB: Fire!"

class SubsystemC:
    def operation_c1(self) -> str:
        return "SubsystemC: Prepare!"

    def operation_c2(self) -> str:
        return "SubsystemC: Execute!"

class Facade:
    def __init__(self):
        self._a = SubsystemA()
        self._b = SubsystemB()
        self._c = SubsystemC()

    def operation(self) -> str:
        results = [
            self._a.operation_a1(),
            self._c.operation_c1(),
            self._b.operation_b1(),
            self._a.operation_a2(),
            self._c.operation_c2(),
        ]
        return "\\n".join(results)

# Usage
facade = Facade()
print(facade.operation())`,
  },
  realWorldExamples: [
    "Video conversion library wrapping codec, bitrate, and format subsystems",
    "ORM query interface hiding SQL, connection, and caching layers",
    "Cloud SDK wrapping authentication, API calls, and retry logic",
  ],
  whenToUse: [
    "You need a simple interface to a complex subsystem",
    "There are many dependencies between clients and implementation classes",
    "You want to layer your subsystems with clear entry points",
  ],
  whenNotToUse: [
    "When the subsystem is already simple enough",
    "When clients need fine-grained control over subsystem behavior",
    "When the facade becomes a 'god object' with too many responsibilities",
  ],
  interviewTips: [
    "Easiest structural pattern — but show depth by discussing when NOT to use it",
    "Key question: does Facade violate SRP? No — its responsibility IS simplifying the subsystem",
    "Mention that many frameworks are essentially facades (e.g., jQuery over DOM APIs)",
  ],
  commonMistakes: [
    "Making the Facade a God Object that does everything — it should delegate, not implement",
    "Hiding the subsystem completely — clients should still be able to bypass the Facade when needed",
    "Coupling the Facade to too many subsystems — keep it focused on one coherent use case",
  ],
  relatedPatterns: [
    { patternId: "adapter", relationship: "Adapter makes one interface compatible; Facade simplifies an entire subsystem's interface" },
    { patternId: "mediator", relationship: "Mediator coordinates between peers; Facade provides a one-way simplified interface to a subsystem" },
    { patternId: "singleton", relationship: "A Facade is often a Singleton since one entry point to the subsystem suffices" },
  ],
};

// ════════════════════════════════════════════════════════════
//  BEHAVIORAL PATTERNS
// ════════════════════════════════════════════════════════════

const observer: DesignPattern = {
  id: "observer",
  name: "Observer",
  category: "behavioral",
  description:
    "You're building a stock trading dashboard. When a price changes, the chart, alerts, and portfolio ALL need to update instantly. Do you check each component manually? The Observer pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.",
  analogy: "Think of a newspaper subscription. The newspaper publishes daily, subscribers receive automatically. No subscriber knows about others. Adding a new subscriber requires zero changes to the newspaper.",
  difficulty: 2,
  tradeoffs: "You gain: adding new observers without touching existing code — loose coupling. You pay: debugging is harder because the call chain is implicit, not explicit — events are invisible in stack traces.",
  summary: [
    "Observer = subscribe to changes, get notified automatically",
    "Key insight: subject and observers don't know about each other — loose coupling",
    "Use when: one change should trigger multiple independent reactions",
  ],
  youAlreadyUseThis: [
    "React useEffect + setState (re-render on state change)",
    "Redux store.subscribe() (UI updates on dispatch)",
    "Node.js EventEmitter (event-driven architecture)",
    "DOM addEventListener (click, scroll, resize)",
  ],
  predictionPrompts: [
    {
      question: "If you add a 6th observer to a Subject with 5 observers, how many existing classes need to change?",
      answer: "Zero — you just call subject.subscribe(newObserver). That's the power of Observer: open for extension, closed for modification.",
    },
  ],
  classes: [
    {
      id: "o-subject",
      name: "Subject",
      stereotype: "class",
      attributes: [
        { id: "o-subject-attr-0", name: "observers", type: "Observer[]", visibility: "-" },
        { id: "o-subject-attr-1", name: "state", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "o-subject-meth-0", name: "attach", returnType: "void", params: ["observer: Observer"], visibility: "+" },
        { id: "o-subject-meth-1", name: "detach", returnType: "void", params: ["observer: Observer"], visibility: "+" },
        { id: "o-subject-meth-2", name: "notify", returnType: "void", params: [], visibility: "+" },
        { id: "o-subject-meth-3", name: "setState", returnType: "void", params: ["state: number"], visibility: "+" },
      ],
      x: 150,
      y: 50,
    },
    {
      id: "o-observer",
      name: "Observer",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "o-observer-meth-0", name: "update", returnType: "void", params: ["subject: Subject"], visibility: "+" },
      ],
      x: 500,
      y: 50,
    },
    {
      id: "o-concrete-a",
      name: "ConcreteObserverA",
      stereotype: "class",
      attributes: [
        { id: "o-concrete-a-attr-0", name: "observerState", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "o-concrete-a-meth-0", name: "update", returnType: "void", params: ["subject: Subject"], visibility: "+" },
      ],
      x: 380,
      y: 280,
    },
    {
      id: "o-concrete-b",
      name: "ConcreteObserverB",
      stereotype: "class",
      attributes: [
        { id: "o-concrete-b-attr-0", name: "observerState", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "o-concrete-b-meth-0", name: "update", returnType: "void", params: ["subject: Subject"], visibility: "+" },
      ],
      x: 620,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "o-subject", target: "o-observer", type: "association", label: "notifies", targetCardinality: "*" },
    { id: rid(), source: "o-concrete-a", target: "o-observer", type: "realization" },
    { id: rid(), source: "o-concrete-b", target: "o-observer", type: "realization" },
  ],
  code: {
    typescript: `interface Observer {
  update(subject: Subject): void;
}

class Subject {
  // We store observers in an array, not a Set — simpler but allows duplicates.
  // Production code should use Set to prevent accidental double-subscription.
  private observers: Observer[] = [];
  private state = 0;

  attach(observer: Observer): void {
    this.observers.push(observer);
  }

  detach(observer: Observer): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  notify(): void {
    // Notification order is array-insertion order. If observers depend on each
    // other's side effects, this implicit ordering becomes a hidden coupling.
    for (const observer of this.observers) {
      observer.update(this);
    }
  }

  getState(): number { return this.state; }

  setState(state: number): void {
    this.state = state;
    // Auto-notify on every state change — this is "push" model.
    // Downside: even no-op changes trigger notifications. Production code
    // should compare old vs new state before notifying.
    this.notify();
  }
}

class ConcreteObserverA implements Observer {
  update(subject: Subject): void {
    console.log(\`ObserverA reacted to \${subject.getState()}\`);
  }
}

class ConcreteObserverB implements Observer {
  update(subject: Subject): void {
    console.log(\`ObserverB reacted to \${subject.getState()}\`);
  }
}

// Usage
const subject = new Subject();
subject.attach(new ConcreteObserverA());
subject.attach(new ConcreteObserverB());
subject.setState(42); // Both observers notified

// --- Variant: Pull Model ---
// Observers are notified something changed, then PULL what they need.

interface PullObserver {
  onNotify(): void;
}

class StockTicker {
  private observers: PullObserver[] = [];
  private prices = new Map<string, number>();

  subscribe(observer: PullObserver): void { this.observers.push(observer); }
  unsubscribe(observer: PullObserver): void {
    this.observers = this.observers.filter(o => o !== observer);
  }

  getPrice(symbol: string): number | undefined { return this.prices.get(symbol); }
  getAllPrices(): Map<string, number> { return new Map(this.prices); }

  updatePrice(symbol: string, price: number): void {
    this.prices.set(symbol, price);
    // Notify without sending data — observers pull what they need
    this.observers.forEach(o => o.onNotify());
  }
}

class PriceDisplay implements PullObserver {
  constructor(private ticker: StockTicker, private symbol: string) {}
  onNotify(): void {
    // Pull only the data this observer cares about
    const price = this.ticker.getPrice(this.symbol);
    if (price !== undefined) console.log(\`[\${this.symbol}] $\${price}\`);
  }
}

class PortfolioTracker implements PullObserver {
  constructor(private ticker: StockTicker) {}
  onNotify(): void {
    // Pull all prices to recalculate portfolio
    const prices = this.ticker.getAllPrices();
    const total = Array.from(prices.values()).reduce((a, b) => a + b, 0);
    console.log(\`Portfolio total: $\${total}\`);
  }
}

// Usage — Pull Model
const ticker = new StockTicker();
ticker.subscribe(new PriceDisplay(ticker, "AAPL"));
ticker.subscribe(new PortfolioTracker(ticker));
ticker.updatePrice("AAPL", 175); // Each observer pulls what it needs

// --- Variant: Typed EventEmitter (Node.js Style) ---

type EventMap = Record<string, unknown[]>;

class TypedEventEmitter<T extends EventMap> {
  private listeners = new Map<keyof T, Set<(...args: any[]) => void>>();

  on<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return this;
  }

  off<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
    this.listeners.get(event)?.delete(fn);
    return this;
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  once<K extends keyof T>(event: K, fn: (...args: T[K]) => void): this {
    const wrapper = (...args: T[K]) => { fn(...args); this.off(event, wrapper); };
    return this.on(event, wrapper);
  }
}

// Type-safe events for a chat app
type ChatEvents = {
  message: [sender: string, text: string];
  userJoined: [username: string];
  userLeft: [username: string];
};

const chat = new TypedEventEmitter<ChatEvents>();

chat.on("message", (sender, text) => {
  console.log(\`\${sender}: \${text}\`); // fully typed: sender=string, text=string
});

chat.once("userJoined", (username) => {
  console.log(\`Welcome, \${username}!\`);
});

chat.emit("message", "Alice", "Hello!"); // Type-checked args
chat.emit("userJoined", "Bob");`,
    python: `from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, subject: "Subject") -> None: ...

class Subject:
    def __init__(self):
        self._observers: list[Observer] = []
        self._state = 0

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def notify(self) -> None:
        for observer in self._observers:
            observer.update(self)

    @property
    def state(self) -> int:
        return self._state

    @state.setter
    def state(self, value: int) -> None:
        self._state = value
        self.notify()

class ConcreteObserverA(Observer):
    def update(self, subject: Subject) -> None:
        print(f"ObserverA reacted to {subject.state}")

class ConcreteObserverB(Observer):
    def update(self, subject: Subject) -> None:
        print(f"ObserverB reacted to {subject.state}")

# Usage
subject = Subject()
subject.attach(ConcreteObserverA())
subject.attach(ConcreteObserverB())
subject.state = 42  # Both observers notified

# --- Variant: Pull Model ---
# Observers are notified something changed, then PULL what they need.

class PullObserver(ABC):
    @abstractmethod
    def on_notify(self) -> None: ...

class StockTicker:
    def __init__(self):
        self._observers: list[PullObserver] = []
        self._prices: dict[str, float] = {}

    def subscribe(self, observer: PullObserver) -> None:
        self._observers.append(observer)

    def unsubscribe(self, observer: PullObserver) -> None:
        self._observers.remove(observer)

    def get_price(self, symbol: str) -> float | None:
        return self._prices.get(symbol)

    def get_all_prices(self) -> dict[str, float]:
        return dict(self._prices)

    def update_price(self, symbol: str, price: float) -> None:
        self._prices[symbol] = price
        for obs in self._observers:
            obs.on_notify()

class PriceDisplay(PullObserver):
    def __init__(self, ticker: StockTicker, symbol: str):
        self._ticker = ticker
        self._symbol = symbol

    def on_notify(self) -> None:
        price = self._ticker.get_price(self._symbol)
        if price is not None:
            print(f"[{self._symbol}] " + str(price))

class PortfolioTracker(PullObserver):
    def __init__(self, ticker: StockTicker):
        self._ticker = ticker

    def on_notify(self) -> None:
        prices = self._ticker.get_all_prices()
        total = sum(prices.values())
        print(f"Portfolio total: " + str(total))

# Usage - Pull Model
ticker = StockTicker()
ticker.subscribe(PriceDisplay(ticker, "AAPL"))
ticker.subscribe(PortfolioTracker(ticker))
ticker.update_price("AAPL", 175)  # Each observer pulls what it needs

# --- Variant: Typed EventEmitter (Node.js Style) ---

from typing import Any, Callable

class EventEmitter:
    def __init__(self):
        self._listeners: dict[str, list[Callable[..., Any]]] = {}

    def on(self, event: str, fn: Callable[..., Any]) -> "EventEmitter":
        self._listeners.setdefault(event, []).append(fn)
        return self

    def off(self, event: str, fn: Callable[..., Any]) -> "EventEmitter":
        if event in self._listeners:
            self._listeners[event] = [f for f in self._listeners[event] if f is not fn]
        return self

    def emit(self, event: str, *args: Any) -> None:
        for fn in self._listeners.get(event, []):
            fn(*args)

    def once(self, event: str, fn: Callable[..., Any]) -> "EventEmitter":
        def wrapper(*args: Any) -> None:
            fn(*args)
            self.off(event, wrapper)
        return self.on(event, wrapper)

# Usage - EventEmitter
chat = EventEmitter()

chat.on("message", lambda sender, text: print(f"{sender}: {text}"))
chat.once("user_joined", lambda username: print(f"Welcome, {username}!"))

chat.emit("message", "Alice", "Hello!")
chat.emit("user_joined", "Bob")
chat.emit("user_joined", "Charlie")  # once handler already removed`,
  },
  realWorldExamples: [
    "Event emitters in Node.js (EventEmitter, DOM events)",
    "React state management (Redux subscribers, Zustand listeners)",
    "Message broker pub/sub systems (Kafka consumers, Redis pub/sub)",
  ],
  whenToUse: [
    "Changes to one object require changing others, and you don't know how many",
    "An object should notify other objects without making assumptions about who they are",
    "You need a publish-subscribe mechanism",
  ],
  whenNotToUse: [
    "When the subscriber list rarely changes (direct method calls are simpler)",
    "When notification order matters (Observer does not guarantee order)",
    "When circular dependencies between observers can occur",
  ],
  interviewTips: [
    "The #1 most asked behavioral pattern — know it cold",
    "Mention push vs pull variants to show depth",
    "Connect to real systems: React state, event emitters, webhooks are all Observer",
  ],
  commonMistakes: [
    "Memory leak from not unsubscribing observers (especially in SPAs with component unmounting)",
    "Circular dependencies between observers causing infinite notification loops",
    "Notifying observers synchronously in performance-critical paths — use async notification",
  ],
  confusedWith: [
    { patternId: "mediator", difference: "Observer = 1-to-many broadcast. Mediator = many-to-many through a central hub." },
  ],
  relatedPatterns: [
    { patternId: "mediator", relationship: "Mediator centralizes the communication that Observer distributes" },
    { patternId: "command", relationship: "Commands can be sent via Observer notifications" },
    { patternId: "strategy", relationship: "Observer notifies WHAT happened; callbacks in Observer can use Strategy to decide HOW to react" },
    { patternId: "state", relationship: "State changes in a State pattern often trigger Observer notifications" },
  ],
};

const strategy: DesignPattern = {
  id: "strategy",
  name: "Strategy",
  category: "behavioral",
  description:
    "You're building a navigation app like Google Maps. Users can choose driving, walking, or cycling -- each with a completely different routing algorithm. Hardcoding all three with if/else makes the code unmaintainable. The Strategy pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable, letting the algorithm vary independently from clients that use it.",
  analogy: "Think of GPS navigation routes. Same destination, different strategies: fastest, shortest, scenic. You swap the route strategy without changing the car or the destination.",
  difficulty: 2,
  tradeoffs: "You gain: swap algorithms at runtime without changing the context class. You pay: clients must know which strategies exist and select the right one.",
  summary: [
    "Strategy = encapsulate interchangeable algorithms behind one interface",
    "Key insight: the USER selects the algorithm, the context just delegates",
    "Use when: you have multiple ways to do the same thing, chosen at runtime",
  ],
  youAlreadyUseThis: [
    "Array.sort() with custom comparator function",
    "Passport.js strategies (LocalStrategy, GoogleStrategy)",
    "React Router route matching strategies",
    "Express middleware selecting auth strategies",
  ],
  predictionPrompts: [
    {
      question: "Adding a new payment method (Bitcoin) to a Strategy-based checkout. How many existing classes need modification?",
      answer: "Zero — create a new BitcoinStrategy class implementing the PaymentStrategy interface. The Context and existing strategies remain untouched.",
    },
  ],
  classes: [
    {
      id: "s-strategy",
      name: "Strategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "s-strategy-meth-0", name: "execute", returnType: "number", params: ["data: number[]"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "s-concrete-a",
      name: "ConcreteStrategyA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "s-concrete-a-meth-0", name: "execute", returnType: "number", params: ["data: number[]"], visibility: "+" },
      ],
      x: 120,
      y: 250,
    },
    {
      id: "s-concrete-b",
      name: "ConcreteStrategyB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "s-concrete-b-meth-0", name: "execute", returnType: "number", params: ["data: number[]"], visibility: "+" },
      ],
      x: 480,
      y: 250,
    },
    {
      id: "s-context",
      name: "Context",
      stereotype: "class",
      attributes: [
        { id: "s-context-attr-0", name: "strategy", type: "Strategy", visibility: "-" },
      ],
      methods: [
        { id: "s-context-meth-0", name: "setStrategy", returnType: "void", params: ["strategy: Strategy"], visibility: "+" },
        { id: "s-context-meth-1", name: "doWork", returnType: "number", params: ["data: number[]"], visibility: "+" },
      ],
      x: 300,
      y: 430,
    },
  ],
  relationships: [
    { id: rid(), source: "s-concrete-a", target: "s-strategy", type: "realization" },
    { id: rid(), source: "s-concrete-b", target: "s-strategy", type: "realization" },
    { id: rid(), source: "s-context", target: "s-strategy", type: "aggregation", label: "uses" },
  ],
  code: {
    typescript: `// One interface for all algorithms — this is what makes them interchangeable.
// The Context only depends on this interface, never on concrete strategies.
interface Strategy {
  execute(data: number[]): number;
}

class SumStrategy implements Strategy {
  execute(data: number[]): number {
    return data.reduce((a, b) => a + b, 0);
  }
}

class MaxStrategy implements Strategy {
  execute(data: number[]): number {
    return Math.max(...data);
  }
}

class Context {
  private strategy: Strategy;

  // Strategy is injected via constructor — the Context doesn't know which
  // algorithm it's using. This is composition over inheritance in action.
  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  // Runtime swap: unlike inheritance, the algorithm can change mid-execution.
  // This is impossible with a class hierarchy — you'd need to create a new object.
  setStrategy(strategy: Strategy): void {
    this.strategy = strategy;
  }

  doWork(data: number[]): number {
    return this.strategy.execute(data);
  }
}

// Usage
const ctx = new Context(new SumStrategy());
console.log(ctx.doWork([1, 2, 3])); // 6

ctx.setStrategy(new MaxStrategy());
console.log(ctx.doWork([1, 2, 3])); // 3

// --- Variant: Lambda / Closure Strategy ---
// Pass functions directly — no class needed. This is idiomatic in JS/TS.

type StrategyFn = (data: number[]) => number;

class FunctionalContext {
  constructor(private strategyFn: StrategyFn) {}

  setStrategy(fn: StrategyFn): void { this.strategyFn = fn; }
  doWork(data: number[]): number { return this.strategyFn(data); }
}

// Built-in strategies as simple arrow functions
const sum: StrategyFn = (data) => data.reduce((a, b) => a + b, 0);
const max: StrategyFn = (data) => Math.max(...data);
const average: StrategyFn = (data) => data.reduce((a, b) => a + b, 0) / data.length;

// Usage — Lambda Strategy
const fCtx = new FunctionalContext(sum);
console.log(fCtx.doWork([1, 2, 3])); // 6

fCtx.setStrategy(max);
console.log(fCtx.doWork([1, 2, 3])); // 3

// Inline lambda for one-off strategies
fCtx.setStrategy((data) => data.filter(n => n % 2 === 0).length);
console.log(fCtx.doWork([1, 2, 3, 4])); // 2 (count of evens)

// Closure strategy: capture external config
const createThresholdStrategy = (threshold: number): StrategyFn =>
  (data) => data.filter(n => n > threshold).length;

fCtx.setStrategy(createThresholdStrategy(2));
console.log(fCtx.doWork([1, 2, 3, 4])); // 2 (items > 2)`,
    python: `from abc import ABC, abstractmethod

class Strategy(ABC):
    @abstractmethod
    def execute(self, data: list[int]) -> int: ...

class SumStrategy(Strategy):
    def execute(self, data: list[int]) -> int:
        return sum(data)

class MaxStrategy(Strategy):
    def execute(self, data: list[int]) -> int:
        return max(data)

class Context:
    def __init__(self, strategy: Strategy):
        self._strategy = strategy

    def set_strategy(self, strategy: Strategy) -> None:
        self._strategy = strategy

    def do_work(self, data: list[int]) -> int:
        return self._strategy.execute(data)

# Usage
ctx = Context(SumStrategy())
print(ctx.do_work([1, 2, 3]))  # 6

ctx.set_strategy(MaxStrategy())
print(ctx.do_work([1, 2, 3]))  # 3

# --- Variant: Lambda / Closure Strategy ---
# Pass callables directly — no class needed. Pythonic approach.

from typing import Callable

StrategyFn = Callable[[list[int]], int]

class FunctionalContext:
    def __init__(self, strategy_fn: StrategyFn):
        self._strategy_fn = strategy_fn

    def set_strategy(self, fn: StrategyFn) -> None:
        self._strategy_fn = fn

    def do_work(self, data: list[int]) -> int:
        return self._strategy_fn(data)

# Built-in strategies as simple callables
def sum_strategy(data: list[int]) -> int:
    return sum(data)

def max_strategy(data: list[int]) -> int:
    return max(data)

def average_strategy(data: list[int]) -> int:
    return sum(data) // len(data)

# Usage - Lambda Strategy
f_ctx = FunctionalContext(sum_strategy)
print(f_ctx.do_work([1, 2, 3]))  # 6

f_ctx.set_strategy(max_strategy)
print(f_ctx.do_work([1, 2, 3]))  # 3

# Inline lambda for one-off strategies
f_ctx.set_strategy(lambda data: len([n for n in data if n % 2 == 0]))
print(f_ctx.do_work([1, 2, 3, 4]))  # 2 (count of evens)

# Closure strategy: capture external config
def create_threshold_strategy(threshold: int) -> StrategyFn:
    return lambda data: len([n for n in data if n > threshold])

f_ctx.set_strategy(create_threshold_strategy(2))
print(f_ctx.do_work([1, 2, 3, 4]))  # 2 (items > 2)`,
  },
  realWorldExamples: [
    "Sorting algorithms (quick sort vs merge sort depending on data size)",
    "Payment processing (credit card, PayPal, crypto strategies)",
    "Compression algorithms (gzip, brotli, zstd chosen at runtime)",
  ],
  whenToUse: [
    "You need to use different variants of an algorithm at runtime",
    "You have many similar classes that only differ in behavior",
    "You want to isolate business logic from algorithm implementation details",
  ],
  whenNotToUse: [
    "When there are only a couple of algorithms that rarely change",
    "When clients don't need to switch algorithms at runtime",
    "When a simple conditional is clearer than the pattern overhead",
  ],
  interviewTips: [
    "Classic comparison question: Strategy vs State — explain the difference clearly",
    "Show runtime switching by having the user select a strategy",
    "Mention that functional languages replace Strategy with higher-order functions",
  ],
  commonMistakes: [
    "Overcomplicating simple conditionals — if you have 2-3 static choices, an if/else is fine",
    "Leaking context data into strategy implementations — keep the strategy interface clean",
    "Not considering the functional alternative: a simple function parameter often replaces Strategy",
  ],
  confusedWith: [
    { patternId: "state", difference: "Strategy = USER selects algorithm. State = SYSTEM transitions automatically." },
    { patternId: "command", difference: "Command encapsulates a REQUEST (undoable). Strategy encapsulates an ALGORITHM (swappable)." },
  ],
  relatedPatterns: [
    { patternId: "state", relationship: "State looks structurally identical but transitions are automatic, not user-selected" },
    { patternId: "template-method", relationship: "Template Method uses inheritance to vary parts; Strategy uses composition" },
    { patternId: "decorator", relationship: "Decorator changes the skin (wrapping); Strategy changes the guts (algorithm)" },
    { patternId: "command", relationship: "Both encapsulate behavior, but Command focuses on requests/undo while Strategy focuses on algorithms" },
  ],
};

const command: DesignPattern = {
  id: "command",
  name: "Command",
  category: "behavioral",
  description:
    "You're building a text editor like VS Code. Users need undo, redo, and macro recording. How do you represent each action so it can be reversed, queued, and replayed? The Command pattern encapsulates a request as an object, allowing you to parameterize clients with queues, requests, and operations -- and it supports undo/redo operations.",
  analogy: "Think of a restaurant order ticket. The waiter writes down your order (Command), hands it to the kitchen (Receiver). The ticket can be queued, modified, or canceled — the waiter doesn't cook, they just pass the request.",
  difficulty: 3,
  tradeoffs: "You gain: undo/redo, queuing, logging, and macro recording of operations. You pay: every action becomes its own class — lots of small command objects to manage.",
  summary: [
    "Command = encapsulate an action as an object with execute() and undo()",
    "Key insight: OPERATIONS become first-class objects that can be stored and replayed",
    "Use when: you need undo/redo, queuing, transaction logging, or macro recording",
  ],
  youAlreadyUseThis: [
    "Ctrl+Z / Cmd+Z in every text editor (undo command stack)",
    "Redux actions ({ type: 'ADD_TODO', payload: ... })",
    "Git commits (each commit is a command with metadata)",
    "Task queues (Bull, Celery) dispatching jobs",
  ],
  predictionPrompts: [
    {
      question: "In a Command-based text editor, what data structure holds the commands for undo?",
      answer: "A stack — the most recent command is on top. Undo pops and calls command.undo(). Redo pushes it back.",
    },
  ],
  classes: [
    {
      id: "c-command",
      name: "Command",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "c-command-meth-0", name: "execute", returnType: "void", params: [], visibility: "+" },
        { id: "c-command-meth-1", name: "undo", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "c-concrete",
      name: "ConcreteCommand",
      stereotype: "class",
      attributes: [
        { id: "c-concrete-attr-0", name: "receiver", type: "Receiver", visibility: "-" },
        { id: "c-concrete-attr-1", name: "params", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "c-concrete-meth-0", name: "execute", returnType: "void", params: [], visibility: "+" },
        { id: "c-concrete-meth-1", name: "undo", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "c-invoker",
      name: "Invoker",
      stereotype: "class",
      attributes: [
        { id: "c-invoker-attr-0", name: "history", type: "Command[]", visibility: "-" },
      ],
      methods: [
        { id: "c-invoker-meth-0", name: "executeCommand", returnType: "void", params: ["cmd: Command"], visibility: "+" },
        { id: "c-invoker-meth-1", name: "undoLast", returnType: "void", params: [], visibility: "+" },
      ],
      x: 60,
      y: 50,
    },
    {
      id: "c-receiver",
      name: "Receiver",
      stereotype: "class",
      attributes: [
        { id: "c-receiver-attr-0", name: "data", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "c-receiver-meth-0", name: "action", returnType: "void", params: ["params: string"], visibility: "+" },
        { id: "c-receiver-meth-1", name: "reverseAction", returnType: "void", params: ["params: string"], visibility: "+" },
      ],
      x: 560,
      y: 250,
    },
  ],
  relationships: [
    { id: rid(), source: "c-concrete", target: "c-command", type: "realization" },
    { id: rid(), source: "c-concrete", target: "c-receiver", type: "association", label: "calls" },
    { id: rid(), source: "c-invoker", target: "c-command", type: "aggregation", label: "stores" },
  ],
  code: {
    typescript: `// Both execute() and undo() are required — this is what makes Command
// reversible. Without undo(), you'd just have a callable object, not a Command.
interface Command {
  execute(): void;
  undo(): void;
}

class Receiver {
  private data = "";

  action(text: string): void {
    this.data += text;
    console.log("Data:", this.data);
  }

  reverseAction(text: string): void {
    this.data = this.data.slice(0, -text.length);
    console.log("Data after undo:", this.data);
  }
}

class WriteCommand implements Command {
  // The command captures BOTH the receiver and the parameters at creation time.
  // This snapshot is what allows deferred execution, queuing, and undo.
  constructor(
    private receiver: Receiver,
    private text: string
  ) {}

  execute(): void { this.receiver.action(this.text); }
  undo(): void { this.receiver.reverseAction(this.text); }
}

class Invoker {
  // History stack is the key data structure — most recent command on top.
  // This same structure powers Ctrl+Z in every text editor you've ever used.
  private history: Command[] = [];

  executeCommand(cmd: Command): void {
    cmd.execute();
    this.history.push(cmd);
  }

  undoLast(): void {
    const cmd = this.history.pop();
    cmd?.undo();
  }
}

// Usage
const receiver = new Receiver();
const invoker = new Invoker();
invoker.executeCommand(new WriteCommand(receiver, "Hello "));
invoker.executeCommand(new WriteCommand(receiver, "World"));
invoker.undoLast(); // Undo "World"

// --- Variant: Text Editor with Undo/Redo History ---

interface EditorCommand {
  execute(): void;
  undo(): void;
}

class TextEditor {
  private content = "";

  insert(text: string, position: number): void {
    this.content = this.content.slice(0, position) + text + this.content.slice(position);
  }

  delete(position: number, length: number): string {
    const deleted = this.content.slice(position, position + length);
    this.content = this.content.slice(0, position) + this.content.slice(position + length);
    return deleted;
  }

  getContent(): string { return this.content; }
}

class InsertCommand implements EditorCommand {
  constructor(
    private editor: TextEditor,
    private text: string,
    private position: number
  ) {}

  execute(): void { this.editor.insert(this.text, this.position); }
  undo(): void { this.editor.delete(this.position, this.text.length); }
}

class DeleteCommand implements EditorCommand {
  private deletedText = "";

  constructor(
    private editor: TextEditor,
    private position: number,
    private length: number
  ) {}

  execute(): void {
    this.deletedText = this.editor.delete(this.position, this.length);
  }

  undo(): void { this.editor.insert(this.deletedText, this.position); }
}

class CommandHistory {
  private undoStack: EditorCommand[] = [];
  private redoStack: EditorCommand[] = [];

  execute(cmd: EditorCommand): void {
    cmd.execute();
    this.undoStack.push(cmd);
    this.redoStack.length = 0; // Clear redo on new action
  }

  undo(): void {
    const cmd = this.undoStack.pop();
    if (cmd) { cmd.undo(); this.redoStack.push(cmd); }
  }

  redo(): void {
    const cmd = this.redoStack.pop();
    if (cmd) { cmd.execute(); this.undoStack.push(cmd); }
  }

  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
}

// Usage
const editor = new TextEditor();
const history = new CommandHistory();

history.execute(new InsertCommand(editor, "Hello World", 0));
console.log(editor.getContent()); // "Hello World"

history.execute(new DeleteCommand(editor, 5, 6));
console.log(editor.getContent()); // "Hello"

history.undo();
console.log(editor.getContent()); // "Hello World"

history.redo();
console.log(editor.getContent()); // "Hello"`,
    python: `from abc import ABC, abstractmethod

class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...
    @abstractmethod
    def undo(self) -> None: ...

class Receiver:
    def __init__(self):
        self._data = ""

    def action(self, text: str) -> None:
        self._data += text
        print(f"Data: {self._data}")

    def reverse_action(self, text: str) -> None:
        self._data = self._data[:-len(text)]
        print(f"Data after undo: {self._data}")

class WriteCommand(Command):
    def __init__(self, receiver: Receiver, text: str):
        self._receiver = receiver
        self._text = text

    def execute(self) -> None:
        self._receiver.action(self._text)

    def undo(self) -> None:
        self._receiver.reverse_action(self._text)

class Invoker:
    def __init__(self):
        self._history: list[Command] = []

    def execute_command(self, cmd: Command) -> None:
        cmd.execute()
        self._history.append(cmd)

    def undo_last(self) -> None:
        if self._history:
            self._history.pop().undo()

# Usage
receiver = Receiver()
invoker = Invoker()
invoker.execute_command(WriteCommand(receiver, "Hello "))
invoker.execute_command(WriteCommand(receiver, "World"))
invoker.undo_last()  # Undo "World"

# --- Variant: Text Editor with Undo/Redo History ---

class EditorCommand(ABC):
    @abstractmethod
    def execute(self) -> None: ...
    @abstractmethod
    def undo(self) -> None: ...

class TextEditor:
    def __init__(self):
        self._content = ""

    def insert(self, text: str, position: int) -> None:
        self._content = self._content[:position] + text + self._content[position:]

    def delete(self, position: int, length: int) -> str:
        deleted = self._content[position:position + length]
        self._content = self._content[:position] + self._content[position + length:]
        return deleted

    @property
    def content(self) -> str:
        return self._content

class InsertCommand(EditorCommand):
    def __init__(self, editor: TextEditor, text: str, position: int):
        self._editor = editor
        self._text = text
        self._position = position

    def execute(self) -> None:
        self._editor.insert(self._text, self._position)

    def undo(self) -> None:
        self._editor.delete(self._position, len(self._text))

class DeleteCommand(EditorCommand):
    def __init__(self, editor: TextEditor, position: int, length: int):
        self._editor = editor
        self._position = position
        self._length = length
        self._deleted_text = ""

    def execute(self) -> None:
        self._deleted_text = self._editor.delete(self._position, self._length)

    def undo(self) -> None:
        self._editor.insert(self._deleted_text, self._position)

class CommandHistory:
    def __init__(self):
        self._undo_stack: list[EditorCommand] = []
        self._redo_stack: list[EditorCommand] = []

    def execute(self, cmd: EditorCommand) -> None:
        cmd.execute()
        self._undo_stack.append(cmd)
        self._redo_stack.clear()  # Clear redo on new action

    def undo(self) -> None:
        if self._undo_stack:
            cmd = self._undo_stack.pop()
            cmd.undo()
            self._redo_stack.append(cmd)

    def redo(self) -> None:
        if self._redo_stack:
            cmd = self._redo_stack.pop()
            cmd.execute()
            self._undo_stack.append(cmd)

    @property
    def can_undo(self) -> bool:
        return len(self._undo_stack) > 0

    @property
    def can_redo(self) -> bool:
        return len(self._redo_stack) > 0

# Usage
editor = TextEditor()
history = CommandHistory()

history.execute(InsertCommand(editor, "Hello World", 0))
print(editor.content)  # "Hello World"

history.execute(DeleteCommand(editor, 5, 6))
print(editor.content)  # "Hello"

history.undo()
print(editor.content)  # "Hello World"

history.redo()
print(editor.content)  # "Hello"`,
  },
  realWorldExamples: [
    "Text editor undo/redo system",
    "Database transaction with rollback capability",
    "Task queue systems (job scheduling with retry)",
  ],
  whenToUse: [
    "You need undo/redo functionality",
    "You need to queue, schedule, or log operations",
    "You want to decouple the sender of a request from the receiver",
  ],
  whenNotToUse: [
    "When operations are simple and don't need undo",
    "When the overhead of command objects is not justified",
    "When direct method calls are sufficient and clear",
  ],
  interviewTips: [
    "Undo/redo is the killer use case — always demonstrate it",
    "Show the command queue variant for task scheduling and macro recording",
    "Key insight: Command decouples WHEN and WHO invokes from WHAT gets executed",
  ],
  commonMistakes: [
    "Making commands too granular — one command per tiny operation creates excessive overhead",
    "Forgetting to implement undo() — if you don't need undo, you might not need Command",
    "Storing too much state in the command for undo — use Memento for complex state snapshots",
  ],
  confusedWith: [
    { patternId: "strategy", difference: "Command encapsulates a REQUEST (undoable). Strategy encapsulates an ALGORITHM (swappable)." },
  ],
  relatedPatterns: [
    { patternId: "memento", relationship: "Memento can store the state needed to undo a Command" },
    { patternId: "observer", relationship: "Commands can be dispatched through Observer notification channels" },
    { patternId: "chain-of-responsibility", relationship: "Command is a specific request object; Chain of Responsibility routes it to a handler" },
    { patternId: "strategy", relationship: "Both encapsulate behavior objects, but Command is about requests and Strategy about algorithms" },
  ],
};

const state: DesignPattern = {
  id: "state",
  name: "State",
  category: "behavioral",
  description:
    "You're building an order system for Amazon. An order transitions through pending, paid, shipped, and delivered -- and the allowed actions change at each step. A giant switch statement becomes a nightmare to maintain. The State pattern allows an object to alter its behavior when its internal state changes, making the object appear to change its class.",
  analogy: "Think of a traffic light. When it's green, cars go. When red, cars stop. The light changes its own state, and the behavior of the entire intersection changes accordingly — no one rewires the intersection at each change.",
  difficulty: 3,
  tradeoffs: "You gain: clean state transitions without massive switch/case blocks. You pay: one class per state — can be heavy if you have many states with little unique behavior.",
  summary: [
    "State = object behavior changes when its internal state changes",
    "Key insight: the SYSTEM decides transitions, unlike Strategy where the USER picks",
    "Use when: an object's behavior depends on its state and transitions are complex",
  ],
  youAlreadyUseThis: [
    "TCP connection states (LISTEN, ESTABLISHED, CLOSE_WAIT)",
    "React component lifecycle (mounting, updating, unmounting)",
    "Promise states (pending, fulfilled, rejected)",
    "Git branch states (clean, dirty, merging, rebasing)",
  ],
  predictionPrompts: [
    {
      question: "What is the key difference between State and Strategy patterns?",
      answer: "In Strategy, the CLIENT chooses the algorithm. In State, the OBJECT itself transitions between states based on internal rules. State changes are automatic; strategy changes are manual.",
    },
  ],
  classes: [
    {
      id: "st-state",
      name: "State",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "st-state-meth-0", name: "handle", returnType: "void", params: ["context: Context"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "st-concrete-a",
      name: "ConcreteStateA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "st-concrete-a-meth-0", name: "handle", returnType: "void", params: ["context: Context"], visibility: "+" },
      ],
      x: 120,
      y: 250,
    },
    {
      id: "st-concrete-b",
      name: "ConcreteStateB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "st-concrete-b-meth-0", name: "handle", returnType: "void", params: ["context: Context"], visibility: "+" },
      ],
      x: 480,
      y: 250,
    },
    {
      id: "st-context",
      name: "Context",
      stereotype: "class",
      attributes: [
        { id: "st-context-attr-0", name: "state", type: "State", visibility: "-" },
      ],
      methods: [
        { id: "st-context-meth-0", name: "setState", returnType: "void", params: ["state: State"], visibility: "+" },
        { id: "st-context-meth-1", name: "request", returnType: "void", params: [], visibility: "+" },
      ],
      x: 300,
      y: 430,
    },
  ],
  relationships: [
    { id: rid(), source: "st-concrete-a", target: "st-state", type: "realization" },
    { id: rid(), source: "st-concrete-b", target: "st-state", type: "realization" },
    { id: rid(), source: "st-context", target: "st-state", type: "aggregation", label: "current state" },
  ],
  code: {
    typescript: `interface State {
  handle(context: Context): void;
}

class Context {
  private state: State;

  constructor(initialState: State) {
    this.state = initialState;
  }

  // setState is public because STATES themselves trigger transitions.
  // Unlike Strategy where the CLIENT picks, here the STATE decides what's next.
  setState(state: State): void {
    console.log(\`Context: transitioning to \${state.constructor.name}\`);
    this.state = state;
  }

  // Same method, different behavior depending on current state.
  // The caller doesn't know which state is active — that's the point.
  request(): void {
    this.state.handle(this);
  }
}

class GreenLight implements State {
  handle(context: Context): void {
    console.log("GREEN: Cars go. Transitioning to Yellow...");
    // Each state knows its successor — this creates a state machine.
    // The transition logic lives IN the state, not in a giant switch block.
    context.setState(new YellowLight());
  }
}

class YellowLight implements State {
  handle(context: Context): void {
    console.log("YELLOW: Caution! Transitioning to Red...");
    context.setState(new RedLight());
  }
}

class RedLight implements State {
  handle(context: Context): void {
    console.log("RED: Cars stop. Transitioning to Green...");
    context.setState(new GreenLight());
  }
}

// Usage - traffic light state machine
const light = new Context(new GreenLight());
light.request(); // GREEN -> Yellow
light.request(); // YELLOW -> Red
light.request(); // RED -> Green`,
    python: `from abc import ABC, abstractmethod

class State(ABC):
    @abstractmethod
    def handle(self, context: "Context") -> None: ...

class Context:
    def __init__(self, initial_state: State):
        self._state = initial_state

    def set_state(self, state: State) -> None:
        print(f"Context: transitioning to {type(state).__name__}")
        self._state = state

    def request(self) -> None:
        self._state.handle(self)

class GreenLight(State):
    def handle(self, context: Context) -> None:
        print("GREEN: Cars go. Transitioning to Yellow...")
        context.set_state(YellowLight())

class YellowLight(State):
    def handle(self, context: Context) -> None:
        print("YELLOW: Caution! Transitioning to Red...")
        context.set_state(RedLight())

class RedLight(State):
    def handle(self, context: Context) -> None:
        print("RED: Cars stop. Transitioning to Green...")
        context.set_state(GreenLight())

# Usage - traffic light state machine
light = Context(GreenLight())
light.request()  # GREEN -> Yellow
light.request()  # YELLOW -> Red
light.request()  # RED -> Green`,
  },
  realWorldExamples: [
    "Traffic light controller (green/yellow/red transitions)",
    "TCP connection states (listen, established, closed)",
    "Order fulfillment workflow (pending, paid, shipped, delivered)",
  ],
  whenToUse: [
    "An object's behavior depends on its state and must change at runtime",
    "Operations have large conditional statements based on object state",
    "State transitions follow defined rules (finite state machine)",
  ],
  whenNotToUse: [
    "When there are only 2-3 states with simple transitions",
    "When state changes are infrequent and a simple switch suffices",
    "When the overhead of state classes exceeds the benefit",
  ],
  interviewTips: [
    "Draw the state machine diagram first, then map states to classes",
    "Classic follow-up: how is this different from Strategy? (automatic vs manual switching)",
    "Mention that state transitions can be in the state objects OR in the context — discuss tradeoffs",
  ],
  commonMistakes: [
    "Putting transition logic in the context instead of the state objects (defeats the purpose)",
    "Not defining all valid transitions — leads to illegal state transitions at runtime",
    "State explosion: too many states with complex transitions — consider a state machine library instead",
  ],
  confusedWith: [
    { patternId: "strategy", difference: "Strategy = USER selects algorithm. State = SYSTEM transitions automatically." },
  ],
  relatedPatterns: [
    { patternId: "strategy", relationship: "Structurally identical, but State transitions happen automatically while Strategy is user-selected" },
    { patternId: "observer", relationship: "State transitions often notify observers of the change" },
    { patternId: "singleton", relationship: "State objects are often Singletons since they hold no instance-specific data" },
  ],
};

// ════════════════════════════════════════════════════════════
//  STRUCTURAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const proxy: DesignPattern = {
  id: "proxy",
  name: "Proxy",
  category: "structural",
  description:
    "You're loading high-resolution images in a web page. Downloading all of them upfront takes 10 seconds. You need a placeholder that loads the real image only when the user scrolls to it. The Proxy pattern provides a surrogate or placeholder for another object to control access, optionally adding caching, access control, or lazy initialization.",
  analogy: "Think of a security guard at a building entrance. The guard looks like a door (same interface), but controls who gets through — checking badges, logging entries, or denying access. The building behind the guard is the real object.",
  difficulty: 3,
  tradeoffs: "You gain: controlled access with lazy loading, caching, or security checks. You pay: response time increases by one indirection layer, and the proxy may get out of sync with the real object.",
  summary: [
    "Proxy = a stand-in object that controls access to the real one",
    "Key insight: same interface as the real object, but intercepts calls to add behavior",
    "Use when: you need lazy loading, access control, caching, or logging transparently",
  ],
  youAlreadyUseThis: [
    "JavaScript Proxy object (new Proxy(target, handler))",
    "Nginx reverse proxy (sits in front of backend servers)",
    "React.lazy() (lazy-loads components on demand)",
    "Python property descriptors (@property getter/setter)",
  ],
  classes: [
    {
      id: "px-subject",
      name: "Subject",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "px-subject-meth-0", name: "request", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "px-real",
      name: "RealSubject",
      stereotype: "class",
      attributes: [
        { id: "px-real-attr-0", name: "data", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "px-real-meth-0", name: "request", returnType: "string", params: [], visibility: "+" },
      ],
      x: 120,
      y: 280,
    },
    {
      id: "px-proxy",
      name: "Proxy",
      stereotype: "class",
      attributes: [
        { id: "px-proxy-attr-0", name: "realSubject", type: "RealSubject", visibility: "-" },
        { id: "px-proxy-attr-1", name: "cache", type: "Map<string, string>", visibility: "-" },
      ],
      methods: [
        { id: "px-proxy-meth-0", name: "request", returnType: "string", params: [], visibility: "+" },
        { id: "px-proxy-meth-1", name: "checkAccess", returnType: "boolean", params: [], visibility: "-" },
        { id: "px-proxy-meth-2", name: "logAccess", returnType: "void", params: [], visibility: "-" },
      ],
      x: 480,
      y: 280,
    },
    {
      id: "px-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "px-client-meth-0", name: "doWork", returnType: "void", params: ["subject: Subject"], visibility: "+" },
      ],
      x: 300,
      y: -120,
    },
  ],
  relationships: [
    { id: rid(), source: "px-real", target: "px-subject", type: "realization" },
    { id: rid(), source: "px-proxy", target: "px-subject", type: "realization" },
    { id: rid(), source: "px-proxy", target: "px-real", type: "association", label: "delegates to" },
    { id: rid(), source: "px-client", target: "px-subject", type: "dependency", label: "uses" },
  ],
  code: {
    typescript: `interface Subject {
  request(): string;
}

class RealSubject implements Subject {
  request(): string {
    console.log("RealSubject: handling request (expensive operation)...");
    return "Real data loaded from remote source";
  }
}

class ImageProxy implements Subject {
  private realSubject: RealSubject | null = null;
  private cache: string | null = null;

  private checkAccess(): boolean {
    console.log("Proxy: checking access before forwarding request.");
    return true;
  }

  private logAccess(): void {
    console.log("Proxy: logging time of request.");
  }

  request(): string {
    if (this.cache) {
      console.log("Proxy: returning cached result.");
      return this.cache;
    }

    if (!this.checkAccess()) {
      return "Access denied";
    }

    // Lazy initialization
    if (!this.realSubject) {
      this.realSubject = new RealSubject();
    }

    const result = this.realSubject.request();
    this.cache = result;
    this.logAccess();
    return result;
  }
}

// Usage - lazy-loading image proxy
const proxy: Subject = new ImageProxy();
console.log(proxy.request()); // Loads from real subject
console.log(proxy.request()); // Returns cached result

// --- Variant: Protection Proxy (Access Control) ---

interface SecureDoc {
  read(): string;
  write(content: string): void;
}

class RealDocument implements SecureDoc {
  private content = "Confidential data";

  read(): string { return this.content; }
  write(content: string): void { this.content = content; }
}

type UserRole = "admin" | "editor" | "viewer";

class ProtectionProxy implements SecureDoc {
  constructor(
    private doc: RealDocument,
    private userRole: UserRole
  ) {}

  read(): string {
    console.log(\`[Protection] \${this.userRole} reading document\`);
    return this.doc.read();
  }

  write(content: string): void {
    if (this.userRole !== "admin" && this.userRole !== "editor") {
      throw new Error(\`Access denied: \${this.userRole} cannot write\`);
    }
    console.log(\`[Protection] \${this.userRole} writing document\`);
    this.doc.write(content);
  }
}

// Usage — Protection Proxy
const realDoc = new RealDocument();
const viewerProxy: SecureDoc = new ProtectionProxy(realDoc, "viewer");
console.log(viewerProxy.read()); // OK
// viewerProxy.write("hack"); // throws "Access denied: viewer cannot write"

const adminProxy: SecureDoc = new ProtectionProxy(realDoc, "admin");
adminProxy.write("Updated by admin"); // OK

// --- Variant: Caching Proxy (Memoization) ---

interface DataService {
  fetchData(query: string): string;
}

class ExpensiveService implements DataService {
  fetchData(query: string): string {
    console.log(\`[Expensive] Fetching "\${query}" from database...\`);
    return \`Result for: \${query}\`;
  }
}

class CachingProxy implements DataService {
  private cache = new Map<string, { data: string; timestamp: number }>();
  private ttlMs: number;

  constructor(private service: ExpensiveService, ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  fetchData(query: string): string {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.ttlMs) {
      console.log(\`[Cache HIT] "\${query}"\`);
      return cached.data;
    }

    console.log(\`[Cache MISS] "\${query}"\`);
    const data = this.service.fetchData(query);
    this.cache.set(query, { data, timestamp: Date.now() });
    return data;
  }

  invalidate(query: string): void { this.cache.delete(query); }
  clearCache(): void { this.cache.clear(); }
}

// Usage — Caching Proxy
const service: DataService = new CachingProxy(new ExpensiveService(), 5000);
console.log(service.fetchData("users")); // Cache MISS, hits DB
console.log(service.fetchData("users")); // Cache HIT, returns cached`,
    python: `from abc import ABC, abstractmethod

class Subject(ABC):
    @abstractmethod
    def request(self) -> str: ...

class RealSubject(Subject):
    def request(self) -> str:
        print("RealSubject: handling request (expensive operation)...")
        return "Real data loaded from remote source"

class ImageProxy(Subject):
    def __init__(self):
        self._real_subject: RealSubject | None = None
        self._cache: str | None = None

    def _check_access(self) -> bool:
        print("Proxy: checking access before forwarding request.")
        return True

    def _log_access(self) -> None:
        print("Proxy: logging time of request.")

    def request(self) -> str:
        if self._cache:
            print("Proxy: returning cached result.")
            return self._cache

        if not self._check_access():
            return "Access denied"

        # Lazy initialization
        if not self._real_subject:
            self._real_subject = RealSubject()

        result = self._real_subject.request()
        self._cache = result
        self._log_access()
        return result

# Usage - lazy-loading image proxy
proxy: Subject = ImageProxy()
print(proxy.request())  # Loads from real subject
print(proxy.request())  # Returns cached result

# --- Variant: Protection Proxy (Access Control) ---

from typing import Literal

class SecureDoc(ABC):
    @abstractmethod
    def read(self) -> str: ...
    @abstractmethod
    def write(self, content: str) -> None: ...

class RealDocument(SecureDoc):
    def __init__(self):
        self._content = "Confidential data"

    def read(self) -> str:
        return self._content

    def write(self, content: str) -> None:
        self._content = content

UserRole = Literal["admin", "editor", "viewer"]

class ProtectionProxy(SecureDoc):
    def __init__(self, doc: RealDocument, user_role: UserRole):
        self._doc = doc
        self._user_role = user_role

    def read(self) -> str:
        print(f"[Protection] {self._user_role} reading document")
        return self._doc.read()

    def write(self, content: str) -> None:
        if self._user_role not in ("admin", "editor"):
            raise PermissionError(f"Access denied: {self._user_role} cannot write")
        print(f"[Protection] {self._user_role} writing document")
        self._doc.write(content)

# Usage - Protection Proxy
real_doc = RealDocument()
viewer_proxy: SecureDoc = ProtectionProxy(real_doc, "viewer")
print(viewer_proxy.read())  # OK
# viewer_proxy.write("hack")  # raises PermissionError

admin_proxy: SecureDoc = ProtectionProxy(real_doc, "admin")
admin_proxy.write("Updated by admin")  # OK

# --- Variant: Caching Proxy (Memoization) ---

import time

class DataService(ABC):
    @abstractmethod
    def fetch_data(self, query: str) -> str: ...

class ExpensiveService(DataService):
    def fetch_data(self, query: str) -> str:
        print(f'[Expensive] Fetching "{query}" from database...')
        return f"Result for: {query}"

class CachingProxy(DataService):
    def __init__(self, service: ExpensiveService, ttl_seconds: float = 60):
        self._service = service
        self._ttl = ttl_seconds
        self._cache: dict[str, tuple[str, float]] = {}

    def fetch_data(self, query: str) -> str:
        if query in self._cache:
            data, timestamp = self._cache[query]
            if time.time() - timestamp < self._ttl:
                print(f'[Cache HIT] "{query}"')
                return data

        print(f'[Cache MISS] "{query}"')
        data = self._service.fetch_data(query)
        self._cache[query] = (data, time.time())
        return data

    def invalidate(self, query: str) -> None:
        self._cache.pop(query, None)

    def clear_cache(self) -> None:
        self._cache.clear()

# Usage - Caching Proxy
service: DataService = CachingProxy(ExpensiveService(), ttl_seconds=5)
print(service.fetch_data("users"))  # Cache MISS, hits DB
print(service.fetch_data("users"))  # Cache HIT, returns cached`,
  },
  realWorldExamples: [
    "Caching proxy for expensive API calls or database queries",
    "Access control proxy (authentication/authorization checks before forwarding)",
    "Lazy-loading image proxy in web browsers (placeholder until scroll)",
    "Logging proxy that records all calls to a service",
  ],
  whenToUse: [
    "You need lazy initialization of a heavyweight object",
    "You want to add access control to an existing service",
    "You need local caching of results from a remote service",
    "You want to log or monitor access to an object transparently",
  ],
  whenNotToUse: [
    "When the overhead of an extra indirection layer is not justified",
    "When the real subject is cheap to create and access",
    "When you need full transparency and any behavioral change is unacceptable",
  ],
  interviewTips: [
    "Name the 4 proxy types: virtual (lazy), protection (access), remote (network), logging",
    "Contrast with Decorator: same structure, different intent (access vs enhancement)",
    "Mention JavaScript's Proxy object as a language-level implementation of this pattern",
  ],
  commonMistakes: [
    "Adding too much logic to the proxy — it should control access, not implement business logic",
    "Forgetting that the proxy must maintain the same interface as the real subject",
    "Not considering the performance overhead of proxy indirection in hot paths",
  ],
  confusedWith: [
    { patternId: "decorator", difference: "Decorator adds behavior. Proxy controls access. Decorator is stackable; Proxy usually isn't." },
  ],
  relatedPatterns: [
    { patternId: "decorator", relationship: "Both wrap objects, but Proxy controls access while Decorator adds behavior" },
    { patternId: "adapter", relationship: "Adapter provides a different interface; Proxy provides the same interface with controlled access" },
    { patternId: "facade", relationship: "Facade simplifies a subsystem; Proxy controls access to a single object" },
  ],
};

// ════════════════════════════════════════════════════════════
//  BEHAVIORAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const iterator: DesignPattern = {
  id: "iterator",
  name: "Iterator",
  category: "behavioral",
  description:
    "You're building a Spotify-like playlist system. Users iterate through songs, but the underlying data could be an array, a linked list, or a database cursor. You don't want to expose those internals. The Iterator pattern provides a way to access elements of an aggregate object sequentially without exposing its underlying representation.",
  analogy: "Think of a TV remote's channel up/down buttons. You don't need to know how channels are stored internally (satellite, cable, streaming). You just press next/previous to traverse them one at a time.",
  difficulty: 2,
  tradeoffs: "You gain: uniform traversal regardless of the underlying data structure. You pay: overhead of creating iterator objects — trivial for arrays, significant for complex custom structures.",
  summary: [
    "Iterator = traverse a collection without exposing its internal structure",
    "Key insight: hasNext() + next() is the universal interface for sequential access",
    "Use when: you need to iterate over custom data structures uniformly",
  ],
  youAlreadyUseThis: [
    "JavaScript for...of loop (uses Symbol.iterator protocol)",
    "Python for item in collection (uses __iter__ / __next__)",
    "Java Iterator and Iterable interfaces",
    "Database cursors (paginated result traversal)",
  ],
  classes: [
    {
      id: "it-iterator",
      name: "Iterator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "it-iterator-meth-0", name: "hasNext", returnType: "boolean", params: [], visibility: "+" },
        { id: "it-iterator-meth-1", name: "next", returnType: "T", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "it-collection",
      name: "IterableCollection",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "it-collection-meth-0", name: "createIterator", returnType: "Iterator", params: [], visibility: "+" },
      ],
      x: 100,
      y: 50,
    },
    {
      id: "it-concrete-collection",
      name: "ConcreteCollection",
      stereotype: "class",
      attributes: [
        { id: "it-concrete-collection-attr-0", name: "items", type: "T[]", visibility: "-" },
      ],
      methods: [
        { id: "it-concrete-collection-meth-0", name: "createIterator", returnType: "Iterator", params: [], visibility: "+" },
        { id: "it-concrete-collection-meth-1", name: "getItems", returnType: "T[]", params: [], visibility: "+" },
        { id: "it-concrete-collection-meth-2", name: "addItem", returnType: "void", params: ["item: T"], visibility: "+" },
      ],
      x: 100,
      y: 280,
    },
    {
      id: "it-concrete-iterator",
      name: "ConcreteIterator",
      stereotype: "class",
      attributes: [
        { id: "it-concrete-iterator-attr-0", name: "collection", type: "ConcreteCollection", visibility: "-" },
        { id: "it-concrete-iterator-attr-1", name: "position", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "it-concrete-iterator-meth-0", name: "hasNext", returnType: "boolean", params: [], visibility: "+" },
        { id: "it-concrete-iterator-meth-1", name: "next", returnType: "T", params: [], visibility: "+" },
      ],
      x: 400,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "it-concrete-collection", target: "it-collection", type: "realization" },
    { id: rid(), source: "it-concrete-iterator", target: "it-iterator", type: "realization" },
    { id: rid(), source: "it-collection", target: "it-iterator", type: "dependency", label: "creates" },
    { id: rid(), source: "it-concrete-iterator", target: "it-concrete-collection", type: "association", label: "traverses" },
  ],
  code: {
    typescript: `interface Iterator<T> {
  hasNext(): boolean;
  next(): T;
}

interface IterableCollection<T> {
  createIterator(): Iterator<T>;
}

class NumberCollection implements IterableCollection<number> {
  private items: number[] = [];

  addItem(item: number): void {
    this.items.push(item);
  }

  getItems(): number[] {
    return this.items;
  }

  createIterator(): Iterator<number> {
    return new NumberIterator(this);
  }
}

class NumberIterator implements Iterator<number> {
  private position = 0;

  constructor(private collection: NumberCollection) {}

  hasNext(): boolean {
    return this.position < this.collection.getItems().length;
  }

  next(): number {
    const item = this.collection.getItems()[this.position];
    this.position++;
    return item;
  }
}

// Usage
const collection = new NumberCollection();
collection.addItem(10);
collection.addItem(20);
collection.addItem(30);

const iter = collection.createIterator();
while (iter.hasNext()) {
  console.log(iter.next()); // 10, 20, 30
}

// ── Generator Variant ──────────────────────────────────
// Generators are syntactic sugar for the Iterator pattern.

// TypeScript: Symbol.iterator / for-of protocol
class NumberRange {
  constructor(private start: number, private end: number) {}

  *[Symbol.iterator](): Generator<number> {
    for (let i = this.start; i <= this.end; i++) {
      yield i;
    }
  }
}

// for-of automatically calls Symbol.iterator and .next()
for (const n of new NumberRange(1, 5)) {
  console.log(n); // 1, 2, 3, 4, 5
}`,
    python: `from abc import ABC, abstractmethod
from typing import Generic, TypeVar

T = TypeVar("T")

class Iterator(ABC, Generic[T]):
    @abstractmethod
    def has_next(self) -> bool: ...

    @abstractmethod
    def next(self) -> T: ...

class IterableCollection(ABC, Generic[T]):
    @abstractmethod
    def create_iterator(self) -> "Iterator[T]": ...

class NumberCollection(IterableCollection[int]):
    def __init__(self):
        self._items: list[int] = []

    def add_item(self, item: int) -> None:
        self._items.append(item)

    def get_items(self) -> list[int]:
        return self._items

    def create_iterator(self) -> "Iterator[int]":
        return NumberIterator(self)

class NumberIterator(Iterator[int]):
    def __init__(self, collection: NumberCollection):
        self._collection = collection
        self._position = 0

    def has_next(self) -> bool:
        return self._position < len(self._collection.get_items())

    def next(self) -> int:
        item = self._collection.get_items()[self._position]
        self._position += 1
        return item

# Usage
collection = NumberCollection()
collection.add_item(10)
collection.add_item(20)
collection.add_item(30)

it = collection.create_iterator()
while it.has_next():
    print(it.next())  # 10, 20, 30

# ── Generator Variant ──────────────────────────────────
# Generators are syntactic sugar for the Iterator pattern.

# Python: yield keyword creates a generator (iterator) automatically
def number_range(start: int, end: int):
    """Generator function — each yield suspends and produces a value."""
    i = start
    while i <= end:
        yield i
        i += 1

# for-in automatically calls __iter__ / __next__ on the generator
for n in number_range(1, 5):
    print(n)  # 1, 2, 3, 4, 5`,
  },
  realWorldExamples: [
    "Database cursor iterating over query result rows",
    "File system traversal (walking a directory tree)",
    "Custom collection classes with multiple traversal strategies",
    "Streaming data processing (reading records from a large file)",
  ],
  whenToUse: [
    "You need to traverse a complex data structure without exposing its internals",
    "You want to support multiple traversal strategies on the same collection",
    "You need a uniform interface for traversing different collection types",
  ],
  whenNotToUse: [
    "When the collection is a simple array or list with built-in iteration",
    "When only one traversal strategy is ever needed",
    "When the overhead of iterator objects is not justified for small collections",
  ],
  interviewTips: [
    "Focus on the separation of traversal logic from the collection itself",
    "Modern twist: generators (yield) and Symbol.iterator in JS are Iterator pattern",
    "Key insight: multiple iterators on the same collection work independently",
  ],
  commonMistakes: [
    "Modifying the collection while iterating — leads to ConcurrentModificationException-style bugs",
    "Exposing the collection's internal structure through the iterator",
    "Implementing a custom iterator when the language's built-in iteration protocol suffices",
  ],
  relatedPatterns: [
    { patternId: "composite", relationship: "Iterator is often used to traverse Composite tree structures" },
    { patternId: "visitor", relationship: "Iterator traverses a structure; Visitor defines operations to perform at each element" },
    { patternId: "memento", relationship: "Iterator can use Memento to capture iteration state for bookmarking" },
  ],
};

const mediator: DesignPattern = {
  id: "mediator",
  name: "Mediator",
  category: "behavioral",
  description:
    "You're building a Slack-like chat app. When a user sends a message, it needs to reach the right channel members, trigger notifications, and update read receipts. If every component talks to every other component directly, you get a tangled web. The Mediator pattern defines an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly.",
  analogy: "Think of an airport control tower. Planes don't communicate directly with each other — that would be chaos. Instead, every plane talks only to the control tower, which coordinates all takeoffs, landings, and taxiing.",
  difficulty: 4,
  tradeoffs: "You gain: decoupled components that communicate through a central hub. You pay: the mediator can become a god object that knows too much and is hard to maintain.",
  summary: [
    "Mediator = central hub coordinates communication between components",
    "Key insight: components don't know about each other, only about the mediator",
    "Use when: many objects communicate in complex ways and you need to decouple them",
  ],
  youAlreadyUseThis: [
    "Redux store (central state mediates between all components)",
    "Express router (mediates between requests and handlers)",
    "Chat room servers (mediate messages between connected clients)",
    "React Context (parent mediates data to deeply nested children)",
  ],
  classes: [
    {
      id: "med-mediator",
      name: "Mediator",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "med-mediator-meth-0", name: "notify", returnType: "void", params: ["sender: Colleague", "event: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "med-concrete",
      name: "ConcreteMediator",
      stereotype: "class",
      attributes: [
        { id: "med-concrete-attr-0", name: "colleagueA", type: "ConcreteColleagueA", visibility: "-" },
        { id: "med-concrete-attr-1", name: "colleagueB", type: "ConcreteColleagueB", visibility: "-" },
      ],
      methods: [
        { id: "med-concrete-meth-0", name: "notify", returnType: "void", params: ["sender: Colleague", "event: string"], visibility: "+" },
        { id: "med-concrete-meth-1", name: "registerColleagues", returnType: "void", params: ["a: ConcreteColleagueA", "b: ConcreteColleagueB"], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "med-colleague",
      name: "Colleague",
      stereotype: "abstract",
      attributes: [
        { id: "med-colleague-attr-0", name: "mediator", type: "Mediator", visibility: "#" },
      ],
      methods: [
        { id: "med-colleague-meth-0", name: "setMediator", returnType: "void", params: ["mediator: Mediator"], visibility: "+" },
      ],
      x: 300,
      y: 460,
    },
    {
      id: "med-colleague-a",
      name: "ConcreteColleagueA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "med-colleague-a-meth-0", name: "send", returnType: "void", params: ["message: string"], visibility: "+" },
        { id: "med-colleague-a-meth-1", name: "receive", returnType: "void", params: ["message: string"], visibility: "+" },
      ],
      x: 100,
      y: 660,
    },
    {
      id: "med-colleague-b",
      name: "ConcreteColleagueB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "med-colleague-b-meth-0", name: "send", returnType: "void", params: ["message: string"], visibility: "+" },
        { id: "med-colleague-b-meth-1", name: "receive", returnType: "void", params: ["message: string"], visibility: "+" },
      ],
      x: 500,
      y: 660,
    },
  ],
  relationships: [
    { id: rid(), source: "med-concrete", target: "med-mediator", type: "realization" },
    { id: rid(), source: "med-colleague-a", target: "med-colleague", type: "inheritance" },
    { id: rid(), source: "med-colleague-b", target: "med-colleague", type: "inheritance" },
    { id: rid(), source: "med-colleague", target: "med-mediator", type: "association", label: "communicates via" },
    { id: rid(), source: "med-concrete", target: "med-colleague-a", type: "association", label: "coordinates" },
    { id: rid(), source: "med-concrete", target: "med-colleague-b", type: "association", label: "coordinates" },
  ],
  code: {
    typescript: `interface Mediator {
  notify(sender: Colleague, event: string): void;
}

abstract class Colleague {
  protected mediator?: Mediator;

  setMediator(mediator: Mediator): void {
    this.mediator = mediator;
  }
}

class ChatUser extends Colleague {
  constructor(public name: string) {
    super();
  }

  send(message: string): void {
    console.log(\`\${this.name} sends: \${message}\`);
    this.mediator?.notify(this, message);
  }

  receive(message: string): void {
    console.log(\`\${this.name} receives: \${message}\`);
  }
}

class ChatRoom implements Mediator {
  private users: ChatUser[] = [];

  register(user: ChatUser): void {
    user.setMediator(this);
    this.users.push(user);
  }

  notify(sender: Colleague, event: string): void {
    for (const user of this.users) {
      if (user !== sender) {
        user.receive(event);
      }
    }
  }
}

// Usage - chat room mediator
const room = new ChatRoom();
const alice = new ChatUser("Alice");
const bob = new ChatUser("Bob");
const charlie = new ChatUser("Charlie");

room.register(alice);
room.register(bob);
room.register(charlie);

alice.send("Hello everyone!"); // Bob and Charlie receive`,
    python: `from abc import ABC, abstractmethod

class Mediator(ABC):
    @abstractmethod
    def notify(self, sender: "Colleague", event: str) -> None: ...

class Colleague(ABC):
    def __init__(self):
        self._mediator: Mediator | None = None

    def set_mediator(self, mediator: Mediator) -> None:
        self._mediator = mediator

class ChatUser(Colleague):
    def __init__(self, name: str):
        super().__init__()
        self.name = name

    def send(self, message: str) -> None:
        print(f"{self.name} sends: {message}")
        if self._mediator:
            self._mediator.notify(self, message)

    def receive(self, message: str) -> None:
        print(f"{self.name} receives: {message}")

class ChatRoom(Mediator):
    def __init__(self):
        self._users: list[ChatUser] = []

    def register(self, user: ChatUser) -> None:
        user.set_mediator(self)
        self._users.append(user)

    def notify(self, sender: Colleague, event: str) -> None:
        for user in self._users:
            if user is not sender:
                user.receive(event)

# Usage - chat room mediator
room = ChatRoom()
alice = ChatUser("Alice")
bob = ChatUser("Bob")
charlie = ChatUser("Charlie")

room.register(alice)
room.register(bob)
room.register(charlie)

alice.send("Hello everyone!")  # Bob and Charlie receive`,
  },
  realWorldExamples: [
    "Chat room routing messages between participants",
    "Air traffic control tower coordinating planes on runways",
    "UI dialog mediating interactions between form controls",
    "Event bus in microservices coordinating service communication",
  ],
  whenToUse: [
    "A set of objects communicate in well-defined but complex ways",
    "You want to reduce the many-to-many relationships between objects",
    "You want to centralize control logic that spans multiple objects",
  ],
  whenNotToUse: [
    "When there are only two objects communicating (direct reference is simpler)",
    "When the mediator becomes a god object with too much logic",
    "When colleagues need high-performance direct communication without indirection",
  ],
  interviewTips: [
    "Air traffic control is the perfect analogy — planes don't talk to each other, they talk to the tower",
    "Contrast with Observer: Observer is 1-to-many broadcast, Mediator is many-to-many coordination",
    "Show awareness that the Mediator can become a God Object — discuss when to split it",
  ],
  commonMistakes: [
    "Letting the Mediator grow into a God Object that knows too much about every colleague",
    "Colleagues still referencing each other directly instead of going through the Mediator",
    "Not defining clear protocols/events — the Mediator becomes a tangled mess of if/else chains",
  ],
  confusedWith: [
    { patternId: "observer", difference: "Observer = 1-to-many broadcast. Mediator = many-to-many through a central hub." },
  ],
  relatedPatterns: [
    { patternId: "observer", relationship: "Observer distributes communication; Mediator centralizes it through a hub" },
    { patternId: "facade", relationship: "Both simplify complex interactions, but Facade is one-way while Mediator is bidirectional" },
    { patternId: "command", relationship: "Commands can be routed through a Mediator to decouple senders from receivers" },
  ],
};

const templateMethod: DesignPattern = {
  id: "template-method",
  name: "Template Method",
  category: "behavioral",
  description:
    "You're building data importers for CSV, JSON, and XML. They all follow the same steps -- open, parse, validate, close -- but each format implements those steps differently. Duplicating the workflow in every importer is a bug waiting to happen. The Template Method pattern defines the skeleton of an algorithm in a method, deferring some steps to subclasses without changing the overall structure.",
  analogy: "Think of a recipe with blanks. The recipe says: 'preheat oven, prepare [filling], assemble, bake for [time].' Whether you make apple pie or cherry pie, the steps are the same — only the filling and bake time change.",
  difficulty: 3,
  tradeoffs: "You gain: shared algorithm skeleton eliminates code duplication across variants. You pay: locked into inheritance — you can't easily compose behaviors from multiple template methods.",
  summary: [
    "Template Method = fixed algorithm skeleton, subclasses fill in the steps",
    "Key insight: the parent class controls the FLOW, subclasses control the DETAILS",
    "Use when: multiple classes share the same algorithm but differ in specific steps",
  ],
  youAlreadyUseThis: [
    "React class component lifecycle (mount → render → update → unmount)",
    "JUnit/pytest test setup → run → teardown",
    "Express middleware chain (fixed request pipeline, custom handlers)",
    "Django class-based views (get(), post() override skeleton)",
  ],
  classes: [
    {
      id: "tm-abstract",
      name: "AbstractClass",
      stereotype: "abstract",
      attributes: [],
      methods: [
        { id: "tm-abstract-meth-0", name: "templateMethod", returnType: "string", params: [], visibility: "+" },
        { id: "tm-abstract-meth-1", name: "stepOpen", returnType: "string", params: [], visibility: "#", isAbstract: true },
        { id: "tm-abstract-meth-2", name: "stepParse", returnType: "string[]", params: [], visibility: "#", isAbstract: true },
        { id: "tm-abstract-meth-3", name: "stepClose", returnType: "void", params: [], visibility: "#", isAbstract: true },
        { id: "tm-abstract-meth-4", name: "hook", returnType: "void", params: [], visibility: "#" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "tm-concrete-a",
      name: "ConcreteClassA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "tm-concrete-a-meth-0", name: "stepOpen", returnType: "string", params: [], visibility: "#" },
        { id: "tm-concrete-a-meth-1", name: "stepParse", returnType: "string[]", params: [], visibility: "#" },
        { id: "tm-concrete-a-meth-2", name: "stepClose", returnType: "void", params: [], visibility: "#" },
      ],
      x: 120,
      y: 320,
    },
    {
      id: "tm-concrete-b",
      name: "ConcreteClassB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "tm-concrete-b-meth-0", name: "stepOpen", returnType: "string", params: [], visibility: "#" },
        { id: "tm-concrete-b-meth-1", name: "stepParse", returnType: "string[]", params: [], visibility: "#" },
        { id: "tm-concrete-b-meth-2", name: "stepClose", returnType: "void", params: [], visibility: "#" },
        { id: "tm-concrete-b-meth-3", name: "hook", returnType: "void", params: [], visibility: "#" },
      ],
      x: 480,
      y: 320,
    },
  ],
  relationships: [
    { id: rid(), source: "tm-concrete-a", target: "tm-abstract", type: "inheritance" },
    { id: rid(), source: "tm-concrete-b", target: "tm-abstract", type: "inheritance" },
  ],
  code: {
    typescript: `abstract class DataParser {
  // Template method — defines the algorithm skeleton
  templateMethod(data: string): string[] {
    const raw = this.openSource(data);
    const records = this.parseData(raw);
    this.closeSource();
    this.hook();
    return records;
  }

  protected abstract openSource(data: string): string;
  protected abstract parseData(raw: string): string[];
  protected abstract closeSource(): void;

  // Optional hook — subclasses may override
  protected hook(): void {}
}

class CSVParser extends DataParser {
  protected openSource(data: string): string {
    console.log("Opening CSV data...");
    return data;
  }

  protected parseData(raw: string): string[] {
    return raw.split("\\n").map(line => line.trim());
  }

  protected closeSource(): void {
    console.log("CSV source closed.");
  }
}

class JSONParser extends DataParser {
  protected openSource(data: string): string {
    console.log("Opening JSON data...");
    return data;
  }

  protected parseData(raw: string): string[] {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
  }

  protected closeSource(): void {
    console.log("JSON source closed.");
  }

  protected hook(): void {
    console.log("JSONParser: validating schema after parse...");
  }
}

// Usage
const csv = new CSVParser();
console.log(csv.templateMethod("a,b\\nc,d"));

const json = new JSONParser();
console.log(json.templateMethod('["x","y","z"]'));`,
    python: `from abc import ABC, abstractmethod

class DataParser(ABC):
    # Template method - defines the algorithm skeleton
    def template_method(self, data: str) -> list[str]:
        raw = self.open_source(data)
        records = self.parse_data(raw)
        self.close_source()
        self.hook()
        return records

    @abstractmethod
    def open_source(self, data: str) -> str: ...

    @abstractmethod
    def parse_data(self, raw: str) -> list[str]: ...

    @abstractmethod
    def close_source(self) -> None: ...

    # Optional hook - subclasses may override
    def hook(self) -> None:
        pass

class CSVParser(DataParser):
    def open_source(self, data: str) -> str:
        print("Opening CSV data...")
        return data

    def parse_data(self, raw: str) -> list[str]:
        return [line.strip() for line in raw.split("\\n")]

    def close_source(self) -> None:
        print("CSV source closed.")

class JSONParser(DataParser):
    def open_source(self, data: str) -> str:
        print("Opening JSON data...")
        return data

    def parse_data(self, raw: str) -> list[str]:
        import json
        parsed = json.loads(raw)
        return [str(item) for item in parsed] if isinstance(parsed, list) else [str(parsed)]

    def close_source(self) -> None:
        print("JSON source closed.")

    def hook(self) -> None:
        print("JSONParser: validating schema after parse...")

# Usage
csv = CSVParser()
print(csv.template_method("a,b\\nc,d"))

json_parser = JSONParser()
print(json_parser.template_method('["x","y","z"]'))`,
  },
  realWorldExamples: [
    "Data parsers for CSV, JSON, and XML with shared open/parse/close flow",
    "Web framework request lifecycle (authenticate, handle, render, log)",
    "Build systems with compile/link/package pipeline steps",
    "Game AI with sense/think/act loop overridden per entity type",
  ],
  whenToUse: [
    "Multiple classes share the same algorithm structure but differ in specific steps",
    "You want to let subclasses extend only particular steps without changing the overall algorithm",
    "You need to enforce an invariant algorithm skeleton with optional hooks",
  ],
  whenNotToUse: [
    "When every step of the algorithm varies (use Strategy instead)",
    "When the number of steps is small and a simple override is clearer",
    "When inheritance hierarchies are already deep and adding another layer adds confusion",
  ],
  interviewTips: [
    "Template Method vs Strategy is a classic question: inheritance vs composition",
    "Mention the Hollywood Principle: 'Don't call us, we'll call you' — the framework calls your code",
    "Show hook methods (optional overrides) vs abstract methods (required overrides)",
  ],
  commonMistakes: [
    "Too many abstract methods — subclasses become tightly coupled to the template",
    "Not marking the template method as final — subclasses can accidentally override the skeleton",
    "Using Template Method when Strategy (composition) would be more flexible",
  ],
  relatedPatterns: [
    { patternId: "strategy", relationship: "Template Method uses inheritance to vary steps; Strategy uses composition to swap entire algorithms" },
    { patternId: "factory-method", relationship: "Factory Method is a specialization of Template Method focused on object creation" },
    { patternId: "visitor", relationship: "Visitor externalizes operations across a hierarchy; Template Method internalizes a skeleton algorithm" },
  ],
};

// ════════════════════════════════════════════════════════════
//  MODERN PATTERNS
// ════════════════════════════════════════════════════════════

const repository: DesignPattern = {
  id: "repository",
  name: "Repository",
  category: "modern",
  description:
    "You're building a microservice that stores users. Today it uses PostgreSQL, but next quarter the team wants to migrate to DynamoDB. If SQL queries are scattered throughout your business logic, you're rewriting everything. The Repository pattern mediates between the domain and data mapping layers using a collection-like interface, abstracting away the data store so business logic is decoupled from persistence details.",
  analogy: "Think of a library's catalog system. You ask the librarian 'find books by author X' — you don't care whether they search a computer database, a card catalog, or physically walk the shelves. The interface is the same regardless of the storage system.",
  difficulty: 2,
  tradeoffs: "You gain: swap databases without touching business logic, easy to mock for tests. You pay: an extra abstraction layer — simple CRUD apps may not need it.",
  summary: [
    "Repository = collection-like interface hiding data storage details",
    "Key insight: business logic talks to an interface, never to SQL or a specific DB",
    "Use when: you need to swap data sources or test business logic without a real database",
  ],
  youAlreadyUseThis: [
    "Spring Data JPA repositories (findById, save, delete)",
    "Django ORM managers (Model.objects.filter())",
    "TypeORM/Prisma repositories (repository.find(), repository.save())",
    "Mongoose models in MongoDB (Model.findOne(), Model.create())",
  ],
  classes: [
    {
      id: "rp-repository",
      name: "Repository<T>",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "rp-repository-meth-0", name: "findById", returnType: "T | null", params: ["id: string"], visibility: "+" },
        { id: "rp-repository-meth-1", name: "findAll", returnType: "T[]", params: [], visibility: "+" },
        { id: "rp-repository-meth-2", name: "save", returnType: "void", params: ["entity: T"], visibility: "+" },
        { id: "rp-repository-meth-3", name: "delete", returnType: "void", params: ["id: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "rp-entity",
      name: "Entity",
      stereotype: "class",
      attributes: [
        { id: "rp-entity-attr-0", name: "id", type: "string", visibility: "+" },
        { id: "rp-entity-attr-1", name: "name", type: "string", visibility: "+" },
        { id: "rp-entity-attr-2", name: "createdAt", type: "Date", visibility: "+" },
      ],
      methods: [],
      x: 600,
      y: 50,
    },
    {
      id: "rp-sql",
      name: "SQLRepository",
      stereotype: "class",
      attributes: [
        { id: "rp-sql-attr-0", name: "connection", type: "DBConnection", visibility: "-" },
      ],
      methods: [
        { id: "rp-sql-meth-0", name: "findById", returnType: "T | null", params: ["id: string"], visibility: "+" },
        { id: "rp-sql-meth-1", name: "findAll", returnType: "T[]", params: [], visibility: "+" },
        { id: "rp-sql-meth-2", name: "save", returnType: "void", params: ["entity: T"], visibility: "+" },
        { id: "rp-sql-meth-3", name: "delete", returnType: "void", params: ["id: string"], visibility: "+" },
      ],
      x: 120,
      y: 320,
    },
    {
      id: "rp-mongo",
      name: "MongoRepository",
      stereotype: "class",
      attributes: [
        { id: "rp-mongo-attr-0", name: "collection", type: "Collection", visibility: "-" },
      ],
      methods: [
        { id: "rp-mongo-meth-0", name: "findById", returnType: "T | null", params: ["id: string"], visibility: "+" },
        { id: "rp-mongo-meth-1", name: "findAll", returnType: "T[]", params: [], visibility: "+" },
        { id: "rp-mongo-meth-2", name: "save", returnType: "void", params: ["entity: T"], visibility: "+" },
        { id: "rp-mongo-meth-3", name: "delete", returnType: "void", params: ["id: string"], visibility: "+" },
      ],
      x: 480,
      y: 320,
    },
  ],
  relationships: [
    { id: rid(), source: "rp-sql", target: "rp-repository", type: "realization" },
    { id: rid(), source: "rp-mongo", target: "rp-repository", type: "realization" },
    { id: rid(), source: "rp-repository", target: "rp-entity", type: "dependency", label: "manages" },
  ],
  code: {
    typescript: `interface Entity {
  id: string;
  name: string;
  createdAt: Date;
}

interface Repository<T extends Entity> {
  findById(id: string): T | null;
  findAll(): T[];
  save(entity: T): void;
  delete(id: string): void;
}

interface User extends Entity {
  email: string;
}

class InMemoryUserRepository implements Repository<User> {
  private store = new Map<string, User>();

  findById(id: string): User | null {
    return this.store.get(id) ?? null;
  }

  findAll(): User[] {
    return Array.from(this.store.values());
  }

  save(entity: User): void {
    this.store.set(entity.id, entity);
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}

class SQLUserRepository implements Repository<User> {
  findById(id: string): User | null {
    // SELECT * FROM users WHERE id = ?
    console.log(\`SQL: SELECT * FROM users WHERE id = '\${id}'\`);
    return null; // simplified
  }

  findAll(): User[] {
    console.log("SQL: SELECT * FROM users");
    return [];
  }

  save(entity: User): void {
    console.log(\`SQL: INSERT INTO users VALUES ('\${entity.id}', '\${entity.name}')\`);
  }

  delete(id: string): void {
    console.log(\`SQL: DELETE FROM users WHERE id = '\${id}'\`);
  }
}

// Usage - swap implementations without changing business logic
function createUser(repo: Repository<User>, name: string): void {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email: \`\${name.toLowerCase()}@example.com\`,
    createdAt: new Date(),
  };
  repo.save(user);
}

const repo = new InMemoryUserRepository();
createUser(repo, "Alice");
console.log(repo.findAll());`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Generic, TypeVar
import uuid

@dataclass
class Entity:
    id: str
    name: str
    created_at: datetime = field(default_factory=datetime.now)

T = TypeVar("T", bound=Entity)

class Repository(ABC, Generic[T]):
    @abstractmethod
    def find_by_id(self, id: str) -> T | None: ...

    @abstractmethod
    def find_all(self) -> list[T]: ...

    @abstractmethod
    def save(self, entity: T) -> None: ...

    @abstractmethod
    def delete(self, id: str) -> None: ...

@dataclass
class User(Entity):
    email: str = ""

class InMemoryUserRepository(Repository[User]):
    def __init__(self):
        self._store: dict[str, User] = {}

    def find_by_id(self, id: str) -> User | None:
        return self._store.get(id)

    def find_all(self) -> list[User]:
        return list(self._store.values())

    def save(self, entity: User) -> None:
        self._store[entity.id] = entity

    def delete(self, id: str) -> None:
        self._store.pop(id, None)

class SQLUserRepository(Repository[User]):
    def find_by_id(self, id: str) -> User | None:
        print(f"SQL: SELECT * FROM users WHERE id = '{id}'")
        return None

    def find_all(self) -> list[User]:
        print("SQL: SELECT * FROM users")
        return []

    def save(self, entity: User) -> None:
        print(f"SQL: INSERT INTO users VALUES ('{entity.id}', '{entity.name}')")

    def delete(self, id: str) -> None:
        print(f"SQL: DELETE FROM users WHERE id = '{id}'")

# Usage - swap implementations without changing business logic
def create_user(repo: Repository[User], name: str) -> None:
    user = User(
        id=str(uuid.uuid4()),
        name=name,
        email=f"{name.lower()}@example.com",
    )
    repo.save(user)

repo = InMemoryUserRepository()
create_user(repo, "Alice")
print(repo.find_all())`,
  },
  realWorldExamples: [
    "Data access layer in any backend service (Spring Data, TypeORM, Django ORM)",
    "Microservice persistence abstraction (switch SQL to NoSQL without changing service logic)",
    "Testing with in-memory repositories instead of real databases",
    "Multi-tenant applications with per-tenant data store selection",
  ],
  whenToUse: [
    "You need to decouple business logic from data access implementation",
    "You want to swap data stores (SQL, NoSQL, in-memory) without changing domain code",
    "You need to unit test domain logic without a database",
    "Your application has complex querying requirements that benefit from abstraction",
  ],
  whenNotToUse: [
    "When the application is simple and directly using an ORM is sufficient",
    "When there is only one data store and no plans to change it",
    "When the repository abstraction would duplicate ORM capabilities without added benefit",
  ],
  interviewTips: [
    "Show how Repository makes the domain layer testable by mocking the data access layer",
    "Contrast with Active Record: Repository separates domain from persistence, Active Record combines them",
    "Mention that Repository can abstract over multiple data sources (SQL, NoSQL, API) with one interface",
  ],
  commonMistakes: [
    "Leaking query language details (SQL, ORM syntax) through the repository interface",
    "Creating one repository per table instead of per aggregate root",
    "Making repositories too generic — losing the domain-specific methods that make them useful",
  ],
  relatedPatterns: [
    { patternId: "factory-method", relationship: "Repository often uses Factory Method internally to reconstitute domain objects from raw data" },
    { patternId: "cqrs", relationship: "CQRS splits Repository into separate read and write repositories for scalability" },
    { patternId: "adapter", relationship: "Repository acts as an Adapter between the domain model and the persistence layer" },
  ],
};

// ════════════════════════════════════════════════════════════
//  CREATIONAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const abstractFactory: DesignPattern = {
  id: "abstract-factory",
  name: "Abstract Factory",
  category: "creational",
  description:
    "You're building a cross-platform UI toolkit that must render native-looking buttons, checkboxes, and menus on both Windows and macOS. Each platform has its own look-and-feel, and mixing Windows buttons with macOS menus would look broken. The Abstract Factory pattern provides an interface for creating families of related objects without specifying their concrete classes.",
  analogy: "Think of a furniture store with style collections. When you pick 'Modern,' everything — sofa, table, chair — comes in the Modern style. Pick 'Victorian' and you get a matching Victorian set. The store (factory) ensures all pieces in a family are compatible.",
  difficulty: 4,
  tradeoffs: "You gain: guaranteed compatibility between related objects in a family. You pay: adding a new product type requires changing every factory — the interface grows with each new product.",
  summary: [
    "Abstract Factory = create families of related objects that belong together",
    "Key insight: ensures you never mix incompatible objects from different families",
    "Use when: your system needs to work with multiple families of related products",
  ],
  youAlreadyUseThis: [
    "Material UI / Ant Design theme providers (themed component families)",
    "Database drivers (pg, mysql2 — each provides compatible Connection, Query, Result)",
    "Cross-platform toolkits (React Native platform-specific components)",
  ],
  classes: [
    {
      id: "af-factory",
      name: "AbstractFactory",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "af-factory-meth-0", name: "createButton", returnType: "Button", params: [], visibility: "+" },
        { id: "af-factory-meth-1", name: "createCheckbox", returnType: "Checkbox", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "af-win-factory",
      name: "WindowsFactory",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-win-factory-meth-0", name: "createButton", returnType: "Button", params: [], visibility: "+" },
        { id: "af-win-factory-meth-1", name: "createCheckbox", returnType: "Checkbox", params: [], visibility: "+" },
      ],
      x: 100,
      y: 230,
    },
    {
      id: "af-mac-factory",
      name: "MacFactory",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-mac-factory-meth-0", name: "createButton", returnType: "Button", params: [], visibility: "+" },
        { id: "af-mac-factory-meth-1", name: "createCheckbox", returnType: "Checkbox", params: [], visibility: "+" },
      ],
      x: 500,
      y: 230,
    },
    {
      id: "af-button",
      name: "Button",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "af-button-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-button-meth-1", name: "onClick", returnType: "void", params: ["handler: Function"], visibility: "+" },
      ],
      x: 100,
      y: 430,
    },
    {
      id: "af-checkbox",
      name: "Checkbox",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "af-checkbox-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-checkbox-meth-1", name: "toggle", returnType: "void", params: [], visibility: "+" },
      ],
      x: 500,
      y: 430,
    },
    {
      id: "af-win-button",
      name: "WindowsButton",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-win-button-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-win-button-meth-1", name: "onClick", returnType: "void", params: ["handler: Function"], visibility: "+" },
      ],
      x: 50,
      y: 600,
    },
    {
      id: "af-mac-button",
      name: "MacButton",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-mac-button-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-mac-button-meth-1", name: "onClick", returnType: "void", params: ["handler: Function"], visibility: "+" },
      ],
      x: 250,
      y: 600,
    },
    {
      id: "af-win-checkbox",
      name: "WindowsCheckbox",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-win-checkbox-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-win-checkbox-meth-1", name: "toggle", returnType: "void", params: [], visibility: "+" },
      ],
      x: 450,
      y: 600,
    },
    {
      id: "af-mac-checkbox",
      name: "MacCheckbox",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "af-mac-checkbox-meth-0", name: "render", returnType: "string", params: [], visibility: "+" },
        { id: "af-mac-checkbox-meth-1", name: "toggle", returnType: "void", params: [], visibility: "+" },
      ],
      x: 600,
      y: 600,
    },
  ],
  relationships: [
    { id: rid(), source: "af-win-factory", target: "af-factory", type: "realization" },
    { id: rid(), source: "af-mac-factory", target: "af-factory", type: "realization" },
    { id: rid(), source: "af-win-button", target: "af-button", type: "realization" },
    { id: rid(), source: "af-mac-button", target: "af-button", type: "realization" },
    { id: rid(), source: "af-win-checkbox", target: "af-checkbox", type: "realization" },
    { id: rid(), source: "af-mac-checkbox", target: "af-checkbox", type: "realization" },
    { id: rid(), source: "af-factory", target: "af-button", type: "dependency", label: "creates" },
    { id: rid(), source: "af-factory", target: "af-checkbox", type: "dependency", label: "creates" },
  ],
  code: {
    typescript: `interface Button {
  render(): string;
  onClick(handler: () => void): void;
}

interface Checkbox {
  render(): string;
  toggle(): void;
}

interface GUIFactory {
  createButton(): Button;
  createCheckbox(): Checkbox;
}

// ── Windows Family ──
class WindowsButton implements Button {
  render(): string { return "[Windows Button]"; }
  onClick(handler: () => void): void {
    console.log("Windows click");
    handler();
  }
}

class WindowsCheckbox implements Checkbox {
  private checked = false;
  render(): string { return \`[Windows Checkbox: \${this.checked}]\`; }
  toggle(): void { this.checked = !this.checked; }
}

class WindowsFactory implements GUIFactory {
  createButton(): Button { return new WindowsButton(); }
  createCheckbox(): Checkbox { return new WindowsCheckbox(); }
}

// ── Mac Family ──
class MacButton implements Button {
  render(): string { return "(Mac Button)"; }
  onClick(handler: () => void): void {
    console.log("Mac click");
    handler();
  }
}

class MacCheckbox implements Checkbox {
  private checked = false;
  render(): string { return \`(Mac Checkbox: \${this.checked})\`; }
  toggle(): void { this.checked = !this.checked; }
}

class MacFactory implements GUIFactory {
  createButton(): Button { return new MacButton(); }
  createCheckbox(): Checkbox { return new MacCheckbox(); }
}

// Usage — client code works with ANY factory
function buildUI(factory: GUIFactory): void {
  const button = factory.createButton();
  const checkbox = factory.createCheckbox();
  console.log(button.render());
  console.log(checkbox.render());
  button.onClick(() => checkbox.toggle());
}

// Switch platform by swapping the factory
const factory = process.platform === "win32"
  ? new WindowsFactory()
  : new MacFactory();
buildUI(factory);`,
    python: `from abc import ABC, abstractmethod

class Button(ABC):
    @abstractmethod
    def render(self) -> str: ...
    @abstractmethod
    def on_click(self, handler) -> None: ...

class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str: ...
    @abstractmethod
    def toggle(self) -> None: ...

class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button: ...
    @abstractmethod
    def create_checkbox(self) -> Checkbox: ...

# ── Windows Family ──
class WindowsButton(Button):
    def render(self) -> str:
        return "[Windows Button]"
    def on_click(self, handler) -> None:
        print("Windows click")
        handler()

class WindowsCheckbox(Checkbox):
    def __init__(self):
        self._checked = False
    def render(self) -> str:
        return f"[Windows Checkbox: {self._checked}]"
    def toggle(self) -> None:
        self._checked = not self._checked

class WindowsFactory(GUIFactory):
    def create_button(self) -> Button:
        return WindowsButton()
    def create_checkbox(self) -> Checkbox:
        return WindowsCheckbox()

# ── Mac Family ──
class MacButton(Button):
    def render(self) -> str:
        return "(Mac Button)"
    def on_click(self, handler) -> None:
        print("Mac click")
        handler()

class MacCheckbox(Checkbox):
    def __init__(self):
        self._checked = False
    def render(self) -> str:
        return f"(Mac Checkbox: {self._checked})"
    def toggle(self) -> None:
        self._checked = not self._checked

class MacFactory(GUIFactory):
    def create_button(self) -> Button:
        return MacButton()
    def create_checkbox(self) -> Checkbox:
        return MacCheckbox()

# Usage — client code works with ANY factory
def build_ui(factory: GUIFactory) -> None:
    button = factory.create_button()
    checkbox = factory.create_checkbox()
    print(button.render())
    print(checkbox.render())
    button.on_click(checkbox.toggle)

import sys
factory = WindowsFactory() if sys.platform == "win32" else MacFactory()
build_ui(factory)`,
  },
  realWorldExamples: [
    "Cross-platform UI toolkits (Windows vs macOS vs Linux buttons, menus, dialogs)",
    "Database driver families (PostgreSQL vs MySQL connection, statement, result set)",
    "Cloud provider SDKs (AWS vs GCP storage, compute, and messaging clients)",
  ],
  whenToUse: [
    "You need to create families of related objects that must be used together",
    "You want to enforce consistency (no mixing Windows buttons with Mac checkboxes)",
    "Your system needs to support multiple platforms or product lines",
  ],
  whenNotToUse: [
    "When there is only one product family (use Factory Method instead)",
    "When products in the family are unrelated and don't need to be consistent",
    "When the added abstraction layers outweigh the platform flexibility benefit",
  ],
  interviewTips: [
    "Draw the 2x2 grid: 2 factories x 2 products to make the pattern click visually",
    "Key insight: the client code never references concrete classes — everything goes through interfaces",
    "Common follow-up: how does this differ from Factory Method? (families vs single product)",
  ],
  commonMistakes: [
    "Adding a new product to the family requires changing ALL concrete factories (violates OCP)",
    "Confusing Abstract Factory (object composition) with Factory Method (inheritance)",
    "Creating an Abstract Factory when you only have one product type (use Factory Method instead)",
  ],
  confusedWith: [
    { patternId: "factory-method", difference: "Factory Method creates ONE product. Abstract Factory creates FAMILIES of related products." },
  ],
  relatedPatterns: [
    { patternId: "factory-method", relationship: "Abstract Factory implementations often use Factory Methods internally" },
    { patternId: "singleton", relationship: "Abstract Factories are often implemented as Singletons" },
    { patternId: "builder", relationship: "Builder focuses on step-by-step construction; Abstract Factory on families of related objects" },
    { patternId: "prototype", relationship: "Abstract Factory can use Prototype to create products by cloning prototypical instances" },
  ],
};

// ════════════════════════════════════════════════════════════
//  STRUCTURAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const composite: DesignPattern = {
  id: "composite",
  name: "Composite",
  category: "structural",
  description:
    "You're building a file manager. Folders contain files and other folders, and you need to calculate the total size of any node -- whether it's a single file or a deeply nested folder tree. Treating files and folders differently everywhere leads to messy conditional code. The Composite pattern composes objects into tree structures and lets you treat individual objects and compositions uniformly.",
  analogy: "Think of an organizational chart. A department contains teams, teams contain people. Whether you ask the CEO 'how many people?' or a team lead, the operation is the same — it just recurses down the tree.",
  difficulty: 3,
  tradeoffs: "You gain: uniform treatment of individual items and groups — one interface for both. You pay: it's hard to restrict which types of children a composite can hold — everything looks the same.",
  summary: [
    "Composite = treat individual objects and groups of objects the same way",
    "Key insight: both Leaf and Composite implement the same interface — tree recursion",
    "Use when: you have tree structures where operations apply to nodes and subtrees alike",
  ],
  youAlreadyUseThis: [
    "React component tree (components contain other components)",
    "DOM tree (div contains span contains text — same API)",
    "File system (files and directories share common operations)",
    "JSON/XML nested structures (recursive parsing)",
  ],
  predictionPrompts: [
    {
      question: "In a Composite file system, do you need different code to get the size of a file vs. a folder?",
      answer: "No — both File (Leaf) and Folder (Composite) implement getSize(). A folder's getSize() sums its children's sizes recursively. The caller doesn't need to know the difference.",
    },
  ],
  classes: [
    {
      id: "cp-component",
      name: "Component",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cp-component-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "cp-component-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
        { id: "cp-component-meth-2", name: "print", returnType: "void", params: ["indent: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "cp-leaf",
      name: "Leaf",
      stereotype: "class",
      attributes: [
        { id: "cp-leaf-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cp-leaf-attr-1", name: "size", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "cp-leaf-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "cp-leaf-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
        { id: "cp-leaf-meth-2", name: "print", returnType: "void", params: ["indent: string"], visibility: "+" },
      ],
      x: 100,
      y: 280,
    },
    {
      id: "cp-composite",
      name: "Composite",
      stereotype: "class",
      attributes: [
        { id: "cp-composite-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "cp-composite-attr-1", name: "children", type: "Component[]", visibility: "-" },
      ],
      methods: [
        { id: "cp-composite-meth-0", name: "getSize", returnType: "number", params: [], visibility: "+" },
        { id: "cp-composite-meth-1", name: "getName", returnType: "string", params: [], visibility: "+" },
        { id: "cp-composite-meth-2", name: "print", returnType: "void", params: ["indent: string"], visibility: "+" },
        { id: "cp-composite-meth-3", name: "add", returnType: "void", params: ["child: Component"], visibility: "+" },
        { id: "cp-composite-meth-4", name: "remove", returnType: "void", params: ["child: Component"], visibility: "+" },
      ],
      x: 500,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "cp-leaf", target: "cp-component", type: "realization" },
    { id: rid(), source: "cp-composite", target: "cp-component", type: "realization" },
    { id: rid(), source: "cp-composite", target: "cp-component", type: "aggregation", label: "children *" },
  ],
  code: {
    typescript: `// The shared interface is the heart of Composite: both File (leaf) and
// Folder (composite) implement the same operations. Clients never need
// to check "is this a file or folder?" — they just call getSize().
interface FileSystemComponent {
  getSize(): number;
  getName(): string;
  print(indent?: string): void;
}

class File implements FileSystemComponent {
  constructor(
    private name: string,
    private size: number
  ) {}

  // Leaf node: getSize() returns its own size directly — the base case of the recursion.
  getSize(): number { return this.size; }
  getName(): string { return this.name; }

  print(indent = ""): void {
    console.log(\`\${indent}\${this.name} (\${this.size} bytes)\`);
  }
}

class Folder implements FileSystemComponent {
  private children: FileSystemComponent[] = [];

  constructor(private name: string) {}

  add(child: FileSystemComponent): void {
    this.children.push(child);
  }

  remove(child: FileSystemComponent): void {
    this.children = this.children.filter(c => c !== child);
  }

  // Composite node: getSize() delegates to children recursively.
  // This works because children can be Files OR Folders — same interface.
  // A Folder's size is the sum of all its descendants, computed lazily.
  getSize(): number {
    return this.children.reduce((sum, child) => sum + child.getSize(), 0);
  }

  getName(): string { return this.name; }

  print(indent = ""): void {
    console.log(\`\${indent}\${this.name}/\`);
    for (const child of this.children) {
      child.print(indent + "  ");
    }
  }
}

// Usage — files and folders treated uniformly
const root = new Folder("src");
const lib = new Folder("lib");
lib.add(new File("utils.ts", 1200));
lib.add(new File("types.ts", 800));

root.add(lib);
root.add(new File("index.ts", 300));

root.print();
// src/
//   lib/
//     utils.ts (1200 bytes)
//     types.ts (800 bytes)
//   index.ts (300 bytes)

console.log("Total:", root.getSize(), "bytes"); // 2300`,
    python: `from abc import ABC, abstractmethod

class FileSystemComponent(ABC):
    @abstractmethod
    def get_size(self) -> int: ...

    @abstractmethod
    def get_name(self) -> str: ...

    @abstractmethod
    def print_tree(self, indent: str = "") -> None: ...

class File(FileSystemComponent):
    def __init__(self, name: str, size: int):
        self._name = name
        self._size = size

    def get_size(self) -> int:
        return self._size

    def get_name(self) -> str:
        return self._name

    def print_tree(self, indent: str = "") -> None:
        print(f"{indent}{self._name} ({self._size} bytes)")

class Folder(FileSystemComponent):
    def __init__(self, name: str):
        self._name = name
        self._children: list[FileSystemComponent] = []

    def add(self, child: FileSystemComponent) -> None:
        self._children.append(child)

    def remove(self, child: FileSystemComponent) -> None:
        self._children.remove(child)

    def get_size(self) -> int:
        return sum(child.get_size() for child in self._children)

    def get_name(self) -> str:
        return self._name

    def print_tree(self, indent: str = "") -> None:
        print(f"{indent}{self._name}/")
        for child in self._children:
            child.print_tree(indent + "  ")

# Usage — files and folders treated uniformly
root = Folder("src")
lib = Folder("lib")
lib.add(File("utils.ts", 1200))
lib.add(File("types.ts", 800))

root.add(lib)
root.add(File("index.ts", 300))

root.print_tree()
# src/
#   lib/
#     utils.ts (1200 bytes)
#     types.ts (800 bytes)
#   index.ts (300 bytes)

print(f"Total: {root.get_size()} bytes")  # 2300`,
  },
  realWorldExamples: [
    "File systems (files and folders with nested directory structures)",
    "UI component trees (React component hierarchy, DOM nodes with children)",
    "Organization charts (employees and departments containing sub-departments)",
  ],
  whenToUse: [
    "You need to represent part-whole hierarchies as tree structures",
    "You want clients to treat individual objects and compositions uniformly",
    "Your structure naturally forms a recursive tree (menus, folders, org charts)",
  ],
  whenNotToUse: [
    "When the structure is flat and there is no nesting",
    "When leaf and composite objects have very different interfaces",
    "When the overhead of a uniform interface outweighs the simplicity benefit",
  ],
  interviewTips: [
    "File system (files and folders) is the go-to example — everyone understands it",
    "Key insight: client code treats leaves and composites identically through a common interface",
    "Ask yourself: does the tree need child-management methods on the leaf? Discuss safety vs transparency",
  ],
  commonMistakes: [
    "Adding child-management methods to the leaf class — leaves can't have children",
    "Not enforcing tree invariants (e.g., preventing cycles in the tree structure)",
    "Over-generalizing: using Composite when a flat list would suffice",
  ],
  relatedPatterns: [
    { patternId: "decorator", relationship: "Decorator is like a Composite with only one child — both use recursive composition" },
    { patternId: "iterator", relationship: "Iterator provides ways to traverse Composite structures" },
    { patternId: "visitor", relationship: "Visitor defines operations to perform across all elements of a Composite tree" },
    { patternId: "builder", relationship: "Builder can construct complex Composite trees step by step" },
  ],
};

// ════════════════════════════════════════════════════════════
//  BEHAVIORAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const chainOfResponsibility: DesignPattern = {
  id: "chain-of-responsibility",
  name: "Chain of Responsibility",
  category: "behavioral",
  description:
    "You're building an Express-like HTTP server. Each incoming request needs to pass through authentication, rate limiting, logging, and validation -- but not every request needs every check. Hardcoding the sequence makes it impossible to reorder or skip steps. The Chain of Responsibility pattern lets you pass requests along a chain of handlers, where each handler decides either to process the request or pass it to the next handler in the chain.",
  analogy: "Think of a customer support escalation chain. Your question goes to tier-1 support first. If they can't help, it escalates to tier-2, then tier-3, then engineering. Each handler either resolves it or passes it along.",
  difficulty: 3,
  tradeoffs: "You gain: flexible, reorderable processing pipelines — add/remove handlers easily. You pay: no guarantee the request gets handled — it may fall off the end of the chain silently.",
  summary: [
    "Chain of Responsibility = pass a request along a chain until one handler processes it",
    "Key insight: handlers are linked; each decides to handle or forward the request",
    "Use when: multiple objects may handle a request and the handler isn't known in advance",
  ],
  youAlreadyUseThis: [
    "Express/Koa middleware pipeline (app.use(handler))",
    "DOM event bubbling (click propagates from child to parent)",
    "Java servlet filters (request passes through filter chain)",
    "Try/catch exception handling (chain of catch blocks)",
  ],
  predictionPrompts: [
    {
      question: "In a Chain of Responsibility with auth, rate-limit, and logging handlers, what happens if you remove the auth handler?",
      answer: "The request skips straight to rate-limiting. Each handler is independent — removing one doesn't break the chain, it just shortens it.",
    },
  ],
  classes: [
    {
      id: "cor-handler",
      name: "Handler",
      stereotype: "abstract",
      attributes: [
        { id: "cor-handler-attr-0", name: "next", type: "Handler | null", visibility: "#" },
      ],
      methods: [
        { id: "cor-handler-meth-0", name: "setNext", returnType: "Handler", params: ["handler: Handler"], visibility: "+" },
        { id: "cor-handler-meth-1", name: "handle", returnType: "string | null", params: ["request: Request"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "cor-auth",
      name: "AuthHandler",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "cor-auth-meth-0", name: "handle", returnType: "string | null", params: ["request: Request"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "cor-ratelimit",
      name: "RateLimitHandler",
      stereotype: "class",
      attributes: [
        { id: "cor-ratelimit-attr-0", name: "requestCounts", type: "Map<string, number>", visibility: "-" },
      ],
      methods: [
        { id: "cor-ratelimit-meth-0", name: "handle", returnType: "string | null", params: ["request: Request"], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "cor-logging",
      name: "LoggingHandler",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "cor-logging-meth-0", name: "handle", returnType: "string | null", params: ["request: Request"], visibility: "+" },
      ],
      x: 550,
      y: 280,
    },
    {
      id: "cor-client",
      name: "Client",
      stereotype: "class",
      attributes: [
        { id: "cor-client-attr-0", name: "handler", type: "Handler", visibility: "-" },
      ],
      methods: [
        { id: "cor-client-meth-0", name: "sendRequest", returnType: "string | null", params: ["request: Request"], visibility: "+" },
      ],
      x: 300,
      y: -120,
    },
  ],
  relationships: [
    { id: rid(), source: "cor-auth", target: "cor-handler", type: "inheritance" },
    { id: rid(), source: "cor-ratelimit", target: "cor-handler", type: "inheritance" },
    { id: rid(), source: "cor-logging", target: "cor-handler", type: "inheritance" },
    { id: rid(), source: "cor-handler", target: "cor-handler", type: "association", label: "next" },
    { id: rid(), source: "cor-client", target: "cor-handler", type: "dependency", label: "sends to" },
  ],
  code: {
    typescript: `interface Request {
  path: string;
  headers: Record<string, string>;
  ip: string;
}

abstract class Handler {
  protected next: Handler | null = null;

  // Returns the next handler to enable fluent chaining: auth.setNext(rateLimit).setNext(logging)
  // This is the Builder pattern sneaking in — the chain is built step by step.
  setNext(handler: Handler): Handler {
    this.next = handler;
    return handler; // enables chaining: a.setNext(b).setNext(c)
  }

  // Default behavior: forward to next handler. If there's no next, the request
  // falls through unhandled. This is the key difference from Decorator —
  // a handler can SHORT-CIRCUIT and stop the chain by returning early.
  handle(request: Request): string | null {
    if (this.next) {
      return this.next.handle(request);
    }
    return null;
  }
}

class AuthHandler extends Handler {
  handle(request: Request): string | null {
    if (!request.headers["authorization"]) {
      // Short-circuit: return immediately without calling super.handle().
      // The request never reaches rate-limiting or logging — auth failed.
      return "401 Unauthorized: Missing auth token";
    }
    console.log("Auth: token verified");
    return super.handle(request);
  }
}

class RateLimitHandler extends Handler {
  private counts = new Map<string, number>();
  private limit = 100;

  handle(request: Request): string | null {
    const count = (this.counts.get(request.ip) ?? 0) + 1;
    this.counts.set(request.ip, count);
    if (count > this.limit) {
      return "429 Too Many Requests";
    }
    console.log(\`RateLimit: \${count}/\${this.limit} for \${request.ip}\`);
    return super.handle(request);
  }
}

class LoggingHandler extends Handler {
  handle(request: Request): string | null {
    console.log(\`Log: \${request.path} from \${request.ip}\`);
    return super.handle(request);
  }
}

// Usage — build the chain
const auth = new AuthHandler();
const rateLimit = new RateLimitHandler();
const logging = new LoggingHandler();

auth.setNext(rateLimit).setNext(logging);

const request: Request = {
  path: "/api/users",
  headers: { authorization: "Bearer token123" },
  ip: "192.168.1.1",
  interviewTips: [
    "Middleware pipelines (Express.js, Django) are Chain of Responsibility — use this real-world hook",
    "Key question: what happens if NO handler in the chain handles the request?",
    "Show that handlers can short-circuit OR pass to the next — discuss both variants",
  ],
  commonMistakes: [
    "No handler handles the request — always have a default/fallback handler at the end",
    "Chain order matters but isn't documented — leads to subtle bugs when handlers are reordered",
    "Making the chain too long — performance degrades as requests traverse many handlers",
  ],
  relatedPatterns: [
    { patternId: "command", relationship: "Command is a specific request object that the Chain of Responsibility routes to a handler" },
    { patternId: "decorator", relationship: "Both use recursive composition, but Chain passes requests along while Decorator enhances a single object" },
    { patternId: "composite", relationship: "Chain of Responsibility can follow the parent links in a Composite tree" },
  ],
};

const result = auth.handle(request);
console.log(result ?? "200 OK");`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field

@dataclass
class Request:
    path: str
    headers: dict[str, str] = field(default_factory=dict)
    ip: str = "127.0.0.1"

class Handler(ABC):
    def __init__(self):
        self._next: Handler | None = None

    def set_next(self, handler: "Handler") -> "Handler":
        self._next = handler
        return handler  # enables chaining: a.set_next(b).set_next(c)

    def handle(self, request: Request) -> str | None:
        if self._next:
            return self._next.handle(request)
        return None

class AuthHandler(Handler):
    def handle(self, request: Request) -> str | None:
        if "authorization" not in request.headers:
            return "401 Unauthorized: Missing auth token"
        print("Auth: token verified")
        return super().handle(request)

class RateLimitHandler(Handler):
    def __init__(self, limit: int = 100):
        super().__init__()
        self._counts: dict[str, int] = {}
        self._limit = limit

    def handle(self, request: Request) -> str | None:
        count = self._counts.get(request.ip, 0) + 1
        self._counts[request.ip] = count
        if count > self._limit:
            return "429 Too Many Requests"
        print(f"RateLimit: {count}/{self._limit} for {request.ip}")
        return super().handle(request)

class LoggingHandler(Handler):
    def handle(self, request: Request) -> str | None:
        print(f"Log: {request.path} from {request.ip}")
        return super().handle(request)

# Usage — build the chain
auth = AuthHandler()
rate_limit = RateLimitHandler()
logging = LoggingHandler()

auth.set_next(rate_limit).set_next(logging)

request = Request(
    path="/api/users",
    headers={"authorization": "Bearer token123"},
    ip="192.168.1.1",
)

result = auth.handle(request)
print(result or "200 OK")`,
  },
  realWorldExamples: [
    "Express/Koa middleware chains (auth, CORS, logging, error handling)",
    "DOM event bubbling (click event propagates from target to document)",
    "Corporate approval workflows (employee -> manager -> director -> VP)",
  ],
  whenToUse: [
    "You need to process a request through multiple handlers in sequence",
    "The set of handlers and their order should be configurable at runtime",
    "You want to decouple senders of requests from their receivers",
  ],
  whenNotToUse: [
    "When every request must be handled (chain can silently drop requests)",
    "When there is only one handler (direct call is simpler)",
    "When handler ordering is complex and hard to debug in a chain",
  ],
};

// ════════════════════════════════════════════════════════════
//  MEMENTO (LLD-094)
// ════════════════════════════════════════════════════════════

const memento: DesignPattern = {
  id: "memento",
  name: "Memento",
  category: "behavioral",
  description:
    "You're building a text editor and users demand undo/redo. Each keystroke changes the document's state, and you need to capture snapshots so users can roll back. But exposing the editor's internals to save state would break encapsulation. The Memento pattern captures and externalizes an object's internal state without violating encapsulation, so the object can be restored to that state later.",
  analogy: "Think of saving a video game. The game captures your exact position, inventory, and health into a save file. You can load any save to return to that exact moment — without the save system knowing the game's internal mechanics.",
  difficulty: 3,
  tradeoffs: "You gain: snapshot-based undo/redo that preserves encapsulation — the caretaker never peeks inside. You pay: memory cost of storing full state snapshots — can be expensive for large objects.",
  summary: [
    "Memento = capture an object's state as a snapshot for later restoration",
    "Key insight: the originator creates/restores mementos; the caretaker just stores them",
    "Use when: you need undo/redo, checkpoints, or transaction rollback",
  ],
  youAlreadyUseThis: [
    "Ctrl+Z in every editor (undo stack of document snapshots)",
    "Git stash (saves working directory state for later restore)",
    "Database savepoints (SAVEPOINT / ROLLBACK TO in SQL)",
    "Browser history (back/forward restores page state)",
  ],
  predictionPrompts: [
    {
      question: "Does the Caretaker (undo manager) need to understand the Memento's contents to restore state?",
      answer: "No — the Caretaker is a black-box storage. Only the Originator knows how to create and restore from a Memento. This preserves encapsulation.",
    },
  ],
  classes: [
    {
      id: "mem-originator",
      name: "Originator",
      stereotype: "class",
      attributes: [
        { id: "mem-originator-attr-0", name: "state", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "mem-originator-meth-0", name: "save", returnType: "Memento", params: [], visibility: "+" },
        { id: "mem-originator-meth-1", name: "restore", returnType: "void", params: ["memento: Memento"], visibility: "+" },
        { id: "mem-originator-meth-2", name: "setState", returnType: "void", params: ["state: string"], visibility: "+" },
        { id: "mem-originator-meth-3", name: "getState", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "mem-memento",
      name: "Memento",
      stereotype: "class",
      attributes: [
        { id: "mem-memento-attr-0", name: "state", type: "string", visibility: "-" },
        { id: "mem-memento-attr-1", name: "date", type: "Date", visibility: "-" },
      ],
      methods: [
        { id: "mem-memento-meth-0", name: "getState", returnType: "string", params: [], visibility: "-" },
        { id: "mem-memento-meth-1", name: "getDate", returnType: "Date", params: [], visibility: "+" },
        { id: "mem-memento-meth-2", name: "getName", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "mem-caretaker",
      name: "Caretaker",
      stereotype: "class",
      attributes: [
        { id: "mem-caretaker-attr-0", name: "history", type: "Memento[]", visibility: "-" },
        { id: "mem-caretaker-attr-1", name: "originator", type: "Originator", visibility: "-" },
      ],
      methods: [
        { id: "mem-caretaker-meth-0", name: "backup", returnType: "void", params: [], visibility: "+" },
        { id: "mem-caretaker-meth-1", name: "undo", returnType: "void", params: [], visibility: "+" },
        { id: "mem-caretaker-meth-2", name: "showHistory", returnType: "void", params: [], visibility: "+" },
      ],
      x: 600,
      y: 50,
    },
  ],
  relationships: [
    { id: rid(), source: "mem-originator", target: "mem-memento", type: "dependency", label: "creates" },
    { id: rid(), source: "mem-caretaker", target: "mem-memento", type: "aggregation", label: "stores" },
    { id: rid(), source: "mem-caretaker", target: "mem-originator", type: "association", label: "uses" },
  ],
  code: {
    typescript: `class Memento {
  private state: string;
  private date: Date;

  constructor(state: string) {
    this.state = state;
    this.date = new Date();
  }

  getState(): string {
    return this.state;
  }

  getName(): string {
    return \`\${this.date.toISOString()} / \${this.state.substring(0, 9)}...\`;
  }
}

class Originator {
  private state: string;

  constructor(state: string) {
    this.state = state;
  }

  setState(state: string): void {
    this.state = state;
  }

  getState(): string {
    return this.state;
  }

  save(): Memento {
    return new Memento(this.state);
  }

  restore(memento: Memento): void {
    this.state = memento.getState();
  }
}

class Caretaker {
  private history: Memento[] = [];
  private originator: Originator;

  constructor(originator: Originator) {
    this.originator = originator;
  }

  backup(): void {
    this.history.push(this.originator.save());
  }

  undo(): void {
    const memento = this.history.pop();
    if (memento) {
      this.originator.restore(memento);
    }
  }
}

// Usage — text editor undo
const editor = new Originator("Hello");
const history = new Caretaker(editor);

history.backup();
editor.setState("Hello World");
history.backup();
editor.setState("Hello World!!!");

console.log(editor.getState()); // "Hello World!!!"
history.undo();
console.log(editor.getState()); // "Hello World"
history.undo();
console.log(editor.getState()); // "Hello"`,
    python: `from datetime import datetime

class Memento:
    def __init__(self, state: str):
        self._state = state
        self._date = datetime.now()

    def get_state(self) -> str:
        return self._state

    def get_name(self) -> str:
        return f"{self._date.isoformat()} / {self._state[:9]}..."

class Originator:
    def __init__(self, state: str):
        self._state = state

    def set_state(self, state: str) -> None:
        self._state = state

    def get_state(self) -> str:
        return self._state

    def save(self) -> Memento:
        return Memento(self._state)

    def restore(self, memento: Memento) -> None:
        self._state = memento.get_state()

class Caretaker:
    def __init__(self, originator: Originator):
        self._history: list[Memento] = []
        self._originator = originator

    def backup(self) -> None:
        self._history.append(self._originator.save())

    def undo(self) -> None:
        if not self._history:
            return
        memento = self._history.pop()
        self._originator.restore(memento)

# Usage — text editor undo
editor = Originator("Hello")
history = Caretaker(editor)

history.backup()
editor.set_state("Hello World")
history.backup()
editor.set_state("Hello World!!!")

print(editor.get_state())  # "Hello World!!!"
history.undo()
print(editor.get_state())  # "Hello World"
history.undo()
print(editor.get_state())  # "Hello"`,
  },
  realWorldExamples: [
    "Text editor undo/redo (VS Code, Google Docs)",
    "Game save states (checkpoint system in RPGs)",
    "Database transaction rollback (SAVEPOINT / ROLLBACK TO)",
  ],
  whenToUse: [
    "You need undo/redo functionality",
    "You want to create snapshots of object state for rollback",
    "Direct access to internal state would break encapsulation",
  ],
  whenNotToUse: [
    "When state snapshots are very large and memory is constrained",
    "When state changes are simple enough to reverse with inverse operations",
    "When you can use the Command pattern's undo() instead of full snapshots",
  ],
  interviewTips: [
    "Undo/redo and save/load are the canonical use cases — demonstrate both",
    "Key insight: only the Originator can read the Memento — this preserves encapsulation",
    "Discuss storage tradeoffs: full snapshots vs incremental deltas",
  ],
  commonMistakes: [
    "Storing too many mementos — unbounded history causes memory leaks",
    "Exposing the memento's internal state — breaks encapsulation (the whole point of the pattern)",
    "Not making mementos immutable — external modification defeats their purpose",
  ],
  relatedPatterns: [
    { patternId: "command", relationship: "Command uses Memento to store state needed for undo operations" },
    { patternId: "prototype", relationship: "Both involve copying state, but Prototype clones objects while Memento saves/restores state" },
    { patternId: "iterator", relationship: "Memento can save iterator state for bookmarking and resuming traversal" },
  ],
};

// ════════════════════════════════════════════════════════════
//  VISITOR (LLD-095)
// ════════════════════════════════════════════════════════════

const visitor: DesignPattern = {
  id: "visitor",
  name: "Visitor",
  category: "behavioral",
  description:
    "You're building a compiler that parses code into an Abstract Syntax Tree. Now you need to add type-checking, code generation, and pretty-printing — but modifying every AST node class for each new operation violates the Open/Closed Principle. The Visitor pattern lets you define new operations on a structure without changing the classes of the elements on which it operates, using double dispatch.",
  analogy: "Think of a tax auditor visiting different businesses. The auditor (Visitor) has different rules for restaurants, retail stores, and offices — but the businesses don't need to change how they operate. They just 'accept' the auditor and let them do their inspection.",
  difficulty: 5,
  tradeoffs: "You gain: add new operations without modifying element classes — true OCP compliance. You pay: adding a new element type requires updating every visitor — the visitor interface grows with each new element.",
  summary: [
    "Visitor = add operations to objects without modifying their classes",
    "Key insight: double dispatch — the element tells the visitor its type via accept()",
    "Use when: you have a stable class hierarchy but frequently add new operations",
  ],
  youAlreadyUseThis: [
    "Babel/TypeScript AST visitors (traverse and transform code)",
    "ESLint rule visitors (visit AST nodes to check patterns)",
    "DOM TreeWalker (visit nodes for processing)",
    "Java Annotation Processors (visit class elements at compile time)",
  ],
  classes: [
    {
      id: "vis-visitor",
      name: "Visitor",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "vis-visitor-meth-0", name: "visitElementA", returnType: "void", params: ["element: ElementA"], visibility: "+" },
        { id: "vis-visitor-meth-1", name: "visitElementB", returnType: "void", params: ["element: ElementB"], visibility: "+" },
      ],
      x: 100,
      y: 50,
    },
    {
      id: "vis-concrete-v1",
      name: "ConcreteVisitor1",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "vis-concrete-v1-meth-0", name: "visitElementA", returnType: "void", params: ["element: ElementA"], visibility: "+" },
        { id: "vis-concrete-v1-meth-1", name: "visitElementB", returnType: "void", params: ["element: ElementB"], visibility: "+" },
      ],
      x: 50,
      y: 270,
    },
    {
      id: "vis-concrete-v2",
      name: "ConcreteVisitor2",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "vis-concrete-v2-meth-0", name: "visitElementA", returnType: "void", params: ["element: ElementA"], visibility: "+" },
        { id: "vis-concrete-v2-meth-1", name: "visitElementB", returnType: "void", params: ["element: ElementB"], visibility: "+" },
      ],
      x: 250,
      y: 270,
    },
    {
      id: "vis-element",
      name: "Element",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "vis-element-meth-0", name: "accept", returnType: "void", params: ["visitor: Visitor"], visibility: "+" },
      ],
      x: 500,
      y: 50,
    },
    {
      id: "vis-element-a",
      name: "ElementA",
      stereotype: "class",
      attributes: [
        { id: "vis-element-a-attr-0", name: "data", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "vis-element-a-meth-0", name: "accept", returnType: "void", params: ["visitor: Visitor"], visibility: "+" },
        { id: "vis-element-a-meth-1", name: "operationA", returnType: "string", params: [], visibility: "+" },
      ],
      x: 450,
      y: 270,
    },
    {
      id: "vis-element-b",
      name: "ElementB",
      stereotype: "class",
      attributes: [
        { id: "vis-element-b-attr-0", name: "value", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "vis-element-b-meth-0", name: "accept", returnType: "void", params: ["visitor: Visitor"], visibility: "+" },
        { id: "vis-element-b-meth-1", name: "operationB", returnType: "number", params: [], visibility: "+" },
      ],
      x: 650,
      y: 270,
    },
  ],
  relationships: [
    { id: rid(), source: "vis-concrete-v1", target: "vis-visitor", type: "realization" },
    { id: rid(), source: "vis-concrete-v2", target: "vis-visitor", type: "realization" },
    { id: rid(), source: "vis-element-a", target: "vis-element", type: "realization" },
    { id: rid(), source: "vis-element-b", target: "vis-element", type: "realization" },
    { id: rid(), source: "vis-visitor", target: "vis-element", type: "dependency", label: "visits" },
  ],
  code: {
    typescript: `interface Visitor {
  visitElementA(element: ElementA): string;
  visitElementB(element: ElementB): string;
}

interface Element {
  accept(visitor: Visitor): string;
}

class ElementA implements Element {
  constructor(public data: string) {}

  accept(visitor: Visitor): string {
    return visitor.visitElementA(this);
  }

  operationA(): string {
    return this.data;
  }
}

class ElementB implements Element {
  constructor(public value: number) {}

  accept(visitor: Visitor): string {
    return visitor.visitElementB(this);
  }

  operationB(): number {
    return this.value;
  }
}

// Visitor 1: JSON export
class JsonExportVisitor implements Visitor {
  visitElementA(element: ElementA): string {
    return JSON.stringify({ type: "A", data: element.operationA() });
  }

  visitElementB(element: ElementB): string {
    return JSON.stringify({ type: "B", value: element.operationB() });
  }
}

// Visitor 2: XML export
class XmlExportVisitor implements Visitor {
  visitElementA(element: ElementA): string {
    return \`<a>\${element.operationA()}</a>\`;
  }

  visitElementB(element: ElementB): string {
    return \`<b>\${element.operationB()}</b>\`;
  }
}

// Usage — double dispatch in action
const elements: Element[] = [
  new ElementA("hello"),
  new ElementB(42),
];

const jsonVisitor = new JsonExportVisitor();
const xmlVisitor = new XmlExportVisitor();

for (const el of elements) {
  console.log(el.accept(jsonVisitor));
  console.log(el.accept(xmlVisitor));
}`,
    python: `from abc import ABC, abstractmethod

class Visitor(ABC):
    @abstractmethod
    def visit_element_a(self, element: "ElementA") -> str: ...

    @abstractmethod
    def visit_element_b(self, element: "ElementB") -> str: ...

class Element(ABC):
    @abstractmethod
    def accept(self, visitor: Visitor) -> str: ...

class ElementA(Element):
    def __init__(self, data: str):
        self.data = data

    def accept(self, visitor: Visitor) -> str:
        return visitor.visit_element_a(self)

    def operation_a(self) -> str:
        return self.data

class ElementB(Element):
    def __init__(self, value: int):
        self.value = value

    def accept(self, visitor: Visitor) -> str:
        return visitor.visit_element_b(self)

    def operation_b(self) -> int:
        return self.value

# Visitor 1: JSON export
class JsonExportVisitor(Visitor):
    def visit_element_a(self, element: ElementA) -> str:
        return f'{{"type": "A", "data": "{element.operation_a()}"}}'

    def visit_element_b(self, element: ElementB) -> str:
        return f'{{"type": "B", "value": {element.operation_b()}}}'

# Visitor 2: XML export
class XmlExportVisitor(Visitor):
    def visit_element_a(self, element: ElementA) -> str:
        return f"<a>{element.operation_a()}</a>"

    def visit_element_b(self, element: ElementB) -> str:
        return f"<b>{element.operation_b()}</b>"

# Usage — double dispatch in action
elements: list[Element] = [ElementA("hello"), ElementB(42)]

json_visitor = JsonExportVisitor()
xml_visitor = XmlExportVisitor()

for el in elements:
    print(el.accept(json_visitor))
    print(el.accept(xml_visitor))`,
  },
  realWorldExamples: [
    "Compiler AST visitors (type checking, code generation, optimization passes)",
    "Document exporters (export same doc tree to PDF, HTML, Markdown)",
    "Tax calculators (different tax rules applied to different income types)",
  ],
  whenToUse: [
    "You need to perform many unrelated operations on a stable object structure",
    "The object structure rarely changes but new operations are added frequently",
    "You want to avoid polluting element classes with unrelated behaviors",
  ],
  whenNotToUse: [
    "When the element hierarchy changes frequently (every new element updates all visitors)",
    "When there are only one or two operations (simpler to add methods directly)",
    "When double dispatch adds confusion without real extensibility benefit",
  ],
  interviewTips: [
    "Classic double-dispatch question — explain why you need accept() AND visit()",
    "Key tradeoff: easy to add new operations, hard to add new element types",
    "Show how Visitor avoids polluting element classes with unrelated operations",
  ],
  commonMistakes: [
    "Using Visitor when the element hierarchy changes frequently (every new element breaks all visitors)",
    "Breaking encapsulation by requiring elements to expose too much internal state to visitors",
    "Not considering simpler alternatives like pattern matching or polymorphism",
  ],
  relatedPatterns: [
    { patternId: "composite", relationship: "Visitor can operate on Composite tree structures to perform operations across the whole tree" },
    { patternId: "iterator", relationship: "Iterator traverses a structure; Visitor defines what to do at each element" },
    { patternId: "strategy", relationship: "Both externalize behavior, but Visitor dispatches based on element type while Strategy swaps algorithms" },
  ],
};

// ════════════════════════════════════════════════════════════
//  CREATIONAL PATTERNS (LLD-096)
// ════════════════════════════════════════════════════════════

const prototype: DesignPattern = {
  id: "prototype",
  name: "Prototype",
  category: "creational",
  description:
    "You're building a game where the player spawns hundreds of identical enemy units. Each unit has complex stats, textures, and AI behavior that takes 200ms to initialize from scratch. Creating each one fresh is too slow. The Prototype pattern specifies the kind of objects to create using a prototypical instance, and creates new objects by copying this prototype — cloning instead of constructing.",
  analogy: "Cell division — a cell copies itself rather than being built from scratch. The daughter cell inherits all the organelles, DNA, and state of the parent, then mutates independently.",
  difficulty: 2,
  tradeoffs: "You gain: fast object creation by cloning, avoiding expensive initialization. You pay: deep cloning complex object graphs with circular references can be tricky and error-prone.",
  summary: [
    "Prototype = create new objects by cloning an existing instance",
    "Key insight: copying an initialized object is faster than re-running its constructor",
    "Use when: object creation is expensive, and instances differ only slightly",
  ],
  youAlreadyUseThis: [
    "JavaScript Object.create() (prototype-based inheritance)",
    "Spread operator / structuredClone() (shallow/deep copy)",
    "Python copy.deepcopy() for cloning objects",
    "Game engines: Unity Instantiate() clones prefabs",
  ],
  predictionPrompts: [
    {
      question: "What is the difference between a shallow clone and a deep clone in the Prototype pattern?",
      answer: "A shallow clone copies top-level fields but shares nested object references. A deep clone recursively copies everything, so changes to the clone never affect the original.",
    },
  ],
  classes: [
    {
      id: "proto-prototype",
      name: "Prototype",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "proto-prototype-meth-0", name: "clone", returnType: "Prototype", params: [], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "proto-concrete1",
      name: "ConcretePrototype1",
      stereotype: "class",
      attributes: [
        { id: "proto-concrete1-attr-0", name: "field1", type: "string", visibility: "-" },
        { id: "proto-concrete1-attr-1", name: "nested", type: "object", visibility: "-" },
      ],
      methods: [
        { id: "proto-concrete1-meth-0", name: "clone", returnType: "Prototype", params: [], visibility: "+" },
      ],
      x: 120,
      y: 270,
    },
    {
      id: "proto-concrete2",
      name: "ConcretePrototype2",
      stereotype: "class",
      attributes: [
        { id: "proto-concrete2-attr-0", name: "field2", type: "number", visibility: "-" },
        { id: "proto-concrete2-attr-1", name: "config", type: "Map", visibility: "-" },
      ],
      methods: [
        { id: "proto-concrete2-meth-0", name: "clone", returnType: "Prototype", params: [], visibility: "+" },
      ],
      x: 480,
      y: 270,
    },
  ],
  relationships: [
    { id: rid(), source: "proto-concrete1", target: "proto-prototype", type: "realization" },
    { id: rid(), source: "proto-concrete2", target: "proto-prototype", type: "realization" },
  ],
  code: {
    typescript: `interface Prototype {
  clone(): Prototype;
}

class GameUnit implements Prototype {
  constructor(
    public name: string,
    public hp: number,
    public abilities: string[],
    public stats: { attack: number; defense: number },
  ) {}

  clone(): GameUnit {
    // Deep clone using structuredClone (or spread + manual copy)
    return new GameUnit(
      this.name,
      this.hp,
      [...this.abilities],
      { ...this.stats },
    );
  }

  toString(): string {
    return \`\${this.name} (HP:\${this.hp}, ATK:\${this.stats.attack})\`;
  }
}

class DocumentTemplate implements Prototype {
  constructor(
    public title: string,
    public sections: string[],
    public metadata: Record<string, string>,
  ) {}

  clone(): DocumentTemplate {
    return new DocumentTemplate(
      this.title,
      [...this.sections],
      { ...this.metadata },
    );
  }
}

// Usage — clone and customize
const archerTemplate = new GameUnit("Archer", 100, ["shoot", "dodge"], { attack: 15, defense: 5 });

const archer1 = archerTemplate.clone();
const archer2 = archerTemplate.clone();
archer2.name = "Elite Archer";
archer2.stats.attack = 25;

console.log(archer1.toString()); // Archer (HP:100, ATK:15)
console.log(archer2.toString()); // Elite Archer (HP:100, ATK:25)
console.log(archerTemplate.toString()); // Archer (HP:100, ATK:15) — unchanged`,
    python: `import copy
from dataclasses import dataclass, field
from abc import ABC, abstractmethod

class Prototype(ABC):
    @abstractmethod
    def clone(self) -> "Prototype": ...

@dataclass
class GameUnit(Prototype):
    name: str
    hp: int
    abilities: list[str]
    stats: dict[str, int]

    def clone(self) -> "GameUnit":
        return copy.deepcopy(self)

    def __str__(self) -> str:
        return f"{self.name} (HP:{self.hp}, ATK:{self.stats['attack']})"

@dataclass
class DocumentTemplate(Prototype):
    title: str
    sections: list[str]
    metadata: dict[str, str] = field(default_factory=dict)

    def clone(self) -> "DocumentTemplate":
        return copy.deepcopy(self)

# Usage — clone and customize
archer_template = GameUnit("Archer", 100, ["shoot", "dodge"], {"attack": 15, "defense": 5})

archer1 = archer_template.clone()
archer2 = archer_template.clone()
archer2.name = "Elite Archer"
archer2.stats["attack"] = 25

print(archer1)            # Archer (HP:100, ATK:15)
print(archer2)            # Elite Archer (HP:100, ATK:25)
print(archer_template)    # Archer (HP:100, ATK:15) — unchanged`,
  },
  realWorldExamples: [
    "Game object spawning (clone enemy/NPC templates with preset stats)",
    "Document templates (clone a base document, customize per client)",
    "Configuration cloning (copy base config, override per environment)",
  ],
  whenToUse: [
    "Object creation is expensive and you need many similar instances",
    "You want to avoid subclassing just to create variations of an object",
    "Objects need to be created at runtime from dynamic configurations",
  ],
  whenNotToUse: [
    "When objects are simple and cheap to construct directly",
    "When deep cloning complex graphs with circular references is error-prone",
    "When each object is truly unique with no shared baseline",
  ],
  interviewTips: [
    "Key question: shallow vs deep copy — explain the difference and when each matters",
    "Real-world hook: JavaScript's Object.create() and prototype chain are named after this pattern",
    "Show awareness of the clone registry variant for managing a catalog of prototypes",
  ],
  commonMistakes: [
    "Implementing shallow copy when deep copy is needed (nested references still shared)",
    "Forgetting to clone mutable sub-objects — changes to the clone affect the original",
    "Not handling circular references in deep copy implementations",
  ],
  relatedPatterns: [
    { patternId: "abstract-factory", relationship: "Prototype can replace Abstract Factory when products are configured rather than subclassed" },
    { patternId: "memento", relationship: "Memento saves state snapshots; Prototype clones entire objects including behavior" },
    { patternId: "decorator", relationship: "Both can be used to add capabilities, but Prototype clones while Decorator wraps" },
  ],
};

// ════════════════════════════════════════════════════════════
//  STRUCTURAL PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const bridge: DesignPattern = {
  id: "bridge",
  name: "Bridge",
  category: "structural",
  description:
    "You're building a cross-platform drawing app that runs on Windows, macOS, and Linux. You have shapes (Circle, Square) and platforms (Windows, macOS). Using inheritance, you'd need WindowsCircle, MacCircle, LinuxCircle, WindowsSquare... an explosion of classes. The Bridge pattern decouples an abstraction from its implementation so that the two can vary independently — connect them via composition, not inheritance.",
  analogy: "A universal remote control works with any TV brand — the remote (abstraction) and TV (implementation) change independently. Add a new remote type or a new TV brand without affecting the other.",
  difficulty: 3,
  tradeoffs: "You gain: abstraction and implementation evolve independently, avoiding class explosion. You pay: added indirection — two separate hierarchies connected via a reference can be harder to trace through.",
  summary: [
    "Bridge = separate 'what' (abstraction) from 'how' (implementation) via composition",
    "Key insight: prefer composition over inheritance when you have two orthogonal dimensions of variation",
    "Use when: you'd otherwise have M x N subclasses from combining two hierarchies",
  ],
  youAlreadyUseThis: [
    "JDBC drivers (same SQL API, different database implementations)",
    "React Native (same component API, platform-specific renderers)",
    "Device drivers (OS talks to a standard interface, vendors implement it)",
    "Logging frameworks (same log API, different output targets: file, console, remote)",
  ],
  predictionPrompts: [
    {
      question: "If you have 3 shape types and 4 platform renderers, how many classes do you need WITH vs WITHOUT Bridge?",
      answer: "Without Bridge: 3 x 4 = 12 concrete classes. With Bridge: 3 abstraction classes + 4 implementation classes = 7 total. Bridge eliminates the multiplicative explosion.",
    },
  ],
  classes: [
    {
      id: "br-abstraction",
      name: "Abstraction",
      stereotype: "abstract",
      attributes: [
        { id: "br-abstraction-attr-0", name: "implementor", type: "Implementor", visibility: "#" },
      ],
      methods: [
        { id: "br-abstraction-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 120,
      y: 50,
    },
    {
      id: "br-refined",
      name: "RefinedAbstraction",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "br-refined-meth-0", name: "operation", returnType: "string", params: [], visibility: "+" },
      ],
      x: 120,
      y: 280,
    },
    {
      id: "br-implementor",
      name: "Implementor",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "br-implementor-meth-0", name: "operationImpl", returnType: "string", params: [], visibility: "+" },
      ],
      x: 480,
      y: 50,
    },
    {
      id: "br-impl-a",
      name: "ConcreteImplementorA",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "br-impl-a-meth-0", name: "operationImpl", returnType: "string", params: [], visibility: "+" },
      ],
      x: 380,
      y: 280,
    },
    {
      id: "br-impl-b",
      name: "ConcreteImplementorB",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "br-impl-b-meth-0", name: "operationImpl", returnType: "string", params: [], visibility: "+" },
      ],
      x: 580,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "br-abstraction", target: "br-implementor", type: "aggregation", label: "delegates to" },
    { id: rid(), source: "br-refined", target: "br-abstraction", type: "inheritance" },
    { id: rid(), source: "br-impl-a", target: "br-implementor", type: "realization" },
    { id: rid(), source: "br-impl-b", target: "br-implementor", type: "realization" },
  ],
  code: {
    typescript: `// Implementation hierarchy — HOW to render
interface Renderer {
  renderShape(shape: string, x: number, y: number): string;
}

class WindowsRenderer implements Renderer {
  renderShape(shape: string, x: number, y: number): string {
    return \`[Windows GDI] Drawing \${shape} at (\${x}, \${y})\`;
  }
}

class WebCanvasRenderer implements Renderer {
  renderShape(shape: string, x: number, y: number): string {
    return \`[Canvas 2D] Drawing \${shape} at (\${x}, \${y})\`;
  }
}

class SVGRenderer implements Renderer {
  renderShape(shape: string, x: number, y: number): string {
    return \`[SVG] <\${shape} cx="\${x}" cy="\${y}" />\`;
  }
}

// Abstraction hierarchy — WHAT to draw
abstract class Shape {
  constructor(protected renderer: Renderer) {}
  abstract draw(): string;
}

class Circle extends Shape {
  constructor(renderer: Renderer, private radius: number) {
    super(renderer);
  }

  draw(): string {
    return this.renderer.renderShape(\`Circle(r=\${this.radius})\`, 100, 100);
  }
}

class Square extends Shape {
  constructor(renderer: Renderer, private side: number) {
    super(renderer);
  }

  draw(): string {
    return this.renderer.renderShape(\`Square(s=\${this.side})\`, 200, 200);
  }
}

// Usage — mix any shape with any renderer
const winCircle = new Circle(new WindowsRenderer(), 5);
const svgSquare = new Square(new SVGRenderer(), 10);
const webCircle = new Circle(new WebCanvasRenderer(), 8);

console.log(winCircle.draw());  // [Windows GDI] Drawing Circle(r=5) at (100, 100)
console.log(svgSquare.draw());  // [SVG] <Square(s=10) cx="200" cy="200" />
console.log(webCircle.draw());  // [Canvas 2D] Drawing Circle(r=8) at (100, 100)`,
    python: `from abc import ABC, abstractmethod

# Implementation hierarchy — HOW to render
class Renderer(ABC):
    @abstractmethod
    def render_shape(self, shape: str, x: int, y: int) -> str: ...

class WindowsRenderer(Renderer):
    def render_shape(self, shape: str, x: int, y: int) -> str:
        return f"[Windows GDI] Drawing {shape} at ({x}, {y})"

class WebCanvasRenderer(Renderer):
    def render_shape(self, shape: str, x: int, y: int) -> str:
        return f"[Canvas 2D] Drawing {shape} at ({x}, {y})"

class SVGRenderer(Renderer):
    def render_shape(self, shape: str, x: int, y: int) -> str:
        return f'[SVG] <{shape} cx="{x}" cy="{y}" />'

# Abstraction hierarchy — WHAT to draw
class Shape(ABC):
    def __init__(self, renderer: Renderer):
        self._renderer = renderer

    @abstractmethod
    def draw(self) -> str: ...

class Circle(Shape):
    def __init__(self, renderer: Renderer, radius: int):
        super().__init__(renderer)
        self._radius = radius

    def draw(self) -> str:
        return self._renderer.render_shape(f"Circle(r={self._radius})", 100, 100)

class Square(Shape):
    def __init__(self, renderer: Renderer, side: int):
        super().__init__(renderer)
        self._side = side

    def draw(self) -> str:
        return self._renderer.render_shape(f"Square(s={self._side})", 200, 200)

# Usage — mix any shape with any renderer
win_circle = Circle(WindowsRenderer(), 5)
svg_square = Square(SVGRenderer(), 10)
web_circle = Circle(WebCanvasRenderer(), 8)

print(win_circle.draw())   # [Windows GDI] Drawing Circle(r=5) at (100, 100)
print(svg_square.draw())   # [SVG] <Square(s=10) cx="200" cy="200" />
print(web_circle.draw())   # [Canvas 2D] Drawing Circle(r=8) at (100, 100)`,
  },
  realWorldExamples: [
    "Cross-platform UI rendering (same component API, platform-specific renderers)",
    "Remote control + device (any remote works with any TV brand)",
    "JDBC/ODBC drivers (same database API, different vendor implementations)",
  ],
  whenToUse: [
    "You have two orthogonal dimensions of variation (M x N class explosion)",
    "You want to swap implementations at runtime without affecting the abstraction",
    "Platform-specific code needs to be isolated behind a stable interface",
  ],
  whenNotToUse: [
    "When there is only one implementation and no plan for others",
    "When the added indirection makes simple code harder to follow",
    "When the abstraction and implementation are tightly coupled by design",
  ],
  interviewTips: [
    "Bridge prevents the Cartesian product explosion of subclasses (M shapes x N colors = M+N, not MxN)",
    "Designed upfront — contrast with Adapter which is a retrofit for existing incompatible interfaces",
    "Show the two independent hierarchies and how they vary independently",
  ],
  commonMistakes: [
    "Applying Bridge to a single-dimension variation (just use Strategy instead)",
    "Over-engineering: not every abstraction/implementation split needs Bridge",
    "Confusing Bridge with Adapter — Bridge is planned upfront, Adapter is a retrofit",
  ],
  confusedWith: [
    { patternId: "adapter", difference: "Adapter fixes incompatible interfaces after the fact. Bridge separates abstraction from implementation upfront by design." },
  ],
  relatedPatterns: [
    { patternId: "adapter", relationship: "Adapter is a retrofit for incompatible interfaces; Bridge is designed upfront to separate concerns" },
    { patternId: "strategy", relationship: "Strategy varies one algorithm; Bridge varies both the abstraction and the implementation independently" },
    { patternId: "abstract-factory", relationship: "Abstract Factory can create the implementation objects that Bridge uses" },
  ],
};

// ════════════════════════════════════════════════════════════
//  MODERN PATTERNS (continued)
// ════════════════════════════════════════════════════════════

const cqrs: DesignPattern = {
  id: "cqrs",
  name: "CQRS",
  category: "modern",
  description:
    "You're building an e-commerce platform where product browsing generates 100x more traffic than order placement. Using the same model for reads and writes means your catalog queries contend with order writes for the same database resources. CQRS (Command Query Responsibility Segregation) separates read and write operations into distinct models — optimizing each independently for its workload.",
  analogy: "A restaurant where you order from a menu (query) but tell the chef what you want (command) — different paths for reading vs writing. The menu is optimized for browsing, the kitchen ticket for execution.",
  difficulty: 4,
  tradeoffs: "You gain: independently scalable read/write paths, optimized models for each. You pay: eventual consistency between read and write models, significantly more infrastructure complexity.",
  summary: [
    "CQRS = separate read models (queries) from write models (commands)",
    "Key insight: reads and writes have fundamentally different optimization needs",
    "Use when: read-heavy workloads need different data shapes than writes produce",
  ],
  youAlreadyUseThis: [
    "Redux (actions are commands, selectors are queries — different paths)",
    "GraphQL mutations vs queries (separate handling of reads/writes)",
    "Database read replicas (writes to primary, reads from replicas)",
    "Elasticsearch + PostgreSQL (write to PG, read from ES for search)",
  ],
  predictionPrompts: [
    {
      question: "In CQRS, what happens when a command updates data but the read model hasn't been updated yet?",
      answer: "Eventual consistency — the read model is stale for a brief window. This is the core tradeoff: you accept temporary inconsistency in exchange for independent scaling and optimization.",
    },
  ],
  classes: [
    {
      id: "cqrs-command",
      name: "Command",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cqrs-command-meth-0", name: "type", returnType: "string", params: [], visibility: "+" },
        { id: "cqrs-command-meth-1", name: "payload", returnType: "object", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "cqrs-commandbus",
      name: "CommandBus",
      stereotype: "class",
      attributes: [
        { id: "cqrs-commandbus-attr-0", name: "handlers", type: "Map<string, CommandHandler>", visibility: "-" },
      ],
      methods: [
        { id: "cqrs-commandbus-meth-0", name: "register", returnType: "void", params: ["type: string", "handler: CommandHandler"], visibility: "+" },
        { id: "cqrs-commandbus-meth-1", name: "dispatch", returnType: "void", params: ["command: Command"], visibility: "+" },
      ],
      x: 50,
      y: 260,
    },
    {
      id: "cqrs-commandhandler",
      name: "CommandHandler",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cqrs-commandhandler-meth-0", name: "handle", returnType: "void", params: ["command: Command"], visibility: "+" },
      ],
      x: 50,
      y: 460,
    },
    {
      id: "cqrs-query",
      name: "Query",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cqrs-query-meth-0", name: "type", returnType: "string", params: [], visibility: "+" },
        { id: "cqrs-query-meth-1", name: "filters", returnType: "object", params: [], visibility: "+" },
      ],
      x: 500,
      y: 50,
    },
    {
      id: "cqrs-querybus",
      name: "QueryBus",
      stereotype: "class",
      attributes: [
        { id: "cqrs-querybus-attr-0", name: "handlers", type: "Map<string, QueryHandler>", visibility: "-" },
      ],
      methods: [
        { id: "cqrs-querybus-meth-0", name: "register", returnType: "void", params: ["type: string", "handler: QueryHandler"], visibility: "+" },
        { id: "cqrs-querybus-meth-1", name: "execute", returnType: "T", params: ["query: Query"], visibility: "+" },
      ],
      x: 500,
      y: 260,
    },
    {
      id: "cqrs-queryhandler",
      name: "QueryHandler",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "cqrs-queryhandler-meth-0", name: "handle", returnType: "T", params: ["query: Query"], visibility: "+" },
      ],
      x: 500,
      y: 460,
    },
    {
      id: "cqrs-writemodel",
      name: "WriteModel",
      stereotype: "class",
      attributes: [
        { id: "cqrs-writemodel-attr-0", name: "store", type: "Database", visibility: "-" },
      ],
      methods: [
        { id: "cqrs-writemodel-meth-0", name: "save", returnType: "void", params: ["entity: T"], visibility: "+" },
        { id: "cqrs-writemodel-meth-1", name: "update", returnType: "void", params: ["id: string", "data: Partial<T>"], visibility: "+" },
      ],
      x: 50,
      y: 650,
    },
    {
      id: "cqrs-readmodel",
      name: "ReadModel",
      stereotype: "class",
      attributes: [
        { id: "cqrs-readmodel-attr-0", name: "cache", type: "ReadStore", visibility: "-" },
      ],
      methods: [
        { id: "cqrs-readmodel-meth-0", name: "query", returnType: "T[]", params: ["filters: object"], visibility: "+" },
        { id: "cqrs-readmodel-meth-1", name: "getById", returnType: "T | null", params: ["id: string"], visibility: "+" },
      ],
      x: 500,
      y: 650,
    },
  ],
  relationships: [
    { id: rid(), source: "cqrs-commandbus", target: "cqrs-command", type: "dependency", label: "dispatches" },
    { id: rid(), source: "cqrs-commandbus", target: "cqrs-commandhandler", type: "association", label: "routes to" },
    { id: rid(), source: "cqrs-commandhandler", target: "cqrs-writemodel", type: "dependency", label: "writes to" },
    { id: rid(), source: "cqrs-querybus", target: "cqrs-query", type: "dependency", label: "executes" },
    { id: rid(), source: "cqrs-querybus", target: "cqrs-queryhandler", type: "association", label: "routes to" },
    { id: rid(), source: "cqrs-queryhandler", target: "cqrs-readmodel", type: "dependency", label: "reads from" },
  ],
  code: {
    typescript: `// ── Commands (Write Side) ────────────────────────
interface Command {
  readonly type: string;
}

interface CommandHandler<T extends Command = Command> {
  handle(command: T): void;
}

class CreateOrderCommand implements Command {
  readonly type = "CreateOrder";
  constructor(
    public readonly orderId: string,
    public readonly items: { productId: string; qty: number }[],
    public readonly customerId: string,
  ) {}
}

class CreateOrderHandler implements CommandHandler<CreateOrderCommand> {
  private writeDb = new Map<string, object>();

  handle(command: CreateOrderCommand): void {
    const order = {
      id: command.orderId,
      items: command.items,
      customerId: command.customerId,
      status: "created",
      createdAt: new Date(),
    };
    this.writeDb.set(order.id, order);
    console.log(\`[WRITE] Order \${order.id} saved to write DB\`);
    // In production: publish OrderCreated event to sync read model
  }
}

// ── Queries (Read Side) ─────────────────────────
interface Query {
  readonly type: string;
}

interface QueryHandler<T extends Query = Query, R = unknown> {
  handle(query: T): R;
}

class GetOrderQuery implements Query {
  readonly type = "GetOrder";
  constructor(public readonly orderId: string) {}
}

class GetOrderHandler implements QueryHandler<GetOrderQuery, object | null> {
  // Read model — optimized, possibly denormalized
  private readStore = new Map<string, object>();

  handle(query: GetOrderQuery): object | null {
    console.log(\`[READ] Querying order \${query.orderId} from read model\`);
    return this.readStore.get(query.orderId) ?? null;
  }
}

// ── Command/Query Bus ───────────────────────────
class CommandBus {
  private handlers = new Map<string, CommandHandler>();

  register(type: string, handler: CommandHandler): void {
    this.handlers.set(type, handler);
  }

  dispatch(command: Command): void {
    const handler = this.handlers.get(command.type);
    if (!handler) throw new Error(\`No handler for \${command.type}\`);
    handler.handle(command);
  }
}

class QueryBus {
  private handlers = new Map<string, QueryHandler>();

  register(type: string, handler: QueryHandler): void {
    this.handlers.set(type, handler);
  }

  execute<R>(query: Query): R {
    const handler = this.handlers.get(query.type);
    if (!handler) throw new Error(\`No handler for \${query.type}\`);
    return handler.handle(query) as R;
  }
}

// Usage
const commandBus = new CommandBus();
commandBus.register("CreateOrder", new CreateOrderHandler());

const queryBus = new QueryBus();
queryBus.register("GetOrder", new GetOrderHandler());

commandBus.dispatch(new CreateOrderCommand("ord-1", [{ productId: "p-1", qty: 2 }], "cust-1"));
const order = queryBus.execute<object | null>(new GetOrderQuery("ord-1"));`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

# ── Commands (Write Side) ────────────────────────
class Command(ABC):
    @property
    @abstractmethod
    def type(self) -> str: ...

class CommandHandler(ABC):
    @abstractmethod
    def handle(self, command: Command) -> None: ...

@dataclass
class CreateOrderCommand(Command):
    order_id: str
    items: list[dict[str, Any]]
    customer_id: str

    @property
    def type(self) -> str:
        return "CreateOrder"

class CreateOrderHandler(CommandHandler):
    def __init__(self):
        self._write_db: dict[str, dict] = {}

    def handle(self, command: CreateOrderCommand) -> None:
        order = {
            "id": command.order_id,
            "items": command.items,
            "customer_id": command.customer_id,
            "status": "created",
            "created_at": datetime.now(),
        }
        self._write_db[order["id"]] = order
        print(f"[WRITE] Order {order['id']} saved to write DB")

# ── Queries (Read Side) ─────────────────────────
class Query(ABC):
    @property
    @abstractmethod
    def type(self) -> str: ...

class QueryHandler(ABC):
    @abstractmethod
    def handle(self, query: Query) -> Any: ...

@dataclass
class GetOrderQuery(Query):
    order_id: str

    @property
    def type(self) -> str:
        return "GetOrder"

class GetOrderHandler(QueryHandler):
    def __init__(self):
        self._read_store: dict[str, dict] = {}

    def handle(self, query: GetOrderQuery) -> dict | None:
        print(f"[READ] Querying order {query.order_id} from read model")
        return self._read_store.get(query.order_id)

# ── Buses ────────────────────────────────────────
class CommandBus:
    def __init__(self):
        self._handlers: dict[str, CommandHandler] = {}

    def register(self, cmd_type: str, handler: CommandHandler) -> None:
        self._handlers[cmd_type] = handler

    def dispatch(self, command: Command) -> None:
        handler = self._handlers.get(command.type)
        if not handler:
            raise ValueError(f"No handler for {command.type}")
        handler.handle(command)

class QueryBus:
    def __init__(self):
        self._handlers: dict[str, QueryHandler] = {}

    def register(self, query_type: str, handler: QueryHandler) -> None:
        self._handlers[query_type] = handler

    def execute(self, query: Query) -> Any:
        handler = self._handlers.get(query.type)
        if not handler:
            raise ValueError(f"No handler for {query.type}")
        return handler.handle(query)

# Usage
command_bus = CommandBus()
command_bus.register("CreateOrder", CreateOrderHandler())

query_bus = QueryBus()
query_bus.register("GetOrder", GetOrderHandler())

command_bus.dispatch(CreateOrderCommand("ord-1", [{"product_id": "p-1", "qty": 2}], "cust-1"))
order = query_bus.execute(GetOrderQuery("ord-1"))`,
  },
  realWorldExamples: [
    "E-commerce: separate product catalog queries from order placement commands",
    "Social media feeds: write posts to primary DB, read timeline from denormalized read store",
    "Banking: transaction processing (write) vs account balance queries (read from materialized view)",
  ],
  whenToUse: [
    "Read and write workloads have vastly different scaling requirements",
    "You need different data models optimized for queries vs commands",
    "Event-driven architectures where write events feed read projections",
    "High-throughput systems where read and write contention is a bottleneck",
  ],
  whenNotToUse: [
    "Simple CRUD apps where reads and writes are balanced and simple",
    "When strong consistency is required on every read immediately after write",
    "When the added infrastructure (event buses, projections) outweighs the benefit",
  ],
  interviewTips: [
    "Explain CQRS at the right level — it's a data access pattern, not a full architecture",
    "Key insight: read models can be denormalized for speed while write models enforce business rules",
    "Common follow-up: how does CQRS relate to Event Sourcing? (complementary but independent)",
  ],
  commonMistakes: [
    "Applying CQRS everywhere — it adds complexity; only use for high-read/write-asymmetry domains",
    "Ignoring eventual consistency between read and write models",
    "Making the read model too closely mirror the write model (defeats the purpose)",
  ],
  relatedPatterns: [
    { patternId: "event-sourcing", relationship: "Event Sourcing is often combined with CQRS — events feed the write side, projections feed the read side" },
    { patternId: "repository", relationship: "CQRS splits Repository into separate read and write repositories" },
    { patternId: "mediator", relationship: "Mediator can route commands and queries to their respective handlers in a CQRS system" },
  ],
};

const eventSourcing: DesignPattern = {
  id: "event-sourcing",
  name: "Event Sourcing",
  category: "modern",
  description:
    "You're building a banking system. A customer disputes a charge, and you need to know exactly what happened, when, and how the balance changed over time. Storing only the current balance loses this history forever. Event Sourcing stores all changes to application state as a sequence of immutable events — instead of storing just the current state, you store every event that led to it and can reconstruct any point in time.",
  analogy: "A bank statement — instead of storing just your balance, it stores every transaction. You can always reconstruct the balance from the history. Git works the same way: each commit is an event, and the current code is derived from replaying all commits.",
  difficulty: 4,
  tradeoffs: "You gain: complete audit trail, time-travel debugging, ability to derive new read models from historical events. You pay: event schema evolution is hard, storage grows unbounded, and rebuilding state from thousands of events can be slow without snapshots.",
  summary: [
    "Event Sourcing = store events, not state. Current state = replay of all events.",
    "Key insight: events are FACTS that happened — immutable, append-only, never deleted",
    "Use when: you need a complete audit trail or must reconstruct state at any point in time",
  ],
  youAlreadyUseThis: [
    "Git (commits are events, working tree is derived state)",
    "Redux with action logging (action history can replay state)",
    "Database transaction logs / WAL (write-ahead log IS event sourcing)",
    "Google Docs (every keystroke is an event, current doc = replay)",
  ],
  predictionPrompts: [
    {
      question: "If the event store has 10,000 events for one aggregate, how do you avoid replaying all of them on every read?",
      answer: "Snapshots — periodically save the aggregate state at event N, then replay only events after N. This is exactly like git's pack files.",
    },
  ],
  classes: [
    {
      id: "es-event",
      name: "Event",
      stereotype: "abstract",
      attributes: [
        { id: "es-event-attr-0", name: "id", type: "string", visibility: "+" },
        { id: "es-event-attr-1", name: "aggregateId", type: "string", visibility: "+" },
        { id: "es-event-attr-2", name: "timestamp", type: "Date", visibility: "+" },
        { id: "es-event-attr-3", name: "type", type: "string", visibility: "+" },
      ],
      methods: [],
      x: 300,
      y: 50,
    },
    {
      id: "es-eventstore",
      name: "EventStore",
      stereotype: "class",
      attributes: [
        { id: "es-eventstore-attr-0", name: "events", type: "Event[]", visibility: "-" },
      ],
      methods: [
        { id: "es-eventstore-meth-0", name: "append", returnType: "void", params: ["event: Event"], visibility: "+" },
        { id: "es-eventstore-meth-1", name: "getEvents", returnType: "Event[]", params: ["aggregateId: string"], visibility: "+" },
        { id: "es-eventstore-meth-2", name: "getEventsSince", returnType: "Event[]", params: ["aggregateId: string", "since: Date"], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "es-aggregate",
      name: "Aggregate",
      stereotype: "abstract",
      attributes: [
        { id: "es-aggregate-attr-0", name: "id", type: "string", visibility: "#" },
        { id: "es-aggregate-attr-1", name: "version", type: "number", visibility: "#" },
        { id: "es-aggregate-attr-2", name: "uncommittedEvents", type: "Event[]", visibility: "#" },
      ],
      methods: [
        { id: "es-aggregate-meth-0", name: "apply", returnType: "void", params: ["event: Event"], visibility: "#" },
        { id: "es-aggregate-meth-1", name: "loadFromHistory", returnType: "void", params: ["events: Event[]"], visibility: "+" },
        { id: "es-aggregate-meth-2", name: "getUncommitted", returnType: "Event[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 320,
    },
    {
      id: "es-eventbus",
      name: "EventBus",
      stereotype: "class",
      attributes: [
        { id: "es-eventbus-attr-0", name: "handlers", type: "Map<string, Function[]>", visibility: "-" },
      ],
      methods: [
        { id: "es-eventbus-meth-0", name: "subscribe", returnType: "void", params: ["eventType: string", "handler: Function"], visibility: "+" },
        { id: "es-eventbus-meth-1", name: "publish", returnType: "void", params: ["event: Event"], visibility: "+" },
      ],
      x: 550,
      y: 50,
    },
    {
      id: "es-deposited",
      name: "MoneyDeposited",
      stereotype: "class",
      attributes: [
        { id: "es-deposited-attr-0", name: "amount", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 200,
      y: 200,
    },
    {
      id: "es-withdrawn",
      name: "MoneyWithdrawn",
      stereotype: "class",
      attributes: [
        { id: "es-withdrawn-attr-0", name: "amount", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 420,
      y: 200,
    },
  ],
  relationships: [
    { id: rid(), source: "es-eventstore", target: "es-event", type: "aggregation", label: "stores", targetCardinality: "*" },
    { id: rid(), source: "es-deposited", target: "es-event", type: "inheritance" },
    { id: rid(), source: "es-withdrawn", target: "es-event", type: "inheritance" },
    { id: rid(), source: "es-aggregate", target: "es-event", type: "dependency", label: "applies" },
    { id: rid(), source: "es-eventbus", target: "es-event", type: "dependency", label: "publishes" },
  ],
  code: {
    typescript: `// ── Domain Events ────────────────────────────────
interface DomainEvent {
  readonly id: string;
  readonly aggregateId: string;
  readonly timestamp: Date;
  readonly type: string;
}

class MoneyDeposited implements DomainEvent {
  readonly type = "MoneyDeposited";
  readonly timestamp = new Date();
  constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    public readonly amount: number,
  ) {}
}

class MoneyWithdrawn implements DomainEvent {
  readonly type = "MoneyWithdrawn";
  readonly timestamp = new Date();
  constructor(
    public readonly id: string,
    public readonly aggregateId: string,
    public readonly amount: number,
  ) {}
}

// ── Event Store ─────────────────────────────────
class EventStore {
  private events: DomainEvent[] = [];

  append(event: DomainEvent): void {
    this.events.push(event);
  }

  getEvents(aggregateId: string): DomainEvent[] {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }
}

// ── Aggregate (state rebuilt from events) ───────
class BankAccount {
  private _balance = 0;
  private _id: string;

  constructor(id: string) {
    this._id = id;
  }

  get balance(): number { return this._balance; }

  // Apply event to update state
  apply(event: DomainEvent): void {
    if (event instanceof MoneyDeposited) {
      this._balance += event.amount;
    } else if (event instanceof MoneyWithdrawn) {
      this._balance -= event.amount;
    }
  }

  // Reconstruct state from event history
  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.apply(event);
    }
  }
}

// Usage
const store = new EventStore();
const accountId = "acc-001";

// Record events (not direct state mutations!)
store.append(new MoneyDeposited("e1", accountId, 1000));
store.append(new MoneyDeposited("e2", accountId, 500));
store.append(new MoneyWithdrawn("e3", accountId, 200));

// Reconstruct current state
const account = new BankAccount(accountId);
account.loadFromHistory(store.getEvents(accountId));
console.log(\`Balance: \$\${account.balance}\`); // Balance: $1300

// Time-travel: reconstruct state at event 2
const accountAtE2 = new BankAccount(accountId);
accountAtE2.loadFromHistory(store.getEvents(accountId).slice(0, 2));
console.log(\`Balance at e2: \$\${accountAtE2.balance}\`); // Balance at e2: $1500`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
import uuid

# ── Domain Events ────────────────────────────────
@dataclass(frozen=True)
class DomainEvent:
    id: str
    aggregate_id: str
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass(frozen=True)
class MoneyDeposited(DomainEvent):
    amount: float = 0

@dataclass(frozen=True)
class MoneyWithdrawn(DomainEvent):
    amount: float = 0

# ── Event Store ─────────────────────────────────
class EventStore:
    def __init__(self):
        self._events: list[DomainEvent] = []

    def append(self, event: DomainEvent) -> None:
        self._events.append(event)

    def get_events(self, aggregate_id: str) -> list[DomainEvent]:
        return [e for e in self._events if e.aggregate_id == aggregate_id]

# ── Aggregate (state rebuilt from events) ───────
class BankAccount:
    def __init__(self, id: str):
        self._id = id
        self._balance = 0.0

    @property
    def balance(self) -> float:
        return self._balance

    def apply(self, event: DomainEvent) -> None:
        if isinstance(event, MoneyDeposited):
            self._balance += event.amount
        elif isinstance(event, MoneyWithdrawn):
            self._balance -= event.amount

    def load_from_history(self, events: list[DomainEvent]) -> None:
        for event in events:
            self.apply(event)

# Usage
store = EventStore()
account_id = "acc-001"

store.append(MoneyDeposited(str(uuid.uuid4()), account_id, amount=1000))
store.append(MoneyDeposited(str(uuid.uuid4()), account_id, amount=500))
store.append(MoneyWithdrawn(str(uuid.uuid4()), account_id, amount=200))

account = BankAccount(account_id)
account.load_from_history(store.get_events(account_id))
print(f"Balance: {account.balance}")  # Balance: 1300.0

# Time-travel: state at event 2
account_at_e2 = BankAccount(account_id)
account_at_e2.load_from_history(store.get_events(account_id)[:2])
print(f"Balance at e2: {account_at_e2.balance}")  # Balance at e2: 1500.0`,
  },
  realWorldExamples: [
    "Bank transaction ledger (every deposit/withdrawal is an event, balance is derived)",
    "Git version control (commits are events, working tree is derived state)",
    "Audit logging systems (compliance requires knowing exactly what happened and when)",
  ],
  whenToUse: [
    "You need a complete, immutable audit trail of all changes",
    "You need to reconstruct state at any point in time (time-travel debugging)",
    "You want to derive multiple read models from the same event stream",
    "Domain events are first-class business concepts (not just technical plumbing)",
  ],
  whenNotToUse: [
    "Simple CRUD applications where current state is all you need",
    "When event schema evolution and versioning would be too costly",
    "When storage costs of unbounded event logs are prohibitive",
    "When strong consistency on reads is required without eventual consistency tolerance",
  ],
  interviewTips: [
    "Lead with the audit trail benefit — every state change is recorded and replayable",
    "Key insight: current state = replay of all events from the beginning",
    "Discuss snapshots for performance — you don't replay ALL events every time",
  ],
  commonMistakes: [
    "Not implementing snapshots — replaying thousands of events on every read is too slow",
    "Schema evolution: changing event formats without a migration strategy",
    "Using Event Sourcing for simple CRUD where a traditional database is simpler and sufficient",
  ],
  relatedPatterns: [
    { patternId: "cqrs", relationship: "CQRS is the natural companion — events are the write side, projections are the read side" },
    { patternId: "saga", relationship: "Saga orchestrates multi-step transactions using events from Event Sourcing" },
    { patternId: "observer", relationship: "Event handlers in Event Sourcing are essentially Observers listening to domain events" },
    { patternId: "memento", relationship: "Both capture state, but Event Sourcing stores transitions while Memento stores snapshots" },
  ],
};

const saga: DesignPattern = {
  id: "saga",
  name: "Saga",
  category: "modern",
  description:
    "You're building an e-commerce checkout that must reserve inventory, charge the credit card, and confirm the order across three separate microservices. If the card charge fails AFTER inventory was reserved, you need to release that inventory. Traditional database transactions can't span multiple services. The Saga pattern manages distributed transactions by defining a sequence of local transactions, each with a compensating action that undoes it if a later step fails.",
  analogy: "Planning a road trip with friends — if the hotel cancels, you cancel the flight and car rental too. Each step has a rollback plan. The trip only succeeds if ALL reservations hold; one failure triggers compensation for all previous steps.",
  difficulty: 5,
  tradeoffs: "You gain: distributed transaction coordination without two-phase commit (2PC), each service stays autonomous. You pay: compensating actions are hard to get right, eventual consistency, and debugging distributed rollbacks is extremely challenging.",
  summary: [
    "Saga = sequence of local transactions, each with a compensating (undo) action",
    "Key insight: instead of one big distributed transaction, chain small ones with rollback plans",
    "Use when: a business process spans multiple services that each own their own database",
  ],
  youAlreadyUseThis: [
    "Travel booking sites (flight + hotel + car — cancel one, cancel all)",
    "E-commerce checkout (reserve stock -> charge card -> confirm order)",
    "Bank transfers between institutions (debit source, credit destination, reverse on failure)",
    "CI/CD pipelines (deploy -> test -> rollback on failure)",
  ],
  predictionPrompts: [
    {
      question: "In a 5-step saga, if step 3 fails, which compensating actions run and in what order?",
      answer: "Compensating actions for steps 2 and 1 run in REVERSE order (2 then 1). Step 3's action never completed so it has nothing to compensate. Steps 4-5 never started.",
    },
  ],
  classes: [
    {
      id: "saga-orchestrator",
      name: "SagaOrchestrator",
      stereotype: "class",
      attributes: [
        { id: "saga-orchestrator-attr-0", name: "steps", type: "SagaStep[]", visibility: "-" },
        { id: "saga-orchestrator-attr-1", name: "state", type: "SagaState", visibility: "-" },
        { id: "saga-orchestrator-attr-2", name: "completedSteps", type: "SagaStep[]", visibility: "-" },
      ],
      methods: [
        { id: "saga-orchestrator-meth-0", name: "execute", returnType: "Promise<SagaResult>", params: [], visibility: "+" },
        { id: "saga-orchestrator-meth-1", name: "compensate", returnType: "Promise<void>", params: [], visibility: "-" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "saga-step",
      name: "SagaStep",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "saga-step-meth-0", name: "execute", returnType: "Promise<void>", params: ["context: SagaContext"], visibility: "+" },
        { id: "saga-step-meth-1", name: "compensate", returnType: "Promise<void>", params: ["context: SagaContext"], visibility: "+" },
        { id: "saga-step-meth-2", name: "name", returnType: "string", params: [], visibility: "+" },
      ],
      x: 300,
      y: 280,
    },
    {
      id: "saga-state",
      name: "SagaState",
      stereotype: "enum",
      attributes: [
        { id: "saga-state-attr-0", name: "PENDING", type: "", visibility: "+" },
        { id: "saga-state-attr-1", name: "RUNNING", type: "", visibility: "+" },
        { id: "saga-state-attr-2", name: "COMPLETED", type: "", visibility: "+" },
        { id: "saga-state-attr-3", name: "COMPENSATING", type: "", visibility: "+" },
        { id: "saga-state-attr-4", name: "FAILED", type: "", visibility: "+" },
      ],
      methods: [],
      x: 600,
      y: 50,
    },
    {
      id: "saga-compensate",
      name: "CompensatingAction",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "saga-compensate-meth-0", name: "undo", returnType: "Promise<void>", params: ["context: SagaContext"], visibility: "+" },
      ],
      x: 600,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "saga-orchestrator", target: "saga-step", type: "aggregation", label: "manages", targetCardinality: "*" },
    { id: rid(), source: "saga-orchestrator", target: "saga-state", type: "dependency", label: "tracks" },
    { id: rid(), source: "saga-step", target: "saga-compensate", type: "association", label: "has rollback" },
  ],
  code: {
    typescript: `// ── Saga Infrastructure ──────────────────────────
type SagaContext = Record<string, unknown>;

interface SagaStep {
  name: string;
  execute(context: SagaContext): Promise<void>;
  compensate(context: SagaContext): Promise<void>;
}

type SagaState = "pending" | "running" | "completed" | "compensating" | "failed";

interface SagaResult {
  state: SagaState;
  context: SagaContext;
  error?: string;
}

class SagaOrchestrator {
  private completedSteps: SagaStep[] = [];
  private state: SagaState = "pending";

  constructor(private steps: SagaStep[]) {}

  async execute(initialContext: SagaContext = {}): Promise<SagaResult> {
    this.state = "running";
    const context = { ...initialContext };

    for (const step of this.steps) {
      try {
        console.log(\`[SAGA] Executing: \${step.name}\`);
        await step.execute(context);
        this.completedSteps.push(step);
      } catch (error) {
        console.error(\`[SAGA] Failed at: \${step.name}\`);
        this.state = "compensating";
        await this.compensate(context);
        this.state = "failed";
        return { state: this.state, context, error: String(error) };
      }
    }

    this.state = "completed";
    return { state: this.state, context };
  }

  private async compensate(context: SagaContext): Promise<void> {
    // Reverse order — most recent step compensated first
    for (const step of [...this.completedSteps].reverse()) {
      try {
        console.log(\`[SAGA] Compensating: \${step.name}\`);
        await step.compensate(context);
      } catch (err) {
        console.error(\`[SAGA] Compensation failed for: \${step.name}\`);
      }
    }
  }
}

// ── Concrete Steps ──────────────────────────────
const reserveInventory: SagaStep = {
  name: "Reserve Inventory",
  async execute(ctx) {
    ctx.inventoryReserved = true;
    console.log("  ✓ Inventory reserved");
  },
  async compensate(ctx) {
    ctx.inventoryReserved = false;
    console.log("  ↩ Inventory released");
  },
  interviewTips: [
    "Two variants: orchestration (central coordinator) vs choreography (event-driven) — explain both",
    "Key insight: every step must have a compensating action for rollback",
    "Real-world hook: e-commerce order flow (reserve inventory > charge payment > ship) is a Saga",
  ],
  commonMistakes: [
    "Missing compensating actions — if step 3 fails, steps 1 and 2 must be explicitly undone",
    "Not handling partial failures — what if the compensation itself fails?",
    "Using Saga for operations that can be done in a single ACID transaction",
  ],
  relatedPatterns: [
    { patternId: "event-sourcing", relationship: "Events from Event Sourcing can drive Saga steps and compensations" },
    { patternId: "command", relationship: "Each Saga step is often modeled as a Command with an undo (compensation)" },
    { patternId: "chain-of-responsibility", relationship: "Saga steps form a chain, but with rollback capability that Chain of Responsibility lacks" },
    { patternId: "state", relationship: "Saga execution can be modeled as a state machine transitioning through step states" },
  ],
};

const chargePayment: SagaStep = {
  name: "Charge Payment",
  async execute(ctx) {
    // Simulate failure
    if (ctx.simulateFailure) throw new Error("Card declined");
    ctx.paymentCharged = true;
    console.log("  ✓ Payment charged");
  },
  async compensate(ctx) {
    ctx.paymentCharged = false;
    console.log("  ↩ Payment refunded");
  },
};

const confirmOrder: SagaStep = {
  name: "Confirm Order",
  async execute(ctx) {
    ctx.orderConfirmed = true;
    console.log("  ✓ Order confirmed");
  },
  async compensate(ctx) {
    ctx.orderConfirmed = false;
    console.log("  ↩ Order cancelled");
  },
};

// Usage — successful
const saga1 = new SagaOrchestrator([reserveInventory, chargePayment, confirmOrder]);
await saga1.execute({ orderId: "ord-1" });

// Usage — payment fails, triggers compensation
const saga2 = new SagaOrchestrator([reserveInventory, chargePayment, confirmOrder]);
await saga2.execute({ orderId: "ord-2", simulateFailure: true });
// Output: Reserve Inventory ✓, Charge Payment FAILS, Compensate Inventory ↩`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

# ── Saga Infrastructure ──────────────────────────
SagaContext = dict[str, Any]

class SagaStep(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    async def execute(self, context: SagaContext) -> None: ...

    @abstractmethod
    async def compensate(self, context: SagaContext) -> None: ...

@dataclass
class SagaResult:
    state: str
    context: SagaContext
    error: str | None = None

class SagaOrchestrator:
    def __init__(self, steps: list[SagaStep]):
        self._steps = steps
        self._completed: list[SagaStep] = []
        self._state = "pending"

    async def execute(self, initial_context: SagaContext | None = None) -> SagaResult:
        self._state = "running"
        context = dict(initial_context or {})

        for step in self._steps:
            try:
                print(f"[SAGA] Executing: {step.name}")
                await step.execute(context)
                self._completed.append(step)
            except Exception as e:
                print(f"[SAGA] Failed at: {step.name}")
                self._state = "compensating"
                await self._compensate(context)
                self._state = "failed"
                return SagaResult(self._state, context, str(e))

        self._state = "completed"
        return SagaResult(self._state, context)

    async def _compensate(self, context: SagaContext) -> None:
        for step in reversed(self._completed):
            try:
                print(f"[SAGA] Compensating: {step.name}")
                await step.compensate(context)
            except Exception as e:
                print(f"[SAGA] Compensation failed for: {step.name}")

# ── Concrete Steps ──────────────────────────────
class ReserveInventory(SagaStep):
    name = "Reserve Inventory"

    async def execute(self, ctx: SagaContext) -> None:
        ctx["inventory_reserved"] = True
        print("  OK Inventory reserved")

    async def compensate(self, ctx: SagaContext) -> None:
        ctx["inventory_reserved"] = False
        print("  UNDO Inventory released")

class ChargePayment(SagaStep):
    name = "Charge Payment"

    async def execute(self, ctx: SagaContext) -> None:
        if ctx.get("simulate_failure"):
            raise RuntimeError("Card declined")
        ctx["payment_charged"] = True
        print("  OK Payment charged")

    async def compensate(self, ctx: SagaContext) -> None:
        ctx["payment_charged"] = False
        print("  UNDO Payment refunded")

class ConfirmOrder(SagaStep):
    name = "Confirm Order"

    async def execute(self, ctx: SagaContext) -> None:
        ctx["order_confirmed"] = True
        print("  OK Order confirmed")

    async def compensate(self, ctx: SagaContext) -> None:
        ctx["order_confirmed"] = False
        print("  UNDO Order cancelled")

# Usage
import asyncio

async def main():
    steps = [ReserveInventory(), ChargePayment(), ConfirmOrder()]

    # Successful saga
    saga1 = SagaOrchestrator(steps)
    result1 = await saga1.execute({"order_id": "ord-1"})
    print(f"Result: {result1.state}")

    # Failed saga — payment fails, triggers compensation
    saga2 = SagaOrchestrator(steps)
    result2 = await saga2.execute({"order_id": "ord-2", "simulate_failure": True})
    print(f"Result: {result2.state}, Error: {result2.error}")

asyncio.run(main())`,
  },
  realWorldExamples: [
    "E-commerce checkout (reserve inventory -> charge card -> confirm order, with rollback)",
    "Travel booking (flight + hotel + car rental — if one fails, cancel the rest)",
    "Money transfer between banks (debit source account -> credit destination, reverse on failure)",
  ],
  whenToUse: [
    "A business transaction spans multiple microservices, each with its own database",
    "You need distributed transaction semantics without two-phase commit (2PC)",
    "Each step can be independently compensated (undone) if a later step fails",
    "Long-running business processes that can't hold locks across services",
  ],
  whenNotToUse: [
    "When a single database transaction is sufficient (don't distribute unnecessarily)",
    "When compensating actions are impossible or too complex to implement reliably",
    "When you need strict ACID consistency (sagas provide eventual consistency)",
    "When the number of steps is very large, making rollback chains fragile",
  ],
};

// ════════════════════════════════════════════════════════════
//  RESILIENCE PATTERNS
// ════════════════════════════════════════════════════════════

const circuitBreaker: DesignPattern = {
  id: "circuit-breaker",
  name: "Circuit Breaker",
  category: "resilience",
  description:
    "Your payment service calls a flaky third-party gateway. When it goes down, every request hangs for 30 seconds before timing out — and the cascade kills your entire checkout flow. The Circuit Breaker pattern wraps calls in a state machine that trips open after repeated failures, failing fast instead of wasting resources on doomed requests.",
  analogy: "Think of an electrical circuit breaker in your house. When too much current flows (faults), the breaker trips open and cuts the circuit instantly — protecting your wiring. After a cooldown, you manually flip it back to test if the problem is resolved.",
  difficulty: 3,
  tradeoffs: "You gain: fast failure during outages, protection against cascade failures, and automatic recovery testing. You pay: added complexity in configuration (thresholds, timeouts), and clients must handle the 'open' state gracefully.",
  summary: [
    "Circuit Breaker = state machine (CLOSED -> OPEN -> HALF_OPEN) that guards remote calls",
    "Key insight: fail fast when a downstream service is unhealthy, rather than waiting for timeouts",
    "Use when: calling unreliable external services that can cascade failures into your system",
  ],
  youAlreadyUseThis: [
    "Netflix Hystrix / resilience4j in Java microservices",
    "Polly library in .NET for transient fault handling",
    "AWS App Mesh circuit breaker configuration",
  ],
  predictionPrompts: [
    {
      question: "In which state does the circuit breaker allow a single probe request through?",
      answer: "HALF_OPEN — it lets one request through to test if the downstream service has recovered. If it succeeds, the breaker closes. If it fails, it trips open again.",
    },
  ],
  classes: [
    {
      id: "cb-state-enum",
      name: "CircuitBreakerState",
      stereotype: "enum",
      attributes: [
        { id: "cb-state-enum-attr-0", name: "CLOSED", type: "", visibility: "+" },
        { id: "cb-state-enum-attr-1", name: "OPEN", type: "", visibility: "+" },
        { id: "cb-state-enum-attr-2", name: "HALF_OPEN", type: "", visibility: "+" },
      ],
      methods: [],
      x: 50,
      y: 50,
    },
    {
      id: "cb-config",
      name: "CircuitBreakerConfig",
      stereotype: "class",
      attributes: [
        { id: "cb-config-attr-0", name: "failureThreshold", type: "number", visibility: "+" },
        { id: "cb-config-attr-1", name: "resetTimeoutMs", type: "number", visibility: "+" },
        { id: "cb-config-attr-2", name: "halfOpenMaxCalls", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 400,
      y: 50,
    },
    {
      id: "cb-class",
      name: "CircuitBreaker",
      stereotype: "class",
      attributes: [
        { id: "cb-class-attr-0", name: "state", type: "CircuitBreakerState", visibility: "-" },
        { id: "cb-class-attr-1", name: "failureCount", type: "number", visibility: "-" },
        { id: "cb-class-attr-2", name: "lastFailureTime", type: "number", visibility: "-" },
        { id: "cb-class-attr-3", name: "config", type: "CircuitBreakerConfig", visibility: "-" },
      ],
      methods: [
        { id: "cb-class-meth-0", name: "constructor", returnType: "void", params: ["config: CircuitBreakerConfig"], visibility: "+" },
        { id: "cb-class-meth-1", name: "call", returnType: "Promise<T>", params: ["fn: () => Promise<T>"], visibility: "+" },
        { id: "cb-class-meth-2", name: "onSuccess", returnType: "void", params: [], visibility: "-" },
        { id: "cb-class-meth-3", name: "onFailure", returnType: "void", params: [], visibility: "-" },
        { id: "cb-class-meth-4", name: "trip", returnType: "void", params: [], visibility: "-" },
        { id: "cb-class-meth-5", name: "getState", returnType: "CircuitBreakerState", params: [], visibility: "+" },
      ],
      x: 200,
      y: 250,
    },
  ],
  relationships: [
    { id: rid(), source: "cb-class", target: "cb-state-enum", type: "dependency", label: "uses" },
    { id: rid(), source: "cb-class", target: "cb-config", type: "aggregation", label: "configured by" },
  ],
  code: {
    typescript: `enum CircuitBreakerState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

class CircuitBreaker {
  private state = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new Error("Circuit breaker is OPEN — failing fast");
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitBreakerState.CLOSED;
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }
}

// Usage
const breaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 5000,
  halfOpenMaxCalls: 1,
});

async function callPaymentGateway() {
  return breaker.call(() => fetch("/api/payment").then((r) => r.json()));
}`,
    python: `from enum import Enum
import time
from typing import Callable, TypeVar

T = TypeVar("T")

class CircuitBreakerState(Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"

class CircuitBreakerConfig:
    def __init__(self, failure_threshold: int, reset_timeout_s: float, half_open_max_calls: int):
        self.failure_threshold = failure_threshold
        self.reset_timeout_s = reset_timeout_s
        self.half_open_max_calls = half_open_max_calls

class CircuitBreaker:
    def __init__(self, config: CircuitBreakerConfig):
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._last_failure_time = 0.0
        self._config = config

    def call(self, fn: Callable[[], T]) -> T:
        if self._state == CircuitBreakerState.OPEN:
            if time.time() - self._last_failure_time >= self._config.reset_timeout_s:
                self._state = CircuitBreakerState.HALF_OPEN
            else:
                raise RuntimeError("Circuit breaker is OPEN — failing fast")

        try:
            result = fn()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise

    def _on_success(self) -> None:
        self._failure_count = 0
        self._state = CircuitBreakerState.CLOSED

    def _on_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.time()
        if self._failure_count >= self._config.failure_threshold:
            self._state = CircuitBreakerState.OPEN

    @property
    def state(self) -> CircuitBreakerState:
        return self._state

# Usage
config = CircuitBreakerConfig(failure_threshold=3, reset_timeout_s=5.0, half_open_max_calls=1)
breaker = CircuitBreaker(config)

def call_payment():
    return breaker.call(lambda: {"status": "ok"})`,
  },
  realWorldExamples: [
    "API gateway protecting backend microservices from cascading failures",
    "Payment processing — fail fast when the payment provider is down",
    "Database connection wrapper that stops hammering an overloaded DB",
  ],
  whenToUse: [
    "Calling external services that may become temporarily unavailable",
    "Preventing cascade failures across microservice boundaries",
    "When you need automatic recovery testing after an outage",
    "Protecting shared resources from being overwhelmed by retries",
  ],
  whenNotToUse: [
    "For in-process method calls where failure is not transient",
    "When the downstream service has its own backpressure mechanism",
    "When failure is expected and handled inline (e.g., cache miss)",
  ],
  interviewTips: [
    "Name the 3 states: Closed (normal), Open (failing), Half-Open (testing recovery)",
    "Key insight: Circuit Breaker protects the CALLER, not the failing service",
    "Discuss threshold configuration: how many failures before opening? How long before half-open?",
  ],
  commonMistakes: [
    "Setting thresholds too aggressively — opening the circuit on a single transient failure",
    "Not providing a fallback response when the circuit is open",
    "Sharing one circuit breaker across unrelated services — each dependency needs its own",
  ],
  relatedPatterns: [
    { patternId: "retry", relationship: "Retry handles transient failures; Circuit Breaker prevents overloading when failures persist" },
    { patternId: "bulkhead", relationship: "Bulkhead isolates failures; Circuit Breaker stops cascading failures" },
    { patternId: "state", relationship: "Circuit Breaker uses the State pattern internally (Closed/Open/Half-Open states)" },
    { patternId: "proxy", relationship: "Circuit Breaker is implemented as a Proxy that intercepts calls to the real service" },
  ],
};

const bulkhead: DesignPattern = {
  id: "bulkhead",
  name: "Bulkhead",
  category: "resilience",
  description:
    "Your API server handles both critical checkout requests and low-priority analytics queries on the same thread pool. When analytics queries spike, they consume all threads and checkout starts failing. The Bulkhead pattern isolates different workloads into separate resource pools so that a failure in one partition cannot exhaust resources needed by another.",
  analogy: "Think of watertight compartments (bulkheads) in a ship. If one compartment floods, the bulkheads contain the damage — the rest of the ship stays afloat. Without them, a single breach sinks everything.",
  difficulty: 3,
  tradeoffs: "You gain: fault isolation between workloads and guaranteed resource availability for critical paths. You pay: lower overall resource utilization (reserved capacity may sit idle) and more complex configuration.",
  summary: [
    "Bulkhead = isolate workloads into separate resource pools",
    "Key insight: a failure in one partition cannot starve resources from another",
    "Use when: multiple workloads share infrastructure and have different criticality levels",
  ],
  youAlreadyUseThis: [
    "Docker/Kubernetes resource limits (CPU/memory per container)",
    "Database connection pool per service (not a shared global pool)",
    "Thread pool per API route group in Java servlet containers",
  ],
  predictionPrompts: [
    {
      question: "If the analytics partition exhausts all its semaphore permits, what happens to checkout requests?",
      answer: "Nothing — checkout has its own isolated partition with its own semaphore. It continues processing normally, unaffected by the analytics overload.",
    },
  ],
  classes: [
    {
      id: "bh-semaphore",
      name: "Semaphore",
      stereotype: "class",
      attributes: [
        { id: "bh-semaphore-attr-0", name: "permits", type: "number", visibility: "-" },
        { id: "bh-semaphore-attr-1", name: "maxPermits", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "bh-semaphore-meth-0", name: "acquire", returnType: "Promise<void>", params: [], visibility: "+" },
        { id: "bh-semaphore-meth-1", name: "release", returnType: "void", params: [], visibility: "+" },
        { id: "bh-semaphore-meth-2", name: "availablePermits", returnType: "number", params: [], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "bh-config",
      name: "BulkheadConfig",
      stereotype: "class",
      attributes: [
        { id: "bh-config-attr-0", name: "name", type: "string", visibility: "+" },
        { id: "bh-config-attr-1", name: "maxConcurrent", type: "number", visibility: "+" },
        { id: "bh-config-attr-2", name: "maxWaitMs", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 400,
      y: 50,
    },
    {
      id: "bh-partition",
      name: "Partition",
      stereotype: "class",
      attributes: [
        { id: "bh-partition-attr-0", name: "name", type: "string", visibility: "-" },
        { id: "bh-partition-attr-1", name: "semaphore", type: "Semaphore", visibility: "-" },
        { id: "bh-partition-attr-2", name: "activeCount", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "bh-partition-meth-0", name: "execute", returnType: "Promise<T>", params: ["fn: () => Promise<T>"], visibility: "+" },
        { id: "bh-partition-meth-1", name: "getActiveCount", returnType: "number", params: [], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "bh-class",
      name: "Bulkhead",
      stereotype: "class",
      attributes: [
        { id: "bh-class-attr-0", name: "partitions", type: "Map<string, Partition>", visibility: "-" },
      ],
      methods: [
        { id: "bh-class-meth-0", name: "createPartition", returnType: "Partition", params: ["config: BulkheadConfig"], visibility: "+" },
        { id: "bh-class-meth-1", name: "getPartition", returnType: "Partition", params: ["name: string"], visibility: "+" },
        { id: "bh-class-meth-2", name: "execute", returnType: "Promise<T>", params: ["partition: string", "fn: () => Promise<T>"], visibility: "+" },
      ],
      x: 200,
      y: 250,
    },
  ],
  relationships: [
    { id: rid(), source: "bh-class", target: "bh-partition", type: "composition", label: "manages" },
    { id: rid(), source: "bh-partition", target: "bh-semaphore", type: "composition", label: "uses" },
    { id: rid(), source: "bh-partition", target: "bh-config", type: "dependency", label: "configured by" },
  ],
  code: {
    typescript: `class Semaphore {
  private permits: number;

  constructor(private maxPermits: number) {
    this.permits = maxPermits;
  }

  async acquire(): Promise<void> {
    while (this.permits <= 0) {
      await new Promise((r) => setTimeout(r, 10));
    }
    this.permits--;
  }

  release(): void {
    this.permits = Math.min(this.permits + 1, this.maxPermits);
  }
}

interface BulkheadConfig {
  name: string;
  maxConcurrent: number;
}

class Partition {
  private semaphore: Semaphore;

  constructor(private name: string, config: BulkheadConfig) {
    this.semaphore = new Semaphore(config.maxConcurrent);
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.semaphore.acquire();
    try {
      return await fn();
    } finally {
      this.semaphore.release();
    }
  }
}

class Bulkhead {
  private partitions = new Map<string, Partition>();

  createPartition(config: BulkheadConfig): Partition {
    const partition = new Partition(config.name, config);
    this.partitions.set(config.name, partition);
    return partition;
  }

  async execute<T>(partitionName: string, fn: () => Promise<T>): Promise<T> {
    const partition = this.partitions.get(partitionName);
    if (!partition) throw new Error(\`Partition "\${partitionName}" not found\`);
    return partition.execute(fn);
  }
}

// Usage
const bulkhead = new Bulkhead();
bulkhead.createPartition({ name: "checkout", maxConcurrent: 20 });
bulkhead.createPartition({ name: "analytics", maxConcurrent: 5 });

// Checkout always has capacity, even if analytics is saturated
await bulkhead.execute("checkout", () => processPayment());
await bulkhead.execute("analytics", () => trackEvent());`,
    python: `import threading
from typing import Callable, TypeVar

T = TypeVar("T")

class Semaphore:
    def __init__(self, max_permits: int):
        self._semaphore = threading.Semaphore(max_permits)

    def acquire(self) -> None:
        self._semaphore.acquire()

    def release(self) -> None:
        self._semaphore.release()

class BulkheadConfig:
    def __init__(self, name: str, max_concurrent: int):
        self.name = name
        self.max_concurrent = max_concurrent

class Partition:
    def __init__(self, name: str, config: BulkheadConfig):
        self.name = name
        self._semaphore = Semaphore(config.max_concurrent)

    def execute(self, fn: Callable[[], T]) -> T:
        self._semaphore.acquire()
        try:
            return fn()
        finally:
            self._semaphore.release()

class Bulkhead:
    def __init__(self):
        self._partitions: dict[str, Partition] = {}

    def create_partition(self, config: BulkheadConfig) -> Partition:
        partition = Partition(config.name, config)
        self._partitions[config.name] = partition
        return partition

    def execute(self, partition_name: str, fn: Callable[[], T]) -> T:
        partition = self._partitions.get(partition_name)
        if partition is None:
            raise ValueError(f'Partition "{partition_name}" not found')
        return partition.execute(fn)

# Usage
bh = Bulkhead()
bh.create_partition(BulkheadConfig("checkout", max_concurrent=20))
bh.create_partition(BulkheadConfig("analytics", max_concurrent=5))

bh.execute("checkout", lambda: "payment processed")
bh.execute("analytics", lambda: "event tracked")`,
  },
  realWorldExamples: [
    "Separate thread pools for critical vs. non-critical API endpoints",
    "Kubernetes resource quotas per namespace (CPU/memory isolation)",
    "Database connection pools per service to prevent one service starving others",
  ],
  whenToUse: [
    "Multiple workloads share infrastructure with different criticality levels",
    "You need to guarantee resource availability for critical paths during load spikes",
    "A single slow consumer could exhaust shared resources (threads, connections)",
    "Isolating third-party service calls from core business logic",
  ],
  whenNotToUse: [
    "When workloads are uniform and equally important (overhead not justified)",
    "When the system has abundant resources and contention is unlikely",
    "When a single workload already has its own throttling mechanism",
  ],
  interviewTips: [
    "The ship analogy is the key: watertight compartments prevent one leak from sinking the ship",
    "Discuss implementation options: thread pools, connection pools, or process isolation",
    "Key question: how do you SIZE each bulkhead? Too small = throttling, too large = no isolation",
  ],
  commonMistakes: [
    "Making bulkhead pools too small — legitimate traffic gets rejected",
    "Not monitoring individual bulkhead utilization — failures go unnoticed until the pool is exhausted",
    "Applying bulkhead isolation between components that NEED to share resources",
  ],
  relatedPatterns: [
    { patternId: "circuit-breaker", relationship: "Circuit Breaker stops calling a failing service; Bulkhead limits the blast radius of failures" },
    { patternId: "thread-pool", relationship: "Thread Pool is the underlying mechanism used to implement Bulkhead isolation" },
    { patternId: "rate-limiter", relationship: "Rate Limiter controls throughput; Bulkhead controls isolation between consumers" },
  ],
};

const retry: DesignPattern = {
  id: "retry",
  name: "Retry",
  category: "resilience",
  description:
    "Your service sends an email via a third-party API, but occasionally the request fails due to a transient network blip. Instead of immediately surfacing the error to the user, the Retry pattern automatically re-attempts the operation using a configurable backoff strategy, turning transient failures into transparent recoveries.",
  analogy: "Think of redialing a phone number when you get a busy signal. You don't give up after one try — you wait a moment, then try again. If it's still busy, you wait a bit longer each time. Eventually you either connect or decide to try later.",
  difficulty: 2,
  tradeoffs: "You gain: transparent recovery from transient failures without user intervention. You pay: increased latency on failures (wait + retry), and risk of amplifying load on an already-struggling service if not combined with circuit breaker.",
  summary: [
    "Retry = automatically re-attempt failed operations with configurable backoff",
    "Key insight: many failures are transient — a second attempt often succeeds",
    "Use when: calling external services where transient errors (timeouts, 503s) are common",
  ],
  youAlreadyUseThis: [
    "AWS SDK automatic retries with exponential backoff",
    "fetch() retry wrappers in frontend code",
    "Message queue redelivery (RabbitMQ, SQS) on consumer failure",
  ],
  predictionPrompts: [
    {
      question: "Why is exponential backoff preferred over fixed-interval retries?",
      answer: "Exponential backoff spreads retry attempts over increasing intervals, reducing the thundering herd effect. Fixed intervals cause all clients to retry at the same time, amplifying load on the recovering service.",
    },
  ],
  classes: [
    {
      id: "retry-backoff",
      name: "BackoffStrategy",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "retry-backoff-meth-0", name: "nextDelay", returnType: "number", params: ["attempt: number"], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "retry-exponential",
      name: "ExponentialBackoff",
      stereotype: "class",
      attributes: [
        { id: "retry-exponential-attr-0", name: "baseMs", type: "number", visibility: "-" },
        { id: "retry-exponential-attr-1", name: "maxMs", type: "number", visibility: "-" },
        { id: "retry-exponential-attr-2", name: "jitter", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "retry-exponential-meth-0", name: "nextDelay", returnType: "number", params: ["attempt: number"], visibility: "+" },
      ],
      x: 50,
      y: 220,
    },
    {
      id: "retry-linear",
      name: "LinearBackoff",
      stereotype: "class",
      attributes: [
        { id: "retry-linear-attr-0", name: "delayMs", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "retry-linear-meth-0", name: "nextDelay", returnType: "number", params: ["attempt: number"], visibility: "+" },
      ],
      x: 350,
      y: 220,
    },
    {
      id: "retry-policy",
      name: "RetryPolicy",
      stereotype: "class",
      attributes: [
        { id: "retry-policy-attr-0", name: "maxAttempts", type: "number", visibility: "-" },
        { id: "retry-policy-attr-1", name: "backoff", type: "BackoffStrategy", visibility: "-" },
        { id: "retry-policy-attr-2", name: "retryableErrors", type: "Set<string>", visibility: "-" },
      ],
      methods: [
        { id: "retry-policy-meth-0", name: "execute", returnType: "Promise<T>", params: ["fn: () => Promise<T>"], visibility: "+" },
        { id: "retry-policy-meth-1", name: "shouldRetry", returnType: "boolean", params: ["error: Error", "attempt: number"], visibility: "-" },
      ],
      x: 200,
      y: 400,
    },
  ],
  relationships: [
    { id: rid(), source: "retry-exponential", target: "retry-backoff", type: "realization", label: "implements" },
    { id: rid(), source: "retry-linear", target: "retry-backoff", type: "realization", label: "implements" },
    { id: rid(), source: "retry-policy", target: "retry-backoff", type: "aggregation", label: "uses" },
  ],
  code: {
    typescript: `interface BackoffStrategy {
  nextDelay(attempt: number): number;
}

class ExponentialBackoff implements BackoffStrategy {
  constructor(
    private baseMs = 100,
    private maxMs = 10000,
    private jitter = true,
  ) {}

  nextDelay(attempt: number): number {
    const delay = Math.min(this.baseMs * 2 ** attempt, this.maxMs);
    return this.jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
  }
}

class LinearBackoff implements BackoffStrategy {
  constructor(private delayMs = 1000) {}

  nextDelay(_attempt: number): number {
    return this.delayMs;
  }
}

class RetryPolicy {
  constructor(
    private maxAttempts: number,
    private backoff: BackoffStrategy,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxAttempts - 1) {
          const delay = this.backoff.nextDelay(attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }
}

// Usage
const policy = new RetryPolicy(3, new ExponentialBackoff(200, 5000));

const result = await policy.execute(async () => {
  const res = await fetch("/api/send-email");
  if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
  return res.json();
});`,
    python: `import time
import random
from abc import ABC, abstractmethod
from typing import Callable, TypeVar

T = TypeVar("T")

class BackoffStrategy(ABC):
    @abstractmethod
    def next_delay(self, attempt: int) -> float:
        ...

class ExponentialBackoff(BackoffStrategy):
    def __init__(self, base_s: float = 0.1, max_s: float = 10.0, jitter: bool = True):
        self.base_s = base_s
        self.max_s = max_s
        self.jitter = jitter

    def next_delay(self, attempt: int) -> float:
        delay = min(self.base_s * (2 ** attempt), self.max_s)
        return delay * (0.5 + random.random() * 0.5) if self.jitter else delay

class LinearBackoff(BackoffStrategy):
    def __init__(self, delay_s: float = 1.0):
        self.delay_s = delay_s

    def next_delay(self, _attempt: int) -> float:
        return self.delay_s

class RetryPolicy:
    def __init__(self, max_attempts: int, backoff: BackoffStrategy):
        self._max_attempts = max_attempts
        self._backoff = backoff

    def execute(self, fn: Callable[[], T]) -> T:
        last_error: Exception | None = None

        for attempt in range(self._max_attempts):
            try:
                return fn()
            except Exception as e:
                last_error = e
                if attempt < self._max_attempts - 1:
                    time.sleep(self._backoff.next_delay(attempt))

        raise last_error  # type: ignore

# Usage
policy = RetryPolicy(3, ExponentialBackoff(0.2, 5.0))
result = policy.execute(lambda: "email sent")`,
  },
  realWorldExamples: [
    "AWS SDK retrying S3 uploads on transient 503 errors",
    "Email delivery services retrying with backoff on SMTP failures",
    "gRPC client retry policies for idempotent RPCs",
  ],
  whenToUse: [
    "Calling external services where transient failures (timeouts, 503s) are common",
    "The operation is idempotent (safe to repeat without side effects)",
    "You want transparent recovery without surfacing every blip to the user",
    "Combined with circuit breaker to prevent retry storms",
  ],
  whenNotToUse: [
    "The operation is not idempotent (e.g., non-deduped payment charge)",
    "The failure is permanent (e.g., 401 Unauthorized, 404 Not Found)",
    "When retrying would amplify load on an already-overloaded system (use circuit breaker first)",
  ],
  interviewTips: [
    "Always discuss exponential backoff with jitter — interviewers expect this",
    "Key question: which errors are retryable? (timeouts, 503s yes; 400s, 404s no)",
    "Mention idempotency: retries are only safe if the operation is idempotent",
  ],
  commonMistakes: [
    "Retrying non-idempotent operations — double-charging a credit card",
    "No backoff: rapid retries can DDoS the failing service (thundering herd)",
    "Infinite retries without a circuit breaker — the request hangs forever",
  ],
  relatedPatterns: [
    { patternId: "circuit-breaker", relationship: "Circuit Breaker stops retrying when failures persist beyond a threshold" },
    { patternId: "bulkhead", relationship: "Bulkhead limits how many retries can run concurrently for a given resource" },
    { patternId: "proxy", relationship: "Retry logic is often implemented as a Proxy wrapping the real service call" },
  ],
};

const rateLimiter: DesignPattern = {
  id: "rate-limiter",
  name: "Rate Limiter",
  category: "resilience",
  description:
    "Your public API gets hit by a bot that sends 10,000 requests per second, drowning legitimate users. You need to cap how many requests each client can make within a time window. The Rate Limiter pattern controls the rate of incoming requests using algorithms like token bucket or sliding window, protecting services from abuse and overload.",
  analogy: "Think of a highway toll booth. Cars can pass at a steady rate, but when too many arrive at once, they queue up. The toll booth controls flow — it doesn't speed up just because more cars arrive.",
  difficulty: 3,
  tradeoffs: "You gain: protection from abuse, predictable resource usage, and fair access for all clients. You pay: legitimate burst traffic may get throttled, and distributed rate limiting adds coordination complexity.",
  summary: [
    "Rate Limiter = control the rate of incoming requests to protect services",
    "Key insight: token bucket allows bursts up to capacity; sliding window gives smoother control",
    "Use when: public APIs need abuse protection or you need to enforce SLA rate limits",
  ],
  youAlreadyUseThis: [
    "API gateways (Kong, AWS API Gateway) with requests-per-second limits",
    "GitHub/Twitter API rate limit headers (X-RateLimit-*)",
    "Redis-based rate limiting in Express/Django middleware",
  ],
  predictionPrompts: [
    {
      question: "What is the difference between token bucket and sliding window rate limiting?",
      answer: "Token bucket allows short bursts up to the bucket capacity, then rate-limits to the refill rate. Sliding window counts requests in a moving time window, providing smoother but stricter limiting with no burst allowance.",
    },
  ],
  classes: [
    {
      id: "rl-interface",
      name: "RateLimiter",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "rl-interface-meth-0", name: "tryAcquire", returnType: "boolean", params: ["key: string"], visibility: "+" },
        { id: "rl-interface-meth-1", name: "getRemainingTokens", returnType: "number", params: ["key: string"], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "rl-config",
      name: "RateLimiterConfig",
      stereotype: "class",
      attributes: [
        { id: "rl-config-attr-0", name: "maxRequests", type: "number", visibility: "+" },
        { id: "rl-config-attr-1", name: "windowMs", type: "number", visibility: "+" },
        { id: "rl-config-attr-2", name: "burstCapacity", type: "number", visibility: "+" },
      ],
      methods: [],
      x: 450,
      y: 50,
    },
    {
      id: "rl-token-bucket",
      name: "TokenBucket",
      stereotype: "class",
      attributes: [
        { id: "rl-token-bucket-attr-0", name: "tokens", type: "number", visibility: "-" },
        { id: "rl-token-bucket-attr-1", name: "capacity", type: "number", visibility: "-" },
        { id: "rl-token-bucket-attr-2", name: "refillRate", type: "number", visibility: "-" },
        { id: "rl-token-bucket-attr-3", name: "lastRefillTime", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rl-token-bucket-meth-0", name: "tryAcquire", returnType: "boolean", params: ["key: string"], visibility: "+" },
        { id: "rl-token-bucket-meth-1", name: "refill", returnType: "void", params: [], visibility: "-" },
        { id: "rl-token-bucket-meth-2", name: "getRemainingTokens", returnType: "number", params: ["key: string"], visibility: "+" },
      ],
      x: 50,
      y: 250,
    },
    {
      id: "rl-sliding-window",
      name: "SlidingWindowLog",
      stereotype: "class",
      attributes: [
        { id: "rl-sliding-window-attr-0", name: "log", type: "Map<string, number[]>", visibility: "-" },
        { id: "rl-sliding-window-attr-1", name: "windowMs", type: "number", visibility: "-" },
        { id: "rl-sliding-window-attr-2", name: "maxRequests", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "rl-sliding-window-meth-0", name: "tryAcquire", returnType: "boolean", params: ["key: string"], visibility: "+" },
        { id: "rl-sliding-window-meth-1", name: "cleanup", returnType: "void", params: ["key: string"], visibility: "-" },
        { id: "rl-sliding-window-meth-2", name: "getRemainingTokens", returnType: "number", params: ["key: string"], visibility: "+" },
      ],
      x: 350,
      y: 250,
    },
  ],
  relationships: [
    { id: rid(), source: "rl-token-bucket", target: "rl-interface", type: "realization", label: "implements" },
    { id: rid(), source: "rl-sliding-window", target: "rl-interface", type: "realization", label: "implements" },
    { id: rid(), source: "rl-token-bucket", target: "rl-config", type: "dependency", label: "configured by" },
    { id: rid(), source: "rl-sliding-window", target: "rl-config", type: "dependency", label: "configured by" },
  ],
  code: {
    typescript: `interface RateLimiter {
  tryAcquire(key: string): boolean;
  getRemainingTokens(key: string): number;
}

interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

class TokenBucket implements RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();

  constructor(
    private capacity: number,
    private refillRatePerSec: number,
  ) {}

  tryAcquire(key: string): boolean {
    this.refill(key);
    const bucket = this.buckets.get(key)!;
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      return true;
    }
    return false;
  }

  getRemainingTokens(key: string): number {
    this.refill(key);
    return Math.floor(this.buckets.get(key)?.tokens ?? this.capacity);
  }

  private refill(key: string): void {
    const now = Date.now();
    if (!this.buckets.has(key)) {
      this.buckets.set(key, { tokens: this.capacity, lastRefill: now });
      return;
    }
    const bucket = this.buckets.get(key)!;
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRatePerSec);
    bucket.lastRefill = now;
  }
}

class SlidingWindowLog implements RateLimiter {
  private log = new Map<string, number[]>();

  constructor(
    private maxRequests: number,
    private windowMs: number,
  ) {}

  tryAcquire(key: string): boolean {
    this.cleanup(key);
    const timestamps = this.log.get(key) ?? [];
    if (timestamps.length >= this.maxRequests) return false;
    timestamps.push(Date.now());
    this.log.set(key, timestamps);
    return true;
  }

  getRemainingTokens(key: string): number {
    this.cleanup(key);
    return this.maxRequests - (this.log.get(key)?.length ?? 0);
  }

  private cleanup(key: string): void {
    const cutoff = Date.now() - this.windowMs;
    const timestamps = this.log.get(key) ?? [];
    this.log.set(key, timestamps.filter((t) => t > cutoff));
  }
}

// Usage
const limiter: RateLimiter = new TokenBucket(10, 2); // 10 burst, 2/sec refill
console.log(limiter.tryAcquire("user-123")); // true
console.log(limiter.getRemainingTokens("user-123")); // 9`,
    python: `import time
from abc import ABC, abstractmethod

class RateLimiter(ABC):
    @abstractmethod
    def try_acquire(self, key: str) -> bool: ...

    @abstractmethod
    def get_remaining_tokens(self, key: str) -> int: ...

class TokenBucket(RateLimiter):
    def __init__(self, capacity: int, refill_rate_per_sec: float):
        self._capacity = capacity
        self._refill_rate = refill_rate_per_sec
        self._buckets: dict[str, dict] = {}

    def try_acquire(self, key: str) -> bool:
        self._refill(key)
        bucket = self._buckets[key]
        if bucket["tokens"] >= 1:
            bucket["tokens"] -= 1
            return True
        return False

    def get_remaining_tokens(self, key: str) -> int:
        self._refill(key)
        return int(self._buckets.get(key, {}).get("tokens", self._capacity))

    def _refill(self, key: str) -> None:
        now = time.time()
        if key not in self._buckets:
            self._buckets[key] = {"tokens": float(self._capacity), "last_refill": now}
            return
        bucket = self._buckets[key]
        elapsed = now - bucket["last_refill"]
        bucket["tokens"] = min(self._capacity, bucket["tokens"] + elapsed * self._refill_rate)
        bucket["last_refill"] = now

class SlidingWindowLog(RateLimiter):
    def __init__(self, max_requests: int, window_s: float):
        self._max_requests = max_requests
        self._window_s = window_s
        self._log: dict[str, list[float]] = {}

    def try_acquire(self, key: str) -> bool:
        self._cleanup(key)
        timestamps = self._log.setdefault(key, [])
        if len(timestamps) >= self._max_requests:
            return False
        timestamps.append(time.time())
        return True

    def get_remaining_tokens(self, key: str) -> int:
        self._cleanup(key)
        return self._max_requests - len(self._log.get(key, []))

    def _cleanup(self, key: str) -> None:
        cutoff = time.time() - self._window_s
        if key in self._log:
            self._log[key] = [t for t in self._log[key] if t > cutoff]

# Usage
limiter: RateLimiter = TokenBucket(capacity=10, refill_rate_per_sec=2)
print(limiter.try_acquire("user-123"))       # True
print(limiter.get_remaining_tokens("user-123"))  # 9`,
  },
  realWorldExamples: [
    "API gateway enforcing per-client request limits (e.g., 100 req/min)",
    "Login endpoints rate-limiting to prevent brute-force attacks",
    "CDN edge nodes throttling requests to protect origin servers",
  ],
  whenToUse: [
    "Public APIs that need protection from abuse or DDoS",
    "Enforcing contractual SLA rate limits per API key",
    "Protecting shared resources from being overwhelmed by a single client",
    "Login/authentication endpoints to prevent brute-force attacks",
  ],
  whenNotToUse: [
    "Internal service-to-service calls with trusted, controlled traffic",
    "When backpressure via queues is more appropriate than rejection",
    "When the overhead of tracking per-key state outweighs the benefit",
  ],
  interviewTips: [
    "Know the 4 algorithms: fixed window, sliding window, token bucket, leaky bucket",
    "Key question: where do you apply rate limiting? (API gateway, per-user, per-endpoint)",
    "Discuss distributed rate limiting: how do you coordinate limits across multiple servers?",
  ],
  commonMistakes: [
    "Fixed window boundary spike: 100 req limit means 200 can hit at the window boundary",
    "Not returning proper 429 status with Retry-After header — clients can't back off gracefully",
    "Applying a global rate limit when per-user or per-endpoint limits are needed",
  ],
  relatedPatterns: [
    { patternId: "bulkhead", relationship: "Rate Limiter controls throughput; Bulkhead controls resource isolation" },
    { patternId: "circuit-breaker", relationship: "Rate Limiter prevents overload proactively; Circuit Breaker reacts to failures" },
    { patternId: "proxy", relationship: "Rate Limiter is typically implemented as a Proxy that intercepts incoming requests" },
    { patternId: "retry", relationship: "Clients should implement Retry with backoff when they receive rate limit responses" },
  ],
};

// ════════════════════════════════════════════════════════════
//  CONCURRENCY PATTERNS
// ════════════════════════════════════════════════════════════

const threadPool: DesignPattern = {
  id: "thread-pool",
  name: "Thread Pool",
  category: "concurrency",
  description:
    "Your web server creates a new thread for every incoming request. Under load, thousands of threads spawn, context-switching crushes performance, and the OS runs out of resources. The Thread Pool pattern pre-creates a fixed set of worker threads and dispatches tasks to them from a queue, amortizing thread creation cost and bounding concurrency.",
  analogy: "Think of a restaurant kitchen with a fixed number of chefs. Orders queue up on the ticket line. Each chef grabs the next ticket when free. You don't hire a new chef per order — that would be chaos. The fixed team handles variable demand efficiently.",
  difficulty: 3,
  tradeoffs: "You gain: bounded resource usage, amortized thread creation cost, and controlled concurrency. You pay: tasks may queue up during bursts, and pool sizing requires tuning (too small = underutilization, too large = thrashing).",
  summary: [
    "Thread Pool = fixed set of workers pulling tasks from a shared queue",
    "Key insight: reuse threads instead of creating/destroying per task to avoid OS overhead",
    "Use when: handling many short-lived tasks (HTTP requests, DB queries, I/O operations)",
  ],
  youAlreadyUseThis: [
    "Java's ExecutorService / ThreadPoolExecutor",
    "Node.js libuv thread pool (default 4 threads for fs/dns operations)",
    "Python's concurrent.futures.ThreadPoolExecutor",
  ],
  predictionPrompts: [
    {
      question: "What happens when all workers are busy and a new task is submitted?",
      answer: "The task is placed in the TaskQueue and waits. When a worker finishes its current task, it dequeues the next one. If the queue is bounded and full, the submit call may block or reject the task depending on the policy.",
    },
  ],
  classes: [
    {
      id: "tp-task",
      name: "Task",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "tp-task-meth-0", name: "execute", returnType: "Promise<void>", params: [], visibility: "+" },
        { id: "tp-task-meth-1", name: "getId", returnType: "string", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "tp-queue",
      name: "TaskQueue",
      stereotype: "class",
      attributes: [
        { id: "tp-queue-attr-0", name: "queue", type: "Task[]", visibility: "-" },
        { id: "tp-queue-attr-1", name: "maxSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "tp-queue-meth-0", name: "enqueue", returnType: "void", params: ["task: Task"], visibility: "+" },
        { id: "tp-queue-meth-1", name: "dequeue", returnType: "Task | undefined", params: [], visibility: "+" },
        { id: "tp-queue-meth-2", name: "size", returnType: "number", params: [], visibility: "+" },
        { id: "tp-queue-meth-3", name: "isEmpty", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 400,
      y: 220,
    },
    {
      id: "tp-worker",
      name: "Worker",
      stereotype: "class",
      attributes: [
        { id: "tp-worker-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "tp-worker-attr-1", name: "busy", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "tp-worker-meth-0", name: "run", returnType: "Promise<void>", params: ["task: Task"], visibility: "+" },
        { id: "tp-worker-meth-1", name: "isBusy", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 50,
      y: 220,
    },
    {
      id: "tp-pool",
      name: "ThreadPool",
      stereotype: "class",
      attributes: [
        { id: "tp-pool-attr-0", name: "workers", type: "Worker[]", visibility: "-" },
        { id: "tp-pool-attr-1", name: "taskQueue", type: "TaskQueue", visibility: "-" },
        { id: "tp-pool-attr-2", name: "poolSize", type: "number", visibility: "-" },
      ],
      methods: [
        { id: "tp-pool-meth-0", name: "constructor", returnType: "void", params: ["poolSize: number"], visibility: "+" },
        { id: "tp-pool-meth-1", name: "submit", returnType: "Promise<void>", params: ["task: Task"], visibility: "+" },
        { id: "tp-pool-meth-2", name: "shutdown", returnType: "Promise<void>", params: [], visibility: "+" },
        { id: "tp-pool-meth-3", name: "dispatch", returnType: "void", params: [], visibility: "-" },
      ],
      x: 200,
      y: 420,
    },
  ],
  relationships: [
    { id: rid(), source: "tp-pool", target: "tp-worker", type: "composition", label: "manages" },
    { id: rid(), source: "tp-pool", target: "tp-queue", type: "composition", label: "has" },
    { id: rid(), source: "tp-worker", target: "tp-task", type: "dependency", label: "executes" },
    { id: rid(), source: "tp-queue", target: "tp-task", type: "aggregation", label: "holds" },
  ],
  code: {
    typescript: `interface Task {
  id: string;
  execute(): Promise<void>;
}

class TaskQueue {
  private queue: Task[] = [];

  enqueue(task: Task): void {
    this.queue.push(task);
  }

  dequeue(): Task | undefined {
    return this.queue.shift();
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  get size(): number {
    return this.queue.length;
  }
}

class Worker {
  busy = false;

  constructor(public readonly id: string) {}

  async run(task: Task): Promise<void> {
    this.busy = true;
    try {
      await task.execute();
    } finally {
      this.busy = false;
    }
  }
}

class ThreadPool {
  private workers: Worker[];
  private taskQueue = new TaskQueue();

  constructor(poolSize: number) {
    this.workers = Array.from({ length: poolSize }, (_, i) => new Worker(\`worker-\${i}\`));
    this.processLoop();
  }

  submit(task: Task): void {
    this.taskQueue.enqueue(task);
  }

  private async processLoop(): Promise<void> {
    while (true) {
      if (this.taskQueue.isEmpty()) {
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }

      const worker = this.workers.find((w) => !w.busy);
      if (!worker) {
        await new Promise((r) => setTimeout(r, 10));
        continue;
      }

      const task = this.taskQueue.dequeue();
      if (task) {
        worker.run(task); // fire and forget — worker marks itself free
      }
    }
  }
}

// Usage
const pool = new ThreadPool(4);

pool.submit({
  id: "task-1",
  async execute() {
    console.log("Processing task 1");
    await new Promise((r) => setTimeout(r, 100));
  },
});`,
    python: `import threading
from abc import ABC, abstractmethod
from queue import Queue
from typing import Optional

class Task(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def get_id(self) -> str: ...

class TaskQueue:
    def __init__(self, max_size: int = 0):
        self._queue: Queue[Task] = Queue(maxsize=max_size)

    def enqueue(self, task: Task) -> None:
        self._queue.put(task)

    def dequeue(self, timeout: float = 1.0) -> Optional[Task]:
        try:
            return self._queue.get(timeout=timeout)
        except Exception:
            return None

    def is_empty(self) -> bool:
        return self._queue.empty()

class Worker(threading.Thread):
    def __init__(self, worker_id: str, task_queue: TaskQueue):
        super().__init__(daemon=True)
        self.worker_id = worker_id
        self._task_queue = task_queue
        self._running = True

    def run(self) -> None:
        while self._running:
            task = self._task_queue.dequeue()
            if task:
                try:
                    task.execute()
                except Exception as e:
                    print(f"Worker {self.worker_id} error: {e}")

    def stop(self) -> None:
        self._running = False

class ThreadPool:
    def __init__(self, pool_size: int):
        self._task_queue = TaskQueue()
        self._workers = [
            Worker(f"worker-{i}", self._task_queue)
            for i in range(pool_size)
        ]
        for w in self._workers:
            w.start()

    def submit(self, task: Task) -> None:
        self._task_queue.enqueue(task)

    def shutdown(self) -> None:
        for w in self._workers:
            w.stop()

# Usage
class PrintTask(Task):
    def __init__(self, task_id: str, message: str):
        self._id = task_id
        self._message = message

    def execute(self) -> None:
        print(f"[{self._id}] {self._message}")

    def get_id(self) -> str:
        return self._id

pool = ThreadPool(4)
pool.submit(PrintTask("task-1", "Hello from thread pool"))`,
  },
  realWorldExamples: [
    "Java Tomcat/Jetty server thread pools handling HTTP requests",
    "Database connection pools (HikariCP) reusing connections",
    "Node.js libuv thread pool for file system and DNS operations",
  ],
  whenToUse: [
    "Handling many short-lived tasks where thread creation overhead matters",
    "You need to bound concurrency to prevent resource exhaustion",
    "Web server request handling with predictable capacity planning",
    "Background job processing with controlled parallelism",
  ],
  whenNotToUse: [
    "For long-running tasks that would permanently occupy workers",
    "When async I/O (event loop) is more appropriate than threads",
    "When tasks require strict ordering (a pool processes in any order)",
  ],
  interviewTips: [
    "Discuss pool sizing: CPU-bound = num cores, I/O-bound = larger (waiting threads don't use CPU)",
    "Key question: what happens when all threads are busy? (queue, reject, or caller-runs)",
    "Mention work-stealing as an advanced variant for load balancing across threads",
  ],
  commonMistakes: [
    "Pool too small: tasks queue up and latency spikes; pool too large: context switching wastes CPU",
    "Submitting blocking I/O tasks to a compute thread pool — starves CPU-bound tasks",
    "Not handling task rejection when the queue is full — tasks silently disappear",
  ],
  relatedPatterns: [
    { patternId: "producer-consumer", relationship: "Thread Pool uses a Producer-Consumer queue internally to buffer work items" },
    { patternId: "bulkhead", relationship: "Thread Pools are the primary mechanism for implementing Bulkhead isolation" },
    { patternId: "command", relationship: "Tasks submitted to a Thread Pool are often Command objects with execute() methods" },
  ],
};

const producerConsumer: DesignPattern = {
  id: "producer-consumer",
  name: "Producer-Consumer",
  category: "concurrency",
  description:
    "Your web scraper generates URLs to crawl faster than they can be processed. Without coordination, the producer either overwhelms memory with unbounded queues or blocks when consumers are slow. The Producer-Consumer pattern decouples producers from consumers using a shared bounded buffer, allowing them to operate at independent speeds with backpressure.",
  analogy: "Think of a factory assembly line. Stations (producers) place items on a conveyor belt (buffer). Packers (consumers) pick items off the belt. If the belt is full, stations pause. If the belt is empty, packers wait. The belt decouples the speeds of both sides.",
  difficulty: 3,
  tradeoffs: "You gain: decoupled producer/consumer speeds, natural backpressure via bounded buffer, and easy scaling of either side. You pay: buffer sizing is critical (too small = throughput bottleneck, too large = memory pressure), and coordination adds latency.",
  summary: [
    "Producer-Consumer = shared bounded buffer decouples data production from consumption",
    "Key insight: producers and consumers run at independent rates — the buffer absorbs the difference",
    "Use when: data generation and processing have different speeds and need decoupling",
  ],
  youAlreadyUseThis: [
    "Message queues (RabbitMQ, Kafka, SQS) decoupling microservices",
    "Node.js Readable/Writable streams with backpressure",
    "Go channels (buffered channels are bounded producer-consumer queues)",
  ],
  predictionPrompts: [
    {
      question: "What happens when the SharedBuffer is full and a producer tries to add an item?",
      answer: "The producer blocks (waits) until a consumer removes an item, freeing space. This is the backpressure mechanism — it prevents the producer from overwhelming the system with unbounded data.",
    },
  ],
  classes: [
    {
      id: "pc-lock",
      name: "Lock",
      stereotype: "class",
      attributes: [
        { id: "pc-lock-attr-0", name: "locked", type: "boolean", visibility: "-" },
      ],
      methods: [
        { id: "pc-lock-meth-0", name: "acquire", returnType: "Promise<void>", params: [], visibility: "+" },
        { id: "pc-lock-meth-1", name: "release", returnType: "void", params: [], visibility: "+" },
      ],
      x: 400,
      y: 50,
    },
    {
      id: "pc-buffer",
      name: "SharedBuffer",
      stereotype: "class",
      attributes: [
        { id: "pc-buffer-attr-0", name: "buffer", type: "T[]", visibility: "-" },
        { id: "pc-buffer-attr-1", name: "capacity", type: "number", visibility: "-" },
        { id: "pc-buffer-attr-2", name: "lock", type: "Lock", visibility: "-" },
      ],
      methods: [
        { id: "pc-buffer-meth-0", name: "put", returnType: "Promise<void>", params: ["item: T"], visibility: "+" },
        { id: "pc-buffer-meth-1", name: "take", returnType: "Promise<T>", params: [], visibility: "+" },
        { id: "pc-buffer-meth-2", name: "isFull", returnType: "boolean", params: [], visibility: "+" },
        { id: "pc-buffer-meth-3", name: "isEmpty", returnType: "boolean", params: [], visibility: "+" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "pc-producer",
      name: "Producer",
      stereotype: "class",
      attributes: [
        { id: "pc-producer-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "pc-producer-attr-1", name: "buffer", type: "SharedBuffer<T>", visibility: "-" },
      ],
      methods: [
        { id: "pc-producer-meth-0", name: "produce", returnType: "Promise<void>", params: ["item: T"], visibility: "+" },
        { id: "pc-producer-meth-1", name: "run", returnType: "Promise<void>", params: [], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "pc-consumer",
      name: "Consumer",
      stereotype: "class",
      attributes: [
        { id: "pc-consumer-attr-0", name: "id", type: "string", visibility: "-" },
        { id: "pc-consumer-attr-1", name: "buffer", type: "SharedBuffer<T>", visibility: "-" },
      ],
      methods: [
        { id: "pc-consumer-meth-0", name: "consume", returnType: "Promise<T>", params: [], visibility: "+" },
        { id: "pc-consumer-meth-1", name: "run", returnType: "Promise<void>", params: [], visibility: "+" },
      ],
      x: 350,
      y: 280,
    },
  ],
  relationships: [
    { id: rid(), source: "pc-producer", target: "pc-buffer", type: "association", label: "writes to" },
    { id: rid(), source: "pc-consumer", target: "pc-buffer", type: "association", label: "reads from" },
    { id: rid(), source: "pc-buffer", target: "pc-lock", type: "composition", label: "synchronized by" },
  ],
  code: {
    typescript: `class SharedBuffer<T> {
  private buffer: T[] = [];
  private resolvers: Array<() => void> = [];

  constructor(private capacity: number) {}

  async put(item: T): Promise<void> {
    while (this.buffer.length >= this.capacity) {
      await new Promise<void>((r) => this.resolvers.push(r));
    }
    this.buffer.push(item);
    this.notify();
  }

  async take(): Promise<T> {
    while (this.buffer.length === 0) {
      await new Promise<void>((r) => this.resolvers.push(r));
    }
    const item = this.buffer.shift()!;
    this.notify();
    return item;
  }

  private notify(): void {
    const resolver = this.resolvers.shift();
    resolver?.();
  }

  get size(): number {
    return this.buffer.length;
  }
}

class Producer<T> {
  constructor(
    private id: string,
    private buffer: SharedBuffer<T>,
  ) {}

  async produce(item: T): Promise<void> {
    await this.buffer.put(item);
    console.log(\`[\${this.id}] Produced: \${item}\`);
  }
}

class Consumer<T> {
  constructor(
    private id: string,
    private buffer: SharedBuffer<T>,
  ) {}

  async consume(): Promise<T> {
    const item = await this.buffer.take();
    console.log(\`[\${this.id}] Consumed: \${item}\`);
    return item;
  }
}

// Usage
const buffer = new SharedBuffer<string>(5);
const producer = new Producer("p1", buffer);
const consumer = new Consumer("c1", buffer);

// Producer and consumer run concurrently
producer.produce("task-A");
consumer.consume();`,
    python: `import threading
from queue import Queue
from typing import TypeVar, Generic

T = TypeVar("T")

class SharedBuffer(Generic[T]):
    def __init__(self, capacity: int):
        self._queue: Queue[T] = Queue(maxsize=capacity)

    def put(self, item: T) -> None:
        self._queue.put(item)  # blocks if full

    def take(self) -> T:
        return self._queue.get()  # blocks if empty

    def is_full(self) -> bool:
        return self._queue.full()

    def is_empty(self) -> bool:
        return self._queue.empty()

class Producer:
    def __init__(self, producer_id: str, buffer: SharedBuffer):
        self.id = producer_id
        self._buffer = buffer

    def produce(self, item) -> None:
        self._buffer.put(item)
        print(f"[{self.id}] Produced: {item}")

    def run(self, items: list) -> None:
        for item in items:
            self.produce(item)

class Consumer:
    def __init__(self, consumer_id: str, buffer: SharedBuffer):
        self.id = consumer_id
        self._buffer = buffer

    def consume(self):
        item = self._buffer.take()
        print(f"[{self.id}] Consumed: {item}")
        return item

    def run(self, count: int) -> None:
        for _ in range(count):
            self.consume()

# Usage
buffer = SharedBuffer(capacity=5)
producer = Producer("p1", buffer)
consumer = Consumer("c1", buffer)

# Run in separate threads
t1 = threading.Thread(target=producer.run, args=(["A", "B", "C"],))
t2 = threading.Thread(target=consumer.run, args=(3,))
t1.start()
t2.start()
t1.join()
t2.join()`,
  },
  realWorldExamples: [
    "Message queues (Kafka, RabbitMQ) decoupling microservice communication",
    "Log aggregation — application threads produce logs, a writer thread consumes and flushes them",
    "Web scraper producing URLs, worker threads consuming and crawling them",
  ],
  whenToUse: [
    "Data production and consumption happen at different speeds",
    "You need to decouple producers from consumers for independent scaling",
    "Backpressure is needed to prevent memory exhaustion from unbounded queues",
    "Multiple producers and/or consumers share a common work queue",
  ],
  whenNotToUse: [
    "When synchronous request-response is required (no queuing latency acceptable)",
    "When there is only one producer and one consumer with matched speeds (overhead not justified)",
    "When ordering guarantees are complex and a simple queue isn't sufficient",
  ],
  interviewTips: [
    "Focus on the bounded buffer: what happens when the queue is full? When it's empty?",
    "Key insight: decouples production rate from consumption rate — handles bursts gracefully",
    "Discuss bounded vs unbounded queues: unbounded = memory risk, bounded = backpressure",
  ],
  commonMistakes: [
    "Unbounded queue: producer fills memory if consumer is slow — always use bounded queues",
    "Not handling poison pills or graceful shutdown — consumers hang waiting forever",
    "Single consumer bottleneck: if consumption is slow, add more consumers (but ensure thread safety)",
  ],
  relatedPatterns: [
    { patternId: "thread-pool", relationship: "Thread Pool uses Producer-Consumer internally for its task queue" },
    { patternId: "observer", relationship: "Observer broadcasts to all subscribers; Producer-Consumer delivers each item to exactly one consumer" },
    { patternId: "command", relationship: "Produced items are often Command objects queued for deferred execution" },
  ],
};

// ════════════════════════════════════════════════════════════
//  AI AGENT PATTERNS
// ════════════════════════════════════════════════════════════

const react: DesignPattern = {
  id: "react-pattern",
  name: "ReAct (Reason + Act)",
  category: "ai-agent",
  description:
    "Your LLM agent needs to solve a multi-step problem but can't get it right in a single prompt. It hallucinates facts or skips steps when asked to answer directly. The ReAct pattern interleaves reasoning (thinking about what to do) with acting (calling tools or APIs) and observing (processing results), creating a tight feedback loop that grounds the model in real data at every step.",
  analogy: "A detective investigating a case — think about clues, take action (interview witness), observe result, repeat until solved.",
  difficulty: 4,
  tradeoffs: "You gain: grounded, step-by-step reasoning with real-world feedback at each step, dramatically reducing hallucinations. You pay: higher latency and token cost from multiple LLM calls, plus the loop can get stuck in reasoning cycles without a max-iteration guard.",
  summary: [
    "ReAct = interleave Thought → Action → Observation in a loop until the answer is found",
    "Key insight: each observation grounds the next thought in reality, preventing hallucination drift",
    "Use when: the task requires multi-step reasoning with external data lookups or tool calls",
  ],
  youAlreadyUseThis: [
    "Claude's extended thinking (internal reasoning before responding)",
    "ChatGPT plugins (reason about user query, call plugin, incorporate result)",
    "Autonomous coding agents (read code → reason → edit file → run tests → repeat)",
  ],
  predictionPrompts: [
    {
      question: "What happens if the Agent never receives an Observation that satisfies the goal?",
      answer: "Without a max-iteration guard, the loop runs indefinitely. Production ReAct agents always include a step limit and a fallback response when the limit is reached.",
    },
  ],
  classes: [
    {
      id: "react-agent",
      name: "Agent",
      stereotype: "class",
      attributes: [
        { id: "react-agent-attr-0", name: "model", type: "LLM", visibility: "-" },
        { id: "react-agent-attr-1", name: "tools", type: "ToolRegistry", visibility: "-" },
        { id: "react-agent-attr-2", name: "maxSteps", type: "number", visibility: "-" },
        { id: "react-agent-attr-3", name: "history", type: "Thought[]", visibility: "-" },
      ],
      methods: [
        { id: "react-agent-meth-0", name: "run", returnType: "string", params: ["query: string"], visibility: "+" },
        { id: "react-agent-meth-1", name: "think", returnType: "Thought", params: ["context: string"], visibility: "-" },
        { id: "react-agent-meth-2", name: "act", returnType: "Observation", params: ["action: Action"], visibility: "-" },
      ],
      x: 200,
      y: 50,
    },
    {
      id: "react-thought",
      name: "Thought",
      stereotype: "class",
      attributes: [
        { id: "react-thought-attr-0", name: "reasoning", type: "string", visibility: "+" },
        { id: "react-thought-attr-1", name: "nextAction", type: "Action | null", visibility: "+" },
        { id: "react-thought-attr-2", name: "isFinal", type: "boolean", visibility: "+" },
      ],
      methods: [],
      x: 50,
      y: 280,
    },
    {
      id: "react-action",
      name: "Action",
      stereotype: "class",
      attributes: [
        { id: "react-action-attr-0", name: "toolName", type: "string", visibility: "+" },
        { id: "react-action-attr-1", name: "input", type: "Record<string, unknown>", visibility: "+" },
      ],
      methods: [],
      x: 250,
      y: 280,
    },
    {
      id: "react-observation",
      name: "Observation",
      stereotype: "class",
      attributes: [
        { id: "react-observation-attr-0", name: "result", type: "string", visibility: "+" },
        { id: "react-observation-attr-1", name: "success", type: "boolean", visibility: "+" },
      ],
      methods: [],
      x: 450,
      y: 280,
    },
    {
      id: "react-environment",
      name: "Environment",
      stereotype: "class",
      attributes: [
        { id: "react-environment-attr-0", name: "state", type: "Map<string, unknown>", visibility: "-" },
      ],
      methods: [
        { id: "react-environment-meth-0", name: "execute", returnType: "Observation", params: ["action: Action"], visibility: "+" },
        { id: "react-environment-meth-1", name: "getState", returnType: "Map<string, unknown>", params: [], visibility: "+" },
      ],
      x: 450,
      y: 50,
    },
    {
      id: "react-toolregistry",
      name: "ToolRegistry",
      stereotype: "class",
      attributes: [
        { id: "react-toolregistry-attr-0", name: "tools", type: "Map<string, Tool>", visibility: "-" },
      ],
      methods: [
        { id: "react-toolregistry-meth-0", name: "register", returnType: "void", params: ["tool: Tool"], visibility: "+" },
        { id: "react-toolregistry-meth-1", name: "get", returnType: "Tool", params: ["name: string"], visibility: "+" },
        { id: "react-toolregistry-meth-2", name: "list", returnType: "string[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
  ],
  relationships: [
    { id: rid(), source: "react-agent", target: "react-toolregistry", type: "composition", label: "uses" },
    { id: rid(), source: "react-agent", target: "react-thought", type: "association", label: "produces" },
    { id: rid(), source: "react-thought", target: "react-action", type: "association", label: "decides" },
    { id: rid(), source: "react-agent", target: "react-environment", type: "association", label: "acts in" },
    { id: rid(), source: "react-environment", target: "react-observation", type: "association", label: "returns" },
  ],
  code: {
    typescript: `interface Tool {
  name: string;
  description: string;
  execute(input: Record<string, unknown>): Promise<string>;
}

interface Thought {
  reasoning: string;
  action?: { tool: string; input: Record<string, unknown> };
  isFinal: boolean;
  finalAnswer?: string;
}

class Agent {
  private history: string[] = [];

  constructor(
    private tools: Map<string, Tool>,
    private maxSteps = 10,
  ) {}

  async run(query: string): Promise<string> {
    this.history = [\`User query: \${query}\`];

    for (let step = 0; step < this.maxSteps; step++) {
      // THINK — ask the LLM to reason about what to do next
      const thought = await this.think();

      if (thought.isFinal) {
        return thought.finalAnswer ?? "No answer produced.";
      }

      // ACT — execute the chosen tool
      if (thought.action) {
        const observation = await this.act(thought.action);
        // OBSERVE — feed the result back into history
        this.history.push(\`Observation: \${observation}\`);
      }
    }

    return "Reached max steps without a final answer.";
  }

  private async think(): Promise<Thought> {
    // In production, this calls an LLM with the full history
    // and asks it to output structured Thought JSON.
    const context = this.history.join("\\n");
    const thought = await callLLM(context); // placeholder
    this.history.push(\`Thought: \${thought.reasoning}\`);
    return thought;
  }

  private async act(action: { tool: string; input: Record<string, unknown> }): Promise<string> {
    const tool = this.tools.get(action.tool);
    if (!tool) return \`Error: tool "\${action.tool}" not found\`;
    return tool.execute(action.input);
  }
}

// Usage
const searchTool: Tool = {
  name: "web_search",
  description: "Search the web for information",
  async execute(input) {
    return \`Results for "\${input.query}": ...\`;
  },
  interviewTips: [
    "ReAct = Reason + Act loop — the LLM alternates between thinking and tool-calling",
    "Key insight: the 'thought' step makes the agent's reasoning transparent and debuggable",
    "Contrast with chain-of-thought: CoT just thinks, ReAct thinks AND acts",
  ],
  commonMistakes: [
    "Infinite loops: the agent keeps calling tools without converging on an answer",
    "Not including a stopping condition — the loop runs until max iterations or token limit",
    "Overloading the agent with too many tools — the LLM gets confused about which to use",
  ],
  relatedPatterns: [
    { patternId: "tool-use", relationship: "ReAct agents use the Tool Use pattern for their action steps" },
    { patternId: "multi-agent-orchestration", relationship: "ReAct is a single-agent pattern; Multi-Agent Orchestration coordinates multiple ReAct agents" },
    { patternId: "chain-of-responsibility", relationship: "ReAct's tool selection is similar to routing a request through a chain of potential handlers" },
    { patternId: "strategy", relationship: "Each tool in a ReAct agent is like a Strategy that the reasoning step selects" },
  ],
};

const agent = new Agent(new Map([["web_search", searchTool]]));
const answer = await agent.run("What is the population of Tokyo?");`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

class Tool(ABC):
    name: str
    description: str

    @abstractmethod
    def execute(self, **kwargs: Any) -> str: ...

@dataclass
class Thought:
    reasoning: str
    action: dict | None = None  # {"tool": str, "input": dict}
    is_final: bool = False
    final_answer: str | None = None

class Agent:
    def __init__(self, tools: dict[str, Tool], max_steps: int = 10):
        self._tools = tools
        self._max_steps = max_steps
        self._history: list[str] = []

    def run(self, query: str) -> str:
        self._history = [f"User query: {query}"]

        for _ in range(self._max_steps):
            # THINK
            thought = self._think()
            if thought.is_final:
                return thought.final_answer or "No answer produced."

            # ACT
            if thought.action:
                observation = self._act(thought.action)
                # OBSERVE
                self._history.append(f"Observation: {observation}")

        return "Reached max steps without a final answer."

    def _think(self) -> Thought:
        context = "\\n".join(self._history)
        thought = call_llm(context)  # placeholder
        self._history.append(f"Thought: {thought.reasoning}")
        return thought

    def _act(self, action: dict) -> str:
        tool = self._tools.get(action["tool"])
        if not tool:
            return f'Error: tool "{action["tool"]}" not found'
        return tool.execute(**action.get("input", {}))

# Usage
class WebSearchTool(Tool):
    name = "web_search"
    description = "Search the web for information"

    def execute(self, query: str = "", **kwargs: Any) -> str:
        return f'Results for "{query}": ...'

agent = Agent(tools={"web_search": WebSearchTool()})
answer = agent.run("What is the population of Tokyo?")`,
  },
  realWorldExamples: [
    "Claude's tool use — reasons about the query, calls tools, observes results, then synthesizes a final answer",
    "ChatGPT plugins — the model decides which plugin to call, processes the response, and iterates",
    "Autonomous coding agents (Cursor, Copilot Workspace) — read code, reason about changes, edit files, run tests, repeat",
  ],
  whenToUse: [
    "The task requires multi-step reasoning with external data lookups",
    "A single LLM call produces unreliable or hallucinated answers",
    "You need an audit trail of the agent's reasoning steps",
    "The problem space requires dynamic tool selection based on intermediate results",
  ],
  whenNotToUse: [
    "A single LLM call with good prompting is sufficient (unnecessary overhead)",
    "Latency is critical and multiple round-trips are unacceptable",
    "The task has no external tools or data sources to ground reasoning",
  ],
};

const multiAgentOrchestration: DesignPattern = {
  id: "multi-agent-orchestration",
  name: "Multi-Agent Orchestration",
  category: "ai-agent",
  description:
    "Your AI system needs to handle complex tasks that span multiple domains — research, coding, review, deployment — but a single monolithic agent becomes unreliable as complexity grows. The Multi-Agent Orchestration pattern decomposes the problem into specialist agents, each with focused expertise, coordinated by an orchestrator that routes tasks, manages shared memory, and synthesizes results.",
  analogy: "A film director coordinating actors — each specialist does their part, the director sequences the scenes and ensures continuity.",
  difficulty: 5,
  tradeoffs: "You gain: separation of concerns (each agent is simpler and more reliable), parallel execution of independent subtasks, and easy addition of new specialists. You pay: coordination overhead, potential context loss between agents, and debugging complexity when agents disagree or produce conflicting outputs.",
  summary: [
    "Multi-Agent = orchestrator decomposes tasks and delegates to specialist agents",
    "Key insight: narrower scope per agent yields higher reliability than one agent doing everything",
    "Use when: complex tasks span multiple domains and benefit from specialized reasoning",
  ],
  youAlreadyUseThis: [
    "AI coding assistants with separate planning, coding, and review agents",
    "Customer support triage — routing agent classifies, specialist agents handle billing/technical/returns",
    "CI/CD pipelines — separate agents for linting, testing, security scanning, deployment",
  ],
  predictionPrompts: [
    {
      question: "What happens if the ResearchAgent and CoderAgent produce conflicting information?",
      answer: "The Orchestrator must implement a conflict resolution strategy — typically the ReviewerAgent acts as an arbiter, or the Orchestrator re-runs the conflicting step with additional context from SharedMemory.",
    },
  ],
  classes: [
    {
      id: "mao-orchestrator",
      name: "Orchestrator",
      stereotype: "class",
      attributes: [
        { id: "mao-orchestrator-attr-0", name: "agents", type: "Map<string, SpecialistAgent>", visibility: "-" },
        { id: "mao-orchestrator-attr-1", name: "memory", type: "SharedMemory", visibility: "-" },
        { id: "mao-orchestrator-attr-2", name: "plan", type: "Task[]", visibility: "-" },
      ],
      methods: [
        { id: "mao-orchestrator-meth-0", name: "decompose", returnType: "Task[]", params: ["goal: string"], visibility: "+" },
        { id: "mao-orchestrator-meth-1", name: "dispatch", returnType: "Result", params: ["task: Task"], visibility: "+" },
        { id: "mao-orchestrator-meth-2", name: "synthesize", returnType: "string", params: ["results: Result[]"], visibility: "+" },
        { id: "mao-orchestrator-meth-3", name: "run", returnType: "string", params: ["goal: string"], visibility: "+" },
      ],
      x: 250,
      y: 50,
    },
    {
      id: "mao-specialist",
      name: "SpecialistAgent",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "mao-specialist-meth-0", name: "execute", returnType: "Result", params: ["task: Task", "memory: SharedMemory"], visibility: "+" },
        { id: "mao-specialist-meth-1", name: "canHandle", returnType: "boolean", params: ["task: Task"], visibility: "+" },
      ],
      x: 250,
      y: 250,
    },
    {
      id: "mao-research",
      name: "ResearchAgent",
      stereotype: "class",
      attributes: [
        { id: "mao-research-attr-0", name: "searchTool", type: "Tool", visibility: "-" },
      ],
      methods: [
        { id: "mao-research-meth-0", name: "execute", returnType: "Result", params: ["task: Task", "memory: SharedMemory"], visibility: "+" },
        { id: "mao-research-meth-1", name: "canHandle", returnType: "boolean", params: ["task: Task"], visibility: "+" },
      ],
      x: 50,
      y: 420,
    },
    {
      id: "mao-coder",
      name: "CoderAgent",
      stereotype: "class",
      attributes: [
        { id: "mao-coder-attr-0", name: "language", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "mao-coder-meth-0", name: "execute", returnType: "Result", params: ["task: Task", "memory: SharedMemory"], visibility: "+" },
        { id: "mao-coder-meth-1", name: "canHandle", returnType: "boolean", params: ["task: Task"], visibility: "+" },
      ],
      x: 250,
      y: 420,
    },
    {
      id: "mao-reviewer",
      name: "ReviewerAgent",
      stereotype: "class",
      attributes: [
        { id: "mao-reviewer-attr-0", name: "criteria", type: "string[]", visibility: "-" },
      ],
      methods: [
        { id: "mao-reviewer-meth-0", name: "execute", returnType: "Result", params: ["task: Task", "memory: SharedMemory"], visibility: "+" },
        { id: "mao-reviewer-meth-1", name: "canHandle", returnType: "boolean", params: ["task: Task"], visibility: "+" },
      ],
      x: 450,
      y: 420,
    },
    {
      id: "mao-memory",
      name: "SharedMemory",
      stereotype: "class",
      attributes: [
        { id: "mao-memory-attr-0", name: "store", type: "Map<string, unknown>", visibility: "-" },
        { id: "mao-memory-attr-1", name: "history", type: "Message[]", visibility: "-" },
      ],
      methods: [
        { id: "mao-memory-meth-0", name: "set", returnType: "void", params: ["key: string", "value: unknown"], visibility: "+" },
        { id: "mao-memory-meth-1", name: "get", returnType: "unknown", params: ["key: string"], visibility: "+" },
        { id: "mao-memory-meth-2", name: "addMessage", returnType: "void", params: ["msg: Message"], visibility: "+" },
        { id: "mao-memory-meth-3", name: "getHistory", returnType: "Message[]", params: [], visibility: "+" },
      ],
      x: 500,
      y: 50,
    },
  ],
  relationships: [
    { id: rid(), source: "mao-orchestrator", target: "mao-specialist", type: "association", label: "delegates to" },
    { id: rid(), source: "mao-orchestrator", target: "mao-memory", type: "composition", label: "owns" },
    { id: rid(), source: "mao-research", target: "mao-specialist", type: "realization" },
    { id: rid(), source: "mao-coder", target: "mao-specialist", type: "realization" },
    { id: rid(), source: "mao-reviewer", target: "mao-specialist", type: "realization" },
    { id: rid(), source: "mao-specialist", target: "mao-memory", type: "dependency", label: "reads/writes" },
  ],
  code: {
    typescript: `interface Task {
  id: string;
  type: "research" | "code" | "review";
  description: string;
  dependencies: string[];
}

interface Result {
  taskId: string;
  output: string;
  success: boolean;
}

class SharedMemory {
  private store = new Map<string, unknown>();

  set(key: string, value: unknown): void { this.store.set(key, value); }
  get(key: string): unknown { return this.store.get(key); }
  getAll(): Map<string, unknown> { return new Map(this.store); }
}

interface SpecialistAgent {
  canHandle(task: Task): boolean;
  execute(task: Task, memory: SharedMemory): Promise<Result>;
}

class ResearchAgent implements SpecialistAgent {
  canHandle(task: Task): boolean { return task.type === "research"; }

  async execute(task: Task, memory: SharedMemory): Promise<Result> {
    const findings = await webSearch(task.description); // placeholder
    memory.set(\`research-\${task.id}\`, findings);
    return { taskId: task.id, output: findings, success: true };
  }
}

class CoderAgent implements SpecialistAgent {
  canHandle(task: Task): boolean { return task.type === "code"; }

  async execute(task: Task, memory: SharedMemory): Promise<Result> {
    const context = memory.get("research-context") as string ?? "";
    const code = await generateCode(task.description, context); // placeholder
    memory.set(\`code-\${task.id}\`, code);
    return { taskId: task.id, output: code, success: true };
  }
}

class Orchestrator {
  private agents: SpecialistAgent[] = [];
  private memory = new SharedMemory();

  register(agent: SpecialistAgent): void { this.agents.push(agent); }

  async run(goal: string): Promise<string> {
    const tasks = await this.decompose(goal);
    const results: Result[] = [];

    for (const task of tasks) {
      const agent = this.agents.find((a) => a.canHandle(task));
      if (!agent) throw new Error(\`No agent for task type: \${task.type}\`);
      results.push(await agent.execute(task, this.memory));
    }

    return this.synthesize(results);
  }

  private async decompose(goal: string): Promise<Task[]> {
    // In production, an LLM decomposes the goal into tasks
    return [
      { id: "1", type: "research", description: goal, dependencies: [] },
      { id: "2", type: "code", description: goal, dependencies: ["1"] },
      { id: "3", type: "review", description: "Review the code", dependencies: ["2"] },
    ];
  }

  private synthesize(results: Result[]): string {
    return results.map((r) => r.output).join("\\n---\\n");
  }
}

// Usage
const orchestrator = new Orchestrator();
orchestrator.register(new ResearchAgent());
orchestrator.register(new CoderAgent());
const result = await orchestrator.run("Build a REST API for user management");`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

@dataclass
class Task:
    id: str
    type: str  # "research" | "code" | "review"
    description: str
    dependencies: list[str] = field(default_factory=list)

@dataclass
class Result:
    task_id: str
    output: str
    success: bool

class SharedMemory:
    def __init__(self) -> None:
        self._store: dict[str, Any] = {}

    def set(self, key: str, value: Any) -> None:
        self._store[key] = value

    def get(self, key: str) -> Any:
        return self._store.get(key)

class SpecialistAgent(ABC):
    @abstractmethod
    def can_handle(self, task: Task) -> bool: ...

    @abstractmethod
    def execute(self, task: Task, memory: SharedMemory) -> Result: ...

class ResearchAgent(SpecialistAgent):
    def can_handle(self, task: Task) -> bool:
        return task.type == "research"

    def execute(self, task: Task, memory: SharedMemory) -> Result:
        findings = web_search(task.description)  # placeholder
        memory.set(f"research-{task.id}", findings)
        return Result(task.id, findings, True)

class CoderAgent(SpecialistAgent):
    def can_handle(self, task: Task) -> bool:
        return task.type == "code"

    def execute(self, task: Task, memory: SharedMemory) -> Result:
        context = memory.get("research-context") or ""
        code = generate_code(task.description, context)  # placeholder
        memory.set(f"code-{task.id}", code)
        return Result(task.id, code, True)

class Orchestrator:
    def __init__(self) -> None:
        self._agents: list[SpecialistAgent] = []
        self._memory = SharedMemory()

    def register(self, agent: SpecialistAgent) -> None:
        self._agents.append(agent)

    def run(self, goal: str) -> str:
        tasks = self._decompose(goal)
        results: list[Result] = []

        for task in tasks:
            agent = next((a for a in self._agents if a.can_handle(task)), None)
            if not agent:
                raise ValueError(f"No agent for task type: {task.type}")
            results.append(agent.execute(task, self._memory))

        return self._synthesize(results)

    def _decompose(self, goal: str) -> list[Task]:
        return [
            Task("1", "research", goal),
            Task("2", "code", goal, ["1"]),
            Task("3", "review", "Review the code", ["2"]),
        ]

    def _synthesize(self, results: list[Result]) -> str:
        return "\\n---\\n".join(r.output for r in results)

# Usage
orchestrator = Orchestrator()
orchestrator.register(ResearchAgent())
orchestrator.register(CoderAgent())
result = orchestrator.run("Build a REST API for user management")`,
  },
  realWorldExamples: [
    "AI coding assistants with separate planning, coding, and review agents (Claude Code, Devin)",
    "Automated customer support triage — routing agent classifies tickets, specialist agents handle billing, technical, and returns",
    "Multi-agent research systems — one agent searches, another summarizes, a third fact-checks",
  ],
  whenToUse: [
    "The task spans multiple domains requiring different expertise",
    "A single monolithic agent becomes unreliable at complex multi-step tasks",
    "You want to parallelize independent subtasks for faster execution",
    "Different parts of the workflow need different tools or model configurations",
  ],
  whenNotToUse: [
    "The task is simple enough for a single agent with good prompting",
    "Low latency is critical and multi-agent coordination overhead is unacceptable",
    "The problem doesn't decompose cleanly into independent subtasks",
  ],
  interviewTips: [
    "Explain the orchestrator vs peer-to-peer topology and when each is appropriate",
    "Key insight: each agent should be a specialist with a narrow, well-defined role",
    "Discuss failure handling: what happens if one agent fails? Retry, skip, or escalate?",
  ],
  commonMistakes: [
    "Making agents too generalist — each agent should do one thing well",
    "No shared context protocol — agents can't understand each other's outputs",
    "Over-orchestrating: using multiple agents when a single ReAct agent would suffice",
  ],
  relatedPatterns: [
    { patternId: "react-pattern", relationship: "Individual agents in the orchestration are often ReAct agents" },
    { patternId: "mediator", relationship: "The orchestrator acts as a Mediator coordinating specialist agents" },
    { patternId: "chain-of-responsibility", relationship: "Agent pipelines pass work along a chain of specialist agents" },
    { patternId: "saga", relationship: "Multi-step agent workflows with rollback follow the Saga pattern" },
  ],
};

const toolUse: DesignPattern = {
  id: "tool-use",
  name: "Tool Use",
  category: "ai-agent",
  description:
    "Your LLM needs to perform actions beyond text generation — searching the web, querying databases, running calculations, or calling APIs. But LLMs can only produce text. The Tool Use pattern gives the agent a registry of typed tools with schemas, lets the model select and invoke the right tool for each subtask, and feeds the result back into the conversation for the next reasoning step.",
  analogy: "A handyman with a toolbox — looks at the problem, picks the right tool, uses it, checks the result.",
  difficulty: 3,
  tradeoffs: "You gain: LLMs can interact with the real world through well-defined interfaces, each tool is independently testable, and new capabilities are added without retraining. You pay: tool descriptions consume context window tokens, the model may pick the wrong tool or hallucinate tool arguments, and each tool call adds latency.",
  summary: [
    "Tool Use = agent selects from a registry of typed tools and invokes them by name",
    "Key insight: the tool schema (name, description, parameters) is the LLM's interface to the outside world",
    "Use when: the LLM needs to perform actions or access data beyond its training set",
  ],
  youAlreadyUseThis: [
    "Claude with MCP tools — the model reads tool schemas and decides which to call",
    "GPT function calling — tools are defined as JSON schemas, the model outputs structured calls",
    "LangChain/LlamaIndex tool abstractions — register tools, agent decides when to use them",
  ],
  predictionPrompts: [
    {
      question: "How does the Agent know WHICH tool to use for a given query?",
      answer: "The Agent sends all tool descriptions (name + schema + description) to the LLM as part of the prompt. The LLM reasons about which tool fits the current subtask based on the descriptions, then outputs a structured tool call.",
    },
  ],
  classes: [
    {
      id: "tu-agent",
      name: "Agent",
      stereotype: "class",
      attributes: [
        { id: "tu-agent-attr-0", name: "registry", type: "ToolRegistry", visibility: "-" },
        { id: "tu-agent-attr-1", name: "model", type: "LLM", visibility: "-" },
      ],
      methods: [
        { id: "tu-agent-meth-0", name: "run", returnType: "string", params: ["query: string"], visibility: "+" },
        { id: "tu-agent-meth-1", name: "selectTool", returnType: "Tool", params: ["query: string"], visibility: "-" },
        { id: "tu-agent-meth-2", name: "invokeTool", returnType: "ToolResult", params: ["tool: Tool", "input: unknown"], visibility: "-" },
      ],
      x: 250,
      y: 50,
    },
    {
      id: "tu-registry",
      name: "ToolRegistry",
      stereotype: "class",
      attributes: [
        { id: "tu-registry-attr-0", name: "tools", type: "Map<string, Tool>", visibility: "-" },
      ],
      methods: [
        { id: "tu-registry-meth-0", name: "register", returnType: "void", params: ["tool: Tool"], visibility: "+" },
        { id: "tu-registry-meth-1", name: "get", returnType: "Tool | undefined", params: ["name: string"], visibility: "+" },
        { id: "tu-registry-meth-2", name: "listSchemas", returnType: "ToolSchema[]", params: [], visibility: "+" },
      ],
      x: 50,
      y: 50,
    },
    {
      id: "tu-tool",
      name: "Tool",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "tu-tool-meth-0", name: "name", returnType: "string", params: [], visibility: "+" },
        { id: "tu-tool-meth-1", name: "description", returnType: "string", params: [], visibility: "+" },
        { id: "tu-tool-meth-2", name: "schema", returnType: "ToolSchema", params: [], visibility: "+" },
        { id: "tu-tool-meth-3", name: "execute", returnType: "ToolResult", params: ["input: unknown"], visibility: "+" },
      ],
      x: 50,
      y: 280,
    },
    {
      id: "tu-websearch",
      name: "WebSearchTool",
      stereotype: "class",
      attributes: [
        { id: "tu-websearch-attr-0", name: "apiKey", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "tu-websearch-meth-0", name: "execute", returnType: "ToolResult", params: ["input: { query: string }"], visibility: "+" },
      ],
      x: 50,
      y: 470,
    },
    {
      id: "tu-calculator",
      name: "CalculatorTool",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "tu-calculator-meth-0", name: "execute", returnType: "ToolResult", params: ["input: { expression: string }"], visibility: "+" },
      ],
      x: 250,
      y: 470,
    },
    {
      id: "tu-database",
      name: "DatabaseTool",
      stereotype: "class",
      attributes: [
        { id: "tu-database-attr-0", name: "connectionString", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "tu-database-meth-0", name: "execute", returnType: "ToolResult", params: ["input: { sql: string }"], visibility: "+" },
      ],
      x: 450,
      y: 470,
    },
    {
      id: "tu-toolresult",
      name: "ToolResult",
      stereotype: "class",
      attributes: [
        { id: "tu-toolresult-attr-0", name: "output", type: "string", visibility: "+" },
        { id: "tu-toolresult-attr-1", name: "success", type: "boolean", visibility: "+" },
        { id: "tu-toolresult-attr-2", name: "metadata", type: "Record<string, unknown>", visibility: "+" },
      ],
      methods: [],
      x: 450,
      y: 50,
    },
  ],
  relationships: [
    { id: rid(), source: "tu-agent", target: "tu-registry", type: "composition", label: "owns" },
    { id: rid(), source: "tu-registry", target: "tu-tool", type: "aggregation", label: "contains" },
    { id: rid(), source: "tu-websearch", target: "tu-tool", type: "realization" },
    { id: rid(), source: "tu-calculator", target: "tu-tool", type: "realization" },
    { id: rid(), source: "tu-database", target: "tu-tool", type: "realization" },
    { id: rid(), source: "tu-tool", target: "tu-toolresult", type: "association", label: "returns" },
  ],
  code: {
    typescript: `interface ToolSchema {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string }>;
}

interface ToolResult {
  output: string;
  success: boolean;
}

interface Tool {
  name: string;
  description: string;
  schema(): ToolSchema;
  execute(input: unknown): Promise<ToolResult>;
}

class ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  listSchemas(): ToolSchema[] {
    return [...this.tools.values()].map((t) => t.schema());
  }
}

class WebSearchTool implements Tool {
  name = "web_search";
  description = "Search the web for current information";

  schema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: { query: { type: "string", description: "Search query" } },
    };
  }

  async execute(input: { query: string }): Promise<ToolResult> {
    const results = await fetch(\`https://api.search.com?q=\${input.query}\`);
    return { output: await results.text(), success: true };
  }
}

class CalculatorTool implements Tool {
  name = "calculator";
  description = "Evaluate a mathematical expression";

  schema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      parameters: { expression: { type: "string", description: "Math expression" } },
    };
  }

  async execute(input: { expression: string }): Promise<ToolResult> {
    try {
      // NOTE: In production, use a safe math parser (e.g., mathjs)
      const result = safeEvaluate(input.expression);
      return { output: String(result), success: true };
    } catch (e) {
      return { output: \`Error: \${e}\`, success: false };
    }
  }
}

// Usage
const registry = new ToolRegistry();
registry.register(new WebSearchTool());
registry.register(new CalculatorTool());

// Agent sends registry.listSchemas() to the LLM
// LLM responds with: { tool: "calculator", input: { expression: "2+2" } }
const tool = registry.get("calculator")!;
const result = await tool.execute({ expression: "2 + 2" });
console.log(result); // { output: "4", success: true }`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any
import ast
import operator

@dataclass
class ToolSchema:
    name: str
    description: str
    parameters: dict[str, dict[str, str]]

@dataclass
class ToolResult:
    output: str
    success: bool

class Tool(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @abstractmethod
    def schema(self) -> ToolSchema: ...

    @abstractmethod
    def execute(self, **kwargs: Any) -> ToolResult: ...

class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(self, tool: Tool) -> None:
        self._tools[tool.name] = tool

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def list_schemas(self) -> list[ToolSchema]:
        return [t.schema() for t in self._tools.values()]

class WebSearchTool(Tool):
    name = "web_search"
    description = "Search the web for current information"

    def schema(self) -> ToolSchema:
        return ToolSchema(
            name=self.name,
            description=self.description,
            parameters={"query": {"type": "string", "description": "Search query"}},
        )

    def execute(self, query: str = "", **kwargs: Any) -> ToolResult:
        # In production, call a real search API
        return ToolResult(output=f'Results for "{query}": ...', success=True)

class CalculatorTool(Tool):
    name = "calculator"
    description = "Evaluate a mathematical expression"

    def schema(self) -> ToolSchema:
        return ToolSchema(
            name=self.name,
            description=self.description,
            parameters={"expression": {"type": "string", "description": "Math expression"}},
        )

    def execute(self, expression: str = "", **kwargs: Any) -> ToolResult:
        try:
            # Safe evaluation using ast.literal_eval for simple expressions
            tree = ast.parse(expression, mode="eval")
            result = _safe_eval(tree.body)
            return ToolResult(output=str(result), success=True)
        except Exception as e:
            return ToolResult(output=f"Error: {e}", success=False)

def _safe_eval(node: ast.expr) -> float:
    """Safely evaluate a math expression AST node."""
    ops = {ast.Add: operator.add, ast.Sub: operator.sub,
           ast.Mult: operator.mul, ast.Div: operator.truediv}
    if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
        return float(node.value)
    if isinstance(node, ast.BinOp) and type(node.op) in ops:
        return ops[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    raise ValueError(f"Unsupported expression node: {type(node).__name__}")

# Usage
registry = ToolRegistry()
registry.register(WebSearchTool())
registry.register(CalculatorTool())

# Agent sends registry.list_schemas() to the LLM
# LLM responds with: {"tool": "calculator", "input": {"expression": "2+2"}}
tool = registry.get("calculator")
result = tool.execute(expression="2 + 2")
print(result)  # ToolResult(output='4.0', success=True)`,
  },
  realWorldExamples: [
    "Claude with MCP tools — reads tool schemas, decides which tool to call, processes the result",
    "GPT function calling — tools defined as JSON schemas, model outputs structured function calls",
    "LangChain tool abstraction — register tools with descriptions, agent decides when to use them",
  ],
  whenToUse: [
    "The LLM needs to interact with external systems (APIs, databases, files)",
    "You want to extend LLM capabilities without retraining the model",
    "Each capability is independently testable and deployable",
    "The set of available tools may change at runtime (dynamic tool registration)",
  ],
  whenNotToUse: [
    "The LLM can answer the question from its training data alone (no external data needed)",
    "Security constraints prevent the LLM from invoking external tools",
    "The task requires only text generation with no side effects",
  ],
  interviewTips: [
    "Explain the 3-step loop: schema exposure > LLM tool call > result injection",
    "Key insight: tools extend LLM capabilities without retraining — the model learns from the schema",
    "Discuss security: the LLM decides WHAT to call, but your code controls WHICH tools are available",
  ],
  commonMistakes: [
    "Poor tool descriptions — the LLM can't choose the right tool if descriptions are vague",
    "Not validating tool inputs — the LLM may generate malformed or malicious arguments",
    "Too many tools: more than 10-15 tools degrades the LLM's selection accuracy",
  ],
  relatedPatterns: [
    { patternId: "react-pattern", relationship: "ReAct agents use Tool Use for their action phase" },
    { patternId: "strategy", relationship: "Each tool is like a Strategy that the LLM selects based on the task" },
    { patternId: "adapter", relationship: "Tools often act as Adapters between the LLM's interface and external APIs" },
    { patternId: "command", relationship: "Each tool invocation is essentially a Command object with parameters" },
  ],
};

// ════════════════════════════════════════════════════════════
//  FLYWEIGHT PATTERN (GoF #22)
// ════════════════════════════════════════════════════════════

const flyweight: DesignPattern = {
  id: "flyweight",
  name: "Flyweight",
  category: "structural",
  description:
    "You're building a text editor that renders 100,000 characters on screen. Each character has a font, size, and color — but most characters share the same formatting. Creating a unique object for each character wastes massive amounts of memory. The Flyweight pattern uses sharing to support large numbers of fine-grained objects efficiently by separating intrinsic (shared) state from extrinsic (unique) state.",
  analogy: "A forest of identical trees — instead of creating 10,000 tree objects, share one tree model and vary only the position",
  difficulty: 4,
  tradeoffs: "You gain: dramatic memory savings when many objects share common state. You pay: added complexity in splitting intrinsic/extrinsic state — and trading RAM for CPU since extrinsic state must be computed or passed in each time.",
  summary: [
    "Flyweight = share common state across many objects to save memory",
    "Key insight: separate intrinsic (shared, immutable) from extrinsic (unique, context-dependent) state",
    "Use when: thousands of similar objects exist and most of their state is duplicated",
  ],
  youAlreadyUseThis: [
    "String interning in Java/Python (identical strings share memory)",
    "Browser CSS computed styles (shared style objects across DOM nodes)",
    "Game engines reusing mesh/texture data across instances",
    "React.memo() and key-based reconciliation (reuse virtual DOM nodes)",
  ],
  predictionPrompts: [
    {
      question: "In a text editor with 100,000 characters using 10 different fonts, how many Flyweight objects do you need?",
      answer: "Only 10 — one per unique font. Each character stores only its position (extrinsic state) and references the shared font flyweight (intrinsic state).",
    },
  ],
  classes: [
    {
      id: "fw-flyweight",
      name: "Flyweight",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "fw-flyweight-meth-0", name: "operation", returnType: "void", params: ["extrinsicState: string"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "fw-concrete",
      name: "ConcreteFlyweight",
      stereotype: "class",
      attributes: [
        { id: "fw-concrete-attr-0", name: "intrinsicState", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fw-concrete-meth-0", name: "operation", returnType: "void", params: ["extrinsicState: string"], visibility: "+" },
      ],
      x: 150,
      y: 250,
    },
    {
      id: "fw-unshared",
      name: "UnsharedConcreteFlyweight",
      stereotype: "class",
      attributes: [
        { id: "fw-unshared-attr-0", name: "allState", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "fw-unshared-meth-0", name: "operation", returnType: "void", params: ["extrinsicState: string"], visibility: "+" },
      ],
      x: 450,
      y: 250,
    },
    {
      id: "fw-factory",
      name: "FlyweightFactory",
      stereotype: "class",
      attributes: [
        { id: "fw-factory-attr-0", name: "flyweights", type: "Map<string, Flyweight>", visibility: "-" },
      ],
      methods: [
        { id: "fw-factory-meth-0", name: "getFlyweight", returnType: "Flyweight", params: ["key: string"], visibility: "+" },
        { id: "fw-factory-meth-1", name: "listFlyweights", returnType: "string[]", params: [], visibility: "+" },
      ],
      x: 300,
      y: 430,
    },
    {
      id: "fw-client",
      name: "Client",
      stereotype: "class",
      attributes: [],
      methods: [
        { id: "fw-client-meth-0", name: "render", returnType: "void", params: ["factory: FlyweightFactory"], visibility: "+" },
      ],
      x: 300,
      y: -100,
    },
  ],
  relationships: [
    { id: rid(), source: "fw-concrete", target: "fw-flyweight", type: "realization" },
    { id: rid(), source: "fw-unshared", target: "fw-flyweight", type: "realization" },
    { id: rid(), source: "fw-factory", target: "fw-flyweight", type: "aggregation", label: "manages" },
    { id: rid(), source: "fw-client", target: "fw-factory", type: "dependency", label: "uses" },
  ],
  code: {
    typescript: `// Flyweight interface — shared objects that accept extrinsic state
interface CharFlyweight {
  // Intrinsic state (font family, weight, style) is stored inside.
  // Extrinsic state (position, character) is passed in at render time.
  render(char: string, row: number, col: number): string;
}

// ConcreteFlyweight — stores intrinsic (shared) state only
class FontFlyweight implements CharFlyweight {
  // Intrinsic state: shared across all characters using this font
  constructor(
    private readonly fontFamily: string,
    private readonly fontSize: number,
    private readonly color: string
  ) {}

  render(char: string, row: number, col: number): string {
    // Extrinsic state (char, row, col) comes from the caller — not stored here.
    // This is the key insight: we DON'T store position/character in the flyweight.
    return \`[\${char}] at (\${row},\${col}) in \${this.fontFamily} \${this.fontSize}px \${this.color}\`;
  }

  getKey(): string {
    return \`\${this.fontFamily}-\${this.fontSize}-\${this.color}\`;
  }
}

// UnsharedConcreteFlyweight — does NOT share state (e.g., a special character)
class SpecialCharFlyweight implements CharFlyweight {
  constructor(
    private readonly fontFamily: string,
    private readonly fontSize: number,
    private readonly color: string,
    private readonly decoration: string // unique per instance — not shared
  ) {}

  render(char: string, row: number, col: number): string {
    return \`[\${char}] at (\${row},\${col}) \${this.fontFamily} \${this.fontSize}px \${this.color} {\${this.decoration}}\`;
  }
}

// FlyweightFactory — creates and manages shared flyweight instances
class FlyweightFactory {
  private flyweights = new Map<string, FontFlyweight>();

  getFlyweight(fontFamily: string, fontSize: number, color: string): CharFlyweight {
    const key = \`\${fontFamily}-\${fontSize}-\${color}\`;
    if (!this.flyweights.has(key)) {
      // Only create a new flyweight when this combination hasn't been seen
      this.flyweights.set(key, new FontFlyweight(fontFamily, fontSize, color));
      console.log(\`FlyweightFactory: created new flyweight for "\${key}"\`);
    }
    return this.flyweights.get(key)!;
  }

  get count(): number {
    return this.flyweights.size;
  }
}

// Client — uses extrinsic state + shared flyweights
interface CharacterData {
  char: string;
  row: number;
  col: number;
  fontFamily: string;
  fontSize: number;
  color: string;
}

function renderDocument(chars: CharacterData[], factory: FlyweightFactory): void {
  for (const c of chars) {
    const flyweight = factory.getFlyweight(c.fontFamily, c.fontSize, c.color);
    console.log(flyweight.render(c.char, c.row, c.col));
  }
}

// Usage
const factory = new FlyweightFactory();

const document: CharacterData[] = [
  { char: "H", row: 0, col: 0, fontFamily: "Arial", fontSize: 12, color: "black" },
  { char: "e", row: 0, col: 1, fontFamily: "Arial", fontSize: 12, color: "black" },
  { char: "l", row: 0, col: 2, fontFamily: "Arial", fontSize: 12, color: "black" },
  { char: "l", row: 0, col: 3, fontFamily: "Arial", fontSize: 12, color: "black" },
  { char: "o", row: 0, col: 4, fontFamily: "Arial", fontSize: 12, color: "black" },
  { char: "!", row: 0, col: 5, fontFamily: "Arial", fontSize: 24, color: "red" },
];

renderDocument(document, factory);
// Despite 6 characters, only 2 flyweights are created:
// Arial-12-black (shared by H, e, l, l, o)
// Arial-24-red (used by !)
console.log(\`Total flyweights: \${factory.count}\`); // 2`,
    python: `from dataclasses import dataclass
from typing import Protocol


class CharFlyweight(Protocol):
    """Flyweight interface: shared objects accept extrinsic state."""
    def render(self, char: str, row: int, col: int) -> str: ...


@dataclass(frozen=True)
class FontFlyweight:
    """ConcreteFlyweight: stores intrinsic (shared) state only."""
    font_family: str
    font_size: int
    color: str

    def render(self, char: str, row: int, col: int) -> str:
        # Extrinsic state (char, row, col) is passed in -- not stored
        return (
            f"[{char}] at ({row},{col}) "
            f"in {self.font_family} {self.font_size}px {self.color}"
        )

    @property
    def key(self) -> str:
        return f"{self.font_family}-{self.font_size}-{self.color}"


@dataclass
class SpecialCharFlyweight:
    """UnsharedConcreteFlyweight: unique per instance, not shared."""
    font_family: str
    font_size: int
    color: str
    decoration: str  # unique -- not shared

    def render(self, char: str, row: int, col: int) -> str:
        return (
            f"[{char}] at ({row},{col}) "
            f"{self.font_family} {self.font_size}px {self.color} "
            f"{{{self.decoration}}}"
        )


class FlyweightFactory:
    """Creates and manages shared flyweight instances."""

    def __init__(self) -> None:
        self._flyweights: dict[str, FontFlyweight] = {}

    def get_flyweight(
        self, font_family: str, font_size: int, color: str
    ) -> CharFlyweight:
        key = f"{font_family}-{font_size}-{color}"
        if key not in self._flyweights:
            self._flyweights[key] = FontFlyweight(font_family, font_size, color)
            print(f'FlyweightFactory: created new flyweight for "{key}"')
        return self._flyweights[key]

    @property
    def count(self) -> int:
        return len(self._flyweights)


@dataclass
class CharacterData:
    char: str
    row: int
    col: int
    font_family: str
    font_size: int
    color: str


def render_document(
    chars: list[CharacterData], factory: FlyweightFactory
) -> None:
    for c in chars:
        fw = factory.get_flyweight(c.font_family, c.font_size, c.color)
        print(fw.render(c.char, c.row, c.col))


# Usage
factory = FlyweightFactory()
doc = [
    CharacterData("H", 0, 0, "Arial", 12, "black"),
    CharacterData("e", 0, 1, "Arial", 12, "black"),
    CharacterData("l", 0, 2, "Arial", 12, "black"),
    CharacterData("l", 0, 3, "Arial", 12, "black"),
    CharacterData("o", 0, 4, "Arial", 12, "black"),
    CharacterData("!", 0, 5, "Arial", 24, "red"),
]
render_document(doc, factory)
# Only 2 flyweights created despite 6 characters
print(f"Total flyweights: {factory.count}")  # 2`,
  },
  realWorldExamples: [
    "Text editor shared font objects — thousands of characters, few distinct font styles",
    "Game engines sharing tree/mesh models — one model rendered at thousands of positions",
    "Browser DOM shared CSS computed styles — many elements, few unique style combinations",
  ],
  whenToUse: [
    "An application creates a huge number of objects that consume significant memory",
    "Most object state can be made extrinsic (moved outside the object)",
    "Many groups of objects can be replaced by relatively few shared objects",
    "The application doesn't depend on object identity (flyweights are interchangeable)",
  ],
  whenNotToUse: [
    "When objects have little shared state — the overhead of the factory exceeds savings",
    "When object identity matters (each object must be distinct)",
    "When extrinsic state is expensive to compute or pass around",
  ],
  interviewTips: [
    "Classic memory optimization question — mention intrinsic vs extrinsic state separation",
    "Key insight: Flyweight is about sharing, not caching. The factory ensures identity-based reuse.",
    "Real-world example: Java's Integer.valueOf() caches -128 to 127 — that's Flyweight for boxed ints",
  ],
  commonMistakes: [
    "Storing extrinsic state inside the flyweight — defeats the purpose of sharing",
    "Making flyweights mutable — shared mutable state leads to bugs across all references",
    "Confusing Flyweight with object pooling — pools reuse exclusive instances, flyweights share concurrent ones",
  ],
  confusedWith: [
    { patternId: "singleton", difference: "Singleton ensures ONE instance globally. Flyweight shares MANY instances keyed by intrinsic state." },
  ],
  relatedPatterns: [
    { patternId: "factory-method", relationship: "FlyweightFactory uses a factory method internally to create/retrieve shared instances" },
    { patternId: "singleton", relationship: "A FlyweightFactory is often a Singleton — you only need one factory" },
    { patternId: "composite", relationship: "Composite leaf nodes are often implemented as Flyweights to save memory in large trees" },
    { patternId: "state", relationship: "State objects with no instance variables can be shared as Flyweights" },
  ],
};

// ════════════════════════════════════════════════════════════
//  INTERPRETER PATTERN (GoF #23)
// ════════════════════════════════════════════════════════════

const interpreter: DesignPattern = {
  id: "interpreter",
  name: "Interpreter",
  category: "behavioral",
  description:
    "You're building a rule engine where business users define conditions like 'age > 18 AND (role = admin OR role = manager)'. Hardcoding every possible rule combination is impossible. The Interpreter pattern defines a grammar for a language and provides an interpreter to evaluate sentences in that language, turning each grammar rule into a class.",
  analogy: "A translator converting sentences — each word (terminal) and grammar rule (non-terminal) knows how to interpret itself",
  difficulty: 5,
  tradeoffs: "You gain: a clean, extensible way to evaluate expressions defined by a grammar. You pay: one class per grammar rule — complex grammars lead to a large number of expression classes, and performance can suffer for large inputs.",
  summary: [
    "Interpreter = define a grammar and build a tree of expression objects that evaluate it",
    "Key insight: each grammar rule becomes a class with an interpret() method — the AST evaluates itself",
    "Use when: you have a simple, well-defined language or set of rules to evaluate repeatedly",
  ],
  youAlreadyUseThis: [
    "SQL WHERE clause parsing — conditions are an expression tree",
    "Regular expression engines — each regex element is an interpreted node",
    "Template engines (Handlebars, Jinja2) — template syntax is interpreted at render time",
    "CSS selectors — the browser parses and interprets selector expressions to match DOM nodes",
  ],
  predictionPrompts: [
    {
      question: "If you add a new operator (XOR) to a boolean expression interpreter, how many existing classes change?",
      answer: "Zero — you create a new XorExpression class implementing the Expression interface. Existing And/Or/Terminal expressions are untouched. This is Open/Closed Principle in action.",
    },
  ],
  classes: [
    {
      id: "ip-expression",
      name: "Expression",
      stereotype: "interface",
      attributes: [],
      methods: [
        { id: "ip-expression-meth-0", name: "interpret", returnType: "boolean", params: ["context: Context"], visibility: "+" },
      ],
      x: 300,
      y: 50,
    },
    {
      id: "ip-terminal",
      name: "TerminalExpression",
      stereotype: "class",
      attributes: [
        { id: "ip-terminal-attr-0", name: "variable", type: "string", visibility: "-" },
      ],
      methods: [
        { id: "ip-terminal-meth-0", name: "interpret", returnType: "boolean", params: ["context: Context"], visibility: "+" },
      ],
      x: 100,
      y: 250,
    },
    {
      id: "ip-or",
      name: "OrExpression",
      stereotype: "class",
      attributes: [
        { id: "ip-or-attr-0", name: "left", type: "Expression", visibility: "-" },
        { id: "ip-or-attr-1", name: "right", type: "Expression", visibility: "-" },
      ],
      methods: [
        { id: "ip-or-meth-0", name: "interpret", returnType: "boolean", params: ["context: Context"], visibility: "+" },
      ],
      x: 300,
      y: 250,
    },
    {
      id: "ip-and",
      name: "AndExpression",
      stereotype: "class",
      attributes: [
        { id: "ip-and-attr-0", name: "left", type: "Expression", visibility: "-" },
        { id: "ip-and-attr-1", name: "right", type: "Expression", visibility: "-" },
      ],
      methods: [
        { id: "ip-and-meth-0", name: "interpret", returnType: "boolean", params: ["context: Context"], visibility: "+" },
      ],
      x: 500,
      y: 250,
    },
    {
      id: "ip-context",
      name: "Context",
      stereotype: "class",
      attributes: [
        { id: "ip-context-attr-0", name: "variables", type: "Map<string, boolean>", visibility: "-" },
      ],
      methods: [
        { id: "ip-context-meth-0", name: "get", returnType: "boolean", params: ["name: string"], visibility: "+" },
        { id: "ip-context-meth-1", name: "set", returnType: "void", params: ["name: string", "value: boolean"], visibility: "+" },
      ],
      x: 300,
      y: 430,
    },
  ],
  relationships: [
    { id: rid(), source: "ip-terminal", target: "ip-expression", type: "realization" },
    { id: rid(), source: "ip-or", target: "ip-expression", type: "realization" },
    { id: rid(), source: "ip-and", target: "ip-expression", type: "realization" },
    { id: rid(), source: "ip-or", target: "ip-expression", type: "aggregation", label: "left, right" },
    { id: rid(), source: "ip-and", target: "ip-expression", type: "aggregation", label: "left, right" },
    { id: rid(), source: "ip-terminal", target: "ip-context", type: "dependency", label: "reads from" },
  ],
  code: {
    typescript: `// Expression interface — every node in the expression tree can interpret itself
interface Expression {
  interpret(context: Context): boolean;
}

// Context — holds variable bindings for the expression to evaluate against
class Context {
  private variables = new Map<string, boolean>();

  get(name: string): boolean {
    return this.variables.get(name) ?? false;
  }

  set(name: string, value: boolean): void {
    this.variables.set(name, value);
  }
}

// TerminalExpression — a leaf node that looks up a variable in the context.
// "Terminal" means it doesn't contain other expressions — it's the base case.
class TerminalExpression implements Expression {
  constructor(private variable: string) {}

  interpret(context: Context): boolean {
    return context.get(this.variable);
  }

  toString(): string {
    return this.variable;
  }
}

// OrExpression — a non-terminal that evaluates left OR right.
// Non-terminals combine other expressions recursively (Composite-like structure).
class OrExpression implements Expression {
  constructor(
    private left: Expression,
    private right: Expression
  ) {}

  interpret(context: Context): boolean {
    return this.left.interpret(context) || this.right.interpret(context);
  }

  toString(): string {
    return \`(\${this.left} OR \${this.right})\`;
  }
}

// AndExpression — a non-terminal that evaluates left AND right
class AndExpression implements Expression {
  constructor(
    private left: Expression,
    private right: Expression
  ) {}

  interpret(context: Context): boolean {
    return this.left.interpret(context) && this.right.interpret(context);
  }

  toString(): string {
    return \`(\${this.left} AND \${this.right})\`;
  }
}

// NotExpression — unary non-terminal for negation
class NotExpression implements Expression {
  constructor(private expr: Expression) {}

  interpret(context: Context): boolean {
    return !this.expr.interpret(context);
  }

  toString(): string {
    return \`(NOT \${this.expr})\`;
  }
}

// Build expression: (isAdmin OR isManager) AND isActive
const isAdmin = new TerminalExpression("isAdmin");
const isManager = new TerminalExpression("isManager");
const isActive = new TerminalExpression("isActive");

// Expression tree:
//        AND
//       /   \\
//     OR    isActive
//    /  \\
// isAdmin isManager
const hasRole = new OrExpression(isAdmin, isManager);
const canAccess = new AndExpression(hasRole, isActive);

console.log("Rule:", canAccess.toString());
// Rule: ((isAdmin OR isManager) AND isActive)

// Evaluate for different users
const ctx1 = new Context();
ctx1.set("isAdmin", true);
ctx1.set("isManager", false);
ctx1.set("isActive", true);
console.log("Admin active:", canAccess.interpret(ctx1)); // true

const ctx2 = new Context();
ctx2.set("isAdmin", false);
ctx2.set("isManager", false);
ctx2.set("isActive", true);
console.log("Regular active:", canAccess.interpret(ctx2)); // false

const ctx3 = new Context();
ctx3.set("isAdmin", true);
ctx3.set("isManager", false);
ctx3.set("isActive", false);
console.log("Admin inactive:", canAccess.interpret(ctx3)); // false`,
    python: `from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class Expression(ABC):
    """Every node in the expression tree can interpret itself."""

    @abstractmethod
    def interpret(self, context: "ExprContext") -> bool: ...

    @abstractmethod
    def __str__(self) -> str: ...


class ExprContext:
    """Holds variable bindings for expression evaluation."""

    def __init__(self) -> None:
        self._variables: dict[str, bool] = {}

    def get(self, name: str) -> bool:
        return self._variables.get(name, False)

    def set(self, name: str, value: bool) -> None:
        self._variables[name] = value


@dataclass
class TerminalExpression(Expression):
    """Leaf node -- looks up a variable in the context."""
    variable: str

    def interpret(self, context: ExprContext) -> bool:
        return context.get(self.variable)

    def __str__(self) -> str:
        return self.variable


@dataclass
class OrExpression(Expression):
    """Non-terminal: evaluates left OR right."""
    left: Expression
    right: Expression

    def interpret(self, context: ExprContext) -> bool:
        return self.left.interpret(context) or self.right.interpret(context)

    def __str__(self) -> str:
        return f"({self.left} OR {self.right})"


@dataclass
class AndExpression(Expression):
    """Non-terminal: evaluates left AND right."""
    left: Expression
    right: Expression

    def interpret(self, context: ExprContext) -> bool:
        return self.left.interpret(context) and self.right.interpret(context)

    def __str__(self) -> str:
        return f"({self.left} AND {self.right})"


@dataclass
class NotExpression(Expression):
    """Unary non-terminal for negation."""
    expr: Expression

    def interpret(self, context: ExprContext) -> bool:
        return not self.expr.interpret(context)

    def __str__(self) -> str:
        return f"(NOT {self.expr})"


# Build: (is_admin OR is_manager) AND is_active
is_admin = TerminalExpression("is_admin")
is_manager = TerminalExpression("is_manager")
is_active = TerminalExpression("is_active")

has_role = OrExpression(is_admin, is_manager)
can_access = AndExpression(has_role, is_active)

print(f"Rule: {can_access}")
# Rule: ((is_admin OR is_manager) AND is_active)

# Evaluate for different users
ctx1 = ExprContext()
ctx1.set("is_admin", True)
ctx1.set("is_manager", False)
ctx1.set("is_active", True)
print("Admin active:", can_access.interpret(ctx1))  # True

ctx2 = ExprContext()
ctx2.set("is_admin", False)
ctx2.set("is_manager", False)
ctx2.set("is_active", True)
print("Regular active:", can_access.interpret(ctx2))  # False`,
  },
  realWorldExamples: [
    "SQL WHERE clause parsing — conditions form an expression tree evaluated against rows",
    "Regex engines — each regex element is interpreted recursively to match strings",
    "Template languages (Handlebars, Jinja2, EJS) — template syntax is parsed into an AST and interpreted",
  ],
  whenToUse: [
    "You have a simple grammar that can be represented as an abstract syntax tree",
    "Rules or expressions need to be evaluated repeatedly with different inputs",
    "The grammar is stable but the data it operates on changes frequently",
    "Business users need to define rules without writing code (rule engines)",
  ],
  whenNotToUse: [
    "Complex grammars — the class hierarchy becomes unwieldy (use a parser generator instead)",
    "Performance-critical evaluation of large expressions (interpreting is slower than compiling)",
    "When the grammar changes frequently — each change requires new expression classes",
  ],
  interviewTips: [
    "Rarely asked directly, but understanding it shows deep GoF knowledge",
    "Key insight: Interpreter is Composite applied to expression trees — each node evaluates itself",
    "Mention that most production interpreters use parser generators (ANTLR, PEG.js) instead of hand-coded Interpreter pattern",
  ],
  commonMistakes: [
    "Using Interpreter for complex grammars where a proper parser (recursive descent, PEG) is more appropriate",
    "Putting interpretation logic in the context instead of the expression nodes",
    "Forgetting that Interpreter creates one class per grammar rule — this scales poorly",
  ],
  confusedWith: [
    { patternId: "composite", difference: "Composite structures objects into trees. Interpreter uses a Composite-like tree structure specifically for evaluating expressions against a grammar." },
    { patternId: "visitor", difference: "Visitor adds operations to existing class hierarchies. Interpreter defines operations (interpret) as part of the expression classes themselves." },
  ],
  relatedPatterns: [
    { patternId: "composite", relationship: "The expression tree is a Composite — terminals are leaves, non-terminals are composites" },
    { patternId: "visitor", relationship: "Visitor can be used to add new operations to expression trees without changing expression classes" },
    { patternId: "flyweight", relationship: "Terminal expression nodes can be shared as Flyweights if many expressions reuse the same variables" },
    { patternId: "iterator", relationship: "Iterator can traverse the expression tree for operations like printing or optimization" },
  ],
};

// ── All Patterns ───────────────────────────────────────────

export const DESIGN_PATTERNS: DesignPattern[] = [
  // Creational (5)
  singleton,
  factoryMethod,
  builder,
  abstractFactory,
  prototype,
  // Structural (7)
  adapter,
  decorator,
  facade,
  proxy,
  composite,
  bridge,
  flyweight,
  // Behavioral (11)
  observer,
  strategy,
  command,
  state,
  iterator,
  mediator,
  templateMethod,
  chainOfResponsibility,
  memento,
  visitor,
  interpreter,
  // Modern (4)
  repository,
  cqrs,
  eventSourcing,
  saga,
  // Resilience (4)
  circuitBreaker,
  bulkhead,
  retry,
  rateLimiter,
  // Concurrency (2)
  threadPool,
  producerConsumer,
  // AI Agent (3)
  react,
  multiAgentOrchestration,
  toolUse,
];

export function getPatternById(id: string): DesignPattern | undefined {
  return DESIGN_PATTERNS.find((p) => p.id === id);
}

export function getPatternsByCategory(
  category: PatternCategory,
): DesignPattern[] {
  return DESIGN_PATTERNS.filter((p) => p.category === category);
}

// ── Pattern Finder Reference Card (LLD-075) ────────────────
//
// Maps common "I need to..." scenarios to the most appropriate pattern.
// The display component lives in LLDModule.tsx (separate task).

export interface PatternFinderEntry {
  /** A plain-language scenario the developer faces. */
  scenario: string;
  /** The `id` of the matching DesignPattern. */
  patternId: string;
}

export const PATTERN_FINDER_ENTRIES: PatternFinderEntry[] = [
  // Creational
  { scenario: "I need exactly one shared instance across my app", patternId: "singleton" },
  { scenario: "I need to create objects without specifying their exact class", patternId: "factory-method" },
  { scenario: "I need to construct a complex object step by step", patternId: "builder" },
  { scenario: "I need families of related objects without coupling to concrete classes", patternId: "abstract-factory" },
  { scenario: "I need to clone existing objects instead of building from scratch", patternId: "prototype" },
  // Structural
  { scenario: "I need to make two incompatible interfaces work together", patternId: "adapter" },
  { scenario: "I need to add behavior to objects without subclassing", patternId: "decorator" },
  { scenario: "I need a simple interface to a complex subsystem", patternId: "facade" },
  { scenario: "I need to control or cache access to an expensive object", patternId: "proxy" },
  { scenario: "I need to treat individual items and groups uniformly", patternId: "composite" },
  { scenario: "I need to vary an abstraction and its implementation independently", patternId: "bridge" },
  { scenario: "I have thousands of similar objects eating memory and need to share common state", patternId: "flyweight" },
  // Behavioral
  { scenario: "I need to notify multiple objects when something changes", patternId: "observer" },
  { scenario: "I need to swap algorithms at runtime", patternId: "strategy" },
  { scenario: "I need to encapsulate requests as objects for undo/redo or queuing", patternId: "command" },
  { scenario: "I need an object to change behavior when its internal state changes", patternId: "state" },
  { scenario: "I need to traverse a collection without exposing its internals", patternId: "iterator" },
  { scenario: "I need to reduce chaotic dependencies between many objects", patternId: "mediator" },
  { scenario: "I need a skeleton algorithm where subclasses fill in specific steps", patternId: "template-method" },
  { scenario: "I need to pass a request along a chain until something handles it", patternId: "chain-of-responsibility" },
  { scenario: "I need to save and restore an object's state (undo/snapshot)", patternId: "memento" },
  { scenario: "I need to add operations to a class hierarchy without changing it", patternId: "visitor" },
  { scenario: "I need to evaluate expressions or rules defined by a simple grammar", patternId: "interpreter" },
  // Modern
  { scenario: "I need to abstract database access behind a clean collection-like API", patternId: "repository" },
  { scenario: "I need to separate read and write models for scalability", patternId: "cqrs" },
  { scenario: "I need a full audit log of every state change in my system", patternId: "event-sourcing" },
  { scenario: "I need to coordinate a multi-step distributed transaction", patternId: "saga" },
  // Resilience
  { scenario: "I need to stop calling a failing service and recover gracefully", patternId: "circuit-breaker" },
  { scenario: "I need to isolate failures so one bad component doesn't sink everything", patternId: "bulkhead" },
  { scenario: "I need to automatically retry transient failures with backoff", patternId: "retry" },
  { scenario: "I need to limit the rate of requests to protect a resource", patternId: "rate-limiter" },
  // Concurrency
  { scenario: "I need to manage a pool of reusable worker threads", patternId: "thread-pool" },
  { scenario: "I need to decouple data production from consumption with a buffer", patternId: "producer-consumer" },
  // AI Agent
  { scenario: "I need an LLM agent that reasons step-by-step with tool calls", patternId: "react-pattern" },
  { scenario: "I need to coordinate multiple specialist AI agents on a complex task", patternId: "multi-agent-orchestration" },
  { scenario: "I need to give an LLM the ability to call external tools and APIs", patternId: "tool-use" },
];

// ── Pattern Comparisons (LLD-071) ─────────────────────────────
//
// Side-by-side comparison of the most commonly confused pattern
// pairs.  Each entry explains intent, structural, and when-to-use
// differences so learners stop mixing them up.

export interface PatternComparison {
  patternA: string;
  patternB: string;
  intent: string;
  structure: string;
  tradeoff: string;
}

export const PATTERN_COMPARISONS: PatternComparison[] = [
  // --- 6 "most confused" pairs ---
  {
    patternA: "strategy",
    patternB: "state",
    intent:
      "Strategy lets the *client* pick an algorithm at configuration time. State lets the *object itself* swap behavior when its internal state changes — the client may not even know a switch happened.",
    structure:
      "Both wrap a family of behaviors behind an interface. In Strategy the context holds one strategy and the client sets it. In State the context holds a state object that can *replace itself* with a different state, forming a state machine.",
    tradeoff:
      "Use Strategy when the caller knows which algorithm to use and it stays fixed for the lifetime of the call. Use State when an object transitions through states autonomously (e.g., TCP connection: Listen -> Established -> Closed).",
  },
  {
    patternA: "factory-method",
    patternB: "abstract-factory",
    intent:
      "Factory Method defines a single creation method in a base class and lets subclasses override it. Abstract Factory provides an interface for creating *families* of related objects without specifying concrete classes.",
    structure:
      "Factory Method uses inheritance — a single method is overridden. Abstract Factory uses composition — the client holds a factory object that produces several related products. Abstract Factory often *uses* factory methods internally.",
    tradeoff:
      "Use Factory Method when you have one product type and want subclasses to decide the concrete variant. Use Abstract Factory when you need to enforce consistency across a family of products (e.g., matching UI widgets for a theme).",
  },
  {
    patternA: "observer",
    patternB: "mediator",
    intent:
      "Observer broadcasts events from one subject to many subscribers (1-to-many). Mediator centralizes complex communication between many colleagues so they don't reference each other directly (many-to-many via a hub).",
    structure:
      "Observer has a Subject that maintains a list of Observers and notifies them. Mediator has a Mediator object that encapsulates how a set of Colleague objects interact — colleagues send messages to the mediator instead of to each other.",
    tradeoff:
      "Use Observer when objects simply need to react to events from a single source. Use Mediator when multiple objects need complex, bidirectional coordination and you want to avoid a tangled web of direct references (e.g., a chat room, an air-traffic controller).",
  },
  {
    patternA: "adapter",
    patternB: "bridge",
    intent:
      "Adapter makes an *existing* incompatible interface work where a different interface is expected (after-the-fact fix). Bridge *proactively* separates an abstraction from its implementation so both can vary independently.",
    structure:
      "Adapter wraps one class and exposes a different interface — the adapted class is unchanged. Bridge composes an implementation reference inside an abstraction; both sides have their own class hierarchies.",
    tradeoff:
      "Use Adapter to integrate legacy or third-party code you cannot change. Use Bridge at design time when you foresee that abstraction and implementation will evolve separately (e.g., shapes x rendering APIs).",
  },
  {
    patternA: "decorator",
    patternB: "proxy",
    intent:
      "Decorator adds *new responsibilities* dynamically by wrapping an object (stacking behavior). Proxy controls *access* to an object — it may add caching, logging, or lazy-loading, but it doesn't change the object's core responsibilities.",
    structure:
      "Both implement the same interface as the wrapped object. Decorator is typically stackable (you can wrap a decorator in another decorator). Proxy usually wraps exactly one real subject and may manage its lifecycle.",
    tradeoff:
      "Use Decorator when you want open-ended, composable behavior additions (e.g., buffered + encrypted + logged stream). Use Proxy when you need access control, caching, or remote proxying without changing the subject's behavior.",
  },
  {
    patternA: "command",
    patternB: "strategy",
    intent:
      "Command encapsulates a *request* as an object, enabling undo, redo, queuing, and logging of operations. Strategy encapsulates an *algorithm* so clients can swap it without changing the context.",
    structure:
      "Command stores the receiver, parameters, and action; it can be queued and reversed. Strategy is stateless or minimal-state — it's an interchangeable algorithm that the context delegates to.",
    tradeoff:
      "Use Command when you need undo/redo, macro recording, or request queuing. Use Strategy when you just need to swap algorithms (e.g., different sorting or pricing strategies) with no need to reverse the operation.",
  },
  // --- Additional commonly confused pairs ---
  {
    patternA: "composite",
    patternB: "decorator",
    intent:
      "Composite structures objects into tree hierarchies so clients treat leaves and branches uniformly. Decorator dynamically adds responsibilities to a single object without affecting siblings.",
    structure:
      "Composite has a Component interface, Leaf nodes, and Composite nodes that hold children. Decorator wraps one component with extra behavior. Both use recursive composition, but Composite fans *out* (tree) while Decorator chains *linearly*.",
    tradeoff:
      "Use Composite for part-whole hierarchies (file systems, UI widget trees). Use Decorator for stacking optional behaviors on a single object (I/O streams, middleware).",
  },
  {
    patternA: "template-method",
    patternB: "strategy",
    intent:
      "Template Method defines the skeleton of an algorithm in a base class and lets subclasses fill in specific steps. Strategy lets you swap the *entire* algorithm via composition.",
    structure:
      "Template Method uses *inheritance* — the base class calls abstract/hook methods overridden in subclasses. Strategy uses *composition* — the context delegates to an interchangeable strategy object.",
    tradeoff:
      "Use Template Method when the overall algorithm structure is fixed and only some steps vary. Use Strategy when the whole algorithm might change and you want to avoid a deep inheritance hierarchy.",
  },
  {
    patternA: "facade",
    patternB: "mediator",
    intent:
      "Facade provides a simplified interface to a complex subsystem for outside callers. Mediator coordinates interactions *between* objects inside a subsystem.",
    structure:
      "Facade wraps N subsystem classes behind one high-level class; subsystem classes don't know the facade exists. Mediator is known by all colleague objects, which communicate through it instead of directly with each other.",
    tradeoff:
      "Use Facade when external clients need a simple API to a complex module. Use Mediator when internal objects have complex interdependencies that need centralized management.",
  },
  {
    patternA: "chain-of-responsibility",
    patternB: "decorator",
    intent:
      "Chain of Responsibility passes a request along a chain of potential handlers until one handles it (or it falls through). Decorator always forwards to the wrapped object after adding behavior — it doesn't *stop* the chain.",
    structure:
      "Both use linked wrappers, but in Chain each handler can either process and stop, or forward. In Decorator every wrapper runs and delegates — there's no short-circuit.",
    tradeoff:
      "Use Chain of Responsibility for request processing where exactly one handler should act (e.g., authentication, logging pipelines). Use Decorator for layering additional behavior that always applies (e.g., compression + encryption).",
  },
  {
    patternA: "flyweight",
    patternB: "singleton",
    intent:
      "Flyweight shares *intrinsic state* across many instances to save memory. Singleton ensures there's exactly one instance of a class with a global access point.",
    structure:
      "Flyweight uses a factory/pool that returns shared objects keyed by intrinsic state. Singleton has a static instance field and private constructor. Flyweight can have many shared instances; Singleton has exactly one.",
    tradeoff:
      "Use Flyweight when you have thousands of objects with common, immutable data (e.g., character glyphs in a text editor). Use Singleton when you need exactly one instance for coordination (config, connection pool).",
  },
  {
    patternA: "builder",
    patternB: "abstract-factory",
    intent:
      "Builder constructs a *single complex object* step by step, giving you control over each stage. Abstract Factory creates *families* of related objects in one shot.",
    structure:
      "Builder has a builder class with step methods and a build/getResult method. Abstract Factory has a factory interface with multiple create methods for related products. Builder focuses on *how* to build; Abstract Factory focuses on *which family* to build.",
    tradeoff:
      "Use Builder for constructing one complex object with many optional parts (e.g., an HTTP request, a query). Use Abstract Factory for selecting among families of related objects (e.g., OS-specific UI kits).",
  },
];

// ── Pattern Prerequisites (LLD-110) ───────────────────────────
//
// Prerequisite graph: maps each pattern id to the pattern ids that
// should be learned first.  Used by the learning-path / curriculum
// components to order patterns and show unlock dependencies.

export const PATTERN_PREREQUISITES: Record<string, string[]> = {
  // Creational
  "abstract-factory": ["factory-method"],
  "builder": ["factory-method"],
  "prototype": ["singleton"],

  // Structural
  "bridge": ["adapter"],
  "decorator": ["composite", "adapter"],
  "proxy": ["decorator"],
  "facade": ["adapter"],
  "flyweight": ["factory-method", "singleton"],

  // Behavioral
  "state": ["strategy"],
  "mediator": ["observer"],
  "command": ["strategy"],
  "chain-of-responsibility": ["command"],
  "template-method": ["strategy"],
  "visitor": ["composite", "iterator"],
  "interpreter": ["composite", "visitor"],
  "memento": ["command"],
  "iterator": ["composite"],

  // Modern
  "cqrs": ["repository", "observer"],
  "event-sourcing": ["cqrs", "command"],
  "saga": ["event-sourcing", "state"],

  // Resilience
  "bulkhead": ["circuit-breaker"],
  "retry": ["circuit-breaker"],
  "rate-limiter": ["retry"],

  // Concurrency
  "producer-consumer": ["observer"],
  "thread-pool": ["producer-consumer"],

  // AI Agent
  "react-pattern": ["command", "strategy"],
  "multi-agent-orchestration": ["react-pattern", "mediator"],
  "tool-use": ["react-pattern", "adapter"],
};
