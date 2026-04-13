# Architex Algorithm Visualizer -- Pixel-Perfect UI Specification

> Generated from codebase analysis of 21 source files.
> Every value below is extracted from production code -- not approximated.

---

## PHASE 1: SCREEN MAP

### 1.1 Default View (First Load, Empty Canvas)
- Sidebar panel rendered with Bubble Sort pre-selected (`SORTING_ALGORITHMS[0].id`)
- Canvas shows empty `bg-background` area with demo CTA cards (sorting, graph, tree, DP, string, backtracking, geometry)
- No playback controls visible (result is null)
- Properties panel shows no data
- Bottom panel shows tabs but no content
- Onboarding tour overlay appears on first visit (`useFirstEncounter('algorithm-module')`)

### 1.2 Algorithm Selected, Not Running
- Algorithm chosen in combobox; visualization type determined by `getVisualizationType()`
- For sorting: textarea for array input visible, size slider (5-100), preset buttons, Generate and Run buttons
- For graph/tree/DP/string/backtracking/geometry: category-specific input fields shown
- Canvas still empty or shows static array bars from Generate
- No playback section, no step description, no complexity counters

### 1.3 Algorithm Running (Playing)
- Playback section visible: transport buttons (Stop, Step Back, Play/Pause, Step Forward)
- Speed selector pills: 0.25x, 0.5x, 1x, 2x, 4x
- Step counter: "Step N of M"
- Current step description card with pseudocode line reference
- Complexity analysis card: Best/Avg/Worst time + space
- Running counters: comparisons and swaps (with optional danger-counter class)
- Canvas shows animated visualization with Spotlight effect
- LiveDashboard overlay: gauge, odometer counters, memory bar
- TimelineScrubber at bottom of canvas
- ViewToggle (bars/dots/colormap) for sorting -- top-left z-10
- Sound engine active (tick/whoosh sounds per step)

### 1.4 Algorithm Paused Mid-Step
- Same as running but Play icon shown instead of Pause
- Predict Mode optionally active: "What happens next?" prompt with option buttons
- Step-back and step-forward buttons enabled based on current index
- Spotlight gradient frozen at current active indices
- Timeline scrubber handle at current position; draggable

### 1.5 Algorithm Completed (Celebration)
- `SortCelebration` overlay: confetti canvas (80-120 particles), rainbow gradient sweep (3px), stats banner
- Auto-dismiss after 4000ms; Escape key or X button to dismiss early
- Stats: total steps, comparisons, swaps
- All bars in `sorted` state (green)
- Playback controls still visible for review/step-through

### 1.6 Comparison / Race Mode
- `comparisonMode` toggle active in sidebar
- Canvas splits into two halves with `border-r border-border` divider
- `AlgorithmRace` banner at top showing dual progress bars
- Left panel: Algorithm A; Right panel: Algorithm B
- Each half shows its own step counter, comparisons, swaps
- Winner announced with Trophy icon when both finish

### 1.7 Worst-Case Danger State
- `DangerOverlay` activated when `isDangerZone()` returns true
- Red vignette: `radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.15) 100%)`
- Warning badge: top-right, `border-red-500/30 bg-red-500/10 backdrop-blur-md`
- Canvas shakes: `danger-shake` animation 0.4s ease-in-out x3
- Comparison counter turns red with `danger-pulse` animation
- Error sound plays via `soundEngine.play('error')`
- Badge auto-dismisses after 5000ms

### 1.8 Error State (Visualization Error Boundary)
- `VisualizerErrorBoundary` renders fallback UI
- Centered layout: warning emoji, "Visualization Error" title, description text
- "Try Again" button: `rounded-md bg-primary px-4 py-2 text-sm font-medium text-white`
- Resets error state and calls `onReset`

### 1.9 Visualization Views
- **Bars** (default): `ArrayVisualizer` -- vertical bars, height proportional to value, 280px default height
- **Dots**: `DotPlotVisualizer` -- SVG scatter plot, 400px default height, padding `{top:24, right:24, bottom:32, left:36}`
- **Colormap**: `ColorMapVisualizer` -- grid cells colored by value

### 1.10 Fullscreen / Presentation Mode
- `fixed inset-0 z-50 bg-background` applied to canvas container
- Escape key exits fullscreen
- Toggle button switches Maximize2/Minimize2 icon

### 1.11 Mobile View
- Combobox replaced with native `<select>` (hidden on sm+, shown below sm)
- Sidebar stacks vertically
- Canvas takes full width

---

## PHASE 2: LAYOUT GRID

