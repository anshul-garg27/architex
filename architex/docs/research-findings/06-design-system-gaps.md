# Design System Gap Analysis

> Spec: `/research/22-architex-design-system.md`
> Implementation: `/architex/src/app/globals.css`
> Date: 2026-04-11

---

## Summary

The design system spec defines approximately 350+ tokens across typography, colors, spacing, shadows, borders, icons, motion, and 16 component specifications. The `globals.css` implementation covers roughly 40% of the token surface area. Zero shadcn/ui components have been installed. Zero custom design system components have been built as reusable primitives.

| Category | Spec Count | Implemented | Coverage |
|----------|-----------|-------------|----------|
| Color tokens (dark) | ~110 | ~55 | ~50% |
| Color tokens (light) | ~80 | ~45 | ~56% |
| Typography tokens | ~30 | ~6 | ~20% |
| Spacing tokens | ~16 | 0 explicit | 0% (uses Tailwind defaults) |
| Shadow tokens | ~4 | 0 | 0% |
| Border radius tokens | ~6 | 4 | 67% |
| Motion tokens | ~18 | 11 | 61% |
| Icon specifications | 60+ | 0 custom | 0% |
| Component specs | 16 | 0 | 0% |
| shadcn/ui components | ~25 needed | 0 installed | 0% |

---

## 1. Color Tokens

### 1.1 Gray Scale (12-step Radix-style)

**Spec defines:** 12 gray steps (`--gray-1` through `--gray-12`) with hex values from `#111113` to `#EDEEF0`.

**Implementation:** Does NOT use the 12-step gray scale. Instead uses a 4-layer HSL system:
- `--background: hsl(228 15% 7%)`
- `--surface: hsl(228 15% 10%)`
- `--elevated: hsl(228 15% 12%)`
- `--overlay: hsl(228 15% 15%)`

**Gap:** The entire 12-step gray scale is missing. The spec's interactive state system (default/hover/active/focus/disabled/selected) references specific gray steps (gray-3, gray-4, gray-5, etc.) which do not exist. Components cannot implement the spec's hover/active/focus states without these tokens.

**Missing tokens (12):**
`--gray-1` through `--gray-12`

### 1.2 Background Layers

**Spec defines:** 4 named background layers with hex values.
| Token | Spec Hex |
|-------|----------|
| `--bg-base` | `#0C0D0F` |
| `--bg-surface` | `#111113` |
| `--bg-elevated` | `#18191B` |
| `--bg-overlay` | `#212225` |

**Implementation:** Has 4 layers but uses HSL values with different naming:
- `--background` (maps roughly to bg-base)
- `--surface` (maps roughly to bg-surface)
- `--elevated` (maps roughly to bg-elevated)
- `--overlay` (maps roughly to bg-overlay)

**Gap:** Naming mismatch. The implementation uses `--background` while the spec uses `--bg-base`. Not critical but creates confusion when referencing the spec. The hex values are close approximations but not exact matches.

### 1.3 Text Colors

**Spec defines:**
| Token | Hex | WCAG |
|-------|-----|------|
| `--text-primary` | `#EDEEF0` | 15.2:1 |
| `--text-secondary` | `#B0B4BA` | 9.1:1 |
| `--text-tertiary` | `#696E77` | 4.6:1 |
| `--text-disabled` | `#43484E` | 2.5:1 |

**Implementation:** Has 3 foreground tokens:
- `--foreground: hsl(220 14% 90%)` (approximates text-primary)
- `--foreground-muted: hsl(220 10% 50%)` (approximates text-secondary/tertiary)
- `--foreground-subtle: hsl(220 10% 35%)` (approximates text-disabled)

**Gap:** Missing `--text-tertiary` as a distinct token. The spec requires 4 text hierarchy levels; implementation has 3. The Tailwind mappings (`text-primary`, `text-secondary`, `text-tertiary`, `text-disabled`) are not configured.

### 1.4 Border Colors

**Spec defines:**
- `--border-default: #2E3135`
- `--border-hover: #43484E`
- `--border-focus: #6E56CF`

**Implementation:** Has only `--border: hsl(228 15% 16%)` (single border token).

**Gap:** Missing `--border-hover` and `--border-focus`. Interactive elements cannot differentiate border states.

### 1.5 Accent/Brand Color (Violet Scale)

**Spec defines:** 11-step violet scale (`--accent-50` through `--accent-950`) with hex values.

