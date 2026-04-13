# Cache Eviction Policies -- Deep Dive

## Overview

When the cache is full and a new entry must be added, which existing entry gets removed?
That decision is the eviction policy. The right policy can mean the difference between
a 95% hit ratio and a 70% hit ratio.

```
  Cache is FULL. New item arrives. Who gets kicked out?

  +-------+-------+-------+-------+-------+
  |  A    |  B    |  C    |  D    |  E    |   <-- cache is full
  +-------+-------+-------+-------+-------+
                                      ^
                                      |
                 New item F wants in. Who leaves?

  LRU  --> evict the one accessed longest ago
  LFU  --> evict the one accessed least often
  FIFO --> evict the one inserted first
  Random -> evict a random one
```

---

## 1. LRU (Least Recently Used)

The most widely used eviction policy. Evicts the entry that was accessed (read or write)
the longest time ago. Based on the principle of temporal locality: if something was used
recently, it will likely be used again soon.

### Data Structure: Doubly Linked List + HashMap

```
  HashMap (O(1) lookup)
  +----------+     +----------+     +----------+
  | key: "A" |     | key: "B" |     | key: "C" |
  | ptr: *-->|--+  | ptr: *-->|--+  | ptr: *-->|--+
  +----------+  |  +----------+  |  +----------+  |
                |                |                |
                v                v                v
  Doubly Linked List (O(1) insert/remove)
  HEAD                                          TAIL
  (most recent)                                 (least recent)
  +------+    +------+    +------+    +------+
  | Node | <->| Node | <->| Node | <->| Node |
  |  D   |    |  A   |    |  B   |    |  C   |
  +------+    +------+    +------+    +------+
    ^                                    ^
    |                                    |
  Most recently                    EVICT THIS
  accessed                         on capacity miss
```

### Operations (all O(1))

```
  GET(key):
    1. HashMap lookup --> O(1)
    2. Move node to HEAD of list --> O(1)
    3. Return value

  PUT(key, value):
    1. If key exists: update value, move to HEAD --> O(1)
    2. If key doesn't exist:
       a. If cache full: remove TAIL node, delete from HashMap --> O(1)
       b. Insert new node at HEAD, add to HashMap --> O(1)

  DELETE(key):
    1. HashMap lookup --> O(1)
    2. Remove node from linked list --> O(1)
    3. Delete from HashMap --> O(1)
```

### LRU Cache Implementation (Python)

```python
class Node:
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}  # key -> Node

        # Dummy head and tail (sentinel nodes)
        self.head = Node()  # most recent
        self.tail = Node()  # least recent
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        """Remove node from doubly linked list -- O(1)"""
        prev_node = node.prev
        next_node = node.next
        prev_node.next = next_node
        next_node.prev = prev_node

    def _add_to_front(self, node: Node):
        """Add node right after head (most recent) -- O(1)"""
        node.prev = self.head
        node.next = self.head.next
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)        # remove from current position
            self._add_to_front(node)  # move to front (most recent)
            return node.val
        return -1  # cache miss

    def put(self, key: int, value: int):
        if key in self.cache:
            self._remove(self.cache[key])

        node = Node(key, value)
        self._add_to_front(node)
        self.cache[key] = node

        if len(self.cache) > self.cap:
            # Evict LRU (node before tail sentinel)
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

# Usage
cache = LRUCache(3)
cache.put(1, "A")
cache.put(2, "B")
cache.put(3, "C")
cache.get(1)        # Access "A", moves to front
cache.put(4, "D")   # Cache full, evicts key 2 ("B" -- least recent)
```

### Pros
- Simple to understand and implement
- O(1) for all operations
- Good hit ratio for workloads with temporal locality

### Cons
- Does not consider frequency (a one-time scan evicts hot data)
- Extra memory for linked list pointers (16 bytes/entry overhead)
- Not scan-resistant (sequential access pollutes cache)

---

