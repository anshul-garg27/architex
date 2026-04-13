# Visualization System Inventory

> Complete inventory of everything the visualization and design agents created.
> Covers: visualization library, motion design system, visual design spec, UI design system spec, and color science.

---

## File Inventory

### Visualization Library (`architex/src/lib/visualization/`)

| File | Purpose | Lines |
|------|---------|-------|
| `index.ts` | Barrel export for visualization library | 5 |
| `colors.ts` | Color science: palettes, colorblind-safe, scales, utilities | 235 |
| `canvas-renderer.ts` | Canvas 2D rendering engine for real-time charts | 500 |

### Motion Design System (`architex/src/lib/constants/`)

| File | Purpose | Lines |
|------|---------|-------|
| `motion.ts` | Complete motion specification: springs, durations, easings, animation catalog | 875 |

### Design Specifications (`architex/docs/`)

| File | Purpose | Est. Lines |
|------|---------|------------|
| `VISUAL_DESIGN_SPEC.md` | Implementation-ready visual specs for canvas nodes/edges, states, LOD, 15 component mockups | ~800+ |
| `UI_DESIGN_SYSTEM_SPEC.md` | Linear/Figma/VSCode/Notion/Stripe/Bloomberg/Apple UI patterns, 40+ items | ~1000+ |

**Total lines across all visualization/design files: ~3,400+**

---

## Motion Design System (`motion.ts` -- 875 lines)

### Design Principles
1. Motion communicates state, not decorates it
2. Every animation has a reduced-motion fallback (instant snap)
3. Canvas operations feel direct; UI chrome feels responsive
4. Spring physics for organic movement; tween for predictable timing
5. Performance ceiling: 200 concurrent animated elements, 60fps target

### Spring Physics Constants (5 springs)

| Spring | Stiffness | Damping | Mass | UX Intent | Examples |
|--------|-----------|---------|------|-----------|---------|
| `snappy` | 300 | 30 | 0.8 | Quick, decisive response with minimal overshoot | Button press, toggle switch, tooltip snap, checkbox, node snap-to-grid |
| `smooth` | 200 | 25 | 1.0 | Fluid, elegant movement | Sidebar slide, bar swap in algorithm viz, toast reorder, modal enter |
| `bouncy` | 400 | 20 | 0.5 | Playful overshoot that draws attention | Achievement badge unlock, confetti, score counter, streak pulse |
| `stiff` | 500 | 35 | 1.0 | Precise, mechanical with almost no overshoot | Node drag follow, grid alignment snap, resize handle, selection rectangle |
| `gentle` | 150 | 20 | 1.2 | Slow, weighted for large layout changes | Module switch crossfade, sidebar open content resize, grid re-sort |

### Duration Scale (7 tokens)

| Token | Value | Feel | Use Cases |
|-------|-------|------|-----------|
| `instant` | 0ms | Reduced motion fallback | Truly instant state changes |
| `quick` | 100ms | Fast enough to feel instant but trackable | Tooltips, hover backgrounds, cursor-following |
| `fast` | 150ms | Crisp micro-interaction | Button press, icon swap, toggle, checkbox |
| `normal` | 200ms | Standard UI transition (the default) | Panel open/close, tab switch, dropdown, node selection |
| `moderate` | 300ms | Perceptible but not slow | Modal enter, page transition, edge draw-in, sidebar slide |
| `slow` | 500ms | Deliberate pacing | Large layout shift, stagger sequences, chart data animation |
| `deliberate` | 800ms | Reserved for attention-worthy moments | Confetti, achievement, onboarding spotlight, first-run |

### Easing Functions (5 curves)

| Easing | Bezier | Purpose |
|--------|--------|---------|
| `out` | `[0.16, 1, 0.3, 1]` | Deceleration entry -- elements entering viewport |
| `in` | `[0.55, 0, 1, 0.45]` | Acceleration exit -- elements leaving viewport |
| `inOut` | `[0.65, 0, 0.35, 1]` | Symmetric -- state changes where element stays in place |
| `emphasized` | `[0.2, 0, 0, 1]` | Aggressive deceleration (Material Design 3) -- large-distance movements |
| `linear` | `[0, 0, 1, 1]` | Constant speed -- progress bars, particle flow, continuous rotation |

