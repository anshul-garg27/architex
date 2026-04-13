# 13 - UX Polish, Error Handling, and Micro-Interaction Gaps

> Comprehensive audit of 8 core source files across 10 UX categories.
> 100 actionable items, ordered by impact.

---

## Files Audited

| File | Lines | Purpose |
|------|-------|---------|
| `src/app/page.tsx` | 93 | App shell / module router |
| `src/components/shared/workspace-layout.tsx` | 153 | Resizable panel layout |
| `src/components/canvas/DesignCanvas.tsx` | 155 | React Flow canvas |
| `src/components/canvas/panels/ComponentPalette.tsx` | 138 | Drag-and-drop palette |
| `src/components/canvas/panels/PropertiesPanel.tsx` | 223 | Node config panel |
| `src/components/canvas/panels/BottomPanel.tsx` | 185 | Tabs: Metrics/Timeline/Code/Console |
| `src/components/modules/AlgorithmModule.tsx` | 438 | Sorting algorithm visualizer |
| `src/components/modules/DistributedModule.tsx` | 774 | Raft / consistent hashing |

---

## Category 1: Error Handling (10 items)

| # | Location | Gap | Severity | Fix |
|---|----------|-----|----------|-----|
| 1 | `DesignCanvas.tsx:84` | `JSON.parse(raw)` in `onDrop` has **no try/catch**. Malformed drag data crashes the app. | Critical | Wrap in try/catch, show toast on parse failure. |
| 2 | `page.tsx` (root) | **No React Error Boundary** wraps `<AppShell>`. Any unhandled render error shows a blank white screen. | Critical | Add `<ErrorBoundary>` with "Something went wrong" fallback and retry button. |
| 3 | `DistributedModule.tsx:621-629` | `ringRef.current.addNode()` has a bare `catch {}` block that silently swallows errors. User gets no feedback if node already exists. | High | Surface the error to user via toast: "Node already exists". |
| 4 | `DistributedModule.tsx:647` | `ringRef.current.addKey()` inside a loop uses bare `catch { break }`. User sees no indication that key addition failed (e.g., no nodes). | High | Show toast: "Add at least one node before adding keys". |
| 5 | `PropertiesPanel.tsx:101-102` | `selectedNode.data` is cast to `Record<string, unknown>` and `config` extracted with `as Record<string, unknown> ?? {}`. If data shape is wrong, runtime crash. | Medium | Add runtime type guard: `isArchitexNodeData(data)`. |
| 6 | `PropertiesPanel.tsx:126-134` | Destructuring `selectedNode.data as { label, category, ... }` with no validation. Missing fields produce `undefined` rendered in the UI. | Medium | Provide defaults: `label ?? 'Unnamed'`, `category ?? 'unknown'`. |
| 7 | `AlgorithmModule.tsx:47` | `parseInt(match[1], 10)` in `parseStepMutations` does not guard against `NaN`. | Low | Add `isNaN(idx)` check and `continue`. |
| 8 | `DesignCanvas.tsx:41-55` | `onConnect` uses the stale `edges` array from closure. If two rapid connections fire, the second may lose the first. | Medium | Use functional update: `setEdges(prev => addEdge(connection, prev))`. |
| 9 | `BottomPanel.tsx:18` | `MetricsDashboard` import has no error boundary. If the chart library throws, the entire bottom panel crashes. | Medium | Wrap `<MetricsTab>` in a local error boundary. |
| 10 | All modules | No global `window.onerror` or `window.onunhandledrejection` handler. Async errors are silently lost. | Medium | Add error reporting setup in `layout.tsx`. |

---

