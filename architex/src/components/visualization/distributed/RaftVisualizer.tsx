// ⚠️ WARNING: This component is NOT currently used by the distributed module.
// The active visualization is embedded in src/components/modules/DistributedModule.tsx.
// See DIS-024 and DIS-025 for the plan to integrate this component.
// DO NOT MODIFY this file expecting changes to appear in the app.

'use client';

// ─────────────────────────────────────────────────────────────
// RaftVisualizer — Raft Consensus Protocol Visualization
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 480px height
// Rendering: SVG (interactive) + HTML (log panel)
// Layout: Pentagon arrangement for 5 nodes
// Features:
//   - Node colors by role (follower=gray, candidate=amber, leader=green)
//   - Animated RPC arrows between nodes (messages flying)
//   - Log visualization (scrollable list per node)
//   - Term number as prominent badge
//   - Election progress indicator (arc fills as votes arrive)
//   - Partition visualization (red dashed line)
//
// Animation: RPC arrows fly in 400ms; role transitions 300ms
// Performance: SVG fine for 3-7 nodes
// Accessibility: aria-labels on nodes, live region for events
// Responsive: SVG viewBox scales; log panel scrolls
// Implementation effort: XL
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { RAFT_ROLE_COLORS } from '@/lib/visualization/colors';
import type { RaftNode, RaftMessage, RaftEvent } from '@/lib/distributed/raft';

// ── Types ───────────────────────────────────────────────────

