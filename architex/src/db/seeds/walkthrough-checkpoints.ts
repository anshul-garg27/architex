/**
 * Walkthrough Checkpoint seed: adds interactive checkpoint questions
 * to existing pattern walkthroughs for the top 10 patterns.
 *
 * Each checkpoint is embedded in a walkthrough step and must be answered
 * correctly before the user can proceed. Types:
 *   - multiple-choice: pick the correct option
 *   - click-class: click the right UML class on the canvas
 *   - fill-blank: fill in blanks in a sentence
 *   - order-steps: drag items into the correct order
 *
 * Content type: 'walkthrough-checkpoint'
 * Module: 'lld'
 */

import type { Database } from "@/db";
import { batchUpsert } from "./seed-helpers";
import type { NewModuleContent } from "@/db/schema/module-content";

const MODULE_ID = "lld";
const CONTENT_TYPE = "walkthrough-checkpoint";

// ── Checkpoint type definitions ─────────────────────────────

interface WalkthroughCheckpoint {
  type: "multiple-choice" | "click-class" | "fill-blank" | "order-steps";
  question: string;
  options?: string[];
  correctIndex?: number;
  correctClassIds?: string[];
  blankTemplate?: string;
  answers?: string[];
  items?: string[];
  correctOrder?: number[];
  explanation: string;
}

interface StepCheckpoint {
  stepNumber: number;
  checkpoint: WalkthroughCheckpoint;
}

interface PatternCheckpoints {
  slug: string;
  name: string;
  checkpoints: StepCheckpoint[];
}

// ── Checkpoint data for top 10 patterns ─────────────────────

