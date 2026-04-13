# PHASE 3: ALGORITHM VISUALIZER & DATA STRUCTURE EXPLORER

> **Goal:** Two integrated modules -- Algorithms and Data Structures -- sharing a common animation framework. Users select an algorithm or data structure, see its code in Monaco, and watch a step-by-step animated visualization synchronized with code line highlighting, complexity counters, and a playback scrubber. Every algorithm supports custom input, comparison mode, and full playback control.

> **Prerequisite:** Phase 1 complete (app shell, canvas, stores, Monaco, workers). Phase 2 NOT required.

---

## ANIMATION STEP FRAMEWORK

This is the universal data model that powers every visualization in Phase 3. An algorithm/data-structure operation is recorded as an ordered list of `AnimationStep` objects. The playback controller walks through these steps.

```typescript
// lib/animation/types.ts

export interface AnimationStep {
  id: number;                        // sequential index starting at 0
  description: string;               // human-readable: "Compare arr[2]=5 with arr[3]=1"
  pseudocodeLine: number;            // 1-based line in the pseudocode to highlight
  codeHighlightRange?: {             // optional: highlight a range of lines
    startLine: number;
    endLine: number;
  };
  mutations: VisualMutation[];       // what changes visually in this step
  complexityCounters: {
    comparisons: number;             // cumulative comparisons so far
    swaps: number;                   // cumulative swaps so far
    reads: number;                   // cumulative array/memory reads
    writes: number;                  // cumulative writes
    recursionDepth: number;          // current recursion depth
    stackSize: number;               // current call stack size
    custom: Record<string, number>;  // algorithm-specific counters
  };
  duration: number;                  // ms this step should display at 1x speed
  category: StepCategory;           // for filtering/grouping in timeline
  breakpoint: boolean;               // pause here if breakpoints enabled
  annotations: Annotation[];         // floating labels, arrows, highlights
}

export type StepCategory =
  | "compare" | "swap" | "insert" | "delete" | "visit"
  | "push" | "pop" | "enqueue" | "dequeue"
  | "recurse" | "backtrack" | "merge" | "split"
  | "relax" | "mark-visited" | "mark-processed"
  | "rotate" | "recolor" | "rebalance"
  | "hash" | "resize" | "probe";

export interface VisualMutation {
  targetId: string;                  // ID of the visual element to mutate
  property: string;                  // "backgroundColor" | "position" | "opacity" | "text" | "borderColor" | "scale" | "height" | "width" | "cx" | "cy" | "stroke" | "highlighted"
  from: string | number;            // starting value
  to: string | number;              // ending value
  easing: EasingFunction;           // animation curve
  delay: number;                    // ms delay before this mutation starts
}

export type EasingFunction =
  | "linear" | "ease-in" | "ease-out" | "ease-in-out"
  | "spring" | "bounce" | "step";

export interface Annotation {
  type: "label" | "arrow" | "bracket" | "highlight-region";
  text?: string;
  position: { x: number; y: number };
  targetId?: string;                 // point to a visual element
  color: string;
  fontSize?: number;
}
```

### Step Generator Pattern

Each algorithm implements a generator function that produces steps:

```typescript
// lib/algorithms/sorting/bubble-sort.ts

export interface AlgorithmDefinition {
  id: string;
  name: string;
  category: AlgorithmCategory;
  subcategory: string;
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  stable: boolean;
  inPlace: boolean;
  description: string;
  pseudocode: string;              // displayed in Monaco, lines numbered
  generateSteps: (input: unknown) => AnimationStep[];
  defaultInput: unknown;
  inputSchema: InputSchema;        // describes what inputs the algorithm accepts
  visualizationType: VisualizationType;
  tags: string[];
}

export type AlgorithmCategory =
  | "sorting" | "graph" | "tree" | "dynamic-programming"
  | "string" | "geometry" | "backtracking" | "greedy";

export type VisualizationType =
  | "bar-chart"       // sorting: array as vertical bars
  | "graph"           // graph algorithms: force-directed or custom layout
  | "tree"            // tree algorithms: hierarchical top-down layout
  | "table"           // DP: 2D grid with cell highlighting
  | "string-match"    // string algos: two strings with pointer overlay
  | "grid"            // geometry/backtracking: 2D grid
  | "recursion-tree"  // recursion visualization: branching tree
  | "custom";         // algorithm provides its own renderer

export interface InputSchema {
  type: "array" | "graph" | "tree" | "string" | "matrix" | "number" | "custom";
  constraints: {
    minLength?: number;
    maxLength?: number;
    minValue?: number;
    maxValue?: number;
    sorted?: boolean;
    unique?: boolean;
  };
  presets: Array<{
    name: string;       // "Random", "Nearly Sorted", "Reversed", "Few Unique"
    generator: () => unknown;
  }>;
}
```

