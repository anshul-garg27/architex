import { useUIStore, type AnimationSpeed } from "@/stores/ui-store";

/**
 * Animation speed multiplier map.
 * - slow: 2x duration (animations take twice as long)
 * - normal: 1x duration (default)
 * - fast: 0.5x duration (animations complete in half the time)
 */
const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  slow: 2,
  normal: 1,
  fast: 0.5,
};

/**
 * Returns the current animation speed preference and a duration multiplier.
 *
 * Usage:
 *   const { speed, multiplier } = useAnimationSpeed();
 *   const duration = 300 * multiplier; // 600ms slow, 300ms normal, 150ms fast
 */
export function useAnimationSpeed(): {
  speed: AnimationSpeed;
  multiplier: number;
} {
  const speed = useUIStore((s) => s.animationSpeed);
  return { speed, multiplier: SPEED_MULTIPLIERS[speed] };
}