## 2. LFU (Least Frequently Used)

Evicts the entry that has been accessed the fewest times. If tied, evict the least
recently used among them. Good for workloads with stable "hot" items.

### Data Structure

```
  Frequency Buckets:
  freq=1:  [D] --> [E]           (accessed once)
  freq=2:  [B]                    (accessed twice)
  freq=5:  [A] --> [C]           (accessed five times)

  On eviction: remove from lowest frequency bucket (D -- LRU among freq=1)
  On access:   move item to next frequency bucket
```

### Pros
- Excellent for stable hotsets (popular items stay cached)
- Better than LRU when a small set of items dominates traffic

### Cons
- New items are immediately vulnerable to eviction (frequency = 1)
- Historical frequency doesn't decay -- items that were hot long ago stay cached
- More complex implementation than LRU
- Higher memory overhead (frequency counters)

### When to Use
- CDN caching where popular content is accessed repeatedly
- DNS caching, font caches
- Workloads with clear popularity distribution

---

## 3. FIFO (First In, First Out)

Simple queue. The oldest entry (by insertion time, not access time) is evicted first.
Accessing an entry does NOT change its position.

```
  Insert order: A -> B -> C -> D -> E
                                     ^
  +---+---+---+---+---+             |
  | A | B | C | D | E |   New item F arrives
  +---+---+---+---+---+             |
    ^                                |
    |                                |
  EVICT A                     INSERT F
  (first in)                  (at back)
```

### Pros
- Extremely simple (just a queue)
- Very low overhead
- Predictable behavior

### Cons
- Does not consider recency or frequency
- Poor hit ratio for most workloads
- Hot items get evicted just for being old

### When to Use
- Streaming data where order matters
- Session timeouts
- Message queues and buffers
- When simplicity is the priority

---

## 4. Random Eviction

Pick a random entry to evict. Surprisingly competitive with LRU for some workloads.

### Pros
- Simplest possible implementation (no bookkeeping)
- No overhead per access (no list/counter updates)
- Immune to adversarial access patterns (cannot be pathologically bad)
- Competitive with LRU for uniform random access patterns

### Cons
- Unpredictable -- may evict hot items
- Lower hit ratio than LRU for most real workloads
- No tuning knobs

### When to Use
- When overhead of LRU tracking is too expensive
- CPU caches (some architectures use pseudo-random)
- When access patterns are genuinely random

---

## 5. TTL-Based (Time-To-Live)

Not strictly an eviction policy but a complementary mechanism. Each entry has an
expiration time. After TTL expires, the entry is removed (lazily or eagerly).

```
  Key "session:abc" inserted at T=0, TTL=300s

  T=0s       T=150s      T=300s      T=301s
  |           |           |           |
  v           v           v           v
  ALIVE       ALIVE       EXPIRED     EVICTED
  (fresh)     (fresh)     (stale)     (removed)
```

### Two Deletion Approaches

```
  Lazy Deletion:
    - Don't proactively scan for expired keys
    - Check TTL on access; if expired, delete and return miss
    - Pros: no background work. Cons: memory leak for unaccessed keys

  Active Deletion (Redis approach):
    - Background job periodically samples random keys
    - Delete expired ones found in sample
    - Redis: 20 random keys sampled 10x/second; if >25% expired, repeat
    - Pros: reclaims memory. Cons: CPU overhead
```

### Pros
- Guarantees freshness (data cannot be older than TTL)
- Works alongside other policies (LRU + TTL is common)
- Simple to reason about

### Cons
- Choosing the right TTL is hard (too short = many misses, too long = stale data)
- Mass expiration causes cache avalanche (see cache-challenges.md)
- Memory waste if lazy deletion is used

---

## 6. W-TinyLFU (Caffeine Cache)

The state-of-the-art eviction policy used by Caffeine (Java) and many modern caches.
Combines a small admission window (LRU) with a main cache (Segmented LRU), using a
TinyLFU frequency sketch as the admission filter.

