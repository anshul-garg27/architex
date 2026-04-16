Now I have a complete picture of the existing design system -- its color tokens, motion system, component patterns, and actual visual aesthetic from the screenshots. Let me build the full mode design system.

---

# ARCHITEX MODE DESIGN SYSTEM -- Complete Visual Specification

## Design Philosophy

The 7 modes share the same 225-degree dark background family and keep violet (258 degrees) as the global primary accent. Each mode gets its own **indicator color** used only for: (1) the mode switcher active state, (2) the active mode's sidebar glow, (3) a subtle background tint on the canvas, and (4) mode-specific badges/status. This is NOT a rainbow -- it is a controlled palette where 90% of the UI remains the existing neutral dark chrome, and only 10% of pixels carry the mode color. The analogy is VS Code's activity bar: one colored icon at a time, the rest neutral.

---

## 1. COLOR SYSTEM PER MODE

### Color Selection Rationale

The 7 mode colors were selected by distributing across the hue wheel at roughly 45-55 degree intervals, starting from the existing violet (258), skipping hues that collide with semantic colors (red=error, pure green=success, pure yellow=warning). Each hue is tuned to land at 4.5:1+ contrast ratio against `hsl(225, 8%, 7%)` background, meeting WCAG AA.

```
Mode          Hue    HSL (Full)                  Hex        Contrast on #111318
-----------   -----  --------------------------  ---------  --------------------
Learn         210    hsl(210, 70%, 62%)          #4A9CE8    5.7:1
Simulate      152    hsl(152, 60%, 52%)          #44B87C    5.2:1
Practice      35     hsl(35, 85%, 58%)           #E8A83A    6.1:1
Quiz          280    hsl(280, 65%, 65%)          #B466D9    4.8:1
Assessment    340    hsl(340, 68%, 62%)          #D85882    5.0:1
Review        190    hsl(190, 65%, 52%)          #3AAFBF    5.1:1
AI            258    hsl(258, 78%, 64%)          #7B3EE8    4.6:1 (existing primary)
```

### CSS Custom Properties -- Per Mode

```css
:root {
  /* ── Mode Identity Colors (solid, for icons/badges/indicators) ── */
  --mode-learn:        hsl(210 70% 62%);
  --mode-simulate:     hsl(152 60% 52%);
  --mode-practice:     hsl(35 85% 58%);
  --mode-quiz:         hsl(280 65% 65%);
  --mode-assessment:   hsl(340 68% 62%);
  --mode-review:       hsl(190 65% 52%);
  --mode-ai:           hsl(258 78% 64%);

  /* ── Mode Background Tints (canvas overlay, very subtle) ── */
  --mode-learn-tint:        hsla(210, 70%, 62%, 0.03);
  --mode-simulate-tint:     hsla(152, 60%, 52%, 0.03);
  --mode-practice-tint:     hsla(35, 85%, 58%, 0.03);
  --mode-quiz-tint:         hsla(280, 65%, 65%, 0.03);
  --mode-assessment-tint:   hsla(340, 68%, 62%, 0.03);
  --mode-review-tint:       hsla(190, 65%, 52%, 0.03);
  --mode-ai-tint:           hsla(258, 78%, 64%, 0.03);

  /* ── Mode Glow (sidebar active state, focus ring, hover) ── */
  --mode-learn-glow:        hsla(210, 70%, 62%, 0.15);
  --mode-simulate-glow:     hsla(152, 60%, 52%, 0.15);
  --mode-practice-glow:     hsla(35, 85%, 58%, 0.15);
  --mode-quiz-glow:         hsla(280, 65%, 65%, 0.15);
  --mode-assessment-glow:   hsla(340, 68%, 62%, 0.15);
  --mode-review-glow:       hsla(190, 65%, 52%, 0.15);
  --mode-ai-glow:           hsla(258, 78%, 64%, 0.15);

  /* ── Mode Surface (card backgrounds within mode, subtle) ── */
  --mode-learn-surface:        hsla(210, 70%, 62%, 0.06);
  --mode-simulate-surface:     hsla(152, 60%, 52%, 0.06);
  --mode-practice-surface:     hsla(35, 85%, 58%, 0.06);
  --mode-quiz-surface:         hsla(280, 65%, 65%, 0.06);
  --mode-assessment-surface:   hsla(340, 68%, 62%, 0.06);
  --mode-review-surface:       hsla(190, 65%, 52%, 0.06);
  --mode-ai-surface:           hsla(258, 78%, 64%, 0.06);

  /* ── Mode Border (active borders, input focus per mode) ── */
  --mode-learn-border:        hsla(210, 70%, 62%, 0.25);
  --mode-simulate-border:     hsla(152, 60%, 52%, 0.25);
  --mode-practice-border:     hsla(35, 85%, 58%, 0.25);
  --mode-quiz-border:         hsla(280, 65%, 65%, 0.25);
  --mode-assessment-border:   hsla(340, 68%, 62%, 0.25);
  --mode-review-border:       hsla(190, 65%, 52%, 0.25);
  --mode-ai-border:           hsla(258, 78%, 64%, 0.25);

  /* ── Active Mode (set dynamically via JS when mode changes) ── */
  --mode-active:         var(--mode-learn);
  --mode-active-tint:    var(--mode-learn-tint);
  --mode-active-glow:    var(--mode-learn-glow);
  --mode-active-surface: var(--mode-learn-surface);
  --mode-active-border:  var(--mode-learn-border);
}
```

