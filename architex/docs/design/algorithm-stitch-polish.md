# Architex Algorithm Visualizer -- Stitch Polish Mode Prompts

> Generated from source code audit of AlgorithmPanel.tsx, AlgorithmProperties.tsx, AlgorithmBottomPanel.tsx, AlgorithmCanvas.tsx, AlgorithmModule.tsx, ArrayVisualizer.tsx, ViewToggle.tsx, LiveDashboard.tsx, activity-bar.tsx, and globals.css.

---

## Phase 2: Current State Audit

### Activity Bar (Desktop)
- Width: 48px (`w-12`) vertical strip, left edge
- Background: `bg-sidebar` (hsl 228 15% 8%)
- Border: `border-r border-border`
- 13 module icons as 40x40px buttons (`h-10 w-10`), rounded-lg
  - System Design (LayoutDashboard), Algorithms (Binary), Data Structures (Boxes), LLD (PenTool), Database (Database), Distributed (Network), Networking (Globe), OS (Cpu), Concurrency (Layers), Security (ShieldCheck), ML Design (Brain), Interview (Trophy), Knowledge Graph (Share2)
- Active state: `bg-primary/15 text-primary` with a 2px-wide violet indicator bar on the left (`w-0.5 h-5 bg-primary`)
- Inactive: `text-foreground-muted`, hover `bg-sidebar-accent`
- Bottom section: NotificationBell + Settings gear button
- Each icon wrapped in Tooltip (side="right", sideOffset=8)
- Keyboard: ArrowUp/Down roving tabindex

### Sidebar (260px implied by standard layout)
- Full-height flex column, `overflow-hidden`
- Computing overlay: `bg-background/50` with 24px spinning border circle

**Header section:**
- `border-b border-sidebar-border px-3 py-3`
- Title: "Algorithm Visualizer" -- xs, semibold, uppercase, tracking-wider, text-foreground-muted

**Daily Challenge banner:**
- `rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 p-3 backdrop-blur-sm`
- Zap icon 12px + gradient text label "Daily Challenge"
- Body: xs text-foreground-muted with hard-coded copy: "Today: Predict how many comparisons Bubble Sort needs for [7, 2, 5, 1, 8]"

**Algorithm Selector (ALG-158):**
- Label: "Algorithm" (xs font-medium text-foreground-muted)
- Desktop: text input acting as searchable combobox, h-8, `rounded-xl border-border/30 bg-background/90 backdrop-blur-sm`
- Dropdown: `rounded-xl border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl max-h-60`
- Categories grouped with 10px uppercase headers: Sorting, Search, Greedy, Graph, Tree, DP, String, Backtracking, Geometry, Patterns, Design, Probabilistic, AI/ML
- Each item shows `{name} ({difficulty})`, selected item: `bg-primary/10 text-primary font-medium`
- Mobile: native `<select>` with `<optgroup>` fallback, same styling

**Compare Side-by-Side toggle (sorting only):**
- Full-width button h-7, `rounded-xl border`, toggles `comparisonMode`
- ON: `border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px...]`
- OFF: `border-border/30 bg-background text-foreground-muted hover:bg-elevated`
- When ON: secondary select for comparison algo

**Algorithm Info card:**
- `rounded-xl border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5`
- Description text xs
- Property pills: Stable/Unstable (green/amber), In-Place/Not-In-Place (blue/orange), `rounded-full px-2.5 py-0.5 text-[10px]`

**Input area (sorting / array mode):**
- Label: "Array Data" (xs font-medium)
- Textarea: 2 rows, `rounded-md border-border bg-background`, 500 char max, character counter
- Size slider: range 5-100, `accent-primary`, value displayed as mono text
- Presets: 6 pill buttons in flex-wrap -- Random, Nearly Sorted, Reverse, Few Unique, All Same, Single Element
  - Active: `bg-primary text-white`; Inactive: `bg-elevated text-foreground-muted`
- Worst Case button (for bubble/insertion/quick/heap/selection): `border-red-500/30 bg-red-500/5 text-red-500`
- Generate + Run buttons side by side (flex gap-2), each h-7 flex-1 rounded-md
  - Generate: `border-border bg-background` with Shuffle icon
  - Run: `bg-primary text-white` with Zap icon

**Other input modes:** Tree (operation select + value input), Graph (custom graph editor with nodes/edges text inputs), DP (per-algorithm inputs: fibonacci n, LCS strings, knapsack items), String (text + pattern), Backtracking (N-Queens slider 4-12)

**Playback controls (shown after Run):**
- Label: "Playback" (xs font-medium)
- Transport row (centered, gap-1):
  - Stop: 44x44 `rounded-xl border-border/30 bg-elevated/50 backdrop-blur-sm` with Square icon
  - Step Back: same shell with SkipBack
  - Play/Pause: 48x48 `rounded-full bg-primary text-white shadow-[0_0_20px_rgba(110,86,207,0.4)]` with hover scale-105
  - Step Forward: same as Step Back with SkipForward
  - All wrapped in Tooltip
- Predict Mode toggle: h-8 button, amber when on
- Step counter: "Step {n} of {total}" centered xs mono
- Speed pills: 0.25x, 0.5x, 1x, 2x, 4x -- `rounded-full px-2.5 py-1 text-[10px]`, active: `bg-primary/20 text-primary border-primary/30`

**Current Step card:**
- `rounded-xl border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5`
- Eye icon + gradient label "Current Step"
- Description in xs mono
- Pseudocode line reference

**Complexity Analysis section:**
- Time Complexity card: 3-col grid (Best/Avg/Worst) with colored mono values (green/amber/red)
- Space Complexity centered below
- Running counters: 2x2 grid of cards -- Comparisons (ArrowLeftRight), Swaps (Shuffle), Reads (Eye), Writes (Zap) -- each with icon, label, and large mono value

**Footer:**
- `border-t border-sidebar-border px-3 py-2`
- Static text: "Select an algorithm, set data, and press Run" in xs text-foreground-subtle

### Canvas Area

