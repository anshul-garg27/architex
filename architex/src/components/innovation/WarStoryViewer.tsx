'use client';

// ─────────────────────────────────────────────────────────────
// WarStoryViewer — Interactive Production Incident Case Studies
// ─────────────────────────────────────────────────────────────
//
// Layout:
//   Left   — story selector with severity badges + duration
//   Center — animated architecture diagram (nodes go red over time)
//   Right  — scrollable timeline with expandable events
//   Bottom — root cause, lessons learned, prevention strategies
//
// Playback: play/pause/step through timeline events
// "What would you do?" prompt before revealing root cause
//
// Animation: motion spring for node failure transitions,
//            stagger for timeline entries, pulse for active node
// ─────────────────────────────────────────────────────────────

import { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { duration } from '@/lib/constants/motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Server,
  Database,
  HardDrive,
  Radio,
  Globe,
  Users,
  Settings,
  ShieldCheck,
  Lightbulb,
  BookOpen,
  Target,
  Layers,
} from 'lucide-react';
import {
  WAR_STORY_LIST,
  SEVERITY_CONFIG,
  type WarStory,
  type ArchitectureNode,
  type ArchitectureEdge,
} from '@/lib/innovation/war-stories';
import { IncidentTimeline } from './IncidentTimeline';

// ── Types ──────────────────────────────────────────────────

export interface WarStoryViewerProps {
  /** Initial story id to display. */
  initialStoryId?: string;
  className?: string;
}

type PlaybackState = 'idle' | 'playing' | 'paused' | 'finished';

// ── Constants ──────────────────────────────────────────────

/** Playback speed: ms per timeline minute. */
const MS_PER_MINUTE = 80;

/** Node kind to icon mapping. */
const NODE_ICONS: Record<ArchitectureNode['kind'], typeof Server> = {
  service: Server,
  database: Database,
  cache: HardDrive,
  queue: Radio,
  loadbalancer: Globe,
  dns: Globe,
  client: Users,
  config: Settings,
  certificate: ShieldCheck,
};

/** Grid cell size for architecture diagram. */
const CELL_W = 140;
const CELL_H = 80;
const NODE_W = 120;
const NODE_H = 52;

// ── Component ──────────────────────────────────────────────