## Category 2: Loading States (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 11 | `page.tsx` | No `<Suspense>` boundary around `<AppShell>`. Server-to-client hydration shows nothing. | Add Suspense fallback with skeleton layout. |
| 12 | `DesignCanvas.tsx` | React Flow takes 200-500ms to initialize. Users see an empty gray box during init. | Add `<ReactFlow>` loading overlay: spinner + "Loading canvas..." |
| 13 | `ComponentPalette.tsx` | `PALETTE_ITEMS` is imported synchronously. If this becomes async (API call), no loading state exists. | Add `isLoading` state with skeleton cards. |
| 14 | `BottomPanel.tsx:126-129` | "Code editor will load here (Monaco)" placeholder. No skeleton or loading spinner when Monaco eventually loads. | Add Monaco loading skeleton with animated code lines. |
| 15 | `BottomPanel.tsx:133-137` | Console tab is a static placeholder. No loading indicator for when real log streaming starts. | Add empty state with "Waiting for simulation..." |
| 16 | `AlgorithmModule.tsx` | When running algorithm (generating steps), no loading indicator. Array generation + step computation is synchronous. | Add `isComputing` state with pulse animation. |
| 17 | `DistributedModule.tsx` | RaftCluster initialization (`new RaftCluster(5)`) happens in `useRef`. If this becomes async, no loading. | Add initialization loading state. |
| 18 | `InterviewModule.tsx` | `CHALLENGES` is statically imported. Future API fetch will have no skeleton. | Add challenge card skeletons. |
| 19 | `OSModule.tsx:442-468` | `runScheduling()` and `runPageReplacement()` are synchronous. For large inputs, UI freezes with no feedback. | Add brief loading state or move to Web Worker. |
| 20 | `workspace-layout.tsx` | Panel group remounts on toggle (`key={...}`). This causes a flash/FOUC as panels resize. | Add CSS transitions for panel mount/unmount. |

---

## Category 3: Empty States (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 21 | `DesignCanvas.tsx` | **Empty canvas** has no guidance. New users see dots and nothing else. | Add centered empty state: "Drag components from the sidebar or use Cmd+K to get started". |
| 22 | `PropertiesPanel.tsx:110-124` | Empty state exists but has no actionable CTA. | Add "Browse components" button that focuses the palette search. |
| 23 | `BottomPanel.tsx:20` | MetricsTab shows `<MetricsDashboard>` even with no data. | Add empty state: "Run a simulation to see metrics". |
| 24 | `ComponentPalette.tsx:125-129` | Search empty state exists ("No components match") but no clear button. | Add "Clear search" button to reset filter. |
| 25 | `AlgorithmModule.tsx:331-342` | Empty state for algorithm canvas is good. Missing quick-start action. | Add "Generate random array" CTA button. |
| 26 | `DistributedModule.tsx:356` | Consistent hashing shows "Add nodes to see distribution" -- good. But no CTA. | Add inline "Add your first node" button. |
| 27 | `DistributedModule.tsx:507-509` | Event log empty state: "Step the simulation to see events here." No visual icon. | Add icon + styled empty state matching other panels. |
| 28 | `InterviewModule.tsx:120-123` | "No challenges match your filters" exists. Missing clear filter button. | Add "Clear filters" CTA. |
| 29 | `OSModule.tsx` | Page replacement with no result: "Configure parameters and press Run". No visual. | Add OS-themed empty state icon. |
| 30 | `ConcurrencyModule.tsx:633-635` | Bottom panel step log has minimal empty state. | Add styled empty state: "Play or step to see events". |

---

## Category 4: Micro-Interactions (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 31 | `ComponentPalette.tsx:45-67` | Drag start has no visual feedback. The card doesn't change opacity or show a drag ghost. | Add `opacity-50` on drag, create custom drag preview with `setDragImage`. |
| 32 | `DesignCanvas.tsx` | Drop on canvas has no visual feedback (no flash, no animation). Node just appears. | Add `motion.div` entry animation (scale from 0.8, fade in). |
| 33 | `PropertiesPanel.tsx:31-45` | Boolean toggle has no spring animation. Feels mechanical. | Use `motion.div` with `spring` transition for toggle thumb. |
| 34 | `BottomPanel.tsx:156-173` | Tab switching is instant. No underline slide animation. | Add `motion.div` layoutId underline that slides between tabs. |
| 35 | `workspace-layout.tsx:20-41` | Resize handle has hover color but no resize cursor. | Add `cursor-col-resize` / `cursor-row-resize` on hover. |
| 36 | `AlgorithmModule.tsx` | Array bars have no transition animation when values change. They just snap. | Add CSS transition on height: `transition-all duration-200`. |
| 37 | `DistributedModule.tsx:159-168` | Raft node circles have no transition on role change (follower -> candidate -> leader). | Add SVG transition on fill/stroke with 300ms ease. |
| 38 | `InterviewModule.tsx:193-199` | Timer progress bar has `transition-all` but no eased animation on timer tick. | Add smooth width transition synced to 1s interval. |
| 39 | All sidebar buttons | Active state snaps on/off. No smooth background-color transition. | All buttons already have `transition-colors` but missing `duration-150`. Verify. |
| 40 | `DesignCanvas.tsx` | Connecting edges: no animated dotted line during connection drag. | Use React Flow's `connectionLineStyle` with animated dashes. |

