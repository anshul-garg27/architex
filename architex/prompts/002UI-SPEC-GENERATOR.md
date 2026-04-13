# UI SPECIFICATION GENERATOR — Figma-Level Layout Spec for {{MODULE_NAME}}

> You are a **senior UI designer** creating a pixel-perfect specification document.
> This is NOT a vision document — this is the BLUEPRINT that a developer follows to build the UI.
> Every pixel, every spacing value, every interaction state is defined here.
>
> Read the UI Vision document for this module FIRST (if it exists), then translate it
> into exact specifications.

---

## YOUR DELIVERABLE

A complete UI specification that a developer can implement WITHOUT asking any design questions.
Every element has: position, size, color, font, spacing, states (default/hover/active/disabled/focus),
animation, and responsive behavior.

---

## PHASE 1: READ THE CODEBASE

Read these files to understand the current implementation:

```
src/components/modules/{{MODULE_SLUG}}/
src/app/page.tsx (how the module mounts in the app shell)
src/components/shared/activity-bar.tsx (the sidebar navigation)
src/components/workspace/ (layout components)
```

Read the design system:
```
src/app/globals.css (CSS variables, theme tokens)
tailwind.config.ts (custom colors, spacing, fonts)
```

---

## PHASE 2: SCREEN MAP

List EVERY screen/view/state the user can see in this module:

```
SCREEN 1: Default view (first load)
SCREEN 2: [Item] selected
SCREEN 3: Running/playing state
SCREEN 4: Completed state
SCREEN 5: Error state
SCREEN 6: Empty state
SCREEN 7: Mobile view
SCREEN 8: Settings/config open
...
```

For EACH screen, create the specification in Phase 3.

---

## PHASE 3: PER-SCREEN SPECIFICATION

For each screen, provide:

### 3.1 Layout Grid

```
┌─────────────────────────────────────────────────────────────────┐
│ Activity Bar │    Sidebar (260px)    │    Canvas (flex-1)    │ Props (280px) │
│   (48px)     │                       │                       │               │
│              │  ┌─────────────────┐  │  ┌─────────────────┐  │  ┌─────────┐ │
│   [icons]    │  │ Section Header  │  │  │                 │  │  │ Title   │ │
│              │  │ ─────────────── │  │  │                 │  │  │ ─────── │ │
│              │  │ Item 1          │  │  │   MAIN CONTENT  │  │  │ Info 1  │ │
│              │  │ Item 2 ●        │  │  │                 │  │  │ Info 2  │ │
│              │  │ Item 3          │  │  │                 │  │  │ Info 3  │ │
│              │  └─────────────────┘  │  │                 │  │  └─────────┘ │
│              │                       │  └─────────────────┘  │               │
│              │  ┌─────────────────┐  │                       │               │
│              │  │ Controls        │  │  ┌─────────────────┐  │               │
│              │  │ ▶ ⏭ ⏮ Speed    │  │  │  Bottom Panel   │  │               │
│              │  └─────────────────┘  │  └─────────────────┘  │               │
└─────────────────────────────────────────────────────────────────┘
│                           Status Bar (32px)                       │
└───────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Inventory

For EVERY UI element on screen, specify:

```yaml
component: "AlgorithmSelector"
  type: combobox
  position: sidebar, section 1
  width: 100% of sidebar content area (260px - 2*12px padding = 236px)
  height: 36px
  padding: 8px 12px
  font: Geist Sans, 13px, weight 400
  color:
    text: var(--foreground)
    placeholder: var(--foreground-muted)
    background: var(--elevated)
    border: var(--border)
    hover-bg: var(--accent)
    focus-ring: var(--primary), 2px, offset 2px
  border-radius: 8px
  icon: ChevronDown (right side, 16px, var(--foreground-muted))
  states:
    default: border 1px solid var(--border)
    hover: bg var(--accent), border var(--border-hover)
    focus: ring 2px var(--primary)
    open: dropdown appears below, max-height 300px, overflow-y auto
  dropdown:
    max-height: 300px
    item-height: 36px
    item-padding: 8px 12px
    item-hover: bg var(--accent)
    item-selected: bg var(--primary/10), text var(--primary)
    group-header: 11px uppercase, tracking-wider, var(--foreground-muted), padding 8px 12px
    separator: 1px solid var(--border), margin 4px 0
  keyboard:
    up/down: navigate items
    enter: select item
    escape: close dropdown
    type: filter items (search)
  animation:
    open: height 0→auto, 200ms, ease-out
    close: height auto→0, 150ms, ease-in
