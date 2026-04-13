# World-Class Algorithm Content — Ready to Implement

> Every description, step template, complexity intuition, mistake, and summary
> below is FINAL COPY. A developer should be able to paste these into the
> AlgorithmConfig objects and engine files directly.

---

## 1. BUBBLE SORT

### Description (replaces current)
```
What if you could only compare two cards next to each other — how would
you sort a whole deck? That constraint is Bubble Sort.

Picture bubbles in a soda glass: the biggest bubble rises to the top
first. Each pass through the array pushes the next-largest value to
the end, like a bubble rising. After n passes, everything is in place.

Compares adjacent elements and swaps them if the left is larger.
Repeats until a full pass produces zero swaps (the array is sorted).

Use when teaching or on tiny, nearly-sorted data. Prefer Merge Sort
or Quick Sort for anything larger than ~50 elements.

Used in: CS education worldwide. Timsort (Python/Java) uses a similar
insertion-sort-on-small-runs idea. Real systems never use pure Bubble Sort.

Remember: "Biggest bubble rises first. Each pass = one more element in place."
```

### Step Description Templates
```
FIRST COMPARE:
  "Compare neighbors {a[j]} and {a[j+1]}. Bubble Sort always checks
   adjacent pairs — if the left value is larger, they're out of order."

SWAP:
  "Since {a[j]} > {a[j+1]}, swap them. The smaller value ({a[j+1]})
   moves left toward where it belongs."

NO SWAP:
  "{a[j]} ≤ {a[j+1]} — already in order. Move on."

PASS COMPLETE:
  "Pass {i+1} done! The largest unsorted value ({a[n-i-1]}) has
   'bubbled' to position {n-i-1}. It's locked in place forever."

EARLY EXIT:
  "Zero swaps this pass! Every adjacent pair is in order, so the
   whole array is sorted. This early-exit trick gives O(n) best case."

SUBSEQUENT COMPARES (shorter):
  "Compare {a[j]} and {a[j+1]} — {result}."
```

### Complexity Intuition
```
O(n²) means: each of n elements might need n comparisons. Double the
array size? Work quadruples.
• 10 elements → ~45 comparisons
• 100 elements → ~4,950 comparisons
• 1,000 elements → ~499,500 comparisons

But on nearly-sorted data with the early-exit optimization: O(n).
Try it — click "Nearly Sorted" and watch the comparison counter.
```

### Common Mistakes
```
1. "Bubble Sort is useless." — Not entirely. Its O(n) best case on
   nearly-sorted data makes it perfect for re-sorting after one insert.
   Also: it's the simplest sort to prove correct, making it a great
   teaching tool for understanding loop invariants.

2. "It's the same as Selection Sort." — No! Bubble Sort is STABLE
   (equal elements keep their relative order). Selection Sort is not.
   This matters when sorting objects by multiple keys.
```

### Summary (Flashcard)
```
1. Compare adjacent pairs → swap if left > right → repeat.
2. Stable, in-place, O(n²) average, O(n) best with early exit.
3. "Biggest bubble rises first" — each pass locks one more element.
```

---

## 2. QUICK SORT

### Description
```
How does your computer sort millions of files? Not by checking every
pair — that's too slow. Instead, it picks one "pivot" value and splits
everything into "smaller than pivot" and "bigger than pivot." Then it
repeats on each half. This divide-and-conquer trick is Quick Sort.

Think of organizing a messy bookshelf: grab any book (the pivot), put
everything shorter on the left, taller on the right. Now do the same
for each side. Each partition cuts the problem roughly in half.

Picks a pivot, partitions the array around it, then recursively sorts
each side. The Lomuto scheme uses the last element as pivot.

Use as default general-purpose sort. Prefer Merge Sort when stability
matters or guaranteed O(n log n) is needed (Quick Sort's worst is O(n²)).

Used in: C stdlib qsort, many language standard libraries, database
engines. The most practically used sorting algorithm in the world.

Remember: "Pick a pivot. Everything smaller goes left, bigger goes right. Repeat."
```

### Step Description Templates
```
PIVOT SELECTION:
  "Select pivot = {pivot} (the last element). Lomuto scheme always
   picks the rightmost element. Every other element will be compared
   against this pivot to decide which side it belongs on."

COMPARE WITH PIVOT:
  "Is {a[j]} ≤ {pivot}? {yes/no}. Elements ≤ pivot go to the LEFT
   partition; elements > pivot stay RIGHT."

SWAP TO LEFT PARTITION:
  "{a[j]} ≤ {pivot}, so swap it into the left partition at position {i}.
   This grows the 'smaller-than-pivot' region by one."

PLACE PIVOT:
  "Partition complete! Place pivot {pivot} at position {pivotFinal}.
   Everything left of it is smaller, everything right is bigger.
   This element is now in its FINAL sorted position — guaranteed."

RECURSE:
  "Now repeat on the left half [{low}..{pi-1}] and right half
   [{pi+1}..{high}]. Each recursive call handles a smaller subarray."
```

