'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Shuffle,
  Zap,
  BarChart3,
  Clock,
  ArrowLeftRight,
  Eye,
  Columns2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  PlaybackController,
  SORTING_ALGORITHMS,
  GRAPH_ALGORITHMS,
  TREE_ALGORITHMS,
  DP_ALGORITHMS,
  STRING_ALGORITHMS,
  SAMPLE_GRAPH_FOR_ALGORITHM,
  SAMPLE_TREE_FOR_ALGORITHM,
  bubbleSort,
  insertionSort,
  selectionSort,
  mergeSort,
  mergeSortBottomUp,
  quickSort,
  heapSort,
  shellSort,
  countingSort,
  radixSort,
  bucketSort,
  timSort,
  cocktailShakerSort,
  combSort,
  pancakeSort,
  bogoSort,
  radixSortMSD,
  bfs,
  dfs,
  dfsIterative,
  dijkstra,
  kruskal,
  topologicalSort,
  topologicalSortKahn,
  bellmanFord,
  aStar,
  tarjanSCC,
  prims,
  floydWarshall,
  bipartiteCheck,
  cycleDetection,
  eulerPath,
  fordFulkerson,
  articulationPoints,
  bridges,
  bstInsert,
  bstSearch,
  bstDelete,
  avlInsert,
  inorderTraversal,
  preorderTraversal,
  postorderTraversal,
  levelOrderTraversal,
  heapInsert,
  heapExtractMax,
  heapify,
  arrayToTree,
  rbInsert,
  bTreeInsert,
  huffmanBuild,
  buildFrequencyTable,
  trieInsertAlgo,
  createTrieRoot,
  BALANCED_BST,
  fibonacciDP,
  lcs,
  editDistance,
  knapsack,
  DEFAULT_KNAPSACK_ITEMS,
  coinChange,
  lis,
  matrixChain,
  rodCutting,
  subsetSum,
  DEFAULT_SUBSET_SUM_NUMS,
  DEFAULT_SUBSET_SUM_TARGET,
  longestPalindrome,
  DEFAULT_LPS_STRING,
  catalan,
  DEFAULT_CATALAN_N,
  kmpSearch,
  rabinKarpSearch,
  boyerMooreSearch,
  zAlgorithmSearch,
  solveNQueens,
  solveSudoku,
  SAMPLE_SUDOKU,
  solveKnightsTour,
  generateSubsets,
  DEFAULT_SUBSET_SET,
  BACKTRACKING_ALGORITHMS,
  GEOMETRY_ALGORITHMS,
  convexHull,
  SAMPLE_POINTS,
  closestPair,
  lineIntersection,
  SAMPLE_SEGMENTS,
  binarySearch,
  SEARCH_ALGORITHMS,
  activitySelection,
  fractionalKnapsack,
  GREEDY_ALGORITHMS,
  unionFind,
  monotonicStack,
  floydCycle,
  twoPointers,
  slidingWindow,
  PATTERN_ALGORITHMS,
  lruCache,
  DESIGN_ALGORITHMS,
  bloomFilter,
  PROBABILISTIC_ALGORITHMS,
  cosineSimilarity,
  VECTOR_SEARCH_ALGORITHMS,
  quickSortHoare,
  intervalMerge,
  skipList,
  countMinSketch,
  segmentTree,
  fenwickTree,
  hnsw,
  DEFAULT_SEGMENT_INPUT,
  DEFAULT_FENWICK_INPUT,
} from '@/lib/algorithms';
import type {
  AlgorithmConfig,
  AlgorithmResult,
  AnimationStep,
  ElementState,
  Graph,
  TreeNode,
  DPTable,
  Point2D,
} from '@/lib/algorithms';

// Static combined array — avoids re-creating on every render
const ALL_ALGORITHMS = [
  ...SORTING_ALGORITHMS, ...SEARCH_ALGORITHMS, ...GREEDY_ALGORITHMS,
  ...GRAPH_ALGORITHMS, ...TREE_ALGORITHMS, ...DP_ALGORITHMS,
  ...STRING_ALGORITHMS, ...BACKTRACKING_ALGORITHMS, ...GEOMETRY_ALGORITHMS,
  ...PATTERN_ALGORITHMS, ...PROBABILISTIC_ALGORITHMS, ...VECTOR_SEARCH_ALGORITHMS,
];

// ── Types ────────────────────────────────────────────────────

interface AlgorithmCategory {
  label: string;
  algorithms: AlgorithmConfig[];
}

export interface ComparisonState {
  enabled: boolean;
  comparisonAlgoId: string;
  comparisonResult: AlgorithmResult | null;
  comparisonStepIndex: number;
  comparisonStep: AnimationStep | null;
}

export interface AlgorithmPanelCallbacks {
  onStepChange?: (step: AnimationStep, index: number) => void;
  onArrayChange?: (arr: number[], states: ElementState[]) => void;
  onGraphChange?: (graph: Graph, algoId: string) => void;
  onTreeChange?: (tree: TreeNode | null, heapArray: number[] | null, algoId: string) => void;
  onDPChange?: (table: DPTable, algoId: string) => void;
  onStringMatchChange?: (text: string, pattern: string, algoId: string, failureFunction?: number[]) => void;
  onGeometryChange?: (points: Point2D[], algoId: string) => void;
  onVisualizationTypeChange?: (type: 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry') => void;
  onReset?: () => void;
  onAlgoChange?: (id: string) => void;
  onComparisonChange?: (state: ComparisonState) => void;
  onResultChange?: (result: AlgorithmResult) => void;
  /** Fires when playback playing state changes */
  onPlayingChange?: (playing: boolean) => void;
  /** Fires when playback naturally completes (reached last step) */
  onPlaybackComplete?: () => void;
  /** Exposes playback control methods to the parent so external UI (e.g. TimelineScrubber) can drive the controller */
  onExposeControls?: (controls: {
    playPause: () => void;
    stepForward: () => void;
    stepBackward: () => void;
    jumpToStep: (index: number) => void;
  }) => void;
}

// ── Algorithm Registry ───────────────────────────────────────

const SORTING_RUNNERS: Record<string, (arr: number[]) => AlgorithmResult> = {
  'bubble-sort': bubbleSort,
  'insertion-sort': insertionSort,
  'selection-sort': selectionSort,
  'merge-sort': mergeSort,
  'merge-sort-bottom-up': mergeSortBottomUp,
  'quick-sort': quickSort,
  'heap-sort': heapSort,
  'shell-sort': shellSort,
  'counting-sort': countingSort,
  'radix-sort': radixSort,
  'bucket-sort': bucketSort,
  'tim-sort': timSort,
  'cocktail-shaker-sort': cocktailShakerSort,
  'comb-sort': combSort,
  'pancake-sort': pancakeSort,
  'bogo-sort': bogoSort,
  'radix-sort-msd': radixSortMSD,
  'binary-search': binarySearch,
  'activity-selection': activitySelection,
  'fractional-knapsack': fractionalKnapsack,
  'monotonic-stack': monotonicStack,
  'floyd-cycle': floydCycle,
  'two-pointers': twoPointers,
  'sliding-window': slidingWindow,
  'lru-cache': lruCache,
  'bloom-filter': bloomFilter,
  'cosine-similarity': cosineSimilarity,
  'quick-sort-hoare': quickSortHoare,
  'interval-merge': intervalMerge,
  'skip-list': skipList,
  'count-min-sketch': countMinSketch,
};

const GRAPH_RUNNERS: Record<string, (graph: Graph, startNodeId: string) => AlgorithmResult> = {
  bfs,
  dfs,
  'dfs-iterative': dfsIterative,
  dijkstra,
  kruskal,
  'topological-sort': topologicalSort,
  'topological-sort-kahn': topologicalSortKahn,
  'bellman-ford': bellmanFord,
  'a-star': aStar,
  'tarjan-scc': (graph: Graph) => tarjanSCC(graph),
  prims,
  'floyd-warshall': floydWarshall,
  bipartite: bipartiteCheck,
  'cycle-detection': cycleDetection,
  'euler-path': eulerPath,
  'ford-fulkerson': fordFulkerson,
  'articulation-points': (graph: Graph) => articulationPoints(graph),
  bridges: (graph: Graph) => bridges(graph),
};

const TREE_RUNNER_IDS = new Set([
  'bst-operations',
  'avl-tree',
  'tree-traversals',
  'heap-operations',
  'red-black-tree',
  'b-tree',
  'huffman-tree',
  'trie-operations',
  'union-find',
  'segment-tree',
  'fenwick-tree',
]);

const DP_RUNNER_IDS = new Set([
  'fibonacci-dp',
  'lcs',
  'edit-distance',
  'knapsack',
  'coin-change',
  'lis',
  'matrix-chain',
  'rod-cutting',
  'subset-sum',
  'longest-palindrome',
  'catalan',
]);

const STRING_RUNNER_IDS = new Set([
  'kmp',
  'rabin-karp',
  'boyer-moore',
  'z-algorithm',
]);

const BACKTRACKING_RUNNER_IDS = new Set([
  'n-queens',
  'sudoku',
  'knights-tour',
  'subset-generation',
]);

const GEOMETRY_RUNNER_IDS = new Set([
  'convex-hull',
  'closest-pair',
  'line-intersection',
  'hnsw',
]);

const ALGORITHM_CATEGORIES: AlgorithmCategory[] = [
  { label: 'Sorting', algorithms: SORTING_ALGORITHMS },
  { label: 'Search', algorithms: SEARCH_ALGORITHMS },
  { label: 'Greedy', algorithms: GREEDY_ALGORITHMS },
  { label: 'Graph', algorithms: GRAPH_ALGORITHMS },
  { label: 'Tree', algorithms: TREE_ALGORITHMS },
  { label: 'DP', algorithms: DP_ALGORITHMS },
  { label: 'String', algorithms: STRING_ALGORITHMS },
  { label: 'Backtracking', algorithms: BACKTRACKING_ALGORITHMS },
  { label: 'Geometry', algorithms: GEOMETRY_ALGORITHMS },
  { label: 'Patterns', algorithms: PATTERN_ALGORITHMS },
  { label: 'Design', algorithms: DESIGN_ALGORITHMS },
  { label: 'Probabilistic', algorithms: PROBABILISTIC_ALGORITHMS },
  { label: 'AI/ML', algorithms: VECTOR_SEARCH_ALGORITHMS },
];

/** Determine the visualization type from algorithm ID. */
function getVisualizationType(algoId: string): 'array' | 'graph' | 'tree' | 'dp' | 'string' | 'backtracking' | 'geometry' {
  if (algoId in GRAPH_RUNNERS) return 'graph';
  if (TREE_RUNNER_IDS.has(algoId)) return 'tree';
  if (DP_RUNNER_IDS.has(algoId)) return 'dp';
  if (STRING_RUNNER_IDS.has(algoId)) return 'string';
  if (BACKTRACKING_RUNNER_IDS.has(algoId)) return 'backtracking';
  if (GEOMETRY_RUNNER_IDS.has(algoId)) return 'geometry';
  return 'array';
}

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;

// ── Helpers ──────────────────────────────────────────────────

type SortPreset = 'random' | 'nearly-sorted' | 'reverse' | 'few-unique' | 'all-same' | 'single-element';

function generateRandomArray(size = 20): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
}