```
+------+------------+----------------------------------+---------+
| ACT  |  SIDEBAR   |           CANVAS                 | PROPS   |
| 48px |  260px     |          flex-1                  | 280px   |
|      | AlgoSelect | ViewToggle(z-10)    Buttons(z-10)|         |
|      | Input      | VISUALIZATION AREA               |         |
|      | Gen + Run  | Spotlight(z-1) LiveDash(bot-left) |         |
|      | Playback   | Danger(z-30) Celebration(z-30)   |         |
|      | StepDesc   | TimelineScrubber(z-50)           |         |
|      | Complexity |                                  |         |
+------+------------+----------------------------------+---------+
|       BOTTOM PANEL (auto): Code | Vars | Latency | Context  |
+------------------------------------------------------------------+
|                      STATUS BAR (32px)                           |
+------------------------------------------------------------------+
```

### Exact Dimensions
- Activity Bar: 48px wide, full height
- Sidebar Panel: 260px wide, full height, `overflow-y: auto`
- Canvas Area: `flex-1` (fills remaining width)
- Properties Panel: 280px wide, full height
- Bottom Panel: auto height, collapsible
- Status Bar: 32px tall, full width

---

## PHASE 3: COMPONENT INVENTORY

### 3.1 Algorithm Selector (Combobox)

```yaml
component: "AlgorithmSelector"
  type: searchable combobox (desktop) / native select (mobile)
  position: sidebar, top section
  file: src/components/canvas/panels/AlgorithmPanel.tsx:1241
  width: 100% of sidebar content
  height: 32px (h-8)
  padding: px-2
  font: system-ui, 14px (text-sm), 400
  border-radius: 12px (rounded-xl)
  border: 1px solid var(--border) at 30% opacity (border-border/30)
  background: var(--background) at 90% opacity + backdrop-blur-sm
  color:
    default: var(--foreground)
    placeholder: var(--foreground-subtle)
    focus: border-primary, ring-1 ring-primary
  dropdown:
    position: absolute z-20 mt-1
    max-height: 240px (max-h-60)
    border-radius: 12px (rounded-xl)
    background: var(--background)/90 backdrop-blur-xl
    shadow: shadow-2xl
    category-header: text-[10px] font-semibold uppercase tracking-wider text-foreground-muted px-2 py-1
    item: px-3 py-1.5 text-sm hover:bg-elevated
    item-active: bg-primary/10 text-primary font-medium
  keyboard: Escape closes dropdown and blurs input
  a11y: aria-label="Search algorithms"
  mobile: hidden on sm+, native <select> shown below sm breakpoint
```

### 3.2 Array Input (Textarea)

```yaml
component: "ArrayInput"
  type: textarea
  position: sidebar, below algorithm selector (sorting category)
  width: 100%
  rows: 2
  max-length: 500
  padding: px-2 py-1.5
  font: monospace (font-mono), 14px (text-sm)
  border-radius: 6px (rounded-md)
  border: 1px solid var(--border)
  background: var(--background)
  color: var(--foreground)
  placeholder: "e.g. 5, 3, 8, 1, 9, 2, 7, 4, 6, 10" text-foreground-subtle
  focus: border-primary ring-1 ring-primary
  counter: text-[9px] text-foreground-subtle, shows "{length}/500"
  resize: vertical (resize-y)
```

### 3.3 Array Size Slider

```yaml
component: "ArraySizeSlider"
  type: range input
  position: sidebar, below array input
  width: 100%
  height: 4px track (h-1)
  min: 5
  max: 100
  default: 20
  appearance: none, rounded-full
  track-color: var(--border)
  accent-color: var(--primary) (accent-primary)
  cursor: pointer
  label: "Random Size" text-[10px] font-medium text-foreground-subtle
  value-display: text-[10px] font-mono font-medium text-foreground-muted
  range-labels: "5" and "100" at each end, text-[9px] text-foreground-subtle
```

### 3.4 Preset Buttons

```yaml
component: "PresetButtons"
  type: button group (flex-wrap gap-1)
  position: sidebar, below size slider
  label: "Presets" text-[10px] font-medium text-foreground-subtle
  options: Random, Nearly Sorted, Reverse, Few Unique, All Same, Single Element
  button:
    padding: px-1.5 py-0.5
    font: text-[10px] font-medium
    border-radius: 4px (rounded)
    states:
      default: bg-elevated text-foreground-muted
      hover: text-foreground
      active/selected: bg-primary text-white
    animation: transition-colors
```

### 3.5 Generate Button

