# LLD Canvas Playbook — What We Built & How to Replicate

> This document captures every technique, pattern, and decision from the LLD module's
> UML canvas upgrade session. Use this as a blueprint when upgrading other modules
> (System Design, Data Structures, Networking, etc.) to the same quality bar.

---

## 1. Layout Engine — Dagre Hierarchical Auto-Layout

**Problem:** Hand-authored x/y positions for diagram nodes. Overlapping boxes, no hierarchy awareness.

**Solution:** `@dagrejs/dagre` (Sugiyama algorithm) computes positions from graph structure.

**Key file:** `src/lib/lld/dagre-layout.ts`

**How it works:**
- Takes `nodes[]` + `edges[]` → returns positioned nodes with computed x/y
- `rankDir: "TB"` (top-to-bottom hierarchy)
- `nodeSep: 80, rankSep: 100, edgeSep: 30` — spacing between nodes/ranks
- For inheritance/realization edges, REVERSE the dagre direction (`g.setEdge(parent, child)`) so parents sit above children
- Node dimensions computed from actual content (`classBoxWidth()`, `classBoxHeight()`)

**Apply to other modules:**
- Any module with node-based diagrams (System Design flow, Data Structure trees)
- Call `layoutDagre()` on every load path: initial load, URL restore, mode toggle

**Gotcha:** The URL-restore `useEffect` must depend on the data arrays (they load async in API mode). Initialize `restoringFromUrl = true` if URL has params, to prevent the URL-writing effect from clearing the param before restore runs.

---

## 2. Edge Routing — A* Collision-Aware Orthogonal Router

**Problem:** Straight lines between nodes cut through intermediate boxes.

**Solution:** Three-layer routing system:

### Layer 1: Orthogonal routing (H/V segments only)
- Edges travel only horizontally or vertically, never diagonally
- `buildOrthoPathD()` renders waypoints as SVG `<path>` with rounded corners (`BEND_R = 12px`)

### Layer 2: A* pathfinding around obstacles
- **Key file:** `src/lib/lld/astar-router.ts`
- Sparse visibility grid from obstacle edges (not full canvas grid) → ~100-200 points
- A* search with Manhattan heuristic + bend penalty (8px per turn)
- `ROUTE_PAD = 35px` for grid coords, `BLOCK_PAD = 30px` for collision — 5px visible margin
- `EXIT_STUB = 25px` — perpendicular departure from box side
- Fallback to simple midpoint-jog if A* finds no path
- Max 5000 iterations safety cap
- Cycle detection in path reconstruction (`visited` Set)

### Layer 3: Post-processing
- `orthogonalize()` — splits any remaining diagonal segment into two H/V segments
- **Obstacle-aware**: checks both V-first and H-first options, picks the one that doesn't cross a box
- `simplifyPath()` — removes redundant collinear points

**Apply to other modules:**
- Any module where edges between nodes can cross intermediate nodes
- Import `routeEdgeAStar(src, srcSide, tgt, tgtSide, obstacles)` from the router

---

## 3. Port Spreading

**Problem:** Multiple edges exiting the same box side overlap at the center point.

**Solution:** Pre-compute port offsets in a `useMemo`:
1. Group edges by `(classId, side, src|tgt)`
2. For groups with >1 edge, spread with `PORT_SPREAD = 28px` gap
3. Apply offset along the box side (perpendicular to exit direction)

**Key pattern:**
```tsx
const isVert = side === "top" || side === "bottom";
const anchor = isVert
  ? { x: baseAnchor.x + portOffset, y: baseAnchor.y }
  : { x: baseAnchor.x, y: baseAnchor.y + portOffset };
```

---

## 4. UML Relationship Markers (UML 2.5 Spec)

**Standard:** All relationships use single monochrome stroke. Differentiation is purely structural.

| Type | Line | Start Marker | End Marker |
|------|------|-------------|------------|
| Inheritance | Solid | — | Hollow triangle (14px) |
| Realization | Dashed `10 6` | — | Hollow triangle (14px) |
| Composition | Solid | Filled diamond (16px) | — |
| Aggregation | Solid | Hollow diamond (16px) | — |
| Association | Solid | — | Open V arrow (11px) |
| Dependency | Dashed `10 6` | — | Open V arrow (11px) |