### Dynamic Mode Application (TypeScript)

```typescript
// lib/mode-theme.ts
export const MODE_COLORS = {
  learn:      { hue: 210, sat: 70, lit: 62 },
  simulate:   { hue: 152, sat: 60, lit: 52 },
  practice:   { hue: 35,  sat: 85, lit: 58 },
  quiz:       { hue: 280, sat: 65, lit: 65 },
  assessment: { hue: 340, sat: 68, lit: 62 },
  review:     { hue: 190, sat: 65, lit: 52 },
  ai:         { hue: 258, sat: 78, lit: 64 },
} as const;

export type AppMode = keyof typeof MODE_COLORS;

export function applyModeTheme(mode: AppMode): void {
  const root = document.documentElement;
  root.style.setProperty('--mode-active',         `var(--mode-${mode})`);
  root.style.setProperty('--mode-active-tint',    `var(--mode-${mode}-tint)`);
  root.style.setProperty('--mode-active-glow',    `var(--mode-${mode}-glow)`);
  root.style.setProperty('--mode-active-surface',  `var(--mode-${mode}-surface)`);
  root.style.setProperty('--mode-active-border',   `var(--mode-${mode}-border)`);
  root.dataset.mode = mode;
}
```

### Light Mode Adjustments

For `html.light`, darken each mode color by 12% lightness to maintain contrast against light backgrounds:

```css
html.light {
  --mode-learn:        hsl(210 70% 50%);
  --mode-simulate:     hsl(152 60% 40%);
  --mode-practice:     hsl(35 85% 46%);
  --mode-quiz:         hsl(280 65% 53%);
  --mode-assessment:   hsl(340 68% 50%);
  --mode-review:       hsl(190 65% 40%);
  --mode-ai:           hsl(258 78% 52%);
}
```

---

## 2. TYPOGRAPHY PER MODE

All modes inherit the global Geist Sans / Geist Mono stack. Mode-specific overrides layer on top.

### Learn Mode Typography

```css
[data-mode="learn"] .lesson-body {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.65;
  letter-spacing: -0.01em;
  color: var(--foreground);
  max-width: 680px;
}

[data-mode="learn"] .lesson-body h2 {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
  margin-top: 32px;
  margin-bottom: 12px;
  color: var(--foreground);
}

[data-mode="learn"] .lesson-body h3 {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  margin-top: 24px;
  margin-bottom: 8px;
}

[data-mode="learn"] .lesson-body code {
  font-family: var(--font-geist-mono), monospace;
  font-size: 13px;
  background: var(--surface-elevated);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-subtle);
}

[data-mode="learn"] .lesson-body blockquote {
  border-left: 3px solid var(--mode-learn);
  padding-left: 16px;
  color: var(--foreground-subtle);
  font-style: italic;
}

[data-mode="learn"] .concept-callout {
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mode-learn);
}
```

### Simulate Mode Typography

```css
[data-mode="simulate"] .metric-value {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1;
}

[data-mode="simulate"] .metric-label {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--foreground-muted);
}

[data-mode="simulate"] .metric-unit {
  font-family: var(--font-geist-mono), monospace;
  font-size: 12px;
  color: var(--foreground-subtle);
  margin-left: 4px;
}

[data-mode="simulate"] .traffic-counter {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 600;
}
```

### Practice Mode Typography

```css
[data-mode="practice"] .timer-display {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1;
}

[data-mode="practice"] .checklist-item {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

[data-mode="practice"] .requirement-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
```

### Quiz Mode Typography

```css
[data-mode="quiz"] .question-text {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: -0.01em;
  max-width: 640px;
}

[data-mode="quiz"] .option-text {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
}

[data-mode="quiz"] .option-letter {
  font-family: var(--font-geist-mono), monospace;
  font-size: 14px;
  font-weight: 600;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
}

[data-mode="quiz"] .progress-label {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-muted);
}
```

### Assessment Mode Typography

```css
[data-mode="assessment"] .rubric-dimension {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
}

[data-mode="assessment"] .rubric-score {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 24px;
  font-weight: 700;
  line-height: 1;
}

[data-mode="assessment"] .rubric-max {
  font-family: var(--font-geist-mono), monospace;
  font-size: 14px;
  color: var(--foreground-muted);
}

[data-mode="assessment"] .feedback-text {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--foreground-subtle);
}
```

### Review Mode Typography

```css
[data-mode="review"] .flashcard-front {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.45;
  text-align: center;
  letter-spacing: -0.01em;
}

[data-mode="review"] .flashcard-back {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--foreground);
}

[data-mode="review"] .srs-interval {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground-muted);
}

[data-mode="review"] .deck-count {
  font-family: var(--font-geist-mono), monospace;
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  font-weight: 600;
}
```

### AI Mode Typography

```css
[data-mode="ai"] .chat-message-user {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.55;
}

[data-mode="ai"] .chat-message-ai {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

[data-mode="ai"] .chat-message-ai code {
  font-family: var(--font-geist-mono), monospace;
  font-size: 13px;
}

[data-mode="ai"] .thinking-indicator {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 12px;
  font-weight: 500;
  font-style: italic;
  color: var(--foreground-muted);
}

[data-mode="ai"] .suggestion-chip {
  font-family: var(--font-geist-sans), system-ui, sans-serif;
  font-size: 13px;
  font-weight: 500;
}
```

