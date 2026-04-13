'use client';

import { memo, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasStore } from '@/stores/canvas-store';
import { useViewportStore } from '@/stores/viewport-store';
import { useShallow } from 'zustand/react/shallow';
import type { TraceType } from '@/stores/simulation-store';
import type { SystemDesignNodeData } from '@/lib/types';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────

export type { TraceType };

interface TraceHop {
  nodeId: string;
  label: string;
  latencyMs: number;
  cumulativeMs: number;
  state: 'pending' | 'active' | 'done';
}

interface TraceState {
  active: boolean;
  traceType: TraceType;
  path: string[];
  hops: TraceHop[];
  currentHopIndex: number;
  /** 0-1 progress along current edge segment */
  edgeProgress: number;
  /** Screen coords of the animated dot */
  dotX: number;
  dotY: number;
  completed: boolean;
}

interface RequestTraceProps {
  traceType: TraceType;
  onComplete: () => void;
}

// ── Color config ───────────────────────────────────────────

const TRACE_COLORS: Record<TraceType, string> = {
  happy: '#22C55E',
  'cache-miss': '#F59E0B',
  error: '#EF4444',
};

// ── Bezier helpers (shared with ParticleLayer) ─────────────

function quadraticBezier(
  t: number,
  p0x: number, p0y: number,
  p1x: number, p1y: number,
  p2x: number, p2y: number,
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return [
    mt2 * p0x + 2 * mt * t * p1x + t2 * p2x,
    mt2 * p0y + 2 * mt * t * p1y + t2 * p2y,
  ];
}

function computeControlPoint(
  sx: number, sy: number,
  tx: number, ty: number,
): [number, number] {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const offset = Math.min(dist * 0.2, 80);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return [mx + nx * offset, my + ny * offset];
}

// ── Path finding ───────────────────────────────────────────

/**
 * BFS to find a path from an entry node to a terminal node.
 * For 'happy' traces, prefers paths through cache nodes.
 * For 'cache-miss' traces, avoids cache nodes when possible.
 * For 'error' traces, prefers nodes with high utilization.
 */
function findTracePath(
  nodes: Array<{ id: string; data: unknown }>,
  edges: Array<{ source: string; target: string }>,
  traceType: TraceType,
): string[] {
  // Build adjacency list
  const adj = new Map<string, string[]>();
  const hasInbound = new Set<string>();

  for (const node of nodes) {
    adj.set(node.id, []);
  }
  for (const edge of edges) {
    const list = adj.get(edge.source);
    if (list) list.push(edge.target);
    hasInbound.add(edge.target);
  }

  // Find entry nodes (client category or no inbound edges)
  const entryNodes: string[] = [];
  for (const node of nodes) {
    const data = node.data as Record<string, unknown> | undefined;
    const isClient = data?.category === 'client';
    if (isClient || !hasInbound.has(node.id)) {
      entryNodes.push(node.id);
    }
  }
  if (entryNodes.length === 0 && nodes.length > 0) {
    entryNodes.push(nodes[0].id);
  }

  // BFS from each entry node, find the longest path to a terminal node
  let bestPath: string[] = [];

  for (const startId of entryNodes) {
    const queue: string[][] = [[startId]];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const path = queue.shift()!;
      const current = path[path.length - 1];

      if (visited.has(current)) continue;
      visited.add(current);

      const downstream = adj.get(current) ?? [];

      if (downstream.length === 0) {
        // Terminal node - check if this path is better
        if (path.length > bestPath.length) {
          bestPath = path;
        }
        continue;
      }

      // For trace type routing: score each downstream
      const scoredDownstream = downstream.map((downId) => {
        const downNode = nodes.find((n) => n.id === downId);
        const downData = downNode?.data as Record<string, unknown> | undefined;
        const componentType = (downData?.componentType as string) ?? '';
        const metrics = downData?.metrics as Record<string, number> | undefined;

        let score = 0;
        if (traceType === 'happy' && componentType === 'cache') score += 10;
        if (traceType === 'cache-miss' && componentType === 'cache') score -= 10;
        if (traceType === 'error' && metrics?.utilization != null && metrics.utilization > 0.8) score += 10;
        return { id: downId, score };
      });

      // Sort by score descending
      scoredDownstream.sort((a, b) => b.score - a.score);

      for (const { id: downId } of scoredDownstream) {
        if (!visited.has(downId)) {
          queue.push([...path, downId]);
        }
      }
    }
  }

  return bestPath;
}