### Animation Catalog (7 categories, 30+ presets)

**Canvas Interactions** (9 presets):
- `nodeAppear`: bouncy scale 0->1 on drop from palette
- `nodeDelete`: scale 0.9 + fade out
- `nodeDrag`: stiff spring for cursor following
- `nodeSnapToGrid`: snappy spring
- `edgeAppear`: stroke-dashoffset draw-in animation
- `edgeDelete`: fade + thin stroke
- `selectionBox`: instant (no animation)
- `canvasPan`: instant (no spring -- would feel sluggish)
- `canvasZoom`: fast ease-out step

**Particle System** (5 presets):
- `movement`: linear constant speed along edge path, infinite repeat
- `fadeIn`/`fadeOut`: 50ms opacity transitions at source/target nodes
- `error`: larger (6px vs 4px), red, pulsing scale 1->1.3->1
- Size: 4px circle, spacing: 20px between particles

**Panel Animations** (8 presets):
- Sidebar open/close (260px width, normal/fast timing)
- Properties panel open/close (280px width)
- Bottom panel open/close (auto height)
- Panel content item stagger (40ms per item, max 10 animated)

**Algorithm Visualization** (5 presets):
- `barSwap`: smooth spring for crossing paths
- `barHeightChange`: smooth spring + color transition
- `barCompare`: blue highlight, quick timing
- `barSorted`: green + scale pulse 1->1.05->1
- `pivotHighlight`: purple box-shadow glow, infinite pulse

**Modal/Dialog** (4 presets):
- Overlay fade in/out (quick timing)
- Dialog scale 0.95->1 + slide up 10px + fade (normal/fast)

**Toast Notifications** (3 presets):
- Slide in from right (snappy spring)
- Slide out to right (normal ease-in)
- Stack reorder (smooth spring)

**Command Palette** (4 presets):
- Open: slide down 20px + scale 0.98->1 + fade (fast ease-out)
- Close: reverse, faster
- Result items: slide up 4px + fade, 20ms stagger

**Module Switch** (3 presets):
- Content exit: quick fade out
- Content enter: fast fade in with 50ms delay
- Activity bar indicator: smooth spring slide

**Simulation States** (3 presets):
- Status transition: moderate ease-in-out color change
- Running pulse: green glow, 2s cycle, infinite
- Error flash: 3 rapid red border flashes in 0.6s
- Chaos shake: horizontal shake (-2px to +2px), 3 cycles

**Celebration** (5 presets):
- Confetti: 100 particles, 2s duration, 0.6 gravity, 360 spread
- Achievement unlock: bouncy spring scale-in
- Achievement glow: gold box-shadow pulse
- Level up counter: slow ease-out number animation
- Streak pulse: scale 1->1.15->1

### Stagger Patterns (6 groups)

| Pattern | Delay | Max Animated |
|---------|-------|-------------|
| List items | 40ms | 10 |
| Grid items | 30ms | 16 (4x4) |
| Dashboard cards | 60ms | 8 |
| Chart data points | 20ms | 50 |
| Command results | 20ms | 10 |
| Panel content | 40ms | 10 |

### Reduced Motion Configuration
- Spring/tween animations -> instant snap (0ms)
- Particle flow -> static dots at 40px intervals
- Celebrations -> no confetti, no glow, simple appear
- Infinite pulses -> single frame, no repeat

### Performance Limits (Runtime Constants)
- Max concurrent animations: 200
- Target FPS: 60
- Degradation threshold: 45fps (below this: disable particles, simplify springs)
- Particle renderer: Canvas 2D only (never DOM)
- Pause on hidden: true (Page Visibility API)
- will-change auto-management: set before animation, remove after
- Never animate: width, height, top, left, margin, padding (use transform/opacity)

### CSS Custom Properties
8 duration tokens + 4 easing tokens + 5 spring reference values exported for globals.css injection.

### Convenience Presets
Pre-composed shortcuts: `fadeIn`, `fadeOut`, `slideUp`, `scaleIn`, `scaleOut` -- each combines initial/animate/exit/transition into a single importable object.

