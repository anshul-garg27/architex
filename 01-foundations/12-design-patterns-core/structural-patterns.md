# Structural Design Patterns -- Complete Interview Guide

Structural patterns deal with **class and object composition**. They use inheritance and
composition to form larger structures while keeping them flexible and efficient.

> **Interview Insight**: Adapter, Decorator, and Proxy appear in nearly every LLD round.
> Facade is the most naturally used in real codebases. Know all seven.

---

## 1. Adapter Pattern

### What
Converts the interface of a class into another interface that the client expects.
Adapter lets classes work together that could not otherwise because of incompatible interfaces.

Also known as: **Wrapper**.

### When to Use
- Integrating legacy code with a new system
- Third-party library has a different interface than your code expects
- You want to create a reusable class that cooperates with unrelated classes

### Structure

```
+-----------+      +------------+      +-----------------+
|  Client   |----->|  Target    |      |  Adaptee        |
+-----------+      | (interface)|      | (incompatible)  |
                   +------------+      +-----------------+
                   | + request()|      | + specificReq() |
                   +------------+      +-----------------+
                        ^                      ^
                        |                      |
                   +----------------------------+
                   |       Adapter              |
                   +----------------------------+
                   | - adaptee: Adaptee         |
                   | + request()                |
                   |   --> adaptee.specificReq()|
                   +----------------------------+
```

### Implementation -- XML to JSON Adapter

```java
// Existing system produces XML (Adaptee)
public class XmlDataSource {
    public String fetchXml() {
        return "<user><name>Alice</name><age>30</age></user>";
    }
}

// New system expects JSON (Target interface)
public interface JsonDataSource {
    String fetchJson();
}

// Adapter converts XML to JSON
public class XmlToJsonAdapter implements JsonDataSource {
    private final XmlDataSource xmlSource;

    public XmlToJsonAdapter(XmlDataSource xmlSource) {
        this.xmlSource = xmlSource;
    }

    @Override
    public String fetchJson() {
        String xml = xmlSource.fetchXml();
        // Convert XML to JSON (simplified)
        JSONObject json = XML.toJSONObject(xml);
        return json.toString();
    }
}

// Client code -- only knows about JsonDataSource
public class AnalyticsEngine {
    private final JsonDataSource dataSource;

    public AnalyticsEngine(JsonDataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void processData() {
        String json = dataSource.fetchJson();
        // process JSON data...
    }
}

// Wiring -- legacy XML system works with new JSON-based analytics
XmlDataSource legacy = new XmlDataSource();
JsonDataSource adapted = new XmlToJsonAdapter(legacy);
AnalyticsEngine engine = new AnalyticsEngine(adapted);
engine.processData();
```

### Legacy Payment Integration Example

```java
// Old payment system
public class LegacyPaymentProcessor {
    public void makePayment(String cardNum, double amt, String curr) {
        System.out.println("Processing $" + amt + " via legacy system");
    }
}

// New interface expected by the application
public interface PaymentProcessor {
    void pay(PaymentRequest request);
}

// Adapter
public class LegacyPaymentAdapter implements PaymentProcessor {
    private final LegacyPaymentProcessor legacy;

    public LegacyPaymentAdapter(LegacyPaymentProcessor legacy) {
        this.legacy = legacy;
    }

    @Override
    public void pay(PaymentRequest request) {
        legacy.makePayment(
            request.getCardNumber(),
            request.getAmount(),
            request.getCurrency()
        );
    }
}
```

### Real-World Examples
- `Arrays.asList()` -- adapts array to List interface
- `InputStreamReader` -- adapts InputStream (bytes) to Reader (chars)
- JDBC drivers -- adapt database-specific protocols to JDBC interface

---

## 2. Bridge Pattern

### What
Decouples an **abstraction** from its **implementation** so that the two can vary
independently. Instead of one monolithic hierarchy, you split it into two: the
abstraction hierarchy and the implementation hierarchy.

### When to Use
- You have a "matrix" of combinations (e.g., 3 shapes x 3 colors = 9 classes without Bridge)
- You want to switch implementations at runtime
- Both the abstraction and implementation should be extensible through subclassing

### Structure

```
+--------------------+          +---------------------+
|   Abstraction      |--------->|  Implementation     |
+--------------------+  has-a   | (interface)         |
| - impl: Impl       |         +---------------------+
| + operation()       |         | + operationImpl()   |
+--------------------+          +---------------------+
        ^                               ^        ^
        |                               |        |
+----------------+              +----------+ +----------+
| RefinedAbstr   |              | ImplA    | | ImplB    |
+----------------+              +----------+ +----------+
```

