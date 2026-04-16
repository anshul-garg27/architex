I now have a comprehensive understanding of the Architex codebase, its architecture, existing navigation, layout system, module structure, and the product vision. Here is the complete information architecture specification.

---

## VERDICT

Architex has a powerful VS Code-inspired shell -- vertical activity bar, resizable panels, status bar -- built for a single paradigm: module switching. But the 7 modes you describe (Learn, Simulate, Practice, Quiz, Assessment, Review, AI) have no home in the current architecture. The `ui-store` tracks which MODULE is active, not which MODE. The `WorkspaceLayout` knows about sidebar/canvas/properties/bottom panels but nothing about mode-driven layout variants. The LLD module has its own `SidebarMode`, the Interview module has its own `InterviewMode`, and the Database module has its own `DatabaseMode` -- all independently reinvented, none standardized, none discoverable. The result: modes are invisible to users and inconsistent across modules.

The existing architecture is a strong foundation. The panel system, keyboard shortcuts, command palette, and cross-module bridge system are well-built. The problem is not the shell -- it is the absence of a standardized mode layer between "which module am I in" and "what am I doing."

What follows is a complete information architecture that adds the mode dimension without destroying what works.

---

## 1. NAVIGATION ARCHITECTURE

### The Core Insight: Module x Mode Matrix

Architex has two orthogonal navigation axes. Every screen in the product can be identified by a (module, mode) pair.

```
              MODULES (what you're studying)
              ┌──────────────────────────────────────────┐
              │ SysDesign │ Algo │ DS │ LLD │ DB │ ... │
         ┌────┼───────────┼──────┼────┼─────┼────┼─────┤
 MODES   │Learn│ guided    │visual│walk│B+E  │    │     │
 (what   │Sim  │ canvas    │race  │    │anim │MVCC│     │
 you're  │Prac │ build     │solve │code│prob │qry │     │
 doing)  │Quiz │ MCQ       │pred  │    │quiz │quiz│     │
         │Asmt │ scored    │timed │    │rub  │    │     │
         │Rev  │ SRS       │SRS   │    │SRS  │SRS │     │
         │AI   │ tutor     │hint  │    │revw │    │     │
         └────┴───────────┴──────┴────┴─────┴────┴─────┘
```

Not every cell is populated. Some modules have only 3 modes. Some modes are lightweight (Quiz is a focused card, not a layout change). The architecture must handle this sparsity gracefully.

### Reference Platform Analysis

**Figma (Design / Prototype / Inspect / Dev Mode)**
- Mode tabs sit in the top-right corner of the toolbar. Always visible, always 4 options.
- Switching modes changes the right panel contents and toolbar actions. The canvas stays visible.
- Context is 100% preserved -- switching from Design to Prototype shows the same frame, same selection.
- URL changes: adds `?node-id=...&mode=dev` to the query string.
- Key insight: modes are VIEWS of the same data, not separate workflows.
- Weakness: Only works because Figma has one "canvas" concept. Architex has 13 different canvas types.

**VS Code (Editor / Terminal / Debug / Source Control)**
- The activity bar on the left switches which sidebar panel is visible. The editor area stays constant.
- Debug mode is the closest to a "mode switch" -- it changes the sidebar, adds a debug toolbar at the top, and shows variables/call stack. But the editor area still shows the same file.
- Context is fully preserved -- the file you had open before debugging stays open.
- Key insight: The activity bar does not switch the ENTIRE layout. It swaps a PANEL.
- Relevant to Architex: The existing activity bar already works this way for modules. Modes should work like VS Code's Debug mode -- an overlay on the existing layout.

**Notion (Page / Database / Timeline / Board / Calendar)**
- These are "views" of the same underlying database. A toggle appears at the top of the content area.
- Switching views completely changes the rendering but the data is identical.
- Key insight: Views are FACETS of the same data, not workflow states.
- Relevant to Architex: Learn / Build / Quiz on a pattern ARE facets of the same underlying content (Observer pattern data). This metaphor applies directly.

**Linear (Backlog / Active / Done / Triage)**
- Tab bar across the top of the content area. Simple filter on the same dataset.
- No layout change, just a filter change.
- Key insight: Least relevant to Architex because Linear's "modes" are really just filters.

**Brilliant.org (Lesson / Practice / Review)**
- Modes are sequential, not freely switchable. You complete a lesson, THEN unlock practice, THEN review appears in the daily queue.
- The layout changes dramatically: lessons are scrollable card stacks, practice is focused single-question, review is rapid-fire flashcards.
- Key insight: Modes are stages in a learning progression, not arbitrary access points.
- Relevant to Architex: The "smart default" routing should follow this pattern -- first visit = Learn, returnee = Practice or Review.

**Duolingo (Learn / Practice / Stories)**
- Bottom navigation bar on mobile. Learn is the default tab.
- Stories/Practice are separate top-level destinations, not modes within a lesson.
- Key insight: Modes are top-level destinations for mobile, not sub-states.
- Relevant to Architex: On mobile, the bottom nav should surface modes, not just modules.

### The Architex Solution: Contextual Mode Bar

**Neither a global mode switcher NOR modes buried within each module. A contextual mode bar that appears within the content area of each module, showing ONLY the modes available for the current topic.**

Why this is the right answer:

1. **A global mode switcher (Figma-style tabs in the toolbar) fails** because not all modules support all 7 modes. A global bar with 7 tabs where 3 are grayed out teaches users to ignore the bar (NN Group: "Disabled controls are almost always misunderstood" -- Jensen, 2021).