---

## Category 5: Toast / Notification System (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 41 | Global | **No toast/notification system exists at all.** | Install `sonner` or build with `motion`. Add `<Toaster>` to layout. |
| 42 | `DesignCanvas.tsx:78-107` | Successful node drop should show toast: "Added {label} to canvas". | Call `toast.success()` after `addNode()`. |
| 43 | `DesignCanvas.tsx:41-55` | Successful edge connection -- no feedback. | Toast: "Connected {source} to {target}". |
| 44 | Export actions (command-palette) | Export to clipboard, JSON, Mermaid -- no success feedback. | Toast: "Copied to clipboard" / "Downloaded {filename}". |
| 45 | `DistributedModule.tsx:612` | Crash node -- no notification beyond visual change. | Toast (destructive): "Node {id} crashed". |
| 46 | `DistributedModule.tsx:616-618` | Submit command -- no feedback that command was queued. | Toast: "Command submitted to leader". |
| 47 | `PropertiesPanel.tsx:99-108` | Config changes are silent. No save confirmation. | Debounced toast: "Configuration updated". |
| 48 | `InterviewModule.tsx` | Timer reaching limit -- no notification. Timer goes overtime silently. | Toast (warning): "Time's up! You've exceeded the time limit." |
| 49 | Error states | When errors are caught (items 1-10), the user currently sees nothing. | All catch blocks should trigger `toast.error()`. |
| 50 | Network errors | Future API calls have no error notification infrastructure. | Add global fetch wrapper with automatic toast on failure. |

---

## Category 6: Confirmation Dialogs (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 51 | Canvas | **Deleting a node (Delete key) has no confirmation.** Accidental deletes lose work. | Add `<AlertDialog>` for node deletion when node has connections. |
| 52 | Canvas | **Deleting an edge** -- no confirmation. | At minimum, show undo toast: "Edge deleted. [Undo]". |
| 53 | `DistributedModule.tsx:591-599` | "Reset" button instantly resets the Raft simulation. No "Are you sure?" | Add confirmation for reset when events.length > 20. |
| 54 | `DistributedModule.tsx:602-614` | "Crash Node" is destructive. No confirmation. | Add "Crash Node {id}?" dialog with impact description. |
| 55 | `AlgorithmModule.tsx:388-396` | `handleReset` clears all state immediately. | Add confirmation: "This will clear your current array and progress." |
| 56 | Canvas clear | No "Clear canvas" action exists yet. When added, needs confirmation. | Pre-plan the dialog: "Remove all {n} nodes and {m} edges?" |
| 57 | Module switch | Switching modules discards canvas state silently. | Add "Unsaved changes" dialog when switching from system-design with nodes on canvas. |
| 58 | `OSModule.tsx:495-505` | Removing a process has no confirmation. | When schedResult exists, warn: "This will clear your results." |
| 59 | Browser navigation | No `beforeunload` handler. Closing tab loses all work. | Add `window.addEventListener('beforeunload', ...)`. |
| 60 | `InterviewModule.tsx:367-371` | "Back" from challenge clears timer. No warning if timer is running. | Dialog: "Timer is still running. Leave challenge?" |

---

