# Sound Design, Micro-Interactions, and Polish Specification

> Complete specification for Architex's audio system, micro-interactions, cursor/selection behavior, celebration effects, and delightful details. Every interaction should feel intentional, teaching-oriented, and satisfying.

---

## 1. SOUND DESIGN SYSTEM

### 1.1 Philosophy

Sound in Architex serves three purposes: **reinforce understanding** (sonification of algorithm/system behavior), **provide feedback** (confirm user actions), and **celebrate progress** (gamification rewards). Sound is never decorative. Every audio cue must have a visual equivalent. Sound is OFF by default and opt-in via settings or a persistent speaker icon in the status bar.

**Core principles (from research):**
- The auditory cortex processes sound in ~25ms vs ~250ms for vision (10x faster). A button that clicks *feels* faster than a silent one with identical visual feedback.
- The more frequently a sound occurs, the more subtle, shorter, and warmer it must be.
- Sound is a complement, never a replacement. Every audio cue has a visual equivalent.
- Default volume is subtle (30% of system volume). Never start at full volume.
- Respect `prefers-reduced-motion` and provide a global mute toggle.
- Provide 3-5 variations of frequently-heard sounds (like SND does for keystrokes) to prevent auditory fatigue.

### 1.2 Sound Categories

| Category | Trigger Frequency | Character | Duration | Volume |
|---|---|---|---|---|
| **Algorithm Sonification** | Very High (every step) | Pitched tones mapped to data values | 20-80ms | 15-25% |
| **Simulation Events** | High (continuous during sim) | Ambient, textural | 50-200ms | 10-20% |
| **UI Feedback** | Medium (on user action) | Subtle clicks, taps | 30-80ms | 20-30% |
| **State Changes** | Medium (on system events) | Distinct tones | 100-300ms | 25-35% |
| **Achievements** | Low (milestone moments) | Celebratory, musical | 500-2000ms | 35-50% |
| **Errors / Warnings** | Low (on problems) | Cautious, not alarming | 150-400ms | 30-40% |

### 1.3 Algorithm Sonification (The Sound of Sorting)

Based on research from "The Sound of Sorting" (Timo Bingmann) and the SIGCSE 2022 paper on pedagogical sonification:

**Pitch Mapping:**
- Data values map to pitch: low values = low pitch, high values = high pitch
- Frequency range: 120 Hz - 1,212 Hz (comfortable hearing range, avoids extremes)
- Wave type: Triangle wave with ADSR envelope (softer than sine, less harsh than square)
- Attack: 5ms, Decay: 10ms, Sustain: 60%, Release: 30ms

**Per-Algorithm Sound Signatures:**
| Algorithm | Sound Character | Mapping |
|---|---|---|
| Bubble Sort | Rising/falling tone pairs | Each comparison plays both compared values |
| Quick Sort | Wide pitch jumps (pivot selection) | Pivot tone held longer, partition sweeps audible |
| Merge Sort | Layered harmonics (merging) | Merge phase plays ascending scale from merged range |
| Heap Sort | Deep bass tones (heap operations) | Sift-down plays descending pitch sequence |
| Binary Search | Halving tone (narrowing range) | Tone pitch = midpoint value, volume = range width |
| BFS/DFS | Spatial audio (panning) | Node position maps to stereo pan, depth maps to pitch |
| Dijkstra | Distance = pitch (closer = higher) | Relaxation plays descending glissando |

**Implementation with Web Audio API:**

```typescript
// lib/audio/sonification-engine.ts
class SonificationEngine {
  private ctx: AudioContext;
  private gainNode: GainNode;
  private compressor: DynamicsCompressorNode;

  constructor() {
    // Lazy initialization - only create on first user interaction
    this.ctx = new AudioContext();
    this.compressor = this.ctx.createDynamicsCompressor();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  playDataTone(value: number, maxValue: number, duration = 50) {
    const minFreq = 120;
    const maxFreq = 1212;
    const frequency = minFreq + (value / maxValue) * (maxFreq - minFreq);

    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

    // ADSR envelope
    const now = this.ctx.currentTime;
    const attack = 0.005;
    const decay = 0.01;
    const sustain = 0.6;
    const release = 0.03;

    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(1, now + attack);
    env.gain.linearRampToValueAtTime(sustain, now + attack + decay);
    env.gain.linearRampToValueAtTime(0, now + duration / 1000 + release);

    osc.connect(env);
    env.connect(this.gainNode);
    osc.start(now);
    osc.stop(now + duration / 1000 + release + 0.01);
  }

  playComparison(valueA: number, valueB: number, maxValue: number) {
    this.playDataTone(valueA, maxValue, 30);
    setTimeout(() => this.playDataTone(valueB, maxValue, 30), 35);
  }

  playSwap(valueA: number, valueB: number, maxValue: number) {
    // Swap has a distinct "whoosh" - play both tones with a pitch bend
    this.playDataTone(valueA, maxValue, 40);
    this.playDataTone(valueB, maxValue, 40);
  }
}
```

### 1.4 Simulation Sound Design

System Design Simulator ambient audio creates an "operating data center" feel:

| Event | Sound | Implementation |
|---|---|---|
| Traffic flowing | Soft white noise, volume = throughput | Filtered noise node, gain mapped to RPS |
| Request arrival | Gentle tick (randomized timing) | Short sine blip at 800Hz, 10ms |
| Queue filling up | Rising ambient tone | Low-pass filter frequency rises with queue depth |
| Queue overflow (503) | Muffled thud | Short noise burst through low-pass at 200Hz |
| Circuit breaker trip | Sharp click + silence | 1200Hz tone 20ms, then hard mute of that edge |
| Circuit breaker recovery | Gentle chime (ascending) | Three-note ascending arpeggio (C5, E5, G5), 300ms |
| Node failure | Low rumble + silence | Brown noise burst 200ms, then fadeout |
| Node recovery | Warm ascending tone | Sine sweep 200Hz to 600Hz over 500ms |
| Latency spike | Pitch detuning (sounds "wrong") | Slight vibrato on affected path's ambient tone |
| Cache hit | Quick high ping | 1400Hz sine, 15ms |
| Cache miss | Lower, longer tone | 400Hz sine, 40ms |

**Spatial Audio for System Design:**
- Use Web Audio API's StereoPannerNode to place sounds in the stereo field
- Components on the left of the canvas pan left, right side pans right
- Creates an immersive "you're inside the system" feeling

