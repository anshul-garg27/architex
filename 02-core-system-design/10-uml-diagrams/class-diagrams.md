# Class Diagrams -- The Most Important UML for LLD Interviews

## Why Class Diagrams Matter Most

Class diagrams are the **single most requested UML artifact** in low-level design interviews. When an interviewer says "design the classes for X," they expect a class diagram. It captures the static structure of a system: what objects exist, what they know, what they can do, and how they relate to each other.

---

## Anatomy of a Class Box

Every class in a UML class diagram has three compartments:

```
+---------------------------+
|       ClassName           |   <-- Name compartment
+---------------------------+
| - privateAttr: Type       |   <-- Attributes compartment
| + publicAttr: Type        |
| # protectedAttr: Type     |
| ~ packageAttr: Type       |
+---------------------------+
| + publicMethod(): RetType |   <-- Methods compartment
| - privateHelper(): void   |
| # protectedOp(a: int): T |
+---------------------------+
```

### Visibility Modifiers

| Symbol | Meaning   | Who Can Access                        |
|--------|-----------|---------------------------------------|
| `-`    | private   | Only the class itself                 |
| `+`    | public    | Any other class                       |
| `#`    | protected | The class and its subclasses          |
| `~`    | package   | Classes in the same package (Java)    |

### Attribute Syntax

```
visibility name : Type [multiplicity] = defaultValue
```

Examples:
- `- balance: double = 0.0`
- `+ name: String`
- `# items: List<Item>`

### Method Syntax

```
visibility name(param: Type, ...): ReturnType
```

Examples:
- `+ withdraw(amount: double): boolean`
- `- validate(): void`
- `# calculateTax(price: double): double`

---

## Class Diagram in Mermaid -- Basic Syntax

```mermaid
classDiagram
    class BankAccount {
        -String accountId
        -String ownerName
        -double balance
        +deposit(amount: double) void
        +withdraw(amount: double) boolean
        +getBalance() double
        -validate(amount: double) boolean
    }
```

### Static and Abstract Members

- **Static** members are underlined in UML. In Mermaid, append `$` to the member name.
- **Abstract** methods are italicized in UML. In Mermaid, append `*` to the member name.

```mermaid
classDiagram
    class MathUtils {
        +PI: double$
        +max(a: int, b: int) int$
    }

    class Shape {
        <<abstract>>
        #color: String
        +area() double*
        +perimeter() double*
    }
```

### Interfaces in Mermaid

```mermaid
classDiagram
    class Serializable {
        <<interface>>
        +serialize() byte[]
        +deserialize(data: byte[]) void
    }

    class Comparable~T~ {
        <<interface>>
        +compareTo(other: T) int
    }
```

### Enumerations

```mermaid
classDiagram
    class VehicleType {
        <<enumeration>>
        CAR
        TRUCK
        MOTORCYCLE
        BUS
    }
```

---

## The 6 Relationships -- From Weakest to Strongest

Understanding these six relationships and knowing when to use each one is **critical** for interviews. They are listed from weakest coupling to strongest.

### 1. Dependency (..>) -- "Uses Temporarily"

The weakest relationship. Class A uses Class B, but only transiently -- typically as a method parameter, local variable, or return type. If B changes, A might be affected, but A does not store a reference to B.

**Real-world analogy:** A person uses a taxi. The person does not own the taxi; they just use it temporarily.

```mermaid
classDiagram
    class OrderService {
        +createOrder(cart: ShoppingCart) Order
    }
    class ShoppingCart {
        +getItems() List~Item~
        +getTotal() double
    }

    OrderService ..> ShoppingCart : uses
```

**When to use:** Method parameters, factory methods returning objects, utility class usage.

### 2. Association (-->) -- "Knows About"

A structural relationship where one class holds a reference to another as a field. The two objects have independent lifecycles -- destroying one does not destroy the other.

**Real-world analogy:** A student is enrolled in a course. Both exist independently.

```mermaid
classDiagram
    class Student {
        -String name
        -String studentId
        +enroll(course: Course) void
    }
    class Course {
        -String courseId
        -String title
        -int credits
    }

    Student --> Course : enrolledIn
```

