'use client';

import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { ERAttribute } from '@/lib/database/types';

// ── Node data shape ────────────────────────────────────────

export interface WeakEntityNodeData extends Record<string, unknown> {
  entityName: string;
  attributes: ERAttribute[];
}

export type WeakEntityNodeType = Node<WeakEntityNodeData>;

// ── Handle style ───────────────────────────────────────────

const HANDLE_CLASS =
  '!w-2.5 !h-2.5 !bg-[var(--er-weak-entity,#f59e0b)] !border-[var(--surface,#1e1e2e)]';

// ── Attribute ellipse (reused from EntityNode pattern) ─────

interface AttributeEllipseProps {
  attr: ERAttribute;
  x: number;
  y: number;
}

function AttributeEllipse({ attr, x, y }: AttributeEllipseProps) {
  const rx = 52;
  const ry = 18;

  const strokeDasharray = attr.isDerived ? '5,3' : undefined;
  const isMultivalued = attr.isMultivalued === true;

  // Partial key: dashed underline; PK: solid underline
  const showUnderline = attr.isPK || attr.isPartialKey;
  const underlineDash = attr.isPartialKey ? '3,2' : undefined;

  return (
    <g data-testid={`attribute-${attr.name}`}>
      {isMultivalued && (
        <ellipse
          cx={x}
          cy={y}
          rx={rx + 4}
          ry={ry + 4}
          fill="none"
          stroke="var(--er-attribute, #64748b)"
          strokeWidth={1.5}
          data-testid={`multivalued-outer-${attr.name}`}
        />
      )}

      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill="var(--er-attribute-bg, rgba(30, 30, 46, 0.9))"
        stroke="var(--er-attribute, #64748b)"
        strokeWidth={1.5}
        strokeDasharray={strokeDasharray}
      />

      <text
        x={x}
        y={y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fill="var(--foreground, #cdd6f4)"
        className="select-none"
      >
        {attr.name}
      </text>

      {showUnderline && (
        <line
          x1={x - attr.name.length * 3}
          y1={y + 8}
          x2={x + attr.name.length * 3}
          y2={y + 8}
          stroke="var(--foreground, #cdd6f4)"
          strokeWidth={1}
          strokeDasharray={underlineDash}
          data-testid={attr.isPartialKey ? `partial-key-${attr.name}` : `pk-underline-${attr.name}`}
        />
      )}
    </g>
  );
}

// ── Layout helpers ─────────────────────────────────────────

function computeAttributePositions(
  attributes: ERAttribute[],
  entityWidth: number,
  entityHeight: number,
): Array<{ attr: ERAttribute; x: number; y: number }> {
  const positions: Array<{ attr: ERAttribute; x: number; y: number }> = [];
  const cx = entityWidth / 2;
  const cy = entityHeight / 2;
  const radiusX = entityWidth / 2 + 80;
  const radiusY = entityHeight / 2 + 60;
  const count = attributes.length;

  if (count === 0) return positions;

  const startAngle = -Math.PI / 2;
  const step = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = startAngle + i * step;
    const x = cx + radiusX * Math.cos(angle);
    const y = cy + radiusY * Math.sin(angle);
    positions.push({ attr: attributes[i], x, y });
  }

  return positions;
}

// ── WeakEntityNode ─────────────────────────────────────────

const WeakEntityNode = memo(function WeakEntityNode({
  data,
  selected,
}: NodeProps<WeakEntityNodeType>) {
  const { entityName, attributes } = data;

  const entityWidth = 160;
  const entityHeight = 48;
  const cx = entityWidth / 2;
  const cy = entityHeight / 2;
  /** Gap between outer and inner rectangle for the double border */
  const gap = 4;

  const attrPositions = useMemo(
    () => computeAttributePositions(attributes, entityWidth, entityHeight),
    [attributes],
  );

  const padding = 80;
  const allX = attrPositions.map((p) => p.x);
  const allY = attrPositions.map((p) => p.y);

  const minX = Math.min(-gap, ...allX) - padding;
  const minY = Math.min(-gap, ...allY) - padding;
  const maxX = Math.max(entityWidth + gap, ...allX) + padding;
  const maxY = Math.max(entityHeight + gap, ...allY) + padding;
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  const borderColor = 'var(--er-weak-entity, #f59e0b)';

  return (
    <div
      className={cn(
        'relative',
        selected && 'drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]',
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
        viewBox={`${minX} ${minY} ${svgWidth} ${svgHeight}`}
        className="overflow-visible"
      >
        {/* ── Connecting lines from entity to attributes ── */}
        {attrPositions.map(({ attr, x, y }) => (
          <line
            key={`line-${attr.id}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="var(--er-attribute, #64748b)"
            strokeWidth={1}
          />
        ))}

        {/* ── Outer rectangle (double border) ── */}
        <rect
          x={-gap}
          y={-gap}
          width={entityWidth + gap * 2}
          height={entityHeight + gap * 2}
          rx={6}
          fill="none"
          stroke={borderColor}
          strokeWidth={2}
          data-testid="weak-entity-outer-rect"
        />

        {/* ── Inner rectangle ── */}
        <rect
          x={0}
          y={0}
          width={entityWidth}
          height={entityHeight}
          rx={4}
          fill="var(--surface, #1e1e2e)"
          stroke={borderColor}
          strokeWidth={2}
          data-testid="weak-entity-inner-rect"
        />

        {/* ── Entity name ── */}
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontWeight={600}
          fill="var(--foreground, #cdd6f4)"
          className="select-none"
          data-testid="entity-name"
        >
          {entityName}
        </text>

        {/* ── Attribute ellipses ── */}
        {attrPositions.map(({ attr, x, y }) => (
          <AttributeEllipse key={attr.id} attr={attr} x={x} y={y} />
        ))}
      </svg>
    </div>
  );
});

WeakEntityNode.displayName = 'WeakEntityNode';

export default WeakEntityNode;
