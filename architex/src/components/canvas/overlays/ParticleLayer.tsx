'use client';

import { memo, useRef, useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useSimulationStore } from '@/stores/simulation-store';
import { useCanvasStore } from '@/stores/canvas-store';
import type { EdgeType, SystemDesignEdgeData } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────

interface Particle {
  edgeId: string;
  progress: number;    // 0 to 1 along the edge path
  speed: number;       // progress increment per frame
  color: string;
  size: number;
  isError: boolean;
}

// ── Constants ──────────────────────────────────────────────

const MAX_PARTICLES = 2000;
const MAX_PARTICLES_PER_EDGE = 8;
const RPS_PER_PARTICLE = 100;
const BASE_PARTICLE_SIZE = 4;
const ERROR_PARTICLE_SIZE = 6;
const FADE_ZONE = 0.1; // first/last 10% of path

/** Color map for edge protocol types */
const EDGE_TYPE_COLORS: Record<string, string> = {
  http: '#3B82F6',
  grpc: '#A855F7',
  graphql: '#EC4899',
  websocket: '#22C55E',
  'message-queue': '#F97316',
  'event-stream': '#F59E0B',
  'db-query': '#22C55E',
  'cache-lookup': '#06B6D4',
  replication: '#6B7280',
};

const ERROR_COLOR = '#EF4444';

// ── Bezier helpers ─────────────────────────────────────────

/**
 * Evaluate a quadratic bezier at parameter t:
 *   point(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
 */
function quadraticBezier(
  t: number,
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): [number, number] {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return [
    mt2 * p0x + 2 * mt * t * p1x + t2 * p2x,
    mt2 * p0y + 2 * mt * t * p1y + t2 * p2y,
  ];
}

/**
 * Compute a control point for a gentle curve between source and target.
 * Offsets perpendicular to the midpoint based on distance.
 */
function computeControlPoint(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
): [number, number] {
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Offset perpendicular to the line, proportional to distance
  const offset = Math.min(dist * 0.2, 80);
  // Perpendicular direction (rotate 90 degrees)
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return [mx + nx * offset, my + ny * offset];
}

// ── Particle pool ──────────────────────────────────────────

function createParticle(
  edgeId: string,
  speed: number,
  color: string,
  size: number,
  isError: boolean,
): Particle {
  return {
    edgeId,
    progress: 0,
    speed,
    color,
    size,
    isError,
  };
}

// ── Component ──────────────────────────────────────────────