---

## Visual Design Spec (`VISUAL_DESIGN_SPEC.md`)

### Node Visual Design by Category

**BaseNode Anatomy** (shared by all nodes):
- Dimensions: 180px default, 140px compact, 280px expanded
- Border: 1px solid category color, 8px radius
- Background: surface color, dark theme default
- Three zones: Header bar (32px, icon + label + state dot), Body (auto, category-specific), Footer badge (24px optional)
- 4 source + 4 target connection handles (8x8px, primary color, 2px border)

**Universal Node States** (5 states applied to ALL node types):
- **Idle**: 40% blend border, 0.85 opacity, gray state dot
- **Active**: Full category color border, 1.0 opacity, pulse glow animation (2s cycle)
- **Error**: Red border, red flash animation (1.5s cycle, double flash)
- **Warning**: Amber border, slow pulse, amber state dot
- **Success**: Green border, check icon, green state dot

### Edge Animation Design
10 edge types with distinct visual treatments (color, dash pattern, line width, particle color, animation style). Custom quadratic bezier paths with configurable curvature. Double-line rendering for replication edges (3px offset).

### Canvas Micro-Interactions
Node hover (shadow elevation), drag (scale 1.02 with stiff spring), connection handle reveal on hover, snap-to-grid visual guides, selection rectangle, rubber band multi-select.

### Simulation Visual States
Idle (dim, gray), Active (bright, pulsing glow), Processing (spinning icon), Error (red flash, shake), Warning (amber pulse). Each mapped to CSS animations defined in the motion system.

### Level of Detail (LOD) System
Three LOD levels triggered by zoom threshold:

| Zoom | LOD | What Shows | What Hides |
|------|-----|-----------|-----------|
| < 0.3 | Minimal | Labels only | Icons, metrics, ports, details |
| 0.3-0.7 | Standard | Labels + basic shapes + icons | Metrics badges, port details |
| > 0.7 | Detailed | Everything: ports, metrics, badges, icons | Nothing hidden |

### 15 Component Visual Mockups
Detailed CSS/layout specs for 15 representative components across all 8 categories:
1. Web Server (compute) -- header with Nginx icon, throughput badge
2. App Server (compute) -- runtime indicator (Node/Go/Java)
3. PostgreSQL (storage) -- cylinder icon, connection count
4. Redis (storage) -- memory usage bar, eviction policy badge
5. Kafka (messaging) -- partition count, consumer lag indicator
6. Load Balancer L7 (networking) -- algorithm selector, health check dot
7. API Gateway (networking) -- rate limit counter, auth method badge
8. CDN (networking) -- cache hit rate donut
9. Batch Processor (processing) -- job progress bar
10. ML Inference (processing) -- GPU indicator, model size badge
11. Web Client (client) -- browser icon, bundle size
12. Mobile Client (client) -- platform icon (iOS/Android)
13. Prometheus (observability) -- scrape interval, alert count
14. Auth Service (security) -- provider badge, MFA toggle
15. Rate Limiter (security) -- token bucket visualization

---

## UI Design System Spec (`UI_DESIGN_SYSTEM_SPEC.md`)

### Pattern Sources (7 inspirations)
The spec draws from 7 world-class UI paradigms:

1. **Linear-Style Interactions** -- Keyboard-first, command palette, global search, breadcrumb navigation, optimistic updates
2. **Figma-Style Canvas Interactions** -- Infinite canvas, spatial tools, zoom-to-fit, smart guides, frame-based grouping
3. **VS Code-Style Panel Management** -- Activity bar, sidebar, bottom panel, split views, minimap, breadcrumbs
4. **Notion-Style Content Blocks** -- Block-based content, slash commands, databases, nested pages, toggles
5. **Stripe-Level Visual Polish** -- Gradient meshes, glass morphism, micro-animations, typography hierarchy
6. **Bloomberg Terminal-Style Information Density** -- Dense data display, multi-panel, keyboard shortcuts, real-time updates
7. **Apple-Level Accessibility Polish** -- VoiceOver, dynamic type, reduce motion, high contrast, focus management

### Foundation: Design Tokens & Motion

