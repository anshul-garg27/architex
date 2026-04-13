# SOLID Principles -- Deep Dive

> SOLID is the backbone of maintainable object-oriented design.
> Each principle addresses a specific kind of design rot.
> Violate one and you'll feel the pain during the first refactor.

```
  S ─── Single Responsibility    One class, one reason to change
  O ─── Open/Closed              Extend behavior without modifying source
  L ─── Liskov Substitution      Subtypes must honor the base type's contract
  I ─── Interface Segregation    Many small interfaces > one fat interface
  D ─── Dependency Inversion     Depend on abstractions, not concretions
```

---

## 1. SRP -- Single Responsibility Principle

> "A class should have one, and only one, reason to change."
> -- Robert C. Martin

### What It Means

A "reason to change" maps to a _stakeholder_ or _business concern_. If your class
changes when the accounting rules change AND when the database schema changes AND
when the report format changes, it has three responsibilities and three reasons to
change.

### How to Detect Violations

Ask yourself: **"This class manages X AND Y AND Z."** If you can fill in more than
one thing, it violates SRP.

Other red flags:
- Class name includes "And" or "Manager" or "Handler" (e.g., `OrderAndPaymentManager`)
- The class has 500+ lines
- The class imports from wildly different domains (DB driver + email client + PDF library)
- You can't describe what the class does in one sentence without using "and"

### Real-World Analogy

A chef who also does accounting AND serves tables AND washes dishes. When health
codes change, the chef's job changes. When tax law changes, the chef's job changes.
When the restaurant layout changes, the chef's job changes. Three unrelated reasons
to change, one overwhelmed human. Solution: hire a chef, an accountant, a server,
and a dishwasher.

### ASCII Diagram

```
  BEFORE (SRP violation):                  AFTER (SRP applied):

  ┌──────────────────────────┐            ┌──────────────┐
  │       Employee           │            │   Employee    │
  │                          │            │   (data only) │
  │ + calculatePay()         │            └──────┬────────┘
  │ + saveToDatabase()       │                   │ used by
  │ + generateReport()       │         ┌─────────┼──────────┐
  │ + sendEmail()            │         v         v          v
  └──────────────────────────┘   ┌───────────┐ ┌────────┐ ┌──────────────┐
                                 │PayCalc    │ │EmpRepo │ │ReportGen     │
  3 reasons to change:           │           │ │        │ │              │
  - pay rules change             │+calculate │ │+save() │ │+generate()   │
  - DB schema changes            │  Pay()    │ │+find() │ │+format()     │
  - report format changes        └───────────┘ └────────┘ └──────────────┘
                                 1 reason       1 reason    1 reason
```

### BAD Code -- SRP Violation

```java
// This class has THREE reasons to change:
// 1. Business rules for pay calculation change
// 2. Database technology or schema changes
// 3. Report format requirements change
public class Employee {
    private String name;
    private String department;
    private double hourlyRate;
    private int hoursWorked;

    // Responsibility 1: Business logic (pay calculation)
    public double calculatePay() {
        double basePay = hourlyRate * hoursWorked;
        if (hoursWorked > 40) {
            double overtimeHours = hoursWorked - 40;
            basePay += overtimeHours * hourlyRate * 0.5; // overtime premium
        }
        return basePay;
    }

    // Responsibility 2: Persistence (database access)
    public void saveToDatabase() {
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/hr");
        PreparedStatement stmt = conn.prepareStatement(
            "INSERT INTO employees (name, department, rate) VALUES (?, ?, ?)"
        );
        stmt.setString(1, name);
        stmt.setString(2, department);
        stmt.setDouble(3, hourlyRate);
        stmt.executeUpdate();
    }

    // Responsibility 3: Presentation (report generation)
    public String generateReport() {
        return String.format(
            "<html><body><h1>%s</h1><p>Dept: %s</p><p>Pay: $%.2f</p></body></html>",
            name, department, calculatePay()
        );
    }
}
```

