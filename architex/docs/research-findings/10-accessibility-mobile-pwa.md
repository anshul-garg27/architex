# 10 — Accessibility, Mobile Responsiveness & PWA

> Full WCAG 2.2 AA audit of the Architex codebase, canvas accessibility strategy, mobile responsive design, PWA implementation plan, and i18n readiness.

---

## 1. WCAG 2.2 AA Compliance Audit

### 1.1 Activity Bar (`src/components/shared/activity-bar.tsx`)

| Issue | WCAG Criterion | Severity | Current Code | Fix |
|---|---|---|---|---|
| Missing `role="navigation"` on container | 1.3.1 Info & Relationships | High | `<div className="flex h-full w-12...">` | Wrap in `<nav aria-label="Module navigation">` |
| Missing `aria-label` on buttons | 4.1.2 Name, Role, Value | High | `<button title="...">` | Add `aria-label={mod.label}` on each button |
| Missing `aria-current="page"` on active | 4.1.2 Name, Role, Value | Medium | Active state is visual-only (CSS class) | Add `aria-current={isActive ? "page" : undefined}` |
| No visible focus indicator | 2.4.7 Focus Visible | High | No `focus-visible` styles | Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` |
| Icon-only buttons lack text | 1.1.1 Non-text Content | High | Only icon rendered, title used for tooltip | Add `<span className="sr-only">{mod.label}</span>` inside button |
| No keyboard shortcut announced | 4.1.2 Name, Role, Value | Low | Shortcut in `title` only | Include shortcut in `aria-label`: `"System Design (Cmd+1)"` |
| Settings button has no accessible name | 4.1.2 Name, Role, Value | High | `title="Settings"` only | Add `aria-label="Settings"` |
| Container lacks `<nav>` landmark | 1.3.1 Info & Relationships | Medium | Generic `<div>` | Change to `<nav aria-label="Modules">` |

**Recommended fix for ActivityBar:**

```tsx
<nav aria-label="Module navigation" className="flex h-full w-12 flex-col...">
  <div role="list" className="flex flex-1 flex-col items-center gap-1">
    {modules.map((mod) => {
      const Icon = mod.icon;
      const isActive = activeModule === mod.id;
      return (
        <button
          key={mod.id}
          role="listitem"
          onClick={() => setActiveModule(mod.id)}
          aria-label={`${mod.label}${mod.shortcut ? ` (Cmd+${mod.shortcut})` : ""}`}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
            isActive
              ? "bg-primary/15 text-primary"
              : "text-foreground-muted hover:bg-sidebar-accent hover:text-foreground",
          )}
        >
          {isActive && (
            <div aria-hidden="true" className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary" />
          )}
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">{mod.label}</span>
        </button>
      );
    })}
  </div>
  ...
</nav>
```

### 1.2 Command Palette (`src/components/shared/command-palette.tsx`)

| Issue | WCAG Criterion | Severity | Current Code | Fix |
|---|---|---|---|---|
| Missing `role="dialog"` and `aria-modal` | 4.1.2 Name, Role, Value | High | `<div className="fixed inset-0 z-50">` | Add `role="dialog" aria-modal="true" aria-label="Command palette"` |
| Backdrop not announced | 1.3.1 Info & Relationships | Low | Click-to-close backdrop | Add `aria-hidden="true"` to backdrop |
| Focus not trapped in dialog | 2.4.3 Focus Order | High | No focus trap | Implement focus trap (use `@radix-ui/react-dialog` or manual trap) |
| No `aria-activedescendant` | 4.1.2 Name, Role, Value | Medium | cmdk handles internally | Verify cmdk provides ARIA; add if missing |
| Missing `aria-label` on input | 1.3.1 Info & Relationships | Medium | `placeholder` used as label | Add `aria-label="Search commands"` |
| Escape key only via onKeyDown | 2.1.1 Keyboard | Low | Manual `onKeyDown` | Already functional, but add to dialog role |
| No announcement when results filter | 4.1.3 Status Messages | Medium | Results change silently | Add `aria-live="polite"` region for result count |
| Shortcut badges lack semantics | 1.3.1 Info & Relationships | Low | `<kbd>` elements | Good -- `<kbd>` is semantic; add `aria-label` context |

**Recommended fix for CommandPalette:**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-label="Command palette"
  className="fixed inset-0 z-50"
>
  <div aria-hidden="true" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
  <FocusTrap>
    <div className="absolute left-1/2 top-[20%] w-full max-w-lg -translate-x-1/2">
      <Command ...>
        <Command.Input aria-label="Search commands" ... />
        <div aria-live="polite" className="sr-only">
          {filteredCount} results available
        </div>
        <Command.List role="listbox" ...>
          ...
        </Command.List>
      </Command>
    </div>
  </FocusTrap>
</div>
```

