# THE DEFINITIVE ALGORITHM VISUALIZER REVAMP
# ============================================

> This is THE prompt. The synthesis of 5 design documents (3,200 lines), 22 Stitch
> mockups, 80+ algorithm engines analyzed, 18 sorting engines fixed, and 13 new
> Phase 1-4 components built. Every finding has been distilled into actionable changes.
>
> **Who executes this**: A senior frontend engineer (or Claude with max effort).
> **What you read first**: This document IS the spec. Everything you need is here.
> **What you produce**: A transformed Algorithm Visualizer that makes people say
> "I've never seen anything like this."

---

## PART 0: THE 12 SINS OF THE CURRENT UI

These are not opinions. These are bugs, measured in lines of code and user confusion.

| # | Sin | Evidence | Impact |
|---|-----|----------|--------|
| 1 | **God Component Sidebar** — 2000+ lines, 50+ useState, every algorithm category dumps controls into one scroll | `AlgorithmPanel.tsx:462-530` | Users see sorting controls when viewing Dijkstra |
| 2 | **8 Identical Empty States** — 130 lines of copy-pasted JSX differing only in icon and title | `AlgorithmCanvas.tsx:432-562` | Canvas feels generic, not inviting |
| 3 | **Playback Buried in Sidebar** — Play/Pause/Step below config inputs, requires scrolling | `AlgorithmPanel.tsx` transport below inputs | Most-used controls hardest to reach |
| 4 | **Dead Properties Panel** — Shows same static text on step 1 and step 500 | `AlgorithmProperties.tsx:170-400` | Right panel is wasted space during playback |
| 5 | **7-Tab Dumping Ground** — Bottom panel has "Leaderboard: Coming soon" and `alert()` code execution | `AlgorithmBottomPanel.tsx:708-715, 689-699` | Tabs with wildly different maturity |
| 6 | **8-Button Inscrutable Toolbar** — 8 identical circles with only icons, always visible | `AlgorithmModule.tsx:1098-1192` | User must hover each to discover purpose |
| 7 | **View Toggle Has No Labels** — 3 icons (bar/dot/colormap) with no text | `ViewToggle.tsx` | First-time user doesn't know what they mean |
| 8 | **ColorMap Height Mismatch** — Bar view = 400px, ColorMap = 120px | `AlgorithmCanvas.tsx:381` | Views feel like different features, not same data |
| 9 | **Mastery Stars Dead End** — Auto-increments to 1/5 on first run, no path to 2-5 | `AlgorithmModule.tsx:779-786` | Broken promise of progression |
| 10 | **Sorting-Only Choreography** — Sound/spotlight/choreography only in ArrayVisualizer | `ArrayVisualizer.tsx:94-97` | Graph/tree/DP visualizers feel lifeless |
| 11 | **Comparison Mode Hidden** — Race mode is a toggle buried in sidebar scroll | `AlgorithmPanel.tsx:503-504` | Users miss the most impressive feature |
| 12 | **No Step-to-Bar Visual Link** — Step says "Compare arr[2] and arr[3]" but nothing points to WHICH bars | `AlgorithmBottomPanel.tsx:591-654` | Text and visualization are disconnected |

---

## PART 1: THE 5 REVAMP PRINCIPLES

Every decision in this revamp must pass one of these tests:

```
P1: "CANVAS IS KING"
    The visualization gets 85%+ of screen real estate.
    Panels are servants, not competitors.
    Test: Can you see what the algorithm is doing from 3 feet away?

P2: "PROGRESSIVE DISCLOSURE"
    Show only what's needed NOW. Hide everything else.
    First load: just bars + play button. Everything else: on hover/click.
    Test: Could a 10-year-old figure out how to start?

P3: "THE ALGORITHM TEACHES ITSELF"
    The visual IS the explanation. No text needed.
    Color = meaning, motion = operation, sound = progress.
    Test: Could you understand the algorithm with descriptions hidden?

P4: "EVERY FRAME IS SHAREABLE"
    At any moment, the screen looks beautiful enough to screenshot.
    No broken states, no half-rendered panels, no "loading..." text.
    Test: Would this screenshot look good in a portfolio?

P5: "KEYBOARD FIRST, MOUSE ENHANCED"
    Space = play/pause, Arrow keys = step, Cmd+K = algorithm picker.
    Power users never touch the mouse.
    Test: Can you run a full sort using only keyboard?
```