**Top-right floating toolbar (absolute right-3 top-3 z-10):**
- Row of 40x40 circular buttons with consistent styling:
  - Vars toggle (text "Vars" 10px)
  - Code panel toggle (Code2 icon)
  - Fullscreen/Presentation (Maximize2/Minimize2)
  - Share (Link2)
  - Export Steps (Printer)
  - Screenshot (Camera)
  - Record button (component)
  - Sound toggle (component)
- All: `rounded-full bg-popover/90 text-foreground-muted shadow-lg backdrop-blur-sm border-border`
- Active state: `bg-primary/20 text-primary border-primary/30`
- Focus: `ring-2 ring-primary ring-offset-2`

**View Toggle (top-left, absolute top-14 left-4 z-10):**
- 3-button radiogroup: Bars (ChartBar), Dots (CircleDot), Color Map (Palette)
- Container: `rounded-lg border-border/30 bg-background/70 p-0.5 backdrop-blur-md`
- Each button: 32x28px, active `bg-primary/20 text-primary`

**Array Visualizer (main visualization):**
- Container: `rounded-xl border-border/30 bg-gradient-to-b from-elevated/80 to-background px-2 pt-2`, height 400px (default 280)
- Bars: flex row, gap 2px, max-width 48px each, `rounded-t-md`
- States: default (gradient gray-blue), comparing (blue glow), swapping (red, dashed border), sorted (green, top border), pivot (purple ring), active (amber), found (cyan)
- Value labels above bars (hidden at 30+), 10px mono
- Index labels below (all at <=20, every 5th at <=50)
- Hover tooltip: `rounded-lg border-border/30 bg-background/80 backdrop-blur-md px-2 py-1` showing Value/Index/State
- Spotlight overlay dims non-active bars during playback
- VizLegend at bottom-right: comparing/swapping/sorted/pivot colored dots

**Live Dashboard (below bars during playback):**
- Complexity gauge (SVG semicircle), space bar, swap counter, comparison counter
- Only visible when `isPlaying && step`

**Other overlays:**
- DangerOverlay (worst-case warning)
- SortCelebration (completion confetti)
- AlgorithmRace (comparison mode banner)
- Code-alongside panel (left slide-out, w-80)
- Recursive call stack (right, top-16, w-32)
- Variables panel (right, bottom-16, w-52)
- DP Test Mode button (left-4 bottom-4)

**Empty states (per visualization type):**
- Large icon (64px, opacity-30), title (lg font-medium), description (sm max-w-md), Watch Demo button (`rounded-lg bg-primary px-5 py-2.5 text-sm`)
- Types: sorting (BarChart3), graph (Share2), tree (BarChart3), dp (Grid3X3), string (Type), backtracking (Grid3X3), geometry (Share2)

### Properties Panel (Right, ~260px)

**Header:** "Algorithm Info" (xs semibold uppercase tracking-wider text-foreground-muted), `border-b border-sidebar-border px-3 py-3`

**Content (scrollable):**
- Algorithm name (sm font-medium) + Mastery stars (5x Star icons, amber-400 fill when earned, subtle/30 otherwise)
- Description (xs text-foreground-muted)
- Prerequisites section ("Learn First:" label)
- Quick Summary card (rounded-xl, gradient label, numbered list)
- Common Mistakes card (amber border/bg)
- Real World Apps list
- Interview Tip card (amber)
- When to Use section
- Comparison Guide card (blue)
- Production Note card (emerald, with pre/code block)
- Complexity card: 2x2 grid (Best/Avg/Worst/Space) colored mono values
- Complexity intuition italic text
- Comparison side-by-side card (when comparison mode on, primary border)
- Property pills: Stable/Unstable, In-Place/Not-In-Place
- Pseudocode card: numbered lines, active line highlighted `bg-primary/20 text-primary`
- Complexity Comparison Chart: bar chart comparing theoretical vs measured at n=10,20,50,100
- Current Step card (Eye icon + step description)
- Recently Viewed list (last 5 algorithms)

### Bottom Panel (~200px height)

**Tab bar:** 7 tabs in horizontal row, `border-b border-border px-4`
- Step Details (Eye), Latency Bridge (Activity), System Context (Globe), Flashcards (Zap), Code (Code2), Code Lab (Terminal), Leaderboard (Trophy)
- Active: text-foreground + primary icon + 2px gradient underline
- Inactive: text-foreground-muted, hover text-foreground-subtle

**Tab content:**
- Steps: description (sm mono) + pseudocode line ref + 4 stat widgets (Comparisons/Swaps/Reads/Writes) with comparison B values
- Latency Bridge: separate component
- System Context: separate component
- Flashcards: Complexity quiz + Scenarios quiz + Debug Challenge sub-mode, score tracker, multiple-choice grid
- Code: Python implementation in pre/code block (max-h-60), or "not yet available" message
- Code Lab: textarea editor + Run Code button + sandboxed eval
- Leaderboard: Trophy icon, "Coming soon" placeholder

---

## Phase 3: Issues Found

### MISSING

- [ ] No loading skeleton for the sidebar when algorithm categories are being processed
- [ ] No empty state for the Properties panel before an algorithm is run
- [ ] No hover state on the Daily Challenge banner (should be interactive)
- [ ] No focus ring on preset pill buttons (Random, Nearly Sorted, etc.)
- [ ] No tooltip on the Generate button or the array textarea
- [ ] No transition on the step counter number change (should animate like a slot machine)
- [ ] No skeleton/shimmer for the Complexity Analysis cards when computing
- [ ] No tooltip on the Predict Mode button explaining what it does
- [ ] No hover state on the complexity values (Best/Avg/Worst) -- should show the actual formula
- [ ] No keyboard shortcut hints on the transport buttons (Space to play, Arrow keys to step)
- [ ] No progress bar or timeline scrubber for step navigation -- only step counter text
- [ ] No hover state on VizLegend items in the array visualizer
- [ ] No animation when the tab underline indicator moves between bottom panel tabs
- [ ] No scroll-to-active behavior in the algorithm dropdown combobox
- [ ] No separator lines between algorithm categories in the dropdown
- [ ] No icon badges or category color chips in the algorithm dropdown items
- [ ] No empty state animation for the Code tab when code is unavailable
- [ ] No copy-to-clipboard button on the Code tab or the Pseudocode card
- [ ] No hover tooltip on mastery stars explaining the rating
- [ ] No micro-interaction on the Run button (should pulse/glow on click)