### Complexity Intuition
```
O(n log n) average: each partition splits the array roughly in half
(log n levels of recursion), and each level does n comparisons total.

But with a bad pivot (always smallest or largest), one partition has
0 elements and the other has n-1. That gives n levels × n work = O(n²).

Try it: run on "Reverse Sorted" input — the last element is always
the smallest, creating the worst case. Then run on "Random" — much faster!
```

### Common Mistakes
```
1. "Quick Sort is always faster than Merge Sort." — Not on sorted
   input with Lomuto pivot! Sorted → O(n²). Merge Sort is always
   O(n log n). Quick Sort wins on AVERAGE, not in the worst case.

2. "Quick Sort is stable." — No! Partitioning can swap equal elements
   across the pivot boundary. Use Merge Sort when stability matters.

3. "O(log n) space means it uses almost no memory." — O(log n) is the
   RECURSION DEPTH. Each recursive call uses stack space. With O(n)
   worst case depth on sorted input, this can cause stack overflow.
```

### Summary
```
1. Pick pivot → partition (smaller left, bigger right) → recurse both halves.
2. O(n log n) average, O(n²) worst (bad pivot), O(log n) space. NOT stable.
3. "The most used sort in the world — fast on average, but beware sorted input."
```

---

## 3. MERGE SORT

### Description
```
What if you could sort a million numbers by only ever merging two
already-sorted lists? That's the key insight of Merge Sort — and it's
why your programming language's built-in sort probably uses it.

Imagine sorting a shuffled deck of cards: split it in half, sort each
half (by splitting those in half, and so on), then merge the sorted
halves by always taking the smaller card from the top of each pile.
This "divide, conquer, combine" strategy guarantees O(n log n) — every time.

Recursively divides the array into halves until single elements remain,
then merges sorted subarrays by comparing their fronts.

Use when you need guaranteed O(n log n) worst case, stability, or are
sorting linked lists (where merge is O(1) space).

Used in: Python's Timsort (hybrid with insertion sort), Java's
Arrays.sort for objects, external sorting of files too large for memory.

Remember: "Split → sort halves → merge. Always O(n log n). The safe choice."
```

### Step Description Templates
```
DIVIDE:
  "Split [{left}..{right}] at midpoint {mid}. Divide-and-conquer:
   by splitting in half each time, we create only log₂(n) levels of
   recursion. Each level will do O(n) work during the merge."

MERGE START:
  "Now merge the sorted halves [{left}..{mid}] and [{mid+1}..{right}].
   Both halves are already sorted (from deeper recursion), so we just
   need to interleave them — always taking the smaller front element."

COMPARE DURING MERGE:
  "Compare L[{i}]={leftArr[i]} with R[{j}]={rightArr[j]}.
   Take the smaller one ({winner}) and place it next. This is why
   merge sort is STABLE — equal elements from the left half go first."

COPY REMAINING:
  "One half is exhausted. Copy remaining elements from the other half —
   they're already sorted, so they slot in directly."

FULLY SORTED:
  "All merges complete! Every split has been rejoined in sorted order.
   Total: {comparisons} comparisons across {log2(n)} levels = O(n log n)."
```

### Complexity Intuition
```
Always O(n log n) — even on worst-case input. Here's why:
• log₂(n) levels of splitting (10 elements = ~3 levels, 1000 = ~10)
• Each level does exactly n comparisons during merging
• Total: n × log₂(n) comparisons. Every. Single. Time.

The cost: O(n) extra space for temporary arrays during merging.
Merge Sort trades SPACE for CONSISTENCY — it's never fast, never slow.
Just reliably efficient.
```

### Common Mistakes
```
1. "Merge Sort is slower than Quick Sort." — On average, yes, slightly
   (larger constants). But Merge Sort NEVER degrades to O(n²). For
   guaranteed performance, Merge Sort wins.

2. "Merge Sort can't be done in-place." — Technically there IS an
   in-place merge sort, but it's so complex that nobody uses it.
   The O(n) space is considered an acceptable trade-off.
```

### Summary
```
1. Split in half → recursively sort both → merge sorted halves.
2. Always O(n log n), O(n) space. STABLE. Never degrades.
3. "The reliable sort. Python and Java trust it. You should too."
```

---

## 4. DIJKSTRA'S ALGORITHM

