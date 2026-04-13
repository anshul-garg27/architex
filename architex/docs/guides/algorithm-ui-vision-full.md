# Algorithm Visualizer -- Complete UI Vision Document

> **Status**: Production Design Spec  
> **Module**: Algorithm Visualizer (`src/components/modules/AlgorithmModule.tsx`)  
> **Date**: 2026-04-13  
> **Prerequisite Reading**: `algorithm-ui-vision-2026.md`, `ui-visual-style-guide.md`

This document is not a wish list. Every section contains exact CSS values, component
names, animation parameters, and file references. It acknowledges the significant
work already delivered in Phases 1-4, diagnoses what remains broken, and specifies
the next evolution.

---

## 1. ROAST THE CURRENT UI

### 1.1 Sidebar Panel (AlgorithmPanel.tsx -- 2000+ lines)

```
CURRENT PROBLEM: The sidebar is a monolithic god-component with 50+ state variables.
WHY IT'S BAD: Every algorithm category (sorting, graph, tree, DP, string,
  backtracking, geometry, search, greedy, patterns, design, probabilistic, AI/ML)
  dumps its own input controls into a single scrolling panel. A user selecting
  "Convex Hull" sees array size sliders and sort presets that do not apply.
  The category-specific controls are conditionally rendered but never spatially
  separated -- the panel is one long vertical scroll.
EVIDENCE: AlgorithmPanel.tsx:462-530 -- 50+ useState declarations in a single component.
```

```
CURRENT PROBLEM: The algorithm selector dropdown re-implements a custom combobox
  from scratch with manual click-outside handling and filtered arrays.
WHY IT'S BAD: It does not support keyboard arrow navigation, has no typeahead
  highlighting of matched characters, and closes on scroll. The 13 category headers
  create a wall of text. A user looking for "Dijkstra" must scroll past 18 sorting
  algorithms, 2 search algorithms, and 2 greedy algorithms to find it.
EVIDENCE: AlgorithmPanel.tsx:558-564 -- filteredAlgorithms computed from
  ALGORITHM_CATEGORIES, rendered as flat list with category headers.
```

```
CURRENT PROBLEM: Playback controls (Play/Pause, Step, Stop, Speed) are buried
  inside the sidebar scroll, below the input section.
WHY IT'S BAD: The most-used controls require scrolling past configuration to reach.
  Playback is a TRANSPORT concern -- it belongs adjacent to the visualization,
  not hidden in a settings panel. VLC does not put the pause button in the
  preferences menu.
EVIDENCE: AlgorithmPanel.tsx -- Play/Pause/Stop buttons rendered after input
  configuration section, sharing vertical space with category-specific inputs.
```

```
CURRENT PROBLEM: The comparison mode toggle and comparison algorithm selector
  are crammed into the same sidebar scroll as primary algorithm controls.
WHY IT'S BAD: Comparison is a MODE, not a setting. It changes the entire canvas
  layout (side-by-side split). Hiding it in a sidebar toggle minimizes its
  significance and makes it easy to miss.
EVIDENCE: AlgorithmPanel.tsx:503-504 -- comparisonMode and comparisonAlgoId
  as simple state variables, rendered as a toggle button.
```

### 1.2 Canvas Area (AlgorithmCanvas.tsx)

```
CURRENT PROBLEM: Seven visualization types share one component through a chain of
  if/else-if branches, each rendering completely different JSX.
WHY IT'S BAD: This is a multiplexer, not a component. Each branch wraps its
  visualizer in an identical "flex h-full w-full flex-col items-center justify-center
  bg-background p-8" container with a "w-full max-w-4xl" inner div. The repetition
  is mechanical, and the hardcoded max-widths prevent visualizations from using
  available horizontal space on wide monitors.
EVIDENCE: AlgorithmCanvas.tsx:164-256 -- six sequential if-blocks with identical
  container markup. The sorting path at line 351 adds yet another variant.
```

```
CURRENT PROBLEM: Empty states are repetitive walls of nearly identical markup --
  each visualization type has its own empty state block (8 total) with an icon,
  title, description, and demo button.
WHY IT'S BAD: 130 lines of JSX (AlgorithmCanvas.tsx:432-562) that differ only
  in icon choice, title string, and demo handler parameter. This is a failure
  of abstraction that makes the empty state feel generic rather than inviting.
EVIDENCE: AlgorithmCanvas.tsx:432-562 -- eight near-identical empty state blocks.
```

```
CURRENT PROBLEM: The Phase 2 view toggle (bar/dot/colormap) is available only
  for sorting visualizations, positioned inside the canvas with a small floating
  button group.
WHY IT'S BAD: The toggle has no labels -- just icons. A first-time user does not
  know what the three dots mean. The colormap view squashes to 120px height
  (AlgorithmCanvas.tsx:381) while bar view gets 400px, making them feel like
  different features rather than alternate views of the same data.
EVIDENCE: AlgorithmCanvas.tsx:363-393 -- ViewToggle and conditional rendering.
  ColorMapVisualizer hardcoded to height={120}.
```

### 1.3 Properties Panel (AlgorithmProperties.tsx)

```
CURRENT PROBLEM: The right panel is a passive reference card that displays static
  algorithm metadata (complexity, stability, prerequisites, tips) regardless of
  what is happening in the visualization.
WHY IT'S BAD: During playback, the properties panel is dead weight. It shows the
  same complexity table whether the user is on step 1 or step 500. The complexity
  comparison chart (lines 66-155) only renders for sorting algorithms and requires
  a completed run. For the 60+ non-sorting algorithms, the panel is just text.
EVIDENCE: AlgorithmProperties.tsx:170-400 -- Static rendering with no step-reactive
  content beyond the comparison chart.
```

```
CURRENT PROBLEM: The mastery stars (AlgorithmProperties.tsx:201-214) auto-increment
  to 1 on first run and have no path to 2-5.
WHY IT'S BAD: The stars promise a progression system that does not exist. A user
  who runs Bubble Sort once and Quick Sort once both see 1/5 stars with no way
  to advance. This is worse than no stars -- it sets an expectation then abandons it.
EVIDENCE: AlgorithmModule.tsx:779-786 -- mastery increments to 1 on first run,
  never higher. No challenge or quiz completion feeds into mastery.
```

### 1.4 Bottom Panel (AlgorithmBottomPanel.tsx)

```
CURRENT PROBLEM: Seven tabs (Step Details, Latency Bridge, System Context,
  Flashcards, Code, Code Lab, Leaderboard) compete for a fixed-height bottom
  panel.
WHY IT'S BAD: The panel is a dumping ground. "Leaderboard" says "Coming soon"
  (line 708-715). "Code Lab" uses eval-style execution with alert() for output
  (lines 689-699). "Step Details" shows a single text description. These tabs have
  wildly different maturity levels, and the tab bar itself takes up vertical space
  that the step description needs.
EVIDENCE: AlgorithmBottomPanel.tsx:523-533 -- ALGO_BOTTOM_TABS array. Lines 708-715
  for the placeholder leaderboard. Lines 689-699 for the alert-based code execution.
```

```
CURRENT PROBLEM: The step details view shows only a text description and four
  counters (comparisons, swaps, reads, writes) in a horizontal row.
WHY IT'S BAD: No visual connection to the canvas. The description says "Compare
  arr[2] with arr[3]" but there is no visual link showing WHICH bars those are.
  The counters are not animated -- they jump to new values. The pseudocode line
  reference (line 598) is a bare number with no context.
EVIDENCE: AlgorithmBottomPanel.tsx:591-654 -- Step details rendering.
```

