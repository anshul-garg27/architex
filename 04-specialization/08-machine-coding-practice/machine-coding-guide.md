# Machine Coding Round -- Complete Guide & Practice

## What Is a Machine Coding Round?

A machine coding round is a **timed implementation challenge (60-90 minutes)** where you must design
and write **working, compilable, runnable code** from scratch. Unlike a whiteboard LLD discussion
where you draw diagrams and talk through design, this round demands actual output: classes,
interfaces, business logic, and a running demo.

Companies that rely heavily on this format:
- **Uber India** (considered the hardest machine coding round in the industry)
- Flipkart
- PhonePe
- Swiggy
- Atlassian
- Razorpay

### How It Differs from LLD Discussion

| Aspect | LLD Discussion | Machine Coding |
|---|---|---|
| Deliverable | Diagrams, class names, API signatures | **Working code that compiles and runs** |
| Depth | Broad design, many components | Deep implementation of core flows |
| Time | 45-60 min | 60-90 min |
| Evaluation | Design thinking, trade-offs | Code quality, OOP, does it work? |
| Tools | Whiteboard / paper | IDE (IntelliJ, VS Code, or online editor) |
| Follow-ups | "How would you handle X?" | "Now add support for X" (you must code it) |

The single biggest difference: **nobody cares about your design if the code does not run.**
A mediocre design with working code beats a perfect design with broken code every time.

---

## Evaluation Criteria (With Weights)

Interviewers at Uber and similar companies score along these six axes:

### 1. Working Solution (25%)
- Does the code compile without errors?
- Does `main()` execute and produce correct output for the primary use case?
- Are the main flows (happy path) functional end to end?

**What kills you:** Spending 60 minutes on "perfect" abstractions and running out of time
before wiring up `main()`.

### 2. OOP / SOLID Principles (25%)
- Proper class hierarchy with meaningful inheritance
- Encapsulation: private fields, public methods, no leaky internals
- Single Responsibility: each class does one thing
- Open/Closed: new behavior via extension, not modification
- Liskov Substitution: subtypes are interchangeable with base types
- Interface Segregation: small, focused interfaces
- Dependency Inversion: depend on abstractions, not concretions

**What kills you:** God classes with 500 lines, public fields everywhere, business logic
inside entity classes.

### 3. Design Patterns (15%)
- Strategy for interchangeable algorithms
- Factory for object creation
- Singleton where genuinely appropriate (one parking lot, one logger)
- Observer for event-driven decoupling
- State for objects with discrete behavioral states
- Chain of Responsibility for sequential processing

**What kills you:** Forcing patterns where they add no value. Using Singleton for everything.
Naming a class `XFactory` that is just a constructor wrapper.

### 4. Code Quality (15%)
- Meaningful variable and method names
- Consistent formatting and structure
- Small methods (under 20 lines)
- No magic numbers or hardcoded strings
- Proper use of access modifiers
- Logical file/package organization

**What kills you:** Single-character variable names, methods doing five things, inconsistent
naming conventions mixing camelCase and snake_case.

### 5. Extensibility (10%)
- Can a new vehicle type be added without modifying existing code?
- Can the pricing strategy be swapped without touching the parking lot?
- Are interfaces used at integration points?

**What kills you:** Switch statements on type enums scattered through the codebase.
Concrete class references where interfaces should be.

### 6. Edge Cases (10%)
- Null checks on inputs
- Boundary conditions (full parking lot, empty floor, zero amount)
- Concurrent access considerations (mention even if not implemented)
- Graceful error handling with custom exceptions

**What kills you:** NullPointerException on the first edge case the interviewer tries.
No validation anywhere.

---

## Time Management Strategy

This is the difference between candidates who finish and those who don't. Strict discipline.

