# Onboarding, Plugin Architecture & Mobile

---

## ONBOARDING

### Libraries
| Library | Size | Framework | Approach |
|---|---|---|---|
| **React Joyride** | ~40KB | React | Tooltip tours with spotlighting |
| **Shepherd.js** | ~50KB | Agnostic | Step-by-step guided tours |
| **Driver.js** | ~5KB | Agnostic | Minimal, highlight-driven |

### Best Patterns (from Figma, VS Code, Linear)

**Progressive Disclosure:** Show essential tools first, reveal advanced as user demonstrates competence.

**Interactive Sandbox (Figma-style):** Pre-populated project user modifies. Guided steps overlay actual workspace.

**Empty State as Onboarding:** When canvas is empty → "Drag a Load Balancer here to start" with ghost placeholder.

**Contextual Tooltips:** First-time tooltips on first interaction with each feature area.

---

## PLUGIN ARCHITECTURE

### Pattern A: iframe Sandbox (RECOMMENDED — Figma Model)
```
Host Application
  └── Plugin iframe (sandbox, CSP)
       └── No DOM access, postMessage API only
```
- Security: `sandbox="allow-scripts"` (no DOM, no same-origin)
- Communication: `window.postMessage()` with permission checking
- Each plugin declares permissions: `read-selection`, `modify-node`, `show-ui`, `network`

### Pattern B: Web Worker Sandbox (VS Code Model)
- True thread isolation, no DOM access
- Use `comlink` for ergonomic Worker communication
- Best for: computation-heavy plugins (layout, analysis)

### Pattern C: WASM Sandbox (Emerging)
- Language-agnostic (Rust, Go, C plugins)
- Libraries: Extism, Wasmer
- Best for: future-proofing, performance-critical

### Recommended Hybrid:
| Plugin Type | Sandbox |
|---|---|
| UI plugins | iframe |
| Computation | Web Worker |
| Import/Export | iframe or Worker |
| Themes | None (CSS only) |

---

## THEMING

### Architecture: Design Tokens → CSS Variables → Tailwind

```json
// tokens/dark.json
{ "color": { "primary": "#818CF8", "surface": "#1F2937", "text-primary": "#F9FAFB" } }
```
↓
```css
[data-theme="dark"] { --color-primary: #818CF8; --color-surface: #1F2937; }
```
↓
```js
// tailwind.config.js
colors: { primary: 'var(--color-primary)', surface: 'var(--color-surface)' }
```

### Runtime switching: Set `data-theme` attribute on `<html>`. Use `next-themes` for SSR.
### Radix Colors for perceptually balanced color scales with auto dark mode.

---

## MOBILE & TOUCH

### React Flow Touch Support
```tsx
<ReactFlow
  panOnDrag={true}       // Single-finger pan
  zoomOnPinch={true}     // Two-finger pinch zoom
  zoomOnScroll={false}   // Disable on mobile (conflicts with page scroll)
  connectionRadius={30}  // Larger hit target for touch
/>
```

### Enhanced: `@use-gesture/react`
- Pinch-to-zoom, two-finger pan, momentum/inertia panning
- `touchAction: 'none'` on container (critical)

### Mobile UX Patterns
- **Adaptive toolbar:** Bottom sheet (vaul) on mobile, sidebar on desktop
- **Touch targets:** Min 44×44px (Apple HIG). Connection ports expand on touch.
- **View-only on mobile:** Full editing defers to desktop. This is pragmatic.
- **Responsive:** Below 1024px → single-panel with bottom navigation

### PWA
```json
{
  "name": "Architex",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#4F46E5"
}
```

### Key Libraries
| Library | Purpose |
|---|---|
| @use-gesture/react | Touch/mouse gesture handling |
| vaul | Mobile bottom sheet drawer |
| Workbox | PWA service worker |
| Dexie.js | Offline IndexedDB storage |
