"use client";

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { DS_COLORS, dsColorBg, ANIM_DURATION, DS_TRANSITION, DEMO_LABELS, EmptyStateWithDemo, getHighlight } from "../constants";
import type { DSStep } from "@/lib/data-structures";
import type {
  BSTNode,
  AVLNode,
  RBNode,
  TrieState,
  TrieFlatNode,
  MerkleState,
  MerkleNode as MerkleNodeType,
  SegmentTreeState,
  BPlusTreeState,
  FenwickTreeState,
  SplayNode,
  SplayTreeState,
  TreapNode,
  TreapState,
  BTreeState,
} from "@/lib/data-structures";
import { flattenTrie, bplusLeafKeys } from "@/lib/data-structures";

// ── DST-119: Tree health metrics ─────────────────────────────
// Computes height, avg depth, optimal height, and balance ratio
// for any BST-shaped tree (BST, AVL, RB, Splay, Treap).

interface TreeLike {
  left: TreeLike | null;
  right: TreeLike | null;
}

function treeDepth(node: TreeLike | null): number {
  if (!node) return 0;
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right));
}

function countNodes(node: TreeLike | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function sumDepths(node: TreeLike | null, depth: number): number {
  if (!node) return 0;
  return depth + sumDepths(node.left, depth + 1) + sumDepths(node.right, depth + 1);
}

function treeStats(root: TreeLike | null): { height: number; avgDepth: string; optimal: number; ratio: string } {
  if (!root) return { height: 0, avgDepth: '0', optimal: 0, ratio: '-' };
  const h = treeDepth(root);
  const size = countNodes(root);
  const opt = Math.ceil(Math.log2(size + 1));
  return {
    height: h,
    avgDepth: (sumDepths(root, 0) / size).toFixed(1),
    optimal: opt,
    ratio: opt > 0 ? (h / opt).toFixed(2) : '-',
  };
}

function TreeStatsBar({ root }: { root: TreeLike | null }) {
  const stats = useMemo(() => treeStats(root), [root]);
  if (!root) return null;
  return (
    <div className="flex gap-4 text-[10px] text-foreground-muted">
      <span>Height: {stats.height}</span>
      <span>Avg Depth: {stats.avgDepth}</span>
      <span>Optimal: {stats.optimal}</span>
      <span>Balance: {stats.ratio}x</span>
    </div>
  );
}

// ── DST-068: Node inspect popover ───────────────────────────

interface InspectedNode {
  id: string;
  x: number;
  y: number;
  data: Record<string, string>;
}

function NodeInspectPopover({
  node,
  onClose,
  svgRef,
}: {
  node: InspectedNode;
  onClose: () => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Dismiss on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Dismiss on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Convert SVG coordinates to container-relative pixel coordinates
  const pos = useMemo(() => {
    const svg = svgRef.current;
    if (!svg) return { left: node.x, top: node.y - 60 };
    const pt = svg.createSVGPoint();
    pt.x = node.x;
    pt.y = node.y;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { left: node.x, top: node.y - 60 };
    const screenPt = pt.matrixTransform(ctm);
    const svgRect = svg.getBoundingClientRect();
    return {
      left: screenPt.x - svgRect.left,
      top: screenPt.y - svgRect.top - 60,
    };
  }, [node.x, node.y, svgRef]);

  return (
    <div
      ref={popoverRef}
      style={{ position: "absolute", left: pos.left, top: pos.top, transform: "translateX(-50%)" }}
      className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm px-2.5 py-1.5 shadow-lg text-xs z-50 min-w-[120px]"
    >
      {Object.entries(node.data).map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-3 py-0.5">
          <span className="text-foreground-muted">{k}</span>
          <span className="font-mono text-foreground">{v}</span>
        </div>
      ))}
      <button
        onClick={onClose}
        className="mt-1 text-[9px] text-foreground-subtle hover:text-foreground transition-colors w-full text-center"
      >
        Close
      </button>
    </div>
  );
}

// ── Generic in-order layout engine (no overlap) ──────────────
// Uses in-order traversal: each leaf gets the next sequential index.
// This guarantees zero overlap regardless of tree depth.

interface TreeNodeLike {
  left: TreeNodeLike | null;
  right: TreeNodeLike | null;
}

function inorderLayout<T extends TreeNodeLike>(
  root: T | null,
  hGap = 50,
  vGap = 60,
  topPad = 30,
): { node: T; x: number; y: number }[] {
  if (!root) return [];
  const result: { node: T; x: number; y: number }[] = [];
  let index = 0;

  function walk(node: T | null, depth: number): void {
    if (!node) return;
    walk(node.left as T | null, depth + 1);
    result.push({ node, x: index * hGap, y: depth * vGap + topPad });
    index++;
    walk(node.right as T | null, depth + 1);
  }

  walk(root, 0);

  // Center so the minimum x is 0
  let minX = Infinity;
  for (const r of result) if (r.x < minX) minX = r.x;
  if (minX !== 0) for (const r of result) r.x -= minX;

  return result;
}

interface BSTLayoutNode {
  node: BSTNode;
  x: number;
  y: number;
}

function layoutBST(root: BSTNode | null, _width: number, _height: number): BSTLayoutNode[] {
  return inorderLayout(root);
}

interface BSTEdge {
  parent: BSTLayoutNode;
  child: BSTLayoutNode;
}

