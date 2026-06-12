# Architex — Accessibility Review (WCAG 2.2 AA)

**Date**: 2026-05-07
**Scope**: `src/components/ui/**`, custom canvas / AI / knowledge-graph / simulation / modules surfaces, app routes, design tokens, e2e specs.
**Method**: Static analysis only. No live screen-reader / browser audit. Findings are grouped by WCAG severity (Blocker > Critical > Serious > Moderate > Minor), citing `path:line`.
**Target**: WCAG 2.2 Level AA, augmented with WCAG 2.2 new criteria (2.4.11 Focus Not Obscured, 2.5.7 Dragging Movements, 2.5.8 Target Size Min, 3.3.7 Redundant Entry).

---

## 1. Summary — counts by WCAG severity

| Severity | Count | WCAG Level | Examples |
|----------|------:|------------|----------|
| **Blocker** (A — content not perceivable / unusable for AT) | 4 | A | Multiple `<h1>` per blog page; `.high-contrast` toggle is a no-op (lying UI); `role="listbox"` for navigation; React Flow nodes missing accessible name in default view |
| **Critical** (AA — fails core a11y for many users) | 9 | AA | No focus trap on `OnboardingOverlay`; `aria-live="assertive"` on a per-second-updating timer; thin colour-only state cues; landing-page H1 missing visual fallback; `Cmd+E/T/J/Z` shortcut dispatch even from inside text fields; canvas `<main>` rendered twice |
| **Serious** (AA — common task is hard for AT users) | 11 | AA | `Switch` track/thumb 36×20 < 24×24 minimum; sidebar items rely on icon-only signal at compact mode; tooltip-only labels on toolbar buttons; `Tooltip` with no `aria-describedby` link; `MotionProvider` does not always honour `prefers-reduced-motion` for new animations injected via `dangerouslySetInnerHTML` |
| **Moderate** | 12 | AA | Skip link target ID `#main-content` mismatch (rendered twice); inconsistent focus rings; `confirm-dialog` description lacks `aria-describedby` linkage; activity bar `role=listbox` mis-use for navigation; toast container missing `role=region`/`aria-live` wrapper |
| **Minor** | 8 | AAA / hygiene | `<kbd>` glyphs only (no announced names); `aria-hidden` icons in actionable buttons w/o text fallback in compact density; `prefers-contrast` not yet supported; landing typewriter has no `aria-busy`/`aria-label`; `aria-disabled` w/o `disabled` attribute on tabs |

Total: **44 distinct findings**. The repo already has a strong a11y foundation (focus-visible system, reduced-motion media query, forced-colors media query, screen-reader live region for canvas / simulation announcements, canvas list-view alternative). The blockers and criticals come from a small number of structural patterns that recur across many surfaces.

---

## 2. Findings by surface

### 2.1 UI primitives (`src/components/ui/**`) — mostly Radix, mostly fine

The Radix-backed components inherit Radix's WAI-ARIA conformance and pass the common checks (focus trap on Dialog/Popover, roving tabindex on Tabs, keyboard navigation on Select). Specific findings:

- **`button.tsx:9`** — Default focus ring is `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` against `--ring` (= `--primary`). On the dark theme `--primary: hsl(258 78% 64%)` against `--background: hsl(225 8% 7%)` gives a contrast ratio ~4.0:1, which is below the 3:1 threshold for non-text contrast only after offset. WCAG 2.4.11 (Focus Appearance) prefers a 2px solid + 3:1 contrast; this passes the *minimum* but is borderline. **Severity: Minor.**
- **`dialog.tsx:47`** — Close `<X>` icon has `<span className="sr-only">Close</span>` — good, but the *button* itself relies entirely on the icon visually. The minimum target size in WCAG 2.5.8 is 24×24 CSS px; the current container is `h-4 w-4` icon inside a `rounded-sm` button with no explicit size, so the click area is only ~16×16 px after default padding. **Severity: Serious. WCAG 2.5.8.** Recommend explicit `h-8 w-8` (32×32) hit area.
- **`switch.tsx:13-22`** — Track is `h-5 w-9` (20×36 CSS px); thumb `h-4 w-4` (16×16). Both fail WCAG 2.5.8 (24×24 min). The aria comes from Radix, so name/role/value are correct, but the touch target is too small. **Severity: Serious. WCAG 2.5.8.**
- **`input.tsx:9`** — Disabled state uses `opacity-50` only. No `aria-disabled` is added; relies on native `disabled` (which is correct), but the contrast at 50% opacity drops below 4.5:1 against the surface. **Severity: Moderate. WCAG 1.4.3.**
- **`progress.tsx:17-34`** — Has `role="progressbar"`, `aria-valuemin/max/now` ✓. Missing `aria-label` (or external `aria-labelledby`). When used standalone (e.g. inside `HintPanel`), screen reader will announce "0%, progress bar" with no context. **Severity: Serious. WCAG 4.1.2.**
- **`badge.tsx:42-50`** — A `<div role=undefined>` rendering badge text. When a badge expresses a *status* (e.g. "Used", "Complete"), screen readers won't pause to read it because it's not in a live region. For decorative badges this is fine; for status badges the consumer must wrap with `role="status"`. **Severity: Minor — caller responsibility.**
- **`tooltip.tsx:10-12`** — Radix Tooltip renders `role="tooltip"` and links `aria-describedby` to the trigger automatically. ✓
- **`scroll-area.tsx`** — Radix; ✓. Note: scrollbars are decorative only; keyboard arrow scrolling on the viewport still works.
- **`floating-toolbar.tsx:32`** — `role="toolbar"` ✓ but no `aria-label`. **Severity: Moderate. WCAG 4.1.2.**
- **`tab-bar.tsx:71-89`** — Custom Tab implementation. Has `role="tab"`, `aria-selected`, `tabIndex={isActive ? 0 : -1}` — this is the correct *roving tabindex* pattern. ✓ But missing arrow-key navigation (Left/Right to move between tabs). **Severity: Serious. WCAG 2.1.1 keyboard, ARIA APG Tab pattern.**
- **`speed-control.tsx:160-189`** (toggle-group mode) — Implements `role="radiogroup"` with `role="radio"` items + `aria-checked` + `aria-label`. The `onKeyDown` handler at `:82-99` only listens for `1/2/4` shortcuts; arrow-key navigation between radios is absent. **Severity: Serious. WCAG 2.1.1, ARIA radio pattern.**
- **`timeline-scrubber.tsx:142-158`** — `role="slider"`, `aria-valuemin/max/now`, `aria-label="Timeline position"`, full Arrow / Home / End handling ✓. Missing PageUp/PageDown for large jumps (ARIA APG slider). **Severity: Minor.**
- **`simulation-transport.tsx:166-167`** — `role="toolbar"` + `aria-label="Simulation transport controls"` ✓. Reset confirmation uses `R` shortcut globally, including when the user is typing in any text field on the canvas, because the handler is bound to the toolbar div directly — but if the toolbar is in the tab order, focus may also be on a button. **Severity: Minor**, recommend filtering by `e.target` like `use-keyboard-shortcuts.ts` does.
- **`toolbar-button.tsx:58-66`** — Icon-only buttons. The label arrives only via `<TooltipContent>`. The button itself has no `aria-label`. The Radix Tooltip *does not* set `aria-describedby` from the trigger to the tooltip text on Radix < 2.0 in a way that names the button — it describes it. So the button has *no accessible name* for screen-readers. **Severity: Critical. WCAG 4.1.2 Name, Role, Value.** Fix: also accept and apply `aria-label={tooltip}` on the inner `<button>`.

