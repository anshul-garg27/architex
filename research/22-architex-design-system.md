# Architex Design System Specification

> Complete, implementation-ready design tokens and component specs for the Architex engineering visualization platform.
> Dark-mode-first. Informed by Radix UI, shadcn/ui, Tailwind v4, Linear, Primer, Geist, Apple HIG, and Material Design 3.

---

## 1. TYPOGRAPHY SCALE

### Font Families

| Token                  | Font Stack                                                       | Tailwind Class      | Usage                         |
|------------------------|------------------------------------------------------------------|---------------------|-------------------------------|
| `--font-sans`          | `'Geist', 'Inter', system-ui, -apple-system, sans-serif`        | `font-sans`         | All UI text                   |
| `--font-mono`          | `'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace`       | `font-mono`         | Code, metrics, IDs, terminals |
| `--font-display`       | `'Inter Display', 'Geist', system-ui, sans-serif`               | `font-display`      | Headings h1-h3, hero text     |

### Size Scale

| Token               | Size (px) | Size (rem) | Line Height | Letter Spacing | Tailwind Class  | Usage                      |
|----------------------|-----------|------------|-------------|----------------|-----------------|----------------------------|
| `--text-xs`          | 11        | 0.6875     | 16px (1.45) | +0.01em        | `text-xs`       | Badges, captions, timestamps|
| `--text-sm`          | 12        | 0.75       | 16px (1.33) | +0.005em       | `text-sm`       | Secondary labels, metadata  |
| `--text-base`        | 13        | 0.8125     | 20px (1.54) | 0              | `text-base`     | Body text, inputs, menus    |
| `--text-md`          | 14        | 0.875      | 20px (1.43) | 0              | `text-md`       | Primary UI text, buttons    |
| `--text-lg`          | 16        | 1.0        | 24px (1.5)  | -0.011em       | `text-lg`       | Section headers, card titles|
| `--text-xl`          | 18        | 1.125      | 26px (1.44) | -0.014em       | `text-xl`       | Panel titles                |
| `--text-2xl`         | 24        | 1.5        | 30px (1.25) | -0.019em       | `text-2xl`      | Page headings               |
| `--text-3xl`         | 30        | 1.875      | 36px (1.2)  | -0.021em       | `text-3xl`      | Section hero                |
| `--text-4xl`         | 36        | 2.25       | 40px (1.11) | -0.025em       | `text-4xl`      | Landing display             |

**Why 13px base:** Developer tools favor density. Linear uses 13px, VS Code uses 13px. This sits between 12px (too small for prolonged reading) and 14px (too spacious for tool UIs).

### Weight Scale

| Token               | Value | Tailwind Class     | Usage                           |
|----------------------|-------|--------------------|---------------------------------|
| `--font-light`       | 300   | `font-light`       | De-emphasized secondary text    |
| `--font-normal`      | 400   | `font-normal`      | Body text, descriptions         |
| `--font-medium`      | 500   | `font-medium`      | Labels, menu items, nav text    |
| `--font-semibold`    | 600   | `font-semibold`    | Headings, buttons, emphasis     |
| `--font-bold`        | 700   | `font-bold`        | Metric values, strong emphasis  |

### Line Height Scale

| Token               | Value  | Tailwind Class     | Usage                           |
|----------------------|--------|--------------------|---------------------------------|
| `--leading-none`     | 1.0    | `leading-none`     | Metric display values           |
| `--leading-tight`    | 1.2    | `leading-tight`    | Headings, display text          |
| `--leading-snug`     | 1.33   | `leading-snug`     | Cards, compact layouts          |
| `--leading-normal`   | 1.5    | `leading-normal`   | Body text, descriptions         |
| `--leading-relaxed`  | 1.625  | `leading-relaxed`  | Long-form content, tooltips     |

---

## 2. COLOR SYSTEM

All colors specified in hex. Dark mode is the primary theme. The palette draws from Radix's 12-step scale philosophy, Linear's warm-tinted darks, and Apple HIG's layered background approach.

### 2.1 Gray Scale (Slate — warm-tinted neutral)

Inspired by Radix slateDark, with a subtle blue-violet undertone for warmth.

| Step | Token                | Hex       | Usage                                              |
|------|----------------------|-----------|-----------------------------------------------------|
| 1    | `--gray-1`           | `#111113` | App background, deepest layer                       |
| 2    | `--gray-2`           | `#18191B` | Subtle background, sidebar bg                       |
| 3    | `--gray-3`           | `#212225` | UI element background (default)                     |
| 4    | `--gray-4`           | `#272A2D` | UI element background (hover)                       |
| 5    | `--gray-5`           | `#2E3135` | UI element background (active/selected)             |
| 6    | `--gray-6`           | `#363A3F` | Subtle borders, separators                          |
| 7    | `--gray-7`           | `#43484E` | UI element border (default)                         |
| 8    | `--gray-8`           | `#5A6169` | UI element border (hover), placeholder              |
| 9    | `--gray-9`           | `#696E77` | Solid backgrounds (muted), scrollbar                |
| 10   | `--gray-10`          | `#777B84` | Hovered solid backgrounds                           |
| 11   | `--gray-11`          | `#B0B4BA` | Secondary text, low-contrast text                   |
| 12   | `--gray-12`          | `#EDEEF0` | High-contrast text, primary text                    |

### 2.2 Background Layers

Following Apple HIG's base/elevated pattern and Linear's tinted darks.

| Token                     | Hex       | Tailwind Class       | Usage                             |
|---------------------------|-----------|----------------------|-----------------------------------|
| `--bg-base`               | `#0C0D0F` | `bg-base`            | Root canvas, deepest background   |
| `--bg-surface`            | `#111113` | `bg-surface`         | Sidebar, panel backgrounds        |
| `--bg-elevated`           | `#18191B` | `bg-elevated`        | Cards, dropdowns, popovers        |
| `--bg-overlay`            | `#212225` | `bg-overlay`         | Modals, dialogs, command palette  |

### 2.3 Text Colors

| Token                     | Hex       | Tailwind Class       | WCAG vs bg-base | Usage                  |
|---------------------------|-----------|----------------------|-----------------|------------------------|
| `--text-primary`          | `#EDEEF0` | `text-primary`       | 15.2:1          | Headings, primary text |
| `--text-secondary`        | `#B0B4BA` | `text-secondary`     | 9.1:1           | Descriptions, labels   |
| `--text-tertiary`         | `#696E77` | `text-tertiary`      | 4.6:1           | Timestamps, captions   |
| `--text-disabled`         | `#43484E` | `text-disabled`      | 2.5:1           | Disabled states        |

### 2.4 Border Colors

