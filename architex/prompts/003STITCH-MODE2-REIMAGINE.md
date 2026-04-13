# STITCH MODE 2: REIMAGINE — Dream the Best Possible UI

> Forget what exists. You're designing the BEST POSSIBLE version of {{MODULE_NAME}}
> that could exist in 2026. No constraints from current code. Pure creativity.
>
> REIMAGINE means:
> - New layout if it serves the user better
> - New interaction patterns (gestures, animations, spatial UI)
> - New features and sections that don't exist yet
> - Revolutionary visualization approaches
> - Steal the best ideas from Brilliant.org, 3Blue1Brown, Apple, Neal.fun
> - Ideas that make people say "I've never seen anything like this"
> - If it's better as a fullscreen canvas with no panels — do it
> - If it needs a completely different navigation model — do it
>
> The ONLY constraint: it must be BUILDABLE with React + Tailwind + motion + Canvas/SVG.
>
> Replace {{MODULE_NAME}} and {{MODULE_SLUG}}

---

## PHASE 1: STUDY THE DOMAIN

Before designing, understand what this module IS and WHO uses it.

### 1.1 Read the current code (for context, not for copying)
```
src/components/modules/{{MODULE_SLUG}}/
src/lib/{{MODULE_SLUG}}/
```

### 1.2 Research the competition
Use web search to find the BEST existing tools for this domain:
- What does Brilliant.org do for this topic?
- What does 3Blue1Brown's Manim produce for this?
- What are the top 5 tools/apps/sites for this specific area?
- What do FAANG interviewers wish existed?
- What would a CS professor use in a 200-person lecture?

### 1.3 Identify the core experience
Answer in ONE sentence: "The user should feel like _____ when using this."

Examples:
- Algorithm Visualizer: "The user should feel like they're WATCHING the algorithm think."
- System Design Simulator: "The user should feel like they're a ARCHITECT building a real system."
- Data Structures: "The user should feel like they can TOUCH and MANIPULATE the data structure."

---

## PHASE 2: GENERATE 5 RADICAL IDEAS

Before making Stitch prompts, brainstorm 5 completely different approaches for this module.
Don't self-censor. Wild ideas welcome.

```
IDEA 1: [Name]
What if... [the radical concept]
Inspired by: [what app/experience]
Why it might work: [benefit]
Why it might fail: [risk]

IDEA 2: [Name]
...
```

For example (Algorithm Visualizer):
```
IDEA 1: "The Algorithm Theater"
What if... the canvas was a literal theater stage with spotlight, 
curtains, and the algorithm elements are actors performing their roles.
Bubble Sort's "actors" nervously swap positions. Quick Sort's pivot 
"actor" dramatically points left and right.

IDEA 2: "Sound of Sorting"
What if... each element had a musical note (proportional to value) 
and the sort played like a symphony. You could HEAR when it's nearly 
sorted (ascending melody). Different algorithms = different music genres.

IDEA 3: "Time Machine"
What if... instead of step-by-step playback, you had a TIMELINE like 
After Effects, with keyframes, and you could scrub back and forth 
instantly, zoom into any moment, and see the array state at any point.
```

---

## PHASE 3: PICK THE BEST CONCEPT

From your 5 ideas, pick the ONE that:
1. Is most feasible to build
2. Would genuinely make users say "holy shit"
3. Teaches the concept better than anything else
4. Looks BEAUTIFUL in a screenshot

Or COMBINE elements from multiple ideas.

Write the final concept:
```
CHOSEN CONCEPT: "[Name]"

CORE IDEA: [2-3 sentences]

KEY INNOVATIONS:
1. [What's new that nobody else does]
2. [What's new]
3. [What's new]

HOW IT TEACHES BETTER: [Why this helps learning vs traditional approach]

THE SCREENSHOT MOMENT: [The one frame that makes people share it]
```

---

## PHASE 4: DESIGN THE COMPLETE UI

Now detail every screen/view:

### 4.1 Layout Architecture

