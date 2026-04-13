# UI/UX Patterns for Developer Tools

> Research from Linear, Vercel, Raycast, VS Code, Figma, Arc Browser.

---

## 1. COMMAND PALETTE (Cmd+K) — #1 Pattern

**Library:** `cmdk` (by Paco Coursey, used by Linear, Vercel)
- Fuzzy matching, grouped results, keyboard navigation
- Recent/frequent items first
- Context-aware (different commands per page)
- Sub-100ms response to keystrokes

## 2. KEYBOARD-FIRST DESIGN

| Pattern | Source |
|---|---|
| j/k up/down, Enter to open, Esc to close | Linear (Gmail/Vim-inspired) |
| `/` to focus search | GitHub |
| `?` for shortcut cheat sheet | GitHub |
| Show shortcuts next to every menu action | Linear |
| Single-key shortcuts when not in text input | VS Code |

## 3. DARK MODE COLOR SCHEME

**Linear palette (gold standard):**
- Background: Near-black with blue tint (#0D0E12)
- Surface: Slightly lighter (#1E2028)
- Borders: Very subtle (#2E3038)
- Text: Not pure white, muted (#E2E4E9)
- Accent: Violet (#8B5CF6) or Blue (#3B82F6)

**Key principles:**
- Never pure black (tinted blacks feel natural, except Vercel)
- Reduce saturation 10-20% vs light mode
- WCAG AA 4.5:1 contrast for text
- Elevation via lightness, not shadows

**Best code themes for inspiration:** Catppuccin, Tokyo Night, One Dark Pro, Rosé Pine

## 4. LAYOUT (VS Code-style)

```
Activity Bar (48px) | Sidebar (240-400px) | Main Canvas | Properties (280-400px)
                    | Bottom Panel (200-400px, collapsible)
                    | Status Bar (24px)
```

**Libraries:**
- `react-resizable-panels` — by Brian Vaughn (ex-React core). Best panel library.
- All panels resizable, collapsible, keyboard-toggleable

**Key:** Persist layout in localStorage. Cmd+B toggles sidebar. Focus mode hides all chrome.

## 5. ANIMATION PATTERNS

- Spring physics for natural movement (not cubic-bezier)
- 200-400ms for UI, 500-800ms for data visualizations
- Stagger 30-50ms between elements
- Skeleton loading, never spinners
- `prefers-reduced-motion` respected always

## 6. COMPONENT SYSTEM

**shadcn/ui + Radix UI + Tailwind CSS**

Key components: Command (cmdk), Dialog, Sheet, Tabs, Context Menu, Dropdown Menu, Tooltip, Data Table, Resizable, Scroll Area, Toggle Group, Collapsible, Accordion

"New York" variant is more compact — suited for developer tools.

## 7. WHAT MAKES USERS LOVE A DEV TOOL

### Speed Above Everything
- Optimistic UI updates (like Linear)
- Sub-50ms keyboard response
- No loading spinners for common operations

### Density Without Clutter
- Progressive disclosure
- Compact by default, comfortable mode optional
- Monospace for data, proportional for UI

### Micro-Interactions
- Satisfying checkbox animations
- Smooth drag with spring physics
- Toast notifications that are helpful
- Beautiful empty states

### Visual Restraint
- ONE accent color
- 4px base grid spacing
- 6-8px border radius
- 5-6 font sizes max
- Lucide icons (standard with shadcn)

### "It Just Works"
- Right-click context menus everywhere
- Click to copy IDs, hashes, URLs
- Deep linking (every view has a URL)
- Undo/redo for all actions
- Inline editing

## 8. INSPIRATION TABLE

| Tool | Steal This |
|---|---|
| **Linear** | Command palette, keyboard shortcuts, animation polish |
| **Vercel** | Monochrome design, deployment visualization |
| **Raycast** | Extension architecture, search UX, density |
| **VS Code** | Extension API, layout system, settings UI |
| **Figma** | Multiplayer cursors, contextual toolbars, infinite canvas |
| **Notion** | Block-based editing, slash commands |
