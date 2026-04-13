/**
 * Algorithm-Specific Animation Choreography
 * ══════════════════════════════════════════════════════════════════
 *
 * Gives each sorting algorithm its own animation "personality."
 * Instead of every algorithm sharing the same generic springs,
 * each one FEELS different — bubble sort is reluctant, quick sort
 * is decisive, merge sort is zen, etc.
 *
 * This file is a pure configuration module — no side effects,
 * no component imports. It maps algorithm IDs to motion parameters
 * that the ArrayVisualizer (and future visualizers) consume.
 *
 * Usage:
 *   import { getChoreography } from '@/lib/algorithms/algorithm-choreography';
 *
 *   const choreo = getChoreography('quick-sort');
 *   // choreo.barTransition -> fast, decisive spring
 *   // choreo.durationScale -> 0.8 (faster feel)
 */

import { springs } from '@/lib/constants/motion';

// ─── Types ──────────────────────────────────────────────────────

/** Spring configuration matching the shape used by motion/react's transition prop. */
export interface SpringConfig {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass: number;
}

export interface AlgorithmChoreography {
  /** Spring config for bar height changes during this algorithm. */
  barTransition: SpringConfig;

  /** Duration multiplier (1.0 = standard, 0.8 = faster, 1.3 = slower). */
  durationScale: number;

  /** Scale pulse when a bar enters 'sorted' state: [start, peak, end]. */
  sortedPulse: [number, number, number];

  /** Scale pulse when bars are swapping: [start, peak, end]. */
  swapPulse: [number, number, number];

  /** Comparing bars glow intensity (0-1, controls box-shadow opacity). */
  compareGlowIntensity: number;

  /** Entry animation stagger delay per bar (seconds). */
  entryStagger: number;

  /** Whether to add a micro-bounce when a swap completes. */
  swapBounce: boolean;

  /** Cubic-bezier control points for color transitions [x1, y1, x2, y2]. */
  colorEasing: readonly [number, number, number, number];
}

// ─── Defaults ───────────────────────────────────────────────────

const DEFAULT_CHOREOGRAPHY: AlgorithmChoreography = {
  barTransition: { ...springs.smooth },
  durationScale: 1.0,
  sortedPulse: [1, 1.05, 1],
  swapPulse: [1, 1, 1],           // no pulse by default
  compareGlowIntensity: 0.3,
  entryStagger: 0.02,
  swapBounce: false,
  colorEasing: [0.65, 0, 0.35, 1], // inOut
};

// ─── Per-Algorithm Overrides ────────────────────────────────────

