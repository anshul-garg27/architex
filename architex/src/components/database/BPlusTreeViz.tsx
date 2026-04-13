'use client';

/**
 * B+ Tree Interactive Visualization  (DBL-019)
 *
 * Uses the bplus-tree-ds data structure and renders the tree with a
 * custom layout engine. Supports insert/search/delete controls,
 * step-through animation, leaf linked-list visualization, and
 * range query highlighting.
 */

import React, {
  memo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Search,
  Trash2,
  ArrowRightLeft,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { duration, springs } from '@/lib/constants/motion';
import type {
  BPlusTreeState,
  BPlusNode,
  BPlusLeafNode,
  BPlusInternalNode,
} from '@/lib/data-structures/bplus-tree-ds';
import {
  createBPlusTree,
  bplusInsert,
  bplusSearch,
  bplusRangeQuery,
  bplusDelete,
  bplusLeafKeys,
} from '@/lib/data-structures/bplus-tree-ds';
import type { DSStep } from '@/lib/data-structures/types';

// ── Highlight colors ──────────────────────────────────────────

const HIGHLIGHT_COLORS: Record<string, string> = {
  default: '#6b7280',
  visiting: '#f59e0b',
  visited: '#22c55e',
  inserting: '#a855f7',
  deleting: '#ef4444',
  found: '#06b6d4',
  splitting: '#f97316',
  rebalancing: '#3b82f6',
  merging: '#ec4899',
};

// ── Layout types ──────────────────────────────────────────────

interface LayoutNode {
  id: string;
  kind: 'leaf' | 'internal';
  keys: number[];
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutEdge {
  parentId: string;
  childId: string;
  parentX: number;
  parentY: number;
  childX: number;
  childY: number;
}

interface LeafLink {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

interface BPlusLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  leafLinks: LeafLink[];
  width: number;
  height: number;
}

// ── Layout engine ─────────────────────────────────────────────

const KEY_CELL_W = 32;
const NODE_H = 32;
const NODE_PAD = 8;
const H_GAP = 16;
const V_GAP = 56;

function computeNodeWidth(keys: number[]): number {
  return Math.max(keys.length * KEY_CELL_W + NODE_PAD * 2, 48);
}

function layoutBPlusTree(state: BPlusTreeState): BPlusLayout {
  if (state.rootId === null) {
    return { nodes: [], edges: [], leafLinks: [], width: 0, height: 0 };
  }

  const layoutNodes: LayoutNode[] = [];
  const layoutEdges: LayoutEdge[] = [];
  const nodeMap = new Map<string, LayoutNode>();

  // Compute subtree widths bottom-up.
  function subtreeWidth(nodeId: string): number {
    const node = state.nodes[nodeId];
    const nw = computeNodeWidth(node.keys);
    if (node.kind === 'leaf') return nw;
    const internal = node as BPlusInternalNode;
    let total = 0;
    for (let i = 0; i < internal.childIds.length; i++) {
      if (i > 0) total += H_GAP;
      total += subtreeWidth(internal.childIds[i]);
    }
    return Math.max(nw, total);
  }

  // Place nodes.
  function place(nodeId: string, x: number, y: number, availWidth: number): void {
    const node = state.nodes[nodeId];
    const nw = computeNodeWidth(node.keys);
    const cx = x + availWidth / 2;
    const nx = cx - nw / 2;

    const ln: LayoutNode = {
      id: nodeId,
      kind: node.kind,
      keys: [...node.keys],
      x: nx,
      y,
      width: nw,
      height: NODE_H,
    };
    layoutNodes.push(ln);
    nodeMap.set(nodeId, ln);

    if (node.kind === 'internal') {
      const internal = node as BPlusInternalNode;
      const childWidths = internal.childIds.map((cid) => subtreeWidth(cid));
      const totalChildWidth = childWidths.reduce((s, w) => s + w, 0) + (childWidths.length - 1) * H_GAP;
      let childX = cx - totalChildWidth / 2;

      for (let i = 0; i < internal.childIds.length; i++) {
        place(internal.childIds[i], childX, y + NODE_H + V_GAP, childWidths[i]);
        childX += childWidths[i] + H_GAP;
      }
    }
  }

  const rootWidth = subtreeWidth(state.rootId);
  place(state.rootId, 0, 0, rootWidth);

  // Build edges.
  for (const [nodeId, node] of Object.entries(state.nodes)) {
    if (node.kind === 'internal') {
      const parent = nodeMap.get(nodeId);
      if (!parent) continue;
      for (const childId of (node as BPlusInternalNode).childIds) {
        const child = nodeMap.get(childId);
        if (!child) continue;
        layoutEdges.push({
          parentId: nodeId,
          childId,
          parentX: parent.x + parent.width / 2,
          parentY: parent.y + parent.height,
          childX: child.x + child.width / 2,
          childY: child.y,
        });
      }
    }
  }

  // Build leaf links.
  const leafLinks: LeafLink[] = [];
  for (const [nodeId, node] of Object.entries(state.nodes)) {
    if (node.kind === 'leaf') {
      const leaf = node as BPlusLeafNode;
      if (leaf.nextLeafId !== null) {
        const fromLn = nodeMap.get(nodeId);
        const toLn = nodeMap.get(leaf.nextLeafId);
        if (fromLn && toLn) {
          leafLinks.push({
            fromId: nodeId,
            toId: leaf.nextLeafId,
            fromX: fromLn.x + fromLn.width,
            fromY: fromLn.y + fromLn.height / 2,
            toX: toLn.x,
            toY: toLn.y + toLn.height / 2,
          });
        }
      }
    }
  }

  // Compute total dimensions.
  let minX = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ln of layoutNodes) {
    if (ln.x < minX) minX = ln.x;
    if (ln.x + ln.width > maxX) maxX = ln.x + ln.width;
    if (ln.y + ln.height > maxY) maxY = ln.y + ln.height;
  }

  // Normalize to start at 0.
  if (minX < 0) {
    const shift = -minX;
    for (const ln of layoutNodes) ln.x += shift;
    for (const le of layoutEdges) {
      le.parentX += shift;
      le.childX += shift;
    }
    for (const ll of leafLinks) {
      ll.fromX += shift;
      ll.toX += shift;
    }
    maxX += shift;
  }

  return {
    nodes: layoutNodes,
    edges: layoutEdges,
    leafLinks,
    width: maxX + 20,
    height: maxY + 20,
  };
}

// ── Step highlight helper ─────────────────────────────────────

function getHighlight(stepIdx: number, steps: DSStep[], targetId: string): string {
  if (stepIdx < 0 || stepIdx >= steps.length) return 'default';
  const s = steps[stepIdx];
  for (const m of s.mutations) {
    if (m.targetId === targetId && m.property === 'highlight') {
      return String(m.to);
    }
  }
  return 'default';
}

// ── Props ─────────────────────────────────────────────────────

export interface BPlusTreeVizProps {
  className?: string;
  /** Initial tree order (min children per node). Default 4. */
  initialOrder?: number;
  /** SVG canvas height. Default 400. */
  canvasHeight?: number;
}

// ── Component ─────────────────────────────────────────────────

export const BPlusTreeViz = memo(function BPlusTreeViz({
  className,
  initialOrder = 4,
  canvasHeight = 400,
}: BPlusTreeVizProps) {
  // ── State ───────────────────────────────────────────
  const [tree, setTree] = useState<BPlusTreeState>(() => createBPlusTree(initialOrder));
  const [steps, setSteps] = useState<DSStep[]>([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [inputValue, setInputValue] = useState('');
  const [rangeLow, setRangeLow] = useState('');
  const [rangeHigh, setRangeHigh] = useState('');
  const [lastOp, setLastOp] = useState<string | null>(null);
  const [rangeResult, setRangeResult] = useState<number[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Layout ──────────────────────────────────────────
  const layout = useMemo(() => layoutBPlusTree(tree), [tree]);

  // ── Leaf keys for info bar ──────────────────────────
  const leafKeys = useMemo(() => bplusLeafKeys(tree), [tree]);

  // ── Zoom / pan state ────────────────────────────────
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // ── Computed viewBox ────────────────────────────────
  const viewBox = useMemo(() => {
    if (layout.nodes.length === 0) return '0 0 600 400';
    const pad = 40;
    const w = (layout.width + pad * 2) / zoom;
    const h = (layout.height + pad * 2) / zoom;
    const cx = layout.width / 2 - w / 2 + panOffset.x;
    const cy = layout.height / 2 - h / 2 + panOffset.y;
    return `${cx - pad} ${cy - pad} ${w} ${h}`;
  }, [layout, zoom, panOffset]);

  // ── Auto-play ───────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    if (stepIdx >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setStepIdx((prev) => prev + 1);
    }, speed);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, stepIdx, steps.length, speed]);

  // ── Pan/zoom handlers ───────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.3, Math.min(3, prev - e.deltaY * 0.001)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging.current) return;
    const dx = (dragStart.current.x - e.clientX) * (1 / zoom);
    const dy = (dragStart.current.y - e.clientY) * (1 / zoom);
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, [zoom]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // ── Operation handlers ──────────────────────────────
  const handleInsert = useCallback(() => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;
    const result = bplusInsert(tree, val);
    setTree(result.snapshot as BPlusTreeState);
    setSteps(result.steps);
    setStepIdx(0);
    setIsPlaying(false);
    setLastOp(`Insert ${val}`);
    setRangeResult(null);
    setInputValue('');
  }, [inputValue, tree]);

  const handleSearch = useCallback(() => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;
    const result = bplusSearch(tree, val);
    setSteps(result.steps);
    setStepIdx(0);
    setIsPlaying(false);
    setLastOp(`Search ${val}`);
    setRangeResult(null);
    setInputValue('');
  }, [inputValue, tree]);

  const handleDelete = useCallback(() => {
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;
    const result = bplusDelete(tree, val);
    setTree(result.snapshot as BPlusTreeState);
    setSteps(result.steps);
    setStepIdx(0);
    setIsPlaying(false);
    setLastOp(`Delete ${val}`);
    setRangeResult(null);
    setInputValue('');
  }, [inputValue, tree]);

  const handleRangeQuery = useCallback(() => {
    const lo = parseInt(rangeLow, 10);
    const hi = parseInt(rangeHigh, 10);
    if (isNaN(lo) || isNaN(hi)) return;
    const result = bplusRangeQuery(tree, lo, hi);
    const snapshot = result.snapshot as { result: number[]; tree: BPlusTreeState };
    setSteps(result.steps);
    setStepIdx(0);
    setIsPlaying(false);
    setLastOp(`Range [${lo}, ${hi}]`);
    setRangeResult(snapshot.result);
    setRangeLow('');
    setRangeHigh('');
  }, [rangeLow, rangeHigh, tree]);

  const handleReset = useCallback(() => {
    setTree(createBPlusTree(initialOrder));
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
    setLastOp(null);
    setRangeResult(null);
  }, [initialOrder]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleInsert();
      }
    },
    [handleInsert],
  );

  // ── Is a leaf key in the range result? ──────────────
  const isInRange = useCallback(
    (key: number) => rangeResult !== null && rangeResult.includes(key),
    [rangeResult],
  );

  // ── Empty state ─────────────────────────────────────
  const isEmpty = layout.nodes.length === 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Insert/search/delete */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-foreground-muted uppercase">Value</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="key"
              className="h-8 w-20 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleInsert}
              className="flex h-8 items-center gap-1 rounded-md bg-purple-600/20 px-2 text-xs font-medium text-purple-400 hover:bg-purple-600/30 transition-colors"
              aria-label="Insert"
            >
              <Plus className="h-3.5 w-3.5" /> Insert
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="flex h-8 items-center gap-1 rounded-md bg-cyan-600/20 px-2 text-xs font-medium text-cyan-400 hover:bg-cyan-600/30 transition-colors"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" /> Search
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-8 items-center gap-1 rounded-md bg-red-600/20 px-2 text-xs font-medium text-red-400 hover:bg-red-600/30 transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Range query */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-foreground-muted uppercase">Range Query</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={rangeLow}
              onChange={(e) => setRangeLow(e.target.value)}
              placeholder="low"
              className="h-8 w-16 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <span className="text-xs text-foreground-muted">to</span>
            <input
              type="number"
              value={rangeHigh}
              onChange={(e) => setRangeHigh(e.target.value)}
              placeholder="high"
              className="h-8 w-16 rounded-md border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleRangeQuery}
              className="flex h-8 items-center gap-1 rounded-md bg-emerald-600/20 px-2 text-xs font-medium text-emerald-400 hover:bg-emerald-600/30 transition-colors"
              aria-label="Range query"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Range
            </button>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-foreground-muted uppercase">Playback</label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={steps.length === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground-muted hover:bg-elevated transition-colors disabled:opacity-40"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((prev) => Math.min(prev + 1, steps.length - 1))}
              disabled={steps.length === 0 || stepIdx >= steps.length - 1}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground-muted hover:bg-elevated transition-colors disabled:opacity-40"
              aria-label="Next step"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="h-8 rounded-md border border-border bg-background px-1.5 text-xs text-foreground outline-none"
              aria-label="Playback speed"
            >
              <option value={250}>Fast</option>
              <option value={500}>Normal</option>
              <option value={1000}>Slow</option>
            </select>
            <button
              type="button"
              onClick={handleReset}
              className="flex h-8 items-center gap-1 rounded-md border border-border bg-background px-2 text-xs text-foreground-muted hover:bg-elevated transition-colors"
              aria-label="Reset tree"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Step description ── */}
      {steps.length > 0 && stepIdx >= 0 && stepIdx < steps.length && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-elevated px-3 py-1.5">
          <span className="text-[10px] font-mono text-foreground-subtle">
            Step {stepIdx + 1}/{steps.length}
          </span>
          <span className="text-xs text-foreground">
            {steps[stepIdx].description}
          </span>
        </div>
      )}

      {/* ── Canvas ── */}
      <div
        className="relative overflow-hidden rounded-lg border border-border bg-elevated"
        style={{ height: canvasHeight }}
      >
        {isEmpty ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-foreground-muted">
              B+ Tree is empty -- insert keys to begin
            </p>
          </div>
        ) : (
          <svg
            viewBox={viewBox}
            className="h-full w-full cursor-grab active:cursor-grabbing"
            preserveAspectRatio="xMidYMid meet"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* ── Parent-child edges ── */}
            {layout.edges.map((edge) => {
              const hl = getHighlight(stepIdx, steps, edge.childId);
              const color = hl !== 'default'
                ? (HIGHLIGHT_COLORS[hl] ?? HIGHLIGHT_COLORS.default)
                : '#374151';
              return (
                <motion.line
                  key={`${edge.parentId}-${edge.childId}`}
                  x1={edge.parentX}
                  y1={edge.parentY}
                  x2={edge.childX}
                  y2={edge.childY}
                  initial={false}
                  animate={{
                    stroke: color,
                    strokeWidth: hl !== 'default' ? 2.5 : 1.5,
                  }}
                  transition={springs.snappy}
                />
              );
            })}

            {/* ── Leaf linked-list arrows ── */}
            {layout.leafLinks.map((link) => (
              <g key={`ll-${link.fromId}-${link.toId}`}>
                <motion.path
                  d={`M ${link.fromX} ${link.fromY} C ${link.fromX + 12} ${link.fromY + 18}, ${link.toX - 12} ${link.toY + 18}, ${link.toX} ${link.toY}`}
                  fill="none"
                  initial={false}
                  animate={{ stroke: '#10b981', strokeWidth: 1.5 }}
                  strokeDasharray="4 3"
                  markerEnd="url(#leaf-arrow)"
                />
              </g>
            ))}

            {/* Leaf arrow marker */}
            <defs>
              <marker
                id="leaf-arrow"
                viewBox="0 0 10 8"
                refX="8"
                refY="4"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 4 L 0 8 Z" fill="#10b981" />
              </marker>
            </defs>

            {/* ── Nodes ── */}
            {layout.nodes.map((ln) => {
              const hl = getHighlight(stepIdx, steps, ln.id);
              const isHighlighted = hl !== 'default';
              const hlColor = HIGHLIGHT_COLORS[hl] ?? HIGHLIGHT_COLORS.default;
              const isLeaf = ln.kind === 'leaf';

              return (
                <motion.g
                  key={ln.id}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: duration.moderate }}
                >
                  {/* Highlight glow */}
                  {isHighlighted && (
                    <motion.rect
                      x={ln.x - 3}
                      y={ln.y - 3}
                      width={ln.width + 6}
                      height={ln.height + 6}
                      rx={6}
                      fill="none"
                      initial={false}
                      animate={{ stroke: hlColor, strokeWidth: 2, opacity: 0.4 }}
                      transition={{ duration: duration.moderate }}
                    />
                  )}

                  {/* Node background */}
                  <motion.rect
                    x={ln.x}
                    y={ln.y}
                    width={ln.width}
                    height={ln.height}
                    rx={4}
                    initial={false}
                    animate={{
                      fill: isHighlighted ? hlColor + '20' : '#1f2937',
                      stroke: isHighlighted ? hlColor : isLeaf ? '#10b981' : '#6366f1',
                      strokeWidth: isHighlighted ? 2.5 : 1.5,
                    }}
                    transition={springs.snappy}
                  />

                  {/* Key cells */}
                  {ln.keys.map((key, ki) => {
                    const cellX = ln.x + NODE_PAD + ki * KEY_CELL_W;
                    const cellCenterX = cellX + KEY_CELL_W / 2;
                    const inRange = isInRange(key);
                    return (
                      <g key={`${ln.id}-k-${ki}`}>
                        {/* Cell separator */}
                        {ki > 0 && (
                          <line
                            x1={cellX}
                            y1={ln.y + 4}
                            x2={cellX}
                            y2={ln.y + ln.height - 4}
                            stroke={isHighlighted ? hlColor + '60' : '#374151'}
                            strokeWidth={1}
                          />
                        )}
                        {/* Range highlight */}
                        {inRange && (
                          <rect
                            x={cellX}
                            y={ln.y + 2}
                            width={KEY_CELL_W}
                            height={ln.height - 4}
                            rx={2}
                            fill="#06b6d430"
                          />
                        )}
                        {/* Key text */}
                        <text
                          x={cellCenterX}
                          y={ln.y + ln.height / 2 + 1}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={11}
                          fontWeight={600}
                          fill={inRange ? '#06b6d4' : isHighlighted ? hlColor : '#e5e7eb'}
                          className="select-none"
                        >
                          {key}
                        </text>
                      </g>
                    );
                  })}

                  {/* Node type indicator */}
                  <text
                    x={ln.x + ln.width + 4}
                    y={ln.y + 8}
                    fontSize={8}
                    fill={isLeaf ? '#10b981' : '#6366f1'}
                    className="select-none"
                    opacity={0.6}
                  >
                    {isLeaf ? 'L' : 'I'}
                  </text>
                </motion.g>
              );
            })}
          </svg>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
            className="h-6 w-6 rounded border border-border bg-background/80 text-xs text-foreground-muted hover:bg-elevated transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}
            className="h-6 w-6 rounded border border-border bg-background/80 text-xs text-foreground-muted hover:bg-elevated transition-colors"
            aria-label="Zoom out"
          >
            -
          </button>
          <button
            type="button"
            onClick={resetView}
            className="h-6 rounded border border-border bg-background/80 px-1.5 text-[10px] text-foreground-muted hover:bg-elevated transition-colors"
            aria-label="Reset view"
          >
            Reset
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-2">
          {(
            ['visiting', 'inserting', 'deleting', 'splitting', 'found', 'rebalancing'] as const
          ).map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: HIGHLIGHT_COLORS[s] }}
              />
              <span className="text-[8px] text-foreground-subtle">{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Info bar ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-muted">
        <span>
          <strong className="text-foreground">Order:</strong> {tree.order}
        </span>
        <span>
          <strong className="text-foreground">Size:</strong> {tree.size}
        </span>
        {lastOp && (
          <span>
            <strong className="text-foreground">Last Op:</strong> {lastOp}
          </span>
        )}
        {rangeResult !== null && (
          <span>
            <strong className="text-cyan-400">Range Result:</strong>{' '}
            [{rangeResult.join(', ')}]
          </span>
        )}
        {leafKeys.length > 0 && (
          <span className="truncate max-w-xs">
            <strong className="text-emerald-400">Leaf Chain:</strong>{' '}
            {leafKeys.join(' -> ')}
          </span>
        )}
      </div>
    </div>
  );
});