**Key variables:**
- `--lld-rel-stroke` — monochrome stroke color (theme-aware)
- `--lld-canvas-bg-deep` — fill for hollow markers (matches canvas bg)

**Hollow markers** use `fill="var(--lld-canvas-bg-deep)"` so the "hollow" matches the canvas background in both themes.

---

## 5. Interactive Features

### Focus Mode
- Hover a class → compute `connectedIds` Set from relationships
- All unrelated classes: `opacity: 0.35`, all unrelated edges: `opacity: 0.2`
- Connected edges: `highlighted = true` → blue glow + drop-shadow
- Transitions: `150ms ease` (snappy, not sluggish)

### Edge Highlighting
- Pass `highlighted` prop to each edge based on `hoveredClassId`
- Highlighted edges get `stroke: var(--lld-rel-highlight)`, `strokeWidth: 2`, `filter: drop-shadow(...)`

### Stereotype Glow Aura
- On hover/select, render a blurred colored rect behind the box:
```tsx
{(isHovered || isSelected) && (
  <rect x={cls.x-8} y={cls.y-8} width={w+16} height={h+16} rx={12}
    fill={borderColor} opacity={0.08} style={{ filter: "blur(12px)" }} />
)}
```

### Edge Draw Animation
- Measure path length via `pathRef.current.getTotalLength()`
- Set `strokeDasharray: pathLength`, `strokeDashoffset: pathLength`
- CSS animation `lld-edge-draw` animates offset to 0 (0.7s, staggered delay per edge)
- Skip for dashed edges (preserves dash pattern)

### Animated Dot Flow
- Small `<circle r="2.5">` traveling along each edge using CSS `offset-path`
- `animation: lld-dot-flow 2.5s linear infinite` with staggered delay
- Opacity: 0.5 normal, 0.9 when highlighted

### Ambient Particles
- 12 tiny circles with randomized position, direction, speed (6-12s), opacity (10-25%)
- CSS `lld-particle-drift` animation with `transform: translate(var(--p-dx), var(--p-dy))`
- `fill: var(--primary)` — theme-aware color

---

## 6. Canvas Visual Polish

### Dot Grid (Figma-style)
```tsx
<circle cx={gridSize/2} cy={gridSize/2} r="0.8"
  fill="var(--lld-canvas-border)" opacity="0.3" />
```
Uses theme-aware color so dots are visible in both light and dark mode.

### Vignette
- Subtle radial gradient: transparent center → 20% opacity at edges
- Use `var(--lld-canvas-bg-deep)` for the dark stop (theme-aware)

### Edge Bundling
- `siblingCount` prop on edges — count of edges sharing same port group
- When `siblingCount > 1`: shadow opacity drops from 0.12 to 0.04, width from 3 to 2
- Overlapping shadows visually merge into a single clean trunk

---

## 7. Zoom & Pan

### Zoom In/Out — center-preserving
```tsx
const ratio = newScale / prev.scale;
return {
  scale: newScale,
  translateX: cx - ratio * (cx - prev.translateX),
  translateY: cy - ratio * (cy - prev.translateY),
};
```

### Fit to View
- Reset transform to identity: `{ scale: 1, translateX: 0, translateY: 0 }`
- The SVG `viewBox` already computes content-fitting bounds, so identity = fit

---

## 8. Deep Linking

**URL format:** `?lld=pattern:observer`, `?lld=problem:atm`, `?lld=solid:srp`

**Critical pattern:**
```tsx
// Initialize to true if ?lld param exists — prevents URL-writing effect
// from deleting the param before the URL-reading effect restores state.
const restoringFromUrl = useRef(
  typeof window !== "undefined" && new URL(window.location.href).searchParams.has("lld"),
);
```

**The restore effect must:**
1. Depend on data arrays (`[PATTERNS, PROBLEMS, ...]`) to re-run when API data arrives
2. Apply `layoutDagre()` to the loaded data (not use raw hand-authored positions)
3. Use `urlRestoredRef` to prevent duplicate restoration

---

## 9. Syntax Highlighting

**Library:** `prism-react-renderer` v2 with manually registered Java grammar.

**Theme-aware:**
```tsx
const { resolvedTheme } = useTheme();
const isDark = resolvedTheme !== "light";
const codeTheme = isDark ? themes.nightOwl : themes.github;
```

**Java registration** (not in default bundle):
```tsx
if (!Prism.languages.java) {
  Prism.languages.java = Prism.languages.extend("clike", { ... });
}
```