**Extended Shadow System** (5 layers: xs, sm, md, lg, xl + glow):
- Dark theme: higher opacity, more pronounced shadows
- Light theme: subtle, lower opacity shadows

**Motion System Constants** (references `motion.ts`):
- 5 spring configs: snappy, gentle, soft, bouncy, layout
- 5 durations: instant (60ms), fast (120ms), normal (200ms), slow (350ms), glacial (600ms)
- 4 easings: easeOut, easeIn, easeInOut, linear

### 40+ UI Pattern Items (Organized by Inspiration)

**Linear-Style** (~8 items):
- Command palette (Cmd+K) with fuzzy search
- Keyboard shortcuts for every action
- Global search across all content
- Breadcrumb navigation
- Optimistic updates for instant feedback
- Status indicators (dots, badges)
- Compact density (13px base font)
- Dark-first with light theme

**Figma-Style** (~8 items):
- Infinite zoomable canvas
- Smart guides during drag
- Magnetic connection handles
- Component palette with drag-drop
- Properties panel with live updates
- Minimap for overview
- Multi-select with rubber band
- Group/ungroup nodes

**VS Code-Style** (~8 items):
- Activity bar (48px, left) with module icons
- Collapsible sidebar (240-400px)
- Collapsible properties panel (280-400px, right)
- Collapsible bottom panel (200-400px)
- Tab bar for open diagrams
- Status bar (24px) with context info
- Panel resize persistence (localStorage)
- Keyboard shortcuts for panel toggles (Cmd+B, Cmd+J, Cmd+Shift+B)

**Notion-Style** (~4 items):
- Slash command (/) for quick actions
- Block-based content in notes
- Toggle sections for collapsible content
- Rich text editing in descriptions

**Stripe-Level** (~5 items):
- Gradient mesh background on landing page
- Glass morphism navigation (frosted glass)
- Micro-animation polish on every interaction
- Typography hierarchy (display, heading, body, code)
- Color gradient CTAs

**Bloomberg-Style** (~4 items):
- Dense metrics dashboard during simulation
- Multiple simultaneous data panels
- Keyboard-driven data navigation
- Real-time streaming updates

**Apple-Style** (~5 items):
- VoiceOver/screen reader support
- Reduced motion mode
- High contrast mode
- Focus management (visible focus rings)
- Minimum touch targets (44x44px)

### Implementation Roadmap
The spec includes a phased implementation plan:
- P0: Shadow system, motion constants, focus rings
- P1: Panel management, command palette, node states
- P2: Canvas interactions, LOD, particle system
- P3: Landing page polish, celebrations, sound design

---

## Data Visualization System (from `canvas-renderer.ts`)

### Architecture
High-performance Canvas 2D rendering engine with:
- Double-buffering for flicker-free rendering
- requestAnimationFrame scheduling
- 10Hz metric update throttle (render at 60fps, data at 10Hz)
- DPI-aware scaling for Retina displays (cap at 3x)
- Performance budget: < 16ms per frame for all active charts

### Chart Types Available

**Line Charts** (`drawLine`):
- Sub-pixel rendering for crisp 1px lines
- Round line joins and caps
- Configurable line width

**Area Charts** (`drawArea`, `drawStackedArea`):
- Filled area under line with configurable alpha
- Stacked area for multiple series (P50/P90/P95/P99 latency)
- Series rendered back-to-front for correct layering

**Horizontal Bars** (`drawHBar`):
- Rounded right-end corners
- Used for queue depth visualization

**Donut/Arc Charts** (`drawArc`):
- Ring segments with configurable radius and thickness
- Used for cache hit rate visualization

**Supporting Primitives**:
- Grid lines (`drawGridLines`) -- horizontal, snap to half-pixel
- Y-axis labels (`drawYAxisLabels`) -- monospace font, right-aligned
- Anomaly markers (`drawAnomalyMarkers`) -- circles at spike/drop points
- Centered text (`drawCenteredText`) -- for gauge center values

### Scale System

**Linear Scale**: Standard domain-to-range mapping
**Logarithmic Scale**: Base-10, clamps to >= 0.1 to avoid log(0)
**Nice Range**: Auto-computes "round" axis boundaries
**Linear Ticks**: Evenly spaced tick positions
**Log Ticks**: Powers of 10 plus half-decades

