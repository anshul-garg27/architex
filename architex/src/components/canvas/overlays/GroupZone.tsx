'use client';

import { memo, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useViewportStore } from '@/stores/viewport-store';
import type { NodeGroup } from '@/stores/canvas-store';

// ── Constants ──────────────────────────────────────────────

const GROUP_PADDING = 20;

// ── Component ──────────────────────────────────────────────

interface GroupZoneProps {
  group: NodeGroup;
}

const SingleGroupZone = memo(function SingleGroupZone({ group }: GroupZoneProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const zoom = useViewportStore((s) => s.zoom);

  const boundingBox = useMemo(() => {
    const groupNodes = nodes.filter((n) => group.nodeIds.includes(n.id));
    if (groupNodes.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of groupNodes) {
      const w = node.measured?.width ?? (node.width as number | undefined) ?? 180;
      const h = node.measured?.height ?? (node.height as number | undefined) ?? 60;

      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + w);
      maxY = Math.max(maxY, node.position.y + h);
    }

    return {
      x: minX - GROUP_PADDING,
      y: minY - GROUP_PADDING,
      width: maxX - minX + GROUP_PADDING * 2,
      height: maxY - minY + GROUP_PADDING * 2,
    };
  }, [nodes, group.nodeIds]);

  if (!boundingBox) return null;

  const fontSize = 11 / zoom;
  const labelPadding = 4 / zoom;

  return (
    <g>
      {/* Dashed rectangle with translucent fill */}
      <rect
        x={boundingBox.x}
        y={boundingBox.y}
        width={boundingBox.width}
        height={boundingBox.height}
        rx={8 / zoom}
        fill={group.color}
        fillOpacity={0.05}
        stroke={group.color}
        strokeWidth={1.5 / zoom}
        strokeDasharray={`${6 / zoom} ${4 / zoom}`}
        opacity={0.7}
      />
      {/* Label background */}
      <rect
        x={boundingBox.x + labelPadding}
        y={boundingBox.y - fontSize - labelPadding * 2}
        width={group.label.length * fontSize * 0.65 + labelPadding * 2}
        height={fontSize + labelPadding * 2}
        rx={4 / zoom}
        fill={group.color}
        fillOpacity={0.15}
        stroke={group.color}
        strokeWidth={1 / zoom}
        opacity={0.8}
      />
      {/* Label text */}
      <text
        x={boundingBox.x + labelPadding * 2}
        y={boundingBox.y - labelPadding}
        fill={group.color}
        fontSize={fontSize}
        fontFamily="var(--font-geist-sans), system-ui, sans-serif"
        fontWeight={600}
        dominantBaseline="auto"
        opacity={0.9}
      >
        {group.label}
      </text>
    </g>
  );
});

// ── All Groups Overlay ─────────────────────────────────────

export const GroupZones = memo(function GroupZones() {
  const groups = useCanvasStore((s) => s.groups);
  const vx = useViewportStore((s) => s.x);
  const vy = useViewportStore((s) => s.y);
  const vz = useViewportStore((s) => s.zoom);

  const transform = useMemo(
    () => `translate(${vx}px, ${vy}px) scale(${vz})`,
    [vx, vy, vz],
  );

  if (groups.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      style={{ zIndex: 999 }}
    >
      <g style={{ transform }}>
        {groups.map((group) => (
          <SingleGroupZone key={group.id} group={group} />
        ))}
      </g>
    </svg>
  );
});
