# PHASE 5: NETWORKING, OS CONCEPTS, CONCURRENCY, SECURITY & ML SYSTEM DESIGN

> **Goal:** Five modules covering computer science fundamentals and applied ML system design. Each topic is interactive with animated visualizations, not static diagrams. Users manipulate parameters, observe behavior, and build intuition through exploration.

> **Prerequisite:** Phase 1 complete. Phase 2/3/4 NOT required.

---

## MODULE A: NETWORKING & PROTOCOLS

### TCP Connection Lifecycle

Full animated visualization of a TCP connection from handshake to teardown.

```typescript
export interface TCPVisualization {
  client: TCPEndpoint;
  server: TCPEndpoint;
  messages: TCPSegment[];
  connectionState: TCPState;
  sequenceNumbers: { client: number; server: number };
  slidingWindow: SlidingWindowState;
}

export interface TCPEndpoint {
  state: TCPState;
  sendBuffer: Uint8Array;
  receiveBuffer: Uint8Array;
  sequenceNumber: number;
  acknowledgmentNumber: number;
  windowSize: number;
}

export type TCPState =
  | "CLOSED" | "LISTEN" | "SYN_SENT" | "SYN_RECEIVED"
  | "ESTABLISHED" | "FIN_WAIT_1" | "FIN_WAIT_2" | "CLOSE_WAIT"
  | "CLOSING" | "LAST_ACK" | "TIME_WAIT";
```

**Three-Way Handshake Animation:**
```
Client                                Server
  |                                     |
  |  ---- SYN (seq=100) ------------>   |   Client: SYN_SENT
  |                                     |   Server: SYN_RECEIVED
  |  <--- SYN-ACK (seq=300, ack=101) -- |
  |                                     |   Client: ESTABLISHED
  |  ---- ACK (seq=101, ack=301) ---->  |   Server: ESTABLISHED
  |                                     |
```

Show: sequence numbers in packet headers, state labels on both sides, message arrows with timing. Each packet is a colored rectangle traveling between endpoints showing flags (SYN, ACK, FIN, RST) and seq/ack numbers.

**Data Transfer with Sliding Window:**
```
// Sender window: [Sent+Acked | Sent+Unacked | Sendable | Not Yet Sendable]
// Visual: horizontal buffer divided into colored regions
// - Green: sent and acknowledged
// - Yellow: sent but not yet acknowledged (in flight)
// - Blue: within window, ready to send
// - Gray: outside window, waiting
//
// Animation:
// 1. Sender sends segments filling the window
// 2. Segments travel to receiver (show transit time)
// 3. Receiver ACKs (cumulative ACK, advance window)
// 4. Window slides right as ACKs received
// 5. Lost segment scenario: ACK timeout, retransmit, duplicate ACKs -> fast retransmit
// Configurable: window size (1-65535), segment size, RTT, loss rate
```

**Connection Teardown (Four-Way Handshake):**
```
Client                                Server
  |  ---- FIN (seq=500) ----------->   |   Client: FIN_WAIT_1
  |  <--- ACK (ack=501) -----------    |   Client: FIN_WAIT_2, Server: CLOSE_WAIT
  |  <--- FIN (seq=700) -----------    |   Server: LAST_ACK
  |  ---- ACK (ack=701) ----------->   |   Client: TIME_WAIT (2*MSL), Server: CLOSED
  |         ... 2*MSL timeout ...      |
  |                                     |   Client: CLOSED
```

**State Machine Diagram:** Interactive state machine showing all TCP states and transitions. Current state highlighted. Click events to trigger transitions. Show all states: CLOSED -> LISTEN -> SYN_RECEIVED -> ESTABLISHED -> CLOSE_WAIT -> LAST_ACK -> CLOSED (server path) and CLOSED -> SYN_SENT -> ESTABLISHED -> FIN_WAIT_1 -> FIN_WAIT_2 -> TIME_WAIT -> CLOSED (client path).

### TLS 1.3 Handshake

```typescript
export interface TLSHandshake {
  steps: TLSStep[];
  cipherSuite: string;           // "TLS_AES_256_GCM_SHA384"
  keyExchange: "ECDHE" | "DHE";
  mode: "1-RTT" | "0-RTT";
  certificates: Certificate[];
}

export interface TLSStep {
  name: string;
  direction: "client-to-server" | "server-to-client";
  content: Record<string, unknown>;
  encrypted: boolean;             // show lock icon for encrypted messages
  description: string;
}
```

**1-RTT Handshake Animation:**
```
Client                                          Server
  |                                               |
  | -- ClientHello --------------------------->   |
  |    (supported versions, cipher suites,        |
  |     key_share: ECDHE public key,              |
  |     supported_groups, signature_algorithms)    |
  |                                               |
  | <-- ServerHello + EncryptedExtensions         |
  |     + Certificate + CertificateVerify         |
  |     + Finished -------------------------      |
  |    (chosen cipher suite, key_share,           |
  |     certificate chain, handshake signature,    |
  |     handshake MAC)                             |
  |    [Everything after ServerHello is encrypted] |
  |                                               |
  | -- Finished (client handshake MAC) -------->  |
  |                                               |
  | <========= Application Data ==========>      |
```

Show: key derivation tree (Early Secret -> Handshake Secret -> Master Secret -> Traffic Keys). Color-code encrypted vs plaintext messages. Show certificate chain verification (leaf -> intermediate -> root CA).

**0-RTT Resumption:**
```
// Pre-shared key from previous session
// Client sends ClientHello + early data in first message
// Risk: replay attacks (show warning annotation)
// Show: time comparison 1-RTT vs 0-RTT (one fewer round trip)
```

### HTTP Version Comparison

Side-by-side visualization of HTTP/1.1 vs HTTP/2 vs HTTP/3 loading the same page with 6 resources.

