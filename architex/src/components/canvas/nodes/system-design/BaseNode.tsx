'use client';

import React, { memo, useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { useViewportStore } from '@/stores/viewport-store';
import { useSimulationStore } from '@/stores/simulation-store';
import { NodeContextMenu } from '@/components/canvas/overlays/NodeContextMenu';
import { SimMetricsBadge } from './SimMetricsBadge';
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
// Glows render on a dedicated overlay element so degraded/down states
// can pulse via `opacity` only (compositor-friendly) instead of
// animating box-shadow on the node container.

const STATE_GLOW_STYLES: Record<
  SystemDesignNodeData['state'],
  { boxShadow?: string; bgTint?: string; pulse?: boolean }
> = {
  idle: {},
  active: {
    boxShadow: '0 0 8px 2px color-mix(in srgb, var(--state-active) 30%, transparent)',
    bgTint: 'color-mix(in srgb, var(--state-active) 6%, transparent)',
  },
  success: {
    boxShadow: '0 0 8px 2px color-mix(in srgb, var(--state-success) 30%, transparent)',
    bgTint: 'color-mix(in srgb, var(--state-success) 6%, transparent)',
  },
  warning: {
    boxShadow: '0 0 8px 2px color-mix(in srgb, var(--state-warning) 30%, transparent)',
    bgTint: 'color-mix(in srgb, var(--state-warning) 8%, transparent)',
    pulse: true,
  },
  error: {
    boxShadow: '0 0 10px 2px color-mix(in srgb, var(--state-error) 38%, transparent)',
    bgTint: 'color-mix(in srgb, var(--state-error) 8%, transparent)',
    pulse: true,
  },
  processing: {
    boxShadow: '0 0 8px 2px color-mix(in srgb, var(--state-processing) 30%, transparent)',
    bgTint: 'color-mix(in srgb, var(--state-processing) 6%, transparent)',
    pulse: true,
  },
};

// ── Keyframes injected once ─────────────────────────────────

const KEYFRAMES_ID = 'architex-node-state-keyframes-v3';

function ensureKeyframes() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  // The .sim-band-chrome rules implement ambient band-driven health chrome
  // during simulation. The `data-sim-band` attribute is written onto the
  // node container ([data-sim-chrome]) by SimBadgeDriver (SimMetricsBadge)
  // on band transitions only — no React state, no per-tick re-renders.
  // healthy = no chrome; watch = subtle amber border; concerning = amber
  // glow; critical = red glow + gentle opacity pulse (compositor-only,
  // disabled under prefers-reduced-motion).
  style.textContent = `
@keyframes node-glow-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
.sim-band-chrome {
  opacity: 0;
  transition: opacity 300ms ease, box-shadow 300ms ease;
}
[data-sim-band='watch'] > .sim-band-chrome {
  opacity: 1;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--state-warning) 60%, transparent);
}
[data-sim-band='concerning'] > .sim-band-chrome {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px var(--state-warning),
    0 0 10px 2px color-mix(in srgb, var(--state-warning) 35%, transparent);
  background-color: color-mix(in srgb, var(--state-warning) 6%, transparent);
}
[data-sim-band='critical'] > .sim-band-chrome {
  opacity: 1;
  box-shadow:
    inset 0 0 0 1px var(--state-error),
    0 0 12px 3px color-mix(in srgb, var(--state-error) 40%, transparent);
  background-color: color-mix(in srgb, var(--state-error) 7%, transparent);
}
@media (prefers-reduced-motion: no-preference) {
  [data-sim-band='critical'] > .sim-band-chrome {
    animation: node-glow-pulse 2.4s ease-in-out infinite;
  }
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

// ── Idle config summary ─────────────────────────────────────
// Surfaces the 1-2 most telling config values under the label at full
// LOD (e.g. "×20 · 50ms" or "8GB · TTL 1h"). Priority order matters:
// scale first, then timing, then capacity, then string descriptors.

const MAX_SUMMARY_PARTS = 2;

type ConfigValue = SystemDesignNodeData['config'][string];

function asNumber(value: ConfigValue): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatSeconds(seconds: number): string {
  if (seconds >= 3600) return `${Math.round(seconds / 3600)}h`;
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`;
  return `${seconds}s`;
}

const CONFIG_SUMMARY_RULES: ReadonlyArray<{
  key: string;
  format: (value: ConfigValue) => string | null;
}> = [
  { key: 'instances', format: (v) => { const n = asNumber(v); return n != null && n > 0 ? `×${n}` : null; } },
  { key: 'replicas', format: (v) => { const n = asNumber(v); return n != null && n > 0 ? `${n} repl` : null; } },
  { key: 'shards', format: (v) => { const n = asNumber(v); return n != null && n > 0 ? `${n} shard${n === 1 ? '' : 's'}` : null; } },
  { key: 'partitions', format: (v) => { const n = asNumber(v); return n != null && n > 0 ? `${n} part` : null; } },
  { key: 'processingTimeMs', format: (v) => { const n = asNumber(v); return n != null ? `${n}ms` : null; } },
  { key: 'memoryGB', format: (v) => { const n = asNumber(v); return n != null ? `${n}GB` : null; } },
  { key: 'memoryMB', format: (v) => { const n = asNumber(v); return n != null ? `${n}MB` : null; } },
  { key: 'storageTB', format: (v) => { const n = asNumber(v); return n != null ? `${n}TB` : null; } },
  { key: 'storageGB', format: (v) => { const n = asNumber(v); return n != null ? `${n}GB` : null; } },
  { key: 'replicationFactor', format: (v) => { const n = asNumber(v); return n != null ? `RF ${n}` : null; } },
  { key: 'maxConnections', format: (v) => { const n = asNumber(v); return n != null ? `${formatMetric(n)} conn` : null; } },
  { key: 'rateLimitRps', format: (v) => { const n = asNumber(v); return n != null ? `${formatMetric(n)} rps cap` : null; } },
  { key: 'ttlSeconds', format: (v) => { const n = asNumber(v); return n != null ? `TTL ${formatSeconds(n)}` : null; } },
  { key: 'algorithm', format: (v) => (typeof v === 'string' && v.length > 0 ? v : null) },
  { key: 'type', format: (v) => (typeof v === 'string' && v.length > 0 ? v : null) },
];

