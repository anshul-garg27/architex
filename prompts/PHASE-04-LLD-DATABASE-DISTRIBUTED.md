# PHASE 4: LOW-LEVEL DESIGN STUDIO, DATABASE LAB & DISTRIBUTED SYSTEMS PLAYGROUND

> **Goal:** Three integrated modules. LLD Studio for class diagrams, sequence diagrams, state machines, design patterns, SOLID, and code generation. Database Lab for ER diagrams, normalization, query plans, index visualization, and transaction isolation. Distributed Systems Playground for consensus protocols, consistent hashing, vector clocks, CAP theorem, CRDTs, and more -- all interactive with animated message-passing.

> **Prerequisite:** Phase 1 complete. Phase 2/3 NOT required.

---

## MODULE A: LOW-LEVEL DESIGN STUDIO

### Class Diagram Builder

A drag-and-drop UML class diagram editor on the React Flow canvas.

**Class Node**

```typescript
export interface ClassNodeData {
  name: string;
  stereotype?: string;             // "<<interface>>", "<<abstract>>", "<<enum>>", "<<singleton>>"
  namespace?: string;              // "com.example.models"
  isAbstract: boolean;
  isInterface: boolean;
  genericParams?: string[];        // ["T", "K extends Comparable"]
  attributes: ClassAttribute[];
  methods: ClassMethod[];
  collapsed: boolean;              // hide attributes/methods section
}

export interface ClassAttribute {
  id: string;
  visibility: "+" | "-" | "#" | "~";   // public, private, protected, package
  name: string;
  type: string;
  isStatic: boolean;
  isFinal: boolean;
  defaultValue?: string;
  annotation?: string;             // "@NotNull", "@Id", etc.
}

export interface ClassMethod {
  id: string;
  visibility: "+" | "-" | "#" | "~";
  name: string;
  returnType: string;
  parameters: Array<{ name: string; type: string }>;
  isStatic: boolean;
  isAbstract: boolean;
  isConstructor: boolean;
  annotation?: string;
}
```

Class node renders as a 3-section UML box:

```
┌──────────────────────────┐
│    <<interface>>         │  ← stereotype (italic, centered)
│      IRepository         │  ← class name (bold, centered)
├──────────────────────────┤
│ - id: string             │  ← attributes section
│ + name: string           │
│ # createdAt: Date        │
├──────────────────────────┤
│ + findById(id): T        │  ← methods section
│ + save(entity: T): void  │
│ + delete(id): void       │
└──────────────────────────┘
```

Visibility icons: `+` green circle, `-` red square, `#` yellow diamond, `~` blue triangle.
Abstract classes: name in italic. Interfaces: `<<interface>>` stereotype above name.
Static members: underlined. Abstract methods: italic.

**Relationship Edges**

| Type | Line Style | Arrow | Label Position | Meaning |
|---|---|---|---|---|
| Inheritance | solid | hollow triangle | none | "extends" / "is-a" |
| Realization | dashed | hollow triangle | none | "implements" |
| Composition | solid | filled diamond (source) | multiplicity | "has-a" (strong, lifecycle) |
| Aggregation | solid | hollow diamond (source) | multiplicity | "has-a" (weak, shared) |
| Association | solid | open arrow | role name, multiplicity | "uses" |
| Dependency | dashed | open arrow | `<<use>>` | "depends on" |

Cardinality labels: `1`, `0..1`, `*`, `1..*`, `0..*`, `n..m` -- editable on each end of the edge.

Role names: optional text labels on each end of association edges.

**Interaction**: Double-click class to edit inline. Right-click for context menu (add attribute, add method, add relationship, duplicate, delete). Drag from class border to another class to create relationship (popup to select type).

### Sequence Diagrams

A vertical timeline-based editor.

```typescript
export interface SequenceDiagramData {
  participants: Participant[];
  messages: SequenceMessage[];
  fragments: CombinedFragment[];
  notes: SequenceNote[];
}

export interface Participant {
  id: string;
  name: string;
  type: "actor" | "object" | "boundary" | "control" | "entity" | "database" | "queue";
  lifeline: boolean;              // show dashed vertical line
  destroyed: boolean;             // X at bottom of lifeline
}

export interface SequenceMessage {
  id: string;
  from: string;                   // participant id
  to: string;                     // participant id (same = self-call)
  label: string;
  type: "sync" | "async" | "return" | "create" | "destroy";
  lineStyle: "solid" | "dashed";  // solid=call, dashed=return
  arrowStyle: "filled" | "open" | "half"; // filled=sync, open=async, half=return
  activationBar: boolean;         // show activation rectangle on target
  sequenceNumber?: number;        // optional numbering
}

export interface CombinedFragment {
  id: string;
  type: "alt" | "opt" | "loop" | "par" | "break" | "critical" | "neg" | "ref";
  guard: string;                  // condition text: "[balance > 0]"
  operands: Array<{              // for alt: multiple operands with guards
    guard: string;
    messageIds: string[];
  }>;
  bounds: { startY: number; endY: number };  // vertical extent
}

export interface SequenceNote {
  id: string;
  text: string;
  attachedTo: string;            // participant id or message id
  position: "left" | "right" | "over";
}
```

Visual: Participants as boxes along top. Vertical dashed lifelines. Messages as horizontal arrows between lifelines. Activation bars as narrow rectangles on lifeline during processing. Combined fragments as labeled rounded rectangles encompassing message groups.

Self-calls: arrow loops from participant to itself with activation bar stacking.

Animation mode: messages animate one at a time (arrow draws left-to-right, activation bar appears, return draws right-to-left).

### State Machine Diagrams