### BROKEN/UGLY

- [ ] Preset pills have inconsistent border-radius (`rounded` = 4px) vs everything else (`rounded-xl` = 12px) -- AlgorithmPanel.tsx:1922
- [ ] Array textarea uses `rounded-md` (6px) while all other inputs use `rounded-xl` (12px) -- AlgorithmPanel.tsx:1854
- [ ] Tree/DP/String input fields use `rounded-md` (6px) while combobox uses `rounded-xl` -- inconsistent, AlgorithmPanel.tsx:1491,1661
- [ ] Footer text has no icon and feels dead -- just static text with no visual weight -- AlgorithmPanel.tsx:2244
- [ ] Speed pills wrap awkwardly at narrow sidebar widths -- no min-width constraint -- AlgorithmPanel.tsx:2113
- [ ] "B:" label in comparison step counter is cryptic -- should say the algorithm name -- AlgorithmPanel.tsx:2103
- [ ] Worst Case score box uses 3 separate `<p>` tags with no visual hierarchy -- AlgorithmPanel.tsx:1950-1959
- [ ] Tab bar in bottom panel has no gap between icon and label, making them feel cramped -- AlgorithmBottomPanel.tsx:566
- [ ] Leaderboard empty state (Trophy icon) looks lonely -- no illustration, no CTA -- AlgorithmBottomPanel.tsx:709-716
- [ ] Code Lab textarea has no line numbers or syntax highlighting -- AlgorithmBottomPanel.tsx:680
- [ ] The "alert()" result display in Code Lab is jarring -- should be an inline result panel -- AlgorithmBottomPanel.tsx:696
- [ ] Properties panel section spacing is inconsistent (mb-3 everywhere, no visual rhythm) -- AlgorithmProperties.tsx
- [ ] Array visualizer bar hover tooltip (`-top-12`) can clip above the container -- ArrayVisualizer.tsx:187
- [ ] View Toggle has no active indicator animation (just color swap, no sliding pill) -- ViewToggle.tsx:117
- [ ] Canvas floating buttons can overlap with the recursive call stack panel at narrow widths -- AlgorithmModule.tsx:1098 vs 1244
- [ ] Flashcard quiz options grid is always 2-col even when there are only 2 options (Yes/No) -- AlgorithmBottomPanel.tsx:427

### SHOULD ADD

- [ ] Timeline scrubber bar below the transport controls (draggable, showing progress)
- [ ] Animated number transitions on all counters (comparisons, swaps, reads, writes)
- [ ] Subtle pulse animation on the Play button when algorithm is ready but not started
- [ ] Glassmorphic depth on the floating canvas toolbar (more blur, subtle ring)
- [ ] Sliding pill indicator on the View Toggle instead of instant color change
- [ ] Keyboard shortcut badges on transport buttons (e.g., "Space" on Play)
- [ ] Gradient border glow on the active bottom panel tab
- [ ] Smooth scroll-snap behavior for sidebar overflow
- [ ] Loading shimmer on the Comparisons-at-Scale chart while data loads
- [ ] Subtle entry animations (fade-slide) for each Properties panel section
- [ ] Hover-reveal "copy" button on pseudocode block
- [ ] Tooltip with formula on complexity values (e.g., hover "O(n^2)" shows "n*(n-1)/2")
- [ ] Badge dot on the Daily Challenge banner showing if incomplete
- [ ] Smooth animated tab indicator that slides between bottom panel tabs

---

## Phase 4: Stitch Polish Prompts

---

### Prompt 1: Full Default View

