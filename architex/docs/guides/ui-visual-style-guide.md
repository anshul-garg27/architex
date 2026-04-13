# Architex UI Visual Style Guide — 2026 Dark Glassmorphism

> This guide documents every visual pattern applied to the Algorithm module.
> Use it as the reference when upgrading ANY module to match the same premium look.
> Every code snippet is copy-paste ready.

---

## 1. DESIGN PHILOSOPHY

```
PRINCIPLE                    WHAT IT MEANS
──────────────────────────── ────────────────────────────────────────
Dark Glassmorphism           Translucent panels + backdrop-blur over gradient backgrounds
Neon on Deep                 Vibrant accent colors against dark surfaces
Depth through Light          Shadows + glows create hierarchy, not borders
Everything Alive             Hover states, transitions, micro-animations on every element
The Content IS the Art       Make the visualization beautiful, not just the chrome
```

### Color Philosophy
- Background layers: `background` → `surface` → `elevated` → `overlay` (4-layer system already in globals.css)
- Active states: glow shadows in accent color, not just color fill
- Borders: always `border-border/30` (30% opacity), never full opacity
- Text hierarchy: `text-foreground` → `text-foreground-muted` → `text-foreground-subtle`

### Shape Philosophy
- All corners: `rounded-xl` (never `rounded-lg` or `rounded-md` for containers)
- Small elements (badges, pills): `rounded-full`
- Borders: thin (1px), translucent (`border-border/30`)

---

## 2. CONTAINER PATTERNS

### Standard Panel / Card

```tsx
// BEFORE (old):
className="rounded-lg border border-border bg-elevated p-2"

// AFTER (glassmorphism):
className="rounded-xl border border-border/30 bg-elevated/50 backdrop-blur-sm p-2.5"
```

### Visualization Container

```tsx
className={cn(
  'relative overflow-hidden rounded-xl border border-border/30',
  'bg-gradient-to-b from-elevated/80 to-background',
  'px-2 pt-2',
  className,
)}
```

### Dropdown / Popover

```tsx
className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border/30 bg-background/90 backdrop-blur-xl shadow-2xl"
```

### Tooltip

```tsx
className="absolute z-20 rounded-lg border border-border/30 bg-background/80 backdrop-blur-md px-2 py-1 shadow-lg whitespace-nowrap pointer-events-none"
```

### Legend Pill (floating overlay)

```tsx
className="absolute bottom-2 right-3 flex gap-2 rounded-lg bg-background/60 backdrop-blur-md px-3 py-1.5 border border-border/20"
```

### Info Box (Interview Tips, Warnings, etc.)

```tsx
// Amber accent (warnings, tips):
className="rounded-xl border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(245,158,11,0.05)]"

// Blue accent (comparison, info):
className="rounded-xl border border-blue-500/30 bg-blue-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(59,130,246,0.05)]"

// Green accent (success, production):
className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(16,185,129,0.05)]"

// Primary accent (main feature):
className="rounded-xl border border-primary/30 bg-primary/5 backdrop-blur-sm p-2.5 shadow-[0_0_15px_rgba(110,86,207,0.05)]"
```

---

## 3. TEXT PATTERNS

### Section Header (gradient text)

```tsx
<span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
  Section Title
</span>
```

### Subsection Label

```tsx
<span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
  Label
</span>
```

### Value Display (monospace)

```tsx
<span className="font-mono text-sm font-medium text-foreground">
  O(n log n)
</span>
```

### Muted Description

```tsx
<p className="text-xs text-foreground-muted leading-relaxed">
  Description text here
</p>
```

---

## 4. BUTTON PATTERNS

### Primary Action Button (Play, Run)

```tsx
className={cn(
  "flex items-center justify-center rounded-full",
  "bg-primary text-white font-medium",
  "shadow-[0_0_20px_rgba(110,86,207,0.4)]",
  "transition-all hover:shadow-[0_0_30px_rgba(110,86,207,0.6)] hover:scale-105",
  // Size: h-12 w-12 for play, h-8 px-4 for text buttons
)}
```

### Secondary Action Button (Generate, Stop, Step)

```tsx
className={cn(
  "flex items-center justify-center rounded-xl",
  "border border-border/30 bg-elevated/50 backdrop-blur-sm",
  "text-foreground-muted transition-all",
  "hover:bg-elevated hover:text-foreground hover:shadow-[0_0_10px_rgba(110,86,207,0.1)]",
)}
```

### Toggle Button (active/inactive states)

```tsx
className={cn(
  'flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
  isActive
    ? 'border-primary/30 bg-primary/10 text-primary shadow-[0_0_15px_rgba(110,86,207,0.15)]'
    : 'border-border/30 bg-elevated/50 text-foreground-muted hover:bg-elevated hover:text-foreground',
)}
```

### Pill Selector (Speed, Presets)

```tsx
className={cn(
  'rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
  isSelected
    ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(110,86,207,0.2)]'
    : 'bg-elevated/50 text-foreground-muted hover:text-foreground hover:bg-elevated',
)}
```

### Icon Button (toolbar)

