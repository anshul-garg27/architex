import { describe, it, expect, beforeEach } from "vitest";
import {
  ParticlePathCache,
  computePath,
  makeCacheKey,
  type EndpointPosition,
} from "@/lib/performance/particle-cache";

// ── Helpers ──────────────────────────────────────────────────

function pos(x: number, y: number, w = 180, h = 60): EndpointPosition {
  return { x, y, width: w, height: h };
}

// ── Tests ────────────────────────────────────────────────────

describe("makeCacheKey", () => {
  it("produces a deterministic key from edge + positions", () => {
    const key1 = makeCacheKey("e1", pos(0, 0), pos(200, 100));
    const key2 = makeCacheKey("e1", pos(0, 0), pos(200, 100));
    expect(key1).toBe(key2);
  });

  it("differs when edgeId changes", () => {
    const key1 = makeCacheKey("e1", pos(0, 0), pos(200, 100));
    const key2 = makeCacheKey("e2", pos(0, 0), pos(200, 100));
    expect(key1).not.toBe(key2);
  });

  it("differs when source position changes", () => {
    const key1 = makeCacheKey("e1", pos(0, 0), pos(200, 100));
    const key2 = makeCacheKey("e1", pos(50, 0), pos(200, 100));
    expect(key1).not.toBe(key2);
  });

  it("differs when target position changes", () => {
    const key1 = makeCacheKey("e1", pos(0, 0), pos(200, 100));
    const key2 = makeCacheKey("e1", pos(0, 0), pos(300, 100));
    expect(key1).not.toBe(key2);
  });

  it("rounds positions to avoid float jitter", () => {
    const key1 = makeCacheKey("e1", pos(100.3, 200.7), pos(400.1, 500.9));
    const key2 = makeCacheKey("e1", pos(100.4, 200.6), pos(400.2, 500.8));
    // Both round to the same center points
    expect(key1).toBe(key2);
  });
});

describe("computePath", () => {
  it("returns the requested number of waypoints", () => {
    const { points } = computePath(pos(0, 0), pos(400, 300), 32);
    // resolution + 1 points (0..resolution inclusive)
    expect(points).toHaveLength(33);
  });

  it("starts at source center and ends at target center", () => {
    const source = pos(0, 0, 100, 50);
    const target = pos(400, 300, 100, 50);
    const { points } = computePath(source, target, 64);

    const first = points[0];
    const last = points[points.length - 1];

    // Source center
    expect(first.x).toBeCloseTo(50, 0); // 0 + 100/2
    expect(first.y).toBeCloseTo(25, 0); // 0 + 50/2

    // Target center
    expect(last.x).toBeCloseTo(450, 0); // 400 + 100/2
    expect(last.y).toBeCloseTo(325, 0); // 300 + 50/2
  });

  it("computes a positive total arc length", () => {
    const { totalLength } = computePath(pos(0, 0), pos(400, 300));
    expect(totalLength).toBeGreaterThan(0);
  });

  it("arc length increases with endpoint distance", () => {
    const near = computePath(pos(0, 0), pos(100, 0));
    const far = computePath(pos(0, 0), pos(1000, 0));
    expect(far.totalLength).toBeGreaterThan(near.totalLength);
  });

  it("path is monotonically progressing (no big jumps back)", () => {
    const source = pos(0, 0);
    const target = pos(500, 0);
    const { points } = computePath(source, target, 64);

    // X should generally increase from source to target
    for (let i = 1; i < points.length; i++) {
      // Allow small backward movement due to curvature, but not extreme
      expect(points[i].x).toBeGreaterThan(points[0].x - 50);
    }
  });
});