```
Design a polished dark-mode UI for "Architex -- Algorithm Visualizer".
This is a premium redesign of an existing educational platform.
Keep the EXACT same layout -- improve visual quality to Apple/Linear level.

== VIEWPORT ==
1440x900 desktop. Pixel-perfect, no placeholders.

== LAYOUT (keep exactly as-is) ==
LEFT: Activity bar, 48px wide, vertical icon strip. 13 module icons (Binary icon active with violet indicator). Bottom: bell + gear.
SIDEBAR: ~260px wide. Header "ALGORITHM VISUALIZER". Daily Challenge banner. Algorithm combobox showing "Bubble Sort". Info card with "Stable" and "In-Place" pills. Array textarea with "5, 3, 8, 1, 9, 2, 7, 4, 6, 10". Size slider at 20. Six preset pills: Random (active), Nearly Sorted, Reverse, Few Unique, All Same, Single Element. "Try Worst Case" red button. Generate + Run buttons side by side. Footer: "Select an algorithm, set data, and press Run".
CANVAS: Remaining width. 15 bars in default gray-blue gradient, rounded tops, value labels on top, index labels below. VizLegend bottom-right. View Toggle top-left (Bars active). Floating toolbar top-right: Vars, Code, Fullscreen, Share, Export, Screenshot, Record, Sound -- 8 circular buttons.
RIGHT: Properties panel ~260px. "Algorithm Info" header. "Bubble Sort" name with 0/5 mastery stars. Description. Quick Summary numbered list. Common Mistakes amber card. Real World Apps list. Complexity card (Best O(n), Avg O(n^2), Worst O(n^2), Space O(1)). Pseudocode card with 7 lines. Recently Viewed list.
BOTTOM: ~200px. Tab bar: Step Details (active), Latency Bridge, System Context, Flashcards, Code, Code Lab, Leaderboard. Content: "Run an algorithm to see step-by-step details here."

== CURRENT ISSUES TO FIX ==
- Preset pills use rounded (4px) while everything else uses rounded-xl (12px) -- make all rounded-lg (8px)
- Array textarea uses rounded-md while combobox uses rounded-xl -- unify to rounded-xl
- Footer text is dead -- add a subtle keyboard shortcut hint: "Space to play, Arrow keys to step"
- No progress bar -- add a thin timeline scrubber placeholder below transport area
- Speed pills wrap awkwardly -- give them a contained row with equal widths
- Tab bar underline is instant -- show a smooth sliding indicator

== POLISH THESE ELEMENTS ==
- Activity bar icons: add 1px inner shadow when active, 2px violet glow
- Algorithm combobox: add a subtle search icon (magnifying glass) inside left
- Preset pills: consistent 8px radius, smooth hover scale(1.02) transition
- Size slider: custom thumb (12px circle with primary border and glow)
- Generate button: subtle border shimmer on hover
- Run button: gradient bg (primary to violet-400), pulse glow animation on idle
- Floating toolbar: increase backdrop-blur to 16px, add ring-1 ring-white/5
- Bar chart: subtle reflection gradient below bars (mirror at 15% opacity)
- VizLegend: glass card with rounded-lg, blur, and 1px ring
- Properties panel cards: staggered fade-in animation on mount
- Pseudocode: active line has left-2px violet border, not just bg highlight
- Complexity values: subtle glow matching their color (green glow on Best, etc.)
- Tab underline: 2px gradient that slides with a spring animation
- Mastery stars: subtle gold shimmer on filled stars

== ADD THESE MISSING ELEMENTS ==
- Loading skeleton shimmer on Properties panel before first run
- Tooltip on every icon button that lacks one
- Keyboard shortcut badges on transport buttons
- Timeline scrubber (thin gradient bar) below step counter
- Animated number counters (slot-machine style) on complexity stats
- Copy button on pseudocode card (top-right corner, appears on hover)
- Badge dot on Daily Challenge banner

== STYLE ==
Background: #0A0A0F (hsl 228 15% 7%)
Surface: #111118 (hsl 228 15% 11%)
Elevated: #16161F (hsl 228 15% 13%)
Hover: #1E1E2A (hsl 228 15% 19%)
Border: rgba(255,255,255,0.06) or #2A2A3A
Text primary: #E8E8F0
Text muted: #7C7C95 (hsl 220 10% 50%)
Text subtle: #808099 (hsl 220 10% 55%)
Primary: #8B5CF6 (hsl 252 87% 67%)
Primary hover: #7C3AED (hsl 252 87% 60%)
Success: #22C55E
Warning: #F59E0B
Error: #EF4444
Info: #3B82F6
Font: Inter for UI, JetBrains Mono for code/values.
Border radius: 12px (cards), 8px (pills/buttons), 9999px (circles).
Shadows: subtle colored glows, never harsh drop-shadows.

== EXACT CONTENT ==
Algorithm: "Bubble Sort"
Description: "Repeatedly swaps adjacent elements if they are in the wrong order."
Array: 5, 3, 8, 1, 9, 2, 7, 4, 6, 10
Complexity: Best O(n), Avg O(n^2), Worst O(n^2), Space O(1)
Stable badge, In-Place badge
Tab: "Step Details" active, showing empty state message
Pseudocode: "for i = 0 to n-2 / for j = 0 to n-i-2 / if arr[j] > arr[j+1] / swap(arr[j], arr[j+1]) / if no swaps: break"

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Linear, Raycast, Figma, Vercel Dashboard, Stripe Dashboard

== DO NOT ==
- Change layout positions or panel sizes
- Remove any functionality
- Use lorem ipsum or placeholder text
- Add features that don't exist in the code
- Use light mode or alternate themes
```

---

### Prompt 2: Active/Running State

```
Design a polished dark-mode UI for "Architex -- Algorithm Visualizer".
This is a premium redesign of an existing educational platform.
Keep the EXACT same layout -- improve visual quality to Apple/Linear level.
This shows the RUNNING state with algorithm mid-execution.

== VIEWPORT ==
1440x900 desktop.

== LAYOUT (keep exactly as-is) ==
LEFT: Activity bar, 48px. Binary icon active.
SIDEBAR: "ALGORITHM VISUALIZER" header. Bubble Sort selected. Array: "5, 3, 8, 1, 9". Playback controls visible: Stop, Step Back, PLAY (active/pulsing), Step Forward. Step "7 of 28". Speed "1x" active. Current Step card: "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap." Line 3 of pseudocode. Complexity Analysis: Time (Best O(n), Avg O(n^2), Worst O(n^2)). Running counters: Comparisons 12, Swaps 5, Reads 24, Writes 10.
CANVAS: 5 bars mid-sort. Bar at index 2 (value 8) and index 3 (value 1) are BLUE (comparing state) with glow. Bar at index 4 (value 9) is GREEN (sorted). Others default gray-blue. Spotlight effect: non-active bars dimmed to 40% opacity. Value labels visible. Index labels visible. Live Dashboard below bars: Complexity Gauge (semicircle SVG, needle at ~40%), Space bar (O(1) = 5%), Swap counter, Comparison counter. VizLegend showing comparing/swapping/sorted/pivot. View Toggle: Bars active.
RIGHT: Properties panel. "Bubble Sort" with 2/5 mastery stars filled. Pseudocode with LINE 3 highlighted ("if arr[j] > arr[j+1]") in violet. Step 7 card showing description. Complexity chart showing measured vs theoretical at n=5.
BOTTOM: "Step Details" tab active. Content: "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap." + "Pseudocode line 3" + Comparisons: 12, Swaps: 5, Reads: 24, Writes: 10 in stat widgets.

== CURRENT ISSUES TO FIX ==
- Step counter has no timeline scrubber -- add a draggable progress bar (7/28 = 25% filled)
- Comparisons/Swaps numbers don't animate -- add smooth counter transitions
- Play button needs clearer "playing" state -- show animated pause icon with ring pulse
- Spotlight dimming is binary -- add smooth gradient fade from active to inactive bars
- Live Dashboard gauge has no label explaining what green/yellow/red zones mean

== POLISH THESE ELEMENTS ==
- Comparing bars: animated blue glow pulsing at 1.5s interval, slight scale(1.03)
- Sorted bar: subtle green shimmer, top highlight line
- Spotlight: radial gradient centered on active bars, smooth 300ms transition
- Play button: ring pulse animation (expanding ring at 50% opacity), bg-primary with inner shadow
- Step counter: large mono font, slash between current/total, gradient text on current number
- Speed pills: active pill has subtle bounce on selection
- Current Step card: left 2px violet accent border, text slightly larger (13px)
- Complexity counters: animated odometer-style number transitions
- Live Dashboard gauge: colored arc segments (green/yellow/red), animated needle with spring physics
- Pseudocode active line: violet left border + bg-primary/15 + slight left indent animation
- Timeline scrubber: thin bar (3px), gradient fill matching primary, draggable thumb (8px circle)
- Properties mastery stars: 2 filled with gold glow, 3 empty with subtle outline

== ADD THESE MISSING ELEMENTS ==
- Timeline scrubber bar below step counter
- "Space" keyboard hint on Play button tooltip
- Animated transitions on counter values
- Gauge legend labels: "O(n)" / "O(n log n)" / "O(n^2)" below the semicircle
- Subtle particle trail on the gauge needle

== STYLE ==
Background: #0A0A0F
Surface: #111118
Elevated: #16161F
Border: rgba(255,255,255,0.06)
Text primary: #E8E8F0
Text muted: #7C7C95
Primary: #8B5CF6
Comparing blue: #3B82F6 with glow shadow 0 0 12px rgba(59,130,246,0.5)
Sorted green: #22C55E with glow shadow 0 0 8px rgba(34,197,94,0.3)
Swapping red: #EF4444
Pivot purple: #A855F7

== EXACT CONTENT ==
Algorithm: "Bubble Sort"
Array: [5, 3, 8, 1, 9] (mid-sort state: indices 0,1 already partially sorted)
Step 7 of 28
Description: "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap."
Comparisons: 12, Swaps: 5, Reads: 24, Writes: 10
Speed: 1x

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Linear, Raycast, Figma, Vercel Dashboard, Stripe

== DO NOT ==
- Change layout positions
- Remove functionality
- Use lorem ipsum
- Add features that don't exist
- Show a completed/celebration state
```

