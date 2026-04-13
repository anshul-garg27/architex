'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { TreeNode, TreeElementState } from '@/lib/algorithms/tree';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { layoutTree, collectNodes } from '@/lib/algorithms/tree';
import { duration, springs } from '@/lib/constants/motion';
import { getTreeChoreography } from '@/lib/algorithms/tree-choreography';
import { TREE_NODE_STATE_COLORS as NODE_STATE_COLORS } from '@/lib/algorithms/visualization-colors';

// ── Constants ────────────────────────────────────────────────

const NODE_RADIUS = 22;

// ── Types ────────────────────────────────────────────────────

export interface TreeVisualizerProps {
  tree: TreeNode | null;
  step: AnimationStep | null;
  className?: string;
  height?: number;
  /** If true, show array indices below nodes (for heap view). */
  showArrayIndices?: boolean;
  /** If true, show balance factor next to nodes (for AVL view). */
  showBalanceFactor?: boolean;
  /** For heap view: the current heap array to display below the tree. */
  heapArray?: number[];
  /** Algorithm ID used to select per-algorithm spring choreography. */
  algorithmId?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function getNodeState(
  nodeId: string,
  mutations: VisualMutation[],
): TreeElementState {
  for (const m of mutations) {
    if (m.targetId === `tnode-${nodeId}` && m.property === 'highlight') {
      const val = String(m.to) as TreeElementState;
      if (val in NODE_STATE_COLORS) return val;
    }
  }
  return 'default';
}

function getNodeLabel(
  nodeId: string,
  mutations: VisualMutation[],
): string | null {
  for (const m of mutations) {
    if (m.targetId === `tnode-${nodeId}` && m.property === 'label') {
      return String(m.to);
    }
  }
  return null;
}

function getNodeOpacity(
  nodeId: string,
  mutations: VisualMutation[],
): number {
  for (const m of mutations) {
    if (m.targetId === `tnode-${nodeId}` && m.property === 'opacity') {
      return Number(m.to);
    }
  }
  return 1;
}

function getArrayCellState(
  index: number,
  mutations: VisualMutation[],
): TreeElementState {
  for (const m of mutations) {
    if (m.targetId === `arr-${index}` && m.property === 'highlight') {
      const val = String(m.to) as TreeElementState;
      if (val in NODE_STATE_COLORS) return val;
    }
  }
  return 'default';
}

// ── Component ────────────────────────────────────────────────

export const TreeVisualizer = memo(function TreeVisualizer({
  tree,
  step,
  className,
  height = 480,
  showArrayIndices = false,
  showBalanceFactor = false,
  heapArray,
  algorithmId,
}: TreeVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const mutations = step?.mutations ?? [];
  const choreo = useMemo(() => getTreeChoreography(algorithmId ?? ''), [algorithmId]);

  // Layout the tree
  const nodes = useMemo(() => {
    if (!tree) return [];
    const svgWidth = 800;
    const svgHeight = heapArray ? height - 80 : height - 20;
    layoutTree(tree, svgWidth, svgHeight);
    return collectNodes(tree);
  }, [tree, height, heapArray]);

  // Compute viewBox from laid-out positions
  const viewBox = useMemo(() => {
    if (nodes.length === 0) return '0 0 800 400';
    const padding = 50;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [nodes]);

  // Build edges from parent -> children
  const edges = useMemo(() => {
    const result: { parent: TreeNode; child: TreeNode }[] = [];
    function walk(node: TreeNode | null): void {
      if (!node) return;
      if (node.left) {
        result.push({ parent: node, child: node.left });
        walk(node.left);
      }
      if (node.right) {
        result.push({ parent: node, child: node.right });
        walk(node.right);
      }
    }
    if (tree) walk(tree);
    return result;
  }, [tree]);

  // Compute array index for each heap node
  const heapIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!showArrayIndices || !tree) return map;
    // BFS to assign indices in level-order
    const queue: TreeNode[] = [tree];
    let idx = 0;
    while (queue.length > 0) {
      const node = queue.shift()!;
      map.set(node.id, idx++);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return map;
  }, [tree, showArrayIndices]);

  if (!tree || nodes.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-elevated',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No tree to visualize</p>
      </div>
    );
  }