### Architecture

```
  +-------------------+    +-----------------------------+
  |  Admission Window |    |       Main Cache            |
  |  (1% of cache)    |    |   (99% of cache)            |
  |                    |    |                             |
  |  [LRU queue]      |    |  +-----------+-----------+  |
  |                    |    |  | Protected | Probation |  |
  |  New items enter   |    |  | Segment   | Segment   |  |
  |  here first        |    |  | (80%)     | (20%)     |  |
  +-------------------+    |  +-----------+-----------+  |
         |                  +-----------------------------+
         | Evicted from                   ^
         | window?                        |
         v                                |
  +-------------------+                   |
  | TinyLFU Sketch    |    Admitted if frequency(new) >
  | (Count-Min Sketch)|    frequency(victim from probation)
  | 8 bits per counter|
  +-------------------+

  Flow:
  1. New item enters Admission Window (LRU, small)
  2. When evicted from window, compare its frequency to
     victim candidate from main cache's probation segment
  3. Higher frequency wins admission to main cache
  4. Frequency tracked by Count-Min Sketch (space-efficient)
  5. Periodic frequency halving prevents historical bias
```

### Why It Wins
- **Scan-resistant:** one-time accesses stay in the small window and never pollute main cache
- **Frequency-aware:** popular items are admitted, unpopular ones are rejected
- **Recency-aware:** the window and SLRU capture recency
- **Low overhead:** Count-Min Sketch uses only ~8 bits per counter

### Real-World
Caffeine (Java) achieves near-optimal hit ratios. Benchmarks show it consistently beats
LRU, LFU, and ARC across diverse workloads.

---

## 7. ARC (Adaptive Replacement Cache)

Dynamically balances between recency (LRU) and frequency (LFU) by maintaining ghost
entries for recently evicted items.

### Architecture

```
  +----------+    +----------+    +----------+    +----------+
  |  Ghost   |    |   T1     |    |   T2     |    |  Ghost   |
  |  B1      |    | (Recent) |    | (Freq)   |    |  B2      |
  | (history)|    |          |    |          |    | (history)|
  +----------+    +----------+    +----------+    +----------+
       ^               ^               ^               ^
       |               |               |               |
  Tracks evicted  Items accessed  Items accessed   Tracks evicted
  from T1         once (recency)  2+ times (freq)  from T2
  (miss in B1     (LRU behavior)  (LFU behavior)   (miss in B2
   = grow T1)                                        = grow T2)

  Adaptation: if many misses hit B1 ghost list --> grow T1 (favor recency)
              if many misses hit B2 ghost list --> grow T2 (favor frequency)
```

### Pros
- Self-tuning: adapts to workload changes automatically
- Excellent hit ratio across diverse workloads
- Scan-resistant

### Cons
- Patented by IBM (licensing concerns)
- More complex to implement
- Higher memory overhead (ghost lists)
- Used in ZFS and some OS page caches

---

## 8. SLRU (Segmented LRU)

Divides the cache into two segments: probationary and protected. New items enter
probation. If accessed again, they are promoted to protected.

```
  +---------------------+    +---------------------+
  |    Probationary      |    |     Protected        |
  |    Segment (20%)     |    |     Segment (80%)    |
  +---------------------+    +---------------------+
         ^     |                    ^     |
         |     |                    |     |
   New items   | Accessed again?    |     | Evicted from
   enter here  +----YES----------->+     | protected goes
               |                          | to probationary
               | Evicted from             |
               | probationary?            |
               +---> REMOVED              +
                     (gone)
```

### Pros
- Protects frequently accessed items from eviction
- Simple to implement (two LRU lists)
- Better than plain LRU for mixed workloads

### Cons
- Fixed segment sizes may not be optimal
- Does not adapt to workload changes like ARC
- Still vulnerable to frequency-based attacks

---

## Comprehensive Comparison Table