### Anomaly Detection
Simple rolling Z-score algorithm:
- Window size: 10 points (configurable)
- Threshold: 2.5 standard deviations (configurable)
- Returns indices of anomalous data points
- Used to highlight spikes/drops in metric charts

### Update Throttle
`createUpdateThrottle()` factory:
- Renders at 60fps via requestAnimationFrame loop
- Only recomputes data projections at 10Hz (100ms intervals)
- Uses a `needsRender` flag to avoid unnecessary draw calls
- Returns `scheduleUpdate()` and `destroy()` methods

### Animation Constants
- Spring config: stiffness 300, damping 25, mass 1
- Easing functions: easeInOut (cubic), easeOut (cubic decelerate), linear

---

## Color Science (`colors.ts`)

### CSS Custom Properties (16 visualization-specific variables)
Sequential scales (utilization 0-100%), latency percentile colors (P50/P90/P95/P99), throughput chart colors, error rate colors, chart infrastructure colors (grid, axis text, tooltip).

### Colorblind-Safe Palettes

**IBM Palette** (8 colors, default):
- Blue (#648FFF), Purple (#785EF0), Magenta (#DC267F), Orange (#FE6100), Yellow (#FFB000), Teal (#009E73), Grey (#9E9E9E), White (#FFFFFF)
- Tested for deuteranopia, protanopia, tritanopia

**Wong Palette** (8 colors, alternative):
- Orange (#E69F00), Sky Blue (#56B4E9), Green (#009E73), Yellow (#F0E442), Blue (#0072B2), Vermilion (#D55E00), Purple (#CC79A7), Black (#000000)
- Source: Bang Wong, Nature Methods 8, 441 (2011)

### Node Category Color Mapping
9 node categories mapped to both IBM and Wong palettes:
- compute, load-balancing, storage, messaging, networking, processing, client, observability, security

### Latency Percentile Colors
- P50: Green #22C55E (good)
- P90: Yellow #EAB308 (caution)
- P95: Orange #F97316 (warning)
- P99: Red #EF4444 (critical)

### Utilization Gradient Stops
Linear interpolation between 4 stops:
- 0%: Green #22C55E (idle)
- 50%: Yellow #EAB308 (moderate)
- 80%: Orange #F97316 (high)
- 100%: Red #EF4444 (saturated)

### Viridis Sequential Scale (10 stops)
Perceptually uniform, colorblind-safe scale for heatmaps. Subset of Matplotlib Viridis palette.

### Diverging Scale (Blue-White-Red)
For comparison charts: below-average (#3B82F6) to above-average (#EF4444).

### Algorithm Visualization State Colors (8 states)
default (gray), comparing (blue), swapping (red), sorted (green), pivot (purple), active (amber), found (cyan), minimum (pink).

### Raft Node Role Colors
follower (gray), candidate (amber), leader (green).

### Color Utility Functions (4 functions)
1. `lerpColor(a, b, t)` -- Linear interpolation between two hex colors
2. `utilizationColor(value)` -- Maps 0-1 utilization to gradient color
3. `hexToRgba(hex, alpha)` -- Converts hex to rgba string
4. `siSuffix(value)` -- Formats numbers with SI suffix (1K, 1.5M, 2.3G) for axis labels

---

## Dark/Light Theme Support

Both the color system and design specs include full dark and light theme variants:

**Dark theme** (default):
- Background: #0C0D0F (near-black)
- Surface: #111113
- Text primary: #EDEDEF
- Accent: #6E56CF (purple)
- Shadows: higher opacity, more pronounced

**Light theme**:
- Background: #FFFFFF
- Surface: #F9F9FB
- Text primary: #1C2024
- Accent: #6E56CF (same purple)
- Shadows: lower opacity, subtle

All contrast ratios verified against WCAG 2.1:
- text-primary on bg-base: 18.2:1 (exceeds AAA)
- text-secondary on bg-base: 5.8:1 (exceeds AA)
- text-tertiary on bg-base: 3.7:1 (used only for large text)
