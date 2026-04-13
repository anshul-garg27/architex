# Behavioral Design Patterns -- Complete Interview Guide

Behavioral patterns deal with **algorithms, communication between objects, and assignment
of responsibilities**. They describe how objects interact and distribute work.

> **Interview Insight**: Strategy, Observer, State, and Command are the top 4.
> If you know these four deeply, you can handle 90% of LLD interview patterns.

---

## 1. Strategy Pattern

### What
Defines a **family of algorithms**, encapsulates each one, and makes them **interchangeable**.
Strategy lets the algorithm vary independently from the clients that use it.

This is the **single most important pattern for LLD interviews**.

### When to Use
- Multiple algorithms for the same task (sorting, pricing, routing, payment)
- You want to swap behavior at runtime
- You have conditional logic (`if/else`, `switch`) that selects behavior -- replace with Strategy
- You want to follow the Open-Closed Principle

### Structure

```
+-------------------+         +--------------------+
|    Context        |-------->|    Strategy         |
+-------------------+  has-a  | (interface)         |
| - strategy: Strat |         +--------------------+
| + execute()       |         | + execute(data)    |
+-------------------+         +--------------------+
                                   ^    ^    ^
                                   |    |    |
                              StratA  StratB  StratC
```

### Implementation -- Payment Processing

```java
// Strategy interface
public interface PaymentStrategy {
    boolean pay(double amount);
    String getName();
}

// Concrete strategies
public class CreditCardPayment implements PaymentStrategy {
    private final String cardNumber;
    private final String cvv;

    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("Paid $%.2f via Credit Card ending %s%n",
            amount, cardNumber.substring(cardNumber.length() - 4));
        return true;
    }

    @Override
    public String getName() { return "CreditCard"; }
}

public class UPIPayment implements PaymentStrategy {
    private final String upiId;

    public UPIPayment(String upiId) {
        this.upiId = upiId;
    }

    @Override
    public boolean pay(double amount) {
        System.out.printf("Paid $%.2f via UPI: %s%n", amount, upiId);
        return true;
    }

    @Override
    public String getName() { return "UPI"; }
}

public class WalletPayment implements PaymentStrategy {
    private double balance;

    public WalletPayment(double balance) {
        this.balance = balance;
    }

    @Override
    public boolean pay(double amount) {
        if (balance >= amount) {
            balance -= amount;
            System.out.printf("Paid $%.2f from Wallet. Remaining: $%.2f%n",
                amount, balance);
            return true;
        }
        System.out.println("Insufficient wallet balance");
        return false;
    }

    @Override
    public String getName() { return "Wallet"; }
}

// Context
public class PaymentProcessor {
    private PaymentStrategy strategy;

    public void setPaymentStrategy(PaymentStrategy strategy) {
        this.strategy = strategy;
    }

    public boolean processPayment(double amount) {
        if (strategy == null) {
            throw new IllegalStateException("Payment strategy not set");
        }
        System.out.println("Processing with: " + strategy.getName());
        return strategy.pay(amount);
    }
}

// Usage -- swap at runtime
PaymentProcessor processor = new PaymentProcessor();
processor.setPaymentStrategy(new CreditCardPayment("4111111111111111", "123"));
processor.processPayment(99.99);

processor.setPaymentStrategy(new UPIPayment("user@paytm"));
processor.processPayment(49.99);
```

### Pricing Strategy Example (LLD Classic)

```java
public interface PricingStrategy {
    double calculatePrice(double basePrice, Order order);
}

public class RegularPricing implements PricingStrategy {
    public double calculatePrice(double basePrice, Order order) {
        return basePrice;
    }
}

public class HolidayPricing implements PricingStrategy {
    private final double surchargePercent;

    public HolidayPricing(double surchargePercent) {
        this.surchargePercent = surchargePercent;
    }

    public double calculatePrice(double basePrice, Order order) {
        return basePrice * (1 + surchargePercent / 100);
    }
}

public class SurgePricing implements PricingStrategy {
    public double calculatePrice(double basePrice, Order order) {
        double demandFactor = getDemandMultiplier(order.getLocation());
        return basePrice * demandFactor;
    }
}
```

### Interview Tip
"Anywhere the interviewer says 'this could change' or 'there are multiple ways to do X',
that is a Strategy. Payment method, pricing algorithm, notification channel, sorting
order, parking fee calculation -- all Strategy."

---

## 2. Observer Pattern

### What
Defines a **one-to-many dependency** between objects so that when one object (the subject)
changes state, all its dependents (observers) are **notified and updated automatically**.

### When to Use
- An event in one object should trigger updates in other objects
- You do not know at compile time how many objects will need to react
- You want loose coupling between the event source and handlers

### Structure

```
+---------------------+         +-------------------+
|    Subject          |-------->|    Observer        |
+---------------------+ 1..*   | (interface)        |
| - observers: List   |        +-------------------+
| + attach(Observer)  |        | + update(data)    |
| + detach(Observer)  |        +-------------------+
| + notifyAll()       |               ^    ^    ^
+---------------------+               |    |    |
                                  ObsA   ObsB   ObsC
```