/**
 * Get the effective latency for a trace at a specific node.
 */
function getTraceLatency(data: SystemDesignNodeData | undefined, traceType: TraceType): number {
  const baseLatency = data?.metrics?.latency ?? getDefaultLatency(data);

  switch (traceType) {
    case 'happy':
      // Cache hits are fast
      if (data?.componentType === 'cache') return Math.max(1, baseLatency * 0.3);
      return baseLatency;
    case 'cache-miss':
      // Cache misses add extra latency
      if (data?.componentType === 'cache') return baseLatency * 2;
      return baseLatency;
    case 'error':
      // Errors happen faster (fail fast) or timeout (very slow)
      if (data?.metrics?.utilization != null && data.metrics.utilization > 0.8) {
        return baseLatency * 5; // timeout-like behavior
      }
      return baseLatency;
    default:
      return baseLatency;
  }
}

function getDefaultLatency(data: SystemDesignNodeData | undefined): number {
  if (!data) return 50;
  switch (data.componentType) {
    case 'load-balancer':
    case 'reverse-proxy':
    case 'api-gateway':
      return 5;
    case 'cache':
      return 2;
    case 'web-server':
    case 'app-server':
      return 20;
    case 'database':
    case 'document-db':
      return 50;
    case 'message-queue':
    case 'pub-sub':
      return 10;
    case 'object-storage':
      return 100;
    default:
      return 30;
  }
}

// ── Waterfall panel ────────────────────────────────────────

interface WaterfallPanelProps {
  hops: TraceHop[];
  traceType: TraceType;
  totalMs: number;
}

