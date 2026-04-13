import type {
  LLNode,
  HashTableState,
  BSTNode,
  BloomFilterState,
  SkipListState,
  HeapState,
  TrieState,
  DisjointSetState,
  LSMState,
  CHState,
  MerkleState,
  CountMinSketchState,
  HyperLogLogState,
  DequeState,
  CircularBufferState,
  WALState,
  RopeState,
  RTreeState,
  QuadtreeState,
  FibHeapState,
  AVLNode,
  RBNode,
  SegmentTreeState,
  BPlusTreeState,
  FenwickTreeState,
  SplayTreeState,
  GCounterState,
  PNCounterState,
  LWWRegisterState,
  ORSetState,
  VectorClockState,
  TreapState,
  BinomialHeapState,
  BTreeState,
  DLLState,
  PriorityQueueState,
  LRUCacheState,
  CuckooHashState,
  MonotonicState,
  DSStep,
} from "@/lib/data-structures";

export type ActiveDS =
  | "array"
  | "stack"
  | "queue"
  | "linked-list"
  | "hash-table"
  | "bst"
  | "bloom-filter"
  | "skip-list"
  | "heap"
  | "trie"
  | "union-find"
  | "lsm-tree"
  | "consistent-hash"
  | "merkle-tree"
  | "count-min-sketch"
  | "hyperloglog"
  | "deque"
  | "circular-buffer"
  | "wal"
  | "rope"
  | "r-tree"
  | "quadtree"
  | "fibonacci-heap"
  | "avl-tree"
  | "red-black-tree"
  | "segment-tree"
  | "bplus-tree"
  | "fenwick-tree"
  | "splay-tree"
  | "crdt"
  | "vector-clock"
  | "treap"
  | "binomial-heap"
  | "b-tree"
  | "doubly-linked-list"
  | "priority-queue"
  | "lru-cache"
  | "cuckoo-hash"
  | "monotonic-stack";

export interface DSModuleState {
  activeDS: ActiveDS;
  // Array / Stack / Queue data
  arrayData: number[];
  stackData: number[];
  queueData: number[];
  // Linked list
  llNodes: LLNode[];
  llHeadId: string | null;
  // Hash table
  hashTable: HashTableState;
  // BST
  bstRoot: BSTNode | null;
  // Bloom filter
  bloomFilter: BloomFilterState;
  // Skip list
  skipList: SkipListState;
  // Heap
  heap: HeapState;
  // Trie
  trie: TrieState;
  // Union-Find
  disjointSet: DisjointSetState;
  // LSM Tree
  lsmTree: LSMState;
  // Consistent Hash Ring
  chRing: CHState;
  // Merkle Tree
  merkleTree: MerkleState;
  // Count-Min Sketch
  countMinSketch: CountMinSketchState;
  // HyperLogLog
  hyperLogLog: HyperLogLogState;
  // Deque
  deque: DequeState;
  // Circular Buffer
  circularBuffer: CircularBufferState;
  // Write-Ahead Log
  wal: WALState;
  // Rope
  rope: RopeState;
  // R-Tree
  rTree: RTreeState;
  // Quadtree
  quadtree: QuadtreeState;
  // Fibonacci Heap
  fibHeap: FibHeapState;
  // AVL Tree
  avlRoot: AVLNode | null;
  // Red-Black Tree
  rbRoot: RBNode | null;
  // Segment Tree
  segmentTree: SegmentTreeState;
  // B+ Tree
  bplusTree: BPlusTreeState;
  // Fenwick Tree
  fenwickTree: FenwickTreeState;
  // Splay Tree
  splayTree: SplayTreeState;
  // CRDT
  crdtType: 'g-counter' | 'pn-counter' | 'lww-register' | 'or-set';
  crdtCounter: GCounterState;
  pnCounter: PNCounterState;
  lwwRegister: LWWRegisterState;
  orSet: ORSetState;
  // Vector Clock
  vectorClock: VectorClockState;
  // Treap
  treap: TreapState;
  // Binomial Heap
  binomialHeap: BinomialHeapState;
  // B-Tree
  bTree: BTreeState;
  // Doubly Linked List
  dll: DLLState;
  // Priority Queue
  pq: PriorityQueueState;
  // LRU Cache
  lruCache: LRUCacheState;
  // Cuckoo Hash
  cuckooHash: CuckooHashState | null;
  // Monotonic Stack
  monotonicStack: MonotonicState | null;
  // Step playback
  steps: DSStep[];
  currentStepIdx: number;
  // Operation log
  log: string[];
}

export type CRDTType = 'g-counter' | 'pn-counter' | 'lww-register' | 'or-set';

export const CRDT_TYPE_LABELS: Record<CRDTType, string> = {
  'g-counter': 'G-Counter',
  'pn-counter': 'PN-Counter',
  'lww-register': 'LWW-Register',
  'or-set': 'OR-Set',
};