```typescript
export interface StateMachineData {
  states: StateNode[];
  transitions: StateTransition[];
  initialStateId: string;
  finalStateIds: string[];
}

export interface StateNode {
  id: string;
  name: string;
  type: "simple" | "composite" | "submachine" | "initial" | "final" | "choice" | "fork" | "join" | "history" | "deep-history";
  entryAction?: string;          // "entry / startTimer()"
  exitAction?: string;           // "exit / stopTimer()"
  doActivity?: string;           // "do / processQueue()"
  internalTransitions?: Array<{ trigger: string; action: string }>;
  childStates?: StateNode[];     // for composite states
  region?: string;               // for orthogonal regions in composite states
}

export interface StateTransition {
  id: string;
  source: string;
  target: string;
  trigger: string;               // event name: "orderPlaced"
  guard?: string;                // "[balance > 0]"
  action?: string;               // "/ deductBalance()"
  label: string;                 // computed: "trigger [guard] / action"
}
```

Visual: States as rounded rectangles with compartments for name, entry/exit/do. Initial state: filled black circle. Final state: bullseye (circle in circle). Choice: diamond. Fork/Join: thick horizontal bar. History: circle with "H" or "H*". Composite state: large rounded rectangle containing child states.

Transitions: arrows with labels "event [guard] / action".

Interactive simulation: Click "Simulate" to enter a state. Click events to trigger transitions. Current state highlighted. Invalid events grayed out.

### Design Patterns (23 GoF + 10 Modern = 33 Total)

```typescript
export interface DesignPatternDefinition {
  id: string;
  name: string;
  category: "creational" | "structural" | "behavioral" | "modern";
  intent: string;                // one-sentence purpose
  problem: string;               // what problem it solves
  solution: string;              // how it solves it
  structure: {                   // pre-built class diagram
    nodes: ClassNodeData[];
    edges: RelationshipEdge[];
  };
  codeExamples: {
    typescript: string;
    python: string;
    java: string;
  };
  beforeAfter: {
    before: string;              // code without pattern (the problem)
    after: string;               // code with pattern (the solution)
  };
  realWorldExamples: string[];   // "React Context API uses Observer"
  relatedPatterns: string[];     // other pattern IDs
  interactiveDemo: {
    description: string;
    steps: AnimationStep[];      // reuse from Phase 3
  };
}
```

**Creational (5)**
1. **Singleton** -- Single instance with lazy initialization. Show global access point, thread-safety (double-check locking). Real-world: Database connection pool, Logger. Class diagram: Singleton class with private constructor, static instance, static getInstance().

2. **Factory Method** -- Define interface for creating objects, let subclasses decide. Show creator hierarchy, product hierarchy. Real-world: React.createElement, Document parsers.

3. **Abstract Factory** -- Family of related objects without specifying concrete classes. Show two product families (e.g., dark/light UI themes). Real-world: Cross-platform UI toolkit.

4. **Builder** -- Construct complex objects step by step. Show director, builder interface, concrete builders. Real-world: SQL query builders, StringBuilder.

5. **Prototype** -- Clone existing objects. Show prototype registry, shallow vs deep copy. Real-world: JavaScript Object.create.

**Structural (7)**
6. **Adapter** -- Convert interface of one class to another. Show target, adaptee, adapter. Real-world: API version adapters, power plug converters.

7. **Bridge** -- Decouple abstraction from implementation. Show abstraction + implementor hierarchies. Real-world: Platform-independent rendering, JDBC drivers.

8. **Composite** -- Tree structures of objects. Show component, leaf, composite. Real-world: React component tree, file system.

9. **Decorator** -- Attach additional responsibilities dynamically. Show component, decorator chain wrapping. Real-world: Express middleware, Java I/O streams.

10. **Facade** -- Simplified interface to complex subsystem. Show facade hiding multiple classes. Real-world: jQuery, SDK clients.

11. **Flyweight** -- Share common state among many objects. Show flyweight factory, intrinsic vs extrinsic state. Real-world: String interning, font glyphs.

12. **Proxy** -- Surrogate controlling access. Show real subject, proxy. Variants: virtual, protection, remote, caching. Real-world: Proxy pattern in JavaScript (ES6 Proxy), lazy loading images.

**Behavioral (11)**
13. **Chain of Responsibility** -- Pass request along handler chain. Show handler chain linked list. Real-world: Express middleware chain, DOM event bubbling.

14. **Command** -- Encapsulate request as object. Show invoker, command, receiver. Undo/redo via command stack. Real-world: Redux actions, text editor undo.

15. **Iterator** -- Sequential access without exposing underlying representation. Show iterator interface, concrete iterators for different collections. Real-world: JavaScript Symbol.iterator.

16. **Mediator** -- Reduce direct dependencies between objects via central coordinator. Show colleagues communicating through mediator. Real-world: Chat room, air traffic control.

17. **Memento** -- Capture and restore object state. Show originator, caretaker, memento. Real-world: Undo stacks, game save states.

18. **Observer** -- One-to-many dependency, notify dependents of state change. Show subject, observer interface, concrete observers. Real-world: React state, EventEmitter.

19. **State** -- Alter behavior when internal state changes. Show context delegating to state objects. Real-world: TCP connection states, order status.

20. **Strategy** -- Define family of interchangeable algorithms. Show context, strategy interface, concrete strategies. Real-world: Sorting algorithms, payment processors.

21. **Template Method** -- Define skeleton in base class, let subclasses override steps. Show abstract class with template method calling abstract steps. Real-world: React lifecycle, test frameworks.

22. **Visitor** -- Add operations to objects without modifying them. Show element hierarchy, visitor hierarchy, double dispatch. Real-world: AST walkers, compiler passes.

