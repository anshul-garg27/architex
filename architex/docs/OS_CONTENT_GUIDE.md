# OS Module Content Style Guide

Every OS concept in Architex follows a strict 8-section template. This guide defines each section, states the minimum quality bar, and provides two fully worked examples (FCFS and LRU) as reference implementations.

---

## The 8 Required Sections

### 1. Hook — "Why should I care?"

A single paragraph (2-4 sentences) that connects the concept to something the reader already cares about: interview performance, production reliability, or day-to-day engineering intuition. Do not start with a definition. Start with a consequence of not understanding the concept.

**Quality bar:** The reader should feel urgency. If the hook could apply to any CS concept, it is too generic.

### 2. Analogy — Concrete intuition before formalism

A real-world analogy that maps 1:1 to the algorithm's key mechanism. Name the physical objects that correspond to processes, frames, queues, etc. The analogy must hold for at least 3 steps of the algorithm before breaking down.

**Quality bar:** A non-CS friend should be able to repeat the analogy back to you and get the core idea right.

### 3. WHY Steps — Every step explains the algorithm's reasoning

A step-by-step walkthrough of the algorithm on a small input. Each step must include a "WHY" clause that explains the decision rule, not just what happened. Format as a numbered list where each entry follows:

```
Step N: [Action taken]
WHY: [The specific rule or condition that caused this action]
```

**Quality bar:** Covering the action without a WHY clause is incomplete. The WHY must reference the algorithm's invariant or selection criterion, not just restate the action.

### 4. Complexity Intuition — What O(n) MEANS

Do not just state the Big-O. Explain what it means in concrete terms for this algorithm. How does doubling the input affect wall-clock behavior? What is the constant factor hiding? Where does the bottleneck sit (CPU, memory, comparisons)?

**Quality bar:** The reader should be able to answer "if I have 1000 processes/pages instead of 10, what changes?" after reading this section.

### 5. Edge Case — Preset demonstrating interesting behavior

A specific input configuration that triggers non-obvious behavior: ties, starvation, Belady's anomaly, convoy effects, etc. Include the input, the expected output, and a 1-2 sentence explanation of why this case is worth knowing.

**Quality bar:** The edge case must be something an interviewer would ask about, not a degenerate empty-input case.

### 6. Real-World — Where this is used in production

Name 2-4 concrete production systems, libraries, or kernel subsystems that use this algorithm (or a close variant). Include enough context that the reader understands why the algorithm fits that use case.

**Quality bar:** "Used in operating systems" is not specific enough. "Linux CFS uses a red-black tree variant of fair scheduling" is.

### 7. Common Mistake — What students get wrong

Identify the single most frequent misconception or implementation error for this concept. State the mistake, explain why it is wrong, and show the correct understanding.

**Quality bar:** This should come from real teaching/interview experience, not a theoretical edge case.

### 8. Summary — 3-bullet flashcard content

Exactly 3 bullet points. Each bullet is one sentence. Together they must answer: (a) what does this algorithm do, (b) what is its key tradeoff, (c) when should you choose it.

**Quality bar:** A reader should be able to reconstruct the algorithm's purpose from these 3 bullets alone.

---

## Worked Example 1: FCFS (First-Come, First-Served)

### 1. Hook

You are debugging a production incident where a 200ms API call is taking 4 seconds. The database connection pool uses FCFS queuing, and a single long-running analytics query is blocking 47 short reads behind it. Understanding FCFS means understanding the convoy effect -- the single most common source of unexpected latency in queued systems.

### 2. Analogy

A single-lane drive-through at a coffee shop. Cars are served in the exact order they arrive. If the first car orders 14 custom drinks, every car behind it waits -- even those that just want a black coffee. There is no passing lane. The barista (CPU) never looks ahead to see if a faster order could go first.

Mapping:
- Car = Process
- Order complexity = Burst time
- Drive-through lane = Ready queue
- Barista = CPU
- No passing = Non-preemptive

### 3. WHY Steps

Input: P1(arrival=0, burst=6), P2(arrival=1, burst=3), P3(arrival=2, burst=1)

```
Step 1: P1 starts execution at t=0
WHY: FCFS selects P1 because it arrived first (t=0). No other process is in the queue yet.

Step 2: P2 arrives at t=1, joins the ready queue
WHY: P2 arrived at t=1 but FCFS is non-preemptive -- P1 cannot be interrupted.

Step 3: P3 arrives at t=2, joins the ready queue behind P2
WHY: P3's arrival time (t=2) is after P2's (t=1), so P3 is positioned behind P2 in FIFO order.

Step 4: P1 completes at t=6. P2 starts execution.
WHY: FCFS selects P2 because it is at the front of the ready queue (arrived at t=1 before P3 at t=2).

Step 5: P2 completes at t=9. P3 starts execution.
WHY: P3 is the only remaining process in the ready queue.

Step 6: P3 completes at t=10.
WHY: P3's burst of 1 unit finishes. All processes complete.
```