**When to use:** Objects that reference each other but live independently.

### 3. Aggregation (o--) -- "Has-A, Shared Lifetime"

A special form of association representing a whole-part relationship where the **part can exist without the whole**. The whole does not own the part exclusively -- parts can be shared.

**Real-world analogy:** A department has professors, but professors continue to exist if the department is dissolved.

```mermaid
classDiagram
    class Department {
        -String name
        +addProfessor(p: Professor) void
        +removeProfessor(p: Professor) void
    }
    class Professor {
        -String name
        -String specialization
    }

    Department o-- Professor : has
```

**When to use:** Collections where items are shared or outlive the container. Teams and players, playlists and songs, folders and files (if files can exist outside folders).

### 4. Composition (*--) -- "Has-A, Owned Lifetime"

The strongest whole-part relationship. The **part cannot exist without the whole**. When the whole is destroyed, all its parts are destroyed too. The part belongs exclusively to one whole.

**Real-world analogy:** A house has rooms. If the house is demolished, the rooms cease to exist.

```mermaid
classDiagram
    class House {
        -String address
        +getRooms() List~Room~
    }
    class Room {
        -String name
        -double area
    }

    House *-- Room : contains
```

**When to use:** Parts that have no meaning without their parent. Order and OrderLineItems, Car and Engine, Invoice and InvoiceItems.

### 5. Inheritance (--|>) -- "IS-A"

The classic IS-A relationship. A subclass inherits the attributes and methods of a superclass. Represented by a solid line with a hollow triangle arrowhead pointing to the parent.

```mermaid
classDiagram
    class Vehicle {
        <<abstract>>
        #String licensePlate
        #VehicleType type
        +start() void*
        +stop() void*
    }
    class Car {
        -int numDoors
        +start() void
        +stop() void
    }
    class Truck {
        -double payloadCapacity
        +start() void
        +stop() void
    }
    class Motorcycle {
        -boolean hasSidecar
        +start() void
        +stop() void
    }

    Vehicle <|-- Car
    Vehicle <|-- Truck
    Vehicle <|-- Motorcycle
```

**When to use:** True IS-A relationships. Favor composition over inheritance in actual code, but use inheritance where it genuinely models the domain.

### 6. Realization (..|>) -- "Implements Interface"

A class promises to fulfill the contract defined by an interface. Represented by a dashed line with a hollow triangle arrowhead pointing to the interface.

```mermaid
classDiagram
    class PaymentProcessor {
        <<interface>>
        +processPayment(amount: double) boolean
        +refund(transactionId: String) boolean
    }
    class CreditCardProcessor {
        -String merchantId
        +processPayment(amount: double) boolean
        +refund(transactionId: String) boolean
    }
    class PayPalProcessor {
        -String apiKey
        +processPayment(amount: double) boolean
        +refund(transactionId: String) boolean
    }

    PaymentProcessor <|.. CreditCardProcessor
    PaymentProcessor <|.. PayPalProcessor
```

**When to use:** Strategy pattern, dependency injection, plugin architectures -- any time you code to an interface.

---

## Relationship Comparison at a Glance

| Relationship  | Mermaid     | Coupling  | Lifetime Dependency | Example                     |
|---------------|-------------|-----------|---------------------|-----------------------------|
| Dependency    | `..>`       | Weakest   | None                | Service uses DTO            |
| Association   | `-->`       | Weak      | Independent         | Student -> Course           |
| Aggregation   | `o--`       | Medium    | Shared              | Department o-- Professor    |
| Composition   | `*--`       | Strong    | Owned               | Order *-- LineItem          |
| Inheritance   | `--|>`      | Strongest | Permanent           | Car --|> Vehicle             |
| Realization   | `..|>`      | Strong    | Contract            | Processor ..|> PaymentIF    |

**Interview tip:** When unsure between aggregation and composition, ask: "If the parent is deleted, does the child still make sense?" If yes, aggregation. If no, composition.

---

## Multiplicity

Multiplicity indicates how many instances of one class relate to another.

