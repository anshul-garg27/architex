'use client';

import React, { memo, useMemo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { cn } from '@/lib/utils';
import type { ERAttribute } from '@/lib/database/types';

// ── Node data shape ────────────────────────────────────────

export interface EntityNodeData extends Record<string, unknown> {
  entityName: string;
  attributes: ERAttribute[];
}

export type EntityNodeType = Node<EntityNodeData>;

// ── Handle style ───────────────────────────────────────────

const HANDLE_CLASS =
  '!w-2.5 !h-2.5 !bg-[var(--er-entity,#3b82f6)] !border-[var(--surface,#1e1e2e)]';

// ── Attribute ellipse sub-component ────────────────────────

interface AttributeEllipseProps {
  attr: ERAttribute;
  x: number;
  y: number;
}

function AttributeEllipse({ attr, x, y }: AttributeEllipseProps) {
  const rx = 52;
  const ry = 18;

  // Dashed border for derived attributes
  const strokeDasharray = attr.isDerived ? '5,3' : undefined;

  // Double ellipse for multivalued
  const isMultivalued = attr.isMultivalued === true;

  // Underline style: dashed for partial key, solid for primary key
  const showUnderline = attr.isPK || attr.isPartialKey;
  const underlineDash = attr.isPartialKey ? '3,2' : undefined;

  return (
    <g data-testid={`attribute-${attr.name}`}>
      {/* Outer ellipse for multivalued attributes */}
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

      {/* Main ellipse */}
      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill="var(--er-attribute-bg, rgba(30, 30, 46, 0.9))"
        stroke="var(--er-attribute, #64748b)"
        strokeWidth={1.5}
        strokeDasharray={strokeDasharray}
        data-testid={`ellipse-${attr.name}`}
      />

      {/* Attribute name text */}
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

      {/* Underline for PK or partial key */}
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

// ── Composite attribute with sub-ellipses ──────────────────

interface CompositeAttributeProps {
  attr: ERAttribute;
  x: number;
  y: number;
}

function CompositeAttribute({ attr, x, y }: CompositeAttributeProps) {
  const subAttrs = attr.subAttributes ?? [];
  const rx = 52;
  const ry = 18;

  return (
    <g data-testid={`composite-${attr.name}`}>
      {/* Parent ellipse */}
      <ellipse
        cx={x}
        cy={y}
        rx={rx}
        ry={ry}
        fill="var(--er-attribute-bg, rgba(30, 30, 46, 0.9))"
        stroke="var(--er-attribute, #64748b)"
        strokeWidth={1.5}
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

      {/* Sub-attribute ellipses spread below */}
      {subAttrs.map((sub, i) => {
        const count = subAttrs.length;
        const spread = 110;
        const subX = x + (i - (count - 1) / 2) * spread;
        const subY = y + 44;
        return (
          <g key={sub.id}>
            {/* Connecting line from parent to sub */}
            <line
              x1={x}
              y1={y + ry}
              x2={subX}
              y2={subY - 18}
              stroke="var(--er-attribute, #64748b)"
              strokeWidth={1}
            />
            <AttributeEllipse attr={sub} x={subX} y={subY} />
          </g>
        );
      })}
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

  // Distribute attributes in an ellipse around the entity
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

// ── EntityNode ─────────────────────────────────────────────

const EntityNode = memo(function EntityNode({
  data,
  selected,
}: NodeProps<EntityNodeType>) {
  const { entityName, attributes } = data;

  const entityWidth = 160;
  const entityHeight = 48;
  const cx = entityWidth / 2;
  const cy = entityHeight / 2;

  const attrPositions = useMemo(
    () => computeAttributePositions(attributes, entityWidth, entityHeight),
    [attributes],
  );

  // Compute SVG viewBox to encompass entity + attributes
  const padding = 80;
  const allX = attrPositions.map((p) => p.x);
  const allY = attrPositions.map((p) => p.y);
  // Account for composite sub-attributes extending further down
  const hasComposite = attributes.some((a) => a.isComposite && a.subAttributes?.length);
  const compositeExtra = hasComposite ? 70 : 0;

  const minX = Math.min(0, ...allX) - padding;
  const minY = Math.min(0, ...allY) - padding;
  const maxX = Math.max(entityWidth, ...allX) + padding;
  const maxY = Math.max(entityHeight, ...allY) + padding + compositeExtra;
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  const borderColor = 'var(--er-entity, #3b82f6)';

  return (
    <div
      className={cn(
        'relative',
        selected && 'drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]',
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

        {/* ── Entity rectangle ── */}
        <rect
          x={0}
          y={0}
          width={entityWidth}
          height={entityHeight}
          rx={4}
          fill="var(--surface, #1e1e2e)"
          stroke={borderColor}
          strokeWidth={2}
          data-testid="entity-rect"
        />
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
        {attrPositions.map(({ attr, x, y }) =>
          attr.isComposite ? (
            <CompositeAttribute key={attr.id} attr={attr} x={x} y={y} />
          ) : (
            <AttributeEllipse key={attr.id} attr={attr} x={x} y={y} />
          ),
        )}
      </svg>
    </div>
  );
});

EntityNode.displayName = 'EntityNode';

export default EntityNode;
