/**
 * Architex Motion Design System
 * ══════════════════════════════════════════════════════════════════
 *
 * A complete motion specification for the Architex platform.
 * Every value is production-ready — no placeholders, no approximations.
 *
 * Principles:
 *   1. Motion communicates state, not decorates it.
 *   2. Every animation has a reduced-motion fallback (instant snap).
 *   3. Canvas operations feel direct; UI chrome feels responsive.
 *   4. Spring physics for organic movement; tween for predictable timing.
 *   5. Performance ceiling: 200 concurrent animated elements, 60fps target.
 *
 * Usage:
 *   import { springs, duration, easing, animations } from '@/lib/constants/motion';
 *
 *   <motion.div
 *     animate={{ scale: 1, opacity: 1 }}
 *     transition={springs.snappy}
 *   />
 */

// ═══════════════════════════════════════════════════════════════════
// 1. SPRING PHYSICS CONSTANTS
// ═══════════════════════════════════════════════════════════════════
//
// Named spring configurations for the `motion` library (motion/react).
// Each encodes a physical metaphor that maps to a UX intent.
//
// Higher stiffness = faster snap to target.
// Higher damping   = less overshoot (oscillation dies faster).
// Higher mass      = more inertia (slower initial movement, heavier feel).

export const springs = {
  /**
   * snappy — Quick, decisive response with minimal overshoot.
   *
   * WHEN: Interactive controls that need immediate feedback.
   * The user should feel the UI is directly connected to their input.
   *
   * EXAMPLES:
   *   - Button press scale (1 -> 0.97 -> 1)
   *   - Toggle switch sliding left/right
   *   - Tooltip position snapping to anchor point
   *   - Checkbox check mark appearing
   *   - Dropdown menu item highlight following cursor
   *   - Node snap-to-grid after drag release
   */
  snappy: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 },

  /**
   * smooth — Fluid, elegant movement that feels polished.
   *
   * WHEN: Larger UI surfaces that transition between states.
   * The user should perceive deliberate, crafted motion.
   *
   * EXAMPLES:
   *   - Sidebar panel sliding open/closed
   *   - Properties panel entering from the right
   *   - Algorithm bar swap (two bars crossing paths in the visualizer)
   *   - Toast notification stack reordering when a new toast arrives
   *   - Activity bar active indicator sliding to new module
   *   - Modal dialog entering the viewport
   */
  smooth: { type: 'spring' as const, stiffness: 200, damping: 25, mass: 1.0 },

  /**
   * bouncy — Playful overshoot that draws attention.
   *
   * WHEN: Celebratory moments or elements that need to "pop" into view.
   * Use sparingly — overuse makes the UI feel toy-like.
   *
   * EXAMPLES:
   *   - Achievement badge unlocking (scale 0 -> 1.2 -> 1)
   *   - Challenge complete confetti burst
   *   - Score counter landing on final value
   *   - Streak milestone flame icon pulse
   *   - Level-up notification badge
   *   - New high score indicator
   */
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 20, mass: 0.5 },

  /**
   * stiff — Precise, mechanical movement with almost no overshoot.
   *
   * WHEN: Spatial operations where accuracy matters more than grace.
   * The element should arrive at its destination and stay put.
   *
   * EXAMPLES:
   *   - Node following cursor during drag (with slight lag for polish)
   *   - Grid alignment snapping after node is released
   *   - Resize handle following mouse during panel resize
   *   - Selection rectangle corner tracking mouse position
   *   - Scroll position snapping to section boundaries
   *   - Magnetic connection handle snapping to compatible port
   */
  stiff: { type: 'spring' as const, stiffness: 500, damping: 35, mass: 1.0 },

  /**
   * gentle — Slow, weighted movement for large layout changes.
   *
   * WHEN: Content reflows that involve many elements repositioning.
   * Slower timing gives the user time to track what moved where.
   *
   * EXAMPLES:
   *   - Module switch content crossfade
   *   - Layout shift when sidebar opens (center content resizes)
   *   - Grid re-sort animation (challenge cards reordering)
   *   - Dashboard cards shuffling after filter change
   *   - Panel group rebalancing after collapse/expand
   *   - Workspace split/merge transitions
   */
  gentle: { type: 'spring' as const, stiffness: 150, damping: 20, mass: 1.2 },
} as const;

/** Type-safe spring name union */
export type SpringName = keyof typeof springs;

