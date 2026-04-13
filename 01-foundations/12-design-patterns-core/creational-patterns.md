# Creational Design Patterns -- Complete Interview Guide

Creational patterns deal with **object creation mechanisms**. They abstract the instantiation
process so your system is independent of how its objects are created, composed, and represented.

> **Interview Insight**: Creational patterns are the first thing interviewers test.
> You MUST know Singleton, Factory, and Builder cold. The others are bonus points.

---

## 1. Singleton Pattern

### What
Ensures a class has **exactly one instance** and provides a **global point of access** to it.

### When to Use
- Shared resource: database connection pool, configuration manager, logger
- Coordinating access to a shared resource across the application
- Caching layer or registry that must be globally consistent

### When NOT to Use
- Unit testing (hard to mock -- tightly couples code to the singleton)
- Multi-tenant systems where each tenant needs its own instance
- When the "one instance" requirement is not truly global
- When it hides dependencies and makes code harder to reason about

### Structure

```
+----------------------------------+
|          Singleton               |
+----------------------------------+
| - instance: Singleton            |
| - data: Map<String,Object>       |
+----------------------------------+
| - Singleton()                    |  <-- private constructor
| + getInstance(): Singleton       |  <-- static access
| + getData(key): Object           |
+----------------------------------+
```

### Implementation -- Three Production Approaches

**Approach 1: Bill Pugh Holder (Recommended)**

```java
public class Singleton {
    // Private constructor prevents external instantiation
    private Singleton() {}

    // Inner static class -- not loaded until getInstance() is called
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

Why it works: The JVM guarantees that the inner class is loaded only when `getInstance()`
is first called. Class loading is inherently thread-safe. No synchronization overhead.

**Approach 2: Enum Singleton (Effective Java recommended)**

```java
public enum Singleton {
    INSTANCE;

    private final Map<String, Object> cache = new ConcurrentHashMap<>();

    public void put(String key, Object value) {
        cache.put(key, value);
    }

    public Object get(String key) {
        return cache.get(key);
    }
}

