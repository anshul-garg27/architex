'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { springs } from '@/lib/constants/motion';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

export interface SortCelebrationProps {
  /** Whether the celebration is active */
  show: boolean;
  /** Total steps taken */
  totalSteps: number;
  /** Total comparisons */
  comparisons: number;
  /** Total swaps */
  swaps: number;
  /** Algorithm name for the banner */
  algorithmName?: string;
  /** Callback when celebration is dismissed */
  onDismiss: () => void;
}

// ── Confetti Particle ────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  shape: 'rect' | 'circle';
  opacity: number;
  life: number; // 1 -> 0 over time
}

// ── Constants ────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#8B5CF6', // violet
  '#3B82F6', // blue
  '#22C55E', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
];

const PARTICLE_COUNT_MIN = 80;
const PARTICLE_COUNT_MAX = 120;
const GRAVITY = 0.6;
const WIND = 0.15;
const CONFETTI_DURATION_MS = 2500;
const AUTO_DISMISS_MS = 4000;

// ── Helpers ──────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function createParticle(canvasWidth: number): Particle {
  const angle = randomBetween(-Math.PI, 0); // upward burst
  const speed = randomBetween(6, 14);

  return {
    x: canvasWidth / 2 + randomBetween(-40, 40),
    y: 0,
    vx: Math.cos(angle) * speed + randomBetween(-2, 2),
    vy: Math.sin(angle) * speed - randomBetween(2, 6),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.15, 0.15),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: randomBetween(4, 8),
    shape: Math.random() > 0.5 ? 'rect' : 'circle',
    opacity: 1,
    life: 1,
  };
}

// ── Canvas2D Confetti Hook ───────────────────────────────────

function useConfettiCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean,
) {
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas resolution to display size
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Spawn particles
    const count = Math.floor(randomBetween(PARTICLE_COUNT_MIN, PARTICLE_COUNT_MAX));
    particlesRef.current = Array.from({ length: count }, () =>
      createParticle(rect.width),
    );
    startTimeRef.current = performance.now();

    function tick(now: number) {
      if (!ctx || !canvas) return;

      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / CONFETTI_DURATION_MS, 1);

      ctx.clearRect(0, 0, rect.width, rect.height);

      const particles = particlesRef.current;
      let anyAlive = false;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Physics update
        p.vy += GRAVITY * 0.16; // per-frame gravity (approx 60fps)
        p.vx += WIND * (Math.random() - 0.5) * 0.16;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        // Fade based on time progress
        p.life = Math.max(0, 1 - progress);
        p.opacity = p.life;

        if (p.opacity <= 0) continue;
        anyAlive = true;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (anyAlive && progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        // Final clear
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      particlesRef.current = [];
      if (ctx) {
        ctx.clearRect(0, 0, rect.width, rect.height);
      }
    };
  }, [active, canvasRef]);
}

// ── Component ────────────────────────────────────────────────

export function SortCelebration({
  show,
  totalSteps,
  comparisons,
  swaps,
  algorithmName,
  onDismiss,
}: SortCelebrationProps) {
  const shouldReduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Confetti canvas animation — only when motion is allowed
  useConfettiCanvas(canvasRef, show && !shouldReduceMotion);

  // Auto-dismiss after 4 seconds
  useEffect(() => {
    if (!show) return;

    dismissTimerRef.current = setTimeout(onDismiss, AUTO_DISMISS_MS);

    return () => {
      clearTimeout(dismissTimerRef.current);
    };
  }, [show, onDismiss]);

  // Keyboard dismiss (Escape)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    },
    [onDismiss],
  );

  const title = algorithmName ? `${algorithmName} — Complete!` : 'Complete!';

  return (
    <AnimatePresence>
      {show && (
        <div
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Canvas2D Confetti Layer */}
          {!shouldReduceMotion && (
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            />
          )}

          {/* Rainbow Gradient Sweep */}
          {!shouldReduceMotion && (
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: 3 }}
              aria-hidden="true"
            >
              <div
                className="h-full w-full"
                style={{
                  background:
                    'linear-gradient(90deg, #EF4444, #F59E0B, #22C55E, #3B82F6, #8B5CF6)',
                  backgroundSize: '200% 100%',
                  animation: 'sort-celebration-rainbow 1.5s ease-out forwards',
                }}
              />
            </div>
          )}

          {/* Stats Banner */}
          <motion.div
            className="pointer-events-auto absolute inset-x-0 bottom-4 mx-auto w-fit"
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 40 }
            }
            animate={{ opacity: 1, y: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 20 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : springs.bouncy
            }
          >
            <div
              className={cn(
                'relative rounded-xl border border-border/30 px-5 py-3 shadow-lg',
                'bg-background/80 backdrop-blur-xl',
              )}
            >
              {/* Close button */}
              <button
                onClick={onDismiss}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border/30 bg-background/80 backdrop-blur-md text-foreground-muted transition-colors hover:text-foreground hover:bg-elevated"
                aria-label="Dismiss celebration"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Title */}
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/20">
                  <Check className="h-3 w-3 text-green-400" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {title}
                </span>
              </div>

              {/* Stats row */}
              <p className="mt-1 text-xs text-foreground-muted">
                {totalSteps.toLocaleString()} steps{' '}
                <span className="text-foreground-subtle">&middot;</span>{' '}
                {comparisons.toLocaleString()} comparisons{' '}
                <span className="text-foreground-subtle">&middot;</span>{' '}
                {swaps.toLocaleString()} swaps
              </p>
            </div>
          </motion.div>

          {/* Inline keyframes for rainbow sweep animation */}
          <style>{`
            @keyframes sort-celebration-rainbow {
              from {
                background-position: -100% 0;
              }
              to {
                background-position: 100% 0;
              }
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>
  );
}
