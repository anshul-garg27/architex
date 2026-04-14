// ─────────────────────────────────────────────────────────────
// A* Collision-Aware Orthogonal Edge Router for UML Class Diagrams
// ─────────────────────────────────────────────────────────────
//
// Instead of a naive midpoint-jog router, this module builds a sparse
// visibility grid from obstacle (class box) edges + source/target points,
// then runs A* search over that grid to find the shortest orthogonal path
// that avoids all obstacles.
//
// The "sparse grid" trick keeps the search space small (typically 100-200
// candidate points for 13 classes) so each route completes in <5ms.

type Pt = { x: number; y: number };
type Side = "top" | "bottom" | "left" | "right";

/** Axis-aligned rectangle obstacle. */
interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Padding around obstacles so edges don't hug box borders.
 *  ROUTE_PAD is the grid coordinate (where lines can go).
 *  BLOCK_PAD is the collision zone (slightly smaller, so lines route outside). */
const ROUTE_PAD = 35;
const BLOCK_PAD = 30;

/** Small cost penalty added when changing direction (to prefer straighter paths). */
const BEND_PENALTY = 8;

/**
 * Minimum perpendicular stub length when exiting/entering a box side.
 * This ensures the path starts moving away from the box before turning.
 */
const EXIT_STUB = 25;

// ── Grid Construction ───────────────────────────────────────

/**
 * Collect the unique X and Y coordinates that form our sparse routing grid.
 * We use:
 *   - Source and target points
 *   - Exit-stub waypoints (so the path departs perpendicular to the side)
 *   - Each obstacle edge (left, right, top, bottom) +/- ROUTE_PAD
 *
 * The intersections of all unique Xs and Ys form the candidate waypoints.
 */
function buildGridCoords(
  src: Pt,
  srcSide: Side,
  tgt: Pt,
  tgtSide: Side,
  obstacles: Obstacle[],
): { xs: number[]; ys: number[] } {
  const xSet = new Set<number>();
  const ySet = new Set<number>();

  // Source and target
  xSet.add(src.x);
  ySet.add(src.y);
  xSet.add(tgt.x);
  ySet.add(tgt.y);

  // Exit-stub waypoints: a point EXIT_STUB away from the anchor in the exit direction.
  // This guarantees the first move is perpendicular to the box side.
  const srcStub = stubPoint(src, srcSide);
  xSet.add(srcStub.x);
  ySet.add(srcStub.y);
  const tgtStub = stubPoint(tgt, tgtSide);
  xSet.add(tgtStub.x);
  ySet.add(tgtStub.y);

  // Obstacle edges with padding
  for (const ob of obstacles) {
    const left = ob.x - ROUTE_PAD;
    const right = ob.x + ob.w + ROUTE_PAD;
    const top = ob.y - ROUTE_PAD;
    const bottom = ob.y + ob.h + ROUTE_PAD;

    xSet.add(left);
    xSet.add(right);
    ySet.add(top);
    ySet.add(bottom);
  }

  const xs = Array.from(xSet).sort((a, b) => a - b);
  const ys = Array.from(ySet).sort((a, b) => a - b);
  return { xs, ys };
}

/** Compute the stub point EXIT_STUB+extra away from an anchor in the exit direction. */
function stubPoint(anchor: Pt, side: Side, extra: number = 0): Pt {
  const d = EXIT_STUB + Math.abs(extra);
  switch (side) {
    case "top":    return { x: anchor.x, y: anchor.y - d };
    case "bottom": return { x: anchor.x, y: anchor.y + d };
    case "left":   return { x: anchor.x - d, y: anchor.y };
    case "right":  return { x: anchor.x + d, y: anchor.y };
  }
}

// ── Obstacle Collision ──────────────────────────────────────

/**
 * Check if a point lies inside any obstacle (with padding).
 * Returns true if the point is blocked.
 */
