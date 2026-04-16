Now I have a comprehensive understanding of the codebase. Let me compile the complete feature specification.

---

# ARCHITEX -- COMPLETE INTERACTIVE FEATURE SET
## OS, Networking, DevOps, Cloud, Security, SRE Modules

---

## CODEBASE CONTEXT

After thorough analysis of the codebase, here is what exists and what needs to be built:

**Architecture Pattern (established across 13 modules):**
- Each module has a `lib/{module}/` directory with pure TypeScript simulation engines (types + algorithms, no React)
- Each module has a `components/modules/{Module}Module.tsx` with a `use{Module}Module()` hook that returns `ModuleContent` (sidebar, canvas, properties, bottomPanel)
- Wrapper components in `components/modules/wrappers/` bridge module hooks to the layout
- FSRS spaced repetition engine at `lib/interview/srs.ts` with SRS bridge files per module (e.g., `lib/networking/srs-bridge.ts`)
- Simulations are step-based: arrays of typed event objects, stepped through with play/pause/step controls
- Bottom panel has "log" and "learn" tabs
- Lazy-loaded LEARN panel components (e.g., `GCPauseLatencyVisualizer`, `PacketJourneySimulator`, `DDoSSimulationVisualizer`)

**What Already Exists (IMPORTANT -- do not re-specify these):**

OS Module (RICH -- 6 concepts, 15+ simulation engines):
- CPU Scheduling: FCFS, SJF, SRTF, Round Robin, Priority, MLFQ with Gantt chart, comparison mode
- Page Replacement: FIFO, LRU, Optimal, Clock with step-through, Belady's anomaly detection
- Deadlock: RAG cycle detection, Banker's Algorithm with safe sequence
- Memory: Virtual memory address translation, TLB simulation
- Memory Allocation: First Fit, Best Fit, Worst Fit with fragmentation visualization
- Thread Sync: Mutex, Semaphore, Reader-Writer Lock
- BONUS engines (built but not yet in the module UI): context-switch.ts, system-calls.ts, race-condition.ts, thrashing.ts, priority-inversion.ts, cow-fork.ts, buffer-overflow.ts

Networking Module (RICH -- 9 protocols):
- TCP 3-way handshake with state machine
- TLS 1.2 vs 1.3 comparison with 0-RTT
- DNS resolution (recursive, scenarios)
- HTTP/1.1 vs HTTP/2 vs HTTP/3 comparison
- WebSocket lifecycle
- CORS simulator
- CDN flow (cache hit/miss scenarios)
- REST vs GraphQL vs gRPC comparison
- Serialization formats comparison
- BONUS: ARP simulation, DHCP simulation, PacketJourneySimulator, ConnectionPoolVisualization, ProtocolDecisionTree

Security Module (RICH -- 11 topics):
- OAuth 2.0 PKCE, Client Credentials, Device Auth flows
- JWT lifecycle (encode/decode/validate) + JWT attacks (none-algorithm, token replay, algorithm confusion)
- Diffie-Hellman key exchange with paint analogy
- AES-128 step-by-step round visualization
- HTTPS end-to-end flow
- CORS decision flow
- X.509 certificate chain verification
- Password hashing (bcrypt, rainbow table defense)
- Rate limiting (token bucket, sliding window, leaky bucket)
- Web attacks (XSS, CSRF, SQL injection with/without defenses)
- Encryption comparison (symmetric, asymmetric, hybrid)
- BONUS: DDoS simulation visualizer

**What Does NOT Exist (needs to be built):**
- DevOps module (no lib, no component, not in ModuleType)
- Cloud module (no lib, no component, not in ModuleType)
- SRE module (no lib, no component, not in ModuleType)
- Several OS sub-topics have engines but no UI (context switching, system calls, thrashing, priority inversion, COW fork, buffer overflow)
- Several Networking sub-topics have engines but no UI (ARP, DHCP as standalone, load balancing algorithms)
- Some Security topics missing (SSRF has engine but no dedicated viz, CSP has engine but no viz)

---

## 1. OS MODULE -- FEATURES TO ADD

The OS module already has 6 rich concepts. Below are NEW features to add to the existing module.

---

### OS-NEW-01: Context Switching Visualizer (ENGINE EXISTS: context-switch.ts)

**LEARNING**
- Animated timeline showing register save, TLB flush, cache invalidation, register restore, resume phases
- Side-by-side comparison: process context switch (full cost) vs thread context switch (shared address space, skips TLB/cache)
- Cycle cost breakdown bar chart per phase
- Mars Pathfinder real-world callout card

**SIMULATION**
- Step through ContextSwitchEvent[] with configurable process list
- Toggle between "process switch" and "thread switch" mode
- Adjustable cycle costs for each phase (sliders)
- Running total cycles counter with cost-per-switch metrics

**PRACTICE**
- "Predict the cost" -- given a workload, estimate total context switch overhead
- "Process vs Thread" -- classify scenarios (web server, game engine, database) as better-served by processes or threads
- "Optimize the scheduler" -- given a process mix, minimize total context switch cost by reordering

**ASSESSMENT**
- Multiple choice: "Which phase is skipped in thread switches?" (TLB flush)
- Numerical: "Given 1000 context switches/sec, how many CPU cycles lost?" (calculate from costs)
- Ordering: Arrange context switch phases in correct sequence

**REVIEW (SRS)**
- Q: "Why is thread context switching cheaper than process switching?" A: "Threads share the same address space, so TLB flush and cache invalidation are unnecessary. Saves ~500 cycles per switch."
- Q: "What caused the Mars Pathfinder reset bug?" A: "Priority inversion during context switching -- high-priority task starved by medium-priority tasks through shared mutex."

**AI**
- Given a workload description (e.g., "100 concurrent HTTP requests"), AI recommends process vs thread model with cycle cost estimate
- AI generates custom process sets for context switch cost analysis

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | S | Engine exists, needs UI |

---

### OS-NEW-02: System Call Lifecycle Visualizer (ENGINE EXISTS: system-calls.ts)

**LEARNING**
- Ring diagram (Ring 3 user mode -> Ring 0 kernel mode) with animated transitions
- Step-by-step: user request -> trap instruction -> mode switch -> kernel handler -> return -> resume
- Category-organized syscall catalog (file, process, memory, network) with real cycle costs
- Callout: INT 0x80 vs SYSCALL instruction comparison

**SIMULATION**
- Pick any syscall from catalog, watch full lifecycle animation
- Cycle cost accumulator showing overhead per phase
- Compare syscalls side-by-side (open() vs mmap() vs fork())
- "Batch syscalls" mode showing amortized overhead

**PRACTICE**
- "Trace the syscall" -- given a C code snippet, identify which syscalls are invoked
- "Estimate overhead" -- given a program with N syscalls, calculate total overhead cycles
- "Minimize syscalls" -- refactor code to reduce syscall count (e.g., buffered vs unbuffered I/O)

**ASSESSMENT**
- Match syscall to category (open -> file, fork -> process, mmap -> memory, socket -> network)
- "What is the purpose of the trap instruction?" (multiple choice)
- "Why is SYSCALL faster than INT 0x80?" (short answer)

**REVIEW (SRS)**
- Q: "What privilege transition occurs during a system call?" A: "CPU switches from Ring 3 (user) to Ring 0 (kernel) via trap/SYSCALL instruction. This requires saving user-mode state and loading kernel stack."
- Q: "Why does mmap() have higher overhead than read()?" A: "mmap() requires modifying page tables and potentially TLB entries, while read() just copies bytes to a user buffer."

**AI**
- Paste a code snippet, AI identifies all implicit syscalls and estimates total overhead
- AI generates "reduce syscall overhead" challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 7 | 6 | S | Engine exists, needs UI |

---

### OS-NEW-03: Thrashing & Working Set Visualizer (ENGINE EXISTS: thrashing.ts)

**LEARNING**
- CPU utilization vs multiprogramming degree curve (the classic Denning 1968 graph)
- Animated: add processes one-by-one, watch utilization rise then cliff-dive at thrashing point
- Working set model explanation with sliding window visualization
- "Memory pressure gauge" showing total working set demand vs physical RAM

**SIMULATION**
- Interactive slider: add/remove processes, see real-time CPU utilization and page fault rate
- Toggle working set prevention on/off to see the difference
- Adjustable physical memory size, working set sizes per process
- Page fault rate sparkline that spikes at thrashing onset

**PRACTICE**
- "Find the thrashing point" -- given process working sets and RAM size, predict when thrashing begins
- "Right-size the system" -- given a workload, determine minimum RAM to avoid thrashing
- "Working set tuning" -- adjust window size parameter to optimize working set estimation

**ASSESSMENT**
- "What happens to CPU utilization during thrashing?" (it drops, counter-intuitive)
- "How does the working set model prevent thrashing?" (explanation)
- Graph interpretation: given a utilization curve, identify thrashing onset

**REVIEW (SRS)**
- Q: "Why does adding more processes eventually DECREASE CPU utilization?" A: "When total working sets exceed physical RAM, processes spend most time page-faulting (waiting for disk I/O) rather than executing instructions. Disk becomes the bottleneck."
- Q: "What is the working set model?" A: "Track each process's recently-used pages (its locality). Only admit new processes if their combined working sets fit in physical memory."

