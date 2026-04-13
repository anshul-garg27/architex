# Architex Algorithm Visualizer -- Google Stitch Mockup Prompts

> 8 copy-pasteable prompts for Google Stitch. Each produces one screenshot-quality mockup.
> Based on the actual codebase: AlgorithmCanvas.tsx, ArrayVisualizer.tsx, DotPlotVisualizer.tsx, ColorMapVisualizer.tsx, LiveDashboard.tsx, SortCelebration.tsx, DangerOverlay.tsx, AlgorithmRace.tsx, TimelineScrubber.tsx, and globals.css token values.

---

### Stitch Prompt 1: Main View -- Default State (Bar Chart)

```
Create a high-fidelity desktop UI screenshot (1440x900) of a dark-themed algorithm visualization tool called "Architex". This is the default state when the Algorithm module first loads with Bubble Sort selected.

LAYOUT (left to right):
- Activity bar: 48px wide, vertical icon strip on far left. Background #0F0F17. Five icons stacked: a bar chart icon (active, with violet #8B5CF6 left border indicator), a network graph icon, a tree icon, a grid icon, a compass icon. Each icon is 20px, color #6B7280 except active which is #8B5CF6.
- Sidebar: 260px wide. Background #111118. Top: "ALGORITHM" label in 9px uppercase tracking-widest, color #6B7280. Below: a search input with placeholder "Search algorithms..." in a rounded-lg field with border rgba(255,255,255,0.06). Below: category sections -- "Sorting" expanded showing Bubble Sort (selected, highlighted with bg #8B5CF6/15% and left violet bar), Selection Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort each as 13px text in #D4D4E0. Below the list: "Array Input" label, a text input showing "38, 27, 43, 3, 9, 82, 10, 54, 28, 67, 15, 72, 5, 91, 36" in monospace 11px #D4D4E0. Below: four preset buttons in a row: "Random", "Nearly Sorted", "Reversed", "Few Unique" -- each a small pill with bg #16161F, border rgba(255,255,255,0.06), text 10px #6B7280. Below: "Speed" label with a horizontal slider (track bg #16161F, thumb #8B5CF6, filled portion #8B5CF6/40%). Below: playback controls row -- |<< (step back), < (prev), Play triangle (large, centered, #8B5CF6 fill), > (next), >>| (step forward) -- each 32px round button with bg #16161F, icon color #D4D4E0. A "Run" button below, full width, bg #8B5CF6, text white 13px font-semibold, rounded-lg, 40px tall.
- Canvas (flex-1, roughly 852px): Background #0A0A0F. Centered within: a rounded-xl container (max-width ~700px) with border rgba(255,255,255,0.06) and a subtle gradient from #16161F/80% at top to #0A0A0F at bottom. Inside: 15 vertical bars representing array values [38, 27, 43, 3, 9, 82, 10, 54, 28, 67, 15, 72, 5, 91, 36]. Bar heights proportional to values (max bar ~240px for value 91). Default bars: linear gradient from #4B5563 at bottom to #6B7280 at top. TWO bars (index 7 and 8, values 54 and 28) are in "comparing" state: gradient from #2563EB at bottom to #3B82F6 at top, with a soft blue glow (box-shadow 0 0 12px rgba(59,130,246,0.5)). All other non-comparing bars are dimmed to 70% opacity. Each bar has a value label above it in monospace 10px (same color as the bar). Below the bars: index labels 0-14 in monospace 10px #4B5563. In the top-left of the canvas container: a view toggle with three small icon buttons in a row -- bar chart icon (active, bg #8B5CF6/20%, text #8B5CF6), scatter dot icon, gradient strip icon -- each 28px, rounded-md. In the top-right: a speaker icon toggle button (28px, rounded-full, bg #16161F, icon #6B7280). Below the bars: a step description overlay -- a glassmorphism pill (bg rgba(17,17,24,0.8), backdrop-blur-xl, border rgba(255,255,255,0.06), rounded-lg, px-4 py-2) containing text "Step 1: Compare arr[7]=54 with arr[8]=28" in 12px #D4D4E0. Bottom-right corner of the bar container: a legend showing four small colored dots with labels -- blue dot "comparing", red dot "swapping", green dot "sorted", purple dot "pivot" -- each in 9px #6B7280.
- Right side: 280px properties panel. Background #111118. Sections: "Bubble Sort" as title in 15px font-semibold white. Below: "Time: O(n^2)" and "Space: O(1)" in monospace 11px #6B7280. A "Best Case: O(n)" line. A description paragraph in 12px #6B7280. A pseudocode block with bg #0A0A0F, border rgba(255,255,255,0.06), monospace 11px showing 8 lines of bubble sort pseudocode with line numbers in #4B5563.
- Bottom panel: 36px status bar. Background #0F0F17. Left: "Algorithm Visualizer" in 11px #6B7280. Right: "Step 1 / 105" in monospace 11px #6B7280.

STYLE: Dark glassmorphism. Font: Inter (or Geist Sans). No rounded corners larger than 12px. All borders are 1px rgba(255,255,255,0.06). Subtle depth through layered backgrounds. The overall feel is Linear meets VS Code.

MOOD: Clean, professional, focused. The two blue comparing bars draw the eye. The rest is muted.

REFERENCE STYLE: Linear app dark theme, VS Code sidebar structure, Raycast command palette aesthetic.

DO NOT: Include any browser chrome. Do not use gradients brighter than the specified hex values. Do not add decorative illustrations. Do not use white backgrounds anywhere. Do not make bars thicker than 36px or thinner than 8px.
```