const CHECKPOINTS: PatternCheckpoints[] = [
  // ── 1. Singleton ────────────────────────────────────────────
  {
    slug: "singleton",
    name: "Singleton Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the class on the canvas that represents the Singleton. Which class has a private constructor and static getInstance() method?",
          correctClassIds: ["singleton-class"],
          explanation:
            "The Singleton class has a private constructor to prevent external instantiation and a static getInstance() method that returns the single shared instance. This is the defining structural signature of the pattern.",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "fill-blank",
          question: "Complete the sentence about Singleton's thread-safety mechanism:",
          blankTemplate:
            "The ___ constructor prevents external instantiation, while the static ___ method controls the single point of access.",
          answers: ["private", "getInstance"],
          explanation:
            "A private constructor means no code outside the class can call 'new Singleton()'. The static getInstance() method is the only way to obtain the instance, letting the class control creation timing and thread safety.",
        },
      },
      {
        stepNumber: 6,
        checkpoint: {
          type: "multiple-choice",
          question:
            "Why is Singleton often considered an anti-pattern in modern development?",
          options: [
            "It uses too much memory",
            "It introduces hidden global state that makes testing difficult",
            "It is too slow for production use",
            "It only works in object-oriented languages",
          ],
          correctIndex: 1,
          explanation:
            "Singleton introduces hidden global state: every consumer depends on the concrete class, making it hard to swap in mocks for unit testing. It also violates the Single Responsibility Principle by managing its own lifecycle AND its domain logic.",
        },
      },
    ],
  },

  // ── 2. Observer ─────────────────────────────────────────────
  {
    slug: "observer",
    name: "Observer Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the class that maintains the list of observers and calls notify() when its state changes.",
          correctClassIds: ["o-subject"],
          explanation:
            "The Subject (also called Publisher) maintains an observers list and calls notify() to broadcast state changes. It is the central hub of the Observer pattern \u2014 observers subscribe to it, and it pushes updates to all subscribers.",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "order-steps",
          question:
            "Put the Observer notification flow in the correct order:",
          items: [
            "Observer calls subject.attach(this) to subscribe",
            "Client calls subject.setState(newValue)",
            "Subject stores the new state internally",
            "Subject iterates its observers list and calls update() on each",
            "Each Observer reads the Subject's new state and reacts",
          ],
          correctOrder: [0, 1, 2, 3, 4],
          explanation:
            "The flow is: subscribe -> state change -> store state -> notify all -> observers react. The key insight is that the Subject pushes notifications, but each Observer pulls the actual state it needs.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "multiple-choice",
          question:
            "In the Observer pattern, what is the main advantage of the Observer interface over direct method calls?",
          options: [
            "It makes the code run faster",
            "It allows the Subject to notify observers without knowing their concrete types",
            "It prevents memory leaks automatically",
            "It ensures observers are called in a specific order",
          ],
          correctIndex: 1,
          explanation:
            "The Observer interface decouples the Subject from concrete observer implementations. The Subject only knows about the Observer interface (with its update() method), so new observer types can be added without modifying the Subject class. This is the Open/Closed Principle in action.",
        },
      },
    ],
  },

  // ── 3. Strategy ─────────────────────────────────────────────
  {
    slug: "strategy",
    name: "Strategy Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "multiple-choice",
          question:
            "What does the Context class delegate to in the Strategy pattern?",
          options: [
            "A concrete Strategy subclass directly",
            "The Strategy interface, which is implemented by interchangeable algorithms",
            "A Factory that creates the right algorithm",
            "A static utility method",
          ],
          correctIndex: 1,
          explanation:
            "The Context holds a reference to the Strategy interface (not a concrete implementation). It delegates the algorithmic work to whatever concrete strategy is currently set. This means the Context doesn't know or care which algorithm runs \u2014 it just calls strategy.execute().",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "click-class",
          question:
            "Click the class that holds a reference to a Strategy and delegates algorithm execution to it.",
          correctClassIds: ["s-context"],
          explanation:
            "The Context class owns a 'strategy' field of type Strategy (the interface). It exposes setStrategy() for runtime swapping and doWork() which delegates to this.strategy.execute(). The Context is the client-facing object that makes strategy-swapping transparent.",
        },
      },
      {
        stepNumber: 6,
        checkpoint: {
          type: "fill-blank",
          question: "Compare Strategy with related patterns:",
          blankTemplate:
            "Strategy = ___ picks the algorithm. State = object picks ___. Template Method = ___ instead of composition.",
          answers: ["client", "internally", "inheritance"],
          explanation:
            "Strategy is selected externally by the client code. State transitions are driven by the object's internal state changes. Template Method achieves variation through inheritance (subclass overrides steps) rather than composition (injecting strategy objects).",
        },
      },
    ],
  },

  // ── 4. Factory Method ───────────────────────────────────────
  {
    slug: "factory-method",
    name: "Factory Method Checkpoints",
    checkpoints: [
      {
        stepNumber: 2,
        checkpoint: {
          type: "click-class",
          question:
            "Click the abstract Creator class that declares the factoryMethod() to be overridden by subclasses.",
          correctClassIds: ["fm-creator"],
          explanation:
            "The Creator class declares the abstract factoryMethod() that returns a Product interface. Concrete creators (ConcreteCreatorA, ConcreteCreatorB) override this method to return specific product types. The Creator's business logic calls this.factoryMethod() without knowing which concrete product it will get.",
        },
      },
      {
        stepNumber: 3,
        checkpoint: {
          type: "multiple-choice",
          question:
            "What is the key benefit of having parallel Creator and Product hierarchies?",
          options: [
            "It reduces the total number of classes needed",
            "It allows adding new product families without modifying framework code",
            "It eliminates the need for interfaces",
            "It makes the code faster at runtime",
          ],
          correctIndex: 1,
          explanation:
            "Parallel hierarchies (Creator <-> Product) follow the Open/Closed Principle: to add a new product type, you create a new ConcreteCreator and a new ConcreteProduct without touching existing classes. The framework code that calls factoryMethod() remains unchanged.",
        },
      },
      {
        stepNumber: 6,
        checkpoint: {
          type: "fill-blank",
          question: "Distinguish Factory Method from Abstract Factory:",
          blankTemplate:
            "Factory Method creates ___ product via ___. Abstract Factory creates a ___ of products via composition.",
          answers: ["one", "subclassing", "family"],
          explanation:
            "Factory Method uses inheritance: a subclass overrides a single method to create one product type. Abstract Factory uses composition: you inject a factory object that can create an entire family of related products (e.g., all Windows widgets or all Mac widgets).",
        },
      },
    ],
  },

  // ── 5. Builder ──────────────────────────────────────────────
  {
    slug: "builder",
    name: "Builder Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the Builder interface that declares the step-by-step construction methods.",
          correctClassIds: ["b-builder"],
          explanation:
            "The Builder interface declares methods like buildStepA(), buildStepB(), buildStepC(), and reset(). It defines WHAT can be configured without specifying HOW. Different ConcreteBuilder implementations can produce different representations from the same construction steps.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "order-steps",
          question:
            "Put the Builder construction flow in the correct order:",
          items: [
            "Client creates a ConcreteBuilder instance",
            "Client (or Director) calls builder.reset()",
            "Client calls builder.buildStepA(), buildStepB(), etc.",
            "Builder accumulates parts internally",
            "Client calls builder.getResult() to retrieve the finished product",
          ],
          correctOrder: [0, 1, 2, 3, 4],
          explanation:
            "The flow is: create builder -> reset internal state -> call step methods in sequence -> builder accumulates results -> retrieve finished product. The Director is optional \u2014 it encodes common construction sequences, but the client can drive the builder directly.",
        },
      },
      {
        stepNumber: 6,
        checkpoint: {
          type: "multiple-choice",
          question:
            "When should you use Builder over a simple constructor?",
          options: [
            "Always, it's universally better",
            "When the object has 1-2 required fields",
            "When the object has many optional parameters and you need step-by-step validation",
            "Only when using the Director pattern",
          ],
          correctIndex: 2,
          explanation:
            "Builder shines when a constructor would need 4+ parameters, especially with many optional ones. It makes construction self-documenting (each method names the parameter), enforces construction order, and can validate at each step. For simple 1-2 field objects, a constructor is cleaner.",
        },
      },
    ],
  },

  // ── 6. Decorator ────────────────────────────────────────────
  {
    slug: "decorator",
    name: "Decorator Checkpoints",
    checkpoints: [
      {
        stepNumber: 2,
        checkpoint: {
          type: "click-class",
          question:
            "Click the abstract Decorator class that wraps a Component and delegates to it.",
          correctClassIds: ["d-base-decorator"],
          explanation:
            "The BaseDecorator (abstract Decorator) implements the Component interface and holds a reference to another Component (the 'wrappee'). It delegates calls to the wrapped object. Concrete decorators extend this base to add specific behaviors before or after delegation.",
        },
      },
      {
        stepNumber: 3,
        checkpoint: {
          type: "multiple-choice",
          question:
            "What is the key structural difference between Decorator and inheritance-based extension?",
          options: [
            "Decorator is faster at runtime",
            "Decorator uses less memory",
            "Decorators can be stacked at runtime to combine behaviors, while inheritance is fixed at compile time",
            "Decorator doesn't need interfaces",
          ],
          correctIndex: 2,
          explanation:
            "Decorators compose at runtime: new Encryption(new Compression(new FileWriter())) stacks three behaviors dynamically. Inheritance fixes the behavior hierarchy at compile time \u2014 you'd need 2^N subclasses for N optional behaviors. Decorator gives you combinatorial flexibility with linear class count.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "fill-blank",
          question: "Compare Decorator with Proxy and Adapter:",
          blankTemplate:
            "Decorator adds ___ to an object. Proxy controls ___ to an object. Adapter changes an object's ___.",
          answers: ["behavior", "access", "interface"],
          explanation:
            "All three patterns wrap objects, but with different intent. Decorator enhances functionality while keeping the same interface. Proxy manages lifecycle, permissions, or caching while keeping the same interface. Adapter converts one interface to another to make incompatible classes work together.",
        },
      },
    ],
  },

  // ── 7. Adapter ──────────────────────────────────────────────
  {
    slug: "adapter",
    name: "Adapter Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the Adapter class that translates between the Target interface and the Adaptee.",
          correctClassIds: ["a-adapter"],
          explanation:
            "The Adapter class implements the Target interface (what the client expects) and internally holds a reference to the Adaptee (the incompatible class). Its request() method translates the call into the Adaptee's specificRequest() method. The client never knows it's talking to an adapted object.",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "multiple-choice",
          question:
            "When should you use the Adapter pattern?",
          options: [
            "When you want to add new behavior to existing classes",
            "When you need to make incompatible interfaces work together without modifying existing code",
            "When you want to simplify a complex subsystem",
            "When you need to control access to an object",
          ],
          correctIndex: 1,
          explanation:
            "Adapter is specifically for interface incompatibility: you have a class with the right functionality but the wrong interface. Adding behavior is Decorator; simplifying a subsystem is Facade; controlling access is Proxy. Adapter bridges the gap without changing either side.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "fill-blank",
          question: "Complete the Adapter relationship:",
          blankTemplate:
            "The Adapter implements the ___ interface that the client expects, and wraps the ___ that has incompatible methods.",
          answers: ["Target", "Adaptee"],
          explanation:
            "The Adapter sits between the client's expected interface (Target) and the existing class with different method signatures (Adaptee). It translates Target.request() into Adaptee.specificRequest(), enabling reuse without modification.",
        },
      },
    ],
  },

  // ── 8. Command ──────────────────────────────────────────────
  {
    slug: "command",
    name: "Command Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the Invoker class that stores and executes commands without knowing what they do.",
          correctClassIds: ["c-invoker"],
          explanation:
            "The Invoker holds a history of Command objects. It calls executeCommand(cmd) which triggers cmd.execute() and stores the command for potential undo. The Invoker doesn't know what the command does \u2014 it just triggers execute() and manages the history stack.",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "order-steps",
          question:
            "Put the Command execution and undo flow in the correct order:",
          items: [
            "Client creates a ConcreteCommand with a Receiver reference",
            "Client passes the Command to the Invoker",
            "Invoker calls command.execute()",
            "ConcreteCommand delegates to receiver.action()",
            "Invoker stores the command in its history stack",
            "To undo, Invoker calls command.undo() on the last command",
          ],
          correctOrder: [0, 1, 2, 3, 4, 5],
          explanation:
            "The flow is: create command (binding it to a receiver) -> pass to invoker -> invoker executes -> command delegates to receiver -> invoker records history -> undo pops and reverses. This decouples the sender (Invoker) from the receiver, enabling undo, queuing, and logging.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "multiple-choice",
          question:
            "What key capability does the Command pattern enable that simple method calls do not?",
          options: [
            "Faster execution of operations",
            "Undo/redo, queuing, and logging of operations as first-class objects",
            "Direct access to the receiver's internal state",
            "Automatic error handling",
          ],
          correctIndex: 1,
          explanation:
            "By encapsulating operations as objects, Command enables: storing them (history for undo/redo), queuing them (job queues), serializing them (logging, replay), and composing them (macro commands). Simple method calls are fire-and-forget \u2014 Command makes operations tangible.",
        },
      },
    ],
  },

  // ── 9. State ────────────────────────────────────────────────
  {
    slug: "state",
    name: "State Checkpoints",
    checkpoints: [
      {
        stepNumber: 3,
        checkpoint: {
          type: "click-class",
          question:
            "Click the Context class that delegates behavior to its current State object.",
          correctClassIds: ["st-context"],
          explanation:
            "The Context class holds a reference to the current State object and delegates all state-dependent behavior to it. When the state changes, the Context swaps its State reference, which changes its behavior without any conditional logic. The Context doesn't know which concrete state it's in.",
        },
      },
      {
        stepNumber: 4,
        checkpoint: {
          type: "fill-blank",
          question: "Complete the sentence about state transitions:",
          blankTemplate:
            "When setState() is called, the Context ___ its current State reference to a new ___ state object, which changes the Context's behavior without any ___ statements.",
          answers: ["replaces", "concrete", "if/else"],
          explanation:
            "State transitions work by swapping the State object reference. The Context calls this.state = new NextState(this), which entirely changes how the Context behaves on future method calls. No conditionals needed \u2014 polymorphism handles the branching.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "order-steps",
          question:
            "Put the State pattern transition flow in the correct order:",
          items: [
            "Context receives a request and delegates to currentState.handle()",
            "The current State object executes its behavior",
            "The State object determines the next state based on the action",
            "The State calls context.setState(new NextState())",
            "Future requests are handled by the new State object",
          ],
          correctOrder: [0, 1, 2, 3, 4],
          explanation:
            "The State pattern eliminates conditionals: each state handles requests in its own way, determines when to transition, and tells the Context to switch. The Context never needs switch/case logic \u2014 it just delegates to whatever State is currently set.",
        },
      },
    ],
  },

  // ── 10. Proxy ───────────────────────────────────────────────
  {
    slug: "proxy",
    name: "Proxy Checkpoints",
    checkpoints: [
      {
        stepNumber: 2,
        checkpoint: {
          type: "click-class",
          question:
            "Click the Proxy class that wraps and controls access to the RealSubject.",
          correctClassIds: ["px-proxy"],
          explanation:
            "The Proxy class implements the same Subject interface as the RealSubject but adds a layer of control. It holds a reference to the RealSubject and intercepts calls to add lazy loading, caching, access control, or logging before (or instead of) delegating to the real object.",
        },
      },
      {
        stepNumber: 3,
        checkpoint: {
          type: "multiple-choice",
          question:
            "Which of the following is NOT a common type of Proxy?",
          options: [
            "Virtual Proxy (lazy loading)",
            "Protection Proxy (access control)",
            "Caching Proxy (response caching)",
            "Mutation Proxy (automatically changing object state)",
          ],
          correctIndex: 3,
          explanation:
            "The three classic proxy types are Virtual (lazy loading / deferred initialization), Protection (access control / permission checks), and Caching (storing expensive results). 'Mutation Proxy' is not a standard pattern \u2014 automatically changing state would be a side effect, not access control.",
        },
      },
      {
        stepNumber: 5,
        checkpoint: {
          type: "fill-blank",
          question: "Compare Proxy with Decorator and Facade:",
          blankTemplate:
            "Proxy controls ___ to an object. Decorator adds ___. Facade provides a simpler ___ to a subsystem.",
          answers: ["access", "behavior", "interface"],
          explanation:
            "All three wrap objects, but with different intent. Proxy manages lifecycle and permissions (same interface, controlled access). Decorator enhances functionality (same interface, added behavior). Facade simplifies (different, simpler interface to a complex subsystem).",
        },
      },
    ],
  },
];

export async function seed(db: Database) {
  const rows: NewModuleContent[] = CHECKPOINTS.map((pc, i) => ({
    moduleId: MODULE_ID,
    contentType: CONTENT_TYPE,
    slug: pc.slug,
    name: pc.name,
    category: null,
    difficulty: null,
    sortOrder: i,
    summary: `Interactive checkpoints for the ${pc.slug} pattern walkthrough`,
    tags: ["walkthrough-checkpoint", pc.slug],
    content: { checkpoints: pc.checkpoints },
  }));

  console.log(`    Upserting ${rows.length} walkthrough checkpoint rows...`);
  await batchUpsert(db, rows);
  console.log(`    \u2713 ${rows.length} rows upserted`);
}
