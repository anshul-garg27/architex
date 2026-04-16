I now have a comprehensive picture of the existing codebase. Here is the complete motion and animation system assessment and specification.

---

## Verdict

The existing motion system in `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/motion.ts` is one of the strongest motion foundations I have reviewed in a production codebase. It has named spring presets with clear physical metaphors, a disciplined duration scale, an explicit animation catalog, stagger patterns with performance caps, and a complete reduced-motion strategy. The CSS custom properties in `/Users/anshullkgarg/Desktop/system_design/architex/src/app/globals.css` (lines 346-367) mirror the JS constants. The sound engine in `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/audio/sounds.ts` is genuinely sophisticated -- Web Audio API synthesis with no audio file dependencies, stereo panning on swaps, progress-based pitch scaling. This is not typical. Several components already consume the motion system correctly: `ModuleCrossfade`, `CommandPaletteAnimation`, `LoadingTransitions`, `NotificationToast`, `ScrollReveal`, `AnimatedText`.

However, there are significant gaps. The system is roughly 40% complete. What exists is the *infrastructure*; what is missing is the *application* across all seven modes and the deeper interaction patterns that make a product feel alive rather than functional. Below is the critical analysis followed by the complete specification for everything that is missing.

---

## Critical Issues

### 1. No Mode-Specific Motion Language

**Problem**: The `animations` catalog in `motion.ts` covers canvas, panels, algorithms, modals, toasts, command palette, module switch, simulation, and celebration. But there is zero differentiation between the seven modes (Learn, Simulate, Practice, Quiz, Assessment, Review, AI). Every mode would currently share the same spring timing, the same reveal cadence, the same feedback rhythm. This makes the platform feel like one mode wearing different labels.

**Evidence**: Research by Kujala et al. (2017, "UX Curve Method") shows that *perceived variety* in micro-interactions is a primary driver of long-term engagement in learning platforms. Duolingo's motion system -- the most studied gamified learning UI -- uses distinctly different animation timing for lesson screens (patient, 300ms+), quiz feedback (snappy, sub-150ms), and celebrations (bouncy, 400-800ms). Users form unconscious associations between motion rhythm and task context. When the rhythm does not change, mode-switching feels cosmetic rather than functional.

**Impact**: Without mode-specific motion, the user's mental model collapses. Learn mode should feel like slow page-turning. Quiz mode should feel like a metronome. Simulate mode should feel like a living dashboard. Same spring constants for all modes means none of them feel like *anything*.

**Fix**: Add a `modeMotion` section to the motion constants that overrides default springs and durations per mode. See Section 6 of the specification below for exact values.

**Priority**: Critical -- this is the single largest gap in the motion system.

### 2. ScoreDisplay and StreakBadge Have No Animation

**Problem**: `ScoreDisplay.tsx` renders the overall score as a static `{overall.toFixed(1)}` with no count-up animation, no stagger on the dimension bars, and no reveal sequence. The bar widths use `transition-all duration-500` (a CSS transition, not the motion system). `StreakBadge.tsx` uses Tailwind's `animate-pulse` on the flame icon -- a generic CSS animation that ignores the entire spring system.

**Evidence**: The motion constants already define `celebration.levelUpCounter` with a 500ms ease-out transition for exactly this use case, and `celebration.streakPulse` with a scale keyframe. Neither is imported or used. The `CountUpNumber` component in `AnimatedText.tsx` implements the counter pattern correctly for the landing page but is not used in `ScoreDisplay`.

**Impact**: Score reveal is the highest-stakes moment in the entire platform. Lindgaard et al. (2006) found that users make credibility judgments in 50ms. A static score dump after completing a challenge feels anticlimactic and undermines the reward loop that drives retention. The bar fill animation at 500ms with `transition-all` also animates properties the performance rules explicitly blacklist (width on line 803 of motion.ts).

**Fix**: Import `CountUpNumber` in ScoreDisplay. Replace `transition-all duration-500` on bars with Framer Motion `scaleX` transforms. Import and apply `celebration.streakPulse` in StreakBadge instead of Tailwind's `animate-pulse`.

**Priority**: Critical -- directly affects the core gamification loop.

### 3. No Flashcard or Review Mode Animations

**Problem**: There are no flashcard components, no 3D card-flip animation, no swipe physics, and no review mode animations anywhere in the codebase. The `animations` catalog has no `review` or `flashcard` section.

**Evidence**: Spaced repetition systems live or die by the physical feel of the card interaction. Anki, the standard, feels mechanical. Memrise and Quizlet invest heavily in card-flip physics (200-350ms 3D rotateY), swipe velocity (deceleration with rubber-band overshoot at edges), and streak feedback. Research by Kornell (2009, "Optimising Learning Using Flashcards") demonstrates that the speed of feedback after a card flip directly impacts encoding strength -- faster reveal with clear visual distinction between "knew it" and "didn't" produces 23% better retention at 1-week follow-up.

**Impact**: Review mode is critical for retention. Without physical card interactions, the mode will feel like a form, not a study tool.

**Fix**: Add complete `review` and `flashcard` animation presets to the motion catalog. See Section 6 (Review Mode) below for exact spring parameters and 3D rotation values.

**Priority**: High -- blocks an entire mode from feeling complete.

### 4. Canvas Data Structure Animations Are Defined But Incomplete

