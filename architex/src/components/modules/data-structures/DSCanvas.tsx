"use client";

import React, { memo } from "react";
import { DSColorLegend, DS_LEGEND_STATES } from "./constants";
import type { DSModuleState } from "./types";
import { ArrayCanvas, LinkedListCanvas, DequeCanvas, CircularBufferCanvas, WALCanvas, RopeCanvas, DLLCanvas, PQCanvas, MonotonicStackCanvas } from "./visualizers/LinearCanvases";
import { HashTableCanvas, LRUCacheCanvas, CuckooHashCanvas } from "./visualizers/HashCanvases";
import { HeapCanvas, FibHeapCanvas, BinomialHeapCanvas } from "./visualizers/HeapCanvases";
import { UnionFindCanvas, SkipListCanvas } from "./visualizers/GraphCanvases";
import { BloomFilterCanvas, CountMinSketchCanvas, HyperLogLogCanvas } from "./visualizers/ProbabilisticCanvases";
import { LSMTreeCanvas, ConsistentHashRingCanvas, RTreeCanvas, QuadtreeCanvas } from "./visualizers/SystemCanvases";
import { CRDTCanvas, VectorClockCanvas } from "./visualizers/CRDTCanvases";
import { BSTCanvas, AVLCanvas, RBTreeCanvas, TrieCanvas, MerkleTreeCanvas, SegmentTreeCanvas, BPlusTreeCanvas, FenwickTreeCanvas, SplayTreeCanvas, TreapCanvas, BTreeCanvas } from "./visualizers/TreeCanvases";

// DST-082: Error boundary around canvas components
class CanvasErrorBoundary extends React.Component<
  { children: React.ReactNode; dsName: string; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; dsName: string; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <p className="text-sm text-red-400">
            {this.props.dsName} visualization encountered an error.
          </p>
          <p className="text-xs text-foreground-muted">{this.state.error?.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); this.props.onReset(); }}
            className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-1.5 text-xs hover:bg-accent"
          >
            Reset and try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Null guard — shown when a DS hasn't been initialized yet (lazy loading)
function DSNotInitialized({ name, onDemo }: { name: string; onDemo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <p className="text-sm text-foreground-muted">{name} is loading. Click <strong>Random</strong> or any operation to initialize.</p>
      <button
        onClick={onDemo}
        className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-1.5 text-xs text-foreground-muted hover:bg-accent hover:text-foreground transition-colors"
      >
        Initialize with example data
      </button>
    </div>
  );
}