### 1.3 BaseNode (`src/components/canvas/nodes/system-design/BaseNode.tsx`)

| Issue | WCAG Criterion | Severity | Current Code | Fix |
|---|---|---|---|---|
| No `role` on node container | 4.1.2 Name, Role, Value | High | Generic `<div>` | Add `role="group" aria-label={data.label}` |
| State dot is color-only | 1.4.1 Use of Color | High | Colored dot, no text | Add `aria-label` or `<span className="sr-only">` for state name |
| Metric badge lacks context | 1.3.1 Info & Relationships | Medium | `"{N} rps"` text only | Add `aria-label="Throughput: {N} requests per second"` |
| No `aria-selected` for selected state | 4.1.2 Name, Role, Value | Medium | Visual ring only | Add `aria-selected={selected}` |
| Handle elements lack ARIA | 4.1.2 Name, Role, Value | Low | React Flow Handles | Add `aria-hidden="true"` (handles are mouse-only; keyboard alternative needed) |
| Category color contrast | 1.4.3 Contrast (Minimum) | Medium | CSS variable colors | Audit all 9 category colors against dark/light backgrounds for 4.5:1 ratio |
| No `tabIndex` for keyboard focus | 2.1.1 Keyboard | High | Not focusable via keyboard | Add `tabIndex={0}` to container |
| Missing announcement for state changes | 4.1.3 Status Messages | Medium | State changes silently | Use `aria-live` or announce via screen reader utility |

### 1.4 Global Issues

| Issue | WCAG Criterion | Component(s) | Fix |
|---|---|---|---|
| No skip-to-content link | 2.4.1 Bypass Blocks | Layout | Add `<a href="#main-content" className="sr-only focus:not-sr-only">Skip to content</a>` |
| Missing `<main>` landmark | 1.3.1 Info & Relationships | Layout | Wrap canvas area in `<main id="main-content">` |
| No `<h1>` on page | 1.3.1 Info & Relationships | Page | Add visually-hidden `<h1>` or visible heading |
| Color contrast not verified | 1.4.3 Contrast | Theme vars | Audit all `--foreground-muted`, `--foreground-subtle` vars for 4.5:1 against backgrounds |
| No reduced-motion support | 2.3.3 Animation from Interactions | Motion lib usage | Add `@media (prefers-reduced-motion: reduce)` overrides; check `motion` library config |
| No focus management on module switch | 2.4.3 Focus Order | Activity bar + modules | Move focus to module heading when switching |
| Missing error announcements | 4.1.3 Status Messages | Simulation/Canvas | Add `aria-live="assertive"` for error states |
| No high-contrast mode support | 1.4.11 Non-text Contrast | All | Add `@media (forced-colors: active)` overrides |

---

## 2. Canvas Accessibility

The canvas (`@xyflow/react`) presents unique accessibility challenges because it is fundamentally a visual, pointer-driven interface. The following strategies make it usable for keyboard-only and screen reader users.

### 2.1 Text Alternatives

