// ─────────────────────────────────────────────────────────────
// Architex — Edge Animation Optimizer
// ─────────────────────────────────────────────────────────────
//
// Animated edges (dash-offset, particles, gradients) are expensive
// when there are hundreds of edges on the canvas. This module
// provides a simple threshold-based toggle: once the node count
// exceeds a limit, edge rendering switches to a simplified mode
// with no animations, thinner lines, and no gradients.
// ─────────────────────────────────────────────────────────────

// ── Configuration ──────────────────────────────────────────

export interface EdgePerformanceConfig {
  /** Node count above which edge animations are disabled. */
  animationThreshold: number;
  /** Node count above which gradients are disabled. */
  gradientThreshold: number;
  /** Default edge stroke width. */
  defaultStrokeWidth: number;
  /** Reduced edge stroke width for large diagrams. */
  reducedStrokeWidth: number;
}

export const DEFAULT_EDGE_PERFORMANCE_CONFIG: EdgePerformanceConfig = {
  animationThreshold: 200,
  gradientThreshold: 150,
  defaultStrokeWidth: 2,
  reducedStrokeWidth: 1,
};

// ── Edge Style Result ──────────────────────────────────────

export interface EdgeStyleResult {
  /** Whether edges should be animated (dash-offset, particles). */
  animated: boolean;
  /** Edge stroke width in pixels. */
  strokeWidth: number;
  /** Whether to render gradient fills on edges. */
  useGradient: boolean;
  /** Whether to render animated particles along edges. */
  showParticles: boolean;
}

// ── Public API ─────────────────────────────────────────────

/**
 * Returns `true` when the diagram is small enough to afford
 * edge animations without jank.
 *
 * @param nodeCount Total number of nodes in the diagram
 * @param threshold Override the default threshold (200)
 */
export function shouldAnimateEdges(
  nodeCount: number,
  threshold: number = DEFAULT_EDGE_PERFORMANCE_CONFIG.animationThreshold,
): boolean {
  return nodeCount <= threshold;
}

/**
 * Returns a complete edge styling configuration based on the
 * current diagram size. Large diagrams get thinner, static,
 * gradient-free edges for performance.
 *
 * @param nodeCount Total number of nodes in the diagram
 * @param config    Optional override for thresholds
 */
export function getEdgeStyle(
  nodeCount: number,
  config: EdgePerformanceConfig = DEFAULT_EDGE_PERFORMANCE_CONFIG,
): EdgeStyleResult {
  const isLarge = nodeCount > config.animationThreshold;
  const isVeryLarge = nodeCount > config.gradientThreshold;

  return {
    animated: !isLarge,
    strokeWidth: isLarge ? config.reducedStrokeWidth : config.defaultStrokeWidth,
    useGradient: !isVeryLarge,
    showParticles: !isLarge,
  };
}
