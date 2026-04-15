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

## 16. ViewBox & Zoom — Final Architecture (Session 2)

After 10+ iterations, the correct zoom architecture:

### Dynamic ViewBox with Minimum Dimensions
```tsx
const MIN_W = 900, MIN_H = 700;
const w = Math.max(rawW, MIN_W);
const h = Math.max(rawH, MIN_H);
// Center content within (possibly larger) viewBox
const cx = contentBounds.x + contentBounds.w / 2;
const cy = contentBounds.y + contentBounds.h / 2;
viewBox = { x: cx - w/2, y: cy - h/2, w, h };
```

**Why min dimensions:** Without them, `xMidYMid meet` blows up small patterns (3 classes) to fill the canvas. MIN_W=900 ensures comfortable whitespace.

**preserveAspectRatio="xMidYMid meet":** Centers content both axes, scales uniformly.

**zoomFit = identity reset:** `setZoom({ scale: 1, translateX: 0, translateY: 0 })`. The viewBox handles all fitting. No complex scale math needed.

**Auto-fit on resize:** `useEffect` depends on `classIdsKey` AND `containerSize` so diagram re-fits when bottom panel opens/closes.

### What NOT to Do (Lessons Learned)
- Don't use fixed viewBox (0 0 2000 2000) — requires complex scale math that never works for all sizes
- Don't use `preserveAspectRatio="none"` — distorts content and breaks coordinate systems
- Don't compute scale from DOM rects — the SVG/container may overflow and report wrong sizes
- Don't cap scale at fixed values (1.0 or 2.5) — different content needs different zoom
- Don't use `rect.width/2000` for svgToScreen ratio — wrong with `meet` scaling

---

## 17. Content Enrichment Pipeline

### Pattern Enrichment (pattern-enrichment.ts, 1020 lines)
- `PATTERN_ENRICHMENTS`: Record mapping 36 pattern IDs to enrichment data
- Fields: `complexityAnalysis`, `designRationale`, `commonVariations`, `antiPatterns`, `interviewDepth`
- `PATTERN_SELECTION_GUIDE`: 35-entry "When you see X, use Y" matrix
- Applied via for-loop at bottom of `patterns.ts` that mutates `DESIGN_PATTERNS` in-place

### Problem Solutions (problem-solutions.ts, 27,357 lines)
- `PROBLEM_SOLUTIONS`: Map of 10 problem IDs to solution content
- Fields: `referenceSolution` (Java code), `designWalkthrough`, `interviewScript`, `complexityAnalysis`
- Merged into `LLD_PROBLEMS` via `withSolutions()` wrapper at export
- Content sourced from `06-lld-problems/` reference material

### DB Seeding
```bash
cd architex && export $(cat .env.local | grep -v '^#' | grep -v '^$' | xargs) && pnpm db:seed -- --module=lld
```
- Seed uses DELETE + INSERT (not upsert) to guarantee content updates
- `staleTime: 5 minutes` in TanStack Query — users see fresh data after 5min
- After seeding, clear browser site data OR wait 5 min for cache expiry

### Realistic Class Names (18 patterns enriched)
Generic names like "ConcreteClassA/B" replaced with domain-specific:
- Singleton → `DatabaseConnectionPool`
- Factory Method → `NotificationFactory`, `EmailNotificationFactory`
- Builder → `QueryBuilder`, `SQLQueryBuilder`
- Decorator → `DataStream`, `EncryptionDecorator`, `CompressionDecorator`
- Facade → `OrderFacade`, `InventoryService`, `PaymentService`
- State → `Document`, `DraftState`, `ReviewState`, `PublishedState`
- (and 12 more)

---

## 18. Sequence & State Machine Canvases — Gap Analysis

Both canvases are significantly behind the Class Diagram canvas:

| Feature | Class Diagram | Sequence | State Machine |
|---------|--------------|----------|---------------|
| Dot grid | Figma dots | Old line grid (hardcoded white) | None |
| Vignette | Yes | No | No |
| Hover effects | Glow + lift + focus mode | None | None |
| Edge animation | stroke-dashoffset 0.4s | Broken (dead code) | None |
| Focus mode | Dim unrelated 35% | No | Partial (sim only) |
| Particles | 12 floating dots | No | No |
| Edge highlighting | Blue glow on hover | No | No |
| Auto-fit on load | Yes (ResizeObserver) | No | No |
| Light mode | Full CSS variables | Hardcoded #ffffff grid | Hardcoded legend colors |
| Content | 36+33 enriched | 10 examples (good) | 6 examples (gaps) |

**Key files:** `SequenceDiagramCanvas.tsx` (620 lines), `StateMachineCanvas.tsx` (525 lines)

**Critical bugs:**
1. No auto-fit on load — content may be clipped
2. Pan broken on `<path>/<line>` elements (only works on `<rect>`)
3. Sequence edge animation broken (strokeDashoffset always undefined)
4. Light mode: white grid on white background

**Status: FIXED** — Both canvases upgraded in commit `59243b0`:
- Auto-fit + ResizeObserver added
- Pan works on all SVG elements
- Dot grid + vignette + hover effects + draw animations
- Light mode fixed
- Zoom controls in header
- ViewBox min dimensions

---

## 19. Color Audit — 10 Design Token Fixes

Applied across ALL three canvases (Class, Sequence, State Machine):

### 1. --primary-rgb (62 broken glow shadows)
```css
--primary-rgb: 99 75 204;  /* for rgba(var(--primary-rgb), 0.3) */
```
All `rgba(110,86,207,...)` hardcoded shadows replaced with `rgba(var(--primary-rgb), ...)`.

### 2. LLD canvas colors on 228° HSL family
All canvas CSS variables rebuilt on a consistent 228° hue:
```css
--lld-canvas-bg: hsl(228 18% 22%);
--lld-canvas-text: hsl(220 20% 90%);
--lld-canvas-border: hsl(220 12% 40%);
```

### 3. --lld-class-fill token
```css
--lld-class-fill: hsl(228 18% 26%);  /* distinct from canvas bg */
```
Class boxes use `var(--lld-class-fill)` so they're visually distinct from the canvas background.

### 4. --foreground-subtle WCAG AA contrast
```css
--foreground-subtle: hsl(220 10% 62%);  /* passes 4.5:1 on dark bg */
```

### 5. Difficulty colors: hard→orange, expert→red
```css
--difficulty-hard: hsl(25 95% 53%);    /* orange, not red */
--difficulty-expert: hsl(0 72% 50%);   /* red, clearly different */
```

### 6. Glassmorphism removed from non-floating elements
`backdrop-blur` + `bg-*/50` only on floating overlays (tooltips, popovers, modals). Static containers use solid backgrounds.

### 7. Canvas grid dots larger/brighter
```tsx
<circle r="1" fill="var(--lld-canvas-text-subtle)" opacity="0.18" />
```
Was `r="0.8"` at 0.12 opacity — too faint.

### 8. SVG font→Geist Mono
```tsx
fontFamily="var(--font-geist-mono, monospace)"
```
All SVG `<text>` elements use the project's Geist Mono font.

### 9. Stereotype colors harmonized to HSL
```css
--lld-stereo-interface: hsl(217 80% 62%);
--lld-stereo-abstract: hsl(272 68% 64%);
--lld-stereo-enum: hsl(152 60% 48%);
--lld-stereo-class: hsl(220 12% 52%);
```

### 10. 34 gradient text→solid text-foreground-muted
Replaced all `bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent` with `text-foreground-muted`. The gradient looked flashy but failed in light mode and was hard to read.

### Additional:
- Ambient particles removed (distracted from content)
- Primary saturation 87%→78% (less aggressive)
- `GLASS_CONTAINER` and `GLASS_GRADIENT_TEXT` constants updated in `constants.ts`

---

## 20. Task Board

79 tasks created in `docs/tasks/`:
- `batch-lld-content-enrichment.json` — 36 tasks (LLD-200 to LLD-235)
- `batch-lld-problem-enrichment.json` — 33 tasks (LLD-300 to LLD-332)
- `batch-lld-canvas-polish.json` — 10 tasks (LLD-400 to LLD-409)