| Canvas Element | Text Alternative Strategy |
|---|---|
| Node | `role="group"` with `aria-label="{nodeType}: {label}"` (e.g., "Load Balancer: Primary LB") |
| Edge | `role="img"` with `aria-label="Connection from {source} to {target} via {edgeType}"` |
| Canvas viewport | `role="application" aria-label="System design canvas. {N} nodes, {M} connections"` |
| Minimap | `role="img" aria-label="Canvas overview minimap showing {N} components"` |
| Selection | Announce via `aria-live`: "{N} items selected" |
| Metric overlay | `aria-label="Throughput: {value} requests per second, Latency: {value}ms"` |

### 2.2 Keyboard-Only Node Creation

```
1. Press Tab to focus Component Palette
2. Arrow keys to navigate categories and components
3. Enter to select a component type
4. Component appears at canvas center (or next to last-placed node)
5. Arrow keys to fine-position (Shift+Arrow for 10px grid snap)
6. Enter to confirm placement
7. Focus moves to the newly placed node
```

**Implementation:**

```typescript
// src/hooks/use-canvas-keyboard.ts
export function useCanvasKeyboard() {
  const addNode = useCanvasStore((s) => s.addNode);
  const selectedNodes = useCanvasStore((s) => s.selectedNodes);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.target || (e.target as HTMLElement).closest('[data-canvas]')) {
        switch (e.key) {
          case 'ArrowUp':
            moveSelectedNodes(0, e.shiftKey ? -10 : -1);
            break;
          case 'ArrowDown':
            moveSelectedNodes(0, e.shiftKey ? 10 : 1);
            break;
          case 'ArrowLeft':
            moveSelectedNodes(e.shiftKey ? -10 : -1, 0);
            break;
          case 'ArrowRight':
            moveSelectedNodes(e.shiftKey ? 10 : 1, 0);
            break;
          case 'Delete':
          case 'Backspace':
            deleteSelectedNodes();
            break;
          case 'Escape':
            clearSelection();
            break;
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### 2.3 Keyboard-Only Node Selection

```
- Tab: cycle through nodes in creation order
- Shift+Tab: reverse cycle
- Space: toggle node selection
- Ctrl/Cmd+A: select all nodes
- Escape: deselect all
- Home: focus first node
- End: focus last node
```

### 2.4 Keyboard-Only Edge Creation

```
1. Focus a node (Tab navigation)
2. Press 'C' to enter connection mode
3. Screen reader announces "Connection mode. Use Tab to select target node."
4. Tab to target node
5. Enter to create connection
6. Edge type selector appears (arrow keys to choose, Enter to confirm)
7. Escape to cancel connection mode
```

### 2.5 Canvas Navigation

```
- Ctrl/Cmd + = / -: Zoom in/out
- Ctrl/Cmd + 0: Fit to screen
- Page Up / Page Down: Pan vertically
- Ctrl + Arrow keys: Pan in direction
- F: Focus selected node (center in viewport)
```

### 2.6 Screen Reader Canvas Summary

```typescript
// Provide a live summary region
<div role="status" aria-live="polite" className="sr-only" id="canvas-summary">
  System design canvas contains {nodes.length} components and {edges.length} connections.
  {selectedNodes.length > 0 && `${selectedNodes.length} selected.`}
  {simulation.status === 'running' && 'Simulation running.'}
</div>
```

### 2.7 Accessible Tree View Alternative

For users who cannot interact with the visual canvas, provide an alternative tree/list view:

```
[Toggle] Canvas View | List View

List View:
  Components (9):
    [x] Web Server: api-server-1 (active, 1.2K rps)
        --> Load Balancer: primary-lb (HTTP)
        --> Cache: redis-1 (cache-lookup)
    [ ] Load Balancer: primary-lb (idle)
        --> Database: postgres-1 (HTTP)
    ...
```

---

## 3. Mobile Responsive Design

### 3.1 Breakpoint System

| Breakpoint | Width | Layout Strategy |
|---|---|---|
| `xs` (Mobile S) | 0 - 479px | Single column, bottom sheets, no sidebar |
| `sm` (Mobile L) | 480 - 639px | Single column, collapsible bottom toolbar |
| `md` (Tablet) | 640 - 1023px | Canvas + collapsible sidebar, no properties |
| `lg` (Desktop) | 1024 - 1439px | Full layout, narrower panels |
| `xl` (Desktop L) | 1440px+ | Full layout, comfortable spacing |

### 3.2 Tailwind CSS Configuration

```css
/* globals.css */
@custom-media --mobile (width < 640px);
@custom-media --tablet (640px <= width < 1024px);
@custom-media --desktop (1024px <= width);