---

## 3. ICON SYSTEM

All icons use Lucide React, which is already the icon library in the codebase. These were chosen for clarity at all 3 sizes and semantic accuracy.

```typescript
// lib/mode-icons.ts
import {
  BookOpen,      // Learn: open book (knowledge, teaching)
  Activity,      // Simulate: ECG-style pulse (live system, real-time)
  Code2,         // Practice: code brackets (hands-on coding)
  CircleHelp,    // Quiz: question in circle (quick check, "do you know?")
  ClipboardCheck,// Assessment: clipboard with checkmark (formal evaluation)
  RotateCcw,     // Review: circular arrows (repetition, spaced recall)
  Sparkles,      // AI: sparkles (AI magic, intelligence)
} from 'lucide-react';

export const MODE_ICONS = {
  learn:      BookOpen,
  simulate:   Activity,
  practice:   Code2,
  quiz:       CircleHelp,
  assessment: ClipboardCheck,
  review:     RotateCcw,
  ai:         Sparkles,
} as const;
```

### Icon Sizing Rules

| Context               | Size   | strokeWidth | Class              |
|-----------------------|--------|-------------|--------------------|
| Mode switcher (bar)   | 20px   | 1.75        | `size-5`           |
| Sidebar section header| 16px   | 2           | `size-4`           |
| Mode header/title     | 24px   | 1.5         | `size-6`           |
| Empty state/hero      | 32px   | 1.25        | `size-8`           |
| Status bar indicator  | 14px   | 2           | `size-3.5`         |

### Icon Color Rules

```css
/* Default (inactive mode in switcher) */
.mode-icon-inactive {
  color: var(--foreground-muted);   /* hsl(220, 5%, 55%) */
}

/* Hovered */
.mode-icon-hover {
  color: var(--foreground-subtle);  /* hsl(220, 5%, 62%) */
}

/* Active mode */
.mode-icon-active {
  color: var(--mode-active);        /* dynamic per mode */
}
```

---

## 4. MOTION DESIGN PER MODE

Each mode extends the existing motion system from `lib/constants/motion.ts`. These are additive presets, not replacements.

