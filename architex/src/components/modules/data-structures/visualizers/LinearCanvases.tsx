"use client";

import React, { memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { DS_COLORS, dsColorBg, ANIM_DURATION, DS_TRANSITION, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type { LLNode, DequeState, CircularBufferState, WALState, RopeState, RopeFlatNode, DLLNode, DLLState, PQEntry, PriorityQueueState, MonotonicState } from "@/lib/data-structures";
import { Shield } from "lucide-react";
import { flattenRope, ropeToString } from "@/lib/data-structures";

// DST-179: Staggered entry animation variants
const staggerContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03 } },
};
const staggerItemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1 },
};

const ArrayCanvas = memo(function ArrayCanvas({
  data,
  label,
  prefix,
  stepIdx,
  steps,
  vertical,
  showPointers,
}: {
  data: number[];
  label: string;
  prefix: string;
  stepIdx: number;
  steps: DSStep[];
  vertical?: boolean;
  showPointers?: { front?: boolean; rear?: boolean; top?: boolean };
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">{label} is empty</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`${label} visualization showing ${data.length} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </h3>
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className={cn("flex gap-1", vertical ? "flex-col-reverse" : "flex-row")}
      >
        <AnimatePresence>
        {data.map((val, i) => {
          const hl = getHighlight(stepIdx, steps, `${prefix}-${i}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isFirst = i === 0;
          const isLast = i === data.length - 1;

          return (
            <motion.div
              key={`arr-${i}-${val}`}
              className="flex flex-col items-center gap-0.5"
              variants={staggerItemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.8 }}
              transition={DS_TRANSITION}
            >
              {showPointers?.top && isLast && (
                <span className="text-[10px] font-medium text-purple-400">TOP</span>
              )}
              {showPointers?.front && isFirst && !vertical && (
                <span className="text-[10px] font-medium text-green-400">FRONT</span>
              )}
              {showPointers?.rear && isLast && !vertical && (
                <span className="text-[10px] font-medium text-amber-400">REAR</span>
              )}
              <motion.div
                className="flex h-10 w-12 items-center justify-center rounded border font-mono text-sm font-medium"
                initial={false}
                animate={{
                  borderColor: color,
                  backgroundColor: dsColorBg(hl),
                  color: color,
                }}
                transition={DS_TRANSITION}
              >
                {val}
              </motion.div>
              <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

const LinkedListCanvas = memo(function LinkedListCanvas({
  nodes,
  headId,
  stepIdx,
  steps,
}: {
  nodes: LLNode[];
  headId: string | null;
  stepIdx: number;
  steps: DSStep[];
}) {
  // Walk from head to build ordered rendering
  const ordered = useMemo(() => {
    if (!headId) return [];
    const result: LLNode[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    let current = nodeMap.get(headId);
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      result.push(current);
      current = current.next ? nodeMap.get(current.next) : undefined;
    }
    return result;
  }, [nodes, headId]);

  if (ordered.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Linked list is empty. Type a value and click Insert to add a node.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Linked List visualization showing ${ordered.length} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Linked List
      </h3>
      <motion.div
        variants={staggerContainerVariants}
        initial="hidden"
        animate="visible"
        className="flex items-center gap-0"
      >
        <span className="mr-2 text-[10px] font-medium text-green-400">HEAD</span>
        <AnimatePresence>
        {ordered.map((node, i) => {
          const hl = getHighlight(stepIdx, steps, node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;

          return (
            <motion.div
              key={node.id}
              className="flex items-center gap-0"
              variants={staggerItemVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              transition={DS_TRANSITION}
            >
              <motion.div
                className="flex h-10 items-center rounded border"
                initial={false}
                animate={{
                  borderColor: color,
                  backgroundColor: dsColorBg(hl),
                }}
                transition={DS_TRANSITION}
              >
                <div className="flex h-full w-12 items-center justify-center border-r font-mono text-sm font-medium" style={{ borderColor: color, color }}>
                  {node.value}
                </div>
                <div className="flex h-full w-6 items-center justify-center text-[10px] text-foreground-subtle">
                  {node.next ? "\u2192" : "\u2205"}
                </div>
              </motion.div>
              {i < ordered.length - 1 && (
                <svg width="20" height="10" className="shrink-0">
                  <line x1="0" y1="5" x2="14" y2="5" stroke={color} strokeWidth="1.5" />
                  <polygon points="14,2 20,5 14,8" fill={color} />
                </svg>
              )}
            </motion.div>
          );
        })}
        </AnimatePresence>
        <span className="ml-2 text-[10px] text-foreground-subtle">NULL</span>
      </motion.div>
    </div>
  );
});

const DequeCanvas = memo(function DequeCanvas({
  deque,
  stepIdx,
  steps,
}: {
  deque: DequeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  if (deque.data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Deque is empty. Use pushFront/pushBack to add elements.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Deque visualization showing ${deque.data.length} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Deque (size {deque.data.length})
      </h3>
      <div className="flex items-center gap-0">
        {/* Front pointer arrow */}
        <div className="flex flex-col items-center mr-2">
          <span className="text-[10px] font-medium text-green-400">FRONT</span>
          <svg width="20" height="10" className="shrink-0">
            <line x1="0" y1="5" x2="14" y2="5" stroke="#22c55e" strokeWidth="1.5" />
            <polygon points="14,2 20,5 14,8" fill="#22c55e" />
          </svg>
        </div>

        {/* Deque blocks */}
        {deque.data.map((val, i) => {
          const hl = getHighlight(stepIdx, steps, `deque-${i}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isFirst = i === 0;
          const isLast = i === deque.data.length - 1;

          return (
            <div key={`deque-${i}-${val}`} className="flex flex-col items-center gap-0.5">
              <motion.div
                className={cn(
                  "flex h-10 w-12 items-center justify-center border font-mono text-sm font-medium",
                  isFirst && "rounded-l",
                  isLast && "rounded-r",
                  !isFirst && "border-l-0",
                )}
                initial={false}
                animate={{
                  borderColor: color,
                  backgroundColor: dsColorBg(hl, isFirst || isLast ? "#3b82f610" : "transparent"),
                  color: color,
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                {val}
              </motion.div>
              <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
            </div>
          );
        })}

        {/* Back pointer arrow */}
        <div className="flex flex-col items-center ml-2">
          <span className="text-[10px] font-medium text-amber-400">BACK</span>
          <svg width="20" height="10" className="shrink-0">
            <line x1="6" y1="5" x2="20" y2="5" stroke="#f59e0b" strokeWidth="1.5" />
            <polygon points="6,2 0,5 6,8" fill="#f59e0b" />
          </svg>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Front</div>
          <div className="font-mono text-sm font-medium text-green-400">{deque.data[0]}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Back</div>
          <div className="font-mono text-sm font-medium text-amber-400">{deque.data[deque.data.length - 1]}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Size</div>
          <div className="font-mono text-sm font-medium text-foreground">{deque.data.length}</div>
        </div>
      </div>
    </div>
  );
});

const CircularBufferCanvas = memo(function CircularBufferCanvas({
  buffer,
  stepIdx,
  steps,
}: {
  buffer: CircularBufferState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { data, writePtr, readPtr, capacity, count, overwriteCount } = buffer;

  // Lay slots in a circle
  const cx = 140;
  const cy = 140;
  const radius = 100;
  const slotSize = 32;

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Circular Buffer (capacity={capacity}, count={count})
      </h3>
      <svg role="img" aria-label={`Circular Buffer visualization showing ${count} of ${capacity} elements`} width={280} height={280} className="overflow-visible">
        {/* Ring path */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="var(--ds-node-fill)" strokeWidth="1" strokeDasharray="4 4" />
        {data.map((val, i) => {
          const angle = (2 * Math.PI * i) / capacity - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const hl = getHighlight(stepIdx, steps, `cb-${i}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isRead = i === readPtr && count > 0;
          const isWrite = i === writePtr;
          const filled = val !== null;

          return (
            <g key={`cb-${i}`}>
              <motion.rect
                x={x - slotSize / 2}
                y={y - slotSize / 2}
                width={slotSize}
                height={slotSize}
                rx={4}
                initial={false}
                animate={{
                  stroke: hl !== "default" ? color : isRead ? "#22c55e" : isWrite ? "#f59e0b" : filled ? "#6366f1" : "#374151",
                  fill: dsColorBg(hl, filled ? "#6366f120" : "transparent"),
                  strokeWidth: isRead || isWrite ? 2 : 1,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="font-mono text-[10px] font-medium"
                fill={hl !== "default" ? color : filled ? "#c7d2fe" : "#4b5563"}
              >
                {val !== null ? val : "-"}
              </text>
              {/* Index label */}
              <text
                x={x + (slotSize / 2 + 6) * Math.cos(angle)}
                y={y + (slotSize / 2 + 6) * Math.sin(angle) + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px]"
                fill="var(--ds-default)"
              >
                {i}
              </text>
            </g>
          );
        })}
        {/* Read pointer label */}
        {count > 0 && (() => {
          const rAngle = (2 * Math.PI * readPtr) / capacity - Math.PI / 2;
          const rx = cx + (radius + 24) * Math.cos(rAngle);
          const ry = cy + (radius + 24) * Math.sin(rAngle);
          return (
            <text x={rx} y={ry} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-medium" fill="#22c55e">
              R
            </text>
          );
        })()}
        {/* Write pointer label */}
        {(() => {
          const wAngle = (2 * Math.PI * writePtr) / capacity - Math.PI / 2;
          const wx = cx + (radius + 24) * Math.cos(wAngle);
          const wy = cy + (radius + 24) * Math.sin(wAngle);
          return (
            <text x={wx} y={wy} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-medium" fill="#f59e0b">
              W
            </text>
          );
        })()}
        {/* Center info */}
        <text x={cx} y={cy - 8} textAnchor="middle" className="text-[10px] font-medium" fill="#9ca3af">
          {count}/{capacity}
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" className="text-[10px]" fill="var(--ds-default)">
          overwrites: {overwriteCount}
        </text>
      </svg>
      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Read Ptr</div>
          <div className="font-mono text-sm font-medium text-green-400">{readPtr}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Write Ptr</div>
          <div className="font-mono text-sm font-medium text-amber-400">{writePtr}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Count</div>
          <div className="font-mono text-sm font-medium text-foreground">{count}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Overwrites</div>
          <div className="font-mono text-sm font-medium text-red-400">{overwriteCount}</div>
        </div>
      </div>
    </div>
  );
});

const WALCanvas = memo(function WALCanvas({
  wal,
  stepIdx,
  steps,
}: {
  wal: WALState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { entries, checkpointLSN, crashed, recoveredEntries } = wal;

  if (entries.length === 0 && !crashed) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">WAL is empty. Append some entries.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Write-Ahead Log visualization showing ${entries.length} entries`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Write-Ahead Log ({entries.length} entries{crashed ? " -- CRASHED" : ""})
      </h3>

      {crashed && (
        <div className="rounded border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
          SYSTEM CRASHED -- use Recover to replay from checkpoint
        </div>
      )}

      {/* Log entries as sequential blocks */}
      <div className="flex flex-col gap-0.5 w-full max-w-md">
        {entries.map((entry) => {
          const hl = getHighlight(stepIdx, steps, `wal-${entry.lsn}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isCheckpointed = entry.checkpointed;
          const isAtCheckpoint = entry.lsn === checkpointLSN;

          return (
            <div key={entry.lsn} className="relative">
              {isAtCheckpoint && (
                <div className="absolute -left-20 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] font-medium text-green-400 whitespace-nowrap">CKPT</span>
                  <svg width="12" height="8">
                    <polygon points="6,0 12,4 6,8" fill="#22c55e" />
                  </svg>
                </div>
              )}
              <motion.div
                className="flex items-center gap-2 rounded border px-3 py-1.5"
                initial={false}
                animate={{
                  borderColor: hl !== "default" ? color : isCheckpointed ? "#22c55e40" : "#374151",
                  backgroundColor: hl !== "default" ? color + "15" : isCheckpointed ? "#22c55e08" : "transparent",
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                <span
                  className="font-mono text-[10px] font-bold min-w-[40px]"
                  style={{ color: hl !== "default" ? color : "#93c5fd" }}
                >
                  LSN {entry.lsn}
                </span>
                <span className="text-xs text-foreground" style={{ color: hl !== "default" ? color : undefined }}>
                  {entry.data}
                </span>
                {isCheckpointed && (
                  <Shield className="h-3 w-3 ml-auto text-green-500/60 shrink-0" />
                )}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Recovered entries info */}
      {recoveredEntries.length > 0 && !crashed && (
        <div className="rounded border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-green-400 max-w-md w-full">
          Last recovery replayed {recoveredEntries.length} entries (LSN {recoveredEntries[0].lsn}
          {recoveredEntries.length > 1 ? ` to ${recoveredEntries[recoveredEntries.length - 1].lsn}` : ""})
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Entries</div>
          <div className="font-mono text-sm font-medium text-foreground">{entries.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Checkpoint</div>
          <div className="font-mono text-sm font-medium text-green-400">{checkpointLSN === -1 ? "none" : `LSN ${checkpointLSN}`}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Next LSN</div>
          <div className="font-mono text-sm font-medium text-blue-400">{wal.nextLSN}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Status</div>
          <div className={cn("font-mono text-sm font-medium", crashed ? "text-red-400" : "text-green-400")}>
            {crashed ? "CRASHED" : "OK"}
          </div>
        </div>
      </div>
    </div>
  );
});

interface RopeLayoutNode {
  node: RopeFlatNode;
  x: number;
  y: number;
}

function layoutRopeTree(flat: RopeFlatNode[], width: number): RopeLayoutNode[] {
  if (flat.length === 0) return [];

  // Group by depth
  const byDepth = new Map<number, RopeFlatNode[]>();
  for (const n of flat) {
    if (!byDepth.has(n.depth)) byDepth.set(n.depth, []);
    byDepth.get(n.depth)!.push(n);
  }

  // Position nodes: children are placed near their parent
  const positions = new Map<string, { x: number; y: number }>();
  const vGap = 60;
  const result: RopeLayoutNode[] = [];

  // Build parent-to-children map
  const childrenMap = new Map<string, RopeFlatNode[]>();
  for (const n of flat) {
    if (n.parentId) {
      if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
      childrenMap.get(n.parentId)!.push(n);
    }
  }

  // Recursive layout: position each node below its parent
  function layoutNode(node: RopeFlatNode, x: number, y: number, availWidth: number): void {
    positions.set(node.id, { x, y });
    result.push({ node, x, y });
    const children = childrenMap.get(node.id) || [];
    if (children.length === 0) return;
    const childWidth = availWidth / children.length;
    children.forEach((child, i) => {
      const childX = x - availWidth / 2 + childWidth * (i + 0.5);
      layoutNode(child, childX, y + vGap, childWidth);
    });
  }

  // Find root (parentId === null)
  const root = flat.find((n) => n.parentId === null);
  if (root) {
    layoutNode(root, width / 2, 30, width * 0.8);
  }

  return result;
}

const RopeCanvas = memo(function RopeCanvas({
  rope,
  stepIdx,
  steps,
}: {
  rope: RopeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const flat = useMemo(() => flattenRope(rope), [rope]);
  const fullStr = useMemo(() => ropeToString(rope), [rope]);

  if (!rope.root) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Rope is empty. Enter text to build a rope structure.</p>
      </div>
    );
  }

  const maxDepth = Math.max(0, ...flat.map((n) => n.depth));
  const svgWidth = 600;
  const laid = layoutRopeTree(flat, svgWidth);
  const svgHeight = (maxDepth + 1) * 60 + 50;

  // Build position lookup for edge drawing
  const posMap = new Map<string, RopeLayoutNode>();
  for (const ln of laid) posMap.set(ln.node.id, ln);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Rope (length={rope.totalLength})
      </h3>

      {/* SVG Tree layout with edge lines */}
      <svg role="img" aria-label={`Rope visualization showing ${flat.length} nodes`} width={svgWidth} height={svgHeight} className="max-w-full overflow-visible">
        {/* Edge lines from parent to child */}
        {laid.map((ln) => {
          if (!ln.node.parentId) return null;
          const parent = posMap.get(ln.node.parentId);
          if (!parent) return null;
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`edge-${ln.node.id}`}
              x1={parent.x}
              y1={parent.y + 16}
              x2={ln.x}
              y2={ln.y - 16}
              initial={false}
              animate={{ stroke: hl !== "default" ? color : "#4b556380", strokeWidth: hl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {/* Nodes */}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isLeaf = ln.node.isLeaf;
          const boxW = isLeaf ? Math.max(52, (ln.node.value?.length ?? 0) * 7 + 24) : 52;
          const boxH = 32;

          return (
            <motion.g key={ln.node.id}>
              <motion.rect
                x={ln.x - boxW / 2}
                y={ln.y - boxH / 2}
                width={boxW}
                height={boxH}
                rx={4}
                initial={false}
                animate={{
                  stroke: hl !== "default" ? color : isLeaf ? "#6366f180" : "#37415180",
                  fill: dsColorBg(hl, isLeaf ? "#6366f110" : "#11182780"),
                  strokeWidth: hl !== "default" ? 2 : 1,
                  strokeDasharray: isLeaf ? "4 2" : "0",
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              {isLeaf ? (
                <>
                  <text x={ln.x} y={ln.y - 2} textAnchor="middle" className="text-[10px] font-mono font-medium" fill={hl !== "default" ? color : "#c7d2fe"}>
                    &quot;{ln.node.value}&quot;
                  </text>
                  <text x={ln.x} y={ln.y + 10} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                    len={ln.node.weight}
                  </text>
                </>
              ) : (
                <>
                  <text x={ln.x} y={ln.y - 2} textAnchor="middle" className="text-[10px] font-mono font-bold" fill={hl !== "default" ? color : "#9ca3af"}>
                    w={ln.node.weight}
                  </text>
                  <text x={ln.x} y={ln.y + 10} textAnchor="middle" className="text-[10px]" fill="#9ca3af">
                    {ln.node.side}
                  </text>
                </>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Full string preview */}
      <div className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-3 py-2 max-w-md">
        <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Full String</div>
        <div className="font-mono text-xs text-foreground break-all">&quot;{fullStr}&quot;</div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Length</div>
          <div className="font-mono text-sm font-medium text-foreground">{rope.totalLength}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Nodes</div>
          <div className="font-mono text-sm font-medium text-blue-400">{flat.length}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Depth</div>
          <div className="font-mono text-sm font-medium text-amber-400">{maxDepth}</div>
        </div>
      </div>
    </div>
  );
});

const DLLCanvas = memo(function DLLCanvas({
  dll,
  stepIdx,
  steps,
}: {
  dll: DLLState;
  stepIdx: number;
  steps: DSStep[];
}) {
  // Walk from head to build ordered rendering
  const ordered = useMemo(() => {
    if (!dll.headId) return [];
    const result: DLLNode[] = [];
    const nodeMap = new Map(dll.nodes.map((n) => [n.id, n]));
    let current = nodeMap.get(dll.headId);
    const visited = new Set<string>();
    while (current && !visited.has(current.id)) {
      visited.add(current.id);
      result.push(current);
      current = current.next ? nodeMap.get(current.next) : undefined;
    }
    return result;
  }, [dll]);

  if (ordered.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Doubly linked list is empty. Type a value and click Insert Head or Insert Tail to add a node.</p>
      </div>
    );
  }

  return (
    <div role="img" aria-label={`Doubly Linked List visualization showing ${dll.size} elements`} className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Doubly Linked List (size {dll.size})
      </h3>
      <div className="flex items-center gap-0">
        <span className="mr-2 text-[10px] font-medium text-green-400">HEAD</span>
        {ordered.map((node, i) => {
          const hl = getHighlight(stepIdx, steps, node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;

          return (
            <React.Fragment key={node.id}>
              <motion.div
                className="flex h-12 items-center rounded border"
                initial={false}
                animate={{
                  borderColor: color,
                  backgroundColor: dsColorBg(hl),
                }}
                transition={{ duration: ANIM_DURATION }}
              >
                <div className="flex h-full w-6 items-center justify-center text-[10px] text-foreground-subtle">
                  {node.prev ? "\u2190" : "\u2205"}
                </div>
                <div className="flex h-full w-12 items-center justify-center border-x font-mono text-sm font-medium" style={{ borderColor: color, color }}>
                  {node.value}
                </div>
                <div className="flex h-full w-6 items-center justify-center text-[10px] text-foreground-subtle">
                  {node.next ? "\u2192" : "\u2205"}
                </div>
              </motion.div>
              {i < ordered.length - 1 && (
                <svg width="28" height="20" className="shrink-0">
                  {/* Forward arrow (top) */}
                  <line x1="0" y1="6" x2="20" y2="6" stroke={color} strokeWidth="1.5" />
                  <polygon points="20,3 26,6 20,9" fill={color} />
                  {/* Backward arrow (bottom) */}
                  <line x1="28" y1="14" x2="8" y2="14" stroke={color} strokeWidth="1.5" />
                  <polygon points="8,11 2,14 8,17" fill={color} />
                </svg>
              )}
            </React.Fragment>
          );
        })}
        <span className="ml-2 text-[10px] font-medium text-blue-400">TAIL</span>
      </div>
    </div>
  );
});

function layoutPQHeapTree(entries: PQEntry[], width: number): { nodes: { index: number; value: number; priority: number; x: number; y: number }[]; edges: { from: { x: number; y: number; index: number }; to: { x: number; y: number; index: number } }[] } {
  const nodes: { index: number; value: number; priority: number; x: number; y: number }[] = [];
  const edges: { from: { x: number; y: number; index: number }; to: { x: number; y: number; index: number } }[] = [];
  if (entries.length === 0) return { nodes, edges };

  const levels = Math.ceil(Math.log2(entries.length + 1));
  const ySpacing = 50;
  const yOffset = 30;

  for (let i = 0; i < entries.length; i++) {
    const level = Math.floor(Math.log2(i + 1));
    const posInLevel = i - (Math.pow(2, level) - 1);
    const levelCount = Math.min(Math.pow(2, level), entries.length - (Math.pow(2, level) - 1));
    const xSpacing = width / (levelCount + 1);
    const x = xSpacing * (posInLevel + 1);
    const y = yOffset + level * ySpacing;
    nodes.push({ index: i, value: entries[i].value, priority: entries[i].priority, x, y });
  }

  for (let i = 0; i < entries.length; i++) {
    const left = 2 * i + 1;
    const right = 2 * i + 2;
    if (left < entries.length) edges.push({ from: nodes[i], to: nodes[left] });
    if (right < entries.length) edges.push({ from: nodes[i], to: nodes[right] });
  }

  return { nodes, edges };
}

const PQCanvas = memo(function PQCanvas({
  pq,
  stepIdx,
  steps,
}: {
  pq: PriorityQueueState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const svgWidth = 400;
  const nodeRadius = 20;
  const { nodes: heapNodes, edges } = useMemo(() => layoutPQHeapTree(pq.entries, svgWidth), [pq.entries, svgWidth]);
  const svgHeight = useMemo(() => {
    if (heapNodes.length === 0) return 100;
    return Math.max(...heapNodes.map((n) => n.y)) + 50;
  }, [heapNodes]);

  if (pq.size === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Priority queue is empty. Enter a value and priority, then click Enqueue.</p>
      </div>
    );
  }

  // PQ view: sorted list by priority
  const sorted = useMemo(() =>
    [...pq.entries].sort((a, b) => pq.type === "min" ? a.priority - b.priority : b.priority - a.priority),
    [pq.entries, pq.type],
  );

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        {pq.type === "min" ? "Min" : "Max"}-Priority Queue (size {pq.size})
      </h3>

      <div className="flex gap-8 items-start">
        {/* PQ View: sorted list */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">PQ View</span>
          <div className="flex flex-col gap-0.5">
            {sorted.map((entry, i) => {
              const origIdx = pq.entries.indexOf(entry);
              const hl = getHighlight(stepIdx, steps, `pq-${origIdx}`);
              const color = DS_COLORS[hl] ?? DS_COLORS.default;
              return (
                <motion.div
                  key={`pq-sorted-${i}`}
                  className="flex items-center gap-2 rounded border px-2 py-1"
                  initial={false}
                  animate={{
                    borderColor: color,
                    backgroundColor: dsColorBg(hl),
                  }}
                  transition={{ duration: ANIM_DURATION }}
                >
                  <span className="font-mono text-xs font-medium" style={{ color }}>{entry.value}</span>
                  <span className="text-[10px] text-foreground-subtle">p:{entry.priority}</span>
                  {i === 0 && <span className="text-[10px] font-medium text-green-400">NEXT</span>}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Heap View: tree */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">Heap View</span>
          <svg role="img" aria-label={`Priority Queue visualization showing ${pq.size} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
            {edges.map((e) => {
              const childHl = getHighlight(stepIdx, steps, `pq-${e.to.index}`);
              const color = DS_COLORS[childHl] ?? DS_COLORS.default;
              return (
                <motion.line
                  key={`${e.from.index}-${e.to.index}`}
                  x1={e.from.x} y1={e.from.y}
                  x2={e.to.x} y2={e.to.y}
                  initial={false}
                  animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              );
            })}
            {heapNodes.map((n) => {
              const hl = getHighlight(stepIdx, steps, `pq-${n.index}`);
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
                    transition={{ duration: ANIM_DURATION }}
                  />
                  <text x={n.x} y={n.y - 2} textAnchor="middle" className="text-[10px] font-semibold" fill={color}>
                    {n.value}
                  </text>
                  <text x={n.x} y={n.y + 10} textAnchor="middle" className="text-[10px]" fill={DS_COLORS.visiting}>
                    p:{n.priority}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
});

const MonotonicStackCanvas = memo(function MonotonicStackCanvas({
  mono,
  stepIdx,
  steps,
}: {
  mono: MonotonicState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { data, type, mode } = mono;
  const label = `${type} monotonic ${mode}`;

  // Compute monotonic "sorted line" y-offsets for the gradient overlay.
  // We normalize values to a 0-1 range to draw a visual monotonic property line.
  const maxVal = data.length > 0 ? Math.max(...data) : 1;
  const minVal = data.length > 0 ? Math.min(...data) : 0;
  const range = maxVal - minVal || 1;

  return (
    <div role="img" aria-label={`Monotonic Stack visualization showing ${data.length} elements`} className="flex flex-col items-center gap-4">
      {/* Title */}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
          {label} (size {data.length})
        </h3>
        <span className="text-[10px] text-foreground-subtle">
          {type === "decreasing" ? "Top is largest -- solves 'next greater element'" : "Top is smallest -- solves 'next smaller element'"}
        </span>
      </div>

      {data.length === 0 ? (
        <p className="text-xs text-foreground-subtle italic">Empty -- push a value to begin</p>
      ) : (
        <div className="relative flex flex-col items-center gap-0">
          {/* Stack rendered top-to-bottom (last element = top) */}
          {[...data].reverse().map((val, revIdx) => {
            const origIdx = data.length - 1 - revIdx;
            const hl = getHighlight(stepIdx, steps, `mono-${origIdx}`);
            const color = DS_COLORS[hl] ?? DS_COLORS.default;
            const isTop = origIdx === data.length - 1;
            const isBottom = origIdx === 0;

            // Gradient intensity based on value position in the sorted range
            const normalizedVal = (val - minVal) / range;
            const gradientOpacity = type === "decreasing"
              ? normalizedVal * 0.15  // Larger values get stronger gradient (they're at top)
              : (1 - normalizedVal) * 0.15;

            return (
              <React.Fragment key={origIdx}>
                <div className="flex items-center gap-2">
                  {/* Monotonic property gradient bar */}
                  <div
                    className="h-8 w-2 rounded-sm"
                    style={{
                      backgroundColor: type === "decreasing"
                        ? `rgba(139, 92, 246, ${0.1 + gradientOpacity})`  // purple gradient
                        : `rgba(59, 130, 246, ${0.1 + gradientOpacity})`,   // blue gradient
                    }}
                  />
                  <motion.div
                    className={cn(
                      "flex h-8 w-20 items-center justify-center rounded border font-mono text-sm font-medium",
                      isTop && "ring-1 ring-primary/40",
                    )}
                    initial={false}
                    animate={{
                      borderColor: color,
                      backgroundColor: dsColorBg(hl),
                      color: color,
                    }}
                    transition={{ duration: ANIM_DURATION }}
                  >
                    {val}
                  </motion.div>
                  {/* Label */}
                  <span className="text-[10px] text-foreground-subtle w-10">
                    {isTop ? (mode === "stack" ? "TOP" : "BACK") : isBottom ? (mode === "stack" ? "BOT" : "FRONT") : ""}
                  </span>
                </div>
                {/* Arrow between elements showing order direction */}
                {revIdx < data.length - 1 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2" />
                    <svg width="80" height="12" className="shrink-0">
                      <line x1="40" y1="0" x2="40" y2="8" stroke="var(--ds-default)" strokeWidth="1" opacity="0.4" />
                    </svg>
                    <div className="w-10" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
          {/* Sorted line overlay description */}
          <div className="mt-2 flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: type === "decreasing"
                  ? "rgba(139, 92, 246, 0.3)"
                  : "rgba(59, 130, 246, 0.3)",
              }}
            />
            <span className="text-[10px] text-foreground-subtle">
              Gradient shows monotonic {type} property
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export { ArrayCanvas, LinkedListCanvas, DequeCanvas, CircularBufferCanvas, WALCanvas, RopeCanvas, DLLCanvas, PQCanvas, MonotonicStackCanvas };