export interface RaftVisualizerProps {
  nodes: RaftNode[];
  /** In-flight messages (current tick). */
  messages: RaftMessage[];
  /** Recent events for the event log. */
  events: RaftEvent[];
  /** Node IDs in each partition group (empty = no partition). */
  partitionGroups?: Set<string>[];
  /** Current leader id. */
  leaderId: string | null;
  height?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const NODE_RADIUS = 28;
const SVG_WIDTH = 420;
const SVG_HEIGHT = 300;
const LOG_PANEL_HEIGHT = 160;

// ── Pentagon Layout ─────────────────────────────────────────

function pentagonPositions(
  count: number,
  cx: number,
  cy: number,
  radius: number,
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    // Start from top (-PI/2) and go clockwise
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    positions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return positions;
}

// ── Component ───────────────────────────────────────────────

export const RaftVisualizer = memo(function RaftVisualizer({
  nodes,
  messages,
  events,
  partitionGroups,
  leaderId,
  height = 480,
  className,
}: RaftVisualizerProps) {
  const positions = useMemo(
    () => pentagonPositions(nodes.length, SVG_WIDTH / 2, SVG_HEIGHT / 2, 110),
    [nodes.length],
  );

  const nodePositionMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      if (positions[i]) map.set(n.id, positions[i]);
    });
    return map;
  }, [nodes, positions]);

  // Determine partition line (if any)
  const hasPartition = partitionGroups && partitionGroups.length === 2;

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border border-border bg-elevated overflow-hidden',
        className,
      )}
      style={{ height }}
    >
      {/* SVG Node Diagram */}
      <div className="relative flex-shrink-0" style={{ height: SVG_HEIGHT }}>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="h-full w-full"
          role="img"
          aria-label={`Raft cluster with ${nodes.length} nodes. Leader: ${leaderId ?? 'none'}.`}
        >
          {/* Partition line */}
          {hasPartition && <PartitionLine groups={partitionGroups} nodePositionMap={nodePositionMap} />}

          {/* Animated RPC arrows */}
          <AnimatePresence>
            {messages.map((msg, i) => {
              const from = nodePositionMap.get(msg.from);
              const to = nodePositionMap.get(msg.to);
              if (!from || !to) return null;

              const isVote = msg.type === 'RequestVote' || msg.type === 'RequestVoteResponse';
              const color = isVote ? '#F59E0B' : '#3B82F6';

              return (
                <motion.g key={`${msg.from}-${msg.to}-${msg.type}-${i}`}>
                  {/* Arrow line */}
                  <motion.line
                    x1={from.x}
                    y1={from.y}
                    x2={from.x}
                    y2={from.y}
                    stroke={color}
                    strokeWidth={2}
                    strokeDasharray="4 3"
                    initial={{ x2: from.x, y2: from.y, opacity: 0 }}
                    animate={{ x2: to.x, y2: to.y, opacity: 0.8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  {/* Flying dot */}
                  <motion.circle
                    r={4}
                    fill={color}
                    initial={{ cx: from.x, cy: from.y, opacity: 1 }}
                    animate={{ cx: to.x, cy: to.y, opacity: 0.3 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                  {/* Message type label */}
                  <motion.text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize={7}
                    fontFamily="ui-monospace"
                    fill={color}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.type.replace('Response', 'Resp')}
                  </motion.text>
                </motion.g>
              );
            })}
          </AnimatePresence>

          {/* Nodes */}
          {nodes.map((node, i) => {
            const pos = positions[i];
            if (!pos) return null;
            const roleColor = RAFT_ROLE_COLORS[node.role];
            const isLeader = node.id === leaderId;

            return (
              <g
                key={node.id}
                aria-label={`${node.id}: ${node.role}, term ${node.term}`}
              >
                {/* Leader glow */}
                {isLeader && (
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 6}
                    fill="none"
                    stroke={RAFT_ROLE_COLORS.leader}
                    strokeWidth={1.5}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Node circle */}
                <motion.circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  initial={false}
                  animate={{
                    fill: `${roleColor}30`,
                    stroke: roleColor,
                  }}
                  transition={{ duration: 0.3 }}
                  strokeWidth={2}
                />

                {/* Node ID */}
                <text
                  x={pos.x}
                  y={pos.y - 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="ui-monospace"
                  fill="white"
                >
                  {node.id.replace('node-', 'N')}
                </text>

                {/* Role label */}
                <text
                  x={pos.x}
                  y={pos.y + 8}
                  textAnchor="middle"
                  fontSize={7}
                  fontFamily="ui-monospace"
                  fill={roleColor}
                  opacity={0.8}
                >
                  {node.role.toUpperCase()}
                </text>

                {/* Term badge */}
                <rect
                  x={pos.x + NODE_RADIUS - 6}
                  y={pos.y - NODE_RADIUS - 6}
                  width={20}
                  height={14}
                  rx={3}
                  fill="#1F2937"
                  stroke={roleColor}
                  strokeWidth={1}
                />
                <text
                  x={pos.x + NODE_RADIUS + 4}
                  y={pos.y - NODE_RADIUS + 2}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={700}
                  fontFamily="ui-monospace"
                  fill={roleColor}
                >
                  T{node.term}
                </text>

                {/* Log length indicator */}
                <text
                  x={pos.x}
                  y={pos.y + NODE_RADIUS + 14}
                  textAnchor="middle"
                  fontSize={7}
                  fontFamily="ui-monospace"
                  fill="rgba(255,255,255,0.4)"
                >
                  log: {node.log.length} | ci: {node.commitIndex}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Event Log Panel */}
      <div
        className="flex-1 overflow-y-auto border-t border-border bg-[var(--background)] p-2"
        style={{ maxHeight: LOG_PANEL_HEIGHT }}
        role="log"
        aria-label="Raft event log"
      >
        <div className="mb-1 text-[9px] font-mono font-semibold text-foreground-muted">
          EVENT LOG
        </div>
        {events.length === 0 ? (
          <div className="text-[10px] text-foreground-muted">No events yet</div>
        ) : (
          <div className="space-y-0.5">
            {events.slice(-20).reverse().map((evt, i) => (
              <div
                key={`${evt.tick}-${evt.type}-${i}`}
                className="flex items-start gap-2 text-[10px] font-mono"
              >
                <span className="shrink-0 text-foreground-subtle">
                  [{evt.tick.toString().padStart(4, '0')}]
                </span>
                <span
                  className="shrink-0 rounded px-1"
                  style={{
                    backgroundColor: getEventColor(evt.type) + '20',
                    color: getEventColor(evt.type),
                  }}
                >
                  {evt.type}
                </span>
                <span className="text-foreground-muted">{evt.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

RaftVisualizer.displayName = 'RaftVisualizer';

// ── Partition Line ──────────────────────────────────────────

function PartitionLine({
  groups,
  nodePositionMap,
}: {
  groups: Set<string>[];
  nodePositionMap: Map<string, { x: number; y: number }>;
}) {
  // Draw a dashed red line separating the two groups
  // Find the midpoint between the two group centroids
  const centroid = (group: Set<string>) => {
    let cx = 0, cy = 0, count = 0;
    for (const id of group) {
      const pos = nodePositionMap.get(id);
      if (pos) { cx += pos.x; cy += pos.y; count++; }
    }
    return count > 0 ? { x: cx / count, y: cy / count } : { x: 0, y: 0 };
  };

  const c1 = centroid(groups[0]);
  const c2 = centroid(groups[1]);
  const midX = (c1.x + c2.x) / 2;
  const midY = (c1.y + c2.y) / 2;

  // Perpendicular to the line connecting centroids
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / len;
  const perpY = dx / len;
  const extend = 150;

  return (
    <motion.line
      x1={midX + perpX * extend}
      y1={midY + perpY * extend}
      x2={midX - perpX * extend}
      y2={midY - perpY * extend}
      stroke="#EF4444"
      strokeWidth={2}
      strokeDasharray="8 4"
      opacity={0.6}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
    />
  );
}

// ── Event Color Mapping ─────────────────────────────────────

function getEventColor(type: string): string {
  switch (type) {
    case 'become-leader':   return '#22C55E';
    case 'election-timeout': return '#F59E0B';
    case 'vote-request':    return '#F59E0B';
    case 'vote-granted':    return '#22C55E';
    case 'vote-denied':     return '#EF4444';
    case 'heartbeat':       return '#3B82F6';
    case 'append-entries':  return '#3B82F6';
    case 'log-committed':   return '#22C55E';
    case 'node-crash':      return '#EF4444';
    case 'node-recover':    return '#06B6D4';
    case 'network-partition': return '#EF4444';
    default: return '#6B7280';
  }
}