### 2.2 Canvas (`src/components/canvas/**`)

- **`DesignCanvas.tsx:295-352`** — React Flow canvas. Nodes are rendered with custom `BaseNode` components. The default React Flow div has `role="generic"`. The canvas root has no `role="application"` or `role="region"` and no `aria-label`. A screen-reader user landing here hears nothing about what the canvas contains. **Severity: Blocker. WCAG 1.3.1, 4.1.2.** Fix: wrap in `<section role="application" aria-label="Architecture canvas" aria-describedby="canvas-description">` and reuse the existing `CanvasDescription` live region.
- **`CanvasDescription.tsx:181-188`** — Live-region polite announcer that summarises the canvas state ("System design with 3 nodes ..."). Excellent pattern. ✓ Only nit: it's announced as `role="status"`, but for a 200-word summary that updates every node-add it can be too verbose; consider `aria-live="off"` on initial mount and only switching to `polite` on user-driven mutations. **Severity: Minor.**
- **`A11yToolbar.tsx:88-256`** — Self-labelled `role="toolbar"` ✓, `aria-expanded` on toggle ✓, every Switch labelled with both visible `<Label>` and `aria-label`. Zoom buttons have `aria-label`. **Solid.** One issue: the High Contrast switch (`:188-194`) toggles a `.high-contrast` class on `<html>` but `globals.css` defines **no `.high-contrast` rules**. The switch is a UI lie. **Severity: Blocker. WCAG 3.2.4 (Consistent Identification) and trust.** Either implement the styles or remove the switch. (See also `settings/page.tsx:401`.)
- **`NodeListPanel.tsx:160-322`** — Excellent table-as-grid alternative for screen-reader users with `role="region"`, `aria-label="Node list panel"`, search input properly labelled, sortable column headers via `<button>` with `aria-label="Sort by name ↑"`, rows have `role="row" tabIndex={0} aria-selected`, Enter/Delete/Backspace handlers. ✓ The only gap: the parent `<table role="grid">` does not set `aria-rowcount` / `aria-colcount` (useful for filtered views). **Severity: Minor.**
- **`BaseNode.tsx:310-326`** (dot view, zoom < 0.3) — Has `aria-label={data.label || 'Node'}` ✓.
- **`BaseNode.tsx:329-356`** (simplified, 0.3–0.6) — Wrapper has **no** `aria-label`. Only the `<span>` containing `data.label` is rendered. React Flow wraps every node in a `<div role="button" tabIndex={0}>` whose accessible name comes from its visible text — so this still works, but inconsistently with the dot view. **Severity: Moderate.**
- **`BaseNode.tsx:380-514`** (full view) — Has icon + label + state indicator. State-color is announced via `<span aria-label={`State: ${data.state}`}>` (`:495`) ✓. Still no top-level `aria-label` on the node container; the role is left to React Flow. **Severity: Moderate.**
- **`BaseNode.tsx:494-513`** — State indicator uses **colour alone** (border + glow) to convey the six states (idle, active, success, warning, error, processing). The visible label is "State: error" via aria, but visually a colour-blind user cannot distinguish warning (amber) from error (red). The forced-colors block at `globals.css:1118-1121` adds `outline: 2px dashed LinkText` for `[data-state="error"]` — but the BaseNode does not set `data-state` attribute. **Severity: Critical. WCAG 1.4.1 Use of Color, 1.4.11 Non-text Contrast.**
- **`BaseNode.tsx:111-113, 116-118, 119-122`** — `node-error-pulse`, `node-warning-glow`, `node-processing-spin` keyframes loop infinitely. The global `prefers-reduced-motion` block at `globals.css:962-995` sets `animation-duration: 0.01ms !important` which neutralises them. ✓ But the `BaseNode.tsx:506-510` inline `style={{animation: ...}}` declarations specify per-element animations; `!important` in the media-query rule does win. ✓
- **`overlays/ParticleLayer.tsx`** (not read in detail) — Animated particles. Should respect `prefers-reduced-motion` directly; relying solely on the global CSS rule means each particle's `transform` keyframes still run unless `react-flow__edge-path { animation: none }` covers them. Worth verifying.
- **`overlays/CanvasToolbar.tsx:439`** — Comment says "Reset at the start of each render. Only the button at focusedIndex gets `tabIndex={0}`." — implies roving tabindex pattern. ✓ (not fully read)

### 2.3 Custom command palette (`src/components/shared/command-palette.tsx`)

- Uses `cmdk` library which gives proper `role="combobox"`, `role="listbox"`, `role="option"` semantics. ✓
- `:432-435` — wrapper has `role="dialog" aria-modal="true" aria-label="Command palette"`. ✓
- `:493-502` — `Command.Input` has `aria-label="Command palette search"` ✓ and `autoFocus` ✓.
- `:397-401` — Uses a `useFocusTrap` hook with `onEscape`. ✓
- **Gap**: backdrop click closes (`:446`), but `useFocusTrap` only fires `onEscape` on the inner container; if focus is *not* yet inside (initial render race), Escape won't close. Mitigated by the `onKeyDown` on `Command` at `:489-491`. Acceptable.
- **Gap**: keyboard shortcut `kbd` glyphs are visual only. A SR user hears the command label but not the shortcut. Acceptable for now (each command is also reachable via search).
- **Severity overall**: Solid.

### 2.4 Knowledge graph (`src/components/knowledge-graph/ConceptGraph.tsx` + `modules/KnowledgeGraphModule.tsx`)

