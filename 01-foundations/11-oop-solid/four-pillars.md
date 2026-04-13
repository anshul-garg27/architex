# The Four Pillars of Object-Oriented Programming

> Master these four concepts and you master the foundation of every OOP language,
> every design pattern, and every SOLID principle.

```
                    ┌─────────────────────────────┐
                    │     OBJECT-ORIENTED          │
                    │      PROGRAMMING             │
                    └──────────┬──────────────────-┘
           ┌──────────┬───────┴───────┬──────────────┐
           v          v               v              v
    ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
    │Encapsulation│ │ Abstraction│ │Inheritance │ │Polymorphism│
    │             │ │            │ │            │ │            │
    │ Hide data,  │ │ Hide       │ │ Reuse code │ │ One        │
    │ expose API  │ │ complexity │ │ via IS-A   │ │ interface, │
    │             │ │            │ │            │ │ many forms │
    └────────────┘ └────────────┘ └────────────┘ └────────────┘
```

---

## 1. Encapsulation

### What Is It?

Encapsulation bundles data (fields) and the methods that operate on that data into a
single unit (a class), then restricts direct access to some of the object's components.
The outside world interacts only through a well-defined public API.

**Real-world analogy:** A car dashboard. You see the speedometer, steering wheel, and
pedals. You never directly touch the fuel injectors, transmission gears, or engine
timing. The dashboard _encapsulates_ the engine's complexity behind a controlled
interface.

### Access Modifiers in Java

```
┌──────────────┬───────┬─────────┬──────────┬───────┐
│   Modifier   │ Class │ Package │ Subclass │ World │
├──────────────┼───────┼─────────┼──────────┼───────┤
│ private      │  YES  │   NO    │    NO    │  NO   │
│ (default)    │  YES  │   YES   │    NO    │  NO   │  <-- "package-private"
│ protected    │  YES  │   YES   │   YES    │  NO   │
│ public       │  YES  │   YES   │   YES    │  YES  │
└──────────────┴───────┴─────────┴──────────┴───────┘
```

**Rule of thumb:** Start with `private`. Widen access only when you have a concrete reason.

### Information Hiding Principle (Parnas, 1972)

Every module should hide a design decision behind a stable interface. When that
decision changes, only the module's internals change -- callers are unaffected. This is
the _reason_ encapsulation exists. Access modifiers are the mechanism; information
hiding is the goal.

### Getters/Setters vs Direct Access

Getters and setters are NOT the point of encapsulation. Blindly generating
`getX()` / `setX()` for every field is just public access with extra steps.

**When getters/setters are justified:**
- Validation logic in the setter (e.g., `setAge()` rejects negative values)
- Derived/computed values in the getter (e.g., `getFullName()` concatenates fields)
- Framework requirements (JavaBeans, JPA, Jackson serialization)

**When to skip them:**
- If you expose every field through getters/setters, the class is effectively a struct
  with no real encapsulation. Instead, provide _behavioral_ methods.
- Example: Don't expose `getBalance()` + `setBalance()`. Expose `deposit()` and
  `withdraw()` -- let the object protect its own invariants.

### Immutability -- The Strongest Form of Encapsulation

If an object cannot change after creation, there is zero risk of external code
corrupting its state. No setters, no mutable fields, no race conditions.

```java
public final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    public Money(BigDecimal amount, Currency currency) {
        this.amount = amount;
        this.currency = currency;
    }

    public BigDecimal getAmount()  { return amount; }
    public Currency getCurrency()  { return currency; }

    public Money add(Money other) {
        if (!this.currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
        return new Money(this.amount.add(other.amount), this.currency);
    }
    // No setters. "add" returns a NEW Money object.
}
```

### Code Example: Good vs Bad Encapsulation

**BAD -- no encapsulation (state exposed, invariants unprotected):**

```java
// BAD: Anyone can set balance to -999 or overdraft freely
public class BankAccount {
    public String accountNumber;  // exposed!
    public double balance;        // exposed!
    public String ownerName;      // exposed!
}

// Caller code
BankAccount acct = new BankAccount();
acct.balance = -500;  // broken invariant -- no validation
acct.accountNumber = null;  // broken invariant
```

**GOOD -- proper encapsulation (behavior-rich, invariant-safe):**