### 1.5 UI Feedback Sounds

| Interaction | Sound | Character |
|---|---|---|
| Node drag start | Soft lift ("pick up") | 600Hz sine, 20ms, slight upward bend |
| Node drop on canvas | Gentle thud ("set down") | 300Hz sine, 30ms, slight downward bend |
| Node snap to grid | Subtle click | White noise burst, 8ms, high-pass filtered |
| Edge connection made | Satisfying click + brief tone | 800Hz, 40ms, with subtle harmonic |
| Edge connection failed | Soft buzz | 200Hz, 60ms, slight wobble |
| Panel open | Soft whoosh (ascending) | Filtered noise sweep up, 150ms |
| Panel close | Soft whoosh (descending) | Filtered noise sweep down, 120ms |
| Command palette open | Gentle pop | 1000Hz sine, 15ms |
| Search result selected | Light tap | 900Hz sine, 10ms |
| Undo | Reverse whoosh | Reverse of panel open, 100ms |
| Redo | Forward whoosh | Same as panel open but faster, 80ms |
| Copy | Quick double-tap | Two 800Hz pings 20ms apart |
| Delete | Soft crumple | Noise burst through decaying filter, 100ms |
| Zoom in | Rising pitch | Sine sweep 400-600Hz, 80ms |
| Zoom out | Falling pitch | Sine sweep 600-400Hz, 80ms |

### 1.6 Achievement and Gamification Sounds

| Event | Sound | Character |
|---|---|---|
| Challenge started | Anticipation tone | Ascending minor 7th chord, 400ms |
| Hint used | Gentle notification | Two-note descending (neutral, not punitive) |
| Challenge completed | Success fanfare | Major chord arpeggio (C-E-G-C), 800ms |
| Perfect score | Extended celebration | Full fanfare + sparkle overlay, 1500ms |
| Streak milestone (7d) | Level-up chime | Ascending pentatonic run, 600ms |
| Streak milestone (30d) | Epic achievement | Full chord progression (I-IV-V-I), 2000ms |
| Badge earned | Badge "stamp" sound | Impact + resonant bell tone, 500ms |
| XP gained | Quick coin-like ding | 1200Hz sine with fast decay, 80ms |
| Level up | Triumphant ascending | Power chord + shimmer, 1200ms |
| First design saved | Warm confirmation | Soft major chord, 400ms |
| Leaderboard rank up | Competitive sting | Bold brass-like synth, 600ms |

### 1.7 Sound Settings Architecture

```typescript
// stores/audio-store.ts
interface AudioSettings {
  masterEnabled: boolean;           // Global on/off (default: false)
  masterVolume: number;             // 0.0 to 1.0 (default: 0.3)

  categories: {
    sonification: boolean;          // Algorithm audio (default: true when master on)
    simulation: boolean;            // System sim ambient (default: true)
    uiFeedback: boolean;            // Click/drag sounds (default: true)
    achievements: boolean;          // Celebration sounds (default: true)
  };

  categoryVolumes: {
    sonification: number;           // default: 0.25
    simulation: number;             // default: 0.15
    uiFeedback: number;             // default: 0.20
    achievements: number;           // default: 0.40
  };

  sonificationOptions: {
    waveType: 'sine' | 'triangle' | 'square' | 'sawtooth';  // default: triangle
    frequencyRange: [number, number];  // default: [120, 1212]
    spatialAudio: boolean;           // default: true
  };

  respectReducedMotion: boolean;    // default: true (also disables audio)
}
```

**Status Bar Sound Toggle:**
- Speaker icon in status bar (far right, next to zoom level)
- Click to toggle master on/off
- Right-click or long-press for volume slider popover
- Icon states: muted (line through), low, medium, high
- Keyboard shortcut: `Cmd+Shift+M` to toggle

### 1.8 Technical Implementation

**Library choice:** Raw Web Audio API (no library needed). Optionally use Tone.js for advanced scheduling if algorithm playback timing requires sample-accurate sequencing.

**Performance constraints:**
- All sound generation happens on the main thread AudioContext (Web Audio API is designed for this)
- For algorithm sonification at high playback speeds (>4x), batch tones and reduce to every Nth step
- Pre-create oscillator patterns for common UI sounds (object pool pattern)
- Use a single DynamicsCompressorNode to prevent clipping when multiple sounds overlap
- AudioContext is created lazily on first user interaction (browser autoplay policy)

---

## 2. MICRO-INTERACTIONS SPECIFICATION

### 2.1 Node Interactions

**Hover:**
```
Trigger:    Mouse enters node bounding box
Delay:      0ms (immediate)
Animation:  - Border color transitions to primary (300ms ease-out)
            - Subtle glow: box-shadow 0 0 12px rgba(139,92,246,0.15) (200ms)
            - Cursor changes to 'grab'
            - Connected edges brighten slightly (opacity 0.6 -> 0.9, 200ms)
            - Tooltip appears after 500ms hover dwell time
Exit:       All effects reverse (200ms ease-in)
```

**Drag:**
```
Trigger:    mousedown + mousemove (5px threshold)
Start:      - Node lifts: scale 1.03, shadow deepens (box-shadow 0 8px 24px)
            - Cursor changes to 'grabbing'
            - Other nodes dim slightly (opacity 0.7)
            - Snap guides appear (blue dashed lines at aligned positions)
            - Connected edges follow with spring physics (stiffness: 300, damping: 30)
            - Grid dots under node highlight subtly
During:     - Snap-to-grid: Node position rounds to nearest 20px increment
            - Snap-to-align: Blue guide lines appear when aligned with other nodes
              (horizontal center, vertical center, top, bottom, left, right)
            - Alignment guides appear at 2px threshold, snap at 8px threshold
            - If near edge of viewport, auto-pan canvas at edge speed
Drop:       - Node settles with spring physics (brief overshoot + settle)
            - Scale returns to 1.0 (spring 200, 25)
            - Shadow returns to default
            - Snap guides disappear (fade 100ms)
            - Other nodes restore full opacity (200ms)
            - If dropped on invalid area: spring back to original position (300ms)
Sound:      Lift click on drag start, settle thud on drop, subtle clicks on snap
```