---

### Prompt 3: Mobile (375px)

```
Design a polished dark-mode MOBILE UI for "Architex -- Algorithm Visualizer".
This is a premium redesign of an existing educational platform.
Adapted from the desktop layout for 375px width.

== VIEWPORT ==
375x812 (iPhone 14 proportions). Pixel-perfect mobile.

== LAYOUT (mobile adaptation) ==
TOP: Status bar area.
CANVAS (full width, ~45% of screen):
  - 10 bars for array [5, 3, 8, 1, 9, 2, 7, 4, 6, 10] in default state
  - Bars fill width with 2px gaps, rounded tops
  - Value labels hidden (>10 elements on mobile)
  - Index labels shown every 2nd
  - View Toggle (3 icons) pinned top-left, smaller (28x24 buttons)
  - Floating toolbar collapsed to 3 icons: Fullscreen, Screenshot, Sound (top-right)
  - VizLegend as compact horizontal strip below bars
CONTROLS (below canvas, ~35% of screen, scrollable):
  - Algorithm selector as full-width native <select> with rounded-xl border
  - Compact info: algorithm name + Stable/In-Place pills inline
  - Array textarea (1 row, compact)
  - Size slider (full width)
  - Preset pills in 2-row grid (3 per row)
  - Generate + Run buttons full width stacked or side-by-side
  - Playback transport (centered row): Stop, Back, Play (larger 48px), Forward
  - Step counter: "Step 1 of 28" centered
  - Speed selector as horizontal scroll strip
BOTTOM NAV: 56px tall, 5 icons + "More" overflow
  - System Design, Algorithms (active), Data Structures, LLD, Database, More (...)
  - Active: violet text + top indicator bar
  - "More" opens bottom sheet with remaining 8 modules in 4-col grid

== CURRENT ISSUES TO FIX ==
- Floating toolbar buttons too close together on mobile -- use 36px buttons with 4px gap
- Preset pills clip at narrow widths -- use 2-row grid layout
- Properties panel and Bottom panel not visible on mobile -- they should be swipeable tabs below controls
- No bottom safe area padding -- add env(safe-area-inset-bottom)

== POLISH THESE ELEMENTS ==
- Bottom nav icons: 20px, with active violet fill and top indicator (2px bar, rounded)
- Algorithm select: full-width, 40px height, larger touch target
- Bars: slightly wider min-width on mobile (6px), keep 2px gap
- Play button: 48px, centered, prominent glow
- Preset pills: 36px height for touch targets, rounded-lg
- Slider thumb: 20px for easy touch dragging
- Step counter: 14px mono, centered
- Speed strip: horizontal scroll with snap, each pill 44px wide

== ADD THESE MISSING ELEMENTS ==
- Bottom sheet for Properties panel (swipe up from bottom)
- Haptic-style visual feedback on button taps (brief scale animation)
- Pull-to-refresh gesture hint at top of controls area
- Compact step description (one line, truncated with ellipsis)

== STYLE ==
Background: #0A0A0F
Surface: #111118
Elevated: #16161F
Border: rgba(255,255,255,0.06)
Text primary: #E8E8F0
Text muted: #7C7C95
Primary: #8B5CF6
Font: Inter, JetBrains Mono for values
All touch targets: minimum 44px

== EXACT CONTENT ==
Algorithm: "Bubble Sort"
Array: 5, 3, 8, 1, 9, 2, 7, 4, 6, 10
Bottom nav: System Design, Algorithms, Data Structures, LLD, Database, More

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Apple Music mobile, Linear mobile, Raycast, Figma mobile, Vercel mobile

== DO NOT ==
- Change the module navigation items
- Remove any functionality
- Use lorem ipsum
- Show desktop layout elements that don't fit
- Add features that don't exist
```

---

### Prompt 4: Sidebar Close-up (2x Zoom)