```yaml
component: "GenerateButton"
  type: button
  position: sidebar, in flex row with Run button
  width: flex-1
  height: 28px (h-7)
  padding: (centered content)
  font: text-xs font-medium
  border-radius: 6px (rounded-md)
  border: 1px solid var(--border)
  background: var(--background)
  color: var(--foreground)
  icon: Shuffle (lucide), h-3 w-3, gap-1.5
  hover: bg-elevated
  animation: transition-colors
```

### 3.6 Run Button

```yaml
component: "RunButton"
  type: button
  position: sidebar, in flex row with Generate button
  width: flex-1
  height: 28px (h-7)
  padding: (centered content)
  font: text-xs font-medium
  border-radius: 6px (rounded-md)
  background: var(--primary)
  color: white
  icon: Zap (lucide), h-3 w-3, gap-1.5
  hover: bg-primary/90
  animation: transition-colors
  a11y: triggers algorithm execution
```

### 3.7 Playback Transport Controls

```yaml
component: "PlaybackTransport"
  type: button group (flex-wrap items-center justify-center gap-1)
  position: sidebar, playback section

  stop-button:
    size: 44x44px (h-11 w-11)
    border-radius: 12px (rounded-xl)
    border: 1px solid var(--border)/30
    background: var(--elevated)/50 + backdrop-blur-sm
    icon: Square h-3.5 w-3.5
    color: var(--foreground-muted)
    hover: bg-elevated text-foreground shadow-[0_0_10px_rgba(110,86,207,0.15)]
    aria-label: "Stop and reset"

  step-back-button:
    size: 44x44px (h-11 w-11)
    same styling as stop
    icon: SkipBack h-3.5 w-3.5
    aria-label: "Previous step"

  play-pause-button:
    size: 48x48px (h-12 w-12)
    border-radius: 50% (rounded-full)
    background: var(--primary)
    color: white
    icon: Play h-4 w-4 (offset translate-x-[1px]) / Pause h-4 w-4
    shadow: 0_0_20px_rgba(110,86,207,0.4)
    hover: shadow-[0_0_30px_rgba(110,86,207,0.6)] scale-105
    aria-label: "Play animation" / "Pause animation"

  step-forward-button:
    size: 44x44px (h-11 w-11)
    same styling as stop
    icon: SkipForward h-3.5 w-3.5
    aria-label: "Next step"
```

### 3.8 Speed Selector

```yaml
component: "SpeedSelector"
  type: pill button group
  position: sidebar, below transport
  options: [0.25, 0.5, 1, 2, 4]
  layout: flex flex-1 flex-wrap gap-1 with Clock icon and "Speed" label
  pill:
    padding: px-2.5 py-1
    font: text-[10px] font-medium
    border-radius: 50% width (rounded-full)
    states:
      default: bg-elevated/50 text-foreground-muted
      hover: text-foreground bg-elevated
      selected: bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(110,86,207,0.2)]
    animation: transition-all
```

### 3.9 Predict Mode Toggle

```yaml
component: "PredictToggle"
  type: button
  position: sidebar, below transport, centered
  height: 32px (h-8)
  padding: px-2
  font: text-[10px] font-medium
  border-radius: 6px (rounded-md)
  states:
    off: bg-elevated text-foreground-muted
    on: bg-amber-500/20 text-amber-500 border-amber-500/30
  label: "Predict" (off) / "Predict ON (N/M)" (on)
```

### 3.10 View Toggle (Bars/Dots/Colormap)

```yaml
component: "ViewToggle"
  file: src/components/canvas/overlays/ViewToggle.tsx
  type: radiogroup
  position: canvas, absolute top-14 left-4 z-10
  layout: inline-flex items-center gap-0.5 p-0.5
  container:
    border-radius: 8px (rounded-lg)
    border: 1px solid var(--border)/30
    background: var(--background)/70 + backdrop-blur-md
  button:
    size: 32x28px (width:32, height:28)
    border-radius: 6px (rounded-md)
    icon: ChartBar / CircleDot / Palette, h-3.5 w-3.5
    states:
      active: bg-primary/20 text-primary
      inactive: text-foreground-muted hover:text-foreground
    animation: transition-colors duration-150
  keyboard: ArrowRight/ArrowDown = next, ArrowLeft/ArrowUp = previous
  a11y: role="radiogroup" aria-label="Visualization view", each button role="radio" aria-checked
  persistence: localStorage key "architex-viz-view"
```

### 3.11 Worst Case Challenge Button

