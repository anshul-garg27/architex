"use client";

import React, { memo, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, DS_TRANSITION, DEMO_LABELS, EmptyStateWithDemo, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { HeapState, FibHeapState, FibFlatNode, BinomialHeapState, BinomialFlatNode } from "@/lib/data-structures";
import { flattenFibHeap, flattenBinomialHeap } from "@/lib/data-structures";

interface HeapLayoutNode {
  value: number;
  index: number;
  x: number;
  y: number;
}

function layoutHeapTree(data: number[], width: number): { nodes: HeapLayoutNode[]; edges: { from: HeapLayoutNode; to: HeapLayoutNode }[] } {
  const nodes: HeapLayoutNode[] = [];
  const edges: { from: HeapLayoutNode; to: HeapLayoutNode }[] = [];
  if (data.length === 0) return { nodes, edges };

  const depth = Math.floor(Math.log2(data.length)) + 1;
  const vGap = 55;

  for (let i = 0; i < data.length; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const nodesInLevel = Math.min(Math.pow(2, level), data.length - (Math.pow(2, level) - 1));
    const levelWidth = width;
    const spacing = levelWidth / (Math.pow(2, level) + 1);
    const x = spacing * (posInLevel + 1);
    const y = 30 + level * vGap;
    nodes.push({ value: data[i], index: i, x, y });
  }

  for (let i = 0; i < data.length; i++) {
    const l = 2 * i + 1;
    const r = 2 * i + 2;
    if (l < data.length) edges.push({ from: nodes[i], to: nodes[l] });
    if (r < data.length) edges.push({ from: nodes[i], to: nodes[r] });
  }

  return { nodes, edges };
}

const HeapCanvas = memo(function HeapCanvas({
  heap,
  stepIdx,
  steps,
  onDemo,
}: {
  heap: HeapState;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  const svgWidth = 500;
  const nodeRadius = 18;
  const { nodes: laid, edges } = useMemo(() => layoutHeapTree(heap.data, svgWidth), [heap.data]);

  const svgHeight = useMemo(() => {
    if (laid.length === 0) return 100;
    return Math.max(...laid.map((n) => n.y)) + 50;
  }, [laid]);

  if (heap.data.length === 0) {
    return (
      <EmptyStateWithDemo
        message="Heap is empty. Insert numbers to see the heap property in action."
        demoLabel={DEMO_LABELS.heap}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        {heap.type === "min" ? "Min" : "Max"}-Heap (size {heap.data.length})
      </h3>

      {/* Tree view */}
      <svg role="img" aria-label={`Heap visualization showing ${heap.data.length} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
        {edges.map((e) => {
          const childHl = getHighlight(stepIdx, steps, `heap-${e.to.index}`);
          const color = DS_COLORS[childHl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.from.index}-${e.to.index}`}
              x1={e.from.x} y1={e.from.y}
              x2={e.to.x} y2={e.to.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
              transition={DS_TRANSITION}
            />
          );
        })}
        {laid.map((n) => {
          const hl = getHighlight(stepIdx, steps, `heap-${n.index}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.g key={n.index}>
              <motion.circle
                cx={n.x} cy={n.y} r={nodeRadius}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: color,
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={DS_TRANSITION}
              />
              <text x={n.x} y={n.y + 4} textAnchor="middle" className="text-[11px] font-semibold" fill={color}>
                {n.value}
              </text>
            </motion.g>
          );
        })}
      </svg>

      {/* Array view */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">Array representation</span>
        <div className="flex gap-0.5">
          {heap.data.map((val, i) => {
            const hl = getHighlight(stepIdx, steps, `heap-${i}`);
            const color = DS_COLORS[hl] ?? DS_COLORS.default;
            return (
              <div key={`heap-${i}-${val}`} className="flex flex-col items-center gap-0.5">
                <motion.div
                  className="flex h-8 w-10 items-center justify-center rounded border font-mono text-xs font-medium"
                  initial={false}
                  animate={{
                    borderColor: color,
                    backgroundColor: dsColorBg(hl),
                    color,
                  }}
                  transition={DS_TRANSITION}
                >
                  {val}
                </motion.div>
                <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

const FibHeapCanvas = memo(function FibHeapCanvas({
  fibHeap,
  stepIdx,
  steps,
}: {
  fibHeap: FibHeapState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const flat = useMemo(() => flattenFibHeap(fibHeap), [fibHeap]);

  if (flat.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Fibonacci Heap is empty. Insert values to see lazy merging.</p>
      </div>
    );
  }

  // Group by root tree: each root and its descendants
  const roots = flat.filter((n) => n.isRoot);
  const maxDepth = Math.max(0, ...flat.map((n) => n.depth));

  // Build tree structure for each root
  const childMap = new Map<string | null, FibFlatNode[]>();
  for (const n of flat) {
    const key = n.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(n);
  }

  // Render a sub-tree recursively
  function renderTree(nodeId: string, depth: number): React.ReactNode {
    const node = flat.find((n) => n.id === nodeId);
    if (!node) return null;

    const children = childMap.get(nodeId) ?? [];
    const hl = getHighlight(stepIdx, steps, nodeId);
    const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : node.isMin ? "#22c55e" : "var(--ds-default)";

    return (
      <div key={nodeId} className="flex flex-col items-center gap-1">
        <motion.div
          className={cn(
            "flex flex-col items-center rounded-full border px-2 py-1 min-w-[36px]",
            node.isMin ? "border-green-500" : "",
            node.marked ? "border-dashed" : "",
          )}
          initial={false}
          animate={{
            borderColor: color,
            backgroundColor: dsColorBg(hl, node.isMin ? "#22c55e15" : "transparent"),
          }}
          transition={{ duration: ANIM_DURATION }}
        >
          <span className="font-mono text-xs font-bold" style={{ color }}>
            {node.key}
          </span>
          <span className="text-[10px] text-foreground-subtle">d={node.degree}</span>
          {node.marked && (
            <span className="text-[10px] text-amber-400">M</span>
          )}
        </motion.div>
        {children.length > 0 && (
          <div className="flex items-start gap-2 border-t border-border/30 pt-1">
            {children.map((c) => renderTree(c.id, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Fibonacci Heap visualization showing ${fibHeap.size} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Fibonacci Heap (size: {fibHeap.size}, trees: {roots.length}
        {fibHeap.minId ? `, min: ${fibHeap.nodes.get(fibHeap.minId)?.key}` : ""})
      </h3>

      {/* Root list (forest) */}
      <div className="flex items-start gap-4 overflow-x-auto max-w-full px-2">
        {roots.map((root) => (
          <div key={root.id} className="flex flex-col items-center">
            {renderTree(root.id, 0)}
          </div>
        ))}
      </div>

      {/* Legend + stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Size</div>
          <div className="font-mono text-sm font-medium text-foreground">{fibHeap.size}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Trees</div>
          <div className="font-mono text-sm font-medium text-blue-400">{roots.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Max Depth</div>
          <div className="font-mono text-sm font-medium text-amber-400">{maxDepth}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Min</div>
          <div className="font-mono text-sm font-medium text-green-400">
            {fibHeap.minId ? fibHeap.nodes.get(fibHeap.minId)?.key ?? "-" : "-"}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-foreground-subtle">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-green-500 bg-green-500/20" /> Min
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-dashed border-foreground-muted" /> Marked
        </span>
        <span>d = degree (child count)</span>
      </div>
    </div>
  );
});

const BinomialHeapCanvas = memo(function BinomialHeapCanvas({
  binomialHeap,
  stepIdx,
  steps,
}: {
  binomialHeap: BinomialHeapState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const flat = useMemo(() => flattenBinomialHeap(binomialHeap), [binomialHeap]);

  if (flat.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Binomial Heap is empty. Insert values to see binomial tree forest.</p>
      </div>
    );
  }

  const roots = flat.filter((n) => n.isRoot);
  const childMap = new Map<string | null, BinomialFlatNode[]>();
  for (const n of flat) {
    const key = n.parentId;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(n);
  }

  // Find min key
  let minKey = Infinity;
  let minId = "";
  for (const n of flat) {
    if (n.key < minKey) { minKey = n.key; minId = n.id; }
  }

  function renderBinomialTree(nodeId: string): React.ReactNode {
    const node = flat.find((n) => n.id === nodeId);
    if (!node) return null;

    const children = childMap.get(nodeId) ?? [];
    const hl = getHighlight(stepIdx, steps, nodeId);
    const color = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : node.id === minId ? "#22c55e" : "var(--ds-default)";

    return (
      <div key={nodeId} className="flex flex-col items-center gap-1">
        <motion.div
          className={cn(
            "flex flex-col items-center rounded-full border px-2.5 py-1 min-w-[38px]",
            node.id === minId ? "border-green-500" : "",
          )}
          initial={false}
          animate={{
            borderColor: color,
            backgroundColor: dsColorBg(hl, node.id === minId ? "#22c55e15" : "transparent"),
          }}
          transition={{ duration: ANIM_DURATION }}
        >
          <span className="font-mono text-xs font-bold" style={{ color }}>
            {node.key}
          </span>
          <span className="text-[10px] text-foreground-subtle">B{node.order}</span>
        </motion.div>
        {children.length > 0 && (
          <div className="flex items-start gap-2 border-t border-border/30 pt-1">
            {children.map((c) => renderBinomialTree(c.id))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Binomial Heap visualization showing ${binomialHeap.size} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Binomial Heap (size: {binomialHeap.size}, trees: {roots.length}, min: {minKey})
      </h3>

      <div className="flex items-start gap-6 overflow-x-auto max-w-full px-2">
        {roots.map((root) => (
          <div key={root.id} className="flex flex-col items-center">
            <span className="text-[10px] text-foreground-subtle mb-1">B{root.order}</span>
            {renderBinomialTree(root.id)}
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Size</div>
          <div className="font-mono text-sm font-medium text-foreground">{binomialHeap.size}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Trees</div>
          <div className="font-mono text-sm font-medium text-blue-400">{roots.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Min</div>
          <div className="font-mono text-sm font-medium text-green-400">{minKey === Infinity ? "-" : minKey}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Binary</div>
          <div className="font-mono text-sm font-medium text-amber-400">{binomialHeap.size.toString(2)}</div>
        </div>
      </div>

      <div className="flex gap-4 text-[10px] text-foreground-subtle">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-green-500 bg-green-500/20" /> Min
        </span>
        <span>B_k = binomial tree of order k (2^k nodes)</span>
      </div>
    </div>
  );
});

export { HeapCanvas, FibHeapCanvas, BinomialHeapCanvas };