```
Design a polished dark-mode UI close-up for "Architex -- Algorithm Visualizer".
This is a ZOOMED 2x view of just the LEFT SIDEBAR (260px rendered at 520px).
Premium redesign -- Apple/Linear level visual quality.

== VIEWPORT ==
520x1800 (2x zoom of the 260px sidebar, full scroll height).

== LAYOUT (every element in order, top to bottom) ==
1. HEADER: "ALGORITHM VISUALIZER" in 10px uppercase, semibold, tracking-wider, text-foreground-muted. Border-bottom 1px.
2. DAILY CHALLENGE BANNER: Rounded-xl card. Gradient border (primary/20). Zap icon with violet glow. "Daily Challenge" gradient text label. Body: "Today: Predict how many comparisons Bubble Sort needs for [7, 2, 5, 1, 8]". Incomplete badge dot (tiny red circle, 6px).
3. ALGORITHM SELECTOR: "Algorithm" label. Searchable input showing "Bubble Sort" as placeholder. Magnifying glass icon inside left. Dropdown OPEN showing all 13 categories with separator lines between groups. "Sorting" header, then: Bubble Sort (selected, primary bg), Insertion Sort, Selection Sort, Merge Sort, Quick Sort, Heap Sort... each with difficulty badge. Scroll indicator at bottom.
4. COMPARE TOGGLE: Full-width pill button "Compare Side-by-Side" with Columns2 icon. Inactive state with subtle hover glow preview.
5. ALGORITHM INFO CARD: Rounded-xl glass card. "Repeatedly swaps adjacent elements..." description. "Stable" green pill + "In-Place" blue pill, both with colored glow shadows.
6. ARRAY DATA: "Array Data" label. Textarea showing "5, 3, 8, 1, 9, 2, 7, 4, 6, 10" with character counter "32/500". Rounded-xl border matching other inputs.
7. SIZE SLIDER: "Random Size" label + "20" value. Custom slider: track is 3px with gradient fill (primary to violet-400), thumb is 14px circle with primary border and soft glow. Min "5" and Max "100" labels.
8. PRESET PILLS: "Presets" label. 6 pills in flex-wrap: Random (active, bg-primary text-white), Nearly Sorted, Reverse, Few Unique, All Same, Single Element. All rounded-lg (8px), consistent size, hover scale(1.02).
9. WORST CASE BUTTON: "Try Worst Case" with Zap icon, red-500 border/text, rounded-xl.
10. GENERATE + RUN BUTTONS: Side by side. Generate: outlined, Shuffle icon. Run: filled primary gradient (primary to violet-400), Zap icon, subtle idle pulse glow.
11. PLAYBACK SECTION (shown as if result exists):
    - "Playback" label
    - Transport: Stop (square), Step Back, PLAY (large circle, gradient, glow), Step Forward. All with tooltips and keyboard hints.
    - Predict Mode toggle (amber pill)
    - Timeline scrubber: thin 3px bar, 25% filled (gradient), 8px thumb circle
    - Step counter: "Step 7 of 28" in centered mono, current number in gradient text
    - Speed pills: 0.25x, 0.5x, 1x (active with glow), 2x, 4x in equal-width row
12. CURRENT STEP CARD: Left 2px violet accent. Eye icon + "Current Step" gradient label. "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap." in 12px mono. "Line 3 of pseudocode" subtitle.
13. COMPLEXITY ANALYSIS: "Complexity Analysis" label.
    - Time Complexity card: 3-col (Best O(n) green, Avg O(n^2) amber, Worst O(n^2) red). Space O(1) blue centered below.
    - Running counters 2x2: Comparisons 12, Swaps 5, Reads 24, Writes 10. Each with icon, animated number, glass card.
14. FOOTER: Border-top. "Space to play, Arrow keys to step" with keyboard icon.

== POLISH THESE ELEMENTS ==
- Every input field: consistent rounded-xl, 1px border-border/30, bg-background/90, backdrop-blur-sm, focus ring-primary with glow
- Labels: 10px uppercase tracking-wider, consistent vertical spacing (8px below label)
- Cards: all rounded-xl with border-border/30, bg-elevated/50, backdrop-blur-sm
- Buttons: all have 150ms hover transition, cursor-pointer
- Slider: custom styled (no native appearance), gradient track, glowing thumb
- Transport buttons: 44px square with rounded-xl, center Play is 48px circle
- All text sizes: hierarchy of 10px (labels), 11px (body), 12px (values), 14px (headings)
- Consistent 12px horizontal padding, 8px vertical spacing between sections

== STYLE ==
Background: #0A0A0F
Surface: #111118
Elevated: #16161F
Border: rgba(255,255,255,0.06)
Primary: #8B5CF6
Primary gradient: #8B5CF6 to #A78BFA
Success: #22C55E, Warning: #F59E0B, Error: #EF4444, Info: #3B82F6
Font: Inter 400/500/600, JetBrains Mono for values

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Linear sidebar, Raycast command palette, Figma properties panel, Stripe Dashboard sidebar

== DO NOT ==
- Show the canvas, properties panel, or bottom panel
- Change the order or content of sidebar elements
- Use lorem ipsum
- Add controls that don't exist in the code
```

---

### Prompt 5: Canvas Close-up (2x Zoom)