```java
public class BankAccount {
    private final String accountNumber;  // immutable identity
    private final String ownerName;
    private double balance;

    public BankAccount(String accountNumber, String ownerName, double initialDeposit) {
        if (initialDeposit < 0) throw new IllegalArgumentException("Initial deposit cannot be negative");
        this.accountNumber = accountNumber;
        this.ownerName = ownerName;
        this.balance = initialDeposit;
    }

    // Behavioral method -- not a raw setter
    public void deposit(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Deposit must be positive");
        this.balance += amount;
    }

    // Behavioral method with business rule enforcement
    public void withdraw(double amount) {
        if (amount <= 0) throw new IllegalArgumentException("Withdrawal must be positive");
        if (amount > balance) throw new InsufficientFundsException("Balance: " + balance);
        this.balance -= amount;
    }

    public double getBalance() { return balance; }  // read-only view
    public String getAccountNumber() { return accountNumber; }
    // No setter for balance, accountNumber, or ownerName
}
```

**Key differences:**
- Fields are `private` (most `final`)
- No setters -- state changes only through validated behavioral methods
- Invariants (balance >= 0, accountNumber != null) are always guaranteed
- The object _controls its own destiny_

---

## 2. Abstraction

### What Is It?

Abstraction means exposing only the _relevant_ features of an object to the outside
world while hiding the underlying implementation details. Where encapsulation is about
_data hiding_, abstraction is about _complexity hiding_.

**Real-world analogy:** A coffee machine. You press "Espresso." You do not need to
know about water pressure (9 bars), grind size (fine), extraction time (25 seconds),
or boiler temperature (93C). The button _abstracts_ the barista process.

### Abstract Classes vs Interfaces

```
┌──────────────────────┬──────────────────────┬─────────────────────────┐
│      Feature         │   Abstract Class     │       Interface         │
├──────────────────────┼──────────────────────┼─────────────────────────┤
│ Instantiable?        │ No                   │ No                      │
│ Constructors?        │ Yes                  │ No                      │
│ State (fields)?      │ Yes (any)            │ Only static final       │
│ Method bodies?       │ Yes (concrete +      │ Yes (default + static,  │
│                      │   abstract)          │   since Java 8)         │
│ Multiple inherit?    │ No (single only)     │ Yes (many interfaces)   │
│ Access modifiers?    │ Any                  │ public (implicitly)     │
│ Use when...          │ Shared state/code    │ Defining a contract/    │
│                      │ among related types  │ capability              │
│ Relationship         │ IS-A (tight)         │ CAN-DO (loose)          │
│ Example              │ Animal, Vehicle      │ Comparable, Serializable│
└──────────────────────┴──────────────────────┴─────────────────────────┘
```

**Decision rule:**
- Use an **interface** when you define a _capability_ that unrelated classes can share
  (e.g., `Serializable`, `Comparable`, `PaymentProcessor`).
- Use an **abstract class** when you have a common _base implementation_ that subclasses
  share, including state (e.g., `AbstractList`, `HttpServlet`).

### Java 8+ Default Methods

Before Java 8, interfaces could not have method bodies. Default methods changed this:

```java
public interface PaymentGateway {
    PaymentResult charge(Money amount, CardDetails card);
    PaymentResult refund(String transactionId, Money amount);

    // Default method -- shared convenience logic
    default boolean isRefundable(PaymentResult result) {
        return result.isSuccessful()
            && result.getAge().toDays() <= 180;
    }
}
```

**Impact:** Interfaces can now evolve without breaking all implementors. But beware --
too many default methods turn an interface into a de-facto abstract class, which defeats
the purpose of interface segregation.

### Code Example: PaymentGateway Abstraction