### GOOD Code -- SRP Applied

```java
// Pure data + identity -- changes only if Employee model changes
public class Employee {
    private final String id;
    private String name;
    private String department;
    private double hourlyRate;
    private int hoursWorked;

    public Employee(String id, String name, String department,
                    double hourlyRate, int hoursWorked) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.hourlyRate = hourlyRate;
        this.hoursWorked = hoursWorked;
    }

    // Getters only -- state belongs to the domain model
    public String getName() { return name; }
    public String getDepartment() { return department; }
    public double getHourlyRate() { return hourlyRate; }
    public int getHoursWorked() { return hoursWorked; }
}

// Responsibility: pay calculation ONLY
public class PayCalculator {
    private static final int STANDARD_HOURS = 40;
    private static final double OVERTIME_MULTIPLIER = 1.5;

    public double calculatePay(Employee emp) {
        double basePay = emp.getHourlyRate() * Math.min(emp.getHoursWorked(), STANDARD_HOURS);
        if (emp.getHoursWorked() > STANDARD_HOURS) {
            int overtimeHours = emp.getHoursWorked() - STANDARD_HOURS;
            basePay += overtimeHours * emp.getHourlyRate() * OVERTIME_MULTIPLIER;
        }
        return basePay;
    }
}

// Responsibility: persistence ONLY
public class EmployeeRepository {
    private final DataSource dataSource;

    public EmployeeRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void save(Employee emp) {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO employees (id, name, department, rate, hours) VALUES (?,?,?,?,?)"
            );
            stmt.setString(1, emp.getId());
            stmt.setString(2, emp.getName());
            stmt.setString(3, emp.getDepartment());
            stmt.setDouble(4, emp.getHourlyRate());
            stmt.setInt(5, emp.getHoursWorked());
            stmt.executeUpdate();
        }
    }

    public Employee findById(String id) { /* ... */ }
}

// Responsibility: report generation ONLY
public class EmployeeReportGenerator {
    private final PayCalculator payCalculator;

    public EmployeeReportGenerator(PayCalculator payCalculator) {
        this.payCalculator = payCalculator;
    }

    public String generateHtmlReport(Employee emp) {
        double pay = payCalculator.calculatePay(emp);
        return String.format(
            "<html><body><h1>%s</h1><p>Dept: %s</p><p>Pay: $%.2f</p></body></html>",
            emp.getName(), emp.getDepartment(), pay
        );
    }
}
```

Now each class has exactly ONE reason to change. Tax law changes? Only `PayCalculator`
changes. Switch from MySQL to Postgres? Only `EmployeeRepository` changes.

---

## 2. OCP -- Open/Closed Principle

> "Software entities should be open for extension, but closed for modification."
> -- Bertrand Meyer (1988)

### What It Means

You should be able to add new behavior to a system WITHOUT changing existing,
tested, deployed code. New behavior = new code. Existing code stays untouched.

This is achieved via:
- **Polymorphism** (the primary mechanism)
- **Strategy Pattern** (inject different algorithms)
- **Decorator Pattern** (layer new behavior around existing objects)
- **Plugin architectures** (load new classes dynamically)

### How to Detect Violations

- `if/else` or `switch` chains that check types
- Adding a new type requires modifying 5 different files
- You grep for `instanceof` and find it everywhere
- Comments like `// TODO: add case for new type here`

### Real-World Analogy

A power strip with standard outlets. To add a new device (lamp, charger, fan), you
just plug it in. You never open the power strip and rewire it. The power strip is
CLOSED for modification but OPEN for extension (new devices).

### ASCII Diagram