### 1.5 Toolbar (AlgorithmModule.tsx:1098-1192)

```
CURRENT PROBLEM: Eight floating buttons (Vars, Code, Fullscreen, Share, Print,
  Screenshot, Record, Sound) cluster in the top-right corner of the canvas.
WHY IT'S BAD: Eight identical-looking circular buttons with only icon differentiation
  form an inscrutable toolbar. The user must hover each to discover its purpose
  via tooltip. The toolbar is always visible, obscuring the visualization corner
  even when none of these actions are relevant (e.g., before running anything).
EVIDENCE: AlgorithmModule.tsx:1098-1192 -- eight buttons with identical styling.
```

### 1.6 Animation System

```
CURRENT PROBLEM: Phase 1 delivered 10 algorithm spring personalities and 6 sounds,
  but these only apply to sorting bar animations. Graph, tree, DP, string,
  backtracking, and geometry visualizers have no choreography integration.
WHY IT'S BAD: The bar visualizer feels alive. Every other visualizer feels like
  a static diagram with color changes. The quality gap between sorting and
  everything else undermines the platform's credibility.
EVIDENCE: ArrayVisualizer.tsx:94-97 -- getChoreography used only here.
  GraphVisualizer, TreeVisualizer, DPVisualizer -- no choreography import.
```

---

## 2. DESIGN PHILOSOPHY (5 Principles)

```
PRINCIPLE 1: "The Algorithm Teaches Itself"
What it means: Every visual choice -- spacing, color, motion, sound -- must encode
  algorithmic meaning. Nothing decorative. If a bar bounces, the bounce communicates
  something about the operation.
How it manifests: Bubble Sort bars slide reluctantly past each other (slow spring,
  overlapping paths). Quick Sort partitions slam into position (stiff spring, no
  overshoot). The visual IS the explanation.
Anti-pattern: Using the same spring constant for all algorithms. Using color alone
  to distinguish states. Adding animations that look cool but communicate nothing.
```

```
PRINCIPLE 2: "Progressive Disclosure Through Interaction"
What it means: Show only what is needed for the current task. The empty canvas shows
  one CTA. Running an algorithm reveals transport controls. Hovering the edge reveals
  property panels. Complexity grows with engagement, never before.
How it manifests: First visit = single "Pick an algorithm" prompt + auto-playing
  demo. Sidebar collapsed to algorithm picker only. Properties panel hidden until
  user clicks an element. Bottom panel hidden until playback starts.
Anti-pattern: Showing 7 bottom panel tabs before any algorithm has run. Showing
  the toolbar before any visualization exists. Showing all 13 categories expanded.
```

```
PRINCIPLE 3: "Canvas is King"
What it means: The visualization occupies maximum possible screen area. All chrome
  is collapsible, semi-transparent, and subordinate. A 1440px-wide screen should
  give at least 1000px to the visualization at rest.
How it manifests: Sidebar is 280px max, collapsible to 48px icon strip. Properties
  panel auto-hides when not actively reading. Bottom panel is 0px by default,
  expandable on demand. Toolbar fades to 50% opacity after 3 seconds of inactivity.
Anti-pattern: Fixed 320px sidebar + 280px properties + 180px bottom panel leaving
  only ~660px x ~400px for the actual visualization.
```

```
PRINCIPLE 4: "Every Frame is Shareable"
What it means: At any point during playback, the visualization should look good
  enough to screenshot and share. This means clean typography, balanced color
  palette, no layout jank, and contextual labels that explain the current state
  without requiring knowledge of the controls.
How it manifests: An overlay watermark at bottom-left shows "Bubble Sort -- Step
  42/120 -- Architex" in subtle 10px text. The celebration frame has social-ready
  composition. Export produces a clean image without UI chrome.
Anti-pattern: Showing browser scrollbars in screenshots. Visible tooltip artifacts.
  Half-rendered animation frames. Bare canvas with no context about what algorithm
  is running.
```

```
PRINCIPLE 5: "Keyboard-First, Mouse-Enhanced"
What it means: Every action is reachable without a mouse. The keyboard is not an
  accessibility afterthought -- it is the primary interface for power users.
  Modifier keys unlock expert features.
How it manifests: Space = play/pause. Arrow keys = step. Number keys = speed.
  / = open algorithm search. Cmd+K = command palette. Tab cycles through
  visualization elements during step-through.
Anti-pattern: Click-only interactions. Drag-only reordering. Hover-only reveals
  with no keyboard equivalent. Focus traps in modal overlays.
```

---

## 3. REIMAGINE EVERY VIEW

### 3.1 Sidebar -- "The Algorithm Cockpit"

**Current**: 2000-line monolithic panel with 50+ state variables.  
**Target**: Three-section collapsible sidebar with clear responsibility boundaries.

```
+--------- 280px (max) ----------+
|  [Search algorithms...]    [<] |   <- Collapsible header with search
|--------------------------------|
|  ALGORITHM PICKER              |
|  +---------------------------+ |
|  | > Sorting (18)          v | |   <- Collapsible category accordion
|  |   Bubble Sort     *****  | |   <- Mastery stars inline
|  |   Quick Sort      ***..  | |
|  |   ...                    | |
|  | > Graph (18)            v | |
|  | > Tree (11)             v | |
|  +---------------------------+ |
|--------------------------------|
|  CONFIGURATION                 |   <- Context-sensitive to selected algo
|  Array Size: [====o====] 20   |
|  Preset: [Random] [Reverse]   |
|  Input: [5, 3, 8, 1, 9_____] |
|--------------------------------|
|  MODES                         |
|  [Compare] [Predict] [Worst]  |   <- Toggle chips
|  Compare vs: [Quick Sort   v] |   <- Only if Compare active
|--------------------------------|
|  [ Generate ]  [ >> RUN << ]  |   <- Primary actions always visible
+--------------------------------+
```

**Specifications**:
- Width: `280px` expanded, `48px` collapsed (icon-only rail)
- Collapse trigger: chevron button in header OR `Cmd+B`
- Algorithm picker: accordion with lazy-rendered category contents
- Category headers: sticky within scroll container
- Search: `Cmd+/` or click search bar, uses `cmdk`-style fuzzy matching
- Active algorithm: highlighted with `border-l-2 border-primary bg-primary/5`
- Mastery stars: 5 dots instead of stars (smaller footprint), filled = completed challenges
- Configuration section: morphs per visualization type (array controls for sorting, node/edge inputs for graph, etc.)
- Mode toggles: pill chips, max one active at a time for Compare/Predict/Worst-case
- Run button: `bg-primary text-white rounded-xl h-10 w-full font-semibold shadow-[0_0_20px_rgba(110,86,207,0.3)]`
- Generate button: secondary style, half-width, left-aligned

**Empty state** (no algorithm selected):
```
+--------------------------------+
|         [magnifier icon]       |
|    Search 80+ algorithms       |
|    or pick a category below    |
|                                |
|    [Sorting]  [Graph]  [Tree]  |   <- Quick-access pills
|    [DP]  [String]  [More...]   |
+--------------------------------+
```

### 3.2 Canvas Area -- "The Stage"

**Current**: Flat `bg-background` with centered max-width container.  
**Target**: Full-bleed stage with depth, lighting, and contextual overlays.

