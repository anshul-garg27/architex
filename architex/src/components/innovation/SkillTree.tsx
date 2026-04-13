'use client';

// ─────────────────────────────────────────────────────────────
// SkillTree — Visual Skill-Tree Explorer
// ─────────────────────────────────────────────────────────────
//
// SVG-based tree visualization with:
//   - Hexagonal nodes (locked=gray, unlockable=glowing, unlocked=track-coloured)
//   - Prerequisite edges as lines between hexagons
//   - Click node for detail panel with description + requirements
//   - Progress bar per track
//   - Particle burst animation on unlock
//
// Animation: motion for transitions, CSS for glow/pulse
// Layout: nodes positioned via column/row hints from skill-tree data
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { Lock, Unlock, Star, X, ChevronRight } from 'lucide-react';
import {
  ALL_TRACKS,
  TRACK_NODES,
  TRACK_COLORS,
  SKILL_NODES,
  checkUnlockable,
  getTrackProgress,
  getTrackEdges,
  type SkillTrack,
  type SkillNode,
  type UserProgress,
} from '@/lib/innovation/skill-tree';

// ── Types ──────────────────────────────────────────────────

export interface SkillTreeProps {
  /** Current user progress (unlocked nodes + available XP). */
  progress: UserProgress;
  /** Called when the user unlocks a node. */
  onUnlock?: (nodeId: string) => void;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
}

// ── Constants ──────────────────────────────────────────────

/** Horizontal spacing between columns. */
const COL_GAP = 160;
/** Vertical spacing between rows. */
const ROW_GAP = 100;
/** Hexagon outer radius. */
const HEX_R = 32;
/** Left/top padding for the SVG content. */
const PADDING = 60;

// ── Hex Path Helper ─────────────────────────────────────────