```
Design a polished dark-mode UI close-up for "Architex -- Algorithm Visualizer".
This is a ZOOMED 2x view of just the CANVAS AREA during active playback.
Premium redesign -- Apple/Linear level visual quality.

== VIEWPORT ==
1200x900 (2x zoom of the ~600px canvas area).

== LAYOUT (every element) ==
BACKGROUND: Solid #0A0A0F (canvas-bg).
VIEW TOGGLE (top-left, 14px from top, 16px from left):
  - 3-button pill group in glass container: Bars (active), Dots, Color Map
  - Container: rounded-lg, bg-background/70, backdrop-blur-md, border-border/30, padding 2px
  - Active button: bg-primary/20, text-primary, with sliding pill indicator behind it
  - 32x28px each button, 3.5px icons
FLOATING TOOLBAR (top-right, 12px from edges):
  - 8 circular buttons in a row: Vars, Code, Fullscreen, Share, Export, Screenshot, Record, Sound
  - Each: 40px circle, bg-popover/90, backdrop-blur-16, border-border, shadow-lg, ring-1 ring-white/5
  - Active (Vars shown active): bg-primary/20, text-primary, border-primary/30
VISUALIZATION (centered, max-width 800px at 2x):
  - Container: rounded-xl, border-border/30, bg-gradient-to-b from-elevated/80 to-background, px-8 pt-8
  - 10 BARS for array [5, 3, 8, 1, 9, 2, 7, 4, 6, 10] mid-sort:
    - Index 2 (val 8): COMPARING state -- blue gradient bar, pulsing glow (0 0 12px rgba(59,130,246,0.5)), slight scale(1.03)
    - Index 3 (val 1): COMPARING state -- same blue treatment
    - Index 9 (val 10): SORTED state -- green gradient, top 2px white highlight, subtle green glow
    - Index 8 (val 9): SORTED state -- same green
    - Others: DEFAULT state -- gray-blue gradient (from #2A2A3A to #1E1E2A), dimmed to 40% via spotlight
  - SPOTLIGHT: radial gradient overlay centered on bars 2-3, fading from transparent center to rgba(0,0,0,0.6) at edges
  - VALUE LABELS: above each bar, 10px mono, colored matching bar state
  - INDEX LABELS: below bars, 12px mono text-foreground-subtle, shown for all 10
  - BAR HOVER TOOLTIP (shown on bar 2): glass card -12px above bar, "Value: 8 | Index: 2 | State: comparing"
VIZLEGEND (bottom-right of visualization):
  - Glass card: rounded-lg, bg-background/60, backdrop-blur-md, border-border/30, px-3 py-2
  - 4 items: blue dot "comparing", red dot "swapping", green dot "sorted", purple dot "pivot"
LIVE DASHBOARD (below visualization, full width):
  - Row of 4 glass widgets:
    1. Complexity Gauge: SVG semicircle, green/yellow/red arc segments, animated needle at ~40%, labels "O(n)" "O(n log n)" "O(n^2)" below
    2. Space Meter: vertical bar showing 5% filled (O(1)), label "O(1) Space"
    3. Comparisons counter: large "12" in 24px mono with subtle animated increment, "Comparisons" label, ArrowLeftRight icon
    4. Swaps counter: large "5" in 24px mono, "Swaps" label, Shuffle icon
  - Each widget: rounded-xl, border-border/30, bg-elevated/50, backdrop-blur-sm

== POLISH THESE ELEMENTS ==
- Bars: subtle inner gradient highlight (white 5% at top), rounded-t-md with 2px radius
- Comparing bars: animated glow pulse (box-shadow oscillating 8px-16px blue), colorblind pattern (dashed border)
- Sorted bars: top highlight line (2px white), green shimmer animation
- Spotlight: smooth radial gradient with feathered edges, 300ms transition when active indices change
- Hover tooltip: glass morphism (backdrop-blur-md, bg-background/80), appears with fade+translateY(-4px)
- VizLegend: each dot is 6px with matching glow shadow
- Dashboard gauge: arc stroke-width 8px, colored segments, needle with drop-shadow
- Dashboard numbers: tabular-nums font-feature, smooth counting animation
- Reflection effect: mirror the bars below at 10% opacity, gradient fade to transparent

== ADD THESE MISSING ELEMENTS ==
- Subtle grid pattern on canvas background (dot grid at 20px intervals, 3% opacity)
- Bar reflection below (mirrored, 10% opacity, gradient mask)
- Step description overlay: bottom-center of visualization, glass pill showing "Comparing indices 2 and 3"

== STYLE ==
Background: #0A0A0F
Elevated: #16161F
Border: rgba(255,255,255,0.06)
Default bar gradient: linear-gradient(to top, #1E1E2A, #2A2A3A)
Comparing: linear-gradient(to top, #1E40AF, #3B82F6) with glow
Sorted: linear-gradient(to top, #166534, #22C55E) with glow
Swapping: linear-gradient(to top, #991B1B, #EF4444)
Pivot: linear-gradient(to top, #6B21A8, #A855F7) with ring
Primary: #8B5CF6
Font: JetBrains Mono for all values/labels, Inter for UI text

== EXACT CONTENT ==
Array values: 5, 3, 8, 1, 9, 2, 7, 4, 6, 10
Comparing: indices 2 and 3
Sorted: indices 8 and 9
Comparisons: 12, Swaps: 5
Step description: "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap."

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Linear, Raycast, Figma canvas, Vercel Analytics charts, Apple Music visualizer

== DO NOT ==
- Show the sidebar, properties panel, or bottom panel
- Change visualization logic or bar positions
- Use lorem ipsum
- Add features beyond what exists in code
```

---

### Prompt 6: Properties + Bottom Panel Close-up (2x Zoom)