### Implementation -- Remote Control + Device

```java
// Implementation hierarchy -- devices
public interface Device {
    void powerOn();
    void powerOff();
    void setVolume(int percent);
    int getVolume();
    boolean isOn();
}

public class TV implements Device {
    private boolean on = false;
    private int volume = 50;

    public void powerOn()              { on = true; }
    public void powerOff()             { on = false; }
    public void setVolume(int percent) { volume = Math.min(100, Math.max(0, percent)); }
    public int getVolume()             { return volume; }
    public boolean isOn()              { return on; }
}

public class Radio implements Device {
    private boolean on = false;
    private int volume = 30;

    public void powerOn()              { on = true; }
    public void powerOff()             { on = false; }
    public void setVolume(int percent) { volume = Math.min(100, Math.max(0, percent)); }
    public int getVolume()             { return volume; }
    public boolean isOn()              { return on; }
}

// Abstraction hierarchy -- remotes
public class BasicRemote {
    protected Device device;  // BRIDGE to implementation

    public BasicRemote(Device device) {
        this.device = device;
    }

    public void togglePower() {
        if (device.isOn()) device.powerOff();
        else device.powerOn();
    }

    public void volumeUp() {
        device.setVolume(device.getVolume() + 10);
    }

    public void volumeDown() {
        device.setVolume(device.getVolume() - 10);
    }
}

public class AdvancedRemote extends BasicRemote {
    public AdvancedRemote(Device device) {
        super(device);
    }

    public void mute() {
        device.setVolume(0);
    }
}

// Usage -- any remote works with any device
Device tv = new TV();
BasicRemote remote = new BasicRemote(tv);
remote.togglePower();  // TV turns on
remote.volumeUp();     // TV volume: 60

Device radio = new Radio();
AdvancedRemote advRemote = new AdvancedRemote(radio);
advRemote.mute();      // Radio muted
```

### Without Bridge: Class Explosion

```
Without Bridge (inheritance):         With Bridge (composition):
  Remote                                Remote ---> Device
   |-- TVBasicRemote                     |-- BasicRemote    |-- TV
   |-- TVAdvancedRemote                  |-- AdvancedRemote |-- Radio
   |-- RadioBasicRemote                                     |-- Speaker
   |-- RadioAdvancedRemote
   |-- SpeakerBasicRemote               5 classes instead of 6+
   |-- SpeakerAdvancedRemote            (and scales linearly, not multiplicatively)
```

---

## 3. Composite Pattern

### What
Composes objects into **tree structures** to represent part-whole hierarchies.
Composite lets clients treat individual objects and compositions of objects **uniformly**.

### When to Use
- You need to represent a tree structure (file system, org chart, UI widget tree)
- You want clients to ignore the difference between leaf and composite nodes
- You want to apply operations recursively across the tree

### Structure

```
+-------------------+
|    Component      |
+-------------------+
| + operation()     |
| + add(Component)  |
| + remove(Component)|
| + getChild(i)     |
+-------------------+
      ^         ^
      |         |
+--------+  +-----------+
|  Leaf  |  | Composite |
+--------+  +-----------+
| + op() |  | -children |
+--------+  | + op()    |  <-- iterates over children, calls op() on each
            | + add()   |
            | + remove()|
            +-----------+
```

### Implementation -- File System

```java
// Component
public interface FileSystemEntry {
    String getName();
    long getSize();
    void display(String indent);
}

// Leaf
public class File implements FileSystemEntry {
    private final String name;
    private final long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    public String getName()  { return name; }
    public long getSize()    { return size; }

    public void display(String indent) {
        System.out.println(indent + "File: " + name + " (" + size + " bytes)");
    }
}

// Composite
public class Directory implements FileSystemEntry {
    private final String name;
    private final List<FileSystemEntry> children = new ArrayList<>();

    public Directory(String name) {
        this.name = name;
    }

    public void add(FileSystemEntry entry)    { children.add(entry); }
    public void remove(FileSystemEntry entry) { children.remove(entry); }

    public String getName() { return name; }

    public long getSize() {
        // Recursively sums all children's sizes
        return children.stream()
            .mapToLong(FileSystemEntry::getSize)
            .sum();
    }

    public void display(String indent) {
        System.out.println(indent + "Dir: " + name + " (" + getSize() + " bytes)");
        for (FileSystemEntry child : children) {
            child.display(indent + "  ");
        }
    }
}

// Usage
Directory root = new Directory("root");
Directory src  = new Directory("src");
src.add(new File("Main.java", 2048));
src.add(new File("Utils.java", 1024));
root.add(src);
root.add(new File("README.md", 512));

root.display("");
// Dir: root (3584 bytes)
//   Dir: src (3072 bytes)
//     File: Main.java (2048 bytes)
//     File: Utils.java (1024 bytes)
//   File: README.md (512 bytes)
```