/* Or using Tailwind v4 breakpoint defaults which align with these */
```

### 3.3 Layout Adaptations by Breakpoint

#### Mobile (< 640px)

```
+---------------------------+
|  [=] Architex   [Q] [?]  |  <- Compact header, hamburger menu
+---------------------------+
|                           |
|       Canvas Area         |  <- Full-width canvas, pinch zoom
|       (touch-optimized)   |
|                           |
+---------------------------+
| [+] [Play] [Undo] [Redo] |  <- Floating action bar
+---------------------------+
|  [SD] [A] [DS] [DB] ...  |  <- Bottom tab bar (modules)
+---------------------------+
```

**Key changes:**
- Activity bar becomes bottom tab bar
- Sidebar becomes bottom sheet (swipe up from tab bar)
- Properties panel is a full-screen modal
- Component palette is a draggable bottom sheet
- Bottom panel (metrics/code/timeline) is a swipeable sheet
- No keyboard shortcuts (touch only)

#### Tablet (640px - 1023px)

```
+--+---------------------------+
|  |                           |
|AB|       Canvas Area         |
|  |                           |
|  +---------------------------+
|  |  Bottom Panel (metrics)   |
+--+---------------------------+
```

**Key changes:**
- Activity bar is narrow (icons only, already 48px)
- Sidebar toggles as overlay panel
- Properties panel toggles as right overlay
- Bottom panel collapses to a 2-row height

#### Desktop (1024px+)

Current layout is well-suited for desktop. No major changes needed.

### 3.4 Touch Gesture Support

| Gesture | Action | Implementation |
|---|---|---|
| Single tap | Select node/edge | React Flow default |
| Double tap | Edit node label | Custom handler |
| Long press (500ms) | Open context menu | Replace right-click |
| Pinch zoom | Canvas zoom | React Flow default |
| Two-finger pan | Canvas pan | React Flow default |
| Swipe up (from bottom) | Open bottom sheet | Custom gesture handler |
| Swipe down (on sheet) | Close bottom sheet | Custom gesture handler |
| Drag (on node) | Move node | React Flow default (increase hit area to 44x44px minimum) |
| Swipe left/right (on bottom tab) | Switch module | Custom gesture handler |

**Touch target sizing:**

```css
/* Minimum 44x44px touch targets per WCAG 2.5.8 */
@media (pointer: coarse) {
  .node-container {
    min-width: 44px;
    min-height: 44px;
  }

  .activity-bar button {
    min-width: 44px;
    min-height: 44px;
  }

  .handle {
    width: 20px;
    height: 20px;
  }
}
```

### 3.5 Bottom Sheet Component

```typescript
// src/components/mobile/BottomSheet.tsx
interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints: number[];  // [0.25, 0.5, 0.9] = 25%, 50%, 90% of screen
  defaultSnap: number;
  onClose: () => void;
}

// Uses `motion` library for spring physics
// Gesture detection via pointer events
// Snap-to-nearest on release
// Velocity-based snap (fast swipe = close)
```

### 3.6 Responsive Component Palette

```
Desktop: Sidebar panel with categories, drag-to-canvas
Tablet:  Overlay panel, drag-to-canvas
Mobile:  Bottom sheet with grid of icons, tap to add at center