### Implementation -- Event Notification System

```java
// Observer interface
public interface EventListener {
    void update(String eventType, Object data);
}

// Subject
public class EventManager {
    private final Map<String, List<EventListener>> listeners = new HashMap<>();

    public void subscribe(String eventType, EventListener listener) {
        listeners.computeIfAbsent(eventType, k -> new ArrayList<>()).add(listener);
    }

    public void unsubscribe(String eventType, EventListener listener) {
        List<EventListener> list = listeners.get(eventType);
        if (list != null) list.remove(listener);
    }

    public void notify(String eventType, Object data) {
        List<EventListener> list = listeners.getOrDefault(eventType, List.of());
        for (EventListener listener : list) {
            listener.update(eventType, data);
        }
    }
}

// Concrete observers
public class EmailAlertListener implements EventListener {
    private final String email;

    public EmailAlertListener(String email) { this.email = email; }

    @Override
    public void update(String eventType, Object data) {
        System.out.printf("Email to %s: [%s] %s%n", email, eventType, data);
    }
}

public class SMSAlertListener implements EventListener {
    private final String phone;

    public SMSAlertListener(String phone) { this.phone = phone; }

    @Override
    public void update(String eventType, Object data) {
        System.out.printf("SMS to %s: [%s] %s%n", phone, eventType, data);
    }
}

public class DashboardListener implements EventListener {
    @Override
    public void update(String eventType, Object data) {
        System.out.printf("Dashboard update: [%s] %s%n", eventType, data);
    }
}

// Usage in an Order system
public class OrderService {
    private final EventManager events = new EventManager();

    public EventManager getEvents() { return events; }

    public void placeOrder(Order order) {
        // business logic...
        order.setStatus(OrderStatus.PLACED);
        events.notify("ORDER_PLACED", order);
    }

    public void cancelOrder(Order order) {
        order.setStatus(OrderStatus.CANCELLED);
        events.notify("ORDER_CANCELLED", order);
    }
}

// Wire up
OrderService service = new OrderService();
service.getEvents().subscribe("ORDER_PLACED", new EmailAlertListener("user@ex.com"));
service.getEvents().subscribe("ORDER_PLACED", new SMSAlertListener("+1234567890"));
service.getEvents().subscribe("ORDER_CANCELLED", new DashboardListener());

service.placeOrder(new Order(1, 99.99));
// Email to user@ex.com: [ORDER_PLACED] Order#1
// SMS to +1234567890: [ORDER_PLACED] Order#1
```

### Interview Tip
"Observer is used whenever a state change in one object must notify many others.
Order placed -> notify inventory, notification, analytics, billing. All observers
are decoupled from the order service."

---

## 3. Command Pattern

### What
Encapsulates a **request as an object**, thereby letting you parameterize clients
with different requests, queue or log requests, and support **undoable operations**.

### When to Use
- Undo/redo functionality
- Macro recording (sequence of operations)
- Task queues and deferred execution
- Transaction logs that can replay
- Decoupling the sender from the handler of a request

### Structure

```
+-----------+     +------------------+     +------------+
| Invoker   |---->| Command          |---->| Receiver   |
+-----------+     | (interface)      |     +------------+
| +execute()|     +------------------+     | + action() |
+-----------+     | + execute()      |     +------------+
                  | + undo()         |
                  +------------------+
                      ^        ^
                      |        |
              CommandA      CommandB
```

### Implementation -- Text Editor with Undo/Redo

```java
// Command interface
public interface Command {
    void execute();
    void undo();
    String getDescription();
}

// Receiver
public class TextEditor {
    private StringBuilder text = new StringBuilder();

    public void insertText(int position, String content) {
        text.insert(position, content);
    }

    public void deleteText(int position, int length) {
        text.delete(position, position + length);
    }

    public String getText() { return text.toString(); }
}

// Concrete commands
public class InsertCommand implements Command {
    private final TextEditor editor;
    private final int position;
    private final String content;

    public InsertCommand(TextEditor editor, int position, String content) {
        this.editor   = editor;
        this.position = position;
        this.content  = content;
    }

    @Override
    public void execute() {
        editor.insertText(position, content);
    }

    @Override
    public void undo() {
        editor.deleteText(position, content.length());
    }

    @Override
    public String getDescription() {
        return "Insert '" + content + "' at " + position;
    }
}

public class DeleteCommand implements Command {
    private final TextEditor editor;
    private final int position;
    private final int length;
    private String deletedText; // saved for undo

    public DeleteCommand(TextEditor editor, int position, int length) {
        this.editor   = editor;
        this.position = position;
        this.length   = length;
    }

    @Override
    public void execute() {
        deletedText = editor.getText().substring(position, position + length);
        editor.deleteText(position, length);
    }

    @Override
    public void undo() {
        editor.insertText(position, deletedText);
    }

    @Override
    public String getDescription() {
        return "Delete " + length + " chars at " + position;
    }
}

// Invoker -- manages history
public class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();

    public void execute(Command cmd) {
        cmd.execute();
        undoStack.push(cmd);
        redoStack.clear();  // new action invalidates redo history
    }

    public void undo() {
        if (!undoStack.isEmpty()) {
            Command cmd = undoStack.pop();
            cmd.undo();
            redoStack.push(cmd);
        }
    }

    public void redo() {
        if (!redoStack.isEmpty()) {
            Command cmd = redoStack.pop();
            cmd.execute();
            undoStack.push(cmd);
        }
    }
}

// Usage
TextEditor editor = new TextEditor();
CommandHistory history = new CommandHistory();

history.execute(new InsertCommand(editor, 0, "Hello "));
history.execute(new InsertCommand(editor, 6, "World!"));
System.out.println(editor.getText());  // "Hello World!"

history.undo();
System.out.println(editor.getText());  // "Hello "

history.redo();
System.out.println(editor.getText());  // "Hello World!"
```