```
HTTP/1.1 (6 connections)          HTTP/2 (1 connection)           HTTP/3 (QUIC)
┌──────────────────┐              ┌──────────────────┐            ┌──────────────────┐
│ Conn 1: ████░░░░ │  sequential  │ Stream 1: ██░░░░ │ multiplex  │ Stream 1: ██░░░░ │ multiplex
│ Conn 2: ░░██░░░░ │  per conn    │ Stream 2: ░██░░░ │ on one     │ Stream 2: ░██░░░ │ on QUIC
│ Conn 3: ░░░░██░░ │              │ Stream 3: ░░██░░ │ TCP conn   │ Stream 3: ░░██░░ │ (UDP)
│ Conn 4: ░░░░░░██ │  head-of-   │ Stream 4: ░░░██░ │            │ Stream 4: ░░░██░ │
│ Conn 5: waiting..│  line block  │ Stream 5: ░░░░██ │ HPACK      │ Stream 5: ░░░░██ │ QPACK
│ Conn 6: waiting..│              │ Stream 6: ░░░░░█ │ headers    │ Stream 6: ░░░░░█ │ 0-RTT
└──────────────────┘              └──────────────────┘            └──────────────────┘
Total: 800ms                      Total: 350ms                    Total: 300ms
```

**Key differences animated:**
- HTTP/1.1: sequential requests per connection, max 6 connections, text headers repeated
- HTTP/2: multiplexed streams on single TCP, binary framing, HPACK header compression, server push, stream prioritization. BUT: TCP head-of-line blocking (one lost packet blocks ALL streams)
- HTTP/3: QUIC (UDP-based), independent streams (no HoL blocking), 0-RTT connection, connection migration (IP change), QPACK header compression

**Interactive:** Toggle packet loss percentage. With HTTP/2, show all streams stalling when one TCP segment is lost. With HTTP/3, show only affected stream stalling while others continue.

### DNS Resolution

```typescript
// Animated DNS resolution chain:
// Browser -> Stub Resolver -> Recursive Resolver -> Root NS -> TLD NS -> Authoritative NS
//
// Visual: Five boxes in a chain. Message arrows travel between them.
//
// Step-by-step for "www.example.com":
// 1. Browser checks local cache -> MISS
// 2. OS stub resolver checks /etc/hosts, local cache -> MISS
// 3. Recursive resolver (ISP/8.8.8.8) checks cache -> MISS
// 4. Recursive -> Root NS: "Who handles .com?" -> Root responds with .com TLD NS addresses
// 5. Recursive -> TLD NS (.com): "Who handles example.com?" -> TLD responds with auth NS addresses
// 6. Recursive -> Auth NS: "What is www.example.com?" -> Auth responds: "A 93.184.216.34, TTL 300"
// 7. Recursive caches (TTL=300s), responds to stub
// 8. Stub caches, responds to browser
// 9. Browser caches, connects to IP
//
// Show: TTL countdown timers on each cache level
// Show: CNAME chains (www -> alias -> another-alias -> IP)
// Show: DNS record types: A, AAAA, CNAME, MX, TXT, NS, SOA
// Interactive: type a domain, watch resolution. Inject cache hit at different levels.
```

### WebSocket Lifecycle

```typescript
// Visual: Client and Server with bidirectional message channel
//
// 1. HTTP Upgrade Handshake:
//    Client: GET / HTTP/1.1, Upgrade: websocket, Connection: Upgrade,
//            Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
//    Server: HTTP/1.1 101 Switching Protocols, Upgrade: websocket,
//            Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
//
// 2. Bidirectional Communication:
//    Show frames flowing both directions simultaneously
//    Frame structure: [FIN|RSV|Opcode|Mask|Payload-Length|Masking-Key|Payload]
//    Color: text frames (green), binary frames (blue), control frames (yellow)
//
// 3. Ping/Pong Keep-Alive:
//    Server sends Ping, Client responds Pong (automatic)
//    Show timeout detection when Pong not received
//
// 4. Close Handshake:
//    Initiator sends Close frame (status code + reason)
//    Responder sends Close frame back
//    TCP connection closed
//
// Compare panel:
// WebSocket vs Server-Sent Events (SSE) vs Long Polling
// - WebSocket: full-duplex, binary+text, custom protocol
// - SSE: server-to-client only, text only, auto-reconnect, uses HTTP
// - Long Polling: request-wait-respond-repeat, highest latency
// Visual: same chat scenario implemented 3 ways, show message overhead and latency
```

### gRPC vs REST vs GraphQL Comparison

```typescript
// Same operation implemented 3 ways: "Get user with their last 5 orders"
//
// REST:
// Request 1: GET /users/123 -> { id: 123, name: "Alice", ... }
// Request 2: GET /users/123/orders?limit=5 -> [{ orderId: 1, ... }, ...]
// 2 round trips, potential over-fetching (all user fields)
// Show: JSON payload sizes, total bytes transferred
//
// GraphQL:
// Request 1: POST /graphql
// { query: "{ user(id: 123) { name, orders(limit: 5) { id, total } } }" }
// 1 round trip, exact fields requested
// Show: query payload, response payload (smaller than REST)
//
// gRPC:
// Request 1: GetUserWithOrders(UserRequest { id: 123 })
// 1 round trip, binary protobuf encoding
// Show: protobuf binary size vs JSON size (typically 3-10x smaller)
// Show: HTTP/2 multiplexing, bidirectional streaming option
//
// Comparison table:
// | Feature      | REST    | GraphQL | gRPC    |
// |------------- |---------|---------|---------|
// | Encoding     | JSON    | JSON    | Protobuf|
// | Transport    | HTTP/1.1| HTTP    | HTTP/2  |
// | Schema       | OpenAPI | SDL     | .proto  |
// | Round trips  | N+1     | 1       | 1       |
// | Streaming    | SSE     | Subscr. | Bidirec.|
// | Browser      | Native  | Fetch   | grpc-web|
// | Payload size | Large   | Medium  | Small   |
// | Caching      | HTTP    | Manual  | Manual  |
```

### CDN Request Flow