---

## PART 2: THE REVAMP — WAVE BY WAVE

### WAVE 1: LAYOUT REVOLUTION (the biggest impact)

#### 1A. Kill the God Component Sidebar → Context-Aware Cockpit

**Current**: AlgorithmPanel.tsx — 2000 lines, one component, all categories.

**Target**: Split into 3 focused sections:

```
┌──────────────────────────┐
│ ALGORITHM PICKER          │  ← Section 1: Searchable, Cmd+K shortcut
│ ┌──────────────────────┐ │     Categories as horizontal chips, not headers
│ │ 🔍 Search algos...   │ │     Show algorithm CARD when selected (not just name)
│ │ Sorting | Graph | DP │ │     Include difficulty badge + mastery stars
│ │ ┌──────────────────┐ │ │
│ │ │ 🫧 Bubble Sort   │ │ │
│ │ │ ⭐⭐☆☆☆ Beginner │ │ │
│ │ └──────────────────┘ │ │
│ └──────────────────────┘ │
├──────────────────────────┤
│ CONFIGURATION             │  ← Section 2: ONLY controls for current category
│                           │     Sorting → array input + presets + size
│ Array: 38, 27, 43, 3...  │     Graph → graph builder + source node
│ [Random] [Reverse] [Sorted] │  Tree → value input + operation
│ Size: ●────────── 15     │     Show ONLY what's relevant
│                           │
│ ⚡ Try Worst Case         │
│ [━━━━━ Generate ━━━━━]   │
│ [━━━━━━ ▶ Run ━━━━━━━]   │
├──────────────────────────┤
│ DESCRIPTION               │  ← Section 3: Collapsible, starts collapsed
│ "Ever sorted a hand..."  │     Algorithm story/description
│ [Show more ▾]            │     WHY explanation, not just WHAT
└──────────────────────────┘
```

**Key changes**:
- Category chips (horizontal scroll) replace the 13-category dropdown headers
- Config section shows ONLY relevant controls (if sorting → array input; if graph → no array input)
- Description section is collapsible, starts COLLAPSED (not taking 200px of prime sidebar space)
- Generate + Run buttons are ALWAYS visible (sticky bottom), not buried below the fold

**Files to modify**:
- `AlgorithmPanel.tsx` — Extract into 3 sub-components: `AlgorithmPicker.tsx`, `AlgorithmConfig.tsx`, `AlgorithmDescription.tsx`
- Move playback controls OUT of sidebar (see Wave 1B)

#### 1B. Liberate Playback → Floating Transport Bar

**Current**: Play/Pause/Step/Speed buried in sidebar scroll.