---

## 4. State Pattern

### What
Allows an object to **alter its behavior when its internal state changes**. The object
will appear to change its class. Each state is encapsulated in its own class.

### When to Use
- Object behavior depends on its state and must change at runtime
- Operations have large conditional statements that depend on the object's state
- State transitions follow well-defined rules (finite state machine)

### Structure

```
+-------------------+         +-------------------+
|    Context        |-------->|    State           |
+-------------------+  has-a  | (interface)        |
| - state: State    |         +-------------------+
| + request()       |         | + handle(Context) |
|   --> state.handle|         +-------------------+
+-------------------+              ^    ^    ^
                                   |    |    |
                              StateA  StateB  StateC
```

### Implementation -- Vending Machine

```java
// State interface
public interface VendingMachineState {
    void insertCoin(VendingMachine machine, double amount);
    void selectProduct(VendingMachine machine, String product);
    void dispense(VendingMachine machine);
    void cancel(VendingMachine machine);
}

// Context
public class VendingMachine {
    private VendingMachineState state;
    private double balance;
    private String selectedProduct;
    private Map<String, Double> inventory; // product -> price

    public VendingMachine() {
        this.state     = new IdleState();
        this.balance   = 0;
        this.inventory = new HashMap<>();
        inventory.put("Cola", 1.50);
        inventory.put("Chips", 2.00);
        inventory.put("Water", 1.00);
    }

    // Delegate to current state
    public void insertCoin(double amount)    { state.insertCoin(this, amount); }
    public void selectProduct(String product){ state.selectProduct(this, product); }
    public void dispense()                   { state.dispense(this); }
    public void cancel()                     { state.cancel(this); }

    // State transition
    public void setState(VendingMachineState state) { this.state = state; }

    // Getters/setters for state classes
    public double getBalance()             { return balance; }
    public void addBalance(double amount)  { balance += amount; }
    public void resetBalance()             { balance = 0; }
    public String getSelectedProduct()     { return selectedProduct; }
    public void setSelectedProduct(String p){ selectedProduct = p; }
    public Double getProductPrice(String p){ return inventory.get(p); }
}

// Concrete states
public class IdleState implements VendingMachineState {
    @Override
    public void insertCoin(VendingMachine m, double amount) {
        m.addBalance(amount);
        System.out.println("Inserted: $" + amount + ". Balance: $" + m.getBalance());
        m.setState(new HasMoneyState());
    }

    @Override
    public void selectProduct(VendingMachine m, String product) {
        System.out.println("Insert coin first!");
    }

    @Override
    public void dispense(VendingMachine m) {
        System.out.println("Insert coin and select product first!");
    }

    @Override
    public void cancel(VendingMachine m) {
        System.out.println("Nothing to cancel.");
    }
}

public class HasMoneyState implements VendingMachineState {
    @Override
    public void insertCoin(VendingMachine m, double amount) {
        m.addBalance(amount);
        System.out.println("Added: $" + amount + ". Balance: $" + m.getBalance());
    }

    @Override
    public void selectProduct(VendingMachine m, String product) {
        Double price = m.getProductPrice(product);
        if (price == null) {
            System.out.println("Product not found: " + product);
            return;
        }
        if (m.getBalance() >= price) {
            m.setSelectedProduct(product);
            m.setState(new DispensingState());
            m.dispense();
        } else {
            System.out.printf("Need $%.2f more%n", price - m.getBalance());
        }
    }

    @Override
    public void dispense(VendingMachine m) {
        System.out.println("Select a product first!");
    }

    @Override
    public void cancel(VendingMachine m) {
        System.out.println("Refunding: $" + m.getBalance());
        m.resetBalance();
        m.setState(new IdleState());
    }
}

public class DispensingState implements VendingMachineState {
    @Override
    public void insertCoin(VendingMachine m, double amount) {
        System.out.println("Please wait, dispensing...");
    }

    @Override
    public void selectProduct(VendingMachine m, String product) {
        System.out.println("Please wait, dispensing...");
    }

    @Override
    public void dispense(VendingMachine m) {
        String product = m.getSelectedProduct();
        double price = m.getProductPrice(product);
        double change = m.getBalance() - price;

        System.out.println("Dispensing: " + product);
        if (change > 0) System.out.printf("Change: $%.2f%n", change);

        m.resetBalance();
        m.setSelectedProduct(null);
        m.setState(new IdleState());
    }

    @Override
    public void cancel(VendingMachine m) {
        System.out.println("Cannot cancel during dispensing.");
    }
}
```