```typescript
// Visual: Client -> DNS (CNAME) -> Edge POP -> [Cache Hit?] -> Origin
//
// Cache Hit Flow:
// 1. Client requests https://cdn.example.com/image.jpg
// 2. DNS resolves cdn.example.com -> CNAME -> edge.cdn-provider.net -> nearest POP IP
// 3. Edge POP checks local cache -> HIT
// 4. Edge POP returns cached content (fast, green path)
// Show: geographic map with POP locations, latency numbers
//
// Cache Miss Flow:
// 1-3. Same as above
// 3. Edge POP checks local cache -> MISS
// 4. Edge POP checks origin shield (intermediate cache) -> MISS
// 5. Origin shield requests from origin server
// 6. Origin responds, origin shield caches, edge POP caches, client receives
// Show: cache headers (Cache-Control, ETag, Last-Modified, CDN-Cache-Status)
//
// Interactive:
// - Toggle origin shield on/off
// - Set cache TTL and watch expiration
// - Trigger cache purge (show propagation delay to all POPs)
// - Multiple clients from different regions hitting same/different POPs
```

### CORS Flow Simulator

```typescript
// Configure: Origin, Target URL, HTTP Method, Custom Headers
//
// Decision tree (animated step by step):
// 1. Is this a simple request? (GET/POST/HEAD + standard headers + standard content types)
//    YES -> Browser sends request directly with Origin header
//    NO  -> Browser sends preflight OPTIONS request
//
// Preflight flow:
// Browser: OPTIONS /api/data
//   Origin: https://app.example.com
//   Access-Control-Request-Method: DELETE
//   Access-Control-Request-Headers: X-Custom-Header
//
// Server: 204 No Content
//   Access-Control-Allow-Origin: https://app.example.com
//   Access-Control-Allow-Methods: GET, POST, DELETE
//   Access-Control-Allow-Headers: X-Custom-Header
//   Access-Control-Max-Age: 86400
//
// Scenarios:
// 1. Simple GET: no preflight, show Origin header check
// 2. POST with JSON: preflight required (Content-Type: application/json)
// 3. DELETE: preflight required
// 4. Wildcard origin (*): show limitation (no credentials)
// 5. Rejected CORS: show browser blocking response, error in console
// 6. Credentialed request: Access-Control-Allow-Credentials: true
//
// Interactive: configure origin, method, headers, server response headers.
// Show green/red result for each configuration.
```

---

## MODULE B: OS CONCEPTS

### Process Scheduling Simulator

```typescript
export interface SchedulingState {
  algorithm: SchedulingAlgorithm;
  processes: ProcessInfo[];
  currentTime: number;
  cpuBusy: boolean;
  readyQueue: string[];          // process IDs in ready queue
  ganttChart: GanttEntry[];
  completed: ProcessResult[];
}

export type SchedulingAlgorithm =
  | "FCFS" | "SJF-Non-Preemptive" | "SJF-Preemptive" | "RR"
  | "Priority-Non-Preemptive" | "Priority-Preemptive" | "MLFQ";

export interface ProcessInfo {
  id: string;                    // "P1", "P2", etc.
  arrivalTime: number;
  burstTime: number;
  remainingBurst: number;
  priority: number;              // lower = higher priority
  color: string;                 // unique color per process
  state: "new" | "ready" | "running" | "waiting" | "terminated";
}

export interface GanttEntry {
  processId: string;
  startTime: number;
  endTime: number;
}

export interface ProcessResult {
  processId: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  turnaroundTime: number;        // completion - arrival
  waitingTime: number;           // turnaround - burst
  responseTime: number;          // first run - arrival
}
```

**Visual Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ PROCESS TABLE                                                │
│ ID  | Arrival | Burst | Priority | State      | Remaining   │
│ P1  | 0       | 6     | 2        | Running    | 3           │
│ P2  | 1       | 4     | 1        | Ready      | 4           │
│ P3  | 2       | 8     | 3        | Ready      | 8           │
├──────────────────────────────────────────────────────────────┤
│ READY QUEUE: [P2] -> [P3]                                    │
├──────────────────────────────────────────────────────────────┤
│ GANTT CHART                                                  │
│ |P1|P1|P1|P2|P2|P1|P1|P1|P2|P2|P3|P3|P3|P3|P3|P3|P3|P3|  │
│ 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18   │
├──────────────────────────────────────────────────────────────┤
│ RESULTS                                                      │
│ Avg Turnaround: 11.33 | Avg Waiting: 5.33 | Avg Response: 2 │
└──────────────────────────────────────────────────────────────┘
```

**FCFS**: Processes run in arrival order. Non-preemptive. Shows convoy effect (short processes stuck behind long one).

**SJF Non-Preemptive**: When CPU free, pick process with shortest burst time from ready queue. Shows optimal average waiting time but starvation risk.

**SJF Preemptive (SRTF)**: When new process arrives, if its burst < remaining burst of running process, preempt. Show preemption animation (running process returns to ready queue).

**Round Robin**: Configurable time quantum (slider: 1-10). Process runs for quantum or until burst completes. Show context switch overhead. Show effect of quantum size (too small = overhead, too large = FCFS).

**Priority Non-Preemptive**: Pick highest priority from ready queue. Show starvation scenario. Then enable aging: priority increases with wait time.

**Priority Preemptive**: Like SJF preemptive but by priority. Higher-priority arrival preempts current process.

**MLFQ (Multi-Level Feedback Queue)**: 3 queues with different priorities and quanta. Q0: quantum=2 (highest priority), Q1: quantum=4, Q2: FCFS (lowest). Process starts in Q0, demoted to Q1 if exceeds quantum, demoted to Q2 if exceeds again. Show process migration between queues. Priority boost every S time units (configurable) to prevent starvation.

**Comparison Mode**: Run same processes through all algorithms simultaneously. Show side-by-side Gantt charts and comparison table of avg turnaround/waiting/response times.

### Page Replacement Algorithms

```typescript
export interface PageReplacementState {
  algorithm: "FIFO" | "LRU" | "Optimal" | "Clock" | "LFU";
  referenceString: number[];     // sequence of page requests
  frameCount: number;            // number of physical frames (configurable 1-7)
  frames: (number | null)[];     // current frame contents
  stepIndex: number;
  history: PageStep[];
  hitCount: number;
  missCount: number;
}

export interface PageStep {
  pageRequested: number;
  result: "hit" | "miss";
  evictedPage: number | null;
  framesAfter: (number | null)[];
  explanation: string;           // "Page 3 not in frames. Evict page 1 (oldest, FIFO)."
}
```

**Visual:**
```
Reference: [1] [2] [3] [4] [1] [2] [5] [1] [2] [3] [4] [5]
                              ^
                          current step

