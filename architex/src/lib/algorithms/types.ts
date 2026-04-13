// ─────────────────────────────────────────────────────────────
// Architex — Algorithm Visualization Core Types
// ─────────────────────────────────────────────────────────────

/**
 * A single step in an algorithm animation, representing one atomic operation
 * (comparison, swap, merge, etc.) with visual mutations and running complexity counts.
 *
 * @example
 * const step: AnimationStep = {
 *   id: 0,
 *   description: 'Compare 5 and 3',
 *   pseudocodeLine: 5,
 *   mutations: [{ targetId: 'element-0', property: 'highlight', from: 'default', to: 'comparing', easing: 'ease-out' }],
 *   complexity: { comparisons: 1, swaps: 0, reads: 2, writes: 0 },
 *   duration: 400,
 * };
 */
export interface AnimationStep {
  id: number;
  description: string;
  pseudocodeLine: number;
  mutations: VisualMutation[];
  complexity: {
    comparisons: number;
    swaps: number;
    reads: number;
    writes: number;
  };
  duration: number;
  /** Optional milestone label — marks this step as a key moment. */
  milestone?: string;
  /**
   * Optional snapshot of the array at this point in the algorithm.
   * When present, handleStepChange uses this directly instead of
   * inferring array changes from position mutations. This is the
   * most reliable way to sync the visualization with the engine.
   */
  arraySnapshot?: number[];
}

/**
 * Describes a single visual change to an element during an animation step.
 * Each mutation targets one element and transitions one property from one value to another.
 *
 * @example
 * const mutation: VisualMutation = {
 *   targetId: 'element-3',
 *   property: 'highlight',
 *   from: 'default',
 *   to: 'swapping',
 *   easing: 'spring',
 * };
 */
export interface VisualMutation {
  targetId: string;
  property:
    | 'fill'
    | 'position'
    | 'opacity'
    | 'label'
    | 'highlight'
    | 'scale';
  from: string | number;
  to: string | number;
  easing: 'spring' | 'ease-out' | 'linear';
}

export type ElementState =
  | 'default'
  | 'comparing'
  | 'swapping'
  | 'sorted'
  | 'pivot'
  | 'active'
  | 'found';

// ── ALG-253: Shared base element state ─────────────────────

/**
 * Universal element states shared across all visualizer categories.
 *
 * Each category extends BaseElementState with domain-specific states:
 *
 *   Sorting:  'comparing' | 'swapping' | 'sorted' | 'pivot'
 *   Graph:    'visiting'  | 'queued'   | 'visited'
 *   Tree:     'current'   | 'path'     | 'found'
 *   DP:       'filling'   | 'optimal'  | 'backtrack'
 *
 * Semantic equivalences across categories:
 *   'comparing' (sorting) ~ 'visiting' (graph) ~ 'current' (tree) ~ 'filling' (dp)
 *   'sorted'    (sorting) ~ 'visited'  (graph) ~ 'found'   (tree) ~ 'optimal' (dp)
 *
 * This type captures the 3 states that every visualizer needs regardless of
 * category. Refactoring existing category types to extend this is tracked
 * separately — this documents the intended semantic mapping.
 */
export type BaseElementState = 'default' | 'active' | 'highlight';

// ── Literal union types for algorithm IDs ────────────────────

export type SortingAlgoId =
  | 'bubble-sort' | 'insertion-sort' | 'selection-sort'
  | 'merge-sort' | 'merge-sort-bottom-up' | 'quick-sort' | 'heap-sort'
  | 'shell-sort' | 'counting-sort' | 'radix-sort'
  | 'bucket-sort' | 'tim-sort' | 'cocktail-shaker-sort'
  | 'comb-sort' | 'pancake-sort' | 'bogo-sort' | 'radix-sort-msd'
  | 'quick-sort-hoare';

export type GraphAlgoId =
  | 'bfs' | 'dfs' | 'dfs-iterative' | 'dijkstra' | 'kruskal'
  | 'topological-sort' | 'topological-sort-kahn'
  | 'bellman-ford' | 'a-star' | 'tarjan-scc' | 'prims'
  | 'floyd-warshall' | 'bipartite' | 'cycle-detection'
  | 'euler-path' | 'ford-fulkerson' | 'articulation-points' | 'bridges';

