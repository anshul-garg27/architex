/**
 * Architex Micro-Interactions Specification
 * ==========================================================================
 *
 * 58 precisely-specified micro-interactions that make Architex feel premium.
 * Each interaction references the existing motion system from motion.ts.
 *
 * Architecture:
 *   - This file is the SPEC. It exports typed config objects.
 *   - Individual components consume these configs.
 *   - Hooks (useReducedMotion, useSound) gate animations and audio.
 *
 * Naming convention: mi_{category}_{element}_{action}
 *
 * Dependencies:
 *   - motion/react (springs, AnimatePresence)
 *   - @/lib/constants/motion (springs, duration, easing)
 *   - @/lib/audio/sounds (SoundType)
 *   - Tailwind CSS (utility classes)
 *   - Lucide React (icons)
 */

import { springs, duration, easing, stagger } from './motion';

// =========================================================================
// TYPE DEFINITIONS
// =========================================================================

interface MicroInteraction {
  /** What triggers this interaction */
  trigger: string;
  /** motion/react or CSS animation values */
  animation: Record<string, unknown>;
  /** What visually changes — colors, sizes, shadows */
  visual: string;
  /** Sound effect ID from the sound engine, or null */
  sound: string | null;
  /** What happens when prefers-reduced-motion is enabled */
  reducedMotion: string;
  /** Tailwind classes or motion props — copy-paste ready */
  implementation: string;
}

// =========================================================================
// SECTION 1: CURSOR & HOVER EFFECTS (1–8)
// =========================================================================