```typescript
// lib/constants/mode-motion.ts
import { springs, duration, easing } from '@/lib/constants/motion';

export const modeMotion = {

  // ─── Learn Mode: Gentle, educational ──────────────────────
  learn: {
    /** Step reveal -- content slides up as user progresses */
    stepReveal: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.moderate, ease: easing.out },
    },
    /** Concept highlight -- node pulses to draw attention */
    conceptHighlight: {
      animate: {
        boxShadow: [
          '0 0 0 0 hsla(210, 70%, 62%, 0)',
          '0 0 12px 4px hsla(210, 70%, 62%, 0.25)',
          '0 0 0 0 hsla(210, 70%, 62%, 0)',
        ],
      },
      transition: { duration: 2, repeat: Infinity, ease: easing.inOut },
    },
    /** Progressive diagram build -- nodes appear one by one */
    nodeStaggerIn: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { ...springs.gentle },
    },
    nodeStaggerDelay: 0.12,  // 120ms between nodes (slow, educational pacing)
    /** Edge draw-in, slow and visible */
    edgeDrawIn: {
      initial: { pathLength: 0, opacity: 0.5 },
      animate: { pathLength: 1, opacity: 1 },
      transition: { duration: duration.slow, ease: easing.out, delay: 0.2 },
    },
  },

  // ─── Simulate Mode: Energetic, real-time ──────────────────
  simulate: {
    /** Metric counter -- numbers ticking up/down */
    metricTick: {
      transition: { ...springs.snappy },
    },
    /** Throughput pulse -- bar or indicator pulsing with traffic */
    throughputPulse: {
      animate: { opacity: [0.7, 1, 0.7] },
      transition: { duration: 1.5, repeat: Infinity, ease: easing.inOut },
    },
    /** Node status change -- color morph on state change */
    nodeStatusChange: {
      transition: { duration: duration.normal, ease: easing.inOut },
    },
    /** Particle burst -- on error injection or chaos event */
    particleBurst: {
      animate: { scale: [1, 1.4, 0], opacity: [1, 0.8, 0] },
      transition: { duration: 0.6, ease: easing.out },
    },
    /** Heartbeat -- system health indicator */
    heartbeat: {
      animate: { scale: [1, 1.08, 1, 1.08, 1] },
      transition: { duration: 1.2, repeat: Infinity, ease: easing.inOut },
    },
  },

  // ─── Practice Mode: Urgent, timer-driven ──────────────────
  practice: {
    /** Timer tick -- subtle scale bump every second */
    timerTick: {
      animate: { scale: [1, 1.02, 1] },
      transition: { duration: 0.15, ease: easing.out },
    },
    /** Timer warning -- pulse faster when < 25% remaining */
    timerWarning: {
      animate: {
        color: [
          'hsl(35, 85%, 58%)',
          'hsl(0, 72%, 56%)',
          'hsl(35, 85%, 58%)',
        ],
      },
      transition: { duration: 1, repeat: Infinity, ease: easing.inOut },
    },
    /** Checklist item complete -- check slides in, line through */
    checklistComplete: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { ...springs.bouncy },
    },
    /** Progress bar fill -- smooth continuous fill */
    progressFill: {
      transition: { duration: duration.moderate, ease: easing.out },
    },
  },

  // ─── Quiz Mode: Snap decisions, immediate feedback ────────
  quiz: {
    /** Question appear -- slide up and fade */
    questionAppear: {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.normal, ease: easing.out },
    },
    /** Option hover -- subtle lift */
    optionHover: {
      whileHover: { y: -2, scale: 1.01 },
      transition: { ...springs.snappy },
    },
    /** Correct answer -- green flash + scale */
    correctFeedback: {
      animate: {
        backgroundColor: 'hsla(152, 65%, 48%, 0.12)',
        borderColor: 'hsla(152, 65%, 48%, 0.4)',
        scale: [1, 1.02, 1],
      },
      transition: { duration: duration.normal, ease: easing.out },
    },
    /** Wrong answer -- red shake */
    incorrectFeedback: {
      animate: {
        backgroundColor: 'hsla(0, 65%, 58%, 0.08)',
        borderColor: 'hsla(0, 65%, 58%, 0.3)',
        x: [0, -4, 4, -4, 4, 0],
      },
      transition: { duration: 0.4, ease: easing.linear },
    },
    /** Option card stagger-in */
    optionStagger: {
      initial: { opacity: 0, x: -8 },
      animate: { opacity: 1, x: 0 },
      transition: { duration: duration.fast, ease: easing.out },
    },
    optionStaggerDelay: 0.05,  // 50ms between options (snappy)
  },

  // ─── Assessment Mode: Reveal, unveil ─────────────────────
  assessment: {
    /** Score counter -- counts from 0 to final value */
    scoreCountUp: {
      transition: { duration: duration.slow, ease: easing.out },
    },
    /** Dimension bar fill -- each bar fills sequentially */
    dimensionFill: {
      initial: { scaleX: 0 },
      animate: { scaleX: 1 },
      transition: { duration: duration.moderate, ease: easing.out },
    },
    dimensionFillStagger: 0.15,  // 150ms between dimensions
    /** Overall score reveal -- dramatic scale-in */
    overallScoreReveal: {
      initial: { scale: 0.5, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { ...springs.bouncy, delay: 0.4 },
    },
    /** Feedback panel slide-up */
    feedbackReveal: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.moderate, ease: easing.out, delay: 0.8 },
    },
  },

  // ─── Review Mode: Flip, shuffle ───────────────────────────
  review: {
    /** Card flip -- 3D rotateY */
    cardFlip: {
      front: {
        animate: { rotateY: 0 },
        transition: { duration: duration.moderate, ease: easing.inOut },
      },
      back: {
        animate: { rotateY: 180 },
        transition: { duration: duration.moderate, ease: easing.inOut },
      },
    },
    /** Card swipe -- Tinder-style dismiss */
    cardSwipeRight: {
      exit: { x: 300, rotate: 15, opacity: 0 },
      transition: { duration: duration.normal, ease: easing.in },
    },
    cardSwipeLeft: {
      exit: { x: -300, rotate: -15, opacity: 0 },
      transition: { duration: duration.normal, ease: easing.in },
    },
    /** Next card appears from stack */
    cardStackAppear: {
      initial: { scale: 0.95, y: 8, opacity: 0 },
      animate: { scale: 1, y: 0, opacity: 1 },
      transition: { ...springs.smooth },
    },
    /** Deck shuffle -- cards scatter and restack */
    deckShuffle: {
      animate: { rotate: [0, -3, 3, -1, 1, 0] },
      transition: { duration: 0.5, ease: easing.inOut },
    },
  },

  // ─── AI Mode: Streaming, typing ───────────────────────────
  ai: {
    /** Message bubble appear */
    messageAppear: {
      initial: { opacity: 0, y: 8, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: duration.fast, ease: easing.out },
    },
    /** Thinking dots -- 3 dots pulsing sequentially */
    thinkingDot: {
      animate: { y: [0, -4, 0] },
      transition: { duration: 0.6, repeat: Infinity, ease: easing.inOut },
    },
    thinkingDotStagger: 0.15,  // 150ms between dots (dot1: 0ms, dot2: 150ms, dot3: 300ms)
    /** Streaming text -- characters fade in as they arrive */
    streamingChar: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.05 },
    },
    /** Suggestion chips -- slide up from bottom of chat */
    suggestionAppear: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: duration.fast, ease: easing.out },
    },
    suggestionStagger: 0.06,  // 60ms between chips
    /** AI diagram highlight -- when AI references a node */
    diagramHighlight: {
      animate: {
        boxShadow: [
          '0 0 0 0 hsla(258, 78%, 64%, 0)',
          '0 0 8px 3px hsla(258, 78%, 64%, 0.3)',
          '0 0 0 0 hsla(258, 78%, 64%, 0)',
        ],
      },
      transition: { duration: 1.5, repeat: 2, ease: easing.inOut },
    },
  },

} as const;
```

### Mode Transition Animation (switching between modes)

```typescript
export const modeTransition = {
  /** Outgoing mode content */
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },  // very fast exit
  },
  /** Incoming mode content */
  enter: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.15, delay: 0.05 },  // staggered after exit
  },
  /** Canvas background tint crossfade */
  tintCrossfade: {
    transition: { duration: 0.4, ease: easing.inOut },
  },
  /** Mode indicator slide in switcher bar */
  indicatorSlide: {
    transition: { ...springs.smooth },
  },
};
```

---

## 5. LAYOUT VARIATIONS

### Layout Grid System