### Real-World Examples
- Java Swing/AWT: `Component` (leaf) vs `Container` (composite)
- React: component tree with nested children
- Organization hierarchy: Employee (leaf) vs Department (composite)

---

## 4. Decorator Pattern

### What
Attaches additional responsibilities to an object **dynamically**. Decorators provide a
flexible alternative to subclassing for extending functionality.

Also known as: **Wrapper** (same as Adapter, but different intent).

### When to Use
- You need to add behavior to individual objects at runtime, not the whole class
- Extension by subclassing is impractical (too many combinations)
- You want to stack behaviors (like Java I/O streams)

### Structure

```
+-------------------+
|    Component      |
+-------------------+
| + operation()     |
+-------------------+
      ^         ^
      |         |
+--------+  +-------------------+
| Concr  |  |   Decorator       |
| Comp   |  +-------------------+
+--------+  | - wrapped: Comp   |
            | + operation()     |
            +-------------------+
                 ^         ^
                 |         |
          DecoratorA    DecoratorB
```

### Implementation -- Coffee Shop Toppings

```java
// Component
public interface Coffee {
    double getCost();
    String getDescription();
}

// Concrete component
public class SimpleCoffee implements Coffee {
    public double getCost()          { return 2.00; }
    public String getDescription()   { return "Simple coffee"; }
}

// Base decorator
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee wrapped;

    public CoffeeDecorator(Coffee coffee) {
        this.wrapped = coffee;
    }
}

// Concrete decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }

    public double getCost()        { return wrapped.getCost() + 0.50; }
    public String getDescription() { return wrapped.getDescription() + ", milk"; }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }

    public double getCost()        { return wrapped.getCost() + 0.25; }
    public String getDescription() { return wrapped.getDescription() + ", sugar"; }
}

public class WhipCreamDecorator extends CoffeeDecorator {
    public WhipCreamDecorator(Coffee coffee) { super(coffee); }

    public double getCost()        { return wrapped.getCost() + 0.75; }
    public String getDescription() { return wrapped.getDescription() + ", whip cream"; }
}

// Usage -- stack decorators dynamically
Coffee order = new SimpleCoffee();                     // $2.00
order = new MilkDecorator(order);                      // $2.50
order = new SugarDecorator(order);                     // $2.75
order = new WhipCreamDecorator(order);                 // $3.50

System.out.println(order.getDescription());  // Simple coffee, milk, sugar, whip cream
System.out.println("$" + order.getCost());   // $3.50
```

### Java I/O Streams -- Classic Decorator Example

```java
// Each layer wraps the previous one, adding behavior:
InputStream in = new FileInputStream("data.txt");            // raw bytes
InputStream buffered = new BufferedInputStream(in);           // + buffering
InputStream gzip = new GZIPInputStream(buffered);            // + decompression
Reader reader = new InputStreamReader(gzip, "UTF-8");        // + char decoding
BufferedReader br = new BufferedReader(reader);               // + line reading

String line = br.readLine();  // all layers work together
```

### Decorator vs Inheritance

| Decorator | Inheritance |
|-----------|------------|
| Add behavior at runtime | Add behavior at compile time |
| Stack multiple behaviors | Combinatorial explosion of subclasses |
| Same interface as original | May change the interface |
| More flexible, more objects | Simpler when few extensions needed |

---

## 5. Facade Pattern

### What
Provides a **simplified interface** to a complex subsystem. Facade does not add new
functionality -- it just makes the subsystem easier to use.

### When to Use
- Complex subsystem with many classes that clients must interact with
- You want to provide a simple entry point for common use cases
- You want to layer your subsystem and define entry points to each level

### Structure

```
                  +------------------+
  Client -------->|    Facade        |
                  +------------------+
                  | + simpleMethod() |
                  +------------------+
                    |       |       |
              +-----+   +--+--+  +-----+
              | SubA |   |SubB |  |SubC |
              +------+   +-----+  +-----+
              |complexA| |cplxB|  |cplxC|
              +------+   +-----+  +-----+
```