```yaml
component: "WorstCaseButton"
  type: button
  position: sidebar, above Generate/Run for applicable algorithms
  width: 100%
  height: 28px (h-7)
  padding: gap-1.5
  font: text-xs font-medium
  border-radius: 6px (rounded-md)
  border: 1px solid var(--state-error)/30 (border-red-500/30)
  background: var(--state-error)/5 (bg-red-500/5)
  color: var(--state-error) (text-red-500)
  icon: Zap h-3 w-3
  hover: bg-red-500/10
  score-card: mt-1.5 rounded-md border-red-500/20 bg-red-500/5 p-1.5
```

### 3.12 Live Dashboard

```yaml
component: "LiveDashboard"
  file: src/components/canvas/overlays/LiveDashboard.tsx
  position: canvas overlay, bottom-left area
  sub-components:
    ComplexityGauge:
      size: 120x72px
      arc-radius: 46px
      stroke-width: 8px
      zones: green (0-60deg #22c55e), yellow (60-120deg #eab308), red (120-180deg #ef4444)
      needle: stroke-width 2, currentColor
      label: text-[11px] font-mono font-medium text-foreground-muted tabular-nums
      animation: springs.smooth (200/25/1.0)
    OdometerCounter:
      width: 100px
      digit-height: 24px
      min-digits: 4 (zero-padded)
      digit-width: 16px
      container: rounded-md border-border/20 bg-background/50
      font: font-mono text-sm font-semibold text-foreground
      label: text-[10px] font-medium uppercase tracking-wider text-foreground-subtle
      animation: springs.snappy (300/30/0.8)
    MemoryBar:
      width: 80px
      bar-height: 12px (h-3)
      container: rounded-full border-border/20 bg-background/50
      label: text-[10px] font-medium uppercase tracking-wider text-foreground-subtle
```

### 3.13 Timeline Scrubber

```yaml
component: "TimelineScrubber"
  file: src/components/canvas/overlays/TimelineScrubber.tsx
  position: canvas, absolute bottom-4 left-4 right-4 z-50
  container:
    padding: px-4 py-3
    border-radius: 12px (rounded-xl)
    border: 1px solid var(--border)/30
    background: var(--background)/80 + backdrop-blur-xl + shadow-lg
  transport-buttons:
    size: 28x28px (h-7 w-7)
    border-radius: 8px (rounded-lg)
    border: 1px solid var(--border)/20
    background: var(--background)/50 + backdrop-blur-sm
    icon: h-3.5 w-3.5
    hover: bg-background/80 text-foreground
    focus: ring-2 ring-primary/50
    disabled: opacity-30 pointer-events-none
  track:
    height: 4px (h-1)
    border-radius: full
    background: var(--border)/30
    fill: bg-primary
  scrubber-handle:
    size: 16x16px (h-4 w-4)
    border-radius: 50% (rounded-full)
    background: var(--primary)
    ring: 2px ring-primary/30
    shadow: shadow-md shadow-primary/20
    dragging: scale-110
    animation: springs.snappy
  milestone-marker:
    size: 10x10px (h-2.5 w-2.5)
    shape: diamond (rotate-45 rounded-[1px])
    color: #f59e0b (amber-400)
    shadow: shadow-sm shadow-amber-400/30
    hover: scale-125
    tooltip: text-[10px] font-medium, bg-background/95 border-border/40 backdrop-blur-sm
  step-counter: min-w-[56px] text-right font-mono text-xs tabular-nums text-muted-foreground
  keyboard: ArrowLeft=back, ArrowRight=forward, Space=play/pause
  a11y: role="slider" aria-valuenow, aria-valuemin=0, aria-valuemax, aria-label="Algorithm timeline scrubber"
```

### 3.14 Sort Celebration Overlay

```yaml
component: "SortCelebration"
  file: src/components/canvas/overlays/SortCelebration.tsx
  position: absolute inset-0 z-30 pointer-events-none
  confetti: 80-120 particles, Canvas2D, colors [#8B5CF6,#3B82F6,#22C55E,#F59E0B,#EF4444,#EC4899]
    shapes: rect 4-8px / circle r2-4px, gravity 0.6, wind 0.15, duration 2500ms
  rainbow: 3px, linear-gradient(90deg, red->amber->green->blue->violet), 1.5s ease-out
  stats-banner: absolute bottom-4 mx-auto, rounded-xl bg-background/80 backdrop-blur-xl px-5 py-3
    entry: springs.bouncy from y:40, close: 24px circle -right-2 -top-2
  auto-dismiss: 4000ms, Escape to dismiss
  reduced-motion: no canvas/rainbow, instant banner
```

### 3.15 Danger Overlay

