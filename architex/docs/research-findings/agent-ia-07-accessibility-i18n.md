I now have a thorough understanding of Architex's current accessibility infrastructure. Here is the complete analysis and strategy.

---

## ARCHITEX ACCESSIBILITY AND INTERNATIONALIZATION STRATEGY

### Current State: What Already Exists

Architex has a surprisingly strong foundation -- stronger than most 780-task platforms at this stage. Here is what I found:

**Already built and functional:**
- `SkipLink` component (WCAG 2.4.1) at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/SkipLink.tsx` -- but only has two targets (main content, navigation). Missing: skip to canvas, skip to properties, skip to bottom panel.
- `SimulationAnnouncer` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/SimulationAnnouncer.tsx` -- excellent live region that announces simulation status, metrics every 5 seconds, and canvas mutations (node add/delete, edge create). This is production-quality.
- `ScreenReaderView` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/ScreenReaderView.tsx` -- converts UML diagrams to structured HTML with classes, attributes, methods, and relationship descriptions. Genuinely good work: "Subject inherits from Observer" style announcements.
- `ColorblindToggle` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/ColorblindToggle.tsx` -- IBM Design colorblind-safe palette with CSS variable overrides for all node types, states, and visualization colors.
- `A11yToolbar` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/A11yToolbar.tsx` -- list view toggle, grid snap, high contrast, reduce animations, zoom controls. All properly labeled with ARIA.
- `ReducedMotionProvider` at `/Users/anshullkgarg/Desktop/system_design/architex/src/providers/ReducedMotionProvider.tsx` -- respects OS `prefers-reduced-motion`, has toolbar override, persists to localStorage. Wired to motion library via `MotionProvider`.
- `MotionProvider` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/providers/MotionProvider.tsx` -- bridges `ReducedMotionProvider` to `MotionConfig` so all `<motion.*>` components automatically respect the preference.
- Touch target utilities at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/touch-targets.ts` -- runtime audit function with 44x44px WCAG 2.5.8 enforcement.
- Color contrast utilities at `/Users/anshullkgarg/Desktop/system_design/architex/src/__tests__/lib/a11y/color-contrast.test.ts` -- `hexToRgb`, `relativeLuminance`, `getContrastRatio`, `meetsAA`, `meetsAAA`, `suggestAccessibleColor`. Full test suite.
- High contrast mode at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/high-contrast.ts` -- AAA-targeted overrides for all theme tokens, including pure black backgrounds and bright yellow focus rings.
- Motion design system at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/motion.ts` -- every animation has a reduced-motion fallback documented. Particle layer checks `prefers-reduced-motion` before starting.
- `NodeListPanel` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/NodeListPanel.tsx` -- fully accessible table alternative to the canvas with keyboard navigation (Enter to select, Delete to remove), `role="grid"`, `aria-selected`.
- Lighthouse CI at `/Users/anshullkgarg/Desktop/system_design/architex/.github/workflows/lighthouse-ci.yml` -- enforces >= 0.95 accessibility score on every PR.
- i18n string extraction at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/i18n/strings.ts` -- all user-facing strings organized by section, typed, but explicitly noted as "not yet wired to components."
- Keyboard shortcuts sheet at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/overlays/KeyboardShortcutSheet.tsx` -- proper dialog role, Escape to close, focus management.

**What is missing -- organized by priority and WCAG level:**

---

### 1. CANVAS ACCESSIBILITY (The Hardest Problem)

**1A. SVG/ReactFlow Canvas Is Invisible to Screen Readers**