**Selection:**
```
Single:     - Click: ring highlight (2px primary color ring with 4px offset)
            - Properties panel slides in/updates (200ms ease-in-out)
            - Node label gets subtle underline
            - Connected edges become full opacity + slightly thicker stroke

Multi:      - Shift+Click adds to selection (ring appears on each)
            - Rubber band: Blue semi-transparent rectangle (fill: primary/10, border: primary/50)
              drawn from mousedown point to current mouse position
            - Nodes intersecting rubber band get temporary highlight ring
            - On mouseup, all intersected nodes are selected
            - Lasso: Alt+drag for freeform lasso selection (SVG path follows cursor)
              Dashed blue line follows mouse, completes with straight line to start

Deselect:   - Click on empty canvas: all selection rings fade (150ms)
            - Properties panel transitions to empty state
```

**Connection Drawing:**
```
Start:      - Hover over node handle: handle scales 1.0 -> 1.5, color brightens
            - Handle gets pulsing ring animation (infinite, subtle)
            - Click + drag from handle: bezier curve follows cursor
            - Curve color = edge type color (blue for HTTP, orange for queue, etc.)
            - Valid drop targets (compatible handles) glow with green ring
            - Invalid targets dim with red tint
During:     - Bezier curve auto-adjusts control points for clean routing
            - Preview curve uses dashed stroke (dasharray: 5,5)
            - Nearest valid handle gets "magnetic" pull at 30px distance
            - Type selector appears near cursor if multiple edge types possible
Complete:   - Edge solidifies (dashed -> solid, 200ms)
            - Brief pulse animation travels along new edge (particle burst)
            - Success chime if sound enabled
Cancel:     - Drag to empty space or press Escape
            - Preview curve fades and shrinks back to source handle (200ms)
            - Gentle error buzz if sound enabled
```

### 2.2 Canvas Interactions

**Pan:**
```
Trigger:    Middle mouse button drag, or Space + left drag, or two-finger trackpad
Animation:  - Canvas moves 1:1 with cursor (no lag, no smoothing on fast moves)
            - Minimap viewport indicator updates in real-time
            - Edge of canvas shows subtle gradient fade (indicates infinity)
Inertia:    - On release, canvas continues with momentum (deceleration over 300ms)
            - Deceleration curve: ease-out
            - Friction: 0.95 per frame
```

**Zoom:**
```
Trigger:    Scroll wheel, pinch gesture, Cmd+=/Cmd+-
Animation:  - Zoom towards cursor position (focal point zoom)
            - Smooth interpolation: spring(150, 20) between zoom levels
            - Level-of-detail transitions:
              > 40% zoom: Full node detail (labels, icons, metrics, ports)
              15-40% zoom: Simplified (label + icon only), crossfade over 200ms
              < 15% zoom: Colored dots, crossfade over 200ms
            - LOD transitions use opacity crossfade, not pop-in
            - Grid dots scale with zoom (larger at high zoom, fade out at low zoom)
Range:      - Min: 5% (bird's eye), Max: 400% (detail inspection)
            - Cmd+0 or double-click minimap: fit all nodes in view (animated, 400ms)
```

**Background Grid:**
```
Default:    - Dot grid pattern via CSS radial-gradient
            - Dot color: var(--muted)/20 (very subtle)
            - Dot spacing: 20px (matches snap grid)
            - Dots scale with zoom, fade below 15% zoom
Dynamic:    - When dragging a node, nearby grid dots brighten slightly
            - Alignment guides overlay on top of grid
            - Grid spacing indicator appears during zoom transitions
```

### 2.3 Panel Interactions

**Sidebar (Component Palette):**
```
Open:       Cmd+B or click activity bar icon
            - Width animates from 0 to stored width (200ms ease-in-out)
            - Content fades in after panel width reaches 50% (stagger 40ms per category)
            - Canvas resizes smoothly in sync

Close:      Cmd+B or click active activity bar icon
            - Content fades out (100ms)
            - Width animates to 0 (200ms ease-in-out)

Component Drag from Palette:
            - On mousedown: component card lifts (scale 1.02, shadow deepens)
            - On drag start: ghost preview follows cursor (50% opacity)
            - Canvas highlights valid drop zone (entire canvas gets subtle border)
            - On drop: node appears with scale animation (0.8 -> 1.0, 200ms ease-out)
            - Source card in palette does brief "sent" animation (scale dip 0.95 -> 1.0)
```

**Properties Panel:**
```
Open:       On node selection, or Cmd+Shift+B
            - Slides in from right (200ms ease-in-out)
            - Content for selected node fades in (100ms after panel reaches width)
            - If already open: content crossfades to new node's properties (150ms)

Editing:    - Input fields: focus ring with primary color (2px)
            - Numeric inputs: scrub by dragging left/right on label
            - Sliders: value tooltip follows thumb
            - Changes apply immediately (optimistic) with undo support
            - Changed values get subtle highlight flash (300ms)

Close:      Cmd+Shift+B or deselect all nodes
            - Content fades (100ms)
            - Panel slides out (200ms)
```

**Bottom Panel (Code/Timeline/Metrics):**
```
Open:       Cmd+J or click tab
            - Height animates from 0 to stored height (200ms ease-in-out)
            - Active tab content fades in (100ms)

Tab Switch: - Outgoing tab content fades out (100ms)
            - Incoming tab content fades in (100ms)
            - Underline indicator slides to new tab (200ms spring)

Resize:     - Drag handle has hover state (color change, cursor: row-resize)
            - During resize: content reflows in real-time
            - Min height: 120px, Max height: 60% of viewport
            - Double-click handle: toggle between min and stored height
```

### 2.4 Timeline / Playback Interactions

**Playback Controls:**
```
Play/Pause: - Button morphs between play (triangle) and pause (two bars)
              using SVG path interpolation (200ms)
            - When playing: timeline scrubber moves smoothly
            - Active algorithm step highlights in code panel

Step:       - Click step-forward/back: current step indicator jumps
            - Brief pulse on the step that just executed
            - Code line highlight snaps to new line

Speed:      - Speed display: "0.25x" through "4x"
            - Click cycles: 0.25x -> 0.5x -> 1x -> 2x -> 4x
            - Speed change: brief stretch animation on the speed label
            - At >2x: reduce visual detail (skip intermediate frames)
            - At >4x: disable per-step sound, use summary sounds instead

Scrubber:   - Drag scrubber thumb along timeline
            - Canvas updates in real-time (algorithm state at that step)
            - Scrubber has magnetic snap to key steps (comparisons, swaps, etc.)
            - Timeline shows colored markers for different operation types
            - Hover over timeline: preview tooltip shows step description
```