Frames (3):
┌───┬───┬───┐
│ 1 │ 2 │ 3 │   Page 4 requested -> MISS
└───┴───┴───┘   Evict: 1 (FIFO: oldest)
      ↓
┌───┬───┬───┐
│ 4 │ 2 │ 3 │
└───┴───┴───┘

Hits: 3  |  Misses: 9  |  Hit Rate: 25%
```

**FIFO**: Evict oldest loaded page. Show queue (first in, first out). Demonstrate Belady's anomaly: more frames can lead to MORE faults.

**LRU**: Evict least recently used page. Show recency ordering updating on each access. Stack/counter implementation visualized.

**Optimal (Belady's)**: Evict page that won't be used for the longest time in the future. Show future lookahead (grayed reference string). Optimal but requires future knowledge (theoretical benchmark).

**Clock (Second Chance)**: Circular buffer of frames with reference bits. Pointer sweeps, giving pages a second chance if reference bit set. Show circular visualization with pointer and bit flags.

**LFU**: Evict least frequently used page. Show frequency counters per page. Tie-breaking by recency.

### Deadlock Visualization

```typescript
export interface DeadlockState {
  processes: Process[];
  resources: Resource[];
  allocations: Allocation[];     // process holds resource
  requests: ResourceRequest[];   // process waiting for resource
  cycle: string[] | null;        // detected cycle in RAG
}
```

**Resource Allocation Graph (RAG):**
- Processes: circles
- Resources: rectangles with dots (instances)
- Assignment edge: Resource -> Process (process holds it)
- Request edge: Process -> Resource (process wants it)
- Cycle detection: highlight cycle in red when deadlock detected

**Banker's Algorithm Step-Through:**
```
// Given:
// Allocation matrix: what each process currently holds
// Max matrix: what each process might need
// Available vector: currently free resources
//
// Compute Need = Max - Allocation
//
// Safety algorithm:
// 1. Work = Available; Finish = [false, false, ..., false]
// 2. Find process Pi where Finish[i] == false AND Need[i] <= Work
// 3. Work = Work + Allocation[i]; Finish[i] = true
// 4. Repeat until all finished (SAFE) or no process can proceed (UNSAFE)
//
// Show: matrices side by side, Work vector updating, safe sequence building
// Highlight: which process selected at each step, why others can't proceed
// Interactive: modify allocation/max values, see safety status change
```

**Example matrices (configurable):**
```
     Allocation    Max         Need        Available
     A  B  C     A  B  C     A  B  C      A  B  C
P0   0  1  0     7  5  3     7  4  3      3  3  2
P1   2  0  0     3  2  2     1  2  2
P2   3  0  2     9  0  2     6  0  0
P3   2  1  1     2  2  2     0  1  1
P4   0  0  2     4  3  3     4  3  1
```

### Memory Management

**Paging:**
```
// Virtual Address -> Physical Address translation
// Visual: Virtual Address Space (pages) | Page Table | Physical Memory (frames)
//
// Virtual address = [Page Number | Offset]
// Page table entry: [Frame Number | Valid | Dirty | Reference | Protection]
// Physical address = [Frame Number | Offset]
//
// Translation steps (animated):
// 1. Extract page number from virtual address
// 2. Check TLB (show hit/miss)
// 3. If TLB miss: look up page table
// 4. If page valid: get frame number, combine with offset = physical address
// 5. If page invalid: PAGE FAULT -> load from disk, update page table, retry
//
// TLB: small table with (Page, Frame) entries, show LRU eviction
// Configurable: page size (4KB, 2MB), address space (32-bit, 64-bit), TLB size
```

**Segmentation:**
```
// Virtual address = [Segment Number | Offset]
// Segment table: [Base | Limit | Protection]
// Physical address = Base + Offset (if Offset < Limit, else SEGFAULT)
//
// Visual: variable-size segments in physical memory (shows external fragmentation)
// Compare with paging (fixed-size, no external fragmentation, internal fragmentation)
```

### Thread Synchronization Primitives

```typescript
// Visual: threads as colored timelines, shared resource as a box in the middle

// 1. MUTEX
// Lock()/Unlock() operations
// Show: thread acquires lock (box turns green), other threads block (red),
//       lock released (other thread proceeds)
// Critical section highlighted

// 2. SEMAPHORE
// init(count), wait()/P(), signal()/V()
// Show: counter value, wait queue (threads lined up)
// Binary semaphore (count=1) vs counting semaphore (count=N)
// Demo: parking lot with N spots

// 3. MONITOR (Condition Variables)
// wait(condition), signal(condition), broadcast(condition)
// Show: monitor entry queue, condition variable wait queues
// Demo: bounded buffer with notFull and notEmpty conditions