| Notation | Meaning               |
|----------|-----------------------|
| `1`      | Exactly one           |
| `0..1`   | Zero or one           |
| `*`      | Zero or more          |
| `0..*`   | Zero or more (same)   |
| `1..*`   | One or more           |
| `2..5`   | Between 2 and 5       |

```mermaid
classDiagram
    class Order {
        -String orderId
        -Date orderDate
    }
    class OrderItem {
        -String productName
        -int quantity
        -double price
    }
    class Customer {
        -String customerId
        -String email
    }

    Customer "1" --> "0..*" Order : places
    Order "1" *-- "1..*" OrderItem : contains
```

Read: "One Customer places zero or more Orders. One Order contains one or more OrderItems."

---

## Complete Example 1: Parking Lot System

This is the most commonly asked LLD question. Here is the full class diagram.

```mermaid
classDiagram
    class ParkingLot {
        -String name
        -String address
        -List~ParkingFloor~ floors
        -List~EntryGate~ entryGates
        -List~ExitGate~ exitGates
        +addFloor(floor: ParkingFloor) void
        +isFull() boolean
        +getAvailableSpots(type: VehicleType) int
    }

    class ParkingFloor {
        -int floorNumber
        -List~ParkingSpot~ spots
        -DisplayBoard displayBoard
        +getAvailableSpots(type: VehicleType) List~ParkingSpot~
        +assignSpot(vehicle: Vehicle) ParkingSpot
    }

    class ParkingSpot {
        <<abstract>>
        -String spotId
        -boolean isAvailable
        -Vehicle currentVehicle
        -ParkingSpotType type
        +assignVehicle(v: Vehicle) boolean
        +removeVehicle() void
        +isAvailable() boolean
    }

    class CompactSpot {
        +assignVehicle(v: Vehicle) boolean
    }
    class LargeSpot {
        +assignVehicle(v: Vehicle) boolean
    }
    class MotorcycleSpot {
        +assignVehicle(v: Vehicle) boolean
    }
    class HandicappedSpot {
        +assignVehicle(v: Vehicle) boolean
    }

    class Vehicle {
        <<abstract>>
        -String licensePlate
        -VehicleType type
        -String color
    }
    class Car {
    }
    class Truck {
    }
    class Motorcycle {
    }

    class ParkingTicket {
        -String ticketId
        -DateTime entryTime
        -DateTime exitTime
        -ParkingSpot spot
        -Vehicle vehicle
        -TicketStatus status
        +calculateFee() double
    }

    class EntryGate {
        -int gateId
        +issueTicket(vehicle: Vehicle) ParkingTicket
    }

    class ExitGate {
        -int gateId
        +processExit(ticket: ParkingTicket) Payment
    }

    class Payment {
        -String paymentId
        -double amount
        -PaymentMethod method
        -PaymentStatus status
        +processPayment() boolean
    }

    class DisplayBoard {
        -Map~ParkingSpotType_Integer~ availableCount
        +update() void
    }

    class VehicleType {
        <<enumeration>>
        CAR
        TRUCK
        MOTORCYCLE
    }

    class ParkingSpotType {
        <<enumeration>>
        COMPACT
        LARGE
        MOTORCYCLE
        HANDICAPPED
    }

    class TicketStatus {
        <<enumeration>>
        ACTIVE
        PAID
        EXPIRED
    }

    ParkingLot *-- ParkingFloor : contains
    ParkingLot *-- EntryGate : has
    ParkingLot *-- ExitGate : has
    ParkingFloor *-- ParkingSpot : contains
    ParkingFloor *-- DisplayBoard : has

    ParkingSpot <|-- CompactSpot
    ParkingSpot <|-- LargeSpot
    ParkingSpot <|-- MotorcycleSpot
    ParkingSpot <|-- HandicappedSpot

    Vehicle <|-- Car
    Vehicle <|-- Truck
    Vehicle <|-- Motorcycle

    ParkingSpot --> Vehicle : holds
    ParkingTicket --> ParkingSpot : references
    ParkingTicket --> Vehicle : issuedFor
    EntryGate ..> ParkingTicket : creates
    ExitGate ..> Payment : initiates
    ExitGate ..> ParkingTicket : processes
```

