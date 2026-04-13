# Design Pattern Selection Guide -- Interview Decision Framework

This guide tells you **which pattern to use when**, maps patterns to common LLD problems,
and answers the most frequently asked comparison questions.

---

## "When You See X, Use Y" -- Decision Table

| # | When you see... | Use this pattern |
|---|----------------|-----------------|
| 1 | "Only one instance globally" | Singleton |
| 2 | "Create objects based on type/input" | Factory Method |
| 3 | "Families of related objects (platform, theme)" | Abstract Factory |
| 4 | "Many optional constructor parameters" | Builder |
| 5 | "Clone/copy an expensive object" | Prototype |
| 6 | "Reuse expensive resources (connections)" | Object Pool |
| 7 | "Inject dependencies for testability" | Dependency Injection |
| 8 | "Integrate incompatible interface / legacy" | Adapter |
| 9 | "Varies in 2 dimensions (shape x color)" | Bridge |
| 10 | "Tree / hierarchy / part-whole" | Composite |
| 11 | "Add features dynamically / stack behaviors" | Decorator |
| 12 | "Simplify a complex subsystem" | Facade |
| 13 | "Millions of similar objects / memory constraint" | Flyweight |
| 14 | "Lazy loading / access control / caching layer" | Proxy |
| 15 | "Multiple ways to do the same thing" | Strategy |
| 16 | "When X happens, notify Y, Z, W" | Observer |
| 17 | "Undo/redo, macro, queued operations" | Command |
| 18 | "Behavior depends on current state / FSM" | State |
| 19 | "Pipeline / middleware / approval chain" | Chain of Responsibility |
| 20 | "Algorithm skeleton with variable steps" | Template Method |
| 21 | "Traverse a collection / paginate" | Iterator |
| 22 | "Many-to-many communication centralized" | Mediator |
| 23 | "Save/restore snapshots / checkpoints" | Memento |
| 24 | "New operations on structure without modifying it" | Visitor |
| 25 | "Avoid null checks / default do-nothing" | Null Object |
| 26 | "Composable business rules / filters" | Specification |
| 27 | "Notification channel selection at runtime" | Strategy (channel) + Factory (create) |
| 28 | "Rate limiting with different algorithms" | Strategy (algorithm) + Decorator (wrap) |
| 29 | "Multi-step order workflow" | State (lifecycle) + Observer (notifications) |
| 30 | "Configurable logging levels and destinations" | Singleton + Chain of Responsibility + Strategy |
| 31 | "Payment processing with multiple gateways" | Strategy (gateway) + Factory (select) |
| 32 | "Caching with eviction policies" | Strategy (eviction) + Proxy (cache layer) + Decorator (metrics) |
| 33 | "File system tree with operations" | Composite (tree) + Visitor (operations) |
| 34 | "Plugin architecture" | Strategy + Factory + Observer |
| 35 | "Game character creation with variations" | Builder + Prototype |

---

## LLD Problem to Pattern Mapping

### Parking Lot

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Singleton        | ParkingLot instance (one per location)            |
| Factory          | VehicleFactory -- create Car, Bike, Truck         |
| Strategy         | PricingStrategy -- hourly, daily, monthly rates   |
|                  | ParkingStrategy -- nearest, first-available       |
| Observer         | Notify display boards when spots change           |
+------------------+--------------------------------------------------+
```

### Elevator System

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| State            | Elevator states: Idle, MovingUp, MovingDown, Door |
| Strategy         | SchedulingStrategy -- SCAN, LOOK, FCFS            |
| Observer         | Notify floors when elevator arrives               |
| Command          | Floor requests as command objects (queueable)     |
+------------------+--------------------------------------------------+
```

### Vending Machine

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| State            | Idle, HasMoney, Dispensing, OutOfStock            |
| Strategy         | PaymentStrategy -- coin, card, mobile             |
+------------------+--------------------------------------------------+
```

### Chess / Board Game

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Template Method  | Turn skeleton: validate -> move -> check -> next  |
| Factory          | PieceFactory -- create King, Queen, Pawn, etc.    |
| Command          | Move as command (undo/redo moves)                 |
| Observer         | Notify players, timer, and UI on each move        |
| Strategy         | Movement strategy per piece type                  |
+------------------+--------------------------------------------------+
```