```
Design a polished dark-mode UI close-up for "Architex -- Algorithm Visualizer".
This is a ZOOMED 2x view of the RIGHT PROPERTIES PANEL (top) and BOTTOM PANEL (below).
Premium redesign -- Apple/Linear level visual quality.

== VIEWPORT ==
800x1600 (2x zoom, showing Properties panel ~520px wide on top, Bottom panel ~800px wide below).

== PROPERTIES PANEL (top section, full detail) ==
HEADER: "Algorithm Info" -- 10px uppercase semibold tracking-wider text-foreground-muted. Border-bottom 1px border-sidebar-border. px-12 py-12 (at 2x).
SCROLLABLE CONTENT (px-12 py-8):
1. ALGORITHM NAME ROW: "Bubble Sort" in 14px font-medium + 5 mastery stars (2 filled gold with shimmer, 3 empty outline). Stars 14px each.
2. DESCRIPTION: "Repeatedly steps through the list, compares adjacent elements, and swaps them if they are in the wrong order." in 12px text-foreground-muted.
3. PREREQUISITES: "Learn First: (none)" in 10px text-foreground-subtle.
4. QUICK SUMMARY CARD: rounded-xl, border-border/30, bg-elevated/50, backdrop-blur-sm, p-10 (2x).
   - Gradient label "Quick Summary" (primary to violet-400)
   - 3 numbered items: "1. Compare adjacent pairs" / "2. Swap if out of order" / "3. Repeat until no swaps needed"
5. COMMON MISTAKES CARD: rounded-xl, border-amber-500/30, bg-amber-500/5, amber glow shadow.
   - "Common Mistakes" amber label
   - "Forgetting the early exit optimization when no swaps occur in a pass"
6. REAL WORLD APPS: "Used In" label. Bullet list: "Small datasets in embedded systems", "Teaching sorting fundamentals"
7. INTERVIEW TIP CARD: amber border, "Always mention the early-exit optimization and that it is stable."
8. WHEN TO USE: "Small or nearly-sorted datasets where simplicity matters more than speed."
9. COMPLEXITY CARD: rounded-xl glass card.
   - BarChart3 icon + "Complexity" gradient label
   - 2x2 grid: Best O(n) green, Avg O(n^2) amber, Worst O(n^2) red, Space O(1) blue
   - Intuition italic: "Each pass bubbles the largest unsorted element to its final position."
10. PROPERTY PILLS: "Stable" green pill with glow + "In-Place" blue pill with glow.
11. PSEUDOCODE CARD: Code2 icon + "Pseudocode" gradient label.
    - 7 numbered lines in 11px mono, line 3 highlighted (violet left border + bg-primary/15):
      1. "for i = 0 to n-2"
      2. "  for j = 0 to n-i-2"
      3. "    if arr[j] > arr[j+1]"  <-- ACTIVE LINE
      4. "      swap(arr[j], arr[j+1])"
      5. "    swapped = true"
      6. "  if not swapped: break"
      7. "return arr"
    - Copy button (top-right, appears on hover): clipboard icon, 24px, text-foreground-subtle
12. COMPLEXITY CHART: bar chart at n=5,10,20,50,100. Blue bars (theoretical), amber bars (measured at n=5). Legend dots.
13. STEP DETAIL CARD: Eye icon + "Step 7" gradient label. "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap." mono 12px.
14. RECENTLY VIEWED: "Recently Viewed" label. 5 items: Bubble Sort (active, primary), Quick Sort, Merge Sort, Insertion Sort, Heap Sort.

== BOTTOM PANEL (below, separated by a visual divider) ==
TAB BAR: 7 tabs horizontal, border-bottom gradient.
  - Step Details (active): Eye icon primary, text-foreground, 2px gradient underline (primary to violet-400) with slide animation
  - Latency Bridge: Activity icon, text-foreground-muted
  - System Context: Globe icon
  - Flashcards: Zap icon
  - Code: Code2 icon
  - Code Lab: Terminal icon
  - Leaderboard: Trophy icon
  - Smooth sliding underline indicator that springs to active tab

TAB CONTENT (Step Details active):
  - Left side: "Comparing arr[2]=8 and arr[3]=1. 8 > 1, so swap." in 14px mono.
  - Below: "Pseudocode line 3" in 12px text-foreground-subtle.
  - Right side: 4 stat widgets in a row:
    1. Comparisons: ArrowLeftRight icon, "Comparisons" label, "12" large mono, "B: 8" in primary (comparison mode)
    2. Swaps: Shuffle icon, "Swaps" label, "5", "B: 3" in primary
    3. Reads: Eye icon, "Reads" label, "24"
    4. Writes: Zap icon, "Writes" label, "10"
  - Each widget: text-center, icon 14px, label 10px, value 14px mono font-medium

== POLISH THESE ELEMENTS ==
- Properties sections: staggered fade-slide-in animation on panel open (50ms between each)
- Mastery stars: filled ones have subtle gold particle shimmer, hover shows "2/5 mastery"
- Summary/Mistake/Tip cards: subtle left accent border matching their color (amber for mistakes, primary for summary)
- Pseudocode active line: smooth background transition (200ms), left border slides in
- Complexity chart: bars have entry animation (grow from bottom), hover shows exact value tooltip
- Tab underline: spring animation sliding between tabs (200ms, slight overshoot)
- Stat widgets: numbers use tabular-nums, animate on change with slot-machine effect
- Recently Viewed list: active item has left dot indicator, hover shows timestamp

== ADD THESE MISSING ELEMENTS ==
- Copy button on pseudocode (hover-reveal)
- Tooltip on mastery stars ("Run 3 more times to reach level 3")
- Separator lines between Properties panel sections (subtle 1px border-border/30)
- Smooth section collapse/expand affordance (chevron icons)

== STYLE ==
Background: #0A0A0F
Surface: #111118
Elevated: #16161F
Border: rgba(255,255,255,0.06)
Primary: #8B5CF6
Primary gradient: #8B5CF6 to #A78BFA
Gold (stars): #FBBF24 with glow 0 0 3px rgba(251,191,36,0.5)
Amber (warnings): #F59E0B
Success: #22C55E
Error: #EF4444
Info: #3B82F6
Font: Inter for UI, JetBrains Mono for code/pseudocode/values

== EXACT CONTENT ==
Algorithm: "Bubble Sort"
Step 7 of 28
Pseudocode line 3 active: "if arr[j] > arr[j+1]"
Comparisons: 12, Swaps: 5, Reads: 24, Writes: 10
Comparison B values: Comparisons 8, Swaps 3
Mastery: 2/5 stars
Recently viewed: Bubble Sort, Quick Sort, Merge Sort, Insertion Sort, Heap Sort
Complexity: Best O(n), Avg O(n^2), Worst O(n^2), Space O(1)

== MOOD ==
"The same app you know, but every pixel now feels intentional."

== REFERENCES ==
Linear properties panel, Figma design panel, Vercel Dashboard, Stripe API docs sidebar, Raycast

== DO NOT ==
- Show the sidebar, canvas, or activity bar
- Change content or section ordering
- Use lorem ipsum
- Add sections that don't exist in the code
- Simplify or remove any cards/sections
```