---

## PLAYBACK CONTROLLER

Universal controls shared across all algorithms and data structures.

```typescript
// components/playback/PlaybackController.tsx

export interface PlaybackState {
  steps: AnimationStep[];
  currentStepIndex: number;
  isPlaying: boolean;
  speed: number;                    // 0.25, 0.5, 1, 1.5, 2, 3, 4
  direction: "forward" | "backward";
  breakpointIndices: Set<number>;
  loopEnabled: boolean;
}

// Controls layout:
// ┌────────────────────────────────────────────────────────────────┐
// │ [|<] [<] [<<] [Play/Pause] [>>] [>] [>|]   Speed: [1x ▼]    │
// │                                                                │
// │ ─────●──────────────────────────────────────── Step 14 of 47  │
// │ 0:00                                                    0:12  │
// │                                                                │
// │ [Loop] [Breakpoints] [Step Category Filter ▼]                 │
// └────────────────────────────────────────────────────────────────┘

// Button actions:
// |<  = Jump to first step (index 0)
// <   = Step backward one step
// <<  = Step backward, skipping to previous category boundary
// Play/Pause = toggle auto-advance
// >>  = Step forward, skipping to next category boundary
// >   = Step forward one step
// >|  = Jump to last step

// Speed options: 0.25x, 0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x
// Timeline scrubber: click or drag to jump to any step
// Step counter: "Step 14 of 47" with editable input (type a number to jump)
// Keyboard: Space=play/pause, Left=step back, Right=step forward,
//           Home=start, End=end, +/- = speed up/down
```

---

## SORTING ALGORITHMS (15)

All sorting algorithms use the **bar-chart** visualization. Array elements are vertical bars where height = value. Color states:

| State | Color | Meaning |
|---|---|---|
| default | `#3B82F6` (blue) | untouched element |
| comparing | `#F59E0B` (yellow) | currently being compared |
| swapping | `#EF4444` (red) | currently being swapped |
| sorted | `#22C55E` (green) | in final sorted position |
| pivot | `#A855F7` (purple) | current pivot element |
| minimum | `#EC4899` (pink) | current minimum found |
| merged | `#06B6D4` (cyan) | just merged into position |
| bucket | `#F97316` (orange) | assigned to a bucket |

### Algorithm List

1. **Bubble Sort** -- Pseudocode: 8 lines. Steps: compare adjacent, swap if out of order. Highlight sorted tail. Time: O(n^2) avg/worst, O(n) best. Space: O(1). Stable: yes.

2. **Selection Sort** -- Find minimum in unsorted region, swap to front. Track current minimum with pink. Time: O(n^2) all cases. Space: O(1). Stable: no.

3. **Insertion Sort** -- Shift elements right to insert current element. Show "shifting" animation sliding bars right. Time: O(n^2) avg/worst, O(n) best. Space: O(1). Stable: yes.

4. **Shell Sort** -- Insertion sort with decreasing gap sequence (Knuth: gap = gap*3+1). Show gap lines connecting compared elements. Time: O(n^(3/2)) avg. Space: O(1). Stable: no.

5. **Merge Sort** -- Recursive split (show tree of splits), then merge (show two halves merging into temp array, then copy back). Auxiliary array shown below main. Time: O(n log n) all. Space: O(n). Stable: yes.

6. **Quick Sort (Lomuto)** -- Pivot = last element (purple). Partition with i/j pointers. Show partition boundary. Time: O(n log n) avg, O(n^2) worst. Space: O(log n). Stable: no.

7. **Quick Sort (Hoare)** -- Two pointers from ends moving inward. Pivot = first element. Show both pointers converging. Same complexity as Lomuto but fewer swaps on average.

8. **Heap Sort** -- Build max-heap (show heapify-down animations), then extract max repeatedly. Show tree view of heap alongside bar chart. Time: O(n log n) all. Space: O(1). Stable: no.

9. **Counting Sort** -- Build count array (show histogram below), accumulate, place elements. Show count array as separate bar chart. Time: O(n+k). Space: O(k). Stable: yes.

10. **Radix Sort (LSD)** -- Process digits from least significant. Show buckets 0-9 for each pass. Bars colored by current digit. Time: O(d*(n+k)). Space: O(n+k). Stable: yes.

11. **Radix Sort (MSD)** -- Process from most significant digit. Recursive on each bucket. Show recursion tree of bucket splits.