```tsx
className={cn(
  "flex h-8 w-8 items-center justify-center rounded-full",
  "bg-background/80 backdrop-blur border border-border/50",
  "text-foreground-muted hover:text-foreground transition-all",
  isActive && "bg-primary/10 text-primary border-primary/30",
)}
```

---

## 5. BADGE PATTERNS

### Property Badge (Stable, In-Place, Difficulty)

```tsx
// Positive (green):
className="rounded-full border border-green-500/30 bg-green-500/10 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-green-500 shadow-[0_0_8px_rgba(34,197,94,0.1)]"

// Neutral (blue):
className="rounded-full border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.1)]"

// Warning (amber):
className="rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-medium text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]"

// Difficulty colors:
// beginner → green, intermediate → amber, advanced → red, expert → purple
```

### Star Rating (mastery)

```tsx
<Star className={cn(
  "h-3.5 w-3.5 transition-all",
  filled
    ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]"
    : "text-foreground-subtle/30"
)} />
```

---

## 6. VISUALIZATION ELEMENT PATTERNS

### Sorting Bar

```tsx
style={{
  background: SORTING_STATE_GRADIENTS[state] || SORTING_STATE_GRADIENTS.default,
  minWidth: 4,
  boxShadow: state !== 'default'
    ? 'inset 0 0 20px rgba(255,255,255,0.1), 0 0 8px rgba(59,130,246,0.3)'
    : 'none',
  filter: state !== 'default' ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none',
}}
className={cn("w-full rounded-t-md", getStatePattern(state))}
```

### State Color Gradients (for bars)

```typescript
export const SORTING_STATE_GRADIENTS: Record<string, string> = {
  default: 'var(--foreground-subtle, #6b7280)',
  comparing: 'linear-gradient(to top, #2563eb, #3b82f6)',
  swapping: 'linear-gradient(to top, #dc2626, #ef4444)',
  sorted: 'linear-gradient(to top, #16a34a, #22c55e)',
  pivot: 'linear-gradient(to top, #7c3aed, #a855f7)',
  active: 'linear-gradient(to top, #d97706, #f59e0b)',
  found: 'linear-gradient(to top, #0891b2, #06b6d4)',
};
```

### Color-Independent State Patterns (accessibility)

```typescript
function getStatePattern(state: string): string {
  switch (state) {
    case 'comparing': return 'bg-gradient-to-t from-blue-600 to-blue-400';
    case 'swapping': return 'border-2 border-dashed border-white/50';
    case 'sorted': return 'border-t-2 border-white';
    case 'pivot': return 'ring-2 ring-purple-400 ring-offset-1';
    default: return '';
  }
}
```

### SVG Glow Filter (for graph nodes/edges)

```tsx
<defs>
  <filter id="glow">
    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
  <filter id="edge-glow">
    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
    <feMerge>
      <feMergeNode in="coloredBlur"/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  </filter>
</defs>

// Usage on active nodes:
<g filter={nodeState !== 'default' ? 'url(#glow)' : undefined}>

// Usage on active edges:
<motion.line filter={edgeState !== 'default' ? 'url(#edge-glow)' : undefined} />
```

### Graph Node Circle

```tsx
// Active node: translucent fill + colored stroke + glow
animate={{
  fill: nodeState !== 'default' ? nodeColor + '20' : '#1f2937',
  stroke: nodeColor,
  strokeWidth: nodeState !== 'default' ? 2.5 : 1.5,
}}

// Outer glow ring for active nodes:
{nodeState !== 'default' && (
  <motion.circle
    cx={x} cy={y} r={NODE_RADIUS + 4}
    fill="none"
    animate={{ stroke: nodeColor, strokeWidth: 2, opacity: 0.4 }}
  />
)}
```

---

## 7. TAB BAR PATTERN

### Bottom Panel Tabs (with icons + gradient underline)

```tsx
const TAB_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  'steps': Eye,
  'latency-bridge': Activity,
  'system-context': Globe,
  'flashcards': Zap,
  'code': Code2,
  'codelab': Terminal,
  'leaderboard': Trophy,
  'dashboard': BarChart3,
};

// Tab button:
<button
  onClick={() => setActiveTab(tab.id)}
  className={cn(
    "flex items-center gap-1.5 px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-colors",
    activeTab === tab.id
      ? "text-foreground"
      : "text-foreground-muted hover:text-foreground-subtle",
  )}
  style={activeTab === tab.id ? {
    borderBottom: '2px solid transparent',
    borderImage: 'linear-gradient(90deg, var(--primary), var(--violet-9, #7c3aed)) 1',
  } : { borderBottom: '2px solid transparent' }}
>
  {Icon && <Icon className={cn("h-3 w-3", activeTab === tab.id && "text-primary")} />}
  {tab.label}
</button>
```

---

## 8. ANIMATION PATTERNS

### Entry Animation (bars/nodes cascade)

```tsx
// Bars: scale from bottom with stagger
initial={{ scaleY: 0, opacity: 0 }}
animate={{ scaleY: 1, opacity: 1 }}
transition={{
  scaleY: { delay: index * 0.02, ...springs.bouncy },
  opacity: { delay: index * 0.02, duration: 0.15 },
}}
style={{ transformOrigin: 'bottom' }}
```