const CHOREOGRAPHY_MAP: Record<string, Partial<AlgorithmChoreography>> = {
  /**
   * Bubble Sort — Slow, methodical, careful.
   * Bars reluctantly slide past each other. A gentle spring with
   * extra mass creates that "I don't really want to move" feeling.
   * Slight compression during swap reinforces reluctance.
   */
  'bubble-sort': {
    barTransition: { type: 'spring', stiffness: 150, damping: 22, mass: 1.2 },
    durationScale: 1.3,
    sortedPulse: [1, 1.08, 1],
    swapPulse: [1, 0.95, 1],      // slight compression — reluctant
    compareGlowIntensity: 0.2,
    swapBounce: true,
  },

  /**
   * Quick Sort — Confident, decisive.
   * Pivot slams into position. High stiffness + low mass = fast,
   * aggressive movement. No bounce — decisive elements don't waver.
   */
  'quick-sort': {
    barTransition: { type: 'spring', stiffness: 450, damping: 28, mass: 0.6 },
    durationScale: 0.8,
    sortedPulse: [1, 1.12, 1],    // decisive snap into place
    swapPulse: [1, 1.08, 1],      // powerful swap
    compareGlowIntensity: 0.5,
    swapBounce: false,
  },

  /**
   * Merge Sort — Zen, smooth.
   * Elements interleave like a zipper. Even pacing, gentle completion,
   * minimal swap disruption. Ease-out color transitions for fluidity.
   */
  'merge-sort': {
    barTransition: { type: 'spring', stiffness: 180, damping: 24, mass: 1.0 },
    durationScale: 1.0,
    sortedPulse: [1, 1.04, 1],
    swapPulse: [1, 1.02, 1],      // minimal — zen
    compareGlowIntensity: 0.25,
    entryStagger: 0.025,           // slightly slower cascade
    colorEasing: [0.16, 1, 0.3, 1], // ease-out for fluid feel
  },

  /**
   * Heap Sort — Powerful, gravity-driven.
   * Elements rise and fall with weight. Moderate stiffness with
   * lower damping allows a satisfying bounce on landing.
   */
  'heap-sort': {
    barTransition: { type: 'spring', stiffness: 350, damping: 18, mass: 0.8 },
    durationScale: 0.9,
    sortedPulse: [1, 1.1, 1],
    swapPulse: [1, 1.06, 1],
    compareGlowIntensity: 0.35,
    swapBounce: true,              // elements "land" with bounce
  },

  /**
   * Insertion Sort — Patient.
   * The key element slides through the sorted portion. Medium spring
   * with good damping for that smooth sliding motion. Strong scan
   * glow shows the comparison sweep.
   */
  'insertion-sort': {
    barTransition: { type: 'spring', stiffness: 220, damping: 26, mass: 1.0 },
    durationScale: 1.1,
    sortedPulse: [1, 1.03, 1],    // subtle
    compareGlowIntensity: 0.4,    // strong scan feel
    entryStagger: 0.015,
  },

  /**
   * Selection Sort — Systematic.
   * Active scan has a "searchlight" sweep feel. High compare glow
   * intensity reinforces the scanning behavior. Crisp sorted pulse
   * when the minimum is placed.
   */
  'selection-sort': {
    barTransition: { type: 'spring', stiffness: 250, damping: 28, mass: 0.9 },
    durationScale: 1.0,
    sortedPulse: [1, 1.06, 1],
    compareGlowIntensity: 0.45,   // searchlight scan
  },

  /**
   * Shell Sort — Rhythmic.
   * Gaps create a musical pattern in the movement. Lighter mass with
   * moderate stiffness for snappy gap-stride hops. Bounce on landing
   * adds rhythmic punctuation.
   */
  'shell-sort': {
    barTransition: { type: 'spring', stiffness: 280, damping: 22, mass: 0.7 },
    durationScale: 0.9,
    sortedPulse: [1, 1.05, 1],
    swapBounce: true,
  },

  /**
   * Tim Sort — Adaptive.
   * Smooth when data is partially sorted, decisive on random data.
   * Balanced spring that works well in both regimes.
   */
  'tim-sort': {
    barTransition: { type: 'spring', stiffness: 240, damping: 24, mass: 0.9 },
    durationScale: 1.0,
    sortedPulse: [1, 1.06, 1],
    compareGlowIntensity: 0.3,
  },

  /**
   * Counting Sort — Mechanical, precise.
   * Elements snap into buckets. Very high stiffness + high damping +
   * low mass = fast, precise, no-nonsense snap. Minimal visual flair.
   */
  'counting-sort': {
    barTransition: { type: 'spring', stiffness: 400, damping: 30, mass: 0.5 },
    durationScale: 0.7,
    sortedPulse: [1, 1.02, 1],    // minimal
    compareGlowIntensity: 0.15,
  },

  /**
   * Radix Sort — Mechanical, precise (sibling to counting sort).
   * Similar bucket-snap feel with slightly different tuning to
   * distinguish the two visually. Slightly more damped for the
   * digit-by-digit processing feel.
   */
  'radix-sort': {
    barTransition: { type: 'spring', stiffness: 380, damping: 32, mass: 0.5 },
    durationScale: 0.75,
    sortedPulse: [1, 1.03, 1],
    compareGlowIntensity: 0.2,
  },
};

// ─── Public API ─────────────────────────────────────────────────

/**
 * Get the full choreography for a specific algorithm.
 * Returns defaults for any algorithm ID not in the map.
 */
export function getChoreography(algorithmId: string): AlgorithmChoreography {
  const overrides = CHOREOGRAPHY_MAP[algorithmId];
  if (!overrides) return { ...DEFAULT_CHOREOGRAPHY };
  return { ...DEFAULT_CHOREOGRAPHY, ...overrides };
}

/** All algorithm IDs that have custom choreography defined. */
export const CHOREOGRAPHED_ALGORITHMS = Object.keys(CHOREOGRAPHY_MAP);