### Implementation -- Home Theater

```java
// Complex subsystem classes
public class Amplifier {
    public void on()              { System.out.println("Amp on"); }
    public void setVolume(int v)  { System.out.println("Volume: " + v); }
    public void off()             { System.out.println("Amp off"); }
}

public class DVDPlayer {
    public void on()              { System.out.println("DVD on"); }
    public void play(String movie){ System.out.println("Playing: " + movie); }
    public void stop()            { System.out.println("DVD stopped"); }
    public void off()             { System.out.println("DVD off"); }
}

public class Projector {
    public void on()              { System.out.println("Projector on"); }
    public void setWidescreen()   { System.out.println("Widescreen mode"); }
    public void off()             { System.out.println("Projector off"); }
}

public class Lights {
    public void dim(int level)    { System.out.println("Lights dimmed to " + level + "%"); }
    public void on()              { System.out.println("Lights on"); }
}

// FACADE -- one simple method orchestrates 4 subsystems
public class HomeTheaterFacade {
    private final Amplifier amp;
    private final DVDPlayer dvd;
    private final Projector projector;
    private final Lights lights;

    public HomeTheaterFacade(Amplifier amp, DVDPlayer dvd,
                             Projector projector, Lights lights) {
        this.amp       = amp;
        this.dvd       = dvd;
        this.projector = projector;
        this.lights    = lights;
    }

    // Simple API for a complex workflow
    public void watchMovie(String movie) {
        System.out.println("--- Setting up movie ---");
        lights.dim(10);
        projector.on();
        projector.setWidescreen();
        amp.on();
        amp.setVolume(7);
        dvd.on();
        dvd.play(movie);
    }

    public void endMovie() {
        System.out.println("--- Shutting down ---");
        dvd.stop();
        dvd.off();
        amp.off();
        projector.off();
        lights.on();
    }
}

// Client -- blissfully simple
HomeTheaterFacade theater = new HomeTheaterFacade(amp, dvd, projector, lights);
theater.watchMovie("Inception");
// ...
theater.endMovie();
```

### Real-World Examples
- `javax.faces.context.FacesContext` -- facade for JSF lifecycle
- SLF4J -- facade for various logging frameworks
- Spring's `JdbcTemplate` -- facade for raw JDBC
- Any SDK client (AWS SDK, Stripe SDK) is a facade over HTTP APIs

---

## 6. Flyweight Pattern

### What
Uses sharing to support **large numbers of fine-grained objects** efficiently by
separating **intrinsic** (shared) state from **extrinsic** (unique) state.

### When to Use
- Application uses a large number of similar objects
- Memory is a constraint
- Most object state can be made extrinsic (passed in from outside)
- Many groups of objects can be replaced by fewer shared objects

### Key Concepts

```
Intrinsic State (SHARED):                 Extrinsic State (UNIQUE):
  - Stored inside the flyweight            - Stored/computed by client
  - Same across all contexts               - Different per context
  - Immutable                              - Passed to flyweight methods

Example -- Text Editor:
  Intrinsic: font family, glyph bitmap     Extrinsic: position, color
```

### Structure

```
+-------------------+      +----------------------+
|  FlyweightFactory |----->|    Flyweight          |
+-------------------+      +----------------------+
| - cache: Map      |      | + operation(exState) |
| + get(key): FW    |      +----------------------+
+-------------------+             ^
                                  |
                          +------------------+
                          | ConcreteFlyweight|
                          +------------------+
                          | - intrinsicState |
                          | + operation()    |
                          +------------------+
```

### Implementation -- Game Tile Rendering

