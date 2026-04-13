// -----------------------------------------------------------------
// Architex -- DS Catalog (metadata only, no runtime implementations)
// -----------------------------------------------------------------
// Extracted from index.ts so that components needing only catalog
// metadata (DSSidebar, DSControls, DSProperties) do NOT pull in
// the full barrel of 41 implementation files.
// -----------------------------------------------------------------

import type { DSConfig } from './types';

export const DS_CATALOG: DSConfig[] = [
  {
    id: 'array',
    name: 'Array',
    category: 'linear',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Access': 'O(1)',
      'Search': 'O(n)',
      'Insert': 'O(n)',
      'Delete': 'O(n)',
    },
    description:
      'Every program you use has arrays at its core — they power everything from spreadsheets to video buffers. Think of numbered mailboxes in a row: you can instantly check mailbox #5, but inserting a new one between #3 and #4 means shifting everything after it. O(1) random access, O(n) insert/delete due to shifting.',
    complexityIntuition:
      'Accessing element #500 in a million-element array is just as fast as accessing #1 (O(1)). But inserting at position 0 means shifting every element — double the array, double the work (O(n)).',
    difficulty: 'beginner',
    realWorld: ['JavaScript V8 engine', 'NumPy arrays', 'Database row storage'],
    keyTakeaways: [
      'O(1) random access by index — the fastest possible read',
      'Insert/delete requires shifting — O(n) cost grows with array size',
      'Use when you know the size upfront and need fast access by position',
    ],
    whenToUse: { use: 'Fast access by index, fixed-size collections', dontUse: 'Frequent insert/delete in middle' },
    commonMistakes: [
      "'Arrays are always O(1)' — Insert/delete is O(n) due to shifting",
      "'Access and search are the same' — Access by index is O(1), search by value is O(n)",
      "'Dynamic arrays never waste memory' — Doubling strategy can use up to 2x needed memory",
    ],
    interviewTips: [
      'Asked at every company. Know: two pointers, sliding window, prefix sums.',
      'If asked to optimize O(n^2) to O(n), think hash map + array combo.',
      "Kadane's algorithm for max subarray is a classic — know it cold.",
    ],
  },
  {
    id: 'stack',
    name: 'Stack',
    category: 'linear',
    operations: ['push', 'pop', 'peek'],
    complexity: {
      'Push': 'O(1)',
      'Pop': 'O(1)',
      'Peek': 'O(1)',
      'Search': 'O(n)',
    },
    description:
      'Your browser\'s Back button is a stack — every page you visit is pushed on top, and Back pops the most recent. Imagine a spring-loaded plate dispenser: you always grab from the top, and new plates go on top. LIFO structure with O(1) push, pop, and peek.',
    complexityIntuition:
      'Push, pop, and peek all touch only the top element — O(1) regardless of stack size. But finding a specific item buried deep means scanning everything (O(n)), so stacks are not for search.',
    difficulty: 'beginner',
    realWorld: ['Browser back button', 'Undo/redo in editors', 'Call stack in recursion'],
    keyTakeaways: [
      'LIFO order — last in, first out, like a plate dispenser',
      'O(1) push, pop, and peek — all operations touch only the top',
      'Use for backtracking, expression evaluation, and DFS traversal',
    ],
    whenToUse: { use: 'Backtracking, undo/redo, DFS, expression parsing', dontUse: 'FIFO ordering or random access needed' },
  },
  {
    id: 'queue',
    name: 'Queue',
    category: 'linear',
    operations: ['enqueue', 'dequeue', 'peek'],
    complexity: {
      'Enqueue': 'O(1)',
      'Dequeue': 'O(n)*',
      'Peek': 'O(1)',
      'Search': 'O(n)',
    },
    description:
      'A printer queue, a coffee shop line, a customer support ticket system — first come, first served. Like a tunnel: items enter at one end and exit at the other in the same order. FIFO structure with O(1) enqueue and peek. (*Array-based dequeue is O(n) due to shifting.)',
    complexityIntuition:
      'Adding to the back is instant (O(1)), but removing from the front in an array-backed queue shifts every remaining element forward (O(n)). A linked-list or circular buffer fixes this to O(1).',
    difficulty: 'beginner',
    realWorld: ['Print queue', 'BFS traversal', 'Message queues (RabbitMQ)'],
    keyTakeaways: [
      'FIFO order — first in, first out, like a line at a store',
      'O(1) enqueue and peek; array-based dequeue is O(n) due to shifting',
      'Use for BFS, task scheduling, and buffering between producer/consumer',
    ],
    whenToUse: { use: 'BFS, task scheduling, producer-consumer buffering', dontUse: 'Need to access elements by index or priority' },
  },
  {
    id: 'linked-list',
    name: 'Linked List',
    category: 'linear',
    operations: [{id:'insert', label:'Insert Head'}, {id:'insertTail', label:'Insert Tail'}, 'delete', 'search'],
    complexity: {
      'Access': 'O(n)',
      'Search': 'O(n)',
      'Insert Head': 'O(1)',
      'Insert Tail': 'O(n)',
      'Delete': 'O(n)',
    },
    description:
      'Like a scavenger hunt where each clue has treasure AND directions to the next location — you must follow the chain to find anything. Each node stores data plus a pointer to the next node, enabling O(1) head insertion without shifting, but requiring O(n) traversal for random access or search.',
    complexityIntuition:
      'Inserting at the head is just a pointer swap — O(1) no matter the list length. But to reach the 500th element, you must walk 499 pointers (O(n)). No shortcuts, no indexing.',
    difficulty: 'beginner',
    realWorld: ['Linux kernel linked lists', 'Browser DOM traversal', 'Blockchain blocks'],
    keyTakeaways: [
      'O(1) head insertion — no shifting required, just pointer update',
      'O(n) access and search — must walk the chain sequentially',
      'Use when frequent insertion/deletion at head matters more than random access',
    ],
    whenToUse: { use: 'Frequent head insert/delete, unknown size, iterator invalidation concerns', dontUse: 'Need random access by index (use array)' },
    commonMistakes: [
      "'Linked lists are always better than arrays for insert/delete' — Only at head; middle insert still requires O(n) traversal to find the position",
      "'Linked lists use less memory than arrays' — Each node has pointer overhead (8-16 bytes), often using MORE memory than arrays",
      "'Tail insertion is O(1)' — Only with a tail pointer; without one it is O(n)",
    ],
    interviewTips: [
      'Reverse a linked list is the #1 warm-up question. Know iterative AND recursive.',
      'Fast/slow pointer technique: detect cycles (Floyd), find middle, find kth-from-end.',
      'Dummy head node simplifies edge cases for insert/delete at head — use it in interviews.',
    ],
    edgeCasePresets: [
      { name: 'Single Element', data: '42', description: 'One-node list — head and tail are the same; tests boundary handling' },
      { name: 'Two Elements', data: '1,2', description: 'Minimal list for testing reverse, delete-head, and delete-tail operations' },
      { name: 'Descending Values', data: '5,4,3,2,1', description: 'Head-insert order — values end up reversed in the list' },
    ],
  },
  {
    id: 'hash-table',
    name: 'Hash Table',
    category: 'hash',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert (avg)': 'O(1)',
      'Search (avg)': 'O(1)',
      'Delete (avg)': 'O(1)',
      'Worst case': 'O(n)',
    },
    description:
      'Hash tables power every database, cache, and password system — when you type a URL, a hash table resolves it in nanoseconds. Imagine a library where a magic catalog (the hash function) tells you exactly which shelf holds your book. O(1) average lookup by converting any key into a bucket index; collisions are handled by chaining entries in the same bucket.',
    complexityIntuition:
      'No matter if you have 100 or 100 million entries, finding a key takes the same time on average (O(1)). But hash collisions degrade to O(n) in the worst case — a good hash function keeps this rare.',
    difficulty: 'beginner',
    realWorld: ['Redis', 'Python dict', 'JavaScript Map', 'DNS resolution'],
    keyTakeaways: [
      'O(1) average lookup — hash function gives direct bucket access',
      'Collisions degrade performance — chaining or probing to resolve',
      'Load factor > 0.75? Time to resize (double the buckets)',
    ],
    whenToUse: { use: 'O(1) key lookup, caching, deduplication', dontUse: 'Sorted data, range queries, ordered iteration' },
    commonMistakes: [
      "'Hash tables are always O(1)' — Worst case with many collisions is O(n)",
      "'Any object can be a key' — Only immutable/hashable types work correctly",
      "'Hash tables maintain insertion order' — Only in some implementations (Python 3.7+, LinkedHashMap)",
    ],
    interviewTips: [
      "LeetCode's most-used DS. Know: Two Sum pattern, group-by pattern, frequency counting.",
      'If collision handling is asked, explain both chaining AND open addressing.',
      'Hash map + array/list combo solves many O(n^2) -> O(n) optimizations.',
    ],
    edgeCasePresets: [
      { name: 'All Same Hash', data: 'aaa,bbb,ccc,ddd,eee', description: 'Keys that hash to the same bucket — worst-case O(n) chain' },
      { name: 'Perfect Distribution', data: 'alpha,beta,gamma,delta,epsilon', description: 'Keys spread evenly across buckets' },
    ],
  },
  {
    id: 'bst',
    name: 'BST',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert (avg)': 'O(log n)',
      'Search (avg)': 'O(log n)',
      'Delete (avg)': 'O(log n)',
      'Worst case': 'O(n)',
    },
    description:
      'Binary search in a phone book eliminates half the entries with each flip — a BST does the same thing organized as a tree. Every node\'s left subtree holds smaller values, right holds larger, so each comparison halves your search space. O(log n) average for insert, search, and delete — but O(n) worst case if input is sorted (degenerates to a linked list).',
    complexityIntuition:
      'Each comparison eliminates half the remaining tree. For 1 million nodes, you need at most ~20 comparisons (log\u2082(1M) \u2248 20). But if the tree degenerates into a linked list from sorted input, it becomes O(n).',
    difficulty: 'intermediate',
    realWorld: ['File system indexing (ext2)', 'In-memory sorted data', 'Symbol tables in compilers'],
    keyTakeaways: [
      'Left < Parent < Right — this rule enables binary search on a tree',
      'O(log n) average, but O(n) if tree degenerates to a linked list',
      'Self-balancing variants (AVL, RB) prevent degeneration',
    ],
    whenToUse: { use: 'Sorted data with dynamic inserts, in-order traversal', dontUse: 'When O(1) lookup needed (use hash table)' },
    commonMistakes: [
      "'BST search is always O(log n)' — Sorted input creates a degenerate O(n) tree",
      "'Deleting a node with two children is simple' — Need in-order successor replacement",
      "'BST and binary tree are the same thing' — BST has the strict ordering property (left < node < right)",
    ],
    interviewTips: [
      "Know BST property cold. Common question: 'validate if tree is BST' (in-order must be sorted).",
      'Delete with two children -> in-order successor. Draw it out in interview.',
      'In-order traversal of BST gives sorted output — this is tested surprisingly often.',
    ],
    edgeCasePresets: [
      { name: 'Sorted Input (Degenerate)', data: '1,2,3,4,5,6,7', description: 'Inserting sorted values creates a linked-list-shaped tree with O(n) height' },
      { name: 'Balanced Input', data: '4,2,6,1,3,5,7', description: 'This order creates a perfectly balanced BST' },
      { name: 'Reverse Sorted', data: '7,6,5,4,3,2,1', description: 'Mirror degenerate — all left children' },
    ],
  },
  {
    id: 'bloom-filter',
    name: 'Bloom Filter',
    category: 'probabilistic',
    operations: ['insert', 'search'],
    complexity: {
      'Insert': 'O(k)',
      'Check': 'O(k)',
      'Space': 'O(m)',
      'False positive': '(1-e^(-kn/m))^k',
    },
    description:
      'Chrome checks every URL against millions of malicious sites INSTANTLY using a Bloom filter — it can say "definitely not in the set" or "probably yes" but never misses a real match. Think of k rubber stamps on an m-bit grid: if all stamped positions are filled, the item is probably present. Space-efficient probabilistic set with O(k) insert/check, false positives possible but never false negatives.',
    complexityIntuition:
      'Insert and check are both O(k) where k is the number of hash functions (typically 3-7). The magic: this is independent of how many items are stored. A million items or a billion — same speed.',
    difficulty: 'intermediate',
    realWorld: ['Chrome Safe Browsing', 'Cassandra SSTable lookup', 'Medium dedup'],
    keyTakeaways: [
      '"Definitely NOT in set" is always right. "Probably in set" might be wrong.',
      'More hash functions (k) = fewer false positives but more bits set per insert',
      'You can add elements but NEVER remove them (bits cannot be unset)',
    ],
    whenToUse: { use: 'Fast membership pre-check, avoiding expensive lookups', dontUse: 'Need exact answers or element deletion' },
    commonMistakes: [
      "'Bloom filter says yes means definitely yes' — No! It can give false positives",
      "'You can remove elements' — Standard bloom filter bits can't be unset",
      "'More hash functions is always better' — Too many fills the bit array faster, increasing false positives",
    ],
    interviewTips: [
      'System design gold: use Bloom filters as a pre-check layer before expensive DB lookups.',
      'Know the formula: FP rate = (1 - e^(-kn/m))^k. Interviewers love when you can reason about tuning k and m.',
      "If asked 'how to support deletion', mention Counting Bloom Filters (replace bits with counters).",
    ],
    edgeCasePresets: [
      { name: 'Near Capacity', data: 'a,b,c,d,e,f,g,h,i,j,k,l', description: '12 items in 32-bit filter — watch FP rate climb' },
    ],
  },
  {
    id: 'skip-list',
    name: 'Skip List',
    category: 'probabilistic',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert (avg)': 'O(log n)',
      'Delete (avg)': 'O(log n)',
      'Search (avg)': 'O(log n)',
      'Space': 'O(n)',
    },
    description:
      'Redis uses skip lists for sorted sets — they achieve BST-like performance with linked-list simplicity. Imagine an express train system: local stops on level 0, express skips on higher levels, so you ride express then drop to local near your destination. O(log n) average search/insert/delete via randomized multi-level linked lists where coin flips determine each node\'s height.',
    complexityIntuition:
      'Express lanes let you skip over elements — on average, each level halves the search distance. With ~log n levels, you get O(log n) search just like a balanced BST, but with simpler implementation.',
    difficulty: 'intermediate',
    realWorld: ['Redis sorted sets (ZRANGEBYSCORE)', 'LevelDB MemTable', 'Apache HBase'],
    keyTakeaways: [
      'Multi-level linked list — express lanes skip ahead, local lane has all nodes',
      'O(log n) average via randomized promotion — coin flip determines height',
      'Simpler to implement than balanced BSTs with comparable performance',
    ],
    whenToUse: { use: 'Sorted set with range queries, simpler alternative to balanced BST', dontUse: 'Need O(1) lookup or worst-case guarantees' },
    edgeCasePresets: [
      { name: 'Sequential Insert', data: '1,2,3,4,5,6,7,8', description: 'Sorted input — skip list still maintains O(log n) via random level promotion' },
      { name: 'Reverse Sequential', data: '8,7,6,5,4,3,2,1', description: 'Reverse order — observe how express lanes form differently than sorted input' },
      { name: 'Duplicates', data: '5,5,5,5,5', description: 'All identical values — tests how skip list handles duplicate keys' },
    ],
  },
  {
    id: 'heap',
    name: 'Heap',
    category: 'heap',
    operations: ['insert', 'delete', 'search', 'build'],
    complexity: {
      'Insert': 'O(log n)',
      'Extract Min/Max': 'O(log n)',
      'Peek': 'O(1)',
      'Build': 'O(n)',
    },
    description:
      'A hospital ER where the most critical patient is always treated first, regardless of arrival order — that\'s a heap in action. Picture a tournament bracket where the winner (min or max) always floats to the top. Complete binary tree satisfying the heap property, with O(log n) insert/extract via bubble-up and bubble-down, O(1) peek at the root, and O(n) build.',
    complexityIntuition:
      'The minimum (or maximum) is always at the root — O(1) peek. Insert and extract fix the heap in O(log n) by bubbling up/down. Building a heap from scratch is O(n), not O(n log n) — a subtle but important optimization.',
    difficulty: 'intermediate',
    realWorld: ['OS process scheduler', "Dijkstra's algorithm", 'MedianFinder (LeetCode)'],
    keyTakeaways: [
      'Parent is always smaller (min-heap) or larger (max-heap) than children',
      'O(log n) insert/extract via bubble-up and bubble-down; O(1) peek at root',
      'Build from array in O(n) via bottom-up heapify — faster than n inserts',
    ],
    whenToUse: { use: 'Priority-based scheduling, top-K elements, median tracking', dontUse: 'Need sorted iteration or O(1) arbitrary search' },
    commonMistakes: [
      "'Heap sort is the fastest sort' — Quick sort is faster in practice due to cache locality",
      "'Building a heap is O(n log n)' — Bottom-up heapify is O(n)",
      "'A heap is a sorted array' — Only the root is guaranteed to be min/max; siblings have no ordering",
    ],
    interviewTips: [
      "'Find kth largest' = min-heap of size k. This pattern appears in 10+ LeetCode problems.",
      'Know the difference between priority queue (interface) and heap (implementation).',
      'Median of a stream: max-heap for lower half + min-heap for upper half. Classic interview pattern.',
    ],
    edgeCasePresets: [
      { name: 'Already a Heap', data: '1,2,3,4,5,6,7', description: 'Already satisfies min-heap property — build is trivial' },
      { name: 'Reverse (Worst Build)', data: '7,6,5,4,3,2,1', description: 'Maximum swaps needed during heapify' },
    ],
  },
  {
    id: 'trie',
    name: 'Trie',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(m)',
      'Search': 'O(m)',
      'Prefix': 'O(m)',
      'Delete': 'O(m)',
    },
    description:
      'Phone keyboard autocomplete, DNS resolution, IP routing — tries make prefix search instant. Imagine a dictionary where words sharing the same beginning share the same path: "car", "card", and "care" all share the c-a-r branch. Prefix tree with O(m) insert, search, and delete where m is word length; shared prefixes share nodes, making it both fast and space-efficient for string sets.',
    complexityIntuition:
      'Every operation takes O(m) where m is the word length — independent of how many words are stored. This is why tries beat hash tables for prefix search: checking "do any words start with \'pre\'" is just 3 steps.',
    difficulty: 'intermediate',
    realWorld: ['Phone autocomplete', 'DNS lookup', 'IP routing tables'],
    keyTakeaways: [
      'O(m) search where m is key length — independent of how many keys exist',
      'Shared prefixes share nodes — massive space savings for common prefixes',
      'Perfect for autocomplete, spell-check, and prefix-based filtering',
    ],
    whenToUse: { use: 'Autocomplete, prefix search, spell-check, IP routing', dontUse: 'Numeric keys or non-string data (use hash table)' },
    commonMistakes: [
      "'Tries use less memory than hash tables' — Each node can have up to 26 children pointers (alphabet), which is often more memory than a hash table for small datasets",
      "'Trie search is O(n)' — It is O(m) where m is the KEY length, independent of how many keys exist",
      "'Tries only work for lowercase English' — They work for any alphabet; just adjust the branching factor",
    ],
    interviewTips: [
      "Autocomplete and word search (LC #212) are the classic trie problems — know both.",
      "If asked to implement, start with insert + search + startsWith. That covers 90% of questions.",
      "Trie + DFS = powerful combo for word break, boggle, and phone number letter combos.",
    ],
    edgeCasePresets: [
      { name: 'Shared Prefix Heavy', data: 'car,card,care,cart,carry', description: 'All words share "car" prefix — observe node reuse along shared path' },
      { name: 'No Shared Prefixes', data: 'apple,banana,cherry', description: 'Completely disjoint paths — maximum node count, no sharing' },
      { name: 'Single-Char Words', data: 'a,b,c,d,e', description: 'All words are single characters — trie is just one level deep' },
    ],
  },
  {
    id: 'union-find',
    name: 'Union-Find',
    category: 'tree',
    operations: ['insert', 'search'],
    complexity: {
      'Union': 'O(a(n))',
      'Find': 'O(a(n))',
      'MakeSet': 'O(1)',
      'Space': 'O(n)',
    },
    description:
      'Social networks use Union-Find to answer "are Alice and Bob connected?" in nearly O(1). Imagine towns merging into counties: each town points to a mayor, and when two counties merge, one mayor defers to the other. Disjoint set forest with union by rank and path compression, achieving amortized O(a(n)) per operation — effectively constant time via the inverse Ackermann function.',
    complexityIntuition:
      'With path compression and union by rank, O(\u03B1(n)) is effectively O(1) — the inverse Ackermann function grows so slowly that for any practical input size (even 10^80), \u03B1(n) \u2264 4.',
    difficulty: 'intermediate',
    realWorld: ['Kruskal\'s MST algorithm', 'Network connectivity', 'Image segmentation'],
    keyTakeaways: [
      'Union by rank + path compression = nearly O(1) amortized per operation',
      'Answers "are X and Y connected?" without traversing the entire graph',
      'Essential for Kruskal\'s MST, connected components, and cycle detection',
    ],
    whenToUse: { use: 'Connected components, cycle detection, Kruskal\'s MST', dontUse: 'Need to enumerate group members or disconnect nodes' },
    commonMistakes: [
      "'Union-Find is just a tree' — Without path compression and union by rank, it degrades to O(n) per operation",
      "'You need path compression AND union by rank' — Either one alone gives O(log n); both together give near-O(1)",
      "'Union-Find can split sets apart' — Standard Union-Find only merges; splitting requires a different data structure",
    ],
    interviewTips: [
      "Number of islands, accounts merge, redundant connection — all Union-Find patterns. Know the template.",
      "Always implement with both path compression AND union by rank. Interviewers expect optimal.",
      "If asked about cycle detection in undirected graphs, Union-Find is simpler than DFS.",
    ],
  },
  {
    id: 'lsm-tree',
    name: 'LSM Tree',
    category: 'system',
    operations: ['insert', 'search', 'flush', 'compact'],
    complexity: {
      'Write': 'O(1) amortized',
      'Read': 'O(N * log(n))',
      'Space Amp': 'O(T * N)',
      'Compaction': 'O(N)',
    },
    description:
      'Every write to RocksDB, LevelDB, or Cassandra flows through an LSM Tree — optimized for write-heavy workloads. Think of a notebook (memtable) where you jot notes fast, then periodically file them into sorted folders (SSTables) on disk. Writes land in memory at O(1) amortized, then flush to sorted runs; reads check memtable first, then each level. Compaction merges SSTables to reduce read amplification.',
    complexityIntuition:
      'Writes are blazing fast (O(1) amortized) because they just append to an in-memory buffer. Reads pay the price — checking multiple sorted levels. Compaction is the background tax that keeps reads from getting too slow.',
    difficulty: 'advanced',
    realWorld: ['RocksDB', 'LevelDB', 'Cassandra', 'CockroachDB'],
    keyTakeaways: [
      'Writes go to memory first (memtable) then flush to disk — O(1) amortized writes',
      'Reads check memtable, then each SSTable level — read amplification is the tradeoff',
      'Compaction merges SSTables to reduce read cost at the expense of write amplification',
    ],
    whenToUse: { use: 'Write-heavy workloads, append-only storage engines', dontUse: 'Read-heavy workloads with low latency requirements' },
    commonMistakes: [
      "'LSM trees are always faster than B-trees' — Only for writes; B-trees are faster for reads due to single-location lookups",
      "'Compaction is free' — Compaction consumes significant I/O and CPU; write amplification is a real cost",
      "'Reads are O(log n)' — Reads may check multiple levels (read amplification), making worst case O(N * log n) across levels",
    ],
    interviewTips: [
      "System design essential: know when to pick LSM (write-heavy like logs, metrics) vs B-tree (read-heavy like OLTP).",
      "Mention write amplification, read amplification, and space amplification — these three tradeoffs define LSM tuning.",
      "Name-drop real systems: RocksDB, LevelDB, Cassandra all use LSM trees. Shows practical knowledge.",
    ],
  },
  {
    id: 'consistent-hash',
    name: 'Consistent Hash Ring',
    category: 'system',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Lookup': 'O(log n)',
      'Add Node': 'O(K/n)',
      'Remove Node': 'O(K/n)',
      'Space': 'O(n)',
    },
    description:
      'When DynamoDB adds a server, only 1/N of keys need to move — consistent hashing minimizes disruption. Imagine servers placed on a clock face: each key hashes to a position and walks clockwise to find its server. O(log n) lookup via binary search on the ring; adding or removing a node only redistributes K/n keys, making it the backbone of distributed caches and databases.',
    complexityIntuition:
      'Adding a server to a 10-node ring only moves ~10% of keys (K/n), not all of them. Lookup is O(log n) via binary search on the ring — with 1000 nodes, that is ~10 steps.',
    difficulty: 'intermediate',
    realWorld: ['Amazon DynamoDB', 'Apache Cassandra', 'CDN load balancing'],
    keyTakeaways: [
      'Adding/removing a node only moves K/n keys — minimal disruption vs rehashing all',
      'Virtual nodes improve balance — each physical server owns multiple ring positions',
      'O(log n) lookup via binary search on sorted ring positions',
    ],
    whenToUse: { use: 'Distributed caching, database sharding, load balancing', dontUse: 'Single-server setups or when all data fits in memory' },
    commonMistakes: [
      "'Consistent hashing distributes keys perfectly evenly' — Without virtual nodes, distribution can be very uneven",
      "'Adding a node only affects the next node on the ring' — It affects the range of keys that previously mapped to the successor",
      "'You only need one hash function' — Virtual nodes require multiple positions per physical node for good balance",
    ],
    interviewTips: [
      "Top-3 system design concept. Know: ring structure, virtual nodes, and why only K/n keys move on rebalance.",
      "When designing any distributed cache or DB, mention consistent hashing for sharding — instant credibility.",
      "Be ready to compare with rendezvous hashing (highest random weight) as an alternative approach.",
    ],
  },
  {
    id: 'merkle-tree',
    name: 'Merkle Tree',
    category: 'system',
    operations: ['insert', 'search'],
    complexity: {
      'Build': 'O(n)',
      'Proof': 'O(log n)',
      'Verify': 'O(log n)',
      'Space': 'O(n)',
    },
    description:
      'Git uses Merkle trees to detect file changes — one hash at the root verifies an entire repository. Think of a family tree where each person\'s ID is a fingerprint combining their children\'s fingerprints: change one leaf and every ancestor hash changes. Binary hash tree with O(n) build time and O(log n) proof/verify — enabling tamper-evident data integrity checks.',
    complexityIntuition:
      'To prove a single leaf belongs to a tree of 1 million items, you only need ~20 hashes (log\u2082(1M)). One changed byte anywhere flips the root hash — that is how Git and blockchains detect tampering instantly.',
    difficulty: 'intermediate',
    realWorld: ['Git version control', 'Bitcoin blockchain', 'IPFS'],
    keyTakeaways: [
      'One root hash verifies the entire dataset — tamper-evident by design',
      'O(log n) inclusion proof — only need sibling hashes along the path',
      'Change one leaf and every ancestor hash changes — tampering is immediately visible',
    ],
    whenToUse: { use: 'Data integrity verification, tamper detection, sync protocols', dontUse: 'Mutable data that changes frequently (rebuild cost)' },
  },
  {
    id: 'count-min-sketch',
    name: 'Count-Min Sketch',
    category: 'probabilistic',
    operations: ['insert', 'search'],
    complexity: {
      'Insert': 'O(d)',
      'Query': 'O(d)',
      'Space': 'O(d * w)',
      'Error': 'e/w * n',
    },
    description:
      'Track word frequency in a 10TB log using just 100MB of memory — Count-Min Sketch trades exactness for extreme space efficiency. Imagine d bouncers each keeping their own tally at different doors: to check a count, ask all d and take the lowest. Probabilistic frequency estimator using a d-by-w matrix with O(d) insert/query; may overestimate but never underestimates.',
    complexityIntuition:
      'With d=5 hash functions, every insert and query does exactly 5 operations — constant time regardless of data volume. The trade-off: wider tables (larger w) reduce error but use more memory.',
    difficulty: 'advanced',
    realWorld: ['Network traffic monitoring', 'Apache Spark', 'Stream processing'],
    keyTakeaways: [
      'May overestimate frequency but NEVER underestimates — conservative counts',
      'Uses d independent hash functions into a d-by-w matrix; take the minimum',
      'Sub-linear space — track billions of events in fixed memory',
    ],
    whenToUse: { use: 'Stream frequency estimation, heavy hitter detection', dontUse: 'Need exact counts or low-volume data (just use a hash map)' },
  },
  {
    id: 'hyperloglog',
    name: 'HyperLogLog',
    category: 'probabilistic',
    operations: ['insert', 'search'],
    complexity: {
      'Add': 'O(1)',
      'Count': 'O(m)',
      'Space': 'O(m)',
      'Std Error': '1.04/sqrt(m)',
    },
    description:
      'Redis counts unique visitors across billions of events using just 12KB per counter. Imagine flipping coins and tracking your longest streak of heads — a longer streak suggests more flips. HyperLogLog hashes elements, counts leading zeros in each register bucket, and estimates cardinality with ~1.04/sqrt(m) standard error — O(1) add, O(m) count.',
    complexityIntuition:
      'Adding an element is O(1) — just one hash and one register update. Counting scans all m registers (typically 16,384) to compute the harmonic mean. 12KB of memory estimates billions of unique items within ~2% error.',
    difficulty: 'advanced',
    realWorld: ['Redis PFCOUNT', 'Google BigQuery', 'Presto'],
    keyTakeaways: [
      'Estimates cardinality (count distinct) using only ~12KB for billions of elements',
      'O(1) add — just hash and update one register; O(m) count via harmonic mean',
      '~2% standard error is acceptable when exact count is not needed',
    ],
    whenToUse: { use: 'Approximate distinct counts over huge datasets (unique visitors, IPs)', dontUse: 'Need exact counts or small datasets' },
  },
  {
    id: 'deque',
    name: 'Deque',
    category: 'linear',
    operations: ['pushFront', 'pushBack', 'popFront', 'popBack'],
    complexity: {
      'pushFront': 'O(n)*',
      'pushBack': 'O(1)',
      'popFront': 'O(n)*',
      'popBack': 'O(1)',
    },
    description:
      'A deck of cards you can draw from either end — Java\'s ArrayDeque powers most queue/stack needs in production. Think of a double door: items can enter or exit from the front or back. Double-ended queue with O(1) amortized push/pop at both ends (DLL-backed), or O(n) front ops in array-backed implementations due to shifting.',
    complexityIntuition:
      'Back operations are O(1) since no shifting is needed. Front operations in array-backed deques cost O(n) because every element must shift. A DLL-backed or circular-buffer deque makes all four operations O(1).',
    difficulty: 'intermediate',
    realWorld: ['Java ArrayDeque', 'Python collections.deque', 'Sliding window algorithms'],
    whenToUse: { use: 'Sliding window, work-stealing schedulers, double-ended access', dontUse: 'Only need one-end access (use stack or queue)' },
    keyTakeaways: [
      'Push/pop from both ends — can serve as both stack and queue',
      'DLL-backed = O(1) both ends; array-backed = O(n) front operations',
      'Perfect for sliding window problems and work-stealing schedulers',
    ],
  },
  {
    id: 'circular-buffer',
    name: 'Circular Buffer',
    category: 'linear',
    operations: ['enqueue', 'dequeue', 'peek'],
    complexity: {
      'Enqueue': 'O(1)',
      'Dequeue': 'O(1)',
      'Peek': 'O(1)',
      'Space': 'O(n)',
    },
    description:
      'Streaming audio, keyboard input, producer-consumer pipelines — all use a ring buffer that wraps around. Imagine a circular conveyor belt with fixed slots: the producer places items, the consumer picks them up, and when it wraps around, old items get overwritten. Fixed-size buffer with O(1) enqueue/dequeue using read/write pointers that wrap via modular arithmetic.',
    complexityIntuition:
      'Every operation is O(1) because read/write pointers just increment and wrap via modulo — no shifting, no allocation. The fixed size means you never resize, but old data gets overwritten when full.',
    difficulty: 'intermediate',
    realWorld: ['Audio streaming buffers', 'Linux kernel kfifo', 'Network packet buffers'],
    keyTakeaways: [
      'Fixed-size buffer that wraps around — old data is overwritten automatically',
      'O(1) enqueue/dequeue via modular arithmetic on read/write pointers',
      'Zero allocation after init — ideal for real-time and embedded systems',
    ],
    whenToUse: { use: 'Fixed-size streaming buffers, producer-consumer with bounded memory', dontUse: 'Need to grow dynamically or keep all history' },
  },
  {
    id: 'wal',
    name: 'Write-Ahead Log',
    category: 'system',
    operations: [{ id: 'insert', label: 'Append' }, { id: 'search', label: 'Read' }, 'checkpoint', 'crash', 'recover', 'truncate'],
    complexity: {
      'Append': 'O(1)',
      'Read': 'O(n)',
      'Truncate': 'O(n)',
      'Recovery': 'O(k)',
    },
    description:
      'PostgreSQL, MySQL, and every serious database writes changes to a log BEFORE applying them — guaranteeing crash recovery. Think of a black box flight recorder: no matter what happens, the log survives. Sequential append-only log with O(1) append using LSN ordering; supports checkpointing, crash simulation, and replay-based recovery.',
    complexityIntuition:
      'Appending is O(1) — just write to the end of the log sequentially. Recovery replays only the entries since the last checkpoint (O(k)), not the entire log. This is why databases can recover from crashes in seconds.',
    difficulty: 'intermediate',
    realWorld: ['PostgreSQL', 'MySQL InnoDB', 'SQLite'],
    keyTakeaways: [
      'Write to log BEFORE applying changes — guarantees durability on crash',
      'O(1) sequential append — disk-friendly, no random I/O needed',
      'Recovery replays log from last checkpoint — no data loss if log is intact',
    ],
    whenToUse: { use: 'Crash recovery, database durability, transaction logging', dontUse: 'In-memory-only systems where durability is not needed' },
  },
  {
    id: 'rope',
    name: 'Rope',
    category: 'tree',
    operations: [{ id: 'insert', label: 'Concat' }, { id: 'search', label: 'charAt' }],
    complexity: {
      'charAt': 'O(log n)',
      'Concat': 'O(log n)',
      'Split': 'O(log n)',
      'Insert': 'O(log n)',
    },
    description:
      'VS Code and every modern text editor uses a rope to handle million-line files with O(log n) edits. Instead of one giant string, imagine a clothesline of short string fragments hanging from a balanced tree. Internal nodes store subtree weights for O(log n) charAt, concat, split, and insert — avoiding the O(n) cost of shifting characters in a flat string.',
    complexityIntuition:
      'In a flat string, inserting text at position 1000 shifts everything after it (O(n)). A rope splits the tree at position 1000 in O(log n) and reattaches — edits in a 10-million-character file take ~23 steps.',
    difficulty: 'expert',
    realWorld: ['VS Code text buffer', 'Xi editor', 'Collaborative text editors'],
    keyTakeaways: [
      'O(log n) concat, split, and insert — avoids O(n) shifting of flat strings',
      'Tree of short string fragments — internal nodes track subtree weights',
      'Essential for large document editing where string mutation is frequent',
    ],
    whenToUse: { use: 'Large text editing, collaborative editors, frequent string mutations', dontUse: 'Short strings or read-only text (overhead not worth it)' },
  },
  {
    id: 'r-tree',
    name: 'R-Tree',
    category: 'tree',
    operations: ['insert', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n + k)',
      'Delete': 'O(log n)',
      'Space': 'O(n)',
    },
    description:
      'Google Maps finds restaurants near you by searching a spatial index — an R-Tree groups nearby objects with bounding rectangles. Imagine nesting boxes: a city box contains neighborhood boxes, which contain block boxes, each holding a few points. O(log n) insert and search by choosing the leaf needing least enlargement; range queries prune branches whose bounding boxes don\'t overlap the search region.',
    complexityIntuition:
      'Finding all restaurants within 1 mile takes O(log n + k) — log n to navigate the tree, plus k to collect the results. Entire continents of data are pruned in a single bounding-box check.',
    difficulty: 'expert',
    realWorld: ['PostGIS spatial queries', 'Google Maps', 'SQLite R*Tree module'],
    keyTakeaways: [
      'Groups spatial objects with minimum bounding rectangles (MBRs)',
      'O(log n + k) range search — prune branches whose MBRs do not overlap query',
      'Insert chooses the leaf requiring least MBR enlargement to minimize overlap',
    ],
    whenToUse: { use: 'Spatial range queries, nearest-neighbor search, GIS indexing', dontUse: 'Non-spatial data or 1D range queries (use B+ tree)' },
  },
  {
    id: 'quadtree',
    name: 'Quadtree',
    category: 'tree',
    operations: ['insert', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n + k)',
      'Delete': 'O(log n)',
      'Space': 'O(n)',
    },
    description:
      'Video games use quadtrees for collision detection — recursively splitting 2D space to find nearby objects fast. Imagine folding a map in half twice: each fold creates four quadrants, and you only unfold the sections near your target. Recursive 2D partitioning with O(log n) insert/search; range queries skip quadrants that don\'t intersect the search window.',
    complexityIntuition:
      'Each level divides space into 4 quadrants — irrelevant quadrants are skipped entirely. For collision detection among 10,000 sprites, you check ~13 levels instead of 10,000 pairs.',
    difficulty: 'expert',
    realWorld: ['Game engines (collision detection)', 'Image compression', 'Geographic information systems'],
    keyTakeaways: [
      'Recursively splits 2D space into four quadrants — spatial divide and conquer',
      'O(log n) insert/search by narrowing to the relevant quadrant',
      'Range queries skip entire quadrants that do not intersect the search window',
    ],
    whenToUse: { use: '2D collision detection, image compression, point-in-region queries', dontUse: 'High-dimensional data (use k-d tree) or non-spatial data' },
  },
  {
    id: 'fibonacci-heap',
    name: 'Fibonacci Heap',
    category: 'heap',
    operations: ['insert', 'delete', 'search', 'decrease-key'],
    complexity: {
      'Insert': 'O(1)',
      'Find Min': 'O(1)',
      'Extract Min': 'O(log n)*',
      'Decrease Key': 'O(1)*',
    },
    description:
      'Dijkstra\'s algorithm runs fastest with a Fibonacci heap — O(1) decrease-key makes it theoretically optimal for shortest paths. Think of a lazy pile of papers: you toss new ones on top (O(1) insert), and only sort when forced to find the smallest. A collection of heap-ordered trees with O(1) amortized insert/decrease-key and O(log n) amortized extract-min via consolidation. (* = amortized)',
    complexityIntuition:
      'Insert and decrease-key are O(1) amortized because work is deferred lazily. The cost hits at extract-min (O(log n)) when consolidation cleans up the structure. This lazy approach makes Dijkstra\'s run in O(V log V + E) instead of O((V+E) log V).',
    difficulty: 'expert',
    realWorld: ['Dijkstra\'s algorithm (theory)', 'Prim\'s MST (theory)', 'Network optimization'],
    keyTakeaways: [
      'O(1) amortized insert and decrease-key — theoretically optimal for graph algorithms',
      'Lazy structure — defers cleanup to extract-min via consolidation',
      'Rarely used in practice due to high constant factors and cache unfriendliness',
    ],
    whenToUse: { use: 'Dijkstra/Prim where decrease-key dominates, theoretical optimality', dontUse: 'Practice (high constants); use binary heap instead' },
  },
  {
    id: 'avl-tree',
    name: 'AVL Tree',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n)',
      'Delete': 'O(log n)',
      'Rotations': 'O(1)',
    },
    description:
      'Guaranteed O(log n) worst-case by keeping both subtrees within 1 level of each other via rotations. Imagine a seesaw that automatically rebalances itself whenever one side gets too heavy. Self-balancing BST using LL, RR, LR, and RL rotations after every insert/delete to maintain a strict balance factor of -1, 0, or +1 at every node.',
    complexityIntuition:
      'Unlike a plain BST, an AVL tree guarantees O(log n) even for sorted input. The strict balancing means searches are slightly faster than red-black trees, but insertions/deletions require more rotations to maintain balance.',
    difficulty: 'advanced',
    realWorld: ['Database indexes', 'Memory allocators', 'In-memory dictionaries'],
    keyTakeaways: [
      'Strict balance factor of -1, 0, or +1 at every node — guaranteed O(log n)',
      'Four rotation types (LL, RR, LR, RL) restore balance after every mutation',
      'Faster lookups than Red-Black trees but more rotations on insert/delete',
    ],
    whenToUse: { use: 'Read-heavy sorted data needing guaranteed O(log n) lookups', dontUse: 'Write-heavy workloads (RB tree has fewer rotations)' },
    commonMistakes: [
      "'AVL and Red-Black trees are interchangeable' — AVL is stricter (height diff <= 1), giving faster reads but more rotations on writes",
      "'AVL trees always need two rotations' — Single rotations (LL, RR) need only one; double rotations (LR, RL) need two",
      "'Balance factor can be anything' — AVL strictly requires balance factor in {-1, 0, +1} at EVERY node",
    ],
    interviewTips: [
      "Know all four rotation cases: LL (right rotate), RR (left rotate), LR (left-right), RL (right-left).",
      "If asked 'AVL vs Red-Black', answer: AVL = faster reads (stricter balance), RB = faster writes (fewer rotations).",
      "Draw the rotations. Interviewers want to see you can trace through a rotation step by step.",
    ],
    edgeCasePresets: [
      { name: 'Trigger All Rotations', data: '10,20,30,25,5,15,3', description: 'This sequence triggers LL, RR, LR, and RL rotations' },
      { name: 'Sequential (Auto-Balance)', data: '1,2,3,4,5,6,7', description: 'Unlike BST, AVL stays balanced even with sorted input' },
    ],
  },
  {
    id: 'red-black-tree',
    name: 'Red-Black Tree',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n)',
      'Delete': 'O(log n)',
      'Recolor': 'O(1)',
    },
    description:
      'Java\'s TreeMap, C++ std::map, Linux\'s CFS scheduler — the most widely deployed balanced BST in production. Think of a two-color dress code that guarantees no path from root to leaf is more than twice as long as any other. Self-balancing BST using red/black node coloring with O(log n) insert/search/delete maintained through color flips and at most 2-3 rotations.',
    complexityIntuition:
      'The coloring rules ensure the longest path is at most 2x the shortest, giving O(log n) worst case. Fewer rotations than AVL (at most 2-3 per operation) makes it faster for insert-heavy workloads — why it dominates in standard libraries.',
    difficulty: 'advanced',
    realWorld: ['Java TreeMap', 'C++ std::map', 'Linux CFS scheduler'],
    keyTakeaways: [
      'Five invariants (root black, leaves black, red nodes have black children, etc.) guarantee balance',
      'At most 2-3 rotations per insert/delete — fewer than AVL, better for write-heavy use',
      'Most widely deployed balanced BST — Java, C++, Linux kernel all use it',
    ],
    whenToUse: { use: 'Write-heavy sorted collections, standard library maps/sets', dontUse: 'Read-dominated workloads (AVL has tighter balance)' },
    commonMistakes: [
      "'Red-Black trees are always better than AVL' — They have looser balance (2x height ratio), so reads can be slightly slower",
      "'The color rules are arbitrary' — Each rule prevents a specific degenerate case; together they guarantee max height of 2*log(n+1)",
      "'Insertion always requires rotations' — Many insertions only need recoloring, not rotations",
    ],
    interviewTips: [
      "Know the 5 properties by heart. Interviewers rarely ask you to implement RB, but they ask you to explain the invariants.",
      "The key insight: longest path is at most 2x shortest path. This is weaker than AVL but still O(log n).",
      "If asked why Java/C++ stdlib uses RB over AVL: fewer rotations per insert/delete = better for mixed read-write workloads.",
    ],
  },
  {
    id: 'segment-tree',
    name: 'Segment Tree',
    category: 'tree',
    operations: [{ id: 'insert', label: 'Update' }, { id: 'search', label: 'Query' }],
    complexity: {
      'Build': 'O(n)',
      'Query': 'O(log n)',
      'Point Update': 'O(log n)',
      'Range Update': 'O(log n)',
    },
    description:
      'Competitive programmers use segment trees to answer range sum/min/max queries in O(log n) with lazy propagation. Imagine a company org chart where each manager pre-computes a summary of their entire team — asking "total sales for departments 3-7?" just combines a few manager summaries. Binary tree built over an array with O(n) build, O(log n) point/range updates, and O(log n) arbitrary range queries.',
    complexityIntuition:
      '"Sum of elements 3 through 700,000" in a million-element array takes ~20 node visits (O(log n)), not 700,000 additions. Each node pre-stores its range aggregate, so queries combine at most 2*log(n) nodes.',
    difficulty: 'advanced',
    realWorld: ['Competitive programming', 'Database range aggregates', 'Interval scheduling'],
    keyTakeaways: [
      'O(log n) arbitrary range queries — sum, min, max, GCD, any associative operation',
      'Lazy propagation defers range updates — O(log n) instead of O(n) per update',
      'O(n) build from array; 4n space for the internal tree representation',
    ],
    whenToUse: { use: 'Range aggregate queries (sum/min/max), range updates with lazy propagation', dontUse: 'Simple prefix sums only (Fenwick tree is simpler)' },
  },
  {
    id: 'bplus-tree',
    name: 'B+ Tree',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n)',
      'Delete': 'O(log n)',
      'Range Query': 'O(log n + k)',
    },
    description:
      'Every MySQL index, every filesystem directory — B+ trees keep all data in leaves connected by a linked list for efficient range scans. Imagine a library card catalog: the index cards (internal nodes) only tell you which aisle to walk to, while the actual books (data) live on the shelves (leaves) in a connected row. O(log n) insert/search/delete with all values in leaf nodes and O(log n + k) range queries via the leaf linked list.',
    complexityIntuition:
      'With a branching factor of 100, a B+ tree of 100 million records is only 4 levels deep. Finding a record = 4 disk reads. Range scans then walk the leaf linked list sequentially — perfect for "SELECT * WHERE price BETWEEN 10 AND 50".',
    difficulty: 'advanced',
    realWorld: ['MySQL InnoDB indexes', 'PostgreSQL indexes', 'ext4 filesystem'],
    keyTakeaways: [
      'All data lives in leaves linked together — O(log n + k) range scans',
      'Internal nodes store only keys (separators) — maximizing fan-out per disk page',
      'The default index structure for virtually all relational databases',
    ],
    whenToUse: { use: 'Database indexes, filesystem directories, range scans on disk', dontUse: 'In-memory-only data (AVL/RB tree is simpler)' },
    commonMistakes: [
      "'B+ tree and B-tree are the same' — B+ stores all data in leaves with a linked list; B-tree stores data in internal nodes too",
      "'Higher branching factor is always better' — It must match the disk page size; too large means wasted I/O per node read",
      "'B+ tree is only for databases' — Filesystems (ext4, NTFS) use B+ trees for directory indexing too",
    ],
    interviewTips: [
      "System design must-know: explain why MySQL uses B+ trees (leaf linked list enables range scans, high fan-out minimizes disk reads).",
      "Know the split/merge mechanics: node overflow splits into two, underflow merges or borrows from sibling.",
      "Compare with LSM tree: B+ is read-optimized (single seek), LSM is write-optimized (append-only). Critical for DB design questions.",
    ],
    edgeCasePresets: [
      { name: 'Sequential Keys', data: '1,2,3,4,5,6,7,8,9,10', description: 'Sequential inserts cause repeated right-most leaf splits — common in auto-increment PKs' },
      { name: 'Random Order', data: '7,3,9,1,5,8,2,10,4,6', description: 'Random order distributes splits across leaves — more balanced fill factor' },
    ],
  },
  {
    id: 'fenwick-tree',
    name: 'Fenwick Tree',
    category: 'tree',
    operations: [{ id: 'insert', label: 'Update' }, { id: 'search', label: 'Prefix Sum' }],
    complexity: {
      'Build': 'O(n)',
      'Point Update': 'O(log n)',
      'Prefix Sum': 'O(log n)',
      'Range Sum': 'O(log n)',
    },
    description:
      'A cleverly compressed prefix sum array — uses bit manipulation (i & -i) for O(log n) updates and queries. Imagine a ruler where certain marks summarize all the inches before them: reading a cumulative total just means adding a few marks together. Binary Indexed Tree stored as a flat array with O(n) build, O(log n) point update, and O(log n) prefix/range sum queries.',
    complexityIntuition:
      'The bit trick (i & -i) determines which elements each index is responsible for. A prefix sum query adds at most log(n) values — for n=1,000,000, that is 20 additions instead of a million.',
    difficulty: 'advanced',
    realWorld: ['Competitive programming', 'Inversion count algorithms', 'Cumulative frequency tables'],
    keyTakeaways: [
      'Uses bit trick (i & -i) to jump through the implicit tree — elegant and fast',
      'O(log n) point update and prefix sum — simpler than segment tree for this use case',
      'Half the memory of segment tree — stored as a flat array with n+1 elements',
    ],
    whenToUse: { use: 'Prefix sums with point updates, cumulative frequency tables', dontUse: 'Arbitrary range queries (use segment tree) or no updates needed' },
  },
  {
    id: 'splay-tree',
    name: 'Splay Tree',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)*',
      'Search': 'O(log n)*',
      'Delete': 'O(log n)*',
      'Splay': 'O(log n)*',
    },
    description:
      'A self-optimizing BST that moves accessed nodes to the root — frequently used data becomes fast to find automatically. Like a messy desk where the paper you just used ends up on top: recent lookups are always within reach. O(log n) amortized insert/search/delete via zig, zig-zig, and zig-zag splaying rotations. (* = amortized)',
    complexityIntuition:
      'Individual operations can be O(n) in the worst case, but the splaying guarantees O(log n) amortized over any sequence. Frequently accessed items stay near the root, giving temporal locality a massive speedup.',
    difficulty: 'advanced',
    realWorld: ['GCC implementation internals', 'Windows NT virtual memory', 'Cache implementations'],
    keyTakeaways: [
      'Recently accessed nodes move to root — self-optimizing for temporal locality',
      'O(log n) amortized via zig, zig-zig, and zig-zag rotations',
      'No balance metadata stored per node — simpler than AVL/RB but worst-case O(n) single op',
    ],
    whenToUse: { use: 'Access patterns with temporal locality, cache-like workloads', dontUse: 'Need worst-case O(log n) guarantees (use AVL/RB)' },
  },
  {
    id: 'crdt',
    name: 'CRDTs',
    category: 'system',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'G-Counter Merge': 'O(n)',
      'PN-Counter Merge': 'O(n)',
      'LWW Merge': 'O(1)',
      'OR-Set Merge': 'O(n+m)',
    },
    description:
      'Google Docs\' real-time collaboration, Figma\'s multiplayer design — CRDTs let distributed copies merge without conflicts. Imagine two people editing a shared shopping list offline: when they reconnect, the lists merge automatically with no contradictions. Includes G-Counter, PN-Counter, LWW-Register, and OR-Set — all supporting deterministic, coordination-free merge across replicas.',
    complexityIntuition:
      'Merge cost depends on the type: LWW-Register is O(1) (just compare timestamps), while G-Counter and PN-Counter are O(n) where n is the number of replicas. The key insight: merges are commutative and idempotent, so order does not matter.',
    difficulty: 'advanced',
    realWorld: ['Google Docs', 'Figma multiplayer', 'Riak database'],
    keyTakeaways: [
      'Merge is deterministic and commutative — order of sync does not matter',
      'No coordination needed — replicas converge automatically (strong eventual consistency)',
      'Multiple flavors: G-Counter (grow-only), PN-Counter, LWW-Register, OR-Set',
    ],
    whenToUse: { use: 'Offline-first apps, multi-leader replication, collaborative editing', dontUse: 'Strong consistency required or single-leader architecture' },
  },
  {
    id: 'vector-clock',
    name: 'Vector Clock',
    category: 'system',
    operations: ['insert', 'search'],
    complexity: {
      'Local Event': 'O(1)',
      'Send': 'O(n)',
      'Receive (merge)': 'O(n)',
      'Happens-before': 'O(n)',
    },
    description:
      'Distributed systems use vector clocks to detect "did Alice\'s edit happen before or after Bob\'s?" — solving causality in a world without shared time. Imagine each person carrying a notebook where they tally their own actions and copy the highest tallies from messages they receive. Each node maintains a vector of counters with O(1) local events, O(n) send/receive merge via element-wise max; concurrent events are detected when neither vector dominates.',
    complexityIntuition:
      'A local event just increments one counter (O(1)). Merging requires comparing all n entries in both vectors (O(n) where n = number of nodes). With 5 servers, every merge compares 5 integers — trivial. With 10,000, consider alternatives.',
    difficulty: 'advanced',
    realWorld: ['Amazon DynamoDB', 'Riak', 'Cassandra conflict resolution'],
    keyTakeaways: [
      'Tracks causality — determines if event A happened before, after, or concurrent with B',
      'Each node maintains a counter per node; merge takes element-wise max',
      'Concurrent events (neither vector dominates) signal potential conflicts',
    ],
    whenToUse: { use: 'Causality tracking in distributed systems, conflict detection', dontUse: 'Large clusters (vector size = O(n) per node); use hybrid logical clocks' },
  },
  {
    id: 'treap',
    name: 'Treap',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)*',
      'Search': 'O(log n)*',
      'Delete': 'O(log n)*',
      'Split/Merge': 'O(log n)*',
    },
    description:
      'Combines BST ordering with random heap priorities to achieve expected O(log n) without explicit rebalancing — elegant randomized balance. Imagine assigning each employee a random lottery number: they sit in alphabetical (BST) order, but the luckiest number rises to the top (heap). Each node holds (key, priority) with BST order on keys and heap order on random priorities; rotations restore the heap property after insert. (* = expected)',
    complexityIntuition:
      'Random priorities produce expected O(log n) depth — like a randomly built BST. No explicit rebalancing logic needed; the random priorities do the work. Expected height is ~3 * log\u2082(n) for n nodes.',
    difficulty: 'expert',
    realWorld: ['Randomized search trees', 'Memory allocators', 'Implicit treap for sequences'],
    keyTakeaways: [
      'BST order on keys + heap order on random priorities = expected O(log n) balance',
      'No explicit rebalancing metadata — randomness provides probabilistic balance',
      'Split and merge operations make it powerful for implicit key problems',
    ],
    whenToUse: { use: 'Implicit key sequences, split/merge-heavy workloads, randomized balance', dontUse: 'Need deterministic worst-case O(log n) (use AVL/RB)' },
  },
  {
    id: 'binomial-heap',
    name: 'Binomial Heap',
    category: 'heap',
    operations: ['insert', 'delete', 'search', 'decrease-key'],
    complexity: {
      'Insert': 'O(log n)',
      'Find Min': 'O(log n)',
      'Extract Min': 'O(log n)',
      'Merge': 'O(log n)',
    },
    description:
      'Merge two heaps in O(log n) — like adding binary numbers, linking same-order trees. Imagine stacking blocks of sizes 1, 2, 4, 8: merging two collections is like binary addition with carry. A forest of binomial trees (B0, B1, B2, ...) with min-heap ordering; O(log n) insert, find-min, extract-min, and merge by linking roots of equal degree.',
    complexityIntuition:
      'A heap of n elements has at most log(n) binomial trees (one per bit in n\'s binary representation). Merging two heaps combines their tree lists like binary addition — O(log n) link operations at most.',
    difficulty: 'expert',
    realWorld: ['Discrete event simulation', 'Network optimization', 'Priority queue implementations'],
    keyTakeaways: [
      'O(log n) merge — forest of binomial trees combined like binary addition',
      'Each binomial tree B_k has exactly 2^k nodes — structure mirrors binary representation',
      'Stepping stone to Fibonacci heap — simpler to understand, same merge complexity',
    ],
    whenToUse: { use: 'Frequent heap merges, mergeable priority queues', dontUse: 'Single heap only (binary heap is simpler and faster in practice)' },
  },
  {
    id: 'b-tree',
    name: 'B-Tree',
    category: 'tree',
    operations: ['insert', 'delete', 'search'],
    complexity: {
      'Insert': 'O(log n)',
      'Search': 'O(log n)',
      'Delete': 'O(log n)',
      'Space': 'O(n)',
    },
    description:
      'Every database index on disk, every filesystem — B-trees minimize disk reads by packing hundreds of keys per node. Think of a wide filing cabinet: each drawer (node) holds many sorted folders, so you only open a few drawers to find any file. Self-balancing tree with O(log n) insert/search/delete where each node holds multiple keys; splits on overflow and merges/redistributes on underflow, keeping all leaves at the same depth.',
    complexityIntuition:
      'With a branching factor of 1000, a B-tree of 1 billion records is only 3 levels deep. Each disk read loads one node with hundreds of keys — binary search within the node is done in memory. This is why B-trees dominate on-disk storage.',
    difficulty: 'advanced',
    realWorld: ['MongoDB indexes', 'NTFS filesystem', 'SQLite'],
    keyTakeaways: [
      'Wide nodes with many keys — minimizes disk reads by maximizing fan-out',
      'All leaves at the same depth — perfectly balanced by construction',
      'Split on overflow, merge/redistribute on underflow — self-balancing',
    ],
    whenToUse: { use: 'On-disk storage engines, database indexes, filesystems', dontUse: 'In-memory-only data (use AVL/RB tree for simplicity)' },
  },
  {
    id: 'doubly-linked-list',
    name: 'Doubly Linked List',
    category: 'linear',
    operations: ['insertHead', 'insertTail', 'delete', 'search', 'reverse'],
    complexity: {
      'Insert Head': 'O(1)',
      'Insert Tail': 'O(1)',
      'Delete': 'O(1)*',
      'Search': 'O(n)',
      'Reverse': 'O(n)',
    },
    description:
      'Browser history, undo/redo systems, LRU caches — DLL\'s bidirectional pointers enable O(1) insertion AND deletion at both ends. Like a conga line where each dancer holds the shoulders of both the person in front and behind: anyone can leave the line instantly without breaking it. Each node has next and prev pointers, enabling O(1) insert/delete at both ends and O(1) removal of any node given a reference.',
    complexityIntuition:
      'Given a reference to any node, deletion is O(1) — just rewire the prev and next pointers. This is why LRU caches pair a DLL with a hash map: the map finds the node in O(1), the DLL removes it in O(1).',
    difficulty: 'beginner',
    realWorld: ['LRU cache internals', 'Browser history navigation', 'Linux kernel list_head'],
    keyTakeaways: [
      'Bidirectional pointers — traverse forward AND backward, remove any node in O(1)',
      'O(1) insert/delete at both head and tail — no shifting, just pointer updates',
      'Foundation of LRU cache — hash map for O(1) lookup, DLL for O(1) eviction order',
    ],
    whenToUse: { use: 'LRU caches, browser history, bidirectional traversal with O(1) removal', dontUse: 'Need random access by index (use array)' },
  },
  {
    id: 'priority-queue',
    name: 'Priority Queue',
    category: 'heap',
    operations: ['enqueue', 'dequeue', 'peek', 'search'],
    complexity: {
      'Enqueue': 'O(log n)',
      'Dequeue': 'O(log n)',
      'Peek': 'O(1)',
      'Change Priority': 'O(log n)',
    },
    description:
      'Hospital ER triage, OS process scheduling, Dijkstra\'s algorithm — serve by importance, not arrival order. Imagine a bouncer at a club who always lets the VIP in next, no matter how long others have waited. Abstract priority-based interface backed by a binary heap with O(log n) enqueue/dequeue, O(1) peek, and O(log n) priority changes.',
    complexityIntuition:
      'Peeking at the highest-priority item is O(1) — it is always at the root. Enqueue and dequeue bubble through at most log(n) levels. For 1 million items, that is ~20 swaps to maintain ordering.',
    difficulty: 'intermediate',
    realWorld: ['Dijkstra\'s shortest path', 'Huffman encoding', 'Event-driven simulation'],
    keyTakeaways: [
      'Highest-priority element is always at the front — O(1) peek',
      'O(log n) enqueue/dequeue via underlying heap — not O(n) like sorted array',
      'Abstract interface — can be backed by binary heap, Fibonacci heap, or other structures',
    ],
    whenToUse: { use: 'Task scheduling, event simulation, Dijkstra/A* search', dontUse: 'Need FIFO ordering or sorted iteration of all elements' },
    commonMistakes: [
      "'Priority queue is a data structure' — It is an abstract interface; the underlying implementation is usually a heap",
      "'Dequeue gives you sorted order' — It gives you the NEXT highest-priority element, not a sorted sequence",
      "'Changing priority is O(1)' — Without an index map, finding the element to update is O(n); with one, decrease-key is O(log n)",
    ],
    interviewTips: [
      "Know the pattern: 'merge K sorted lists' = min-heap of K elements. O(N log K) total.",
      "Top-K frequent elements: heap of size K with frequency counting. Appears in many variations.",
      "For Dijkstra/A*, explain why PQ gives O((V+E) log V) — each edge relaxation does one heap operation.",
    ],
  },
  {
    id: 'lru-cache',
    name: 'LRU Cache',
    category: 'hash',
    operations: ['get', 'put', 'delete', 'peek'],
    complexity: {
      'Get': 'O(1)',
      'Put': 'O(1)',
      'Delete': 'O(1)',
      'Peek': 'O(1)',
    },
    description:
      'The #1 most asked interview question. Every cache from Redis to browser to CPU uses LRU eviction. Imagine a desk with limited space — when full, the paper you haven\'t touched longest gets filed away. Combines a hash map for O(1) lookup with a doubly linked list for O(1) eviction ordering.',
    complexityIntuition:
      'Every operation is O(1) thanks to the hash map + DLL combination. Get: hash map finds the node, DLL moves it to front. Put at capacity: DLL removes the tail (LRU item), hash map deletes the key. No operation ever scans the collection.',
    difficulty: 'advanced',
    realWorld: ['Redis', 'Memcached', 'Browser cache', 'CPU cache'],
    keyTakeaways: [
      'Hash map + doubly linked list = O(1) get, put, and eviction',
      'Least recently used item is always at the tail — evict in O(1)',
      'Every access moves the item to the head — most recent is always first',
    ],
    whenToUse: { use: 'Bounded caches with O(1) eviction, hot-data access patterns', dontUse: 'Unbounded storage or when eviction policy is not recency-based' },
    commonMistakes: [
      "'LRU cache is just a hash map' — It requires BOTH a hash map (O(1) lookup) AND a doubly linked list (O(1) eviction ordering)",
      "'Get operation is read-only' — Get must also move the accessed item to the front of the recency list",
      "'LRU is always the best eviction policy' — LFU is better for frequency-skewed workloads; ARC adapts between LRU and LFU",
    ],
    interviewTips: [
      "LeetCode #146. The #1 most-asked design question. Implement from scratch in under 20 minutes.",
      "Hash map points to DLL nodes. Get: move to front. Put at capacity: evict tail. Both O(1).",
      "Follow-up questions: thread safety (lock striping), distributed LRU (consistent hash + per-shard LRU), TTL support.",
    ],
    edgeCasePresets: [
      { name: 'Capacity Thrash', data: 'A,B,C,D,E,F', description: '6 puts into a capacity-4 cache — observe LRU eviction on every new insert after full' },
      { name: 'Access Pattern Matters', data: 'A,B,C,A,D,B,E', description: 'Gets interleaved with puts — recently accessed items survive eviction' },
    ],
  },
  {
    id: 'cuckoo-hash',
    name: 'Cuckoo Hashing',
    category: 'hash',
    operations: ['insert', 'search', 'delete'],
    complexity: {
      'Lookup': 'O(1) worst',
      'Insert': 'O(1) amortized',
      'Delete': 'O(1)',
      'Space': 'O(n)',
    },
    description:
      'Uses two hash tables with two hash functions. On collision, the existing element is displaced to the other table — like a cuckoo bird pushing eggs out of a nest. Guarantees O(1) worst-case lookup (check exactly 2 slots). Used in DPDK, MemC3, and network packet processing.',
    complexityIntuition:
      'Lookup checks exactly 2 slots — O(1) worst case, not amortized. Insert may trigger a chain of displacements but averages O(1). If a cycle is detected during displacement, the table rehashes — rare but O(n) when it happens.',
    difficulty: 'advanced',
    realWorld: ['DPDK packet processing', 'MemC3 (Memcached variant)', 'Network flow tables'],
    keyTakeaways: [
      'O(1) worst-case lookup — check exactly 2 slots, guaranteed',
      'On collision, displace existing element to alternate table — cuckoo eviction',
      'May trigger chain of displacements — resize if cycle detected',
    ],
    whenToUse: { use: 'O(1) worst-case lookup required, network packet processing', dontUse: 'Space-constrained (needs ~50% empty slots) or high load factors' },
  },
  {
    id: 'monotonic-stack',
    name: 'Monotonic Stack',
    category: 'linear',
    operations: ['push', 'pop', 'peek'],
    complexity: {
      'Push': 'O(1) amortized',
      'Pop': 'O(1)',
      'Peek': 'O(1)',
      'Space': 'O(n)',
    },
    description:
      'A stack that maintains elements in monotonically increasing or decreasing order. On push, elements violating the order are automatically popped — this cleanup is why monotonic stacks solve "next greater element" problems in O(n). Trending interview pattern in 2025-2026.',
    complexityIntuition:
      'Each element is pushed and popped at most once across the entire input — so the total work for n elements is O(n), making each push O(1) amortized. The key trick: the cleanup pops are not wasted work, they are the answer computation.',
    difficulty: 'intermediate',
    realWorld: ['Stock span problem', 'Histogram largest rectangle', 'Temperature tracking (LeetCode)'],
    keyTakeaways: [
      'Maintains monotonic order — elements violating the invariant are popped on push',
      'Solves "next greater/smaller element" in O(n) total — each element pushed and popped once',
      'Trending interview pattern — daily temperatures, trapping rain water, stock span',
    ],
    whenToUse: { use: 'Next greater/smaller element, stock span, histogram problems', dontUse: 'Need random access or non-monotonic ordering' },
  },
];