```
  BEFORE (OCP violation):           AFTER (OCP applied):

  ┌─────────────────────┐          ┌────────────────────────────┐
  │  PaymentProcessor   │          │   <<interface>>            │
  │                     │          │   PaymentStrategy          │
  │ +process(type) {    │          │   +process(amount): Result │
  │   if CREDIT_CARD    │          └─────────────┬──────────────┘
  │   else if PAYPAL    │                ┌───────┼─────────┐
  │   else if BITCOIN   │                v       v         v
  │   else if STRIPE    │          ┌─────────┐ ┌──────┐ ┌─────────┐
  │   // ADD MORE HERE  │          │CreditCard│ │PayPal│ │ Bitcoin │
  │ }                   │          │Strategy  │ │Strat.│ │Strategy │
  └─────────────────────┘          └─────────┘ └──────┘ └─────────┘
                                   Add Stripe? New class. No changes above.
  Must MODIFY to extend.           EXTEND without modifying.
```

### BAD Code -- OCP Violation

```java
// Every new payment type requires MODIFYING this class
public class PaymentProcessor {

    public PaymentResult process(String paymentType, double amount, Map<String, String> details) {
        if ("CREDIT_CARD".equals(paymentType)) {
            // Credit card processing logic
            String cardNumber = details.get("cardNumber");
            String cvv = details.get("cvv");
            // ... validate, charge card
            return new PaymentResult(true, "CC-" + UUID.randomUUID());

        } else if ("PAYPAL".equals(paymentType)) {
            // PayPal processing logic
            String email = details.get("email");
            // ... redirect to PayPal, confirm
            return new PaymentResult(true, "PP-" + UUID.randomUUID());

        } else if ("BITCOIN".equals(paymentType)) {
            // Bitcoin processing logic
            String walletAddress = details.get("wallet");
            // ... generate invoice, wait for confirmation
            return new PaymentResult(true, "BTC-" + UUID.randomUUID());

        } else {
            throw new UnsupportedOperationException("Unknown payment type: " + paymentType);
        }
        // Adding Stripe? Apple Pay? Google Pay? Must modify this method every time.
    }
}
```

### GOOD Code -- OCP Applied

```java
// Step 1: Define the abstraction
public interface PaymentStrategy {
    PaymentResult process(double amount, Map<String, String> details);
    String getPaymentType();  // for registration/lookup
}

// Step 2: Implement each strategy as its own class
public class CreditCardPayment implements PaymentStrategy {
    @Override
    public PaymentResult process(double amount, Map<String, String> details) {
        String cardNumber = details.get("cardNumber");
        String cvv = details.get("cvv");
        // credit card specific logic...
        return new PaymentResult(true, "CC-" + UUID.randomUUID());
    }

    @Override
    public String getPaymentType() { return "CREDIT_CARD"; }
}

public class PayPalPayment implements PaymentStrategy {
    @Override
    public PaymentResult process(double amount, Map<String, String> details) {
        String email = details.get("email");
        // PayPal specific logic...
        return new PaymentResult(true, "PP-" + UUID.randomUUID());
    }

    @Override
    public String getPaymentType() { return "PAYPAL"; }
}

public class BitcoinPayment implements PaymentStrategy {
    @Override
    public PaymentResult process(double amount, Map<String, String> details) {
        String wallet = details.get("wallet");
        // Bitcoin specific logic...
        return new PaymentResult(true, "BTC-" + UUID.randomUUID());
    }

    @Override
    public String getPaymentType() { return "BITCOIN"; }
}

// Step 3: The processor is now CLOSED for modification
public class PaymentProcessor {
    private final Map<String, PaymentStrategy> strategies = new HashMap<>();

    public void registerStrategy(PaymentStrategy strategy) {
        strategies.put(strategy.getPaymentType(), strategy);
    }

    public PaymentResult process(String paymentType, double amount, Map<String, String> details) {
        PaymentStrategy strategy = strategies.get(paymentType);
        if (strategy == null) {
            throw new UnsupportedOperationException("No strategy for: " + paymentType);
        }
        return strategy.process(amount, details);
    }
}

// Step 4: Add Stripe WITHOUT touching ANY existing code
public class StripePayment implements PaymentStrategy {
    @Override
    public PaymentResult process(double amount, Map<String, String> details) {
        // Stripe specific logic...
        return new PaymentResult(true, "STRIPE-" + UUID.randomUUID());
    }

    @Override
    public String getPaymentType() { return "STRIPE"; }
}

// Registration (e.g., in Spring config or main method)
PaymentProcessor processor = new PaymentProcessor();
processor.registerStrategy(new CreditCardPayment());
processor.registerStrategy(new PayPalPayment());
processor.registerStrategy(new BitcoinPayment());
processor.registerStrategy(new StripePayment());  // just register -- nothing else changes
```