2. **Modes buried inside each module (current state) fails** because users never discover that Practice or Review exist. They find Learn and stay there. Eye-tracking research shows users spend 80% of their attention on what is immediately visible in the current view (NN Group F-pattern studies, 2006-2024).

3. **A contextual mode bar within the content area** gives each module control over which modes to surface, in what order, while maintaining a consistent interaction pattern across all modules.

### URL Structure

```
/{module}/{topic}?mode={mode}

Examples:
/lld/observer?mode=learn      -- Learn Observer pattern
/lld/observer?mode=practice   -- Practice Observer challenges
/lld/observer?mode=quiz       -- Quiz on Observer
/lld/observer?mode=review     -- SRS review for Observer

/system-design/url-shortener?mode=learn
/system-design/url-shortener?mode=simulate
/system-design/url-shortener?mode=build

/algorithms/merge-sort?mode=learn
/algorithms/merge-sort?mode=practice
/algorithms/merge-sort?mode=race    -- (module-specific sub-mode)

/dashboard                      -- Home dashboard
/review                         -- Global SRS review (cross-module)
```

Rationale for query parameter over path segment:
- The mode is a VIEW of the same topic, not a separate resource. Notion uses the same approach for database views.
- Path segments (`/lld/observer/learn`) imply separate pages with separate layouts. Query parameters (`?mode=learn`) signal "same page, different rendering." This matches reality -- Learn and Quiz for Observer share the same underlying data, canvas, and state.
- When mode is omitted, smart routing applies (see section 5).

### Navigation Tree (Sitemap)

```
/
├── /dashboard                    -- Home (progress, streak, quick actions)
├── /modules                      -- Module selection grid
├── /review                       -- Global daily review (cross-module SRS)
├── /gallery                      -- Community template gallery
├── /pricing                      -- Pricing page
├── /settings                     -- User preferences
│
├── /system-design
│   └── /system-design/{template}?mode=learn|simulate|build|quiz|ai
│
├── /algorithms
│   └── /algorithms/{category}/{slug}?mode=learn|practice|race|quiz|review
│
├── /data-structures
│   └── /ds/{slug}?mode=learn|practice|predict|quiz|review
│
├── /lld
│   └── /lld/patterns/{slug}?mode=learn|build|quiz|review|ai
│   └── /lld/problems/{slug}?mode=practice
│   └── /lld/solid/{slug}?mode=learn|quiz
│
├── /database
│   └── /database/{mode}?mode=learn|simulate|quiz|review
│
├── /distributed
│   └── /distributed/{slug}?mode=learn|simulate|quiz|review
│
├── /networking
│   └── /networking/{protocol}?mode=learn|simulate|quiz
│
├── /os
│   └── /os/{concept}?mode=learn|simulate|quiz|review
│
├── /concurrency
│   └── /concurrency/{slug}?mode=learn|simulate|quiz
│
├── /security
│   └── /security/{topic}?mode=learn|simulate|quiz|ai
│
├── /ml-design
│   └── /ml-design/{topic}?mode=learn|build|simulate
│
├── /interview
│   └── /interview/{challenge}?mode=practice|timed|review|mock
│
└── /concepts/{slug}             -- Cross-module concept page
```

### Mode Discovery

Users discover modes through three mechanisms:

**1. The Mode Bar (always visible within the content area when a topic is selected)**

Positioned directly below the breadcrumb, above the canvas. This follows the F-pattern -- the mode bar sits in the second horizontal scan line, where NN Group's eye-tracking shows the second-highest attention.

**2. The Command Palette (Cmd+K)**

Register all mode transitions as commands:
- "Switch to Learn mode"
- "Switch to Quiz mode"
- "Start Simulation"
- "Open AI Tutor"
- "Review this topic"

Power users find modes through the command palette first. The command palette is already implemented and extensible.

**3. Smart Nudges (contextual)**

After completing a Learn walkthrough: "Ready to test yourself? Switch to Quiz" (button inline).
After failing a quiz question: "Need a refresher? Switch to Learn" (toast with action).
After not reviewing for 7 days: "3 topics due for review" (dashboard card + notification dot on Review mode).

---

## 2. LAYOUT SYSTEM

### The Layout Blueprint

The key insight from analyzing Figma and VS Code: **modes should change what is IN the panels, not which panels are visible.** The shell (activity bar + sidebar + canvas + properties + bottom panel + status bar) stays constant. The contents of each panel change based on the active mode.

However, there are exceptions. Learn mode benefits from a dedicated lesson column. Simulate mode benefits from a larger bottom panel. Quiz mode benefits from a focused, distraction-free view. These are handled as layout PRESETS applied by the mode, not layout REBUILDS.