**Target**: Floating transport bar at bottom of canvas (like YouTube/Spotify):

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏮  ◀  ▶  ▶▶  ⏭   ─────●━━━━━━━━━━━━━━━━━━━━━━━━━━━━─────  │
│                         ◆           ◆                 ◆         │
│                      Pass 1      Pivot          Sorted!         │
│                                                          42/84  │
│  0.5x  1x  ●2x  4x         🔊  ⛶                              │
└─────────────────────────────────────────────────────────────────┘
```

- Use the ALREADY BUILT `TimelineScrubber.tsx` component
- Add speed pills (0.5x, 1x, 2x, 4x) inline
- Add sound toggle + fullscreen inline
- Glassmorphism: `bg-background/80 backdrop-blur-xl border border-border/30 rounded-xl`
- AUTO-HIDES when not playing (appears on hover or when playback starts)
- Keyboard: Space=play/pause, Left/Right=step, Shift+Left/Right=milestone jump

**Files to modify**:
- `AlgorithmModule.tsx` — Move transport from sidebar render to canvas overlay
- Wire `TimelineScrubber.tsx` to actual PlaybackController (currently unwired)
- Wire `onScrub` callback to `PlaybackController.jumpTo()`

#### 1C. Unify Empty States → One Inviting Welcome

**Current**: 8 copy-pasted empty states with different icons.

**Target**: ONE shared empty state component with personality:

```tsx
// New file: src/components/canvas/overlays/AlgorithmWelcome.tsx
interface WelcomeProps {
  category: VisualizationType;
  onDemo: (category: string) => void;
}
```

```
┌─────────────────────────────────────────────────┐
│                                                   │
│          ┌──────────────────────────┐            │
│          │    [Category Icon]       │            │
│          │                          │            │
│          │  What does Bubble Sort   │            │
│          │  SOUND like?             │            │
│          │                          │            │
│          │  [▶ Watch Demo — 15 sec] │            │
│          │                          │            │
│          │  or press Space to start │            │
│          └──────────────────────────┘            │
│                                                   │
│        ← Pick an algorithm from the sidebar      │
│                                                   │
└─────────────────────────────────────────────────┘
```

- Engaging question that changes per algorithm category (not generic "Select an algorithm")
- Single demo button with estimated time
- Keyboard hint at the bottom
- Subtle animated dots or particles in background (Canvas2D, very subtle)

#### 1D. Make All Views Same Height

**Current**: Bar=400px, ColorMap=120px, DotPlot=400px

**Target**: ALL views render at the same height (400px). ColorMap gets a taller layout with the strip at full height, showing the pattern at a glance.

**File**: `AlgorithmCanvas.tsx` — change `height={120}` to `height={400}` for ColorMapVisualizer.

#### 1E. Add Labels to View Toggle

**Current**: 3 icons with no text.

**Target**: Icons + text labels: "Bars", "Dots", "Map" — each label visible next to its icon.

**File**: `ViewToggle.tsx` — add text labels, widen segments to accommodate.

---

### WAVE 2: COMPONENTS & INTERACTIONS

#### 2A. Toolbar → 3 Visible + Overflow Menu

**Current**: 8 identical floating circles.

**Target**: Only 3 primary actions visible. Rest in "..." overflow:

```
[🔊] [⛶] [···]
              └─ Code Panel
                 Variables
                 Share Link
                 Export Steps
                 Screenshot
                 Record
```

- Sound and Fullscreen are always visible (most-used)
- Everything else in a dropdown menu
- The menu uses `cmdk` or a simple Radix dropdown

**File**: `AlgorithmModule.tsx:1098-1192` — replace 8 buttons with 3 + overflow

#### 2B. Step Description → Visual Link to Bars

**Current**: "Compare arr[2] and arr[3]" text at top of canvas.

**Target**: Step description with VISUAL ARROWS pointing to the active bars:

```
     Step 42: Compare 54 and 28
              ↓           ↓
        ┌─────┐     ┌─────┐
        │  54 │     │  28 │
        │█████│     │███  │
        └─────┘     └─────┘
```

- CSS lines connecting the description pill to the highlighted bars
- Or: move the description to appear DIRECTLY between/above the active bars
- The description becomes part of the visualization, not separate chrome

#### 2C. Properties Panel → Live During Playback

**Current**: Static text that never changes during a run.

**Target**: During playback, properties panel transforms:

```
┌──────────────────────────┐
│ LIVE EXECUTION TRACE      │
│                           │
│ ┌───────────────────────┐ │
│ │ COMPLEXITY GAUGE      │ │   ← The gauge from LiveDashboard
│ │    [SVG Arc]          │ │      moves to properties panel
│ │   42 comparisons      │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ PSEUDOCODE            │ │   ← Active line highlighted
│ │ 1. for i = 0..n-1    │ │
│ │ 2.   for j = 0..n-i  │ │
│ │ 3. →   if a[j]>a[j+1]│ │   ← arrow points to active line
│ │ 4.       swap         │ │
│ └───────────────────────┘ │
│                           │
│ VARIABLES                 │
│ i = 3, j = 5, temp = 28  │   ← Live variable trace
│                           │
│ CALL STACK                │
│ └─ sort(0, 14)            │   ← For recursive algorithms
│    └─ partition(0, 14)    │
└──────────────────────────┘
```

- When NOT playing: show the current static info (description, complexity, tips)
- When playing: transform into a live execution trace
- Move variables panel and call stack FROM the canvas overlay INTO properties panel
- Move LiveDashboard gauge FROM below the bars INTO properties panel

#### 2D. Bottom Panel → Focused 4 Tabs

**Current**: 7 tabs including "Coming soon" leaderboard and `alert()` code execution.

**Target**: 4 meaningful tabs:

| Tab | Content | Status |
|-----|---------|--------|
| **Step Log** | Scrolling list of all steps with timestamps, not just current step | Keep, enhance |
| **System Context** | Where this algorithm is used in real systems (already built, good) | Keep |
| **Code** | Editable code with INLINE output (not alert), syntax highlighted | Fix code execution |
| **Flashcards** | Already built, works | Keep |

**Remove**: Latency Bridge (merge into System Context), Code Lab (merge into Code with inline output), Leaderboard (remove "Coming soon" placeholder).

#### 2E. Comparison Mode → Prominent Feature, Not Hidden Toggle

**Current**: Checkbox buried in sidebar.

**Target**: A prominent split-screen button in the transport bar:

```
┌──────────────────────────────────────────────────┐
│  ⏮ ▶ ⏭  ●━━━━━━━━━━━  42/84  │  [⚔ Race]  │  │
└──────────────────────────────────────────────────┘
                                     ↑
                           Click → enters race mode
                           Shows algorithm picker for opponent