```yaml
component: "DangerOverlay"
  file: src/components/canvas/overlays/DangerOverlay.tsx
  position: absolute inset-0 z-30 pointer-events-none
  vignette: radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.15) 100%)
  shake: 0.4s ease-in-out x3 (1.2s total)
  badge: absolute right-3 top-3 z-40, rounded-lg red-500/10 backdrop-blur-md px-3 py-2
    icon: AlertTriangle h-4 w-4, text: text-sm font-medium text-red-300
    entry: springs.bouncy from x:40, auto-dismiss 5000ms
  counter: color #ef4444, danger-pulse 0.5s x3
  sound: soundEngine.play('error')
```

### 3.16 Algorithm Race Banner

```yaml
component: "AlgorithmRace"
  file: src/components/canvas/overlays/AlgorithmRace.tsx
  position: top of comparison canvas
  progress-row: name w-[130px] truncate text-xs font-medium font-mono, flex-1 bar, locale-formatted stats
  result: Trophy icon with "X WINS!" or "TIE!"
```

### 3.17 Spotlight Effect

```yaml
component: "Spotlight"
  file: src/components/canvas/overlays/Spotlight.tsx
  position: absolute top-0 left-0 z-1 pointer-events-none
  width: max(active-range + 2-bar padding, 120px, 30% container)
  background: radial-gradient(ellipse at center, rgba(110,86,207,0.12) 0%, rgba(110,86,207,0.06) 40%, transparent 70%)
  animation: springs.smooth; visible only when playing with active indices and motion allowed
  bar-dimming: inactive=0.7, sorted=0.9
```

### 3.18 Canvas Floating Action Buttons

```yaml
component: "CanvasFloatingButtons"
  position: absolute right-3 top-3 z-10, flex items-center gap-2
  buttons: [Vars, Code, Fullscreen, Share, Export, Record, Screenshot]
  size: 40x40px (icon-only) or h-10 px-3 (text), rounded-full
  style: bg-popover/90 shadow-lg backdrop-blur-sm border-border text-foreground-muted
  hover: bg-accent text-foreground | focus: ring-2 ring-primary/50
  active: bg-primary/20 text-primary border-primary/30 | icon: h-4 w-4
```

### 3.19 Step Description Card

```yaml
component: "StepDescription"
  position: sidebar, below playback controls
  border-radius: 12px (rounded-xl)
  border: 1px solid var(--border)/30
  background: var(--elevated)/50 + backdrop-blur-sm
  padding: 10px (p-2.5)
  header: Eye icon h-3 w-3, gradient text "CURRENT STEP" text-[10px] font-semibold uppercase tracking-wider
  gradient: bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent
  description: text-xs font-mono text-foreground
  line-ref: text-[10px] text-foreground-subtle
```

### 3.20 Complexity Analysis Card

```yaml
component: "ComplexityAnalysis"
  position: sidebar, below step description
  container: rounded-xl border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5
  header: BarChart3 icon, gradient text "TIME COMPLEXITY"
  grid: 3 columns (Best/Avg/Worst)
    labels: text-[10px] text-foreground-subtle
    values: text-xs font-mono font-medium
    best-color: text-difficulty-easy (var(--state-success))
    avg-color: text-difficulty-medium (var(--state-warning))
    worst-color: text-difficulty-expert (var(--state-error))
  space: text-[10px] label, text-xs font-mono font-medium text-state-active
```

### 3.21 Code Panel (Slide-In)

```yaml
component: "CodePanel"
  position: absolute left-0 top-0 bottom-0 z-10
  width: 320px (w-80)
  background: var(--background)/95 + backdrop-blur
  border-right: 1px solid var(--border)
  padding: 16px (p-4)
  header: text-xs font-semibold uppercase tracking-wider text-foreground-muted
  code-container: rounded-md bg-elevated border-border p-3
  code: text-[11px] font-mono text-foreground leading-relaxed, max-h-96 overflow-auto
  active-line: bg-primary/20 rounded text-primary
  line-numbers: text-foreground-subtle opacity-50
```

---

## PHASE 4: SPACING RULES

| Token | Value | Usage |
|---|---|---|
| Panel padding | 10px (p-2.5) | Inside glassmorphism cards |
| Section margin-bottom | 12px (mb-3) | Between sidebar sections |
| Label margin-bottom | 4px (mb-1) | Label to input gap |
| Section label font | text-xs font-medium text-foreground-muted | All section headers in sidebar |
| Sub-label font | text-[10px] font-medium text-foreground-subtle | Nested labels (presets, sliders) |
| Button group gap | 4px (gap-1) | Preset buttons, speed pills |
| Transport button gap | 4px (gap-1) | Playback controls |
| Icon-to-text gap | 6px (gap-1.5) | Inside buttons with icons |
| Card internal gap | 6px (gap-1.5) | Icon + header text |
| Grid gap | 6px (gap-1.5) | Complexity grid cells |
| Floating button gap | 8px (gap-2) | Canvas top-right buttons |
| Inline badge padding | px-1.5 py-0.5 | Preset pills |
| Speed pill padding | px-2.5 py-1 | Speed selector |
| Stats banner padding | px-5 py-3 | Celebration stats |
| Timeline padding | px-4 py-3 | Scrubber container |
| Tooltip padding | px-2 py-1 | All tooltips |
| Legend padding | px-3 py-1.5 | Visualization legend |

