# Database Design Lab -- Visual Design Language

> Canonical reference for all visual tokens used in the Database module's SVG-based
> interactive visualizations (B-Tree, Hash Index, LSM-Tree, Query Plan, ER Diagram).
>
> All values reference CSS custom properties defined in `src/app/globals.css`.

---

## 1. Color Tokens

### 1.1 Core Palette

| Token                  | CSS Variable                                      | Usage                                     |
|------------------------|---------------------------------------------------|-------------------------------------------|
| Primary                | `var(--primary)` -- `hsl(252 87% 67%)`            | Active/highlighted nodes, selection rings  |
| Primary surface        | `var(--primary-surface, rgba(59,130,246,0.15))`   | Highlighted node fill                     |
| Primary light          | `var(--primary-light, #93c5fd)`                   | Highlighted key text, active labels        |
| Foreground             | `var(--foreground)` -- `hsl(220 14% 90%)`         | Default text, key values                   |
| Foreground muted       | `var(--foreground-muted)` -- `hsl(220 10% 50%)`   | Secondary labels, descriptions             |
| Foreground subtle      | `var(--foreground-subtle)` -- `hsl(220 10% 55%)`  | Tertiary text, pointer labels, edges       |
| Surface                | `var(--surface)` -- `hsl(228 15% 11%)`            | Node/bucket backgrounds                   |
| Elevated               | `var(--elevated)` -- `hsl(228 15% 13%)`           | Header bars, grid strokes                  |
| Border                 | `var(--border)` -- `hsl(228 15% 16%)`             | Default node/bucket strokes                |
| Canvas BG              | `var(--canvas-bg)` -- `hsl(228 15% 6%)`           | SVG canvas background                     |

### 1.2 Active Glow

Used for the highlighted/selected node to create a soft glow effect:

```css
/* Applied via inline style on SVG rect */
stroke: var(--primary);              /* hsl(252 87% 67%) */
fill:   var(--primary-surface);      /* rgba(59,130,246,0.15) */
stroke-width: 2;
filter: drop-shadow(0 0 6px var(--primary));  /* optional glow */
```

### 1.3 Semantic State Colors

| Token           | CSS Variable                                | Hex Fallback |
|-----------------|---------------------------------------------|--------------|
| Success         | `var(--state-success)` -- `hsl(142 71% 45%)`| `#22c55e`    |
| Warning         | `var(--state-warning)` -- `hsl(38 92% 50%)` | `#eab308`    |
| Error           | `var(--state-error)` -- `hsl(0 72% 51%)`   | `#ef4444`    |
| Info / Active   | `var(--state-active)` -- `hsl(217 91% 60%)` | `#3b82f6`    |
| Processing      | `var(--state-processing)` -- `hsl(271 81% 56%)` | `#8b5cf6` |

### 1.4 Visualization-Specific Tokens

| Token               | CSS Variable                                   | Usage                        |
|----------------------|------------------------------------------------|------------------------------|
| Overflow/FK          | `var(--viz-overflow, #6366f1)`                 | Overflow chain arrows, FK dots |
| FK marker            | `var(--viz-fk, #a78bfa)`                       | Foreign key attribute fills   |
| Cost: low            | `var(--state-success, #22c55e)`                | Query plan low-cost nodes     |
| Cost: medium         | `var(--state-warning, #eab308)`                | Query plan mid-cost nodes     |
| Cost: high           | `var(--viz-seq-high, #f97316)`                 | Query plan high-cost nodes    |
| Cost: critical       | `var(--state-error, #ef4444)`                  | Query plan max-cost nodes     |

---

## 2. Node Shapes

### 2.1 Container Nodes (B-Tree nodes, hash buckets, SSTable boxes)

```
Shape:          Rounded rectangle
Corner radius:  rx="8" (8px)
Background:     var(--surface)
Stroke:         var(--border) (default) | var(--primary) (highlighted)
Stroke width:   1.5px (default) | 2px (highlighted)
```

### 2.2 Key Cells (within B-Tree/Hash nodes)

```
Shape:          Inner rounded rectangle
Corner radius:  rx="4" (4px)
Background:     var(--elevated)  (default) | var(--primary-surface) (highlighted)
```