```

When activated, the AlgorithmRace banner (already built) appears at top, and the canvas splits.

---

### WAVE 3: ANIMATION & MOTION

#### 3A. Extend Choreography to Graph/Tree/DP

**Current**: Only ArrayVisualizer uses `getChoreography()`.

**Target**: Create choreography configs for non-sorting visualizers:

```typescript
// graph-choreography.ts
const GRAPH_CHOREOGRAPHY = {
  'bfs': { nodeSpring: springs.smooth, edgeSpeed: 'wave', frontierGlow: true },
  'dfs': { nodeSpring: springs.snappy, edgeSpeed: 'quick', backtrackDim: true },
  'dijkstra': { nodeSpring: springs.gentle, edgeSpeed: 'ripple', distanceGlow: true },
};

// tree-choreography.ts  
const TREE_CHOREOGRAPHY = {
  'bst-insert': { nodeSpring: springs.bouncy, pathHighlight: 'trail' },
  'avl-tree': { rotationSpring: springs.stiff, balanceShake: true },
  'heap-operations': { siftSpring: springs.bouncy, extractDrop: true },
};
```

- GraphVisualizer: nodes ripple outward for BFS, dive deep for DFS
- TreeVisualizer: rotations have a physical "swinging" feel
- DPVisualizer: cells fill in a wave pattern, optimal path glows

#### 3B. Sound for Non-Sorting Algorithms

**Current**: Sounds only fire for sorting steps.

**Target**: Extend `useAlgorithmSound` to detect graph/tree/DP operations:

- Graph: "visit node" = soft chime, "relax edge" = connect sound, "backtrack" = backtrack womp
- Tree: "insert" = ascending tone, "rotate" = whoosh, "delete" = descending tone
- DP: "fill cell" = tick (pitch varies with value), "optimal path" = ascending arpeggio

#### 3C. Celebration for ALL Algorithm Types

**Current**: `SortCelebration` only fires for sorting.

**Target**: Fire celebration when ANY algorithm completes:
- Graph: "Path found!" or "All nodes visited!" with confetti
- Tree: "Operation complete!" with a tree-themed celebration
- DP: "Optimal solution found!" with the optimal path glowing gold
- Backtracking: "Solution found!" with the N-Queens board lighting up

---

### WAVE 4: POLISH & EDGE CASES

#### 4A. Loading Skeleton When Switching Algorithms
Show a shimmer skeleton in the sidebar config section for 150ms when switching categories (sorting → graph). This prevents layout shift.

#### 4B. Tooltips on EVERYTHING
Every icon button, every pill, every badge gets a tooltip. Use existing Radix Tooltip component.

#### 4C. Keyboard Shortcut Sheet
Cmd+/ or ? opens a modal showing all keyboard shortcuts:
- Space: play/pause
- Left/Right: step
- Shift+Left/Right: milestone jump
- 1-4: speed presets
- Cmd+K: algorithm picker
- V: cycle view (bar → dot → colormap)
- S: toggle sound
- F: fullscreen
- Esc: exit fullscreen/close panels

#### 4D. Mobile Layout
- Bottom tab bar: "Algorithms | Canvas | Info"
- Swipe left/right to switch tabs
- Canvas is full-width with touch-friendly 44px buttons
- Algorithm picker as bottom sheet (not sidebar)
- Transport bar adapts to compact layout

#### 4E. Remove Dead Code
- Delete "Leaderboard: Coming soon" tab
- Delete `alert()` code execution → replace with inline result panel
- Delete unused imports in AlgorithmPanel.tsx after splitting
- Delete duplicate empty state blocks → replace with shared component

---

## PART 3: TECH STACK RULES (NON-NEGOTIABLE)

```
R1.  CSS variables ONLY — never hardcode colors. var(--foreground), var(--primary), etc.
R2.  Tailwind classes — never inline styles except dynamic values (positions, sizes).
R3.  motion/react — never CSS transitions for complex animations.
R4.  Spring physics — { type: 'spring', stiffness: 300, damping: 25 } not { duration: 0.3 }.
R5.  useReducedMotion() — every animation has a fallback.
R6.  arraySnapshot — every sorting engine includes array state in steps (already done).
R7.  Zustand primitive selectors — never (s) => ({ x: s.x, y: s.y }).
R8.  shadcn/ui + Radix — prefer over custom components.
R9.  Lucide React icons — don't add new icon packages.
R10. Test in browser — start dev server, verify visually after every change.
```

---

## PART 4: EXECUTION ORDER

```
WAVE 1: Layout Revolution          (highest impact, do first)
  1A. Split sidebar god component → 3 focused sub-components
  1B. Float transport bar at bottom of canvas (wire TimelineScrubber)
  1C. Unify empty states into one welcome component  
  1D. ColorMap height → 400px (same as bar view)
  1E. View toggle labels

