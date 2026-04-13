# Stitch Mode 2: REIMAGINE -- Architex Algorithm Visualizer

> Forget what exists. This document starts from zero and dreams the most
> extraordinary algorithm learning experience ever built on the web.

---

## PHASE 1: STUDY THE DOMAIN

### 1.1 Codebase Context Summary

The current Architex algorithm module is a competent sidebar-canvas-properties layout with
bar charts, dot plots, color maps, a comparison race mode, confetti celebrations, a danger
overlay for O(n^2) degeneration, and per-algorithm choreography springs. It covers 60+
algorithms across sorting, graph, tree, DP, string matching, backtracking, and geometry.
The design system uses a dark Linear-inspired palette with violet accent (primary
hsl(252 87% 67%) / #7c5cfc) against hsl(228 15% 7%) backgrounds. State colors: blue
#3b82f6 comparing, red #ef4444 swapping, green #22c55e sorted, purple #a855f7 pivot,
amber #f59e0b active, cyan #06b6d4 found.

### 1.2 Competition Analysis

**Brilliant.org Algorithm Courses**
Brilliant excels at problem-first pedagogy. You never see a formula before you
understand the question it answers. Interactive puzzles replace passive watching, and
each lesson builds a single insight through progressive difficulty. What it lacks: no
free-form exploration, no real-time visualization of full algorithm execution, and the
visual style is charming but static -- no cinematic animation.

**3Blue1Brown / Manim**
The gold standard for "build to the insight." Every frame exists to carry the viewer
one mental step forward. Camera movement, color, and timing are choreographed to music
with surgical precision. The viewer feels guided, never lost. What it lacks: it is a
video, not interactive. You cannot pause mid-proof and change the input. There is no
agency -- only awe.

**VisuAlgo (visualgo.net)**
The reigning standard algorithm visualizer. Comprehensive coverage, step-by-step
pseudocode highlighting, and solid educational annotations. What it lacks: the UI is
from 2012 -- cramped, text-heavy, visually forgettable. No animation personality, no
emotional payoff, no reason to screenshot it. Functional but joyless.

**algorithm-visualizer.org**
Community-built, open-source, and impressively extensible. Users can write their own
visualizations in JS. The code panel alongside the canvas is well-done. What it lacks:
no design cohesion. Every contributed visualization looks different. No choreography,
no sound, no narrative flow. A museum of individual exhibits, not a guided experience.

**Sound of Sorting (YouTube)**
Proves that audio encoding of comparisons and swaps adds a dimension of understanding
that vision alone cannot achieve. You can close your eyes and HEAR the difference
between Quick Sort and Bubble Sort. What it lacks: it is purely auditory spectacle --
there is no teaching, no interactivity, no UI. You watch, you smile, you leave.

**Mike Bostock -- "Visualizing Algorithms" (Observable)**
The essay that proved scatter plots and color maps are the superior representations for
sort visualization. His Fisher-Yates shuffle and merge sort heatmaps are works of art.
Every pixel is data, nothing is decoration. What it lacks: static essays, not tools.
You read, you do not interact. The beauty is in the explanation, not in the interface.

**Neal.fun**
Proves that delight comes from constraint. Each project has one idea, zero chrome, and
total focus. The "spend Bill Gates' money" and "draw a perfect circle" experiences
succeed because there is NOTHING to figure out -- you just do. What it lacks:
educational depth. Neal.fun entertains in 60 seconds; it does not teach algorithms.

**Apple Liquid Glass (2025/2026)**
Translucent layers with real-time refraction that react to content beneath them.
Surfaces feel physical -- light bends through toolbars, backgrounds blur and shift with
parallax. The effect is that UI stops feeling like flat rectangles and starts feeling
like a physical space. What it lacks: it can become visual noise when overused.
Readability suffers when everything refracts everything.

**Figma Canvas**
Proved that infinite spatial canvases are the future of creative tools. Zoom semantics
(overview at 10%, detail at 100%) let the same space serve both navigation and work.
Real-time multiplayer makes presence visible. What it lacks: Figma optimizes for
creation, not learning. Its canvas is a blank slate; an algorithm tool needs a curated
stage.

**Raycast**
Keyboard-first command palette that makes every action feel instant. No mouse required,
no menus to navigate. Type what you want, press Enter. It turns a complex app into a
conversational interface. What it lacks: discovery. If you do not know the command
exists, you will never find it. Power users fly; newcomers stall.

### 1.3 Core Experience

"The user should feel like they are conducting an orchestra of data -- every gesture
reveals the hidden music of computation, and the algorithm's logic becomes as visible
and beautiful as choreography on a stage."

---

## PHASE 2: GENERATE 5 RADICAL IDEAS

```
IDEA 1: "The Algorithm Theater"
What if... the entire canvas is a theatrical stage with a proscenium arch,
curtains that part to reveal data, a spotlight that tracks the algorithm's
focus, and "acts" (passes/partitions/levels) announced with title cards?
Each algorithm is a different performance style -- Bubble Sort is a slow
waltz, Quick Sort is a fencing duel, Merge Sort is a synchronized swim.
The audience (user) sits in the dark, and the data PERFORMS.
Inspired by: 3Blue1Brown's cinematography + theater UI metaphor
Why it might work: Emotional framing turns passive watching into a show.
People share theater moments. The metaphor makes algorithmic concepts
(acts = passes, intermission = recursion) memorable.
Why it might fail: Too much metaphor can confuse. Users might feel they are
watching a gimmick instead of learning. Performance overhead of theatrical
effects could slow down large arrays.
```

```
IDEA 2: "The Time Microscope"
What if... the visualization is a timeline you scrub like After Effects,
but at every point you can ZOOM INTO the micro-moment? Pinch to zoom on
one comparison and see the values, the decision, the cost. Zoom out and
see the entire execution as a heatmap -- a bird's-eye photograph of the
algorithm's behavior. The scroll wheel controls time. Two fingers controls
scale. The algorithm IS a landscape you explore.
Inspired by: Figma's infinite canvas + video editing NLEs + Bostock heatmaps
Why it might work: Time-scrubbing is the most intuitive way to navigate
anything temporal. Zoom semantics let beginners see one step at a time
and experts see the full O(n^2) shape. The heatmap-at-distance view
produces naturally beautiful screenshots.
Why it might fail: Building a performant zoomable timeline with step-level
granularity on 10,000-step algorithms is genuinely hard. Touch controls
conflict with page scrolling. The mental model shift from "play/pause" to
"navigate a landscape" requires onboarding.
```

```
IDEA 3: "Algorithm DNA"
What if... every algorithm, on every input, generates a unique visual
fingerprint -- a circular mandala, a spiral, a waveform -- that encodes
its BEHAVIOR, not just its result? Bubble Sort on random data makes a
dense spiral. Quick Sort makes a fractal tree. Merge Sort makes nested
arcs. You collect these patterns like trading cards. Two algorithms that
look similar ARE similar. You learn complexity by recognizing shapes.
Inspired by: Generative art + Sound of Sorting audio signatures + DNA gel
electrophoresis
Why it might work: Humans are pattern-recognition machines. Seeing that
O(n^2) algorithms make dense blobs and O(n log n) algorithms make sparse
trees teaches complexity viscerally. The collectible aspect adds stickiness.
Why it might fail: The mapping from algorithm behavior to visual pattern
is not obvious to design. Getting it wrong means pretty pictures that
teach nothing. The "trading card" mechanic might feel juvenile.
```

```
IDEA 4: "You Are The Algorithm"
What if... instead of watching, you ARE the algorithm? The interface shows
you two values and asks: "Compare. Which is larger?" You tap. It asks
again. And again. After 45 taps you realize you just performed Bubble
Sort. The tool reveals: "You made 45 comparisons. Quick Sort would have
done it in 18. Want to try being Quick Sort?" Now it shows you a pivot
and asks you to partition. You ARE the decision-maker. The algorithm's
cost is YOUR fatigue.
Inspired by: Brilliant.org's "invent the concept" pedagogy + Bret Victor's
"Learnable Programming"
Why it might work: Nothing teaches O(n^2) like FEELING how many times you
tap. Agency creates retention. The Brilliant research shows active learning
outperforms passive by 6x.
Why it might fail: It is slow. Users who already know Bubble Sort do not
want to tap 45 times. The interactive mode needs an expert fast-path.
Designing good prompts for graph and DP algorithms is far harder than
for sorting.
```

```
IDEA 5: "The Living Notebook"
What if... the interface is not a visualizer at all, but a notebook --
like Observable or Jupyter -- where every cell is alive? One cell shows
bars. The next cell IS the code, and you can edit it. The third cell is
a complexity chart that updates as you change the code. You drag cells
around, duplicate them, fork an algorithm. The whole page is a malleable
document, not a rigid tool. Share a notebook and someone else can remix it.
Inspired by: Observable notebooks + Jupyter + Notion blocks + Figma components
Why it might work: It meets users where they are (read, code, visualize in
the same flow). Shareable notebooks are inherently viral. The observable
pattern already proved this for data science.
Why it might fail: Building a live coding environment is a massive
engineering effort. Notebook UX is great for data scientists but alien to
CS students who expect a "run" button. The open-ended canvas risks
feeling overwhelming compared to a guided experience.
```

---

## PHASE 3: PICK THE BEST CONCEPT

```
CHOSEN CONCEPT: "The Time Microscope"
--- fused with the theatrical staging of Idea 1 and the "you are the
algorithm" active learning of Idea 4.

CORE IDEA:
The algorithm visualization is a zoomable TEMPORAL LANDSCAPE. At maximum
zoom-out, the entire execution is a single heatmap stripe -- a fingerprint.
Zoom in and the stripe unfolds into a scatter plot showing each element's
journey. Zoom further and you enter "the stage" -- a theatrical close-up
of individual comparisons with spotlights, sound, and choreography. At
any zoom level you can scrub time with the scroll wheel. Embedded within
this experience are "You Are The Algorithm" challenge moments where the
user manually makes the next decision before the algorithm reveals it.

KEY INNOVATIONS:
- Semantic zoom: the SAME data renders as heatmap (far), scatter plot (mid),
  and theatrical bar chart (close). No tab switching -- just pinch.
- Temporal scrubbing: the horizontal axis IS time. Every pixel-column is
  one algorithm step. Drag left/right to time-travel. The playhead is just
  your cursor position.
- Challenge mode woven into the timeline: at key moments (pivot selection,
  partition boundary, merge decision) the timeline PAUSES and asks the user
  to predict the next step. Correct answers earn "insight sparks" that
  accumulate into a mastery score.

HOW IT TEACHES BETTER:
The zoom metaphor mirrors how understanding works -- you start with the big
picture ("this algorithm is fast"), zoom into the mechanism ("it divides at
pivots"), and zoom into the detail ("this comparison decides which side").
The challenge pauses force active recall. The temporal scrub lets you answer
"what happened at step 47?" instantly, which passive playback cannot.

THE SCREENSHOT MOMENT:
The hero frame is the "Algorithm Landscape" -- a wide heatmap showing the
full 200-step execution of Merge Sort as nested colored arcs, with one
vertical slice zoomed open into a theatrical stage view showing two bars
mid-comparison under a violet spotlight. The contrast between the tiny
heatmap context and the dramatic zoomed detail creates the "I have never
seen anything like this" reaction.
```

---

## PHASE 4: DESIGN THE COMPLETE UI

### 4.1 Layout Architecture

```
+--------------------------------------------------------------+
|  [Architex]     cmd+k palette     [?] [sound] [theme]       |
+--------------------------------------------------------------+
|                                                              |
|  +--ALGORITHM LANDSCAPE (full width, full height)---------+  |
|  |                                                        |  |
|  |  ZOOM LEVEL 1 (far): HEATMAP OVERVIEW                 |  |
|  |  ████████████████████████████████████████████████████  |  |
|  |  Each pixel-column = 1 step. Color = state of array.  |  |
|  |  ~~~ cursor position = playhead ~~~                    |  |
|  |                                                        |  |
|  |  ZOOM LEVEL 2 (mid): SCATTER PLOT                      |  |
|  |     .   .        . .                                   |  |
|  |   .       .  . .     .                                 |  |
|  |  . .   .         .     .                               |  |
|  |  Y=value, X=position, animated per step                |  |
|  |                                                        |  |
|  |  ZOOM LEVEL 3 (close): THEATRICAL STAGE                |  |
|  |  ┌──────────────────────────────────────┐              |  |
|  |  │   spotlight cone                      │              |  |
|  |  │      ╲      ╱                         │              |  |
|  |  │  █  ██  ███  █  ████  ██  █           │              |  |
|  |  │  bars with full choreography          │              |  |
|  |  └──────────────────────────────────────┘              |  |
|  |                                                        |  |
|  +--------------------------------------------------------+  |
|                                                              |
|  +--TIMELINE RAIL (bottom, always visible)--+                |
|  |  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━|                |
|  |  0        Pass 1       Pivot      Sorted!                |
|  |  [1x] [2x] [4x]  step 47/203   comparisons: 312         |
|  +--------------------------------------------------+       |
|                                                              |
|  FLOATING PANELS (appear on hover/hotkey):                   |
|  [A] Algorithm picker  [C] Code  [V] Variables  [D] Dashboard|
+--------------------------------------------------------------+
```

### 4.2 Per-Screen Details

```
SCREEN: Algorithm Landscape -- Heatmap Overview
PURPOSE: Show the entire algorithm execution at a glance; the user sees
  the "shape" of the algorithm before any detail.
LAYOUT:
  +----------------------------------------------------------+
  |                     HEATMAP VIEW                          |
  |  ████████████████████████████████████████████████████████ |
  |  ████████████████████████████████████████████████████████ |
  |  ████████████████████████████████████████████████████████ |
  |  (rows = array indices, cols = time steps)               |
  |                                                          |
  |  Cursor hovers at step 87 -->  |  vertical highlight     |
  |                               V                          |
  |  ██████████████████████|█████████████████████████████████ |
  |                                                          |
  |  Bottom-left: "Merge Sort on 50 elements"                |
  |  Bottom-right: "Zoom in to explore"                      |
  +----------------------------------------------------------+
ELEMENTS:
  - Full-bleed canvas (WebGL) rendering color grid
  - Row labels (0..n-1) on left gutter, hidden until hover
  - Column-step cursor highlight (1px bright line)
  - Algorithm badge: name + complexity in bottom-left
  - Zoom hint: subtle text in bottom-right
INTERACTION:
  - Scroll wheel / pinch zooms toward cursor position
  - Click any column to jump playhead there
  - Hover shows tooltip: "Step 87: comparing arr[12] and arr[23]"
  - Cmd+K opens algorithm picker overlay
ANIMATION:
  - On first load, the heatmap writes itself left-to-right (1.5s)
  - Cursor highlight column pulses softly in violet
TRANSITION FROM/TO:
  - FROM: Algorithm picker modal
  - TO: Scatter Plot (on zoom-in past threshold 1)
```

```
SCREEN: Algorithm Landscape -- Scatter Plot
PURPOSE: Show every element's current position vs. value; the diagonal
  line emerging IS the visual proof of sorting.
LAYOUT:
  +----------------------------------------------------------+
  |  value                                                    |
  |  ^                                    . .                 |
  |  |                             . .  .                     |
  |  |                       .  .                             |
  |  |                 .  .                                   |
  |  |           . .                                          |
  |  |      . .                                               |
  |  |  . .                                                   |
  |  +---------------------------------------------> index   |
  |  Dashed diagonal = "perfect sort" reference line          |
  |                                                          |
  |  MINI HEATMAP (top-right, 120x40px context view)         |
  +----------------------------------------------------------+
ELEMENTS:
  - SVG scatter plot, dots colored by state
  - Reference diagonal line (dashed, 10% opacity)
  - Axis labels (mono font, subtle)
  - Mini heatmap thumbnail in top-right for context
  - Step counter overlay (bottom-center)
INTERACTION:
  - Scroll wheel scrubs time (dots animate to new positions)
  - Pinch zoom transitions to Stage view (close) or Heatmap (far)
  - Click any dot to see its value, original index, current index
  - Space bar plays/pauses the time scrub
ANIMATION:
  - Dots spring to new positions on each step (algorithm choreography)
  - Sorted dots turn green and lock onto the diagonal
  - Active comparison dots pulse with glow
TRANSITION FROM/TO:
  - FROM: Heatmap Overview (zoom-in)
  - TO: Theatrical Stage (zoom-in further) or Heatmap (zoom-out)
```

```
SCREEN: Theatrical Stage -- Close-Up
PURPOSE: The immersive detail view where individual bars animate with
  full choreography, sound, and spotlight effects.
LAYOUT:
  +----------------------------------------------------------+
  |       ╲  spotlight cone  ╱                                |
  |        ╲      ╱╲       ╱                                  |
  |  dim    ╲    ╱  ╲     ╱     dim                           |
  |  ░░  █  ██  ███  █  ████  ██  ░░                          |
  |  ░░  █  ██  ███  █  ████  ██  ░░                          |
  |  ░░  █  ██  ███  █  ████  ██  ░░                          |
  |  ──────────────────────────────                           |
  |  0   1   2   3   4    5    6                               |
  |                                                          |
  |  "Comparing arr[2]=8 with arr[3]=3"                      |
  |  [Code: if arr[j] > arr[j+1]: swap]                      |
  +----------------------------------------------------------+
ELEMENTS:
  - Bars with gradient fills, state-dependent glow
  - Spotlight radial gradient following active comparison
  - Dim overlay on non-active bars (opacity 0.3)
  - Narration line at bottom: plain-English step description
  - Pseudocode snippet (inline, not panel) showing current line
  - Challenge prompt (appears at key moments): "Which element
    should the pivot be? Tap to choose."
INTERACTION:
  - Left/Right arrow steps forward/backward
  - Scroll wheel scrubs time
  - Click a bar to see value detail popover
  - Pinch out to zoom to scatter plot view
  - Space bar plays/pauses
ANIMATION:
  - Per-algorithm choreography (bubble=reluctant, quick=decisive)
  - Spotlight smooth follows active indices
  - Swap animation: bars arc OVER each other, not through
  - Sorted bar rainbow gradient sweep on completion
  - Sound: compare tick, swap whoosh, sorted chime
TRANSITION FROM/TO:
  - FROM: Scatter Plot (zoom-in)
  - TO: Scatter Plot (zoom-out) or next algorithm (Cmd+K)
```

```
SCREEN: Algorithm Picker (Command Palette)
PURPOSE: Fast, keyboard-first algorithm selection with visual previews.
LAYOUT:
  +----------------------------------------------------------+
  |                                                          |
  |  +----------------------------------------------+        |
  |  |  Search algorithms...              cmd+k     |        |
  |  +----------------------------------------------+        |
  |  |                                              |        |
  |  |  SORTING                                     |        |
  |  |    Bubble Sort        O(n^2)    [heatmap]    |        |
  |  |    Quick Sort         O(n lg n) [heatmap]    |        |
  |  |    Merge Sort         O(n lg n) [heatmap]    |        |
  |  |    Heap Sort          O(n lg n) [heatmap]    |        |
  |  |                                              |        |
  |  |  GRAPH                                       |        |
  |  |    BFS                O(V+E)    [preview]    |        |
  |  |    Dijkstra           O(E lg V) [preview]    |        |
  |  |                                              |        |
  |  |  DP                                          |        |
  |  |    Fibonacci          O(n)      [preview]    |        |
  |  |    LCS                O(mn)     [preview]    |        |
  |  +----------------------------------------------+        |
  |                                                          |
  +----------------------------------------------------------+
ELEMENTS:
  - Search input with auto-focus
  - Category headers (Sorting, Graph, Tree, DP, String, etc.)
  - Each row: name, complexity badge, mini heatmap thumbnail
  - Arrow-key navigation with highlight
  - "Recently used" section at top
INTERACTION:
  - Type to fuzzy-filter
  - Arrow keys to navigate, Enter to select
  - Escape to dismiss
  - Hovering a row shows animated mini-preview
ANIMATION:
  - Modal scales in from 0.95 with backdrop blur
  - Items stagger in by 20ms
  - Selected item pulses subtly
TRANSITION FROM/TO:
  - FROM: Any screen via Cmd+K
  - TO: Heatmap Overview of selected algorithm
```

```
SCREEN: Challenge Mode
PURPOSE: Active learning pauses where the user predicts the algorithm's
  next move.
LAYOUT:
  +----------------------------------------------------------+
  |                  CHALLENGE                                 |
  |                                                          |
  |  The algorithm is about to partition.                     |
  |  Pivot = 7. Which side does 3 go to?                     |
  |                                                          |
  |        ┌───────┐          ┌───────┐                      |
  |        │ LEFT  │          │ RIGHT │                      |
  |        │ < 7   │          │ >= 7  │                      |
  |        └───────┘          └───────┘                      |
  |                                                          |
  |  Streak: 5 correct         [Skip]                        |
  +----------------------------------------------------------+
ELEMENTS:
  - Question text in large, clear type
  - Two (or more) answer buttons with labels
  - Current streak counter
  - Skip button (no penalty, just resumes playback)
  - Frozen visualization in background (blurred)
INTERACTION:
  - Click or press 1/2 to answer
  - Correct: green flash, streak increments, playback resumes
  - Wrong: red flash, correct answer highlighted, brief explanation
  - Skip: no effect, playback resumes
ANIMATION:
  - Challenge slides up from bottom with spring
  - Correct answer: button pulses green, confetti sparks
  - Wrong answer: button shakes, red flash
  - Background unblurs on resume
TRANSITION FROM/TO:
  - FROM: Theatrical Stage (automatic trigger at milestone steps)
  - TO: Theatrical Stage (after answer or skip)
```

```
SCREEN: Algorithm Race
PURPOSE: Side-by-side dramatic comparison of two algorithms on same input.
LAYOUT:
  +----------------------------------------------------------+
  |  ALGORITHM RACE                                           |
  |  +-------------------------+  +-------------------------+ |
  |  |     QUICK SORT          |  |     BUBBLE SORT         | |
  |  |                         |  |                         | |
  |  | [scatter plot animating]|  | [scatter plot animating] | |
  |  |                         |  |                         | |
  |  |  comparisons: 134       |  |  comparisons: 891       | |
  |  |  swaps: 45              |  |  swaps: 423             | |
  |  +-------------------------+  +-------------------------+ |
  |                                                          |
  |  ━━━━━━━━━━━━━━━━━━━━━━━━●━ Quick Sort 87%               |
  |  ━━━━━━━━━━━━━●━━━━━━━━━━━━ Bubble Sort 34%              |
  |                                                          |
  |  [QUICK SORT WINS! 6.6x fewer comparisons]               |
  +----------------------------------------------------------+
ELEMENTS:
  - Two scatter plots (not bar charts) side by side
  - Progress bars with percentage and step count
  - Live comparison/swap counters (odometer style)
  - Winner announcement banner with trophy and speedup ratio
  - Shared timeline rail at bottom
INTERACTION:
  - Play/pause controls both simultaneously
  - Click either side to zoom into that algorithm's stage view
  - Cmd+K to change either algorithm independently
ANIMATION:
  - Both scatter plots animate simultaneously
  - Winner's progress bar glows gold on completion
  - Loser's side dims slightly
  - Trophy icon bounces in with confetti on resolution
TRANSITION FROM/TO:
  - FROM: Cmd+K or race button in toolbar
  - TO: Single algorithm view (click either side)
```

```
SCREEN: Mobile Experience
PURPOSE: Full algorithm visualization on a phone screen.
LAYOUT:
  +----------------------------+
  |  [algo name]  [cmd] [play] |
  +----------------------------+
  |                            |
  |   SCATTER PLOT VIEW        |
  |    .    .                  |
  |  .    .    .  .            |
  |     .     .    .           |
  |  .    .      .  .          |
  |                            |
  +----------------------------+
  |  Step 47/203               |
  |  ━━━━━━━━━●━━━━━━━━━━━━━  |
  |  comparisons: 134          |
  +----------------------------+
  |  [<prev] [play/pause] [>]  |
  +----------------------------+
ELEMENTS:
  - Compact header: algorithm name, cmd palette, play button
  - Full-width scatter plot (primary viz -- not bar chart)
  - Timeline scrubber (swipe gesture)
  - Compact stats row
  - Bottom action bar
INTERACTION:
  - Swipe left/right on viz to step through
  - Pinch on viz to zoom between scatter and stage views
  - Tap scatter dot for detail popover
  - Bottom bar: previous/play/next buttons
ANIMATION:
  - Reduced choreography (simpler springs, no spotlight)
  - Haptic feedback on compare/swap (if supported)
  - Challenge mode uses full-screen overlay
TRANSITION FROM/TO:
  - FROM: Module selector
  - TO: Algorithm picker (tap header), Challenge mode
```

```
SCREEN: Welcome / First Impression
PURPOSE: Convert a first-time visitor into an engaged learner in 10 seconds.
LAYOUT:
  +----------------------------------------------------------+
  |                                                          |
  |         "How would you sort a shuffled deck?"            |
  |                                                          |
  |     [10 shuffled bars, large, centered, glowing]         |
  |      █  ████  ██  █████  ███  █  ████  ██  ███  █       |
  |                                                          |
  |       "Tap two adjacent bars to compare them."           |
  |                                                          |
  |  (after 3 manual swaps)                                  |
  |       "You just invented Bubble Sort.                    |
  |        But there is a faster way..."                     |
  |                                                          |
  |       [Watch Quick Sort]    [Explore All]                |
  +----------------------------------------------------------+
ELEMENTS:
  - Hero question in large serif font
  - 10 oversized animated bars (the only visual on screen)
  - Instructional text (appears progressively)
  - Reveal text after user performs 3 comparisons
  - Two CTA buttons: guided path or free exploration
INTERACTION:
  - Tap/click two adjacent bars to compare and swap
  - After 3 swaps, narrative text appears
  - "Watch Quick Sort" launches scatter plot animation
  - "Explore All" opens algorithm picker
ANIMATION:
  - Bars enter one by one with staggered cascade
  - User-triggered swaps arc over each other
  - Reveal text fades in with 0.5s delay
  - "Bubble Sort" text glows violet on reveal
TRANSITION FROM/TO:
  - FROM: First visit (auto-detected via local storage flag)
  - TO: Scatter Plot (Watch) or Picker (Explore)
```

### 4.3 Unique Visual Signatures

1. **The Semantic Zoom Transition**: The smooth crossfade from heatmap-stripe
   to scatter-dots to theatrical-bars as you pinch in/out. No other tool has
   this. Even in a thumbnail, the three-layer zoom is recognizable.

2. **The Violet Spotlight Cone**: A radial gradient emanating from active
   comparison indices, casting a soft hsl(252 87% 67%) / #7c5cfc glow onto
   the dark stage. This is the module's visual brand -- visible in every
   screenshot.

3. **The Timeline Rail**: A persistent horizontal bar at the bottom with
   milestone markers (pass boundaries, pivot placements, sorted confirmations)
   rendered as small diamond pips. The playhead is a glowing violet dot. It
   reads as "this is a temporal navigation tool" from any distance.

---

## PHASE 5: GENERATE 8 STITCH PROMPTS

### Prompt 1: Hero View -- "The Money Shot"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The Algorithm Landscape: a zoomable temporal view where the entire execution
of Merge Sort on 50 elements is rendered as a color heatmap at the top, a
scatter plot in the center, and a zoomed theatrical stage view at the bottom.
All three zoom levels are visible in a single seamless composition.

== LAYOUT ==
Full-screen dark canvas. No sidebar. No visible chrome. Three horizontal
bands stack vertically:
TOP (15% height): A thin heatmap stripe -- 200 pixel-columns, each column
is one step, rows are array indices 0-49. Colors shift from scattered
noise on the left to a perfect rainbow gradient on the right.
CENTER (55% height): A scatter plot. X=position, Y=value. 50 glowing dots
arranged in a rising diagonal (the sort is 80% complete). Active comparison
dots glow bright blue #3b82f6. Sorted dots are green #22c55e. A dashed
diagonal reference line at 10% opacity.
BOTTOM (30% height): A "stage view" inset showing 12 bars under a violet
spotlight cone. Two bars are mid-swap, arcing over each other. A narration
line reads "Merging: 8 and 3 compare. 3 is smaller, place left."

== KEY VISUAL ELEMENTS ==
- Heatmap band: pixel-precise, no gaps, smooth left-to-right gradient
- Scatter plot: dots are 6px circles with 4px glow halos
- Stage view: bars have gradient fills (bottom-to-top), rounded tops
- Spotlight: radial gradient from hsl(252, 87%, 67%) at 15% opacity
- A single vertical cursor line connects all three views at step 160
- Timeline rail at very bottom: thin line with diamond milestones
- Bottom-right: "Merge Sort | O(n log n) | Step 160/203"
- No sidebar, no toolbar, no buttons visible -- pure visualization

== UNIQUE FEATURES ==
1. Semantic zoom: three zoom levels visible simultaneously in one frame
2. The vertical cursor line unifying heatmap, scatter, and stage views
3. The theatrical spotlight cone casting violet light on active bars

== STYLE ==
Background: hsl(228, 15%, 7%) / #111319
Surface: hsl(228, 15%, 11%) for the stage inset background
Primary/Accent: hsl(252, 87%, 67%) / #7c5cfc -- spotlight, cursor, glows
State colors: comparing #3b82f6, swapping #ef4444, sorted #22c55e,
  pivot #a855f7, active #f59e0b
Typography: monospace for data labels, system-ui for narration
Glass panels: 80% opacity backgrounds with backdrop-blur-xl
Subtle grid lines at 5% opacity in the scatter plot area

== CONTENT (real data) ==
Algorithm: Merge Sort on [38,27,43,3,9,82,10,44,15,29,8,17,51,2,36,
  21,5,67,12,40,33,55,7,19,61,14,48,26,70,31,1,22,46,11,58,25,39,
  16,53,6,35,20,64,13,42,28,73,4,37,23]
Step 160 of 203. Comparisons: 312. Swaps: 198.
Current action: Merging subarrays [2,3,8,17,27] and [10,15,29,43,44]

== MOOD ==
A dark observatory where the algorithm's execution history glows like
a distant galaxy -- zooming in reveals the living mechanics of data in
motion, lit by a single violet spotlight.

== INSPIRED BY ==
- Mike Bostock's "Visualizing Algorithms" heatmaps for the top band
- Figma's zoom semantics for the three-level composition
- 3Blue1Brown's spotlight and darkness for the stage view

== DO NOT ==
- Do not show any sidebar or navigation chrome
- Do not use flat solid-color bars (use gradients with subtle inner glow)
- Do not make it look like a spreadsheet or traditional UI
- Do not use any emoji or cartoon elements
```

### Prompt 2: Active State -- "The Algorithm is Alive"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
Quick Sort at peak intensity: the pivot has just been placed and the array
is mid-partition. The scatter plot shows dots flying to their sides. The
stage view shows bars splitting apart with a dramatic gap at the pivot.
Everything is in motion. The UI pulses with energy.

== LAYOUT ==
Full-screen dark canvas, single view: the scatter plot at maximum size.
50 data points. The pivot (value 42) is highlighted in purple #a855f7
at its final position. Elements less than 42 are rushing left (blue glow
trails). Elements greater than 42 are rushing right (amber glow trails).
A vertical line at the pivot splits the canvas.

Below the scatter plot: a compact dashboard strip showing:
  Left: complexity gauge (SVG semicircle, needle at 75 degrees / yellow zone)
  Center: odometer counters "Comparisons: 0089" and "Swaps: 0034"
  Right: memory bar "Space: O(log n)" at 35% fill

Timeline rail at bottom with playhead at 40% and a diamond marker labeled
"Partition 1" at 38%.

== KEY VISUAL ELEMENTS ==
- 50 animated dots, each with a 2px motion trail (fading tail)
- Pivot dot: larger (8px), purple #a855f7, pulsing ring
- Partition line: vertical, 1px, dashed, white at 20% opacity
- Left partition dots: blue #3b82f6 tint
- Right partition dots: amber #f59e0b tint
- Dashboard strip: glass panel, rounded-xl, backdrop-blur
- Gauge needle: animated, currently in yellow zone
- Odometer digits: rolling animation, mechanical feel
- Timeline rail: glowing violet playhead dot

== UNIQUE FEATURES ==
1. Motion trails on dots showing DIRECTION of movement (visual velocity)
2. The partition gap -- a physical void in the scatter plot at the pivot
3. The complexity gauge needle swinging in real-time with each comparison

== STYLE ==
Background: hsl(228, 15%, 7%) #111319
Dots: 6px base, active 8px, glow filter (Gaussian blur 3px)
Dashboard: bg-background/70 with border-border/30 and backdrop-blur-xl
Gauge: green #22c55e (0-60deg), yellow #eab308 (60-120deg), red #ef4444
  (120-180deg), stroke-width 8
Odometer: monospace, 16px digit columns, border-border/20 background
Timeline: 2px rail, violet #7c5cfc playhead, diamond markers
Motion trails: 20px long, opacity fading from 0.6 to 0

== CONTENT (real data) ==
Algorithm: Quick Sort (Lomuto partition)
Array: 50 random integers between 1 and 100
Current pivot: 42 (index 24)
Step 89 of 224. Comparisons: 89. Swaps: 34.
Elements partitioned so far: 23 left of pivot, 26 right

== MOOD ==
A physics simulation at its most dynamic -- particles streaming to their
destinations, energy visible in every trail, the gauge spinning, counters
clicking. The algorithm is not being displayed. It is HAPPENING.

== INSPIRED BY ==
- Particle physics visualizations (CERN event displays) for motion trails
- Racing game dashboards for the gauge + odometer combination
- 3Blue1Brown's vector field animations for the directional flow feeling

== DO NOT ==
- Do not show static dots -- everything must convey motion
- Do not use bars -- this view is exclusively scatter plot
- Do not show a sidebar or algorithm picker
- Do not make the dashboard larger than 80px tall (compact, not dominant)
```

### Prompt 3: Discovery -- "Choose Your Adventure"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The algorithm picker is a command palette fused with a visual gallery. Each
algorithm has a tiny heatmap fingerprint thumbnail. Categories are organized
as groups. The user types to search or arrows to navigate. This is how you
choose what to explore.

== LAYOUT ==
Full-screen with dark translucent overlay (background blurred at 12px).
Centered modal: 640px wide, max 520px tall.
Top: search input with placeholder "Search algorithms..." and Cmd+K badge.
Below search: scrollable list organized by category.

Each category (SORTING, GRAPH, TREE, DP, STRING, BACKTRACKING, GEOMETRY)
is a section header in small caps.

Each algorithm row: left-aligned name, center complexity badge, right-side
mini heatmap (80x16px thumbnail showing that algorithm's execution pattern
as a color stripe).

The currently highlighted row has a violet left border and subtle violet
background tint.

== KEY VISUAL ELEMENTS ==
- Modal: rounded-2xl, glass panel (bg-background/90, backdrop-blur-xl,
  border border-border/30, shadow-xl)
- Search input: h-12, text-base, no visible border, subtle bottom line
- Category headers: text-[10px] uppercase tracking-widest foreground-subtle
- Algorithm rows: h-10, px-4, flex items-center gap-3
- Name: text-sm font-medium text-foreground
- Complexity: text-[10px] font-mono px-2 py-0.5 rounded bg-surface
- Mini heatmap: 80x16px, rounded, overflow-hidden, rendered as tiny canvas
- Selected row: border-l-2 border-primary bg-primary/5
- "Recently Used" section at very top with 3 entries

== UNIQUE FEATURES ==
1. Each algorithm has a unique heatmap fingerprint (tiny color pattern)
2. Fuzzy search filters ALL categories simultaneously
3. Arrow-key navigation highlights rows; Enter selects instantly

== STYLE ==
Overlay: black at 60% opacity with backdrop-blur-sm
Modal background: hsl(228, 15%, 10%) at 90% opacity
Border: hsl(228, 15%, 16%) at 30% opacity
Primary accent: hsl(252, 87%, 67%) for selected state
Search icon: foreground-muted #6b7280
Section headers: foreground-subtle
Complexity badges: monospace, muted colors
Heatmap thumbnails use SORTING_STATE_COLORS: #3b82f6 comparing, #ef4444
  swapping, #22c55e sorted, #6b7280 default

== CONTENT (real data) ==
Recently Used: Quick Sort, Merge Sort, Dijkstra
SORTING: Bubble Sort O(n^2), Selection Sort O(n^2), Insertion Sort O(n^2),
  Merge Sort O(n log n), Quick Sort O(n log n), Heap Sort O(n log n),
  Shell Sort O(n log n), Tim Sort O(n log n), Counting Sort O(n+k),
  Radix Sort O(nk), Cocktail Shaker Sort O(n^2), Comb Sort O(n^2)
GRAPH: BFS O(V+E), DFS O(V+E), Dijkstra O(E log V), Bellman-Ford O(VE),
  Kruskal O(E log E), Prim O(E log V), Topological Sort O(V+E)
TREE: BST Insert O(log n), BST Delete O(log n), AVL Tree O(log n),
  Heap Operations O(log n), Red-Black Tree O(log n)
DP: Fibonacci O(n), LCS O(mn), Edit Distance O(mn), 0/1 Knapsack O(nW),
  Coin Change O(nS), LIS O(n^2), Matrix Chain O(n^3)

== MOOD ==
A catalog of living specimens -- each algorithm's heatmap fingerprint is
like a DNA barcode. The dark modal floats over the blurred landscape like
a specimen drawer opening in a museum of computation.

== INSPIRED BY ==
- Raycast's command palette for keyboard-first speed
- Spotify's search overlay for the gallery-with-previews feel
- Apple's Spotlight for the minimal, focused search experience

== DO NOT ==
- Do not use a dropdown or sidebar layout
- Do not show more than one line per algorithm (keep it scannable)
- Do not omit the mini heatmap thumbnails (they are the signature element)
- Do not make the modal wider than 640px (it should feel focused)
```

### Prompt 4: Learning Moment -- "Aha!"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The "Aha!" moment: the user has been manually comparing bars (they are BEING
Bubble Sort). After their 45th comparison, the interface reveals: "You just
invented Bubble Sort. You made 45 comparisons. Quick Sort does it in 18."
Then it animates Quick Sort on the same data in 3 seconds, showing the
difference viscerally.

== LAYOUT ==
Full-screen dark canvas. Two horizontal halves, stacked:

TOP HALF: "Your Sort" -- 10 large bars showing the user's manual sorting
result. Each bar the user touched glows faintly. A label: "Your Sort:
45 comparisons, 23 swaps". The bars are sorted but look "tired" -- slightly
rounded, muted green #22c55e with low glow.

BOTTOM HALF: "Quick Sort" -- the same 10 bars, mid-animation at step 10/18.
The pivot is dramatically violet #a855f7. Elements are flying to their
sides with motion trails. A label: "Quick Sort: 10 comparisons, 6 swaps
(so far)".

CENTER DIVIDER: A glass banner reads "You invented Bubble Sort!" with a
subtle violet glow. Below it: "But there is a faster way..."

Bottom timeline: showing Quick Sort's remaining 8 steps.

== KEY VISUAL ELEMENTS ==
- Top bars: large (64px wide max), sorted, green #22c55e, gentle inner glow
- Bottom bars: same dimensions, mid-sort, colored by state
- Center banner: rounded-xl, glass panel, text-xl font-semibold
- "Bubble Sort" in the banner glows violet
- Comparison counter: large (text-3xl), monospace, showing 45 vs 10
- Arrow or "vs" graphic between the two counters
- Quick Sort pivot bar: pulsing purple ring animation

== UNIQUE FEATURES ==
1. The juxtaposition: YOUR manual work vs. the algorithm's efficiency
2. The center revelation banner that makes learning personal
3. Counter comparison (45 vs 18) rendered as large, dramatic numerals

== STYLE ==
Background: hsl(228, 15%, 7%) #111319
Top half: slightly elevated bg (hsl(228, 15%, 9%))
Bottom half: slightly darker (hsl(228, 15%, 6%))
Banner: bg-background/80 backdrop-blur-xl border-border/30 shadow-lg
Text "Bubble Sort": text-primary (hsl(252, 87%, 67%))
Counter numbers: text-4xl font-bold font-mono
"45": text-foreground-muted (dimmer, it is the worse score)
"18": text-primary (brighter, it is the better score)
Bar gradients: sorted uses linear-gradient(to top, #16a34a, #22c55e)
  pivot uses linear-gradient(to top, #7c3aed, #a855f7)

== CONTENT (real data) ==
Array: [5, 3, 8, 1, 9, 2, 7, 4, 10, 6]
User's Bubble Sort: 45 comparisons, 23 swaps (worst case on 10 elements)
Quick Sort: 18 comparisons, 9 swaps (average case)
Pivot value: 6
Currently partitioning: [5,3,1,2,4] | 6 | [8,9,10,7]

== MOOD ==
The moment of revelation -- personal, a little humbling, and deeply
motivating. You see YOUR work next to the optimal approach and understand
WHY algorithms matter. Not from a textbook. From your own hands.

== INSPIRED BY ==
- Brilliant.org's "You just discovered..." moments
- Duolingo's lesson completion screens (personal stats, celebration)
- Racing game split times (your time vs ghost/record)

== DO NOT ==
- Do not make the user feel bad (the tone is "look how cool this is"
  not "you were slow")
- Do not use small text for the counter comparison (it must be dramatic)
- Do not hide Quick Sort's animation (it should be actively running)
- Do not add any sidebar or navigation -- this is a full-screen moment
```

### Prompt 5: Comparison -- "Race/Battle"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
Algorithm Race: Quick Sort vs Bubble Sort on 50 identical elements, shown
as two scatter plots racing simultaneously. Quick Sort is about to finish.
Bubble Sort is barely halfway. The difference is visceral and dramatic.

== LAYOUT ==
Full-screen split vertically into two equal halves with a 1px border between.

LEFT HALF: Quick Sort scatter plot. 50 dots. Most are green (sorted) and
aligned on the diagonal. 4 dots still active (blue, mid-comparison).
Progress bar below: 92% filled in violet #7c5cfc.
Stats: "Comparisons: 223 | Swaps: 67 | Step 189/204"

RIGHT HALF: Bubble Sort scatter plot. 50 dots. Scattered, messy. About 15
dots on the diagonal (green), rest still disordered. Many active comparisons.
Progress bar below: 34% filled in amber #f59e0b.
Stats: "Comparisons: 412 | Swaps: 198 | Step 412/1225"

TOP CENTER: Floating banner "ALGORITHM RACE" with flag icon and timer.

BOTTOM CENTER: Spanning both halves, a comparison summary panel:
"Quick Sort: finishing... | Bubble Sort: 34% -- 5.5x behind"

When Quick Sort finishes: left side gets a golden glow border, trophy icon,
"WINNER! 204 steps". Right side dims to 70% opacity, continues running.

== KEY VISUAL ELEMENTS ==
- Two scatter plots: identical dimensions, same axis scales
- Quick Sort dots: mostly green-on-diagonal, few blue stragglers
- Bubble Sort dots: mostly gray-scattered, slow green emergence
- Progress bars: rounded-full, h-2, Quick=violet, Bubble=amber
- Stats text: monospace, text-[10px], tabular-nums
- Winner banner: rounded-lg, border-amber-400/30, bg-amber-500/10
- Trophy icon: amber-400, h-5 w-5
- Vertical split border: 1px, border-border/30
- Speedup ratio: "5.5x" in bold violet

== UNIQUE FEATURES ==
1. Both scatter plots animating simultaneously on identical data
2. The diagonal convergence visible on Quick Sort but barely started
   on Bubble Sort -- the SHAPE difference teaches complexity
3. The speedup ratio ("5.5x") updated live as both run

== STYLE ==
Background: hsl(228, 15%, 7%)
Left panel surface: hsl(228, 15%, 8%)
Right panel surface: hsl(228, 15%, 8%)
Scatter dots: 5px, with state-based coloring and glow
Quick Sort progress: linear-gradient(90deg, #7c3aed, #7c5cfc)
Bubble Sort progress: linear-gradient(90deg, #d97706, #f59e0b)
Winner glow: box-shadow 0 0 30px rgba(245,158,11,0.15)
Dimmed loser: opacity 0.6 filter grayscale(20%)
Stats: font-mono, text-foreground-muted
"RACE" banner: text-[11px] uppercase tracking-widest

== CONTENT (real data) ==
Array: 50 random integers, identical for both algorithms
Quick Sort: step 189/204, comparisons 223, swaps 67
Bubble Sort: step 412/1225, comparisons 412, swaps 198
Quick Sort is about to finish (92% progress)
Bubble Sort is at 34% progress

== MOOD ==
A Formula 1 race where one car has already lapped the other. The contrast
is not just numerical -- you SEE it in the scatter patterns. Quick Sort's
dots are nearly a clean diagonal. Bubble Sort's dots are still a storm.

== INSPIRED BY ==
- F1 race timing screens for the split-screen comparison
- VisuAlgo's comparison mode (but elevated to a dramatic race)
- ESPN sports comparison graphics for the competitive framing

== DO NOT ==
- Do not use bar charts (scatter plots only for this view)
- Do not make both sides the same color (they must be visually distinct)
- Do not show a sidebar -- full-screen race experience
- Do not minimize the speed difference (the whole point is the contrast)
```

### Prompt 6: Mobile -- "Pocket Experience"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The full algorithm visualization experience on a 375px-wide phone screen.
The scatter plot is the primary view. Controls are minimal. Gestures replace
buttons. The experience feels like a premium mobile app, not a shrunken desktop.

== LAYOUT ==
375px x 812px (iPhone viewport).

TOP BAR (48px): Left: "Quick Sort" text with tiny complexity badge "O(n lg n)".
Right: cmd palette icon + sound toggle icon.

MAIN AREA (full remaining height minus bottom bar):
Scatter plot filling the width. 30 dots. The sort is 60% complete. Dots on
the lower-left are green (sorted, on diagonal). Upper-right dots still
scattered (default gray, some blue for active comparison).

A thin heatmap stripe (24px tall) sits directly above the scatter plot,
showing the full execution timeline.

STATS ROW (32px): "Step 78/189 | 134 cmp | 45 swp" in monospace, compact.

BOTTOM BAR (56px): Three buttons: [<< Prev] [Play/Pause circle] [Next >>].
Centered. Large touch targets (44px min).

== KEY VISUAL ELEMENTS ==
- Scatter plot: full-width, dots at 4px radius (smaller for mobile)
- Heatmap stripe: 24px tall, pixel-columns, full-width
- Stats: single row, text-[10px] mono, tabular-nums
- Play button: 44px circle, violet #7c5cfc fill, white triangle icon
- Prev/Next: 44px circles, ghost style (border only), subtle
- Top bar: no background (transparent, overlays the viz)
- Safe area spacing at top and bottom for notch/home indicator

== UNIQUE FEATURES ==
1. Swipe left/right on the scatter plot to step through time
2. Pinch to zoom between heatmap (far) and stage view (close)
3. Haptic feedback on compare and swap events

== STYLE ==
Background: hsl(228, 15%, 7%) #111319
Dots: 4px, glow filter with reduced radius for performance
Play button: bg-primary rounded-full shadow-lg
Prev/Next: border border-border/30 rounded-full bg-transparent
Stats text: text-foreground-muted
Heatmap: pixel-precise, no gaps
Top bar text: text-sm font-semibold text-foreground
Bottom bar: bg-background/90 backdrop-blur border-t border-border/30
Safe area: env(safe-area-inset-top) / env(safe-area-inset-bottom)

== CONTENT (real data) ==
Algorithm: Quick Sort on 30 elements
Values: [23,7,41,15,33,8,19,45,12,28,3,37,21,9,31,5,26,14,39,17,
  43,10,35,24,6,30,18,48,11,36]
Step 78 of 189. Comparisons: 134. Swaps: 45.
Current action: Comparing arr[14]=31 with pivot=26

== MOOD ==
A pocket-sized window into the algorithm's world -- everything you need,
nothing you do not. The dark screen glows with data like a constellation
map on a phone-sized observatory.

== INSPIRED BY ==
- Apple Weather app for the clean full-screen data visualization
- Spotify mobile for the compact playback controls
- Neal.fun mobile for the touch-first gesture interaction

== DO NOT ==
- Do not shrink the desktop layout (design native for 375px)
- Do not use a sidebar or panels (they do not fit)
- Do not make touch targets smaller than 44px
- Do not use hover effects (there is no hover on mobile)
```

### Prompt 7: Welcome -- "First Impression"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The first thing a new user sees: a dark screen with 10 large, beautifully
lit bars and a single question. No buttons, no sidebar, no chrome. Just the
question and the data. This is the moment that hooks someone or loses them.

== LAYOUT ==
Full-screen. Absolutely nothing except:

CENTER (vertically and horizontally):
A question in elegant type: "How would you sort these?"
Below it: 10 large bars, each about 48px wide, spaced 8px apart. Heights
correspond to values [5, 3, 8, 1, 9, 2, 7, 4, 10, 6]. Each bar has a
value label on top. Bars glow with subtle gradient (default state).

Below the bars: small instructional text "Tap two adjacent bars to compare"
in foreground-muted.

Very bottom: two ghost links "Skip to explorer" and "Watch a demo" in
text-[11px] foreground-subtle.

After the user taps two bars: they swap (or do not, if in order) with a
satisfying spring animation and a subtle sound. After 3 swaps, new text
appears: "You just invented Bubble Sort." in primary violet.

== KEY VISUAL ELEMENTS ==
- Question text: text-2xl font-serif (or elegant sans), text-foreground
  letter-spacing tight, centered
- 10 bars: 48px max-width each, full gradient fills (default state),
  rounded-t-md, min-height 32px
- Value labels: text-sm mono, centered above each bar
- Instruction text: text-sm, foreground-muted, appears with 1s delay
- Revelation text: text-xl, text-primary #7c5cfc, appears after 3 swaps
  with a fade-in and subtle glow
- Skip links: absolute bottom, 24px from edge
- Background: pure hsl(228, 15%, 7%) -- no gradients, no noise

== UNIQUE FEATURES ==
1. Zero UI -- the bars and the question ARE the entire interface
2. The user discovers Bubble Sort through their own actions
3. The revelation moment is personal ("YOU just invented...")

== STYLE ==
Background: hsl(228, 15%, 7%) #111319
Bar gradient (default): linear-gradient(to top, #4b5563, #6b7280)
Bar gradient (compared): linear-gradient(to top, #2563eb, #3b82f6)
Bar gradient (swapped): linear-gradient(to top, #dc2626, #ef4444)
Question text: text-foreground hsl(220, 14%, 90%)
Instruction text: text-foreground-muted hsl(220, 10%, 50%)
Revelation "Bubble Sort": text-primary hsl(252, 87%, 67%)
with text-shadow: 0 0 20px hsla(252, 87%, 67%, 0.3)
Swap animation: type spring, stiffness 150, damping 22, mass 1.2
  (matches Bubble Sort choreography)
No border, no shadow on bars -- they float on the dark background

== CONTENT (real data) ==
Array: [5, 3, 8, 1, 9, 2, 7, 4, 10, 6]
User performs Bubble Sort manually (adjacent comparisons only)
After 3 manual swaps -> revelation
CTA options: "Watch Quick Sort" or "Explore All Algorithms"

== MOOD ==
A dark room. A question. Data waiting to be understood. Nothing between
you and the insight. The sparest possible interface -- one that respects
your intelligence and invites your curiosity.

== INSPIRED BY ==
- Brilliant.org's first-lesson hook (the user discovers, not watches)
- Neal.fun's radical minimalism (zero chrome)
- Wordle's onboarding (no tutorial needed -- just start)

== DO NOT ==
- Do not show ANY navigation, sidebar, or toolbar
- Do not show complexity labels or algorithm names before the revelation
- Do not overwhelm with choice -- there are only 10 bars and one question
- Do not use small bars (they must feel large and tactile, 48px wide)
```

### Prompt 8: Dark + Light -- "Versatility"

```
Design a revolutionary algorithm visualization interface called "Architex".
This is NOT a typical algorithm tool -- it's a completely reimagined experience.

== THE CONCEPT ==
The same scatter-plot view of Merge Sort at step 120/203, shown twice: the
left half of the frame is the dark theme, the right half is the light theme.
A diagonal split line separates them. This demonstrates that the visual
language works in both modes.

== LAYOUT ==
Full-width frame, split diagonally from top-left to bottom-right.

LEFT/TOP TRIANGLE: Dark theme. Scatter plot with 40 dots. Background
hsl(228, 15%, 7%). Dots colored by state. Subtle grid lines at 5% opacity.
Dashboard strip at bottom with gauge and counters.

RIGHT/BOTTOM TRIANGLE: Light theme. Same scatter plot, same data, same step.
Background hsl(220, 14%, 96%). Dots with slightly different saturation for
light mode readability. Grid lines at 8% opacity.

The diagonal split is a crisp 1px line with a subtle gradient from
dark-border to light-border.

Both halves show the timeline rail at the bottom with the playhead at the
same position.

== KEY VISUAL ELEMENTS ==
- Diagonal split: 1px line, antialiased, from (0,0) to (width,height)
- Dark dots: same colors as standard (#3b82f6, #22c55e, #ef4444 etc.)
- Light dots: slightly deeper variants for contrast against white bg
  (comparing #2563eb, sorted #16a34a, swapping #dc2626)
- Dark background: #111319
- Light background: #f5f5f7
- Dark surface: hsl(228, 15%, 11%)
- Light surface: hsl(220, 14%, 98%)
- Dark text: hsl(220, 14%, 90%)
- Light text: hsl(220, 14%, 20%)
- Dashboard glass panels: dark=bg/70 blur, light=bg/80 blur
- Both halves: identical data, identical layout, different palette

== UNIQUE FEATURES ==
1. Diagonal split showing both themes in one frame
2. Proof that the visualization reads clearly in both modes
3. The accent color hsl(252, 87%, 67%) #7c5cfc works in both contexts

== STYLE ==
DARK SIDE:
  Background: hsl(228, 15%, 7%)
  Foreground: hsl(220, 14%, 90%)
  Border: hsl(228, 15%, 16%)
  Primary: hsl(252, 87%, 67%)
  Dots: standard state colors from visualization-colors.ts
  Grid: white at 5% opacity

LIGHT SIDE:
  Background: hsl(220, 14%, 96%)
  Foreground: hsl(220, 14%, 15%)
  Border: hsl(220, 14%, 85%)
  Primary: hsl(252, 87%, 55%) -- slightly deeper for contrast
  Dots: deeper state colors (comparing #2563eb, sorted #16a34a,
    swapping #dc2626, pivot #7c3aed)
  Grid: black at 6% opacity

Both: same scatter plot layout, same dot positions, same timeline.

== CONTENT (real data) ==
Algorithm: Merge Sort on 40 elements
Step 120 of 203. Comparisons: 240. Swaps: 152.
About 60% sorted -- a mix of green-on-diagonal and scattered dots.
Dashboard: gauge at 70 degrees (green-yellow boundary), counters at 0240/0152

== MOOD ==
A before-and-after that proves the design system is not just "dark mode" but
a genuine dual-theme experience. Both halves are equally beautiful, equally
readable, equally alive.

== INSPIRED BY ==
- Apple's dark/light mode marketing shots (diagonal or half splits)
- Linear's theme toggle that preserves character in both modes
- Figma's theme screenshots in their marketing materials

== DO NOT ==
- Do not make the light side feel washed out or an afterthought
- Do not use pure white (#fff) for the light background (use warm white)
- Do not change the layout between themes (only palette changes)
- Do not forget the dashboard and timeline in both halves
```

---

## PHASE 6: FEASIBILITY CHECK

```
PROMPT 1: Hero View (The Money Shot)
BUILDABLE WITH:
  - Layout: CSS Grid with three rows (15% / 55% / 30%), Tailwind grid-rows
  - Animation: motion/react for dot transitions, CSS for cursor highlight
  - Visualization: WebGL (via regl or pixi.js) for heatmap, SVG for scatter
    and stage bars

HARD PARTS:
  - WebGL heatmap rendering for 50x200 pixel-precise grid — M
  - Smooth zoom transition between three views — L
  - Keeping all three views synchronized at the same step — M

COULD SHIP IN: 3-4 weeks for the three-view composition, 6 weeks for
  seamless zoom transitions.
```

```
PROMPT 2: Active State (The Algorithm is Alive)
BUILDABLE WITH:
  - Layout: Single scatter plot (SVG viewBox), dashboard flex strip (Tailwind)
  - Animation: motion/react for dot springs, requestAnimationFrame for trails
  - Visualization: SVG with feGaussianBlur for glow, motion.circle for dots

HARD PARTS:
  - Motion trail rendering (Canvas 2D overlay or SVG paths) — M
  - Keeping 50 dots animating with trails at 60fps — M
  - Gauge needle sync with comparison counter — S

COULD SHIP IN: 1-2 weeks (builds on existing scatter plot and dashboard).
```

```
PROMPT 3: Discovery (Choose Your Adventure)
BUILDABLE WITH:
  - Layout: Radix Dialog/Popover or headless modal, Tailwind max-w-[640px]
  - Animation: motion/react AnimatePresence, staggerChildren
  - Visualization: Tiny <canvas> elements (80x16px) per algorithm row

HARD PARTS:
  - Generating heatmap fingerprint thumbnails for 60+ algorithms — M
  - Fuzzy search with category-aware filtering — S
  - Keeping modal accessible (focus trap, aria-labels) — S

COULD SHIP IN: 1 week for the modal + search, 2 weeks with heatmap previews.
```

```
PROMPT 4: Learning Moment (Aha!)
BUILDABLE WITH:
  - Layout: Two-row CSS Grid (top=user bars, bottom=algorithm bars), Tailwind
  - Animation: motion/react for bar swaps, AnimatePresence for reveal text
  - Visualization: Standard ArrayVisualizer component, duplicated

HARD PARTS:
  - Tracking user's manual sorting state and comparing to algorithm — M
  - The revelation trigger logic (when to show "You invented Bubble Sort") — S
  - Making the counter comparison feel dramatic (type scale, animation) — S

COULD SHIP IN: 2 weeks for the manual sorting mode + reveal system.
```

```
PROMPT 5: Comparison (Race/Battle)
BUILDABLE WITH:
  - Layout: Two-column CSS Grid (50%/50%), Tailwind grid-cols-2
  - Animation: motion/react for progress bars and dots simultaneously
  - Visualization: Two DotPlotVisualizer instances with synced playback

HARD PARTS:
  - Synchronizing two independent algorithm executions at the same speed — M
  - Determining winner at equivalent progress points (not wall time) — S
  - Winner announcement animation with glow + dim — S

COULD SHIP IN: 1-2 weeks (extends existing AlgorithmRace component
  with scatter plots instead of progress-bar-only view).
```

```
PROMPT 6: Mobile (Pocket Experience)
BUILDABLE WITH:
  - Layout: Flexbox column, Tailwind responsive (max-w-[375px] for testing)
  - Animation: motion/react with reduced spring complexity for perf
  - Visualization: SVG scatter plot with reduced dot count and radius

HARD PARTS:
  - Touch gesture handling (swipe = step, pinch = zoom) without
    conflicting with native scroll — L
  - Performance of 30-dot SVG animation on lower-end phones — M
  - Haptic API availability (only iOS Safari + some Android Chrome) — S

COULD SHIP IN: 2-3 weeks for responsive scatter plot + gesture controls.
```

```
PROMPT 7: Welcome (First Impression)
BUILDABLE WITH:
  - Layout: Centered flex column, Tailwind items-center justify-center min-h-screen
  - Animation: motion/react for bar entry cascade, swap springs, text reveal
  - Visualization: 10 bar divs with inline gradient styles

HARD PARTS:
  - Manual sorting interaction model (click two bars, validate adjacency,
    animate swap/no-swap) — M
  - Detecting "user has performed enough to reveal" heuristic — S
  - Transitioning from welcome to full app seamlessly — S

COULD SHIP IN: 1 week for the interactive welcome experience.
```

```
PROMPT 8: Dark + Light (Versatility)
BUILDABLE WITH:
  - Layout: CSS clip-path polygon for diagonal split, two scatter plot
    instances with different theme class wrappers
  - Animation: motion/react for dots (identical in both halves)
  - Visualization: Two SVG scatter plots, Tailwind dark: and light: variants

HARD PARTS:
  - Diagonal clip-path with antialiased edge — S
  - Maintaining exact visual parity between both halves — S
  - Light theme color tuning for all state colors (contrast ratio) — M

COULD SHIP IN: 1 week (primarily a CSS and color-token task).
```

---

## APPENDIX: COLOR REFERENCE

Sourced from `src/app/globals.css` and `src/lib/algorithms/visualization-colors.ts`:

| Token              | Dark                           | Hex Fallback |
|--------------------|--------------------------------|-------------|
| background         | hsl(228 15% 7%)                | #111319     |
| surface            | hsl(228 15% 11%)               | #191c28     |
| elevated           | hsl(228 15% 13%)               | #1e2130     |
| foreground         | hsl(220 14% 90%)               | #dee1e8     |
| foreground-muted   | hsl(220 10% 50%)               | #737b8c     |
| foreground-subtle  | hsl(220 10% 55%)               | #808899     |
| primary            | hsl(252 87% 67%)               | #7c5cfc     |
| primary-hover      | hsl(252 87% 60%)               | #6a46fa     |
| border             | hsl(228 15% 16%)               | #242738     |
| state comparing    | var(--state-active)            | #3b82f6     |
| state swapping     | var(--state-error)             | #ef4444     |
| state sorted       | var(--state-success)           | #22c55e     |
| state pivot        | --                             | #a855f7     |
| state active       | --                             | #f59e0b     |
| state found        | --                             | #06b6d4     |
| gauge green        | --                             | #22c55e     |
| gauge yellow       | --                             | #eab308     |
| gauge red          | --                             | #ef4444     |