```
[ASCII wireframe of the ENTIRE layout — can be completely different from current]

Example — if you chose a theater concept:
┌──────────────────────────────────────────────────────────┐
│                     STAGE (full canvas)                    │
│                                                           │
│  ┌─spotlight────────────────────────────────────┐        │
│  │                                               │        │
│  │         [VISUALIZATION AREA]                  │        │
│  │         Full-bleed, cinematic                 │        │
│  │                                               │        │
│  └───────────────────────────────────────────────┘        │
│                                                           │
│  ┌─floating controls (glass, auto-hide)──────────────┐   │
│  │  ◀ ▶ ⏸  ●───────────────── 1x  🔊  ⚙️           │   │
│  └───────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─algorithm picker (bottom sheet, swipe up)─────────┐   │
│  │  Sorting: Bubble ◉  Quick ○  Merge ○  Heap ○     │   │
│  │  Graph:   BFS ○  DFS ○  Dijkstra ○               │   │
│  └───────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Per-Screen Details

For each screen:
```
SCREEN: [Name]
PURPOSE: [What the user does here]
LAYOUT: [ASCII wireframe]
ELEMENTS: [Every UI element with exact labels]
INTERACTION: [How elements respond to user actions]
ANIMATION: [What moves and how]
TRANSITION FROM: [How you get to this screen]
TRANSITION TO: [How you leave this screen]
```

### 4.3 Unique Visual Signatures

What makes THIS module's UI recognizable even in a thumbnail?

```
SIGNATURE 1: [Visual element unique to this module]
Example: "Algorithm Visualizer has a subtle radial pulse from the active comparison"
Example: "System Design has data flow particles along connections"
Example: "Data Structures has a 3D perspective tilt on tree rotations"

SIGNATURE 2: [Color or theme unique to this module]
SIGNATURE 3: [Animation style unique to this module]
```

---

## PHASE 5: GENERATE STITCH PROMPTS

Now create Stitch prompts for your reimagined design.

### STITCH PROMPT TEMPLATE:

```
Design a revolutionary [module type] interface called "Architex — {{MODULE_NAME}}".
This is NOT a typical [module type] tool — it's a completely reimagined experience.

== THE CONCEPT ==
[Describe your chosen concept in 2-3 sentences]

== LAYOUT ==
[Full description of your new layout — NOT the current app layout]

== KEY VISUAL ELEMENTS ==
[Describe every element in the design with exact positions and styles]

== UNIQUE FEATURES (things no other tool has) ==
1. [Feature 1 with visual description]
2. [Feature 2]
3. [Feature 3]

== STYLE ==
Background: [specific color — not generic "dark"]
Primary: [hex]
Accent: [hex]
Surface: [hex]
[Full color palette]

Font: [specific font]
[Typography scale]

Special effects:
- [Glass effects, gradients, shadows, glows, particles — be specific]

== CONTENT (real data) ==
[Use actual algorithm names, actual data values, actual labels from our codebase]

== MOOD ==
[One vivid sentence describing the feeling]
"It feels like watching a nature documentary about algorithms — 
beautiful, mesmerizing, and you learn without realizing it."

== INSPIRED BY ==
- [App 1]: [what specifically you borrowed from it]
- [App 2]: [what]
- [App 3]: [what]

== DO NOT ==
- Do NOT make it look like a typical coding/IDE tool
- Do NOT use generic tech-blue color scheme
- Do NOT include stock photos or generic illustrations
- Do NOT make it look "educational" in a boring way (no textbook vibes)
```

---

## PHASE 6: GENERATE THESE PROMPTS

### Prompt 1: Hero View — The "Money Shot"
The single most impressive screenshot of the reimagined module. 
This is what goes on the landing page.

### Prompt 2: Active State — "The Algorithm is Alive"
The module during an operation — maximum visual impact.

### Prompt 3: Discovery/Selection — "Choose Your Adventure"
How the user picks what to explore (algorithm, data structure, etc.)

### Prompt 4: Learning Moment — "Aha!"
The moment where understanding clicks. The visual that TEACHES.

### Prompt 5: Comparison — "Race/Battle"
Two things compared side-by-side in the most dramatic way possible.

### Prompt 6: Mobile — "Pocket Experience"
The same revolutionary experience on a phone.

### Prompt 7: Empty/Welcome — "First Impression"
What a first-time user sees. Should make them want to explore.

### Prompt 8: Dark + Light
The design in both themes — show the versatility.

---

## PHASE 7: FEASIBILITY CHECK

For each Stitch prompt, add a developer note:

```
BUILDABLE WITH:
  - Layout: [Tailwind grid/flex]
  - Animation: [motion library — spring, stagger, etc.]
  - Visualization: [SVG, Canvas 2D, WebGL, d3]
  - Interaction: [React events, gesture libraries]
  
HARD PARTS:
  - [What's technically challenging]
  - [Estimated effort: S/M/L]
  
COULD SHIP IN: [timeframe]
```

---

## OUTPUT

Save to: `docs/design/{{MODULE_SLUG}}-stitch-reimagine.md`

Also save the brainstorm ideas (Phase 2) and chosen concept (Phase 3) as 
these are valuable even if we don't implement everything.
