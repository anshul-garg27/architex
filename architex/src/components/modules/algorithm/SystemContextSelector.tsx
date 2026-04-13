"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlgorithmConfig } from "@/lib/algorithms";
import LatencyBridgePanel from "@/components/modules/algorithm/LatencyBridgePanel";

// ── Algorithm-to-System Context Mapping ──────────────────────

interface SystemContext {
  system: string;
  role: string;
  description: string;
}

const ALGORITHM_CONTEXTS: Record<string, SystemContext[]> = {
  "bubble-sort": [
    { system: "Education Platform", role: "Teaching tool", description: "Used to demonstrate O(n^2) behavior and why better algorithms exist. Every CS101 course starts here." },
    { system: "Embedded Systems", role: "Small-list sorting", description: "For tiny fixed-size arrays (< 20 elements), bubble sort's simplicity and zero memory overhead makes it viable." },
  ],
  "insertion-sort": [
    { system: "Python / Timsort", role: "Small-run optimization", description: "Timsort (used in Python, Java, V8) switches to Insertion Sort for runs smaller than 32-64 elements." },
    { system: "Online Systems", role: "Nearly-sorted stream", description: "When data arrives almost sorted (e.g., timestamped logs), insertion sort runs in nearly O(n) time." },
  ],
  "selection-sort": [
    { system: "Memory-constrained Device", role: "Minimal writes", description: "Makes exactly n swaps regardless of input -- useful when writes to storage are expensive (flash memory, EEPROM)." },
  ],
  "merge-sort": [
    { system: "Python Runtime", role: "Timsort foundation", description: "Python's list.sort() uses Timsort, a hybrid of Merge Sort + Insertion Sort optimized for real-world data." },
    { system: "Database Engine", role: "External sorting", description: "When data doesn't fit in memory, merge sort's sequential access pattern is ideal for disk-based sorting." },
    { system: "Git", role: "Merge operations", description: "Git's merge algorithm is fundamentally a 3-way merge sort on file diffs." },
  ],
  "merge-sort-bottom-up": [
    { system: "Embedded Systems", role: "Non-recursive sort", description: "Bottom-up merge sort avoids recursion overhead -- critical in stack-constrained embedded environments." },
  ],
  "quick-sort": [
    { system: "C Standard Library", role: "qsort() implementation", description: "The most widely used sorting algorithm in system libraries. GCC's qsort uses introsort (quick sort + heap sort fallback)." },
    { system: "Database Query Engine", role: "In-memory sorting", description: "Used when query results need sorting and data fits in memory -- ORDER BY on indexed columns." },
    { system: "V8 Engine", role: "Array.prototype.sort()", description: "Chrome's V8 used quicksort for arrays > 10 elements until switching to Timsort in 2019." },
  ],
  "quick-sort-hoare": [
    { system: "HPC / Scientific Computing", role: "Cache-friendly partition", description: "Hoare's partition does ~3x fewer swaps than Lomuto's, improving cache performance on large numerical datasets." },
  ],
  "heap-sort": [
    { system: "Linux Kernel", role: "Guaranteed O(n log n)", description: "Used where worst-case guarantees matter and O(1) extra space is required. Linux's sort_r uses introsort with heap sort fallback." },
    { system: "Priority Queue Systems", role: "Event scheduling", description: "Operating system schedulers use heap-based priority queues to pick the next process/thread to run." },
  ],
  "counting-sort": [
    { system: "Redis", role: "Sorted set rankings", description: "When scores are integers in a bounded range, counting sort provides O(n+k) ranking computation." },
  ],
  "radix-sort": [
    { system: "Database Indexing", role: "Integer key sorting", description: "Radix sort on fixed-width integer keys outperforms comparison sorts for large datasets with bounded key ranges." },
    { system: "Network Packet Processing", role: "IP address sorting", description: "Sorting packets by IP prefix uses radix sort on 32-bit addresses for routing table construction." },
  ],
  "tim-sort": [
    { system: "Python / Java / V8", role: "Default sort", description: "The standard sort in Python, Java's Arrays.sort() for objects, and Chrome V8. Optimized for partially-ordered real-world data." },
  ],
  "shell-sort": [
    { system: "uClibc / Embedded Linux", role: "Lightweight sort", description: "Shell sort is used in embedded C libraries where code size matters more than optimal big-O." },
  ],
  "bucket-sort": [
    { system: "Graphics Pipeline", role: "Depth sorting", description: "Z-buffer rendering uses bucket sort to order polygons by depth when values are uniformly distributed in [0, 1]." },
  ],
  "bfs": [
    { system: "Social Network", role: "Friend suggestions", description: "BFS from your profile finds people N connections away -- LinkedIn's 'People You May Know' is BFS at scale." },
    { system: "Web Crawler", role: "Page discovery", description: "Googlebot uses BFS to explore the web level by level, discovering all pages at each link depth." },
    { system: "Network Broadcasting", role: "Flood fill", description: "Network switches use BFS-based flooding to propagate routing updates across a LAN segment." },
  ],
  "dfs": [
    { system: "Compiler", role: "Syntax tree traversal", description: "Compilers use DFS to walk the AST for type checking, optimization passes, and code generation." },
    { system: "Garbage Collector", role: "Reachability analysis", description: "Mark-and-sweep GC uses DFS from root references to find all reachable objects." },
    { system: "Maze Solver / Game AI", role: "Path exploration", description: "DFS explores deep paths first -- used in procedural maze generation and game tree search." },
  ],
  "dfs-iterative": [
    { system: "Large-Scale Graph Processing", role: "Stack-safe DFS", description: "Iterative DFS avoids stack overflow on deep graphs (millions of nodes) -- used in production graph engines." },
  ],
  "dijkstra": [
    { system: "Google Maps", role: "Route planning", description: "Finds shortest driving routes using road network as weighted graph. Real implementations use A* with Dijkstra as fallback." },
    { system: "Network Router (OSPF)", role: "Packet routing", description: "OSPF protocol uses Dijkstra to compute shortest paths between routers in an autonomous system." },
    { system: "Game Pathfinding", role: "NPC movement", description: "Strategy games use Dijkstra on terrain cost maps to move units along optimal paths." },
  ],
  "a-star": [
    { system: "Google Maps", role: "Heuristic routing", description: "A* with geographic distance heuristic explores far fewer nodes than Dijkstra for point-to-point routing." },
    { system: "Robotics", role: "Motion planning", description: "Autonomous robots use A* on discretized configuration space to plan collision-free paths." },
    { system: "Video Games", role: "Real-time pathfinding", description: "Most commercial games use A* (often with JPS optimization) for real-time character navigation." },
  ],
  "bellman-ford": [
    { system: "BGP Routing", role: "Internet backbone", description: "The Border Gateway Protocol uses Bellman-Ford to handle path costs that can change (including negative adjustments)." },
    { system: "Currency Arbitrage", role: "Negative cycle detection", description: "Detecting negative cycles in exchange rate graphs reveals profitable arbitrage opportunities." },
  ],
  "kruskal": [
    { system: "Network Design", role: "Minimum wiring", description: "Designing the cheapest network of cables/fibers connecting all buildings -- classic MST application." },
    { system: "Image Segmentation", role: "Graph-based clustering", description: "Kruskal's on pixel similarity graphs creates efficient image segmentation (Felzenszwalb's algorithm)." },
  ],
  "prims": [
    { system: "Network Planning", role: "Dense graph MST", description: "Prim's is preferred over Kruskal's for dense graphs (like full mesh networks) due to better cache behavior." },
  ],
  "topological-sort": [
    { system: "Build System (Make/Bazel)", role: "Dependency ordering", description: "Compiling source files in correct order -- topological sort on the dependency graph." },
    { system: "Package Manager (npm/pip)", role: "Install order", description: "Resolving and installing dependencies in the right order so each package's deps are ready first." },
    { system: "Spreadsheet Engine", role: "Cell evaluation", description: "Excel/Google Sheets uses topological sort to determine which cells to recalculate first when a value changes." },
  ],
  "topological-sort-kahn": [
    { system: "CI/CD Pipeline", role: "Stage ordering", description: "Kahn's algorithm naturally computes the maximum parallelism available in a build pipeline." },
  ],
  "floyd-warshall": [
    { system: "Network Monitoring", role: "All-pairs latency", description: "Computing latency between every pair of data centers for traffic engineering and failover planning." },
  ],
  "tarjan-scc": [
    { system: "Compiler Optimization", role: "Loop detection", description: "Finding strongly connected components in the control flow graph identifies loops for optimization." },
    { system: "Dependency Analysis", role: "Circular dependency detection", description: "Package managers use Tarjan's to detect circular dependencies that would cause infinite install loops." },
  ],
  "cycle-detection": [
    { system: "Deadlock Detector", role: "Resource cycle finding", description: "Operating systems detect deadlocks by finding cycles in the resource allocation graph." },
    { system: "Garbage Collector", role: "Reference cycle detection", description: "Python's GC uses cycle detection to reclaim memory from circular references that reference counting misses." },
  ],
  "bipartite": [
    { system: "Job Scheduling", role: "Task assignment", description: "Matching workers to tasks (or ads to slots) is modeled as bipartite matching on a graph." },
  ],
  "ford-fulkerson": [
    { system: "Network Capacity Planning", role: "Max bandwidth", description: "Computing the maximum data throughput between two nodes in a network topology." },
    { system: "Airline Scheduling", role: "Crew assignment", description: "Max-flow formulations solve crew scheduling -- each pilot-to-flight assignment is a unit of flow." },
  ],
  "bst-operations": [
    { system: "Database Index", role: "Ordered key lookup", description: "B-Trees (a BST generalization) are the backbone of every relational database index." },
    { system: "File System", role: "Directory structure", description: "Many file systems use BST-like structures for directory entries and extent allocation." },
  ],
  "avl-tree": [
    { system: "In-Memory Database", role: "Balanced index", description: "AVL trees provide the tightest balance guarantee (height diff <= 1), giving fastest lookups at the cost of slower inserts." },
    { system: "Language Runtime", role: "Symbol table", description: "Some compiler symbol tables use AVL trees for guaranteed O(log n) lookup during name resolution." },
  ],
  "red-black-tree": [
    { system: "Linux Kernel", role: "CFS Scheduler", description: "The Completely Fair Scheduler uses a red-black tree keyed by virtual runtime to pick the next process." },
    { system: "Java TreeMap / C++ std::map", role: "Standard library", description: "The ordered map/set in Java and C++ are implemented as red-black trees." },
  ],
  "b-tree": [
    { system: "PostgreSQL / MySQL", role: "Disk-based index", description: "B-Trees minimize disk I/O by storing hundreds of keys per node, keeping tree height tiny (3-4 levels for billions of rows)." },
    { system: "File System (NTFS/ext4)", role: "File allocation", description: "B-Tree variants index file extents, enabling fast file lookup on disk." },
  ],
  "heap-operations": [
    { system: "Operating System", role: "Process scheduler", description: "Priority queues (heaps) determine which process runs next based on priority level." },
    { system: "Dijkstra / A*", role: "Frontier management", description: "The min-heap is the key data structure enabling efficient shortest-path algorithms." },
  ],
  "huffman-tree": [
    { system: "gzip / zlib", role: "Data compression", description: "Huffman coding is the final stage of DEFLATE compression -- used in gzip, PNG, ZIP, and HTTP compression." },
    { system: "JPEG / MP3", role: "Entropy coding", description: "Image and audio codecs use Huffman (or arithmetic) coding as the final compression step." },
  ],
  "trie-operations": [
    { system: "Autocomplete Engine", role: "Prefix search", description: "Every search bar's type-ahead suggestions use a trie (or compressed variant) for instant prefix matching." },
    { system: "IP Routing Table", role: "Longest prefix match", description: "Routers use tries to find the most specific route matching a destination IP address." },
    { system: "Spell Checker", role: "Dictionary lookup", description: "Spell checkers store dictionaries in tries for fast word existence checks and edit-distance suggestions." },
  ],
  "tree-traversals": [
    { system: "DOM Rendering", role: "Layout computation", description: "Browsers traverse the DOM tree to compute layout (preorder) and paint (postorder) the page." },
    { system: "File System Walk", role: "Directory traversal", description: "The 'find' command performs a tree traversal of the directory structure." },
  ],
  "union-find": [
    { system: "Kruskal's MST", role: "Cycle detection", description: "Union-Find checks if adding an edge would create a cycle -- the core operation in Kruskal's algorithm." },
    { system: "Social Network", role: "Connected components", description: "Finding which users belong to the same connected group (friend cluster) at scale." },
    { system: "Image Processing", role: "Connected component labeling", description: "Labeling regions of same-colored pixels in an image uses union-find for near-linear performance." },
  ],
  "segment-tree": [
    { system: "Competitive Programming", role: "Range queries", description: "Segment trees answer range-sum, range-min, range-max queries in O(log n) with point updates." },
    { system: "Database Engine", role: "Interval indexing", description: "Temporal databases use segment trees to efficiently query overlapping time intervals." },
  ],
  "fenwick-tree": [
    { system: "Leaderboard System", role: "Rank computation", description: "Computing 'your rank among N players' in O(log n) -- Fenwick trees power real-time leaderboards." },
    { system: "Cumulative Frequency", role: "Running statistics", description: "Computing cumulative sums and frequency tables that update dynamically." },
  ],
  "fibonacci-dp": [
    { system: "Algorithm Teaching", role: "DP introduction", description: "The canonical example for teaching memoization and bottom-up dynamic programming." },
  ],
  "lcs": [
    { system: "Git / diff", role: "File comparison", description: "The 'diff' command and Git's merge algorithm are built on Longest Common Subsequence." },
    { system: "Bioinformatics", role: "DNA sequence alignment", description: "Comparing genetic sequences to find evolutionary relationships uses LCS-based alignment." },
  ],
  "edit-distance": [
    { system: "Spell Checker", role: "Fuzzy matching", description: "Suggesting corrections for misspelled words by finding dictionary words within edit distance 1-2." },
    { system: "DNA Sequencing", role: "Sequence alignment", description: "Needleman-Wunsch (global alignment) is edit distance with biological scoring matrices." },
  ],
  "knapsack": [
    { system: "Investment Platform", role: "Portfolio optimization", description: "Maximize returns within risk budget -- each asset is an 'item' with weight (risk) and value (return)." },
    { system: "Resource Allocation", role: "Budget planning", description: "Selecting which projects to fund given a fixed budget to maximize total impact." },
    { system: "Cargo Loading", role: "Container packing", description: "Deciding which items to load in a truck/container to maximize value without exceeding weight limit." },
  ],
  "coin-change": [
    { system: "Payment System", role: "Change calculation", description: "ATMs and vending machines computing the minimum number of coins/bills for a given amount." },
  ],
  "lis": [
    { system: "Patience Sorting", role: "Sort optimization", description: "LIS length determines the minimum number of sorted runs -- used in adaptive sorting algorithms." },
  ],
  "longest-palindrome": [
    { system: "Text Analysis", role: "Pattern recognition", description: "Detecting palindromic patterns in text, DNA sequences, and string processing pipelines." },
  ],
  "kmp": [
    { system: "Text Editor", role: "Find & Replace", description: "Ctrl+F uses pattern matching -- KMP guarantees linear time even on adversarial patterns." },
    { system: "Intrusion Detection", role: "Signature matching", description: "Network IDS scans packet payloads for known attack signatures using string matching." },
    { system: "Bioinformatics", role: "Motif finding", description: "Searching for known DNA motifs in genomic sequences requires exact string matching." },
  ],
  "rabin-karp": [
    { system: "Plagiarism Detection", role: "Fingerprinting", description: "Rolling hash on document substrings detects copied passages -- used by Turnitin-like systems." },
    { system: "Multi-pattern Search", role: "Simultaneous matching", description: "Searching for multiple patterns at once using a set of hash values." },
  ],
  "boyer-moore": [
    { system: "GNU grep", role: "Fast text search", description: "grep uses Boyer-Moore for literal string search -- skips large chunks of text, faster than KMP in practice." },
  ],
  "z-algorithm": [
    { system: "Pattern Matching Library", role: "Linear-time search", description: "Alternative to KMP with simpler implementation -- used in string processing libraries." },
  ],
  "n-queens": [
    { system: "Constraint Solver", role: "CSP demonstration", description: "The classic constraint satisfaction problem -- teaches backtracking with pruning." },
    { system: "Parallel Computing", role: "Benchmark problem", description: "N-Queens is a standard benchmark for parallel backtracking algorithms." },
  ],
  "sudoku": [
    { system: "Puzzle Generator", role: "Valid puzzle creation", description: "Sudoku apps generate puzzles by solving a complete board then removing cells while ensuring uniqueness." },
    { system: "Constraint Propagation", role: "CSP solving", description: "Peter Norvig's famous Sudoku solver combines backtracking with constraint propagation." },
  ],
  "knights-tour": [
    { system: "Cryptography", role: "Key generation", description: "Knight's tour sequences have been used as a basis for generating pseudo-random permutations." },
  ],
  "convex-hull": [
    { system: "Computer Graphics", role: "Collision detection", description: "Convex hulls provide fast bounding volumes for broad-phase collision detection in game engines." },
    { system: "Geographic Information System", role: "Boundary computation", description: "Computing the boundary of a set of geographic points (e.g., delivery zone from drop-off locations)." },
  ],
  "closest-pair": [
    { system: "Air Traffic Control", role: "Collision avoidance", description: "Finding the two closest aircraft in a region to issue separation warnings." },
  ],
  "binary-search": [
    { system: "Every Sorted Data Structure", role: "Core lookup", description: "Binary search is the foundation of B-Tree lookups, sorted array search, and bisect operations in every language." },
    { system: "Git Bisect", role: "Bug hunting", description: "git bisect uses binary search on commit history to find the exact commit that introduced a bug." },
  ],
  "bloom-filter": [
    { system: "Chrome Browser", role: "Safe Browsing", description: "Chrome checks URLs against a Bloom Filter of known malicious sites -- instant check, zero false negatives." },
    { system: "Apache Cassandra", role: "SSTable lookups", description: "Before reading disk, check Bloom Filter -- if negative, skip the expensive I/O entirely." },
    { system: "Medium", role: "Recommendation dedup", description: "Medium uses Bloom Filters to avoid recommending articles a user has already seen." },
  ],
  "skip-list": [
    { system: "Redis", role: "Sorted Set (ZSET)", description: "Redis implements sorted sets using skip lists -- O(log n) insert/search with simpler code than balanced BSTs." },
    { system: "LevelDB / RocksDB", role: "Memtable", description: "The in-memory component of LSM-tree storage engines is often a skip list." },
  ],
  "count-min-sketch": [
    { system: "Network Monitoring", role: "Heavy hitter detection", description: "Detecting the most frequent IP addresses or URLs in a high-speed network stream." },
    { system: "Ad Tech", role: "Frequency capping", description: "Approximately counting how many times a user has seen an ad without storing exact counts per user." },
  ],
  "cosine-similarity": [
    { system: "Search Engine", role: "Document ranking", description: "TF-IDF vectors + cosine similarity is the classic information retrieval ranking formula." },
    { system: "Recommendation Engine", role: "Item similarity", description: "Finding similar products/movies by comparing their feature vectors using cosine distance." },
  ],
  "hnsw": [
    { system: "Spotify", role: "Song recommendations", description: "Find similar songs from 100M+ tracks using embedding vectors in an HNSW index." },
    { system: "Pinecone / Weaviate", role: "Vector database core", description: "The backbone of every AI/RAG application -- approximate nearest neighbor search at scale." },
    { system: "OpenAI Embeddings", role: "Semantic search", description: "HNSW indexes power semantic search over document embeddings in production RAG pipelines." },
  ],
  "lru-cache": [
    { system: "CPU Cache", role: "Cache eviction", description: "Hardware caches use LRU (or approximations like pseudo-LRU) to decide which cache line to evict." },
    { system: "CDN / Memcached", role: "Hot content caching", description: "CDNs and in-memory caches evict the least-recently-used items when capacity is full." },
    { system: "Operating System", role: "Page replacement", description: "Virtual memory systems use LRU-approximation algorithms to decide which pages to swap to disk." },
  ],
  "activity-selection": [
    { system: "Conference Scheduler", role: "Room allocation", description: "Selecting the maximum number of non-overlapping talks for a single room -- classic greedy problem." },
    { system: "Job Scheduling", role: "Machine utilization", description: "Maximizing the number of jobs completed on a single machine with deadlines." },
  ],
  "fractional-knapsack": [
    { system: "Cloud Resource Allocation", role: "Budget optimization", description: "Allocating fractional compute resources (CPU shares, memory) to maximize throughput within budget." },
  ],
  "monotonic-stack": [
    { system: "Stock Trading", role: "Next greater element", description: "Finding the next day a stock price exceeds today's -- the canonical monotonic stack problem." },
    { system: "Histogram Problems", role: "Largest rectangle", description: "Computing the largest rectangle in a histogram (used in image processing and chart rendering)." },
  ],
  "floyd-cycle": [
    { system: "Linked List Library", role: "Cycle detection", description: "Detecting if a linked list has a cycle using O(1) space -- Floyd's tortoise and hare algorithm." },
    { system: "Random Number Generator", role: "Period detection", description: "Detecting the cycle length of a PRNG to evaluate its quality." },
  ],
  "two-pointers": [
    { system: "Database Join", role: "Merge join", description: "The merge join algorithm in databases uses two pointers walking sorted tables simultaneously." },
  ],
  "sliding-window": [
    { system: "Network Protocol (TCP)", role: "Flow control", description: "TCP's sliding window controls how much data the sender can transmit before waiting for ACK." },
    { system: "Rate Limiter", role: "Request counting", description: "Sliding window counters track request rates for API rate limiting." },
  ],
  "interval-merge": [
    { system: "Calendar App", role: "Free time computation", description: "Merging overlapping meetings to find free time slots in a schedule." },
    { system: "Genomics", role: "Region merging", description: "Merging overlapping genomic intervals (e.g., overlapping gene annotations on a chromosome)." },
  ],
};