```
TIME        ACTIVITY                                    DELIVERABLE
--------    ------------------------------------------  ---------------------------
0-10 min    Requirements clarification                  Written list of requirements
            - Ask about scope boundaries                Identified entities
            - Identify core entities                    Confirmed assumptions
            - Confirm 2-3 main flows
            - Ask: "What should I prioritize?"

10-20 min   High-level design                           Mental/paper class diagram
            - Sketch class hierarchy                    Identified patterns
            - Identify which design patterns fit        Package structure decided
            - Decide package/folder structure
            - List interfaces needed

20-60 min   IMPLEMENTATION (the bulk)                   Compiling code
            - Enums and constants (2 min)
            - Value objects (3 min)
            - Entity classes (10 min)
            - Interfaces (5 min)
            - Service/business logic (15 min)
            - Factories and strategies (5 min)
            - Main.java with demo (5 min)

60-75 min   Testing and edge cases                      Running demo output
            - Run main(), verify output
            - Add null checks, validation
            - Handle boundary conditions
            - Fix any compilation errors

75-90 min   Discussion and extensions                   Verbal discussion
            - Walk interviewer through design decisions
            - Discuss what you would add
            - Handle "Now add X" extensions
```

### Critical Rule: Code MUST Run by Minute 60

If you reach minute 60 and your code does not compile, you are in serious trouble. Always
have a working skeleton before adding polish. Build incrementally: get a minimal flow working
first, then layer on complexity.

---

## Code Organization Template

```
src/
 |-- model/           # Domain entities, enums, value objects
 |   |-- Vehicle.java
 |   |-- Car.java
 |   |-- VehicleType.java
 |
 |-- service/          # Business logic, orchestration
 |   |-- ParkingService.java
 |   |-- TicketService.java
 |
 |-- repository/       # In-memory data storage (maps, lists)
 |   |-- ParkingSpotRepository.java
 |   |-- TicketRepository.java
 |
 |-- strategy/         # Strategy pattern implementations
 |   |-- PricingStrategy.java
 |   |-- HourlyPricingStrategy.java
 |   |-- FlatPricingStrategy.java
 |
 |-- factory/          # Object creation logic
 |   |-- VehicleFactory.java
 |   |-- SpotFactory.java
 |
 |-- observer/         # Event listeners and handlers
 |   |-- ParkingEventListener.java
 |   |-- NotificationService.java
 |
 |-- exception/        # Custom exceptions
 |   |-- ParkingFullException.java
 |   |-- InvalidTicketException.java
 |
 |-- Main.java         # Entry point + demo execution
```

### Why This Structure Matters

Interviewers see your package structure within the first 30 seconds. A flat pile of 15 classes
in one package signals "this person does not think about organization." The structure above
shows you understand separation of concerns at the package level.

**In an online editor without packages:** Use clear class naming prefixes and group related
classes together with comment separators.

---

## Implementation Order

Follow this order religiously. It builds from the foundation up, so each layer compiles
independently.

### Step 1: Enums (2 minutes)
```java
public enum VehicleType {
    BIKE, CAR, TRUCK;
}

public enum SpotType {
    SMALL, MEDIUM, LARGE;
}

public enum SpotStatus {
    AVAILABLE, OCCUPIED, OUT_OF_SERVICE;
}
```

Enums are trivial, take seconds, and every other class depends on them. Do them first.

### Step 2: Value Objects (3 minutes)
Immutable objects that represent concepts without identity:
```java
public class Address {
    private final String street;
    private final String city;
    private final String zipCode;

    public Address(String street, String city, String zipCode) {
        this.street = street;
        this.city = city;
        this.zipCode = zipCode;
    }
    // getters only, no setters
}
```

### Step 3: Entity Classes (10 minutes)
Domain objects with identity. Start with the abstract base, then concrete subclasses:
```java
public abstract class Vehicle {
    private String licensePlate;
    private VehicleType type;

    public Vehicle(String licensePlate, VehicleType type) {
        this.licensePlate = licensePlate;
        this.type = type;
    }
    // getters
}

public class Car extends Vehicle {
    public Car(String licensePlate) {
        super(licensePlate, VehicleType.CAR);
    }
}
```