## Category 7: Keyboard Navigation Gaps (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 61 | `ComponentPalette.tsx:45-67` | Palette items are `<div draggable>`, **not focusable**. No keyboard drag-and-drop. | Add `tabIndex={0}`, `onKeyDown` for Enter (add to canvas center), arrow keys for navigation. |
| 62 | `PropertiesPanel.tsx` | Config fields are focusable but **no tab order** is defined. Tab order follows DOM but may jump unexpectedly. | Add `tabIndex` ordering and section skip shortcuts. |
| 63 | `BottomPanel.tsx:156-173` | Tabs are `<button>` (good) but no **arrow key navigation** between tabs. | Add `role="tablist"`, `role="tab"`, arrow key handler per WAI-ARIA tabs pattern. |
| 64 | `DesignCanvas.tsx` | React Flow has built-in keyboard shortcuts but they're not documented anywhere. | Add shortcuts overlay (? key) listing all canvas shortcuts. |
| 65 | `workspace-layout.tsx` | Panel resize handles have no keyboard support. Cannot resize with arrow keys. | Add `onKeyDown` to resize handles for Shift+Arrow resizing. |
| 66 | All modules | Sidebar lists have no arrow-key navigation. Each item is a separate button. | Add roving tabindex pattern to sidebar button lists. |
| 67 | `DistributedModule.tsx:661-721` | Control buttons (Step, Play, Reset, Crash) have no shortcut keys. | Add Space=play/pause, Right=step, R=reset shortcuts. |
| 68 | Global | **No visible focus indicators** beyond browser default. Dark theme makes default focus ring invisible. | Add `focus-visible:ring-2 focus-visible:ring-primary` to all interactive elements. |
| 69 | `InterviewModule.tsx` | Challenge checklist items are not toggleable with keyboard. They're plain `<li>` elements. | Replace with `<input type="checkbox">` or `role="checkbox"` with Space toggle. |
| 70 | Modal/Dialog | Command palette exists but no focus trap. Focus can escape to background elements. | Use Radix `<Dialog>` focus trap or `cmdk` built-in trap (verify). |

---