export const WarStoryViewer = memo(function WarStoryViewer({
  initialStoryId,
  className,
}: WarStoryViewerProps) {
  // ── State ────────────────────────────────────────────────
  const [selectedStory, setSelectedStory] = useState<WarStory>(
    () => WAR_STORY_LIST.find((s) => s.id === initialStoryId) ?? WAR_STORY_LIST[0],
  );
  const [playback, setPlayback] = useState<PlaybackState>('idle');
  const [activeEventIndex, setActiveEventIndex] = useState(-1);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [rootCauseRevealed, setRootCauseRevealed] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeline = selectedStory.timeline;
  const totalMinutes = timeline[timeline.length - 1]?.minutesOffset ?? 0;

  // ── Playback Logic ──────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPlayback = useCallback(() => {
    stopTimer();
    setPlayback('playing');
    timerRef.current = setInterval(() => {
      setCurrentMinute((prev) => {
        const next = prev + 1;
        if (next > totalMinutes) {
          stopTimer();
          setPlayback('finished');
          return totalMinutes;
        }
        return next;
      });
    }, MS_PER_MINUTE);
  }, [totalMinutes, stopTimer]);

  const pausePlayback = useCallback(() => {
    stopTimer();
    setPlayback('paused');
  }, [stopTimer]);

  const resetPlayback = useCallback(() => {
    stopTimer();
    setPlayback('idle');
    setActiveEventIndex(-1);
    setCurrentMinute(0);
    setRootCauseRevealed(false);
  }, [stopTimer]);

  const stepForward = useCallback(() => {
    const nextIdx = Math.min(activeEventIndex + 1, timeline.length - 1);
    setActiveEventIndex(nextIdx);
    setCurrentMinute(timeline[nextIdx].minutesOffset);
    setPlayback('paused');
    stopTimer();
  }, [activeEventIndex, timeline, stopTimer]);

  const stepBack = useCallback(() => {
    const prevIdx = Math.max(activeEventIndex - 1, 0);
    setActiveEventIndex(prevIdx);
    setCurrentMinute(timeline[prevIdx].minutesOffset);
    setPlayback('paused');
    stopTimer();
  }, [activeEventIndex, timeline, stopTimer]);

  const jumpToEvent = useCallback((index: number) => {
    setActiveEventIndex(index);
    setCurrentMinute(timeline[index].minutesOffset);
    setPlayback('paused');
    stopTimer();
  }, [timeline, stopTimer]);

  // Sync activeEventIndex with currentMinute during playback.
  useEffect(() => {
    if (playback !== 'playing') return;
    const idx = timeline.findIndex((e, i) => {
      const next = timeline[i + 1];
      return next ? currentMinute >= e.minutesOffset && currentMinute < next.minutesOffset : currentMinute >= e.minutesOffset;
    });
    if (idx >= 0 && idx !== activeEventIndex) {
      setActiveEventIndex(idx);
    }
  }, [currentMinute, playback, timeline, activeEventIndex]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  // ── Story Selection ──────────────────────────────────────

  const handleSelectStory = useCallback((story: WarStory) => {
    setSelectedStory(story);
    setSelectorOpen(false);
    resetPlayback();
  }, [resetPlayback]);

  // ── Section Toggle ───────────────────────────────────────

  const toggleSection = useCallback((section: string) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  }, []);

  // ── Computed ─────────────────────────────────────────────

  const failedNodeIds = useMemo(() => {
    const failed = new Set<string>();
    for (const node of selectedStory.architecture.nodes) {
      if (node.failsAtMinute >= 0 && currentMinute >= node.failsAtMinute) {
        failed.add(node.id);
      }
    }
    return failed;
  }, [selectedStory, currentMinute]);

  const svgWidth = useMemo(() => {
    const maxX = Math.max(...selectedStory.architecture.nodes.map((n) => n.x));
    return (maxX + 1) * CELL_W + 40;
  }, [selectedStory]);

  const svgHeight = useMemo(() => {
    const maxY = Math.max(...selectedStory.architecture.nodes.map((n) => n.y));
    return (maxY + 1) * CELL_H + 40;
  }, [selectedStory]);

  const severity = SEVERITY_CONFIG[selectedStory.severity];

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-zinc-700/60 bg-zinc-900/95 shadow-2xl backdrop-blur-sm',
        className,
      )}
    >
      {/* ── Title Bar ─────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-zinc-100">
            War Stories
          </span>
          <span className="text-xs text-zinc-500">Production Incident Case Studies</span>
        </div>
      </div>

      {/* ── Main Layout: Selector | Architecture | Timeline ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Story Selector ─────────────────────── */}
        <div className="flex w-56 shrink-0 flex-col border-r border-zinc-700/50">
          <button
            onClick={() => setSelectorOpen((prev) => !prev)}
            className="flex items-center justify-between border-b border-zinc-700/50 px-3 py-2 text-left transition-colors hover:bg-zinc-800/50"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                    severity.bg,
                    severity.color,
                  )}
                >
                  {severity.label}
                </span>
                <Clock className="h-3 w-3 text-zinc-500" />
                <span className="text-[10px] text-zinc-400">{selectedStory.duration}</span>
              </div>
              <p className="mt-1 truncate text-xs font-semibold text-zinc-100">
                {selectedStory.title}
              </p>
            </div>
            {selectorOpen ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
            )}
          </button>

          <AnimatePresence>
            {selectorOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: duration.normal }}
                className="overflow-hidden"
              >
                <div className="max-h-64 overflow-y-auto">
                  {WAR_STORY_LIST.map((story) => {
                    const sev = SEVERITY_CONFIG[story.severity];
                    const isSelected = story.id === selectedStory.id;
                    return (
                      <button
                        key={story.id}
                        onClick={() => handleSelectStory(story)}
                        className={cn(
                          'flex w-full flex-col border-b border-zinc-700/30 px-3 py-2 text-left transition-colors',
                          isSelected ? 'bg-zinc-800/80' : 'hover:bg-zinc-800/40',
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'shrink-0 rounded px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider',
                              sev.bg,
                              sev.color,
                            )}
                          >
                            {sev.label}
                          </span>
                          <span className="text-[10px] text-zinc-500">{story.duration}</span>
                        </div>
                        <span className="mt-0.5 text-[11px] font-medium text-zinc-200">
                          {story.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary */}
          <div className="flex-1 overflow-y-auto px-3 py-3">
            <p className="text-[11px] leading-relaxed text-zinc-400">
              {selectedStory.summary}
            </p>

            {/* Impact Metrics */}
            <div className="mt-3 space-y-1.5">
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Impact
              </h4>
              <MetricRow label="Revenue Lost" value={selectedStory.impactMetrics.revenueLost} />
              <MetricRow label="Users Affected" value={selectedStory.impactMetrics.usersAffected} />
              <MetricRow label="Downtime" value={selectedStory.impactMetrics.downtime} />
              <MetricRow
                label="SLA Breach"
                value={selectedStory.impactMetrics.slaBreach ? 'Yes' : 'No'}
                valueClass={selectedStory.impactMetrics.slaBreach ? 'text-red-400' : 'text-emerald-400'}
              />
              {selectedStory.impactMetrics.additional &&
                Object.entries(selectedStory.impactMetrics.additional).map(([k, v]) => (
                  <MetricRow key={k} label={k} value={v} />
                ))}
            </div>

            {/* Related Concepts */}
            <div className="mt-3">
              <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Related Concepts
              </h4>
              <div className="flex flex-wrap gap-1">
                {selectedStory.relatedConcepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Center + Right ──────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Playback Controls */}
          <div className="flex items-center gap-2 border-b border-zinc-700/50 px-4 py-2">
            <PlaybackButton
              icon={SkipBack}
              onClick={stepBack}
              disabled={activeEventIndex <= 0 && currentMinute === 0}
              label="Step back"
            />
            {playback === 'playing' ? (
              <PlaybackButton icon={Pause} onClick={pausePlayback} label="Pause" />
            ) : (
              <PlaybackButton
                icon={Play}
                onClick={startPlayback}
                disabled={playback === 'finished'}
                label="Play"
              />
            )}
            <PlaybackButton
              icon={SkipForward}
              onClick={stepForward}
              disabled={activeEventIndex >= timeline.length - 1}
              label="Step forward"
            />
            <PlaybackButton icon={RotateCcw} onClick={resetPlayback} label="Reset" />

            {/* Progress bar */}
            <div className="relative mx-3 h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
              <motion.div
                className="h-full rounded-full bg-cyan-500/70"
                animate={{ width: totalMinutes > 0 ? `${(currentMinute / totalMinutes) * 100}%` : '0%' }}
                transition={{ duration: duration.quick }}
              />
            </div>

            <span className="shrink-0 font-mono text-[10px] text-zinc-500">
              {formatTimeCompact(currentMinute)} / {formatTimeCompact(totalMinutes)}
            </span>
          </div>

          {/* Center: Architecture + Right: Timeline */}
          <div className="flex flex-1 overflow-hidden">
            {/* Architecture Diagram */}
            <div className="flex flex-1 flex-col overflow-auto p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Architecture — Failure Propagation
              </h3>
              <div className="flex-1 overflow-auto">
                <svg
                  width={svgWidth}
                  height={svgHeight}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="mx-auto"
                >
                  {/* Edges */}
                  {selectedStory.architecture.edges.map((edge, i) => (
                    <ArchEdge
                      key={i}
                      edge={edge}
                      nodes={selectedStory.architecture.nodes}
                      failedNodeIds={failedNodeIds}
                    />
                  ))}
                  {/* Nodes */}
                  {selectedStory.architecture.nodes.map((node) => (
                    <ArchNode
                      key={node.id}
                      node={node}
                      failed={failedNodeIds.has(node.id)}
                    />
                  ))}
                </svg>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="w-80 shrink-0 overflow-y-auto border-l border-zinc-700/50 p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Incident Timeline
              </h3>
              <IncidentTimeline
                events={timeline}
                activeIndex={activeEventIndex}
                currentMinute={currentMinute}
                onJumpTo={jumpToEvent}
              />
            </div>
          </div>

          {/* ── Bottom: Analysis ──────────────────────────── */}
          <div className="border-t border-zinc-700/50">
            {/* "What would you do?" prompt */}
            {!rootCauseRevealed && (
              <div className="flex items-center justify-between border-b border-zinc-700/30 px-4 py-2">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    What would you do? Think about the root cause before revealing.
                  </span>
                </div>
                <button
                  onClick={() => setRootCauseRevealed(true)}
                  className="flex items-center gap-1 rounded-md bg-amber-600/20 px-3 py-1 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-600/30"
                >
                  <Eye className="h-3 w-3" />
                  Reveal Analysis
                </button>
              </div>
            )}

            {rootCauseRevealed && (
              <div className="flex items-center justify-between border-b border-zinc-700/30 px-4 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Analysis
                </span>
                <button
                  onClick={() => setRootCauseRevealed(false)}
                  className="flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <EyeOff className="h-3 w-3" />
                  Hide
                </button>
              </div>
            )}

            <AnimatePresence>
              {rootCauseRevealed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: duration.normal }}
                  className="overflow-hidden"
                >
                  <div className="max-h-72 overflow-y-auto px-4 py-3">
                    {/* Root Cause */}
                    <AnalysisSection
                      title="Root Cause"
                      icon={Target}
                      iconColor="text-red-400"
                      expanded={expandedSection === 'root-cause'}
                      onToggle={() => toggleSection('root-cause')}
                    >
                      <p className="text-[11px] leading-relaxed text-zinc-400">
                        {selectedStory.rootCause}
                      </p>
                    </AnalysisSection>

                    {/* Lessons Learned */}
                    <AnalysisSection
                      title="Lessons Learned"
                      icon={BookOpen}
                      iconColor="text-blue-400"
                      expanded={expandedSection === 'lessons'}
                      onToggle={() => toggleSection('lessons')}
                    >
                      <ul className="space-y-1">
                        {selectedStory.lessonsLearned.map((lesson, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400">
                            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                            {lesson}
                          </li>
                        ))}
                      </ul>
                    </AnalysisSection>

                    {/* Prevention Strategies */}
                    <AnalysisSection
                      title="Prevention Strategies"
                      icon={Layers}
                      iconColor="text-emerald-400"
                      expanded={expandedSection === 'prevention'}
                      onToggle={() => toggleSection('prevention')}
                    >
                      <ul className="space-y-1">
                        {selectedStory.preventionStrategies.map((strategy, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-zinc-400">
                            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </AnalysisSection>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Sub-Components ─────────────────────────────────────────

/** Small metric row for the sidebar. */
const MetricRow = memo(function MetricRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={cn('text-[10px] font-semibold', valueClass ?? 'text-zinc-300')}>
        {value}
      </span>
    </div>
  );
});

/** Playback control button. */
const PlaybackButton = memo(function PlaybackButton({
  icon: Icon,
  onClick,
  disabled,
  label,
}: {
  icon: typeof Play;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'rounded-md p-1.5 transition-colors',
        disabled
          ? 'cursor-not-allowed text-zinc-600'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
});

/** Collapsible analysis section. */
const AnalysisSection = memo(function AnalysisSection({
  title,
  icon: Icon,
  iconColor,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: typeof Target;
  iconColor: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-zinc-700/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 py-2 text-left"
      >
        <Icon className={cn('h-3.5 w-3.5', iconColor)} />
        <span className="text-xs font-semibold text-zinc-200">{title}</span>
        <ChevronRight
          className={cn(
            'ml-auto h-3 w-3 text-zinc-500 transition-transform',
            expanded && 'rotate-90',
          )}
        />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration.normal }}
            className="overflow-hidden pb-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Architecture Diagram Primitives ────────────────────────

/** Compute centre of a node in SVG coords. */
function nodeCenter(node: ArchitectureNode): { cx: number; cy: number } {
  return {
    cx: node.x * CELL_W + 20 + NODE_W / 2,
    cy: node.y * CELL_H + 20 + NODE_H / 2,
  };
}

/** Architecture edge drawn as a line with optional label. */
const ArchEdge = memo(function ArchEdge({
  edge,
  nodes,
  failedNodeIds,
}: {
  edge: ArchitectureEdge;
  nodes: ArchitectureNode[];
  failedNodeIds: Set<string>;
}) {
  const from = nodes.find((n) => n.id === edge.from);
  const to = nodes.find((n) => n.id === edge.to);
  if (!from || !to) return null;

  const a = nodeCenter(from);
  const b = nodeCenter(to);
  const midX = (a.cx + b.cx) / 2;
  const midY = (a.cy + b.cy) / 2;

  const eitherFailed = failedNodeIds.has(edge.from) || failedNodeIds.has(edge.to);

  return (
    <g>
      <line
        x1={a.cx}
        y1={a.cy}
        x2={b.cx}
        y2={b.cy}
        stroke={eitherFailed ? '#ef4444' : '#52525b'}
        strokeWidth={eitherFailed ? 2 : 1.5}
        strokeDasharray={eitherFailed ? '6 3' : undefined}
        opacity={eitherFailed ? 0.8 : 0.5}
      />
      {/* Arrowhead */}
      <ArrowHead cx={a.cx} cy={a.cy} dx={b.cx} dy={b.cy} color={eitherFailed ? '#ef4444' : '#52525b'} />
      {edge.label && (
        <text
          x={midX}
          y={midY - 6}
          textAnchor="middle"
          className="fill-zinc-500"
          fontSize={9}
          fontFamily="ui-monospace, monospace"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
});

/** Simple arrowhead at the target end of an edge. */
const ArrowHead = memo(function ArrowHead({
  cx,
  cy,
  dx,
  dy,
  color,
}: {
  cx: number;
  cy: number;
  dx: number;
  dy: number;
  color: string;
}) {
  const angle = Math.atan2(dy - cy, dx - cx);
  const len = 8;
  const spread = Math.PI / 7;
  const tipX = dx - Math.cos(angle) * (NODE_W / 2);
  const tipY = dy - Math.sin(angle) * (NODE_H / 2);

  const x1 = tipX - len * Math.cos(angle - spread);
  const y1 = tipY - len * Math.sin(angle - spread);
  const x2 = tipX - len * Math.cos(angle + spread);
  const y2 = tipY - len * Math.sin(angle + spread);

  return (
    <polygon
      points={`${tipX},${tipY} ${x1},${y1} ${x2},${y2}`}
      fill={color}
      opacity={0.7}
    />
  );
});

/** Architecture node rendered as a rounded rect with icon and label. */
const ArchNode = memo(function ArchNode({
  node,
  failed,
}: {
  node: ArchitectureNode;
  failed: boolean;
}) {
  const Icon = NODE_ICONS[node.kind];
  const x = node.x * CELL_W + 20;
  const y = node.y * CELL_H + 20;

  return (
    <g>
      {/* Failure glow */}
      {failed && (
        <rect
          x={x - 3}
          y={y - 3}
          width={NODE_W + 6}
          height={NODE_H + 6}
          rx={10}
          fill="none"
          stroke="#ef4444"
          strokeWidth={2}
          opacity={0.4}
        >
          <animate
            attributeName="opacity"
            values="0.2;0.6;0.2"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      )}

      {/* Node background */}
      <rect
        x={x}
        y={y}
        width={NODE_W}
        height={NODE_H}
        rx={8}
        fill={failed ? '#7f1d1d' : '#27272a'}
        stroke={failed ? '#ef4444' : '#3f3f46'}
        strokeWidth={1.5}
      />

      {/* Icon (foreignObject for lucide) */}
      <foreignObject x={x + 8} y={y + 10} width={16} height={16}>
        <Icon
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as any)}
          className={cn('h-4 w-4', failed ? 'text-red-400' : 'text-zinc-400')}
        />
      </foreignObject>

      {/* Label */}
      <text
        x={x + 30}
        y={y + 22}
        className={cn('text-[10px] font-semibold', failed ? 'fill-red-300' : 'fill-zinc-200')}
        fontSize={10}
      >
        {node.label.length > 14 ? `${node.label.slice(0, 14)}...` : node.label}
      </text>

      {/* Status badge */}
      <text
        x={x + 30}
        y={y + 38}
        fontSize={8}
        fontFamily="ui-monospace, monospace"
        className={failed ? 'fill-red-400' : 'fill-emerald-500'}
      >
        {failed ? 'FAILING' : 'healthy'}
      </text>
    </g>
  );
});

// ── Helpers ────────────────────────────────────────────────

function formatTimeCompact(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h${rem}m` : `${h}h`;
}