function getConfigSummary(config: SystemDesignNodeData['config'] | undefined): string {
  if (!config) return '';
  const parts: string[] = [];
  for (const rule of CONFIG_SUMMARY_RULES) {
    if (parts.length >= MAX_SUMMARY_PARTS) break;
    const raw = config[rule.key];
    if (raw === undefined) continue;
    const formatted = rule.format(raw);
    if (formatted) parts.push(formatted);
  }
  return parts.join(' · ');
}

// Shapes with a straight left edge can carry the 2px category accent bar;
// clip-path and heavily rounded shapes rely on the tinted icon well instead.
const ACCENT_BAR_SHAPES: ReadonlySet<NodeShape> = new Set<NodeShape>([
  'rectangle',
  'dashed-rect',
  'parallelogram',
]);

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
  // Lifecycle status only changes on start/pause/stop — NOT per tick,
  // so this subscription does not cause per-tick re-renders.
  const simStatus = useSimulationStore((s) => s.status);

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

  // Cheap derived string — recomputes only when the config object is replaced.
  const configSummary = useMemo(() => getConfigSummary(data.config), [data.config]);

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
  const isSimActive = simStatus === 'running' || simStatus === 'paused';
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
    <div
      className={cn(
        'group transition-[opacity,transform] duration-150 ease-out',
        'motion-safe:hover:-translate-y-0.5',
        lodFadeClass,
      )}
    >
      <motion.div
        data-sim-chrome=""
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
          !selected && 'shadow-md shadow-black/20 group-hover:shadow-lg group-hover:shadow-black/40',
          getShapeClass(shape),
        )}
        style={{
          borderColor: categoryColor,
          ...shapeContainerStyle,
          boxShadow: selected
            ? '0 0 18px 2px color-mix(in srgb, var(--primary) 32%, transparent)'
            : undefined,
        }}
        onAnimationComplete={isDeleting ? handleExitComplete : undefined}
      >
        {/* ── Sim band chrome (ambient health during sim; driven by data-sim-band,
               written by SimBadgeDriver on band transitions — zero React state) ── */}
        {isSimActive && (
          <span
            aria-hidden
            className="sim-band-chrome pointer-events-none absolute inset-0"
            style={{ borderRadius: 'inherit' }}
          />
        )}

        {/* ── State glow overlay (pulses via opacity only — compositor-friendly) ── */}
        {(stateGlow.boxShadow || stateGlow.bgTint) && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: 'inherit',
              backgroundColor: stateGlow.bgTint,
              boxShadow: stateGlow.boxShadow,
              animation:
                stateGlow.pulse && !prefersReducedMotion
                  ? 'node-glow-pulse 2.2s ease-in-out infinite'
                  : undefined,
            }}
          />
        )}

        {/* ── Category accent bar (straight-edged shapes only) ── */}
        {ACCENT_BAR_SHAPES.has(shape) && (
          <span
            aria-hidden
            className="pointer-events-none absolute bottom-1.5 left-0 top-1.5 w-0.5 rounded-r-full"
            style={{ backgroundColor: categoryColor }}
          />
        )}

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
            {/* Icon — tinted category well */}
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{
                color: categoryColor,
                backgroundColor: `color-mix(in srgb, ${categoryColor} 16%, transparent)`,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${categoryColor} 30%, transparent)`,
              }}
            >
              {icon}
            </span>

            {/* Label + idle config summary */}
            <span className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold whitespace-nowrap">{data.label}</span>
              {!isSimActive && configSummary && (
                <span className="truncate text-[9px] font-medium leading-tight tabular-nums text-[var(--muted-foreground)]">
                  {configSummary}
                </span>
              )}
            </span>

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
                  animation:
                    !prefersReducedMotion && (data.state === 'error' || data.state === 'warning')
                      ? 'node-glow-pulse 1.6s ease-in-out infinite'
                      : undefined,
                }}
              />
            </span>
          </div>

          {/* ── Live sim metrics badge (rAF-driven via SimMetricsBus, zero re-renders).
                 Detail tier opens on hover (CSS group-hover) or selection. ── */}
          {isSimActive && id && (
            <div className="px-3 py-1.5">
              <SimMetricsBadge nodeId={id} expanded={selected} />
            </div>
          )}

          {/* ── Static metrics badge (only when sim is not active) ── */}
          {!isSimActive && hasThroughput && (
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
