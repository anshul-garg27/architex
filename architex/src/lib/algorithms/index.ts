// ─────────────────────────────────────────────────────────────
// Architex — Algorithms Module Barrel Export
// ─────────────────────────────────────────────────────────────

export type {
  AnimationStep,
  VisualMutation,
  ElementState,
  AlgorithmConfig,
  AlgorithmResult,
} from './types';

export {
  bubbleSort,
  mergeSort,
  mergeSortBottomUp,
  quickSort,
  heapSort,
  insertionSort,
  selectionSort,
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
  quickSortHoare,
  SORTING_ALGORITHMS,
} from './sorting';

export type {
  GraphNode,
  GraphEdge,
  Graph,
  GraphElementState,
} from './graph';

export {
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
  GRAPH_ALGORITHMS,
  SAMPLE_GRAPH_FOR_ALGORITHM,
  SIMPLE_UNDIRECTED,
  WEIGHTED_DIRECTED,
  DAG,
  CONNECTED_COMPONENTS,
  A_STAR_GRID,
  SCC_DIRECTED,
  BIPARTITE_GRAPH,
  CYCLE_DIRECTED,
  EULER_GRAPH,
  FLOW_NETWORK,
  ARTICULATION_BRIDGE_GRAPH,
} from './graph';

export type {
  TreeNode,
  TreeElementState,
} from './tree';

export type {
  BTreeNode,
} from './tree';

export type {
  HuffmanNode,
  HuffmanEncodingEntry,
  HuffmanResult,
} from './tree';

export type {
  TrieAlgoNode,
} from './tree';

export {
  bstInsert,
  bstSearch,
  bstDelete,
  BST_CONFIG,
  avlInsert,
  AVL_CONFIG,
  rbInsert,
  RED_BLACK_CONFIG,
  bTreeInsert,
  B_TREE_CONFIG,
  huffmanBuild,
  buildFrequencyTable,
  HUFFMAN_CONFIG,
  inorderTraversal,
  preorderTraversal,
  postorderTraversal,
  levelOrderTraversal,
  TRAVERSAL_CONFIG,
  heapInsert,
  heapExtractMax,
  heapify,
  arrayToTree,
  HEAP_CONFIG,
  BALANCED_BST,
  UNBALANCED_BST,
  HEAP_DEMO_ARRAY,
  SAMPLE_TREE_FOR_ALGORITHM,
  layoutTree,
  collectNodes,
  trieInsertAlgo,
  trieSearchAlgo,
  TRIE_CONFIG,
  createTrieRoot,
  unionFind,
  UNION_FIND_CONFIG,
  DEFAULT_UNION_OPS,
  DEFAULT_ELEMENT_COUNT,
  segmentTree,
  SEGMENT_TREE_CONFIG,
  DEFAULT_SEGMENT_INPUT,
  DEFAULT_SEGMENT_OPS,
  fenwickTree,
  FENWICK_TREE_CONFIG,
  DEFAULT_FENWICK_INPUT,
  DEFAULT_FENWICK_OPS,
  TREE_ALGORITHMS,
} from './tree';

export type {
  DPCell,
  DPTable,
  DPAlgorithmResult,
  FibonacciResult,
  LCSResult,
  EditDistanceResult,
  EditOp,
  KnapsackItem,
  KnapsackResult,
  CoinChangeResult,
  LISResult,
  MatrixChainResult,
  RodCuttingResult,
  SubsetSumResult,
  LongestPalindromeResult,
  CatalanResult,
} from './dp';

export {
  fibonacciDP,
  FIBONACCI_CONFIG,
  lcs,
  LCS_CONFIG,
  editDistance,
  EDIT_DISTANCE_CONFIG,
  knapsack,
  KNAPSACK_CONFIG,
  DEFAULT_KNAPSACK_ITEMS,
  coinChange,
  COIN_CHANGE_CONFIG,
  lis,
  LIS_CONFIG,
  matrixChain,
  MATRIX_CHAIN_CONFIG,
  rodCutting,
  ROD_CUTTING_CONFIG,
  subsetSum,
  SUBSET_SUM_CONFIG,
  DEFAULT_SUBSET_SUM_NUMS,
  DEFAULT_SUBSET_SUM_TARGET,
  longestPalindrome,
  LONGEST_PALINDROME_CONFIG,
  DEFAULT_LPS_STRING,
  catalan,
  CATALAN_CONFIG,
  DEFAULT_CATALAN_N,
  DP_ALGORITHMS,
} from './dp';

