# Animation & Visualization Techniques

> How to make technical animations feel world-class. Specific techniques, libraries, and parameters.

---

## 1. DATA FLOW ANIMATION (Between System Components)

### Approach A: Animated Dash Offset (SVG) — for "active" state
```css
.edge-path { stroke-dasharray: 5,5; animation: dash 1s linear infinite; }
@keyframes dash { to { stroke-dashoffset: -10; } }
```

### Approach B: Particle/Dot Flow — GOLD STANDARD for showing data
Use `SVGGeometryElement.getPointAtLength()` to move dots along paths.
- Multiple particles per edge = throughput
- Particle size = payload size
- Particle color = data type
- Particle speed = latency

### Approach C: Glowing Paths — for highlighting active routes
CSS `filter: drop-shadow(0 0 4px rgba(59,130,246,0.8))`

### Recommended Layered Approach:
1. Default: Static edges with subtle color
2. Active: Animated dash offset
3. Data in transit: Particle dots
4. Error: Glowing red pulse

---

## 2. ALGORITHM STEP-BY-STEP (Action Log Pattern)

```typescript
interface AnimationStep {
  description: string;          // "Compare arr[3] with arr[5]"
  pseudocodeLine: number;       // Line to highlight
  mutations: VisualMutation[];  // What changes on screen
  complexity: { comparisons, swaps, reads, writes };
  duration: number;             // Base ms at 1x
}
```

- Pre-compute ALL steps before playback
- Interpolate between steps with requestAnimationFrame
- Scrubbing backward is trivial (each step has from/to values)

---

## 3. PERFORMANCE AT SCALE

| Tech | Best For |
|---|---|
| SVG (React Flow) | < 1000 nodes, interactive, accessible |
| Canvas 2D | 200-10,000 nodes, effects overlay |
| WebGL | 10,000+ nodes, but hard |

### Key Techniques:
- **Viewport culling:** Only render visible nodes (React Flow does this)
- **Level-of-Detail:** Zoom > 40% = full detail, 15-40% = label only, < 15% = dots
- **Batch DOM updates:** All mutations in single requestAnimationFrame
- **CSS `will-change: transform; contain: layout style paint;`**
- **Use `transform` not `x`/`y`** — transforms are GPU-composited

---

## 4. HYBRID RENDERING ARCHITECTURE

```
Layer 4: HTML Overlay    — tooltips, menus, code editor
Layer 3: SVG Interactive — React Flow nodes + edges
Layer 2: Canvas Effects  — particles, heatmaps, trails
Layer 1: CSS Background  — dot grid pattern
```

---

## 5. SEMANTIC STATE COLORS (Dark Mode)

| State | Color | Hex |
|---|---|---|
| Idle | Gray | #6B7280 |
| Active | Blue | #3B82F6 |
| Success | Green | #22C55E |
| Warning | Amber | #F59E0B |
| Error | Red | #EF4444 |
| Processing | Purple | #A855F7 |
| Selected | White+glow | #F9FAFB |

Never rely on color alone — pair with icon/pattern/label.

---

## 6. EASING FUNCTIONS

| Use Case | Easing |
|---|---|
| Elements entering | ease-out |
| Elements leaving | ease-in |
| State transitions | ease-in-out |
| Spring/bounce | cubic-bezier(0.34,1.56,0.64,1) |
| Particles along path | linear |
| Zoom in/out | ease-out |

**Never use linear for UI transitions.** Only for continuous animations.

---

## 7. SPRING PHYSICS (Motion/Framer Motion)

```typescript
// Node drag — snappy, minimal wobble
{ stiffness: 300, damping: 30 }

// Layout transition — softer, visible settle  
{ stiffness: 120, damping: 20 }
```

---

## 8. POLISH CHECKLIST

1. **Stagger** — 30-50ms delay between sequential node animations
2. **Opacity** — Fade in (0→1, 200ms) not pop in
3. **Scale on appear** — 0.8→1 with ease-out
4. **Shadows for depth** — Active nodes get drop-shadow
5. **Curve edges** — Bezier curves, not straight lines
6. **60fps or nothing** — Reduce complexity before dropping frames
7. **`prefers-reduced-motion`** — All animations → 0ms duration

---

## 9. ANIMATION SPECS TABLE

| Animation | Duration | Easing |
|---|---|---|
| Node appear | 200ms | ease-out + scale |
| Node disappear | 150ms | ease-in |
| Node drag | spring(300,30) | spring |
| Node layout move | spring(120,20) | spring |
| Edge appear | 300ms | ease-out (stroke-dashoffset) |
| Particle flow | linear | linear |
| Color change | 300ms | ease-out |
| Panel open/close | 200ms | ease-in-out |
| Tooltip | 100ms | ease-out + translateY(-4px) |
| Stagger delay | 40ms | — |