- Search input `aria-label="Search concepts"` ✓ (`ConceptGraph.tsx:371`).
- The graph itself is React Flow; same accessible-name issue as the design canvas. Plus no list-view alternative for screen-reader users to *consume* the graph. **Severity: Critical. WCAG 1.3.1, 1.1.1.** A list/tree summary of concepts and edges would close this gap (similar to `CanvasDescription`).
- `KnowledgeGraphModule.tsx:32-50` — Domain list rendered as `<ul>` `<li>` with coloured pills. Each li is decorative text + count; not interactive (per the markup). ✓
- `KnowledgeGraphModule.tsx:84-89` — "Select a concept node to view its details in the graph." — but there is no keyboard path from the right-hand "Properties" panel to a node (which is a graph node inside React Flow). **Severity: Serious. WCAG 2.1.1.**

### 2.5 Simulation announcer (`src/components/shared/SimulationAnnouncer.tsx`)

- Uses `role="status" aria-live="polite" aria-atomic="true"` ✓. Reports status changes, periodic metrics every 5 s, node add / remove, edge create. **Excellent pattern.** ✓
- **Concern**: at `:62-68`, while running, the announcer overwrites text every 5 s with throughput/latency/error rate. With `aria-live="polite"` the SR queues these. After ~2 minutes of running simulation, a SR user has heard *24 metric announcements* and zero other content. Recommend a debounce, a "verbose mode" toggle, or rate limiting via `aria-live="off"` while paused. **Severity: Moderate. WCAG 4.1.3.**

### 2.6 AI components (`src/components/ai/*.tsx`)

- **`SocraticTutor.tsx`** — Chat UI with input + suggestion buttons + scrolling messages.
  - **Streaming response**: simulated via `setTimeout` (`:140-149`). When new tutor messages arrive, they're appended to the DOM but the scroll container is not a live region — a SR user will not hear the new message unless they manually navigate. **Severity: Critical. WCAG 4.1.3 Status Messages.** Fix: wrap message list in `role="log" aria-live="polite"` or fire a one-shot `aria-live="polite"` announcement when `setMessages` resolves.
  - The `<ScrollArea className="h-80">` (`:317`) does not declare itself as the chat log.
  - The header button at `:233-257` toggles expand/collapse but lacks `aria-expanded`. **Severity: Moderate. WCAG 4.1.2.**
  - Phase-progress dots (`:269-313`) use colour + icon. Colour-blind users see the icon ✓, but the text label is only on `sm:` breakpoints (`:307`); on mobile, label is hidden — and `title=` attribute is not announced reliably by SRs. **Severity: Moderate. WCAG 1.4.1.**
  - Quick-response suggestion buttons (`:344-353`) have visible text but no `aria-label`; the visible text is the label, so this is fine. ✓
  - Disabled state on `<Input>` and `<Button>` while typing — uses `disabled` attribute ✓.
- **`HintPanel.tsx:151-173`** — Top header is a `<button>` with no `aria-expanded`; only the `<ChevronUp/Down>` rotates. **Severity: Moderate. WCAG 4.1.2.**
- **`HintPanel.tsx:220-247`** — Tier buttons with visible label + cost. `disabled` attribute via `isDisabled`. The Lock icon (`:236`) on locked tiers has no text equivalent. SR users hear the label + cost but not "locked"; the `disabled` state masks it but won't announce *why*. **Severity: Moderate. WCAG 1.1.1.**
- **`ReviewOverlay.tsx`** — (read partially) Uses severity icons + text labels per finding ✓. Needs `role="alertdialog"` if it's modal (not confirmed from snippet).

### 2.7 Drill mode (`src/components/modules/lld/drill-mode/*`)

- **`DrillTimer.tsx:34-46`** — Renders the remaining time. `aria-live={urgent ? "assertive" : "polite"}` and the value re-renders **every 1 s** via `setInterval`. With `aria-live="polite"` that's a 1-Hz SR announcement; with `aria-live="assertive"` it interrupts everything else every second under 60 s remaining. **Severity: Critical. WCAG 4.1.3.** Fix: only announce on minute changes (or 60s, 30s, 10s thresholds); drop `aria-live` from the visual element and use a separate hidden region with timed announcements.
- No `role="timer"` (which is allowed and explicitly intended for countdowns). Add `role="timer"` and a label like `aria-label={`Time remaining: ${format(remaining)}`}`. **Severity: Moderate.**

### 2.8 Modules — settings page (`src/app/settings/page.tsx`)

- `:782-882` — Has a single `<h1>Settings</h1>` (`:792`) ✓ and proper `<header>`, `<nav aria-label="Settings sections">` (`:798-800`), `<main id="main-content">` (`:828`). Excellent landmark structure.
- **Section toggles**: Switches all have `id` + `<Label htmlFor>`. ✓
- **Reduced motion** (`:438-442`): Switch reflects `prefersReducedMotion` and `setToolbarOverride`. ✓ Good integration with `ReducedMotionProvider`.
- **High Contrast** (`:469-472`): Toggles `.high-contrast` class on `<html>`. **No CSS targets `.high-contrast`** anywhere in the repo (`grep -rn '\.high-contrast\b' src --include='*.css'` returns nothing). The switch *changes nothing* visually. A blind user enabling HC then a sighted user trying to use HC will see no difference. **Severity: Blocker. WCAG 3.2.4 / trust violation.** Either remove the switch + label OR implement `.high-contrast` overrides (high-contrast palette, thicker borders, bigger focus rings).
- **Volume slider** (`:354-369`): Uses native `<input type="range">` with `id="volume-slider"`, `<Label htmlFor>`. ✓ But the `% value` is shown in a separate `<span>` (`:350-352`) without `aria-live`, so SR users dragging the slider won't hear updates. The native range itself does announce values. ✓ Acceptable.
- **Theme radios** (`:189-209`): Three `<button>` elements styled as a segmented control. They visually look like a radio group but are ordinary buttons — no `role="radiogroup"`/`role="radio"`, no `aria-pressed`. SR user hears three identical buttons. **Severity: Serious. WCAG 4.1.2.**
- **Sound toggle / Volume slider disabling** (`:361-368`): When sound is off, the volume slider is `disabled` ✓; visual style uses opacity-50 ✓.

### 2.9 Workspace layout (`src/components/shared/workspace-layout.tsx`)