// ═══════════════════════════════════════════════════════════════════
// 2. DURATION SCALE
// ═══════════════════════════════════════════════════════════════════
//
// A fixed set of timing tokens. Every tween animation in the app
// MUST use one of these values — no magic numbers.
//
// Naming follows a perceptual scale: the label describes how the
// duration FEELS to the user, not its raw millisecond value.

export const duration = {
  /** 0ms — Reduced motion fallback. Also used for truly instant state. */
  instant: 0,

  /** 100ms — Fast enough to feel instant but smooth enough to track.
   *  USE: Tooltips appearing, hover background color changes, cursor-following elements. */
  quick: 0.1,

  /** 150ms — Crisp micro-interaction timing.
   *  USE: Button press feedback, icon swap, toggle state change, checkbox. */
  fast: 0.15,

  /** 200ms — Standard UI transition. The "default" for most things.
   *  USE: Panel open/close, tab content switch, dropdown menu appear, node selection highlight. */
  normal: 0.2,

  /** 300ms — Perceptible but not slow. Used when the user needs to track movement.
   *  USE: Modal dialog enter, page-level transition, edge draw-in, sidebar full slide. */
  moderate: 0.3,

  /** 500ms — Deliberate pacing for complex changes.
   *  USE: Large layout shift, multi-element stagger sequence, chart data animation. */
  slow: 0.5,

  /** 800ms — Reserved for moments that deserve attention.
   *  USE: Celebration (confetti, achievement), onboarding spotlight, first-run animation. */
  deliberate: 0.8,
} as const;

/** Duration values in milliseconds (for CSS custom properties and non-motion contexts). */
export const durationMs = {
  instant: 0,
  quick: 100,
  fast: 150,
  normal: 200,
  moderate: 300,
  slow: 500,
  deliberate: 800,
} as const;

/** Type-safe duration name union */
export type DurationName = keyof typeof duration;

// ═══════════════════════════════════════════════════════════════════
// 3. EASING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════
//
// CSS cubic-bezier values AND motion-library-compatible arrays.
// Each easing has a distinct UX purpose — they are NOT interchangeable.

export const easing = {
  /**
   * ease-out — Decelerating entry. Fast start, gentle landing.
   * USE: Elements entering the viewport (modals, toasts, panels, nodes appearing).
   * The element arrives quickly, then settles in. Feels responsive.
   */
  out: [0.16, 1, 0.3, 1] as const,

  /**
   * ease-in — Accelerating exit. Gentle start, fast departure.
   * USE: Elements leaving the viewport (closing panels, dismissing toasts).
   * The element hesitates, then zips away. Feels like it "gets out of the way."
   */
  in: [0.55, 0, 1, 0.45] as const,

  /**
   * ease-in-out — Symmetric acceleration/deceleration.
   * USE: State changes where the element stays in place (color change, size toggle).
   * Smooth transition between two resting states.
   */
  inOut: [0.65, 0, 0.35, 1] as const,

  /**
   * emphasized — Aggressive deceleration (Material Design 3 emphasis curve).
   * USE: Large-distance movements (full-screen transitions, panel sliding across the viewport).
   * Starts with momentum, then takes its time to land. Dramatic but controlled.
   */
  emphasized: [0.2, 0, 0, 1] as const,

  /**
   * linear — Constant speed. No acceleration.
   * USE: Progress bars, particle flow along edges, continuous rotation.
   * Anything that should feel mechanical or steady.
   */
  linear: [0, 0, 1, 1] as const,
} as const;

/** CSS cubic-bezier string versions for use in CSS custom properties and inline styles. */
export const easingCSS = {
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  in: 'cubic-bezier(0.55, 0, 1, 0.45)',
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  linear: 'linear',
} as const;

/** Type-safe easing name union */
export type EasingName = keyof typeof easing;

// ═══════════════════════════════════════════════════════════════════
// 4. ANIMATION CATALOG — EVERY ANIMATION IN THE APP
// ═══════════════════════════════════════════════════════════════════
//
// Grouped by component/context. Each entry includes:
//   - motion library props (initial, animate, exit, transition)
//   - reduced motion alternative (see section 6 below)
//
// Components import the specific preset they need rather than
// building transitions inline.

