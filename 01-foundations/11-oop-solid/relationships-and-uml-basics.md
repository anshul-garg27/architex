# OOP Relationships and UML Basics

> Understanding relationships between classes is essential for system design.
> UML (Unified Modeling Language) gives us a standard visual vocabulary.

---

## All OOP Relationships (Weakest to Strongest)

```
  Weakest                                                    Strongest
    │                                                            │
    v                                                            v
  Dependency ──> Association ──> Aggregation ──> Composition ──> Inheritance
  (uses)        (knows)         (has, shared)   (has, owned)    (is-a)

  Also: Realization/Implementation (implements an interface)
```

---

## 1. Dependency (Weakest Relationship)

> "A uses B, but only temporarily."

### UML Notation

```
  ┌───────────┐           ┌───────────┐
  │  ClassA   │- - - - - >│  ClassB   │
  └───────────┘  dashed   └───────────┘
                 arrow
```

### Definition

Class A _depends on_ Class B if A uses B in a method parameter, local variable, or
static method call -- but does NOT store B as a field. B appears and disappears within
a single method call.

### When to Use

- Helper/utility classes
- Factory method parameters
- Temporary collaborators

### Code Example

```java
public class OrderService {
    // OrderService DEPENDS ON EmailFormatter
    // It uses EmailFormatter temporarily but does not store it
    public void sendConfirmation(Order order) {
        String body = EmailFormatter.format(order);  // static call -- dependency
        emailClient.send(order.getEmail(), "Confirmation", body);
    }
}

public class ReportGenerator {
    // Depends on PdfWriter -- only used inside this method
    public void generateReport(List<Order> orders) {
        PdfWriter writer = new PdfWriter();  // local variable -- dependency
        writer.write(orders);
    }
}
```

**Key test:** If you remove the method that uses B, does A still reference B? If no,
it's a dependency.

---

## 2. Association

> "A knows about B and maintains a lasting reference."

### UML Notation

```
  ┌───────────┐           ┌───────────┐
  │  ClassA   │───────────│  ClassB   │
  └───────────┘   solid   └───────────┘
                  line
```

Optionally with multiplicity and role names:

```
  ┌───────────┐  teaches   ┌───────────┐
  │  Teacher  │ 1────────* │  Student  │
  └───────────┘            └───────────┘
  One teacher teaches many students
```

### Definition

Class A holds a reference (field) to Class B, and both can exist independently.
Neither owns the other. The lifecycle of A and B are independent.

### When to Use

- Peer-to-peer relationships
- References that don't imply ownership
- Navigable relationships in domain models

### Code Example

```java
public class Teacher {
    private String name;
    private List<Student> students;  // Association: Teacher KNOWS students

    public Teacher(String name) {
        this.name = name;
        this.students = new ArrayList<>();
    }

    public void addStudent(Student student) {
        students.add(student);
    }
}

public class Student {
    private String name;
    private Teacher advisor;  // Association: Student KNOWS teacher

    public Student(String name) {
        this.name = name;
    }

    public void setAdvisor(Teacher teacher) {
        this.advisor = teacher;
    }
}

// Both exist independently. Deleting a Teacher does NOT delete Students.
```

---

## 3. Aggregation (Shared Ownership)

> "A has B, but B can exist without A."

### UML Notation

```
  ┌───────────┐           ┌───────────┐
  │  ClassA   │◇──────────│  ClassB   │
  └───────────┘  hollow   └───────────┘
                 diamond
                 on A's side
```

### Definition

A special form of association where A _contains_ B (whole-part relationship), but B
has an independent lifecycle. B can be shared among multiple A's. If A is destroyed,
B survives.

### When to Use

- "Has" relationships where the part is shared
- Collections of external objects
- Team-member, department-employee relationships

### Code Example

```java
public class Department {
    private String name;
    private List<Employee> employees;  // Aggregation: Department HAS employees

    public Department(String name) {
        this.name = name;
        this.employees = new ArrayList<>();
    }

    public void addEmployee(Employee emp) {
        employees.add(emp);  // Employee was created OUTSIDE, passed IN
    }
}

public class Employee {
    private String name;
    // Employee exists independently of any Department.
    // An employee can belong to multiple departments.
    // If the Department is dissolved, the Employee still exists.
}

// Usage:
Employee alice = new Employee("Alice");
Department engineering = new Department("Engineering");
Department research = new Department("Research");

engineering.addEmployee(alice);  // alice shared between two departments
research.addEmployee(alice);     // alice is NOT owned by either department
```