export const ParticleLayer = memo(function ParticleLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const spawnAccumulatorRef = useRef<Map<string, number>>(new Map());
  const particleCountByEdgeRef = useRef<Map<string, number>>(new Map());

  // Cached refs for node positions and edge map — rebuilt only when store changes
  const nodePositionsRef = useRef<Map<string, { x: number; y: number; width: number; height: number }>>(new Map());
  const edgeMapRef = useRef<Map<string, ReturnType<typeof useCanvasStore.getState>['edges'][number]>>(new Map());

  const { getViewport } = useReactFlow();

  // Pull simulation status (subscribe granularly to avoid excess re-renders)
  const status = useSimulationStore((s) => s.status);
  const metrics = useSimulationStore((s) => s.metrics);

  // Subscribe to store changes to rebuild cached lookups (AUD-054)
  useEffect(() => {
    function rebuild() {
      const { nodes, edges } = useCanvasStore.getState();
      const np = new Map<string, { x: number; y: number; width: number; height: number }>();
      for (const node of nodes) {
        if (node.position) {
          const w = (node.measured?.width ?? node.width ?? 180);
          const h = (node.measured?.height ?? node.height ?? 60);
          np.set(node.id, { x: node.position.x, y: node.position.y, width: w, height: h });
        }
      }
      nodePositionsRef.current = np;

      const em = new Map<string, typeof edges[number]>();
      for (const edge of edges) {
        em.set(edge.id, edge);
      }
      edgeMapRef.current = em;
    }
    rebuild();
    const unsub = useCanvasStore.subscribe(rebuild);
    return () => unsub();
  }, []);

  // Resize canvas to match parent container
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

  // ── Spawn particles based on current edge states ──
  const spawnParticles = useCallback(
    (dt: number) => {
      const edges = useCanvasStore.getState().edges;
      const currentParticles = particlesRef.current;
      const accumulator = spawnAccumulatorRef.current;
      const globalThroughput = metrics.throughputRps;

      // Use cached node positions
      const nodePositions = nodePositionsRef.current;

      // Build per-edge particle count via Map counter (AUD-053)
      const countByEdge = particleCountByEdgeRef.current;
      countByEdge.clear();
      for (const p of currentParticles) {
        countByEdge.set(p.edgeId, (countByEdge.get(p.edgeId) ?? 0) + 1);
      }

      for (const edge of edges) {
        const sourcePos = nodePositions.get(edge.source);
        const targetPos = nodePositions.get(edge.target);
        if (!sourcePos || !targetPos) continue;

        const edgeData = edge.data as SystemDesignEdgeData | undefined;
        const edgeType: EdgeType = edgeData?.edgeType ?? 'http';

        // Determine throughput for this edge: use edge-level bandwidth if
        // available, otherwise distribute global throughput across edges
        const edgeThroughput =
          edgeData?.bandwidth ?? globalThroughput / Math.max(edges.length, 1);

        // How many particles this edge should have active
        const targetCount = Math.min(
          Math.max(1, Math.ceil(edgeThroughput / RPS_PER_PARTICLE)),
          MAX_PARTICLES_PER_EDGE,
        );

        // Count existing particles for this edge (O(1) lookup)
        const existing = countByEdge.get(edge.id) ?? 0;

        if (existing >= targetCount || currentParticles.length >= MAX_PARTICLES)
          continue;

        // Accumulate spawn time so we get smooth spawning
        const acc = (accumulator.get(edge.id) ?? 0) + dt;
        // Spawn interval: spread particles evenly over the edge travel time
        const spawnInterval = 1 / Math.max(targetCount, 1);

        if (acc >= spawnInterval) {
          accumulator.set(edge.id, 0);

          // Determine if this particle is an error particle
          const errorRate = edgeData?.errorRate ?? 0;
          const isError = Math.random() < errorRate;

          // Speed encodes latency: higher latency = slower particles
          const latency = edgeData?.latency ?? 50;
          // Base speed: traverse the edge in ~1-3 seconds
          // Lower latency = faster (closer to 3s), higher latency = slower (closer to 1s)
          const speed = Math.max(
            0.003,
            Math.min(0.02, 0.015 / Math.max(latency / 50, 0.5)),
          );

          const color = isError ? ERROR_COLOR : (EDGE_TYPE_COLORS[edgeType] ?? '#3B82F6');
          const size = isError ? ERROR_PARTICLE_SIZE : BASE_PARTICLE_SIZE;

          currentParticles.push(
            createParticle(edge.id, speed, color, size, isError),
          );
        } else {
          accumulator.set(edge.id, acc);
        }
      }
    },
    [metrics.throughputRps],
  );

  // ── Main animation loop ──
  const animate = useCallback(
    (timestamp: number) => {
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

      // Delta time in seconds, capped to avoid jumps after tab switch
      const dt = Math.min((timestamp - (lastTimeRef.current || timestamp)) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      // Clear the canvas
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply viewport transform so particles align with React Flow nodes
      const viewport = getViewport();
      ctx.setTransform(dpr * viewport.zoom, 0, 0, dpr * viewport.zoom, dpr * viewport.x, dpr * viewport.y);

      // Spawn new particles
      spawnParticles(dt);

      // Use cached lookups rebuilt on store change (AUD-054)
      const nodePositions = nodePositionsRef.current;
      const edgeMap = edgeMapRef.current;

      const particles = particlesRef.current;
      const pulseTime = (timestamp % 1000) / 1000; // 0-1 pulse cycle

      // Update and render each particle
      let writeIdx = 0;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Advance progress
        p.progress += p.speed;

        // Remove completed particles
        if (p.progress >= 1) continue;

        const edge = edgeMap.get(p.edgeId);
        if (!edge) continue;

        const sourceInfo = nodePositions.get(edge.source);
        const targetInfo = nodePositions.get(edge.target);
        if (!sourceInfo || !targetInfo) continue;

        // Source/target center points (nodes position is top-left in React Flow)
        const sx = sourceInfo.x + sourceInfo.width / 2;
        const sy = sourceInfo.y + sourceInfo.height / 2;
        const tx = targetInfo.x + targetInfo.width / 2;
        const ty = targetInfo.y + targetInfo.height / 2;

        // Compute control point for the bezier curve
        const [cx, cy] = computeControlPoint(sx, sy, tx, ty);

        // Interpolate position along the bezier
        const [px, py] = quadraticBezier(p.progress, sx, sy, cx, cy, tx, ty);

        // Compute alpha with fade in/out at endpoints
        let alpha = 1;
        if (p.progress < FADE_ZONE) {
          alpha = p.progress / FADE_ZONE;
        } else if (p.progress > 1 - FADE_ZONE) {
          alpha = (1 - p.progress) / FADE_ZONE;
        }

        // Error particles get a pulse effect
        let size = p.size;
        if (p.isError) {
          const pulse = 0.8 + 0.4 * Math.sin(pulseTime * Math.PI * 2);
          size *= pulse;
        }

        // Draw the particle
        ctx.beginPath();
        ctx.arc(px, py, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        // Add a soft glow for error particles
        if (p.isError) {
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.2;
          ctx.fill();
        }

        ctx.globalAlpha = 1;

        // Keep particle (compact array in-place)
        particles[writeIdx++] = p;
      }
      particles.length = writeIdx;

      rafRef.current = requestAnimationFrame(animate);
    },
    [getViewport, spawnParticles],
  );

  // ── Lifecycle: start/stop animation loop ──
  useEffect(() => {
    if (status !== 'running') {
      // Clear particles when not running
      if (particlesRef.current.length > 0) {
        particlesRef.current = [];
      }
      // Clear accumulated spawn timers
      spawnAccumulatorRef.current.clear();
      lastTimeRef.current = 0;
      // Clear the canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    // AUD-072: Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    resizeCanvas();
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [status, animate, resizeCanvas]);

  // ── Resize observer ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    observer.observe(canvas.parentElement);

    return () => observer.disconnect();
  }, [resizeCanvas]);

  // ── Visibility API: skip rendering when tab hidden ──
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      } else if (status === 'running') {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(animate);
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
      data-testid="particle-layer"
    />
  );
});

ParticleLayer.displayName = 'ParticleLayer';
