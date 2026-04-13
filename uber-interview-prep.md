# Uber Interview Complete Preparation Guide
## LeetCode Questions + HLD + LLD + DSA Patterns + Interview Process

> Data compiled from: LeetCode company tags (via GitHub scrapers), GeeksforGeeks interview experiences, Glassdoor, Blind/TeamBlind, Reddit r/developersIndia, Medium, LinkedIn, and multiple GitHub repositories.

---

# TABLE OF CONTENTS

1. [Uber India Interview Process](#1-uber-india-interview-process)
2. [LeetCode Uber Questions — Most Recent (Highest Priority)](#2-leetcode-uber-questions--most-recent)
3. [LeetCode Uber Questions — Complete All-Time List (300+)](#3-leetcode-uber-questions--complete-all-time-list)
4. [Uber India HLD / System Design Questions (25+)](#4-uber-india-hld-system-design-questions)
5. [Uber India LLD / Machine Coding Questions (30+)](#5-uber-india-lld-machine-coding-questions)
6. [Uber Internal Systems → Interview Question Mapping](#6-uber-internal-systems--interview-question-mapping)
7. [DSA Topics & Pattern Analysis for Uber](#7-dsa-topics--pattern-analysis)
8. [Interview Tips & Evaluation Criteria](#8-interview-tips--evaluation-criteria)
9. [Preparation Roadmap (8-Week Plan)](#9-preparation-roadmap)

---

# 1. Uber India Interview Process

## Round Structure (SDE2/SDE3 — Bangalore/Hyderabad)

| Round | Type | Duration | Details |
|-------|------|----------|---------|
| 0 | Recruiter Screen | 30 min | Background, motivation, team fit |
| 1 | Phone Screen / OA | 45-60 min | 1 DSA problem (medium-hard) |
| 2 | DSA Round 1 | 45-60 min | 1-2 algorithmic problems |
| 3 | DSA Round 2 | 45-60 min | 1-2 algorithmic problems |
| 4 | LLD / Machine Coding | 60-90 min | 1 design + implementation problem |
| 5 | HLD / System Design | 45-60 min | 1 system design problem |
| 6 | Hiring Manager / Bar Raiser | 45-60 min | Behavioral + leadership principles |

### Level-Specific Differences
- **SDE1**: HLD round may be replaced with additional DSA/LLD. Lighter system design expectations.
- **SDE2**: Standard process above. Equal weight on DSA and design.
- **SDE3/Staff**: HLD carries more weight. May have 2 design rounds (1 LLD + 1 HLD). Deeper trade-off discussions expected.

### Platform & Tools
- **OA Platform**: HackerRank (primary, recently migrated from CodeSignal). Some roles still use CodeSignal.
- **Live Coding**: CoderPad (shared editor with interviewer)
- **Machine Coding**: Own IDE allowed for India rounds. Expected to write compilable/runnable code.
- **Language**: Flexible — Java, Python, C++, Go most common
- **Target CodeSignal score**: 800+/840

### OA Format (Online Assessment)
- **Duration**: 70-90 minutes
- **Questions**: 3-4 problems, progressive difficulty
- **Difficulty**: Q1-2 Easy/Medium, Q3-4 Medium-Hard/Hard
- **SDE1 India**: 1 OA + 3 interview rounds (Coding, DS, System Design + Behavioral as 90 min combined)

### Preparation Target
- **150-200 LeetCode problems** total (focused on Uber patterns)
- **Daily**: 5-10 problems (Medium/Hard mix)
- **Timed sessions**: 45-minute runs simulating interviews
- **Mock interviews**: 2x/week with peers

---

# 2. LeetCode Uber Questions — Most Recent (Highest Priority)

> Source: GitHub scrapers of LeetCode premium data (snehasishroy, krishnadey30, liquidslr, dataengineervishal repos) — Feb 2026 snapshot

## Last 30 Days — MUST DO (100% frequency = asked in nearly every recent interview loop)

| # | Problem | Difficulty | Frequency | Topic |
|---|---------|-----------|-----------|-------|
| 362 | Design Hit Counter | Medium | 100% | Design, Queue |
| 2858 | Minimum Edge Reversals So Every Node Is Reachable | Hard | 100% | Graph, BFS, Tree |
| 305 | Number of Islands II | Hard | 87.5% | Union Find |
| 1475 | Final Prices With Special Discount | Easy | 87.5% | Stack, Monotonic |
| 1428 | Leftmost Column with at Least a One | Medium | 87.5% | Binary Search, Matrix |
| 827 | Making A Large Island | Hard | 87.5% | Graph, DFS, Union Find |
| 2791 | Count Paths That Can Form Palindrome in Tree | Hard | 87.5% | Tree, Bitmask, DFS |
| 1438 | Longest Continuous Subarray Abs Diff <= Limit | Medium | 75% | Sliding Window, Deque |
| 2092 | Find All People With Secret | Hard | 75% | Graph, Union Find, Sort |
| 977 | Squares of a Sorted Array | Easy | 75% | Two Pointers |
| 2561 | Rearranging Fruits | Hard | 75% | Greedy, Hash |
| 502 | IPO | Hard | 75% | Greedy, Heap |
| 207 | Course Schedule | Medium | 75% | Graph, Topological Sort |
| 200 | Number of Islands | Medium | 75% | Graph, BFS/DFS |
| 545 | Boundary of Binary Tree | Medium | 75% | Tree, DFS |
| 230 | Kth Smallest Element in BST | Medium | 75% | Tree, Inorder |
| 427 | Construct Quad Tree | Medium | 75% | Recursion, Matrix |
| 864 | Shortest Path to Get All Keys | Hard | 75% | BFS, Bitmask |

## Last 3 Months — HIGH PRIORITY

| # | Problem | Difficulty | Frequency |
|---|---------|-----------|-----------|
| 269 | Alien Dictionary | Hard | 87.5% |
| 1429 | First Unique Number | Medium | 87.5% |
| 815 | Bus Routes | Hard | 75% |
| 79 | Word Search | Medium | 75% |
| 564 | Find the Closest Palindrome | Hard | 62.5% |
| 253 | Meeting Rooms II | Medium | 62.5% |
| 380 | Insert Delete GetRandom O(1) | Medium | 62.5% |
| 212 | Word Search II | Hard | 62.5% |
| 399 | Evaluate Division | Medium | 62.5% |
| 410 | Split Array Largest Sum | Hard | 62.5% |
| 934 | Shortest Bridge | Medium | 62.5% |
| 146 | LRU Cache | Medium | 62.5% |
| 139 | Word Break | Medium | 62.5% |
| 227 | Basic Calculator II | Medium | 62.5% |
| 787 | Cheapest Flights Within K Stops | Medium | 62.5% |
| 347 | Top K Frequent Elements | Medium | 62.5% |
| 981 | Time Based Key-Value Store | Medium | 62.5% |
| 752 | Open the Lock | Medium | 62.5% |
| 2402 | Meeting Rooms III | Hard | 62.5% |
| 204 | Count Primes | Medium | 62.5% |
| 2503 | Max Number of Points From Grid Queries | Hard | 62.5% |
| 1101 | Earliest Moment When Everyone Become Friends | Medium | 62.5% |
| 2163 | Min Diff in Sums After Removal | Hard | 62.5% |

---

# 3. LeetCode Uber Questions — Complete All-Time List

## By Difficulty

### Easy (55 questions)
| # | Problem |
|---|---------|
| 1 | Two Sum |
| 9 | Palindrome Number |
| 13 | Roman to Integer |
| 14 | Longest Common Prefix |
| 20 | Valid Parentheses |
| 21 | Merge Two Sorted Lists |
| 26 | Remove Duplicates from Sorted Array |
| 27 | Remove Element |
| 66 | Plus One |
| 69 | Sqrt(x) |
| 70 | Climbing Stairs |
| 88 | Merge Sorted Array |
| 101 | Symmetric Tree |
| 104 | Maximum Depth of Binary Tree |
| 118 | Pascal's Triangle |
| 121 | Best Time to Buy and Sell Stock |
| 125 | Valid Palindrome |
| 141 | Linked List Cycle |
| 155 | Min Stack |
| 169 | Majority Element |
| 171 | Excel Sheet Column Number |
| 189 | Rotate Array |
| 198 | House Robber |
| 202 | Happy Number |
| 203 | Remove Linked List Elements |
| 205 | Isomorphic Strings |
| 206 | Reverse Linked List |
| 217 | Contains Duplicate |
| 235 | LCA of a BST |
| 242 | Valid Anagram |
| 243 | Shortest Word Distance |
| 246 | Strobogrammatic Number |
| 258 | Add Digits |
| 266 | Palindrome Permutation |
| 270 | Closest BST Value |
| 278 | First Bad Version |
| 283 | Move Zeroes |
| 290 | Word Pattern |
| 299 | Bulls and Cows |
| 339 | Nested List Weight Sum |
| 344 | Reverse String |
| 346 | Moving Average from Data Stream |
| 349 | Intersection of Two Arrays |
| 350 | Intersection of Two Arrays II |
| 359 | Logger Rate Limiter |
| 383 | Ransom Note |
| 404 | Sum of Left Leaves |
| 415 | Add Strings |
| 496 | Next Greater Element I |
| 581 | Shortest Unsorted Continuous Subarray |
| 643 | Maximum Average Subarray I |
| 671 | Second Minimum Node in Binary Tree |
| 680 | Valid Palindrome II |
| 696 | Count Binary Substrings |
| 706 | Design HashMap |
| 733 | Flood Fill |
| 844 | Backspace String Compare |
| 852 | Peak Index in Mountain Array |
| 941 | Valid Mountain Array |
| 953 | Verifying an Alien Dictionary |
| 977 | Squares of a Sorted Array |
| 1005 | Maximize Sum After K Negations |
| 1064 | Fixed Point |
| 1281 | Subtract Product and Sum of Digits |
| 1378 | Replace Employee ID |
| 1385 | Distance Value Between Two Arrays |
| 1389 | Create Target Array |
| 1475 | Final Prices Special Discount |
| 1539 | Kth Missing Positive Number |
| 1603 | Design Parking System |
| 1757 | Recyclable and Low Fat Products |
| 1768 | Merge Strings Alternately |
| 1961 | Check If String Is Prefix of Array |
| 1967 | Number of Strings as Substrings |
| 2073 | Time Needed to Buy Tickets |
| 2243 | Calculate Digit Sum of a String |
| 2248 | Intersection of Multiple Arrays |
| 2828 | Check if String Is Acronym |
| 2848 | Points That Intersect With Cars |

### Medium (170+ questions)
| # | Problem | Key Topic |
|---|---------|-----------|
| 2 | Add Two Numbers | Linked List |
| 3 | Longest Substring Without Repeating Characters | Sliding Window |
| 5 | Longest Palindromic Substring | DP, String |
| 6 | ZigZag Conversion | String |
| 7 | Reverse Integer | Math |
| 8 | String to Integer (atoi) | String |
| 11 | Container With Most Water | Two Pointers |
| 15 | 3Sum | Two Pointers |
| 16 | 3Sum Closest | Two Pointers |
| 17 | Letter Combinations of Phone Number | Backtracking |
| 22 | Generate Parentheses | Backtracking |
| 24 | Swap Nodes in Pairs | Linked List |
| 31 | Next Permutation | Array |
| 33 | Search in Rotated Sorted Array | Binary Search |
| 34 | Find First and Last Position | Binary Search |
| 36 | Valid Sudoku | Matrix |
| 39 | Combination Sum | Backtracking |
| 40 | Combination Sum II | Backtracking |
| 43 | Multiply Strings | Math, String |
| 46 | Permutations | Backtracking |
| 47 | Permutations II | Backtracking |
| 48 | Rotate Image | Matrix |
| 49 | Group Anagrams | Hash Map |
| 50 | Pow(x, n) | Math |
| 53 | Maximum Subarray | DP, Kadane |
| 54 | Spiral Matrix | Matrix |
| 55 | Jump Game | Greedy |
| 56 | Merge Intervals | Intervals |
| 57 | Insert Interval | Intervals |
| 62 | Unique Paths | DP |
| 64 | Minimum Path Sum | DP |
| 71 | Simplify Path | Stack |
| 73 | Set Matrix Zeroes | Matrix |
| 74 | Search a 2D Matrix | Binary Search |
| 75 | Sort Colors | Array, Two Ptr |
| 78 | Subsets | Backtracking |
| 79 | Word Search | Backtracking, DFS |
| 80 | Remove Duplicates II | Array |
| 81 | Search Rotated Array II | Binary Search |
| 91 | Decode Ways | DP |
| 94 | Binary Tree Inorder | Tree |
| 98 | Validate BST | Tree |
| 102 | Level Order Traversal | Tree, BFS |
| 105 | Build Tree from Pre+In | Tree |
| 114 | Flatten Binary Tree | Tree |
| 122 | Buy Sell Stock II | Greedy |
| 127 | Word Ladder | BFS |
| 128 | Longest Consecutive Sequence | Hash Set |
| 130 | Surrounded Regions | DFS/BFS |
| 131 | Palindrome Partitioning | Backtracking |
| 133 | Clone Graph | Graph, DFS |
| 138 | Copy List Random Pointer | Linked List |
| 139 | Word Break | DP |
| 146 | LRU Cache | Design |
| 150 | Evaluate Reverse Polish | Stack |
| 152 | Max Product Subarray | DP |
| 153 | Find Min Rotated Array | Binary Search |
| 161 | One Edit Distance | String |
| 162 | Find Peak Element | Binary Search |
| 166 | Fraction to Recurring | Math |
| 173 | BST Iterator | Tree |
| 186 | Reverse Words II | String |
| 199 | BT Right Side View | Tree, BFS |
| 200 | Number of Islands | Graph, DFS |
| 204 | Count Primes | Math, Sieve |
| 207 | Course Schedule | Graph, Topo Sort |
| 208 | Implement Trie | Trie |
| 210 | Course Schedule II | Graph, Topo Sort |
| 211 | Add and Search Word | Trie, DFS |
| 213 | House Robber II | DP |
| 215 | Kth Largest Element | Heap, Quick Select |
| 221 | Maximal Square | DP |
| 227 | Basic Calculator II | Stack |
| 228 | Summary Ranges | Array |
| 229 | Majority Element II | Array |
| 230 | Kth Smallest in BST | Tree |
| 236 | LCA of Binary Tree | Tree |
| 238 | Product Except Self | Array |
| 240 | Search 2D Matrix II | Binary Search |
| 244 | Shortest Word Distance II | Design |
| 247 | Strobogrammatic II | Backtracking |
| 249 | Group Shifted Strings | Hash |
| 251 | Flatten 2D Vector | Design |
| 253 | Meeting Rooms II | Intervals, Heap |
| 254 | Factor Combinations | Backtracking |
| 255 | Verify Preorder BST | Stack |
| 256 | Paint House | DP |
| 264 | Ugly Number II | DP, Heap |
| 267 | Palindrome Permutation II | Backtracking |
| 274 | H-Index | Array |
| 279 | Perfect Squares | DP, BFS |
| 286 | Walls and Gates | BFS |
| 289 | Game of Life | Matrix |
| 291 | Word Pattern II | Backtracking |
| 298 | BT Longest Consecutive | Tree, DFS |
| 300 | Longest Increasing Subseq | DP |
| 311 | Sparse Matrix Multiplication | Math |
| 322 | Coin Change | DP |
| 332 | Reconstruct Itinerary | Graph, DFS |
| 334 | Increasing Triplet | Array |
| 337 | House Robber III | Tree, DP |
| 338 | Counting Bits | DP, Bit |
| 341 | Flatten Nested List Iterator | Stack, Design |
| 347 | Top K Frequent Elements | Heap, Hash |
| 348 | Design Tic-Tac-Toe | Design |
| 353 | Design Snake Game | Design |
| 355 | Design Twitter | Design |
| 362 | Design Hit Counter | Design, Queue |
| 365 | Water and Jug Problem | Math |
| 368 | Largest Divisible Subset | DP |
| 373 | Find K Pairs Smallest Sums | Heap |
| 376 | Wiggle Subsequence | DP, Greedy |
| 380 | Insert Delete GetRandom O(1) | Design |
| 384 | Shuffle an Array | Random |
| 388 | Longest Absolute File Path | Stack |
| 395 | Longest Substring K Repeating | Divide & Conquer |
| 397 | Integer Replacement | Math |
| 398 | Random Pick Index | Reservoir Sampling |
| 399 | Evaluate Division | Graph, DFS |
| 416 | Partition Equal Subset Sum | DP |
| 417 | Pacific Atlantic Water Flow | DFS/BFS |
| 424 | Longest Repeating Char Replace | Sliding Window |
| 426 | Convert BST to Sorted DLL | Tree |
| 427 | Construct Quad Tree | Recursion |
| 430 | Flatten Multilevel DLL | Linked List |
| 438 | Find All Anagrams | Sliding Window |
| 443 | String Compression | String |
| 445 | Add Two Numbers II | Linked List |
| 449 | Serialize/Deserialize BST | Tree |
| 450 | Delete Node in BST | Tree |
| 451 | Sort Chars by Frequency | Hash, Sort |
| 464 | Can I Win | DP, Bitmask |
| 468 | Validate IP Address | String |
| 473 | Matchsticks to Square | Backtracking |
| 474 | Ones and Zeroes | DP |
| 486 | Predict the Winner | DP, Game |
| 490 | The Maze | BFS/DFS |
| 497 | Random Point in Rectangles | Random |
| 503 | Next Greater Element II | Stack |
| 505 | The Maze II | BFS, Dijkstra |
| 516 | Longest Palindromic Subseq | DP |
| 518 | Coin Change 2 | DP |
| 525 | Contiguous Array | Hash, Prefix |
| 528 | Random Pick with Weight | Binary Search |
| 529 | Minesweeper | DFS/BFS |
| 535 | Encode/Decode TinyURL | Design |
| 542 | 01 Matrix | BFS |
| 545 | Boundary of Binary Tree | Tree |
| 547 | Number of Provinces | Graph, Union Find |
| 549 | BT Longest Consecutive II | Tree |
| 560 | Subarray Sum Equals K | Hash, Prefix |
| 567 | Permutation in String | Sliding Window |
| 621 | Task Scheduler | Greedy, Heap |
| 636 | Exclusive Time of Functions | Stack |
| 640 | Solve the Equation | String |
| 646 | Max Length Pair Chain | DP, Greedy |
| 647 | Palindromic Substrings | DP |
| 648 | Replace Words | Trie |
| 650 | 2 Keys Keyboard | DP |
| 652 | Find Duplicate Subtrees | Tree, Hash |
| 655 | Print Binary Tree | Tree |
| 658 | Find K Closest Elements | Binary Search |
| 662 | Max Width of Binary Tree | Tree, BFS |
| 670 | Maximum Swap | Math |
| 678 | Valid Parenthesis String | Greedy, DP |
| 681 | Next Closest Time | String |
| 686 | Repeated String Match | String |
| 690 | Employee Importance | BFS/DFS |
| 692 | Top K Frequent Words | Heap |
| 694 | Number of Distinct Islands | DFS, Hash |
| 695 | Max Area of Island | DFS |
| 721 | Accounts Merge | Union Find |
| 722 | Remove Comments | String |
| 723 | Candy Crush | Matrix |
| 729 | My Calendar I | Intervals |
| 731 | My Calendar II | Intervals |
| 735 | Asteroid Collision | Stack |
| 739 | Daily Temperatures | Stack |
| 740 | Delete and Earn | DP |
| 752 | Open the Lock | BFS |
| 767 | Reorganize String | Greedy, Heap |
| 769 | Max Chunks Sorted | Array |
| 785 | Is Graph Bipartite? | Graph |
| 787 | Cheapest Flights K Stops | Graph, DP, BFS |
| 788 | Rotated Digits | Math |
| 791 | Custom Sort String | Hash |
| 792 | Number Matching Subseq | String |
| 795 | Subarrays Bounded Max | Array |
| 802 | Find Eventual Safe States | Graph, DFS |
| 817 | Linked List Components | Linked List |
| 826 | Most Profit Assigning Work | Sort, Two Ptr |
| 837 | New 21 Game | DP |
| 855 | Exam Room | Design |
| 863 | All Nodes Distance K | Tree, BFS |
| 875 | Koko Eating Bananas | Binary Search |
| 885 | Spiral Matrix III | Matrix |
| 886 | Possible Bipartition | Graph |
| 889 | Build Tree Pre+Post | Tree |
| 909 | Snakes and Ladders | BFS |
| 918 | Max Sum Circular Subarray | DP |
| 919 | Complete BT Inserter | Tree |
| 934 | Shortest Bridge | BFS, DFS |
| 953 | Verifying Alien Dictionary | Hash |
| 954 | Array Doubled Pairs | Hash, Sort |
| 959 | Regions Cut by Slashes | Union Find |
| 962 | Max Width Ramp | Stack |
| 969 | Pancake Sorting | Array |
| 973 | K Closest Points to Origin | Heap |
| 974 | Subarray Sums Divisible K | Hash, Prefix |
| 979 | Distribute Coins in Tree | Tree, DFS |
| 981 | Time Based Key-Value Store | Binary Search, Design |
| 983 | Min Cost For Tickets | DP |
| 986 | Interval List Intersections | Two Pointers |
| 994 | Rotting Oranges | BFS |
| 1011 | Capacity To Ship Packages | Binary Search |
| 1038 | BST to Greater Sum Tree | Tree |
| 1039 | Min Score Triangulation | DP |
| 1091 | Shortest Path Binary Matrix | BFS |
| 1094 | Car Pooling | Intervals |
| 1101 | Earliest Everyone Friends | Union Find |
| 1135 | Connecting Cities Min Cost | MST |
| 1136 | Parallel Courses | Topo Sort |
| 1139 | Largest 1-Bordered Square | DP |
| 1140 | Stone Game II | DP |
| 1146 | Snapshot Array | Design |
| 1152 | Analyze User Website Visit | Hash |
| 1166 | Design File System | Design |
| 1171 | Remove Zero Sum Nodes | Linked List |
| 1188 | Design Bounded Blocking Queue | Concurrency |
| 1202 | Smallest String With Swaps | Union Find |
| 1229 | Meeting Scheduler | Intervals |
| 1244 | Design A Leaderboard | Design |
| 1293 | Shortest Path Grid Obstacles | BFS |
| 1334 | Find City Smallest Neighbors | Graph |
| 1353 | Max Events Attended | Greedy, Heap |
| 1400 | Construct K Palindromes | String |
| 1423 | Max Points from Cards | Sliding Window |
| 1428 | Leftmost Column with One | Binary Search |
| 1429 | First Unique Number | Design, Queue |
| 1438 | Longest Subarray Abs Diff Limit | Sliding Window |
| 1462 | Course Schedule IV | Graph |
| 1472 | Design Browser History | Design |
| 1519 | Nodes in Sub-Tree Same Label | Tree |
| 1552 | Magnetic Force Two Balls | Binary Search |
| 1642 | Furthest Building Can Reach | Heap, Greedy |
| 1673 | Most Competitive Subsequence | Stack |
| 1814 | Count Nice Pairs | Hash |
| 1818 | Min Absolute Sum Diff | Binary Search |
| 1820 | Max Accepted Invitations | Bipartite Matching |
| 1829 | Max XOR for Each Query | Bit |
| 1838 | Frequency Most Frequent | Sliding Window |
| 1856 | Max Subarray Min-Product | Stack |
| 1861 | Rotating the Box | Matrix |
| 1926 | Nearest Exit from Maze | BFS |
| 1968 | Array Not Equal Avg Neighbors | Array |
| 2008 | Max Earnings From Taxi | DP |
| 2043 | Simple Bank System | Design |
| 2101 | Detonate Maximum Bombs | Graph, BFS |
| 2115 | Find All Possible Recipes | Topo Sort |
| 2187 | Min Time Complete Trips | Binary Search |
| 2196 | Create BT From Descriptions | Tree |
| 2261 | K Divisible Elements Subarrays | Hash |
| 2333 | Min Sum Squared Diff | Heap |
| 2365 | Task Scheduler II | Hash |
| 2385 | Amount of Time BT Infected | Tree, BFS |
| 2467 | Most Profitable Path in Tree | Tree, DFS |
| 2502 | Design Memory Allocator | Design |
| 2537 | Count Good Subarrays | Sliding Window |
| 2555 | Maximize Win Two Segments | DP |
| 2571 | Min Ops Reduce Integer to 0 | Bit, Greedy |
| 2622 | Cache With Time Limit | JavaScript |
| 2636 | Promise Pool | JavaScript |
| 2672 | Adjacent Elements Same Color | Array |
| 2762 | Continuous Subarrays | Sliding Window |
| 2768 | Number of Black Blocks | Hash |
| 2812 | Find Safest Path in Grid | BFS, Binary Search |
| 2817 | Min Abs Diff With Constraint | Sorted Set |
| 2914 | Min Changes Binary String Beautiful | String |
| 2958 | Longest Subarray At Most K Freq | Sliding Window |
| 3023 | Find Pattern Infinite Stream I | String |
| 3034 | Subarrays Match Pattern I | Array |
| 3043 | Length of Longest Common Prefix | Trie |
| 3071 | Min Ops Write Letter Y on Grid | Matrix |
| 3073 | Max Increasing Triplet Value | Sorted Set |
| 3191 | Min Ops Binary Array Equal One I | Greedy |
| 3192 | Min Ops Binary Array Equal One II | Greedy |
| 3202 | Max Length Valid Subsequence II | DP |
| 3341 | Min Time Reach Last Room I | Graph, Dijkstra |
| 3342 | Min Time Reach Last Room II | Graph, Dijkstra |
| 3387 | Maximize Amount After Conversions | Graph, BFS |
| 3443 | Max Manhattan Distance K Changes | Math |
| 3466 | Max Coin Collection | DP |
| 3629 | Min Jumps via Prime Teleport | BFS, Math |
| 3652 | Buy Sell Stock Strategy | DP |

### Hard (85+ questions)
| # | Problem | Key Topic |
|---|---------|-----------|
| 4 | Median of Two Sorted Arrays | Binary Search |
| 10 | Regular Expression Matching | DP |
| 23 | Merge k Sorted Lists | Heap |
| 25 | Reverse Nodes in k-Group | Linked List |
| 32 | Longest Valid Parentheses | DP, Stack |
| 37 | Sudoku Solver | Backtracking |
| 41 | First Missing Positive | Array |
| 42 | Trapping Rain Water | Stack, Two Ptr |
| 45 | Jump Game II | Greedy |
| 51 | N-Queens | Backtracking |
| 68 | Text Justification | String |
| 72 | Edit Distance | DP |
| 76 | Minimum Window Substring | Sliding Window |
| 84 | Largest Rectangle in Histogram | Stack |
| 85 | Maximal Rectangle | DP, Stack |
| 97 | Interleaving String | DP |
| 99 | Recover BST | Tree |
| 124 | BT Maximum Path Sum | Tree, DFS |
| 126 | Word Ladder II | BFS, Backtrack |
| 135 | Candy | Greedy |
| 140 | Word Break II | DP, Backtrack |
| 149 | Max Points on a Line | Math |
| 154 | Find Min Rotated Array II | Binary Search |
| 158 | Read N Chars Given Read4 II | Buffer |
| 174 | Dungeon Game | DP |
| 212 | Word Search II | Trie, Backtrack |
| 214 | Shortest Palindrome | String, KMP |
| 218 | The Skyline Problem | Heap, Sweep Line |
| 224 | Basic Calculator | Stack |
| 239 | Sliding Window Maximum | Deque |
| 262 | Trips and Users | SQL |
| 269 | Alien Dictionary | Topo Sort |
| 273 | Integer to English Words | String |
| 277 | Find the Celebrity | Graph |
| 282 | Expression Add Operators | Backtracking |
| 295 | Find Median from Data Stream | Heap |
| 297 | Serialize/Deserialize BT | Tree |
| 301 | Remove Invalid Parentheses | BFS, Backtrack |
| 305 | Number of Islands II | Union Find |
| 312 | Burst Balloons | DP |
| 315 | Count Smaller After Self | BIT, Merge Sort |
| 317 | Shortest Distance All Buildings | BFS |
| 329 | Longest Increasing Path Matrix | DFS, Memo |
| 330 | Patching Array | Greedy |
| 336 | Palindrome Pairs | Trie, Hash |
| 340 | Longest Substring K Distinct | Sliding Window |
| 354 | Russian Doll Envelopes | DP, Binary Search |
| 381 | Insert Delete GetRandom Dup | Design |
| 391 | Perfect Rectangle | Math |
| 410 | Split Array Largest Sum | Binary Search, DP |
| 420 | Strong Password Checker | Greedy |
| 428 | Serialize/Deserialize N-ary | Tree |
| 432 | All O'one Data Structure | Design |
| 460 | LFU Cache | Design |
| 465 | Optimal Account Balancing | Backtracking |
| 489 | Robot Room Cleaner | DFS |
| 493 | Reverse Pairs | BIT, Merge Sort |
| 502 | IPO | Greedy, Heap |
| 514 | Freedom Trail | DP |
| 527 | Word Abbreviation | String |
| 552 | Student Attendance Record II | DP |
| 564 | Find Closest Palindrome | Math |
| 568 | Maximum Vacation Days | DP |
| 588 | Design In-Memory File System | Design |
| 591 | Tag Validator | Stack |
| 601 | Human Traffic Stadium | SQL |
| 642 | Design Search Autocomplete | Trie, Design |
| 664 | Strange Printer | DP |
| 668 | Kth Smallest Multiplication Table | Binary Search |
| 679 | 24 Game | Backtracking |
| 699 | Falling Squares | Segment Tree |
| 710 | Random Pick with Blacklist | Hash |
| 730 | Count Different Palindromic Subseq | DP |
| 741 | Cherry Pickup | DP |
| 757 | Set Intersection Size At Least 2 | Greedy |
| 759 | Employee Free Time | Heap, Intervals |
| 772 | Basic Calculator III | Stack |
| 773 | Sliding Puzzle | BFS |
| 778 | Swim in Rising Water | BFS, Binary Search |
| 780 | Reaching Points | Math |
| 805 | Split Array Same Average | DP, Bitmask |
| 815 | Bus Routes | BFS |
| 827 | Making A Large Island | DFS, Union Find |
| 829 | Consecutive Numbers Sum | Math |
| 834 | Sum of Distances in Tree | Tree, DP |
| 864 | Shortest Path to Get All Keys | BFS, Bitmask |
| 895 | Maximum Frequency Stack | Stack, Hash |
| 924 | Minimize Malware Spread | Union Find |
| 928 | Minimize Malware Spread II | Union Find |
| 936 | Stamping The Sequence | Greedy |
| 968 | Binary Tree Cameras | Tree, DP |
| 992 | Subarrays K Different Integers | Sliding Window |
| 1000 | Min Cost Merge Stones | DP |
| 1235 | Max Profit in Job Scheduling | DP, Binary Search |
| 1278 | Palindrome Partitioning III | DP |
| 1293 | Shortest Path Grid Obstacles | BFS |
| 1326 | Min Taps to Water Garden | Greedy |
| 1368 | Min Cost Valid Path in Grid | BFS, 0-1 BFS |
| 1463 | Cherry Pickup II | DP |
| 1489 | Critical/Pseudo-Critical Edges MST | Union Find |
| 1579 | Remove Max Edges Keep Traversable | Union Find |
| 1627 | Graph Connectivity Threshold | Union Find |
| 1719 | Ways to Reconstruct A Tree | Tree |
| 2009 | Min Ops Make Array Continuous | Sliding Window |
| 2076 | Process Restricted Friend Requests | Union Find |
| 2092 | Find All People With Secret | Union Find |
| 2158 | Amount New Area Painted | Segment Tree |
| 2163 | Min Diff Sums After Removal | Heap |
| 2197 | Replace Non-Coprime Numbers | Stack, Math |
| 2246 | Longest Path Different Adjacent | Tree, DFS |
| 2251 | Flowers in Full Bloom | Binary Search |
| 2258 | Escape Spreading Fire | BFS |
| 2276 | Count Integers in Intervals | Segment Tree |
| 2282 | People Seen in Grid | Stack |
| 2296 | Design a Text Editor | Design |
| 2307 | Contradictions in Equations | Graph |
| 2402 | Meeting Rooms III | Heap |
| 2444 | Count Subarrays Fixed Bounds | Sliding Window |
| 2468 | Split Message Based on Limit | Binary Search |
| 2484 | Count Palindromic Subseq | DP |
| 2493 | Divide Nodes Max Groups | Graph, BFS |
| 2503 | Max Points Grid Queries | Union Find, BFS |
| 2508 | Add Edges Make Degrees Even | Graph |
| 2551 | Put Marbles in Bags | Greedy |
| 2561 | Rearranging Fruits | Greedy |
| 2603 | Collect Coins in Tree | Tree |
| 2791 | Count Palindrome Paths Tree | Tree, Bitmask |
| 2858 | Min Edge Reversals All Reachable | Tree, BFS |
| 2912 | Ways to Reach Destination Grid | DP |
| 3027 | Find Pattern Infinite Stream II | String |
| 3045 | Count Prefix Suffix Pairs II | Trie |
| 3161 | Block Placement Queries | Segment Tree |
| 3235 | Rectangle Corner Reachable | Geometry |

---

# 4. Uber India HLD / System Design Questions

## Most Frequently Asked (ranked by frequency)

### Uber-Domain Specific (asked very frequently — know your domain!)

| # | Question | Level | Years | Key Focus Areas |
|---|----------|-------|-------|-----------------|
| 1 | **Design Uber (Ride-Sharing/Cab Booking)** | SDE2-3 | 2020-25 | Matching algorithm, geospatial (H3/Geohash), ETA, surge, real-time tracking |
| 2 | **Design Real-Time Location Tracking** | SDE2-3 | 2022-25 | Millions of GPS pings/sec, geospatial indexing, partitioning, pub-sub |
| 3 | **Design Uber Eats (Food Delivery)** | SDE2-3 | 2021-25 | Restaurant discovery, order lifecycle, delivery assignment, ETA |
| 4 | **Design Surge Pricing System** | SDE3/Staff | 2022-25 | Real-time supply-demand, geospatial heatmaps, dynamic pricing, fairness |
| 5 | **Design Driver Onboarding System** | SDE2 | 2023-25 | Document verification, state machine, async processing, retry |
| 6 | **Design Trip Pricing Engine** | Senior/Staff | 2024-25 | Dynamic pricing, fare estimation, promotions, multi-currency |

### General Infrastructure (asked frequently)

| # | Question | Level | Years | Key Focus Areas |
|---|----------|-------|-------|-----------------|
| 7 | **Design a Notification System** | SDE2-3 | 2022-25 | Multi-channel, priority, retry, templating, rate limiting |
| 8 | **Design a Rate Limiter** | SDE2-3 | 2021-25 | Token bucket, sliding window, distributed (Redis-based) |
| 9 | **Design a Distributed Task Scheduler** | SDE2-3 | 2023-25 | Cron at scale, exactly-once, fault tolerance, priority queues |
| 10 | **Design a Payment System** | SDE2-3 | 2022-25 | Idempotency, double-entry, saga, reconciliation |
| 11 | **Design a Chat/Messaging System** | SDE2-3 | 2021-25 | Real-time, message ordering, read receipts, offline delivery |
| 12 | **Design a Distributed Cache** | SDE2-3 | 2022-24 | Consistent hashing, eviction, replication, hot keys |
| 13 | **Design Google Maps / Navigation** | SDE2-3 | 2022-25 | Dijkstra/A*, map tiling, live traffic, ETA |
| 14 | **Design a Pub-Sub / Message Queue** | SDE3 | 2022-25 | Partitions, consumer groups, ordering, at-least-once |
| 15 | **Design an API Gateway** | SDE2-3 | 2023-25 | Routing, auth, rate limiting, circuit breaking |

### Also Asked

| # | Question | Level | Years |
|---|----------|-------|-------|
| 16 | Design a URL Shortener | SDE1-2 | 2020-23 |
| 17 | Design a Logging/Monitoring System | SDE2-3 | 2023-25 |
| 18 | Design Metrics/Analytics Dashboard | SDE2-3 | 2023 |
| 19 | Design Search Autocomplete | SDE2 | 2021-23 |
| 20 | Design a Distributed Lock Service | SDE3/Staff | 2023-25 |
| 21 | Design a CDN | SDE3 | 2023 |
| 22 | Design a Fraud Detection System | SDE3 | 2023-25 |
| 23 | Design a Search System (restaurant/driver) | SDE2-3 | 2022-25 |
| 24 | Design a Leaderboard | SDE2 | 2022 |
| 25 | Design Feature Flags / Config Management | SDE2-3 | 2023-25 |
| 26 | Design a Workflow/Orchestration Engine (Cadence/Temporal) | SDE3/Staff | 2023-25 |
| 27 | Design a Real-Time Analytics Pipeline | SDE3 | 2024 |

### What Uber Interviewers Focus On
- **Capacity estimation** — They expect QPS, storage, bandwidth math upfront
- **Uber tech awareness** — Knowing H3, Cadence, Kafka usage at Uber is a plus
- **Trade-off discussions** — CAP theorem, consistency vs availability probed heavily
- **API design first** — Many rounds start with "define the APIs first"
- **Database choice justification** — WHY you chose SQL vs NoSQL
- **Failure handling** — "What happens when X fails?" is a guaranteed follow-up
- **Real-time vs batch** — Uber systems need real-time; test streaming understanding

---

# 5. Uber India LLD / Machine Coding Questions

## Top 10 Most Frequently Asked (by report frequency)

| Rank | Question | Level | Time | Sources |
|------|----------|-------|------|---------|
| 1 | **Design a Parking Lot** | SDE1-2 | 90 min | GFG, Glassdoor, Reddit — MOST REPORTED |
| 2 | **Design a Ride-Sharing System** | SDE2-3 | 90 min | GFG, Glassdoor, Blind — domain relevant |
| 3 | **Design Snake and Ladder** | SDE1-2 | 60 min | GFG, Glassdoor, Coding Ninjas |
| 4 | **Design an Elevator System** | SDE2-3 | 90 min | GFG, LeetCode Discuss, Glassdoor |
| 5 | **Design Splitwise (Expense Sharing)** | SDE2 | 90 min | GFG, LeetCode Discuss — rising frequency |
| 6 | **Design Food Delivery (Uber Eats)** | SDE2-3 | 90 min | Glassdoor, Blind — domain relevant |
| 7 | **Design a Rate Limiter** | SDE2-3 | 60 min | Glassdoor, Blind |
| 8 | **Design a Cache (LRU/LFU)** | SDE2 | 60 min | LeetCode Discuss, Glassdoor |
| 9 | **Design Pub-Sub / Message Queue** | SDE3 | 90 min | Glassdoor, Blind |
| 10 | **Design Pricing/Surge Engine** | SDE2-3 | 90 min | Glassdoor, Blind — Uber specific |

## Complete List (30 questions)

| # | Question | Patterns Used | Level |
|---|----------|--------------|-------|
| 1 | Parking Lot System | Strategy (pricing), Factory (vehicle), Observer, Singleton | SDE1-2 |
| 2 | Ride-Sharing / Cab Booking | Strategy (fare), State (trip), Observer (notifications) | SDE2-3 |
| 3 | Snake and Ladder Game | Factory, Strategy (dice), Observer | SDE1-2 |
| 4 | Elevator System | Strategy (scheduling), State, Observer, Command | SDE2-3 |
| 5 | Splitwise Expense Sharing | Strategy (split type), Observer | SDE2 |
| 6 | Food Delivery System | State (order), Strategy (assignment), Observer | SDE2-3 |
| 7 | Rate Limiter | Strategy (algorithm), Decorator | SDE2-3 |
| 8 | LRU/LFU Cache | Strategy (eviction), Decorator, Proxy | SDE2 |
| 9 | Pub-Sub Messaging System | Observer, Command, Strategy | SDE3 |
| 10 | Pricing/Surge Engine | Strategy (pricing), Chain of Responsibility | SDE2-3 |
| 11 | Logging Framework | Singleton, Chain of Responsibility, Strategy | SDE1-2 |
| 12 | Notification System | Observer, Strategy, Factory, Template | SDE2 |
| 13 | Task/Job Scheduler | Priority Queue, Strategy, State | SDE2-3 |
| 14 | Chess Game | Template Method, Factory, Command, Observer | SDE2 |
| 15 | Vending Machine | State, Strategy (payment) | SDE1-2 |
| 16 | Movie Ticket Booking | Strategy (pricing), Observer, State | SDE2 |
| 17 | Library Management | Repository, Observer, Strategy | SDE1-2 |
| 18 | Tic-Tac-Toe | Strategy (AI), Factory | SDE1-2 |
| 19 | In-Memory File System | Composite, Iterator, Visitor | SDE2 |
| 20 | URL Shortener (LLD) | Factory, Strategy (encoding) | SDE2 |
| 21 | Calendar / Meeting Scheduler | Intervals, Observer, Strategy | SDE2-3 |
| 22 | Hotel Booking System | State (room), Strategy (pricing) | SDE2 |
| 23 | ATM System | State, Chain of Responsibility | SDE1-2 |
| 24 | Feature Flag System | Chain of Responsibility, Strategy | SDE3 |
| 25 | Card Game Framework | Template Method, Strategy, Factory | SDE1-2 |
| 26 | HashMap from Scratch | N/A — pure implementation | SDE1-2 |
| 27 | Digital Wallet / Payment | State, Strategy, Command | SDE2 |
| 28 | Online Auction System | Observer, State | SDE2 |
| 29 | Traffic Signal Control | State, Observer | SDE2 |
| 30 | Multi-threaded Web Crawler | Producer-Consumer, Thread Pool | SDE2-3 |

## Specific Interview Experiences

| Source | Role/Location/Year | LLD Question | Details |
|--------|--------------------|-------------|---------|
| GFG | SDE2 Bangalore 2024 | Notification delivery system | Multi-channel, priority, retry, template |
| GFG | SDE2 Bangalore 2023 | Parking Lot | 90 min, Java, follow-up: EV charging spots + dynamic pricing |
| GFG | SDE2 Bangalore 2022 | Snake and Ladder | 60 min code + 15 min discussion |
| GFG | SDE2 Hyderabad 2023 | Splitwise | 90 min, equal/exact/percentage splits, debt simplification |
| GFG | SDE3 Bangalore 2024 | Ride-matching/dispatch | Strategy for matching: nearest, highest-rated, ETA-based |
| Glassdoor | SDE2 Bangalore 2023 | Elevator System | 90 min, SCAN algorithm, multiple elevators |
| Glassdoor | SDE2 Bangalore 2024 | Rate Limiter | 60 min, token bucket + sliding window, strategy pattern |
| Glassdoor | SDE3 Bangalore 2024 | Pub-Sub messaging | 90 min, consumer groups, ordering, retry |
| LeetCode | SDE2 India 2023 | LRU Cache with TTL | 60 min, generics + thread safety |
| LeetCode | SDE2 India 2022 | Food delivery system | 90 min, full order lifecycle |
| Blind | SDE3 Bangalore 2024 | Feature flag system | 90 min, rule-based targeting, extensibility |
| Blind | SDE2 Bangalore 2023 | Calendar/Meeting scheduler | 60 min, overlap detection, recurring events |
| Reddit | SDE2 India 2023 | Parking Lot | 90 min, heavy focus on SOLID, mid-round extension |

## LLD Evaluation Criteria at Uber India

| Criteria | Weight | What They Look For |
|----------|--------|-------------------|
| Requirement gathering | 10% | Do you ask clarifying questions first? |
| Class design / OOP | 25% | Proper entities, relationships, responsibilities |
| SOLID adherence | 20% | SRP, OCP, LSP, ISP, DIP in practice |
| Design patterns | 15% | Appropriate (not forced) pattern usage |
| Code quality | 15% | Clean, readable, well-named, well-structured |
| Working solution | 10% | Code should compile and ideally run with demo |
| Extensibility | 5% | "How would you extend this?" mid-round follow-up |

---

# 6. Uber Internal Systems → Interview Question Mapping

Uber interviewers often ask questions that map directly to their internal infrastructure. Knowing these gives you context advantage:

| Uber System | What It Does | Likely Interview Question |
|-------------|-------------|--------------------------|
| **H3** | Hexagonal hierarchical spatial index | Design a geospatial indexing system |
| **Cadence / Temporal** | Workflow orchestration engine | Design a workflow orchestration engine |
| **Ringpop** | Consistent hashing library | Design a consistent hashing ring |
| **Schemaless** | MySQL-backed NoSQL store | Design a scalable key-value store |
| **Peloton** | Unified resource scheduler | Design a distributed resource scheduler |
| **Cherami** | Durable message queue | Design a durable message queue |
| **M3** | Metrics platform | Design a time-series metrics system |
| **uReplicator** | Kafka cross-DC replication | Design cross-datacenter replication |
| **ADAM** | ML platform | Design an ML model serving platform |
| **Marketplace** | Trip matching engine | Design a ride matching system |
| **Fulfillment** | Trip lifecycle management | Design a trip/order lifecycle system |
| **Michelangelo** | ML platform | Design a feature store |

---

# 7. DSA Topics & Pattern Analysis

## Topic Frequency Distribution (based on 300+ Uber questions)

### Tier 1 — Most Frequently Asked (70%+ of interviews)

| Topic | Approximate % | Priority |
|-------|-------------|----------|
| **Graphs (BFS/DFS/Topo Sort/Union Find)** | 22% | HIGHEST |
| **Arrays & Strings** | 15% | HIGHEST |
| **Trees (Binary, BST, N-ary)** | 15% | HIGHEST |
| **Hash Tables (frequency counting, index mapping)** | 12% | HIGHEST |

### Tier 2 — Very Common (50-70%)

| Topic | Approximate % | Priority |
|-------|-------------|----------|
| **Dynamic Programming** | 14% | HIGH |
| **Sliding Window / Two Pointers** | 8% | HIGH |
| **Binary Search** | 8% | HIGH |
| **Heaps / Priority Queues** | 4% | HIGH |

### Tier 3 — Regularly Asked (30-50%)

| Topic | Priority |
|-------|----------|
| **Linked Lists** (cycle, merge, deep copy) | MEDIUM |
| **Intervals** (merge, meeting rooms) | MEDIUM |
| **Backtracking** (word search, combos) | MEDIUM |
| **Union-Find** (connected components) | MEDIUM |
| **Stack / Queue / Monotonic** | MEDIUM |

### Tier 4 — Advanced / Occasional

| Topic | Priority |
|-------|----------|
| **Segment Trees** (range queries — reported in Hard rounds) | LOW |
| **Tries** (autocomplete, prefix) | LOW |
| **Math / Bit Manipulation** | LOW |

## Key Insight: Uber Loves Graphs

Uber's core product is about **routes, maps, and connections** — which is why graph problems dominate:

| Pattern | Uber Relevance | Example Problems |
|---------|---------------|-----------------|
| **BFS on implicit graphs** | Routes, dispatch, maps | Bus Routes, Word Ladder, Open the Lock |
| **Dijkstra / A*** | Routing, ETA calculation | Cheapest Flights Within K Stops, Network Delay Time |
| **Topological Sort** | Dependency resolution | Alien Dictionary, Course Schedule |
| **Union-Find** | Connectivity, clustering | Number of Islands II, Accounts Merge |
| **Sliding Window + Deque** | Real-time analytics | Longest Subarray Abs Diff <= Limit |
| **Weighted Random Selection** | Dispatch fairness | Random Pick with Weight |
| **Interval Scheduling** | Driver availability | Meeting Rooms II |
| **Geohashing / Spatial** | Driver location, proximity | K-nearest neighbors, coordinate problems |

## Uber-Specific Algorithmic Themes

Given Uber's business domain (maps, routing, real-time dispatch):
- **Graph shortest path** (Dijkstra/A*) — Road network routing, ETA
- **Geohashing / Spatial indexing** (S2 cells, quadtrees) — Proximity queries
- **K-nearest neighbors** — Finding nearest drivers
- **Stream processing patterns** — Real-time demand, surge pricing
- **Rate limiting** — API protection at scale
- **Interval scheduling** — Driver availability management
- **Real-time data structures** — Hit counters, LRU Cache, sliding windows

## Difficulty Distribution

| Difficulty | All-Time (~300) | In Interviews |
|-----------|----------------|---------------|
| **Easy** | ~18% (~55) | ~7% |
| **Medium** | ~55% (~170) | ~73% |
| **Hard** | ~27% (~85) | ~20% |

**Key**: Medium problems form the overwhelming bulk of actual interviews. OA has progressive difficulty (Q1-2 Easy/Medium, Q3-4 Medium-Hard/Hard).

## Top 50 Most Asked Problems (Cross-Referenced from All Sources)

| # | Problem | LC# | Difficulty | Key Topic |
|---|---------|-----|-----------|-----------|
| 1 | Design Hit Counter | 362 | Medium | Design, Queue |
| 2 | Number of Islands | 200 | Medium | DFS/BFS |
| 3 | Number of Islands II | 305 | Hard | Union-Find |
| 4 | Bus Routes | 815 | Hard | BFS implicit graph |
| 5 | Alien Dictionary | 269 | Hard | Topo Sort |
| 6 | LRU Cache | 146 | Medium | Hash + Linked List |
| 7 | Top K Frequent Elements | 347 | Medium | Heap/Hash |
| 8 | Evaluate Division | 399 | Medium | Graph DFS |
| 9 | Construct Quad Tree | 427 | Medium | Divide & Conquer |
| 10 | Random Pick with Weight | 528 | Medium | Prefix Sum + Bin Search |
| 11 | Longest Subarray Abs Diff <= Limit | 1438 | Medium | Sliding Window + Deque |
| 12 | Squares of a Sorted Array | 977 | Easy | Two Pointers |
| 13 | Making A Large Island | 827 | Hard | DFS + Union Find |
| 14 | Course Schedule | 207 | Medium | Topo Sort |
| 15 | Two Sum | 1 | Easy | Hash Map |
| 16 | Merge Intervals | 56 | Medium | Sorting/Intervals |
| 17 | Kth Smallest in BST | 230 | Medium | Tree Traversal |
| 18 | Product of Array Except Self | 238 | Medium | Prefix/Suffix |
| 19 | Container With Most Water | 11 | Medium | Two Pointers |
| 20 | Longest Substring Without Repeating | 3 | Medium | Sliding Window |
| 21 | Serialize/Deserialize Binary Tree | 297 | Hard | Tree/DFS |
| 22 | Find Median from Data Stream | 295 | Hard | Two Heaps |
| 23 | Meeting Rooms II | 253 | Medium | Heap/Intervals |
| 24 | Clone Graph | 133 | Medium | Graph BFS/DFS |
| 25 | Basic Calculator II | 227 | Medium | Stack/Parsing |
| 26 | Trapping Rain Water | 42 | Hard | Two Pointers/Stack |
| 27 | Cheapest Flights K Stops | 787 | Medium | Dijkstra/BFS |
| 28 | Max Points from Cards | 1423 | Medium | Sliding Window |
| 29 | Coin Change | 322 | Medium | DP |
| 30 | Word Search | 79 | Medium | Backtracking/DFS |
| 31 | Spiral Matrix | 54 | Medium | Matrix |
| 32 | Binary Tree Right Side View | 199 | Medium | BFS |
| 33 | Longest Repeating Char Replace | 424 | Medium | Sliding Window |
| 34 | Word Search II | 212 | Hard | Trie + Backtrack |
| 35 | Task Scheduler | 621 | Medium | Greedy + Heap |
| 36 | Maximum Subarray (Kadane's) | 53 | Medium | DP/Greedy |
| 37 | Word Break | 139 | Medium | DP |
| 38 | Copy List Random Pointer | 138 | Medium | Linked List |
| 39 | Kth Largest Element | 215 | Medium | Heap/Quickselect |
| 40 | Insert Delete GetRandom O(1) | 380 | Medium | Design |
| 41 | Decode Ways | 91 | Medium | DP |
| 42 | Time Based Key-Value Store | 981 | Medium | Binary Search/Design |
| 43 | Combination Sum | 39 | Medium | Backtracking |
| 44 | Network Delay Time | 743 | Medium | Dijkstra |
| 45 | Split Array Largest Sum | 410 | Hard | Binary Search/DP |
| 46 | Shortest Bridge | 934 | Medium | BFS + DFS |
| 47 | Find All People With Secret | 2092 | Hard | Union Find/Sort |
| 48 | Boundary of Binary Tree | 545 | Medium | Tree DFS |
| 49 | Open the Lock | 752 | Medium | BFS |
| 50 | Min Edge Reversals All Reachable | 2858 | Hard | Tree/BFS |

---

# 8. Interview Tips & Evaluation Criteria

## DSA Rounds
- Think out loud — Uber values communication
- Start with brute force, then optimize
- Clarify constraints before coding (input size, edge cases)
- Test your code with examples
- Time complexity analysis mandatory

## LLD Round
- Spend first 5-10 min on requirements clarification
- Draw class diagram (even mentally) before coding
- Use interfaces everywhere (DIP)
- Don't force patterns — use only where natural
- Keep a Main/Driver class for demo
- Expect mid-round extensions: "How would you add X?"

## HLD Round
- Follow the 4-step framework (Requirements → High-Level → Deep Dive → Wrap Up)
- Always do capacity estimation
- Define APIs early
- Justify every technology choice (WHY not just WHAT)
- Discuss failure scenarios proactively
- Mention Uber-specific tech when relevant (H3, Cadence, Kafka)

## Behavioral Round (Bar Raiser)
- Use STAR method (Situation, Task, Action, Result)
- Prepare stories about: technical leadership, conflict resolution, handling ambiguity, delivering under pressure
- Uber values: ownership, "big bold bets", customer obsession

---

# 9. Preparation Roadmap (8-Week Plan)

## Week 1-2: DSA Foundation + Easy/Medium
- [ ] Solve Top 30 Easy Uber questions
- [ ] Solve Top 40 Medium Uber questions (focus: Arrays, Strings, Hash)
- [ ] Master: Two Pointers, Sliding Window, Binary Search patterns
- [ ] Review: SOLID principles, top 10 design patterns

## Week 3-4: Graphs + Trees (Uber's Favorites)
- [ ] All Uber Graph questions (BFS, DFS, Topo Sort, Union Find)
- [ ] All Uber Tree questions (traversals, LCA, path problems)
- [ ] Practice: Dijkstra, Bellman-Ford, A* for map/routing problems
- [ ] LLD Practice: Parking Lot, Snake & Ladder, Tic-Tac-Toe

## Week 5-6: DP + Hard Problems + HLD
- [ ] All Uber DP questions (focus: interval DP, string DP, game DP)
- [ ] Top 20 Hard Uber questions
- [ ] HLD Practice: Design Uber, Design Notification System, Design Rate Limiter
- [ ] LLD Practice: Elevator, Splitwise, Pub-Sub

## Week 7-8: Mock Interviews + Polish
- [ ] 4 mock DSA rounds (timed 45 min each)
- [ ] 2 mock LLD rounds (timed 90 min each)
- [ ] 2 mock HLD rounds (timed 45 min each)
- [ ] Review: Uber internal systems mapping, behavioral stories
- [ ] HLD Practice: Design Payment System, Design Task Scheduler, Design Google Maps
- [ ] LLD Practice: Rate Limiter, Cache, Feature Flags

---

# Sources

## GitHub Repos (LeetCode Company Data)
- `snehasishroy/leetcode-companywise-interview-questions` (Feb 2026 — most recent)
- `krishnadey30/LeetCode-Questions-CompanyWise` (all-time)
- `liquidslr/interview-company-wise-problems` (June 2025)
- `dataengineervishal/leetcode-companywise-questions` (Nov 2025)

## Interview Experience Platforms
- GeeksforGeeks — "Uber Interview Experience" (most India-specific data)
- Glassdoor — "Uber Bangalore/Hyderabad Reviews"
- LeetCode Discuss — Uber tag
- Blind/TeamBlind — Uber posts
- Reddit r/developersIndia
- Verve Copilot, Interview Solver, CodingKaro

## Uber Engineering Blog
- eng.uber.com — for understanding their tech stack and internal systems

## Interview Experience Articles
- Uber SDE-2 L4 India Interview Experience — Roundz Substack
- Uber SDE 1 Interview Experience — Medium (Shubham Aggarwal)
- Uber L4 SDE2 Backend Dec 2024 — Medium (Laxman Kumar)
- Uber L5A Sr. SWE Interview — Medium (Rajat Goyal)
- Uber LLD Questions Recent — Medium (Prashant)
- Uber Interview Questions — InterviewBit
- Top Uber DSA Interview Questions 2025 — GetSDEReady
- Uber OA Breakdown — Lodely
- Uber Coding Interview Guide — CodingInterview.com
- Uber HackerRank OA Experience 2025 — LinkJob
- Uber Interview Process 2026 — TechPrep
- Uber Technical Interview Complete Guide 2026 — Jobright
- Uber Software Engineer Interview Guide 2026 — InterviewQuery
- Glassdoor Uber India Interview Questions

## Recommended Study Resources
- **Striver's A-Z DSA Sheet** — comprehensive pattern coverage
- **LeetCode Blind 75 / Grind 75** — core problems
- **Grokking the System Design Interview** — HLD prep
- **ByteByteGo** — visual system design
- **DDIA (Designing Data-Intensive Applications)** — deep distributed systems

---

> **Total: 300+ LeetCode questions (with frequency data), 27 HLD questions, 30+ LLD questions, Top 50 most-asked ranked list, mapped to Uber's internal systems, with 8-week prep roadmap. This is the most comprehensive Uber interview prep document available.**
