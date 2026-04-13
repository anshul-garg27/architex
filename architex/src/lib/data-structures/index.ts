// -----------------------------------------------------------------
// Architex -- Data Structures Module Barrel Export
// -----------------------------------------------------------------

export type {
  DSOperation,
  DSMutation,
  DSStep,
  DSCategory,
  DSConfig,
  DSResult,
  DSHighlightState,
} from './types';

// ActiveDSId & DS_ID_LIST are exported from the bottom of this file (DST-182)

export {
  arrayInsert,
  arrayDelete,
  arraySearch,
  stackPush,
  stackPop,
  stackPeek,
  queueEnqueue,
  queueDequeue,
} from './array-ds';

export type { LLNode } from './linked-list';
export {
  llInsertHead,
  llInsertTail,
  llInsertAt,
  llDelete,
  llSearch,
} from './linked-list';

export type { HTEntry, HTBucket, HashTableState } from './hash-table';
export {
  hashInsert,
  hashSearch,
  hashDelete,
  createHashTable,
  simpleHash,
} from './hash-table';

export type { BSTNode } from './bst-ds';
export {
  dsBstInsert,
  dsBstSearch,
  dsBstDelete,
  buildBST,
  cloneBST,
  bstToArray,
  bstSize,
} from './bst-ds';

export {
  bstInorder,
  bstPreorder,
  bstPostorder,
  bstLevelOrder,
  bstFindMin,
  bstFindMax,
  bstValidate,
} from './bst-interactive';

export type {
  BPlusLeafNode,
  BPlusInternalNode,
  BPlusNode,
  BPlusTreeState,
} from './bplus-tree-ds';
export {
  createBPlusTree,
  cloneBPlusTree,
  bplusInsert,
  bplusSearch,
  bplusRangeQuery,
  bplusDelete,
  bplusLeafKeys,
} from './bplus-tree-ds';

export type { BloomFilterState } from './bloom-filter';
export {
  bloomInsert,
  bloomCheck,
  createBloomFilter,
  falsePositiveRate,
} from './bloom-filter';

export type { SkipListNode, SkipListState } from './skip-list';
export {
  skipListInsert,
  skipListSearch,
  skipListDelete,
  createSkipList,
  cloneSkipList,
  skipListToArray,
} from './skip-list';

export type { HeapType, HeapState } from './heap-ds';
export {
  heapInsert,
  heapExtract,
  heapBuild,
  heapSearch,
  createHeap,
  cloneHeap,
} from './heap-ds';

export type { TrieNode, TrieState, TrieFlatNode } from './trie-ds';
export {
  trieInsert,
  trieSearch,
  trieStartsWith,
  trieDelete,
  trieAutoComplete,
  createTrie,
  cloneTrie,
  flattenTrie,
} from './trie-ds';

export type { SegmentTreeState } from './segment-tree-ds';
export {
  createSegmentTree,
  segmentTreeQuery,
  segmentTreeUpdate,
  segmentTreeRangeUpdate,
} from './segment-tree-ds';

export type { DSUElement, DisjointSetState } from './disjoint-set';
export {
  dsuMakeSet,
  dsuFind,
  dsuUnion,
  dsuUnionBatch,
  createDisjointSet,
  cloneDisjointSet,
  dsuGetSets,
} from './disjoint-set';

export type { LSMEntry, LSMState } from './lsm-tree';
export {
  createLSM,
  lsmInsert,
  lsmSearch,
  lsmFlush,
  lsmCompact,
} from './lsm-tree';

export type { CHNode, CHKey, CHState } from './consistent-hash-ring';
export {
  createCHRing,
  chAddNode,
  chRemoveNode,
  chLookup,
  chAddKeys,
} from './consistent-hash-ring';

export type { MerkleNode, MerkleLeafNode, MerkleInternalNode, MerkleState } from './merkle-tree';
export {
  createMerkleTree,
  merkleTreeBuild,
  merkleTreeVerify,
} from './merkle-tree';

export type { CountMinSketchState } from './count-min-sketch';
export {
  createCountMinSketch,
  cmsInsert,
  cmsQuery,
  cmsErrorBound,
} from './count-min-sketch';

export type { HyperLogLogState } from './hyperloglog';
export {
  createHyperLogLog,
  hllAdd,
  hllCount,
  hllEstimate,
} from './hyperloglog';

export type { DequeState } from './deque';
export {
  createDeque,
  dequePushFront,
  dequePushBack,
  dequePopFront,
  dequePopBack,
  dequePeekFront,
  dequePeekBack,
} from './deque';

export type { CircularBufferState } from './circular-buffer';
export {
  createCircularBuffer,
  cloneCircularBuffer,
  cbEnqueue,
  cbDequeue,
  cbPeek,
  cbIsFull,
} from './circular-buffer';

export type { WALEntry, WALState } from './wal';
export {
  createWAL,
  cloneWAL,
  walAppend,
  walRead,
  walTruncate,
  walCheckpoint,
  walCrash,
  walRecover,
} from './wal';

export type { RopeNode, RopeState, RopeFlatNode } from './rope';
export {
  createRope,
  cloneRope,
  flattenRope,
  ropeCharAt,
  ropeConcat,
  ropeSplit,
  ropeInsertAt,
  ropeToString,
} from './rope';