### Description
```
How does Google Maps find the fastest route from your house to the
airport? It uses an algorithm Edsger Dijkstra invented in 1956 on a
café napkin in Amsterdam — in 20 minutes.

Imagine you're at a subway station. You want to know the shortest
travel time to every other station. Start by visiting the nearest
station, update your estimates for its neighbors, then visit the next
nearest unvisited station. You spread outward like a ripple in a pond,
always expanding from the closest frontier. When you reach a station
this way, you've PROVEN it's the shortest path — no need to check again.

Greedily extracts the minimum-distance unvisited node, relaxes its
edges, and repeats until all nodes are settled.

Use for single-source shortest paths with non-negative edge weights.
Use Bellman-Ford if edges can be negative.

Used in: Google Maps, Waze, network routing (OSPF protocol), game
AI pathfinding, airline route planning.

Remember: "Always visit the closest unvisited node. Spread like a ripple."
```

### Step Description Templates
```
INIT:
  "Start at node {source}. Set its distance to 0, everyone else to ∞.
   We don't know any paths yet — we'll discover them as we explore."

EXTRACT MIN:
  "Visit node {u} (distance = {dist}). Why this node? Because it has
   the smallest tentative distance among unvisited nodes. Dijkstra's
   greedy insight: the shortest known path to the closest unvisited
   node IS the true shortest path. No shorter route exists."

RELAX EDGE:
  "Check edge {u}→{v} (weight {w}). Current best to {v}: {oldDist}.
   Going through {u}: {dist} + {w} = {newDist}. {better/worse}.
   {IF BETTER: 'Found a shorter path! Update {v}'s distance.'}"

SETTLE NODE:
  "Node {u} is settled. Its shortest distance ({dist}) is final —
   guaranteed optimal. No future discovery can improve it because all
   remaining unvisited nodes are farther away."
```

### Complexity Intuition
```
O((V + E) log V) with a binary heap priority queue.
• The log V comes from extracting the minimum from the heap
• We do this V times (once per node) and update E edges
• For a road network: 100K intersections, 300K roads → fast.
  For a complete graph (V²/2 edges) → slower but still practical.

Without a heap (array scan): O(V²). The heap is the key optimization.
```

### Common Mistakes
```
1. "Dijkstra works with negative edges." — NO! A negative edge can
   make a settled node's distance wrong. Use Bellman-Ford instead.
   Try it: imagine a shortcut with weight -100 discovered late.

2. "Dijkstra finds the path." — It finds the DISTANCE. To get the
   actual path, you need to track the 'previous node' pointer and
   backtrack from destination to source.
```

### Summary
```
1. Always visit closest unvisited node → update neighbor distances → repeat.
2. O((V+E) log V) with heap. NON-NEGATIVE weights only. Greedy.
3. "Google Maps in an algorithm. Spread from source like a ripple."
```

---

## 5. BFS (Breadth-First Search)

### Description
```
How does Facebook find people who are "2 connections away" from you?
It uses BFS — the simplest graph exploration algorithm, and one of the
most powerful.

Think of dropping a stone in a pond. Ripples spread outward in rings —
first the closest points, then the next ring, then the next. BFS does
the same in a graph: explore all neighbors first (ring 1), then all
their unvisited neighbors (ring 2), and so on. This "level by level"
expansion is why BFS guarantees the shortest path in unweighted graphs.

Uses a queue (FIFO) to process nodes level by level. Every node is
visited exactly once.

Use for shortest path in unweighted graphs, level-order traversal,
or any problem where you need to find the minimum number of steps.

Used in: Social networks (degrees of separation), web crawlers,
GPS (unweighted shortest path), puzzle solvers (fewest moves).

Remember: "Explore by rings. Queue = FIFO = nearest first. Shortest path guaranteed."
```

---

## 6. DFS (Depth-First Search)

### Description
```
Imagine you're in a maze. BFS would explore every corridor at the
same time — but you're one person. You pick a corridor and follow it
as far as you can. Dead end? Backtrack to the last fork and try
another path. That's DFS.

DFS dives deep before going wide. It uses a stack (or recursion) to
remember where to backtrack. This makes it ideal for problems where
you need to explore all possibilities: finding cycles, topological
ordering, checking connectivity, and solving puzzles.

Uses a stack (LIFO) or recursion. Visits nodes as deep as possible
before backtracking.

Use for detecting cycles, topological sort, finding connected
components, or any "explore all paths" problem. NOT for shortest path.

Used in: Compiler dependency resolution (topological sort), maze
generation, garbage collection (mark-and-sweep), AI game trees.

Remember: "Go deep, then backtrack. Stack = LIFO = deepest first."
```