Status values must be: `backlog`, `ready`, `in-progress`, `done`, `blocked` (NOT `todo` or `in_progress`).

---

## 21. Java Code Tab + Syntax Highlighting

**Problem:** Code Sample section only had TypeScript and Python. Java was stored in a server-only seed file.

**Solution:**
- Extracted `JAVA_CODE` map (1812 lines, 36 patterns) to `src/lib/lld/java-code.ts` — client-safe module
- `patterns.ts` imports and injects Java at runtime: `for (const p of DESIGN_PATTERNS) { const java = JAVA_CODE[p.id]; if (java) p.code.java = java; }`
- `LLDProperties.tsx` adds conditional Java tab + `prism-react-renderer` Highlight component with `themes.nightOwl`
- Seed file `java-code-gen.ts` re-exports from shared module, merges `code.java` into DB `module_content.content` JSONB

**Key file:** `src/lib/lld/java-code.ts`

**Gotcha:** Python f-strings inside JS template literals — `f"${amount:.2f}"` is parsed as a JS expression. Escape as `\${amount:.2f}`.

---

## 22. Dynamic Class Box Width (Content-Aware Sizing)

**Problem:** Fixed `CLASS_BOX_WIDTH = 220px` caused text overflow for long method signatures like `attach(observer: Observer): void`.

**Solution:** `classBoxWidth()` function in `constants.ts`:
- Estimates text width: monospace 11px ≈ 6.6px per character
- Computes max chars across class name, all attributes (`visibility name: type`), all methods (`visibility name(params): returnType`)
- Returns `Math.max(CLASS_BOX_WIDTH, Math.ceil(maxChars * 6.6 + 24))`

**Files updated:** Every file that used `CLASS_BOX_WIDTH` now calls `classBoxWidth(cls)`:
- `LLDCanvas.tsx` — all rects, text anchors, handles, hit-tests, viewBox, connection drag
- `Minimap.tsx` — bounds calculation, relationship line centers, class rect widths
- `AlignmentToolbar.tsx` — align right, center horizontal, distribute horizontal
- `PatternQuiz.tsx` — mini diagram viewBox and class boxes
- `MermaidEditor.tsx` — preview class boxes and relationship lines

---

## 23. Design System v2 — Unified Color Palette

**Research method:** 3 parallel agents analyzed Linear, Brilliant, LeetCode, Obsidian, Raycast, Excalidraw, BridgeMind with actual inspected CSS values.

### Core Token Changes (`globals.css`)

| Token | Before | After | Rationale |
|-------|--------|-------|-----------|
| Background hue/sat | 228° / 15% | **225° / 8%** | Near-neutral so 30+ viz colors render true |
| Primary accent | 252° / 78% | **258° / 78%** | Pure violet, not "almost blue" |
| `--primary-rgb` | **missing** | `120 62 232` | 62 glow shadows in 17 files were broken |
| `--border` | `hsl(228 15% 16%)` | **`rgba(255,255,255, 0.10)`** | White-opacity adapts to all surface levels |
| `--border-subtle/default/strong` | Fixed HSL | **`rgba` at 0.06/0.10/0.16** | Linear-tier polish |
| Difficulty Easy | `hsl(152...)` green | **`hsl(172 80% 38%)` teal** | LeetCode recognition |
| Canvas edges | 55% lightness | **32% lightness** | 3-tier visibility (Obsidian lesson) |
| Gray scale saturation | 15% uniform | **8%→3% tapering** | Midrange grays most neutral |
| Foreground text saturation | 10-14% | **5%** | Cleaner text, less blue cast |

### New Tokens Added

```css
/* Warm amber for CTAs, progress, achievements (Brilliant-inspired) */
--accent-warm: hsl(35 90% 55%);
--accent-warm-hover: hsl(35 90% 48%);

/* Learning state tokens for quiz/flashcard/walkthrough */
--learn-correct / --learn-incorrect / --learn-hint / --learn-active / --learn-mastered
/* Each with -bg and -border variants at correct opacity */
```