```java
// Flyweight -- shared tile type data
public class TileType {
    private final String terrain;    // intrinsic: "grass", "water", "mountain"
    private final String texture;    // intrinsic: path to texture file
    private final boolean walkable;  // intrinsic

    public TileType(String terrain, String texture, boolean walkable) {
        this.terrain  = terrain;
        this.texture  = texture;
        this.walkable = walkable;
        // Imagine this also loads a 2MB texture into memory
        System.out.println("Loading texture for: " + terrain);
    }

    // Extrinsic state (x, y) passed as parameters
    public void render(int x, int y) {
        System.out.printf("Render %s at (%d, %d)%n", terrain, x, y);
    }

    public boolean isWalkable() { return walkable; }
}

// Flyweight Factory -- caches and reuses tile types
public class TileTypeFactory {
    private static final Map<String, TileType> cache = new HashMap<>();

    public static TileType get(String terrain) {
        return cache.computeIfAbsent(terrain, key -> {
            return switch (key) {
                case "grass"    -> new TileType("grass", "/tex/grass.png", true);
                case "water"    -> new TileType("water", "/tex/water.png", false);
                case "mountain" -> new TileType("mountain", "/tex/mountain.png", false);
                default -> throw new IllegalArgumentException("Unknown: " + key);
            };
        });
    }

    public static int getCacheSize() { return cache.size(); }
}

// Game map -- 1 million tiles but only 3 TileType objects in memory
public class GameMap {
    private final TileType[][] tiles;
    private final int width, height;

    public GameMap(int width, int height) {
        this.width  = width;
        this.height = height;
        this.tiles  = new TileType[width][height];
    }

    public void setTile(int x, int y, String terrain) {
        tiles[x][y] = TileTypeFactory.get(terrain);  // shared flyweight
    }

    public void render() {
        for (int x = 0; x < width; x++) {
            for (int y = 0; y < height; y++) {
                tiles[x][y].render(x, y);  // extrinsic state passed in
            }
        }
    }
}

// Usage -- 1000x1000 = 1 million tiles, but only 3 TileType objects
GameMap map = new GameMap(1000, 1000);
for (int x = 0; x < 1000; x++) {
    for (int y = 0; y < 1000; y++) {
        String terrain = (x + y) % 3 == 0 ? "water" :
                         (x + y) % 3 == 1 ? "grass" : "mountain";
        map.setTile(x, y, terrain);
    }
}
System.out.println("Unique tile types: " + TileTypeFactory.getCacheSize());  // 3
```

### Memory Savings Calculation

```
Without Flyweight:
  1,000,000 tiles x 2MB texture each = 2 TB memory (impossible)

With Flyweight:
  3 TileType objects x 2MB = 6 MB (shared textures)
  1,000,000 tile references x 8 bytes = 8 MB (pointers)
  Total: ~14 MB
```

### Real-World Examples
- `String.intern()` -- Java String pool is a flyweight
- `Integer.valueOf()` -- caches -128 to 127
- `Boolean.valueOf()` -- only 2 instances ever

---

## 7. Proxy Pattern

### What
Provides a **surrogate or placeholder** for another object to control access to it.
The proxy has the same interface as the real object.

### When to Use
- Lazy initialization (Virtual Proxy) -- delay expensive creation until needed
- Access control (Protection Proxy) -- check permissions before delegating
- Caching (Caching Proxy) -- store results of expensive operations
- Logging/monitoring -- track calls to the real object
- Remote access (Remote Proxy) -- represent an object in a different address space

### Structure

```
+-----------+      +------------------+
|  Client   |----->|  Subject         |
+-----------+      | (interface)      |
                   +------------------+
                   | + request()      |
                   +------------------+
                        ^         ^
                        |         |
               +----------+  +----------+
               |RealSubject|  |  Proxy   |
               +----------+  +----------+
               | + request()|  | - real   |
               +----------+  | + request()|
                              +----------+
                              checks/logs/caches
                              then delegates to real
```

### Implementation -- Virtual Proxy (Lazy Loading)

```java
public interface Image {
    void display();
    int getWidth();
    int getHeight();
}

// Expensive object -- loads from disk/network
public class HighResImage implements Image {
    private final String filename;
    private byte[] data;

    public HighResImage(String filename) {
        this.filename = filename;
        loadFromDisk();  // EXPENSIVE -- takes 3 seconds
    }

    private void loadFromDisk() {
        System.out.println("Loading image: " + filename + " (3 sec)...");
        // Simulate expensive I/O
        this.data = new byte[10_000_000]; // 10 MB
    }

    public void display()   { System.out.println("Displaying: " + filename); }
    public int getWidth()   { return 1920; }
    public int getHeight()  { return 1080; }
}

// Virtual Proxy -- delays loading until display() is called
public class ImageProxy implements Image {
    private final String filename;
    private HighResImage realImage;  // created on demand

    public ImageProxy(String filename) {
        this.filename = filename;
        // NO loading happens here -- fast construction
    }

    private HighResImage getRealImage() {
        if (realImage == null) {
            realImage = new HighResImage(filename);  // load only when needed
        }
        return realImage;
    }

    public void display()   { getRealImage().display(); }
    public int getWidth()   { return 1920; }  // known without loading
    public int getHeight()  { return 1080; }  // known without loading
}

// Client -- creates 100 proxies instantly, loads only when displayed
List<Image> gallery = new ArrayList<>();
for (int i = 0; i < 100; i++) {
    gallery.add(new ImageProxy("photo_" + i + ".jpg"));  // instant
}
gallery.get(42).display();  // only THIS image loads
```