WAVE 2: Components & Interactions  (user-facing quality)
  2A. Toolbar → 3 visible + overflow menu
  2B. Step description → visual link to bars
  2C. Properties → live during playback (move gauge + variables there)
  2D. Bottom panel → 4 focused tabs (remove dead ones)
  2E. Race mode → prominent button in transport bar

WAVE 3: Animation & Motion         (the "alive" feeling for ALL algorithms)
  3A. Choreography for graph/tree/DP
  3B. Sound for non-sorting algorithms
  3C. Celebration for all algorithm types

WAVE 4: Polish & Edge Cases        (professional finish)
  4A. Loading skeletons
  4B. Tooltips everywhere
  4C. Keyboard shortcut sheet
  4D. Mobile layout
  4E. Remove dead code
```

---

## PART 5: VERIFICATION CHECKLIST

After EACH wave, verify:

```bash
# Type check
npx tsc --noEmit 2>&1 | grep -v node_modules | tail -5

# Tests
npx vitest run src/__tests__/lib/algorithms/content-correctness.test.ts

# Dev server
pnpm dev
```

Visual checks:
```
□ Dark mode looks correct
□ All 18 sorting algorithms visualize correctly (bars move)
□ Graph/tree/DP algorithms run and highlight correctly
□ Sound plays on step changes (when enabled)
□ Celebration fires on completion
□ View toggle switches between bar/dot/colormap
□ Timeline scrubber drags and jumps to milestones
□ Live dashboard shows gauge + odometer during playback
□ Danger overlay fires on worst-case Quick Sort
□ Race mode shows progress bars
□ Mobile layout works at 375px
□ Keyboard shortcuts all functional
□ No console errors
□ No layout shift
```

---

## PART 6: THE ONE SENTENCE TEST

When this revamp is complete, a user should be able to:

**Open the Algorithm Visualizer, press Space, and UNDERSTAND Bubble Sort
just by watching — the cautious bar movements, the ascending chime as elements
sort, the spotlight following the action, the gauge filling up, and the confetti
burst when it completes. No text needed. The visualization IS the teacher.**

That is the bar. Hit it.
