'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { springs, duration } from '@/lib/constants/motion';
import { soundEngine } from '@/lib/audio/sound-engine';

// ═══════════════════════════════════════════════════════════════════
// Danger Detection Utilities
// ═══════════════════════════════════════════════════════════════════

/**
 * Detects when an O(n log n) algorithm has degenerated into O(n^2) behavior.
 * Returns true when comparisons exceed 1.5x the expected n*log2(n) count.
 */
export function isDangerZone(
  comparisons: number,
  arraySize: number,
  algorithmId: string,
): boolean {
  const n = arraySize;
  if (n < 5) return false; // too small to be meaningful

  // Expected O(n log n) algorithms that can degenerate to O(n^2)
  const canDegenerate = ['quick-sort', 'quick-sort-hoare', 'tim-sort'];
  if (!canDegenerate.includes(algorithmId)) return false;

  // Danger threshold: comparisons > 1.5x the n*log2(n) expected
  const expected = n * Math.log2(n);
  return comparisons > expected * 1.5;
}

/**
 * Detects when an O(n^2) algorithm is visibly slow (for educational emphasis).
 * Returns true when comparisons exceed 25% of worst-case n^2.
 */
export function isSlowZone(
  comparisons: number,
  arraySize: number,
): boolean {
  const n = arraySize;
  return comparisons > (n * n) / 4; // past 25% of worst case n^2
}

// ═══════════════════════════════════════════════════════════════════
// CSS class for external counter styling
// ═══════════════════════════════════════════════════════════════════

/**
 * Apply this class to the comparison counter element when danger is active.
 * The keyframes are injected by the DangerOverlay component via a style element.
 */
export const DANGER_COUNTER_CLASS = 'danger-counter';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface DangerOverlayProps {
  /** Whether danger state is active */
  active: boolean;
  /** Current comparison count */
  comparisons: number;
  /** Array size */
  arraySize: number;
  /** Algorithm ID (to determine expected complexity) */
  algorithmId: string;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const BADGE_DISMISS_MS = 5000;
const SHAKE_DURATION_MS = 1200; // 0.4s * 3 iterations

const DANGER_STYLE_ID = 'danger-overlay-styles';

/**
 * Static CSS keyframes and utility classes.
 * Content is a compile-time constant -- no user input flows into this string.
 */
const DANGER_CSS = `
@keyframes danger-shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-1px, 0); }
  30% { transform: translate(1px, -1px); }
  50% { transform: translate(-1px, 1px); }
  70% { transform: translate(1px, 0); }
  90% { transform: translate(-1px, -1px); }
}

@keyframes danger-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.danger-shake-active {
  animation: danger-shake 0.4s ease-in-out 3;
}

.danger-counter {
  color: #ef4444;
  animation: danger-pulse 0.5s ease-in-out 3;
}

@media (prefers-reduced-motion: reduce) {
  .danger-shake-active {
    animation: none;
  }
  .danger-counter {
    animation: none;
    color: #ef4444;
  }
}
`;

// ═══════════════════════════════════════════════════════════════════
// Style injection hook -- appends a <style> element to <head> once
// ═══════════════════════════════════════════════════════════════════

function useDangerStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(DANGER_STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = DANGER_STYLE_ID;
    style.textContent = DANGER_CSS;
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, []);
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export const DangerOverlay = memo(function DangerOverlay({
  active,
  comparisons,
  arraySize,
  algorithmId,
  className,
}: DangerOverlayProps) {
  const shouldReduceMotion = useReducedMotion();
  const [showBadge, setShowBadge] = useState(false);
  const [shakeActive, setShakeActive] = useState(false);
  const prevActiveRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inject keyframe styles into the document head
  useDangerStyles();

  // Determine the badge message based on algorithm type
  const canDegenerate = ['quick-sort', 'quick-sort-hoare', 'tim-sort'];
  const isDegenerateAlgo = canDegenerate.includes(algorithmId);
  const badgeMessage = isDegenerateAlgo
    ? 'Worst-case detected!'
    : 'O(n\u00B2) behavior!';

  // Handle activation: trigger sound, show badge, start shake
  const onActivate = useCallback(() => {
    soundEngine.play('error');
    setShowBadge(true);
    if (!shouldReduceMotion) {
      setShakeActive(true);
    }
  }, [shouldReduceMotion]);

  // Watch for rising edge of `active`
  useEffect(() => {
    if (active && !prevActiveRef.current) {
      onActivate();
    }
    if (!active && prevActiveRef.current) {
      // Deactivated: immediately hide badge and stop shake
      setShowBadge(false);
      setShakeActive(false);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    }
    prevActiveRef.current = active;
  }, [active, onActivate]);

  // Auto-dismiss badge after 5 seconds
  useEffect(() => {
    if (showBadge) {
      dismissTimerRef.current = setTimeout(() => {
        setShowBadge(false);
        dismissTimerRef.current = null;
      }, BADGE_DISMISS_MS);
      return () => {
        if (dismissTimerRef.current) {
          clearTimeout(dismissTimerRef.current);
          dismissTimerRef.current = null;
        }
      };
    }
  }, [showBadge]);

  // Stop shake after the CSS animation completes (0.4s * 3 iterations = 1.2s)
  useEffect(() => {
    if (shakeActive) {
      const timer = setTimeout(() => {
        setShakeActive(false);
      }, SHAKE_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [shakeActive]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 z-30',
        shakeActive && !shouldReduceMotion && 'danger-shake-active',
        className,
      )}
      aria-hidden="true"
    >
      {/* Red vignette overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.15) 100%)',
            }}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: duration.moderate }
            }
          />
        )}
      </AnimatePresence>

      {/* Warning badge -- top-right, glassmorphism with red tint */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            className={cn(
              'pointer-events-auto absolute right-3 top-3 z-40',
              'flex items-center gap-2 rounded-lg border px-3 py-2',
              'border-red-500/30 bg-red-500/10 backdrop-blur-md shadow-lg',
            )}
            initial={
              shouldReduceMotion
                ? { opacity: 1, x: 0 }
                : { opacity: 0, x: 40 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 40 }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : springs.bouncy
            }
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm font-medium text-red-300 whitespace-nowrap">
              {badgeMessage}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