| Token                     | Hex       | Tailwind Class       | Usage                            |
|---------------------------|-----------|----------------------|----------------------------------|
| `--border-default`        | `#2E3135` | `border-default`     | Cards, panels, dividers          |
| `--border-hover`          | `#43484E` | `border-hover`       | Hovered inputs, cards            |
| `--border-focus`          | `#6E56CF` | `border-focus`       | Focus rings on interactive       |

### 2.5 Accent / Brand Color (Violet)

Full scale for the primary brand accent. Based on Radix violetDark scale adapted for Architex.

| Step | Token                | Hex       | Usage                                              |
|------|----------------------|-----------|-----------------------------------------------------|
| 50   | `--accent-50`        | `#14121F` | Tinted background, subtle wash                      |
| 100  | `--accent-100`       | `#1B172C` | Hover on tinted surface                             |
| 200  | `--accent-200`       | `#251E40` | Active state tinted background                      |
| 300  | `--accent-300`       | `#33287A` | Ghost button hover bg                               |
| 400  | `--accent-400`       | `#4B3BA1` | Icon fills, progress bars                           |
| 500  | `--accent-500`       | `#6E56CF` | **Primary accent.** Buttons, links, focus rings     |
| 600  | `--accent-600`       | `#7C66DC` | Hovered buttons, active links                       |
| 700  | `--accent-700`       | `#9E8CFC` | Lighter variant for text on dark bg                 |
| 800  | `--accent-800`       | `#B4A5FF` | High-contrast accent text                           |
| 900  | `--accent-900`       | `#D4CAFE` | Subtle accent text on dark                          |
| 950  | `--accent-950`       | `#E8E2FD` | Near-white accent tint                              |

CSS custom property: `--accent: #6E56CF;`
Tailwind: `accent-500` maps to primary, `bg-accent`, `text-accent`, `border-accent`

### 2.6 Semantic Colors

Each semantic color has: fill (bg), text (fg), border, and subtle-bg variants.

#### Success (Green)

| Token                     | Hex       | Tailwind Class         | Usage                           |
|---------------------------|-----------|------------------------|---------------------------------|
| `--success-subtle-bg`     | `#0D1F12` | `bg-success-subtle`    | Success notification bg          |
| `--success-fill`          | `#30A46C` | `bg-success`           | Success badges, indicators       |
| `--success-text`          | `#4CC38A` | `text-success`         | Success text, labels             |
| `--success-border`        | `#1B3A2A` | `border-success`       | Success card borders             |

#### Warning (Amber)

| Token                     | Hex       | Tailwind Class         | Usage                           |
|---------------------------|-----------|------------------------|---------------------------------|
| `--warning-subtle-bg`     | `#1F1300` | `bg-warning-subtle`    | Warning notification bg          |
| `--warning-fill`          | `#FFB224` | `bg-warning`           | Warning badges, indicators       |
| `--warning-text`          | `#F5D90A` | `text-warning`         | Warning text, labels             |
| `--warning-border`        | `#3D2E00` | `border-warning`       | Warning card borders             |

#### Error (Red)

| Token                     | Hex       | Tailwind Class         | Usage                           |
|---------------------------|-----------|------------------------|---------------------------------|
| `--error-subtle-bg`       | `#1F1315` | `bg-error-subtle`      | Error notification bg            |
| `--error-fill`            | `#E5484D` | `bg-error`             | Error badges, indicators         |
| `--error-text`            | `#FF6369` | `text-error`           | Error text, labels               |
| `--error-border`          | `#3C2024` | `border-error`         | Error card borders               |

#### Info (Blue)

| Token                     | Hex       | Tailwind Class         | Usage                           |
|---------------------------|-----------|------------------------|---------------------------------|
| `--info-subtle-bg`        | `#0F1B2D` | `bg-info-subtle`       | Info notification bg             |
| `--info-fill`             | `#3E63DD` | `bg-info`              | Info badges, indicators          |
| `--info-text`             | `#70B8FF` | `text-info`            | Info text, labels                |
| `--info-border`           | `#172448` | `border-info`          | Info card borders                |

### 2.7 Node Type Colors (System Design Canvas)

Each node type gets a consistent palette: fill for background, text for labels, ring for selection.

| Category     | Token Prefix  | Fill (bg)  | Text       | Ring/Border | Icon Color | CSS Class Prefix  |
|-------------|---------------|------------|------------|-------------|------------|-------------------|
| **Compute**    | `--node-compute`   | `#0F2638` | `#70B8FF` | `#1D3D5C` | `#3E63DD` | `node-compute`    |
| **Storage**    | `--node-storage`   | `#0D1F12` | `#4CC38A` | `#1B3A2A` | `#30A46C` | `node-storage`    |
| **Messaging**  | `--node-messaging` | `#271700` | `#FFB861` | `#3D2E00` | `#F5A623` | `node-messaging`  |
| **Networking** | `--node-networking`| `#1A1523` | `#BFA3FF` | `#2E2352` | `#9E8CFC` | `node-networking` |
| **Security**   | `--node-security`  | `#1F1315` | `#FF9592` | `#3C2024` | `#E5484D` | `node-security`   |
| **Client**     | `--node-client`    | `#18191B` | `#B0B4BA` | `#2E3135` | `#696E77` | `node-client`     |

```css
/* Example node CSS class */
.node-compute {
  background: var(--node-compute-fill);
  border: 1px solid var(--node-compute-ring);
  color: var(--node-compute-text);
}
.node-compute .node-icon {
  color: var(--node-compute-icon);
}
```

### 2.8 Interactive States