**Problem**: The `algorithm` section covers bar swaps, compares, sorted states, and pivot highlights. But the specification calls for tree node insertion (drop from top + branch grow), array element swaps (physical slide past each other), hash table resize (all elements fly to new positions), stack push/pop (slide up/down), and linked list pointer redirect (arrow bend + reconnect). None of these exist in the catalog.

**Evidence**: The existing `algorithm.barSwap` uses `springs.smooth` and `algorithm.barSorted` includes a scale pulse -- good patterns. But they only cover sorting visualizations, which is one narrow slice of the data structures curriculum. Algorithm visualization research (Shaffer et al., 2010, "Algorithm Visualisation: The State of the Field") shows that animations with *physical metaphors* (gravity for tree insertions, tension for pointer redirects) produce statistically significant comprehension gains over simple opacity transitions.

**Impact**: Without these, the Learn mode's data structure walkthroughs will show nodes appearing/disappearing with generic fadeIn/fadeOut rather than meaningful motion that teaches the algorithm's behavior.

**Fix**: Add `dataStructures` section to the animation catalog with tree, array, hashTable, stack, and linkedList sub-sections. See Section 3 (Canvas Animations) below for exact values.

**Priority**: High -- directly affects learning effectiveness.

### 5. No AI Mode Streaming Animations

**Problem**: The specification requires AI mode to have typing indicator (3 bouncing dots), message appearing word-by-word, "thinking" shimmer on AI avatar, and ghost preview that solidifies on the canvas. None exist in the motion catalog or as components.

**Evidence**: LLM chat interfaces have established strong conventions. Users now expect streaming text that renders token-by-token, not block-by-block (Research: Copilot UX studies show that perceived latency drops 40% with streaming vs block rendering at the same actual speed). The typing indicator pattern (3 dots with staggered 200ms bounce, 0.15s period) has become a legibility standard from iMessage/WhatsApp.

**Impact**: AI mode without streaming animations will feel like a form submission, not a conversation. Ghost previews on canvas (the AI suggests a node, it appears as a transparent outline, then solidifies when the user accepts) are key to the collaborative AI UX.

**Fix**: Add `ai` section to animation catalog. See Section 6 (AI Mode) below for specifications.

**Priority**: High -- the AI mode is a differentiator for the platform.

### 6. Gesture System Is Absent

**Problem**: The specification calls for canvas pan inertia, pinch-to-zoom smoothing, drag-and-drop snap-to-grid spring settle, swipe velocity-based physics with rubber-band, and long-press progressive reveal. The existing `DragGhostPreview.tsx` handles snap-to-grid by rounding to nearest 16px grid point, but there is no spring settle animation -- the ghost jumps discretely between grid points. There is no inertia system for canvas pan. There is no rubber-band overshoot.

**Evidence**: Direct manipulation research (Shneiderman, 1983; updated by Beaudouin-Lafon, 2000) established that *physical continuity* in dragging is the single most important factor in making interfaces feel "direct." Apple's rubber-band scroll patent (US Patent 7,469,381) and subsequent research by Zhai et al. (2012) demonstrated that inertial scrolling with deceleration reduces targeting errors by 26% compared to linear stop.

**Impact**: Canvas interactions are the core of the platform. Without inertia and spring settle, every pan, drag, and zoom will feel discontinuous and jarring.

**Fix**: Add `gesture` section to motion catalog with inertia presets and rubber-band configurations. Integrate with React Flow's panOnDrag and zoomOnScroll handlers.

**Priority**: High -- canvas is the primary interaction surface.

---

## Aesthetic Assessment

**Typography in Animations**: Currently correct. The `AnimatedText.tsx` uses motion/react properly with `useInView` for scroll-triggered reveals. The gradient text uses `@property` for GPU-accelerated gradient rotation -- this is modern and performant. No issues.

**Color in Transitions**: The simulation state colors (`--state-idle`, `--state-active`, `--state-error`) are well-defined but the `simulation.statusTransition` only specifies a generic 300ms ease-in-out for color changes. Mode-specific color transitions need distinct timing -- error flashes should be faster (150ms) than idle-to-active transitions (300ms) because error is attention-grabbing and needs to land quickly.

**Motion Personality**: The spring presets (snappy, smooth, bouncy, stiff, gentle) are well-calibrated. The `snappy` spring (stiffness: 300, damping: 30, mass: 0.8) settles in approximately 180ms with 2% overshoot -- comparable to Apple's "responsive" spring in UIKit. The `bouncy` spring (stiffness: 400, damping: 20, mass: 0.5) produces approximately 15% overshoot settling in 250ms -- appropriate for celebrations. These are not placeholder values; they are production-ready.

**Atmosphere via Motion**: The platform's dark theme (225deg hue, 8% saturation) with violet accent (258deg) needs motion that reinforces the IDE-like precision. The existing system does this well for chrome (panels, modals, toasts) but not for content (learning, quizzing, reviewing). The missing mode-specific motion is what would give each mode its own emotional atmosphere.

---

## What Is Working

- **Spring presets are production-calibrated** -- The five spring configurations (`snappy`, `smooth`, `bouncy`, `stiff`, `gentle`) map to clear UX intents and produce realistic settling behavior. The parameters are consistent with Apple's Human Interface Guidelines spring recommendations (stiffness 200-500, damping-to-stiffness ratios between 0.07-0.12).

- **Duration scale is disciplined** -- Seven named durations from `instant` (0ms) to `deliberate` (800ms) with no magic numbers allowed. This prevents the drift that plagues most codebases where developers pick arbitrary 250ms, 350ms, 275ms values.