function isInsideObstacle(x: number, y: number, obstacles: Obstacle[]): boolean {
  for (const ob of obstacles) {
    if (
      x > ob.x - BLOCK_PAD &&
      x < ob.x + ob.w + BLOCK_PAD &&
      y > ob.y - BLOCK_PAD &&
      y < ob.y + ob.h + BLOCK_PAD
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Check if an orthogonal segment between two grid points passes through any obstacle.
 * The segment is either horizontal (same y) or vertical (same x).
 * We check the midpoint and both endpoints against obstacles.
 *
 * For a more precise check, we test whether the axis-aligned segment
 * intersects any obstacle rectangle (with padding).
 */
function segmentBlockedByObstacle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  obstacles: Obstacle[],
): boolean {
  for (const ob of obstacles) {
    const oLeft   = ob.x - BLOCK_PAD;
    const oRight  = ob.x + ob.w + BLOCK_PAD;
    const oTop    = ob.y - BLOCK_PAD;
    const oBottom = ob.y + ob.h + BLOCK_PAD;

    if (ax === bx) {
      // Vertical segment: check if x is within obstacle's horizontal range
      // and the y-range overlaps
      const minY = Math.min(ay, by);
      const maxY = Math.max(ay, by);
      if (ax > oLeft && ax < oRight && maxY > oTop && minY < oBottom) {
        return true;
      }
    } else {
      // Horizontal segment: check if y is within obstacle's vertical range
      // and the x-range overlaps
      const minX = Math.min(ax, bx);
      const maxX = Math.max(ax, bx);
      if (ay > oTop && ay < oBottom && maxX > oLeft && minX < oRight) {
        return true;
      }
    }
  }
  return false;
}

// ── A* Search ───────────────────────────────────────────────

/** Direction of travel for bend detection. */
type Dir = "H" | "V" | "none";

interface AStarNode {
  xi: number;        // index into xs array
  yi: number;        // index into ys array
  g: number;         // cost from start
  f: number;         // g + heuristic
  dir: Dir;          // direction we arrived from
  parentKey: string | null;
}

function nodeKey(xi: number, yi: number): string {
  return `${xi},${yi}`;
}

/**
 * Run A* on the sparse grid from src to tgt.
 *
 * Movement is orthogonal only: from grid point (xi, yi) we can move to any
 * adjacent grid point in the same row (left/right) or same column (up/down),
 * provided the segment between them doesn't pass through an obstacle.
 *
 * Cost = Manhattan distance traveled + BEND_PENALTY for each direction change.
 * Heuristic = Manhattan distance to target (admissible for orthogonal movement).
 */
function astarSearch(
  xs: number[],
  ys: number[],
  srcXi: number,
  srcYi: number,
  tgtXi: number,
  tgtYi: number,
  obstacles: Obstacle[],
  initialDir: Dir,
): Pt[] | null {
  const openMap = new Map<string, AStarNode>();
  const closedSet = new Set<string>();
  const parentMap = new Map<string, { xi: number; yi: number }>();

  const tgtX = xs[tgtXi];
  const tgtY = ys[tgtYi];

  function heuristic(xi: number, yi: number): number {
    return Math.abs(xs[xi] - tgtX) + Math.abs(ys[yi] - tgtY);
  }

  const startKey = nodeKey(srcXi, srcYi);
  const startH = heuristic(srcXi, srcYi);
  openMap.set(startKey, {
    xi: srcXi,
    yi: srcYi,
    g: 0,
    f: startH,
    dir: initialDir,
    parentKey: null,
  });

  // Simple priority extraction: find min-f node in openMap.
  // With ~200 grid points this is fast enough (no need for a binary heap).
  // Safety: cap iterations to prevent infinite loops.
  let iterations = 0;
  const MAX_ITERATIONS = 5000;
  while (openMap.size > 0 && iterations++ < MAX_ITERATIONS) {
    // Pick the open node with lowest f
    let bestKey = "";
    let bestF = Infinity;
    for (const [key, node] of openMap) {
      if (node.f < bestF) {
        bestF = node.f;
        bestKey = key;
      }
    }

    const current = openMap.get(bestKey)!;
    openMap.delete(bestKey);
    closedSet.add(bestKey);

    // Goal reached
    if (current.xi === tgtXi && current.yi === tgtYi) {
      // Reconstruct path with cycle detection
      const path: Pt[] = [];
      const visited = new Set<string>();
      let ck: string | null = bestKey;
      while (ck !== null && !visited.has(ck) && path.length < 200) {
        visited.add(ck);
        const parts = ck.split(",");
        const xi = parseInt(parts[0], 10);
        const yi = parseInt(parts[1], 10);
        if (xi >= 0 && xi < xs.length && yi >= 0 && yi < ys.length) {
          path.push({ x: xs[xi], y: ys[yi] });
        }
        const p = parentMap.get(ck);
        ck = p ? nodeKey(p.xi, p.yi) : null;
      }
      path.reverse();
      return path;
    }

    const cx = xs[current.xi];
    const cy = ys[current.yi];

    // Generate neighbors: move along the row (vary xi) or column (vary yi)
    // For horizontal moves: same yi, different xi
    for (let nxi = 0; nxi < xs.length; nxi++) {
      if (nxi === current.xi) continue;
      const nx = xs[nxi];
      const nKey = nodeKey(nxi, current.yi);
      if (closedSet.has(nKey)) continue;

      // Check if the horizontal segment is blocked
      if (segmentBlockedByObstacle(cx, cy, nx, cy, obstacles)) continue;

      const moveCost = Math.abs(nx - cx);
      const newDir: Dir = "H";
      const bendCost = (current.dir !== "none" && current.dir !== newDir) ? BEND_PENALTY : 0;
      const ng = current.g + moveCost + bendCost;

      const existing = openMap.get(nKey);
      if (!existing || ng < existing.g) {
        const nf = ng + heuristic(nxi, current.yi);
        openMap.set(nKey, {
          xi: nxi,
          yi: current.yi,
          g: ng,
          f: nf,
          dir: newDir,
          parentKey: bestKey,
        });
        parentMap.set(nKey, { xi: current.xi, yi: current.yi });
      }
    }

    // For vertical moves: same xi, different yi
    for (let nyi = 0; nyi < ys.length; nyi++) {
      if (nyi === current.yi) continue;
      const ny = ys[nyi];
      const nKey = nodeKey(current.xi, nyi);
      if (closedSet.has(nKey)) continue;

      // Check if the vertical segment is blocked
      if (segmentBlockedByObstacle(cx, cy, cx, ny, obstacles)) continue;

      const moveCost = Math.abs(ny - cy);
      const newDir: Dir = "V";
      const bendCost = (current.dir !== "none" && current.dir !== newDir) ? BEND_PENALTY : 0;
      const ng = current.g + moveCost + bendCost;

      const existing = openMap.get(nKey);
      if (!existing || ng < existing.g) {
        const nf = ng + heuristic(current.xi, nyi);
        openMap.set(nKey, {
          xi: current.xi,
          yi: nyi,
          g: ng,
          f: nf,
          dir: newDir,
          parentKey: bestKey,
        });
        parentMap.set(nKey, { xi: current.xi, yi: nyi });
      }
    }
  }

  // No path found
  return null;
}

// ── Path Simplification ─────────────────────────────────────

/**
 * Ensure every segment is strictly orthogonal (H or V). Any diagonal segment
 * gets split into two segments via an intermediate corner point.
 * Obstacle-aware: checks both routing options (V-first vs H-first) and
 * picks the one that doesn't cross an obstacle.
 */
function orthogonalize(pts: Pt[], obstacles: Obstacle[]): Pt[] {
  if (pts.length <= 1) return pts;
  const result: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = result[result.length - 1];
    const curr = pts[i];
    // If neither purely horizontal nor purely vertical, insert a corner
    if (prev.x !== curr.x && prev.y !== curr.y) {
      // Option A: vertical first (prev.x, curr.y) — go down/up, then left/right
      const cornerA: Pt = { x: prev.x, y: curr.y };
      // Option B: horizontal first (curr.x, prev.y) — go left/right, then down/up
      const cornerB: Pt = { x: curr.x, y: prev.y };

      // Check which option doesn't cross any obstacle
      const aBlocked =
        segmentBlockedByObstacle(prev.x, prev.y, cornerA.x, cornerA.y, obstacles) ||
        segmentBlockedByObstacle(cornerA.x, cornerA.y, curr.x, curr.y, obstacles);
      const bBlocked =
        segmentBlockedByObstacle(prev.x, prev.y, cornerB.x, cornerB.y, obstacles) ||
        segmentBlockedByObstacle(cornerB.x, cornerB.y, curr.x, curr.y, obstacles);

      // Prefer the unblocked option; if both blocked or both clear, prefer H-first
      // (horizontal departure looks cleaner for top-bottom UML layouts)
      if (aBlocked && !bBlocked) {
        result.push(cornerB);
      } else if (!aBlocked && bBlocked) {
        result.push(cornerA);
      } else {
        // Both clear or both blocked — prefer horizontal-first
        result.push(cornerB);
      }
    }
    result.push(curr);
  }
  return result;
}

/**
 * Remove redundant collinear points. If three consecutive points lie on the
 * same horizontal or vertical line, the middle one is unnecessary.
 */
function simplifyPath(pts: Pt[]): Pt[] {
  if (pts.length <= 2) return pts;

  const result: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    // Check if all three are on the same horizontal or vertical line
    const sameX = prev.x === curr.x && curr.x === next.x;
    const sameY = prev.y === curr.y && curr.y === next.y;
    if (sameX || sameY) continue; // skip redundant middle point

    result.push(curr);
  }
  result.push(pts[pts.length - 1]);
  return result;
}