### 2.5 Command Palette Interactions

```
Open:       Cmd+K
            - Backdrop: background dims to 40% opacity (150ms)
            - Palette: slides down from top + opacity (200ms spring)
            - Search input auto-focused
            - Recent commands shown first

Search:     - Results filter as you type (<50ms response)
            - Matching characters highlighted in results (bold or color)
            - Results grouped by category with subtle dividers
            - Arrow keys navigate, highlighted item has background tint
            - Each result shows keyboard shortcut (right-aligned, muted)

Select:     - Enter or click: palette dismisses (150ms fade-up)
            - Action executes immediately
            - If action opens a panel: palette exit and panel entrance overlap

Dismiss:    - Escape or click backdrop
            - Palette fades up + opacity (150ms)
            - Backdrop restores (150ms)
```

---

## 3. LOADING STATES

### 3.1 Canvas Loading (Initial)

```
Phase 1 (0-200ms):     Background grid pattern appears immediately
Phase 2 (200-400ms):   Skeleton nodes shimmer in place (gray rounded rectangles
                        at stored positions, with shimmer animation)
Phase 3 (400-800ms):   Nodes materialize with staggered fade-in (40ms between each)
                        Scale: 0.9 -> 1.0 + opacity: 0 -> 1
Phase 4 (800-1200ms):  Edges draw themselves (stroke-dashoffset animation, 300ms each
                        staggered 20ms between edges)
Phase 5 (1200ms+):     Full interactivity enabled, status bar shows "Ready"
```

### 3.2 Skeleton Patterns

**Shimmer Specification:**
```css
/* All skeletons use synchronized shimmer */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--muted-foreground)/10 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  background-attachment: fixed;        /* All elements shimmer in sync */
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; opacity: 0.6; }
}
```

**Per-Component Skeletons:**
| Component | Skeleton Shape | Notes |
|---|---|---|
| Canvas node | Rounded rectangle matching node dimensions | Gray fill, no border |
| Properties panel | 4-5 horizontal bars of varying width | Mimics label + input layout |
| Code panel | 8-12 lines of varying width bars | Mimics code line lengths |
| Metrics panel | 3 small rectangles + 1 chart placeholder | Mimics stat cards + chart |
| Component palette | Grid of squares | Mimics draggable component cards |
| Timeline | Long horizontal bar + 3 control circles | Mimics scrubber + buttons |

### 3.3 Progress Indicators

**Simulation startup:**
- Thin progress bar at top of canvas (like YouTube/GitHub), primary color
- Width animates from 0% to 100% as WASM module loads
- Indeterminate mode (repeating animation) if load time unknown
- Status bar text: "Loading simulation engine..." -> "Ready"

**Template loading:**
- Canvas shows skeleton of template layout
- Nodes fade in left-to-right (visual impression of "building")
- 800ms total for full template materialization

**Export progress:**
- Toast notification with inline progress bar
- "Exporting to PNG..." with spinner -> "Exported!" with checkmark

---

## 4. TOAST NOTIFICATIONS

### 4.1 Design Specification

```
Position:       Bottom-right (32px from edges)
Width:          320-400px
Stack:          Up to 3 visible, oldest dismissed first
Auto-dismiss:   Success: 3s, Info: 4s, Warning: 5s, Error: persistent (manual dismiss)
```

**Anatomy:**
```
┌──────────────────────────────────────────┐
│  [Icon]  Title text (semibold)      [X]  │
│          Description text (muted)        │
│          [Action Button]  (optional)     │
│  ─────────────────── progress bar ─────  │
└──────────────────────────────────────────┘
```

**Animation:**
```
Enter:    Slide in from right (translateX: 100% -> 0) + opacity (0 -> 1)
          Duration: 200ms, easing: spring(200, 25)
Stack:    Existing toasts slide up by new toast height (200ms spring)
Exit:     Swipe right to dismiss (gesture) OR auto-dismiss:
          opacity 1 -> 0 + translateX 0 -> 50px (200ms ease-in)
          Remaining toasts slide down to fill gap (200ms spring)
Progress: Thin bar at bottom, full width -> 0 width over auto-dismiss duration
          Color matches toast type (green/blue/amber/red)
```

### 4.2 Toast Types

| Type | Icon | Border-Left Color | Use Case |
|---|---|---|---|
| Success | CheckCircle | `#22C55E` | Save, export, connection made |
| Info | Info | `#3B82F6` | Simulation tip, keyboard shortcut hint |
| Warning | AlertTriangle | `#F59E0B` | High latency, approaching capacity |
| Error | XCircle | `#EF4444` | Simulation error, failed export |
| Achievement | Trophy | `#A855F7` | Badge earned, streak milestone |

### 4.3 Contextual Toasts (Unique to Architex)

| Scenario | Toast Content | Extra |
|---|---|---|
| First simulation run | "Your system is handling 100 req/s. Try increasing traffic to find the breaking point." | [Increase Traffic] button |
| Bottleneck detected | "API Server is at 92% utilization. Consider adding another instance or a cache." | Highlights bottleneck node |
| Challenge hint available | "Stuck? A hint is available (-5 points)." | [Show Hint] button |
| Template loaded | "Twitter Fan-out architecture loaded. 12 nodes, 15 connections." | [Run Simulation] button |
| Keyboard shortcut tip | "Pro tip: Press Space to play/pause the simulation." | Dismiss after 5s |
| Design auto-saved | "Design saved." | Appears briefly (2s), minimal |

---

## 5. EMPTY STATES

### 5.1 Design Principles

Empty states are teaching moments. Every empty state should:
1. Explain what would be here if there were data
2. Provide a clear primary action to fix the emptiness
3. Use a warm, encouraging illustration or icon (not sad/broken imagery)
4. Match the personality of Architex: technical but approachable

### 5.2 Per-Context Empty States