Results: Avg wait = (0 + 5 + 7) / 3 = 4.0, Avg turnaround = (6 + 8 + 8) / 3 = 7.33

### 4. Complexity Intuition

FCFS runs in O(n) time for n processes -- one pass through the sorted arrival list, no comparisons between processes. The simplicity is the point: zero scheduling overhead. But average waiting time can be O(n * max_burst) in the worst case (convoy effect), because one long process delays every subsequent short process. Doubling the number of processes doubles the total schedule length linearly, but if the first process has a huge burst, all others pay the penalty regardless of their own burst times.

### 5. Edge Case: Convoy Effect

Input: P1(arrival=0, burst=100), P2(arrival=1, burst=1), P3(arrival=2, burst=1), P4(arrival=3, burst=1)

P2, P3, and P4 each wait ~100 time units for their 1-unit burst. Average waiting time: 74.25. Compare with SJF on the same input: average waiting time drops to 1.5. This demonstrates the convoy effect -- a single long process at the head of the queue inflates waiting time for all subsequent short processes.

### 6. Real-World

- **Print queues:** Most OS print spoolers use FCFS. Print jobs rarely vary by orders of magnitude in size, so the convoy effect is tolerable, and fairness (no starvation) is valued.
- **Batch job schedulers:** Hadoop FIFO scheduler (the default before CapacityScheduler) processes MapReduce jobs in submission order.
- **Network packet queues:** Basic FIFO queuing in routers (tail-drop) before QoS mechanisms like WFQ are applied.

### 7. Common Mistake

**Mistake:** "FCFS is always fair because everyone waits their turn."

**Why it is wrong:** FCFS guarantees no starvation (every process eventually runs), but it is not "fair" in terms of wait-time proportionality. A process with burst=1 can wait 100 time units behind a burst=100 process. Fairness requires considering the ratio of wait time to service time, which FCFS ignores entirely.

### 8. Summary

- FCFS schedules processes in arrival order with zero preemption -- the simplest possible scheduling algorithm.
- Its key tradeoff is simplicity vs. the convoy effect: one long process penalizes all shorter processes behind it.
- Choose FCFS when job sizes are roughly uniform and implementation simplicity matters more than minimizing average wait time.

---

## Worked Example 2: LRU (Least Recently Used)

### 1. Hook

You have a bookshelf with 3 slots next to your desk. When you need a new book, you must remove one to make room. Which one do you remove? If you always remove the one you have not touched in the longest time, you are doing LRU. Every in-memory cache you have ever used -- from Redis eviction to your browser's back-forward cache -- relies on some variant of this idea. Getting the eviction policy wrong means cache misses in production, and cache misses mean latency spikes.

### 2. Analogy

A bookshelf with exactly 3 slots. Every time you pick up a book, it becomes the "most recently used." When a new book arrives and the shelf is full, you remove the book you have not touched in the longest time -- it is gathering the most dust. The dust level is the timestamp of last access.

Mapping:
- Bookshelf slots = Page frames
- Books = Pages
- Picking up a book = Accessing a page (updates recency)
- Dustiest book = Least recently used page
- New book arriving = Page fault

### 3. WHY Steps

Input: Reference string [7, 0, 1, 2, 0, 3], Frame count = 3

```
Step 1: Reference page 7 -> FAULT. Load 7 into frame 0. Frames: [7]
WHY: No pages in memory yet. Any reference is a compulsory fault.

Step 2: Reference page 0 -> FAULT. Load 0 into frame 1. Frames: [7, 0]
WHY: Page 0 is not in frames. Empty frame available, no eviction needed.

Step 3: Reference page 1 -> FAULT. Load 1 into frame 2. Frames: [7, 0, 1]
WHY: Page 1 is not in frames. Last empty frame used.

Step 4: Reference page 2 -> FAULT. Evict page 7. Frames: [2, 0, 1]
WHY: LRU evicts page 7 because it was accessed longest ago (t=0). Page 0 was accessed at t=1, page 1 at t=2. Page 7's last access is the oldest.

Step 5: Reference page 0 -> HIT. Frames: [2, 0, 1]
WHY: Page 0 is already in frames. Its last-access timestamp updates to t=4. No eviction.

Step 6: Reference page 3 -> FAULT. Evict page 1. Frames: [2, 0, 3]
WHY: LRU evicts page 1 because it was accessed longest ago (t=2). Page 2 was last accessed at t=3, page 0 at t=4. Temporal locality drives the decision.
```

Results: 5 faults, 1 hit, hit rate = 16.7%

### 4. Complexity Intuition

Naive LRU scans all frames on every reference to find the least-recently-used page, giving O(f) per reference and O(n * f) total for n references and f frames. With a hash map + doubly-linked list (the classic LRU cache implementation), each reference is O(1) for both lookup and recency update. The practical difference: with 10,000 frames and 1,000,000 references, naive LRU does 10 billion comparisons; the optimized version does 1 million hash lookups. This is why every production LRU cache uses the hash+list approach.