**AI**
- Given a server's RAM and process profiles, AI predicts thrashing risk and recommends optimal process count
- AI generates custom working set scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | S | Engine exists, needs UI |

---

### OS-NEW-04: Priority Inversion with Mars Pathfinder (ENGINE EXISTS: priority-inversion.ts)

**LEARNING**
- Three-task timeline: High (meteorological data), Medium (communications), Low (info bus management)
- Animated demonstration: Low holds mutex -> Medium preempts Low -> High blocked waiting for mutex -> System reset
- Priority inheritance fix: Low temporarily boosted to High's priority
- Mars Pathfinder case study narrative with real mission details

**SIMULATION**
- Step through PriorityInversionEvent[] timeline with play/pause
- Toggle "Priority Inheritance" on/off to see fix
- Configurable task priorities and burst times
- Inversion duration counter showing blocked ticks

**PRACTICE**
- "Diagnose the inversion" -- given a task schedule with mutex contention, identify the inversion
- "Apply the fix" -- choose correct protocol (priority inheritance, priority ceiling, or neither)
- "Design safe locking" -- order mutex acquisitions to prevent inversion chains

**ASSESSMENT**
- "Which task is ACTUALLY causing the high-priority task to wait?" (Medium, not Low -- counter-intuitive)
- "What protocol fixed the Mars Pathfinder bug?" (priority inheritance in VxWorks RTOS)
- Scenario-based: given 4 tasks and 2 mutexes, identify if priority inversion can occur

**REVIEW (SRS)**
- Q: "In priority inversion, the high-priority task waits for the low-priority task. But what REALLY causes the delay?" A: "Medium-priority tasks that don't need the mutex preempt the low-priority task (which holds the mutex), preventing it from releasing. The high-priority task is transitively blocked by ALL medium-priority tasks."
- Q: "How does priority inheritance solve priority inversion?" A: "Temporarily boost the mutex-holder to the priority of the highest-priority waiter. This prevents medium-priority tasks from preempting the holder, so it releases the mutex quickly."

**AI**
- AI analyzes a mutex dependency graph and identifies potential priority inversion scenarios
- AI generates real-world RTOS scheduling challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 9 | S | Engine exists, needs UI |

---

### OS-NEW-05: Copy-on-Write Fork Visualizer (ENGINE EXISTS: cow-fork.ts)

**LEARNING**
- Page table diagram showing parent and child sharing physical frames after fork()
- Animated: fork creates shared mappings -> write triggers page fault -> lazy copy to new frame
- Reference counter visualization on each physical frame
- Cost comparison: naive fork (copy everything) vs COW fork (copy on demand)

**SIMULATION**
- Step through COWEvent[] with configurable page count
- Click on pages to trigger writes, watch lazy copies happen
- Reference count animation on shared frames
- Memory usage counter showing savings vs naive fork

**PRACTICE**
- "Predict the copies" -- given a fork + write pattern, predict which pages get copied
- "Calculate savings" -- given a 1GB process that forks then exec()s, how much memory is saved?
- "fork() + exec() optimization" -- explain why COW makes this pattern efficient

**ASSESSMENT**
- "After fork(), how many physical frames are duplicated?" (zero -- all shared)
- "What triggers a page copy in COW?" (write to a shared page causes page fault)
- "Why is fork() + exec() efficient with COW?" (exec replaces address space, so no pages ever need copying)

**REVIEW (SRS)**
- Q: "How does COW fork() avoid copying the entire address space?" A: "Both parent and child page tables point to the same physical frames, marked read-only. Only when a process writes to a shared page does the OS copy that single page to a new frame."
- Q: "What happens to the reference count when a COW page is written?" A: "The OS allocates a new frame, copies the old page, updates the writer's page table, and decrements the original frame's reference count."

**AI**
- AI estimates COW savings for real workloads (e.g., "nginx worker fork pattern")
- AI generates fork/exec optimization challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | S | Engine exists, needs UI |

---

### OS-NEW-06: Buffer Overflow Attack & Defense (ENGINE EXISTS: buffer-overflow.ts)

**LEARNING**
- Stack frame visualization: local vars, saved FBP, return address, buffer
- Animated: user input fills buffer byte-by-byte, overflows into saved FBP, then corrupts return address
- Defense mechanisms: stack canary detection, ASLR randomization
- Real CVE case study (e.g., Morris Worm 1988)

**SIMULATION**
- Step through OverflowEvent[] with play/pause
- Input field where user types the "exploit payload"
- Toggle defenses: none, canary, ASLR, both
- Stack memory visualization with colored regions (buffer, FBP, return addr)

**PRACTICE**
- "Craft the exploit" -- given buffer size and target return address, construct the overflow payload
- "Detect the defense" -- identify which defense mechanism stopped the exploit
- "Secure the code" -- fix vulnerable C code to prevent overflow (bounds checking, strncpy)

**ASSESSMENT**
- "What memory region does a buffer overflow corrupt first after the buffer?" (saved frame pointer)
- "How does a stack canary detect overflow?" (random value between buffer and return address, checked before function returns)
- "Why doesn't ASLR completely prevent buffer overflows?" (information leaks can reveal addresses)

**REVIEW (SRS)**
- Q: "In a stack buffer overflow, what is the attacker's goal?" A: "Overwrite the return address on the stack with a pointer to attacker-controlled code (shellcode) or a ROP gadget chain."
- Q: "How does a stack canary work?" A: "A random value placed between the buffer and saved return address. If the canary value changes, the program detects overflow and aborts before the corrupted return address is used."

**AI**
- AI generates custom vulnerable code snippets for exploit analysis
- AI explains real CVEs step-by-step

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 9 | S | Engine exists, needs UI |

---

### OS-NEW-07: I/O Scheduling Algorithms (NEW ENGINE NEEDED)

**LEARNING**
- Disk arm visualization: circular track layout with head position
- Animated: requests arrive, head moves according to algorithm
- Algorithms: FCFS, SSTF (Shortest Seek Time First), SCAN (elevator), C-SCAN, LOOK, C-LOOK
- Seek time comparison bar chart across algorithms

**SIMULATION**
- Configure disk parameters: track count, head start position, request queue
- Step through head movements with seek distance accumulator
- Side-by-side algorithm comparison (like CPU scheduling comparison mode)
- "Starvation detector" for SSTF showing starved requests

**PRACTICE**
- "Predict the seek sequence" -- given a request queue and algorithm, predict head movement order
- "Minimize total seek" -- arrange requests to minimize total seek distance
- "Choose the algorithm" -- given workload characteristics, recommend the best I/O scheduler

**ASSESSMENT**
- Calculate total seek distance for a given algorithm and request set
- "Which algorithm can cause starvation?" (SSTF)
- "Why is C-SCAN fairer than SCAN?" (uniform wait time, no bias toward middle tracks)

**REVIEW (SRS)**
- Q: "How does the SCAN (elevator) algorithm work?" A: "Head moves in one direction, servicing all requests along the way, then reverses direction. Like an elevator servicing floors."
- Q: "What is the advantage of C-SCAN over SCAN?" A: "C-SCAN only services in one direction, then jumps to the other end. This provides more uniform wait times since recently-serviced tracks don't get re-serviced on the return trip."

**AI**
- AI generates disk request patterns that highlight specific algorithm weaknesses
- AI recommends scheduler based on workload description

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | M | No -- new engine needed |

---

### OS-NEW-08: File System Structure Explorer (NEW ENGINE NEEDED)

**LEARNING**
- Interactive inode/block diagram: superblock -> inode table -> data blocks
- Directory tree visualization with inode pointers
- File operations: create, read, write, delete showing block allocation
- Comparison: ext4 (journaling) vs FAT32 (file allocation table) vs ZFS (copy-on-write)

**SIMULATION**
- Create files and directories, watch inode allocation and block mapping
- Write to files, see direct/indirect block pointer chains
- Delete files, observe block deallocation and inode freeing
- Journaling mode: see write-ahead log entries before data commits

**PRACTICE**
- "Trace the file read" -- given an inode number, follow pointer chain to data blocks
- "Recover the file" -- given a partially corrupted file system, identify recoverable data
- "Calculate max file size" -- given block size and pointer structure, compute maximum file size

**ASSESSMENT**
- "How many levels of indirect blocks does ext4 support?" (triple indirect)
- "What is the purpose of the superblock?" (file system metadata: block size, inode count, free blocks)
- "Why does journaling improve reliability?" (crash recovery without full fsck)

**REVIEW (SRS)**
- Q: "What is an inode?" A: "A data structure storing file metadata (permissions, timestamps, size) and pointers to data blocks. Does NOT store the filename -- that's in the directory entry."
- Q: "How does journaling prevent data corruption on crash?" A: "Changes are first written to a journal (write-ahead log). If the system crashes, the journal is replayed on recovery to complete or undo partial operations."

**AI**
- AI generates file system recovery scenarios
- AI explains real file system bugs (ext4 delayed allocation data loss)

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 7 | 6 | L | No -- new engine needed |

---

### OS-NEW-09: Process vs Thread Deep Dive (NEW ENGINE NEEDED)

**LEARNING**
- Side-by-side: process (separate address space, PCB, file descriptors) vs thread (shared address space, own stack/registers)
- Memory layout comparison: two processes vs two threads in one process
- Creation cost comparison with animated timelines
- IPC mechanisms: pipes, shared memory, message queues for processes vs direct shared memory for threads