23. **Interpreter** -- Define grammar and interpreter for a language. Show abstract syntax tree, terminal/nonterminal expressions. Real-world: Regular expressions, SQL parsing.

**Modern Patterns (10)**
24. **Repository** -- Abstraction over data access. Show repository interface, concrete implementations (SQL, MongoDB, in-memory). Domain objects decoupled from persistence.

25. **Unit of Work** -- Track changes to objects during a transaction, coordinate writes. Show change tracker, commit/rollback.

26. **Dependency Injection** -- Invert control of dependency creation. Show DI container, constructor/setter/interface injection. Before/after: tight coupling vs loose coupling.

27. **Event Sourcing** -- Store state as sequence of events, not current state. Show event store, event replay, aggregate reconstruction. Timeline of events producing current state.

28. **CQRS** -- Separate read and write models. Show command side (write model), query side (read model), synchronization. Before: single model handling reads and writes.

29. **Circuit Breaker** -- Prevent cascading failures. Show closed/open/half-open states, failure counter, timeout. State machine animation with request flow.

30. **Saga (Orchestrator + Choreography)** -- Distributed transaction management. Orchestrator: central coordinator sends commands. Choreography: services listen to events. Show compensation on failure.

31. **Outbox Pattern** -- Reliable event publishing alongside database writes. Show transaction writing to outbox table, polling publisher reading outbox, publishing to message broker.

32. **Specification** -- Encapsulate business rules as composable objects. Show ISpecification interface with And/Or/Not combinators. Before: scattered if-statements. After: composable predicates.

33. **Mediator (MediatR-style)** -- Request/handler pattern for CQRS. Show request object, handler, pipeline behaviors (validation, logging, caching). Sequence diagram of request flow through pipeline.

### SOLID Principles Interactive Explorer

Five interactive demos, one per principle:

1. **Single Responsibility (SRP)** -- Before: `UserService` with auth + email + logging. After: Separate `AuthService`, `EmailService`, `LoggingService`. Interactive: drag methods from monolithic class to separate classes, see coupling decrease.

2. **Open/Closed (OCP)** -- Before: switch-case for different shapes. After: Shape interface with polymorphic `area()`. Interactive: add new shape without modifying existing code.

3. **Liskov Substitution (LSP)** -- Before: `Square extends Rectangle` breaks when `setWidth` affects `height`. After: Separate `Shape` abstractions. Interactive: substitute child for parent, run test assertions, see which break.

4. **Interface Segregation (ISP)** -- Before: fat `IWorker` interface with `work()`, `eat()`, `sleep()`. Robot implements `eat()` as no-op. After: `IWorkable`, `IFeedable`, `ISleepable`. Interactive: drag methods to smaller interfaces.

5. **Dependency Inversion (DIP)** -- Before: `OrderService` directly creates `MySQLDatabase`. After: `OrderService` depends on `IDatabase`, injected via constructor. Interactive: swap implementations at runtime, see system still works.

### Bidirectional Code Generation

**Diagram to Code:**
```typescript
// Given a class diagram (ClassNodeData[] + edges), generate:
// TypeScript: classes with decorators, interfaces, type imports
// Python: classes with type hints, ABC for interfaces, dataclasses
// Java: classes with generics, interfaces, annotations

// Example TypeScript output from a class diagram:
export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

export class UserRepository implements IRepository<User> {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async findById(id: string): Promise<User | null> {
    // TODO: implement
    throw new Error("Not implemented");
  }
  // ...
}
```

**Code to Diagram (Tree-sitter parsing):**
```typescript
// Parse source code using Tree-sitter WASM grammar:
// 1. Load tree-sitter and language grammar (TypeScript, Python, or Java)
// 2. Parse source code into AST
// 3. Walk AST to extract:
//    - Class declarations (name, modifiers, generics)
//    - Interface declarations
//    - Attribute declarations (visibility inferred from access modifiers)
//    - Method declarations (name, parameters, return type)
//    - Inheritance (extends, implements)
//    - Composition/aggregation (fields whose type is another class)
//    - Dependencies (method parameters, local variables)
// 4. Generate ClassNodeData[] and relationship edges
// 5. Auto-layout using dagre (hierarchical) or elk.js
//
// Tree-sitter queries for TypeScript:
// (class_declaration name: (type_identifier) @class_name)
// (public_field_definition name: (property_identifier) @attr_name type: (_) @attr_type)
// (method_definition name: (property_identifier) @method_name)
// (heritage_clause (extends_clause (identifier) @parent))
// (heritage_clause (implements_clause (identifier) @interface))
```

### 20 LLD Problems

Each problem includes: requirements description, class diagram template, starter code, test cases, and reference solution.