The transformation: from one monolithic method with an ever-growing `if/else` chain
to a set of small, focused strategy classes that can be added independently.

---

## 3. LSP -- Liskov Substitution Principle

> "If S is a subtype of T, then objects of type T may be replaced with objects
> of type S without altering any of the desirable properties of the program."
> -- Barbara Liskov (1987)

### What It Means

Any code that works correctly with a base type MUST also work correctly with any of
its subtypes. The subtype must honor the base type's _contract_, not just its _syntax_.

### The Rules

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Don't STRENGTHEN preconditions  (accept at least as much)    │
│ 2. Don't WEAKEN postconditions     (deliver at least as much)   │
│ 3. Maintain all invariants of the base type                     │
│ 4. No new exceptions not in the base type's contract            │
│ 5. History constraint: subtype can't change state in ways       │
│    the base type doesn't allow                                  │
└──────────────────────────────────────────────────────────────────┘
```

### How to Detect Violations

- Subclass throws `UnsupportedOperationException` for inherited methods
- Caller code does `instanceof` checks to handle different subtypes specially
- Overridden method ignores or contradicts the parent's documented behavior
- A "logical IS-A" that doesn't hold up as a "behavioral IS-A"

### Real-World Analogy

You hire a contractor (base type) who promises to "build a wall in 3 days." You send
a subcontractor (subtype) instead. If the subcontractor says "I can only build half a
wall" or "I need 10 days," that violates the contract. The subcontractor must deliver
at LEAST what the original contractor promised.

### Classic Violation: Square Extends Rectangle

```
  ┌──────────────┐
  │  Rectangle   │
  │              │
  │ +setWidth()  │
  │ +setHeight() │
  │ +area()      │
  └──────┬───────┘
         │
    ┌────┴────┐
    │ Square  │   <-- violates LSP!
    │         │
    │ setWidth() also sets height
    │ setHeight() also sets width
    └─────────┘
```

**BAD -- LSP Violation:**

```java
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int width)   { this.width = width; }
    public void setHeight(int height) { this.height = height; }

    public int getWidth()  { return width; }
    public int getHeight() { return height; }

    public int area() { return width * height; }
}

public class Square extends Rectangle {
    // Square must maintain width == height invariant
    @Override
    public void setWidth(int width) {
        this.width = width;
        this.height = width;  // surprise! Also changes height
    }

    @Override
    public void setHeight(int height) {
        this.width = height;  // surprise! Also changes width
        this.height = height;
    }
}

// This code works for Rectangle but BREAKS for Square
public void testRectangle(Rectangle r) {
    r.setWidth(5);
    r.setHeight(4);
    assert r.area() == 20;  // FAILS for Square! area() returns 16 (4*4)
}
```

The problem: `Rectangle`'s contract says width and height are _independent_.
`Square` violates this by coupling them. A `Square` IS-A `Rectangle` in geometry
but NOT in behavior.

### Another Violation: ReadOnlyList Extends MutableList

```java
public class ReadOnlyList<E> extends ArrayList<E> {
    @Override
    public boolean add(E element) {
        throw new UnsupportedOperationException("Cannot add to read-only list");
    }

    @Override
    public E remove(int index) {
        throw new UnsupportedOperationException("Cannot remove from read-only list");
    }
    // Every mutating method throws -- subtype BREAKS the base type's contract
}