The `BaseNode` component at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/nodes/system-design/BaseNode.tsx` uses `<motion.div>` elements inside React Flow's viewport. React Flow renders nodes in a `transform: translate()` container that screen readers traverse as flat DOM but without semantic structure. The node has `aria-label={data.label || 'Node'}` at the dot LOD tier, and a `State: ${data.state}` label on the state indicator, but:

- No `role="img"` or `role="application"` on the canvas container
- No `aria-roledescription` for the diagram type
- Relationships (edges) have zero screen reader representation outside the LLD module's `ScreenReaderView`
- Node metrics (throughput, latency) are visual-only in canvas view

**Research -- How Figma, Miro, and draw.io handle this:**
Figma uses `role="application"` on the canvas with a completely separate "accessibility tree" panel. Miro provides a screen-reader-only text summary. The WAI-ARIA Graphics Module (https://www.w3.org/TR/graphics-aria-1.0/) defines `role="graphics-document"`, `graphics-object`, and `graphics-symbol` specifically for diagrams.

**Recommendation -- Two-track approach:**

Track 1 (must-have, WCAG AA, effort M): Extend the existing `NodeListPanel` + `ScreenReaderView` pattern to ALL modules, not just LLD. The system design canvas needs an equivalent that lists nodes, their states, their connections, and their metrics in a sortable, filterable table. This is already 80% built -- the `NodeListPanel` exists but only shows name/type/connections. Add columns for state, throughput, latency, error rate.

Track 2 (should-have, WCAG AA, effort L): Add `role="application"` to the React Flow wrapper with `aria-roledescription="system architecture diagram"`. Add an `aria-label` that summarizes the diagram: "System architecture with 8 nodes and 12 connections. Use the list view for accessible navigation."

The canvas container should get:
```tsx
<div
  role="application"
  aria-roledescription="system architecture diagram"
  aria-label={`${nodes.length} components, ${edges.length} connections. Press Alt+L for accessible list view.`}
>
```

Track 3 (nice-to-have, AAA, effort L): Add invisible SVG `<title>` and `<desc>` elements to each edge SVG path. React Flow custom edges can include:
```tsx
<path d={edgePath}>
  <title>{`${sourceLabel} connects to ${targetLabel} via ${edgeType}`}</title>
</path>
```

**Priority:** Critical. The canvas is the core product surface and currently offers no screen reader path for system design, algorithms, data structures, database, distributed, networking, OS, concurrency, security, or ML design modules. Only LLD has the `ScreenReaderView`.

**WCAG:** 1.1.1 Non-text Content (A), 1.3.1 Info and Relationships (A), 4.1.2 Name, Role, Value (A)

---

**1B. Edge/Relationship Announcement for System Design Canvas**

The `SimulationAnnouncer` announces "Connection created: Load Balancer to API Gateway" -- good for creation events. But there is no way for a screen reader user to query existing relationships. The `NodeListPanel` shows a "Conns" count but not what those connections are or what they mean.

**Recommendation (must-have, effort M):** Add an "Edges" tab to the `NodeListPanel` that lists each connection with source, target, edge type (HTTP/gRPC/WebSocket), latency, throughput, and error rate. Each row should be keyboard-navigable and announce like:

"API Gateway to User Service, HTTP, 45 milliseconds latency, 1200 requests per second, 0.3 percent error rate"

**WCAG:** 1.3.1 Info and Relationships (A)

---

**1C. UML Class Diagram Navigation Pattern**

The `ScreenReaderView` is well-built but passive -- it is a read-only rendering. A screen reader user cannot interact with it (select a class, view its relationships in context, or navigate from a class to its related classes).

**Recommendation (should-have, effort M):** Make the `ScreenReaderView` interactive:
- Each class item should be focusable (`tabIndex={0}`)
- Pressing Enter on a class should expand inline its relationships
- Arrow keys should cycle between classes
- A "Navigate to related class" action should be available (e.g., when on `Subject`, pressing a key jumps to `Observer` if there is a relationship)

This turns the `ScreenReaderView` from a description into a navigation tool. Pattern: ARIA Treegrid (https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/).

**WCAG:** 2.1.1 Keyboard (A), 2.4.3 Focus Order (A)

---

### 2. KEYBOARD NAVIGATION

**2A. Skip Links Are Incomplete**

The `SkipLink` component at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/SkipLink.tsx` only targets `#main-content` and `#navigation`. For a three-panel IDE layout with canvas, this misses the most important targets.