**Key test:** If you destroy A, does B still exist? If yes, it's aggregation.

---

## 4. Composition (Exclusive Ownership)

> "A owns B. When A dies, B dies with it."

### UML Notation

```
  ┌───────────┐           ┌───────────┐
  │  ClassA   │◆──────────│  ClassB   │
  └───────────┘  filled   └───────────┘
                 diamond
                 on A's side
```

### Definition

A strong form of aggregation where A exclusively _owns_ B. B cannot exist without A.
When A is destroyed, B is destroyed. B is typically created inside A.

### When to Use

- Whole-part relationships with exclusive ownership
- Components that have no meaning without their container
- Value objects embedded in entities

### Code Example

```java
public class House {
    private final List<Room> rooms;  // Composition: House OWNS rooms

    public House(int numberOfRooms) {
        this.rooms = new ArrayList<>();
        for (int i = 0; i < numberOfRooms; i++) {
            rooms.add(new Room(30 + i * 5));  // Rooms created INSIDE House
        }
    }
    // When House is garbage-collected, all Rooms go with it.
    // A Room has no meaning outside of a House.
}

public class Room {
    private final int squareFeet;

    Room(int squareFeet) {  // package-private: only House should create Rooms
        this.squareFeet = squareFeet;
    }
}

// Another example: Order owns OrderLineItems
public class Order {
    private final String orderId;
    private final List<LineItem> items = new ArrayList<>();  // composition

    public void addItem(String product, int quantity, double price) {
        items.add(new LineItem(product, quantity, price));  // created internally
    }
    // LineItems are meaningless without their Order.
    // Deleting Order deletes all LineItems.
}
```

### Aggregation vs Composition Decision Guide

```
┌────────────────────────┬──────────────┬──────────────┐
│ Question               │ Aggregation  │ Composition  │
├────────────────────────┼──────────────┼──────────────┤
│ Part created by whole? │ No (external)│ Yes (internal│
│ Part shared?           │ Yes          │ No           │
│ Part survives whole?   │ Yes          │ No           │
│ Lifecycle coupled?     │ Independent  │ Same         │
│ Diamond fill           │ Hollow ◇     │ Filled ◆     │
│ Examples               │ Team-Player  │ Body-Heart   │
│                        │ Dept-Employee│ Order-LineItem│
│                        │ Playlist-Song│ House-Room   │
└────────────────────────┴──────────────┴──────────────┘
```

---

## 5. Inheritance (Generalization)

> "B is a specialized version of A."

### UML Notation

```
  ┌───────────┐
  │  ClassA   │       △ hollow triangle
  └─────┬─────┘       │ (arrowhead on parent)
        △             │
        │             │
  ┌─────┴─────┐
  │  ClassB   │
  └───────────┘
```

### Definition

Class B _extends_ Class A. B inherits all accessible fields and methods of A. B IS-A
type of A. This is the strongest relationship -- changes to A directly affect B.

### Code Example

```java
public class Shape {
    protected double x, y;

    public double getX() { return x; }
    public double getY() { return y; }
    public void moveTo(double x, double y) { this.x = x; this.y = y; }
}

public class Circle extends Shape {    // Circle IS-A Shape
    private double radius;

    public double area() { return Math.PI * radius * radius; }
}

public class Rectangle extends Shape {  // Rectangle IS-A Shape
    private double width, height;

    public double area() { return width * height; }
}
```

---

## 6. Realization / Implementation

> "Class B fulfills the contract defined by Interface A."

### UML Notation

```
  ┌─────────────────┐
  │ <<interface>>    │       ▷ dashed line with hollow triangle
  │   InterfaceA    │
  └────────┬────────┘
           ▷
           :     (dashed line)
           :
  ┌────────┴────────┐
  │    ClassB       │
  └─────────────────┘
```

### Definition

Class B _implements_ Interface A. B provides concrete behavior for all abstract
methods declared in A. This is similar to inheritance but purely contractual -- no
implementation is inherited (except default methods).

### Code Example

