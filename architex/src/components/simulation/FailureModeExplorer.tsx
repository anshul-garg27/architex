'use client';

// ─────────────────────────────────────────────────────────────
// FailureModeExplorer — Interactive Failure Cascade Visualizer (INO-003)
// ─────────────────────────────────────────────────────────────
//
// Layout: Three-panel (left catalog | center graph | right timeline)
// Rendering: SVG for topology, HTML for catalog + timeline
// Features:
//   - 18 failure modes grouped by category (searchable)
//   - Click node to inject failure; cascade propagates visually
//   - Play/pause/step/restart controls with speed adjustment
//   - Nodes transition green -> yellow -> red via motion animations
//   - Timeline panel shows ordered cascade events
//
// Animation: Node color transitions 300ms, pulse 600ms
// Performance: SVG fine for ~20 nodes
// Standalone: Can be embedded in any module or page
// ─────────────────────────────────────────────────────────────

import {
  memo,
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Search,
  Zap,
  AlertTriangle,
  XCircle,
  CheckCircle,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { duration, easing } from '@/lib/constants/motion';
import {
  FAILURE_MODES,
  getGroupedFailureModes,
  simulateCascade,
} from '@/lib/simulation/failure-modes';
import type {
  FailureMode,
  FailureCategory,
} from '@/lib/simulation/failure-modes';
import type {
  CascadeStep,
  TopologyNode,
  TopologyEdge,
  CascadeNodeStatus,
} from '@/lib/simulation/cascade-engine';

// ── Types ─────────────────────────────────────────────────────

export interface FailureModeExplorerProps {
  /** Topology nodes. If omitted, a default demo topology is used. */
  nodes?: TopologyNode[];
  /** Topology edges. If omitted, a default demo topology is used. */
  edges?: TopologyEdge[];
  /** Height of the component in px. */
  height?: number;
  className?: string;
}

// ── Status colors ─────────────────────────────────────────────

const STATUS_COLORS: Record<CascadeNodeStatus, string> = {
  healthy: '#22c55e',   // green-500
  degraded: '#eab308',  // yellow-500
  failed: '#ef4444',    // red-500
  recovered: '#3b82f6', // blue-500
};

const STATUS_BG: Record<CascadeNodeStatus, string> = {
  healthy: 'bg-green-500/20',
  degraded: 'bg-yellow-500/20',
  failed: 'bg-red-500/20',
  recovered: 'bg-blue-500/20',
};

const STATUS_BORDER: Record<CascadeNodeStatus, string> = {
  healthy: 'border-green-500/40',
  degraded: 'border-yellow-500/40',
  failed: 'border-red-500/40',
  recovered: 'border-blue-500/40',
};

const CATEGORY_ICONS: Record<FailureCategory, typeof Zap> = {
  network: Zap,
  compute: Gauge,
  storage: AlertTriangle,
  external: XCircle,
};

const CATEGORY_COLORS: Record<FailureCategory, string> = {
  network: 'text-blue-400',
  compute: 'text-orange-400',
  storage: 'text-purple-400',
  external: 'text-red-400',
};

const SEVERITY_BADGE: Record<string, string> = {
  low: 'bg-green-900/50 text-green-300 border-green-700/50',
  medium: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
  high: 'bg-orange-900/50 text-orange-300 border-orange-700/50',
  critical: 'bg-red-900/50 text-red-300 border-red-700/50',
};

// ── Default demo topology ─────────────────────────────────────

const DEFAULT_NODES: TopologyNode[] = [
  { id: 'client', label: 'Client', type: 'web-server' },
  { id: 'cdn', label: 'CDN', type: 'cdn', hasFallback: true },
  { id: 'lb', label: 'Load Balancer', type: 'load-balancer' },
  { id: 'api-1', label: 'API Server 1', type: 'api-server', hasCircuitBreaker: true },
  { id: 'api-2', label: 'API Server 2', type: 'api-server', hasCircuitBreaker: true },
  { id: 'cache', label: 'Redis Cache', type: 'cache', hasFallback: true },
  { id: 'db-primary', label: 'DB Primary', type: 'database' },
  { id: 'db-replica', label: 'DB Replica', type: 'database' },
  { id: 'queue', label: 'Message Queue', type: 'queue', hasRetry: true },
  { id: 'worker', label: 'Worker', type: 'worker', hasRetry: true },
];

const DEFAULT_EDGES: TopologyEdge[] = [
  { source: 'client', target: 'cdn' },
  { source: 'client', target: 'lb' },
  { source: 'lb', target: 'api-1' },
  { source: 'lb', target: 'api-2' },
  { source: 'api-1', target: 'cache' },
  { source: 'api-2', target: 'cache' },
  { source: 'api-1', target: 'db-primary' },
  { source: 'api-2', target: 'db-primary' },
  { source: 'db-primary', target: 'db-replica' },
  { source: 'api-1', target: 'queue' },
  { source: 'queue', target: 'worker' },
];

// ── Layout: auto-arrange nodes in a grid-like layout ──────────

const SVG_WIDTH = 560;
const SVG_HEIGHT = 400;
const NODE_RADIUS = 24;

interface LayoutPosition {
  x: number;
  y: number;
}

function computeLayout(nodes: TopologyNode[], edges: TopologyEdge[]): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();

  // Build adjacency and compute topological layers via BFS depth.
  const outAdj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  for (const node of nodes) {
    outAdj.set(node.id, []);
    inDegree.set(node.id, 0);
  }
  for (const edge of edges) {
    outAdj.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // BFS from roots (nodes with inDegree === 0).
  const layers: string[][] = [];
  const depth = new Map<string, number>();
  const queue: string[] = [];

  for (const node of nodes) {
    if ((inDegree.get(node.id) ?? 0) === 0) {
      queue.push(node.id);
      depth.set(node.id, 0);
    }
  }

  // If no roots found, just use the first node.
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
    depth.set(nodes[0].id, 0);
  }

  let idx = 0;
  while (idx < queue.length) {
    const nodeId = queue[idx];
    idx++;
    const d = depth.get(nodeId) ?? 0;
    while (layers.length <= d) layers.push([]);
    layers[d].push(nodeId);

    for (const targetId of outAdj.get(nodeId) ?? []) {
      if (!depth.has(targetId)) {
        depth.set(targetId, d + 1);
        queue.push(targetId);
      }
    }
  }

  // Add any unvisited nodes to the last layer.
  for (const node of nodes) {
    if (!depth.has(node.id)) {
      const lastLayer = layers.length > 0 ? layers.length - 1 : 0;
      if (layers.length === 0) layers.push([]);
      layers[lastLayer].push(node.id);
    }
  }

  // Position nodes: layers spread horizontally, nodes within a layer vertically.
  const layerCount = layers.length;
  const padX = 60;
  const padY = 50;
  const usableW = SVG_WIDTH - 2 * padX;
  const usableH = SVG_HEIGHT - 2 * padY;

  for (let li = 0; li < layerCount; li++) {
    const layer = layers[li];
    const x = layerCount === 1
      ? SVG_WIDTH / 2
      : padX + (usableW * li) / (layerCount - 1);

    for (let ni = 0; ni < layer.length; ni++) {
      const y = layer.length === 1
        ? SVG_HEIGHT / 2
        : padY + (usableH * ni) / (layer.length - 1);
      positions.set(layer[ni], { x, y });
    }
  }

  return positions;
}