**Canvas (No Nodes):**
```
┌─────────────────────────────────────────────┐
│                                             │
│         [Ghost outline of a system]         │
│     (3 dashed-outline placeholder nodes     │
│      with dashed-outline connections)       │
│                                             │
│     "Your architecture starts here"         │
│     Drag components from the sidebar,       │
│     or pick a template to get started.      │
│                                             │
│     [Browse Templates]  [Quick Start]       │
│                                             │
│     or press Cmd+K and type "add"           │
│                                             │
└─────────────────────────────────────────────┘
```
- Ghost nodes are subtly animated (slow breathing scale 0.98-1.02, 3s ease-in-out)
- Ghost connections have animated dash-offset (slow, 4s loop)

**Properties Panel (No Selection):**
```
     [Click/Select icon]

     "Select a component to see
      its properties and metrics"

     Tip: Click a node, or press
     Tab to cycle through nodes.
```

**Metrics Panel (No Simulation Running):**
```
     [Play button icon]

     "Run a simulation to see
      live throughput, latency,
      and error metrics here."

     [Start Simulation]

     Press Space to play/pause.
```

**Code Panel (No Algorithm Selected):**
```
     [Code bracket icon]

     "Choose an algorithm to see
      its implementation alongside
      the step-by-step visualization."

     [Browse Algorithms]
```

**Search Results (No Match):**
```
     [Magnifying glass icon]

     "No results for '[query]'"

     Try a different search term, or
     browse all components in the sidebar.
```

**Learning Path (Not Started):**
```
     [Compass/map icon]

     "Your learning journey begins here"

     Choose a path to get a structured
     progression from basics to mastery.

     [System Design Track]
     [Algorithm Mastery Track]
     [Distributed Systems Track]
```

---

## 6. ERROR STATES

### 6.1 Design Principles

Errors are specific, friendly, and actionable. Never show error codes without context. Never blame the user. Always suggest a fix.

### 6.2 Error State Catalog

**Simulation Error (Component Overloaded):**
```
State:    Node turns red, pulses gently (not aggressively)
Banner:   Yellow warning bar at top of canvas (not blocking interaction):
          "API Server is dropping requests. Queue depth exceeded 1000."
Action:   [Add Replica]  [Increase Capacity]  [View Metrics]
Tone:     Informative, not alarming. This is a learning moment.
```

**WASM Load Failure:**
```
State:    Canvas shows simplified mode indicator
Banner:   "Simulation engine couldn't load. Running in simplified mode."
          "Metrics may be less accurate. [Retry Loading] [Learn More]"
Fallback: JavaScript-based simulation (slower but functional)
```

**Connection Error (Edge Invalid):**
```
State:    Edge turns red with X icon at midpoint
Tooltip:  "A Load Balancer can't connect directly to a Message Queue.
           Connect through a Worker Service instead."
          Shows small inline diagram of valid connection path.
```

**Import Error (Invalid File):**
```
Dialog:   "This file couldn't be imported."
Details:  "Expected a .json or .drawio file. The file appears to be [detected type]."
Action:   [Try Again]  [View Supported Formats]
```

**Browser Compatibility:**
```
Banner:   "Some features require a modern browser."
Details:  Lists specific missing features: WebAssembly, Web Workers, etc.
Action:   [Continue with limited features]  [View Requirements]
```

### 6.3 Error Animation Spec

```
Error appear:   - Red tint fades in (0 -> 10% overlay, 300ms ease-out)
                - Error icon scales in (0.5 -> 1.0, 200ms spring)
                - Affected component(s) get 1px red border (300ms)
                - Single gentle shake (translateX: 0 -> 4px -> -4px -> 0, 300ms)
                  Only on user-caused errors (invalid connection, etc.)
                  NEVER shake for system errors

Error dismiss:  - Red tint fades (300ms)
                - Error icon scales out (1.0 -> 0.5 -> 0, 200ms)
                - Border returns to normal (300ms)
```

---

## 7. CELEBRATION AND ACHIEVEMENT EFFECTS

### 7.1 Library Selection

**Primary:** `canvas-confetti` (6KB gzipped, returns Promise, supports `disableForReducedMotion`)
**Secondary:** `tsparticles` (for particle effects beyond confetti: sparkles, fireworks)
**Custom:** Lightweight sparkle/glow effects via Canvas 2D on existing particle layer

### 7.2 Achievement Tier System

| Tier | Trigger | Visual Effect | Sound | Duration |
|---|---|---|---|---|
| **Micro** | XP gained, concept reviewed | Brief sparkle at source | Quick ding | 300ms |
| **Minor** | Exercise completed, streak day | Sparkle burst from center | Ascending chime | 600ms |
| **Standard** | Challenge completed, badge earned | Confetti burst (50 particles) | Success fanfare | 1200ms |
| **Major** | Level up, path milestone | Full confetti rain + sparkle border | Triumphant chord | 2000ms |
| **Epic** | 100-day streak, all challenges complete | Fireworks + confetti + golden glow | Extended fanfare | 3000ms |

### 7.3 Effect Specifications

**Micro Sparkle:**
```typescript
// Quick sparkle effect at a specific point
function microSparkle(x: number, y: number) {
  // 5-8 small particles, random direction, 300ms lifetime
  // Colors: white + primary (violet)
  // Size: 2-4px
  // Physics: burst outward at 50-100px/s, fade to 0 opacity
}
```

**Standard Confetti (canvas-confetti):**
```typescript
import confetti from 'canvas-confetti';

function celebrateCompletion() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#818CF8', '#22C55E', '#F59E0B', '#3B82F6'],
    disableForReducedMotion: true,
    gravity: 1.2,
    ticks: 150,
  });
}
```

**Major Achievement (Confetti Rain):**
```typescript
function celebrateMajor() {
  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ['#818CF8', '#22C55E', '#F59E0B'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ['#818CF8', '#22C55E', '#F59E0B'],
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
```

**Achievement Badge Unlock Animation:**
```
1.  (0ms)     Dark overlay fades in (40% opacity, 200ms)
2.  (200ms)   Badge container scales from 0 to 1.1 (300ms spring)
3.  (400ms)   Badge settles to 1.0 (100ms spring)
4.  (500ms)   Badge name + description fade in below (200ms)
5.  (600ms)   Sparkle particles emanate from badge edges (continuous, 1500ms)
6.  (700ms)   Confetti burst behind badge (50 particles)
7.  (2100ms)  Auto-dismiss: badge scales to 0.9 + fades (300ms)
8.  (2400ms)  Overlay fades out (200ms)
              Or: click anywhere to dismiss early
```