// ── Fallback Simple Router ──────────────────────────────────

/** Simple midpoint-jog fallback (identical to the old orthoPath logic). */
function fallbackOrthoPath(src: Pt, srcSide: Side, tgt: Pt, tgtSide: Side): Pt[] {
  const pts: Pt[] = [src];
  const ROUTE_GAP = 20;

  const isVertSrc = srcSide === "top" || srcSide === "bottom";
  const isVertTgt = tgtSide === "top" || tgtSide === "bottom";
  const srcSign = (srcSide === "bottom" || srcSide === "right") ? 1 : -1;
  const tgtSign = (tgtSide === "bottom" || tgtSide === "right") ? 1 : -1;

  if (isVertSrc && isVertTgt) {
    const exitY = src.y + srcSign * ROUTE_GAP;
    const enterY = tgt.y + tgtSign * ROUTE_GAP;
    const jogY = (srcSign === tgtSign) ? (src.y + tgt.y) / 2 : (exitY + enterY) / 2;
    pts.push({ x: src.x, y: jogY });
    pts.push({ x: tgt.x, y: jogY });
  } else if (!isVertSrc && !isVertTgt) {
    const jogX = (src.x + tgt.x) / 2;
    pts.push({ x: jogX, y: src.y });
    pts.push({ x: jogX, y: tgt.y });
  } else if (isVertSrc && !isVertTgt) {
    pts.push({ x: src.x, y: tgt.y });
  } else {
    pts.push({ x: tgt.x, y: src.y });
  }

  pts.push(tgt);
  return pts;
}

