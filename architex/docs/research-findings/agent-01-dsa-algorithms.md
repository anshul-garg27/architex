Now I have complete understanding of the existing architecture. Here is the full DSA module feature specification.

---

# ARCHITEX DSA MODULE -- COMPLETE INTERACTIVE FEATURE SPECIFICATION

## Inventory of What Already Exists

Before specifying anything, here is the exact state of what Architex already has, based on codebase analysis:

**Infrastructure (fully built):**
- `AnimationStep` / `VisualMutation` / `AlgorithmConfig` / `AlgorithmResult` type system (`src/lib/algorithms/types.ts`)
- `PlaybackController` with play/pause/stop/stepForward/stepBackward/jumpTo/setSpeed (`src/lib/algorithms/playback-controller.ts`)
- FSRS-5 spaced repetition engine (`src/lib/fsrs.ts`)
- Quiz question schema with module/type/difficulty/options/explanation (`src/db/schema/quiz-questions.ts`)
- AI Pattern Explainer (Claude Sonnet, heuristic fallback)
- WalkthroughPlayer for step-by-step learning
- ReviewWidget for FSRS flashcard review
- Adaptive quiz difficulty (streak-based)

**Algorithms already implemented with step recording:**
- **Patterns**: sliding-window, two-pointers, monotonic-stack, floyd-cycle
- **Graphs**: BFS, DFS, DFS-iterative, Dijkstra, Bellman-Ford, Kruskal, Prim, topological-sort (2 variants), Tarjan SCC, Floyd-Warshall, bipartite, cycle-detection, Euler path, Ford-Fulkerson, articulation-points, bridges, A*
- **Trees**: traversals (in/pre/post/level), BST, AVL, red-black, B-tree, Huffman, trie, union-find, segment-tree, fenwick-tree, heap-operations
- **DP**: fibonacci, LCS, edit-distance, knapsack, coin-change, LIS, matrix-chain, rod-cutting, subset-sum, longest-palindrome, catalan
- **Strings**: KMP, Rabin-Karp, Boyer-Moore, Z-algorithm
- **Backtracking**: N-Queens, Sudoku, Knight's tour, subset-generation
- **Search**: binary-search
- **Greedy**: activity-selection, fractional-knapsack
- **Design**: LRU-cache

---

## 1. ARRAYS

### 1A. Prefix Sum

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Canvas shows array of numbers with a second "prefix" row building beneath it. Each cell lights up as `prefix[i] = prefix[i-1] + arr[i]` computes. The "aha moment" animation: user picks any range [L, R], and the system instantly highlights that `prefix[R] - prefix[L-1]` gives the sum -- two array lookups vs re-summing the subarray. Side panel shows the O(n) precomputation enabling O(1) range queries. | 9 | 7 | M | No |
| **SIMULATION** | Real-time: user enters custom array (up to 20 elements), drags range selectors [L, R]. Top bar shows "naive sum: O(R-L+1) operations" vs "prefix sum: 2 lookups." Parameters: array values (editable), range endpoints (draggable). Metrics: operation count comparison, wall-clock time for large arrays (1M elements simulated). | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Given this array and 5 range queries, compute answers using prefix sum" (graded by correctness + whether user uses subtraction formula vs brute force). Challenge 2: "Find subarray with sum = K" using prefix sum + hashmap. Hints: (1) "What if you precompute all partial sums?" (2) "prefix[R] - prefix[L-1] = target means..." | 8 | 6 | M | No |
| **ASSESSMENT** | Quiz: "What is prefix[5] - prefix[2] for array [3,1,4,1,5,9,2]?" Prediction: "After building prefix sum, how many operations to answer 100 range queries on an array of 10,000 elements?" Complexity ID: "Time to build prefix array? Time per query? Total for Q queries on N elements?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "How do you compute sum(arr[L..R]) in O(1)?" Back: "Build prefix[i] = prefix[i-1] + arr[i]. Answer = prefix[R] - prefix[L-1]. Build: O(n). Query: O(1)." Micro-review: show a 5-element array, ask for prefix[3] - prefix[1] = ? (mental math, 15 seconds). | 7 | 4 | S | Partial (FSRS exists, cards need creation) |
| **AI** | AI explains: "Why does prefix[R] - prefix[L-1] work?" with cancellation proof. AI generates: random array + random queries, auto-graded. AI adapts: starts with 1D prefix sum, graduates to 2D prefix sum on matrices if user scores >80%. | 8 | 7 | M | Partial (AI explainer exists, DSA-specific prompts needed) |

### 1B. Kadane's Algorithm

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array displayed horizontally. Two variables tracked visually: `currentMax` (orange bar under current position) and `globalMax` (green bar locked at best-so-far). The "aha moment": when `currentMax` drops below 0, it resets to 0 -- shown as the orange bar snapping back. The negative-prefix-is-worthless insight. Pseudocode panel highlights `max(arr[i], currentMax + arr[i])` with color-coded branches. | 9 | 8 | M | No |
| **SIMULATION** | Real-time: user edits array values (including negatives). `currentMax` and `globalMax` bars animate as scan proceeds. Parameters: array values (drag to edit), playback speed. Metrics: current subarray boundaries (highlighted in array), running max, number of resets, final answer with exact subarray indices. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Trace Kadane's on [-2, 1, -3, 4, -1, 2, 1, -5, 4] -- what is the max subarray sum?" (user steps through, gets immediate feedback per step). Challenge 2: "Modify Kadane's to also return the starting and ending indices." Challenge 3: "What if all elements are negative?" -- edge case challenge. | 9 | 7 | M | No |
| **ASSESSMENT** | Quiz: "At which index does currentMax reset to 0?" (visual trace). Prediction: "After processing index 4, what is globalMax?" Complexity ID: "Why is Kadane's O(n) and not O(n^2)?" with multiple-choice explanations. | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Kadane's recurrence for maximum subarray sum." Back: "`currentMax = max(arr[i], currentMax + arr[i])`. Key insight: a negative running sum is never worth keeping -- start fresh." Micro-review: 6-element array, "what is the max subarray sum?" (30 seconds). | 7 | 4 | S | Partial |
| **AI** | AI explains the "why start fresh" insight with a proof by contradiction. AI generates arrays with interesting edge cases (all negative, single element, alternating). AI adapts: if user struggles with resets, generates more arrays where the reset point is the key decision. | 8 | 6 | M | Partial |

### 1C. Two Pointers

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Sorted array with left pointer (blue arrow below) and right pointer (red arrow above). Pointers walk inward. Sum displayed in center. The "aha moment": when sum is too large, right pointer retreats (red arrow slides left with "sum too big" tooltip); when too small, left advances. The O(n) convergence is felt viscerally vs brute-force O(n^2) grid shown faded in background. | 9 | 8 | S | Yes |
| **SIMULATION** | Real-time: user sets target sum, edits array values. Both pointers animate. Parameters: target value (slider), array values, speed. Metrics: comparisons made, elements eliminated per step, search space remaining (shown as shrinking highlighted region). | 8 | 7 | S | Yes (base exists) |
| **PRACTICE** | Challenge 1: "Find pair summing to 13 in [1,2,3,5,8,11,15]" (user controls pointers). Challenge 2: "Container with most water" (two-pointer on heights). Challenge 3: "3Sum -- extend to three pointers." Hints: (1) "Which direction increases the sum?" (2) "The array is sorted -- use that." | 9 | 7 | M | Partial |
| **ASSESSMENT** | Quiz: "Which pointer moves when sum < target on a sorted array?" Prediction: "After 3 steps on this array, where are the pointers?" Complexity: "Why does two-pointer guarantee we don't miss the answer?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Two-pointer invariant on sorted array." Back: "Left+Right sum: too small -> advance left (increase minimum). Too big -> retreat right (decrease maximum). Guarantees O(n) because each pointer only moves forward." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Why can we safely move the left pointer and not miss pairs?" (with proof). AI generates: variant problems (triplets, quadruplets, closest sum). AI adapts: starts with basic pair sum, then moves to opposite-direction variants (container with water), then same-direction variants (remove duplicates). | 8 | 6 | M | Partial |

### 1D. Sliding Window

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array with a colored "window" overlay (translucent rectangle) that slides right. When the window moves, the leaving element fades red and the entering element glows green. Running sum updates: `sum = sum - leaving + entering`. The "aha moment": overlaying the naive approach (recalculating entire window each time) against sliding (single subtraction + addition). | 9 | 9 | S | Yes |
| **SIMULATION** | Real-time: user adjusts window size K with a slider. Window slides with animation. Parameters: K (1 to n), array values, speed. Metrics: current window sum, best window sum, operations saved vs naive (counter), current window position. | 8 | 8 | S | Yes (base exists) |
| **PRACTICE** | Challenge 1: "Find max sum subarray of size 3" (step through). Challenge 2: "Longest substring without repeating characters" (variable-size window). Challenge 3: "Minimum window substring" (shrink + expand). Graded by correctness and whether user identifies the right window type (fixed vs variable). | 9 | 7 | M | Partial |
| **ASSESSMENT** | Quiz: "Fixed-size vs variable-size window -- when do you use each?" Prediction: "Window is at [2,5]. After one slide, what is the new sum?" Complexity: "Why is sliding window O(n) even though it looks at K elements?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Sliding window formula for fixed-size K." Back: "`newSum = oldSum - arr[i-K] + arr[i]`. O(n) regardless of K. Variable-size: expand right until condition met, shrink left until condition breaks." | 7 | 4 | S | Partial |
| **AI** | AI explains the fixed-vs-variable distinction with examples. AI generates: arrays with different optimal window positions. AI adapts: fixed-size first, then variable-size, then multi-condition windows. | 8 | 6 | M | Partial |

### 1E. Binary Search Variants

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Sorted array with search space highlighted (gray = eliminated, blue = active). Mid pointer bounces to center of active region each iteration. The "aha moment": a counter shows "search space: 16 -> 8 -> 4 -> 2 -> 1" -- the halving is visceral. For variants (lower bound, upper bound), show the subtle difference in how `mid` updates and where the pointer lands. | 9 | 8 | M | Partial (basic binary search exists) |
| **SIMULATION** | Real-time: user picks target, watches elimination. Parameters: array size (up to 64, power-of-2 for clean halving), target value, variant selector (exact / lower bound / upper bound / first true). Metrics: iterations vs log2(n), search space per step, final position. | 8 | 7 | M | Partial |
| **PRACTICE** | Challenge 1: "Find first occurrence of 5 in [1,3,5,5,5,7,9]" (lower bound). Challenge 2: "Find insertion position" (upper bound). Challenge 3: "Find peak element in mountain array." Challenge 4: "Search in rotated sorted array." Graded by: correct answer + correct variant identification. | 9 | 7 | M | Partial |
| **ASSESSMENT** | Quiz: "lower_bound vs upper_bound -- which condition uses `<=` vs `<`?" Prediction: "After 2 iterations on array of size 16, what is the search space?" Complexity: "Why is binary search O(log n)? Prove with recurrence T(n) = T(n/2) + O(1)." | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Binary search invariant: what must be true at every iteration?" Back: "The target (if it exists) is always within [lo, hi]. Each step reduces this range by half. Variant: lower_bound keeps `hi = mid` on match; upper_bound keeps `lo = mid + 1`." | 8 | 4 | S | Partial |
| **AI** | AI explains: "off-by-one errors in binary search" with the three common bugs. AI generates: variant problems mapped to the right template. AI adapts: starts with basic search, then first/last occurrence, then search on answer, then rotated arrays. | 9 | 7 | M | Partial |

### 1F. Matrix Problems

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | 2D grid on canvas. For "rotate 90 degrees": show the transpose step (row becomes column with crossing arrows animation), then the reverse-each-row step. For "spiral order": a path traces the spiral with a colored trail, shrinking the boundaries each pass. For "search in sorted matrix": two pointers start at top-right corner, stepping left or down -- highlighted cells leave a staircase trail. | 9 | 9 | L | No |
| **SIMULATION** | Real-time: user picks matrix operation (rotate, spiral, search, set-zeroes). For rotation: matrix animates element-by-element into new positions. Parameters: matrix size (3x3 to 8x8), operation type, step speed. Metrics: elements moved, space used (in-place vs copy), pattern traced. | 8 | 9 | L | No |
| **PRACTICE** | Challenge 1: "Rotate this 4x4 matrix 90 degrees clockwise -- in place." Challenge 2: "Print spiral order." Challenge 3: "Search for value 15 in row-sorted, column-sorted matrix." Challenge 4: "Set matrix zeroes with O(1) extra space." Graded by: correctness + space complexity of approach. | 8 | 7 | L | No |
| **ASSESSMENT** | Quiz: "Which corner do you start from for staircase search in a sorted matrix?" Prediction: "After rotate step 1 (transpose), what does row 2 become?" Complexity: "Why is staircase search O(m+n) and not O(m*n)?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "In-place 90-degree rotation = ??? + ???" Back: "Transpose + reverse each row. Transpose: swap matrix[i][j] with matrix[j][i]. Reverse: standard array reverse on each row." | 7 | 4 | S | Partial |
| **AI** | AI explains coordinate transformations with before/after grids. AI generates: random matrices with specific search targets. AI adapts: starts with small 3x3, grows to larger matrices and harder operations. | 7 | 6 | M | Partial |

