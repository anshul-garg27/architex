# UI VISION — World-Class Redesign for {{MODULE_NAME}}

> You are THREE people designing the most beautiful, intuitive, and educational
> interface ever built for {{MODULE_NAME}}.
>
> 1. **A senior designer from Apple** — obsessed with clarity, whitespace, motion, and emotional design
> 2. **A creative director from Brilliant.org** — knows how to make complex concepts click through interaction
> 3. **A frontend architect from Vercel** — knows what's technically possible with React, Tailwind, motion, and Canvas
>
> Replace {{MODULE_NAME}} with: Algorithm Visualizer, System Design Simulator, Data Structure Explorer, etc.
> Replace {{MODULE_SLUG}} with: algorithms, system-design, data-structures, etc.

---

## YOUR DELIVERABLE

Produce a **complete UI vision document** for {{MODULE_NAME}} that covers:

1. What's WRONG with the current UI (be brutally honest)
2. The core design philosophy (3-5 principles)
3. Every screen/view/panel reimagined with exact specifications
4. Animation choreography per interaction type
5. Sound design (optional but encouraged)
6. Emotional moments (screenshot-worthy moments)
7. Mobile-specific adaptations
8. Accessibility (screen reader, keyboard, reduced motion)
9. Implementation roadmap (phased)

---

## PHASE 0: STUDY THE CURRENT STATE

Before designing anything, READ these files completely:

```
src/components/modules/{{MODULE_SLUG}}/
src/components/modules/wrappers/{{MODULE_SLUG_PASCAL}}Wrapper.tsx
src/lib/{{MODULE_SLUG}}/
```

Also study the existing `page.tsx` to understand how the module fits into the app shell (sidebar, canvas, properties panel, bottom panel).

Take screenshots (mental or actual) of the current state. Note EVERY UI element: buttons, dropdowns, panels, labels, icons, spacing, colors.

---

## PHASE 1: ROAST THE CURRENT UI

Be BRUTALLY honest. For each screen/panel, answer:

- What does the user see first? Is it the right thing?
- How many clicks to do the most common action?
- What's cluttered? What's wasting space?
- What's confusing for a first-time user?
- What would a Brilliant.org designer say about this?
- What would Dieter Rams say? ("Less, but better")

Format as:
```
CURRENT PROBLEM: [description]
WHY IT'S BAD: [specific reason — not "it looks bad", but "the 12-item dropdown creates decision paralysis"]
EVIDENCE: [file:line or screenshot description]
```

---

## PHASE 2: DEFINE THE DESIGN PHILOSOPHY

Create 5 principles specific to THIS module. Not generic "clean design" — specific to what this module DOES.

Format:
```
PRINCIPLE 1: [Name]
What it means: [1-2 sentences]
How it manifests: [specific example in the UI]
Anti-pattern it prevents: [what NOT to do]
```

Example for Algorithm Visualizer:
```
PRINCIPLE 1: "The Algorithm is the Teacher"
What it means: The visualization should explain the algorithm without any text needed.
How it manifests: Animations choreographed to match algorithm behavior (Bubble Sort = cautious, Quick Sort = decisive).
Anti-pattern: Generic spring animations that feel the same for every algorithm.
```

---

## PHASE 3: REIMAGINE EVERY VIEW

For {{MODULE_NAME}}, specify these standard views:

### 3.1 SIDEBAR (Left Panel)

```
WIDTH: [exact px or responsive]
SECTIONS: [list every section with content]
INTERACTIONS: [hover, click, drag, keyboard]
ANIMATION: [how sections expand/collapse]
EMPTY STATE: [what shows when nothing selected]
```

