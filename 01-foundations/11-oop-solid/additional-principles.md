# Additional OOP Design Principles

> Beyond SOLID, these principles form the complete toolkit for writing
> clean, maintainable, and flexible object-oriented code.

---

## 1. Composition over Inheritance

> "Favor object composition over class inheritance."
> -- Gang of Four (Design Patterns, 1994)

### HAS-A vs IS-A

```
  Inheritance (IS-A):               Composition (HAS-A):

  ┌──────────────┐                  ┌──────────────┐
  │   Vehicle     │                  │   Car        │
  └──────┬───────┘                  │              │
         │ IS-A                     │ -engine: Engine       ◆── Engine
  ┌──────┴───────┐                  │ -transmission: Trans  ◆── Transmission
  │   Car        │                  │ -stereo: Stereo       ◆── Stereo
  └──────────────┘                  └──────────────┘

  Car IS-A Vehicle                  Car HAS-A Engine, Transmission, Stereo
  (rigid, compile-time)             (flexible, runtime-swappable)
```

**When to use composition:**
- You need to combine behaviors from multiple sources
- The relationship is about _capability_, not _identity_
- You want to swap behavior at runtime (Strategy pattern)
- The "IS-A" test feels forced or breaks LSP

**When inheritance IS still valid:**
- True, unbreakable IS-A relationship (Dog IS-A Animal)
- Framework extension points designed for it (HttpServlet, JUnit TestCase)
- Template Method pattern where the base class defines the skeleton

### Strategy Pattern as Composition in Action

```java
// Instead of inheriting different sorting behaviors...
public class DataProcessor {
    private final SortStrategy sortStrategy;     // HAS-A
    private final FilterStrategy filterStrategy; // HAS-A

    public DataProcessor(SortStrategy sort, FilterStrategy filter) {
        this.sortStrategy = sort;
        this.filterStrategy = filter;
    }

    public List<Record> process(List<Record> data) {
        List<Record> filtered = filterStrategy.filter(data);
        return sortStrategy.sort(filtered);
    }
}

// Swap algorithms at RUNTIME -- impossible with inheritance
DataProcessor fast = new DataProcessor(new QuickSort(), new ThresholdFilter(100));
DataProcessor stable = new DataProcessor(new MergeSort(), new RegexFilter("^ERR.*"));
```

---

## 2. Program to an Interface, Not an Implementation

> "Declare variables, parameters, and return types as the most abstract type
> that still makes the code correct."

### The Rule

```java
// BAD -- coupled to concrete implementation
ArrayList<String> names = new ArrayList<>();
HashMap<String, User> users = new HashMap<>();

// GOOD -- program to the interface
List<String> names = new ArrayList<>();
Map<String, User> users = new HashMap<>();
```

### Benefits

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Flexibility: swap ArrayList for LinkedList in one place   │
│ 2. Testability: inject mocks/fakes that implement interface  │
│ 3. Decoupling: caller doesn't know or care about impl       │
│ 4. API stability: implementation can change; interface stays │
└──────────────────────────────────────────────────────────────┘
```

### In Method Signatures

```java
// BAD: Forces callers to use ArrayList specifically
public ArrayList<Order> getOrders() { ... }

// GOOD: Returns the abstraction; impl is an internal detail
public List<Order> getOrders() { ... }

// EVEN BETTER when callers only iterate:
public Iterable<Order> getOrders() { ... }

// Or for truly read-only:
public Collection<Order> getOrders() {
    return Collections.unmodifiableCollection(orders);
}
```

---

## 3. Law of Demeter (Principle of Least Knowledge)

> "Only talk to your immediate friends. Don't talk to strangers."

### The Rule

A method M of object O should only call methods on:
1. O itself
2. M's parameters
3. Objects created within M
4. O's direct fields

### Train Wreck (Violation)

```java
// BAD: "train wreck" -- chaining through multiple objects
String city = order.getCustomer().getAddress().getCity();

// Each dot is a coupling point. If Address changes, THIS code breaks.
// order -> customer -> address -> city  (3 levels of coupling)
```

### Fix: Tell, Don't Ask (delegate down)

```java
// GOOD: Ask the order directly. Let it delegate internally.
String city = order.getShippingCity();

// Inside Order:
public String getShippingCity() {
    return customer.getShippingCity();  // delegate to Customer
}