function generatePresetArray(preset: SortPreset, size: number): number[] {
  switch (preset) {
    case 'nearly-sorted': {
      const arr = Array.from({ length: size }, (_, i) => i + 1);
      // swap ~10% of elements
      const swaps = Math.max(1, Math.floor(size * 0.1));
      for (let s = 0; s < swaps; s++) {
        const i = Math.floor(Math.random() * size);
        const j = Math.min(i + 1 + Math.floor(Math.random() * 3), size - 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    case 'reverse':
      return Array.from({ length: size }, (_, i) => size - i);
    case 'few-unique': {
      const uniqueVals = [10, 30, 50, 70, 90];
      return Array.from({ length: size }, () => uniqueVals[Math.floor(Math.random() * uniqueVals.length)]);
    }
    case 'all-same':
      return Array.from({ length: size }, () => 5);
    case 'single-element':
      return [42];
    case 'random':
    default:
      return generateRandomArray(size);
  }
}

function parseArrayInput(input: string): number[] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(',').map((s) => s.trim());
  const nums: number[] = [];

  for (const part of parts) {
    const n = Number(part);
    if (Number.isNaN(n)) return null;
    nums.push(n);
  }

  return nums.length > 0 ? nums : null;
}

// ── Worst-case input generation (ALG-173) ───────────────────

/** Sorting algorithm IDs that have a meaningful distinct worst-case input. */
const WORST_CASE_ALGORITHMS = new Set([
  'bubble-sort', 'insertion-sort', 'selection-sort', 'quick-sort', 'heap-sort',
]);

/** Generate the known worst-case input for a given sorting algorithm. */
function generateWorstCaseArray(algoId: string, size: number): number[] {
  switch (algoId) {
    case 'bubble-sort':
    case 'insertion-sort':
      // Reverse-sorted triggers maximum comparisons/swaps
      return Array.from({ length: size }, (_, i) => size - i);
    case 'quick-sort':
      // Already-sorted array with Lomuto pivot = pivot always smallest
      return Array.from({ length: size }, (_, i) => i + 1);
    case 'selection-sort':
    case 'heap-sort':
    default:
      // Always O(n^2) / O(n log n) respectively — use random
      return Array.from({ length: size }, () => Math.floor(Math.random() * 99) + 1);
  }
}

/** Get a human-readable note for the worst-case input. */
function getWorstCaseNote(algoId: string): string {
  switch (algoId) {
    case 'bubble-sort':
      return 'This is the worst-case input for Bubble Sort (reverse-sorted). Run it and watch the comparison counter!';
    case 'insertion-sort':
      return 'This is the worst-case input for Insertion Sort (reverse-sorted). Run it and watch the comparison counter!';
    case 'quick-sort':
      return 'This is the worst-case input for Quick Sort (sorted array, Lomuto pivot always smallest). Run it and watch the comparison counter!';
    case 'selection-sort':
      return 'Selection Sort is always O(n^2) regardless of input. Run it and watch the comparison counter!';
    case 'heap-sort':
      return 'Heap Sort is always O(n log n) regardless of input -- no true worst case. Run it and watch the comparison counter!';
    default:
      return '';
  }
}

/** Compute worst-case theoretical comparisons for scoring. */
function worstCaseComparisons(algoId: string, n: number): number {
  switch (algoId) {
    case 'bubble-sort':
    case 'selection-sort':
    case 'insertion-sort':
      return (n * (n - 1)) / 2;
    case 'quick-sort':
      return (n * (n - 1)) / 2; // O(n^2) Lomuto on sorted input
    case 'heap-sort':
      return n > 1 ? Math.round(2 * n * Math.log2(n)) : 0;
    default:
      return 0;
  }
}

// ── Component ────────────────────────────────────────────────

export const AlgorithmPanel = memo(function AlgorithmPanel({
  onStepChange,
  onArrayChange,
  onGraphChange,
  onTreeChange,
  onDPChange,
  onStringMatchChange,
  onGeometryChange,
  onVisualizationTypeChange,
  onReset,
  onAlgoChange,
  onComparisonChange,
  onResultChange,
  onPlayingChange,
  onPlaybackComplete,
  onExposeControls,
}: AlgorithmPanelCallbacks) {
  // State
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>(SORTING_ALGORITHMS[0].id);
  const [arrayInput, setArrayInput] = useState<string>('');
  const [currentArray, setCurrentArray] = useState<number[]>([]);
  const [result, setResult] = useState<AlgorithmResult | null>(null);
  const [playing, setPlaying] = useState(false);

  // Notify parent of playing state changes via effect (not during render)
  const prevPlayingRef = useRef(playing);
  useEffect(() => {
    if (prevPlayingRef.current !== playing) {
      prevPlayingRef.current = playing;
      onPlayingChange?.(playing);
    }
  }, [playing, onPlayingChange]);
  const [speed, setSpeed] = useState<number>(1);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<AnimationStep | null>(null);
  // Tree-specific state
  const [treeValueInput, setTreeValueInput] = useState<string>('');
  const [treeOperation, setTreeOperation] = useState<string>('insert');
  const [traversalType, setTraversalType] = useState<string>('inorder');
  const [heapOperation, setHeapOperation] = useState<string>('heapify');
  // DP-specific state
  const [dpString1, setDpString1] = useState<string>('');
  const [dpString2, setDpString2] = useState<string>('');
  const [dpNumber, setDpNumber] = useState<string>('');
  const [dpCoins, setDpCoins] = useState<string>('1, 3, 4');
  const [dpItems, setDpItems] = useState<string>('');
  // String matching state
  const [searchText, setSearchText] = useState<string>('');
  const [searchPattern, setSearchPattern] = useState<string>('');
  // Backtracking state
  const [nQueensSize, setNQueensSize] = useState<number>(8);
  // Custom graph editor state (ALG-330)
  const [customGraphMode, setCustomGraphMode] = useState(false);
  const [customNodes, setCustomNodes] = useState<Array<{id: string; label: string; x: number; y: number}>>([]);
  const [customEdges, setCustomEdges] = useState<Array<{source: string; target: string; weight: number; directed: boolean}>>([]);
  // Custom input: size slider + presets (Task 2)
  const [arraySize, setArraySize] = useState<number>(20);
  const [sortPreset, setSortPreset] = useState<SortPreset>('random');
  // Comparison mode (Task 1)
  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonAlgoId, setComparisonAlgoId] = useState<string>(SORTING_ALGORITHMS[1]?.id ?? SORTING_ALGORITHMS[0].id);
  const [comparisonResult, setComparisonResult] = useState<AlgorithmResult | null>(null);
  const [comparisonStepIndex, setComparisonStepIndex] = useState(0);
  const [comparisonStep, setComparisonStep] = useState<AnimationStep | null>(null);

  // ALG-174/211: Predict Mode state
  const [predictMode, setPredictMode] = useState(false);
  const [predictScore, setPredictScore] = useState({ correct: 0, total: 0 });
  const [showPredictOptions, setShowPredictOptions] = useState(false);
  const [predictOptions, setPredictOptions] = useState<string[]>([]);
  const [predictAnswer, setPredictAnswer] = useState<string>('');

  // ALG-160: Loading state for long-running computations
  const [computing, setComputing] = useState(false);

  // Worst-case challenge (ALG-173)
  const [worstCaseNote, setWorstCaseNote] = useState<string>('');
  const [worstCaseScore, setWorstCaseScore] = useState<{ actual: number; theoretical: number } | null>(null);

  // Searchable combobox state (ALG-158)
  const [algoSearchQuery, setAlgoSearchQuery] = useState('');
  const [algoDropdownOpen, setAlgoDropdownOpen] = useState(false);
  const algoDropdownRef = useRef<HTMLDivElement>(null);

  const controllerRef = useRef<PlaybackController | null>(null);
  const comparisonControllerRef = useRef<PlaybackController | null>(null);

  const vizType = getVisualizationType(selectedAlgoId);

  // Find the selected config from all categories
  const selectedConfig = ALL_ALGORITHMS.find((a) => a.id === selectedAlgoId) ?? SORTING_ALGORITHMS[0];

  // Comparison is only available for sorting algorithms
  const canCompare = vizType === 'array';

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      comparisonControllerRef.current?.destroy();
    };
  }, []);

  // Close algorithm dropdown on outside click (ALG-158)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (algoDropdownRef.current && !algoDropdownRef.current.contains(e.target as Node)) {
        setAlgoDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered algorithms for searchable combobox (ALG-158)
  const filteredAlgorithms = ALGORITHM_CATEGORIES.map((cat) => ({
    ...cat,
    algorithms: cat.algorithms.filter((a) =>
      a.name.toLowerCase().includes(algoSearchQuery.toLowerCase()),
    ),
  })).filter((cat) => cat.algorithms.length > 0);

  // Auto-generate sample data on first load so user sees bars immediately
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!hasInitialized.current && vizType === 'array' && currentArray.length === 0) {
      hasInitialized.current = true;
      const arr = generateRandomArray(15);
      setArrayInput(arr.join(', '));
      setCurrentArray(arr);
      const states: ElementState[] = arr.map(() => 'default');
      onArrayChange?.(arr, states);
    }
  }, [vizType, currentArray.length, onArrayChange]);

  // Notify parent when comparison state changes
  const emitComparisonState = useCallback((
    enabled: boolean,
    algoId: string,
    res: AlgorithmResult | null,
    sIdx: number,
    stp: AnimationStep | null,
  ) => {
    onComparisonChange?.({
      enabled,
      comparisonAlgoId: algoId,
      comparisonResult: res,
      comparisonStepIndex: sIdx,
      comparisonStep: stp,
    });
  }, [onComparisonChange]);

  // Step callback — intercepts when predictMode is on (ALG-174/211)
  const handleStep = useCallback(
    (step: AnimationStep, index: number) => {
      if (predictMode && index > 0 && result) {
        // Pause and show prediction options
        controllerRef.current?.pause();
        setPlaying(false);

        const correct = step.description;
        const others = result.steps
          .filter((s, i) => i !== index && Math.abs(i - index) < 5)
          .map(s => s.description)
          .filter(d => d !== correct)
          .sort(() => Math.random() - 0.5)
          .slice(0, 2);

        const shuffled = [correct, ...others].sort(() => Math.random() - 0.5);
        setPredictOptions(shuffled);
        setPredictAnswer(correct);
        setShowPredictOptions(true);
        return; // Don't advance yet
      }

      setStepIndex(index);
      setCurrentStep(step);
      onStepChange?.(step, index);
    },
    [onStepChange, predictMode, result],
  );

  // Playback completion callback — syncs React state when animation ends naturally
  const handlePlaybackComplete = useCallback(() => {
    setPlaying(false);
    onPlayingChange?.(false);
    onPlaybackComplete?.();
  }, [onPlayingChange, onPlaybackComplete]);

  // Comparison step callback
  const handleComparisonStep = useCallback(
    (step: AnimationStep, index: number) => {
      setComparisonStepIndex(index);
      setComparisonStep(step);
      // We emit the entire comparison state on each step
      // (The parent tracks this via onComparisonChange)
    },
    [],
  );

  // Generate random array
  const handleGenerate = useCallback(() => {
    const arr = generatePresetArray(sortPreset, arraySize);
    setArrayInput(arr.join(', '));
    setCurrentArray(arr);
    setResult(null);
    setComparisonResult(null);
    controllerRef.current?.destroy();
    controllerRef.current = null;
    comparisonControllerRef.current?.destroy();
    comparisonControllerRef.current = null;
    setPlaying(false);
    setStepIndex(0);
    setCurrentStep(null);
    setComparisonStepIndex(0);
    setComparisonStep(null);
    setWorstCaseNote('');
    setWorstCaseScore(null);
    onReset?.();

    const states: ElementState[] = arr.map(() => 'default');
    onArrayChange?.(arr, states);
    emitComparisonState(comparisonMode, comparisonAlgoId, null, 0, null);
  }, [onArrayChange, onReset, arraySize, sortPreset, comparisonMode, comparisonAlgoId, emitComparisonState]);

  // Try Worst Case — generate worst-case input and auto-fill (ALG-173)
  const handleTryWorstCase = useCallback(() => {
    const arr = generateWorstCaseArray(selectedAlgoId, arraySize);
    setArrayInput(arr.join(', '));
    setCurrentArray(arr);
    setResult(null);
    setComparisonResult(null);
    controllerRef.current?.destroy();
    controllerRef.current = null;
    comparisonControllerRef.current?.destroy();
    comparisonControllerRef.current = null;
    setPlaying(false);
    setStepIndex(0);
    setCurrentStep(null);
    setComparisonStepIndex(0);
    setComparisonStep(null);
    setWorstCaseNote(getWorstCaseNote(selectedAlgoId));
    setWorstCaseScore(null);
    onReset?.();

    const states: ElementState[] = arr.map(() => 'default');
    onArrayChange?.(arr, states);
    emitComparisonState(comparisonMode, comparisonAlgoId, null, 0, null);
  }, [selectedAlgoId, arraySize, onArrayChange, onReset, comparisonMode, comparisonAlgoId, emitComparisonState]);

  // ── ALG-258: Per-category run handlers ─────────────────────

  const handleRunTree = useCallback((): AlgorithmResult | null => {
    const sampleInfo = SAMPLE_TREE_FOR_ALGORITHM[selectedAlgoId];
    const val = parseInt(treeValueInput, 10);

    if (selectedAlgoId === 'bst-operations') {
      const tree = sampleInfo?.tree ?? BALANCED_BST;
      let res: AlgorithmResult;
      if (treeOperation === 'insert') {
        const insertVal = Number.isNaN(val) ? 5 : val;
        res = bstInsert(tree, insertVal);
      } else if (treeOperation === 'search') {
        const searchVal = Number.isNaN(val) ? 8 : val;
        res = bstSearch(tree, searchVal);
      } else {
        const deleteVal = Number.isNaN(val) ? 4 : val;
        res = bstDelete(tree, deleteVal);
      }
      onTreeChange?.(tree, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'avl-tree') {
      const tree = sampleInfo?.tree ?? BALANCED_BST;
      const insertVal = Number.isNaN(val) ? 5 : val;
      const res = avlInsert(tree, insertVal);
      onTreeChange?.(tree, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'tree-traversals') {
      const tree = sampleInfo?.tree ?? BALANCED_BST;
      let res: AlgorithmResult;
      if (traversalType === 'inorder') {
        res = inorderTraversal(tree);
      } else if (traversalType === 'preorder') {
        res = preorderTraversal(tree);
      } else if (traversalType === 'postorder') {
        res = postorderTraversal(tree);
      } else {
        res = levelOrderTraversal(tree);
      }
      onTreeChange?.(tree, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'heap-operations') {
      const arr = sampleInfo?.array ?? [4, 10, 3, 5, 1];
      if (heapOperation === 'heapify') {
        const res = heapify(arr);
        onTreeChange?.(arrayToTree(arr), arr, selectedAlgoId);
        return res;
      } else if (heapOperation === 'insert') {
        const insertVal = Number.isNaN(val) ? 11 : val;
        const heapified = heapify(arr);
        const heapArr = heapified.finalState;
        const res = heapInsert(heapArr, insertVal);
        onTreeChange?.(arrayToTree(heapArr), heapArr, selectedAlgoId);
        return res;
      } else {
        const heapified = heapify(arr);
        const heapArr = heapified.finalState;
        const res = heapExtractMax(heapArr);
        onTreeChange?.(arrayToTree(heapArr), heapArr, selectedAlgoId);
        return res;
      }
    } else if (selectedAlgoId === 'red-black-tree') {
      const tree = sampleInfo?.tree ?? BALANCED_BST;
      const insertVal = Number.isNaN(val) ? 5 : val;
      const res = rbInsert(tree, insertVal);
      onTreeChange?.(tree, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'b-tree') {
      const insertVal = Number.isNaN(val) ? 5 : val;
      const res = bTreeInsert(null, insertVal, 3);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'huffman-tree') {
      const text = dpString1 || 'abracadabra';
      const res = huffmanBuild(text);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'trie-operations') {
      const word = treeValueInput || 'hello';
      const root = createTrieRoot();
      const res = trieInsertAlgo(root, word);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'union-find') {
      const res = unionFind([]);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'segment-tree') {
      const res = segmentTree(DEFAULT_SEGMENT_INPUT);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'fenwick-tree') {
      const res = fenwickTree(DEFAULT_FENWICK_INPUT);
      onTreeChange?.(null, null, selectedAlgoId);
      return res;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] No tree runner for '${selectedAlgoId}'. Add it to TREE_RUNNER_IDS and handleRun in AlgorithmPanel.tsx.`
      );
    }
    return null;
  }, [selectedAlgoId, treeValueInput, treeOperation, traversalType, heapOperation, dpString1, onTreeChange]);

  const handleRunGraph = useCallback((): AlgorithmResult | null => {
    const graphRunner = GRAPH_RUNNERS[selectedAlgoId];
    if (!graphRunner) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Architex] No runner found for '${selectedAlgoId}'. Add it to GRAPH_RUNNERS in AlgorithmPanel.tsx. See docs/guides/adding-an-algorithm.md`
        );
      }
      return null;
    }

    // ALG-330: Use custom graph when in custom graph mode with nodes defined
    if (customGraphMode && customNodes.length > 0) {
      const graph: Graph = { nodes: customNodes, edges: customEdges };
      const startNode = customNodes[0]?.id || 'A';
      const res = graphRunner(graph, startNode);
      onGraphChange?.(graph, selectedAlgoId);
      return res;
    }

    const sampleInfo = SAMPLE_GRAPH_FOR_ALGORITHM[selectedAlgoId];
    if (!sampleInfo) return null;

    const res = graphRunner(sampleInfo.graph, sampleInfo.startNodeId);
    onGraphChange?.(sampleInfo.graph, selectedAlgoId);
    return res;
  }, [selectedAlgoId, onGraphChange, customGraphMode, customNodes, customEdges]);

  const handleRunDP = useCallback((): AlgorithmResult | null => {
    if (selectedAlgoId === 'fibonacci-dp') {
      const n = parseInt(dpNumber, 10);
      const fibRes = fibonacciDP(Number.isNaN(n) ? 10 : n);
      onDPChange?.(fibRes.dpTable, selectedAlgoId);
      return fibRes;
    } else if (selectedAlgoId === 'lcs') {
      const s1 = dpString1 || 'ABCBDAB';
      const s2 = dpString2 || 'BDCAB';
      const lcsRes = lcs(s1, s2);
      onDPChange?.(lcsRes.dpTable, selectedAlgoId);
      return lcsRes;
    } else if (selectedAlgoId === 'edit-distance') {
      const s1 = dpString1 || 'kitten';
      const s2 = dpString2 || 'sitting';
      const edRes = editDistance(s1, s2);
      onDPChange?.(edRes.dpTable, selectedAlgoId);
      return edRes;
    } else if (selectedAlgoId === 'knapsack') {
      const cap = parseInt(dpNumber, 10);
      const capacity = Number.isNaN(cap) ? 10 : cap;
      let items = DEFAULT_KNAPSACK_ITEMS;
      if (dpItems.trim()) {
        const parsed = dpItems.split(';').map((s) => {
          const parts = s.trim().split(',').map((p) => p.trim());
          return {
            name: parts[0] || '?',
            weight: parseInt(parts[1] || '0', 10),
            value: parseInt(parts[2] || '0', 10),
          };
        }).filter((item) => item.weight > 0);
        if (parsed.length > 0) items = parsed;
      }
      const ksRes = knapsack(items, capacity);
      onDPChange?.(ksRes.dpTable, selectedAlgoId);
      return ksRes;
    } else if (selectedAlgoId === 'coin-change') {
      const amt = parseInt(dpNumber, 10);
      const amount = Number.isNaN(amt) ? 11 : amt;
      const coins = dpCoins
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0);
      const ccRes = coinChange(coins.length > 0 ? coins : [1, 3, 4], amount);
      onDPChange?.(ccRes.dpTable, selectedAlgoId);
      return ccRes;
    } else if (selectedAlgoId === 'lis') {
      const input = dpString1 || '10, 9, 2, 5, 3, 7, 101, 18';
      const arr = input.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
      const lisRes = lis(arr.length > 0 ? arr : [10, 9, 2, 5, 3, 7, 101, 18]);
      onDPChange?.(lisRes.dpTable, selectedAlgoId);
      return lisRes;
    } else if (selectedAlgoId === 'matrix-chain') {
      const input = dpString1 || '30, 35, 15, 5, 10, 20, 25';
      const dims = input.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !Number.isNaN(n));
      const mcRes = matrixChain(dims.length > 1 ? dims : [30, 35, 15, 5, 10, 20, 25]);
      onDPChange?.(mcRes.dpTable, selectedAlgoId);
      return mcRes;
    } else if (selectedAlgoId === 'rod-cutting') {
      const n = parseInt(dpNumber, 10);
      const rodLen = Number.isNaN(n) || n < 1 ? 8 : n;
      const defaultPrices = [0, 1, 5, 8, 9, 10, 17, 17, 20, 24, 30];
      const rcRes = rodCutting(defaultPrices, rodLen);
      onDPChange?.(rcRes.dpTable, selectedAlgoId);
      return rcRes;
    } else if (selectedAlgoId === 'subset-sum') {
      const target = parseInt(dpNumber, 10);
      const ssRes = subsetSum(DEFAULT_SUBSET_SUM_NUMS, Number.isNaN(target) ? DEFAULT_SUBSET_SUM_TARGET : target);
      onDPChange?.(ssRes.dpTable, selectedAlgoId);
      return ssRes;
    } else if (selectedAlgoId === 'longest-palindrome') {
      const s = dpString1 || DEFAULT_LPS_STRING;
      const lpRes = longestPalindrome(s);
      onDPChange?.(lpRes.dpTable, selectedAlgoId);
      return lpRes;
    } else if (selectedAlgoId === 'catalan') {
      const n = parseInt(dpNumber, 10);
      const catRes = catalan(Number.isNaN(n) || n < 1 ? DEFAULT_CATALAN_N : n);
      onDPChange?.(catRes.dpTable, selectedAlgoId);
      return catRes;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] No DP runner for '${selectedAlgoId}'. Add it to DP_RUNNER_IDS and handleRun in AlgorithmPanel.tsx.`
      );
    }
    return null;
  }, [selectedAlgoId, dpNumber, dpString1, dpString2, dpCoins, dpItems, onDPChange]);

  const handleRunString = useCallback((): AlgorithmResult | null => {
    const text = searchText || 'ABABDABACDABABCABAB';
    const pat = searchPattern || 'ABABCABAB';

    if (selectedAlgoId === 'kmp') {
      const kmpRes = kmpSearch(text, pat);
      onStringMatchChange?.(text, pat, selectedAlgoId, kmpRes.failureFunction);
      return kmpRes;
    } else if (selectedAlgoId === 'rabin-karp') {
      const rkRes = rabinKarpSearch(text, pat);
      onStringMatchChange?.(text, pat, selectedAlgoId);
      return rkRes;
    } else if (selectedAlgoId === 'boyer-moore') {
      const bmRes = boyerMooreSearch(text, pat);
      onStringMatchChange?.(text, pat, selectedAlgoId);
      return bmRes;
    } else if (selectedAlgoId === 'z-algorithm') {
      const zRes = zAlgorithmSearch(text, pat);
      onStringMatchChange?.(text, pat, selectedAlgoId);
      return zRes;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] No string runner for '${selectedAlgoId}'. Add it to STRING_RUNNER_IDS and handleRun in AlgorithmPanel.tsx.`
      );
    }
    return null;
  }, [selectedAlgoId, searchText, searchPattern, onStringMatchChange]);

  const handleRunBacktracking = useCallback((): AlgorithmResult | null => {
    if (selectedAlgoId === 'n-queens') {
      return solveNQueens(nQueensSize);
    } else if (selectedAlgoId === 'sudoku') {
      return solveSudoku(SAMPLE_SUDOKU);
    } else if (selectedAlgoId === 'knights-tour') {
      return solveKnightsTour(Math.min(nQueensSize, 6));
    } else if (selectedAlgoId === 'subset-generation') {
      return generateSubsets(DEFAULT_SUBSET_SET);
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] No backtracking runner for '${selectedAlgoId}'. Add it to BACKTRACKING_RUNNER_IDS and handleRun in AlgorithmPanel.tsx.`
      );
    }
    return null;
  }, [selectedAlgoId, nQueensSize]);

  const handleRunGeometry = useCallback((): AlgorithmResult | null => {
    if (selectedAlgoId === 'convex-hull') {
      const pts = SAMPLE_POINTS;
      const res = convexHull(pts);
      onGeometryChange?.(pts, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'closest-pair') {
      const pts = SAMPLE_POINTS;
      const res = closestPair(pts);
      onGeometryChange?.(pts, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'line-intersection') {
      const pts = SAMPLE_SEGMENTS.flatMap((s) => [s.p, s.q]);
      const res = lineIntersection(SAMPLE_SEGMENTS);
      onGeometryChange?.(pts, selectedAlgoId);
      return res;
    } else if (selectedAlgoId === 'hnsw') {
      const res = hnsw(SAMPLE_POINTS);
      onGeometryChange?.(SAMPLE_POINTS, selectedAlgoId);
      return res;
    }

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Architex] No geometry runner for '${selectedAlgoId}'. Add it to GEOMETRY_RUNNER_IDS and handleRun in AlgorithmPanel.tsx.`
      );
    }
    return null;
  }, [selectedAlgoId, onGeometryChange]);

  const handleRunSorting = useCallback((): AlgorithmResult | null => {
    const parsed = parseArrayInput(arrayInput);
    const arr = parsed ?? (currentArray.length > 0 ? currentArray : generatePresetArray(sortPreset, arraySize));

    if (!parsed && currentArray.length === 0) {
      setArrayInput(arr.join(', '));
    }

    setCurrentArray(arr);

    const sortingRunner = SORTING_RUNNERS[selectedAlgoId];
    if (!sortingRunner) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Architex] No runner found for '${selectedAlgoId}'. Add it to SORTING_RUNNERS in AlgorithmPanel.tsx. See docs/guides/adding-an-algorithm.md`
        );
      }
      return null;
    }

    const res = sortingRunner(arr);

    const states: ElementState[] = arr.map(() => 'default');
    onArrayChange?.(arr, states);

    // Run comparison algorithm on same input if enabled
    if (comparisonMode && canCompare) {
      const compRunner = SORTING_RUNNERS[comparisonAlgoId];
      if (compRunner) {
        const compRes = compRunner([...arr]);
        setComparisonResult(compRes);

        comparisonControllerRef.current?.destroy();
        const compCtrl = new PlaybackController(compRes.steps, handleComparisonStep);
        compCtrl.setSpeed(speed);
        comparisonControllerRef.current = compCtrl;
        setComparisonStepIndex(0);
        setComparisonStep(compRes.steps[0] ?? null);
        emitComparisonState(true, comparisonAlgoId, compRes, 0, compRes.steps[0] ?? null);
      }
    }

    return res;
  }, [arrayInput, currentArray, selectedAlgoId, arraySize, sortPreset, onArrayChange, comparisonMode, canCompare, comparisonAlgoId, speed, handleComparisonStep, emitComparisonState]);

  // ── ALG-258: Main dispatcher ──────────────────────────────

  // Run algorithm (+ comparison if enabled)
  // ALG-160: Wrapped with computing state to show spinner during execution
  const handleRun = useCallback(() => {
    setComputing(true);

    requestAnimationFrame(() => {
      let res: AlgorithmResult | null;

      switch (vizType) {
        case 'tree':
          res = handleRunTree();
          break;
        case 'graph':
          res = handleRunGraph();
          break;
        case 'dp':
          res = handleRunDP();
          break;
        case 'string':
          res = handleRunString();
          break;
        case 'backtracking':
          res = handleRunBacktracking();
          break;
        case 'geometry':
          res = handleRunGeometry();
          break;
        default:
          res = handleRunSorting();
          break;
      }

      setComputing(false);

      if (!res) return;

      // ALG-257: Warn if algorithm produced 0 steps on non-trivial input
      if (process.env.NODE_ENV === 'development' && res.steps.length === 0) {
        console.warn(
          `[Architex] Algorithm '${selectedAlgoId}' produced 0 steps. Verify the runner returns at least one AnimationStep.`
        );
      }

      setResult(res);
      onResultChange?.(res);

      // Worst-case scoring (ALG-173)
      if (worstCaseNote && WORST_CASE_ALGORITHMS.has(selectedAlgoId) && res.steps.length > 0) {
        const actual = res.steps[res.steps.length - 1].complexity.comparisons;
        const theoretical = worstCaseComparisons(selectedAlgoId, res.finalState.length);
        setWorstCaseScore({ actual, theoretical });
      } else {
        setWorstCaseScore(null);
      }

      // Destroy previous controller
      controllerRef.current?.destroy();

      // Create new controller
      const ctrl = new PlaybackController(res.steps, handleStep, handlePlaybackComplete);
      ctrl.setSpeed(speed);
      controllerRef.current = ctrl;

      ctrl.play();
      setPlaying(true);
      setStepIndex(0);
    });
  }, [vizType, selectedAlgoId, speed, handleStep, handlePlaybackComplete, onResultChange, handleRunTree, handleRunGraph, handleRunDP, handleRunString, handleRunBacktracking, handleRunGeometry, handleRunSorting, worstCaseNote]);

  // Synchronized playback controls
  const handlePlayPause = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;

    if (playing) {
      ctrl.pause();
      comparisonControllerRef.current?.pause();
      setPlaying(false);
    } else {
      ctrl.play();
      comparisonControllerRef.current?.play();
      setPlaying(true);
    }
  }, [playing]);

  const handleStop = useCallback(() => {
    controllerRef.current?.stop();
    comparisonControllerRef.current?.stop();
    setPlaying(false);
    setStepIndex(0);
    setComparisonStepIndex(0);
  }, []);

  const handleStepForward = useCallback(() => {
    controllerRef.current?.stepForward();
    comparisonControllerRef.current?.stepForward();
    setPlaying(false);
  }, []);

  const handleStepBackward = useCallback(() => {
    controllerRef.current?.stepBackward();
    comparisonControllerRef.current?.stepBackward();
    setPlaying(false);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    controllerRef.current?.setSpeed(newSpeed);
    comparisonControllerRef.current?.setSpeed(newSpeed);
  }, []);

  // Expose playback controls to parent for external UI (e.g. TimelineScrubber)
  useEffect(() => {
    onExposeControls?.({
      playPause: () => {
        const ctrl = controllerRef.current;
        if (!ctrl) return;
        if (playing) {
          ctrl.pause();
          comparisonControllerRef.current?.pause();
          setPlaying(false);
        } else {
          ctrl.play();
          comparisonControllerRef.current?.play();
          setPlaying(true);
        }
      },
      stepForward: () => {
        controllerRef.current?.stepForward();
        comparisonControllerRef.current?.stepForward();
        setPlaying(false);
      },
      stepBackward: () => {
        controllerRef.current?.stepBackward();
        comparisonControllerRef.current?.stepBackward();
        setPlaying(false);
      },
      jumpToStep: (index: number) => {
        controllerRef.current?.jumpTo(index);
        comparisonControllerRef.current?.jumpTo(index);
      },
    });
  }, [onExposeControls, playing]);

  // ALG-174/211: Handle predict answer selection
  const handlePredictAnswer = useCallback((selectedOption: string) => {
    const correct = selectedOption === predictAnswer;
    setPredictScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
    }));
    setShowPredictOptions(false);
    // Advance to the actual step
    controllerRef.current?.stepForward();
  }, [predictAnswer]);

  // Toggle comparison mode
  const handleToggleComparison = useCallback(() => {
    const next = !comparisonMode;
    setComparisonMode(next);
    if (!next) {
      // Turning off comparison mode
      comparisonControllerRef.current?.destroy();
      comparisonControllerRef.current = null;
      setComparisonResult(null);
      setComparisonStepIndex(0);
      setComparisonStep(null);
      emitComparisonState(false, comparisonAlgoId, null, 0, null);
    } else {
      emitComparisonState(true, comparisonAlgoId, comparisonResult, comparisonStepIndex, comparisonStep);
    }
  }, [comparisonMode, comparisonAlgoId, comparisonResult, comparisonStepIndex, comparisonStep, emitComparisonState]);

  // Keyboard shortcuts for playback (ALG-155)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          handleStepForward();
          break;
        case 'ArrowLeft':
          handleStepBackward();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, handleStepForward, handleStepBackward]);

  const totalSteps = result?.steps.length ?? 0;
  const compTotalSteps = comparisonResult?.steps.length ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden relative">
      {/* ALG-160: Computing spinner overlay */}
      {computing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="border-b border-sidebar-border px-3 py-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
          Algorithm Visualizer
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* ALG-232: Daily challenge banner */}
        <div className="mb-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="h-3 w-3 text-primary drop-shadow-[0_0_4px_rgba(110,86,207,0.5)]" />
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Daily Challenge
            </span>
          </div>
          <p className="text-xs text-foreground-muted">
            Today: Predict how many comparisons Bubble Sort needs for [7, 2, 5, 1, 8]
          </p>
        </div>

        {/* Algorithm selection — searchable combobox (ALG-158) */}
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-foreground-muted">
            Algorithm
          </label>

          {/* Searchable combobox for desktop */}
          <div ref={algoDropdownRef} className="relative hidden sm:block">
            <input
              type="text"
              aria-label="Search algorithms"
              placeholder={selectedConfig.name || 'Search algorithms...'}
              value={algoSearchQuery}
              onChange={(e) => { setAlgoSearchQuery(e.target.value); setAlgoDropdownOpen(true); }}
              onFocus={() => setAlgoDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setAlgoDropdownOpen(false);
                  setAlgoSearchQuery('');
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="h-8 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {algoDropdownOpen && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl">
                {filteredAlgorithms.length === 0 && (
                  <div className="px-3 py-2 text-xs text-foreground-muted">No algorithms found</div>
                )}
                {filteredAlgorithms.map((cat) => (
                  <div key={cat.label}>
                    <div className="px-2 py-1 text-[10px] font-semibold text-foreground-muted uppercase tracking-wider">{cat.label}</div>
                    {cat.algorithms.map((algo) => (
                      <button
                        key={algo.id}
                        onClick={() => {
                          const newId = algo.id;
                          setSelectedAlgoId(newId);
                          onAlgoChange?.(newId);
                          setResult(null);
                          setComparisonResult(null);
                          controllerRef.current?.destroy();
                          controllerRef.current = null;
                          comparisonControllerRef.current?.destroy();
                          comparisonControllerRef.current = null;
                          setPlaying(false);
                          setStepIndex(0);
                          setCurrentStep(null);
                          setComparisonStepIndex(0);
                          setComparisonStep(null);
                          onVisualizationTypeChange?.(getVisualizationType(newId));
                          onReset?.();
                          setWorstCaseNote('');
                          setWorstCaseScore(null);
                          // Reset DP-specific state
                          setDpString1('');
                          setDpString2('');
                          setDpNumber('');
                          setDpCoins('1, 3, 4');
                          setDpItems('');
                          // Reset string-specific state
                          setSearchText('');
                          setSearchPattern('');
                          // Reset tree-specific state
                          setTreeValueInput('');
                          if (getVisualizationType(newId) !== 'array') {
                            setComparisonMode(false);
                            emitComparisonState(false, comparisonAlgoId, null, 0, null);
                          }
                          setAlgoDropdownOpen(false);
                          setAlgoSearchQuery('');
                        }}
                        className={cn(
                          'w-full px-3 py-1.5 text-left text-sm hover:bg-elevated transition-colors',
                          algo.id === selectedAlgoId && 'bg-primary/10 text-primary font-medium',
                        )}
                      >
                        {algo.name}{algo.difficulty ? ` (${algo.difficulty})` : ''}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Native select fallback for mobile */}
          <select
            aria-label="Algorithm selector"
            value={selectedAlgoId}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedAlgoId(newId);
              onAlgoChange?.(newId);
              setResult(null);
              setComparisonResult(null);
              controllerRef.current?.destroy();
              controllerRef.current = null;
              comparisonControllerRef.current?.destroy();
              comparisonControllerRef.current = null;
              setPlaying(false);
              setStepIndex(0);
              setCurrentStep(null);
              setComparisonStepIndex(0);
              setComparisonStep(null);
              onVisualizationTypeChange?.(getVisualizationType(newId));
              onReset?.();
              setWorstCaseNote('');
              setWorstCaseScore(null);
              // Reset DP-specific state
              setDpString1('');
              setDpString2('');
              setDpNumber('');
              setDpCoins('1, 3, 4');
              setDpItems('');
              // Reset string-specific state
              setSearchText('');
              setSearchPattern('');
              // Reset tree-specific state
              setTreeValueInput('');
              if (getVisualizationType(newId) !== 'array') {
                setComparisonMode(false);
                emitComparisonState(false, comparisonAlgoId, null, 0, null);
              }
            }}
            className="h-8 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:hidden transition-all"
          >
            {ALGORITHM_CATEGORIES.map((cat) => (
              <optgroup key={cat.label} label={cat.label}>
                {cat.algorithms.map((algo) => (
                  <option key={algo.id} value={algo.id}>
                    {algo.name}{algo.difficulty ? ` (${algo.difficulty})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Compare toggle -- only for sorting algorithms */}
        {canCompare && (
          <div className="mb-3">
            <button
              onClick={handleToggleComparison}
              className={cn(
                'flex h-7 w-full items-center justify-center gap-1.5 rounded-xl border text-xs font-medium transition-all',
                comparisonMode
                  ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]'
                  : 'border-border/30 bg-background text-foreground-muted hover:bg-elevated hover:text-foreground',
              )}
            >
              <Columns2 className="h-3 w-3" />
              {comparisonMode ? 'Compare Mode ON' : 'Compare Side-by-Side'}
            </button>

            {comparisonMode && (
              <div className="mt-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Compare against
                </label>
                <select
                  value={comparisonAlgoId}
                  onChange={(e) => {
                    setComparisonAlgoId(e.target.value);
                    setComparisonResult(null);
                    comparisonControllerRef.current?.destroy();
                    comparisonControllerRef.current = null;
                    setComparisonStepIndex(0);
                    setComparisonStep(null);
                    emitComparisonState(true, e.target.value, null, 0, null);
                  }}
                  className="h-7 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  {SORTING_ALGORITHMS.filter((a) => a.id !== selectedAlgoId).map((algo) => (
                    <option key={algo.id} value={algo.id}>
                      {algo.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Algorithm info */}
        <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
          <p className="text-xs text-foreground-muted">{selectedConfig.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedConfig.stable !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-medium border backdrop-blur-sm transition-all',
                  selectedConfig.stable
                    ? 'bg-state-success/10 text-state-success border-state-success/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]'
                    : 'bg-state-warning/10 text-state-warning border-state-warning/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
                )}
              >
                {selectedConfig.stable ? 'Stable' : 'Unstable'}
              </span>
            )}
            {selectedConfig.inPlace !== undefined && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-medium border backdrop-blur-sm transition-all',
                  selectedConfig.inPlace
                    ? 'bg-state-active/10 text-state-active border-state-active/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                    : 'bg-severity-high/10 text-severity-high border-severity-high/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]',
                )}
              >
                {selectedConfig.inPlace ? 'In-Place' : 'Not In-Place'}
              </span>
            )}
          </div>
        </div>

        {/* Input area: varies by visualization type */}
        {vizType === 'tree' ? (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Tree Data
            </label>
            {(() => {
              const info = SAMPLE_TREE_FOR_ALGORITHM[selectedAlgoId];
              return info ? (
                <div className="mb-2 rounded-md border border-border bg-background p-2">
                  <p className="text-xs font-medium text-foreground">{info.label}</p>
                </div>
              ) : null;
            })()}

            {/* BST operation selector */}
            {selectedAlgoId === 'bst-operations' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Operation
                </label>
                <select
                  value={treeOperation}
                  onChange={(e) => setTreeOperation(e.target.value)}
                  className="mb-2 h-7 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="insert">Insert</option>
                  <option value="search">Search</option>
                  <option value="delete">Delete</option>
                </select>
                <input
                  type="text"
                  placeholder="Value (e.g. 5)"
                  value={treeValueInput}
                  onChange={(e) => setTreeValueInput(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* AVL value input */}
            {selectedAlgoId === 'avl-tree' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Insert Value
                </label>
                <input
                  type="text"
                  placeholder="Value to insert (e.g. 5)"
                  value={treeValueInput}
                  onChange={(e) => setTreeValueInput(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Traversal type selector */}
            {selectedAlgoId === 'tree-traversals' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Traversal Type
                </label>
                <select
                  value={traversalType}
                  onChange={(e) => setTraversalType(e.target.value)}
                  className="mb-2 h-7 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="inorder">Inorder (Left, Root, Right)</option>
                  <option value="preorder">Preorder (Root, Left, Right)</option>
                  <option value="postorder">Postorder (Left, Right, Root)</option>
                  <option value="levelorder">Level-order (BFS)</option>
                </select>
              </div>
            )}

            {/* Heap operation selector */}
            {selectedAlgoId === 'heap-operations' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Operation
                </label>
                <select
                  value={heapOperation}
                  onChange={(e) => setHeapOperation(e.target.value)}
                  className="mb-2 h-7 w-full rounded-xl border border-border/30 bg-background/90 backdrop-blur-sm px-2 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="heapify">Build Heap (Heapify)</option>
                  <option value="insert">Insert</option>
                  <option value="extract-max">Extract Max</option>
                </select>
                {heapOperation === 'insert' && (
                  <input
                    type="text"
                    placeholder="Value to insert (e.g. 11)"
                    value={treeValueInput}
                    onChange={(e) => setTreeValueInput(e.target.value)}
                    className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            )}

            <button
              onClick={handleRun}
              className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" />
              Run
            </button>
          </div>
        ) : vizType === 'graph' ? (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Graph Data
            </label>
            {/* ALG-330: Custom graph toggle */}
            <button
              onClick={() => setCustomGraphMode(prev => !prev)}
              className={cn(
                'mb-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-md border text-xs font-medium',
                customGraphMode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground-muted hover:bg-elevated'
              )}
            >
              {customGraphMode ? 'Using Custom Graph' : 'Create Custom Graph'}
            </button>
            {/* ALG-330: Custom graph text-based editor */}
            {customGraphMode && (
              <div className="mt-2 space-y-2">
                <div>
                  <label className="text-[10px] font-medium text-foreground-subtle">Nodes (comma-separated labels)</label>
                  <input
                    type="text"
                    placeholder="A, B, C, D, E"
                    onChange={(e) => {
                      const labels = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      setCustomNodes(labels.map((label, i) => ({
                        id: label,
                        label,
                        x: 100 + (i % 4) * 120,
                        y: 80 + Math.floor(i / 4) * 120,
                      })));
                    }}
                    className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-foreground-subtle">Edges (format: A-B:5, B-C:3)</label>
                  <input
                    type="text"
                    placeholder="A-B:5, B-C:3, A-C:7"
                    onChange={(e) => {
                      const edges = e.target.value.split(',').map(s => {
                        const match = s.trim().match(/^(\w+)-(\w+)(?::(\d+))?$/);
                        if (!match) return null;
                        return { source: match[1], target: match[2], weight: parseInt(match[3] || '1'), directed: false };
                      }).filter(Boolean) as typeof customEdges;
                      setCustomEdges(edges);
                    }}
                    className="h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <p className="text-[9px] text-foreground-subtle">{customNodes.length} nodes, {customEdges.length} edges</p>
              </div>
            )}
            {/* Sample graph info (shown when not in custom mode) */}
            {!customGraphMode && (() => {
              const info = SAMPLE_GRAPH_FOR_ALGORITHM[selectedAlgoId];
              return info ? (
                <div className="mb-2 rounded-md border border-border bg-background p-2">
                  <p className="text-xs font-medium text-foreground">{info.label}</p>
                  <p className="mt-0.5 text-[10px] text-foreground-subtle">
                    {info.graph.nodes.length} nodes, {info.graph.edges.length} edges
                    {' | Start: '}
                    <span className="font-mono font-medium text-primary">{info.startNodeId}</span>
                  </p>
                </div>
              ) : null;
            })()}
            <button
              onClick={handleRun}
              className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" />
              Run
            </button>
          </div>
        ) : vizType === 'dp' ? (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              DP Input
            </label>

            {/* Fibonacci: just n */}
            {selectedAlgoId === 'fibonacci-dp' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  n (compute Fibonacci(n))
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10"
                  value={dpNumber}
                  onChange={(e) => setDpNumber(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* LCS / Edit Distance: two strings */}
            {(selectedAlgoId === 'lcs' || selectedAlgoId === 'edit-distance') && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  String 1
                </label>
                <input
                  type="text"
                  placeholder={selectedAlgoId === 'lcs' ? 'e.g. ABCBDAB' : 'e.g. kitten'}
                  value={dpString1}
                  onChange={(e) => setDpString1(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  String 2
                </label>
                <input
                  type="text"
                  placeholder={selectedAlgoId === 'lcs' ? 'e.g. BDCAB' : 'e.g. sitting'}
                  value={dpString2}
                  onChange={(e) => setDpString2(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {/* Knapsack: capacity + items */}
            {selectedAlgoId === 'knapsack' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Capacity
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10"
                  value={dpNumber}
                  onChange={(e) => setDpNumber(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Items (name,weight,value; ...)
                </label>
                <input
                  type="text"
                  placeholder="A,2,3; B,3,4; C,4,5; D,5,8"
                  value={dpItems}
                  onChange={(e) => setDpItems(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <p className="text-[9px] text-foreground-subtle">
                  Leave blank for default items: A(w=2,v=3), B(w=3,v=4), C(w=4,v=5), D(w=5,v=8)
                </p>
              </div>
            )}

            {/* Coin Change: amount + coins */}
            {selectedAlgoId === 'coin-change' && (
              <div className="mb-2">
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Amount
                </label>
                <input
                  type="text"
                  placeholder="e.g. 11"
                  value={dpNumber}
                  onChange={(e) => setDpNumber(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                  Coins (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 3, 4"
                  value={dpCoins}
                  onChange={(e) => setDpCoins(e.target.value)}
                  className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            <button
              onClick={handleRun}
              className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" />
              Run
            </button>
          </div>
        ) : vizType === 'string' ? (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              String Search Input
            </label>
            <div className="mb-2">
              <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                Text
              </label>
              <input
                type="text"
                placeholder="e.g. ABABDABACDABABCABAB"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                Pattern
              </label>
              <input
                type="text"
                placeholder="e.g. ABABCABAB"
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                className="mb-2 h-7 w-full rounded-md border border-border bg-background px-2 text-xs font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              onClick={handleRun}
              className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" />
              Run
            </button>
          </div>
        ) : vizType === 'backtracking' ? (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Backtracking Input
            </label>

            {/* N-Queens size slider */}
            {selectedAlgoId === 'n-queens' && (
              <div className="mb-2">
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[10px] font-medium text-foreground-subtle">
                    Board Size (N)
                  </label>
                  <span className="text-[10px] font-mono font-medium text-foreground-muted">
                    {nQueensSize}
                  </span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={12}
                  value={nQueensSize}
                  onChange={(e) => setNQueensSize(parseInt(e.target.value, 10))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
                />
                <div className="flex justify-between text-[9px] text-foreground-subtle">
                  <span>4</span>
                  <span>12</span>
                </div>
              </div>
            )}

            {/* Sudoku: show puzzle info */}
            {selectedAlgoId === 'sudoku' && (
              <div className="mb-2 rounded-md border border-border bg-background p-2">
                <p className="text-xs font-medium text-foreground">
                  Sample 9x9 Puzzle
                </p>
                <p className="mt-0.5 text-[10px] text-foreground-subtle">
                  ~30 given numbers, classic difficulty
                </p>
              </div>
            )}

            <button
              onClick={handleRun}
              className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Zap className="h-3 w-3" />
              Run
            </button>
          </div>
        ) : (
          <div className="mb-3">
            <label className="mb-1 block text-xs font-medium text-foreground-muted">
              Array Data
            </label>
            {/* Textarea for arbitrary-length comma-separated input */}
            <textarea
              maxLength={500}
              placeholder="e.g. 5, 3, 8, 1, 9, 2, 7, 4, 6, 10"
              value={arrayInput}
              onChange={(e) => setArrayInput(e.target.value)}
              rows={2}
              className="mb-2 w-full resize-y rounded-md border border-border bg-background px-2 py-1.5 text-sm font-mono text-foreground outline-none placeholder:text-foreground-subtle focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="text-[9px] text-foreground-subtle">{arrayInput.length}/500</span>

            {/* Size slider */}
            <div className="mb-2">
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[10px] font-medium text-foreground-subtle">
                  Random Size
                </label>
                <span className="text-[10px] font-mono font-medium text-foreground-muted">
                  {arraySize}
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={arraySize}
                onChange={(e) => setArraySize(parseInt(e.target.value, 10))}
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
              />
              <div className="flex justify-between text-[9px] text-foreground-subtle">
                <span>5</span>
                <span>100</span>
              </div>
            </div>

            {/* Presets */}
            <div className="mb-2">
              <label className="mb-1 block text-[10px] font-medium text-foreground-subtle">
                Presets
              </label>
              <div className="flex flex-wrap gap-1">
                {([
                  ['random', 'Random'],
                  ['nearly-sorted', 'Nearly Sorted'],
                  ['reverse', 'Reverse'],
                  ['few-unique', 'Few Unique'],
                  ['all-same', 'All Same'],
                  ['single-element', 'Single Element'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSortPreset(key);
                      // Auto-generate with this preset immediately
                      const arr = generatePresetArray(key, arraySize);
                      setArrayInput(arr.join(', '));
                      setCurrentArray(arr);
                      setResult(null);
                      setComparisonResult(null);
                      controllerRef.current?.destroy();
                      controllerRef.current = null;
                      comparisonControllerRef.current?.destroy();
                      comparisonControllerRef.current = null;
                      setPlaying(false);
                      setStepIndex(0);
                      setCurrentStep(null);
                      setComparisonStepIndex(0);
                      setComparisonStep(null);
                      setWorstCaseNote('');
                      setWorstCaseScore(null);
                      onReset?.();
                      const states: ElementState[] = arr.map(() => 'default');
                      onArrayChange?.(arr, states);
                    }}
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                      sortPreset === key
                        ? 'bg-primary text-white'
                        : 'bg-elevated text-foreground-muted hover:text-foreground',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Worst Case Challenge (ALG-173) */}
            {WORST_CASE_ALGORITHMS.has(selectedAlgoId) && (
              <div className="mb-2">
                <button
                  onClick={handleTryWorstCase}
                  className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/5 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Zap className="h-3 w-3" />
                  Try Worst Case
                </button>
                {worstCaseNote && (
                  <p className="mt-1 text-[10px] text-foreground-muted italic leading-snug">
                    {worstCaseNote}
                  </p>
                )}
                {worstCaseScore && worstCaseScore.theoretical > 0 && (
                  <div className="mt-1.5 rounded-md border border-red-500/20 bg-red-500/5 p-1.5">
                    <p className="text-[10px] font-mono text-foreground-subtle">
                      Actual: {worstCaseScore.actual} comparisons
                    </p>
                    <p className="text-[10px] font-mono text-foreground-subtle">
                      Theoretical worst: {worstCaseScore.theoretical}
                    </p>
                    <p className="text-[10px] font-semibold text-red-500">
                      Score: {Math.round((worstCaseScore.actual / worstCaseScore.theoretical) * 100)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background text-xs font-medium text-foreground transition-colors hover:bg-elevated"
              >
                <Shuffle className="h-3 w-3" />
                Generate
              </button>
              <button
                onClick={handleRun}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-xs font-medium text-white transition-colors hover:bg-primary/90"
              >
                <Zap className="h-3 w-3" />
                Run
              </button>
            </div>
          </div>
        )}

        {/* Playback controls */}
        {result && (
          <>
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-foreground-muted">
                Playback
              </label>

              {/* Transport */}
              <TooltipProvider>
              <div className="mb-2 flex flex-wrap items-center justify-center gap-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleStop}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.15)]"
                      aria-label="Stop and reset"
                    >
                      <Square className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Stop & Reset</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleStepBackward}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.15)]"
                      aria-label="Previous step"
                    >
                      <SkipBack className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Step Back</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handlePlayPause}
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_20px_rgba(110,86,207,0.4)] transition-all hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] hover:scale-105"
                      aria-label={playing ? 'Pause animation' : 'Play animation'}
                    >
                      {playing ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>{playing ? 'Pause' : 'Play'}</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleStepForward}
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm text-foreground-muted transition-all hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.15)]"
                      aria-label="Next step"
                    >
                      <SkipForward className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top"><p>Step Forward</p></TooltipContent>
                </Tooltip>
              </div>
              </TooltipProvider>

              {/* ALG-174/211: Predict Mode toggle */}
              <div className="mb-2 flex justify-center">
                <button
                  onClick={() => {
                    setPredictMode(prev => !prev);
                    if (predictMode) {
                      setShowPredictOptions(false);
                    } else {
                      setPredictScore({ correct: 0, total: 0 });
                    }
                  }}
                  className={cn(
                    'flex h-8 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition-colors',
                    predictMode
                      ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                      : 'bg-elevated text-foreground-muted hover:text-foreground',
                  )}
                >
                  {predictMode ? `Predict ON (${predictScore.correct}/${predictScore.total})` : 'Predict'}
                </button>
              </div>

              {/* ALG-174/211: Prediction options */}
              {showPredictOptions && (
                <div className="mb-2 space-y-1 rounded-md border border-amber-500/20 bg-amber-500/5 p-2">
                  <p className="text-[10px] font-medium text-amber-500">What happens next?</p>
                  {predictOptions.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handlePredictAnswer(opt)}
                      className={cn(
                        'w-full rounded px-2 py-1 text-left text-[10px]',
                        'border border-border bg-background hover:bg-elevated transition-colors',
                      )}
                    >
                      {opt.length > 80 ? opt.slice(0, 80) + '...' : opt}
                    </button>
                  ))}
                </div>
              )}

              {/* Step counter */}
              <div className="mb-2 text-center text-xs text-foreground-muted">
                Step{' '}
                <span className="font-mono font-medium text-foreground">
                  {stepIndex + 1}
                </span>{' '}
                of{' '}
                <span className="font-mono font-medium text-foreground">
                  {totalSteps}
                </span>
                {comparisonMode && comparisonResult && (
                  <span className="ml-2 text-foreground-subtle">
                    | B: {comparisonStepIndex + 1}/{compTotalSteps}
                  </span>
                )}
              </div>

              {/* Speed selector */}
              <TooltipProvider>
              <div className="flex flex-wrap items-center gap-1.5">
                <Clock className="h-3 w-3 text-foreground-subtle" />
                <span className="text-[10px] text-foreground-muted">Speed</span>
                <div className="flex flex-1 flex-wrap gap-1">
                  {SPEED_OPTIONS.map((s) => (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleSpeedChange(s)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
                            speed === s
                              ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(110,86,207,0.2)]'
                              : 'bg-elevated/50 text-foreground-muted hover:text-foreground hover:bg-elevated',
                          )}
                        >
                          {s}x
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>{s}x speed</p></TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
              </TooltipProvider>
            </div>

            {/* Current step description */}
            {currentStep && (
              <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-foreground-subtle" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                    Current Step
                  </span>
                </div>
                <p className="text-xs font-mono text-foreground">
                  {currentStep.description}
                </p>
                <p className="mt-1 text-[10px] text-foreground-subtle">
                  Line {currentStep.pseudocodeLine + 1} of pseudocode
                </p>
              </div>
            )}

            {/* Complexity analysis */}
            <div className="mb-3">
              <label className="mb-1.5 block text-xs font-medium text-foreground-muted">
                Complexity Analysis
              </label>

              {/* Big-O */}
              <div className="mb-2 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5">
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="h-3 w-3 text-foreground-subtle" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                    Time Complexity
                  </span>
                </div>
                <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <span className="block text-[10px] text-foreground-subtle">Best</span>
                    <span className="block text-xs font-mono font-medium text-difficulty-easy">
                      {result.config.timeComplexity.best}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-foreground-subtle">Avg</span>
                    <span className="block text-xs font-mono font-medium text-difficulty-medium">
                      {result.config.timeComplexity.average}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-foreground-subtle">Worst</span>
                    <span className="block text-xs font-mono font-medium text-difficulty-expert">
                      {result.config.timeComplexity.worst}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 text-center">
                  <span className="text-[10px] text-foreground-subtle">Space</span>
                  <span className="ml-1 text-xs font-mono font-medium text-state-active">
                    {result.config.spaceComplexity}
                  </span>
                </div>
              </div>

              {/* Running counters */}
              {currentStep && (
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-center transition-all">
                    <ArrowLeftRight className="mx-auto mb-0.5 h-3 w-3 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Comparisons
                    </span>
                    <span className="block text-sm font-mono font-medium text-foreground">
                      {currentStep.complexity.comparisons}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-center transition-all">
                    <Shuffle className="mx-auto mb-0.5 h-3 w-3 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Swaps
                    </span>
                    <span className="block text-sm font-mono font-medium text-foreground">
                      {currentStep.complexity.swaps}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-center transition-all">
                    <Eye className="mx-auto mb-0.5 h-3 w-3 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Reads
                    </span>
                    <span className="block text-sm font-mono font-medium text-foreground">
                      {currentStep.complexity.reads}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2 py-1.5 text-center transition-all">
                    <Zap className="mx-auto mb-0.5 h-3 w-3 text-foreground-subtle" />
                    <span className="block text-[10px] text-foreground-subtle">
                      Writes
                    </span>
                    <span className="block text-sm font-mono font-medium text-foreground">
                      {currentStep.complexity.writes}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-2 text-xs text-foreground-subtle">
        Select an algorithm, set data, and press Run
      </div>
    </div>
  );
});
