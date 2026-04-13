'use client';

import { memo } from 'react';
import { useCollaborationStore } from '@/stores/collaboration-store';
import type { CollaboratorInfo } from '@/lib/collaboration/types';

// ── Types ─────────────────────────────────────────────────

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SelectionRingsProps {
  /** Map of node positions, keyed by node ID. */
  nodePositions: Map<string, NodePosition>;
  /** Local user ID — we skip rendering our own selections. */
  localUserId?: string;
}

// ── Ring for a single collaborator/node pair ──────────────

interface SelectionRingProps {
  collaborator: CollaboratorInfo;
  node: NodePosition;
}

const SelectionRing = memo(function SelectionRing({
  collaborator,
  node,
}: SelectionRingProps) {
  const padding = 6;
  const borderRadius = 10;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Colored ring */}
      <rect
        x={node.x - padding}
        y={node.y - padding}
        width={node.width + padding * 2}
        height={node.height + padding * 2}
        rx={borderRadius}
        ry={borderRadius}
        fill="none"
        stroke={collaborator.color}
        strokeWidth={2.5}
        strokeDasharray="6 3"
        opacity={0.85}
      />

      {/* Name label */}
      <rect
        x={node.x - padding}
        y={node.y - padding - 20}
        rx={4}
        ry={4}
        width={collaborator.name.length * 7 + 12}
        height={18}
        fill={collaborator.color}
      />
      <text
        x={node.x - padding + 6}
        y={node.y - padding - 6}
        fill="#fff"
        fontSize={10}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
      >
        {collaborator.name}
      </text>
    </g>
  );
});

// ── SelectionRings overlay ─────────────────────────────────

function SelectionRingsOverlay({
  nodePositions,
  localUserId,
}: SelectionRingsProps) {
  const collaborators = useCollaborationStore((state) => state.collaborators);

  // Filter to remote collaborators that have selections
  const remoteWithSelections = collaborators.filter(
    (c) => c.id !== localUserId && c.selectedNodeIds.length > 0,
  );

  if (remoteWithSelections.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-40 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {remoteWithSelections.map((collab) =>
        collab.selectedNodeIds.map((nodeId) => {
          const nodePos = nodePositions.get(nodeId);
          if (!nodePos) return null;
          return (
            <SelectionRing
              key={`${collab.id}-${nodeId}`}
              collaborator={collab}
              node={nodePos}
            />
          );
        }),
      )}
    </svg>
  );
}

export const SelectionRings = memo(SelectionRingsOverlay);