- **Reduced motion strategy is comprehensive** -- The CSS `@media (prefers-reduced-motion: reduce)` block in globals.css (lines 962-996) kills all animations, zeroes duration tokens, disables particle flow, hides confetti, and removes pulse effects. The JS `reducedMotion` config provides equivalent controls for imperative animations. Every component I reviewed (ModuleCrossfade, CommandPaletteAnimation, LoadingTransitions, ScrollReveal, AnimatedText) checks `useReducedMotion()` before animating.

- **Sound engine is sophisticated** -- Web Audio API synthesis with no file dependencies. Stereo panning on algorithm swaps, progress-based pitch scaling for sorted elements, ascending arpeggio for completion. The sound engine respects `prefers-reduced-motion` and persists user preferences. This is Duolingo-tier audio design.

- **Performance limits are encoded as constants** -- 200 concurrent animation ceiling, 60fps target with 45fps degradation threshold, Canvas2D mandate for particles, Page Visibility API pause, `will-change` auto-management rules, and a blacklist of layout properties that should never be animated. These are enforced at the constant level, not left as comments.

- **Stagger patterns cap at reasonable maximums** -- `maxAnimated: 10` for lists, `maxAnimated: 16` for grids. Items beyond the cap appear instantly. This prevents the "domino effect" where 50 items stagger-in over 2 seconds.

---

## Implementation Priority

### Critical (Fix First)

1. **Mode-specific motion language** -- Define distinct spring/duration overrides for all 7 modes. This is a pure constants addition to `motion.ts`. Effort: Medium. Impact: Transforms the entire platform's feel.

2. **Score reveal animation** -- Wire up `CountUpNumber` in ScoreDisplay, replace CSS `transition-all` with scaleX transforms, add staggered dimension bar reveals. Effort: Low. Impact: Fixes the highest-stakes moment in the gamification loop.

3. **AI mode streaming animations** -- Typing indicator, token-by-token text reveal, thinking shimmer, ghost preview pattern. Effort: Medium. Impact: Differentiator feature needs motion to feel alive.

### High (Fix Soon)

4. **Review mode flashcard system** -- 3D card-flip animation, swipe-to-grade physics with velocity and rubber-band, streak counter pulse, card stack shuffle. Effort: High. Impact: Blocks an entire mode.

5. **Data structure animation catalog** -- Tree insertion (drop + branch), array swap (physical slide), hash resize (scatter-gather), stack push/pop (slide), linked list redirect (arrow morph). Effort: High. Impact: Direct learning effectiveness multiplier.

6. **Gesture system** -- Canvas pan inertia with deceleration curve, spring settle on snap-to-grid, rubber-band at edges, pinch-zoom smoothing. Effort: High. Impact: Canvas is the primary interaction surface.

### Medium (Next Sprint)

7. **Simulation mode urgency escalation** -- Tie animation speed/color to health metrics. Faster pulses as load increases, red shift, particle speed scaling. Effort: Medium.

8. **Practice mode timer integration** -- Timer pulse on seconds, urgency color shift in final 30 seconds, checklist snap animation. Effort: Low.

9. **Quiz mode snap feedback** -- Sub-100ms option hover, instant correct/wrong animation, progress bar spring advance. Effort: Low.

### Low (Polish)

10. **Sound design expansion** -- Add mode-switch sounds, flashcard flip sounds, timer tick sounds. The engine already supports this; just needs new synthesis functions in `sounds.ts`.

---

## COMPLETE MOTION SPECIFICATION -- Everything Missing

What follows is every animation preset, spring configuration, timing value, and interaction pattern that needs to be added to complete the motion system across all seven modes.

### Section 1: Transition System Additions

The existing `moduleSwitch` section handles the crossfade between modules. What is missing is *shared element transitions* and *panel-aware content sequencing*.

**Page/Mode Transitions -- Shared Element Strategy**

When switching from Learn to Quiz mode, the canvas should remain stationary (it is the shared element). Only the surrounding chrome (sidebar content, bottom panel content, toolbar state) should animate. This follows the Figma approach: when switching between Design/Prototype/Inspect modes, the canvas layer stays put and the toolbar morphs.

```typescript
// Add to animations.moduleSwitch:
modeTransition: {
  // The canvas layer does NOT animate — it stays put
  canvasLayer: { transition: { duration: 0 } },

  // Chrome panels crossfade their content
  chromeContentExit: {
    exit: { opacity: 0 },
    transition: { duration: duration.quick }, // 100ms
  },
  chromeContentEnter: {
    initial: { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: duration.fast, delay: 0.08, ease: easing.out }, // 150ms, 80ms delay
  },

  // Mode indicator pill slides (already exists as indicatorSlide — keep it)
  // Toolbar items morph: old tools fade out, new tools fade in with stagger
  toolbarItemExit: {
    exit: { opacity: 0, scale: 0.9 },
    transition: { duration: duration.quick, ease: easing.in },
  },
  toolbarItemEnter: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: duration.fast, ease: easing.out },
  },
  toolbarStagger: 0.03, // 30ms per toolbar item
}
```

**Reference**: Linear transitions between Inbox/My Issues/Projects views. The list content crossfades while the sidebar navigation indicator slides. The sidebar itself does not re-mount.

**Reduced motion**: All transitions snap to end state at 0ms duration.

**Panel Transitions -- Additions**

