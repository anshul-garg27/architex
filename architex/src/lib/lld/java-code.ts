// Extracted from db/seeds/java-code-gen.ts for client-side use (no DB deps)

export const JAVA_CODE: Record<string, string> = {

  // ════════════════════════════════════════════════════════════
  //  CREATIONAL PATTERNS
  // ════════════════════════════════════════════════════════════

  singleton: `// Thread-safe Singleton with double-checked locking
public final class Singleton {
    private static volatile Singleton instance;
    private final java.util.Map<String, String> data = new java.util.HashMap<>();

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }

    public String getData(String key) { return data.get(key); }
    public void setData(String key, String value) { data.put(key, value); }

    public static void main(String[] args) {
        Singleton a = Singleton.getInstance();
        Singleton b = Singleton.getInstance();
        a.setData("env", "production");
        System.out.println(a == b);              // true
        System.out.println(b.getData("env"));    // production
    }
}`,

  "factory-method": `// Factory Method — abstract creator defers instantiation to subclasses
interface Product {
    String operation();
}

class ConcreteProductA implements Product {
    public String operation() { return "Result of ConcreteProductA"; }
}

class ConcreteProductB implements Product {
    public String operation() { return "Result of ConcreteProductB"; }
}

abstract class Creator {
    public abstract Product factoryMethod();

    public String someOperation() {
        Product product = factoryMethod();
        return "Creator works with: " + product.operation();
    }
}

class ConcreteCreatorA extends Creator {
    public Product factoryMethod() { return new ConcreteProductA(); }
}

class ConcreteCreatorB extends Creator {
    public Product factoryMethod() { return new ConcreteProductB(); }
}

// Usage
public class FactoryMethodDemo {
    public static void main(String[] args) {
        Creator creator = new ConcreteCreatorA();
        System.out.println(creator.someOperation());
        // Creator works with: Result of ConcreteProductA
    }
}`,

  builder: `// Builder with method chaining (fluent API)
class HttpRequest {
    final String method, url, body;
    final java.util.Map<String, String> headers;
    final Integer timeout;

    HttpRequest(String method, String url, java.util.Map<String, String> headers,
                String body, Integer timeout) {
        this.method = method; this.url = url;
        this.headers = headers; this.body = body; this.timeout = timeout;
    }
}

class HttpRequestBuilder {
    private String method = "GET";
    private String url = "";
    private final java.util.Map<String, String> headers = new java.util.LinkedHashMap<>();
    private String body;
    private Integer timeout;

    public HttpRequestBuilder setMethod(String m)      { this.method = m;  return this; }
    public HttpRequestBuilder setUrl(String u)          { this.url = u;     return this; }
    public HttpRequestBuilder setHeader(String k, String v) { headers.put(k, v); return this; }
    public HttpRequestBuilder setBody(String b)         { this.body = b;    return this; }
    public HttpRequestBuilder setTimeout(int ms)        { this.timeout = ms; return this; }

    public HttpRequest build() {
        if (url.isEmpty()) throw new IllegalStateException("URL is required");
        return new HttpRequest(method, url, new java.util.LinkedHashMap<>(headers), body, timeout);
    }
}

// Usage
public class BuilderDemo {
    public static void main(String[] args) {
        HttpRequest req = new HttpRequestBuilder()
            .setMethod("POST")
            .setUrl("https://api.example.com/users")
            .setHeader("Content-Type", "application/json")
            .setBody("{\\"name\\":\\"Alice\\"}")
            .setTimeout(5000)
            .build();
        System.out.println(req.method + " " + req.url); // POST https://api.example.com/users
    }
}`,

  "abstract-factory": `// Abstract Factory — families of related objects
interface Button {
    String render();
}

interface Checkbox {
    String render();
    void toggle();
}

interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

// Windows family
class WindowsButton implements Button {
    public String render() { return "[Windows Button]"; }
}
class WindowsCheckbox implements Checkbox {
    private boolean checked;
    public String render() { return "[Windows Checkbox: " + checked + "]"; }
    public void toggle() { checked = !checked; }
}
class WindowsFactory implements GUIFactory {
    public Button createButton()     { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}

// Mac family
class MacButton implements Button {
    public String render() { return "(Mac Button)"; }
}
class MacCheckbox implements Checkbox {
    private boolean checked;
    public String render() { return "(Mac Checkbox: " + checked + ")"; }
    public void toggle() { checked = !checked; }
}
class MacFactory implements GUIFactory {
    public Button createButton()     { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}

// Usage
public class AbstractFactoryDemo {
    static void buildUI(GUIFactory factory) {
        Button btn = factory.createButton();
        Checkbox cb = factory.createCheckbox();
        System.out.println(btn.render());
        System.out.println(cb.render());
    }
    public static void main(String[] args) {
        buildUI(new MacFactory()); // (Mac Button)  (Mac Checkbox: false)
    }
}`,

  prototype: `// Prototype — clone objects instead of constructing from scratch
interface Prototype<T> {
    T clone();
}

class GameUnit implements Prototype<GameUnit> {
    String name;
    int hp;
    java.util.List<String> abilities;
    java.util.Map<String, Integer> stats;

    GameUnit(String name, int hp, java.util.List<String> abilities,
             java.util.Map<String, Integer> stats) {
        this.name = name; this.hp = hp;
        this.abilities = abilities; this.stats = stats;
    }

    public GameUnit clone() {
        return new GameUnit(
            name, hp,
            new java.util.ArrayList<>(abilities),
            new java.util.HashMap<>(stats)
        );
    }

    public String toString() {
        return name + " (HP:" + hp + ", ATK:" + stats.get("attack") + ")";
    }
}

// Usage
public class PrototypeDemo {
    public static void main(String[] args) {
        GameUnit template = new GameUnit("Archer", 100,
            new java.util.ArrayList<>(java.util.List.of("shoot", "dodge")),
            new java.util.HashMap<>(java.util.Map.of("attack", 15, "defense", 5)));

        GameUnit a1 = template.clone();
        GameUnit a2 = template.clone();
        a2.name = "Elite Archer";
        a2.stats.put("attack", 25);

        System.out.println(a1);        // Archer (HP:100, ATK:15)
        System.out.println(a2);        // Elite Archer (HP:100, ATK:25)
        System.out.println(template);  // Archer (HP:100, ATK:15) — unchanged
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  STRUCTURAL PATTERNS
  // ════════════════════════════════════════════════════════════

  adapter: `// Adapter — make incompatible interfaces work together
interface Target {
    String request();
}

class Adaptee {
    public String specificRequest() {
        return "Adaptee's specific behavior";
    }
}

class Adapter implements Target {
    private final Adaptee adaptee;

    Adapter(Adaptee adaptee) { this.adaptee = adaptee; }

    public String request() {
        return "Adapter: (TRANSLATED) " + adaptee.specificRequest();
    }
}

// Usage
public class AdapterDemo {
    public static void main(String[] args) {
        Adaptee adaptee = new Adaptee();
        Target adapter = new Adapter(adaptee);
        System.out.println(adapter.request());
        // Adapter: (TRANSLATED) Adaptee's specific behavior
    }
}`,

  decorator: `// Decorator — attach responsibilities dynamically
interface Component {
    String execute();
}

class ConcreteComponent implements Component {
    public String execute() { return "ConcreteComponent"; }
}

abstract class BaseDecorator implements Component {
    protected final Component wrappee;
    BaseDecorator(Component wrappee) { this.wrappee = wrappee; }
    public String execute() { return wrappee.execute(); }
}

class LoggingDecorator extends BaseDecorator {
    LoggingDecorator(Component c) { super(c); }
    public String execute() {
        System.out.println("LOG: executing...");
        return "Logged(" + super.execute() + ")";
    }
}

class CachingDecorator extends BaseDecorator {
    CachingDecorator(Component c) { super(c); }
    public String execute() {
        return "Cached(" + super.execute() + ")";
    }
}

// Usage — decorators stack like Java I/O streams
public class DecoratorDemo {
    public static void main(String[] args) {
        Component component = new CachingDecorator(
            new LoggingDecorator(new ConcreteComponent()));
        System.out.println(component.execute());
        // Cached(Logged(ConcreteComponent))
    }
}`,

  facade: `// Facade — e-commerce order facade coordinating subsystems
class InventoryService {
    private final java.util.Map<String, Integer> stock =
        new java.util.HashMap<>(java.util.Map.of("SKU-1", 50, "SKU-2", 20));

    boolean checkAvailability(String itemId, int qty) {
        return stock.getOrDefault(itemId, 0) >= qty;
    }

    String reserveItems(String[] itemIds, int[] qtys) {
        for (int i = 0; i < itemIds.length; i++)
            stock.merge(itemIds[i], -qtys[i], Integer::sum);
        return "RES-" + System.currentTimeMillis();
    }

    void releaseReservation(String reservationId) {
        System.out.println("Inventory: released " + reservationId);
    }
}

class PaymentService {
    String charge(double amount, String card) {
        System.out.println("Payment: charged $" + amount + " on " + card);
        return "TX-" + System.currentTimeMillis();
    }
    void refund(String transactionId) {
        System.out.println("Payment: refunded " + transactionId);
    }
}

class ShippingService {
    String createShipment(String orderId, String address) {
        String trackingId = "SHIP-" + System.currentTimeMillis();
        System.out.println("Shipping: " + orderId + " to " + address + " (" + trackingId + ")");
        return trackingId;
    }
    void cancelShipment(String trackingId) {
        System.out.println("Shipping: cancelled " + trackingId);
    }
}

class OrderFacade {
    private final InventoryService inventory = new InventoryService();
    private final PaymentService payment = new PaymentService();
    private final ShippingService shipping = new ShippingService();

    String placeOrder(String[] itemIds, int[] qtys, String card, String address) {
        for (int i = 0; i < itemIds.length; i++) {
            if (\!inventory.checkAvailability(itemIds[i], qtys[i]))
                throw new RuntimeException("Out of stock: " + itemIds[i]);
        }
        String resId = inventory.reserveItems(itemIds, qtys);
        int total = 0;
        for (int q : qtys) total += q * 10;
        String txId = payment.charge(total, card);
        String trackingId = shipping.createShipment(txId, address);
        return "Order confirmed - tracking: " + trackingId;
    }

    void cancelOrder(String orderId) {
        shipping.cancelShipment(orderId);
        payment.refund(orderId);
        System.out.println("OrderFacade: order " + orderId + " cancelled");
    }
}

// Usage — CheckoutController only talks to the facade
public class FacadeDemo {
    public static void main(String[] args) {
        OrderFacade facade = new OrderFacade();
        String result = facade.placeOrder(
            new String[]{"SKU-1"}, new int[]{2}, "VISA-4242", "123 Main St"
        );
        System.out.println(result);
    }
}`,

  proxy: `// Proxy — image caching proxy with lazy loading
import java.util.HashMap;
import java.util.Map;

interface ImageService {
    String loadImage(String url);
    String getImage(String url);
}

class RemoteImageService implements ImageService {
    private final String apiBaseUrl = "https://img.example.com";
    public String loadImage(String url) {
        System.out.println("RemoteImageService: downloading " + url + "...");
        return "[ImageData: " + url + "]";
    }
    public String getImage(String url) { return loadImage(url); }
}

class CachedImageProxy implements ImageService {
    private final RemoteImageService realService = new RemoteImageService();
    private final Map<String, String> cache = new HashMap<>();
    private final long ttlMs;
    private final Map<String, Long> timestamps = new HashMap<>();

    CachedImageProxy(long ttlMs) { this.ttlMs = ttlMs; }

    private boolean isCached(String url) {
        return cache.containsKey(url) &&
               System.currentTimeMillis() - timestamps.get(url) < ttlMs;
    }

    public String loadImage(String url) {
        if (isCached(url)) {
            System.out.println("[Cache HIT] " + url);
            return cache.get(url);
        }
        System.out.println("[Cache MISS] " + url);
        String data = realService.loadImage(url);
        cache.put(url, data);
        timestamps.put(url, System.currentTimeMillis());
        return data;
    }

    public String getImage(String url) { return cache.get(url); }

    public void clearCache() {
        cache.clear();
        timestamps.clear();
        System.out.println("CachedImageProxy: cache cleared");
    }
}

// Usage — ImageGallery works with any ImageService
public class ProxyDemo {
    public static void main(String[] args) {
        CachedImageProxy proxy = new CachedImageProxy(5000);
        System.out.println(proxy.loadImage("cat.png"));  // MISS
        System.out.println(proxy.loadImage("dog.png"));  // MISS
        System.out.println(proxy.loadImage("cat.png"));  // HIT
        System.out.println("Cached? " + (proxy.getImage("cat.png") \!= null));
        proxy.clearCache();
    }
}`,

  composite: `// Composite — treat files and folders uniformly
import java.util.ArrayList;
import java.util.List;

interface FileSystemComponent {
    int getSize();
    String getName();
    void print(String indent);
}

class File implements FileSystemComponent {
    private final String name;
    private final int size;
    File(String name, int size) { this.name = name; this.size = size; }
    public int getSize()    { return size; }
    public String getName() { return name; }
    public void print(String indent) {
        System.out.println(indent + name + " (" + size + " bytes)");
    }
}

class Folder implements FileSystemComponent {
    private final String name;
    private final List<FileSystemComponent> children = new ArrayList<>();
    Folder(String name) { this.name = name; }
    public void add(FileSystemComponent child) { children.add(child); }
    public int getSize() {
        return children.stream().mapToInt(FileSystemComponent::getSize).sum();
    }
    public String getName() { return name; }
    public void print(String indent) {
        System.out.println(indent + name + "/");
        for (var child : children) child.print(indent + "  ");
    }
}

// Usage
public class CompositeDemo {
    public static void main(String[] args) {
        Folder root = new Folder("src");
        Folder lib = new Folder("lib");
        lib.add(new File("utils.ts", 1200));
        lib.add(new File("types.ts", 800));
        root.add(lib);
        root.add(new File("index.ts", 300));
        root.print("");
        System.out.println("Total: " + root.getSize() + " bytes"); // 2300
    }
}`,

  bridge: `// Bridge — decouple abstraction from implementation
interface Renderer {
    String renderShape(String shape, int x, int y);
}

class WindowsRenderer implements Renderer {
    public String renderShape(String shape, int x, int y) {
        return "[Windows GDI] Drawing " + shape + " at (" + x + ", " + y + ")";
    }
}

class SVGRenderer implements Renderer {
    public String renderShape(String shape, int x, int y) {
        return "[SVG] <" + shape + " cx=\\"" + x + "\\" cy=\\"" + y + "\\" />";
    }
}

abstract class Shape {
    protected final Renderer renderer;
    Shape(Renderer renderer) { this.renderer = renderer; }
    abstract String draw();
}

class Circle extends Shape {
    private final int radius;
    Circle(Renderer r, int radius) { super(r); this.radius = radius; }
    String draw() { return renderer.renderShape("Circle(r=" + radius + ")", 100, 100); }
}

class Square extends Shape {
    private final int side;
    Square(Renderer r, int side) { super(r); this.side = side; }
    String draw() { return renderer.renderShape("Square(s=" + side + ")", 200, 200); }
}

// Usage
public class BridgeDemo {
    public static void main(String[] args) {
        System.out.println(new Circle(new WindowsRenderer(), 5).draw());
        System.out.println(new Square(new SVGRenderer(), 10).draw());
    }
}`,

  flyweight: `// Flyweight — share common state to save memory
import java.util.HashMap;
import java.util.Map;

class CharacterStyle {
    final String font;
    final int size;
    final String color;
    CharacterStyle(String font, int size, String color) {
        this.font = font; this.size = size; this.color = color;
    }
}

class StyleFactory {
    private final Map<String, CharacterStyle> cache = new HashMap<>();

    CharacterStyle getStyle(String font, int size, String color) {
        String key = font + "-" + size + "-" + color;
        return cache.computeIfAbsent(key, k -> new CharacterStyle(font, size, color));
    }
    int getCacheSize() { return cache.size(); }
}

class Character {
    final char ch;               // extrinsic state
    final int x, y;              // extrinsic state
    final CharacterStyle style;  // intrinsic state (shared flyweight)

    Character(char ch, int x, int y, CharacterStyle style) {
        this.ch = ch; this.x = x; this.y = y; this.style = style;
    }
    void render() {
        System.out.printf("'%c' at (%d,%d) [%s %dpt %s]%n",
            ch, x, y, style.font, style.size, style.color);
    }
}

// Usage
public class FlyweightDemo {
    public static void main(String[] args) {
        StyleFactory factory = new StyleFactory();
        Character[] chars = {
            new Character('H', 0, 0, factory.getStyle("Arial", 12, "black")),
            new Character('e', 1, 0, factory.getStyle("Arial", 12, "black")),
            new Character('l', 2, 0, factory.getStyle("Arial", 12, "black")),
            new Character('!', 3, 0, factory.getStyle("Arial", 16, "red")),
        };
        for (var c : chars) c.render();
        System.out.println("Shared styles: " + factory.getCacheSize()); // 2
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  BEHAVIORAL PATTERNS
  // ════════════════════════════════════════════════════════════

  observer: `// Observer — one-to-many dependency notification
import java.util.ArrayList;
import java.util.List;

interface Observer {
    void update(Subject subject);
}

class Subject {
    private final List<Observer> observers = new ArrayList<>();
    private int state;

    void attach(Observer o)  { observers.add(o); }
    void detach(Observer o)  { observers.remove(o); }
    int getState()           { return state; }

    void setState(int state) {
        this.state = state;
        for (Observer o : observers) o.update(this);
    }
}

class LoggingObserver implements Observer {
    public void update(Subject s) {
        System.out.println("[LOG] State changed to " + s.getState());
    }
}

class AlertObserver implements Observer {
    public void update(Subject s) {
        if (s.getState() > 100) {
            System.out.println("[ALERT] Threshold exceeded: " + s.getState());
        }
    }
}

// Usage
public class ObserverDemo {
    public static void main(String[] args) {
        Subject subject = new Subject();
        subject.attach(new LoggingObserver());
        subject.attach(new AlertObserver());
        subject.setState(42); // Both observers notified
    }
}`,

  strategy: `// Strategy — payment processing with interchangeable payment methods
interface PaymentStrategy {
    boolean pay(double amount);
    double calculateFee(double amount);
    String getName();
}

class CreditCardPayment implements PaymentStrategy {
    private final String cardNumber;
    private final double feePercent;
    CreditCardPayment(String cardNumber) { this(cardNumber, 0.029); }
    CreditCardPayment(String cardNumber, double feePercent) {
        this.cardNumber = cardNumber; this.feePercent = feePercent;
    }
    public boolean pay(double amount) {
        System.out.println("Charging $" + amount + " to card ending " + cardNumber.substring(cardNumber.length() - 4));
        return true;
    }
    public double calculateFee(double amount) { return amount * feePercent; }
    public String getName() { return "Credit Card"; }
}

class PayPalPayment implements PaymentStrategy {
    private final String email;
    private final double feePercent;
    PayPalPayment(String email) { this(email, 0.035); }
    PayPalPayment(String email, double feePercent) {
        this.email = email; this.feePercent = feePercent;
    }
    public boolean pay(double amount) {
        System.out.println("Sending $" + amount + " via PayPal to " + email);
        return true;
    }
    public double calculateFee(double amount) { return amount * feePercent; }
    public String getName() { return "PayPal"; }
}

class CryptoPayment implements PaymentStrategy {
    private final String walletAddress;
    private final double networkFee;
    CryptoPayment(String walletAddress) { this(walletAddress, 1.5); }
    CryptoPayment(String walletAddress, double networkFee) {
        this.walletAddress = walletAddress; this.networkFee = networkFee;
    }
    public boolean pay(double amount) {
        System.out.println("Transferring $" + amount + " to wallet " + walletAddress.substring(0, 8) + "...");
        return true;
    }
    public double calculateFee(double amount) { return networkFee; }
    public String getName() { return "Crypto"; }
}

class PaymentProcessor {
    private PaymentStrategy strategy;
    PaymentProcessor(PaymentStrategy strategy) { this.strategy = strategy; }
    void setStrategy(PaymentStrategy s) { this.strategy = s; }
    boolean processPayment(double amount) {
        double fee = strategy.calculateFee(amount);
        System.out.println("Processing via " + strategy.getName() + " | fee: $" + String.format("%.2f", fee));
        return strategy.pay(amount + fee);
    }
}

// Usage
public class StrategyDemo {
    public static void main(String[] args) {
        PaymentProcessor processor = new PaymentProcessor(new CreditCardPayment("4111111111111234"));
        processor.processPayment(99.99);
        processor.setStrategy(new PayPalPayment("user@example.com"));
        processor.processPayment(49.99);
        processor.setStrategy(new CryptoPayment("0xABC123FF"));
        processor.processPayment(200);
    }
}`,

  command: `// Command — document editor with undo/redo via command history
import java.util.ArrayDeque;
import java.util.Deque;

interface Command {
    void execute();
    void undo();
}

class DocumentEditor {
    private StringBuilder content = new StringBuilder();
    private String filePath = "";
    void save() { System.out.println("Saved: " + content.substring(0, Math.min(30, content.length())) + "..."); }
    void open(String path) { filePath = path; System.out.println("Opened: " + path); }
    void revert(String c) { content = new StringBuilder(c); }
    void insert(String text, int pos) { content.insert(pos, text); }
    String deleteText(int pos, int len) {
        String deleted = content.substring(pos, pos + len);
        content.delete(pos, pos + len);
        return deleted;
    }
    String getContent() { return content.toString(); }
}

class SaveDocumentCommand implements Command {
    private final DocumentEditor editor;
    private final String prev;
    SaveDocumentCommand(DocumentEditor e) { this.editor = e; this.prev = e.getContent(); }
    public void execute() { editor.save(); }
    public void undo() { editor.revert(prev); System.out.println("Save undone"); }
}

class OpenFileCommand implements Command {
    private final DocumentEditor editor;
    private final String filePath, prev;
    OpenFileCommand(DocumentEditor e, String p) { editor = e; filePath = p; prev = e.getContent(); }
    public void execute() { editor.open(filePath); }
    public void undo() { editor.revert(prev); System.out.println("Open undone"); }
}

class DeleteCommand implements Command {
    private final DocumentEditor editor;
    private final int position, length;
    private String deletedData = "";
    DeleteCommand(DocumentEditor e, int p, int l) { editor = e; position = p; length = l; }
    public void execute() { deletedData = editor.deleteText(position, length); }
    public void undo() { editor.insert(deletedData, position); }
}

class CommandHistory {
    private final Deque<Command> undoStack = new ArrayDeque<>();
    private final Deque<Command> redoStack = new ArrayDeque<>();
    void push(Command cmd) { undoStack.push(cmd); redoStack.clear(); }
    void undo() { Command c = undoStack.poll(); if (c \!= null) { c.undo(); redoStack.push(c); } }
    void redo() { Command c = redoStack.poll(); if (c \!= null) { c.execute(); undoStack.push(c); } }
}

class EditorInvoker {
    private final CommandHistory history = new CommandHistory();
    void executeCommand(Command cmd) { cmd.execute(); history.push(cmd); }
    void undo() { history.undo(); }
    void redo() { history.redo(); }
}

// Usage
public class CommandDemo {
    public static void main(String[] args) {
        DocumentEditor editor = new DocumentEditor();
        EditorInvoker invoker = new EditorInvoker();
        invoker.executeCommand(new OpenFileCommand(editor, "/docs/readme.md"));
        invoker.executeCommand(new SaveDocumentCommand(editor));
        invoker.undo();
        invoker.redo();
    }
}`,

  state: `// State — document workflow with draft, review, published transitions
interface DocumentState {
    void edit(Document doc);
    void review(Document doc);
    void publish(Document doc);
    void reject(Document doc);
}

class Document {
    private DocumentState state;
    String content = "";
    String author = "";
    Document(DocumentState initial) { this.state = initial; }
    void setState(DocumentState s) {
        System.out.println("Document: transitioning to " + s.getClass().getSimpleName());
        this.state = s;
    }
    void edit() { state.edit(this); }
    void review() { state.review(this); }
    void publish() { state.publish(this); }
}

class DraftState implements DocumentState {
    public void edit(Document doc) { System.out.println("DraftState: editing document..."); }
    public void review(Document doc) {
        System.out.println("DraftState: submitting for review...");
        doc.setState(new ReviewState());
    }
    public void publish(Document doc) { System.out.println("DraftState: cannot publish, must be reviewed first."); }
    public void reject(Document doc) { System.out.println("DraftState: already a draft, nothing to reject."); }
}

class ReviewState implements DocumentState {
    public void edit(Document doc) { System.out.println("ReviewState: cannot edit, currently under review."); }
    public void review(Document doc) { System.out.println("ReviewState: already under review."); }
    public void publish(Document doc) {
        System.out.println("ReviewState: approved\! Publishing...");
        doc.setState(new PublishedState());
    }
    public void reject(Document doc) {
        System.out.println("ReviewState: rejected, returning to draft.");
        doc.setState(new DraftState());
    }
}

class PublishedState implements DocumentState {
    public void edit(Document doc) {
        System.out.println("PublishedState: creating new draft from published...");
        doc.setState(new DraftState());
    }
    public void review(Document doc) { System.out.println("PublishedState: already published."); }
    public void publish(Document doc) { System.out.println("PublishedState: already published."); }
    public void reject(Document doc) { System.out.println("PublishedState: cannot reject a published document."); }
}

// Usage
public class StateDemo {
    public static void main(String[] args) {
        Document doc = new Document(new DraftState());
        doc.edit();     // DraftState: editing...
        doc.publish();  // DraftState: cannot publish
        doc.review();   // DraftState -> ReviewState
        doc.publish();  // ReviewState -> PublishedState
        doc.edit();     // PublishedState -> DraftState
    }
}`,

  iterator: `// Iterator — playlist traversal with sequential and shuffle iterators
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

class Song {
    final String title, artist;
    final int durationMs;
    Song(String title, String artist, int durationMs) {
        this.title = title; this.artist = artist; this.durationMs = durationMs;
    }
    public String toString() { return title + " by " + artist; }
}

interface SongIterator {
    boolean hasNext();
    Song next();
    void reset();
}

class Playlist {
    private final List<Song> songs = new ArrayList<>();
    final String name;
    Playlist(String name) { this.name = name; }
    void addSong(Song song) { songs.add(song); }
    List<Song> getSongs() { return List.copyOf(songs); }
    SongIterator createIterator() { return new PlaylistIterator(this); }
    SongIterator createShuffleIterator() { return new ShuffleIterator(this); }
}

class PlaylistIterator implements SongIterator {
    private final Playlist playlist;
    private int position = 0;
    PlaylistIterator(Playlist p) { this.playlist = p; }
    public boolean hasNext() { return position < playlist.getSongs().size(); }
    public Song next() {
        if (\!hasNext()) throw new NoSuchElementException();
        return playlist.getSongs().get(position++);
    }
    public void reset() { position = 0; }
}

class ShuffleIterator implements SongIterator {
    private final Playlist playlist;
    private final List<Integer> indices;
    private int position = 0;
    ShuffleIterator(Playlist p) {
        this.playlist = p;
        this.indices = new ArrayList<>();
        for (int i = 0; i < p.getSongs().size(); i++) indices.add(i);
        Collections.shuffle(indices);
    }
    public boolean hasNext() { return position < indices.size(); }
    public Song next() {
        if (\!hasNext()) throw new NoSuchElementException();
        return playlist.getSongs().get(indices.get(position++));
    }
    public void reset() { position = 0; }
}

// Usage
public class IteratorDemo {
    public static void main(String[] args) {
        Playlist pl = new Playlist("Road Trip");
        pl.addSong(new Song("Bohemian Rhapsody", "Queen", 354000));
        pl.addSong(new Song("Hotel California", "Eagles", 391000));
        pl.addSong(new Song("Stairway to Heaven", "Led Zeppelin", 482000));

        SongIterator it = pl.createIterator();
        while (it.hasNext()) System.out.println(it.next());

        System.out.println("--- Shuffle ---");
        SongIterator shuffle = pl.createShuffleIterator();
        while (shuffle.hasNext()) System.out.println(shuffle.next());
    }
}`,

  mediator: `// Mediator — central hub coordinates communication
import java.util.ArrayList;
import java.util.List;

interface ChatMediator {
    void sendMessage(ChatUser sender, String message);
    void addUser(ChatUser user);
    void removeUser(ChatUser user);
}

abstract class ChatUser {
    protected ChatMediator mediator;
    protected final String username;
    ChatUser(String username) { this.username = username; }
    void setMediator(ChatMediator m) { this.mediator = m; }
    void sendMessage(String message) {
        System.out.println(username + " sends: " + message);
        if (mediator \!= null) mediator.sendMessage(this, message);
    }
    void receiveMessage(String from, String message) {
        System.out.println(username + " receives from " + from + ": " + message);
    }
}

class AdminUser extends ChatUser {
    AdminUser(String username) { super(username); }
    void kickUser(String target) {
        System.out.println("[Admin] " + username + " kicked " + target);
    }
}

class RegularUser extends ChatUser {
    RegularUser(String username) { super(username); }
}

class GroupChatRoom implements ChatMediator {
    private final List<ChatUser> users = new ArrayList<>();
    public void addUser(ChatUser user) {
        user.setMediator(this);
        users.add(user);
        System.out.println(user.username + " joined the room");
    }
    public void removeUser(ChatUser user) {
        users.remove(user);
        System.out.println(user.username + " left the room");
    }
    public void sendMessage(ChatUser sender, String message) {
        for (ChatUser u : users) {
            if (u \!= sender) u.receiveMessage(sender.username, message);
        }
    }
}

// Usage
public class MediatorDemo {
    public static void main(String[] args) {
        GroupChatRoom room = new GroupChatRoom();
        AdminUser alice = new AdminUser("Alice");
        RegularUser bob = new RegularUser("Bob");
        RegularUser charlie = new RegularUser("Charlie");
        room.addUser(alice);
        room.addUser(bob);
        room.addUser(charlie);
        alice.sendMessage("Hello everyone\!");
        bob.sendMessage("Hi Alice\!");
        alice.kickUser("Charlie");
    }
}`,

  "template-method": `// Template Method — data export with overridable formatting steps
import java.util.*;

abstract class DataExporter {
    public final String export(List<Map<String, String>> records) {
        if (records.isEmpty()) return "";
        List<String> columns = new ArrayList<>(records.get(0).keySet());
        StringBuilder output = new StringBuilder();
        output.append(formatHeader(columns));
        for (Map<String, String> row : records) { output.append(formatRow(row)); }
        output.append(addFooter());
        return writeOutput(output.toString());
    }
    protected abstract String formatHeader(List<String> columns);
    protected abstract String formatRow(Map<String, String> row);
    protected abstract String writeOutput(String content);
    protected String addFooter() { return ""; }
}

class CSVExporter extends DataExporter {
    private final String delimiter;
    CSVExporter() { this(","); }
    CSVExporter(String delimiter) { this.delimiter = delimiter; }
    protected String formatHeader(List<String> columns) { return String.join(delimiter, columns) + "\n"; }
    protected String formatRow(Map<String, String> row) { return String.join(delimiter, row.values()) + "\n"; }
    protected String writeOutput(String content) { System.out.println("Writing CSV..."); return content; }
}

class PDFExporter extends DataExporter {
    protected String formatHeader(List<String> columns) { return "[PDF Header] " + String.join(" | ", columns) + "\n"; }
    protected String formatRow(Map<String, String> row) { return "[PDF Row] " + String.join(" | ", row.values()) + "\n"; }
    protected String writeOutput(String content) { System.out.println("Rendering PDF..."); return content; }
    protected String addFooter() { return "[PDF Footer] Page 1 of 1\n"; }
}

// Usage
public class TemplateMethodDemo {
    public static void main(String[] args) {
        var records = List.of(Map.of("name","Alice","role","Engineer"), Map.of("name","Bob","role","Designer"));
        System.out.println(new CSVExporter().export(records));
        System.out.println(new PDFExporter().export(records));
    }
}`,

  "chain-of-responsibility": `// Chain of Responsibility — support ticket escalation
import java.util.List;

class SupportTicket {
    private final String category, priority, description;
    SupportTicket(String c, String p, String d) { category = c; priority = p; description = d; }
    String getCategory() { return category; }
    String getPriority() { return priority; }
    String getDescription() { return description; }
}

abstract class SupportHandler {
    protected SupportHandler next;
    protected final String handlerName;
    SupportHandler(String name) { this.handlerName = name; }
    SupportHandler setNext(SupportHandler h) { this.next = h; return h; }
    String handle(SupportTicket ticket) {
        if (canHandle(ticket)) return "[" + handlerName + "] Resolved: " + ticket.getDescription();
        if (next \!= null) return next.handle(ticket);
        return null;
    }
    protected abstract boolean canHandle(SupportTicket ticket);
}

class TechnicalSupport extends SupportHandler {
    private final List<String> specialties = List.of("bug", "crash", "error");
    TechnicalSupport() { super("TechnicalSupport"); }
    protected boolean canHandle(SupportTicket t) { return specialties.contains(t.getCategory()); }
}

class BillingSupport extends SupportHandler {
    BillingSupport() { super("BillingSupport"); }
    protected boolean canHandle(SupportTicket t) { return "billing".equals(t.getCategory()); }
}

class ManagerEscalation extends SupportHandler {
    ManagerEscalation() { super("ManagerEscalation"); }
    protected boolean canHandle(SupportTicket t) { return true; }
}

// Usage
public class ChainDemo {
    public static void main(String[] args) {
        SupportHandler tech = new TechnicalSupport();
        tech.setNext(new BillingSupport()).setNext(new ManagerEscalation());
        for (SupportTicket t : new SupportTicket[]{
            new SupportTicket("bug","high","App crashes on login"),
            new SupportTicket("billing","medium","Double charged"),
            new SupportTicket("other","low","Feature request")
        }) {
            String r = tech.handle(t);
            System.out.println(r \!= null ? r : "Unhandled");
        }
    }
}`,

  memento: `// Memento — text editor with snapshot-based undo/redo
import java.util.ArrayDeque;
import java.util.Deque;
import java.time.Instant;

class EditorSnapshot {
    private final String content;
    private final int cursorPosition;
    private final Instant timestamp;
    EditorSnapshot(String content, int cursorPosition) {
        this.content = content; this.cursorPosition = cursorPosition; this.timestamp = Instant.now();
    }
    String getContent() { return content; }
    int getCursorPosition() { return cursorPosition; }
    Instant getTimestamp() { return timestamp; }
}

class TextEditor {
    private StringBuilder content = new StringBuilder();
    private int cursorPosition = 0;
    void insertText(String text) { content.insert(cursorPosition, text); cursorPosition += text.length(); }
    String getContent() { return content.toString(); }
    EditorSnapshot save() { return new EditorSnapshot(content.toString(), cursorPosition); }
    void restore(EditorSnapshot s) { content = new StringBuilder(s.getContent()); cursorPosition = s.getCursorPosition(); }
}

class UndoHistory {
    private final Deque<EditorSnapshot> undoStack = new ArrayDeque<>();
    private final Deque<EditorSnapshot> redoStack = new ArrayDeque<>();
    private final TextEditor editor;
    UndoHistory(TextEditor editor) { this.editor = editor; }
    void backup() { undoStack.push(editor.save()); redoStack.clear(); }
    void undo() { EditorSnapshot s = undoStack.poll(); if (s \!= null) { redoStack.push(editor.save()); editor.restore(s); } }
    void redo() { EditorSnapshot s = redoStack.poll(); if (s \!= null) { undoStack.push(editor.save()); editor.restore(s); } }
}

// Usage
public class MementoDemo {
    public static void main(String[] args) {
        TextEditor editor = new TextEditor();
        UndoHistory history = new UndoHistory(editor);
        history.backup();
        editor.insertText("Hello");
        history.backup();
        editor.insertText(" World");
        System.out.println(editor.getContent()); // Hello World
        history.undo();
        System.out.println(editor.getContent()); // Hello
        history.redo();
        System.out.println(editor.getContent()); // Hello World
    }
}`,

  visitor: `// Visitor — add operations without modifying element classes
interface Visitor {
    void visitCircle(CircleElement circle);
    void visitRectangle(RectangleElement rect);
}

interface Element {
    void accept(Visitor visitor);
}

class CircleElement implements Element {
    final double radius;
    CircleElement(double r) { this.radius = r; }
    public void accept(Visitor v) { v.visitCircle(this); }
}

class RectangleElement implements Element {
    final double width, height;
    RectangleElement(double w, double h) { this.width = w; this.height = h; }
    public void accept(Visitor v) { v.visitRectangle(this); }
}

class AreaCalculator implements Visitor {
    double total = 0;
    public void visitCircle(CircleElement c) {
        total += Math.PI * c.radius * c.radius;
    }
    public void visitRectangle(RectangleElement r) {
        total += r.width * r.height;
    }
}

class ShapePrinter implements Visitor {
    public void visitCircle(CircleElement c) {
        System.out.println("Circle(r=" + c.radius + ")");
    }
    public void visitRectangle(RectangleElement r) {
        System.out.println("Rect(" + r.width + "x" + r.height + ")");
    }
}

// Usage
public class VisitorDemo {
    public static void main(String[] args) {
        Element[] shapes = { new CircleElement(5), new RectangleElement(3, 4) };
        AreaCalculator calc = new AreaCalculator();
        for (Element e : shapes) e.accept(calc);
        System.out.printf("Total area: %.2f%n", calc.total); // ~90.54
    }
}`,

  interpreter: `// Interpreter — evaluate expressions from an AST
import java.util.HashMap;
import java.util.Map;

class ExprContext {
    private final Map<String, Boolean> vars = new HashMap<>();
    void set(String name, boolean value) { vars.put(name, value); }
    boolean get(String name) { return vars.getOrDefault(name, false); }
}

interface Expression {
    boolean interpret(ExprContext context);
}

class TerminalExpression implements Expression {
    private final String variable;
    TerminalExpression(String variable) { this.variable = variable; }
    public boolean interpret(ExprContext ctx) { return ctx.get(variable); }
    public String toString() { return variable; }
}

class OrExpression implements Expression {
    private final Expression left, right;
    OrExpression(Expression l, Expression r) { this.left = l; this.right = r; }
    public boolean interpret(ExprContext ctx) {
        return left.interpret(ctx) || right.interpret(ctx);
    }
    public String toString() { return "(" + left + " OR " + right + ")"; }
}

class AndExpression implements Expression {
    private final Expression left, right;
    AndExpression(Expression l, Expression r) { this.left = l; this.right = r; }
    public boolean interpret(ExprContext ctx) {
        return left.interpret(ctx) && right.interpret(ctx);
    }
    public String toString() { return "(" + left + " AND " + right + ")"; }
}

// Usage: (is_admin OR is_manager) AND is_active
public class InterpreterDemo {
    public static void main(String[] args) {
        Expression rule = new AndExpression(
            new OrExpression(new TerminalExpression("is_admin"),
                             new TerminalExpression("is_manager")),
            new TerminalExpression("is_active"));
        System.out.println("Rule: " + rule);

        ExprContext ctx = new ExprContext();
        ctx.set("is_admin", true);
        ctx.set("is_active", true);
        System.out.println("Result: " + rule.interpret(ctx)); // true
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  MODERN PATTERNS
  // ════════════════════════════════════════════════════════════

  repository: `// Repository — collection-like interface hiding data storage
import java.util.*;

interface Repository<T> {
    T findById(String id);
    List<T> findAll();
    void save(T entity);
    void delete(String id);
}

class Entity {
    final String id, name;
    final java.time.Instant createdAt;
    Entity(String id, String name) {
        this.id = id; this.name = name; this.createdAt = java.time.Instant.now();
    }
    public String toString() { return "Entity(" + name + ")"; }
}

class SQLRepository implements Repository<Entity> {
    public Entity findById(String id) {
        System.out.println("SQL: SELECT * FROM entities WHERE id = '" + id + "'");
        return null;
    }
    public List<Entity> findAll() {
        System.out.println("SQL: SELECT * FROM entities");
        return List.of();
    }
    public void save(Entity entity) {
        System.out.println("SQL: INSERT INTO entities VALUES ('" + entity.id + "', '" + entity.name + "')");
    }
    public void delete(String id) {
        System.out.println("SQL: DELETE FROM entities WHERE id = '" + id + "'");
    }
}

class MongoRepository implements Repository<Entity> {
    private final Map<String, Entity> store = new LinkedHashMap<>();
    public Entity findById(String id) { return store.get(id); }
    public List<Entity> findAll()     { return new ArrayList<>(store.values()); }
    public void save(Entity entity)   { store.put(entity.id, entity); }
    public void delete(String id)     { store.remove(id); }
}

// Usage — business logic is decoupled from storage
public class RepositoryDemo {
    static void createEntity(Repository<Entity> repo, String name) {
        String id = UUID.randomUUID().toString();
        repo.save(new Entity(id, name));
    }
    public static void main(String[] args) {
        Repository<Entity> repo = new MongoRepository();
        createEntity(repo, "Alice");
        createEntity(repo, "Bob");
        System.out.println(repo.findAll()); // [Entity(Alice), Entity(Bob)]
    }
}`,

  cqrs: `// CQRS — separate read and write models
import java.util.*;

// Write side
interface Command { String type(); }
interface CommandHandler { void handle(Command cmd); }

record CreateOrderCommand(String orderId, String customerId) implements Command {
    public String type() { return "CreateOrder"; }
}

class CreateOrderHandler implements CommandHandler {
    private final Map<String, Map<String, Object>> writeDb = new HashMap<>();
    public void handle(Command cmd) {
        var c = (CreateOrderCommand) cmd;
        writeDb.put(c.orderId(), Map.of("id", c.orderId(), "customer", c.customerId()));
        System.out.println("[WRITE] Order " + c.orderId() + " saved");
    }
}

// Read side
interface Query { String type(); }
interface QueryHandler<R> { R handle(Query q); }

record GetOrderQuery(String orderId) implements Query {
    public String type() { return "GetOrder"; }
}

// Buses
class CommandBus {
    private final Map<String, CommandHandler> handlers = new HashMap<>();
    void register(String type, CommandHandler h) { handlers.put(type, h); }
    void dispatch(Command cmd) {
        CommandHandler h = handlers.get(cmd.type());
        if (h == null) throw new IllegalArgumentException("No handler for " + cmd.type());
        h.handle(cmd);
    }
}

class QueryBus {
    private final Map<String, QueryHandler<?>> handlers = new HashMap<>();
    <R> void register(String type, QueryHandler<R> h) { handlers.put(type, h); }
    @SuppressWarnings("unchecked")
    <R> R execute(Query q) {
        QueryHandler<R> h = (QueryHandler<R>) handlers.get(q.type());
        if (h == null) throw new IllegalArgumentException("No handler for " + q.type());
        return h.handle(q);
    }
}

class WriteModel {
    private final Map<String, Object> store = new HashMap<>();
    void save(String id, Object entity) {
        store.put(id, entity);
        System.out.println("[WRITE MODEL] Saved " + id);
    }
}

class ReadModel {
    private final Map<String, Object> cache = new HashMap<>();
    List<Object> query() { return new ArrayList<>(cache.values()); }
    Object getById(String id) { return cache.get(id); }
    void project(String id, Object data) { cache.put(id, data); }
}

class DomainEvent {
    final String eventType, aggregateId;
    final Object payload;
    DomainEvent(String eventType, String aggregateId, Object payload) {
        this.eventType = eventType; this.aggregateId = aggregateId;
        this.payload = payload;
    }
}

// Usage
public class CQRSDemo {
    public static void main(String[] args) {
        CommandBus commandBus = new CommandBus();
        commandBus.register("CreateOrder", new CreateOrderHandler());
        commandBus.dispatch(new CreateOrderCommand("ord-1", "cust-1"));
    }
}`,

  "event-sourcing": `// Event Sourcing — store events, derive state by replay
import java.util.*;

abstract class Event {
    final String id, aggregateId;
    Event(String id, String aggregateId) {
        this.id = id; this.aggregateId = aggregateId;
    }
    abstract String getType();
}

class MoneyDeposited extends Event {
    final double amount;
    MoneyDeposited(String id, String aggId, double amount) {
        super(id, aggId); this.amount = amount;
    }
    String getType() { return "MoneyDeposited"; }
}

class MoneyWithdrawn extends Event {
    final double amount;
    MoneyWithdrawn(String id, String aggId, double amount) {
        super(id, aggId); this.amount = amount;
    }
    String getType() { return "MoneyWithdrawn"; }
}

class EventStore {
    private final List<Event> events = new ArrayList<>();
    void append(Event e) { events.add(e); }
    List<Event> getEvents(String aggregateId) {
        return events.stream().filter(e -> e.aggregateId.equals(aggregateId)).toList();
    }
}

class EventBus {
    private final Map<String, List<java.util.function.Consumer<Event>>> handlers = new HashMap<>();
    void subscribe(String eventType, java.util.function.Consumer<Event> handler) {
        handlers.computeIfAbsent(eventType, k -> new ArrayList<>()).add(handler);
    }
    void publish(Event event) {
        List<java.util.function.Consumer<Event>> fns = handlers.getOrDefault(event.getType(), List.of());
        for (var fn : fns) fn.accept(event);
    }
}

class Aggregate {
    private double balance;
    private int version;

    void apply(Event event) {
        if (event instanceof MoneyDeposited d)  balance += d.amount;
        if (event instanceof MoneyWithdrawn w)  balance -= w.amount;
        version++;
    }
    void loadFromHistory(List<Event> events) {
        events.forEach(this::apply);
    }
    double getBalance() { return balance; }
}

// Usage
public class EventSourcingDemo {
    public static void main(String[] args) {
        EventStore store = new EventStore();
        EventBus bus = new EventBus();
        String accId = "acc-001";

        bus.subscribe("MoneyDeposited", e ->
            System.out.println("[BUS] Deposit: " + ((MoneyDeposited) e).amount));

        Event e1 = new MoneyDeposited("e1", accId, 1000);
        Event e2 = new MoneyDeposited("e2", accId, 500);
        Event e3 = new MoneyWithdrawn("e3", accId, 200);
        store.append(e1); bus.publish(e1);
        store.append(e2); bus.publish(e2);
        store.append(e3); bus.publish(e3);

        Aggregate account = new Aggregate();
        account.loadFromHistory(store.getEvents(accId));
        System.out.println("Balance: $" + account.getBalance()); // $1300.0
    }
}`,

  saga: `// Saga — distributed transactions with compensating actions
import java.util.*;

interface SagaStep {
    String name();
    void execute(Map<String, Object> context) throws Exception;
    void compensate(Map<String, Object> context);
}

class SagaOrchestrator {
    private final List<SagaStep> steps;
    private final Deque<SagaStep> completed = new ArrayDeque<>();

    SagaOrchestrator(List<SagaStep> steps) { this.steps = steps; }

    String execute(Map<String, Object> ctx) {
        for (SagaStep step : steps) {
            try {
                System.out.println("[SAGA] Executing: " + step.name());
                step.execute(ctx);
                completed.push(step);
            } catch (Exception e) {
                System.out.println("[SAGA] Failed at: " + step.name());
                compensate(ctx);
                return "FAILED: " + e.getMessage();
            }
        }
        return "COMPLETED";
    }

    private void compensate(Map<String, Object> ctx) {
        while (!completed.isEmpty()) {
            SagaStep step = completed.pop();
            System.out.println("[SAGA] Compensating: " + step.name());
            step.compensate(ctx);
        }
    }
}

class SagaLog {
    private final String sagaId;
    private final List<Map<String, String>> entries = new ArrayList<>();
    SagaLog(String sagaId) { this.sagaId = sagaId; }
    void recordStepStarted(String stepName) { entries.add(Map.of("step", stepName, "status", "started")); }
    void recordStepCompleted(String stepName) { entries.add(Map.of("step", stepName, "status", "completed")); }
    void recordStepFailed(String stepName, String error) { entries.add(Map.of("step", stepName, "status", "failed", "error", error)); }
    void recordCompensation(String stepName) { entries.add(Map.of("step", stepName, "status", "compensated")); }
    List<Map<String, String>> getEntries() { return List.copyOf(entries); }
}

// Usage
public class SagaDemo {
    public static void main(String[] args) {
        List<SagaStep> steps = List.of(
            new SagaStep() {
                public String name() { return "Reserve Inventory"; }
                public void execute(Map<String, Object> ctx) { ctx.put("reserved", true); }
                public void compensate(Map<String, Object> ctx) { ctx.put("reserved", false); }
            },
            new SagaStep() {
                public String name() { return "Charge Payment"; }
                public void execute(Map<String, Object> ctx) throws Exception {
                    if (ctx.containsKey("fail")) throw new Exception("Card declined");
                    ctx.put("charged", true);
                }
                public void compensate(Map<String, Object> ctx) { ctx.put("charged", false); }
            }
        );
        var ctx = new HashMap<String, Object>();
        ctx.put("fail", true);
        System.out.println(new SagaOrchestrator(steps).execute(ctx)); // FAILED
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  RESILIENCE PATTERNS
  // ════════════════════════════════════════════════════════════

  "circuit-breaker": `// Circuit Breaker — fail fast when a downstream service is unhealthy
import java.util.function.Supplier;

enum CircuitBreakerState { CLOSED, OPEN, HALF_OPEN }

class CircuitBreaker {
    private CircuitBreakerState state = CircuitBreakerState.CLOSED;
    private int failureCount;
    private long lastFailureTime;
    private final int failureThreshold;
    private final long resetTimeoutMs;

    CircuitBreaker(int failureThreshold, long resetTimeoutMs) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
    }

    <T> T call(Supplier<T> fn) {
        if (state == CircuitBreakerState.OPEN) {
            if (System.currentTimeMillis() - lastFailureTime >= resetTimeoutMs) {
                state = CircuitBreakerState.HALF_OPEN;
            } else {
                throw new RuntimeException("Circuit breaker is OPEN");
            }
        }
        try {
            T result = fn.get();
            onSuccess();
            return result;
        } catch (Exception e) {
            onFailure();
            throw e;
        }
    }

    private void onSuccess() { failureCount = 0; state = CircuitBreakerState.CLOSED; }
    private void onFailure() {
        failureCount++;
        lastFailureTime = System.currentTimeMillis();
        if (failureCount >= failureThreshold) state = CircuitBreakerState.OPEN;
    }
    CircuitBreakerState getState() { return state; }
}

// Usage
public class CircuitBreakerDemo {
    public static void main(String[] args) {
        CircuitBreaker breaker = new CircuitBreaker(3, 5000);
        try {
            String result = breaker.call(() -> "payment OK");
            System.out.println(result);
        } catch (Exception e) {
            System.out.println("Failed: " + e.getMessage());
        }
        System.out.println("State: " + breaker.getState()); // CLOSED
    }
}`,

  bulkhead: `// Bulkhead — isolate workloads into separate resource pools
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.function.Supplier;

class Partition {
    private final String name;
    private final Semaphore semaphore;

    Partition(String name, int maxConcurrent) {
        this.name = name;
        this.semaphore = new Semaphore(maxConcurrent);
    }

    <T> T execute(Supplier<T> fn) throws Exception {
        semaphore.acquire();
        try {
            return fn.get();
        } finally {
            semaphore.release();
        }
    }
}

class Bulkhead {
    private final Map<String, Partition> partitions = new HashMap<>();

    void createPartition(String name, int maxConcurrent) {
        partitions.put(name, new Partition(name, maxConcurrent));
    }

    <T> T execute(String partitionName, Supplier<T> fn) throws Exception {
        Partition p = partitions.get(partitionName);
        if (p == null) throw new IllegalArgumentException("Partition not found: " + partitionName);
        return p.execute(fn);
    }
}

// Usage
public class BulkheadDemo {
    public static void main(String[] args) throws Exception {
        Bulkhead bh = new Bulkhead();
        bh.createPartition("checkout", 20);
        bh.createPartition("analytics", 5);

        String result = bh.execute("checkout", () -> "payment processed");
        System.out.println(result);
        System.out.println(bh.execute("analytics", () -> "event tracked"));
    }
}`,

  retry: `// Retry — automatic re-attempts with exponential backoff
import java.util.function.Supplier;

interface BackoffStrategy {
    long nextDelay(int attempt);
}

class ExponentialBackoff implements BackoffStrategy {
    private final long baseMs;
    private final long maxMs;
    ExponentialBackoff(long baseMs, long maxMs) {
        this.baseMs = baseMs; this.maxMs = maxMs;
    }
    public long nextDelay(int attempt) {
        long delay = baseMs * (1L << attempt);
        return Math.min(delay, maxMs);
    }
}

class RetryPolicy {
    private final int maxAttempts;
    private final BackoffStrategy backoff;

    RetryPolicy(int maxAttempts, BackoffStrategy backoff) {
        this.maxAttempts = maxAttempts;
        this.backoff = backoff;
    }

    <T> T execute(Supplier<T> fn) throws Exception {
        Exception lastError = null;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return fn.get();
            } catch (Exception e) {
                lastError = e;
                long delay = backoff.nextDelay(attempt);
                System.out.println("Retry " + (attempt + 1) + " after " + delay + "ms");
                Thread.sleep(delay);
            }
        }
        throw lastError;
    }
}

// Usage
public class RetryDemo {
    static int callCount = 0;
    public static void main(String[] args) throws Exception {
        RetryPolicy policy = new RetryPolicy(3, new ExponentialBackoff(100, 2000));
        String result = policy.execute(() -> {
            if (++callCount < 3) throw new RuntimeException("Transient error");
            return "Success on attempt " + callCount;
        });
        System.out.println(result); // Success on attempt 3
    }
}`,

  "rate-limiter": `// Rate Limiter — token bucket algorithm
class TokenBucketRateLimiter {
    private final int maxTokens;
    private final double refillRate; // tokens per second
    private double tokens;
    private long lastRefillTime;

    TokenBucketRateLimiter(int maxTokens, double refillRate) {
        this.maxTokens = maxTokens;
        this.refillRate = refillRate;
        this.tokens = maxTokens;
        this.lastRefillTime = System.nanoTime();
    }

    synchronized boolean tryAcquire() {
        refill();
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        return false;
    }

    private void refill() {
        long now = System.nanoTime();
        double elapsed = (now - lastRefillTime) / 1_000_000_000.0;
        tokens = Math.min(maxTokens, tokens + elapsed * refillRate);
        lastRefillTime = now;
    }
}

// Usage
public class RateLimiterDemo {
    public static void main(String[] args) {
        TokenBucketRateLimiter limiter = new TokenBucketRateLimiter(5, 2.0);
        for (int i = 0; i < 8; i++) {
            boolean allowed = limiter.tryAcquire();
            System.out.println("Request " + (i + 1) + ": " + (allowed ? "ALLOWED" : "REJECTED"));
        }
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  CONCURRENCY PATTERNS
  // ════════════════════════════════════════════════════════════

  "thread-pool": `// Thread Pool — reuse a fixed set of threads for task execution
import java.util.concurrent.*;

class SimpleThreadPool {
    private final BlockingQueue<Runnable> taskQueue;
    private final Thread[] workers;
    private volatile boolean running = true;

    SimpleThreadPool(int poolSize, int queueCapacity) {
        this.taskQueue = new LinkedBlockingQueue<>(queueCapacity);
        this.workers = new Thread[poolSize];
        for (int i = 0; i < poolSize; i++) {
            workers[i] = new Thread(() -> {
                while (running || !taskQueue.isEmpty()) {
                    try {
                        Runnable task = taskQueue.poll(100, TimeUnit.MILLISECONDS);
                        if (task != null) task.run();
                    } catch (InterruptedException e) { break; }
                }
            }, "worker-" + i);
            workers[i].start();
        }
    }

    void submit(Runnable task) throws InterruptedException {
        taskQueue.put(task);
    }

    void shutdown() throws InterruptedException {
        running = false;
        for (Thread w : workers) w.join();
    }
}

// Usage — or use java.util.concurrent.Executors directly
public class ThreadPoolDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        for (int i = 1; i <= 5; i++) {
            final int taskId = i;
            pool.submit(() -> {
                System.out.println(Thread.currentThread().getName() + " running task " + taskId);
            });
        }
        pool.shutdown();
        pool.awaitTermination(5, TimeUnit.SECONDS);
    }
}`,

  "producer-consumer": `// Producer-Consumer — shared bounded buffer with backpressure
import java.util.concurrent.*;

class Lock {
    private final java.util.concurrent.locks.ReentrantLock lock = new java.util.concurrent.locks.ReentrantLock();
    void acquire() { lock.lock(); }
    void release() { lock.unlock(); }
    boolean isLocked() { return lock.isLocked(); }
}

class SharedBuffer<T> {
    private final BlockingQueue<T> queue;
    SharedBuffer(int capacity) { this.queue = new ArrayBlockingQueue<>(capacity); }
    void put(T item) throws InterruptedException { queue.put(item); }
    T take() throws InterruptedException { return queue.take(); }
    int size() { return queue.size(); }
}

class Producer<T> implements Runnable {
    private final String id;
    private final SharedBuffer<T> buffer;
    private final T[] items;

    @SafeVarargs
    Producer(String id, SharedBuffer<T> buffer, T... items) {
        this.id = id; this.buffer = buffer; this.items = items;
    }

    public void run() {
        try {
            for (T item : items) {
                buffer.put(item);
                System.out.println("[" + id + "] Produced: " + item);
            }
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}

class Consumer<T> implements Runnable {
    private final String id;
    private final SharedBuffer<T> buffer;
    private final int count;

    Consumer(String id, SharedBuffer<T> buffer, int count) {
        this.id = id; this.buffer = buffer; this.count = count;
    }

    public void run() {
        try {
            for (int i = 0; i < count; i++) {
                T item = buffer.take();
                System.out.println("[" + id + "] Consumed: " + item);
            }
        } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}

// Usage
public class ProducerConsumerDemo {
    public static void main(String[] args) throws InterruptedException {
        SharedBuffer<String> buffer = new SharedBuffer<>(5);
        Thread t1 = new Thread(new Producer<>("p1", buffer, "A", "B", "C"));
        Thread t2 = new Thread(new Consumer<>("c1", buffer, 3));
        t1.start(); t2.start();
        t1.join(); t2.join();
    }
}`,

  // ════════════════════════════════════════════════════════════
  //  AI AGENT PATTERNS
  // ════════════════════════════════════════════════════════════

  "react-pattern": `// ReAct — interleave Thought, Action, Observation in a loop
import java.util.*;

interface Tool {
    String name();
    String execute(Map<String, Object> input);
}

class ToolRegistry {
    private final Map<String, Tool> tools = new LinkedHashMap<>();
    void register(Tool tool) { tools.put(tool.name(), tool); }
    Tool get(String name) { return tools.get(name); }
    List<String> list() { return new ArrayList<>(tools.keySet()); }
}

class Action {
    final String toolName;
    final Map<String, Object> input;
    Action(String toolName, Map<String, Object> input) {
        this.toolName = toolName; this.input = input;
    }
    boolean validate() { return toolName != null && !toolName.isEmpty(); }
}

class Observation {
    final String result;
    final boolean success;
    Observation(String result, boolean success) {
        this.result = result; this.success = success;
    }
    String toPrompt() { return "Observation [" + (success ? "ok" : "err") + "]: " + result; }
    boolean isError() { return !success; }
}

class Thought {
    final String reasoning;
    final Action nextAction;
    final boolean isFinal;
    final String finalAnswer;
    Thought(String reasoning, Action nextAction, boolean isFinal, String finalAnswer) {
        this.reasoning = reasoning; this.nextAction = nextAction;
        this.isFinal = isFinal; this.finalAnswer = finalAnswer;
    }
    boolean hasAction() { return nextAction != null; }
    String toPrompt() { return "Thought: " + reasoning; }
}

class Environment {
    private final Map<String, Tool> tools;
    private final Map<String, Object> state = new HashMap<>();
    Environment(Map<String, Tool> tools) { this.tools = tools; }
    Observation execute(Action action) {
        Tool tool = tools.get(action.toolName);
        if (tool == null) return new Observation("Tool not found: " + action.toolName, false);
        try {
            String result = tool.execute(action.input);
            return new Observation(result, true);
        } catch (Exception e) {
            return new Observation(e.getMessage(), false);
        }
    }
    Map<String, Object> getState() { return Map.copyOf(state); }
}

class Agent {
    private final ToolRegistry registry;
    private final Environment env;
    private final int maxSteps;
    private final List<String> history = new ArrayList<>();
    Agent(Map<String, Tool> tools, int maxSteps) {
        this.registry = new ToolRegistry();
        tools.values().forEach(registry::register);
        this.env = new Environment(tools);
        this.maxSteps = maxSteps;
    }
    String run(String query) {
        history.clear();
        history.add("User query: " + query);
        for (int i = 0; i < maxSteps; i++) {
            Thought thought = think();
            if (thought.isFinal) return thought.finalAnswer;
            if (thought.hasAction()) {
                Observation observation = env.execute(thought.nextAction);
                history.add(observation.toPrompt());
            }
        }
        return "Max steps reached.";
    }
    private Thought think() {
        return new Thought("Done", null, true, "42");
    }
}

// Usage
public class ReActDemo {
    public static void main(String[] args) {
        Map<String, Tool> tools = Map.of("search", new Tool() {
            public String name() { return "search"; }
            public String execute(Map<String, Object> input) {
                return "Results for: " + input.get("query");
            }
        });
        Agent agent = new Agent(tools, 10);
        System.out.println(agent.run("What is 6 x 7?")); // 42
    }
}`,

  "tool-use": `// Tool Use — registry of typed tools the agent can invoke
import java.util.*;

interface ToolSchema {
    String name();
    String description();
    Map<String, String> parameters();
}

interface ToolResult {
    String output();
    boolean success();
}

record SimpleResult(String output, boolean success) implements ToolResult {}

interface Tool {
    String name();
    String description();
    ToolSchema schema();
    ToolResult execute(Map<String, Object> input);
}

class ToolRegistry {
    private final Map<String, Tool> tools = new LinkedHashMap<>();
    void register(Tool tool) { tools.put(tool.name(), tool); }
    Tool get(String name) { return tools.get(name); }
    List<ToolSchema> listSchemas() {
        return tools.values().stream().map(Tool::schema).toList();
    }
}

class CalculatorTool implements Tool {
    public String name() { return "calculator"; }
    public String description() { return "Evaluate a math expression"; }
    public ToolSchema schema() {
        return new ToolSchema() {
            public String name() { return "calculator"; }
            public String description() { return "Evaluate a math expression"; }
            public Map<String, String> parameters() { return Map.of("expression", "string"); }
        };
    }
    public ToolResult execute(Map<String, Object> input) {
        String expr = (String) input.get("expression");
        // Simplified: only handles "a + b"
        String[] parts = expr.split("\\\\+");
        try {
            double result = Double.parseDouble(parts[0].trim()) + Double.parseDouble(parts[1].trim());
            return new SimpleResult(String.valueOf(result), true);
        } catch (Exception e) {
            return new SimpleResult("Error: " + e.getMessage(), false);
        }
    }
}

class WebSearchTool implements Tool {
    public String name() { return "web_search"; }
    public String description() { return "Search the web for current information"; }
    public ToolSchema schema() {
        return new ToolSchema() {
            public String name() { return "web_search"; }
            public String description() { return "Search the web"; }
            public Map<String, String> parameters() { return Map.of("query", "string"); }
        };
    }
    public ToolResult execute(Map<String, Object> input) {
        return new SimpleResult("Results for: " + input.get("query"), true);
    }
}

class DatabaseTool implements Tool {
    public String name() { return "database"; }
    public String description() { return "Query a SQL database"; }
    public ToolSchema schema() {
        return new ToolSchema() {
            public String name() { return "database"; }
            public String description() { return "Query a SQL database"; }
            public Map<String, String> parameters() { return Map.of("sql", "string"); }
        };
    }
    public ToolResult execute(Map<String, Object> input) {
        return new SimpleResult("Query result for: " + input.get("sql"), true);
    }
}

// Usage
public class ToolUseDemo {
    public static void main(String[] args) {
        ToolRegistry registry = new ToolRegistry();
        registry.register(new WebSearchTool());
        registry.register(new CalculatorTool());
        registry.register(new DatabaseTool());
        Tool tool = registry.get("calculator");
        ToolResult result = tool.execute(Map.of("expression", "2 + 2"));
        System.out.println(result.output()); // 4.0
    }
}`,

  "multi-agent-orchestration": `// Multi-Agent Orchestration — specialist agents coordinated by orchestrator
import java.util.*;

record Task(String id, String type, String description) {}
record Result(String taskId, String output, boolean success) {}

class SharedMemory {
    private final Map<String, Object> store = new HashMap<>();
    void set(String key, Object value) { store.put(key, value); }
    Object get(String key) { return store.get(key); }
}

interface SpecialistAgent {
    boolean canHandle(Task task);
    Result execute(Task task, SharedMemory memory);
}

class ResearchAgent implements SpecialistAgent {
    public boolean canHandle(Task t) { return "research".equals(t.type()); }
    public Result execute(Task t, SharedMemory mem) {
        String findings = "Research results for: " + t.description();
        mem.set("research-" + t.id(), findings);
        return new Result(t.id(), findings, true);
    }
}

class CoderAgent implements SpecialistAgent {
    public boolean canHandle(Task t) { return "code".equals(t.type()); }
    public Result execute(Task t, SharedMemory mem) {
        String code = "// Code for: " + t.description();
        mem.set("code-" + t.id(), code);
        return new Result(t.id(), code, true);
    }
}

class ReviewerAgent implements SpecialistAgent {
    public boolean canHandle(Task t) { return "review".equals(t.type()); }
    public Result execute(Task t, SharedMemory mem) {
        String code = (String) mem.get("code-" + t.id());
        String feedback = "Review of: " + (code != null ? code : "no code found");
        mem.set("review-" + t.id(), feedback);
        return new Result(t.id(), feedback, true);
    }
}

class Orchestrator {
    private final List<SpecialistAgent> agents = new ArrayList<>();
    private final SharedMemory memory = new SharedMemory();

    void register(SpecialistAgent agent) { agents.add(agent); }

    String run(String goal) {
        List<Task> tasks = List.of(
            new Task("1", "research", goal),
            new Task("2", "code", goal));
        List<Result> results = new ArrayList<>();
        for (Task task : tasks) {
            SpecialistAgent agent = agents.stream()
                .filter(a -> a.canHandle(task)).findFirst()
                .orElseThrow(() -> new RuntimeException("No agent for: " + task.type()));
            results.add(agent.execute(task, memory));
        }
        return results.stream().map(Result::output).reduce((a, b) -> a + "\\n---\\n" + b).orElse("");
    }
}

// Usage
public class MultiAgentDemo {
    public static void main(String[] args) {
        Orchestrator orch = new Orchestrator();
        orch.register(new ResearchAgent());
        orch.register(new CoderAgent());
        orch.register(new ReviewerAgent());
        System.out.println(orch.run("Build a REST API"));
    }
}`,

};