// Inside Customer:
public String getShippingCity() {
    return address.getCity();  // only Customer knows about Address
}
```

### When the Law of Demeter Does NOT Apply

- Fluent APIs / builders: `builder.withName("X").withAge(30).build()` -- this is fine
  because the builder returns itself, not different objects.
- Data Transfer Objects (DTOs): `response.getData().getItems()` -- DTOs are just data
  containers with no behavior to protect.

---

## 4. Tell, Don't Ask

> "Tell objects what to do. Don't ask them for data and do things yourself."

### The Principle

Instead of interrogating an object's state and making decisions externally, tell
the object to make the decision itself. This keeps behavior with the data it
operates on (encapsulation).

```java
// BAD: Ask-then-decide (logic outside the object)
if (account.getBalance() >= amount
    && account.getStatus() == AccountStatus.ACTIVE
    && !account.isFrozen()) {
    account.setBalance(account.getBalance() - amount);
}

// GOOD: Tell (logic inside the object)
account.withdraw(amount);
// The account knows its own rules for withdrawal
```

### Command Objects as "Tell"

```java
// Instead of asking for state and deciding externally, send a command
public class TransferCommand {
    private final Account from;
    private final Account to;
    private final Money amount;

    public TransferCommand(Account from, Account to, Money amount) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    public void execute() {
        from.withdraw(amount);
        to.deposit(amount);
    }
}
```

---

## 5. DRY vs WET -- When DRY Goes Too Far

> **DRY:** Don't Repeat Yourself
> **WET:** Write Everything Twice (or: We Enjoy Typing)

### DRY Is About Knowledge, Not Code

Two pieces of code that _look_ identical but represent _different_ business concepts
should NOT be merged. DRY is about avoiding duplication of _knowledge/rules_, not
syntactic duplication.

```java
// These look identical but serve DIFFERENT purposes:

// Tax calculation for US orders
double usTax = subtotal * 0.08;

// Shipping surcharge for heavy items
double surcharge = weight * 0.08;

// WRONG to extract: calculateEightPercent(value)
// These 0.08 values will change INDEPENDENTLY.
// US tax rate might become 0.09. Surcharge might become 0.10.
// Merging them creates false coupling.
```

### When DRY Goes Too Far (Premature Abstraction)

```java
// OVER-DRY: Forced abstraction that obscures intent
public class GenericProcessor<T, R> {
    private final Function<T, Boolean> validator;
    private final Function<T, R> transformer;
    private final Consumer<R> persister;
    // ... so generic it's impossible to understand what it does
}

// BETTER: Two clear, specific classes even if they share some structure
public class OrderProcessor { /* clear, focused, easy to understand */ }
public class RefundProcessor { /* clear, focused, easy to understand */ }
```

**The rule of three:** Don't abstract until you have three real instances of
duplication. Two might be coincidence. Three is a pattern.

---

## 6. YAGNI -- You Aren't Gonna Need It

> "Always implement things when you actually need them, never when you
> just foresee that you might need them."
> -- Ron Jeffries

### What It Means

Don't build features, abstractions, or extension points for _hypothetical_ future
requirements. Build for what you need TODAY. Refactor when the future arrives.

```java
// YAGNI violation: building for hypothetical multi-database support on day 1
// when you ONLY use PostgreSQL and have no plans to change
public interface DatabaseAdapter { }
public class PostgresAdapter implements DatabaseAdapter { }
public class MySQLAdapter implements DatabaseAdapter { }     // nobody asked for this
public class MongoAdapter implements DatabaseAdapter { }     // nobody asked for this
public class DatabaseAdapterFactory { }                      // unnecessary indirection

// YAGNI-compliant: just use Postgres directly
// When (IF) you actually need MySQL support, THEN add the abstraction
public class OrderRepository {
    private final JdbcTemplate jdbc;  // Postgres behind the scenes, simple
}
```

**Note:** YAGNI does NOT mean skip good design. If DIP says you should depend on an
interface for testability, that's a real present need, not a hypothetical future one.

---

## 7. KISS -- Keep It Simple, Stupid

> The simplest solution that works is the best solution.

### What It Means

Complexity is the enemy of reliability. Every abstraction, pattern, and framework you
add must carry its weight. If a simple `if/else` solves the problem and there are only
two cases, don't build a Strategy pattern with a factory and a registry.

```java
// OVER-ENGINEERED for a simple feature flag:
public interface FeatureFlagStrategy { boolean isEnabled(); }
public class FeatureFlagFactory { }
public class FeatureFlagRegistry { }
public class FeatureFlagAspect { }

