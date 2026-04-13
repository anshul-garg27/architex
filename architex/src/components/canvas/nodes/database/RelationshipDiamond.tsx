'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '@/lib/utils';

// ── Node data shape ────────────────────────────────────────

export interface RelationshipDiamondData extends Record<string, unknown> {
  relationshipName: string;
  cardinality: '1:1' | '1:N' | 'M:N';
  /** Chen notation: double diamond for identifying relationship */
  isIdentifying?: boolean;
  /** Chen notation: total (double line) vs partial (single line) per side */
  participation?: {
    entity1: 'total' | 'partial';
    entity2: 'total' | 'partial';
  };
}

export type RelationshipDiamondType = Node<RelationshipDiamondData>;

// ── Handle style ───────────────────────────────────────────

const HANDLE_CLASS =
  '!w-2.5 !h-2.5 !bg-[var(--er-relationship,#10b981)] !border-[var(--surface,#1e1e2e)]';

// ── Diamond dimensions ─────────────────────────────────────

const DIAMOND_W = 120;
const DIAMOND_H = 70;
const HALF_W = DIAMOND_W / 2;
const HALF_H = DIAMOND_H / 2;
const GAP = 5; // gap between outer/inner diamond for identifying relationships

// ── Diamond path generators ────────────────────────────────

function diamondPath(cx: number, cy: number, hw: number, hh: number): string {
  return [
    `M ${cx} ${cy - hh}`,
    `L ${cx + hw} ${cy}`,
    `L ${cx} ${cy + hh}`,
    `L ${cx - hw} ${cy}`,
    'Z',
  ].join(' ');
}

// ── Participation line component (edge-side decoration) ────

interface ParticipationLabelProps {
  side: 'left' | 'right';
  label: string;
  participation: 'total' | 'partial';
  cx: number;
  cy: number;
}

function ParticipationLabel({
  side,
  label,
  participation,
  cx,
  cy,
}: ParticipationLabelProps) {
  const isTotal = participation === 'total';
  const offsetX = side === 'left' ? -HALF_W - 20 : HALF_W + 20;
  const labelX = side === 'left' ? -HALF_W - 14 : HALF_W + 14;

  return (
    <g>
      {/* Participation indicator line(s) extending from diamond */}
      <line
        x1={side === 'left' ? cx - HALF_W : cx + HALF_W}
        y1={cy}
        x2={cx + offsetX}
        y2={cy}
        stroke="var(--er-relationship, #10b981)"
        strokeWidth={isTotal ? 3 : 1.5}
        data-testid={`participation-${side}`}
      />
      {/* For total participation, add a second parallel line */}
      {isTotal && (
        <line
          x1={side === 'left' ? cx - HALF_W : cx + HALF_W}
          y1={cy - 3}
          x2={cx + offsetX}
          y2={cy - 3}
          stroke="var(--er-relationship, #10b981)"
          strokeWidth={1.5}
          data-testid={`participation-${side}-total`}
        />
      )}
      {/* Cardinality label */}
      <text
        x={cx + labelX}
        y={cy - 10}
        textAnchor="middle"
        fontSize={12}
        fontWeight={600}
        fill="var(--foreground, #cdd6f4)"
        data-testid={`cardinality-label-${side}`}
      >
        {label}
      </text>
    </g>
  );
}

// ── RelationshipDiamond ────────────────────────────────────

const RelationshipDiamond = memo(function RelationshipDiamond({
  data,
  selected,
}: NodeProps<RelationshipDiamondType>) {
  const {
    relationshipName,
    cardinality,
    isIdentifying = false,
    participation,
  } = data;

  // Parse cardinality labels for each side
  const [leftLabel, rightLabel] = cardinality.split(':') as [string, string];

  const svgPadding = 40;
  const svgWidth = DIAMOND_W + svgPadding * 2;
  const svgHeight = DIAMOND_H + svgPadding * 2;
  const cx = svgWidth / 2;
  const cy = svgHeight / 2;

  const borderColor = 'var(--er-relationship, #10b981)';

  return (
    <div
      className={cn(
        'relative',
        selected && 'drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      )}
    >
      {/* ── Handles ── */}
      <Handle type="source" position={Position.Top} id="top" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Top} id="top-target" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} id="right" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Right} id="right-target" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Left} id="left" className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Left} id="left-target" className={HANDLE_CLASS} />

      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* ── Outer diamond for identifying relationship ── */}
        {isIdentifying && (
          <path
            d={diamondPath(cx, cy, HALF_W + GAP, HALF_H + GAP)}
            fill="none"
            stroke={borderColor}
            strokeWidth={2}
            data-testid="identifying-outer-diamond"
          />
        )}

        {/* ── Main diamond ── */}
        <path
          d={diamondPath(cx, cy, HALF_W, HALF_H)}
          fill="var(--surface, #1e1e2e)"
          stroke={borderColor}
          strokeWidth={2}
          data-testid="relationship-diamond"
        />

        {/* ── Relationship name ── */}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={600}
          fill="var(--foreground, #cdd6f4)"
          className="select-none"
          data-testid="relationship-name"
        >
          {relationshipName}
        </text>

        {/* ── Cardinality + participation indicators ── */}
        <ParticipationLabel
          side="left"
          label={leftLabel}
          participation={participation?.entity1 ?? 'partial'}
          cx={cx}
          cy={cy}
        />
        <ParticipationLabel
          side="right"
          label={rightLabel}
          participation={participation?.entity2 ?? 'partial'}
          cx={cx}
          cy={cy}
        />
      </svg>
    </div>
  );
});

RelationshipDiamond.displayName = 'RelationshipDiamond';

export default RelationshipDiamond;