// Usage:
Singleton.INSTANCE.put("config", configObj);
```

Why it works: The JVM guarantees enums are instantiated exactly once. Also handles
serialization and reflection attacks automatically.

**Approach 3: Double-Checked Locking**

```java
public class Singleton {
    // volatile prevents instruction reordering
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                   // First check (no lock)
            synchronized (Singleton.class) {
                if (instance == null) {           // Second check (with lock)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

Why `volatile`? Without it, the JVM may reorder the write to `instance` before the
constructor finishes. Another thread could see a non-null but partially constructed object.

### Pros and Cons

| Pros | Cons |
|------|------|
| Controlled access to sole instance | Hidden dependency -- callers do not declare it |
| Lazy initialization possible | Hard to unit test (tight coupling) |
| Thread-safe with proper implementation | Violates Single Responsibility (lifecycle + logic) |
| Better than global variables | Can become a God Object if overused |

### Anti-Pattern Concerns

Singleton becomes an anti-pattern when:
1. It is used as a **global variable dump** instead of proper dependency injection
2. It **hides dependencies** -- you cannot tell from a method signature what it depends on
3. It makes **testing painful** -- you cannot substitute a mock easily
4. It creates **tight coupling** -- every class knows about the concrete Singleton

**Interview answer**: "I would use Singleton for the connection pool / config manager,
but I would access it through dependency injection so it remains testable."

---

## 2. Factory Method Pattern

### What
Defines an interface for creating an object but lets **subclasses decide** which class
to instantiate. Factory Method lets a class defer instantiation to subclasses.

### When to Use
- You do not know ahead of time which concrete class needs to be instantiated
- You want to localize the creation logic in one place
- You want to decouple client code from concrete implementations

### Structure

```
+--------------------+              +---------------------+
|  Creator           |              |  Product            |
+--------------------+              +---------------------+
| + factoryMethod()  |----creates-->| + operation()       |
| + someOperation()  |              +---------------------+
+--------------------+                      ^
        ^                                   |
        |                          +--------+--------+
+--------------------+             |                  |
| ConcreteCreatorA   |      ConcreteProductA   ConcreteProductB
+--------------------+
| + factoryMethod()  |
+--------------------+
```

### Implementation -- Notification Factory

```java
// Product interface
public interface Notification {
    void send(String to, String message);
}

// Concrete products
public class EmailNotification implements Notification {
    @Override
    public void send(String to, String message) {
        System.out.println("Email to " + to + ": " + message);
    }
}

public class SMSNotification implements Notification {
    @Override
    public void send(String to, String message) {
        System.out.println("SMS to " + to + ": " + message);
    }
}

public class PushNotification implements Notification {
    @Override
    public void send(String to, String message) {
        System.out.println("Push to " + to + ": " + message);
    }
}

// Factory
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel.toLowerCase()) {
            case "email" -> new EmailNotification();
            case "sms"   -> new SMSNotification();
            case "push"  -> new PushNotification();
            default -> throw new IllegalArgumentException(
                "Unknown channel: " + channel);
        };
    }
}

// Client code -- completely decoupled from concrete classes
Notification n = NotificationFactory.create("sms");
n.send("+1234567890", "Your OTP is 9921");
```

### Vehicle Factory Example

```java
public interface Vehicle {
    void drive();
    int getWheels();
}

public class Car implements Vehicle {
    public void drive() { System.out.println("Driving car on road"); }
    public int getWheels() { return 4; }
}

public class Bike implements Vehicle {
    public void drive() { System.out.println("Riding bike"); }
    public int getWheels() { return 2; }
}

public class VehicleFactory {
    public static Vehicle create(VehicleType type) {
        return switch (type) {
            case CAR  -> new Car();
            case BIKE -> new Bike();
            case TRUCK -> new Truck();
        };
    }
}
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Decouples creation from usage (OCP) | Can lead to large switch/if-else blocks |
| Single place to add new product types | Adds an extra layer of indirection |
| Easy to test -- inject mock factory | Must update factory when adding types |

### Interview Tip
"I use Factory when the type of object depends on runtime input -- like payment method
selection, notification channel, or vehicle type in a parking lot system."

---

## 3. Abstract Factory Pattern

### What
Provides an interface for creating **families of related objects** without specifying
their concrete classes. It is a factory of factories.

### When to Use
- You need to create families of related objects (button + checkbox + textfield)
- The system must be independent of how products are created
- You want to enforce that related products are used together

### Structure

```
+---------------------+          +--------------------+
| AbstractFactory     |          | AbstractProductA   |
+---------------------+          +--------------------+
| + createProductA()  |          | + operationA()     |
| + createProductB()  |          +--------------------+
+---------------------+                  ^   ^
        ^        ^                       |   |
        |        |              WinProdA    MacProdA
        |        |
 WinFactory   MacFactory         +--------------------+
                                 | AbstractProductB   |
                                 +--------------------+
                                 | + operationB()     |
                                 +--------------------+
                                         ^   ^
                                         |   |
                                 WinProdB    MacProdB
```

### Implementation -- Cross-Platform UI

```java
// Abstract products
public interface Button {
    void render();
    void onClick(Runnable handler);
}

public interface Checkbox {
    void render();
    boolean isChecked();
}

// Windows family
public class WindowsButton implements Button {
    public void render() { System.out.println("[Win Button]"); }
    public void onClick(Runnable h) { h.run(); }
}

public class WindowsCheckbox implements Checkbox {
    public void render() { System.out.println("[Win Checkbox]"); }
    public boolean isChecked() { return false; }
}

// Mac family
public class MacButton implements Button {
    public void render() { System.out.println("[Mac Button]"); }
    public void onClick(Runnable h) { h.run(); }
}

public class MacCheckbox implements Checkbox {
    public void render() { System.out.println("[Mac Checkbox]"); }
    public boolean isChecked() { return false; }
}

// Abstract factory
public interface UIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

// Concrete factories
public class WindowsUIFactory implements UIFactory {
    public Button createButton()     { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}

public class MacUIFactory implements UIFactory {
    public Button createButton()     { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}

// Client -- works with ANY platform via the factory interface
public class Application {
    private final Button button;
    private final Checkbox checkbox;

    public Application(UIFactory factory) {
        this.button   = factory.createButton();
        this.checkbox = factory.createCheckbox();
    }

    public void render() {
        button.render();
        checkbox.render();
    }
}

// Bootstrap
UIFactory factory = isWindows() ? new WindowsUIFactory() : new MacUIFactory();
Application app = new Application(factory);
app.render();
```

### Factory Method vs Abstract Factory

| Factory Method | Abstract Factory |
|---------------|-----------------|
| Creates **one product** | Creates **families of products** |
| Uses inheritance (subclass decides) | Uses composition (factory object) |
| Single method | Multiple creation methods |
| `createNotification()` | `createButton()`, `createCheckbox()`, ... |

---

## 4. Builder Pattern

### What
Separates the construction of a complex object from its representation, allowing the
same construction process to create different representations. Especially useful for
objects with many optional parameters.

### When to Use
- Object has many constructor parameters (telescoping constructor problem)
- You need to build immutable objects step by step
- Construction requires validation before finalizing
- Same construction process should create different representations

### Structure

```
+------------------+        +------------------+
|    Director      |------->|    Builder       |
+------------------+        +------------------+
| + construct()    |        | + buildPartA()   |
+------------------+        | + buildPartB()   |
                            | + getResult()    |
                            +------------------+
                                    ^
                            +------------------+
                            | ConcreteBuilder  |
                            +------------------+
                            | - product        |
                            | + buildPartA()   |
                            | + buildPartB()   |
                            | + getResult()    |
                            +------------------+
```

### Implementation -- Pizza Builder (Fluent API)

```java
public class Pizza {
    private final String size;       // required
    private final String crust;      // required
    private final boolean cheese;    // optional
    private final boolean pepperoni; // optional
    private final boolean mushrooms; // optional
    private final boolean onions;    // optional

    // Private constructor -- only Builder can create Pizza
    private Pizza(Builder builder) {
        this.size      = builder.size;
        this.crust     = builder.crust;
        this.cheese    = builder.cheese;
        this.pepperoni = builder.pepperoni;
        this.mushrooms = builder.mushrooms;
        this.onions    = builder.onions;
    }

    // Getters only -- immutable object
    public String getSize() { return size; }
    public String getCrust() { return crust; }
    public boolean hasCheese() { return cheese; }

    public static class Builder {
        // Required
        private final String size;
        private final String crust;

        // Optional -- defaults
        private boolean cheese    = false;
        private boolean pepperoni = false;
        private boolean mushrooms = false;
        private boolean onions    = false;

        public Builder(String size, String crust) {
            this.size  = size;
            this.crust = crust;
        }

        public Builder cheese(boolean val)    { this.cheese = val;    return this; }
        public Builder pepperoni(boolean val)  { this.pepperoni = val; return this; }
        public Builder mushrooms(boolean val)  { this.mushrooms = val; return this; }
        public Builder onions(boolean val)     { this.onions = val;    return this; }

        public Pizza build() {
            // Validation before construction
            if (size == null || crust == null) {
                throw new IllegalStateException("Size and crust are required");
            }
            return new Pizza(this);
        }
    }
}

// Usage -- clean fluent API
Pizza pizza = new Pizza.Builder("Large", "Thin")
    .cheese(true)
    .pepperoni(true)
    .mushrooms(true)
    .build();
```

### Query Builder Example

```java
public class SQLQuery {
    private final String table;
    private final List<String> columns;
    private final String whereClause;
    private final String orderBy;
    private final Integer limit;

    private SQLQuery(Builder b) {
        this.table       = b.table;
        this.columns     = List.copyOf(b.columns);  // immutable copy
        this.whereClause = b.whereClause;
        this.orderBy     = b.orderBy;
        this.limit       = b.limit;
    }

    public String toSQL() {
        StringBuilder sql = new StringBuilder("SELECT ");
        sql.append(columns.isEmpty() ? "*" : String.join(", ", columns));
        sql.append(" FROM ").append(table);
        if (whereClause != null) sql.append(" WHERE ").append(whereClause);
        if (orderBy != null)     sql.append(" ORDER BY ").append(orderBy);
        if (limit != null)       sql.append(" LIMIT ").append(limit);
        return sql.toString();
    }

    public static class Builder {
        private final String table;
        private List<String> columns = new ArrayList<>();
        private String whereClause;
        private String orderBy;
        private Integer limit;

        public Builder(String table)                  { this.table = table; }
        public Builder select(String... cols)         { columns.addAll(Arrays.asList(cols)); return this; }
        public Builder where(String clause)           { this.whereClause = clause; return this; }
        public Builder orderBy(String col)            { this.orderBy = col; return this; }
        public Builder limit(int n)                   { this.limit = n; return this; }
        public SQLQuery build()                       { return new SQLQuery(this); }
    }
}

// Usage
String sql = new SQLQuery.Builder("users")
    .select("id", "name", "email")
    .where("age > 18")
    .orderBy("name")
    .limit(50)
    .build()
    .toSQL();
// SELECT id, name, email FROM users WHERE age > 18 ORDER BY name LIMIT 50
```

### Interview Tip
"Builder is my go-to when I see a class with more than 3-4 constructor parameters.
It eliminates the telescoping constructor anti-pattern and produces immutable objects."

---

## 5. Prototype Pattern

### What
Creates new objects by **cloning an existing instance** (the prototype) rather than
constructing from scratch. Useful when object creation is expensive.

### When to Use
- Creating an object is more expensive than copying (DB lookups, network calls)
- You need many similar objects with slight variations
- You want to avoid subclasses of a factory just to create different products
- Configuring an object is complex and you want to reuse configurations

### Structure

```
+-----------------------+
|    Prototype          |
+-----------------------+
| + clone(): Prototype  |
+-----------------------+
        ^         ^
        |         |
+----------+  +----------+
| ConcretA |  | ConcretB |
+----------+  +----------+
| + clone() |  | + clone() |
+----------+  +----------+
```

### Implementation -- Deep vs Shallow Copy

```java
public class GameUnit implements Cloneable {
    private String type;
    private int health;
    private Position position;  // mutable object
    private List<String> abilities;

    public GameUnit(String type, int health, Position pos, List<String> abilities) {
        this.type      = type;
        this.health    = health;
        this.position  = pos;
        this.abilities = abilities;
    }

    // SHALLOW CLONE -- position and abilities are still shared references!
    @Override
    public GameUnit clone() {
        try {
            return (GameUnit) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new RuntimeException(e);
        }
    }

    // DEEP CLONE -- fully independent copy
    public GameUnit deepClone() {
        return new GameUnit(
            this.type,
            this.health,
            new Position(this.position.getX(), this.position.getY()),  // new object
            new ArrayList<>(this.abilities)                             // new list
        );
    }
}

// Usage -- spawn 100 archers from a prototype
GameUnit archerPrototype = new GameUnit("Archer", 100,
    new Position(0, 0), List.of("shoot", "dodge"));

for (int i = 0; i < 100; i++) {
    GameUnit archer = archerPrototype.deepClone();
    archer.setPosition(new Position(i * 10, 0));
    army.add(archer);
}
```

### Shallow vs Deep Copy

| Shallow Copy | Deep Copy |
|-------------|-----------|
| Copies field values directly | Recursively copies all referenced objects |
| Shared references to mutable objects | Fully independent copy |
| Fast but dangerous with mutable state | Slower but safe |
| `Object.clone()` default | Custom implementation required |

---

## 6. Object Pool Pattern

### What
Maintains a pool of **reusable objects** that are expensive to create. Clients borrow
objects from the pool, use them, and return them instead of creating and destroying.

### When to Use
- Object creation is expensive (DB connections, threads, sockets)
- You need a bounded number of instances
- Objects are stateless or can be reset between uses

### Structure

```
+---------------------+        +-------------------+
|    ObjectPool<T>    |------->| PoolableObject    |
+---------------------+        +-------------------+
| - available: Queue  |        | + reset()         |
| - inUse: Set        |        | + isValid()       |
| - maxSize: int      |        +-------------------+
+---------------------+
| + acquire(): T      |
| + release(T): void  |
| + getPoolSize(): int|
+---------------------+
```

### Implementation -- Connection Pool

```java
public class ConnectionPool {
    private final Queue<Connection> available;
    private final Set<Connection> inUse;
    private final int maxSize;
    private final String jdbcUrl;

    public ConnectionPool(String jdbcUrl, int maxSize) {
        this.jdbcUrl   = jdbcUrl;
        this.maxSize   = maxSize;
        this.available = new ConcurrentLinkedQueue<>();
        this.inUse     = ConcurrentHashMap.newKeySet();
    }

    public synchronized Connection acquire() {
        Connection conn = available.poll();
        if (conn != null && conn.isValid()) {
            inUse.add(conn);
            return conn;
        }
        if (inUse.size() < maxSize) {
            conn = createNewConnection();
            inUse.add(conn);
            return conn;
        }
        throw new RuntimeException("Pool exhausted. Max size: " + maxSize);
    }

    public synchronized void release(Connection conn) {
        if (inUse.remove(conn)) {
            conn.reset();  // clear any state
            available.offer(conn);
        }
    }

    private Connection createNewConnection() {
        // Expensive operation -- this is why we pool
        return DriverManager.getConnection(jdbcUrl);
    }

    public int getAvailableCount() { return available.size(); }
    public int getInUseCount()     { return inUse.size(); }
}

// Usage
ConnectionPool pool = new ConnectionPool("jdbc:mysql://...", 20);
Connection conn = pool.acquire();
try {
    // use connection
} finally {
    pool.release(conn);  // always return to pool
}
```

### Real-World Pools
- `java.util.concurrent.ThreadPoolExecutor` -- thread pool
- HikariCP, Apache DBCP -- connection pools
- Apache Commons Pool -- generic object pooling

---

## 7. Dependency Injection Pattern

### What
Instead of a class creating its own dependencies, they are **injected from outside**.
This implements the Inversion of Control (IoC) principle -- "Don't call us, we'll call you."

### When to Use
- You want loose coupling between components
- You need to swap implementations (testing, different environments)
- You want to follow SOLID principles (especially Dependency Inversion)
- Framework-based applications (Spring, Guice)

### Three Forms of Injection

```
+-------------------------------------------+
|         Injection Types                    |
+-------------------------------------------+
|                                            |
|  Constructor     Setter       Interface    |
|  Injection       Injection    Injection    |
|                                            |
|  Required deps   Optional     Contract     |
|  Immutable       Mutable      Flexible     |
|  PREFERRED       Sometimes    Rare         |
+-------------------------------------------+
```

### Implementation -- All Three Forms

```java
// The dependency interface
public interface PaymentGateway {
    boolean charge(double amount, String token);
}

public class StripeGateway implements PaymentGateway {
    public boolean charge(double amount, String token) {
        // Stripe API call
        return true;
    }
}

public class PayPalGateway implements PaymentGateway {
    public boolean charge(double amount, String token) {
        // PayPal API call
        return true;
    }
}

// =============================================
// FORM 1: Constructor Injection (PREFERRED)
// =============================================
public class OrderService {
    private final PaymentGateway gateway;   // immutable

    // Dependency provided at construction time
    public OrderService(PaymentGateway gateway) {
        this.gateway = Objects.requireNonNull(gateway);
    }

    public boolean placeOrder(Order order) {
        return gateway.charge(order.getTotal(), order.getPaymentToken());
    }
}

// FORM 2: Setter Injection (optional dependency)
public class OrderService {
    private PaymentGateway gateway;

    public void setPaymentGateway(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public boolean placeOrder(Order order) {
        if (gateway == null) throw new IllegalStateException("No gateway");
        return gateway.charge(order.getTotal(), order.getPaymentToken());
    }
}

// FORM 3: Interface Injection (rare)
public interface PaymentGatewayAware {
    void injectPaymentGateway(PaymentGateway gateway);
}

public class OrderService implements PaymentGatewayAware {
    private PaymentGateway gateway;

    @Override
    public void injectPaymentGateway(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}
```

### Spring / Guice Context

```java
// Spring -- annotation-based DI
@Service
public class OrderService {
    private final PaymentGateway gateway;

    @Autowired  // Spring injects the correct implementation
    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}

// Guice -- module-based DI
public class PaymentModule extends AbstractModule {
    @Override
    protected void configure() {
        bind(PaymentGateway.class).to(StripeGateway.class);
    }
}

Injector injector = Guice.createInjector(new PaymentModule());
OrderService service = injector.getInstance(OrderService.class);
```

### Why Constructor Injection is Preferred

| Reason | Explanation |
|--------|-------------|
| Immutability | Dependencies are `final` -- cannot be changed after construction |
| Required deps are explicit | Compile-time check -- you cannot create the object without them |
| Testability | Pass a mock directly in the constructor |
| No partial initialization | Object is always in a valid state |

### IoC Principle

```
WITHOUT IoC:
  OrderService creates StripeGateway internally
  OrderService --> StripeGateway  (tight coupling)

WITH IoC:
  Container creates StripeGateway and injects it into OrderService
  OrderService --> PaymentGateway (interface)  (loose coupling)
                       ^
                  StripeGateway
```

### Interview Tip
"In any LLD problem, I inject dependencies through the constructor using interfaces.
This means I can swap the Strategy implementation (e.g., different pricing, different
payment gateway) without modifying the consuming class. It directly supports
Open-Closed Principle and makes the system testable."

---

## Creational Patterns -- Quick Reference Table

| Pattern | Intent | Key Clue in Problem |
|---------|--------|-------------------|
| Singleton | One instance globally | "shared", "single", "global access" |
| Factory Method | Create without specifying concrete class | "type depends on input" |
| Abstract Factory | Families of related objects | "platform", "theme", "cross-compatible" |
| Builder | Complex object step by step | "many optional params", "fluent API" |
| Prototype | Clone existing object | "expensive creation", "copy and modify" |
| Object Pool | Reuse expensive objects | "connection pool", "thread pool", "bounded" |
| Dependency Injection | Provide dependencies externally | "swap", "testable", "decouple" |

---

## Interview Power Moves

1. **Singleton + DI combo**: "I use Singleton scope for the connection pool but inject
   it via constructor so it remains testable."

2. **Factory + Strategy combo**: "The factory creates the right strategy implementation
   based on user input, then the strategy handles the algorithm."

3. **Builder for immutable models**: "All my domain objects use Builder to ensure
   immutability and clean construction -- similar to how Lombok's @Builder works."

4. **Object Pool in system design**: "For a rate limiter, I would pool the token bucket
   objects to avoid GC pressure under high throughput."