---

## 7. 0/1 KNAPSACK (DP)

### Description
```
You're packing for a trip. Your bag holds 10 kg. You have 5 items,
each with a weight and a value. You can't take fractions — either the
whole item or nothing. Which combination gives the most total value?

This is the Knapsack Problem, and brute force (try all 2^n subsets) is
way too slow. DP solves it by building a table: "What's the best value
using the first i items with capacity w?" Each cell asks one question:
"Is it better to SKIP this item (look at the cell above) or TAKE it
(look up the value at reduced capacity + this item's value)?"

Builds an (items × capacity) table bottom-up. Backtracks to find
which items were selected.

Use for resource allocation problems with discrete choices and
a constraint (budget, weight, time).

Used in: Investment portfolio optimization, cargo loading, bandwidth
allocation, cutting stock problems, resource scheduling.

Remember: "For each item: skip or take? Compare both. Fill the table."
```

---

## 8. KMP (String Search)

### Description
```
You're reading a book, searching for the word "ABABC". You match
A-B-A-B... then the next letter is wrong. Do you go back to the
start? That's wasteful — you already know the "AB" at the end
matches the "AB" at the start! KMP exploits this insight.

KMP precomputes a "failure function" that tells the algorithm: when
a mismatch occurs at position j of the pattern, don't restart from
scratch — jump back to position failure[j-1], because that prefix
already matches. This avoids re-checking characters you've already seen.

Never moves backward in the text. Builds a failure function
in O(m) time, then matches in O(n) time. Total: O(n + m).

Use when you need guaranteed linear-time string search, especially
on large texts or streaming data where backtracking is impossible.

Used in: Text editors (find/replace), DNA sequence matching,
intrusion detection systems, log analysis, plagiarism detection.

Remember: "Precompute where to jump on mismatch. Never re-read the text."
```

---

## 9. N-QUEENS (Backtracking)

### Description
```
Can you place 8 queens on a chess board so none of them attack each
other? No two in the same row, column, or diagonal. Sounds simple —
but with 4 billion possible arrangements of 8 queens, brute force
is hopeless. Backtracking makes it elegant.

Think of it as filling a form: place a queen in row 1, then try row 2.
If no column works in row 2, don't try row 3 — backtrack to row 1 and
try the next column. This "try, check, backtrack" strategy prunes vast
branches of the search tree. Instead of checking 4 billion arrangements,
backtracking finds a solution in ~15,000 checks.

Places queens row by row. At each row, tries each column, checking
row/column/diagonal conflicts. Backtracks if no column is safe.

Use for constraint satisfaction problems: scheduling, Sudoku, map
coloring, circuit layout — any problem with "try all options, prune early."

Used in: Sudoku solvers, compiler register allocation, constraint
programming systems, scheduling engines.

Remember: "Try, check, backtrack. Don't explore what can't work."
```

---

## 10. AVL TREE

### Description
```
A BST (Binary Search Tree) is fast — O(log n) — but only if it's
balanced. Insert sorted data into a plain BST and it becomes a linked
list: O(n) for everything. AVL Trees fix this automatically.

Imagine a tree that checks its balance after every insertion. If one
side gets too heavy (height difference > 1), it rotates nodes to
rebalance — like a seesaw tipping and self-correcting. Four cases:
Left-Left (single right rotation), Right-Right (single left rotation),
Left-Right and Right-Left (double rotations).

Self-balancing BST that maintains |height(left) - height(right)| ≤ 1
for every node. Rotations restore balance after each insert/delete.

Use when you need guaranteed O(log n) for search, insert, and delete
with strict balance. Prefer Red-Black Trees when insertions are frequent
(fewer rotations).

Used in: Database indexing (some B-tree variants), memory allocators,
in-memory dictionaries where worst-case performance matters.

Remember: "BST + auto-balance. If one side is too heavy, rotate."
```

---

## APPLYING THIS TO ALL 62 ALGORITHMS

The 10 rewrites above demonstrate the A-grade standard. The remaining
52 algorithms should follow the same pattern. Key principles:

1. **HOOK**: Question or scenario, never a definition
2. **INTUITION**: Physical analogy (bubbles, ripples, packing, maze)
3. **WHY in steps**: First occurrence = full explanation, subsequent = brief
4. **Complexity = concrete numbers**: Show 10→100→1000 scaling
5. **Mistakes = specific**: Not "be careful" but "X is wrong because Y"
6. **Summary = 3 bullets**: Fits a flashcard, captures the essence
7. **Tone = conversational**: "you", "imagine", "think of" — not textbook
8. **Real-world = named systems**: "Google Maps", "Python's Timsort", not "many applications"