function collectEdges(layout: BSTLayoutNode[]): BSTEdge[] {
  const edges: BSTEdge[] = [];
  const nodeMap = new Map(layout.map((ln) => [ln.node.id, ln]));

  for (const ln of layout) {
    if (ln.node.left) {
      const childLn = nodeMap.get(ln.node.left.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
    if (ln.node.right) {
      const childLn = nodeMap.get(ln.node.right.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
  }
  return edges;
}

const BSTCanvas = memo(function BSTCanvas({
  root,
  stepIdx,
  steps,
  onDemo,
}: {
  root: BSTNode | null;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  const svgWidth = 600;
  const svgHeight = 400;
  const nodeRadius = 20;
  const svgRef = useRef<SVGSVGElement>(null);
  const [inspectedNode, setInspectedNode] = useState<InspectedNode | null>(null);
  const handleClose = useCallback(() => setInspectedNode(null), []);

  // Compute depth map for BST nodes
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    function walk(node: BSTNode | null, depth: number) {
      if (!node) return;
      map.set(node.id, depth);
      walk(node.left, depth + 1);
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return map;
  }, [root]);

  const laid = useMemo(() => layoutBST(root, svgWidth, svgHeight), [root]);
  const edges = useMemo(() => collectEdges(laid), [laid]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} ${svgHeight}`;
    const pad = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  // Clear inspected node when the tree changes
  useEffect(() => { setInspectedNode(null); }, [root]);

  if (!root) {
    return (
      <EmptyStateWithDemo
        message="BST is empty. Type a number (e.g., 42) and click Insert to build your tree."
        demoLabel={DEMO_LABELS.bst}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Binary Search Tree
      </h3>
      <svg ref={svgRef} role="img" aria-label={`BST visualization showing ${laid.length} elements`} viewBox={viewBox} className="w-full max-w-2xl" style={{ height: 360 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ds-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--ds-default)" floodOpacity="0.3"/>
          </filter>
          <filter id="ds-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {edges.map((e) => {
          const childHl = getHighlight(stepIdx, steps, e.child.node.id);
          const color = DS_COLORS[childHl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.node.id}-${e.child.node.id}`}
              x1={e.parent.x}
              y1={e.parent.y}
              x2={e.child.x}
              y2={e.child.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
              transition={DS_TRANSITION}
            />
          );
        })}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.g
              key={ln.node.id}
              initial={false}
              animate={{ opacity: 1 }}
              transition={DS_TRANSITION}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setInspectedNode({
                  id: ln.node.id,
                  x: ln.x,
                  y: ln.y,
                  data: {
                    Value: String(ln.node.value),
                    Left: ln.node.left ? String(ln.node.left.value) : "null",
                    Right: ln.node.right ? String(ln.node.right.value) : "null",
                    Depth: String(depthMap.get(ln.node.id) ?? "-"),
                  },
                })
              }
            >
              {hl !== "default" && (
                <motion.circle
                  cx={ln.x}
                  cy={ln.y}
                  r={nodeRadius + 4}
                  fill="none"
                  initial={false}
                  animate={{ stroke: color, strokeWidth: 2, opacity: 0.4 }}
                  transition={DS_TRANSITION}
                />
              )}
              <motion.circle
                cx={ln.x}
                cy={ln.y}
                r={nodeRadius}
                filter={hl !== 'default' ? 'url(#ds-node-glow)' : 'url(#ds-node-shadow)'}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: color,
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={DS_TRANSITION}
              />
              <text
                x={ln.x}
                y={ln.y + 5}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill={color}
              >
                {ln.node.value}
              </text>
            </motion.g>
          );
        })}
      </svg>
      {inspectedNode && (
        <NodeInspectPopover node={inspectedNode} onClose={handleClose} svgRef={svgRef} />
      )}
      <TreeStatsBar root={root} />
    </div>
  );
});

// ── Canvas: AVL Tree Visualization ──────────────────────────


interface AVLLayoutNode {
  node: AVLNode;
  x: number;
  y: number;
}

function layoutAVL(root: AVLNode | null, _width: number, _height: number): AVLLayoutNode[] {
  return inorderLayout(root);
}

function collectAVLEdges(layout: AVLLayoutNode[]): { parent: AVLLayoutNode; child: AVLLayoutNode }[] {
  const edges: { parent: AVLLayoutNode; child: AVLLayoutNode }[] = [];
  const nodeMap = new Map(layout.map((ln) => [ln.node.id, ln]));

  for (const ln of layout) {
    if (ln.node.left) {
      const childLn = nodeMap.get(ln.node.left.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
    if (ln.node.right) {
      const childLn = nodeMap.get(ln.node.right.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
  }
  return edges;
}

function avlBalanceFactor(node: AVLNode): number {
  const lh = node.left ? node.left.height : 0;
  const rh = node.right ? node.right.height : 0;
  return lh - rh;
}

const AVLCanvas = memo(function AVLCanvas({
  root,
  stepIdx,
  steps,
  onDemo,
}: {
  root: AVLNode | null;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  const svgWidth = 600;
  const svgHeight = 400;
  const nodeRadius = 20;
  const svgRef = useRef<SVGSVGElement>(null);
  const [inspectedNode, setInspectedNode] = useState<InspectedNode | null>(null);
  const handleClose = useCallback(() => setInspectedNode(null), []);

  // Compute depth map for AVL nodes
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    function walk(node: AVLNode | null, depth: number) {
      if (!node) return;
      map.set(node.id, depth);
      walk(node.left, depth + 1);
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return map;
  }, [root]);

  const laid = useMemo(() => layoutAVL(root, svgWidth, svgHeight), [root]);
  const edges = useMemo(() => collectAVLEdges(laid), [laid]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} ${svgHeight}`;
    const pad = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  // Clear inspected node when the tree changes
  useEffect(() => { setInspectedNode(null); }, [root]);

  if (!root) {
    return (
      <EmptyStateWithDemo
        message="AVL Tree is empty. Type a number (e.g., 42) and click Insert to see rotations."
        demoLabel={DEMO_LABELS["avl-tree"]}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        AVL Tree
      </h3>
      <svg ref={svgRef} role="img" aria-label={`AVL Tree visualization showing ${laid.length} elements`} viewBox={viewBox} className="w-full max-w-2xl" style={{ height: 360 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ds-avl-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--ds-default)" floodOpacity="0.3"/>
          </filter>
          <filter id="ds-avl-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {edges.map((e) => {
          const childHl = getHighlight(stepIdx, steps, e.child.node.id);
          const color = DS_COLORS[childHl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.node.id}-${e.child.node.id}`}
              x1={e.parent.x}
              y1={e.parent.y}
              x2={e.child.x}
              y2={e.child.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const bf = avlBalanceFactor(ln.node);
          return (
            <motion.g
              key={ln.node.id}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: ANIM_DURATION }}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setInspectedNode({
                  id: ln.node.id,
                  x: ln.x,
                  y: ln.y,
                  data: {
                    Value: String(ln.node.value),
                    Left: ln.node.left ? String(ln.node.left.value) : "null",
                    Right: ln.node.right ? String(ln.node.right.value) : "null",
                    Height: String(ln.node.height),
                    "Balance Factor": String(bf),
                    Depth: String(depthMap.get(ln.node.id) ?? "-"),
                  },
                })
              }
            >
              {hl !== "default" && (
                <motion.circle
                  cx={ln.x}
                  cy={ln.y}
                  r={nodeRadius + 4}
                  fill="none"
                  initial={false}
                  animate={{ stroke: color, strokeWidth: 2, opacity: 0.4 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              )}
              <motion.circle
                cx={ln.x}
                cy={ln.y}
                r={nodeRadius}
                filter={hl !== 'default' ? 'url(#ds-avl-node-glow)' : 'url(#ds-avl-node-shadow)'}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: color,
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text
                x={ln.x}
                y={ln.y + 1}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill={color}
              >
                {ln.node.value}
              </text>
              {/* Balance factor indicator */}
              <text
                x={ln.x}
                y={ln.y - nodeRadius - 4}
                textAnchor="middle"
                className="text-[10px] font-medium"
                fill={Math.abs(bf) > 1 ? "var(--ds-deleting)" : "var(--ds-default)"}
              >
                bf={bf}
              </text>
            </motion.g>
          );
        })}
      </svg>
      {inspectedNode && (
        <NodeInspectPopover node={inspectedNode} onClose={handleClose} svgRef={svgRef} />
      )}
      <TreeStatsBar root={root} />
    </div>
  );
});