---

## PHASE 5: INTERACTION STATES TABLE

| Element | Default | Hover | Active/Selected | Focus | Disabled |
|---|---|---|---|---|---|
| Combobox | bg-background/90 border-border/30 text-foreground | -- | -- | border-primary ring-1 ring-primary | -- |
| Dropdown item | text-sm text-foreground | bg-elevated | bg-primary/10 text-primary font-medium | -- | -- |
| Preset button | bg-elevated text-foreground-muted | text-foreground | bg-primary text-white | -- | -- |
| Generate button | bg-background border-border text-foreground | bg-elevated | -- | -- | -- |
| Run button | bg-primary text-white | bg-primary/90 | -- | -- | -- |
| Transport (stop/step) | bg-elevated/50 text-foreground-muted border-border/30 | bg-elevated text-foreground shadow-glow | -- | -- | -- |
| Play/Pause | bg-primary text-white shadow-violet-glow | shadow-stronger scale-105 | -- | -- | -- |
| Speed pill (off) | bg-elevated/50 text-foreground-muted | text-foreground bg-elevated | -- | -- | -- |
| Speed pill (on) | bg-primary/20 text-primary border-primary/30 shadow-glow | -- | -- | -- | -- |
| View toggle (off) | text-foreground-muted | text-foreground | -- | -- | -- |
| View toggle (on) | bg-primary/20 text-primary | -- | -- | -- | -- |
| Worst case btn | bg-red-500/5 text-red-500 border-red-500/30 | bg-red-500/10 | -- | -- | -- |
| Floating btn (off) | bg-popover/90 text-foreground-muted | bg-accent text-foreground | bg-primary/20 text-primary | ring-2 ring-primary/50 | -- |
| Scrubber transport | bg-background/50 text-muted-foreground | bg-background/80 text-foreground | -- | ring-2 ring-primary/50 | opacity-30 |
| Predict toggle | bg-elevated text-foreground-muted | text-foreground | bg-amber-500/20 text-amber-500 | -- | -- |

---

## PHASE 6: ANIMATION TIMING TABLE

| Animation | Config | Easing | Reduced Motion |
|---|---|---|---|
| Bar height | springs.smooth | spring 200/25/1.0 | instant snap |
| Bar swap (bubble) | custom | spring 180/25/1.4 | instant snap |
| Bar swap (quick) | custom | spring 350/30/0.6 | instant snap |
| Bar swap (merge) | custom | spring 220/28/0.9 | instant snap |
| Sorted pulse | springs.bouncy | spring 400/20/0.5 | no pulse |
| Spotlight follow | springs.smooth | spring 200/25/1.0 | not rendered |
| Gauge needle | springs.smooth | spring 200/25/1.0 | instant snap |
| Odometer digit | springs.snappy | spring 300/30/0.8 | instant snap |
| Celebration banner | springs.bouncy | spring 400/20/0.5 | instant opacity |
| Danger badge | springs.bouncy | spring 400/20/0.5 | instant opacity |
| Danger vignette | tween 300ms | ease | instant |
| Danger shake | CSS 400ms x3 | ease-in-out | none |
| Rainbow sweep | CSS 1500ms | ease-out forwards | not rendered |
| Timeline handle | springs.snappy | spring 300/30/0.8 | instant snap |
| Tooltip appear | tween 100ms | ease | instant |
| Button press | tween 150ms | ease | instant |
| Panel transition | tween 200ms | ease-out | instant |
| Confetti | canvas2D RAF 2500ms | physics sim | not rendered |

### Spring Physics Reference

| Spring Name | Stiffness | Damping | Mass | Character |
|---|---|---|---|---|
| snappy | 300 | 30 | 0.8 | Quick, decisive, minimal overshoot |
| smooth | 200 | 25 | 1.0 | Fluid, elegant |
| bouncy | 400 | 20 | 0.5 | Playful overshoot |
| stiff | 500 | 35 | 1.0 | Precise, mechanical |
| gentle | 150 | 20 | 1.2 | Slow, weighted |

---