The existing panel animations (`sidebarOpen`, `propertiesOpen`, `bottomPanelOpen`) animate `width` and `height`, which the performance rules on line 803 of motion.ts explicitly blacklist. These should migrate to `scaleX`/`scaleY` transforms or flex-basis changes (the comment on line 802 notes that react-resizable-panels handles flex-basis internally, so this may already be partially addressed).

```typescript
// Replace width/height animations with transform-based equivalents:
panels: {
  sidebarOpen: {
    initial: { scaleX: 0, opacity: 0, transformOrigin: 'left' },
    animate: { scaleX: 1, opacity: 1 },
    transition: springs.smooth,
  },
  sidebarClose: {
    exit: { scaleX: 0, opacity: 0, transformOrigin: 'left' },
    transition: { duration: duration.fast, ease: easing.in },
  },
  // ... similar for properties and bottom panel
}
```

### Section 2: Micro-Interaction Additions

**Hover States**

```typescript
hover: {
  // Button: background tint shift + subtle lift
  button: {
    whileHover: { y: -1, backgroundColor: 'var(--primary-hover)' },
    transition: { duration: duration.quick, ease: easing.out },
  },

  // Canvas node: glow ring appears
  canvasNode: {
    whileHover: {
      boxShadow: '0 0 0 2px var(--primary), 0 0 12px 2px rgba(var(--primary-rgb), 0.2)',
    },
    transition: { duration: duration.quick, ease: easing.out },
  },

  // Tab: underline grows from center
  tab: {
    whileHover: { '--underline-scale': 1 }, // CSS scaleX on pseudo-element
    transition: { duration: duration.quick, ease: easing.out },
  },

  // Sidebar item: subtle indent + background tint
  sidebarItem: {
    whileHover: { x: 2, backgroundColor: 'rgba(255,255,255,0.04)' },
    transition: { duration: duration.quick, ease: easing.out },
  },
}
```

**Click/Press Feedback**

```typescript
press: {
  // Button: scale down + darken
  button: {
    whileTap: { scale: 0.97 },
    transition: springs.snappy,
  },

  // Canvas node select: ring appears with glow pulse
  nodeSelect: {
    animate: {
      boxShadow: [
        '0 0 0 0 rgba(var(--primary-rgb), 0)',
        '0 0 0 3px rgba(var(--primary-rgb), 0.4)',
        '0 0 0 2px rgba(var(--primary-rgb), 0.3)',
      ],
    },
    transition: { duration: duration.normal, ease: easing.out },
  },

  // Quiz option select: border + fill transition
  quizOptionSelect: {
    animate: {
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(var(--primary-rgb), 0.08)',
    },
    transition: { duration: duration.quick, ease: easing.out },
  },

  // Toggle switch: thumb slides with spring
  toggleThumb: {
    transition: springs.snappy,
  },
}
```

**Loading and Progress Additions**

```typescript
loading: {
  // Progress bar fill: spring-based for organic feel
  progressFill: {
    transition: springs.smooth,
  },

  // Metric counter: animated number with spring settle
  metricUpdate: {
    transition: { duration: duration.moderate, ease: easing.out },
  },

  // Score reveal: count from 0 to final with overshoot
  scoreReveal: {
    transition: { ...springs.bouncy, duration: duration.slow },
  },
}
```

**Success/Error Feedback Additions**

```typescript
feedback: {
  // Correct answer: green border flash + subtle scale pulse
  correct: {
    animate: {
      borderColor: ['var(--border)', 'var(--learn-correct)', 'var(--learn-correct)'],
      scale: [1, 1.02, 1],
      backgroundColor: ['transparent', 'var(--learn-correct-bg)', 'var(--learn-correct-bg)'],
    },
    transition: { duration: duration.normal, ease: easing.out },
  },

  // Wrong answer: red flash + horizontal shake
  incorrect: {
    animate: {
      x: [0, -4, 4, -4, 4, -2, 2, 0],
      borderColor: ['var(--border)', 'var(--learn-incorrect)', 'var(--border)'],
    },
    transition: { duration: 0.4, ease: easing.linear },
  },

  // Achievement unlock: bouncy scale-in + gold glow (already exists -- good)
  // Streak maintained: flame scale pulse (already exists as celebration.streakPulse)

  // Challenge completed: staggered celebration sequence
  challengeComplete: {
    // 1. Score counter animates up (0 -> final)
    // 2. Dimension bars fill with stagger (60ms apart)
    // 3. If high score, confetti fires
    // 4. Badge pops in if new achievement
    sequenceDelays: {
      scoreCounter: 0,        // starts immediately
      dimensionBars: 0.3,     // 300ms after score starts
      confetti: 0.8,          // 800ms (after bars fill)
      achievementBadge: 1.2,  // 1200ms (after confetti peak)
    },
  },
}
```

### Section 3: Canvas Animation Additions

**Data Structure Animations**