**Implementation:** Has `--primary: hsl(252 87% 67%)` and `--primary-hover: hsl(252 87% 60%)`. Only 2 tokens.

**Gap:** Missing 9 accent scale steps. The spec's interactive states, ghost button hover bg, icon fills, progress bars, selected states, and near-white accent tints all reference specific accent steps (`accent-200`, `accent-400`, `accent-500`, `accent-600`, `accent-700`, `accent-800`) that do not exist.

**Missing tokens (9):** `--accent-50`, `--accent-100`, `--accent-200`, `--accent-300`, `--accent-400`, `--accent-600`, `--accent-700`, `--accent-800`, `--accent-900`, `--accent-950`

### 1.6 Semantic Colors (Success, Warning, Error, Info)

**Spec defines:** 4 variants per semantic color (subtle-bg, fill, text, border) = 16 tokens.

**Implementation:** Has basic semantic tokens:
- `--state-success`, `--state-warning`, `--state-error` (single tokens each)
- `--destructive` (error only)

**Gap:** Missing 12 semantic color variants. The spec requires subtle-bg, fill, text, and border variants for each of success, warning, error, and info. Implementation has only 1 variant per semantic color.

**Missing tokens (12):**
- `--success-subtle-bg`, `--success-fill`, `--success-text`, `--success-border`
- `--warning-subtle-bg`, `--warning-fill`, `--warning-text`, `--warning-border`
- `--error-subtle-bg`, `--error-fill`, `--error-text`, `--error-border`
- `--info-subtle-bg`, `--info-fill`, `--info-text`, `--info-border`

### 1.7 Node Type Colors

**Spec defines:** 6 node types with 4 properties each (fill, text, ring/border, icon) = 24 tokens.

**Implementation:** Has 8 node type tokens (single color each): `--node-compute`, `--node-storage`, `--node-messaging`, `--node-networking`, `--node-security`, `--node-observability`, `--node-client`, `--node-processing`.

**Gap:** Spec defines fill/text/ring/icon variants per node type; implementation has only a single color per type. Missing ~16 node-type sub-tokens. The implementation also has 2 extra node types not in the spec (observability, processing).

### 1.8 Visualization Colors

**Implementation covers this well.** The `--viz-*` tokens are comprehensive (p50/p90/p95/p99, throughput, error, grid, axis, tooltip, anomaly, cache) and exist in both dark and light themes. This is one of the most complete areas.

### 1.9 Light Theme

**Spec defines:** Full light theme counterparts for all tokens.

**Implementation:** Has a light theme block under `html.light` covering background layers, foreground, primary, secondary, muted, accent, destructive, border, states, sidebar, canvas, statusbar, and visualization tokens.

**Gap:** The light theme mirrors the implementation's token set (not the full spec). All gaps in dark theme tokens also exist in light theme.

---

## 2. Typography Tokens

### 2.1 Font Families

**Spec defines:** 3 font families: `--font-sans`, `--font-mono`, `--font-display`.

**Implementation:** Has 2: `--font-sans` (Geist Sans), `--font-mono` (Geist Mono). Uses CSS variables `var(--font-geist-sans)` and `var(--font-geist-mono)`.

**Gap:** Missing `--font-display` (`'Inter Display', 'Geist', system-ui, sans-serif`). Used for headings h1-h3 and hero text.

### 2.2 Size Scale

**Spec defines:** 9 size tokens (`--text-xs` through `--text-4xl`) with specific px values, line heights, and letter spacing.

**Implementation:** Zero explicit typography size tokens in globals.css. Relies entirely on Tailwind defaults.

**Gap:** Tailwind's default text sizes do NOT match the spec. The spec uses a density-optimized scale starting at 11px (xs) with a 13px base -- this is a deliberate choice inspired by Linear/VS Code. Tailwind's defaults start at 12px with a 16px base.

**Missing tokens (9):** `--text-xs` (11px), `--text-sm` (12px), `--text-base` (13px), `--text-md` (14px), `--text-lg` (16px), `--text-xl` (18px), `--text-2xl` (24px), `--text-3xl` (30px), `--text-4xl` (36px)

### 2.3 Weight and Line Height

**Spec defines:** 5 weight tokens, 5 line-height tokens.

**Implementation:** Zero explicit weight or line-height tokens.

**Gap:** All 10 tokens missing. Uses Tailwind defaults which approximately match but are not precisely calibrated.

---

## 3. Spacing Tokens