---

## 10. Light Mode Support

### CSS Variables
Define ALL canvas/diagram variables in BOTH `:root` (dark) and `html.light`:

```css
:root {
  --lld-canvas-bg: #2F353B;        /* dark bg */
  --lld-canvas-text: #e2e8f0;      /* light text */
  --lld-rel-stroke: #94a3b8;       /* light stroke */
}
html.light {
  --lld-canvas-bg: #ffffff;         /* white bg */
  --lld-canvas-text: #1e293b;       /* dark text */
  --lld-rel-stroke: #64748b;        /* darker stroke for contrast */
}
```

### Tailwind Color Classes
NEVER use `text-*-300` or `text-*-400` alone. Always pair with `dark:`:
```
text-red-700 dark:text-red-300
text-emerald-700 dark:text-emerald-300
text-amber-700 dark:text-amber-300
```

### Hardcoded SVG Colors
Use CSS variables, never hex:
- Grid dots: `fill="var(--lld-canvas-border)"` not `fill="#ffffff"`
- Vignette: `stopColor="var(--lld-canvas-bg-deep)"` not `stopColor="#0a0e14"`
- Marker fill: `fill="var(--lld-canvas-bg-deep)"` not `fill="#0f0f1a"`

---

## 11. Dynamic Box Sizing

**Problem:** Fixed 220px box width → content overflows.

**Solution:** `classBoxWidth()` computes width from longest text line:
```tsx
const MONO_CHAR_W = 6.6; // 11px monospace ≈ 6.6px/char
const BOX_TEXT_PAD = 24;  // icon + margins
return Math.max(CLASS_BOX_WIDTH, Math.ceil(maxChars * MONO_CHAR_W + BOX_TEXT_PAD));
```

Must update ALL consumers when box width changes: Canvas, Minimap, AlignmentToolbar, PatternQuiz, MermaidEditor.

---

## 12. Cardinality & Relationship Labels

### Cardinality Labels ("1", "*", "1..*")
- Positioned **45px along the approach line** from the box edge, + 20px sideways
- Rendered as small pills: `<rect rx="7.5">` background + `<text>` overlay
- For vertical sides (top/bottom): offset Y by ±45px outward, X by +20px
- For horizontal sides (left/right): offset X by ±45px outward, Y by -12px
- `fontSize="10"`, `fontWeight="600"`, fill uses `var(--lld-rel-stroke)`

### Relationship Labels ("creates", "uses", "notifies")
- Positioned at the midpoint of the middle segment of the path
- Rendered as rounded capsule pills:
  - Shadow: `<rect rx="9.5" fill="rgba(0,0,0,0.3)" filter="blur(3px)">`
  - Background: `<rect rx="9.5" fill="var(--lld-canvas-bg-deep)" stroke="var(--lld-rel-stroke)" strokeWidth="0.6">`
  - Text: `fontSize="10"`, `fontStyle="italic"`, `letterSpacing="0.3"`
- `pointer-events: none` so they don't block edge hover interactions

### Edge Shadow for Depth
Each edge has a blurred shadow path behind it:
```tsx
<path d={pathD} fill="none"
  stroke={siblingCount > 1 ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.12)"}
  strokeWidth={siblingCount > 1 ? 2 : 3}
  style={{ filter: `blur(${siblingCount > 1 ? 1 : 2}px)` }} />
```
When bundled (`siblingCount > 1`), shadow fades so overlapping edges merge visually.

---

## 13. Lessons Learned — What NOT to Do

### Don't: Channel staggering for parallel edge approach
**Attempt:** Shift the horizontal approach segment's Y by the port offset to separate parallel edges entering the same box side.
**Result:** Created angular/non-orthogonal paths that looked worse than the crossing.
**Lesson:** Minor edge crossings near entry points are acceptable. Professional UML tools allow them.

### Don't: Fast-path skip for A* router
**Attempt:** Check if the simple fallback path crosses any box before running A*. Skip A* if it doesn't.
**Result:** The `segmentBlockedByObstacle` check missed some collisions (boundary precision), causing lines to pass through boxes.
**Lesson:** Always run A* when obstacles exist. The sparse grid keeps it fast enough.