**SIMULATION**
- "Create process" vs "Create thread" buttons showing different setup steps
- Shared memory visualization: threads read/write same data, processes use IPC
- Crash isolation demo: thread crash kills process, process crash isolates
- Resource table: memory usage, creation time, communication overhead

**PRACTICE**
- "Architecture decision" -- given requirements (isolation, performance, shared state), recommend process or thread model
- "Debug the crash" -- identify whether a bug in one component will affect others based on process/thread model
- "Estimate overhead" -- calculate memory overhead for N processes vs N threads

**ASSESSMENT**
- "What is shared between threads in the same process?" (address space, file descriptors, heap)
- "What is private to each thread?" (stack, registers, program counter)
- "Why is thread creation faster than process creation?" (no address space duplication)

**REVIEW (SRS)**
- Q: "If one thread segfaults, what happens to other threads in the same process?" A: "All threads die. A segfault terminates the entire process because threads share the same address space. This is the key tradeoff: threads are faster but less isolated."
- Q: "Name three things shared between threads and three things private to each thread." A: "Shared: address space, file descriptors, heap. Private: stack, registers, program counter (thread-local storage optional)."

**AI**
- AI analyzes a system architecture and recommends process vs thread boundaries
- AI generates multi-threading bug scenarios (race conditions, deadlocks)

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 6 | M | No -- new engine needed |

---

## 2. NETWORKING MODULE -- FEATURES TO ADD

The networking module already has 9 rich protocol simulations. Below are NEW features.

---

### NET-NEW-01: Load Balancing Algorithms Visualizer (NEW ENGINE NEEDED)

**LEARNING**
- Server pool visualization with health indicators and current connection counts
- Animated request routing for each algorithm
- Algorithms: Round Robin, Weighted Round Robin, Least Connections, IP Hash, Consistent Hashing, Random
- Session affinity (sticky sessions) explanation with and without