  const treeHeight = heapArray ? height - 80 : height;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-elevated',
        className,
      )}
      style={{ height }}
    >
      {/* Tree SVG */}
      <svg
        viewBox={viewBox}
        className="w-full"
        style={{ height: treeHeight }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Edges */}
        {edges.map(({ parent, child }) => {
          const px = parent.x ?? 0;
          const py = parent.y ?? 0;
          const cx = child.x ?? 0;
          const cy = child.y ?? 0;
          const childOpacity = getNodeOpacity(child.id, mutations);
          const childState = getNodeState(child.id, mutations);
          const color =
            childState !== 'default'
              ? NODE_STATE_COLORS[childState]
              : '#374151';

          // Shorten line to stop at node border
          const dx = cx - px;
          const dy = cy - py;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ratio = len > 0 ? NODE_RADIUS / len : 0;

          return (
            <motion.line
              key={`${parent.id}-${child.id}`}
              x1={px + dx * ratio}
              y1={py + dy * ratio}
              x2={cx - dx * ratio}
              y2={cy - dy * ratio}
              initial={false}
              animate={{
                stroke: color,
                strokeWidth: childState !== 'default' ? 2.5 : 1.5,
                opacity: childOpacity,
              }}
              transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const nodeState = getNodeState(node.id, mutations);
          const nodeColor = NODE_STATE_COLORS[nodeState];
          const extraLabel = getNodeLabel(node.id, mutations);
          const opacity = getNodeOpacity(node.id, mutations);
          const arrIdx = heapIndexMap.get(node.id);

          return (
            <motion.g
              key={node.id}
              initial={false}
              animate={{ opacity }}
              transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
            >
              {/* Outer glow for active nodes */}
              {nodeState !== 'default' && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={NODE_RADIUS + 4}
                  fill="none"
                  initial={false}
                  animate={{
                    stroke: nodeColor,
                    strokeWidth: 2,
                    opacity: 0.4,
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
                />
              )}

              {/* Node circle */}
              <motion.circle
                cx={x}
                cy={y}
                r={NODE_RADIUS}
                initial={false}
                animate={{
                  fill: nodeState !== 'default' ? 'rgba(34,197,94,0.12)' : '#1f2937',
                  stroke: nodeColor,
                  strokeWidth: nodeState !== 'default' ? 2.5 : 1.5,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
              />

              {/* Node value */}
              <text
                x={x}
                y={extraLabel || showBalanceFactor ? y - 2 : y + 5}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill={nodeColor}
              >
                {node.value}
              </text>

              {/* Balance factor (AVL) */}
              {showBalanceFactor && node.balanceFactor !== undefined && (
                <text
                  x={x + NODE_RADIUS + 6}
                  y={y - NODE_RADIUS + 4}
                  textAnchor="start"
                  className="text-[9px] font-mono"
                  fill={
                    Math.abs(node.balanceFactor) > 1
                      ? '#ef4444'
                      : '#6b7280'
                  }
                >
                  {node.balanceFactor >= 0 ? '+' : ''}
                  {node.balanceFactor}
                </text>
              )}

              {/* Extra label from mutations (e.g., bf=...) */}
              {extraLabel && (
                <text
                  x={x}
                  y={y + 14}
                  textAnchor="middle"
                  className="text-[9px] font-mono"
                  fill={nodeColor}
                  opacity={0.8}
                >
                  {extraLabel}
                </text>
              )}

              {/* Array index for heap view */}
              {showArrayIndices && arrIdx !== undefined && (
                <text
                  x={x}
                  y={y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  className="text-[8px] font-mono"
                  fill="#6b7280"
                >
                  [{arrIdx}]
                </text>
              )}
            </motion.g>
          );
        })}
      </svg>

      {/* Heap array view */}
      {heapArray && heapArray.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 px-3 py-2">
          <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Array View
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {heapArray.map((val, i) => {
              const cellState = getArrayCellState(i, mutations);
              const cellColor = NODE_STATE_COLORS[cellState];
              return (
                <div
                  key={i}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    className="flex h-7 w-8 items-center justify-center rounded border text-xs font-mono font-medium"
                    initial={false}
                    animate={{
                      borderColor: cellColor,
                      backgroundColor: cellState !== 'default' ? 'rgba(34,197,94,0.12)' : 'transparent',
                      color: cellColor,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.moderate }}
                  >
                    {val}
                  </motion.div>
                  <span className="text-[8px] text-foreground-subtle">{i}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-1.5 right-2 flex flex-wrap gap-2" style={{ bottom: heapArray ? '5rem' : '0.375rem' }}>
        {(
          ['current', 'visiting', 'visited', 'inserting', 'deleting', 'rotating', 'found'] as const
        ).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: NODE_STATE_COLORS[s] }}
            />
            <span className="text-[8px] text-foreground-subtle">{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
