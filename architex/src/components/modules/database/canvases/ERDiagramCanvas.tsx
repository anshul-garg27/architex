"use client";

import React, { memo, useState, useCallback, useRef } from "react";
import type { EREntity, ERRelationship } from "@/lib/database";

const entityWidth = 200;
const entityHeaderH = 32;
const attrRowH = 22;

// ── DBL-044: Simplified normalization heuristic ─────────────

type NFLevel = "1NF" | "2NF" | "3NF";

interface NFHint {
  level: NFLevel;
  hasIssue: boolean;
  tooltip: string;
}

/**
 * Simplified normalization check for an ER entity.
 * Assumes: PK attributes determine all non-PK attributes.
 * Checks for potential transitive dependencies among non-PK attributes
 * by looking for common naming patterns (e.g., dept_name + dept_location
 * suggests dept_name -> dept_location, a transitive dependency).
 */
function analyzeEntityNormalization(entity: EREntity): NFHint | null {
  const attrs = entity.attributes;
  if (attrs.length < 3) return null; // Too few attributes to analyze

  const pkAttrs = attrs.filter((a) => a.isPK);
  const nonPkAttrs = attrs.filter((a) => !a.isPK);

  if (pkAttrs.length === 0 || nonPkAttrs.length < 2) return null;

  // Check for potential transitive dependencies:
  // Group non-PK attributes by prefix (e.g., dept_name, dept_location share "dept")
  const prefixGroups = new Map<string, string[]>();
  for (const attr of nonPkAttrs) {
    const parts = attr.name.toLowerCase().split(/[_\-]/);
    if (parts.length >= 2) {
      const prefix = parts[0];
      const existing = prefixGroups.get(prefix) ?? [];
      existing.push(attr.name);
      prefixGroups.set(prefix, existing);
    }
  }

  // If any prefix group has 2+ attributes, there may be a transitive dependency
  const transitiveGroups = [...prefixGroups.values()].filter((g) => g.length >= 2);
  if (transitiveGroups.length > 0) {
    return {
      level: "2NF",
      hasIssue: true,
      tooltip: `Possible transitive dependency: ${transitiveGroups[0].join(", ")} share a common prefix. Click to analyze in Normalization mode.`,
    };
  }

  // Check for partial dependencies with composite PK
  if (pkAttrs.length >= 2) {
    // With composite PK and non-PK attrs, there could be partial dependencies
    return {
      level: "2NF",
      hasIssue: true,
      tooltip: "Composite primary key detected. Non-key attributes may depend on only part of the key. Click to analyze in Normalization mode.",
    };
  }

  // If single PK and no obvious transitive deps, likely at least 3NF
  return {
    level: "3NF",
    hasIssue: false,
    tooltip: "No obvious normalization issues detected. Click to verify in Normalization mode.",
  };
}

function entityHeight(e: EREntity) {
  return entityHeaderH + Math.max(e.attributes.length, 1) * attrRowH + 8;
}

function entityCenter(e: EREntity): { cx: number; cy: number } {
  return { cx: e.x + entityWidth / 2, cy: e.y + entityHeight(e) / 2 };
}

