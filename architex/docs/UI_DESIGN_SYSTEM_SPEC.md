# Architex UI Design System Specification

**Version**: 1.0  
**Date**: 2026-04-11  
**Status**: Draft  
**Audience**: Engineering, Design  
**Principle**: Every pixel earns its place. Every millisecond matters.

---

## Table of Contents

1. [Foundation: Design Tokens & Motion System](#1-foundation-design-tokens--motion-system)
2. [Linear-Style Interactions](#2-linear-style-interactions)
3. [Figma-Style Canvas Interactions](#3-figma-style-canvas-interactions)
4. [VS Code-Style Panel Management](#4-vs-code-style-panel-management)
5. [Notion-Style Content Blocks](#5-notion-style-content-blocks)
6. [Stripe-Level Visual Polish](#6-stripe-level-visual-polish)
7. [Bloomberg Terminal-Style Information Density](#7-bloomberg-terminal-style-information-density)
8. [Apple-Level Accessibility Polish](#8-apple-level-accessibility-polish)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. Foundation: Design Tokens & Motion System

### 1.1 Extended Shadow System

The current codebase has no shadow tokens. Add a 4-layer shadow system to `globals.css`:

```css
:root, .dark {
  --shadow-xs: 0 1px 2px 0 hsla(0 0% 0% / 0.20);
  --shadow-sm: 0 1px 3px 0 hsla(0 0% 0% / 0.25),
               0 1px 2px -1px hsla(0 0% 0% / 0.25);
  --shadow-md: 0 4px 6px -1px hsla(0 0% 0% / 0.30),
               0 2px 4px -2px hsla(0 0% 0% / 0.25);
  --shadow-lg: 0 10px 15px -3px hsla(0 0% 0% / 0.30),
               0 4px 6px -4px hsla(0 0% 0% / 0.25);
  --shadow-xl: 0 20px 25px -5px hsla(0 0% 0% / 0.35),
               0 8px 10px -6px hsla(0 0% 0% / 0.30);
  --shadow-glow: 0 0 20px 4px;
}

html.light {
  --shadow-xs: 0 1px 2px 0 hsla(0 0% 0% / 0.05);
  --shadow-sm: 0 1px 3px 0 hsla(0 0% 0% / 0.10),
               0 1px 2px -1px hsla(0 0% 0% / 0.10);
  --shadow-md: 0 4px 6px -1px hsla(0 0% 0% / 0.10),
               0 2px 4px -2px hsla(0 0% 0% / 0.10);
  --shadow-lg: 0 10px 15px -3px hsla(0 0% 0% / 0.10),
               0 4px 6px -4px hsla(0 0% 0% / 0.10);
  --shadow-xl: 0 20px 25px -5px hsla(0 0% 0% / 0.10),
               0 8px 10px -6px hsla(0 0% 0% / 0.10);
}
```

Register in `@theme inline`:

```css
--shadow-xs: var(--shadow-xs);
--shadow-sm: var(--shadow-sm);
--shadow-md: var(--shadow-md);
--shadow-lg: var(--shadow-lg);
--shadow-xl: var(--shadow-xl);
```

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P0

### 1.2 Motion System Constants

Create `src/lib/motion.ts` as the single source of truth for all animation values. The `motion` (Framer Motion v12) package is already installed.

```ts
// src/lib/motion.ts

export const springs = {
  snappy:  { stiffness: 500, damping: 30, mass: 0.8 },
  gentle:  { stiffness: 300, damping: 26, mass: 1.0 },
  soft:    { stiffness: 200, damping: 20, mass: 1.2 },
  bouncy:  { stiffness: 400, damping: 15, mass: 1.0 },
  layout:  { stiffness: 350, damping: 30, mass: 1.0 },
} as const;

export const durations = {
  instant:  60,   // ms -- tooltip show/hide
  fast:    120,   // ms -- hover states, color transitions
  normal:  200,   // ms -- panel opens, fade in
  slow:    350,   // ms -- page transitions
  glacial: 600,   // ms -- skeleton shimmer cycle
} as const;

export const easings = {
  easeOut:    'cubic-bezier(0.16, 1, 0.3, 1)',
  easeIn:     'cubic-bezier(0.55, 0, 1, 0.45)',
  easeInOut:  'cubic-bezier(0.65, 0, 0.35, 1)',
  linear:     'linear',
} as const;
```

**File**: `src/lib/motion.ts` (new)  
**Effort**: S  
**Priority**: P0

### 1.3 Typography Scale

Add to `globals.css`. Matches Linear's information-dense aesthetic:

```css
:root {
  --text-2xs:  0.625rem;  /* 10px -- metric badges, sparkline labels */
  --text-xs:   0.6875rem; /* 11px -- status bar, helper text */
  --text-sm:   0.8125rem; /* 13px -- body, node labels, panel content */
  --text-base: 0.875rem;  /* 14px -- headings in panels */
  --text-lg:   1rem;      /* 16px -- dialog titles */
  --text-xl:   1.25rem;   /* 20px -- page titles, empty state headings */
  --leading-tight:  1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
  --tracking-tight:  -0.01em;
  --tracking-normal:  0;
  --tracking-wide:    0.05em;
}
```

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P0

---

## 2. Linear-Style Interactions

### 2.1 Keyboard-First Navigation

**What makes Linear feel magical**: Every single action is within two keystrokes. The keyboard is the primary interface; the mouse is a fallback.

#### 2.1.1 Global Shortcuts (Always Active)

| Shortcut | Action | Current Status |
|----------|--------|----------------|
| `Cmd+K` | Command palette | Implemented |
| `Cmd+B` | Toggle sidebar | Implemented |
| `Cmd+Shift+B` | Toggle properties panel | Implemented |
| `Cmd+J` | Toggle bottom panel | Implemented |
| `Cmd+1..9` | Switch module | Implemented |
| `Cmd+Z` / `Cmd+Shift+Z` | Undo / Redo | Implemented |
| `Space` | Play/pause simulation | Implemented |
| `?` | Keyboard shortcuts dialog | TODO stub |
| `Cmd+Shift+Enter` | **NEW**: Zen mode (hide all panels) | Not implemented |
| `Cmd+E` | **NEW**: Quick template search | Not implemented |
| `Cmd+Shift+P` | **NEW**: Settings palette | Not implemented |
| `Cmd+S` | **NEW**: Export diagram | Not implemented |
| `Cmd+Shift+S` | **NEW**: Save as template | Not implemented |
| `Cmd+\` | **NEW**: Toggle minimap | Not implemented |
| `Cmd+.` | **NEW**: Focus mode (dim non-selected) | Not implemented |
| `Cmd+,` | **NEW**: Open settings | Not implemented |

#### 2.1.2 Canvas-Context Shortcuts (Active When Canvas Focused)

| Shortcut | Action |
|----------|--------|
| `V` | Select tool (default) |
| `H` | Hand/pan tool |
| `A` | Add node (opens quick-add popover at cursor) |
| `C` | Connect mode (draw edges) |
| `G` | Group selected nodes |
| `L` | Auto-layout selected / all |
| `F` | Fit view to selected / all |
| `Delete` / `Backspace` | Delete selected |
| `Cmd+D` | Duplicate selected |
| `Cmd+A` | Select all nodes |
| `Cmd+Shift+A` | Deselect all |
| `Tab` | Cycle to next node |
| `Shift+Tab` | Cycle to previous node |
| `Arrow keys` | Nudge selected nodes by 1px |
| `Shift+Arrow` | Nudge by 10px |
| `[` / `]` | Zoom out / in by 10% |
| `Cmd+0` | Zoom to 100% |
| `Cmd+-` / `Cmd+=` | Zoom out / in |

#### 2.1.3 Properties Panel Shortcuts (Active When Panel Focused)

| Shortcut | Action |
|----------|--------|
| `Escape` | Return focus to canvas |
| `Enter` | Commit field edit |
| `Tab` | Next field |
| `Shift+Tab` | Previous field |

#### Implementation

Extend `src/hooks/use-keyboard-shortcuts.ts` with a **context system**:

```ts
type KeyContext = 'global' | 'canvas' | 'panel' | 'dialog' | 'text-input';

function getActiveContext(): KeyContext {
  const active = document.activeElement;
  if (!active) return 'global';
  if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA'
      || active.getAttribute('contenteditable') === 'true') return 'text-input';
  if (active.closest('[role="dialog"]')) return 'dialog';
  if (active.closest('[data-panel]')) return 'panel';
  if (active.closest('.react-flow')) return 'canvas';
  return 'global';
}
```

Single-key shortcuts (V, H, A, etc.) only fire when context is `canvas`. `Cmd+` shortcuts fire in `global` and `canvas`. Nothing fires in `text-input` context (except `Escape` and `Cmd+` combos).

**Files**: `src/hooks/use-keyboard-shortcuts.ts`, new `src/hooks/use-keyboard-context.ts`  
**Effort**: M  
**Priority**: P0

### 2.2 Optimistic Updates

**Principle**: Every user action reflects instantly. Show the result, then sync. If it fails, undo silently.

The current `canvas-store.ts` already uses `zundo` for temporal undo. Extend with an optimistic mutation wrapper:

```ts
// src/lib/optimistic.ts
export function optimistic<T>(
  applyFn: () => T,
  persistFn: () => Promise<void>,
  rollbackFn: (snapshot: T) => void,
) {
  const snapshot = applyFn();
  persistFn().catch(() => {
    rollbackFn(snapshot);
  });
}
```

**Key behaviors**:
- **Delete**: Node vanishes instantly. 3-second "Undo" toast at bottom-left.
- **Add node**: Node appears at drop position with `scale: [0.8, 1.05, 1]` spring entry (springs.bouncy, 300ms).
- **Move node**: No confirmation ever. Position saved to IndexedDB on `onMoveEnd`.
- **Config change**: Field value updates instantly. Debounced persist (300ms) to IndexedDB.

**File**: New `src/lib/optimistic.ts`, modify `src/stores/canvas-store.ts`  
**Effort**: M  
**Priority**: P1

### 2.3 Command Palette Depth

The current command palette has modules, theme, panels, simulation controls, and component-add commands. It needs to become the **universal access point** for the entire application.

#### New Command Groups to Add

| Group | Examples | Data Source |
|-------|----------|-------------|
| **Templates** | "URL Shortener", "Twitter Feed", "Chat System" | `SYSTEM_DESIGN_TEMPLATES` |
| **Algorithms** | "Quick Sort", "Merge Sort", "Dijkstra's" | algorithm registry |
| **Concepts** | "CAP Theorem", "Consistent Hashing", "CRDT" | concept library |
| **Settings** | "Change font size", "Toggle grid snap" | ui-store / editor-store |
| **Recent** | Last 5 opened diagrams | IndexedDB history |
| **Export** | "Export as JSON", "Export as Mermaid", "Export as Terraform" | export functions |
| **Canvas** | "Fit view", "Zoom to 100%", "Select all", "Auto-layout" | canvas actions |
| **Navigation** | "Go to node: Redis Cache", "Go to edge: API -> DB" | current canvas nodes |

#### Visual Enhancement

- Add mode indicators: `>` = commands, `#` = templates, `@` = canvas nodes, `/` = settings
- Show previews for templates on hover/arrow-key navigation
- Recently used section at top (max 5, before groups)
- Category-aware search boosting based on active module

#### CSS Changes to Command Palette

```css
.command-backdrop {
  backdrop-filter: blur(8px) saturate(150%);
  background: hsla(228, 15%, 7%, 0.6);
}

.command-dialog {
  border: 1px solid var(--border);
  box-shadow:
    var(--shadow-xl),
    0 0 0 1px hsla(252, 87%, 67%, 0.1),
    inset 0 1px 0 0 hsla(0, 0%, 100%, 0.03);
}

[cmdk-item][aria-selected="true"] {
  background: var(--accent);
  border-left: 2px solid var(--primary);
}
```

**Entry animation** (Framer Motion):

```ts
initial={{ opacity: 0, scale: 0.96, y: -8 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.96, y: -8 }}
transition={{ type: "spring", ...springs.snappy }}
```

**File**: `src/components/shared/command-palette.tsx`  
**Effort**: L  
**Priority**: P0

### 2.4 Smooth Transitions

Every transition in Architex must use one of these patterns. No `transition: all` ever.

#### Panel Slide

```ts
<motion.div
  initial={{ width: 0, opacity: 0 }}
  animate={{ width: "auto", opacity: 1 }}
  exit={{ width: 0, opacity: 0 }}
  transition={{ type: "spring", ...springs.layout }}
/>
```

The current `WorkspaceLayout` re-keys the `Group` component when panels toggle, causing full remount. Instead, use `react-resizable-panels` collapse API with animated size transition.

#### Modal / Dialog

```ts
// Backdrop
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: durations.normal / 1000 }}

// Dialog content
initial={{ opacity: 0, scale: 0.96, y: -8 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ type: "spring", ...springs.snappy }}
```

#### List Item Stagger

```ts
// Parent: staggerChildren: 0.03
// Child: { opacity: 0, y: 4 } -> { opacity: 1, y: 0 }
```

#### Node Appear / Delete

```ts
// Appear
initial={{ scale: 0.8, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ type: "spring", ...springs.bouncy }}

// Delete
exit={{ scale: 0.9, opacity: 0 }}
transition={{ duration: durations.fast / 1000, ease: easings.easeIn }}
```

**File**: All components using `transition-*` classes  
**Effort**: M  
**Priority**: P1

### 2.5 Information Density

**Target**: 13px base font, 4px unit grid, maximum content per pixel.

| Element | Current | Target | Change |
|---------|---------|--------|--------|
| Node label | `text-xs` (12px) | 13px (`text-[13px]`) | BaseNode.tsx |
| Node metrics badge | `text-[10px]` | Keep 10px | No change |
| Properties panel body | `text-xs` (12px) | 13px | PropertiesPanel.tsx |
| Properties panel labels | `text-xs` (12px) | 11px (`text-[11px]`) | PropertiesPanel.tsx |
| Command palette items | `text-sm` (14px) | 13px | command-palette.tsx |
| Status bar | `text-xs` (12px) | 11px | status-bar.tsx |
| Bottom panel metric values | `text-sm` (14px) | 13px monospace | BottomPanel.tsx |
| Palette item title | `text-sm` (14px) | 13px | ComponentPalette.tsx |
| Palette item description | `text-xs` (12px) | 11px | ComponentPalette.tsx |

**Files**: BaseNode.tsx, PropertiesPanel.tsx, command-palette.tsx, status-bar.tsx, BottomPanel.tsx, ComponentPalette.tsx  
**Effort**: S  
**Priority**: P1

---

## 3. Figma-Style Canvas Interactions

### 3.1 Smart Selection

The current `DesignCanvas.tsx` relies on React Flow's built-in selection. Enhance:

| Input | Behavior |
|-------|----------|
| Click | Select single, deselect others |
| Cmd+Click | Toggle node in selection |
| Shift+Click | Add node to selection |
| Click empty space | Deselect all |
| Drag on empty space | Rubber band select (React Flow built-in) |
| Cmd+A | Select all nodes |
| Right-click | Context menu: "Select Connected", "Select Same Type" |

```ts
// src/lib/canvas/selection.ts
export function selectConnected(nodeId: string, nodes: Node[], edges: Edge[]): string[] {
  const visited = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    edges.forEach(e => {
      if (e.source === current) queue.push(e.target);
      if (e.target === current) queue.push(e.source);
    });
  }
  return Array.from(visited);
}

export function selectSameType(nodeId: string, nodes: Node[]): string[] {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return [];
  return nodes.filter(n => n.type === node.type).map(n => n.id);
}
```

**File**: New `src/lib/canvas/selection.ts`, modify `DesignCanvas.tsx`  
**Effort**: M  
**Priority**: P1

### 3.2 Smart Guides (Alignment Guides)

When dragging a node, show magenta dashed alignment guides when the node's edges align with any other node's edges or centers.

```ts
// src/components/canvas/overlays/AlignmentGuides.tsx

interface Guide {
  orientation: 'horizontal' | 'vertical';
  position: number;
  from: number;
  to: number;
}

const SNAP_THRESHOLD = 5; // px in flow coordinates
const GUIDE_COLOR = 'hsl(330, 90%, 60%)'; // magenta, like Figma
const GUIDE_DASH = '4 2';
const GUIDE_WIDTH = 1;
```

**Visual spec**:
- Color: `hsl(330, 90%, 60%)` (magenta)
- Style: dashed, 4px dash 2px gap
- Width: 1px
- Extends from guide source node edge to dragged node edge
- Disappears on mouseup with 100ms fade

Use React Flow's `onNodeDrag` callback. Compute guides on every drag tick (throttled to 16ms / 60fps). Render guides as an SVG overlay inside the React Flow wrapper.

**File**: New `src/components/canvas/overlays/AlignmentGuides.tsx`, modify `DesignCanvas.tsx`  
**Effort**: L  
**Priority**: P1

### 3.3 Distance Indicators

While dragging, show pixel distance between nodes near each other:

```
+--------+          +--------+
| Node A |--[42px]--| Node B |
+--------+          +--------+
```

Distance label: 10px monospace, magenta, on `var(--surface)` background with 2px padding.

**File**: Same as 3.2 overlay  
**Effort**: S (adds to 3.2)  
**Priority**: P2

### 3.4 Smart Distribution

Select 3+ nodes, press `Cmd+Shift+D`:

```ts
// src/lib/canvas/distribute.ts
export function distributeHorizontally(nodes: Node[]): Node[] {
  if (nodes.length < 3) return nodes;
  const sorted = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const first = sorted[0].position.x;
  const last = sorted[sorted.length - 1].position.x;
  const step = (last - first) / (sorted.length - 1);
  return sorted.map((node, i) => ({
    ...node,
    position: { ...node.position, x: first + step * i },
  }));
}
```

Animate redistribution over 300ms using `springs.layout`.

**File**: New `src/lib/canvas/distribute.ts`  
**Effort**: S  
**Priority**: P2

### 3.5 Frame / Group Concept

Select nodes, press `G` to group into a labeled region:

```ts
// canvas-store.ts addition
interface CanvasGroup {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  collapsed: boolean;
}
```

Render as a background node with 24px padding, 6% opacity fill, dashed border, floating label at top-left.

**File**: New `src/components/canvas/nodes/GroupNode.tsx`, modify `canvas-store.ts`  
**Effort**: L  
**Priority**: P2

### 3.6 Double-Click to Edit

Double-clicking a node's label enters inline edit mode:

```tsx
// In BaseNode.tsx
const [editing, setEditing] = useState(false);

{editing ? (
  <input
    autoFocus
    defaultValue={data.label}
    className="w-full bg-transparent text-[13px] font-semibold outline-none
               border-b border-primary caret-primary"
    onBlur={(e) => { updateLabel(e.target.value); setEditing(false); }}
    onKeyDown={(e) => {
      if (e.key === 'Enter') { updateLabel(e.currentTarget.value); setEditing(false); }
      if (e.key === 'Escape') setEditing(false);
    }}
  />
) : (
  <span
    className="truncate text-[13px] font-semibold cursor-text"
    onDoubleClick={() => setEditing(true)}
  >
    {data.label}
  </span>
)}
```

**File**: `src/components/canvas/nodes/system-design/BaseNode.tsx`  
**Effort**: S  
**Priority**: P1

### 3.7 Auto-Layout

One-click layout via `L` key or command palette:

| Layout | Algorithm | Use Case |
|--------|-----------|----------|
| Hierarchical | Dagre (top-to-bottom) | Default for system design |
| Force-directed | D3-force | Organic clustering |
| Grid | Simple grid | Clean arrangement |
| Horizontal | Left-to-right Dagre | Pipeline architectures |

```ts
// src/lib/canvas/auto-layout.ts (uses @dagrejs/dagre)
g.setGraph({
  rankdir: 'TB',
  nodesep: 60,
  ranksep: 80,
  marginx: 40,
  marginy: 40,
});
```

Animate layout change: each node transitions to new position over 500ms using `springs.soft`.

**File**: New `src/lib/canvas/auto-layout.ts`, add `@dagrejs/dagre` dependency  
**Effort**: M  
**Priority**: P1

### 3.8 Copy/Paste Between Tabs

```ts
// src/lib/canvas/clipboard.ts
interface ClipboardPayload {
  version: 1;
  source: 'architex';
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  groups: SerializedGroup[];
}
// On Cmd+C: serialize to JSON, write to clipboard
// On Cmd+V: read clipboard, detect format (Architex JSON, Mermaid, or plain text)
```

**File**: New `src/lib/canvas/clipboard.ts`  
**Effort**: M  
**Priority**: P2

---

## 4. VS Code-Style Panel Management

### 4.1 Panel Drag to Rearrange

Allow dragging bottom panel tabs between bottom-panel and sidebar. Complex, low ROI for learning platform.

**Effort**: L  
**Priority**: P3

### 4.2 Split Views

Two React Flow instances side-by-side for diagram comparison.

**Effort**: L  
**Priority**: P3

### 4.3 Breadcrumbs

```
System Design > Twitter Feed Template > Editing
```

```tsx
// src/components/shared/breadcrumbs.tsx
<nav className="flex items-center gap-1 h-7 px-3 text-[11px]
                border-b border-border bg-surface text-foreground-muted">
```

**Height**: 28px  
**Font**: 11px, `--foreground-muted`  
**Separator**: ChevronRight icon, 12px, `--foreground-subtle`

**File**: New `src/components/shared/breadcrumbs.tsx`  
**Effort**: S  
**Priority**: P1

### 4.4 Tab Management

Multiple diagrams open as tabs:

- **Height**: 36px
- **Active tab**: bg-surface, border-b-2 border-primary, text-foreground
- **Inactive tab**: bg-transparent, text-foreground-muted
- **Close button**: X icon on hover, 14px
- **Dirty indicator**: 6px circle of --state-warning before label
- **Overflow**: horizontal scroll with fade-out gradient at edges

**File**: New `src/components/shared/tab-bar.tsx`  
**Effort**: M  
**Priority**: P2

### 4.5 Zen Mode

`Cmd+Shift+Enter` hides everything except the canvas.

```ts
// ui-store.ts addition:
zenMode: boolean;
toggleZenMode: () => void;
// Saves pre-zen panel state, restores on exit
```

**Exit indicator**: Subtle tooltip "Press Cmd+Shift+Enter to exit Zen mode" appears for 3 seconds, then fades out.

**File**: `src/stores/ui-store.ts`, `src/components/shared/workspace-layout.tsx`  
**Effort**: S  
**Priority**: P1

### 4.6 Panel Maximization

Double-click panel header to maximize. Double-click again to restore.

```ts
// ui-store.ts:
maximizedPanel: 'none' | 'sidebar' | 'properties' | 'bottom';
```

Animate expansion with `springs.layout`.

**File**: `src/stores/ui-store.ts`, `src/components/shared/workspace-layout.tsx`  
**Effort**: M  
**Priority**: P2

---

## 5. Notion-Style Content Blocks

### 5.1 Slash Commands in Notes

Type "/" in any text field to show floating command menu:

```
/h1        Heading 1
/h2        Heading 2
/bullet    Bullet list
/code      Code block
/callout   Callout box
/divider   Horizontal rule
/formula   Inline calculation
```

Uses `@radix-ui/react-popover` (already installed), positioned at caret.

**Animation**:
```ts
initial={{ opacity: 0, y: 4, scale: 0.97 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ type: "spring", ...springs.snappy }}
```

**File**: New `src/components/shared/slash-menu.tsx`  
**Effort**: M  
**Priority**: P2

### 5.2 Toggle Sections

Convert Properties panel sections to collapsible toggles:

```tsx
// src/components/shared/toggle-section.tsx
<button onClick={() => setOpen(!open)} className="...">
  <motion.div
    animate={{ rotate: open ? 90 : 0 }}
    transition={{ type: "spring", ...springs.snappy }}
  >
    <ChevronRight className="h-3 w-3" />
  </motion.div>
  {title}
</button>
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ type: "spring", ...springs.layout }}
    />
  )}
</AnimatePresence>
```

**File**: New `src/components/shared/toggle-section.tsx`, modify `PropertiesPanel.tsx`  
**Effort**: S  
**Priority**: P1

### 5.3 Callout Blocks

Colored callout boxes for learning mode:

```tsx
type CalloutVariant = 'info' | 'warning' | 'success' | 'error' | 'tip';
// Background: color-mix(in srgb, ${color} 8%, transparent)
// Left border: 3px solid ${color}
// Border-radius: 6px
// Padding: 10px 14px
```

**File**: New `src/components/shared/callout.tsx`  
**Effort**: S  
**Priority**: P2

### 5.4 Inline Calculations

In number fields, detect "= expression" patterns and compute the result using a safe recursive descent math parser (no dynamic code execution). Supports +, -, *, /, parentheses only.

```ts
// src/lib/inline-calc.ts
// Uses a recursive descent parser:
// expression = term (('+' | '-') term)*
// term       = factor (('*' | '/') factor)*
// factor     = NUMBER | '(' expression ')'
```

**File**: New `src/lib/inline-calc.ts`, modify `PropertiesPanel.tsx`  
**Effort**: S  
**Priority**: P3

---

## 6. Stripe-Level Visual Polish

### 6.1 Gradient Mesh Backgrounds

For template gallery and empty canvas state:

```css
.gradient-mesh {
  background:
    radial-gradient(ellipse at 20% 50%,
      color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%,
      color-mix(in srgb, var(--node-compute) 4%, transparent) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%,
      color-mix(in srgb, var(--node-storage) 4%, transparent) 0%, transparent 50%);
  animation: gradient-drift 20s ease-in-out infinite alternate;
}

@keyframes gradient-drift {
  0%   { background-position: 0% 0%, 100% 0%, 50% 100%; }
  100% { background-position: 100% 100%, 0% 100%, 100% 0%; }
}
```

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P2

### 6.2 Glass Morphism Panels

For floating panels (MiniMap, Controls, context menus, tooltips):

```css
.glass {
  background: color-mix(in srgb, var(--surface) 70%, transparent);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
}

.react-flow__controls {
  background: color-mix(in srgb, var(--surface) 80%, transparent) !important;
  backdrop-filter: blur(12px) saturate(150%) !important;
}

.react-flow__minimap {
  background: color-mix(in srgb, var(--surface) 85%, transparent) !important;
  backdrop-filter: blur(8px) saturate(130%) !important;
}
```

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P1

### 6.3 Multi-Layer Shadow System

| Component | Shadow Level |
|-----------|-------------|
| Canvas nodes | `shadow-sm` resting, `shadow-md` hover, `shadow-lg` dragging |
| Command palette | `shadow-xl` |
| Context menu | `shadow-lg` |
| Tooltips | `shadow-md` |
| Bottom panel | `shadow-sm` (top edge) |
| Modal dialogs | `shadow-xl` |

Node shadow in BaseNode:

```tsx
style={{
  boxShadow: selected
    ? `var(--shadow-lg), 0 0 12px 2px color-mix(in srgb, ${categoryColor} 35%, transparent)`
    : dragging ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
  transition: 'box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1)',
}}
```

**File**: `src/app/globals.css`, `BaseNode.tsx`, all floating panels  
**Effort**: S  
**Priority**: P1

### 6.4 Color Transitions

```css
.transition-color-smooth {
  transition: color 200ms cubic-bezier(0.16, 1, 0.3, 1),
              background-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 200ms cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

Replace Tailwind's default `transition-colors` (150ms ease) with `200ms cubic-bezier(0.16, 1, 0.3, 1)` for the smoother Stripe-like feel.

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P1

### 6.5 Loading Skeletons

```tsx
// src/components/shared/skeleton.tsx
function Skeleton({ className, ...props }) {
  return (
    <div className={cn("rounded-md bg-muted relative overflow-hidden", className)} {...props}>
      <div className="absolute inset-0 -translate-x-full
                      bg-gradient-to-r from-transparent
                      via-[color-mix(in_srgb,var(--foreground)_5%,transparent)]
                      to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
    </div>
  );
}
```

```css
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
```

Layout-specific skeletons: NodeSkeleton (180px), PropertiesSkeleton, TemplateCardSkeleton.

**File**: New `src/components/shared/skeleton.tsx`  
**Effort**: S  
**Priority**: P1

### 6.6 Success Celebrations

Confetti on challenge completion (using `canvas-confetti` library):

```ts
// src/lib/celebrations.ts
confetti({
  particleCount: 80,
  spread: 60,
  origin: { y: 0.7 },
  colors: ['hsl(252,87%,67%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(217,91%,60%)'],
  disableForReducedMotion: true,
});
```

XP gain toast: floating "+50 XP" that rises 40px and fades out over 1.5s.

**File**: New `src/lib/celebrations.ts`  
**Effort**: S  
**Priority**: P2

---

## 7. Bloomberg Terminal-Style Information Density

### 7.1 Data-Rich Nodes

The current BaseNode shows icon, label, state dot, and optionally one throughput metric. Enhance to show 5+ metrics without clutter:

```
+---------------------------------------+
| [icon] Redis Cache        [*state]    |  <- Header: 32px
|---------------------------------------|
| Hit Rate    Throughput     Latency     |  <- Metric row: 28px
| 94.2%       12.4K rps     2.1ms       |
|---------------------------------------|
| [========85%====    ] 85% util        |  <- Utilization bar: 20px
+---------------------------------------+
```

Total height: ~80px. Width: 180px (unchanged).

```tsx
function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[9px] uppercase tracking-wide text-foreground-subtle leading-none">
        {label}
      </div>
      <div className="text-[11px] font-mono font-medium text-foreground leading-tight mt-0.5">
        {value}
      </div>
    </div>
  );
}
```

Utilization bar: 1.5px tall, rounded-full, color-coded (>90% red, >70% amber, else category color).

**File**: `src/components/canvas/nodes/system-design/BaseNode.tsx`  
**Effort**: M  
**Priority**: P0

### 7.2 Sparkline Charts

Tiny inline throughput trend charts (40x14px):

```tsx
// src/components/shared/sparkline.tsx
function Sparkline({ data, width = 40, height = 14, color, filled = true }) {
  // SVG polyline from data points
  // Filled area polygon below the line
  // strokeWidth: 1.5, strokeLinecap: "round"
}
```

Store last 30 data points per node in simulation store:

```ts
nodeHistory: Record<string, { throughput: number[]; latency: number[] }>;
```

**File**: New `src/components/shared/sparkline.tsx`, modify `simulation-store.ts`  
**Effort**: M  
**Priority**: P1

### 7.3 Metric Badges

Color-coded compact badges with threshold-based coloring:

```ts
// Latency: >500ms = red, >100ms = amber, else green
// Error rate: >5% = red, >1% = amber, else green
// Hit rate: <80% = red, <95% = amber, else green
// Utilization: >90% = red, >70% = amber, else blue
```

Badge visual: 18px tall, 4px 6px padding, 4px radius, 10px monospace font, `color-mix(in srgb, ${color} 12%, transparent)` background, 300ms color transition.

**File**: New `src/components/shared/metric-badge.tsx`  
**Effort**: S  
**Priority**: P1

### 7.4 Status Indicators

Multi-channel state encoding:

| State | Dot Color | Dot Animation | Border | Shadow |
|-------|-----------|---------------|--------|--------|
| `idle` | gray | Static | 1px `--border` | `shadow-sm` |
| `active` | blue | Pulsing (2s) | 1px category color | `shadow-sm` |
| `success` | green | Static | 1px category color | `shadow-sm` |
| `warning` | amber | Slow pulse (1.5s) | 1px `--state-warning` | `shadow-sm` + amber glow |
| `error` | red | Fast flash (0.5s) | 2px `--state-error` | `shadow-md` + red glow |
| `processing` | purple | Spin (1s) | 1px category color | `shadow-sm` |

```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
@keyframes flash-dot {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.2; }
}
.dot-active     { animation: pulse-dot 2s ease-in-out infinite; }
.dot-warning    { animation: pulse-dot 1.5s ease-in-out infinite; }
.dot-error      { animation: flash-dot 0.5s ease-in-out infinite; }
.dot-processing { animation: spin-dot 1s linear infinite; }
```

For `processing`, the dot becomes a 2px-border-top spinner instead of a filled circle.

**File**: `src/app/globals.css`, `BaseNode.tsx`  
**Effort**: S  
**Priority**: P0

### 7.5 Compact Mode Toggle

`Cmd+Shift+C` toggles between detailed and compact nodes:

| Mode | Width | Content |
|------|-------|---------|
| Compact | 120px | Icon + label only, state via border color, ~36px tall |
| Detailed | 180px | Full metrics, sparklines, utilization bar, ~80-100px tall |

```ts
// ui-store.ts:
nodeDisplayMode: 'compact' | 'detailed';
```

Animate width transition with `springs.layout`.

**File**: `src/stores/ui-store.ts`, `BaseNode.tsx`  
**Effort**: M  
**Priority**: P2

---

## 8. Apple-Level Accessibility Polish

### 8.1 VoiceOver Optimization

| Component | Current | Required |
|-----------|---------|----------|
| Activity bar buttons | `title` only | `aria-label`, `role="tab"`, `aria-selected` |
| Activity bar container | No role | `role="tablist"`, `aria-label="Module navigation"` |
| Canvas nodes | No aria | `role="button"`, `aria-label="[type]: [label], state: [state]"` |
| Status bar | Implicit | `role="status"`, `aria-live="polite"` |
| Properties panel | No landmark | `role="complementary"`, `aria-label="Node properties"` |
| Bottom panel tabs | Button only | `role="tablist"` / `role="tab"` / `role="tabpanel"` |
| Simulation controls | Icon-only | `aria-label` on every button |
| Resize handles | No aria | `role="separator"`, `aria-orientation` |

#### Screen Reader Announcements

```tsx
// src/components/shared/live-region.tsx
<div role="status" aria-live="polite" aria-atomic className="sr-only">
  {message}
</div>
```

**File**: All components listed, new `src/components/shared/live-region.tsx`  
**Effort**: M  
**Priority**: P0

### 8.2 Focus Management

**Tab order**: Activity bar -> Sidebar -> Canvas -> Properties -> Bottom panel -> Status bar.

**Focus trap in dialogs**: Wrap command palette with `@radix-ui/react-dialog` (already installed) for built-in focus trapping, Escape-to-close, and inert background.

**Skip links**:

```tsx
<a href="#canvas-main"
   className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100]
              focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
  Skip to canvas
</a>
```

**File**: `src/app/layout.tsx`, `command-palette.tsx`  
**Effort**: M  
**Priority**: P0

### 8.3 Reduced Motion

Current `globals.css` kills all animation durations. Additionally:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-shimmer { animation: none !important; background: var(--muted); }
  .dot-active, .dot-warning, .dot-error, .dot-processing { animation: none !important; }
  .react-flow__edge-path { animation: none !important; }
  .gradient-mesh { animation: none !important; }
}
```

For Framer Motion, use `useReducedMotion` hook from `motion/react`:

```ts
const reduced = useReducedMotion();
// If reduced: skip initial, set duration to 0
```

**File**: `src/app/globals.css`, all animated components  
**Effort**: S  
**Priority**: P0

### 8.4 High Contrast

| Element | Color-only? | Fix |
|---------|-------------|-----|
| State dot (active vs idle) | Yes | Add animation for active, shape change for processing |
| Metrics (good/warning/bad) | Red/amber/green | Add icon prefix (check, warning, X) |
| Activity bar active state | Color + indicator bar | Already good |
| Edge types | Color differentiated | Stroke-dasharray patterns (mostly done) |

```css
@media (forced-colors: active) {
  :root {
    --primary: CanvasText;
    --border: CanvasText;
    --foreground: CanvasText;
    --background: Canvas;
    --surface: Canvas;
  }
  .react-flow__handle { forced-color-adjust: none; }
}
```

**File**: `src/app/globals.css`  
**Effort**: S  
**Priority**: P1

### 8.5 Keyboard Canvas Navigation

When a node is focused via Tab:
- Visible focus ring (2px solid `--ring`, 2px offset)
- Arrow keys follow edges to connected nodes
- Enter opens properties panel for that node
- Space selects/deselects the node
- Delete removes (with undo toast)

Each node needs `tabIndex={0}` and `onKeyDown` handler.

**File**: `BaseNode.tsx`, new `src/hooks/use-canvas-keyboard-nav.ts`  
**Effort**: M  
**Priority**: P1

---

## 9. Implementation Roadmap

### P0 -- Foundation (Sprint 1, ~1 week)

| Item | Section | Effort | Component |
|------|---------|--------|-----------|
| Shadow token system | 1.1 | S | globals.css |
| Motion system constants | 1.2 | S | New lib/motion.ts |
| Typography scale | 1.3 | S | globals.css |
| Status dot animations | 7.4 | S | globals.css, BaseNode.tsx |
| Data-rich node layout | 7.1 | M | BaseNode.tsx |
| Keyboard context system | 2.1 | M | use-keyboard-shortcuts.ts |
| VoiceOver audit + fix | 8.1 | M | All components |
| Focus management + skip links | 8.2 | M | layout.tsx, command-palette.tsx |
| Reduced motion enhancements | 8.3 | S | globals.css |

### P1 -- Core Experience (Sprint 2-3, ~2 weeks)

| Item | Section | Effort | Component |
|------|---------|--------|-----------|
| Optimistic updates | 2.2 | M | canvas-store.ts |
| Command palette depth | 2.3 | L | command-palette.tsx |
| Panel transitions (spring) | 2.4 | M | All panels |
| Information density pass | 2.5 | S | Multiple |
| Smart selection | 3.1 | M | DesignCanvas.tsx |
| Smart alignment guides | 3.2 | L | New overlay |
| Double-click to edit | 3.6 | S | BaseNode.tsx |
| Auto-layout (dagre) | 3.7 | M | New auto-layout.ts |
| Breadcrumbs | 4.3 | S | New breadcrumbs.tsx |
| Zen mode | 4.5 | S | ui-store, workspace-layout |
| Toggle sections | 5.2 | S | New toggle-section.tsx |
| Glass morphism | 6.2 | S | globals.css |
| Shadow application | 6.3 | S | BaseNode.tsx, panels |
| Color transitions | 6.4 | S | globals.css |
| Loading skeletons | 6.5 | S | New skeleton.tsx |
| Sparkline charts | 7.2 | M | New sparkline.tsx |
| Metric badges | 7.3 | S | New metric-badge.tsx |
| High contrast | 8.4 | S | globals.css |
| Keyboard canvas nav | 8.5 | M | BaseNode.tsx |

### P2 -- Polish (Sprint 4-5)

| Item | Section | Effort | Component |
|------|---------|--------|-----------|
| Distance indicators | 3.3 | S | AlignmentGuides overlay |
| Smart distribution | 3.4 | S | New distribute.ts |
| Frame/group concept | 3.5 | L | New GroupNode.tsx |
| Copy/paste between tabs | 3.8 | M | New clipboard.ts |
| Tab management | 4.4 | M | New tab-bar.tsx |
| Panel maximization | 4.6 | M | workspace-layout.tsx |
| Slash commands | 5.1 | M | New slash-menu.tsx |
| Callout blocks | 5.3 | S | New callout.tsx |
| Gradient mesh backgrounds | 6.1 | S | globals.css |
| Success celebrations | 6.6 | S | New celebrations.ts |
| Compact mode toggle | 7.5 | M | BaseNode.tsx |

### P3 -- Future (Backlog)

| Item | Section | Effort | Component |
|------|---------|--------|-----------|
| Panel drag to rearrange | 4.1 | L | workspace-layout.tsx |
| Split views | 4.2 | L | New SplitCanvas.tsx |
| Inline calculations | 5.4 | S | PropertiesPanel.tsx |

---

## Appendix A: New Files

| File Path | Purpose |
|-----------|---------|
| `src/lib/motion.ts` | Spring physics, durations, easings |
| `src/lib/optimistic.ts` | Optimistic update wrapper |
| `src/lib/inline-calc.ts` | Safe math expression parser |
| `src/lib/celebrations.ts` | Confetti and XP animations |
| `src/lib/canvas/selection.ts` | Smart selection utilities |
| `src/lib/canvas/distribute.ts` | Node distribution algorithms |
| `src/lib/canvas/auto-layout.ts` | Auto-layout (dagre wrapper) |
| `src/lib/canvas/clipboard.ts` | Copy/paste serialization |
| `src/hooks/use-keyboard-context.ts` | Keyboard context detection |
| `src/hooks/use-canvas-keyboard-nav.ts` | Arrow-key canvas navigation |
| `src/components/shared/breadcrumbs.tsx` | Breadcrumb navigation |
| `src/components/shared/tab-bar.tsx` | Multi-diagram tab bar |
| `src/components/shared/toggle-section.tsx` | Collapsible panel sections |
| `src/components/shared/slash-menu.tsx` | Slash command menu |
| `src/components/shared/callout.tsx` | Colored callout blocks |
| `src/components/shared/skeleton.tsx` | Loading skeleton components |
| `src/components/shared/sparkline.tsx` | Inline sparkline charts |
| `src/components/shared/metric-badge.tsx` | Color-coded metric badges |
| `src/components/shared/live-region.tsx` | Screen reader announcements |
| `src/components/canvas/overlays/AlignmentGuides.tsx` | Smart guides overlay |
| `src/components/canvas/nodes/GroupNode.tsx` | Frame/group node |
| `src/components/canvas/SplitCanvas.tsx` | Side-by-side canvas |

## Appendix B: New Dependencies

| Package | Purpose | Section |
|---------|---------|---------|
| `@dagrejs/dagre` | Hierarchical graph layout | 3.7 |
| `canvas-confetti` | Celebration confetti | 6.6 |

## Appendix C: Existing File Modifications

| Existing File | Sections Affecting It |
|---------------|----------------------|
| `src/app/globals.css` | 1.1, 1.3, 6.1, 6.2, 6.4, 7.4, 8.3, 8.4 |
| `src/components/canvas/nodes/system-design/BaseNode.tsx` | 2.5, 3.6, 6.3, 7.1, 7.2, 7.4, 7.5, 8.5 |
| `src/components/shared/command-palette.tsx` | 2.3, 2.5, 6.2, 8.2 |
| `src/components/shared/workspace-layout.tsx` | 2.4, 4.3, 4.5, 4.6 |
| `src/components/shared/activity-bar.tsx` | 8.1 |
| `src/components/shared/status-bar.tsx` | 2.5, 8.1 |
| `src/components/canvas/DesignCanvas.tsx` | 3.1, 3.2, 3.7 |
| `src/components/canvas/panels/PropertiesPanel.tsx` | 2.5, 5.2, 5.4 |
| `src/components/canvas/panels/ComponentPalette.tsx` | 2.5 |
| `src/components/canvas/panels/BottomPanel.tsx` | 2.5, 8.1 |
| `src/stores/ui-store.ts` | 4.5, 4.6, 7.5 |
| `src/stores/canvas-store.ts` | 2.2, 3.5 |
| `src/stores/simulation-store.ts` | 7.2 |
| `src/hooks/use-keyboard-shortcuts.ts` | 2.1 |
| `src/app/layout.tsx` | 8.2 |