### Splitwise / Expense Sharing

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Strategy         | SplitStrategy -- equal, exact, percentage         |
| Observer         | Notify users when expense is added/settled        |
| Factory          | ExpenseFactory -- create different expense types  |
+------------------+--------------------------------------------------+
```

### Cache System (LRU/LFU)

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Strategy         | EvictionStrategy -- LRU, LFU, FIFO               |
| Decorator        | Add logging, metrics around base cache            |
| Proxy            | Cache proxy wraps the real data source            |
| Singleton        | Single cache instance per application             |
+------------------+--------------------------------------------------+
```

### Logger Framework

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Singleton        | Logger instance globally accessible               |
| Chain of Resp    | Log levels: console -> file -> alert -> remote    |
| Strategy         | Log format strategy: JSON, plain text, structured |
| Factory          | LoggerFactory -- create logger for each class     |
+------------------+--------------------------------------------------+
```

### BookMyShow / Ticket Booking

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Strategy         | SeatSelection -- best available, user picks       |
|                  | PricingStrategy -- dynamic, tier-based            |
| Observer         | Notify waitlisted users when seats available      |
| State            | Booking states: Pending, Confirmed, Cancelled     |
| Singleton        | TheaterManager, PaymentGateway                    |
+------------------+--------------------------------------------------+
```

### Rate Limiter

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Strategy         | Algorithm: TokenBucket, SlidingWindow, FixedWindow|
| Decorator        | Wrap service with rate-limiting decorator          |
| Factory          | Create appropriate limiter based on config         |
+------------------+--------------------------------------------------+
```

### Pub-Sub / Message Queue

```
+------------------+--------------------------------------------------+
| Pattern          | How it is used                                   |
+------------------+--------------------------------------------------+
| Observer         | Core subscribe/notify mechanism                   |
| Command          | Messages as command objects (serializable)         |
| Strategy         | DeliveryStrategy -- at-most-once, at-least-once   |
|                  | RoutingStrategy -- topic, fanout, direct           |
| Singleton        | Broker instance                                   |
+------------------+--------------------------------------------------+
```

---

## Pattern Relationships -- Which Patterns Work Together

```
                    Factory
                      |
                      | creates
                      v
    Builder ------> [Object] <------ Prototype
                      |
                used by
                      v
    +------+------+------+------+
    |      |      |      |      |
 Strategy State Command Observer Decorator
    |               |
    |        (encapsulates request)
    |               |
    +-------+-------+
            |
     can use Memento
      (for undo in Command)

  Chain of Resp ---- similar to --> Decorator
  (both wrap/chain, but Chain can stop propagation)

  Composite + Visitor = operations on tree structures
  Proxy + Decorator = both wrap, different intent
  Mediator vs Observer = centralized vs broadcast
```

### Common Pattern Combos

| Combo | Why They Work Together |
|-------|----------------------|
| Strategy + Factory | Factory creates the right Strategy based on input |
| State + Observer | State transitions trigger notifications |
| Command + Memento | Command saves memento before executing (undo support) |
| Composite + Iterator | Iterator traverses the composite tree |
| Composite + Visitor | Visitor performs operations across composite nodes |
| Decorator + Strategy | Decorator wraps, Strategy swaps -- both extend behavior |
| Proxy + Singleton | Singleton service behind a caching/logging proxy |
| Observer + Command | Events trigger command execution |
| Template Method + Strategy | Template defines skeleton, Strategy for individual steps |
| Chain of Resp + Strategy | Each handler in the chain uses a strategy for processing |

---

## Pattern vs Anti-Pattern

### Singleton -- When It Becomes an Anti-Pattern

```
PATTERN (acceptable):
  - Connection pool with bounded resources
  - Configuration loaded once at startup
  - Accessed via dependency injection

ANTI-PATTERN (harmful):
  - Global mutable state dump
  - Hidden dependency in every class
  - Cannot test classes in isolation
  - Becomes a God Object holding unrelated data

FIX: Use DI container to manage singleton scope.
     The class itself does not need to be a Singleton.
     Let the DI framework (Spring, Guice) manage the lifecycle.
```

### God Object Anti-Pattern

```
PROBLEM:
  One class that does everything: UserManager that handles
  auth, profile, notifications, billing, analytics...

FIX:
  - Split into focused classes (SRP)
  - Use Strategy for varying algorithms
  - Use Observer for cross-cutting notifications
  - Use Facade if you need a simplified entry point
```

### Service Locator Anti-Pattern

```
PROBLEM:
  ServiceLocator.get(PaymentService.class)  // hidden dependency
  - Dependencies are not visible in constructor
  - Hard to test -- must configure locator in tests
  - No compile-time checking of dependencies

FIX:
  Constructor injection:
  public OrderService(PaymentService payment) { ... }
  - Dependency is explicit
  - Compile-time checked
  - Easy to mock in tests