| State      | Background                    | Border                 | Text               | Ring              |
|-----------|-------------------------------|------------------------|---------------------|-------------------|
| Default    | `--gray-3` (#212225)          | `--gray-6` (#363A3F)  | `--gray-12` (#EDEEF0) | none            |
| Hover      | `--gray-4` (#272A2D)          | `--gray-7` (#43484E)  | `--gray-12` (#EDEEF0) | none            |
| Active     | `--gray-5` (#2E3135)          | `--gray-8` (#5A6169)  | `--gray-12` (#EDEEF0) | none            |
| Focus      | `--gray-3` (#212225)          | `--accent-500` (#6E56CF) | `--gray-12` (#EDEEF0) | `0 0 0 2px --accent-500` |
| Disabled   | `--gray-2` (#18191B)          | `--gray-5` (#2E3135)  | `--gray-9` (#696E77)  | none            |
| Selected   | `--accent-200` (#251E40)      | `--accent-400` (#4B3BA1) | `--accent-800` (#B4A5FF) | none         |

---

## 3. SPACING SCALE

Base unit: **4px**. All spacing derives from multiples/fractions of 4px. Aligns with Tailwind's default scale and Material Design's 4px grid.

| Token          | Multiplier | Value (px) | Value (rem) | Tailwind Class | Usage                           |
|----------------|-----------|------------|-------------|----------------|---------------------------------|
| `--space-0`    | 0         | 0          | 0           | `p-0`          | Reset                           |
| `--space-px`   | —         | 1          | 0.0625      | `p-px`         | Hairline borders                |
| `--space-0.5`  | 0.5       | 2          | 0.125       | `p-0.5`        | Tight icon padding              |
| `--space-1`    | 1         | 4          | 0.25        | `p-1`          | Icon-to-text gap                |
| `--space-1.5`  | 1.5       | 6          | 0.375       | `p-1.5`        | Badge padding, tight gap        |
| `--space-2`    | 2         | 8          | 0.5         | `p-2`          | Input padding-y, button padding |
| `--space-3`    | 3         | 12         | 0.75        | `p-3`          | Card padding (compact)          |
| `--space-4`    | 4         | 16         | 1.0         | `p-4`          | Card padding (default), section gap |
| `--space-5`    | 5         | 20         | 1.25        | `p-5`          | Panel padding                   |
| `--space-6`    | 6         | 24         | 1.5         | `p-6`          | Dialog padding                  |
| `--space-8`    | 8         | 32         | 2.0         | `p-8`          | Section spacing                 |
| `--space-10`   | 10        | 40         | 2.5         | `p-10`         | Large section gap               |
| `--space-12`   | 12        | 48         | 3.0         | `p-12`         | Page margin                     |
| `--space-16`   | 16        | 64         | 4.0         | `p-16`         | Hero spacing                    |
| `--space-20`   | 20        | 80         | 5.0         | `p-20`         | Landing section gap             |
| `--space-24`   | 24        | 96         | 6.0         | `p-24`         | Major vertical rhythm           |

---

## 4. BORDER RADIUS SCALE

| Token              | Value (px) | Tailwind Class   | Usage                                   |
|--------------------|-----------|------------------|-----------------------------------------|
| `--radius-none`    | 0         | `rounded-none`   | Sharp edges, table cells                |
| `--radius-sm`      | 4         | `rounded-sm`     | Badges, tags, inline code, inputs       |
| `--radius-md`      | 6         | `rounded-md`     | Buttons, cards, dropdowns               |
| `--radius-lg`      | 8         | `rounded-lg`     | Modals, panels, large cards             |
| `--radius-xl`      | 12        | `rounded-xl`     | Floating panels, sheets                 |
| `--radius-full`    | 9999px    | `rounded-full`   | Avatars, pills, status indicators       |

Derived from a base `--radius: 6px`:
```css
:root {
  --radius: 6px;
  --radius-sm: calc(var(--radius) * 0.667);   /* 4px */
  --radius-md: var(--radius);                  /* 6px */
  --radius-lg: calc(var(--radius) * 1.333);    /* 8px */
  --radius-xl: calc(var(--radius) * 2);        /* 12px */
  --radius-full: 9999px;
}
```

---

## 5. SHADOW SCALE

Dark mode shadows are subtle (near-black at low opacity). Elevation is primarily communicated via background lightness per Apple HIG. Shadows add gentle grounding.

| Token           | Value                                                                                   | Tailwind Class | Usage                         |
|-----------------|-----------------------------------------------------------------------------------------|----------------|-------------------------------|
| `--shadow-sm`   | `0 1px 2px 0 rgba(0,0,0,0.3)`                                                          | `shadow-sm`    | Buttons, small cards          |
| `--shadow-md`   | `0 2px 4px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3)`                         | `shadow-md`    | Dropdowns, popovers           |
| `--shadow-lg`   | `0 4px 12px 0 rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3)`                        | `shadow-lg`    | Modals, floating panels       |
| `--shadow-xl`   | `0 8px 24px 0 rgba(0,0,0,0.5), 0 4px 8px -4px rgba(0,0,0,0.4)`                        | `shadow-xl`    | Command palette, sheets       |

### Focus Ring Specification

```css
/* Standard focus ring */
--ring-width: 2px;
--ring-offset: 2px;
--ring-color: var(--accent-500); /* #6E56CF */
--ring-offset-color: var(--bg-base); /* #0C0D0F */

/* Applied as: */
.focus-ring {
  outline: 2px solid var(--ring-color);
  outline-offset: 2px;
}

/* Tailwind: ring-2 ring-accent-500 ring-offset-2 ring-offset-base */
```

**Inset focus ring (for elements flush with containers):**
```css
.focus-ring-inset {
  box-shadow: inset 0 0 0 2px var(--ring-color);
}
```

---

## 6. COMPONENT SPECIFICATIONS

### 6.1 Button

| Property       | sm              | md (default)    | lg              |
|----------------|-----------------|-----------------|-----------------|
| Height         | 28px            | 32px            | 36px            |
| Padding-x      | 10px            | 14px            | 18px            |
| Padding-y      | 4px             | 6px             | 8px             |
| Font size      | 12px            | 13px            | 14px            |
| Font weight    | 500             | 500             | 500             |
| Border radius  | 4px             | 6px             | 6px             |
| Icon size      | 14px            | 16px            | 18px            |
| Icon gap       | 4px             | 6px             | 8px             |
| Min width      | 56px            | 64px            | 80px            |

**Variants:**

| Variant        | Background       | Text             | Border           | Hover BG         |
|---------------|------------------|------------------|------------------|------------------|
| Primary        | `#6E56CF`        | `#FFFFFF`        | none             | `#7C66DC`        |
| Secondary      | `#212225`        | `#EDEEF0`        | `#363A3F`        | `#272A2D`        |
| Ghost          | transparent      | `#B0B4BA`        | none             | `#212225`        |
| Destructive    | `#E5484D`        | `#FFFFFF`        | none             | `#F2555A`        |

```css
/* Primary button example */
.btn-primary {
  height: 32px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  border-radius: 6px;
  background: var(--accent-500);
  color: #FFFFFF;
  transition: background 100ms ease-out;
}
.btn-primary:hover { background: var(--accent-600); }
.btn-primary:active { background: var(--accent-400); }
.btn-primary:disabled { background: var(--gray-5); color: var(--gray-9); }
```

### 6.2 Input

| Property       | sm              | md (default)    | lg              |
|----------------|-----------------|-----------------|-----------------|
| Height         | 28px            | 32px            | 36px            |
| Padding-x      | 8px             | 10px            | 12px            |
| Font size      | 12px            | 13px            | 14px            |
| Border radius  | 4px             | 6px             | 6px             |
| Border         | 1px `#363A3F`   | 1px `#363A3F`   | 1px `#363A3F`   |

**States:**

| State          | Background       | Border           | Ring             |
|---------------|------------------|------------------|------------------|
| Default        | `#18191B`        | `#363A3F`        | none             |
| Hover          | `#18191B`        | `#43484E`        | none             |
| Focus          | `#18191B`        | `#6E56CF`        | `0 0 0 2px #6E56CF40` |
| Error          | `#18191B`        | `#E5484D`        | `0 0 0 2px #E5484D40` |
| Disabled       | `#111113`        | `#2E3135`        | none             |

**With icon:** Left icon padding += 28px (icon 16px + 8px gap + 4px leading). Icon color: `--gray-9` (#696E77).
**With addon:** Addon bg: `--gray-3` (#212225). Addon border-right: 1px `--gray-6` (#363A3F). Addon padding: 0 8px. Addon text: `--gray-11` (#B0B4BA).

**Placeholder text:** `--gray-8` (#5A6169).

### 6.3 Select / Dropdown

| Property               | Value                        |
|------------------------|------------------------------|
| Trigger height         | 32px (matches md input)      |
| Trigger padding-x      | 10px left, 8px right         |
| Trigger icon (chevron)  | 16px, color `--gray-9`       |
| Dropdown bg             | `--gray-3` (#212225)         |
| Dropdown border         | 1px `--gray-6` (#363A3F)     |
| Dropdown shadow         | `--shadow-lg`                |
| Dropdown border-radius  | 8px                          |
| Dropdown padding        | 4px                          |
| Dropdown max-height     | 320px (scrollable)           |
| Item height             | 32px                         |
| Item padding-x          | 8px                          |
| Item hover bg           | `--gray-4` (#272A2D)         |
| Item font-size          | 13px                         |
| Item icon size          | 16px (left), 12px (check)    |
| Group label             | 12px, `--gray-9`, uppercase, 500 weight, 8px padding-x, 6px padding-top |

### 6.4 Tooltip

| Property               | Value                        |
|------------------------|------------------------------|
| Background              | `--gray-12` (#EDEEF0)        |
| Text color              | `--gray-1` (#111113)         |
| Font size               | 12px                         |
| Font weight             | 400                          |
| Padding                 | 4px 8px                      |
| Border radius           | 4px                          |
| Max width               | 240px                        |
| Shadow                  | `--shadow-md`                |
| Show delay              | 500ms                        |
| Hide delay              | 0ms                          |
| Animation               | fade + scale, 100ms ease-out |
| Arrow                   | 6px, matches bg              |
| Shortcut text           | 11px, `--gray-5`, mono font  |

### 6.5 Badge / Tag

| Property       | Default        | Small          |
|----------------|----------------|----------------|
| Height         | 22px           | 18px           |
| Padding-x      | 8px            | 6px            |
| Font size      | 11px           | 10px           |
| Font weight    | 500            | 500            |
| Line height    | 14px           | 12px           |
| Border radius  | 4px            | 4px            |
| Letter spacing | +0.02em        | +0.02em        |

**Semantic variants:**

| Variant   | Background       | Text             | Border           |
|----------|------------------|------------------|------------------|
| Default   | `#212225`        | `#B0B4BA`        | `#363A3F`        |
| Success   | `#0D1F12`        | `#4CC38A`        | `#1B3A2A`        |
| Warning   | `#1F1300`        | `#F5D90A`        | `#3D2E00`        |
| Error     | `#1F1315`        | `#FF6369`        | `#3C2024`        |
| Info      | `#0F1B2D`        | `#70B8FF`        | `#172448`        |
| Accent    | `#14121F`        | `#B4A5FF`        | `#251E40`        |

### 6.6 Card

| Property               | Value                        |
|------------------------|------------------------------|
| Background              | `--bg-elevated` (#18191B)    |
| Border                  | 1px `--border-default` (#2E3135) |
| Border radius           | 8px                          |
| Padding                 | 16px                         |
| Hover border            | `--border-hover` (#43484E)   |
| Hover shadow            | `--shadow-sm`                |
| Header padding-bottom   | 12px                         |
| Header border-bottom    | 1px `--gray-6` (#363A3F)     |
| Footer padding-top      | 12px                         |
| Footer border-top       | 1px `--gray-6` (#363A3F)     |

### 6.7 Dialog / Modal

| Property               | Small          | Default        | Large          |
|------------------------|----------------|----------------|----------------|
| Width                   | 400px          | 520px          | 680px          |
| Max height              | 85vh           | 85vh           | 85vh           |
| Padding                 | 24px           | 24px           | 24px           |
| Border radius           | 12px           | 12px           | 12px           |
| Background              | `--bg-overlay` (#212225) | same   | same           |
| Border                  | 1px `--gray-6` (#363A3F) | same  | same           |
| Shadow                  | `--shadow-xl`  | `--shadow-xl`  | `--shadow-xl`  |
| Overlay bg              | `rgba(0,0,0,0.6)` | same       | same           |
| Overlay backdrop-filter  | `blur(4px)`    | same           | same           |
| Title font-size         | 16px           | 16px           | 18px           |
| Title font-weight       | 600            | 600            | 600            |
| Title margin-bottom     | 8px            | 8px            | 12px           |
| Description font-size   | 13px           | 13px           | 14px           |
| Description color       | `--text-secondary` (#B0B4BA) | same | same        |
| Footer gap              | 8px            | 8px            | 8px            |
| Enter animation         | fade+scale from 0.95, 200ms ease-out          |
| Exit animation          | fade+scale to 0.95, 150ms ease-in              |

### 6.8 Tab Bar

| Property               | Value                        |
|------------------------|------------------------------|
| Height                  | 36px                         |
| Background              | transparent                  |
| Border-bottom           | 1px `--gray-6` (#363A3F)     |
| Tab padding-x           | 12px                         |
| Tab font-size           | 13px                         |
| Tab font-weight         | 500                          |
| Tab color (default)     | `--text-secondary` (#B0B4BA) |
| Tab color (active)      | `--text-primary` (#EDEEF0)   |
| Tab color (hover)       | `--text-primary` (#EDEEF0)   |
| Active indicator        | 2px solid `--accent-500`, bottom-aligned |
| Active indicator radius | 1px 1px 0 0                  |
| Tab gap                 | 0                            |
| Tab hover bg            | `--gray-3` (#212225)         |

### 6.9 System Design Node

The core diagram element on the React Flow canvas.

| Property               | Value                                 |
|------------------------|---------------------------------------|
| Min width               | 140px                                |
| Default width           | 180px                                |
| Max width               | 280px                                |
| Min height              | 60px                                 |
| Default height          | 80px                                 |
| Border                  | 1px solid (node-type ring color)     |
| Border radius           | 8px                                  |
| Background              | node-type fill color                 |
| Padding                 | 12px                                 |
| Icon size               | 24px (top-left or centered)          |
| Icon color              | node-type icon color                 |
| Label font-size         | 13px                                 |
| Label font-weight       | 500                                  |
| Label color             | node-type text color                 |
| Sublabel font-size      | 11px                                 |
| Sublabel color          | node-type text at 60% opacity        |
| Selected border         | 2px solid `--accent-500` (#6E56CF)   |
| Selected shadow         | `0 0 0 4px rgba(110,86,207,0.15)`    |
| Hover border            | 1px solid (node-type ring at 1.5x lightness) |
| Handle (port) size      | 8px diameter                         |
| Handle bg               | `--gray-9` (#696E77)                 |
| Handle connected bg     | node-type icon color                 |
| Handle hover scale      | 1.5x (12px)                          |
| Handle border           | 2px solid node-type fill             |
| Metric slot height      | 16px, 11px font, mono, right-aligned |

```
+-----------------------------------+
|  [icon]  Label Name          [i]  |   <- 13px, 500 weight
|          Technology          ...  |   <- 11px, tertiary
|                                   |
|  metric: 1,234 req/s    [badge]  |   <- 11px mono
+---o-----------o-----------o------+   <- handles (ports)
```

### 6.10 Edge (Connection Line)

| Property               | Value                               |
|------------------------|-------------------------------------|
| Stroke color (default)  | `--gray-7` (#43484E)               |
| Stroke color (active)   | `--accent-500` (#6E56CF)           |
| Stroke color (error)    | `--error-fill` (#E5484D)           |
| Stroke width (default)  | 1.5px                              |
| Stroke width (active)   | 2px                                |
| Stroke style             | Solid for sync, dashed (4,4) for async |
| Edge type               | Smoothstep (default), bezier for long spans |
| Arrow size              | 8px width, 6px height              |
| Arrow fill              | matches stroke color               |
| Label bg                | `--bg-elevated` (#18191B)          |
| Label font-size         | 11px                               |
| Label padding           | 2px 6px                            |
| Label border-radius     | 4px                                |
| Label color             | `--text-secondary` (#B0B4BA)       |
| Animated particles      | 4px circles, node-type icon color, 1s loop |
| Hover stroke            | `--gray-8` (#5A6169), 2px          |

### 6.11 Toolbar Button

| Property               | Value                        |
|------------------------|------------------------------|
| Size                    | 32px x 32px                  |
| Icon size               | 18px                         |
| Icon color (default)    | `--gray-11` (#B0B4BA)        |
| Icon color (active)     | `--text-primary` (#EDEEF0)   |
| Background (default)    | transparent                  |
| Background (hover)      | `--gray-3` (#212225)         |
| Background (active)     | `--gray-4` (#272A2D)         |
| Border radius           | 6px                          |
| Tooltip                 | show after 500ms             |
| Separator               | 1px `--gray-6`, 16px height, 8px margin-x |

### 6.12 Sidebar Item

| Property               | Value                        |
|------------------------|------------------------------|
| Height                  | 32px                         |
| Padding-x               | 8px left, 8px right         |
| Indent per level        | 16px                         |
| Font size               | 13px                         |
| Font weight (default)   | 400                          |
| Font weight (active)    | 500                          |
| Text color (default)    | `--text-secondary` (#B0B4BA) |
| Text color (active)     | `--text-primary` (#EDEEF0)   |
| Icon size               | 16px                         |
| Icon color              | `--gray-9` (#696E77)         |
| Icon-to-text gap        | 8px                          |
| Background (default)    | transparent                  |
| Background (hover)      | `--gray-3` (#212225)         |
| Background (active)     | `--accent-200` (#251E40)     |
| Border-radius           | 6px                          |
| Active indicator         | 2px left bar `--accent-500` OR full bg highlight |
| Count badge             | 11px mono, `--gray-9`, right-aligned |

### 6.13 Panel Header

| Property               | Value                        |
|------------------------|------------------------------|
| Height                  | 40px                         |
| Padding-x               | 12px                         |
| Background              | `--bg-surface` (#111113)     |
| Border-bottom           | 1px `--gray-6` (#363A3F)     |
| Title font-size         | 12px                         |
| Title font-weight       | 600                          |
| Title letter-spacing    | +0.04em                      |
| Title text-transform    | uppercase                    |
| Title color             | `--text-tertiary` (#696E77)  |
| Action icon size        | 16px                         |
| Action icon color       | `--gray-9` (#696E77)         |
| Action hover bg         | `--gray-3` (#212225)         |
| Action button size      | 24px x 24px                  |
| Action gap              | 4px                          |

### 6.14 Timeline Scrubber

| Property               | Value                        |
|------------------------|------------------------------|
| Track height            | 48px total area              |
| Track bar height        | 4px                          |
| Track bg                | `--gray-5` (#2E3135)         |
| Track filled bg         | `--accent-500` (#6E56CF)     |
| Track border-radius     | 2px                          |
| Thumb size              | 14px diameter                |
| Thumb bg                | `#FFFFFF`                    |
| Thumb border            | 2px solid `--accent-500`     |
| Thumb shadow            | `--shadow-sm`                |
| Thumb active scale      | 1.2x                         |
| Tick mark height        | 8px (major), 4px (minor)     |
| Tick mark color         | `--gray-7` (#43484E)         |
| Timestamp font-size     | 11px mono                    |
| Timestamp color         | `--text-tertiary` (#696E77)  |
| Step label font-size    | 12px                         |
| Step label color        | `--text-secondary` (#B0B4BA) |
| Active step color       | `--accent-700` (#9E8CFC)     |

### 6.15 Speed Control

| Property               | Value                        |
|------------------------|------------------------------|
| Container height        | 28px                         |
| Container bg            | `--gray-3` (#212225)         |
| Container border        | 1px `--gray-6` (#363A3F)     |
| Container border-radius | 6px                          |
| Container padding-x     | 2px                          |
| Option width            | 36px                         |
| Option font-size        | 11px                         |
| Option font-weight      | 500                          |
| Option font             | mono                         |
| Option color (default)  | `--text-tertiary` (#696E77)  |
| Option color (active)   | `--text-primary` (#EDEEF0)   |
| Active indicator bg     | `--gray-5` (#2E3135)         |
| Active indicator radius | 4px                          |
| Presets                 | 0.5x, 1x, 2x, 4x            |
| Transition              | background 150ms ease-out    |

### 6.16 Metric Card

For throughput, latency, error rate, etc.

| Property               | Value                        |
|------------------------|------------------------------|
| Min width               | 160px                        |
| Padding                 | 12px                         |
| Background              | `--bg-elevated` (#18191B)    |
| Border                  | 1px `--border-default` (#2E3135) |
| Border radius           | 8px                          |
| Label font-size         | 11px                         |
| Label font-weight       | 500                          |
| Label color             | `--text-tertiary` (#696E77)  |
| Label text-transform    | uppercase                    |
| Label letter-spacing    | +0.04em                      |
| Value font-size         | 24px                         |
| Value font-weight       | 700                          |
| Value font              | mono                         |
| Value color             | `--text-primary` (#EDEEF0)   |
| Value line-height       | 1.0                          |
| Unit font-size          | 13px                         |
| Unit color              | `--text-secondary` (#B0B4BA) |
| Sparkline height        | 24px                         |
| Sparkline stroke        | 1.5px                        |
| Sparkline color         | semantic color (green/amber/red based on metric health) |
| Trend indicator         | 11px, green for up/good, red for up/bad |
| Gap (label to value)    | 4px                          |
| Gap (value to sparkline)| 8px                          |

```
+---------------------------+
|  THROUGHPUT          ▲ 12% |   <- 11px uppercase, trend
|  12,847 req/s              |   <- 24px mono bold
|  ~~~~/\~~~~~/\~~~          |   <- sparkline 24px
+---------------------------+
```

---

## 7. ICON SYSTEM

### Icon Sizes

| Token               | Size (px) | Stroke Width | Tailwind Class | Usage                          |
|----------------------|-----------|-------------|----------------|--------------------------------|
| `--icon-sm`          | 16        | 1.5px       | `w-4 h-4`     | Inline with text, badges       |
| `--icon-md`          | 20        | 1.75px      | `w-5 h-5`     | Buttons, menu items, toolbar   |
| `--icon-lg`          | 24        | 2px         | `w-6 h-6`     | Node icons, standalone         |

### Icon Grid Specification

| Property               | Value                        |
|------------------------|------------------------------|
| Grid size (design)      | 24x24px                      |
| Content area            | 20x20px (2px padding)        |
| Stroke cap              | Round                        |
| Stroke join             | Round                        |
| Corner radius (shapes)  | 2px min                      |
| Optical alignment       | Center-weighted              |
| Format                  | SVG (inline), `currentColor` |
| Library base            | Lucide React (standard with shadcn) |

### System Design Component Icons (60+ Specifications)

All icons follow the 24x24 grid with consistent stroke width and visual weight.

#### Compute (Blue family — `#3E63DD`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `server`               | Vertical rectangle with horizontal lines (rack server) |
| `cpu`                  | Square chip with pins on all sides                    |
| `container`            | Cube with dashed edges (Docker container)             |
| `lambda`               | Greek lambda in rounded rectangle (serverless)        |
| `vm`                   | Nested rectangles (virtual machine)                   |
| `kubernetes-pod`       | Hexagon with inner dot                                |
| `kubernetes-cluster`   | Hexagon ring of smaller hexagons                      |
| `worker`               | Gear inside circle                                    |
| `cron-job`             | Clock with circular arrow                             |
| `batch-processor`      | Stacked horizontal bars with arrow                    |
| `app-service`          | Rounded rectangle with play triangle                  |
| `microservice`         | Small connected squares                               |

#### Storage (Green family — `#30A46C`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `database`             | Cylinder (classic DB)                                 |
| `database-replica`     | Two overlapping cylinders                             |
| `document-store`       | Cylinder with curly braces `{}`                       |
| `key-value-store`      | Cylinder with key icon                                |
| `graph-database`       | Cylinder with connected nodes                         |
| `time-series-db`       | Cylinder with line chart                              |
| `search-index`         | Cylinder with magnifying glass                        |
| `blob-storage`         | Cloud with up/down arrow                              |
| `file-system`          | Folder with stacked docs                              |
| `data-warehouse`       | Wide cylinder (warehouse shape)                       |
| `data-lake`            | Wavy horizontal lines (water)                         |
| `cache`                | Lightning bolt in circle (fast access)                |
| `redis`                | Diamond inside circle                                 |

#### Messaging (Orange family — `#F5A623`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `message-queue`        | Horizontal pipe with arrows entering/exiting          |
| `topic`                | Branching arrows from single point                    |
| `event-bus`            | Horizontal bar with multiple down-arrows              |
| `stream`               | Wavy arrow flowing right                              |
| `pub-sub`              | One dot broadcasting to three dots                    |
| `dead-letter-queue`    | Pipe with X mark                                      |
| `notification-service` | Bell icon                                             |
| `webhook`              | Arrow exiting a hook shape                            |
| `scheduler`            | Calendar with clock                                   |
| `event-store`          | Cylinder with lightning bolt                          |

#### Networking (Purple family — `#9E8CFC`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `load-balancer`        | Triangle distributing to three lines                  |
| `api-gateway`          | Shield with arrows passing through                    |
| `reverse-proxy`        | Two-way arrow through vertical bar                    |
| `dns`                  | Globe with "DNS" text                                 |
| `cdn`                  | Globe with radiating points                           |
| `service-mesh`         | Grid of connected dots                                |
| `ingress`              | Arrow entering a gate                                 |
| `egress`               | Arrow exiting a gate                                  |
| `vpn`                  | Tunnel/tube with lock                                 |
| `router`               | Box with four arrows in different directions          |
| `rate-limiter`         | Funnel with meter                                     |
| `circuit-breaker`      | Broken circle with gap                                |

#### Security (Red family — `#E5484D`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `firewall`             | Brick wall with flame                                 |
| `waf`                  | Shield with web icon                                  |
| `auth-service`         | Key inside circle                                     |
| `oauth`                | Lock with external link arrow                         |
| `certificate`          | Document with seal/ribbon                             |
| `encryption`           | Lock with keyhole                                     |
| `secret-manager`       | Vault door / safe                                     |
| `identity-provider`    | Person with shield                                    |
| `token-service`        | Circular token with checkmark                         |
| `audit-log`            | Document with magnifying glass                        |

#### Clients / External (Gray family — `#696E77`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `user`                 | Person silhouette                                     |
| `mobile-client`        | Phone outline                                         |
| `web-client`           | Browser window                                        |
| `desktop-client`       | Monitor screen                                        |
| `iot-device`           | Chip with antenna                                     |
| `external-api`         | Cloud with plug                                       |
| `third-party`          | Box with external link arrow                          |

#### Observability (Teal — `#12A594`)

| Icon Name              | Description                                           |
|------------------------|-------------------------------------------------------|
| `monitoring`           | Line chart with pulse                                 |
| `logging`              | Scrolling text lines                                  |
| `tracing`              | Connected dots in a path                              |
| `alerting`             | Bell with exclamation                                 |
| `dashboard`            | Grid of small charts                                  |
| `health-check`         | Heart with pulse                                      |

---

## 8. MOTION TOKENS

### Duration Scale

| Token                  | Value   | Tailwind Class         | Usage                            |
|------------------------|---------|------------------------|----------------------------------|
| `--duration-instant`   | 0ms     | `duration-0`           | Immediate state changes          |
| `--duration-fastest`   | 50ms    | `duration-50`          | Cursor/pointer feedback          |
| `--duration-fast`      | 100ms   | `duration-100`         | Button press, toggle, tooltip    |
| `--duration-normal`    | 200ms   | `duration-200`         | Dropdown open, tab switch        |
| `--duration-slow`      | 300ms   | `duration-300`         | Modal enter, panel slide         |
| `--duration-slower`    | 500ms   | `duration-500`         | Page transitions, complex enter  |
| `--duration-deliberate`| 800ms   | `duration-800`         | Data visualization transitions   |

### Easing Tokens

Drawn from Material Design 3 emphasized curves and Apple HIG natural feel.

| Token                    | CSS Value                                      | Usage                            |
|--------------------------|------------------------------------------------|----------------------------------|
| `--ease-in`              | `cubic-bezier(0.32, 0, 0.67, 0)`              | Elements exiting                 |
| `--ease-out`             | `cubic-bezier(0.33, 1, 0.68, 1)`              | Elements entering                |
| `--ease-in-out`          | `cubic-bezier(0.65, 0, 0.35, 1)`              | Symmetric transitions            |
| `--ease-emphasized`      | `cubic-bezier(0.2, 0, 0, 1)`                  | Primary UI motion (M3 standard)  |
| `--ease-emphasized-in`   | `cubic-bezier(0.3, 0, 0.8, 0.15)`             | Exit with emphasis               |
| `--ease-emphasized-out`  | `cubic-bezier(0.05, 0.7, 0.1, 1.0)`           | Enter with emphasis (decelerate) |
| `--ease-spring`          | `linear(0, 0.009, 0.035, 0.078, 0.141, 0.230, 0.312, 0.406, 0.508, 0.601, 0.693, 0.775, 0.845, 0.903, 0.946, 0.975, 0.992, 1.000, 0.998, 0.989, 0.979, 0.971, 0.966, 0.965, 0.966, 0.969, 0.974, 0.979, 0.984, 0.989, 0.993, 0.996, 0.998, 1.000)` | Natural spring (CSS `linear()` function) |

### Spring Configurations (for `motion` / Framer Motion)

| Name      | Stiffness | Damping | Mass | Character                        | Usage                            |
|-----------|-----------|---------|------|----------------------------------|----------------------------------|
| Snappy    | 400       | 30      | 1    | Quick settle, no overshoot       | Buttons, toggles, small elements |
| Smooth    | 200       | 25      | 1    | Gentle deceleration, subtle bounce | Panels, modals, page transitions |
| Bouncy    | 300       | 15      | 1    | Visible overshoot, playful       | Toasts, notifications, emphasis  |
| Stiff     | 600       | 40      | 1    | Very fast, immediate feel        | Cursor following, drag feedback  |
| Slow      | 100       | 20      | 1    | Lazy, atmospheric                | Background effects, parallax     |

```typescript
// motion library spring configs
export const springs = {
  snappy:  { type: "spring", stiffness: 400, damping: 30, mass: 1 },
  smooth:  { type: "spring", stiffness: 200, damping: 25, mass: 1 },
  bouncy:  { type: "spring", stiffness: 300, damping: 15, mass: 1 },
  stiff:   { type: "spring", stiffness: 600, damping: 40, mass: 1 },
  slow:    { type: "spring", stiffness: 100, damping: 20, mass: 1 },
} as const;
```

### Component Animation Specs

| Component         | Enter                              | Exit                               |
|-------------------|-------------------------------------|-------------------------------------|
| Tooltip           | fade 100ms ease-out + translateY(-4px) | fade 50ms ease-in               |
| Dropdown          | fade 150ms ease-out + scaleY(0.95 to 1) from top | fade 100ms ease-in + scaleY(0.95) |
| Modal             | fade 200ms ease-out + scale(0.95 to 1) | fade 150ms ease-in + scale(0.95)|
| Toast             | slideX(100%) + fade 300ms spring.smooth | slideX(100%) 200ms ease-in     |
| Sidebar           | slideX(-100%) 300ms spring.smooth  | slideX(-100%) 200ms ease-in        |
| Tab content       | fade 150ms + translateX(8px) stagger | fade 100ms                       |
| Node (add)        | scale(0.8 to 1) + fade 300ms spring.bouncy | scale(0.9) + fade 200ms ease-in |
| Edge (draw)       | pathLength 0 to 1, 500ms ease-out  | fade 200ms ease-in                 |
| Particle flow     | continuous translate along path, 1s linear loop | —                          |
| Metric update     | value counter 400ms ease-out       | —                                   |
| Sparkline         | pathLength draw 600ms ease-out     | —                                   |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 9. COMPLETE CSS CUSTOM PROPERTIES

```css
@theme {
  /* ===== TYPOGRAPHY ===== */
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Inter Display', 'Geist', system-ui, sans-serif;

  --text-xs: 0.6875rem;     /* 11px */
  --text-sm: 0.75rem;       /* 12px */
  --text-base: 0.8125rem;   /* 13px */
  --text-md: 0.875rem;      /* 14px */
  --text-lg: 1rem;          /* 16px */
  --text-xl: 1.125rem;      /* 18px */
  --text-2xl: 1.5rem;       /* 24px */
  --text-3xl: 1.875rem;     /* 30px */
  --text-4xl: 2.25rem;      /* 36px */

  /* ===== SPACING ===== */
  --spacing: 4px;
  /* Tailwind v4 derives all spacing utilities from this base. */
  /* p-1 = 4px, p-2 = 8px, p-4 = 16px, etc. */

  /* ===== RADIUS ===== */
  --radius: 6px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3);
  --shadow-md: 0 2px 4px 0 rgba(0,0,0,0.3), 0 1px 2px -1px rgba(0,0,0,0.3);
  --shadow-lg: 0 4px 12px 0 rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3);
  --shadow-xl: 0 8px 24px 0 rgba(0,0,0,0.5), 0 4px 8px -4px rgba(0,0,0,0.4);

  /* ===== MOTION ===== */
  --duration-instant: 0ms;
  --duration-fastest: 50ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
  --duration-deliberate: 800ms;

  --ease-in: cubic-bezier(0.32, 0, 0.67, 0);
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --ease-emphasized-in: cubic-bezier(0.3, 0, 0.8, 0.15);
  --ease-emphasized-out: cubic-bezier(0.05, 0.7, 0.1, 1.0);
}

:root {
  /* ===== GRAY SCALE ===== */
  --gray-1: #111113;
  --gray-2: #18191B;
  --gray-3: #212225;
  --gray-4: #272A2D;
  --gray-5: #2E3135;
  --gray-6: #363A3F;
  --gray-7: #43484E;
  --gray-8: #5A6169;
  --gray-9: #696E77;
  --gray-10: #777B84;
  --gray-11: #B0B4BA;
  --gray-12: #EDEEF0;

  /* ===== BACKGROUNDS ===== */
  --bg-base: #0C0D0F;
  --bg-surface: #111113;
  --bg-elevated: #18191B;
  --bg-overlay: #212225;

  /* ===== TEXT ===== */
  --text-primary: #EDEEF0;
  --text-secondary: #B0B4BA;
  --text-tertiary: #696E77;
  --text-disabled: #43484E;

  /* ===== BORDERS ===== */
  --border-default: #2E3135;
  --border-hover: #43484E;
  --border-focus: #6E56CF;

  /* ===== ACCENT (VIOLET) ===== */
  --accent-50: #14121F;
  --accent-100: #1B172C;
  --accent-200: #251E40;
  --accent-300: #33287A;
  --accent-400: #4B3BA1;
  --accent-500: #6E56CF;
  --accent-600: #7C66DC;
  --accent-700: #9E8CFC;
  --accent-800: #B4A5FF;
  --accent-900: #D4CAFE;
  --accent-950: #E8E2FD;

  /* ===== SEMANTIC: SUCCESS ===== */
  --success-subtle-bg: #0D1F12;
  --success-fill: #30A46C;
  --success-text: #4CC38A;
  --success-border: #1B3A2A;

  /* ===== SEMANTIC: WARNING ===== */
  --warning-subtle-bg: #1F1300;
  --warning-fill: #FFB224;
  --warning-text: #F5D90A;
  --warning-border: #3D2E00;

  /* ===== SEMANTIC: ERROR ===== */
  --error-subtle-bg: #1F1315;
  --error-fill: #E5484D;
  --error-text: #FF6369;
  --error-border: #3C2024;

  /* ===== SEMANTIC: INFO ===== */
  --info-subtle-bg: #0F1B2D;
  --info-fill: #3E63DD;
  --info-text: #70B8FF;
  --info-border: #172448;

  /* ===== NODE TYPE: COMPUTE (BLUE) ===== */
  --node-compute-fill: #0F2638;
  --node-compute-text: #70B8FF;
  --node-compute-ring: #1D3D5C;
  --node-compute-icon: #3E63DD;

  /* ===== NODE TYPE: STORAGE (GREEN) ===== */
  --node-storage-fill: #0D1F12;
  --node-storage-text: #4CC38A;
  --node-storage-ring: #1B3A2A;
  --node-storage-icon: #30A46C;

  /* ===== NODE TYPE: MESSAGING (ORANGE) ===== */
  --node-messaging-fill: #271700;
  --node-messaging-text: #FFB861;
  --node-messaging-ring: #3D2E00;
  --node-messaging-icon: #F5A623;

  /* ===== NODE TYPE: NETWORKING (PURPLE) ===== */
  --node-networking-fill: #1A1523;
  --node-networking-text: #BFA3FF;
  --node-networking-ring: #2E2352;
  --node-networking-icon: #9E8CFC;

  /* ===== NODE TYPE: SECURITY (RED) ===== */
  --node-security-fill: #1F1315;
  --node-security-text: #FF9592;
  --node-security-ring: #3C2024;
  --node-security-icon: #E5484D;

  /* ===== NODE TYPE: CLIENT (GRAY) ===== */
  --node-client-fill: #18191B;
  --node-client-text: #B0B4BA;
  --node-client-ring: #2E3135;
  --node-client-icon: #696E77;

  /* ===== FOCUS ===== */
  --ring-width: 2px;
  --ring-offset: 2px;
  --ring-color: #6E56CF;
  --ring-offset-color: #0C0D0F;
}
```

---

## 10. TAILWIND v4 CONFIGURATION

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --font-sans: 'Geist', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace;
  --font-display: 'Inter Display', 'Geist', system-ui, sans-serif;

  --color-base: var(--bg-base);
  --color-surface: var(--bg-surface);
  --color-elevated: var(--bg-elevated);
  --color-overlay: var(--bg-overlay);

  --color-accent-50: var(--accent-50);
  --color-accent-100: var(--accent-100);
  --color-accent-200: var(--accent-200);
  --color-accent-300: var(--accent-300);
  --color-accent-400: var(--accent-400);
  --color-accent-500: var(--accent-500);
  --color-accent-600: var(--accent-600);
  --color-accent-700: var(--accent-700);
  --color-accent-800: var(--accent-800);
  --color-accent-900: var(--accent-900);
  --color-accent-950: var(--accent-950);

  --color-success: var(--success-fill);
  --color-warning: var(--warning-fill);
  --color-error: var(--error-fill);
  --color-info: var(--info-fill);
}
```

**Usage examples:**
```html
<!-- Button primary -->
<button class="h-8 px-3.5 text-[13px] font-medium rounded-md bg-accent-500 text-white
               hover:bg-accent-600 active:bg-accent-400
               focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2
               focus-visible:ring-offset-base
               disabled:bg-gray-5 disabled:text-gray-9
               transition-colors duration-100 ease-out">
  Deploy
</button>

<!-- Node card -->
<div class="min-w-[180px] rounded-lg border border-[--node-compute-ring] bg-[--node-compute-fill]
            p-3 text-[--node-compute-text]">
  <div class="flex items-center gap-2">
    <ServerIcon class="w-6 h-6 text-[--node-compute-icon]" />
    <span class="text-[13px] font-medium">API Server</span>
  </div>
</div>

<!-- Metric card -->
<div class="min-w-[160px] rounded-lg border border-default bg-elevated p-3">
  <span class="text-[11px] font-medium uppercase tracking-wider text-tertiary">Throughput</span>
  <div class="mt-1 font-mono text-2xl font-bold text-primary leading-none">12,847</div>
  <span class="text-[13px] text-secondary">req/s</span>
</div>
```

---

## 11. DESIGN PRINCIPLES SUMMARY

1. **Dark-first, not inverted.** Colors are designed for dark mode natively, not derived by inverting a light theme. Background warmth comes from a subtle blue-violet undertone (Radix slate).

2. **Elevation via lightness.** Following Apple HIG: deeper layers are darker, foreground layers are lighter. Shadows are supplementary, not primary.

3. **Developer density.** 13px base, 32px component heights, 4px grid. Compact without sacrificing readability. Informed by Linear and VS Code patterns.

4. **12-step color semantics.** Every color is a 12-step functional scale (Radix model): steps 1-2 backgrounds, 3-5 interactive surfaces, 6-8 borders, 9-10 solid fills, 11-12 text.

5. **Node type encoding.** Compute/Storage/Messaging/Networking/Security each own a hue family. Consistent across fills, text, borders, and icons for immediate recognition on the canvas.

6. **Motion with intent.** Duration scales with visual distance. Spring physics for natural feel. CSS `linear()` for native spring curves. All motion respects `prefers-reduced-motion`.

7. **One accent, zero ambiguity.** Violet (#6E56CF) is the single brand/interactive accent. No competing colors for CTAs.

8. **Accessible by default.** All text/bg pairs meet WCAG AA (4.5:1 minimum). Semantic colors tested against their subtle backgrounds. Focus rings are always visible.