### 1G. Difference Arrays

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Two arrays shown: original and difference array. User applies a range update [L, R, +val]. The animation shows: only `diff[L] += val` and `diff[R+1] -= val` change (two cells flash). Then prefix-sum reconstruction rebuilds the original -- the entire range [L,R] rises by val. The "aha moment": applying 1000 range updates = 2000 array writes, not 1000*rangeLength writes. | 9 | 8 | M | No |
| **SIMULATION** | Real-time: user queues multiple range updates (click-drag on range, enter value). All updates apply to difference array (2 writes each). Then "reconstruct" button runs prefix sum. Parameters: array size, number of updates, update ranges/values. Metrics: total writes (difference vs naive), operation count comparison. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Apply these 3 range updates and reconstruct" (manual trace). Challenge 2: "Bus/flight booking problem -- how many passengers at each stop?" Challenge 3: "Corporate flight bookings" (LeetCode 1109). | 8 | 6 | M | No |
| **ASSESSMENT** | Quiz: "After `diff[2] += 5` and `diff[6] -= 5`, which indices are affected?" Prediction: "Given this difference array, what is the reconstructed original?" Complexity: "Q range updates on N elements: naive vs difference array?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Difference array: how to add +K to range [L, R]?" Back: "`diff[L] += K, diff[R+1] -= K`. Reconstruct with prefix sum. Total: O(N + Q) vs O(N * Q) naive." | 7 | 4 | S | Partial |
| **AI** | AI explains the "encode updates, decode once" paradigm. AI generates: booking/scheduling problems that map to difference arrays. AI adapts: 1D first, then 2D difference arrays for matrix range updates. | 7 | 6 | M | Partial |

---

## 2. STRINGS