// ── Playback state ────────────────────────────────────────────

type PlayState = 'idle' | 'playing' | 'paused' | 'done';

// ── Component ─────────────────────────────────────────────────

export const FailureModeExplorer = memo(function FailureModeExplorer({
  nodes: propNodes,
  edges: propEdges,
  height = 640,
  className,
}: FailureModeExplorerProps) {
  // Topology.
  const nodes = propNodes ?? DEFAULT_NODES;
  const edges = propEdges ?? DEFAULT_EDGES;

  // Layout positions.
  const layout = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);

  // State.
  const [selectedMode, setSelectedMode] = useState<FailureMode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cascadeSteps, setCascadeSteps] = useState<CascadeStep[]>([]);
  const [visibleStepIndex, setVisibleStepIndex] = useState(-1);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(1);
  const [failureNodeId, setFailureNodeId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Grouped modes for catalog.
  const groupedModes = useMemo(() => getGroupedFailureModes(), []);

  // Filtered modes by search.
  const filteredModes = useMemo(() => {
    if (!searchQuery.trim()) return null; // show grouped view
    const q = searchQuery.toLowerCase();
    return FAILURE_MODES.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.includes(q),
    );
  }, [searchQuery]);

  // Current node statuses based on visible steps.
  const nodeStatuses = useMemo(() => {
    const statuses = new Map<string, CascadeNodeStatus>();
    for (const node of nodes) {
      statuses.set(node.id, 'healthy');
    }
    for (let i = 0; i <= visibleStepIndex && i < cascadeSteps.length; i++) {
      statuses.set(cascadeSteps[i].affectedNodeId, cascadeSteps[i].status);
    }
    return statuses;
  }, [nodes, cascadeSteps, visibleStepIndex]);

  // Cleanup timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Auto-scroll timeline to latest event.
  useEffect(() => {
    if (timelineRef.current && visibleStepIndex >= 0) {
      const el = timelineRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleStepIndex]);

  // ── Playback logic ──────────────────────────────────────────

  const stepForward = useCallback(() => {
    setVisibleStepIndex((prev) => {
      const next = prev + 1;
      if (next >= cascadeSteps.length) {
        setPlayState('done');
        return prev;
      }
      return next;
    });
  }, [cascadeSteps.length]);

  const startPlayback = useCallback(() => {
    if (cascadeSteps.length === 0) return;
    setPlayState('playing');
  }, [cascadeSteps.length]);

  const pausePlayback = useCallback(() => {
    setPlayState('paused');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Advance playback on interval.
  useEffect(() => {
    if (playState !== 'playing') return;

    if (visibleStepIndex >= cascadeSteps.length - 1) {
      setPlayState('done');
      return;
    }

    const currentTime = visibleStepIndex >= 0
      ? cascadeSteps[visibleStepIndex].timeMs
      : 0;
    const nextTime = cascadeSteps[visibleStepIndex + 1]?.timeMs ?? currentTime;
    const delta = Math.max(nextTime - currentTime, 100);
    const interval = delta / speed;

    timerRef.current = setTimeout(() => {
      setVisibleStepIndex((prev) => {
        const next = prev + 1;
        if (next >= cascadeSteps.length) {
          setPlayState('done');
          return prev;
        }
        return next;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playState, visibleStepIndex, cascadeSteps, speed]);

  // ── Injection ───────────────────────────────────────────────

  const injectFailure = useCallback(
    (nodeId: string) => {
      if (!selectedMode) return;

      const steps = simulateCascade(selectedMode, nodes, edges, nodeId);
      setCascadeSteps(steps);
      setVisibleStepIndex(-1);
      setFailureNodeId(nodeId);
      setPlayState('idle');

      // Auto-start after a brief pause.
      setTimeout(() => {
        setVisibleStepIndex(0);
        setPlayState('playing');
      }, 300);
    },
    [selectedMode, nodes, edges],
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (selectedMode) {
        injectFailure(nodeId);
      }
    },
    [selectedMode, injectFailure],
  );

  const restart = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisibleStepIndex(-1);
    setCascadeSteps([]);
    setPlayState('idle');
    setFailureNodeId(null);
  }, []);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div
      className={cn('flex rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden', className)}
      style={{ height }}
    >
      {/* ── Left Panel: Failure Mode Catalog ── */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-zinc-800">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200 mb-2">
            Failure Modes
          </h3>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search failures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search failure modes"
              className="w-full pl-7 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredModes ? (
            // Flat search results.
            <div className="p-2 space-y-1">
              {filteredModes.map((mode) => (
                <FailureModeCard
                  key={mode.id}
                  mode={mode}
                  isSelected={selectedMode?.id === mode.id}
                  onSelect={setSelectedMode}
                />
              ))}
              {filteredModes.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No matching failure modes
                </p>
              )}
            </div>
          ) : (
            // Grouped by category.
            <div className="p-2 space-y-3">
              {Array.from(groupedModes.entries()).map(([category, modes]) => {
                const Icon = CATEGORY_ICONS[category];
                return (
                  <div key={category}>
                    <div className="flex items-center gap-1.5 px-1 mb-1">
                      <Icon className={cn('w-3.5 h-3.5', CATEGORY_COLORS[category])} />
                      <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                        {category}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {modes.map((mode) => (
                        <FailureModeCard
                          key={mode.id}
                          mode={mode}
                          isSelected={selectedMode?.id === mode.id}
                          onSelect={setSelectedMode}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected mode details */}
        {selectedMode && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              {selectedMode.description}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedMode.recoverySteps.slice(0, 3).map((step, i) => (
                <span
                  key={i}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                >
                  {i + 1}. {step}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-emerald-400 mt-2">
              Click a node in the graph to inject this failure
            </p>
          </div>
        )}
      </div>

      {/* ── Center Panel: Topology Visualization ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Controls bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
          <button
            onClick={playState === 'playing' ? pausePlayback : startPlayback}
            disabled={cascadeSteps.length === 0}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={playState === 'playing' ? 'Pause' : 'Play'}
          >
            {playState === 'playing' ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={stepForward}
            disabled={
              cascadeSteps.length === 0 ||
              visibleStepIndex >= cascadeSteps.length - 1
            }
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Step forward"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          <button
            onClick={restart}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            aria-label="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-zinc-700 mx-1" />

          {/* Speed control */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500">Speed</span>
            {[0.5, 1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] transition-colors',
                  speed === s
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-500 hover:text-zinc-300',
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Status indicator */}
          <span className="text-[10px] text-zinc-500">
            {playState === 'idle' && !selectedMode && 'Select a failure mode'}
            {playState === 'idle' && selectedMode && !failureNodeId && 'Click a node to inject'}
            {playState === 'idle' && failureNodeId && 'Ready'}
            {playState === 'playing' &&
              `Step ${visibleStepIndex + 1} / ${cascadeSteps.length}`}
            {playState === 'paused' && 'Paused'}
            {playState === 'done' && 'Cascade complete'}
          </span>
        </div>

        {/* SVG topology */}
        <div className="flex-1 relative overflow-hidden">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-full"
            role="img"
            aria-label="System topology with failure cascade visualization"
          >
            <defs>
              <marker
                id="arrow-marker"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#52525b" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((edge) => {
              const from = layout.get(edge.source);
              const to = layout.get(edge.target);
              if (!from || !to) return null;

              // Shorten line to not overlap node circles.
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist === 0) return null;
              const ux = dx / dist;
              const uy = dy / dist;
              const x1 = from.x + ux * (NODE_RADIUS + 2);
              const y1 = from.y + uy * (NODE_RADIUS + 2);
              const x2 = to.x - ux * (NODE_RADIUS + 6);
              const y2 = to.y - uy * (NODE_RADIUS + 6);

              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#3f3f46"
                  strokeWidth={1.5}
                  markerEnd="url(#arrow-marker)"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pos = layout.get(node.id);
              if (!pos) return null;
              const status = nodeStatuses.get(node.id) ?? 'healthy';
              const color = STATUS_COLORS[status];
              const isClickable = selectedMode !== null;
              const isFailureOrigin = failureNodeId === node.id;

              return (
                <g
                  key={node.id}
                  onClick={() => handleNodeClick(node.id)}
                  style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  role="button"
                  aria-label={`${node.label} (${status})`}
                >
                  {/* Pulse ring for active failures */}
                  {(status === 'failed' || status === 'degraded') && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_RADIUS + 4}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      initial={{ opacity: 0.8, r: NODE_RADIUS + 2 }}
                      animate={{
                        opacity: [0.8, 0],
                        r: [NODE_RADIUS + 2, NODE_RADIUS + 14],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: easing.out,
                      }}
                    />
                  )}

                  {/* Failure origin marker */}
                  {isFailureOrigin && (
                    <motion.circle
                      cx={pos.x}
                      cy={pos.y}
                      r={NODE_RADIUS + 8}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={1}
                      strokeDasharray="4 3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.6 }}
                      transition={{ duration: duration.moderate }}
                    />
                  )}

                  {/* Main circle */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS}
                    fill="#18181b"
                    stroke={color}
                    strokeWidth={2.5}
                    animate={{ stroke: color }}
                    transition={{ duration: duration.moderate }}
                  />

                  {/* Inner glow */}
                  <motion.circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS - 4}
                    fill={color}
                    animate={{ fill: color, opacity: 0.15 }}
                    transition={{ duration: duration.moderate }}
                  />

                  {/* Labels */}
                  <text
                    x={pos.x}
                    y={pos.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e4e4e7"
                    fontSize={8}
                    fontWeight={600}
                  >
                    {node.label.length > 14
                      ? node.label.slice(0, 12) + '..'
                      : node.label}
                  </text>

                  {/* Type label */}
                  <text
                    x={pos.x}
                    y={pos.y + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#71717a"
                    fontSize={6}
                  >
                    {node.type}
                  </text>

                  {/* Feature badges */}
                  {node.hasCircuitBreaker && (
                    <g>
                      <circle
                        cx={pos.x + NODE_RADIUS - 2}
                        cy={pos.y - NODE_RADIUS + 2}
                        r={5}
                        fill="#3b82f6"
                      />
                      <text
                        x={pos.x + NODE_RADIUS - 2}
                        y={pos.y - NODE_RADIUS + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={5}
                        fontWeight={700}
                      >
                        CB
                      </text>
                    </g>
                  )}
                  {node.hasRetry && (
                    <g>
                      <circle
                        cx={pos.x - NODE_RADIUS + 2}
                        cy={pos.y - NODE_RADIUS + 2}
                        r={5}
                        fill="#8b5cf6"
                      />
                      <text
                        x={pos.x - NODE_RADIUS + 2}
                        y={pos.y - NODE_RADIUS + 3}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={5}
                        fontWeight={700}
                      >
                        R
                      </text>
                    </g>
                  )}
                  {node.hasFallback && (
                    <g>
                      <circle
                        cx={pos.x + NODE_RADIUS - 2}
                        cy={pos.y + NODE_RADIUS - 2}
                        r={5}
                        fill="#f59e0b"
                      />
                      <text
                        x={pos.x + NODE_RADIUS - 2}
                        y={pos.y + NODE_RADIUS - 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={5}
                        fontWeight={700}
                      >
                        FB
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="absolute bottom-2 left-2 flex items-center gap-3 text-[9px] text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Healthy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              Degraded
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Failed
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              Recovered
            </span>
            <span className="ml-2 flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-blue-600 text-white text-[6px] inline-flex items-center justify-center font-bold">
                CB
              </span>
              Circuit Breaker
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-purple-600 text-white text-[6px] inline-flex items-center justify-center font-bold">
                R
              </span>
              Retry
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-amber-500 text-white text-[6px] inline-flex items-center justify-center font-bold">
                FB
              </span>
              Fallback
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Timeline ── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-l border-zinc-800">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="text-sm font-semibold text-zinc-200">
            Cascade Timeline
          </h3>
          {cascadeSteps.length > 0 && (
            <p className="text-[10px] text-zinc-500 mt-0.5">
              {visibleStepIndex + 1} / {cascadeSteps.length} events
            </p>
          )}
        </div>

        <div
          ref={timelineRef}
          className="flex-1 overflow-y-auto"
        >
          {cascadeSteps.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-zinc-600 px-4 text-center">
              Select a failure mode from the left panel, then click a node to begin
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              <AnimatePresence>
                {cascadeSteps.map((step, i) => {
                  if (i > visibleStepIndex) return null;
                  return (
                    <motion.div
                      key={`${step.affectedNodeId}-${step.timeMs}-${i}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: duration.normal }}
                      className={cn(
                        'p-2 rounded border text-[10px]',
                        STATUS_BG[step.status],
                        STATUS_BORDER[step.status],
                      )}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-medium text-zinc-200">
                          {step.affectedNodeId}
                        </span>
                        <span className="text-zinc-500">{step.timeMs}ms</span>
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <StatusIcon status={step.status} />
                        <span
                          className={cn(
                            'font-medium capitalize',
                            step.status === 'healthy' && 'text-green-400',
                            step.status === 'degraded' && 'text-yellow-400',
                            step.status === 'failed' && 'text-red-400',
                            step.status === 'recovered' && 'text-blue-400',
                          )}
                        >
                          {step.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        {step.description}
                      </p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Recovery steps panel */}
        {selectedMode && playState === 'done' && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/50">
            <h4 className="text-[10px] font-semibold text-zinc-300 mb-1.5">
              Recovery Steps
            </h4>
            <ol className="space-y-1">
              {selectedMode.recoverySteps.map((step, i) => (
                <li
                  key={i}
                  className="flex items-start gap-1.5 text-[9px] text-zinc-400"
                >
                  <span className="text-emerald-500 font-mono mt-px">
                    {i + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
});

// ── Sub-components ────────────────────────────────────────────

interface FailureModeCardProps {
  mode: FailureMode;
  isSelected: boolean;
  onSelect: (mode: FailureMode) => void;
}

const FailureModeCard = memo(function FailureModeCard({
  mode,
  isSelected,
  onSelect,
}: FailureModeCardProps) {
  return (
    <button
      onClick={() => onSelect(mode)}
      className={cn(
        'w-full text-left px-2.5 py-2 rounded transition-colors',
        isSelected
          ? 'bg-zinc-800 border border-zinc-600'
          : 'hover:bg-zinc-900 border border-transparent',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-zinc-200">
          {mode.name}
        </span>
        <span
          className={cn(
            'text-[8px] px-1.5 py-0.5 rounded border',
            SEVERITY_BADGE[mode.severity],
          )}
        >
          {mode.severity}
        </span>
      </div>
      <p className="text-[9px] text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
        {mode.description}
      </p>
      {isSelected && (
        <div className="flex items-center gap-1 mt-1 text-[9px] text-emerald-400">
          <ChevronRight className="w-2.5 h-2.5" />
          Click a node to inject
        </div>
      )}
    </button>
  );
});

interface StatusIconProps {
  status: CascadeNodeStatus;
}

function StatusIcon({ status }: StatusIconProps) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="w-2.5 h-2.5 text-green-400" />;
    case 'degraded':
      return <AlertTriangle className="w-2.5 h-2.5 text-yellow-400" />;
    case 'failed':
      return <XCircle className="w-2.5 h-2.5 text-red-400" />;
    case 'recovered':
      return <CheckCircle className="w-2.5 h-2.5 text-blue-400" />;
  }
}