```java
public interface Sortable {
    void sort(List<?> items);
}

public class QuickSort implements Sortable {
    @Override
    public void sort(List<?> items) {
        // quicksort implementation
    }
}

public class MergeSort implements Sortable {
    @Override
    public void sort(List<?> items) {
        // mergesort implementation
    }
}
```

---

## All Six Relationships Summary

```
┌─────────────────┬───────────┬──────────────┬────────────────────────────┐
│ Relationship     │ UML       │ Strength     │ Java Keyword / Pattern     │
├─────────────────┼───────────┼──────────────┼────────────────────────────┤
│ Dependency       │ ---->     │ Weakest      │ method param, local var    │
│ Association      │ ─────     │ Weak         │ field reference            │
│ Aggregation      │ ◇─────   │ Medium       │ field (external creation)  │
│ Composition      │ ◆─────   │ Strong       │ field (internal creation)  │
│ Inheritance      │ ──△      │ Strongest    │ extends                    │
│ Realization      │ --▷      │ Contract     │ implements                 │
└─────────────────┴───────────┴──────────────┴────────────────────────────┘
```

---

## Multiplicity

Multiplicity indicates how many objects participate in a relationship.

```
┌──────────┬───────────────────────────────────────────────┐
│ Notation │ Meaning                                       │
├──────────┼───────────────────────────────────────────────┤
│    1     │ Exactly one                                   │
│   0..1   │ Zero or one (optional)                        │
│    *     │ Zero or more                                  │
│   1..*   │ One or more (at least one)                    │
│   0..*   │ Zero or more (same as *)                      │
│   3..7   │ Between 3 and 7                               │
└──────────┴───────────────────────────────────────────────┘
```

### Examples

```
  ┌──────────┐ 1        * ┌──────────┐
  │ Customer │────────────│  Order   │   One customer has many orders
  └──────────┘            └──────────┘

  ┌──────────┐ *        * ┌──────────┐
  │ Student  │────────────│  Course  │   Many students take many courses
  └──────────┘            └──────────┘

  ┌──────────┐ 1     0..1 ┌──────────┐
  │  Person  │────────────│  Spouse  │   A person has zero or one spouse
  └──────────┘            └──────────┘

  ┌──────────┐ 1     1..* ┌──────────┐
  │  Order   │◆───────────│ LineItem │   An order has at least one line item
  └──────────┘            └──────────┘
```

---

## ASCII Class Diagram: Library Management System

This example shows ALL relationship types in one diagram:

```
┌───────────────────────────────────────────────────────────────────────────┐
│                     LIBRARY MANAGEMENT SYSTEM                            │
└───────────────────────────────────────────────────────────────────────────┘

  ┌─────────────────────┐
  │   <<interface>>     │
  │   Searchable        │
  │                     │
  │ +search(query): List│
  └──────────┬──────────┘
             ▷                        Realization
             :                        (implements)
             :
  ┌──────────┴──────────┐  1     1..* ┌─────────────────────┐
  │      Library        │◆────────────│      Shelf          │
  │                     │  Composition│                     │
  │ -name: String       │  (Library   │ -shelfNumber: int   │
  │ -address: String    │   owns      │ -capacity: int      │
  │                     │   shelves)  │                     │
  │ +search(query): List│             │ +addBook(Book)      │
  │ +registerMember()   │             │ +isFull(): boolean  │
  └──────────┬──────────┘             └─────────────────────┘
             │
             │ 1
             │           Association
             │ *         (Library knows Members)
  ┌──────────┴──────────┐
  │      Member         │
  │                     │
  │ -memberId: String   │  1     0..* ┌─────────────────────┐
  │ -name: String       │────────────│     Loan            │
  │ -email: String      │ Association│                     │
  │                     │            │ -loanDate: Date     │
  │ +borrow(Book)       │            │ -dueDate: Date      │
  │ +returnBook(Book)   │            │ -returned: boolean  │
  └─────────────────────┘            │                     │
                                     │ +isOverdue(): bool  │
             ┌───────────────────────┤                     │
             │                       └─────────────────────┘
             │ 1
             │ (Loan references a Book)
             │
  ┌──────────┴──────────┐
  │      Book           │
  │                     │
  │ -isbn: String       │
  │ -title: String      │
  │ -available: boolean │
  │                     │                ┌─────────────────────┐
  │ +getDetails(): Info │◇───────────── │     Author          │
  └──────────┬──────────┘  Aggregation  │                     │
             │             (Book has     │ -name: String       │
             │              Authors,     │ -biography: String  │
             △              Authors      │                     │
             │              exist        │ +getBooks(): List   │
             │              independently└─────────────────────┘
     ┌───────┴────────┐
     │                │
┌────┴────────┐ ┌─────┴───────┐
│ PrintBook   │ │  EBook      │     Inheritance
│             │ │             │     (IS-A Book)
│ -pages: int │ │ -fileSize   │
│ -weight     │ │ -format     │
│             │ │             │
│ +getShelf() │ │ +download() │
└─────────────┘ └─────────────┘
         │
         │          Dependency
         └ - - - -> ┌─────────────────────┐
          (uses      │   PdfFormatter     │
           temporarily│                    │
           to format  │ +format(Book): PDF │
           for print) └─────────────────────┘
```