```
+----------+-----------+----------+----------+-----------+----------+
| Policy   | Hit Ratio | Memory   | Impl     | Scan      | Best For |
|          | (typical) | Overhead | Complex  | Resistant |          |
+----------+-----------+----------+----------+-----------+----------+
| LRU      | Good      | Medium   | Low      | No        | General  |
|          | (85-92%)  | (ptrs)   |          |           | purpose  |
+----------+-----------+----------+----------+-----------+----------+
| LFU      | Good      | High     | Medium   | Yes       | Stable   |
|          | (87-93%)  | (counters|          |           | hotsets  |
|          |           |  + lists)|          |           |          |
+----------+-----------+----------+----------+-----------+----------+
| FIFO     | Fair      | Very Low | Very Low | No        | Streaming|
|          | (75-85%)  | (queue)  |          |           | buffers  |
+----------+-----------+----------+----------+-----------+----------+
| Random   | Fair      | None     | Trivial  | Yes       | Uniform  |
|          | (75-85%)  |          |          |           | access   |
+----------+-----------+----------+----------+-----------+----------+
| TTL      | N/A       | Low      | Low      | N/A       | Freshness|
|          | (additive)|          |          |           | guarantee|
+----------+-----------+----------+----------+-----------+----------+
| W-TinyLFU| Best      | Low      | High     | Yes       | Modern   |
| (Caffeine)| (93-98%) | (sketch) |          |           | apps     |
+----------+-----------+----------+----------+-----------+----------+
| ARC      | Excellent | High     | High     | Yes       | File     |
|          | (90-96%)  | (ghosts) |          |           | systems  |
+----------+-----------+----------+----------+-----------+----------+
| SLRU     | Very Good | Medium   | Medium   | Partial   | Web      |
|          | (88-94%)  | (2 lists)|          |           | proxies  |
+----------+-----------+----------+----------+-----------+----------+
```

---

## Decision Flowchart

```
Need an eviction policy?
  |
  v
Is implementation simplicity the priority?
  |          |
  YES        NO
  |          |
  v          v
LRU       Need best possible hit ratio?
(default)   |          |
            YES        NO
            |          |
            v          v
          W-TinyLFU   Is workload frequency-dominated?
          (if Java/   (stable set of popular items)
           Caffeine)    |          |
                        YES        NO
                        |          |
                        v          v
                       LFU       Need self-tuning?
                                  |          |
                                  YES        NO
                                  |          |
                                  v          v
                                 ARC       SLRU

Always add TTL on top of any eviction policy.
```

---

## LRU Implementation in Java (LinkedHashMap trick)

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        // accessOrder=true makes it LRU (reorders on get)
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }

    // Usage:
    // LRUCache<String, String> cache = new LRUCache<>(1000);
    // cache.put("key", "value");
    // cache.get("key");  // moves to end (most recent)
}
```

---

## Interview Quick-Reference

**Q: "Implement an LRU cache with O(1) get and put."**
A: HashMap + Doubly Linked List. HashMap for O(1) lookup, DLL for O(1) reorder.
   See the Python implementation above -- this is LeetCode #146.

**Q: "What eviction policy does Redis use?"**
A: Redis supports multiple: noeviction, allkeys-lru, volatile-lru, allkeys-lfu,
   volatile-lfu, allkeys-random, volatile-random, volatile-ttl.
   Default is noeviction (returns error when full).
   Most common in production: allkeys-lru.

**Q: "Why is W-TinyLFU better than LRU?"**
A: It combines frequency AND recency, uses a Count-Min Sketch for space-efficient
   frequency tracking, and has an admission window that makes it scan-resistant.
   One-time accesses don't pollute the main cache.

**Q: "What is the overhead of an LRU cache?"**
A: Two pointers per entry (prev/next) = ~16 bytes overhead. Plus the HashMap entry.
   For a 1M entry cache with 100-byte values, overhead is ~1.6% -- negligible.
