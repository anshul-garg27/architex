'use client';

import { memo, useRef, useEffect, useCallback } from 'react';
import { useCollaborationStore } from '@/stores/collaboration-store';
import type { CollaboratorInfo } from '@/lib/collaboration/types';

// ── Constants ─────────────────────────────────────────────

/** Seconds of inactivity before a cursor starts fading. */
const FADE_AFTER_MS = 10_000;

/** Lerp factor per animation frame (0-1, higher = snappier). */
const LERP_FACTOR = 0.15;

// ── Cursor arrow SVG path ─────────────────────────────────

const CURSOR_PATH = 'M0 0 L0 18 L5.5 13 L10 22 L13.5 20.5 L9 12 L16 12 Z';

// ── Single cursor component ───────────────────────────────

interface CursorProps {
  collaborator: CollaboratorInfo;
  /** ID of the local user — we skip rendering our own cursor. */
  localUserId?: string;
}

const CursorIndicator = memo(function CursorIndicator({
  collaborator,
}: CursorProps) {
  const groupRef = useRef<SVGGElement>(null);
  const animatedPos = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number>(0);

  const { cursor, color, name, lastActiveAt } = collaborator;

  // Lerp animation loop
  const animate = useCallback(() => {
    if (!groupRef.current || !cursor) return;

    const dx = cursor.x - animatedPos.current.x;
    const dy = cursor.y - animatedPos.current.y;

    // Skip lerp when the delta is negligible
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      animatedPos.current.x = cursor.x;
      animatedPos.current.y = cursor.y;
    } else {
      animatedPos.current.x += dx * LERP_FACTOR;
      animatedPos.current.y += dy * LERP_FACTOR;
    }

    groupRef.current.setAttribute(
      'transform',
      `translate(${animatedPos.current.x}, ${animatedPos.current.y})`,
    );

    rafRef.current = requestAnimationFrame(animate);
  }, [cursor]);

  useEffect(() => {
    if (!cursor) return;

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate, cursor]);

  if (!cursor) return null;

  // Fade when inactive
  const elapsed = Date.now() - lastActiveAt;
  const opacity = elapsed > FADE_AFTER_MS
    ? Math.max(0, 1 - (elapsed - FADE_AFTER_MS) / 5000)
    : 1;

  return (
    <g ref={groupRef} opacity={opacity} style={{ pointerEvents: 'none' }}>
      {/* Arrow */}
      <path d={CURSOR_PATH} fill={color} stroke="#fff" strokeWidth={1} />

      {/* Name label */}
      <rect
        x={14}
        y={14}
        rx={4}
        ry={4}
        width={name.length * 7.5 + 12}
        height={20}
        fill={color}
      />
      <text
        x={20}
        y={28}
        fill="#fff"
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight={500}
      >
        {name}
      </text>
    </g>
  );
});

// ── LiveCursors overlay ────────────────────────────────────

interface LiveCursorsProps {
  /** Local user ID so we don't render our own cursor. */
  localUserId?: string;
}

function LiveCursorsOverlay({ localUserId }: LiveCursorsProps) {
  const collaborators = useCollaborationStore((state) => state.collaborators);

  // Filter out the local user and anyone without a cursor position
  const remoteCursors = collaborators.filter(
    (c) => c.id !== localUserId && c.cursor != null,
  );

  if (remoteCursors.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-50 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {remoteCursors.map((c) => (
        <CursorIndicator key={c.id} collaborator={c} />
      ))}
    </svg>
  );
}

export const LiveCursors = memo(LiveCursorsOverlay);