| # | Problem | Key Classes | Key Patterns | Complexity |
|---|---|---|---|---|
| 1 | Parking Lot | ParkingLot, Level, ParkingSpot, Vehicle, Ticket | Strategy (spot assignment), Observer (occupancy) | Medium |
| 2 | Elevator System | ElevatorController, Elevator, Request, Floor | Strategy (scheduling: FCFS, SSTF, SCAN, LOOK), State (elevator states), Observer | Hard |
| 3 | Chess Game | Board, Piece (King/Queen/Rook/Bishop/Knight/Pawn), Player, Move, GameState | State (game state), Strategy (move validation per piece), Command (moves for undo) | Hard |
| 4 | BookMyShow | Theatre, Screen, Show, Seat, Booking, Payment | Observer (seat availability), Strategy (seat selection), Singleton (booking manager) | Medium |
| 5 | Library Management | Library, Book, Member, Librarian, Reservation, Fine | Observer (due dates), Strategy (fine calculation) | Easy |
| 6 | ATM Machine | ATM, Account, Card, Transaction, CashDispenser | State (ATM states), Chain of Responsibility (cash denomination), Strategy (auth) | Medium |
| 7 | Vending Machine | VendingMachine, Product, Coin, Inventory, State | State (idle/selecting/dispensing/refunding), Strategy (payment) | Medium |
| 8 | Hotel Management | Hotel, Room, Reservation, Guest, HouseKeeping, Invoice | Observer (room status), Strategy (pricing: peak/off-peak/dynamic) | Medium |
| 9 | Restaurant Management | Restaurant, Table, Order, MenuItem, Chef, Waiter, Bill | Observer (order status), Command (order items), Strategy (table assignment) | Medium |
| 10 | Snake & Ladder | Board, Snake, Ladder, Player, Dice, GameEngine | State (player turn), Template Method (game loop) | Easy |
| 11 | Tic-Tac-Toe | Board, Player, Cell, GameEngine, WinChecker | Strategy (AI: minimax, random), State (game state), Observer (board changes) | Easy |
| 12 | File System | FileSystem, File, Directory, Permission, User | Composite (directory tree), Iterator (traversal), Visitor (operations like search/size) | Medium |
| 13 | Logger Framework | Logger, LogLevel, Handler (Console/File/Network), Formatter, Filter | Singleton (root logger), Chain of Responsibility (handlers), Strategy (formatters), Observer | Medium |
| 14 | Pub/Sub System | MessageBroker, Topic, Publisher, Subscriber, Message, Filter | Observer (core pattern), Strategy (delivery: at-most-once/at-least-once/exactly-once) | Medium |
| 15 | Task Scheduler | Scheduler, Task, Worker, Priority, Dependency, ExecutionResult | Strategy (scheduling algorithm), Observer (task completion), Command (task execution) | Hard |
| 16 | LRU Cache | LRUCache, DoublyLinkedList, HashMap, CacheEntry | Composite (HashMap + LinkedList), Proxy (cache wrapper) | Easy |
| 17 | Rate Limiter | RateLimiter, TokenBucket, SlidingWindow, FixedWindow, LeakyBucket | Strategy (algorithm selection), Singleton (global limiter) | Medium |
| 18 | Connection Pool | ConnectionPool, Connection, PoolConfig, HealthChecker | Object Pool, Singleton (pool manager), Strategy (eviction) | Medium |
| 19 | Thread Pool | ThreadPool, Worker, Task, BlockingQueue, RejectionPolicy | Command (tasks), Strategy (rejection: abort/discard/caller-runs), Observer (task lifecycle) | Hard |
| 20 | Object Pool | ObjectPool<T>, PooledObject<T>, Validator, Factory | Factory (object creation), Strategy (validation, eviction) | Medium |

---

## MODULE B: DATABASE DESIGN LAB

### ER Diagram Builder

Two notation modes: **Chen** (diamonds for relationships, ovals for attributes) and **Crow's Foot** (rectangles with crow's foot symbols at relationship ends).

```typescript
export interface ERDiagramData {
  notation: "chen" | "crows-foot";
  entities: EREntity[];
  relationships: ERRelationship[];
  attributes: ERAttribute[];     // Chen only (separate nodes)
}

export interface EREntity {
  id: string;
  name: string;
  isWeak: boolean;               // double-bordered rectangle
  attributes: EntityAttribute[]; // Crow's foot: inline in box
  position: { x: number; y: number };
}

export interface EntityAttribute {
  id: string;
  name: string;
  type: string;                  // "VARCHAR(255)", "INT", "TIMESTAMP", etc.
  isPrimaryKey: boolean;         // underlined
  isForeignKey: boolean;         // dashed underline
  isNotNull: boolean;
  isUnique: boolean;
  isComposite: boolean;          // Chen: oval with sub-ovals
  isMultivalued: boolean;        // Chen: double oval
  isDerived: boolean;            // Chen: dashed oval
  defaultValue?: string;
}

export interface ERRelationship {
  id: string;
  name: string;                  // verb phrase: "enrolls in"
  entity1Id: string;
  entity2Id: string;
  cardinality1: "1" | "0..1" | "N" | "1..N" | "0..N";  // entity1 side
  cardinality2: "1" | "0..1" | "N" | "1..N" | "0..N";  // entity2 side
  participation1: "total" | "partial";  // total = double line (mandatory)
  participation2: "total" | "partial";
  isIdentifying: boolean;        // for weak entities (double diamond in Chen)
  type: "1:1" | "1:N" | "M:N";
  attributes?: EntityAttribute[];  // relationship attributes
}
```

Chen notation rendering: Entities as rectangles, relationships as diamonds, attributes as ovals connected by lines. Weak entities: double rectangle. Identifying relationship: double diamond.

Crow's foot rendering: Entities as rectangles with inline attributes. Relationship lines between entities with symbols: `||` (one mandatory), `|O` (one optional), `>|` (many mandatory), `>O` (many optional).

### Auto-Convert ER to Relational Schema

```typescript
// Conversion rules:
// 1. Each entity -> table with its attributes
// 2. 1:1 relationship -> FK in the entity with total participation (or either if both total)
// 3. 1:N relationship -> FK in the N-side entity referencing the 1-side PK
// 4. M:N relationship -> junction table with composite PK (FK1, FK2) + relationship attributes
// 5. Weak entity -> include owner's PK as part of weak entity's composite PK
// 6. Multivalued attribute -> separate table with FK to owner
// 7. Composite attribute -> flatten to individual columns
// 8. Derived attribute -> either stored computed column or view

// Output: SQL CREATE TABLE statements + Drizzle schema code + visual relational schema diagram
```