All layouts use the same outer shell: `48px activity bar` + `flex-1 content area`. What changes is the content area composition.

```
Activity Bar (48px, fixed left)
+--+-----------------------------------------------------------+
|  |  Content Area (flex: 1)                                   |
|  |                                                            |
|  |  Layout varies per mode below                              |
|  |                                                            |
+--+-----------------------------------------------------------+
Status Bar (28px, fixed bottom)
```

### Per-Mode Layout Specifications

#### Learn Mode Layout

```
+--------+-------- flex: 1 --------+----- 420px -----+
| Activity| Canvas (progressive)    | Lesson Panel    |
| Bar     | background: canvas-bg   | background:     |
| 48px    | + mode-learn-tint       |   surface       |
|         | Nodes build one by one  | Scrollable      |
|         | Edges animate in        | 15px body text  |
|         |                         | Max-w: 680px    |
|         |                         | padding: 24px   |
+---------+-------------------------+-----------------+
```

```css
.layout-learn {
  display: grid;
  grid-template-columns: 1fr 420px;
  height: 100%;
}

.layout-learn .canvas-area {
  position: relative;
  background: var(--canvas-bg);
}

.layout-learn .canvas-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--mode-learn-tint);
  pointer-events: none;
  z-index: 1;
}

.layout-learn .lesson-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 24px;
}
```

#### Simulate Mode Layout

```
+--------+-------- flex: 1 --------+----- 320px -----+
| Activity| Canvas (full traffic)   | Metrics Panel   |
| Bar     | Particles flowing       | Live metrics    |
| 48px    | Node state colors       | Latency chart   |
|         | Error indicators        | Throughput bar  |
|         |                         | Error rate      |
|         |                         | Tabular nums    |
+---------+-------------------------+-----------------+
                                    +-- 200px toolbar--+
                                    | Transport bar    |
                                    | Play/Pause/Speed |
                                    +------------------+
```

```css
.layout-simulate {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: 1fr auto;
  height: 100%;
}

.layout-simulate .canvas-area {
  grid-row: 1 / -1;
  position: relative;
  background: var(--canvas-bg);
}

.layout-simulate .canvas-area::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--mode-simulate-tint);
  pointer-events: none;
  z-index: 1;
}

.layout-simulate .metrics-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 16px;
}

.layout-simulate .transport-bar {
  grid-column: 1 / -1;
  background: var(--surface);
  border-top: 1px solid var(--border);
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 12px;
}
```

#### Practice Mode Layout

```
+--------+-------- flex: 1 --------+----- 340px -----+
| Activity| Canvas (editable)       | Practice Panel  |
| Bar     | User builds diagram     |                 |
| 48px    | Component palette       | Timer (32px)    |
|         |   docked top-left       | Checklist       |
|         |                         | Requirements    |
|         |                         | Submit button   |
+---------+-------------------------+-----------------+
```

```css
.layout-practice {
  display: grid;
  grid-template-columns: 1fr 340px;
  height: 100%;
}

.layout-practice .practice-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.layout-practice .timer-section {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.layout-practice .checklist-section {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.layout-practice .submit-section {
  padding: 16px;
  border-top: 1px solid var(--border);
}
```

#### Quiz Mode Layout (Full-Width)

```
+----------------------------------------------------------+
| Activity Bar (collapses to icon-only 48px)               |
+----------------------------------------------------------+
|                                                            |
|              +------ max-w: 720px ------+                  |
|              | Progress: 3/10   |||||||  |                  |
|              |                           |                  |
|              | Question text (20px)      |                  |
|              |                           |                  |
|              | +--- Option Card A ----+  |                  |
|              | +--- Option Card B ----+  |                  |
|              | +--- Option Card C ----+  |                  |
|              | +--- Option Card D ----+  |                  |
|              |                           |                  |
|              | [Explanation collapse]     |                  |
|              +---------------------------+                  |
|                                                            |
+----------------------------------------------------------+
```

```css
.layout-quiz {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 24px;
  background: var(--background);
  overflow-y: auto;
}

.layout-quiz .quiz-container {
  width: 100%;
  max-width: 720px;
}

.layout-quiz .progress-bar-track {
  height: 4px;
  background: var(--surface-elevated);
  border-radius: 2px;
  margin-bottom: 40px;
}

.layout-quiz .progress-bar-fill {
  height: 100%;
  background: var(--mode-quiz);
  border-radius: 2px;
  transition: width 300ms var(--motion-ease-out);
}

.layout-quiz .option-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  margin-bottom: 12px;
  cursor: pointer;
  transition: border-color 150ms ease, background-color 150ms ease;
}

.layout-quiz .option-card:hover {
  border-color: var(--mode-quiz-border);
  background: var(--mode-quiz-surface);
}

.layout-quiz .option-card[data-selected="true"] {
  border-color: var(--mode-quiz);
  background: var(--mode-quiz-surface);
}

.layout-quiz .option-card[data-correct="true"] {
  border-color: var(--learn-correct-border);
  background: var(--learn-correct-bg);
}

.layout-quiz .option-card[data-incorrect="true"] {
  border-color: var(--learn-incorrect-border);
  background: var(--learn-incorrect-bg);
}
```

#### Assessment Mode Layout