export type {
  KMPResult,
  RabinKarpResult,
  BoyerMooreResult,
  ZAlgorithmResult,
} from './string';

export {
  kmpSearch,
  KMP_CONFIG,
  rabinKarpSearch,
  RABIN_KARP_CONFIG,
  boyerMooreSearch,
  BOYER_MOORE_CONFIG,
  zAlgorithmSearch,
  Z_ALGORITHM_CONFIG,
  STRING_ALGORITHMS,
} from './string';

export type {
  QueenPlacement,
  KnightPosition,
  SubsetStep,
} from './backtracking';

export {
  solveNQueens,
  N_QUEENS_CONFIG,
  solveSudoku,
  SUDOKU_CONFIG,
  SAMPLE_SUDOKU,
  solveKnightsTour,
  KNIGHTS_TOUR_CONFIG,
  generateSubsets,
  SUBSET_GENERATION_CONFIG,
  DEFAULT_SUBSET_SET,
  BACKTRACKING_ALGORITHMS,
} from './backtracking';

export type {
  Point2D,
  GeometryElementState,
  Segment,
  IntersectionPoint,
} from './geometry';

export {
  convexHull,
  CONVEX_HULL_CONFIG,
  closestPair,
  CLOSEST_PAIR_CONFIG,
  lineIntersection,
  LINE_INTERSECTION_CONFIG,
  generateSampleSegments,
  SAMPLE_SEGMENTS,
  generateSamplePoints,
  SAMPLE_POINTS,
  GEOMETRY_ALGORITHMS,
} from './geometry';

export {
  binarySearch,
  BINARY_SEARCH_CONFIG,
  SEARCH_ALGORITHMS,
} from './search';

export type {
  Activity,
} from './greedy';

export {
  activitySelection,
  ACTIVITY_SELECTION_CONFIG,
  DEFAULT_ACTIVITIES,
  fractionalKnapsack,
  FRACTIONAL_KNAPSACK_CONFIG,
  DEFAULT_FRACTIONAL_ITEMS,
  DEFAULT_CAPACITY,
  GREEDY_ALGORITHMS,
} from './greedy';

export {
  monotonicStack,
  MONOTONIC_STACK_CONFIG,
  floydCycle,
  FLOYD_CYCLE_CONFIG,
  twoPointers,
  TWO_POINTERS_CONFIG,
  slidingWindow,
  SLIDING_WINDOW_CONFIG,
  intervalMerge,
  INTERVAL_MERGE_CONFIG,
  PATTERN_ALGORITHMS,
} from './patterns';

export type {
  LRUOperation,
} from './design';

export {
  lruCache,
  LRU_CACHE_CONFIG,
  LRU_CACHE_CAPACITY,
  LRU_CACHE_DEFAULT_OPS,
  DESIGN_ALGORITHMS,
} from './design';

export {
  bloomFilter,
  BLOOM_FILTER_CONFIG,
  skipList,
  SKIP_LIST_CONFIG,
  countMinSketch,
  COUNT_MIN_SKETCH_CONFIG,
  PROBABILISTIC_ALGORITHMS,
} from './probabilistic';

export {
  cosineSimilarity,
  COSINE_SIMILARITY_CONFIG,
  hnsw,
  HNSW_CONFIG,
  VECTOR_SEARCH_ALGORITHMS,
} from './vector-search';

export type { LearningPath } from './learning-paths';
export { LEARNING_PATHS } from './learning-paths';

export type { AlgoScore } from './practice/scoring';
export {
  getAlgoScores,
  recordRun,
  recordFlashcard,
  recordScenario,
  recordDebugSolved,
  getMasteryLevel,
} from './practice/scoring';

export { PlaybackController } from './playback-controller';
export type { StepCallback } from './playback-controller';

export type { ReviewCard } from './practice/spaced-repetition';
export {
  getCardsForReview,
  scheduleReview,
  addToReviewDeck,
} from './practice/spaced-repetition';