### Other Visual Fixes

1. **Glassmorphism removed** from non-floating elements → solid `bg-elevated` in sidebar, properties, constants
2. **Gradient text removed** from 34 section headers → solid `text-foreground-muted`
3. **Canvas particles removed** — idle canvas = zero animation
4. **SVG font** → `var(--font-geist-mono, monospace)` instead of bare `monospace`
5. **Grid dots** → larger radius (1.0 vs 0.8), lighter source color at lower opacity
6. **GLASS_* constants** updated in `constants.ts` to use solid backgrounds
7. **Class box fill** → `--lld-class-fill` (distinct from canvas bg)

### Design Principles Established

- **Target personality:** "VS Code and Brilliant had a baby — technical but wants you to understand"
- **Complexity level:** 6.5/10 (between Figma and Linear)
- **3 text hierarchy levels only:** `--foreground`, `--foreground-subtle`, `--foreground-muted`
- **Violet for interactive states**, warm amber for navigation CTAs
- **Teal for Easy** difficulty (LeetCode alignment)
- **3-tier edge visibility:** dim default → visible hover → bright selected

---

## 24. State Machine Simulator Layout Fix

**Problem:** "AVAILABLE TRANSITIONS" panel at bottom was squeezed out — transition buttons invisible.

**Root cause:** Flexbox chain without `min-h-0`. The canvas `flex-1` children have implicit `min-height: auto` which prevents shrinking. The sim panel at the bottom had zero visible height.

**Fix in `useLLDModuleImpl.tsx`:**
- Added `min-h-0` to THREE parent divs in the flex chain (lines 901, 905, 908)
- Added `shrink-0` wrapper around SimTransitionPanel
- Moved SimToast inside the canvas relative wrapper

**Fix in `StateMachineCanvas.tsx`:**
- Transition buttons: `bg-elevated border-border/30` → `bg-primary/10 border-primary/30` (visible purple tint)

---

## 25. Stale Closure Fix — Load Observer Button

**Problem:** "Load Observer Pattern" CTA on empty canvas didn't work in API mode.

**Root cause:** `handleLoadObserver` used `DESIGN_PATTERNS.find()` inside `useCallback` but `DESIGN_PATTERNS` wasn't in the dependency array. In API mode, the initial render captures an empty array (data still loading), and the callback never updates.

**Fix:** Added `DESIGN_PATTERNS` to deps: `useCallback(() => { ... }, [DESIGN_PATTERNS, handleSelectPattern])`

---

## 26. Code-Diagram Alignment (30 Patterns × 3 Languages)

**Problem:** UML diagrams used realistic domain names (e.g., `EncryptionDecorator`) but code samples used generic GoF names (e.g., `LoggingDecorator`). Students couldn't connect diagram to code.

**Fix:** 6 parallel agents rewrote ALL TypeScript, Python, AND Java code samples to use the EXACT same class names as the UML diagram.

**Scale:** 30 patterns × 3 languages = 90 code sample rewrites, 1,782 lines changed.

**Example:**
| Pattern | Diagram | Code Before | Code After |
|---------|---------|-------------|------------|
| Decorator | `EncryptionDecorator` | `LoggingDecorator` | `EncryptionDecorator` |
| State | `DraftState`, `ReviewState` | `GreenLight`, `RedLight` | `DraftState`, `ReviewState` |
| Facade | `OrderFacade` | `Facade` | `OrderFacade` |

**Observer diagram cleanup:** Removed 3 variant classes (Event, EventBus, EventHandler) that confused students. Core diagram now has 4 classes only.

---

## 27. Problem Enrichment — All 33 Problems

Every LLD problem now has:
- **8-12 starter classes** (was 4-6) with 2+ attributes, 2+ methods each
- **5-7 progressive hints** (easy: entity identification → hard: concurrency/edge cases)
- **complexityAnalysis** field with time/space breakdown per operation
- **Reference solutions** — 23 NEW Java solutions written from scratch + 10 from reference materials