// Code expecting List<E> will blow up at runtime
public void addDefaults(List<String> list) {
    list.add("default");  // throws UnsupportedOperationException!
}
```

### GOOD -- Fix with Separate Interfaces

```java
// Separate the contracts
public interface ReadableList<E> {
    E get(int index);
    int size();
    boolean contains(E element);
}

public interface WritableList<E> extends ReadableList<E> {
    void add(E element);
    E remove(int index);
}

// ArrayList implements both
public class ArrayList<E> implements WritableList<E> {
    @Override public E get(int index) { /* ... */ }
    @Override public int size() { /* ... */ }
    @Override public boolean contains(E element) { /* ... */ }
    @Override public void add(E element) { /* ... */ }
    @Override public E remove(int index) { /* ... */ }
}

// ImmutableList only implements ReadableList -- no contract violation
public class ImmutableList<E> implements ReadableList<E> {
    @Override public E get(int index) { /* ... */ }
    @Override public int size() { /* ... */ }
    @Override public boolean contains(E element) { /* ... */ }
    // No add() or remove() -- not part of the contract!
}

// Callers declare what they NEED:
public void printAll(ReadableList<String> list) {
    for (int i = 0; i < list.size(); i++) {
        System.out.println(list.get(i));
    }
    // Works with both ArrayList and ImmutableList -- LSP satisfied
}
```

### Fix for Square/Rectangle

```java
// Option 1: Make both implement a common read-only interface
public interface Shape {
    int area();
}

public class Rectangle implements Shape {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    @Override public int area() { return width * height; }
}

public class Square implements Shape {
    private final int side;

    public Square(int side) { this.side = side; }

    @Override public int area() { return side * side; }
}
// Neither extends the other. Both satisfy the Shape contract. LSP holds.
```

---

## 4. ISP -- Interface Segregation Principle

> "No client should be forced to depend on methods it does not use."
> -- Robert C. Martin

### What It Means

Fat interfaces that bundle unrelated methods force implementors to provide dummy or
throwing implementations for methods they don't need. Split fat interfaces into
small, focused ones.

### How to Detect Violations

- Implementations with methods that throw `UnsupportedOperationException`
- Implementations with empty method bodies (no-op methods)
- A class implements an interface but only uses 2 of its 10 methods
- The word "and" appears in the interface name or description

### Real-World Analogy

**Swiss Army knife** vs **specialized tools.** A Swiss Army knife forces you to carry
a corkscrew, scissors, and a saw even if you only need a blade. A specialized chef's
knife does one thing perfectly. In software, a fat interface is a Swiss Army knife
that forces every implementor to deal with every blade.

### ASCII Diagram

```
  BEFORE (ISP violation):               AFTER (ISP applied):

  ┌─────────────────────┐       ┌──────────┐  ┌──────────┐  ┌──────────┐
  │  <<interface>>      │       │Workable  │  │Feedable  │  │Sleepable │
  │     Worker          │       │          │  │          │  │          │
  │                     │       │ +work()  │  │ +eat()   │  │ +sleep() │
  │ +work()             │       └────┬─────┘  └────┬─────┘  └────┬─────┘
  │ +eat()              │            │             │             │
  │ +sleep()            │            │             │             │
  └──────┬──────────────┘       ┌────┴─────┐   ┌──┴──┐    ┌────┴─────┐
         │                      │HumanWorker│  │Human │    │Human     │
    ┌────┴─────┐                │implements │  │Worker│    │Worker    │
    │ Robot    │                │Workable   │  │impl. │    │impl.     │
    │          │                │+Feedable  │  │Feed. │    │Sleepable │
    │ +work() OK               │+Sleepable │  └──────┘    └──────────┘
    │ +eat()  ???               └───────────┘
    │ +sleep() ???              ┌────────────┐
    └──────────┘                │RobotWorker │
                                │implements  │
    Robot is FORCED to          │Workable    │  <-- only what it needs!
    implement eat() and         │            │
    sleep() it can't do.        │ +work() OK │
                                └────────────┘