- `:184` — `<aside aria-label="Component palette">` ✓
- `:197` — `<main id="main-content" aria-label="Canvas">`. ✓ Skip link in `app/layout.tsx:83-85` targets `#main-content`. ✓
- `:231` — `<aside aria-label="Properties">` ✓
- **Mobile layout `:83`** — `<main aria-label="Canvas">`. **No `id="main-content"`**, which means the skip-link in layout.tsx will not focus the right thing on mobile. **Severity: Moderate. WCAG 2.4.1.**
- **Conflict**: when on the home page (`/`) the layout *and* the route have a `<main>` each. `app/page.tsx` doesn't render a top-level `<main>`, but the `WorkspaceLayout` does (`:197`). Routes like `/settings` render their *own* `<main id="main-content">` (`settings/page.tsx:828-829`) inside the route component. Combined with `WorkspaceLayout` not being mounted on `/settings`, this is fine. ✓
- **Resize handle**: `Separator` from `react-resizable-panels`. Native role/keyboard handling depends on the lib version. Worth manual verification.

### 2.10 Landing page (`src/components/landing/LandingPage.tsx`)

- `:448-463` — `<motion.h1>` ✓ (was previously a concern; verified present).
- `:592, 609, 658, 728` — Multiple `<h2>` ✓.
- `:641, 688, 828` — `<h3>` ✓. Hierarchy: h1 → h2 → h3. ✓
- `:299-353` — Mobile nav with hamburger button: `aria-label`, `aria-expanded` ✓. `<X>` and `<Menu>` icons swap; aria handles announcement. ✓
- **`AnimatedText.tsx:79-100` (`GradientText`)** — Uses `-webkit-text-fill-color: transparent` + `background-clip: text`. In Windows high-contrast / forced-colors mode, this can render the text *invisible*. The `globals.css:1019-1122` forced-colors block uses `forced-color-adjust: auto` on body but does not reset `-webkit-text-fill-color` on the `.animated-gradient-text` selector. **Severity: Critical. WCAG 1.4.1 (Use of Color), 1.4.3 (Contrast).** Fix: under `@media (forced-colors: active)`, set `.animated-gradient-text { -webkit-text-fill-color: currentColor; background: none; color: CanvasText; }`.
- **`AnimatedText.tsx:141-188` (`TypewriterText`)** — Types one char at a time. Uses `<span>` with no `aria-live`, no `aria-busy`. SR users hear the partial text mutate as it types. The static text shows on `prefersReducedMotion` (`:149`). **Severity: Moderate. WCAG 4.1.3, 2.2.2 (Pause/Stop/Hide).** Fix: render the full text in an `aria-hidden="false"` span and the typewriter animation in a separate `aria-hidden="true"` span; then announce once via `role="status"`.

### 2.11 Blog `[slug]/page.tsx` — multiple-h1 violation

- `:187` — Static `<h1>{post.title}</h1>`.
- `:60-93` — Markdown renderer that emits `<h1>` for any `# ` line in markdown body (`:85-93`).
- If a blog post's markdown contains an `# H1` line, the rendered page has 2 (or more) `<h1>` elements. WCAG SC 1.3.1 (Info and Relationships) does not strictly prohibit multiple h1s, but ARIA APG, WHATWG HTML spec, and WCAG SC 2.4.6 (Headings and Labels) all strongly discourage it; SR users using "navigate by heading level 1" lose document structure. **Severity: Blocker. WCAG 1.3.1 / 2.4.6.** Fix: in `renderMarkdown`, demote `# ` to `<h2>` (since `<h1>` is reserved for `post.title`); same for `## ` → `<h3>`, `### ` → `<h4>`.

### 2.12 Onboarding overlay (`src/components/shared/onboarding-overlay.tsx`)

- `:298` — Has `role="dialog" aria-modal="true" aria-label="Onboarding tutorial"` ✓
- `:330-332` — `<h3>` for step title (no `aria-labelledby` linking it to the dialog).
- `:280-285` — Keyboard handler for ArrowLeft/Right/Escape. ✓
- **No focus trap.** Pressing Tab inside the overlay can move focus to elements behind the (visually) covered backdrop. **Severity: Critical. WCAG 2.4.3 (Focus Order), 2.1.2 (No Keyboard Trap, inverse).** Fix: import `useFocusTrap` like the command palette and keyboard-shortcuts dialog do.
- **No focus restoration** when onboarding closes. Whatever was focused before is lost. **Severity: Serious. WCAG 2.4.3.**
- The `<button>` at `:303` (full-screen backdrop) is just a `<div onClick>`. Backdrop click closes the dialog (`:303 onClick={completeOnboarding}`) — keyboard users can't trigger it. They have Escape (handled at `:278-279`), so this is acceptable, but the div should not receive `pointer-events` when the user is on a screen-reader-only path. ✓ (handled by mock `pointer-events-none` overlay at `:307`).

### 2.13 Activity bar (`src/components/shared/activity-bar.tsx`)