**Recommendation (must-have, effort S):**
```typescript
const SKIP_TARGETS: SkipTarget[] = [
  { label: "Skip to main content", target: "#main-content" },
  { label: "Skip to navigation", target: "#navigation" },
  { label: "Skip to canvas", target: "#canvas-area" },
  { label: "Skip to properties panel", target: "#properties-panel" },
  { label: "Skip to bottom panel", target: "#bottom-panel" },
  { label: "Skip to accessible node list", target: "#node-list-panel" },
];
```

Each target ID needs to actually exist on the corresponding DOM elements. I found that the `SkipLink` is only mounted in `page.tsx` and `database-mode-app.tsx`. Every module workspace needs it.

**WCAG:** 2.4.1 Bypass Blocks (A)
**Priority:** Critical, effort S

---

**2B. Canvas Keyboard Controls**

The `KeyboardShortcutSheet` documents playback controls (Space, arrows), speed (1-4), and view (V, S, F). But there are no documented shortcuts for:
- Moving between canvas nodes (arrow keys when canvas is focused)
- Selecting a node (Enter)
- Opening node context menu (Shift+F10 or context menu key)
- Creating a connection between selected nodes
- Mode switching (Cmd+1 for Learn, Cmd+2 for Simulate, etc.)

**Recommendation (must-have, effort M):** Implement arrow-key node navigation when the canvas has focus:
- Arrow keys: move focus to the nearest node in that direction (spatial navigation)
- Tab: move to next node in document order
- Enter: select focused node, open properties
- Delete: delete focused node (with confirmation)
- Escape: deselect, return focus to canvas container
- Cmd/Ctrl + 1-7: switch between modes

This requires a focus management system on top of React Flow. The pattern: maintain a `focusedNodeId` state. When the canvas div receives focus, highlight the first/last-focused node. Arrow keys change `focusedNodeId` by finding the nearest node in the pressed direction. React Flow's `fitView` can be used to ensure the focused node is visible.

**WCAG:** 2.1.1 Keyboard (A), 2.1.2 No Keyboard Trap (A)
**Priority:** Critical, effort M

---

**2C. Quiz Keyboard Interaction**

Quiz mode needs keyboard shortcuts for answer selection. Without examining the quiz component directly, the standard pattern is:
- A/B/C/D keys or 1/2/3/4 for option selection
- Enter to confirm
- Space should not submit (prevents accidental submission while scrolling)
- Tab to move between options, Enter to select
- Focus must move to feedback after submission

**WCAG:** 2.1.1 Keyboard (A)
**Priority:** High, effort S

---

### 3. COLOR ACCESSIBILITY

**3A. What Is Already Strong**

The colorblind palette at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/colorblind-palette.ts` is genuinely well-done. IBM Design's 8-color palette covers protanopia, deuteranopia, and tritanopia. The override map covers node types, simulation states, visualization sequential scales, latency percentiles, and chart colors. This is more thorough than most production apps.

The high contrast mode at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/high-contrast.ts` targets AAA (7:1) with pure black backgrounds, pure white text, and bright yellow focus rings. Good.

The color contrast test utilities have full coverage including `suggestAccessibleColor` which auto-adjusts colors to meet targets.

**3B. What Is Missing: Non-Color Alternatives**

The colorblind toggle swaps colors but does not add non-color distinguishers. WCAG 1.4.1 Use of Color (A) requires that color is NOT the sole means of conveying information.

Current violations:
- Difficulty indicators (easy/medium/hard/expert) in `globals.css` use only color (teal/amber/orange/red)
- Node state indicators in `BaseNode.tsx` use only a colored dot
- Edge type colors in `ParticleLayer.tsx` (`EDGE_TYPE_COLORS`) are color-only