### 7.4 Streak Celebration (Duolingo-Inspired)

```
Daily streak maintenance:
  - Status bar streak counter increments with spring animation
  - Number briefly scales up (1.0 -> 1.3 -> 1.0, 300ms)
  - Flame icon next to counter gets brief glow pulse
  - If milestone (7, 30, 100): trigger Minor/Major/Epic celebration

Streak at risk (22+ hours since last session):
  - Streak counter shows amber warning color
  - Gentle pulse animation on counter
  - Status bar tooltip: "Complete an exercise to maintain your streak!"
```

---

## 8. CURSOR DESIGN

### 8.1 Context-Sensitive Cursors

| Context | Cursor | CSS Value |
|---|---|---|
| Default (canvas) | Default arrow | `default` |
| Hovering node | Grab hand | `grab` |
| Dragging node | Grabbing hand | `grabbing` |
| Drawing edge | Crosshair | `crosshair` |
| Panning canvas | Move arrows | `move` (during pan: `grabbing`) |
| Resizing panel | Resize arrow | `col-resize` or `row-resize` |
| Over text input | Text cursor | `text` |
| Over clickable element | Pointer | `pointer` |
| Loading/processing | Wait | `progress` (NOT `wait` -- progress allows interaction) |
| Invalid drop target | Not allowed | `not-allowed` |
| Zoom tool active | Zoom in/out | Custom SVG cursor (magnifying glass +/-) |

### 8.2 Custom Cursor for Drawing Mode

When the user activates "Connection Mode" or drags from a port:
```css
.connection-mode {
  cursor: url('/cursors/connection.svg') 12 12, crosshair;
}

/* SVG cursor: small circle with plus icon, 24x24 */
/* Primary color outline, transparent fill */
```

### 8.3 Collaborative Cursors

```
- Each remote user's cursor: colored arrow + name label
- Name label: 6px below cursor, rounded pill shape, user's assigned color
- Cursor movement: interpolated with 50ms smoothing (not raw network updates)
- Idle after 5 seconds: cursor fades to 30% opacity
- Idle after 30 seconds: cursor disappears (still tracked, reappears on move)
- Maximum 20 visible cursors (overflow shows "+N more" in status bar)
```

---

## 9. SELECTION AND MULTI-SELECT

### 9.1 Rubber Band Selection

```
Trigger:    Click + drag on empty canvas area
Visual:     Semi-transparent blue rectangle
            Fill: rgba(139, 92, 246, 0.08) — primary at 8% opacity
            Border: 1px solid rgba(139, 92, 246, 0.4) — primary at 40%
            Rounded corners: 2px
Behavior:   - Nodes whose bounding box INTERSECTS the rectangle are pre-selected
              (shown with lighter selection ring during drag)
            - On mouseup: intersected nodes become fully selected
            - Modifier: Hold Shift to ADD to existing selection
            - Modifier: Hold Alt to SUBTRACT from existing selection
Performance: Uses requestAnimationFrame, only recomputes intersection on frame boundaries
```

### 9.2 Lasso Selection

```
Trigger:    Alt + Click + drag on empty canvas (or dedicated Lasso tool from toolbar)
Visual:     Freeform SVG path following cursor
            Stroke: 1.5px dashed primary color (dasharray: 4,4)
            Fill: none during drawing, then rgba(139, 92, 246, 0.08) when closed
Closing:    - On mouseup: straight line from current point to start point
            - Path closes with brief animation (100ms)
Behavior:   - Nodes fully ENCLOSED by the lasso polygon are selected
            - Uses point-in-polygon test for each node center
Sound:      Gentle "lasso close" sound on mouseup (if audio enabled)
```

### 9.3 Multi-Select Actions

```
When 2+ nodes selected:
  - Toolbar context changes to show: Align, Distribute, Group, Delete
  - Drag any selected node: all selected nodes move as a group
  - Properties panel shows shared properties (values that differ show "Mixed")
  - Cmd+G: Group selected nodes into a group container
  - Cmd+Shift+G: Ungroup
  - Right-click: context menu with Align (Left/Center/Right/Top/Middle/Bottom),
    Distribute (Horizontal/Vertical), and bulk actions
```

---

## 10. SNAP AND ALIGNMENT

### 10.1 Snap-to-Grid

```
Grid size:          20px (matches background dot spacing)
Snap threshold:     10px (within 10px, snap to nearest grid point)
Visual feedback:    Grid dots directly under dragged node subtly brighten
Toggle:             Cmd+Shift+G or toolbar toggle (magnet icon)
Disabled:           Hold Cmd during drag to temporarily disable snap
```

### 10.2 Smart Alignment Guides

```
Detection:          While dragging, compare node edges and centers to all other nodes
Threshold:          Within 4px of alignment -> show guide line
Snap threshold:     Within 8px -> snap to aligned position
Guide appearance:   1px solid primary color, extends across full viewport width/height
Guide labels:       Distance labels appear between nodes when within 40px of each other
                    (e.g., "20px" in a small pill above the guide line)
Types:
  - Center-to-center (horizontal): node centers share same Y
  - Center-to-center (vertical): node centers share same X
  - Edge-to-edge: top/bottom/left/right edges align
  - Equal spacing: three+ nodes, equal gaps highlighted with brackets
Disappear:          200ms fade after node drop or alignment lost
```

### 10.3 Edge Routing

```
Default:            Bezier curves (React Flow smoothstep or bezier edge type)
Auto-routing:       Edges avoid passing through nodes when possible
Waypoints:          Double-click edge to add a manual waypoint (draggable control point)
Bundle:             Parallel edges between same node pair bundle together with 4px offset
Labels:             Edge labels centered on edge, background pill for readability
                    Labels reposition to avoid overlapping nodes
```

---

## 11. DELIGHTFUL DETAILS AND EASTER EGGS

### 11.1 Progressive Loading Art

**WASM Engine Loading:**
```
Instead of a spinner, show a tiny animated system architecture being built:
  - Frame 1 (0-20%):   A single server node appears
  - Frame 2 (20-40%):  A database connects to it
  - Frame 3 (40-60%):  A load balancer appears in front
  - Frame 4 (60-80%):  A cache slides in between server and database
  - Frame 5 (80-100%): Particles start flowing through the edges
  - Complete:          "Ready to simulate" text, nodes glow briefly

This doubles as a teaching moment: shows a basic architecture pattern.
```