### Key Design Decisions

1. **ParkingSpot is abstract** -- each subclass validates whether a vehicle type fits.
2. **Composition** between ParkingLot -> ParkingFloor -> ParkingSpot. Floors and spots cannot exist without the lot.
3. **Association** between ParkingSpot and Vehicle. The vehicle exists independently; it is just parked there.
4. **Dependency** for EntryGate -> ParkingTicket. The gate creates tickets but does not own them.
5. **Enums** for VehicleType, ParkingSpotType, TicketStatus keep magic strings out of the design.

---

## Complete Example 2: Library Management System

```mermaid
classDiagram
    class Library {
        -String name
        -String address
        -List~Book~ catalog
        -List~Member~ members
        +searchByTitle(title: String) List~Book~
        +searchByAuthor(author: String) List~Book~
        +searchByISBN(isbn: String) Book
    }

    class Book {
        -String isbn
        -String title
        -String author
        -String publisher
        -int totalCopies
        -List~BookCopy~ copies
        +getAvailableCopies() int
    }

    class BookCopy {
        -String barcode
        -BookStatus status
        -Book book
        +isAvailable() boolean
        +markCheckedOut() void
        +markReturned() void
    }

    class Person {
        <<abstract>>
        -String name
        -String email
        -String phone
        -String address
    }

    class Member {
        -String memberId
        -MembershipType type
        -Date memberSince
        -List~Loan~ activeLoans
        -int maxBooksAllowed
        +checkoutBook(copy: BookCopy) Loan
        +returnBook(loan: Loan) void
        +getActiveLoans() List~Loan~
        +hasOverdueBooks() boolean
    }

    class Librarian {
        -String employeeId
        +addBook(book: Book) void
        +removeBook(isbn: String) void
        +registerMember(member: Member) void
        +collectFine(fine: Fine) void
    }

    class Loan {
        -String loanId
        -BookCopy bookCopy
        -Member member
        -Date checkoutDate
        -Date dueDate
        -Date returnDate
        -LoanStatus status
        +isOverdue() boolean
        +calculateFine() double
        +markReturned() void
    }

    class Fine {
        -String fineId
        -Loan loan
        -double amount
        -FineStatus status
        -Date createdDate
        +pay() void
        +waive() void
    }

    class Notification {
        -String message
        -Date sentDate
        +send(member: Member) void
    }

    class BookStatus {
        <<enumeration>>
        AVAILABLE
        CHECKED_OUT
        RESERVED
        LOST
    }

    class MembershipType {
        <<enumeration>>
        STANDARD
        PREMIUM
        STUDENT
    }

    class LoanStatus {
        <<enumeration>>
        ACTIVE
        RETURNED
        OVERDUE
    }

    class FineStatus {
        <<enumeration>>
        UNPAID
        PAID
        WAIVED
    }

    Person <|-- Member
    Person <|-- Librarian

    Library o-- Book : has in catalog
    Library o-- Member : has

    Book *-- BookCopy : has copies

    Member "1" --> "0..*" Loan : borrows
    Loan "1" --> "1" BookCopy : for
    Loan "1" --> "0..1" Fine : may generate

    Librarian ..> Book : manages
    Librarian ..> Member : registers
    Librarian ..> Fine : collects

    Notification ..> Member : notifies
```

### Key Design Decisions

1. **Book vs BookCopy separation** -- a Book is a title (ISBN-level), while BookCopy is a physical copy with its own barcode and status. This is crucial for tracking which exact copy is checked out.
2. **Person as abstract superclass** -- both Member and Librarian share name, email, phone.
3. **Aggregation** for Library -> Book and Library -> Member. Books and members could conceptually be transferred to another library.
4. **Composition** for Book -> BookCopy. If the book title is removed from the system, its copies go too.
5. **Fine is associated with Loan**, not directly with Member. This traces exactly which checkout caused the fine.

---

## Complete Example 3: Elevator System