### Normalization Step-Through

Interactive, step-by-step normalization from a universal relation to 3NF or BCNF.

```typescript
export interface NormalizationState {
  universalRelation: {
    name: string;
    attributes: string[];
    functionalDependencies: FunctionalDependency[];
    data: Record<string, unknown>[];  // sample rows showing anomalies
  };
  steps: NormalizationStep[];
  currentStep: number;
}

export interface FunctionalDependency {
  determinant: string[];         // left side of ->
  dependent: string[];           // right side of ->
}

export interface NormalizationStep {
  description: string;           // "Compute closure of {StudentID}"
  action: "compute-closure" | "find-candidate-keys" | "check-nf" | "decompose" | "verify";
  input: unknown;
  output: unknown;
  beforeRelations: RelationSchema[];
  afterRelations: RelationSchema[];
  anomaliesFixed: string[];      // "Eliminated update anomaly in Student-Course"
}
```

Algorithm steps:
1. **Input**: Attributes set and functional dependencies
2. **Compute Closure**: For each attribute subset X, compute X+ (all attributes determinable from X). Show closure growing step-by-step as new FDs fire.
3. **Find Candidate Keys**: Minimal superkeys where closure = all attributes. Show testing process.
4. **Determine Current Normal Form**: Test 1NF (atomic values), 2NF (no partial dependencies), 3NF (no transitive dependencies), BCNF (every determinant is superkey). Highlight violating FDs in red.
5. **Decompose to 3NF**: Minimal cover computation (remove extraneous attributes from FDs, remove redundant FDs). Create table for each FD in minimal cover. Ensure candidate key preserved (add table if needed).
6. **Decompose to BCNF**: For each violating FD X->Y where X is not superkey: split relation into (X, Y) and (R - Y). Show lossless-join verification via chase algorithm.
7. **Verify**: Confirm each resulting relation is in target NF. Show dependency preservation check.

### SQL Query Execution Plan Visualizer

Parse EXPLAIN ANALYZE output into a visual tree.

```typescript
export interface QueryPlanNode {
  id: string;
  type: PlanNodeType;
  table?: string;
  cost: { startup: number; total: number };
  rows: { estimated: number; actual: number };
  time: { startup: number; total: number };   // ms
  width: number;                              // avg row width in bytes
  children: QueryPlanNode[];
  details: Record<string, string>;            // "Index Name", "Filter", "Sort Key", etc.
  buffers?: { shared: { hit: number; read: number }; local: { hit: number; read: number } };
}

export type PlanNodeType =
  | "SeqScan" | "IndexScan" | "IndexOnlyScan" | "BitmapHeapScan" | "BitmapIndexScan"
  | "HashJoin" | "MergeJoin" | "NestedLoop"
  | "Sort" | "IncrementalSort"
  | "Aggregate" | "GroupAggregate" | "HashAggregate"
  | "Limit" | "Unique" | "WindowAgg"
  | "Append" | "MergeAppend"
  | "Materialize" | "Memoize"
  | "Gather" | "GatherMerge"
  | "SubPlan" | "InitPlan"
  | "CTE Scan" | "Function Scan"
  | "Result" | "SetOp";
```

Visual tree renders top-down. Each node is a colored card:
- **Scans**: green (IndexScan, IndexOnlyScan), yellow (BitmapScan), red (SeqScan)
- **Joins**: blue (HashJoin), purple (MergeJoin), orange (NestedLoop)
- **Sort/Aggregate**: cyan
- **Other**: gray

Node card shows: type icon, table name, rows (estimated vs actual), time, cost. Arrow width between nodes proportional to row count.

Color by cost: gradient from green (cheap) to red (expensive) based on percentage of total plan cost.

Input: User pastes SQL query and/or EXPLAIN ANALYZE JSON output. Parse JSON format or text format.

### Index Visualization

**B-Tree Index**
```
// Visual: Multi-level tree with configurable order (m=3,4,5)
// Node: horizontal box containing sorted keys with pointers between them
// Insert animation:
//   1. Traverse from root to leaf following key comparisons (highlight path)
//   2. Insert key into leaf node
//   3. If node overflows (> m-1 keys): split animation
//      - Median key promoted to parent
//      - Two child nodes created with keys split around median
//      - Parent may also split (cascading up to root)
// Delete animation:
//   1. Find key in leaf
//   2. Remove key
//   3. If underflow (< ceil(m/2)-1 keys):
//      - Try borrow from sibling (rotation through parent)
//      - If siblings also minimal: merge with sibling + parent key
//      - Cascade up if parent underflows
// Search animation:
//   1. Start at root
//   2. Binary search within node to find correct child pointer
//   3. Follow pointer to next level
//   4. Repeat until leaf, highlight found key or "not found"
```

**B+ Tree Index**
```
// Like B-Tree but:
// - All values stored in leaf nodes only
// - Internal nodes only contain keys for routing
// - Leaf nodes linked in a doubly-linked list (shown as arrows)
// Range query animation:
//   1. Search for start key (traverse to leaf)
//   2. Scan right through leaf linked list until end key
//   3. Highlight all matching leaf entries
```

**Hash Index**
```
// Visual: Array of buckets (vertical slots)
// Hash function: key -> bucket_index = hash(key) % num_buckets
// Insert: Show hash computation, place in bucket
// Collision resolution (configurable):
//   - Separate chaining: linked list per bucket (show chain growing)
//   - Linear probing: scan forward for empty slot (show probe sequence)
//   - Quadratic probing: probe 1, 4, 9, 16... slots ahead
//   - Double hashing: use second hash function for step size
// Resize: When load factor > threshold, create larger array, rehash all entries (animated)
```