// ── Public API ──────────────────────────────────────────────

/**
 * Route an edge from src to tgt, avoiding all obstacles, using A* over a
 * sparse visibility grid.
 *
 * @param src       - Anchor point on the source class box side
 * @param srcSide   - Which side of the source box the edge exits from
 * @param tgt       - Anchor point on the target class box side
 * @param tgtSide   - Which side of the target box the edge enters from
 * @param obstacles - All class boxes except source and target, as {x, y, w, h}
 * @returns         - Array of waypoints forming an orthogonal (H/V) path
 */
export function routeEdgeAStar(
  src: Pt,
  srcSide: Side,
  tgt: Pt,
  tgtSide: Side,
  obstacles: Obstacle[],
  /** Extra offset added to EXIT_STUB to stagger parallel approach channels. */
  channelOffset: number = 0,
): Pt[] {
  // No obstacles — simple routing is sufficient
  if (obstacles.length === 0) {
    return fallbackOrthoPath(src, srcSide, tgt, tgtSide);
  }

  // Always run A* when obstacles exist — the fast-path optimization
  // missed some collisions, causing lines to pass through boxes.

  // Step 1: Build sparse grid coordinates
  const { xs, ys } = buildGridCoords(src, srcSide, tgt, tgtSide, obstacles);

  // Step 2: Find src and tgt indices in the grid
  const srcXi = xs.indexOf(src.x);
  const srcYi = ys.indexOf(src.y);
  const tgtXi = xs.indexOf(tgt.x);
  const tgtYi = ys.indexOf(tgt.y);

  // Safety: if we can't find src/tgt in the grid, fall back
  if (srcXi < 0 || srcYi < 0 || tgtXi < 0 || tgtYi < 0) {
    return fallbackOrthoPath(src, srcSide, tgt, tgtSide);
  }

  // Determine initial direction based on the source exit side
  const initialDir: Dir =
    (srcSide === "top" || srcSide === "bottom") ? "V" : "H";

  // Step 3: Run A* from the exit-stub point (not from src directly, to
  // enforce the perpendicular departure). We prepend src and append tgt.
  const stub = stubPoint(src, srcSide);
  const stubXi = xs.indexOf(stub.x);
  const stubYi = ys.indexOf(stub.y);

  // If the stub point is inside an obstacle, skip it and route from src directly
  const stubInsideObstacle = stubXi < 0 || stubYi < 0 ||
    isInsideObstacle(stub.x, stub.y, obstacles);

  // Similarly for the target stub
  const tgtStub = stubPoint(tgt, tgtSide);
  const tgtStubXi = xs.indexOf(tgtStub.x);
  const tgtStubYi = ys.indexOf(tgtStub.y);
  const tgtStubInsideObstacle = tgtStubXi < 0 || tgtStubYi < 0 ||
    isInsideObstacle(tgtStub.x, tgtStub.y, obstacles);

  // Decide actual start/end for A*
  const startXi = stubInsideObstacle ? srcXi : stubXi;
  const startYi = stubInsideObstacle ? srcYi : stubYi;
  const endXi = tgtStubInsideObstacle ? tgtXi : tgtStubXi;
  const endYi = tgtStubInsideObstacle ? tgtYi : tgtStubYi;

  // Step 4: Run A*
  const astarPath = astarSearch(xs, ys, startXi, startYi, endXi, endYi, obstacles, initialDir);

  if (!astarPath || astarPath.length === 0) {
    return fallbackOrthoPath(src, srcSide, tgt, tgtSide);
  }

  // Step 5: Assemble full path: src -> [stub if used] -> A* path -> [tgtStub if used] -> tgt
  const fullPath: Pt[] = [];

  // Always start at src
  fullPath.push(src);

  // If we routed from the stub, the A* path already starts there.
  // If we routed from src directly, the A* path starts at src (skip duplicate).
  for (const pt of astarPath) {
    const last = fullPath[fullPath.length - 1];
    if (pt.x === last.x && pt.y === last.y) continue; // skip duplicate
    fullPath.push(pt);
  }

  // End at tgt if not already there
  const lastPt = fullPath[fullPath.length - 1];
  if (lastPt.x !== tgt.x || lastPt.y !== tgt.y) {
    // If we used tgtStub, add a segment from tgtStub to tgt
    if (!tgtStubInsideObstacle) {
      const prevLast = fullPath[fullPath.length - 1];
      if (prevLast.x !== tgtStub.x || prevLast.y !== tgtStub.y) {
        fullPath.push(tgtStub);
      }
    }
    fullPath.push(tgt);
  }

  // Step 6: Ensure all segments are orthogonal (obstacle-aware), then simplify
  let result = simplifyPath(orthogonalize(fullPath, obstacles));

  // Step 7: If channelOffset is set, shift the approach segments near tgt
  // so parallel edges entering the same box side use different Y/X channels.
  if (channelOffset !== 0 && result.length >= 3) {
    const isVertTgt = tgtSide === "top" || tgtSide === "bottom";
    // Find the last bend before tgt and shift its approach coordinate
    for (let i = result.length - 2; i >= 1; i--) {
      const pt = result[i];
      const next = result[i + 1];
      if (isVertTgt && pt.y === next.y && pt.y !== tgt.y) {
        // This is a horizontal approach segment — shift its Y
        result[i] = { x: pt.x, y: pt.y - channelOffset };
        // Also shift the preceding point's Y if it connects vertically
        if (i > 0 && result[i - 1].x === pt.x) {
          result[i - 1] = { x: result[i - 1].x, y: result[i].y };
        }
        break;
      }
      if (!isVertTgt && pt.x === next.x && pt.x !== tgt.x) {
        result[i] = { x: pt.x - channelOffset, y: pt.y };
        if (i > 0 && result[i - 1].y === pt.y) {
          result[i - 1] = { x: result[i].x, y: result[i - 1].y };
        }
        break;
      }
    }
  }

  return result;
}