### 2.3 ER Diagram Entities

```
Shape:          Rounded rectangle
Corner radius:  rx="8" (8px)
Background:     var(--surface)
Stroke:         var(--border) (default) | var(--primary) (selected) | var(--viz-overflow) (weak entity)
Stroke width:   1.5px (default) | 2px (selected)
```

### 2.4 Query Plan Nodes

```
Shape:          Rounded rectangle
Corner radius:  rx="10" (10px)
Dimensions:     180px x 56px
Background:     var(--surface)
Stroke:         Cost-colored (see section 1.4)
Stroke width:   2px
Left accent:    6px wide, rx="3", filled with cost color
```

---

## 3. Edge Styles

### 3.1 Default Edges (tree connections, relationship lines)

```css
stroke:         var(--foreground-subtle);
stroke-width:   1.5px;
stroke-linejoin: round;
stroke-linecap:  round;
```

### 3.2 Highlighted Edges

```css
stroke:         var(--primary);
stroke-width:   2px;
```

### 3.3 Overflow Chain Edges (Hash Index)

```css
stroke:         var(--viz-overflow, #6366f1);  /* default */
stroke:         var(--viz-overflow, #6366f1);  /* highlighted */
stroke-width:   1.5px;
```

### 3.4 Arrow Markers

```xml
<marker markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
  <polygon points="0 0, 8 3, 0 6" fill="var(--foreground-muted)" />
</marker>
```

Variants:
- ER diagram arrows: `fill: var(--foreground-muted)`
- Hash chain arrows: `fill: var(--viz-overflow, #6366f1)`
- Query plan arrows: `fill: var(--foreground-subtle)`

---

## 4. Animation Timing

All animations reference the motion design tokens from `globals.css` (source of truth: `lib/constants/motion.ts`).

### 4.1 Duration Tokens

| Category          | Duration | CSS Variable                      | Easing                                          |
|-------------------|----------|-----------------------------------|-------------------------------------------------|
| Entry (appear)    | 200ms    | `var(--motion-duration-normal)`   | `var(--motion-ease-out)` -- `cubic-bezier(0.16, 1, 0.3, 1)` |
| Movement (shift)  | 300ms    | `var(--motion-duration-moderate)` | Spring: `--motion-spring-smooth` (200/25/1.0)   |
| Exit (remove)     | 150ms    | `var(--motion-duration-fast)`     | `var(--motion-ease-in)` -- `cubic-bezier(0.55, 0, 1, 0.45)` |
| Quick flash       | 100ms    | `var(--motion-duration-quick)`    | `var(--motion-ease-out)`                        |

### 4.2 Spring Presets (JS-side, via motion/react)

| Preset   | Stiffness | Damping | Mass | Use Case                          |
|----------|-----------|---------|------|-----------------------------------|
| Snappy   | 300       | 30      | 0.8  | Node highlight transitions        |
| Smooth   | 200       | 25      | 1.0  | Tree re-layout after split        |
| Bouncy   | 400       | 20      | 0.5  | Key insertion pop                 |
| Stiff    | 500       | 35      | 1.0  | Immediate repositioning           |
| Gentle   | 150       | 20      | 1.2  | Subtle background fades           |

### 4.3 Reduced Motion

When `prefers-reduced-motion: reduce` is active, all durations collapse to `0ms` via the global CSS rule. No per-component handling needed.

---

## 5. Typography

### 5.1 Within SVG Visualizations

| Role            | Font Family     | Size   | Weight | CSS Class / Style                  |
|-----------------|-----------------|--------|--------|------------------------------------|
| Key values      | Monospace       | 13px   | 600    | `font-mono text-[13px] font-semibold` |
| Labels          | Sans-serif      | 11px   | 600    | `text-[11px] font-semibold`        |
| Badges/tags     | Sans-serif      | 10px   | 700    | `text-[10px] font-bold uppercase`  |
| Descriptions    | Sans-serif      | 12px   | 400    | `text-xs`                          |
| Tiny annotations| Sans-serif      | 10px   | 400    | `text-[10px]` or `font-mono text-[11px]` |

### 5.2 Panel UI (outside canvas)