describe("ParticlePathCache", () => {
  let cache: ParticlePathCache;

  beforeEach(() => {
    cache = new ParticlePathCache(10, 32);
  });

  it("starts empty", () => {
    expect(cache.size).toBe(0);
  });

  it("caches a computed path on first access", () => {
    const path = cache.get("e1", pos(0, 0), pos(400, 300));

    expect(path.edgeId).toBe("e1");
    expect(path.points.length).toBeGreaterThan(0);
    expect(path.totalLength).toBeGreaterThan(0);
    expect(cache.size).toBe(1);
  });

  it("returns the same cached path on subsequent access", () => {
    const source = pos(0, 0);
    const target = pos(400, 300);

    const path1 = cache.get("e1", source, target);
    const path2 = cache.get("e1", source, target);

    expect(path1).toBe(path2); // same reference
    expect(cache.size).toBe(1);
  });

  it("invalidates when source position changes", () => {
    const target = pos(400, 300);

    const path1 = cache.get("e1", pos(0, 0), target);
    const path2 = cache.get("e1", pos(100, 0), target);

    expect(path1).not.toBe(path2);
    expect(path1.cacheKey).not.toBe(path2.cacheKey);
    // Old entry was invalidated so still only 1 in cache
    expect(cache.size).toBe(1);
  });

  it("invalidates when target position changes", () => {
    const source = pos(0, 0);

    cache.get("e1", source, pos(400, 300));
    cache.get("e1", source, pos(500, 300));

    expect(cache.size).toBe(1);
  });

  it("stores separate entries for different edges", () => {
    const source = pos(0, 0);
    const target = pos(400, 300);

    cache.get("e1", source, target);
    cache.get("e2", source, target);

    expect(cache.size).toBe(2);
  });

  it("invalidateEdge removes the entry", () => {
    cache.get("e1", pos(0, 0), pos(400, 300));
    cache.get("e2", pos(0, 0), pos(200, 100));
    expect(cache.size).toBe(2);

    cache.invalidateEdge("e1");
    expect(cache.size).toBe(1);
  });

  it("clear removes all entries", () => {
    cache.get("e1", pos(0, 0), pos(400, 300));
    cache.get("e2", pos(0, 0), pos(200, 100));

    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("evicts oldest entry when maxEntries is reached", () => {
    const smallCache = new ParticlePathCache(3, 16);

    smallCache.get("e1", pos(0, 0), pos(100, 0));
    smallCache.get("e2", pos(0, 0), pos(200, 0));
    smallCache.get("e3", pos(0, 0), pos(300, 0));
    expect(smallCache.size).toBe(3);

    // Adding a 4th should evict e1
    smallCache.get("e4", pos(0, 0), pos(400, 0));
    expect(smallCache.size).toBe(3);
  });

  // ── getPointAtProgress ────────────────────────────────────

  it("getPointAtProgress returns source at progress=0", () => {
    const source = pos(0, 0, 100, 50);
    const target = pos(400, 300, 100, 50);

    const point = cache.getPointAtProgress("e1", source, target, 0);
    expect(point).not.toBeNull();
    expect(point!.x).toBeCloseTo(50, 0); // source center
    expect(point!.y).toBeCloseTo(25, 0);
  });

  it("getPointAtProgress returns target at progress=1", () => {
    const source = pos(0, 0, 100, 50);
    const target = pos(400, 300, 100, 50);

    const point = cache.getPointAtProgress("e1", source, target, 1);
    expect(point).not.toBeNull();
    expect(point!.x).toBeCloseTo(450, 0); // target center
    expect(point!.y).toBeCloseTo(325, 0);
  });

  it("getPointAtProgress returns midpoint at progress=0.5", () => {
    const source = pos(0, 0, 100, 50);
    const target = pos(400, 0, 100, 50);

    const point = cache.getPointAtProgress("e1", source, target, 0.5);
    expect(point).not.toBeNull();
    // Should be roughly in the middle X range
    expect(point!.x).toBeGreaterThan(100);
    expect(point!.x).toBeLessThan(400);
  });

  it("getPointAtProgress clamps out-of-range values", () => {
    const source = pos(0, 0, 100, 50);
    const target = pos(400, 300, 100, 50);

    const atNeg = cache.getPointAtProgress("e1", source, target, -0.5);
    const atZero = cache.getPointAtProgress("e1", source, target, 0);
    expect(atNeg!.x).toBeCloseTo(atZero!.x, 5);
    expect(atNeg!.y).toBeCloseTo(atZero!.y, 5);

    const atOver = cache.getPointAtProgress("e1", source, target, 1.5);
    const atOne = cache.getPointAtProgress("e1", source, target, 1);
    expect(atOver!.x).toBeCloseTo(atOne!.x, 5);
    expect(atOver!.y).toBeCloseTo(atOne!.y, 5);
  });
});