function WaterfallPanel({ hops, traceType, totalMs }: WaterfallPanelProps) {
  const color = TRACE_COLORS[traceType];
  const maxMs = Math.max(totalMs, 1);

  return (
    <div className="pointer-events-auto absolute bottom-24 right-4 z-50 w-72">
      <div className="rounded-xl border border-border bg-surface/95 shadow-2xl backdrop-blur-lg">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-semibold text-foreground">
            Request Trace
          </span>
          <span className="ml-auto text-[10px] font-medium text-muted-foreground">
            {traceType === 'happy' ? 'Happy Path' : traceType === 'cache-miss' ? 'Cache Miss' : 'Error Path'}
          </span>
        </div>

        {/* Waterfall bars */}
        <div className="max-h-60 overflow-y-auto px-3 py-2">
          {hops.map((hop, i) => {
            const barWidthPct = Math.max(2, (hop.latencyMs / maxMs) * 100);
            const offsetPct = ((hop.cumulativeMs - hop.latencyMs) / maxMs) * 100;
            const isDone = hop.state === 'done';
            const isActive = hop.state === 'active';

            return (
              <div key={hop.nodeId + '-' + i} className="mb-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span
                    className={cn(
                      'truncate font-medium',
                      isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground/50',
                    )}
                  >
                    {hop.label}
                  </span>
                  <span
                    className={cn(
                      'ml-2 tabular-nums',
                      isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
                    )}
                  >
                    {Math.round(hop.latencyMs)}ms
                  </span>
                </div>
                <div className="relative mt-0.5 h-2 w-full overflow-hidden rounded-full bg-muted/30">
                  <div
                    className={cn(
                      'absolute top-0 h-full rounded-full transition-all duration-300',
                      hop.state === 'pending' && 'opacity-20',
                      isActive && 'animate-pulse',
                    )}
                    style={{
                      left: `${offsetPct}%`,
                      width: `${barWidthPct}%`,
                      backgroundColor: color,
                      opacity: isDone ? 0.7 : isActive ? 1 : 0.2,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer with total */}
        <div className="flex items-center justify-between border-t border-border px-3 py-1.5">
          <span className="text-[10px] text-muted-foreground">Total</span>
          <span className="text-xs font-bold tabular-nums text-foreground">
            {Math.round(totalMs)}ms
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main trace component ───────────────────────────────────

export const RequestTrace = memo(function RequestTrace({ traceType, onComplete }: RequestTraceProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const viewport = useViewportStore(useShallow((s) => ({ x: s.x, y: s.y, zoom: s.zoom })));
  const { getViewport } = useReactFlow();

  const [traceState, setTraceState] = useState<TraceState | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hopStartTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Build the trace path and hops
  const traceData = useMemo(() => {
    const path = findTracePath(nodes, edges, traceType);
    if (path.length === 0) return null;

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    let cumulative = 0;

    const hops: TraceHop[] = path.map((nodeId) => {
      const node = nodeMap.get(nodeId);
      const data = node?.data as SystemDesignNodeData | undefined;
      const latency = getTraceLatency(data, traceType);
      cumulative += latency;
      return {
        nodeId,
        label: (data?.label ?? nodeId),
        latencyMs: latency,
        cumulativeMs: cumulative,
        state: 'pending' as const,
      };
    });

    const totalMs = cumulative;
    return { path, hops, totalMs };
  }, [nodes, edges, traceType]);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const { width, height } = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }, []);

  // Get node center in screen coordinates
  const getNodeScreenCenter = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;
      const vp = getViewport();
      const w = node.measured?.width ?? (node.width as number | undefined) ?? 180;
      const h = node.measured?.height ?? (node.height as number | undefined) ?? 60;
      const cx = (node.position.x + w / 2) * vp.zoom + vp.x;
      const cy = (node.position.y + h / 2) * vp.zoom + vp.y;
      return { x: cx, y: cy };
    },
    [nodes, getViewport],
  );

  // Get node center in flow coordinates
  const getNodeFlowCenter = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return null;
      const w = node.measured?.width ?? (node.width as number | undefined) ?? 180;
      const h = node.measured?.height ?? (node.height as number | undefined) ?? 60;
      return { x: node.position.x + w / 2, y: node.position.y + h / 2 };
    },
    [nodes],
  );

  // Animation loop
  const animate = useCallback(
    (timestamp: number) => {
      if (!traceData) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply viewport transform
      const vp = getViewport();
      ctx.setTransform(dpr * vp.zoom, 0, 0, dpr * vp.zoom, dpr * vp.x, dpr * vp.y);

      setTraceState((prev) => {
        if (!prev || prev.completed) return prev;

        const { path, hops } = prev;
        const currentIdx = prev.currentHopIndex;

        if (currentIdx >= path.length) {
          // Trace complete
          const finalHops = hops.map((h) => ({ ...h, state: 'done' as const }));
          onComplete();
          return { ...prev, hops: finalHops, completed: true };
        }

        const currentHop = hops[currentIdx];
        // Time this hop should take in animation (scaled: 1ms latency = 5ms real)
        const hopDurationMs = Math.max(100, currentHop.latencyMs * 5);
        const elapsed = timestamp - hopStartTimeRef.current;
        const hopProgress = Math.min(1, elapsed / hopDurationMs);

        // If we're moving between nodes (not the first node), animate along edge
        let dotFlowX = 0;
        let dotFlowY = 0;

        if (currentIdx === 0) {
          // At the first node, just sit on it
          const center = getNodeFlowCenter(path[0]);
          if (center) {
            dotFlowX = center.x;
            dotFlowY = center.y;
          }
        } else {
          // Animate from previous node to current node
          const prevCenter = getNodeFlowCenter(path[currentIdx - 1]);
          const currCenter = getNodeFlowCenter(path[currentIdx]);
          if (prevCenter && currCenter) {
            // Use bezier curve
            const [cpx, cpy] = computeControlPoint(
              prevCenter.x, prevCenter.y,
              currCenter.x, currCenter.y,
            );

            // First half of hop: travel along edge. Second half: pause at node.
            const travelFraction = 0.6;
            if (hopProgress <= travelFraction) {
              const t = hopProgress / travelFraction;
              [dotFlowX, dotFlowY] = quadraticBezier(
                t,
                prevCenter.x, prevCenter.y,
                cpx, cpy,
                currCenter.x, currCenter.y,
              );
            } else {
              dotFlowX = currCenter.x;
              dotFlowY = currCenter.y;
            }
          }
        }

        // Draw the dot
        const color = TRACE_COLORS[prev.traceType];
        const dotSize = 8;

        // Glow
        ctx.beginPath();
        ctx.arc(dotFlowX, dotFlowY, dotSize * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(dotFlowX, dotFlowY, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 1;
        ctx.fill();

        // Inner bright center
        ctx.beginPath();
        ctx.arc(dotFlowX, dotFlowY, dotSize / 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.8;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Draw trail: fading line along already-visited path
        if (currentIdx > 0) {
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          for (let i = 0; i < currentIdx; i++) {
            const from = getNodeFlowCenter(path[i]);
            const to = getNodeFlowCenter(path[i + 1]);
            if (from && to) {
              const [cpx, cpy] = computeControlPoint(from.x, from.y, to.x, to.y);
              if (i === 0) ctx.moveTo(from.x, from.y);
              ctx.quadraticCurveTo(cpx, cpy, to.x, to.y);
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Advance to next hop if time elapsed
        if (hopProgress >= 1) {
          const updatedHops = hops.map((h, i) => {
            if (i < currentIdx + 1) return { ...h, state: 'done' as const };
            if (i === currentIdx + 1) return { ...h, state: 'active' as const };
            return h;
          });
          hopStartTimeRef.current = timestamp;
          return {
            ...prev,
            currentHopIndex: currentIdx + 1,
            edgeProgress: 0,
            hops: updatedHops,
            dotX: dotFlowX,
            dotY: dotFlowY,
          };
        }

        // Update hop state to active
        const updatedHops = hops.map((h, i) => {
          if (i < currentIdx) return { ...h, state: 'done' as const };
          if (i === currentIdx) return { ...h, state: 'active' as const };
          return h;
        });

        return {
          ...prev,
          edgeProgress: hopProgress,
          hops: updatedHops,
          dotX: dotFlowX,
          dotY: dotFlowY,
        };
      });

      rafRef.current = requestAnimationFrame(animate);
    },
    [traceData, getViewport, getNodeFlowCenter, onComplete],
  );

  // Start the trace animation
  useEffect(() => {
    if (!traceData || traceData.path.length === 0) {
      onComplete();
      return;
    }

    resizeCanvas();

    const initialHops = traceData.hops.map((h, i) => ({
      ...h,
      state: (i === 0 ? 'active' : 'pending') as TraceHop['state'],
    }));

    const firstCenter = getNodeScreenCenter(traceData.path[0]);

    setTraceState({
      active: true,
      traceType,
      path: traceData.path,
      hops: initialHops,
      currentHopIndex: 0,
      edgeProgress: 0,
      dotX: firstCenter?.x ?? 0,
      dotY: firstCenter?.y ?? 0,
      completed: false,
    });

    startTimeRef.current = performance.now();
    hopStartTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [traceData, traceType, resizeCanvas, getNodeScreenCenter, animate, onComplete]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;
    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, [resizeCanvas]);

  if (!traceData || traceData.path.length === 0) return null;

  return (
    <>
      {/* Canvas for animated dot */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-30"
        aria-hidden="true"
        data-testid="request-trace-layer"
      />

      {/* Waterfall panel */}
      {traceState && (
        <WaterfallPanel
          hops={traceState.hops}
          traceType={traceType}
          totalMs={traceData.totalMs}
        />
      )}
    </>
  );
});

RequestTrace.displayName = 'RequestTrace';
