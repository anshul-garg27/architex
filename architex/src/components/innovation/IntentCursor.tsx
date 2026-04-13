'use client';

// ─────────────────────────────────────────────────────────────
// IntentCursor — Collaboration cursor with intent indicator
// ─────────────────────────────────────────────────────────────
//
// Renders a remote collaborator's cursor on the canvas with an
// icon showing their current intent (dragging, connecting, etc.)
// and an optional ghost preview of what they are about to do.
//
// Animation: motion for smooth position interpolation and
//            intent-icon transitions.
// ─────────────────────────────────────────────────────────────

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MousePointer,
  BoxSelect,
  Move,
  Cable,
  Type,
  Pencil,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  CursorIntent,
  GhostPreview,
} from '@/lib/innovation/intent-cursors';
import { INTENT_ICONS, describeIntent } from '@/lib/innovation/intent-cursors';

// ── Types ──────────────────────────────────────────────────

export interface IntentCursorProps {
  /** Collaborator display name. */
  name: string;
  /** Assigned color (hex or CSS color). */
  color: string;
  /** Current cursor position. */
  position: { x: number; y: number };
  /** Detected intent. */
  intent: CursorIntent;
  /** Optional ghost preview to render. */
  ghostPreview?: GhostPreview | null;
  className?: string;
}

// ── Icon resolver ──────────────────────────────────────────

const ICON_COMPONENTS: Record<string, React.ComponentType<{ className?: string }>> = {
  MousePointer,
  BoxSelect,
  Move,
  Cable,
  Type,
  Pencil,
};

function IntentIcon({ intent, className }: { intent: CursorIntent; className?: string }) {
  const iconName = INTENT_ICONS[intent];
  const Icon = ICON_COMPONENTS[iconName] ?? MousePointer;
  return <Icon className={className} />;
}

// ── Ghost preview overlay ──────────────────────────────────

function GhostOverlay({ preview, color }: { preview: GhostPreview; color: string }) {
  const width = Math.abs(preview.to.x - preview.from.x);
  const height = Math.abs(preview.to.y - preview.from.y);
  const left = Math.min(preview.from.x, preview.to.x);
  const top = Math.min(preview.from.y, preview.to.y);

  switch (preview.kind) {
    case 'selectionBox':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: preview.opacity }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute rounded border border-dashed"
          style={{
            left,
            top,
            width,
            height,
            borderColor: color,
            backgroundColor: `${color}15`,
          }}
        />
      );

    case 'connectionLine':
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={{ opacity: preview.opacity }}
        >
          <motion.line
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            x1={preview.from.x}
            y1={preview.from.y}
            x2={preview.to.x}
            y2={preview.to.y}
            stroke={color}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
        </svg>
      );

    case 'dragGhost':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: preview.opacity }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute h-16 w-24 rounded-lg border-2 border-dashed"
          style={{
            left: preview.to.x - 48,
            top: preview.to.y - 32,
            borderColor: color,
            backgroundColor: `${color}10`,
          }}
        />
      );

    case 'drawPath':
      return (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          style={{ opacity: preview.opacity }}
        >
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            d={`M ${preview.from.x} ${preview.from.y} L ${preview.to.x} ${preview.to.y}`}
            stroke={color}
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'textCaret':
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="pointer-events-none absolute h-5 w-0.5"
          style={{
            left: preview.to.x,
            top: preview.to.y - 10,
            backgroundColor: color,
          }}
        />
      );

    default:
      return null;
  }
}

// ── Main component ─────────────────────────────────────────

export const IntentCursor = memo(function IntentCursor({
  name,
  color,
  position,
  intent,
  ghostPreview,
  className,
}: IntentCursorProps) {
  const label = useMemo(() => describeIntent(intent), [intent]);

  return (
    <>
      {/* Ghost preview */}
      <AnimatePresence>
        {ghostPreview && (
          <GhostOverlay
            key={ghostPreview.kind}
            preview={ghostPreview}
            color={color}
          />
        )}
      </AnimatePresence>

      {/* Cursor + label */}
      <motion.div
        className={cn(
          'pointer-events-none absolute z-50 flex items-start gap-0.5',
          className,
        )}
        animate={{
          x: position.x,
          y: position.y,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 28,
          mass: 0.8,
        }}
      >
        {/* Pointer SVG */}
        <svg
          width="16"
          height="20"
          viewBox="0 0 16 20"
          fill="none"
          className="shrink-0 drop-shadow-sm"
        >
          <path
            d="M1 1L1 15.5L5.5 11.5L9.5 19L12 18L8 10.5L13.5 10.5L1 1Z"
            fill={color}
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>

        {/* Name badge + intent icon */}
        <div
          className="mt-3 flex items-center gap-1 rounded-full px-2 py-0.5 shadow-sm"
          style={{ backgroundColor: color }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={intent}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
            >
              <IntentIcon intent={intent} className="h-2.5 w-2.5 text-white" />
            </motion.span>
          </AnimatePresence>
          <span className="whitespace-nowrap text-[10px] font-medium text-white">
            {name}
          </span>
          {intent !== 'idle' && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 0.7, width: 'auto' }}
              className="overflow-hidden whitespace-nowrap text-[9px] text-white/80"
            >
              {label}
            </motion.span>
          )}
        </div>
      </motion.div>
    </>
  );
});
