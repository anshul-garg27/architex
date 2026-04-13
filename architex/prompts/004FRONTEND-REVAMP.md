# FRONTEND REVAMP EXECUTION — {{MODULE_NAME}}

> You are a **senior frontend engineer** implementing a UI redesign.
> You have the UI Vision doc, the UI Spec, and optionally Stitch mockups.
> Your job is to IMPLEMENT the design with pixel-perfect accuracy.
>
> This prompt is for IMPLEMENTATION, not design. The design decisions are already made.

---

## YOUR ROLE

You implement the UI redesign. You:
1. Read the UI Vision and UI Spec documents
2. Read the current code
3. Implement changes in order (layout → components → animation → polish)
4. Test every change visually in the browser
5. Ensure no functionality is broken

---

## INPUTS (read these first)

```
1. UI Vision:  docs/design/{{MODULE_SLUG}}-ui-vision.md  (or the vision from the session)
2. UI Spec:    docs/design/{{MODULE_SLUG}}-ui-spec.md     (if generated)
3. Stitch:     docs/design/{{MODULE_SLUG}}-stitch-prompts.md (if available)
4. Current:    src/components/modules/{{MODULE_SLUG}}/
```

---

## TECH STACK (memorize)

```
Framework:     Next.js 16, TypeScript strict, Tailwind CSS v4
Animation:     motion (Framer Motion successor) — use spring physics, not duration-based
UI Components: shadcn/ui + Radix — prefer these over custom components
Icons:         Lucide React — use existing icons, don't add new packages
Canvas:        @xyflow/react v12 (if the module uses React Flow)
State:         Zustand v5 — NEVER use object selectors
Fonts:         Geist Sans (variable) + Geist Mono (variable)
Colors:        CSS custom properties from globals.css — NEVER hardcode colors
```

---

## CRITICAL RULES

R1. **Use CSS variables** — NEVER hardcode colors. Use `var(--foreground)`, `var(--primary)`, etc.
R2. **Use Tailwind** — NEVER write inline styles except for dynamic values (positions, sizes).
R3. **Use motion** — NEVER use CSS transitions for complex animations. Use `<motion.div>`.
R4. **Use spring physics** — `spring({ damping: 25, stiffness: 300 })` not `{ duration: 0.3 }`.
R5. **Respect reduced motion** — Always check `useReducedMotion()` and provide fallbacks.
R6. **Mobile first** — Design for mobile, enhance for desktop. Use `useIsMobile()` hook.
R7. **Keyboard accessible** — Every interactive element must be keyboard-navigable.
R8. **No layout shift** — Reserve space for dynamic content. Use min-height, aspect-ratio.
R9. **Zustand selectors** — NEVER `(s) => ({x: s.x})`. Always primitive selectors.
R10. **Test in browser** — Start dev server, check every change visually. Don't assume it works.

---

## IMPLEMENTATION ORDER

### Wave 1: Structure & Layout (do first)
```
□ Update panel widths/heights
□ Restructure sidebar sections
□ Update canvas layout
□ Update properties panel layout
□ Update bottom panel tabs
□ Verify responsive breakpoints
```

### Wave 2: Components & Interactions
```
□ Restyle buttons (states: default, hover, active, focus, disabled)
□ Restyle dropdowns/selectors
□ Restyle input fields
□ Update card/badge/chip styles
□ Add hover states to all interactive elements
□ Add focus-visible rings
```

### Wave 3: Animation & Motion
```
□ Add entrance animations (panel slides, content fades)
□ Add interaction animations (button press, dropdown open)
□ Add operation-specific animations (algorithm steps, simulation events)
□ Add celebration moments (completion, milestone)
□ Add error/warning animations
□ Implement sound toggle (if in vision doc)
```

### Wave 4: Polish & Edge Cases
```
□ Empty states (no data selected)
□ Loading states (skeletons, spinners)
□ Error states (graceful degradation)
□ Tooltips on all icon buttons
□ Keyboard navigation complete
□ Screen reader tested
□ Dark + light mode both work
□ Mobile layout tested
```

---

## PER-COMPONENT IMPLEMENTATION PATTERN

For each component you modify:

```tsx
// 1. Read the current implementation
// 2. Read the spec for this component
// 3. Implement the new design

// ALWAYS use motion for animations:
import { motion, useReducedMotion } from "motion/react";

// ALWAYS use CSS variables:
<div className="bg-[var(--elevated)] border border-[var(--border)] rounded-lg" />

// ALWAYS handle reduced motion:
const prefersReduced = useReducedMotion();
const animate = prefersReduced ? {} : { scale: [1, 0.97, 1] };

// ALWAYS add keyboard support:
<button
  onClick={handleClick}
  onKeyDown={(e) => e.key === "Enter" && handleClick()}
  role="button"
  tabIndex={0}
  aria-label="Descriptive label"
/>

// ALWAYS use spring physics for animations:
<motion.div
  animate={{ y: 0, opacity: 1 }}
  transition={{ type: "spring", damping: 25, stiffness: 300 }}
/>
```

---

## VERIFICATION

After each wave, verify:

```bash
# Type check
cd architex && npx tsc --noEmit 2>&1 | grep -v node_modules | tail -5

# Dev server running
pnpm dev

# Visual check in browser:
# - Dark mode looks correct
# - Light mode looks correct  
# - Mobile (375px) looks correct
# - All interactions work
# - No console errors
# - No layout shift
# - Keyboard navigation works
```

---

## OUTPUT

After implementation, create a summary:

```
REVAMP SUMMARY — {{MODULE_NAME}}
═══════════════════════════════════

FILES MODIFIED: N
  - src/components/modules/{{MODULE_SLUG}}/Component1.tsx (layout restructured)
  - src/components/modules/{{MODULE_SLUG}}/Component2.tsx (animation added)
  ...

VISUAL CHANGES:
  - Sidebar: [what changed]
  - Canvas: [what changed]
  - Properties: [what changed]
  - Animations: [what's new]

TESTED:
  □ Dark mode ✓
  □ Light mode ✓
  □ Mobile 375px ✓
  □ Keyboard nav ✓
  □ All interactions ✓
  □ No console errors ✓
```
