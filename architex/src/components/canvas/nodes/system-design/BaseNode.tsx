'use client';

import React, { memo, useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useViewportStore } from '@/stores/viewport-store';
import { NodeContextMenu } from '@/components/canvas/overlays/NodeContextMenu';
import { animations, reducedMotion } from '@/lib/constants/motion';
import type { NodeCategory, SystemDesignNodeData } from '@/lib/types';

// ── Node shapes ─────────────────────────────────────────────

export type NodeShape =
  | 'rectangle'
  | 'cylinder'
  | 'parallelogram'
  | 'hexagon'
  | 'pill'
  | 'dashed-rect'
  | 'octagon'
  | 'diamond';

/** Maps each NodeCategory to a visual shape. */
export const CATEGORY_SHAPE: Record<NodeCategory, NodeShape> = {
  compute: 'rectangle',
  'load-balancing': 'hexagon',
  storage: 'cylinder',
  messaging: 'parallelogram',
  networking: 'hexagon',
  processing: 'rectangle',
  client: 'pill',
  observability: 'dashed-rect',
  security: 'octagon',
  services: 'rectangle',
  fintech: 'octagon',
  'data-engineering': 'parallelogram',
  'ai-llm': 'hexagon',
  'db-internals': 'cylinder',
};

// ── Category --> CSS variable mapping ───────────────────────

const CATEGORY_VAR: Record<NodeCategory, string> = {
  compute: '--node-compute',
  'load-balancing': '--node-networking',
  storage: '--node-storage',
  messaging: '--node-messaging',
  networking: '--node-networking',
  processing: '--node-processing',
  client: '--node-client',
  observability: '--node-observability',
  security: '--node-security',
  services: '--node-services',
  fintech: '--node-fintech',
  'data-engineering': '--node-data-engineering',
  'ai-llm': '--node-ai-llm',
  'db-internals': '--node-db-internals',
};

// ── State dot colour mapping ────────────────────────────────

const STATE_VAR: Record<SystemDesignNodeData['state'], string> = {
  idle: '--state-idle',
  active: '--state-active',
  success: '--state-success',
  warning: '--state-warning',
  error: '--state-error',
  processing: '--state-processing',
};

// ── State glow CSS ──────────────────────────────────────────

const STATE_GLOW_STYLES: Record<
  SystemDesignNodeData['state'],
  { animation?: string; boxShadow?: string; bgTint?: string }
> = {
  idle: {},
  active: {
    boxShadow: '0 0 8px 2px hsla(217, 91%, 60%, 0.3)',
    bgTint: 'hsla(217, 91%, 60%, 0.06)',
  },
  success: {
    boxShadow: '0 0 8px 2px hsla(142, 71%, 45%, 0.3)',
    bgTint: 'hsla(142, 71%, 45%, 0.06)',
  },
  warning: {
    animation: 'node-warning-glow 2s ease-in-out infinite',
    bgTint: 'hsla(38, 92%, 50%, 0.08)',
  },
  error: {
    animation: 'node-error-pulse 1.5s ease-in-out infinite',
    bgTint: 'hsla(0, 72%, 51%, 0.08)',
  },
  processing: {
    animation: 'node-processing-spin 2s linear infinite',
    bgTint: 'hsla(271, 81%, 56%, 0.06)',
  },
};

// ── Keyframes injected once ─────────────────────────────────