// ── Derived DS ID list & type (DST-182) ───────────────────────
// Single source of truth for all active data-structure IDs.
// ActiveDSId is a narrow union type derived from this const tuple.
// The runtime assertion below guarantees DS_ID_LIST stays in sync
// with DS_CATALOG — a mismatch will throw at import time.

export const DS_ID_LIST = [
  'array',
  'stack',
  'queue',
  'linked-list',
  'hash-table',
  'bst',
  'bloom-filter',
  'skip-list',
  'heap',
  'trie',
  'union-find',
  'lsm-tree',
  'consistent-hash',
  'merkle-tree',
  'count-min-sketch',
  'hyperloglog',
  'deque',
  'circular-buffer',
  'wal',
  'rope',
  'r-tree',
  'quadtree',
  'fibonacci-heap',
  'avl-tree',
  'red-black-tree',
  'segment-tree',
  'bplus-tree',
  'fenwick-tree',
  'splay-tree',
  'crdt',
  'vector-clock',
  'treap',
  'binomial-heap',
  'b-tree',
  'doubly-linked-list',
  'priority-queue',
  'lru-cache',
  'cuckoo-hash',
  'monotonic-stack',
] as const;

/** Narrow union of every data-structure ID in the catalog. */
export type ActiveDSId = (typeof DS_ID_LIST)[number];

// Runtime sync check — ensures DS_ID_LIST matches DS_CATALOG exactly.
if (process.env.NODE_ENV !== 'production') {
  const catalogIds = new Set(DS_CATALOG.map((d) => d.id));
  const listIds = new Set<string>(DS_ID_LIST);
  const missing = DS_CATALOG.filter((d) => !listIds.has(d.id)).map((d) => d.id);
  const extra = DS_ID_LIST.filter((id) => !catalogIds.has(id));
  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `DS_ID_LIST / DS_CATALOG mismatch — missing: [${missing}], extra: [${extra}]`,
    );
  }
}