```
+================================================================+
|  [Bubble Sort]  Step 42/120  Comparisons: 87  Swaps: 31       |  <- Context bar (top, 32px)
|================================================================|
|                                                                 |
|          [spotlight gradient centered on active bars]           |
|                                                                 |
|     |  |  |##|  |##|  |  |  |  |  |  |  |  |  |  |  |  |     |
|     |  |  |##|  |##|  |  |  |  |  |  |  |  |  |  |  |  |     |
|     |  |  |##|  |##|  |  |  |  |  |  |  |  |  |  |  |  |     |
|     |  |  |##|  |##|  |  |  |  |  |  |  |  |  |  |  |  |     |
|     |  |  |##|  |##|  |  |  |  |  |  |  |  |  |  |  |  |     |
|     |  ||||##|  |##||||  |  |  |  |  |  |  |  ||||  ||||     |
|     ||||||||##||||##||||||  |  ||||  ||||||||  ||||  ||||     |
|     ||||||||##||||##||||||||||||||||||||||||||||||||||||||||     |
|                                                                 |
|            [bar]  [dot]  [color]       [legend pills]          |
|                                                                 |
+================================================================+
|  [<<] [<] [ |> PLAY ] [>] [>>]  Speed: [1x] [2x] [4x]       |  <- Transport bar (bottom, 48px)
|  [============================o==============================] |  <- Timeline scrubber
+================================================================+
```

**Specifications**:
- Stage background: `radial-gradient(ellipse at 50% 40%, var(--elevated) 0%, var(--background) 60%, hsl(240 15% 5%) 100%)`
- Context bar: `h-8 px-4 flex items-center justify-between bg-background/60 backdrop-blur-sm border-b border-border/20`
  - Left: algorithm name badge + step counter
  - Right: comparison/swap counters as animated odometers
  - Hidden when no algorithm is running
- Transport bar: `h-12 px-4 flex items-center bg-background/60 backdrop-blur-sm border-t border-border/20`
  - Play button: `h-10 w-10 rounded-full bg-primary shadow-[0_0_20px_rgba(110,86,207,0.4)]`
  - Step buttons: `h-8 w-8 rounded-full bg-elevated/50 border border-border/30`
  - Speed selector: pill group `[0.5x] [1x] [2x] [4x]`
  - Timeline scrubber: full-width, milestone markers as small dots, `h-1 bg-border/30` track with `bg-primary` fill and `h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(110,86,207,0.5)]` thumb
  - Hidden when no result exists; appears with `translate-y` animation
- Visualization container: no `max-w-*` constraint; fills available width with `px-8` padding
  - Bar chart max bar width: `48px` (current), min: `2px` for large arrays
  - Graph/tree: use full width, center via SVG viewBox
- View toggle (bar/dot/color): relocated to context bar, labeled text buttons instead of icons
- Legend: `absolute bottom-2 right-3 rounded-lg bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/20`

**Empty state** (redesigned):
```
+================================================================+
|                                                                 |
|                     [animated demo loop]                       |
|                                                                 |
|            A gentle auto-playing Merge Sort on 8               |
|            elements loops silently in the center.              |
|                                                                 |
|                  "Pick an algorithm to begin"                   |
|                    [Explore Algorithms ->]                      |
|                                                                 |
+================================================================+
```
- Auto-playing demo: runs a small Merge Sort at 0.5x speed on repeat with muted colors (`opacity-40`)
- CTA button: opens sidebar algorithm picker with focus
- No per-category empty states; the canvas always shows something

### 3.3 Properties Panel -- "The Living Sidebar"

**Current**: Static reference card.  
**Target**: Context-reactive panel that changes with playback state.

```
+------- 260px (max) -------+
|  ALGORITHM INFO        [x] |   <- Collapsible, auto-hides on mobile
|-----------------------------|
|  Quick Sort                 |
|  ****.  (4/5 mastery)       |
|  "Divide-and-conquer..."    |
|-----------------------------|
|  LIVE STATE                 |   <- NEW: Only visible during playback
|  Pivot: arr[7] = 42        |
|  Partition: [0..4] | [5..9] |
|  Recursion depth: 3        |
|  Stack: [0,9] > [0,4] > [2,4] |
|-----------------------------|
|  COMPLEXITY                 |
|  [animated gauge: O(n lg n)]|   <- Gauge that fills based on step count
|  Best: O(n lg n)            |
|  Worst: O(n^2)              |
|  Current: 87 cmp (n=20)    |   <- Real-time vs theoretical
|-----------------------------|
|  COMPARISON GUIDE           |
|  vs Merge Sort: ...         |
|  vs Heap Sort: ...          |
|-----------------------------|
|  INTERVIEW TIP              |
|  "Always mention median-of- |
|   three pivot selection..." |
+-----------------------------+
```

**Specifications**:
- Width: `260px` expanded, `0px` collapsed (hidden)
- Toggle: `Cmd+I` or click info icon in toolbar
- "Live State" section: extracts variables from current step description using `extractVariables()` (already exists at AlgorithmModule.tsx:162-206), renders as key-value pairs with monospace values
  - Updates on every step with `springs.snappy` transition
  - Background: `bg-primary/5 border border-primary/20 rounded-xl p-2.5`
- Complexity gauge: semicircular arc gauge, needle position mapped to `currentComparisons / theoreticalWorst`
  - Green zone: 0-50% of worst case
  - Amber zone: 50-80%
  - Red zone: 80-100%+
- Mastery: 5 filled/empty circles, clickable to set mastery (manual override), updated automatically when challenges are completed in the bottom panel flashcard quiz

### 3.4 Bottom Panel -- "The Learning Dock"

**Current**: 7-tab fixed panel.  
**Target**: Minimized dock that expands on demand, with 4 focused tabs.

```
+================================================================+
|  [Step Trace] [Pseudocode] [Flashcards] [Code]                |
|================================================================|
|  STEP TRACE (default tab)                                      |
|                                                                 |
|  Step 42: Compare arr[3]=8 with arr[4]=1                       |
|  > 8 > 1, so swap positions                                   |
|                                                                 |
|  [cmp: 87]  [swp: 31]  [reads: 174]  [writes: 62]            |
|  [===================o=================================] 42/120 |  <- Mini timeline
+================================================================+
```

**Specifications**:
- Height: `0px` default (collapsed), `180px` expanded, `320px` maximized
- Toggle: click tab bar OR `Cmd+J`
- Tabs reduced from 7 to 4:
  - **Step Trace**: current step description + counters + mini timeline (merge old "Steps" + "Latency Bridge" inline)
  - **Pseudocode**: syntax-highlighted pseudocode with active line tracking (merge old "Code" panel overlay into here)
  - **Flashcards**: existing quiz + debug challenges + scenario quiz (unchanged)
  - **Code**: Python/TypeScript implementations with syntax highlighting (upgrade from plain `<pre>`)
- Removed tabs: "Latency Bridge" (merged into Step Trace as optional overlay), "System Context" (move to Properties panel), "Code Lab" (move to separate route/modal), "Leaderboard" (premature)
- Tab styling: `text-xs font-semibold uppercase tracking-wider` with gradient underline for active tab
- Content area: `overflow-y-auto px-4 py-2`

### 3.5 Toolbar -- "The Action Ring"

**Current**: 8 floating buttons in top-right corner.  
**Target**: Contextual toolbar that appears on hover/focus with grouped actions.

