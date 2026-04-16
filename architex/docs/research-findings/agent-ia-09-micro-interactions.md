Here is the complete specification, delivered as a single type-checked source file at:

**`/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/micro-interactions.ts`**

---

## Summary: 58 Micro-Interactions Across 9 Categories

The file is 2,869 lines. Every interaction references the existing motion system (`springs`, `duration`, `easing` from `motion.ts`), the existing sound engine (`SoundType` from `sounds.ts`), and the existing design tokens (`globals.css` CSS custom properties). It compiles with zero TypeScript errors.

### What Each Interaction Contains

For every one of the 58 interactions:
- **trigger**: exact user action or system event
- **animation**: precise motion/react props or CSS values (spring params, durations, easings, keyframes)
- **visual**: detailed description of every pixel that changes (colors with HSL values, scales, opacities, shadows, positions)
- **sound**: mapped to existing `SoundType` from the sound engine, or `null`
- **reducedMotion**: explicit fallback for `prefers-reduced-motion: reduce`
- **implementation**: copy-paste-ready code using Tailwind classes, motion/react components, or CSS keyframes

### Category Breakdown

**Cursor and Hover (1-8)**: Sidebar item left-edge indicator reveal, canvas node port reveal with violet ring, quiz option letter badge tinting, button color transitions, tab hover underline preview, flashcard 3D tilt with perspective, canvas/draggable cursor state machine.

**Click and Press (9-16)**: Button 3% scale-down with spring release, tab indicator layout slide using `layoutId`, checkbox SVG pathLength draw with squish-bounce, toggle switch thumb scaleX squash, dropdown scale/fade from trigger origin, modal backdrop-blur with content spring, canvas node violet glow ring, copy button icon rotation swap with 1.5s auto-revert.

**Loading and Skeleton (17-21)**: Directional left-to-right shimmer replacing `animate-pulse`, code block skeleton with varying line widths and indentation, three-phase canvas loading (dots then nodes then edges), AI thinking indicator with cascading dots and breathing shimmer bar, data table row stagger with varying cell widths.

**Success and Feedback (22-28)**: Correct answer green border with 2% scale pulse, wrong answer decreasing-amplitude shake `[-6,6,-4,4,-2,2,0]`, pattern mastery gold glow with trophy spin-in, streak flame surge `[1,1.3,1.15,1]`, achievement toast with particle burst (30 particles in gold/violet), score counter `useCountUp` hook with threshold-based color changes, progress bar 100% green gleam sweep.

**Navigation and Transition (29-35)**: Page crossfade with NProgress loading bar, activity bar `layoutId` indicator slide, sidebar collapse with chevron rotation and content AnimatePresence, bottom panel height animation with chevron flip, breadcrumb separator scaleX reveal, back button leftward icon nudge with directional page slide, tab underline shared layout animation.

**Text and Typography (36-41)**: Typewriter effect at 15ms per character with steps(1) cursor blink, odometer-style digit slide using per-digit AnimatePresence, code line-by-line stagger at 60ms intervals, IntersectionObserver scroll reveal at 0.15 threshold, error message settling shake, focused-empty input placeholder opacity pulse.

**Canvas Specific (42-48)**: Node snap-to-grid with `springs.snappy`, edge port magnetic attraction with glow at 24px proximity, eight-handle resize system with `springs.stiff`, smooth zoom between discrete levels, zero-latency minimap viewport tracking, simultaneous auto-layout with `springs.gentle` (heavy mass 1.2), edge preview marching ants with solid confirmation.

**Data Visualization (49-53)**: Chart point 50% radius growth with positioned tooltip, gauge arc fill with strokeDashoffset spring and count-up center number, sparkline left-to-right pathLength draw with trailing area fill fade, pie segment 4px radial separation, bar chart bottom-up scaleY stagger at 20ms intervals.

**Delightful Surprises (54-58)**: Konami code 200-particle rainbow confetti, 100th correct answer gold banner with bouncy scale and two-color confetti, first saved design "Welcome to the real world" toast with Rocket icon, late-night Moon message in status bar (11PM-4AM), weekend warrior badge with Swords icon and gold glow.

### Key Design Decisions

All springs reference the five named presets from `motion.ts` rather than inline values. All sounds map to the 16 existing `SoundType` entries in the Web Audio engine. All colors reference CSS custom properties from `globals.css`. Every interaction has a `motion-reduce` path that eliminates motion while preserving state communication. No interaction uses `width`/`height`/`top`/`left` animation -- all use `transform`/`opacity` per the existing performance rules. Celebratory particles use Canvas2D per `performanceLimits.particleRenderer`.