12. **Bucket Sort** -- Distribute into n buckets (show bucket containers), sort each bucket (insertion sort within), concatenate. Time: O(n+k) avg, O(n^2) worst. Space: O(n). Stable: yes.

13. **Tim Sort** -- Find runs (natural or forced minrun=32), merge runs using galloping mode. Show run detection phase, then merge tournament tree. Time: O(n log n) worst, O(n) best (nearly sorted). Space: O(n). Stable: yes.

14. **Cocktail Shaker Sort** -- Bidirectional bubble sort. Show forward and backward passes alternating. Time: O(n^2). Space: O(1). Stable: yes.

15. **Comb Sort** -- Bubble sort with shrinking gap (factor 1.3). Show gap decreasing each iteration. Time: O(n^2) worst, O(n log n) avg. Space: O(1). Stable: no.

---

## GRAPH ALGORITHMS (20+)

Visualization: force-directed layout (d3-force) or manual node placement. Nodes are circles, edges are lines/arrows. Color states:

| State | Color | Meaning |
|---|---|---|
| unvisited | `#6B7280` (gray) | not yet reached |
| discovered | `#3B82F6` (blue) | in queue/frontier |
| visiting | `#F59E0B` (yellow) | currently processing |
| visited | `#22C55E` (green) | fully processed |
| in-path | `#A855F7` (purple) | part of result path |
| in-tree | `#06B6D4` (cyan) | part of spanning tree |
| in-scc | varies | SCC components get distinct colors |
| relaxed | `#F97316` (orange) | edge just relaxed |

Graph input: adjacency list editor or visual click-to-create. Toggle directed/undirected, weighted/unweighted.

### Algorithm List

1. **BFS** -- Queue-based level traversal. Show queue contents, level-by-level frontier expansion, shortest path in unweighted graph. Pseudocode: 12 lines.

2. **DFS** -- Stack-based (or recursive). Show stack contents, back-edges detection, pre-order/post-order numbering. Pseudocode: 10 lines.

3. **Dijkstra** -- Priority queue (min-heap). Show distance table updating, relaxation animations on edges, current shortest path tree growing. Pseudocode: 15 lines.

4. **Bellman-Ford** -- V-1 iterations over all edges. Show iteration counter, distance table, negative cycle detection. Pseudocode: 12 lines.

5. **Floyd-Warshall** -- Triple-nested loop over all pairs. Show N*N distance matrix filling, with intermediate vertex k highlighted. Pseudocode: 8 lines.

6. **A* Search** -- f(n)=g(n)+h(n). Show open/closed sets, heuristic values, grid-based visualization with obstacles. Compare with Dijkstra side-by-side showing fewer nodes explored. Pseudocode: 18 lines.