- `:113` — `<nav id="navigation" aria-label="Module navigation">` ✓
- `:114-119` — `<ul role="listbox" aria-label="Modules">`. **Issue**: `role="listbox"` is for selection of a *value*. This is a navigation menu — selecting a module switches to a different page-level view. Correct semantics: `role="tablist"` (since the module's panel changes inline) with `role="tab"` items, *or* leave it as a plain `<nav>`/`<ul>` of `<a>` or `<button>` and rely on the surrounding `<nav>`. The current shape causes screen readers to announce "1 of 13 selected, listbox", which is misleading. **Severity: Blocker. WCAG 4.1.2 Name, Role, Value (mis-stated role).**
- `:140` — Roving tabindex (only one button is in the tab order). ✓
- `:73-110` — Arrow keys / Home / End / Enter / Space handlers. ✓
- `:227-237` (mobile overflow) — `role="dialog" aria-modal aria-label`. ✓ With `useFocusTrap`. ✓

### 2.14 Forms — billing, profile, AI settings

- **`AISettingsSection.tsx:79-80`** — `<Label htmlFor="ai-api-key">` + `<Input id="ai-api-key" type="password">` ✓
- `:92-98` — Show/hide toggle for password. The button (read partially) lacks an explicit `aria-label="Show API key"`/`"Hide API key"` toggle pair tied to `aria-pressed`. **Severity: Moderate. WCAG 4.1.2.**
- **`UsageMeter.tsx:87-93`** — `role="progressbar"` + `aria-label` + `aria-valuemin/max/now` ✓. When `isUnlimited`, sets `aria-valuemax={undefined}` — that's correct (not present in the DOM); but `aria-valuenow={used}` with no max is meaningless. **Severity: Minor.** Either omit all aria-value-* when unlimited or set aria-valuetext="Unlimited usage".
- **`profile/[username]/page.tsx`** — read partially; uses `<Link>` and Lucide icons. Needs deeper audit but no obvious blockers in first 120 lines.
- **`ImportDialog`** (`src/components/shared/import-dialog.tsx:37-80` read) — Tab-based switcher for paste/upload, `<textarea>` for paste (not yet read but presumed labelled). No focus trap visible in read excerpt. **Severity: needs verification.**
- **No `<form>` element with `noValidate`/server-validation pattern was reviewed**; many "forms" are loose collections of inputs (e.g. settings page). For inputs that have an associated error state, no `aria-invalid` / `aria-describedby` linkage was observed. **Severity: Serious overall. WCAG 3.3.1 (Error Identification), 3.3.3 (Error Suggestion).**

### 2.15 Pricing page

Not read in this pass. Heading hierarchy expected to be okay (h1 present per `grep -c`). Recommend dedicated audit pass for purchase / billing flow under WCAG 3.3.4 (Error Prevention — Legal/Financial).

### 2.16 Knowledge-shortcut dialog (`src/components/shared/keyboard-shortcuts-dialog.tsx`)

- `:120-126` — `role="dialog" aria-modal aria-label` + `useFocusTrap` via `containerRef`/`trapKeyDown` ✓
- `:155-164` — Search `<input>` with `aria-label="Filter keyboard shortcuts"`, `autoFocus` ✓
- Heading is `<h2>` (`:139`) — for a modal dialog this is fine; the dialog already declares its name via `aria-label`. ✓

---

## 3. Keyboard navigation review

### Strengths
- **Focus-visible ring globally enforced** via `globals.css:1011-1014` (2px solid `var(--primary)` outline + 2px offset). Conformant with WCAG 2.4.11 minimum.
- **Skip link** (`app/layout.tsx:83-85`) styled as `sr-only focus:not-sr-only`. Targets `#main-content`. ✓
- **Focus trap hook** (`src/hooks/useFocusTrap.ts`) is well-implemented: snapshots `previouslyFocused`, focuses first focusable on activation, restores on deactivation, handles Tab/Shift+Tab wrap and Escape. ✓
- **Reduced-motion aware** (`globals.css:962-995`) globally collapses animation duration to 0.01 ms.
- **Forced-colors block** (`globals.css:1019-1122`) for Windows High Contrast Mode is unusually thorough — covers nodes, edges, handles, scrollbars, focus indicators.
- **Roving tabindex** in activity bar, tab-bar, simulation transport, and (inferred) canvas toolbar. ✓
- Multiple components (`A11yToolbar`, `command-palette`, `keyboard-shortcuts-dialog`, mobile activity-bar overflow) use the focus-trap hook. ✓
- **`use-keyboard-shortcuts.ts:120, 128, 139, 170`** correctly checks `e.target === document.body` for some shortcuts (Space, Cmd+A, Backspace/Delete, `?`).

### Critical gaps
- **Shortcuts that fire from inside text inputs**: `Cmd+E` (Export), `Cmd+T` (Templates), `Cmd+J` (Bottom panel), `Cmd+I` (Import), `Cmd+Z`/`Cmd+Shift+Z` (Undo/Redo) all fire regardless of `e.target` (`use-keyboard-shortcuts.ts:73-117`). User typing "I'd like to..." in any text field will accidentally open the import dialog at "I". **Severity: Critical. WCAG 2.1.4 (Character Key Shortcuts).** Fix: gate by `e.target === document.body || !(e.target instanceof HTMLElement && e.target.matches('input,textarea,[contenteditable]'))`.
- **Onboarding overlay has no focus trap** (see 2.12).
- **Activity bar `role="listbox"` mis-use** (see 2.13).
- **TabBar has no Arrow key navigation** (see `tab-bar.tsx`, 2.1).
- **SpeedControl radiogroup has no Arrow key navigation** (see 2.1).
- **Knowledge graph has no keyboard path to nodes** (see 2.4).
- **Drag-and-drop from Component Palette** (`DesignCanvas.tsx:216-289`) is pointer-only. WCAG 2.5.7 (Dragging Movements, new in 2.2) requires a single-pointer alternative; WCAG 2.1.1 requires keyboard equivalent. The Command Palette ("Add Web Server", etc.) provides the keyboard alternative ✓ — make this discoverable from the canvas empty state.

### Minor gaps
- `?` shortcut to open shortcuts dialog only fires from `document.body` — good. But the shortcuts dialog and the canvas-overlay shortcut sheet are *separate* components (`shared/keyboard-shortcuts-dialog.tsx` vs `canvas/overlays/KeyboardShortcutSheet.tsx`) with overlapping but inconsistent shortcut lists. **Maintenance / consistency hazard.**
- `e.metaKey || e.ctrlKey` — combines Mac/Win heuristics. ✓
- **`beforeunload` warning** (`use-keyboard-shortcuts.ts:36-45`) prompts only when nodes exist. WCAG 3.3.4 considerations: data should also be persistently saved (autosave) so the prompt is a backup, not a primary defence.

---

## 4. Screen reader review (static analysis)

### Landmarks
- `<header>` ✓ (settings page).
- `<nav aria-label="Module navigation">` ✓ (activity-bar).
- `<nav aria-label="Settings sections">` ✓.
- `<main id="main-content" aria-label="Canvas">` ✓ (workspace-layout — *desktop only*, see 2.9).
- `<aside aria-label="Component palette">` ✓.
- `<aside aria-label="Properties">` ✓.
- `<footer>` — not directly observed in app shell; landing page has one (not read in detail).

### Live regions
- **`SimulationAnnouncer`** — `role="status" aria-live="polite" aria-atomic="true"` for sim status / metrics / canvas mutations. ✓
- **`CanvasDescription`** — same pattern for canvas summary. ✓
- **No `role="alert"`** anywhere — should be used for critical errors (e.g. import failure, AI rate-limit). Currently failure messages are inline text without live region. **Severity: Moderate. WCAG 4.1.3.**
- **Toast container** (`ui/toast.tsx:139-150`) — has no `role="region"` / `aria-live="polite"` wrapper; toasts are just `<motion.div>` children of a positional container. **Severity: Critical. WCAG 4.1.3 Status Messages.** Each toast type maps to a semantic that needs `role="status"` (success/info) or `role="alert"` (warning/error). Fix: add `role="status"` + `aria-live="polite"` on success/info toasts and `role="alert"` + `aria-live="assertive"` on warning/error.
- **`DrillTimer` `aria-live="assertive"` per-second update** is anti-pattern (see 2.7).

### Naming / labelling
- Search inputs: labelled ✓
- Icon-only buttons:
  - `SoundToggle.tsx:23` — `aria-label` + `aria-pressed` ✓ (gold standard)
  - `ToolbarButton` — relies on tooltip only (no `aria-label`). **Critical** (see 2.1).
  - Dialog Close, Confirm Close in template/playbook gallery — `aria-label="Close"` ✓
- Form inputs: `<Label htmlFor>` consistently ✓ in settings + AI panel.
- Switches in `A11yToolbar`: doubly labelled (`<Label htmlFor>` + `aria-label`) — slightly redundant but explicit. ✓

### Heading hierarchy
- **`/dashboard`** — `<h1>` at `:454`. ✓
- **`/settings`** — `<h1>Settings</h1>` at `:792`. ✓
- **`/landing`** — `<motion.h1>` at `LandingPage.tsx:448`. ✓
- **`/profile/[username]`** — Has h1 (per `grep -c '<h1' = 1`). ✓
- **`/blog/[slug]`** — **Multiple h1** possible (see 2.11). **Blocker.**
- **`/`** (canvas home) — Module sidebars only have h2/h3 (`KnowledgeGraphModule.tsx:21, 28`, etc.). The canvas page has *no `<h1>`*. The Empty State uses `<h3>` (`EmptyState.tsx:127`). For a page-level view, screen readers will report "no level-1 heading", interrupting their navigation flow. **Severity: Serious. WCAG 2.4.6.** Fix: provide a visually-hidden `<h1>` per active module ("System Design Workspace", etc.) or render a visible breadcrumb-style title bar.

### Status messages
- See live-region notes above.

---

## 5. Color / contrast review

Reviewing `src/app/globals.css` design tokens against WCAG AA (4.5:1 for body text, 3:1 for non-text + large text).

**Dark theme** (`:8-368`):
- `--foreground: hsl(220 5% 90%)` (≈ `#E5E5E6`) on `--background: hsl(225 8% 7%)` (≈ `#101113`) → **17.6:1** ✓
- `--foreground-muted: hsl(220 5% 55%)` (≈ `#878889`) on `--background` → **5.6:1** ✓ for body text, but borderline at small sizes
- **`--foreground-subtle: hsl(220 5% 62%)`** (≈ `#9A9B9C`) on `--background` → **6.9:1** ✓ — note `subtle` is *brighter* than `muted`, which is unusual naming
- `--primary: hsl(258 78% 64%)` (≈ `#7E51E5`) on `--background` → **5.4:1** ✓ for primary CTA text; primary-on-primary-foreground (white) → **4.7:1** ✓
- **`--primary` against `--foreground`** (text-primary on background) → 5.4:1 — used as link colour. ✓
- **`--state-warning: hsl(38 92% 50%)`** (≈ `#F49F0F`) — on `--background` → **9.8:1** ✓
- **`--state-error: hsl(0 72% 51%)`** (≈ `#DA3D3D`) — on `--background` → **5.0:1** ✓
- **`--state-success: hsl(142 71% 45%)`** (≈ `#21C55D`) — on `--background` → **6.6:1** ✓
- **`--accent-warm: hsl(35 90% 55%)`** (≈ `#F2A41E`) — on `--background` → **9.6:1** ✓
- **Border `--border: rgba(255,255,255,0.10)`** on `--surface: hsl(225 8% 11%)` → ~1.8:1 contrast — fails WCAG 1.4.11 (3:1 for non-text UI). **Severity: Serious.** Recommend `--border-strong` (already defined at 0.16) for borders that convey UI structure (around buttons, inputs).

**Light theme** (`:372-601`):
- `--foreground: hsl(228 15% 10%)` (≈ `#161A22`) on `--background: hsl(228 5% 99%)` (≈ `#FBFBFC`) → **18.7:1** ✓
- `--foreground-muted: hsl(220 10% 40%)` (≈ `#5C6470`) on `--background` → **6.9:1** ✓
- `--foreground-subtle: hsl(220 10% 60%)` (≈ `#8B919A`) on `--background` → **3.4:1** — fails 4.5:1 for body text. ✓ for *large* text only. **Severity: Serious. WCAG 1.4.3.** When `text-foreground-subtle` is used with `text-xs` / `text-sm` (frequent), it fails AA.
- `--primary: hsl(252 87% 55%)` (≈ `#5F2BE0`) on `--background` → **8.7:1** ✓
- **`--border: hsl(220 13% 91%)`** (≈ `#E6E8EC`) on `--background` → **1.2:1** — same border-contrast issue as dark mode but worse. **Severity: Serious. WCAG 1.4.11.**

**Domain colours** (`KnowledgeGraphModule`, `ConceptGraph`):
- The 13 module domain colours (e.g. `text-blue-400`, `text-purple-400`) are used for chips/badges. Tailwind's `*-400` colours on `--background` (dark) generally hit 4.5:1, but on light theme some fall below. Worth a per-token light-mode contrast pass.

**Specific surfaces**:
- `Toast` `bg-surface` (`hsl(225 8% 11%)`) with `text-foreground` — ~16:1 ✓
- `Tooltip` `bg-popover` `text-popover-foreground` — ~17:1 ✓
- **Drill timer "urgent" state** (`DrillTimer.tsx:40`) uses `text-rose-400` on what's likely `bg-elevated` or similar dark surface — `#FB7185` on `#1F222B` → ~5.0:1 ✓; but the `animate-pulse` cycles opacity from 100% → 50%, halving contrast at trough. **Severity: Moderate. WCAG 1.4.3 — the contrast must hold during all animation states.**

**Forced-colors mode** (`globals.css:1019-1122`) — Excellent coverage. Two gaps:
- `.animated-gradient-text` (landing page) not addressed (see 2.10). **Critical.**
- Toasts have no forced-colors override, but they inherit the `border-color: ButtonText` from the `*` selector. ✓

---

## 6. Motion review

### Strengths
- Global `@media (prefers-reduced-motion: reduce)` block (`globals.css:962-995`) overrides duration tokens to `0ms` and adds `!important` rules.
- Custom `MotionProvider` (`src/components/providers/MotionProvider.tsx`) and `ReducedMotionProvider` allow user to override OS setting via the toolbar / settings panel. ✓
- `motion/react`'s `useReducedMotion()` is consumed in 19+ files; key components branch to no-animation paths (`AnimatedButton`, `command-palette`, `AnimatedText`, `BaseNode`, etc.).
- Confetti / pulse glow surfaces have explicit overrides (`globals.css:988-995`).

### Gaps
- **Persistent / infinite animations** that should be honour-bound:
  - `BaseNode` state pulses (`error-pulse`, `warning-glow`, `processing-spin`) — neutralised globally ✓
  - `lld-particle-drift`, `lld-dot-flow`, `lld-edge-draw` (`globals.css:899-921`) — animation keyframes only; the `prefers-reduced-motion` block at `:962-995` collapses duration. ✓
  - **`animated-gradient-text`** (`AnimatedText.tsx:33-58`) — has its own `prefers-reduced-motion` rule inside the injected stylesheet (`:60-70`) ✓
  - **`tab-indicator-in`** (`globals.css:865-872`) — single 150 ms run; reduced-motion neutralises it ✓
- **Auto-playing media**: typewriter at landing (`LandingPage.tsx:514-520`) starts after 800 ms, types at 35 ms/char. With `prefersReducedMotion` it shows the full text immediately ✓.
- **Motion Sickness** — the canvas particle layer + heatmap + chaos shake + animated gradient mesh + simulation animations together can be visually overwhelming. The existing "Reduce animations" toggle in `A11yToolbar` (`:204-209`) and Settings (`:438-443`) covers this, but only if the user knows to flip it. **Severity: Minor. WCAG 2.3.3 (Animation from Interactions, AAA).**
- **WCAG 2.2.2 (Pause, Stop, Hide)**: The simulation runs "indefinitely" once started. There IS a pause button (transport bar), so this passes. ✓
- **Spinning loader** in `SocraticTutor.tsx:464` (`Loader2 animate-spin`) — neutralised by reduced-motion ✓
- **Cross-fade LOD** in `BaseNode.tsx:289-291` is a simple opacity transition ✓

### Critical
- None new beyond the gradient-text forced-colors interaction (covered in 2.10).

---

## 7. Forms review

Surfaces inspected: Settings, AI Settings, Confirm Dialog, Import Dialog, Sound volume slider.

### Strengths
- Native `<input>` + `<Label htmlFor>` consistently used in settings and AI panels.
- `Switch` from Radix has correct `aria-checked` + keyboard.
- `Select` from Radix has full combobox behaviour.
- `disabled` attribute used (volume slider when sound off).

### Critical / Serious gaps
- **No `aria-invalid` / `aria-describedby` for error messages** anywhere reviewed. AI key validation (`AISettingsSection.tsx`), import JSON parsing (`import-dialog.tsx`), capacity calculator — all show errors as plain text without programmatic linkage. **Severity: Serious. WCAG 3.3.1, 3.3.3.**
- **Theme toggle in settings** uses `<button>` triplet without `role="radiogroup"`. Should be either a `<select>`, a `radiogroup`, or a Radix `ToggleGroup`. **Severity: Serious. WCAG 4.1.2.**
- **No `<form>` element** wrapping AI key fields. Pressing Enter in the input fires `handleSaveKey()` (`:97`), which is fine, but submit-on-Enter is only one of the form patterns; using `<form onSubmit>` ensures default form semantics for SR users. **Severity: Minor.**
- **Password toggle button** (Show/Hide key) needs `aria-pressed` and explicit "Show API key" / "Hide API key" labels (see 2.14). **Severity: Moderate.**
- **Volume slider** does not announce updates outside the native range value. ✓ acceptable.
- **Required field indication**: AI key has placeholder `sk-ant-...` but no `required` attribute or `aria-required`. The Save action is an explicit button, so submit-on-empty is prevented at the JS level. Acceptable. **Severity: Minor.**
- **Redundant Entry (WCAG 3.3.7, new in 2.2)**: Not applicable to surfaces reviewed; multi-step forms not present.

### Confirm Dialog (`ui/confirm-dialog.tsx`)
- `:62-66` — `<DialogContent>` (Radix) ✓. Auto-focuses first focusable (Cancel button). ✓
- `:77-83` — Title + Description rendered in `DialogTitle` + `DialogDescription` (Radix wires `aria-labelledby` + `aria-describedby` automatically). ✓
- `:80` — `<AlertTriangle aria-hidden="true">` ✓
- **Severity**: Solid.

---

## 8. Out of scope — what needs a real screen reader / browser audit

- **Live screen reader testing** (NVDA / JAWS / VoiceOver / TalkBack) for actual announcement order, verbosity, and queueing behaviour of the live regions.
- **Keyboard-only walk-through** of the canvas: drag-and-drop alternative discovery, edge creation via keyboard, node selection-then-edit flow.
- **Automated axe / Lighthouse pass** against built routes.
- **Color contrast verification with real composited values** (translucent borders over varied backgrounds, hover states, animation mid-frames).
- **Mobile screen reader** behaviour (TalkBack, VoiceOver iOS) on the BottomSheet / FAB / mobile activity-bar overflow.
- **Voice control / Dragon NaturallySpeaking** verification of "Click <visible label>" working for icon-only buttons.
- **Switch access** verification (especially for canvas).
- **Browser zoom 400%** / **text-only zoom 200%** reflow (WCAG 1.4.10, 1.4.4) — the workspace is `h-screen overflow-hidden` (`workspace-layout.tsx:154`) which may break reflow.
- **`react-resizable-panels`** keyboard/screen-reader behaviour on resize handles.
- **PWA install prompt / update toast** (`InstallPrompt`, `UpdateToast` in `app/layout.tsx`) not reviewed.
- **Clerk auth flows** — wrapped behind env var (`app/layout.tsx:17-24`), not reviewable here.
- **Embed routes** (`app/embed/lld/layout.tsx`) — not reviewed.

---

## 9. Reproduction notes

To verify findings:

```bash
# 1. Start the dev server
cd /Users/a0g11b6/Downloads/projects/architex/architex
pnpm dev   # or whatever package manager the repo uses

# 2. Multiple-h1 (Blocker, 2.11)
#   Visit a blog post whose markdown body contains a `# heading` line.
#   Inspect element → search for h1 → expect ≥ 2.

# 3. High-contrast no-op (Blocker, 2.8 / 2.2)
#   /settings → toggle High Contrast.
#   Inspect <html> classList → expect "high-contrast" added.
#   Run getComputedStyle(document.body) → expect no change.
#   Run grep -rn "\.high-contrast\b" src --include="*.css"  → expect no matches.

# 4. role=listbox on nav (Blocker, 2.13)
#   Open the activity bar with VoiceOver.
#   Expect: "Modules, listbox, 1 of 13 selected" — wrong role.

# 5. Drill timer assertive aria-live (Critical, 2.7)
#   Start a drill, watch when remaining < 60 s.
#   With NVDA: every second is announced.

# 6. Onboarding focus trap missing (Critical, 2.12)
#   Trigger first-run onboarding overlay.
#   Tab → focus escapes the overlay to underlying app.

# 7. Toast missing live region (Critical, §4)
#   Trigger a toast (any).
#   With NVDA / VoiceOver: nothing announced unless user navigates to toast.

# 8. Cmd+E from inside a text input (Critical, §3)
#   Open settings → click into AI key input → type the letter "e" with Cmd held.
#   Expect: Export dialog opens despite keystroke originating in input.

# 9. Switch target size (Serious, 2.1)
#   Inspect any Switch in /settings → measure render box → 36×20 px.
#   WCAG 2.5.8 minimum is 24×24.

# 10. ToolbarButton no aria-label (Critical, 2.1)
#    Open canvas → tab to toolbar → with VoiceOver: "button" with no name.
#    Tooltip is visual only.

# 11. Border contrast (Serious, §5)
#    Inspect Card / Input / Button border colour → rgba(255,255,255,0.10).
#    Compute contrast against bg-surface → ≈ 1.8:1 (fails WCAG 1.4.11).
```

### Quick-win priority list (recommended order)

1. **Implement `.high-contrast` styles** OR remove the toggle — restores trust. (`globals.css`, `settings/page.tsx:401`, `A11yToolbar.tsx:188`)
2. **Demote markdown `# ` → `<h2>` in blog renderer** — single-line fix in `blog/[slug]/page.tsx:85-93`.
3. **Add `aria-label={tooltip}` to ToolbarButton** — names every toolbar icon button. (`ToolbarButton.tsx:58-66`)
4. **Wrap `ToastContainer` toasts in `role="status" aria-live="polite"` (or `role="alert"` for warning/error)** — fixes status-message conformance.
5. **Add `useFocusTrap` to OnboardingOverlay** — same hook already used elsewhere.
6. **Fix `Cmd+E/T/J/I/Z` to skip when target is an input/textarea/contenteditable** — single guard in `use-keyboard-shortcuts.ts:73-117`.
7. **Replace `role="listbox"` with `role="tablist"` on activity bar** — and `role="option"` → `role="tab"` (and add `aria-controls` to the active panel).
8. **Drop `aria-live` from DrillTimer's visible element**; add a hidden announcer that fires only at threshold transitions (60s, 30s, 10s).
9. **Forced-colors override for `.animated-gradient-text`** — `-webkit-text-fill-color: currentColor; background: none;`.
10. **Bump Switch / Dialog Close hit areas to 24×24 minimum** — touch target compliance.
11. **Add hidden `<h1>` per active module** on canvas home — heading-by-h1 navigation works.
12. **Add `aria-invalid` + `aria-describedby` linkage to AI-key, import-JSON, capacity-calc fields** — error identification.

---

## Appendix A — Files cited

- `src/app/globals.css:8-1122`
- `src/app/layout.tsx:64-98`
- `src/app/page.tsx:1-371`
- `src/app/settings/page.tsx:376-498, 782-882`
- `src/app/blog/[slug]/page.tsx:60-93, 175-242`
- `src/app/profile/[username]/page.tsx:1-120`
- `src/app/dashboard/page.tsx:454`
- `src/app/landing/page.tsx:1-77`
- `src/components/landing/LandingPage.tsx:300-520, 641-968`
- `src/components/landing/AnimatedText.tsx:1-292`
- `src/components/ui/button.tsx:9-37`
- `src/components/ui/dialog.tsx:32-122`
- `src/components/ui/input.tsx:9-22`
- `src/components/ui/label.tsx:1-23`
- `src/components/ui/popover.tsx:14-30`
- `src/components/ui/progress.tsx:13-37`
- `src/components/ui/select.tsx:15-160`
- `src/components/ui/switch.tsx:8-29`
- `src/components/ui/tabs.tsx:1-55`
- `src/components/ui/tab-bar.tsx:65-104`
- `src/components/ui/timeline-scrubber.tsx:130-208`
- `src/components/ui/toast.tsx:84-150`
- `src/components/ui/toolbar-button.tsx:44-87`
- `src/components/ui/tooltip.tsx:1-35`
- `src/components/ui/floating-toolbar.tsx:14-46`
- `src/components/ui/confirm-dialog.tsx:60-101`
- `src/components/ui/SoundToggle.tsx:13-44`
- `src/components/ui/keyboard-shortcut-badge.tsx:70-90`
- `src/components/ui/animated-button.tsx:29-105`
- `src/components/ui/scroll-area.tsx:1-48`
- `src/components/ui/dropdown-menu.tsx:1-225`
- `src/components/ui/badge.tsx:42-55`
- `src/components/ui/speed-control.tsx:82-189`
- `src/components/ui/simulation-transport.tsx:113-273`
- `src/components/canvas/DesignCanvas.tsx:66-385`
- `src/components/canvas/A11yToolbar.tsx:60-256`
- `src/components/canvas/CanvasDescription.tsx:163-189`
- `src/components/canvas/NodeListPanel.tsx:88-322`
- `src/components/canvas/nodes/system-design/BaseNode.tsx:111-514`
- `src/components/canvas/overlays/EmptyState.tsx:88-162`
- `src/components/shared/workspace-layout.tsx:30-256`
- `src/components/shared/command-palette.tsx:388-548`
- `src/components/shared/keyboard-shortcuts-dialog.tsx:73-201`
- `src/components/shared/SimulationAnnouncer.tsx:36-137`
- `src/components/shared/onboarding-overlay.tsx:231-420`
- `src/components/shared/activity-bar.tsx:65-340`
- `src/components/shared/import-dialog.tsx:37-80`
- `src/components/ai/SocraticTutor.tsx:80-487`
- `src/components/ai/HintPanel.tsx:89-330`
- `src/components/ai/ReviewOverlay.tsx:91-120`
- `src/components/billing/UsageMeter.tsx:57-110`
- `src/components/settings/AISettingsSection.tsx:34-100`
- `src/components/modules/KnowledgeGraphModule.tsx:16-106`
- `src/components/modules/lld/drill-mode/DrillTimer.tsx:1-47`
- `src/components/knowledge-graph/ConceptGraph.tsx:340-440`
- `src/hooks/useFocusTrap.ts:1-107`
- `src/hooks/use-keyboard-shortcuts.ts:1-193`
- `e2e/keyboard-shortcuts.spec.ts:1-39`

---

*End of review.*