```

### BAD Code -- ISP Violation

```java
// Fat interface -- forces ALL implementors to handle everything
public interface Worker {
    void work();
    void eat();
    void sleep();
    void attendMeeting();
    void writeReport();
}

public class HumanEmployee implements Worker {
    @Override public void work()          { /* productive work */ }
    @Override public void eat()           { /* lunch break */ }
    @Override public void sleep()         { /* go home and rest */ }
    @Override public void attendMeeting() { /* attend standup */ }
    @Override public void writeReport()   { /* weekly report */ }
}

public class RobotWorker implements Worker {
    @Override public void work()          { /* assemble parts */ }
    @Override public void eat()           { throw new UnsupportedOperationException(); }  // !!!
    @Override public void sleep()         { throw new UnsupportedOperationException(); }  // !!!
    @Override public void attendMeeting() { throw new UnsupportedOperationException(); }  // !!!
    @Override public void writeReport()   { /* generate log */ }
}

public class Intern implements Worker {
    @Override public void work()          { /* learn things */ }
    @Override public void eat()           { /* free lunch! */ }
    @Override public void sleep()         { /* nap at desk */ }
    @Override public void attendMeeting() { throw new UnsupportedOperationException(); } // !!!
    @Override public void writeReport()   { throw new UnsupportedOperationException(); } // !!!
}
```

### GOOD Code -- ISP Applied

```java
// Segregated interfaces -- each client depends only on what it needs
public interface Workable {
    void work();
}

public interface Feedable {
    void eat();
}

public interface Sleepable {
    void sleep();
}

public interface MeetingAttendee {
    void attendMeeting();
}

public interface ReportWriter {
    void writeReport();
}

// Each class implements ONLY what it can actually do
public class HumanEmployee implements Workable, Feedable, Sleepable,
                                      MeetingAttendee, ReportWriter {
    @Override public void work()          { /* productive work */ }
    @Override public void eat()           { /* lunch break */ }
    @Override public void sleep()         { /* go home and rest */ }
    @Override public void attendMeeting() { /* attend standup */ }
    @Override public void writeReport()   { /* weekly report */ }
}

public class RobotWorker implements Workable, ReportWriter {
    @Override public void work()        { /* assemble parts */ }
    @Override public void writeReport() { /* generate log */ }
    // No eat(), sleep(), attendMeeting() -- not part of its contract!
}

public class Intern implements Workable, Feedable, Sleepable {
    @Override public void work()  { /* learn things */ }
    @Override public void eat()   { /* free lunch! */ }
    @Override public void sleep() { /* nap at desk */ }
    // No attendMeeting(), writeReport() -- not expected of an intern
}

// Callers depend only on what they need:
public class LunchScheduler {
    public void scheduleLunch(List<Feedable> feedableWorkers) {
        for (Feedable f : feedableWorkers) {
            f.eat();  // guaranteed to work -- no UnsupportedOperationException
        }
    }
}