```

---

## Key Comparisons -- Interview Favorites

### Strategy vs State

```
STRATEGY:
  - Client chooses which algorithm to use
  - Strategies are interchangeable and independent
  - Strategies do NOT know about each other
  - Example: User selects "pay by credit card" vs "pay by UPI"
  
  processor.setStrategy(new CreditCardPayment());  // client decides

STATE:
  - State transitions happen INSIDE the object
  - States know about each other (define transitions)
  - The context appears to change its class
  - Example: Order moves from PLACED -> CONFIRMED -> SHIPPED -> DELIVERED

  // Inside ConfirmedState.ship():
  context.setState(new ShippedState());  // state decides next state

BOTH use the same structure (Context + interface + concrete classes).
The DIFFERENCE is who triggers the change and whether states know about each other.
```

### Factory Method vs Abstract Factory

```
FACTORY METHOD:
  - Creates ONE type of product
  - Single method: createNotification()
  - Uses inheritance -- subclass overrides the creation method
  - Use when: "I need to create one object and the type depends on input"

ABSTRACT FACTORY:
  - Creates FAMILIES of related products
  - Multiple methods: createButton(), createCheckbox(), createTextField()
  - Uses composition -- factory object is injected
  - Use when: "I need a set of objects that must be compatible with each other"

  Example:
    Factory Method: NotificationFactory.create("email")
                    -> returns EmailNotification

    Abstract Factory: UIFactory (Windows vs Mac)
                      -> .createButton() returns WindowsButton
                      -> .createCheckbox() returns WindowsCheckbox
                      (both are Windows-family, guaranteed compatible)
```

### Observer vs Pub-Sub

```
OBSERVER (in-process):
  - Subject directly knows about observers (holds references)
  - Synchronous notification (same thread, same process)
  - Tight coupling: observers must implement the Observer interface
  - Use in: LLD, single application, event handling

  subject.attach(observer);
  subject.notify();  // calls observer.update() directly

PUB-SUB (distributed):
  - Publisher and subscriber do NOT know about each other
  - Message broker / event bus sits in between
  - Asynchronous, often across processes or machines
  - Loose coupling: communicate through topic strings or channels

  publisher  ---> [Broker/Kafka/RabbitMQ] ---> subscriber

  publisher.publish("order.placed", orderData);
  subscriber.subscribe("order.placed", handler);

KEY: In interviews, if they say "in-process notifications" -> Observer.
     If they say "distributed events" or "microservices" -> Pub-Sub.
```

### Decorator vs Proxy

```
DECORATOR:
  - Adds NEW behavior dynamically
  - Client creates the decorator chain explicitly
  - Multiple decorators can stack
  - Intent: enhance/augment functionality

  Coffee coffee = new WhipCream(new Milk(new SimpleCoffee()));

PROXY:
  - Controls ACCESS to existing behavior
  - Client usually does not know it is using a proxy
  - Typically one proxy layer
  - Intent: lazy loading, access control, caching, logging

  Image image = new ImageProxy("big.jpg");  // looks like real Image
  image.display();  // proxy loads the real image lazily
```

### Chain of Responsibility vs Decorator

```
CHAIN OF RESPONSIBILITY:
  - Can STOP processing (reject the request)
  - Each handler decides: process OR pass to next
  - Typically used for: middleware, approval workflows, validators

DECORATOR:
  - Always DELEGATES to wrapped object
  - Each decorator adds behavior, then delegates
  - Typically used for: adding features, wrapping I/O streams
```

---

## How to Talk About Patterns in an Interview

### The Three-Step Formula

```
Step 1: NAME IT
  "I would use the Strategy pattern here."

Step 2: JUSTIFY IT
  "Because the pricing algorithm can change -- we might have regular pricing,
   holiday pricing, or surge pricing. Strategy lets us swap the algorithm
   at runtime without modifying the order processing logic."

Step 3: SHOW THE TRADE-OFF
  "The trade-off is that we now have an extra interface and multiple classes
   instead of a simple if-else, but this follows the Open-Closed Principle
   and makes it trivial to add new pricing strategies later."
```

### What NOT to Do

```
BAD:  "I'll use a Singleton here."
      (no justification, sounds like you memorized a list)

BAD:  "We use Strategy, Observer, Command, State, Builder, Factory..."
      (pattern soup -- using every pattern does not show judgment)

GOOD: "For the pricing calculation, I'll use Strategy because the algorithm
       changes based on context. For state transitions of the order, I'll use
       State because the order has a well-defined lifecycle. I am deliberately
       NOT using Observer here because we only have one consumer of the
       state change -- it would be over-engineering."
