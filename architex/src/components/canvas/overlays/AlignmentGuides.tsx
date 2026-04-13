'use client';

import { memo, useMemo } from 'react';
import { useViewportStore } from '@/stores/viewport-store';

// ── Types ──────────────────────────────────────────────────

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number; // x for vertical, y for horizontal
}

export interface DistanceIndicator {
  x: number;
  y: number;
  distance: number;
  orientation: 'horizontal' | 'vertical';
}

interface NodeRect {
  id: string;
  position: { x: number; y: number };
  width: number;
  height: number;
}

// ── Guide Finder ───────────────────────────────────────────

export function findAlignmentGuides(
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
  draggedSize: { width: number; height: number },
  otherNodes: NodeRect[],
  threshold: number = 5,
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const seen = new Set<string>();

  const dragLeft = draggedPosition.x;
  const dragRight = draggedPosition.x + draggedSize.width;
  const dragCenterX = draggedPosition.x + draggedSize.width / 2;
  const dragTop = draggedPosition.y;
  const dragBottom = draggedPosition.y + draggedSize.height;
  const dragCenterY = draggedPosition.y + draggedSize.height / 2;

  for (const node of otherNodes) {
    if (node.id === draggedNodeId) continue;

    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + node.width;
    const nodeCenterX = node.position.x + node.width / 2;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + node.height;
    const nodeCenterY = node.position.y + node.height / 2;

    // Vertical guides (x-axis alignment)
    const verticalChecks = [
      { dragVal: dragCenterX, nodeVal: nodeCenterX }, // center-to-center
      { dragVal: dragLeft, nodeVal: nodeLeft },         // left-to-left
      { dragVal: dragRight, nodeVal: nodeRight },       // right-to-right
      { dragVal: dragLeft, nodeVal: nodeRight },        // left-to-right
      { dragVal: dragRight, nodeVal: nodeLeft },        // right-to-left
      { dragVal: dragCenterX, nodeVal: nodeLeft },      // center-to-left
      { dragVal: dragCenterX, nodeVal: nodeRight },     // center-to-right
    ];

    for (const check of verticalChecks) {
      if (Math.abs(check.dragVal - check.nodeVal) <= threshold) {
        const key = `v:${Math.round(check.nodeVal)}`;
        if (!seen.has(key)) {
          seen.add(key);
          guides.push({ type: 'vertical', position: check.nodeVal });
        }
      }
    }

    // Horizontal guides (y-axis alignment)
    const horizontalChecks = [
      { dragVal: dragCenterY, nodeVal: nodeCenterY }, // center-to-center
      { dragVal: dragTop, nodeVal: nodeTop },           // top-to-top
      { dragVal: dragBottom, nodeVal: nodeBottom },     // bottom-to-bottom
      { dragVal: dragTop, nodeVal: nodeBottom },        // top-to-bottom
      { dragVal: dragBottom, nodeVal: nodeTop },        // bottom-to-top
      { dragVal: dragCenterY, nodeVal: nodeTop },       // center-to-top
      { dragVal: dragCenterY, nodeVal: nodeBottom },    // center-to-bottom
    ];

    for (const check of horizontalChecks) {
      if (Math.abs(check.dragVal - check.nodeVal) <= threshold) {
        const key = `h:${Math.round(check.nodeVal)}`;
        if (!seen.has(key)) {
          seen.add(key);
          guides.push({ type: 'horizontal', position: check.nodeVal });
        }
      }
    }
  }

  return guides;
}

// ── Distance Indicator Finder ──────────────────────────────