Include an ASCII wireframe:
```
┌──────────────────────┐
│ ◉ Module Title       │
│                      │
│ ┌──────────────────┐ │
│ │ [Section 1]      │ │
│ │   Item 1         │ │
│ │   Item 2 ●       │ │
│ │   Item 3         │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ [Section 2]      │ │
│ │   ...            │ │
│ └──────────────────┘ │
│                      │
│ ┌──────────────────┐ │
│ │ [Controls]       │ │
│ │ ▶ [Play] ⏭ ⏮    │ │
│ │ Speed: 1x ●────  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### 3.2 CANVAS (Main Area)

```
LAYOUT: [how content is arranged]
BACKGROUND: [color, gradient, pattern]
SPOTLIGHT: [does attention focus follow active element?]
ZOOM/PAN: [how does zooming work?]
EMPTY STATE: [what shows before any content loads]
LOADING STATE: [skeleton, spinner, or progressive?]
```

### 3.3 PROPERTIES PANEL (Right Panel)

```
WIDTH: [exact px]
SECTIONS: [list every info section]
WIDGETS: [what visual widgets replace text?]
LIVE DATA: [what updates in real-time during simulation?]
```

### 3.4 BOTTOM PANEL

```
TABS: [list every tab]
DEFAULT TAB: [which shows first]
HEIGHT: [collapsed vs expanded]
CONTENT PER TAB: [exact content]
```

### 3.5 TOP BAR / TOOLBAR

```
POSITION: [fixed, sticky, hidden?]
ITEMS: [list every button/control left to right]
RESPONSIVE: [what happens on narrow screens?]
```

---

## PHASE 4: ANIMATION CHOREOGRAPHY

For EVERY user action, define the animation:

```
ACTION: [e.g., "User clicks Play"]
TRIGGER: [click, hover, keyboard, auto]
ELEMENTS THAT MOVE: [list]
ANIMATION TYPE: [spring, tween, stagger, physics]
DURATION: [ms]
EASING: [spring params or cubic-bezier]
SOUND: [optional — what sound plays]
FEEL: [1 word — "snappy", "smooth", "dramatic", "subtle"]
```

Group by interaction category:
- **Selection animations** (picking an item, switching tabs)
- **Operation animations** (running an algorithm step, inserting data)
- **Transition animations** (switching views, opening panels)
- **Celebration animations** (completing a task, achieving a milestone)
- **Error animations** (wrong input, failed operation)

---

## PHASE 5: EMOTIONAL MOMENTS

Design 3-5 "screenshot moments" — points where the UI is so beautiful or insightful that the user wants to share it.

```
MOMENT: [name]
TRIGGER: [what causes it]
VISUAL: [exactly what the user sees]
SOUND: [what they hear]
FEELING: [what emotion this creates]
WHY IT'S SHAREABLE: [why someone would screenshot this]
```

---

## PHASE 6: RESPONSIVE & ACCESSIBILITY

### Mobile (< 768px)
- How does each panel adapt?
- What's hidden vs visible?
- Touch targets (minimum 44px)
- Swipe gestures

### Accessibility
- Screen reader announcements for each state change
- Keyboard navigation flow (Tab order)
- Reduced motion alternatives
- Color contrast requirements
- ARIA labels for every interactive element

---

## PHASE 7: COLOR & TYPOGRAPHY SPEC

```
BACKGROUND: var(--background) — what exact value
SURFACE: var(--surface) — for cards/panels
ACCENT: var(--primary) — for active states
TEXT PRIMARY: var(--foreground)
TEXT SECONDARY: var(--foreground-muted)
TEXT SUBTLE: var(--foreground-subtle)

FONT HEADING: Geist Sans, weight 600
FONT BODY: Geist Sans, weight 400
FONT CODE: Geist Mono, weight 400
FONT SIZE SCALE: 10px, 11px, 12px, 13px, 14px, 16px, 18px, 24px

SPACING SCALE: 4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px
BORDER RADIUS: 6px (small), 8px (medium), 12px (large), 16px (xl)
```

---

## PHASE 8: IMPLEMENTATION TASKS

Convert your vision into specific, actionable tasks:

```json
{
  "id": "{{EPIC}}-UI-NNN",
  "title": "...",
  "description": "...",
  "acceptanceCriteria": ["..."],
  "priority": "P1",
  "effort": "M",
  "files": ["..."],
  "tags": ["ui-revamp", "frontend", "animation"]
}
```

Group into phases:
- **Phase A**: Layout & structure changes (2-3 days)
- **Phase B**: Animation & motion (2-3 days)
- **Phase C**: Polish & emotional moments (1-2 days)
- **Phase D**: Responsive & accessibility (1-2 days)

---

## REFERENCE: Our Design System

```
Framework: Tailwind CSS v4 with CSS custom properties
Components: shadcn/ui + Radix primitives
Icons: Lucide React
Animation: motion (Framer Motion successor)
Canvas: @xyflow/react v12 (for node-based views)
Charts: d3 (for data visualizations)
Fonts: Geist Sans + Geist Mono
Theme: Dark-first, light mode supported
```

## REFERENCE: Competitors to Beat

- **Brilliant.org** — Gold standard for interactive learning UI
- **3Blue1Brown / Manim** — Best algorithm explanations ever made
- **Neal.fun** — Minimalist, delightful, no clutter
- **PaperDraw.dev** — System design simulation (see research/paperdraw/)
- **Apple Liquid Glass** — The new standard for UI aesthetics in 2026
- **Linear** — The best SaaS UI for information density without clutter
- **Raycast** — Command-palette-first design, keyboard-optimized
- **Figma** — Canvas-based UI done right

## NOW: Generate the complete vision for {{MODULE_NAME}}.
