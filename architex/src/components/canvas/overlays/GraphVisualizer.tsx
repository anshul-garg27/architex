'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Graph, GraphElementState } from '@/lib/algorithms';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { duration, springs } from '@/lib/constants/motion';
import { getGraphChoreography } from '@/lib/algorithms/graph-choreography';
import {
  GRAPH_NODE_STATE_COLORS as NODE_STATE_COLORS,
  GRAPH_EDGE_STATE_COLORS as EDGE_STATE_COLORS,
} from '@/lib/algorithms/visualization-colors';

// ── Constants ────────────────────────────────────────────────

const NODE_RADIUS = 24;

// ── Types ────────────────────────────────────────────────────

export interface GraphVisualizerProps {
  graph: Graph;
  step: AnimationStep | null;
  className?: string;
  height?: number;
  /** Algorithm ID used to select per-algorithm spring choreography. */
  algorithmId?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function getNodeState(
  nodeId: string,
  mutations: VisualMutation[],
): GraphElementState {
  for (const m of mutations) {
    if (m.targetId === `node-${nodeId}` && m.property === 'highlight') {
      const val = String(m.to) as GraphElementState;
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
    if (m.targetId === `node-${nodeId}` && m.property === 'label') {
      return String(m.to);
    }
  }
  return null;
}

function getEdgeState(
  source: string,
  target: string,
  mutations: VisualMutation[],
): string {
  for (const m of mutations) {
    if (
      (m.targetId === `edge-${source}-${target}` ||
        m.targetId === `edge-${target}-${source}`) &&
      m.property === 'highlight'
    ) {
      return String(m.to);
    }
  }
  return 'default';
}

// ── Component ────────────────────────────────────────────────

export const GraphVisualizer = memo(function GraphVisualizer({
  graph,
  step,
  className,
  height = 400,
  algorithmId,
}: GraphVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const mutations = step?.mutations ?? [];
  const choreo = useMemo(() => getGraphChoreography(algorithmId ?? ''), [algorithmId]);

  // Accumulate all mutations from current step.
  // In a more advanced implementation you would track cumulative state,
  // but for step-by-step playback this works well.

  // Calculate SVG viewBox from node positions
  const viewBox = useMemo(() => {
    if (graph.nodes.length === 0) return '0 0 600 400';
    const padding = 60;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of graph.nodes) {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x;
      if (n.y > maxY) maxY = n.y;
    }
    return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [graph.nodes]);

  if (graph.nodes.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No graph to visualize</p>
      </div>
    );
  }

  // Build a quick node position lookup
  const nodePos = new Map<string, { x: number; y: number }>();
  for (const n of graph.nodes) {
    nodePos.set(n.id, { x: n.x, y: n.y });
  }

  return (
    <div
      role="img"
      aria-label="Algorithm visualization"
      className={cn(
        'relative overflow-hidden rounded-xl border border-border/30 bg-gradient-to-b from-elevated/80 to-background',
        className,
      )}
      style={{ height }}
    >
      <svg
        viewBox={viewBox}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Arrowhead marker */}
        <defs>
          {/* Glow filter for active nodes */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          {/* Stronger glow for edges */}
          <filter id="edge-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
          </marker>
          <marker
            id="arrowhead-active"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
          </marker>
          <marker
            id="arrowhead-path"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
          </marker>
        </defs>

        {/* Edges */}
        {graph.edges.map((edge) => {
          const src = nodePos.get(edge.source);
          const tgt = nodePos.get(edge.target);
          if (!src || !tgt) return null;

          const edgeState = getEdgeState(edge.source, edge.target, mutations);
          const color = EDGE_STATE_COLORS[edgeState] ?? EDGE_STATE_COLORS.default;

          // Shorten line to stop at node border
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const ratio = len > 0 ? NODE_RADIUS / len : 0;

          const x1 = src.x + dx * ratio;
          const y1 = src.y + dy * ratio;
          const x2 = tgt.x - dx * ratio;
          const y2 = tgt.y - dy * ratio;

          const markerEnd = edge.directed
            ? edgeState === 'in-path'
              ? 'url(#arrowhead-path)'
              : edgeState !== 'default'
                ? 'url(#arrowhead-active)'
                : 'url(#arrowhead)'
            : undefined;

          // Edge weight label
          const mx = (src.x + tgt.x) / 2;
          const my = (src.y + tgt.y) / 2;

          return (
            <g key={`${edge.source}-${edge.target}`}>
              <motion.line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                initial={false}
                animate={{
                  stroke: color,
                  strokeWidth: edgeState !== 'default' ? 3.5 : 1.5,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : {
                  ...choreo.nodeTransition,
                  duration: duration.moderate / choreo.edgeSpeed,
                }}
                markerEnd={markerEnd}
                filter={edgeState !== 'default' ? 'url(#edge-glow)' : undefined}
              />
              {edge.weight !== 1 && (
                <g>
                  <rect
                    x={mx - 10}
                    y={my - 8}
                    width={20}
                    height={16}
                    rx={3}
                    fill="var(--color-background, #1a1a2e)"
                    stroke={color}
                    strokeWidth={0.5}
                  />
                  <text
                    x={mx}
                    y={my + 4}
                    textAnchor="middle"
                    className="text-[10px] font-mono"
                    fill={color}
                  >
                    {edge.weight}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Nodes — entry animation with staggered bouncy scale-in */}
        {(() => {
          // Check if any node is in a non-default state (for dimUnvisited)
          const hasActiveNodes = choreo.dimUnvisited && graph.nodes.some(
            (n) => getNodeState(n.id, mutations) !== 'default',
          );

          return graph.nodes.map((node, nodeIndex) => {
            const nodeState = getNodeState(node.id, mutations);
            const nodeColor = NODE_STATE_COLORS[nodeState];
            const extraLabel = getNodeLabel(node.id, mutations);
            const entryDelay = nodeIndex * 0.03;

            // Dim unvisited nodes when the algorithm is actively traversing
            const dimmed = hasActiveNodes && nodeState === 'default';

            return (
              <motion.g
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: dimmed ? 0.5 : 1 }}
                transition={shouldReduceMotion ? { duration: 0 } : {
                  scale: { delay: entryDelay, ...springs.bouncy },
                  opacity: { delay: entryDelay, duration: 0.15 },
                }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                filter={nodeState !== 'default' ? 'url(#glow)' : undefined}
              >
                {/* Outer glow for active nodes — intensity driven by choreography */}
                {nodeState !== 'default' && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 4}
                    fill="none"
                    initial={false}
                    animate={{
                      stroke: nodeColor,
                      strokeWidth: 2,
                      opacity: choreo.activeGlow,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
                  />
                )}

                {/* Node circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  initial={false}
                  animate={{
                    fill: nodeState !== 'default' ? 'rgba(59,130,246,0.12)' : '#1f2937',
                    stroke: nodeColor,
                    strokeWidth: nodeState !== 'default' ? 2.5 : 1.5,
                  }}
                  transition={shouldReduceMotion ? { duration: 0 } : choreo.nodeTransition}
                >
                  {/* Hover tooltip (ALG-248) */}
                  <title>
                    {`Node ${node.label} | ${extraLabel ? `Info: ${extraLabel} | ` : ''}State: ${nodeState}`}
                  </title>
                </motion.circle>

                {/* Node label */}
                <text
                  x={node.x}
                  y={extraLabel ? node.y - 2 : node.y + 4}
                  textAnchor="middle"
                  className="text-xs font-semibold"
                  fill={nodeColor}
                >
                  {node.label}
                </text>

                {/* Extra info label (distance, time, etc.) */}
                {extraLabel && (
                  <text
                    x={node.x}
                    y={node.y + 14}
                    textAnchor="middle"
                    className="text-[9px] font-mono"
                    fill={nodeColor}
                    opacity={0.8}
                  >
                    {extraLabel}
                  </text>
                )}
              </motion.g>
            );
          });
        })()}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-3 flex flex-wrap gap-2 rounded-lg bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/20">
        {(
          ['current', 'visiting', 'visited', 'in-queue', 'in-path', 'discovered'] as const
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