## PHASE 7: RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Changes |
|---|---|---|
| Desktop | >=1280px | Full layout: activity bar + sidebar + canvas + properties + bottom panel |
| Laptop | 1024-1279px | Same layout, properties panel may narrow |
| Tablet | 768-1023px | Sidebar collapses or overlays; combobox still custom; canvas fills more |
| Mobile | <768px | Native `<select>` replaces combobox (`sm:hidden` / `hidden sm:block`); sidebar stacks above canvas; properties and bottom panel collapse to tabs |

### Breakpoint tokens (globals.css)
`--bp-sm`: 640px | `--bp-md`: 768px | `--bp-lg`: 1024px | `--bp-xl`: 1280px | `--bp-2xl`: 1536px

### Key responsive behaviors
- Combobox: custom dropdown (`hidden sm:block`) vs native `<select>` (`sm:hidden`)
- Canvas buttons: maintain position; Timeline scrubber uses `left-4 right-4` for margin
- Celebration banner: `inset-x-0 mx-auto w-fit` centers on any width

---

## PHASE 8: COLOR TOKENS (Dark / Light)

### Background Layers

| Token | Dark | Light |
|---|---|---|
| `--background` | hsl(228 15% 7%) | hsl(228 5% 99%) |
| `--surface` | hsl(228 15% 11%) | hsl(228 5% 97%) |
| `--surface-elevated` | hsl(228 15% 16%) | hsl(228 5% 95%) |
| `--elevated` | hsl(228 15% 13%) | hsl(228 5% 96%) |
| `--overlay` | hsl(228 15% 19%) | hsl(228 5% 94%) |

### Foreground

| Token | Dark | Light |
|---|---|---|
| `--foreground` | hsl(220 14% 90%) | hsl(228 15% 10%) |
| `--foreground-muted` | hsl(220 10% 50%) | hsl(220 10% 40%) |
| `--foreground-subtle` | hsl(220 10% 55%) | hsl(220 10% 60%) |

### Primary (Violet Accent)

| Token | Dark | Light |
|---|---|---|
| `--primary` | hsl(252 87% 67%) | hsl(252 87% 55%) |
| `--primary-foreground` | hsl(0 0% 100%) | hsl(0 0% 100%) |
| `--primary-hover` | hsl(252 87% 60%) | hsl(252 87% 48%) |

### Borders

| Token | Dark | Light |
|---|---|---|
| `--border` | hsl(228 15% 16%) | hsl(220 13% 91%) |
| `--border-subtle` | hsl(228 15% 12%) | (inherits) |
| `--border-strong` | hsl(228 14% 24%) | (inherits) |
| `--border-focus` | hsl(252 87% 67%) | (inherits) |

### Panel Colors

| Token | Dark | Light |
|---|---|---|
| `--sidebar` | hsl(228 15% 8%) | hsl(0 0% 98%) |
| `--sidebar-border` | hsl(228 15% 14%) | hsl(220 13% 91%) |
| `--canvas-bg` | hsl(228 15% 6%) | hsl(0 0% 99%) |
| `--statusbar` | hsl(228 15% 8%) | hsl(0 0% 97%) |

### Semantic States

| Token | Dark | Light |
|---|---|---|
| `--state-active` | hsl(217 91% 60%) | hsl(217 91% 50%) |
| `--state-success` | hsl(142 71% 45%) | hsl(142 71% 35%) |
| `--state-warning` | hsl(38 92% 50%) | hsl(38 92% 45%) |
| `--state-error` | hsl(0 72% 51%) | hsl(0 72% 45%) |
| `--state-processing` | hsl(271 81% 56%) | hsl(271 81% 50%) |

### Algorithm Visualization Colors (sorting)

| State | CSS Variable | Hex Fallback |
|---|---|---|
| default | `var(--foreground-subtle)` | #6b7280 |
| comparing | `var(--state-active)` | #3b82f6 |
| swapping | `var(--state-error)` | #ef4444 |
| sorted | `var(--state-success)` | #22c55e |
| pivot | (direct) | #a855f7 |
| active | (direct) | #f59e0b |
| found | (direct) | #06b6d4 |

### Shadows
- `--shadow-sm`: 0 1px 2px 0 hsla(0 0% 0% / 0.3)
- `--shadow-md`: 0 4px 6px -1px hsla(0 0% 0% / 0.4), 0 2px 4px -2px hsla(0 0% 0% / 0.3)
- `--shadow-lg`: 0 10px 15px -3px hsla(0 0% 0% / 0.4), 0 4px 6px -4px hsla(0 0% 0% / 0.3)

---