**Spec defines:** 16 spacing tokens (`--space-0` through `--space-24`) based on a 4px base grid.

**Implementation:** Zero explicit spacing tokens. Relies on Tailwind defaults.

**Gap:** Tailwind's default spacing scale is based on a 4px grid (same as spec), so the values mostly overlap. However, the spec defines explicit semantic token names and specific usage guidelines that are not captured. Not a critical gap since Tailwind classes map correctly, but custom components referencing CSS variables for spacing will have no tokens.

---

## 4. Border Radius Tokens

**Spec defines:** 6 radius tokens derived from a base `--radius: 6px`.

**Implementation:** Has 4 radius tokens derived from `--radius: 0.5rem` (8px):
- `--radius-sm: calc(var(--radius) - 4px)` = 4px
- `--radius-md: calc(var(--radius) - 2px)` = 6px
- `--radius-lg: var(--radius)` = 8px
- `--radius-xl: calc(var(--radius) + 4px)` = 12px

**Gap:** Base radius mismatch. Spec uses 6px base; implementation uses 8px (0.5rem). This means `--radius-lg` in implementation (8px) maps to the spec's `--radius-lg` (8px) but `--radius-md` in implementation (6px) maps to the spec's `--radius-md` (6px). The mapping works out but the derivation is different. Missing `--radius-none` (0px) and `--radius-full` (9999px) tokens.

---

## 5. Shadow Tokens

**Spec defines:** 4 shadow tokens (`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`) with specific dark-mode-appropriate rgba values, plus focus ring specification.

**Implementation:** Zero shadow tokens in globals.css. Relies on Tailwind defaults.

**Gap:** All 4 shadow tokens missing. The spec's shadows use `rgba(0,0,0,0.3-0.5)` which is much more aggressive than typical light-mode Tailwind shadows, specifically designed for dark mode visibility. The focus ring spec (`--ring-width: 2px`, `--ring-offset: 2px`, `--ring-color: accent-500`) is partially covered by the `:focus-visible` rule in globals.css but the specific offset and color variables are missing.

**Missing tokens (4):** `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`

---

## 6. Motion/Animation Tokens

**Spec defines:** 7 duration tokens, 7 easing tokens, 5 spring configurations, 12 component animation specs.

**Implementation:** Has 7 duration tokens and 4 easing tokens in globals.css:
- Duration: `--motion-duration-instant` through `--motion-duration-deliberate` (7 tokens)
- Easing: `--motion-ease-out`, `--motion-ease-in`, `--motion-ease-in-out`, `--motion-ease-emphasized` (4 tokens)
- Spring configs as comments: snappy, smooth, bouncy, stiff, gentle (5 reference values)
- Reduced motion media query implemented

**Gap:**
- Missing 3 easing tokens: `--ease-emphasized-in`, `--ease-emphasized-out`, `--ease-spring` (CSS `linear()` spring function)
- Spec duration tokens have different names: `--duration-instant/fastest/fast/normal/slow/slower/deliberate` vs implementation's `--motion-duration-instant/quick/fast/normal/moderate/slow/deliberate`. The "fastest" (50ms) token is missing; "quick" (100ms) maps to spec's "fast" (100ms).
- Spring configs exist as CSS comments only (documented for JS, not usable in CSS). The spec references `motion` library configs that need to be in a TypeScript constants file.
- All 12 component animation specs (Tooltip, Dropdown, Modal, Toast, Sidebar, Tab content, Node add, Edge draw, Particle flow, Metric update, Sparkline) are unimplemented -- no Framer Motion or motion-react animations exist.

---

## 7. Icon System

**Spec defines:** 60+ custom system design component icons across 7 categories (Compute: 12, Storage: 13, Messaging: 10, Networking: 12, Security: 10, Clients: 7, Observability: 6), following a 24x24 grid, round stroke cap/join, using Lucide React as the base library.

**Implementation:** Zero custom icons. The node components use basic Lucide React icons directly.

**Gap:** All 60+ custom icon specifications are unimplemented. The spec calls for consistent visual weight, specific descriptions (e.g., "Triangle distributing to three lines" for load-balancer), and a formal 24x24 grid with 20x20 content area. Current implementation likely uses generic Lucide icons which do not match the specific icon designs described.

---

## 8. shadcn/ui Components

**Spec references and the wireframes require the following shadcn/ui components.**

**No `components/ui/` directory exists.** Zero shadcn/ui components have been installed.

### Components Needed vs Created