// KISS:
boolean showNewDashboard = config.getBoolean("feature.new-dashboard", false);
```

### KISS Does NOT Mean

- Skip error handling
- Write spaghetti code
- Avoid patterns when they genuinely simplify
- Ignore edge cases

It means: don't add complexity unless you have a clear, present reason.

---

## 8. Command-Query Separation (CQS)

> "Every method should either be a command that performs an action,
> or a query that returns data to the caller, but not both."
> -- Bertrand Meyer

### The Two Categories

```
┌──────────────────────────────────────────────────────────────┐
│  COMMAND (mutator):                                          │
│    - Changes state (side effect)                             │
│    - Returns void                                            │
│    - Examples: save(), delete(), transfer(), enqueue()       │
│                                                              │
│  QUERY (accessor):                                           │
│    - Returns data                                            │
│    - No side effects (calling it twice gives same result)    │
│    - Examples: getBalance(), findById(), count(), isEmpty()  │
└──────────────────────────────────────────────────────────────┘
```

### Violation

```java
// BAD: mix of command and query
public int deleteOldRecords() {
    // Deletes records (command) AND returns count (query)
    // Side effect: calling it twice gives different results
    int count = db.execute("DELETE FROM logs WHERE age > 30");
    return count;
}
```

### CQS-Compliant

```java
// COMMAND: changes state, returns void
public void deleteOldRecords() {
    db.execute("DELETE FROM logs WHERE age > 30");
}

