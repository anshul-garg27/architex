'use client';

import React, { memo, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';
import { animations, reducedMotion } from '@/lib/constants/motion';
import { cn } from '@/lib/utils';
import type { EdgeType, SystemDesignEdge } from '@/lib/types';
import { useSimulationStore } from '@/stores/simulation-store';
import { useViewportStore } from '@/stores/viewport-store';
import { formatLatency, formatRps } from '@/lib/simulation/format-metrics';

// ── Edge type visual styles ─────────────────────────────────

interface EdgeVisualStyle {
  stroke: string;
  strokeDasharray?: string;
}

const EDGE_STYLES: Record<EdgeType, EdgeVisualStyle> = {
  http: { stroke: 'var(--node-compute)' },                              // blue, solid
  grpc: { stroke: 'var(--node-networking)' },                           // purple, solid
  graphql: { stroke: 'var(--node-processing)' },                        // pink, solid
  websocket: { stroke: 'var(--node-storage)', strokeDasharray: '6 3' }, // green, dashed
  'message-queue': { stroke: 'var(--node-messaging)', strokeDasharray: '8 4' }, // orange, dashed
  'event-stream': { stroke: 'var(--node-observability)', strokeDasharray: '4 4' },  // amber, dashed
  'db-query': { stroke: 'var(--node-storage)' },                        // green, solid
  'cache-lookup': { stroke: 'var(--node-client)' },                     // cyan, solid
  replication: { stroke: 'var(--state-idle)', strokeDasharray: '3 3' }, // gray, dashed
};

// ── Readable labels ────────────────────────────────────────

const EDGE_LABELS: Record<EdgeType, string> = {
  http: 'HTTP',
  grpc: 'gRPC',
  graphql: 'GraphQL',
  websocket: 'WebSocket',
  'message-queue': 'Message Queue',
  'event-stream': 'Event Stream',
  'db-query': 'DB Query',
  'cache-lookup': 'Cache Lookup',
  replication: 'Replication',
};

// Animation keyframes are defined in globals.css

// ── Latency banding ─────────────────────────────────────────
// The latency chip is colour-banded by magnitude so slow hops read
// at a glance instead of every chip looking identical.

const LATENCY_FAST_MS = 5;    // <=  : muted/neutral
const LATENCY_NORMAL_MS = 20; // <=  : edge-type colour
const LATENCY_SLOW_MS = 50;   // <=  : amber; above: red

function getLatencyChipColor(latencyMs: number, edgeStroke: string): string {
  if (latencyMs > LATENCY_SLOW_MS) return 'var(--severity-critical)';
  if (latencyMs > LATENCY_NORMAL_MS) return 'var(--severity-medium)';
  if (latencyMs <= LATENCY_FAST_MS) return 'var(--state-idle)';
  return edgeStroke;
}

// Below this zoom edge chips are unreadable confetti — hide them entirely.
// Zoom comes from the viewport store (updated onMoveEnd); the boolean
// selector only re-renders edges when the threshold is actually crossed.
const EDGE_CHIP_MIN_ZOOM = 0.7;

// ── DataFlowEdge ────────────────────────────────────────────

const DataFlowEdge = memo(function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  selected,
}: EdgeProps<SystemDesignEdge>) {
  const [hovered, setHovered] = useState(false);
  const onMouseEnter = useCallback(() => setHovered(true), []);
  const onMouseLeave = useCallback(() => setHovered(false), []);

  const simStatus = useSimulationStore((s) => s.status);
  const simActive = simStatus === 'running' || simStatus === 'paused';

  // Boolean selector: re-renders only when zoom crosses the chip threshold.
  const chipsVisible = useViewportStore((s) => s.zoom >= EDGE_CHIP_MIN_ZOOM);

  const edgeData = data as Record<string, unknown> | undefined;
  const rawEdgeType = typeof edgeData?.edgeType === 'string' ? edgeData.edgeType : 'http';
  const edgeType: EdgeType = (rawEdgeType in EDGE_STYLES ? rawEdgeType : 'http') as EdgeType;
  const style = EDGE_STYLES[edgeType] ?? EDGE_STYLES.http;
  const isAnimated = typeof edgeData?.animated === 'boolean' ? edgeData.animated : false;
  const latency = typeof edgeData?.latency === 'number' ? edgeData.latency : undefined;
  const throughput = typeof edgeData?.throughput === 'number' ? edgeData.throughput : undefined;

  // Scale edge width with throughput during active simulation
  const baseWidth = 1.5;
  const computedWidth = simActive && throughput != null && throughput > 0
    ? Math.min(baseWidth + throughput / 200, 5)
    : baseWidth;

  const highlighted = selected || hovered;
  const latencyChipColor = latency != null ? getLatencyChipColor(latency, style.stroke) : undefined;

  // ── Merged sim chip ("5ms · 34rps") ──
  // Calm telemetry: one compact muted chip per edge during sim. The muted
  // token is passed as the "normal" band colour so healthy hops stay quiet
  // while the slow/critical latency banding (amber/red) is preserved.
  const simChipColor =
    latency != null ? getLatencyChipColor(latency, 'var(--state-idle)') : 'var(--state-idle)';
  const simChipParts: string[] = [];
  if (latency != null) simChipParts.push(formatLatency(latency));
  if (throughput != null && throughput > 0) simChipParts.push(`${formatRps(throughput)}rps`);
  const simChipText = simChipParts.join(' · ');

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const prefersReducedMotion = useReducedMotion();
  const isDeleting = (edgeData?.isDeleting as boolean) === true;

  // Compute stroke-dasharray for the delete animation
  // When deleting, transition from current style to a dashed pattern before fading
  const deleteDasharray = isDeleting && !prefersReducedMotion ? '4 4' : undefined;

  return (
    <motion.g
      initial={{ opacity: 1, strokeWidth: highlighted ? computedWidth + 1.5 : computedWidth }}
      animate={
        isDeleting && !prefersReducedMotion
          ? { opacity: 0, strokeWidth: 0 }
          : { opacity: 1 }
      }
      transition={
        isDeleting
          ? prefersReducedMotion
            ? reducedMotion.instantTransition
            : animations.canvas.edgeDelete.transition
          : { duration: 0 }
      }
    >
      {/* Invisible wide interaction zone for hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="react-flow__edge-interaction"
      />

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        className={isAnimated ? 'react-flow__edge-path-animated' : undefined}
        style={{
          stroke: style.stroke,
          strokeWidth: highlighted ? computedWidth + 1.5 : computedWidth,
          strokeDasharray: deleteDasharray ?? style.strokeDasharray ?? (isAnimated ? '6 4' : undefined),
          filter: highlighted ? `drop-shadow(0 0 4px ${style.stroke})` : undefined,
          transition: 'stroke-width 0.15s ease, filter 0.15s ease',
        }}
      />

      {/* Edge type label — shown on hover */}
      {hovered && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              transform: `translate(-50%, -120%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: 'var(--surface)',
              border: `1px solid ${style.stroke}`,
              color: style.stroke,
            }}
          >
            {EDGE_LABELS[edgeType]}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Sim chip — latency + rps merged into ONE compact muted chip;
          slow/critical latency banding (amber/red) still tints it.
          Hidden when zoomed out past the chip threshold. */}
      {simActive && chipsVisible && simChipText.length > 0 && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan pointer-events-none absolute rounded-md px-1.5 py-0.5 text-[10px] tabular-nums',
              highlighted ? 'font-semibold' : 'font-medium',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: highlighted ? 'var(--surface-elevated)' : 'var(--surface)',
              border: `1px solid color-mix(in srgb, ${simChipColor} 55%, transparent)`,
              color: simChipColor,
              boxShadow: highlighted
                ? `0 0 6px color-mix(in srgb, ${simChipColor} 35%, transparent)`
                : undefined,
              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {simChipText}
          </div>
        </EdgeLabelRenderer>
      )}

      {/* Idle latency chip — colour-banded by magnitude, emphasised on hover/select */}
      {!simActive && chipsVisible && latency != null && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan pointer-events-auto absolute rounded-md px-1.5 py-0.5 text-[10px] tabular-nums',
              highlighted ? 'font-semibold' : 'font-medium',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              backgroundColor: highlighted ? 'var(--surface-elevated)' : 'var(--surface)',
              border: `1px solid ${latencyChipColor}`,
              color: latencyChipColor,
              boxShadow: highlighted
                ? `0 0 6px color-mix(in srgb, ${latencyChipColor} 35%, transparent)`
                : undefined,
              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {formatLatency(latency)}
          </div>
        </EdgeLabelRenderer>
      )}
    </motion.g>
  );
});

DataFlowEdge.displayName = 'DataFlowEdge';

export default DataFlowEdge;
