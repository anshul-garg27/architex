# Playwright Deep Audit — Algorithm Visualizer
**Date**: 2026-04-13 | **Method**: Automated browser testing via Playwright MCP

---

## WORKING CORRECTLY

### Phase 1-4 Features Verified:
- [x] **Bar chart visualization** — bars render with correct heights, colors, and state indicators
- [x] **Dot plot visualization** — scatter plot renders, dots converge toward diagonal during sort
- [x] **Color map visualization** — rainbow gradient for sorted portions, noise for unsorted
- [x] **View toggle (Bars/Dots/Map)** — switches views correctly, labels visible
- [x] **Live Dashboard** — complexity gauge, odometer counter, memory bar all render during playback
- [x] **Timeline scrubber** — floating transport bar at bottom, shows progress, milestone markers
- [x] **Live Execution Trace** — properties panel transforms during playback, pseudocode highlights active line
- [x] **Sort celebration** — "Sorted!" banner appears on completion (verified with wait_for)
- [x] **Danger detection** — gauge enters red zone on Quick Sort worst case
- [x] **AlgorithmWelcome** — unified empty state with engaging questions per category ("How does Google Maps find the shortest path?")
- [x] **Graph visualizer** — BFS renders nodes/edges, visited nodes glow green, step-by-step animation
- [x] **Toolbar overflow** — 3 visible buttons + overflow menu (verified from screenshot)
- [x] **Bottom panel cleanup** — 4 tabs visible (Step Log, System Context, Code, Flashcards)
- [x] **arraySnapshot fix** — Merge Sort bars physically rearrange during execution
- [x] **Context-aware sidebar** — Graph algo shows Graph Data controls, no sorting controls visible
- [x] **Algorithm search** — combobox filters algorithms by typed text

### Algorithms Tested:
| Algorithm | Visualization | Bars Move | Celebration | Notes |
|-----------|--------------|-----------|-------------|-------|
| Bubble Sort | Bar chart | Yes | Yes | All features working |
| Bubble Sort | Dot plot | Yes | — | Dots converge toward diagonal |
| Bubble Sort | Color map | Yes | — | Rainbow gradient forming |
| Quick Sort (worst case) | Bar chart | Yes | Yes | Gauge in red zone, 229 steps |
| Merge Sort | Bar chart | Yes | — | arraySnapshot working! |
| BFS | Graph | Yes (nodes) | Yes | "Sorted!" banner on completion |

---

## BUGS FOUND AND FIXED

### Bug 1: DotPlot SVG undefined cx/cy (FIXED)
**Symptom**: 30+ console errors: `<circle> attribute cx: Expected length, "undefined"`
**Cause**: `motion.circle` had `cx` and `cy` in `animate` but not in `initial`. Motion animated from `undefined` to the computed value.
**Fix**: Added `cx, cy` to the `initial` prop in DotPlotVisualizer.tsx.
**File**: `src/components/canvas/overlays/DotPlotVisualizer.tsx`

### Bug 2: LiveDashboard gauge needle undefined x2/y2 (FIXED)
**Symptom**: Console errors: `<line> attribute x2: Expected length, "undefined"`
**Cause**: `motion.line` for the gauge needle had `x2/y2` only in `animate`, no `initial`.
**Fix**: Added `initial={{ x2: needleEnd.x, y2: needleEnd.y }}` to the motion.line.
**File**: `src/components/canvas/overlays/LiveDashboard.tsx`

### Bug 3: GraphVisualizer invalid color concatenation (FIXED)
**Symptom**: 12+ console warnings: `'var(--state-active, #3b82f6)20' is not an animatable color`
**Cause**: `nodeColor + '20'` appends alpha hex to a CSS variable string, producing invalid color.
**Fix**: Replaced with `'rgba(59,130,246,0.12)'` — a proper RGBA value.
**File**: `src/components/canvas/overlays/GraphVisualizer.tsx`

---

## REMAINING ISSUES (Not Fixed Yet)

### UI/UX Issues:
1. **Celebration says "Sorted!" for non-sorting algorithms** — BFS completion shows "Breadth-First Search — Sorted!" which is semantically wrong. Should say "Complete!" for graph/tree/DP algorithms.
2. **Celebration banner auto-dismisses in 4s** — might be too fast for users to read the stats. Consider 6s or click-to-dismiss only.
3. **Daily Challenge banner still shows Bubble Sort text** even when a graph algorithm is selected — it's hardcoded.
4. **Speed pills in sidebar** — visible but need verification that speed actually changes playback rate.
5. **Keyboard shortcuts (?, Space, arrows)** — not tested via Playwright. Need manual verification.
6. **Sound toggle** — visible but no way to verify audio plays via Playwright.

### Visual Polish Issues:
7. **Sidebar description text too long** — the full algorithm description takes up significant sidebar space, pushing controls below the fold.
8. **No loading skeleton** when switching between algorithms — instant content swap can feel jarring.
9. **Properties panel "Show Algorithm Info" toggle** in live mode — need to verify it actually expands/collapses.
10. **Comparison/Race mode** — not tested yet. Need separate test run.

### Console Issues:
11. **0 errors after fixes** (down from 33+ errors before)
12. **0 warnings after GraphVisualizer color fix** (down from 12 warnings before)

---

## SCREENSHOTS CAPTURED

| # | File | What it shows |
|---|------|---------------|
| 1 | audit-01-homepage.png | Architex homepage with onboarding |
| 2 | audit-02-algo-default.png | Algorithm module first load |
| 3 | audit-03-algo-clean.png | Algorithm module clean state |
| 4 | audit-04-algo-running.png | Bubble Sort running with live dashboard |
| 5 | audit-05-dot-plot.png | Dot plot view mid-sort |
| 6 | audit-06-colormap.png | Color map view — partial rainbow |
| 7 | audit-07-quicksort-worstcase.png | Quick Sort worst case starting |
| 8 | audit-08-danger-overlay.png | Quick Sort danger — gauge in red |
| 9 | audit-09-combobox-open.png | Combobox search open |
| 10 | audit-10-celebration.png | Quick Sort completion |
| 11 | audit-11-combobox-merge.png | Searching "Merge" in combobox |
| 12 | audit-12-mergesort-running.png | Merge Sort running — bars moving |
| 13 | audit-13-mergesort-mid.png | Merge Sort mid-execution |
| 14 | audit-14-bfs-search.png | Searching BFS |
| 15 | audit-15-bfs-dropdown.png | BFS in dropdown |
| 16 | audit-16-bfs-selected.png | BFS selected — welcome screen |
| 17 | audit-17-bfs-running.png | BFS graph visualization complete |