Mobile layout:
+---------------------------+
| Component Palette    [x]  |
+---------------------------+
| [Compute] [Storage] [Net] | <- Category tabs
+---------------------------+
| [WS] [AS] [WK] [FN]     |
| [DB] [RD] [S3] [ES]     | <- Grid of component icons
| [LB] [AG] [CD] [DN]     |
| [MQ] [KF] [SN] [PH]     |
+---------------------------+
```

---

## 4. PWA Setup

### 4.1 Web App Manifest

```json
// public/manifest.json
{
  "name": "Architex - Interactive System Design",
  "short_name": "Architex",
  "description": "Practice system design interviews with interactive architecture diagrams, real-time simulation, and guided walkthroughs.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#0a0a0b",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/icons/icon-48.png",
      "sizes": "48x48",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-canvas.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "System design canvas with nodes and simulation"
    },
    {
      "src": "/screenshots/mobile-canvas.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile view of system design canvas"
    }
  ],
  "categories": ["education", "developer", "productivity"],
  "shortcuts": [
    {
      "name": "New Design",
      "short_name": "New",
      "url": "/?action=new",
      "icons": [{ "src": "/icons/shortcut-new.png", "sizes": "96x96" }]
    },
    {
      "name": "Templates",
      "short_name": "Templates",
      "url": "/?action=templates",
      "icons": [{ "src": "/icons/shortcut-templates.png", "sizes": "96x96" }]
    },
    {
      "name": "Practice",
      "short_name": "Practice",
      "url": "/?module=interview",
      "icons": [{ "src": "/icons/shortcut-practice.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share-target",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "design",
          "accept": ["application/json", ".architex"]
        }
      ]
    }
  }
}
```

### 4.2 Service Worker Strategy

```typescript
// src/sw.ts (compiled with next-pwa or serwist)

import { defaultCache } from '@serwist/next/worker';
import { Serwist } from 'serwist';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Strategy 1: App Shell (Cache First)
    {
      urlPattern: /\/_next\/static\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year (hashed filenames)
        },
      },
    },

    // Strategy 2: Page HTML (Stale While Revalidate)
    {
      urlPattern: /^https:\/\/architex\.dev\/(?!api\/).*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'pages',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
        },
        plugins: [
          {
            // Show "update available" toast when new content cached
            cacheDidUpdate: async () => {
              const clients = await self.clients.matchAll();
              clients.forEach((client) => {
                client.postMessage({ type: 'CONTENT_UPDATED' });
              });
            },
          },
        ],
      },
    },

    // Strategy 3: API/Dynamic Data (Network First)
    {
      urlPattern: /^https:\/\/architex\.dev\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-responses',
        networkTimeoutSeconds: 3,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },

    // Strategy 4: Template Data (Cache First, update in background)
    {
      urlPattern: /^https:\/\/architex\.dev\/api\/templates\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'templates',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },

    // Strategy 5: Images and icons (Cache First)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },

    // Strategy 6: Fonts (Cache First, long TTL)
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },

    // Default
    ...defaultCache,
  ],
});

serwist.addEventListeners();
```

### 4.3 Caching Strategy Summary

| Resource Type | Strategy | Cache Name | TTL | Max Entries |
|---|---|---|---|---|
| Static assets (`_next/static/`) | Cache First | `static-assets` | 1 year | 200 |
| Page HTML | Stale While Revalidate | `pages` | 1 week | 50 |
| API responses | Network First (3s timeout) | `api-responses` | 1 day | 100 |
| Template data | Stale While Revalidate | `templates` | 1 week | 50 |
| Images | Cache First | `images` | 30 days | 100 |
| Fonts | Cache First | `fonts` | 1 year | 20 |
| User designs (IndexedDB) | N/A (Dexie handles) | Dexie DB | Permanent | Unlimited |

### 4.4 Offline Capabilities

| Feature | Offline Support | Strategy |
|---|---|---|
| Canvas editing | Full | All state in Zustand + IndexedDB (Dexie) |
| Simulation | Full | Pure client-side computation |
| Algorithm visualization | Full | Pure client-side |
| Template loading | Partial | Cached templates available; new ones require network |
| Export (JSON/Mermaid/PlantUML) | Full | Client-side generation |
| Export (URL share) | Offline queue | Queue share requests, sync when online |
| Challenge mode | Partial | Cached challenges work; leaderboard needs network |
| Theme switching | Full | CSS variables, no network needed |

**Offline Detection UI:**

```typescript
// src/hooks/use-online-status.ts
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

