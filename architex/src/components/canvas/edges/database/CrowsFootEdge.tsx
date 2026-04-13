'use client';

/**
 * Crow's Foot Edge for ER Diagrams  (DBL-008)
 *
 * Custom React Flow edge with crow's foot notation markers.
 * Supports: one (|), many (>), zero-one (o|), zero-many (o>), one-many (||>).
 */

import React, { memo } from 'react';
import {
  getBezierPath,
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
  type Edge,
} from '@xyflow/react';

// ── Types ─────────────────────────────────────────────────────

export type CrowsFootCardinality =
  | 'one'       // |
  | 'many'      // >
  | 'zero-one'  // o|
  | 'zero-many' // o>
  | 'one-many'; // ||>

export interface CrowsFootEdgeData extends Record<string, unknown> {
  label?: string;
  sourceCardinality?: CrowsFootCardinality;
  targetCardinality?: CrowsFootCardinality;
}

export type CrowsFootEdgeType = Edge<CrowsFootEdgeData>;

// ── Marker IDs ────────────────────────────────────────────────

export const CF_MARKER_ONE        = 'cf-one';
export const CF_MARKER_MANY       = 'cf-many';
export const CF_MARKER_ZERO_ONE   = 'cf-zero-one';
export const CF_MARKER_ZERO_MANY  = 'cf-zero-many';
export const CF_MARKER_ONE_MANY   = 'cf-one-many';

const MARKER_IDS: Record<CrowsFootCardinality, string> = {
  one:       CF_MARKER_ONE,
  many:      CF_MARKER_MANY,
  'zero-one':  CF_MARKER_ZERO_ONE,
  'zero-many': CF_MARKER_ZERO_MANY,
  'one-many':  CF_MARKER_ONE_MANY,
};

// ── Marker SVG Definitions ────────────────────────────────────

const MARKER_COLOR = 'var(--er-relationship, #10b981)';

/**
 * Render all crow's foot marker definitions inside an SVG <defs>.
 * Place this component once inside a React Flow wrapper.
 */
export function CrowsFootMarkerDefs() {
  return (
    <svg className="absolute h-0 w-0" aria-hidden>
      <defs>
        {/* ── One: single perpendicular bar ── */}
        <marker
          id={CF_MARKER_ONE}
          viewBox="0 0 16 16"
          refX="14"
          refY="8"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line
            x1="12" y1="2" x2="12" y2="14"
            stroke={MARKER_COLOR}
            strokeWidth="2"
          />
        </marker>

        {/* ── Many: three-pronged fork (crow's foot) ── */}
        <marker
          id={CF_MARKER_MANY}
          viewBox="0 0 20 16"
          refX="16"
          refY="8"
          markerWidth="20"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line x1="4" y1="8" x2="16" y2="2"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="4" y1="8" x2="16" y2="8"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="4" y1="8" x2="16" y2="14" stroke={MARKER_COLOR} strokeWidth="1.5" />
        </marker>

        {/* ── Zero-One: circle + bar ── */}
        <marker
          id={CF_MARKER_ZERO_ONE}
          viewBox="0 0 24 16"
          refX="20"
          refY="8"
          markerWidth="24"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <circle
            cx="8" cy="8" r="4"
            fill="none"
            stroke={MARKER_COLOR}
            strokeWidth="1.5"
          />
          <line
            x1="16" y1="2" x2="16" y2="14"
            stroke={MARKER_COLOR}
            strokeWidth="2"
          />
        </marker>

        {/* ── Zero-Many: circle + fork ── */}
        <marker
          id={CF_MARKER_ZERO_MANY}
          viewBox="0 0 28 16"
          refX="24"
          refY="8"
          markerWidth="28"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <circle
            cx="6" cy="8" r="4"
            fill="none"
            stroke={MARKER_COLOR}
            strokeWidth="1.5"
          />
          <line x1="12" y1="8"  x2="24" y2="2"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="12" y1="8"  x2="24" y2="8"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="12" y1="8"  x2="24" y2="14" stroke={MARKER_COLOR} strokeWidth="1.5" />
        </marker>

        {/* ── One-Many: double bar + fork ── */}
        <marker
          id={CF_MARKER_ONE_MANY}
          viewBox="0 0 28 16"
          refX="24"
          refY="8"
          markerWidth="28"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line x1="4"  y1="2" x2="4"  y2="14" stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="8"  y1="2" x2="8"  y2="14" stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="12" y1="8" x2="24" y2="2"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="12" y1="8" x2="24" y2="8"  stroke={MARKER_COLOR} strokeWidth="1.5" />
          <line x1="12" y1="8" x2="24" y2="14" stroke={MARKER_COLOR} strokeWidth="1.5" />
        </marker>
      </defs>
    </svg>
  );
}

// ── Edge Component ────────────────────────────────────────────

const CrowsFootEdge = memo(function CrowsFootEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CrowsFootEdgeType>) {
  const edgeData = data as CrowsFootEdgeData | undefined;
  const sourceCard = edgeData?.sourceCardinality;
  const targetCard = edgeData?.targetCardinality;
  const label = edgeData?.label;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const markerStart = sourceCard ? `url(#${MARKER_IDS[sourceCard]})` : undefined;
  const markerEnd = targetCard ? `url(#${MARKER_IDS[targetCard]})` : undefined;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={{
          stroke: MARKER_COLOR,
          strokeWidth: selected ? 2.5 : 2,
          filter: selected
            ? 'drop-shadow(0 0 4px var(--er-relationship, #10b981))'
            : undefined,
        }}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-auto absolute rounded-md bg-[var(--surface,#1e1e2e)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--er-relationship,#10b981)] border border-[var(--border,#313244)]"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

CrowsFootEdge.displayName = 'CrowsFootEdge';

export default CrowsFootEdge;