### Strategy vs State -- The Key Difference

| Aspect | Strategy | State |
|--------|----------|-------|
| **Who triggers change** | Client explicitly sets the strategy | State transitions happen internally |
| **Awareness** | Strategies do not know about each other | States know which state comes next |
| **Purpose** | Choose an algorithm | Model a lifecycle / FSM |
| **Example** | "User picks payment method" | "Order moves from PLACED to SHIPPED" |

---

## 5. Chain of Responsibility Pattern

### What
Passes a request along a **chain of handlers**. Each handler decides either to process
the request or pass it to the next handler in the chain.

### When to Use
- More than one handler might process a request and the handler is not known in advance
- You want to decouple senders and receivers
- Processing pipeline where each step can modify, reject, or pass through

### Structure

```
+-------------------+
|    Handler        |
+-------------------+
| - next: Handler   |
| + handle(request) |
| + setNext(Handler)|
+-------------------+
     ^    ^    ^
     |    |    |
  HandA  HandB  HandC
```

### Implementation -- Middleware / Log Levels

```java
// Handler
public abstract class LogHandler {
    protected LogHandler next;

    public LogHandler setNext(LogHandler next) {
        this.next = next;
        return next;  // allows chaining: a.setNext(b).setNext(c)
    }

    public void handle(LogLevel level, String message) {
        if (canHandle(level)) {
            write(level, message);
        }
        if (next != null) {
            next.handle(level, message);
        }
    }

    protected abstract boolean canHandle(LogLevel level);
    protected abstract void write(LogLevel level, String message);
}

public class ConsoleLogHandler extends LogHandler {
    protected boolean canHandle(LogLevel level) {
        return level.ordinal() >= LogLevel.DEBUG.ordinal();
    }

    protected void write(LogLevel level, String message) {
        System.out.println("[CONSOLE] " + level + ": " + message);
    }
}

public class FileLogHandler extends LogHandler {
    protected boolean canHandle(LogLevel level) {
        return level.ordinal() >= LogLevel.WARN.ordinal();
    }

    protected void write(LogLevel level, String message) {
        System.out.println("[FILE] " + level + ": " + message);
        // write to file...
    }
}

public class AlertLogHandler extends LogHandler {
    protected boolean canHandle(LogLevel level) {
        return level == LogLevel.ERROR || level == LogLevel.FATAL;
    }

    protected void write(LogLevel level, String message) {
        System.out.println("[ALERT] PagerDuty: " + level + ": " + message);
        // send PagerDuty alert...
    }
}

// Build the chain
LogHandler console = new ConsoleLogHandler();
LogHandler file    = new FileLogHandler();
LogHandler alert   = new AlertLogHandler();
console.setNext(file).setNext(alert);

// DEBUG -> only console
console.handle(LogLevel.DEBUG, "Cache miss for key=user:123");

// ERROR -> console + file + alert
console.handle(LogLevel.ERROR, "Database connection lost!");
```

### HTTP Middleware Example

```java
public abstract class Middleware {
    private Middleware next;

    public Middleware linkWith(Middleware next) {
        this.next = next;
        return next;
    }

    public boolean handle(HttpRequest request) {
        if (next != null) return next.handle(request);
        return true; // end of chain, allowed
    }
}

public class AuthMiddleware extends Middleware {
    public boolean handle(HttpRequest request) {
        if (!request.hasHeader("Authorization")) {
            System.out.println("Rejected: No auth token");
            return false;
        }
        return super.handle(request);  // pass to next
    }
}

public class RateLimitMiddleware extends Middleware {
    public boolean handle(HttpRequest request) {
        if (isRateLimited(request.getClientIp())) {
            System.out.println("Rejected: Rate limited");
            return false;
        }
        return super.handle(request);
    }
}

public class LoggingMiddleware extends Middleware {
    public boolean handle(HttpRequest request) {
        System.out.println("LOG: " + request.getMethod() + " " + request.getPath());
        return super.handle(request);
    }
}

// Build pipeline: Auth -> RateLimit -> Logging
Middleware chain = new AuthMiddleware();
chain.linkWith(new RateLimitMiddleware())
     .linkWith(new LoggingMiddleware());
```

---

## 6. Template Method Pattern