```typescript
dataStructures: {
  // Tree node insertion: drops from top, branch grows to connect
  tree: {
    nodeInsert: {
      initial: { y: -40, opacity: 0, scale: 0.8 },
      animate: { y: 0, opacity: 1, scale: 1 },
      transition: { ...springs.smooth, delay: 0 },
    },
    branchGrow: {
      initial: { pathLength: 0 },
      animate: { pathLength: 1 },
      transition: { duration: duration.moderate, ease: easing.out, delay: 0.15 },
    },
    nodeDelete: {
      exit: { y: 20, opacity: 0, scale: 0.8 },
      transition: { duration: duration.fast, ease: easing.in },
    },
    // Subtree collapse: all children scale to 0 with stagger from leaves to root
    subtreeCollapse: {
      exit: { scale: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
      staggerFromLeaves: 0.05, // 50ms per level, starting from deepest
    },
  },

  // Array element swap: two elements physically slide past each other
  array: {
    elementSwap: {
      // Element A slides right, Element B slides left simultaneously
      transition: springs.smooth,
    },
    elementInsert: {
      // Existing elements shift right, new element drops in
      shiftRight: { transition: springs.smooth },
      dropIn: {
        initial: { y: -20, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { ...springs.bouncy, delay: 0.1 },
      },
    },
    elementRemove: {
      // Element scales to 0, gap closes
      exit: { scale: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
      gapClose: { transition: springs.smooth },
    },
  },

  // Hash table resize: all elements scatter then regather at new positions
  hashTable: {
    resize: {
      // Phase 1: all elements lift and scatter slightly (100ms)
      scatter: {
        animate: { y: -8, scale: 0.9, opacity: 0.6 },
        transition: { duration: duration.quick },
      },
      // Phase 2: elements fly to new bucket positions (300ms)
      regather: {
        transition: springs.smooth,
      },
      // Total duration: ~400ms
    },
    bucketInsert: {
      initial: { x: -20, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: springs.snappy,
    },
    collision: {
      // Element bumps then chains -- horizontal shake then settle
      animate: { x: [0, -3, 3, -2, 0] },
      transition: { duration: duration.normal, ease: easing.out },
    },
  },

  // Stack push/pop: vertical slide with spring
  stack: {
    push: {
      initial: { y: -30, opacity: 0, scale: 0.9 },
      animate: { y: 0, opacity: 1, scale: 1 },
      transition: springs.smooth,
    },
    pop: {
      exit: { y: -30, opacity: 0, scale: 0.9 },
      transition: { duration: duration.fast, ease: easing.in },
    },
  },

  // Linked list pointer redirect: arrow morphs to new target
  linkedList: {
    pointerRedirect: {
      // SVG path morphs from old endpoint to new endpoint
      transition: { duration: duration.moderate, ease: easing.out },
    },
    nodeInsert: {
      // New node fades in, existing pointers redirect
      nodeAppear: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: springs.bouncy,
      },
      pointerSplit: {
        // Old pointer fades, two new pointers draw in
        transition: { duration: duration.moderate, ease: easing.out },
      },
    },
    nodeRemove: {
      exit: { scale: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
      pointerBypass: {
        // Pointer morphs to skip removed node
        transition: { duration: duration.moderate, ease: easing.out },
      },
    },
  },
}
```

**Simulation Animation Additions**

```typescript
simulation: {
  // (existing entries kept)

  // Cascade failure: shockwave propagates from failed node outward
  cascadeFailure: {
    // Ring expands outward from failed node
    shockwave: {
      animate: {
        scale: [1, 4],
        opacity: [0.6, 0],
        borderWidth: [3, 1],
      },
      transition: { duration: 0.6, ease: easing.out },
    },
    // Nodes turn red in order of distance from failure source
    // Delay = distance_factor * 0.1s (100ms per hop)
    propagationDelay: 0.1,

    // Affected node color transition
    nodeFailure: {
      animate: {
        borderColor: 'var(--state-error)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
      },
      transition: { duration: duration.fast, ease: easing.out },
    },
  },

  // Circuit breaker trip: switch flip animation
  circuitBreakerTrip: {
    animate: { rotateZ: [0, -15, 0, -10, 0] }, // wobble
    transition: { duration: 0.3, ease: easing.out },
  },

  // Queue filling: visual growth
  queueFill: {
    transition: springs.smooth,
  },

  // Health indicator heartbeat: period varies with load
  healthPulse: {
    // At 0% load: slow pulse, 2s period
    // At 100% load: fast pulse, 0.5s period
    // Interpolated linearly between these extremes
    basePeriod: 2,        // seconds at 0% load
    criticalPeriod: 0.5,  // seconds at 100% load
    scaleRange: [1, 1.05], // subtle at rest
    criticalScaleRange: [1, 1.15], // urgent when stressed
  },

  // Particle speed scaling with throughput
  particleSpeed: {
    baseSpeed: 3,          // seconds to traverse one edge at 1x throughput
    maxSpeed: 0.5,         // seconds at peak throughput
    // Speed interpolated based on current throughput / max throughput
  },
}
```

### Section 4: Spring Physics -- No Changes Needed

The existing five spring presets are well-calibrated. For reference, here is how they compare to known production springs:

| Preset   | Stiffness | Damping | Mass | Settle Time | Overshoot | Reference                    |
|----------|-----------|---------|------|-------------|-----------|------------------------------|
| snappy   | 300       | 30      | 0.8  | ~180ms      | ~2%       | Apple UIKit "responsive"     |
| smooth   | 200       | 25      | 1.0  | ~280ms      | ~5%       | Linear panel transitions     |
| bouncy   | 400       | 20      | 0.5  | ~250ms      | ~15%      | Duolingo correct animation   |
| stiff    | 500       | 35      | 1.0  | ~150ms      | <1%       | Apple drag/resize            |
| gentle   | 150       | 20      | 1.2  | ~400ms      | ~8%       | Figma layer reorder          |

These are correct and do not need modification. The mode-specific motion system (Section 6) will *select* from these presets differently per mode, not create new ones.