// ── Component ──────────────────────────────────────────────────

interface SystemContextSelectorProps {
  config: AlgorithmConfig | null;
  showLatencyBridge?: boolean;
}

type ContextSection = "systems" | "latency";

export default function SystemContextSelector({ config, showLatencyBridge }: SystemContextSelectorProps) {
  const contexts = config ? (ALGORITHM_CONTEXTS[config.id] ?? []) : [];
  const [section, setSection] = useState<ContextSection>("systems");

  if (!config) {
    return (
      <div className="flex items-center justify-center h-full px-4 py-8">
        <div className="text-center">
          <Globe
            className="mx-auto h-8 w-8 opacity-20"
            style={{ color: "var(--foreground-muted)" }}
          />
          <p
            className="mt-3 text-sm"
            style={{ color: "var(--foreground-muted)" }}
          >
            Select an algorithm to see where it is used in real systems.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Section toggle when latency bridge is enabled */}
      {showLatencyBridge && (
        <div className="flex items-center gap-1 mb-3">
          <button
            onClick={() => setSection("systems")}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded transition-colors",
              section === "systems"
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground-subtle",
            )}
          >
            Real-World Usage
          </button>
          <button
            onClick={() => setSection("latency")}
            className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded transition-colors",
              section === "latency"
                ? "bg-primary text-primary-foreground"
                : "text-foreground-muted hover:text-foreground-subtle",
            )}
          >
            Latency at Scale
          </button>
        </div>
      )}

      {/* Latency Bridge section */}
      {showLatencyBridge && section === "latency" && (
        <LatencyBridgePanel config={config} />
      )}

      {/* Systems section */}
      {(!showLatencyBridge || section === "systems") && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-4 w-4" style={{ color: "var(--primary)" }} />
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Where {config.name} is used
            </h3>
            <span
              className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded"
              style={{
                background: "var(--violet-3)",
                color: "var(--primary)",
              }}
            >
              {contexts.length} system{contexts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Context cards */}
          <AnimatePresence mode="wait">
            <motion.div
              key={config.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {contexts.length > 0 ? (
                contexts.map((ctx, i) => (
                  <motion.div
                    key={`${config.id}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.06,
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                    className={cn(
                      "rounded-lg border p-3 transition-colors",
                      "hover:border-[var(--primary)]/30",
                    )}
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--gray-3)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: "var(--primary)" }}
                      />
                      <span
                        className="text-xs font-semibold"
                        style={{ color: "var(--foreground)" }}
                      >
                        {ctx.system}
                      </span>
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{
                          color: "var(--primary)",
                          background: "var(--violet-3)",
                        }}
                      >
                        {ctx.role}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed pl-4"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {ctx.description}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div
                  className="text-center py-6 rounded-lg border"
                  style={{
                    borderColor: "var(--border)",
                    background: "var(--gray-3)",
                  }}
                >
                  <Globe
                    className="mx-auto h-6 w-6 mb-2 opacity-30"
                    style={{ color: "var(--foreground-muted)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    No system context data yet for{" "}
                    <span style={{ color: "var(--foreground)" }}>{config.name}</span>.
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--foreground-subtle)" }}
                  >
                    Real-world usage examples coming soon.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