### What
Defines the **skeleton of an algorithm** in a base class, letting subclasses override
specific steps without changing the algorithm's structure.

### When to Use
- You have an algorithm where the overall steps are fixed but some steps vary
- Framework hooks (Spring, JUnit lifecycle methods)
- Data processing pipelines with common structure

### Structure

```
+---------------------------+
|    AbstractClass          |
+---------------------------+
| + templateMethod()        |   <-- final, defines the skeleton
|   step1()                 |
|   step2()                 |   <-- abstract, subclasses override
|   step3()                 |
| # step1()                 |
| # step2()                 |   <-- abstract or default impl
| # step3()                 |
+---------------------------+
        ^           ^
        |           |
 ConcreteClassA  ConcreteClassB
 (overrides      (overrides
  step1, step2)   step1, step2)
```

### Implementation -- Data Processing Pipeline

```java
public abstract class DataProcessor {

    // Template method -- the fixed algorithm skeleton
    public final void process() {
        openSource();
        String raw = extractData();
        String transformed = transformData(raw);
        String validated = validateData(transformed);
        loadData(validated);
        closeSource();
        System.out.println("Processing complete.");
    }

    // Common steps with default implementation
    protected void openSource() {
        System.out.println("Opening data source...");
    }

    protected void closeSource() {
        System.out.println("Closing data source...");
    }

    // Steps that subclasses MUST implement
    protected abstract String extractData();
    protected abstract String transformData(String data);

    // Hook -- optional override
    protected String validateData(String data) {
        System.out.println("Default validation: OK");
        return data; // default does nothing
    }

    protected abstract void loadData(String data);
}

public class CSVProcessor extends DataProcessor {
    @Override
    protected String extractData() {
        System.out.println("Reading CSV file...");
        return "name,age\nAlice,30\nBob,25";
    }

    @Override
    protected String transformData(String data) {
        System.out.println("Converting CSV to JSON...");
        return "[{\"name\":\"Alice\"},{\"name\":\"Bob\"}]";
    }

    @Override
    protected void loadData(String data) {
        System.out.println("Inserting into PostgreSQL...");
    }
}

public class APIProcessor extends DataProcessor {
    @Override
    protected String extractData() {
        System.out.println("Calling REST API...");
        return "{\"users\": [...]}";
    }

    @Override
    protected String transformData(String data) {
        System.out.println("Flattening nested JSON...");
        return "[{\"name\":\"Alice\"}]";
    }

    @Override
    protected String validateData(String data) {
        System.out.println("Checking API response schema...");
        if (data.isEmpty()) throw new RuntimeException("Empty response");
        return data;
    }

    @Override
    protected void loadData(String data) {
        System.out.println("Writing to S3...");
    }
}

// Usage -- same algorithm, different implementations
DataProcessor csv = new CSVProcessor();
csv.process();  // extract CSV -> transform -> validate -> load to Postgres

DataProcessor api = new APIProcessor();
api.process();  // extract API -> transform -> validate schema -> load to S3
```

---

## 7. Iterator Pattern

### What
Provides a way to **access elements of a collection sequentially** without exposing
the underlying representation (array, linked list, tree, graph).

### When to Use
- You want to traverse a collection without knowing its internal structure
- You need multiple traversal strategies (forward, reverse, filtered)
- You want lazy evaluation (compute elements on demand)

### Structure

```
+-------------------+       +-------------------+
|  Aggregate        |------>|  Iterator         |
+-------------------+       +-------------------+
| + createIterator()|       | + hasNext(): bool |
+-------------------+       | + next(): Element |
                            +-------------------+
```

### Implementation -- Paginated API Iterator

```java
public interface Iterator<T> {
    boolean hasNext();
    T next();
}

// Concrete iterator -- paginates through API results
public class PaginatedIterator<T> implements Iterator<T> {
    private final ApiClient client;
    private final String endpoint;
    private final int pageSize;

    private int currentPage = 0;
    private List<T> currentBatch = new ArrayList<>();
    private int indexInBatch = 0;
    private boolean exhausted = false;

    public PaginatedIterator(ApiClient client, String endpoint, int pageSize) {
        this.client   = client;
        this.endpoint = endpoint;
        this.pageSize = pageSize;
        fetchNextBatch();
    }

    @Override
    public boolean hasNext() {
        if (indexInBatch < currentBatch.size()) return true;
        if (exhausted) return false;
        fetchNextBatch();
        return !currentBatch.isEmpty();
    }

    @Override
    public T next() {
        if (!hasNext()) throw new NoSuchElementException();
        return currentBatch.get(indexInBatch++);
    }

    private void fetchNextBatch() {
        currentBatch = client.fetch(endpoint, currentPage, pageSize);
        indexInBatch = 0;
        currentPage++;
        if (currentBatch.size() < pageSize) exhausted = true;
    }
}

// Usage -- client code is unaware of pagination
Iterator<User> users = new PaginatedIterator<>(apiClient, "/users", 100);
while (users.hasNext()) {
    User user = users.next();
    // process user... automatically fetches next page when needed
}
```

