"use client";

import React, { memo, useMemo, useState } from "react";
import { Eye, BarChart3 } from "lucide-react";
import type { ActiveDS, DSModuleState } from "./types";
import { DS_CATALOG } from "@/lib/data-structures/catalog";
import { bstSize, avlSize, rbSize } from "@/lib/data-structures";

// DST-203: Copy-to-clipboard button
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[9px] text-foreground-subtle hover:text-foreground"
      title="Copy to clipboard"
    >
      {copied ? '\u2713' : '\uD83D\uDCCB'}
    </button>
  );
}

const DSProperties = memo(function DSProperties({
  activeDS,
  state,
}: {
  activeDS: ActiveDS;
  state: DSModuleState;
}) {
  const config = DS_CATALOG.find((d) => d.id === activeDS);

  // DST-090: Operation metrics derived from step descriptions
  const metrics = useMemo(() => {
    const { steps } = state;
    if (steps.length === 0) return null;
    let comparisons = 0;
    let swaps = 0;
    let shifts = 0;
    let rotations = 0;
    let reads = 0;
    let writes = 0;
    for (const s of steps) {
      const desc = s.description.toLowerCase();
      if (desc.includes("compare") || desc.includes("check")) comparisons++;
      if (desc.includes("swap")) swaps++;
      if (desc.includes("shift")) shifts++;
      if (desc.includes("rotat")) rotations++;
      if (desc.includes("read") || desc.includes("visit") || desc.includes("look") || desc.includes("search") || desc.includes("traverse")) reads++;
      if (desc.includes("insert") || desc.includes("write") || desc.includes("set") || desc.includes("delet") || desc.includes("remov")) writes++;
    }
    return { comparisons, swaps, shifts, rotations, reads, writes, total: steps.length };
  }, [state.steps]);

  if (!config) return null;

  // Current size
  let size = 0;
  let capacity: number | null = null;
  switch (activeDS) {
    case "array":
      size = state.arrayData.length;
      break;
    case "stack":
      size = state.stackData.length;
      break;
    case "queue":
      size = state.queueData.length;
      break;
    case "linked-list":
      size = state.llNodes.length;
      break;
    case "hash-table":
      size = state.hashTable.size;
      capacity = state.hashTable.capacity;
      break;
    case "bst":
      size = bstSize(state.bstRoot);
      break;
    case "bloom-filter":
      size = state.bloomFilter.n;
      capacity = state.bloomFilter.m;
      break;
    case "skip-list":
      size = state.skipList.size;
      break;
    case "heap":
      size = state.heap.data.length;
      break;
    case "trie":
      size = state.trie.size;
      break;
    case "union-find":
      size = state.disjointSet?.size ?? 0;
      break;
    case "lsm-tree":
      size = (state.lsmTree?.memtable?.length ?? 0) + (state.lsmTree?.levels?.reduce((acc, lvl) => acc + lvl.reduce((a, t) => a + t.length, 0), 0) ?? 0);
      capacity = state.lsmTree?.memtableCapacity ?? null;
      break;
    case "consistent-hash":
      size = state.chRing?.keys?.length ?? 0;
      capacity = state.chRing?.nodes?.length ?? null;
      break;
    case "merkle-tree":
      size = state.merkleTree?.leaves?.length ?? 0;
      break;
    case "count-min-sketch":
      size = state.countMinSketch?.n ?? 0;
      capacity = state.countMinSketch ? state.countMinSketch.d * state.countMinSketch.w : null;
      break;
    case "hyperloglog":
      size = state.hyperLogLog?.addedElements?.length ?? 0;
      capacity = state.hyperLogLog?.m ?? null;
      break;
    case "deque":
      size = state.deque?.data?.length ?? 0;
      break;
    case "circular-buffer":
      size = state.circularBuffer?.count ?? 0;
      capacity = state.circularBuffer?.capacity ?? null;
      break;
    case "wal":
      size = state.wal?.entries?.length ?? 0;
      break;
    case "rope":
      size = state.rope?.totalLength ?? 0;
      break;
    case "r-tree":
      size = state.rTree?.size ?? 0;
      break;
    case "quadtree":
      size = state.quadtree?.size ?? 0;
      capacity = state.quadtree?.capacity ?? null;
      break;
    case "fibonacci-heap":
      size = state.fibHeap?.size ?? 0;
      break;
    case "avl-tree":
      size = avlSize(state.avlRoot);
      break;
    case "red-black-tree":
      size = rbSize(state.rbRoot);
      break;
    case "segment-tree":
      size = state.segmentTree?.n ?? 0;
      break;
    case "bplus-tree":
      size = state.bplusTree?.size ?? 0;
      break;
    case "fenwick-tree":
      size = state.fenwickTree?.n ?? 0;
      break;
    case "splay-tree":
      size = state.splayTree?.size ?? 0;
      break;
    case "crdt":
      switch (state.crdtType) {
        case 'g-counter': size = state.crdtCounter ? Object.keys(state.crdtCounter.counts).length : 0; break;
        case 'pn-counter': size = state.pnCounter ? Object.keys(state.pnCounter.positive.counts).length : 0; break;
        case 'lww-register': size = state.lwwRegister?.value !== null ? 1 : 0; break;
        case 'or-set': size = state.orSet?.entries?.length ?? 0; break;
      }
      break;
    case "vector-clock":
      size = state.vectorClock?.events?.length ?? 0;
      break;
    case "treap":
      size = state.treap?.size ?? 0;
      break;
    case "binomial-heap":
      size = state.binomialHeap?.size ?? 0;
      break;
    case "b-tree":
      size = state.bTree?.size ?? 0;
      break;
    case "doubly-linked-list":
      size = state.dll?.size ?? 0;
      break;
    case "priority-queue":
      size = state.pq?.size ?? 0;
      break;
    case "lru-cache":
      size = state.lruCache?.size ?? 0;
      capacity = state.lruCache?.capacity ?? null;
      break;
    case "cuckoo-hash":
      size = state.cuckooHash?.size ?? 0;
      capacity = state.cuckooHash?.capacity ?? null;
      break;
    case "monotonic-stack":
      size = state.monotonicStack?.data?.length ?? 0;
      break;
    default: {
      // Exhaustive check — TypeScript will error if a new ActiveDS case is unhandled
      const _exhaustive: never = activeDS;
      void _exhaustive;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border/30 px-3 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
          Properties
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {/* DS Name & Description */}
        <div className="mb-3">
          <h3 className="mb-1 text-sm font-medium text-foreground">{config.name}</h3>
          <p className="text-xs text-foreground-muted">{config.description}</p>
        </div>

        {/* Size / Capacity */}
        <div className="mb-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-foreground-subtle">Size: </span>
              <span className="font-mono font-medium text-foreground">{size}</span>
            </div>
            {capacity !== null && (
              <div>
                <span className="text-foreground-subtle">Capacity: </span>
                <span className="font-mono font-medium text-foreground">{capacity}</span>
              </div>
            )}
          </div>
        </div>

        {/* Complexity table */}
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
              Complexity
            </span>
            <CopyButton
              text={`${config.name}: ${Object.entries(config.complexity).map(([op, c]) => `${op} ${c}`).join(', ')}`}
            />
          </div>
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
            <div className="space-y-1">
              {Object.entries(config.complexity).map(([op, cmplx]) => (
                <div key={op} className="flex items-center justify-between text-xs">
                  <span className="text-foreground-subtle">{op}</span>
                  <span className="font-mono font-medium text-primary">{cmplx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Complexity intuition (DST-143) */}
        {config.complexityIntuition && (
          <div className="mt-3 rounded-xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm p-2">
            <div className="text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1">
              What This Means
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              {config.complexityIntuition}
            </p>
          </div>
        )}

        {/* When to Use guide (DST-135) */}
        {config.whenToUse && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">When to Use</span>
              <CopyButton
                text={`Use: ${config.whenToUse.use}\nDon't use: ${config.whenToUse.dontUse}`}
              />
            </div>
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 px-2 py-1.5 text-xs text-green-400">{'\u2713'} {config.whenToUse.use}</div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-xs text-red-400 mt-1">{'\u2717'} {config.whenToUse.dontUse}</div>
          </div>
        )}

        {/* Key Takeaways (DST-203) */}
        {config.keyTakeaways && config.keyTakeaways.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">Key Takeaways</span>
              <CopyButton text={config.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')} />
            </div>
            <ul className="space-y-1">
              {config.keyTakeaways.map((t, i) => (
                <li key={i} className="text-xs text-foreground-muted leading-relaxed flex gap-1.5">
                  <span className="text-primary shrink-0">{'\u2022'}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Current step */}
        {state.currentStepIdx >= 0 && state.currentStepIdx < state.steps.length && (
          <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
            <div className="mb-1 flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-foreground-subtle" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                Step {state.currentStepIdx + 1}
              </span>
            </div>
            <p className="text-xs text-foreground">
              {state.steps[state.currentStepIdx].description}
            </p>
          </div>
        )}

        {/* DST-090: Operation metrics */}
        {metrics && (
          <div className="mt-3 rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2">
            <div className="mb-1.5 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3 text-foreground-subtle" />
              <span className="text-[10px] font-medium uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
                Operation Metrics
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {metrics.comparisons > 0 && (
                <div>
                  <span className="text-foreground-subtle">Comparisons: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.comparisons}</span>
                </div>
              )}
              {metrics.swaps > 0 && (
                <div>
                  <span className="text-foreground-subtle">Swaps: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.swaps}</span>
                </div>
              )}
              {metrics.shifts > 0 && (
                <div>
                  <span className="text-foreground-subtle">Shifts: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.shifts}</span>
                </div>
              )}
              {metrics.rotations > 0 && (
                <div>
                  <span className="text-foreground-subtle">Rotations: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.rotations}</span>
                </div>
              )}
              {metrics.reads > 0 && (
                <div>
                  <span className="text-foreground-subtle">Reads: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.reads}</span>
                </div>
              )}
              {metrics.writes > 0 && (
                <div>
                  <span className="text-foreground-subtle">Writes: </span>
                  <span className="font-mono font-medium text-foreground">{metrics.writes}</span>
                </div>
              )}
              <div className="col-span-2 mt-1 border-t border-border/30 pt-1">
                <span className="text-foreground-subtle">Total Steps: </span>
                <span className="font-mono font-medium text-primary">{metrics.total}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export { DSProperties };
