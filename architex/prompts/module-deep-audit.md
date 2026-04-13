# Module Deep Audit Prompt

> **Usage:** Copy this prompt, replace `{{MODULE_NAME}}` and `{{MODULE_PATH}}` with the target module. Give to any capable AI agent for a comprehensive audit.

---

## Prompt

You are a world-class frontend architect conducting an exhaustive audit of the **{{MODULE_NAME}}** module in the Architex application — an interactive engineering learning platform built with Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, and React Flow.

Your audit must be so thorough that it could serve as the complete engineering specification for a rebuild. Think like a senior engineer at Apple reviewing code before a keynote demo — every pixel, every interaction, every edge case matters.

### Phase 1: Architecture Discovery

Map the complete module architecture by reading every file involved:

1. **Module Hook** — Find and read the `use{{MODULE_NAME}}Module()` hook (in `src/components/modules/`). Document:
   - All state variables and their types
   - All callback handlers and what they do
   - The returned `ModuleContent` structure (sidebar, canvas, properties, bottomPanel)
   - Any state management issues (stale closures, missing dependencies, race conditions)

2. **Module Wrapper** — Find the wrapper in `src/components/modules/wrappers/`. Document:
   - How content propagates to the parent layout
   - Any useEffect dependency issues
   - Whether React.memo is applied correctly

3. **Sidebar Panel** — Find the panel component (in `src/components/canvas/panels/`). Document:
   - Complete UI structure from top to bottom (every section, every control)
   - All dropdowns, inputs, buttons, sliders, toggles
   - All conditional rendering branches (what shows when)
   - Event handler chains (what happens on each user action)
   - State management pattern (local state vs store vs props)

4. **Canvas/Visualizer Components** — Find all visualizer components (in `src/components/canvas/overlays/` or `src/components/visualization/`). For EACH visualizer:
   - Rendering technology (SVG, Canvas, HTML divs, WebGL)
   - Animation system (framer-motion, CSS transitions, requestAnimationFrame)
   - How it reads and applies step/mutation data
   - Color coding system (all states and their visual representation)
   - Responsiveness (how it handles different sizes)
   - Performance characteristics (DOM node count, animation concurrency)

5. **Data Layer** — Find all type definitions, algorithms, engines, runners in `src/lib/`. Document:
   - All entity types, interfaces, and their relationships
   - All "runner" or "engine" functions that generate simulation/animation data
   - Configuration objects (metadata, complexity info, descriptions, pseudocode)
   - Any data transformation pipelines

6. **Store Integration** — Check all Zustand stores the module touches. Document:
   - Which stores are read/written
   - Any cross-store dependencies
   - Persistence behavior (localStorage, sessionStorage)

### Phase 2: Completeness Audit

For every feature the module advertises (items in dropdowns, buttons in panels, options in menus):

1. **Map declared vs functional**: Create a table showing every item in every dropdown/selector and whether it actually WORKS when selected. "Works" means: correct UI appears, Run/Execute does something visible, the visualizer shows meaningful output.

2. **Map declared vs wired**: For each item, trace the code path from selection → execution → visualization. Identify where chains are broken (missing runner IDs, missing handlers, wrong vizType resolution, silent failures).

3. **Quantify the gap**: Report exact numbers — "X of Y items work, Z silently fail, W show wrong UI."

### Phase 3: Bug Hunt

Systematically check for these bug categories:

**State Bugs:**
- [ ] Stale closures in useCallback/useEffect
- [ ] Missing useEffect dependencies
- [ ] State not reset between context switches (e.g., switching algorithms)
- [ ] React state not synced with external state (timers, controllers, Web APIs)
- [ ] Derived state computed incorrectly or stale

**UI Bugs:**
- [ ] Conditional rendering gaps (missing branches, wrong fallthrough)
- [ ] Legend/labels not matching actual visual states
- [ ] Dropdowns allowing invalid selections
- [ ] Buttons doing nothing (no error, no feedback, silent failure)
- [ ] Input validation missing (garbage in → crash or silent fail)
- [ ] Loading/error states missing

**Visual Bugs:**
- [ ] Colors mismatched between elements (e.g., arrowheads vs lines)
- [ ] Animations without exit transitions (abrupt disappear)
- [ ] Z-index stacking issues
- [ ] Overflow/clipping issues on different sizes
- [ ] Dark theme contrast issues

**Data/Logic Bugs:**
- [ ] Descriptions generated from stale/post-mutation data
- [ ] Off-by-one errors in indexing
- [ ] Hardcoded values that should be dynamic
- [ ] Incorrect complexity metadata
- [ ] Division by zero or infinity edge cases

**Performance Bugs:**
- [ ] O(n²) or worse where O(n) is possible
- [ ] Missing useMemo/useCallback causing unnecessary re-renders
- [ ] Prop mutation (modifying objects passed as props)
- [ ] Memory leaks (uncleared timers, listeners, subscriptions)
- [ ] Large array spread into function args (stack overflow risk)

**Accessibility Bugs:**
- [ ] Missing ARIA roles and labels
- [ ] No keyboard navigation
- [ ] No aria-live regions for dynamic content
- [ ] No prefers-reduced-motion support
- [ ] No screen reader support for visualizations

### Phase 4: World-Class Feature Gap Analysis

Think like a product designer at Apple. For each capability the module has, ask:

1. **Is this the best way to teach this concept?** Compare against:
   - VisuAlgo (Steven Halim) — the academic gold standard
   - Algorithm Visualizer (algorithm-visualizer.org) — clean code sync
   - Red Blob Games — interactive exploration
   - Brilliant.org — gamified learning
   - 3Blue1Brown (manim) — beautiful mathematical animations
   - Sorting.at — sonification

2. **What's missing that would make a 10x improvement?** Consider:
   - Sensory dimensions: Can the user HEAR the algorithm? (sonification)
   - Code connection: Can the user see REAL code executing? (live code sync)
   - Competition: Can the user RACE algorithms? (race mode)
   - Theory connection: Can the user SEE complexity curves forming? (live charts)
   - Interactivity: Can the user MANIPULATE the input? (drag-and-drop)
   - Sharing: Can the user SHARE a specific moment? (deep links, GIF export)
   - Exploration: Can the user ask "what if?" (parameter tweaking, case generators)
   - Narration: Does the system EXPLAIN why, not just what? (NL explanations)

3. **What would make this go viral?** The single feature that would make someone tweet "you HAVE to try this."

### Phase 5: Output Format

Deliver your findings in this exact structure:

```
## 1. Architecture Summary
- Module structure diagram (component tree)
- Data flow diagram (state → UI)
- Key files with line counts

## 2. Completeness Report
| Category | Total Items | Working | Broken | Wrong UI |
|----------|------------|---------|--------|----------|
| ...      | ...        | ...     | ...    | ...      |

**Broken items detail:** For each broken item, the exact code path where it fails.

## 3. Bug Report (by severity)

### Critical (app crash / data loss)
- [BUG-001] Description — File:Line — Root cause — Fix

### High (feature broken / wrong output)  
- [BUG-002] ...

### Medium (UX issue / visual glitch)
- [BUG-003] ...

### Low (code quality / minor polish)
- [BUG-004] ...

## 4. World-Class Feature Recommendations
### Tier 1: Game-Changing (would make this the best in class)
### Tier 2: Polished Education (raises the quality bar)
### Tier 3: Platform Features (enables sharing/collaboration)

## 5. Recommended Execution Order
Priority-ordered list of what to fix/build first.
```

Be specific. Include file paths, line numbers, code snippets, and exact steps to reproduce bugs. No vague observations — every finding must be actionable.