// QUERY: returns data, no side effects
public int countOldRecords() {
    return db.queryForInt("SELECT COUNT(*) FROM logs WHERE age > 30");
}
```

### Exception: Stack.pop()

`Stack.pop()` both removes an element (command) and returns it (query). This is a
pragmatic exception because splitting it into two operations would create a race
condition in concurrent code. CQS is a guideline, not an absolute law.

---

## 9. Design by Contract (DbC)

> "Software components should define precise, verifiable interface
> specifications using preconditions, postconditions, and invariants."
> -- Bertrand Meyer (Eiffel language, 1986)

### The Three Elements

```
┌──────────────────────────────────────────────────────────────┐
│  PRECONDITIONS:   What must be true BEFORE the method runs   │
│                   (caller's responsibility)                  │
│                                                              │
│  POSTCONDITIONS:  What will be true AFTER the method runs    │
│                   (callee's guarantee)                       │
│                                                              │
│  INVARIANTS:      What must ALWAYS be true about the object  │
│                   (before and after every public method)      │
└──────────────────────────────────────────────────────────────┘
```

### Example

```java
public class BankAccount {
    private double balance;  // INVARIANT: balance >= 0

    /**
     * Withdraw money from the account.
     *
     * PRECONDITION:  amount > 0 && amount <= balance
     * POSTCONDITION: balance == old(balance) - amount
     * INVARIANT:     balance >= 0
     */
    public void withdraw(double amount) {
        // Check precondition
        if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
        if (amount > balance) throw new IllegalArgumentException("Insufficient funds");

        double oldBalance = balance;
        balance -= amount;

        // Check postcondition (in debug/test builds)
        assert balance == oldBalance - amount : "Postcondition violated";
        // Invariant: balance >= 0 is guaranteed because amount <= balance
    }
}
```

### Connection to LSP

Liskov Substitution Principle IS Design by Contract for subtypes:
- Subtypes must accept at least the same preconditions (don't strengthen)
- Subtypes must deliver at least the same postconditions (don't weaken)
- Subtypes must maintain all invariants of the base type

---

## 10. Hollywood Principle

> "Don't call us, we'll call you."

### What It Means

High-level components control the flow. Low-level components provide hooks that
the framework calls when needed. This is the essence of Inversion of Control (IoC).

### Examples

```
┌──────────────────────────────────────────────────────────────────┐
│  Pattern              │  "We'll call you" mechanism              │
├───────────────────────┼──────────────────────────────────────────┤
│  Template Method      │  Abstract methods filled in by subclass  │
│  Observer/Listener    │  Framework notifies registered listeners │
│  Dependency Injection │  Container calls constructor with deps   │
│  Servlet lifecycle    │  Container calls init(), service()       │
│  React components     │  Framework calls render(), useEffect()   │
│  JUnit test runner    │  Runner calls @Test methods              │
└──────────────────────────────────────────────────────────────────┘
```

### Template Method Example

```java
// Framework defines the skeleton; subclasses fill in the blanks
public abstract class DataImporter {

    // Template method -- defines the algorithm skeleton
    public final void importData() {
        Connection conn = openConnection();       // step 1
        RawData data = fetchRawData(conn);        // step 2
        List<Record> records = parseData(data);   // step 3 (abstract)
        validate(records);                        // step 4 (abstract)
        save(records);                            // step 5
        closeConnection(conn);                    // step 6
    }

    // Subclasses provide ONLY the varying parts
    protected abstract List<Record> parseData(RawData data);
    protected abstract void validate(List<Record> records);

    // Common steps stay in the base class
    private Connection openConnection() { /* ... */ }
    private RawData fetchRawData(Connection conn) { /* ... */ }
    private void save(List<Record> records) { /* ... */ }
    private void closeConnection(Connection conn) { /* ... */ }
}

public class CsvImporter extends DataImporter {
    @Override
    protected List<Record> parseData(RawData data) { /* CSV parsing */ }

    @Override
    protected void validate(List<Record> records) { /* CSV-specific validation */ }
}
```

The framework (_DataImporter_) calls the subclass. The subclass never calls the
framework methods directly. "Don't call us, we'll call you."

---

## 11. Separation of Concerns (SoC)

> "Each module should address a separate concern."
> -- Edsger W. Dijkstra (1974)

### What It Means

Organize code so that each unit (class, module, layer, service) handles one
well-defined aspect of the system. Related concerns go together. Unrelated
concerns stay apart.

### Classic Layered Architecture as SoC

```
  ┌──────────────────────────────────┐
  │    Presentation Layer            │  Concern: UI / API responses
  │    (Controllers, Views)          │
  ├──────────────────────────────────┤
  │    Business Logic Layer          │  Concern: Domain rules
  │    (Services, Domain Models)     │
  ├──────────────────────────────────┤
  │    Data Access Layer             │  Concern: Persistence
  │    (Repositories, DAOs)          │
  ├──────────────────────────────────┤
  │    Infrastructure Layer          │  Concern: External systems
  │    (Messaging, File I/O, APIs)   │
  └──────────────────────────────────┘
```

### SoC in Practice

```java
// EACH class handles ONE concern

// Concern: HTTP request/response handling
@RestController
public class OrderController {
    private final OrderService orderService;
    // Handles HTTP, delegates to business logic
}

// Concern: Business rules and orchestration
@Service
public class OrderService {
    private final OrderRepository repo;
    private final PaymentGateway payments;
    // Enforces business rules, delegates to persistence and payments
}

// Concern: Data persistence
@Repository
public class JpaOrderRepository implements OrderRepository {
    // Handles SQL/JPA, nothing else
}

// Concern: External payment integration
@Component
public class StripePaymentGateway implements PaymentGateway {
    // Handles Stripe API, nothing else
}
```

### Cross-Cutting Concerns

Some concerns span multiple layers (logging, security, transactions). Handle
these with Aspect-Oriented Programming (AOP), middleware, or decorators -- not
by mixing them into every class.

```java
// Instead of this in every service method:
public void placeOrder(Order order) {
    logger.info("placeOrder called");          // logging -- cross-cutting
    securityContext.checkPermission("ORDERS"); // security -- cross-cutting
    transactionManager.begin();                // transaction -- cross-cutting
    // ... actual business logic ...
    transactionManager.commit();
}

// Use AOP / annotations:
@Transactional
@Secured("ROLE_ORDER_MANAGER")
@Logged
public void placeOrder(Order order) {
    // ONLY business logic here -- concerns are separated
    order.validate();
    orderRepository.save(order);
    notificationService.sendConfirmation(order);
}
```

---

## Quick Reference Table

```
┌────────────────────────┬───────────────────────────────────────────────────┐
│ Principle              │ One-liner                                        │
├────────────────────────┼───────────────────────────────────────────────────┤
│ Composition > Inherit. │ HAS-A is more flexible than IS-A                 │
│ Program to Interface   │ Depend on types, not implementations             │
│ Law of Demeter         │ Only talk to your immediate friends              │
│ Tell Don't Ask         │ Send commands, don't interrogate state           │
│ DRY                    │ Don't duplicate knowledge (not just code)        │
│ YAGNI                  │ Build for today's needs, not tomorrow's guesses  │
│ KISS                   │ Simplest working solution wins                   │
│ CQS                    │ Methods either change state OR return data       │
│ Design by Contract     │ Preconditions + postconditions + invariants      │
│ Hollywood Principle    │ Don't call us, we'll call you (IoC)              │
│ Separation of Concerns │ One module, one concern                          │
└────────────────────────┴───────────────────────────────────────────────────┘
```

### How These Principles Relate

```
  SOLID
    │
    ├── SRP ─────────── Separation of Concerns (SoC is SRP at architecture scale)
    ├── OCP ─────────── Composition over Inheritance (extend via composition)
    ├── LSP ─────────── Design by Contract (subtypes honor contracts)
    ├── ISP ─────────── Program to an Interface (small, focused interfaces)
    └── DIP ─────────── Hollywood Principle (IoC is DIP in practice)
                │
                ├── KISS ←→ YAGNI (both fight unnecessary complexity)
                └── DRY ←→ Tell Don't Ask (both fight scattered logic)
```

### Interview Tip

If an interviewer asks "What design principles do you follow?", don't list all 15.
Pick 3-4 that you have genuinely applied and explain a concrete situation:

> "I follow SOLID, especially DIP -- I always inject dependencies through constructors
> for testability. I favor composition over inheritance because it's more flexible. And
> I try to respect YAGNI -- I've seen too many codebases bloated with abstractions that
> nobody ever used."

Concrete experience beats textbook recitation.