```mermaid
classDiagram
    class ElevatorSystem {
        -List~Elevator~ elevators
        -List~Floor~ floors
        -Scheduler scheduler
        +requestElevator(floor: int, direction: Direction) void
        +getStatus() List~ElevatorStatus~
    }

    class Elevator {
        -int elevatorId
        -int currentFloor
        -Direction direction
        -ElevatorState state
        -int capacity
        -int currentLoad
        -List~Request~ pendingRequests
        -Door door
        +moveUp() void
        +moveDown() void
        +openDoor() void
        +closeDoor() void
        +addRequest(request: Request) void
        +getNextStop() int
    }

    class Floor {
        -int floorNumber
        -UpButton upButton
        -DownButton downButton
        -DisplayPanel displayPanel
        +pressUp() void
        +pressDown() void
    }

    class Request {
        -int sourceFloor
        -int destinationFloor
        -Direction direction
        -DateTime timestamp
        -RequestType type
    }

    class Scheduler {
        <<interface>>
        +assignElevator(request: Request) Elevator
        +optimizeRoute(elevator: Elevator) List~int~
    }

    class LOOKScheduler {
        +assignElevator(request: Request) Elevator
        +optimizeRoute(elevator: Elevator) List~int~
    }

    class FCFSScheduler {
        +assignElevator(request: Request) Elevator
        +optimizeRoute(elevator: Elevator) List~int~
    }

    class Door {
        -DoorState state
        +open() void
        +close() void
        +isOpen() boolean
    }

    class Button {
        <<abstract>>
        -boolean isPressed
        +press() void
        +reset() void
    }

    class UpButton {
        +press() void
    }

    class DownButton {
        +press() void
    }

    class InternalButton {
        -int targetFloor
        +press() void
    }

    class DisplayPanel {
        -int currentFloor
        -Direction direction
        +update(floor: int, dir: Direction) void
    }

    class Direction {
        <<enumeration>>
        UP
        DOWN
        IDLE
    }

    class ElevatorState {
        <<enumeration>>
        MOVING
        STOPPED
        DOOR_OPEN
        MAINTENANCE
    }

    class DoorState {
        <<enumeration>>
        OPEN
        CLOSED
        OPENING
        CLOSING
    }

    class RequestType {
        <<enumeration>>
        EXTERNAL
        INTERNAL
    }

    ElevatorSystem *-- Elevator : manages
    ElevatorSystem *-- Floor : has
    ElevatorSystem --> Scheduler : uses

    Elevator *-- Door : has
    Elevator --> Request : processes

    Floor *-- Button : has
    Floor *-- DisplayPanel : has

    Button <|-- UpButton
    Button <|-- DownButton
    Button <|-- InternalButton

    Scheduler <|.. LOOKScheduler
    Scheduler <|.. FCFSScheduler

    Elevator ..> Floor : visits
```

### Key Design Decisions

1. **Scheduler as interface** -- uses Strategy pattern so you can swap LOOK, FCFS, or Shortest-Seek-First algorithms.
2. **Request separates external (floor button) from internal (cabin button)** requests.
3. **Composition** for Elevator -> Door. A door cannot exist without its elevator.
4. **Button hierarchy** -- UpButton, DownButton, InternalButton all share press/reset behavior.
5. **DisplayPanel** on each floor shows which floor the elevator is on and its direction.

---

## How to Draw Class Diagrams in an Interview

Follow this systematic process. Practice it until it is automatic.

### Step 1: Identify Entities (Nouns)

Read the problem statement and extract all nouns. These become candidate classes.

Example for "Design a parking lot system":
> Nouns: parking lot, floor, parking spot, vehicle, car, truck, motorcycle, ticket, gate, payment, display board

**Filter out:** attributes (name, color), primitives (int, string), and duplicates.

### Step 2: Identify Attributes

For each class, ask: "What data does this entity need to hold?"

```
ParkingSpot -> spotId, isAvailable, type
Vehicle -> licensePlate, type, color
Ticket -> ticketId, entryTime, exitTime, status
```

### Step 3: Identify Methods (Verbs)

Extract verbs from the problem requirements. These become methods on the appropriate class.

> "A vehicle enters the lot" -> ParkingLot.assignSpot(vehicle)
> "System issues a ticket" -> EntryGate.issueTicket(vehicle)
> "Payment is calculated" -> Ticket.calculateFee()