**SIMULATION**
- Configure server pool: count, weights, health status, max connections
- Send request bursts, watch routing decisions in real-time
- Kill/add servers mid-simulation, observe redistribution
- Side-by-side algorithm comparison for same traffic pattern
- Consistent hashing ring visualization (reuse distributed module's engine)

**PRACTICE**
- "Predict the route" -- given server state and algorithm, predict which server handles next request
- "Handle the failure" -- server goes down mid-session, determine what happens to in-flight requests
- "Choose the algorithm" -- given requirements (stateful sessions, heterogeneous servers, etc.), recommend algorithm

**ASSESSMENT**
- "Why is Least Connections better than Round Robin for variable-latency backends?" (accounts for slow requests holding connections open)
- "What happens to session affinity when a server fails?" (sessions lost unless backed by external session store)
- "How does consistent hashing minimize key redistribution when a server joins/leaves?" (only keys between the new/removed node and its predecessor move)

**REVIEW (SRS)**
- Q: "When should you use Weighted Round Robin over plain Round Robin?" A: "When backend servers have different capacities. A server with 2x CPU gets 2x the weight, receiving proportionally more requests."
- Q: "What is the thundering herd problem with load balancers?" A: "When a failed server recovers, ALL backed-up requests flood to it simultaneously, potentially crashing it again. Solution: gradual ramp-up / slow start."

**AI**
- AI generates traffic patterns that expose specific algorithm weaknesses
- AI recommends load balancing strategy based on architecture description

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | M | No -- new engine needed (consistent-hash.ts exists in distributed module, can reuse) |

---

### NET-NEW-02: ARP Resolution Visualizer (ENGINE EXISTS: arp-simulation.ts)

**LEARNING**
- LAN topology with hosts, switch, and ARP cache tables
- Animated: ARP request broadcast -> target responds with MAC -> cache updated
- ARP cache aging and expiry
- ARP spoofing attack and defense explanation

**SIMULATION**
- Step through ARP resolution for a given target IP
- ARP cache table visible per host, updated in real-time
- ARP spoofing mode: malicious host sends fake ARP replies
- Gratuitous ARP demonstration

**PRACTICE**
- "Fill the ARP cache" -- predict ARP cache state after a series of communications
- "Detect the spoof" -- identify which ARP entries are poisoned
- "Optimize the network" -- minimize ARP broadcasts in a given topology

**ASSESSMENT**
- "Why is ARP broadcast-based?" (sender doesn't know target's MAC, must ask everyone)
- "How does ARP spoofing enable MITM attacks?" (attacker associates their MAC with victim's IP)
- "What is a gratuitous ARP?" (host broadcasts its own IP-MAC mapping, used for IP conflict detection)

**REVIEW (SRS)**
- Q: "What layer does ARP operate at?" A: "Layer 2 (Data Link) -- it maps Layer 3 IP addresses to Layer 2 MAC addresses."
- Q: "Why is ARP stateless and trusting?" A: "ARP has no authentication. Any host can claim any IP-MAC mapping. This simplicity enabled the protocol but makes ARP spoofing trivial."

**AI**
- AI generates network topologies for ARP analysis
- AI explains real ARP-based attacks

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 6 | 5 | S | Engine exists, needs UI |

---

### NET-NEW-03: TCP Congestion Control Visualizer (NEW ENGINE NEEDED)

**LEARNING**
- Congestion window (cwnd) graph over time showing slow start, congestion avoidance, fast retransmit, fast recovery
- Animated packet flow showing window size changes
- Algorithms: Tahoe, Reno, New Reno, CUBIC, BBR
- ssthresh line on graph showing threshold transitions

**SIMULATION**
- Configure: initial cwnd, ssthresh, packet loss events
- Watch cwnd grow exponentially (slow start) then linearly (congestion avoidance)
- Trigger packet loss events, see algorithm-specific responses (Tahoe resets to 1, Reno halves)
- Side-by-side algorithm comparison for same loss pattern

**PRACTICE**
- "Draw the cwnd graph" -- given loss events at specific ACKs, sketch the congestion window
- "Identify the algorithm" -- given a cwnd graph, determine which algorithm produced it
- "Optimize for the network" -- given RTT and loss rate, recommend best congestion control algorithm

**ASSESSMENT**
- "What is the difference between slow start and congestion avoidance?" (exponential vs linear growth)
- "Why does TCP Tahoe reset cwnd to 1 on loss while Reno halves it?" (Tahoe is conservative, Reno uses fast recovery)
- "What problem does BBR solve that loss-based algorithms can't?" (bufferbloat -- BBR measures actual bandwidth, not inferred from loss)

**REVIEW (SRS)**
- Q: "What triggers the transition from slow start to congestion avoidance?" A: "When cwnd reaches ssthresh (slow start threshold). Growth changes from exponential (double every RTT) to linear (increase by 1 MSS per RTT)."
- Q: "Why is CUBIC the default in Linux?" A: "CUBIC uses a cubic function for window growth, making it more aggressive in high-bandwidth networks while remaining stable. It's less dependent on RTT than Reno, giving fairer performance across different network paths."

**AI**
- AI analyzes network conditions and recommends congestion control algorithm
- AI generates loss pattern challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | L | No -- new engine needed |

---

### NET-NEW-04: TCP Flow Control Visualizer (NEW ENGINE NEEDED)

**LEARNING**
- Sliding window diagram: sender window, receiver window, acknowledgments
- Animated: sender sends segments, receiver ACKs with window size, sender adjusts
- Window scaling explanation for high-bandwidth networks
- Zero window probe mechanism

**SIMULATION**
- Configure: receiver buffer size, sender data rate, processing speed
- Watch receive window shrink as buffer fills, grow as application reads
- Trigger slow receiver scenario (window goes to 0)
- Zero window probe timer and recovery animation

**PRACTICE**
- "Calculate throughput" -- given window size and RTT, compute maximum throughput (bandwidth-delay product)
- "Debug the stall" -- receiver window went to 0, trace the recovery sequence
- "Window scaling" -- given 64KB base and scale factor 7, compute effective window size

**ASSESSMENT**
- "What is the bandwidth-delay product?" (window_size / RTT = max throughput)
- "Why can't the sender send faster than the receiver window allows?" (flow control prevents receiver buffer overflow)
- "What happens when the receive window reaches 0?" (sender stops, sends periodic probes until window opens)

**REVIEW (SRS)**
- Q: "How does TCP flow control differ from congestion control?" A: "Flow control prevents overwhelming the RECEIVER (based on receive window). Congestion control prevents overwhelming the NETWORK (based on congestion window). Effective window = min(cwnd, rwnd)."
- Q: "What is the bandwidth-delay product and why does it matter?" A: "BDP = bandwidth x RTT. It represents the amount of data 'in flight' that can fill the pipe. TCP window must be >= BDP to fully utilize the link."

**AI**
- AI calculates optimal window sizes for given network conditions
- AI generates flow control debugging scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | M | No -- new engine needed |

---

### NET-NEW-05: DHCP Lease Lifecycle (ENGINE EXISTS: dhcp-simulation.ts)

**LEARNING**
- DORA sequence diagram: Discover -> Offer -> Request -> Acknowledge
- Animated: broadcast discover, server offer, client request, server acknowledge
- Lease timer visualization with renewal (T1) and rebinding (T2) timelines
- DHCP relay agent for multi-subnet scenarios

**SIMULATION**
- Step through DHCP DORA handshake
- Lease timer countdown with renewal attempt
- Multiple clients competing for limited pool
- Relay agent forwarding across subnets

**PRACTICE**
- "Trace the DORA" -- predict messages for a new client joining the network
- "Handle lease expiry" -- what happens when a client's lease expires and no server responds?
- "Subnet design" -- given requirements, design DHCP scopes and relay configuration

**ASSESSMENT**
- "Why is DHCP Discover a broadcast?" (client doesn't know server IP yet)
- "What is the difference between T1 (renewal) and T2 (rebinding)?" (T1 = unicast to original server, T2 = broadcast to any server)
- "Why does the client broadcast the Request even though it has an Offer?" (to inform other DHCP servers that it chose a different server's offer)

**REVIEW (SRS)**
- Q: "What are the four DHCP messages in order?" A: "Discover (client broadcast), Offer (server unicast/broadcast), Request (client broadcast), Acknowledge (server unicast). Mnemonic: DORA."
- Q: "Why does DHCP use UDP instead of TCP?" A: "The client doesn't have an IP address yet, so it can't establish a TCP connection. UDP allows sending from 0.0.0.0 to 255.255.255.255."

**AI**
- AI generates DHCP troubleshooting scenarios
- AI designs DHCP scope plans for given network topologies

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 6 | 5 | S | Engine exists, needs UI |

---

## 3. DEVOPS MODULE -- ALL NEW

This is a completely new module. Needs: ModuleType addition, lib/devops/ directory, DevOpsModule.tsx, wrapper.

---

### DEVOPS-01: Docker Image Layer Visualizer

**LEARNING**
- Stacked layer diagram: base image -> each Dockerfile instruction adds a layer
- Animated: build process showing layer creation, caching, and size
- Layer sharing between images (shared base layers highlighted)
- Multi-stage build comparison: before (1.2GB) vs after (80MB)
- Layer cache invalidation cascade visualization

**SIMULATION**
- Write Dockerfile instructions (interactive editor), see layers build in real-time
- Drag-and-drop instruction reordering to optimize cache usage
- "Build twice" mode showing cache hits on second build
- Multi-stage builder: split into build stage and runtime stage
- Layer size breakdown pie chart

**PRACTICE**
- "Optimize this Dockerfile" -- given a bad Dockerfile (COPY before deps), reorder for optimal caching
- "Reduce image size" -- take a 1GB image, apply multi-stage and Alpine to minimize
- "Debug the cache miss" -- identify which instruction invalidated the cache and why
- "Layer archaeology" -- given `docker history` output, reconstruct the Dockerfile

**ASSESSMENT**
- "Why should COPY package.json and RUN npm install come before COPY . ?" (cache optimization -- source changes don't invalidate deps layer)
- "What is the difference between ADD and COPY?" (ADD handles URLs and tar extraction, COPY is simpler and preferred)
- "Why does multi-stage build produce smaller images?" (final image only contains runtime stage, not build tools)

**REVIEW (SRS)**
- Q: "What invalidates Docker's build cache?" A: "Any change to a layer invalidates that layer and ALL subsequent layers. This is why frequently-changing files (source code) should be COPY'd last."
- Q: "What is the union filesystem in Docker?" A: "Each layer is a read-only filesystem snapshot. The container adds a writable layer on top. Writes use copy-on-write. Common layers are shared between images."

**AI**
- Paste a Dockerfile, AI scores it and provides optimization recommendations with estimated size reduction
- AI generates Dockerfile optimization challenges from real-world bad examples

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 9 | L | No |

---

### DEVOPS-02: Kubernetes Pod Lifecycle Visualizer

**LEARNING**
- Pod state machine: Pending -> Running -> Succeeded/Failed with animated transitions
- Container lifecycle hooks: postStart, preStop, liveness probe, readiness probe
- Init containers executing sequentially before main containers
- Resource requests vs limits with OOMKill explanation

**SIMULATION**
- Create a Pod spec (YAML editor), watch lifecycle unfold
- Trigger failures: image pull fail, liveness probe fail, OOMKill
- Readiness probe failure: pod exists but removed from Service endpoints
- Init container chain: watch sequential initialization

**PRACTICE**
- "Debug the CrashLoopBackOff" -- given events and logs, identify root cause
- "Configure health checks" -- design liveness and readiness probes for a given application
- "Right-size resources" -- given usage metrics, set appropriate requests and limits
- "Design init containers" -- order initialization dependencies (wait for DB, run migrations)

**ASSESSMENT**
- "What is the difference between liveness and readiness probes?" (liveness = restart if unhealthy, readiness = remove from Service if not ready)
- "Why use resource requests AND limits?" (requests for scheduling, limits for OOM prevention)
- "What causes CrashLoopBackOff?" (container repeatedly crashes, kubelet applies exponential backoff)

**REVIEW (SRS)**
- Q: "What happens when a liveness probe fails?" A: "kubelet kills the container and restarts it (subject to restartPolicy). This handles cases where the process is running but deadlocked or hung."
- Q: "Why should readiness probes be different from liveness probes?" A: "A container that's not ready (loading data, warming cache) shouldn't receive traffic BUT also shouldn't be killed. Readiness removes from Service, liveness restarts."

**AI**
- Paste a Pod YAML, AI identifies issues (missing probes, bad resource config, security gaps)
- AI generates CrashLoopBackOff debugging scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 9 | L | No |

---

### DEVOPS-03: Kubernetes Deployment Strategies Visualizer

**LEARNING**
- Side-by-side comparison: Rolling Update, Recreate, Blue-Green, Canary
- Animated pod replacement: old pods terminating, new pods starting, traffic shifting
- Rolling update parameters: maxSurge, maxUnavailable explained visually
- Service mesh traffic routing for canary (Istio VirtualService)

**SIMULATION**
- Configure deployment: replica count, strategy, maxSurge/maxUnavailable
- "Deploy v2" button triggers animated rollout
- Watch pod-by-pod replacement with health check gates
- Rollback simulation: detect failure, auto-rollback to v1
- Traffic split slider for canary (10% -> 25% -> 50% -> 100%)

**PRACTICE**
- "Choose the strategy" -- given requirements (zero downtime, database migration, gradual rollout), recommend strategy
- "Configure maxSurge" -- given cluster capacity constraints, set parameters
- "Canary criteria" -- define success metrics and rollback triggers for a canary deployment
- "Rollback drill" -- detect the bad deployment and execute rollback

**ASSESSMENT**
- "When is Recreate strategy appropriate?" (development environments, stateful apps that can't run two versions)
- "What is the risk of maxSurge=100% maxUnavailable=0?" (requires 2x cluster capacity during deployment)
- "How does canary differ from blue-green?" (canary is gradual traffic shift, blue-green is full switch)

**REVIEW (SRS)**
- Q: "What do maxSurge and maxUnavailable control in a rolling update?" A: "maxSurge = how many extra pods can exist during update (burst capacity). maxUnavailable = how many pods can be down during update (availability floor). Together they control rollout speed vs resource usage."
- Q: "Why is canary deployment safer than blue-green?" A: "Canary exposes only a small percentage of traffic to the new version. If it fails, only that percentage is affected. Blue-green switches 100% at once -- failure affects everyone."

**AI**
- AI recommends deployment strategy based on application characteristics and risk tolerance
- AI generates deployment failure scenarios for debugging practice

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 10 | L | No |

---

### DEVOPS-04: CI/CD Pipeline Builder

**LEARNING**
- Pipeline DAG visualization: stages, jobs, dependencies, artifacts
- Animated: commit triggers pipeline -> build -> test -> deploy
- Parallelism: independent jobs run simultaneously
- Gate stages: manual approval, test threshold, security scan

**SIMULATION**
- Drag-and-drop pipeline builder: add stages (build, test, lint, security, deploy)
- Configure job dependencies (DAG edges)
- "Run pipeline" button: animated execution with pass/fail per stage
- Failure scenarios: test failure stops pipeline, security scan blocks deploy
- Artifact passing between stages

**PRACTICE**
- "Fix the broken pipeline" -- given a failing CI config, diagnose and fix
- "Optimize pipeline speed" -- parallelize independent stages, reduce redundant work
- "Add security gates" -- insert SAST/DAST scans at appropriate pipeline positions
- "Design the deployment pipeline" -- given staging/production environments, design the pipeline

**ASSESSMENT**
- "Why should linting run in parallel with tests?" (independent, no dependency, saves time)
- "What is the purpose of artifact caching between pipeline runs?" (avoid rebuilding unchanged dependencies)
- "When should manual approval gates be used?" (production deployments, high-risk changes)

**REVIEW (SRS)**
- Q: "What is the difference between CI and CD?" A: "CI (Continuous Integration) = merge code frequently, run automated tests. CD (Continuous Delivery) = automate deployment to staging. Continuous Deployment = auto-deploy to production (no manual gate)."
- Q: "Why should the test stage run before the build artifact is pushed?" A: "Failing tests should prevent publishing a bad artifact. The artifact registry should only contain verified-good builds."

**AI**
- AI reviews pipeline YAML and suggests optimizations (caching, parallelism, missing stages)
- AI generates pipeline debugging challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | XL | No |

---

### DEVOPS-05: Terraform Plan/Apply Visualizer

**LEARNING**
- Dependency graph: resources with edges showing dependencies (VPC -> Subnet -> Instance)
- Plan output visualization: create (+), update (~), destroy (-) with color coding
- State file concept: what Terraform knows vs what actually exists
- Drift detection: planned state vs actual state differences

**SIMULATION**
- Write simple HCL (interactive editor): VPC, subnet, security group, instance
- "terraform plan" shows dependency graph + change summary
- "terraform apply" animates resource creation in dependency order
- "terraform destroy" shows reverse-dependency teardown
- State drift: manually change a resource, run plan to see drift

**PRACTICE**
- "Predict the plan" -- given HCL changes, predict what Terraform will create/update/destroy
- "Fix the cycle" -- given a circular dependency, refactor to break the cycle
- "Import existing resources" -- given running infrastructure, write HCL to match
- "Handle state drift" -- given drifted state, decide: fix code or fix infrastructure?

**ASSESSMENT**
- "Why does Terraform need a state file?" (maps HCL resources to real infrastructure IDs)
- "What happens if two people run terraform apply simultaneously?" (state lock prevents concurrent modifications)
- "What is the difference between count and for_each?" (count = numeric index, for_each = map/set iteration with stable keys)

**REVIEW (SRS)**
- Q: "What is Terraform state and why is it critical?" A: "State is Terraform's record of what it has created. It maps resource names in HCL to actual resource IDs in the cloud provider. Without state, Terraform can't know what already exists and would try to recreate everything."
- Q: "Why should Terraform state be stored remotely (e.g., S3)?" A: "Remote state enables team collaboration (shared source of truth), state locking (prevents concurrent applies), and backup/versioning."

**AI**
- Paste HCL, AI identifies issues (missing tags, security group too open, no state backend)
- AI generates Terraform refactoring challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 8 | XL | No |

---

### DEVOPS-06: Linux Command Playground

**LEARNING**
- Interactive terminal emulator with simulated filesystem
- Command categories: text processing (grep, awk, sed), process management (ps, top, kill), networking (netstat, ss, curl, dig)
- Pipeline visualization: show data flowing through command chains (cat | grep | awk | sort)
- "Explain this command" mode: breaks down each flag and pipe

**SIMULATION**
- Simulated filesystem with realistic directory structure and file contents
- Execute commands, see output in terminal
- Pipeline visualization: data transformation shown at each pipe stage
- Process table for ps/top/kill simulations
- Network state for netstat/ss simulations

**PRACTICE**
- "Extract the data" -- given a log file and target information, write the grep/awk/sed pipeline
- "Find the rogue process" -- use ps/top to identify high-CPU process, then kill it
- "Debug the network" -- use netstat/ss to find the process listening on port 8080
- "One-liner challenge" -- solve tasks with single command pipelines

**ASSESSMENT**
- "What does grep -rn 'pattern' /path do?" (recursive search with line numbers)
- "How do you find all files modified in the last 24 hours?" (find . -mtime -1)
- "What is the difference between kill -9 and kill -15?" (SIGKILL vs SIGTERM: uncatchable vs graceful)

**REVIEW (SRS)**
- Q: "What is the difference between | (pipe) and > (redirect)?" A: "Pipe sends stdout of one command to stdin of another (command-to-command). Redirect sends stdout to a file (command-to-file)."
- Q: "What does awk '{print $3}' do?" A: "Prints the third whitespace-delimited field of each input line. awk splits each line into fields ($1, $2, $3...) by default on whitespace."

**AI**
- AI generates log analysis challenges with increasing difficulty
- AI explains complex command pipelines step-by-step

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 9 | XL | No |

---

## 4. CLOUD MODULE -- ALL NEW

---

### CLOUD-01: VPC Network Architecture Builder

**LEARNING**
- Interactive VPC diagram: VPC boundary, public/private subnets, internet gateway, NAT gateway
- Animated: request from internet -> IGW -> public subnet -> NAT -> private subnet
- Security group rules visualization: inbound/outbound, stateful tracking
- NACL (network ACL) vs Security Group comparison: stateless vs stateful, ordered vs unordered

**SIMULATION**
- Drag-and-drop VPC builder: add subnets, gateways, route tables
- "Test connectivity" -- send a packet, watch it traverse the network
- Security group rule editor: add rules, test if traffic passes/blocks
- Multi-AZ layout with cross-AZ communication visualization

**PRACTICE**
- "Design the VPC" -- given requirements (public web servers, private databases), design the network
- "Debug the connectivity" -- instance can't reach internet, trace the path (missing route? missing IGW?)
- "Lock it down" -- given a working VPC, add security groups for least-privilege access
- "Multi-AZ resilience" -- design for AZ failure tolerance

**ASSESSMENT**
- "Why can't a private subnet instance directly access the internet?" (no route to IGW, needs NAT)
- "What is the difference between a security group and a NACL?" (SG: stateful, instance-level, allow-only. NACL: stateless, subnet-level, allow+deny)
- "Why use a NAT Gateway instead of a NAT Instance?" (managed, HA, auto-scaling, no single point of failure)

**REVIEW (SRS)**
- Q: "What makes a subnet 'public' vs 'private'?" A: "A public subnet has a route table entry pointing 0.0.0.0/0 to an Internet Gateway. A private subnet routes 0.0.0.0/0 to a NAT Gateway (or has no internet route at all)."
- Q: "Why are security groups stateful?" A: "If you allow inbound traffic on port 80, the response traffic is automatically allowed out -- you don't need an explicit outbound rule. The SG tracks connection state."

**AI**
- AI reviews VPC architecture and identifies security gaps
- AI generates VPC troubleshooting scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 9 | XL | No |

---

### CLOUD-02: IAM Policy Simulator

**LEARNING**
- Policy evaluation flowchart: explicit deny -> SCP -> permission boundary -> identity policy -> resource policy
- Policy JSON structure breakdown: Effect, Action, Resource, Condition
- Least privilege principle with real examples
- Role assumption chain visualization (cross-account access)

**SIMULATION**
- Interactive policy editor: write/edit IAM policies
- "Evaluate access" -- given a principal, action, and resource, trace through policy evaluation
- Role assumption chain: visualize STS AssumeRole with temporary credentials
- Permission boundary demonstration: max permissions ceiling

**PRACTICE**
- "Write the policy" -- given requirements, write minimum IAM policy
- "Find the vulnerability" -- given overly permissive policies, identify excessive permissions
- "Debug the AccessDenied" -- given a 403 error, trace through policy evaluation to find the blocking rule
- "Cross-account access" -- design role assumption chain for multi-account architecture

**ASSESSMENT**
- "Why does an explicit Deny always override an Allow?" (security principle: deny is definitive)
- "What is the difference between an identity policy and a resource policy?" (identity = attached to user/role, resource = attached to S3 bucket/SQS queue)
- "What is a permission boundary?" (maximum permissions ceiling -- intersection with identity policy)

**REVIEW (SRS)**
- Q: "In what order does AWS evaluate IAM policies?" A: "1. Explicit Deny (any policy) -> DENY. 2. SCP (org-level) -> must allow. 3. Permission boundary -> must allow. 4. Identity policy OR resource policy -> must allow. All must pass."
- Q: "Why should you never use the root account for daily operations?" A: "Root has unrestricted access, can't be limited by IAM policies, and if compromised, the entire account is lost. Use IAM users/roles with least privilege instead."

**AI**
- Paste IAM policy JSON, AI identifies over-permissions and suggests tightening
- AI generates least-privilege policy challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | L | No |

---

### CLOUD-03: Auto-Scaling Simulator

**LEARNING**
- Timeline visualization: traffic load -> CloudWatch alarm -> scaling action -> new instances -> load distributed
- Scaling policies: target tracking, step scaling, scheduled scaling
- Cooldown period explanation with over-scaling prevention
- Predictive scaling with ML-based traffic forecasting

**SIMULATION**
- Traffic pattern generator: steady, gradual ramp, spike, diurnal cycle
- Configure: min/max instances, target CPU%, scale-up/down cooldown
- Watch scaling events: alarm triggers, instance launches, health checks, traffic redistribution
- Cost counter: instance-hours accumulating in real-time
- Compare strategies: reactive scaling vs predictive scaling for same traffic

**PRACTICE**
- "Configure for the spike" -- given a traffic pattern, design scaling policy to handle without over-provisioning
- "Cost optimization" -- given a workload, minimize instance-hours while meeting SLA
- "Debug the scaling" -- instances scaling up but latency still high (unhealthy instances, slow warmup)
- "Scheduled + reactive" -- combine scheduled scaling for known events with reactive for unexpected spikes

**ASSESSMENT**
- "Why is a cooldown period necessary?" (prevents flapping -- scaling up/down repeatedly)
- "What is the problem with scaling on CPU alone?" (doesn't account for memory, disk I/O, or application-specific metrics)
- "Why might auto-scaling fail to help during a sudden traffic spike?" (instance launch time, health check delay, connection draining)

**REVIEW (SRS)**
- Q: "What is the difference between target tracking and step scaling?" A: "Target tracking: 'keep CPU at 60%' -- ASG figures out how many instances. Step scaling: 'if CPU > 60% add 2, if > 80% add 5' -- you define the steps explicitly."
- Q: "What is predictive scaling?" A: "ML-based forecasting that analyzes historical traffic patterns and pre-launches instances BEFORE the predicted load increase. Eliminates the reactive delay."

**AI**
- AI analyzes traffic patterns and recommends scaling configuration
- AI generates scaling scenario challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | L | No |

---

### CLOUD-04: Cloud Service Decision Tree

**LEARNING**
- Interactive decision tree: "I need to run code" -> "How long?" -> "<15 min" -> Lambda, ">15 min" -> EC2/ECS
- Service comparison cards: EC2 vs ECS vs EKS vs Lambda vs Fargate
- Cost model visualizations: per-hour (EC2) vs per-invocation (Lambda) vs per-vCPU-second (Fargate)
- AWS vs GCP naming mapping (EC2 = Compute Engine, S3 = GCS, RDS = Cloud SQL)

**SIMULATION**
- Input workload characteristics (requests/sec, duration, memory, state)
- Decision tree highlights the recommended path
- Cost calculator: estimate monthly cost for each option
- "What if" scenarios: change request rate, see cost crossover points

**PRACTICE**
- "Choose the service" -- given requirements, select the most appropriate compute/storage/database service
- "Migrate the architecture" -- take an EC2 monolith, redesign as serverless/containers
- "Cost optimization" -- given current architecture, identify savings opportunities (reserved instances, Spot, Graviton)

**ASSESSMENT**
- "When is Lambda cheaper than EC2?" (low, sporadic traffic -- under ~1M requests/month with short duration)
- "What is the difference between ECS and EKS?" (ECS = AWS-native orchestrator, EKS = managed Kubernetes)
- "When should you use Fargate vs EC2-backed ECS?" (Fargate for simplicity/variable workloads, EC2 for cost optimization/GPU/specific instance types)

**REVIEW (SRS)**
- Q: "What are the three main compute options on AWS and when to use each?" A: "EC2: full VM control, long-running, stateful. Lambda: event-driven, short-lived (<15 min), stateless. ECS/Fargate: containerized workloads, moderate control, good for microservices."
- Q: "What is the AWS equivalent of GCP Cloud Functions?" A: "AWS Lambda. Both are serverless compute. Lambda supports more languages natively; Cloud Functions has tighter GCP integration."

**AI**
- AI recommends cloud services based on architecture description
- AI generates migration challenge scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | L | No |

---

### CLOUD-05: Cloud Load Balancer Comparison

**LEARNING**
- Layer 4 (NLB/TCP) vs Layer 7 (ALB/HTTP) routing visualization
- ALB: path-based routing (/api -> service A, /web -> service B), host-based routing
- NLB: TCP pass-through, static IP, ultra-low latency
- Health check mechanisms and deregistration delay

**SIMULATION**
- Configure target groups with different backends
- Send requests with varying paths/hosts, watch routing decisions
- Health check failure: target marked unhealthy, traffic rerouted
- Connection draining animation: existing connections finish while new ones route elsewhere

**PRACTICE**
- "Design the routing" -- given microservices architecture, configure ALB path-based routing
- "Choose ALB vs NLB" -- given requirements (WebSocket, gRPC, static IP, TLS passthrough), recommend LB type
- "Debug the 502" -- trace unhealthy target, connection timeout, misconfigured health check

**ASSESSMENT**
- "Why can't an ALB route based on TCP port alone?" (ALB is Layer 7, it inspects HTTP headers; NLB operates at Layer 4)
- "When do you need an NLB?" (static IP requirement, non-HTTP protocols, extreme performance needs, TLS passthrough)
- "What is connection draining?" (allow in-flight requests to complete before deregistering a target)

**REVIEW (SRS)**
- Q: "What is the key architectural difference between ALB and NLB?" A: "ALB terminates the HTTP connection and makes routing decisions based on HTTP content (path, host, headers). NLB passes TCP connections through without inspecting content -- it routes based on IP/port."
- Q: "Why does gRPC require an ALB (not NLB)?" A: "gRPC uses HTTP/2 multiplexing. NLB would route all multiplexed streams to the same target. ALB understands HTTP/2 and can distribute individual gRPC calls across targets."

**AI**
- AI recommends load balancer type based on architecture
- AI generates routing configuration challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | M | No |

---

## 5. SECURITY MODULE -- FEATURES TO ADD

The security module already has 11 topics. Below are NEW features for missing coverage.

---

### SEC-NEW-01: SSRF Attack & Defense Visualizer (ENGINE EXISTS: ssrf.ts)

**LEARNING**
- Request flow: attacker -> application -> internal resource (metadata service, internal DB)
- Cloud SSRF: accessing instance metadata (169.254.169.254) to steal IAM credentials
- Defense layers: URL allowlisting, DNS rebinding prevention, metadata service v2 (IMDSv2)
- Real case study: Capital One breach (2019)

**SIMULATION**
- Interactive: craft a URL, see where the application-level request goes
- Toggle defenses: none, URL validation, DNS rebinding check, IMDSv2
- Metadata service response showing leaked credentials
- Compare: with and without defenses

**PRACTICE**
- "Craft the SSRF" -- given a URL parameter, construct a payload to reach internal services
- "Block the attack" -- implement URL validation that prevents internal access
- "Cloud hardening" -- configure IMDSv2 to prevent SSRF-based credential theft

**ASSESSMENT**
- "Why is http://169.254.169.254 dangerous in cloud environments?" (instance metadata service exposes IAM credentials)
- "How does DNS rebinding bypass URL allowlisting?" (first resolution returns allowed IP, second resolution returns internal IP)
- "What does IMDSv2 add over IMDSv1?" (requires a PUT request to get a token before accessing metadata -- prevents simple SSRF)

**REVIEW (SRS)**
- Q: "What is SSRF?" A: "Server-Side Request Forgery -- attacker tricks the server into making HTTP requests to internal resources. The server acts as a proxy, bypassing network firewalls."
- Q: "How did the Capital One breach use SSRF?" A: "Attacker exploited a WAF misconfiguration to make the server request IAM credentials from the metadata service (169.254.169.254), then used those credentials to access S3 buckets."

**AI**
- AI generates SSRF attack scenarios for defense practice
- AI reviews application code for SSRF vulnerabilities

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | S | Engine exists, needs UI |

---

### SEC-NEW-02: CSP (Content Security Policy) Visualizer (ENGINE EXISTS: csp.ts)

**LEARNING**
- CSP header breakdown: default-src, script-src, style-src, img-src, connect-src
- Request flow: browser loads page -> checks CSP header -> blocks/allows each resource
- Reporting mode (Content-Security-Policy-Report-Only) for safe rollout
- Nonce-based and hash-based inline script allowlisting

**SIMULATION**
- Interactive CSP header builder: add/remove directives
- "Load the page" -- see which resources are blocked/allowed by the policy
- Report-Only mode: see violations without blocking
- Incremental tightening: start permissive, progressively restrict

**PRACTICE**
- "Write the CSP" -- given a page's resource requirements, write the minimum CSP header
- "Debug the violation" -- given a CSP error, identify which directive blocked the resource
- "Tighten the policy" -- given an overly permissive CSP, restrict without breaking functionality

**ASSESSMENT**
- "What does default-src 'self' mean?" (only allow resources from same origin by default)
- "Why is unsafe-inline dangerous?" (allows inline scripts, defeating XSS protection)
- "How do nonces protect against XSS?" (server generates random nonce per response, only scripts with matching nonce execute)

**REVIEW (SRS)**
- Q: "What is the most important CSP directive for preventing XSS?" A: "script-src -- controls which scripts can execute. Without 'unsafe-inline', injected scripts are blocked even if XSS vulnerability exists."
- Q: "Why use Report-Only mode first?" A: "Deploying a strict CSP immediately might break legitimate functionality. Report-Only logs violations without blocking, letting you identify and fix issues before enforcement."

**AI**
- AI generates CSP headers based on page resource analysis
- AI reviews CSP for common weaknesses

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 7 | 6 | S | Engine exists, needs UI |

---

### SEC-NEW-03: OAuth Scopes & RBAC/ABAC Visualizer (PARTIAL -- oauth exists, need scope/RBAC layer)

**LEARNING**
- RBAC: User -> Role -> Permissions matrix with animated permission check
- ABAC: Policy evaluation with attributes (user.department, resource.sensitivity, action, environment.time)
- OAuth scopes: scope hierarchy, consent screen, token introspection
- Comparison matrix: RBAC vs ABAC vs ReBAC (relationship-based)

**SIMULATION**
- RBAC: create roles, assign permissions, test access (admin can edit, viewer can only read)
- ABAC: define attribute policies, test with different user/resource/environment attributes
- OAuth scopes: request token with specific scopes, attempt operations, see scope enforcement
- "Privilege escalation" demo: show how over-permissive RBAC enables escalation

**PRACTICE**
- "Design the RBAC" -- given an org structure (admin, editor, viewer, auditor), design the role hierarchy
- "Write the ABAC policy" -- "Only allow access to sensitive documents during business hours from corporate IP"
- "Minimize scopes" -- given an application's needs, request minimum OAuth scopes

**ASSESSMENT**
- "When is ABAC better than RBAC?" (when access depends on dynamic attributes -- location, time, resource classification)
- "What is the principle of least privilege in practice?" (each role gets minimum permissions needed for its function)
- "Why should OAuth tokens have narrow scopes?" (if token is leaked, blast radius is limited)

**REVIEW (SRS)**
- Q: "What is the difference between RBAC and ABAC?" A: "RBAC: access based on user's role (simple, static). ABAC: access based on attributes of user, resource, action, and environment (flexible, dynamic). RBAC is a special case of ABAC where the only attribute is role."
- Q: "What does the OAuth scope 'read:user' mean?" A: "The token is authorized to read user data but not modify it. Scopes limit what operations a token can perform, independent of the user's full permissions."

**AI**
- AI designs RBAC hierarchy from job descriptions
- AI generates privilege escalation attack scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 8 | 7 | M | Partial -- OAuth UI exists, RBAC/ABAC new |

---

### SEC-NEW-04: OWASP Top 10 Interactive Guide

**LEARNING**
- All 10 categories with interactive attack flow diagrams
- For each: attack visualization, vulnerable code, fixed code, real-world case study
- Risk scoring: likelihood x impact matrix
- Detection methods for each vulnerability type

**SIMULATION**
- Select a category, see animated attack scenario
- Toggle "vulnerable" vs "defended" mode
- Code diff: vulnerable code on left, fixed code on right
- "Exploit playground" -- craft payloads and see results

**PRACTICE**
- "Classify the vulnerability" -- given a code snippet, identify the OWASP category
- "Fix the code" -- given vulnerable code, apply the correct defense
- "Prioritize the backlog" -- given a list of vulnerabilities, rank by risk

**ASSESSMENT**
- "What is A01:2021?" (Broken Access Control -- #1 most common)
- "How does parameterized queries prevent SQL injection?" (treats user input as data, not code)
- "What is the defense against insecure deserialization?" (never deserialize untrusted data, or use allowlists)

**REVIEW (SRS)**
- Q: "Name the OWASP Top 10 (2021) in order." A: "1. Broken Access Control, 2. Cryptographic Failures, 3. Injection, 4. Insecure Design, 5. Security Misconfiguration, 6. Vulnerable Components, 7. Auth Failures, 8. Software/Data Integrity, 9. Logging Failures, 10. SSRF."
- Q: "Why is 'Insecure Design' (A04) different from implementation bugs?" A: "Insecure Design means the architecture itself is flawed -- no amount of perfect coding fixes a missing authorization check that was never designed. It's a design-level failure, not a coding error."

**AI**
- AI scans code for OWASP Top 10 vulnerabilities
- AI generates vulnerability-specific CTF challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 8 | XL | Partial -- some attacks exist (XSS, CSRF, SQLi), need remaining 7 categories |

---

## 6. SRE MODULE -- ALL NEW

This is a completely new module. Needs: ModuleType addition, lib/sre/ directory, SREModule.tsx, wrapper.

---

### SRE-01: SLO/SLI/Error Budget Dashboard

**LEARNING**
- SLI -> SLO -> SLA hierarchy visualization with real examples
- Error budget concept: 99.9% SLO = 43.8 minutes/month downtime budget
- Burn rate: how fast you're consuming the error budget
- Multi-window alerting (5m + 1h + 6h burn rates)

**SIMULATION**
- Configure: SLO target (99.9%, 99.95%, 99.99%), measurement window (30 days)
- Simulate incidents: inject outages of various durations
- Watch error budget deplete in real-time
- Burn rate chart: current burn rate vs sustainable burn rate
- Alert trigger when burn rate exceeds threshold

**PRACTICE**
- "Calculate the budget" -- given SLO 99.95% for 30 days, how many minutes of downtime?
- "Should we deploy?" -- given current error budget consumption, decide whether a risky deployment is acceptable
- "Set the alerts" -- configure multi-window burn rate alerts for a given SLO
- "Negotiate the SLA" -- given internal SLOs for dependencies, calculate achievable SLA for the service

**ASSESSMENT**
- "What is the relationship between SLI, SLO, and SLA?" (SLI measures, SLO targets, SLA commits with penalties)
- "Why is 100% availability the wrong target?" (impossible to achieve, prevents all deployments, and the cost curve is exponential)
- "What is a burn rate of 1.0?" (consuming error budget at exactly the sustainable rate -- will reach 0 at end of window)

**REVIEW (SRS)**
- Q: "How much downtime does a 99.9% SLO allow per month?" A: "43.8 minutes (30 days x 24 hours x 60 minutes x 0.001 = 43.2 minutes). This is the error budget."
- Q: "What is the burn rate and why does it matter?" A: "Burn rate = rate of error budget consumption. A burn rate of 10x means you'll exhaust your monthly budget in 3 days. Multi-window burn rate alerts catch both sudden outages (high burn rate) and slow degradation (sustained moderate burn rate)."

**AI**
- AI calculates composite SLOs for multi-service architectures
- AI generates error budget decision scenarios

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 9 | L | No |

---

### SRE-02: Circuit Breaker State Machine

**LEARNING**
- Three-state diagram: Closed (normal) -> Open (failing, block requests) -> Half-Open (test recovery)
- Animated transitions with configurable thresholds
- Failure counting in Closed state, timeout in Open state, success counting in Half-Open
- Cascade failure prevention: how one circuit breaker protects upstream services

**SIMULATION**
- Service topology: Service A -> Circuit Breaker -> Service B
- Inject failures into Service B, watch circuit breaker transition states
- Configurable: failure threshold, timeout duration, half-open trial count
- Traffic flow animation showing blocked/passed/fallback requests
- Cascade demo: Service A -> B -> C, failure at C propagates without breakers

**PRACTICE**
- "Configure the breaker" -- given failure rates and recovery time, set optimal thresholds
- "Design the fallback" -- when circuit is open, what should the service return? (cached data, degraded response, error)
- "Prevent the cascade" -- add circuit breakers to a microservice graph to prevent cascade failures
- "Tune the timeout" -- too short = premature retry (service still down), too long = slow recovery

**ASSESSMENT**
- "What happens to requests when the circuit breaker is Open?" (immediately fail-fast or return fallback, no attempt to call downstream)
- "Why is Half-Open necessary?" (need a mechanism to test if downstream has recovered without flooding it)
- "What is the risk of setting the failure threshold too low?" (false positives -- transient errors trigger the breaker unnecessarily)

**REVIEW (SRS)**
- Q: "What are the three states of a circuit breaker?" A: "Closed: requests pass through, failures counted. Open: all requests fail-fast (or return fallback), timeout timer starts. Half-Open: limited trial requests sent -- if successful, close breaker; if failed, reopen."
- Q: "How does a circuit breaker prevent cascade failure?" A: "Without a breaker, when Service B is slow, Service A's threads pile up waiting. Eventually A runs out of threads and fails too. The circuit breaker immediately returns errors for B calls, freeing A's threads to serve other requests."

**AI**
- AI recommends circuit breaker configuration based on service SLOs and failure patterns
- AI generates cascade failure scenarios for analysis

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 10 | M | No |

---

### SRE-03: Incident Management Timeline Simulator

**LEARNING**
- Incident lifecycle: Detection -> Triage -> Mitigation -> Resolution -> Postmortem
- Animated timeline with role assignments (Incident Commander, Communications, Subject Matter Expert)
- Severity classification (SEV1-SEV4) with escalation paths
- Communication templates and status page updates

**SIMULATION**
- Scenario generator: random incidents (database overload, cert expiry, DDoS, deployment failure)
- Role-play: user is Incident Commander, makes decisions at each phase
- Clock ticking: time-to-detect (TTD), time-to-mitigate (TTM), time-to-resolve (TTR)
- Decision points: "Rollback or forward-fix?", "Page the on-call or wait?", "Communicate to customers now or wait for more info?"
- Impact tracker: users affected, revenue impact, error budget consumption

**PRACTICE**
- "Run the incident" -- full role-play through a realistic incident
- "Write the postmortem" -- given incident timeline, write blameless postmortem with action items
- "Improve MTTD" -- given an incident that took 30 min to detect, design better monitoring
- "Severity classification" -- given incident description, assign correct severity and escalation

**ASSESSMENT**
- "What is the Incident Commander's primary responsibility?" (coordination and decision-making, not debugging)
- "Why should postmortems be blameless?" (psychological safety enables honest analysis; blame encourages hiding information)
- "What is the difference between MTTD, MTTM, and MTTR?" (Detect, Mitigate, Resolve -- different phases of incident response)

**REVIEW (SRS)**
- Q: "What are the key roles in incident response?" A: "Incident Commander (coordinates, makes decisions), Communications Lead (status page, stakeholder updates), Subject Matter Expert (debugs), Scribe (records timeline)."
- Q: "What is the most impactful metric to reduce: MTTD or MTTR?" A: "MTTD (Mean Time to Detect). You can't mitigate what you don't know about. Better monitoring and alerting reduce MTTD, which reduces total incident duration."

**AI**
- AI generates realistic incident scenarios with branching decision paths
- AI reviews postmortem drafts for completeness

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 10 | XL | No |

---

### SRE-04: Root Cause Analysis Workshop

**LEARNING**
- 5 Whys technique: animated chain from symptom to root cause
- Fishbone (Ishikawa) diagram: categories (People, Process, Technology, Environment)
- Fault tree analysis: top-down logical decomposition
- Contributing factors vs root cause distinction

**SIMULATION**
- Interactive 5 Whys: start with a symptom, AI helps construct the "why" chain
- Fishbone builder: drag causes into categories, connect to the central problem
- "Challenge the analysis" -- AI plays devil's advocate, questioning if you've found the TRUE root cause
- Real incident case studies (GitLab database deletion, AWS us-east-1 outage, Cloudflare regex)

**PRACTICE**
- "Find the root cause" -- given an incident timeline, perform 5 Whys analysis
- "Build the fishbone" -- given a symptom, construct the Ishikawa diagram
- "Distinguish root vs contributing" -- given a list of factors, classify each
- "Write the action items" -- given root cause, propose preventive measures

**ASSESSMENT**
- "When should you stop asking 'why'?" (when you reach a systemic issue that can be fixed with a process/tooling change)
- "What is the difference between a root cause and a contributing factor?" (root cause = directly caused the failure, contributing factor = made it worse or more likely)
- "Why is '5' in 5 Whys not a magic number?" (sometimes you need 3, sometimes 7; the goal is reaching an actionable root cause)

**REVIEW (SRS)**
- Q: "What is the danger of stopping the 5 Whys too early?" A: "You fix a symptom, not the cause. Example: 'The server crashed because of high traffic' -> if you just add capacity, you haven't fixed WHY the traffic spike happened or WHY there was no auto-scaling."
- Q: "What are the six categories in a fishbone diagram?" A: "People, Process, Technology/Tools, Environment, Materials/Data, Measurement/Monitoring. Not all apply to every incident."

**AI**
- AI co-pilots the 5 Whys analysis, suggesting deeper "why" questions
- AI generates incident scenarios with non-obvious root causes

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 9 | 9 | L | No |

---

### SRE-05: Chaos Engineering Control Panel

**LEARNING**
- Principles of chaos engineering: steady state hypothesis, real-world events, production experiments
- Blast radius concept: start small, expand gradually
- Game day planning and execution
- Netflix Chaos Monkey origin story and modern chaos tools

**SIMULATION**
- Service topology graph (5-10 interconnected services)
- Inject chaos: kill instance, add latency, corrupt DNS, exhaust CPU, fill disk
- Observe: which services are affected? Does the system degrade gracefully?
- Hypothesis mode: "I expect adding 500ms latency to Service B will not affect Service A's p99 latency" -> test it
- Blast radius visualization: highlight affected services in red

**PRACTICE**
- "Design the experiment" -- given a system, define hypothesis, chaos action, success criteria, and abort conditions
- "Predict the blast radius" -- given a chaos event, predict which services are affected and how
- "Harden the system" -- run chaos experiments, identify weaknesses, implement fixes, re-test
- "Game day plan" -- design a full game day with multiple experiments, escalation procedures, and rollback plans

**ASSESSMENT**
- "Why should chaos experiments run in production?" (staging doesn't replicate real traffic, real data, real scale)
- "What is a steady-state hypothesis?" (measurable behavior that defines 'normal' -- e.g., p99 < 200ms, error rate < 0.1%)
- "What are the minimum requirements before running chaos in production?" (monitoring, automated rollback, blast radius limits, team communication)

**REVIEW (SRS)**
- Q: "What are the four steps of a chaos experiment?" A: "1. Define steady state (measurable normal behavior). 2. Hypothesize that steady state will hold during chaos. 3. Introduce chaos (kill instance, add latency). 4. Disprove hypothesis by observing deviations."
- Q: "Why start chaos experiments with small blast radius?" A: "Minimize customer impact while learning. If a small experiment reveals a critical weakness, you've found a major issue cheaply. Scale up gradually as confidence grows."

**AI**
- AI suggests chaos experiments based on architecture topology
- AI generates blast radius prediction challenges

| Impact | WOW | Effort | Exists? |
|--------|-----|--------|---------|
| 10 | 10 | XL | No |

---

## MASTER PRIORITY MATRIX

### Tier 1: Critical / Highest Impact (Build First)

| ID | Feature | Impact | WOW | Effort | Exists? |
|----|---------|--------|-----|--------|---------|
| SRE-02 | Circuit Breaker State Machine | 10 | 10 | M | No |
| SRE-01 | SLO/SLI/Error Budget Dashboard | 10 | 9 | L | No |
| DEVOPS-03 | K8s Deployment Strategies | 10 | 10 | L | No |
| DEVOPS-02 | K8s Pod Lifecycle | 10 | 9 | L | No |
| SRE-03 | Incident Management Timeline | 10 | 10 | XL | No |
| CLOUD-01 | VPC Network Architecture | 10 | 9 | XL | No |

### Tier 2: High Impact / Quick Wins (Engine Exists)

| ID | Feature | Impact | WOW | Effort | Exists? |
|----|---------|--------|-----|--------|---------|
| OS-NEW-04 | Priority Inversion (Mars Pathfinder) | 9 | 9 | S | Engine exists |
| OS-NEW-06 | Buffer Overflow Attack/Defense | 9 | 9 | S | Engine exists |
| OS-NEW-03 | Thrashing & Working Set | 9 | 8 | S | Engine exists |
| OS-NEW-01 | Context Switching | 8 | 7 | S | Engine exists |
| OS-NEW-05 | Copy-on-Write Fork | 8 | 7 | S | Engine exists |
| OS-NEW-02 | System Call Lifecycle | 7 | 6 | S | Engine exists |
| SEC-NEW-01 | SSRF Visualizer | 9 | 8 | S | Engine exists |
| SEC-NEW-02 | CSP Visualizer | 7 | 6 | S | Engine exists |
| NET-NEW-02 | ARP Visualizer | 6 | 5 | S | Engine exists |
| NET-NEW-05 | DHCP Lifecycle | 6 | 5 | S | Engine exists |

### Tier 3: High Impact / Medium-Large Effort

| ID | Feature | Impact | WOW | Effort | Exists? |
|----|---------|--------|-----|--------|---------|
| NET-NEW-01 | Load Balancing Algorithms | 9 | 8 | M | No |
| NET-NEW-03 | TCP Congestion Control | 9 | 8 | L | No |
| SRE-04 | Root Cause Analysis Workshop | 9 | 9 | L | No |
| DEVOPS-01 | Docker Image Layer Viz | 9 | 9 | L | No |
| CLOUD-02 | IAM Policy Simulator | 9 | 8 | L | No |
| CLOUD-03 | Auto-Scaling Simulator | 9 | 8 | L | No |
| SEC-NEW-03 | RBAC/ABAC Visualizer | 8 | 7 | M | Partial |
| SEC-NEW-04 | OWASP Top 10 Guide | 9 | 8 | XL | Partial |

### Tier 4: High Effort / Still High Value

| ID | Feature | Impact | WOW | Effort | Exists? |
|----|---------|--------|-----|--------|---------|
| SRE-05 | Chaos Engineering Panel | 10 | 10 | XL | No |
| DEVOPS-04 | CI/CD Pipeline Builder | 9 | 8 | XL | No |
| DEVOPS-05 | Terraform Visualizer | 8 | 8 | XL | No |
| DEVOPS-06 | Linux Command Playground | 9 | 9 | XL | No |
| NET-NEW-04 | TCP Flow Control | 8 | 7 | M | No |
| OS-NEW-07 | I/O Scheduling | 8 | 7 | M | No |
| OS-NEW-08 | File System Explorer | 7 | 6 | L | No |
| OS-NEW-09 | Process vs Thread Deep Dive | 8 | 6 | M | No |
| CLOUD-04 | Service Decision Tree | 8 | 7 | L | No |
| CLOUD-05 | Load Balancer Comparison | 8 | 7 | M | No |

---

## IMPLEMENTATION NOTES

**Module registration (all new modules need):**
1. Add to `ModuleType` union in `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ui-store.ts`
2. Create `lib/{module}/` directory with simulation engines
3. Create `components/modules/{Module}Module.tsx` with `use{Module}Module()` hook returning `ModuleContent`
4. Create `components/modules/wrappers/{Module}Wrapper.tsx`
5. Add export to `components/modules/index.ts`
6. Create `lib/{module}/srs-bridge.ts` for FSRS integration

**Engine pattern (follow existing convention):**
- Pure TypeScript, no React dependencies
- Export typed interfaces for all state objects
- Export simulation functions that return arrays of typed step/event objects
- Include educational `description` field in every step
- Include `tick` field for timeline-based stepping

**UI pattern (follow existing convention):**
- `use{Module}Module()` hook manages all state internally
- Returns `{ sidebar, canvas, properties, bottomPanel }` matching `ModuleContent`
- Sidebar: topic selector list with active highlight
- Canvas: main visualization (SVG sequence diagrams, or Canvas2D for complex animations)
- Properties: configuration panel (algorithm selection, parameter sliders)
- Bottom panel: "log" tab (step-by-step event log) and "learn" tab (lazy-loaded educational components)
- Step controls: Play/Pause, Step Forward, Step Back, Reset
- Comparison mode where applicable

**Total count:** 28 features across 6 modules (6 OS, 5 Networking, 6 DevOps, 5 Cloud, 4 Security, 5 SRE)