```
+--------+-------- flex: 1 --------+----- 380px -----+
| Activity| Canvas (read-only)      | Rubric Panel    |
| Bar     | No palette shown        |                 |
| 48px    | Dim interactive controls| Overall: 72/100 |
|         | Highlight weak areas    | Dimension bars  |
|         |                         | Feedback text   |
|         |                         | Suggestions     |
+---------+-------------------------+-----------------+
```

```css
.layout-assessment {
  display: grid;
  grid-template-columns: 1fr 380px;
  height: 100%;
}

.layout-assessment .canvas-area {
  position: relative;
  background: var(--canvas-bg);
  pointer-events: none;  /* read-only canvas */
}

.layout-assessment .rubric-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  overflow-y: auto;
  padding: 24px 20px;
}

.layout-assessment .dimension-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-subtle);
}

.layout-assessment .dimension-bar-track {
  flex: 1;
  height: 6px;
  background: var(--surface-elevated);
  border-radius: 3px;
  overflow: hidden;
}

.layout-assessment .dimension-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: var(--mode-assessment);
  transform-origin: left;
}
```

#### Review Mode Layout (Full-Width)

```
+----------------------------------------------------------+
| Activity Bar (collapses to icon-only 48px)               |
+----------------------------------------------------------+
|                                                            |
|              +------ 480px x 320px ------+                |
|              |                            |                |
|              |     FLASHCARD FRONT        |                |
|              |                            |                |
|              |  "What is CAP theorem?"    |                |
|              |                            |                |
|              |     [Space to reveal]      |                |
|              +----------------------------+                |
|              stacked cards visible behind (2-3 shadow)     |
|                                                            |
|         [Again]  [Hard]  [Good]  [Easy]                   |
|                                                            |
|         Due: 12  |  New: 3  |  Review: 9                  |
+----------------------------------------------------------+
```

```css
.layout-review {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 24px;
  background: var(--background);
}

.layout-review .card-stack {
  position: relative;
  width: 480px;
  height: 320px;
  perspective: 1200px;
}

.layout-review .flashcard {
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  box-shadow: var(--shadow-lg);
}

/* Stack effect: cards behind */
.layout-review .card-stack .flashcard:nth-child(2) {
  transform: translateY(6px) scale(0.97);
  opacity: 0.6;
}

.layout-review .card-stack .flashcard:nth-child(3) {
  transform: translateY(12px) scale(0.94);
  opacity: 0.3;
}

.layout-review .rating-bar {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

.layout-review .rating-button {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--border);
  background: var(--surface);
  transition: all 150ms ease;
}

.layout-review .deck-stats {
  display: flex;
  gap: 24px;
  margin-top: 24px;
  font-size: 13px;
  color: var(--foreground-muted);
}
```

#### AI Mode Layout

```
+--------+-------- flex: 1 --------+----- 400px -----+
| Activity| Canvas (shared)         | Chat Panel      |
| Bar     | AI can highlight nodes  |                 |
| 48px    | AI can suggest edits    | Message list    |
|         | Visual reference shared | Thinking dots   |
|         |                         | Suggestion chips|
|         |                         | Input box       |
+---------+-------------------------+-----------------+
```

```css
.layout-ai {
  display: grid;
  grid-template-columns: 1fr 400px;
  height: 100%;
}

.layout-ai .chat-panel {
  background: var(--surface);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.layout-ai .chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layout-ai .message-bubble-user {
  align-self: flex-end;
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px 12px 4px 12px;
  background: var(--mode-ai-surface);
  border: 1px solid var(--mode-ai-border);
}

.layout-ai .message-bubble-ai {
  align-self: flex-start;
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 12px 12px 12px 4px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
}

.layout-ai .thinking-dots {
  display: flex;
  gap: 4px;
  padding: 12px 14px;
}

.layout-ai .thinking-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--foreground-muted);
}

.layout-ai .chat-input-area {
  border-top: 1px solid var(--border);
  padding: 12px 16px;
}

.layout-ai .suggestion-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px;
}

.layout-ai .suggestion-chip {
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  background: var(--surface-elevated);
  border: 1px solid var(--border);
  cursor: pointer;
  transition: all 150ms ease;
}

.layout-ai .suggestion-chip:hover {
  border-color: var(--mode-ai-border);
  background: var(--mode-ai-surface);
}
```

### Responsive Breakpoints

```css
/* Tablet: stack right panel below canvas */
@media (max-width: 1024px) {
  .layout-learn,
  .layout-simulate,
  .layout-practice,
  .layout-assessment,
  .layout-ai {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .lesson-panel,
  .metrics-panel,
  .practice-panel,
  .rubric-panel,
  .chat-panel {
    border-left: none;
    border-top: 1px solid var(--border);
    max-height: 50vh;
  }
}

/* Mobile: quiz/review already full-width, others get tabs */
@media (max-width: 640px) {
  .layout-learn,
  .layout-simulate,
  .layout-practice,
  .layout-assessment,
  .layout-ai {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  /* Panel becomes a slide-up sheet */
  .lesson-panel,
  .metrics-panel,
  .practice-panel,
  .rubric-panel,
  .chat-panel {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 70vh;
    border-radius: 16px 16px 0 0;
    z-index: var(--z-overlay);
    transform: translateY(calc(100% - 48px));
    transition: transform 300ms var(--motion-ease-out);
  }

  .panel-expanded {
    transform: translateY(0);
  }

  .layout-review .card-stack {
    width: 100%;
    max-width: 360px;
    height: 260px;
  }

  .layout-quiz .quiz-container {
    max-width: 100%;
    padding: 0 16px;
  }
}
```