---

## 8. Mediator Pattern

### What
Defines an object that **encapsulates how a set of objects interact**. Mediator promotes
loose coupling by keeping objects from referring to each other explicitly.

### When to Use
- Multiple objects communicate in complex ways (many-to-many)
- You want to centralize the communication logic
- Reusing an object is hard because it references many others

### Structure

```
+-----------+        +------------------+
| Colleague |------->|    Mediator      |
+-----------+        +------------------+
| +send()   |        | + notify(sender, |
| +receive()|        |     event)       |
+-----------+        +------------------+
  ^    ^    ^                ^
  |    |    |                |
ColA  ColB  ColC      ConcMediator
```

### Implementation -- Chat Room

```java
// Mediator
public interface ChatMediator {
    void sendMessage(String message, User sender);
    void addUser(User user);
}

// Concrete mediator
public class ChatRoom implements ChatMediator {
    private final String name;
    private final List<User> users = new ArrayList<>();

    public ChatRoom(String name) { this.name = name; }

    @Override
    public void addUser(User user) {
        users.add(user);
        System.out.println(user.getName() + " joined " + name);
    }

    @Override
    public void sendMessage(String message, User sender) {
        for (User user : users) {
            if (user != sender) {  // do not send to self
                user.receive(message, sender.getName());
            }
        }
    }
}

// Colleague
public class User {
    private final String name;
    private final ChatMediator mediator;

    public User(String name, ChatMediator mediator) {
        this.name     = name;
        this.mediator = mediator;
    }

    public String getName() { return name; }

    public void send(String message) {
        System.out.println(name + " sends: " + message);
        mediator.sendMessage(message, this);
    }

    public void receive(String message, String from) {
        System.out.println(name + " received from " + from + ": " + message);
    }
}

// Usage
ChatMediator room = new ChatRoom("General");
User alice = new User("Alice", room);
User bob   = new User("Bob", room);
User carol = new User("Carol", room);

room.addUser(alice);
room.addUser(bob);
room.addUser(carol);

alice.send("Hello everyone!");
// Bob received from Alice: Hello everyone!
// Carol received from Alice: Hello everyone!
```

---

## 9. Memento Pattern

### What
Captures and externalizes an object's internal state so the object can be
**restored to this state later**, without violating encapsulation.

### When to Use
- Undo/redo functionality
- Snapshots/checkpoints for recovery
- You need to save and restore state but do not want to expose internal details

### Structure

```
+--------------+      +--------------+      +----------------+
| Originator   |----->|   Memento    |<-----| Caretaker      |
+--------------+      +--------------+      +----------------+
| - state      |      | - state      |      | - history: List|
| + save()     |      | + getState() |      | + save()       |
| + restore()  |      +--------------+      | + undo()       |
+--------------+                            +----------------+
```

### Implementation -- Game Checkpoint

```java
// Memento -- immutable snapshot
public class GameMemento {
    private final int level;
    private final int health;
    private final int score;
    private final LocalDateTime timestamp;

    public GameMemento(int level, int health, int score) {
        this.level     = level;
        this.health    = health;
        this.score     = score;
        this.timestamp = LocalDateTime.now();
    }

    // Package-private getters -- only originator should access
    int getLevel()  { return level; }
    int getHealth() { return health; }
    int getScore()  { return score; }
    LocalDateTime getTimestamp() { return timestamp; }
}

// Originator
public class Game {
    private int level;
    private int health;
    private int score;

    public Game() {
        this.level  = 1;
        this.health = 100;
        this.score  = 0;
    }

    public GameMemento save() {
        System.out.println("Saving checkpoint: Level=" + level +
            " Health=" + health + " Score=" + score);
        return new GameMemento(level, health, score);
    }

    public void restore(GameMemento memento) {
        this.level  = memento.getLevel();
        this.health = memento.getHealth();
        this.score  = memento.getScore();
        System.out.println("Restored to: Level=" + level +
            " Health=" + health + " Score=" + score);
    }

    public void play() {
        level++;
        health -= 20;
        score += 500;
    }

    public void takeDamage(int dmg) { health -= dmg; }
}

// Caretaker
public class CheckpointManager {
    private final Deque<GameMemento> history = new ArrayDeque<>();

    public void saveCheckpoint(Game game) {
        history.push(game.save());
    }

    public void loadLastCheckpoint(Game game) {
        if (!history.isEmpty()) {
            game.restore(history.pop());
        } else {
            System.out.println("No checkpoints available");
        }
    }
}

// Usage
Game game = new Game();
CheckpointManager mgr = new CheckpointManager();

game.play();           // Level 2, Health 80, Score 500
mgr.saveCheckpoint(game);

game.play();           // Level 3, Health 60, Score 1000
game.takeDamage(50);   // Health 10 -- almost dead!

mgr.loadLastCheckpoint(game); // Restored to Level 2, Health 80, Score 500
```