## PHASE 9: IMPLEMENTATION CHECKLIST

### 9.1 AlgorithmPanel (Sidebar)
- **File**: `src/components/canvas/panels/AlgorithmPanel.tsx`
- **Props**: `AlgorithmPanelCallbacks` (12 optional callbacks for step/array/graph/tree/DP/string/geometry changes)
- **States**: selectedAlgoId, arrayInput, currentArray, result, playing, speed, stepIndex, currentStep, comparisonMode, predictMode, computing, arraySize (5-100), sortPreset, nQueensSize (4-12)
- **Animation**: transition-colors on all buttons, transition-all on speed pills and combobox
- **A11y**: aria-label on all inputs and buttons, TooltipProvider wrapping transport and speed controls
- **Visual test**: verify combobox dropdown z-index, verify all 13 algorithm categories render, verify native select fallback below 640px

### 9.2 AlgorithmCanvas (Center)
- **File**: `src/components/modules/algorithm/AlgorithmCanvas.tsx`
- **Props**: `AlgorithmCanvasProps` (values, states, visualizationType, graph, tree, dpTable, comparison, etc.)
- **States**: vizView (bars/dots/colormap via useVisualizationView hook)
- **Sub-renderers**: ArrayVisualizer, GraphVisualizer, TreeVisualizer, DPVisualizer, StringMatchVisualizer, GridVisualizer, GeometryVisualizer
- **Overlays**: ViewToggle, LiveDashboard, SortCelebration, DangerOverlay, AlgorithmRace, Spotlight
- **A11y**: aria-hidden on decorative overlays (Spotlight, confetti canvas)
- **Visual test**: verify each visualization type renders correctly, verify comparison split layout, verify overlay stacking order (z-1 spotlight < z-10 toggle < z-30 celebration/danger < z-50 scrubber)

### 9.3 AlgorithmProperties (Right Panel)
- **File**: `src/components/modules/algorithm/AlgorithmProperties.tsx`
- **Props**: algoId, result
- **Content**: ComplexityComparisonChart (theoretical vs actual bar chart), algorithm info cards
- **Chart colors**: theoretical=#3b82f6, actual=#f59e0b
- **Visual test**: verify chart renders for sorting algorithms, verify null state for non-sorting

### 9.4 AlgorithmBottomPanel
- **File**: `src/components/modules/algorithm/AlgorithmBottomPanel.tsx`
- **Tabs**: Code (Python implementations), Variables, Latency Bridge, System Context
- **Content**: syntax-highlighted code blocks, step variable extraction, latency bridge panel, system context selector
- **Visual test**: verify tab switching, verify Python code renders for supported algorithms

### 9.5 ArrayVisualizer
- **File**: `src/components/canvas/overlays/ArrayVisualizer.tsx`
- **Props**: values, states, height (default 280), traceMode, algorithmId, isPlaying
- **Constants**: MIN_BAR_HEIGHT=8, BAR_GAP=2, LABEL_HEIGHT=20, VALUE_LABEL_OFFSET=4
- **Animation**: per-algorithm choreography via getChoreography(), springs from motion.ts
- **Visual test**: bar heights proportional, state color transitions, Spotlight dimming

### 9.6 DotPlotVisualizer
- **File**: `src/components/canvas/overlays/DotPlotVisualizer.tsx` -- SVG viewBox 600w, dot radius adaptive (6/5/4/3 by array size)

### 9.7 ViewToggle
- **File**: `src/components/canvas/overlays/ViewToggle.tsx` -- radiogroup, localStorage "architex-viz-view"

### 9.8 LiveDashboard
- **File**: `src/components/canvas/overlays/LiveDashboard.tsx` -- gauge + odometer + memory bar

### 9.9 SortCelebration
- **File**: `src/components/canvas/overlays/SortCelebration.tsx` -- Canvas2D confetti, 4000ms auto-dismiss

### 9.10 DangerOverlay
- **File**: `src/components/canvas/overlays/DangerOverlay.tsx` -- vignette + shake + badge, triggers at 1.5x nlogn

### 9.11 TimelineScrubber
- **File**: `src/components/canvas/overlays/TimelineScrubber.tsx` -- pointer capture drag, keyboard nav

### 9.12 AlgorithmModule (Orchestrator)
- **File**: `src/components/modules/AlgorithmModule.tsx`
- **Hook**: `useAlgorithmModule()` returns { sidebar, canvas, properties, bottomPanel }
- **Features**: error boundary, 3-step onboarding tour, mastery tracking (localStorage), recent algos (10 max), fullscreen (z-50), share URL, step trace export, screenshot, 5 XP per run