// 4. READER-WRITER LOCK
// readLock()/readUnlock(), writeLock()/writeUnlock()
// Show: multiple readers concurrent (green), writer exclusive (red)
// Policies: reader-priority vs writer-priority vs fair
// Demo: shared database with concurrent reads and exclusive writes
```

### Classic Synchronization Problems (Animated)

**Producer-Consumer (Bounded Buffer):**
```
// Visual: buffer as a horizontal strip of N slots
// Producer thread: generates items, places in buffer (if not full)
// Consumer thread: takes items from buffer (if not empty)
// Synchronization: mutex + full semaphore + empty semaphore
// Show: producer blocks when full, consumer blocks when empty
// Configurable: buffer size, producer rate, consumer rate, number of producers/consumers
```

**Dining Philosophers:**
```
// Visual: 5 philosophers around a circular table, 5 forks between them
// States: Thinking (blue) | Hungry (yellow) | Eating (green) | Deadlocked (red)
// Show: philosopher picks up left fork, then right fork, eats, releases
// Deadlock scenario: all pick up left fork simultaneously (all waiting for right fork)
// Solutions animated:
//   1. Resource hierarchy: philosopher P4 picks up right fork first
//   2. Arbitrator: waiter allows max 4 philosophers to attempt eating
//   3. Chandy/Misra: dirty/clean fork passing
```

**Readers-Writers:**
```
// Visual: shared resource (book) with reader queue and writer queue
// Multiple readers can access simultaneously
// Writer needs exclusive access
// Show: readers entering concurrently, writer waiting, then writer exclusive
// Starvation scenarios: continuous readers starve writers, or vice versa
// Fair solution: writers given priority after waiting
```

**Sleeping Barber:**
```
// Visual: barbershop with 1 barber chair + N waiting chairs
// Barber sleeps when no customers (show Zzz)
// Customer arrives: if waiting chairs available, sit and wait; else leave
// If barber sleeping, wake barber
// Show: queue management, barber waking, customers leaving when full
// Configurable: number of waiting chairs, customer arrival rate, haircut time
```

---

## MODULE C: CONCURRENCY LAB

### Thread Lifecycle Visualization

```typescript
// Thread states: New -> Runnable -> Running -> (Blocked | Waiting | Timed-Waiting) -> Terminated
//
// Visual: state machine diagram with animated thread token moving between states
// Show transitions:
// New -> Runnable: start()
// Runnable -> Running: scheduler picks this thread
// Running -> Runnable: yield() or quantum expires
// Running -> Blocked: synchronized (waiting for monitor lock)
// Running -> Waiting: wait(), join(), LockSupport.park()
// Running -> Timed-Waiting: sleep(ms), wait(ms), join(ms)
// Waiting -> Runnable: notify(), notifyAll(), interrupt()
// Timed-Waiting -> Runnable: timeout expires, notify(), interrupt()
// Blocked -> Runnable: lock available
// Running -> Terminated: run() completes or unhandled exception
//
// Timeline view: multiple threads on parallel timelines showing state changes over time
// Color: New=gray, Runnable=blue, Running=green, Blocked=red, Waiting=yellow, Terminated=black
```

### Race Condition Demo

```typescript
// Visual: two thread timelines side by side, shared counter variable in center
//
// Scenario: counter = 0, both threads increment 1000 times
// Expected result: 2000
//
// Show interleaved execution:
// T1: READ counter (0)
// T2: READ counter (0)     <-- reads stale value!
// T1: WRITE counter (1)
// T2: WRITE counter (1)    <-- overwrites T1's write!
// Lost update! Counter = 1 instead of 2
//
// Run full simulation: show final counter value varies each run (1500-1900 range)
// Histogram of outcomes over 100 runs
//
// Fix: add mutex lock around read-modify-write
// T1: LOCK -> READ(0) -> WRITE(1) -> UNLOCK
// T2: LOCK (blocked) -> READ(1) -> WRITE(2) -> UNLOCK
// Show: consistent 2000 result
//
// Also show: atomic operations (compare-and-swap) as alternative fix
```

### Event Loop Visualization (async/await)

```typescript
// Visual panels:
// [Call Stack] [Web API / Node API] [Microtask Queue] [Macrotask Queue] [Output]
//
// User pastes JavaScript/TypeScript code (Monaco editor)
// Step through execution showing:
// 1. Synchronous code goes on call stack
// 2. setTimeout -> callback goes to Web API, timer runs
// 3. Promise.resolve().then() -> microtask queue
// 4. await -> suspends function, rest goes to microtask queue
// 5. Call stack empties -> drain microtask queue FIRST (all of them)
// 6. Then pick ONE macrotask (setTimeout callback)
// 7. After macrotask, drain microtask queue again
// 8. Repeat
//
// Example code:
// console.log('1');
// setTimeout(() => console.log('2'), 0);
// Promise.resolve().then(() => console.log('3'));
// console.log('4');
//
// Output: 1, 4, 3, 2
// Show: why 3 comes before 2 (microtask priority)
//
// Advanced example:
// async function foo() {
//   console.log('A');
//   await Promise.resolve();
//   console.log('B');
// }
// foo();
// console.log('C');
// Output: A, C, B
//
// Preset examples: fetch chains, nested promises, mixed async/setTimeout, requestAnimationFrame
```

### Go Goroutine Visualization

```typescript
// Visual: M goroutine timelines showing execution, communication via channels
//
// Concepts visualized:
// 1. Goroutine creation: `go func()` spawns new timeline
// 2. Channel communication:
//    - Unbuffered: sender blocks until receiver ready (show rendezvous)
//    - Buffered(n): sender blocks when buffer full, receiver blocks when empty
//    - Visual: channel as a pipe between goroutines, data items flowing through
// 3. Select statement: goroutine listens on multiple channels, first ready wins
//    Show: multiple channels feeding into select, highlight which fires
// 4. WaitGroup: counter counting goroutines. Add(n), Done(), Wait()
//    Show: counter decrementing as goroutines complete, Wait() unblocks at 0
// 5. Deadlock detection:
//    Example: two goroutines each waiting to send on the other's channel
//    Show: both blocked (red), "fatal error: all goroutines are asleep - deadlock!"
//
// Interactive: write Go-like pseudocode, watch goroutine scheduling
// Configurable: GOMAXPROCS (number of OS threads), goroutine count
```

---

## MODULE D: SECURITY & CRYPTOGRAPHY

### OAuth 2.0 / OIDC Flows

```typescript
// Three flows, each animated step-by-step showing HTTP requests/responses:

// 1. Authorization Code + PKCE (recommended for web/mobile)
// Participants: User, Browser, Auth Server, Resource Server
//
// Step 1: Browser generates code_verifier (random), code_challenge = SHA256(code_verifier)
// Step 2: Browser redirects to Auth Server:
//   GET /authorize?response_type=code&client_id=X&redirect_uri=Y
//       &code_challenge=Z&code_challenge_method=S256&scope=openid+profile
// Step 3: User logs in at Auth Server (show login form)
// Step 4: Auth Server redirects back: GET /callback?code=AUTH_CODE
// Step 5: Browser -> Auth Server (back-channel):
//   POST /token { grant_type: authorization_code, code: AUTH_CODE,
//                 code_verifier: ORIGINAL_VERIFIER, client_id: X }
// Step 6: Auth Server validates code + verifier, returns:
//   { access_token: "...", refresh_token: "...", id_token: "...(JWT)...", expires_in: 3600 }
// Step 7: Browser -> Resource Server: GET /api/me, Authorization: Bearer ACCESS_TOKEN
// Step 8: Resource Server validates token, returns protected resource
//
// Show: each HTTP request/response with full headers, PKCE preventing interception attack

