"use client";

import React, { memo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, DEMO_LABELS, EmptyStateWithDemo, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { HashTableState, LRUNode, LRUCacheState, CuckooHashState } from "@/lib/data-structures";

const HashTableCanvas = memo(function HashTableCanvas({
  table,
  stepIdx,
  steps,
  onDemo,
}: {
  table: HashTableState;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  if (table.size === 0) {
    return (
      <EmptyStateWithDemo
        message="Hash table is empty. Enter a key and value, then click Insert."
        demoLabel={DEMO_LABELS["hash-table"]}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div role="img" aria-label={`Hash Table visualization showing ${table.size} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Hash Table (capacity {table.capacity}, size {table.size})
      </h3>
      <div className="flex flex-col gap-1">
        {table.buckets.map((bucket) => {
          const bucketHl = getHighlight(stepIdx, steps, `bucket-${bucket.index}`);
          const bucketColor = DS_COLORS[bucketHl] ?? DS_COLORS.default;

          return (
            <div key={bucket.index} className="flex items-center gap-1">
              <motion.div
                className="flex h-8 w-10 items-center justify-center rounded border font-mono text-xs font-medium"
                initial={false}
                animate={{
                  borderColor: bucketColor,
                  backgroundColor: dsColorBg(bucketHl),
                  color: bucketColor,
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                {bucket.index}
              </motion.div>
              <svg width="16" height="8" className="shrink-0">
                <line x1="0" y1="4" x2="10" y2="4" stroke="var(--ds-default)" strokeWidth="1" />
                <polygon points="10,1.5 16,4 10,6.5" fill="var(--ds-default)" />
              </svg>
              {bucket.chain.length === 0 ? (
                <span className="text-[10px] text-foreground-subtle">empty</span>
              ) : (
                <div className="flex items-center gap-1">
                  {bucket.chain.map((entry, ci) => {
                    const chainHl = getHighlight(stepIdx, steps, `chain-${bucket.index}-${ci}`);
                    const chainColor = DS_COLORS[chainHl] ?? DS_COLORS.default;

                    return (
                      <React.Fragment key={entry.key}>
                        <motion.div
                          className="flex h-8 items-center gap-1 rounded border px-2 font-mono text-[10px]"
                          initial={false}
                          animate={{
                            borderColor: chainColor,
                            backgroundColor: dsColorBg(chainHl),
                            color: chainColor,
                          }}
                          transition={{ duration: ANIM_DURATION }}
                        >
                          <span className="font-medium">{entry.key}</span>
                          <span className="text-foreground-subtle">:</span>
                          <span>{entry.value}</span>
                        </motion.div>
                        {ci < bucket.chain.length - 1 && (
                          <svg width="12" height="8" className="shrink-0">
                            <line x1="0" y1="4" x2="6" y2="4" stroke="var(--ds-default)" strokeWidth="1" />
                            <polygon points="6,1.5 12,4 6,6.5" fill="var(--ds-default)" />
                          </svg>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const LRUCacheCanvas = memo(function LRUCacheCanvas({
  cache,
  stepIdx,
  steps,
}: {
  cache: LRUCacheState;
  stepIdx: number;
  steps: DSStep[];
}) {
  // Walk the DLL from head to tail for ordered display
  const orderedNodes: LRUNode[] = [];
  let cur = cache.headId;
  const visited = new Set<string>();
  while (cur !== null && !visited.has(cur)) {
    visited.add(cur);
    const node = cache.nodes.find((n) => n.id === cur);
    if (!node) break;
    orderedNodes.push(node);
    cur = node.next;
  }

  const capacityPct = cache.capacity > 0 ? (cache.size / cache.capacity) * 100 : 0;

  return (
    <div role="img" aria-label={`LRU Cache visualization showing ${cache.size} elements`} className="flex flex-col items-center gap-4 w-full max-w-3xl">
      {/* Title + capacity bar */}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          LRU Cache (capacity {cache.capacity}, size {cache.size}, evictions {cache.evictionCount})
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-40 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{
                width: `${capacityPct}%`,
                backgroundColor: capacityPct >= 100 ? "#ef4444" : capacityPct >= 75 ? "#f59e0b" : "#22c55e",
              }}
              transition={{ duration: ANIM_DURATION }}
            />
          </div>
          <span className="text-[10px] font-mono text-foreground-subtle">
            {cache.size}/{cache.capacity}
          </span>
        </div>
      </div>

      <div className="flex gap-8 items-start w-full justify-center">
        {/* LEFT: Hash Map view */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Hash Map (O(1) lookup)
          </span>
          <div className="flex flex-col gap-1">
            {cache.size === 0 ? (
              <span className="text-[10px] text-foreground-subtle italic">empty</span>
            ) : (
              orderedNodes.map((node) => {
                const hl = getHighlight(stepIdx, steps, `lru-map-${node.key}`);
                const color = DS_COLORS[hl] ?? DS_COLORS.default;
                return (
                  <motion.div
                    key={node.key}
                    className="flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px]"
                    initial={false}
                    animate={{
                      borderColor: color,
                      backgroundColor: dsColorBg(hl),
                      color: color,
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    <span className="font-medium">{node.key}</span>
                    <svg width="12" height="8" className="shrink-0">
                      <line x1="0" y1="4" x2="6" y2="4" stroke={color} strokeWidth="1" />
                      <polygon points="6,1.5 12,4 6,6.5" fill={color} />
                    </svg>
                    <span className="text-foreground-subtle">node</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Connecting arrows between hash map and DLL */}
        {cache.size > 0 && (
          <div className="flex items-center self-center">
            <svg width="40" height="20" className="shrink-0">
              <line x1="0" y1="10" x2="30" y2="10" stroke="var(--ds-default)" strokeWidth="1" strokeDasharray="3,3" />
              <polygon points="30,7 36,10 30,13" fill="var(--ds-default)" />
            </svg>
          </div>
        )}

        {/* RIGHT: Doubly Linked List view */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Doubly Linked List (eviction order)
          </span>
          {cache.size === 0 ? (
            <span className="text-[10px] text-foreground-subtle italic">empty</span>
          ) : (
            <div className="flex flex-col items-center gap-0">
              {/* MRU label */}
              <span className="text-[10px] font-medium text-primary mb-1">HEAD (MRU)</span>
              {orderedNodes.map((node, i) => {
                const hl = getHighlight(stepIdx, steps, `lru-${node.key}`);
                const color = DS_COLORS[hl] ?? DS_COLORS.default;
                const isHead = i === 0;
                const isTail = i === orderedNodes.length - 1;
                return (
                  <React.Fragment key={node.id}>
                    <motion.div
                      className={cn(
                        "flex items-center gap-2 rounded border px-3 py-1.5 font-mono text-xs",
                        isHead && "ring-1 ring-primary/30",
                        isTail && "ring-1 ring-red-500/30",
                      )}
                      initial={false}
                      animate={{
                        borderColor: color,
                        backgroundColor: dsColorBg(hl),
                        color: color,
                      }}
                      transition={{ duration: ANIM_DURATION }}
                    >
                      <span className="font-medium">{node.key}</span>
                      <span className="text-foreground-subtle">:</span>
                      <span>{node.value}</span>
                    </motion.div>
                    {/* Bidirectional arrow between nodes */}
                    {i < orderedNodes.length - 1 && (
                      <svg width="20" height="20" className="shrink-0">
                        {/* Down arrow */}
                        <line x1="7" y1="2" x2="7" y2="14" stroke="var(--ds-default)" strokeWidth="1" />
                        <polygon points="4.5,14 7,18 9.5,14" fill="var(--ds-default)" />
                        {/* Up arrow */}
                        <line x1="13" y1="18" x2="13" y2="6" stroke="var(--ds-default)" strokeWidth="1" />
                        <polygon points="10.5,6 13,2 15.5,6" fill="var(--ds-default)" />
                      </svg>
                    )}
                  </React.Fragment>
                );
              })}
              {/* LRU label */}
              <span className="text-[10px] font-medium text-red-500 mt-1">TAIL (LRU)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});


const CuckooHashCanvas = memo(function CuckooHashCanvas({
  cuckoo,
  stepIdx,
  steps,
}: {
  cuckoo: CuckooHashState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const loadPct = cuckoo.capacity > 0 ? (cuckoo.size / (cuckoo.capacity * 2)) * 100 : 0;

  return (
    <div role="img" aria-label={`Cuckoo Hash visualization showing ${cuckoo.size} elements`} className="flex flex-col items-center gap-4 w-full max-w-4xl">
      {/* Title + load */}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          Cuckoo Hash (capacity {cuckoo.capacity} per table, size {cuckoo.size})
        </h3>
        <div className="flex items-center gap-2">
          <div className="h-2 w-40 rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={false}
              animate={{
                width: `${loadPct}%`,
                backgroundColor: loadPct >= 75 ? "#ef4444" : loadPct >= 50 ? "#f59e0b" : "#22c55e",
              }}
              transition={{ duration: ANIM_DURATION }}
            />
          </div>
          <span className="text-[10px] font-mono text-foreground-subtle">
            {cuckoo.size}/{cuckoo.capacity * 2} slots
          </span>
        </div>
      </div>

      {/* Two tables side by side */}
      <div className="flex gap-8 items-start justify-center">
        {/* Table 1 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Table 1 (hash1)
          </span>
          <div className="flex flex-col gap-1">
            {cuckoo.table1.map((val, idx) => {
              const hl = getHighlight(stepIdx, steps, `t1-${idx}`);
              const color = DS_COLORS[hl] ?? DS_COLORS.default;
              return (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-6 text-right text-[10px] font-mono text-foreground-subtle">{idx}</span>
                  <motion.div
                    className={cn(
                      "flex h-8 w-28 items-center justify-center rounded border font-mono text-xs",
                      val === null && "opacity-40",
                    )}
                    initial={false}
                    animate={{
                      borderColor: color,
                      backgroundColor: dsColorBg(hl),
                      color: color,
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    {val ?? "empty"}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Displacement arrows area */}
        <div className="flex flex-col items-center justify-center self-center gap-1">
          <svg width="40" height="40">
            {/* Right arrow (T1 -> T2) */}
            <line x1="4" y1="12" x2="30" y2="12" stroke="var(--ds-default)" strokeWidth="1.5" />
            <polygon points="30,8 38,12 30,16" fill="var(--ds-default)" />
            {/* Left arrow (T2 -> T1) */}
            <line x1="36" y1="28" x2="10" y2="28" stroke="var(--ds-default)" strokeWidth="1.5" />
            <polygon points="10,24 2,28 10,32" fill="var(--ds-default)" />
          </svg>
          <span className="text-[10px] text-foreground-subtle">displace</span>
        </div>

        {/* Table 2 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">
            Table 2 (hash2)
          </span>
          <div className="flex flex-col gap-1">
            {cuckoo.table2.map((val, idx) => {
              const hl = getHighlight(stepIdx, steps, `t2-${idx}`);
              const color = DS_COLORS[hl] ?? DS_COLORS.default;
              return (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-6 text-right text-[10px] font-mono text-foreground-subtle">{idx}</span>
                  <motion.div
                    className={cn(
                      "flex h-8 w-28 items-center justify-center rounded border font-mono text-xs",
                      val === null && "opacity-40",
                    )}
                    initial={false}
                    animate={{
                      borderColor: color,
                      backgroundColor: dsColorBg(hl),
                      color: color,
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    {val ?? "empty"}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});

export { HashTableCanvas, LRUCacheCanvas, CuckooHashCanvas };