### 2A. KMP (Knuth-Morris-Pratt)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Two rows: text (top) and pattern (bottom, slides underneath). Failure function array shown below pattern. Match: green highlight. Mismatch: red flash, then pattern slides right by `j - failure[j-1]` positions (not back to 0). The "aha moment": after a mismatch, the pattern does NOT go back to the start -- it jumps to where the longest proper prefix/suffix tells it. Show the naive approach (going back to start) as a ghost that gets left behind. | 10 | 9 | S | Yes (KMP exists, needs enhanced viz) |
| **SIMULATION** | Real-time: user enters text and pattern. Pattern slides under text with character-by-character comparison. Parameters: custom text/pattern, speed, toggle failure function overlay. Metrics: comparisons (KMP vs naive), shifts saved, failure function values, match positions found. | 9 | 8 | S | Yes (base exists) |
| **PRACTICE** | Challenge 1: "Build the failure function for 'ABABCABAB'" (fill in each cell). Challenge 2: "Find all occurrences of pattern in text" (verify your count matches KMP's). Challenge 3: "What is the failure function value at index 7 for 'AABAABAAA'?" (tricky overlap case). | 9 | 7 | M | No |
| **ASSESSMENT** | Quiz: "After mismatch at position j=5, failure[4]=2. Where does j jump to?" Prediction: "How many comparisons does KMP need for text='AAAAAAA', pattern='AAB'?" Complexity: "Why is KMP O(n+m) even though it has a while loop inside the for loop?" (amortized argument). | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "KMP failure function: failure[j] = ?" Back: "Length of longest proper prefix of pattern[0..j] that is also a suffix. Allows skipping ahead on mismatch. Build in O(m), search in O(n)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why does the failure function work?" with the prefix/suffix overlap visual. AI generates: tricky patterns with nested overlaps. AI adapts: starts with simple patterns (ABAB), then repetitive patterns (AAAAAB), then real-world patterns (DNA sequences). | 9 | 7 | M | Partial |

### 2B. Rabin-Karp

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Text shown as character array. A "hash window" slides across, showing the rolling hash computation: `hash = (hash - text[i-m] * h) * d + text[i]`. Hash values displayed above each window position. Pattern hash shown as a constant. Match: hashes equal (yellow flash) -> verify character-by-character (green). The "aha moment": the rolling hash reuses the previous hash, changing only the leaving and entering characters -- O(1) per slide instead of O(m) rehash. | 9 | 9 | M | No (Rabin-Karp algo exists but no rolling-hash visualization) |
| **SIMULATION** | Real-time: user enters text and pattern. Hash values shown numerically above each window. Parameters: text/pattern, hash base (d), modulus (q), speed. Metrics: hash computations, spurious hits (hash match but string mismatch), actual matches, comparison savings. | 8 | 8 | M | Partial |
| **PRACTICE** | Challenge 1: "Compute rolling hash for windows of size 3 in 'ABCDEF' with base=26, mod=101." Challenge 2: "Find all occurrences using Rabin-Karp." Challenge 3: "Generate a text and pattern that produces maximum spurious hits" (adversarial input). | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "Rolling hash removes char 'A' and adds char 'D'. Show the computation." Prediction: "For this text and pattern, how many spurious hits occur?" Complexity: "Average case vs worst case of Rabin-Karp -- what causes degradation?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Rabin-Karp rolling hash formula." Back: "`hash = (d * (hash - text[i-m] * h) + text[i]) mod q`. Average O(n+m). Worst O(nm) on many spurious hits. Good for multi-pattern search." | 7 | 4 | S | Partial |
| **AI** | AI explains modular arithmetic and why spurious hits happen. AI generates: texts with controlled spurious hit rates. AI adapts: starts with small alphabet, then ASCII, then discusses the birthday paradox for hash collisions. | 8 | 6 | M | Partial |

### 2C. Z-Algorithm

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | String displayed with Z-array building below it. For each position i, a bracket shows the longest substring starting at i that matches a prefix. The Z-box (window [L, R]) is highlighted as it extends. The "aha moment": when a new position falls inside an existing Z-box, the algorithm reuses previously computed Z-values instead of re-comparing. Show the reuse with a "copy" animation from the referenced Z-value. | 9 | 8 | M | No (Z-algo exists, needs viz layer) |
| **SIMULATION** | Real-time: user enters string. Z-array fills left to right, Z-box [L,R] shown as a sliding highlight. Parameters: input string, speed, toggle Z-box display. Metrics: comparisons made, comparisons saved by Z-box reuse, Z-array values. | 8 | 7 | M | Partial |
| **PRACTICE** | Challenge 1: "Compute Z-array for 'aabxaabxcaabxaabxay'" (step through). Challenge 2: "Use Z-algorithm for pattern matching: concatenate 'pattern$text' and find Z-values equal to pattern length." Challenge 3: "Find the longest substring that is both a prefix and a suffix." | 8 | 6 | M | No |
| **ASSESSMENT** | Quiz: "Z[5] = 3 for string 'aabxaab'. What does this mean?" Prediction: "The Z-box is [3,7]. Processing index 5. What Z-value can we reuse?" Complexity: "Prove Z-algorithm is O(n) using the Z-box monotonicity argument." | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Z[i] = ?" Back: "Length of longest substring starting at i that matches a prefix of the string. Z-box [L,R] tracks the rightmost match. If i is in [L,R], reuse Z[i-L]. O(n) guaranteed." | 7 | 4 | S | Partial |
| **AI** | AI explains Z-box reuse with the "looking in the mirror" analogy. AI generates: strings that exercise all Z-algorithm cases (extend, reuse, no reuse). AI adapts: basic Z-array, then pattern matching application, then suffix-based problems. | 8 | 6 | M | Partial |

### 2D. Trie

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree visualization on canvas (nodes = characters, edges = transitions). Words inserted one character at a time, path highlighted as it descends. New nodes branch off with a "grow" animation. The "aha moment": searching for a prefix lights up all words sharing that prefix simultaneously -- the shared-prefix structure becomes obvious. End-of-word markers (green dots) distinguish complete words from prefixes. | 10 | 9 | M | Yes (trie-operations exists, needs interactive features) |
| **SIMULATION** | Real-time: user types words to insert, types prefixes to search. Tree grows dynamically. Parameters: word list (editable), search query (live), highlight mode (exact match vs prefix match vs autocomplete). Metrics: nodes in trie, space used, search depth, autocomplete results count. | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Insert these 8 words and draw the trie" (drag-to-build). Challenge 2: "Implement autocomplete: given prefix 'app', list all matching words." Challenge 3: "Find the longest common prefix of all words in the trie." Challenge 4: "Delete 'apple' without breaking 'app'." | 9 | 8 | L | No |
| **ASSESSMENT** | Quiz: "How many nodes does a trie containing ['cat', 'car', 'card'] have?" Prediction: "After inserting 'test' into this trie, which nodes are new?" Complexity: "Why is trie search O(m) where m is the key length, regardless of n words?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Trie search time complexity and why." Back: "O(m) where m = key length. Each character maps to exactly one child pointer. Independent of number of stored keys. Space: O(ALPHABET * N * m) worst case." | 8 | 4 | S | Partial |
| **AI** | AI explains: "When to use trie vs hash map vs sorted array." AI generates: word lists that create interesting trie shapes. AI adapts: basic insert/search, then autocomplete, then word-break DP on tries, then compressed tries (Patricia). | 9 | 7 | M | Partial |

### 2E. Rolling Hash

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | String displayed with a sliding hash window. The formula `h = (h * base + char) % mod` shown step-by-step. For sliding: `h = (h - oldChar * basePow) * base + newChar) % mod`. Each arithmetic operation animates as a transformation of the hash value. The "aha moment": computing hash of a new window is O(1) work regardless of window length. | 8 | 7 | M | No |
| **SIMULATION** | Real-time: user enters string, adjusts window size. Hash values animate as window slides. Parameters: base, modulus, window size, string content. Metrics: hash value per position, collision count, distribution of hash values (histogram). | 7 | 7 | M | No |
| **PRACTICE** | Challenge 1: "Manually compute rolling hash for 3 consecutive windows." Challenge 2: "Find duplicate substrings of length K using rolling hash." Challenge 3: "Choose base and mod to minimize collisions for this input." | 7 | 6 | M | No |
| **ASSESSMENT** | Quiz: "Window slides from 'ABC' to 'BCD'. Show the hash update computation." Prediction: "For base=31, mod=1e9+7, what is hash('ABC')?" Complexity: "Why is rolling hash O(1) per slide? What is the preprocessing cost?" | 7 | 5 | S | No |
| **REVIEW** | Flashcard front: "Rolling hash: remove leftmost char, add rightmost char." Back: "`h = ((h - s[i] * pow) * base + s[i+k]) % mod`. Precompute `pow = base^(k-1) % mod`. O(1) per window." | 6 | 4 | S | Partial |
| **AI** | AI explains collision probability and the birthday paradox. AI generates: strings with controlled collision characteristics. AI adapts: single hash, then double hash, then polynomial hash for 2D. | 7 | 6 | M | Partial |

### 2F. Manacher's Algorithm (Palindromes)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | String shown with inserted '#' separators (transformed string). P-array builds below. For each center, the palindrome radius expands symmetrically -- both ends highlight simultaneously like a mirror. The "aha moment": when a new center falls inside a known palindrome, the algorithm mirrors a previously computed P-value (shown as a reflection arrow), skipping redundant comparisons. The center-right boundary is a sliding window that only moves forward. | 10 | 9 | L | No |
| **SIMULATION** | Real-time: user enters string. Transformed string shows '#' insertions. P-array fills with palindrome radii. Mirror point and center-right boundary animate. Parameters: input string, speed, show/hide transformed string. Metrics: comparisons saved by mirroring, longest palindrome found, all palindromic substrings listed. | 9 | 9 | L | No |
| **PRACTICE** | Challenge 1: "Find the longest palindromic substring of 'babad'" (trace Manacher's). Challenge 2: "Count all palindromic substrings" (use P-array). Challenge 3: "Why does the '#' insertion handle even-length palindromes?" | 8 | 7 | L | No |
| **ASSESSMENT** | Quiz: "Center is at index 5, right boundary is 8. For index 6, what P-value can we reuse?" Prediction: "After processing index 7, where is the new center-right boundary?" Complexity: "Prove Manacher's is O(n) using the right-boundary argument." | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Manacher's key invariant." Back: "Center C with right boundary R. For i < R, use mirror: P[i] >= min(P[mirror], R-i). The right boundary R only moves forward -> O(n) total." | 8 | 4 | S | Partial |
| **AI** | AI explains the mirror property with geometric visualization. AI generates: strings with nested palindromes, even/odd mix. AI adapts: brute force first, then expand-around-center, then Manacher's. | 9 | 7 | L | Partial |

---

## 3. LINKED LISTS

### 3A. Reverse Linked List

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Nodes displayed as boxes with arrows. Three pointers shown: `prev` (red), `curr` (blue), `next` (green). Each step: (1) `next = curr.next` (green arrow saves reference), (2) `curr.next = prev` (arrow flips with rotation animation), (3) advance pointers. The "aha moment": the arrow-flip animation where each link rotates 180 degrees, and after all flips, the entire list reads backward. | 9 | 9 | M | No (no linked list viz yet) |
| **SIMULATION** | Real-time: user builds list by clicking "add node." Reverse plays forward step by step or all at once. Parameters: list length (1-10), playback speed, toggle pointer labels. Metrics: pointer moves per step, total operations, current state of prev/curr/next. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Reverse this 5-node list -- fill in pointer states at each step" (table). Challenge 2: "Reverse in groups of K" (must identify group boundaries). Challenge 3: "Reverse between positions L and R only" (partial reverse). | 9 | 7 | M | No |
| **ASSESSMENT** | Quiz: "After step 3 of reversing [1->2->3->4->5], what do prev, curr, next point to?" Prediction: "Draw the list state after reversing the first 3 nodes." Complexity: "Iterative reverse is O(n) time O(1) space. Why is recursive reverse O(n) space?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Three steps to reverse a linked list node." Back: "(1) `next = curr.next` (save), (2) `curr.next = prev` (flip), (3) `prev = curr; curr = next` (advance). O(n) time, O(1) space." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why do we need the `next` temp variable?" AI generates: lists with different lengths, variant problems (reverse pairs, reverse K-groups). AI adapts: iterative first, then recursive, then in-place with constraints. | 8 | 6 | M | Partial |

### 3B. Cycle Detection (Floyd's Tortoise and Hare)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Linked list with a cycle drawn as nodes in a rho (p) shape -- tail connects back to a mid-node. Tortoise (turtle icon, 1 step) and hare (rabbit icon, 2 steps) animate along the list. The "aha moment": the two pointers orbiting inside the cycle, getting closer each step, then meeting. Phase 2: reset tortoise to head, both move 1 step -- they meet at cycle entry (shown as a "pinch point"). | 10 | 10 | M | Partial (floyd-cycle exists, needs linked-list visual) |
| **SIMULATION** | Real-time: user builds list, then drags the tail to create a cycle to any earlier node. Tortoise and hare animate. Parameters: list length, cycle entry point (draggable), speed. Metrics: steps to meeting point, steps to find entry, cycle length, tail length. | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Does this list have a cycle? Where do the pointers meet?" Challenge 2: "Find the cycle entry point" (phase 2). Challenge 3: "Find the cycle length." Challenge 4: "Find duplicate number in array" (implicit linked list via Floyd's). | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Why does fast pointer move 2 steps, not 3?" (closing distance = 1 per step). Prediction: "Tortoise at node 3, hare at node 5, cycle length 4. How many more steps to meeting?" Complexity: "Prove Floyd's uses O(1) space and O(n) time." | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Floyd's cycle detection: two phases." Back: "Phase 1: slow (1 step), fast (2 steps). If they meet, cycle exists. Phase 2: reset slow to head, both move 1 step. They meet at cycle entry. O(n) time, O(1) space." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Mathematical proof of why Phase 2 finds the entry" (modular arithmetic on distances). AI generates: lists with cycles at various positions. AI adapts: detection first, then entry finding, then the implicit linked list variant (find duplicate number). | 9 | 8 | M | Partial |

### 3C. Merge Sorted Lists

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Two horizontal linked lists, one above the other. A third "result" list builds below. Two pointers (one per list) compare heads. The smaller value detaches from its list (node slides down to result list with animation) and appends to the result. The "aha moment": when one list is exhausted, the entire remaining list "swings down" to attach to the result -- no need to process individually. | 9 | 9 | M | No |
| **SIMULATION** | Real-time: user builds two sorted lists. Merge plays with step-by-step comparisons. Parameters: list sizes, values (auto-sorted), speed, toggle "in-place" vs "new list" mode. Metrics: comparisons, moves, final list length, merge path (which list each element came from). | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Merge [1->3->5] and [2->4->6]" (trace). Challenge 2: "Merge K sorted lists using a min-heap." Challenge 3: "Merge two lists in-place without extra nodes." | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "List 1 head = 3, List 2 head = 2. Which moves to result?" Prediction: "After 4 merge steps, what does the result list look like?" Complexity: "Merge two lists of size m and n: time? Why?" | 7 | 5 | S | No |
| **REVIEW** | Flashcard front: "Merge two sorted linked lists: invariant." Back: "Always pick the smaller head. Append to result tail. When one list empty, append all of the other. O(m+n) time, O(1) extra space if in-place." | 7 | 4 | S | Partial |
| **AI** | AI explains in-place vs new-node merge tradeoffs. AI generates: lists with various overlap patterns. AI adapts: 2-list merge, then K-list merge, then merge sort on linked lists. | 7 | 6 | M | Partial |

### 3D. Fast-Slow Pointers (General)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Linked list with slow (1-step) and fast (2-step) pointers. Three applications shown as tabs: (1) Find middle (fast reaches end, slow is at middle), (2) Detect cycle (covered in 3B), (3) Find nth from end (fast starts n ahead, both move 1 step). The "aha moment" for find-middle: fast pointer reaches the end in n/2 steps, and at that exact moment slow has taken n/2 steps -- landing on the middle. No need to count length first. | 9 | 8 | M | Partial (floyd-cycle variant) |
| **SIMULATION** | Real-time: user picks application (middle / nth-from-end / cycle). Pointers animate at their respective speeds. Parameters: list length, n (for nth-from-end), cycle point (for detection). Metrics: slow position, fast position, steps taken, result. | 8 | 7 | M | Partial |
| **PRACTICE** | Challenge 1: "Find the middle node of a 7-node list." Challenge 2: "Find 3rd from end." Challenge 3: "Check if palindrome" (find middle, reverse second half, compare). | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "Fast pointer reaches end after 5 steps. Where is slow?" Prediction: "List has 8 nodes. Which node is the middle?" Complexity: "All fast-slow pointer problems are O(n). Why?" | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Three uses of fast-slow pointers on linked lists." Back: "(1) Find middle: slow=1 fast=2, when fast ends, slow is middle. (2) Cycle detection: same speeds, meeting proves cycle. (3) Nth from end: fast starts N ahead, both go 1." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Why does the 2x speed ratio specifically give us the middle?" AI generates: variant problems for each application. AI adapts: one application at a time, then combination problems (palindrome check = middle + reverse + compare). | 8 | 6 | M | Partial |

---

## 4. STACK / QUEUE

### 4A. Monotonic Stack

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array on top, stack visualization below (vertical stack of elements). As each element is processed right-to-left, the stack pops smaller elements (they "fall off" the stack with fade animation) and pushes the current element. A result array shows "next greater element" filling in from right to left. The "aha moment": elements don't just get pushed/popped randomly -- the stack maintains a strictly decreasing order (monotonic property), visualized as a staircase. | 10 | 9 | M | Yes (monotonic-stack exists, needs enhanced stack viz) |
| **SIMULATION** | Real-time: user edits array values. Stack operations animate (push = slide up, pop = slide off). Parameters: array values, direction (left-to-right or right-to-left), variant (next greater / next smaller / previous greater / previous smaller). Metrics: total pushes, total pops, amortized analysis counter (each element pushed once, popped once = O(2n)). | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Find next greater element for [4, 5, 2, 25]" (trace stack). Challenge 2: "Largest rectangle in histogram." Challenge 3: "Daily temperatures." Challenge 4: "Stock span problem." Graded by stack state correctness at each step. | 9 | 8 | M | No |
| **ASSESSMENT** | Quiz: "Stack contains [7, 5, 3]. Next element is 6. What gets popped?" Prediction: "After processing index 4, what is in the stack?" Complexity: "Why is monotonic stack O(n) even though there's a while loop? Show the amortized argument." | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Monotonic stack amortized analysis." Back: "Each element is pushed once and popped at most once. Total operations = 2n. O(n) amortized. The while loop doesn't make it O(n^2) because the total pops across ALL iterations is at most n." | 8 | 4 | S | Partial |
| **AI** | AI explains: "When do you use monotonic stack vs brute force?" AI generates: arrays that exercise different pop patterns. AI adapts: next greater element first, then histogram (2D application), then trapping rain water (two monotonic stacks). | 9 | 7 | M | Partial |

### 4B. Next Greater Element (NGE)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array elements shown as vertical bars (heights proportional to values). For each element, an arrow points right to its NGE. Bars without an NGE are marked with a red "X" at their right edge. Stack visualization runs in sync -- elements enter and leave the stack, and every time a pop happens, the arrow from the popped element to the current element draws on screen. | 9 | 9 | S | Yes (monotonic-stack IS next-greater-element, same file) |
| **SIMULATION** | Real-time: user edits bar heights. Arrows draw dynamically as stack resolves. Parameters: array values, direction (next vs previous, greater vs smaller), circular variant toggle. Metrics: NGE array, stack contents at each step, arrows drawn. | 8 | 8 | S | Partial |
| **PRACTICE** | Challenge 1: "Find NGE for [4, 5, 2, 25, 7, 8]." Challenge 2: "Next Greater Element II (circular array)." Challenge 3: "Next Smaller Element." | 8 | 7 | S | No |
| **ASSESSMENT** | Quiz: "For circular array [3, 1, 2, 4], what is NGE for element at index 2?" Prediction: "Stack state after processing 5 elements." | 7 | 5 | S | No |
| **REVIEW** | Flashcard front: "NGE variants and which direction to scan." Back: "Next greater: scan right-to-left, pop smaller. Next smaller: scan right-to-left, pop larger. Previous greater: scan left-to-right, pop smaller. All O(n)." | 7 | 4 | S | Partial |
| **AI** | AI generates: all 4 variants from same array for comparison. AI adapts: linear first, then circular, then 2D (next greater in matrix). | 7 | 6 | S | Partial |

### 4C. LRU Cache

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Split view: left side shows doubly-linked list (nodes = cache entries, most recent at head). Right side shows hash map (keys -> node pointers, shown as arrows crossing to the linked list). Operations animate: `get(key)` -- hash lookup highlights key, arrow follows to node, node slides to head. `put(key, val)` when full -- tail node detaches (eviction animation), new node inserts at head. The "aha moment": both operations are O(1) because the hashmap gives O(1) lookup and the doubly-linked list gives O(1) removal/insertion. | 10 | 10 | M | Yes (lru-cache exists, needs split-view viz) |
| **SIMULATION** | Real-time: user sends get/put operations via command bar ("get 3", "put 5 hello"). List and hashmap update live. Parameters: capacity (1-8), operation sequence (editable), speed. Metrics: cache hits, cache misses, eviction count, hit rate percentage, current occupancy. | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Execute this sequence on LRU(3): put(1,a), put(2,b), put(3,c), get(2), put(4,d). What gets evicted?" Challenge 2: "Implement LRU cache from scratch -- fill in the move_to_front and evict methods." Challenge 3: "Design LFU cache" (least frequently used variant). | 10 | 9 | L | Partial |
| **ASSESSMENT** | Quiz: "Capacity=2, ops=[put(1,a), put(2,b), get(1), put(3,c)]. What is evicted?" Prediction: "After 5 operations, what is the order in the linked list?" Complexity: "Why is OrderedDict (Python) cheating for LRU interviews?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "LRU Cache: two data structures and why each." Back: "HashMap: O(1) key lookup. Doubly-Linked List: O(1) removal (given node pointer) + O(1) insert at head. Together: get = O(1), put = O(1), evict = O(1)." | 9 | 4 | S | Partial |
| **AI** | AI explains: "Why doubly-linked and not singly-linked?" (need O(1) removal of arbitrary node). AI generates: operation sequences that stress eviction patterns. AI adapts: LRU first, then LFU, then TTL-based cache, then multi-tier cache. | 9 | 7 | M | Partial |

### 4D. Min Stack

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Two parallel stacks side by side: main stack (left) and min-tracker stack (right). Every push adds to both: main gets the value, min-tracker gets `min(value, current_min)`. Pop removes from both. The "aha moment": `getMin()` is always just peeking at the min-tracker top -- no scanning needed. Animation shows why a single variable fails (what happens when you pop the minimum?). | 9 | 8 | M | No |
| **SIMULATION** | Real-time: user pushes/pops values. Both stacks animate in sync. Parameters: operation sequence, speed. Metrics: main stack contents, min-stack contents, current minimum, space overhead (2x). | 8 | 7 | M | No |
| **PRACTICE** | Challenge 1: "Trace both stacks for: push(5), push(3), push(7), pop(), getMin()." Challenge 2: "Implement with O(1) extra space" (using 2*value - min encoding). Challenge 3: "Design a min-queue" (harder variant). | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "Main stack [5, 3, 7]. What is the min-stack?" Prediction: "After pop(), what is the new minimum?" Complexity: "All operations O(1). What is the space tradeoff?" | 7 | 5 | S | No |
| **REVIEW** | Flashcard front: "Min Stack: how to maintain getMin() in O(1)." Back: "Auxiliary stack stores running minimum. Push: aux.push(min(val, aux.top())). Pop: pop both. GetMin: aux.top(). Space: O(n) extra." | 7 | 4 | S | Partial |
| **AI** | AI explains the O(1) space variant (2*val - min encoding). AI generates: push/pop sequences with tricky minimum transitions. AI adapts: two-stack version, then O(1) space, then min-queue (two stacks simulating queue). | 8 | 6 | M | Partial |

---

## 5. TREES

### 5A. DFS/BFS Traversals

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree rendered with Reingold-Tilford layout. Four traversal tabs: Inorder, Preorder, Postorder, Level-order. Each node lights up in visit order with a number badge. For DFS: a "call stack" sidebar grows/shrinks showing recursive calls. For BFS: a queue bar at the bottom shows nodes waiting. The "aha moment": running all 4 traversals on the same tree side-by-side -- same tree, 4 different orderings -- and seeing the pattern (inorder = sorted for BST, preorder = serialization order, etc.). | 10 | 9 | S | Yes (tree-traversals exists with full step recording) |
| **SIMULATION** | Real-time: user builds tree by clicking to add nodes. Traversal animates with highlighted path. Parameters: tree shape (random, complete, skewed), traversal type, speed. Metrics: visit order array, stack/queue depth, current recursion depth, nodes visited. | 9 | 9 | S | Yes |
| **PRACTICE** | Challenge 1: "Given this tree, write the inorder traversal output" (fill in array). Challenge 2: "Reconstruct tree from inorder + preorder." Challenge 3: "Iterative inorder using explicit stack." Challenge 4: "Morris traversal (O(1) space)" as advanced challenge. | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Inorder of this BST is [1,3,5,7,9]. Is this always sorted? Why?" Prediction: "Preorder visits root first. What is preorder of this 5-node tree?" Complexity: "All traversals are O(n). DFS uses O(h) stack space. What is h for balanced vs skewed?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Inorder: Left, ____, Right. Preorder: ____, Left, Right. Postorder: Left, Right, ____." Back: "Inorder: Left, Root, Right (sorted for BST). Preorder: Root, Left, Right (used for serialization). Postorder: Left, Right, Root (used for deletion, expression eval)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Which traversal to use when?" with decision tree. AI generates: trees with properties that make one traversal more interesting. AI adapts: recursive first, then iterative with explicit stack, then Morris (threaded). | 9 | 7 | M | Partial |

### 5B. BST Operations

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | BST on canvas. Insert: new value drops from top, bounces left/right at each comparison, lands in correct position with a "leaf grow" animation. Search: path from root highlights green (found) or red (not found). Delete: three cases animated separately -- (1) leaf: simply vanishes, (2) one child: child slides up to replace parent, (3) two children: inorder successor glows, swaps value, then deletes from original position. | 10 | 10 | M | Yes (bst.ts exists with step recording) |
| **SIMULATION** | Real-time: user inserts/deletes/searches values via input. Tree restructures with animation. Parameters: values to insert (comma-separated), search target, speed. Metrics: tree height, balance factor per node, comparisons per operation, inorder output. | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Insert [5,3,7,1,4,6,8] into BST and show final tree." Challenge 2: "Delete node 5 (root with two children)." Challenge 3: "Insert 10 random values -- is the tree balanced? What is the height?" | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Insert order [3,1,4,1,5] into BST. What is the tree shape?" Prediction: "After deleting node with 2 children, which node replaces it?" Complexity: "BST operations are O(h). Why is h = O(log n) for balanced but O(n) for skewed?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "BST delete: three cases." Back: "(1) Leaf: remove. (2) One child: replace with child. (3) Two children: replace value with inorder successor (smallest in right subtree), then delete successor. All O(h)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why inorder successor and not predecessor?" AI generates: insertion sequences that produce specific tree shapes. AI adapts: basic BST, then AVL rotations, then red-black tree rules. | 9 | 7 | M | Partial |

### 5C. Lowest Common Ancestor (LCA)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree on canvas. User selects two nodes (click). Paths from root to each node highlight in two different colors. Where the paths diverge, the last shared node pulses -- that is the LCA. Three approaches shown as tabs: (1) Path comparison (store both paths, find last common), (2) Recursive (node is LCA if left subtree has one target and right has the other), (3) Binary lifting (Euler tour + sparse table). | 10 | 9 | L | No |
| **SIMULATION** | Real-time: user clicks any two nodes, LCA highlights instantly with animated paths. Parameters: tree shape, node selection, algorithm variant. Metrics: path lengths, LCA depth, comparisons (recursive variant), preprocessing time (binary lifting). | 9 | 9 | L | No |
| **PRACTICE** | Challenge 1: "Find LCA of nodes 4 and 7 in this BST" (use BST property). Challenge 2: "Find LCA in a general binary tree (not BST)." Challenge 3: "Multiple LCA queries on same tree -- which method is fastest?" | 9 | 8 | L | No |
| **ASSESSMENT** | Quiz: "In BST, if both nodes < root, LCA is in which subtree?" Prediction: "Root's left subtree contains node A, right subtree contains node B. What is LCA?" Complexity: "Single LCA query: O(n). K queries with binary lifting: O(n log n + K log n). Why?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "LCA of p, q in binary tree: recursive approach." Back: "If root == p or root == q, return root. Recurse left, right. If both non-null, root is LCA. If one null, return the other. O(n) per query." | 8 | 4 | S | Partial |
| **AI** | AI explains: "BST vs general tree LCA -- why BST is easier." AI generates: trees with LCA at various depths. AI adapts: BST LCA (use value comparison), then general tree recursive, then binary lifting for multiple queries. | 9 | 7 | L | Partial |

### 5D. Tree Diameter

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree on canvas. The diameter path highlights as a thick colored line -- the longest path between any two nodes. At each node, the algorithm computes "left height + right height" as a candidate diameter. The "aha moment": the diameter does NOT have to pass through the root. Animation shows a case where the longest path is entirely within a subtree, and the global max updates. | 9 | 8 | M | No |
| **SIMULATION** | Real-time: user builds tree, diameter path auto-highlights. Height values shown at each node. Parameters: tree shape, speed. Metrics: diameter length, diameter path (node sequence), height per node, candidate diameters at each node. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Find diameter of this tree" (trace the DFS). Challenge 2: "The diameter path -- list the nodes." Challenge 3: "Does adding a leaf change the diameter? Where?" | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "Root has left height 3, right height 2. Is diameter 5?" (not necessarily -- could be in a subtree). Prediction: "After adding node X, does the diameter change?" Complexity: "Why is single-pass DFS O(n) sufficient for diameter?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Tree diameter algorithm." Back: "DFS returning height. At each node: diameter_candidate = left_height + right_height. Track global max. Return max(left, right) + 1. O(n) single pass." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Diameter vs height -- what is the difference?" AI generates: trees where diameter path does/does not pass through root. AI adapts: basic diameter, then diameter with edge weights, then furthest node pair (two BFS). | 8 | 6 | M | Partial |

### 5E. Tree DP

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree on canvas. DP values bubble up from leaves to root with a "fill" animation. Example: Maximum Independent Set -- each node shows two values: dp[v][0] (not selected) and dp[v][1] (selected). Selected nodes glow gold, unselected are gray. The "aha moment": the DP table lives ON the tree, not in a separate array. Values compute bottom-up, exactly like postorder traversal. | 9 | 9 | L | No |
| **SIMULATION** | Real-time: user builds tree, picks DP problem (max independent set, minimum vertex cover, tree coloring). DP values compute with animation. Parameters: tree shape, DP problem type, speed. Metrics: DP values per node, optimal solution highlighted, comparison with brute force count. | 9 | 9 | L | No |
| **PRACTICE** | Challenge 1: "Compute max independent set for this tree" (fill in dp values). Challenge 2: "Minimum vertex cover." Challenge 3: "House robber on tree" (can't rob parent and child). | 9 | 8 | L | No |
| **ASSESSMENT** | Quiz: "Leaf node: dp[leaf][0] = ?, dp[leaf][1] = ?" Prediction: "Root's dp values given children's values." Complexity: "Tree DP is O(n). Why doesn't the two-state DP double the complexity?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Tree DP: Max Independent Set recurrence." Back: "`dp[v][0] = sum(max(dp[c][0], dp[c][1]) for c in children)`. `dp[v][1] = val[v] + sum(dp[c][0] for c in children)`. Answer: max(dp[root][0], dp[root][1])." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Tree DP = postorder DFS + DP recurrence." AI generates: trees that exercise different optimal structures. AI adapts: basic tree DP, then re-rooting technique, then tree DP with edge values. | 9 | 7 | L | Partial |

### 5F. Serialize / Deserialize

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Split view: tree visualization (left) and string representation (right). Serialize: preorder traversal writes values and null markers. Each node visit appends to the string with animation. Deserialize: string consumed left-to-right, tree grows as nodes are created. The "aha moment": the null markers are what make reconstruction possible without ambiguity -- show a case where two different trees produce the same preorder without nulls, but different preorders with nulls. | 9 | 8 | M | No |
| **SIMULATION** | Real-time: user builds tree, clicks "serialize" to see string, edits string, clicks "deserialize" to see tree. Parameters: encoding format (preorder+null, BFS+null, parenthesized). Metrics: string length, null markers count, compression ratio. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Serialize this tree using preorder with null markers." Challenge 2: "Given this string, reconstruct the tree." Challenge 3: "Serialize using BFS level-order. What changes?" | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "Why are null markers necessary for unique reconstruction?" Prediction: "Given preorder '1,2,null,null,3,4,null,null,5,null,null', draw the tree." Complexity: "Serialize: O(n). Deserialize: O(n). String length: O(n)." | 8 | 5 | S | No |
| **REVIEW** | Flashcard front: "Serialize binary tree: what encoding ensures unique reconstruction?" Back: "Preorder + null markers. Example: [1,2,null,null,3]. Null marks where a child does not exist. Without nulls, preorder alone is ambiguous." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Why preorder + nulls works but inorder + nulls doesn't." AI generates: trees that are ambiguous without null markers. AI adapts: DFS serialization, then BFS, then compressed representations. | 8 | 6 | M | Partial |

### 5G. Binary Lifting

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Tree with a precomputed table shown as a 2D grid: `up[v][k]` = 2^k-th ancestor of v. Table fills with "jump" arrows: 1-step ancestor, then 2-step (jump of two 1-steps), then 4-step (jump of two 2-steps). For LCA query: both nodes "binary-lift" upward in decreasing powers of 2 until they meet. The "aha moment": powers of 2 can represent any distance (binary representation), so O(log n) jumps suffice for any ancestor query. | 9 | 9 | L | No |
| **SIMULATION** | Real-time: user selects node, sees ancestor jumps. LCA query: select two nodes, watch lifting. Parameters: tree shape, query nodes. Metrics: jump table values, number of jumps for LCA, preprocessing time. | 8 | 8 | L | No |
| **PRACTICE** | Challenge 1: "Build the binary lifting table for this tree." Challenge 2: "Find LCA(u, v) using binary lifting." Challenge 3: "Find kth ancestor of node v." | 8 | 7 | L | No |
| **ASSESSMENT** | Quiz: "up[v][3] means the ____-th ancestor of v." Prediction: "up[5][1] = 3, up[3][1] = 1. What is up[5][2]?" Complexity: "Preprocessing: O(n log n). Each query: O(log n). Why?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Binary lifting: up[v][k] = ?" Back: "`up[v][k] = up[up[v][k-1]][k-1]`. The 2^k ancestor = 2^(k-1) ancestor of the 2^(k-1) ancestor. Preprocessing: O(n log n). Query: O(log n). Space: O(n log n)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why powers of 2? Binary representation of distances." AI generates: deep trees where binary lifting saves many jumps. AI adapts: kth ancestor first, then LCA via binary lifting, then path queries. | 8 | 7 | L | Partial |

---

## 6. GRAPHS

### 6A. BFS/DFS Patterns

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Graph on canvas (force-directed layout). BFS: wavefront animation -- all neighbors at distance 1 glow first (ring 1), then distance 2 (ring 2), like ripples in water. Queue shown at bottom. DFS: single path goes deep first, then backtracks with fading trail. Stack shown at side. The "aha moment": running BFS and DFS simultaneously on same graph (split screen) -- BFS explores broadly, DFS explores deeply. Same graph, same start, different visit orders. | 10 | 10 | S | Yes (BFS, DFS, DFS-iterative all exist with step recording) |
| **SIMULATION** | Real-time: user builds graph (click to add nodes, drag to add edges), clicks start node. BFS/DFS animate. Parameters: start node, graph type (directed/undirected), weighted/unweighted, speed. Metrics: visit order, discovery time, finish time (DFS), distance from source (BFS), parent tree (shown as bold edges). | 9 | 10 | S | Yes |
| **PRACTICE** | Challenge 1: "Run BFS from node A. What is the visit order?" Challenge 2: "Run DFS and classify edges (tree, back, forward, cross)." Challenge 3: "Find shortest path in unweighted graph" (BFS application). Challenge 4: "Detect cycle in directed graph using DFS coloring." | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "BFS from node A visits B before C. What does this mean about distances?" Prediction: "DFS is at node D with stack [A, B, D]. Next neighbor is visited -- what happens?" Complexity: "BFS/DFS: O(V + E). Why + and not *?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "BFS uses ____, DFS uses ____. BFS finds ____ paths in unweighted graphs." Back: "BFS: queue. DFS: stack (or recursion). BFS finds shortest paths. DFS finds connected components, topological order, cycle detection." | 8 | 4 | S | Partial |
| **AI** | AI explains: "When to use BFS vs DFS?" with decision tree. AI generates: graphs that show different behavior under BFS vs DFS. AI adapts: basic traversal, then applications (shortest path, cycle detection, topological sort). | 9 | 7 | M | Partial |

### 6B. Multi-Source BFS

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Grid/graph with multiple source nodes (highlighted in different colors). All sources are enqueued at distance 0 simultaneously. BFS wavefronts expand from ALL sources at once, each in its own color. Where wavefronts meet, boundaries form (Voronoi-like). The "aha moment": instead of running BFS from each source separately (K * O(V+E)), enqueue all sources at once and run a single BFS (O(V+E)). The multi-wavefront animation makes this visceral. | 10 | 10 | M | No |
| **SIMULATION** | Real-time: user places multiple sources on grid. Wavefronts expand simultaneously with per-source coloring. Parameters: grid size, number of sources, obstacle placement. Metrics: distance from nearest source per cell, region sizes, wavefront collision boundaries. | 9 | 10 | M | No |
| **PRACTICE** | Challenge 1: "Rotten oranges: 3 rotten oranges, when do all oranges rot?" Challenge 2: "01-Matrix: find distance of each cell to nearest 0." Challenge 3: "Walls and gates: fill each empty room with distance to nearest gate." | 9 | 9 | M | No |
| **ASSESSMENT** | Quiz: "Why is multi-source BFS O(V+E) and not O(K*(V+E))?" Prediction: "3 sources at corners of 5x5 grid. After 2 BFS rounds, which cells are reached?" Complexity: "Each cell is visited once regardless of source count. Why?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Multi-source BFS: how to handle K sources efficiently." Back: "Enqueue ALL sources at distance 0 before BFS starts. Run standard BFS once. Each cell gets distance to its nearest source. O(V+E) total, not O(K*(V+E))." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Multi-source BFS as a supernode trick." AI generates: grid problems with varying source counts and obstacles. AI adapts: 2-source, then K-source, then multi-source with different "types" of sources. | 9 | 8 | M | Partial |

### 6C. Topological Sort

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | DAG (directed acyclic graph) on canvas. Kahn's algorithm: nodes with in-degree 0 glow and slide to a "sorted output" bar at the bottom. As each node is removed, edges fade and neighbor in-degrees decrement. The "aha moment": the output bar fills left-to-right with a valid dependency order. For DFS variant: DFS runs, and nodes are pushed to output in post-order (reverse finish time). | 10 | 9 | S | Yes (two variants exist: topological-sort.ts + topological-sort-kahn.ts) |
| **SIMULATION** | Real-time: user builds DAG. Both Kahn's and DFS-based topo-sort available. Parameters: graph structure, algorithm variant, speed. Metrics: in-degree table, queue contents (Kahn's), finish times (DFS), output order, cycle detection flag. | 9 | 9 | S | Yes |
| **PRACTICE** | Challenge 1: "Run Kahn's on this DAG and produce the topological order." Challenge 2: "Course schedule: given prerequisites, find a valid course order." Challenge 3: "Is a topological order unique? When?" Challenge 4: "Detect if a directed graph has a cycle using Kahn's." | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Node A has in-degree 0. After removing A, which nodes' in-degrees change?" Prediction: "After 3 removals, what remains in the queue?" Complexity: "Topological sort is O(V+E). Why?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Kahn's algorithm for topological sort: key data structure." Back: "Queue of nodes with in-degree 0. Dequeue node, add to output, decrement neighbors' in-degrees. If neighbor hits 0, enqueue it. Cycle exists if output.length < V." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Kahn's vs DFS topo-sort -- when to prefer which." AI generates: DAGs with multiple valid orderings. AI adapts: basic topo-sort, then course scheduling, then parallel task scheduling (levels). | 9 | 7 | M | Partial |

### 6D. Dijkstra's Algorithm

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Weighted graph on canvas. Priority queue shown as a min-heap sidebar. Current node glows, edges being relaxed flash yellow, updated distances animate (old value crosses out, new value appears). Shortest path tree grows edge by edge. The "aha moment": when a node is "finalized" (extracted from PQ), its distance is guaranteed optimal -- show this by comparing all possible paths and confirming the extracted distance is the minimum. | 10 | 10 | M | Yes (dijkstra.ts exists with step recording) |
| **SIMULATION** | Real-time: user builds weighted graph, picks source. Dijkstra runs with priority queue visualization. Parameters: source node, graph structure, weights (editable), speed. Metrics: distance table, parent table, priority queue contents, relaxation count, shortest path tree edges. | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Run Dijkstra from node A and find shortest paths to all nodes." Challenge 2: "Find shortest path from A to F and trace it." Challenge 3: "Why does Dijkstra fail with negative weights? Show a counterexample." | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "PQ extracts node C with distance 5. Is this final?" (Yes if no negative weights.) Prediction: "After relaxing edge (B, D, weight=3), new dist[D] = ?" Complexity: "Dijkstra with binary heap: O((V+E) log V). Why? What about Fibonacci heap?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Dijkstra's invariant." Back: "Every extracted node has its final shortest distance. Greedy: always process the closest unfinalized node. Requires non-negative weights. O((V+E) log V) with binary heap." | 9 | 4 | S | Partial |
| **AI** | AI explains: "Dijkstra vs Bellman-Ford vs Floyd-Warshall -- decision tree." AI generates: graphs with/without negative weights to contrast algorithms. AI adapts: basic Dijkstra, then Dijkstra + reconstruction, then bidirectional Dijkstra, then A*. | 9 | 7 | M | Partial |

### 6E. Bellman-Ford

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Weighted graph (including negative edges, colored red). V-1 rounds of edge relaxation animate. Each round, all edges flash and distances update. The "aha moment": round V detects negative cycles -- if any distance still decreases, a negative cycle exists. Show the cycle pulsing red with a "infinite savings" animation (distance decreasing forever). | 10 | 9 | M | Yes (bellman-ford.ts exists) |
| **SIMULATION** | Real-time: user builds weighted graph with negative edges. V-1 rounds animate. Parameters: source, graph structure, weights (negative allowed), speed. Metrics: distance table per round, relaxations per round, negative cycle detection (round V). | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Run Bellman-Ford from A. Show distances after each round." Challenge 2: "Add edge that creates a negative cycle. What happens?" Challenge 3: "Cheapest flights within K stops" (limited Bellman-Ford). | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "After round 2, dist[D] = 7. Can round 3 change it?" Prediction: "Graph has 5 nodes. After round 4, is it over?" Complexity: "O(V*E). Why V-1 rounds? What does round V tell us?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Bellman-Ford: number of rounds and why." Back: "V-1 rounds: shortest path has at most V-1 edges. Round V: check for negative cycles. If any distance still decreases, negative cycle exists. O(V*E)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why V-1 rounds is sufficient" (longest simple path has V-1 edges). AI generates: graphs with/without negative cycles. AI adapts: basic Bellman-Ford, then SPFA optimization, then K-limited variant. | 9 | 7 | M | Partial |

### 6F. MST (Kruskal/Prim)

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Weighted undirected graph. Kruskal's: edges sorted by weight in a sidebar list. Each edge is tried -- if it connects two different components (Union-Find colors), it is added (edge thickens, components merge colors). If it would create a cycle, it is rejected (red X flash). Prim's: starting from a node, the "frontier" of candidate edges highlights, cheapest edge crosses the cut (MST grows outward like a growing tree). The "aha moment": Kruskal's processes globally cheapest edges; Prim's grows from a node -- both produce the SAME MST (for unique weights). | 10 | 10 | M | Yes (kruskal.ts + prims.ts exist) |
| **SIMULATION** | Real-time: user builds weighted graph. Toggle between Kruskal and Prim. MST builds with animation. Parameters: graph structure, weights, starting node (Prim), speed. Metrics: MST total weight, edges added/rejected, Union-Find component count (Kruskal), priority queue (Prim). | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Run Kruskal's on this graph. List edges in order of addition." Challenge 2: "Run Prim's from node A. Show priority queue at each step." Challenge 3: "Add an edge that changes the MST. What is the new MST weight?" | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Edge (A,B,3) connects components {A,C} and {B,D,E}. Include or reject?" Prediction: "Sorted edge list: [(A,B,1), (C,D,2), (A,C,3), (B,D,4), (A,D,5)]. Which edges are in MST?" Complexity: "Kruskal: O(E log E). Prim with binary heap: O((V+E) log V). When is which faster?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Kruskal vs Prim: greedy strategy." Back: "Kruskal: global cheapest edge that doesn't create cycle (Union-Find). Prim: cheapest edge crossing the cut from MST to non-MST (priority queue). Both O(E log V)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Cut property -- why greedy works for MST." AI generates: graphs where Kruskal and Prim process edges in different orders but produce same MST. AI adapts: Kruskal first, then Prim, then second-best MST. | 9 | 8 | M | Partial |

### 6G. Union-Find

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Elements shown as nodes in forest of trees. Union: two trees merge (smaller tree slides under larger tree's root -- union by rank). Find: path from node to root highlights, then all intermediate nodes re-point directly to root (path compression animation -- arrows all swing up to root). The "aha moment": path compression flattens the tree drastically. Show the before/after of a deep tree becoming nearly flat after one find operation. | 10 | 10 | M | Yes (union-find.ts exists) |
| **SIMULATION** | Real-time: user executes union(a,b) and find(a) operations. Trees restructure with animation. Parameters: number of elements, operation sequence. Metrics: tree heights, number of find comparisons (before/after path compression), alpha(n) explanation, component count. | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Execute these 6 unions and 3 finds. Draw the final forest." Challenge 2: "Number of connected components after K union operations." Challenge 3: "Detect cycle in undirected graph using Union-Find." | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Union by rank: which tree becomes the subtree?" Prediction: "After find(7) with path compression, how many nodes change parent?" Complexity: "Union-Find with both optimizations: O(alpha(n)) per operation. What is alpha(n)?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Union-Find: two optimizations." Back: "Union by rank: attach smaller tree under larger root. Path compression: during find, point all nodes directly to root. Together: O(alpha(n)) amortized, effectively O(1)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Inverse Ackermann function alpha(n) -- practically constant." AI generates: sequences that show dramatic path compression effects. AI adapts: naive union, then union by rank, then path compression, then both together. | 9 | 7 | M | Partial |

### 6H-6J. Remaining Graph Algorithms (Cycle Detection, SCC/Kosaraju, Bipartite)

| Algorithm | Exists in Codebase? | Key Feature Needed | Effort | Priority |
|---|---|---|---|---|
| **Cycle Detection (directed + undirected)** | Yes (cycle-detection.ts) | Directed: DFS 3-color visualization (white/gray/black). Back edge detection animation. Undirected: Union-Find based. | M | High |
| **SCC - Kosaraju** | Partial (tarjan-scc.ts exists for Tarjan's) | Two-pass animation: DFS forward (record finish times), transpose graph (all edges reverse with flip animation), DFS in reverse finish order. Each SCC gets a distinct color. | L | Medium |
| **Bipartite Check** | Yes (bipartite.ts) | 2-coloring BFS: alternate red/blue at each layer. Conflict detection: when a neighbor has the SAME color, highlight the odd-cycle causing non-bipartiteness. | M | High |

---

## 7. DYNAMIC PROGRAMMING

### 7A. 1D DP

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | 1D DP array fills left-to-right. Each cell computation shows its dependencies as arrows from previously filled cells. Fibonacci example: `dp[i] = dp[i-1] + dp[i-2]` -- two arrows point back. Climbing stairs: same recurrence, different story. The "aha moment": overlaying the recursion tree (exponential, bushy) against the DP table (linear, clean) -- same answers, O(2^n) vs O(n). Show the recursion tree growing explosively, then the DP table calmly filling one cell at a time. | 10 | 10 | M | Yes (fibonacci.ts exists) |
| **SIMULATION** | Real-time: user picks 1D DP problem (Fibonacci, climbing stairs, house robber, decode ways). Table fills with animation. Parameters: input size, problem type, speed. Metrics: subproblems computed, cache hits (memoization) vs table fills (bottom-up), space optimization toggle (keep only last 2 values). | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Fill the DP table for climbing stairs(6)." Challenge 2: "House robber on [2,7,9,3,1]." Challenge 3: "Decode ways for '226'." Graded by: correct table values + correct final answer. | 9 | 8 | M | No |
| **ASSESSMENT** | Quiz: "dp[i] = dp[i-1] + dp[i-2]. What is dp[6]?" Prediction: "After filling dp[0..4], what is dp[5]?" Complexity: "Top-down memo vs bottom-up table: same time complexity. What about space?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "1D DP template." Back: "Base case: dp[0], dp[1]. Transition: dp[i] = f(dp[i-1], dp[i-2], ...). Direction: left to right. Space optimization: if dp[i] depends on only last K values, keep only K variables." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Overlapping subproblems + optimal substructure = DP." AI generates: novel 1D DP problems with custom recurrences. AI adapts: Fibonacci (easiest), then house robber (skip logic), then decode ways (conditional recurrence). | 9 | 7 | M | Partial |

### 7B. 2D DP

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | 2D grid/table fills cell by cell. For LCS: rows = string1 chars, cols = string2 chars. Each cell shows `max(dp[i-1][j], dp[i][j-1])` or `dp[i-1][j-1] + 1` if chars match. Match cells glow (diagonal dependency). The "aha moment": the backtracking phase traces the optimal path through the table -- a diagonal step means "this character is in the LCS" -- and the LCS reconstructs character by character. | 10 | 10 | M | Yes (lcs.ts, edit-distance.ts exist) |
| **SIMULATION** | Real-time: user enters two strings. Table fills with animation, dependency arrows shown. Parameters: two input strings, speed, toggle backtrack path. Metrics: table values, LCS/edit-distance result, backtrack path, space optimization (row-at-a-time). | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Fill the LCS table for 'ABCBDAB' and 'BDCAB'." Challenge 2: "Edit distance for 'horse' and 'ros'." Challenge 3: "Minimum path sum in grid." Graded by: correct cell values + correct backtrack. | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "LCS table: s1[i] == s2[j]. Which cell does dp[i][j] come from?" Prediction: "dp[3][4] = 3. What is dp[4][5] if s1[4] == s2[5]?" Complexity: "LCS is O(mn). Can we do better? (Hunt-Szymanski for sparse matches.)" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "LCS recurrence." Back: "If s1[i] == s2[j]: dp[i][j] = dp[i-1][j-1] + 1. Else: dp[i][j] = max(dp[i-1][j], dp[i][j-1]). Backtrack: diagonal = match, up/left = skip." | 8 | 4 | S | Partial |
| **AI** | AI explains: "LCS vs edit distance -- same table structure, different recurrence." AI generates: string pairs with interesting LCS/edit patterns. AI adapts: LCS, then edit distance, then longest common substring (contiguous). | 9 | 7 | M | Partial |

### 7C-7I. Remaining DP (summarized for space)

| DP Variant | Key Visualization | Exists? | Learning Impact | Effort |
|---|---|---|---|---|
| **DP on Strings** | LCS/edit-distance table with char-by-char comparison, backtrack path as diagonal trace | Yes (lcs.ts, edit-distance.ts) | 10 | S (enhance existing) |
| **DP on Trees** | DP values on tree nodes, bottom-up fill animation, selected/unselected coloring | No | 9 | L |
| **Bitmask DP** | Binary state representation shown as toggleable bits (on/off switches for subsets). State transitions shown as bit-flip animations. TSP example: visited cities as bitmask. | No | 9 | XL |
| **Interval DP** | Matrix-chain table fills diagonally (not row-by-row). Each cell shows parenthesization. Optimal split point highlighted. | Yes (matrix-chain.ts) | 9 | M (enhance) |
| **Knapsack Variants** | Include/exclude decision at each cell with visual weight bar. Backtrack highlights selected items. Unbounded variant: cell can reference same row. | Yes (knapsack.ts) | 10 | S (enhance) |
| **LIS** | Array with patient sorting visualization (patience cards stacking). dp[i] values shown, subsequence highlighted. O(n log n) binary search variant. | Yes (lis.ts) | 9 | M (enhance) |
| **Coin Change** | 1D table with coin denominations as column headers. Each cell shows "which coin was last used?" Backtrack reconstructs coin combination. | Yes (coin-change.ts) | 9 | S (enhance) |

---

## 8. RECURSION / BACKTRACKING

### 8A. Subsets

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Binary decision tree: each level = one element, left branch = exclude, right branch = include. Leaves = complete subsets. Tree grows top-down with path highlighting. The "aha moment": the tree has exactly 2^n leaves, one for each subset. Alternative view: bitmasking -- show binary numbers 000 to 111 mapping to subsets of {a,b,c}. | 10 | 9 | M | Yes (subset-generation.ts exists) |
| **SIMULATION** | Real-time: user enters elements (up to 6). Decision tree or bitmask view animates. Parameters: element set, representation (tree / bitmask / iterative), speed. Metrics: subsets generated, recursion depth, call count. | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Generate all subsets of {1,2,3}" (verify 8 subsets). Challenge 2: "Subsets with duplicates" ([1,2,2] -- skip duplicates). Challenge 3: "Subsets that sum to K" (subset sum as backtracking). | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "How many subsets does a set of 5 elements have?" Prediction: "The recursion is at element 3, current subset is {1,3}. What are the next two branches?" Complexity: "Why O(2^n) subsets and O(n * 2^n) total time (copying)?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Subset generation: two approaches." Back: "1. Backtracking: include/exclude decision tree. 2. Bitmask: iterate 0 to 2^n-1, bit i set means include element i. Both O(2^n) subsets." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Backtracking vs bitmask -- when to use each." AI generates: subset problems with constraints. AI adapts: basic subsets, then with duplicates, then subset sum, then K-element subsets. | 8 | 6 | M | Partial |

### 8B. Permutations

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Recursion tree where each level swaps one element into position. At each node, available choices are shown as branches. Used positions are crossed out. The "aha moment": the tree has n! leaves. Show the "swap" approach: array state at each node, each swap is a visual element exchange. | 9 | 9 | M | No |
| **SIMULATION** | Real-time: user enters elements (up to 6). Recursion tree grows with swap animations. Parameters: elements, with/without duplicates, speed. Metrics: permutations generated, swaps performed, recursion depth. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Generate all permutations of [1,2,3]" (verify 6). Challenge 2: "Permutations with duplicates [1,1,2]" (avoid duplicates). Challenge 3: "Next permutation" (in-place, no recursion). | 9 | 7 | M | No |
| **ASSESSMENT** | Quiz: "How many permutations of 4 elements? With 2 duplicates?" Prediction: "Current state [2,1,3]. Next swap is at index 1. What are the children?" Complexity: "O(n!) permutations, O(n * n!) to generate all with copying." | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Permutation backtracking vs next-permutation." Back: "Backtracking: swap element into each position, recurse. O(n!). Next permutation: find rightmost ascent, swap with smallest larger element to right, reverse suffix. O(n) per call." | 8 | 4 | S | Partial |
| **AI** | AI generates: variant problems (letter combinations, palindrome permutations). AI adapts: basic permutations, then with duplicates, then next permutation (iterative). | 8 | 6 | M | Partial |

### 8C. N-Queens

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | NxN chessboard on canvas. Queens placed row by row. When a queen is placed, attack lines (row, column, both diagonals) shade red. Safe cells remain green. Backtrack: queen lifts off with "poof" animation, red zones recalculate. The "aha moment": the search tree pruning -- show the full 8^8 possibility space (huge) vs the backtracking exploration (tiny fraction), with a counter comparing branches explored vs branches pruned. | 10 | 10 | M | Yes (n-queens.ts exists with step recording) |
| **SIMULATION** | Real-time: user sets N (4-12). Board fills with backtracking animation. Parameters: N, speed, all-solutions toggle, show attack lines toggle. Metrics: placements attempted, backtracks, solutions found, pruning ratio (explored/total). | 10 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Solve 4-queens by hand" (drag queens, get constraint feedback). Challenge 2: "How many solutions exist for 8-queens?" (run and count). Challenge 3: "Place 8 queens such that no 3 are collinear" (harder variant). | 9 | 9 | L | Partial |
| **ASSESSMENT** | Quiz: "Queen at (2,3). Which cells are attacked?" Prediction: "Row 3 has queen at col 1. Which columns are safe for row 4?" Complexity: "Upper bound: O(N!). Actual for N=8: ~15,000 placements explored, not 8^8 = 16M." | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "N-Queens: three constraints to check." Back: "Column: no two queens in same column. Diagonal: |row1-row2| != |col1-col2|. Row: handled by placing one queen per row. Backtrack when no safe column exists." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Pruning power -- how much of the tree is actually explored." AI generates: different N values and counts solutions. AI adapts: 4-queens (easy), then 8-queens, then N-queens with additional constraints. | 9 | 8 | M | Partial |

### 8D. Sudoku Solver

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | 9x9 grid on canvas. Givens are bold/dark. Solver fills empty cells with backtracking animation: try 1-9, check row/col/box constraints (invalid numbers flash red and eject), valid number settles in (green). Backtrack: number fades out, cursor returns to previous cell. The "aha moment": watch constraint propagation eliminate most possibilities before backtracking even starts. Show "candidates" per cell shrinking as neighbors fill in. | 10 | 10 | M | Yes (sudoku.ts exists with step recording) |
| **SIMULATION** | Real-time: user enters puzzle (click cells to set givens). Solver runs with animation. Parameters: puzzle (preset or custom), speed, show candidates toggle, constraint propagation toggle. Metrics: cells filled, backtracks, candidates eliminated per step, solving time. | 10 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Solve this easy Sudoku" (interactive, get hint on stuck). Challenge 2: "Given partially filled board, list all candidates for cell (3,5)." Challenge 3: "Design a puzzle with exactly one solution" (generator). | 9 | 9 | L | Partial |
| **ASSESSMENT** | Quiz: "Cell (2,4) has row constraint {1,3,5}, col constraint {2,5,8}, box constraint {1,2,3}. What are valid candidates?" Prediction: "Solver places 5 at (3,3). What cells lose 5 as a candidate?" Complexity: "Worst case: O(9^m) where m = empty cells. Why is actual time much less?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Sudoku constraint checking for cell (r,c)." Back: "Row r: no duplicate. Column c: no duplicate. Box (r/3*3, c/3*3): no duplicate in 3x3 sub-grid. Place only if value passes all three." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Constraint propagation vs pure backtracking -- how much pruning matters." AI generates: puzzles of varying difficulty (17-clue minimum to 30+ clue easy). AI adapts: easy puzzles (many givens), then medium, then hard (near-minimal clue count). | 9 | 8 | L | Partial |

### 8E. Knight's Tour

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | NxN chessboard. Knight moves in L-shape (highlight valid moves as "where can I go?" cells). Each visited cell gets a number showing visit order. Trail line follows the knight's path. The "aha moment": Warnsdorff's heuristic -- the knight prefers cells with fewer remaining moves (show the candidate counts as tiny numbers, and the knight always choosing the smallest). This greedy heuristic turns an exponential problem into near-linear. | 10 | 10 | M | Yes (knights-tour.ts exists) |
| **SIMULATION** | Real-time: user sets N (5-8) and start position. Knight hops with animation. Parameters: N, start position, heuristic toggle (brute force vs Warnsdorff), speed. Metrics: cells visited, backtracks, path completion percentage, time comparison (with/without heuristic). | 9 | 10 | M | Partial |
| **PRACTICE** | Challenge 1: "Find knight's tour on 5x5 starting from (0,0)." Challenge 2: "Interactive: YOU control the knight -- find a tour" (game mode). Challenge 3: "Is a closed tour possible? (knight returns to start.)" | 9 | 9 | L | Partial |
| **ASSESSMENT** | Quiz: "Knight at (3,4) on 8x8 board. How many valid moves?" Prediction: "At (0,0) on 5x5, Warnsdorff picks which cell next?" Complexity: "Brute force: O(8^(N^2)). With Warnsdorff: O(N^2). Why such a drastic improvement?" | 8 | 7 | S | No |
| **REVIEW** | Flashcard front: "Warnsdorff's heuristic for Knight's Tour." Back: "Always move to the square with the fewest onward moves. Greedy heuristic, not guaranteed but works for N >= 5. Reduces exponential backtracking to near-linear." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Why heuristics can tame exponential backtracking." AI generates: starting positions on various board sizes. AI adapts: small boards first, then 8x8, then closed tour, then knight's tour with obstacles. | 8 | 7 | M | Partial |

---

## 9. GREEDY

### 9A. Activity Selection

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Timeline (horizontal axis = time). Activities shown as colored bars at their [start, end] intervals. After sorting by end time, the greedy algorithm picks activities one by one: compatible activities glow green, incompatible ones fade gray. The "aha moment": the greedy choice property -- always picking the earliest-ending activity PROVABLY leaves maximum room. Show a counterexample where picking earliest-starting fails. | 10 | 9 | M | Yes (activity-selection.ts exists) |
| **SIMULATION** | Real-time: user creates activities by dragging on timeline. Algorithm sorts and selects. Parameters: activity times (drag to adjust), sort criterion toggle (end time vs start time vs duration), speed. Metrics: selected count, total coverage, idle gaps, comparison with optimal (should match). | 9 | 9 | M | Partial |
| **PRACTICE** | Challenge 1: "Select maximum non-overlapping activities from this set." Challenge 2: "Minimum number of meeting rooms needed (interval partitioning)." Challenge 3: "Weighted activity selection" (DP, not greedy). | 9 | 8 | M | Partial |
| **ASSESSMENT** | Quiz: "Why sort by end time and not start time? Show counterexample." Prediction: "After selecting activity A (ends at 3), which activities are eliminated?" Complexity: "O(n log n) for sort + O(n) for greedy scan. Why?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Activity Selection: sort by ____ and why." Back: "Sort by end time (ascending). Greedy: always pick the activity that ends earliest and is compatible. Proof: exchange argument -- replacing any activity with one ending earlier never worsens the solution." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Exchange argument proof for greedy correctness." AI generates: activity sets with ties and edge cases. AI adapts: unweighted (greedy), then meeting rooms (min-heap), then weighted (DP). | 9 | 7 | M | Partial |

### 9B. Huffman Coding

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Bottom-up tree construction. Start with N leaf nodes (characters + frequencies, shown as bars). At each step, the two smallest nodes merge into a parent (bars combine, parent node appears with sum weight). Tree grows upward until one root. Then: code assignment -- left = 0, right = 1. Trace any leaf's path for its code. The "aha moment": high-frequency characters have SHORT codes (near root), low-frequency characters have LONG codes (deep) -- this is why Huffman is optimal prefix-free coding. Show encoded message length vs fixed-width encoding length. | 10 | 10 | L | Partial (huffman.ts exists for tree, needs encoding viz) |
| **SIMULATION** | Real-time: user enters character frequencies. Tree builds with animation. Parameters: character/frequency pairs, speed, message to encode. Metrics: tree height, code table, encoded message length (bits), compression ratio vs fixed-width, average code length. | 9 | 10 | L | Partial |
| **PRACTICE** | Challenge 1: "Build Huffman tree for frequencies a:5, b:9, c:12, d:13, e:16, f:45." Challenge 2: "Encode 'aabcc' using the Huffman codes." Challenge 3: "Decode this bit string using the Huffman tree." | 9 | 9 | L | No |
| **ASSESSMENT** | Quiz: "Character with highest frequency has ____ code (shortest/longest)." Prediction: "After merging the two smallest nodes (freq 3, 5), what is the new priority queue?" Complexity: "Huffman tree construction: O(n log n). Why is the coding optimal?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Huffman coding: prefix-free property." Back: "No code is a prefix of another. Guaranteed by tree structure: codes are only at leaves. Greedy: always merge two lowest-frequency nodes. Optimal: minimizes expected code length." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why prefix-free is necessary for unambiguous decoding." AI generates: frequency distributions that produce interesting tree shapes. AI adapts: basic Huffman, then encoding/decoding, then adaptive Huffman, then comparison with LZW. | 9 | 8 | L | Partial |

### 9C. Fractional Knapsack

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Items displayed as rectangles (width = weight, height = value). Sorted by value/weight ratio (shown as number on each item). Knapsack shown as a container that fills. Items slide in whole; last item may be "cut" (animated with scissors) to fill remaining capacity. The "aha moment": compare with 0/1 knapsack -- fractional is greedy (O(n log n)), 0/1 requires DP (O(nW)). Show the same items, different answers. | 9 | 9 | M | Yes (fractional-knapsack.ts exists) |
| **SIMULATION** | Real-time: user enters item weights/values. Items sort by ratio and fill knapsack. Parameters: items (weight, value), capacity, speed. Metrics: total value, total weight, fraction of last item, value/weight ratios, comparison with 0/1 knapsack answer. | 8 | 8 | M | Partial |
| **PRACTICE** | Challenge 1: "Fill knapsack of capacity 50 with these items." Challenge 2: "Same items, 0/1 constraint -- does the greedy answer change?" Challenge 3: "Prove fractional knapsack greedy is optimal" (exchange argument, guided). | 8 | 7 | M | Partial |
| **ASSESSMENT** | Quiz: "Items sorted by ratio: [4, 3, 2.5, 2]. Capacity left = 10, next item weighs 15. How much do you take?" Prediction: "After taking items A and B fully, remaining capacity?" Complexity: "O(n log n) for sort. O(n) for greedy fill. Why?" | 7 | 5 | S | No |
| **REVIEW** | Flashcard front: "Fractional vs 0/1 knapsack: key difference." Back: "Fractional: sort by value/weight ratio, take greedily. O(n log n). 0/1: cannot take fractions, need DP. O(nW). Fractional answer >= 0/1 answer (relaxation)." | 7 | 4 | S | Partial |
| **AI** | AI explains: "Why greedy fails for 0/1 but works for fractional." AI generates: item sets where greedy and DP give different 0/1 answers. AI adapts: fractional first, then 0/1 comparison, then unbounded knapsack. | 8 | 6 | M | Partial |

---

## 10. HEAP / PRIORITY QUEUE

### 10A. K-th Largest Element

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array on top. Min-heap of size K shown below as a tree. Elements stream in: if element > heap root, push + pop (root ejects, new element sifts in). If element <= root, skip (fades gray). After processing all elements, root = K-th largest. The "aha moment": the heap is a "bouncer" that keeps only the K largest elements. Anything smaller than the smallest of the top-K gets rejected. Show the alternative (sort entire array O(n log n)) vs heap approach (O(n log k)). | 9 | 9 | M | Partial (heap-operations exists, needs K-th largest variant) |
| **SIMULATION** | Real-time: user enters array, sets K. Elements stream through heap. Parameters: array values, K, speed. Metrics: heap operations (insert/extract), elements skipped, final heap state, K-th largest value. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Find 3rd largest in [3,1,5,12,2,11]" (trace heap). Challenge 2: "Stream version: elements arrive one at a time, maintain K-th largest." Challenge 3: "Quick Select alternative -- O(n) average, O(n^2) worst." | 9 | 8 | M | No |
| **ASSESSMENT** | Quiz: "Min-heap of size 3: [5, 7, 12]. Next element: 4. What happens?" Prediction: "After processing 6 elements with K=3, what is the heap?" Complexity: "O(n log k) vs O(n log n) sort. When is k small enough to matter?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "K-th largest: min-heap vs max-heap?" Back: "Min-heap of size K. Root = K-th largest (smallest of the top-K). Push if element > root, then pop root. After all elements: root = answer. O(n log k)." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why min-heap and not max-heap?" AI generates: arrays with various K values. AI adapts: basic K-th largest, then streaming variant, then Quick Select. | 8 | 6 | M | Partial |

### 10B. Merge K Sorted Lists

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | K horizontal sorted lists shown as rows. Min-heap shown in center (tree visualization). One element from each list is in the heap initially. Extract min -> append to result list (bottom). Insert next element from that list into heap. The "aha moment": we always extract the global minimum from K candidates in O(log K) time, instead of scanning all K heads in O(K). Show the comparison: naive merge (O(N*K)) vs heap merge (O(N log K)). | 10 | 9 | L | No |
| **SIMULATION** | Real-time: user enters K sorted lists. Heap merges them. Parameters: K (2-8), list lengths, values, speed. Metrics: heap operations, comparisons, result list building, total elements processed. | 9 | 9 | L | No |
| **PRACTICE** | Challenge 1: "Merge 3 sorted lists using min-heap." Challenge 2: "Merge K sorted arrays (same idea, arrays instead of lists)." Challenge 3: "Divide and conquer merge (pair lists, merge pairs)." | 9 | 8 | L | No |
| **ASSESSMENT** | Quiz: "Heap has [1, 3, 5] from 3 lists. Extract 1 (from list 2). What goes in next?" Prediction: "After 5 extractions, what is the heap?" Complexity: "N total elements, K lists. Heap merge: O(N log K). Divide and conquer: O(N log K). Same!" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Merge K sorted lists: key data structure." Back: "Min-heap of size K. Initialize: push first element from each list. Loop: extract min, push next from that list. O(N log K) where N = total elements." | 8 | 4 | S | Partial |
| **AI** | AI explains: "External merge sort uses this exact pattern." AI generates: K sorted lists with various lengths. AI adapts: 2-list merge, then K-list heap merge, then divide-and-conquer merge. | 9 | 7 | L | Partial |

### 10C. Median Finder

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Two heaps side by side: max-heap (left, "smaller half") and min-heap (right, "larger half"). Numbers stream in. Each number drops into the correct heap, then heaps rebalance (one element may transfer between heaps). Median = max-heap root (odd count) or average of both roots (even count). The "aha moment": the two roots are always the middle elements. Show numbers on a number line, with the boundary between heaps always at the median. | 10 | 10 | L | No |
| **SIMULATION** | Real-time: user adds numbers one at a time. Both heaps animate. Median updates live. Parameters: number stream, speed. Metrics: max-heap size, min-heap size, current median, balance operations, comparison with sorted-array approach. | 9 | 10 | L | No |
| **PRACTICE** | Challenge 1: "Add [5, 2, 8, 1, 9, 3]. What is the median after each addition?" Challenge 2: "Sliding window median (remove + add)." Challenge 3: "Why can't a single heap find the median?" | 9 | 9 | L | No |
| **ASSESSMENT** | Quiz: "Max-heap: [5, 3, 1]. Min-heap: [7, 9]. Next number: 6. Which heap? Rebalance?" Prediction: "After adding 4 to current state, new median?" Complexity: "O(log n) per insertion. O(1) for median query. Why?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Median of a stream: two-heap approach." Back: "Max-heap: lower half. Min-heap: upper half. Sizes differ by at most 1. Median: max-heap root (odd) or average of both roots (even). Insert: O(log n). Query: O(1)." | 9 | 4 | S | Partial |
| **AI** | AI explains: "Why max-heap for lower half and min-heap for upper half?" AI generates: number streams with interesting median transitions. AI adapts: basic stream, then sliding window variant, then follow-up (percentile queries). | 9 | 8 | L | Partial |

---

## 11. BINARY SEARCH (Advanced Variants)

### 11A. Search on Answer

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Number line showing the answer space [lo, hi]. Binary search picks mid, a "feasibility checker" function evaluates mid (green = feasible, red = infeasible). The search space halves. The "aha moment": the problem isn't searching in an array -- it's searching in an ANSWER SPACE. The key insight: if f(x) is monotonic (once true, always true), binary search works on answers. Show examples: "minimum capacity to ship packages in D days", "split array largest sum." | 10 | 10 | M | Partial (basic binary search exists) |
| **SIMULATION** | Real-time: user picks problem type. Answer space shown as a range. Binary search on answer animates with feasibility check per mid. Parameters: problem type, input values, speed. Metrics: search range per iteration, feasibility check results, iterations, final answer. | 9 | 9 | M | No |
| **PRACTICE** | Challenge 1: "Minimum speed to eat all bananas in H hours" (Koko). Challenge 2: "Split array into K subarrays minimizing maximum sum." Challenge 3: "Minimum capacity to ship packages in D days." | 9 | 8 | M | No |
| **ASSESSMENT** | Quiz: "For 'split array largest sum', what is the search space [lo, hi]?" (lo = max element, hi = total sum). Prediction: "mid = 10. Feasibility check says 'needs 4 subarrays but K=3'. Which half do we search?" Complexity: "O(n * log(sum)) for the entire binary search. Why?" | 9 | 7 | S | No |
| **REVIEW** | Flashcard front: "Binary search on answer: when to use?" Back: "When the answer is a number in range [lo, hi] and there exists a monotonic feasibility function: f(x) = can we do it with x? Binary search over x, check f(x) in O(n). Total: O(n log(hi-lo))." | 9 | 4 | S | Partial |
| **AI** | AI explains: "How to identify 'binary search on answer' problems." AI generates: problems with different feasibility functions. AI adapts: simple feasibility (Koko), then multi-constraint (ship packages), then minimization (minimize max). | 9 | 8 | M | Partial |

### 11B. Lower/Upper Bound

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Sorted array with duplicates. Lower bound: find first occurrence. Upper bound: find first element GREATER. Show both pointers converging differently on the same array. The "aha moment": the `<` vs `<=` in the comparison changes where the pointer lands -- a single character difference in code, completely different behavior. Side-by-side comparison of the two variants on `[1, 3, 3, 3, 5]` searching for 3. | 9 | 8 | M | Partial |
| **SIMULATION** | Real-time: user enters sorted array with duplicates. Both lower and upper bound run simultaneously (split view). Parameters: array, target, speed. Metrics: pointer positions per step, final positions, range [lower, upper) gives count of target. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Find first and last position of element 3 in [1,3,3,3,5,5]." Challenge 2: "Count occurrences of K using upper_bound - lower_bound." Challenge 3: "Find insertion position for element 4." | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "lower_bound(3) on [1,2,3,3,4]. Returns index ?" Prediction: "upper_bound(3) on same array. Returns index ?" Complexity: "Both O(log n). How to count occurrences in O(log n) instead of O(n)?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "lower_bound vs upper_bound on sorted array with duplicates." Back: "lower_bound: first element >= target. upper_bound: first element > target. Range of target: [lower_bound, upper_bound). Count = upper - lower." | 8 | 4 | S | Partial |
| **AI** | AI explains the subtle `<` vs `<=` difference with code comparison. AI generates: arrays with various duplicate patterns. AI adapts: basic bounds, then count occurrences, then combined with search-on-answer. | 8 | 6 | M | Partial |

### 11C. Peak Finding

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Array shown as a mountain profile (line chart). Binary search picks mid: if `arr[mid-1] < arr[mid] > arr[mid+1]`, it is a peak (gold star). If increasing at mid, peak is to the right (discard left half). If decreasing, peak is to the left (discard right half). The "aha moment": binary search finds a peak in O(log n) even though there might be multiple peaks -- we don't need to find ALL peaks, just ONE. | 9 | 9 | M | No |
| **SIMULATION** | Real-time: user draws a mountain profile by dragging points. Binary search finds a peak. Parameters: array values (drawable), speed, show all peaks toggle. Metrics: iterations, search space per step, peak found. | 8 | 9 | M | No |
| **PRACTICE** | Challenge 1: "Find a peak in [1, 3, 20, 4, 1, 0]." Challenge 2: "Peak element in 2D matrix" (harder: O(n log n) or O(n)). Challenge 3: "Find the peak in a bitonic array." | 8 | 7 | M | No |
| **ASSESSMENT** | Quiz: "mid=3, arr[2]=5, arr[3]=8, arr[4]=3. Which half has a peak?" Prediction: "After 2 iterations on 16-element mountain array, where is the search range?" Complexity: "O(log n). Why is a peak guaranteed to exist in any subarray?" | 8 | 6 | S | No |
| **REVIEW** | Flashcard front: "Peak finding with binary search: direction rule." Back: "If arr[mid] > both neighbors: peak. If arr[mid-1] > arr[mid]: peak in left half. If arr[mid+1] > arr[mid]: peak in right half. O(log n). Guaranteed by the boundary condition argument." | 8 | 4 | S | Partial |
| **AI** | AI explains: "Why does the existence guarantee work?" (pigeon-hole on endpoints). AI generates: arrays with various peak configurations. AI adapts: 1D peak, then bitonic array, then 2D peak. | 8 | 7 | M | Partial |

### 11D. Rotated Array Search

| Dimension | Specification | Learning Impact | WOW Factor | Effort | Exists? |
|---|---|---|---|---|---|
| **LEARNING** | Sorted array shown as ascending bars, then "rotated" -- the right portion slides to the left with animation, creating two ascending segments. Binary search: determine which half is sorted (compare mid to endpoints), then decide which half to search. The "aha moment": at least one half is ALWAYS sorted after rotation, so we can always make a decision. Animation shows the sorted half glowing green and the unsorted half glowing amber. | 9 | 9 | M | No |
| **SIMULATION** | Real-time: user enters sorted array, picks rotation point (slider). Binary search runs on rotated array. Parameters: array, rotation point, target, speed. Metrics: iterations, which half is sorted at each step, target located or not found. | 8 | 8 | M | No |
| **PRACTICE** | Challenge 1: "Search for 4 in [4,5,6,7,0,1,2]." Challenge 2: "Find minimum in rotated sorted array." Challenge 3: "Rotated array with duplicates -- worst case?" | 9 | 8 | M | No |
| **ASSESSMENT** | Quiz: "Array [6,7,1,2,3,4,5], mid=2 (value 1). Which half is sorted?" Prediction: "After one iteration, what is the new search range?" Complexity: "O(log n) for distinct elements. O(n) worst case with duplicates. Why?" | 9 | 6 | S | No |
| **REVIEW** | Flashcard front: "Rotated sorted array: how to decide which half to search." Back: "Compare arr[mid] to arr[lo]. If arr[lo] <= arr[mid]: left half is sorted. Else: right half is sorted. Then check if target is in the sorted half. O(log n) without duplicates." | 8 | 4 | S | Partial |
| **AI** | AI explains: "The duplicate case and why it breaks O(log n)." AI generates: arrays with various rotation points and targets. AI adapts: no-dup search, then find-minimum, then with-duplicates variant. | 9 | 7 | M | Partial |

---

## CROSS-CUTTING FEATURES (Apply to ALL topics)

### Complexity Lab

| Feature | Description | Impact | WOW | Effort | Exists? |
|---|---|---|---|---|---|
| **Live Complexity Counter** | Every algorithm step increments a comparisons/swaps/reads/writes counter shown in the top bar. Final count compared to theoretical O(f(n)). | 9 | 7 | S | Yes (built into AnimationStep.complexity) |
| **n-Slider Experiment** | User adjusts input size from 5 to 100. Chart shows actual operation count vs theoretical curve. "See O(n log n) is not just math -- it is exactly what you see." | 10 | 10 | M | No |
| **Algorithm Race** | Run two algorithms on the same input simultaneously (split screen). E.g., Kadane's vs brute force, Dijkstra vs Bellman-Ford. Visual proof of complexity differences. | 10 | 10 | L | No |

### Spaced Repetition System

| Feature | Description | Impact | WOW | Effort | Exists? |
|---|---|---|---|---|---|
| **Auto-Generated Flashcards** | Every algorithm page auto-generates 3-5 flashcards: recurrence, complexity, key insight, common mistake, when-to-use. | 9 | 6 | M | Partial (FSRS engine exists, cards need content) |
| **Micro-Review Sessions** | 2-minute daily review: 5 cards from due algorithms. Mix of recall (fill blank), prediction (what happens next), and identification (which algorithm?). | 9 | 7 | M | Partial |
| **Forgetting Curve Dashboard** | Per-algorithm retention graph. Shows which algorithms are "fading" and need review. Heat map of all algorithms by retention level. | 8 | 8 | L | No |

### AI Tutor Layer

| Feature | Description | Impact | WOW | Effort | Exists? |
|---|---|---|---|---|---|
| **"Why?" Button** | Any algorithm step has a "Why?" button that asks AI to explain that specific step in context. Not generic -- it knows the current array state, pointer positions, and what just happened. | 10 | 9 | M | Partial (AI explainer exists, needs step-context binding) |
| **Difficulty Adaptation** | AI tracks success rate per topic. Below 60%: simplify inputs, add more hints, slow down. Above 90%: harder variants, edge cases, follow-up questions. | 9 | 8 | L | Partial (adaptive quiz exists, needs per-algorithm tracking) |
| **Pattern Recognition** | AI identifies: "You're struggling with DP recurrence identification. Here are 3 more problems where identifying the state is the key challenge." | 9 | 9 | L | No |

---

## IMPLEMENTATION PRIORITY MATRIX

### Phase 1: Foundation (build new viz primitives) -- 4-6 weeks

| # | Feature | Why First | Effort |
|---|---|---|---|
| 1 | Linked list visualization component (node-arrow rendering) | Blocks all linked list topics (3A-3D), reused in LRU cache | L |
| 2 | 1D/2D array interactive editor (editable cells, draggable ranges) | Blocks prefix sum, Kadane's, difference arrays, all array topics | M |
| 3 | Stack/queue sidebar visualization (push/pop animation) | Blocks monotonic stack, BFS queue, DFS stack, min stack | M |
| 4 | Algorithm Race (split-screen comparison) | Highest WOW factor, works with ALL existing algorithms | L |
| 5 | n-Slider Experiment (complexity curve visualizer) | Deepest learning impact for complexity understanding | M |

### Phase 2: High-Impact New Algorithms -- 4-6 weeks

| # | Feature | Why | Effort |
|---|---|---|---|
| 6 | Prefix Sum + Kadane's + Difference Array (array techniques) | Most common interview patterns, no existing coverage | M each |
| 7 | Multi-Source BFS | Highest WOW factor of any new graph feature | M |
| 8 | LCA + Binary Lifting | Critical tree topic, no existing coverage | L |
| 9 | Tree DP | Advanced topic that differentiates Architex | L |
| 10 | Search on Answer (binary search variant) | Most requested "I finally understand this" topic | M |

### Phase 3: Enhanced Existing + Polish -- 4-6 weeks

| # | Feature | Why | Effort |
|---|---|---|---|
| 11 | KMP enhanced visualization (ghost naive comparison) | Existing algo, needs "aha moment" upgrade | S |
| 12 | Manacher's Algorithm (palindromes) | High WOW, no existing coverage | L |
| 13 | Median Finder (two-heap) | Extremely common interview question, high WOW viz | L |
| 14 | K-th Largest + Merge K Sorted | Heap application trio completes the heap module | M each |
| 15 | Permutations (backtracking) | Missing from subset-generation family | M |

### Phase 4: Flashcards + AI + Assessment -- 3-4 weeks

| # | Feature | Why | Effort |
|---|---|---|---|
| 16 | Auto-generate flashcards for all 60+ algorithm pages | FSRS engine exists, needs content pipeline | M |
| 17 | Step-contextual "Why?" button | AI explainer exists, needs per-step binding | M |
| 18 | Prediction quizzes for all topics | "What happens next?" is highest-impact assessment type | L |
| 19 | Forgetting curve dashboard | Retention visualization completes the learning loop | L |
| 20 | Pattern Recognition AI | Most advanced AI feature, requires success tracking data | XL |

---

## SUMMARY COUNTS

- **Total unique features specified**: 198
- **Already fully implemented**: 18 algorithm engines with step recording
- **Partially implemented** (engine exists, viz or interactive layer needed): 24
- **New features needed**: 156
- **Highest-impact single feature**: Algorithm Race (split-screen, reuses all existing engines, WOW factor 10/10, proves complexity visually)
- **Highest-impact single algorithm to add**: Multi-Source BFS (WOW 10/10, teaches a pattern that unlocks 10+ LeetCode problems, no existing coverage)

Key files referenced for existing infrastructure:
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/types.ts` -- core type system (AnimationStep, VisualMutation, AlgorithmConfig)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/playback-controller.ts` -- playback engine
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/fsrs.ts` -- FSRS-5 spaced repetition
- `/Users/anshullkgarg/Desktop/system_design/architex/src/db/schema/quiz-questions.ts` -- quiz schema
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/patterns/` -- existing array pattern engines (sliding-window, two-pointers, monotonic-stack, floyd-cycle)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/graph/` -- 18 graph algorithms with step recording
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/dp/` -- 11 DP algorithms with step recording
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/algorithms/tree/` -- 12 tree algorithms including trie, union-find, segment tree