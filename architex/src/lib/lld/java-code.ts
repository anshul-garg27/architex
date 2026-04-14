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

  facade: `// Facade — simplified interface to a complex subsystem
class SubsystemA {
    String operationA1() { return "SubsystemA: Ready!"; }
    String operationA2() { return "SubsystemA: Go!"; }
}

class SubsystemB {
    String operationB1() { return "SubsystemB: Fire!"; }
}

class SubsystemC {
    String operationC1() { return "SubsystemC: Prepare!"; }
    String operationC2() { return "SubsystemC: Execute!"; }
}

class Facade {
    private final SubsystemA a = new SubsystemA();
    private final SubsystemB b = new SubsystemB();
    private final SubsystemC c = new SubsystemC();

    public String operation() {
        return String.join("\\n",
            a.operationA1(), c.operationC1(), b.operationB1(),
            a.operationA2(), c.operationC2());
    }
}

// Usage
public class FacadeDemo {
    public static void main(String[] args) {
        Facade facade = new Facade();
        System.out.println(facade.operation());
    }
}`,

  proxy: `// Proxy — lazy-loading with caching and access control
interface Subject {
    String request();
}

class RealSubject implements Subject {
    public String request() {
        System.out.println("RealSubject: handling request (expensive operation)...");
        return "Real data loaded from remote source";
    }
}

class ImageProxy implements Subject {
    private RealSubject realSubject;
    private String cache;

    private boolean checkAccess() {
        System.out.println("Proxy: checking access.");
        return true;
    }

    public String request() {
        if (cache != null) {
            System.out.println("Proxy: returning cached result.");
            return cache;
        }
        if (!checkAccess()) return "Access denied";
        if (realSubject == null) realSubject = new RealSubject();
        cache = realSubject.request();
        return cache;
    }
}

// Usage
public class ProxyDemo {
    public static void main(String[] args) {
        Subject proxy = new ImageProxy();
        System.out.println(proxy.request()); // Loads from real subject
        System.out.println(proxy.request()); // Returns cached result
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

class ConcreteObserverA implements Observer {
    public void update(Subject s) {
        System.out.println("ObserverA reacted to " + s.getState());
    }
}

class ConcreteObserverB implements Observer {
    public void update(Subject s) {
        System.out.println("ObserverB reacted to " + s.getState());
    }
}

// Usage
public class ObserverDemo {
    public static void main(String[] args) {
        Subject subject = new Subject();
        subject.attach(new ConcreteObserverA());
        subject.attach(new ConcreteObserverB());
        subject.setState(42); // Both observers notified
    }
}`,

  strategy: `// Strategy — interchangeable algorithms via interfaces
interface Strategy {
    int execute(int[] data);
}

class SumStrategy implements Strategy {
    public int execute(int[] data) {
        int sum = 0;
        for (int n : data) sum += n;
        return sum;
    }
}

class MaxStrategy implements Strategy {
    public int execute(int[] data) {
        int max = Integer.MIN_VALUE;
        for (int n : data) if (n > max) max = n;
        return max;
    }
}

class Context {
    private Strategy strategy;
    Context(Strategy strategy) { this.strategy = strategy; }
    void setStrategy(Strategy s) { this.strategy = s; }
    int doWork(int[] data) { return strategy.execute(data); }
}

// Usage
public class StrategyDemo {
    public static void main(String[] args) {
        int[] data = {1, 2, 3};
        Context ctx = new Context(new SumStrategy());
        System.out.println(ctx.doWork(data)); // 6

        ctx.setStrategy(new MaxStrategy());
        System.out.println(ctx.doWork(data)); // 3
    }
}`,

  command: `// Command — encapsulate requests as objects with undo
import java.util.ArrayDeque;
import java.util.Deque;

interface Command {
    void execute();
    void undo();
}

class Receiver {
    private StringBuilder data = new StringBuilder();
    void action(String text) {
        data.append(text);
        System.out.println("Data: " + data);
    }
    void reverseAction(String text) {
        data.delete(data.length() - text.length(), data.length());
        System.out.println("Data after undo: " + data);
    }
}

class WriteCommand implements Command {
    private final Receiver receiver;
    private final String text;
    WriteCommand(Receiver r, String text) { this.receiver = r; this.text = text; }
    public void execute() { receiver.action(text); }
    public void undo()    { receiver.reverseAction(text); }
}

class Invoker {
    private final Deque<Command> history = new ArrayDeque<>();
    void executeCommand(Command cmd) { cmd.execute(); history.push(cmd); }
    void undoLast() {
        Command cmd = history.poll();
        if (cmd != null) cmd.undo();
    }
}

// Usage
public class CommandDemo {
    public static void main(String[] args) {
        Receiver receiver = new Receiver();
        Invoker invoker = new Invoker();
        invoker.executeCommand(new WriteCommand(receiver, "Hello "));
        invoker.executeCommand(new WriteCommand(receiver, "World"));
        invoker.undoLast(); // Undo "World"
    }
}`,

  state: `// State — object behavior changes when internal state changes
interface State {
    void handle(TrafficLight context);
}

class TrafficLight {
    private State state;
    TrafficLight(State initial) { this.state = initial; }
    void setState(State s) {
        System.out.println("Transitioning to " + s.getClass().getSimpleName());
        this.state = s;
    }
    void request() { state.handle(this); }
}

class GreenLight implements State {
    public void handle(TrafficLight ctx) {
        System.out.println("GREEN: Cars go.");
        ctx.setState(new YellowLight());
    }
}

class YellowLight implements State {
    public void handle(TrafficLight ctx) {
        System.out.println("YELLOW: Caution!");
        ctx.setState(new RedLight());
    }
}

class RedLight implements State {
    public void handle(TrafficLight ctx) {
        System.out.println("RED: Cars stop.");
        ctx.setState(new GreenLight());
    }
}

// Usage
public class StateDemo {
    public static void main(String[] args) {
        TrafficLight light = new TrafficLight(new GreenLight());
        light.request(); // GREEN -> Yellow
        light.request(); // YELLOW -> Red
        light.request(); // RED -> Green
    }
}`,

  iterator: `// Iterator — implements java.util.Iterator<T>
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

class NumberCollection implements Iterable<Integer> {
    private final List<Integer> items = new ArrayList<>();

    void addItem(int item) { items.add(item); }
    List<Integer> getItems() { return items; }

    public Iterator<Integer> iterator() {
        return new NumberIterator(this);
    }
}

class NumberIterator implements Iterator<Integer> {
    private final NumberCollection collection;
    private int position = 0;

    NumberIterator(NumberCollection collection) { this.collection = collection; }

    public boolean hasNext() {
        return position < collection.getItems().size();
    }

    public Integer next() {
        if (!hasNext()) throw new NoSuchElementException();
        return collection.getItems().get(position++);
    }
}

// Usage
public class IteratorDemo {
    public static void main(String[] args) {
        NumberCollection col = new NumberCollection();
        col.addItem(10);
        col.addItem(20);
        col.addItem(30);

        // Works with for-each because we implement Iterable
        for (int n : col) {
            System.out.println(n); // 10, 20, 30
        }
    }
}`,

  mediator: `// Mediator — central hub coordinates communication
import java.util.ArrayList;
import java.util.List;

interface Mediator {
    void notify(Colleague sender, String event);
}

abstract class Colleague {
    protected Mediator mediator;
    void setMediator(Mediator m) { this.mediator = m; }
}

class ChatUser extends Colleague {
    final String name;
    ChatUser(String name) { this.name = name; }
    void send(String message) {
        System.out.println(name + " sends: " + message);
        if (mediator != null) mediator.notify(this, message);
    }
    void receive(String message) {
        System.out.println(name + " receives: " + message);
    }
}

class ChatRoom implements Mediator {
    private final List<ChatUser> users = new ArrayList<>();
    void register(ChatUser user) {
        user.setMediator(this);
        users.add(user);
    }
    public void notify(Colleague sender, String event) {
        for (ChatUser u : users) {
            if (u != sender) u.receive(event);
        }
    }
}

// Usage
public class MediatorDemo {
    public static void main(String[] args) {
        ChatRoom room = new ChatRoom();
        ChatUser alice = new ChatUser("Alice");
        ChatUser bob = new ChatUser("Bob");
        room.register(alice);
        room.register(bob);
        alice.send("Hello everyone!"); // Bob receives
    }
}`,

  "template-method": `// Template Method — skeleton algorithm with overridable steps
abstract class DataParser {
    // Template method — final prevents subclasses from changing the skeleton
    public final String[] templateMethod(String data) {
        String raw = openSource(data);
        String[] records = parseData(raw);
        closeSource();
        hook();
        return records;
    }
    protected abstract String openSource(String data);
    protected abstract String[] parseData(String raw);
    protected abstract void closeSource();
    protected void hook() {} // optional override
}

class CSVParser extends DataParser {
    protected String openSource(String data) {
        System.out.println("Opening CSV data...");
        return data;
    }
    protected String[] parseData(String raw) {
        return raw.split("\\n");
    }
    protected void closeSource() {
        System.out.println("CSV source closed.");
    }
}

class JSONParser extends DataParser {
    protected String openSource(String data) {
        System.out.println("Opening JSON data...");
        return data;
    }
    protected String[] parseData(String raw) {
        return new String[]{raw}; // simplified
    }
    protected void closeSource() {
        System.out.println("JSON source closed.");
    }
    protected void hook() {
        System.out.println("JSONParser: validating schema...");
    }
}

// Usage
public class TemplateMethodDemo {
    public static void main(String[] args) {
        DataParser csv = new CSVParser();
        String[] result = csv.templateMethod("a,b\\nc,d");
        System.out.println(java.util.Arrays.toString(result));
    }
}`,

  "chain-of-responsibility": `// Chain of Responsibility — request passes through handler chain
abstract class Handler {
    protected Handler next;

    Handler setNext(Handler handler) {
        this.next = handler;
        return handler; // enables chaining
    }

    String handle(String request, java.util.Map<String, String> headers) {
        if (next != null) return next.handle(request, headers);
        return null;
    }
}

class AuthHandler extends Handler {
    String handle(String request, java.util.Map<String, String> headers) {
        if (!headers.containsKey("authorization")) {
            return "401 Unauthorized";
        }
        System.out.println("Auth: token verified");
        return super.handle(request, headers);
    }
}

class RateLimitHandler extends Handler {
    private final java.util.Map<String, Integer> counts = new java.util.HashMap<>();
    String handle(String request, java.util.Map<String, String> headers) {
        int count = counts.merge("default", 1, Integer::sum);
        if (count > 100) return "429 Too Many Requests";
        System.out.println("RateLimit: " + count + "/100");
        return super.handle(request, headers);
    }
}

class LoggingHandler extends Handler {
    String handle(String request, java.util.Map<String, String> headers) {
        System.out.println("Log: " + request);
        return super.handle(request, headers);
    }
}

// Usage
public class ChainDemo {
    public static void main(String[] args) {
        Handler auth = new AuthHandler();
        auth.setNext(new RateLimitHandler()).setNext(new LoggingHandler());

        var headers = java.util.Map.of("authorization", "Bearer token123");
        String result = auth.handle("/api/users", new java.util.HashMap<>(headers));
        System.out.println(result != null ? result : "200 OK");
    }
}`,

  memento: `// Memento — capture and restore object state
import java.util.ArrayDeque;
import java.util.Deque;

class Memento {
    private final String state;
    Memento(String state) { this.state = state; }
    String getState() { return state; }
}

class Originator {
    private String state;
    Originator(String state) { this.state = state; }
    void setState(String s) { this.state = s; }
    String getState() { return state; }
    Memento save() { return new Memento(state); }
    void restore(Memento m) { this.state = m.getState(); }
}

class Caretaker {
    private final Deque<Memento> history = new ArrayDeque<>();
    private final Originator originator;
    Caretaker(Originator o) { this.originator = o; }
    void backup() { history.push(originator.save()); }
    void undo() {
        Memento m = history.poll();
        if (m != null) originator.restore(m);
    }
}

// Usage
public class MementoDemo {
    public static void main(String[] args) {
        Originator editor = new Originator("Hello");
        Caretaker history = new Caretaker(editor);

        history.backup();
        editor.setState("Hello World");
        history.backup();
        editor.setState("Hello World!!!");

        System.out.println(editor.getState()); // Hello World!!!
        history.undo();
        System.out.println(editor.getState()); // Hello World
        history.undo();
        System.out.println(editor.getState()); // Hello
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

class User {
    final String id, name, email;
    User(String id, String name, String email) {
        this.id = id; this.name = name; this.email = email;
    }
    public String toString() { return "User(" + name + ")"; }
}

class InMemoryUserRepository implements Repository<User> {
    private final Map<String, User> store = new LinkedHashMap<>();
    public User findById(String id) { return store.get(id); }
    public List<User> findAll()     { return new ArrayList<>(store.values()); }
    public void save(User user)     { store.put(user.id, user); }
    public void delete(String id)   { store.remove(id); }
}

// Usage — business logic is decoupled from storage
public class RepositoryDemo {
    static void createUser(Repository<User> repo, String name) {
        String id = UUID.randomUUID().toString();
        repo.save(new User(id, name, name.toLowerCase() + "@example.com"));
    }
    public static void main(String[] args) {
        Repository<User> repo = new InMemoryUserRepository();
        createUser(repo, "Alice");
        createUser(repo, "Bob");
        System.out.println(repo.findAll()); // [User(Alice), User(Bob)]
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

// Usage
public class CQRSDemo {
    public static void main(String[] args) {
        CommandBus bus = new CommandBus();
        bus.register("CreateOrder", new CreateOrderHandler());
        bus.dispatch(new CreateOrderCommand("ord-1", "cust-1"));
    }
}`,

  "event-sourcing": `// Event Sourcing — store events, derive state by replay
import java.util.*;

abstract class DomainEvent {
    final String id, aggregateId;
    DomainEvent(String id, String aggregateId) {
        this.id = id; this.aggregateId = aggregateId;
    }
}

class MoneyDeposited extends DomainEvent {
    final double amount;
    MoneyDeposited(String id, String aggId, double amount) {
        super(id, aggId); this.amount = amount;
    }
}

class MoneyWithdrawn extends DomainEvent {
    final double amount;
    MoneyWithdrawn(String id, String aggId, double amount) {
        super(id, aggId); this.amount = amount;
    }
}

class EventStore {
    private final List<DomainEvent> events = new ArrayList<>();
    void append(DomainEvent e) { events.add(e); }
    List<DomainEvent> getEvents(String aggregateId) {
        return events.stream().filter(e -> e.aggregateId.equals(aggregateId)).toList();
    }
}

class BankAccount {
    private double balance;
    void apply(DomainEvent event) {
        if (event instanceof MoneyDeposited d)  balance += d.amount;
        if (event instanceof MoneyWithdrawn w)  balance -= w.amount;
    }
    void loadFromHistory(List<DomainEvent> events) {
        events.forEach(this::apply);
    }
    double getBalance() { return balance; }
}

// Usage
public class EventSourcingDemo {
    public static void main(String[] args) {
        EventStore store = new EventStore();
        String accId = "acc-001";
        store.append(new MoneyDeposited("e1", accId, 1000));
        store.append(new MoneyDeposited("e2", accId, 500));
        store.append(new MoneyWithdrawn("e3", accId, 200));

        BankAccount account = new BankAccount();
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

class Thought {
    final String reasoning;
    final String toolName;      // null if final answer
    final Map<String, Object> toolInput;
    final boolean isFinal;
    final String finalAnswer;

    Thought(String reasoning, String toolName, Map<String, Object> input,
            boolean isFinal, String finalAnswer) {
        this.reasoning = reasoning; this.toolName = toolName;
        this.toolInput = input; this.isFinal = isFinal; this.finalAnswer = finalAnswer;
    }
}

interface Tool {
    String name();
    String execute(Map<String, Object> input);
}

class Agent {
    private final Map<String, Tool> tools;
    private final int maxSteps;
    private final List<String> history = new ArrayList<>();

    Agent(Map<String, Tool> tools, int maxSteps) {
        this.tools = tools; this.maxSteps = maxSteps;
    }

    String run(String query) {
        history.clear();
        history.add("User query: " + query);
        for (int i = 0; i < maxSteps; i++) {
            Thought thought = think();
            if (thought.isFinal) return thought.finalAnswer;
            if (thought.toolName != null) {
                Tool tool = tools.get(thought.toolName);
                String observation = (tool != null) ? tool.execute(thought.toolInput) : "Tool not found";
                history.add("Observation: " + observation);
            }
        }
        return "Max steps reached.";
    }

    private Thought think() {
        // Placeholder: in production, call an LLM with history
        return new Thought("Done", null, null, true, "42");
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

// Usage
public class ToolUseDemo {
    public static void main(String[] args) {
        ToolRegistry registry = new ToolRegistry();
        registry.register(new CalculatorTool());
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
        System.out.println(orch.run("Build a REST API"));
    }
}`,

};