---

## 10. Visitor Pattern

### What
Lets you define a **new operation** on an object structure without changing the classes
of the elements on which it operates. Uses double dispatch.

### When to Use
- You need to perform many unrelated operations on objects in a structure
- The object structure rarely changes but you add new operations often
- Operations should not pollute the element classes (SRP)

### Structure

```
+------------------+       +-------------------+
|   Element        |       |   Visitor         |
+------------------+       +-------------------+
| +accept(Visitor) |       | +visit(ElementA)  |
+------------------+       | +visit(ElementB)  |
     ^        ^            +-------------------+
     |        |                  ^        ^
 ElemA    ElemB           VisitorX    VisitorY
```

### Implementation -- AST Evaluation

```java
// Element hierarchy
public interface ASTNode {
    void accept(ASTVisitor visitor);
}

public class NumberNode implements ASTNode {
    private final double value;
    public NumberNode(double value) { this.value = value; }
    public double getValue() { return value; }

    @Override
    public void accept(ASTVisitor visitor) { visitor.visit(this); }
}

public class BinaryOpNode implements ASTNode {
    private final ASTNode left, right;
    private final String operator;

    public BinaryOpNode(ASTNode left, String operator, ASTNode right) {
        this.left     = left;
        this.operator = operator;
        this.right    = right;
    }

    public ASTNode getLeft()     { return left; }
    public ASTNode getRight()    { return right; }
    public String getOperator()  { return operator; }

    @Override
    public void accept(ASTVisitor visitor) { visitor.visit(this); }
}

// Visitor interface
public interface ASTVisitor {
    void visit(NumberNode node);
    void visit(BinaryOpNode node);
}

// Concrete visitor -- evaluator
public class EvalVisitor implements ASTVisitor {
    private final Deque<Double> stack = new ArrayDeque<>();

    public void visit(NumberNode node) {
        stack.push(node.getValue());
    }

    public void visit(BinaryOpNode node) {
        node.getLeft().accept(this);
        node.getRight().accept(this);
        double right = stack.pop();
        double left  = stack.pop();
        double result = switch (node.getOperator()) {
            case "+" -> left + right;
            case "-" -> left - right;
            case "*" -> left * right;
            case "/" -> left / right;
            default -> throw new UnsupportedOperationException();
        };
        stack.push(result);
    }

    public double getResult() { return stack.peek(); }
}

// Concrete visitor -- pretty printer (new operation, no element changes)
public class PrintVisitor implements ASTVisitor {
    private final StringBuilder sb = new StringBuilder();

    public void visit(NumberNode node) {
        sb.append(node.getValue());
    }

    public void visit(BinaryOpNode node) {
        sb.append("(");
        node.getLeft().accept(this);
        sb.append(" ").append(node.getOperator()).append(" ");
        node.getRight().accept(this);
        sb.append(")");
    }

    public String getResult() { return sb.toString(); }
}

// Usage: (3 + 5) * 2
ASTNode tree = new BinaryOpNode(
    new BinaryOpNode(new NumberNode(3), "+", new NumberNode(5)),
    "*",
    new NumberNode(2)
);

EvalVisitor eval = new EvalVisitor();
tree.accept(eval);
System.out.println(eval.getResult());  // 16.0

PrintVisitor print = new PrintVisitor();
tree.accept(print);
System.out.println(print.getResult());  // ((3.0 + 5.0) * 2.0)
```

---

## 11. Null Object Pattern

### What
Provides a **do-nothing object** as a stand-in for the absence of a real object.
Eliminates null checks throughout your code.

### When to Use
- You want to avoid `if (x != null)` scattered everywhere
- A "default" behavior for a missing dependency makes sense
- Strategy pattern where "no strategy" is a valid choice

### Structure

```
+-------------------+
|   AbstractClass   |
+-------------------+
| + doSomething()   |
+-------------------+
     ^         ^
     |         |
+---------+ +------------+
|  Real   | | NullObject |
+---------+ +------------+
| does    | | does       |
| real    | | nothing    |
| work    | | safely     |
+---------+ +------------+
```

### Implementation -- NullLogger

```java
public interface Logger {
    void info(String message);
    void warn(String message);
    void error(String message, Throwable t);
}

// Real logger
public class FileLogger implements Logger {
    public void info(String message)              { writeToFile("INFO", message); }
    public void warn(String message)              { writeToFile("WARN", message); }
    public void error(String message, Throwable t){ writeToFile("ERROR", message + ": " + t); }
    private void writeToFile(String level, String msg) { /* ... */ }
}

// Null object -- does nothing, safely
public class NullLogger implements Logger {
    public void info(String message)              { /* no-op */ }
    public void warn(String message)              { /* no-op */ }
    public void error(String message, Throwable t){ /* no-op */ }
}

// Usage -- no null checks needed anywhere
public class OrderService {
    private final Logger logger;

    public OrderService(Logger logger) {
        // Never null -- use NullLogger as default
        this.logger = (logger != null) ? logger : new NullLogger();
    }

    public void placeOrder(Order order) {
        logger.info("Placing order: " + order.getId());  // always safe
        // ... business logic ...
        logger.info("Order placed successfully");
    }
}
```