```

### Interview Questions with Model Answers

**Q: "How would you design a notification system?"**

A: "The core is Strategy pattern. `NotificationStrategy` is the interface with
implementations like `EmailNotification`, `SMSNotification`, `PushNotification`.
A `NotificationFactory` creates the right strategy based on user preference.
`Observer` pattern subscribes users to events -- when an event fires, each
subscriber gets notified through their preferred channel. This is extensible:
adding WhatsApp notification means adding one class."

**Q: "How do you handle different payment methods?"**

A: "Strategy pattern. `PaymentStrategy` interface with `pay(amount)`. Concrete
strategies: `CreditCard`, `UPI`, `Wallet`, `NetBanking`. The checkout service
holds a reference to `PaymentStrategy` and calls `pay()`. The factory creates
the right strategy from user selection. For testing, I inject a mock strategy.
Adding a new payment method is one new class -- Open-Closed Principle."

**Q: "Your Order has states: PLACED, CONFIRMED, SHIPPED, DELIVERED, CANCELLED. How?"**

A: "State pattern. Each state is a class implementing `OrderState` interface with
methods like `confirm()`, `ship()`, `deliver()`, `cancel()`. The `Order` class
delegates to its current state. Each state knows the valid transitions:
`PlacedState.confirm()` transitions to `ConfirmedState`, but
`PlacedState.deliver()` throws an exception -- you cannot deliver before shipping.
This eliminates the massive switch statement and makes adding new states trivial."

**Q: "Design a cache with different eviction policies."**

A: "Strategy for the eviction policy -- `EvictionStrategy` with LRU, LFU, FIFO
implementations. Proxy for the cache layer -- `CachingProxy` wraps the real
data source and intercepts get/put. Decorator if I want to add metrics or
logging on top: `LoggingCacheDecorator` wraps the cache and logs hit/miss
before delegating. Singleton scope for the cache instance, managed by DI."

**Q: "When would you NOT use a design pattern?"**

A: "When the problem is simple enough that a pattern adds unnecessary complexity.
If I have only one payment method and no plans to add more, Strategy is
over-engineering. If I have only two states, a boolean flag is cleaner than
the State pattern. Patterns solve specific problems -- applying them
everywhere is an anti-pattern itself called 'pattern-itis'. I use a pattern
when the cost of NOT using it (duplicated logic, rigid code, hard to test)
outweighs the cost of the abstraction."

---

## Master Cheat Sheet -- 23 GoF Patterns at a Glance

```
CREATIONAL (how objects are created):
  Singleton       - One instance
  Factory Method  - Subclass decides which class to create
  Abstract Factory- Families of related objects
  Builder         - Step-by-step complex objects
  Prototype       - Clone existing objects

STRUCTURAL (how objects are composed):
  Adapter         - Convert interface
  Bridge          - Decouple abstraction from implementation
  Composite       - Tree / part-whole
  Decorator       - Add behavior dynamically
  Facade          - Simplified interface
  Flyweight       - Share fine-grained objects
  Proxy           - Surrogate / placeholder

BEHAVIORAL (how objects communicate):
  Strategy        - Swap algorithms
  Observer        - One-to-many notification
  Command         - Encapsulate request
  State           - Behavior varies with state
  Chain of Resp   - Pass along handler chain
  Template Method - Algorithm skeleton
  Iterator        - Sequential access
  Mediator        - Centralize communication
  Memento         - Capture/restore state
  Visitor         - Operations on structures
  Interpreter     - Grammar/language evaluation
```

---

## Final Interview Advice

1. **Know 5 patterns deeply**: Strategy, Observer, State, Factory, Builder.
   These cover 80% of LLD questions.

2. **Know when NOT to use a pattern**: This shows more maturity than knowing
   when to use one.

3. **Patterns are tools, not goals**: Do not force patterns. Let the problem
   tell you which pattern fits.

4. **Name -> Justify -> Trade-off**: Always follow this formula when
   introducing a pattern in your design.

5. **Combine patterns thoughtfully**: Strategy + Factory is a common combo.
   State + Observer is another. Do not use 10 patterns when 3 will do.

6. **Draw the class diagram first**: Before writing code, show the UML.
   It proves you understand the structure, not just the syntax.

7. **Connect to SOLID**: Every pattern connects to a SOLID principle.
   Strategy = OCP. Observer = DIP. Factory = SRP. This is how you
   demonstrate deep understanding.