**Recommendation (must-have, effort M):**

For difficulty: Add icons alongside colors.
- Easy: checkmark icon + "Easy" text label
- Medium: equals icon + "Medium" text label
- Hard: exclamation icon + "Hard" text label
- Expert: skull/star icon + "Expert" text label

For node states: The state dot already has `aria-label={`State: ${data.state || 'idle'}`}` which is good for screen readers. For sighted colorblind users, add a shape distinction:
- Idle: empty circle
- Active: filled circle
- Success: checkmark inside circle
- Warning: exclamation triangle
- Error: X inside circle
- Processing: rotating spinner (respects reduced motion)

For edge types: Add dash patterns alongside colors. HTTP = solid, gRPC = dashed, WebSocket = dotted, message-queue = dash-dot. This is a standard cartographic technique that works for all CVD types.

**WCAG:** 1.4.1 Use of Color (A)
**Priority:** High, effort M

---

**3C. Focus Indicators**

I found `focus-visible:ring-2 focus-visible:ring-primary` used in some components but not consistently. The `A11yToolbar` close button at the `KeyboardShortcutSheet` has `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary` -- good. But across 91 matches of `focus-visible`/`focus:ring` patterns in only 20 files, with hundreds of interactive elements across the codebase, coverage is incomplete.

**Recommendation (must-have, effort S):** Add a global focus-visible style in `globals.css`:
```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

/* Override for components that use ring instead */
[data-focus-ring="custom"]:focus-visible {
  outline: none;
}
```

This ensures every interactive element gets a visible focus indicator by default. Components that need custom focus styling opt out explicitly.

**WCAG:** 2.4.7 Focus Visible (AA), 2.4.11 Focus Not Obscured (AA -- WCAG 2.2)
**Priority:** Critical, effort S

---

### 4. SCREEN READER EXPERIENCE PER MODE

**4A. Learn Mode**
Current: No mode-specific announcements found beyond `SimulationAnnouncer`.
Needed:
- Lesson progress announcements ("Step 3 of 8: Load Balancing")
- Diagram highlights should be announced ("Highlighting: API Gateway node")
- Interactive checkpoints should announce completion ("Checkpoint completed: Added database node")

**Recommendation (should-have, effort M):** Create a `LessonAnnouncer` component similar to `SimulationAnnouncer` that subscribes to lesson state and announces progress, highlights, and checkpoint completions.

**WCAG:** 4.1.3 Status Messages (AA)

---

**4B. Simulate Mode**
Current: `SimulationAnnouncer` handles this well -- status changes, metrics every 5 seconds, canvas mutations. This is the best-covered mode.
Gap: Chaos events are not announced. The `chaosShake` animation is visual-only.

**Recommendation (should-have, effort S):** Add chaos event announcements to `SimulationAnnouncer`: "Chaos event: API Gateway node experiencing high latency" or "Chaos event: Database node crashed."

---

**4C. Practice Mode**
Needed:
- Timer announcements (at intervals: "5 minutes remaining", "1 minute remaining", "Time's up")
- Checklist item completion announcements
- Canvas state summary on request (how many nodes placed, connections made)