### Relationships in the Diagram

```
┌──────────────────────┬─────────────────────────────────────────────────┐
│ Relationship         │ Where in the Diagram                           │
├──────────────────────┼─────────────────────────────────────────────────┤
│ Realization (--▷)    │ Library implements Searchable                   │
│ Composition (◆)      │ Library owns Shelves (shelves die with library)│
│ Association (──)     │ Library - Member (both live independently)     │
│ Association (──)     │ Member - Loan (member has loan history)        │
│ Aggregation (◇)      │ Book - Author (authors exist independently)   │
│ Inheritance (△)       │ PrintBook and EBook extend Book               │
│ Dependency (--->)    │ PrintBook uses PdfFormatter temporarily       │
└──────────────────────┴─────────────────────────────────────────────────┘
```

### The Code Behind the Diagram

```java
// Realization
public interface Searchable {
    List<Book> search(String query);
}

// Composition: Library OWNS Shelves
public class Library implements Searchable {
    private final String name;
    private final List<Shelf> shelves;      // composition -- created internally
    private final List<Member> members;     // association -- exist independently

    public Library(String name, int numShelves) {
        this.name = name;
        this.shelves = new ArrayList<>();
        for (int i = 0; i < numShelves; i++) {
            shelves.add(new Shelf(i + 1, 100)); // created HERE, owned by Library
        }
        this.members = new ArrayList<>();
    }

    @Override
    public List<Book> search(String query) { /* ... */ }
    public void registerMember(Member member) { members.add(member); }
}

// Aggregation: Book HAS Authors (shared, independent lifecycle)
public class Book {
    private final String isbn;
    private final String title;
    private final List<Author> authors;  // aggregation -- authors passed in
    private boolean available = true;

    public Book(String isbn, String title, List<Author> authors) {
        this.isbn = isbn;
        this.title = title;
        this.authors = authors;  // NOT created here -- passed from outside
    }
}

// Inheritance: PrintBook IS-A Book
public class PrintBook extends Book {
    private final int pages;
    private final double weight;

    public PrintBook(String isbn, String title, List<Author> authors,
                     int pages, double weight) {
        super(isbn, title, authors);
        this.pages = pages;
        this.weight = weight;
    }

    // Dependency: uses PdfFormatter temporarily
    public byte[] getFormattedPdf() {
        PdfFormatter formatter = new PdfFormatter();  // local -- dependency
        return formatter.format(this);
    }
}

// Association: Member KNOWS about Loans
public class Member {
    private final String memberId;
    private final String name;
    private final List<Loan> loans = new ArrayList<>();  // association

    public Loan borrow(Book book) {
        Loan loan = new Loan(this, book, LocalDate.now(), LocalDate.now().plusDays(14));
        loans.add(loan);
        return loan;
    }
}
```

---

## Coupling vs Cohesion

### Coupling (Between Modules)

```
  TIGHT COUPLING (BAD):               LOOSE COUPLING (GOOD):

  ┌──────┐    ┌──────┐               ┌──────┐    ┌───────────┐    ┌──────┐
  │  A   │───>│  B   │               │  A   │───>│ Interface │<───│  B   │
  │      │<───│      │               └──────┘    └───────────┘    └──────┘
  └──────┘    └──────┘
                                      A and B only know the interface.
  A knows B's internals.              Change B's implementation freely.
  Change B = change A.                A never changes.
```

**Types of coupling (strongest to weakest):**