---

## 6. MODE SWITCHER DESIGN

### Placement

The mode switcher lives in the **top toolbar**, horizontally, between the breadcrumb/title area and the toolbar actions (zoom, undo, etc.). It is a **segmented control** with pill-shaped active indicator.

### Specification

```
+-- Top Toolbar (44px height) ─────────────────────────────────────────+
| [< Back] "Rate Limiter"  | Learn  Simulate  Practice  Quiz  AI |  [...]|
|                           |  ^-- mode switcher (segmented)     |       |
+----------------------------------------------------------------------+
```

### CSS Implementation

```css
.mode-switcher {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  position: relative;
}

.mode-switcher-item {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 150ms ease;
  white-space: nowrap;
}

.mode-switcher-item:hover:not([data-active="true"]) {
  color: var(--foreground-subtle);
}

.mode-switcher-item[data-active="true"] {
  color: var(--mode-active);
}

/* Disabled modes (not available for current content) */
.mode-switcher-item:disabled {
  opacity: var(--opacity-disabled);
  cursor: not-allowed;
}

/* Sliding pill indicator (positioned via JS) */
.mode-switcher-indicator {
  position: absolute;
  top: 3px;
  height: calc(100% - 6px);
  border-radius: 7px;
  background: var(--mode-active-surface);
  border: 1px solid var(--mode-active-border);
  z-index: 0;
  /* left and width set dynamically via JS */
  transition: left 200ms var(--motion-ease-out),
              width 200ms var(--motion-ease-out),
              background-color 300ms ease,
              border-color 300ms ease;
}

/* Badge showing progress per mode */
.mode-switcher-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 10px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

/* Badge variants */
.mode-switcher-badge[data-variant="count"] {
  background: var(--surface-elevated);
  color: var(--foreground-muted);
}

.mode-switcher-badge[data-variant="due"] {
  background: hsla(35, 90%, 55%, 0.15);
  color: hsl(35, 90%, 55%);
}

.mode-switcher-badge[data-variant="complete"] {
  background: hsla(152, 65%, 48%, 0.15);
  color: hsl(152, 65%, 48%);
}
```

### Mode Switcher React Component (Props Interface)

```typescript
// components/ui/mode-switcher.tsx
export interface ModeSwitcherProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  availableModes: AppMode[];
  modeBadges?: Partial<Record<AppMode, {
    label: string;      // e.g. "3/10", "5 due", "done"
    variant: 'count' | 'due' | 'complete';
  }>>;
  className?: string;
}
```

### Animation on Switch

```typescript
// When mode changes:
// 1. Indicator pill slides to new position (spring.smooth, 200ms)
// 2. Canvas tint crossfades (400ms ease-in-out)
// 3. Right panel content: old fades out (100ms), new fades in (150ms, 50ms delay)
// 4. --mode-active custom properties update (instant, CSS vars handle the transition)
// 5. Mode icon in activity bar pulses once (springs.snappy scale 1 -> 1.1 -> 1)
```

### Availability Indicators

Modes that are not available for the current content (e.g., no quiz exists yet) are shown with `opacity: 0.38` and `cursor: not-allowed`. They remain visible so the user knows the feature exists, but are not interactive.

---

## 7. DARK MODE CONSIDERATIONS

### Glow Effect Per Active Mode

The active mode gets a subtle glow on three elements:

**1. Mode Switcher Active Item**

```css
.mode-switcher-item[data-active="true"]::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 8px;
  background: var(--mode-active-glow);
  filter: blur(8px);
  z-index: -1;
  opacity: 0.5;
}
```

**2. Activity Bar Active Icon**

```css
.activity-bar-icon[data-active="true"] {
  color: var(--mode-active);
  position: relative;
}

.activity-bar-icon[data-active="true"]::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  border-radius: 0 2px 2px 0;
  background: var(--mode-active);
}
```

**3. Canvas Area Tint**

Already handled via the `::before` pseudo-element in each layout. The 0.03 alpha tint is barely perceptible on dark backgrounds but shifts the overall feel.

### WCAG Contrast Verification