// 2. Client Credentials (machine-to-machine)
// POST /token { grant_type: client_credentials, client_id: X, client_secret: Y, scope: "api" }
// Returns access_token (no refresh token, no user context)
// Show: used for service-to-service communication

// 3. Device Authorization (smart TV, CLI)
// Step 1: Device -> POST /device/code { client_id: X, scope: "openid" }
//   Returns: { device_code, user_code: "ABCD-1234", verification_uri, interval, expires_in }
// Step 2: Device displays: "Go to https://auth.example.com/activate and enter code ABCD-1234"
// Step 3: User opens URL on phone/laptop, enters code, approves
// Step 4: Device polls: POST /token { grant_type: device_code, device_code: X, client_id: Y }
//   Returns "authorization_pending" until user approves, then returns access_token
// Show: polling mechanism with interval, timeout handling
```

### JWT Deep Dive

```typescript
// Visual: JWT split into 3 color-coded parts
// RED:    Header  = base64url({ "alg": "RS256", "typ": "JWT", "kid": "key-1" })
// PURPLE: Payload = base64url({ "sub": "user123", "name": "Alice", "iat": 1710000000,
//                               "exp": 1710003600, "iss": "https://auth.example.com",
//                               "aud": "my-app", "scope": "read write" })
// BLUE:   Signature = RS256(base64url(header) + "." + base64url(payload), private_key)
//
// Interactive: edit header/payload fields, see encoded JWT update in real time
//
// Validation Flow:
// 1. Split token at dots
// 2. Decode header, check alg
// 3. Fetch signing key (from JWKS endpoint using kid)
// 4. Verify signature
// 5. Check exp > now (not expired)
// 6. Check iss matches expected issuer
// 7. Check aud matches this application
// 8. Token valid! Extract claims from payload
//
// Refresh Flow:
// 1. Access token expired (exp < now)
// 2. POST /token { grant_type: refresh_token, refresh_token: "..." }
// 3. Auth server validates refresh token, issues new access_token + new refresh_token
// 4. Old refresh token revoked (rotation)
//
// Attack Demos:
// 1. "none" algorithm attack: change alg to "none", remove signature
//    Show: server that doesn't validate alg accepts forged token
//    Fix: always whitelist accepted algorithms
// 2. Replay attack: capture token, use from different client
//    Show: token works until expiry. Fix: short expiry, jti claim, binding to client
// 3. Key confusion: RS256 token validated with HS256 using public key as secret
//    Show: forged token accepted. Fix: always enforce expected algorithm
```

### AES Encryption Visualization

```typescript
// AES-128: 10 rounds on a 4x4 byte state matrix (128-bit block)
//
// Visual: 4x4 grid of bytes, each round transforms the grid
// Input: 16-byte plaintext block (shown as hex grid)
//
// Round structure (each step animated on the matrix):
// 1. AddRoundKey (Round 0): XOR state with round key
//    Show: state matrix XOR'd byte-by-byte with key matrix -> result matrix
//
// 2-10. For each round:
//    a. SubBytes: each byte replaced via S-Box lookup
//       Show: each byte highlighted, lookup in 16x16 S-Box table, new value appears
//    b. ShiftRows: rows shifted left by 0,1,2,3 positions
//       Show: row 0 stays, row 1 shifts 1, row 2 shifts 2, row 3 shifts 3 (animated slide)
//    c. MixColumns (skip in round 10): each column multiplied by fixed matrix in GF(2^8)
//       Show: column extraction, matrix multiplication, result placed back
//    d. AddRoundKey: XOR with round-specific subkey
//       Show: key schedule derivation (RotWord, SubWord, Rcon XOR)
//
// Interactive controls: step through each sub-operation within each round
// Show: cumulative diffusion -- change 1 input bit, watch how many output bits change per round
// Side panel: key expansion showing how 128-bit key generates 11 round keys
```

### Diffie-Hellman Key Exchange

```typescript
// Two visualizations side by side:

// LEFT: Paint Mixing Analogy
// 1. Alice and Bob agree on a common color: Yellow
// 2. Alice picks secret color: Red. Bob picks secret color: Blue.
// 3. Alice mixes Yellow + Red = Orange (sends to Bob)
// 4. Bob mixes Yellow + Blue = Green (sends to Alice)
// 5. Alice mixes Green + Red = Brown (shared secret!)
// 6. Bob mixes Orange + Blue = Brown (same shared secret!)
// Even though Eve sees Yellow, Orange, Green, she cannot derive Brown
// (unmixing colors is "hard" = discrete logarithm problem)

// RIGHT: Mathematical Version
// 1. Public parameters: prime p, generator g
// 2. Alice: secret a, computes A = g^a mod p, sends A to Bob
// 3. Bob: secret b, computes B = g^b mod p, sends B to Alice
// 4. Alice: computes s = B^a mod p = g^(ab) mod p
// 5. Bob: computes s = A^b mod p = g^(ab) mod p
// Same shared secret! Eve sees g, p, A, B but cannot compute g^(ab) mod p
//
// Interactive: choose small p and g, pick secret a and b, see computation step by step
// Show: with real-world parameters (2048-bit p), discrete log is infeasible
// Show: ECDHE variant (elliptic curve version, smaller keys, same security)
```

### CORS Flow Simulator

(See Networking section above -- same component, accessible from both Networking and Security modules.)

---

## MODULE E: ML SYSTEM DESIGN

### Enhanced TF Playground (Neural Network Visualizer)

```typescript
export interface NeuralNetworkState {
  layers: LayerConfig[];
  learningRate: number;           // 0.00001 - 10, log scale slider
  activation: ActivationFunction;
  regularization: RegularizationType;
  regularizationRate: number;     // 0 - 1
  batchSize: number;              // 1, 10, 30, 50, 100
  dataset: DatasetType;
  epoch: number;
  trainingLoss: number;
  testLoss: number;
  isTraining: boolean;
  weights: Float32Array[];        // weight matrices between layers
  biases: Float32Array[];
}