### Hover Scale

```tsx
className="transition-all hover:scale-105"
```

### Glow Pulse (Play button, active elements)

```tsx
// Static glow:
shadow-[0_0_20px_rgba(110,86,207,0.4)]

// Hover intensified glow:
hover:shadow-[0_0_30px_rgba(110,86,207,0.6)]
```

### Smooth State Transition

```tsx
transition={{ duration: duration.normal }} // 200ms
// or
transition={springs.snappy} // spring physics
```

---

## 9. BANNER / CALLOUT PATTERNS

### Daily Challenge Banner

```tsx
<div className="mb-3 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 p-3 backdrop-blur-sm">
  <div className="flex items-center gap-1.5 mb-1">
    <Zap className="h-3.5 w-3.5 text-primary drop-shadow-[0_0_4px_rgba(110,86,207,0.5)]" />
    <span className="text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent">
      Daily Challenge
    </span>
  </div>
  <p className="text-xs text-foreground-muted">Challenge text here</p>
</div>
```

### Prediction Banner

```tsx
// Before answer:
className="bg-primary/10 border-b border-primary/20 px-4 py-2 text-center"

// After correct:
className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 text-center"
```

### Step Overlay (on canvas)

```tsx
<div className="absolute left-2 top-2 sm:left-4 sm:top-4 z-10 max-w-[calc(100%-1rem)] sm:max-w-md rounded-lg bg-background/80 px-3 py-2 backdrop-blur-sm border border-border/50">
  <p className="text-xs font-medium text-foreground">
    Step {stepIndex + 1}: {step.description}
  </p>
</div>
```

---

## 10. RESPONSIVE PATTERNS

### Mobile-First Spacing

```tsx
className="p-4 sm:p-8"           // tighter on mobile
className="left-2 sm:left-4"     // closer to edge on mobile
className="gap-1 sm:gap-2"       // tighter gaps
className="flex flex-wrap gap-1"  // wrap on narrow screens
```

### Touch Targets

```tsx
// Minimum 44x44px for all interactive elements:
className="h-11 w-11" // 44px (WCAG minimum)
className="h-12 w-12" // 48px (for primary actions)
```

### Touch Gestures (swipe for step navigation)

```tsx
const touchStartX = useRef(0);

onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
onTouchEnd={(e) => {
  const diff = e.changedTouches[0].clientX - touchStartX.current;
  if (diff > 50) handleStepBackward();  // swipe right = back
  if (diff < -50) handleStepForward();  // swipe left = forward
}}
```

---

## 11. SHADOW REFERENCE TABLE

```
USE CASE                     SHADOW VALUE
──────────────────────────── ────────────────────────────────────────
Active bar inner glow        inset 0 0 20px rgba(255,255,255,0.1)
Active bar outer glow        0 0 8px rgba(59,130,246,0.3)
Active element drop shadow   drop-shadow(0 2px 4px rgba(0,0,0,0.2))
Primary button glow          0_0_20px_rgba(110,86,207,0.4)
Primary button hover         0_0_30px_rgba(110,86,207,0.6)
Toggle active glow           0_0_15px_rgba(110,86,207,0.15)
Pill selected glow           0_0_10px_rgba(110,86,207,0.2)
Star filled glow             drop-shadow(0_0_3px_rgba(251,191,36,0.5))
Info box accent glow         0_0_15px_rgba(COLOR,0.05)
Badge subtle glow            0_0_8px_rgba(COLOR,0.1)
Dropdown shadow              shadow-2xl (Tailwind utility)
Tooltip shadow               shadow-lg (Tailwind utility)
```

---

## 12. APPLYING TO OTHER MODULES

When upgrading another module (Data Structures, Database, Networking, etc.):

1. **Search-replace** in the module file:
   - `rounded-lg` → `rounded-xl` (containers)
   - `rounded-md` → `rounded-xl` (cards)
   - `border border-border` → `border border-border/30`
   - `bg-elevated` → `bg-elevated/50 backdrop-blur-sm`

2. **Add to visualizer containers:**
   - `bg-gradient-to-b from-elevated/80 to-background`

3. **Add to section headers:**
   - `bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent`

4. **Add to active elements:**
   - Glow shadow: `shadow-[0_0_Xpx_rgba(ACCENT_COLOR,0.N)]`

5. **Add to floating overlays:**
   - `backdrop-blur-md bg-background/60`

6. **Primary action buttons:**
   - `rounded-full shadow-[0_0_20px_rgba(110,86,207,0.4)]`

---

## 13. DO NOT DO

- Never use `border-border` at full opacity on dark backgrounds (too harsh)
- Never use `rounded-sm` or `rounded` — minimum is `rounded-lg`, prefer `rounded-xl`
- Never use flat `bg-elevated` without some transparency or blur
- Never hardcode hex colors — use CSS custom properties or the shared tokens
- Never skip reduced motion support — all visual upgrades must be non-motion-dependent
- Never use `box-shadow` for glow on SVG elements — use `filter: drop-shadow` or SVG `<filter>`
- Never put `backdrop-blur` on elements with many children (performance) — use on containers only