### 11.2 Easter Eggs

| Trigger | Easter Egg | Probability |
|---|---|---|
| Type "konami" in command palette | Classic Konami code activates: all nodes briefly become pixel art versions | Always |
| Simulate exactly 404 RPS | Canvas shows "404: Requests Not Found" with a winking server node for 3s | Always |
| Create exactly 42 nodes | Brief "Answer to everything" tooltip on 42nd node | Always |
| Run simulation at midnight local time | Status bar shows moon icon + "Late night engineering session detected" | Always |
| 10th consecutive undo | Toast: "Undo champion! Maybe try a different approach?" with gentle humor | Always |
| Type "import antigravity" in console | All nodes float up briefly (like Python easter egg) | Always |
| Complete all 55+ templates | Golden status bar theme unlocks permanently | Always |
| 1000th node placed across all projects | "Architect of the Millennium" hidden badge | Always |

### 11.3 Creative 404 Page

```
/404 page design:

  ┌──────────────────────────────────────────────┐
  │                                              │
  │     [Interactive mini-canvas]                │
  │     Shows a broken system:                   │
  │     Client -> [X broken edge] -> Server      │
  │                                              │
  │     User can drag to fix the connection       │
  │     When fixed: "Connection restored!         │
  │     Let's get you back on track."             │
  │                                              │
  │     [Go to Dashboard]  [Browse Templates]    │
  │                                              │
  └──────────────────────────────────────────────┘

  - The broken edge visually snaps and dangles
  - When user connects it, confetti + redirect options
  - Teaching moment: even the 404 page teaches connection concepts
```

### 11.4 Personality Moments

**First save:**
```
Toast: "Design saved! Every great architecture starts somewhere."
(Only shown once, tracked in localStorage)
```

**After long session (>2 hours continuous):**
```
Gentle, dismissable toast: "You've been architecting for 2 hours. Nice focus! Maybe take a stretch break?"
Shows only once per session, never interrupts simulation.
```

**Seasonal themes (optional, toggle in settings):**
```
- December: Snowflake particles occasionally drift across canvas background
- Halloween: Component palette icons get tiny pumpkin accessories
- April: One random component in palette labeled with a silly name for 24 hours
  (e.g., "Somewhat Balanced Load Distributor" instead of "Load Balancer")
All toggleable, off by default, never affect functionality.
```

---

## 12. ACCESSIBILITY REQUIREMENTS FOR ALL INTERACTIONS

### 12.1 Sound Accessibility

- All sounds are OFF by default. Opt-in via settings or status bar toggle.
- `prefers-reduced-motion: reduce` disables sounds by default (configurable).
- Every sound has a visual equivalent (no information conveyed by sound alone).
- Screen reader users get `aria-live="polite"` announcements for all events that produce sounds.
- Volume is independently controllable per category.
- Frequency range avoids extremes: no sounds below 100Hz (inaudible on many devices) or above 4000Hz (uncomfortable for many users).

