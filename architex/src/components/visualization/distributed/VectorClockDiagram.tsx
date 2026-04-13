// ⚠️ WARNING: This component is NOT currently used by the distributed module.
// The active visualization is embedded in src/components/modules/DistributedModule.tsx.
// See DIS-024 and DIS-025 for the plan to integrate this component.
// DO NOT MODIFY this file expecting changes to appear in the app.

'use client';

// ─────────────────────────────────────────────────────────────
// VectorClockDiagram — Space-Time Diagram
// ─────────────────────────────────────────────────────────────
//
// Dimensions: 100% width x 320px height (configurable)
// Rendering: SVG
// Features:
//   - Vertical process timelines
//   - Event dots on timelines (local, send, receive)
//   - Diagonal arrows for send/receive pairs
//   - Clock values shown at each event
//   - Concurrent events highlighted (amber) vs causal (blue)
//
// Animation: 300ms fade-in for new events
// Performance: SVG fine for ~50 events across ~5 processes
// Accessibility: Descriptive aria-labels, table fallback
// Responsive: SVG viewBox scales horizontally
// Implementation effort: L
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import type { ClockEvent } from '@/lib/distributed/vector-clock';

// ── Types ───────────────────────────────────────────────────

export interface VectorClockDiagramProps {
  processIds: string[];
  events: ClockEvent[];
  /** Pair of event IDs to highlight as concurrent. */
  concurrentPair?: [number, number] | null;
  height?: number;
  className?: string;
}

// ── Constants ───────────────────────────────────────────────

const PADDING = { top: 40, right: 30, bottom: 30, left: 30 };
const PROCESS_HEADER_HEIGHT = 24;
const EVENT_DOT_RADIUS = 6;
const EVENT_SPACING_Y = 40; // vertical space per tick

const EVENT_COLORS = {
  local:   '#3B82F6', // blue
  send:    '#22C55E', // green
  receive: '#A855F7', // purple
};

// ── Component ───────────────────────────────────────────────

export const VectorClockDiagram = memo(function VectorClockDiagram({
  processIds,
  events,
  concurrentPair,
  height = 320,
  className,
}: VectorClockDiagramProps) {
  const processCount = processIds.length;

  // Compute SVG dimensions
  const svgWidth = Math.max(processCount * 120, 400);
  const maxTick = events.length > 0 ? Math.max(...events.map((e) => e.tick)) : 0;
  const computedHeight = Math.max(
    height,
    PADDING.top + PROCESS_HEADER_HEIGHT + maxTick * EVENT_SPACING_Y + PADDING.bottom,
  );

  // Process X positions
  const processX = useMemo(() => {
    const spacing = (svgWidth - PADDING.left - PADDING.right) / Math.max(processCount - 1, 1);
    return processIds.map((_, i) => PADDING.left + i * spacing);
  }, [processIds, processCount, svgWidth]);

  // Map events to Y position (by tick)
  const eventY = (tick: number) => PADDING.top + PROCESS_HEADER_HEIGHT + tick * EVENT_SPACING_Y;
  const processXMap = new Map(processIds.map((pid, i) => [pid, processX[i]]));

  // Build send/receive pairs for arrows
  const sendReceivePairs = useMemo(() => {
    const pairs: Array<{
      sendEvent: ClockEvent;
      receiveEvent: ClockEvent;
    }> = [];

    // Match send events with their corresponding receive events
    for (const evt of events) {
      if (evt.type === 'receive' && evt.targetProcessId) {
        // Find the most recent send from targetProcessId to processId
        const matchingSend = events.find(
          (e) =>
            e.type === 'send' &&
            e.processId === evt.targetProcessId &&
            e.targetProcessId === evt.processId &&
            e.tick < evt.tick,
        );
        if (matchingSend) {
          pairs.push({ sendEvent: matchingSend, receiveEvent: evt });
        }
      }
    }
    return pairs;
  }, [events]);

  // Concurrent event IDs
  const concurrentSet = useMemo(() => {
    const s = new Set<number>();
    if (concurrentPair) {
      s.add(concurrentPair[0]);
      s.add(concurrentPair[1]);
    }
    return s;
  }, [concurrentPair]);

  return (
    <div
      className={cn(
        'overflow-auto rounded-lg border border-border bg-elevated',
        className,
      )}
      style={{ maxHeight: height }}
    >
      <svg
        viewBox={`0 0 ${svgWidth} ${computedHeight}`}
        width={svgWidth}
        height={computedHeight}
        role="img"
        aria-label={`Space-time diagram with ${processCount} processes and ${events.length} events`}
      >
        {/* Process labels */}
        {processIds.map((pid, i) => (
          <text
            key={pid}
            x={processX[i]}
            y={PADDING.top}
            textAnchor="middle"
            fontSize={12}
            fontWeight={700}
            fontFamily="ui-monospace"
            fill="rgba(255,255,255,0.8)"
          >
            {pid}
          </text>
        ))}

        {/* Process timeline lines */}
        {processIds.map((pid, i) => (
          <line
            key={`line-${pid}`}
            x1={processX[i]}
            y1={PADDING.top + PROCESS_HEADER_HEIGHT}
            x2={processX[i]}
            y2={computedHeight - PADDING.bottom}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1.5}
          />
        ))}

        {/* Send/Receive arrows */}
        {sendReceivePairs.map((pair, i) => {
          const sx = processXMap.get(pair.sendEvent.processId) ?? 0;
          const sy = eventY(pair.sendEvent.tick);
          const rx = processXMap.get(pair.receiveEvent.processId) ?? 0;
          const ry = eventY(pair.receiveEvent.tick);

          return (
            <g key={`arrow-${i}`}>
              <motion.line
                x1={sx} y1={sy}
                x2={rx} y2={ry}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1}
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
              {/* Arrowhead */}
              <circle
                cx={rx} cy={ry}
                r={2}
                fill="rgba(255,255,255,0.4)"
              />
            </g>
          );
        })}

        {/* Event dots */}
        {events.map((evt) => {
          const x = processXMap.get(evt.processId) ?? 0;
          const y = eventY(evt.tick);
          const color = EVENT_COLORS[evt.type];
          const isConcurrent = concurrentSet.has(evt.id);

          return (
            <g key={evt.id} aria-label={evt.description}>
              {/* Concurrent highlight ring */}
              {isConcurrent && (
                <motion.circle
                  cx={x} cy={y}
                  r={EVENT_DOT_RADIUS + 4}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.6, 0.2, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <motion.circle
                cx={x} cy={y}
                r={EVENT_DOT_RADIUS}
                fill={isConcurrent ? '#F59E0B' : color}
                stroke={isConcurrent ? '#F59E0B' : 'rgba(255,255,255,0.2)'}
                strokeWidth={1}
                initial={{ r: 0 }}
                animate={{ r: EVENT_DOT_RADIUS }}
                transition={{ duration: 0.2 }}
              />

              {/* Clock value label */}
              <text
                x={x + EVENT_DOT_RADIUS + 4}
                y={y + 3}
                fontSize={7}
                fontFamily="ui-monospace"
                fill="rgba(255,255,255,0.5)"
              >
                [{formatClock(evt.clock, processIds)}]
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

VectorClockDiagram.displayName = 'VectorClockDiagram';

// ── Clock Formatter ─────────────────────────────────────────

function formatClock(
  clock: Record<string, number>,
  processIds: string[],
): string {
  return processIds.map((pid) => clock[pid] ?? 0).join(',');
}