public class AssemblyLine {
    public void runShift(List<Workable> workers) {
        for (Workable w : workers) {
            w.work();  // works for both HumanEmployee and RobotWorker
        }
    }
}
```

---

## 5. DIP -- Dependency Inversion Principle

> "High-level modules should not depend on low-level modules. Both should
> depend on abstractions."
> "Abstractions should not depend on details. Details should depend on
> abstractions."
> -- Robert C. Martin

### What It Means

Traditional layered design has high-level business logic depending on low-level
infrastructure (database, file system, network). DIP INVERTS this: both layers
depend on an abstraction (interface) owned by the high-level layer.

### ASCII Diagram

```
  BEFORE (dependency flows down):       AFTER (dependency inverted):

  ┌────────────────────┐               ┌────────────────────┐
  │  OrderService      │               │  OrderService      │
  │  (high-level)      │               │  (high-level)      │
  │                    │               │                    │
  │  depends on ───────┤               │  depends on ───────────┐
  └────────────────────┘               └────────────────────┘   │
           │                                                     │
           │ direct dependency                                   v
           v                                   ┌──────────────────────────┐
  ┌────────────────────┐                       │  <<interface>>           │
  │  MySQLDatabase     │                       │  OrderRepository         │
  │  (low-level)       │                       │  +save(Order)           │
  └────────────────────┘                       │  +findById(String)      │
                                               └──────────┬──────────────┘
  OrderService is WELDED                                   │
  to MySQL. Can't test                         ┌───────────┴──────────┐
  without a real DB.                           v                      v
                                    ┌──────────────────┐  ┌──────────────────┐
                                    │MySQLOrderRepo    │  │InMemoryOrderRepo │
                                    │(production)      │  │(testing)         │
                                    └──────────────────┘  └──────────────────┘

                                    OrderService depends on ABSTRACTION.
                                    Implementation is injected from outside.
```

### How to Detect Violations

- `new ConcreteClass()` inside high-level business logic
- Imports from infrastructure packages (JDBC, HTTP client) in domain classes
- Cannot unit test a class without spinning up a database/server
- Changing the database driver requires changing business logic classes

### Real-World Analogy

A lamp (high-level) should not be hard-wired to a specific power plant (low-level).
Both depend on an abstraction: the electrical outlet standard. You can plug ANY lamp
into ANY outlet, and any power source (coal, solar, nuclear) can feed ANY outlet.
The outlet interface decouples producer from consumer.

### Dependency Injection -- Three Types

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Constructor Injection (PREFERRED)                           │
│     Dependencies passed through constructor.                    │
│     Object is always in a valid state.                          │
│                                                                 │
│  2. Setter Injection                                            │
│     Dependencies set via setter methods.                        │
│     Allows changing dependencies after construction.            │
│     Risk: object may be used before dependencies are set.       │
│                                                                 │
│  3. Interface Injection                                         │
│     Class implements an injector interface.                     │
│     Rare in practice. Mostly historical.                        │
└─────────────────────────────────────────────────────────────────┘
```

### BAD Code -- DIP Violation

```java
// High-level service is DIRECTLY coupled to low-level MySQL implementation
public class OrderService {
    // Direct dependency on concrete class -- cannot swap, cannot test
    private final MySQLDatabase database = new MySQLDatabase("jdbc:mysql://prod:3306/orders");
    private final SmtpEmailSender emailSender = new SmtpEmailSender("smtp.company.com");

    public void placeOrder(Order order) {
        // Business logic
        order.validate();
        order.calculateTotal();

        // Directly calls MySQL -- what if we switch to Postgres? Change this class.
        database.execute("INSERT INTO orders ...", order.toParams());

        // Directly calls SMTP -- what if we switch to SendGrid? Change this class.
        emailSender.send(order.getCustomerEmail(), "Order Confirmed",
                         "Your order #" + order.getId() + " is placed.");
    }
}

// Testing requires a REAL MySQL database and a REAL SMTP server running.
// Slow, brittle, and impossible in CI without infrastructure.
```

### GOOD Code -- DIP Applied