### Layout Presets (6 variants)

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESET: DEFAULT (Build/Practice)          │
├────┬──────────┬──────────────────────────────┬──────────────┤
│    │          │                              │              │
│ AB │ Sidebar  │         Canvas               │  Properties  │
│    │ (240px)  │         (flex)               │  (280px)     │
│    │          │                              │              │
│    │          ├──────────────────────────────┤              │
│    │          │       Bottom Panel (30%)     │              │
├────┴──────────┴──────────────────────────────┴──────────────┤
│                       Status Bar                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESET: LEARN                             │
│ [Mode Bar: Learn* | Build | Quiz | Review]                  │
├────┬──────────┬──────────────────────┬─────────────────────┤
│    │          │                      │                     │
│ AB │ Sidebar  │      Canvas          │  Lesson Column      │
│    │ (200px)  │      (flex)          │  (420px, scrollable)│
│    │ (opt.)   │                      │  B+E fused content  │
│    │          │                      │                     │
│    │          │                      │                     │
├────┴──────────┴──────────────────────┴─────────────────────┤
│                       Status Bar                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESET: SIMULATE                          │
│ [Mode Bar: Learn | Simulate* | Build | AI]                  │
├────┬──────────┬──────────────────────────────┬──────────────┤
│    │          │                              │ Live Metrics │
│ AB │ Chaos    │      Canvas (simulation)     │ (280px)      │
│    │ Controls │      with traffic particles  │ Gauges       │
│    │ (240px)  │                              │ Sparklines   │
│    │          ├──────────────────────────────┤              │
│    │          │   Timeline + Metrics (40%)   │              │
├────┴──────────┴──────────────────────────────┴──────────────┤
│ [Play] [Pause] [Speed: 2x] [Chaos: DB Down] │ Tick: 1234  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESET: QUIZ / ASSESSMENT                 │
│ [Mode Bar: Learn | Quiz* | Review]                          │
├────┬────────────────────────────────────────────────────────┤
│    │                                                        │
│ AB │     Focused Quiz Card (centered, max-w-2xl)           │
│    │     ┌─────────────────────────────────┐                │
│    │     │  Q: What pattern is this?       │                │
│    │     │                                 │                │
│    │     │  [A] Observer                   │                │
│    │     │  [B] Strategy  [selected]       │                │
│    │     │  [C] Command                    │                │
│    │     │  [D] Mediator                   │                │
│    │     │                                 │                │
│    │     │  Progress: 3/10  [Next ->]      │                │
│    │     └─────────────────────────────────┘                │
│    │                                                        │
├────┴────────────────────────────────────────────────────────┤
│ Quiz: Observer Pattern │ 3/10 │ Score: 80%                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESET: REVIEW (SRS)                      │
│ [Mode Bar: Learn | Review*]                                 │
├────┬────────────────────────────────────────────────────────┤
│    │                                                        │
│ AB │     Flashcard (centered, max-w-xl)                    │
│    │     ┌─────────────────────────────────┐                │
│    │     │                                 │                │
│    │     │   [Click to reveal]             │                │
│    │     │                                 │                │
│    │     │   "What data structure gives    │                │
│    │     │    O(1) amortized insert and    │                │
│    │     │    O(log n) extract-min?"       │                │
│    │     │                                 │                │
│    │     └─────────────────────────────────┘                │
│    │                                                        │
│    │  [Again] [Hard] [Good] [Easy]   Due today: 12         │
│    │                                                        │
├────┴────────────────────────────────────────────────────────┤
│ Review │ 5 done │ 12 remaining │ Streak: 7 days            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    PRESET: AI (Tutor / Review)               │
│ [Mode Bar: Learn | Build | AI*]                             │
├────┬──────────┬──────────────────────┬─────────────────────┤
│    │          │                      │                     │
│ AB │ Sidebar  │      Canvas          │  AI Chat Column     │
│    │ (200px)  │      (flex)          │  (400px)            │
│    │          │                      │  Socratic tutor     │
│    │          │                      │  Design review      │
│    │          │                      │  Suggestion chips   │
│    │          │                      │                     │
├────┴──────────┴──────────────────────┴─────────────────────┤
│                       Status Bar                            │
└─────────────────────────────────────────────────────────────┘
```

### Panel Visibility Per Mode

| Mode      | Activity Bar | Sidebar       | Canvas          | Properties     | Bottom Panel     | Right Column   |
|-----------|-------------|---------------|-----------------|----------------|------------------|----------------|
| Learn     | visible     | collapsed/opt | canvas + build  | hidden         | hidden           | Lesson (420px) |
| Simulate  | visible     | chaos ctrl    | sim canvas      | live metrics   | timeline (40%)   | --             |
| Build     | visible     | palette       | editable canvas | node props     | metrics (30%)    | --             |
| Practice  | visible     | problem list  | challenge canvas| hints          | test cases       | --             |
| Quiz      | visible     | hidden        | centered card   | hidden         | hidden           | --             |
| Assessment| visible     | rubric        | submission view | scores         | feedback         | --             |
| Review    | visible     | queue stats   | centered card   | hidden         | hidden           | --             |
| AI        | visible     | collapsed/opt | canvas          | hidden         | hidden           | AI chat (400px)|

### Implementation: Mode-Aware Layout in WorkspaceLayout

The existing `WorkspaceLayout` component already accepts `sidebar`, `canvas`, `properties`, and `bottomPanel` as ReactNode props. The mode system should work BY CHANGING WHAT THOSE PROPS CONTAIN, not by replacing the layout.

For the two modes that need a right column (Learn and AI), add an optional `rightColumn` prop:

```typescript
interface WorkspaceLayoutProps {
  sidebar: ReactNode;
  canvas: ReactNode;
  properties: ReactNode;
  bottomPanel: ReactNode;
  rightColumn?: ReactNode;           // NEW: Learn lesson or AI chat
  rightColumnWidth?: string;         // NEW: "420px" or "400px"
  layoutPreset?: LayoutPreset;       // NEW: hint for panel defaults
  breadcrumb?: { section?: string; topic?: string };
}