const KEYFRAMES_ID = 'architex-node-state-keyframes';

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
@keyframes node-error-pulse {
  0%, 100% { box-shadow: 0 0 0 0 hsla(0, 72%, 51%, 0.4); }
  50% { box-shadow: 0 0 0 6px hsla(0, 72%, 51%, 0); }
}
@keyframes node-warning-glow {
  0%, 100% { box-shadow: 0 0 4px 0 hsla(38, 92%, 50%, 0.3); }
  50% { box-shadow: 0 0 8px 2px hsla(38, 92%, 50%, 0.2); }
}
@keyframes node-processing-spin {
  0% { box-shadow: 0 0 4px 1px hsla(271, 81%, 56%, 0.3); }
  50% { box-shadow: 0 0 10px 3px hsla(271, 81%, 56%, 0.2); }
  100% { box-shadow: 0 0 4px 1px hsla(271, 81%, 56%, 0.3); }
}`;
  document.head.appendChild(style);
}

// ── Shape CSS helpers ───────────────────────────────────────

function getShapeContainerStyle(shape: NodeShape): React.CSSProperties {
  switch (shape) {
    case 'cylinder':
      return { borderRadius: '50% / 10%' };
    case 'parallelogram':
      return { transform: 'skewX(-8deg)' };
    case 'hexagon':
      return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' };
    case 'pill':
      return { borderRadius: '9999px', borderStyle: 'dashed' };
    case 'dashed-rect':
      return { borderStyle: 'dashed' };
    case 'octagon':
      return { clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' };
    case 'diamond':
      return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' };
    case 'rectangle':
    default:
      return {};
  }
}

function getShapeContentStyle(shape: NodeShape): React.CSSProperties {
  if (shape === 'parallelogram') return { transform: 'skewX(8deg)' };
  return {};
}

function getShapeClass(shape: NodeShape): string {
  switch (shape) {
    case 'cylinder':
      return 'rounded-none'; // override rounded-lg, borderRadius set via style
    case 'hexagon':
    case 'octagon':
    case 'diamond':
      return 'rounded-none border-0'; // clip-path handles the shape; border would show as rectangle
    case 'pill':
      return 'rounded-none'; // borderRadius set via style
    case 'dashed-rect':
    case 'parallelogram':
    case 'rectangle':
    default:
      return '';
  }
}

function getSimplifiedShapeClass(shape: NodeShape): string {
  switch (shape) {
    case 'pill':
      return '!rounded-full';
    case 'dashed-rect':
      return 'border-dashed';
    default:
      return '';
  }
}

function getSimplifiedShapeStyle(shape: NodeShape): React.CSSProperties {
  switch (shape) {
    case 'cylinder':
      return { borderRadius: '50% / 14%' };
    case 'parallelogram':
      return { transform: 'skewX(-8deg)' };
    case 'hexagon':
      return { clipPath: 'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)' };
    case 'octagon':
      return { clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' };
    default:
      return {};
  }
}

// ── Metric formatter ────────────────────────────────────────

function formatMetric(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

// ── LOD tiers ───────────────────────────────────────────────

type LODTier = 'full' | 'simplified' | 'dot';

function getLODTier(zoom: number): LODTier {
  if (zoom > 0.6) return 'full';
  if (zoom >= 0.3) return 'simplified';
  return 'dot';
}

// ── BaseNode ────────────────────────────────────────────────

/** Props for the BaseNode canvas component. All concrete node types (DatabaseNode, CacheNode, etc.) delegate rendering here. */
export interface BaseNodeProps {
  /** React Flow node id. When provided, enables context menu. */
  id?: string;
  /** Node data payload containing label, category, metrics, and state. */
  data: SystemDesignNodeData;
  /** Whether this node is currently selected on the canvas. */
  selected: boolean;
  /** Icon ReactNode rendered in the node header (typically a lucide-react icon). */
  icon: React.ReactNode;
  /** Override the default category-based shape. */
  shape?: NodeShape;
  /** When true, plays the delete exit animation then calls onDeleteAnimationComplete. */
  isDeleting?: boolean;
  /** Called after the delete exit animation finishes. */
  onDeleteAnimationComplete?: () => void;
}

const BaseNode = memo(function BaseNode({ id, data, selected, icon, shape: shapeProp, isDeleting, onDeleteAnimationComplete }: BaseNodeProps) {
  // ── ALL hooks MUST be called unconditionally before any early return ──

  const zoom = useViewportStore((s) => s.zoom);
  const prefersReducedMotion = useReducedMotion();

  const [, /* unused — kept for hook-count stability */] = useState(true);

  const handleExitComplete = useCallback(() => {
    onDeleteAnimationComplete?.();
  }, [onDeleteAnimationComplete]);

  const lod = useMemo(() => getLODTier(zoom), [zoom]);
  const prevLodRef = useRef(lod);

  // Inject keyframes once after mount (side effect — must use useEffect, not useMemo)
  useEffect(() => { ensureKeyframes(); }, []);

  const isChaos = (data as Record<string, unknown>).chaosActive === true;
  const isError = data.state === 'error';

  const motionAnimate = useMemo(() => {
    if (prefersReducedMotion) return {};
    if (isChaos) return animations.simulation.chaosShake.animate;
    if (isError) return animations.simulation.errorFlash.animate;
    return {};
  }, [prefersReducedMotion, isChaos, isError]);

  const motionTransition = useMemo(() => {
    if (prefersReducedMotion) return reducedMotion.instantTransition;
    if (isChaos) return animations.simulation.chaosShake.transition;
    if (isError) return animations.simulation.errorFlash.transition;
    return undefined;
  }, [prefersReducedMotion, isChaos, isError]);

  // ── END OF HOOKS — all hooks above, conditional logic below ──

  const lodChanged = prevLodRef.current !== lod;
  prevLodRef.current = lod;

  const shape = shapeProp ?? CATEGORY_SHAPE[data.category];

  const categoryVar = CATEGORY_VAR[data.category];
  const stateVar = STATE_VAR[data.state];
  const categoryColor = `var(${categoryVar})`;
  const stateColor = `var(${stateVar})`;

  const stateGlow = STATE_GLOW_STYLES[data.state] ?? {};

  // LOD crossfade: when the tier just changed, start with opacity-0 and
  // let the CSS transition fade in the new view over 150ms.
  const lodFadeClass = lodChanged
    ? 'opacity-0'
    : 'opacity-100';

  // ── Hidden handles for low-LOD views ──
  // React Flow needs handles to exist even when visually hidden, otherwise
  // edges referencing sourceHandle/targetHandle IDs produce console errors.
  const hiddenHandles = (
    <>
      <Handle type="source" position={Position.Top} id="top" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Right} id="right" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="source" position={Position.Left} id="left" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top-target" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Right} id="right-target" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
      <Handle type="target" position={Position.Left} id="left-target" className="!w-0 !h-0 !min-w-0 !min-h-0 !border-0 !opacity-0" />
    </>
  );

  // ── Dot view (zoom < 0.3) ──
  if (lod === 'dot') {
    const dot = (
      <div className={cn('transition-opacity duration-150', lodFadeClass)}>
        <div
          aria-label={data.label || 'Node'}
          className={cn(
            'relative h-3 w-3 rounded-full',
            selected && 'ring-2 ring-[var(--ring)]',
          )}
          style={{ backgroundColor: categoryColor }}
        >
          {hiddenHandles}
        </div>
      </div>
    );
    return id ? <NodeContextMenu nodeId={id}>{dot}</NodeContextMenu> : dot;
  }

  // ── Simplified view (zoom 0.3–0.6) ──
  if (lod === 'simplified') {
    const simple = (
      <div className={cn('transition-opacity duration-150', lodFadeClass)}>
        <div
          className={cn(
            'relative flex items-center justify-center rounded-md border',
            'w-[120px] h-[36px]',
            selected && 'ring-2 ring-[var(--ring)]',
            getSimplifiedShapeClass(shape),
          )}
          style={{
            borderColor: categoryColor,
            backgroundColor: `color-mix(in srgb, ${categoryColor} 18%, var(--surface))`,
            ...getSimplifiedShapeStyle(shape),
          }}
        >
          {hiddenHandles}
          <span
            className="truncate px-2 text-[10px] font-semibold text-[var(--foreground)]"
            style={shape === 'parallelogram' ? { transform: 'skewX(8deg)' } : undefined}
          >
            {data.label}
          </span>
        </div>
      </div>
    );
    return id ? <NodeContextMenu nodeId={id}>{simple}</NodeContextMenu> : simple;
  }

  // ── Full detail view (zoom > 0.6) ──
  const hasThroughput =
    data.metrics?.throughput != null && data.metrics.throughput > 0;

  const shapeContainerStyle = getShapeContainerStyle(shape);
  const shapeContentStyle = getShapeContentStyle(shape);
  const needsPadding = shape === 'hexagon' || shape === 'octagon' || shape === 'diamond';

  // motionAnimate and motionTransition are declared above (before early returns)

  // Source handle style: filled circle with category color
  const sourceHandleClass = cn(
    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
    '!h-2.5 !w-2.5 !border-2 !border-[var(--surface)]',
  );

  // Target handle style: ring/outline circle
  const targetHandleClass = cn(
    'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
    '!h-2.5 !w-2.5 !border-2 !bg-transparent',
  );

  const full = (
    <div className={cn('group transition-opacity duration-150', lodFadeClass)}>
      <motion.div
        animate={motionAnimate}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : animations.canvas.nodeDelete.exit
        }
        transition={motionTransition}
        className={cn(
          'relative min-w-[180px] max-w-[260px] w-auto rounded-lg border bg-[var(--surface)] text-[var(--foreground)]',
          'transition-shadow duration-200',
          selected && 'ring-2 ring-[var(--ring)]',
          getShapeClass(shape),
        )}
        style={{
          borderColor: categoryColor,
          ...shapeContainerStyle,
          backgroundColor: stateGlow.bgTint
            ? stateGlow.bgTint
            : undefined,
          boxShadow: selected
            ? `0 0 12px 2px color-mix(in srgb, ${categoryColor} 35%, transparent)`
            : stateGlow.boxShadow,
          animation: stateGlow.animation,
        }}
        onAnimationComplete={isDeleting ? handleExitComplete : undefined}
      >
        {/* ── Source handles (filled circle, category colored) ── */}
        <Handle
          type="source"
          position={Position.Top}
          id="top"
          className={sourceHandleClass}
          style={{ backgroundColor: categoryColor }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={sourceHandleClass}
          style={{ backgroundColor: categoryColor }}
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={sourceHandleClass}
          style={{ backgroundColor: categoryColor }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          className={sourceHandleClass}
          style={{ backgroundColor: categoryColor }}
        />

        {/* ── Target handles (outline ring, category colored border) ── */}
        <Handle
          type="target"
          position={Position.Top}
          id="top-target"
          className={targetHandleClass}
          style={{ borderColor: categoryColor }}
        />
        <Handle
          type="target"
          position={Position.Right}
          id="right-target"
          className={targetHandleClass}
          style={{ borderColor: categoryColor }}
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom-target"
          className={targetHandleClass}
          style={{ borderColor: categoryColor }}
        />
        <Handle
          type="target"
          position={Position.Left}
          id="left-target"
          className={targetHandleClass}
          style={{ borderColor: categoryColor }}
        />

        {/* ── Content (un-skew for parallelogram, padded for clip-path shapes) ── */}
        <div style={shapeContentStyle} className={needsPadding ? 'px-2' : undefined}>
          {/* ── Header bar with category accent ── */}
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2',
              // Only use rounded top corners for shapes that still have border-radius
              shape === 'rectangle' || shape === 'dashed-rect' || shape === 'parallelogram'
                ? 'rounded-t-lg'
                : undefined,
            )}
            style={{ backgroundColor: `color-mix(in srgb, ${categoryColor} 12%, transparent)` }}
          >
            {/* Icon */}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center"
              style={{ color: categoryColor }}
            >
              {icon}
            </span>

            {/* Label */}
            <span className="text-xs font-semibold whitespace-nowrap">{data.label}</span>

            {/* State indicator ring — replaces the old 8px dot */}
            <span
              aria-label={`State: ${data.state || 'idle'}`}
              className="ml-auto flex h-3 w-3 shrink-0 items-center justify-center"
            >
              <span
                className="block h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: stateColor,
                  backgroundColor: `color-mix(in srgb, ${stateColor} 30%, transparent)`,
                  boxShadow: data.state !== 'idle'
                    ? `0 0 4px 1px color-mix(in srgb, ${stateColor} 40%, transparent)`
                    : undefined,
                  animation: data.state === 'error'
                    ? 'node-error-pulse 1.5s ease-in-out infinite'
                    : data.state === 'warning'
                      ? 'node-warning-glow 2s ease-in-out infinite'
                      : undefined,
                }}
              />
            </span>
          </div>

          {/* ── Metrics badge ── */}
          {hasThroughput && (
            <div className="flex items-center justify-center px-3 py-1.5">
              <span
                className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, ${categoryColor} 10%, transparent)`,
                  color: categoryColor,
                }}
              >
                {formatMetric(data.metrics!.throughput!)} rps
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

  return id ? <NodeContextMenu nodeId={id}>{full}</NodeContextMenu> : full;
});

BaseNode.displayName = 'BaseNode';

export default BaseNode;
