// -----------------------------------------------------------------
// Architex -- Algorithm Learning Path Presets
// -----------------------------------------------------------------

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  weeks: number;
  algorithmIds: string[];
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: 'university',
    name: 'University CS (12 weeks)',
    description: 'MIT 6.006 equivalent — covers fundamentals through DP',
    weeks: 12,
    algorithmIds: [
      'bubble-sort', 'insertion-sort', 'selection-sort', 'binary-search',
      'merge-sort', 'quick-sort', 'heap-sort',
      'bfs', 'dfs', 'dijkstra', 'bellman-ford', 'kruskal',
      'bst-operations', 'avl-tree',
      'fibonacci-dp', 'lcs', 'edit-distance', 'knapsack', 'coin-change',
    ],
  },
  {
    id: 'interview',
    name: 'FAANG Interview (4 weeks)',
    description: 'NeetCode 150 aligned — patterns that actually get asked',
    weeks: 4,
    algorithmIds: [
      'binary-search', 'two-pointers', 'sliding-window',
      'bubble-sort', 'merge-sort', 'quick-sort',
      'bfs', 'dfs', 'dijkstra', 'topological-sort',
      'bst-operations',
      'fibonacci-dp', 'lcs', 'knapsack', 'coin-change',
      'kmp', 'n-queens', 'monotonic-stack',
    ],
  },
  {
    id: 'weekend',
    name: 'Weekend Crash Course (2 days)',
    description: 'Just the essentials in one weekend',
    weeks: 0,
    algorithmIds: [
      'bubble-sort', 'merge-sort', 'quick-sort',
      'bfs', 'dijkstra',
      'bst-operations',
      'fibonacci-dp', 'knapsack',
    ],
  },
  {
    id: 'competitive',
    name: 'Competitive Programming (8 weeks)',
    description: 'ICPC-level — from basics to advanced graph/tree/DP',
    weeks: 8,
    algorithmIds: [
      'merge-sort', 'quick-sort', 'binary-search',
      'bfs', 'dfs', 'dijkstra', 'bellman-ford', 'floyd-warshall',
      'kruskal', 'tarjan-scc', 'topological-sort',
      'union-find', 'segment-tree', 'fenwick-tree',
      'fibonacci-dp', 'lcs', 'knapsack', 'matrix-chain',
      'kmp', 'n-queens', 'convex-hull',
    ],
  },
  {
    id: 'ai-ml',
    name: 'AI/ML Engineer (2026)',
    description: 'Vector search, embeddings, probabilistic structures',
    weeks: 4,
    algorithmIds: [
      'binary-search', 'bfs', 'dijkstra',
      'bloom-filter', 'cosine-similarity',
      'skip-list', 'count-min-sketch', 'hnsw',
    ],
  },
  {
    id: 'senior',
    name: 'Senior Engineer Refresher (2 weeks)',
    description: 'Production algorithms every senior should know',
    weeks: 2,
    algorithmIds: [
      'merge-sort', 'quick-sort', 'binary-search',
      'bfs', 'dijkstra',
      'bst-operations', 'lru-cache',
      'bloom-filter', 'consistent-hashing', 'union-find',
    ],
  },
];