**LSM-Tree Index**
```
// Visual pipeline (left-to-right):
// [Memtable (Red-Black Tree)] --flush--> [L0 SSTables] --compact--> [L1] --compact--> [L2]
//
// Write path animation:
//   1. Write to WAL (append-only log, shown as growing bar)
//   2. Insert into memtable (red-black tree, show BST insert)
//   3. When memtable full (size threshold):
//      a. Freeze current memtable (turn blue)
//      b. Create new empty memtable (green)
//      c. Flush frozen memtable to disk as SSTable in L0
//      d. SSTable: sorted key-value pairs with index block and bloom filter
//
// Compaction animation:
//   1. Select overlapping SSTables from L_n
//   2. Merge-sort them into new SSTables for L_{n+1}
//   3. Delete old SSTables
//   4. Show size amplification: L_{n+1} = L_n * size_ratio (typically 10)
//
// Read path animation:
//   1. Check memtable (instant, highlight if found)
//   2. Check each L0 SSTable (check Bloom filter first, skip if negative)
//   3. Check L1 (binary search within SSTable, one file due to no overlap)
//   4. Check L2, L3, etc.
//   5. Show Bloom filter false-positive scenario
//
// Configurable: size_ratio (10), memtable_size (64MB), L0 compaction trigger (4 files)
```

### Transaction Isolation Demos

Four interactive scenarios showing anomalies at each isolation level:

```typescript
export interface TransactionDemo {
  isolationLevel: "READ_UNCOMMITTED" | "READ_COMMITTED" | "REPEATABLE_READ" | "SERIALIZABLE";
  anomaly: "dirty-read" | "non-repeatable-read" | "phantom-read" | "none";
  transactions: TransactionTimeline[];
  steps: TransactionStep[];
}

export interface TransactionTimeline {
  id: string;                     // "T1", "T2"
  color: string;
  operations: TransactionOp[];
}

export interface TransactionOp {
  type: "BEGIN" | "READ" | "WRITE" | "COMMIT" | "ROLLBACK";
  table: string;
  key?: string;
  value?: unknown;
  result?: unknown;               // what the read returns
  timestamp: number;              // ordering on timeline
}
```

**Demo 1: Read Uncommitted -> Dirty Read**
- T1: BEGIN, WRITE(balance=500), ...(not yet committed)
- T2: BEGIN, READ(balance) -> sees 500 (dirty!)
- T1: ROLLBACK
- T2: now has stale value that never existed
- Show: two parallel timelines, highlight the dirty read in red

**Demo 2: Read Committed -> Non-Repeatable Read**
- T1: BEGIN, READ(balance) -> 1000
- T2: BEGIN, WRITE(balance=500), COMMIT
- T1: READ(balance) -> 500 (different from first read!)
- Show: T1's two reads return different values for same row

**Demo 3: Repeatable Read -> Phantom Read**
- T1: BEGIN, SELECT * WHERE age > 25 -> 3 rows
- T2: BEGIN, INSERT(age=30), COMMIT
- T1: SELECT * WHERE age > 25 -> 4 rows (phantom!)
- Show: same query, different row count

**Demo 4: Serializable -> No Anomalies**
- Show same scenarios but with proper locking/MVCC preventing anomalies
- Show the performance cost (blocking, retries)

---

## MODULE C: DISTRIBUTED SYSTEMS PLAYGROUND

### Raft Consensus (Full Sandbox)

The centerpiece interactive simulation. Users control a cluster of 3, 5, or 7 nodes.

```typescript
export interface RaftState {
  nodes: RaftNode[];
  messages: RaftMessage[];       // in-flight messages with animation positions
  log: RaftLogEntry[];           // global view of committed log
  currentTerm: number;
  commitIndex: number;
  partitions: Partition[];       // active network partitions
}

export interface RaftNode {
  id: string;
  state: "follower" | "candidate" | "leader";
  term: number;
  votedFor: string | null;
  log: RaftLogEntry[];
  commitIndex: number;
  lastApplied: number;
  nextIndex: Record<string, number>;   // leader only
  matchIndex: Record<string, number>;  // leader only
  electionTimeout: number;             // randomized 150-300ms
  electionTimer: number;               // current countdown
  heartbeatTimer: number;              // leader sends AppendEntries every 50ms
  alive: boolean;
  position: { x: number; y: number };  // visual position on canvas
}

export interface RaftLogEntry {
  index: number;
  term: number;
  command: string;               // e.g., "SET x=5"
  committed: boolean;
}

export interface RaftMessage {
  id: string;
  type: "RequestVote" | "RequestVoteResponse" | "AppendEntries" | "AppendEntriesResponse";
  from: string;
  to: string;
  term: number;
  data: Record<string, unknown>;
  // RequestVote: { candidateId, lastLogIndex, lastLogTerm }
  // RequestVoteResponse: { voteGranted }
  // AppendEntries: { leaderId, prevLogIndex, prevLogTerm, entries[], leaderCommit }
  // AppendEntriesResponse: { success, matchIndex }
  progress: number;              // 0.0-1.0 animation progress between nodes
  delayed: boolean;              // in partition = message stuck
}
```

Visual: Nodes as large circles arranged in a ring. Color by state: follower=blue, candidate=yellow, leader=green. Messages as small colored dots traveling between nodes with curved paths. Log bars shown below each node.

**Interactions:**
- Click node to kill/revive it
- Draw partition line to split network
- Click "Send Client Request" to submit a command to the leader
- Speed control: 0.1x to 10x
- Step mode: advance one message at a time