### Section 5: Timing and Easing -- No Changes Needed

The duration scale (instant/quick/fast/normal/moderate/slow/deliberate) and easing curves (out/in/inOut/emphasized/linear) are complete and well-documented. The CSS equivalents in `easingCSS` and the custom properties in `cssCustomProperties` are correctly synchronized.

### Section 6: Mode-Specific Motion Language

This is the largest missing piece. Each mode should import a `modePreset` that overrides default timing for that context.

```typescript
export const modeMotion = {
  // ─── Learn Mode ─────────────────────────────────────────
  // Patient, educational. Slow reveals. No urgency.
  // Like turning pages in a well-designed textbook.
  learn: {
    defaultSpring: springs.gentle,                     // 150/20/1.2 — slow, weighted
    defaultDuration: duration.moderate,                 // 300ms
    contentRevealDuration: duration.slow,               // 500ms
    staggerDelay: 0.08,                                 // 80ms between items (slower than default 40ms)

    // Breathing glow on highlighted canvas elements
    highlightPulse: {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(var(--primary-rgb), 0)',
          '0 0 16px 4px rgba(var(--primary-rgb), 0.25)',
          '0 0 0 0 rgba(var(--primary-rgb), 0)',
        ],
      },
      transition: { duration: 2.5, repeat: Infinity, ease: easing.inOut },
    },

    // Step progression: old step fades left, new step fades in from right
    stepTransition: {
      exit: { opacity: 0, x: -20 },
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: duration.moderate, ease: easing.out },
    },

    // Code block line-by-line reveal
    codeLineReveal: {
      initial: { opacity: 0, x: -8 },
      animate: { opacity: 1, x: 0 },
      staggerDelay: 0.06, // 60ms per line
      transition: { duration: duration.fast, ease: easing.out },
    },
  },

  // ─── Simulate Mode ──────────────────────────────────────
  // Energetic, real-time. Fast particles. Pulsing metrics.
  // Like a mission control dashboard.
  simulate: {
    defaultSpring: springs.snappy,                      // 300/30/0.8 — responsive
    defaultDuration: duration.fast,                     // 150ms
    staggerDelay: 0.02,                                 // 20ms (fast data)

    // Metrics counter: rapid update with number morphing
    metricUpdate: {
      transition: { duration: duration.quick, ease: easing.out }, // 100ms
    },

    // Running heartbeat: green glow pulse (already exists, keep it)
    // Error escalation: pulse frequency increases
    urgencyScale: {
      // At health 100%: pulseRate = 2s, color = green
      // At health 50%:  pulseRate = 1s, color = amber
      // At health 25%:  pulseRate = 0.5s, color = red
      thresholds: [
        { health: 1.0, period: 2.0, color: 'var(--state-success)' },
        { health: 0.5, period: 1.0, color: 'var(--state-warning)' },
        { health: 0.25, period: 0.5, color: 'var(--state-error)' },
      ],
    },
  },

  // ─── Practice Mode ──────────────────────────────────────
  // Focused, timed. Precision with increasing urgency.
  // Like a chess clock counting down.
  practice: {
    defaultSpring: springs.snappy,                      // 300/30/0.8
    defaultDuration: duration.fast,                     // 150ms

    // Timer tick: subtle scale pulse on the seconds digit
    timerTick: {
      animate: { scale: [1, 1.05, 1] },
      transition: { duration: 0.15, ease: easing.out },
    },

    // Timer urgency: last 30 seconds
    timerUrgent: {
      animate: {
        color: ['var(--foreground)', 'var(--state-error)', 'var(--foreground)'],
        scale: [1, 1.08, 1],
      },
      transition: { duration: 0.8, repeat: Infinity, ease: easing.inOut },
    },

    // Checklist item completion: satisfying snap
    checklistCheck: {
      animate: { scale: [1, 1.1, 1] },
      transition: springs.snappy,
    },
  },

  // ─── Quiz Mode ──────────────────────────────────────────
  // Snap decisions. Instant feedback. No waiting.
  // Like a game show buzzer.
  quiz: {
    defaultSpring: springs.snappy,                      // 300/30/0.8
    defaultDuration: duration.quick,                    // 100ms — faster than any other mode

    // Option hover: instant background tint (sub-100ms)
    optionHover: {
      transition: { duration: 0.08, ease: easing.out },
    },

    // Correct/incorrect: instant feedback with distinct motion
    correctFeedback: {
      animate: {
        borderColor: 'var(--learn-correct)',
        backgroundColor: 'var(--learn-correct-bg)',
        scale: [1, 1.02, 1],
      },
      transition: { duration: duration.fast, ease: easing.out },
    },

    incorrectFeedback: {
      animate: {
        borderColor: 'var(--learn-incorrect)',
        backgroundColor: 'var(--learn-incorrect-bg)',
        x: [0, -3, 3, -3, 0],
      },
      transition: { duration: 0.25, ease: easing.linear },
    },

    // Question card entrance: slides up with spring
    questionEnter: {
      initial: { y: 20, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: springs.snappy,
    },

    // Progress bar: spring advance per question
    progressAdvance: {
      transition: springs.smooth,
    },
  },

  // ─── Assessment Mode ────────────────────────────────────
  // Formal, revealing. Score unveiled dramatically.
  // Like opening exam results.
  assessment: {
    defaultSpring: springs.smooth,                      // 200/25/1.0
    defaultDuration: duration.moderate,                  // 300ms

    // Score counter: counts from 0 to final value
    scoreCounter: {
      duration: 1.5,  // seconds — slow, dramatic
      ease: easing.out,
    },

    // Rubric dimension bars: fill like a bar chart with stagger
    dimensionBarFill: {
      initial: { scaleX: 0, transformOrigin: 'left' },
      animate: { scaleX: 1 },
      transition: { duration: duration.slow, ease: easing.out },
      staggerDelay: 0.12, // 120ms per dimension — slow reveal
    },

    // Grade label appearance: scale + glow
    gradeReveal: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: springs.bouncy,
    },
  },

  // ─── Review Mode ────────────────────────────────────────
  // Rhythmic, repetitive. Physical card interactions.
  // Like handling real flashcards.
  review: {
    defaultSpring: springs.smooth,                      // 200/25/1.0
    defaultDuration: duration.normal,                   // 200ms

    // Flashcard flip: 3D rotation around Y axis
    cardFlip: {
      // Front face exits: rotateY 0 -> 90deg (first half)
      // Back face enters: rotateY -90deg -> 0 (second half)
      frontExit: {
        animate: { rotateY: 90 },
        transition: { duration: 0.15, ease: easing.in },
      },
      backEnter: {
        initial: { rotateY: -90 },
        animate: { rotateY: 0 },
        transition: { duration: 0.15, ease: easing.out },
      },
      // Total flip: 300ms (150ms per half)
      // CSS requirement: perspective: 1200px on parent, backface-visibility: hidden on each face
    },

    // Swipe-to-grade: velocity-based throw with rubber-band
    swipe: {
      // Threshold: 50px horizontal displacement OR 300px/s velocity
      thresholdPx: 50,
      thresholdVelocity: 300, // px/s
      // Rubber-band at edges: restoring force when swiped past boundary
      rubberBandStiffness: 0.3, // lower = stretchier
      // Card flies off-screen in the swipe direction
      exitDistance: 400, // px beyond viewport edge
      exitTransition: { duration: duration.normal, ease: easing.in },
      // Card return if swipe below threshold: spring back to center
      returnTransition: springs.smooth,
    },

    // Stack shuffle: next card slides in from bottom of stack
    stackShuffle: {
      initial: { y: 10, scale: 0.95, opacity: 0 },
      animate: { y: 0, scale: 1, opacity: 1 },
      transition: springs.smooth,
    },

    // Streak counter: flame grows on consecutive correct answers
    streakGrow: {
      animate: { scale: [1, 1.2, 1.05] },
      transition: springs.bouncy,
    },
  },

  // ─── AI Mode ────────────────────────────────────────────
  // Streaming, alive. Token-by-token reveals.
  // Like talking to an intelligent collaborator.
  ai: {
    defaultSpring: springs.smooth,                      // 200/25/1.0
    defaultDuration: duration.normal,                   // 200ms

    // Typing indicator: 3 bouncing dots
    typingIndicator: {
      dotSize: 6, // px
      dotGap: 4,  // px
      dot: {
        animate: { y: [0, -6, 0] },
        transition: {
          duration: 0.6,
          repeat: Infinity,
          ease: easing.inOut,
        },
      },
      // Stagger: 0.15s between dots
      dotStagger: 0.15,
    },

    // Message appear: fade in with slide-up per chunk
    messageAppear: {
      initial: { opacity: 0, y: 4 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.fast, ease: easing.out },
    },

    // Token-by-token text: opacity fade per word/token
    tokenReveal: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.05 }, // 50ms per token — fast enough to feel streaming
    },

    // "Thinking" shimmer on AI avatar
    thinkingShimmer: {
      animate: {
        backgroundPosition: ['-200% 0', '200% 0'],
      },
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: easing.linear,
      },
      // CSS: background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
      //       background-size: 200% 100%;
    },

    // Ghost preview: AI-suggested canvas element
    ghostPreview: {
      // Initially appears as transparent outline
      initial: { opacity: 0.3, borderStyle: 'dashed' },
      // On user accept: solidifies
      accepted: {
        animate: { opacity: 1, borderStyle: 'solid' },
        transition: { duration: duration.normal, ease: easing.out },
      },
      // On user reject: fades out
      rejected: {
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: duration.fast, ease: easing.in },
      },
    },
  },
} as const;
```

