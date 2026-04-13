'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { springs } from '@/lib/constants/motion';
import type { ElementState } from '@/lib/algorithms';

// ── Types ────────────────────────────────────────────────────

export interface SpotlightProps {
  /** Total number of elements in the array */
  totalElements: number;
  /** Indices of currently active elements (comparing/swapping) */
  activeIndices: number[];
  /** Container width in pixels (to calculate spotlight position) */
  containerWidth: number;
  /** Container height in pixels */
  containerHeight: number;
  /** Whether the algorithm is currently running */
  isPlaying: boolean;
}

// ── Constants ────────────────────────────────────────────────

/** Minimum spotlight width in pixels */
const MIN_SPOTLIGHT_WIDTH = 120;

/** Spotlight width as a fraction of container width */
const SPOTLIGHT_WIDTH_FRACTION = 0.3;

/** Extra padding on each side of the active range (in bar-widths) */
const SPOTLIGHT_PADDING_BARS = 2;

// ── Helper: bar opacity for stage dimming ───────────────────

/**
 * Returns the appropriate opacity for a bar based on the current
 * spotlight state. When the algorithm is running and there are
 * active indices, non-active bars are dimmed to draw focus.
 *
 * This is exported separately so ArrayVisualizer can call it
 * per-bar without Spotlight needing to own bar rendering.
 */
export function getBarOpacity(
  index: number,
  state: ElementState,
  activeIndices: number[],
  isPlaying: boolean,
): number {
  if (!isPlaying || activeIndices.length === 0) return 1;
  if (activeIndices.includes(index)) return 1;
  if (state === 'sorted') return 0.9;
  return 0.7;
}

// ── Component ────────────────────────────────────────────────

/**
 * Spotlight overlay that creates a "stage lighting" effect during
 * algorithm execution. A radial gradient glow follows the active
 * elements (comparing/swapping bars), smoothly transitioning
 * between positions using spring physics.
 *
 * This is an absolutely-positioned, pointer-events-none layer
 * intended to sit above the bars but below tooltips.
 */
export const Spotlight = memo(function Spotlight({
  totalElements,
  activeIndices,
  containerWidth,
  containerHeight,
  isPlaying,
}: SpotlightProps) {
  const shouldReduceMotion = useReducedMotion();

  // Calculate the horizontal center of the active elements (in px)
  const spotlightX = useMemo(() => {
    if (activeIndices.length === 0 || totalElements === 0) return 0;
    const barWidth = containerWidth / totalElements;
    const minIdx = Math.min(...activeIndices);
    const maxIdx = Math.max(...activeIndices);
    const centerIdx = (minIdx + maxIdx) / 2;
    return centerIdx * barWidth + barWidth / 2;
  }, [activeIndices, containerWidth, totalElements]);

  // Calculate the spotlight width — spans from first to last active
  // index plus padding, clamped to a minimum and a fraction of the
  // container width.
  const spotlightWidth = useMemo(() => {
    if (activeIndices.length === 0 || totalElements === 0) return MIN_SPOTLIGHT_WIDTH;
    const barWidth = containerWidth / totalElements;
    const minIdx = Math.min(...activeIndices);
    const maxIdx = Math.max(...activeIndices);
    const rangeWidth = (maxIdx - minIdx + 1 + SPOTLIGHT_PADDING_BARS * 2) * barWidth;
    return Math.max(
      rangeWidth,
      MIN_SPOTLIGHT_WIDTH,
      containerWidth * SPOTLIGHT_WIDTH_FRACTION,
    );
  }, [activeIndices, containerWidth, totalElements]);

  // Don't render the gradient when there's nothing to spotlight
  // or when reduced motion is preferred (opacity dimming still
  // applies via getBarOpacity, which is called externally).
  const showGlow = isPlaying && activeIndices.length > 0 && !shouldReduceMotion;

  if (!showGlow) return null;

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: spotlightWidth,
        height: containerHeight,
        pointerEvents: 'none',
        zIndex: 1,
        background:
          'radial-gradient(ellipse at center, rgba(110,86,207,0.12) 0%, rgba(110,86,207,0.06) 40%, transparent 70%)',
        willChange: 'transform',
      }}
      initial={false}
      animate={{
        x: spotlightX - spotlightWidth / 2,
      }}
      transition={springs.smooth}
      onAnimationComplete={() => {
        // Per motion design system: remove will-change after animation
        // settles. The motion library handles this internally for most
        // cases, but this is a safety net.
      }}
    />
  );
});