---

### Stitch Prompt 2: Active Running State -- With Live Dashboard

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer mid-execution. Bubble Sort is running on 15 elements. The live dashboard is visible below the bars.

LAYOUT:
- Same activity bar (48px, #0F0F17) and sidebar (260px, #111118) as before, but the sidebar shows: playback controls with the Pause icon (replacing Play, indicating it's running), speed slider at 60%, and the "Run" button now says "Pause" with bg #EF4444/80%.
- Canvas area (flex-1): Background #0A0A0F. Centered rounded-xl container.
  - BAR CHART: 15 bars. Values shown mid-sort: [3, 5, 9, 10, 15, 27, 28, 38, 43, 54, 67, 72, 82, 91, 36]. The first 14 bars (indices 0-13) are partially sorted. Bars at indices 13 (value 91) and 14 (value 36) are in "comparing" state -- gradient #2563EB to #3B82F6 with a soft blue box-shadow glow of 14px radius. A SPOTLIGHT effect: a radial gradient overlay (200px diameter, rgba(139,92,246,0.12) center fading to transparent) is centered between the two active bars. All other bars are dimmed to 70% opacity. Bars at indices 0-7 have a subtle green tint (gradient #166534 to #22C55E at top) indicating they are in "sorted" state. Index 8 bar is the last one being compared before.
  - VALUE LABELS: Each bar has its numeric value above in monospace 10px, color matching bar state.
  - STEP DESCRIPTION: Glassmorphism pill below bars: "Compare 91 and 36 -- 91 > 36, so swap." in 12px #D4D4E0, with a right-arrow icon in #3B82F6 before the text.
  - VIEW TOGGLE: Top-left, bar chart icon selected (violet highlight).
  - SOUND TOGGLE: Top-right, speaker icon in #8B5CF6 (sound is on).
  - Top-right corner buttons row: "Vars" pill, code icon, expand icon, link icon, printer icon, camera icon, record icon, speaker icon -- each 36px round glassmorphism buttons (bg rgba(17,17,24,0.9), border rgba(255,255,255,0.06)).

  - LIVE DASHBOARD (below the bar chart, 3 widgets in a horizontal row, mt-3):
    Widget 1 -- COMPLEXITY GAUGE: A semicircular gauge (120px wide, 60px tall arc). The arc background is a gradient: green (#22C55E) for 0-60deg, yellow (#EAB308) for 60-120deg, red (#EF4444) for 120-180deg. A needle (2px white line with a small circle at the pivot) points to approximately 110deg (in the yellow zone, approaching red). Below the gauge: "Complexity" label in 9px uppercase #6B7280. The widget sits in a rounded-lg container with bg #111118/80%, backdrop-blur, border rgba(255,255,255,0.06).
    Widget 2 -- ODOMETER COUNTER: Two rows of mechanical-counter-style digits. Top row: "0042" in a monospace digital display style, each digit in its own rounded-sm cell (bg #0A0A0F, 20px wide, 28px tall) with border rgba(255,255,255,0.06). Label below: "comparisons" in 9px #6B7280. Second counter below: "0018" in same style but smaller (16px x 22px cells). Label: "swaps" in 9px #6B7280. The entire widget in the same container style as the gauge.
    Widget 3 -- MEMORY BAR: A horizontal bar (200px wide, 8px tall, rounded-full). Background #16161F. A tiny green (#22C55E) filled sliver at the left (5% width, representing O(1) space). Label above: "Space: O(1)" in monospace 10px #22C55E. Label below: "Memory Usage" in 9px #6B7280. Same container styling.

  - TIMELINE SCRUBBER (at very bottom of the canvas container, below dashboard):
    A horizontal track (full width of the container, 4px tall, rounded-full, bg #16161F). A progress handle (12px circle, #8B5CF6, with a 2px white border) at approximately 40% along the track. The filled portion (left of handle) is #8B5CF6/40%. Three small diamond milestone markers on the track at 0%, 33%, and 66% positions, each 6px, #6B7280. On hover state, one milestone shows a tiny tooltip "Pass 2 complete" in 9px.

STYLE: Same dark glassmorphism as Prompt 1. The dashboard widgets use consistent rounded-lg containers with subtle borders. Everything is subdued except the active comparing bars and the gauge needle.

MOOD: Energetic but focused. The algorithm is running -- there is a sense of motion. The gauge needle in the yellow zone creates subtle tension. The odometer counter mid-tick suggests constant activity.

REFERENCE STYLE: Tesla instrument cluster (gauge), Apple Watch activity rings (dashboard), Vercel analytics dashboard (counters).

DO NOT: Make the dashboard widgets larger than the bar chart. Do not use bright white anywhere except the gauge needle. Do not add 3D effects to the gauge. Keep the dashboard understated -- it supports the bars, not the other way around.
```

---

### Stitch Prompt 3: Dot Plot View -- Mid-Sort

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer showing the DOT PLOT view during a Bubble Sort mid-execution on 30 elements.

LAYOUT:
- Activity bar (48px) and sidebar (260px) same as previous prompts. Sidebar shows Bubble Sort selected, 30-element array.
- Canvas area: Background #0A0A0F. Centered rounded-xl container (max-width ~700px, height ~420px) with border rgba(255,255,255,0.06), gradient bg from #16161F/80% to #0A0A0F.

  INSIDE THE CONTAINER -- SVG SCATTER PLOT:
  - X-axis: "position" label in monospace 8px rgba(255,255,255,0.3). Tick marks at 0, 5, 10, 15, 20, 25, 29 in monospace 9px rgba(255,255,255,0.4). Thin axis line rgba(255,255,255,0.25).
  - Y-axis: "value" label (rotated 90deg) in monospace 8px rgba(255,255,255,0.3). Tick marks at 0, 20, 40, 60, 80, 100. Same styling.
  - GRID: Very subtle horizontal and vertical grid lines at each tick, rgba(255,255,255,0.1), 0.5px.
  - REFERENCE DIAGONAL: A dashed line from bottom-left (0,0) to top-right (29, max_value), stroke rgba(255,255,255,0.15), stroke-dasharray 6 4, 1px width. This represents "perfectly sorted."
  - DATA DOTS: 30 circles.
    - The first ~18 dots (lower indices) are NEAR the diagonal line -- they are partially sorted. These are in "sorted" state: #22C55E, radius 5px, opacity 0.6.
    - The remaining ~12 dots (higher indices) are scattered ABOVE and BELOW the diagonal -- still unsorted. These are in "default" state: #6B7280, radius 5px, opacity 0.6.
    - TWO dots (at positions ~20 and ~21) are in "comparing" state: #3B82F6, radius 7px (larger), opacity 1.0, with an SVG glow filter (feGaussianBlur stdDeviation 3). These two dots are clearly the focal point.
    - The visual pattern: bottom-left area shows dots converging onto the diagonal (sorted), top-right area shows scattered dots (unsorted). The SHAPE of emerging order is visible.

  - VIEW TOGGLE: Top-left of container. Three icon buttons: bar chart, scatter dots (ACTIVE -- bg #8B5CF6/20%, text #8B5CF6, slightly larger or with a bottom indicator), color strip. Each 28px.
  - LEGEND: Bottom-right corner inside the container. Four colored circles with labels: blue "comparing", red "swapping", green "sorted", purple "pivot" -- 9px text #6B7280.
  - STEP DESCRIPTION: Below the container, glassmorphism pill: "Compare positions 20 and 21 -- dots converging toward diagonal" in 12px #D4D4E0.

- Properties panel (280px) shows the same Bubble Sort info.

STYLE: The dot plot should feel like a D3.js scatter plot inside a dark glassmorphism container. Clean SVG rendering. The glow on active dots should be subtle but visible. The diagonal reference line is the key visual anchor.

MOOD: Elegant and data-rich. The emerging diagonal pattern from chaos is the hero. This should feel like a Mike Bostock "Visualizing Algorithms" piece -- the beauty is in the mathematical pattern, not decoration.

REFERENCE STYLE: Mike Bostock's "Visualizing Algorithms" (bost.ocks.org), Observable notebooks, D3.js gallery scatter plots.

DO NOT: Use filled backgrounds behind dots. Do not make the grid lines prominent. Do not add tooltips (this is a static mockup). Do not use drop shadows on dots -- only the SVG glow filter on active ones. Do not make the diagonal line thick or prominent -- it is a subtle reference.
```

---

### Stitch Prompt 4: Color Map View

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer showing the COLOR MAP view during a Bubble Sort mid-execution on 40 elements.

LAYOUT:
- Activity bar (48px) and sidebar (260px) same structure. Sidebar shows Bubble Sort, 40 elements.
- Canvas area: Background #0A0A0F. Centered in the canvas: a rounded-xl container (max-width ~700px, height ~140px) with border rgba(255,255,255,0.06).

  INSIDE THE CONTAINER -- COLOR MAP STRIP:
  - A single horizontal strip of 40 adjacent rectangular cells, each approximately 16px wide and 80px tall, with no gaps between them. Each cell is filled with an HSL color where hue maps to the element's value: hue = (value / maxValue) * 270, saturation 80%, lightness 55%.
  - LEFT PORTION (indices 0-24, roughly sorted): These cells form a smooth rainbow gradient transitioning from red (hue ~0) through orange, yellow, green, blue, to blue-violet (hue ~170). The gradient is smooth and ordered -- this is the "sorted" portion. These cells have lightness boosted to 65% (brighter) to indicate sorted state.
  - RIGHT PORTION (indices 25-39, unsorted): These cells are a jumble of colors -- random hues, creating visual "noise". A green cell next to a red cell next to a violet cell. The disorder is immediately visible compared to the smooth gradient on the left.
  - TWO CELLS (indices ~30 and ~31) are in "comparing" state: they have a 2px solid top border in #3B82F6 (blue). This is the only indicator of comparing state -- a blue top border line.
  - The visual effect: left side is a beautiful ordered rainbow, right side is colorful chaos. The boundary between order and chaos is clearly visible around index 25.

  - VIEW TOGGLE: Top-left. Three icons: bar chart, scatter dots, color strip (ACTIVE -- bg #8B5CF6/20%, text #8B5CF6). Each 28px.
  - Below the strip: index labels every 5th position (0, 5, 10, 15, 20, 25, 30, 35, 39) in monospace 9px #4B5563.

  ADDITIONAL CONTEXT below the color map container (with mt-6):
  - A label "40 elements -- Bubble Sort pass 18 of ~40" in 11px #6B7280, centered.
  - The live dashboard row (same 3 widgets as Prompt 2 but showing: gauge needle at ~100deg yellow zone, odometer "0312" comparisons / "0098" swaps, memory bar O(1) green sliver).

- Properties panel (280px): Bubble Sort info. Includes a small note: "Color Map: Each element mapped to a hue. Sorted = rainbow gradient. Unsorted = color noise."

STYLE: The color map strip should look like a data visualization from Mike Bostock's article. Clean, no gaps between cells. The rainbow-to-noise contrast is the entire visual story. The surrounding UI is muted to let the colors speak.

MOOD: This is the "Visualizing Algorithms" moment. The beauty of the color map is in its simplicity -- you can SEE sortedness as a pattern (gradient vs noise) without understanding any algorithm. It is information-dense yet immediately legible.

REFERENCE STYLE: Mike Bostock "Visualizing Algorithms", Processing generative art strips, Stripe's gradient aesthetics.

DO NOT: Add borders between individual cells (they should be seamless). Do not use rounded corners on individual cells. Do not make the strip taller than 100px. Do not add any overlay text on top of the color cells. Do not desaturate the colors -- they should be vibrant (80% saturation).
```

---

### Stitch Prompt 5: Sort Complete -- Celebration

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer at the exact moment Bubble Sort finishes. The celebration state is active.

LAYOUT:
- Activity bar (48px) and sidebar (260px). Sidebar playback shows step 105/105, Play button is now idle.
- Canvas area: Background #0A0A0F. The entire canvas has a subtle festive energy.

  BAR CHART (centered, max-width ~700px):
  - 15 bars in PERFECT ascending order (sorted): values [3, 5, 9, 10, 15, 27, 28, 36, 38, 43, 54, 67, 72, 82, 91]. The bars form a clean ascending staircase from left to right.
  - ALL bars are in "sorted" state: gradient from #166534 at bottom to #22C55E at top, with a very subtle green glow (box-shadow 0 0 6px rgba(34,197,94,0.25)). Every bar is full opacity.
  - RAINBOW GRADIENT SWEEP: A 3px-tall horizontal line at the very bottom of the bars, spanning the full width. This line is a CSS linear-gradient: red, orange, yellow, green, blue, violet (left to right). It sits exactly at the base of the bars like an underline.
  - Value labels above each bar in monospace 10px #22C55E.
  - Index labels below in #4B5563.

  CONFETTI PARTICLES:
  - Canvas2D-style confetti burst. Approximately 50-60 small particles scattered across the upper 60% of the canvas container. Particles are small rectangles (4x8px) and circles (4px radius) in colors: #8B5CF6 (violet), #3B82F6 (blue), #22C55E (green), #F59E0B (amber), #EF4444 (red), #EC4899 (pink). They appear to be falling downward with slight rotation. Some particles are at 80% opacity (fading). They emanate from the top-center of the canvas.

  STATS BANNER (centered below the bars, mt-4):
  - A glassmorphism card (bg rgba(17,17,24,0.85), backdrop-blur-xl, border rgba(255,255,255,0.08), rounded-xl, px-6 py-3, max-width 500px).
  - Inside: A green check circle icon (20px, #22C55E) on the left. Then text: "Bubble Sort -- Sorted!" in 14px font-semibold #D4D4E0. A thin vertical divider (1px, rgba(255,255,255,0.1), 24px tall). Then stats: "105 steps" in 12px #6B7280, a dot separator, "42 comparisons" in 12px #6B7280, a dot separator, "18 swaps" in 12px #6B7280. A small X dismiss button on the far right, 16px, #4B5563.

  VIEW TOGGLE: Top-left, bar chart selected.
  SOUND TOGGLE: Top-right, on.

- Properties panel (280px): Shows completed state.

STYLE: The celebration is TASTEFUL, not overwhelming. The confetti is the main festive element but the particles are small and semi-transparent. The rainbow sweep is thin (3px) and adds a "finishing touch" without being garish. The green sorted bars are satisfying. The stats banner is informative and minimal.

MOOD: "Screenshot moment." This is the frame users would share. A feeling of accomplishment and beauty. The ascending green staircase with gentle confetti is satisfying. The stats banner provides closure. Think of it like a GitHub contribution graph on a full year -- satisfying completion.

REFERENCE STYLE: Duolingo lesson complete screen (celebratory but clean), Stripe Checkout success state, Apple fitness ring completion.

DO NOT: Use large confetti pieces. Do not animate (this is a static frame -- show particles at various fall positions as if captured mid-fall). Do not use fireworks or sparkle effects. Do not make the rainbow sweep thicker than 4px. Do not add text like "Congratulations!" -- the stats banner is enough.
```

---

### Stitch Prompt 6: Algorithm Race -- Comparison Mode

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer in Algorithm Race mode, comparing Bubble Sort vs Quick Sort side by side.

LAYOUT:
- Activity bar (48px) and sidebar (260px). Sidebar shows comparison mode enabled with two algorithm dropdowns: "Bubble Sort" and "Quick Sort" selected.
- Canvas area: Background #0A0A0F. The canvas is split vertically into sections.

  RACE BANNER (top of canvas, full width):
  - A glassmorphism banner (bg rgba(17,17,24,0.85), backdrop-blur-xl, border-b rgba(255,255,255,0.06), height ~56px, px-6).
  - Left: A flag icon (16px, #8B5CF6) followed by "ALGORITHM RACE" in 11px uppercase tracking-widest font-semibold #D4D4E0.
  - Center-left: "Same input: 20 elements, random" in 10px #6B7280.
  - Below the title, two progress bar rows:
    Row 1: "Bubble Sort" label in 12px #D4D4E0 (left). Progress bar: 200px wide, 8px tall, rounded-full. Background #16161F. Filled portion (45%) in a gradient from #EF4444 to #F87171 (red tones -- it is losing). To the right of the bar: "45%" in monospace 11px #EF4444. Then "142 cmp" in monospace 10px #6B7280.
    Row 2: "Quick Sort" label in 12px #8B5CF6. Progress bar same dimensions. Filled portion (92%) in a gradient from #8B5CF6 to #A78BFA (violet -- it is winning). "92%" in monospace 11px #8B5CF6. Then "23 cmp" in monospace 10px #6B7280. A small trophy icon (12px, #EAB308 gold) appears next to Quick Sort's name since it is in the lead.

  SIDE-BY-SIDE VISUALIZERS (below the race banner):
  - The canvas splits into two equal halves with a 1px vertical divider (rgba(255,255,255,0.06)) down the center.

  LEFT HALF -- BUBBLE SORT:
  - Header bar: "A" label in 12px font-semibold #D4D4E0, left aligned. Right side: "Step: 68" in monospace 10px #6B7280, then "142 cmp | 56 swp" in monospace 10px #F59E0B.
  - Below: ArrayVisualizer with 20 bars. Mid-execution state: first ~9 bars sorted (green gradient #166534 to #22C55E), two bars at index 10-11 in comparing state (blue #3B82F6 with glow), remaining bars in default (#4B5563 to #6B7280). The array is clearly NOT done -- lots of unsorted bars. The overall impression: sluggish progress.

  RIGHT HALF -- QUICK SORT:
  - Header bar: "B (Quick Sort)" label in 12px font-semibold #8B5CF6. Right side: "Step: 18" in monospace 10px #6B7280, then "23 cmp | 12 swp" in monospace 10px #8B5CF6.
  - Below: ArrayVisualizer with 20 bars. Nearly done: 18 of 20 bars are in sorted state (green), only 2 bars remain in comparing state (blue). A pivot bar (index ~10) has a purple ring (2px solid #A855F7 with ring offset). The array is visually ALMOST a perfect ascending staircase. The feeling: this side has almost won.

STYLE: The race framing creates drama. The progress bars are the primary narrative device -- the viewer immediately sees Quick Sort destroying Bubble Sort. The left side (Bubble Sort) should feel slow and heavy. The right side (Quick Sort) should feel fast and nearly complete. The violet accent ties Quick Sort to the "winning" theme.

MOOD: Competitive and educational. The complexity difference is VISCERAL -- not just numbers but visible progress gap. This is the "Oh!" moment where O(n^2) vs O(n log n) becomes real. The viewer should feel Quick Sort's superiority without reading any text.

REFERENCE STYLE: Vercel speed comparison layouts, racing game split screens, GitHub Actions job comparison views.

DO NOT: Add a "Winner!" banner yet (race is not over). Do not use different bar sizes for left vs right -- both should have 20 bars at the same scale. Do not show confetti. Do not use bright backgrounds for either half -- both are on #0A0A0F. Do not add lap times or clocks.
```

---

### Stitch Prompt 7: Worst-Case Danger State

```
Create a high-fidelity desktop UI screenshot (1440x900) of the Architex algorithm visualizer showing Quick Sort degenerating on sorted input (Lomuto pivot). This is the "danger" state.

LAYOUT:
- Activity bar (48px) and sidebar (260px). Sidebar shows "Quick Sort" selected, array input: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15" (worst case -- already sorted for Lomuto). Speed slider at 80%.
- Canvas area: Background #0A0A0F but with a danger atmosphere.

  RED VIGNETTE OVERLAY:
  - A full-canvas overlay: radial-gradient(ellipse at center, transparent 50%, rgba(239,68,68,0.08) 75%, rgba(239,68,68,0.15) 100%). This creates a subtle red darkening around the edges of the canvas, like a photography vignette. It should be SUBTLE -- not a red screen, but a palpable unease in the periphery.

  BAR CHART (centered):
  - 15 bars. The array is already sorted (ascending 1-15), but Quick Sort with Lomuto pivot is making it do maximum work. Most bars are in default state but tinted slightly warm: gradient from #78350F to #F59E0B (amber-ish, not the normal gray). This is because the algorithm is in distress. TWO bars in comparing state: #EF4444 (RED, not blue!) with an aggressive glow (box-shadow 0 0 16px rgba(239,68,68,0.5)). The current pivot bar (index 14, the last element, value 15) has a 2px #A855F7 ring. The bars feel STRESSED -- the amber tinting conveys "something is wrong."
  - Value labels in #EF4444/70% tint for active bars, #F59E0B for others.

  DANGER WARNING BADGE (top-right of canvas, positioned absolutely):
  - A glassmorphism card (bg rgba(127,29,29,0.25), backdrop-blur-xl, border 1px rgba(239,68,68,0.3), rounded-lg, px-4 py-3, max-width 280px).
  - Inside: A warning triangle icon (20px, #EF4444) on the left. Text: "Worst-case detected!" in 13px font-semibold #EF4444. Below: "O(n^2) behavior -- pivot always picks the largest element on sorted input. Comparisons: 105 (expected ~55 for n=15)." in 11px #D4D4E0/80%.

  COMPARISON COUNTER (in the danger badge or nearby):
  - The number "0105" displayed in a large monospace font (24px, #EF4444, font-weight bold). It has a subtle pulsing glow effect (as if it were animating between box-shadow 0 0 8px rgba(239,68,68,0.3) and 0 0 16px rgba(239,68,68,0.5) -- show the brighter state in this static frame). Label below: "comparisons (1.9x expected)" in 9px #EF4444/60%.

  LIVE DASHBOARD (below bars):
  - Gauge needle is pegged in the RED zone (past 150deg of the 180deg arc). The red portion of the arc is glowing.
  - Odometer: "0105" comparisons in RED digits, "0000" swaps (Lomuto on sorted input does 0 swaps but maximum comparisons).
  - Memory bar: "O(n)" space showing a larger filled portion (Quick Sort recursion stack depth n due to degenerate case), bar color #EF4444 instead of green.

  STEP DESCRIPTION: "Partition returns index 14 -- no elements to the right. Recursion depth: 14/15 (degenerate!)" in 12px, with "degenerate!" in #EF4444 bold.

STYLE: The red vignette is the key atmospheric element. It should NOT look like an error dialog -- it should feel like the visualization itself is in distress. The amber/red color shift on bars, the red counter, and the vignette work together. Think of it as the screen "running a fever."

MOOD: Tension and danger. The algorithm is struggling. The counter is absurdly high. The gauge is pegged. Every visual cue says "this is bad" -- but in an educational way, not an error-message way. The viewer should viscerally feel why worst-case matters.

REFERENCE STYLE: Security dashboard alert states, Tesla battery critical warning, nuclear reactor control room (subdued version). The red should feel like an instrument warning light, not a stop sign.

DO NOT: Make the vignette opaque -- it must be subtle (max 15% opacity at edges). Do not turn the entire background red. Do not add flashing effects. Do not use exclamation marks outside the warning badge. Do not make the bars themselves fully red -- they are amber/warm with red only on the active comparing pair.
```

---

### Stitch Prompt 8: Mobile View (375px)

```
Create a high-fidelity mobile UI screenshot (375x812, iPhone 14 proportions) of the Architex algorithm visualizer. The sidebar is collapsed into a bottom tab bar. Bubble Sort with 8 elements, paused mid-execution.

LAYOUT (top to bottom):
- STATUS BAR (top 44px): Standard iOS status bar mockup. Time "9:41" left, signal/wifi/battery icons right. All in white on transparent (the dark background shows through).
- APP HEADER (48px): Background #111118, border-bottom 1px rgba(255,255,255,0.06). Left: back arrow icon (20px, #6B7280). Center: "Bubble Sort" in 15px font-semibold #D4D4E0. Right: ellipsis menu icon (20px, #6B7280).

- CANVAS (flex-1, roughly 590px tall): Background #0A0A0F.
  - FLOATING CONTROLS (top of canvas, overlaying):
    - Left side: View toggle -- three tiny icon buttons (bar/dots/map) in a horizontal glassmorphism pill (bg rgba(17,17,24,0.85), backdrop-blur-xl, border rgba(255,255,255,0.06), rounded-full, h-36px). Bar chart icon is active (#8B5CF6). Each icon 16px with 10px padding.
    - Right side: Sound toggle -- a single glassmorphism circle (32px, same glass styling), speaker icon 14px, #6B7280.

  - BAR CHART (centered, full width minus 24px padding on each side):
    - 8 bars representing values [54, 28, 67, 15, 38, 43, 9, 72]. Bars are wider on mobile (each ~36px). Height proportional, max bar ~280px for value 72.
    - Two bars (index 1 and 2, values 28 and 67) in comparing state: blue gradient #2563EB to #3B82F6, glow. Other bars default gray.
    - Value labels above each bar in monospace 11px (slightly larger than desktop for readability).
    - Index labels 0-7 below.

  - STEP DESCRIPTION (below bars, centered):
    - Glassmorphism pill (bg rgba(17,17,24,0.85), backdrop-blur-xl, rounded-lg, px-4 py-2.5 -- slightly larger padding for touch).
    - Text: "Compare 28 and 67 -- in order, no swap" in 13px #D4D4E0.
    - The pill has min-height 44px (touch target).

  - PLAYBACK CONTROLS (below step description, mt-4):
    - Centered row of controls, all with 44px minimum touch targets:
    - |<< button (44x44, rounded-full, bg #16161F, icon 18px #6B7280)
    - < button (same styling)
    - PLAY button (56x56, rounded-full, bg #8B5CF6, Play triangle icon 24px white, centered -- this is the hero button, larger than others)
    - > button (44x44 same as << )
    - >>| button (same)
    - Below the row: a thin progress bar (full width, 4px tall, rounded-full, bg #16161F, filled 35% with #8B5CF6/40%). "Step 12 of 28" label below in 10px #6B7280, centered.

- BOTTOM TAB BAR (80px including safe area, bottom):
  - Background #111118, border-top 1px rgba(255,255,255,0.06). Safe area padding at bottom (~34px for iPhone home indicator area, bg #0F0F17).
  - Five tab items evenly spaced:
    1. "Sort" -- bar chart icon (20px) + label (10px) in #8B5CF6 (active tab)
    2. "Graph" -- network icon + label in #6B7280
    3. "Tree" -- tree icon + label in #6B7280
    4. "DP" -- grid icon + label in #6B7280
    5. "More" -- ellipsis icon + label in #6B7280
  - Each tab item is 44px wide touch target minimum. Active tab has a small 3px violet dot below the icon.

STYLE: The mobile layout prioritizes the visualization. No sidebar, no properties panel. Controls are floating and minimal. The bottom tab bar replaces the sidebar navigation. Everything has generous touch targets (44px minimum). The step description pill and playback buttons are sized for thumbs. The 8 bars are chunkier and easier to see than desktop.

MOOD: Clean and focused mobile experience. Despite the small screen, the visualization is prominent and clear. The app feels native -- like a well-designed iOS app, not a shrunken website. The bottom tab bar is familiar to any mobile user. Compact but not cramped.

REFERENCE STYLE: Apple Music player controls, Spotify mobile playback bar, Linear mobile app, Vercel mobile dashboard.

DO NOT: Shrink the bars below 24px width. Do not show the sidebar in any form (it is entirely replaced by the tab bar). Do not use text smaller than 10px. Do not place buttons closer than 8px apart. Do not add a hamburger menu. Do not show the properties panel or live dashboard (too cramped for mobile). Do not use desktop-style hover effects -- mobile has no hover state.
```