export interface LayerConfig {
  type: "dense" | "conv2d" | "dropout" | "batchnorm";
  neurons: number;                // 1-16 for dense
  // conv2d specific:
  filters?: number;
  kernelSize?: number;
  stride?: number;
  padding?: "same" | "valid";
  // dropout specific:
  dropoutRate?: number;           // 0.1 - 0.9
}

export type ActivationFunction = "ReLU" | "Tanh" | "Sigmoid" | "Linear" | "LeakyReLU" | "ELU" | "Swish";
export type RegularizationType = "None" | "L1" | "L2" | "L1+L2";

export type DatasetType =
  | "circle" | "xor" | "gaussian" | "spiral"   // 2D classification
  | "regression-line" | "regression-curve";      // 1D regression
```

**Visual Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ [Dataset ▼] [Activation ▼] [Learning Rate slider] [Train/Stop]│
├──────────────┬─────────────────────┬───────────────────────────┤
│  Input       │  Network Diagram    │  Decision Boundary        │
│  Features    │  o---o---o---o---o  │  (2D scatter plot with    │
│  x1 ●       │  o---o---o---o---o  │   colored regions showing │
│  x2 ●       │  o---o---o---o---o  │   classification surface) │
│  x1^2 ●     │                     │                           │
│  x2^2 ●     │  [Layer controls]   │  ● class 1  ○ class 2    │
│  x1*x2 ●    │  [+/- neurons]      │                           │
│  sin(x1) ●  │  [+/- layers]       │  Epoch: 342               │
│              │                     │  Train loss: 0.023        │
├──────────────┤                     │  Test loss: 0.041         │
│ Neuron       │                     │                           │
│ Heatmaps     │                     │                           │
│ [grid views  │                     │                           │
│  per neuron] │                     │                           │
├──────────────┼─────────────────────┴───────────────────────────┤
│ Loss Curve (train + test over epochs)  │ Training History      │
│ ─── train loss                         │ Snapshots every 50ep  │
│ --- test loss                          │ Click to restore      │
└────────────────────────────────────────┴───────────────────────┘
```

**Additional features beyond TF Playground:**
1. **CNN Layer**: show convolutional filters as small grids, feature maps as heatmaps, pooling operations
2. **Dropout Visualization**: during training, show randomly zeroed neurons (crossed out). During inference, all active (with scaling)
3. **Batch Normalization**: show per-layer distribution of activations before/after batchnorm (histogram shifting to N(0,1))
4. **Loss Landscape 3D**: 3D surface plot of loss as function of 2 principal weight dimensions. Show gradient descent trajectory as a path on the surface. Minima, saddle points visible.
5. **Weight Visualization**: connection thickness = |weight|, color = sign (blue=positive, red=negative)
6. **Gradient Flow**: during backprop step, show gradient magnitude flowing backward through layers. Detect vanishing/exploding gradients.

### ML Pipeline Builder

Drag-and-drop pipeline builder for ML system design.

```typescript
export interface MLPipelineStage {
  id: string;
  type: PipelineStageType;
  name: string;
  config: Record<string, unknown>;
  inputs: string[];              // IDs of upstream stages
  outputs: string[];             // IDs of downstream stages
  status: "idle" | "running" | "complete" | "failed";
}

export type PipelineStageType =
  | "data-source"       // Kafka, S3, Database, API
  | "data-validation"   // Schema validation, anomaly detection
  | "feature-engineering" // Transforms, aggregations, embeddings
  | "feature-store"     // Online (Redis) + Offline (S3/BigQuery)
  | "train-test-split"  // stratified, time-based, random
  | "training"          // Model training with hyperparameters
  | "evaluation"        // Metrics: AUC, precision, recall, F1, RMSE
  | "model-registry"    // Version control for models
  | "serving"           // REST API, gRPC, batch inference
  | "monitoring"        // Data drift, model drift, latency
  | "feedback-loop"     // User feedback -> retraining trigger
  | "ab-test";          // Traffic splitting for model comparison
```

**Pipeline Templates:**

1. **Spotify Recommendation Pipeline:**
   ```
   User Events (Kafka) -> Feature Engineering (listening history, audio features, user embedding)
   -> Feature Store -> Candidate Generation (collaborative filtering, 1000 candidates)
   -> Ranking Model (neural ranker, 1000 -> 30) -> Business Rules (diversity, freshness)
   -> Serving (Discover Weekly playlist)
   ```

2. **TikTok Ranking Pipeline:**
   ```
   User Interactions -> Feature Engineering (watch time, engagement, user/video embeddings)
   -> Candidate Generation (millions -> 1000, using inverted index + embedding ANN)
   -> Coarse Ranking (simple model, 1000 -> 200)
   -> Fine Ranking (complex DNN, 200 -> 50)
   -> Re-Ranking (diversity, creator fairness, 50 -> 10)
   -> Serving (For You Feed)
   ```

3. **Fraud Detection Pipeline:**
   ```
   Transaction Events (real-time) -> Feature Engineering (velocity, amount deviation, geo distance)
   -> Feature Store (point-in-time correctness!) -> Real-time Model (gradient boosting, <50ms)
   -> Rule Engine (hard rules: blocked countries, amount limits)
   -> Decision (approve/decline/review) -> Feedback (chargebacks -> retraining)
   ```

### Feature Store

```typescript
// Visual: two storage backends connected by a sync pipeline
//
// Online Store (Redis/DynamoDB):
// - Low latency (<10ms) key-value lookups
// - Keyed by entity ID (user_id, item_id)
// - Features precomputed and materialized
// - Show: request flow (serving -> online store -> features -> model)
//
// Offline Store (S3/BigQuery):
// - Full historical feature data
// - Used for training data generation
// - Point-in-time correctness: features as of training timestamp
//   (prevent data leakage: don't use future features for past labels)
// - Show: training pipeline reading offline store with timestamp filter
//
// Sync Pipeline:
// - Batch: daily/hourly job computes features, writes to both stores
// - Streaming: real-time feature computation from event stream
// - Show: data flow from raw events -> feature computation -> both stores
//
// Point-in-time demo:
// Show timeline: feature values at t1, t2, t3
// Training at t2: must use feature values as of t2 (not t3!)
// Show what happens with data leakage: model looks great offline, fails in production
```