const DSCanvas = memo(function DSCanvas({
  state,
  onCrdtTypeChange,
  onDemo,
}: {
  state: DSModuleState;
  onCrdtTypeChange: (type: 'g-counter' | 'pn-counter' | 'lww-register' | 'or-set') => void;
  onDemo: () => void;
}) {
  const { activeDS, steps, currentStepIdx } = state;

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-elevated/80 to-background">
      {/* Visualization area */}
      <div data-ds-canvas className="flex flex-1 items-center justify-center overflow-auto p-6">
        <CanvasErrorBoundary dsName={activeDS} onReset={onDemo}>
        {activeDS === "array" && (
          <ArrayCanvas
            data={state.arrayData}
            label="Array"
            prefix="arr"
            stepIdx={currentStepIdx}
            steps={steps}
          />
        )}
        {activeDS === "stack" && (
          <ArrayCanvas
            data={state.stackData}
            label="Stack"
            prefix="stack"
            stepIdx={currentStepIdx}
            steps={steps}
            vertical
            showPointers={{ top: true }}
          />
        )}
        {activeDS === "queue" && (
          <ArrayCanvas
            data={state.queueData}
            label="Queue"
            prefix="queue"
            stepIdx={currentStepIdx}
            steps={steps}
            showPointers={{ front: true, rear: true }}
          />
        )}
        {activeDS === "linked-list" && (
          <LinkedListCanvas
            nodes={state.llNodes}
            headId={state.llHeadId}
            stepIdx={currentStepIdx}
            steps={steps}
          />
        )}
        {activeDS === "hash-table" && (
          state.hashTable ? <HashTableCanvas table={state.hashTable} stepIdx={currentStepIdx} steps={steps} onDemo={onDemo} />
          : <DSNotInitialized name="Hash Table" onDemo={onDemo} />
        )}
        {activeDS === "bst" && (
          <BSTCanvas
            root={state.bstRoot}
            stepIdx={currentStepIdx}
            steps={steps}
            onDemo={onDemo}
          />
        )}
        {activeDS === "bloom-filter" && (
          state.bloomFilter ? <BloomFilterCanvas filter={state.bloomFilter} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Bloom Filter" onDemo={onDemo} />
        )}
        {activeDS === "skip-list" && (
          state.skipList ? <SkipListCanvas skipList={state.skipList} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Skip List" onDemo={onDemo} />
        )}
        {activeDS === "heap" && (
          state.heap ? <HeapCanvas heap={state.heap} stepIdx={currentStepIdx} steps={steps} onDemo={onDemo} />
          : <DSNotInitialized name="Heap" onDemo={onDemo} />
        )}
        {activeDS === "trie" && (
          state.trie ? <TrieCanvas trie={state.trie} stepIdx={currentStepIdx} steps={steps} onDemo={onDemo} />
          : <DSNotInitialized name="Trie" onDemo={onDemo} />
        )}
        {activeDS === "union-find" && (
          state.disjointSet ? <UnionFindCanvas dsu={state.disjointSet} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Union-Find" onDemo={onDemo} />
        )}
        {activeDS === "lsm-tree" && (
          state.lsmTree ? <LSMTreeCanvas lsm={state.lsmTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="LSM Tree" onDemo={onDemo} />
        )}
        {activeDS === "consistent-hash" && (
          state.chRing ? <ConsistentHashRingCanvas ring={state.chRing} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Consistent Hash Ring" onDemo={onDemo} />
        )}
        {activeDS === "merkle-tree" && (
          state.merkleTree ? <MerkleTreeCanvas merkle={state.merkleTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Merkle Tree" onDemo={onDemo} />
        )}
        {activeDS === "count-min-sketch" && (
          state.countMinSketch ? <CountMinSketchCanvas sketch={state.countMinSketch} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Count-Min Sketch" onDemo={onDemo} />
        )}
        {activeDS === "hyperloglog" && (
          state.hyperLogLog ? <HyperLogLogCanvas hll={state.hyperLogLog} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="HyperLogLog" onDemo={onDemo} />
        )}
        {activeDS === "deque" && (
          state.deque ? <DequeCanvas deque={state.deque} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Deque" onDemo={onDemo} />
        )}
        {activeDS === "circular-buffer" && (
          state.circularBuffer ? <CircularBufferCanvas buffer={state.circularBuffer} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Circular Buffer" onDemo={onDemo} />
        )}
        {activeDS === "wal" && (
          state.wal ? <WALCanvas wal={state.wal} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Write-Ahead Log" onDemo={onDemo} />
        )}
        {activeDS === "rope" && (
          state.rope ? <RopeCanvas rope={state.rope} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Rope" onDemo={onDemo} />
        )}
        {activeDS === "r-tree" && (
          state.rTree ? <RTreeCanvas rTree={state.rTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="R-Tree" onDemo={onDemo} />
        )}
        {activeDS === "quadtree" && (
          state.quadtree ? <QuadtreeCanvas quadtree={state.quadtree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Quadtree" onDemo={onDemo} />
        )}
        {activeDS === "fibonacci-heap" && (
          state.fibHeap ? <FibHeapCanvas fibHeap={state.fibHeap} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Fibonacci Heap" onDemo={onDemo} />
        )}
        {activeDS === "avl-tree" && (
          <AVLCanvas root={state.avlRoot} stepIdx={currentStepIdx} steps={steps} onDemo={onDemo} />
        )}
        {activeDS === "red-black-tree" && (
          <RBTreeCanvas root={state.rbRoot} stepIdx={currentStepIdx} steps={steps} onDemo={onDemo} />
        )}
        {activeDS === "segment-tree" && (
          state.segmentTree ? <SegmentTreeCanvas segTree={state.segmentTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Segment Tree" onDemo={onDemo} />
        )}
        {activeDS === "bplus-tree" && (
          state.bplusTree ? <BPlusTreeCanvas bplusTree={state.bplusTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="B+ Tree" onDemo={onDemo} />
        )}
        {activeDS === "fenwick-tree" && (
          state.fenwickTree ? <FenwickTreeCanvas fenwick={state.fenwickTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Fenwick Tree" onDemo={onDemo} />
        )}
        {activeDS === "splay-tree" && (
          state.splayTree ? <SplayTreeCanvas splayTree={state.splayTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Splay Tree" onDemo={onDemo} />
        )}
        {activeDS === "crdt" && (
          state.crdtCounter ? <CRDTCanvas crdtType={state.crdtType} counter={state.crdtCounter} pnCounter={state.pnCounter} lwwRegister={state.lwwRegister} orSet={state.orSet} stepIdx={currentStepIdx} steps={steps} onTypeChange={onCrdtTypeChange} />
          : <DSNotInitialized name="CRDTs" onDemo={onDemo} />
        )}
        {activeDS === "vector-clock" && (
          state.vectorClock ? <VectorClockCanvas vc={state.vectorClock} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Vector Clock" onDemo={onDemo} />
        )}
        {activeDS === "treap" && (
          state.treap ? <TreapCanvas treap={state.treap} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Treap" onDemo={onDemo} />
        )}
        {activeDS === "binomial-heap" && (
          state.binomialHeap ? <BinomialHeapCanvas binomialHeap={state.binomialHeap} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Binomial Heap" onDemo={onDemo} />
        )}
        {activeDS === "b-tree" && (
          state.bTree ? <BTreeCanvas bTree={state.bTree} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="B-Tree" onDemo={onDemo} />
        )}
        {activeDS === "doubly-linked-list" && (
          state.dll ? <DLLCanvas dll={state.dll} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Doubly Linked List" onDemo={onDemo} />
        )}
        {activeDS === "priority-queue" && (
          state.pq ? <PQCanvas pq={state.pq} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Priority Queue" onDemo={onDemo} />
        )}
        {activeDS === "lru-cache" && (
          state.lruCache ? <LRUCacheCanvas cache={state.lruCache} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="LRU Cache" onDemo={onDemo} />
        )}
        {activeDS === "cuckoo-hash" && (
          state.cuckooHash ? <CuckooHashCanvas cuckoo={state.cuckooHash} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Cuckoo Hashing" onDemo={onDemo} />
        )}
        {activeDS === "monotonic-stack" && (
          state.monotonicStack ? <MonotonicStackCanvas mono={state.monotonicStack} stepIdx={currentStepIdx} steps={steps} />
          : <DSNotInitialized name="Monotonic Stack" onDemo={onDemo} />
        )}
        </CanvasErrorBoundary>
      </div>
      {/* DST-083: Step description overlay — spatial contiguity (Mayer's Principle #2) */}
      {state.currentStepIdx >= 0 && state.currentStepIdx < state.steps.length && (
        <div aria-live="polite" className="rounded-lg border-t border-border/50 px-4 py-2 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-foreground-muted">
              Step {state.currentStepIdx + 1}/{state.steps.length}
            </span>
            <p className="text-xs text-foreground">
              {state.steps[state.currentStepIdx].description}
            </p>
          </div>
        </div>
      )}
      {/* Color legend (DST-161) */}
      <DSColorLegend activeStates={DS_LEGEND_STATES[activeDS] ?? []} />
    </div>
  );
});

export { DSCanvas };