type LayoutPreset =
  | "default"      // Build mode: sidebar + canvas + properties + bottom
  | "learn"        // Sidebar collapsed, right column visible
  | "simulate"     // Bottom panel 40%, sidebar = chaos controls
  | "focused"      // Quiz/Review: centered content, no panels
  | "ai"           // Right column = AI chat
  ;
```

Each module's wrapper component reads the current mode from the URL query parameter and passes the appropriate content to `WorkspaceLayout`. The mode determines which sub-components render into each slot.

---

## 3. MODE TRANSITIONS

### Context Preservation

This is the critical user experience question. The answer: **YES, context is always preserved. Switching modes on the same topic keeps you on the same topic.**

Implementation: The URL encodes both topic and mode. When you switch from `/lld/observer?mode=learn` to `/lld/observer?mode=quiz`, the topic (Observer) stays in the URL. The module reads the topic from the path, the mode from the query parameter. Each mode's component receives the same topic data.

State that persists across mode switches within a topic:
- Canvas state (node positions, edges, selections) -- already in `canvas-store`
- Scroll position within lesson content -- stored in a ref per topic
- Quiz progress (which question you are on) -- stored in component state, preserved if component stays mounted
- Simulation state (paused at tick N) -- stays in `simulation-store`
- Timer state (Interview mode) -- stays in `interview-store`

State that resets on mode switch:
- Nothing. Mode switches are non-destructive.

### Transition Animations

Mode transitions should feel like facet switches (Notion view toggle), not page navigations.

```typescript
// Mode transition animation constants (add to src/lib/constants/motion.ts)
export const modeTransition = {
  // Panel content crossfade
  content: {
    exit: { opacity: 0, y: -8 },
    enter: { opacity: 1, y: 0 },
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] }, // ease-out
  },
  // Right column slide
  column: {
    enter: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  // Layout resize (panel widths changing)
  layout: {
    transition: { duration: 0.25, ease: [0.65, 0, 0.35, 1] }, // ease-in-out
  },
  // Focused mode (Quiz/Review) -- canvas fades to centered card
  focus: {
    canvas: { opacity: 0, scale: 0.98 },
    card: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
} as const;
```

Specific transitions:

- **Build to Learn**: Sidebar collapses (200ms ease-in-out). Right column slides in from right (200ms ease-out). Canvas width adjusts via `react-resizable-panels` spring animation.
- **Learn to Quiz**: Right column slides out. Canvas crossfades to centered quiz card (150ms). Sidebar hides. Clean, fast.
- **Build to Simulate**: Bottom panel expands from 30% to 40% (250ms). Sidebar content crossfades from palette to chaos controls (150ms). Properties panel content crossfades to live metrics.
- **Any to Review**: All panels collapse. Centered flashcard fades in (200ms). Minimal, focused.

All transitions respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Nested Modes

Some modes can be activated WITHIN other modes without a full mode switch:

- **Quiz inside Learn**: A walkthrough step contains an inline MCQ checkpoint. This is not a mode switch -- it is content within the Learn lesson column. The URL stays `?mode=learn`.
- **AI inside Build**: The AI tutor can be summoned as a slide-out drawer (Cmd+I) without switching to full AI mode. This is a panel overlay, not a mode.
- **Review prompt after Quiz**: After completing a quiz, a "Schedule for review?" prompt appears inline. Clicking it adds the topic to the SRS queue but does not switch to Review mode.

These nested interactions are handled by the component layer, not the mode routing layer. The mode bar and URL only track the PRIMARY mode.

### Can You Switch Modes Mid-Flow?

Yes. But with guardrails:

- **Safe switches** (no confirmation): Learn to Quiz, Learn to Build, Build to Simulate, any to Review, any to AI.
- **Switches with state** (soft warning): Leaving a timed Practice challenge. Leaving an unsaved Assessment. Toast: "Timer paused. Your progress is saved."
- **Never destructive**: No mode switch ever loses user work. Canvas state persists in Zustand stores. Quiz progress persists in component state (mounted components are kept alive via the existing `recentModules` pattern in `page.tsx`).

---

## 4. VISUAL INDICATORS

### Mode Color System

Each mode gets a subtle color accent. Not overwhelming -- just enough to provide ambient awareness. These are NOT full theme changes. They tint the mode bar active state and the status bar mode indicator.

```css
:root {
  /* Mode accent colors -- subtle, used sparingly */
  --mode-learn:     hsl(217 91% 60%);    /* Blue -- knowledge, trust */
  --mode-simulate:  hsl(142 71% 45%);    /* Green -- go, live, active */
  --mode-build:     hsl(258 78% 64%);    /* Violet -- primary, creative */
  --mode-practice:  hsl(35 90% 55%);     /* Amber -- challenge, energy */
  --mode-quiz:      hsl(38 92% 50%);     /* Gold -- assessment, reward */
  --mode-review:    hsl(172 80% 38%);    /* Teal -- reflection, calm */
  --mode-ai:        hsl(271 81% 56%);    /* Purple -- intelligence */
}
```

Rationale for these specific colors:
- Blue for Learn aligns with educational trust signals (Brilliant uses blue extensively in lesson UI).
- Green for Simulate is the universal "live/running" indicator (VS Code debug bar is orange; green is better because simulation is observational, not error-state).
- Violet for Build matches the primary brand accent (already `--primary: hsl(258 78% 64%)`).
- Amber for Practice signals challenge and engagement (Duolingo uses amber for streak/challenge).
- Gold for Quiz signals "graded activity" (academic gold standard metaphor).
- Teal for Review matches the existing `--difficulty-easy` token, signaling low-pressure activity.
- Purple for AI matches the existing `--state-processing` token, signaling active computation.

### Mode Icon System

```
Learn     = BookOpen          (Lucide)
Simulate  = Activity          (Lucide) -- waveform, not Play
Build     = Hammer            (Lucide) -- action, not PenTool
Practice  = Target            (Lucide) -- focused challenge
Quiz      = HelpCircle        (Lucide) -- question mark
Assessment= ClipboardCheck    (Lucide) -- graded checklist
Review    = RotateCcw         (Lucide) -- spaced repetition cycle
AI        = Sparkles          (Lucide) -- already used for AI in dashboard
```

### The Mode Bar Component

The mode bar sits within the content area, below any breadcrumb, above the canvas. It is NOT in the global header. This follows the Notion pattern where view tabs are part of the content, not the chrome.

```
┌─────────────────────────────────────────────────────┐
│  System Design > Observer Pattern                    │  <- breadcrumb
├─────────────────────────────────────────────────────┤
│  [BookOpen Learn] [Hammer Build] [Activity Sim] ... │  <- mode bar
├─────────────────────────────────────────────────────┤
│                                                     │
│                    Canvas                           │
│                                                     │
```

Active mode indicator: Bottom border (2px) in the mode color + text in mode color + icon filled. Inactive modes: `foreground-muted` text, no border. This follows the tab pattern from Radix Tabs (already in the codebase as `@radix-ui/react-tabs`).

```typescript
// ModeBar component sketch
<Tabs value={currentMode} onValueChange={handleModeSwitch}>
  <TabsList className="h-9 border-b border-border bg-transparent px-4">
    {availableModes.map((mode) => (
      <TabsTrigger
        key={mode.id}
        value={mode.id}
        className={cn(
          "relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium",
          "text-foreground-muted hover:text-foreground",
          "data-[state=active]:text-[var(--mode-color)]",
          "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5",
          "after:bg-transparent data-[state=active]:after:bg-[var(--mode-color)]",
        )}
        style={{ "--mode-color": `var(--mode-${mode.id})` } as React.CSSProperties}
      >
        <mode.icon className="h-3.5 w-3.5" />
        {mode.label}
        {mode.badge && (
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            {mode.badge}
          </span>
        )}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>
```

### Status Bar Mode Indicator

The existing status bar already shows the active module. Add the active mode next to it:

```
[System Design] [Learn mode] │ Nodes: 12 │ Zoom: 100% │ ~$450/mo │ Saved
                ^^^^^^^^^^^^
                NEW: mode indicator with dot in mode color
```

### Toolbar Changes Per Mode

The toolbar (top of canvas area) changes its RIGHT-SIDE actions based on mode:

| Mode     | Left side (constant)        | Right side (mode-specific)                           |
|----------|-----------------------------|------------------------------------------------------|
| Learn    | Breadcrumb > Topic          | Progress (Step 3/8) | Next Step                       |
| Build    | Breadcrumb > Topic          | Undo/Redo | Zoom | Share | Export                      |
| Simulate | Breadcrumb > Topic          | Play/Pause | Speed | Chaos dropdown | Reset          |
| Practice | Breadcrumb > Challenge      | Timer | Hints (3 remaining) | Submit                   |
| Quiz     | Breadcrumb > Quiz           | Progress (3/10) | Score | Skip                         |
| Review   | (none -- minimal chrome)    | Cards remaining: 12 | Streak: 7                       |
| AI       | Breadcrumb > Topic          | AI model selector | Clear chat                        |

---

## 5. THE "HOME" STATE

### What Users See on First Load

**New users**: Route to `/dashboard`. The dashboard shows:
1. Welcome card with "Start Your First Design" CTA (already implemented).
2. 3 recommended modules (already implemented).
3. Quick actions: "Start Learning" (goes to first module's Learn mode), "Try a Challenge" (goes to Interview module), "Explore" (goes to `/modules` grid).

**Returning users**: Route to `/dashboard`. The dashboard shows:
1. "Continue where you left off" card linking to `/{lastModule}/{lastTopic}?mode={lastMode}`.
2. "Due for review: 5 cards" card linking to `/review`.
3. Daily challenge card (already implemented).
4. Module completion grid (already implemented).
5. Skill radar chart (already implemented).

### Module Home State

When a user navigates to a module WITHOUT a topic (e.g., `/lld` or via the activity bar):

1. Show the module's topic selection view (pattern grid for LLD, algorithm categories for Algorithms, etc.).
2. The mode bar is NOT visible yet -- modes are topic-level, not module-level. You pick a topic first, then you are in a mode.
3. Each topic card shows a brief progress indicator: "Learned | Not practiced | 3 quiz questions".
4. The default sort is "recommended" -- topics the user has not started, or topics due for review, bubble up.

### Smart Default Modes (per topic, per user)

When a user navigates to a topic WITHOUT specifying a mode (e.g., `/lld/observer` with no `?mode=`):

```typescript
function getDefaultMode(topic: TopicId, userProgress: TopicProgress): Mode {
  // Never visited: Learn mode
  if (!userProgress.hasStartedLearn) return "learn";

  // Learn completed but never practiced: nudge to Practice
  if (userProgress.learnCompleted && !userProgress.hasPracticed) return "practice";

  // Has SRS cards due: Review mode
  if (userProgress.srsDueCount > 0) return "review";

  // Has completed everything: Build mode (creative sandbox)
  if (userProgress.allModesCompleted) return "build";

  // Default fallback: last mode used for this topic
  return userProgress.lastMode ?? "learn";
}
```

This routing logic follows Brilliant.org's progression model: Learn first, then Practice, then Review. But unlike Brilliant, the user can always override by clicking any mode in the mode bar.

### The Dashboard as "Central Hub"

The `/dashboard` page is the only place where ALL modes are surfaced simultaneously:
- "Continue Learning" quick action (Learn mode).
- "Daily Challenge" card (Practice mode).
- "Due for Review: N cards" card (Review mode).
- "Module Completion" grid (shows per-module, per-mode progress).
- "Skill Radar" chart (aggregates across modes).

This is where mode awareness is built. The dashboard is the map; the modules are the territory.

---

## 6. MODE SWITCHING MECHANISM (TECHNICAL)

### State: Add `activeMode` to UI Store

```typescript
// In ui-store.ts, add:
export type Mode =
  | "learn"
  | "build"
  | "simulate"
  | "practice"
  | "quiz"
  | "assessment"
  | "review"
  | "ai";

interface UIState {
  // ... existing fields ...

  // Mode (NEW)
  activeMode: Mode;
  setActiveMode: (mode: Mode) => void;

  // Mode availability per module (computed, not stored)
  // Each module registers its available modes
}
```

### Per-Module Mode Registration

Each module declares which modes it supports and for which topics:

```typescript
// src/lib/modes/module-modes.ts
export const MODULE_MODES: Record<ModuleType, Mode[]> = {
  "system-design": ["learn", "build", "simulate", "quiz", "ai"],
  "algorithms":    ["learn", "practice", "quiz", "review"],
  "data-structures": ["learn", "practice", "quiz", "review"],
  "lld":           ["learn", "build", "practice", "quiz", "review", "ai"],
  "database":      ["learn", "simulate", "quiz", "review"],
  "distributed":   ["learn", "simulate", "quiz", "review"],
  "networking":    ["learn", "simulate", "quiz"],
  "os":            ["learn", "simulate", "quiz", "review"],
  "concurrency":   ["learn", "simulate", "quiz"],
  "security":      ["learn", "simulate", "quiz", "ai"],
  "ml-design":     ["learn", "build", "simulate"],
  "interview":     ["practice", "quiz", "review", "ai"],
  "knowledge-graph": ["learn"],
};
```

### Command Palette Integration

Register mode-switch commands in the existing command palette:

```typescript
// Add to command-palette commands
const modeCommands: Command[] = MODULE_MODES[activeModule].map((mode) => ({
  id: `mode-${mode}`,
  label: `Switch to ${MODE_LABELS[mode]} mode`,
  icon: MODE_ICONS[mode],
  shortcut: MODE_SHORTCUTS[mode], // e.g., Cmd+Shift+L for Learn
  action: () => setActiveMode(mode),
  section: "Modes",
}));
```

### Keyboard Shortcuts for Mode Switching

```
Cmd+Shift+L  -- Switch to Learn
Cmd+Shift+S  -- Switch to Simulate
Cmd+Shift+B  -- Switch to Build (note: Cmd+B is sidebar toggle)
Cmd+Shift+P  -- Switch to Practice
Cmd+Shift+Q  -- Switch to Quiz
Cmd+Shift+R  -- Switch to Review
Cmd+Shift+A  -- Switch to AI
```

These are registered in the existing `useKeyboardShortcuts` hook.

---

## 7. THE "FLOW" -- COMPLETE USER JOURNEYS

### Journey 1: "I'm new to Observer pattern. Teach me."

```
Step 1: User arrives at /dashboard (first time or returning)
        Dashboard shows "Recommended: Low-Level Design" card.
        User clicks it.

Step 2: /lld
        Module home shows pattern grid. Observer card shows "New".
        User clicks Observer.

Step 3: /lld/observer (no mode specified)
        Smart routing: hasStartedLearn = false -> mode = "learn"
        Redirects to /lld/observer?mode=learn

Step 4: /lld/observer?mode=learn
        Layout: LEARN preset
        - Activity bar: LLD active
        - Sidebar: collapsed (optional expand for pattern list)
        - Canvas: Progressive build -- starts empty, classes appear as lesson progresses
        - Right column: 420px scrollable lesson (B+E fused)
          - Scroll 0-20%: "Imagine you have a spreadsheet app..."
          - MCQ checkpoint inline: "What's the problem with direct coupling?"
          - Scroll 20-70%: Classes appear on canvas one by one with glow
          - Scroll 70-100%: Full diagram visible, code block, key takeaway

Step 5: Lesson complete.
        Inline CTA at bottom of lesson column:
        "Nice work! Ready to test yourself?"
        [Start Quiz] [Try Building It] [Later]

Step 6: User clicks [Start Quiz].
        URL: /lld/observer?mode=quiz
        Transition: Right column slides out (200ms). Canvas crossfades to centered quiz card.
        Layout: QUIZ preset -- focused card, no sidebar, no properties.
        10 questions on Observer pattern. Mix of MCQ, fill-blank, pattern identification.

Step 7: Quiz complete. Score: 7/10.
        Results card shows score + breakdown.
        "Missed questions added to your review queue."
        [Review Now] [Build Observer] [Back to Patterns]

Step 8: User clicks [Build Observer].
        URL: /lld/observer?mode=build
        Transition: Quiz card fades out. Canvas fades in with the Observer UML from the lesson.
        Layout: DEFAULT preset -- full sidebar (palette), canvas, properties panel.
        User can modify the diagram, add classes, experiment freely.

Step 9: (Later that evening, or next day)
        User returns to /dashboard.
        "Due for review: 3 cards (Observer)" card visible.
        User clicks it.

Step 10: /review (or /lld/observer?mode=review)
         Layout: REVIEW preset -- centered flashcard.
         FSRS algorithm presents 3 cards from the Observer quiz misses.
         User rates: Again / Hard / Good / Easy.
         Review complete. "Come back tomorrow for 2 more."
```

### Journey 2: "I have an interview tomorrow. Quick review."

```
Step 1: /dashboard
        User sees: "Day Streak: 7" | "Due for review: 12 cards" | Daily Challenge
        Quick action: "Practice Interview" card.
        But first: review.

Step 2: User clicks "Due for review: 12 cards".
        /review
        Layout: REVIEW preset. Cross-module flashcards.
        Topics: Observer (3), Consistent Hashing (2), TCP Handshake (2), B-Tree (5).
        Rapid-fire: reveal, rate, next. 12 cards in ~4 minutes.

Step 3: Review done. CTA: "Ready for practice? Start a timed challenge."
        User clicks.

Step 4: /interview/url-shortener?mode=practice
        Layout: PRACTICE preset.
        - Timer: 30:00 counting down (top-right).
        - Canvas: Empty system design canvas.
        - Sidebar: Requirements checklist.
        - Bottom panel: Hints (progressive reveal, 3 hints allowed).

Step 5: User builds system. 25 minutes in, feels stuck on database choice.
        Presses Cmd+Shift+A (AI mode shortcut) or clicks AI in mode bar.

Step 6: /interview/url-shortener?mode=ai
        Layout: AI preset.
        - Canvas: User's current design stays visible.
        - Right column: AI chat.
        - AI sees the diagram state, asks: "I see you have a single database. What happens when you get 100M URLs/day? What properties does your database need?"
        - Timer: paused (toast: "Timer paused while using AI").

Step 7: User gets insight, switches back to practice.
        /interview/url-shortener?mode=practice
        Timer resumes. User adds NoSQL + Cache layer.

Step 8: Timer hits 0 or user clicks Submit.
        /interview/url-shortener?mode=assessment
        Layout: ASSESSMENT preset.
        - Left: User's diagram (read-only).
        - Right: AI-generated scorecard (8 dimensions).
        - Score: 72/100. Breakdown: Scalability 8/10, Reliability 6/10, ...
        - Suggested improvements highlighted on diagram.
```

### Journey 3: "I want to build a system and test it."

```
Step 1: /system-design (activity bar click)
        Module home: Template gallery. "Start from scratch" or pick a template.
        User picks "E-Commerce Platform" template.

Step 2: /system-design/e-commerce?mode=build
        Layout: DEFAULT preset.
        Template loads: 15 nodes (API Gateway, Load Balancer, Services, DBs, Cache, Queue).
        User modifies: adds a CDN, changes DB to DynamoDB, adds a search service.

Step 3: User wants to test it. Clicks "Simulate" in mode bar.
        /system-design/e-commerce?mode=simulate
        Transition: Sidebar crossfades from palette to chaos controls. Bottom panel
        expands to 40% with timeline. Properties panel shows live metrics.
        Layout: SIMULATE preset.

Step 4: Clicks Play. Traffic flows through the system as animated particles on edges.
        Metrics update in real-time: QPS, latency percentiles, error rate.
        User watches normal traffic for 30 seconds.

Step 5: Injects chaos: "Database failover" from the sidebar chaos controls.
        DynamoDB node turns red. Error cascades to dependent services.
        Narrative engine: "Primary DB went down at t=45s. Service A retried 3x, then
        circuit breaker opened. Cache served stale data for 12s until failover completed."
        User observes, learns, pauses simulation to inspect metrics at specific tick.

Step 6: User wants AI feedback. Clicks AI in mode bar.
        /system-design/e-commerce?mode=ai
        Right column opens with AI chat. Canvas shows the post-chaos state.
        AI: "Your system handled the DB failover, but I notice your cache TTL is 5 minutes.
        During the 12-second failover, stale data was served. What would happen if the
        failover took 10 minutes instead? How could you reduce the blast radius?"

Step 7: User modifies design based on AI feedback, runs simulation again.
        Iterative loop: Build -> Simulate -> AI -> Build -> Simulate.
```

### Journey 4: "I just want to explore."

```
Step 1: /modules
        Grid of 13 modules. Each card shows:
        - Module name + description
        - Progress bar (0-100%)
        - Difficulty badge
        - "New" badge if unvisited

Step 2: User scrolls, sees "Database" module. Clicks it.
        /database
        Database module home: grid of 17 visualization topics.
        B-Tree Index | LSM-Tree | MVCC | Query Plans | Join Algorithms | ...

Step 3: User clicks "B-Tree Index" out of curiosity.
        /database/btree-index (no mode specified)
        Smart routing: hasStartedLearn = false -> mode = "learn"
        Redirects to /database/btree-index?mode=learn

Step 4: /database/btree-index?mode=learn
        Lesson plays: B-Tree builds visually as user scrolls.
        User can stop at any point -- no commitment required.
        At bottom of lesson: "Want to try inserting keys yourself?"

Step 5: User clicks [Try It].
        /database/btree-index?mode=practice
        Interactive B-Tree: user types a key, tree animates the insertion.
        No timer, no scoring. Pure exploration.

Step 6: User gets curious about LSM-Trees (mentioned in the lesson).
        Clicks cross-module bridge link: "Related: LSM-Tree (how writes differ)"
        /database/lsm-tree?mode=learn
        New topic, same module, Learn mode. Seamless.

Step 7: User has explored 3 topics. Goes back to /dashboard.
        Progress: "Database: 3/17 explored". Module completion grid updated.
        "Recommended: Try the MVCC visualization next" (AI recommendation based on
        what they explored).
```

---

## IMPLEMENTATION PRIORITY

### Critical (Fix First -- defines the product)

1. **Add `activeMode` to `ui-store.ts` + `Mode` type** -- 30 lines. This is the foundation. Every other change depends on it. Effort: Low.

2. **Create `ModeBar` component** -- ~150 lines. Radix Tabs-based, reads available modes from `MODULE_MODES`, renders inline below breadcrumb. Effort: Low.

3. **Add `rightColumn` prop to `WorkspaceLayout`** -- ~60 lines. The Learn and AI layouts need this. Without it, the lesson column has no home. Effort: Low.

4. **Create `MODULE_MODES` registry** -- ~40 lines. Declares which modes each module supports. The mode bar consumes this. Effort: Low.

5. **URL query parameter routing** -- ~80 lines. Read `?mode=` from URL, sync to `ui-store.activeMode`, default via `getDefaultMode()`. Effort: Medium.

### High (Fix Soon -- enables all 7 modes)

6. **Wire Learn mode layout preset** -- The Product Vision already identifies this as priority 1. The lesson column (420px right) + progressive canvas build. ~800 lines as estimated in the vision doc. Effort: Medium.

7. **Wire Quiz/Review focused layout preset** -- Centered card layout with no side panels. Needs the FSRS + flashcard components which partially exist. Effort: Medium.

8. **Mode-aware command palette commands** -- Register mode-switch commands. Already have the palette infrastructure. Effort: Low.

9. **Mode keyboard shortcuts** -- Register Cmd+Shift+{L,S,B,P,Q,R,A} in `useKeyboardShortcuts`. Effort: Low.

10. **Mode color tokens in globals.css** -- 7 CSS variables. Effort: Low.

### Medium (Nice to Have -- polish)

11. **Transition animations between modes** -- Crossfade, slide, panel resize animations using Motion (already installed). Effort: Medium.

12. **Smart default routing logic** -- `getDefaultMode()` function reading from progress store. Effort: Medium.

13. **Status bar mode indicator** -- Add mode label + colored dot next to module name. Effort: Low.

14. **Dashboard "modes overview" cards** -- "Due for review" and "Continue learning" cards already exist. Wire them to mode URLs. Effort: Low.

---

## SOURCES AND REFERENCES

- NN Group: F-Pattern Reading (2006-2024) -- Front-load mode bar in second horizontal scan line. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- NN Group: Left-Side Bias (2024) -- Mode bar left-aligned, not centered. https://www.nngroup.com/articles/horizontal-attention-leans-left/
- NN Group: Disabled Controls (Jensen, 2021) -- Why a global mode bar with grayed-out modes fails. Users ignore disabled controls or misinterpret them.
- Hick's Law -- Each module shows only 3-5 available modes, not all 7. Reduces decision time.
- Fitts's Law -- Mode bar tabs are 44px+ touch targets, closely grouped for fast switching.
- Lindgaard et al. (2006) -- Users form credibility judgments in 50ms. Mode transitions must feel instant (under 200ms for content swap, under 300ms for layout change).
- Brilliant.org progression model -- Learn first, Practice second, Review third. Applied to smart default routing.
- Duolingo retention research (2024) -- Separated streak model, micro-review sessions. Applied to Review mode daily cadence.

---

## THE ONE BIG WIN

If you can only do one thing: **Add the ModeBar component and wire Learn mode for LLD.** The Product Vision already identifies B+E fused Learn as priority 1. The mode bar gives it a home. Without the mode bar, Learn mode is invisible -- buried inside each module's custom UI. With the mode bar, every user who visits `/lld/observer` immediately sees `[Learn] [Build] [Quiz] [Review]` and understands the full depth of the platform. That visibility alone changes Architex from "a diagramming tool" to "a learning platform."

Relevant files for implementation:
- `/Users/anshullkgarg/Desktop/system_design/architex/src/stores/ui-store.ts` -- Add `Mode` type and `activeMode` state
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/workspace-layout.tsx` -- Add `rightColumn` prop and layout presets
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/page.tsx` -- Read `?mode=` query param, pass to module wrappers
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/activity-bar.tsx` -- No changes needed (module nav stays separate from mode nav)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/status-bar.tsx` -- Add mode indicator
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/globals.css` -- Add `--mode-*` color tokens
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/motion.ts` -- Add `modeTransition` constants
- `/Users/anshullkgarg/Desktop/system_design/architex/ARCHITEX_PRODUCT_VISION.md` -- The B+E Learn mode spec lives here (section III)