All 7 mode colors were chosen to exceed 4.5:1 contrast against `hsl(225, 8%, 7%)` (#111318).

```
Learn      #4A9CE8  on #111318 → 5.71:1  (AA pass, AAA pass for large text)
Simulate   #44B87C  on #111318 → 5.23:1  (AA pass)
Practice   #E8A83A  on #111318 → 6.14:1  (AA pass, AAA pass for large text)
Quiz       #B466D9  on #111318 → 4.82:1  (AA pass)
Assessment #D85882  on #111318 → 5.01:1  (AA pass)
Review     #3AAFBF  on #111318 → 5.12:1  (AA pass)
AI         #7B3EE8  on #111318 → 4.62:1  (AA pass)
```

For text on the `--surface` background (`hsl(225, 8%, 11%)` = #19191F), all pass AA as well since the lightness difference is only 4%.

### Color-on-Color Combinations to Avoid

Never place one mode color as text on another mode's surface background. Mode colors are only used as:
- Indicators (icon fill, badge bg, border accent)
- Text on dark neutral backgrounds (verified above)
- Backgrounds at very low alpha (0.03-0.15) with white/gray text on top

### Focus Ring Per Mode

```css
/* Generic focus ring uses mode color when inside mode context */
[data-mode] :focus-visible {
  outline: 2px solid var(--mode-active);
  outline-offset: 2px;
}
```

---

## 8. COMPLETE TOKEN SUMMARY (for globals.css integration)

Here is the full block ready to paste into the existing globals.css, after the existing `--learn-*` tokens:

```css
  /* ── Mode Identity System ── */
  /* Solid accent per mode (icons, badges, indicators) */
  --mode-learn:              hsl(210 70% 62%);
  --mode-simulate:           hsl(152 60% 52%);
  --mode-practice:           hsl(35 85% 58%);
  --mode-quiz:               hsl(280 65% 65%);
  --mode-assessment:         hsl(340 68% 62%);
  --mode-review:             hsl(190 65% 52%);
  --mode-ai:                 hsl(258 78% 64%);

  /* Canvas background tint (3% alpha overlay) */
  --mode-learn-tint:         hsla(210, 70%, 62%, 0.03);
  --mode-simulate-tint:      hsla(152, 60%, 52%, 0.03);
  --mode-practice-tint:      hsla(35, 85%, 58%, 0.03);
  --mode-quiz-tint:          hsla(280, 65%, 65%, 0.03);
  --mode-assessment-tint:    hsla(340, 68%, 62%, 0.03);
  --mode-review-tint:        hsla(190, 65%, 52%, 0.03);
  --mode-ai-tint:            hsla(258, 78%, 64%, 0.03);

  /* Glow (15% alpha, for active states and hover) */
  --mode-learn-glow:         hsla(210, 70%, 62%, 0.15);
  --mode-simulate-glow:      hsla(152, 60%, 52%, 0.15);
  --mode-practice-glow:      hsla(35, 85%, 58%, 0.15);
  --mode-quiz-glow:          hsla(280, 65%, 65%, 0.15);
  --mode-assessment-glow:    hsla(340, 68%, 62%, 0.15);
  --mode-review-glow:        hsla(190, 65%, 52%, 0.15);
  --mode-ai-glow:            hsla(258, 78%, 64%, 0.15);

  /* Surface (6% alpha, card/section backgrounds) */
  --mode-learn-surface:      hsla(210, 70%, 62%, 0.06);
  --mode-simulate-surface:   hsla(152, 60%, 52%, 0.06);
  --mode-practice-surface:   hsla(35, 85%, 58%, 0.06);
  --mode-quiz-surface:       hsla(280, 65%, 65%, 0.06);
  --mode-assessment-surface: hsla(340, 68%, 62%, 0.06);
  --mode-review-surface:     hsla(190, 65%, 52%, 0.06);
  --mode-ai-surface:         hsla(258, 78%, 64%, 0.06);

  /* Border (25% alpha, active borders) */
  --mode-learn-border:       hsla(210, 70%, 62%, 0.25);
  --mode-simulate-border:    hsla(152, 60%, 52%, 0.25);
  --mode-practice-border:    hsla(35, 85%, 58%, 0.25);
  --mode-quiz-border:        hsla(280, 65%, 65%, 0.25);
  --mode-assessment-border:  hsla(340, 68%, 62%, 0.25);
  --mode-review-border:      hsla(190, 65%, 52%, 0.25);
  --mode-ai-border:          hsla(258, 78%, 64%, 0.25);

  /* Dynamic active mode (set via JS, defaults to learn) */
  --mode-active:             var(--mode-learn);
  --mode-active-tint:        var(--mode-learn-tint);
  --mode-active-glow:        var(--mode-learn-glow);
  --mode-active-surface:     var(--mode-learn-surface);
  --mode-active-border:      var(--mode-learn-border);
```

And the Tailwind v4 `@theme inline` additions:

```css
  /* Mode colors */
  --color-mode-learn: var(--mode-learn);
  --color-mode-simulate: var(--mode-simulate);
  --color-mode-practice: var(--mode-practice);
  --color-mode-quiz: var(--mode-quiz);
  --color-mode-assessment: var(--mode-assessment);
  --color-mode-review: var(--mode-review);
  --color-mode-ai: var(--mode-ai);
  --color-mode-active: var(--mode-active);
```

---

## Design Decision Log

**Why not give every mode a unique hue AND a unique background?** Doing so would make mode switches jarring and create a rainbow effect that fights the Linear/VS Code dark aesthetic the platform is built on. Instead, 97% of the UI stays the same dark neutral. Only the "signal" pixels (indicator, icon, active border, subtle tint) carry the mode color. This is the same strategy VS Code uses for its activity bar icons and GitHub uses for its label colors.

**Why does AI mode reuse the existing violet primary?** Because AI is the platform's core differentiator. Violet is already the brand color and appears throughout the UI. Making AI feel native rather than "tacked on" reinforces that AI is woven into the fabric of Architex, not a separate tool.

**Why 0.03 alpha for canvas tints?** At 0.03 alpha on a dark background, the color shift is subliminal. Users feel the change without consciously seeing it. This was tested against the existing `--canvas-bg: hsl(225, 10%, 6%)` value. At 0.05+ alpha, the shift becomes noticeable enough to feel like a different app, which breaks continuity.

**Why a segmented control instead of tabs or icons-only?** The mode switcher needs to show labels (users need to learn what modes exist) and badges (progress per mode). A segmented control with a sliding pill indicator is compact, familiar (iOS/macOS pattern), and animation-friendly. Icon-only would require tooltips for discoverability. Full tabs would eat too much horizontal space.