| Role            | Tailwind Class                                      |
|-----------------|-----------------------------------------------------|
| Section headers | `text-xs font-semibold uppercase tracking-wider text-foreground-muted` |
| Step description| `text-xs text-foreground-muted`                     |
| Monospace values| `font-mono text-xs text-foreground-muted`           |
| Node count      | `font-mono text-[10px] text-foreground-subtle`      |

---

## 6. Operation State Colors

Each database operation maps to a consistent color across all visualization modes. These are used for legend dots, step badges, and contextual highlights.

### 6.1 B-Tree Index

| Operation | Dot Color         | Badge Classes                          |
|-----------|-------------------|----------------------------------------|
| Insert    | `bg-green-400`    | `bg-green-900/30 text-green-400`       |
| Split     | `bg-amber-400`    | `bg-amber-900/30 text-amber-400`       |
| Search    | `bg-blue-400`     | `bg-blue-900/30 text-blue-400`         |

### 6.2 Hash Index

| Operation   | Dot Color       | Badge Classes                          |
|-------------|-----------------|----------------------------------------|
| Insert      | `bg-green-400`  | `bg-green-900/30 text-green-400`       |
| Collision   | `bg-amber-400`  | `bg-amber-900/30 text-amber-400`       |
| Resize      | `bg-rose-400`   | `bg-rose-900/30 text-rose-400`         |
| Delete      | `bg-red-400`    | `bg-red-900/30 text-red-400`           |
| Search      | `bg-blue-400`   | `bg-blue-900/30 text-blue-400`         |

### 6.3 LSM-Tree

| Operation | Dot Color         | Badge Classes                          |
|-----------|-------------------|----------------------------------------|
| Write     | `bg-green-400`    | `bg-green-900/30 text-green-400`       |
| Flush     | `bg-amber-400`    | `bg-amber-900/30 text-amber-400`       |
| Compact   | `bg-violet-400`   | `bg-violet-900/30 text-violet-400`     |
| Read      | `bg-blue-400`     | `bg-blue-900/30 text-blue-400`         |

### 6.4 Query Plan

Cost is shown as a continuous gradient via `costColor()`:

| Cost Ratio    | Color                                    |
|---------------|------------------------------------------|
| 0 -- 0.25     | `var(--state-success, #22c55e)` (green)  |
| 0.25 -- 0.50  | `var(--state-warning, #eab308)` (amber)  |
| 0.50 -- 0.75  | `var(--viz-seq-high, #f97316)` (orange)  |
| 0.75 -- 1.0   | `var(--state-error, #ef4444)` (red)      |

### 6.5 Normalization

| Normal Form | Classes                                        |
|-------------|------------------------------------------------|
| 1NF         | `text-red-400 bg-red-900/30 border-red-800`    |
| 2NF         | `text-orange-400 bg-orange-900/30 border-orange-800` |
| 3NF         | `text-green-400 bg-green-900/30 border-green-800` |
| BCNF        | `text-emerald-400 bg-emerald-900/30 border-emerald-800` |

### 6.6 Highlight with Glow (General Pattern)

For any interactive highlight with a primary glow effect:

```css
fill:         var(--primary-surface, rgba(59,130,246,0.15));
stroke:       var(--primary);
stroke-width: 2px;
/* Text within highlighted elements: */
fill:         var(--primary-light, #93c5fd);
```

---

## 7. Consolidated Operation-to-Color Map

Quick-reference for implementing new database visualization modes:

| Operation / State   | Color Name | Tailwind `bg-` | Tailwind `text-` |
|---------------------|-----------|-----------------|-------------------|
| Insert / Write      | Green     | `green-400`     | `green-400`       |
| Split / Flush       | Amber     | `amber-400`     | `amber-400`       |
| Search / Read       | Blue      | `blue-400`      | `blue-400`        |
| Collision           | Amber     | `amber-400`     | `amber-400`       |
| Resize              | Rose      | `rose-400`      | `rose-400`        |
| Delete              | Red       | `red-400`       | `red-400`         |
| Compact             | Violet    | `violet-400`    | `violet-400`      |
| Highlight           | Primary   | --              | --                |
| Highlight glow fill | Primary   | `var(--primary-surface)` | `var(--primary-light)` |