7. **Topological Sort (Kahn's)** -- In-degree tracking, queue of zero-degree nodes, peel layers. Show in-degree badges on nodes, sorted order building. Pseudocode: 10 lines.

8. **Topological Sort (DFS)** -- Post-order DFS, reverse for topo order. Show finish times. Pseudocode: 8 lines.

9. **Kruskal's MST** -- Sort edges by weight, Union-Find to detect cycles. Show sorted edge list, Union-Find tree, MST growing edge by edge. Pseudocode: 12 lines.

10. **Prim's MST** -- Priority queue of edge weights from tree to non-tree. Show cut edges, MST growing from start vertex. Pseudocode: 14 lines.

11. **Tarjan's SCC** -- Single DFS with low-link values. Show discovery/low-link numbers, stack contents, back-edge detection, SCCs colored distinctly. Pseudocode: 18 lines.

12. **Kosaraju's SCC** -- Two-pass DFS (original + transposed graph). Show transposed graph construction, second pass finding components. Pseudocode: 14 lines.

13. **Articulation Points** -- DFS with discovery/low-link. Highlight cut vertices in red. Show removal effect: disconnected components. Pseudocode: 16 lines.

14. **Bridges** -- Similar to articulation points but for edges. Highlight bridge edges. Pseudocode: 14 lines.

15. **Bipartite Check** -- BFS/DFS 2-coloring. Show alternating colors, detect odd cycle for non-bipartite. Pseudocode: 10 lines.

16. **Ford-Fulkerson (DFS)** -- Max flow: find augmenting paths via DFS, augment, repeat. Show residual graph, flow/capacity labels on edges, min-cut at end. Pseudocode: 16 lines.

17. **Edmonds-Karp** -- Max flow with BFS for shortest augmenting path. Compare path choices with Ford-Fulkerson. Pseudocode: 14 lines.

18. **Dinic's Algorithm** -- Level graph + blocking flow. Show level assignment (BFS), blocking flow (DFS), multiple phases. Pseudocode: 20 lines.

19. **Hopcroft-Karp** -- Maximum bipartite matching. Show matching edges thickened, augmenting paths, phase-by-phase growth. Pseudocode: 18 lines.

20. **Euler Path/Circuit** -- Hierholzer's algorithm. Show edge removal, circuit splicing, final Euler path highlighted. Pseudocode: 12 lines.

21. **Cycle Detection (Directed)** -- DFS with coloring (white/gray/black). Show back edge detection. Pseudocode: 8 lines.

22. **Cycle Detection (Undirected)** -- Union-Find or DFS parent tracking. Show cycle highlighted when found. Pseudocode: 8 lines.

---

## TREE ALGORITHMS (15+)

Visualization: hierarchical top-down layout. Node circles with value text. Edge lines to children. Color states similar to graph but with tree-specific states:

| State | Color | Meaning |
|---|---|---|
| default | `#3B82F6` | normal node |
| current | `#F59E0B` | currently processing |
| found | `#22C55E` | search target found |
| rotating | `#EF4444` | undergoing rotation |
| recoloring | `#A855F7` | Red-Black recolor |
| balanced | `#06B6D4` | confirmed balanced |

### Algorithm List

1. **BST Insert/Search/Delete** -- Show path traversed, leaf insertion, deletion cases (leaf, one child, two children with successor). Pseudocode: 20 lines combined.

2. **AVL Insert with Rotations** -- Show balance factor badges (-1, 0, +1), detect imbalance, animate single/double rotations (LL, RR, LR, RL). Subtrees visually swing. Pseudocode: 25 lines.

3. **Red-Black Tree Insert** -- Show red/black node colors, Uncle checks, rotations + recoloring cascading up. All 4 fix-up cases animated. Pseudocode: 30 lines.

4. **B-Tree Insert/Search/Delete** -- Multi-key nodes (show horizontal key arrays), page splits animated (median promoted, children redistributed). Configurable order (m=3,4,5). Pseudocode: 20 lines.

5. **B+ Tree Insert/Search** -- Like B-Tree but leaf-level linked list for range queries. Show leaf chain, internal vs leaf node distinction. Range query scans highlighted.

6. **Trie Insert/Search/Delete** -- Letter-per-edge tree. Show word insertion character by character, prefix highlighting, word termination markers. Pseudocode: 15 lines.

7. **Segment Tree Build/Query/Update** -- Show interval ranges in each node, query decomposition (which nodes contribute), lazy propagation with pending values. Pseudocode: 20 lines.

8. **Fenwick Tree (BIT) Update/Query** -- Show binary representation of indices, jump pattern (i += i & -i for update, i -= i & -i for query). Array + tree side-by-side. Pseudocode: 10 lines.

9. **Heap Insert/ExtractMax/Heapify** -- Show tree form + array form side-by-side. Bubble-up and sift-down animated. Build-heap from array in O(n). Pseudocode: 15 lines.

10. **Huffman Tree Construction** -- Priority queue of frequencies, merge two smallest, build tree, generate codes. Show frequency table, tree growing, final code table. Pseudocode: 15 lines.

11. **LCA (Binary Lifting)** -- Precompute `up[node][k]` table. Query: equalize depths, jump together. Show table, path highlighted. Pseudocode: 18 lines.

12. **Traversals (In/Pre/Post/Level)** -- Side-by-side 4 traversals on same tree. Show visit order numbering and output sequence building. Pseudocode: 6 lines each.

13. **Binary Lifting** -- Sparse table `anc[v][k] = anc[anc[v][k-1]][k-1]`. Show jump decomposition for ancestor queries. Pseudocode: 12 lines.

14. **Splay Tree** -- Zig, Zig-Zig, Zig-Zag rotations to bring accessed node to root. Show amortized O(log n) through repeated access. Pseudocode: 18 lines.

15. **Treap Insert/Delete** -- BST by key, heap by random priority. Show rotations to maintain heap property. Pseudocode: 14 lines.

---

## DYNAMIC PROGRAMMING ALGORITHMS (15+)

Visualization: 2D table (grid) with cell highlighting + optional recursion tree. Table cells color states:

| State | Color | Meaning |
|---|---|---|
| unfilled | `#1F2937` (dark gray) | not yet computed |
| computing | `#F59E0B` (yellow) | currently being filled |
| dependency | `#3B82F6` (blue) | cells this cell depends on |
| filled | `#22C55E` (green) | computed |
| optimal-path | `#A855F7` (purple) | part of optimal solution trace |

### Algorithm List

1. **Fibonacci (Top-Down + Bottom-Up)** -- 1D table. Show recursion tree with memoization (grayed-out repeated calls) vs iterative table fill. Compare call counts. Pseudocode: 8 lines each.

2. **Longest Common Subsequence (LCS)** -- 2D table [m+1][n+1]. Show strings on axes, fill cell-by-cell with match/no-match decision, backtrack to reconstruct LCS. Pseudocode: 12 lines.

3. **Longest Increasing Subsequence (LIS)** -- 1D DP + patience sorting visualization (card piles). Show both O(n^2) DP and O(n log n) binary search approaches. Pseudocode: 10 lines.

4. **Edit Distance (Levenshtein)** -- 2D table. Show insert/delete/replace costs, highlight minimum path. Source and target strings on axes. Pseudocode: 10 lines.

5. **0/1 Knapsack** -- 2D table [items][capacity]. Show item inclusion/exclusion decision per cell. Backtrack to show which items selected. Pseudocode: 10 lines.

6. **Unbounded Knapsack** -- 1D table [capacity]. Show how each item can be used multiple times. Compare with 0/1 side-by-side. Pseudocode: 8 lines.

7. **Coin Change (Min Coins)** -- 1D table [amount+1]. Show coin choices per cell, trace back to show which coins used. Pseudocode: 8 lines.

8. **Matrix Chain Multiplication** -- 2D upper-triangular table. Show split point choices, parenthesization of optimal. Pseudocode: 12 lines.

9. **Longest Palindromic Subsequence** -- 2D table, show diagonal fill pattern. Highlight palindrome in original string. Pseudocode: 10 lines.

10. **Rod Cutting** -- 1D table [length+1]. Show price table input, optimal cuts trace. Pseudocode: 8 lines.

11. **Subset Sum** -- 2D boolean table [items][target]. Show true/false propagation. Pseudocode: 8 lines.

12. **Partition Equal Subset Sum** -- Reduce to subset sum with target=totalSum/2. Show feasibility check then DP. Pseudocode: 10 lines.

13. **Shortest Common Supersequence** -- 2D table using LCS. Show supersequence reconstruction by merging both strings guided by LCS table. Pseudocode: 12 lines.

14. **Kadane's Algorithm** -- 1D sweep. Show running `maxEndingHere` and `maxSoFar` with bar chart highlighting current subarray. Pseudocode: 6 lines.

15. **Egg Drop Problem** -- 2D table [eggs][floors]. Show binary search optimization. Pseudocode: 12 lines.

16. **Catalan Numbers** -- 1D table with recursive formula C(n) = sum C(i)*C(n-1-i). Show applications: valid parentheses, BST count. Pseudocode: 6 lines.

---

## STRING ALGORITHMS (8+)

Visualization: Two strings displayed horizontally with character-level pointers, windows, and match highlights.

1. **KMP (Knuth-Morris-Pratt)** -- Show failure function table construction, then main scan with pointer jumps on mismatch. Highlighted prefix/suffix matches. Pseudocode: 18 lines.

2. **Rabin-Karp** -- Show rolling hash computation, hash comparison, full comparison on hash match. Hash collision visualization. Pseudocode: 14 lines.

3. **Boyer-Moore** -- Bad character + good suffix tables. Show right-to-left comparison, skip distances. Pseudocode: 20 lines.

4. **Z-Algorithm** -- Z-array construction with Z-box. Show [L,R] window sliding, Z-values in array below. Pseudocode: 12 lines.

5. **Suffix Array Construction** -- Show all suffixes sorted, rank array, application to pattern matching via binary search. Pseudocode: 15 lines.

6. **Aho-Corasick** -- Trie + failure links for multi-pattern matching. Show automaton construction, pattern scanning, all matches highlighted simultaneously. Pseudocode: 20 lines.

7. **LCP Array** -- Compute from suffix array using Kasai's algorithm. Show adjacent suffix comparison, LCP values. Pseudocode: 10 lines.

8. **Manacher's Algorithm** -- Longest palindromic substring in O(n). Show expanded string with separators, radius array, center/right boundary. Pseudocode: 14 lines.

---

## COMPUTATIONAL GEOMETRY (5+)

Visualization: 2D canvas with points, lines, polygons drawn on a coordinate grid.

1. **Convex Hull (Graham Scan)** -- Sort by polar angle from bottom-most point. Show stack of hull points, CCW test at each step, hull growing. Pseudocode: 12 lines.

2. **Convex Hull (Jarvis March)** -- Gift wrapping: find leftmost, sweep to find next hull point. Show sweep line rotating. Pseudocode: 10 lines.

3. **Line Segment Intersection** -- Sweep line with event queue (segment endpoints). Show sweep line moving, active segment set, intersection points detected. Pseudocode: 16 lines.

4. **Closest Pair of Points** -- Divide and conquer. Show recursive split, strip of width 2*delta, merge. Pseudocode: 18 lines.

5. **Voronoi Diagram (Fortune's Algorithm)** -- Beach line + sweep line. Show parabolas, breakpoints, circle events, Voronoi edges forming. Pseudocode: 25 lines.

6. **Delaunay Triangulation** -- Dual of Voronoi. Show flip algorithm, circumcircle test, triangulation refining. Pseudocode: 20 lines.

---

## BACKTRACKING ALGORITHMS (5+)

Visualization: grid-based (chessboard, sudoku, etc.) or recursion tree.

1. **N-Queens** -- NxN chessboard. Place queens row by row, backtrack on conflict. Show conflict detection (row/column/diagonal highlights), recursion tree. Pseudocode: 12 lines.

2. **Sudoku Solver** -- 9x9 grid. Try digits 1-9, validate row/col/box, backtrack. Show constraint propagation, candidate highlighting. Pseudocode: 14 lines.

3. **Knight's Tour** -- Chessboard with numbered visit order. Show Warnsdorff's heuristic, backtrack count. Pseudocode: 12 lines.

4. **Hamiltonian Path/Cycle** -- Graph: find path visiting all vertices exactly once. Show path growing, dead-end backtrack. Pseudocode: 10 lines.

5. **Subset Generation (Bit Masking)** -- Show binary counter, subset elements highlighted. Include power set tree. Pseudocode: 6 lines.

6. **Permutation Generation** -- Heap's algorithm or swap-based. Show swap tree, current permutation. Pseudocode: 8 lines.

---

## DATA STRUCTURES (45+)

Each data structure has: visual representation on canvas, interactive operations (insert, delete, search, etc.), step-by-step animation of internal mechanics, and synced pseudocode.

### Basic Data Structures (8)

1. **Array** -- Horizontal boxes with indices. Insert: show shift-right animation. Delete: show shift-left. Access: O(1) highlight by index. Resize: show copy to new larger array.

2. **Linked List (Singly + Doubly)** -- Boxes with arrows. Insert at head/tail/position: pointer redirection animated. Delete: node removal with pointer bypass. Traversal: cursor moving through nodes.

3. **Stack** -- Vertical stack of boxes. Push: new box slides in from top. Pop: top box slides out. Peek: top highlighted. Show overflow/underflow states. Array-based and linked-list-based variants.

4. **Queue** -- Horizontal boxes. Enqueue: add to rear. Dequeue: remove from front. Show front/rear pointers. Array-based (circular) and linked-list variants.

5. **Deque** -- Double-ended queue. Push/pop from both ends. Show circular array implementation with wrap-around.

6. **Hash Table** -- Array of buckets. Insert: hash function visualization (key -> hash -> index), collision handling animated. Separate chaining: linked list at bucket. Open addressing: linear probing, quadratic probing, double hashing -- show probe sequence. Resize: rehash all elements into larger table. Load factor gauge.

7. **Priority Queue (Binary Heap)** -- Tree + array dual view. Insert: add at end, bubble-up. ExtractMin/Max: swap with end, sift-down. Show heap property check at each level. Build-heap: Floyd's O(n) algorithm.

8. **Circular Buffer** -- Ring visualization. Show head/tail pointers wrapping around. Full/empty states. Overwrite mode vs blocking mode.

### Tree-Based Data Structures (12)

9. **BST** -- standard BST with insert/search/delete animations (see Tree Algorithms above).
10. **AVL Tree** -- BST + balance factors + rotation animations.
11. **Red-Black Tree** -- BST + red/black coloring + fix-up rotations and recoloring.
12. **B-Tree** -- Multi-way tree with configurable order. Page split/merge animations.
13. **B+ Tree** -- B-Tree variant with leaf-level linked list. Range query animation.
14. **Trie** -- Character-per-edge tree. Prefix search, autocomplete.
15. **Segment Tree** -- Interval tree for range queries. Lazy propagation visualization.
16. **Fenwick Tree (BIT)** -- Binary indexed tree. Update/prefix-sum with binary index jumps.
17. **Splay Tree** -- Self-adjusting BST. Zig/Zig-Zig/Zig-Zag rotations on access.
18. **Treap** -- BST by key, heap by random priority.
19. **Suffix Tree** -- Ukkonen's construction. Pattern matching and substring queries.
20. **van Emde Boas Tree** -- Recursive universe splitting. Show sqrt(u) clusters, min/max shortcuts.

### Advanced Data Structures (11)

21. **Skip List** -- Multiple levels of linked lists with express lanes. Show search path descending levels. Insert with random level generation (coin flips). Delete: remove from all levels. Level probabilities visualization.

22. **Bloom Filter** -- Bit array + k hash functions. Insert: set k bits. Query: check k bits, show false-positive possibility. Show false-positive rate formula: (1 - e^(-kn/m))^k. Optimal k = (m/n) * ln(2).

23. **Count-Min Sketch** -- 2D array of counters (d rows x w columns). Insert: increment d positions. Query: return minimum of d values. Show overcount but never undercount property. Error bounds: epsilon = e/w, delta = e^(-d).

24. **HyperLogLog** -- Hash to binary, count leading zeros. Show registers array (m = 2^p), harmonic mean estimator. Demonstrate counting distinct elements in stream with <1% error using 12KB.

25. **LSM Tree** -- Memtable (red-black tree in memory) -> SSTable on disk. Show write path: insert to memtable, flush to L0, compaction L0->L1->L2 (merge-sort). Read path: memtable -> L0 -> L1 (with Bloom filter checks). Show write amplification calculation.

26. **R-Tree** -- Spatial index with bounding rectangles. Insert: choose subtree with minimum enlargement. Split: show Guttman's quadratic split. Range query: show MBR overlap checks descending tree. 2D canvas with rectangles.

27. **Quadtree** -- 2D recursive spatial subdivision into 4 quadrants. Insert points, show split when capacity exceeded. Range query, nearest neighbor. Interactive: click to add points.

28. **Persistent Red-Black Tree** -- Path-copying on modification. Show old version still accessible. Version timeline with branching. Memory sharing of unchanged subtrees.

29. **Rope** -- Balanced binary tree of string fragments for efficient text editing. Show split/concat in O(log n). Compare with array-backed string for large text operations. Text editor insert/delete simulation.

30. **Fibonacci Heap** -- Collection of heap-ordered trees. Insert: O(1) add to root list. DecreaseKey: O(1) amortized with cascading cut. ExtractMin: consolidation phase animated. Show mark bits, degree bounds.

31. **Binomial Heap** -- Collection of binomial trees. Show merge operation (like binary addition), extractMin, decreaseKey. Binomial tree structure B0, B1, B2, ... visualized.

### System Design Data Structures (6)

These structures are especially relevant for system design understanding.

32. **Disjoint Set (Union-Find)** -- Forest of trees with union-by-rank and path compression. Show find with path compression (all nodes point to root after). Union: shorter tree hangs under taller. Amortized nearly O(1) per operation via inverse Ackermann.

33. **Consistent Hash Ring** -- Visual ring 0 to 2^32. Add/remove nodes: show key redistribution. Virtual nodes: each physical node gets V positions. Load histogram. Key lookup: walk clockwise to first node.

34. **Merkle Tree** -- Binary tree of hashes. Leaf = hash(data block). Internal = hash(left || right). Show verification path: prove single leaf with O(log n) hashes. Detect data corruption. Used in git, blockchain, distributed sync.

35. **CRDTs (Conflict-free Replicated Data Types)** -- G-Counter: show per-replica counters, merge = max per replica, value = sum. PN-Counter: two G-Counters (positive, negative). LWW-Register: last-writer-wins with timestamps. OR-Set: add/remove with unique tags. Show concurrent updates on 3 replicas converging after merge.

36. **Vector Clock** -- N-process vector of logical timestamps. Send: increment own. Receive: max per component + increment own. Show happen-before relation, concurrent events detection. Space-time diagram with process timelines.

37. **Gossip Protocol State** -- N nodes in 2D space. Each node has a state version. Gossip round: each node picks random peer, exchanges state. Show epidemic spread: S-curve convergence. Configurable fanout (1, 2, 3 peers per round) and interval.

---

## MONACO CODE PANEL

The bottom panel "Code" tab shows the algorithm's pseudocode or implementation in a read-only Monaco editor with line highlighting synchronized to the current animation step.

```typescript
// Configuration for Monaco in algorithm mode:
// - Language: typescript (for syntax highlighting of pseudocode)
// - Read-only: true (user cannot edit pseudocode)
// - Line highlighting: current step's pseudocodeLine gets yellow background
// - Previously executed lines: light green background
// - Not-yet-executed lines: default background
// - Line numbers: shown
// - Minimap: hidden (pseudocode is short)
// - Font: Geist Mono, 13px
// - Theme: matches app dark/light theme
// - Decorations API used for line highlighting:
//   editor.deltaDecorations(oldDecorations, [
//     { range: new Range(line, 1, line, 1), options: {
//       isWholeLine: true,
//       className: 'current-step-line',       // yellow bg
//       glyphMarginClassName: 'current-step-glyph' // yellow arrow
//     }}
//   ]);
```

---

## COMPLEXITY ANALYSIS PANEL

Shown in a collapsible section above or beside the visualization:

```
┌──────────────────────────────────────┐
│ COMPLEXITY ANALYSIS                  │
├──────────────────────────────────────┤
│ Time:  Best O(n)  Avg O(n log n)    │
│        Worst O(n^2)                  │
│                                      │
│ Space: O(log n)                      │
│                                      │
│ LIVE COUNTERS            │ CURRENT   │
│ Comparisons:             │ 47        │
│ Swaps:                   │ 12        │
│ Array Reads:             │ 94        │
│ Array Writes:            │ 24        │
│ Recursion Depth:         │ 3 / 5    │
│ Stack Size:              │ 3         │
│                                      │
│ [comparison bar vs other algorithms] │
└──────────────────────────────────────┘
```

Live counters update on every animation step from `step.complexityCounters`. The comparison bar shows how this algorithm's operation count compares to other algorithms on the same input (e.g., Quick Sort used 47 comparisons vs Bubble Sort's 190 on the same array).

---

## SIDE-BY-SIDE COMPARISON MODE

Split the canvas into 2 (or up to 4) panels, each running a different algorithm on the SAME input simultaneously.

```typescript
// Comparison mode state:
export interface ComparisonState {
  enabled: boolean;
  panels: Array<{
    algorithmId: string;
    steps: AnimationStep[];
    currentStep: number;
  }>;
  syncMode: "step" | "time" | "independent";
  // "step" = all advance to same step number simultaneously
  // "time" = all advance at real-time speed (faster algo finishes first)
  // "independent" = each has own playback controls
  sharedInput: unknown;             // same input for all panels
}
```

Layout: side-by-side with a shared playback controller. Each panel shows algorithm name, current step count, live counters. Summary comparison table appears when all finish:

```
┌─────────────┬──────────┬──────────┬───────────┐
│ Metric      │ QuickSort│ MergeSort│ HeapSort  │
├─────────────┼──────────┼──────────┼───────────┤
│ Steps       │ 47       │ 62       │ 71        │
│ Comparisons │ 38       │ 45       │ 58        │
│ Swaps       │ 12       │ 0 (copy) │ 34        │
│ Time O()    │ n log n  │ n log n  │ n log n   │
│ Space O()   │ log n    │ n        │ 1         │
│ Stable      │ No       │ Yes      │ No        │
└─────────────┴──────────┴──────────┴───────────┘
```

---

## CUSTOM INPUT SUPPORT

Every algorithm accepts custom input via a panel above the visualization:

- **Sorting**: text input for array (comma-separated numbers), or sliders for random generation (size 5-200, value range 1-999, distribution: random/nearly-sorted/reversed/few-unique/all-equal)
- **Graph**: adjacency list text editor, or visual click to add nodes/edges on canvas, import from JSON
- **Tree**: insert sequence text input, or visual click to insert nodes
- **DP**: problem-specific inputs (e.g., two strings for LCS, weights+values+capacity for knapsack)
- **String**: text and pattern inputs
- **Geometry**: click on 2D canvas to place points, or paste coordinate list
- **Backtracking**: board size for N-Queens, initial grid for Sudoku, graph for Hamiltonian

---

## WHAT SUCCESS LOOKS LIKE (End of Phase 3)

1. All 15 sorting algorithms animate correctly with proper color states and step generation
2. All 22 graph algorithms work on directed/undirected weighted/unweighted graphs
3. All 15+ tree algorithms show correct tree transformations (rotations, splits, merges)
4. All 16+ DP algorithms fill tables correctly with dependency highlighting and backtracking
5. All 8+ string algorithms show pattern matching with pointer movement
6. All 6 geometry algorithms render on 2D canvas with sweep lines and hulls
7. All 6 backtracking algorithms show recursion tree alongside board state
8. All 37+ data structures support interactive operations with animations
9. Monaco code panel highlights the correct pseudocode line for every step
10. Playback controller works: play, pause, step forward/backward, speed changes, scrubber
11. Complexity counters update accurately on every step
12. Comparison mode runs 2-4 algorithms simultaneously on shared input
13. Custom input works for every algorithm and data structure
14. Algorithm worker runs step generation off main thread (no UI jank for large inputs)
15. All animations respect prefers-reduced-motion (instant transitions, no particle effects)