### 5. Edge Case: Temporal Locality Breakdown

Input: Reference string [1, 2, 3, 4, 1, 2, 3, 4], Frame count = 3

Every reference is a fault (0% hit rate). The working set size (4 pages) exceeds the frame count (3), and the access pattern is a strict cycle with no temporal locality. LRU performs identically to FIFO here. This is the worst case for LRU: sequential scans through a dataset larger than the cache. Production fix: scan-resistant variants like LRU-K or ARC.

### 6. Real-World

- **Linux page cache:** The kernel uses a two-list approximation of LRU (active/inactive lists) to decide which pages to evict under memory pressure.
- **Redis `allkeys-lru`:** Redis samples keys and evicts the least recently accessed. It uses an approximation (sampling, not true LRU) for performance.
- **CPU TLB replacement:** Many TLB implementations use LRU or pseudo-LRU to decide which translation entries to evict.
- **Database buffer pools:** PostgreSQL's buffer manager uses a clock-sweep (LRU approximation) for shared buffer eviction.

### 7. Common Mistake

**Mistake:** "LRU always outperforms FIFO."

**Why it is wrong:** LRU and FIFO have identical performance on sequential scan patterns (as shown in the edge case above). LRU's advantage appears only when the workload exhibits temporal locality -- recently accessed pages are likely to be accessed again soon. For workloads that cycle through pages sequentially, LRU provides zero benefit over FIFO while adding implementation complexity (the hash+list structure). This is why databases use scan-resistant variants rather than pure LRU.

### 8. Summary

- LRU evicts the page whose most recent access is furthest in the past, exploiting temporal locality to minimize cache misses.
- Its key tradeoff is hit-rate improvement vs. implementation cost: true LRU requires O(1) data structures (hash map + linked list) that add memory overhead per cached entry.
- Choose LRU when your workload has strong temporal locality; switch to LRU-K or ARC when sequential scans are common.

---

## Pre-Ship Checklist

Before any OS concept is merged, verify all 8 sections are present and meet the quality bar:

- [ ] **Hook** -- Connects to a real consequence (interview, production, engineering). Not a dictionary definition.
- [ ] **Analogy** -- Maps to the algorithm 1:1 for at least 3 steps. A non-CS reader could follow it.
- [ ] **WHY Steps** -- Every step has an explicit WHY clause referencing the algorithm's decision rule.
- [ ] **Complexity Intuition** -- Explains what doubling the input means in practice, not just the Big-O symbol.
- [ ] **Edge Case** -- Non-obvious input that triggers interesting behavior. Interview-worthy.
- [ ] **Real-World** -- Names 2+ specific systems/libraries, not vague categories.
- [ ] **Common Mistake** -- States the mistake, explains why it is wrong, provides the correct understanding.
- [ ] **Summary** -- Exactly 3 bullets: what, tradeoff, when-to-choose.

## Grading Rubric

Each section is scored 0-4 points. Missing section = 0. Total possible = 32 points (8 sections x 4 points).

| Grade | Score Range | Ship? |
|-------|-------------|-------|
| A     | 28-32       | Yes   |
| B     | 22-27       | Yes   |
| C     | 18-21       | Yes (minimum bar) |
| D     | 12-17       | No -- revise |
| F     | 0-11        | No -- rewrite |

**No concept ships below Grade C (18/32).**

### Scoring Guide Per Section

- **4 points:** Exceeds the quality bar. Could be used as a reference example.
- **3 points:** Meets the quality bar. No issues.
- **2 points:** Present but below quality bar. Needs minor revision.
- **1 point:** Present but substantially below bar. Needs major revision.
- **0 points:** Missing or placeholder content.

---

## Content Patterns from the Engine Code

The following patterns are derived from `src/lib/os/scheduling.ts` and `src/lib/os/page-replacement.ts` and should be reflected in content:

### Scheduling Content Must Cover:
- Event descriptions use the format: `"{ProcessName} {action} ({context})"` -- content WHY steps should match this specificity
- Algorithms produce Gantt charts, per-process metrics (wait time, turnaround, response time), and CPU utilization -- content should reference these outputs
- Five algorithms are implemented: FCFS, SJF, SRTF, Round Robin, Priority, MLFQ -- content exists or is planned for each
- The `compareAlgorithms` function runs all algorithms on the same input -- content should encourage comparative analysis

### Page Replacement Content Must Cover:
- Events track frame state at every reference -- content walkthroughs should show frame state after each step
- Four algorithms are implemented: FIFO, LRU, Optimal, Clock -- content exists or is planned for each
- Hit rate and fault rate are the primary metrics -- content should reference these, not just fault counts
- The `comparePageAlgorithms` function enables side-by-side comparison -- content should leverage this