### Step 4: Define Relationships

For every pair of classes that interact, pick the right relationship:
- "Does A temporarily use B?" -> Dependency
- "Does A hold a reference to B?" -> Association
- "Does A contain B, but B can exist alone?" -> Aggregation
- "Does A own B, and B dies with A?" -> Composition
- "Is A a kind of B?" -> Inheritance
- "Does A implement B's contract?" -> Realization

### Step 5: Add Multiplicity

For each relationship, state how many of each end participate:
- One ParkingLot has many Floors (1 to *)
- One Floor has many ParkingSpots (1 to *)
- One ParkingSpot holds zero or one Vehicle (1 to 0..1)

### Step 6: Refine

- Extract common fields into abstract base classes
- Introduce interfaces for swappable behavior (Strategy pattern)
- Add enums for fixed sets of values
- Check: does every class have a clear single responsibility?

---

## Common Mistakes to Avoid

### 1. Confusing Aggregation and Composition

**Wrong:** Using composition between Library and Member (members exist without the library).
**Right:** Aggregation for Library-Member, composition for Order-OrderLineItem.

### 2. Making Everything Public

**Wrong:** All attributes marked `+`.
**Right:** Attributes should almost always be `-` (private). Only methods that form the public API should be `+`.

### 3. God Class

**Wrong:** One class with 20+ methods that does everything.
**Right:** Split responsibilities. A ParkingLot should not also handle payment processing.

### 4. Missing Abstract Classes / Interfaces

**Wrong:** Repeating the same attributes in Car, Truck, Motorcycle without a Vehicle parent.
**Right:** Extract a common abstract Vehicle class.

### 5. Bidirectional Associations Everywhere

**Wrong:** Student knows Course AND Course knows Student for every relationship.
**Right:** Use unidirectional associations unless both directions are genuinely needed.

### 6. Putting Implementation Details in the Diagram

**Wrong:** Including HashMap, ArrayList, synchronized, getter/setter for every field.
**Right:** Use domain-level types. Show `List<Item>` not `ArrayList<Item>`. Omit trivial getters/setters.

### 7. Forgetting Enums

**Wrong:** Using raw strings for status fields like "ACTIVE", "PAID", "EXPIRED".
**Right:** Define an enum class and reference it as the attribute type.

### 8. No Multiplicity Labels

**Wrong:** Drawing lines without specifying how many objects participate.
**Right:** Always add multiplicity -- it conveys critical design information.

---

## Quick Reference: Mermaid Class Diagram Syntax

```
classDiagram
    %% Class definition
    class ClassName {
        -privateAttr: Type
        +publicMethod() ReturnType
    }

    %% Stereotypes
    class MyInterface {
        <<interface>>
    }
    class MyAbstract {
        <<abstract>>
    }
    class MyEnum {
        <<enumeration>>
    }

    %% Relationships
    A --|> B : inherits
    A ..|> B : implements
    A --> B : association
    A ..> B : dependency
    A o-- B : aggregation
    A *-- B : composition

    %% Multiplicity
    A "1" --> "0..*" B : label

    %% Generics
    class Container~T~ {
        +add(item: T) void
        +get(index: int) T
    }

    %% Notes
    note for ClassName "This is a note"
```

---

## Interview Cheat Sheet

| Situation | What to Draw |
|-----------|-------------|
| Interviewer says "Design X" | Start with class diagram immediately |
| Multiple similar objects | Create inheritance hierarchy |
| Swappable algorithms | Interface + multiple implementations |
| Whole-part with ownership | Composition (*--) |
| Whole-part without ownership | Aggregation (o--) |
| Object uses another briefly | Dependency (..>) |
| Object holds reference to another | Association (-->) |
| Fixed set of values | Enumeration |
| Shared behavior across classes | Abstract base class |

**Time budget in a 45-minute interview:**
- 5 minutes: clarify requirements, identify entities
- 10 minutes: draw class diagram with relationships
- 15 minutes: add key methods, discuss design patterns
- 15 minutes: add sequence diagrams for complex flows, discuss tradeoffs
