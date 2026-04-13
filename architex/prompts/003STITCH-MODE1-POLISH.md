# STITCH MODE 1: POLISH — Make Our UI World-Class

> Read our ACTUAL code. Understand EXACTLY what exists. Then generate Stitch prompts
> that produce the SAME app but looking like Apple's best designer spent a month on it.
>
> POLISH means:
> - Same layout structure (sidebar left, canvas center, properties right)
> - Better everything (spacing, colors, typography, animations, depth)
> - ADD what's obviously missing (empty states, loading skeletons, hover effects, tooltips)
> - ADD micro-interactions (button feedback, panel transitions, state animations)
> - FIX what looks wrong (inconsistent spacing, harsh colors, cramped text)
> - DON'T change the information architecture or invent new features
>
> Replace {{MODULE_NAME}} and {{MODULE_SLUG}}

---

## PHASE 1: READ EVERY LINE OF CURRENT CODE

Read ALL these files completely. Don't skim. You need to know EVERY element.

```
src/components/modules/{{MODULE_SLUG}}/          — ALL component files
src/components/modules/wrappers/                 — wrapper
src/app/page.tsx                                 — app shell (sidebar, canvas, properties, bottom)
src/components/shared/activity-bar.tsx           — left icon bar
src/components/workspace/                        — layout system
src/app/globals.css                              — CSS variables & theme tokens
```

---

## PHASE 2: DOCUMENT CURRENT STATE EXACTLY

For each panel/section, write down EXACTLY what's there:

### 2.1 Activity Bar (leftmost)
```
Width: [from code]
Icons: [list every icon top to bottom, with labels]
Active indicator: [how does the selected module look?]
Bottom section: [notifications, settings, auth]
```

### 2.2 Sidebar
```
Width: [from code]
Header: [title, any subtitle]
Section 1: "[exact section name]"
  - [exact element]: [type: dropdown/button/input/list] → [exact options/labels from code]
  - [exact element]: [type] → [content]
Section 2: "[exact section name]"
  - ...
Controls area: [play/pause/step buttons — exact labels and icons]
Footer: [anything at bottom]
```

### 2.3 Canvas (main area)
```
Background: [color/gradient from code]
Default content: [what renders — bars? nodes? graph? empty state?]
Overlay elements: [toolbars, floating buttons, legends]
Zoom/pan: [controls visible?]
```

### 2.4 Properties Panel (right)
```
Width: [from code]
Header: [title]
Section 1: [name] — [content: text, badges, tables, widgets]
Section 2: [name] — [content]
...
```

### 2.5 Bottom Panel
```
Height: [collapsed/expanded]
Tabs: [list every tab name]
Default tab: [which one shows]
Content per tab: [what's in each]
```

### 2.6 Status Bar
```
Left: [content]
Center: [content]
Right: [content]
```

---

## PHASE 3: IDENTIFY WHAT'S MISSING OR BROKEN

Now that you know exactly what exists, list what's obviously wrong or missing:

```
MISSING:
  □ No empty state when nothing is selected — just blank space
  □ No loading skeleton when switching algorithms
  □ No hover effect on sidebar items
  □ No tooltip on icon-only buttons
  □ No transition animation when panels open/close
  □ [... find more from reading the code]

BROKEN/UGLY:
  □ Sidebar section headers are plain text, no visual hierarchy
  □ Dropdown uses native browser select, not styled
  □ Spacing inconsistent — 8px here, 12px there, 16px elsewhere
  □ Colors too harsh — pure blue on dark background is jarring
  □ [... find more]

SHOULD ADD:
  □ Subtle glass effect on panels (glassmorphism)
  □ Active item left accent bar (3px colored strip)
  □ Radial gradient spotlight on canvas following active element
  □ Skeleton loading states for all async content
  □ Micro-bounce on button press
  □ [... based on what other premium apps do]
```

---

## PHASE 4: GENERATE STITCH PROMPTS

For each view, generate a prompt using this exact structure:

```
Design a polished dark-mode UI for "Architex — {{MODULE_NAME}}".
This is a premium redesign of an existing educational platform.
Keep the EXACT same layout — improve the visual quality to Apple/Linear level.

== LAYOUT (keep exactly as-is) ==

[Paste the EXACT layout from Phase 2 with real content from code]

== CURRENT ISSUES TO FIX ==

[Paste from Phase 3 — what's missing/broken]

== POLISH THESE ELEMENTS ==

1. Sidebar:
   CURRENT: [exact description from code]
   MAKE IT: [specific improvement — e.g., "add 1px bottom border on section headers, 
   uppercase 10px tracking-wider text, 4px left accent on active item"]

2. Buttons:
   CURRENT: [from code]
   MAKE IT: [improvement]

3. Canvas background:
   CURRENT: [from code]
   MAKE IT: [improvement]

4. [Continue for EVERY element...]

== ADD THESE MISSING ELEMENTS ==

1. Empty state: When no [item] is selected, show [description of what to show]
2. Loading skeleton: When switching [items], show [shimmer/skeleton description]
3. Hover states: Every interactive element should [description]
4. Tooltips: Every icon button needs [description]
5. [More from Phase 3 missing list]

== STYLE ==

Background: #0a0b14 (deep navy, NOT pure black)
Surfaces: #0f1019 with 1px border rgba(255,255,255,0.06)
Elevated cards: #141520 with subtle box-shadow 0 2px 8px rgba(0,0,0,0.3)
Primary accent: #6E56CF (purple) with soft glow on active states
Text primary: #f0f0f5 (not pure white — slightly warm)
Text muted: #8b8b9e
Text subtle: #5a5a6e
Success: #22c55e
Warning: #f59e0b
Error: #ef4444
Info: #3b82f6

Font: Inter or SF Pro, weights 400/500/600
Code font: JetBrains Mono or Fira Code
Size scale: 10px captions, 11px labels, 12px small, 13px body, 14px emphasis, 18px headings
Line height: 1.4 for body, 1.2 for headings

Spacing: 8px grid — all spacing multiples of 4px (4, 8, 12, 16, 20, 24, 32)
Borders: 1px solid rgba(255,255,255,0.06) — barely visible, adds depth
Radius: 6px small, 8px medium, 12px large
Shadows: 0 1px 3px rgba(0,0,0,0.2) for cards, 0 4px 16px rgba(0,0,0,0.3) for dropdowns

== EXACT CONTENT (use these, not placeholders) ==

[Paste REAL data from the code — actual names, actual values, actual labels]

== MOOD ==

"The same app you know, but every pixel now feels intentional. 
Like upgrading from a Honda to a Tesla — same drive, completely different experience."

== REFERENCES ==

- Panel quality: Linear (linear.app) dark mode
- Sidebar polish: Raycast
- Canvas feel: Figma
- Information density: GitHub Copilot Chat
- Button/control quality: Vercel Dashboard
- Animation smoothness: Stripe Dashboard

== DO NOT ==

- Do NOT change sidebar/canvas/properties layout positions
- Do NOT remove any existing functionality
- Do NOT use lorem ipsum — use the exact content provided
- Do NOT make it "minimal" to the point of losing information
- Do NOT add features that don't exist in the spec
```

---

## PHASE 5: GENERATE THESE SPECIFIC PROMPTS

### Prompt 1: Full Default View
Everything visible, default state, no operation running.

### Prompt 2: Active/Running State
An operation in progress with highlighted elements and live data.

### Prompt 3: Mobile (375px width)
Same app on mobile with adapted layout.

### Prompt 4: Sidebar Close-up (2x detail)
Just the sidebar zoomed in showing every control.

### Prompt 5: Canvas Close-up (2x detail)
Just the visualization area zoomed in.

### Prompt 6: Properties Close-up (2x detail)
Just the properties panel zoomed in.

---

## OUTPUT

Save to: `docs/design/{{MODULE_SLUG}}-stitch-polish.md`

Each prompt copy-pasteable into Google Stitch.
