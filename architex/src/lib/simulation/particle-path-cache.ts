/**
 * Particle Path Cache
 *
 * Pre-samples bezier curves for edge flow animations and caches
 * the resulting point lookup tables. Instead of computing bezier
 * math on every frame for every particle, we sample N points once
 * when the edge geometry changes and do O(1) lookups thereafter.
 *
 * This eliminates the hot bezier computation from the render loop.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A pre-sampled point on an edge path. */
interface SampledPoint {
  x: number;
  y: number;
}

/** Cached path data for a single edge. */
interface CachedPath {
  /** Pre-sampled points along the path (equally spaced in t). */
  points: SampledPoint[];
  /** Source and target positions used to generate this cache (for invalidation). */
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of sample points per edge path. Higher = smoother but more memory. */
const SAMPLE_COUNT = 64;

// ---------------------------------------------------------------------------
// Bezier helpers (identical to ParticleLayer but isolated for caching)
// ---------------------------------------------------------------------------

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
  const offset = Math.min(dist * 0.2, 80);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return [mx + nx * offset, my + ny * offset];
}

// ---------------------------------------------------------------------------
// ParticlePathCache
// ---------------------------------------------------------------------------

/**
 * Caches pre-sampled bezier paths for edge flow animations.
 *
 * Usage:
 *   const cache = new ParticlePathCache();
 *   cache.cacheEdgePath('edge-1', sx, sy, tx, ty);
 *   const { x, y } = cache.getPointAtProgress('edge-1', 0.5);
 */
export class ParticlePathCache {
  private readonly paths: Map<string, CachedPath> = new Map();

  /**
   * Cache (or update) the sampled path for an edge.
   *
   * Call this when edge geometry changes (source/target positions move).
   * If the positions haven't changed, this is a no-op.
   *
   * @param edgeId - Unique edge identifier
   * @param sx     - Source center X
   * @param sy     - Source center Y
   * @param tx     - Target center X
   * @param ty     - Target center Y
   */
  cacheEdgePath(
    edgeId: string,
    sx: number,
    sy: number,
    tx: number,
    ty: number,
  ): void {
    // Check if we already have a valid cache for this geometry
    const existing = this.paths.get(edgeId);
    if (
      existing &&
      existing.sourceX === sx &&
      existing.sourceY === sy &&
      existing.targetX === tx &&
      existing.targetY === ty
    ) {
      return; // Geometry unchanged, skip re-sampling
    }

    // Compute control point
    const [cx, cy] = computeControlPoint(sx, sy, tx, ty);

    // Pre-sample the bezier curve
    const points: SampledPoint[] = new Array(SAMPLE_COUNT + 1);
    for (let i = 0; i <= SAMPLE_COUNT; i++) {
      const t = i / SAMPLE_COUNT;
      const [x, y] = quadraticBezier(t, sx, sy, cx, cy, tx, ty);
      points[i] = { x, y };
    }

    this.paths.set(edgeId, {
      points,
      sourceX: sx,
      sourceY: sy,
      targetX: tx,
      targetY: ty,
    });
  }

  /**
   * Get the interpolated point at a given progress (0 to 1) along a cached path.
   *
   * Uses linear interpolation between the two nearest sample points for
   * sub-sample accuracy.
   *
   * @param edgeId   - Edge identifier
   * @param progress - Progress along the path (0 = source, 1 = target)
   * @returns The {x, y} position, or null if the edge is not cached
   */
  getPointAtProgress(edgeId: string, progress: number): SampledPoint | null {
    const cached = this.paths.get(edgeId);
    if (!cached) return null;

    const { points } = cached;
    const t = Math.max(0, Math.min(1, progress));
    const scaledIndex = t * SAMPLE_COUNT;
    const lo = Math.floor(scaledIndex);
    const hi = Math.min(lo + 1, SAMPLE_COUNT);
    const frac = scaledIndex - lo;

    // Linear interpolation between the two nearest samples
    const pLo = points[lo];
    const pHi = points[hi];
    return {
      x: pLo.x + (pHi.x - pLo.x) * frac,
      y: pLo.y + (pHi.y - pLo.y) * frac,
    };
  }

  /**
   * Check if a path is cached for the given edge.
   */
  has(edgeId: string): boolean {
    return this.paths.has(edgeId);
  }

  /**
   * Remove a cached path (e.g., when edge is deleted).
   */
  invalidate(edgeId: string): void {
    this.paths.delete(edgeId);
  }

  /**
   * Clear all cached paths.
   */
  clear(): void {
    this.paths.clear();
  }

  /**
   * Get the number of cached paths.
   */
  get size(): number {
    return this.paths.size;
  }
}