export type TreeAlgoId =
  | 'bst-operations' | 'avl-tree' | 'red-black-tree' | 'b-tree'
  | 'huffman-tree' | 'tree-traversals' | 'heap-operations'
  | 'trie-operations' | 'union-find' | 'segment-tree' | 'fenwick-tree';

export type DPAlgoId =
  | 'fibonacci-dp' | 'lcs' | 'edit-distance' | 'knapsack'
  | 'coin-change' | 'lis' | 'matrix-chain' | 'rod-cutting'
  | 'subset-sum' | 'longest-palindrome' | 'catalan';

export type StringAlgoId =
  | 'kmp' | 'rabin-karp' | 'boyer-moore' | 'z-algorithm';

export type BacktrackingAlgoId =
  | 'n-queens' | 'sudoku' | 'knights-tour' | 'subset-generation';

export type GeometryAlgoId =
  | 'convex-hull' | 'closest-pair' | 'line-intersection' | 'hnsw';

export type SearchAlgoId = 'binary-search';

export type GreedyAlgoId = 'activity-selection' | 'fractional-knapsack';

export type PatternAlgoId =
  | 'monotonic-stack' | 'floyd-cycle' | 'two-pointers' | 'sliding-window'
  | 'interval-merge';

export type ProbabilisticAlgoId = 'bloom-filter' | 'skip-list' | 'count-min-sketch';

export type VectorSearchAlgoId = 'cosine-similarity' | 'hnsw';

export type DesignAlgoId = 'lru-cache';

export type AlgoId =
  | SortingAlgoId | GraphAlgoId | TreeAlgoId | DPAlgoId
  | StringAlgoId | BacktrackingAlgoId | GeometryAlgoId
  | SearchAlgoId | GreedyAlgoId | PatternAlgoId
  | ProbabilisticAlgoId | VectorSearchAlgoId | DesignAlgoId;

/**
 * Full configuration for an algorithm, including metadata, complexity info,
 * educational content, and visualization pseudocode.
 *
 * @example
 * const config: AlgorithmConfig = {
 *   id: 'bubble-sort',
 *   name: 'Bubble Sort',
 *   category: 'sorting',
 *   timeComplexity: { best: 'O(n)', average: 'O(n^2)', worst: 'O(n^2)' },
 *   spaceComplexity: 'O(1)',
 *   description: 'Compares adjacent elements and swaps if out of order.',
 *   pseudocode: ['for i = 0 to n-1', '  ...'],
 * };
 */
export interface AlgorithmConfig {
  // TODO: change to AlgoId once all consumers are updated
  id: string;
  name: string;
  category:
    | 'sorting'
    | 'graph'
    | 'tree'
    | 'dp'
    | 'string'
    | 'backtracking'
    | 'geometry';
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  stable?: boolean;
  inPlace?: boolean;
  description: string;
  pseudocode: string[];
  /** Plain-English explanation of what the Big-O means. */
  complexityIntuition?: string;
  /** Difficulty level for learning path ordering. */
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Specific real-world systems that use this algorithm. */
  realWorldApps?: string[];
  /** Interview tips: what companies ask, common follow-ups, edge cases. */
  interviewTips?: string;
  /** When to use this vs alternatives. */
  whenToUse?: string;
  /** Comparison with alternatives — when to use this vs others. */
  comparisonGuide?: string;
  /** How the production version differs from our teaching version. */
  productionNote?: string;
  /** 3-bullet flashcard summary. */
  summary?: string[];
  /** Common student mistakes/misconceptions. */
  commonMistakes?: string[];
  /** Algorithm IDs that should be learned before this one. */
  prerequisites?: string[];
}

export interface AlgorithmResult {
  config: AlgorithmConfig;
  steps: AnimationStep[];
  finalState: number[];
  /**
   * Runtime category tag for discriminated consumption (ALG-250).
   *
   * Mirrors `config.category` — consumers can check `result.category === 'sorting'`
   * for lightweight type narrowing without reaching into `result.config`.
   *
   * Optional so existing engines continue to compile without changes;
   * the category is always available via `result.config.category`.
   */
  category?: AlgorithmConfig['category'];
}