```java
// The ABSTRACTION -- callers only see this contract
public interface PaymentGateway {
    PaymentResult charge(Money amount, CardDetails card);
    PaymentResult refund(String transactionId, Money amount);
    PaymentStatus checkStatus(String transactionId);
}

// IMPLEMENTATION 1: Stripe
public class StripeGateway implements PaymentGateway {

    private final StripeClient client;  // Stripe SDK

    public StripeGateway(String apiKey) {
        this.client = new StripeClient(apiKey);
    }

    @Override
    public PaymentResult charge(Money amount, CardDetails card) {
        // Stripe-specific: create a PaymentIntent
        PaymentIntent intent = client.paymentIntents().create(
            Map.of("amount", amount.toCents(),
                   "currency", amount.getCurrency().getCode(),
                   "payment_method", card.toStripeToken())
        );
        return mapToResult(intent);
    }

    @Override
    public PaymentResult refund(String transactionId, Money amount) {
        Refund refund = client.refunds().create(
            Map.of("payment_intent", transactionId,
                   "amount", amount.toCents())
        );
        return mapToResult(refund);
    }

    @Override
    public PaymentStatus checkStatus(String transactionId) {
        PaymentIntent intent = client.paymentIntents().retrieve(transactionId);
        return mapToStatus(intent.getStatus());
    }

    // Private Stripe-specific mapping logic -- HIDDEN from callers
    private PaymentResult mapToResult(PaymentIntent intent) { /* ... */ }
    private PaymentResult mapToResult(Refund refund) { /* ... */ }
    private PaymentStatus mapToStatus(String stripeStatus) { /* ... */ }
}

// IMPLEMENTATION 2: Razorpay
public class RazorpayGateway implements PaymentGateway {

    private final RazorpayClient client;

    public RazorpayGateway(String keyId, String keySecret) {
        this.client = new RazorpayClient(keyId, keySecret);
    }

    @Override
    public PaymentResult charge(Money amount, CardDetails card) {
        // Razorpay-specific: create an Order, then capture payment
        JSONObject options = new JSONObject();
        options.put("amount", amount.toPaise());  // Razorpay uses paise
        options.put("currency", amount.getCurrency().getCode());
        Order order = client.orders.create(options);
        return mapToResult(order);
    }

    @Override
    public PaymentResult refund(String transactionId, Money amount) {
        JSONObject options = new JSONObject();
        options.put("amount", amount.toPaise());
        Payment refund = client.payments.refund(transactionId, options);
        return mapToResult(refund);
    }

    @Override
    public PaymentStatus checkStatus(String transactionId) {
        Payment payment = client.payments.fetch(transactionId);
        return mapToStatus(payment.get("status"));
    }

    private PaymentResult mapToResult(Order order) { /* ... */ }
    private PaymentResult mapToResult(Payment payment) { /* ... */ }
    private PaymentStatus mapToStatus(String razorpayStatus) { /* ... */ }
}

// CALLER CODE -- completely abstracted from Stripe/Razorpay details
public class CheckoutService {
    private final PaymentGateway gateway;  // depends on ABSTRACTION

    public CheckoutService(PaymentGateway gateway) {
        this.gateway = gateway;
    }

    public OrderReceipt processOrder(Order order, CardDetails card) {
        PaymentResult result = gateway.charge(order.getTotal(), card);
        if (!result.isSuccessful()) throw new PaymentFailedException(result);
        return new OrderReceipt(order, result.getTransactionId());
    }
}
```

**The power:** To switch from Stripe to Razorpay, you change ONE line of configuration
(which implementation to inject). `CheckoutService` never changes.

---

## 3. Inheritance

### What Is It?

Inheritance allows a class (subclass/child) to acquire the fields and methods of
another class (superclass/parent). It models an IS-A relationship and enables code
reuse.

```
        ┌──────────┐
        │  Animal   │  <-- superclass (base)
        │ +name     │
        │ +eat()    │
        └────┬─────-┘
       ┌─────┴──────┐
       v             v
  ┌────────┐   ┌────────┐
  │  Dog   │   │  Cat   │  <-- subclasses (derived)
  │ +bark()│   │ +purr()│
  └────────┘   └────────┘

  Dog IS-A Animal. Cat IS-A Animal.
```

### Key Mechanisms

**Method overriding:** A subclass provides its own implementation of a method declared
in the superclass. The `@Override` annotation signals intent and catches typos.

**`super` keyword:** Calls the parent class's constructor or method.

**Constructor chaining:** Java calls superclass constructors up the chain. If you don't
explicitly call `super(...)`, Java inserts `super()` (no-arg) automatically.

```java
public class Animal {
    private String name;

    public Animal(String name) { this.name = name; }

    public void speak() { System.out.println(name + " makes a sound"); }
}

public class Dog extends Animal {
    private String breed;

    public Dog(String name, String breed) {
        super(name);           // constructor chaining
        this.breed = breed;
    }

    @Override
    public void speak() {
        super.speak();         // optionally call parent's version
        System.out.println("...specifically, it barks!");
    }
}
```

### Problems with Inheritance

**1. Fragile Base Class Problem:**
A change in the superclass can silently break subclasses. Subclasses depend on
implementation details they shouldn't know about.

**2. Tight Coupling:**
The subclass is permanently welded to the superclass. You cannot swap the parent
at runtime.