```java
// Step 1: Define abstractions (owned by the high-level layer)
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(String orderId);
    List<Order> findByCustomer(String customerId);
}

public interface NotificationService {
    void sendOrderConfirmation(Order order);
}

// Step 2: High-level service depends ONLY on abstractions
public class OrderService {
    private final OrderRepository orderRepository;       // abstraction
    private final NotificationService notificationService; // abstraction

    // Constructor injection -- dependencies provided from outside
    public OrderService(OrderRepository orderRepository,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }

    public void placeOrder(Order order) {
        order.validate();
        order.calculateTotal();
        orderRepository.save(order);                     // abstraction call
        notificationService.sendOrderConfirmation(order); // abstraction call
    }
}

// Step 3: Low-level implementations depend on the same abstractions
public class MySQLOrderRepository implements OrderRepository {
    private final DataSource dataSource;

    public MySQLOrderRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void save(Order order) {
        try (Connection conn = dataSource.getConnection()) {
            PreparedStatement stmt = conn.prepareStatement(
                "INSERT INTO orders (id, customer_id, total) VALUES (?, ?, ?)"
            );
            stmt.setString(1, order.getId());
            stmt.setString(2, order.getCustomerId());
            stmt.setBigDecimal(3, order.getTotal());
            stmt.executeUpdate();
        }
    }

    @Override
    public Optional<Order> findById(String orderId) { /* ... */ }

    @Override
    public List<Order> findByCustomer(String customerId) { /* ... */ }
}

public class EmailNotificationService implements NotificationService {
    private final EmailClient emailClient;

    public EmailNotificationService(EmailClient emailClient) {
        this.emailClient = emailClient;
    }

    @Override
    public void sendOrderConfirmation(Order order) {
        emailClient.send(
            order.getCustomerEmail(),
            "Order Confirmed",
            "Your order #" + order.getId() + " has been placed."
        );
    }
}

// Step 4: In tests, inject fakes/mocks -- no infrastructure needed
public class InMemoryOrderRepository implements OrderRepository {
    private final Map<String, Order> store = new HashMap<>();

    @Override
    public void save(Order order) { store.put(order.getId(), order); }

    @Override
    public Optional<Order> findById(String orderId) {
        return Optional.ofNullable(store.get(orderId));
    }

    @Override
    public List<Order> findByCustomer(String customerId) {
        return store.values().stream()
            .filter(o -> o.getCustomerId().equals(customerId))
            .collect(Collectors.toList());
    }
}

// Test -- fast, no infrastructure
@Test
void placeOrder_savesAndNotifies() {
    InMemoryOrderRepository repo = new InMemoryOrderRepository();
    FakeNotificationService notifications = new FakeNotificationService();
    OrderService service = new OrderService(repo, notifications);

    service.placeOrder(new Order("ORD-1", "CUST-1", BigDecimal.valueOf(99.99)));

    assertTrue(repo.findById("ORD-1").isPresent());
    assertEquals(1, notifications.getSentCount());
}
```

### IoC Containers

In real applications, you don't wire dependencies manually. IoC (Inversion of
Control) containers do it for you:

```java
// Spring Framework -- annotations handle wiring
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final NotificationService notificationService;

    @Autowired  // Spring injects the right implementations
    public OrderService(OrderRepository orderRepository,
                        NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.notificationService = notificationService;
    }
}

@Repository
public class MySQLOrderRepository implements OrderRepository { /* ... */ }

@Component
public class EmailNotificationService implements NotificationService { /* ... */ }
```

Other IoC containers: **Google Guice**, **Dagger** (Android), **CDI** (Jakarta EE).

---

## SOLID at a Glance

```
┌─────────┬──────────────────────────────┬─────────────────────────────────┐
│Principle│ Violation Smell              │ Fix                             │
├─────────┼──────────────────────────────┼─────────────────────────────────┤
│ SRP     │ Class does X AND Y AND Z    │ Split into focused classes      │
│ OCP     │ if/else chain for types     │ Polymorphism + Strategy pattern │
│ LSP     │ Subclass throws/breaks      │ Separate interfaces, fix model  │
│ ISP     │ Implementor has no-op/throw │ Split fat interface             │
│ DIP     │ new ConcreteClass() in logic│ Inject abstractions via ctor    │
└─────────┴──────────────────────────────┴─────────────────────────────────┘
```

### Interview Tip

When asked about SOLID in an interview, don't just recite definitions. Pick ONE
principle and walk through a concrete before/after transformation. Show the BAD
code, explain WHY it's bad (what breaks when requirements change), then show the
GOOD code and explain how it handles the same change gracefully. The interviewer
wants to see that you can _apply_ the principles, not just name them.