**Class expansion examples:**
| Problem | Before | After |
|---------|--------|-------|
| Parking Lot | 4 classes | 10 (added Ticket, PaymentProcessor, EntryGate, ExitGate, FeeCalculator, DisplayBoard) |
| Chess | 6 classes | 10 (added King, Knight, Pawn, MoveValidator with inheritance) |
| LRU Cache | 3 classes | 8 (added EvictionPolicy, CacheConfig, CacheEntry, CacheStats, TTLManager) |
| Elevator | 4 classes | 9 (added Floor, Button, Door, Display, ElevatorController) |

---

## 28. Canvas Polish — All 10 Tasks Complete

| Task | What |
|------|------|
| LLD-400 | Disconnected nodes audit — all 36 patterns verified, zero broken IDs |
| LLD-401 | Edge bundling — 5px cable spacing for 3+ parallel edges, directional gradient |
| LLD-402 | FLIP animation — AnimatePresence exit (fade+shrink), spring entry, smooth transitions |
| LLD-403 | Export to PlantUML/Mermaid — new `export-diagram.ts`, copy-to-clipboard with toast |
| LLD-404 | Pattern comparison mode — full-screen overlay, auto-suggest from confusedWith, side-by-side |
| LLD-405 | Mermaid editing — already bidirectional, added sync status indicator (Synced/Editing/Error) |
| LLD-406 | Light mode — 21 CSS vars added, hardcoded rgba replaced, dark: prefixes across 6 files |
| LLD-407 | Performance — A* routing wrapped in useMemo, only reruns on class position changes |
| LLD-408 | Accessibility — aria-labels on all edges/states/participants, role="img" on SVG containers |
| LLD-409 | Mobile — pinch-to-zoom, touch-action:none, reduced viewBox min on mobile, responsive header |

---

## 29. Sequence + State Machine Canvas Upgrades

Both canvases upgraded to match Class Diagram quality:

| Feature | Sequence | State Machine |
|---------|----------|---------------|
| Dot grid background | ✅ | ✅ |
| Vignette overlay | ✅ | ✅ |
| Hover effects (highlight related) | ✅ | ✅ |
| Edge/transition draw animation | ✅ | ✅ |
| Auto-fit on load + resize | ✅ | ✅ |
| Zoom controls in header | ✅ | ✅ |
| ViewBox min dimensions | ✅ | ✅ |
| Tooltip on hover | ✅ (messages) | ✅ (transitions) |
| Light mode fixes | ✅ | ✅ |
| 10 color audit fixes | ✅ | ✅ |
| Pan on all SVG elements | ✅ | ✅ |
| Mobile responsive | ✅ | ✅ |

---

## 30. Final Task Board — 79/79 Complete

| Task Group | Done | Total |
|------------|------|-------|
| Pattern Enrichment (LLD-200 to 235) | 36 | 36 |
| Problem Enrichment (LLD-300 to 332) | 33 | 33 |
| Canvas Polish (LLD-400 to 409) | 10 | 10 |
| **TOTAL** | **79** | **79** |

---

## Session Stats

- **90+ commits** across multiple sessions
- **Files created:** `dagre-layout.ts`, `astar-router.ts`, `pattern-enrichment.ts`, `problem-solutions.ts`, `export-diagram.ts`, `PatternComparisonOverlay.tsx`, 3 task JSON files, `LLD_CANVAS_PLAYBOOK.md`
- **Files modified:** 30+ files across canvas, panels, hooks, sidebar, constants, globals, seeds
- **Libraries added:** `@dagrejs/dagre`, `prism-react-renderer`
- **Content added:** ~50,000+ lines of enrichment (reference solutions, walkthroughs, interview scripts, code samples, complexity analysis)
- **Diagrams upgraded:** 79 (36 patterns + 33 problems + 10 SOLID demos)
- **Code-diagram alignment:** 30 patterns × 3 languages = 90 code sample rewrites
- **All 79 LLD tasks completed** (36 pattern + 33 problem + 10 canvas polish)
- **Parallel agents used:** 40+ agents across all sessions
- **Design system:** 10 color audit fixes applied across all 3 canvases
