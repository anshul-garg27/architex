"use client";

import React, { memo, useState, useCallback, useEffect } from "react";
import {
  ArrowLeftRight,
  Shuffle,
  Eye,
  Zap,
  Globe,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SystemContextSelector from "@/components/modules/algorithm/SystemContextSelector";
import type { ComparisonState } from "@/components/canvas/panels/AlgorithmPanel";
import type {
  AnimationStep,
  AlgorithmConfig,
} from "@/lib/algorithms";
import {
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
  SEARCH_ALGORITHMS,
  GREEDY_ALGORITHMS,
  PATTERN_ALGORITHMS,
  DESIGN_ALGORITHMS,
  PROBABILISTIC_ALGORITHMS,
  VECTOR_SEARCH_ALGORITHMS,
} from "@/lib/algorithms";

// Static combined array
const ALL_ALGORITHMS: AlgorithmConfig[] = [
  ...SORTING_ALGORITHMS, ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS,
  ...DP_ALGORITHMS, ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS,
  ...GEOMETRY_ALGORITHMS, ...SEARCH_ALGORITHMS, ...GREEDY_ALGORITHMS,
  ...PATTERN_ALGORITHMS, ...DESIGN_ALGORITHMS, ...PROBABILISTIC_ALGORITHMS,
  ...VECTOR_SEARCH_ALGORITHMS,
];

// ── ALG-226: Python implementations for top algorithms ────
const PYTHON_CODE: Record<string, string> = {
  'bubble-sort': `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        swapped = False
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr`,
  'quick-sort': `def quick_sort(arr, low=0, high=None):
    if high is None: high = len(arr) - 1
    if low < high:
        pivot_idx = partition(arr, low, high)
        quick_sort(arr, low, pivot_idx - 1)
        quick_sort(arr, pivot_idx + 1, high)
    return arr

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
  'merge-sort': `def merge_sort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i]); i += 1
        else:
            result.append(right[j]); j += 1
    return result + left[i:] + right[j:]`,
  'bfs': `from collections import deque

def bfs(graph, start):
    visited = set()
    queue = deque([start])
    visited.add(start)
    while queue:
        node = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    return visited`,
  'dijkstra': `import heapq