### Model Serving Strategies

```typescript
// Visual: traffic flow from clients through serving infrastructure to models

// 1. Single Model:
// All traffic -> Model v1
// Simple, no comparison. Show latency distribution.

// 2. A/B Test (Traffic Split):
// 50% -> Model v1 (control)
// 50% -> Model v2 (treatment)
// Show: consistent user assignment via hash(user_id) % 100
// Metrics: conversion rate, engagement, with confidence intervals
// Statistical significance calculator: sample size, power, MDE

// 3. Shadow Mode:
// 100% -> Model v1 (serves response)
// 100% -> Model v2 (runs but response discarded)
// Compare predictions offline. No user impact.
// Show: prediction disagreement log

// 4. Canary Deployment:
// 1% -> Model v2, 99% -> Model v1
// Monitor error rate, latency
// If healthy: gradually increase (5%, 10%, 25%, 50%, 100%)
// If unhealthy: rollback to 0% (show automatic rollback trigger)

// 5. Multi-Armed Bandit:
// Dynamically allocate traffic based on reward signal
// Algorithms: Epsilon-Greedy (explore with P=epsilon), UCB1, Thompson Sampling
// Show: exploration/exploitation tradeoff, regret curve
// Advantage over A/B: automatically shifts traffic to better model

// 6. Ensemble:
// All models run, combine predictions (average, voting, stacking)
// Show: individual predictions + combined prediction
// When ensemble helps: diverse models, uncorrelated errors
```

### A/B Testing System

```typescript
export interface ABTestConfig {
  id: string;
  name: string;
  variants: Array<{
    id: string;
    name: string;              // "Control", "Treatment A", "Treatment B"
    trafficPercent: number;    // must sum to 100
    modelId?: string;
    featureFlags?: Record<string, unknown>;
  }>;
  assignmentMethod: "user-hash" | "session-hash" | "random";
  primaryMetric: MetricDefinition;
  guardrailMetrics: MetricDefinition[];
  minimumSampleSize: number;
  significanceLevel: number;    // typically 0.05
  statisticalPower: number;     // typically 0.80
  mde: number;                  // minimum detectable effect
}

export interface MetricDefinition {
  name: string;
  type: "conversion" | "continuous" | "count";
  direction: "increase" | "decrease";   // which direction is "better"
  baselineRate: number;
}
```

**User Assignment Animation:**
```
// Show: user_id -> hash(user_id + experiment_salt) -> bucket (0-99)
// Bucket 0-49: Control, Bucket 50-99: Treatment
// Properties:
// - Deterministic: same user always gets same variant
// - Uniform: ~50/50 split across users
// - Independent: salting prevents correlation between experiments
// Visual: stream of user avatars flowing into two buckets
```

**Event Collection:**
```
// Timeline showing events:
// User assigned to variant -> User takes actions -> Events logged
// Events: page_view, click, purchase, scroll_depth, time_on_page
// Show: event stream accumulating in a table per variant
```

**Statistical Analysis Dashboard:**
```
// For each metric:
// Control: mean=0.052 (5.2% conversion), n=15000
// Treatment: mean=0.058 (5.8% conversion), n=15000
// Absolute lift: +0.6pp
// Relative lift: +11.5%
// Z-score: 2.14
// P-value: 0.032 (< 0.05, significant!)
// Confidence Interval: [+0.1pp, +1.1pp]
//
// Formula:
// z = (p_treatment - p_control) / sqrt(p_pooled * (1-p_pooled) * (1/n1 + 1/n2))
// For continuous: t-test with Welch's correction
//
// Power calculator:
// n = (Z_alpha/2 + Z_beta)^2 * (p1*(1-p1) + p2*(1-p2)) / (p1 - p2)^2
//
// Guardrail metrics: show green/red for each (latency not degraded, error rate not increased)
// Sequential testing: show optional stopping boundary (alpha spending function)
```

---

## WHAT SUCCESS LOOKS LIKE (End of Phase 5)

1. TCP: three-way handshake, data transfer with sliding window, four-way teardown, all state transitions animated
2. TLS 1.3: 1-RTT and 0-RTT flows with key derivation, encrypted/plaintext distinction
3. HTTP comparison: side-by-side 1.1/2/3 showing multiplexing, HoL blocking difference with packet loss
4. DNS: full resolution chain with caching at each level, TTL timers
5. WebSocket: upgrade handshake, bidirectional frames, ping/pong, comparison with SSE and long polling
6. gRPC/REST/GraphQL: same operation 3 ways with payload size comparison
7. CDN: cache hit/miss flows, origin shield, geographic POP selection
8. CORS: preflight decision tree, configurable headers, pass/fail for each configuration
9. Process scheduling: all 7 algorithms with Gantt charts, comparison mode, MLFQ queue migration
10. Page replacement: all 5 algorithms step-by-step with hit/miss counters, Belady's anomaly demo
11. Deadlock: RAG visualization, cycle detection, Banker's algorithm step-through
12. Memory: paging with TLB, segmentation, page fault handling
13. Thread sync: mutex, semaphore, monitor, reader-writer lock demos
14. Classic problems: producer-consumer, dining philosophers, readers-writers, sleeping barber all animated
15. Thread lifecycle: state machine with multiple thread timelines
16. Race condition: interleaved execution demo with fix
17. Event loop: call stack + microtask + macrotask queues with custom code input
18. Goroutines: channel communication, select, WaitGroup, deadlock detection
19. OAuth 2.0: all 3 flows with full HTTP request/response details
20. JWT: color-coded structure, validation flow, attack demos
21. AES: state matrix through all 10 rounds with SubBytes/ShiftRows/MixColumns/AddRoundKey
22. Diffie-Hellman: paint analogy + mathematical version with custom parameters
23. Neural network: 1-8 layers, all activations, CNN, dropout, batchnorm, loss landscape 3D
24. ML pipeline: drag-drop builder with 3 templates (Spotify, TikTok, Fraud)
25. Feature store: online/offline with point-in-time correctness demo
26. Model serving: all 6 strategies (single, A/B, shadow, canary, bandit, ensemble) visualized
27. A/B testing: user assignment, event collection, statistical significance calculator with guardrails
