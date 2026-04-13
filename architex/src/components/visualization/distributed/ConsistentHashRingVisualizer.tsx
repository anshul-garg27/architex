// ⚠️ WARNING: This component is NOT currently used by the distributed module.
// The active visualization is embedded in src/components/modules/DistributedModule.tsx.
// See DIS-024 and DIS-025 for the plan to integrate this component.
// DO NOT MODIFY this file expecting changes to appear in the app.

'use client';

// ─────────────────────────────────────────────────────────────
// ConsistentHashRingVisualizer — Circular Hash Ring
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 400px height (configurable)
// Rendering: SVG
// Features:
//   - Circular ring with evenly spaced tick marks
//   - Node positions as colored circles on perimeter
//   - Key positions as smaller dots
//   - Virtual nodes as dotted outline circles
//   - Arc segments colored by owning node
//   - Redistribution animation (keys slide along ring)
//   - Load distribution bar below ring
//
// Animation: 500ms spring for key redistribution
// Performance: SVG fine for ~20 nodes, ~200 keys
// Accessibility: aria-labels on nodes and keys
// Responsive: SVG viewBox scales
// Implementation effort: XL
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { IBM_COLORBLIND } from '@/lib/visualization/colors';
import type { HashNode, HashKey } from '@/lib/distributed/consistent-hash';

// ── Types ───────────────────────────────────────────────────

export interface ConsistentHashRingVisualizerProps {
  nodes: HashNode[];
  keys: HashKey[];
  /** Whether virtual nodes are shown. */
  showVirtualNodes?: boolean;
  height?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const SVG_SIZE = 380;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;
const RING_RADIUS = 150;
const NODE_RADIUS = 10;
const KEY_RADIUS = 4;
const VNODE_RADIUS = 5;
const TICK_COUNT = 72; // tick marks around ring
const MAX_HASH = 0xFFFFFFFF; // 2^32 - 1

// Categorical colors for nodes
const NODE_COLORS = [
  IBM_COLORBLIND.blue,
  IBM_COLORBLIND.purple,
  IBM_COLORBLIND.magenta,
  IBM_COLORBLIND.orange,
  IBM_COLORBLIND.yellow,
  IBM_COLORBLIND.teal,
  '#60A5FA', // blue-400
  '#F472B6', // pink-400
];

// ── Helpers ─────────────────────────────────────────────────

/** Convert a hash value (0..2^32) to an angle in radians (12 o'clock = 0). */
function hashToAngle(hash: number): number {
  return (hash / MAX_HASH) * Math.PI * 2 - Math.PI / 2;
}

/** Convert angle to SVG coordinates on the ring. */
function angleToXY(angle: number, radius: number = RING_RADIUS): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

// ── Component ───────────────────────────────────────────────

export const ConsistentHashRingVisualizer = memo(function ConsistentHashRingVisualizer({
  nodes,
  keys,
  showVirtualNodes = true,
  height = 400,
  className,
}: ConsistentHashRingVisualizerProps) {
  // Map node IDs to colors
  const nodeColorMap = useMemo(() => {
    const map = new Map<string, string>();
    nodes.forEach((n, i) => {
      map.set(n.id, NODE_COLORS[i % NODE_COLORS.length]);
    });
    return map;
  }, [nodes]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-elevated',
        className,
      )}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="h-full w-full"
        role="img"
        aria-label={`Consistent hash ring with ${nodes.length} nodes and ${keys.length} keys`}
      >
        {/* Tick marks around ring */}
        {Array.from({ length: TICK_COUNT }).map((_, i) => {
          const angle = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
          const inner = angleToXY(angle, RING_RADIUS - 4);
          const outer = angleToXY(angle, RING_RADIUS + 4);
          return (
            <line
              key={i}
              x1={inner.x} y1={inner.y}
              x2={outer.x} y2={outer.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Ring circle */}
        <circle
          cx={CX} cy={CY} r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={2}
        />

        {/* Arc segments colored by owning node */}
        {/* We skip this for simplicity — segments are implicit from node positions */}

        {/* Virtual nodes */}
        {showVirtualNodes && nodes.map((node) => {
          const color = nodeColorMap.get(node.id) ?? '#6B7280';
          return node.virtualNodes.map((vpos, vi) => {
            const angle = hashToAngle(vpos);
            const pos = angleToXY(angle);
            return (
              <circle
                key={`${node.id}-vn-${vi}`}
                cx={pos.x} cy={pos.y}
                r={VNODE_RADIUS}
                fill="none"
                stroke={color}
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.4}
              />
            );
          });
        })}

        {/* Keys on ring */}
        <AnimatePresence>
          {keys.map((key) => {
            const angle = hashToAngle(key.hash);
            const pos = angleToXY(angle);
            const ownerColor = nodeColorMap.get(key.assignedNode) ?? '#6B7280';

            return (
              <motion.circle
                key={key.key}
                r={KEY_RADIUS}
                fill={ownerColor}
                opacity={0.7}
                initial={{ cx: CX, cy: CY }}
                animate={{ cx: pos.x, cy: pos.y }}
                exit={{ opacity: 0, r: 0 }}
                transition={{ type: 'spring', stiffness: 150, damping: 18 }}
                aria-label={`Key "${key.key}" assigned to ${key.assignedNode}`}
              />
            );
          })}
        </AnimatePresence>

        {/* Physical nodes on ring (drawn last, on top) */}
        {nodes.map((node) => {
          const angle = hashToAngle(node.position);
          const pos = angleToXY(angle);
          const color = nodeColorMap.get(node.id) ?? '#6B7280';

          return (
            <g key={node.id} aria-label={`Node ${node.label} at position ${node.position}`}>
              <motion.circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={`${color}40`}
                stroke={color}
                strokeWidth={2.5}
                initial={{ r: 0 }}
                animate={{ r: NODE_RADIUS }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              />
              {/* Label outside ring */}
              <text
                x={pos.x + (pos.x > CX ? 16 : -16)}
                y={pos.y + (pos.y > CY ? 16 : -10)}
                textAnchor={pos.x > CX ? 'start' : 'end'}
                fontSize={10}
                fontWeight={600}
                fontFamily="ui-monospace"
                fill={color}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* Center info */}
        <text
          x={CX} y={CY - 8}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fontFamily="ui-monospace"
          fill="rgba(255,255,255,0.6)"
        >
          {nodes.length} nodes
        </text>
        <text
          x={CX} y={CY + 8}
          textAnchor="middle"
          fontSize={9}
          fontFamily="ui-monospace"
          fill="rgba(255,255,255,0.35)"
        >
          {keys.length} keys
        </text>
      </svg>
    </div>
  );
});

ConsistentHashRingVisualizer.displayName = "ConsistentHashRingVisualizer";