const ERDiagramCanvas = memo(function ERDiagramCanvas({
  entities,
  relationships,
  selectedEntityId,
  onSelectEntity,
  onMoveEntity,
  onDragStart,
  onDragEnd,
  onNormalizationBadgeClick,
}: {
  entities: EREntity[];
  relationships: ERRelationship[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onMoveEntity: (id: string, x: number, y: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onNormalizationBadgeClick?: (entity: EREntity) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    entityId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (entityId: string, evt: React.MouseEvent) => {
      const entity = entities.find((e) => e.id === entityId);
      if (!entity) return;
      onSelectEntity(entityId);
      onDragStart?.();
      const svgRect = svgRef.current?.getBoundingClientRect();
      const scrollLeft = svgRef.current?.parentElement?.scrollLeft ?? 0;
      const scrollTop = svgRef.current?.parentElement?.scrollTop ?? 0;
      setDragging({
        entityId,
        offsetX: evt.clientX - (svgRect?.left ?? 0) + scrollLeft - entity.x,
        offsetY: evt.clientY - (svgRect?.top ?? 0) + scrollTop - entity.y,
      });
    },
    [entities, onSelectEntity, onDragStart],
  );

  const handleMouseMove = useCallback(
    (evt: React.MouseEvent) => {
      if (!dragging) return;
      const svgRect = svgRef.current?.getBoundingClientRect();
      const scrollLeft = svgRef.current?.parentElement?.scrollLeft ?? 0;
      const scrollTop = svgRef.current?.parentElement?.scrollTop ?? 0;
      const x = Math.max(0, evt.clientX - (svgRect?.left ?? 0) + scrollLeft - dragging.offsetX);
      const y = Math.max(0, evt.clientY - (svgRect?.top ?? 0) + scrollTop - dragging.offsetY);
      onMoveEntity(dragging.entityId, x, y);
    },
    [dragging, onMoveEntity],
  );

  const handleMouseUp = useCallback(() => {
    if (dragging) {
      onDragEnd?.();
    }
    setDragging(null);
  }, [dragging, onDragEnd]);

  const handleCanvasClick = useCallback(
    (evt: React.MouseEvent) => {
      if ((evt.target as Element).closest("[data-entity]")) return;
      onSelectEntity(null);
    },
    [onSelectEntity],
  );

  return (
    <div className="h-full w-full overflow-auto bg-gradient-to-b from-elevated/80 to-background">
      <svg
        ref={svgRef}
        role="img"
        aria-label={`ER diagram with ${entities.length} entities and ${relationships.length} relationships`}
        className="min-h-full min-w-full"
        width="100%"
        height="100%"
        style={{ minWidth: 900, minHeight: 500 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" style={{ fill: 'var(--foreground-muted)' }} />
          </marker>
        </defs>

        {/* Grid pattern */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              style={{ stroke: 'var(--elevated)' }}
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Relationships (drawn first, behind entities) */}
        {relationships.map((rel) => {
          const e1 = entities.find((e) => e.id === rel.entity1Id);
          const e2 = entities.find((e) => e.id === rel.entity2Id);
          if (!e1 || !e2) return null;
          const c1 = entityCenter(e1);
          const c2 = entityCenter(e2);
          const midX = (c1.cx + c2.cx) / 2;
          const midY = (c1.cy + c2.cy) / 2;
          const dSize = 30;

          // Parse cardinality labels
          const [leftLabel, rightLabel] = rel.cardinality.split(":");

          return (
            <g key={rel.id}>
              {/* Line from entity1 to diamond */}
              <line
                x1={c1.cx}
                y1={c1.cy}
                x2={midX}
                y2={midY}
                style={{ stroke: 'var(--foreground-muted)' }}
                strokeWidth="1.5"
              />
              {/* Line from diamond to entity2 */}
              <line
                x1={midX}
                y1={midY}
                x2={c2.cx}
                y2={c2.cy}
                style={{ stroke: 'var(--foreground-muted)' }}
                strokeWidth="1.5"
              />
              {/* Diamond */}
              <polygon
                points={`${midX},${midY - dSize} ${midX + dSize},${midY} ${midX},${midY + dSize} ${midX - dSize},${midY}`}
                style={{ fill: 'var(--elevated)', stroke: 'var(--primary)' }}
                strokeWidth="1.5"
              />
              <text
                x={midX}
                y={midY + 4}
                textAnchor="middle"
                style={{ fill: 'var(--primary-light, #93c5fd)' }}
                fontSize="10"
                fontWeight="600"
              >
                {rel.name}
              </text>
              {/* Cardinality labels */}
              <text
                x={c1.cx + (midX - c1.cx) * 0.25}
                y={c1.cy + (midY - c1.cy) * 0.25 - 10}
                textAnchor="middle"
                style={{ fill: 'var(--warning, #fbbf24)' }}
                fontSize="13"
                fontWeight="700"
              >
                {leftLabel}
              </text>
              <text
                x={c2.cx + (midX - c2.cx) * 0.25}
                y={c2.cy + (midY - c2.cy) * 0.25 - 10}
                textAnchor="middle"
                style={{ fill: 'var(--warning, #fbbf24)' }}
                fontSize="13"
                fontWeight="700"
              >
                {rightLabel}
              </text>
            </g>
          );
        })}

        {/* Entities (with DBL-044 normalization hints) */}
        {entities.map((entity) => {
          const h = entityHeight(entity);
          const isSelected = entity.id === selectedEntityId;
          const nfHint = analyzeEntityNormalization(entity);
          const isHovered = entity.id === hoveredEntityId;
          return (
            <g
              key={entity.id}
              data-entity={entity.id}
              tabIndex={0}
              role="button"
              aria-label={`Entity: ${entity.name} with ${entity.attributes.length} attributes`}
              onMouseDown={(e) => handleMouseDown(entity.id, e)}
              onMouseEnter={() => setHoveredEntityId(entity.id)}
              onMouseLeave={() => setHoveredEntityId(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectEntity(entity.id);
                }
              }}
              style={{
                cursor: dragging ? "grabbing" : "pointer",
                transform: isHovered && !dragging ? "scale(1.02)" : undefined,
                transformOrigin: `${entity.x + entityWidth / 2}px ${entity.y + h / 2}px`,
                transition: "transform 150ms ease, filter 150ms ease",
                filter: isHovered && !dragging ? "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" : undefined,
              }}
              className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {/* Entity box */}
              <rect
                x={entity.x}
                y={entity.y}
                width={entityWidth}
                height={h}
                rx={8}
                style={{
                  fill: entity.isWeak ? 'var(--surface)' : 'var(--surface)',
                  stroke: isSelected ? 'var(--primary)' : entity.isWeak ? 'var(--viz-overflow, #6366f1)' : 'var(--border)',
                }}
                strokeWidth={isSelected ? 2 : 1}
                strokeDasharray={entity.isWeak ? "5,3" : undefined}
              />
              {/* Header bar */}
              <rect
                x={entity.x}
                y={entity.y}
                width={entityWidth}
                height={entityHeaderH}
                rx={8}
                style={{ fill: isSelected ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--elevated)' }}
              />
              <rect
                x={entity.x}
                y={entity.y + entityHeaderH - 8}
                width={entityWidth}
                height={8}
                style={{ fill: isSelected ? 'var(--primary-surface, rgba(59,130,246,0.15))' : 'var(--elevated)' }}
              />
              {/* Entity name */}
              <text
                x={entity.x + (nfHint ? entityWidth / 2 - 14 : entityWidth / 2)}
                y={entity.y + 21}
                textAnchor="middle"
                style={{ fill: isSelected ? 'var(--primary-light, #93c5fd)' : 'var(--foreground)' }}
                fontSize="13"
                fontWeight="700"
              >
                {entity.name.length > 18 ? entity.name.slice(0, 17) + "\u2026" : entity.name}
                {entity.name.length > 18 && <title>{entity.name}</title>}
              </text>
              {/* DBL-044: Normalization hint badge */}
              {nfHint && (
                <g
                  role="button"
                  tabIndex={0}
                  aria-label={nfHint.tooltip}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNormalizationBadgeClick?.(entity);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onNormalizationBadgeClick?.(entity);
                    }
                  }}
                >
                  <title>{nfHint.tooltip}</title>
                  <rect
                    x={entity.x + entityWidth - 40}
                    y={entity.y + 6}
                    width={32}
                    height={18}
                    rx={4}
                    fill={nfHint.hasIssue ? "rgba(245, 158, 11, 0.2)" : "rgba(34, 197, 94, 0.2)"}
                    stroke={nfHint.hasIssue ? "rgba(245, 158, 11, 0.6)" : "rgba(34, 197, 94, 0.6)"}
                    strokeWidth={1}
                  />
                  <text
                    x={entity.x + entityWidth - 24}
                    y={entity.y + 19}
                    textAnchor="middle"
                    fill={nfHint.hasIssue ? "#f59e0b" : "#22c55e"}
                    fontSize="9"
                    fontWeight="700"
                  >
                    {nfHint.level}
                  </text>
                </g>
              )}
              {/* Attributes */}
              {entity.attributes.map((attr, idx) => {
                const ay = entity.y + entityHeaderH + idx * attrRowH + 16;
                return (
                  <g key={attr.id}>
                    <text
                      x={entity.x + 12}
                      y={ay}
                      style={{ fill: attr.isPK ? 'var(--warning, #fbbf24)' : attr.isFK ? 'var(--viz-fk, #a78bfa)' : 'var(--foreground-muted)' }}
                      fontSize="11"
                      fontWeight={attr.isPK ? "600" : "400"}
                    >
                      {attr.isPK ? "\u{1F511} " : ""}{attr.name}
                    </text>
                    {/* PK underline */}
                    {attr.isPK && (
                      <line
                        x1={entity.x + (attr.isPK ? 24 : 12)}
                        y1={ay + 2}
                        x2={entity.x + 12 + (attr.isPK ? 12 : 0) + attr.name.length * 6.5}
                        y2={ay + 2}
                        style={{ stroke: 'var(--warning, #fbbf24)' }}
                        strokeWidth="1"
                      />
                    )}
                    {/* FK dashed underline */}
                    {attr.isFK && !attr.isPK && (
                      <line
                        x1={entity.x + 12}
                        y1={ay + 2}
                        x2={entity.x + 12 + attr.name.length * 6.5}
                        y2={ay + 2}
                        style={{ stroke: 'var(--viz-fk, #a78bfa)' }}
                        strokeWidth="1"
                        strokeDasharray="3,2"
                      />
                    )}
                    <text
                      x={entity.x + entityWidth - 12}
                      y={ay}
                      textAnchor="end"
                      style={{ fill: 'var(--foreground-subtle)' }}
                      fontSize="10"
                    >
                      {attr.type}
                    </text>
                  </g>
                );
              })}
              {entity.attributes.length === 0 && (
                <text
                  x={entity.x + entityWidth / 2}
                  y={entity.y + entityHeaderH + 16}
                  textAnchor="middle"
                  style={{ fill: 'var(--foreground-subtle)' }}
                  fontSize="10"
                  fontStyle="italic"
                >
                  No attributes
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default ERDiagramCanvas;