### Don't: Use getBBox() for zoom-fit calculations
**Attempt:** Temporarily reset the zoom transform, measure SVG getBBox(), restore transform.
**Result:** Unreliable — getBBox returns different results depending on render timing and SVG viewBox.
**Lesson:** Let the SVG `viewBox` handle content fitting. "Fit" = reset zoom to identity.

### Don't: Use OBSTACLE_PAD for both grid coords AND collision detection
**Attempt:** Same padding value for routing grid lines and obstacle blocking.
**Result:** Lines route exactly ON the padded boundary — visually touching the box.
**Lesson:** Use separate values: `ROUTE_PAD=35` (where lines go) vs `BLOCK_PAD=30` (what's blocked). The 5px gap ensures visible clearance.

### Don't: Hardcode colors in SVG elements
**Problem:** `fill="#ffffff"` for dot grid, `stopColor="#0a0e14"` for vignette — invisible in the opposite theme.
**Lesson:** Always use CSS variables: `fill="var(--lld-canvas-border)"`, `stopColor="var(--lld-canvas-bg-deep)"`.

### Don't: Use text-*-300 without dark: prefix
**Problem:** `text-amber-300`, `text-red-300`, `text-emerald-300` are too light for white backgrounds.
**Lesson:** Always pair: `text-red-700 dark:text-red-300`.

### Don't: Set aggressive focus mode dimming
**Attempt:** 15% opacity + grayscale filter on dimmed classes.
**Result:** Diagram became unreadable — too much faded to nothing.
**Lesson:** Use 35% opacity, no grayscale, 150ms transitions. The dimmed elements should be clearly secondary but still visible.

---

## 14. A* Router Bug History (Cautionary Tale)

The A* router went through 5 bug-fix commits. Document these for anyone implementing similar:

1. **Cycle in path reconstruction** — `parentMap` could create circular references when parent pointers were overwritten. Fix: `visited` Set in reconstruction loop + `path.length < 200` cap.

2. **Fast-path incorrectly skipping A*** — The simple-path collision check missed cases. Fix: removed fast-path, always run A*.

3. **Diagonal segments from port spreading** — Port-spread anchor points didn't align with A* grid coordinates. Fix: `orthogonalize()` post-processing that splits diagonals into H/V.

4. **Orthogonalize choosing wrong direction** — Default "vertical first" sent lines through boxes. Fix: obstacle-aware orthogonalize that checks both V-first and H-first.

5. **Lines routing ON padded boundary** — Same padding for grid and collision. Fix: separate ROUTE_PAD (35) and BLOCK_PAD (30).

---

## 15. Commit Checklist for New Module

When upgrading another module to this quality bar:

- [ ] Add dagre layout engine (or reuse existing)
- [ ] Apply layout to ALL load paths (initial, URL restore, mode toggle)
- [ ] Add A* collision router (or reuse existing)
- [ ] Implement orthogonal edge rendering with rounded corners
- [ ] Add port spreading for shared exit points
- [ ] Define CSS variables for BOTH `:root` and `html.light`
- [ ] Add `dark:` prefix to ALL colored text classes
- [ ] Use theme-aware colors in SVG (no hardcoded hex)
- [ ] Add focus mode (hover → dim unrelated)
- [ ] Add edge highlighting (hover → glow connected)
- [ ] Add edge draw animation (stroke-dashoffset on load)
- [ ] Add dot grid canvas background
- [ ] Add stereotype glow aura on hover
- [ ] Test deep linking with URL params
- [ ] Test in both light and dark mode
- [ ] Test with largest diagram (most nodes) for performance
- [ ] Verify zoom in/out/fit works correctly

---

## Session Stats

- **32 commits** in one session
- **Files created:** `dagre-layout.ts`, `astar-router.ts`
- **Files modified:** `LLDCanvas.tsx`, `useLLDModuleImpl.tsx`, `LLDProperties.tsx`, `globals.css`, `constants.ts`, `Minimap.tsx`, `AlignmentToolbar.tsx`, `PatternQuiz.tsx`, `MermaidEditor.tsx`, `WalkthroughPlayer.tsx`, `AutoGrader.tsx`, `DailyChallenge.tsx`, `SOLIDViolationSpotter.tsx`, `package.json`
- **Libraries added:** `@dagrejs/dagre`, `prism-react-renderer` (Java grammar)
- **Diagrams upgraded:** 79 (36 patterns + 33 problems + 10 SOLID demos)