**3. Diamond Problem (in languages with multiple class inheritance):**
```
       ┌───┐
       │ A │  fly()
       └─┬─┘
      ┌──┴──┐
      v     v
    ┌───┐ ┌───┐
    │ B │ │ C │  Both override fly()
    └─┬─┘ └─┬─┘
      └──┬──┘
         v
       ┌───┐
       │ D │  Which fly() does D inherit?
       └───┘
```
Java avoids this by forbidding multiple class inheritance (but allows multiple
interface implementation -- and default methods can create a softer version of this).

### "Prefer Composition over Inheritance" -- WHY?

This is one of the most important design guidelines in OOP. Here is a concrete
example showing both approaches.

**Scenario:** We need a `LoggingList` that logs every addition to a list.

**BAD: Inheritance approach**

```java
// Fragile -- we are coupled to ArrayList's implementation details
public class LoggingList<E> extends ArrayList<E> {
    private int addCount = 0;

    @Override
    public boolean add(E element) {
        addCount++;
        return super.add(element);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return super.addAll(c);  // BUG! ArrayList.addAll() calls add() internally
                                  // so each element gets counted TWICE
    }

    public int getAddCount() { return addCount; }
}
```

The bug above is the fragile base class problem in action. `ArrayList.addAll()`
internally calls `this.add()` for each element, so our override double-counts.
And if a future JDK version changes that internal behavior, the bug may appear or
disappear silently.

**GOOD: Composition approach (Decorator / Wrapper)**

```java
public class LoggingList<E> implements List<E> {
    private final List<E> delegate;  // HAS-A relationship (composition)
    private int addCount = 0;

    public LoggingList(List<E> delegate) {
        this.delegate = delegate;   // can wrap ANY List implementation
    }

    @Override
    public boolean add(E element) {
        addCount++;
        return delegate.add(element);  // forward to delegate
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount += c.size();
        return delegate.addAll(c);  // no double-counting!
        // delegate.addAll() calls delegate.add(), NOT our add()
    }

    public int getAddCount() { return addCount; }

    // Forward all other List methods to delegate...
    @Override public E get(int index) { return delegate.get(index); }
    @Override public int size() { return delegate.size(); }
    // etc.
}
```

**Why composition wins:**
1. No fragile base class problem -- we delegate, not inherit internals
2. Can wrap ANY `List` implementation (ArrayList, LinkedList, CopyOnWriteArrayList)
3. Can swap the delegate at runtime
4. Follows the Interface Segregation and Dependency Inversion principles naturally

**When inheritance IS appropriate:**
- True IS-A relationships where the Liskov Substitution Principle holds
- Framework extension points designed for inheritance (e.g., `HttpServlet`)
- When you genuinely need to reuse significant implementation with minor tweaks

---

## 4. Polymorphism

### What Is It?

Polymorphism means "many forms." A single interface or method name can take on
different behaviors depending on the context. It is the mechanism that makes
abstraction and the Open/Closed Principle possible.

### Types of Polymorphism

```
                  Polymorphism
                  ┌─────┴──────┐
           Compile-Time     Runtime
           (Static)         (Dynamic)
           ┌───┴───┐           │
     Overloading  Generics  Overriding
                            (virtual dispatch)
```

### Compile-Time Polymorphism: Method Overloading

Same method name, different parameter lists. Resolved at compile time.

```java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public String add(String a, String b) { return a + b; }  // concatenation
}

Calculator calc = new Calculator();
calc.add(1, 2);        // calls int version -> 3
calc.add(1.5, 2.5);    // calls double version -> 4.0
calc.add("Hi", " Mom"); // calls String version -> "Hi Mom"
```

Note: Java does NOT support operator overloading (except `+` for String concatenation,
which is compiler magic, not true overloading you can define yourself).

### Runtime Polymorphism: Method Overriding + Virtual Dispatch

This is the BIG one. The actual method that runs is determined at RUNTIME based on
the object's true type, not the declared reference type.

```java
Animal animal = new Dog("Rex");
animal.speak();  // calls Dog.speak(), not Animal.speak()!
```

Under the hood, the JVM uses a **vtable (virtual method table)** to look up the
correct implementation at runtime. Every object carries a pointer to its class's vtable.

### Parametric Polymorphism: Generics

Write code that works with any type, determined at compile time.

```java
public class Pair<A, B> {
    private final A first;
    private final B second;

    public Pair(A first, B second) {
        this.first = first;
        this.second = second;
    }

    public A getFirst()  { return first; }
    public B getSecond() { return second; }
}

Pair<String, Integer> nameAge = new Pair<>("Alice", 30);
Pair<Double, Double>  point  = new Pair<>(1.0, 2.5);
```