**Scenarios:**
1. Normal operation: leader sends heartbeats, followers reset timers
2. Leader election: kill leader, watch election timeout, RequestVote broadcasts, majority vote, new leader
3. Split vote: two candidates start simultaneously, show term increment, re-election
4. Log replication: client sends SET x=5, leader appends to log, sends AppendEntries, majority acknowledge, commit
5. Network partition: isolate leader, minority elects new leader with higher term, old leader steps down on reconnect
6. Log reconciliation: follower with divergent log, leader finds matching point via decreasing nextIndex

### Paxos

```typescript
export interface PaxosState {
  proposers: PaxosProposer[];
  acceptors: PaxosAcceptor[];
  learners: PaxosLearner[];
  messages: PaxosMessage[];
  round: number;
}

export interface PaxosProposer {
  id: string;
  proposalNumber: number;        // monotonically increasing, unique per proposer
  proposedValue: string;
  phase: "idle" | "prepare" | "accept" | "decided";
  promises: number;              // count of Promise responses received
  accepted: number;              // count of Accepted responses received
}

export interface PaxosAcceptor {
  id: string;
  promisedNumber: number;        // highest proposal number promised
  acceptedNumber: number;        // highest proposal number accepted
  acceptedValue: string | null;
  position: { x: number; y: number };
}

// Phases animated:
// 1. Prepare: Proposer sends Prepare(n) to all acceptors
// 2. Promise: Acceptors respond Promise(n, accepted_n, accepted_v) if n > promised
// 3. Accept: Proposer sends Accept(n, v) to all acceptors (v = highest accepted value or own)
// 4. Accepted: Acceptors respond Accepted(n, v) if n >= promised
// 5. Learner receives majority Accepted -> value decided
//
// Competing proposers scenario:
// P1 sends Prepare(1), P2 sends Prepare(2) before P1 gets Accept through
// Show P1's Accept rejected, P1 must retry with higher number
```

### Consistent Hashing Ring

```typescript
// Visual: Circle representing hash space 0 to 2^32
// Nodes plotted as colored dots on ring at hash(nodeId) position
// Keys plotted as small markers on ring
// Key assignment: walk clockwise from key position to first node
//
// Interactions:
// - Add node: new dot appears, keys between predecessor and new node migrate (animated)
// - Remove node: dot disappears, keys migrate to successor (animated)
// - Toggle virtual nodes: each physical node gets V positions (configurable 100-300)
//   Show virtual nodes as smaller dots with same color as physical
// - Key lookup animation: highlight key, draw clockwise arrow to owning node
// - Load histogram: bar chart showing key count per physical node
//   Without virtual nodes: highly uneven
//   With virtual nodes: nearly uniform
// - Add/remove 100 keys at once: show redistribution animation
// - Show percentage of keys that move when node added/removed:
//   Expected: K/N keys move (K=total keys, N=total nodes)
```

### Vector Clocks

```typescript
// Visual: Space-time diagram
// N horizontal timelines (one per process, configurable 2-5)
// Events as dots on timelines
// Messages as diagonal arrows between timelines
// Each event shows its vector clock value [P1:x, P2:y, P3:z]
//
// Rules animated:
// 1. Internal event: increment own component
// 2. Send event: increment own, attach vector to message
// 3. Receive event: component-wise max of own and received, then increment own
//
// Comparison: given two events e1, e2:
// - e1 -> e2 (causally before): all components of e1 <= e2, at least one <
// - e2 -> e1: reverse
// - concurrent: neither dominates
// Show: click two events, see happen-before arrow or "concurrent" label
```

### Lamport Timestamps

```typescript
// Same space-time diagram as Vector Clocks but with scalar timestamps
// Rules:
// 1. Internal event: increment counter
// 2. Send: increment counter, attach to message
// 3. Receive: max(own, received) + 1
//
// Limitation demo:
// Show two concurrent events with ordered Lamport timestamps
// "a < b in Lamport time does NOT mean a happened before b"
// Compare side-by-side with Vector Clock version showing concurrency
```

### Gossip Protocol

```typescript
// Visual: N nodes (configurable 10-50) scattered on 2D plane
// Each node has a state value (version number, colored by freshness)
// Initially: one node has updated state (green), rest are stale (gray)
//
// Each round (configurable interval: 100ms-2000ms):
// - Each node picks random peer(s) (configurable fanout: 1, 2, 3)
// - Send own state to peer (animated message dot)
// - Peer adopts newer state (merge = max version)
// - Node color transitions from gray -> yellow (recently received) -> green (settled)
//
// Metrics shown:
// - Convergence progress bar: X/N nodes have latest state
// - Convergence time: ticks until 100% propagation
// - Message count: total messages sent
// - Infection curve: S-shaped plot of nodes with latest state over time
// - Compare different fanout values side-by-side
```

### CAP Theorem Explorer

```typescript
// Visual: 3-node cluster with client
// Toggle switches: [C Consistency] [A Availability] [P Partition Tolerance]
// CAP rule: can only guarantee 2 of 3
//
// Scenarios:
// 1. No partition (all 3 possible): client writes to leader, replicated to followers, all reads consistent
// 2. Inject partition (split into 2+1):
//    a. CP mode: minority partition rejects reads/writes (unavailable), majority continues consistently
//       Example: "This is how ZooKeeper, etcd, HBase work"
//    b. AP mode: both partitions accept reads/writes (available), but diverge (inconsistent)
//       Example: "This is how Cassandra, DynamoDB, CouchDB work"
//       Show divergent values, then merge on partition heal (last-write-wins or CRDT merge)
//
// Real-world database categorization shown:
// CP: PostgreSQL, MongoDB (default), Redis Cluster, HBase, ZooKeeper, etcd, Consul
// AP: Cassandra, DynamoDB, CouchDB, Riak, Voldemort
// CA: Single-node databases (partition = system down, so P is "trivially handled")
```