export type { RTreeEntry, RTreeNode, RTreeState, RTreeFlatNode, BoundingBox } from './r-tree';
export {
  createRTree,
  cloneRTree,
  flattenRTree,
  rtreeInsert,
  rtreeSearch,
} from './r-tree';

export type { QTPoint, QTBounds, QTNode, QuadtreeState, QTFlatNode } from './quadtree';
export {
  createQuadtree,
  cloneQuadtree,
  flattenQuadtree,
  qtInsert,
  qtSearch,
} from './quadtree';

export type { FibNode, FibHeapState, FibFlatNode } from './fibonacci-heap';
export {
  createFibHeap,
  cloneFibHeap,
  flattenFibHeap,
  fibInsert,
  fibExtractMin,
  fibDecreaseKey,
  fibSearch,
} from './fibonacci-heap';

export type { AVLNode } from './avl-ds';
export {
  dsAvlInsert,
  dsAvlSearch,
  dsAvlDelete,
  buildAVL,
  cloneAVL,
  avlToArray,
  avlSize,
} from './avl-ds';

export type { RBNode, RBColor } from './red-black-ds';
export {
  dsRbInsert,
  dsRbSearch,
  dsRbDelete,
  buildRBTree,
  cloneRB,
  rbToArray,
  rbSize,
} from './red-black-ds';

export type {
  PositionedNode,
  LayoutEdge,
  TreeLayoutConfig,
  TreeLayoutResult,
  GenericTreeNode,
} from './tree-layout';
export {
  layoutAVLTree,
  layoutRBTree,
  layoutTree,
  TREE_LAYOUT_DEFAULTS,
} from './tree-layout';

export type { FenwickTreeState } from './fenwick-tree-ds';
export {
  createFenwickTree,
  fenwickUpdate,
  fenwickPrefixSum,
  fenwickRangeSum,
} from './fenwick-tree-ds';

export type { SplayNode, SplayTreeState } from './splay-tree-ds';
export {
  createSplayTree,
  cloneSplayTree,
  splayToArray,
  splaySize,
  splayInsert,
  splaySearch,
  splayDelete,
} from './splay-tree-ds';

export type {
  GCounterState,
  PNCounterState,
  LWWRegisterState,
  ORSetEntry,
  ORSetState,
} from './crdt-ds';
export {
  gCounterCreate,
  gCounterIncrement,
  gCounterMerge,
  gCounterValue,
  pnCounterCreate,
  pnCounterIncrement,
  pnCounterDecrement,
  pnCounterMerge,
  pnCounterValue,
  lwwRegisterCreate,
  lwwRegisterSet,
  lwwRegisterMerge,
  lwwRegisterGet,
  orSetCreate,
  orSetAdd,
  orSetRemove,
  orSetMerge,
  orSetElements,
} from './crdt-ds';

export type {
  VectorClock,
  VCMessage,
  VCEvent,
  VectorClockState,
} from './vector-clock-ds';
export {
  createVectorClockSystem,
  vectorClockLocalEvent,
  vectorClockSend,
  vectorClockReceive,
  vectorClockHappensBefore,
  vectorClockConcurrent,
} from './vector-clock-ds';

export type { TreapNode, TreapState } from './treap-ds';
export {
  createTreap,
  cloneTreap,
  treapToArray,
  treapSize,
  treapInsert,
  treapSearch,
  treapDelete,
  treapSplit,
  treapMerge,
} from './treap-ds';

export type { BinomialNode, BinomialHeapState, BinomialFlatNode } from './binomial-heap-ds';
export {
  createBinomialHeap,
  cloneBinomialHeap,
  flattenBinomialHeap,
  binomialInsert,
  binomialFindMin,
  binomialExtractMin,
  binomialMerge,
  binomialDecreaseKey,
  binomialSearch,
} from './binomial-heap-ds';

export type { BTreeNode, BTreeState } from './btree-ds';
export {
  createBTree,
  cloneBTree,
  btreeToArray,
  btreeInsert,
  btreeSearch,
  btreeDelete,
} from './btree-ds';

export type { DLLNode, DLLState } from './doubly-linked-list';
export {
  createDLL,
  cloneDLL,
  dllInsertHead,
  dllInsertTail,
  dllInsertAt,
  dllDelete,
  dllSearch,
  dllReverse,
} from './doubly-linked-list';

export type { PQEntry, PriorityQueueState } from './priority-queue';
export {
  createPQ,
  clonePQ,
  pqEnqueue,
  pqDequeue,
  pqPeek,
  pqChangePriority,
  pqSearch,
} from './priority-queue';

export type { LRUNode, LRUCacheState } from './lru-cache';
export {
  createLRUCache,
  cloneLRUCache,
  lruGet,
  lruPut,
  lruDelete,
  lruPeek,
} from './lru-cache';

export type { CuckooHashState } from './cuckoo-hash';
export {
  createCuckooHash,
  cuckooInsert,
  cuckooSearch,
  cuckooDelete,
} from './cuckoo-hash';

export type { MonotonicState } from './monotonic-stack';
export {
  createMonotonic,
  monotonicPush,
  monotonicPop,
  monotonicPeek,
} from './monotonic-stack';

// ── DS Catalog (re-exported from catalog.ts for backward compat) ──
// Importing from catalog.ts directly avoids pulling in all 41
// implementation files. Components that only need metadata should
// import from '@/lib/data-structures/catalog' instead.
export { DS_CATALOG, DS_ID_LIST, type ActiveDSId } from './catalog';