### Why Runtime Polymorphism Is THE Most Powerful OOP Concept

Runtime polymorphism is the backbone of:
- **The Strategy Pattern** -- swap algorithms at runtime
- **The Open/Closed Principle** -- add new behavior by adding classes, not modifying
- **Dependency Injection** -- inject different implementations of an interface
- **Plugin architectures** -- load new behavior without recompiling

Without runtime polymorphism, you'd be stuck with `if/else` or `switch` chains that
must be modified every time you add a new type. Polymorphism eliminates those chains.

### Code Example: Shape Hierarchy

**BAD -- no polymorphism (type-checking everywhere):**

```java
// Every time you add a new shape, you MUST modify this method
public class Renderer {
    public void draw(Object shape) {
        if (shape instanceof Circle) {
            Circle c = (Circle) shape;
            System.out.println("Drawing circle at " + c.x + "," + c.y + " r=" + c.radius);
        } else if (shape instanceof Rectangle) {
            Rectangle r = (Rectangle) shape;
            System.out.println("Drawing rect at " + r.x + "," + r.y + " w=" + r.width);
        } else if (shape instanceof Triangle) {
            Triangle t = (Triangle) shape;
            System.out.println("Drawing triangle...");
        }
        // Adding Hexagon? Modify this method. And every other method that does instanceof checks.
    }
}
```

**GOOD -- polymorphism (open for extension, closed for modification):**

```java
public abstract class Shape {
    protected double x, y;

    public Shape(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public abstract void draw();
    public abstract double area();
}

public class Circle extends Shape {
    private final double radius;

    public Circle(double x, double y, double radius) {
        super(x, y);
        this.radius = radius;
    }

    @Override
    public void draw() {
        System.out.println("Drawing circle at (" + x + "," + y + ") r=" + radius);
    }

    @Override
    public double area() {
        return Math.PI * radius * radius;
    }
}

public class Rectangle extends Shape {
    private final double width, height;

    public Rectangle(double x, double y, double width, double height) {
        super(x, y);
        this.width = width;
        this.height = height;
    }

    @Override
    public void draw() {
        System.out.println("Drawing rect at (" + x + "," + y + ") " + width + "x" + height);
    }

    @Override
    public double area() {
        return width * height;
    }
}

// To add Hexagon: create new class. NOTHING else changes.
public class Hexagon extends Shape {
    private final double side;

    public Hexagon(double x, double y, double side) {
        super(x, y);
        this.side = side;
    }

    @Override
    public void draw() {
        System.out.println("Drawing hexagon at (" + x + "," + y + ") side=" + side);
    }

    @Override
    public double area() {
        return (3 * Math.sqrt(3) / 2) * side * side;
    }
}

// Renderer is CLOSED for modification -- never needs to change
public class Renderer {
    public void drawAll(List<Shape> shapes) {
        for (Shape shape : shapes) {
            shape.draw();  // virtual dispatch picks the right implementation
        }
    }
}

// Usage
List<Shape> scene = List.of(
    new Circle(0, 0, 5),
    new Rectangle(10, 10, 20, 30),
    new Hexagon(50, 50, 8)
);
new Renderer().drawAll(scene);  // just works -- even for shapes written in the future
```

**The key insight:** Adding a new shape (Hexagon) required ZERO changes to `Renderer`,
`Circle`, or `Rectangle`. This is the Open/Closed Principle powered by runtime
polymorphism.

---

## Quick Reference: The Four Pillars

```
┌─────────────────┬────────────────────────────────────────────────────┐
│ Pillar          │ One-liner                                         │
├─────────────────┼────────────────────────────────────────────────────┤
│ Encapsulation   │ Hide data, expose behavior. Protect invariants.   │
│ Abstraction     │ Hide complexity behind a simple contract.         │
│ Inheritance     │ Reuse code via IS-A. Use sparingly.               │
│ Polymorphism    │ One interface, many implementations. The big one. │
└─────────────────┴────────────────────────────────────────────────────┘
```

### Interview Tip

When asked "What are the four pillars of OOP?" don't just list them. Say:

> "Encapsulation protects state behind behavioral methods. Abstraction hides
> complexity behind stable contracts. Inheritance enables code reuse through IS-A
> relationships, though I prefer composition when possible. Polymorphism -- especially
> runtime polymorphism -- is the most powerful pillar because it enables the
> Open/Closed Principle: I can extend a system by adding new classes without modifying
> existing ones."

This answer shows you understand WHY, not just WHAT.