```
+------ hover top-right ------+
|  [</>]  [|>]  [Share] [...]  |   <- 3 primary + overflow menu
+------------------------------+
         overflow menu:
         [Screenshot]
         [Export Steps]
         [Record GIF]
         [Print]
         [Sound: On/Off]
```

**Specifications**:
- Position: `absolute top-3 right-3 z-10`
- Visible buttons: max 3 (Code toggle, Fullscreen, Share)
- Overflow: `...` button opens a dropdown with remaining actions
- Auto-fade: `opacity: 1` on hover/focus, `opacity: 0.3` after 4 seconds of mouse inactivity over canvas
- Transition: `opacity 0.3s ease-out`
- Dropdown: `rounded-xl border border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl p-1 min-w-[160px]`
- Each dropdown item: `flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-accent`

---

## 4. ANIMATION CHOREOGRAPHY

### 4.1 Selection Actions

| Trigger | Elements | Animation | Duration | Easing | Sound | Feel |
|---------|----------|-----------|----------|--------|-------|------|
| Select algorithm from list | Algorithm list item | `scale: 0.98 -> 1`, `bg-primary/5` fade in | 150ms | `springs.snappy` | Soft click (1200Hz sine, 20ms, vol 0.08) | Decisive |
| Switch category accordion | Old items fade, new items stagger in | Old: `opacity 1->0, y 0->-4`; New: `opacity 0->1, y 4->0` staggered 30ms | 200ms per item | `easing.out` | None | Smooth expansion |
| Hover algorithm item | Item background | `bg-elevated/30` fade in | 100ms | `easing.out` | None | Responsive |
| Focus algorithm search | Search input | border `border-primary/50`, shadow `0 0 0 3px rgba(110,86,207,0.1)` | 150ms | `springs.snappy` | None | Focused |

### 4.2 Operation Actions

| Trigger | Elements | Animation | Duration | Easing | Sound | Feel |
|---------|----------|-----------|----------|--------|-------|------|
| Click Run | Run button pulses, bars appear | Button: `scale 1->0.95->1`; Bars: stagger in from bottom `y: 20->0, opacity 0->1` at 20ms intervals | 400ms total | Button: `springs.bouncy`; Bars: `springs.smooth` | Ascending tone sweep (200-800Hz over 300ms, vol 0.1) | Ignition |
| Click Generate | Old bars dissolve, new bars appear | Old: `opacity 1->0, scale 1->0.9` simultaneous; New: stagger from left `x: -8->0, opacity 0->1` at 15ms intervals | 300ms out + 400ms in | `easing.in` then `easing.out` | Shuffle swoosh (white noise burst 50ms, vol 0.06) | Refresh |
| Click Step Forward | Single step executes | Comparing bars: `glow pulse` 0->8px->0 blue shadow; Swapping bars: cross paths via `x` transform; Sorted bar: `scale 1->1.05->1` + color transition | Per choreography profile (50-200ms) | Per algorithm personality from `algorithm-choreography.ts` | Step tick (sine at mapped pitch, 30ms, vol 0.1) | Precise |
| Click Step Backward | Previous step reverses | Same as forward but reversed easing | Same | Reversed | Descending tick (mapped pitch - 200Hz, 30ms, vol 0.06) | Rewind |
| Speed change | Speed pill selection | Active pill: `scale 0.95->1.05->1`, background fade | 150ms | `springs.snappy` | None | Tactile |

### 4.3 Transition Actions

| Trigger | Elements | Animation | Duration | Easing | Sound | Feel |
|---------|----------|-----------|----------|--------|-------|------|
| Switch visualization type | Entire canvas content | Outgoing: `opacity 1->0, scale 1->0.98`; Incoming: `opacity 0->1, scale 0.98->1` | 200ms out, 250ms in (30ms overlap) | `easing.emphasized` | Subtle whoosh (band-pass filtered noise, 100ms, vol 0.04) | Page turn |
| Enable comparison mode | Canvas splits | `width 100%->50%` with spring physics; divider line draws in from top | 400ms | `springs.smooth` | Glass split sound (two tones diverging, 200ms, vol 0.06) | Division |
| Disable comparison mode | Canvas merges | Right half `opacity 1->0, width 50%->0`; Left half `width 50%->100%` | 300ms | `springs.smooth` | Reverse glass merge (converging tones, 150ms, vol 0.04) | Reunion |
| Sidebar collapse/expand | Sidebar panel | `width 280->48` or reverse, content crossfade | 250ms | `springs.smooth` | None | Spatial |
| Bottom panel expand | Bottom panel | `height 0->180`, content fades in after 100ms delay | 200ms | `easing.out` | None | Reveal |

### 4.4 Celebration Actions

| Trigger | Elements | Animation | Duration | Easing | Sound | Feel |
|---------|----------|-----------|----------|--------|-------|------|
| Sort complete | All bars + overlay | Rainbow gradient sweep left-to-right across bar fills (200ms per bar stagger); Confetti Canvas2D burst; Context bar counter pulses green | 1500ms total | Bars: `easing.out`; Confetti: physics sim | Ascending major arpeggio (C-E-G-C, 80ms per note, vol 0.15) | Triumph |
| Worst-case triggered | Canvas + danger overlay | Screen shake `x: [-2,2,-2,2,0]` 3 cycles; Red vignette `opacity 0->0.3`; Warning badge scales in `bouncy` | 600ms shake + 300ms vignette | Shake: `easing.linear`; Vignette: `easing.out` | Low rumble (60Hz sine with noise, 400ms, vol 0.12) | Dread |
| Race winner declared | Winner side + banner | Winner bars flash gold `3x 200ms`; Loser bars dim to `opacity 0.4`; Trophy icon drops in from top | 800ms | `springs.bouncy` | Victory fanfare (major chord with shimmer, 500ms, vol 0.15) | Competition |
| Mastery level up | Mastery dots in properties | Dot fills with ripple outward; Pulse glow `0 0 12px rgba(250,204,21,0.5)` | 500ms | `springs.bouncy` | Coin collect (1400Hz ping, 100ms, vol 0.1) | Progress |

### 4.5 Error Actions

| Trigger | Elements | Animation | Duration | Easing | Sound | Feel |
|---------|----------|-----------|----------|--------|-------|------|
| Invalid input | Input field | Border flash red `3x`: `border-red-500` -> `border-border` -> repeat | 600ms | `easing.linear` | Error buzz (200Hz square wave, 80ms, vol 0.08) | Rejection |
| Algorithm runner fails | Canvas error boundary | Fade to error state: icon shakes, retry button pulses | 400ms | `easing.out` | Descending tone (800->200Hz, 200ms, vol 0.06) | Gentle failure |
| Predict mode wrong answer | Predict options | Wrong option: `shake x [-4,4,-4,4,0]` + `bg-red-500/20`; Correct option: `bg-green-500/20` reveal | 400ms | `easing.linear` | Wrong buzzer (descending minor third, 150ms, vol 0.08) | Teaching moment |

---

## 5. EMOTIONAL MOMENTS

### Moment 1: "The Reveal" -- O(n^2) vs O(n log n) Race