## Category 8: Responsive Design (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 71 | `workspace-layout.tsx:69` | `h-screen w-screen` fixed viewport. **No scroll on overflow.** On narrow screens, content clips. | Add `min-w-[768px]` with horizontal scroll, or responsive breakpoint. |
| 72 | `workspace-layout.tsx:88-91` | Sidebar `minSize="180px"` hard-coded. At < 1024px, sidebar + canvas + properties won't fit. | Auto-collapse sidebar below 1024px. |
| 73 | `workspace-layout.tsx:139-142` | Properties panel `minSize="200px"`. Combined with sidebar = 380px minimum for panels alone. | Auto-close properties panel on < 1280px. |
| 74 | `DesignCanvas.tsx` | React Flow MiniMap is always visible. On small screens it overlaps content. | Hide MiniMap below 768px viewport width. |
| 75 | `ComponentPalette.tsx` | Palette items have `truncate` on text. On narrow sidebar, descriptions are unreadable. | Add tooltip on hover for truncated text. |
| 76 | `OSModule.tsx:545` | Process inputs use `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Good responsive grid. But parent panel may be narrower than `lg`. | Use container queries instead of viewport queries. |
| 77 | `ConcurrencyModule.tsx:82-83` | Race condition viz uses `flex gap-6`. On narrow canvas, columns squish. | Stack vertically below 640px canvas width. |
| 78 | `DistributedModule.tsx:252` | ConsistentHash SVG `viewBox="0 0 500 440"`. Load distribution sidebar is `w-48` fixed. | Make sidebar responsive with `flex-wrap`. |
| 79 | `NetworkingModule.tsx:87-89` | Sequence diagram `colWidth = 200`. With 6 columns (DNS), needs 1200px. Overflows. | Add horizontal scroll or compress columns. |
| 80 | Activity bar | Activity bar width is fixed. On mobile, it takes too much horizontal space. | Convert to bottom tab bar on mobile viewports. |

---

## Category 9: Auto-Save and Persistence (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 81 | `canvas-store` | **Canvas state (nodes, edges) is NOT persisted.** Refresh = total loss. | Add IndexedDB persistence via Dexie (already in package.json). |
| 82 | `ui-store` | Panel open/closed states reset on refresh. | Persist to `localStorage`: `sidebarOpen`, `propertiesPanelOpen`, `bottomPanelOpen`. |
| 83 | `viewport-store` | Zoom/pan position resets on refresh. | Persist viewport to `localStorage`. |
| 84 | `AlgorithmModule.tsx` | Algorithm state (selected algo, array, step) is component state. Lost on module switch. | Hoist to Zustand store with persistence. |
| 85 | `DistributedModule.tsx` | Raft/hash ring state is component state. Lost on module switch. | Hoist to Zustand store or use module state isolation pattern. |
| 86 | `InterviewModule.tsx` | Timer seconds, active challenge, running state -- all lost on module switch. | Persist timer state. Warn on module switch if timer is running. |
| 87 | `OSModule.tsx` | Process list, scheduling results -- lost on module switch. | Hoist to store. |
| 88 | Global | **No `beforeunload` handler.** Users can close the tab without warning. | Add `window.addEventListener('beforeunload', handler)` when canvas has nodes. |
| 89 | Global | **No auto-save interval.** Even with persistence, explicit save is needed. | Add 5-second debounced auto-save to IndexedDB. |
| 90 | Global | **No save/load indication.** Users don't know if their work is saved. | Add "Saved" / "Saving..." / "Unsaved changes" indicator in StatusBar. |

---

## Category 10: Onboarding and Help (10 items)

| # | Location | Gap | Fix |
|---|----------|-----|-----|
| 91 | Global | **No first-time user detection.** Every visit is treated the same. | Check `localStorage` for `hasVisited` flag. |
| 92 | Global | **No onboarding tour.** New users have no idea what the app does or how to start. | Add tooltip tour (4-5 steps): Activity bar -> Palette -> Canvas -> Properties -> Bottom panel. |
| 93 | Global | **No keyboard shortcuts dialog.** Users can't discover Cmd+K, Cmd+Z, etc. | Add `?` key shortcut to open shortcuts overlay. |
| 94 | `DesignCanvas.tsx` | **No contextual help.** Right-click shows browser context menu, not app context menu. | Add React Flow context menu with: Add node, Fit view, Copy, Delete, Help. |
| 95 | `ComponentPalette.tsx:133-135` | Footer hint "Drag a component onto the canvas" is too subtle. | Animate on first visit. Add pulsing arrow icon. |
| 96 | Module switching | No explanation of what each module does when switching. | Add brief module description tooltip on Activity bar icons. |
| 97 | `BottomPanel.tsx` | Code and Console tabs show static placeholders. No indication they're planned vs broken. | Add "Coming soon" badges vs "Error loading" distinction. |
| 98 | `PlaceholderModule.tsx` | Placeholder modules show "Coming Soon" -- good. But no way to request priority or get notified. | Add "Notify me" or "Vote for this module" CTA. |
| 99 | Interview module | No tutorial for how the timed challenge flow works. | Add "How it works" expandable section at top of challenge browser. |
| 100 | Global | **No help/support link anywhere in the UI.** | Add help icon in StatusBar linking to docs/Discord/GitHub issues. |

---

## Implementation Priority Matrix

```
                HIGH IMPACT
                    |
    [Critical]      |      [Quick Wins]
    Items: 1,2,     |      Items: 31,34,
    21,41,51,        |      35,68,75,
    81,88,91         |      90,95,96
                    |
  --------- EFFORT -------->
                    |
    [Strategic]     |      [Nice to Have]
    Items: 8,11,    |      Items: 37,38,
    61,71,72,        |      40,56,65,
    84-87,92         |      78,79,98
                    |
                LOW IMPACT
```

## Summary Counts

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Error Handling | 2 | 2 | 5 | 1 |
| Loading States | 1 | 3 | 4 | 2 |
| Empty States | 1 | 4 | 4 | 1 |
| Micro-Interactions | 0 | 3 | 5 | 2 |
| Toast/Notification | 1 | 5 | 3 | 1 |
| Confirmation Dialogs | 2 | 4 | 3 | 1 |
| Keyboard Navigation | 1 | 4 | 4 | 1 |
| Responsive Design | 1 | 4 | 4 | 1 |
| Auto-Save/Persistence | 2 | 4 | 3 | 1 |
| Onboarding/Help | 2 | 3 | 4 | 1 |
| **Total** | **13** | **36** | **39** | **12** |