### Step 4: Interfaces (5 minutes)
Define contracts before implementations:
```java
public interface PricingStrategy {
    double calculatePrice(Ticket ticket);
}

public interface SpotAllocationStrategy {
    ParkingSpot allocate(ParkingFloor floor, VehicleType vehicleType);
}
```

### Step 5: Service / Business Logic (15 minutes)
This is where you spend the most time. Wire entities together through services:
```java
public class ParkingService {
    private final SpotAllocationStrategy allocationStrategy;
    private final PricingStrategy pricingStrategy;

    public Ticket parkVehicle(Vehicle vehicle) { ... }
    public double unparkVehicle(Ticket ticket) { ... }
}
```

### Step 6: Factories and Strategies (5 minutes)
Concrete implementations of interfaces:
```java
public class HourlyPricingStrategy implements PricingStrategy {
    private final Map<VehicleType, Double> hourlyRates;

    @Override
    public double calculatePrice(Ticket ticket) {
        long hours = ChronoUnit.HOURS.between(ticket.getEntryTime(), ticket.getExitTime());
        return Math.max(1, hours) * hourlyRates.get(ticket.getVehicleType());
    }
}
```

### Step 7: Main.java -- Demo (5 minutes)
```java
public class Main {
    public static void main(String[] args) {
        // Setup
        ParkingLot lot = ParkingLot.getInstance();

        // Demo flow
        Vehicle car = new Car("KA-01-1234");
        Ticket ticket = lot.parkVehicle(car);
        System.out.println("Parked: " + ticket);

        double fee = lot.unparkVehicle(ticket);
        System.out.println("Fee: " + fee);
    }
}
```

**This is not optional.** A running main() is your proof that the system works.

---

## Common Mistakes and How to Avoid Them

### Mistake 1: Over-Engineering Before Core Works
**Symptom:** 40 minutes in, you have 12 interfaces and 0 working flows.
**Fix:** Get the happy path working with concrete classes first. Extract interfaces after.

### Mistake 2: No Running Main
**Symptom:** Time runs out, code might compile but nothing executes.
**Fix:** Write Main.java at minute 20 with a hardcoded flow. Keep it updated as you code.

### Mistake 3: God Service Class
**Symptom:** One class with 200+ lines doing everything.
**Fix:** Each service class handles one domain responsibility. ParkingService parks.
PricingService prices. TicketService manages tickets.

### Mistake 4: Public Fields Everywhere
**Symptom:** `public String name;` instead of private + getter.
**Fix:** Make it a reflex: every field is private, every access goes through a method.

### Mistake 5: Ignoring the Interviewer's Hints
**Symptom:** Interviewer says "think about how pricing might change" and you hardcode prices.
**Fix:** When an interviewer highlights something, it is a signal to use a pattern
(Strategy for pricing, Observer for notifications, Factory for creation).

### Mistake 6: Not Asking Clarifying Questions
**Symptom:** You assume requirements and build the wrong thing.
**Fix:** Spend the first 10 minutes asking:
- "Should I support multiple floors?"
- "Do different vehicle types have different pricing?"
- "Should I handle concurrent access?"
- "What is the priority: working code or extensible design?"

### Mistake 7: Switch Statements on Type
**Symptom:** `switch(vehicleType) { case CAR: ... case BIKE: ... }` scattered everywhere.
**Fix:** Use polymorphism. Each vehicle type knows its own spot requirement.

### Mistake 8: No Custom Exceptions
**Symptom:** Returning null or -1 to signal errors.
**Fix:** Create `ParkingFullException`, `InvalidTicketException`, etc. Takes 2 minutes,
impresses every interviewer.

---

## Handling Mid-Round Extensions

At Uber, this is standard. Around minute 50-60, the interviewer will say:

> "Now add support for EV charging spots."

or

> "Now add VIP parking with reserved spots."

### How to Handle It

1. **Stay calm.** This is expected. They want to see if your design is extensible.
2. **Verbalize your approach.** "Since I used the Strategy pattern for pricing, I can add
   EVPricingStrategy without modifying existing code."
