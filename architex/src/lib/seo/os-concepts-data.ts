// ── OS Concept database: 6 operating system concepts for SEO pages ──

export type OSConceptDifficulty = "beginner" | "intermediate" | "advanced";

export interface OSConceptData {
  slug: string;
  name: string;
  description: string;
  difficulty: OSConceptDifficulty;
  keywords: string[];
  algorithms: string[];
  explanation: string[];
  interviewQuestions: string[];
  relatedConcepts: string[];
}

export const OS_CONCEPTS: OSConceptData[] = [
  {
    slug: "cpu-scheduling",
    name: "CPU Scheduling",
    description:
      "Explore how operating systems decide which process runs next. Visualize FCFS, SJF, Round Robin, Priority, and MLFQ scheduling algorithms with interactive Gantt charts.",
    difficulty: "intermediate",
    keywords: [
      "CPU scheduling",
      "FCFS",
      "SJF",
      "Round Robin",
      "MLFQ",
      "Gantt chart",
      "process scheduling",
    ],
    algorithms: ["FCFS", "SJF", "SRTF", "Round Robin", "Priority", "MLFQ"],
    explanation: [
      "CPU scheduling is one of the fundamental functions of an operating system. When multiple processes compete for processor time, the scheduler determines which process runs next and for how long. The goal is to maximize CPU utilization, minimize response time, and ensure fairness across all processes. Different algorithms make different trade-offs between these objectives, and understanding them is essential for systems engineers and interview candidates alike.",
      "Non-preemptive algorithms like First-Come First-Served (FCFS) and Shortest Job First (SJF) let a process run to completion once it starts. FCFS is simple but suffers from the convoy effect, where short processes wait behind long ones. SJF minimizes average waiting time but requires knowing burst times in advance. Preemptive variants like Shortest Remaining Time First (SRTF) can interrupt a running process if a shorter one arrives, improving responsiveness at the cost of more context switches.",
      "Modern operating systems use sophisticated multi-level feedback queue (MLFQ) schedulers that combine the best properties of simpler algorithms. MLFQ maintains multiple priority queues: new processes start at the highest priority and are demoted if they consume too much CPU time, while I/O-bound processes stay at high priority since they voluntarily yield frequently. Linux's Completely Fair Scheduler (CFS) takes a different approach, using a red-black tree to track virtual runtime and ensure each process gets a fair share of CPU time proportional to its weight.",
    ],
    interviewQuestions: [
      "What is the convoy effect in FCFS scheduling and how can it be mitigated?",
      "How does the MLFQ scheduler prevent starvation of low-priority processes?",
      "Compare preemptive and non-preemptive scheduling: when would you prefer each?",
      "How does Linux's CFS scheduler achieve O(log n) scheduling decisions?",
    ],
    relatedConcepts: ["thread-synchronization", "memory-management", "deadlock-detection"],
  },
  {
    slug: "page-replacement",
    name: "Page Replacement",
    description:
      "Understand how operating systems manage virtual memory by choosing which pages to evict. Compare FIFO, LRU, Optimal, and Clock algorithms with step-by-step page fault simulations.",
    difficulty: "intermediate",
    keywords: [
      "page replacement",
      "virtual memory",
      "FIFO",
      "LRU",
      "optimal page replacement",
      "clock algorithm",
      "page fault",
    ],
    algorithms: ["FIFO", "LRU", "Optimal", "Clock", "Second Chance", "LFU"],
    explanation: [
      "Virtual memory allows processes to use more memory than physically available by storing pages on disk and loading them into RAM on demand. When a process accesses a page not in physical memory, a page fault occurs and the OS must load it from disk. If all frames are occupied, the page replacement algorithm decides which existing page to evict. The choice of algorithm directly impacts system performance since disk I/O is orders of magnitude slower than memory access.",
      "The simplest algorithm is FIFO, which evicts the oldest page in memory. While easy to implement with a queue, FIFO suffers from Belady's anomaly, where adding more frames can paradoxically increase page faults. The Optimal algorithm (OPT) evicts the page that will not be used for the longest time in the future. While it provides the theoretical minimum page faults, it requires future knowledge and serves as a benchmark rather than a practical solution.",
      "The Least Recently Used (LRU) algorithm approximates OPT by evicting the page that has not been accessed for the longest time, based on the principle of temporal locality. True LRU requires expensive hardware or software tracking, so real systems use approximations. The Clock algorithm (Second Chance) arranges pages in a circular buffer with reference bits: when a page must be evicted, the clock hand sweeps forward, clearing reference bits until it finds a page with bit 0, which is then evicted. This provides near-LRU performance with minimal overhead.",
    ],
    interviewQuestions: [
      "What is Belady's anomaly and which algorithms are immune to it?",
      "How does the Clock (Second Chance) algorithm approximate LRU efficiently?",
      "What is the working set model and how does it relate to page replacement?",
      "How do modern operating systems combine multiple page replacement strategies?",
    ],
    relatedConcepts: ["memory-management", "memory-allocation", "cpu-scheduling"],
  },
  {
    slug: "deadlock-detection",
    name: "Deadlock Detection",
    description:
      "Learn how operating systems detect, prevent, and recover from deadlocks. Explore resource allocation graphs, the Banker's algorithm, and the four Coffman conditions interactively.",
    difficulty: "advanced",
    keywords: [
      "deadlock",
      "resource allocation graph",
      "Banker's algorithm",
      "Coffman conditions",
      "deadlock prevention",
      "deadlock avoidance",
    ],
    algorithms: [
      "Resource Allocation Graph",
      "Banker's Algorithm",
      "Wait-For Graph",
      "Wound-Wait",
      "Wait-Die",
    ],
    explanation: [
      "A deadlock occurs when two or more processes are permanently blocked, each waiting for a resource held by another process in the cycle. Four conditions must all hold simultaneously for a deadlock to exist: mutual exclusion (resources cannot be shared), hold and wait (processes hold resources while waiting for others), no preemption (resources cannot be forcibly taken), and circular wait (a cycle exists in the wait graph). Understanding these Coffman conditions is the foundation for all deadlock handling strategies.",
      "Deadlock prevention eliminates one or more Coffman conditions by design. Requiring processes to request all resources upfront eliminates hold-and-wait but reduces concurrency. Imposing a global ordering on resource types prevents circular wait. Deadlock avoidance takes a different approach: the Banker's algorithm evaluates each resource request against the current system state to determine if granting it could lead to an unsafe state where deadlock is possible. If so, the request is delayed until it is safe to proceed.",
      "Deadlock detection allows deadlocks to occur but periodically checks for them. The system maintains a resource allocation graph or wait-for graph and runs cycle detection algorithms. When a deadlock is found, recovery strategies include killing one or more processes in the cycle, preempting resources from deadlocked processes, or rolling back transactions to a checkpoint. Most modern general-purpose operating systems (Linux, Windows) use a combination: prevention for common cases and detection with recovery for rare edge cases.",
    ],
    interviewQuestions: [
      "Name and explain the four Coffman conditions for deadlock.",
      "How does the Banker's algorithm determine whether a state is safe?",
      "What are the trade-offs between deadlock prevention, avoidance, and detection?",
      "How does a database system handle deadlocks differently from an operating system?",
    ],
    relatedConcepts: ["thread-synchronization", "cpu-scheduling", "memory-management"],
  },
  {
    slug: "memory-management",
    name: "Memory Management",
    description:
      "Discover how operating systems organize and protect memory using paging, segmentation, and virtual address translation. Visualize page tables, TLBs, and multi-level address translation.",
    difficulty: "intermediate",
    keywords: [
      "memory management",
      "paging",
      "segmentation",
      "virtual memory",
      "page table",
      "TLB",
      "address translation",
    ],
    algorithms: [
      "Single-Level Paging",
      "Multi-Level Paging",
      "Inverted Page Table",
      "TLB Lookup",
      "Segmentation",
    ],
    explanation: [
      "Memory management is a core responsibility of the operating system that enables multiple processes to share physical memory safely and efficiently. Each process operates in its own virtual address space, believing it has exclusive access to a large contiguous memory region. The OS, with hardware support from the Memory Management Unit (MMU), translates virtual addresses to physical addresses transparently. This abstraction provides process isolation, simplifies programming, and allows the system to use disk as an extension of RAM through virtual memory.",
      "Paging divides virtual and physical memory into fixed-size blocks called pages and frames respectively (typically 4 KB). The page table maps each virtual page to a physical frame. Because a full page table for a 64-bit address space would be enormous, modern systems use multi-level page tables that only allocate entries for regions of memory actually in use. x86-64 processors use four-level page tables, and ARM64 supports up to four levels as well. The Translation Lookaside Buffer (TLB) caches recent translations, and TLB misses trigger expensive page table walks.",
      "Segmentation divides memory into variable-sized segments based on logical structure: code, data, stack, heap. While pure segmentation has largely been replaced by paging, modern systems combine both. The x86 architecture originally used segmented memory and transitioned to a flat paging model. Memory protection is enforced at the page level through permission bits (read, write, execute) and privilege levels (user vs. kernel). Techniques like Address Space Layout Randomization (ASLR) and guard pages add security layers against buffer overflow attacks.",
    ],
    interviewQuestions: [
      "How does multi-level paging reduce memory overhead compared to a flat page table?",
      "What role does the TLB play in address translation and what happens on a TLB miss?",
      "Compare paging and segmentation: advantages and disadvantages of each approach.",
      "How does ASLR improve security and what are its limitations?",
    ],
    relatedConcepts: ["page-replacement", "memory-allocation", "cpu-scheduling"],
  },
  {
    slug: "memory-allocation",
    name: "Memory Allocation",
    description:
      "Explore dynamic memory allocation strategies used by operating systems and runtimes. Compare first fit, best fit, buddy system, and slab allocation with fragmentation visualizations.",
    difficulty: "intermediate",
    keywords: [
      "memory allocation",
      "first fit",
      "best fit",
      "buddy system",
      "slab allocator",
      "fragmentation",
      "malloc",
    ],
    algorithms: [
      "First Fit",
      "Best Fit",
      "Worst Fit",
      "Buddy System",
      "Slab Allocation",
      "Next Fit",
    ],
    explanation: [
      "Dynamic memory allocation is the process of assigning blocks of memory to processes at runtime. The OS kernel manages physical memory allocation for processes, while user-space allocators like malloc manage the heap within a process. The central challenge is satisfying variable-size allocation requests efficiently while minimizing fragmentation. External fragmentation occurs when free memory is scattered in small non-contiguous blocks; internal fragmentation occurs when allocated blocks are larger than requested.",
      "Sequential fit algorithms maintain a free list and search for a suitable block. First Fit selects the first block large enough, offering fast allocation but causing fragmentation near the start of memory. Best Fit selects the smallest adequate block, minimizing wasted space per allocation but creating many tiny unusable fragments. Next Fit continues the search from where the last allocation ended, distributing fragmentation more evenly. These simple strategies work well for general-purpose allocation but struggle under high-throughput workloads.",
      "The Buddy System divides memory into power-of-two-sized blocks. When a request arrives, the smallest sufficient power-of-two block is allocated; if only a larger block is available, it is split into two buddies recursively. Coalescing is efficient because buddies can only merge with their partner. The Linux kernel uses a buddy system for page-frame allocation. For kernel objects of fixed sizes, the Slab Allocator pre-allocates caches of commonly used object sizes, virtually eliminating fragmentation and initialization overhead for frequently allocated structures like inodes and task descriptors.",
    ],
    interviewQuestions: [
      "What is the difference between internal and external fragmentation?",
      "How does the buddy system make coalescing efficient?",
      "Why does the Linux kernel use a slab allocator on top of the buddy system?",
      "Compare first fit, best fit, and worst fit in terms of speed and fragmentation.",
    ],
    relatedConcepts: ["memory-management", "page-replacement", "cpu-scheduling"],
  },
  {
    slug: "thread-synchronization",
    name: "Thread Synchronization",
    description:
      "Master the concurrency primitives that prevent race conditions. Visualize mutexes, semaphores, monitors, and condition variables with interactive producer-consumer and reader-writer simulations.",
    difficulty: "advanced",
    keywords: [
      "thread synchronization",
      "mutex",
      "semaphore",
      "monitor",
      "condition variable",
      "race condition",
      "concurrency",
    ],
    algorithms: [
      "Mutex Lock",
      "Counting Semaphore",
      "Read-Write Lock",
      "Monitor",
      "Barrier",
      "Spinlock",
    ],
    explanation: [
      "When multiple threads share memory, concurrent access to shared data can produce incorrect results due to race conditions. Thread synchronization mechanisms ensure that critical sections of code are executed in a controlled manner, preserving data integrity. The simplest primitive is the mutex (mutual exclusion lock), which allows only one thread to hold it at a time. A thread that attempts to acquire a held mutex is blocked until the owner releases it. While effective, mutexes require careful usage to avoid deadlocks, priority inversion, and performance bottlenecks.",
      "Semaphores generalize mutexes by maintaining a counter. A counting semaphore allows up to N threads to enter a section concurrently, making it ideal for resource pools (e.g., connection pools with a fixed number of connections). The classic producer-consumer problem uses two semaphores: one tracking empty buffer slots and one tracking filled slots, ensuring producers wait when the buffer is full and consumers wait when it is empty. Condition variables complement mutexes by allowing a thread to atomically release a lock and sleep until a specific condition is signaled by another thread.",
      "Monitors combine mutual exclusion with condition variables into a higher-level synchronization construct. Java's synchronized keyword and Python's threading.Condition implement monitor semantics. Read-write locks optimize for workloads where reads far outnumber writes: multiple readers can proceed concurrently, but a writer requires exclusive access. Modern concurrent data structures often use lock-free algorithms based on atomic compare-and-swap (CAS) operations, avoiding locks entirely at the cost of increased algorithmic complexity. Understanding these primitives is critical for building correct and performant concurrent systems.",
    ],
    interviewQuestions: [
      "What is the difference between a mutex and a semaphore?",
      "Explain the producer-consumer problem and how to solve it with semaphores.",
      "What is priority inversion and how does priority inheritance solve it?",
      "When would you use a read-write lock instead of a mutex?",
    ],
    relatedConcepts: ["deadlock-detection", "cpu-scheduling", "memory-management"],
  },
];

/** Look up an OS concept by slug. */
export function getOSConceptBySlug(slug: string): OSConceptData | undefined {
  return OS_CONCEPTS.find((c) => c.slug === slug);
}

/** Return all OS concept slugs for static generation. */
export function getAllOSConceptSlugs(): string[] {
  return OS_CONCEPTS.map((c) => c.slug);
}

/** Return related OS concepts for a given slug. */
export function getRelatedOSConcepts(slug: string): OSConceptData[] {
  const concept = getOSConceptBySlug(slug);
  if (!concept) return [];
  return concept.relatedConcepts
    .map((relSlug) => getOSConceptBySlug(relSlug))
    .filter((c): c is OSConceptData => c !== undefined);
}