| Component | Needed | Created | Notes |
|-----------|--------|---------|-------|
| Button | Yes | No | 4 variants (Primary, Secondary, Ghost, Destructive), 3 sizes (sm/md/lg) |
| Input | Yes | No | 3 sizes, 5 states, icon/addon support |
| Select/Dropdown | Yes | No | Category dropdowns, filter selects |
| Tooltip | Yes | No | 500ms delay, arrow, shortcut text support |
| Badge | Yes | No | 6 semantic variants, 2 sizes |
| Card | Yes | No | Hover border change, header/footer variants |
| Dialog/Modal | Yes | No | 3 sizes (400/520/680px), overlay blur, enter/exit animation |
| Tabs | Yes | No | Bottom border accent indicator, hover bg |
| Accordion | Yes | No | Pattern library, settings sections |
| Command | Yes | No | Command palette (cmdk-based) |
| Popover | Yes | No | Input configs, filter popovers |
| Dropdown Menu | Yes | No | Context menus, 3-dot menus |
| Toggle | Yes | No | Settings toggles, simulation toggles |
| Switch | Yes | No | Boolean settings |
| Slider | Yes | No | Speed control, zoom, font size |
| Progress | Yes | No | XP bars, module progress, challenge progress |
| Avatar | Yes | No | User profiles, collaborator lists |
| Separator | Yes | No | Sidebar dividers, panel dividers |
| Scroll Area | Yes | No | Panel scrolling, palette scrolling |
| Skeleton | Yes | No | All loading states |
| Toast | Yes | No | Simulation events, save confirmations |
| Sheet | Yes | No | AI drawer, mobile panels |
| Breadcrumb | Yes | No | Top bar navigation |
| Segmented Control | Yes | No | Difficulty/status filters, speed control |
| Stepper | Yes | No | Number inputs (replicas, node count) |

**Total needed: ~25 shadcn/ui components. Total installed: 0.**

---

## 9. Custom Components Specified But Not Built

Beyond shadcn/ui primitives, the design system spec defines custom component specifications that need to be built as reusable design system components:

| Component | Spec Section | Status |
|-----------|-------------|--------|
| System Design Node | 6.9 | BaseNode.tsx exists but does not match all spec properties (min/max width, sublabel, metric slot, handle specs) |
| Edge (Connection Line) | 6.10 | DataFlowEdge.tsx exists but incomplete (missing dashed async style, label specs, animated particles per spec) |
| Toolbar Button | 6.11 | Not built as reusable component |
| Sidebar Item | 6.12 | Not built as reusable component |
| Panel Header | 6.13 | Not built as reusable component |
| Timeline Scrubber | 6.14 | Not built |
| Speed Control | 6.15 | Not built as spec (container with option buttons) |
| Metric Card | 6.16 | MetricsDashboard.tsx exists but individual MetricCard not built to spec (label uppercase, mono value, sparkline, trend indicator) |

---

## 10. Tailwind v4 Theme Integration

The `@theme inline` block in globals.css correctly maps CSS custom properties to Tailwind utility classes for the tokens that DO exist. This is well-structured. The gap is that only implemented tokens are mapped -- all missing tokens noted above would need corresponding `@theme` entries once added.

---

## Action Items (Priority Order)

### P0 -- Install shadcn/ui Components
Run `npx shadcn@latest init` and install all 25 listed components. This unblocks all screen development.

### P0 -- Add Missing Color Tokens
Add the 12-step gray scale, 11-step accent scale, and 4-variant semantic colors. This unblocks interactive state styling for every component.

### P1 -- Add Typography Scale
Override Tailwind's text scale with the spec's 13px-base density-optimized scale. Add `--font-display`.

### P1 -- Add Shadow Tokens
Define the 4 dark-mode-specific shadow tokens.

### P1 -- Build Custom Component Library
Build reusable Toolbar Button, Sidebar Item, Panel Header, Timeline Scrubber, Speed Control, and Metric Card components matching their specs.

### P2 -- Add Missing Motion Tokens
Add the 3 missing easing tokens. Create a TypeScript motion constants file with spring configs for motion-react.

### P2 -- Icon System
Create or source 60+ system design icons matching the 24x24 grid specification. Consider creating an SVG sprite sheet or individual React components.

### P2 -- Add Missing Spacing/Radius Tokens
Add explicit spacing tokens (even though Tailwind defaults align). Add `--radius-none` and `--radius-full`.