---

## 12. Specification Pattern

### What
Combines business rules into composable boolean expressions using AND, OR, NOT.
Each specification is a single reusable rule that can be combined with others.

### When to Use
- Complex filtering logic that changes frequently
- Validation rules that can be combined in many ways
- You want to avoid hardcoded conditional chains

### Structure

```
+----------------------------+
|    Specification<T>        |
+----------------------------+
| + isSatisfiedBy(T): bool   |
| + and(Spec): Spec          |
| + or(Spec): Spec           |
| + not(): Spec              |
+----------------------------+
        ^
        |
+-------------------+
| ConcreteSpec      |
+-------------------+
| + isSatisfiedBy() |
+-------------------+
```

### Implementation -- Product Filtering

```java
// Base specification
public interface Specification<T> {
    boolean isSatisfiedBy(T item);

    default Specification<T> and(Specification<T> other) {
        return item -> this.isSatisfiedBy(item) && other.isSatisfiedBy(item);
    }

    default Specification<T> or(Specification<T> other) {
        return item -> this.isSatisfiedBy(item) || other.isSatisfiedBy(item);
    }

    default Specification<T> not() {
        return item -> !this.isSatisfiedBy(item);
    }
}

// Concrete specifications
public class PriceRangeSpec implements Specification<Product> {
    private final double min, max;

    public PriceRangeSpec(double min, double max) {
        this.min = min;
        this.max = max;
    }

    @Override
    public boolean isSatisfiedBy(Product p) {
        return p.getPrice() >= min && p.getPrice() <= max;
    }
}

public class InStockSpec implements Specification<Product> {
    @Override
    public boolean isSatisfiedBy(Product p) {
        return p.getStockCount() > 0;
    }
}

public class CategorySpec implements Specification<Product> {
    private final String category;

    public CategorySpec(String category) { this.category = category; }

    @Override
    public boolean isSatisfiedBy(Product p) {
        return p.getCategory().equals(category);
    }
}

public class MinRatingSpec implements Specification<Product> {
    private final double minRating;

    public MinRatingSpec(double minRating) { this.minRating = minRating; }

    @Override
    public boolean isSatisfiedBy(Product p) {
        return p.getRating() >= minRating;
    }
}

// Usage -- compose complex filter from simple rules
Specification<Product> filter = new InStockSpec()
    .and(new PriceRangeSpec(10, 100))
    .and(new CategorySpec("Electronics"))
    .and(new MinRatingSpec(4.0));

List<Product> results = products.stream()
    .filter(filter::isSatisfiedBy)
    .collect(Collectors.toList());

// OR composition
Specification<Product> premiumOrCheap =
    new PriceRangeSpec(500, Double.MAX_VALUE)
        .or(new PriceRangeSpec(0, 10));
```

---

## Behavioral Patterns -- Quick Reference Table

| Pattern | Intent | Key Clue |
|---------|--------|----------|
| Strategy | Swap algorithms at runtime | "multiple ways to do X" |
| Observer | One-to-many notification | "when X happens, notify Y, Z" |
| Command | Encapsulate requests as objects | "undo", "queue", "log", "macro" |
| State | Behavior changes with state | "lifecycle", "FSM", "depends on current state" |
| Chain of Resp | Pass along handler chain | "pipeline", "middleware", "approval chain" |
| Template Method | Algorithm skeleton with hooks | "steps are same, details differ" |
| Iterator | Sequential access to collection | "traverse", "paginate", "lazy" |
| Mediator | Centralized communication | "many-to-many", "chat room", "controller" |
| Memento | Capture/restore state | "undo", "checkpoint", "snapshot" |
| Visitor | Operations on structures | "AST", "traverse and compute", "new operations" |
| Null Object | Default do-nothing | "avoid null checks", "default behavior" |
| Specification | Composable business rules | "filter", "validate", "complex conditions" |

---

## Interview Power Moves

1. **Strategy everywhere**: "In any LLD, if the interviewer says 'this policy could change',
   I immediately extract it into a Strategy interface."

2. **Observer for cross-cutting concerns**: "When an order is placed, I use Observer to
   notify inventory, billing, notifications, and analytics -- all decoupled."

3. **State for lifecycle management**: "Any entity with a lifecycle (Order, Ticket, ATM)
   gets the State pattern. Each state class handles only its own transitions."

4. **Command for audit**: "Every operation becomes a Command object. I can log it,
   replay it, undo it, and batch it. Perfect for financial systems."

5. **Chain of Responsibility for middleware**: "Input validation is a chain:
   Auth -> RateLimit -> Sanitize -> BusinessLogic. Each link can reject or pass through."