```
┌─────────────────────┬──────────────────────────────────────────────────┐
│ Type                │ Description                                      │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Content coupling    │ A modifies B's internal data directly (worst)   │
│ Common coupling     │ A and B share global data                       │
│ Control coupling    │ A passes a flag that controls B's behavior      │
│ Stamp coupling      │ A passes a data structure but B only uses part  │
│ Data coupling       │ A passes only the data B needs (best)           │
│ Message coupling    │ A sends a message; B handles it (loosest)       │
└─────────────────────┴──────────────────────────────────────────────────┘
```

### Cohesion (Within a Module)

```
  LOW COHESION (BAD):                  HIGH COHESION (GOOD):

  ┌──────────────────────┐            ┌────────────────┐
  │   UtilityClass       │            │ PayCalculator  │
  │                      │            │                │
  │ +calculatePay()      │            │ +calculate()   │
  │ +sendEmail()         │            │ +applyTax()    │
  │ +formatDate()        │            │ +applyBonus()  │
  │ +connectToDb()       │            │ +overtime()    │
  │ +generatePdf()       │            └────────────────┘
  └──────────────────────┘
                                      Every method relates to
  Methods are unrelated.              pay calculation. Focused.
  God class. Kitchen sink.
```

**Types of cohesion (weakest to strongest):**

```
┌─────────────────────────┬──────────────────────────────────────────────┐
│ Type                    │ Description                                  │
├─────────────────────────┼──────────────────────────────────────────────┤
│ Coincidental            │ Methods are random, unrelated (worst)       │
│ Logical                 │ Methods related by category, not function   │
│ Temporal                │ Methods run at the same time (init stuff)   │
│ Procedural              │ Methods must run in a specific order        │
│ Communicational         │ Methods operate on the same data            │
│ Sequential              │ Output of one method is input of the next   │
│ Functional              │ All methods contribute to ONE task (best)   │
└─────────────────────────┴──────────────────────────────────────────────┘
```

### The Golden Rule

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   LOOSE COUPLING  +  HIGH COHESION  =  GOOD    │
│                                                 │
│   TIGHT COUPLING  +  LOW COHESION   =  BAD     │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## How to Identify Relationship Types in Interviews

When given a scenario and asked "What relationship is this?", use this decision tree:

```
  Does A merely use B in a method call (parameter/local variable)?
       │
       YES ──> DEPENDENCY (weakest, dashed arrow)
       │
       NO ──> Does A store a reference to B as a field?
              │
              YES ──> Is it a whole-part relationship?
              │       │
              │       NO ──> ASSOCIATION (solid line)
              │       │
              │       YES ──> Does A CREATE B internally and B cannot
              │               exist without A?
              │               │
              │               YES ──> COMPOSITION (filled diamond ◆)
              │               │
              │               NO ──> AGGREGATION (hollow diamond ◇)
              │
              Does A extend B (inherit)?
              │
              YES ──> INHERITANCE (hollow triangle △)
              │
              Does A implement B (interface)?
              │
              YES ──> REALIZATION (dashed triangle ▷)
```

### Quick Examples for Interview Practice

```
┌──────────────────────────────┬────────────────┐
│ Scenario                     │ Relationship    │
├──────────────────────────────┼────────────────┤
│ Car has an Engine            │ Composition    │
│ Team has Players             │ Aggregation    │
│ Student enrolls in Course    │ Association    │
│ Dog is an Animal             │ Inheritance    │
│ ArrayList implements List    │ Realization    │
│ Logger used in a method      │ Dependency     │
│ Order contains LineItems     │ Composition    │
│ Library has Books            │ Aggregation    │
│ Person has a Spouse          │ Association    │
│ Heart belongs to a Body      │ Composition    │
│ Department has Employees     │ Aggregation    │
│ Controller uses a Service    │ Association    │
│ Builder creates a Product    │ Dependency     │
└──────────────────────────────┴────────────────┘
```

### Interview Tip

When drawing class diagrams in an interview:

1. Start with the **nouns** in the problem statement -- these become classes
2. Identify **verbs** -- these become methods or relationships
3. Determine **ownership** -- does the container create and own the part?
4. Label **multiplicity** -- how many of each?
5. Use the decision tree above to pick the right relationship type
6. Draw the diagram with proper UML notation

You don't need to be pixel-perfect. The interviewer wants to see that you understand
the SEMANTICS of each relationship type, not that you can draw a perfect diamond.