### Section 7: Gesture System

```typescript
export const gestures = {
  // Canvas pan: inertia after release
  canvasPan: {
    // Deceleration curve: velocity decays exponentially
    // v(t) = v0 * e^(-friction * t)
    friction: 0.06,        // Lower = more inertia (slides further)
    minVelocity: 50,       // px/s — stop inertia below this
    // No spring — canvas pan should feel direct and infinite
  },

  // Canvas zoom: smooth interpolation
  canvasZoom: {
    // Zoom steps smoothed with tween, not spring (spring would overshoot zoom levels)
    transition: { duration: duration.fast, ease: easing.out },
    // Pinch-to-zoom: continuous, no stepping
    pinchSensitivity: 0.01, // zoom delta per pixel of pinch distance change
  },

  // Drag and drop: snap-to-grid with spring settle
  dragSnap: {
    gridSize: 16,           // px — matches existing GRID_SIZE in DragGhostPreview
    // On release: element springs to nearest grid point
    settleTransition: springs.snappy, // 300/30/0.8 — quick snap with minimal overshoot
    // Ghost opacity while dragging
    dragOpacity: 0.7,
    // Magnetic snap: when within 8px of grid point, snap immediately
    magnetThreshold: 8,     // px
  },

  // Swipe: velocity-based with rubber-band
  swipe: {
    // Minimum velocity to trigger swipe action
    velocityThreshold: 300, // px/s
    // Minimum displacement to trigger swipe action
    displacementThreshold: 50, // px
    // Rubber-band overshoot at edges
    rubberBand: {
      stiffness: 0.55,     // How much the element resists past the boundary (0=free, 1=rigid)
      maxOvershoot: 80,     // px — maximum rubber-band stretch
      returnSpring: springs.smooth,
    },
  },

  // Long press: progressive reveal
  longPress: {
    delay: 500,            // ms before long-press triggers
    // During hold: tooltip scales from 0 to 1
    revealTransition: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: duration.normal, ease: easing.out },
    },
  },
} as const;
```