### Protection Proxy (Access Control)

```java
public interface UserDocument {
    void read();
    void modify(String content);
    void delete();
}

public class RealDocument implements UserDocument {
    private String content;

    public void read()               { System.out.println("Content: " + content); }
    public void modify(String content){ this.content = content; }
    public void delete()             { this.content = null; }
}

public class ProtectedDocument implements UserDocument {
    private final RealDocument target;
    private final User currentUser;

    public ProtectedDocument(RealDocument target, User currentUser) {
        this.target      = target;
        this.currentUser = currentUser;
    }

    public void read() {
        if (currentUser.hasPermission("READ")) {
            target.read();
        } else {
            throw new SecurityException("No READ permission");
        }
    }

    public void modify(String content) {
        if (currentUser.hasPermission("WRITE")) {
            target.modify(content);
        } else {
            throw new SecurityException("No WRITE permission");
        }
    }

    public void delete() {
        if (currentUser.hasRole("ADMIN")) {
            target.delete();
        } else {
            throw new SecurityException("Only ADMIN can delete");
        }
    }
}
```

### Caching Proxy

```java
public interface WeatherService {
    WeatherData getWeather(String city);
}

public class RealWeatherService implements WeatherService {
    public WeatherData getWeather(String city) {
        // Expensive API call to external weather service
        return callExternalAPI(city);
    }
}

public class CachingWeatherProxy implements WeatherService {
    private final RealWeatherService realService;
    private final Map<String, CachedEntry> cache = new ConcurrentHashMap<>();
    private static final long TTL_MS = 300_000; // 5 minutes

    public CachingWeatherProxy(RealWeatherService realService) {
        this.realService = realService;
    }

    @Override
    public WeatherData getWeather(String city) {
        CachedEntry entry = cache.get(city);
        if (entry != null && !entry.isExpired()) {
            System.out.println("Cache HIT for: " + city);
            return entry.getData();
        }

        System.out.println("Cache MISS for: " + city);
        WeatherData fresh = realService.getWeather(city);
        cache.put(city, new CachedEntry(fresh, System.currentTimeMillis() + TTL_MS));
        return fresh;
    }
}
```

### Proxy vs Decorator vs Adapter

| Pattern | Intent | Interface | Relationship |
|---------|--------|-----------|-------------|
| **Proxy** | Control access | Same as real | Manages lifecycle of real object |
| **Decorator** | Add behavior | Same as wrapped | Enhances existing behavior |
| **Adapter** | Convert interface | Different from adaptee | Translates between interfaces |

---

## Structural Patterns -- Quick Reference Table

| Pattern | Intent | Key Clue in Problem |
|---------|--------|-------------------|
| Adapter | Convert incompatible interface | "legacy", "third-party", "wrap" |
| Bridge | Decouple abstraction from impl | "platform x feature matrix", "varies in 2 dimensions" |
| Composite | Tree structures, uniform treatment | "hierarchy", "tree", "part-whole" |
| Decorator | Add responsibilities dynamically | "stack behaviors", "toppings", "layers" |
| Facade | Simplified interface | "simplify", "one method does many things" |
| Flyweight | Share fine-grained objects | "millions of objects", "memory", "cache instances" |
| Proxy | Surrogate/placeholder | "lazy load", "access control", "cache", "log" |

---

## Interview Power Moves

1. **Adapter in legacy migration**: "We adapt the old payment API to our new interface
   so the rest of the system never knows it is talking to legacy code."

2. **Decorator for feature stacking**: "Each pricing feature (holiday discount, loyalty
   bonus, coupon) is a decorator wrapping the base price calculator."

3. **Proxy + Singleton combo**: "The connection pool is a singleton, and each connection
   object is a proxy that handles logging and automatic return-to-pool on close."

4. **Composite in LLD**: "The file system in any LLD is always Composite -- File is a
   leaf, Directory is a composite. Same for organization hierarchies."

5. **Flyweight for scale**: "If the interviewer says 'billions of events' or 'millions
   of tiles', Flyweight is the answer for memory efficiency."