export function findDistanceIndicators(
  draggedNodeId: string,
  draggedPosition: { x: number; y: number },
  draggedSize: { width: number; height: number },
  otherNodes: NodeRect[],
  maxDistance: number = 100,
): DistanceIndicator[] {
  const indicators: DistanceIndicator[] = [];

  const dragLeft = draggedPosition.x;
  const dragRight = draggedPosition.x + draggedSize.width;
  const dragTop = draggedPosition.y;
  const dragBottom = draggedPosition.y + draggedSize.height;
  const dragCenterX = draggedPosition.x + draggedSize.width / 2;
  const dragCenterY = draggedPosition.y + draggedSize.height / 2;

  for (const node of otherNodes) {
    if (node.id === draggedNodeId) continue;

    const nodeLeft = node.position.x;
    const nodeRight = node.position.x + node.width;
    const nodeTop = node.position.y;
    const nodeBottom = node.position.y + node.height;
    const nodeCenterX = node.position.x + node.width / 2;
    const nodeCenterY = node.position.y + node.height / 2;

    // Check horizontal gap (nodes side-by-side)
    // Only if vertically overlapping
    const verticalOverlap = dragTop < nodeBottom && dragBottom > nodeTop;
    if (verticalOverlap) {
      // Gap: dragged is to the right of node
      const gapRight = dragLeft - nodeRight;
      if (gapRight > 0 && gapRight <= maxDistance) {
        const midY = Math.max(dragTop, nodeTop) + (Math.min(dragBottom, nodeBottom) - Math.max(dragTop, nodeTop)) / 2;
        indicators.push({
          x: nodeRight + gapRight / 2,
          y: midY,
          distance: Math.round(gapRight),
          orientation: 'horizontal',
        });
      }
      // Gap: dragged is to the left of node
      const gapLeft = nodeLeft - dragRight;
      if (gapLeft > 0 && gapLeft <= maxDistance) {
        const midY = Math.max(dragTop, nodeTop) + (Math.min(dragBottom, nodeBottom) - Math.max(dragTop, nodeTop)) / 2;
        indicators.push({
          x: dragRight + gapLeft / 2,
          y: midY,
          distance: Math.round(gapLeft),
          orientation: 'horizontal',
        });
      }
    }

    // Check vertical gap (nodes stacked)
    // Only if horizontally overlapping
    const horizontalOverlap = dragLeft < nodeRight && dragRight > nodeLeft;
    if (horizontalOverlap) {
      // Gap: dragged is below node
      const gapBelow = dragTop - nodeBottom;
      if (gapBelow > 0 && gapBelow <= maxDistance) {
        const midX = Math.max(dragLeft, nodeLeft) + (Math.min(dragRight, nodeRight) - Math.max(dragLeft, nodeLeft)) / 2;
        indicators.push({
          x: midX,
          y: nodeBottom + gapBelow / 2,
          distance: Math.round(gapBelow),
          orientation: 'vertical',
        });
      }
      // Gap: dragged is above node
      const gapAbove = nodeTop - dragBottom;
      if (gapAbove > 0 && gapAbove <= maxDistance) {
        const midX = Math.max(dragLeft, nodeLeft) + (Math.min(dragRight, nodeRight) - Math.max(dragLeft, nodeLeft)) / 2;
        indicators.push({
          x: midX,
          y: dragBottom + gapAbove / 2,
          distance: Math.round(gapAbove),
          orientation: 'vertical',
        });
      }
    }

    // If no axis overlap, check diagonal proximity
    if (!verticalOverlap && !horizontalOverlap) {
      // Closest corner-to-corner distance
      const closestX = Math.max(dragLeft, Math.min(dragCenterX, nodeRight)) > nodeCenterX
        ? dragLeft - nodeRight
        : nodeLeft - dragRight;
      const closestY = Math.max(dragTop, Math.min(dragCenterY, nodeBottom)) > nodeCenterY
        ? dragTop - nodeBottom
        : nodeTop - dragBottom;
      const dist = Math.sqrt(closestX * closestX + closestY * closestY);
      if (dist > 0 && dist <= maxDistance) {
        indicators.push({
          x: (dragCenterX + nodeCenterX) / 2,
          y: (dragCenterY + nodeCenterY) / 2,
          distance: Math.round(dist),
          orientation: Math.abs(closestX) > Math.abs(closestY) ? 'horizontal' : 'vertical',
        });
      }
    }
  }

  return indicators;
}

// ── Component ──────────────────────────────────────────────

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  distanceIndicators: DistanceIndicator[];
}

const GUIDE_COLOR = '#E879F9';
const CANVAS_EXTENT = 10000; // large enough to span any reasonable viewport

export const AlignmentGuides = memo(function AlignmentGuides({
  guides,
  distanceIndicators,
}: AlignmentGuidesProps) {
  const vx = useViewportStore((s) => s.x);
  const vy = useViewportStore((s) => s.y);
  const vz = useViewportStore((s) => s.zoom);

  // Transform from flow coordinates to screen coordinates
  const transform = useMemo(
    () => `translate(${vx}px, ${vy}px) scale(${vz})`,
    [vx, vy, vz],
  );

  if (guides.length === 0 && distanceIndicators.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ zIndex: 1000 }}
    >
      <g style={{ transform }}>
        {/* Alignment guide lines */}
        {guides.map((guide, i) =>
          guide.type === 'vertical' ? (
            <line
              key={`g-${i}`}
              x1={guide.position}
              y1={-CANVAS_EXTENT}
              x2={guide.position}
              y2={CANVAS_EXTENT}
              stroke={GUIDE_COLOR}
              strokeWidth={1 / vz}
              strokeDasharray={`${4 / vz} ${4 / vz}`}
              opacity={0.8}
            />
          ) : (
            <line
              key={`g-${i}`}
              x1={-CANVAS_EXTENT}
              y1={guide.position}
              x2={CANVAS_EXTENT}
              y2={guide.position}
              stroke={GUIDE_COLOR}
              strokeWidth={1 / vz}
              strokeDasharray={`${4 / vz} ${4 / vz}`}
              opacity={0.8}
            />
          ),
        )}

        {/* Distance indicators */}
        {distanceIndicators.map((indicator, i) => {
          const fontSize = 10 / vz;
          const padding = 3 / vz;
          const textWidth = (`${indicator.distance}px`.length * fontSize * 0.6);
          const bgWidth = textWidth + padding * 2;
          const bgHeight = fontSize + padding * 2;

          return (
            <g key={`d-${i}`}>
              {/* Background pill */}
              <rect
                x={indicator.x - bgWidth / 2}
                y={indicator.y - bgHeight / 2}
                width={bgWidth}
                height={bgHeight}
                rx={bgHeight / 4}
                fill="var(--surface)"
                stroke={GUIDE_COLOR}
                strokeWidth={1 / vz}
                opacity={0.9}
              />
              {/* Distance text */}
              <text
                x={indicator.x}
                y={indicator.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={GUIDE_COLOR}
                fontSize={fontSize}
                fontFamily="var(--font-geist-mono), monospace"
                fontWeight={600}
              >
                {indicator.distance}px
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
});