// ── Canvas: Red-Black Tree Visualization ────────────────────


interface RBLayoutNode {
  node: RBNode;
  x: number;
  y: number;
}

function layoutRB(root: RBNode | null, _width: number, _height: number): RBLayoutNode[] {
  return inorderLayout(root);
}

function collectRBEdges(layout: RBLayoutNode[]): { parent: RBLayoutNode; child: RBLayoutNode }[] {
  const edges: { parent: RBLayoutNode; child: RBLayoutNode }[] = [];
  const nodeMap = new Map(layout.map((ln) => [ln.node.id, ln]));

  for (const ln of layout) {
    if (ln.node.left) {
      const childLn = nodeMap.get(ln.node.left.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
    if (ln.node.right) {
      const childLn = nodeMap.get(ln.node.right.id);
      if (childLn) edges.push({ parent: ln, child: childLn });
    }
  }
  return edges;
}

const RB_NODE_COLORS = {
  red: { fill: "var(--ds-rb-red-fill)", stroke: "var(--ds-rb-red-stroke)", text: "var(--ds-rb-red-text)" },
  black: { fill: "var(--ds-rb-black-fill)", stroke: "var(--ds-rb-black-stroke)", text: "var(--ds-rb-black-text)" },
};

const RBTreeCanvas = memo(function RBTreeCanvas({
  root,
  stepIdx,
  steps,
  onDemo,
}: {
  root: RBNode | null;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  const svgWidth = 600;
  const svgHeight = 400;
  const nodeRadius = 20;
  const svgRef = useRef<SVGSVGElement>(null);
  const [inspectedNode, setInspectedNode] = useState<InspectedNode | null>(null);
  const handleClose = useCallback(() => setInspectedNode(null), []);

  // Compute depth map for RB nodes
  const depthMap = useMemo(() => {
    const map = new Map<string, number>();
    function walk(node: RBNode | null, depth: number) {
      if (!node) return;
      map.set(node.id, depth);
      walk(node.left, depth + 1);
      walk(node.right, depth + 1);
    }
    walk(root, 0);
    return map;
  }, [root]);

  const laid = useMemo(() => layoutRB(root, svgWidth, svgHeight), [root]);
  const edges = useMemo(() => collectRBEdges(laid), [laid]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} ${svgHeight}`;
    const pad = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  // Clear inspected node when the tree changes
  useEffect(() => { setInspectedNode(null); }, [root]);

  if (!root) {
    return (
      <EmptyStateWithDemo
        message="Red-Black Tree is empty. Type a number and click Insert to see color balancing."
        demoLabel={DEMO_LABELS["red-black-tree"]}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div className="relative flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Red-Black Tree
      </h3>
      <div className="flex gap-4 text-[10px] text-foreground-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-600" /> Red
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-gray-800 border border-gray-400" /> Black
        </span>
      </div>
      <svg ref={svgRef} role="img" aria-label={`Red-Black Tree visualization showing ${laid.length} elements`} viewBox={viewBox} className="w-full max-w-2xl" style={{ height: 360 }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <filter id="ds-rb-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="var(--ds-default)" floodOpacity="0.3"/>
          </filter>
          <filter id="ds-rb-node-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        {edges.map((e) => {
          const hl = getHighlight(stepIdx, steps, e.child.node.id);
          const hlColor = hl !== "default" ? (DS_COLORS[hl] ?? DS_COLORS.default) : DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.node.id}-${e.child.node.id}`}
              x1={e.parent.x}
              y1={e.parent.y}
              x2={e.child.x}
              y2={e.child.y}
              initial={false}
              animate={{ stroke: hlColor, strokeWidth: hl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const isHighlighted = hl !== "default";
          const rbColors = RB_NODE_COLORS[ln.node.color];
          const hlColor = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.g
              key={ln.node.id}
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ duration: ANIM_DURATION }}
              style={{ cursor: "pointer" }}
              onClick={() =>
                setInspectedNode({
                  id: ln.node.id,
                  x: ln.x,
                  y: ln.y,
                  data: {
                    Value: String(ln.node.value),
                    Color: ln.node.color === "red" ? "Red" : "Black",
                    Left: ln.node.left ? String(ln.node.left.value) : "null",
                    Right: ln.node.right ? String(ln.node.right.value) : "null",
                    Parent: ln.node.parent ? String(ln.node.parent.value) : "null",
                    Depth: String(depthMap.get(ln.node.id) ?? "-"),
                  },
                })
              }
            >
              {isHighlighted && (
                <motion.circle
                  cx={ln.x}
                  cy={ln.y}
                  r={nodeRadius + 4}
                  fill="none"
                  initial={false}
                  animate={{ stroke: hlColor, strokeWidth: 2, opacity: 0.5 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              )}
              <motion.circle
                cx={ln.x}
                cy={ln.y}
                r={nodeRadius}
                filter={isHighlighted ? 'url(#ds-rb-node-glow)' : 'url(#ds-rb-node-shadow)'}
                initial={false}
                animate={{
                  fill: isHighlighted ? hlColor + "30" : rbColors.fill,
                  stroke: isHighlighted ? hlColor : rbColors.stroke,
                  strokeWidth: isHighlighted ? 2.5 : 2,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text
                x={ln.x}
                y={ln.y + 5}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill={isHighlighted ? hlColor : rbColors.text}
              >
                {ln.node.value}
              </text>
              {/* Color label below node */}
              <text
                x={ln.x}
                y={ln.y + nodeRadius + 12}
                textAnchor="middle"
                className="text-[10px] font-medium"
                fill={ln.node.color === "red" ? "#dc2626" : "#9ca3af"}
              >
                {ln.node.color === "red" ? "R" : "B"}
              </text>
            </motion.g>
          );
        })}
      </svg>
      {inspectedNode && (
        <NodeInspectPopover node={inspectedNode} onClose={handleClose} svgRef={svgRef} />
      )}
      <TreeStatsBar root={root} />
    </div>
  );
});

// ── Canvas: Bloom Filter Visualization ─────────────────────


interface TrieLayoutNode {
  node: TrieFlatNode;
  x: number;
  y: number;
}

function layoutTrie(flat: TrieFlatNode[], width: number): TrieLayoutNode[] {
  if (flat.length === 0) return [];

  const vGap = 60;
  const result: TrieLayoutNode[] = [];

  // Build parent-to-children map from the flat list
  const childrenMap = new Map<string, TrieFlatNode[]>();
  let rootNode: TrieFlatNode | null = null;
  for (const f of flat) {
    if (f.parentId === null) {
      rootNode = f;
    } else {
      if (!childrenMap.has(f.parentId)) childrenMap.set(f.parentId, []);
      childrenMap.get(f.parentId)!.push(f);
    }
  }

  if (!rootNode) return result;

  // Recursive layout: position children below and centered around parent
  function layoutNode(node: TrieFlatNode, x: number, y: number, availWidth: number): void {
    result.push({ node, x, y: 30 + node.depth * vGap });
    const children = childrenMap.get(node.node.id) || [];
    if (children.length === 0) return;
    const childWidth = availWidth / children.length;
    const minChildSpacing = 40;
    const effectiveChildWidth = Math.max(childWidth, minChildSpacing);
    const totalChildrenWidth = effectiveChildWidth * children.length;
    const startX = x - totalChildrenWidth / 2 + effectiveChildWidth / 2;
    children.forEach((child, i) => {
      layoutNode(child, startX + i * effectiveChildWidth, y + vGap, effectiveChildWidth);
    });
  }

  layoutNode(rootNode, width / 2, 30, width * 0.85);
  return result;
}

const TrieCanvas = memo(function TrieCanvas({
  trie,
  stepIdx,
  steps,
  onDemo,
}: {
  trie: TrieState;
  stepIdx: number;
  steps: DSStep[];
  onDemo?: () => void;
}) {
  const flat = useMemo(() => flattenTrie(trie.root), [trie]);
  const svgWidth = 600;
  const laid = useMemo(() => layoutTrie(flat, svgWidth), [flat]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, TrieLayoutNode>();
    for (const ln of laid) m.set(ln.node.node.id, ln);
    return m;
  }, [laid]);

  const svgHeight = useMemo(() => {
    if (laid.length === 0) return 100;
    return Math.max(...laid.map((n) => n.y)) + 50;
  }, [laid]);

  const nodeRadius = 16;

  if (trie.size === 0) {
    return (
      <EmptyStateWithDemo
        message={'Trie is empty. Insert words like "cat", "car", "card" to see prefix sharing.'}
        demoLabel={DEMO_LABELS.trie}
        onDemo={onDemo}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Trie ({trie.size} word{trie.size !== 1 ? "s" : ""})
      </h3>
      <svg role="img" aria-label={`Trie visualization showing ${trie.size} words`} width={svgWidth} height={svgHeight} className="max-w-full">
        {/* Edges */}
        {laid.map((ln) => {
          if (!ln.node.parentId) return null;
          const parentLayout = nodeMap.get(ln.node.parentId);
          if (!parentLayout) return null;
          const hl = getHighlight(stepIdx, steps, ln.node.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;

          // Edge label position
          const mx = (parentLayout.x + ln.x) / 2;
          const my = (parentLayout.y + ln.y) / 2;

          return (
            <React.Fragment key={`edge-${ln.node.node.id}`}>
              <motion.line
                x1={parentLayout.x} y1={parentLayout.y}
                x2={ln.x} y2={ln.y}
                initial={false}
                animate={{ stroke: color, strokeWidth: hl !== "default" ? 2 : 1.5 }}
                transition={{ duration: ANIM_DURATION }}
              />
              {/* Character label on edge */}
              <rect x={mx - 6} y={my - 7} width={12} height={14} rx={2} fill="#111827" />
              <text x={mx} y={my + 4} textAnchor="middle" className="text-[10px] font-bold" fill="#f59e0b">
                {ln.node.edgeChar}
              </text>
            </React.Fragment>
          );
        })}
        {/* Nodes */}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isEnd = ln.node.node.isEndOfWord;
          const isRoot = ln.node.depth === 0;

          return (
            <motion.g key={ln.node.node.id}>
              {/* End-of-word marker ring */}
              {isEnd && (
                <motion.circle
                  cx={ln.x} cy={ln.y} r={nodeRadius + 4}
                  fill="none"
                  initial={false}
                  animate={{ stroke: "#22c55e", strokeWidth: 2, opacity: 0.6 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              )}
              <motion.circle
                cx={ln.x} cy={ln.y} r={nodeRadius}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, isEnd ? "#22c55e10" : "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : isEnd ? "#22c55e" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={ln.x} y={ln.y + 4} textAnchor="middle" className="text-[10px] font-semibold" fill={hl !== "default" ? color : isEnd ? "#22c55e" : "#9ca3af"}>
                {isRoot ? "\u25CB" : ln.node.node.char}
              </text>
            </motion.g>
          );
        })}
      </svg>
      {/* Word list */}
      {trie.words.length > 0 && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Words</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {trie.words.map((w, i) => (
              <span key={`trie-word-${i}-${w}`} className="rounded-xl bg-elevated/50 border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                {w}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Canvas: Union-Find Visualization ────────────────────────


interface MerkleLayoutNode {
  node: MerkleNodeType;
  x: number;
  y: number;
  parentId?: string;
  isLeaf: boolean;
}

function layoutMerkleTree(root: MerkleNodeType | null, _width: number): MerkleLayoutNode[] {
  if (!root) return [];
  const result: MerkleLayoutNode[] = [];
  const hGap = 50;
  const vGap = 70;
  let index = 0;

  function walk(node: MerkleNodeType, depth: number, parentId?: string): void {
    if (node.kind === 'internal') walk(node.left, depth + 1, node.id);
    const isLeaf = node.kind === 'leaf';
    result.push({ node, x: index * hGap, y: depth * vGap + 30, parentId, isLeaf });
    index++;
    if (node.kind === 'internal') walk(node.right, depth + 1, node.id);
  }

  walk(root, 0);

  // Center so min x is 0
  let minX = Infinity;
  for (const r of result) if (r.x < minX) minX = r.x;
  if (minX !== 0) for (const r of result) r.x -= minX;

  return result;
}

const MerkleTreeCanvas = memo(function MerkleTreeCanvas({
  merkle,
  stepIdx,
  steps,
}: {
  merkle: MerkleState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const svgWidth = 600;
  const laid = useMemo(() => layoutMerkleTree(merkle.root, svgWidth), [merkle.root]);
  const nodeMap = useMemo(() => new Map(laid.map((n) => [n.node.id, n])), [laid]);

  const svgHeight = useMemo(() => {
    if (laid.length === 0) return 100;
    return Math.max(...laid.map((n) => n.y)) + 60;
  }, [laid]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} 100`;
    const pad = 50;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  const nodeW = 56;
  const nodeH = 32;

  if (!merkle.root) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <p className="text-sm text-foreground-muted">Merkle tree is empty. Use Insert with comma-separated data like &quot;A,B,C,D&quot;.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Merkle Tree ({merkle.leaves.length} leaf/leaves, depth {merkle.depth})
      </h3>
      <svg role="img" aria-label={`Merkle Tree visualization showing ${merkle.leaves.length} leaves`} viewBox={viewBox} className="w-full max-w-3xl" style={{ height: Math.min(svgHeight, 500) }} preserveAspectRatio="xMidYMid meet">
        {/* Edges */}
        {laid.map((ln) => {
          if (!ln.parentId) return null;
          const parent = nodeMap.get(ln.parentId);
          if (!parent) return null;
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;

          return (
            <motion.line
              key={`edge-${ln.node.id}`}
              x1={parent.x}
              y1={parent.y + nodeH / 2}
              x2={ln.x}
              y2={ln.y - nodeH / 2}
              initial={false}
              animate={{
                stroke: hl !== "default" ? color : "#4b5563",
                strokeWidth: hl !== "default" ? 2.5 : 1.5,
              }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}

        {/* Nodes */}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isRoot = !ln.parentId;

          return (
            <motion.g key={ln.node.id}>
              {/* Verification path glow */}
              {hl === "done" && (
                <motion.rect
                  x={ln.x - nodeW / 2 - 3}
                  y={ln.y - nodeH / 2 - 3}
                  width={nodeW + 6}
                  height={nodeH + 6}
                  rx={8}
                  fill="none"
                  initial={false}
                  animate={{ stroke: "#22c55e", strokeWidth: 2, opacity: 0.5 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              )}
              <motion.rect
                x={ln.x - nodeW / 2}
                y={ln.y - nodeH / 2}
                width={nodeW}
                height={nodeH}
                rx={6}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, ln.isLeaf ? "#1e3a2f" : "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : ln.isLeaf ? "#22c55e" : isRoot ? "#a855f7" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : isRoot ? 2 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              {/* Hash value */}
              <text
                x={ln.x}
                y={ln.y + (ln.isLeaf ? -2 : 2)}
                textAnchor="middle"
                className="text-[10px] font-mono font-medium"
                fill={hl !== "default" ? color : ln.isLeaf ? "#22c55e" : isRoot ? "#c084fc" : "#9ca3af"}
              >
                {ln.node.hash.slice(0, 8)}
              </text>
              {/* Data label for leaves */}
              {ln.isLeaf && ln.node.kind === 'leaf' && ln.node.data && (
                <text
                  x={ln.x}
                  y={ln.y + 10}
                  textAnchor="middle"
                  className="text-[10px] font-mono"
                  fill="var(--ds-default)"
                >
                  {ln.node.data.length > 8 ? ln.node.data.slice(0, 8) + ".." : ln.node.data}
                </text>
              )}
              {/* Root label */}
              {isRoot && (
                <text
                  x={ln.x}
                  y={ln.y - nodeH / 2 - 6}
                  textAnchor="middle"
                  className="text-[10px] font-semibold uppercase"
                  fill="#a855f7"
                >
                  ROOT
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
      {/* Leaf data */}
      {merkle.leaves.length > 0 && (
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted mb-1">Data Blocks</div>
          <div className="flex flex-wrap gap-1 justify-center">
            {merkle.leaves.map((leaf, i) => (
              <span key={`merkle-leaf-${i}-${leaf}`} className="rounded-xl bg-elevated/50 border border-border/30 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                [{i}] {leaf}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Controls ───────────────────────────────────────────────


const SegmentTreeCanvas = memo(function SegmentTreeCanvas({
  segTree,
  stepIdx,
  steps,
}: {
  segTree: SegmentTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { tree, n, data } = segTree;

  if (n === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Segment Tree is empty. Insert data to build range query tree.</p>
      </div>
    );
  }

  // Collect valid nodes: tree is 1-indexed, size=4*n, valid if tree[i] !== 0 or it was built
  // Build visual tree from index 1 (root)
  interface SegLayoutNode { idx: number; value: number; x: number; y: number; rangeStart: number; rangeEnd: number }
  const nodes: SegLayoutNode[] = [];
  const svgWidth = 600;
  const vGap = 55;
  const nodeRadius = 20;

  function collect(idx: number, start: number, end: number, x: number, y: number, spread: number): void {
    if (idx >= tree.length || start > end) return;
    nodes.push({ idx, value: tree[idx], x, y, rangeStart: start, rangeEnd: end });
    if (start < end) {
      const mid = Math.floor((start + end) / 2);
      collect(2 * idx, start, mid, x - spread, y + vGap, spread / 2);
      collect(2 * idx + 1, mid + 1, end, x + spread, y + vGap, spread / 2);
    }
  }

  const depth = Math.ceil(Math.log2(n + 1)) + 1;
  const initSpread = Math.min(svgWidth / 3, Math.pow(2, depth) * 20);
  collect(1, 0, n - 1, svgWidth / 2, 30, initSpread);

  const svgHeight = nodes.length > 0 ? Math.max(...nodes.map((nd) => nd.y)) + 60 : 200;

  // Edges
  const edges: { parent: SegLayoutNode; child: SegLayoutNode }[] = [];
  const nodeMap = new Map(nodes.map((nd) => [nd.idx, nd]));
  for (const nd of nodes) {
    const left = nodeMap.get(2 * nd.idx);
    const right = nodeMap.get(2 * nd.idx + 1);
    if (left) edges.push({ parent: nd, child: left });
    if (right) edges.push({ parent: nd, child: right });
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Segment Tree (n={n})
      </h3>
      <svg role="img" aria-label={`Segment Tree visualization showing ${n} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
        {edges.map((e) => {
          const hl = getHighlight(stepIdx, steps, `seg-${e.child.idx}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.idx}-${e.child.idx}`}
              x1={e.parent.x} y1={e.parent.y} x2={e.child.x} y2={e.child.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: hl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {nodes.map((nd) => {
          const hl = getHighlight(stepIdx, steps, `seg-${nd.idx}`);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isLeaf = nd.rangeStart === nd.rangeEnd;
          return (
            <motion.g key={nd.idx}>
              <motion.rect
                x={nd.x - nodeRadius} y={nd.y - 14} width={nodeRadius * 2} height={28} rx={4}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, isLeaf ? "#6366f115" : "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : isLeaf ? "#6366f1" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={nd.x} y={nd.y + 1} textAnchor="middle" className="text-[10px] font-bold" fill={color}>
                {nd.value}
              </text>
              <text x={nd.x} y={nd.y - 18} textAnchor="middle" className="text-[10px]" fill="var(--ds-default)">
                [{nd.rangeStart},{nd.rangeEnd}]
              </text>
            </motion.g>
          );
        })}
      </svg>
      {/* Original array */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">Original Array</span>
        <div className="flex gap-0.5">
          {data.map((val, i) => (
            <div key={`seg-d-${i}`} className="flex flex-col items-center gap-0.5">
              <div className="flex h-7 w-9 items-center justify-center rounded border border-border/30 font-mono text-[10px] font-medium text-foreground-muted">
                {val}
              </div>
              <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// ── Canvas: B+ Tree Visualization ──────────────────────────


const BPlusTreeCanvas = memo(function BPlusTreeCanvas({
  bplusTree,
  stepIdx,
  steps,
}: {
  bplusTree: BPlusTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  if (!bplusTree.rootId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">B+ Tree is empty. Insert values to see leaf linked list.</p>
      </div>
    );
  }

  // BFS to collect levels
  interface BPlusLayoutNode { id: string; keys: number[]; isLeaf: boolean; level: number; x: number; y: number }
  const levels: BPlusLayoutNode[][] = [];
  const queue: { id: string; level: number }[] = [{ id: bplusTree.rootId, level: 0 }];
  const allNodes: BPlusLayoutNode[] = [];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const node = bplusTree.nodes[id];
    if (!node) continue;
    if (!levels[level]) levels[level] = [];
    const ln: BPlusLayoutNode = { id, keys: node.keys, isLeaf: node.kind === "leaf", level, x: 0, y: 0 };
    levels[level].push(ln);
    allNodes.push(ln);
    if (node.kind === "internal") {
      for (const cid of node.childIds) {
        queue.push({ id: cid, level: level + 1 });
      }
    }
  }

  // Assign x positions per level
  const svgWidth = 700;
  const vGap = 70;
  for (const level of levels) {
    const spacing = svgWidth / (level.length + 1);
    level.forEach((nd, i) => {
      nd.x = spacing * (i + 1);
      nd.y = 30 + nd.level * vGap;
    });
  }

  const svgHeight = levels.length * vGap + 50;
  const nodeMap = new Map(allNodes.map((nd) => [nd.id, nd]));

  // Edges
  const edges: { parentId: string; childId: string }[] = [];
  for (const nd of allNodes) {
    const node = bplusTree.nodes[nd.id];
    if (node && node.kind === "internal") {
      for (const cid of node.childIds) {
        edges.push({ parentId: nd.id, childId: cid });
      }
    }
  }

  // Leaf chain
  const leafKeys = bplusLeafKeys(bplusTree);

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        B+ Tree (order={bplusTree.order}, size={bplusTree.size})
      </h3>
      <svg role="img" aria-label={`B+ Tree visualization showing ${bplusTree.size} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
        {/* Edges */}
        {edges.map((e) => {
          const parent = nodeMap.get(e.parentId);
          const child = nodeMap.get(e.childId);
          if (!parent || !child) return null;
          return (
            <line
              key={`${e.parentId}-${e.childId}`}
              x1={parent.x} y1={parent.y + 12} x2={child.x} y2={child.y - 12}
              stroke="var(--ds-default)" strokeWidth={1.5}
            />
          );
        })}
        {/* Nodes */}
        {allNodes.map((nd) => {
          const hl = getHighlight(stepIdx, steps, nd.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const keyWidth = Math.max(nd.keys.length * 24, 32);
          return (
            <motion.g key={nd.id}>
              <motion.rect
                x={nd.x - keyWidth / 2} y={nd.y - 12} width={keyWidth} height={24}
                rx={nd.isLeaf ? 2 : 4}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, nd.isLeaf ? "#22c55e10" : "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : nd.isLeaf ? "#22c55e" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              {nd.keys.map((k, ki) => (
                <React.Fragment key={`${nd.id}-k${ki}`}>
                  <text
                    x={nd.x - keyWidth / 2 + ki * 24 + 12}
                    y={nd.y + 4}
                    textAnchor="middle"
                    className="text-[10px] font-semibold"
                    fill={hl !== "default" ? color : nd.isLeaf ? "#22c55e" : "#9ca3af"}
                  >
                    {k}
                  </text>
                  {ki < nd.keys.length - 1 && (
                    <line
                      x1={nd.x - keyWidth / 2 + (ki + 1) * 24}
                      y1={nd.y - 10}
                      x2={nd.x - keyWidth / 2 + (ki + 1) * 24}
                      y2={nd.y + 10}
                      stroke={nd.isLeaf ? "#22c55e40" : "#4b5563"}
                      strokeWidth={1}
                    />
                  )}
                </React.Fragment>
              ))}
              {nd.isLeaf && (
                <text x={nd.x} y={nd.y + 20} textAnchor="middle" className="text-[10px]" fill="#22c55e80">
                  leaf
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>
      {/* Leaf chain */}
      {leafKeys.length > 0 && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">Leaf chain (sorted)</span>
          <div className="flex gap-0.5 items-center">
            {leafKeys.map((k, i) => (
              <React.Fragment key={`lk-${i}`}>
                <span className="rounded border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 font-mono text-[10px] text-green-400">
                  {k}
                </span>
                {i < leafKeys.length - 1 && (
                  <svg width="12" height="8" className="shrink-0">
                    <line x1="0" y1="4" x2="6" y2="4" stroke="#22c55e" strokeWidth="1" />
                    <polygon points="6,1.5 12,4 6,6.5" fill="#22c55e" />
                  </svg>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ── Canvas: Fenwick Tree Visualization ─────────────────────


const FenwickTreeCanvas = memo(function FenwickTreeCanvas({
  fenwick,
  stepIdx,
  steps,
}: {
  fenwick: FenwickTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const { tree, data, n } = fenwick;

  if (n === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Fenwick Tree is empty. Use Insert with index and delta values.</p>
      </div>
    );
  }

  // Show the BIT array (1-indexed) and the original data (0-indexed)
  // Also show the responsibility ranges for each BIT index
  const responsibilities: { idx: number; from: number; to: number }[] = [];
  for (let i = 1; i <= n; i++) {
    const lowbit = i & -i;
    responsibilities.push({ idx: i, from: i - lowbit + 1, to: i });
  }

  return (
    <div role="img" aria-label={`Fenwick Tree visualization showing ${n} elements`} className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Fenwick Tree / Binary Indexed Tree (n={n})
      </h3>

      {/* BIT array */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">BIT Array (1-indexed)</span>
        <div className="flex gap-0.5">
          {tree.slice(1).map((val, i) => {
            const idx = i + 1;
            const hl = getHighlight(stepIdx, steps, `bit-${idx}`);
            const color = DS_COLORS[hl] ?? DS_COLORS.default;
            const resp = responsibilities[i];
            return (
              <div key={`bit-${idx}`} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-foreground-subtle">[{resp.from},{resp.to}]</span>
                <motion.div
                  className="flex h-9 w-11 items-center justify-center rounded border font-mono text-xs font-bold"
                  initial={false}
                  animate={{
                    borderColor: hl !== "default" ? color : "#6366f180",
                    backgroundColor: dsColorBg(hl, "#6366f110"),
                    color: hl !== "default" ? color : "#c7d2fe",
                  }}
                  transition={{ duration: ANIM_DURATION }}
                >
                  {val}
                </motion.div>
                <span className="text-[10px] font-mono text-foreground-subtle">{idx}</span>
                <span className="text-[10px] font-mono text-foreground-subtle">{idx.toString(2).padStart(4, "0")}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Original data */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-subtle">Original Data (0-indexed)</span>
        <div className="flex gap-0.5">
          {data.map((val, i) => (
            <div key={`fd-${i}`} className="flex flex-col items-center gap-0.5">
              <div className="flex h-7 w-9 items-center justify-center rounded border border-border/30 font-mono text-[10px] font-medium text-foreground-muted">
                {val}
              </div>
              <span className="text-[10px] font-mono text-foreground-subtle">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Size</div>
          <div className="font-mono text-sm font-medium text-foreground">{n}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Total Sum</div>
          <div className="font-mono text-sm font-medium text-indigo-400">{data.reduce((a, b) => a + b, 0)}</div>
        </div>
      </div>
    </div>
  );
});

// ── Canvas: Splay Tree Visualization ──────────────────────


interface SplayLayoutNode {
  node: SplayNode;
  x: number;
  y: number;
}

function layoutSplay(root: SplayNode | null, _width: number): SplayLayoutNode[] {
  return inorderLayout(root);
}

const SplayTreeCanvas = memo(function SplayTreeCanvas({
  splayTree,
  stepIdx,
  steps,
}: {
  splayTree: SplayTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const svgWidth = 600;
  const nodeRadius = 20;
  const laid = useMemo(() => layoutSplay(splayTree.root, svgWidth), [splayTree.root]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} 400`;
    const pad = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  const edges = useMemo(() => {
    const e: { parent: SplayLayoutNode; child: SplayLayoutNode }[] = [];
    const nodeMap = new Map(laid.map((ln) => [ln.node.id, ln]));
    for (const ln of laid) {
      if (ln.node.left) { const c = nodeMap.get(ln.node.left.id); if (c) e.push({ parent: ln, child: c }); }
      if (ln.node.right) { const c = nodeMap.get(ln.node.right.id); if (c) e.push({ parent: ln, child: c }); }
    }
    return e;
  }, [laid]);

  if (!splayTree.root) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Splay Tree is empty. Insert values to see splaying in action.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Splay Tree (size {splayTree.size}, root: {splayTree.root.key})
      </h3>
      <svg role="img" aria-label={`Splay Tree visualization showing ${splayTree.size} elements`} viewBox={viewBox} className="w-full max-w-2xl" style={{ height: 360 }} preserveAspectRatio="xMidYMid meet">
        {edges.map((e) => {
          const childHl = getHighlight(stepIdx, steps, e.child.node.id);
          const color = DS_COLORS[childHl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.node.id}-${e.child.node.id}`}
              x1={e.parent.x} y1={e.parent.y} x2={e.child.x} y2={e.child.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const isRoot = ln.node === splayTree.root;
          return (
            <motion.g key={ln.node.id}>
              {(hl !== "default" || isRoot) && (
                <motion.circle
                  cx={ln.x} cy={ln.y} r={nodeRadius + 4} fill="none"
                  initial={false}
                  animate={{ stroke: isRoot && hl === "default" ? "#f59e0b" : color, strokeWidth: 2, opacity: 0.4 }}
                  transition={{ duration: ANIM_DURATION }}
                />
              )}
              <motion.circle
                cx={ln.x} cy={ln.y} r={nodeRadius}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : isRoot ? "#f59e0b" : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={ln.x} y={ln.y + 5} textAnchor="middle" className="text-xs font-semibold" fill={color}>
                {ln.node.key}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <TreeStatsBar root={splayTree.root} />
    </div>
  );
});

// ── Canvas: CRDT Visualization ─────────────────────────────


interface TreapLayoutNode {
  node: TreapNode;
  x: number;
  y: number;
}

function layoutTreapTree(root: TreapNode | null, _width: number): TreapLayoutNode[] {
  return inorderLayout(root);
}

const TreapCanvas = memo(function TreapCanvas({
  treap,
  stepIdx,
  steps,
}: {
  treap: TreapState;
  stepIdx: number;
  steps: DSStep[];
}) {
  const svgWidth = 600;
  const nodeRadius = 22;
  const laid = useMemo(() => layoutTreapTree(treap.root, svgWidth), [treap.root]);

  const viewBox = useMemo(() => {
    if (laid.length === 0) return `0 0 ${svgWidth} 400`;
    const pad = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const ln of laid) {
      if (ln.x < minX) minX = ln.x;
      if (ln.y < minY) minY = ln.y;
      if (ln.x > maxX) maxX = ln.x;
      if (ln.y > maxY) maxY = ln.y;
    }
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [laid]);

  const edges = useMemo(() => {
    const e: { parent: TreapLayoutNode; child: TreapLayoutNode }[] = [];
    const nodeMap = new Map(laid.map((ln) => [ln.node.id, ln]));
    for (const ln of laid) {
      if (ln.node.left) { const c = nodeMap.get(ln.node.left.id); if (c) e.push({ parent: ln, child: c }); }
      if (ln.node.right) { const c = nodeMap.get(ln.node.right.id); if (c) e.push({ parent: ln, child: c }); }
    }
    return e;
  }, [laid]);

  if (!treap.root) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">Treap is empty. Insert values to see BST + heap ordering.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        Treap (size {treap.size})
      </h3>
      <div className="flex gap-4 text-[10px] text-foreground-subtle">
        <span>Top: key (BST order)</span>
        <span>Bottom: priority (max-heap order)</span>
      </div>
      <svg role="img" aria-label={`Treap visualization showing ${treap.size} elements`} viewBox={viewBox} className="w-full max-w-2xl" style={{ height: 360 }} preserveAspectRatio="xMidYMid meet">
        {edges.map((e) => {
          const childHl = getHighlight(stepIdx, steps, e.child.node.id);
          const color = DS_COLORS[childHl] ?? DS_COLORS.default;
          return (
            <motion.line
              key={`${e.parent.node.id}-${e.child.node.id}`}
              x1={e.parent.x} y1={e.parent.y} x2={e.child.x} y2={e.child.y}
              initial={false}
              animate={{ stroke: color, strokeWidth: childHl !== "default" ? 2 : 1.5 }}
              transition={{ duration: ANIM_DURATION }}
            />
          );
        })}
        {laid.map((ln) => {
          const hl = getHighlight(stepIdx, steps, ln.node.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          return (
            <motion.g key={ln.node.id}>
              <motion.circle
                cx={ln.x} cy={ln.y} r={nodeRadius}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              <text x={ln.x} y={ln.y - 2} textAnchor="middle" className="text-[11px] font-bold" fill={color}>
                {ln.node.key}
              </text>
              <text x={ln.x} y={ln.y + 10} textAnchor="middle" className="text-[10px]" fill="#f59e0b">
                p={ln.node.priority}
              </text>
            </motion.g>
          );
        })}
      </svg>
      <TreeStatsBar root={treap.root} />
    </div>
  );
});

// ── Canvas: Binomial Heap Visualization ────────────────────


const BTreeCanvas = memo(function BTreeCanvas({
  bTree,
  stepIdx,
  steps,
}: {
  bTree: BTreeState;
  stepIdx: number;
  steps: DSStep[];
}) {
  if (!bTree.rootId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-foreground-muted">B-Tree is empty. Insert values to see node splitting.</p>
      </div>
    );
  }

  // BFS to collect levels
  interface BTreeLayoutNode { id: string; keys: number[]; isLeaf: boolean; level: number; x: number; y: number }
  const levels: BTreeLayoutNode[][] = [];
  const queue: { id: string; level: number }[] = [{ id: bTree.rootId, level: 0 }];
  const allNodes: BTreeLayoutNode[] = [];

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    const node = bTree.nodes[id];
    if (!node) continue;
    if (!levels[level]) levels[level] = [];
    const ln: BTreeLayoutNode = { id, keys: node.keys, isLeaf: node.leaf, level, x: 0, y: 0 };
    levels[level].push(ln);
    allNodes.push(ln);
    for (const cid of node.childIds) {
      queue.push({ id: cid, level: level + 1 });
    }
  }

  const svgWidth = 700;
  const vGap = 70;
  for (const level of levels) {
    const spacing = svgWidth / (level.length + 1);
    level.forEach((nd, i) => {
      nd.x = spacing * (i + 1);
      nd.y = 30 + nd.level * vGap;
    });
  }

  const svgHeight = levels.length * vGap + 50;
  const nodeMap = new Map(allNodes.map((nd) => [nd.id, nd]));

  const edges: { parentId: string; childId: string }[] = [];
  for (const nd of allNodes) {
    const node = bTree.nodes[nd.id];
    if (node) {
      for (const cid of node.childIds) {
        edges.push({ parentId: nd.id, childId: cid });
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        B-Tree (order={bTree.order}, size={bTree.size})
      </h3>
      <svg role="img" aria-label={`B-Tree visualization showing ${bTree.size} elements`} width={svgWidth} height={svgHeight} className="max-w-full">
        {edges.map((e) => {
          const parent = nodeMap.get(e.parentId);
          const child = nodeMap.get(e.childId);
          if (!parent || !child) return null;
          return (
            <line
              key={`${e.parentId}-${e.childId}`}
              x1={parent.x} y1={parent.y + 14} x2={child.x} y2={child.y - 14}
              stroke="var(--ds-default)" strokeWidth={1.5}
            />
          );
        })}
        {allNodes.map((nd) => {
          const hl = getHighlight(stepIdx, steps, nd.id);
          const color = DS_COLORS[hl] ?? DS_COLORS.default;
          const keyWidth = Math.max(nd.keys.length * 28, 36);
          return (
            <motion.g key={nd.id}>
              <motion.rect
                x={nd.x - keyWidth / 2} y={nd.y - 14} width={keyWidth} height={28} rx={4}
                initial={false}
                animate={{
                  fill: dsColorBg(hl, "var(--ds-node-fill)"),
                  stroke: hl !== "default" ? color : "var(--ds-default)",
                  strokeWidth: hl !== "default" ? 2.5 : 1.5,
                }}
                transition={{ duration: ANIM_DURATION }}
              />
              {nd.keys.map((k, ki) => (
                <React.Fragment key={`${nd.id}-k${ki}`}>
                  <text
                    x={nd.x - keyWidth / 2 + ki * 28 + 14}
                    y={nd.y + 4}
                    textAnchor="middle"
                    className="text-[10px] font-semibold"
                    fill={hl !== "default" ? color : "#e5e7eb"}
                  >
                    {k}
                  </text>
                  {ki < nd.keys.length - 1 && (
                    <line
                      x1={nd.x - keyWidth / 2 + (ki + 1) * 28}
                      y1={nd.y - 12}
                      x2={nd.x - keyWidth / 2 + (ki + 1) * 28}
                      y2={nd.y + 12}
                      stroke="#4b5563" strokeWidth={1}
                    />
                  )}
                </React.Fragment>
              ))}
            </motion.g>
          );
        })}
      </svg>
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Size</div>
          <div className="font-mono text-sm font-medium text-foreground">{bTree.size}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Order</div>
          <div className="font-mono text-sm font-medium text-blue-400">{bTree.order}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Max Keys/Node</div>
          <div className="font-mono text-sm font-medium text-amber-400">{bTree.order - 1}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-wider text-foreground-muted">Levels</div>
          <div className="font-mono text-sm font-medium text-green-400">{levels.length}</div>
        </div>
      </div>
    </div>
  );
});

// ── Canvas: Doubly Linked List ─────────────────────────────


export {
  BSTCanvas,
  AVLCanvas,
  RBTreeCanvas,
  TrieCanvas,
  MerkleTreeCanvas,
  SegmentTreeCanvas,
  BPlusTreeCanvas,
  FenwickTreeCanvas,
  SplayTreeCanvas,
  TreapCanvas,
  BTreeCanvas,
};