export const mi_hover = {

  // ── 1. Sidebar Item Hover ─────────────────────────────────────
  sidebarItem: {
    trigger: 'mouseenter on SidebarItem (any variant except active)',
    animation: {
      // Background fades in; icon shifts right 2px
      background: { transition: `background-color ${duration.quick}s ${easing.out}` },
      iconShift: { x: 2, transition: { duration: duration.quick, ease: easing.out } },
    },
    visual: `
      Background: bg-sidebar-accent (hsl(225 8% 13%)) — fades in over 100ms
      Text: foreground-muted -> sidebar-foreground (opacity shift from 55% to 90%)
      Icon: translates 2px right (subtle "nudge toward content" affordance)
      Left edge: 2px-wide vertical bar appears (bg-primary at 40% opacity), height
        matches the item, animates scaleY from 0 to 1 with origin-top
      Badge (if present): no change — stays anchored right
    `,
    sound: 'hover',
    reducedMotion: 'Instant background color swap. No icon shift. No edge bar animation — appears immediately.',
    implementation: `
      // In SidebarItem component — add to the button element:
      // Tailwind classes (already partially present):
      "group relative transition-colors duration-[100ms] ease-[cubic-bezier(0.16,1,0.3,1)]
       hover:bg-sidebar-accent hover:text-sidebar-foreground"

      // Left edge indicator (add as pseudo-element or child span):
      <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0
        bg-primary/40 transition-transform duration-[100ms] ease-out
        group-hover:scale-y-100" />

      // Icon nudge (wrap icon in motion.span):
      <motion.span
        className="flex-shrink-0"
        whileHover={{ x: 2 }}
        transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {icon}
      </motion.span>
    `,
  } satisfies MicroInteraction,

  // ── 2. Canvas Node Hover ──────────────────────────────────────
  canvasNode: {
    trigger: 'mouseenter on a canvas system-design node (not during drag)',
    animation: {
      ring: { boxShadow: `0 0 0 1.5px var(--primary)`, transition: { duration: duration.quick, ease: easing.out } },
      elevation: { y: -1, transition: springs.snappy },
    },
    visual: `
      Border: 1.5px ring appears in --primary (violet 258deg) at 60% opacity
      Elevation: node lifts 1px (translateY: -1) for subtle depth
      Shadow: shadow-md -> shadow-lg (deeper drop shadow)
      Connection ports: opacity 0 -> 1, scale 0.5 -> 1 (ports reveal on hover)
      Cursor: changes to "grab" (see #8)
      Background: no change (keeps the node type color)
    `,
    sound: null,
    reducedMotion: 'Ring appears instantly. No elevation shift. Ports appear instantly at full opacity.',
    implementation: `
      // On the node wrapper (React Flow custom node):
      <motion.div
        whileHover={{
          y: -1,
          boxShadow: "0 0 0 1.5px hsl(258 78% 64% / 0.6), 0 10px 15px -3px hsla(0 0% 0% / 0.4)",
        }}
        transition={springs.snappy}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Connection ports — hidden by default, revealed on hover */}
        <div className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2
          rounded-full border-2 border-primary bg-surface
          opacity-0 scale-50 transition-all duration-[100ms] ease-out
          group-hover:opacity-100 group-hover:scale-100" />
        {/* ... node content ... */}
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 3. Quiz Option Hover ──────────────────────────────────────
  quizOption: {
    trigger: 'mouseenter on an unanswered quiz option card',
    animation: {
      border: { borderColor: 'var(--primary)', transition: { duration: duration.quick, ease: easing.out } },
      background: { backgroundColor: 'hsl(258 78% 64% / 0.06)', transition: { duration: duration.quick } },
    },
    visual: `
      Border: border-border -> border at 50% primary opacity (violet glow edge)
      Background: transparent -> primary at 6% opacity (barely-there violet tint)
      Left indicator: 3px tall vertical pill (bg-primary) fades in at left-3 position
      Text: foreground-muted -> foreground (brightens)
      Scale: none — quiz options should feel stable, not bouncy
      Letter badge (A/B/C/D): bg-muted -> bg-primary/20, text -> primary
    `,
    sound: null,
    reducedMotion: 'Instant border color change. No background tint animation.',
    implementation: `
      // Quiz option button:
      <button className="
        group relative flex items-center gap-3 rounded-lg border border-border
        bg-transparent px-4 py-3 text-left text-sm text-foreground-muted
        transition-all duration-[100ms] ease-[cubic-bezier(0.16,1,0.3,1)]
        hover:border-primary/50 hover:bg-primary/[0.06] hover:text-foreground
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
        focus-visible:ring-offset-2 focus-visible:ring-offset-background
      ">
        {/* Letter badge */}
        <span className="flex h-6 w-6 items-center justify-center rounded
          bg-muted text-xs font-semibold text-foreground-muted
          transition-colors duration-[100ms]
          group-hover:bg-primary/20 group-hover:text-primary">
          {letter}
        </span>
        <span className="flex-1">{text}</span>
      </button>
    `,
  } satisfies MicroInteraction,

  // ── 4. Button Hover ───────────────────────────────────────────
  button: {
    trigger: 'mouseenter on any Button component (all variants)',
    animation: {
      default: { backgroundColor: 'var(--primary-hover)', transition: { duration: duration.quick } },
      ghost: { backgroundColor: 'var(--accent)', transition: { duration: duration.quick } },
    },
    visual: `
      Default variant: bg-primary -> bg-primary-hover (258deg 78% 64% -> 57% lightness)
        Subtle brightness reduction signals interactivity
      Ghost variant: transparent -> bg-accent (hsl(225 8% 15%))
      Outline variant: border brightens — border-input -> border-primary/40
      All variants: cursor stays pointer (already set by browser for <button>)
      NO scale change on hover — scale is reserved for press (see #9)
    `,
    sound: null,
    reducedMotion: 'Instant color swap. Already handled by Tailwind transition-colors.',
    implementation: `
      // Already implemented in buttonVariants cva — verify these classes are present:
      // default: "hover:bg-primary-hover"
      // ghost: "hover:bg-accent hover:text-accent-foreground"
      // outline: "hover:bg-accent hover:text-accent-foreground"
      //
      // ADD to base cva string: "transition-colors duration-[100ms]"
      // (currently says transition-colors which uses Tailwind default 150ms — tighten to 100ms)
    `,
  } satisfies MicroInteraction,

  // ── 5. Tab Hover ──────────────────────────────────────────────
  tab: {
    trigger: 'mouseenter on an inactive TabsTrigger',
    animation: {
      text: { color: 'var(--foreground)', opacity: 0.8, transition: { duration: duration.quick } },
      underline: { scaleX: 1, opacity: 0.3, transition: { duration: duration.fast, ease: easing.out } },
    },
    visual: `
      Text: muted-foreground -> foreground at 80% opacity (brightens but doesn't
        match active tab — preserves hierarchy)
      Bottom border: a 2px-high pseudo-element at the bottom scales from scaleX(0)
        to scaleX(1) at 30% opacity of --primary. Origin: center.
        This "previews" the active underline without committing to it.
      Background: none — tabs use underline paradigm, not background fills
    `,
    sound: null,
    reducedMotion: 'Text color change instant. Underline preview appears instantly.',
    implementation: `
      // Update TabsTrigger — add a hover pseudo-underline:
      "relative data-[state=inactive]:hover:text-foreground/80
       after:absolute after:bottom-0 after:left-0 after:h-0.5
       after:w-full after:origin-center after:scale-x-0
       after:bg-primary/30 after:transition-transform after:duration-[150ms]
       after:ease-[cubic-bezier(0.16,1,0.3,1)]
       data-[state=inactive]:hover:after:scale-x-100"
    `,
  } satisfies MicroInteraction,

  // ── 6. Flashcard Hover ────────────────────────────────────────
  flashcard: {
    trigger: 'mouseenter on a flashcard in the spaced-repetition deck',
    animation: {
      tilt: { rotateY: 3, rotateX: -2, transition: springs.snappy },
      glow: { boxShadow: '0 0 20px 0 hsl(258 78% 64% / 0.08)' },
    },
    visual: `
      3D tilt: subtle perspective tilt — rotateY(3deg) rotateX(-2deg)
        Card appears to tilt toward the cursor, as if magnetically attracted
        Uses perspective: 800px on parent for depth
      Glow: faint violet ambient glow beneath (box-shadow, not filter)
      Border: border-border -> border at 50% stronger opacity (rgba(255,255,255,0.16))
      "Flip hint" text: opacity 0 -> 0.6, positioned bottom-center
        Text: "Click to flip" in text-xs foreground-subtle
    `,
    sound: null,
    reducedMotion: 'No 3D tilt. Border change only. Flip hint text appears instantly.',
    implementation: `
      // Flashcard wrapper:
      <motion.div
        className="group relative"
        style={{ perspective: 800 }}
      >
        <motion.div
          whileHover={{ rotateY: 3, rotateX: -2 }}
          transition={springs.snappy}
          className="rounded-xl border border-border bg-surface p-6
            shadow-md transition-[border-color,box-shadow] duration-[100ms]
            hover:border-[rgba(255,255,255,0.16)]
            hover:shadow-[0_0_20px_0_hsl(258_78%_64%/0.08)]"
        >
          {/* card content */}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2
            text-xs text-foreground-subtle opacity-0 transition-opacity
            duration-[100ms] group-hover:opacity-60">
            Click to flip
          </span>
        </motion.div>
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 7. Canvas Drag Cursor ─────────────────────────────────────
  canvasDragCursor: {
    trigger: 'mousedown + drag on canvas background (pan) or on a node (move)',
    animation: { cursor: 'grabbing' },
    visual: `
      Canvas pan: cursor changes from "default" to "grabbing" on mousedown
      Node drag: cursor changes from "grab" to "grabbing" on mousedown
      Edge drawing: cursor changes to "crosshair" when in edge-creation mode
      Selection box: cursor stays "crosshair" while drawing selection rectangle
      NO custom SVG cursor — native cursors are faster and more accessible
    `,
    sound: null,
    reducedMotion: 'Same cursor changes. Cursors are not affected by reduced motion.',
    implementation: `
      // Canvas container:
      "cursor-default active:cursor-grabbing"

      // Node (within React Flow custom node):
      "cursor-grab active:cursor-grabbing"

      // Edge creation mode (toggled via state):
      { edgeMode && "cursor-crosshair" }

      // Selection mode:
      "cursor-crosshair"
    `,
  } satisfies MicroInteraction,

  // ── 8. Draggable Element Cursor ───────────────────────────────
  draggableElement: {
    trigger: 'mouseenter on any draggable element (palette items, nodes, panels)',
    animation: { cursor: 'grab' },
    visual: `
      Palette components (drag to canvas): cursor "grab"
      Canvas nodes: cursor "grab" (changes to "grabbing" on mousedown)
      Panel resize handles: cursor "col-resize" (vertical) or "row-resize" (horizontal)
      Timeline scrubber thumb: cursor "ew-resize"
      Speed slider thumb: cursor "ew-resize"
    `,
    sound: null,
    reducedMotion: 'Same cursor. No motion dependency.',
    implementation: `
      // Palette item:
      "cursor-grab active:cursor-grabbing"

      // Resize handle (already in workspace-layout.tsx):
      // vertical: implicit from react-resizable-panels
      // Add explicit: "cursor-col-resize" or "cursor-row-resize"
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 2: CLICK & PRESS EFFECTS (9–16)
// =========================================================================

export const mi_press = {

  // ── 9. Button Press ───────────────────────────────────────────
  buttonPress: {
    trigger: 'mousedown / pointerdown on any Button component',
    animation: {
      scale: { scale: 0.97, transition: { duration: duration.fast, ease: easing.inOut } },
      release: { scale: 1, transition: springs.snappy },
    },
    visual: `
      Scale: 1 -> 0.97 on press (3% scale down — perceptible but subtle)
      Brightness: default variant darkens slightly (primary-hover color)
      Release: springs back to 1.0 using springs.snappy (stiffness: 300, damping: 30)
      Active state: add a subtle inner shadow (--shadow-inner) for "pressed in" depth
      Duration: 150ms down, spring back on release
      Icon buttons (size "icon"): scale 0.92 instead (smaller targets need stronger feedback)
    `,
    sound: 'click',
    reducedMotion: 'No scale animation. Rely on background color darkening alone (already present via hover state).',
    implementation: `
      // Option A — motion/react (for animated buttons):
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={springs.snappy}
        className={buttonVariants({ variant, size })}
      >
        {children}
      </motion.button>

      // Option B — CSS only (for all buttons via cva base):
      // Add to buttonVariants base string:
      "active:scale-[0.97] active:transition-transform active:duration-[150ms]"

      // For icon-size buttons specifically:
      "active:scale-[0.92]"
    `,
  } satisfies MicroInteraction,

  // ── 10. Tab Click Indicator Slide ─────────────────────────────
  tabIndicatorSlide: {
    trigger: 'click on a TabsTrigger — the active underline indicator slides to it',
    animation: {
      slide: { x: 'calculated', width: 'calculated', transition: springs.smooth },
    },
    visual: `
      The 2px-tall active indicator bar (bg-primary) slides horizontally from the
      previously active tab to the newly active tab using layout animation.
      Width morphs to match the new tab's text width.
      Spring: smooth (stiffness: 200, damping: 25, mass: 1.0)
      Content below crossfades: old content fades out (100ms), new fades in (150ms)
    `,
    sound: 'click',
    reducedMotion: 'Indicator teleports instantly (no slide). Content swap is instant (no crossfade).',
    implementation: `
      // Replace static border-b-2 approach with a layout-animated indicator.
      // Wrap TabsList to track active tab position:

      function AnimatedTabsList({ children, ...props }) {
        const [activeRect, setActiveRect] = useState({ left: 0, width: 0 });
        // ... measure active tab via ref + ResizeObserver

        return (
          <TabsList {...props} className="relative">
            {children}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-primary"
              animate={{ left: activeRect.left, width: activeRect.width }}
              transition={springs.smooth}
            />
          </TabsList>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 11. Checkbox Check ────────────────────────────────────────
  checkboxCheck: {
    trigger: 'click on an unchecked checkbox / pointerdown + release',
    animation: {
      box: { scale: [1, 0.85, 1.05, 1], transition: { duration: 0.3, ease: easing.out } },
      checkmark: { pathLength: [0, 1], transition: { duration: 0.2, delay: 0.05, ease: easing.out } },
    },
    visual: `
      Box: quick squish-bounce — scales 1 -> 0.85 -> 1.05 -> 1 over 300ms
      Background: transparent -> bg-primary (violet) — fills in 100ms
      Border: border-input -> border-primary — matches fill
      Checkmark: SVG path draws in from start to end (pathLength 0 -> 1)
        Stroke: white, 2px, round caps
        Path: "M 4 12 L 9 17 L 20 6" (standard checkmark)
        Draws in over 200ms with 50ms delay (waits for squish to land)
      Uncheck: reverse — checkmark fades out (opacity 0, 100ms), box springs back
    `,
    sound: 'click',
    reducedMotion: 'No scale animation. Checkmark appears instantly (pathLength: 1). Background swap instant.',
    implementation: `
      // Animated checkbox using motion/react SVG:
      <motion.div
        animate={checked ? { scale: [1, 0.85, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors duration-[100ms]",
          checked ? "border-primary bg-primary" : "border-input bg-transparent"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <motion.path
            d="M 4 12 L 9 17 L 20 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: 0.2, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 12. Toggle Switch ─────────────────────────────────────────
  toggleSwitch: {
    trigger: 'click on Switch component / keyboard Space/Enter when focused',
    animation: {
      thumb: { x: [0, 16], transition: springs.snappy },
      track: { backgroundColor: ['var(--muted)', 'var(--primary)'], transition: { duration: duration.fast } },
      thumbSquish: { scaleX: [1, 1.15, 1], transition: { duration: 0.15 } },
    },
    visual: `
      Thumb: slides 16px right (translate-x-0 -> translate-x-4 in Tailwind units)
        During slide, thumb squishes horizontally (scaleX 1 -> 1.15 -> 1)
        This "elastic squash" makes it feel physical, like a real toggle
      Track: bg-muted -> bg-primary (violet fills in)
        Transition: 150ms ease-in-out
      Thumb shadow: shadow-lg maintained throughout — grounds the thumb
      Off state: thumb slides back, track reverts to muted, squish reverses
    `,
    sound: 'click',
    reducedMotion: 'Thumb teleports to new position. No squish. Track color changes instantly.',
    implementation: `
      // Enhance existing Switch component thumb:
      // Change from transition-transform to motion.div for squish effect:

      <SwitchPrimitive.Thumb asChild>
        <motion.span
          className="pointer-events-none block h-4 w-4 rounded-full bg-primary-foreground shadow-lg ring-0"
          layout
          transition={springs.snappy}
          animate={{
            x: checked ? 16 : 0,
            scaleX: [1, 1.15, 1],
          }}
        />
      </SwitchPrimitive.Thumb>

      // CSS fallback (simpler, no squish):
      // Already implemented: "transition-transform data-[state=checked]:translate-x-4"
    `,
  } satisfies MicroInteraction,

  // ── 13. Dropdown Open ─────────────────────────────────────────
  dropdownOpen: {
    trigger: 'click on DropdownMenuTrigger / keyboard Enter/Space/ArrowDown',
    animation: {
      enter: {
        initial: { opacity: 0, scale: 0.95, y: -4 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { duration: duration.fast, ease: easing.out },
      },
      exit: {
        exit: { opacity: 0, scale: 0.97, y: -2 },
        transition: { duration: duration.quick, ease: easing.in },
      },
    },
    visual: `
      Origin: transforms from the trigger element (not center of viewport)
        Scale origin aligned with the "side" prop (top, bottom, left, right)
        data-[side=bottom]: origin-top, data-[side=top]: origin-bottom
      Enter: scale 0.95 -> 1, y offset -4px -> 0, opacity 0 -> 1 (150ms, ease-out)
      Exit: scale 1 -> 0.97, y offset 0 -> -2px, opacity 1 -> 0 (100ms, ease-in)
      Items: stagger in at 20ms intervals (max 10 items animated)
      Border: 1px border-border (rgba(255,255,255,0.10))
      Shadow: shadow-md on the menu surface
    `,
    sound: 'click',
    reducedMotion: 'Instant open/close. No scale or slide. Items appear simultaneously.',
    implementation: `
      // Already partially implemented in DropdownMenuContent.
      // The animate-in/animate-out classes handle this via Tailwind CSS animations.
      // Current: "data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
      // This is correct — no changes needed.

      // To add item stagger, wrap each DropdownMenuItem:
      // <motion.div
      //   initial={{ opacity: 0, y: 4 }}
      //   animate={{ opacity: 1, y: 0 }}
      //   transition={{ duration: 0.1, delay: index * 0.02, ease: [0.16, 1, 0.3, 1] }}
      // >
    `,
  } satisfies MicroInteraction,

  // ── 14. Modal Open ────────────────────────────────────────────
  modalOpen: {
    trigger: 'Dialog state changes to open (user click, keyboard shortcut, programmatic)',
    animation: {
      backdrop: {
        initial: { opacity: 0, backdropFilter: 'blur(0px)' },
        animate: { opacity: 1, backdropFilter: 'blur(4px)' },
        transition: { duration: duration.normal, ease: easing.out },
      },
      content: {
        initial: { scale: 0.95, y: 10, opacity: 0 },
        animate: { scale: 1, y: 0, opacity: 1 },
        transition: { duration: duration.normal, ease: easing.out },
      },
    },
    visual: `
      Backdrop: bg-black/80 with backdrop-blur(4px) — blurs the content behind
        Fades in over 200ms
      Content: starts at scale(0.95) + 10px below center + opacity(0)
        Springs to scale(1) + center + opacity(1) over 200ms
      Close: content scales to 0.98 + fades out (150ms)
        Backdrop fades out (100ms, slightly faster than content)
      Focus: auto-focuses first focusable element inside dialog
    `,
    sound: null,
    reducedMotion: 'No scale or slide. Instant opacity toggle. Backdrop blur still applies (not motion).',
    implementation: `
      // Enhance DialogOverlay — add backdrop blur:
      // Change: "bg-black/80" to "bg-black/80 backdrop-blur-[4px]"
      // (backdrop-blur is a visual effect, not a motion — keep even in reduced motion)

      // DialogContent animation is already correct:
      // "data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[48%]"
      // These map to the correct values.
    `,
  } satisfies MicroInteraction,

  // ── 15. Canvas Node Select ────────────────────────────────────
  canvasNodeSelect: {
    trigger: 'click on an unselected canvas node / keyboard Enter when node is focused',
    animation: {
      ring: {
        initial: { boxShadow: '0 0 0 0 transparent' },
        animate: { boxShadow: '0 0 0 2px var(--primary), 0 0 12px 2px hsl(258 78% 64% / 0.2)' },
        transition: springs.snappy,
      },
    },
    visual: `
      Ring: 2px solid ring in --primary (violet) appears with spring animation
        Springs from 0px to 2px width using springs.snappy
      Glow: soft violet glow (12px spread, 20% opacity) behind the ring
        This glow is the key differentiator — it makes selected nodes "radiate"
      Properties panel: slides open from right (if closed) showing node details
      Deselect: ring and glow fade out over 150ms
      Multi-select (Shift+click): same ring, no glow (glow only for single selection)
    `,
    sound: 'click',
    reducedMotion: 'Ring appears instantly (no spring). Glow appears instantly.',
    implementation: `
      // On the React Flow custom node wrapper:
      <motion.div
        animate={isSelected ? {
          boxShadow: "0 0 0 2px hsl(258 78% 64%), 0 0 12px 2px hsl(258 78% 64% / 0.2)"
        } : {
          boxShadow: "0 0 0 0 transparent"
        }}
        transition={springs.snappy}
        className="rounded-lg"
      >
        {/* node content */}
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 16. Code Copy Button ──────────────────────────────────────
  codeCopyButton: {
    trigger: 'click on the copy button in a code block header',
    animation: {
      iconSwap: {
        exit: { scale: 0.5, opacity: 0, rotate: -90, transition: { duration: 0.15 } },
        enter: { scale: [0.5, 1.1, 1], opacity: 1, rotate: 0, transition: { duration: 0.2, ease: easing.out } },
      },
      revert: { delay: 1500 },
    },
    visual: `
      Step 1: Copy icon (Lucide "Copy") rotates out (-90deg) + scales down + fades (150ms)
      Step 2: Check icon (Lucide "Check") scales in (0.5 -> 1.1 -> 1) + fades in (200ms)
        Check icon color: state-success (green) instead of foreground
      Step 3: after 1.5s, check icon exits same way, copy icon returns
      Button background: brief flash of state-success at 10% opacity (green tint)
        Fades back to transparent over 300ms
      Tooltip: changes from "Copy" to "Copied!" during the check phase
    `,
    sound: 'success',
    reducedMotion: 'No rotation or scale. Icons swap instantly via opacity toggle. Green flash still happens.',
    implementation: `
      // CopyButton component:
      const [copied, setCopied] = useState(false);

      function handleCopy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }

      <button
        onClick={handleCopy}
        className={cn(
          "rounded p-1 transition-colors duration-[300ms]",
          copied ? "bg-state-success/10 text-state-success" : "text-foreground-muted hover:text-foreground"
        )}
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div key="check"
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Check className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div key="copy"
              initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Copy className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 3: LOADING & SKELETON (17–21)
// =========================================================================

export const mi_loading = {

  // ── 17. Skeleton Shimmer ──────────────────────────────────────
  skeletonShimmer: {
    trigger: 'Component is in loading state (data fetching, Suspense boundary)',
    animation: {
      shimmer: {
        backgroundPosition: ['-200% 0', '200% 0'],
        transition: { duration: 1.5, repeat: Infinity, ease: easing.linear },
      },
    },
    visual: `
      Base color: bg-muted (hsl(225 8% 18%)) — matches dark surface
      Shimmer: linear gradient overlay sweeps left-to-right
        Gradient: transparent -> rgba(255,255,255,0.04) -> transparent
        Width: 200% of element (so the bright band slides across)
        Direction: LEFT to RIGHT (matches reading direction, feels like "loading progress")
        Speed: one full sweep every 1.5s
        Easing: linear (constant speed, not ease-in-out — that creates a "pulsing" feel)
      Border radius: matches the element being skeletonized (rounded-md for cards, rounded-full for avatars)
    `,
    sound: null,
    reducedMotion: 'Static bg-muted with no shimmer animation. The pulse is replaced by a static fill.',
    implementation: `
      // Enhanced Skeleton component — replace animate-pulse with directional shimmer:

      // Add to globals.css:
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      // Skeleton component:
      <div
        className={cn(
          "rounded-md bg-muted",
          "bg-[length:200%_100%]",
          "bg-gradient-to-r from-transparent via-white/[0.04] to-transparent",
          "animate-[shimmer_1.5s_linear_infinite]",
          "motion-reduce:animate-none motion-reduce:bg-muted",
          className
        )}
      />
    `,
  } satisfies MicroInteraction,

  // ── 18. Code Block Skeleton ───────────────────────────────────
  codeBlockSkeleton: {
    trigger: 'Code block content is loading (AI response, lazy-loaded example)',
    animation: {
      lineStagger: { delayPerLine: 0.06 },
      lineAppear: {
        initial: { opacity: 0, scaleX: 0, originX: 0 },
        animate: { opacity: 1, scaleX: 1 },
        transition: { duration: 0.2, ease: easing.out },
      },
    },
    visual: `
      Container: rounded-lg bg-surface border border-border (matches code block chrome)
      Header: skeleton bar 40% width at top (file name placeholder)
      Lines: 8-12 skeleton bars of VARYING widths to simulate real code:
        Line widths: [75%, 45%, 90%, 60%, 30%, 85%, 50%, 70%, 40%, 95%, 55%, 20%]
        Each line: h-3 rounded-sm (thinner than text skeletons)
        Spacing: gap-2.5 between lines (matches code line-height)
        Left padding varies: lines 2-4 get pl-4, lines 5-7 get pl-8 (indentation)
      Shimmer: same left-to-right shimmer as #17
      Line numbers: column of 3-digit-wide skeleton blocks on the left
    `,
    sound: null,
    reducedMotion: 'All lines appear simultaneously. No stagger. Static shimmer.',
    implementation: `
      const CODE_LINE_WIDTHS = [75, 45, 90, 60, 30, 85, 50, 70, 40, 95, 55, 20];
      const CODE_LINE_INDENTS = [0, 4, 4, 4, 8, 8, 8, 4, 4, 0, 4, 0]; // Tailwind pl values

      function CodeBlockSkeleton() {
        return (
          <div className="rounded-lg border border-border bg-surface p-4">
            {/* Header bar */}
            <Skeleton className="mb-4 h-3 w-[40%]" />
            {/* Code lines */}
            <div className="flex flex-col gap-2.5">
              {CODE_LINE_WIDTHS.map((width, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  style={{ originX: 0, paddingLeft: CODE_LINE_INDENTS[i] * 4 }}
                >
                  <Skeleton className="h-3 rounded-sm" style={{ width: width + '%' }} />
                </motion.div>
              ))}
            </div>
          </div>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 19. Canvas Loading ────────────────────────────────────────
  canvasLoading: {
    trigger: 'Canvas view is mounting / loading a saved design',
    animation: {
      dots: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: duration.moderate },
      },
      nodes: {
        stagger: stagger.dashboardCards,
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: springs.bouncy,
      },
      edges: {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: duration.moderate, delay: 0.3, ease: easing.out },
      },
    },
    visual: `
      Phase 1 (0-300ms): Dot grid pattern fades in
        The canvas background dots (--canvas-dot) appear with opacity 0 -> 1
        This establishes spatial context before content
      Phase 2 (300-800ms): Nodes pop in with stagger
        Each node uses springs.bouncy (scale 0 -> 1 with overshoot)
        Stagger: 60ms between nodes, max 8 animated (rest appear instantly)
        Order: nodes closest to canvas center appear first (radial stagger)
      Phase 3 (600-1000ms): Edges draw in
        SVG paths animate pathLength 0 -> 1 (stroke draws along the path)
        Starts 300ms after first node lands
        All edges animate simultaneously (no stagger — too chaotic)
    `,
    sound: null,
    reducedMotion: 'Everything appears instantly. No phased reveal. No edge draw-in.',
    implementation: `
      // Phase 1 — canvas background:
      <motion.div
        className="absolute inset-0"
        style={{ backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />

      // Phase 2 — each node:
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...springs.bouncy, delay: 0.3 + index * 0.06 }}
      />

      // Phase 3 — each edge SVG path:
      <motion.path
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    `,
  } satisfies MicroInteraction,

  // ── 20. AI Response Loading ───────────────────────────────────
  aiResponseLoading: {
    trigger: 'AI is generating a response (streaming or awaiting completion)',
    animation: {
      dots: {
        animate: { opacity: [0.3, 1, 0.3] },
        transition: { duration: 1.2, repeat: Infinity, ease: easing.inOut },
        stagger: 0.15,
      },
      shimmerBar: {
        animate: { scaleX: [0.3, 0.6, 0.4, 0.8, 0.5] },
        transition: { duration: 2, repeat: Infinity, ease: easing.inOut },
      },
    },
    visual: `
      Layout: left-aligned container matching AI response bubble style
      Row 1: "AI is thinking" text in text-xs text-foreground-subtle
      Row 2: Three dots that pulse in sequence
        Dot size: h-1.5 w-1.5 rounded-full
        Color: bg-primary (violet)
        Animation: opacity cycles 0.3 -> 1 -> 0.3 over 1.2s, looping
        Each dot is 150ms behind the previous (cascade effect)
      Row 3: Shimmer bar that "breathes" in width
        Height: h-1 rounded-full bg-primary/20
        Width: oscillates between 30% and 80% of container
        This suggests "content is being generated but length is unknown"
    `,
    sound: null,
    reducedMotion: 'Static "AI is thinking..." text only. No dot animation. No shimmer bar.',
    implementation: `
      function AIThinkingIndicator() {
        return (
          <div className="flex flex-col gap-2 py-3">
            <span className="text-xs text-foreground-subtle">AI is thinking</span>
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: [0.65, 0, 0.35, 1],
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <motion.div
              className="h-1 rounded-full bg-primary/20"
              animate={{ scaleX: [0.3, 0.6, 0.4, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.65, 0, 0.35, 1] }}
              style={{ originX: 0 }}
            />
          </div>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 21. Data Table Skeleton ───────────────────────────────────
  dataTableSkeleton: {
    trigger: 'Table data is loading (metrics, analytics, leaderboard)',
    animation: {
      rowStagger: { delayPerRow: 0.04 },
      rowAppear: {
        initial: { opacity: 0, x: -8 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: duration.fast, ease: easing.out },
      },
    },
    visual: `
      Header row: full-width skeleton bars for each column header (h-3, rounded-sm)
        Slightly brighter than body rows (bg-muted-foreground/10 instead of bg-muted)
      Body rows (6 rows):
        Each row has cells matching column widths
        Cell skeleton widths vary randomly within each column:
          Name column: 60-90% width
          Number columns: 30-50% width (shorter)
          Status column: 50-70% width
        Row stagger: 40ms per row, slides in from 8px left
      Bottom: "Loading more..." text placeholder centered, text-xs foreground-subtle
    `,
    sound: null,
    reducedMotion: 'All rows appear simultaneously. No stagger, no slide.',
    implementation: `
      const ROW_COUNT = 6;
      const COLUMNS = [
        { width: 'w-[60%]', maxRandom: 90 }, // name
        { width: 'w-[35%]', maxRandom: 50 }, // metric
        { width: 'w-[55%]', maxRandom: 70 }, // status
      ];

      function TableSkeleton() {
        return (
          <div className="rounded-lg border border-border">
            {/* Header */}
            <div className="flex gap-4 border-b border-border px-4 py-3">
              {COLUMNS.map((col, i) => (
                <Skeleton key={i} className={cn("h-3 rounded-sm", col.width)} />
              ))}
            </div>
            {/* Body */}
            {Array.from({ length: ROW_COUNT }).map((_, row) => (
              <motion.div
                key={row}
                className="flex gap-4 border-b border-border/50 px-4 py-3 last:border-0"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: row * 0.04, ease: [0.16, 1, 0.3, 1] }}
              >
                {COLUMNS.map((col, i) => (
                  <Skeleton
                    key={i}
                    className="h-3 rounded-sm"
                    style={{ width: (Math.random() * (col.maxRandom - 30) + 30) + '%' }}
                  />
                ))}
              </motion.div>
            ))}
          </div>
        );
      }
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 4: SUCCESS & FEEDBACK (22–28)
// =========================================================================

export const mi_feedback = {

  // ── 22. Correct Quiz Answer ───────────────────────────────────
  correctAnswer: {
    trigger: 'User selects the correct answer in a quiz question',
    animation: {
      border: { borderColor: 'var(--learn-correct)', transition: { duration: duration.fast } },
      scale: { scale: [1, 1.02, 1], transition: { duration: 0.3, ease: easing.out } },
      checkmark: { pathLength: [0, 1], opacity: [0, 1], transition: { duration: 0.25, delay: 0.1 } },
      otherOptions: { opacity: 0.4, transition: { duration: duration.normal } },
    },
    visual: `
      Selected option:
        Border: border-border -> border of --learn-correct (green, hsl(152 65% 48%))
        Background: transparent -> --learn-correct-bg (green at 10% opacity)
        Scale: quick pulse 1 -> 1.02 -> 1 (just enough to feel "confirmed")
        Checkmark: green circle-check icon appears to the right, draws in via pathLength
        Text: stays foreground color (don't make it green — the border is enough)
      Other options: fade to 40% opacity over 200ms (de-emphasize wrong answers)
      Explanation panel: slides in from below if present (height 0 -> auto, springs.smooth)
    `,
    sound: 'success',
    reducedMotion: 'Border color changes instantly. No scale pulse. Checkmark appears instantly. Other options dim instantly.',
    implementation: `
      // Correct option state:
      <motion.button
        animate={{
          borderColor: "hsl(152 65% 48%)",
          backgroundColor: "hsl(152 65% 48% / 0.10)",
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-lg border-2 px-4 py-3"
      >
        <span className="flex items-center gap-2">
          {text}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...springs.bouncy, delay: 0.1 }}
          >
            <CheckCircle2 className="h-5 w-5 text-[var(--learn-correct)]" />
          </motion.div>
        </span>
      </motion.button>

      // Other options dimming:
      <motion.button animate={{ opacity: 0.4 }} transition={{ duration: 0.2 }} />
    `,
  } satisfies MicroInteraction,

  // ── 23. Wrong Quiz Answer ─────────────────────────────────────
  wrongAnswer: {
    trigger: 'User selects an incorrect answer in a quiz question',
    animation: {
      shake: {
        x: [0, -6, 6, -4, 4, -2, 2, 0],
        transition: { duration: 0.4, ease: easing.linear },
      },
      border: { borderColor: 'var(--learn-incorrect)', transition: { duration: duration.fast } },
      fade: { opacity: 0.5, transition: { duration: 0.5, delay: 0.4 } },
    },
    visual: `
      Selected (wrong) option:
        Border: flashes --learn-incorrect (red, hsl(0 65% 58%))
        Background: --learn-incorrect-bg (red at 8% opacity) flashes on
        Shake: horizontal shake pattern [-6, 6, -4, 4, -2, 2, 0] over 400ms
          Decreasing amplitude mimics "settling" — feels like a head shake "no"
        After shake: option fades to 50% opacity (de-emphasized as "tried and wrong")
      X icon: red X appears at right of the option (same spot checkmark would go)
      Correct answer: highlights with green border AFTER the shake completes (400ms delay)
        This teaches the user the right answer
    `,
    sound: 'error',
    reducedMotion: 'No shake. Red border appears instantly. Option dims instantly. Correct answer highlights instantly.',
    implementation: `
      // Wrong option:
      <motion.button
        animate={{
          x: [0, -6, 6, -4, 4, -2, 2, 0],
          borderColor: "hsl(0 65% 58%)",
          backgroundColor: "hsl(0 65% 58% / 0.08)",
        }}
        transition={{ x: { duration: 0.4 }, borderColor: { duration: 0.15 } }}
        className="rounded-lg border-2 px-4 py-3"
      >
        {text}
        <XCircle className="h-5 w-5 text-[var(--learn-incorrect)]" />
      </motion.button>

      // After shake, dim:
      // Use onAnimationComplete to trigger a second animation:
      // animate={{ opacity: 0.5 }} transition={{ delay: 0.4, duration: 0.5 }}
    `,
  } satisfies MicroInteraction,

  // ── 24. Pattern Mastered ──────────────────────────────────────
  patternMastered: {
    trigger: 'User achieves mastery on a system design pattern (e.g., CQRS, Saga)',
    animation: {
      glow: {
        animate: {
          boxShadow: [
            '0 0 0 0 rgba(250, 204, 21, 0)',
            '0 0 24px 8px rgba(250, 204, 21, 0.3)',
            '0 0 0 0 rgba(250, 204, 21, 0)',
          ],
        },
        transition: { duration: 0.8, ease: easing.inOut },
      },
      badge: {
        initial: { scale: 0, rotate: -180 },
        animate: { scale: 1, rotate: 0 },
        transition: springs.bouncy,
      },
    },
    visual: `
      Pattern card:
        Gold glow pulse: box-shadow radiates outward in gold (#facc15 at 30%)
        Pulse expands to 24px spread, then contracts back to 0 over 800ms
        Runs ONCE (not infinite — this is a moment, not a state)
      Badge: gold trophy/star icon spins in from scale(0) + rotate(-180deg)
        Uses springs.bouncy for playful overshoot
        Badge sits in the top-right corner of the pattern card
      Progress ring: fills to 100% with the gold color (animates from current value)
      Border: upgrades from border-border to border of --accent-warm (gold)
    `,
    sound: 'success',
    reducedMotion: 'Badge appears instantly at full size. Gold border appears instantly. No glow pulse.',
    implementation: `
      // Pattern mastery card enhancement:
      <motion.div
        animate={{
          boxShadow: [
            "0 0 0 0 rgba(250, 204, 21, 0)",
            "0 0 24px 8px rgba(250, 204, 21, 0.3)",
            "0 0 0 0 rgba(250, 204, 21, 0)",
          ],
        }}
        transition={{ duration: 0.8, ease: [0.65, 0, 0.35, 1] }}
        className="rounded-xl border border-[var(--accent-warm)] bg-surface p-4"
      >
        {/* Badge */}
        <motion.div
          className="absolute -right-2 -top-2"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={springs.bouncy}
        >
          <Trophy className="h-6 w-6 text-[var(--accent-warm)]" />
        </motion.div>
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 25. Streak Maintained ─────────────────────────────────────
  streakMaintained: {
    trigger: 'User completes their daily study goal, maintaining their streak',
    animation: {
      flamePulse: {
        animate: { scale: [1, 1.3, 1.15, 1] },
        transition: { duration: 0.5, ease: easing.out },
      },
      flameGlow: {
        animate: {
          filter: ['drop-shadow(0 0 0 transparent)', 'drop-shadow(0 0 6px hsl(25 95% 53% / 0.5))', 'drop-shadow(0 0 2px hsl(25 95% 53% / 0.2))'],
        },
        transition: { duration: 0.6 },
      },
      counter: { countUp: true, duration: 0.3 },
    },
    visual: `
      Flame icon (Lucide "Flame"): scales up 1 -> 1.3 -> 1.15 -> 1 over 500ms
        The 1.3 -> 1.15 double-bounce makes it feel like the flame is "surging"
      Color: icon pulses to --severity-high (orange, hsl(25 95% 53%))
        with an orange glow (drop-shadow) that lingers at 20% opacity
      Streak number: if it increments, the number counter animates (see #27)
      Position: in the status bar at the bottom, next to the streak indicator
    `,
    sound: 'success',
    reducedMotion: 'Flame icon does not scale. Number updates instantly. Glow appears as static style.',
    implementation: `
      // Streak indicator in status bar:
      <div className="flex items-center gap-1.5">
        <motion.div
          key={streakCount} // re-triggers on increment
          animate={{ scale: [1, 1.3, 1.15, 1] }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Flame className="h-4 w-4 text-[hsl(25_95%_53%)]
            drop-shadow-[0_0_2px_hsl(25_95%_53%/0.2)]" />
        </motion.div>
        <span className="text-xs font-semibold tabular-nums text-foreground">
          {streakCount}
        </span>
      </div>
    `,
  } satisfies MicroInteraction,

  // ── 26. Achievement Unlocked ──────────────────────────────────
  achievementUnlocked: {
    trigger: 'User earns an achievement (first design, 10 quizzes, etc.)',
    animation: {
      toast: {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: springs.snappy,
      },
      badge: {
        initial: { scale: 0 },
        animate: { scale: [0, 1.2, 1] },
        transition: springs.bouncy,
      },
      particles: {
        count: 30,
        spread: 120,
        origin: 'badge-center',
        colors: ['#facc15', '#f59e0b', '#fbbf24', '#a855f7'],
        duration: 1000,
      },
    },
    visual: `
      Toast notification: slides in from right (standard toast animation)
        But with a WIDER width (w-96 instead of w-80)
        Contains: achievement icon + title + description
      Badge icon: bounces in with scale overshoot (0 -> 1.2 -> 1)
        using springs.bouncy (stiffness: 400, damping: 20, mass: 0.5)
      Particle burst: 30 particles explode from the badge center
        Colors: gold (#facc15), amber (#f59e0b), yellow (#fbbf24), violet (#a855f7)
        Spread: 120 degrees (upward fan, not full 360 — avoids obstructing content)
        Duration: 1000ms total (particles fade out over final 300ms)
        Renderer: Canvas2D overlay (per performanceLimits.particleRenderer)
      Sound: chime (longer than standard success — celebratory)
    `,
    sound: 'success',
    reducedMotion: 'Toast appears instantly. Badge appears at full scale. No particles.',
    implementation: `
      // Achievement toast (enhanced variant):
      function AchievementToast({ title, description, icon: Icon }) {
        return (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={springs.snappy}
            className="pointer-events-auto flex w-96 items-start gap-3 rounded-lg
              border border-[var(--accent-warm)]/30 bg-surface p-4 shadow-xl"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={springs.bouncy}
              className="flex h-10 w-10 items-center justify-center rounded-full
                bg-[var(--accent-warm)]/10"
            >
              <Icon className="h-5 w-5 text-[var(--accent-warm)]" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-foreground-muted">{description}</p>
            </div>
          </motion.div>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 27. Score Counter Animation ───────────────────────────────
  scoreReveal: {
    trigger: 'Score value is revealed (quiz result, design review score, leaderboard rank)',
    animation: {
      countUp: {
        from: 0,
        to: 'targetValue',
        duration: 0.8,
        ease: easing.out,
      },
    },
    visual: `
      Number: counts up from 0 to the target value over 800ms
        Uses ease-out timing — starts fast, decelerates as it approaches the target
        Font: tabular-nums (monospace digits) to prevent layout shift during count
        Size: text-3xl font-bold (large, prominent)
      Suffix: "%" or "/100" or "pts" appears simultaneously at full opacity
      Color: changes during count based on thresholds:
        0-40: --state-error (red)
        41-70: --state-warning (amber)
        71-89: --foreground (white)
        90-100: --state-success (green) + brief glow at landing
      Landing: when counter reaches final value, a subtle scale pulse (1 -> 1.05 -> 1)
        signals "this is the final number"
    `,
    sound: null,
    reducedMotion: 'Final number appears instantly. No count-up animation. Color is based on final value.',
    implementation: `
      // useCountUp hook:
      function useCountUp(target: number, duration = 0.8) {
        const [value, setValue] = useState(0);
        const controls = useRef<number>();

        useEffect(() => {
          const start = performance.now();
          const step = (now: number) => {
            const elapsed = (now - start) / (duration * 1000);
            const progress = Math.min(elapsed, 1);
            // ease-out curve: cubic-bezier(0.16, 1, 0.3, 1) approximation
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * target));
            if (progress < 1) controls.current = requestAnimationFrame(step);
          };
          controls.current = requestAnimationFrame(step);
          return () => cancelAnimationFrame(controls.current!);
        }, [target, duration]);

        return value;
      }

      // Score component:
      function ScoreReveal({ score, max = 100 }) {
        const displayValue = useCountUp(score);
        const color = score >= 90 ? "text-[var(--state-success)]"
          : score >= 71 ? "text-foreground"
          : score >= 41 ? "text-[var(--state-warning)]"
          : "text-[var(--state-error)]";

        return (
          <motion.span
            className={cn("text-3xl font-bold tabular-nums", color)}
            key={score}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ delay: 0.8, duration: 0.2 }}
          >
            {displayValue}<span className="text-lg text-foreground-muted">/{max}</span>
          </motion.span>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 28. Progress Bar 100% ─────────────────────────────────────
  progressBarComplete: {
    trigger: 'Progress bar value reaches 100% (topic completed, upload finished)',
    animation: {
      glow: {
        animate: {
          boxShadow: [
            '0 0 0 0 rgba(34, 197, 94, 0)',
            '0 0 8px 2px rgba(34, 197, 94, 0.4)',
            '0 0 4px 1px rgba(34, 197, 94, 0.2)',
          ],
        },
        transition: { duration: 0.6, ease: easing.inOut },
      },
      color: {
        backgroundColor: 'var(--state-success)',
        transition: { duration: duration.normal },
      },
      shimmer: {
        backgroundPosition: ['0% 0', '200% 0'],
        transition: { duration: 1, ease: easing.linear },
      },
    },
    visual: `
      Fill color: transitions from --primary (violet) to --state-success (green)
        Signals completion — "green means done"
      Glow: the bar emits a green glow (box-shadow) that pulses once
        Extends 8px, then settles to 4px persistent glow
      Shimmer: a single bright-white gradient sweeps across the bar left-to-right
        Like a "gleam" — runs ONCE on completion, not repeating
        Gradient: transparent -> white at 15% -> transparent
      Checkmark: small check icon appears at the right end of the bar
        Scales in with springs.bouncy
    `,
    sound: 'success',
    reducedMotion: 'Bar fills to 100% instantly. Color changes to green. No glow or shimmer. Checkmark appears instantly.',
    implementation: `
      // Enhanced Progress component — add completion effects:
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full rounded-full",
            percentage === 100 ? "bg-[var(--state-success)]" : "bg-primary"
          )}
          animate={{ width: percentage + "%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
        {percentage === 100 && (
          <>
            {/* Gleam sweep */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent bg-[length:200%_100%]"
              animate={{ backgroundPosition: ["0% 0", "200% 0"] }}
              transition={{ duration: 1, ease: [0, 0, 1, 1] }}
            />
            {/* Glow */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  "0 0 0 0 rgba(34, 197, 94, 0)",
                  "0 0 8px 2px rgba(34, 197, 94, 0.4)",
                  "0 0 4px 1px rgba(34, 197, 94, 0.2)",
                ],
              }}
              transition={{ duration: 0.6, ease: [0.65, 0, 0.35, 1] }}
            />
          </>
        )}
      </div>
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 5: NAVIGATION & TRANSITION (29–35)
// =========================================================================

export const mi_navigation = {

  // ── 29. Page Transition ───────────────────────────────────────
  pageTransition: {
    trigger: 'Route change (Next.js navigation between pages)',
    animation: {
      exit: { opacity: 0, transition: { duration: duration.quick } },
      enter: { opacity: 0, transition: { duration: duration.fast, delay: 0.05 } },
    },
    visual: `
      Strategy: CROSSFADE (not slide, not morph)
        Outgoing page: fades out over 100ms
        Incoming page: fades in over 150ms, starting 50ms after exit begins
        Total perceived transition time: ~200ms
      Why crossfade: slide feels like native mobile (wrong platform), morph is too
        resource-intensive for route-level changes, crossfade is the VS Code way
      Loading bar: thin 2px progress bar at the very top of the viewport
        Color: --primary (violet)
        Animates width from 0% to ~80% during load, then snaps to 100% on complete
        Uses Next.js router events for progress
    `,
    sound: null,
    reducedMotion: 'Instant page swap. No fade. Loading bar still animates (it is informational, not decorative).',
    implementation: `
      // Already implemented via ModuleCrossfade component.
      // Add NProgress-style loading bar:

      // In root layout, add a top loading indicator:
      <motion.div
        className="fixed left-0 top-0 h-0.5 bg-primary"
        style={{ zIndex: "var(--z-toast)", width: loadingProgress + "%" }}
        animate={{ width: loadingProgress + "%" }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      />
    `,
  } satisfies MicroInteraction,

  // ── 30. Mode Switch ───────────────────────────────────────────
  modeSwitch: {
    trigger: 'Click on Activity Bar module icon (HLD, LLD, Algo, DB, etc.)',
    animation: {
      indicator: {
        layout: true,
        transition: springs.smooth,
      },
      contentExit: {
        exit: { opacity: 0 },
        transition: { duration: duration.quick },
      },
      contentEnter: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: duration.fast, delay: 0.05 },
      },
    },
    visual: `
      Activity bar indicator: 3px-wide vertical pill (bg-primary) slides from
        the old module icon to the new one using layout animation
        Spring: smooth (stiffness: 200, damping: 25, mass: 1.0)
        The sliding indicator is the hero of this transition — it creates visual continuity
      Icon states: active icon brightens (text-foreground), others dim (text-foreground-muted)
      Canvas/content area: crossfades (exit 100ms, enter 150ms with 50ms delay)
        This matches the page transition timing for consistency
      Sidebar: content updates to match new module (same crossfade timing)
    `,
    sound: 'click',
    reducedMotion: 'Indicator teleports. Content swaps instantly.',
    implementation: `
      // Activity bar with sliding indicator:
      // Use motion.div with layoutId for the indicator:

      {modules.map((mod) => (
        <button key={mod.id} onClick={() => setActive(mod.id)} className="relative p-2">
          <mod.icon className={cn("h-5 w-5", active === mod.id ? "text-foreground" : "text-foreground-muted")} />
          {active === mod.id && (
            <motion.div
              layoutId="module-indicator"
              className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
              transition={springs.smooth}
            />
          )}
        </button>
      ))}
    `,
  } satisfies MicroInteraction,

  // ── 31. Sidebar Collapse/Expand ───────────────────────────────
  sidebarToggle: {
    trigger: 'Click sidebar collapse button / keyboard shortcut Cmd+B',
    animation: {
      width: { transition: { duration: duration.normal, ease: easing.out } },
      iconRotate: {
        animate: { rotate: 180 },
        transition: { duration: duration.normal, ease: easing.inOut },
      },
      contentFade: {
        exit: { opacity: 0, transition: { duration: 0.08 } },
        enter: { opacity: 1, transition: { duration: 0.12, delay: 0.1 } },
      },
    },
    visual: `
      Panel width: 260px -> 48px (collapse) or 48px -> 260px (expand)
        Animated via react-resizable-panels flex-basis, NOT width (per perf rules)
        Duration: 200ms, ease-out
      Collapse icon: ChevronLeft rotates 180 degrees to become ChevronRight
        Or use the same icon with rotate animation
      Content: text labels fade out in 80ms, then icons-only mode renders
        On expand: icons-only mode fades out, full labels fade in after 100ms delay
      Canvas: smoothly fills the freed space (handled by flex layout)
    `,
    sound: null,
    reducedMotion: 'Width snaps instantly. Icon swaps without rotation. Content appears/disappears instantly.',
    implementation: `
      // Collapse toggle button:
      <motion.button
        onClick={toggleSidebar}
        className="absolute -right-3 top-3 z-10 flex h-6 w-6 items-center justify-center
          rounded-full border border-border bg-surface shadow-sm"
      >
        <motion.div
          animate={{ rotate: collapsed ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.65, 0, 0.35, 1] }}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </motion.div>
      </motion.button>

      // Sidebar content with AnimatePresence:
      <AnimatePresence mode="wait">
        {!collapsed ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            {/* Full sidebar content */}
          </motion.div>
        ) : (
          <motion.div key="collapsed" /* same animation props */ />
        )}
      </AnimatePresence>
    `,
  } satisfies MicroInteraction,

  // ── 32. Bottom Panel Toggle ───────────────────────────────────
  bottomPanelToggle: {
    trigger: 'Click bottom panel header / keyboard shortcut Cmd+J',
    animation: {
      height: { transition: { duration: duration.normal, ease: easing.out } },
      chevron: { rotate: 180, transition: { duration: duration.normal, ease: easing.inOut } },
      content: {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: duration.fast, delay: 0.1 },
      },
    },
    visual: `
      Panel: height animates from 0 to target (200-400px based on content)
        Via react-resizable-panels flex-basis animation
        Ease-out: fast open, gentle landing
      Chevron: rotates 180deg (points down when open, up when closed)
      Content: fades in + slides up 8px with 100ms delay (waits for panel to partially open)
      Separator line: the resize handle brightens during animation
    `,
    sound: null,
    reducedMotion: 'Instant expand/collapse. No height animation. Content appears immediately.',
    implementation: `
      // Bottom panel header toggle:
      <button onClick={togglePanel} className="flex items-center gap-2 px-3 py-1.5">
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.65, 0, 0.35, 1] }}
        >
          <ChevronUp className="h-4 w-4" />
        </motion.div>
        <span className="text-xs text-foreground-muted">Output</span>
      </button>

      // Content fade:
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    `,
  } satisfies MicroInteraction,

  // ── 33. Breadcrumb Separator ──────────────────────────────────
  breadcrumbSeparator: {
    trigger: 'New breadcrumb segment is added (navigation deeper into hierarchy)',
    animation: {
      separator: {
        initial: { opacity: 0, scaleX: 0 },
        animate: { opacity: 0.5, scaleX: 1 },
        transition: { duration: duration.quick, ease: easing.out },
      },
      segment: {
        initial: { opacity: 0, x: -4 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: duration.fast, ease: easing.out },
      },
    },
    visual: `
      New separator (/ or >): scales in from scaleX(0) at 50% opacity
        Origin: center (expands from a point between segments)
      New segment text: slides in 4px from left + fades in (150ms)
      Previous segments: unchanged (no animation on existing segments)
      Hover on segment: text brightens from foreground-muted to foreground (100ms)
    `,
    sound: null,
    reducedMotion: 'Separator and segment appear instantly. No slide or scale.',
    implementation: `
      // In Breadcrumb component, wrap separator and new segments:
      <motion.span
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 0.5, scaleX: 1 }}
        transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="mx-1 text-foreground-subtle"
      >
        /
      </motion.span>
      <motion.span
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      >
        {segment}
      </motion.span>
    `,
  } satisfies MicroInteraction,

  // ── 34. Back Button ───────────────────────────────────────────
  backButton: {
    trigger: 'Click browser back / in-app back button / keyboard shortcut',
    animation: {
      icon: {
        whileTap: { x: -3 },
        transition: springs.snappy,
      },
      pageTransition: {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: duration.normal, ease: easing.out },
      },
    },
    visual: `
      Back arrow icon: nudges 3px left on press (visual "push back" affordance)
        Springs back on release using springs.snappy
      Page content: slides in 20px from the LEFT (directionally consistent)
        Fade in over 200ms with ease-out
        This is the ONLY place we use slide (not crossfade) for page transition
        The left-to-right direction reinforces "going back" spatially
    `,
    sound: null,
    reducedMotion: 'No icon nudge. No page slide. Instant content swap.',
    implementation: `
      // Back button:
      <motion.button
        whileTap={{ x: -3 }}
        transition={springs.snappy}
        onClick={goBack}
        className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </motion.button>

      // Back navigation page enter:
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {pageContent}
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 35. Tab Underline Slide ───────────────────────────────────
  tabUnderlineSlide: {
    trigger: 'Active tab changes (click or keyboard arrow keys)',
    animation: {
      underline: {
        layout: true,
        transition: springs.smooth,
      },
    },
    visual: `
      This is the actual sliding underline (not the hover preview from #5).
      2px tall, bg-primary, positioned at the bottom of the TabsList.
      Width: matches the text width of the active tab trigger.
      Position: animates left/right to align with active tab.
      Uses layoutId="tab-underline" for shared layout animation.
      Spring: smooth (stiffness: 200, damping: 25) — fluid, not snappy.
      When combined with #5 (hover preview): hover shows 30% opacity preview,
        click commits it to full opacity and the layout animation carries it.
    `,
    sound: null,
    reducedMotion: 'Underline teleports to new position. No slide.',
    implementation: `
      // See #10 (tabIndicatorSlide) for the full implementation.
      // The key is using motion.div with layoutId:
      {active === tab.id && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
          transition={springs.smooth}
        />
      )}
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 6: TEXT & TYPOGRAPHY (36–41)
// =========================================================================

export const mi_text = {

  // ── 36. AI Typewriter Effect ──────────────────────────────────
  typewriter: {
    trigger: 'AI response is being streamed (token by token)',
    animation: {
      characterDelay: 15,
      cursorBlink: {
        animate: { opacity: [1, 0] },
        transition: { duration: 0.8, repeat: Infinity, ease: 'steps(1)' },
      },
    },
    visual: `
      Characters: appear one at a time, ~15ms per character (66 chars/sec)
        Each character fades in from opacity 0 -> 1 instantly (no fade — too slow per char)
      Cursor: blinking vertical bar (2px wide, 1em tall, bg-primary)
        Blinks using CSS steps(1) — hard on/off, not smooth fade (matches terminal feel)
        Positioned after the last character
        Disappears when stream completes
      Code blocks: when a code block starts (backtick fence detected),
        switch from typewriter to instant-reveal per line (typewriter on code is annoying)
      Markdown: rendered progressively — headings, bold, links resolve as tokens complete
    `,
    sound: null,
    reducedMotion: 'Text appears in chunks (paragraph at a time) instead of character by character. No cursor blink.',
    implementation: `
      // Typewriter component:
      function Typewriter({ text, speed = 15 }) {
        const [displayed, setDisplayed] = useState("");
        const [isComplete, setIsComplete] = useState(false);

        useEffect(() => {
          let i = 0;
          const interval = setInterval(() => {
            if (i < text.length) {
              setDisplayed(text.slice(0, ++i));
            } else {
              setIsComplete(true);
              clearInterval(interval);
            }
          }, speed);
          return () => clearInterval(interval);
        }, [text, speed]);

        return (
          <span>
            {displayed}
            {!isComplete && (
              <motion.span
                className="inline-block h-[1em] w-0.5 translate-y-[2px] bg-primary"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "steps(1)" }}
              />
            )}
          </span>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 37. Number Counter Animation ──────────────────────────────
  numberCounter: {
    trigger: 'Numeric value changes (metrics, scores, counts, timers)',
    animation: {
      digitSlide: {
        exit: { y: -20, opacity: 0 },
        enter: { y: 0, opacity: 1 },
        transition: springs.snappy,
      },
    },
    visual: `
      Strategy: individual digits SLIDE vertically (like an odometer / slot machine)
      Old digit: slides UP and fades out
      New digit: slides UP from below and fades in
      Only the CHANGED digits animate — stable digits stay put
      Font: tabular-nums is REQUIRED (prevents layout shift between digits)
      Direction: always slides up (incrementing feels like "rising")
        Exception: for timers counting down, slides DOWN
      Spring: snappy (fast enough to not feel laggy on rapid updates)
    `,
    sound: null,
    reducedMotion: 'Number updates instantly. No slide animation.',
    implementation: `
      // AnimatedDigit component:
      function AnimatedDigit({ value }: { value: string }) {
        return (
          <span className="relative inline-block overflow-hidden" style={{ width: "0.6em" }}>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={value}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={springs.snappy}
                className="inline-block tabular-nums"
              >
                {value}
              </motion.span>
            </AnimatePresence>
          </span>
        );
      }

      // Usage:
      function AnimatedNumber({ value }: { value: number }) {
        const digits = String(value).split("");
        return (
          <span className="inline-flex tabular-nums">
            {digits.map((d, i) => <AnimatedDigit key={i} value={d} />)}
          </span>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 38. Code Syntax Line-by-Line ──────────────────────────────
  codeSyntaxReveal: {
    trigger: 'Code example appears in a lesson / walkthrough step advances',
    animation: {
      lineStagger: 0.06,
      lineAppear: {
        initial: { opacity: 0, x: -6 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: duration.fast, ease: easing.out },
      },
    },
    visual: `
      Each line of code slides in from 6px left + fades in
      Stagger: 60ms per line (fast enough for ~15 lines to feel snappy)
      Max animated: 20 lines — beyond that, all remaining appear instantly
      Syntax highlighting: colors are present from frame 1 (no "flash of unstyled code")
      Line numbers: appear WITH their line (not separately)
      Highlighted lines (if any): get a yellow-left-border after all lines appear
    `,
    sound: null,
    reducedMotion: 'All lines appear simultaneously. No stagger.',
    implementation: `
      // Wrap each line in a code block:
      {lines.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: 0.15,
            delay: Math.min(i, 20) * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="flex"
        >
          <span className="w-8 select-none text-right text-foreground-subtle">{i + 1}</span>
          <pre className="flex-1">{line}</pre>
        </motion.div>
      ))}
    `,
  } satisfies MicroInteraction,

  // ── 39. Lesson Text Scroll Reveal ─────────────────────────────
  scrollReveal: {
    trigger: 'Element enters viewport while scrolling (IntersectionObserver threshold: 0.15)',
    animation: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.moderate, ease: easing.out },
    },
    visual: `
      Paragraphs, headings, images, and callout blocks slide up 12px + fade in
        when 15% of the element is visible in the viewport
      Duration: 300ms (moderate — enough to notice without being slow)
      Stagger: if multiple elements enter at once, stagger at 80ms intervals
      Only animate ONCE — elements don't re-animate when scrolled out and back in
      Images: additionally scale from 0.98 -> 1 (subtle zoom-in for visual interest)
    `,
    sound: null,
    reducedMotion: 'All content visible immediately. No scroll-triggered animation.',
    implementation: `
      // useScrollReveal hook:
      function useScrollReveal(ref: RefObject<HTMLElement>) {
        const [isVisible, setIsVisible] = useState(false);

        useEffect(() => {
          const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.15 }
          );
          if (ref.current) observer.observe(ref.current);
          return () => observer.disconnect();
        }, [ref]);

        return isVisible;
      }

      // ScrollReveal wrapper:
      function ScrollReveal({ children, delay = 0 }) {
        const ref = useRef(null);
        const isVisible = useScrollReveal(ref);

        return (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 12 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        );
      }
    `,
  } satisfies MicroInteraction,

  // ── 40. Error Message Shake ───────────────────────────────────
  errorShake: {
    trigger: 'Form validation error / invalid input submitted',
    animation: {
      shake: {
        x: [0, -4, 4, -3, 3, -1, 1, 0],
        transition: { duration: 0.35, ease: easing.linear },
      },
    },
    visual: `
      The error message container (or the input field itself) shakes horizontally
      Pattern: [-4, 4, -3, 3, -1, 1, 0] — decreasing amplitude (settling)
      Duration: 350ms (slightly faster than the wrong quiz answer shake)
      Color: text appears in --error-text, bg tints to --error-bg
      Border: input border flashes --state-error
      Icon: AlertCircle appears at the left of the message (scales in)
    `,
    sound: 'error',
    reducedMotion: 'No shake. Error message appears instantly with red styling. Border changes instantly.',
    implementation: `
      // Error message component:
      <motion.div
        animate={{ x: [0, -4, 4, -3, 3, -1, 1, 0] }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-2 rounded-md bg-[var(--error-bg)] px-3 py-2
          text-sm text-[var(--error-text)]"
      >
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{message}</span>
      </motion.div>

      // Input field error border:
      <input className={cn(
        "border transition-colors duration-[150ms]",
        hasError ? "border-[var(--state-error)] focus:ring-[var(--state-error)]" : "border-input"
      )} />
    `,
  } satisfies MicroInteraction,

  // ── 41. Placeholder Text Pulse ────────────────────────────────
  placeholderPulse: {
    trigger: 'Empty input field / search bar is focused but empty',
    animation: {
      pulse: {
        animate: { opacity: [0.4, 0.7, 0.4] },
        transition: { duration: 2, repeat: Infinity, ease: easing.inOut },
      },
    },
    visual: `
      Placeholder text gently pulses opacity between 0.4 and 0.7 over 2s cycle
      Only activates when the input is FOCUSED and EMPTY
      Stops pulsing when user starts typing (placeholder hides anyway)
      Subtle enough to not be distracting — just says "I'm ready for input"
      Color: text-foreground-subtle (never changes hue, only opacity)
    `,
    sound: null,
    reducedMotion: 'Static placeholder at 0.5 opacity. No pulse.',
    implementation: `
      // CSS-only approach using Tailwind:
      // Add a custom animation to the input when focused and empty:
      <input
        className="placeholder:text-foreground-subtle
          placeholder:transition-opacity
          focus:placeholder:animate-[pulse-subtle_2s_ease-in-out_infinite]"
      />

      // In globals.css:
      @keyframes pulse-subtle {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.7; }
      }

      // Reduced motion:
      @media (prefers-reduced-motion: reduce) {
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.5; }
        }
      }
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 7: CANVAS SPECIFIC (42–48)
// =========================================================================

export const mi_canvas = {

  // ── 42. Node Snap to Grid ─────────────────────────────────────
  nodeSnapToGrid: {
    trigger: 'Node drag ends — node position rounds to nearest grid point',
    animation: {
      snap: {
        transition: springs.snappy,
      },
    },
    visual: `
      Node "settles" into the grid position using springs.snappy
      Stiffness 300, damping 30 — quick snap with minimal overshoot
      Grid size: 20px (matches --canvas-dot spacing)
      If node is already on-grid, no animation occurs
      The snap distance is always less than 10px (half grid), so it feels immediate
      Node shadow: returns to resting state (shadow-md) after the settle
    `,
    sound: 'drop',
    reducedMotion: 'Node teleports to grid position. No spring.',
    implementation: `
      // In React Flow onNodeDragStop handler:
      const snappedX = Math.round(node.position.x / 20) * 20;
      const snappedY = Math.round(node.position.y / 20) * 20;
      setNodes((nds) => nds.map((n) =>
        n.id === node.id ? { ...n, position: { x: snappedX, y: snappedY } } : n
      ));
      // The node component uses motion.div with transition={springs.snappy}
      // on its position, so the snap is animated automatically.
    `,
  } satisfies MicroInteraction,

  // ── 43. Edge Connection Snap ──────────────────────────────────
  edgeConnectionSnap: {
    trigger: 'Dragging an edge endpoint near a compatible port — magnetic snap',
    animation: {
      snap: { transition: springs.stiff },
      glow: {
        animate: {
          boxShadow: '0 0 8px 2px hsl(258 78% 64% / 0.4)',
          scale: 1.5,
        },
        transition: springs.snappy,
      },
      connected: {
        animate: { scale: [1.5, 1.8, 1] },
        transition: { duration: 0.3, ease: easing.out },
      },
    },
    visual: `
      Proximity detection: within 24px of a compatible port
      Port glow: the target port scales 1 -> 1.5 with a violet glow (magnetic attraction)
      Edge preview: the edge path curves toward the port (bezier control point shifts)
      On connection: port pulses 1.5 -> 1.8 -> 1 ("latch" feedback)
        Glow brightens momentarily then settles
        Edge solidifies (opacity 0.6 -> 1, stroke-width 1 -> 2)
      Incompatible port: no glow, port stays dim (no error state, just no response)
    `,
    sound: 'connect',
    reducedMotion: 'Port highlights instantly. Edge connects without animation. No glow pulse.',
    implementation: `
      // Port component on the node:
      <motion.div
        animate={isNearby ? {
          scale: 1.5,
          boxShadow: "0 0 8px 2px hsl(258 78% 64% / 0.4)",
        } : {
          scale: 1,
          boxShadow: "0 0 0 0 transparent",
        }}
        transition={springs.snappy}
        className="h-3 w-3 rounded-full border-2 border-primary bg-surface"
      />

      // On successful connection:
      <motion.div
        key={connectionTimestamp}
        animate={{ scale: [1.5, 1.8, 1] }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    `,
  } satisfies MicroInteraction,

  // ── 44. Node Resize ───────────────────────────────────────────
  nodeResize: {
    trigger: 'Hover reveals handles; drag handle to resize',
    animation: {
      handlesReveal: {
        initial: { opacity: 0, scale: 0 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: duration.quick, ease: easing.out },
      },
      resize: { transition: springs.stiff },
    },
    visual: `
      Handles: 8 resize handles (4 corners + 4 edges) appear on hover
        Small squares (6x6px) with bg-primary border-2 border-surface
        Fade in + scale from 0 over 100ms
        Cursors: nw-resize, ne-resize, sw-resize, se-resize, n-resize, etc.
      During resize: node dimensions follow cursor with springs.stiff
        (high stiffness, high damping — precise tracking with no overshoot)
      Minimum size: 120x80px (prevents nodes from becoming too small)
      Aspect ratio: not locked (nodes can be any proportion)
    `,
    sound: null,
    reducedMotion: 'Handles appear instantly. Resize is direct (no spring).',
    implementation: `
      // Resize handles container:
      <div className="absolute inset-0 opacity-0 transition-opacity duration-[100ms]
        group-hover:opacity-100">
        {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((pos) => (
          <div
            key={pos}
            className={cn(
              "absolute h-1.5 w-1.5 rounded-sm border-2 border-surface bg-primary",
              positionClasses[pos], cursorClasses[pos]
            )}
            onPointerDown={(e) => startResize(e, pos)}
          />
        ))}
      </div>
    `,
  } satisfies MicroInteraction,

  // ── 45. Canvas Zoom ───────────────────────────────────────────
  canvasZoom: {
    trigger: 'Scroll wheel / pinch gesture / zoom button click / Cmd+/Cmd-',
    animation: {
      transform: {
        transition: { duration: duration.fast, ease: easing.out },
      },
    },
    visual: `
      Zoom: smooth CSS transform scale from current to target level
      Duration: 150ms per step (fast enough to feel responsive, smooth enough to track)
      Zoom levels: discrete steps [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
      Origin: zooms toward cursor position (for scroll/pinch) or viewport center (for buttons)
      Minimap: viewport rectangle updates in real-time during zoom
      Zoom indicator: bottom-right badge shows current zoom % (fades out after 1.5s of inactivity)
    `,
    sound: null,
    reducedMotion: 'Instant zoom snap. No transition between levels.',
    implementation: `
      // React Flow zoom transition:
      // Set React Flow's defaultViewport transition:
      <ReactFlow
        minZoom={0.25}
        maxZoom={2}
        // The zoom transition is handled by React Flow internally.
        // Override via CSS on the .react-flow__viewport:
      />

      // Zoom indicator:
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isZooming ? 1 : 0 }}
        transition={{ duration: 0.15 }}
        className="fixed bottom-16 right-4 rounded-md bg-surface px-2 py-1
          text-xs text-foreground-muted shadow-md"
      >
        {Math.round(zoom * 100)}%
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 46. Minimap Viewport Drag ─────────────────────────────────
  minimapViewportDrag: {
    trigger: 'Dragging the viewport rectangle within the minimap',
    animation: {
      viewport: { transition: { duration: 0 } },
    },
    visual: `
      Zero latency: the viewport rectangle tracks the mouse with NO spring and NO delay
        This is critical — any lag here makes the minimap feel broken
        transition: { duration: 0 } — purely imperative position updates
      Canvas panning: the main canvas pans in real-time as the minimap viewport moves
        Also zero-delay — direct 1:1 mapping scaled by minimap ratio
      Viewport rectangle: semi-transparent primary color fill (hsl(258 78% 64% / 0.15))
        with 1px primary border
      Minimap nodes: simplified colored rectangles (no labels, no detail)
    `,
    sound: null,
    reducedMotion: 'Same behavior. This is direct manipulation, not decorative animation.',
    implementation: `
      // React Flow handles minimap natively.
      // Key: ensure no CSS transitions are applied to .react-flow__minimap-viewport
      // Override if needed:
      .react-flow__minimap-viewport {
        transition: none !important;
      }
    `,
  } satisfies MicroInteraction,

  // ── 47. Auto-Layout ───────────────────────────────────────────
  autoLayout: {
    trigger: 'User clicks "Auto-layout" / "Organize" button in toolbar',
    animation: {
      nodeReposition: {
        transition: { ...springs.gentle, staggerChildren: 0 },
      },
    },
    visual: `
      All nodes animate simultaneously to their new computed positions
      Spring: gentle (stiffness: 150, damping: 20, mass: 1.2)
        Slower than most interactions — gives the user time to track all movements
        The heavier mass (1.2) creates a "weighted" feel, like furniture sliding into place
      Edges: follow their nodes (SVG paths recalculate each frame)
      Duration: typically 400-600ms depending on distance traveled
      No stagger: all nodes move at the same time (stagger would be chaotic with many nodes)
    `,
    sound: null,
    reducedMotion: 'All nodes teleport to new positions instantly. No spring animation.',
    implementation: `
      // After computing new layout (dagre/elk):
      const newPositions = computeLayout(nodes, edges);

      setNodes((nds) => nds.map((n) => ({
        ...n,
        position: newPositions[n.id],
        // React Flow nodes use motion values internally
        // The transition is applied via React Flow's nodesDraggable + animate
      })));

      // If using custom motion nodes:
      <motion.div
        animate={{ x: position.x, y: position.y }}
        transition={springs.gentle}
      />
    `,
  } satisfies MicroInteraction,

  // ── 48. Edge Path Draw ────────────────────────────────────────
  edgePathDraw: {
    trigger: 'User drags from a port to create a new edge (real-time path preview)',
    animation: {
      pathPreview: {
        strokeDasharray: 5,
        strokeDashoffset: { animate: { to: -10 }, transition: { duration: 0.5, repeat: Infinity, ease: easing.linear } },
      },
      pathConfirm: {
        strokeDasharray: 0,
        strokeWidth: { from: 1, to: 2 },
        opacity: { from: 0.5, to: 1 },
        transition: { duration: duration.fast, ease: easing.out },
      },
    },
    visual: `
      While dragging:
        Dashed line (5px dash, 5px gap) follows cursor from source port
        Dash animation: marching ants effect (strokeDashoffset animates continuously)
        Path type: smooth bezier curve (control points calculated from source/target angles)
        Color: --primary at 50% opacity
        Stroke width: 1px (thin — it's a preview, not a committed edge)
      On connection:
        Dashes dissolve to solid line (strokeDasharray animates to 0)
        Opacity: 0.5 -> 1
        Stroke width: 1 -> 2 (thickens to match committed edges)
        Color: becomes the edge type color (data flow = green, dependency = gray, etc.)
      On cancel (release in empty space):
        Path shrinks back toward source port (pathLength 1 -> 0) over 150ms
    `,
    sound: null,
    reducedMotion: 'No marching ants. Static dashed line while dragging. Instant solid on connection.',
    implementation: `
      // Preview edge (while dragging):
      <motion.path
        d={pathD}
        stroke="var(--primary)"
        strokeWidth={1}
        strokeOpacity={0.5}
        strokeDasharray="5 5"
        fill="none"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0" to="-10"
          dur="0.5s"
          repeatCount="indefinite"
        />
      </motion.path>

      // Confirmed edge:
      <motion.path
        d={pathD}
        initial={{ strokeDasharray: "5 5", strokeWidth: 1, opacity: 0.5 }}
        animate={{ strokeDasharray: "0 0", strokeWidth: 2, opacity: 1 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        stroke={edgeTypeColor}
        fill="none"
      />
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 8: DATA VISUALIZATION (49–53)
// =========================================================================

export const mi_dataViz = {

  // ── 49. Chart Data Point Hover ────────────────────────────────
  chartPointHover: {
    trigger: 'Mouse enters the hitbox of a data point on a chart',
    animation: {
      point: {
        animate: { r: 6, strokeWidth: 2 },
        transition: { duration: duration.quick, ease: easing.out },
      },
      tooltip: {
        initial: { opacity: 0, y: -4 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: duration.quick, ease: easing.out },
      },
    },
    visual: `
      Data point circle: radius 4px -> 6px (50% larger)
        Stroke: appears at 2px in the series color
        Fill: white or series color at full opacity
      Tooltip: fades in + slides down 4px from above the point
        Background: --viz-tooltip-bg (dark surface)
        Border: --viz-tooltip-border (subtle white opacity)
        Text: --viz-tooltip-text (light)
        Contains: label, value, optional delta
      Crosshair: optional vertical line at x-position (dashed, 1px, foreground-subtle at 30%)
      Adjacent points: no change (only the hovered point enlarges)
    `,
    sound: null,
    reducedMotion: 'Point enlarges instantly. Tooltip appears instantly. No slide.',
    implementation: `
      // SVG data point:
      <motion.circle
        cx={x} cy={y}
        r={isHovered ? 6 : 4}
        fill={isHovered ? color : "var(--surface)"}
        stroke={color}
        strokeWidth={isHovered ? 2 : 0}
        transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
      />

      // Tooltip:
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-md border border-[var(--viz-tooltip-border)]
          bg-[var(--viz-tooltip-bg)] px-3 py-2 text-xs text-[var(--viz-tooltip-text)]
          shadow-lg"
      >
        <p className="font-medium">{label}</p>
        <p className="tabular-nums">{value}</p>
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 50. Metric Gauge Fill ─────────────────────────────────────
  metricGaugeFill: {
    trigger: 'Gauge component mounts or value changes',
    animation: {
      arc: {
        initial: { strokeDashoffset: '100%' },  // circumference calculated at runtime
        animate: { strokeDashoffset: '0%' },     // targetOffset calculated at runtime
        transition: springs.smooth,
      },
      number: { countUp: true, duration: 0.8 },
    },
    visual: `
      Circular arc (SVG): fills clockwise from 12 o'clock position
        Uses strokeDasharray + strokeDashoffset trick
        Spring: smooth (stiffness: 200, damping: 25) for organic fill motion
      Track: full circle in bg-muted (gray, always visible)
      Fill: arc in the semantic color based on value:
        0-40%: --state-error (red)
        41-70%: --state-warning (amber)
        71-89%: --primary (violet)
        90-100%: --state-success (green)
      Center number: counts up from 0 to value (see #27)
      Label: static text below the number (e.g., "Uptime", "SLA")
    `,
    sound: null,
    reducedMotion: 'Arc appears at final position instantly. Number shows final value.',
    implementation: `
      // Gauge component:
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (value / 100) * circumference;

      <svg viewBox="0 0 120 120" className="h-24 w-24">
        {/* Track */}
        <circle cx="60" cy="60" r={radius}
          fill="none" stroke="var(--muted)" strokeWidth="8" />
        {/* Fill */}
        <motion.circle cx="60" cy="60" r={radius}
          fill="none" stroke={gaugeColor}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={springs.smooth}
          transform="rotate(-90 60 60)"
        />
      </svg>
    `,
  } satisfies MicroInteraction,

  // ── 51. Sparkline Draw ────────────────────────────────────────
  sparklineDraw: {
    trigger: 'Sparkline chart enters viewport or data loads',
    animation: {
      path: {
        initial: { pathLength: 0 },
        animate: { pathLength: 1 },
        transition: { duration: duration.slow, ease: easing.out },
      },
      fill: {
        initial: { opacity: 0 },
        animate: { opacity: 0.1 },
        transition: { duration: duration.slow, delay: 0.2, ease: easing.out },
      },
    },
    visual: `
      Line: SVG path draws in from LEFT to RIGHT (pathLength 0 -> 1)
        Duration: 500ms (slow — sparklines are small, need time to "read" the shape)
        Stroke: 1.5px, series color
        Stroke cap: round
      Area fill: gradient below the line fades in at 10% opacity
        Starts 200ms after line begins drawing (so line leads, fill follows)
        Gradient: series color at top -> transparent at bottom
      If sparkline represents negative trend: stroke color is --state-error (red)
      If positive: --state-success (green)
      If neutral: --primary (violet)
    `,
    sound: null,
    reducedMotion: 'Line and fill appear instantly at full state.',
    implementation: `
      <svg viewBox="0 0 100 30" className="h-8 w-20" preserveAspectRatio="none">
        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill={color}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
    `,
  } satisfies MicroInteraction,

  // ── 52. Pie Chart Segment Hover ───────────────────────────────
  pieSegmentHover: {
    trigger: 'Mouse enters a pie/donut chart segment',
    animation: {
      separate: {
        transform: 'translate toward center-outward by 4px',
        transition: { duration: duration.quick, ease: easing.out },
      },
    },
    visual: `
      Hovered segment: translates 4px outward from the pie center
        Direction: calculated from the segment's midpoint angle
        This creates a "pull-out" effect common in premium dashboards
      Opacity: other segments dim to 70% opacity
      Stroke: hovered segment gets a 2px white stroke (separation line)
      Label: segment label + value appears near the segment (or in a central tooltip)
      Scale: no scale change on the segment itself (just translation)
    `,
    sound: null,
    reducedMotion: 'Segment separates instantly. Other segments dim instantly.',
    implementation: `
      // Per pie segment:
      const midAngle = (startAngle + endAngle) / 2;
      const offsetX = Math.cos(midAngle) * 4;
      const offsetY = Math.sin(midAngle) * 4;

      <motion.path
        d={arcPath}
        fill={color}
        animate={{
          transform: isHovered
            ? "translate(" + offsetX + "px," + offsetY + "px)"
            : "translate(0,0)",
          opacity: someSegmentHovered && !isHovered ? 0.7 : 1,
        }}
        transition={{ duration: 0.1, ease: [0.16, 1, 0.3, 1] }}
        stroke={isHovered ? "white" : "var(--surface)"}
        strokeWidth={isHovered ? 2 : 1}
      />
    `,
  } satisfies MicroInteraction,

  // ── 53. Bar Chart Grow ────────────────────────────────────────
  barChartGrow: {
    trigger: 'Bar chart enters viewport or data loads',
    animation: {
      bar: {
        initial: { scaleY: 0 },
        animate: { scaleY: 1 },
        transition: { duration: duration.moderate, ease: easing.out },
      },
      stagger: stagger.chartDataPoints,
    },
    visual: `
      Each bar grows from BOTTOM to TOP (scaleY 0 -> 1, origin bottom)
      Stagger: 20ms per bar (fast — bars should feel like a wave)
      Max animated: 50 bars (beyond that, appear instantly)
      Easing: ease-out (fast initial growth, gentle deceleration at top)
      Bar border-radius: rounded-t-sm (only top corners rounded)
      Hover state (see #49): bar brightens, tooltip appears above
    `,
    sound: null,
    reducedMotion: 'All bars appear at full height instantly. No grow animation.',
    implementation: `
      {data.map((d, i) => (
        <motion.rect
          key={d.id}
          x={xScale(d.label)}
          y={yScale(d.value)}
          width={barWidth}
          height={chartHeight - yScale(d.value)}
          fill={color}
          rx={2}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            duration: 0.3,
            delay: Math.min(i, 50) * 0.02,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ originY: "100%" }}
        />
      ))}
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// SECTION 9: DELIGHTFUL SURPRISES (54–58)
// =========================================================================

export const mi_delight = {

  // ── 54. Konami Code Easter Egg ────────────────────────────────
  konamiCode: {
    trigger: 'User types the Konami code: Up Up Down Down Left Right Left Right B A',
    animation: {
      confetti: {
        particleCount: 200,
        spread: 360,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#a855f7', '#facc15', '#3b82f6', '#22c55e', '#ef4444', '#f97316'],
        gravity: 0.5,
        ticks: 150,
        duration: 3000,
      },
    },
    visual: `
      Massive confetti explosion from viewport center
      200 particles (double the standard celebration)
      Colors: violet, gold, blue, green, red, orange (full rainbow)
      Duration: 3 seconds
      Toast appears: "You found it! Achievement: Secret Developer"
        Toast type: special (not success/info — unique gold border)
      Background: brief flash of --primary at 5% opacity (barely visible violet wash)
      Sound: the algo-complete arpeggio plays
      Achievement: permanently unlocked in user profile
    `,
    sound: 'algo-complete',
    reducedMotion: 'No confetti. Toast still appears. Background flash skipped.',
    implementation: `
      // useKonamiCode hook:
      const KONAMI = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","KeyB","KeyA"];

      function useKonamiCode(callback: () => void) {
        const index = useRef(0);

        useEffect(() => {
          function handler(e: KeyboardEvent) {
            if (e.code === KONAMI[index.current]) {
              index.current++;
              if (index.current === KONAMI.length) {
                callback();
                index.current = 0;
              }
            } else {
              index.current = 0;
            }
          }
          window.addEventListener("keydown", handler);
          return () => window.removeEventListener("keydown", handler);
        }, [callback]);
      }

      // In root layout:
      useKonamiCode(() => {
        confetti({ particleCount: 200, spread: 360, origin: { x: 0.5, y: 0.5 },
          colors: ["#a855f7", "#facc15", "#3b82f6", "#22c55e", "#ef4444", "#f97316"],
          gravity: 0.5, ticks: 150 });
        toast("success", "You found it! Achievement: Secret Developer");
        play("algo-complete");
      });
    `,
  } satisfies MicroInteraction,

  // ── 55. 100th Correct Quiz Answer ─────────────────────────────
  hundredthCorrect: {
    trigger: 'User reaches exactly 100 lifetime correct quiz answers',
    animation: {
      confetti: { particleCount: 150, spread: 180, origin: { x: 0.5, y: 0.3 } },
      banner: {
        initial: { scaleY: 0, opacity: 0 },
        animate: { scaleY: 1, opacity: 1 },
        transition: springs.bouncy,
      },
      counter: {
        animate: { scale: [1, 1.5, 1], color: ['var(--foreground)', 'var(--accent-warm)', 'var(--foreground)'] },
        transition: { duration: 0.8 },
      },
    },
    visual: `
      The normal correct-answer feedback plays first (green border, checkmark)
      Then, 500ms later:
        Confetti: 150 particles from top-center (y: 0.3), spreading downward
          Colors: gold and violet only (celebration + brand)
        Banner: a congratulatory banner slides in from top of the quiz panel
          "100 correct answers! You're on fire!"
          Gold gradient background (from --accent-warm to amber-400)
          White text, trophy icon at left
          Uses springs.bouncy for playful entrance
        Counter: the "100" number in the banner pulses large (1.5x) then settles
          Color flashes from white -> gold -> white
      Dismissable: banner closes with a small X button after 5 seconds
    `,
    sound: 'algo-complete',
    reducedMotion: 'Banner appears instantly. No confetti. Counter shows "100" without animation.',
    implementation: `
      // Check after each correct answer:
      if (totalCorrect === 100) {
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 180, origin: { x: 0.5, y: 0.3 },
            colors: ["#facc15", "#a855f7"] });
          setShowCenturyBanner(true);
          play("algo-complete");
        }, 500);
      }

      // CenturyBanner component:
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={springs.bouncy}
        style={{ originY: 0 }}
        className="overflow-hidden rounded-lg bg-gradient-to-r from-[var(--accent-warm)]
          to-amber-400 px-4 py-3 text-white shadow-lg"
      >
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6" />
          <div>
            <p className="text-sm font-semibold">
              <motion.span
                animate={{ scale: [1, 1.5, 1], color: ["#fff", "#facc15", "#fff"] }}
                transition={{ duration: 0.8 }}
              >
                100
              </motion.span>{" "}
              correct answers!
            </p>
            <p className="text-xs text-white/80">You are on fire!</p>
          </div>
        </div>
      </motion.div>
    `,
  } satisfies MicroInteraction,

  // ── 56. First System Design ───────────────────────────────────
  firstDesign: {
    trigger: 'User saves their first system design (canvas has at least 2 nodes and 1 edge)',
    animation: {
      toast: {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: springs.snappy,
      },
    },
    visual: `
      Toast notification: appears from the right
        Message: "Your first architecture! Welcome to the real world."
        Type: info (blue tint, not success — this is a milestone, not a grade)
        Icon: Lucide "Rocket" instead of the standard Info icon
        Duration: 6000ms (longer than default — let the moment land)
        Border: subtle violet tint (--primary at 20% border opacity)
      This only fires ONCE per user lifetime (stored in user preferences/localStorage)
    `,
    sound: 'notification',
    reducedMotion: 'Toast appears instantly. No slide animation.',
    implementation: `
      // In canvas save handler:
      const hasFirstDesign = localStorage.getItem("architex:first-design");
      if (!hasFirstDesign && nodes.length >= 2 && edges.length >= 1) {
        localStorage.setItem("architex:first-design", "true");
        toast("info", "Your first architecture! Welcome to the real world.");
        play("notification");
      }
    `,
  } satisfies MicroInteraction,

  // ── 57. Late Night Coding ─────────────────────────────────────
  lateNightCoding: {
    trigger: 'User is active between 11 PM and 4 AM local time',
    animation: {
      statusBar: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: duration.moderate },
      },
    },
    visual: `
      Status bar (bottom of workspace): a small message appears at the right side
        Text: "Burning the midnight oil" (no emoji in the code — just text)
        Icon: Lucide "Moon" icon to the left of the text
        Color: text-foreground-subtle (very dim — not attention-grabbing)
        Appears: fades in when the hour transitions into the 23-03 range
        Disappears: fades out when user leaves the time range or after 1 hour
      Completely non-intrusive — most users won't even notice it
      No sound — late-night users don't want noise
    `,
    sound: null,
    reducedMotion: 'Text appears instantly. No fade.',
    implementation: `
      // In StatusBar component:
      const hour = new Date().getHours();
      const isLateNight = hour >= 23 || hour < 4;

      {isLateNight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-1 text-xs text-foreground-subtle"
        >
          <Moon className="h-3 w-3" />
          <span>Burning the midnight oil</span>
        </motion.div>
      )}
    `,
  } satisfies MicroInteraction,

  // ── 58. Weekend Warrior ───────────────────────────────────────
  weekendWarrior: {
    trigger: 'User completes a study session on Saturday or Sunday',
    animation: {
      badge: {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: [0, 1.15, 1], opacity: 1 },
        transition: springs.bouncy,
      },
      glow: {
        animate: {
          boxShadow: [
            '0 0 0 0 rgba(250, 204, 21, 0)',
            '0 0 12px 3px rgba(250, 204, 21, 0.25)',
            '0 0 0 0 rgba(250, 204, 21, 0)',
          ],
        },
        transition: { duration: 0.6, ease: easing.inOut },
      },
    },
    visual: `
      A small "Weekend Warrior" badge flashes briefly in the streak/progress area
        Icon: Lucide "Sword" or "Shield" icon in gold (--accent-warm)
        Badge: rounded-full, bg-accent-warm/10 border border-accent-warm/30
        Bounces in with springs.bouncy (scale 0 -> 1.15 -> 1)
        Gold glow pulse radiates once then settles
      Toast: "Weekend Warrior! Studying on a [Saturday/Sunday]."
        Type: success, 4000ms duration
      Fires once per weekend day (not every session)
    `,
    sound: 'success',
    reducedMotion: 'Badge appears at full size instantly. No glow. Toast appears normally.',
    implementation: `
      // After completing a study session:
      const day = new Date().getDay();
      const isWeekend = day === 0 || day === 6;
      const dayName = day === 0 ? "Sunday" : "Saturday";
      const key = "architex:weekend-warrior:" + new Date().toDateString();

      if (isWeekend && !localStorage.getItem(key)) {
        localStorage.setItem(key, "true");
        toast("success", "Weekend Warrior! Studying on a " + dayName + ".");
        play("success");
        setShowWeekendBadge(true);
        setTimeout(() => setShowWeekendBadge(false), 4000);
      }

      // Badge:
      <AnimatePresence>
        {showWeekendBadge && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.15, 1], opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={springs.bouncy}
            className="flex items-center gap-1 rounded-full border border-[var(--accent-warm)]/30
              bg-[var(--accent-warm)]/10 px-2 py-0.5"
          >
            <Swords className="h-3 w-3 text-[var(--accent-warm)]" />
            <span className="text-[10px] font-semibold text-[var(--accent-warm)]">
              Weekend Warrior
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    `,
  } satisfies MicroInteraction,
} as const;


// =========================================================================
// EXPORT — COMPLETE INTERACTION MAP
// =========================================================================

export const microInteractions = {
  hover: mi_hover,
  press: mi_press,
  loading: mi_loading,
  feedback: mi_feedback,
  navigation: mi_navigation,
  text: mi_text,
  canvas: mi_canvas,
  dataViz: mi_dataViz,
  delight: mi_delight,
} as const;

/**
 * Quick reference: Tailwind utility classes used across all micro-interactions
 *
 * Motion:
 *   transition-all duration-[100ms] ease-[cubic-bezier(0.16,1,0.3,1)]
 *   transition-colors duration-[150ms]
 *   transition-transform duration-[150ms]
 *   transition-opacity duration-[200ms]
 *   active:scale-[0.97]
 *   motion-reduce:animate-none
 *   motion-reduce:transition-none
 *
 * Colors (dark theme):
 *   bg-primary (hsl 258 78% 64%)
 *   bg-surface (hsl 225 8% 11%)
 *   text-foreground (hsl 220 5% 90%)
 *   text-foreground-muted (hsl 220 5% 55%)
 *   border-border (rgba 255 255 255 / 0.10)
 *
 * Feedback:
 *   text-[var(--state-success)] (green)
 *   text-[var(--state-error)] (red)
 *   text-[var(--state-warning)] (amber)
 *   text-[var(--accent-warm)] (gold)
 *
 * Layout:
 *   tabular-nums (monospace digits)
 *   will-change-transform (set before animation, remove after)
 */
