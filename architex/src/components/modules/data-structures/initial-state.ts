import type { DSModuleState } from "./types";

// Minimal initial state — ONLY creates the default "array" data.
// All other data structures are initialized LAZILY when the user
// switches to them (see handleSelectDS in index.tsx).
//
// This avoids importing all 41 data structure files (604 KB) on mount,
// which was causing the browser to freeze for 5-15 seconds.

function buildMinimalState(): DSModuleState {
  return {
    activeDS: "array",
    arrayData: [10, 25, 3, 42, 18, 7, 31],
    stackData: [5, 12, 8],
    queueData: [1, 2, 3, 4],
    llNodes: [],
    llHeadId: null,
    hashTable: null,
    bstRoot: null,
    bloomFilter: null,
    skipList: null,
    heap: null,
    trie: null,
    disjointSet: null,
    lsmTree: null,
    chRing: null,
    merkleTree: null,
    countMinSketch: null,
    hyperLogLog: null,
    deque: null,
    circularBuffer: null,
    wal: null,
    rope: null,
    rTree: null,
    quadtree: null,
    fibHeap: null,
    avlRoot: null,
    rbRoot: null,
    segmentTree: null,
    bplusTree: null,
    fenwickTree: null,
    splayTree: null,
    crdtType: "g-counter" as const,
    crdtCounter: null,
    pnCounter: null,
    lwwRegister: null,
    orSet: null,
    vectorClock: null,
    treap: null,
    binomialHeap: null,
    bTree: null,
    dll: null,
    pq: null,
    lruCache: null,
    cuckooHash: null,
    monotonicStack: null,
    steps: [],
    currentStepIdx: -1,
    log: [],
    // Lazy initialization: downstream handlers populate each structure when
    // the user selects it. The declared type requires these fields to be
    // non-null, but bootstrapping all 40+ structures eagerly regressed mount
    // time by 5-15s, so we accept the structural mismatch here.
  } as unknown as DSModuleState;
}

let _cached: DSModuleState | null = null;

export function getInitialState(): DSModuleState {
  if (!_cached) {
    _cached = buildMinimalState();
  }
  return _cached;
}