**Recommendation (should-have, effort M):** Timers should use `aria-live="assertive"` for critical warnings (1 minute remaining, time's up) and `aria-live="polite"` for periodic updates.

**WCAG:** 4.1.3 Status Messages (AA)

---

**4D. Quiz Mode**
Needed:
- Question text is read when quiz loads (auto-focus on question)
- Options are radio buttons or radio group (not just styled divs)
- Correct/wrong feedback is announced immediately
- Score summary after quiz completion

**Recommendation (must-have, effort M):** Use `role="radiogroup"` for options with `role="radio"` on each. After submission, move focus to the feedback element with `aria-live="assertive"`.

**WCAG:** 4.1.2 Name, Role, Value (A), 4.1.3 Status Messages (AA)

---

**4E. Assessment Mode**
Needed:
- Score per dimension read aloud ("Scalability: 85 percent. Reliability: 72 percent.")
- Overall grade announced
- Chart/radar visualization needs text alternative

**Recommendation (should-have, effort S):** Add `aria-label` to each score display and a summary `role="status"` region.

---

**4F. Review/Flashcard Mode**
Needed:
- "Front of card" and "Back of card" landmarks
- Reveal action announced ("Card revealed")
- Rating buttons (Again/Hard/Good/Easy) as a clear button group with labels

**Recommendation (should-have, effort S):** Use `role="group"` with `aria-label="Rate your recall"` on the rating buttons.

---

**4G. AI Chat Mode**
Needed:
- Chat messages should be in an `aria-live="polite"` region
- "AI is typing" indicator announced
- Canvas changes triggered by AI should be announced (already handled by `SimulationAnnouncer` for node/edge mutations)

**Recommendation (should-have, effort S):** Wrap the chat message list in `role="log"` with `aria-live="polite"`.

---

### 5. REDUCED MOTION

**What is already excellent:**
- `ReducedMotionProvider` respects OS setting and has toolbar override
- `MotionProvider` bridges to motion library's `MotionConfig`
- `ParticleLayer` checks `prefers-reduced-motion` before starting animation loop
- Motion design system documents reduced-motion fallback for every animation category
- `reducedMotion` config object in `motion.ts` defines: instant transitions, static particles, no confetti/glow, no infinite pulses

**What needs attention:**

**5A. CSS Animations Not Covered by Motion Library**

The `BaseNode` injects raw CSS keyframes at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/nodes/system-design/BaseNode.tsx` (lines 110-124): `node-error-pulse`, `node-warning-glow`, `node-processing-spin`. These are applied via inline `animation` property and are NOT gated by the motion provider.

**Recommendation (must-have, effort S):** Add a `prefers-reduced-motion` media query to the injected keyframes:
```css
@media (prefers-reduced-motion: reduce) {
  @keyframes node-error-pulse { 0%, 100% { box-shadow: 0 0 0 3px hsla(0, 72%, 51%, 0.3); } }
  @keyframes node-warning-glow { 0%, 100% { box-shadow: 0 0 4px 1px hsla(38, 92%, 50%, 0.3); } }
  @keyframes node-processing-spin { 0%, 100% { box-shadow: 0 0 4px 1px hsla(271, 81%, 56%, 0.3); } }
}
```

Or better: check `prefersReducedMotion` from the hook (already called in `BaseNode`) and set `animation: none` in the style object when true. The code already has `const prefersReducedMotion = useReducedMotion()` at line 243 and uses it for `motionAnimate`/`motionTransition`, but the inline CSS `animation` property in `stateGlow` at line 405 is NOT conditioned on it.

**WCAG:** 2.3.3 Animation from Interactions (AAA), but practically essential for vestibular disorder users
**Priority:** High, effort S

---

**5B. Particle System Graceful Degradation**

The `ParticleLayer` completely disables when reduced motion is active (line 381). The `reducedMotion.particles` config in `motion.ts` defines a static alternative: dots at fixed intervals. But the static alternative is not actually implemented -- the layer just returns empty.

**Recommendation (nice-to-have, effort M):** When reduced motion is active, render static dots along each edge path at 40px intervals (as defined in `reducedMotion.particles.intervalPx`). This preserves the data-flow visualization without motion. Render once, do not animate.

---

**5C. Spring Physics**

Already handled. The `reducedMotion.instantTransition` replaces all springs with `{ type: 'tween', duration: 0 }`. The `MotionConfig reducedMotion="always"` prop globally disables springs.

---

### 6. COGNITIVE ACCESSIBILITY

**6A. Consistent Navigation Across 13 Modules**

The `WorkspaceLayout` at `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/workspace-layout.tsx` enforces a consistent three-panel layout with `ActivityBar`, `StatusBar`, and `Breadcrumb`. This is good -- the spatial structure is consistent.

**Gap:** Each module likely has different sidebar content, different bottom panel content, and different canvas content. The question is whether the navigation patterns within those panels are consistent (same keyboard shortcuts, same interaction patterns).

**Recommendation (should-have, effort M):** Document and enforce a "Module Interaction Contract" -- every module must:
1. Support the same keyboard shortcuts for mode switching
2. Have a sidebar with the same keyboard behavior (Tab to enter, Escape to exit)
3. Have a canvas with the same node selection/navigation behavior
4. Show breadcrumbs with the same hierarchy structure

**WCAG:** 3.2.3 Consistent Navigation (AA), 3.2.4 Consistent Identification (AA)

---

**6B. Error Messages**

Not audited in depth, but the global error boundary at `/Users/anshullkgarg/Desktop/system_design/architex/src/app/error.tsx` exists. The critical pattern: every error must explain what happened AND what the user can do about it. "Something went wrong" is not sufficient. "Your design could not be saved because the server is unreachable. Your work is saved locally and will sync when connectivity returns." is the target.

**WCAG:** 3.3.1 Error Identification (A), 3.3.3 Error Suggestion (AA)
**Priority:** High, effort M

---

**6C. Timed Activities**

Practice mode has timers. Assessment mode likely has time limits.

**Recommendation (must-have, effort S):**
- All timed activities must have a pause button
- Users must be able to extend time (WCAG 2.2.1 requires at least 1 extension of at least 10x the default)
- Timer state must be communicated to screen readers (see 4C above)

**WCAG:** 2.2.1 Timing Adjustable (A)
**Priority:** Critical for timed modes

---

### 7. INTERNATIONALIZATION (i18n)

**7A. Current State**

The `strings.ts` file at `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/i18n/strings.ts` is a solid foundation. 285 strings extracted across common, landing, dashboard, modules, settings, pricing, canvas, notFound, nodeStates, and edgeTypes sections. Fully typed with `StringSection` and `StringKey` types.

However: the file header explicitly states "Components are NOT yet wired to consume these." This means every component still has hardcoded English strings.

**7B. Language Strategy Recommendation**

Given Architex is a technical engineering learning platform where:
- Code samples are always English (variable names, function names, comments)
- System design terminology is predominantly English (load balancer, message queue, database)
- The primary audience is engineers preparing for interviews (predominantly English-language interviews)

**Recommendation:** English-first with optional i18n later.

Phase 1 (now, effort S): Wire existing `strings.ts` to components. This is not about translation -- it is about centralized string management, which makes future translation possible without refactoring. Use a simple `t('section.key')` function:

```typescript
// /src/lib/i18n/t.ts
import { strings, type StringSection, type StringKey } from './strings';

export function t<S extends StringSection>(section: S, key: StringKey<S>): string {
  return strings[section][key] as string;
}
```

Phase 2 (future, if needed): Add `next-intl` or `react-i18next` with locale detection. Wrap `t()` to pull from locale-specific string files.

Phase 3 (if RTL demand exists): RTL support requires:
- `dir="rtl"` on `<html>` tag
- Logical CSS properties (`margin-inline-start` instead of `margin-left`)
- Tailwind's `rtl:` variant
- Mirror all layout assumptions (sidebar on right, text alignment flipped)

This is a significant effort (L) and should only be done if usage data shows demand from Arabic/Hebrew speakers.

**7C. What Should NEVER Be Translated**
- Code samples and code output
- Technical terms used as labels in diagrams (class names, method names, API endpoints)
- System design component names on the canvas
- CLI commands and configuration

**7D. What Should Be Translatable**
- All UI chrome (buttons, labels, headings, tooltips, error messages)
- Tutorial and lesson prose
- Quiz questions and answers (though technical content may stay English)
- Tooltips and help text

**7E. Date/Time and Number Formatting**

**Recommendation (should-have, effort S):** Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for all user-facing dates and numbers:
```typescript
// Latency display
new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(latencyMs)
// "1,234.5" in en-US, "1.234,5" in de-DE

// Date display
new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
// "Apr 16, 2026" in en-US, "16 Apr 2026" in en-GB
```

The `formatMetric` function in `BaseNode.tsx` (line 202) currently hardcodes `K` and `M` suffixes. These should use `Intl.NumberFormat` with `notation: 'compact'`.

**WCAG:** Not directly a WCAG requirement, but 3.1.1 Language of Page (A) requires `lang` attribute on `<html>`.
**Priority:** Medium for Intl formatting, Low for full i18n

---

### 8. INCLUSIVE DESIGN

**8A. Dyslexia-Friendly Font**

**Recommendation (nice-to-have, effort S):** Add OpenDyslexic toggle in settings. Load the font conditionally:
```css
.dyslexia-mode {
  --font-sans: 'OpenDyslexic', sans-serif;
  --font-mono: 'OpenDyslexic Mono', monospace;
  letter-spacing: 0.05em;
  line-height: 1.8;
}
```

Research: British Dyslexia Association recommends 12-14pt minimum, 1.5x line spacing, and left-aligned (never justified) text. OpenDyslexic is not universally preferred by dyslexic readers (some prefer standard sans-serif fonts like Verdana), so offer it as an option, not a requirement.

**WCAG:** Not a specific WCAG requirement, but supports 1.4.12 Text Spacing (AA)
**Priority:** Nice-to-have

---

**8B. Text Scaling / Browser Zoom**

**Recommendation (must-have, effort M):** Test all layouts at 200% browser zoom (WCAG 1.4.4 Resize Text). The resizable panel layout (`react-resizable-panels`) should handle this, but:
- Check that text does not overflow containers
- Check that touch targets remain >= 44px at 200% zoom
- Check that the mobile layout triggers at appropriate breakpoints when zoomed

Common failure: fixed-width containers that clip text at zoom. Tailwind's responsive utilities help, but hardcoded `w-[420px]` values (like in `KeyboardShortcutSheet.tsx` line 129) will break.

**WCAG:** 1.4.4 Resize Text (AA), 1.4.10 Reflow (AA)
**Priority:** High

---

**8C. Windows High Contrast Mode**

The high-contrast CSS overrides in `high-contrast.ts` are application-level. Windows High Contrast Mode (forced-colors) is OS-level and overrides all colors.

**Recommendation (should-have, effort S):**
```css
@media (forced-colors: active) {
  /* Ensure custom components work in forced-colors mode */
  .node-state-indicator {
    forced-color-adjust: none; /* Preserve our state indicators */
  }
  
  /* Buttons and interactive elements should use system colors */
  button, [role="button"] {
    forced-color-adjust: auto;
  }
}
```

**WCAG:** 1.4.11 Non-text Contrast (AA)

---

### IMPLEMENTATION PRIORITY MATRIX

**Critical (Fix First) -- Blocks WCAG A compliance:**

| Item | Description | Effort | WCAG |
|------|-------------|--------|------|
| 1A | Canvas `role="application"` + aria-label on React Flow wrapper | S | 1.1.1 A |
| 2A | Extend SkipLink to 6 targets (canvas, properties, bottom, node list) | S | 2.4.1 A |
| 2B | Arrow-key node navigation in canvas | M | 2.1.1 A |
| 3C | Global `focus-visible` style in globals.css | S | 2.4.7 AA |
| 6C | Timer pause/extend for Practice and Assessment modes | S | 2.2.1 A |

**High (Fix Soon) -- Blocks WCAG AA or major UX impact:**

| Item | Description | Effort | WCAG |
|------|-------------|--------|------|
| 1B | Edges tab in NodeListPanel for relationship awareness | M | 1.3.1 A |
| 3B | Non-color alternatives for difficulty, node state, edge type | M | 1.4.1 A |
| 4D | Quiz mode radio group semantics + feedback announcements | M | 4.1.2 A |
| 5A | Gate CSS keyframe animations on reduced motion | S | 2.3.3 AAA |
| 8B | Test and fix 200% browser zoom reflow | M | 1.4.4 AA |
| 6B | Actionable error messages across all modules | M | 3.3.1 A |

**Medium (Should Have) -- Enhances experience significantly:**

| Item | Description | Effort | WCAG |
|------|-------------|--------|------|
| 1C | Interactive ScreenReaderView with keyboard navigation | M | 2.1.1 A |
| 4A | LessonAnnouncer for Learn mode | M | 4.1.3 AA |
| 4B | Chaos event announcements in SimulationAnnouncer | S | 4.1.3 AA |
| 4C | Timer announcements for Practice mode | M | 4.1.3 AA |
| 4G | Chat `role="log"` for AI mode | S | 4.1.3 AA |
| 6A | Module Interaction Contract (consistent keyboard/nav) | M | 3.2.3 AA |
| 7B-Phase1 | Wire strings.ts to components | M | 3.1.1 A |
| 8C | Windows forced-colors media query | S | 1.4.11 AA |

**Low (Nice to Have) -- AAA or future:**

| Item | Description | Effort | WCAG |
|------|-------------|--------|------|
| 5B | Static particle dots under reduced motion | M | 2.3.3 AAA |
| 7B-Phase2 | Full i18n framework integration | L | -- |
| 7B-Phase3 | RTL language support | L | -- |
| 7E | Intl.NumberFormat / DateTimeFormat for locale-aware formatting | S | -- |
| 8A | OpenDyslexic font toggle | S | 1.4.12 AA |
| 4E | Assessment score aria-labels | S | 4.1.3 AA |
| 4F | Flashcard landmarks and rating group labels | S | -- |

---

### THE ONE BIG WIN

If you do only one thing: **add `role="application"` with a descriptive `aria-label` to every canvas wrapper, and extend `SkipLink` to include a "Skip to accessible node list" target that jumps to the `NodeListPanel`.** Combined effort: Small. Impact: transforms the platform from "canvas is a black hole for screen readers" to "screen reader users have a clear alternative path." The `NodeListPanel` already exists and works. The `ScreenReaderView` already exists for LLD. The wiring is 90% done -- it just needs the signpost.

### KEY FILES REFERENCED

- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/SkipLink.tsx` -- needs additional targets
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/SimulationAnnouncer.tsx` -- excellent, extend for chaos events
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/modules/lld/panels/ScreenReaderView.tsx` -- pattern to replicate for all modules
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/A11yToolbar.tsx` -- well-built, no changes needed
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/NodeListPanel.tsx` -- needs edges tab
- `/Users/anshullkgarg/Desktop/system_design/architex/src/providers/ReducedMotionProvider.tsx` -- solid, no changes needed
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/nodes/system-design/BaseNode.tsx` -- CSS animations not gated on reduced motion (lines 405-406)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/overlays/ParticleLayer.tsx` -- correctly disabled under reduced motion
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/motion.ts` -- comprehensive motion system with documented fallbacks
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/colorblind-palette.ts` -- IBM palette, well-implemented
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/high-contrast.ts` -- AAA-targeted overrides
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/a11y/touch-targets.ts` -- 44px enforcement utilities
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/i18n/strings.ts` -- extracted but not wired
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/globals.css` -- theme tokens, difficulty colors need non-color alternatives
- `/Users/anshullkgarg/Desktop/system_design/architex/.github/workflows/lighthouse-ci.yml` -- 0.95 accessibility gate on PRs