export const animations = {

  // ─── Canvas Interactions ───────────────────────────────────────

  canvas: {
    /** Node appears when dropped onto canvas from palette. */
    nodeAppear: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { ...springs.bouncy, duration: 0.2 },
    },

    /** Node removed from canvas. */
    nodeDelete: {
      exit: { scale: 0.9, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },

    /** Node follows cursor while dragging. Applied as a motion value. */
    nodeDrag: {
      transition: springs.stiff,
    },

    /** Node snaps to nearest grid point on drag release. */
    nodeSnapToGrid: {
      transition: springs.snappy,
    },

    /** Edge draws in from source to target (stroke-dashoffset trick). */
    edgeAppear: {
      initial: { strokeDashoffset: 1 },
      animate: { strokeDashoffset: 0 },
      transition: { duration: duration.moderate, ease: easing.out },
    },

    /** Edge fades out and thins when deleted. */
    edgeDelete: {
      exit: { opacity: 0, strokeWidth: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },

    /** Selection box — no animation, instant resize following cursor. */
    selectionBox: {
      transition: { duration: 0 },
    },

    /** Canvas pan — immediate, no spring (would feel sluggish at this scale). */
    canvasPan: {
      transition: { duration: 0 },
    },

    /** Canvas zoom — smooth step interpolation. */
    canvasZoom: {
      transition: { duration: duration.fast, ease: easing.out },
    },
  },

  // ─── Particle System (Edge Data Flow) ─────────────────────────

  particles: {
    /** Particle movement along edge path at constant speed. */
    movement: {
      transition: { ease: easing.linear, repeat: Infinity },
    },

    /** Particle geometry. */
    size: 4,     // px — circle diameter
    spacing: 20, // px — distance between particles at 1x speed

    /** Particle fade in at source node. */
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.05 },
    },

    /** Particle fade out at target node. */
    fadeOut: {
      animate: { opacity: 0 },
      transition: { duration: 0.05 },
    },

    /** Error particle — larger, red, pulsing. */
    error: {
      size: 6, // px
      color: 'var(--state-error)',
      animate: { scale: [1, 1.3, 1] },
      transition: { duration: 0.4, repeat: Infinity, ease: easing.inOut },
    },
  },

  // ─── Panel Animations ─────────────────────────────────────────

  panels: {
    /** Left sidebar opens. */
    sidebarOpen: {
      initial: { width: 0, opacity: 0 },
      animate: { width: 260, opacity: 1 },
      transition: { duration: duration.normal, ease: easing.out },
    },

    /** Left sidebar closes. Faster close feels more responsive. */
    sidebarClose: {
      exit: { width: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },

    /** Right properties panel — mirrors sidebar but from right edge. */
    propertiesOpen: {
      initial: { width: 0, opacity: 0 },
      animate: { width: 280, opacity: 1 },
      transition: { duration: duration.normal, ease: easing.out },
    },

    propertiesClose: {
      exit: { width: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },

    /** Bottom panel slides up. */
    bottomPanelOpen: {
      initial: { height: 0, opacity: 0 },
      animate: { height: 'auto', opacity: 1 },
      transition: { duration: duration.normal, ease: easing.out },
    },

    bottomPanelClose: {
      exit: { height: 0, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },

    /** Content inside panels fades in with stagger. */
    panelContentItem: {
      initial: { opacity: 0, y: 4 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.quick, ease: easing.out },
    },

    /** Stagger delay per item for panel content lists. */
    panelContentStagger: 0.04, // 40ms per item
  },

  // ─── Algorithm Visualization ──────────────────────────────────

  algorithm: {
    /** Bar swap — two bars physically cross paths. */
    barSwap: {
      transition: springs.smooth,
    },

    /** Bar height change (value re-assignment). */
    barHeightChange: {
      transition: {
        height: { ...springs.smooth },
        backgroundColor: { duration: duration.normal },
      },
    },

    /** Bar gets highlighted during comparison. */
    barCompare: {
      animate: { backgroundColor: '#3b82f6' }, // blue-500
      transition: { duration: duration.quick, ease: easing.out },
    },

    /** Bar marked as sorted — green with scale pulse. */
    barSorted: {
      animate: { backgroundColor: '#22c55e', scale: [1, 1.05, 1] },
      transition: { duration: duration.normal, ease: easing.out },
    },

    /** Pivot element glow (infinite pulsing box-shadow). */
    pivotHighlight: {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(168, 85, 247, 0)',
          '0 0 8px 3px rgba(168, 85, 247, 0.4)',
          '0 0 0 0 rgba(168, 85, 247, 0)',
        ],
      },
      transition: { duration: 0.4, repeat: Infinity, ease: easing.inOut },
    },

    /** Time between algorithm steps at 1x playback speed. */
    stepIntervalMs: 50,
  },

  // ─── Modal / Dialog ───────────────────────────────────────────

  modal: {
    /** Overlay backdrop fade. */
    overlayEnter: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: duration.quick },
    },

    overlayExit: {
      exit: { opacity: 0 },
      transition: { duration: duration.quick },
    },

    /** Dialog box entrance — scale up, slide up, fade in. */
    dialogEnter: {
      initial: { scale: 0.95, y: 10, opacity: 0 },
      animate: { scale: 1, y: 0, opacity: 1 },
      transition: { duration: duration.normal, ease: easing.out },
    },

    /** Dialog box exit — subtle scale down and fade. */
    dialogExit: {
      exit: { scale: 0.98, opacity: 0 },
      transition: { duration: duration.fast, ease: easing.in },
    },
  },

  // ─── Toast Notifications ──────────────────────────────────────

  toast: {
    /** Toast slides in from the right. */
    enter: {
      initial: { x: '100%', opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: springs.snappy,
    },

    /** Toast slides out to the right. */
    exit: {
      exit: { x: '100%', opacity: 0 },
      transition: { duration: duration.normal, ease: easing.in },
    },

    /** Existing toasts shift down when a new one pushes them. */
    stackReorder: {
      transition: springs.smooth,
    },
  },

  // ─── Command Palette ──────────────────────────────────────────

  commandPalette: {
    /** Palette opens — slides down, scales up, fades in. */
    open: {
      initial: { y: -20, scale: 0.98, opacity: 0 },
      animate: { y: 0, scale: 1, opacity: 1 },
      transition: { duration: duration.fast, ease: easing.out },
    },

    /** Palette closes — reverse of open, faster. */
    close: {
      exit: { y: -10, scale: 0.98, opacity: 0 },
      transition: { duration: duration.quick, ease: easing.in },
    },

    /** Individual result items stagger in. */
    resultItem: {
      initial: { y: 4, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: duration.quick, ease: easing.out },
    },

    /** Stagger delay per result item. */
    resultStagger: 0.02, // 20ms
  },

  // ─── Module Switch ────────────────────────────────────────────

  moduleSwitch: {
    /** Outgoing module content fades out. */
    contentExit: {
      exit: { opacity: 0 },
      transition: { duration: duration.quick },
    },

    /** Incoming module content fades in (delayed to sequence after exit). */
    contentEnter: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: duration.fast, delay: 0.05 },
    },

    /** Activity bar active indicator slides to new position. */
    indicatorSlide: {
      transition: springs.smooth,
    },
  },

  // ─── Simulation States ────────────────────────────────────────

  simulation: {
    /** Status bar color transition: idle -> running (gray -> green). */
    statusTransition: {
      transition: { duration: duration.moderate, ease: easing.inOut },
    },

    /** Running state: subtle glow pulse on the play button. */
    runningPulse: {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(34, 197, 94, 0)',
          '0 0 6px 2px rgba(34, 197, 94, 0.3)',
          '0 0 0 0 rgba(34, 197, 94, 0)',
        ],
      },
      transition: { duration: 2, repeat: Infinity, ease: easing.inOut },
    },

    /** Error flash on node border: 3 rapid red flashes. */
    errorFlash: {
      animate: {
        borderColor: [
          'var(--border)',
          'var(--state-error)',
          'var(--border)',
          'var(--state-error)',
          'var(--border)',
          'var(--state-error)',
          'var(--border)',
        ],
      },
      transition: { duration: 0.6, ease: easing.linear }, // 100ms on, 100ms off, x3
    },

    /** Chaos event injection — affected node shakes horizontally. */
    chaosShake: {
      animate: {
        x: [0, -2, 2, -2, 2, -2, 2, -2, 2, -2, 2, 0],
      },
      transition: { duration: 0.4, repeat: 2, ease: easing.linear }, // 3 cycles total
    },
  },

  // ─── Celebration / Success ────────────────────────────────────

  celebration: {
    /** Challenge complete — confetti burst configuration. */
    confetti: {
      particleCount: 100,
      duration: 2000, // ms
      gravity: 0.6,
      spread: 360,
      origin: { x: 0.5, y: 0.5 },
    },

    /** Achievement badge unlock — bouncy scale-in with glow. */
    achievementUnlock: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { ...springs.bouncy },
    },

    /** Achievement glow effect (runs after badge lands). */
    achievementGlow: {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(250, 204, 21, 0)',
          '0 0 20px 8px rgba(250, 204, 21, 0.4)',
          '0 0 0 0 rgba(250, 204, 21, 0)',
        ],
      },
      transition: { duration: duration.slow, ease: easing.inOut },
    },

    /** Level up — number counter that counts from old to new value. */
    levelUpCounter: {
      transition: { duration: duration.slow, ease: easing.out },
    },

    /** Level up glow pulse — gold shimmer. */
    levelUpGlow: {
      animate: {
        boxShadow: [
          '0 0 0 0 rgba(250, 204, 21, 0)',
          '0 0 12px 4px rgba(250, 204, 21, 0.5)',
          '0 0 0 0 rgba(250, 204, 21, 0)',
        ],
      },
      transition: { duration: 0.6, repeat: 2, ease: easing.inOut },
    },

    /** Streak milestone — flame icon pulse + scale. */
    streakPulse: {
      animate: { scale: [1, 1.15, 1] },
      transition: { duration: 0.4, ease: easing.inOut },
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════
// 5. STAGGER PATTERNS
// ═══════════════════════════════════════════════════════════════════
//
// Controls the delay between siblings in a staggered entrance.
// "maxAnimated" prevents performance collapse on large lists —
// items beyond this threshold appear instantly (no stagger).

export const stagger = {
  /** List items (sidebar items, dropdown options, search results). */
  listItems: {
    delayPerItem: 0.04,  // 40ms between items
    maxAnimated: 10,     // Items beyond index 10 appear instantly
  },

  /** Grid items (palette components, template gallery tiles). */
  gridItems: {
    delayPerItem: 0.03,  // 30ms per item
    maxAnimated: 16,     // 4x4 grid max
    direction: 'left-to-right-top-to-bottom' as const,
  },

  /** Dashboard cards (score display dimensions, interview metrics). */
  dashboardCards: {
    delayPerItem: 0.06,  // 60ms per card
    maxAnimated: 8,
  },

  /** Chart data points (bar chart values, line chart dots). */
  chartDataPoints: {
    delayPerItem: 0.02,  // 20ms per data point
    maxAnimated: 50,     // Charts can have many points
  },

  /** Command palette result items. */
  commandResults: {
    delayPerItem: 0.02,  // 20ms per result
    maxAnimated: 10,
  },

  /** Panel content items (properties, configurations). */
  panelContent: {
    delayPerItem: 0.04,  // 40ms per item
    maxAnimated: 10,
  },
} as const;

/** Type-safe stagger pattern name union */
export type StaggerPattern = keyof typeof stagger;

/**
 * Helper: compute the delay for a specific item index in a stagger group.
 * Returns 0 for items beyond maxAnimated.
 */
export function getStaggerDelay(pattern: StaggerPattern, index: number): number {
  const config = stagger[pattern];
  if (index >= config.maxAnimated) return 0;
  return index * config.delayPerItem;
}

// ═══════════════════════════════════════════════════════════════════
// 6. REDUCED MOTION CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
//
// Every animation MUST have a reduced-motion fallback. This section
// defines the mapping and a helper to apply it automatically.
//
// Strategy:
//   - Spring animations      -> instant snap (0ms, no easing)
//   - Fade transitions       -> instant opacity change (0ms)
//   - Slide transitions      -> instant position (0ms)
//   - Particle flow on edges -> static dots at fixed intervals
//   - Celebrations           -> static badge appear (no confetti, no glow)
//   - Infinite loops (pulse) -> single-frame, no repeat

export const reducedMotion = {
  /** Replace any spring/tween transition with instant snap. */
  instantTransition: {
    type: 'tween' as const,
    duration: 0,
  },

  /** Replace particle flow with static dots. */
  particles: {
    static: true,
    animateFlow: false,
    showDotsAtFixedIntervals: true,
    intervalPx: 40,
  },

  /** Replace celebrations with simple appear. */
  celebration: {
    confetti: false,
    glow: false,
    counterAnimation: false,
    badgeAppear: { duration: 0 },
  },

  /** Replace infinite pulses with static state. */
  pulse: {
    repeat: 0,
    duration: 0,
  },
} as const;

/**
 * Helper: returns the appropriate transition based on the user's
 * prefers-reduced-motion setting.
 *
 * Usage:
 *   const transition = useReducedMotion()
 *     ? reducedMotion.instantTransition
 *     : springs.smooth;
 *
 * Note: motion/react's useReducedMotion() hook handles this natively
 * for many cases. This helper is for custom Canvas2D or imperative animations.
 */

// ═══════════════════════════════════════════════════════════════════
// 7. PERFORMANCE RULES (encoded as runtime constants)
// ═══════════════════════════════════════════════════════════════════
//
// These values are enforced at runtime by animation orchestrators.
// Documented inline for the engineering team.

export const performanceLimits = {
  /**
   * Maximum number of concurrently animated DOM elements.
   * If this count is exceeded, the oldest non-essential animations
   * should be force-completed (snapped to their end state).
   */
  maxConcurrentAnimations: 200,

  /**
   * Target frame rate. Spring physics and requestAnimationFrame loops
   * should throttle to this ceiling. Dropping below 45fps should trigger
   * automatic animation complexity reduction.
   */
  targetFps: 60,

  /**
   * Minimum acceptable frame rate before animations degrade gracefully.
   * Below this threshold: disable particle systems, simplify springs to tweens.
   */
  degradationThresholdFps: 45,

  /**
   * Particle system MUST use Canvas 2D, never DOM elements.
   * This flag is read by the particle renderer.
   */
  particleRenderer: 'canvas2d' as const,

  /**
   * Disable non-essential animations (particles, pulses, celebrations)
   * when the browser tab is not visible (Page Visibility API).
   */
  pauseOnHidden: true,

  /**
   * will-change CSS property management:
   * - Set `will-change: transform` BEFORE animation starts.
   * - Remove it AFTER animation completes (within 1 frame via rAF).
   * - NEVER leave will-change permanently on an element.
   */
  willChangeAutoManage: true,

  /**
   * Layout property animation blacklist.
   * NEVER animate these properties — use transform/opacity equivalents:
   *   width/height  -> scaleX/scaleY
   *   top/left      -> translateX/translateY
   *   margin/padding -> translate or gap on parent
   *
   * Exception: Panel width/height animations use react-resizable-panels
   * which handles layout shifts internally via flex-basis.
   */
  neverAnimateProperties: ['width', 'height', 'top', 'left', 'right', 'bottom', 'margin', 'padding'] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════
// 8. CSS CUSTOM PROPERTIES
// ═══════════════════════════════════════════════════════════════════
//
// These should be injected into :root via globals.css.
// Exported here as a source-of-truth reference and for programmatic
// access when building CSS-in-JS or inline styles.

export const cssCustomProperties = {
  // Duration tokens
  '--motion-duration-instant': '0ms',
  '--motion-duration-quick': '100ms',
  '--motion-duration-fast': '150ms',
  '--motion-duration-normal': '200ms',
  '--motion-duration-moderate': '300ms',
  '--motion-duration-slow': '500ms',
  '--motion-duration-deliberate': '800ms',

  // Easing tokens
  '--motion-ease-out': easingCSS.out,
  '--motion-ease-in': easingCSS.in,
  '--motion-ease-in-out': easingCSS.inOut,
  '--motion-ease-emphasized': easingCSS.emphasized,

  // Spring tokens (reference values — springs are computed in JS, not CSS)
  // These document the spring parameters for the design team.
  '--motion-spring-snappy': '300 / 30 / 0.8',    // stiffness / damping / mass
  '--motion-spring-smooth': '200 / 25 / 1.0',
  '--motion-spring-bouncy': '400 / 20 / 0.5',
  '--motion-spring-stiff': '500 / 35 / 1.0',
  '--motion-spring-gentle': '150 / 20 / 1.2',
} as const;

// ═══════════════════════════════════════════════════════════════════
// CONVENIENCE — Pre-composed transition presets for common patterns
// ═══════════════════════════════════════════════════════════════════

/** Shorthand: fade-in with standard timing. */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: duration.normal, ease: easing.out },
} as const;

/** Shorthand: fade-out with standard timing. */
export const fadeOut = {
  exit: { opacity: 0 },
  transition: { duration: duration.fast, ease: easing.in },
} as const;

/** Shorthand: slide-up entrance (common for list items, cards). */
export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.normal, ease: easing.out },
} as const;

/** Shorthand: scale-in entrance (common for popovers, tooltips). */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: duration.fast, ease: easing.out },
} as const;

/** Shorthand: scale-out exit (common for popovers, tooltips). */
export const scaleOut = {
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: duration.quick, ease: easing.in },
} as const;