3. **Identify what changes and what stays.** If you designed well, most existing code stays.
4. **Implement the minimum viable extension.** New classes, not modified old ones.
5. **If time is short, describe and pseudo-code.** "I would create EVChargingSpot extending
   ParkingSpot, add a ChargingService, and modify SpotAllocationStrategy to prefer charging
   spots for EVs."

### Extension Patterns

| Extension Request | Pattern to Apply | What to Add |
|---|---|---|
| New vehicle type | Polymorphism | New subclass of Vehicle |
| New pricing model | Strategy | New PricingStrategy implementation |
| Notifications | Observer | New listener implementation |
| New spot allocation | Strategy | New AllocationStrategy implementation |
| State-based behavior | State | New state classes |
| Dynamic pricing | Strategy + Observer | PricingStrategy that reacts to occupancy |

---

## Uber-Specific Interview Tips

### What Uber Looks For
1. **Clean separation of concerns** -- not just in classes, but in packages
2. **Strategy pattern mastery** -- they will ask for interchangeable algorithms
3. **Working code over perfect design** -- they compile and run your code
4. **Graceful extension handling** -- the follow-up requirement is the real test
5. **In-memory storage done right** -- proper repository pattern, not scattered HashMaps

### What to Say When You Start
"Let me take 10 minutes to clarify requirements and sketch the class structure before
I start coding. I want to make sure I build the right thing."

This shows maturity. Every strong candidate does this.

### What to Say When You Get the Extension
"That is a great extension. My current design supports this because [explain]. Let me add
a new [class/interface] to handle it."

This shows you anticipated extensibility.

### What to Say When Time Runs Out
"Here is my working solution for the core flows. Given more time, I would add [specific
things]. The design supports these extensions because [explain interface/strategy points]."

This shows awareness and planning.

---

## Pre-Interview Checklist

Before the round, make sure you have practiced:

- [ ] Writing a complete Singleton with private constructor, lazy initialization
- [ ] Implementing Strategy pattern from scratch (interface + 2 implementations)
- [ ] Writing a Factory that returns different subtypes based on input
- [ ] Observer pattern with listener interface, registration, and notification
- [ ] State pattern with state interface and concrete state transitions
- [ ] Chain of Responsibility with handler interface and chain wiring
- [ ] In-memory repository with HashMap/ArrayList and CRUD operations
- [ ] Custom exceptions with constructors and meaningful messages
- [ ] Main.java demo flow that creates objects and exercises the system
- [ ] Time-boxing: practice completing a full problem in 60 minutes

---

## The 5-Minute Emergency Plan

If you are at minute 55 and things are not compiling:

1. **Comment out broken code** -- do not delete it, just comment it
2. **Hardcode what you must** -- replace a broken strategy with inline logic
3. **Make main() run** -- even if it only demonstrates one flow
4. **Add TODO comments** -- show the interviewer you know what is missing
5. **Talk through the rest** -- explain what each class was supposed to do

A partial working solution with articulate explanation of the rest beats a fully
ambitious solution that does not compile.

---

## Practice Problems Ranked by Frequency (Uber India)

| Rank | Problem | Frequency | Difficulty | Key Patterns |
|------|---------|-----------|------------|--------------|
| 1 | Parking Lot | Very High | Medium | Singleton, Factory, Strategy |
| 2 | Elevator System | High | Hard | State, Strategy, Observer |
| 3 | Snake and Ladder | High | Medium | Factory, Observer |
| 4 | Splitwise/Expense Sharing | Medium | Medium | Strategy |
| 5 | LRU Cache | Medium | Medium | Strategy (eviction) |
| 6 | Pub-Sub Messaging | Medium | Medium | Observer, Strategy |
| 7 | Rate Limiter | Medium | Hard | Strategy, Decorator |
| 8 | Logging Framework | Medium | Medium | Singleton, Chain of Responsibility |
| 9 | Chess / Tic-Tac-Toe | Low-Medium | Hard | State, Strategy, Factory |
| 10 | BookMyShow / Movie Booking | Low-Medium | Hard | Strategy, Observer |

Each of these problems is covered in detail in the companion files in this directory.