// Status bar indicator:
// Online: hidden
// Offline: yellow "Offline mode - changes saved locally" banner
```

### 4.5 Install Prompt

```typescript
// src/hooks/use-install-prompt.ts
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, promptInstall };
}
```

**Install prompt trigger points:**
1. After 3rd session (returning user signal)
2. After completing first design (value demonstrated)
3. When going offline (utility of local app)
4. Never during first session (too aggressive)

### 4.6 Next.js PWA Configuration

```typescript
// next.config.ts
import withSerwist from '@serwist/next';

const nextConfig = {
  // ... existing config
};

export default withSerwist({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

---

## 5. Internationalization (i18n) Readiness

### 5.1 RTL (Right-to-Left) Support

**CSS logical properties migration:**

| Physical Property | Logical Property |
|---|---|
| `margin-left` | `margin-inline-start` |
| `margin-right` | `margin-inline-end` |
| `padding-left` | `padding-inline-start` |
| `padding-right` | `padding-inline-end` |
| `text-align: left` | `text-align: start` |
| `text-align: right` | `text-align: end` |
| `border-left` | `border-inline-start` |
| `border-right` | `border-inline-end` |
| `left` | `inset-inline-start` |
| `right` | `inset-inline-end` |
| `float: left` | `float: inline-start` |

**Current violations in audited components:**

```
activity-bar.tsx:
  - "absolute left-0" -> "absolute inset-inline-start-0"
  - "rounded-r" -> "rounded-ie" (or use logical border-radius)

command-palette.tsx:
  - "ml-auto" -> "ms-auto"
  - "px-3" is OK (symmetric)
  - "left-1/2 -translate-x-1/2" -> OK for centering (symmetrical)

BaseNode.tsx:
  - "ml-auto" -> "ms-auto" on state dot
  - "rounded-t-lg" -> OK (top/bottom not affected by RTL)
```

**Tailwind v4 logical property utilities:**

```css
/* Tailwind v4 supports logical properties natively */
.ms-auto { margin-inline-start: auto; }
.me-auto { margin-inline-end: auto; }
.ps-4    { padding-inline-start: 1rem; }
.pe-4    { padding-inline-end: 1rem; }
.start-0 { inset-inline-start: 0; }
.end-0   { inset-inline-end: 0; }
```

**HTML dir attribute:**

```tsx
// src/app/layout.tsx
export default function RootLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  const dir = isRTL(params.locale) ? 'rtl' : 'ltr';
  return (
    <html lang={params.locale} dir={dir}>
      <body>{children}</body>
    </html>
  );
}
```

### 5.2 String Externalization

**Current state:** All UI strings are hardcoded in component files.

**Recommended approach:** Use `next-intl` for type-safe i18n.

**Directory structure:**

```
src/
  messages/
    en.json           # English (default)
    es.json           # Spanish
    ja.json           # Japanese
    ar.json           # Arabic (RTL)
    zh-CN.json        # Chinese (Simplified)
    hi.json           # Hindi
```

**Message file structure (en.json):**

```json
{
  "modules": {
    "system-design": "System Design",
    "algorithms": "Algorithms",
    "data-structures": "Data Structures",
    "lld": "Low-Level Design",
    "database": "Database",
    "distributed": "Distributed Systems",
    "networking": "Networking",
    "os": "OS Concepts",
    "concurrency": "Concurrency",
    "security": "Security",
    "ml-design": "ML Design",
    "interview": "Interview"
  },
  "commands": {
    "switchTo": "Switch to {module}",
    "theme": {
      "dark": "Theme: Dark",
      "light": "Theme: Light",
      "system": "Theme: System"
    },
    "search": "Type a command or search...",
    "noResults": "No results found."
  },
  "canvas": {
    "addComponent": "Add Component",
    "nodeStates": {
      "idle": "Idle",
      "active": "Active",
      "success": "Success",
      "warning": "Warning",
      "error": "Error",
      "processing": "Processing"
    },
    "metrics": {
      "throughput": "{value} requests per second",
      "latency": "{value}ms latency",
      "errorRate": "{value}% error rate"
    }
  },
  "simulation": {
    "start": "Start Simulation",
    "pause": "Pause Simulation",
    "stop": "Stop Simulation",
    "reset": "Reset Simulation"
  },
  "accessibility": {
    "skipToContent": "Skip to main content",
    "canvasSummary": "System design canvas contains {nodeCount} components and {edgeCount} connections.",
    "moduleNav": "Module navigation",
    "commandPalette": "Command palette"
  }
}
```

**Strings to externalize (count by component):**

| Component | Hardcoded Strings | Priority |
|---|---|---|
| `activity-bar.tsx` | 13 (module labels + settings) | P1 |
| `command-palette.tsx` | 30+ (all command labels, group names) | P1 |
| `status-bar.tsx` | ~8 | P2 |
| `BaseNode.tsx` | ~3 (metric format strings) | P2 |
| `ComponentPalette.tsx` | ~20 (component names, categories) | P1 |
| `PropertiesPanel.tsx` | ~15 (field labels) | P2 |
| `BottomPanel.tsx` | ~8 (tab names) | P2 |
| `export-dialog.tsx` | ~10 (format names, buttons) | P2 |
| `template-gallery.tsx` | ~12 (template names, categories) | P2 |
| Module components (7) | ~50 total | P2 |
| Interview components (2) | ~15 | P2 |
| **Total** | **~184 strings** | |

### 5.3 Locale-Aware Formatting

```typescript
// src/lib/i18n/formatters.ts
import { useLocale } from 'next-intl';

export function useFormatNumber() {
  const locale = useLocale();
  return (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale, options).format(value);
}

export function useFormatCompact() {
  const locale = useLocale();
  return (value: number) =>
    new Intl.NumberFormat(locale, { notation: 'compact' }).format(value);
}

// Usage: formatCompact(1500000) -> "1.5M" (en) / "150万" (ja) / "1,5 M" (fr)
```

### 5.4 i18n Implementation Phases

| Phase | Scope | Effort |
|---|---|---|
| Phase 1: Infrastructure | Install next-intl, middleware, message files, provider | 1 week |
| Phase 2: Core UI | Externalize activity bar, command palette, status bar, canvas labels | 1 week |
| Phase 3: Content | Externalize panels, modules, interview, export | 1 week |
| Phase 4: RTL | Migrate CSS to logical properties, test with Arabic | 1 week |
| Phase 5: Translations | Professional translation of en.json to 5 target languages | 2 weeks |
| Phase 6: Locale routing | `[locale]/` prefix routes, locale detection, switcher | 1 week |

---

## 6. Implementation Priority Matrix

| Task | Impact | Effort | Priority |
|---|---|---|---|
| Skip-to-content link + landmarks | High | Low | P0 - Week 1 |
| Focus indicators (focus-visible) | High | Low | P0 - Week 1 |
| ARIA labels on activity bar | High | Low | P0 - Week 1 |
| Dialog role + focus trap on command palette | High | Medium | P0 - Week 1 |
| Node keyboard accessibility (Tab, Arrow, Enter) | High | High | P0 - Week 2 |
| Color contrast audit + fixes | High | Medium | P0 - Week 2 |
| Reduced motion support | Medium | Low | P1 - Week 3 |
| Mobile bottom tab bar | High | High | P1 - Week 3-4 |
| Touch gesture support | High | High | P1 - Week 4-5 |
| PWA manifest + service worker | Medium | Medium | P1 - Week 5 |
| Bottom sheet component | Medium | Medium | P1 - Week 5 |
| Offline support | Medium | Medium | P2 - Week 6 |
| Install prompt | Low | Low | P2 - Week 6 |
| String externalization | Medium | High | P2 - Week 7-8 |
| RTL support | Low | Medium | P3 - Week 9 |
| Translations | Low | High | P3 - Week 10-12 |
| Canvas list view alternative | Medium | High | P3 - Week 10 |
| High contrast mode | Low | Medium | P3 - Week 11 |