```

Repeat this for EVERY element:
- Every button (with all states)
- Every input field
- Every dropdown/selector
- Every panel header
- Every data display widget
- Every icon button
- Every toggle/switch
- Every slider
- Every badge/chip/tag

### 3.3 Spacing Rules

```
Panel padding: 12px horizontal, 8px vertical between sections
Section gap: 16px between sections
Item gap: 4px between items in a list
Button gap: 8px between adjacent buttons
Label-to-input: 6px
Card padding: 12px
Card gap: 8px between cards
Icon-to-text: 8px
Badge padding: 2px 6px
```

### 3.4 Interaction States Table

```
| Element        | Default     | Hover          | Active         | Focus          | Disabled    |
|----------------|-------------|----------------|----------------|----------------|-------------|
| Primary Button | bg-primary  | bg-primary/90  | bg-primary/80  | ring-2 primary | opacity-50  |
| Ghost Button   | bg-transparent | bg-accent   | bg-accent/80   | ring-2 primary | opacity-50  |
| Input          | border      | border-hover   | border-primary | ring-2 primary | opacity-50  |
| Card           | bg-elevated | bg-elevated/80 | scale-[0.98]   | ring-2 primary | opacity-50  |
| Tab            | text-muted  | text-foreground| bg-accent      | ring-2 primary | opacity-50  |
```

### 3.5 Animation Timing Table

```
| Animation          | Duration | Easing              | Delay | Motion Config                    |
|--------------------|----------|---------------------|-------|----------------------------------|
| Panel slide in     | 200ms    | ease-out            | 0     | transform: translateX(-100%→0)   |
| Item highlight     | 150ms    | ease-in-out         | 0     | background-color transition      |
| Button press       | 100ms    | ease-in             | 0     | scale: 1→0.97→1                  |
| Dropdown open      | 200ms    | spring(300, 25)     | 0     | opacity 0→1, y: -8→0            |
| Toast appear       | 300ms    | spring(400, 30)     | 0     | y: 20→0, opacity 0→1            |
| Algorithm step     | varies   | spring(200, 20)     | 0     | per-algorithm choreography       |
| Sort complete      | 500ms    | ease-out            | 0     | rainbow sweep + scale pulse      |
```

---

## PHASE 4: RESPONSIVE BREAKPOINTS

```
Desktop (≥1280px): Full layout — sidebar + canvas + properties
Laptop (1024-1279px): Sidebar narrower (220px), properties collapsible
Tablet (768-1023px): Sidebar as overlay, properties hidden (toggle)
Mobile (< 768px): Bottom tabs instead of sidebar, canvas full-width
```

For each breakpoint, specify what changes:
- Which panels are visible vs hidden
- Which elements reflow
- Touch target minimum (44px)
- Gesture support (swipe to switch panels)

---

## PHASE 5: DARK/LIGHT MODE

For every color used, provide both values:

```
| Token              | Dark Mode          | Light Mode         |
|--------------------|--------------------|--------------------|
| --background       | hsl(240 10% 4%)    | hsl(0 0% 100%)     |
| --surface          | hsl(240 10% 8%)    | hsl(240 5% 96%)    |
| --elevated         | hsl(240 10% 12%)   | hsl(0 0% 100%)     |
| --border           | hsl(240 6% 18%)    | hsl(240 6% 90%)    |
| --foreground       | hsl(0 0% 95%)      | hsl(240 10% 4%)    |
| --foreground-muted | hsl(240 5% 60%)    | hsl(240 5% 45%)    |
| --primary          | hsl(271 81% 56%)   | hsl(271 81% 46%)   |
```

---

## PHASE 6: GENERATE IMPLEMENTATION CHECKLIST

For each component specified, generate:

```
□ [Component Name]
  File: src/components/modules/{{MODULE_SLUG}}/[ComponentName].tsx
  Props: { ... }
  States: default, hover, active, focus, disabled
  Animation: [specific motion config]
  A11y: aria-label, role, keyboard handling
  Test: what to verify visually
```

---

## OUTPUT FORMAT

Write the complete specification as a markdown document saved to:
`docs/design/{{MODULE_SLUG}}-ui-spec.md`

This document should be SO detailed that a developer can implement the ENTIRE UI
without asking a single design question.