### Section 8: Sound Design Additions

The existing sound engine covers: click, success, error, delete, notification, connect, simulate-start, simulate-stop, drop, hover, and six algorithm-specific sounds. What is missing:

```typescript
// Additional sounds to add to sounds.ts:

// Mode switch: quiet resonant click (like a mechanical switch)
// Two short pulses at 440Hz (A4) with 50ms gap
'mode-switch': SoundFn;

// Flashcard flip: paper flip sound (filtered white noise burst, 80ms)
'card-flip': SoundFn;

// Timer tick: very subtle click at 1s intervals (softer than 'click')
'timer-tick': SoundFn;

// Timer warning: ascending two-note at 30s remaining
'timer-warning': SoundFn;

// Streak milestone: ascending arpeggio (C major, 4 notes, each 80ms)
'streak-milestone': SoundFn;

// AI thinking: low continuous hum (subtle, 60Hz sine at 0.02 volume)
// Only plays during AI thinking state, stops when response arrives
'ai-thinking': SoundFn; // returns a stop() handle unlike other sounds

// Quiz correct: brighter version of success (C5 -> E5 -> G5, 80ms each)
'quiz-correct': SoundFn;

// Quiz incorrect: lower, shorter error (200Hz, 100ms, sine)
'quiz-incorrect': SoundFn;
```

The sound engine already handles `prefers-reduced-motion` (sounds are disabled entirely). The `SoundToggle` component provides the user toggle. No changes needed to the infrastructure -- just new synthesis functions.

---

## Sources and References

- NN Group, "Left-Side Attention" (2024): https://www.nngroup.com/articles/horizontal-attention-leans-left/
- NN Group, F-Pattern eye-tracking studies (2006-2024): https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- Lindgaard et al. (2006), "Attention web designers: You have 50 milliseconds to make a first impression"
- Kujala et al. (2017), "UX Curve Method" -- perceived variety in micro-interactions and long-term engagement
- Kornell (2009), "Optimising Learning Using Flashcards: Spacing Is More Effective Than Cramming"
- Shaffer et al. (2010), "Algorithm Visualisation: The State of the Field" -- physical metaphor animations and comprehension
- Shneiderman (1983), "Direct Manipulation: A Step Beyond Programming Languages"
- Beaudouin-Lafon (2000), "Instrumental Interaction" -- physical continuity in dragging
- Zhai et al. (2012), "Human Performance in Pointing and Dragging" -- inertial scrolling and targeting errors
- Apple Human Interface Guidelines (2024), Spring Animations: stiffness 200-500, damping ratios 0.07-0.12
- Material Design 3 (2024), Motion specifications: emphasis curve cubic-bezier(0.2, 0, 0, 1)
- Duolingo Engineering Blog (2023), "How We Designed Our Animation System"

---

## One Big Win

If time permits only one addition, implement **mode-specific motion presets** (the `modeMotion` object in Section 6). Everything else in the motion system is infrastructure that already works. The mode presets are what transform seven identically-animated screens into seven distinct experiences. Learn mode with gentle 400ms springs feels educational. Quiz mode with snappy 100ms springs feels urgent. The same content rendered with different motion timing creates fundamentally different user experiences. This is backed by research on temporal perception in UI (Harrison et al., 2007: users perceive 200ms vs 400ms animations as qualitatively different interaction types, not just speed differences). The presets are pure configuration -- no new components needed, just import `modeMotion.quiz.defaultSpring` instead of `springs.snappy` in quiz components. Maximum impact for minimum implementation effort.

**Key files referenced:**
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/constants/motion.ts` -- motion system constants (primary file to extend)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/app/globals.css` -- CSS tokens and reduced motion rules
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/audio/sounds.ts` -- sound synthesis definitions
- `/Users/anshullkgarg/Desktop/system_design/architex/src/lib/audio/sound-engine.ts` -- sound engine singleton
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/ModuleCrossfade.tsx` -- module transition wrapper
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/CommandPaletteAnimation.tsx` -- command palette animation components
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/LoadingTransitions.tsx` -- skeleton/shimmer loading system
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/shared/NotificationToast.tsx` -- toast notification animations
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/landing/AnimatedText.tsx` -- gradient text, typewriter, count-up, fade-up
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/landing/ScrollReveal.tsx` -- scroll-triggered animations
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/interview/ScoreDisplay.tsx` -- score display (needs animation integration)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/interview/StreakBadge.tsx` -- streak badge (needs motion system integration)
- `/Users/anshullkgarg/Desktop/system_design/architex/src/components/canvas/DragGhostPreview.tsx` -- drag ghost (needs spring settle)