def dijkstra(graph, start):
    dist = {node: float('inf') for node in graph}
    dist[start] = 0
    pq = [(0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]: continue
        for v, w in graph[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                heapq.heappush(pq, (dist[v], v))
    return dist`,
  'knapsack': `def knapsack(weights, values, capacity):
    n = len(weights)
    dp = [[0] * (capacity + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        for w in range(capacity + 1):
            dp[i][w] = dp[i - 1][w]
            if weights[i - 1] <= w:
                dp[i][w] = max(
                    dp[i][w],
                    dp[i - 1][w - weights[i - 1]] + values[i - 1],
                )
    return dp[n][capacity]`,
  'kmp': `def kmp_search(text, pattern):
    n, m = len(text), len(pattern)
    lps = compute_lps(pattern)
    i = j = 0
    matches = []
    while i < n:
        if text[i] == pattern[j]:
            i += 1; j += 1
        if j == m:
            matches.append(i - j)
            j = lps[j - 1]
        elif i < n and text[i] != pattern[j]:
            j = lps[j - 1] if j else 0
            if j == 0 and text[i] != pattern[0]:
                i += 1
    return matches

def compute_lps(pattern):
    m = len(pattern)
    lps = [0] * m
    length = 0
    i = 1
    while i < m:
        if pattern[i] == pattern[length]:
            length += 1
            lps[i] = length
            i += 1
        elif length:
            length = lps[length - 1]
        else:
            lps[i] = 0
            i += 1
    return lps`,
  'n-queens': `def solve_n_queens(n):
    solutions = []
    board = [-1] * n

    def is_safe(row, col):
        for r in range(row):
            if board[r] == col or \\
               abs(board[r] - col) == abs(r - row):
                return False
        return True

    def backtrack(row):
        if row == n:
            solutions.append(board[:])
            return
        for col in range(n):
            if is_safe(row, col):
                board[row] = col
                backtrack(row + 1)
                board[row] = -1

    backtrack(0)
    return solutions`,
  'bst-operations': `class Node:
    def __init__(self, val):
        self.val = val
        self.left = self.right = None

def bst_insert(root, val):
    if root is None:
        return Node(val)
    if val < root.val:
        root.left = bst_insert(root.left, val)
    elif val > root.val:
        root.right = bst_insert(root.right, val)
    return root`,
  'avl-tree': `class AVLNode:
    def __init__(self, val):
        self.val = val
        self.left = self.right = None
        self.height = 1

def get_height(node):
    return node.height if node else 0

def get_balance(node):
    return get_height(node.left) - get_height(node.right) if node else 0

def right_rotate(y):
    x = y.left
    y.left = x.right
    x.right = y
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    x.height = 1 + max(get_height(x.left), get_height(x.right))
    return x

def left_rotate(x):
    y = x.right
    x.right = y.left
    y.left = x
    x.height = 1 + max(get_height(x.left), get_height(x.right))
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    return y

def avl_insert(root, val):
    if not root:
        return AVLNode(val)
    if val < root.val:
        root.left = avl_insert(root.left, val)
    else:
        root.right = avl_insert(root.right, val)
    root.height = 1 + max(get_height(root.left), get_height(root.right))
    balance = get_balance(root)
    if balance > 1 and val < root.left.val:
        return right_rotate(root)
    if balance < -1 and val > root.right.val:
        return left_rotate(root)
    if balance > 1 and val > root.left.val:
        root.left = left_rotate(root.left)
        return right_rotate(root)
    if balance < -1 and val < root.right.val:
        root.right = right_rotate(root.right)
        return left_rotate(root)
    return root`,
};

// ── ALG-214: Debug challenges for flashcards ──────────────
interface DebugChallenge {
  algorithmId: string;
  title: string;
  buggyCode: string;
  question: string;
  answer: string;
}

const DEBUG_CHALLENGES: DebugChallenge[] = [
  {
    algorithmId: 'bubble-sort',
    title: 'Missing Early Exit',
    buggyCode: `for i in range(n-1):
    for j in range(n-i-1):
        if arr[j] > arr[j+1]:
            swap(arr[j], arr[j+1])
    # Bug: no "swapped" flag check!`,
    question: "This Bubble Sort always runs n-1 passes even on sorted input. What's missing?",
    answer: "A 'swapped' flag that breaks the outer loop if no swaps occurred — gives O(n) best case.",
  },
  {
    algorithmId: 'dijkstra',
    title: 'Negative Edge Bug',
    buggyCode: `# This code accepts negative edges
while pq:
    d, u = heappop(pq)
    for v, w in graph[u]:  # w can be negative!
        if d + w < dist[v]:
            dist[v] = d + w`,
    question: "This Dijkstra implementation can give WRONG distances. Why?",
    answer: "Dijkstra assumes settled nodes are final. A negative edge can make a settled node's distance wrong. Use Bellman-Ford for negative edges.",
  },
  {
    algorithmId: 'quick-sort',
    title: 'Bad Pivot on Sorted Input',
    buggyCode: `def partition(arr, low, high):
    pivot = arr[low]  # Always picks FIRST element
    ...`,
    question: "This Quick Sort is O(n^2) on sorted input. Why?",
    answer: "First-element pivot on sorted input = every partition has 0 and n-1 elements. Use last element, random, or median-of-three instead.",
  },
];

// ── Scenario data for algorithm selection quiz ─────────────
const SCENARIOS = [
  { question: "Sort 10 million log entries by timestamp (preserve order of ties).", correctId: "merge-sort", explanation: "Merge Sort: guaranteed O(n log n), stable (preserves order of same-timestamp entries).", hint1: "Think about which sorting algorithms are stable.", hint2: "The answer uses a divide-and-conquer approach." },
  { question: "Find shortest route on a road map with non-negative distances.", correctId: "dijkstra", explanation: "Dijkstra: finds shortest path with non-negative weights, which road distances always are.", hint1: "Think about which algorithms handle weighted graphs.", hint2: "The answer uses a greedy approach with a priority queue." },
  { question: "Sort a small list (< 20 items) inside a larger sorting algorithm.", correctId: "insertion-sort", explanation: "Insertion Sort: O(n^2) worst case, but fastest for very small n due to low overhead.", hint1: "Think about which algorithms have the lowest constant factor overhead.", hint2: "The answer works by inserting each element into its correct position." },
  { question: "Find the minimum spanning tree of a sparse graph.", correctId: "kruskal", explanation: "Kruskal's: sorts edges and uses union-find; ideal for sparse graphs.", hint1: "Think about which algorithms build spanning trees.", hint2: "The answer is a greedy algorithm that processes edges by weight." },
  { question: "Detect if a directed graph has a cycle.", correctId: "cycle-detection", explanation: "Cycle Detection via DFS: tracks visiting/visited states to find back edges.", hint1: "Think about depth-first traversal state tracking.", hint2: "The answer uses a coloring scheme (white/gray/black) during DFS." },
  { question: "Find the longest common subsequence of two DNA strings.", correctId: "lcs", explanation: "LCS via DP: builds a 2D table in O(mn) time and backtracks for the result.", hint1: "Think about dynamic programming on two sequences.", hint2: "The answer builds an m x n table comparing characters." },
  { question: "Schedule tasks respecting dependency order.", correctId: "topological-sort", explanation: "Topological Sort: linearizes a DAG so every edge u->v has u before v.", hint1: "Think about ordering in directed acyclic graphs.", hint2: "The answer uses DFS or in-degree counting (Kahn's) on a DAG." },
  { question: "Find a pattern in a text string in O(n+m) time.", correctId: "kmp", explanation: "KMP: preprocesses the pattern into a failure function, then scans text in one pass.", hint1: "Think about string matching with preprocessing.", hint2: "The answer precomputes a failure/prefix function." },
  { question: "Find shortest paths even with negative edge weights (no negative cycles).", correctId: "bellman-ford", explanation: "Bellman-Ford: relaxes all edges V-1 times; handles negative weights unlike Dijkstra.", hint1: "Think about which shortest-path algorithms handle negative edges.", hint2: "The answer relaxes edges repeatedly, up to V-1 iterations." },
  { question: "Compress text data using variable-length prefix codes.", correctId: "huffman-tree", explanation: "Huffman Tree: builds optimal prefix codes by greedily merging lowest-frequency nodes.", hint1: "Think about tree-based encoding schemes.", hint2: "The answer greedily builds a binary tree from character frequencies." },
];

// ── FlashcardQuiz component ────────────────────────────────
type QuizMode = "complexity" | "scenarios";
type ComplexityField = "timeBest" | "timeAvg" | "timeWorst" | "space" | "stable" | "inPlace";
const COMPLEXITY_FIELDS: { key: ComplexityField; label: (name: string) => string }[] = [
  { key: "timeBest", label: (n) => `What is the BEST-case time complexity of ${n}?` },
  { key: "timeAvg", label: (n) => `What is the AVERAGE time complexity of ${n}?` },
  { key: "timeWorst", label: (n) => `What is the WORST-case time complexity of ${n}?` },
  { key: "space", label: (n) => `What is the SPACE complexity of ${n}?` },
  { key: "stable", label: (n) => `Is ${n} a STABLE algorithm?` },
  { key: "inPlace", label: (n) => `Is ${n} an IN-PLACE algorithm?` },
];

function getAnswer(algo: AlgorithmConfig, field: ComplexityField): string {
  switch (field) {
    case "timeBest": return algo.timeComplexity.best;
    case "timeAvg": return algo.timeComplexity.average;
    case "timeWorst": return algo.timeComplexity.worst;
    case "space": return algo.spaceComplexity;
    case "stable": return algo.stable ? "Yes" : "No";
    case "inPlace": return algo.inPlace ? "Yes" : "No";
  }
}

function pickOptions(correct: string, allAlgos: AlgorithmConfig[], field: ComplexityField): string[] {
  const pool = new Set(allAlgos.map((a) => getAnswer(a, field)));
  if (field === "stable" || field === "inPlace") return ["Yes", "No"];
  pool.delete(correct);
  const wrong = Array.from(pool).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [correct, ...wrong].sort(() => Math.random() - 0.5);
  return opts;
}

const FlashcardQuiz = memo(function FlashcardQuiz({ algorithms }: { algorithms: AlgorithmConfig[] }) {
  const [mode, setMode] = useState<QuizMode>("complexity");
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [hintCount, setHintCount] = useState(0);
  const [algoIdx, setAlgoIdx] = useState(() => Math.floor(Math.random() * algorithms.length));
  const [fieldIdx, setFieldIdx] = useState(() => Math.floor(Math.random() * COMPLEXITY_FIELDS.length));
  const [options, setOptions] = useState<string[]>(() => {
    const algo = algorithms[Math.floor(Math.random() * algorithms.length)];
    const f = COMPLEXITY_FIELDS[Math.floor(Math.random() * COMPLEXITY_FIELDS.length)];
    return pickOptions(getAnswer(algo, f.key), algorithms, f.key);
  });
  const [scenIdx, setScenIdx] = useState(() => Math.floor(Math.random() * SCENARIOS.length));
  const [scenOpts, setScenOpts] = useState<string[]>([]);

  const initScenario = useCallback((idx: number) => {
    const s = SCENARIOS[idx];
    const correctAlgo = algorithms.find((a) => a.id === s.correctId);
    const correctName = correctAlgo?.name ?? s.correctId;
    const pool = algorithms.filter((a) => a.id !== s.correctId).sort(() => Math.random() - 0.5).slice(0, 3).map((a) => a.name);
    setScenOpts([correctName, ...pool].sort(() => Math.random() - 0.5));
  }, [algorithms]);

  useEffect(() => { if (mode === "scenarios") initScenario(scenIdx); }, [mode, scenIdx, initScenario]);

  const algo = algorithms[algoIdx];
  const field = COMPLEXITY_FIELDS[fieldIdx];
  const correct = mode === "complexity" ? getAnswer(algo, field.key) : (algorithms.find((a) => a.id === SCENARIOS[scenIdx].correctId)?.name ?? SCENARIOS[scenIdx].correctId);

  const next = useCallback(() => {
    setSelected(null);
    setHintCount(0);
    if (mode === "complexity") {
      const ai = Math.floor(Math.random() * algorithms.length);
      const fi = Math.floor(Math.random() * COMPLEXITY_FIELDS.length);
      setAlgoIdx(ai);
      setFieldIdx(fi);
      setOptions(pickOptions(getAnswer(algorithms[ai], COMPLEXITY_FIELDS[fi].key), algorithms, COMPLEXITY_FIELDS[fi].key));
    } else {
      const si = (scenIdx + 1) % SCENARIOS.length;
      setScenIdx(si);
    }
  }, [mode, algorithms, scenIdx]);

  const handlePick = useCallback((opt: string) => {
    if (selected) return;
    if (hintCount >= 2 && opt !== correct) {
      setSelected(correct);
      setTotal((t) => t + 1);
      return;
    }
    if (opt === correct) {
      setSelected(opt);
      setScore((s) => s + 1);
      setTotal((t) => t + 1);
    } else {
      setHintCount((h) => h + 1);
      if (hintCount >= 1) {
        setSelected(correct);
        setTotal((t) => t + 1);
      }
    }
  }, [selected, correct, hintCount]);

  const scen = SCENARIOS[scenIdx];
  const question = mode === "complexity" ? field.label(algo.name) : scen.question;
  const opts = mode === "complexity" ? options : scenOpts;

  const hintText = mode === "scenarios" && hintCount > 0
    ? (hintCount === 1 ? scen.hint1 : scen.hint2)
    : hintCount === 1
      ? `Hint: consider the ${field.key.includes("time") ? "time" : field.key === "space" ? "memory" : "property"} characteristics of ${algo.category} algorithms.`
      : hintCount >= 2
        ? `The correct answer is: ${correct}`
        : null;

  return (
    <div className="px-4 py-2">
      <div className="mb-2 flex items-center gap-3">
        <button onClick={() => { setMode("complexity"); setSelected(null); setHintCount(0); }} className={cn("text-xs font-semibold px-2 py-0.5 rounded", mode === "complexity" ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:text-foreground-subtle")}>Complexity</button>
        <button onClick={() => { setMode("scenarios"); setSelected(null); setHintCount(0); }} className={cn("text-xs font-semibold px-2 py-0.5 rounded", mode === "scenarios" ? "bg-primary text-primary-foreground" : "text-foreground-muted hover:text-foreground-subtle")}>Scenarios</button>
        <span className="ml-auto text-xs font-mono text-foreground-subtle">{score}/{total} correct</span>
      </div>
      <p className="mb-2 text-sm font-medium text-foreground">{question}</p>
      <div className="grid grid-cols-2 gap-2 mb-2">
        {opts.map((opt) => {
          const isCorrect = opt === correct;
          const revealed = selected !== null;
          const bg = revealed ? (isCorrect ? "bg-green-600/20 border-green-500" : opt === selected && !isCorrect ? "bg-red-600/20 border-red-500" : "border-border") : "border-border hover:border-foreground-subtle";
          return (
            <button key={opt} onClick={() => handlePick(opt)} disabled={!!selected} className={cn("rounded border px-3 py-1.5 text-xs text-foreground transition-colors", bg)}>
              {opt}
            </button>
          );
        })}
      </div>
      {hintCount > 0 && !selected && hintText && <p className="text-xs text-amber-400 mb-2">{hintText}</p>}
      {selected && mode === "scenarios" && <p className="text-xs text-foreground-subtle mb-2">{scen.explanation}</p>}
      {selected && <button onClick={next} className="text-xs font-semibold text-primary hover:underline">Next &rarr;</button>}
    </div>
  );
});

// ── ALG-214: Flashcard wrapper with Debug Challenge sub-mode ──
const FlashcardQuizWithDebug = memo(function FlashcardQuizWithDebug({
  algorithms,
  selectedAlgoId,
}: {
  algorithms: AlgorithmConfig[];
  selectedAlgoId: string;
}) {
  const [showDebug, setShowDebug] = useState(false);
  const [debugIdx, setDebugIdx] = useState(0);
  const [debugRevealed, setDebugRevealed] = useState(false);

  const challenge = DEBUG_CHALLENGES[debugIdx];

  if (showDebug) {
    return (
      <div className="px-4 py-2">
        <div className="mb-2 flex items-center gap-3">
          <button
            onClick={() => setShowDebug(false)}
            className="text-xs font-semibold px-2 py-0.5 rounded text-foreground-muted hover:text-foreground-subtle"
          >
            &larr; Back to Flashcards
          </button>
          <span className="ml-auto text-xs font-mono text-foreground-subtle">
            Debug {debugIdx + 1}/{DEBUG_CHALLENGES.length}
          </span>
        </div>
        <h4 className="mb-1 text-sm font-semibold text-foreground">{challenge.title}</h4>
        <pre className="rounded-md bg-background p-3 text-xs font-mono text-foreground overflow-auto max-h-32 mb-2 border border-red-500/20">
          <code>{challenge.buggyCode}</code>
        </pre>
        <p className="mb-2 text-sm font-medium text-foreground">{challenge.question}</p>
        {!debugRevealed ? (
          <button
            onClick={() => setDebugRevealed(true)}
            className="rounded border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            Reveal Answer
          </button>
        ) : (
          <div>
            <p className="mb-2 rounded-md bg-green-600/10 border border-green-500/20 p-2 text-xs text-green-400">
              {challenge.answer}
            </p>
            <button
              onClick={() => {
                setDebugIdx((i) => (i + 1) % DEBUG_CHALLENGES.length);
                setDebugRevealed(false);
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Next Challenge &rarr;
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <FlashcardQuiz algorithms={algorithms} />
      <div className="px-4 pb-2">
        <button
          onClick={() => { setShowDebug(true); setDebugRevealed(false); }}
          className="rounded border border-amber-500/30 bg-amber-500/5 px-3 py-1.5 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 transition-colors"
        >
          Debug Challenge
        </button>
      </div>
    </div>
  );
});

// ── Bottom Panel ────────────────────────────────────────────

type AlgoBottomTab = "steps" | "system-context" | "flashcards" | "code";

const ALGO_BOTTOM_TABS: { id: AlgoBottomTab; label: string; icon: React.ReactNode }[] = [
  { id: "steps", label: "Step Log", icon: <Eye className="h-3 w-3" /> },
  { id: "system-context", label: "System Context", icon: <Globe className="h-3 w-3" /> },
  { id: "code", label: "Code", icon: <Code2 className="h-3 w-3" /> },
  { id: "flashcards", label: "Flashcards", icon: <Zap className="h-3 w-3" /> },
];

export interface AlgorithmBottomPanelProps {
  step: AnimationStep | null;
  stepIndex: number;
  comparison: ComparisonState;
  selectedAlgoId: string;
}

export const AlgorithmBottomPanel = memo(function AlgorithmBottomPanel({
  step,
  stepIndex,
  comparison,
  selectedAlgoId,
}: AlgorithmBottomPanelProps) {
  const [activeTab, setActiveTab] = useState<AlgoBottomTab>("steps");
  const [codeOutput, setCodeOutput] = useState<string | null>(null);

  const allAlgorithms = ALL_ALGORITHMS;
  const config = allAlgorithms.find((a) => a.id === selectedAlgoId) ?? null;
  const compConfig = comparison.enabled
    ? allAlgorithms.find((a) => a.id === comparison.comparisonAlgoId) ?? null
    : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1 border-b border-border px-4 py-0">
        {ALGO_BOTTOM_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground-subtle",
              )}
            >
              <span className={cn("transition-colors", isActive ? "text-primary" : "")}>
                {tab.icon}
              </span>
              {tab.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full"
                  style={{
                    background: "linear-gradient(90deg, var(--primary), var(--violet-9))",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === "steps" && (
          <div className="px-4 py-2">
            {step ? (
              <div className="flex items-start gap-6">
                <div className="flex-1">
                  <p className="mb-2 font-mono text-sm text-foreground">
                    {step.description}
                  </p>
                  <p className="text-xs text-foreground-subtle">
                    Pseudocode line {step.pseudocodeLine + 1}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <ArrowLeftRight className="mx-auto mb-0.5 h-3.5 w-3.5 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Comparisons
                    </span>
                    <span className="block font-mono text-sm font-medium text-foreground">
                      {step.complexity.comparisons}
                    </span>
                    {comparison.enabled && comparison.comparisonStep && compConfig && (
                      <span className="block font-mono text-[10px] text-primary">
                        B: {comparison.comparisonStep.complexity.comparisons}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <Shuffle className="mx-auto mb-0.5 h-3.5 w-3.5 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Swaps
                    </span>
                    <span className="block font-mono text-sm font-medium text-foreground">
                      {step.complexity.swaps}
                    </span>
                    {comparison.enabled && comparison.comparisonStep && compConfig && (
                      <span className="block font-mono text-[10px] text-primary">
                        B: {comparison.comparisonStep.complexity.swaps}
                      </span>
                    )}
                  </div>
                  <div className="text-center">
                    <Eye className="mx-auto mb-0.5 h-3.5 w-3.5 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Reads
                    </span>
                    <span className="block font-mono text-sm font-medium text-foreground">
                      {step.complexity.reads}
                    </span>
                  </div>
                  <div className="text-center">
                    <Zap className="mx-auto mb-0.5 h-3.5 w-3.5 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Writes
                    </span>
                    <span className="block font-mono text-sm font-medium text-foreground">
                      {step.complexity.writes}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground-muted">
                Run an algorithm to see step-by-step details here.
              </p>
            )}
          </div>
        )}
        {activeTab === "system-context" && <SystemContextSelector config={config} showLatencyBridge />}
        {activeTab === "flashcards" && (
          <FlashcardQuizWithDebug algorithms={ALL_ALGORITHMS} selectedAlgoId={selectedAlgoId} />
        )}
        {activeTab === "code" && (
          <div className="p-4">
            {PYTHON_CODE[selectedAlgoId] ? (
              <pre className="rounded-md bg-background p-3 text-xs font-mono text-foreground overflow-auto max-h-60">
                <code>{PYTHON_CODE[selectedAlgoId]}</code>
              </pre>
            ) : (
              <p className="text-sm text-foreground-muted">Python code not yet available for this algorithm.</p>
            )}
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-foreground-muted">Try it out</span>
                <span className="text-[9px] text-foreground-subtle">JavaScript sandbox</span>
              </div>
              <textarea
                id="codelab-editor"
                className="h-32 w-full rounded-md border border-border bg-background p-3 font-mono text-xs text-foreground resize-y"
                defaultValue={`// Try modifying this sorting algorithm\nfunction mySort(arr) {\n  for (let i = 0; i < arr.length; i++) {\n    for (let j = 0; j < arr.length - i - 1; j++) {\n      if (arr[j] > arr[j + 1]) {\n        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}\n\n// Test it:\nmySort([5, 3, 8, 1, 9]);`}
                spellCheck={false}
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90"
                  onClick={() => {
                    const textarea = document.getElementById('codelab-editor') as HTMLTextAreaElement | null;
                    if (!textarea) return;
                    try {
                      // ALG-331: Intentional eval via Function constructor for user sandbox
                       
                      const fn = new Function(textarea.value + '\n//# sourceURL=user-code.js'); // NOSONAR
                      const result = fn();
                      setCodeOutput(JSON.stringify(result, null, 2));
                    } catch (e: unknown) {
                      setCodeOutput('Error: ' + (e instanceof Error ? e.message : String(e)));
                    }
                  }}
                >
                  Run Code
                </button>
                {codeOutput !== null && (
                  <button
                    className="text-xs text-foreground-subtle hover:text-foreground-muted"
                    onClick={() => setCodeOutput(null)}
                  >
                    Clear
                  </button>
                )}
              </div>
              {codeOutput !== null && (
                <pre className="mt-2 p-2 rounded bg-elevated text-xs font-mono max-h-32 overflow-auto border border-border">
                  {codeOutput}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