function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top orientation
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${pts.join('L')}Z`;
}

// ── Component ──────────────────────────────────────────────

export const SkillTree = memo(function SkillTree({
  progress,
  onUnlock,
  className,
}: SkillTreeProps) {
  const [selectedTrack, setSelectedTrack] = useState<SkillTrack>('architecture');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const filterId = useId();

  const nodes = TRACK_NODES[selectedTrack];
  const edges = useMemo(() => getTrackEdges(selectedTrack), [selectedTrack]);
  const trackColor = TRACK_COLORS[selectedTrack];

  // Compute SVG dimensions from the node layout.
  const maxCol = useMemo(
    () => Math.max(...nodes.map((n) => n.column), 0),
    [nodes],
  );
  const maxRow = useMemo(
    () => Math.max(...nodes.map((n) => n.row), 0),
    [nodes],
  );
  const svgWidth = (maxCol + 1) * COL_GAP + PADDING * 2;
  const svgHeight = (maxRow + 1) * ROW_GAP + PADDING * 2;

  /** Convert node layout coordinates to SVG pixel coords. */
  const nodePos = useCallback(
    (node: SkillNode) => ({
      x: PADDING + node.column * COL_GAP,
      y: PADDING + node.row * ROW_GAP,
    }),
    [],
  );

  const handleNodeClick = useCallback(
    (node: SkillNode) => {
      setSelectedNode((prev) => (prev?.id === node.id ? null : node));
    },
    [],
  );

  const handleUnlock = useCallback(
    (nodeId: string) => {
      const node = SKILL_NODES[nodeId];
      if (!node) return;
      const pos = nodePos(node);

      // Spawn particles.
      const newParticles: Particle[] = [];
      for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        newParticles.push({
          id: Date.now() + i,
          x: pos.x,
          y: pos.y,
          dx: Math.cos(angle) * (40 + Math.random() * 30),
          dy: Math.sin(angle) * (40 + Math.random() * 30),
          color: trackColor.glow,
        });
      }
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 700);

      onUnlock?.(nodeId);
    },
    [nodePos, onUnlock, trackColor.glow],
  );

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm', className)}>
      {/* ── Track Selector + Progress ──────────────────── */}
      <div className="border-b border-zinc-700/50 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-zinc-100">
            Skill Tree
          </span>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {ALL_TRACKS.map((track) => {
            const tc = TRACK_COLORS[track];
            const pct = getTrackProgress(track, progress);
            return (
              <button
                key={track}
                onClick={() => {
                  setSelectedTrack(track);
                  setSelectedNode(null);
                }}
                className={cn(
                  'flex shrink-0 flex-col items-start rounded-md px-2.5 py-1.5 text-xs transition-colors',
                  track === selectedTrack
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
                )}
              >
                <span className="font-medium">{tc.label}</span>
                {/* Progress bar */}
                <div className="mt-1 h-1 w-16 overflow-hidden rounded-full bg-zinc-700/40">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: tc.base }}
                  />
                </div>
                <span className="mt-0.5 text-[10px] text-zinc-500">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SVG Canvas + Detail Panel ─────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* SVG */}
        <div className="flex-1 overflow-auto">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="select-none"
          >
            <defs>
              {/* Glow filter for unlockable nodes */}
              <filter id={`glow-${filterId}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ── Edges ─────────────────────────────── */}
            {edges.map(([fromId, toId]) => {
              const fromNode = SKILL_NODES[fromId];
              const toNode = SKILL_NODES[toId];
              if (!fromNode || !toNode) return null;
              const from = nodePos(fromNode);
              const to = nodePos(toNode);
              const bothUnlocked =
                progress.unlockedNodes.has(fromId) &&
                progress.unlockedNodes.has(toId);
              const fromUnlocked = progress.unlockedNodes.has(fromId);

              return (
                <line
                  key={`${fromId}-${toId}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={
                    bothUnlocked
                      ? trackColor.base
                      : fromUnlocked
                        ? trackColor.base + '60'
                        : '#3f3f46'
                  }
                  strokeWidth={bothUnlocked ? 2.5 : 1.5}
                  strokeDasharray={bothUnlocked ? 'none' : '4 3'}
                />
              );
            })}

            {/* ── Nodes ─────────────────────────────── */}
            {nodes.map((node) => {
              const pos = nodePos(node);
              const isUnlocked = progress.unlockedNodes.has(node.id);
              const isUnlockable = checkUnlockable(node.id, progress);
              const isSelected = selectedNode?.id === node.id;

              const fill = isUnlocked
                ? trackColor.base
                : isUnlockable
                  ? trackColor.base + '30'
                  : '#27272a';
              const stroke = isUnlocked
                ? trackColor.glow
                : isUnlockable
                  ? trackColor.glow
                  : '#3f3f46';

              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer"
                  filter={isUnlockable ? `url(#glow-${filterId})` : undefined}
                >
                  {/* Hex shape */}
                  <path
                    d={hexPath(pos.x, pos.y, HEX_R)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 3 : isUnlockable ? 2 : 1.5}
                    className={cn(
                      'transition-all duration-200',
                      isUnlockable && 'animate-pulse',
                    )}
                  />
                  {/* Icon */}
                  {isUnlocked ? (
                    <text
                      x={pos.x}
                      y={pos.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-white text-[14px]"
                    >
                      &#x2713;
                    </text>
                  ) : (
                    <text
                      x={pos.x}
                      y={pos.y + 1}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-zinc-500 text-[12px]"
                    >
                      {isUnlockable ? '?' : '\u{1F512}'}
                    </text>
                  )}
                  {/* Label below */}
                  <text
                    x={pos.x}
                    y={pos.y + HEX_R + 14}
                    textAnchor="middle"
                    className={cn(
                      'text-[10px]',
                      isUnlocked ? 'fill-zinc-200' : 'fill-zinc-500',
                    )}
                  >
                    {node.name.length > 18
                      ? node.name.slice(0, 16) + '...'
                      : node.name}
                  </text>
                  {/* XP badge */}
                  {!isUnlocked && node.xpRequired > 0 && (
                    <text
                      x={pos.x}
                      y={pos.y + HEX_R + 26}
                      textAnchor="middle"
                      className="fill-zinc-600 text-[9px]"
                    >
                      {node.xpRequired} XP
                    </text>
                  )}
                </g>
              );
            })}

            {/* ── Particles ─────────────────────────── */}
            {particles.map((p) => (
              <motion.circle
                key={p.id}
                cx={p.x}
                cy={p.y}
                r={3}
                fill={p.color}
                initial={{ cx: p.x, cy: p.y, opacity: 1, r: 3 }}
                animate={{
                  cx: p.x + p.dx,
                  cy: p.y + p.dy,
                  opacity: 0,
                  r: 1,
                }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
          </svg>
        </div>

        {/* ── Detail Panel ─────────────────────────── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="shrink-0 overflow-hidden border-l border-zinc-700/50"
            >
              <NodeDetailPanel
                node={selectedNode}
                progress={progress}
                onUnlock={handleUnlock}
                onClose={() => setSelectedNode(null)}
                trackColor={trackColor}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ── Node Detail Panel ───────────────────────────────────────

interface NodeDetailPanelProps {
  node: SkillNode;
  progress: UserProgress;
  onUnlock: (nodeId: string) => void;
  onClose: () => void;
  trackColor: { base: string; glow: string; label: string };
}

const NodeDetailPanel = memo(function NodeDetailPanel({
  node,
  progress,
  onUnlock,
  onClose,
  trackColor,
}: NodeDetailPanelProps) {
  const isUnlocked = progress.unlockedNodes.has(node.id);
  const isUnlockable = checkUnlockable(node.id, progress);
  const missingPrereqs = node.prerequisites.filter(
    (p) => !progress.unlockedNodes.has(p),
  );

  return (
    <div className="flex h-full w-[260px] flex-col bg-zinc-900/95 p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: trackColor.base }}
        />
        <button
          onClick={onClose}
          className="rounded p-0.5 text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Title */}
      <h3 className="mb-1 text-sm font-semibold text-zinc-100">{node.name}</h3>
      <p className="mb-4 text-xs leading-relaxed text-zinc-400">
        {node.description}
      </p>

      {/* Status */}
      <div className="mb-3 flex items-center gap-2">
        {isUnlocked ? (
          <>
            <Unlock className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400">Unlocked</span>
          </>
        ) : (
          <>
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500">Locked</span>
          </>
        )}
      </div>

      {/* XP requirement */}
      {!isUnlocked && node.xpRequired > 0 && (
        <div className="mb-3 rounded-md border border-zinc-700/40 bg-zinc-800/50 px-3 py-2">
          <span className="text-xs text-zinc-400">
            Requires{' '}
            <span
              className={cn(
                'font-semibold',
                progress.availableXp >= node.xpRequired
                  ? 'text-emerald-400'
                  : 'text-rose-400',
              )}
            >
              {node.xpRequired} XP
            </span>{' '}
            <span className="text-zinc-500">
              (you have {progress.availableXp})
            </span>
          </span>
        </div>
      )}

      {/* Prerequisites */}
      {node.prerequisites.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-1 text-xs font-semibold text-zinc-400">
            Prerequisites
          </h4>
          <ul className="space-y-1">
            {node.prerequisites.map((prereqId) => {
              const prereq = SKILL_NODES[prereqId];
              const met = progress.unlockedNodes.has(prereqId);
              return (
                <li
                  key={prereqId}
                  className="flex items-center gap-1.5 text-xs"
                >
                  {met ? (
                    <span className="text-emerald-400">&#x2713;</span>
                  ) : (
                    <span className="text-zinc-600">&#x2717;</span>
                  )}
                  <span className={met ? 'text-zinc-300' : 'text-zinc-500'}>
                    {prereq?.name ?? prereqId}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Missing prereqs note */}
      {!isUnlocked && missingPrereqs.length > 0 && (
        <p className="mb-3 text-[10px] text-zinc-500">
          Complete {missingPrereqs.length} more prerequisite
          {missingPrereqs.length > 1 ? 's' : ''} to make this node
          available.
        </p>
      )}

      {/* Unlock button */}
      {!isUnlocked && (
        <button
          onClick={() => isUnlockable && onUnlock(node.id)}
          disabled={!isUnlockable}
          className={cn(
            'mt-auto flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors',
            isUnlockable
              ? 'bg-cyan-600/80 text-white hover:bg-cyan-600'
              : 'cursor-not-allowed bg-zinc-800 text-zinc-500',
          )}
        >
          {isUnlockable ? (
            <>
              <Unlock className="h-3.5 w-3.5" />
              Unlock Skill
            </>
          ) : (
            <>
              <Lock className="h-3.5 w-3.5" />
              Requirements Not Met
            </>
          )}
        </button>
      )}
    </div>
  );
});
