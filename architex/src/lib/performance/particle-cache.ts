// ─────────────────────────────────────────────────────────────
// Architex — Particle Path Cache (PER-015)
// ─────────────────────────────────────────────────────────────
//
// Pre-computes animation paths for particles travelling along
// canvas edges. Paths are cached by a composite key of edgeId +
// source/target positions. Cache entries are automatically
// invalidated when an edge's endpoints change.
//
// The pre-computed path is a series of [x, y] waypoints sampled
// at a configurable resolution along a quadratic bezier curve.
// During animation, the particle layer can lerp between the two
// nearest waypoints instead of evaluating the bezier per-frame.
// ─────────────────────────────────────────────────────────────

// ── Types ────────────────────────────────────────────────────

/** A 2D point on the animation path. */
export interface PathPoint {
  x: number;
  y: number;
}

/** A pre-computed animation path for a single edge. */
export interface CachedPath {
  edgeId: string;
  /** Ordered waypoints from source to target. */
  points: PathPoint[];
  /** Total arc length in pixels (approximate). */
  totalLength: number;
  /** The cache key that produced this entry. */
  cacheKey: string;
}

/** Position descriptor for cache key generation. */
export interface EndpointPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Constants ────────────────────────────────────────────────

/** Number of sampled points per cached path. */
const DEFAULT_RESOLUTION = 64;

/** Max curvature offset as a fraction of distance. */
const CURVATURE_FACTOR = 0.2;
const MAX_CURVATURE_PX = 80;

// ── Bezier Helpers ───────────────────────────────────────────

/**
 * Compute a control point for a gentle bezier curve between
 * two endpoints, matching the ParticleLayer's curve logic.
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
  const offset = Math.min(dist * CURVATURE_FACTOR, MAX_CURVATURE_PX);
  const nx = -dy / (dist || 1);
  const ny = dx / (dist || 1);
  return [mx + nx * offset, my + ny * offset];
}

/**
 * Evaluate a quadratic bezier at parameter t.
 */
function quadraticBezier(
  t: number,
  p0x: number,
  p0y: number,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): PathPoint {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * p0x + 2 * mt * t * p1x + t2 * p2x,
    y: mt2 * p0y + 2 * mt * t * p1y + t2 * p2y,
  };
}

// ── Cache Key ────────────────────────────────────────────────

/**
 * Generate a unique cache key from an edge ID and its
 * source/target center positions. Position values are rounded
 * to avoid floating-point jitter causing unnecessary
 * invalidation.
 */
export function makeCacheKey(
  edgeId: string,
  source: EndpointPosition,
  target: EndpointPosition,
): string {
  const sx = Math.round(source.x + source.width / 2);
  const sy = Math.round(source.y + source.height / 2);
  const tx = Math.round(target.x + target.width / 2);
  const ty = Math.round(target.y + target.height / 2);
  return `${edgeId}|${sx},${sy}|${tx},${ty}`;
}

// ── Path Computation ─────────────────────────────────────────

/**
 * Sample a quadratic bezier path at the given resolution,
 * returning ordered waypoints and total arc length.
 */
export function computePath(
  source: EndpointPosition,
  target: EndpointPosition,
  resolution: number = DEFAULT_RESOLUTION,
): { points: PathPoint[]; totalLength: number } {
  const sx = source.x + source.width / 2;
  const sy = source.y + source.height / 2;
  const tx = target.x + target.width / 2;
  const ty = target.y + target.height / 2;

  const [cx, cy] = computeControlPoint(sx, sy, tx, ty);

  const points: PathPoint[] = [];
  let totalLength = 0;
  let prevX = sx;
  let prevY = sy;

  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const pt = quadraticBezier(t, sx, sy, cx, cy, tx, ty);
    points.push(pt);

    if (i > 0) {
      const dx = pt.x - prevX;
      const dy = pt.y - prevY;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }
    prevX = pt.x;
    prevY = pt.y;
  }

  return { points, totalLength };
}

// ── ParticlePathCache ────────────────────────────────────────

/**
 * LRU-ish cache of pre-computed particle animation paths.
 * Keyed by edge ID + source/target positions. Entries are
 * invalidated when an edge's endpoints change (the old key
 * no longer matches).
 */
export class ParticlePathCache {
  private cache = new Map<string, CachedPath>();
  private maxEntries: number;
  private resolution: number;

  constructor(maxEntries: number = 512, resolution: number = DEFAULT_RESOLUTION) {
    this.maxEntries = maxEntries;
    this.resolution = resolution;
  }

  /**
   * Retrieve (or compute and cache) the animation path for
   * a given edge. Returns the cached path if the key matches,
   * otherwise computes a new one and evicts stale entries.
   */
  get(
    edgeId: string,
    source: EndpointPosition,
    target: EndpointPosition,
  ): CachedPath {
    const key = makeCacheKey(edgeId, source, target);

    const existing = this.cache.get(key);
    if (existing) {
      return existing;
    }

    // Invalidate any previous entry for this edge ID
    this.invalidateEdge(edgeId);

    // Compute new path
    const { points, totalLength } = computePath(source, target, this.resolution);
    const entry: CachedPath = { edgeId, points, totalLength, cacheKey: key };

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, entry);
    return entry;
  }

  /**
   * Invalidate all cached paths for a specific edge.
   * Called when an edge is removed or reconnected.
   */
  invalidateEdge(edgeId: string): void {
    for (const [key, entry] of this.cache) {
      if (entry.edgeId === edgeId) {
        this.cache.delete(key);
      }
    }
  }

  /** Remove all cached paths. */
  clear(): void {
    this.cache.clear();
  }

  /** Current number of cached entries. */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Look up a point on the cached path at a given progress (0..1).
   * Returns the interpolated position, or null if the edge has no
   * cached path.
   */
  getPointAtProgress(
    edgeId: string,
    source: EndpointPosition,
    target: EndpointPosition,
    progress: number,
  ): PathPoint | null {
    const path = this.get(edgeId, source, target);
    if (path.points.length === 0) return null;

    const clamped = Math.max(0, Math.min(1, progress));
    const idx = clamped * (path.points.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, path.points.length - 1);
    const frac = idx - lo;

    const a = path.points[lo];
    const b = path.points[hi];

    return {
      x: a.x + (b.x - a.x) * frac,
      y: a.y + (b.y - a.y) * frac,
    };
  }
}