**Trigger**: User enables comparison mode with Bubble Sort vs Merge Sort on 100 elements and clicks Run.  
**Visual**: Side-by-side visualization. At first they run neck-and-neck. Around step 200, Merge Sort starts pulling ahead. By step 500, Merge Sort finishes with a celebration. Bubble Sort is still churning. The comparison counter diverges exponentially. A ghost line shows the theoretical curve overlaid on the actual comparison count. When Bubble Sort finally finishes (5000+ comparisons vs Merge Sort's ~600), a banner reads: "10x more work for the same result."  
**Sound**: Merge Sort's side plays a triumphant chord. Bubble Sort's side plays a weary sigh (descending tone).  
**Feeling**: The visceral understanding that Big-O notation is not abstract -- it is REAL. The user feels the waste.  
**Why shareable**: The screenshot of one side celebrating while the other is still sorting is immediately compelling. No explanation needed.

### Moment 2: "The Backtrack" -- N-Queens Dead End

**Trigger**: User runs 8-Queens and steps through manually, watching the algorithm place and remove queens.  
**Visual**: When a queen is placed, the threatened diagonals/rows/columns flash as a translucent red overlay on the grid. When the algorithm backtracks, the queen lifts off the board with a `springs.gentle` animation and the red overlay dissolves. The depth counter in the properties panel ticks down. After multiple backtracks, the successful placement gets a green glow and a subtle "lock-in" animation (scale `1->1.1->1` with a satisfying click sound).  
**Sound**: Placement: wooden "thock" (filtered noise burst, 60ms). Backtrack: soft "womp" (descending 300->100Hz, 150ms). Lock-in: crisp "snap" (1600Hz ping, 40ms).  
**Feeling**: The user FEELS the search. Each backtrack is a tiny failure. Each successful placement is a tiny victory. The algorithm's struggle becomes personal.  
**Why shareable**: The grid with queens, red threat overlays, and the depth counter tells a complete visual story.

### Moment 3: "The Sort is Music" -- Completed Sort with Sound On

**Trigger**: User runs any sorting algorithm with sound enabled on 30+ elements.  
**Visual**: During the sort, each comparison tick is pitched to the bar value (low bars = low pitch, high bars = high pitch). As more bars become sorted (green), the comparison sounds start forming ascending melodic fragments because the sorted section produces ascending pitches. When the final bar locks in, ALL bars rapidly play their pitches from left to right in 800ms, creating a complete ascending scale. Rainbow gradient sweeps across. Confetti bursts.  
**Sound**: The ascending scale at completion is the payoff. It sounds like a harp glissando -- each bar's pitch played in sequence from lowest to highest, because the array is now sorted.  
**Feeling**: The sort was building toward music the entire time. The chaos of random comparisons resolves into harmony. The sound IS the proof of correctness.  
**Why shareable**: Screen-record with audio enabled. The sound of a completed sort is uniquely satisfying and unlike anything competitors offer.

### Moment 4: "First Algorithm" -- Onboarding Flow

**Trigger**: First visit to the Algorithm module.  
**Visual**: Instead of a tour overlay with text boxes, the canvas auto-plays a tiny Bubble Sort demo on 5 colored elements at 0.25x speed. Minimal UI -- just the bars moving. After the demo completes (5 seconds), a single prompt appears: "That was Bubble Sort. Want to try it yourself?" with two buttons: [Try Bubble Sort] and [Explore All]. Clicking "Try" pre-fills 5 random elements and opens the sidebar. The tour highlights are contextual -- they appear only when the user reaches each control for the first time.  
**Sound**: Gentle ambient pad (C major drone, 3dB, fades in over 2 seconds, fades out when user interacts).  
**Feeling**: No wall of text. No tour steps to click through. The product teaches by demonstration, then invites participation.  
**Why shareable**: The clean onboarding experience itself is noteworthy. "This app just showed me what Bubble Sort does in 5 seconds with zero text."

### Moment 5: "The Dijkstra Wave" -- Shortest Path Discovery

**Trigger**: User runs Dijkstra on a sample graph.  
**Visual**: The source node pulses with a bright `primary` glow. The "frontier" expands as a visible wavefront -- a semi-transparent circle (CSS `radial-gradient`) centered on the source that grows outward. Nodes within the frontier shimmer (subtle opacity oscillation). When a node is settled (final distance found), it solidifies: the shimmer stops, the node gains a `drop-shadow` with its distance label permanently visible. Edges on the shortest path glow brighter than non-path edges. The final path draws itself in as a thick animated stroke from source to all reachable nodes.  
**Sound**: Each frontier expansion: gentle "ping" at pitch proportional to distance from source (closer = higher). Settlement: satisfying "lock" (1000Hz click, 50ms). Path reveal: ascending glissando along the path.  
**Feeling**: Dijkstra is water. The algorithm flows outward, filling the graph like liquid. The user sees WHY greedy works -- the nearest unsettled node is always the next to solidify.  
**Why shareable**: The wavefront visualization on a complex graph is visually stunning and immediately communicates the algorithm's behavior.

---

## 6. RESPONSIVE & ACCESSIBILITY

### 6.1 Breakpoints

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop XL | >= 1440px | Sidebar 280px + Canvas flex + Properties 260px + Bottom 180px |
| Desktop | >= 1024px | Sidebar 260px + Canvas flex + Properties collapsed by default |
| Tablet | >= 768px | Sidebar as slide-over drawer + Canvas full + Bottom as sheet |
| Mobile | < 768px | Full-screen canvas + bottom sheet for controls + FAB for algorithm picker |

### 6.2 Mobile Adaptations

- **Algorithm picker**: Full-screen modal with search, grouped categories, large touch targets (min `44px` height)
- **Transport controls**: Fixed bottom bar, `h-14`, large buttons (`h-12 w-12`)
- **Properties**: Swipe-up bottom sheet, peek height `48px` showing algorithm name
- **Visualization**: Full-bleed, no padding, landscape mode prompt for complex visualizations
- **Gestures**: Pinch-to-zoom on graph/tree visualizations, swipe-left/right for step forward/backward

### 6.3 Screen Reader Support

- Canvas visualization: `role="img"` with dynamic `aria-label` that updates per step:
  `"Bubble Sort visualization. Step 42 of 120. Comparing element at index 3 (value 8) with element at index 4 (value 1). 87 comparisons, 31 swaps so far."`
- Step description: `aria-live="polite"` region that announces each step change
- Algorithm list: `role="listbox"` with `aria-selected`, `aria-label` per item including category
- Transport controls: `aria-label` on every button, `aria-pressed` for play/pause toggle
- Timeline scrubber: `role="slider"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="Step 42 of 120"`
- Speed selector: `role="radiogroup"` with `aria-label="Playback speed"`
- Comparison mode: `aria-expanded` on toggle, `aria-describedby` pointing to comparison region

### 6.4 Keyboard Navigation

| Key | Action | Context |
|-----|--------|---------|
| `Space` | Play / Pause | Global (not in input) |
| `ArrowRight` | Step forward | Global |
| `ArrowLeft` | Step backward | Global |
| `Home` | Jump to first step | Global |
| `End` | Jump to last step | Global |
| `1-5` | Set speed (0.25x, 0.5x, 1x, 2x, 4x) | Global |
| `/` | Focus algorithm search | Global |
| `Cmd+B` | Toggle sidebar | Global |
| `Cmd+I` | Toggle properties panel | Global |
| `Cmd+J` | Toggle bottom panel | Global |
| `Cmd+Enter` | Run algorithm | Global |
| `Cmd+Shift+C` | Toggle comparison mode | Global |
| `Escape` | Close active panel / exit fullscreen | Global |
| `Tab` | Cycle through interactive elements | Standard |
| `Shift+Tab` | Reverse cycle | Standard |

### 6.5 Reduced Motion

When `prefers-reduced-motion: reduce` is active:
- All spring animations replaced with `duration: 0` (instant snap)
- Confetti celebration replaced with static "Sorted!" banner
- Bar swap animations become instant position changes
- Spotlight disabled (uniform lighting)
- Danger shake disabled, replaced with static red border
- Sound disabled by default (user can re-enable)
- Timeline scrubber moves without animation
- Implementation: Every motion component already checks `useReducedMotion()` from `motion/react` (see ArrayVisualizer.tsx:82). Extend this pattern to all new animations.

### 6.6 ARIA Landmarks

```html
<main role="main" aria-label="Algorithm Visualizer">
  <nav role="navigation" aria-label="Algorithm selection sidebar">
    <!-- Sidebar content -->
  </nav>
  <section role="region" aria-label="Algorithm visualization canvas">
    <!-- Canvas + transport -->
  </section>
  <aside role="complementary" aria-label="Algorithm properties">
    <!-- Properties panel -->
  </aside>
  <section role="region" aria-label="Step details and learning tools">
    <!-- Bottom panel -->
  </section>
</main>
```

---

## 7. COLOR & TYPOGRAPHY SPEC

### 7.1 CSS Custom Properties

```css
/* Visualization state colors (already defined in visualization-colors.ts) */
--viz-default: hsl(240 5% 34%);
--viz-comparing: hsl(217 91% 60%);     /* blue-500 */
--viz-swapping: hsl(0 84% 60%);        /* red-500 */
--viz-sorted: hsl(142 71% 45%);        /* green-500 */
--viz-pivot: hsl(271 81% 56%);         /* purple-500 */
--viz-active: hsl(43 96% 56%);         /* amber-500 */
--viz-found: hsl(187 86% 53%);         /* cyan-500 */

/* Stage lighting */
--stage-spotlight: rgba(110, 86, 207, 0.12);
--stage-vignette: rgba(0, 0, 0, 0.6);
--stage-bg-center: var(--elevated);
--stage-bg-edge: hsl(240 15% 5%);

/* Transport bar */
--transport-bg: hsla(var(--background-hsl) / 0.6);
--transport-border: hsla(var(--border-hsl) / 0.2);

/* Context bar */
--context-bg: hsla(var(--background-hsl) / 0.6);
--context-text: var(--foreground-muted);

/* Danger state */
--danger-vignette: hsla(0 84% 40% / 0.25);
--danger-shake-distance: 2px;
--danger-pulse-color: hsl(0 84% 60%);

/* Celebration */
--celebration-rainbow-start: hsl(0 84% 60%);
--celebration-rainbow-end: hsl(271 81% 56%);
--celebration-gold: hsl(43 96% 56%);
```

### 7.2 Font Scale

```css
/* Algorithm module typography scale */
--font-xs: 0.625rem;    /* 10px -- labels, badges, sparse indices */
--font-sm: 0.75rem;     /* 12px -- descriptions, secondary text */
--font-base: 0.875rem;  /* 14px -- primary text, step descriptions */
--font-lg: 1rem;        /* 16px -- algorithm name, section headers */
--font-xl: 1.25rem;     /* 20px -- canvas empty state title */
--font-2xl: 1.5rem;     /* 24px -- celebration banner */

/* Monospace scale (for code, counters, complexity notation) */
--font-mono-xs: 0.625rem;
--font-mono-sm: 0.6875rem;  /* 11px -- pseudocode lines */
--font-mono-base: 0.75rem;  /* 12px -- counters, complexity */
```

### 7.3 Spacing Scale

```css
/* Consistent spacing tokens used throughout the algorithm module */
--space-0: 0;
--space-0.5: 0.125rem;  /* 2px */
--space-1: 0.25rem;     /* 4px */
--space-1.5: 0.375rem;  /* 6px */
--space-2: 0.5rem;      /* 8px */
--space-2.5: 0.625rem;  /* 10px */
--space-3: 0.75rem;     /* 12px */
--space-4: 1rem;        /* 16px */
--space-5: 1.25rem;     /* 20px */
--space-6: 1.5rem;      /* 24px */
--space-8: 2rem;        /* 32px */
```

### 7.4 Border Radius

```css
--radius-sm: 0.375rem;  /* 6px -- small elements, badges */
--radius-md: 0.5rem;    /* 8px -- buttons, inputs */
--radius-lg: 0.75rem;   /* 12px -- cards, panels */
--radius-xl: 1rem;      /* 16px -- containers, modals */
--radius-full: 9999px;  /* pills, circular buttons */
```

### 7.5 Shadow Scale

```css
/* Algorithm module shadow tokens */
--shadow-sm: 0 1px 2px hsla(0 0% 0% / 0.05);
--shadow-md: 0 4px 6px hsla(0 0% 0% / 0.07), 0 2px 4px hsla(0 0% 0% / 0.06);
--shadow-lg: 0 10px 15px hsla(0 0% 0% / 0.1), 0 4px 6px hsla(0 0% 0% / 0.05);
--shadow-glow-primary: 0 0 20px rgba(110, 86, 207, 0.4);
--shadow-glow-danger: 0 0 20px rgba(239, 68, 68, 0.3);
--shadow-glow-success: 0 0 20px rgba(34, 197, 94, 0.3);
--shadow-glow-gold: 0 0 20px rgba(250, 204, 21, 0.3);
```

---

## 8. IMPLEMENTATION TASKS

### Phase A: Layout Foundation

```json
[
  {
    "id": "ALG-UI-001",
    "title": "Extract AlgorithmPanel into AlgorithmSidebar with 3 sections",
    "description": "Split the 2000-line AlgorithmPanel into three sub-components: AlgorithmPicker (accordion + search), AlgorithmConfig (context-sensitive inputs), AlgorithmActions (mode toggles + run/generate). Each section is a collapsible region.",
    "files": ["src/components/canvas/panels/AlgorithmPanel.tsx", "src/components/modules/algorithm/AlgorithmPicker.tsx", "src/components/modules/algorithm/AlgorithmConfig.tsx", "src/components/modules/algorithm/AlgorithmActions.tsx"],
    "estimate": "8h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-002",
    "title": "Replace custom dropdown with cmdk-style algorithm combobox",
    "description": "Replace the manual combobox (lines 558-564) with a keyboard-navigable, fuzzy-searching algorithm picker using cmdk or Radix Combobox. Support arrow keys, typeahead highlighting, category grouping, and recent algorithms section.",
    "files": ["src/components/modules/algorithm/AlgorithmPicker.tsx"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-001"]
  },
  {
    "id": "ALG-UI-003",
    "title": "Create TransportBar component for playback controls",
    "description": "Extract playback controls from sidebar into a dedicated TransportBar that renders at the bottom of the canvas area. Includes play/pause, step forward/back, stop, speed selector, and timeline scrubber with milestone markers.",
    "files": ["src/components/modules/algorithm/TransportBar.tsx", "src/components/modules/AlgorithmModule.tsx"],
    "estimate": "6h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-004",
    "title": "Create ContextBar component for canvas status display",
    "description": "Add a semi-transparent status bar at the top of the canvas showing algorithm name, step counter, and animated comparison/swap counters. Auto-hides when no algorithm is running.",
    "files": ["src/components/modules/algorithm/ContextBar.tsx", "src/components/modules/AlgorithmModule.tsx"],
    "estimate": "3h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-005",
    "title": "Refactor AlgorithmCanvas to use component registry pattern",
    "description": "Replace the if/else-if chain in AlgorithmCanvas with a VISUALIZER_REGISTRY map keyed by visualization type. Each entry is a lazy-loaded component. Remove max-width constraints, use full-bleed layout with responsive padding.",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx"],
    "estimate": "4h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-006",
    "title": "Implement collapsible sidebar with icon rail",
    "description": "Add collapse/expand to sidebar: collapsed state shows 48px icon rail with category icons. Expand on click or Cmd+B. Persist collapsed state in localStorage.",
    "files": ["src/components/modules/AlgorithmModule.tsx", "src/components/modules/algorithm/AlgorithmSidebar.tsx"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-001"]
  },
  {
    "id": "ALG-UI-007",
    "title": "Redesign empty state with auto-playing demo loop",
    "description": "Replace 8 per-category empty state blocks with a single unified empty state that auto-plays a small Merge Sort demo at 0.5x speed with muted colors. Single CTA button opens algorithm picker.",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx", "src/components/modules/algorithm/EmptyStateDemo.tsx"],
    "estimate": "5h",
    "dependencies": ["ALG-UI-005"]
  },
  {
    "id": "ALG-UI-008",
    "title": "Reduce bottom panel tabs from 7 to 4",
    "description": "Merge Step Details + Latency Bridge into Step Trace. Move System Context to Properties panel. Remove Leaderboard placeholder. Move Code Lab to separate modal. Keep Pseudocode, Flashcards, Code.",
    "files": ["src/components/modules/algorithm/AlgorithmBottomPanel.tsx"],
    "estimate": "4h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-009",
    "title": "Implement toolbar overflow menu",
    "description": "Replace 8 floating buttons with 3 primary buttons + overflow dropdown. Add auto-fade behavior (opacity 0.3 after 4s inactivity). Group secondary actions into overflow menu.",
    "files": ["src/components/modules/AlgorithmModule.tsx", "src/components/modules/algorithm/CanvasToolbar.tsx"],
    "estimate": "3h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-010",
    "title": "Add Live State section to Properties panel",
    "description": "Use existing extractVariables() function to populate a real-time Live State section in AlgorithmProperties that shows current pivot, partition range, recursion depth, and stack trace. Updates on every step.",
    "files": ["src/components/modules/algorithm/AlgorithmProperties.tsx", "src/components/modules/AlgorithmModule.tsx"],
    "estimate": "4h",
    "dependencies": []
  }
]
```

### Phase B: Animation and Polish

```json
[
  {
    "id": "ALG-UI-011",
    "title": "Extend choreography system to graph visualizer",
    "description": "Port the algorithm-choreography.ts personality system to GraphVisualizer. Add distinct spring personalities for BFS (expanding wavefront), DFS (deep plunge), Dijkstra (rippling frontier), A* (directed beam).",
    "files": ["src/components/canvas/overlays/GraphVisualizer.tsx", "src/lib/algorithms/algorithm-choreography.ts"],
    "estimate": "6h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-012",
    "title": "Extend choreography system to tree visualizer",
    "description": "Add tree-specific animation personalities: BST insert (path glow from root to insertion point), AVL rotation (smooth pivot animation), traversal (wave-like node highlighting for level-order, depth-first descent for pre/in/post).",
    "files": ["src/components/canvas/overlays/TreeVisualizer.tsx", "src/lib/algorithms/algorithm-choreography.ts"],
    "estimate": "6h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-013",
    "title": "Add stage lighting and radial gradient background to canvas",
    "description": "Replace flat bg-background with radial gradient stage. Add subtle vignette at edges. Spotlight follows active elements (extend existing Spotlight component to graph/tree).",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx", "src/components/canvas/overlays/Spotlight.tsx"],
    "estimate": "3h",
    "dependencies": ["ALG-UI-005"]
  },
  {
    "id": "ALG-UI-014",
    "title": "Animate counters in context bar as odometers",
    "description": "Implement rolling-digit odometer animation for comparison and swap counters in the context bar. Each digit rolls individually when the value changes. Use springs.snappy for the roll animation.",
    "files": ["src/components/modules/algorithm/ContextBar.tsx", "src/components/ui/Odometer.tsx"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-004"]
  },
  {
    "id": "ALG-UI-015",
    "title": "Add complexity gauge to properties panel",
    "description": "Create a semicircular gauge component that shows current comparison count relative to theoretical worst case. Green/amber/red zones. Needle animated with springs.smooth. Displays O() notation at center.",
    "files": ["src/components/modules/algorithm/ComplexityGauge.tsx", "src/components/modules/algorithm/AlgorithmProperties.tsx"],
    "estimate": "5h",
    "dependencies": ["ALG-UI-010"]
  },
  {
    "id": "ALG-UI-016",
    "title": "Implement comparison mode split animation",
    "description": "When comparison mode is enabled, animate the canvas splitting into two halves with spring physics. Divider line draws in from top. When disabled, merge animation reverses. Add split/merge sounds.",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx", "src/hooks/useAlgorithmSound.ts"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-005"]
  },
  {
    "id": "ALG-UI-017",
    "title": "Add timeline scrubber with milestone markers to transport bar",
    "description": "Extend the transport bar timeline from Phase 3 into a full interactive scrubber. Click/drag to seek. Milestone markers (partition complete, merge complete, etc.) shown as dots above the track. Keyboard accessible via arrow keys.",
    "files": ["src/components/modules/algorithm/TransportBar.tsx", "src/components/modules/algorithm/TimelineScrubber.tsx"],
    "estimate": "5h",
    "dependencies": ["ALG-UI-003"]
  },
  {
    "id": "ALG-UI-018",
    "title": "Polish view toggle with labels and consistent heights",
    "description": "Replace icon-only view toggle with labeled text buttons. Equalize colormap height from 120px to 200px minimum. Add smooth crossfade between view modes (bar -> dot -> colormap). Move toggle to context bar.",
    "files": ["src/components/canvas/overlays/ViewToggle.tsx", "src/components/canvas/overlays/ColorMapVisualizer.tsx"],
    "estimate": "3h",
    "dependencies": ["ALG-UI-004"]
  }
]
```

### Phase C: Emotional Moments and Sound

```json
[
  {
    "id": "ALG-UI-019",
    "title": "Implement Dijkstra wavefront visualization",
    "description": "Add an expanding radial gradient frontier overlay to the graph visualizer during Dijkstra execution. Settled nodes stop shimmering and gain a drop-shadow. Path edges draw in with animated stroke-dashoffset.",
    "files": ["src/components/canvas/overlays/GraphVisualizer.tsx", "src/components/canvas/overlays/DijkstraWavefront.tsx"],
    "estimate": "6h",
    "dependencies": ["ALG-UI-011"]
  },
  {
    "id": "ALG-UI-020",
    "title": "Add N-Queens threat overlay visualization",
    "description": "During N-Queens visualization, show translucent red overlays on threatened diagonals/rows/columns when a queen is placed. Dissolve overlays on backtrack. Add placement/backtrack/lock-in sound effects.",
    "files": ["src/components/canvas/overlays/GridVisualizer.tsx", "src/hooks/useAlgorithmSound.ts"],
    "estimate": "5h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-021",
    "title": "Implement ascending scale completion sound",
    "description": "On sort completion, rapidly play each bar's mapped pitch from left to right in 800ms, creating an ascending scale. Use Web Audio API oscillators with triangle wave. Volume 0.12, pitch range 200-1200Hz.",
    "files": ["src/hooks/useAlgorithmSound.ts"],
    "estimate": "3h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-022",
    "title": "Redesign onboarding as auto-playing demo with contextual hints",
    "description": "Replace the 3-step tour overlay with an auto-playing mini Merge Sort demo on the canvas. After completion, show a single prompt inviting the user to try. Replace tour steps with contextual first-time hints that appear when a user interacts with each control for the first time.",
    "files": ["src/components/modules/AlgorithmModule.tsx", "src/components/modules/algorithm/OnboardingDemo.tsx", "src/hooks/useFirstEncounter.ts"],
    "estimate": "6h",
    "dependencies": ["ALG-UI-007"]
  },
  {
    "id": "ALG-UI-023",
    "title": "Add race conclusion banner with statistics",
    "description": "When a comparison race concludes, display a results banner showing winner, comparison ratio (e.g., 10x fewer comparisons), and a Share Result button that generates a social-card-style image with both algorithm names and stats.",
    "files": ["src/components/canvas/overlays/AlgorithmRace.tsx", "src/components/modules/algorithm/RaceResultCard.tsx"],
    "estimate": "5h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-024",
    "title": "Implement canvas watermark for shareability",
    "description": "Add a subtle bottom-left watermark during playback: Algorithm Name -- Step X/Y -- Architex in 10px text at opacity 0.3. Excluded from interactive UI. Included in screenshot export. Excluded in reduced motion mode.",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx"],
    "estimate": "2h",
    "dependencies": ["ALG-UI-005"]
  }
]
```

### Phase D: Accessibility and Responsive

```json
[
  {
    "id": "ALG-UI-025",
    "title": "Add dynamic aria-label to canvas visualization",
    "description": "Update the canvas role=img aria-label to include current algorithm name, step number, step description, and cumulative counters. Update on every step change via aria-live=polite companion region.",
    "files": ["src/components/modules/algorithm/AlgorithmCanvas.tsx", "src/components/canvas/overlays/ArrayVisualizer.tsx"],
    "estimate": "3h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-026",
    "title": "Add ARIA landmarks and roles to all panels",
    "description": "Wrap sidebar in nav[aria-label], canvas in section[role=region], properties in aside[role=complementary], bottom panel in section[role=region]. Add role=listbox to algorithm picker, role=slider to timeline scrubber, role=radiogroup to speed selector.",
    "files": ["src/components/modules/AlgorithmModule.tsx", "src/components/modules/algorithm/TransportBar.tsx", "src/components/modules/algorithm/AlgorithmPicker.tsx"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-001", "ALG-UI-003"]
  },
  {
    "id": "ALG-UI-027",
    "title": "Implement keyboard shortcut system with help overlay",
    "description": "Consolidate all keyboard shortcuts into a single useKeyboardShortcuts hook. Add Cmd+? to show a shortcuts overlay listing all bindings. Ensure no conflicts with browser defaults. Disable shortcuts when focus is in input/textarea.",
    "files": ["src/hooks/useKeyboardShortcuts.ts", "src/components/modules/algorithm/ShortcutsOverlay.tsx"],
    "estimate": "4h",
    "dependencies": []
  },
  {
    "id": "ALG-UI-028",
    "title": "Implement mobile responsive layout with bottom sheet",
    "description": "At < 768px: sidebar becomes a full-screen modal; properties panel becomes a swipe-up bottom sheet; transport bar is fixed bottom with large touch targets (44px min); algorithm picker uses large-format cards instead of compact list.",
    "files": ["src/components/modules/AlgorithmModule.tsx", "src/components/modules/algorithm/MobileAlgorithmPicker.tsx", "src/components/modules/algorithm/BottomSheet.tsx"],
    "estimate": "8h",
    "dependencies": ["ALG-UI-001", "ALG-UI-003"]
  },
  {
    "id": "ALG-UI-029",
    "title": "Ensure reduced motion compliance for all new animations",
    "description": "Audit every new animation added in Phases A-C. Verify that useReducedMotion() disables springs, replaces with instant transitions, disables sound, replaces confetti with static banner. Add integration tests for reduced motion paths.",
    "files": ["src/lib/constants/motion.ts", "src/components/canvas/overlays/*.tsx"],
    "estimate": "4h",
    "dependencies": ["ALG-UI-011", "ALG-UI-012", "ALG-UI-013", "ALG-UI-016"]
  },
  {
    "id": "ALG-UI-030",
    "title": "Implement mastery progression system tied to flashcards",
    "description": "Connect the mastery dots to actual learning activities: 1 star = first run, 2 stars = step through manually, 3 stars = pass complexity quiz for this algorithm, 4 stars = pass scenario quiz, 5 stars = pass debug challenge. Persist to localStorage and sync with progress store.",
    "files": ["src/components/modules/algorithm/AlgorithmProperties.tsx", "src/components/modules/algorithm/AlgorithmBottomPanel.tsx", "src/stores/progress-store.ts"],
    "estimate": "5h",
    "dependencies": []
  }
]
```

---

## Appendix A: Phase Summary

| Phase | Tasks | Estimated Hours | Focus |
|-------|-------|-----------------|-------|
| A: Layout Foundation | ALG-UI-001 through ALG-UI-010 | 45h | Restructure panels, extract components, fix information architecture |
| B: Animation and Polish | ALG-UI-011 through ALG-UI-018 | 36h | Extend choreography to all visualizers, stage lighting, scrubber |
| C: Emotional Moments | ALG-UI-019 through ALG-UI-024 | 27h | Dijkstra wavefront, N-Queens threats, completion sounds, onboarding |
| D: Accessibility | ALG-UI-025 through ALG-UI-030 | 28h | ARIA, keyboard, mobile, reduced motion, mastery system |
| **Total** | **30 tasks** | **136h** | |

## Appendix B: Files Referenced

| File | Lines | Role |
|------|-------|------|
| `src/components/modules/AlgorithmModule.tsx` | ~1300 | Module orchestrator |
| `src/components/canvas/panels/AlgorithmPanel.tsx` | ~2000 | Sidebar (to be split) |
| `src/components/modules/algorithm/AlgorithmCanvas.tsx` | ~567 | Canvas multiplexer |
| `src/components/modules/algorithm/AlgorithmProperties.tsx` | ~400 | Right panel |
| `src/components/modules/algorithm/AlgorithmBottomPanel.tsx` | ~720 | Bottom panel |
| `src/components/canvas/overlays/ArrayVisualizer.tsx` | ~280 | Bar chart visualizer |
| `src/lib/constants/motion.ts` | ~874 | Animation system |
| `src/lib/algorithms/algorithm-choreography.ts` | -- | Per-algorithm spring profiles |
| `src/hooks/useAlgorithmSound.ts` | -- | Web Audio sound system |

## Appendix C: Design Reference Mapping

| Reference | What We Take | Where It Applies |
|-----------|-------------|------------------|
| Brilliant.org | Problem-first discovery, interactive proofs | Onboarding flow (ALG-UI-022), Predict mode |
| 3Blue1Brown / Manim | Build to the insight, visual explanations | Emotional moments, choreography system |
| Neal.fun | Zero clutter, every element earns its place | Progressive disclosure (Principle 2), toolbar overflow |
| Apple Liquid Glass | Translucency, refraction, fluid transitions | Stage lighting, glassmorphism panels, transport bar blur |
| Linear | Information density without clutter | Properties panel layout, context bar, bottom panel tabs |
| Raycast | Keyboard-first, instant search | Algorithm combobox (ALG-UI-002), shortcut system (ALG-UI-027) |
