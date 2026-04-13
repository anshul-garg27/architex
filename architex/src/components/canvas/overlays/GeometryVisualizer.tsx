'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { Point2D, GeometryElementState } from '@/lib/algorithms';
import type { AnimationStep, VisualMutation } from '@/lib/algorithms';
import { duration } from '@/lib/constants/motion';
import { GEOMETRY_POINT_STATE_COLORS as POINT_STATE_COLORS } from '@/lib/algorithms/visualization-colors';

// ── Constants ────────────────────────────────────────────────

const POINT_RADIUS = 6;

// ── Types ────────────────────────────────────────────────────

export interface GeometryVisualizerProps {
  points: Point2D[];
  step: AnimationStep | null;
  className?: string;
  height?: number;
}

// ── Helpers ──────────────────────────────────────────────────

function getPointState(
  pointId: string,
  mutations: VisualMutation[],
): GeometryElementState {
  for (const m of mutations) {
    if (m.targetId === `point-${pointId}` && m.property === 'highlight') {
      const val = String(m.to) as GeometryElementState;
      if (val in POINT_STATE_COLORS) return val;
    }
  }
  return 'default';
}

function getHullEdges(mutations: VisualMutation[]): string[] {
  for (const m of mutations) {
    if (m.targetId === 'hull-edges' && m.property === 'label') {
      try {
        return JSON.parse(String(m.to)) as string[];
      } catch {
        return [];
      }
    }
  }
  return [];
}

function getStack(mutations: VisualMutation[]): string[] {
  for (const m of mutations) {
    if (m.targetId === 'stack' && m.property === 'label') {
      try {
        return JSON.parse(String(m.to)) as string[];
      } catch {
        return [];
      }
    }
  }
  return [];
}

// ── Component ────────────────────────────────────────────────

export const GeometryVisualizer = memo(function GeometryVisualizer({
  points,
  step,
  className,
  height = 480,
}: GeometryVisualizerProps) {
  const shouldReduceMotion = useReducedMotion();
  const mutations = step?.mutations ?? [];

  // Calculate SVG viewBox from point positions
  const viewBox = useMemo(() => {
    if (points.length === 0) return '0 0 600 400';
    const padding = 40;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;
  }, [points]);

  // Build point position lookup
  const pointPos = useMemo(() => {
    const map = new Map<string, Point2D>();
    for (const p of points) {
      map.set(p.id, p);
    }
    return map;
  }, [points]);

  // Get hull edges from mutations (connecting consecutive hull vertices)
  const hullVertexIds = getHullEdges(mutations);
  const stackIds = getStack(mutations);

  // Build hull edge pairs for drawing
  const hullEdges = useMemo(() => {
    if (hullVertexIds.length < 2) return [];
    const edges: Array<{ from: Point2D; to: Point2D }> = [];
    for (let i = 0; i < hullVertexIds.length; i++) {
      const fromP = pointPos.get(hullVertexIds[i]);
      const toP = pointPos.get(hullVertexIds[(i + 1) % hullVertexIds.length]);
      if (fromP && toP) {
        edges.push({ from: fromP, to: toP });
      }
    }
    return edges;
  }, [hullVertexIds, pointPos]);

  // Draw stack edges (connecting consecutive stack points, no closing edge)
  const stackEdges = useMemo(() => {
    if (hullVertexIds.length > 0) return []; // Don't draw stack lines when hull is final
    if (stackIds.length < 2) return [];
    const edges: Array<{ from: Point2D; to: Point2D }> = [];
    for (let i = 0; i < stackIds.length - 1; i++) {
      const fromP = pointPos.get(stackIds[i]);
      const toP = pointPos.get(stackIds[i + 1]);
      if (fromP && toP) {
        edges.push({ from: fromP, to: toP });
      }
    }
    return edges;
  }, [stackIds, hullVertexIds, pointPos]);

  if (points.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border border-border bg-elevated',
          className,
        )}
        style={{ height }}
      >
        <p className="text-sm text-foreground-muted">No points to visualize</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-elevated',
        className,
      )}
      style={{ height }}
    >
      <div className="flex h-full">
        {/* Main SVG canvas */}
        <div className="flex-1">
          <svg
            viewBox={viewBox}
            className="h-full w-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Hull edges (final closed polygon) */}
            {hullEdges.map((edge, i) => (
              <motion.line
                key={`hull-${i}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                initial={false}
                animate={{
                  stroke: '#22c55e',
                  strokeWidth: 2.5,
                  opacity: 0.8,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.moderate }}
              />
            ))}

            {/* Stack edges (partial hull being built) */}
            {stackEdges.map((edge, i) => (
              <motion.line
                key={`stack-${i}`}
                x1={edge.from.x}
                y1={edge.from.y}
                x2={edge.to.x}
                y2={edge.to.y}
                initial={false}
                animate={{
                  stroke: '#a855f7',
                  strokeWidth: 1.5,
                  opacity: 0.5,
                }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.moderate }}
                strokeDasharray="4 3"
              />
            ))}

            {/* Points */}
            {points.map((point) => {
              const state = getPointState(point.id, mutations);
              const color = POINT_STATE_COLORS[state];
              const isRejected = state === 'rejected';

              return (
                <g key={point.id}>
                  {/* Outer glow for active points */}
                  {state !== 'default' && state !== 'rejected' && (
                    <motion.circle
                      cx={point.x}
                      cy={point.y}
                      r={POINT_RADIUS + 4}
                      fill="none"
                      initial={false}
                      animate={{
                        stroke: color,
                        strokeWidth: 1.5,
                        opacity: 0.4,
                      }}
                      transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.moderate }}
                    />
                  )}

                  {/* Point circle */}
                  <motion.circle
                    cx={point.x}
                    cy={point.y}
                    r={POINT_RADIUS}
                    initial={false}
                    animate={{
                      fill: state !== 'default' ? color + '40' : '#374151',
                      stroke: color,
                      strokeWidth: state !== 'default' ? 2 : 1,
                      opacity: isRejected ? 0.4 : 1,
                    }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: duration.moderate }}
                  />

                  {/* Point label */}
                  <text
                    x={point.x}
                    y={point.y - POINT_RADIUS - 4}
                    textAnchor="middle"
                    className="text-[9px] font-mono"
                    fill={isRejected ? '#6b7280' : color}
                    opacity={isRejected ? 0.5 : 0.9}
                  >
                    {point.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Stack visualization sidebar */}
        <div className="flex w-28 flex-col border-l border-border bg-background/50 p-2">
          <div className="mb-2 flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
            <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground-muted">
              Stack
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {stackIds.length === 0 ? (
              <span className="text-[9px] text-foreground-subtle italic">
                empty
              </span>
            ) : (
              <div className="flex flex-col-reverse gap-0.5">
                {stackIds.map((id, i) => {
                  const isTop = i === stackIds.length - 1;
                  return (
                    <div
                      key={`${id}-${i}`}
                      className={cn(
                        'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono',
                        isTop
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-elevated text-foreground-muted',
                      )}
                    >
                      <span>{id}</span>
                      {isTop && (
                        <span className="text-[8px] text-purple-500">top</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-1.5 left-2 flex flex-wrap gap-2">
        {(['pivot', 'current', 'hull', 'rejected', 'processing'] as const).map(
          (s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: POINT_STATE_COLORS[s] }}
              />
              <span className="text-[8px] text-foreground-subtle">{s}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
});