### CRDTs

```typescript
// Four CRDT types, each with 3 replica nodes shown side-by-side:

// 1. G-Counter (Grow-only Counter)
// Each replica: vector of counts [R1:5, R2:3, R3:7]
// Increment: only own component
// Value: sum of all components = 15
// Merge: component-wise max
// Demo: all three replicas increment independently, then merge -> all converge to same total

// 2. PN-Counter (Positive-Negative Counter)
// Two G-Counters: P (increments) and N (decrements)
// Value: sum(P) - sum(N)
// Demo: increment and decrement on different replicas, merge, correct final value

// 3. LWW-Register (Last-Writer-Wins Register)
// Each write tagged with timestamp
// Merge: keep value with highest timestamp
// Demo: concurrent writes on R1 and R2, merge picks later timestamp
// Show limitation: earlier write "lost" even if more "correct"

// 4. OR-Set (Observed-Remove Set)
// Each add generates unique tag
// Remove removes specific tags, not the element itself
// Demo: R1 adds "x" (tag1), R2 adds "x" (tag2), R1 removes "x" (removes tag1 only)
// After merge: "x" still in set (tag2 survives)
// Compare with naive set: add-remove anomaly
```

### Two-Phase Commit vs Saga

```typescript
// Side-by-side comparison of distributed transaction patterns

// LEFT: Two-Phase Commit (2PC)
// Coordinator + 3 Participants
// Phase 1 (Prepare): Coordinator sends PREPARE to all
//   - Participants respond READY or ABORT
//   - Show: participant locks resources (grayed out)
// Phase 2 (Commit/Abort):
//   - If all READY: Coordinator sends COMMIT, participants commit
//   - If any ABORT: Coordinator sends ABORT, participants rollback
// Failure scenario: Coordinator crashes after Phase 1 -> participants BLOCKED (red)
// Show: blocking problem (participants cannot proceed without coordinator decision)

// RIGHT: Saga (Choreography)
// 5 services in a chain: Order -> Payment -> Inventory -> Shipping -> Notification
// Forward: each service completes its step, emits event
// Compensation on failure:
//   - Shipping fails -> trigger compensations in reverse order
//   - Undo Inventory (release stock)
//   - Undo Payment (refund)
//   - Undo Order (cancel)
//   - Each compensation animated in reverse with red arrows
// Show: non-blocking, eventually consistent
```

### MapReduce

```typescript
// Visual pipeline (left to right):
// [Input Data] -> [Map Phase] -> [Shuffle Phase] -> [Reduce Phase] -> [Output]
//
// Word Count Example:
// Input: "hello world hello" | "world foo hello"  (2 input splits)
//
// Map Phase (parallel):
// Mapper 1: "hello world hello" -> [(hello,1), (world,1), (hello,1)]
// Mapper 2: "world foo hello"   -> [(world,1), (foo,1), (hello,1)]
// Show: each word emitted as colored particle from input to mapper
//
// Shuffle Phase:
// Group by key, sort:
// foo: [1]
// hello: [1, 1, 1]
// world: [1, 1]
// Show: particles reorganize from mappers to reducers by key (color by key)
//
// Reduce Phase (parallel):
// Reducer 1 (foo, hello): foo=1, hello=3
// Reducer 2 (world): world=2
// Show: particles merge into single values
//
// Output: {foo: 1, hello: 3, world: 2}
//
// Interactive: User provides custom input text, see word count run through pipeline
// Also: configurable number of mappers and reducers
```

---

## WHAT SUCCESS LOOKS LIKE (End of Phase 4)

1. Class diagram builder: create classes, add attributes/methods, connect with all 6 relationship types, cardinality labels work
2. Sequence diagram: actors, sync/async messages, self-calls, combined fragments (alt, loop, par), activation bars
3. State machine: states with entry/exit/do, transitions with guards, nested/composite states, simulation mode
4. All 33 design patterns load interactive demos with class diagrams, 3-language code, before/after comparison
5. SOLID explorer: all 5 principles with interactive drag-based demos
6. Code generation: diagram-to-code produces valid TypeScript/Python/Java; code-to-diagram parses and renders
7. All 20 LLD problems have requirements, class diagram templates, and starter code
8. ER diagrams: both Chen and Crow's foot notation render correctly
9. ER-to-relational conversion produces correct SQL DDL
10. Normalization tool: step through from unnormalized to 3NF/BCNF with closure computation
11. Query plan visualizer: parse EXPLAIN ANALYZE output, render as color-coded tree
12. All 4 index types animate correctly (B-Tree splits, B+ Tree range scan, hash collision, LSM compaction)
13. All 4 transaction isolation demos show correct anomaly scenarios
14. Raft: full election, log replication, partition handling with animated message passing
15. Paxos: Prepare/Promise/Accept/Accepted phases with competing proposers
16. Consistent hashing ring: add/remove nodes with key redistribution, virtual nodes toggle
17. Vector clocks and Lamport timestamps: space-time diagram with happen-before detection
18. Gossip protocol: epidemic spread visualization with configurable fanout, S-curve convergence
19. CAP theorem: toggle C/A/P, inject partition, see CP vs AP behavior with real-world examples
20. CRDTs: all 4 types show concurrent updates converging after merge on 3 replicas
21. 2PC vs Saga side-by-side: blocking vs compensation animated
22. MapReduce: word count pipeline with custom input