### 12.2 Animation Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations become instant */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Confetti and particles disabled entirely */
  .confetti-canvas, .particle-layer { display: none; }

  /* Skeleton shimmer replaced with static gray */
  .skeleton { animation: none; opacity: 0.5; }

  /* Toasts appear instantly without slide */
  .toast { transform: none !important; }
}
```

Additional Architex setting: "Reduced animations" toggle in Settings that applies the same rules even when the OS preference is not set. Some users may want reduced animations in this tool but not system-wide.

### 12.3 Focus Management

- All micro-interactions triggered by mouse also work via keyboard
- Focus trap within modals and command palette
- Toast notifications have `role="status"` and `aria-live="polite"`
- Achievement popups have `role="alertdialog"` with focus trap and keyboard dismissal
- Empty states have semantic heading + description, action button is focusable
- Error messages use `role="alert"` for immediate announcement

### 12.4 Color Independence

Every state communicated through color also uses:
- **Icons:** Success = check, Warning = triangle, Error = X circle
- **Patterns:** Error edges get dashed pattern, not just red color
- **Labels:** State text appears alongside color indicators
- **Shape:** Different node states use different border styles (solid=healthy, dashed=degraded, dotted=offline)

---

## 13. IMPLEMENTATION PRIORITY

### Phase 1 (Core Platform, Weeks 1-3)
- [ ] Skeleton loading for canvas and panels
- [ ] Empty states for canvas, properties, code, metrics panels
- [ ] Toast notification system (success, info, warning, error types)
- [ ] Node hover, selection, and drag micro-interactions
- [ ] Panel open/close animations
- [ ] Command palette entrance/exit animations
- [ ] Snap-to-grid with visual feedback
- [ ] Context-sensitive cursors
- [ ] `prefers-reduced-motion` support for all animations

### Phase 2 (System Design Simulator, Weeks 4-7)
- [ ] Edge connection drawing interaction (preview + snap + validation)
- [ ] Smart alignment guides
- [ ] Rubber band selection
- [ ] Component drag from palette interaction
- [ ] Simulation start/stop UI feedback
- [ ] Error states for simulation (overloaded, failed, timeout)
- [ ] Contextual toast notifications (bottleneck detected, tip suggestions)

### Phase 3 (Algorithm Visualizer, Weeks 8-14)
- [ ] Sound system foundation (AudioContext, gain, compressor)
- [ ] Algorithm sonification engine (pitch mapping, ADSR, wave types)
- [ ] Timeline/playback micro-interactions (play/pause morph, scrubber)
- [ ] Speed control interactions
- [ ] Sound settings panel (categories, volumes, wave type selector)
- [ ] Status bar sound toggle

### Phase 4 (Gamification, Weeks 15-22)
- [ ] Achievement popup animation system
- [ ] Confetti effects (canvas-confetti integration)
- [ ] Sparkle/particle effects for micro-celebrations
- [ ] Streak visualization and celebration
- [ ] XP gain animation
- [ ] Level-up sequence
- [ ] Achievement sound effects
- [ ] Simulation ambient audio (traffic flow, events)

### Phase 5 (Polish, Weeks 23+)
- [ ] Lasso selection
- [ ] Collaborative cursors
- [ ] Easter eggs (all from section 11.2)
- [ ] Creative 404 page
- [ ] Progressive loading art (WASM loader)
- [ ] Seasonal themes (optional)
- [ ] Personality moments (first save, long session)
- [ ] UI feedback sounds (drag, drop, connect, panel, command palette)
- [ ] Full sound settings with per-category volume

---

## 14. DEPENDENCIES SUMMARY

| Package | Purpose | Size | Phase |
|---|---|---|---|
| `canvas-confetti` | Achievement celebrations | ~6KB gzip | 4 |
| `tsparticles` | Advanced particle effects (optional) | ~30KB gzip (tree-shakeable) | 4 |
| Web Audio API | All sound (built into browsers) | 0KB | 3 |
| `tone.js` | Advanced sound scheduling (optional) | ~150KB gzip | 5 (only if needed) |
| `react-toastify` | Toast system OR build custom with Radix Toast | ~7KB gzip | 1 |

**Recommendation:** Build the toast system on Radix UI Toast (already included via shadcn/ui) rather than adding react-toastify. This keeps the dependency count minimal and the design fully custom.

---

## 15. RESEARCH SOURCES

### Sound Design
- [Sound and Sonification Design for Interactive Learning Tools (Georgia Tech / Coursera)](https://www.coursera.org/learn/sound-and-sonification-for-learning)
- [The Sound of Sorting - Audibilization and Visualization of Sorting Algorithms](https://panthema.net/2013/sound-of-sorting/)
- [The Sounds of Sorting Algorithms: Sonification as a Pedagogical Tool (ACM SIGCSE 2022)](https://dl.acm.org/doi/abs/10.1145/3478431.3499304)
- [Applying Sound to UI (Material Design)](https://m2.material.io/design/sound/applying-sound-to-ui.html)
- [SND: Crafted UI Sound Assets](https://snd.dev/)
- [Sound Advice: Quick Guide to Designing UX Sounds (Toptal)](https://www.toptal.com/designers/ux/ux-sounds-guide)
- [Dev_Tones: UI Sounds for Your App (RCP Tones)](https://rcptones.com/dev_tones/)
- [Web Audio API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Using the Web Audio API Tutorial (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API)
- [Sonification Techniques: Mapping Data to Pitch and Volume](https://globxblog.github.io/blog/sonification-pitch-volume-mapping/)
- [Data-to-Music Sonification and User Engagement (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10448511/)

### Micro-Interactions and UX Patterns
- [Little Touches, Big Impact: The Micro-Interactions on Duolingo (Medium)](https://medium.com/@Bundu/little-touches-big-impact-the-micro-interactions-on-duolingo-d8377876f682)
- [How Duolingo Utilises Gamification (Raw Studio)](https://raw.studio/blog/how-duolingo-utilises-gamification/)
- [Duolingo Design Breakdown (925 Studios)](https://www.925studios.co/blog/duolingo-design-breakdown)
- [Micro-Interaction Examples: Boost UX (FrontendTools)](https://www.frontendtools.tech/blog/micro-interactions-ui-ux-guide)
- [Micro Interactions in Web Design 2025 (Stan Vision)](https://www.stan.vision/journal/micro-interactions-2025-in-web-design)
- [Motion UI Trends 2025 (Beta Soft Technology)](https://www.betasofttechnology.com/motion-ui-trends-and-micro-interactions/)
- [Micro-Animations & Micro-Interactions UX Design Guide 2026](https://www.joomlasrilanka.com/blog/micro-animations-micro-interactions-small-effects-b/)

### Drag and Drop / Canvas UX
- [Designing Drag and Drop UIs (LogRocket)](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/)
- [Drag-and-Drop: How to Design for Ease of Use (NN/g)](https://www.nngroup.com/articles/drag-drop/)
- [Drag-and-Drop UX: Guidelines and Best Practices (Smart Interface Design Patterns)](https://smart-interface-design-patterns.com/articles/drag-and-drop-ux/)
- [Drawing Smooth Curved Links in Diagrams (yWorks)](https://www.yworks.com/pages/drawing-smooth-curved-links-in-diagrams-and-networks)
- [Element Selection and Manipulation (Excalidraw DeepWiki)](https://deepwiki.com/excalidraw/excalidraw/3.6-geometry-and-mathematical-operations)
- [Konva Rubber Band Selection](https://longviewcoder.com/2023/03/16/konva-rubber-band-selection/)

### Toast, Empty State, and Error Design
- [Toast Notifications Best Practices (LogRocket)](https://blog.logrocket.com/ux-design/toast-notifications/)
- [Toast UI Design: Best Practices (Mobbin)](https://mobbin.com/glossary/toast)
- [Empty State UX Examples and Best Practices (Pencil and Paper)](https://www.pencilandpaper.io/articles/empty-states)
- [Empty State UI Pattern (Mobbin)](https://mobbin.com/glossary/empty-state)
- [Designing Better Error Messages UX (Smashing Magazine)](https://www.smashingmagazine.com/2022/08/error-messages-ux-design/)
- [Error-Message Guidelines (NN/g)](https://www.nngroup.com/articles/error-message-guidelines/)

### Celebration Effects
- [canvas-confetti (GitHub)](https://github.com/catdad/canvas-confetti)
- [tsParticles: JavaScript Particles, Confetti and Fireworks](https://particles.js.org/)
- [12 Micro Animation Examples Bringing Apps to Life 2025](https://bricxlabs.com/blogs/micro-interactions-2025-examples)

### Gamification Audio
- [Game Audio Gamification (Audiokinetic)](https://blog.audiokinetic.com/game-audio-gamification-part-1/)
- [Using Audio for Game Progression and Achievement (LinkedIn)](https://www.linkedin.com/advice/3/how-can-you-use-audio-game-progression-player-achievement-uw5xf)

### Easter Eggs and Delight
- [Creative 404 Pages (Webflow)](https://webflow.com/blog/best-404-pages)
- [The Hidden Gems in Web Design: 404 Pages, Preloaders, Easter Eggs](https://medium.com/donna-galletta-blogs/the-hidden-gems-in-web-design-9ce9741061ab)

### Loading and Skeleton
- [Skeleton Screens Explained (TopCrayons)](https://topcrayons.com/skeleton-screens-explained-how-they-boost-user-experience/)
- [Skeleton Loader Design (eBay Playbook)](https://playbook.ebay.com/design-system/components/loading-skeleton)
